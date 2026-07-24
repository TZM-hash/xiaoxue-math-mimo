const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

// 数学每个知识点的最低有效题量门槛。数学没有本地模板生成器，全部依赖
// external 种子；低于该值说明该知识点接近空缺，应补题后再发布。
const MATH_MIN_EFFECTIVE = 6;

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function createContext() {
  const context = { console, window: {}, Math, Date, setTimeout() {}, clearTimeout() {} };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  const files = [
    "js/question-spec-utils.js",
    "js/learning-quality-engine.js",
    "js/question-quality-audit.js",
    "js/question-bank.js",
    "js/chinese-curriculum-data.js",
    "js/chinese-question-bank.js",
    "js/english-curriculum-data.js",
    "js/english-question-bank.js",
    "js/science-curriculum-data.js",
    "js/science-question-bank.js"
  ];
  for (let grade = 2; grade <= 6; grade += 1) {
    files.push(
      `js/grade${grade}-reference-source-meta.js`,
      `js/grade${grade}-reference-scan-index.js`,
      `js/grade${grade}-reference-question-seeds.js`,
      `js/grade${grade}-original-question-seeds.js`
    );
  }
  files.push(
    "js/external-question-seeds.js",
    "js/chinese-question-generator.js",
    "js/english-question-generator.js",
    "js/science-question-generator.js"
  );
  files.forEach((file) => vm.runInContext(read(file), context, { filename: file }));
  return context;
}

function termBucket(point) {
  const term = String(point?.curriculum?.term || point?.term || "");
  const upper = term.includes("上");
  const lower = term.includes("下");
  if (upper && !lower) return "upper";
  if (lower && !upper) return "lower";
  return "year";
}

function subjectForPoint(point) {
  if (point?.subject) return point.subject;
  const id = String(point?.id || "");
  if (/^c\d-/.test(id)) return "chinese";
  if (/^e\d-/.test(id)) return "english";
  if (/^s\d-/.test(id)) return "science";
  return "math";
}

function canonicalType(subject, point, question) {
  const type = String(question?.questionType || question?.templateType || "");
  if (subject === "math") return point.topic || "other";
  if (subject === "chinese") return point.topic || "other";
  if (subject === "english") return point.topic || "other";
  if (/数据|图表|记录/.test(type)) return "data";
  if (/模型|工程|设计|优化/.test(type)) return "model-engineering";
  if (/步骤|顺序|过程/.test(type)) return "sequence";
  if (/实验|变量|公平/.test(type)) return "experiment";
  if (/证据|推理|解释/.test(type)) return "evidence";
  return "concept-observation";
}

function inferredDifficulty(point, question) {
  const explicit = Number(question?.difficultyScore || question?.difficulty || question?.learningMeta?.difficultyScore);
  if (explicit >= 1 && explicit <= 5) return explicit;
  const topic = String(point?.topic || "");
  const textLength = String(question?.text || question?.prompt || "").length;
  if (["appendix", "thinking", "inquiry", "engineering"].includes(topic) || textLength > 150) return 4;
  if (["word", "reading", "geometry", "statistics", "writing"].includes(topic) || textLength > 70) return 3;
  return 2;
}

function localQuestions(context, point) {
  const subject = subjectForPoint(point);
  const generators = {
    chinese: context.MathCampChineseQuestionGenerator,
    english: context.MathCampEnglishQuestionGenerator,
    science: context.MathCampScienceQuestionGenerator
  };
  const generator = generators[subject];
  if (!generator?.makeQuestion || !generator?.questionTemplateCountForPoint) return [];
  const count = generator.questionTemplateCountForPoint(point);
  return Array.from({ length: count }, (_, index) => generator.makeQuestion({
    state: { answerMode: "auto" },
    pick: (items) => items[index % items.length],
    shuffle: (items) => items.slice(),
    uid: () => `${point.id}-audit-${index + 1}`
  }, point, {}));
}

