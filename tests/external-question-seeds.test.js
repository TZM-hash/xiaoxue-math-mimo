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
  "js/grade2-reference-source-meta.js",
  "js/grade2-reference-scan-index.js",
  "js/grade2-reference-question-seeds.js",
  "js/grade2-original-question-seeds.js",
  "js/grade3-reference-source-meta.js",
  "js/grade3-reference-scan-index.js",
  "js/grade3-reference-question-seeds.js",
  "js/grade3-original-question-seeds.js",
  "js/grade4-reference-source-meta.js",
  "js/grade4-reference-scan-index.js",
  "js/grade4-reference-question-seeds.js",
  "js/grade4-original-question-seeds.js",
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
const referenceMeta = context.window.MathCampGrade2ReferenceSourceMeta;
const scanIndex = context.window.MathCampGrade2ReferenceScanIndex;
const referenceSeeds = context.window.MathCampGrade2ReferenceQuestionSeeds;
const originalSeeds = context.window.MathCampGrade2OriginalQuestionSeeds;
const grade3ReferenceMeta = context.window.MathCampGrade3ReferenceSourceMeta;
const grade3ScanIndex = context.window.MathCampGrade3ReferenceScanIndex;
const grade3ReferenceSeeds = context.window.MathCampGrade3ReferenceQuestionSeeds;
const grade3OriginalSeeds = context.window.MathCampGrade3OriginalQuestionSeeds;
const grade4ReferenceMeta = context.window.MathCampGrade4ReferenceSourceMeta;
const grade4ScanIndex = context.window.MathCampGrade4ReferenceScanIndex;
const grade4ReferenceSeeds = context.window.MathCampGrade4ReferenceQuestionSeeds;
const grade4OriginalSeeds = context.window.MathCampGrade4OriginalQuestionSeeds;
assert(referenceMeta, "二年级资料来源清单应独立暴露为 MathCampGrade2ReferenceSourceMeta");
assert(scanIndex, "二年级资料逐页扫描索引应独立暴露为 MathCampGrade2ReferenceScanIndex");
assert(referenceSeeds, "二年级资料派生题源应独立暴露为 MathCampGrade2ReferenceQuestionSeeds");
assert(originalSeeds, "二年级原创扩展题源应独立暴露为 MathCampGrade2OriginalQuestionSeeds");
assert(grade3ReferenceMeta, "三年级资料来源清单应独立暴露为 MathCampGrade3ReferenceSourceMeta");
assert(grade3ScanIndex, "三年级资料逐页扫描索引应独立暴露为 MathCampGrade3ReferenceScanIndex");
assert(grade3ReferenceSeeds, "三年级资料派生题源应独立暴露为 MathCampGrade3ReferenceQuestionSeeds");
assert(grade3OriginalSeeds, "三年级原创扩展题源应独立暴露为 MathCampGrade3OriginalQuestionSeeds");
assert(grade4ReferenceMeta, "四年级资料来源清单应独立暴露为 MathCampGrade4ReferenceSourceMeta");
assert(grade4ScanIndex, "四年级资料逐页扫描索引应独立暴露为 MathCampGrade4ReferenceScanIndex");
assert(grade4ReferenceSeeds, "四年级资料派生题源应独立暴露为 MathCampGrade4ReferenceQuestionSeeds");
assert(grade4OriginalSeeds, "四年级原创扩展题源应独立暴露为 MathCampGrade4OriginalQuestionSeeds");

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
  assert(["choice", "text", "judge"].includes(question.answerType), `${message} 应保持客观可判分`);
  assert(question.answer, `${message} 应有答案`);
  assert(Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.includes(question.answer), `${message} 应接受标准答案`);
  assert(question.explanation, `${message} 应有解析`);
  assert(Array.isArray(question.steps) && question.steps.length >= 2, `${message} 应有步骤`);
  assert(question.sourceMeta && question.sourceMeta.url && question.sourceMeta.kind, `${message} 应记录来源元数据`);
  assert(["openResource", "inspiredOriginal", "referenceDerived", "codexOriginal"].includes(question.sourceMeta.kind), `${message} 来源类型应可审计`);
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

function flattenBank(bank) {
  return Object.entries(bank || {}).flatMap(([pointId, items]) => (items || []).map((item) => ({ pointId, ...item })));
}

