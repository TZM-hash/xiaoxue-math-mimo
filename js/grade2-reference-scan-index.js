(function () {
  "use strict";

  const meta = window.MathCampGrade2ReferenceSourceMeta || { byId: {} };

  // 逐页扫描索引：覆盖 Reference/grade2 下全部 PDF 页。
  // text-extractable 表示已能用 PDF 文本层抽出文字；scan-image 表示该页是扫描图像页，
  // 第一轮不伪造 OCR 原文，只基于文件主题、页码和可辨题型生成可追溯题。
  const pdfSources = [
    {
      sourceId: "g2-math-formulas",
      pages: 6,
      textPages: [1, 2, 3, 4, 5, 6],
      subject: "math",
      pointCycle: ["g2-time-money", "g2-length-measure", "g2-angle-view", "g2-thinking", "g2-appendix", "g2-table"]
    },
    {
      sourceId: "g2-math-length-application",
      pages: 10,
      textPages: [10],
      subject: "math",
      pointCycle: ["g2-length-measure", "g2-simple-word", "g2-reading", "g2-vertical", "g2-two-step", "g2-thinking"]
    },
    {
      sourceId: "g2-math-peiyou-100",
      pages: 56,
      textPages: [],
      subject: "math",
      pointCycle: ["g2-thinking", "g2-appendix", "g2-reading", "g2-angle-view", "g2-two-step", "g2-table-div", "g2-two-step-muldiv", "g2-simple-word"]
    },
    {
      sourceId: "g2-math-key-knowledge",
      pages: 6,
      textPages: [1, 2, 3, 4, 5, 6],
      subject: "math",
      pointCycle: ["g2-length-measure", "g2-100-add", "g2-angle-view", "g2-table", "g2-table-div", "g2-time-money"]
    },
    {
      sourceId: "g2-math-special-training",
      pages: 33,
      textPages: [],
      subject: "math",
      pointCycle: ["g2-100-add", "g2-vertical", "g2-two-step", "g2-two-step-muldiv", "g2-table", "g2-table-div", "g2-simple-word", "g2-reading"]
    },
    {
      sourceId: "g2-chinese-sunshine-paper",
      pages: 64,
      textPages: [],
      subject: "chinese",
      pointCycle: [
        "c2-sound-shape",
        "c2-word-match",
        "c2-sentence",
        "c2-punctuation",
        "c2-reading",
        "c2-poem",
        "c2-picture-writing",
        "c2-usage",
        "c2-textbook-sound-shape",
        "c2-textbook-word-collocation",
        "c2-textbook-sequence-reading",
        "c2-textbook-cause-effect",
        "c2-textbook-picture-writing-order"
      ]
    },
    {
      sourceId: "g2-chinese-key-knowledge",
      pages: 7,
      textPages: [1, 2, 3, 4, 5, 6, 7],
      subject: "chinese",
      pointCycle: [
        "c2-word-match",
        "c2-sound-shape",
        "c2-poem",
        "c2-textbook-word-collocation",
        "c2-textbook-sound-shape",
        "c2-sentence",
        "c2-reading"
      ]
    },
    {
      sourceId: "g2-math-olympiad-100",
      pages: 32,
      textPages: Array.from({ length: 32 }, (_, index) => index + 1),
      subject: "math",
      pointCycle: [
        "g2-thinking",
        "g2-appendix",
        "g2-reading",
        "g2-simple-word",
        "g2-two-step",
        "g2-two-step-muldiv",
        "g2-table",
        "g2-time-money",
        "g2-angle-view",
        "g2-length-measure"
      ]
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
        grade: 2,
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

  window.MathCampGrade2ReferenceScanIndex = {
    pdfSources,
    pages,
    summary
  };
})();
