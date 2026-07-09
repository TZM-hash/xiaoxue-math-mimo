const fs = require("fs");
const path = require("path");
const vm = require("vm");
const zlib = require("zlib");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function makeLocalStorage() {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; }
  };
}

const context = {
  console,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  Uint32Array,
  DataView,
  ArrayBuffer,
  Math,
  localStorage: makeLocalStorage(),
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
  "js/question-spec-utils.js",
  "js/grade3-reference-source-meta.js",
  "js/grade3-reference-scan-index.js",
  "js/grade3-reference-question-seeds.js",
  "js/grade3-original-question-seeds.js",
  "js/external-question-seeds.js",
  "js/question-bank-excel.js",
  "js/custom-bank.js"
].forEach((file) => {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
});

const Excel = context.window.MathCampQuestionBankExcel;
const CustomBank = context.window.MathCampCustomBank;
const External = context.window.MathCampExternalQuestionSeeds;
assert(Excel && CustomBank && External, "模块未全部暴露");

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`  ✓ ${name}`); }

// 造一个 Excel 风格 xlsx（deflate + sharedStrings），用于校验真实 Excel 兼容性
function buildExcelStyleXlsx(matrix) {
  const shared = [];
  const sharedIndex = new Map();
  function ref(value) {
    const str = String(value == null ? "" : value);
    if (!sharedIndex.has(str)) { sharedIndex.set(str, shared.length); shared.push(str); }
    return sharedIndex.get(str);
  }
  const rowsXml = matrix.map((cells, r) => {
    const cellsXml = cells.map((cell, c) => {
      const col = String.fromCharCode(65 + c);
      return `<c r="${col}${r + 1}" t="s"><v>${ref(cell)}</v></c>`;
    }).join("");
    return `<row r="${r + 1}">${cellsXml}</row>`;
  }).join("");
  const sheet = `<?xml version="1.0"?><worksheet><sheetData>${rowsXml}</sheetData></worksheet>`;
  const sst = `<?xml version="1.0"?><sst count="${shared.length}" uniqueCount="${shared.length}">`
    + shared.map((s) => `<si><t>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</t></si>`).join("")
    + `</sst>`;

  const crcTable = [];
  for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i += 1) c = crcTable[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const u16 = (v) => Buffer.from([v & 255, (v >> 8) & 255]);
  const u32 = (v) => Buffer.from([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255]);
  const entries = [
    { name: "[Content_Types].xml", data: "<x/>" },
    { name: "xl/sharedStrings.xml", data: sst },
    { name: "xl/worksheets/sheet1.xml", data: sheet }
  ];
  const local = [];
  const central = [];
  let off = 0;
  entries.forEach((e) => {
    const name = Buffer.from(e.name, "utf8");
    const raw = Buffer.from(e.data, "utf8");
    const comp = zlib.deflateRawSync(raw);
    const crc = crc32(raw);
    const lh = Buffer.concat([u32(0x04034b50), u16(20), u16(0x0800), u16(8), u16(0), u16(0), u32(crc), u32(comp.length), u32(raw.length), u16(name.length), u16(0), name, comp]);
    local.push(lh);
    central.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(8), u16(0), u16(0), u32(crc), u32(comp.length), u32(raw.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off), name]));
    off += lh.length;
  });
  const cd = Buffer.concat(central);
  const ld = Buffer.concat(local);
  const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length), u32(cd.length), u32(ld.length), u16(0)]);
  return new Uint8Array(Buffer.concat([ld, cd, end]));
}

const sampleMatrix = [
  ["bank", "grade", "subject", "pointId", "answerType", "text", "prompt", "correct", "wrongs", "answer", "acceptedAnswers", "steps"],
  ["自定义", "3", "math", "g3-multi-add", "text", "111+222=?", "", "", "", "333", "333|三百三十三", "对齐相加||逐位计算"],
  ["自定义", "3", "math", "", "choice", "", "3×4 的积是?", "12", "10|14|9", "", "", ""],
  ["自定义", "3", "chinese", "", "judge", "鲸是鱼类。", "", "", "", "错", "", ""],
  ["自定义", "3", "math", "", "text", "", "", "", "", "", "", ""]
];

test("inflateRaw 能解开 zlib deflate（多级别）", () => {
  const data = "题目".repeat(400) + "abc123 ".repeat(200);
  [undefined, 1, 6, 9].forEach((level) => {
    const def = zlib.deflateRawSync(Buffer.from(data, "utf8"), level ? { level } : {});
    const out = Buffer.from(context.window.MathCampQuestionBankExcel._internal.inflateRaw(new Uint8Array(def))).toString("utf8");
    assert.strictEqual(out, data, `level ${level} 解压不一致`);
  });
});