const referenceSeedItems = flattenBank(referenceSeeds.BANK);
const originalSeedItems = flattenBank(originalSeeds.BANK);
const grade3ReferenceSeedItems = flattenBank(grade3ReferenceSeeds.BANK);
const grade3OriginalSeedItems = flattenBank(grade3OriginalSeeds.BANK);
const grade4ReferenceSeedItems = flattenBank(grade4ReferenceSeeds.BANK);
const grade4OriginalSeedItems = flattenBank(grade4OriginalSeeds.BANK);
assert(Array.isArray(referenceMeta.files) && referenceMeta.files.length >= 9, "资料来源清单应记录 Reference/grade2 下的资料文件");
assert(referenceMeta.files.every((item) => item.grade === 2 && item.path.includes("Reference/grade2")), "资料来源清单应限定为二年级资料");
assert(referenceMeta.files.some((item) => item.fileName.includes("奥数") && item.subject === "math"), "二年级资料来源清单应包含新增奥数 PDF");
assert(scanIndex.pages.length >= 214, "二年级资料逐页扫描索引应覆盖全部 PDF 页和新增奥数 PDF");
assert(scanIndex.pages.every((page) => page.sourceId && Number.isInteger(page.page) && page.page >= 1), "逐页扫描索引应记录来源和页码");
assert(scanIndex.pages.some((page) => page.extractStatus === "text-extractable"), "逐页扫描索引应标注可抽文字页");
assert(scanIndex.pages.some((page) => page.extractStatus === "scan-image"), "逐页扫描索引应标注扫描图片页");
assert(referenceSeedItems.length >= 1500, "二年级资料派生题源完整扫描后应至少 1500 道");
assert(originalSeedItems.length >= 60, "二年级原创扩展题源应包含新增原创奥数题后至少 60 道");
assert(referenceSeedItems.filter((item) => item.id.includes("olympiad")).length >= 130, "二年级奥数 PDF 应按题号和页面截图批量入库");
assert(originalSeedItems.filter((item) => item.id.startsWith("orig-g2-olympiad-")).length >= 12, "二年级原创奥数题应独立入库");
assert(referenceSeedItems.every((item) => item.id.startsWith("ref-g2-") && item.sourceMeta?.kind === "referenceDerived"), "资料派生题应使用 ref-g2-* id 且标记 referenceDerived");
assert(originalSeedItems.every((item) => item.id.startsWith("orig-g2-") && item.sourceMeta?.kind === "codexOriginal"), "原创扩展题应使用 orig-g2-* id 且标记 codexOriginal");
assert(referenceSeedItems.every((item) => item.sourceMeta?.sourceFile && item.sourceMeta?.sourceNote), "资料派生题应保留资料文件与维护注释");
assert(originalSeedItems.every((item) => item.sourceMeta?.maintainerNote), "原创扩展题应保留原创维护注释");
assert(referenceSeedItems.every((item) => !item.sourceMeta?.maintainerNote && item.sourceMeta?.sourcePath?.includes("Reference/grade2")), "资料派生题不得混入原创维护字段，且必须指向 Reference/grade2");
assert(originalSeedItems.every((item) => !item.sourceMeta?.sourceFile && !item.sourceMeta?.sourcePage), "原创扩展题不得伪装成参考资料页码题");

const referenceDiagramItems = referenceSeedItems.filter((item) => item.diagram);
const referenceDiagramTypes = new Set(referenceDiagramItems.map((item) => item.diagram.type));
assert(referenceDiagramItems.length >= 80, "资料派生题应包含一批自绘图形题");
["angle-set", "segment-chain", "block-view", "motion-grid", "shape-count", "position-row"].forEach((type) => {
  assert(referenceDiagramTypes.has(type), `资料派生图形题应覆盖 ${type}`);
});
assert(referenceDiagramItems.every((item) => item.sourceMeta?.visualPolicy === "self-drawn-diagram"), "资料派生图形题应标注自绘示意图策略");

