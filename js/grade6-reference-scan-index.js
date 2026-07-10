(function () {
  "use strict";

  const meta = window.MathCampGrade6ReferenceSourceMeta || { byId: {} };

  // 逐页扫描索引：覆盖 Reference/grade6 下全部 PDF 页。
  // text-extractable 表示已能用 PDF 文本层抽出文字；scan-image 表示扫描图像页。
  // 扫描页不伪造 OCR 原文，只基于文件主题、页码和可辨题型生成可追溯派生题。
  const pdfSources = [
    {
      sourceId: "g6-math-key-knowledge",
      pages: 8,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8],
      subject: "math",
      pointCycle: ["g6-fraction-percent", "g6-circle", "g6-ratio", "g6-percent", "g6-scale", "g6-solid-position", "g6-equation", "g6-two-step"]
    },
    {
      sourceId: "g6-math-formulas",
      pages: 10,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      subject: "math",
      pointCycle: ["g6-circle", "g6-fraction-percent", "g6-ratio", "g6-percent", "g6-scale", "g6-vertical"]
    },
    {
      sourceId: "g6-math-solve-word",
      pages: 10,
      textPages: [10],
      subject: "math",
      pointCycle: ["g6-complex-word", "g6-fraction-percent", "g6-percent", "g6-ratio", "g6-reading", "g6-thinking"]
    },
    {
      sourceId: "g6-chinese-quiz",
      pages: 16,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      subject: "chinese",
      pointCycle: [
        "c6-language-basic",
        "c6-transition",
        "c6-reading-strategy",
        "c6-classic",
        "c6-view-summary",
        "c6-expression",
        "c6-writing-upgrade",
        "c6-famous-book"
      ]
    },
    {
      sourceId: "g6-english-ready",
      pages: 96,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e6-vocabulary-travel-feeling",
        "e6-phonics-stress-ed",
        "e6-pattern-plan-advice",
        "e6-grammar-past-tense",
        "e6-reading-story"
      ]
    },
    {
      sourceId: "g6-english-wcx-copybook",
      pages: 60,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e6-vocabulary-travel-feeling",
        "e6-phonics-stress-ed",
        "e6-pattern-plan-advice",
        "e6-grammar-past-tense",
        "e6-reading-story"
      ]
    },
    {
      sourceId: "g6-chinese-sunshine-paper",
      pages: 64,
      textPages: [],
      subject: "chinese",
      pointCycle: [
        "c6-reading-strategy",
        "c6-language-basic",
        "c6-transition",
        "c6-classic",
        "c6-view-summary",
        "c6-expression",
        "c6-writing-upgrade",
        "c6-famous-book"
      ]
    },
    {
      sourceId: "g6-chinese-key-knowledge",
      pages: 14,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      subject: "chinese",
      pointCycle: [
        "c6-language-basic",
        "c6-classic",
        "c6-reading-strategy",
        "c6-transition",
        "c6-view-summary",
        "c6-expression"
      ]
    },
    {
      sourceId: "g6-math-olympiad-collection",
      pages: 6,
      textPages: [1, 2, 3, 4, 5, 6],
      subject: "math",
      pointCycle: ["g6-thinking", "g6-appendix", "g6-reading", "g6-complex-word", "g6-ratio"]
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
        grade: 6,
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

  window.MathCampGrade6ReferenceScanIndex = {
    pdfSources,
    pages,
    summary
  };
})();
