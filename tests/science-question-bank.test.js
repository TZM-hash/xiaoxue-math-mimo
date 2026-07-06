const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date };
context.globalThis = context;
vm.createContext(context);

["js/science-curriculum-data.js", "js/science-question-bank.js"].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});
vm.runInContext(fs.readFileSync(path.join(root, "js/learning-insights.js"), "utf8"), context, { filename: "js/learning-insights.js" });

const curriculum = context.window.MathCampScienceCurriculumData;
const bank = context.window.MathCampScienceQuestionBank;

assert(curriculum, "科学教材知识库应暴露为 MathCampScienceCurriculumData");
assert.strictEqual(curriculum.curriculumProfile.region, "浙江省杭州市", "科学教材知识库应以杭州地区为口径");
assert(/小学科学/.test(curriculum.curriculumProfile.textbook), "科学教材应标注小学科学主线");
assert(bank, "科学题库应暴露为 MathCampScienceQuestionBank");
assert.strictEqual(JSON.stringify(bank.causes), JSON.stringify(["未标记", "不会做", "概念不清", "观察实验", "证据推理"]), "科学错因应保持 5 类");

for (const grade of [1, 2, 3, 4, 5, 6]) {
  const gradeData = curriculum.grades[grade];
  assert(gradeData, `${grade} 年级应有科学教材知识库`);
  assert(Array.isArray(gradeData.terms) && gradeData.terms.length === 2, `${grade} 年级应包含上下册`);
  assert(gradeData.terms.every((term) => Array.isArray(term.units) && term.units.length >= 2), `${grade} 年级每册应包含多个科学单元`);
  assert(gradeData.terms.flatMap((term) => term.units).every((unit) => unit.title && unit.knowledge?.concepts?.length && unit.knowledge?.inquiry?.length), `${grade} 年级每个科学单元应包含概念和探究能力`);

  const points = bank.points.filter((point) => point.grade === grade);
  assert(points.length >= 8, `${grade} 年级应至少有 8 个科学知识点`);
  assert(points.every((point) => point.subject === "science"), `${grade} 年级科学知识点应声明 subject=science`);
  assert(points.every((point) => point.curriculum && point.curriculum.region === "浙江省杭州市"), `${grade} 年级科学知识点应标注杭州教材线`);
  ["life", "matter", "earth", "engineering", "inquiry"].forEach((topic) => {
    assert(points.some((point) => point.topic === topic), `${grade} 年级应覆盖 ${topic} 科学主题`);
  });
}

assert(bank.pointMap["s1-life-plant-basic"], "一年级植物观察知识点应存在");
assert(bank.pointMap["s6-earth-solar-system"], "六年级太阳系知识点应存在");

vm.runInContext(fs.readFileSync(path.join(root, "js/question-spec-utils.js"), "utf8"), context, { filename: "js/question-spec-utils.js" });
assert(context.window.MathCampQuestionSpec, "选择题规格工具应暴露为 MathCampQuestionSpec");
vm.runInContext(fs.readFileSync(path.join(root, "js/science-question-generator.js"), "utf8"), context, { filename: "js/science-question-generator.js" });
const generator = context.window.MathCampScienceQuestionGenerator;
assert(generator, "科学生成器应暴露为 MathCampScienceQuestionGenerator");

function hasChoiceOptions(question) {
  return /\nA\. .+\nB\. .+\nC\. .+\nD\. /s.test(question.text || "");
}

function choiceOptions(question) {
  return [...String(question.text || "").matchAll(/\n([A-D])\. ([^\n]+)/g)].map((match) => ({
    key: match[1],
    text: match[2].trim()
  }));
}

function assertChoiceQuestion(question, message) {
  assert.strictEqual(question.subject, "science", `${message}：科学题应声明 subject=science`);
  assert.strictEqual(question.answerType, "choice", `${message}：带 A/B/C/D 选项的题必须归类为选择题`);
  assert(hasChoiceOptions(question), `${message}：选择题选项应独立换行`);
  assert(/^[A-D]$/.test(String(question.answer || "")), `${message}：选择题答案应使用当前正确选项字母`);
  const selected = choiceOptions(question).find((option) => option.key === question.answer);
  assert(selected, `${message}：答案字母应对应题干中的一个选项`);
  assert.strictEqual(question.answerLabel, `${selected.key}. ${selected.text}`, `${message}：答案标签应跟随洗牌后的正确选项`);
  assert(question.acceptedAnswers?.includes(question.answer), `${message}：选择题应接受选项字母作答`);
  assert(question.acceptedAnswers?.includes(selected.text), `${message}：选择题应接受正确选项文本作答`);
  assert(question.explanation && Array.isArray(question.steps) && question.steps.length >= 2, `${message}：应有解析和步骤`);
}