const referenceImageItems = referenceSeedItems.filter((item) => item.sourceImage);
assert(referenceImageItems.length >= 39, "资料派生题应包含 PDF 清晰页截图题和二年级奥数整页截图题");
assert(referenceImageItems.every((item) => item.sourceMeta?.visualPolicy === "pdf-crop-image"), "PDF 截图题应标注 pdf-crop-image 策略");
assert(referenceImageItems.every((item) => /^assets\/reference\/grade2\/.+\.png$/.test(item.sourceImage?.src || "")), "PDF 截图题应引用应用内二年级参考图片资产");
referenceImageItems.forEach((item) => {
  assert(fs.existsSync(path.join(root, item.sourceImage.src)), `PDF 截图资产应存在：${item.sourceImage.src}`);
  assert(item.sourceImage.sourceFile && item.sourceImage.cropNote, "PDF 截图题应记录截图来源和裁剪说明");
});

assert(Array.isArray(grade3ReferenceMeta.files) && grade3ReferenceMeta.files.length >= 9, "资料来源清单应记录 Reference/grade3 下的全部资料文件");
assert(grade3ReferenceMeta.files.every((item) => item.grade === 3 && item.path.includes("Reference/grade3")), "三年级资料来源清单应限定为三年级资料");
assert(grade3ReferenceMeta.files.some((item) => item.fileName.includes("活页默写") && item.subject === "english"), "三年级资料来源清单应包含新增英语默写 PDF");
assert(grade3ReferenceMeta.files.some((item) => item.fileName.includes("奥数") && item.subject === "math"), "三年级资料来源清单应包含新增奥数 PDF");
const grade3PdfPageTotal = (grade3ScanIndex.pdfSources || []).reduce((sum, source) => sum + Number(source.pages || 0), 0);
assert.strictEqual(grade3ScanIndex.pages.length, grade3PdfPageTotal, "三年级逐页扫描索引应与 PDF 页数合计一致");
assert(grade3ScanIndex.pages.length >= 360, "三年级资料逐页扫描索引应覆盖新增后全部 PDF 页");
assert(grade3ScanIndex.pages.every((page) => page.grade === 3 && page.sourceId && Number.isInteger(page.page) && page.page >= 1), "三年级逐页扫描索引应记录年级、来源和页码");
assert(grade3ScanIndex.pages.some((page) => page.extractStatus === "text-extractable"), "三年级逐页扫描索引应标注可抽文字页");
assert(grade3ScanIndex.pages.some((page) => page.extractStatus === "scan-image"), "三年级逐页扫描索引应标注扫描图片页");
["math", "chinese", "english"].forEach((subject) => {
  assert(grade3ScanIndex.pages.some((page) => page.subject === subject), `三年级逐页扫描索引应覆盖 ${subject}`);
});
assert(grade3ReferenceSeedItems.length >= 2190, "三年级资料派生题源完整扫描并补充奥数题后应至少 2190 道");
assert(grade3OriginalSeedItems.length >= 60, "三年级原创扩展题源应包含新增原创奥数题后至少 60 道");
assert(grade3ReferenceSeedItems.filter((item) => item.id.includes("olympiad")).length >= 40, "三年级奥数 PDF 不应只保留单题示例");
assert(grade3OriginalSeedItems.filter((item) => item.id.startsWith("orig-g3-olympiad-")).length >= 12, "三年级原创奥数题应独立入库");
assert(grade3ReferenceSeedItems.every((item) => item.id.startsWith("ref-g3-") && item.sourceMeta?.kind === "referenceDerived"), "三年级资料派生题应使用 ref-g3-* id 且标记 referenceDerived");
assert(grade3OriginalSeedItems.every((item) => item.id.startsWith("orig-g3-") && item.sourceMeta?.kind === "codexOriginal"), "三年级原创扩展题应使用 orig-g3-* id 且标记 codexOriginal");
assert(grade3ReferenceSeedItems.every((item) => item.sourceMeta?.sourceFile && item.sourceMeta?.sourceNote), "三年级资料派生题应保留资料文件与维护注释");
assert(grade3OriginalSeedItems.every((item) => item.sourceMeta?.maintainerNote), "三年级原创扩展题应保留原创维护注释");
assert(grade3ReferenceSeedItems.every((item) => !item.sourceMeta?.maintainerNote && item.sourceMeta?.sourcePath?.includes("Reference/grade3")), "三年级资料派生题不得混入原创维护字段，且必须指向 Reference/grade3");
assert(grade3OriginalSeedItems.every((item) => !item.sourceMeta?.sourceFile && !item.sourceMeta?.sourcePage), "三年级原创扩展题不得伪装成参考资料页码题");

