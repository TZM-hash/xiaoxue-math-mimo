(function () {
  "use strict";

  // 六年级本地资料索引。
  // 这里只记录维护元数据，不把 Reference/grade6 下的原始资料打包进应用题库。
  const files = [
    {
      id: "g6-math-key-knowledge",
      subject: "math",
      grade: 6,
      fileType: "pdf",
      fileName: "六（上）数学： 必背知识点清单.pdf",
      path: "Reference/grade6/六（上）数学： 必背知识点清单.pdf",
      pages: 8,
      extractStatus: "text-extractable",
      usableFor: ["分数运算", "圆", "比和百分数", "位置与方向"],
      note: "文本可抽取的必背知识点清单，适合作为六上数学基础知识题来源。"
    },
    {
      id: "g6-math-formulas",
      subject: "math",
      grade: 6,
      fileType: "pdf",
      fileName: "六上数学公式(1).pdf",
      path: "Reference/grade6/六上数学公式(1).pdf",
      pages: 10,
      extractStatus: "text-extractable",
      usableFor: ["圆的周长面积", "分数乘除", "比", "百分数"],
      note: "文本可抽取的公式资料，适合公式和基础计算题来源。"
    },
    {
      id: "g6-math-solve-word",
      subject: "math",
      grade: 6,
      fileType: "pdf",
      fileName: "六上数学期末解决问题应用题(4).pdf",
      path: "Reference/grade6/六上数学期末解决问题应用题(4).pdf",
      pages: 10,
      extractStatus: "scan-image",
      usableFor: ["分数应用题", "百分数应用", "比的应用", "解决问题"],
      note: "扫描型解决问题应用题，按题型结构改写为可判分派生题。"
    },
    {
      id: "g6-chinese-quiz",
      subject: "chinese",
      grade: 6,
      fileType: "pdf",
      fileName: "六上语文【1-8单元基础小测（空白）】.pdf",
      path: "Reference/grade6/六上语文【1-8单元基础小测（空白）】.pdf",
      pages: 16,
      extractStatus: "text-extractable",
      usableFor: ["字词基础", "语言积累", "课文理解", "单元小测"],
      note: "文本可抽取的基础小测，按六上单元字词和课文重点整理为客观题。"
    },
    {
      id: "g6-english-ready",
      subject: "english",
      grade: 6,
      fileType: "pdf",
      fileName: "六年级我来啦英语.pdf",
      path: "Reference/grade6/六年级我来啦英语.pdf",
      pages: 96,
      extractStatus: "scan-image",
      usableFor: ["英语复习", "词汇情境", "过去时句型", "短文阅读"],
      note: "扫描型英语资料，按六年级词汇、句型和短文信息定位改写。"
    },
    {
      id: "g6-english-wcx-copybook",
      subject: "english",
      grade: 6,
      fileType: "pdf",
      fileName: "六年级英语上册人教PEP版24秋《王朝霞活页英语默写》.pdf",
      path: "Reference/grade6/六年级英语上册人教PEP版24秋《王朝霞活页英语默写》.pdf",
      pages: 60,
      extractStatus: "scan-image",
      usableFor: ["单词默写", "句型默写", "六上单元同步"],
      note: "扫描型英语默写资料，按六上 PEP 单元词汇和句型结构改写。"
    },
    {
      id: "g6-chinese-sunshine-paper",
      subject: "chinese",
      grade: 6,
      fileType: "pdf",
      fileName: "六年级语文上册《阳光同学全优好卷》.pdf",
      path: "Reference/grade6/六年级语文上册《阳光同学全优好卷》.pdf",
      pages: 64,
      extractStatus: "scan-image",
      usableFor: ["字词句", "现代文阅读", "古诗文理解", "习作审题"],
      note: "扫描型试卷，题库按题型结构改写；扫描不清晰处跳过原题细节。"
    },
    {
      id: "g6-chinese-key-knowledge",
      subject: "chinese",
      grade: 6,
      fileType: "pdf",
      fileName: "六年级语文上册全册重点知识点汇总.pdf",
      path: "Reference/grade6/六年级语文上册全册重点知识点汇总.pdf",
      pages: 14,
      extractStatus: "text-extractable",
      usableFor: ["词句段运用", "古诗文积累", "阅读策略", "语言基础"],
      note: "文本可抽取的重点知识点汇总，按知识点整理客观题。"
    },
    {
      id: "g6-math-olympiad-collection",
      subject: "math",
      grade: 6,
      fileType: "pdf",
      fileName: "小学六年级经典必学奥数题集锦及答案.pdf",
      path: "Reference/grade6/小学六年级经典必学奥数题集锦及答案.pdf",
      pages: 6,
      extractStatus: "text-extractable",
      usableFor: ["奥数集锦", "分数与比", "工程问题", "行程问题", "几何综合"],
      note: "文本可抽取的经典奥数题集锦，含答案，按题型结构整理为可判分派生题。"
    }
  ];

  const byId = Object.fromEntries(files.map((file) => [file.id, file]));

  window.MathCampGrade6ReferenceSourceMeta = {
    files,
    byId
  };
})();
