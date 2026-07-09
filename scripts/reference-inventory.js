const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const referenceDir = path.join(root, "Reference");
const docsDir = path.join(root, "docs");
const tmpDir = path.join(root, "tmp");

const subjectHints = [
  { id: "math", label: "数学", keywords: ["数学", "奥数", "公式", "应用题", "计算", "统计图", "培优"] },
  { id: "chinese", label: "语文", keywords: ["语文", "看图写话", "默写", "课文"] },
  { id: "english", label: "英语", keywords: ["英语", "PEP", "人教版"] },
  { id: "science", label: "科学", keywords: ["科学"] }
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function posixRelative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function inferGrade(relativePath) {
  const match = relativePath.match(/(?:^|\/)grade(\d+)(?:\/|$)/i);
  return match ? Number(match[1]) : "";
}

function inferSubject(fileName) {
  const hit = subjectHints.find((item) => item.keywords.some((keyword) => fileName.includes(keyword)));
  return hit ? hit.id : "unknown";
}

function subjectLabel(subject) {
  const hit = subjectHints.find((item) => item.id === subject);
  return hit ? hit.label : "未识别";
}

function estimatePdfPages(filePath) {
  try {
    const text = fs.readFileSync(filePath).toString("latin1");
    const matches = text.match(/\/Type\s*\/Page\b/g);
    return matches ? matches.length : "";
  } catch (_) {
    return "";
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function inventory() {
  return walk(referenceDir).sort((a, b) => a.localeCompare(b, "zh-CN")).map((filePath) => {
    const stat = fs.statSync(filePath);
    const relativePath = posixRelative(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase() || "unknown";
    const fileName = path.basename(filePath);
    return {
      path: relativePath,
      fileName,
      grade: inferGrade(relativePath),
      subject: inferSubject(fileName),
      extension: ext,
      size: stat.size,
      sizeLabel: formatBytes(stat.size),
      estimatedPages: ext === "pdf" ? estimatePdfPages(filePath) : "",
      updatedAt: stat.mtime.toISOString()
    };
  });
}

function renderMarkdown(items) {
  const generatedAt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const lines = [];
  lines.push("# 参考资料清单");
  lines.push("");
  lines.push(`生成日期：${generatedAt}`);
  lines.push("");
  lines.push("本文档由 `npm run reference:inventory` 自动生成，只盘点 `Reference/` 原始资料，不代表这些资料已经全部入库。");
  lines.push("");
  lines.push(`- 文件数：${items.length}`);
  lines.push(`- 总体积：${formatBytes(totalSize)}`);
  lines.push("");
  lines.push("## 年级汇总");
  lines.push("");
  lines.push("| 年级 | 文件数 | PDF页数估算 | 体积 |");
  lines.push("| ---: | ---: | ---: | ---: |");
  const grades = [...new Set(items.map((item) => item.grade || "未识别"))].sort((a, b) => Number(a) - Number(b));
  grades.forEach((grade) => {
    const group = items.filter((item) => (item.grade || "未识别") === grade);
    const pages = group.reduce((sum, item) => sum + (Number(item.estimatedPages) || 0), 0);
    const size = group.reduce((sum, item) => sum + item.size, 0);
    lines.push(`| ${grade} | ${group.length} | ${pages || ""} | ${formatBytes(size)} |`);
  });
  lines.push("");
  lines.push("## 文件明细");
  lines.push("");
  lines.push("| 年级 | 学科识别 | 类型 | 页数估算 | 体积 | 路径 |");
  lines.push("| ---: | --- | --- | ---: | ---: | --- |");
  items.forEach((item) => {
    lines.push(`| ${item.grade || ""} | ${subjectLabel(item.subject)} | ${item.extension} | ${item.estimatedPages || ""} | ${item.sizeLabel} | \`${item.path}\` |`);
  });
  lines.push("");
  lines.push("## 使用说明");
  lines.push("");
  lines.push("- 页数是对 PDF 结构的快速估算，扫描件或特殊编码 PDF 可能不完全准确。");
  lines.push("- 入库进度仍以 `js/grade*-reference-source-meta.js`、`js/grade*-reference-scan-index.js` 和题源文件为准。");
  lines.push("- 五、六年级资料会被清单记录，但当前不会自动加入二到四年级题库。");
  lines.push("");
  return lines.join("\n");
}

function main() {
  ensureDir(docsDir);
  ensureDir(tmpDir);
  const items = inventory();
  fs.writeFileSync(path.join(tmpDir, "reference-inventory.json"), JSON.stringify(items, null, 2), "utf8");
  fs.writeFileSync(path.join(docsDir, "参考资料清单.md"), renderMarkdown(items), "utf8");
  console.log(`Scanned ${items.length} reference files.`);
  console.log("Generated docs/参考资料清单.md");
  console.log("Generated tmp/reference-inventory.json");
}

main();