const grade3ReferenceDiagramItems = grade3ReferenceSeedItems.filter((item) => item.diagram);
const grade3ReferenceDiagramTypes = new Set(grade3ReferenceDiagramItems.map((item) => item.diagram.type));
assert(grade3ReferenceDiagramItems.length >= 120, "三年级资料派生题应包含一批自绘图形题");
["rectangle", "square", "grid-shape", "segment-chain", "block-view", "shape-count"].forEach((type) => {
  assert(grade3ReferenceDiagramTypes.has(type), `三年级资料派生图形题应覆盖 ${type}`);
});
assert(grade3ReferenceDiagramItems.every((item) => item.sourceMeta?.visualPolicy === "self-drawn-diagram"), "三年级资料派生图形题应标注自绘示意图策略");

const grade3ReferenceImageItems = grade3ReferenceSeedItems.filter((item) => item.sourceImage);
assert(grade3ReferenceImageItems.length >= 11, "三年级资料派生题应包含 PDF 清晰页截图题和奥数整页截图题");
assert(grade3ReferenceImageItems.every((item) => item.sourceMeta?.visualPolicy === "pdf-crop-image"), "三年级 PDF 截图题应标注 pdf-crop-image 策略");
assert(grade3ReferenceImageItems.every((item) => /^assets\/reference\/grade3\/.+\.png$/.test(item.sourceImage?.src || "")), "三年级 PDF 截图题应引用应用内三年级参考图片资产");
grade3ReferenceImageItems.forEach((item) => {
  assert(fs.existsSync(path.join(root, item.sourceImage.src)), `三年级 PDF 截图资产应存在：${item.sourceImage.src}`);
  assert(item.sourceImage.sourceFile && item.sourceImage.cropNote, "三年级 PDF 截图题应记录截图来源和裁剪说明");
});

assert(Array.isArray(grade4ReferenceMeta.files) && grade4ReferenceMeta.files.length >= 10, "资料来源清单应记录 Reference/grade4 下的全部资料文件");
assert(grade4ReferenceMeta.files.every((item) => item.grade === 4 && item.path.includes("Reference/grade4")), "四年级资料来源清单应限定为四年级资料");
assert(grade4ReferenceMeta.files.some((item) => item.fileName.includes("我来啦英语") && item.subject === "english"), "四年级资料来源清单应包含英语入门 PDF");
assert(grade4ReferenceMeta.files.some((item) => item.fileType === "docx" && item.subject === "math"), "四年级资料来源清单应包含数学 DOCX 期中卷");
assert(grade4ReferenceMeta.files.some((item) => item.fileName.includes("奥数") && item.subject === "math"), "四年级资料来源清单应包含新增奥数 PDF");
const grade4PdfPageTotal = (grade4ScanIndex.pdfSources || []).reduce((sum, source) => sum + Number(source.pages || 0), 0);
assert.strictEqual(grade4ScanIndex.pages.length, grade4PdfPageTotal, "四年级逐页扫描索引应与 PDF 页数合计一致");
assert(grade4ScanIndex.pages.length >= 369, "四年级资料逐页扫描索引应覆盖全部 PDF 页");
assert(grade4ScanIndex.pages.every((page) => page.grade === 4 && page.sourceId && Number.isInteger(page.page) && page.page >= 1), "四年级逐页扫描索引应记录年级、来源和页码");
assert(grade4ScanIndex.pages.some((page) => page.extractStatus === "text-extractable"), "四年级逐页扫描索引应标注可抽文字页");
assert(grade4ScanIndex.pages.some((page) => page.extractStatus === "scan-image"), "四年级逐页扫描索引应标注扫描图片页");
["math", "chinese", "english"].forEach((subject) => {
  assert(grade4ScanIndex.pages.some((page) => page.subject === subject), `四年级逐页扫描索引应覆盖 ${subject}`);
});
assert(grade4ReferenceSeedItems.length >= 2265, "四年级资料派生题源完整扫描并补充奥数题后应至少 2265 道");
assert(grade4OriginalSeedItems.length >= 60, "四年级原创扩展题源应包含新增原创奥数题后至少 60 道");
assert(grade4ReferenceSeedItems.filter((item) => item.id.includes("olympiad")).length >= 60, "四年级奥数 PDF 不应只保留单题示例");
assert(grade4OriginalSeedItems.filter((item) => item.id.startsWith("orig-g4-olympiad-")).length >= 12, "四年级原创奥数题应独立入库");
assert(grade4ReferenceSeedItems.every((item) => item.id.startsWith("ref-g4-") && item.sourceMeta?.kind === "referenceDerived"), "四年级资料派生题应使用 ref-g4-* id 且标记 referenceDerived");
assert(grade4OriginalSeedItems.every((item) => item.id.startsWith("orig-g4-") && item.sourceMeta?.kind === "codexOriginal"), "四年级原创扩展题应使用 orig-g4-* id 且标记 codexOriginal");
assert(grade4ReferenceSeedItems.every((item) => item.sourceMeta?.sourceFile && item.sourceMeta?.sourceNote), "四年级资料派生题应保留资料文件与维护注释");
assert(grade4OriginalSeedItems.every((item) => item.sourceMeta?.maintainerNote), "四年级原创扩展题应保留原创维护注释");
assert(grade4ReferenceSeedItems.every((item) => !item.sourceMeta?.maintainerNote && item.sourceMeta?.sourcePath?.includes("Reference/grade4")), "四年级资料派生题不得混入原创维护字段，且必须指向 Reference/grade4");
assert(grade4OriginalSeedItems.every((item) => !item.sourceMeta?.sourceFile && !item.sourceMeta?.sourcePage), "四年级原创扩展题不得伪装成参考资料页码题");

