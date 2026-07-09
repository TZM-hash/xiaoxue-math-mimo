(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 校内自定义题库：按批次（一次导入=一张试卷/一本练习册）管理。
  // 仅本机 localStorage 存储，随完整存档导出备份，不进云同步。
  // ------------------------------------------------------------------

  const STORE_KEY = "mathcamp-custom-banks-v1";

  function readStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch (_) {
      return [];
    }
  }

  function writeStore(banks) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(banks));
      return true;
    } catch (_) {
      return false;
    }
  }

  let banks = readStore();

  function nowIso() {
    // 沙箱里 new Date() 可能被禁用；用可用则用，否则空串。
    try { return new Date().toISOString(); } catch (_) { return ""; }
  }

  function uid() {
    const rand = (typeof Math.random === "function") ? Math.random().toString(36).slice(2, 8) : "xxxxxx";
    return `cb-${banks.length + 1}-${rand}`;
  }

  function listBanks() {
    return banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      importedAt: bank.importedAt || "",
      sourceFormat: bank.sourceFormat || "",
      count: Array.isArray(bank.questions) ? bank.questions.length : 0
    }));
  }

  function getBank(id) {
    return banks.find((bank) => bank.id === id) || null;
  }

  function addBank(payload) {
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    const bank = {
      id: uid(),
      name: String(payload?.name || "校内题库").trim() || "校内题库",
      importedAt: nowIso(),
      sourceFormat: payload?.sourceFormat || "",
      defaultGrade: payload?.defaultGrade || undefined,
      defaultSubject: payload?.defaultSubject || undefined,
      hasImages: Boolean(payload?.hasImages),
      questions
    };
    banks.push(bank);
    writeStore(banks);
    mergeIntoExternalSeeds();
    return bank;
  }

  function renameBank(id, name) {
    const bank = getBank(id);
    if (!bank) return false;
    bank.name = String(name || "").trim() || bank.name;
    return writeStore(banks);
  }

  function deleteBank(id) {
    const before = banks.length;
    const target = getBank(id);
    banks = banks.filter((bank) => bank.id !== id);
    if (banks.length === before) return false;
    const ok = writeStore(banks);
    mergeIntoExternalSeeds();
    // 清理该批次的图片（异步，忽略结果）
    const Images = window.MathCampBankImages;
    if (target && Images && typeof Images.deleteBankImages === "function") {
      Images.deleteBankImages(id, imageNamesForBank(target));
    }
    delete imageCache[id];
    return ok;
  }

  function allQuestions() {
    return banks.flatMap((bank) => (Array.isArray(bank.questions) ? bank.questions : []));
  }

  // ---- 图片解析缓存：bankId -> { imageName: dataUrl } ----
  const imageCache = {};
  function imageNamesForBank(bank) {
    return [...new Set((bank.questions || []).map((q) => q.imageName).filter(Boolean))];
  }
  async function resolveBankImages(id) {
    const bank = getBank(id);
    if (!bank) return {};
    const names = imageNamesForBank(bank);
    if (!names.length) { imageCache[id] = {}; return {}; }
    const Images = window.MathCampBankImages;
    if (!Images) { imageCache[id] = {}; return {}; }
    const map = await Images.getBankImages(id, names);
    imageCache[id] = map;
    return map;
  }
  function bankImageUrl(bankId, imageName) {
    return (imageCache[bankId] && imageCache[bankId][imageName]) || "";
  }

  // ---- 把带合法 pointId 的自定义题合并进外部题库，供普通自适应练习抽取 ----
  function validPointId(pointId) {
    const id = String(pointId || "").trim();
    if (!id) return false;
    const registry = window.MathCampSubjects;
    if (registry && typeof registry.subjectBank === "function") {
      for (const subject of registry.SUBJECT_IDS || []) {
        const bank = registry.subjectBank(subject);
        if (bank && (bank.pointMap?.[id] || bank.points?.find?.((p) => p.id === id))) return true;
      }
    }
    return false;
  }

  function mergeIntoExternalSeeds() {
    const external = window.MathCampExternalQuestionSeeds;
    if (!external || typeof external.registerExtraSeeds !== "function") return;
    const byPoint = {};
    allQuestions().forEach((question) => {
      const pointId = String(question.pointId || "").trim();
      if (!validPointId(pointId)) return;
      (byPoint[pointId] = byPoint[pointId] || []).push(question);
    });
    external.registerExtraSeeds("customBank", byPoint);
  }

  // ---- 把存储的题目转成练习可直接渲染的题目（选择题嵌入选项）----
  function toPracticeQuestion(question, deps, bankId) {
    const spec = window.MathCampQuestionSpec;
    const imageUrl = bankId && question.imageName ? bankImageUrl(bankId, question.imageName) : "";
    const sourceImage = imageUrl
      ? { src: imageUrl, alt: question.imageName || "题目图片", cropNote: "" }
      : null;
    const common = {
      id: question.id,
      grade: question.grade,
      subject: question.subject,
      pointId: question.pointId,
      explanation: question.explanation || "",
      steps: Array.isArray(question.steps) ? question.steps : [],
      templateType: question.templateType || "校内题",
      questionType: question.templateType || "校内题",
      sourceMeta: question.sourceMeta || { kind: "custom", name: "校内题库" },
      custom: true,
      ...(sourceImage ? { sourceImage } : {}),
      ...(question.displayOnly ? { displayOnly: true } : {})
    };
    if (question.answerType === "choice" && spec && typeof spec.choiceLayout === "function") {
      const layout = spec.choiceLayout(deps || {}, {
        correct: question.correct,
        wrongs: question.wrongs || []
      });
      return {
        ...common,
        answerType: "choice",
        text: `${question.prompt}\n${layout.optionText}`,
        answer: layout.answer,
        answerLabel: layout.answerLabel,
        acceptedAnswers: layout.acceptedAnswers(question.acceptedAnswers || [])
      };
    }
    if (question.answerType === "judge") {
      return {
        ...common,
        answerType: "judge",
        text: question.text,
        answer: question.answer,
        acceptedAnswers: question.acceptedAnswers || []
      };
    }
    return {
      ...common,
      answerType: "text",
      text: question.text || (sourceImage ? "看图作答" : ""),
      answer: question.answer,
      acceptedAnswers: question.acceptedAnswers && question.acceptedAnswers.length
        ? question.acceptedAnswers
        : (question.answer ? [String(question.answer)] : [])
    };
  }

  function practiceQuestionsForBank(id, deps) {
    const bank = getBank(id);
    if (!bank) return [];
    return (bank.questions || [])
      .filter((question) => !question.displayOnly) // 纯展示题不进作答练习
      .map((question) => toPracticeQuestion(question, deps, id));
  }

  window.MathCampCustomBank = {
    listBanks,
    getBank,
    addBank,
    renameBank,
    deleteBank,
    allQuestions,
    mergeIntoExternalSeeds,
    toPracticeQuestion,
    practiceQuestionsForBank,
    resolveBankImages,
    bankImageUrl,
    imageNamesForBank,
    exportAll() {
      return JSON.parse(JSON.stringify(banks));
    },
    replaceAll(list) {
      banks = Array.isArray(list) ? list.filter((b) => b && Array.isArray(b.questions)) : [];
      writeStore(banks);
      mergeIntoExternalSeeds();
      return banks.length;
    },
    // 存档备份：连同 IndexedDB 里的图片一起导出 { banks, images:{ "bankId::name": dataUrl } }
    async exportAllWithImages() {
      const Images = window.MathCampBankImages;
      const images = {};
      if (Images) {
        for (const bank of banks) {
          if (!bank.hasImages) continue;
          const names = imageNamesForBank(bank);
          const map = await Images.getBankImages(bank.id, names);
          Object.entries(map).forEach(([name, url]) => { images[`${bank.id}::${name}`] = url; });
        }
      }
      return { banks: JSON.parse(JSON.stringify(banks)), images };
    },
    // 从存档恢复：写回 banks 和图片
    async replaceAllWithImages(payload) {
      const list = Array.isArray(payload) ? payload : (payload && payload.banks);
      banks = Array.isArray(list) ? list.filter((b) => b && Array.isArray(b.questions)) : [];
      writeStore(banks);
      const Images = window.MathCampBankImages;
      const images = (payload && payload.images) || {};
      if (Images && images && typeof images === "object") {
        for (const [key, url] of Object.entries(images)) {
          const sep = key.indexOf("::");
          if (sep < 0) continue;
          await Images.putImage(key.slice(0, sep), key.slice(sep + 2), url);
        }
      }
      // 重建图片缓存
      for (const bank of banks) {
        if (bank.hasImages) await resolveBankImages(bank.id);
      }
      mergeIntoExternalSeeds();
      return banks.length;
    },
    _reload() { banks = readStore(); return banks; }
  };
})();
