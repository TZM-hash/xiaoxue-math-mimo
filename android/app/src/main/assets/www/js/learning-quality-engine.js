(function () {
  "use strict";

  const CONFIDENCE = new Set(["sure", "unsure", "guess"]);
  const DIAGNOSTICS = new Set(["reading", "concept", "method", "calculation", "expression", "spelling", "evidence", "uncertain"]);
  const CHAIN = ["scaffold", "sameModel", "transfer", "delayed"];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function normalizeConfidence(value) {
    const normalized = String(value || "").trim();
    return CONFIDENCE.has(normalized) ? normalized : "";
  }

  function normalizeDiagnostic(value) {
    const normalized = String(value || "").trim();
    return DIAGNOSTICS.has(normalized) ? normalized : "uncertain";
  }

  function inferDiagnostic(question = {}, evidence = {}) {
    const subject = String(question.subject || "math");
    const text = [question.topic, question.questionType, question.templateType, question.text, question.explanation, evidence.cause, evidence.answer]
      .map((item) => String(item || "").toLowerCase())
      .join(" ");
    if (subject === "english" && /spell|拼写|字母|phonics|vocabulary|单词|词汇/.test(text)) return "spelling";
    if (subject === "science" && /实验|变量|证据|观察|记录|结论|模型|inquiry|evidence/.test(text)) return "evidence";
    if (subject === "chinese" && /表达|句子|标点|习作|写话|格式|writing|sentence|punctuation/.test(text)) return "expression";
    if (/读题|条件|信息|定位|主要写|题意|word|reading|应用题/.test(text)) return "reading";
    if (/计算|运算|进位|退位|小数点|口算|竖式|calculation|add|subtract|multiply|divide/.test(text)) return "calculation";
    if (/概念|公式|单位|性质|定义|词义|语法|concept|unit|grammar/.test(text)) return "concept";
    if (/方法|步骤|顺序|策略|模型|method|strategy/.test(text)) return "method";
    return "uncertain";
  }

  function isStableEvidence(evidence = {}) {
    return Boolean(evidence.correct)
      && normalizeConfidence(evidence.confidence) !== "guess"
      && clamp(evidence.hintLevel, 0, 3) <= 1;
  }

  function masteryDelta(evidence = {}) {
    if (!evidence.correct) return normalizeConfidence(evidence.confidence) === "sure" ? -12 : -9;
    let delta = 10;
    const confidence = normalizeConfidence(evidence.confidence);
    if (confidence === "sure") delta += 3;
    if (confidence === "unsure") delta -= 2;
    if (confidence === "guess") delta -= 5;
    delta -= clamp(evidence.hintLevel, 0, 3) * 3;
    const elapsed = Math.max(0, Number(evidence.elapsedMs) || 0);
    const expected = Math.max(1, Number(evidence.expectedMs) || 45000);
    if (elapsed && elapsed <= expected * 0.65) delta += 1;
    if (elapsed > expected * 1.8) delta -= 1;
    return Math.max(1, Math.round(delta));
  }

  function normalizeMasteryState(state = {}) {
    const attempts = Math.max(0, Number(state.attempts) || 0);
    const correct = clamp(state.correct, 0, attempts);
    const fallbackScore = attempts ? Math.round(correct / attempts * 70 + clamp(state.level || 1, 1, 5) * 6) : clamp((state.level || 1) * 12, 0, 100);
    return {
      ...state,
      attempts,
      correct,
      level: clamp(state.level || 1, 1, 5),
      streak: Math.max(0, Number(state.streak) || 0),
      score: clamp(Number.isFinite(Number(state.score)) ? state.score : fallbackScore, 0, 100),
      stableCorrect: Math.max(0, Number(state.stableCorrect) || 0),
      diagnostics: state.diagnostics && typeof state.diagnostics === "object" ? { ...state.diagnostics } : {},
      lastPracticedAt: Math.max(0, Number(state.lastPracticedAt) || 0),
      totalElapsedMs: Math.max(0, Number(state.totalElapsedMs) || 0),
      hintCount: Math.max(0, Number(state.hintCount) || 0),
      guessCount: Math.max(0, Number(state.guessCount) || 0),
      firstTryCorrectCount: Math.max(0, Number(state.firstTryCorrectCount) || 0),
      averageElapsedMs: Math.max(0, Number(state.averageElapsedMs) || 0),
      hintRate: clamp(state.hintRate, 0, 1),
      guessRate: clamp(state.guessRate, 0, 1),
      firstTryRate: clamp(state.firstTryRate, 0, 1)
    };
  }

  function updateMasteryState(state = {}, evidence = {}) {
    const next = normalizeMasteryState(state);
    next.attempts += 1;
    if (evidence.correct) next.correct += 1;
    next.totalElapsedMs += Math.max(0, Number(evidence.elapsedMs) || 0);
    if (clamp(evidence.hintLevel, 0, 3) > 0) next.hintCount += 1;
    if (normalizeConfidence(evidence.confidence) === "guess") next.guessCount += 1;
    if (evidence.firstTryCorrect !== false && evidence.correct) next.firstTryCorrectCount += 1;
    next.averageElapsedMs = next.attempts ? Math.round(next.totalElapsedMs / next.attempts) : 0;
    next.hintRate = next.attempts ? next.hintCount / next.attempts : 0;
    next.guessRate = next.attempts ? next.guessCount / next.attempts : 0;
    next.firstTryRate = next.attempts ? next.firstTryCorrectCount / next.attempts : 0;
    next.score = clamp(next.score + masteryDelta(evidence), 0, 100);
    const stable = isStableEvidence(evidence);
    if (stable) {
      next.streak += 1;
      next.stableCorrect += 1;
      if (next.streak >= 3) {
        next.level = clamp(next.level + 1, 1, 5);
        next.streak = 0;
      }
    } else if (!evidence.correct) {
      next.streak = 0;
      next.level = clamp(next.level - 1, 1, 5);
    }
    const diagnostic = normalizeDiagnostic(evidence.diagnostic);
    if (!evidence.correct && diagnostic !== "uncertain") {
      next.diagnostics[diagnostic] = (Number(next.diagnostics[diagnostic]) || 0) + 1;
    }
    next.lastPracticedAt = Date.now();
    return next;
  }

  function estimateDifficulty(question = {}, stats = {}) {
    let score = 2;
    if (["formula", "longText", "selfReview"].includes(question.answerType)) score += 0.7;
    if (String(question.text || "").length > 70) score += 0.5;
    if ((question.steps || []).length >= 3) score += 0.5;
    const attempts = Math.max(0, Number(stats.attempts) || 0);
    if (attempts >= 5) {
      const accuracy = clamp(Number(stats.correct) / attempts, 0, 1);
      score += (0.65 - accuracy) * 2.2;
      score += clamp(stats.hintRate, 0, 1) * 0.8;
      if (Number(stats.averageElapsedMs) > 60000) score += 0.4;
    }
    return Math.round(clamp(score, 1, 5) * 10) / 10;
  }

  function scoreQuestionQuality(question = {}) {
    let score = 100;
    const reasons = [];
    const text = String(question.text || "").trim();
    const explanation = String(question.explanation || "").trim();
    const steps = Array.isArray(question.steps) ? question.steps.filter(Boolean) : [];
    if (text.length < 8) { score -= 25; reasons.push("题干过短"); }
    if (/参考截图|改写题|(?:PDF|DOCX).{0,24}改写|训练目标|随便选/.test(text)) { score -= 35; reasons.push("含制作或占位话术"); }
    if (explanation.length < 12) { score -= 18; reasons.push("解析过短"); }
    if (steps.length < 2) { score -= 12; reasons.push("步骤不足"); }
    if (question.answer === undefined || question.answer === null || String(question.answer).trim() === "") { score -= 30; reasons.push("缺少答案"); }
    if (String(question.answer || "").length > 0 && text.includes(String(question.answer)) && question.answerType !== "choice") { score -= 18; reasons.push("题干可能泄漏答案"); }
    if (question.answerType === "choice") {
      const inlineOptions = [...text.matchAll(/[A-D][\.．、]\s*([^\n]+)/g)].map((match) => match[1].trim());
      if (inlineOptions.length && new Set(inlineOptions).size < 4) { score -= 20; reasons.push("选择项不足或重复"); }
    }
    return { score: Math.round(clamp(score, 0, 100)), reasons };
  }

  function normalizeFamilyText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/小明|小红|小华|小丽|小刚|小军|alice|mike|tom|amy/g, "某人")
      .replace(/\d+(?:\.\d+)?/g, "#")
      .replace(/\s+/g, "")
      .replace(/[，。！？、；：“”‘’（）()]/g, "");
  }

  function questionFamilyKey(question = {}) {
    const source = String(question.text || "");
    const optionMatches = [...source.matchAll(/(?:^|\n)\s*[A-D][\.．、]\s*([^\n]+)/g)];
    let normalized;
    if (optionMatches.length >= 2) {
      const prompt = normalizeFamilyText(source.slice(0, optionMatches[0].index));
      const options = optionMatches.map((match) => normalizeFamilyText(match[1])).sort().join("|");
      normalized = `${prompt}|${options}`;
    } else {
      normalized = normalizeFamilyText(source.replace(/[a-d][\.．、]/gi, ""));
    }
    return `${question.pointId || ""}|${question.questionType || question.templateType || question.answerType || ""}|${normalized}`;
  }

  function targetDifficultyForMastery(mastery = {}) {
    const normalized = normalizeMasteryState(mastery);
    return Math.round(clamp(1 + normalized.score / 25, 1, 5) * 10) / 10;
  }

  function candidatePriority(meta = {}, options = {}) {
    const qualityScore = clamp(meta.qualityScore ?? 100, 0, 100);
    const difficulty = clamp(meta.difficultyScore || 3, 1, 5);
    const target = clamp(options.targetDifficulty || 3, 1, 5);
    const usedFamilies = options.usedFamilyKeys && typeof options.usedFamilyKeys.has === "function" ? options.usedFamilyKeys : new Set();
    const recentFamilies = options.recentFamilyKeys && typeof options.recentFamilyKeys.has === "function" ? options.recentFamilyKeys : new Set();
    let score = qualityScore;
    score -= Math.abs(difficulty - target) * 8;
    if (usedFamilies.has(meta.familyKey)) score -= 28;
    if (recentFamilies.has(meta.familyKey)) score -= 12;
    if (options.preferredFamilyKey) score += meta.familyKey === options.preferredFamilyKey ? 18 : -6;
    if (options.avoidFamilyKey && meta.familyKey === options.avoidFamilyKey) score -= 30;
    if (qualityScore < 60) score -= 35;
    return score;
  }

  function nextChainStage(stage, result = {}) {
    const current = CHAIN.includes(stage) ? stage : "scaffold";
    if (!result.correct) return "scaffold";
    if (!result.stable) return current;
    return CHAIN[Math.min(CHAIN.indexOf(current) + 1, CHAIN.length - 1)];
  }

  function chainDifficultyTarget(stage, target = 3) {
    const base = clamp(target, 1, 5);
    if (stage === "scaffold") return clamp(base - 1.2, 1, 5);
    if (stage === "transfer") return clamp(base + 0.6, 1, 5);
    return base;
  }

  window.MathCampLearningQuality = {
    normalizeConfidence,
    normalizeDiagnostic,
    inferDiagnostic,
    isStableEvidence,
    masteryDelta,
    normalizeMasteryState,
    updateMasteryState,
    estimateDifficulty,
    scoreQuestionQuality,
    questionFamilyKey,
    targetDifficultyForMastery,
    candidatePriority,
    nextChainStage,
    chainDifficultyTarget
  };
})();