function assertChoiceShuffleUsesAnswerLetter(point, message) {
  const question = generator.makeQuestion({
    uid: () => `sq-${point.id}-shuffle`,
    pick: (items) => items[0],
    shuffleOptions: (items) => {
      const copy = [...items];
      if (copy.length > 1) [copy[0], copy[1]] = [copy[1], copy[0]];
      return copy;
    }
  }, point, {});
  assertChoiceQuestion(question, message);
  assert.notStrictEqual(question.answer, "A", `${message}：正确答案不能在选项洗牌后仍固定为 A`);
}

function assertInputQuestion(question, message) {
  assert.strictEqual(question.subject, "science", `${message}：科学题应声明 subject=science`);
  assert.strictEqual(question.answerType, "text", `${message}：直接输入题应使用 text`);
  assert(!hasChoiceOptions(question), `${message}：直接输入题不应包含 A/B/C/D 选项`);
  assert(question.answer && /^[\u4e00-\u9fa5A-Za-z0-9（）()·-]+$/.test(String(question.answer)), `${message}：直接输入题答案应是明确概念或数据`);
  assert(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.includes(question.answer), `${message}：直接输入题应提供可判分答案`);
  const visiblePrompt = String(question.text || "").replace(/[（(]\s*[）)]|_{2,}/g, "（ ）");
  assert(!visiblePrompt.includes(String(question.answer || "")), `${message}：直接输入题不能把标准答案直接写在题干里`);
  assert(!/开放|自由回答|说说你的想法|任选/.test(question.text), `${message}：科学题不能是开放主观题`);
}

function assertExamLikeQuestion(question, message) {
  assert(!/知识点规则|训练目标|最能体现这个知识点|随便|乱选|只凭感觉/.test(question.text), `${message}：科学题干应采用试卷式问法`);
  assert(/观察|实验|现象|证据|选择|判断|填入|哪一|哪个|什么|比较|记录/.test(question.text), `${message}：科学题干应有明确的科学作答动作`);
}

assertChoiceShuffleUsesAnswerLetter(bank.pointMap["s1-life-plant-basic"], "科学选择题洗牌");

bank.points.forEach((point) => {
  const choice = generator.makeQuestion({ uid: () => `sq-${point.id}-choice`, pick: (items) => items[0] }, point, {});
  assert.strictEqual(choice.pointId, point.id, `${point.id} 应保留知识点 id`);
  assert.strictEqual(choice.topic, point.topic, `${point.id} 应保留主题`);
  assertChoiceQuestion(choice, `${point.id} 默认题`);
  assertExamLikeQuestion(choice, `${point.id} 默认题`);

  const input = generator.makeQuestion({ uid: () => `sq-${point.id}-input`, pick: (items) => items[1] }, point, {});
  assertInputQuestion(input, `${point.id} 输入变式`);
  assertExamLikeQuestion(input, `${point.id} 输入变式`);
});

const types = new Set();
bank.points.forEach((point) => {
  for (let index = 0; index < 6; index += 1) {
    const question = generator.makeQuestion({ uid: () => `sq-${point.id}-type-${index}`, pick: (items) => items[index % items.length] }, point, {});
    types.add(question.questionType);
  }
});
["现象判断", "实验设计", "证据推理", "概念填空"].forEach((type) => {
  assert(types.has(type), `科学题库应覆盖“${type}”题型`);
});

const insights = context.window.MathCampLearningInsights;
assert.strictEqual(insights.diagnoseCause({ text: "没有看实验现象" }, bank.pointMap["s3-inquiry-fair-test"]), "观察实验", "科学实验题应归因到观察实验");
assert.strictEqual(insights.diagnoseCause({ text: "证据不能支持结论" }, bank.pointMap["s5-matter-dissolve"]), "证据推理", "科学证据题应归因到证据推理");
assert.strictEqual(insights.diagnoseCause({ text: "概念混淆" }, bank.pointMap["s4-earth-rock-soil"]), "概念不清", "科学概念题应归因到概念不清");

console.log("Science question bank tests passed.");
