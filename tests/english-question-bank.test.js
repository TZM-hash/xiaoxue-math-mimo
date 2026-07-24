const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date };
context.globalThis = context;
vm.createContext(context);

["js/english-curriculum-data.js", "js/english-question-bank.js"].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});
vm.runInContext(fs.readFileSync(path.join(root, "js/learning-insights.js"), "utf8"), context, { filename: "js/learning-insights.js" });

const curriculum = context.window.MathCampEnglishCurriculumData;
const bank = context.window.MathCampEnglishQuestionBank;

assert(curriculum, "英语教材知识库应暴露为 MathCampEnglishCurriculumData");
assert.strictEqual(curriculum.curriculumProfile.region, "浙江省杭州市", "英语教材知识库应以杭州地区为口径");
assert(/PEP|人教/i.test(curriculum.curriculumProfile.textbook), "英语教材应标注人教 PEP 主线");
assert(bank, "英语题库应暴露为 MathCampEnglishQuestionBank");
assert.strictEqual(JSON.stringify(bank.causes), JSON.stringify(["不会做", "单词不熟", "句型语法", "阅读定位"]), "英语错因应保持 4 个学科选项");

for (const grade of [3, 4, 5, 6]) {
  const gradeData = curriculum.grades[grade];
  assert(gradeData, `${grade} 年级应有英语教材知识库`);
  assert(Array.isArray(gradeData.terms) && gradeData.terms.length === 2, `${grade} 年级应包含上下册`);
  assert(gradeData.terms.every((term) => Array.isArray(term.units) && term.units.length >= 4), `${grade} 年级每册应包含多个 PEP 单元`);
  assert(gradeData.terms.flatMap((term) => term.units).every((unit) => unit.title && unit.knowledge?.words?.length && unit.knowledge?.patterns?.length), `${grade} 年级每个单元应包含词汇和句型知识`);

  const points = bank.points.filter((point) => point.grade === grade);
  assert(points.length >= 10, `${grade} 年级应至少有 10 个英语知识点`);
  assert(points.every((point) => point.subject === "english"), `${grade} 年级英语知识点应声明 subject=english`);
  assert(points.every((point) => point.curriculum && point.curriculum.region === "浙江省杭州市"), `${grade} 年级知识点应标注杭州教材线`);
  ["vocabulary", "phonics", "pattern", "grammar", "reading"].forEach((topic) => {
    assert(points.some((point) => point.topic === topic), `${grade} 年级应覆盖 ${topic} 知识点`);
  });
}

assert.strictEqual(bank.points.filter((point) => point.grade <= 2).length, 0, "英语主线先按三年级起点建设，不应给 1-2 年级伪造课内教材点");
assert(bank.pointMap["e3-vocabulary-school"], "三年级校园词汇知识点应存在");
assert(bank.pointMap["e6-grammar-past-tense"], "六年级一般过去时知识点应存在");

