const assert = require("assert");
const audit = require("../js/question-quality-audit.js");

const result = audit.auditQuestions([
  { id: "good", grade: 3, subject: "math", pointId: "g3-add", answerType: "choice", prompt: "18 + 25 的结果是多少？", correct: "43", wrongs: ["42", "44", "53"], explanation: "个位和十位分别相加。", steps: ["列式", "计算"] },
  { id: "bad", grade: 9, subject: "math", answerType: "choice", prompt: "随便选", correct: "A", wrongs: ["A"], explanation: "", steps: [] }
]);

assert.strictEqual(result.total, 2);
assert.strictEqual(result.canPublish, false);
assert(result.rows[1].issues.some((item) => item.code === "invalid-grade"));
assert(result.rows[1].issues.some((item) => item.code === "duplicate-options"));

const duplicates = audit.auditQuestions([
  { id: "a", grade: 3, subject: "math", pointId: "g3-word", answerType: "text", text: "小明有 12 本书，又买 8 本，一共有多少本？", answer: "20", explanation: "用加法。", steps: ["列式"] },
  { id: "b", grade: 3, subject: "math", pointId: "g3-word", answerType: "text", text: "小红有 20 本书，又买 5 本，一共有多少本？", answer: "25", explanation: "用加法。", steps: ["列式"] }
]);
assert(duplicates.rows.every((row) => row.issues.some((item) => item.code === "duplicate-family")));

console.log("Question quality audit tests passed.");
