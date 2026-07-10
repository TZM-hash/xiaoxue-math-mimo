const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
const appUtils = fs.readFileSync(path.join(root, "js/app-utils.js"), "utf8");

assert(html.includes('id="answerInput"'), "练习页应保留答案输入框");
assert(appUtils.includes("function normalizeTextAnswer"), "app 工具模块应支持文本答案归一化");
assert(app.includes("acceptedAnswers"), "app 应支持多个可接受答案");
assert(app.includes("answerType"), "app 应支持答案类型");
assert(app.includes("selfReview"), "app 应支持自评题");

console.log("Answer mode source tests passed.");
