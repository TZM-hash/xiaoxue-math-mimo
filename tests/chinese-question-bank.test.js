const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date };
context.globalThis = context;
vm.createContext(context);

["js/chinese-curriculum-data.js", "js/chinese-question-bank.js"].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});
vm.runInContext(fs.readFileSync(path.join(root, "js/learning-insights.js"), "utf8"), context, { filename: "js/learning-insights.js" });

const bank = context.window.MathCampChineseQuestionBank;
const curriculum = context.window.MathCampChineseCurriculumData;
assert(curriculum, "语文教材知识库应暴露为 MathCampChineseCurriculumData");
assert.strictEqual(curriculum.curriculumProfile.region, "浙江省杭州市", "语文教材知识库应以杭州地区为口径");
assert(curriculum.curriculumProfile.textbook.includes("统编版"), "语文教材知识库应标注统编版");
assert(curriculum.curriculumProfile.publisher.includes("人民教育出版社"), "语文教材知识库应标注人民教育出版社出版");
assert(curriculum.sourceLabels.inTextbook === "课内教材", "题源标签应包含课内教材");
assert(curriculum.sourceLabels.recommendedReading === "推荐读物", "题源标签应包含推荐读物");
assert(curriculum.sourceLabels.extraOriginal === "原创拓展", "题源标签应包含原创拓展");

for (const grade of [1, 2, 3, 4, 5, 6]) {
  const gradeData = curriculum.grades[grade];
  assert(gradeData, `${grade} 年级应有教材知识库`);
  assert(Array.isArray(gradeData.terms) && gradeData.terms.length === 2, `${grade} 年级应包含上下册`);
  assert(gradeData.terms.every((term) => Array.isArray(term.units) && term.units.length >= 3), `${grade} 年级每册应包含多个单元`);
  const lessons = gradeData.terms.flatMap((term) => term.units.flatMap((unit) => unit.lessons || []));
  assert(lessons.length >= 16, `${grade} 年级应包含足够的课文/识字/园地/习作条目`);
  assert(lessons.some((lesson) => lesson.knowledge && ((lesson.knowledge.characters || []).length || (lesson.knowledge.words || []).length)), `${grade} 年级教材条目应包含生字或词语知识`);
  assert(Array.isArray(gradeData.recommendedReadings) && gradeData.recommendedReadings.length >= 4, `${grade} 年级应包含推荐读物`);
  assert(gradeData.recommendedReadings.every((book) => book.title && Array.isArray(book.skills) && book.skills.length), `${grade} 年级推荐读物应包含书名和阅读能力点`);
  assert(Array.isArray(gradeData.extraOriginal) && gradeData.extraOriginal.length >= 4, `${grade} 年级应包含原创拓展题源`);
}

assert(bank, "语文题库应暴露为 MathCampChineseQuestionBank");
assert.strictEqual(
  JSON.stringify(bank.causes),
  JSON.stringify(["未标记", "不会做", "字词基础", "阅读理解", "表达规范"]),
  "语文错因应保持 5 类"
);

for (const grade of [1, 2, 3, 4, 5, 6]) {
  const points = bank.points.filter((point) => point.grade === grade);
  assert(points.length >= 8, `${grade} 年级应至少有 8 个语文知识点`);
  assert(points.every((point) => point.curriculum && point.curriculum.region === "浙江省杭州市"), `${grade} 年级知识点应标注杭州教材线`);
  ["inTextbook", "recommendedReading", "extraOriginal"].forEach((sourceType) => {
    assert(points.some((point) => point.sourceType === sourceType), `${grade} 年级应包含 ${sourceType} 题源知识点`);
  });
  const textbookPoints = points.filter((point) => point.sourceType === "inTextbook");
  assert(textbookPoints.length >= 10, `${grade} 年级课内题源应按教材知识点重建，不能只靠少量课文派生`);
  assert(textbookPoints.every((point) => !point.curriculum.lessonTitle && !/《.*》/.test(point.label + point.helper)), `${grade} 年级课内题源不应强行绑定单篇课文`);
}

assert(bank.pointsBySource.inTextbook.length > bank.pointsBySource.recommendedReading.length, "课内教材题源点应多于推荐读物点");
assert(bank.pointsBySource.recommendedReading.length > 0, "推荐读物题源点不能为空");
assert(bank.pointsBySource.extraOriginal.length > 0, "原创拓展题源点不能为空");

