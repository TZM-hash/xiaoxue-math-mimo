(function () {
  "use strict";

  // 四年级本地资料索引。
  // 这里只记录维护元数据，不把 Reference/grade4 下的原始资料打包进应用题库。
  const files = [
    {
      id: "g4-english-wcx-copybook",
      subject: "english",
      grade: 4,
      fileType: "pdf",
      fileName: "25秋《王朝霞活页默写》英语 人教版 4上.pdf",
      path: "Reference/grade4/25秋《王朝霞活页默写》英语 人教版 4上.pdf",
      pages: 79,
      extractStatus: "scan-image",
      usableFor: ["四上单元同步", "单词默写", "句型默写", "自然拼读"],
      note: "扫描型英语默写资料，按四上 PEP 单元词汇、句型和拼读结构改写。"
    },
    {
      id: "g4-chinese-key-knowledge",
      subject: "chinese",
      grade: 4,
      fileType: "pdf",
      fileName: "四年级上册语文《全册常考知识点汇总》（12页）.pdf",
      path: "Reference/grade4/四年级上册语文《全册常考知识点汇总》（12页）.pdf",
      pages: 12,
      extractStatus: "text-extractable",
      usableFor: ["词句段运用", "病句修改", "古诗文积累", "资料提取"],
      note: "文本层可抽取但部分页面排版较碎，按知识点整理客观题。"
    },
    {
      id: "g4-math-key-knowledge",
      subject: "math",
      grade: 4,
      fileType: "pdf",
      fileName: "四年级数学上册必背知识点归纳.pdf",
      path: "Reference/grade4/四年级数学上册必背知识点归纳.pdf",
      pages: 5,
      extractStatus: "text-extractable",
      usableFor: ["大数认识", "角的度量", "三位数乘两位数", "统计与单位"],
      note: "文本可抽取，适合作为四上数学基础知识和公式类题来源。"
    },
    {
      id: "g4-math-special-training",
      subject: "math",
      grade: 4,
      fileType: "pdf",
      fileName: "四年级数学专题满分特训练习卷（通用版）.pdf",
      path: "Reference/grade4/四年级数学专题满分特训练习卷（通用版）.pdf",
      pages: 34,
      extractStatus: "scan-image",
      usableFor: ["专题训练", "多位乘除", "角与图形", "应用题"],
      note: "扫描型专题卷，按专题和页码生成可追溯派生题。"
    },
    {
      id: "g4-english-ready",
      subject: "english",
      grade: 4,
      fileType: "pdf",
      fileName: "四年级我来啦英语.pdf",
      path: "Reference/grade4/四年级我来啦英语.pdf",
      pages: 96,
      extractStatus: "scan-image",
      usableFor: ["英语入门复习", "词汇情境", "基础句型", "短文阅读"],
      note: "扫描型英语资料，按四年级词汇、地点时间问答和短文信息定位改写。"
    },
    {
      id: "g4-chinese-sunshine-paper",
      subject: "chinese",
      grade: 4,
      fileType: "pdf",
      fileName: "四年级语文上册《阳光同学全优好卷》.pdf",
      path: "Reference/grade4/四年级语文上册《阳光同学全优好卷》.pdf",
      pages: 64,
      extractStatus: "scan-image",
      usableFor: ["字词句", "现代文阅读", "古诗文理解", "习作审题"],
      note: "扫描型试卷，题库按题型结构改写；扫描不清晰处跳过原题细节。"
    },
    {
      id: "g4-math-midterm-docx",
      subject: "math",
      grade: 4,
      fileType: "docx",
      fileName: "四上期中检测卷.docx",
      path: "Reference/grade4/四上期中检测卷.docx",
      pages: null,
      extractStatus: "text-extractable",
      usableFor: ["容量单位", "因数倍数", "三位数除两位数", "期中综合"],
      note: "Word 文档文本可抽取，补充四上期中综合题和易错填空。"
    },
    {
      id: "g4-math-bar-stat-word",
      subject: "math",
      grade: 4,
      fileType: "pdf",
      fileName: "四上数学期末条形统计图应用题(4).pdf",
      path: "Reference/grade4/四上数学期末条形统计图应用题(4).pdf",
      pages: 2,
      extractStatus: "scan-image",
      usableFor: ["条形统计图", "数据比较", "统计应用题"],
      note: "少量文本层不稳定，按条形统计图题型结构改写。"
    },
    {
      id: "g4-math-peiyou-100",
      subject: "math",
      grade: 4,
      fileType: "pdf",
      fileName: "四上数学王朝霞培优100分.pdf",
      path: "Reference/grade4/四上数学王朝霞培优100分.pdf",
      pages: 72,
      extractStatus: "scan-image",
      usableFor: ["培优推理", "角与图形", "大数与估算", "应用题"],
      note: "扫描型大文件，按清晰题型结构生成可追溯派生题；不伪造 OCR 原文。"
    },
    {
      id: "g4-math-olympiad-training",
      subject: "math",
      grade: 4,
      fileType: "pdf",
      fileName: "小学四年级奥数培训综合训练及答案.pdf",
      path: "Reference/grade4/小学四年级奥数培训综合训练及答案.pdf",
      pages: 5,
      extractStatus: "text-extractable",
      usableFor: ["奥数培训", "巧算综合", "图形计数", "植树问题", "和差倍推理"],
      note: "文本可抽取的小学奥数培训综合训练，含答案页，按题型结构整理为可判分派生题。"
    }
  ];

  const byId = Object.fromEntries(files.map((file) => [file.id, file]));

  window.MathCampGrade4ReferenceSourceMeta = {
    files,
    byId
  };
})();
