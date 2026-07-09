const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetDir = path.join(root, "assets");
const docsDir = path.join(root, "docs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
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

function posixRelative(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function assetKind(ext) {
  if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"].includes(ext)) return "图片";
  if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) return "音频";
  if ([".json"].includes(ext)) return "数据";
  return "其他";
}

function collectAssets() {
  return walk(assetDir).map((filePath) => {
    const stat = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return {
      path: posixRelative(filePath),
      ext: ext || "none",
      kind: assetKind(ext),
      size: stat.size,
      sizeLabel: formatBytes(stat.size)
    };
  }).sort((a, b) => b.size - a.size || a.path.localeCompare(b.path));
}

function renderMarkdown(items) {
  const generatedAt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  const totalSize = items.reduce((sum, item) => sum + item.size, 0);
  const byKind = new Map();
  items.forEach((item) => {
    const current = byKind.get(item.kind) || { count: 0, size: 0 };
    current.count += 1;
    current.size += item.size;
    byKind.set(item.kind, current);
  });

  const lines = [];
  lines.push("# 资源优化报告");
  lines.push("");
  lines.push(`生成日期：${generatedAt}`);
  lines.push("");
  lines.push("本文档由 `npm run assets:report` 自动生成，用于发现体积较大的应用资源。脚本只统计，不自动压缩或改写资源。");
  lines.push("");
  lines.push(`- 资源文件数：${items.length}`);
  lines.push(`- 资源总体积：${formatBytes(totalSize)}`);
  lines.push("");
  lines.push("## 类型汇总");
  lines.push("");
  lines.push("| 类型 | 文件数 | 体积 |");
  lines.push("| --- | ---: | ---: |");
  Array.from(byKind.entries()).sort((a, b) => b[1].size - a[1].size).forEach(([kind, stat]) => {
    lines.push(`| ${kind} | ${stat.count} | ${formatBytes(stat.size)} |`);
  });
  lines.push("");
  lines.push("## 最大资源 Top 40");
  lines.push("");
  lines.push("| 排名 | 类型 | 体积 | 路径 | 建议 |");
  lines.push("| ---: | --- | ---: | --- | --- |");
  items.slice(0, 40).forEach((item, index) => {
    const suggestion = item.kind === "图片" && item.size > 500 * 1024
      ? "可评估转 WebP 或按显示尺寸压缩"
      : item.kind === "音频" && item.size > 1024 * 1024
        ? "可评估降低码率或缩短音频"
        : "保留";
    lines.push(`| ${index + 1} | ${item.kind} | ${item.sizeLabel} | \`${item.path}\` | ${suggestion} |`);
  });
  lines.push("");
  lines.push("## 后续处理建议");
  lines.push("");
  lines.push("- 参考资料截图优先保证清晰度，再考虑压缩。");
  lines.push("- 已经挂题使用的图片不要直接删除，先通过题库文档或搜索确认引用。");
  lines.push("- Android 包体变大时，优先处理 Top 40 中的图片和音频。");
  lines.push("");
  return lines.join("\n");
}

function main() {
  ensureDir(docsDir);
  const items = collectAssets();
  fs.writeFileSync(path.join(docsDir, "资源优化报告.md"), renderMarkdown(items), "utf8");
  console.log(`Scanned ${items.length} asset files.`);
  console.log("Generated docs/资源优化报告.md");
}

main();
