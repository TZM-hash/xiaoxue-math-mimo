const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date };
context.globalThis = context;
vm.createContext(context);

["js/question-bank.js", "js/question-bank-coverage.js"].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

const coverage = context.window.MathCampQuestionBankCoverage;
const report = coverage.buildCoverageReport(context.window.MathCampQuestionBank);
console.log(coverage.formatCoverageReport(report));

if (process.argv.includes("--strict") && report.gaps.some((gap) => gap.level === "high")) {
  process.exitCode = 1;
}
