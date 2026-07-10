(function () {
  "use strict";

  // 纯工具函数：答案解析、格式化、分数/数值处理、题型判断。
  // 这些函数不依赖 app.js 的 state / els，可独立测试与复用。
  // 从 app.js 抽出，行为保持完全一致（只搬不改）。

  function uid(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick(items) {
    return items[rand(0, items.length - 1)];
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function round1(value) {
    return Math.round(value * 10) / 10;
  }
  // 把分数约分成最简形式，返回 { numerator, denominator, label, answer, accepted }。
  // 用于分数题：answer 保留精确小数值，label 用最简分数显示，
  // accepted 汇总所有可判对的写法（最简分数、原始分数、能整除时的精确小数）。
  function simplifyFraction(numerator, denominator) {
    const gcd = (x, y) => (y ? gcd(y, x % y) : Math.abs(x) || 1);
    const divisor = gcd(numerator, denominator);
    const n = numerator / divisor;
    const d = denominator / divisor;
    const label = d === 1 ? String(n) : `${n}/${d}`;
    const raw = `${numerator}/${denominator}`;
    const answer = numerator / denominator;
    const accepted = [label, raw];
    // 仅当小数能有限表示（约分后分母只含 2、5 因子）时，才接受小数写法
    let dd = d;
    while (dd % 2 === 0) dd /= 2;
    while (dd % 5 === 0) dd /= 5;
    if (dd === 1) {
      const dec = String(answer);
      if (!accepted.includes(dec)) accepted.push(dec);
    }
    return { numerator: n, denominator: d, label, raw, answer, accepted: [...new Set(accepted)], terminating: dd === 1 };
  }
  function formatAnswer(value, label) {
    if (label) return label;
    const number = Number(value);
    if (!Number.isFinite(number)) return String(value ?? "");
    return Number.isInteger(number) ? String(number) : number.toFixed(2);
  }
  function formatDecimalText(value) {
    return String(value ?? "").replace(/-?\d+\.\d+/g, (match) => {
      const number = Number(match);
      return Number.isFinite(number) ? number.toFixed(2) : match;
    });
  }
  function normalizeQuestionDisplay(question) {
    if (!question || typeof question !== "object") return question;
    ["text", "answerLabel", "explanation", "templateType"].forEach((key) => {
      if (typeof question[key] === "string") question[key] = formatDecimalText(question[key]);
    });
    if (Array.isArray(question.steps)) question.steps = question.steps.map((step) => typeof step === "string" ? formatDecimalText(step) : step);
    return question;
  }
  function answerValueLabel(value, label = "") {
    return label || formatAnswer(value);
  }
  function normalizeAnswerText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[，,。．]/g, ".")
      .replace(/[：]/g, ":")
      .replace(/[（）()]/g, "")
      .replace(/\s+/g, "")
      .replace(/個/g, "个")
      .replace(/剩余/g, "余")
      .replace(/余数/g, "余");
  }
  function comparableAnswerText(value) {
    return normalizeAnswerText(value)
      .replace(/[.。·，,、\s]/g, "")
      .replace(/[袋辆个元米厘米平方厘米立方厘米小时分钟页克千克角人包本张块%]/g, "");
  }
  function parseNumericAnswer(raw) {
    const text = normalizeAnswerText(raw);
    if (!text) return NaN;
    if (/^-?\d+(?:\.\d+)?%$/.test(text)) return Number(text.slice(0, -1));
    if (/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(text)) {
      const [a, b] = text.split("/").map(Number);
      return b === 0 ? NaN : a / b;
    }
    if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
    const withoutUnits = text.replace(/[袋辆个元米厘米平方厘米立方厘米小时分钟页克千克角人包本张块]/g, "");
    if (/^-?\d+(?:\.\d+)?$/.test(withoutUnits)) return Number(withoutUnits);
    return NaN;
  }
  function answerLabelMatches(raw, question) {
    const label = normalizeAnswerText(question?.answerLabel || "");
    if (!label) return false;
    const text = normalizeAnswerText(raw);
    if (!text) return false;
    if (text === label) return true;
    return comparableAnswerText(text) === comparableAnswerText(label);
  }
  function normalizeTextAnswer(value) {
    return String(value || "")
      .trim()
      .replace(/[，。！？；：“”‘’、,.!?;:"'\s]/g, "")
      .toLowerCase();
  }
  function textAnswerMatches(raw, question) {
    const expected = [question?.answerLabel, question?.answer, ...(question?.acceptedAnswers || [])]
      .map(normalizeTextAnswer)
      .filter(Boolean);
    const actual = normalizeTextAnswer(raw);
    return Boolean(actual && expected.includes(actual));
  }
  function normalizeFormulaAnswer(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[＝]/g, "=")
      .replace(/[×✕x]/g, "*")
      .replace(/[÷]/g, "/")
      .replace(/[，,]/g, "")
      .replace(/[。．]/g, ".")
      .replace(/[（]/g, "(")
      .replace(/[）]/g, ")")
      .replace(/\s+/g, "")
      .replace(/[^0-9.+\-*/=()%:]/g, "");
  }
  function formulaAnswerMatches(raw, question) {
    const actual = normalizeFormulaAnswer(raw);
    if (!actual || !actual.includes("=")) return false;
    const expected = [question?.formulaAnswer, question?.answerLabel, ...(question?.acceptedFormulas || [])]
      .map(normalizeFormulaAnswer)
      .filter((item) => item && item.includes("="));
    return expected.includes(actual);
  }
  function isSelfReviewQuestion(question) {
    return ["longText", "selfReview"].includes(question?.answerType);
  }
  function isChineseQuestion(question) {
    return question?.subject === "chinese" || /^c\d/.test(String(question?.pointId || ""));
  }
  function isEnglishQuestion(question) {
    return question?.subject === "english" || /^e\d/.test(String(question?.pointId || ""));
  }
  function isScienceQuestion(question) {
    return question?.subject === "science" || /^s\d/.test(String(question?.pointId || ""));
  }
  function isLanguageQuestion(question) {
    return isChineseQuestion(question) || isEnglishQuestion(question);
  }
  function isNonMathQuestion(question) {
    return isLanguageQuestion(question) || isScienceQuestion(question);
  }

  window.MathCampUtils = {
    uid,
    rand,
    pick,
    clamp,
    round1,
    simplifyFraction,
    formatAnswer,
    formatDecimalText,
    normalizeQuestionDisplay,
    answerValueLabel,
    normalizeAnswerText,
    comparableAnswerText,
    parseNumericAnswer,
    answerLabelMatches,
    normalizeTextAnswer,
    textAnswerMatches,
    normalizeFormulaAnswer,
    formulaAnswerMatches,
    isSelfReviewQuestion,
    isChineseQuestion,
    isEnglishQuestion,
    isScienceQuestion,
    isLanguageQuestion,
    isNonMathQuestion
  };
})();
