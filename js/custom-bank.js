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
    banks = banks.filter((bank) => bank.id !== id);
    if (banks.length === before) return false;
    const ok = writeStore(banks);
    mergeIntoExternalSeeds();
    return ok;
  }

  function allQuestions() {
    return banks.flatMap((bank) => (Array.isArray(bank.questions) ? bank.questions : []));
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
  function toPracticeQuestion(question, deps) {
    const spec = window.MathCampQuestionSpec;
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
      custom: true
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
      text: question.text,
      answer: question.answer,
      acceptedAnswers: question.acceptedAnswers && question.acceptedAnswers.length
        ? question.acceptedAnswers
        : [String(question.answer || "")]
    };
  }

  function practiceQuestionsForBank(id, deps) {
    const bank = getBank(id);
    if (!bank) return [];
    return (bank.questions || []).map((question) => toPracticeQuestion(question, deps));
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
    exportAll() {
      return JSON.parse(JSON.stringify(banks));
    },
    replaceAll(list) {
      banks = Array.isArray(list) ? list.filter((b) => b && Array.isArray(b.questions)) : [];
      writeStore(banks);
      mergeIntoExternalSeeds();
      return banks.length;
    },
    _reload() { banks = readStore(); return banks; }
  };
})();