test("parseXlsx 解析 Excel 风格 xlsx（deflate + sharedStrings）", () => {
  const bytes = buildExcelStyleXlsx(sampleMatrix);
  const matrix = Excel.parseXlsx(bytes);
  assert.strictEqual(matrix.length, sampleMatrix.length, "行数不符");
  assert.strictEqual(matrix[1][5], "111+222=?", "文本单元格解析错误");
});

test("rowsToQuestions 正确组装三种题型并跳过非法行", () => {
  const rows = Excel.matrixToRowObjects(sampleMatrix);
  const { questions, skipped } = Excel.rowsToQuestions(rows, { bankName: "测试卷" });
  assert.strictEqual(questions.length, 3, "应组装 3 道有效题");
  assert.strictEqual(skipped.length, 1, "应跳过 1 道缺字段的题");
  const types = questions.map((q) => q.answerType).sort().join(",");
  assert.strictEqual(types, "choice,judge,text", "题型不齐");
  const textQ = questions.find((q) => q.answerType === "text");
  assert.strictEqual(textQ.acceptedAnswers.join("|"), "333|三百三十三", "acceptedAnswers 拆分错误");
  assert.strictEqual(textQ.steps.length, 2, "steps 拆分错误");
  const judgeQ = questions.find((q) => q.answerType === "judge");
  assert.strictEqual(judgeQ.answer, "错", "判断题答案归一化错误");
});

test("parseImportFile 走 xlsx 分支", () => {
  const bytes = buildExcelStyleXlsx(sampleMatrix);
  const result = Excel.parseImportFile({ fileName: "卷子.xlsx", bytes }, { bankName: "期中卷" });
  assert.strictEqual(result.sourceFormat, "xlsx");
  assert.strictEqual(result.questions.length, 3);
});

test("parseImportFile 走 csv 分支", () => {
  const csv = sampleMatrix.map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(",")).join("\n");
  const result = Excel.parseImportFile({ fileName: "卷子.csv", text: csv }, { bankName: "期中卷" });
  assert.strictEqual(result.sourceFormat, "csv");
  assert.strictEqual(result.questions.length, 3);
});

test("addBank 持久化 + 带合法 pointId 的题并入外部题库", () => {
  const pid = "g3-multi-add";
  const before = (External.BANK[pid] || []).length;
  const rows = Excel.matrixToRowObjects(sampleMatrix);
  const { questions } = Excel.rowsToQuestions(rows, { bankName: "期中卷" });
  const bank = CustomBank.addBank({ name: "期中卷", questions, sourceFormat: "csv" });
  assert(bank && bank.id, "addBank 应返回批次");
  const after = (External.BANK[pid] || []).length;
  assert.strictEqual(after, before + 1, "只应并入 1 道带合法 pointId 的题");
  const list = CustomBank.listBanks();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0].count, 3);
});

test("practiceQuestionsForBank 生成可练习题（选择题嵌入选项）", () => {
  const id = CustomBank.listBanks()[0].id;
  const pq = CustomBank.practiceQuestionsForBank(id, { shuffle: (a) => a, shuffleOptions: (a) => a });
  assert.strictEqual(pq.length, 3);
  const choice = pq.find((q) => q.answerType === "choice");
  assert(/A\./.test(choice.text) && /B\./.test(choice.text), "选择题应嵌入 A/B 选项");
});

test("deleteBank 撤销并入并清空列表", () => {
  const pid = "g3-multi-add";
  const before = (External.BANK[pid] || []).length;
  const id = CustomBank.listBanks()[0].id;
  CustomBank.deleteBank(id);
  assert.strictEqual(CustomBank.listBanks().length, 0, "删除后列表应为空");
  const after = (External.BANK[pid] || []).length;
  assert.strictEqual(after, before - 1, "删除应撤销并入的题");
});

test("exportAll / replaceAll 往返（存档备份）", () => {
  const rows = Excel.matrixToRowObjects(sampleMatrix);
  const { questions } = Excel.rowsToQuestions(rows, { bankName: "备份卷" });
  CustomBank.addBank({ name: "备份卷", questions, sourceFormat: "csv" });
  const dump = CustomBank.exportAll();
  assert.strictEqual(dump.length, 1);
  CustomBank.replaceAll([]);
  assert.strictEqual(CustomBank.listBanks().length, 0);
  CustomBank.replaceAll(dump);
  assert.strictEqual(CustomBank.listBanks().length, 1);
  assert.strictEqual(CustomBank.listBanks()[0].name, "备份卷");
});

console.log(`\ncustom-bank-import: ${passed} 项测试全部通过。`);
