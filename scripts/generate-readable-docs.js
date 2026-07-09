const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");
const generatedAt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function runFile(context, file) {
  vm.runInContext(read(file), context, { filename: file });
}

function text(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

function oneLine(value, max = 220) {
  const cleaned = text(value).replace(/\s+/g, " ");
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}...` : cleaned;
}

function mdEscape(value) {
  return text(value).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function subjectOfPoint(pointId, point) {
  if (point && point.subject) return point.subject;
  if (/^c\d-/.test(pointId)) return "chinese";
  if (/^e\d-/.test(pointId)) return "english";
  if (/^s\d-/.test(pointId)) return "science";
  return "math";
}

const subjectLabels = {
  math: "数学",
  chinese: "语文",
  english: "英语",
  science: "科学"
};

const sourceCategoryLabels = {
  reference: "参考资料派生题",
  original: "原创扩展题",
  common: "公共扩展题源",
  template: "学科模板题"
};

function makeContext() {
  const context = {
    console,
    window: {},
    Math,
    Date,
    setTimeout() {},
    clearTimeout() {}
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  [
    "js/question-spec-utils.js",
    "js/question-bank.js",
    "js/chinese-curriculum-data.js",
    "js/chinese-question-bank.js",
    "js/english-curriculum-data.js",
    "js/english-question-bank.js",
    "js/science-curriculum-data.js",
    "js/science-question-bank.js",
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
    "js/science-question-generator.js"
  ].forEach((file) => runFile(context, file));
  return context;
}

function allBanks(context) {
  return [
    { id: "math", label: "数学", bank: context.MathCampQuestionBank },
    { id: "chinese", label: "语文", bank: context.MathCampChineseQuestionBank },
    { id: "english", label: "英语", bank: context.MathCampEnglishQuestionBank },
    { id: "science", label: "科学", bank: context.MathCampScienceQuestionBank }
  ].filter((item) => item.bank && Array.isArray(item.bank.points));
}

function allPointMap(context) {
  const result = {};
  allBanks(context).forEach(({ id, bank }) => {
    bank.points.forEach((point) => {
      result[point.id] = { ...point, subject: id };
    });
  });
  return result;
}

function sourceFiles(context) {
  return [
    { grade: 2, module: context.MathCampGrade2ReferenceSourceMeta },
    { grade: 3, module: context.MathCampGrade3ReferenceSourceMeta },
    { grade: 4, module: context.MathCampGrade4ReferenceSourceMeta }
  ].flatMap(({ grade, module }) => (module?.files || []).map((file) => ({ ...file, grade })));
}

function collectModuleSeeds(context) {
  const modules = [
    { grade: 2, category: "reference", module: context.MathCampGrade2ReferenceQuestionSeeds },
    { grade: 2, category: "original", module: context.MathCampGrade2OriginalQuestionSeeds },
    { grade: 3, category: "reference", module: context.MathCampGrade3ReferenceQuestionSeeds },
    { grade: 3, category: "original", module: context.MathCampGrade3OriginalQuestionSeeds },
    { grade: 4, category: "reference", module: context.MathCampGrade4ReferenceQuestionSeeds },
    { grade: 4, category: "original", module: context.MathCampGrade4OriginalQuestionSeeds }
  ];
  const entries = [];
  const seenSeedIds = new Set();
  modules.forEach(({ grade, category, module }) => {
    Object.entries(module?.BANK || {}).forEach(([pointId, seeds]) => {
      (Array.isArray(seeds) ? seeds : []).forEach((seed) => {
        seenSeedIds.add(seed.id);
        entries.push({ grade, category, pointId, seed });
      });
    });
  });
  return { entries, seenSeedIds };
}

function collectCommonExternalSeeds(context, pointMap, seenSeedIds) {
  const external = context.MathCampExternalQuestionSeeds;
  if (!external?.forPoint) return [];
  return Object.values(pointMap).flatMap((point) => {
    return external.forPoint(point).filter((seed) => !seenSeedIds.has(seed.id)).map((seed) => ({
      grade: point.grade,
      category: "common",
      pointId: point.id,
      seed
    }));
  });
}

function normalizeQuestion(seed) {
  const prompt = seed.prompt || seed.text || seed.title || "";
  const answer = seed.answer !== undefined ? seed.answer : seed.correct;
  const type = seed.answerType || (seed.correct ? "choice" : "text");
  const options = Array.isArray(seed.wrongs) ? [seed.correct, ...seed.wrongs].filter(Boolean) : [];
  const source = seed.sourceMeta || {};
  return {
    id: seed.id || "",
    type,
    questionType: seed.questionType || seed.templateType || "",
    prompt,
    answer,
    options,
    explanation: seed.explanation || "",
    steps: Array.isArray(seed.steps) ? seed.steps : [],
    image: seed.image || seed.diagram || null,
    sourceName: source.sourceFile || source.name || "",
    sourceKind: source.kind || "",
    sourcePage: source.sourcePage || source.page || "",
    sourceNote: source.sourceNote || source.note || "",
    sourceQuality: source.quality || source.scanStatus || ""
  };
}

function groupBy(items, keyFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function templateQuestionDeps(index, answerMode = "auto") {
  return {
    state: { answerMode },
    pick: (items) => {
      const list = Array.isArray(items) ? items : [];
      return list.length ? list[index % list.length] : undefined;
    },
    shuffle: (items) => Array.isArray(items) ? items.slice() : []
  };
}

function collectTemplateQuestions(context, pointMap) {
  const generators = {
    chinese: context.MathCampChineseQuestionGenerator,
    english: context.MathCampEnglishQuestionGenerator,
    science: context.MathCampScienceQuestionGenerator
  };
  const entries = [];
  Object.values(pointMap).forEach((point) => {
    const generator = generators[point.subject];
    if (!generator?.makeQuestion || !generator?.questionTemplateCountForPoint) return;
    const count = generator.questionTemplateCountForPoint(point);
    for (let index = 0; index < count; index += 1) {
      const question = generator.makeQuestion(templateQuestionDeps(index), point, {});
      entries.push({
        grade: point.grade,
        category: "template",
        pointId: point.id,
        seed: {
          id: `${point.id}-template-${index + 1}`,
          answerType: question.answerType,
          questionType: question.questionType || question.templateType,
          prompt: question.prompt || question.text,
          answer: question.answerLabel || question.answer,
          explanation: question.explanation,
          steps: question.steps,
          sourceMeta: { kind: "localTemplate", name: `${subjectLabels[point.subject]}本地模板` }
        }
      });
    }
  });
  return entries;
}

function sortedPoints(points) {
  return points.slice().sort((a, b) => (a.grade - b.grade) || String(a.id).localeCompare(String(b.id)));
}

function renderPointSummary(context, pointMap, seedEntries, templateEntries) {
  const lines = [];
  lines.push("## 知识点总览");
  lines.push("");
  allBanks(context).forEach(({ id, label, bank }) => {
    lines.push(`### ${label}`);
    lines.push("");
    lines.push("| 年级 | 知识点 ID | 名称 | 主题 | 来源线 | 说明 | 静态题数 |");
    lines.push("| --- | --- | --- | --- | --- | --- | ---: |");
    sortedPoints(bank.points).forEach((point) => {
      const allStaticCount = seedEntries.filter((item) => item.pointId === point.id).length
        + templateEntries.filter((item) => item.pointId === point.id).length;
      lines.push(`| ${point.grade} | ${mdEscape(point.id)} | ${mdEscape(point.label)} | ${mdEscape(point.topic)} | ${mdEscape(point.sourceType || "abilityLine")} | ${mdEscape(point.helper || point.curriculum?.focus || "")} | ${allStaticCount} |`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

function renderSourceSummary(files) {
  const lines = [];
  lines.push("## 参考资料来源清单");
  lines.push("");
  lines.push("这里只记录可维护元数据，不把 `Reference/` 原始资料打包进应用。");
  lines.push("");
  lines.push("| 年级 | 学科 | 文件 | 页数 | 抽取状态 | 用途 | 备注 |");
  lines.push("| --- | --- | --- | ---: | --- | --- | --- |");
  files.sort((a, b) => (a.grade - b.grade) || String(a.subject).localeCompare(String(b.subject))).forEach((file) => {
    lines.push(`| ${file.grade} | ${subjectLabels[file.subject] || file.subject} | ${mdEscape(file.fileName)} | ${file.pages || ""} | ${mdEscape(file.extractStatus)} | ${mdEscape((file.usableFor || []).join("、"))} | ${mdEscape(file.note)} |`);
  });
  lines.push("");
  return lines.join("\n");
}

function renderSeedEntries(title, entries, pointMap) {
  const lines = [];
  lines.push(`## ${title}`);
  lines.push("");
  const bySubject = groupBy(entries, (item) => subjectOfPoint(item.pointId, pointMap[item.pointId]));
  ["math", "chinese", "english", "science"].forEach((subject) => {
    const subjectEntries = bySubject.get(subject) || [];
    if (!subjectEntries.length) return;
    lines.push(`### ${subjectLabels[subject]}`);
    lines.push("");
    const byPoint = groupBy(subjectEntries, (item) => item.pointId);
    Array.from(byPoint.keys()).sort((a, b) => {
      const pa = pointMap[a] || {};
      const pb = pointMap[b] || {};
      return (Number(pa.grade || 0) - Number(pb.grade || 0)) || a.localeCompare(b);
    }).forEach((pointId) => {
      const point = pointMap[pointId] || { id: pointId, label: pointId, grade: "" };
      const items = byPoint.get(pointId);
      lines.push(`#### ${point.grade ? `${point.grade} 年级 ` : ""}${point.label || pointId}（${pointId}，${items.length} 题）`);
      lines.push("");
      items.forEach((item, index) => {
        const q = normalizeQuestion(item.seed);
        const sourceParts = [
          sourceCategoryLabels[item.category],
          q.sourceName,
          q.sourcePage ? `第 ${q.sourcePage} 页` : "",
          q.sourceQuality
        ].filter(Boolean).join(" / ");
        lines.push(`${index + 1}. **${q.questionType || q.type || "题目"}** \`${q.id}\``);
        lines.push(`   - 来源：${sourceParts || sourceCategoryLabels[item.category] || "未标注"}`);
        lines.push(`   - 题面：${oneLine(q.prompt, 500)}`);
        if (q.options.length) lines.push(`   - 选项：${q.options.map((option) => oneLine(option, 80)).join("；")}`);
        lines.push(`   - 答案：${oneLine(q.answer, 160)}`);
        if (q.explanation) lines.push(`   - 解析：${oneLine(q.explanation, 360)}`);
        if (q.steps.length) lines.push(`   - 步骤：${q.steps.map((step) => oneLine(step, 120)).join(" / ")}`);
        if (q.image?.src) {
          const src = String(q.image.src).startsWith("assets/") ? `../${q.image.src}` : q.image.src;
          lines.push(`   - 图片：![${q.image.alt || q.id}](${src})`);
        }
      });
      lines.push("");
    });
  });
  return lines.join("\n");
}

function renderStats(context, pointMap, seedEntries, templateEntries) {
  const allEntries = [...seedEntries, ...templateEntries];
  const lines = [];
  lines.push("# 喵喵学习题库阅读文档");
  lines.push("");
  lines.push(`生成日期：${generatedAt}`);
  lines.push("");
  lines.push("本文档由 `node scripts/generate-readable-docs.js` 自动生成，便于阅读和维护题库。");
  lines.push("");
  lines.push("范围说明：");
  lines.push("");
  lines.push("- 包含：知识点、语文/英语/科学本地模板题、参考资料派生题、原创扩展题、公共扩展题源。");
  lines.push("- 不包含：数学运行时公式生成的无限变体、练习过程中的临时题、特殊动态生成题。");
  lines.push("- 维护隔离：参考资料派生题和原创扩展题按来源分类展示，便于后续单独维护。");
  lines.push("");
  lines.push("## 总量概览");
  lines.push("");
  lines.push("| 学科 | 知识点数 | 学科模板题 | 参考资料派生题 | 原创扩展题 | 公共扩展题 | 静态题合计 |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  ["math", "chinese", "english", "science"].forEach((subject) => {
    const points = Object.values(pointMap).filter((point) => point.subject === subject);
    const count = (category) => allEntries.filter((entry) => entry.category === category && subjectOfPoint(entry.pointId, pointMap[entry.pointId]) === subject).length;
    const template = count("template");
    const reference = count("reference");
    const original = count("original");
    const common = count("common");
    lines.push(`| ${subjectLabels[subject]} | ${points.length} | ${template} | ${reference} | ${original} | ${common} | ${template + reference + original + common} |`);
  });
  lines.push("");
  lines.push("## 抽题比例说明");
  lines.push("");
  lines.push("普通练习中，扩展题不再使用固定概率，而是按知识点库存比例抽取：");
  lines.push("");
  lines.push("```text");
  lines.push("扩展题抽取概率 = 扩展题数量 / (扩展题数量 + 本地基础模板数量)");
  lines.push("```");
  lines.push("");
  lines.push("因此某个知识点的参考资料派生题越多，练习中抽到这些题的比例也越高。语文写作/看图写话类知识点保持文字输入题型，不混入选择型扩展题。");
  lines.push("");
  return lines.join("\n");
}

function renderQuestionDoc(context) {
  const pointMap = allPointMap(context);
  const { entries: moduleSeeds, seenSeedIds } = collectModuleSeeds(context);
  const commonSeeds = collectCommonExternalSeeds(context, pointMap, seenSeedIds);
  const templateEntries = collectTemplateQuestions(context, pointMap);
  const seedEntries = [...moduleSeeds, ...commonSeeds];
  return [
    renderStats(context, pointMap, seedEntries, templateEntries),
    renderSourceSummary(sourceFiles(context)),
    renderPointSummary(context, pointMap, seedEntries, templateEntries),
    renderSeedEntries("学科模板题（语文 / 英语 / 科学）", templateEntries, pointMap),
    renderSeedEntries("参考资料派生题、原创扩展题与公共扩展题", seedEntries, pointMap)
  ].join("\n");
}

function renderQuestionIndexDoc(context) {
  const pointMap = allPointMap(context);
  const { entries: moduleSeeds, seenSeedIds } = collectModuleSeeds(context);
  const commonSeeds = collectCommonExternalSeeds(context, pointMap, seenSeedIds);
  const templateEntries = collectTemplateQuestions(context, pointMap);
  const entries = [...moduleSeeds, ...commonSeeds, ...templateEntries];
  const lines = [];

  lines.push("# 喵喵学习题库索引");
  lines.push("");
  lines.push(`生成日期：${generatedAt}`);
  lines.push("");
  lines.push("这是轻量版题库索引，只展示分类、数量和维护入口；逐题题面请看 `docs/题库文档.md`。");
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 学科 | 年级范围 | 知识点数 | 静态题数 | 参考资料派生 | 原创扩展 | 公共扩展 | 本地模板 |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  ["math", "chinese", "english", "science"].forEach((subject) => {
    const points = Object.values(pointMap).filter((point) => point.subject === subject);
    const grades = [...new Set(points.map((point) => point.grade).filter(Boolean))].sort((a, b) => a - b);
    const subjectEntries = entries.filter((entry) => subjectOfPoint(entry.pointId, pointMap[entry.pointId]) === subject);
    const count = (category) => subjectEntries.filter((entry) => entry.category === category).length;
    lines.push(`| ${subjectLabels[subject]} | ${grades.join("、")} | ${points.length} | ${subjectEntries.length} | ${count("reference")} | ${count("original")} | ${count("common")} | ${count("template")} |`);
  });

  lines.push("");
  lines.push("## 年级与来源分布");
  lines.push("");
  lines.push("| 年级 | 学科 | 参考资料派生 | 原创扩展 | 公共扩展 | 本地模板 | 合计 |");
  lines.push("| ---: | --- | ---: | ---: | ---: | ---: | ---: |");
  [1, 2, 3, 4, 5, 6].forEach((grade) => {
    ["math", "chinese", "english", "science"].forEach((subject) => {
      const subjectEntries = entries.filter((entry) => {
        const point = pointMap[entry.pointId] || {};
        return Number(entry.grade || point.grade) === grade && subjectOfPoint(entry.pointId, point) === subject;
      });
      if (!subjectEntries.length) return;
      const count = (category) => subjectEntries.filter((entry) => entry.category === category).length;
      lines.push(`| ${grade} | ${subjectLabels[subject]} | ${count("reference")} | ${count("original")} | ${count("common")} | ${count("template")} | ${subjectEntries.length} |`);
    });
  });

  lines.push("");
  lines.push("## 题量最多的知识点");
  lines.push("");
  lines.push("| 排名 | 年级 | 学科 | 知识点 | 题数 | 来源构成 |");
  lines.push("| ---: | ---: | --- | --- | ---: | --- |");
  const byPoint = Array.from(groupBy(entries, (entry) => entry.pointId).entries())
    .map(([pointId, pointEntries]) => {
      const point = pointMap[pointId] || {};
      const count = (category) => pointEntries.filter((entry) => entry.category === category).length;
      return {
        pointId,
        point,
        total: pointEntries.length,
        sourceText: [
          `参考 ${count("reference")}`,
          `原创 ${count("original")}`,
          `公共 ${count("common")}`,
          `模板 ${count("template")}`
        ].join(" / ")
      };
    })
    .sort((a, b) => b.total - a.total || String(a.pointId).localeCompare(String(b.pointId)))
    .slice(0, 40);
  byPoint.forEach((item, index) => {
    lines.push(`| ${index + 1} | ${item.point.grade || ""} | ${subjectLabels[item.point.subject] || subjectOfPoint(item.pointId, item.point)} | ${mdEscape(item.point.label || item.pointId)}（${mdEscape(item.pointId)}） | ${item.total} | ${mdEscape(item.sourceText)} |`);
  });

  lines.push("");
  lines.push("## 维护入口");
  lines.push("");
  lines.push("- 参考资料派生题：`js/grade*-reference-question-seeds.js`");
  lines.push("- 原创扩展题：`js/grade*-original-question-seeds.js`");
  lines.push("- 参考资料来源元数据：`js/grade*-reference-source-meta.js`");
  lines.push("- 逐页扫描索引：`js/grade*-reference-scan-index.js`");
  lines.push("- 完整逐题阅读：`docs/题库文档.md`");
  lines.push("");
  return lines.join("\n");
}

function renderAndroidBuildDoc() {
  return `# Android 构建说明

生成日期：${generatedAt}

Web 根目录是主源，Android WebView 目录只是镜像：\`android/app/src/main/assets/www/\`。改动 \`index.html\`、\`css/\`、\`js/\`、\`assets/\` 后，先同步再构建。

## 常用命令

\`\`\`powershell
$ErrorActionPreference = 'Stop'
pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync-android-assets.ps1
npm run sync:android:check
\`\`\`

## 调试构建

\`\`\`powershell
$ErrorActionPreference = 'Stop'
Set-Location android
./gradlew.bat assembleDebug
\`\`\`

输出通常在：

- \`android/app/build/outputs/apk/debug/app-debug.apk\`

## 发布构建

\`\`\`powershell
$ErrorActionPreference = 'Stop'
Set-Location android
./gradlew.bat assembleRelease
\`\`\`

输出通常在：

- \`android/app/build/outputs/apk/release/app-release.apk\`

发布包是否可直接安装，取决于 Android 项目的签名配置。若本机没有 release keystore，需要先补齐签名配置，或使用 debug 包做本地安装测试。

## 构建前检查

- 运行 \`npm test\`，确认题库、页面结构和浏览器冒烟测试通过。
- 运行 \`npm run sync:android:check\`，确认 Web 与 Android 镜像一致。
- 不要把 \`Reference/\` 原始 PDF 或 \`tmp/\` 中间产物打包进应用。
- 生成 APK 后，确认 \`.gitignore\` 仍然忽略构建产物，避免误提交大文件。
`;
}

function renderDevelopmentDoc() {
  return `# 喵喵学习开发文档

生成日期：${generatedAt}

本文档用于以后继续开发、扩题、测试和打包时快速理解项目。可通过 \`npm run docs:generate\` 重新生成。

## 项目定位

喵喵学习是离线优先的小学多学科练习应用。Web 与 Android 共用同一套前端静态资源，题库、抽题、判分、报告、宠物奖励都在前端完成。

## 运行方式

\`\`\`powershell
$ErrorActionPreference = 'Stop'
npm test
npm run docs:generate
npm run sync:android:check
\`\`\`

项目没有打包器，\`index.html\` 直接按顺序加载 \`js/*.js\`。改动脚本顺序时必须同步检查 \`index.html\` 和 Android 镜像。

## 目录结构

- \`index.html\`：主页面、练习、报告、宠物空间、设置入口。
- \`css/\`：主题、响应式布局、练习界面和特效样式。
- \`js/\`：所有业务模块和题库模块。
- \`assets/\`：音频、图片和参考资料截图资源。
- \`android/app/src/main/assets/www/\`：Android WebView 使用的 Web 镜像。
- \`scripts/\`：文档生成、题库覆盖率、Android 镜像检查脚本。
- \`tests/\`：Node 与浏览器冒烟测试。
- \`Reference/\`：用户提供的原始参考资料，不打包、不提交到应用题库。
- \`tmp/\`：临时抽取、截图、扫描中间产物，不作为应用源文件维护。

## 关键模块

### 应用主控

- \`js/app.js\`：全局状态、学生档案、DOM 绑定、练习开始/提交/下一题、错题、报告、宠物、打印、导入导出。
- \`js/storage.js\`：本地存储读写包装。
- \`js/runtime-config.js\`：运行时默认配置。
- \`js/cloud-sync.js\`：云同步配置和状态摘要。

### 学科与题库

- \`js/question-bank.js\`：数学知识点、课程映射和主题。
- \`js/chinese-question-bank.js\`：语文知识点、教材来源线、课内/推荐读物/原创拓展点。
- \`js/english-question-bank.js\`：英语知识点。
- \`js/science-question-bank.js\`：科学知识点。
- \`js/subject-registry.js\`：多学科注册、学科状态归一化。

### 题目生成

- \`js/question-generator.js\`：统一入口，按学科分发到对应生成器，并接入扩展题源。
- \`js/math-question-makers.js\`：数学运行时生成器，负责计算、应用、图形、思维类动态题。
- \`js/chinese-question-generator.js\`：语文模板题。
- \`js/english-question-generator.js\`：英语模板题。
- \`js/science-question-generator.js\`：科学模板题。
- \`js/external-question-seeds.js\`：统一扩展题源入口，合并参考资料派生题和原创扩展题。
- \`js/grade*-reference-question-seeds.js\`：按年级隔离的参考资料派生题。
- \`js/grade*-original-question-seeds.js\`：按年级隔离的原创扩展题。

### 练习与判分

- \`js/practice-engine.js\`：自适应/每日练习组卷逻辑。
- \`js/question-rules-engine.js\`：题目质量规则，防止专项练习混入不合规题。
- \`js/question-interaction.js\`：选择、判断、输入、分步作答等交互模式。
- \`js/question-spec-utils.js\`：选择题选项布局、答案归一化工具。

### 报告与奖励

- \`js/learning-insights.js\`：薄弱点和学习洞察。
- \`js/report.js\`：报告渲染。
- \`js/pet.js\`、\`js/pet-economy.js\`、\`js/pet-dressup-meta.js\`：宠物成长、奖励、装扮馆。
- \`js/home-route.js\`：首页学习路线。

## 抽题流程

1. 用户选择学科、年级、知识点、题量和答题方式。
2. \`startNewSet\` / \`startSmartDailyPractice\` / \`startChallengeSet\` 进入组卷。
3. 专项练习调用 \`buildQuestionSetForPoint\`，自适应练习调用 \`practice-engine.js\`。
4. \`makeStrictQuestionForPoint\` 生成符合知识点规则的题。
5. \`question-generator.js\` 根据 \`point.id\` 前缀分发：
   - \`c\`：语文
   - \`e\`：英语
   - \`s\`：科学
   - 其他：数学
6. 题目经过 \`ensureQuestionMatchesRule\` 和 \`applyQuestionInteraction\` 后进入界面。

## 扩展题抽取规则

扩展题现在按知识点库存比例抽取：

\`\`\`text
扩展题抽取概率 = 扩展题数量 / (扩展题数量 + 本地基础模板数量)
\`\`\`

维护点：

- \`externalQuestionCountForPoint(point)\` 统计扩展题数量。
- \`localQuestionTemplateCountForPoint(point)\` 统计本地模板数量。
- 语文、英语、科学生成器暴露 \`questionTemplateCountForPoint(point)\`。
- 数学动态生成题按 1 个基础模板参与比例，因为数学运行时题是公式生成，不是静态题库。
- 语文写作/看图写话点不混入选择型扩展题，避免破坏文本输入题型。

## 扩题规范

### 参考资料派生题

新增或修改文件：

- \`js/grade2-reference-source-meta.js\`
- \`js/grade2-reference-question-seeds.js\`
- \`js/grade3-reference-source-meta.js\`
- \`js/grade3-reference-question-seeds.js\`
- \`js/grade4-reference-source-meta.js\`
- \`js/grade4-reference-question-seeds.js\`

要求：

- 保留 \`sourceMeta.kind = referenceDerived\`。
- 标注 \`sourceId\`、\`sourceFile\`、\`sourcePage\`、\`quality\`。
- 看不清的扫描题跳过或只按题型结构原创改写。
- 需要图片时使用 \`assets/reference/grade*/...\`，不要引用 \`Reference/\` 原始 PDF。

### 原创扩展题

新增或修改：

- \`js/grade*-original-question-seeds.js\`

要求：

- 与参考资料派生题隔离维护。
- \`sourceMeta.kind\` 使用原创或题型参考相关标记。
- 题面、答案、解析、步骤必须完整。

### 公共扩展题源

新增或修改：

- \`js/external-question-seeds.js\`

适合放跨年级、开放资源、通用题型参考的少量题源。

## Android 同步

Web 根目录是主源，Android 目录是镜像。改动以下文件后要同步到 \`android/app/src/main/assets/www/\`：

- \`index.html\`
- \`css/**\`
- \`js/**\`
- \`assets/**\`

检查命令：

\`\`\`powershell
$ErrorActionPreference = 'Stop'
npm run sync:android:check
\`\`\`

已有脚本 \`scripts/sync-android-assets.ps1\` 可用于同步资源。若手工复制，必须再跑同步检查。

## 测试说明

- \`npm test\`：完整验证。
- \`npm run test:questions\`：题库、答案模式、学科隔离和覆盖率。
- \`npm run test:rules\`：题目规则、抽题、交互和数据边界。
- \`npm run test:layout\`：页面结构、脚本加载顺序、Android 镜像一致性。
- \`npm run test:browser\`：浏览器冒烟测试。
- \`npm run sync:android:check\`：Android 静态资源镜像检查。

## 文档生成

\`\`\`powershell
$ErrorActionPreference = 'Stop'
npm run docs:generate
\`\`\`

生成：

- \`docs/题库文档.md\`
- \`docs/题库索引.md\`
- \`docs/开发文档.md\`
- \`docs/Android构建说明.md\`

## 维护辅助脚本

\`\`\`powershell
$ErrorActionPreference = 'Stop'
npm run reference:inventory
npm run assets:report
\`\`\`

- \`reference:inventory\`：扫描 \`Reference/\` 原始资料目录，输出 \`docs/参考资料清单.md\` 和 \`tmp/reference-inventory.json\`。
- \`assets:report\`：统计应用资源体积，输出 \`docs/资源优化报告.md\`，用于后续压缩图片、清理超大资源。

## 常见开发任务

### 新增一个知识点

1. 在对应 \`*-question-bank.js\` 中新增 point。
2. 在对应生成器中增加模板或在扩展题源中增加 seeds。
3. 跑 \`npm run test:questions\` 和 \`npm run test:rules\`。
4. 如果改了 Web 资源，同步 Android 并跑 \`npm run sync:android:check\`。

### 新增一批参考资料题

1. 在 \`grade*-reference-source-meta.js\` 登记资料来源。
2. 在 \`grade*-reference-question-seeds.js\` 按 pointId 加题。
3. 保持图片资源在 \`assets/reference/grade*/\`。
4. 运行文档生成脚本更新 \`docs/题库文档.md\`。
5. 运行完整测试。

### 调整抽题比例

优先改 \`js/app.js\` 中的 \`externalQuestionChanceForPoint\`。不要在题源文件里写概率，题源只维护库存和来源。

## 维护注意事项

- 不要把 \`Reference/\` 原始 PDF 打包进应用。
- 不要把 \`tmp/\` 中间产物当作长期源文件。
- 参考资料派生题和原创扩展题必须分文件维护。
- 改 \`js/*.js\` 或 \`index.html\` 后通常要同步 Android 镜像。
- 新增题目必须能通过 \`question-rules.test.js\`，尤其是答案、解析、步骤和学科隔离。
`;
}

function main() {
  ensureDir(docsDir);
  const context = makeContext();
  const questionDoc = renderQuestionDoc(context);
  const questionIndexDoc = renderQuestionIndexDoc(context);
  const developmentDoc = renderDevelopmentDoc();
  const androidBuildDoc = renderAndroidBuildDoc();
  fs.writeFileSync(path.join(docsDir, "题库文档.md"), questionDoc, "utf8");
  fs.writeFileSync(path.join(docsDir, "题库索引.md"), questionIndexDoc, "utf8");
  fs.writeFileSync(path.join(docsDir, "开发文档.md"), developmentDoc, "utf8");
  fs.writeFileSync(path.join(docsDir, "Android构建说明.md"), androidBuildDoc, "utf8");
  console.log("Generated docs/题库文档.md");
  console.log("Generated docs/题库索引.md");
  console.log("Generated docs/开发文档.md");
  console.log("Generated docs/Android构建说明.md");
}

main();