const grade4ReferenceDiagramItems = grade4ReferenceSeedItems.filter((item) => item.diagram);
const grade4ReferenceDiagramTypes = new Set(grade4ReferenceDiagramItems.map((item) => item.diagram.type));
assert(grade4ReferenceDiagramItems.length >= 120, "四年级资料派生题应包含一批自绘图形题");
["angle-measure", "polygon-shape", "polygon-area", "grid-shape", "block-view", "shape-count"].forEach((type) => {
  assert(grade4ReferenceDiagramTypes.has(type), `四年级资料派生图形题应覆盖 ${type}`);
});
assert(grade4ReferenceDiagramItems.every((item) => item.sourceMeta?.visualPolicy === "self-drawn-diagram"), "四年级资料派生图形题应标注自绘示意图策略");

const grade4ReferenceImageItems = grade4ReferenceSeedItems.filter((item) => item.sourceImage);
assert(grade4ReferenceImageItems.length >= 12, "四年级资料派生题应包含 PDF 清晰页截图题和奥数整页截图题");
assert(grade4ReferenceImageItems.every((item) => item.sourceMeta?.visualPolicy === "pdf-crop-image"), "四年级 PDF 截图题应标注 pdf-crop-image 策略");
assert(grade4ReferenceImageItems.every((item) => /^assets\/reference\/grade4\/.+\.png$/.test(item.sourceImage?.src || "")), "四年级 PDF 截图题应引用应用内四年级参考图片资产");
grade4ReferenceImageItems.forEach((item) => {
  assert(fs.existsSync(path.join(root, item.sourceImage.src)), `四年级 PDF 截图资产应存在：${item.sourceImage.src}`);
  assert(item.sourceImage.sourceFile && item.sourceImage.cropNote, "四年级 PDF 截图题应记录截图来源和裁剪说明");
});

const grade3MathSeedPoints = banks.math.points
  .filter((point) => point.grade === 3 && seeds.forPoint(point).some((seed) => /^ref-g3-|^orig-g3-/.test(seed.id)))
  .map((point) => point.id);
const grade3ChineseSeedPoints = banks.chinese.points
  .filter((point) => point.grade === 3 && seeds.forPoint(point).some((seed) => /^ref-g3-|^orig-g3-/.test(seed.id)))
  .map((point) => point.id);
const grade3EnglishSeedPoints = banks.english.points
  .filter((point) => point.grade === 3 && seeds.forPoint(point).some((seed) => /^ref-g3-|^orig-g3-/.test(seed.id)))
  .map((point) => point.id);