assert(bank.pointMap["c1-pinyin"], "一年级拼音知识点应存在");
assert(bank.pointMap["c6-reading-strategy"], "六年级阅读策略知识点应存在");

const generatorSource = fs.readFileSync(path.join(root, "js/chinese-question-generator.js"), "utf8");
vm.runInContext(generatorSource, context, { filename: "js/chinese-question-generator.js" });
const generator = context.window.MathCampChineseQuestionGenerator;
assert(generator, "语文生成器应暴露为 MathCampChineseQuestionGenerator");
assert.strictEqual(JSON.stringify(generator.buildSourcePlan(10, bank.sourceWeights)), JSON.stringify(Array.from({ length: 10 }, () => "inTextbook")), "语文自动组卷应只按杭州教材同步知识点出题，不再遵循课内/推荐/拓展比例");
assert.strictEqual(JSON.stringify(generator.buildSourcePlan(4, bank.sourceWeights)), JSON.stringify(Array.from({ length: 4 }, () => "inTextbook")), "小题量语文组卷也应只取教材同步知识点");

function hasChoiceOptions(question) {
  return /\nA\. .+\nB\. .+\nC\. .+\nD\. /s.test(question.text || "");
}

function assertChoiceQuestion(question, message) {
  assert.strictEqual(question.answerType, "choice", `${message}：带 A/B/C/D 选项的题必须归类为选择题`);
  assert(hasChoiceOptions(question), `${message}：选择题选项应独立换行`);
  assert.strictEqual(question.answer, "A", `${message}：选择题答案应使用选项字母`);
  assert(question.acceptedAnswers?.includes("A"), `${message}：选择题应接受选项字母作答`);
}

function assertInputQuestion(question, message) {
  assert.strictEqual(question.answerType, "text", `${message}：真正直接输入题才使用 text`);
  assert(!hasChoiceOptions(question), `${message}：直接输入题不应包含 A/B/C/D 选项`);
  assert(!/^[A-D]$/.test(String(question.answer || "")), `${message}：直接输入题答案不应是选项字母`);
  assert(question.answer || question.acceptedAnswers?.length, `${message}：直接输入题应有可自动判分答案`);
  assert(!["组词", "多音字读音", "标点输入"].includes(question.questionType), `${message}：直接输入题不能使用开放组词、拼音读音或标点符号输入`);
  assert(!/组一个词|一个合适|一个最合适|带声调|输入.*拼音|读作什么|标点符号/.test(question.text), `${message}：直接输入题不能是多答案开放题、拼音题或标点符号题`);
  assert(/^[\u4e00-\u9fa5]+$/.test(String(question.answer || "")), `${message}：直接输入题答案只能是汉字`);
  assert.strictEqual(JSON.stringify(question.acceptedAnswers || []), JSON.stringify([question.answer]), `${message}：直接输入题只能有一个标准答案`);
  const visiblePrompt = String(question.text || "").replace(/[（(]\s*[）)]/g, "（ ）");
  assert(!visiblePrompt.includes(String(question.answer || "")), `${message}：直接输入题不能把标准答案直接写在题干或材料里`);
}

const question = generator.makeQuestion({ uid: () => "cq-test", pick: (items) => items[0] }, bank.pointMap["c3-paragraph-reading"], {});
assert(question.text, "语文题应有题干");
assert(question.answerType, "语文题应声明答案类型");
assert(question.answer || question.answerLabel, "语文题应有答案或参考答案");
assert(question.explanation, "语文题应有解析");
assert(Array.isArray(question.steps) && question.steps.length, "语文题应有答题步骤");
assert.strictEqual(question.pointId, "c3-paragraph-reading", "语文题应保留知识点");
assertChoiceQuestion(question, "语文默认考卷式题");

const pinyinQuestion = generator.makeQuestion({ uid: () => "cq-pinyin", pick: (items) => items[0] }, bank.pointMap["c1-pinyin"], {});
assert(!/\b[a-z]+[1-5]\b/i.test(pinyinQuestion.text), "拼音题展示不能使用 ma1 这类数字声调");
assert(pinyinQuestion.text.includes("mā"), "拼音题展示应使用带声调符号的标准拼音");
assert(pinyinQuestion.acceptedAnswers.includes("ma1"), "拼音题应兼容数字声调输入");

