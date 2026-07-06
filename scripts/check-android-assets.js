const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "android/app/src/main/assets/www");

const items = [
  { source: "index.html", directory: false },
  { source: "manifest.webmanifest", directory: false },
  { source: "css", directory: true },
  { source: "js", directory: true },
  { source: "assets", directory: true }
];

function assertInWorkspace(filePath, workspace) {
  const resolvedPath = path.resolve(filePath);
  const resolvedWorkspace = path.resolve(workspace);
  if (!resolvedPath.toLowerCase().startsWith(resolvedWorkspace.toLowerCase())) {
    throw new Error(`Refusing to inspect outside workspace: ${resolvedPath}`);
  }
}

function toRelative(basePath, filePath) {
  const relativePath = path.relative(basePath, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Path is outside base path: ${filePath}`);
  }
  return relativePath.replace(/\\/g, "/");
}

function collectFiles(relativePath) {
  const fullPath = path.join(root, relativePath);
  const stat = fs.statSync(fullPath);
  if (stat.isFile()) return [relativePath];
  const result = [];
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    const childRelativePath = path.posix.join(relativePath.replace(/\\/g, "/"), entry.name);
    const childFullPath = path.join(root, childRelativePath);
    if (entry.isDirectory()) {
      result.push(...collectFiles(childRelativePath));
    } else if (entry.isFile()) {
      result.push(toRelative(root, childFullPath));
    }
  }
  return result;
}

function mirroredFiles() {
  return [...new Set(items.flatMap((item) => collectFiles(item.source)))].sort();
}

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function collectTargetFiles(basePath) {
  const result = [];
  for (const entry of fs.readdirSync(basePath, { withFileTypes: true })) {
    const fullPath = path.join(basePath, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectTargetFiles(fullPath));
    } else if (entry.isFile()) {
      result.push(toRelative(target, fullPath));
    }
  }
  return result;
}

assertInWorkspace(target, root);

const expectedFiles = mirroredFiles();
const expectedSet = new Set(expectedFiles);
const mismatches = [];

for (const relativeFile of expectedFiles) {
  const webFile = path.join(root, relativeFile);
  const androidFile = path.join(target, relativeFile);
  if (!fs.existsSync(androidFile)) {
    mismatches.push(`${relativeFile} -> missing from Android assets`);
    continue;
  }
  if (hashFile(webFile) !== hashFile(androidFile)) {
    mismatches.push(`${relativeFile} -> content mismatch`);
  }
}

const allowedTargetOnlyFiles = new Set([".gitignore"]);
for (const extraFile of collectTargetFiles(target)) {
  if (!expectedSet.has(extraFile) && !allowedTargetOnlyFiles.has(extraFile)) {
    mismatches.push(`${extraFile} -> stale Android-only asset`);
  }
}

if (mismatches.length) {
  console.error(`Android asset sync mismatch:\n${mismatches.join("\n")}`);
  process.exit(1);
}

console.log("Android assets are in sync.");
