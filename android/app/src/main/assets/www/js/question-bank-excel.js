(function () {
  "use strict";

  // ------------------------------------------------------------------
  // 极简 .xlsx 生成器（零依赖）
  // 只做导出：把二维数组写成一个 worksheet，打包成合法 xlsx（ZIP store 模式）。
  // 纯文字题库导出足够用；不引入 SheetJS，避免体积和联网依赖。
  // ------------------------------------------------------------------

  // CRC32 表
  const CRC_TABLE = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i += 1) {
      crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function utf8Bytes(str) {
    return new TextEncoder().encode(String(str == null ? "" : str));
  }

  // 构造一个 ZIP（store，无压缩）。entries: [{ name, data(Uint8Array) }]
  function zipStore(entries) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    function u16(value) {
      return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
    }
    function u32(value) {
      return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
    }
    function concat(chunks) {
      const total = chunks.reduce((sum, c) => sum + c.length, 0);
      const out = new Uint8Array(total);
      let pos = 0;
      chunks.forEach((c) => { out.set(c, pos); pos += c.length; });
      return out;
    }

    entries.forEach((entry) => {
      const nameBytes = utf8Bytes(entry.name);
      const data = entry.data;
      const crc = crc32(data);
      const localHeader = concat([
        u32(0x04034b50), // local file header signature
        u16(20), // version needed
        u16(0x0800), // flags: UTF-8 filename
        u16(0), // compression: store
        u16(0), u16(0), // mod time/date (fixed 0)
        u32(crc),
        u32(data.length), // compressed size
        u32(data.length), // uncompressed size
        u16(nameBytes.length),
        u16(0), // extra length
        nameBytes,
        data
      ]);
      localParts.push(localHeader);

      const centralHeader = concat([
        u32(0x02014b50), // central directory header signature
        u16(20), u16(20),
        u16(0x0800),
        u16(0),
        u16(0), u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(nameBytes.length),
        u16(0), u16(0),
        u16(0), u16(0),
        u32(0), // external attrs
        u32(offset),
        nameBytes
      ]);
      centralParts.push(centralHeader);
      offset += localHeader.length;
    });

    const centralData = concat(centralParts);
    const localData = concat(localParts);
    const end = concat([
      u32(0x06054b50), // end of central directory
      u16(0), u16(0),
      u16(entries.length),
      u16(entries.length),
      u32(centralData.length),
      u32(localData.length),
      u16(0)
    ]);
    return concat([localData, centralData, end]);
  }

  function xmlEscape(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function colName(index) {
    let name = "";
    let n = index;
    do {
      name = String.fromCharCode(65 + (n % 26)) + name;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return name;
  }

  // rows: 二维数组，全部按 inlineStr 文本写入（数字也当文本，避免格式歧义）。
  function buildSheetXml(rows) {
    const rowXml = rows.map((cells, rIndex) => {
      const cellXml = (cells || []).map((cell, cIndex) => {
        const ref = `${colName(cIndex)}${rIndex + 1}`;
        return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(cell)}</t></is></c>`;
      }).join("");
      return `<row r="${rIndex + 1}">${cellXml}</row>`;
    }).join("");
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`
      + `<sheetData>${rowXml}</sheetData></worksheet>`;
  }

  function buildWorkbook(sheetName) {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
      + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" `
      + `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">`
      + `<sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  }

  const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
    + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
    + `<Default Extension="xml" ContentType="application/xml"/>`
    + `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>`
    + `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
    + `</Types>`;

  const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>`
    + `</Relationships>`;

  const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    + `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>`
    + `</Relationships>`;

  // rows -> xlsx Uint8Array
  function rowsToXlsx(rows, sheetName = "questions") {
    const entries = [
      { name: "[Content_Types].xml", data: utf8Bytes(CONTENT_TYPES) },
      { name: "_rels/.rels", data: utf8Bytes(ROOT_RELS) },
      { name: "xl/workbook.xml", data: utf8Bytes(buildWorkbook(sheetName)) },
      { name: "xl/_rels/workbook.xml.rels", data: utf8Bytes(WORKBOOK_RELS) },
      { name: "xl/worksheets/sheet1.xml", data: utf8Bytes(buildSheetXml(rows)) }
    ];
    return zipStore(entries);
  }

  // ------------------------------------------------------------------
  // 题库拍平：统一 Excel 交换格式
  // ------------------------------------------------------------------

  // 列定义：key 为内部字段，header 为表头（中英对照），note 为第二行说明。
  const COLUMNS = [
    { key: "bank", header: "bank 题库分类", note: "原创/参考/自定义" },
    { key: "grade", header: "grade 年级", note: "2/3/4…" },
    { key: "subject", header: "subject 学科", note: "math/chinese/english/science" },
    { key: "pointId", header: "pointId 知识点ID", note: "现有知识点标识" },
    { key: "pointLabel", header: "pointLabel 知识点", note: "可读名，导入可空" },
    { key: "answerType", header: "answerType 题型", note: "text/choice/judge" },
    { key: "text", header: "text 题干", note: "text/judge 用" },
    { key: "prompt", header: "prompt 选择题干", note: "choice 用" },
    { key: "correct", header: "correct 正确选项", note: "choice 用" },
    { key: "wrongs", header: "wrongs 干扰项", note: "choice 用，| 分隔" },
    { key: "answer", header: "answer 答案", note: "text/judge 用" },
    { key: "acceptedAnswers", header: "acceptedAnswers 可接受答案", note: "| 分隔，可空" },
    { key: "explanation", header: "explanation 解析", note: "" },
    { key: "steps", header: "steps 步骤", note: "|| 分隔多步" },
    { key: "templateType", header: "templateType 题型标签", note: "" },
    { key: "sourceNote", header: "sourceNote 题源说明", note: "" },
    { key: "id", header: "id 题目ID", note: "导入可空，自动生成" }
  ];

  const MULTI = "|";
  const STEP = "||";

  function joinMulti(list) {
    if (!Array.isArray(list)) return String(list == null ? "" : list);
    return list.map((item) => String(item == null ? "" : item)).filter(Boolean).join(MULTI);
  }
  function joinSteps(list) {
    if (!Array.isArray(list)) return String(list == null ? "" : list);
    return list.map((item) => String(item == null ? "" : item)).filter(Boolean).join(STEP);
  }

  const BANK_LABELS = {
    codexOriginal: "原创",
    referenceDerived: "参考",
    custom: "自定义"
  };

  function subjectForPointId(pointId, fallbackSubject) {
    const id = String(pointId || "");
    const registry = window.MathCampSubjects;
    if (registry && typeof registry.subjectBank === "function") {
      for (const subject of registry.SUBJECT_IDS || []) {
        const bank = registry.subjectBank(subject);
        const point = bank && (bank.pointMap?.[id] || bank.points?.find?.((p) => p.id === id));
        if (point) return { subject, pointLabel: point.label || point.short || id };
      }
    }
    const subject = fallbackSubject
      || (/^c\d-/.test(id) ? "chinese" : /^e\d-/.test(id) ? "english" : /^s\d-/.test(id) ? "science" : "math");
    return { subject, pointLabel: id };
  }

  // 把一个题目条目拍平成一行对象
  function flattenItem(item, pointId, bankLabel, grade) {
    const meta = item.sourceMeta || {};
    const resolved = subjectForPointId(pointId, item.subject);
    const isChoice = item.answerType === "choice";
    return {
      bank: bankLabel,
      grade: grade == null ? "" : String(grade),
      subject: item.subject || resolved.subject,
      pointId: pointId,
      pointLabel: resolved.pointLabel,
      answerType: item.answerType || "text",
      text: isChoice ? "" : (item.text || ""),
      prompt: isChoice ? (item.prompt || "") : "",
      correct: isChoice ? (item.correct == null ? "" : String(item.correct)) : "",
      wrongs: isChoice ? joinMulti(item.wrongs) : "",
      answer: isChoice ? "" : (item.answer == null ? "" : String(item.answer)),
      acceptedAnswers: joinMulti(item.acceptedAnswers),
      explanation: item.explanation || "",
      steps: joinSteps(item.steps),
      templateType: item.templateType || item.questionType || "",
      sourceNote: meta.sourceNote || meta.maintainerNote || "",
      id: item.id || ""
    };
  }

  // 已知的固定题库模块 -> { module, bankLabel, grade }
  function seedSources() {
    return [
      { module: window.MathCampGrade2ReferenceQuestionSeeds, bankLabel: "参考", grade: 2 },
      { module: window.MathCampGrade2OriginalQuestionSeeds, bankLabel: "原创", grade: 2 },
      { module: window.MathCampGrade3ReferenceQuestionSeeds, bankLabel: "参考", grade: 3 },
      { module: window.MathCampGrade3OriginalQuestionSeeds, bankLabel: "原创", grade: 3 },
      { module: window.MathCampGrade4ReferenceQuestionSeeds, bankLabel: "参考", grade: 4 },
      { module: window.MathCampGrade4OriginalQuestionSeeds, bankLabel: "原创", grade: 4 }
    ];
  }

  // 收集所有导出行（对象数组）。filter: { bank, subject, grade }
  function collectExportRows(filter) {
    const f = filter || {};
    const rows = [];
    seedSources().forEach((source) => {
      const bank = source.module && source.module.BANK;
      if (!bank) return;
      Object.entries(bank).forEach(([pointId, items]) => {
        (items || []).forEach((item) => {
          rows.push(flattenItem(item, pointId, source.bankLabel, source.grade));
        });
      });
    });
    return rows.filter((row) => {
      if (f.bank && f.bank !== "all" && row.bank !== f.bank) return false;
      if (f.subject && f.subject !== "all" && row.subject !== f.subject) return false;
      if (f.grade && f.grade !== "all" && String(row.grade) !== String(f.grade)) return false;
      return true;
    });
  }

  // 行对象 -> 二维数组（含表头 + 说明行）
  function rowsToMatrix(rowObjects) {
    const matrix = [
      COLUMNS.map((c) => c.header),
      COLUMNS.map((c) => c.note)
    ];
    rowObjects.forEach((row) => {
      matrix.push(COLUMNS.map((c) => (row[c.key] == null ? "" : String(row[c.key]))));
    });
    return matrix;
  }

  function triggerDownload(bytes, filename) {
    const blob = new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function defaultFilename(filter) {
    const f = filter || {};
    const parts = ["题库"];
    if (f.bank && f.bank !== "all") parts.push(f.bank);
    if (f.subject && f.subject !== "all") parts.push(f.subject);
    if (f.grade && f.grade !== "all") parts.push(`${f.grade}年级`);
    return `${parts.join("-")}.xlsx`;
  }

  // 主入口：按 filter 导出 xlsx，返回导出行数。
  function exportToXlsx(filter, filename) {
    const rowObjects = collectExportRows(filter);
    const matrix = rowsToMatrix(rowObjects);
    const bytes = rowsToXlsx(matrix, "questions");
    triggerDownload(bytes, filename || defaultFilename(filter));
    return rowObjects.length;
  }

  // ==================================================================
  // 导入层：CSV / xlsx 解析（零依赖）
  // ==================================================================

  // ---- CSV 解析（支持双引号转义、逗号、换行）----
  function parseCsv(text) {
    const src = String(text || "").replace(/^﻿/, ""); // 去 BOM
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < src.length; i += 1) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"') {
          if (src[i + 1] === '"') { field += '"'; i += 1; }
          else inQuotes = false;
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\r") {
        // 忽略，交给 \n 处理
      } else if (ch === "\n") {
        row.push(field); field = "";
        rows.push(row); row = [];
      } else {
        field += ch;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
  }

  // ---- DEFLATE (RFC 1951) inflate，纯 JS ----
  function inflateRaw(data) {
    let bitPos = 0;
    const out = [];
    function readBit() {
      const byte = data[bitPos >>> 3];
      const bit = (byte >>> (bitPos & 7)) & 1;
      bitPos += 1;
      return bit;
    }
    function readBits(count) {
      let value = 0;
      for (let i = 0; i < count; i += 1) value |= readBit() << i;
      return value;
    }
    // 构造 Huffman 解码表（按码长）
    function buildTree(lengths) {
      const maxLen = Math.max(0, ...lengths);
      const blCount = new Array(maxLen + 1).fill(0);
      lengths.forEach((len) => { if (len) blCount[len] += 1; });
      const nextCode = new Array(maxLen + 1).fill(0);
      let code = 0;
      for (let bits = 1; bits <= maxLen; bits += 1) {
        code = (code + blCount[bits - 1]) << 1;
        nextCode[bits] = code;
      }
      const table = {};
      lengths.forEach((len, symbol) => {
        if (!len) return;
        const c = nextCode[len]++;
        table[`${len}:${c}`] = symbol;
      });
      return { table, maxLen };
    }
    function decodeSymbol(tree) {
      let code = 0;
      for (let len = 1; len <= tree.maxLen; len += 1) {
        code = (code << 1) | readBit();
        const sym = tree.table[`${len}:${code}`];
        if (sym !== undefined) return sym;
      }
      throw new Error("inflate: 无效的 Huffman 编码");
    }

    const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
    const LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
    const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
    const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
    const CODE_LEN_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

    let fixedLit = null;
    let fixedDist = null;
    function fixedTrees() {
      if (fixedLit) return;
      const litLen = [];
      for (let i = 0; i < 144; i += 1) litLen.push(8);
      for (let i = 144; i < 256; i += 1) litLen.push(9);
      for (let i = 256; i < 280; i += 1) litLen.push(7);
      for (let i = 280; i < 288; i += 1) litLen.push(8);
      fixedLit = buildTree(litLen);
      fixedDist = buildTree(new Array(30).fill(5));
    }

    let finalBlock = false;
    while (!finalBlock) {
      finalBlock = readBit() === 1;
      const type = readBits(2);
      if (type === 0) {
        // 无压缩块
        bitPos = (bitPos + 7) & ~7; // 对齐到字节
        const bytePos = bitPos >>> 3;
        const len = data[bytePos] | (data[bytePos + 1] << 8);
        for (let i = 0; i < len; i += 1) out.push(data[bytePos + 4 + i]);
        bitPos = (bytePos + 4 + len) << 3;
        continue;
      }
      let litTree;
      let distTree;
      if (type === 1) {
        fixedTrees();
        litTree = fixedLit;
        distTree = fixedDist;
      } else if (type === 2) {
        const hlit = readBits(5) + 257;
        const hdist = readBits(5) + 1;
        const hclen = readBits(4) + 4;
        const codeLenLengths = new Array(19).fill(0);
        for (let i = 0; i < hclen; i += 1) codeLenLengths[CODE_LEN_ORDER[i]] = readBits(3);
        const codeLenTree = buildTree(codeLenLengths);
        const lengths = [];
        while (lengths.length < hlit + hdist) {
          const sym = decodeSymbol(codeLenTree);
          if (sym < 16) {
            lengths.push(sym);
          } else if (sym === 16) {
            const repeat = readBits(2) + 3;
            const prev = lengths[lengths.length - 1];
            for (let i = 0; i < repeat; i += 1) lengths.push(prev);
          } else if (sym === 17) {
            const repeat = readBits(3) + 3;
            for (let i = 0; i < repeat; i += 1) lengths.push(0);
          } else {
            const repeat = readBits(7) + 11;
            for (let i = 0; i < repeat; i += 1) lengths.push(0);
          }
        }
        litTree = buildTree(lengths.slice(0, hlit));
        distTree = buildTree(lengths.slice(hlit));
      } else {
        throw new Error("inflate: 不支持的块类型");
      }
      for (;;) {
        const sym = decodeSymbol(litTree);
        if (sym === 256) break;
        if (sym < 256) {
          out.push(sym);
        } else {
          const li = sym - 257;
          const length = LEN_BASE[li] + readBits(LEN_EXTRA[li]);
          const distSym = decodeSymbol(distTree);
          const dist = DIST_BASE[distSym] + readBits(DIST_EXTRA[distSym]);
          const start = out.length - dist;
          for (let i = 0; i < length; i += 1) out.push(out[start + i]);
        }
      }
    }
    return new Uint8Array(out);
  }

  // ---- 从 ZIP（xlsx）中读取指定条目（支持 store 和 deflate）----
  function readZipEntries(bytes) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const entries = {};
    // 从尾部找 EOCD
    let eocd = -1;
    for (let i = bytes.length - 22; i >= 0; i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error("xlsx: 找不到 ZIP 结束记录");
    const count = view.getUint16(eocd + 10, true);
    let offset = view.getUint32(eocd + 16, true);
    const decoder = new TextDecoder("utf-8");
    for (let i = 0; i < count; i += 1) {
      if (view.getUint32(offset, true) !== 0x02014b50) break;
      const method = view.getUint16(offset + 10, true);
      const compSize = view.getUint32(offset + 20, true);
      const nameLen = view.getUint16(offset + 28, true);
      const extraLen = view.getUint16(offset + 30, true);
      const commentLen = view.getUint16(offset + 32, true);
      const localOffset = view.getUint32(offset + 42, true);
      const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLen));
      // 定位本地头，跳过其可变字段
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const compData = bytes.subarray(dataStart, dataStart + compSize);
      let content;
      if (method === 0) content = compData;
      else if (method === 8) content = inflateRaw(compData);
      else throw new Error(`xlsx: 不支持的压缩方式 ${method}`);
      entries[name] = decoder.decode(content);
      offset += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
  }

  function decodeXmlEntities(str) {
    return String(str == null ? "" : str)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&amp;/g, "&");
  }

  // ---- 解析 sharedStrings.xml ----
  function parseSharedStrings(xml) {
    if (!xml) return [];
    const strings = [];
    const siRegex = /<si>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = siRegex.exec(xml))) {
      const inner = m[1];
      // 一个 si 可能有多个 <t>（富文本 run），拼接
      let text = "";
      const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
      let tm;
      while ((tm = tRegex.exec(inner))) text += tm[1];
      strings.push(decodeXmlEntities(text));
    }
    return strings;
  }

  function colToIndex(ref) {
    const letters = String(ref).replace(/[0-9]/g, "");
    let index = 0;
    for (let i = 0; i < letters.length; i += 1) {
      index = index * 26 + (letters.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  // ---- 解析 sheet1.xml 为二维数组 ----
  function parseSheet(xml, sharedStrings) {
    const matrix = [];
    const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
    let rm;
    while ((rm = rowRegex.exec(xml))) {
      const rowXml = rm[1];
      const cells = [];
      const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>|<c\b([^>]*)\/>/g;
      let cm;
      while ((cm = cellRegex.exec(rowXml))) {
        const attrs = cm[1] || cm[3] || "";
        const body = cm[2] || "";
        const refMatch = attrs.match(/r="([A-Z]+)\d+"/);
        const colIdx = refMatch ? colToIndex(refMatch[1]) : cells.length;
        const typeMatch = attrs.match(/t="([^"]+)"/);
        const type = typeMatch ? typeMatch[1] : "";
        let value = "";
        if (type === "s") {
          const vMatch = body.match(/<v>([\s\S]*?)<\/v>/);
          if (vMatch) value = sharedStrings[Number(vMatch[1])] || "";
        } else if (type === "inlineStr") {
          const tMatch = body.match(/<t[^>]*>([\s\S]*?)<\/t>/);
          if (tMatch) value = decodeXmlEntities(tMatch[1]);
        } else {
          const vMatch = body.match(/<v>([\s\S]*?)<\/v>/);
          if (vMatch) value = decodeXmlEntities(vMatch[1]);
        }
        cells[colIdx] = value;
      }
      for (let i = 0; i < cells.length; i += 1) if (cells[i] === undefined) cells[i] = "";
      matrix.push(cells);
    }
    return matrix.filter((r) => r.some((cell) => String(cell).trim() !== ""));
  }

  function parseXlsx(bytes) {
    const entries = readZipEntries(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
    const sheetName = Object.keys(entries).find((n) => /xl\/worksheets\/sheet1\.xml$/.test(n))
      || Object.keys(entries).find((n) => /xl\/worksheets\/.*\.xml$/.test(n));
    if (!sheetName) throw new Error("xlsx: 找不到工作表");
    const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
    return parseSheet(entries[sheetName], sharedStrings);
  }

  // ---- 二维数组 -> 行对象（按表头列名映射内部 key）----
  // 表头兼容中英对照（"bank 题库分类"）或纯英文列名（"bank"）。
  function headerKey(header) {
    const token = String(header || "").trim().split(/\s+/)[0];
    const found = COLUMNS.find((c) => c.key === token || c.header === String(header || "").trim());
    return found ? found.key : token;
  }

  function matrixToRowObjects(matrix) {
    if (!matrix.length) return [];
    const headerRow = matrix[0].map(headerKey);
    // 跳过说明行：若第二行首格是我们导出的说明文案之一则跳过
    let dataStart = 1;
    if (matrix[1]) {
      const secondFirst = String(matrix[1][0] || "").trim();
      const isNote = COLUMNS.some((c) => c.note && c.note === secondFirst)
        || /原创\/参考\/自定义/.test(secondFirst);
      if (isNote) dataStart = 2;
    }
    const rows = [];
    for (let r = dataStart; r < matrix.length; r += 1) {
      const cells = matrix[r];
      const obj = {};
      headerRow.forEach((key, i) => { if (key) obj[key] = cells[i] == null ? "" : String(cells[i]); });
      rows.push(obj);
    }
    return rows;
  }

  function splitMulti(value) {
    return String(value == null ? "" : value).split(MULTI).map((s) => s.trim()).filter(Boolean);
  }
  function splitSteps(value) {
    return String(value == null ? "" : value).split(STEP).map((s) => s.trim()).filter(Boolean);
  }

  // ---- 行对象 -> 题目对象（统一 schema），校验并收集跳过项 ----
  function rowsToQuestions(rowObjects, defaults) {
    const d = defaults || {};
    const questions = [];
    const skipped = [];
    (rowObjects || []).forEach((row, index) => {
      const answerType = String(row.answerType || "text").trim() || "text";
      const grade = Number(row.grade || d.grade) || undefined;
      const subject = String(row.subject || d.subject || "").trim() || undefined;
      const pointId = String(row.pointId || "").trim();
      const base = {
        id: String(row.id || "").trim() || undefined,
        grade,
        subject,
        pointId: pointId || undefined,
        answerType,
        explanation: String(row.explanation || "").trim(),
        steps: splitSteps(row.steps),
        templateType: String(row.templateType || "").trim() || "校内题",
        sourceMeta: {
          kind: "custom",
          name: d.bankName || "校内题库",
          sourceNote: String(row.sourceNote || "").trim(),
          license: "User-provided local school question bank"
        }
      };
      if (answerType === "choice") {
        const prompt = String(row.prompt || "").trim();
        const correct = String(row.correct || "").trim();
        const wrongs = splitMulti(row.wrongs);
        if (!prompt || !correct || !wrongs.length) {
          skipped.push({ row: index + 1, reason: "选择题缺少 prompt/correct/wrongs" });
          return;
        }
        questions.push({
          ...base,
          prompt,
          correct,
          wrongs,
          acceptedAnswers: splitMulti(row.acceptedAnswers)
        });
      } else if (answerType === "judge") {
        const text = String(row.text || "").trim();
        const answerRaw = String(row.answer || "").trim();
        if (!text || !answerRaw) {
          skipped.push({ row: index + 1, reason: "判断题缺少 text/answer" });
          return;
        }
        const normalized = /^(对|正确|是|true|t|yes|y|√)$/i.test(answerRaw) ? "对" : "错";
        questions.push({
          ...base,
          text: /^判断/.test(text) ? text : `判断：${text}`,
          answer: normalized,
          acceptedAnswers: normalized === "对" ? ["对", "正确", "是"] : ["错", "错误", "不对", "否"]
        });
      } else {
        const text = String(row.text || "").trim();
        const answer = String(row.answer || "").trim();
        if (!text || !answer) {
          skipped.push({ row: index + 1, reason: "填空/应用题缺少 text/answer" });
          return;
        }
        const accepted = splitMulti(row.acceptedAnswers);
        questions.push({
          ...base,
          answerType: "text",
          text,
          answer,
          acceptedAnswers: accepted.length ? accepted : [answer]
        });
      }
    });
    return { questions, skipped };
  }

  // ---- 统一导入入口：按类型分流 ----
  // input: { fileName, bytes?(Uint8Array/ArrayBuffer), text?(string) }, defaults
  function parseImportFile(input, defaults) {
    const fileName = String(input?.fileName || "").toLowerCase();
    let matrix;
    let sourceFormat;
    if (input?.bytes && (fileName.endsWith(".xlsx") || !input.text)) {
      matrix = parseXlsx(input.bytes);
      sourceFormat = "xlsx";
    } else if (input?.text != null) {
      matrix = parseCsv(input.text);
      sourceFormat = "csv";
    } else {
      throw new Error("导入失败：无法识别的文件内容");
    }
    const rowObjects = matrixToRowObjects(matrix);
    const result = rowsToQuestions(rowObjects, defaults);
    return { ...result, sourceFormat, totalRows: rowObjects.length };
  }

  window.MathCampQuestionBankExcel = {
    COLUMNS,
    MULTI,
    STEP,
    collectExportRows,
    rowsToMatrix,
    rowsToXlsx,
    exportToXlsx,
    defaultFilename,
    // 导入
    parseCsv,
    parseXlsx,
    matrixToRowObjects,
    rowsToQuestions,
    parseImportFile,
    // 供测试使用
    _internal: { crc32, zipStore, rowsToXlsx, flattenItem, subjectForPointId, inflateRaw, readZipEntries, parseSheet }
  };
})();
