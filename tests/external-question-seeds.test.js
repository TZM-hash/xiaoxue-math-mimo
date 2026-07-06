const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date, Math };
context.globalThis = context;
vm.createContext(context);

[
  "js/question-bank.js",
  "js/chinese-curriculum-data.js",
  "js/chinese-question-bank.js",
  "js/english-curriculum-data.js",
  "js/english-question-bank.js",
  "js/science-curriculum-data.js",
  "js/science-question-bank.js",
  "js/question-spec-utils.js",
  "js/external-question-seeds.js",
  "js/chinese-question-generator.js",
  "js/english-question-generator.js",
  "js/science-question-generator.js",
  "js/question-generator.js"
].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

const seeds = context.window.MathCampExternalQuestionSeeds;
assert(seeds, "扩展题源模块应暴露为 MathCampExternalQuestionSeeds");

const banks = {
  math: context.window.MathCampQuestionBank,
  chinese: context.window.MathCampChineseQuestionBank,
  english: context.window.MathCampEnglishQuestionBank,
  science: context.window.MathCampScienceQuestionBank
};

const expectedPoints = {
  math: [
    "g1-20-add",
    "g2-100-add",
    "g2-table-div",
    "g3-fraction-intro",
    "g4-word",
    "g5-decimal",
    "g5-percent",
    "g6-percent"
  ],
  chinese: [
    "c1-pinyin",
    "c2-punctuation",
    "c3-word-meaning",
    "c3-paragraph-reading",
    "c4-sick-sentence",
    "c5-integrated",
    "c6-reading-strategy",
    "c6-view-summary"
  ],
  english: [
    "e3-vocabulary-school",
    "e3-phonics-short-vowels",
    "e4-pattern-location-time",
    "e4-reading-notice",
    "e5-grammar-there-present",
    "e5-reading-schedule",
    "e6-grammar-past-tense",
    "e6-reading-story"
  ],
  science: [
    "s1-life-plant-basic",
    "s2-matter-water-air",
    "s3-inquiry-fair-test",
    "s4-earth-rock-soil",
    "s5-matter-dissolve",
    "s5-inquiry-data-evidence",
    "s6-earth-solar-system",
    "s6-inquiry-model-reasoning"
  ]
};

const OFFICIAL_OR_REGIONAL_SOURCE = /basic\.smartedu\.cn|pep\.com\.cn|moe\.gov\.cn|jyt\.zj\.gov\.cn|edu\.hangzhou\.gov\.cn|yun\.zjer\.cn|edup\.com\.cn/;
const DOMESTIC_PATTERN_SOURCE = /zxxk\.com|zujuan\.com|jyeoo\.com|21cnjy\.com|aoshu\.com|shijuan1\.com|eol\.cn/;

function subjectOf(point) {
  if (point.subject) return point.subject;
  if (/^c\d-/.test(point.id)) return "chinese";
  if (/^e\d-/.test(point.id)) return "english";
  if (/^s\d-/.test(point.id)) return "science";
  return "math";
}

function depsFor(subject) {
  return {
    activeProfile: () => ({ id: "test-profile" }),
    ensureQuestionMatchesRule: (_point, question) => question,
    makeExtraQuestion: () => null,
    makeSupplementalQuestion: () => null,
    masteryFor: () => ({ level: 2 }),
    pick: (items) => items[0],
    shuffle: (items) => [...items].reverse(),
    state: { adaptive: false },
    makers: {
      addsub: (point) => ({ grade: point.grade, pointId: point.id, topic: point.topic, text: "fallback math", answer: 1 }),
      word: (point) => ({ grade: point.grade, pointId: point.id, topic: point.topic, text: "fallback word", answer: 1 })
    },
    subject
  };
}

function choiceOptions(question) {
  return [...String(question.text || "").matchAll(/\n([A-D])\. ([^\n]+)/g)].map((match) => ({
    key: match[1],
    text: match[2].trim()
  }));
}