vm.runInContext(fs.readFileSync(path.join(root, "js/question-spec-utils.js"), "utf8"), context, { filename: "js/question-spec-utils.js" });
assert(context.window.MathCampQuestionSpec, "选择题规格工具应暴露为 MathCampQuestionSpec");
vm.runInContext(fs.readFileSync(path.join(root, "js/english-question-generator.js"), "utf8"), context, { filename: "js/english-question-generator.js" });
const generator = context.window.MathCampEnglishQuestionGenerator;
assert(generator, "英语生成器应暴露为 MathCampEnglishQuestionGenerator");
for (const grade of [3, 4, 5, 6]) {
  const unitPoints = bank.points.filter((point) => point.grade === grade && point.curriculum.term);
  assert(unitPoints.every((point) => generator.questionTemplateCountForPoint(point) >= 10), `${grade} 年级每个英语单元应至少有 10 个本地模板`);
  const upper = unitPoints.filter((point) => point.curriculum.term.includes("上册")).reduce((total, point) => total + generator.questionTemplateCountForPoint(point), 0);
  const lower = unitPoints.filter((point) => point.curriculum.term.includes("下册")).reduce((total, point) => total + generator.questionTemplateCountForPoint(point), 0);
  assert(Math.abs(upper - lower) <= 2, `${grade} 年级英语上下册本地模板数量应基本对称`);
}

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
  assert.strictEqual(question.subject, "english", `${message}：英语题应声明 subject=english`);
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
    uid: () => `eq-${point.id}-shuffle`,
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
  assert.strictEqual(question.subject, "english", `${message}：英语题应声明 subject=english`);
  assert.strictEqual(question.answerType, "text", `${message}：真正直接输入题才使用 text`);
  assert(!hasChoiceOptions(question), `${message}：直接输入题不应包含 A/B/C/D 选项`);
  assert(!/^[A-D]$/.test(String(question.answer || "")), `${message}：直接输入题答案不应是选项字母`);
  assert(question.answer && /^[A-Za-z.' -]+$/.test(String(question.answer)), `${message}：直接输入题答案应是英文单词或短语`);
  assert(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length >= 1, `${message}：直接输入题应提供可判分答案`);
  assert(question.acceptedAnswers.length <= 2, `${message}：直接输入题只能保留明确等价答案，不能开放多答案`);
  const visiblePrompt = String(question.text || "").replace(/_{2,}|（\s*）|\(\s*\)/g, "");
  assert(!visiblePrompt.toLowerCase().includes(String(question.answer || "").toLowerCase()), `${message}：直接输入题不能把标准答案直接写在题干或材料里`);
  assert(!/课堂常见词|教材常见词|本单元词汇|常见词|根据教材词汇范围/.test(question.text), `${message}：直接输入题中文提示不能泛泛而谈，必须给出可唯一判断的词义或语境`);
  if (question.questionType === "单词拼写" && /中文/.test(question.text)) {
    assert(/中文[：:]\s*[^\n]{1,}/.test(question.text), `${message}：单词拼写题应给出具体中文词义`);
  }
  assert(!/write a sentence|make a sentence|translate freely|作文|造句|开放/.test(question.text), `${message}：直接输入题不能是开放主观题`);
}

function assertExamLikeQuestion(question, message) {
  assert(!/知识点|核心词汇|This unit practises|本单元语境|课堂情境|训练目标|能力线|只凭感觉|随便|乱选/.test(question.text), `${message}：英语题干应采用试卷式问法，不能写成抽象知识点说明`);
  assert(/选出|选择|补全|Read|阅读|判断|填入|听录音|哪一项|Which|Choose|Complete|Look and choose|Read and choose/.test(question.text), `${message}：英语题干应有明确试卷式作答动作`);
}

function assertAudioPromptQuestion(question, message) {
  assert(question.audioPrompt, `${message}：听力题应包含 audioPrompt`);
  assert.strictEqual(question.audioPrompt.type, "tts", `${message}：第一版听力题应使用系统 TTS`);
  assert.strictEqual(question.audioPrompt.lang, "en-US", `${message}：英语听力题应使用英文发音`);
  assert(question.audioPrompt.text && /^[A-Za-z0-9 .,'?!-]+$/.test(question.audioPrompt.text), `${message}：朗读文本应是英文单词、短语或句子`);
  const promptOnly = String(question.text || "").split(/\nA[.．、]\s*/)[0];
  assert(!promptOnly.includes(question.audioPrompt.text), `${message}：题干提示不能直接暴露朗读文本`);
  assert(/听录音|播放录音/.test(question.text), `${message}：题干应提示学生点击播放录音`);
  assert(["choice", "text"].includes(question.answerType), `${message}：听力题仍应保持客观可判分`);
}

assertChoiceShuffleUsesAnswerLetter(bank.pointMap["e3-vocabulary-school"], "英语选择题洗牌");

bank.points.forEach((point) => {
  const choice = generator.makeQuestion({ uid: () => `eq-${point.id}-choice`, pick: (items) => items[0] }, point, {});
  assert.strictEqual(choice.pointId, point.id, `${point.id} 应保留知识点 id`);
  assert.strictEqual(choice.topic, point.topic, `${point.id} 应保留主题`);
  assertChoiceQuestion(choice, `${point.id} 默认题`);
  assertExamLikeQuestion(choice, `${point.id} 默认题`);
  assert(!/随便|乱选|不看|只凭感觉|mechanical|meaningless/.test(choice.text), `${point.id} 不能使用机械凑数选项`);

  const input = generator.makeQuestion({ uid: () => `eq-${point.id}-input`, pick: (items) => items[1] }, point, {});
  assertInputQuestion(input, `${point.id} 输入变式`);
  assertExamLikeQuestion(input, `${point.id} 输入变式`);
});

const choiceTypes = new Set();
const audioTypes = new Set();
bank.points.forEach((point) => {
  for (let index = 0; index < 8; index += 1) {
    const question = generator.makeQuestion({ uid: () => `eq-${point.id}-choice-type-${index}`, pick: (items) => items[index % items.length] }, point, {});
    if (question.answerType === "choice") choiceTypes.add(question.questionType);
    if (question.audioPrompt) {
      audioTypes.add(question.questionType);
      assertAudioPromptQuestion(question, `${point.id} 听力题`);
    }
  }
});
["选出不同类", "单项选择", "补全对话", "阅读理解"].forEach((type) => {
  assert(choiceTypes.has(type), `英语选择题应覆盖试卷常见题型“${type}”`);
});
["听音选词", "听句选答", "听音辨词", "听短文选择"].forEach((type) => {
  assert(audioTypes.has(type), `英语发音题应覆盖“${type}”`);
});

const inputTypes = new Set(bank.points.map((point) => generator.makeQuestion({ uid: () => `eq-${point.id}-type`, pick: (items) => items[1] }, point, {}).questionType));
["单词拼写", "句型填空", "语法填空", "短语填空"].forEach((type) => {
  assert(inputTypes.has(type), `英语直接输入题应覆盖“${type}”`);
});

const insights = context.window.MathCampLearningInsights;
assert.strictEqual(insights.diagnoseCause({ text: "单词拼写错误" }, bank.pointMap["e3-vocabulary-school"]), "单词不熟", "英语词汇题应归因到单词不熟");
assert.strictEqual(insights.diagnoseCause({ text: "过去式没有看 yesterday" }, bank.pointMap["e6-grammar-past-tense"]), "句型语法", "英语语法题应归因到句型语法");
assert.strictEqual(insights.diagnoseCause({ text: "Where 问地点但定位错了" }, bank.pointMap["e6-reading-story"]), "阅读定位", "英语阅读题应归因到阅读定位");

console.log("English question bank tests passed.");