["c3-sentence-transform", "c2-punctuation", "c3-writing-piece"].forEach((pointId) => {
  const objective = generator.makeQuestion({ uid: () => `cq-${pointId}`, pick: (items) => items[0] }, bank.pointMap[pointId], {});
  assert.notStrictEqual(objective.answerType, "longText", `${pointId} 应尽量生成可自动判分的客观题`);
  assert(["choice", "text"].includes(objective.answerType), `${pointId} 应使用可自动判分的客观答案类型`);
  assert(objective.answer || objective.acceptedAnswers?.length, `${pointId} 应提供可判分答案`);
});

const generatedByPoint = bank.points.map((point) => {
  const item = generator.makeQuestion({ uid: () => `cq-${point.id}`, pick: (items) => items[0] }, point, {});
  assert.strictEqual(item.pointId, point.id, `${point.id} 应保留自己的知识点 id`);
  assert.strictEqual(item.topic, point.topic, `${point.id} 应保留自己的知识点主题`);
  assert.strictEqual(item.kind, point.label, `${point.id} 应保留自己的知识点名称`);
  assert(item.text.includes(point.label) || item.text.includes(point.short) || item.text.includes(point.helper.slice(0, 4)), `${point.id} 题干应体现专属知识点，不应只套大类模板`);
  assertChoiceQuestion(item, `${point.id} 默认题`);
  assert(item.answer || item.acceptedAnswers?.length, `${point.id} 应提供可自动判分答案`);
  return item;
});
const uniqueQuestionTexts = new Set(generatedByPoint.map((item) => item.text));
assert.strictEqual(uniqueQuestionTexts.size, bank.points.length, "每个语文知识点都应有独立题干，不能复用少量大类模板");

bank.points.forEach((point) => {
  const first = generator.makeQuestion({ uid: () => `cq-${point.id}-a`, pick: (items) => items[0] }, point, {});
  const second = generator.makeQuestion({ uid: () => `cq-${point.id}-b`, pick: (items) => items[1] }, point, {});
  assert(first.text && second.text, `${point.id} 应能生成两套题目`);
  assert.notStrictEqual(second.text, first.text, `${point.id} 应有不同的巩固题，不能只重复同一题`);
  assertChoiceQuestion(first, `${point.id} 第一套题`);
  assertInputQuestion(second, `${point.id} 第二套直接输入题`);
  assert(second.answer || second.acceptedAnswers?.length, `${point.id} 巩固题应提供可判分答案`);
  assert(second.explanation, `${point.id} 巩固题应提供解析`);
  assert(Array.isArray(second.steps) && second.steps.length >= 3, `${point.id} 巩固题应提供答题步骤`);
  [first, second].forEach((question, index) => {
    assert(!/巩固练习|训练目标|判断最准确|最能体现这个知识点|知识点规则/.test(question.text), `${point.id} 第 ${index + 1} 套题不能使用抽象训练目标模板`);
    assert(!/只看|只写|只说|只背|随便|页码|颜色|不读|不看|乱写|不用看|不读题|直接猜|无关|纸张|封面/.test(question.text), `${point.id} 第 ${index + 1} 套题不能使用机械凑数选项`);
  });
});

["inTextbook", "recommendedReading", "extraOriginal"].forEach((sourceType) => {
  const sourcePoint = bank.points.find((point) => point.sourceType === sourceType);
  const sourceQuestion = generator.makeQuestion({ uid: () => `cq-${sourceType}`, pick: (items) => items[0] }, sourcePoint, {});
  assert.strictEqual(sourceQuestion.sourceType, sourceType, `${sourceType} 题目应保留题源类型`);
  assert(sourceQuestion.text.includes(sourcePoint.sourceLabel) || sourceQuestion.text.includes(sourcePoint.label), `${sourceType} 题干应体现题源或知识点`);
  assert(/材料|情境|阅读提示/.test(sourceQuestion.text), `${sourceType} 题目应引用情境材料考知识点，不能只考死背课文`);
  assertChoiceQuestion(sourceQuestion, `${sourceType} 来源题`);
  if (sourceType === "inTextbook") {
    assert(!/借《.*》考察知识点/.test(sourceQuestion.text), "课内题不应再写成借某篇课文考察知识点");
    assert(!/《.*》相关知识/.test(sourceQuestion.text), "课内题不应再围绕单篇课文相关知识出题");
  }
  ["只凭感觉猜答案", "不看课题和语境", "把课外内容当课内依据", "只看书名不读内容", "只记页码不看人物", "不联系情节随意评价", "不读材料直接猜", "答案和语境无关", "表达空泛没有依据"].forEach((badOption) => {
    assert(!sourceQuestion.text.includes(badOption), `${sourceType} 选项不应使用机械凑数选项：${badOption}`);
  });
  assert.strictEqual(sourceQuestion.answerType, "choice", `${sourceType} 带选项题目应归类为选择题`);
  assert(sourceQuestion.explanation && sourceQuestion.steps?.length >= 3, `${sourceType} 题目应有解析和步骤`);
});