function questionContentKey(context, question) {
  if (question?.enrichment && context.MathCampExternalQuestionSeeds?.seedContentKey) {
    return context.MathCampExternalQuestionSeeds.seedContentKey(question);
  }
  const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  return JSON.stringify({
    text: normalize(question?.text || question?.prompt),
    answer: normalize(question?.answer ?? question?.correct),
    answerType: question?.answerType || "text",
    diagram: question?.diagram || null,
    sourceImage: question?.sourceImage || null
  });
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function buildAudit() {
  const context = createContext();
  const banks = {
    math: context.MathCampQuestionBank,
    chinese: context.MathCampChineseQuestionBank,
    english: context.MathCampEnglishQuestionBank,
    science: context.MathCampScienceQuestionBank
  };
  const rows = [];
  const gaps = [];

  Object.entries(banks).forEach(([subject, bank]) => {
    const grades = [...new Set(bank.points.map((point) => Number(point.grade)))].sort((a, b) => a - b);
    grades.forEach((grade) => {
      const points = bank.points.filter((point) => Number(point.grade) === grade);
      const entries = [];
      let rawExternal = 0;
      let effectiveExternal = 0;
      points.forEach((point) => {
        const raw = context.MathCampExternalQuestionSeeds.rawForPoint(point);
        const effective = context.MathCampExternalQuestionSeeds.forPoint(point);
        const local = localQuestions(context, point);
        rawExternal += raw.length;
        effectiveExternal += effective.length;
        effective.forEach((question) => entries.push({ point, question, source: "external" }));
        local.forEach((question) => entries.push({ point, question, source: "template" }));

        const externalKeys = effective.map((question) => context.MathCampExternalQuestionSeeds.seedContentKey(question));
        const localKeys = local.map((question) => questionContentKey(context, question));
        if (new Set(externalKeys).size !== externalKeys.length || new Set(localKeys).size !== localKeys.length) {
          gaps.push({ level: "medium", subject, grade, pointId: point.id, message: "point runtime pool contains duplicate content" });
        }

        const bucket = termBucket(point);
        const minimum = subject === "chinese" ? 4 : subject === "science" ? 10 : 8;
        if (bucket !== "year" && subject !== "math" && local.length < minimum) {
          gaps.push({ level: "high", subject, grade, pointId: point.id, message: `term point has fewer than ${minimum} local templates` });
        }

        // 数学没有本地模板生成器，题目完全来自 external 种子。
        // 这里补一条“每个数学知识点至少要有 MATH_MIN_EFFECTIVE 道有效题”的检查，
        // 防止出现空知识点或题量极少的知识点悄悄进入发布（历史上一年级曾出现空点）。
        if (subject === "math" && effective.length < MATH_MIN_EFFECTIVE) {
          gaps.push({ level: "high", subject, grade, pointId: point.id, message: `math point has only ${effective.length} effective questions (minimum ${MATH_MIN_EFFECTIVE})` });
        }
      });
      const contentKeys = entries.map((entry) => questionContentKey(context, entry.question));
      const effectiveUnique = new Set(contentKeys).size;
      const localEntries = entries.filter((entry) => entry.source === "template");
      const localTerms = countBy(localEntries, (entry) => termBucket(entry.point));
      const effectiveTerms = countBy(entries, (entry) => termBucket(entry.point));
      const upper = localTerms.upper || 0;
      const lower = localTerms.lower || 0;
      if (upper && lower) {
        const ratio = upper / lower;
        if (ratio < 0.8 || ratio > 1.25) {
          gaps.push({ level: "high", subject, grade, message: `local upper/lower ratio is ${ratio.toFixed(2)}` });
        }
      }
      const effectiveUpper = effectiveTerms.upper || 0;
      const effectiveLower = effectiveTerms.lower || 0;
      if (effectiveUpper && effectiveLower) {
        const ratio = effectiveUpper / effectiveLower;
        if (ratio < 0.8 || ratio > 1.25) {
          gaps.push({ level: "high", subject, grade, message: `effective upper/lower ratio is ${ratio.toFixed(2)}` });
        }
      }
      if (subject === "chinese") {
        const unitTemplates = countBy(localEntries.filter((entry) => termBucket(entry.point) !== "year"), (entry) => {
          return `${entry.point.curriculum.term}/${entry.point.curriculum.unit}`;
        });
        Object.entries(unitTemplates).forEach(([unit, count]) => {
          if (count < 10) gaps.push({ level: "high", subject, grade, message: `${unit} has fewer than 10 local templates` });
        });
      }
      const qualityAudit = context.MathCampQuestionQualityAudit.auditQuestions(entries.map((entry) => ({
        ...entry.question,
        grade: entry.question?.grade || entry.point.grade,
        subject: entry.question?.subject || subject,
        pointId: entry.question?.pointId || entry.point.id,
        difficultyScore: inferredDifficulty(entry.point, entry.question)
      })));
      if (qualityAudit.counts.high) {
        const samples = qualityAudit.rows.filter((row) => row.highestSeverity === "high").slice(0, 5)
          .map((row) => `${row.id || "unknown"}:${row.issues.filter((item) => item.severity === "high").map((item) => item.code).join("+")}`)
          .join(", ");
        gaps.push({ level: "high", subject, grade, message: `${qualityAudit.counts.high} effective questions have blocking answer or option issues (${samples})` });
      }
      const difficultyTypes = countBy(qualityAudit.rows, (row) => {
        const difficulty = Number(row.difficulty) || 3;
        return difficulty <= 2 ? "basic" : difficulty >= 4 ? "challenge" : "standard";
      });
      rows.push({
        subject,
        grade,
        points: points.length,
        pointTerms: countBy(points, termBucket),
        rawExternal,
        effectiveExternal,
        removedExternalDuplicates: rawExternal - effectiveExternal,
        localTemplates: localEntries.length,
        effectiveQuestions: entries.length,
        effectiveUnique,
        crossPointOverlaps: entries.length - effectiveUnique,
        localTerms,
        effectiveTerms,
        canonicalTypes: countBy(entries, (entry) => canonicalType(subject, entry.point, entry.question)),
        answerTypes: countBy(entries, (entry) => entry.question?.answerType || "text"),
        difficultyTypes,
        qualityAverage: qualityAudit.averageScore
      });
    });
  });
  return { generatedAt: new Date().toISOString(), rows, gaps };
}

function compactCounts(counts) {
  return Object.entries(counts || {}).map(([key, value]) => `${key}:${value}`).join(", ");
}

function formatAudit(report) {
  const lines = [
    "Question bank audit",
    "subject | grade | points | raw external | effective external | local | unique | cross-point overlap | effective terms | local terms | canonical types | difficulty | quality",
    "------- | ----- | ------ | ------------ | ------------------ | ----- | ------ | ------------------- | --------------- | ----------- | --------------- | ---------- | -------"
  ];
  report.rows.forEach((row) => {
    lines.push([
      row.subject,
      row.grade,
      row.points,
      row.rawExternal,
      row.effectiveExternal,
      row.localTemplates,
      row.effectiveUnique,
      row.crossPointOverlaps,
      compactCounts(row.effectiveTerms),
      compactCounts(row.localTerms),
      compactCounts(row.canonicalTypes),
      compactCounts(row.difficultyTypes),
      row.qualityAverage
    ].join(" | "));
  });
  const high = report.gaps.filter((gap) => gap.level === "high").length;
  const medium = report.gaps.filter((gap) => gap.level === "medium").length;
  lines.push("", `gaps: high=${high}, medium=${medium}`);
  report.gaps.forEach((gap) => lines.push(`- [${gap.level}] ${gap.subject}-${gap.grade}${gap.pointId ? ` ${gap.pointId}` : ""}: ${gap.message}`));
  return lines.join("\n");
}

if (require.main === module) {
  const report = buildAudit();
  console.log(formatAudit(report));
  if (process.argv.includes("--strict") && report.gaps.some((gap) => gap.level === "high")) process.exitCode = 1;
}

module.exports = { buildAudit, formatAudit, termBucket, canonicalType, inferredDifficulty };
