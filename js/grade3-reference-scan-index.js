(function () {
  "use strict";

  const meta = window.MathCampGrade3ReferenceSourceMeta || { byId: {} };

  // 逐页扫描索引：覆盖 Reference/grade3 下全部 PDF 页。
  // text-extractable 表示已能用 PDF 文本层抽出文字；scan-image 表示扫描图像页。
  // 扫描页不伪造 OCR 原文，只基于文件主题、页码和可辨题型生成可追溯派生题。
  const pdfSources = [
    {
      sourceId: "g3-english-wcx-copybook",
      pages: 79,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e3-vocabulary-school",
        "e3-phonics-short-vowels",
        "e3-pattern-greetings",
        "e3-grammar-basic-be",
        "e3-reading-dialogue",
        "e3-unit-1-1",
        "e3-unit-1-2",
        "e3-unit-1-3",
        "e3-unit-1-4",
        "e3-unit-1-5",
        "e3-unit-1-6"
      ]
    },
    {
      sourceId: "g3-math-mixed-word",
      pages: 9,
      textPages: [],
      subject: "math",
      pointCycle: ["g3-word-two-step", "g3-two-step", "g3-mul-div", "g3-remainder", "g3-reading", "g3-thinking"]
    },
    {
      sourceId: "g3-math-peiyou-100",
      pages: 64,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g3-thinking",
        "g3-appendix",
        "g3-reading",
        "g3-perimeter",
        "g3-statistics",
        "g3-fraction-intro",
        "g3-word-two-step",
        "g3-unit",
        "g3-multi-add",
        "g3-vertical",
        "g3-mul-div",
        "g3-two-step",
        "g3-remainder"
      ]
    },
    {
      sourceId: "g3-chinese-key-knowledge",
      pages: 9,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      subject: "chinese",
      pointCycle: [
        "c3-accumulation",
        "c3-word-meaning",
        "c3-poem",
        "c3-sentence-transform",
        "c3-rhetoric",
        "c3-paragraph-reading",
        "c3-writing-piece",
        "c3-practice",
        "c3-textbook-context-word"
      ]
    },
    {
      sourceId: "g3-english-ready",
      pages: 96,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e3-vocabulary-school",
        "e3-phonics-short-vowels",
        "e3-pattern-greetings",
        "e3-grammar-basic-be",
        "e3-reading-dialogue",
        "e3-unit-1-1",
        "e3-unit-1-2",
        "e3-unit-1-3",
        "e3-unit-1-4",
        "e3-unit-1-5",
        "e3-unit-1-6",
        "e3-unit-2-1",
        "e3-unit-2-2",
        "e3-unit-2-3",
        "e3-unit-2-4",
        "e3-unit-2-5",
        "e3-unit-2-6"
      ]
    },
    {
      sourceId: "g3-math-special-training",
      pages: 35,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g3-multi-add",
        "g3-vertical",
        "g3-mul-div",
        "g3-two-step",
        "g3-remainder",
        "g3-perimeter",
        "g3-unit",
        "g3-fraction-intro",
        "g3-statistics",
        "g3-word-two-step",
        "g3-reading",
        "g3-thinking",
        "g3-appendix"
      ]
    },
    {
      sourceId: "g3-chinese-sunshine-paper",
      pages: 64,
      textPages: [],
      subject: "chinese",
      pointCycle: [
        "c3-word-meaning",
        "c3-sentence-transform",
        "c3-rhetoric",
        "c3-paragraph-reading",
        "c3-writing-piece",
        "c3-poem",
        "c3-accumulation",
        "c3-practice",
        "c3-textbook-context-word",
        "c3-textbook-sentence-transform",
        "c3-textbook-rhetoric-basic",
        "c3-textbook-paragraph-main",
        "c3-textbook-reading-detail",
        "c3-textbook-poem-image",
        "c3-textbook-idiom-meaning",
        "c3-textbook-observation-record",
        "c3-textbook-around-one-idea",
        "c3-textbook-practical-expression"
      ]
    },
    {
      sourceId: "g3-math-olympiad-training",
      pages: 4,
      textPages: [1, 2, 3, 4],
      subject: "math",
      pointCycle: ["g3-thinking", "g3-appendix", "g3-reading", "g3-word-two-step"]
    }
  ];

  function pageTopic(source, page) {
    const cycle = source.pointCycle || [];
    return cycle[(page - 1) % Math.max(1, cycle.length)] || "";
  }

  const pages = pdfSources.flatMap((source) => {
    const textPageSet = new Set(source.textPages || []);
    const info = meta.byId?.[source.sourceId] || {};
    return Array.from({ length: source.pages }, (_, index) => {
      const page = index + 1;
      const extractStatus = textPageSet.has(page) ? "text-extractable" : "scan-image";
      return {
        sourceId: source.sourceId,
        sourceFile: info.fileName || source.sourceId,
        sourcePath: info.path || "",
        subject: source.subject,
        grade: 3,
        page,
        extractStatus,
        pointHint: pageTopic(source, page),
        scanNote: extractStatus === "text-extractable"
          ? "该页可抽取文字，题源按文本层知识点整理。"
          : "该页为扫描图像页，未伪造 OCR 原文；题源按该资料页码、文件主题和题型结构改写。"
      };
    });
  });

  const summary = pages.reduce((acc, page) => {
    acc.totalPages += 1;
    acc.byStatus[page.extractStatus] = (acc.byStatus[page.extractStatus] || 0) + 1;
    acc.bySubject[page.subject] = (acc.bySubject[page.subject] || 0) + 1;
    return acc;
  }, { totalPages: 0, byStatus: {}, bySubject: {} });

  window.MathCampGrade3ReferenceScanIndex = {
    pdfSources,
    pages,
    summary
  };
})();
