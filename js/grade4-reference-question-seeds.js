(function () {
  "use strict";

  const sourceMeta = window.MathCampGrade4ReferenceSourceMeta || { byId: {} };
  const scanIndex = window.MathCampGrade4ReferenceScanIndex || { pages: [] };
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

  function imageText(id, pointId, sourceId, page, questionText, answer, explanation, steps, templateType, sourceNote, image, acceptedAnswers) {
    add(pointId, [{
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
    }]);
  }

  function imageChoice(id, pointId, sourceId, page, prompt, correct, wrongs, explanation, steps, templateType, sourceNote, image) {
    add(pointId, [{
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
    }]);
  }

  function addImageSeeds() {
    imageChoice(
      "ref-g4-img-math-stat-001",
      "g4-statistics",
      "g4-math-bar-stat-word",
      1,
      "做条形统计图应用题时，第一步最应该做什么？",
      "看清每格表示的数量和横纵项目",
      ["只看最高的柱子颜色", "直接把所有数相乘", "忽略统计图标题"],
      "条形统计图要先读标题、单位和每格数量，再比较或计算。",
      ["读标题和单位。", "看每格表示多少。", "再按问题计算。"],
      "条形统计图截图题",
      "从四上条形统计图应用题资料裁图，题面按可辨题型结构改写。",
      pdfCrop("g4-math-bar-stat-word", 1, "assets/reference/grade4/g4-math-bar-stat-p001.png", "四上数学条形统计图应用题截图", "四年级条形统计图参考页截图")
    );
    imageText(
      "ref-g4-img-math-angle-001",
      "g4-angle-triangle",
      "g4-math-peiyou-100",
      20,
      "一个三角形两个内角分别是 45° 和 65°，第三个角是多少度？",
      "70",
      "三角形内角和是 180°，180 - 45 - 65 = 70。",
      ["写出内角和 180°。", "减去已知两个角。", "得到第三个角。"],
      "角与三角形截图题",
      "从培优扫描页裁图，保留图形题来源，题面重新改写为清晰数据。",
      null
    );
    imageText(
      "ref-g4-img-math-area-001",
      "g4-area",
      "g4-math-special-training",
      10,
      "长方形长 12 米、宽 7 米，面积是多少平方米？",
      "84",
      "长方形面积 = 长 × 宽，12 × 7 = 84。",
      ["找到长和宽。", "用长乘宽。", "写出平方米。"],
      "面积截图题",
      "从数学专题卷扫描页裁图，按面积题型改写。",
      null
    );
    imageChoice(
      "ref-g4-img-math-large-001",
      "g4-large",
      "g4-math-key-knowledge",
      1,
      "参考截图整理了大数认识知识。读亿以内数时，最稳的方法是哪一项？",
      "先分级，再从高位一级一级读",
      ["从个位开始随便读", "只读中间的数字", "把零全部省略"],
      "大数读法要先按四位一级分级，再从高位读起。",
      ["按个级、万级分级。", "从高位读。", "按规则处理 0。"],
      "大数知识点截图题",
      "从数学必背知识 PDF 第 1 页裁图，按大数认识能力改写。",
      pdfCrop("g4-math-key-knowledge", 1, "assets/reference/grade4/g4-math-key-large-p001.png", "四年级数学大数知识点截图", "四年级数学必背知识大数参考截图")
    );
    imageChoice(
      "ref-g4-img-cn-poem-001",
      "c4-poem-classic",
      "g4-chinese-key-knowledge",
      1,
      "参考截图列出四年级语文常考知识。理解古诗文时，最合适的方法是哪一项？",
      "结合注释、关键词和诗句画面理解",
      ["只背页码", "只数标点", "只看题号字体"],
      "古诗文理解要抓关键词，结合注释和画面体会意思。",
      ["读诗句。", "看注释。", "抓关键词想象画面。"],
      "古诗文积累截图题",
      "从语文知识点 PDF 第 1 页裁图，按古诗文理解能力改写。",
      pdfCrop("g4-chinese-key-knowledge", 1, "assets/reference/grade4/g4-chinese-key-poem-p001.png", "四年级语文古诗文知识点截图", "四年级语文常考知识古诗文参考截图")
    );
    imageChoice(
      "ref-g4-img-cn-reading-001",
      "c4-modern-reading",
      "g4-chinese-sunshine-paper",
      12,
      "回答现代文阅读原因题时，最应该怎么做？",
      "回到原文找前后句依据",
      ["只看插图颜色", "只猜一个成语", "只抄题号"],
      "原因题要回到原文，找前后句中的行为、心理或结果依据。",
      ["读问题。", "回原文定位。", "用材料依据作答。"],
      "现代文阅读截图题",
      "从语文试卷扫描页裁图，按阅读题型改写。",
      pdfCrop("g4-chinese-sunshine-paper", 12, "assets/reference/grade4/g4-chinese-sunshine-reading-p012.png", "四年级语文阅读题截图", "四年级语文试卷阅读参考截图")
    );
    imageChoice(
      "ref-g4-img-en-ready-001",
      "e4-vocabulary-home-school",
      "g4-english-ready",
      6,
      "Which word means 教室?",
      "classroom",
      ["fork", "weather", "uncle"],
      "classroom means 教室.",
      ["Read the Chinese meaning.", "Match it with the English word.", "Choose classroom."],
      "英语词汇截图题",
      "从四年级英语入门扫描页裁图，按词汇匹配题型改写。",
      pdfCrop("g4-english-ready", 6, "assets/reference/grade4/g4-english-ready-vocab-p006.png", "四年级英语词汇题截图", "四年级英语入门资料词汇参考截图")
    );
    imageText(
      "ref-g4-img-en-copybook-001",
      "e4-pattern-location-time",
      "g4-english-wcx-copybook",
      22,
      "Complete the question: ___ time is it?",
      "What",
      "The sentence is What time is it?",
      ["Read the time question.", "Use What before time.", "Complete the sentence."],
      "英语句型截图题",
      "从英语活页默写扫描页裁图，按四上时间问答句型改写。",
      pdfCrop("g4-english-wcx-copybook", 22, "assets/reference/grade4/g4-english-copybook-sentences-p022.png", "四年级英语句型默写截图", "四年级英语活页默写句型参考截图"),
      ["What", "what"]
    );
    imageChoice(
      "ref-g4-img-math-olympiad-001",
      "g4-thinking",
      "g4-math-olympiad-training",
      1,
      "数线段、长方形这类图形时，最稳的方法是哪一项？",
      "按顺序分类计数，避免重复和遗漏",
      ["只看最大的图形", "随便猜一个数", "先把题目涂黑"],
      "图形计数题要按长度、位置或组合方式分类，逐类计数后再合并。",
      ["确定计数对象。", "按类别列举。", "检查是否重复或遗漏。"],
      "奥数图形计数截图题",
      "从四年级奥数培训综合训练第 1 页裁图，按图形计数题型改写。",
      pdfCrop("g4-math-olympiad-training", 1, "assets/reference/grade4/g4-math-olympiad-figure-p001.png", "四年级奥数图形计数题截图", "四年级奥数培训综合训练图形计数参考截图")
    );
  }

  function pad(value, size = 3) {
    return String(value).padStart(size, "0");
  }

  function value(ctx, salt, min, max) {
    const spread = Math.max(1, max - min + 1);
    const raw = ctx.pageRecord.page * 41 + ctx.pageIndex * 19 + ctx.templateIndex * 13 + salt * 17;
    return min + (raw % spread);
  }

  function autoSource(ctx, templateType, diagram) {
    const pageRecord = ctx.pageRecord;
    const quality = pageRecord.extractStatus === "text-extractable" ? "text-extracted" : "scan-page-rewrite";
    return source(pageRecord.sourceId, pageRecord.page, `${pageRecord.scanNote} 自动扩展：${templateType}。`, quality, {
      scanStatus: pageRecord.extractStatus,
      visualPolicy: diagram ? "self-drawn-diagram" : ""
    });
  }

  function autoText(ctx, questionText, answer, explanation, steps, templateType, acceptedAnswers, diagram) {
    const textAnswer = String(answer);
    return {
      id: ctx.id,
      answerType: "text",
      text: questionText,
      answer: textAnswer,
      acceptedAnswers: (acceptedAnswers || [textAnswer]).map(String),
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
      wrongs: (wrongs || []).map(String),
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

  function gridScene(ctx) {
    const rows = value(ctx, 1, 3, 6);
    const cols = value(ctx, 2, 4, 8);
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if ((x + y + ctx.pageIndex) % 4 !== 0) cells.push({ x, y });
      }
    }
    return { count: cells.length, rows, cols, diagram: { type: "grid-shape", rows, cols, cells, unit: "cm", caption: "自绘面积数格子图" } };
  }

  function angleScene(ctx) {
    const angle = value(ctx, 3, 35, 135);
    return { angle, diagram: { type: "angle-measure", angle, length: value(ctx, 4, 5, 11), caption: "自绘角度示意图" } };
  }

  function polygonScene(ctx) {
    const mode = ["triangle", "parallelogram", "trapezoid"][(ctx.pageIndex + ctx.templateIndex) % 3];
    const base = value(ctx, 5, 6, 14);
    const height = value(ctx, 6, 4, 10);
    return { base, height, mode, diagram: { type: "polygon-shape", mode, base, base2: base + 4, height, side: height + 2, angle: 60, angle2: 70, a: 50, caption: "自绘多边形特征图" } };
  }

  function polygonAreaScene(ctx) {
    const mode = ["parallelogram", "triangle", "trapezoid"][(ctx.pageIndex + 1) % 3];
    const base = value(ctx, 7, 8, 16);
    const height = value(ctx, 8, 4, 9);
    const top = Math.max(3, base - 4);
    const answer = mode === "triangle" ? base * height / 2 : mode === "trapezoid" ? (base + top) * height / 2 : base * height;
    return { base, height, top, answer, mode, diagram: { type: "polygon-area", mode, base, base2: top, height, side: height + 3, caption: "自绘面积公式图" } };
  }

  function blockScene(ctx) {
    const columns = [value(ctx, 9, 1, 4), value(ctx, 10, 1, 4), value(ctx, 11, 1, 4), value(ctx, 12, 1, 4)];
    return { columns, answer: Math.max(...columns), diagram: { type: "block-view", columns, caption: "自绘观察物体图" } };
  }

  function shapeScene(ctx) {
    const circles = value(ctx, 13, 2, 7);
    const squares = value(ctx, 14, 2, 7);
    const triangles = value(ctx, 15, 2, 6);
    return {
      circles,
      squares,
      triangles,
      diagram: {
        type: "shape-count",
        shapes: [
          { kind: "circle", count: circles, label: "圆形" },
          { kind: "square", count: squares, label: "正方形" },
          { kind: "triangle", count: triangles, label: "三角形" }
        ],
        caption: "自绘统计图"
      }
    };
  }

  function routeScene(ctx) {
    const east = value(ctx, 16, 200, 800);
    const north = value(ctx, 17, 100, 500);
    return { east, north, diagram: { type: "route-map", east, north, caption: "自绘路线图" } };
  }

  const MATH_TEMPLATES = {
    "g4-mixed": [
      (ctx) => {
        const a = value(ctx, 21, 80, 240);
        const b = value(ctx, 22, 3, 12);
        const c = value(ctx, 23, 15, 70);
        return autoText(ctx, `计算 ${a} + ${b} × ${c} = ?`, a + b * c, "四则混合运算要先乘除后加减。", ["先算乘法。", "再做加法。", "写出结果。"], "四则混合运算");
      },
      (ctx) => {
        const a = value(ctx, 24, 120, 360);
        const b = value(ctx, 25, 20, 80);
        const c = value(ctx, 26, 2, 8);
        return autoChoice(ctx, `计算 (${a} - ${b}) ÷ ${c} 时，第一步先算什么？`, `${a} - ${b}`, [`${b} ÷ ${c}`, `${a} ÷ ${c}`, `${a} + ${b}`], "有括号先算括号里面。", ["观察括号。", "先算减法。", "再除以除数。"], "括号优先");
      },
      (ctx) => autoJudge(ctx, "没有括号的混合算式中，乘除通常先于加减。", "对", "四则混合运算要按运算顺序计算。", ["看有没有括号。", "先乘除。", "后加减。"], "运算顺序判断"),
      (ctx) => {
        const n = value(ctx, 27, 25, 99);
        return autoText(ctx, `用简便方法计算 ${n} × 4 × 25 = ?`, n * 100, "4 × 25 = 100，可以先结合。", ["先算 4 × 25。", "得到 100。", `再算 ${n} × 100。`], "运算定律");
      },
      (ctx) => {
        const scene = routeScene(ctx);
        return autoText(ctx, `看路线图，从学校向东 ${scene.east} 米，再向北 ${scene.north} 米，一共走了多少米？`, scene.east + scene.north, "总路程是两段路程相加。", ["读出向东路程。", "读出向北路程。", "相加求总路程。"], "路线图两步读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "下面哪个算式最适合先算括号？", "(72 + 28) × 5", ["72 + 28 × 5", "72 × 5 + 28", "72 - 28 ÷ 4"], "括号改变运算顺序，应先算括号内。", ["找括号。", "判断运算顺序。", "选择带括号算式。"], "括号识别")
    ],
    "g4-vertical": [
      (ctx) => {
        const a = value(ctx, 31, 126, 684);
        const b = value(ctx, 32, 12, 58);
        return autoText(ctx, `用竖式思路计算 ${a} × ${b} = ?`, a * b, "三位数乘两位数要分别乘个位和十位，再把部分积相加。", ["先乘个位。", "再乘十位并错位。", "把部分积相加。"], "三位数乘两位数");
      },
      (ctx) => {
        const divisor = value(ctx, 33, 12, 36);
        const quotient = value(ctx, 34, 15, 48);
        return autoText(ctx, `用竖式思路计算 ${divisor * quotient} ÷ ${divisor} = ?`, quotient, "除数是两位数时，要看前两位够不够除并试商。", ["先看被除数前几位。", "估计商。", "乘回去检查。"], "除数是两位数");
      },
      (ctx) => autoChoice(ctx, "三位数乘两位数竖式中，乘十位得到的部分积末尾应该怎样写？", "向左错一位", ["和个位部分积完全对齐", "写在题目上方", "不用写"], "十位表示几个十，部分积要向左错一位。", ["看乘数十位。", "理解几个十。", "部分积错位。"], "乘法竖式错位"),
      (ctx) => autoJudge(ctx, "除数是两位数的除法可以用“四舍五入”估商，再调整。", "对", "估商后还要乘回去检查是否偏大或偏小。", ["把除数看成接近的整十。", "先估商。", "再调整。"], "试商判断"),
      (ctx) => {
        const scene = blockScene(ctx);
        return autoText(ctx, "看方块图，从正面看最高一列有几层？", scene.answer, "从正面逐列比较层数，最高列就是答案。", ["数每列高度。", "比较大小。", "找最高列。"], "观察物体读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "计算除法竖式后，哪种验算方法最合适？", "商 × 除数 + 余数", ["商 + 除数", "余数 × 余数", "只看最高位"], "有余数除法可用商乘除数再加余数验算。", ["写出商和余数。", "商乘除数。", "加余数核对被除数。"], "除法验算")
    ],
    "g4-two-step": [
      (ctx) => {
        const each = value(ctx, 41, 18, 46);
        const count = value(ctx, 42, 4, 12);
        const minus = value(ctx, 43, 20, 90);
        return autoText(ctx, `每箱有 ${each} 个零件，${count} 箱共有一些，用去 ${minus} 个，还剩多少个？`, each * count - minus, "先求总数，再减去用去的数量。", ["先乘。", "再减。", "回答还剩。"], "乘减两步应用");
      },
      (ctx) => {
        const total = value(ctx, 44, 180, 420);
        const add = value(ctx, 45, 30, 90);
        const groups = value(ctx, 46, 3, 9);
        return autoChoice(ctx, `原有 ${total} 本书，又添 ${add} 本，平均分给 ${groups} 个班。求每班几本，正确算式是？`, `(${total} + ${add}) ÷ ${groups}`, [`${total} + ${add} ÷ ${groups}`, `${total} × ${groups} - ${add}`, `${total} ÷ ${groups} + ${add}`], "先求总本数，再平均分。", ["先加。", "再除。", "选择带括号的算式。"], "加除两步应用");
      },
      (ctx) => autoJudge(ctx, "两步应用题要先找最后问题，再确定中间量。", "对", "最后问题决定第一步要先求什么。", ["读问题。", "找缺少的中间量。", "分步列式。"], "两步题策略"),
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看统计图，圆形和正方形一共有多少个？", scene.circles + scene.squares, "先分别数出两类图形，再相加。", ["数圆形。", "数正方形。", "相加。"], "统计图两步读图", null, scene.diagram);
      },
      (ctx) => {
        const a = value(ctx, 47, 12, 28);
        const b = value(ctx, 48, 3, 9);
        const c = value(ctx, 49, 2, 6);
        return autoText(ctx, `${a} × ${b} + ${a} × ${c} = ?`, a * (b + c), "可以直接计算，也可以用乘法分配律合并。", ["先算两个乘法。", "再相加。", "或合并成同一个数乘和。"], "乘加两步计算");
      },
      (ctx) => autoChoice(ctx, "做两步题时，下面哪种草稿最清楚？", "每一步写出中间量名称", ["只写答案", "只圈题号", "把数字都抄一遍但不列式"], "写出中间量名称能减少算对但答错。", ["确定第一步求什么。", "写中间量。", "再求最后问题。"], "应用题书写")
    ],
    "g4-large": [
      (ctx) => {
        const num = value(ctx, 51, 120000, 980000);
        return autoText(ctx, `${num} 里面有多少个一万？只写整数部分。`, Math.floor(num / 10000), "看万位以上的数量，整数部分表示几个一万。", ["按四位一级分级。", "找到万级。", "写整数部分。"], "大数分级");
      },
      (ctx) => autoChoice(ctx, "读 30506000 时，中间的 0 应该怎样处理？", "每级末尾的 0 不读，其他数位连续几个 0 只读一个零", ["所有 0 都读出来", "所有 0 都不读", "只读个位"], "大数读法要按分级和 0 的读法规则处理。", ["先分级。", "一级一级读。", "按规则读 0。"], "亿以内数读法"),
      (ctx) => autoJudge(ctx, "比较两个大数大小时，可以先比较位数。", "对", "位数多的数更大；位数相同再从高位比。", ["看位数。", "位数相同比高位。", "逐位比较。"], "大数比较"),
      (ctx) => {
        const n = value(ctx, 52, 20000, 99000);
        return autoText(ctx, `把 ${n} 改写成用“万”作单位的近似数，约是多少万？`, Math.round(n / 10000), "改写近似数可以看千位四舍五入。", ["找到万位。", "看千位。", "四舍五入。"], "大数近似数");
      },
      (ctx) => {
        const scene = routeScene(ctx);
        return autoText(ctx, `看路线图，东行 ${scene.east} 米约是几百米？`, Math.round(scene.east / 100) * 100, "估成整百数更便于量感判断。", ["找到米数。", "看十位四舍五入。", "写整百近似数。"], "大数量感读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "算盘或计数器表示大数时，每一位上的珠子数量表示什么？", "该数位上有几个计数单位", ["页码", "题号", "颜色深浅"], "数位上的数字表示该位计数单位的个数。", ["看数位。", "看数字。", "联系计数单位。"], "数位意义")
    ],
    "g4-area": [
      (ctx) => {
        const l = value(ctx, 61, 6, 18);
        const w = value(ctx, 62, 4, 12);
        return autoText(ctx, `长方形长 ${l} 米，宽 ${w} 米，面积是多少平方米？`, l * w, "长方形面积 = 长 × 宽。", ["找长和宽。", "相乘。", "写平方米。"], "长方形面积");
      },
      (ctx) => {
        const scene = gridScene(ctx);
        return autoText(ctx, `看数格子图，每个小格面积是 1 平方厘米，涂色部分面积是多少平方厘米？`, scene.count, "每个小格 1 平方厘米，数出涂色格数就是面积。", ["数完整格。", "每格 1 平方厘米。", "写出面积。"], "数格子面积", null, scene.diagram);
      },
      (ctx) => {
        const scene = polygonAreaScene(ctx);
        return autoText(ctx, `看自绘图，${scene.mode === "triangle" ? "三角形" : scene.mode === "trapezoid" ? "梯形" : "平行四边形"}面积是多少平方厘米？`, scene.answer, "按图形面积公式计算。", ["读出底和高。", "选择对应面积公式。", "计算面积。"], "多边形面积读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "面积单位“平方米”主要用来表示什么？", "平面图形或物体表面的大小", ["一条边的长度", "物体的重量", "时间长短"], "面积描述面的大小，平方米是常用面积单位。", ["区分长度和面积。", "平方米表示面积。", "选择面的大小。"], "面积单位"),
      (ctx) => autoJudge(ctx, "周长和面积是同一个概念，只是名字不同。", "错", "周长是边线一周长度，面积是面的大小。", ["比较周长。", "比较面积。", "判断不同。"], "周长面积辨析"),
      (ctx) => {
        const a = value(ctx, 63, 10, 20);
        return autoText(ctx, `正方形边长 ${a} 厘米，面积是多少平方厘米？`, a * a, "正方形面积 = 边长 × 边长。", ["找到边长。", "边长乘边长。", "写平方厘米。"], "正方形面积");
      }
    ],
    "g4-angle-triangle": [
      (ctx) => {
        const scene = angleScene(ctx);
        return autoText(ctx, `看角度示意图，这个角是 ${scene.angle}°，它是锐角、直角还是钝角？`, scene.angle < 90 ? "锐角" : scene.angle === 90 ? "直角" : "钝角", "小于 90° 是锐角，等于 90° 是直角，大于 90° 小于 180° 是钝角。", ["读角度。", "和 90° 比较。", "判断角的类型。"], "角的分类读图", null, scene.diagram);
      },
      (ctx) => {
        const a = value(ctx, 71, 35, 75);
        const b = value(ctx, 72, 40, 80);
        return autoText(ctx, `三角形两个内角是 ${a}° 和 ${b}°，第三个内角是多少度？`, 180 - a - b, "三角形内角和是 180°。", ["写出 180°。", "减去两个已知角。", "得到第三个角。"], "三角形内角和");
      },
      (ctx) => {
        const scene = polygonScene(ctx);
        return autoChoice(ctx, "看自绘多边形图，哪一项是判断平行四边形的重要特征？", "两组对边分别平行", ["只有一个直角", "三条边相等", "没有对边"], "平行四边形有两组对边分别平行。", ["观察对边。", "判断平行关系。", "选择特征。"], "四边形特征", scene.diagram);
      },
      (ctx) => autoJudge(ctx, "量角时，量角器中心点要对准角的顶点。", "对", "中心点、零刻度线和角的一边要对准。", ["对准顶点。", "对准一边。", "读另一边刻度。"], "量角方法"),
      (ctx) => autoChoice(ctx, "下面哪组角可能组成一个三角形？", "50°、60°、70°", ["90°、90°、20°", "30°、40°、50°", "100°、100°、20°"], "三角形三个内角和必须是 180°。", ["把三个角相加。", "找和为 180°。", "选择 50、60、70。"], "三角形角度判断"),
      (ctx) => {
        const scene = polygonScene(ctx);
        return autoText(ctx, "看多边形特征图，如果梯形只有一组对边平行，那么它有几组对边平行？", 1, "梯形的核心特征是只有一组对边平行。", ["回忆梯形特征。", "数平行对边组数。", "写 1。"], "梯形特征读图", ["1", "一"], scene.diagram);
      }
    ],
    "g4-mul-div": [
      (ctx) => {
        const a = value(ctx, 81, 24, 86);
        const b = value(ctx, 82, 12, 48);
        return autoText(ctx, `${a} × ${b} = ?`, a * b, "两位数乘两位数可以分解成个位和十位分别乘。", ["先乘个位。", "再乘十位。", "合并部分积。"], "多位乘法");
      },
      (ctx) => {
        const divisor = value(ctx, 83, 12, 45);
        const quotient = value(ctx, 84, 11, 39);
        return autoText(ctx, `${divisor * quotient} ÷ ${divisor} = ?`, quotient, "除法可以用乘法逆运算检查。", ["先试商。", "商乘除数。", "核对被除数。"], "多位除法");
      },
      (ctx) => autoChoice(ctx, "速度 × 时间 可以求什么？", "路程", ["单价", "面积", "角度"], "行程问题的基本关系是速度 × 时间 = 路程。", ["找速度。", "找时间。", "相乘求路程。"], "行程数量关系"),
      (ctx) => autoJudge(ctx, "三位数乘两位数时，十位上的数表示几个十。", "对", "所以十位部分积要向左错一位。", ["看乘数十位。", "理解计数单位。", "写部分积。"], "乘法数位判断"),
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看图形统计图，三角形比圆形少多少个？", Math.abs(scene.triangles - scene.circles), "比较多少用减法，大数减小数。", ["数三角形。", "数圆形。", "相减比较。"], "图形统计读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "估算 398 × 21 时，最接近的整百整十估算是哪一个？", "400 × 20", ["300 × 2", "40 × 200", "398 + 21"], "398 接近 400，21 接近 20。", ["找接近整百。", "找接近整十。", "选择估算式。"], "乘法估算")
    ],
    "g4-statistics": [
      (ctx) => {
        const a = value(ctx, 91, 20, 60);
        const b = value(ctx, 92, 20, 60);
        const c = value(ctx, 93, 20, 60);
        return autoText(ctx, `三次跳绳成绩分别是 ${a}、${b}、${c} 下，平均数是多少？`, Math.round((a + b + c) / 3), "平均数 = 总数 ÷ 份数。", ["先求总数。", "再除以 3。", "得到平均数。"], "平均数");
      },
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看统计图，哪种图形数量最多？", scene.circles >= scene.squares && scene.circles >= scene.triangles ? "圆形" : scene.squares >= scene.triangles ? "正方形" : "三角形", "比较三类图形数量，最大的一类就是最多。", ["读每类数量。", "比较大小。", "写最多的种类。"], "统计图比较", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "读条形统计图时，想知道“多多少”，应该怎么做？", "用较大的数据减较小的数据", ["把柱子颜色相加", "只看标题", "把所有数相乘"], "多多少是两个数量的差。", ["读出两个数据。", "比较大小。", "相减。"], "条形统计图比较"),
      (ctx) => autoJudge(ctx, "平均数一定是这组数据中实际出现过的一个数。", "错", "平均数表示整体水平，不一定在数据中出现。", ["理解平均数。", "举例验证。", "判断错误。"], "平均数意义"),
      (ctx) => {
        const a = value(ctx, 94, 18, 45);
        const b = value(ctx, 95, 18, 45);
        return autoText(ctx, `条形统计图中一班 ${a} 人，二班 ${b} 人，两个班一共多少人？`, a + b, "合计人数用加法。", ["读一班人数。", "读二班人数。", "相加求合计。"], "统计合计");
      },
      (ctx) => autoChoice(ctx, "制作条形统计图时，纵轴每格表示 5 人，如果柱子高 6 格，表示多少人？", "30 人", ["11 人", "6 人", "5 人"], "每格 5 人，6 格就是 5 × 6 = 30 人。", ["看每格数量。", "数格数。", "相乘。"], "每格数量")
    ],
    "g4-word": [
      (ctx) => {
        const speed = value(ctx, 101, 45, 90);
        const time = value(ctx, 102, 2, 6);
        return autoText(ctx, `汽车每小时行 ${speed} 千米，行 ${time} 小时，一共行多少千米？`, speed * time, "速度 × 时间 = 路程。", ["找到速度。", "找到时间。", "相乘求路程。"], "行程应用题");
      },
      (ctx) => {
        const price = value(ctx, 103, 18, 65);
        const count = value(ctx, 104, 3, 9);
        const coupon = value(ctx, 105, 5, 20);
        return autoText(ctx, `每本书 ${price} 元，买 ${count} 本后优惠 ${coupon} 元，应付多少元？`, price * count - coupon, "先求原价总数，再减优惠。", ["单价乘数量。", "减去优惠。", "写应付金额。"], "购物应用题");
      },
      (ctx) => autoChoice(ctx, "解决四年级应用题时，看到“每小时行多少千米”通常表示什么？", "速度", ["面积", "角度", "平均数"], "每小时行的路程就是速度。", ["读关键词每小时。", "联系行程问题。", "判断为速度。"], "数量关系识别"),
      (ctx) => autoJudge(ctx, "应用题中的所有数字都一定要用上。", "错", "有些题含有多余条件，要根据问题筛选。", ["读问题。", "圈有用条件。", "排除干扰。"], "干扰条件判断"),
      (ctx) => {
        const scene = routeScene(ctx);
        return autoText(ctx, `看路线图，小明先向东 ${scene.east} 米，再向北 ${scene.north} 米。两段路相差多少米？`, Math.abs(scene.east - scene.north), "比较两段路程相差多少，用较大数减较小数。", ["读两段路程。", "比较大小。", "相减求差。"], "路线应用题", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "题中有“买 5 送 1”，要求实际得到多少个，最容易漏掉什么？", "赠送的数量", ["题号", "标点", "页边距"], "赠送数量也是实际得到的一部分。", ["读优惠规则。", "找购买数量。", "加上赠送数量。"], "购物规则")
    ],
    "g4-reading": [
      (ctx) => autoChoice(ctx, "题目：书店有 120 本故事书，卖出 45 本；旁边还有 30 本字典。求故事书还剩多少本，哪个条件是干扰信息？", "旁边还有 30 本字典", ["120 本故事书", "卖出 45 本", "求还剩多少本"], "问题只问故事书剩余，字典数量无关。", ["读问题。", "找故事书条件。", "排除字典。"], "干扰条件"),
      (ctx) => autoJudge(ctx, "表格题要先读行列标题，再读数据。", "对", "行列标题决定每个数据表示什么。", ["看表头。", "看行列。", "读数据。"], "表格阅读"),
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看图形统计图，如果问题问“正方形和三角形一共多少个”，答案是多少？", scene.squares + scene.triangles, "先找到对应两类图形，再相加。", ["找正方形数量。", "找三角形数量。", "相加。"], "统计阅读", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "读题时遇到“至少需要几辆车”，有余数时通常怎样处理？", "商加 1", ["舍去余数", "只写余数", "把除数加 1"], "剩下的人也需要一辆车。", ["列除法。", "看余数。", "有余数商加 1。"], "进一法阅读"),
      (ctx) => {
        const a = value(ctx, 111, 10, 30);
        const b = value(ctx, 112, 5, 20);
        return autoText(ctx, `条件：甲有 ${a} 张卡片，乙比甲多 ${b} 张。乙有多少张？`, a + b, "乙比甲多，就在甲的数量上加多出的数量。", ["找甲的数量。", "找多出的数量。", "相加。"], "条件关系阅读");
      },
      (ctx) => autoChoice(ctx, "判断题目是否需要两步计算，最可靠的方法是什么？", "看最后问题所需的量是否已经直接给出", ["只看题干长度", "只看数字个数", "只看单位"], "如果关键量没有直接给出，往往要先求中间量。", ["读最后问题。", "找需要的量。", "判断是否缺中间量。"], "读题策略")
    ],
    "g4-thinking": [
      (ctx) => {
        const start = value(ctx, 121, 8, 40);
        const step = value(ctx, 122, 4, 12);
        return autoText(ctx, `找规律：${start}，${start + step}，${start + step * 2}，${start + step * 3}，下一个数是多少？`, start + step * 4, "相邻两项都增加同一个数。", ["求相邻差。", "发现每次增加。", "继续加一次。"], "数列规律");
      },
      (ctx) => autoChoice(ctx, "鸡兔同笼入门题常用哪种方法更清楚？", "列表或假设", ["只猜答案", "只看页码", "把单位擦掉"], "列表和假设能把复杂数量关系转清楚。", ["确定总头数和总脚数。", "列表尝试。", "根据差调整。"], "策略选择"),
      (ctx) => autoJudge(ctx, "估算结果只要方向合理，就能帮助检查精算答案是否离谱。", "对", "估算常用来判断答案数量级是否合理。", ["先估大致范围。", "再精算。", "比较是否合理。"], "估算合理性"),
      (ctx) => {
        const scene = angleScene(ctx);
        return autoChoice(ctx, `看角度示意图，${scene.angle}° 更接近哪种量感？`, scene.angle < 90 ? "比直角小" : "比直角大", scene.angle < 90 ? ["比平角大", "等于 180°", "不能比较"] : ["比直角小", "等于 0°", "没有顶点"], "把角和 90° 直角比较，可以判断量感。", ["读角度。", "和 90° 比。", "选择合理描述。"], "角度量感", scene.diagram);
      },
      (ctx) => {
        const a = value(ctx, 123, 20, 60);
        return autoText(ctx, `甲比乙多 ${a} 元，甲给乙多少元后两人一样多？`, a / 2, "移多补少时，给出的数量是差的一半。", ["看差是多少。", "一次转移会让差减少两倍。", "用差除以 2。"], "移多补少");
      },
      (ctx) => autoChoice(ctx, "遇到复杂条件题，下面哪一步最有帮助？", "把条件整理成表格或线段图", ["直接背答案", "先写作文", "只看最后一个数字"], "表格或线段图能降低信息混乱。", ["列出对象。", "整理条件。", "再推理。"], "思维整理")
    ],
    "g4-appendix": [
      (ctx) => {
        const cycle = value(ctx, 131, 3, 6);
        const pos = value(ctx, 132, 20, 80);
        const rem = pos % cycle || cycle;
        return autoText(ctx, `一组图形每 ${cycle} 个循环，第 ${pos} 个是这一组中的第几个？`, rem, "周期问题用总序号除以周期，看余数；余 0 表示最后一个。", ["找周期。", "用序号除以周期。", "看余数。"], "周期规律");
      },
      (ctx) => autoChoice(ctx, "优化问题“烙饼”或“沏茶”常考什么能力？", "合理安排顺序节省时间", ["只记住题号", "只看颜色", "随意等待"], "优化题要把能同时做的事情安排好。", ["列出步骤。", "找可同时进行的事。", "安排最短时间。"], "优化策略"),
      (ctx) => autoJudge(ctx, "附加题也要先画图或列表，再计算更稳。", "对", "复杂关系可视化后更容易推理。", ["读条件。", "画图列表。", "按关系计算。"], "附加题方法"),
      (ctx) => {
        const scene = polygonScene(ctx);
        return autoChoice(ctx, "看多边形图，判断图形特征时最应该关注什么？", "边和角的关系", ["页面颜色", "题号大小", "纸张厚度"], "图形分类要看边、角、平行和垂直等关系。", ["观察边数。", "观察角。", "看平行关系。"], "图形推理", scene.diagram);
      },
      (ctx) => {
        const a = value(ctx, 133, 4, 12);
        const b = value(ctx, 134, 3, 9);
        return autoText(ctx, `${a} 件上衣和 ${b} 条裤子，每次选 1 件上衣和 1 条裤子，一共有几种搭配？`, a * b, "搭配问题用乘法计数。", ["上衣有几种。", "裤子有几种。", "相乘。"], "搭配计数");
      },
      (ctx) => autoChoice(ctx, "和差问题中，已知和与差，先求较大数可用什么思路？", "(和 + 差) ÷ 2", ["和 × 差", "和 - 2", "差 ÷ 和"], "较大数比平均的一半多差的一半。", ["理解和。", "理解差。", "用公式求较大数。"], "和差问题")
    ]
  };

  const CHINESE_TEMPLATES = {
    "c4-word-sentence": [
      (ctx) => autoChoice(ctx, "材料：他望着远处连绵的山峰，心里十分震撼。题目：“震撼”的意思最接近哪一个？", "受到强烈触动", ["轻轻摇晃", "非常安静", "颜色变浅"], "联系“连绵的山峰”和“心里”，这里强调内心受到触动。", ["回到句子。", "联系语境。", "选择意思。"], "语境词义"),
      (ctx) => autoChoice(ctx, "下面哪一项词语搭配更恰当？", "宽阔的操场", ["清脆的阳光", "猛烈的铅笔", "安静的雷声"], "宽阔可以形容操场面积大。", ["读中心词。", "判断修饰语。", "选择搭配自然的一项。"], "词语搭配"),
      (ctx) => autoJudge(ctx, "理解词语时，可以结合上下文判断意思。", "对", "上下文能提供人物、事件和情感线索。", ["找词语所在句。", "联系前后句。", "确定意思。"], "词义方法"),
      (ctx) => autoText(ctx, "补充词语：鸦雀无（ ）。", "声", "成语是“鸦雀无声”，形容非常安静。", ["读前半部分。", "回忆成语。", "填声。"], "成语填空", ["声"]),
      (ctx) => autoChoice(ctx, "把句子写具体时，最适合补充哪类信息？", "时间、地点、动作或样子", ["页码和字体", "纸张厚度", "试卷颜色"], "扩句要让表达更具体、更通顺。", ["读原句。", "找可补充内容。", "保持通顺。"], "扩句方法"),
      (ctx) => autoJudge(ctx, "缩句时要保留句子的主要意思。", "对", "缩句删去修饰成分，但主干意思不能变。", ["找主干。", "删修饰。", "核对意思。"], "缩句判断")
    ],
    "c4-sick-sentence": [
      (ctx) => autoChoice(ctx, "修改病句“通过这次活动，使我懂得了合作。”最恰当的一项是哪一个？", "删去“通过”或“使”", ["把活动改成活泼", "在句末加逗号", "删去合作"], "“通过……使……”连用导致主语缺失。", ["找主语。", "发现句子缺主语。", "删去其中一个词。"], "成分残缺"),
      (ctx) => autoChoice(ctx, "下面哪一句没有语病？", "同学们认真完成了作业。", ["同学们认真完成了作业和歌声。", "通过练习，使成绩进步。", "他大约一定会来。"], "这句话主谓宾搭配自然，表达完整。", ["读每个选项。", "看搭配和主语。", "选择通顺句。"], "病句辨析"),
      (ctx) => autoJudge(ctx, "修改病句时，不能改变原句主要意思。", "对", "修改要让句子通顺，同时保留原意。", ["读原意。", "找病因。", "最小改动。"], "修改原则"),
      (ctx) => autoChoice(ctx, "“我们要养成认真听讲。”这句话的问题是？", "缺少宾语", ["标点太多", "主语太长", "没有数字"], "养成后面缺少“的习惯”。", ["找谓语养成。", "看后面缺什么。", "补上宾语。"], "宾语残缺"),
      (ctx) => autoText(ctx, "把病句“他穿着一顶帽子。”改通顺，可把“穿着”改为（ ）。", "戴着", "帽子应搭配“戴着”。", ["找搭配对象帽子。", "选择合适动词。", "改成戴着。"], "搭配不当", ["戴着", "戴"]),
      (ctx) => autoJudge(ctx, "“大约”和“一定”同时使用，会造成语义矛盾。", "对", "大约表示不确定，一定表示确定，不能同时用。", ["找矛盾词。", "理解语气。", "判断正确。"], "前后矛盾")
    ],
    "c4-rhetoric-punctuation": [
      (ctx) => autoChoice(ctx, "句子“浪花跳着舞跑向岸边。”使用了什么修辞？", "拟人", ["比喻", "反问", "排比"], "把浪花写成人会跳舞、会跑，是拟人。", ["找人的动作。", "看对象。", "判断修辞。"], "拟人识别"),
      (ctx) => autoChoice(ctx, "句子“这难道不是一次难忘的旅行吗？”属于哪种句式？", "反问句", ["陈述句", "祈使句", "感叹词"], "“难道……吗”常构成反问语气。", ["看难道。", "看句末吗。", "判断反问。"], "反问句"),
      (ctx) => autoJudge(ctx, "冒号和引号常用于提示人物说的话。", "对", "写人物语言时常见“某某说：‘……’”。", ["找提示语。", "加冒号。", "引用内容加引号。"], "标点作用"),
      (ctx) => autoChoice(ctx, "下面哪一句更像比喻句？", "湖面像一面镜子。", ["我好像听见了声音。", "这里像学校。", "他像昨天一样认真。"], "湖面和镜子有相似点，是打比方。", ["找本体。", "找喻体。", "看相似点。"], "比喻辨析"),
      (ctx) => autoText(ctx, "句子“太美了（ ）”句末最合适的标点是什么？", "！", "表达强烈感情时常用感叹号。", ["读语气。", "判断感叹。", "填写感叹号。"], "标点填空", ["！", "!"]),
      (ctx) => autoJudge(ctx, "拟人能让景物描写更生动。", "对", "把事物当作人来写，画面感更强。", ["理解拟人。", "联系表达效果。", "判断。"], "修辞效果")
    ],
    "c4-modern-reading": [
      (ctx) => autoChoice(ctx, "材料：风停了，湖面慢慢平静下来，岸边的灯影也清楚了。题目：这段主要写什么？", "风停后湖面变得平静", ["同学们比赛跑步", "老师布置作业", "商店开始营业"], "关键词是风停、湖面平静、灯影清楚。", ["读完整段。", "抓关键词。", "概括主要内容。"], "主要内容"),
      (ctx) => autoChoice(ctx, "回答“为什么”类阅读题时，最应该怎样做？", "回原文找前后句依据", ["只抄标题", "只看插图颜色", "随便猜"], "原因题要找事件前后的原因和结果。", ["读问题。", "定位相关句。", "用依据作答。"], "原因题"),
      (ctx) => autoJudge(ctx, "阅读题最好带着问题回到原文找依据。", "对", "依据来自材料，答案更准确。", ["看问题。", "回原文。", "找关键词。"], "阅读依据"),
      (ctx) => autoText(ctx, "材料：奶奶把热腾腾的汤端到桌上，还叮嘱我慢点喝。题目：奶奶叮嘱我什么？", "慢点喝", "答案可从材料最后直接找到。", ["找人物奶奶。", "找叮嘱内容。", "写慢点喝。"], "细节定位", ["慢点喝", "喝慢点"]),
      (ctx) => autoChoice(ctx, "概括自然段意思时，下面哪种做法更好？", "抓中心句和关键词", ["只看第一个标点", "只数句子个数", "只抄最后一个字"], "中心句和关键词能帮助抓住段落重点。", ["读全段。", "找中心句。", "抓关键词。"], "段意概括"),
      (ctx) => autoJudge(ctx, "人物的动作、语言有时能表现人物品质。", "对", "阅读时可以从描写中推断人物特点。", ["找动作语言。", "联系事件。", "推断品质。"], "人物品质")
    ],
    "c4-writing-topic": [
      (ctx) => autoChoice(ctx, "习作题目是“推荐一个好地方”，下面哪个材料最合适？", "介绍公园的景色、活动和推荐理由", ["默写乘法口诀", "记录一支铅笔价格", "只写今天午饭"], "推荐好地方要写清地点特点和推荐理由。", ["审题。", "找地点。", "写推荐理由。"], "习作审题"),
      (ctx) => autoChoice(ctx, "写一件难忘的事，最应该写清什么？", "事情经过和自己的感受", ["纸张大小", "铅笔品牌", "页码"], "叙事习作要写清起因、经过、结果和感受。", ["确定事件。", "写经过。", "补感受。"], "叙事材料"),
      (ctx) => autoJudge(ctx, "习作选材要围绕题目要求。", "对", "偏离题目会影响表达重点。", ["读题目。", "圈要求。", "选择相关材料。"], "选材判断"),
      (ctx) => autoText(ctx, "写观察日记时，“第一天、第二天、第三天”表示（ ）顺序。", "时间", "这些词表示先后时间。", ["读词语。", "判断先后。", "填写时间。"], "表达顺序", ["时间", "时间顺序"]),
      (ctx) => autoChoice(ctx, "推荐一个地方时，哪一句更具体？", "湖边有一排柳树，傍晚能看到金色的倒影。", ["那里很好。", "我很喜欢。", "特别棒。"], "具体描写景物和时间，画面更清楚。", ["比较句子。", "看是否具体。", "选择有画面的一句。"], "具体表达"),
      (ctx) => autoJudge(ctx, "修改习作时，可以检查是否把事情写清楚。", "对", "修改要看内容、顺序和语句是否清楚。", ["读一遍。", "查顺序。", "改不通顺处。"], "习作修改")
    ],
    "c4-poem-classic": [
      (ctx) => autoChoice(ctx, "理解古诗文时，下面哪种方法最合适？", "结合注释和关键词", ["只背页码", "只看字体", "只数标点"], "注释和关键词能帮助理解诗意。", ["读诗句。", "看注释。", "抓关键词。"], "古诗文方法"),
      (ctx) => autoChoice(ctx, "“不识庐山真面目，只缘身在此山中”启发我们什么？", "看问题有时要换个角度", ["山里没有树", "只要跑得快", "所有山都一样"], "诗句说明身在其中时可能看不全面。", ["理解不识真面目。", "联系身在山中。", "概括道理。"], "诗句哲理"),
      (ctx) => autoJudge(ctx, "读古诗可以抓景物词想象画面。", "对", "景物词能帮助理解诗中画面和情感。", ["找景物。", "想画面。", "体会情感。"], "古诗画面"),
      (ctx) => autoText(ctx, "补充诗句：一道残阳铺水中，半江瑟瑟半江（ ）。", "红", "原句是“半江瑟瑟半江红”。", ["读前句。", "回忆诗句。", "填红。"], "诗句填空", ["红"]),
      (ctx) => autoChoice(ctx, "理解文言词语时，最应该借助什么？", "注释和上下文", ["题号颜色", "页边花纹", "字数多少"], "文言词义常要结合注释和语境。", ["看注释。", "读上下文。", "确定意思。"], "文言词义"),
      (ctx) => autoJudge(ctx, "只会背诗题，不等于理解诗句意思。", "对", "理解还要知道关键词、画面和情感。", ["背诵题目。", "解释诗句。", "比较差别。"], "古诗理解")
    ],
    "c4-info-reading": [
      (ctx) => autoChoice(ctx, "材料：通知：周五下午三点，全班同学在操场集合。题目：集合地点在哪里？", "操场", ["教室", "图书馆", "食堂"], "通知中直接写着在操场集合。", ["读通知。", "找地点。", "选择操场。"], "资料提取"),
      (ctx) => autoChoice(ctx, "从表格中找信息时，最应该先看什么？", "行列标题", ["纸张厚度", "字体颜色", "页码大小"], "行列标题说明数据的含义。", ["看表头。", "定位行列。", "读取数据。"], "表格阅读"),
      (ctx) => autoJudge(ctx, "资料提取题要根据材料回答，不能凭空添加。", "对", "答案应有材料依据。", ["读问题。", "定位材料。", "按材料作答。"], "资料依据"),
      (ctx) => autoText(ctx, "材料：开放时间 9:00-16:30。题目：最早几点可以进入？", "9:00", "开放时间起点是 9:00。", ["找到开放时间。", "看前一个时间。", "写 9:00。"], "信息定位", ["9:00", "9点"]),
      (ctx) => autoChoice(ctx, "如果题目问“谁负责报名”，应在材料中找什么信息？", "负责人或联系人", ["天气", "价格", "颜色"], "报名负责人通常出现在联系人或负责人栏。", ["读问题。", "找关键词负责。", "定位联系人。"], "关键词定位"),
      (ctx) => autoJudge(ctx, "阅读说明类材料时，标题也可能提供重要信息。", "对", "标题能提示材料主题。", ["先看标题。", "再读正文。", "整合信息。"], "标题作用")
    ],
    "c4-usage": [
      (ctx) => autoChoice(ctx, "班级要通知同学参加读书分享会，通知中必须写清哪一项？", "时间、地点和事情", ["人物外貌", "身高体重", "声母韵母"], "通知要让别人知道什么时候、在哪里、做什么。", ["确定事项。", "写清时间地点。", "语言简洁。"], "通知写作"),
      (ctx) => autoChoice(ctx, "劝同学节约用水，下面哪句话更得体？", "请随手关紧水龙头，我们一起节约用水吧。", ["你太浪费了，别再来了。", "水龙头颜色真好看。", "今天作业很多。"], "劝说要有礼貌，并提出具体做法。", ["明确目的。", "语气礼貌。", "提出行动。"], "口语交际"),
      (ctx) => autoJudge(ctx, "口语交际既要表达清楚，也要注意礼貌。", "对", "得体表达能让交流更顺利。", ["听清情境。", "说清观点。", "注意语气。"], "得体表达"),
      (ctx) => autoText(ctx, "写建议书时，开头一般要说明提出建议的（ ）。", "原因", "建议书要先说明问题或原因，再提出建议。", ["说明问题。", "提出原因。", "给出建议。"], "建议书", ["原因", "理由"]),
      (ctx) => autoChoice(ctx, "参加小组讨论时，别人发言后更合适的做法是？", "认真听，再补充自己的想法", ["马上打断", "不听就走", "只看窗外"], "讨论要尊重别人，也要表达自己的观点。", ["认真听。", "记录要点。", "礼貌补充。"], "讨论规则"),
      (ctx) => autoJudge(ctx, "应用文要看对象和目的，选择合适语气。", "对", "对象不同，表达方式也要得体。", ["看写给谁。", "看要做什么。", "调整语气。"], "语用判断")
    ]
  };

  const englishWords = ["classroom", "schoolbag", "window", "teacher", "friend", "kitchen", "dinner", "weather", "clothes", "shopping", "library", "playground"];
  const englishMeanings = {
    classroom: "教室",
    schoolbag: "书包",
    window: "窗户",
    teacher: "老师",
    friend: "朋友",
    kitchen: "厨房",
    dinner: "正餐",
    weather: "天气",
    clothes: "衣服",
    shopping: "购物",
    library: "图书馆",
    playground: "操场"
  };
  function englishWord(ctx) {
    return englishWords[(ctx.pageIndex + ctx.templateIndex) % englishWords.length];
  }

  const ENGLISH_TEMPLATES = {
    "e4-vocabulary-home-school": [
      (ctx) => {
        const word = englishWord(ctx);
        return autoChoice(ctx, `Read and choose. Which word means ${englishMeanings[word]}?`, word, englishWords.filter((item) => item !== word).slice(0, 3), `${word} means ${englishMeanings[word]}.`, ["Read the Chinese meaning.", "Find the matching English word.", `Choose ${word}.`], "四年级英语词汇");
      },
      (ctx) => autoChoice(ctx, "Choose the classroom thing.", "blackboard", ["fork", "uncle", "rainy"], "blackboard is in a classroom.", ["Read the options.", "Find the classroom object.", "Choose blackboard."], "教室词汇"),
      (ctx) => autoText(ctx, "Complete the word: schoo_bag. Please write the missing letter.", "l", "schoolbag is spelled s-c-h-o-o-l-b-a-g.", ["Look at the word.", "Recall schoolbag.", "The missing letter is l."], "单词拼写", ["l", "L"]),
      (ctx) => autoJudge(ctx, "The word kitchen means 厨房。", "对", "kitchen 的意思是厨房。", ["Read kitchen.", "Match the Chinese meaning.", "The statement is correct."], "词义判断"),
      (ctx) => autoChoice(ctx, "Which word is about weather?", "sunny", ["desk", "rice", "uncle"], "sunny describes weather.", ["Read each word.", "Find weather word.", "Choose sunny."], "天气词"),
      (ctx) => autoText(ctx, "Write the English word for 教室.", "classroom", "classroom means 教室.", ["Read the Chinese word.", "Recall the English word.", "Write classroom."], "词汇拼写", ["classroom", "class room"])
    ],
    "e4-phonics-silent-e": [
      (ctx) => autoChoice(ctx, "Which word has the long a sound with silent e?", "cake", ["cat", "bag", "map"], "cake has a-e, so a says its long sound.", ["Read the words.", "Look for a-e.", "Choose cake."], "开音节 a-e"),
      (ctx) => autoChoice(ctx, "Which word has the /er/ sound?", "teacher", ["cat", "bike", "nose"], "teacher ends with er sound.", ["Say each word.", "Listen for er.", "Choose teacher."], "r 控制音"),
      (ctx) => autoText(ctx, "Complete: m_ke. Which letter is missing to make mike?", "i", "mike is m-i-k-e.", ["Look at m_ke.", "Recall mike.", "Write i."], "silent e 拼写", ["i", "I"]),
      (ctx) => autoJudge(ctx, "The final e in cake is usually silent.", "对", "cake 中末尾 e 不单独发音，并让 a 发长音。", ["Read cake.", "Notice final e.", "Judge the sound."], "silent e 判断"),
      (ctx) => autoChoice(ctx, "Which pair has the same long i sound?", "bike and like", ["cat and cake", "dog and duck", "pen and pencil"], "bike and like both have i-e.", ["Read each pair.", "Find i-e.", "Choose bike and like."], "长元音辨析"),
      (ctx) => autoChoice(ctx, "Which word starts with /w/?", "window", ["teacher", "rice", "library"], "window starts with w.", ["Say the words.", "Listen to the first sound.", "Choose window."], "首音判断")
    ],
    "e4-pattern-location-time": [
      (ctx) => autoChoice(ctx, "You want to ask the time. What should you say?", "What time is it?", ["Where is my bag?", "How much is it?", "What colour is it?"], "To ask about time, we say What time is it?", ["Find the situation.", "Match time question.", "Choose What time is it."], "时间问答"),
      (ctx) => autoText(ctx, "Complete: ___ is the library?", "Where", "The question is Where is the library?", ["Ask about place.", "Use Where.", "Complete the sentence."], "地点问句", ["Where", "where"]),
      (ctx) => autoChoice(ctx, "Someone asks: Where is the teacher's office? Which answer is best?", "It's on the first floor.", ["It's 7 o'clock.", "It's windy.", "It's ten yuan."], "Where asks about place.", ["Read the question word.", "Find place answer.", "Choose first floor."], "地点回答"),
      (ctx) => autoJudge(ctx, "What time is it? asks about time.", "对", "What time 用来询问时间。", ["Read the question.", "Find time.", "Judge correct."], "句型判断"),
      (ctx) => autoChoice(ctx, "Choose the best reply: Is this your schoolbag?", "Yes, it is.", ["It's rainy.", "It's six.", "They are carrots."], "Is this ...? can be answered Yes, it is.", ["Read the question.", "Find yes/no reply.", "Choose it."], "一般疑问句应答"),
      (ctx) => autoText(ctx, "Complete: It's 7 ___.", "o'clock", "We say It's 7 o'clock.", ["Read the time.", "Use o'clock.", "Complete."], "整点表达", ["o'clock", "oclock"])
    ],
    "e4-grammar-plural-pronoun": [
      (ctx) => autoChoice(ctx, "Choose and complete: These ___ my books.", "are", ["is", "am", "be"], "These is plural, so use are.", ["Find These.", "Use plural be verb.", "Choose are."], "复数 be 动词"),
      (ctx) => autoChoice(ctx, "Choose the plural noun.", "windows", ["window", "teacher", "rice"], "windows means more than one window.", ["Read each noun.", "Find plural -s.", "Choose windows."], "名词复数"),
      (ctx) => autoJudge(ctx, "We say they are, not they is.", "对", "they 后面用 are。", ["Find subject they.", "Recall be verb.", "Statement is correct."], "代词判断"),
      (ctx) => autoText(ctx, "Complete: This is ___ classroom.", "my", "my means 我的 and can be used before classroom.", ["Read the sentence.", "Need possessive word.", "Write my."], "物主代词", ["my"]),
      (ctx) => autoChoice(ctx, "Which sentence is correct?", "They are friends.", ["They is friends.", "They am friends.", "They be friends."], "They goes with are.", ["Check subject They.", "Use are.", "Choose correct sentence."], "正确句子"),
      (ctx) => autoChoice(ctx, "Choose the opposite of big.", "small", ["long", "teacher", "dinner"], "small is the opposite of big.", ["Read big.", "Think opposite.", "Choose small."], "形容词辨析")
    ],
    "e4-reading-notice": [
      (ctx) => autoChoice(ctx, "Read the notice. Art Club: Friday, 4:10 p.m., Room 302. Where is Art Club?", "In Room 302.", ["On Friday.", "At 7:30 a.m.", "In the kitchen."], "The notice says Art Club is in Room 302.", ["Read Where.", "Find the place.", "Choose Room 302."], "通知信息定位"),
      (ctx) => autoChoice(ctx, "Read: It is rainy today. Take your umbrella. What is the weather like?", "Rainy.", ["Sunny.", "Hot.", "Snowy."], "The sentence says rainy.", ["Find weather word.", "Match the option.", "Choose Rainy."], "天气阅读"),
      (ctx) => autoJudge(ctx, "In 'The library is on the second floor', the place is the library.", "对", "The sentence talks about the library.", ["Read the sentence.", "Find place word.", "Judge meaning."], "阅读判断"),
      (ctx) => autoText(ctx, "Read: Class starts at 8:00. What time does class start?", "8:00", "The sentence says starts at 8:00.", ["Read the sentence.", "Find the time.", "Write 8:00."], "时间信息", ["8:00", "8 o'clock"]),
      (ctx) => autoChoice(ctx, "Read: I have rice and fish for dinner. What food is mentioned?", "rice and fish", ["shirt and shoes", "desk and chair", "wind and rain"], "The sentence names rice and fish.", ["Find food words.", "Match option.", "Choose rice and fish."], "食物信息"),
      (ctx) => autoChoice(ctx, "Read: The coat is 80 yuan. How much is the coat?", "80 yuan.", ["8 o'clock.", "Room 80.", "80 students."], "How much asks the price.", ["Find price.", "Match question.", "Choose 80 yuan."], "购物阅读")
    ]
  };

  [
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
  ].forEach((pointId, index) => {
    const bases = ["e4-vocabulary-home-school", "e4-pattern-location-time", "e4-grammar-plural-pronoun", "e4-phonics-silent-e", "e4-reading-notice"];
    ENGLISH_TEMPLATES[pointId] = ENGLISH_TEMPLATES[bases[index % bases.length]];
  });

  function addDocxSeeds() {
    const sourceId = "g4-math-midterm-docx";
    const docSource = (pointId, id, item) => add(pointId, [{
      ...item,
      id,
      sourceMeta: source(sourceId, null, "四上期中检测卷 DOCX 文本层可抽取，按原卷题型结构改写。", "text-extracted")
    }]);
    docSource("g4-large", "ref-g4-docx-large-001", {
      answerType: "text",
      text: "3L = ? mL。",
      answer: "3000",
      acceptedAnswers: ["3000"],
      explanation: "1L = 1000mL，所以 3L = 3000mL。",
      steps: ["记住进率。", "3 × 1000。", "得到 3000。"],
      templateType: "容量单位换算"
    });
    docSource("g4-mul-div", "ref-g4-docx-muldiv-001", {
      answerType: "text",
      text: "900 ÷ 45 = ?",
      answer: "20",
      acceptedAnswers: ["20"],
      explanation: "45 × 20 = 900，所以 900 ÷ 45 = 20。",
      steps: ["想 45 的倍数。", "45 × 20 = 900。", "写商 20。"],
      templateType: "除数两位数"
    });
    docSource("g4-thinking", "ref-g4-docx-thinking-001", {
      answerType: "choice",
      prompt: "要使 43□ 既是 3 的倍数又是 5 的倍数，□ 里应填什么？",
      correct: "5",
      wrongs: ["0", "3", "9"],
      explanation: "5 的倍数个位是 0 或 5；435 各位数字和是 12，是 3 的倍数。",
      steps: ["先看 5 的倍数个位。", "再看 3 的倍数数字和。", "选择 5。"],
      questionType: "倍数特征"
    });
    docSource("g4-statistics", "ref-g4-docx-stat-001", {
      answerType: "choice",
      prompt: "条形统计图每格表示 10 人，柱子高 7 格，表示多少人？",
      correct: "70 人",
      wrongs: ["17 人", "7 人", "10 人"],
      explanation: "每格 10 人，7 格就是 70 人。",
      steps: ["看每格数量。", "数格数。", "相乘求总数。"],
      questionType: "条形统计图"
    });
    docSource("g4-large", "ref-g4-docx-large-002", {
      answerType: "choice",
      prompt: "6000mL = ? L。",
      correct: "6",
      wrongs: ["60", "600", "6000"],
      explanation: "1000mL = 1L，6000mL = 6L。",
      steps: ["记住 1000mL 是 1L。", "6000 除以 1000。", "得到 6。"],
      questionType: "容量单位换算"
    });
    docSource("g4-thinking", "ref-g4-docx-thinking-002", {
      answerType: "text",
      text: "60 的因数中，既是偶数又是质数的数是多少？",
      answer: "2",
      acceptedAnswers: ["2"],
      explanation: "偶数中唯一的质数是 2，2 也是 60 的因数。",
      steps: ["列出质数条件。", "找偶数质数。", "判断 2 是 60 的因数。"],
      templateType: "因数与质数"
    });
    docSource("g4-vertical", "ref-g4-docx-vertical-001", {
      answerType: "choice",
      prompt: "□43 ÷ 63，如果商是一位数，□ 中最大能填几？",
      correct: "5",
      wrongs: ["6", "7", "9"],
      explanation: "商是一位数说明被除数小于 63 × 10 = 630，□43 小于 630 时 □ 最大是 5。",
      steps: ["看除数 63。", "一位商表示被除数小于 630。", "□43 最大可为 543。"],
      questionType: "除法试商"
    });
    docSource("g4-word", "ref-g4-docx-word-001", {
      answerType: "text",
      text: "一盒牛奶 250mL，4 盒一共多少 mL？",
      answer: "1000",
      acceptedAnswers: ["1000", "1000mL"],
      explanation: "250 × 4 = 1000。",
      steps: ["找到每盒容量。", "乘盒数 4。", "写出总容量。"],
      templateType: "容量应用题"
    });
    docSource("g4-mixed", "ref-g4-docx-mixed-001", {
      answerType: "text",
      text: "32 与 25 的乘积是多少？",
      answer: "800",
      acceptedAnswers: ["800"],
      explanation: "32 × 25 = 32 × 100 ÷ 4 = 800。",
      steps: ["把 25 看成 100 ÷ 4。", "32 × 100 = 3200。", "3200 ÷ 4 = 800。"],
      templateType: "简便计算"
    });
    docSource("g4-reading", "ref-g4-docx-reading-001", {
      answerType: "choice",
      prompt: "一桶矿泉水 13（ ），一盒牛奶 250（ ）。括号里应填什么单位？",
      correct: "L，mL",
      wrongs: ["mL，L", "米，厘米", "千克，克"],
      explanation: "桶装水容量较大用 L，盒装牛奶较小常用 mL。",
      steps: ["判断物品大小。", "大容量用 L。", "小容量用 mL。"],
      questionType: "单位量感"
    });
  }

  function addOlympiadPageImageSeeds() {
    const sourceId = "g4-math-olympiad-training";
    const pointCycle = ["g4-thinking", "g4-appendix", "g4-reading", "g4-word", "g4-angle-triangle"];
    [1, 2, 3, 4, 5].forEach((page, index) => {
      imageChoice(
        `ref-g4-img-math-olympiad-page-${pad(page)}`,
        pointCycle[index % pointCycle.length],
        sourceId,
        page,
        "解答分类计数、和差倍或周期类奥数题时，最适合先做什么？",
        "先分类整理条件，再选择巧算、画图、列表或方程思路",
        ["只抄最后一个数字", "不看题目条件直接猜", "把图形题都当成面积题"],
        "四年级奥数题常涉及分类计数、和差倍、周期和优化，先整理题型再动笔更稳。",
        ["圈出关键词和数量。", "判断题型并整理关系。", "计算后用原题条件检验。"],
        "奥数页截图审题",
        `小学四年级奥数培训综合训练第 ${page} 页整页截图入库。`,
        pdfCrop(sourceId, page, `assets/reference/grade4/g4-math-olympiad-page-p${pad(page)}.png`, `四年级奥数培训综合训练第 ${page} 页截图`, "整页截图，含题目或答案，供题号级派生题回查")
      );
    });
  }

  function addOlympiadDerivedSeeds() {
    const sourceId = "g4-math-olympiad-training";
    const steps = ["读题并圈出关键条件。", "按题型分类整理或列式。", "计算后核对单位和条件。"];
    const entries = [
      { n: "A1-1", p: 1, point: "g4-mixed", type: "巧算乘法", q: "计算 454 + 999×999 + 545。", a: "999000", exp: "999×999=998001，454+545=999，合起来是 999000。", accept: ["999000"] },
      { n: "A1-2", p: 1, point: "g4-mixed", type: "凑整巧算", q: "999+998+997+996+1000+1004+1003+1002+1001 的和是多少？", a: "9000", exp: "围绕 1000 配对：999+1001、998+1002、997+1003、996+1004 各为 2000，再加 1000，共 9000。", accept: ["9000"] },
      { n: "A2-1", p: 1, point: "g4-thinking", type: "线段计数", q: "一条线上有 5 个点，一共能数出多少条不同线段？", a: "10", exp: "任选两个点确定一条线段，5 个点可组成 5×4÷2=10 条线段。", accept: ["10", "10条"] },
      { n: "A2-2", p: 1, point: "g4-angle-triangle", type: "长方形计数", q: "2 行 3 列的长方形网格，一共能数出多少个长方形？", a: "18", exp: "横向选 2 条边有 3 种，纵向选 2 条边有 6 种，共 18 个。", accept: ["18", "18个"] },
      { n: "A3", p: 1, point: "g4-thinking", type: "移多补少", q: "上下两排小猫数量为 9 只和 3 只，要使两排一样多，应从多的一排移几只到少的一排？", a: "3", exp: "总数 12，只要每排 6 只，从 9 只那排移 3 只。", accept: ["3", "3只"] },
      { n: "A4-1", p: 1, point: "g4-appendix", type: "周期图形", q: "图形按“○○△□”循环排列，第 24 个图形是什么？", a: "□", exp: "周期是 4，24÷4 没有余数，对应每组第 4 个□。", accept: ["□", "正方形"] },
      { n: "A4-2", p: 1, point: "g4-appendix", type: "周期图形", q: "图形按“☆◇◇△△”循环排列，第 24 个图形是什么？", a: "△", exp: "周期是 5，24÷5 余 4，对应每组第 4 个△。", accept: ["△", "三角形"] },
      { n: "A5", p: 1, point: "g4-appendix", type: "火柴棒", q: "火柴棒数字题要求拼成减法等式，动手前最应该先判断什么？", a: "哪些数字或符号能用最少火柴组成", exp: "先观察数字和符号的火柴数量，再寻找能成立的减法结构。", accept: ["哪些数字或符号能用最少火柴组成", "数字和符号的火柴数量", "火柴数量"] },
      { n: "A6", p: 2, point: "g4-word", type: "盈亏问题", q: "学生参加植树，每组 12 人多 11 人，每组 14 人少 9 人。可以分成几组？共有多少人？", a: "10组，131人", exp: "设组数为 x，则 12x+11=14x-9，x=10，总人数 131。", accept: ["10组，131人", "10,131", "10组131人"] },
      { n: "AII1", p: 2, point: "g4-reading", type: "逆推还原", q: "卖鸡蛋三次：每次卖出剩下的一半又 2 个，第三次后还剩 2 个。原来有多少个鸡蛋？", a: "44", exp: "倒推：(2+2)×2=8，(8+2)×2=20，(20+2)×2=44。", accept: ["44", "44个"] },
      { n: "AII2", p: 2, point: "g4-appendix", type: "购物组合", q: "橡皮 0.5 元、圆珠笔 1 元、签字笔 2.5 元，花 5.5 元买其中两种文具，有多少种不同选择？", a: "8", exp: "分橡皮+圆珠笔、橡皮+签字笔、圆珠笔+签字笔三类枚举，共 8 种。", accept: ["8", "8种"] },
      { n: "AII3", p: 2, point: "g4-thinking", type: "四种书推理", q: "四种书共 27 本且数量互不相同，数学和英语共 12 本，语文和英语共 13 本，有一种书正好 7 本。是哪一种书？", a: "英语书", exp: "设数学为 M，则英语 12-M、语文 M+1、历史 14-M。只有英语为 7 时四种数量互不相同。", accept: ["英语书", "英语"] },
      { n: "AII4", p: 2, point: "g4-vertical", type: "字母竖式", q: "字母竖式满足 ABCD+EFG=2007，DCBA+GFE=9387，A+B+C+D+E+F+G 等于多少？", a: "36", exp: "逐位推理可得 A=1、B=3、C=4、D=8、E=6、F=5、G=9，和为 36。", accept: ["36"] },
      { n: "AII5", p: 2, point: "g4-thinking", type: "移多补少", q: "芳芳给明明 4 张邮票后，芳芳还比明明多 2 张。芳芳原来比明明多几张？", a: "10", exp: "给出 4 张会让差减少 8 张，后来还多 2 张，原来多 10 张。", accept: ["10", "10张"] },
      { n: "AII6", p: 3, point: "g4-reading", type: "错看数位", q: "加法题中把个位 6 看作 9，把十位 3 看作 5，错误和是 86。正确和是多少？", a: "63", exp: "个位多 3，十位多 20，错误和比正确和多 23，所以正确和 86-23=63。", accept: ["63"] },
      { n: "B1", p: 3, point: "g4-mixed", type: "添符号", q: "在 1 到 9 之间添“+、-”，使结果为 100。给出一种成立的式子。", a: "123-45-67+89", exp: "123-45-67+89=100。", accept: ["123-45-67+89", "123－45－67＋89"] },
      { n: "B2", p: 3, point: "g4-word", type: "植树问题", q: "一条 1020 米小路两侧从头到尾每隔 15 米栽一棵桃树，一共需要多少棵？", a: "138", exp: "每侧 1020÷15=68 个间隔，两端都栽是 69 棵，两侧共 138 棵。", accept: ["138", "138棵"] },
      { n: "B3", p: 3, point: "g4-area", type: "正方形面积", q: "外圈最大正方形边长 8 厘米，图中正方形逐次连接中点形成。最中间小正方形面积可用什么思路求？", a: "面积逐次减半", exp: "连接正方形各边中点得到的新正方形面积是原来的一半，可逐层计算。", accept: ["面积逐次减半", "逐次减半"] },
      { n: "B4", p: 3, point: "g4-statistics", type: "容斥计数", q: "50 人参赛，第一题错 18 人，第二题错 21 人，两题都做对 17 人。两题都错的有几人？", a: "6", exp: "第一题对 32 人，第二题对 29 人，至少一题对 32+29-17=44 人，两题都错 50-44=6 人。", accept: ["6", "6人"] },
      { n: "B5", p: 3, point: "g4-mixed", type: "偶数求和", q: "2、4、6、8、……、98 这 49 个偶数的和是多少？", a: "2450", exp: "首尾平均数是 50，共 49 个，和为 50×49=2450。", accept: ["2450"] },
      { n: "B6", p: 3, point: "g4-appendix", type: "页码数字", q: "一本书有 200 页，数字 1 在所有页码中一共出现多少次？", a: "140", exp: "1-99 中出现 20 次，100-199 中出现 120 次，200 中没有，共 140 次。", accept: ["140", "140次"] },
      { n: "B7", p: 3, point: "g4-thinking", type: "数组规律", q: "数组为 (1,1,1)、(2,4,8)、(3,9,27)…，第 12 组三个数的和比第 6 组大多少？", a: "1626", exp: "第 n 组是 n、n²、n³。第 12 组和 1884，第 6 组和 258，差 1626。", accept: ["1626"] },
      { n: "B8", p: 3, point: "g4-statistics", type: "平均数", q: "把 2000 个数的平均数再混入原来的 2000 个数，新的平均数为 2001。原来的平均数是多少？", a: "2001", exp: "一组数加入它本身的平均数，整体平均数不变，所以原平均数也是 2001。", accept: ["2001"] },
      { n: "B9", p: 3, point: "g4-thinking", type: "年龄问题", q: "小明、妈妈、爸爸年龄和 87 岁，妈妈年龄比小明 3 倍大 4 岁，爸爸比妈妈大 2 岁。小明几岁？", a: "11", exp: "设小明 x 岁，妈妈 3x+4，爸爸 3x+6，合计 7x+10=87，x=11。", accept: ["11", "11岁"] },
      { n: "B10", p: 3, point: "g4-appendix", type: "猴子分桃", q: "7 只猴子分 90 个桃，其中一只分到 3 个，其余 6 只数量不同且一个比一个多 1，最多的分到多少个？", a: "17", exp: "其余 6 只为连续数，和为 87；6a+15=87，a=12，最多 17。", accept: ["17", "17个"] },
      { n: "C1", p: 4, point: "g4-area", type: "剪正方形", q: "把 10 厘米×9 厘米长方形剪成边长为整数厘米的小正方形，最少能剪成多少个？", a: "10", exp: "先剪 1 个 9×9 正方形，剩下 1×9 长条剪成 9 个 1×1 正方形，共 10 个。", accept: ["10", "10个"] },
      { n: "C2", p: 4, point: "g4-mixed", type: "奇数和", q: "1+3+5+……+2005 的和是多少？", a: "1006009", exp: "2005 是第 1003 个奇数，前 1003 个奇数和是 1003²=1006009。", accept: ["1006009"] },
      { n: "D1", p: 4, point: "g4-word", type: "和倍问题", q: "甲乙两个冷藏库共有肉 92 吨，乙库存肉比甲库的 3 倍少 4 吨。甲库有多少吨？", a: "24", exp: "设甲 x 吨，乙 3x-4，4x-4=92，x=24。", accept: ["24", "24吨"] },
      { n: "D2", p: 4, point: "g4-word", type: "存款倍数", q: "甲乙原来存款相等，后来甲取 50 元、乙存 40 元，结果乙是甲的 2 倍。原来各有多少元？", a: "140", exp: "设原来各有 x 元，x+40=2(x-50)，解得 x=140。", accept: ["140", "140元"] },
      { n: "E1", p: 4, point: "g4-appendix", type: "抢三十", q: "抢三十游戏每次至少报 1 个数、最多报 4 个数，谁先报到 30 谁赢。稳定取胜的关键策略是什么？", a: "每轮凑成5个数", exp: "因为 30 是 5 的倍数，后手每轮补足到 5 的倍数可控制 30。", accept: ["每轮凑成5个数", "凑5", "凑成5的倍数"] },
      { n: "E2", p: 4, point: "g4-thinking", type: "动物腿翅推理", q: "蜘蛛、蜻蜓、蝉共 18 只，共 118 条腿和 20 对翅。蜘蛛有多少只？", a: "5", exp: "若都按 6 条腿算有 108 条，多出的 10 条来自蜘蛛每只多 2 条，所以蜘蛛 5 只。", accept: ["5", "5只"] },
      { n: "E3", p: 4, point: "g4-reading", type: "龟兔赛跑", q: "龟兔赛跑中兔速是龟速 5 倍，兔醒来时龟领先 5000 米，到终点兔还落后 100 米。兔子睡觉期间乌龟跑了多少米？", a: "8020", exp: "设兔睡时已跑 x 米，追赶阶段 9900-x=5(5000-x)，得 x=3775；睡觉期间龟跑 5000+4x/5=8020 米。", accept: ["8020", "8020米"] }
    ];

    entries.forEach((item) => {
      const answer = String(item.a);
      add(item.point, [{
        id: `ref-g4-olympiad-${String(item.n).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        answerType: "text",
        text: item.q,
        answer,
        acceptedAnswers: (item.accept || [answer]).map(String),
        explanation: item.exp,
        steps,
        templateType: item.type,
        sourceMeta: source(sourceId, item.p, `小学四年级奥数培训综合训练及答案第 ${item.p} 页第 ${item.n} 题改写。`, "manual-rewrite")
      }]);
    });
  }

  function addGeneratedFromScanIndex() {
    (scanIndex.pages || []).forEach((pageRecord, pageIndex) => {
      const pointId = pageRecord.pointHint;
      const templates = MATH_TEMPLATES[pointId] || CHINESE_TEMPLATES[pointId] || ENGLISH_TEMPLATES[pointId] || CHINESE_TEMPLATES["c4-modern-reading"];
      const items = templates.slice(0, 6).map((factory, templateIndex) => {
        const ctx = {
          pageRecord,
          pageIndex,
          templateIndex,
          id: `ref-g4-auto-${pageRecord.sourceId}-p${pad(pageRecord.page)}-q${templateIndex + 1}`
        };
        return factory(ctx);
      }).filter(Boolean);
      if (items.length) add(pointId, items);
    });
  }

  addImageSeeds();
  addOlympiadPageImageSeeds();
  addOlympiadDerivedSeeds();
  addDocxSeeds();
  addGeneratedFromScanIndex();

  window.MathCampGrade4ReferenceQuestionSeeds = {
    BANK
  };
})();