assert(new Set(grade3MathSeedPoints).size >= 13, "三年级数学扩展题源应覆盖全部现有三年级数学知识点");
assert(new Set(grade3ChineseSeedPoints).size >= 12, "三年级语文扩展题源应覆盖能力线和教材同步知识点");
assert(new Set(grade3EnglishSeedPoints).size >= 5, "三年级英语扩展题源应覆盖词汇、拼读、句型、语法和阅读");
["g3-multi-add", "g3-vertical", "g3-perimeter", "g3-fraction-intro", "g3-statistics", "g3-appendix"].forEach((pointId) => {
  assert(grade3MathSeedPoints.includes(pointId), `三年级数学资料扩充应覆盖 ${pointId}`);
});
["c3-word-meaning", "c3-paragraph-reading", "c3-writing-piece", "c3-textbook-context-word", "c3-textbook-around-one-idea"].forEach((pointId) => {
  assert(grade3ChineseSeedPoints.includes(pointId), `三年级语文资料扩充应覆盖 ${pointId}`);
});
["e3-vocabulary-school", "e3-phonics-short-vowels", "e3-pattern-greetings", "e3-grammar-basic-be", "e3-reading-dialogue"].forEach((pointId) => {
  assert(grade3EnglishSeedPoints.includes(pointId), `三年级英语资料扩充应覆盖 ${pointId}`);
});

const grade4MathSeedPoints = banks.math.points
  .filter((point) => point.grade === 4 && seeds.forPoint(point).some((seed) => /^ref-g4-|^orig-g4-/.test(seed.id)))
  .map((point) => point.id);
const grade4ChineseSeedPoints = banks.chinese.points
  .filter((point) => point.grade === 4 && seeds.forPoint(point).some((seed) => /^ref-g4-|^orig-g4-/.test(seed.id)))
  .map((point) => point.id);
const grade4EnglishSeedPoints = banks.english.points
  .filter((point) => point.grade === 4 && seeds.forPoint(point).some((seed) => /^ref-g4-|^orig-g4-/.test(seed.id)))
  .map((point) => point.id);
assert(new Set(grade4MathSeedPoints).size >= 12, "四年级数学扩展题源应覆盖全部现有四年级数学知识点");
assert(new Set(grade4ChineseSeedPoints).size >= 8, "四年级语文扩展题源应覆盖全部现有四年级语文知识点");
assert(new Set(grade4EnglishSeedPoints).size >= 5, "四年级英语扩展题源应覆盖词汇、拼读、句型、语法和阅读");
["g4-mixed", "g4-vertical", "g4-large", "g4-area", "g4-angle-triangle", "g4-statistics", "g4-word", "g4-appendix"].forEach((pointId) => {
  assert(grade4MathSeedPoints.includes(pointId), `四年级数学资料扩充应覆盖 ${pointId}`);
});
["c4-word-sentence", "c4-sick-sentence", "c4-modern-reading", "c4-poem-classic", "c4-info-reading", "c4-usage"].forEach((pointId) => {
  assert(grade4ChineseSeedPoints.includes(pointId), `四年级语文资料扩充应覆盖 ${pointId}`);
});
["e4-vocabulary-home-school", "e4-phonics-silent-e", "e4-pattern-location-time", "e4-grammar-plural-pronoun", "e4-reading-notice"].forEach((pointId) => {
  assert(grade4EnglishSeedPoints.includes(pointId), `四年级英语资料扩充应覆盖 ${pointId}`);
});

const grade2MathSeedPoints = banks.math.points
  .filter((point) => point.grade === 2 && seeds.forPoint(point).some((seed) => /^ref-g2-|^orig-g2-/.test(seed.id)))
  .map((point) => point.id);
const grade2ChineseSeedPoints = banks.chinese.points
  .filter((point) => point.grade === 2 && seeds.forPoint(point).some((seed) => /^ref-g2-|^orig-g2-/.test(seed.id)))
  .map((point) => point.id);
assert(new Set(grade2MathSeedPoints).size >= 11, "二年级数学扩展题源应覆盖至少 11 个现有知识点");
assert(new Set(grade2ChineseSeedPoints).size >= 12, "二年级语文扩展题源应覆盖至少 12 个现有知识点");
["g2-length-measure", "g2-vertical", "g2-time-money", "g2-angle-view", "g2-reading"].forEach((pointId) => {
  assert(grade2MathSeedPoints.includes(pointId), `二年级数学资料扩充应覆盖 ${pointId}`);
});
["c2-textbook-sound-shape", "c2-textbook-word-collocation", "c2-textbook-sequence-reading", "c2-textbook-picture-writing-order"].forEach((pointId) => {
  assert(grade2ChineseSeedPoints.includes(pointId), `二年级语文资料扩充应覆盖 ${pointId}`);
});

