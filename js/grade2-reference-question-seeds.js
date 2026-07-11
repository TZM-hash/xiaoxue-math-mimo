(function () {
  "use strict";

  const sourceMeta = window.MathCampGrade2ReferenceSourceMeta || { byId: {} };
  const BANK = {};

  function source(sourceId, page, sourceNote, quality = "manual-rewrite", extra = {}) {
    const info = sourceMeta.byId?.[sourceId] || {};
    return {
      kind: "referenceDerived",
      name: info.fileName || sourceId,
      url: `local-reference:${info.path || sourceId}`,
      license: "User-provided local reference for private question-bank maintenance",
      sourceId,
      sourceFile: info.fileName || sourceId,
      sourcePath: info.path || "",
      sourcePage: page || null,
      sourceNote,
      quality,
      ...(extra.scanStatus ? { scanStatus: extra.scanStatus } : {}),
      ...(extra.visualPolicy ? { visualPolicy: extra.visualPolicy } : {})
    };
  }

  function add(pointId, items) {
    BANK[pointId] = (BANK[pointId] || []).concat(items);
  }

  function text(id, sourceId, page, questionText, answer, explanation, steps, templateType, sourceNote, acceptedAnswers) {
    return {
      id,
      answerType: "text",
      text: questionText,
      answer: String(answer),
      acceptedAnswers: (acceptedAnswers || [String(answer)]).map(String),
      explanation,
      steps,
      templateType,
      sourceMeta: source(sourceId, page, sourceNote, sourceId.includes("key") || sourceId.includes("formulas") ? "text-extracted" : "manual-rewrite")
    };
  }

  function choice(id, sourceId, page, prompt, correct, wrongs, explanation, steps, templateType, sourceNote) {
    return {
      id,
      answerType: "choice",
      prompt,
      correct,
      wrongs,
      explanation,
      steps,
      questionType: templateType,
      sourceMeta: source(sourceId, page, sourceNote, sourceId.includes("key") || sourceId.includes("formulas") ? "text-extracted" : "manual-rewrite")
    };
  }

  function judge(id, sourceId, page, statement, answer, explanation, steps, templateType, sourceNote) {
    const normalized = answer === true || answer === "对" ? "对" : "错";
    return {
      id,
      answerType: "judge",
      text: `判断：${statement}`,
      answer: normalized,
      acceptedAnswers: normalized === "对" ? ["对", "正确", "是"] : ["错", "错误", "不对", "否"],
      explanation,
      steps,
      templateType,
      sourceMeta: source(sourceId, page, sourceNote, sourceId.includes("key") || sourceId.includes("formulas") ? "text-extracted" : "manual-rewrite")
    };
  }

  function pdfCrop(sourceId, page, src, alt, cropNote) {
    const info = sourceMeta.byId?.[sourceId] || {};
    return {
      src,
      alt,
      sourceId,
      sourceFile: info.fileName || sourceId,
      sourcePath: info.path || "",
      sourcePage: page,
      cropNote
    };
  }

  function pdfCropMeta(sourceId, page, sourceNote) {
    const info = sourceMeta.byId?.[sourceId] || {};
    return source(sourceId, page, sourceNote, "pdf-crop-image", {
      scanStatus: info.extractStatus || "",
      visualPolicy: "pdf-crop-image"
    });
  }

  function imageText(id, sourceId, page, questionText, answer, explanation, steps, templateType, sourceNote, image, acceptedAnswers) {
    return {
      id,
      answerType: "text",
      text: questionText,
      answer: String(answer),
      acceptedAnswers: (acceptedAnswers || [String(answer)]).map(String),
      explanation,
      steps,
      templateType,
      sourceMeta: pdfCropMeta(sourceId, page, sourceNote),
      sourceImage: image
    };
  }

  function imageChoice(id, sourceId, page, prompt, correct, wrongs, explanation, steps, templateType, sourceNote, image) {
    return {
      id,
      answerType: "choice",
      prompt,
      correct,
      wrongs,
      explanation,
      steps,
      questionType: templateType,
      sourceMeta: pdfCropMeta(sourceId, page, sourceNote),
      sourceImage: image
    };
  }

  // 数学：根据资料中的二上知识点、公式、专题训练题型改写。
  add("g2-100-add", [
    text("ref-g2-math-100add-001", "g2-math-key-knowledge", 1, "笔算 46 + 27 = ?（只填得数）", "73", "个位 6 + 7 = 13，写 3 向十位进 1；十位 4 + 2 + 1 = 7。", ["个位先算 6 + 7。", "满十向十位进 1。", "十位合起来是 7，所以得 73。"], "100以内进位加法", "来源资料强调相同数位对齐和个位进位。"),
    text("ref-g2-math-100add-002", "g2-math-key-knowledge", 1, "笔算 82 - 35 = ?（只填得数）", "47", "个位 2 不够减 5，从十位退 1 作 12，12 - 5 = 7；十位 7 - 3 = 4。", ["个位不够减，先退位。", "算个位 12 - 5 = 7。", "算十位 7 - 3 = 4。"], "100以内退位减法", "来源资料强调退位减法从个位算起。"),
    choice("ref-g2-math-100add-003", "g2-math-key-knowledge", 1, "计算 58 + 26 时，个位相加 8 + 6 = 14，下一步最合适的是哪一项？", "个位写 4，向十位进 1", ["个位写 14", "十位不变", "先把 58 写成 85"], "个位满十要向十位进 1，个位只写 4。", ["先看个位是否满十。", "8 + 6 = 14，满十。", "个位写 4，十位进 1。"], "进位规则选择", "来源资料强调进位写法。")
  ]);

  add("g2-vertical", [
    choice("ref-g2-math-vertical-001", "g2-math-key-knowledge", 1, "列竖式计算 35 + 48 时，最重要的书写要求是什么？", "个位和个位对齐，十位和十位对齐", ["数字越大写在越左边", "先写答案再补算式", "把 35 写在 48 右边"], "竖式计算首先要相同数位对齐。", ["看清数位。", "个位对个位。", "十位对十位。"], "竖式数位对齐", "来源资料原文强调相同数位要对齐。"),
    text("ref-g2-math-vertical-002", "g2-math-key-knowledge", 1, "用竖式思路算 70 - 26 = ?（只填得数）", "44", "个位 0 不够减 6，从十位退 1，10 - 6 = 4；十位 6 - 2 = 4。", ["个位 0 不够减，要退位。", "个位得 4。", "十位得 4。"], "退位竖式", "来源资料强调减法从个位算起并退位。"),
    judge("ref-g2-math-vertical-003", "g2-math-key-knowledge", 1, "做 100 以内加减竖式时，可以不管数位，只要把数字写整齐就行。", "错", "竖式必须相同数位对齐，不只是写整齐。", ["判断题干说法。", "对照竖式规则：相同数位对齐。", "题干忽略数位，所以错误。"], "竖式规则判断", "来源资料强调相同数位对齐。")
  ]);

  add("g2-two-step", [
    text("ref-g2-math-twostep-001", "g2-math-special-training", 8, "图书角原有 36 本书，借走 18 本，又放回 9 本。现在有多少本？", "27", "先求借走后剩 36 - 18 = 18，再加放回的 9 本，18 + 9 = 27。", ["先算借走后剩多少。", "再加放回的数量。", "36 - 18 + 9 = 27。"], "加减混合应用", "扫描卷按两步应用题题型改写，未引用不清晰原题。"),
    choice("ref-g2-math-twostep-002", "g2-math-special-training", 9, "小明有 28 张贴纸，小红比他多 13 张，两人一共有多少张？第一步应先算什么？", "小红有多少张", ["两人相差多少张", "28 - 13", "贴纸是什么颜色"], "要求两人一共，需要先求小红的张数。", ["读问题：两人一共。", "已知小红比小明多。", "先算小红有多少张。"], "两步应用第一步", "扫描卷按应用题结构改写。"),
    text("ref-g2-math-twostep-003", "g2-math-special-training", 9, "商店上午卖出 24 个面包，下午比上午多卖 16 个。全天一共卖出多少个？", "64", "下午卖出 24 + 16 = 40 个，全天 24 + 40 = 64 个。", ["先求下午卖出多少个。", "再把上午和下午合起来。", "24 + (24 + 16) = 64。"], "比多两步应用", "扫描卷按两步应用题题型改写。")
  ]);

  add("g2-two-step-muldiv", [
    text("ref-g2-math-muldiv2-001", "g2-math-special-training", 12, "每盒有 6 支铅笔，买 4 盒后又送给同学 5 支，还剩多少支？", "19", "先算共有 6 × 4 = 24 支，再算 24 - 5 = 19 支。", ["先求 4 盒共有多少支。", "再减去送出的 5 支。", "结果是 19 支。"], "乘减两步应用", "专题训练卷按表内乘法应用题改写。"),
    choice("ref-g2-math-muldiv2-002", "g2-math-special-training", 12, "24 个苹果，每 6 个装一袋，装好后又吃掉 2 袋。下面哪条算式能求还剩几袋？", "24 ÷ 6 - 2", ["24 - 6 × 2", "24 ÷ 2 + 6", "24 + 6 - 2"], "先求能装几袋，再减去吃掉的袋数。", ["平均装袋先用除法。", "吃掉 2 袋再减 2。", "算式是 24 ÷ 6 - 2。"], "除减两步应用", "专题训练卷按表内除法应用题改写。"),
    text("ref-g2-math-muldiv2-003", "g2-math-special-training", 13, "3 个小组做花，每组做 8 朵，又拿走 7 朵布置黑板。还剩多少朵？", "17", "3 组共有 3 × 8 = 24 朵，拿走 7 朵后剩 17 朵。", ["先算一共有多少朵。", "再减去拿走的数量。", "24 - 7 = 17。"], "乘减生活题", "专题训练卷按乘法两步题改写。")
  ]);

  add("g2-table", [
    text("ref-g2-math-table-001", "g2-math-key-knowledge", 4, "口诀“三七二十一”可以帮助计算 3 × 7 = ?。", "21", "三七二十一表示 3 个 7 或 7 个 3 都是 21。", ["找到口诀三七二十一。", "对应 3 × 7。", "得数是 21。"], "乘法口诀", "来源资料包含表内乘法重点。"),
    choice("ref-g2-math-table-002", "g2-math-key-knowledge", 4, "“5 个 4 相加”可以写成哪一个乘法算式？", "5 × 4", ["5 + 4", "5 - 4", "4 ÷ 5"], "几个相同加数相加可以写成乘法。", ["找相同加数 4。", "有 5 个 4。", "写成 5 × 4。"], "乘法意义", "来源资料按乘法意义改写。"),
    judge("ref-g2-math-table-003", "g2-math-key-knowledge", 4, "4 + 4 + 4 可以写成 3 × 4。", "对", "3 个 4 相加就是 3 × 4。", ["数一数有几个 4。", "有 3 个相同加数。", "可以写成 3 × 4。"], "乘法意义判断", "来源资料按乘法意义改写。")
  ]);

  add("g2-table-div", [
    text("ref-g2-math-div-001", "g2-math-special-training", 15, "30 个本子平均分给 5 个小组，每组几个？", "6", "平均分用除法，30 ÷ 5 = 6。", ["看到平均分。", "列式 30 ÷ 5。", "想五六三十，得 6。"], "平均分除法", "专题训练卷按平均分题型改写。"),
    choice("ref-g2-math-div-002", "g2-math-special-training", 15, "18 个苹果，每 3 个装一袋，可以装几袋？", "6 袋", ["3 袋", "15 袋", "21 袋"], "每 3 个一袋，求能装几袋，用 18 ÷ 3 = 6。", ["找每份数量 3。", "总数 18。", "18 ÷ 3 = 6。"], "包含除", "专题训练卷按包含除题型改写。"),
    judge("ref-g2-math-div-003", "g2-math-key-knowledge", 5, "计算 24 ÷ 4 时，可以想口诀“四六二十四”。", "对", "4 × 6 = 24，所以 24 ÷ 4 = 6。", ["找除数 4 和总数 24。", "想与 4 有关的口诀。", "四六二十四，所以正确。"], "想乘算除", "来源资料按表内除法重点改写。")
  ]);

  add("g2-time-money", [
    text("ref-g2-math-time-001", "g2-math-formulas", 1, "1 时 = ? 分。", "60", "时间单位换算中，1 时等于 60 分。", ["回忆时间单位。", "1 时等于 60 分。", "填 60。"], "时间单位换算", "公式资料明确列出 1 时=60 分。"),
    text("ref-g2-math-time-002", "g2-math-formulas", 1, "9:00 开始做手工，经过 25 分钟结束。结束时是 9 时几分？只填分钟数。", "25", "开始是 9:00，过 25 分钟就是 9:25。", ["看开始时间 9:00。", "加上 25 分钟。", "结束是 9:25。"], "经过时间", "公式资料列出开始时间+经过时间=结束时间。"),
    choice("ref-g2-math-money-003", "g2-math-formulas", 1, "一盒彩笔 8 元，付 10 元，应找回多少钱？", "2 元", ["18 元", "8 元", "10 元"], "付出的钱减去价格，10 - 8 = 2 元。", ["找付出的钱 10 元。", "找价格 8 元。", "10 - 8 = 2。"], "人民币找零", "公式资料包含生活单位换算，按钱币应用改写。")
  ]);

  add("g2-length-measure", [
    text("ref-g2-math-length-001", "g2-math-key-knowledge", 1, "1 米 = ? 厘米。", "100", "长度单位换算中，1 米等于 100 厘米。", ["回忆米和厘米的关系。", "1 米 = 100 厘米。", "填 100。"], "米厘米换算", "知识点资料明确列出 1 米=100 厘米。"),
    choice("ref-g2-math-length-002", "g2-math-length-application", 2, "量课桌的长度，比较合适的单位是哪一个？", "厘米", ["千米", "吨", "小时"], "课桌较短，通常用厘米或米；选项中厘米最合适。", ["先判断物体长短。", "课桌不是很长。", "选择厘米。"], "长度单位选择", "厘米应用题资料按测量情境改写。"),
    judge("ref-g2-math-length-003", "g2-math-key-knowledge", 1, "线段是直的，有两个端点，可以量出长度。", "对", "资料中的线段知识点强调直、有两个端点、可量长度。", ["判断线段特征。", "直、有两个端点、可量长度都正确。", "所以判断为对。"], "线段概念判断", "知识点资料明确说明线段特征。")
  ]);

  add("g2-angle-view", [
    choice("ref-g2-math-angle-001", "g2-math-key-knowledge", 2, "一个角通常由哪几部分组成？", "一个顶点和两条边", ["两个顶点和一条边", "三条边", "一个圆和一条线"], "角有一个顶点和两条边。", ["回忆角的组成。", "角有一个顶点。", "角还有两条边。"], "角的组成", "知识点资料包含角的初步认识。"),
    judge("ref-g2-math-angle-002", "g2-math-key-knowledge", 2, "角的大小和边画得长不长没有关系。", "对", "角的大小看两边张开的程度，不看边长。", ["判断影响角大小的因素。", "角看张开程度。", "边长不影响角大小。"], "角大小判断", "知识点资料明确说明角大小与边长无关。"),
    choice("ref-g2-math-view-003", "g2-math-peiyou-100", 18, "从不同方向观察同一个物体，看到的形状一定完全相同吗？", "不一定", ["一定相同", "一定都是圆", "一定都是正方形"], "观察方向不同，看到的面可能不同。", ["读题：不同方向观察。", "想立体物体不同侧面。", "形状不一定相同。"], "观察物体判断", "培优资料按观察物体题型改写。")
  ]);

  add("g2-simple-word", [
    text("ref-g2-math-word-001", "g2-math-special-training", 20, "每排有 7 把椅子，摆了 5 排。一共有多少把椅子？", "35", "每排 7 把，5 排就是 5 个 7，7 × 5 = 35。", ["找每排数量 7。", "找排数 5。", "用乘法 7 × 5。"], "每份几份应用", "专题训练卷按乘法应用题改写。"),
    text("ref-g2-math-word-002", "g2-math-special-training", 20, "有 42 朵花，平均插在 6 个花瓶里，每个花瓶插几朵？", "7", "平均分用除法，42 ÷ 6 = 7。", ["看到平均插在 6 个花瓶。", "列式 42 ÷ 6。", "想六七四十二。"], "平均分应用", "专题训练卷按除法应用题改写。"),
    choice("ref-g2-math-word-003", "g2-math-special-training", 21, "小丽买 4 支铅笔，每支 2 元，还买 1 块橡皮 3 元。一共花多少钱？", "4 × 2 + 3", ["4 + 2 + 3", "4 × 3 + 2", "4 ÷ 2 + 3"], "先求铅笔的钱，再加橡皮的钱。", ["铅笔共 4 × 2 元。", "橡皮 3 元。", "合起来是 4 × 2 + 3。"], "乘加应用", "专题训练卷按购物应用题改写。")
  ]);

  add("g2-reading", [
    choice("ref-g2-math-reading-001", "g2-math-special-training", 24, "题目：盒子里有 36 张卡片，用掉 9 张，还剩的卡片中有 5 张蓝色。要求还剩多少张，哪个数字不用参加计算？", "5", ["36", "9", "36 和 9"], "问还剩总数，只需要总数 36 和用掉 9，蓝色 5 是干扰信息。", ["先看问题：还剩多少张。", "需要总数和用掉数量。", "蓝色数量不用参与。"], "干扰条件筛选", "专题训练卷按读题筛条件题型改写。"),
    choice("ref-g2-math-reading-002", "g2-math-special-training", 24, "小华有 18 本书，小明比他多 7 本。要求小明有多少本，第一步应该算什么？", "18 + 7", ["18 - 7", "18 + 18", "只看 7"], "“比他多 7 本”表示小明比 18 多 7，用加法。", ["找谁和谁比较。", "小明比小华多。", "用 18 + 7。"], "第一步判断", "专题训练卷按读题第一步题型改写。"),
    judge("ref-g2-math-reading-003", "g2-math-special-training", 25, "做应用题时，题目里出现的每一个数字都必须参加计算。", "错", "应用题常有干扰信息，要按问题筛选有用条件。", ["判断题干是否绝对。", "资料题型常考筛条件。", "不是每个数字都要用。"], "读题策略判断", "专题训练卷按干扰条件题型改写。")
  ]);

  add("g2-thinking", [
    choice("ref-g2-math-thinking-001", "g2-math-peiyou-100", 30, "找规律：2，4，8，16，下一个数是多少？", "32", ["18", "24", "30"], "每次乘 2，16 × 2 = 32。", ["观察相邻两个数。", "发现每次乘 2。", "16 的 2 倍是 32。"], "规律推理", "培优资料按找规律题型改写。"),
    text("ref-g2-math-thinking-002", "g2-math-peiyou-100", 31, "甲有 18 张卡片，乙有 10 张。甲给乙几张后，两人一样多？", "4", "两人相差 8 张，甲给乙 4 张后，甲少 4、乙多 4，正好一样多。", ["先求差：18 - 10 = 8。", "给出去会让两边差距每次减少 2。", "8 ÷ 2 = 4。"], "移多补少", "培优资料按简单均分思维改写。"),
    choice("ref-g2-math-thinking-003", "g2-math-peiyou-100", 32, "小朋友排队，小林前面有 6 人，后面有 8 人。这一队一共有多少人？", "15 人", ["14 人", "13 人", "16 人"], "总人数要加上小林自己，6 + 1 + 8 = 15。", ["前面 6 人。", "后面 8 人。", "不要漏掉自己 1 人。"], "排队问题", "培优资料按排队题型改写。")
  ]);

  add("g2-appendix", [
    choice("ref-g2-math-appendix-001", "g2-math-peiyou-100", 34, "红、黄、蓝三种彩旗按顺序重复，第 8 面是什么颜色？", "黄", ["红", "蓝", "绿"], "3 面一组，8 ÷ 3 余 2，第 8 面是每组第 2 面黄旗。", ["找循环组：红黄蓝。", "8 除以 3 余 2。", "余 2 对应黄。"], "周期规律", "培优资料按周期题型改写。"),
    text("ref-g2-math-appendix-002", "g2-math-peiyou-100", 35, "用数字 2、5、8 可以组成几个不同的两位数？", "6", "十位有 3 种选法，个位剩 2 种，共 3 × 2 = 6 个。", ["先选十位，有 3 种。", "再选个位，剩 2 种。", "3 × 2 = 6。"], "搭配问题", "培优资料按数学广角搭配题型改写。"),
    judge("ref-g2-math-appendix-003", "g2-math-peiyou-100", 36, "做简单推理题时，可以用列表或排除法帮助判断。", "对", "二年级推理题常用列表、画图、排除法。", ["读判断句。", "列表和排除法都能整理条件。", "所以正确。"], "推理方法", "培优资料按推理方法改写。")
  ]);

  // 语文：根据二上语文知识点汇总、试卷题型和看图写话资料改写。
  add("c2-sound-shape", [
    choice("ref-g2-cn-sound-001", "g2-chinese-key-knowledge", 1, "下面哪组词语中的字形搭配最合适？", "清清的河水", ["晴晴的河水", "请请的河水", "情情的河水"], "“清”常和水有关，适合“清清的河水”。", ["看语境是河水。", "联系偏旁三点水。", "选择“清清的河水”。"], "字形辨析", "语文知识点资料按形近字辨析改写。"),
    choice("ref-g2-cn-sound-002", "g2-chinese-sunshine-paper", 8, "“长大”中的“长”读音更接近哪一项？", "zhang3", ["chang2", "chang4", "zhan3"], "表示生长、长大时，“长”读 zhang3。", ["先看词语意思。", "长大表示生长。", "读 zhang3。"], "多音字", "试卷按多音字题型改写。"),
    judge("ref-g2-cn-sound-003", "g2-chinese-key-knowledge", 1, "辨析同音字时，只看读音就一定能选对字。", "错", "同音字读音相同，还要联系偏旁和语境。", ["判断是否只看读音。", "同音字需要看意思。", "题干说一定，错误。"], "同音字判断", "语文知识点资料按字音字形题改写。")
  ]);

  add("c2-word-match", [
    choice("ref-g2-cn-word-001", "g2-chinese-key-knowledge", 1, "下面哪个词语搭配最自然？", "灿烂的阳光", ["灿烂的铅笔", "灿烂的书包", "灿烂的尺子"], "“灿烂”常形容阳光、笑容等。", ["读四个搭配。", "找常见自然表达。", "选择灿烂的阳光。"], "词语搭配", "语文知识点资料按重点词语积累改写。"),
    text("ref-g2-cn-word-002", "g2-chinese-key-knowledge", 1, "照样子写词语：高高兴兴。题目要求写 AABB 式，请在“干净”基础上写一个词。", "干干净净", "“干净”变成 AABB 式是“干干净净”。", ["看清 AABB 格式。", "把“干净”两个字分别重叠。", "写成干干净净。"], "AABB词语", "资料中列有 AABB 式词语。"),
    choice("ref-g2-cn-word-003", "g2-chinese-key-knowledge", 1, "“一（ ）花”括号里填哪个量词最合适？", "朵", ["条", "本", "只"], "花通常说“一朵花”。", ["看名词是花。", "回忆常见量词。", "选择朵。"], "量词搭配", "语文知识点资料按词语搭配改写。")
  ]);

  add("c2-sentence", [
    choice("ref-g2-cn-sentence-001", "g2-chinese-sunshine-paper", 14, "把句子写具体：“小鸟唱歌。”下面扩句最通顺的是哪一句？", "可爱的小鸟在树枝上唱歌。", ["唱歌小鸟可爱树枝。", "小鸟。", "在树枝上。"], "扩句要保持通顺，并补充样子、地点等信息。", ["读原句。", "补充小鸟样子和地点。", "保持句子通顺。"], "扩句", "试卷按扩句题型改写。"),
    choice("ref-g2-cn-sentence-002", "g2-chinese-sunshine-paper", 15, "下面哪一句话最完整？", "小明在操场上跑步。", ["小明在操场上。", "跑步。", "操场上小明。"], "完整句通常要说清谁、在哪里、做什么。", ["找人物。", "找地点。", "找动作。"], "完整句", "试卷按句子训练题型改写。"),
    text("ref-g2-cn-sentence-003", "g2-chinese-sunshine-paper", 15, "把“花儿开了”扩成更具体的句子，可以填：公园里的花儿（ ）开了。括号里填一个合适词语。", "慢慢地", "“慢慢地”能补充花儿开放的样子，句子通顺。", ["读句子。", "括号里应填修饰动作的词语。", "填慢慢地。"], "补充句子", "试卷按补充句子题型改写。", ["慢慢地", "悄悄地"])
  ]);

  add("c2-punctuation", [
    choice("ref-g2-cn-punc-001", "g2-chinese-sunshine-paper", 18, "句子“你今天去图书馆吗”末尾最合适的标点是哪个？", "？", ["。", "！", "，"], "这句话是在提问，句末用问号。", ["先判断语气。", "有“吗”，是在提问。", "句末用问号。"], "问号使用", "试卷按标点题型改写。"),
    choice("ref-g2-cn-punc-002", "g2-chinese-sunshine-paper", 18, "句子“公园里的花真美啊”末尾最合适的标点是哪个？", "！", ["。", "？", "、"], "“真美啊”表达强烈赞叹，句末可用感叹号。", ["读出语气。", "这是赞叹。", "选感叹号。"], "感叹号使用", "试卷按标点语气题型改写。"),
    judge("ref-g2-cn-punc-003", "g2-chinese-sunshine-paper", 18, "所有句子末尾都应该用句号。", "错", "不同语气用不同标点，疑问用问号，感叹可用感叹号。", ["判断“所有”是否正确。", "想到问句和感叹句。", "所以错误。"], "标点判断", "试卷按标点语气题型改写。")
  ]);

  add("c2-reading", [
    choice("ref-g2-cn-reading-001", "g2-chinese-sunshine-paper", 26, "材料：小雨先写作业，再收拾书包，最后去操场跳绳。题目：小雨先做什么？", "写作业", ["收拾书包", "跳绳", "吃午饭"], "顺序词“先”后面的事情是写作业。", ["找到顺序词“先”。", "看它后面的内容。", "答案是写作业。"], "顺序阅读", "试卷按短文顺序题型改写。"),
    choice("ref-g2-cn-reading-002", "g2-chinese-sunshine-paper", 27, "材料：因为下雨，大家把活动改到教室里。题目：活动改到教室里的原因是什么？", "下雨", ["教室很大", "大家想画画", "操场很近"], "“因为下雨”说明原因。", ["找到“因为”。", "因为后面是原因。", "答案是下雨。"], "因果阅读", "试卷按因果阅读题型改写。"),
    judge("ref-g2-cn-reading-003", "g2-chinese-sunshine-paper", 28, "做短文阅读题时，应该回到材料里找依据。", "对", "二年级阅读题要根据短文内容判断，不能只凭猜测。", ["读题干说法。", "阅读题需要材料依据。", "所以正确。"], "阅读策略", "试卷按阅读理解策略改写。")
  ]);

  add("c2-poem", [
    choice("ref-g2-cn-poem-001", "g2-chinese-key-knowledge", 3, "古诗中写到“飞流直下三千尺”，主要让人感受到瀑布怎么样？", "又高又急", ["很安静", "很短", "没有水"], "“飞流直下”写出瀑布落下又快又有气势。", ["读关键词飞流直下。", "联系瀑布画面。", "感受高而急。"], "古诗画面", "语文知识点资料按古诗积累题型改写。"),
    choice("ref-g2-cn-poem-002", "g2-chinese-key-knowledge", 3, "理解古诗画面时，下面哪种方法最合适？", "抓住关键词想象画面", ["只数有几个字", "只看诗题颜色", "不读诗句"], "古诗理解要抓关键词，想象画面。", ["看题目问方法。", "排除无关做法。", "选择抓关键词。"], "古诗方法", "语文知识点资料按古诗积累改写。"),
    judge("ref-g2-cn-poem-003", "g2-chinese-key-knowledge", 3, "背古诗时，只会背题目就算理解古诗。", "错", "理解古诗还要知道诗句大意和画面。", ["判断题干是否完整。", "只背题目不够。", "所以错误。"], "古诗理解判断", "语文知识点资料按古诗积累改写。")
  ]);

  add("c2-picture-writing", [
    choice("ref-g2-cn-picture-001", "g2-chinese-picture-writing-doc", 1, "看图写话时，最应该先看清哪三项？", "人物、地点、事情", ["页码、颜色、价格", "天气、尺子、数字", "标点、拼音、声调"], "看图写话要先看谁、在哪里、做什么。", ["先观察人物。", "再看地点。", "最后看事情。"], "看图写话要素", "看图写话资料按能力点整理，未截取不清晰图片。"),
    choice("ref-g2-cn-picture-002", "g2-chinese-picture-writing-doc", 2, "画面中如果有“先浇水，再扶正小树，最后整理工具”，写话时应注意什么？", "按顺序写清动作", ["只写一个词", "不写人物", "把最后的事写在最前"], "有明显先后顺序时，写话要按顺序表达。", ["抓住先、再、最后。", "按顺序写动作。", "句子要通顺。"], "看图写话顺序", "看图写话资料按顺序表达能力点整理。"),
    judge("ref-g2-cn-picture-003", "g2-chinese-picture-writing-doc", 3, "看图写话只写“真好看”三个字就足够清楚。", "错", "看图写话要写清人物、地点和事情，不能只写空泛评价。", ["判断句子是否清楚。", "真好看没有人物和事情。", "所以不够清楚。"], "看图写话判断", "看图写话资料按表达完整性整理。")
  ]);

  add("c2-usage", [
    choice("ref-g2-cn-usage-001", "g2-chinese-sunshine-paper", 34, "写留言条时，下面哪一项通常不能少？", "留言给谁、事情、署名和时间", ["只写天气", "只写颜色", "只画图案"], "留言条要交代对象、事情、署名和时间。", ["看应用文类型。", "留言条要让别人看明白。", "写清对象、事情、署名、时间。"], "留言条要素", "试卷按综合语用题型改写。"),
    choice("ref-g2-cn-usage-002", "g2-chinese-sunshine-paper", 35, "向同学借书时，哪句话更有礼貌？", "请问我可以借这本书看一看吗？", ["把书给我。", "快点拿来。", "这书我要了。"], "请求别人帮助时要用礼貌用语。", ["判断说话对象。", "选择语气礼貌的句子。", "含“请问、可以吗”更合适。"], "礼貌表达", "试卷按口语交际题型改写。"),
    judge("ref-g2-cn-usage-003", "g2-chinese-sunshine-paper", 35, "写通知时，时间和地点写不写都可以。", "错", "通知必须让别人知道什么时候、在哪里、做什么。", ["判断通知目的。", "通知要交代时间地点事情。", "题干说可不写，错误。"], "通知要素判断", "试卷按应用文题型改写。")
  ]);

  add("c2-textbook-sound-shape", [
    choice("ref-g2-cn-tb-sound-001", "g2-chinese-key-knowledge", 1, "“晴、清、情”这组字辨析时，最有帮助的是哪一项？", "偏旁和语境", ["笔画越多越正确", "只看读音", "只看第一个字"], "形近同音字要联系偏旁和语境。", ["发现读音接近。", "看偏旁。", "结合词语意思。"], "教材同步字音字形", "对应二年级教材字音字形知识点。"),
    choice("ref-g2-cn-tb-sound-002", "g2-chinese-sunshine-paper", 8, "下面哪一个词语更适合填入“（ ）朗的天空”？", "晴", ["清", "情", "请"], "天空天气好，用“晴朗”。", ["读词语“晴朗”。", "晴和天气有关。", "选择晴。"], "形近字语境", "试卷按字形语境题型改写。"),
    judge("ref-g2-cn-tb-sound-003", "g2-chinese-key-knowledge", 1, "形近字常常需要结合词语意思来判断。", "对", "只看字形容易混淆，结合词语意思更准确。", ["判断学习方法。", "形近字要看意思。", "所以正确。"], "字形方法判断", "对应二年级教材字音字形知识点。")
  ]);

  add("c2-textbook-word-collocation", [
    choice("ref-g2-cn-tb-word-001", "g2-chinese-key-knowledge", 1, "下面哪一项是描写天气的词语？", "风和日丽", ["守株待兔", "一心一意", "七上八下"], "“风和日丽”描写天气晴好。", ["读四个词。", "找和天气有关的词。", "选择风和日丽。"], "词语分类", "资料中列有描写天气的词语。"),
    choice("ref-g2-cn-tb-word-002", "g2-chinese-key-knowledge", 1, "下面哪一项是出自寓言故事的成语？", "狐假虎威", ["风平浪静", "干干净净", "雪白雪白"], "狐假虎威是寓言故事成语。", ["看题目要求寓言故事。", "回忆常见寓言成语。", "选择狐假虎威。"], "成语积累", "资料中列有寓言故事成语。"),
    text("ref-g2-cn-tb-word-003", "g2-chinese-key-knowledge", 1, "照样子写 ABB 式词语：笑（ ）。", "眯眯", "“笑眯眯”是常见 ABB 式词语。", ["看清 ABB 结构。", "笑后面补两个相同字。", "写成笑眯眯。"], "ABB词语", "资料中列有 ABB 式词语。", ["眯眯", "哈哈"])
  ]);

  add("c2-textbook-sequence-reading", [
    choice("ref-g2-cn-tb-seq-001", "g2-chinese-sunshine-paper", 26, "材料：小刚先洗手，再吃饭，然后收拾碗筷。题目：小刚吃饭前做了什么？", "洗手", ["收拾碗筷", "写作业", "看电视"], "“先洗手，再吃饭”说明吃饭前是洗手。", ["找到吃饭。", "看吃饭前的顺序词。", "答案是洗手。"], "顺序词阅读", "试卷按顺序词阅读题型改写。"),
    choice("ref-g2-cn-tb-seq-002", "g2-chinese-sunshine-paper", 26, "读到“先、再、然后、最后”这些词时，主要帮助我们判断什么？", "事情的先后顺序", ["人物的身高", "字的偏旁", "诗的作者"], "这些词是顺序词，帮助判断事情先后。", ["识别顺序词。", "想它们的作用。", "选择先后顺序。"], "顺序词作用", "试卷按顺序阅读方法改写。"),
    judge("ref-g2-cn-tb-seq-003", "g2-chinese-sunshine-paper", 26, "阅读有顺序词的短文时，可以按顺序词整理事情。", "对", "顺序词能帮助理清先后。", ["判断学习方法。", "顺序词提示先后。", "所以正确。"], "顺序阅读判断", "试卷按顺序阅读方法改写。")
  ]);

  add("c2-textbook-cause-effect", [
    choice("ref-g2-cn-tb-cause-001", "g2-chinese-sunshine-paper", 27, "材料：因为小树缺水，明明给它浇了一桶水。题目：明明为什么给小树浇水？", "小树缺水", ["明明想睡觉", "水桶很新", "天气很冷"], "“因为小树缺水”说明原因。", ["找到因为。", "因为后面是原因。", "答案是小树缺水。"], "因果阅读", "试卷按因果阅读题型改写。"),
    choice("ref-g2-cn-tb-cause-002", "g2-chinese-sunshine-paper", 27, "看到“因为……所以……”这样的句子，通常要注意什么？", "原因和结果", ["近义词", "量词", "笔顺"], "因为提示原因，所以提示结果。", ["识别关联词。", "因为后面常是原因。", "所以后面常是结果。"], "因果词作用", "试卷按因果阅读方法改写。"),
    judge("ref-g2-cn-tb-cause-003", "g2-chinese-sunshine-paper", 27, "“因为”后面的内容常常表示原因。", "对", "因果句中“因为”常引出原因。", ["读判断句。", "回忆因果词作用。", "所以正确。"], "因果判断", "试卷按因果阅读方法改写。")
  ]);

  add("c2-textbook-picture-writing-order", [
    choice("ref-g2-cn-tb-picture-001", "g2-chinese-picture-writing-doc", 2, "看图写话中，如果画面显示事情有先后，最合适的表达方式是什么？", "先写第一件事，再写后面的事", ["想到什么写什么", "只写最后一件事", "只写图中颜色"], "有先后顺序的画面要按顺序写。", ["观察画面顺序。", "用先、再、最后连接。", "写清过程。"], "看图写话顺序", "看图写话资料按顺序能力点整理。"),
    choice("ref-g2-cn-tb-picture-002", "g2-chinese-picture-writing-doc", 3, "下面哪一句更适合作为看图写话开头？", "星期天，小朋友们来到公园种树。", ["真好。", "颜色很多。", "我不知道。"], "开头要交代时间、人物、地点和事情。", ["看开头是否清楚。", "找时间人物地点事情。", "选择信息完整的句子。"], "看图写话开头", "看图写话资料按表达完整性整理。"),
    judge("ref-g2-cn-tb-picture-003", "g2-chinese-picture-writing-doc", 3, "看图写话可以使用“先、再、最后”让事情更有条理。", "对", "这些顺序词能帮助表达先后。", ["判断顺序词作用。", "看图写话需要条理。", "所以正确。"], "看图写话方法判断", "看图写话资料按顺序表达整理。")
  ]);

  // PDF 截图资产题：图片来自 Reference/grade2 中清晰页的裁剪 PNG。
  // 这批仍属于 referenceDerived；sourceImage 只引用应用内 assets，不直接打包原始 PDF。
  add("g2-length-measure", [
    imageText(
      "ref-g2-img-length-pentagon-001",
      "g2-math-length-application",
      2,
      "看图，正五边形框架每条边长 5 米，围一圈一共需要多少米彩灯线？",
      "25",
      "正五边形有 5 条相等的边，每条边 5 米，一共是 5 × 5 = 25 米。",
      ["先数正五边形有 5 条边。", "每条边长 5 米。", "5 × 5 = 25 米。"],
      "PDF截图-正五边形周长",
      "从厘米应用题扫描页裁取清晰图形，作为图形应用题题图。",
      pdfCrop("g2-math-length-application", 2, "assets/reference/grade2/g2-length-pentagon-perimeter-p002.png", "正五边形每边 5 米的题图", "第 2 页第 7 题正五边形图。")
    ),
    imageText(
      "ref-g2-img-length-tree-001",
      "g2-math-length-application",
      2,
      "看图，每两棵树之间相距 6 米，第一棵树和第四棵树之间相距多少米？",
      "18",
      "从第 1 棵到第 4 棵之间有 3 个间隔，每个间隔 6 米，所以是 18 米。",
      ["先数第 1 棵到第 4 棵之间有 3 段。", "每段 6 米。", "3 × 6 = 18 米。"],
      "PDF截图-间隔问题",
      "从厘米应用题扫描页裁取清晰树距图，保留页码便于维护。",
      pdfCrop("g2-math-length-application", 2, "assets/reference/grade2/g2-length-tree-distance-p002.png", "四棵树相邻间隔 6 米的题图", "第 2 页第 8 题树距图。")
    ),
    imageText(
      "ref-g2-img-length-road-tree-001",
      "g2-math-length-application",
      2,
      "看图，一条长 30 米的路一侧栽树，每隔 6 米栽一棵，两端都栽，一共要栽多少棵？",
      "6",
      "30 米里面有 30 ÷ 6 = 5 个间隔，两端都栽时棵数比间隔数多 1，所以是 6 棵。",
      ["先求间隔数：30 ÷ 6 = 5。", "两端都栽，棵数 = 间隔数 + 1。", "5 + 1 = 6 棵。"],
      "PDF截图-两端都栽",
      "从厘米应用题扫描页裁取清晰植树问题图。",
      pdfCrop("g2-math-length-application", 2, "assets/reference/grade2/g2-length-road-trees-p002.png", "30 米路边每隔 6 米栽树的题图", "第 2 页第 9 题植树图。")
    )
  ]);

  add("g2-simple-word", [
    imageChoice(
      "ref-g2-img-ball-stat-001",
      "g2-math-peiyou-100",
      18,
      "看 PDF 截图，这类题最适合先做哪件事？",
      "按球的种类分类统计",
      ["直接把所有圆圈涂满", "只看星期几不看球", "把图中的球都当成同一种"],
      "图中同一周有不同种类的球，先按种类分类统计，后面才能比较多少。",
      ["先观察图例和表格。", "按球的种类分别数。", "再填表或比较。"],
      "PDF截图-图形统计",
      "从培优扫描页裁取球类统计图，作为读图统计题题图。",
      pdfCrop("g2-math-peiyou-100", 18, "assets/reference/grade2/g2-peiyou-ball-stat-p018.png", "一周三种球销售情况统计图", "第 18 页球类销售统计图。")
    ),
    imageText(
      "ref-g2-img-grocery-001",
      "g2-math-peiyou-100",
      30,
      "看图，牛奶每盒 8 元，买 7 盒牛奶一共多少元？",
      "56",
      "每盒 8 元，买 7 盒就是 7 个 8，8 × 7 = 56 元。",
      ["从图中读出牛奶每盒 8 元。", "买 7 盒，用乘法。", "8 × 7 = 56 元。"],
      "PDF截图-购物读图",
      "从培优扫描页裁取购物图，作为价格读图题题图。",
      pdfCrop("g2-math-peiyou-100", 30, "assets/reference/grade2/g2-peiyou-grocery-picture-p030.png", "蔬菜、蘑菇、牛奶等商品价格图", "第 30 页火锅食材价格图。")
    )
  ]);

  add("g2-thinking", [
    imageText(
      "ref-g2-img-pattern-001",
      "g2-math-special-training",
      20,
      "看图中第（1）小题数列：0，3，8，15，24，（ ），48。括号里应填几？",
      "35",
      "相邻两数的差依次是 3、5、7、9，下一次应加 11，所以 24 + 11 = 35。",
      ["先求相邻两数的差。", "发现差是 3、5、7、9，依次增加 2。", "所以下一个差是 11，24 + 11 = 35。"],
      "PDF截图-数列规律",
      "从专题训练扫描页裁取清晰数列规律题，作为规律题题图。",
      pdfCrop("g2-math-special-training", 20, "assets/reference/grade2/g2-special-number-pattern-p020.png", "找数列规律专题题图", "第 20 页找数列规律题。")
    )
  ]);

  add("c2-picture-writing", [
    imageChoice(
      "ref-g2-img-cn-picture-001",
      "g2-chinese-sunshine-paper",
      26,
      "看四格图写话，下面哪一句最适合作为开头？",
      "父亲和孩子在河边发现了一个洞。",
      ["今天我买了一盒彩笔。", "小朋友正在背古诗。", "这道数学题很难。"],
      "开头要先交代人物、地点和主要发现，图中是父亲和孩子在河边看到洞。",
      ["先看人物：父亲和孩子。", "再看地点：河边。", "最后看事情：发现洞。"],
      "PDF截图-看图写话",
      "从语文试卷扫描页裁取清晰四格图，作为看图写话观察题图。",
      pdfCrop("g2-chinese-sunshine-paper", 26, "assets/reference/grade2/g2-chinese-picture-writing-p026.png", "父亲和孩子在河边发现洞的四格图", "第 26 页看图写话四格图。")
    )
  ]);

  // 自动扩题区：完全依据 grade2-reference-scan-index 的逐页索引生成。
  // 这批题不混入原创题库；scan-image 页不伪造 OCR 原文，只按页码、资料主题和题型结构改写。
  // diagram 为自绘示意图，用于替代扫描件中不清晰或不宜直接裁切的图形题。
  const scanIndex = window.MathCampGrade2ReferenceScanIndex || { pages: [] };

  function pad(value, size = 3) {
    return String(value).padStart(size, "0");
  }

  function sourceScore(sourceId) {
    return String(sourceId || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  }

  function value(ctx, salt, min, span) {
    const safeSpan = Math.max(1, span);
    const page = Number(ctx.pageRecord.page) || 1;
    return min + ((page * 37 + ctx.pageIndex * 17 + ctx.templateIndex * 11 + sourceScore(ctx.pageRecord.sourceId) + salt) % safeSpan);
  }

  function pick(ctx, salt, items) {
    return items[value(ctx, salt, 0, items.length)];
  }

  function autoSource(ctx, templateType, diagram) {
    const pageRecord = ctx.pageRecord;
    const quality = pageRecord.extractStatus === "text-extractable" ? "text-extracted" : "scan-page-rewrite";
    const sourceNote = `${pageRecord.scanNote} 自动扩展：${templateType}。`;
    return source(pageRecord.sourceId, pageRecord.page, sourceNote, quality, {
      scanStatus: pageRecord.extractStatus,
      visualPolicy: diagram ? "self-drawn-diagram" : ""
    });
  }

  function autoText(ctx, questionText, answer, explanation, steps, templateType, acceptedAnswers, diagram) {
    return {
      id: ctx.id,
      answerType: "text",
      text: questionText,
      answer: String(answer),
      acceptedAnswers: (acceptedAnswers || [String(answer)]).map(String),
      explanation,
      steps,
      templateType,
      sourceMeta: autoSource(ctx, templateType, diagram),
      ...(diagram ? { diagram } : {})
    };
  }

  function autoChoice(ctx, prompt, correct, wrongs, explanation, steps, templateType, diagram) {
    return {
      id: ctx.id,
      answerType: "choice",
      prompt,
      correct: String(correct),
      wrongs: wrongs.map(String),
      explanation,
      steps,
      questionType: templateType,
      sourceMeta: autoSource(ctx, templateType, diagram),
      ...(diagram ? { diagram } : {})
    };
  }

  function autoJudge(ctx, statement, answer, explanation, steps, templateType, diagram) {
    const normalized = answer === true || answer === "对" ? "对" : "错";
    return {
      id: ctx.id,
      answerType: "judge",
      text: `判断：${statement}`,
      answer: normalized,
      acceptedAnswers: normalized === "对" ? ["对", "正确", "是"] : ["错", "错误", "不对", "否"],
      explanation,
      steps,
      templateType,
      sourceMeta: autoSource(ctx, templateType, diagram),
      ...(diagram ? { diagram } : {})
    };
  }

  function tablePair(ctx, saltA = 1, saltB = 2) {
    return [value(ctx, saltA, 2, 8), value(ctx, saltB, 2, 8)];
  }

  function shapeDiagram(ctx) {
    const circles = value(ctx, 3, 2, 5);
    const squares = value(ctx, 4, 2, 5);
    const triangles = value(ctx, 5, 1, 4);
    return {
      diagram: {
        type: "shape-count",
        shapes: [
          { kind: "circle", count: circles, label: "圆形" },
          { kind: "square", count: squares, label: "正方形" },
          { kind: "triangle", count: triangles, label: "三角形" }
        ],
        caption: "自绘图形计数示意"
      },
      circles,
      squares,
      triangles
    };
  }

  const T = {
    "g2-100-add": [
      (ctx) => {
        const a = value(ctx, 1, 24, 38);
        const b = value(ctx, 2, 8, 29);
        return autoText(ctx, `计算 ${a} + ${b} = ?`, a + b, `个位和十位分别相加，${a} + ${b} = ${a + b}。`, ["先看个位是否满十。", "再把十位合起来。", `得数是 ${a + b}。`], "100以内加法");
      },
      (ctx) => {
        const a = value(ctx, 3, 62, 35);
        const b = value(ctx, 4, 13, 29);
        return autoText(ctx, `计算 ${a} - ${b} = ?`, a - b, `先从个位算起，需要退位时向十位借 1。${a} - ${b} = ${a - b}。`, ["个位不够减先退位。", "十位再减。", `得数是 ${a - b}。`], "100以内退位减法");
      },
      (ctx) => {
        const onesA = value(ctx, 5, 5, 5);
        const onesB = value(ctx, 6, 6, 4);
        return autoChoice(ctx, `计算 4${onesA} + 2${onesB} 时，个位 ${onesA} + ${onesB} 满十，下一步应该怎么做？`, "个位写个位数，向十位进 1", ["个位写两个数字", "十位不变", "先把加号改成减号"], "个位满十要向十位进 1。", ["先算个位。", "满十进 1。", "再算十位。"], "进位规则选择");
      },
      (ctx) => autoJudge(ctx, "笔算两位数加减法时，相同数位要对齐。", "对", "竖式计算必须个位对个位、十位对十位。", ["看清数位。", "相同数位对齐。", "从个位算起。"], "数位对齐判断"),
      (ctx) => {
        const a = value(ctx, 7, 31, 45);
        const b = value(ctx, 8, 11, 23);
        return autoChoice(ctx, `${a} - ${b} 的验算方法，哪一项最合适？`, `${a - b} + ${b}`, [`${a} + ${b}`, `${a - b} - ${b}`, `${b} - ${a - b}`], "减法可以用差加减数等于被减数来验算。", ["先求差。", "用差加减数。", "看是否等于被减数。"], "减法验算");
      },
      (ctx) => {
        const a = value(ctx, 9, 36, 35);
        const b = value(ctx, 10, 12, 26);
        return autoText(ctx, `口算 ${a} + ${b} - ${b} = ?`, a, `先加 ${b} 再减 ${b}，相当于回到原来的 ${a}。`, ["观察加减的是同一个数。", "可以先抵消。", `结果是 ${a}。`], "加减关系");
      }
    ],
    "g2-vertical": [
      (ctx) => {
        const a = value(ctx, 11, 43, 42);
        const b = value(ctx, 12, 15, 27);
        return autoText(ctx, `用竖式思路计算 ${a} + ${b} = ?`, a + b, `相同数位对齐，从个位算起，得 ${a + b}。`, ["个位先相加。", "满十就进位。", "十位加上进位。"], "竖式加法");
      },
      (ctx) => {
        const a = value(ctx, 13, 70, 26);
        const b = value(ctx, 14, 18, 34);
        return autoText(ctx, `用竖式思路计算 ${a} - ${b} = ?`, a - b, `个位不够减时退位，${a} - ${b} = ${a - b}。`, ["先算个位。", "需要时从十位退 1。", "再算十位。"], "竖式减法");
      },
      (ctx) => autoChoice(ctx, "列竖式算 58 + 27 时，7 应该和哪个数对齐？", "8", ["5", "2", "58"], "个位要和个位对齐，7 是个位，应该和 8 对齐。", ["先认清 7 是个位。", "再找另一个数的个位。", "个位对个位。"], "竖式数位对齐"),
      (ctx) => autoJudge(ctx, "竖式减法中，个位不够减时可以从十位退 1。", "对", "退位后个位加 10 再减。", ["先看个位够不够。", "不够就退位。", "再继续计算。"], "退位规则"),
      (ctx) => {
        const answer = value(ctx, 15, 2, 7);
        const sum = 40 + answer + 30;
        return autoText(ctx, `竖式缺数：4□ + 30 = ${sum}，□里应填几？`, answer, `十位已经是 4 和 3，个位只有 □，所以 □ = ${sum - 70}。`, ["先看十位。", "再看个位。", `□ = ${answer}。`], "缺数竖式");
      },
      (ctx) => autoChoice(ctx, "做竖式计算后，最适合的检查方式是哪一项？", "用相反运算验算", ["只看题目长短", "把答案抄一遍", "不看进位退位"], "加法可用减法验算，减法可用加法验算。", ["看原题运算。", "选择相反运算。", "核对结果。"], "竖式验算")
    ],
    "g2-two-step": [
      (ctx) => {
        const start = value(ctx, 16, 28, 32);
        const out = value(ctx, 17, 8, 15);
        const back = value(ctx, 18, 4, 12);
        return autoText(ctx, `图书角有 ${start} 本书，借走 ${out} 本，又还回 ${back} 本。现在有多少本？`, start - out + back, `先算借走后剩 ${start - out} 本，再加还回的 ${back} 本。`, ["先算剩下多少。", "再加还回的数量。", `${start} - ${out} + ${back} = ${start - out + back}。`], "加减混合两步应用");
      },
      (ctx) => {
        const a = value(ctx, 19, 18, 20);
        const more = value(ctx, 20, 5, 14);
        return autoChoice(ctx, `小华有 ${a} 张卡片，小明比小华多 ${more} 张，要求两人一共有多少张，第一步应先算什么？`, "小明有多少张", ["两人相差多少张", "卡片是什么颜色", "小华还剩多少张"], "要求一共，需要先求出小明的张数。", ["读问题：两人一共。", "小明数量未知。", "先求小明有多少张。"], "两步应用第一步");
      },
      (ctx) => autoJudge(ctx, "两步应用题可以先找出中间量，再回答最后的问题。", "对", "很多两步题第一步就是求中间量。", ["先看最后问什么。", "找缺少的数量。", "再列第二步。"], "两步题策略"),
      (ctx) => {
        const morning = value(ctx, 21, 16, 18);
        const more = value(ctx, 22, 7, 14);
        return autoText(ctx, `面包店上午卖出 ${morning} 个面包，下午比上午多卖 ${more} 个。全天卖出多少个？`, morning + morning + more, `下午卖出 ${morning + more} 个，全天是 ${morning} + ${morning + more} = ${morning + morning + more} 个。`, ["先求下午。", "再把上午和下午相加。", "写出答数。"], "比多两步应用");
      },
      (ctx) => autoChoice(ctx, "看到“先买了、又买了、送出一些、还剩多少”这类题，通常要注意什么？", "按事情发生顺序列式", ["只用最后一个数字", "所有数都相乘", "只看单位名称"], "数量会随着事情变化，要按顺序计算。", ["读清先后。", "每一步改变数量。", "按顺序列式。"], "顺序变化应用"),
      (ctx) => {
        const a = value(ctx, 23, 25, 25);
        const b = value(ctx, 24, 6, 12);
        const c = value(ctx, 25, 8, 10);
        return autoText(ctx, `班级有 ${a} 张彩纸，第一次用去 ${b} 张，第二次用去 ${c} 张，还剩多少张？`, a - b - c, `连续用去两次，要从总数里依次减去。`, ["先减第一次用去的。", "再减第二次用去的。", `${a} - ${b} - ${c} = ${a - b - c}。`], "连减应用题");
      }
    ],
    "g2-two-step-muldiv": [
      (ctx) => {
        const [a, b] = tablePair(ctx, 26, 27);
        const c = value(ctx, 28, 3, 10);
        return autoText(ctx, `每盒有 ${a} 支笔，买 ${b} 盒后送出 ${c} 支，还剩多少支？`, a * b - c, `先算 ${b} 盒共有 ${a * b} 支，再减去 ${c} 支。`, ["先用乘法求总数。", "再减去送出的数量。", `${a} × ${b} - ${c} = ${a * b - c}。`], "乘减两步应用");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 29, 30);
        const eat = value(ctx, 31, 1, Math.max(1, b - 1));
        return autoChoice(ctx, `${a * b} 个苹果，每 ${a} 个装一袋，吃掉 ${eat} 袋后还剩几袋？`, `${a * b} ÷ ${a} - ${eat}`, [`${a * b} - ${a} - ${eat}`, `${a * b} ÷ ${eat} + ${a}`, `${a} × ${eat} + ${b}`], "先求装成几袋，再减去吃掉的袋数。", ["平均装袋用除法。", "吃掉几袋再减几。", "选择除减算式。"], "除减两步应用");
      },
      (ctx) => autoJudge(ctx, "解决乘除两步题时，要先读清每一步表示的是个数、袋数还是钱数。", "对", "单位不同，列式也不同。", ["圈出单位。", "判断先求什么。", "再计算。"], "乘除应用读题"),
      (ctx) => {
        const [a, b] = tablePair(ctx, 32, 33);
        const add = value(ctx, 34, 2, 9);
        return autoText(ctx, `${b} 组同学做花，每组做 ${a} 朵，又添上 ${add} 朵。一共有多少朵？`, a * b + add, `先求 ${b} 组做了 ${a * b} 朵，再加 ${add} 朵。`, ["先乘。", "再加。", `${a} × ${b} + ${add} = ${a * b + add}。`], "乘加两步应用");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 35, 36);
        return autoChoice(ctx, `把 ${a * b} 个贴纸平均分给 ${b} 个小组后，每组又用掉 1 个。每组还剩几个？`, `${a * b} ÷ ${b} - 1`, [`${a * b} - ${b} - 1`, `${a * b} ÷ 1 + ${b}`, `${b} × 1`], "先平均分，再看每组变化。", ["平均分用除法。", "每组用掉 1 个。", "再减 1。"], "除减每份变化");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 37, 38);
        return autoText(ctx, `${a * b} 根跳绳平均放进 ${a} 个筐，每筐几根？再拿走 2 根后每筐还剩几根？`, b - 2, `先算每筐 ${a * b} ÷ ${a} = ${b} 根，再减 2 根。`, ["先求每筐几根。", "再减拿走的 2 根。", `每筐还剩 ${b - 2} 根。`], "平均分后再减少");
      }
    ],
    "g2-table": [
      (ctx) => {
        const [a, b] = tablePair(ctx, 39, 40);
        return autoText(ctx, `${a} × ${b} = ?`, a * b, `想乘法口诀，${a} × ${b} = ${a * b}。`, ["找到对应口诀。", "确认两个乘数。", "写出积。"], "乘法口诀");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 41, 42);
        return autoChoice(ctx, `${a} 个 ${b} 相加，可以写成哪一个乘法算式？`, `${a} × ${b}`, [`${a} + ${b}`, `${a} - ${b}`, `${a} ÷ ${b}`], "几个相同加数相加可以用乘法表示。", ["找相同加数。", "数有几个。", "写成乘法。"], "乘法意义");
      },
      (ctx) => autoJudge(ctx, "4 + 4 + 4 + 4 可以写成 4 × 4。", "对", "4 个 4 相加就是 4 × 4。", ["数相同加数。", "有 4 个 4。", "可以写成乘法。"], "几个几判断"),
      (ctx) => {
        const [a, b] = tablePair(ctx, 43, 44);
        return autoText(ctx, `口诀可以帮助计算：${a} × ${b} 和 ${b} × ${a} 的得数相同，都是多少？`, a * b, "交换两个乘数的位置，积不变。", ["先算其中一个乘法。", "另一个乘法得数相同。", `得数是 ${a * b}。`], "乘法交换");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 45, 46);
        return autoChoice(ctx, `下面哪句话能表示 ${a} × ${b}？`, `${a} 个 ${b} 相加`, [`${a} 和 ${b} 相差`, `${a} 平均分成 ${b} 份`, `${a} 比 ${b} 少多少`], "乘法表示几个相同加数相加。", ["读乘法算式。", "前一个数看作个数。", "后一个数看作每个是多少。"], "乘法语境");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 47, 48);
        return autoText(ctx, `每行摆 ${a} 个圆片，摆 ${b} 行，一共有多少个？`, a * b, `每行 ${a} 个，${b} 行就是 ${b} 个 ${a}。`, ["找每行个数。", "找行数。", "用乘法。"], "阵列乘法");
      }
    ],
    "g2-table-div": [
      (ctx) => {
        const [a, b] = tablePair(ctx, 49, 50);
        return autoText(ctx, `${a * b} 个本子平均分给 ${a} 个小组，每组几个？`, b, `平均分用除法，${a * b} ÷ ${a} = ${b}。`, ["看到平均分。", "列除法。", "想乘法口诀。"], "平均分除法");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 51, 52);
        return autoChoice(ctx, `${a * b} 个苹果，每 ${b} 个装一袋，可以装几袋？`, `${a} 袋`, [`${b} 袋`, `${a + b} 袋`, `${a * b + b} 袋`], "每几个一份，求有几份，用包含除。", ["总数是苹果个数。", "每份是每袋个数。", "用除法求袋数。"], "包含除");
      },
      (ctx) => autoJudge(ctx, "计算 36 ÷ 6 时，可以想“六六三十六”。", "对", "因为 6 × 6 = 36，所以 36 ÷ 6 = 6。", ["找除数 6。", "想与 36 有关的口诀。", "得到商。"], "想乘算除"),
      (ctx) => {
        const [a, b] = tablePair(ctx, 53, 54);
        return autoText(ctx, `${a * b} 朵花，每瓶插 ${a} 朵，可以插几瓶？`, b, `求能分成几份，用 ${a * b} ÷ ${a} = ${b}。`, ["找总数。", "找每份数。", "列除法。"], "每份数除法");
      },
      (ctx) => autoChoice(ctx, "“平均分”题最常见的关键词是哪一项？", "每人一样多", ["比昨天多", "颜色鲜艳", "先后顺序"], "平均分强调每份同样多。", ["读关键词。", "判断是否每份相同。", "选择每人一样多。"], "平均分关键词"),
      (ctx) => {
        const [a, b] = tablePair(ctx, 55, 56);
        return autoText(ctx, `${a * b} 张贴纸平均分给 ${b} 人，每人几张？`, a, `想 ${b} × ${a} = ${a * b}，所以每人 ${a} 张。`, ["列式。", "想乘法口诀。", "写答数。"], "想乘算除应用");
      }
    ],
    "g2-time-money": [
      (ctx) => autoText(ctx, "1 时 = ? 分。", "60", "时间单位换算中，1 时等于 60 分。", ["回忆时间单位。", "1 时等于 60 分。", "填 60。"], "时间单位换算"),
      (ctx) => {
        const start = value(ctx, 57, 7, 4);
        const mins = value(ctx, 58, 10, 40);
        return autoText(ctx, `${start}:00 开始读书，读了 ${mins} 分钟。结束时是 ${start} 时几分？只填分钟数。`, mins, `整点开始，经过 ${mins} 分钟就是 ${start}:${pad(mins, 2)}。`, ["看开始时间。", "加经过分钟数。", "写出结束分钟。"], "经过时间");
      },
      (ctx) => {
        const price = value(ctx, 59, 3, 7);
        const pay = price + value(ctx, 60, 1, 5);
        return autoText(ctx, `一本练习本 ${price} 元，付 ${pay} 元，应找回多少元？`, pay - price, `找回的钱 = 付出的钱 - 价格。`, ["找付出的钱。", "找商品价格。", "相减。"], "人民币找零");
      },
      (ctx) => autoChoice(ctx, "1 元可以换成多少角？", "10 角", ["1 角", "60 角", "100 角"], "人民币单位中 1 元 = 10 角。", ["回忆元角关系。", "1 元等于 10 角。", "选择 10 角。"], "元角换算"),
      (ctx) => autoJudge(ctx, "半小时是 30 分钟。", "对", "1 小时是 60 分钟，一半是 30 分钟。", ["先知道 1 小时 60 分。", "半小时取一半。", "得到 30 分。"], "半小时判断"),
      (ctx) => {
        const start = value(ctx, 61, 8, 4);
        const end = start + 1;
        return autoText(ctx, `${start}:30 到 ${end}:00 经过了多少分钟？`, "30", `${start}:30 到下一个整点是 30 分钟。`, ["从 30 分数到 60 分。", "60 - 30 = 30。", "经过 30 分钟。"], "经过时间读钟")
      }
    ],
    "g2-length-measure": [
      (ctx) => autoText(ctx, "1 米 = ? 厘米。", "100", "长度单位换算中，1 米等于 100 厘米。", ["回忆米和厘米关系。", "1 米等于 100 厘米。", "填 100。"], "米厘米换算"),
      (ctx) => {
        const m = value(ctx, 62, 2, 4);
        return autoText(ctx, `${m} 米 = ? 厘米。`, m * 100, `1 米 = 100 厘米，所以 ${m} 米 = ${m * 100} 厘米。`, ["先记 1 米是 100 厘米。", `有 ${m} 个 100 厘米。`, `结果是 ${m * 100}。`], "米厘米换算");
      },
      (ctx) => {
        const a = value(ctx, 63, 4, 8);
        const b = value(ctx, 64, 3, 7);
        return autoText(ctx, `看线段图，AB 长 ${a} cm，BC 长 ${b} cm，AC 长多少厘米？`, a + b, `AC 由 AB 和 BC 连起来，${a} + ${b} = ${a + b}。`, ["读出两段长度。", "合起来求全长。", "用加法。"], "线段合成", null, { type: "segment-chain", length: a, width: b, caption: "自绘线段图" });
      },
      (ctx) => autoChoice(ctx, "量一支铅笔的长度，最合适的单位是哪一个？", "厘米", ["米", "小时", "元"], "铅笔较短，通常用厘米作单位。", ["判断物体长短。", "铅笔适合用厘米量。", "选择厘米。"], "长度单位选择"),
      (ctx) => autoJudge(ctx, "线段是直的，有两个端点，可以量出长度。", "对", "这是线段的基本特征。", ["看是否直。", "看是否有两个端点。", "可以测量长度。"], "线段特征判断"),
      (ctx) => {
        const a = value(ctx, 65, 18, 35);
        const b = value(ctx, 66, 6, 18);
        return autoText(ctx, `彩带长 ${a} 厘米，剪去 ${b} 厘米，还剩多少厘米？`, a - b, `剩下长度 = 原长 - 剪去的长度。`, ["找原长。", "找剪去长度。", "相减。"], "长度应用题");
      }
    ],
    "g2-angle-view": [
      (ctx) => {
        const right = value(ctx, 67, 1, 3);
        const acute = value(ctx, 68, 1, 2);
        const obtuse = value(ctx, 69, 1, 2);
        const angles = [...Array.from({ length: right }, () => ({ type: "right" })), ...Array.from({ length: acute }, () => ({ type: "acute" })), ...Array.from({ length: obtuse }, () => ({ type: "obtuse" }))].map((angle, index) => ({ ...angle, label: String(index + 1) }));
        return autoText(ctx, "看图数一数，图中有几个直角？", right, `带小方角标记的是直角，图中共有 ${right} 个。`, ["先找直角标记。", "不要把锐角、钝角算进去。", `直角有 ${right} 个。`], "数直角", null, { type: "angle-set", angles, caption: "自绘角的分类图" });
      },
      (ctx) => {
        const a = value(ctx, 70, 3, 7);
        const b = value(ctx, 71, 2, 6);
        return autoText(ctx, `看线段图，AB 是 ${a} cm，BC 是 ${b} cm，AC 是多少厘米？`, a + b, `AC 是两段合起来，${a} + ${b} = ${a + b}。`, ["读图中两段长度。", "求全长用加法。", "写单位厘米。"], "线段读图", null, { type: "segment-chain", length: a, width: b, caption: "自绘线段读图" });
      },
      (ctx) => {
        const columns = [value(ctx, 72, 1, 4), value(ctx, 73, 1, 4), value(ctx, 74, 1, 4), value(ctx, 75, 1, 4)];
        const answer = Math.max(...columns);
        return autoText(ctx, "看小正方体图，从正面看，最高的一列有几层？", answer, `从左到右每列层数是 ${columns.join("、")}，最高是 ${answer} 层。`, ["按列观察。", "比较每列层数。", "找最高的一列。"], "观察物体", null, { type: "block-view", columns, caption: "自绘观察物体图" });
      },
      (ctx) => {
        const move = value(ctx, 76, 2, 4);
        return autoText(ctx, "看平移图，蓝色图形向右平移到黄色位置，一共平移了几格？", move, `数同一个点移动了几格，图中向右移动 ${move} 格。`, ["找平移前的位置。", "找平移后的位置。", "横向数格。"], "图形运动", null, { type: "motion-grid", rows: 4, cols: 7, startX: 1, startY: 2, endX: 1 + move, endY: 2, caption: "自绘平移示意图" });
      },
      (ctx) => autoJudge(ctx, "角的大小和两条边画得长不长没有关系。", "对", "角的大小看两边张开的程度，不看边长。", ["看角张开的大小。", "边长改变不改变角度。", "所以正确。"], "角大小判断"),
      (ctx) => {
        const scene = shapeDiagram(ctx);
        return autoChoice(ctx, "看图形卡片，哪一种图形最多？", scene.squares >= scene.circles && scene.squares >= scene.triangles ? "正方形" : scene.circles >= scene.triangles ? "圆形" : "三角形", ["长方体", "线段", "角"], "按种类数清楚，再比较多少。", ["先数每种图形。", "比较数量。", "选数量最多的一种。"], "图形计数", scene.diagram);
      }
    ],
    "g2-simple-word": [
      (ctx) => {
        const [a, b] = tablePair(ctx, 77, 78);
        return autoText(ctx, `每排有 ${a} 把椅子，摆了 ${b} 排。一共有多少把椅子？`, a * b, `每排 ${a} 把，${b} 排就是 ${b} 个 ${a}。`, ["找每份数量。", "找份数。", "用乘法。"], "每份几份应用");
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 79, 80);
        return autoText(ctx, `有 ${a * b} 朵花，平均插在 ${a} 个花瓶里，每瓶插几朵？`, b, `平均分用除法，${a * b} ÷ ${a} = ${b}。`, ["找总数。", "找平均分成几份。", "用除法。"], "平均分应用");
      },
      (ctx) => {
        const scene = shapeDiagram(ctx);
        return autoText(ctx, "看图数一数，圆形和正方形一共有多少个？", scene.circles + scene.squares, `圆形 ${scene.circles} 个，正方形 ${scene.squares} 个，合起来 ${scene.circles + scene.squares} 个。`, ["先数圆形。", "再数正方形。", "合起来。"], "图形应用题", null, scene.diagram);
      },
      (ctx) => {
        const [a, b] = tablePair(ctx, 81, 82);
        const price = value(ctx, 83, 2, 5);
        return autoChoice(ctx, `买 ${a} 支铅笔，每支 ${price} 元，又买一本 ${b} 元的本子。求一共花多少钱，算式是？`, `${a} × ${price} + ${b}`, [`${a} + ${price} + ${b}`, `${a} × ${b} + ${price}`, `${a} ÷ ${price} + ${b}`], "先求铅笔总价，再加本子钱。", ["铅笔用乘法。", "本子钱再加上。", "选择乘加算式。"], "购物应用");
      },
      (ctx) => autoJudge(ctx, "应用题中有“平均分”时，常常要想到除法。", "对", "平均分表示每份同样多，通常用除法求每份数。", ["找关键词。", "判断是否平均分。", "列除法。"], "应用题关键词"),
      (ctx) => {
        const left = value(ctx, 84, 2, 5);
        const right = value(ctx, 85, 2, 5);
        return autoText(ctx, `看排队图，我左边有 ${left} 人，右边有 ${right} 人。这一队一共有多少人？`, left + right + 1, "排队问题要把自己也算进去。", ["左边人数。", "右边人数。", "加上自己 1 人。"], "排队应用题", null, { type: "position-row", left, right, caption: "自绘排队图" });
      }
    ],
    "g2-reading": [
      (ctx) => {
        const total = value(ctx, 86, 24, 30);
        const used = value(ctx, 87, 5, 12);
        const color = value(ctx, 88, 3, 8);
        return autoChoice(ctx, `盒子里有 ${total} 张卡片，用掉 ${used} 张，剩下的卡片中有 ${color} 张蓝色。要求还剩多少张，哪个数字不用参加计算？`, color, [total, used, `${total} 和 ${used}`], "问剩下总数，只需要总数和用掉数量，颜色数量是干扰信息。", ["看问题问什么。", "筛选有用条件。", "排除干扰数字。"], "干扰条件筛选");
      },
      (ctx) => {
        const a = value(ctx, 89, 15, 24);
        const more = value(ctx, 90, 4, 12);
        return autoChoice(ctx, `小红有 ${a} 本书，小丽比小红多 ${more} 本。要求小丽有多少本，第一步应列什么式？`, `${a} + ${more}`, [`${a} - ${more}`, `${a} + ${a}`, `${more} - ${a}`], "比谁多就用加法求另一个数量。", ["找比较对象。", "看多还是少。", "列加法。"], "第一步判断");
      },
      (ctx) => autoJudge(ctx, "应用题里出现的每一个数字都必须用上。", "错", "有些数字是干扰信息，要根据问题筛选。", ["先看最后问题。", "找有用条件。", "不是所有数字都要用。"], "读题策略判断"),
      (ctx) => autoChoice(ctx, "做应用题时，下面哪个习惯最有帮助？", "先圈出问题和关键词", ["只看第一个数字", "直接猜答案", "跳过单位"], "圈问题和关键词能帮助判断该算什么。", ["先看问题。", "再找关键词。", "最后列式。"], "审题方法"),
      (ctx) => {
        const a = value(ctx, 91, 18, 20);
        const less = value(ctx, 92, 3, 10);
        return autoText(ctx, `小军有 ${a} 张邮票，小芳比他少 ${less} 张。小芳有多少张？`, a - less, "比他少就从他的数量里减去少的部分。", ["找小军数量。", "看小芳比他少。", "用减法。"], "比较数量阅读");
      },
      (ctx) => autoChoice(ctx, "题目问“第一步应先算什么”，最应该关注哪一项？", "最后要求的数量缺少哪个中间量", ["题目有几行", "数字写得大不大", "标点有几个"], "两步题第一步通常求缺少的中间量。", ["读最后问题。", "找缺少条件。", "确定第一步。"], "中间量判断")
    ],
    "g2-thinking": [
      (ctx) => {
        const start = value(ctx, 93, 2, 5);
        const step = value(ctx, 94, 2, 4);
        return autoText(ctx, `找规律：${start}，${start + step}，${start + step * 2}，${start + step * 3}，下一个数是多少？`, start + step * 4, `每次增加 ${step}，所以下一个是 ${start + step * 4}。`, ["比较相邻两个数。", "发现每次增加相同数。", "继续加一次。"], "数列规律");
      },
      (ctx) => {
        const more = value(ctx, 95, 4, 10) * 2;
        const low = value(ctx, 96, 8, 12);
        return autoText(ctx, `甲有 ${low + more} 张卡片，乙有 ${low} 张。甲给乙几张后两人一样多？`, more / 2, `两人相差 ${more} 张，甲给乙 ${more / 2} 张后一样多。`, ["先求差。", "一边少一边多，差距每次减少 2。", "差的一半就是要给的张数。"], "移多补少");
      },
      (ctx) => {
        const left = value(ctx, 97, 3, 5);
        const right = value(ctx, 98, 3, 5);
        return autoText(ctx, `看排队图，前面有 ${left} 人，后面有 ${right} 人，这队一共有多少人？`, left + right + 1, "排队总人数要加上自己。", ["前面人数。", "后面人数。", "再加自己。"], "排队问题", null, { type: "position-row", left, right, caption: "自绘排队示意" });
      },
      (ctx) => autoChoice(ctx, "找规律题最先应该做什么？", "比较相邻两个数或图形的变化", ["只看最后一个数", "把数都擦掉", "任选一个答案"], "规律藏在相邻项目的变化里。", ["观察相邻项。", "找增加、减少或重复。", "再推下一个。"], "找规律方法"),
      (ctx) => {
        const scene = shapeDiagram(ctx);
        return autoText(ctx, "看图形统计图，三角形比圆形少几个？", Math.max(0, scene.circles - scene.triangles), `圆形 ${scene.circles} 个，三角形 ${scene.triangles} 个，相差 ${Math.abs(scene.circles - scene.triangles)} 个。`, ["先数圆形。", "再数三角形。", "比较相差。"], "图形比较", null, scene.diagram);
      },
      (ctx) => autoJudge(ctx, "做推理题时，可以用列表或画图整理条件。", "对", "列表和画图能让条件更清楚。", ["读条件。", "整理成表或图。", "逐步排除。"], "推理方法")
    ],
    "g2-appendix": [
      (ctx) => {
        const index = value(ctx, 99, 6, 18);
        const colors = ["红", "黄", "蓝"];
        const answer = colors[(index - 1) % 3];
        return autoChoice(ctx, `彩旗按“红、黄、蓝”重复排列，第 ${index} 面是什么颜色？`, answer, colors.filter((item) => item !== answer).concat("绿"), "3 面一组，找余数判断位置。", ["找循环组。", `用 ${index} 除以 3 看余数。`, "余数对应颜色。"], "周期规律");
      },
      (ctx) => autoText(ctx, "用数字 2、5、8 可以组成几个不同的两位数？", "6", "十位有 3 种选法，个位剩 2 种，共 3 × 2 = 6。", ["先选十位。", "再选个位。", "不重复排列。"], "搭配问题"),
      (ctx) => autoJudge(ctx, "简单推理题可以用排除法一步一步判断。", "对", "排除不可能的情况，剩下的就是答案。", ["读条件。", "排除不可能。", "得到结论。"], "排除法"),
      (ctx) => {
        const a = value(ctx, 100, 2, 6);
        const b = value(ctx, 101, 2, 6);
        return autoText(ctx, `小明有 ${a} 顶帽子和 ${b} 条围巾，每次选 1 顶帽子和 1 条围巾，一共有几种搭配？`, a * b, `每顶帽子都能配 ${b} 条围巾，共 ${a} × ${b} = ${a * b} 种。`, ["先看帽子种数。", "再看围巾种数。", "用乘法求搭配数。"], "搭配计数");
      },
      (ctx) => autoChoice(ctx, "做周期题时，最关键的是先找什么？", "重复的一组", ["最大的数字", "最短的词", "最后一个标点"], "周期题要先找到一组怎样重复。", ["观察排列。", "圈出重复组。", "再用除法看余数。"], "周期题方法"),
      (ctx) => {
        const n = value(ctx, 102, 4, 8);
        return autoText(ctx, `${n} 个小朋友互相握手，每两人握 1 次，一共握手几次？`, n * (n - 1) / 2, `每个人和别人握手会重复数一次，所以用 ${n} × ${n - 1} ÷ 2。`, ["先想每人能和几人握手。", "注意重复。", "除以 2。"], "简单组合");
      }
    ]
  };

  const CHINESE_TEMPLATES = {
    "c2-sound-shape": [
      (ctx) => autoChoice(ctx, "“晴朗”的“晴”和什么有关？", "太阳", ["水", "心情", "说话"], "“晴”有日字旁，常和太阳、天气有关。", ["看偏旁。", "联系词语意思。", "选择太阳。"], "形近字辨析"),
      (ctx) => autoChoice(ctx, "“清清的河水”中应选哪个字？", "清", ["晴", "情", "请"], "河水和三点水旁的“清”有关。", ["读语境。", "看偏旁。", "选择清。"], "同音字语境"),
      (ctx) => autoJudge(ctx, "辨析同音字时，只看读音就一定能选对。", "错", "同音字读音相同，还要看偏旁和语境。", ["判断说法是否绝对。", "同音字要看意思。", "所以错误。"], "同音字判断"),
      (ctx) => autoChoice(ctx, "“长大”中的“长”读音更接近哪一项？", "zhang3", ["chang2", "zhang1", "chang4"], "表示生长、长大时读 zhang3。", ["看词语意思。", "联系多音字读法。", "选择 zhang3。"], "多音字"),
      (ctx) => autoChoice(ctx, "下面哪个词语字形正确？", "认真", ["认针", "任真", "人真"], "“认真”表示态度仔细、负责。", ["读词语意思。", "排除错别字。", "选择认真。"], "易错字"),
      (ctx) => autoJudge(ctx, "形近字常常需要结合词语意思来判断。", "对", "只看字形容易混淆，结合意思更准确。", ["看字形。", "联系词语。", "判断意思。"], "字形方法")
    ],
    "c2-word-match": [
      (ctx) => autoChoice(ctx, "下面哪个词语搭配最自然？", "灿烂的阳光", ["灿烂的铅笔", "灿烂的尺子", "灿烂的书包"], "“灿烂”常形容阳光、笑容等。", ["读搭配。", "找自然表达。", "选择阳光。"], "词语搭配"),
      (ctx) => autoText(ctx, "照样子写 AABB 式词语：干净 -> ?", "干干净净", "“干净”两个字分别重叠，就是“干干净净”。", ["看格式 AABB。", "把两个字分别重叠。", "写出词语。"], "AABB词语", ["干干净净"]),
      (ctx) => autoChoice(ctx, "“一（ ）花”括号里填哪个量词最合适？", "朵", ["条", "本", "只"], "花通常说“一朵花”。", ["看名词。", "回忆常见量词。", "选择朵。"], "量词搭配"),
      (ctx) => autoChoice(ctx, "下面哪一项是描写天气的词语？", "风和日丽", ["守株待兔", "一心一意", "七上八下"], "风和日丽写天气晴好。", ["读词语。", "找天气相关。", "选择风和日丽。"], "词语分类"),
      (ctx) => autoJudge(ctx, "“高兴”和“快乐”意思接近，可以看作近义词。", "对", "两个词都表示心情好。", ["理解高兴。", "理解快乐。", "比较意思。"], "近义词判断"),
      (ctx) => autoChoice(ctx, "“雪白雪白”属于哪类词语？", "ABAB 式", ["AABB 式", "ABB 式", "量词"], "雪白雪白是两个词组重复，属于 ABAB 式。", ["观察结构。", "雪白重复一次。", "选择 ABAB。"], "词语结构")
    ],
    "c2-sentence": [
      (ctx) => autoChoice(ctx, "把“小鸟唱歌”写具体，哪一句最通顺？", "可爱的小鸟在树枝上唱歌。", ["唱歌小鸟可爱树枝。", "在树枝上。", "小鸟。"], "扩句要补充信息并保持通顺。", ["看原句。", "补充样子和地点。", "保持句子完整。"], "扩句"),
      (ctx) => autoChoice(ctx, "下面哪一句话最完整？", "小明在操场上跑步。", ["小明在操场上。", "跑步。", "操场上小明。"], "完整句通常说清谁、在哪里、做什么。", ["找人物。", "找地点。", "找动作。"], "完整句"),
      (ctx) => autoText(ctx, "把“花儿开了”补充具体：公园里的花儿（ ）开了。填一个合适词语。", "慢慢地", "“慢慢地”能补充花儿开放的样子。", ["读句子。", "填修饰动作的词语。", "保持通顺。"], "补充句子", ["慢慢地", "悄悄地"]),
      (ctx) => autoChoice(ctx, "仿写句子“叶子像小船”，下面哪一句最像？", "弯弯的月亮像小船。", ["月亮很亮。", "小船在水里。", "叶子落了。"], "仿写要保留“什么像什么”的句式。", ["看例句句式。", "找“像”。", "选择相同句式。"], "仿写"),
      (ctx) => autoJudge(ctx, "扩句时可以随意打乱词语顺序，只要字数变多就行。", "错", "扩句要具体，也要通顺。", ["判断字数变多是否足够。", "句子还要通顺。", "所以错误。"], "扩句判断"),
      (ctx) => autoChoice(ctx, "“我把书放进书包。”主要写清了什么？", "谁做了什么", ["天气颜色", "书包价格", "古诗作者"], "句子写清了人物“我”和动作“放”。", ["找人物。", "找动作。", "概括句意。"], "句意理解")
    ],
    "c2-punctuation": [
      (ctx) => autoChoice(ctx, "句子“你今天去图书馆吗”末尾最合适的标点是哪个？", "？", ["。", "！", "、"], "有“吗”，是在提问，句末用问号。", ["读语气。", "判断是问句。", "选问号。"], "问号使用"),
      (ctx) => autoChoice(ctx, "句子“公园里的花真美啊”末尾最合适的标点是哪个？", "！", ["。", "？", "，"], "“真美啊”表达赞叹，可用感叹号。", ["读出赞叹语气。", "选择感叹号。", "句末标点要符合语气。"], "感叹号使用"),
      (ctx) => autoJudge(ctx, "所有句子末尾都应该用句号。", "错", "不同语气要用不同标点。", ["判断“所有”是否绝对。", "问句用问号。", "感叹句可用感叹号。"], "标点判断"),
      (ctx) => autoChoice(ctx, "句子“妈妈回来了”语气平常，句末一般用什么标点？", "。", ["？", "！", "、"], "陈述一件事，语气平常，句末用句号。", ["判断语气。", "不是提问。", "用句号。"], "句号使用"),
      (ctx) => autoChoice(ctx, "“这是你的书吗”这句话是在做什么？", "提问", ["赞叹", "陈述", "列举"], "“吗”提示疑问语气。", ["找到语气词。", "判断句子作用。", "选择提问。"], "疑问语气"),
      (ctx) => autoJudge(ctx, "句末标点要根据句子的语气来选择。", "对", "陈述、疑问、感叹对应不同标点。", ["读句子。", "判断语气。", "选择标点。"], "标点方法")
    ],
    "c2-reading": [
      (ctx) => autoChoice(ctx, "材料：小雨先写作业，再收拾书包，最后去操场跳绳。题目：小雨先做什么？", "写作业", ["收拾书包", "跳绳", "吃午饭"], "顺序词“先”后面的事情是写作业。", ["找到“先”。", "看后面的事情。", "回答写作业。"], "顺序阅读"),
      (ctx) => autoChoice(ctx, "材料：因为下雨，大家把活动改到教室里。题目：活动改到教室里的原因是什么？", "下雨", ["教室很大", "大家想画画", "操场很近"], "“因为下雨”说明原因。", ["找到因为。", "因为后面是原因。", "回答下雨。"], "因果阅读"),
      (ctx) => autoJudge(ctx, "做短文阅读题时，应该回到材料里找依据。", "对", "阅读题要根据材料判断。", ["读问题。", "回到材料定位。", "按材料回答。"], "阅读策略"),
      (ctx) => autoChoice(ctx, "读到“先、再、然后、最后”这些词，主要帮助我们判断什么？", "事情的先后顺序", ["人物的身高", "字的偏旁", "诗的作者"], "这些词都是顺序词。", ["识别顺序词。", "理解作用。", "选择先后顺序。"], "顺序词作用"),
      (ctx) => autoChoice(ctx, "看到“因为……所以……”这样的句子，通常要注意什么？", "原因和结果", ["近义词", "量词", "笔顺"], "因为提示原因，所以提示结果。", ["找因为。", "找所以。", "区分原因结果。"], "因果词作用"),
      (ctx) => autoJudge(ctx, "阅读题可以不看材料，直接凭感觉选答案。", "错", "阅读题要从材料中找依据。", ["判断做题方法。", "凭感觉容易错。", "应回到材料。"], "阅读方法判断")
    ],
    "c2-poem": [
      (ctx) => autoChoice(ctx, "古诗中写到“飞流直下三千尺”，主要让人感受到瀑布怎么样？", "又高又急", ["很安静", "很短", "没有水"], "飞流直下写出瀑布落下很有气势。", ["抓关键词。", "想象画面。", "选择又高又急。"], "古诗画面"),
      (ctx) => autoChoice(ctx, "理解古诗画面时，下面哪种方法最合适？", "抓住关键词想象画面", ["只数有几个字", "只看诗题颜色", "不读诗句"], "关键词能帮助想象诗句描写的画面。", ["读诗句。", "抓关键词。", "想象画面。"], "古诗方法"),
      (ctx) => autoJudge(ctx, "背古诗时，只会背题目就算理解古诗。", "错", "理解古诗还要知道诗句大意和画面。", ["判断是否只背题目。", "理解要看内容。", "所以错误。"], "古诗理解判断"),
      (ctx) => autoChoice(ctx, "诗句“遥知不是雪，为有暗香来”描写的是什么？", "梅花", ["荷花", "柳树", "小草"], "洁白和暗香常用来写梅花。", ["抓关键词暗香。", "联系常见古诗。", "选择梅花。"], "古诗景物"),
      (ctx) => autoChoice(ctx, "读古诗时遇到描写颜色、声音、气味的词，可以帮助我们做什么？", "想象画面", ["计算得数", "判断竖式", "换算单位"], "这些词能让诗句画面更清楚。", ["找感官词。", "联系景物。", "想象画面。"], "古诗想象"),
      (ctx) => autoJudge(ctx, "理解古诗可以结合关键词和生活经验。", "对", "关键词和经验能帮助理解画面。", ["读关键词。", "联系生活。", "理解诗意。"], "古诗学习方法")
    ],
    "c2-picture-writing": [
      (ctx) => autoChoice(ctx, "看图写话时，最应该先看清哪三项？", "人物、地点、事情", ["页码、颜色、价格", "天气、尺子、数字", "标点、拼音、声调"], "看图写话要先看谁、在哪里、做什么。", ["观察人物。", "观察地点。", "观察事情。"], "看图写话要素"),
      (ctx) => autoChoice(ctx, "画面中如果有“先浇水，再扶正小树，最后整理工具”，写话时应注意什么？", "按顺序写清动作", ["只写一个词", "不写人物", "把最后的事写在最前"], "有明显先后顺序时，写话要按顺序表达。", ["抓顺序词。", "按动作先后写。", "句子要通顺。"], "看图写话顺序"),
      (ctx) => autoJudge(ctx, "看图写话只写“真好看”三个字就足够清楚。", "错", "看图写话要写清人物、地点和事情。", ["判断信息是否完整。", "真好看太空泛。", "所以不够清楚。"], "看图写话判断"),
      (ctx) => {
        const left = value(ctx, 103, 2, 4);
        const right = value(ctx, 104, 2, 4);
        return autoChoice(ctx, "看自绘排队图写话，开头最适合先交代什么？", "谁在哪里排队", ["算一共几人", "铅笔多少钱", "古诗作者是谁"], "看图写话开头要先交代人物和地点。", ["先看人物。", "再看地点。", "最后写事情。"], "看图写话开头", { type: "position-row", left, right, caption: "自绘看图写话示意" });
      },
      (ctx) => autoChoice(ctx, "下面哪一句更适合作为看图写话开头？", "星期天，小朋友们来到公园种树。", ["真好。", "颜色很多。", "我不知道。"], "开头要交代时间、人物、地点和事情。", ["看信息是否完整。", "找时间人物地点。", "选择完整句。"], "写话开头"),
      (ctx) => autoJudge(ctx, "看图写话可以使用“先、再、最后”让事情更有条理。", "对", "顺序词能帮助表达先后。", ["观察顺序。", "使用顺序词。", "句子更清楚。"], "写话顺序词")
    ],
    "c2-usage": [
      (ctx) => autoChoice(ctx, "写留言条时，下面哪一项通常不能少？", "留言给谁、事情、署名和时间", ["只写天气", "只写颜色", "只画图案"], "留言条要交代对象、事情、署名和时间。", ["看应用文类型。", "想读者需要知道什么。", "写清要素。"], "留言条要素"),
      (ctx) => autoChoice(ctx, "向同学借书时，哪句话更有礼貌？", "请问我可以借这本书看一看吗？", ["把书给我。", "快点拿来。", "这书我要了。"], "请求别人帮助时要用礼貌用语。", ["判断说话对象。", "看语气是否礼貌。", "选择含“请问”的句子。"], "礼貌表达"),
      (ctx) => autoJudge(ctx, "写通知时，时间和地点写不写都可以。", "错", "通知必须让别人知道什么时候、在哪里、做什么。", ["判断通知目的。", "需要时间地点。", "题干说可不写，错误。"], "通知要素判断"),
      (ctx) => autoChoice(ctx, "班级通知要大家明天下午三点去操场集合，最重要的信息是什么？", "时间、地点和事情", ["书包颜色", "铅笔长度", "天气好坏"], "通知要让人知道何时何地做什么。", ["找时间。", "找地点。", "找事情。"], "通知信息"),
      (ctx) => autoChoice(ctx, "别人帮助你后，最合适的话是哪一句？", "谢谢你！", ["走开。", "快一点。", "这不是我的。"], "得到帮助后要表达感谢。", ["看情境。", "选择礼貌回应。", "表达感谢。"], "礼貌用语"),
      (ctx) => autoJudge(ctx, "留言条署名可以帮助别人知道是谁写的。", "对", "署名能说明留言人。", ["看留言条格式。", "署名表示谁写。", "所以正确。"], "署名作用")
    ]
  };

  [
    "c2-textbook-sound-shape",
    "c2-textbook-word-collocation",
    "c2-textbook-sequence-reading",
    "c2-textbook-cause-effect",
    "c2-textbook-picture-writing-order"
  ].forEach((pointId) => {
    const base = {
      "c2-textbook-sound-shape": "c2-sound-shape",
      "c2-textbook-word-collocation": "c2-word-match",
      "c2-textbook-sequence-reading": "c2-reading",
      "c2-textbook-cause-effect": "c2-reading",
      "c2-textbook-picture-writing-order": "c2-picture-writing"
    }[pointId];
    CHINESE_TEMPLATES[pointId] = CHINESE_TEMPLATES[base];
  });

  // 二年级新增奥数 PDF：整页截图题，便于按页回查原始资料。
  function addOlympiadImageSeeds() {
    const sourceId = "g2-math-olympiad-100";
    const pointCycle = ["g2-thinking", "g2-appendix", "g2-reading", "g2-simple-word", "g2-two-step", "g2-two-step-muldiv", "g2-table", "g2-time-money", "g2-angle-view", "g2-length-measure"];
    Array.from({ length: 32 }, (_, index) => index + 1).forEach((page) => {
      const pointId = pointCycle[(page - 1) % pointCycle.length];
      add(pointId, [
        imageChoice(
          `ref-g2-img-math-olympiad-page-${pad(page)}`,
          sourceId,
          page,
          "解答二年级奥数综合题时，最稳的第一步是什么？",
          "先读清题意，再画图、列表或列式整理关系",
          ["直接猜答案", "只看题号不看条件", "把所有数字随便相加"],
          "奥数题常把条件藏在文字或图形里，先整理关系再计算，能减少漏条件和乱用数字。",
          ["读题并圈出关键条件。", "选择画图、列表或列式的方法。", "核对答案是否符合题意。"],
          "奥数页截图审题",
          `小学二年级必学奥数题100题第 ${page} 页清晰截图入库。`,
          pdfCrop(sourceId, page, `assets/reference/grade2/g2-math-olympiad-page-p${pad(page)}.png`, `二年级奥数 100 题第 ${page} 页截图`, "整页截图，供题号级派生题回查")
        )
      ]);
    });
  }

  // 二年级新增奥数 PDF：按原题号维护的派生题，和 Codex 原创题库完全隔离。
  function addOlympiadDerivedSeeds() {
    const sourceId = "g2-math-olympiad-100";
    const defaultSteps = ["读清题意，圈出关键数量。", "按题型画图、列表或列式。", "把结果代回题意核对。"];
    const entries = [
      { n: 1, p: 1, point: "g2-thinking", type: "年龄和倍", q: "一家三口年龄和是 72 岁，爸爸妈妈同岁，并且各是孩子年龄的 4 倍。爸爸多少岁？", a: "32", exp: "孩子 1 份，爸爸妈妈各 4 份，共 9 份；72 ÷ 9 = 8，爸爸 8 × 4 = 32 岁。", accept: ["32", "32岁"] },
      { n: 2, p: 1, point: "g2-reading", type: "条件推理", q: "甲、乙、丙、丁参加篮球、排球、足球、象棋。丁失去双腿，甲比排球运动员高，足球运动员比丙和篮球运动员都矮。甲参加什么项目？", a: "篮球", exp: "丁只能是象棋；甲不是排球也不是足球，只能是篮球。", accept: ["篮球", "篮球运动"] },
      { n: 3, p: 1, point: "g2-appendix", type: "巧分物品", q: "把 10 个水果装进 6 个袋子，要求每个袋子里的水果数都是双数，而且水果和袋子都不剩，可以怎样装？", a: "每袋2个，再把5个袋子装进最后一个袋子", exp: "5 个袋子各装 2 个水果，再把这 5 个袋子一起放进第 6 个袋子。", accept: ["每袋2个，再把5个袋子装进最后一个袋子", "5个袋子各放2个，再放进第6个袋子"] },
      { n: 4, p: 2, point: "g2-simple-word", type: "花钱问题", q: "淘气有 300 元，买书用去 56 元，买文具用去 128 元。剩下的钱比原来少多少元？", a: "184", exp: "比原来少的钱就是已经花掉的钱，56 + 128 = 184 元。", accept: ["184", "184元"] },
      { n: 5, p: 2, point: "g2-angle-view", type: "图形规律", q: "图形规律题中，看到“观察变化，在方框里画图形”，第一步应先看什么？", a: "相邻图形的变化", exp: "先比较相邻图形的形状、数量、方向或位置变化。", accept: ["相邻图形的变化", "变化规律"] },
      { n: 6, p: 2, point: "g2-thinking", type: "和倍问题", q: "哥哥和弟弟一共钓了 23 条鱼，哥哥比弟弟钓的 3 倍还多 3 条。弟弟钓了多少条？", a: "5", exp: "23 - 3 = 20，20 是弟弟的 4 倍，所以弟弟钓 5 条。", accept: ["5", "5条"] },
      { n: 7, p: 3, point: "g2-appendix", type: "硬币组合", q: "有 1 分、2 分、4 分、8 分硬币各 1 枚。要付 14 分，应该选哪几枚？", a: "2分、4分、8分", exp: "14 = 2 + 4 + 8。", accept: ["2分、4分、8分", "2+4+8"] },
      { n: 8, p: 3, point: "g2-reading", type: "排除推理", q: "香蕉、苹果、桔子分给三人，每人一种。小明既不是苹果也不是桔子。小明得到什么水果？", a: "香蕉", exp: "小明不是苹果也不是桔子，只能得到香蕉。", accept: ["香蕉"] },
      { n: 9, p: 3, point: "g2-appendix", type: "枚举计数", q: "各位数字之和等于 34 的四位数，资料答案列出了多少个？", a: "10", exp: "资料列出 10 个符合条件的四位数。", accept: ["10", "10个"] },
      { n: 10, p: 4, point: "g2-two-step-muldiv", type: "差倍问题", q: "一张桌子的价钱是一把椅子的 10 倍，桌子比椅子贵 288 元。一把椅子多少元？", a: "32", exp: "相差 9 份，288 ÷ 9 = 32。", accept: ["32", "32元"] },
      { n: 11, p: 4, point: "g2-angle-view", type: "摆硬币", q: "10 枚硬币摆成 5 行，每行 4 枚。解决这类摆法题最常用的方法是什么？", a: "画图尝试", exp: "硬币可在多行中重复计数，画图或摆实物最直观。", accept: ["画图尝试", "摆实物", "画图"] },
      { n: 12, p: 4, point: "g2-reading", type: "巧分苹果", q: "5 个苹果分给 5 个孩子，每人 1 个，还要篮子里剩 1 个苹果。应该怎样分？", a: "把最后一个苹果连篮子一起给一个孩子", exp: "第 5 个孩子拿装着最后 1 个苹果的篮子。", accept: ["把最后一个苹果连篮子一起给一个孩子", "连篮子一起给"] },
      { n: 13, p: 5, point: "g2-thinking", type: "移多补少", q: "两人的书原来同样多，从小兰处拿 4 本给小明后，小明的书是小兰的 2 倍。小兰原来有多少本？", a: "12", exp: "移动 4 本造成 8 本差，后来小明比小兰多 1 倍，所以小兰后来 8 本、原来 12 本。", accept: ["12", "12本"] },
      { n: 14, p: 5, point: "g2-two-step", type: "还原问题", q: "一篮苹果 52 个，另一篮橘子若取出 18 个，就比苹果少 12 个。原来有多少个橘子？", a: "58", exp: "取出后橘子 52 - 12 = 40 个，原来 40 + 18 = 58 个。", accept: ["58", "58个"] },
      { n: 15, p: 6, point: "g2-thinking", type: "移多补少", q: "两人书本原来一样多，拿 4 本从甲给乙后，乙是甲的 2 倍。甲原来有多少本？", a: "12", exp: "移动 4 本造成 8 本差，甲后来 8 本，原来 12 本。", accept: ["12", "12本"] },
      { n: 16, p: 6, point: "g2-appendix", type: "数字组式", q: "只用数字 6 组成若干个数，使它们相加等于 150。资料中的一种算式是什么？", a: "66+66+6+6+6", exp: "66 + 66 + 6 + 6 + 6 = 150。", accept: ["66+66+6+6+6", "66＋66＋6＋6＋6"] },
      { n: 17, p: 6, point: "g2-reading", type: "图文推理", q: "根据图和点数推理动物数量时，最适合先做什么？", a: "把每个条件列表", exp: "图文条件多时，先列表整理再逐步排除。", accept: ["把每个条件列表", "列表", "整理条件"] },
      { n: 18, p: 6, point: "g2-appendix", type: "搭配计数", q: "3 件衬衫和 2 条裙子，每次选 1 件衬衫和 1 条裙子，一共有几种搭配？", a: "6", exp: "3 × 2 = 6。", accept: ["6", "6种"] },
      { n: 19, p: 7, point: "g2-appendix", type: "周期分配", q: "1 到 100 号卡片按 4 人循环分发，第 73 号卡片分给第几个小朋友？", a: "第1个", exp: "73 ÷ 4 余 1，所以分给第 1 个小朋友。", accept: ["第1个", "第一个", "1"] },
      { n: 20, p: 7, point: "g2-appendix", type: "搭配计数", q: "4 名男同学和 3 名女同学打乒乓球混合双打，每名男同学和每名女同学搭一次，一共要打几盘？", a: "12", exp: "4 × 3 = 12。", accept: ["12", "12盘"] },
      { n: 21, p: 8, point: "g2-appendix", type: "等差求和", q: "礼堂座位第一排 4 个，以后每排比前一排多 2 个，最后一排 18 个。一共有多少个座位？", a: "88", exp: "排数 8，总数 (4 + 18) × 8 ÷ 2 = 88。", accept: ["88", "88个"] },
      { n: 22, p: 8, point: "g2-time-money", type: "时间推理", q: "如果现在是晚上，再过 36 小时大约还会是什么时候？", a: "晚上", exp: "36 小时是 1 天半，晚上再过 1 天半仍会到晚上附近。", accept: ["晚上", "夜晚"] },
      { n: 23, p: 8, point: "g2-thinking", type: "数列规律", q: "按规律填数：1，2，4，6，8，后面两个数是多少？", a: "10，12", exp: "从 2 开始每次增加 2。", accept: ["10，12", "10,12", "10 12"] },
      { n: 24, p: 9, point: "g2-angle-view", type: "排队问题", q: "20 只小动物排一队，小兔右边有 16 只，小鹿左边有 10 只。从小鹿到小兔一共有几只小动物？", a: "6", exp: "资料按左右数量关系推得中间共有 6 只。", accept: ["6", "6只"] },
      { n: 25, p: 9, point: "g2-angle-view", type: "立体拼图", q: "判断两个图形能否拼成长方体时，最关键的是先数什么？", a: "小正方体块数", exp: "先数小正方体数量，再看缺口能否互补。", accept: ["小正方体块数", "块数"] },
      { n: 26, p: 9, point: "g2-thinking", type: "符号代换", q: "三个符号分别满足同类和为 15、12、18。若三个符号各取一个相加，结果是多少？", a: "15", exp: "三个符号分别为 5、4、6，和为 15。", accept: ["15"] },
      { n: 27, p: 10, point: "g2-appendix", type: "数字计数", q: "从 1 写到 99，一共写了多少个数字“1”？", a: "20", exp: "个位 10 个，十位 10 个，共 20 个。", accept: ["20", "20个"] },
      { n: 28, p: 10, point: "g2-two-step", type: "称重推理", q: "三人称体重：甲乙共 50 千克，甲丙共 49 千克，乙丙共 76 千克。甲重多少千克？", a: "23", exp: "资料用两两和关系推得甲为 23 千克。", accept: ["23", "23千克"] },
      { n: 29, p: 10, point: "g2-angle-view", type: "方向移动", q: "小鸟先前进 5 格，再后退 4 格，又前进 6 格，最后后退 10 格。最后在起点前面还是后面？相差几格？", a: "后面3格", exp: "5 - 4 + 6 - 10 = -3，在后面 3 格。", accept: ["后面3格", "后3格", "后面 3 格"] },
      { n: 30, p: 11, point: "g2-thinking", type: "等价代换", q: "同样的钱可以买 6 支铅笔和 11 个本子，也可以买 8 支铅笔和 7 个本子。如果全买本子，可以买多少个？", a: "23", exp: "2 支铅笔等于 4 个本子，1 支铅笔等于 2 个本子，共可买 23 个本子。", accept: ["23", "23个"] },
      { n: 31, p: 11, point: "g2-two-step-muldiv", type: "连环换算", q: "20 只兔可换 2 只羊，9 只羊可换 3 头猪，8 头猪可换 2 头牛。1 头牛可换多少只兔？", a: "120", exp: "1 头牛 = 4 头猪 = 12 只羊 = 120 只兔。", accept: ["120", "120只"] },
      { n: 32, p: 11, point: "g2-appendix", type: "隔一取一", q: "15 条鱼按从头开始隔一条吃一条的方法反复进行，最后剩下第几条鱼？", a: "8", exp: "逐轮推演，最后留下第 8 条。", accept: ["8", "第8条", "8条"] },
      { n: 33, p: 12, point: "g2-two-step", type: "行列还原", q: "商店新进 6 行皮球，连续 5 天每天卖 8 个，剩下正好 2 行。原来每行有几个皮球？", a: "10", exp: "卖出 40 个，相当于 4 行，所以每行 10 个。", accept: ["10", "10个"] },
      { n: 34, p: 12, point: "g2-thinking", type: "数列规律", q: "找规律：1，8，1，10，1，12，（ ），（ ）。", a: "1，14", exp: "奇数位都是 1，偶数位每次加 2。", accept: ["1，14", "1,14", "1 14"] },
      { n: 35, p: 12, point: "g2-angle-view", type: "排队问题", q: "30 个小朋友平均分成 2 队，李明在第一队，他前面有 3 人，他后面有几人？", a: "11", exp: "每队 15 人，15 - 3 - 1 = 11。", accept: ["11", "11人"] },
      { n: 36, p: 12, point: "g2-time-money", type: "千克克换算", q: "一袋苹果 20 千克，张阿姨取走 10 千克，袋子重 1 千克。李阿姨买到的苹果重多少克？", a: "9000", exp: "20 - 10 - 1 = 9 千克，9 千克 = 9000 克。", accept: ["9000", "9000克"] },
      { n: 37, p: 12, point: "g2-thinking", type: "等量代换", q: "1 个橘子等于 3 个苹果，每个苹果 150 克。每个橘子多少克？", a: "450", exp: "150 × 3 = 450 克。", accept: ["450", "450克"] },
      { n: 38, p: 13, point: "g2-two-step-muldiv", type: "动物代换", q: "1 只鹅加 3 只鸡等于 10 只鸭，8 只鸡等于 16 只鸭。1 只鹅等于几只鸭？", a: "4", exp: "1 只鸡等于 2 只鸭，3 只鸡等于 6 只鸭，所以鹅等于 4 只鸭。", accept: ["4", "4只"] },
      { n: 39, p: 13, point: "g2-angle-view", type: "图形数阵", q: "图形数阵中每个图形周围数字的和都相同，资料中的公共和是多少？", a: "12", exp: "资料答案说明公共和是 12。", accept: ["12"] },
      { n: 40, p: 13, point: "g2-appendix", type: "数字卡片", q: "用 0、5、6 三张卡片可以组成多少个不同的数？注意 6 可以倒过来看作 9。", a: "15", exp: "一位数 4 个、两位数 7 个、三位数 4 个，共 15 个。", accept: ["15", "15个"] },
      { n: 41, p: 14, point: "g2-angle-view", type: "图形分割", q: "把一个图形分成 2 块，要求大小和形状都一样。最适合先找什么？", a: "对称或相同拼块", exp: "先找对称线、重复小方格或能重合的拼块。", accept: ["对称或相同拼块", "对称线", "相同拼块"] },
      { n: 42, p: 14, point: "g2-time-money", type: "爬楼梯", q: "从 1 楼走到 4 楼要 3 分钟，按同样速度从 1 楼走到 7 楼要几分钟？", a: "6", exp: "1 到 7 楼有 6 段楼梯，要 6 分钟。", accept: ["6", "6分钟"] },
      { n: 43, p: 14, point: "g2-thinking", type: "数列位置", q: "数列 1，2，3，2，3，4，3，4，5，4，5，6……第 25 个数是多少？", a: "9", exp: "按三项一组递增推算，第 25 个数是 9。", accept: ["9"] },
      { n: 44, p: 15, point: "g2-two-step", type: "锯木问题", q: "一根木头长 14 米，每 2 米锯成一段，需要锯几次？", a: "6", exp: "锯成 7 段，需要 6 次。", accept: ["6", "6次"] },
      { n: 45, p: 15, point: "g2-thinking", type: "符号等式", q: "符号等式推理题中，最适合先从哪里入手？", a: "从只含同一种符号的等式入手", exp: "先求出一个符号，再代入其他等式。", accept: ["从只含同一种符号的等式入手", "先找最简单等式", "代入"] },
      { n: 46, p: 15, point: "g2-two-step-muldiv", type: "仓库存粮", q: "甲、乙两个仓库平均存粮 32.5 吨，甲仓是乙仓的 4 倍少 5 吨。乙仓存粮多少吨？", a: "14", exp: "两仓共 65 吨，给甲加 5 吨后共 70 吨，是乙的 5 倍，乙为 14 吨。", accept: ["14", "14吨"] },
      { n: 47, p: 16, point: "g2-appendix", type: "火柴棒", q: "火柴棒等式题中，移动或拿走火柴棒前最应该先检查什么？", a: "等式两边是否相等", exp: "先看原式哪里不平衡，再判断哪一根火柴能改变数字或符号。", accept: ["等式两边是否相等", "等式是否平衡"] },
      { n: 48, p: 16, point: "g2-time-money", type: "车费均摊", q: "三人打车共付 24 元，平均每人应付 8 元。甲付 10 元，乙付 14 元，丙没付。丙应分别还甲、乙多少钱？", a: "2元和6元", exp: "甲多付 2 元，乙多付 6 元，所以丙分别还 2 元和 6 元。", accept: ["2元和6元", "甲2元乙6元", "2和6"] },
      { n: 49, p: 16, point: "g2-thinking", type: "两两求和", q: "三人成绩两两相加分别是 195、198、193 分。三人的总分是多少？", a: "293", exp: "195 + 198 + 193 = 586，是总分的 2 倍，所以总分 293。", accept: ["293", "293分"] },
      { n: 50, p: 17, point: "g2-two-step", type: "油桶问题", q: "一桶油连桶重 100 千克，倒去一半油后连桶重 60 千克。原来油重多少千克？", a: "80", exp: "减少的 40 千克是一半油，所以整桶油重 80 千克。", accept: ["80", "80千克"] },
      { n: 51, p: 17, point: "g2-thinking", type: "撕纸问题", q: "一张纸每次取一片撕成 4 片，连续撕 10 次后共有多少片纸？", a: "31", exp: "每次增加 3 片，10 次增加 30 片，再加原来 1 片，共 31 片。", accept: ["31", "31片"] },
      { n: 52, p: 17, point: "g2-angle-view", type: "图形分割", q: "把图形分成 4 个形状、大小相同的部分，且每部分都有一只小动物。最适合怎样做？", a: "按小方格试分", exp: "先数小方格，再尝试分成相同形状。", accept: ["按小方格试分", "数小方格", "画图试分"] },
      { n: 53, p: 17, point: "g2-thinking", type: "符号代换", q: "已知两个符号相加等于 9，五个符号相加等于 25。若其中一个符号是 7，另一个是多少？", a: "2", exp: "9 - 7 = 2。", accept: ["2"] },
      { n: 54, p: 18, point: "g2-thinking", type: "未知数", q: "解未知符号：□+5=13-6，□ 等于多少？", a: "2", exp: "13 - 6 = 7，7 - 5 = 2。", accept: ["2"] },
      { n: 55, p: 18, point: "g2-reading", type: "读题辨误", q: "一群鹿和一群鸟合起来说“我们一共有 9 个头”。资料判断这个回答是否正确？", a: "不正确", exp: "资料指出实际应是 10 个头。", accept: ["不正确", "错", "错误"] },
      { n: 56, p: 18, point: "g2-thinking", type: "连续数求和", q: "在算式“□+□+□+□+□=30”中填 5 个连续自然数，使等式成立。这 5 个数是什么？", a: "4，5，6，7，8", exp: "4 + 5 + 6 + 7 + 8 = 30。", accept: ["4，5，6，7，8", "4,5,6,7,8", "4 5 6 7 8"] },
      { n: 57, p: 19, point: "g2-angle-view", type: "图形规律", q: "图形变化规律题中，若黑点和白点都在变化，应该同时观察哪两项？", a: "黑点位置和白点数量", exp: "既要看位置，也要看数量变化。", accept: ["黑点位置和白点数量", "位置和数量"] },
      { n: 58, p: 19, point: "g2-reading", type: "称谓推理", q: "外祖父、父亲和女儿每人拿一笔钱，听起来有四个称呼，为什么实际不是四个人？", a: "只有3个人", exp: "外祖父也是父亲的父亲，父亲也是女儿的父亲。", accept: ["只有3个人", "3个人", "三个人"] },
      { n: 59, p: 19, point: "g2-appendix", type: "倒推问题", q: "某数按“乘 5、加 5、除以 5、减 5”变化，最后得到指定结果。做这类题最适合用什么方法？", a: "倒推法", exp: "从最后结果开始，把每一步反过来算。", accept: ["倒推法", "倒推"] },
      { n: 60, p: 20, point: "g2-thinking", type: "数字规律", q: "图中数字按规律变化，资料中空格应填多少？", a: "64", exp: "资料答案给出的空格数是 64。", accept: ["64"] },
      { n: 61, p: 20, point: "g2-thinking", type: "因数推理", q: "两个数的积是 144，差是 10。这两个数是多少？", a: "8和18", exp: "8 × 18 = 144，18 - 8 = 10。", accept: ["8和18", "8，18", "8,18"] },
      { n: 62, p: 20, point: "g2-time-money", type: "间隔时间", q: "8:00 开始喝水，每隔 5 分钟喝一次。第 20 次喝水是在什么时候？", a: "9:35", exp: "19 个间隔共 95 分钟，8:00 后 95 分钟是 9:35。", accept: ["9:35", "9时35分"] },
      { n: 63, p: 21, point: "g2-appendix", type: "和尚分馒头", q: "100 个和尚分 100 个馒头，大和尚每人 3 个，小和尚 3 人 1 个。大和尚有多少人？", a: "25", exp: "25 个大和尚吃 75 个，75 个小和尚吃 25 个。", accept: ["25", "25人"] },
      { n: 64, p: 21, point: "g2-appendix", type: "页码计数", q: "一本书 100 页，给页码排版一共要用多少个数字？", a: "192", exp: "9 + 90 × 2 + 3 = 192。", accept: ["192", "192个"] },
      { n: 65, p: 21, point: "g2-angle-view", type: "端点计数", q: "1 张长凳有 4 个端头，3 张长凳并排相接后外面共有几个端头？", a: "8", exp: "相接处端头不露在外面，资料答案为 8。", accept: ["8", "8个"] },
      { n: 66, p: 21, point: "g2-vertical", type: "错看数字", q: "小明做加法时把个位 3 看成 5，把十位 8 看成 3，错误结果是 215。正确结果是多少？", a: "263", exp: "正确结果是 215 - 2 + 50 = 263。", accept: ["263"] },
      { n: 67, p: 22, point: "g2-thinking", type: "数阵填空", q: "空格填数题有多种填法时，最重要的是保证什么？", a: "符合共同规律", exp: "必须符合每行、每列或相邻数字的共同关系。", accept: ["符合共同规律", "符合规律", "共同规律"] },
      { n: 68, p: 22, point: "g2-time-money", type: "烙饼优化", q: "烙一张饼两面各需 2 分钟，一只锅一次能烙 2 张饼。烙 3 张饼最少要几分钟？", a: "6", exp: "3 个 2 分钟即可完成 3 张饼的两面。", accept: ["6", "6分钟"] },
      { n: 69, p: 22, point: "g2-thinking", type: "因数推理", q: "两个数的积是 144，差是 10。较大的数是多少？", a: "18", exp: "这两个数是 8 和 18。", accept: ["18"] },
      { n: 70, p: 22, point: "g2-length-measure", type: "线段图", q: "线段长度组合题中，资料答案出现 10 米和 24 米。做这种题最适合先画什么？", a: "线段图", exp: "把几段长度和整体关系标在线段图上更清楚。", accept: ["线段图", "画线段图"] },
      { n: 71, p: 23, point: "g2-time-money", type: "接水排序", q: "5 人接水所需时间分别是 5、3、4、2、1 分钟。怎样排队总等待时间最短？", a: "从短到长", exp: "用时短的人先接，总等待时间最短。", accept: ["从短到长", "按1、2、3、4、5分钟从短到长", "1,2,3,4,5"] },
      { n: 72, p: 23, point: "g2-time-money", type: "烙饼优化", q: "平底锅每次最多烙 2 张饼，每面 1 分钟。烙 6 张饼至少要几分钟？", a: "6", exp: "12 个面，每分钟烙 2 个面，至少 6 分钟。", accept: ["6", "6分钟"] },
      { n: 73, p: 23, point: "g2-simple-word", type: "路程问题", q: "小狗每分钟跑 20 米，连续跑 5 分钟，一共跑了多少米？", a: "100", exp: "20 × 5 = 100 米。", accept: ["100", "100米"] },
      { n: 74, p: 23, point: "g2-100-add", type: "巧算", q: "巧算 368 - 199 = ?", a: "169", exp: "368 - 200 + 1 = 169。", accept: ["169"] },
      { n: 75, p: 24, point: "g2-thinking", type: "两两求和", q: "三人成绩两两相加是 195、198、193。最高分是多少？", a: "100", exp: "总分 293，三人成绩为 98、95、100。", accept: ["100", "100分"] },
      { n: 76, p: 24, point: "g2-time-money", type: "经过时间", q: "从 4:10 到 4:40 做语文作业，从 4:40 到 5:10 做数学作业。一共用了多少小时？", a: "1", exp: "两段各 30 分钟，共 60 分钟。", accept: ["1", "1小时", "60分钟"] },
      { n: 77, p: 25, point: "g2-angle-view", type: "立体数块", q: "小正方体按 1、4、9、16 块分层堆成塔，一共有多少块？", a: "30", exp: "1 + 4 + 9 + 16 = 30。", accept: ["30", "30块"] },
      { n: 78, p: 25, point: "g2-appendix", type: "等差求和", q: "车上有 78 个座位，第一站下 1 人，第二站下 2 人，第三站下 3 人……第几站后车上无人？", a: "12", exp: "1 到 12 的和是 78。", accept: ["12", "12站", "第12站"] },
      { n: 79, p: 25, point: "g2-appendix", type: "新运算", q: "规定 M*N=(M+N)÷2，求 (2008*2010)*2009。", a: "2009", exp: "2008*2010=2009，2009*2009=2009。", accept: ["2009"] },
      { n: 80, p: 25, point: "g2-time-money", type: "星期周期", q: "今天是星期二，再过 50 天是星期几？", a: "星期三", exp: "50 ÷ 7 余 1，星期二后 1 天是星期三。", accept: ["星期三", "三"] },
      { n: 81, p: 26, point: "g2-angle-view", type: "图形序列", q: "图形序列填空题中，应同时观察哪些变化？", a: "形状、方向和数量", exp: "形状、方向、颜色、数量都可能变化。", accept: ["形状、方向和数量", "形状方向数量"] },
      { n: 82, p: 26, point: "g2-thinking", type: "和积相等", q: "小明想到三个数，它们的和等于它们的积。资料中的三个数是什么？", a: "1，2，3", exp: "1 + 2 + 3 = 1 × 2 × 3 = 6。", accept: ["1，2，3", "1,2,3", "1 2 3"] },
      { n: 83, p: 26, point: "g2-reading", type: "称谓推理", q: "祖父、父亲、儿子每人一包糖，为什么只需要 3 包？", a: "他们只有3个人", exp: "三代人实际就是 3 个人。", accept: ["他们只有3个人", "3个人", "三个人"] },
      { n: 84, p: 26, point: "g2-thinking", type: "平均数推理", q: "五科平均分 89 分，资料通过多个平均数关系推得数学成绩是多少分？", a: "100", exp: "资料列式推得数学成绩为 100 分。", accept: ["100", "100分"] },
      { n: 85, p: 27, point: "g2-length-measure", type: "和差分段", q: "把 90 米绳子分成三段，第二段比第一段长 3 米，第三段比第二段长 3 米。三段分别是多少米？", a: "27，30，33", exp: "中间一段 30 米，前后分别是 27 米和 33 米。", accept: ["27，30，33", "27,30,33", "27 30 33"] },
      { n: 86, p: 27, point: "g2-appendix", type: "排列计数", q: "用 2、5、0、7 四个数字卡片组成不同的四位数，资料答案共有多少个？", a: "18", exp: "按千位不能为 0 且数字不重复枚举，共 18 个。", accept: ["18", "18个"] },
      { n: 87, p: 27, point: "g2-reading", type: "过河问题", q: "一家四口过河，小船最多载 50 千克，爸爸妈妈各 50 千克，儿子女儿各 25 千克。谁最适合来回划船接送？", a: "儿子和女儿", exp: "两个孩子合起来 50 千克，可以一起往返接送。", accept: ["儿子和女儿", "儿女", "两个孩子"] },
      { n: 88, p: 28, point: "g2-angle-view", type: "方阵转向", q: "81 人排成 9×9 方阵，某同学左边 2 人、前面 3 人。全体向右转后，他前面有几人？", a: "6", exp: "原来右边 6 人，向右转后变成前面。", accept: ["6", "6人"] },
      { n: 89, p: 28, point: "g2-thinking", type: "未知数", q: "解未知符号：28 - □ = 15 + 7，□ 等于多少？", a: "6", exp: "15 + 7 = 22，28 - 22 = 6。", accept: ["6"] },
      { n: 90, p: 29, point: "g2-time-money", type: "量水问题", q: "有 500 克和 300 克两个水杯，怎样量出 400 克水？最终需要量出的水是多少克？", a: "400", exp: "通过倒换可在 500 克杯中留下 400 克。", accept: ["400", "400克"] },
      { n: 91, p: 29, point: "g2-time-money", type: "经过时间", q: "从 4:10 到 5:10，中间分成两段各 30 分钟。总时间是多少分钟？", a: "60", exp: "30 + 30 = 60 分钟。", accept: ["60", "60分钟", "1小时"] },
      { n: 92, p: 29, point: "g2-thinking", type: "数阵填空", q: "第 92 题是数阵填空题。资料中的两个空格答案是什么？", a: "5和0", exp: "资料按周围数和中间数的关系推得两个空格为 5 和 0。", accept: ["5和0", "5，0", "5,0"] },
      { n: 93, p: 30, point: "g2-appendix", type: "空瓶换汽水", q: "瓶装汽水每 3 个空瓶换 1 瓶。买 6 瓶最多一共能喝多少瓶？", a: "9", exp: "6 个空瓶换 2 瓶，再借 1 个空瓶凑 3 个换 1 瓶，共 9 瓶。", accept: ["9", "9瓶"] },
      { n: 94, p: 30, point: "g2-time-money", type: "钟表推理", q: "资料中的钟表推理题答案是 430，写成时间应是多少？", a: "4:30", exp: "430 表示 4 点 30 分。", accept: ["4:30", "4点30分", "4时30分"] },
      { n: 95, p: 30, point: "g2-two-step", type: "差量推理", q: "3 个苹果重 45 千克，一个梨比一个苹果重 5 千克。3 个梨重多少千克？", a: "60", exp: "3 个梨比 3 个苹果重 15 千克，45 + 15 = 60。", accept: ["60", "60千克"] },
      { n: 96, p: 31, point: "g2-two-step", type: "鸡鸭鹅", q: "小明家有 46 只鸭、24 只鹅，鸡和鹅合起来比鸭多 5 只。鸡有多少只？", a: "27", exp: "鸡和鹅共 51 只，鸡有 51 - 24 = 27 只。", accept: ["27", "27只"] },
      { n: 97, p: 31, point: "g2-time-money", type: "单价问题", q: "小红和小华原来钱数相同，都买同价铅笔。小红买 13 支，小华买 7 支，小红比小华少 3 元。每支铅笔多少钱？", a: "1", exp: "资料按差量关系推得每支铅笔 1 元。", accept: ["1", "1元"] },
      { n: 98, p: 31, point: "g2-appendix", type: "周期求和", q: "数列 2，4，1，2，4，1……前 25 个数的和是多少？", a: "58", exp: "2+4+1=7，25 个含 8 组再加 2，和为 58。", accept: ["58"] },
      { n: 99, p: 31, point: "g2-angle-view", type: "圆形排列", q: "圆形排列问题中，数间隔或座位时最应注意什么？", a: "首尾相邻", exp: "圆形排列中首尾也相邻，不能按直线排列漏算。", accept: ["首尾相邻", "头尾相邻", "首尾也相邻"] },
      { n: 100, p: 32, point: "g2-appendix", type: "容斥计数", q: "老师准备 10 个笔盒，5 个装铅笔，4 个装钢笔，2 个既装铅笔又装钢笔。空笔盒有几个？", a: "3", exp: "装过笔的笔盒有 5 + 4 - 2 = 7 个，空盒 10 - 7 = 3 个。", accept: ["3", "3个"] }
    ];

    entries.forEach((item) => {
      add(item.point, [
        text(
          `ref-g2-olympiad-q${pad(item.n)}`,
          sourceId,
          item.p,
          item.q,
          item.a,
          item.exp,
          item.steps || defaultSteps,
          item.type || "二年级奥数题号级改写",
          `小学二年级必学奥数题100题第 ${item.p} 页第 ${item.n} 题改写。`,
          item.accept
        )
      ]);
    });
  }

  function addGeneratedFromScanIndex() {
    (scanIndex.pages || []).forEach((pageRecord, pageIndex) => {
      const pointId = pageRecord.pointHint;
      const templates = T[pointId] || CHINESE_TEMPLATES[pointId] || CHINESE_TEMPLATES["c2-reading"];
      const items = templates.slice(0, 6).map((factory, templateIndex) => {
        const ctx = {
          pageRecord,
          pageIndex,
          templateIndex,
          id: `ref-g2-auto-${pageRecord.sourceId}-p${pad(pageRecord.page)}-q${templateIndex + 1}`
        };
        return factory(ctx);
      }).filter(Boolean);
      if (items.length) add(pointId, items);
    });
  }

  addOlympiadImageSeeds();
  addOlympiadDerivedSeeds();
  addGeneratedFromScanIndex();

  window.MathCampGrade2ReferenceQuestionSeeds = {
    BANK
  };
})();
