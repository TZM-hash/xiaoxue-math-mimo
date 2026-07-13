(function (root) {
  "use strict";

  function textFor(question = {}) {
    return String(question.text || question.prompt || "").replace(/\s+/g, " ").trim();
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/小明|小红|小华|小丽|小刚|小军|alice|mike|tom|amy/g, "某人")
      .replace(/\d+(?:\.\d+)?/g, "#")
      .replace(/\s+/g, "")
      .replace(/[，。！？、；：“”‘’（）()]/g, "");
  }

  function familyKey(question = {}) {
    const quality = root.MathCampLearningQuality;
    if (quality && typeof quality.questionFamilyKey === "function") return quality.questionFamilyKey(question);
    return `${question.pointId || ""}|${question.templateType || question.answerType || ""}|${normalizeText(textFor(question))}`;
  }

  function issue(severity, code, message) {
    return { severity, code, message };
  }

  function auditQuestion(question = {}, options = {}) {
    const issues = [];
    const text = textFor(question);
    const answerType = String(question.answerType || "text");
    const answer = answerType === "choice" ? (question.correct ?? question.answer) : question.answer;
    if (!text && !question.imageName) issues.push(issue("high", "missing-stem", "缺少题干或题目图片"));
    if (!question.displayOnly && (answer === undefined || answer === null || String(answer).trim() === "")) issues.push(issue("high", "missing-answer", "缺少可判定的答案"));
    if (!question.grade || Number(question.grade) < 1 || Number(question.grade) > 6) issues.push(issue("high", "invalid-grade", "年级必须在 1-6 之间"));
    if (!question.subject || !["math", "chinese", "english", "science"].includes(String(question.subject))) issues.push(issue("medium", "missing-subject", "未标记有效学科"));
    if (!question.pointId) issues.push(issue("medium", "missing-point", "未关联知识点，不会混入智能练习"));
    if (question.term && !["upper", "lower", "year"].includes(String(question.term))) issues.push(issue("medium", "invalid-term", "学期必须为上册、下册或全年综合"));
    if (!String(question.explanation || "").trim()) issues.push(issue("medium", "missing-explanation", "缺少答案解析"));
    if (!Array.isArray(question.steps) || question.steps.filter(Boolean).length < 1) issues.push(issue("low", "missing-steps", "缺少解题步骤"));

    if (answerType === "choice") {
      const wrongs = Array.isArray(question.wrongs) ? question.wrongs.map((item) => String(item).trim()).filter(Boolean) : [];
      const inlineOptions = [...String(question.text || "").matchAll(/(?:^|\n)\s*[A-F][\.．、]\s*([^\n]+)/g)].map((match) => match[1].trim()).filter(Boolean);
      const optionsList = wrongs.length ? [String(question.correct || "").trim(), ...wrongs].filter(Boolean) : inlineOptions;
      if (optionsList.length < 3) issues.push(issue("high", "few-distractors", "选择题至少需要 3 个选项"));
      if (new Set(optionsList).size !== optionsList.length) issues.push(issue("high", "duplicate-options", "选择题选项存在重复"));
    } else if (answerType === "judge") {
      if (!/^(对|错|正确|错误|是|否|true|false)$/i.test(String(answer || "").trim())) issues.push(issue("high", "invalid-judge-answer", "判断题答案必须明确为对或错"));
    }

    const quality = root.MathCampLearningQuality;
    const explicitDifficulty = Number(question.difficultyScore || question.difficulty);
    const difficulty = explicitDifficulty || (quality && typeof quality.estimateDifficulty === "function" ? quality.estimateDifficulty(question, {}) : 0);
    if (difficulty && (difficulty < 1 || difficulty > 5)) issues.push(issue("medium", "invalid-difficulty", "难度必须在 1-5 之间"));
    if (/参考截图|随便选|待补充|todo|占位/i.test(text)) issues.push(issue("high", "production-wording", "题干含制作或占位话术"));

    const scoreResult = quality && typeof quality.scoreQuestionQuality === "function"
      ? quality.scoreQuestionQuality({ ...question, text })
      : { score: Math.max(0, 100 - issues.filter((item) => item.severity === "high").length * 35 - issues.filter((item) => item.severity === "medium").length * 12), reasons: [] };
    if (scoreResult.score < 60 && !issues.some((item) => item.code === "quality-score")) {
      issues.push(issue("medium", "quality-score", `综合质量分偏低（${scoreResult.score}）`));
    }
    return {
      id: question.id || options.index || "",
      text,
      familyKey: familyKey(question),
      score: scoreResult.score,
      difficulty: difficulty || null,
      issues,
      highestSeverity: issues.some((item) => item.severity === "high") ? "high" : issues.some((item) => item.severity === "medium") ? "medium" : issues.length ? "low" : "ok"
    };
  }

  function auditQuestions(questions = [], options = {}) {
    const rows = (Array.isArray(questions) ? questions : []).map((question, index) => auditQuestion(question, { ...options, index: index + 1 }));
    const families = new Map();
    rows.forEach((row, index) => {
      if (!row.familyKey) return;
      const indexes = families.get(row.familyKey) || [];
      indexes.push(index);
      families.set(row.familyKey, indexes);
    });
    families.forEach((indexes) => {
      if (indexes.length < 2) return;
      indexes.forEach((index) => rows[index].issues.push(issue("medium", "duplicate-family", `与本批次另外 ${indexes.length - 1} 题高度相似`)));
    });
    rows.forEach((row) => {
      row.highestSeverity = row.issues.some((item) => item.severity === "high") ? "high" : row.issues.some((item) => item.severity === "medium") ? "medium" : row.issues.length ? "low" : "ok";
    });
    const counts = { high: 0, medium: 0, low: 0, ok: 0 };
    rows.forEach((row) => { counts[row.highestSeverity] += 1; });
    const issueCounts = rows.flatMap((row) => row.issues).reduce((acc, item) => {
      acc[item.code] = (acc[item.code] || 0) + 1;
      return acc;
    }, {});
    return {
      total: rows.length,
      counts,
      issueCounts,
      averageScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : 0,
      canPublish: counts.high === 0,
      rows
    };
  }

  const api = { textFor, familyKey, auditQuestion, auditQuestions };
  root.MathCampQuestionQualityAudit = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
