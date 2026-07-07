(function () {
  "use strict";

  const meta = window.MathCampGrade4ReferenceSourceMeta || { byId: {} };

  // 逐页扫描索引：覆盖 Reference/grade4 下全部 PDF 页。
  // text-extractable 表示已能用 PDF 文本层抽出文字；scan-image 表示扫描图像页。
  // 扫描页不伪造 OCR 原文，只基于文件主题、页码和可辨题型生成可追溯派生题。
  const pdfSources = [
    {
      sourceId: "g4-english-wcx-copybook",
      pages: 79,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e4-vocabulary-home-school",
        "e4-phonics-silent-e",
        "e4-pattern-location-time",
        "e4-grammar-plural-pronoun",
        "e4-reading-notice",
        "e4-unit-1-1",
        "e4-unit-1-2",
        "e4-unit-1-3",
        "e4-unit-1-4",
        "e4-unit-1-5",
        "e4-unit-1-6"
      ]
    },
    {
      sourceId: "g4-chinese-key-knowledge",
      pages: 12,
      textPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      subject: "chinese",
      pointCycle: [
        "c4-word-sentence",
        "c4-sick-sentence",
        "c4-rhetoric-punctuation",
        "c4-modern-reading",
        "c4-writing-topic",
        "c4-poem-classic",
        "c4-info-reading",
        "c4-usage"
      ]
    },
    {
      sourceId: "g4-math-key-knowledge",
      pages: 5,
      textPages: [1, 2, 3, 4, 5],
      subject: "math",
      pointCycle: ["g4-large", "g4-vertical", "g4-mixed", "g4-angle-triangle", "g4-statistics"]
    },
    {
      sourceId: "g4-math-special-training",
      pages: 34,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g4-mixed",
        "g4-vertical",
        "g4-two-step",
        "g4-large",
        "g4-area",
        "g4-angle-triangle",
        "g4-mul-div",
        "g4-statistics",
        "g4-word",
        "g4-reading",
        "g4-thinking",
        "g4-appendix"
      ]
    },
    {
      sourceId: "g4-english-ready",
      pages: 96,
      textPages: [],
      subject: "english",
      pointCycle: [
        "e4-vocabulary-home-school",
        "e4-phonics-silent-e",
        "e4-pattern-location-time",
        "e4-grammar-plural-pronoun",
        "e4-reading-notice",
        "e4-unit-1-1",
        "e4-unit-1-2",
        "e4-unit-1-3",
        "e4-unit-1-4",
        "e4-unit-1-5",
        "e4-unit-1-6",
        "e4-unit-2-1",
        "e4-unit-2-2",
        "e4-unit-2-3",
        "e4-unit-2-4",
        "e4-unit-2-5",
        "e4-unit-2-6"
      ]
    },
    {
      sourceId: "g4-chinese-sunshine-paper",
      pages: 64,
      textPages: [],
      subject: "chinese",
      pointCycle: [
        "c4-modern-reading",
        "c4-word-sentence",
        "c4-sick-sentence",
        "c4-rhetoric-punctuation",
        "c4-writing-topic",
        "c4-poem-classic",
        "c4-info-reading",
        "c4-usage"
      ]
    },
    {
      sourceId: "g4-math-bar-stat-word",
      pages: 2,
      textPages: [1],
      subject: "math",
      pointCycle: ["g4-statistics", "g4-reading"]
    },
    {
      sourceId: "g4-math-peiyou-100",
      pages: 72,
      textPages: [],
      subject: "math",
      pointCycle: [
        "g4-thinking",
        "g4-appendix",
        "g4-reading",
        "g4-angle-triangle",
        "g4-area",
        "g4-statistics",
        "g4-word",
        "g4-mixed",
        "g4-vertical",
        "g4-large",
        "g4-mul-div",
        "g4-two-step"
      ]
    },
    {
      sourceId: "g4-math-olympiad-training",
      pages: 5,
      textPages: [1, 2, 3, 4, 5],
      subject: "math",
      pointCycle: ["g4-thinking", "g4-appendix", "g4-reading", "g4-word", "g4-angle-triangle"]
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
        grade: 4,
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

  window.MathCampGrade4ReferenceScanIndex = {
    pdfSources,
    pages,
    summary
  };
})();
