(function () {
  "use strict";

  const meta = window.MathCampGrade5ReferenceSourceMeta || { byId: {} };

  // 逐页扫描索引：覆盖 Reference/grade5 下全部 PDF 页。
  // text-extractable 表示已能用 PDF 文本层抽出文字；scan-image 表示扫描图像页。
  // 扫描页不伪造 OCR 原文，只基于文件主题、页码和可辨题型生成可追溯派生题。
  const pdfSources = [
    {
      sourceId: "g5-math-formulas",
      pages: 6,
      textPages: [1, 2, 3, 4, 5, 6],
      subject: "math",
      pointCycle: ["g5-decimal", "g5-equation", "g5-geometry-motion", "g5-volume", "g5-average-stat", "g5-unit"]
    },
    {
      sourceId: "g5-math-error-word",
      pages: 8,
      textPages: [8],
      subject: "math",
      pointCycle: ["g5-word", "g5-decimal", "g5-equation", "g5-two-step", "g5-reading", "g5-thinking"]
    },
    {
      sourceId: "g5-math-peiyou-100",
      pages: 80,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g5-thinking",
        "g5-appendix",
        "g5-reading",
        "g5-decimal",
        "g5-decimal-add",
        "g5-equation",
        "g5-fraction",
        "g5-geometry-motion",
        "g5-volume",
        "g5-average-stat",
        "g5-percent",
        "g5-word",
        "g5-two-step",
        "g5-vertical",
        "g5-unit"
      ]
    },
    {
      sourceId: "g5-chinese-dictation",
      pages: 16,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      subject: "chinese",
      pointCycle: [
        "c5-context-word",
        "c5-paragraph-structure",
        "c5-reading",
        "c5-classic",
        "c5-expository-reading",
        "c5-writing-structure",
        "c5-book-reading",
        "c5-integrated"
      ]
    },
    {
      sourceId: "g5-english-ready",
      pages: 96,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e5-vocabulary-week-season",
        "e5-phonics-letter-groups",
        "e5-pattern-habit-ability",
        "e5-grammar-there-present",
        "e5-reading-schedule"
      ]
    },
    {
      sourceId: "g5-math-special-training",
      pages: 34,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g5-decimal",
        "g5-decimal-add",
        "g5-vertical",
        "g5-equation",
        "g5-fraction",
        "g5-geometry-motion",
        "g5-volume",
        "g5-average-stat",
        "g5-percent",
        "g5-word",
        "g5-two-step",
        "g5-reading",
        "g5-thinking",
        "g5-appendix",
        "g5-unit"
      ]
    },
    {
      sourceId: "g5-math-olympiad-training",
      pages: 6,
      textPages: [1, 2, 3, 4, 5, 6],
      subject: "math",
      pointCycle: ["g5-thinking", "g5-appendix", "g5-reading", "g5-word", "g5-geometry-motion"]
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
        grade: 5,
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

  window.MathCampGrade5ReferenceScanIndex = {
    pdfSources,
    pages,
    summary
  };
})();
