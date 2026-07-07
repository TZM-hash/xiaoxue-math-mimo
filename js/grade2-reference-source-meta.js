(function () {
  "use strict";

  // 二年级本地资料索引。
  // 这里只记录维护元数据，不把 Reference/grade2 下的原始资料打包进应用题库。
  const files = [
    {
      id: "g2-math-formulas",
      subject: "math",
      grade: 2,
      fileType: "pdf",
      fileName: "二上数学公式.pdf",
      path: "Reference/grade2/二上数学公式.pdf",
      pages: 6,
      extractStatus: "text-extractable",
      usableFor: ["单位换算", "时间公式", "图形数数"],
      note: "文本可抽取，适合整理单位、时间、图形计数等基础题。"
    },
    {
      id: "g2-math-length-application",
      subject: "math",
      grade: 2,
      fileType: "pdf",
      fileName: "二上数学期末重点厘米应用题(4).pdf",
      path: "Reference/grade2/二上数学期末重点厘米应用题(4).pdf",
      pages: 10,
      extractStatus: "scan-image",
      usableFor: ["厘米应用题", "长度比较", "生活测量"],
      note: "首页无可抽取文字，后续如需精确引用题面，应渲染页面或截图后人工确认。"
    },
    {
      id: "g2-math-peiyou-100",
      subject: "math",
      grade: 2,
      fileType: "pdf",
      fileName: "二上数学王朝霞培优100分.pdf",
      path: "Reference/grade2/二上数学王朝霞培优100分.pdf",
      pages: 56,
      extractStatus: "scan-image",
      usableFor: ["培优应用题", "推理", "搭配", "观察物体"],
      note: "扫描型大文件，第一批只按题型结构改写，不直接搬运不清晰题面。"
    },
    {
      id: "g2-math-key-knowledge",
      subject: "math",
      grade: 2,
      fileType: "pdf",
      fileName: "二年级数学上册必背重点知识汇总_20220629100621.pdf",
      path: "Reference/grade2/二年级数学上册必背重点知识汇总_20220629100621.pdf",
      pages: 6,
      extractStatus: "text-extractable",
      usableFor: ["长度单位", "100以内加减", "角", "乘法意义"],
      note: "文本可抽取，适合作为知识点扩充和概念判断题来源。"
    },
    {
      id: "g2-math-special-training",
      subject: "math",
      grade: 2,
      fileType: "pdf",
      fileName: "二年级数学专题满分特训练习卷（通用版）.pdf",
      path: "Reference/grade2/二年级数学专题满分特训练习卷（通用版）.pdf",
      pages: 33,
      extractStatus: "scan-image",
      usableFor: ["专题训练", "两步应用", "表内乘除"],
      note: "扫描型试卷，第一批按专题题型改写，避免引用看不清的原题。"
    },
    {
      id: "g2-chinese-sunshine-paper",
      subject: "chinese",
      grade: 2,
      fileType: "pdf",
      fileName: "二年级语文上册《阳光同学全优好卷》.pdf",
      path: "Reference/grade2/二年级语文上册《阳光同学全优好卷》.pdf",
      pages: 64,
      extractStatus: "scan-image",
      usableFor: ["字词句", "阅读理解", "看图写话"],
      note: "扫描型试卷，适合抽题型结构；看不清部分跳过。"
    },
    {
      id: "g2-chinese-key-knowledge",
      subject: "chinese",
      grade: 2,
      fileType: "pdf",
      fileName: "二年级语文上册常考重点知识点汇总.pdf",
      path: "Reference/grade2/二年级语文上册常考重点知识点汇总.pdf",
      pages: 7,
      extractStatus: "text-extractable",
      usableFor: ["重点词语", "成语积累", "ABB/AABB词语", "近反义词"],
      note: "文本可抽取，适合作为词语积累和语基题来源。"
    },
    {
      id: "g2-chinese-picture-writing-doc",
      subject: "chinese",
      grade: 2,
      fileType: "doc",
      fileName: "二年级看图写话图片及范文.doc",
      path: "Reference/grade2/二年级看图写话图片及范文.doc",
      pages: null,
      extractStatus: "binary-doc",
      usableFor: ["看图写话", "顺序表达", "人物地点事情"],
      note: "旧版 Word 文档，第一批先按看图写话能力点生成自评题；后续可另行转换并截取清晰图片。"
    }
  ];

  const byId = Object.fromEntries(files.map((file) => [file.id, file]));

  window.MathCampGrade2ReferenceSourceMeta = {
    files,
    byId
  };
})();