function assertQuestionShape(question, point, message) {
  assert(question.id, `${message} 应有稳定 id`);
  assert.strictEqual(question.grade, point.grade, `${message} 年级应匹配知识点`);
  assert.strictEqual(question.pointId, point.id, `${message} 知识点应匹配`);
  assert.strictEqual(question.topic, point.topic, `${message} topic 应匹配`);
  assert(question.text && !question.text.includes("TBD"), `${message} 应有真实题干`);
  assert(["choice", "text"].includes(question.answerType), `${message} 应保持客观可判分`);
  assert(question.answer, `${message} 应有答案`);
  assert(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.includes(question.answer), `${message} 应接受标准答案`);
  assert(question.explanation, `${message} 应有解析`);
  assert(Array.isArray(question.steps) && question.steps.length >= 2, `${message} 应有步骤`);
  assert(question.sourceMeta && question.sourceMeta.url && question.sourceMeta.kind, `${message} 应记录来源元数据`);
  assert(["openResource", "inspiredOriginal"].includes(question.sourceMeta.kind), `${message} 来源类型应可审计`);
  assert.strictEqual(question.enrichment, true, `${message} 应标记为扩展题`);
  if (subjectOf(point) !== "math") assert.strictEqual(question.subject, subjectOf(point), `${message} subject 应匹配`);
}

const sourceKinds = new Set();
const sourceUrls = new Set();
const sourceUrlsBySubject = {
  math: new Set(),
  chinese: new Set(),
  english: new Set(),
  science: new Set()
};
let totalSeedCount = 0;

Object.entries(expectedPoints).forEach(([subject, pointIds]) => {
  pointIds.forEach((pointId) => {
    const point = banks[subject].pointMap[pointId];
    assert(point, `${subject}:${pointId} 应存在于现有题库`);
    const available = seeds.forPoint(point);
    assert(available.length >= 1, `${subject}:${pointId} 应有扩展题源`);
    totalSeedCount += available.length;
    const question = seeds.makeQuestion(depsFor(subject), point, { preferExternal: true });
    assertQuestionShape(question, point, `${subject}:${pointId}`);
    sourceKinds.add(question.sourceMeta.kind);
    sourceUrls.add(question.sourceMeta.url);
    available.forEach((seed) => {
      if (seed.sourceMeta?.url) sourceUrlsBySubject[subject].add(seed.sourceMeta.url);
    });
  });
});

assert(sourceKinds.has("openResource"), "扩展题源应包含公开可用资源题");
assert(sourceKinds.has("inspiredOriginal"), "扩展题源应包含题型参考后的原创改写题");
assert(totalSeedCount >= 32, "扩展题源应覆盖至少 32 道可生成题");
assert([...sourceUrls].some((url) => OFFICIAL_OR_REGIONAL_SOURCE.test(url)), "扩展题源应包含国内官方或教材同步资源参考");
assert([...sourceUrls].some((url) => DOMESTIC_PATTERN_SOURCE.test(url)), "扩展题源应包含国内题库网站题型参考的原创改写题");
Object.entries(sourceUrlsBySubject).forEach(([subject, urls]) => {
  const list = [...urls];
  assert(list.some((url) => OFFICIAL_OR_REGIONAL_SOURCE.test(url)), `${subject} 应包含官方、教材或浙江杭州区域来源参考`);
  assert(list.some((url) => DOMESTIC_PATTERN_SOURCE.test(url)), `${subject} 应包含国内题库网站题型参考`);
});

const shuffled = seeds.makeQuestion({
  ...depsFor("english"),
  shuffle: (items) => {
    const copy = [...items];
    if (copy.length > 1) [copy[0], copy[1]] = [copy[1], copy[0]];
    return copy;
  }
}, banks.english.pointMap["e3-vocabulary-school"], { preferExternal: true });
const selected = choiceOptions(shuffled).find((option) => option.key === shuffled.answer);
assert(selected, "扩展选择题答案字母应对应当前洗牌后的选项");
assert.strictEqual(shuffled.answerLabel, `${selected.key}. ${selected.text}`, "扩展选择题 answerLabel 应跟随洗牌后的正确选项");
assert.notStrictEqual(shuffled.answer, "A", "扩展选择题洗牌后答案不应固定为 A");

const integrated = context.window.MathCampQuestionGenerator.makeQuestion(
  depsFor("science"),
  banks.science.pointMap["s6-earth-solar-system"],
  { preferExternal: true }
);
assert.strictEqual(integrated.enrichment, true, "总题目入口应能按需生成扩展题");
assert.strictEqual(integrated.pointId, "s6-earth-solar-system", "总题目入口生成的扩展题应保持知识点");

console.log("External question seed tests passed.");
