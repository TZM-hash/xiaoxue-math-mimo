(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 校内自定义题库：按批次（一次导入=一张试卷/一本练习册）管理。
  // 仅本机 localStorage 存储，随完整存档导出备份，不进云同步。
  // ------------------------------------------------------------------

  const STORE_KEY = "mathcamp-custom-banks-v1";
  const BANK_STATUSES = new Set(["review", "published", "disabled"]);

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

  function normalizeQuestion(question, published, index = 0) {
    const item = question && typeof question === "object" ? { ...question } : {};
    item.id = String(item.id || `custom-q-${index + 1}-${Math.random().toString(36).slice(2, 7)}`);
    item.enabled = item.enabled !== false;
    item.reviewStatus = ["pending", "approved", "rejected"].includes(item.reviewStatus)
      ? item.reviewStatus
      : (published ? "approved" : "pending");
    const difficulty = Number(item.difficultyScore || item.difficulty);
    if (difficulty >= 1 && difficulty <= 5) item.difficultyScore = difficulty;
    return item;
  }

  function normalizeBank(raw, options = {}) {
    const source = raw && typeof raw === "object" ? raw : {};
    const status = BANK_STATUSES.has(source.status) ? source.status : (options.newBank ? "review" : "published");
    return {
      ...source,
      id: String(source.id || `cb-migrated-${Math.random().toString(36).slice(2, 10)}`),
      name: String(source.name || "校内题库").trim() || "校内题库",
      status,
      version: Math.max(1, Number(source.version) || 1),
      importedAt: source.importedAt || nowIso(),
      updatedAt: source.updatedAt || source.importedAt || nowIso(),
      history: Array.isArray(source.history) ? source.history.slice(-30) : [],
      questions: (Array.isArray(source.questions) ? source.questions : []).map((question, index) => normalizeQuestion(question, status === "published", index))
    };
  }

  let banks = readStore().map((bank) => normalizeBank(bank));

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
      count: Array.isArray(bank.questions) ? bank.questions.length : 0,
      enabledCount: (bank.questions || []).filter((question) => question.enabled !== false).length,
      status: bank.status,
      version: bank.version || 1,
      updatedAt: bank.updatedAt || ""
    }));
  }

  function getBank(id) {
    return banks.find((bank) => bank.id === id) || null;
  }

  function addBank(payload) {
    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    const bank = normalizeBank({
      id: uid(),
      name: String(payload?.name || "校内题库").trim() || "校内题库",
      importedAt: nowIso(),
      sourceFormat: payload?.sourceFormat || "",
      defaultGrade: payload?.defaultGrade || undefined,
      defaultSubject: payload?.defaultSubject || undefined,
      hasImages: Boolean(payload?.hasImages),
      status: payload?.status || "review",
      version: 1,
      history: [{ version: 1, action: "import", summary: `导入 ${questions.length} 题，进入待审核`, at: nowIso() }],
      questions
    }, { newBank: true });
    banks.push(bank);
    writeStore(banks);
    mergeIntoExternalSeeds();
    return bank;
  }

  function renameBank(id, name) {
    const bank = getBank(id);
    if (!bank) return false;
    bank.name = String(name || "").trim() || bank.name;
    recordHistory(bank, "rename", "修改批次名称");
    return writeStore(banks);
  }

  function recordHistory(bank, action, summary) {
    if (!bank) return;
    bank.version = Math.max(1, Number(bank.version) || 1) + 1;
    bank.updatedAt = nowIso();
    bank.history = [...(Array.isArray(bank.history) ? bank.history : []), {
      version: bank.version,
      action,
      summary: String(summary || action),
      at: bank.updatedAt
    }].slice(-30);
  }

  function auditBank(id) {
    const bank = getBank(id);
    if (!bank) return null;
    const Audit = window.MathCampQuestionQualityAudit;
    const result = Audit && typeof Audit.auditQuestions === "function"
      ? Audit.auditQuestions(bank.questions || [])
      : { total: (bank.questions || []).length, counts: { high: 0, medium: 0, low: 0, ok: (bank.questions || []).length }, averageScore: 100, canPublish: true, rows: [] };
    (bank.questions || []).forEach((question, index) => {
      if (!question.pointId) return;
      const point = pointForId(question.pointId);
      const row = result.rows[index];
      if (!row) return;
      if (!point) {
        row.issues.push({ severity: "high", code: "invalid-point", message: "知识点 ID 不存在" });
        row.highestSeverity = "high";
      } else if (Number(point.grade) !== Number(question.grade) || point.subject !== question.subject) {
        row.issues.push({ severity: "high", code: "point-mismatch", message: "知识点与题目年级或学科不一致" });
        row.highestSeverity = "high";
      }
    });
    if (result.rows.length) {
      result.counts = { high: 0, medium: 0, low: 0, ok: 0 };
      result.rows.forEach((row) => { result.counts[row.highestSeverity] += 1; });
      result.canPublish = result.counts.high === 0;
    }
    return result;
  }

  function publishBank(id) {
    const bank = getBank(id);
    if (!bank) return { ok: false, reason: "题库不存在" };
    const audit = auditBank(id);
    if (!audit?.canPublish) return { ok: false, reason: `仍有 ${audit?.counts?.high || 0} 道题存在硬规则问题`, audit };
    bank.status = "published";
    bank.questions.forEach((question) => {
      if (question.enabled !== false) question.reviewStatus = "approved";
    });
    recordHistory(bank, "publish", `审核发布 ${bank.questions.filter((question) => question.enabled !== false).length} 题`);
    writeStore(banks);
    mergeIntoExternalSeeds();
    return { ok: true, bank, audit };
  }

  function setBankStatus(id, status) {
    const bank = getBank(id);
    if (!bank || !BANK_STATUSES.has(status) || status === "published") return false;
    bank.status = status;
    recordHistory(bank, status, status === "disabled" ? "停用题库" : "退回待审核");
    writeStore(banks);
    mergeIntoExternalSeeds();
    return true;
  }

  function batchUpdateQuestions(id, questionIds, patch) {
    const bank = getBank(id);
    if (!bank || !patch || typeof patch !== "object") return 0;
    const ids = new Set(Array.isArray(questionIds) ? questionIds.filter(Boolean) : []);
    let changed = 0;
    bank.questions.forEach((question) => {
      if (ids.size && !ids.has(question.id)) return;
      if (patch.grade !== undefined && Number(patch.grade) >= 1 && Number(patch.grade) <= 6) question.grade = Number(patch.grade);
      if (patch.subject !== undefined && ["math", "chinese", "english", "science"].includes(patch.subject)) question.subject = patch.subject;
      if (patch.term !== undefined && ["upper", "lower", "year"].includes(patch.term)) question.term = patch.term;
      if (patch.pointId !== undefined) question.pointId = String(patch.pointId || "").trim() || undefined;
      if (patch.difficultyScore !== undefined && Number(patch.difficultyScore) >= 1 && Number(patch.difficultyScore) <= 5) question.difficultyScore = Number(patch.difficultyScore);
      question.reviewStatus = "pending";
      changed += 1;
    });
    if (!changed) return 0;
    bank.status = "review";
    recordHistory(bank, "batch-update", `批量修改 ${changed} 题并退回审核`);
    writeStore(banks);
    mergeIntoExternalSeeds();
    return changed;
  }

  function setQuestionEnabled(id, questionId, enabled) {
    const bank = getBank(id);
    const question = bank?.questions?.find((item) => item.id === questionId);
    if (!bank || !question) return false;
    question.enabled = Boolean(enabled);
    recordHistory(bank, enabled ? "enable-question" : "disable-question", `${enabled ? "启用" : "停用"}题目 ${questionId}`);
    writeStore(banks);
    mergeIntoExternalSeeds();
    return true;
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
  function pointForId(pointId) {
    const id = String(pointId || "").trim();
    if (!id) return null;
    const registry = window.MathCampSubjects;
    if (registry && typeof registry.subjectBank === "function") {
      for (const subject of registry.SUBJECT_IDS || []) {
        const bank = registry.subjectBank(subject);
        const point = bank && (bank.pointMap?.[id] || bank.points?.find?.((p) => p.id === id));
        if (point) return { ...point, subject: point.subject || subject };
      }
    }
    return null;
  }

  function validPointId(pointId) {
    return Boolean(pointForId(pointId));
  }

  function mergeIntoExternalSeeds() {
    const external = window.MathCampExternalQuestionSeeds;
    if (!external || typeof external.registerExtraSeeds !== "function") return;
    const byPoint = {};
    banks.filter((bank) => bank.status === "published").flatMap((bank) => bank.questions || []).forEach((question) => {
      if (question.enabled === false || question.reviewStatus !== "approved") return;
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
      .filter((question) => question.enabled !== false && !question.displayOnly) // 纯展示题和停用题不进作答练习
      .map((question) => toPracticeQuestion(question, deps, id));
  }

  window.MathCampCustomBank = {
    listBanks,
    getBank,
    addBank,
    renameBank,
    deleteBank,
    auditBank,
    publishBank,
    setBankStatus,
    batchUpdateQuestions,
    setQuestionEnabled,
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
      banks = Array.isArray(list) ? list.filter((b) => b && Array.isArray(b.questions)).map((bank) => normalizeBank(bank)) : [];
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
      banks = Array.isArray(list) ? list.filter((b) => b && Array.isArray(b.questions)).map((bank) => normalizeBank(bank)) : [];
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
