const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = vm.createContext({ window: {}, console });
const source = fs.readFileSync(path.join(root, "js/learning-quality-engine.js"), "utf8");
vm.runInContext(source, context, { filename: "js/learning-quality-engine.js" });

const quality = context.window.MathCampLearningQuality;
assert(quality, "learning quality engine should be exposed");

assert.strictEqual(quality.normalizeConfidence("guess"), "guess");
assert.strictEqual(quality.normalizeConfidence("invalid"), "");

assert.strictEqual(quality.inferDiagnostic({ subject: "math", topic: "word", text: "应用题条件关系" }, { answer: "" }), "reading");
assert.strictEqual(quality.inferDiagnostic({ subject: "english", topic: "vocabulary", text: "spell the word" }, { answer: "pensil" }), "spelling");
assert.strictEqual(quality.inferDiagnostic({ subject: "science", topic: "inquiry", text: "实验变量和证据" }, {}), "evidence");

const stableDelta = quality.masteryDelta({ correct: true, confidence: "sure", hintLevel: 0, elapsedMs: 20000, expectedMs: 45000 });
const guessedDelta = quality.masteryDelta({ correct: true, confidence: "guess", hintLevel: 0, elapsedMs: 20000, expectedMs: 45000 });
const hintedDelta = quality.masteryDelta({ correct: true, confidence: "sure", hintLevel: 3, elapsedMs: 20000, expectedMs: 45000 });
assert(stableDelta > guessedDelta, "sure unassisted success should add more mastery than a guess");
assert(guessedDelta > hintedDelta, "a guessed success should add more mastery than a level-three hinted success");
assert(quality.masteryDelta({ correct: false, confidence: "sure", hintLevel: 0 }) < 0, "wrong answers should reduce mastery");

const updated = quality.updateMasteryState({ attempts: 4, correct: 3, level: 2, streak: 1, score: 58, stableCorrect: 1 }, {
  correct: true,
  confidence: "sure",
  hintLevel: 0,
  diagnostic: "method",
  elapsedMs: 18000,
  expectedMs: 45000
});
assert.strictEqual(updated.attempts, 5);
assert.strictEqual(updated.correct, 4);
assert(updated.score > 58);
assert.strictEqual(updated.stableCorrect, 2);
assert(updated.averageElapsedMs > 0, "mastery should accumulate average response time");
assert.strictEqual(updated.hintRate, 0, "unassisted answers should keep hint rate at zero");
assert.strictEqual(updated.guessRate, 0, "sure answers should keep guess rate at zero");
assert(updated.firstTryRate > 0, "first-try success rate should be tracked");

assert(quality.estimateDifficulty({ answerType: "choice", text: "2 + 3 = ?", steps: ["计算"] }, { attempts: 10, correct: 9, averageElapsedMs: 10000 }) < 3);
assert(quality.estimateDifficulty({ answerType: "formula", text: "阅读较长材料后列出三步综合算式并说明数量关系", steps: ["读题", "列式", "验算"] }, { attempts: 10, correct: 3, hintRate: 0.6 }) > 3);

const goodQuality = quality.scoreQuestionQuality({
  text: "小明有 12 本书，又买了 8 本，现在有多少本？",
  answer: 20,
  answerType: "number",
  explanation: "把原有和新买的数量相加，12 + 8 = 20。",
  steps: ["找到两个数量。", "用加法计算。"]
});
const badQuality = quality.scoreQuestionQuality({
  text: "参考截图改写题：随便选一个。",
  answer: "A",
  answerType: "choice",
  explanation: "选 A。",
  steps: []
});
assert(goodQuality.score >= 70, "clear questions should pass the normal quality gate");
assert(badQuality.score < 60, "production wording and weak explanations should fail the quality gate");

const familyA = quality.questionFamilyKey({ pointId: "g3-word", questionType: "应用题", text: "小明有 12 本书，又买 8 本，一共有多少本？" });
const familyB = quality.questionFamilyKey({ pointId: "g3-word", questionType: "应用题", text: "小红有 25 本书，又买 6 本，一共有多少本？" });
assert.strictEqual(familyA, familyB, "number and name changes should remain in the same semantic family");
const choiceFamilyA = quality.questionFamilyKey({ pointId: "c3-reading", questionType: "阅读理解", text: "这段主要写什么？\nA. 公园真美\nB. 天气很冷\nC. 教室安静\nD. 小明买书" });
const choiceFamilyB = quality.questionFamilyKey({ pointId: "c3-reading", questionType: "阅读理解", text: "这段主要写什么？\nA. 小明买书\nB. 教室安静\nC. 公园真美\nD. 天气很冷" });
assert.strictEqual(choiceFamilyA, choiceFamilyB, "choice option order should not create a new semantic family");

const freshCandidateScore = quality.candidatePriority({ qualityScore: 88, difficultyScore: 3, familyKey: "fresh" }, { targetDifficulty: 3, usedFamilyKeys: new Set(["used"]) });
const repeatedCandidateScore = quality.candidatePriority({ qualityScore: 88, difficultyScore: 3, familyKey: "used" }, { targetDifficulty: 3, usedFamilyKeys: new Set(["used"]) });
const poorCandidateScore = quality.candidatePriority({ qualityScore: 48, difficultyScore: 3, familyKey: "fresh" }, { targetDifficulty: 3, usedFamilyKeys: new Set() });
assert(freshCandidateScore > repeatedCandidateScore, "unused semantic families should be preferred");
assert(repeatedCandidateScore > poorCandidateScore, "low-quality candidates should receive the strongest penalty");
const preferredFamilyScore = quality.candidatePriority({ qualityScore: 88, difficultyScore: 3, familyKey: "same" }, { targetDifficulty: 3, preferredFamilyKey: "same" });
const otherFamilyScore = quality.candidatePriority({ qualityScore: 88, difficultyScore: 3, familyKey: "other" }, { targetDifficulty: 3, preferredFamilyKey: "same" });
const avoidedFamilyScore = quality.candidatePriority({ qualityScore: 88, difficultyScore: 3, familyKey: "same" }, { targetDifficulty: 3, avoidFamilyKey: "same" });
assert(preferredFamilyScore > otherFamilyScore, "same-model review should prefer the original semantic family");
assert(otherFamilyScore > avoidedFamilyScore, "transfer review should avoid the original semantic family");

assert.strictEqual(quality.nextChainStage("scaffold", { correct: true, stable: true }), "sameModel");
assert.strictEqual(quality.nextChainStage("sameModel", { correct: true, stable: true }), "transfer");
assert.strictEqual(quality.nextChainStage("transfer", { correct: true, stable: true }), "delayed");
assert.strictEqual(quality.nextChainStage("transfer", { correct: false, stable: false }), "scaffold");
assert.strictEqual(quality.nextChainStage("sameModel", { correct: true, stable: false }), "sameModel");
assert(quality.chainDifficultyTarget("scaffold", 3.5) < quality.chainDifficultyTarget("sameModel", 3.5));
assert(quality.chainDifficultyTarget("transfer", 3.5) > quality.chainDifficultyTarget("sameModel", 3.5));

console.log("Learning quality engine tests passed.");
