const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

// 最小沙箱：只加载导出题库所需模块。
const context = {
  console,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  Uint32Array,
  document: {
    createElement: () => ({ click() {}, setAttribute() {}, style: {} }),
    body: { appendChild() {}, removeChild() {} }
  },
  Blob: class { constructor(parts) { this.parts = parts; } },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  setTimeout: () => 0
};
context.window = context;
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
  "js/subject-registry.js",
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
  "js/question-bank-excel.js"
].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

const Excel = context.window.MathCampQuestionBankExcel;
assert(Excel, "MathCampQuestionBankExcel 未暴露");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

// 1. 拍平行数 = 各 BANK 条目总数
test("拍平行数等于全部题库条目总数", () => {
  const modules = [
    "MathCampGrade2ReferenceQuestionSeeds",
    "MathCampGrade2OriginalQuestionSeeds",
    "MathCampGrade3ReferenceQuestionSeeds",
    "MathCampGrade3OriginalQuestionSeeds",
    "MathCampGrade4ReferenceQuestionSeeds",
    "MathCampGrade4OriginalQuestionSeeds"
  ];
  let expected = 0;
  modules.forEach((name) => {
    const bank = context.window[name] && context.window[name].BANK;
    if (!bank) return;
    Object.values(bank).forEach((items) => { expected += (items || []).length; });
  });
  const rows = Excel.collectExportRows({ bank: "all", subject: "all", grade: "all" });
  assert(expected > 0, "未加载到任何题库条目");
  assert.strictEqual(rows.length, expected, `导出行数 ${rows.length} != 条目总数 ${expected}`);
});

// 2. 必填列非空 + 题型字段自洽
test("必填列非空且题型字段自洽", () => {
  const rows = Excel.collectExportRows({});
  rows.forEach((row) => {
    assert(row.bank, "bank 不能为空");
    assert(row.subject, "subject 不能为空");
    assert(row.pointId, "pointId 不能为空");
    assert(["text", "choice", "judge"].includes(row.answerType), `未知题型 ${row.answerType}`);
    if (row.answerType === "choice") {
      assert(row.prompt, "选择题必须有 prompt");
      assert(row.correct !== "", "选择题必须有 correct");
      assert(row.text === "", "选择题 text 应为空");
    } else {
      assert(row.text, `${row.answerType} 题必须有 text`);
      assert(row.answer !== "", `${row.answer} 题必须有 answer`);
      assert(row.prompt === "", "非选择题 prompt 应为空");
    }
  });
});

// 3. 筛选正确
test("按题库分类和年级筛选正确", () => {
  const all = Excel.collectExportRows({});
  const original = Excel.collectExportRows({ bank: "原创" });
  const grade3 = Excel.collectExportRows({ grade: "3" });
  assert(original.length > 0 && original.length < all.length, "原创筛选异常");
  assert(original.every((r) => r.bank === "原创"), "原创筛选混入其他分类");
  assert(grade3.every((r) => String(r.grade) === "3"), "年级筛选混入其他年级");
});

// 4. 生成的 xlsx 是合法 ZIP（PK 头 + EOCD 尾）
test("生成的 xlsx 是合法 ZIP 包", () => {
  const matrix = Excel.rowsToMatrix(Excel.collectExportRows({ grade: "3", bank: "原创" }).slice(0, 5));
  const bytes = Excel.rowsToXlsx(matrix, "questions");
  assert(bytes instanceof context.Uint8Array || bytes instanceof Uint8Array, "应返回 Uint8Array");
  assert(bytes[0] === 0x50 && bytes[1] === 0x4b, "ZIP 应以 PK 开头");
  // 末尾包含 EOCD 签名 0x06054b50
  let hasEocd = false;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 200; i -= 1) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
      hasEocd = true;
      break;
    }
  }
  assert(hasEocd, "缺少 EOCD 记录");
});

// 5. CRC32 正确性（已知值）
test("CRC32 校验值正确", () => {
  const crc = Excel._internal.crc32(new TextEncoder().encode("123456789"));
  assert.strictEqual(crc >>> 0, 0xcbf43926, `CRC32 期望 0xcbf43926 实得 0x${crc.toString(16)}`);
});

// 6. 表头行结构
test("矩阵包含表头行和说明行", () => {
  const matrix = Excel.rowsToMatrix([]);
  assert.strictEqual(matrix.length, 2, "空题库应只有表头行和说明行");
  assert.strictEqual(matrix[0].length, Excel.COLUMNS.length, "表头列数不符");
});

console.log(`\nquestion-bank-excel: ${passed} 项测试全部通过。`);
