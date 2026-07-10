(function () {
  "use strict";

  // 五年级本地资料索引。
  // 这里只记录维护元数据，不把 Reference/grade5 下的原始资料打包进应用题库。
  const files = [
    {
      id: "g5-math-formulas",
      subject: "math",
      grade: 5,
      fileType: "pdf",
      fileName: "五(上）数学 公式大全..pdf",
      path: "Reference/grade5/五(上）数学 公式大全..pdf",
      pages: 6,
      extractStatus: "text-extractable",
      usableFor: ["小数运算", "简易方程", "多边形面积", "体积", "统计"],
      note: "文本可抽取的公式大全，适合作为五上数学公式和基础知识题来源。"
    },
    {
      id: "g5-math-error-word",
      subject: "math",
      grade: 5,
      fileType: "pdf",
      fileName: "五上数学期末易错应用题(4).pdf",
      path: "Reference/grade5/五上数学期末易错应用题(4).pdf",
      pages: 8,
      extractStatus: "scan-image",
      usableFor: ["小数应用题", "方程应用", "行程问题", "易错题"],
      note: "扫描型易错应用题，按题型结构改写为可判分派生题。"
    },
    {
      id: "g5-math-peiyou-100",
      subject: "math",
      grade: 5,
      fileType: "pdf",
      fileName: "五上数学王朝霞培优100分.pdf",
      path: "Reference/grade5/五上数学王朝霞培优100分.pdf",
      pages: 80,
      extractStatus: "scan-image",
      usableFor: ["培优推理", "小数与方程", "多边形面积", "应用题"],
      note: "扫描型大文件，按清晰题型结构生成可追溯派生题；不伪造 OCR 原文。"
    },
    {
      id: "g5-chinese-dictation",
      subject: "chinese",
      grade: 5,
      fileType: "pdf",
      fileName: "五上语文【1-8单元课文重点默写单】.pdf",
      path: "Reference/grade5/五上语文【1-8单元课文重点默写单】.pdf",
      pages: 16,
      extractStatus: "text-extractable",
      usableFor: ["课文默写", "词句积累", "古诗文", "语境用词"],
      note: "文本可抽取的默写单，按五上单元课文重点整理为客观题。"
    },
    {
      id: "g5-english-ready",
      subject: "english",
      grade: 5,
      fileType: "pdf",
      fileName: "五年级我来啦英语.pdf",
      path: "Reference/grade5/五年级我来啦英语.pdf",
      pages: 96,
      extractStatus: "scan-image",
      usableFor: ["英语复习", "词汇情境", "基础句型", "短文阅读"],
      note: "扫描型英语资料，按五年级词汇、句型和短文信息定位改写。"
    },
    {
      id: "g5-math-special-training",
      subject: "math",
      grade: 5,
      fileType: "pdf",
      fileName: "五年级数学专题满分特训练习卷（通用版）.pdf",
      path: "Reference/grade5/五年级数学专题满分特训练习卷（通用版）.pdf",
      pages: 34,
      extractStatus: "scan-image",
      usableFor: ["专题训练", "小数乘除", "方程", "多边形面积", "应用题"],
      note: "扫描型专题卷，按专题和页码生成可追溯派生题。"
    },
    {
      id: "g5-math-olympiad-training",
      subject: "math",
      grade: 5,
      fileType: "pdf",
      fileName: "小学五年级奥数培训综合训练及答案.pdf",
      path: "Reference/grade5/小学五年级奥数培训综合训练及答案.pdf",
      pages: 6,
      extractStatus: "text-extractable",
      usableFor: ["奥数培训", "巧算综合", "行程问题", "数论", "几何计数"],
      note: "文本可抽取的小学奥数培训综合训练，含答案页，按题型结构整理为可判分派生题。"
    }
  ];

  const byId = Object.fromEntries(files.map((file) => [file.id, file]));

  window.MathCampGrade5ReferenceSourceMeta = {
    files,
    byId
  };
})();