const inputSamples = [
  ["c2-textbook-polyphone", /长大|多音字|长|成长/],
  ["c5-textbook-integrated-language", /错别字|改正|病句|检查/],
  ["c1-textbook-quantifier-basic", /量词|一（|填/],
  ["c2-textbook-word-collocation", /固定词语|灿烂|阳光/],
  ["c1-textbook-common-characters", /课文词语填空|妈妈|汉字/]
];
inputSamples.forEach(([pointId, pattern]) => {
  const inputQuestion = generator.makeQuestion({ uid: () => `cq-${pointId}-input`, pick: (items) => items[1] }, bank.pointMap[pointId], {});
  assertInputQuestion(inputQuestion, `${pointId} 客观输入题`);
  assert(pattern.test([inputQuestion.text, inputQuestion.answer, inputQuestion.answerLabel, ...(inputQuestion.acceptedAnswers || [])].join(" ")), `${pointId} 应覆盖对应的字词输入题型`);
});

const allInputTypeTags = new Set(bank.points.map((point) => {
  const inputQuestion = generator.makeQuestion({ uid: () => `cq-${point.id}-input-type`, pick: (items) => items[1] }, point, {});
  assertInputQuestion(inputQuestion, `${point.id} 输入变式`);
  return inputQuestion.questionType;
}));
["诗词填空", "成语填空", "错别字改正", "固定词语填空", "课文词语填空"].forEach((type) => {
  assert(allInputTypeTags.has(type), `直接输入题库应覆盖“${type}”题型`);
});

bank.points.filter((point) => point.sourceType === "inTextbook").forEach((point) => {
  [0, 1].forEach((variantIndex) => {
    const textbookQuestion = generator.makeQuestion({ uid: () => `cq-${point.id}-quality-${variantIndex}`, pick: (items) => items[variantIndex] }, point, {});
    assert(!/只看|只写|只背|随便|页码|颜色/.test(textbookQuestion.text), `${point.id} 课内干扰项应是相近知识点，不应是机械行为描述`);
    assert(!/巩固练习|最能体现这个知识点|训练目标|围绕“.*”判断|围绕“.*”|判断最准确|知识点规则/.test(textbookQuestion.text), `${point.id} 第 ${variantIndex + 1} 套课内题应采用考卷式问法，不能抽象地问知识点`);
    assert(!/判断拼音声调变化|安排习作开头结尾|提取通知中的地点|辨析字音字形|选择句末标点|概括短文主要内容|选择应用文格式要素/.test(textbookQuestion.text), `${point.id} 课内题选项不应使用跨题型标签凑数`);
    assert(/读|选|写|填|判断|排序|修改|理解|概括|指出|选择|哪一|哪个|哪种|哪组|什么|哪里|第几/.test(textbookQuestion.text), `${point.id} 课内题干应像试卷题一样给出明确作答动作`);
  });
});

const pictureWritingOrderReview = generator.makeQuestion({ uid: () => "cq-picture-review", pick: (items) => items[1] }, bank.pointMap["c2-textbook-picture-writing-order"], {});
assert(!/人物、地点和事情/.test(pictureWritingOrderReview.text) || /小朋友|操场|公园|小树旁/.test(pictureWritingOrderReview.answerLabel || pictureWritingOrderReview.answer || ""), "看图写话顺序题不能要求人物、地点、事情，却给出缺少人物地点的答案");

const insights = context.window.MathCampLearningInsights;
assert.strictEqual(
  insights.diagnoseCause({ text: "短文概括不准确", cause: "概括不准" }, bank.pointMap["c3-paragraph-reading"]),
  "阅读理解",
  "语文阅读题应归因到阅读理解"
);
assert.strictEqual(
  insights.diagnoseCause({ text: "拼音声调写错" }, bank.pointMap["c1-pinyin"]),
  "字词基础",
  "拼音字词题应归因到字词基础"
);
assert.strictEqual(
  insights.diagnoseCause({ text: "句子不通顺，标点漏写" }, bank.pointMap["c4-sick-sentence"]),
  "表达规范",
  "句子表达题应归因到表达规范"
);

console.log("Chinese question bank tests passed.");
