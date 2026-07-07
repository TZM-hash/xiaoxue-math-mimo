(function () {
  "use strict";

  // 三年级本地资料索引。
  // 这里只记录维护元数据，不把 Reference/grade3 下的原始资料打包进应用题库。
  const files = [
    {
      id: "g3-english-wcx-copybook",
      subject: "english",
      grade: 3,
      fileType: "pdf",
      fileName: "25秋《王朝霞活页默写》英语 人教版 3上.pdf.pdf",
      path: "Reference/grade3/25秋《王朝霞活页默写》英语 人教版 3上.pdf.pdf",
      pages: 79,
      extractStatus: "scan-image",
      usableFor: ["字母默写", "单词默写", "句型巩固", "三上单元同步"],
      note: "扫描型英语默写资料，按三上 PEP 单元词汇、字母和句型结构改写。"
    },
    {
      id: "g3-math-mixed-word",
      subject: "math",
      grade: 3,
      fileType: "pdf",
      fileName: "三上数学期末混合运算应用题(4).pdf",
      path: "Reference/grade3/三上数学期末混合运算应用题(4).pdf",
      pages: 9,
      extractStatus: "scan-image",
      usableFor: ["混合运算应用题", "两步应用题", "读题筛条件"],
      note: "少量页面有破碎文本层，但不可稳定抽题；按页码和题型结构改写。"
    },
    {
      id: "g3-math-peiyou-100",
      subject: "math",
      grade: 3,
      fileType: "pdf",
      fileName: "三上数学王朝霞培优100分.pdf",
      path: "Reference/grade3/三上数学王朝霞培优100分.pdf",
      pages: 64,
      extractStatus: "scan-image",
      usableFor: ["培优推理", "周长图形", "倍的认识", "统计与分数"],
      note: "扫描型大文件，按清晰题型结构生成可追溯派生题；不伪造 OCR 原文。"
    },
    {
      id: "g3-math-formula-docx",
      subject: "math",
      grade: 3,
      fileType: "docx",
      fileName: "三年级上册数学必背公式汇总.docx",
      path: "Reference/grade3/三年级上册数学必背公式汇总.docx",
      pages: null,
      extractStatus: "text-extractable",
      usableFor: ["长度单位", "质量单位", "时间单位", "周长公式"],
      note: "Word 文档文本可抽取，适合作为单位换算和公式类题的知识点来源。"
    },
    {
      id: "g3-chinese-key-knowledge",
      subject: "chinese",
      grade: 3,
      fileType: "pdf",
      fileName: "三年级上册语文全册重要知识点汇总(9页).pdf",
      path: "Reference/grade3/三年级上册语文全册重要知识点汇总(9页).pdf",
      pages: 9,
      extractStatus: "text-extractable",
      usableFor: ["古诗积累", "成语词语", "谚语名言", "词句段运用"],
      note: "文本可抽取，适合整理三上语文基础知识和客观题。"
    },
    {
      id: "g3-english-ready",
      subject: "english",
      grade: 3,
      fileType: "pdf",
      fileName: "三年级我来啦英语.pdf",
      path: "Reference/grade3/三年级我来啦英语.pdf",
      pages: 96,
      extractStatus: "scan-image",
      usableFor: ["英语入门", "词汇情境", "基础句型", "短对话阅读"],
      note: "扫描型英语资料，按三年级起点英语能力线改写。"
    },
    {
      id: "g3-math-special-training",
      subject: "math",
      grade: 3,
      fileType: "pdf",
      fileName: "三年级数学专题满分特训练习卷（通用版）.pdf",
      path: "Reference/grade3/三年级数学专题满分特训练习卷（通用版）.pdf",
      pages: 35,
      extractStatus: "scan-image",
      usableFor: ["专题训练", "竖式计算", "周长", "分数与统计"],
      note: "扫描型专题卷，按专题和页码生成派生题。"
    },
    {
      id: "g3-chinese-sunshine-paper",
      subject: "chinese",
      grade: 3,
      fileType: "pdf",
      fileName: "三年级语文上册《阳光同学全优好卷》.pdf",
      path: "Reference/grade3/三年级语文上册《阳光同学全优好卷》.pdf",
      pages: 64,
      extractStatus: "scan-image",
      usableFor: ["字词句", "段落阅读", "古诗理解", "习作片段"],
      note: "扫描型试卷，题库按题型结构改写；扫描不清晰处跳过原题细节。"
    }
  ];

  const byId = Object.fromEntries(files.map((file) => [file.id, file]));

  window.MathCampGrade3ReferenceSourceMeta = {
    files,
    byId
  };
})();