["g2-length-measure", "g2-angle-view", "c2-textbook-picture-writing-order"].forEach((pointId) => {
  const subject = pointId.startsWith("c") ? "chinese" : "math";
  const point = banks[subject].pointMap[pointId];
  const question = seeds.makeQuestion(depsFor(subject), point, { preferExternal: true });
  assertQuestionShape(question, point, `${subject}:${pointId} 二年级扩展题`);
});

["g3-perimeter", "g3-fraction-intro", "c3-textbook-context-word", "e3-vocabulary-school"].forEach((pointId) => {
  const subject = pointId.startsWith("c") ? "chinese" : pointId.startsWith("e") ? "english" : "math";
  const point = banks[subject].pointMap[pointId];
  const question = seeds.makeQuestion(depsFor(subject), point, { preferExternal: true });
  assertQuestionShape(question, point, `${subject}:${pointId} 三年级扩展题`);
});

["g4-area", "g4-angle-triangle", "c4-modern-reading", "e4-pattern-location-time"].forEach((pointId) => {
  const subject = pointId.startsWith("c") ? "chinese" : pointId.startsWith("e") ? "english" : "math";
  const point = banks[subject].pointMap[pointId];
  const question = seeds.makeQuestion(depsFor(subject), point, { preferExternal: true });
  assertQuestionShape(question, point, `${subject}:${pointId} 四年级扩展题`);
});

const diagramQuestion = seeds.makeQuestion({
  ...depsFor("math"),
  pick: (items) => items.find((seed) => seed.diagram?.type === "angle-set") || items.find((seed) => seed.diagram) || items[0]
}, banks.math.pointMap["g2-angle-view"], { preferExternal: true });
assert(diagramQuestion.diagram && diagramQuestion.diagram.type === "angle-set", "扩展题源生成题应保留可渲染 diagram 数据");
assert.strictEqual(diagramQuestion.sourceMeta.visualPolicy, "self-drawn-diagram", "生成后的图形题应保留自绘图策略");

const imageQuestion = seeds.makeQuestion({
  ...depsFor("math"),
  pick: (items) => items.find((seed) => seed.sourceImage) || items[0]
}, banks.math.pointMap["g2-length-measure"], { preferExternal: true });
assert(imageQuestion.sourceImage && imageQuestion.sourceImage.src.includes("assets/reference/grade2/"), "扩展题源生成题应保留 PDF 截图 sourceImage 数据");
assert.strictEqual(imageQuestion.sourceMeta.visualPolicy, "pdf-crop-image", "生成后的截图题应保留 PDF 截图策略");

const grade4DiagramQuestion = seeds.makeQuestion({
  ...depsFor("math"),
  pick: (items) => items.find((seed) => seed.diagram?.type === "polygon-area") || items.find((seed) => seed.diagram) || items[0]
}, banks.math.pointMap["g4-area"], { preferExternal: true });
assert(grade4DiagramQuestion.diagram && grade4DiagramQuestion.diagram.type === "polygon-area", "四年级扩展题源生成题应保留可渲染 diagram 数据");
assert.strictEqual(grade4DiagramQuestion.sourceMeta.visualPolicy, "self-drawn-diagram", "四年级生成后的图形题应保留自绘图策略");

const grade4ImageQuestion = seeds.makeQuestion({
  ...depsFor("math"),
  pick: (items) => items.find((seed) => seed.sourceImage) || items[0]
}, banks.math.pointMap["g4-statistics"], { preferExternal: true });
assert(grade4ImageQuestion.sourceImage && grade4ImageQuestion.sourceImage.src.includes("assets/reference/grade4/"), "四年级扩展题源生成题应保留 PDF 截图 sourceImage 数据");
assert.strictEqual(grade4ImageQuestion.sourceMeta.visualPolicy, "pdf-crop-image", "四年级生成后的截图题应保留 PDF 截图策略");

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
