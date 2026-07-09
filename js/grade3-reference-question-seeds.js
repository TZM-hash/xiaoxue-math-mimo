(function () {
  "use strict";

  const sourceMeta = window.MathCampGrade3ReferenceSourceMeta || { byId: {} };
  const scanIndex = window.MathCampGrade3ReferenceScanIndex || { pages: [] };
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
      "ref-g3-img-math-mixed-001",
      "g3-word-two-step",
      "g3-math-mixed-word",
      2,
      "看参考页截图中的应用题版式，做两步应用题时最适合先做什么？",
      "先找问题，再确定第一步要求的中间量",
      ["先把所有数字相乘", "只看题目第一行", "把单位全部省略"],
      "两步应用题最容易错在没有看清最后问什么，先找问题再找中间量更稳。",
      ["读最后问题。", "圈出有用条件。", "先求缺少的中间量。"],
      "扫描页题型阅读",
      "从混合运算应用题扫描页裁图，题目按可辨题型结构改写。",
      pdfCrop("g3-math-mixed-word", 2, "assets/reference/grade3/g3-math-mixed-word-p002.png", "三上数学混合运算应用题截图", "三年级数学混合运算应用题参考页截图")
    );
    imageText(
      "ref-g3-img-math-perimeter-001",
      "g3-perimeter",
      "g3-math-peiyou-100",
      18,
      "看参考页中的图形题版式改写：一个长方形长 9 cm、宽 4 cm，周长是多少厘米？",
      "26",
      "长方形周长 = (长 + 宽) × 2，(9 + 4) × 2 = 26。",
      ["先把长和宽相加。", "再乘 2。", "写出周长。"],
      "长方形周长截图题",
      "从培优扫描页裁图，保留图形题来源，题面重新改写为清晰数据。",
      null
    );
    imageText(
      "ref-g3-img-math-grid-001",
      "g3-statistics",
      "g3-math-special-training",
      11,
      "参考截图来自专题卷。改写题：表格中一班有 28 人，二班有 31 人，两个班一共有多少人？",
      "59",
      "读表后把两个班人数相加，28 + 31 = 59。",
      ["定位一班人数。", "定位二班人数。", "相加求合计。"],
      "统计表截图题",
      "从数学专题卷扫描页裁图，按统计读表题型改写。",
      null
    );
    imageChoice(
      "ref-g3-img-cn-poem-001",
      "c3-poem",
      "g3-chinese-key-knowledge",
      1,
      "参考截图列出三年级古诗积累。理解古诗画面时，最合适的方法是哪一项？",
      "抓关键词并想象画面",
      ["只背作者名字", "只数诗句字数", "只看页码"],
      "古诗理解要抓景物、动作、颜色等关键词，再联系画面。",
      ["读诗句。", "圈关键词。", "想象画面和情感。"],
      "古诗积累截图题",
      "从语文知识点 PDF 第 1 页裁图，按古诗理解能力改写。",
      pdfCrop("g3-chinese-key-knowledge", 1, "assets/reference/grade3/g3-chinese-key-poem-p001.png", "三年级语文古诗知识点截图", "三年级语文古诗积累参考截图")
    );
    imageChoice(
      "ref-g3-img-cn-reading-001",
      "c3-paragraph-reading",
      "g3-chinese-sunshine-paper",
      12,
      "参考截图来自语文试卷阅读题。做段落阅读时，概括段意最应该抓什么？",
      "中心句和反复出现的关键词",
      ["纸张颜色", "页码大小", "题号字体"],
      "段意概括要回到段落内容，抓中心句、关键词和主要事件。",
      ["读完整段。", "找中心句或关键词。", "用简洁话概括。"],
      "阅读题截图改写",
      "从语文试卷扫描页裁图，按段落阅读题型改写。",
      pdfCrop("g3-chinese-sunshine-paper", 12, "assets/reference/grade3/g3-chinese-sunshine-reading-p012.png", "三年级语文阅读题截图", "语文试卷段落阅读参考截图")
    );
    imageChoice(
      "ref-g3-img-en-ready-001",
      "e3-vocabulary-school",
      "g3-english-ready",
      6,
      "Look at the reference page style. Which word means 书包?",
      "schoolbag",
      ["mouth", "yellow", "duck"],
      "schoolbag means 书包.",
      ["Read the Chinese meaning.", "Match it with the English word.", "Choose schoolbag."],
      "英语词汇截图题",
      "从三年级英语入门扫描页裁图，按词汇匹配题型改写。",
      pdfCrop("g3-english-ready", 6, "assets/reference/grade3/g3-english-ready-vocab-p006.png", "三年级英语词汇题截图", "三年级英语入门资料词汇参考截图")
    );
    imageChoice(
      "ref-g3-img-en-copybook-001",
      "e3-phonics-short-vowels",
      "g3-english-wcx-copybook",
      4,
      "The reference page practises letters. Which letter has the /b/ sound at the beginning?",
      "B",
      ["A", "C", "D"],
      "The letter B usually begins with the /b/ sound.",
      ["Say the letter.", "Listen to the first sound.", "Choose B."],
      "英语字母截图题",
      "从英语活页默写扫描页裁图，按字母和发音题型改写。",
      pdfCrop("g3-english-wcx-copybook", 4, "assets/reference/grade3/g3-english-copybook-letters-p004.png", "三年级英语字母默写截图", "三年级英语活页默写字母参考截图")
    );
    imageText(
      "ref-g3-img-en-copybook-002",
      "e3-pattern-greetings",
      "g3-english-wcx-copybook",
      22,
      "Complete the greeting: Hello, I ___ Mike.",
      "am",
      "The sentence is Hello, I am Mike.",
      ["Read the subject I.", "Use am after I.", "Complete the sentence."],
      "英语句型截图题",
      "从英语活页默写扫描页裁图，按三上问候句型改写。",
      pdfCrop("g3-english-wcx-copybook", 22, "assets/reference/grade3/g3-english-copybook-words-p022.png", "三年级英语句型默写截图", "三年级英语活页默写句型参考截图")
    );
    imageChoice(
      "ref-g3-img-math-olympiad-001",
      "g3-thinking",
      "g3-math-olympiad-training",
      2,
      "参考截图来自三年级奥数火柴棒题。遇到“移动一根火柴棒使等式成立”这类题，最适合先做什么？",
      "先观察等式两边和可改变的数字形状",
      ["直接把所有火柴都拿走", "只看题号", "先写作文"],
      "火柴棒题要先看等式是否平衡，再判断移动一根后哪些数字或符号会改变。",
      ["观察原等式。", "找可移动的一根。", "验证移动后等式是否成立。"],
      "奥数火柴棒截图题",
      "从三年级奥数综合训练第 2 页裁图，按火柴棒思维题型改写。",
      pdfCrop("g3-math-olympiad-training", 2, "assets/reference/grade3/g3-math-olympiad-matchstick-p002.png", "三年级奥数火柴棒题截图", "三年级奥数综合训练火柴棒参考截图")
    );
  }

  function pad(value, size = 3) {
    return String(value).padStart(size, "0");
  }

  function value(ctx, salt, min, max) {
    const spread = Math.max(1, max - min + 1);
    const raw = ctx.pageRecord.page * 37 + ctx.pageIndex * 17 + ctx.templateIndex * 11 + salt * 13;
    return min + (raw % spread);
  }

  function tablePair(ctx, saltA = 1, saltB = 2) {
    return [value(ctx, saltA, 2, 9), value(ctx, saltB, 2, 9)];
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

  function rectangleScene(ctx) {
    const length = value(ctx, 3, 6, 12);
    const width = value(ctx, 4, 3, 7);
    return {
      length,
      width,
      diagram: { type: "rectangle", length, width, unit: "cm", caption: "自绘长方形图" }
    };
  }

  function squareScene(ctx) {
    const side = value(ctx, 5, 4, 9);
    return {
      side,
      diagram: { type: "square", side, unit: "cm", caption: "自绘正方形图" }
    };
  }

  function gridScene(ctx) {
    const rows = value(ctx, 6, 3, 5);
    const cols = value(ctx, 7, 4, 7);
    const cells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if ((x + y + ctx.pageIndex + ctx.templateIndex) % 3 !== 0) cells.push({ x, y });
      }
    }
    return { count: cells.length, rows, cols, diagram: { type: "grid-shape", rows, cols, cells, unit: "cm", caption: "自绘数格子图" } };
  }

  function segmentScene(ctx) {
    const length = value(ctx, 8, 12, 28);
    const width = value(ctx, 9, 5, 16);
    return { length, width, diagram: { type: "segment-chain", length, width, caption: "自绘线段图" } };
  }

  function blockScene(ctx) {
    const columns = [value(ctx, 10, 1, 4), value(ctx, 11, 1, 4), value(ctx, 12, 1, 4), value(ctx, 13, 1, 4)];
    return { columns, answer: Math.max(...columns), diagram: { type: "block-view", columns, caption: "自绘观察物体图" } };
  }

  function shapeScene(ctx) {
    const circles = value(ctx, 14, 2, 6);
    const squares = value(ctx, 15, 2, 6);
    const triangles = value(ctx, 16, 1, 5);
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
        caption: "自绘图形统计图"
      }
    };
  }

  function positionScene(ctx) {
    const left = value(ctx, 17, 2, 7);
    const right = value(ctx, 18, 2, 7);
    return { left, right, diagram: { type: "position-row", left, right, caption: "自绘排队示意图" } };
  }

  const MATH_TEMPLATES = {
    "g3-multi-add": [
      (ctx) => {
        const a = value(ctx, 21, 246, 698);
        const b = value(ctx, 22, 128, 386);
        return autoText(ctx, `计算 ${a} + ${b} = ?`, a + b, "三位数加法要相同数位对齐，从个位算起。", ["个位相加，满十进 1。", "十位和百位继续相加。", `结果是 ${a + b}。`], "万以内加法");
      },
      (ctx) => {
        const b = value(ctx, 23, 128, 399);
        const a = b + value(ctx, 24, 210, 430);
        return autoText(ctx, `计算 ${a} - ${b} = ?`, a - b, "三位数减法不够减时要退位。", ["从个位算起。", "需要时向前一位退 1。", `结果是 ${a - b}。`], "万以内减法");
      },
      (ctx) => autoChoice(ctx, "估算 498 + 203 时，下面哪个结果最合理？", "约 700", ["约 300", "约 1000", "约 50"], "498 接近 500，203 接近 200，合起来约 700。", ["把数看成整百。", "500 + 200 = 700。", "选择约 700。"], "加法估算"),
      (ctx) => autoJudge(ctx, "三位数加减法验算时，可以用相反运算检查。", "对", "加法可用减法验算，减法可用加法验算。", ["看原运算。", "选择相反运算。", "核对原数。"], "验算方法"),
      (ctx) => {
        const scene = segmentScene(ctx);
        return autoText(ctx, `看线段图，第一段 ${scene.length} 米，第二段 ${scene.width} 米，两段一共多少米？`, scene.length + scene.width, "总长度等于两段长度相加。", ["读出两段长度。", "用加法合起来。", "写出单位米。"], "线段加法读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "计算 604 - 287 时，个位 4 不够减 7，第一步应该怎样处理？", "向十位退 1", ["直接写 3", "把 287 改成 872", "先算 6 - 2"], "个位不够减时要退位。", ["先看个位。", "4 不够减 7。", "向十位退 1。"], "退位规则")
    ],
    "g3-vertical": [
      (ctx) => {
        const a = value(ctx, 25, 123, 378);
        const b = value(ctx, 26, 3, 8);
        return autoText(ctx, `用竖式思路算 ${a} × ${b} = ?`, a * b, "多位数乘一位数从个位乘起，满几十向前一位进几。", ["个位先乘。", "十位、百位依次乘。", "加上进位。"], "多位乘一位竖式");
      },
      (ctx) => {
        const divisor = value(ctx, 27, 3, 9);
        const quotient = value(ctx, 28, 42, 96);
        return autoText(ctx, `用竖式思路算 ${divisor * quotient} ÷ ${divisor} = ?`, quotient, "除法竖式要按从高位到低位的顺序试商。", ["先看最高位够不够除。", "逐位试商。", "商是每一步合起来的结果。"], "一位数除法竖式");
      },
      (ctx) => autoChoice(ctx, "列竖式计算 326 + 78 时，78 的 8 应该和 326 的哪个数字对齐？", "6", ["3", "2", "326"], "8 是个位，要和个位 6 对齐。", ["认清 8 是个位。", "找 326 的个位。", "个位对个位。"], "竖式数位对齐"),
      (ctx) => autoJudge(ctx, "乘法竖式中，每一位乘得的结果满十也要进位。", "对", "多位乘一位数同样要处理进位。", ["逐位相乘。", "看是否满十。", "把进位加到下一位。"], "乘法竖式进位"),
      (ctx) => {
        const scene = blockScene(ctx);
        return autoText(ctx, "看小方块图，从正面看最高一列有几层？", scene.answer, "从正面按列比较层数，最高列就是答案。", ["逐列数层数。", "比较大小。", "找最高列。"], "竖式页图形读数", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "除法竖式算完后，哪种检查方式最合适？", "商 × 除数 + 余数", ["商 + 除数", "余数 × 余数", "只看题号"], "有余数除法可用商乘除数再加余数验算。", ["写出商。", "乘除数。", "再加余数核对被除数。"], "除法验算")
    ],
    "g3-mul-div": [
      (ctx) => {
        const a = value(ctx, 29, 24, 86);
        const b = value(ctx, 30, 3, 8);
        return autoText(ctx, `${a} × ${b} = ?`, a * b, "两位数乘一位数可以拆成几十和几分别乘。", ["拆成整十和个位。", "分别乘一位数。", "把结果相加。"], "多位数乘一位数");
      },
      (ctx) => {
        const divisor = value(ctx, 31, 3, 9);
        const quotient = value(ctx, 32, 12, 31);
        return autoText(ctx, `${divisor * quotient} ÷ ${divisor} = ?`, quotient, "除法和乘法互为逆运算。", ["想乘法口诀或倍数。", "找商。", "检查商乘除数。"], "一位数除法");
      },
      (ctx) => autoChoice(ctx, "每盒彩笔 12 支，买 4 盒，一共有多少支？正确算式是？", "12 × 4", ["12 + 4", "12 ÷ 4", "12 - 4"], "每盒数量相同，求 4 盒总数用乘法。", ["找每份数量 12。", "找份数 4。", "用乘法。"], "乘法应用"),
      (ctx) => autoJudge(ctx, "求 84 个苹果平均分给 4 个小组，每组多少个，可以用除法。", "对", "平均分就是除法语境。", ["找总数。", "找平均分成几份。", "列除法。"], "除法意义"),
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看图形统计图，圆形和三角形一共有多少个？", scene.circles + scene.triangles, "按种类数清楚后相加。", ["数圆形。", "数三角形。", "相加。"], "图形乘除页读图", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "口算 60 × 4 时，可以先想什么？", "6 × 4 = 24，再添一个 0", ["60 + 4", "4 - 6", "只看个位 0"], "60 是 6 个十，6 × 4 = 24 个十，即 240。", ["把 60 看成 6 个十。", "算 6 × 4。", "结果添 0。"], "整十数乘法")
    ],
    "g3-two-step": [
      (ctx) => {
        const each = value(ctx, 33, 6, 14);
        const groups = value(ctx, 34, 3, 7);
        const add = value(ctx, 35, 8, 29);
        return autoText(ctx, `每组做 ${each} 朵花，${groups} 组共做一些，又添上 ${add} 朵。一共有多少朵？`, each * groups + add, "先求几组共做多少，再加添上的数量。", ["先乘。", "再加。", "回答一共。"], "乘加两步应用");
      },
      (ctx) => {
        const total = value(ctx, 36, 80, 160);
        const out = value(ctx, 37, 18, 39);
        const boxes = value(ctx, 38, 2, 6);
        return autoChoice(ctx, `仓库有 ${total} 个苹果，先运走 ${out} 个，剩下平均装进 ${boxes} 个筐。求每筐几个，正确算式是？`, `(${total} - ${out}) ÷ ${boxes}`, [`${total} - ${out} ÷ ${boxes}`, `${total} + ${out} × ${boxes}`, `${total} ÷ ${boxes} + ${out}`], "先求剩下多少，再平均分。", ["先做括号里的减法。", "再用除法平均分。", "选择带括号的算式。"], "减除两步应用");
      },
      (ctx) => autoJudge(ctx, "两步题可以先求中间量，再回答最后的问题。", "对", "三年级两步题常先求总数、剩余或每份数。", ["看最后问题。", "找缺少的中间量。", "再算第二步。"], "两步题策略"),
      (ctx) => {
        const scene = rectangleScene(ctx);
        return autoText(ctx, `一个长方形花坛长 ${scene.length} 米，宽 ${scene.width} 米。先求长和宽的和是多少米？`, scene.length + scene.width, "这类周长两步题常先求长加宽。", ["读长和宽。", "先相加。", "周长时再乘 2。"], "周长两步第一步", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "题目说“每袋 8 个，买 5 袋，又吃掉 6 个”，求还剩多少个，第一步算什么？", "5 袋一共有多少个", ["吃掉几个袋子", "每袋多少钱", "题目有几句话"], "先求总数，再减吃掉的数量。", ["找每袋数量。", "找袋数。", "先乘。"], "乘减第一步"),
      (ctx) => {
        const a = value(ctx, 39, 24, 48);
        const b = value(ctx, 40, 3, 6);
        const c = value(ctx, 41, 5, 18);
        return autoText(ctx, `${a} ÷ ${b} + ${c} = ?`, Math.floor(a / b) + c, "先算除法，再算加法。", ["先做乘除。", "再做加减。", "写出结果。"], "两步混合计算")
      }
    ],
    "g3-remainder": [
      (ctx) => {
        const divisor = value(ctx, 42, 3, 8);
        const quotient = value(ctx, 43, 5, 12);
        const rem = value(ctx, 44, 1, divisor - 1);
        const total = divisor * quotient + rem;
        return autoText(ctx, `${total} ÷ ${divisor} = ? 余 ?（请写成“商余余数”，如 5余2）`, `${quotient}余${rem}`, `${divisor} × ${quotient} + ${rem} = ${total}，所以商 ${quotient} 余 ${rem}。`, ["先试商。", "乘回去不超过被除数。", "剩下的是余数。"], "有余数除法", [`${quotient}余${rem}`, `${quotient} 余 ${rem}`]);
      },
      (ctx) => autoChoice(ctx, "有 26 人坐船，每条船坐 4 人，至少需要几条船？", "7 条", ["6 条", "5 条", "4 条"], "26 ÷ 4 = 6 余 2，余下的人也需要一条船。", ["先除。", "看余数。", "有余数要加 1 条船。"], "至少需要"),
      (ctx) => autoJudge(ctx, "有余数除法中，余数必须比除数小。", "对", "如果余数不比除数小，说明商还可以再增加。", ["比较余数和除数。", "余数必须小于除数。", "判断正确。"], "余数规则"),
      (ctx) => {
        const left = value(ctx, 45, 3, 7);
        const right = value(ctx, 46, 3, 7);
        return autoText(ctx, `看排队图，我前面 ${left} 人，后面 ${right} 人，一共有多少人？`, left + right + 1, "排队问题不要漏掉自己。", ["前面人数。", "后面人数。", "加上自己。"], "排队读图", null, { type: "position-row", left, right, caption: "自绘排队图" });
      },
      (ctx) => autoChoice(ctx, "31 个球每盒装 5 个，最多能装满几盒？", "6 盒", ["7 盒", "5 盒", "31 盒"], "31 ÷ 5 = 6 余 1，最多装满 6 盒。", ["先除。", "看商。", "最多装满只看商。"], "最多能装"),
      (ctx) => autoJudge(ctx, "“至少需要几辆车”这类题，有余数时通常要把商加 1。", "对", "余下的人或物也需要额外一辆车。", ["理解至少。", "看是否有余数。", "有余数加 1。"], "进一法")
    ],
    "g3-perimeter": [
      (ctx) => {
        const scene = rectangleScene(ctx);
        return autoText(ctx, `看长方形图，长 ${scene.length} cm，宽 ${scene.width} cm，周长是多少厘米？`, (scene.length + scene.width) * 2, "长方形周长 = (长 + 宽) × 2。", ["长和宽相加。", "再乘 2。", "写出周长。"], "长方形周长", null, scene.diagram);
      },
      (ctx) => {
        const scene = squareScene(ctx);
        return autoText(ctx, `看正方形图，边长 ${scene.side} cm，周长是多少厘米？`, scene.side * 4, "正方形周长 = 边长 × 4。", ["找到边长。", "乘 4 条边。", "得到周长。"], "正方形周长", null, scene.diagram);
      },
      (ctx) => {
        const scene = gridScene(ctx);
        return autoText(ctx, "看数格子图，涂色小格一共有多少个？", scene.count, "逐行数涂色格，合计就是涂色小格数。", ["按行数。", "不要重复。", "合计涂色格。"], "数格子图形", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "求图形一周的长度，应该想到哪个词？", "周长", ["面积", "重量", "速度"], "围一圈的长度叫周长。", ["读题意。", "一周的长度。", "选择周长。"], "周长概念"),
      (ctx) => autoJudge(ctx, "长方形周长只要算长 + 宽，不用乘 2。", "错", "长方形有两条长和两条宽，需要乘 2。", ["想四条边。", "长和宽各有两条。", "题干漏乘 2。"], "周长易错判断"),
      (ctx) => {
        const scene = segmentScene(ctx);
        return autoText(ctx, `一根铁丝折成长方形，长边用 ${scene.length} cm，宽边用 ${scene.width} cm，至少需要多少厘米铁丝？`, (scene.length + scene.width) * 2, "铁丝长度就是长方形周长。", ["识别求周长。", "长宽相加。", "乘 2。"], "铁丝围图形", null, scene.diagram);
      }
    ],
    "g3-unit": [
      (ctx) => autoText(ctx, "1 千米 = ? 米。", "1000", "长度单位中 1 千米等于 1000 米。", ["回忆单位关系。", "千米和米进率 1000。", "填 1000。"], "千米米换算"),
      (ctx) => autoText(ctx, "1 分 = ? 秒。", "60", "时间单位中 1 分等于 60 秒。", ["回忆时间单位。", "1 分等于 60 秒。", "填 60。"], "分秒换算"),
      (ctx) => autoChoice(ctx, "称一袋大米的质量，用哪个单位更合适？", "千克", ["毫米", "秒", "厘米"], "大米质量较重，常用千克。", ["判断量的是质量。", "选择质量单位。", "千克合适。"], "质量单位选择"),
      (ctx) => {
        const scene = segmentScene(ctx);
        return autoText(ctx, `看线段图，已经走了 ${scene.length} 米，还要走 ${scene.width} 米，一共要走多少米？`, scene.length + scene.width, "总路程等于两段路程相加。", ["读两段长度。", "用加法。", "写单位米。"], "路程线段图", null, scene.diagram);
      },
      (ctx) => autoJudge(ctx, "计算经过时间时，可以用结束时间减开始时间。", "对", "结束时间 - 开始时间 = 经过时间。", ["找开始时间。", "找结束时间。", "相减。"], "经过时间公式"),
      (ctx) => {
        const start = value(ctx, 47, 8, 10);
        const minutes = value(ctx, 48, 15, 45);
        return autoText(ctx, `${start}:00 开始阅读，经过 ${minutes} 分钟结束。结束时是 ${start} 时几分？只填分钟数。`, minutes, `从整点过 ${minutes} 分钟就是 ${start}:${pad(minutes, 2)}。`, ["从整点开始。", "加经过分钟。", "分钟数不变为经过时间。"], "经过时间");
      }
    ],
    "g3-fraction-intro": [
      (ctx) => {
        const den = value(ctx, 49, 3, 9);
        return autoText(ctx, `把一个蛋糕平均分成 ${den} 份，每份是这个蛋糕的几分之一？请写成 1/${den} 的形式。`, `1/${den}`, `平均分成 ${den} 份，每份是 1/${den}。`, ["确认平均分。", "总份数作分母。", "每份是 1 份。"], "几分之一", [`1/${den}`, `${den}分之一`]);
      },
      (ctx) => autoChoice(ctx, "分数 3/8 中，分母 8 表示什么？", "平均分成 8 份", ["取了 8 个整体", "一定有 8 个蛋糕", "只表示第 8 页"], "分母表示平均分的总份数。", ["看分母。", "联系平均分。", "选择总份数。"], "分母意义"),
      (ctx) => autoJudge(ctx, "只有平均分，才能用几分之一、几分之几表示每份。", "对", "分数初步强调平均分。", ["看是否平均。", "平均分才能表示每份。", "判断正确。"], "平均分判断"),
      (ctx) => {
        const scene = gridScene(ctx);
        return autoText(ctx, `看数格子图，涂色格有 ${scene.count} 个。如果一共有 ${scene.rows * scene.cols} 个小格，涂色部分可以写成几分之几？`, `${scene.count}/${scene.rows * scene.cols}`, "涂色格数作分子，总格数作分母。", ["数涂色格。", "数总格数。", "写成分数。"], "格子分数", [`${scene.count}/${scene.rows * scene.cols}`], scene.diagram);
      },
      (ctx) => autoChoice(ctx, "同分母分数 2/7 + 3/7，分母应该怎样处理？", "分母不变", ["分母相加成 14", "分母相乘成 49", "分母去掉"], "同分母分数相加，分母不变，分子相加。", ["看分母相同。", "分母保持 7。", "分子相加。"], "同分母加法"),
      (ctx) => autoText(ctx, "同分母分数：2/9 + 4/9 = ?（写成分数）", "6/9", "同分母相加，分母不变，分子 2 + 4 = 6。", ["分母 9 不变。", "分子相加。", "结果是 6/9。"], "同分母分数加法", ["6/9", "2/3"])
    ],
    "g3-statistics": [
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看图形统计图，正方形有多少个？", scene.squares, "按图例数正方形的数量。", ["找到正方形。", "逐个数清楚。", "写出数量。"], "图形统计", null, scene.diagram);
      },
      (ctx) => {
        const a = value(ctx, 50, 18, 36);
        const b = value(ctx, 51, 20, 39);
        return autoText(ctx, `统计表中一班 ${a} 人，二班 ${b} 人，两个班一共有多少人？`, a + b, "读表后求合计，用加法。", ["找一班。", "找二班。", "相加。"], "统计表合计");
      },
      (ctx) => autoChoice(ctx, "读复式统计表时，先看清什么最重要？", "行标题和列标题", ["纸张颜色", "页码", "字体大小"], "行列标题决定每个数字表示什么。", ["先看表头。", "找到对应行列。", "再读数据。"], "读表方法"),
      (ctx) => autoJudge(ctx, "统计表中的最大数一定表示“最多”。", "对", "同一项目比较数量时，最大数对应最多。", ["确认比较项目相同。", "找最大数。", "判断最多。"], "最多最少"),
      (ctx) => {
        const scene = gridScene(ctx);
        return autoText(ctx, "看格子统计图，涂色格和空白格相差多少个？", Math.abs(scene.count - (scene.rows * scene.cols - scene.count)), "先求空白格，再比较相差。", ["数涂色格。", "求空白格。", "相减求差。"], "格子统计比较", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "要比较两个班喜欢足球的人数，最应该看统计表中的哪一项？", "足球这一列对应两个班的数据", ["表格边框", "姓名笔画", "纸张厚度"], "比较同一项目要看同一列或同一行。", ["确定项目是足球。", "找两个班数据。", "比较大小。"], "统计比较")
    ],
    "g3-word-two-step": [
      (ctx) => {
        const each = value(ctx, 52, 12, 24);
        const boxes = value(ctx, 53, 3, 6);
        const sold = value(ctx, 54, 8, 31);
        return autoText(ctx, `每箱有 ${each} 个梨，运来 ${boxes} 箱，卖出 ${sold} 个，还剩多少个？`, each * boxes - sold, "先求运来总数，再减卖出的数量。", ["先乘求总数。", "再减卖出。", "回答还剩。"], "两步应用题");
      },
      (ctx) => autoChoice(ctx, "小明有 18 张邮票，小华的张数是小明的 3 倍。两人一共有多少张？第一步应先求什么？", "小华有多少张", ["小明少几张", "邮票颜色", "题号"], "要求两人一共，小华数量未知，要先求小华。", ["看最后问题。", "找未知量。", "先求小华。"], "倍数两步应用"),
      (ctx) => autoJudge(ctx, "两步应用题中，题目出现的所有数字都一定要用上。", "错", "有时会有干扰信息，要按问题筛选条件。", ["看最后问题。", "筛有用条件。", "不是所有数字都要用。"], "干扰条件判断"),
      (ctx) => {
        const scene = rectangleScene(ctx);
        return autoText(ctx, `小花沿长 ${scene.length} 米、宽 ${scene.width} 米的长方形操场跑 1 圈，一共跑多少米？`, (scene.length + scene.width) * 2, "跑一圈就是求长方形周长。", ["识别一圈。", "套周长公式。", "计算。"], "周长应用题", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "看到“比它的 2 倍多 5”时，通常先算什么？", "它的 2 倍", ["直接加 5", "先除以 5", "只看单位"], "先求倍数部分，再加多出的数量。", ["找标准量。", "先乘 2。", "再加 5。"], "倍的关系"),
      (ctx) => {
        const a = value(ctx, 55, 24, 48);
        const b = value(ctx, 56, 3, 6);
        const c = value(ctx, 57, 5, 16);
        return autoText(ctx, `${a} 个本子平均分给 ${b} 个小组后，每组又添 ${c} 个。每组现在有多少个？`, Math.floor(a / b) + c, "先平均分，再看每组增加。", ["先除法求每组。", "每组再加。", "回答每组现在数量。"], "平均分两步");
      }
    ],
    "g3-reading": [
      (ctx) => autoChoice(ctx, "题目：书店有 120 本故事书，卖出 35 本，其中精装书有 18 本。求还剩多少本，哪个数字不用参加计算？", "18", ["120", "35", "120 和 35"], "求还剩总数只用原有和卖出数量，精装书数量是干扰信息。", ["读问题。", "找有用条件。", "排除干扰数字。"], "条件筛选"),
      (ctx) => autoChoice(ctx, "做“第一步应先算什么”的题，最应该先看哪里？", "最后要求的问题", ["题号", "插图颜色", "答案位置"], "最后问题决定需要先求哪个中间量。", ["读最后问题。", "找缺少条件。", "确定第一步。"], "读题策略"),
      (ctx) => autoJudge(ctx, "应用题读题时，单位名称能帮助判断数字表示什么。", "对", "单位能区分人数、元数、米数等。", ["圈单位。", "理解数量含义。", "再列式。"], "单位阅读"),
      (ctx) => {
        const scene = positionScene(ctx);
        return autoText(ctx, `看排队图，小明左边 ${scene.left} 人，右边 ${scene.right} 人，这队一共有多少人？`, scene.left + scene.right + 1, "排队题要加上小明自己。", ["左边。", "右边。", "加自己。"], "排队读题", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "题目问“至少需要几辆车”，出现余数时应该怎么办？", "商加 1", ["只写余数", "商减 1", "不管余数"], "剩下的人也要坐车，所以有余数要加 1。", ["先除。", "看余数。", "有余数加 1。"], "进一法阅读"),
      (ctx) => autoText(ctx, "材料：小东先读了 18 页，又读了 25 页。题目：小东一共读了多少页？", "43", "一共读的页数等于两次阅读页数相加。", ["找第一次。", "找第二次。", "相加。"], "信息提取")
    ],
    "g3-thinking": [
      (ctx) => {
        const start = value(ctx, 58, 3, 9);
        const step = value(ctx, 59, 3, 8);
        return autoText(ctx, `找规律：${start}，${start + step}，${start + step * 2}，${start + step * 3}，下一个数是多少？`, start + step * 4, `每次增加 ${step}。`, ["比较相邻数。", "发现固定增加。", "继续加一次。"], "数列规律");
      },
      (ctx) => {
        const scene = blockScene(ctx);
        return autoText(ctx, "看小方块图，最高一列比最低一列多几层？", Math.max(...scene.columns) - Math.min(...scene.columns), "比较最高列和最低列的层数。", ["数各列。", "找最大和最小。", "相减。"], "观察物体比较", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "做估算题时，下面哪种方法最常用？", "把数看成接近的整十或整百", ["把数字倒过来", "只看个位", "不看题目"], "估算常把数转成接近的整十、整百。", ["观察数大小。", "找接近整十整百。", "再粗略计算。"], "估算策略"),
      (ctx) => autoJudge(ctx, "推理题可以用列表、画图或排除法整理条件。", "对", "整理条件能减少漏读和误判。", ["读条件。", "整理成表或图。", "逐步排除。"], "推理方法"),
      (ctx) => {
        const scene = shapeScene(ctx);
        return autoText(ctx, "看图形统计图，数量最多的图形比数量最少的图形多几个？", Math.max(scene.circles, scene.squares, scene.triangles) - Math.min(scene.circles, scene.squares, scene.triangles), "先数每种图形，再用最多减最少。", ["数三类图形。", "找最多和最少。", "求差。"], "统计推理", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "甲比乙多 12 张卡片，甲给乙几张后两人一样多？", "6 张", ["12 张", "3 张", "24 张"], "给出 6 张后，甲少 6、乙多 6，差距减少 12。", ["先看差。", "给出一张差距减少 2。", "12 的一半是 6。"], "移多补少")
    ],
    "g3-appendix": [
      (ctx) => autoChoice(ctx, "红、黄、蓝、绿四种灯按顺序重复，第 14 盏是什么颜色？", "黄", ["红", "蓝", "绿"], "4 个一组，14 ÷ 4 余 2，对应黄。", ["找重复组。", "用 14 除以 4。", "余 2 是第 2 个。"], "周期规律"),
      (ctx) => autoText(ctx, "用数字 1、3、5、7 组成没有重复数字的两位数，可以组成几个？", "12", "十位 4 种选法，个位剩 3 种，共 4 × 3 = 12。", ["选十位。", "选个位。", "相乘。"], "搭配计数"),
      (ctx) => autoJudge(ctx, "集合问题中，两类都参加的人不能重复计算两次。", "对", "重叠部分要减去一次。", ["看两个集合。", "找重叠。", "避免重复。"], "集合思想"),
      (ctx) => {
        const scene = gridScene(ctx);
        return autoText(ctx, "看自绘集合格子图，涂色小格共有多少个？", scene.count, "逐行统计涂色小格。", ["按行数。", "不要重复。", "合计。"], "集合图读数", null, scene.diagram);
      },
      (ctx) => autoChoice(ctx, "三件上衣和两条裤子，每次选一件上衣和一条裤子，一共有几种搭配？", "6 种", ["5 种", "3 种", "2 种"], "3 × 2 = 6 种搭配。", ["上衣 3 种。", "裤子 2 种。", "相乘。"], "搭配问题"),
      (ctx) => autoText(ctx, "8 个小朋友互相握手，每两人握 1 次，一共握手几次？", "28", "8 × 7 ÷ 2 = 28，除以 2 是因为每次握手会被重复数。", ["每人和 7 人握手。", "总数 8 × 7。", "重复一次除以 2。"], "握手问题")
    ]
  };

  const CHINESE_TEMPLATES = {
    "c3-word-meaning": [
      (ctx) => autoChoice(ctx, "材料：他听得很认真，还把重点记在本子上。联系语境，“认真”的意思最接近哪一个？", "仔细、用心", ["速度很快", "声音很大", "颜色鲜艳"], "上下文写他听和记重点，说明态度仔细用心。", ["读词语所在句。", "联系后面的动作。", "选择仔细、用心。"], "语境词义"),
      (ctx) => autoChoice(ctx, "“五彩缤纷”常用来形容什么？", "颜色多而美", ["声音很小", "天气很冷", "速度很慢"], "五彩缤纷强调颜色丰富。", ["抓“五彩”。", "理解缤纷。", "选择颜色多而美。"], "成语理解"),
      (ctx) => autoJudge(ctx, "理解词语时，可以联系上下文判断意思。", "对", "上下文能提供词义线索。", ["读前后句。", "找语境线索。", "判断词义。"], "词义方法"),
      (ctx) => autoText(ctx, "把“安静”的反义词写出来。", "热闹", "安静表示声音少、不吵；反义词可以是热闹。", ["理解安静。", "找相反意思。", "写热闹。"], "反义词", ["热闹", "吵闹"]),
      (ctx) => autoChoice(ctx, "下面哪个词语和“观察”意思最接近？", "仔细看", ["大声读", "快快跑", "轻轻唱"], "观察就是有目的、仔细地看。", ["理解观察。", "比较选项。", "选择仔细看。"], "近义理解"),
      (ctx) => autoJudge(ctx, "遇到不懂的词语，只能查字典，不能结合句子理解。", "错", "查字典和联系上下文都可以帮助理解。", ["判断“只能”。", "联系上下文也有用。", "所以错误。"], "词义策略")
    ],
    "c3-sentence-transform": [
      (ctx) => autoChoice(ctx, "把“小明把书放进书包。”改成被字句，哪一句正确？", "书被小明放进书包。", ["小明被书放进书包。", "书包把小明放进书。", "放进书包小明书。"], "被字句要把受事“书”放到前面。", ["找谁做动作。", "找被放的对象。", "改成书被小明放进书包。"], "把字句被字句"),
      (ctx) => autoChoice(ctx, "“小鸟在树上唱歌。”扩句最合适的是哪一项？", "一只可爱的小鸟在高高的树上唱歌。", ["小鸟。", "唱歌树上小鸟。", "在树上。"], "扩句要补充信息并保持通顺。", ["保留原意。", "补充样子和地点。", "保持语序。"], "扩句"),
      (ctx) => autoJudge(ctx, "改写句子时，原句的主要意思不能随便改变。", "对", "句式可以变，意思要基本一致。", ["读原句。", "改句式。", "核对意思。"], "句式转换方法"),
      (ctx) => autoText(ctx, "把“妈妈把窗户打开了。”改成被字句，填空：窗户（ ）妈妈打开了。", "被", "被字句是“窗户被妈妈打开了”。", ["找到受事窗户。", "用被字句。", "填被。"], "被字句填空"),
      (ctx) => autoChoice(ctx, "下面哪一句是反问句？", "难道这不是最好的礼物吗？", ["这是最好的礼物。", "礼物在桌上。", "我喜欢礼物。"], "反问句常用“难道……吗”等形式。", ["看语气。", "找难道和吗。", "选择反问句。"], "反问句识别"),
      (ctx) => autoJudge(ctx, "扩句只要字数变多，句子不通顺也可以。", "错", "扩句既要具体，也要通顺。", ["判断扩句要求。", "通顺很重要。", "题干错误。"], "扩句判断")
    ],
    "c3-rhetoric": [
      (ctx) => autoChoice(ctx, "句子“弯弯的月亮像小船。”使用了什么修辞？", "比喻", ["拟人", "排比", "反问"], "把月亮比作小船，是比喻。", ["找“像”。", "看两个事物。", "判断比喻。"], "比喻识别"),
      (ctx) => autoChoice(ctx, "句子“花儿在风中点头。”使用了什么修辞？", "拟人", ["比喻", "设问", "夸张"], "把花儿写成人会点头，是拟人。", ["看花儿动作。", "点头是人的动作。", "选择拟人。"], "拟人识别"),
      (ctx) => autoJudge(ctx, "比喻句一定要有本体和喻体，不能只看有没有“像”。", "对", "有些带“像”的句子不是比喻，要看是否在打比方。", ["读句子。", "判断是否打比方。", "再选择。"], "比喻判断"),
      (ctx) => autoChoice(ctx, "下面哪一句更像比喻句？", "树叶像一只只小船飘在水面上。", ["我像昨天一样早起。", "他好像去过那里。", "这里像是教室。"], "树叶和小船在形状上打比方。", ["找两个事物。", "判断是否有相似点。", "选择树叶像小船。"], "比喻辨析"),
      (ctx) => autoJudge(ctx, "拟人能让事物显得更生动。", "对", "把事物当作人来写，画面更鲜活。", ["理解拟人。", "看表达效果。", "判断正确。"], "拟人效果"),
      (ctx) => autoChoice(ctx, "“沙沙，沙沙，秋雨在唱歌。”这句话把秋雨写得怎样？", "像人一样会唱歌", ["变成了数字", "没有声音", "正在计算"], "“唱歌”是人的动作，用来写秋雨很生动。", ["找关键词唱歌。", "判断修辞。", "理解表达效果。"], "拟人效果")
    ],
    "c3-paragraph-reading": [
      (ctx) => autoChoice(ctx, "材料：公园真美。花坛里开满鲜花，小湖边柳枝轻轻摆动，小路旁还有整齐的长椅。题目：这段主要写什么？", "公园真美", ["长椅很贵", "小路很窄", "大家在跑步"], "第一句总写公园真美，后面围绕它展开。", ["读第一句。", "看后面是否围绕它写。", "概括段意。"], "段意概括"),
      (ctx) => autoChoice(ctx, "概括自然段意思时，最应该避免什么？", "只抓一个小细节当全部意思", ["先读完整段", "找中心句", "抓关键词"], "概括段意要看整体，不能只看一个细节。", ["读完整段。", "分清整体和细节。", "避免以偏概全。"], "概括方法"),
      (ctx) => autoJudge(ctx, "中心句常常能帮助概括自然段的主要意思。", "对", "中心句直接提示段落围绕什么写。", ["找中心句。", "看细节是否围绕它。", "概括段意。"], "中心句判断"),
      (ctx) => autoText(ctx, "材料：小鹿把水让给口渴的小伙伴。题目：小鹿做了什么？", "把水让给小伙伴", "答案可从材料直接定位。", ["回到材料。", "找小鹿动作。", "写出做了什么。"], "细节定位", ["把水让给小伙伴", "把水让给口渴的小伙伴"]),
      (ctx) => autoChoice(ctx, "读段落时，反复出现的关键词通常说明什么？", "段落重点", ["页码", "错别字", "标点数量"], "关键词反复出现，往往和主要内容有关。", ["找重复词。", "联系内容。", "判断重点。"], "关键词"),
      (ctx) => autoJudge(ctx, "阅读题最好回到原文找依据。", "对", "根据材料作答更准确。", ["读问题。", "回原文定位。", "按材料选择。"], "阅读依据")
    ],
    "c3-writing-piece": [
      (ctx) => autoChoice(ctx, "围绕“操场真热闹”写几句话，下面哪个材料最合适？", "同学们跳绳、跑步、踢球", ["厨房里煮面条", "小猫在窗台睡觉", "铅笔盒很旧"], "跳绳、跑步、踢球都能表现操场热闹。", ["看中心意思。", "判断材料是否相关。", "选择操场活动。"], "围绕中心选材"),
      (ctx) => autoChoice(ctx, "写观察记录时，下面哪一项最重要？", "按时间写清变化", ["只写很好看", "不写观察对象", "只写标点"], "观察记录要写清观察对象和变化过程。", ["确定观察对象。", "按时间记录。", "写具体变化。"], "观察记录"),
      (ctx) => autoJudge(ctx, "习作片段里的几句话应该围绕同一个意思写。", "对", "围绕中心写，片段才集中。", ["确定中心。", "选择相关细节。", "句子服务中心。"], "围绕中心"),
      (ctx) => autoText(ctx, "围绕“花园真香”写句子，可以补充：一阵风吹来，我闻到了（ ）的花香。", "淡淡", "“淡淡的花香”表达自然通顺。", ["读中心。", "填修饰花香的词。", "保持句子通顺。"], "补充句子", ["淡淡", "浓浓", "清新"]),
      (ctx) => autoChoice(ctx, "写活动片段时，哪个顺序更清楚？", "先写准备，再写过程，最后写感受", ["先写结尾，再写题目", "只写一个词", "不写人物"], "按事情发展顺序写更清楚。", ["看活动过程。", "按先后安排。", "最后写感受。"], "写作顺序"),
      (ctx) => autoJudge(ctx, "写片段时，动作写具体，读者更容易看懂画面。", "对", "动作细节能让画面更清楚。", ["抓人物动作。", "写具体。", "表达更清楚。"], "动作描写")
    ],
    "c3-poem": [
      (ctx) => autoChoice(ctx, "理解古诗画面时，下面哪种方法最合适？", "抓关键词想象画面", ["只背作者名字", "只看页码", "只数标点"], "关键词能帮助想象诗句描写的景物。", ["读诗句。", "圈景物词。", "想象画面。"], "古诗画面"),
      (ctx) => autoChoice(ctx, "“停车坐爱枫林晚，霜叶红于二月花”主要写到什么景物？", "枫林和霜叶", ["大海和船", "小狗和猫", "书包和铅笔"], "诗句中有枫林、霜叶等景物。", ["读诗句。", "找景物词。", "选择枫林和霜叶。"], "诗句景物"),
      (ctx) => autoJudge(ctx, "理解古诗可以结合注释、关键词和生活经验。", "对", "这些方法能帮助理解诗意。", ["看注释。", "抓关键词。", "联系经验。"], "古诗方法"),
      (ctx) => autoChoice(ctx, "诗句“荷尽已无擎雨盖”中的“荷”指什么？", "荷花", ["松树", "梅花", "竹子"], "“荷”在诗句中指荷花。", ["读诗句。", "联系景物。", "选择荷花。"], "古诗词语"),
      (ctx) => autoJudge(ctx, "只会背诗题，就等于理解了整首诗。", "错", "理解还要知道诗句大意和画面。", ["判断是否只背题。", "理解要看内容。", "题干错误。"], "古诗理解判断"),
      (ctx) => autoChoice(ctx, "读描写秋天的诗句时，最可能抓住哪类词？", "枫叶、秋风、霜", ["游泳、冰棒、荷花", "铅笔、尺子、橡皮", "电视、沙发、门"], "枫叶、秋风、霜常与秋天有关。", ["看季节。", "找景物词。", "选择秋天词。"], "季节意象")
    ],
    "c3-accumulation": [
      (ctx) => autoChoice(ctx, "“人心齐，泰山移”主要说明什么？", "团结力量大", ["天气很热", "书很重", "颜色很多"], "这句谚语强调大家同心协力的力量。", ["读谚语。", "理解人心齐。", "选择团结力量大。"], "谚语理解"),
      (ctx) => autoChoice(ctx, "下面哪个成语含有反义词？", "大惊小怪", ["摇头晃脑", "提心吊胆", "春暖花开"], "“大”和“小”意思相反。", ["看成语中的字。", "找相反意思。", "选择大惊小怪。"], "成语分类"),
      (ctx) => autoJudge(ctx, "积累成语时，知道意思比只会背更有用。", "对", "会理解才能在语境中使用。", ["读成语。", "理解意思。", "联系句子运用。"], "成语方法"),
      (ctx) => autoText(ctx, "补充谚语：一个篱笆三个桩，一个好汉三个（ ）。", "帮", "原句是“一个好汉三个帮”。", ["读前半句。", "回忆谚语。", "填帮。"], "谚语填空", ["帮"]),
      (ctx) => autoChoice(ctx, "“摇头晃脑”含有人体哪个部位？", "头、脑", ["手、脚", "眼、耳", "心、口"], "词语中直接出现头和脑。", ["读词语。", "找人体部位。", "选择头、脑。"], "词语积累"),
      (ctx) => autoJudge(ctx, "日积月累里的名言谚语可以帮助写作表达。", "对", "恰当引用能让表达更有说服力。", ["理解名言。", "联系主题。", "恰当使用。"], "积累运用")
    ],
    "c3-practice": [
      (ctx) => autoChoice(ctx, "介绍一次植物观察活动，最应该说清哪几项？", "时间、观察对象、发现和感受", ["铅笔价格、天气预报、页码", "电视节目、鞋子颜色、门牌", "只写一个好字"], "综合实践表达要把关键信息说清楚。", ["说明时间。", "说明观察对象和发现。", "补充感受。"], "实践表达"),
      (ctx) => autoJudge(ctx, "做观察记录时，可以用表格整理日期和变化。", "对", "表格能清楚记录变化过程。", ["列日期。", "写变化。", "比较前后。"], "观察记录方法"),
      (ctx) => autoChoice(ctx, "小组交流时，别人发言后最合适的做法是？", "认真听，再补充自己的想法", ["立刻打断", "不听就走", "只看窗外"], "交流要尊重别人，也要表达清楚自己的看法。", ["认真听。", "想补充点。", "有礼貌表达。"], "口语交际"),
      (ctx) => autoText(ctx, "观察豆芽变化，可以用“第一天、第三天、第五天”这样的词表示（ ）。", "时间顺序", "这些词表示观察发生的先后时间。", ["看词语。", "判断先后。", "写时间顺序。"], "表达顺序", ["时间顺序", "先后顺序"]),
      (ctx) => autoChoice(ctx, "整理资料时，哪种信息最应该保留？", "和主题有关的发现", ["无关的笑话", "纸张颜色", "页码花纹"], "资料整理要围绕主题筛选。", ["确定主题。", "判断是否有关。", "保留关键发现。"], "资料筛选"),
      (ctx) => autoJudge(ctx, "综合实践表达也要做到有顺序、说清楚。", "对", "有顺序表达，别人更容易听懂。", ["整理信息。", "按顺序说。", "表达清楚。"], "实践表达判断")
    ]
  };

  const textbookAliases = {
    "c3-textbook-context-word": "c3-word-meaning",
    "c3-textbook-sentence-transform": "c3-sentence-transform",
    "c3-textbook-rhetoric-basic": "c3-rhetoric",
    "c3-textbook-paragraph-main": "c3-paragraph-reading",
    "c3-textbook-reading-detail": "c3-paragraph-reading",
    "c3-textbook-poem-image": "c3-poem",
    "c3-textbook-idiom-meaning": "c3-accumulation",
    "c3-textbook-observation-record": "c3-practice",
    "c3-textbook-around-one-idea": "c3-writing-piece",
    "c3-textbook-practical-expression": "c3-practice"
  };
  Object.entries(textbookAliases).forEach(([pointId, base]) => {
    CHINESE_TEMPLATES[pointId] = CHINESE_TEMPLATES[base];
  });

  const englishWords = ["hello", "red", "face", "cat", "bread", "one", "teacher", "father", "tall", "desk", "apple", "eleven"];
  const englishMeanings = {
    hello: "你好",
    red: "红色",
    face: "脸",
    cat: "猫",
    bread: "面包",
    one: "一",
    teacher: "老师",
    father: "爸爸",
    tall: "高的",
    desk: "书桌",
    apple: "苹果",
    eleven: "十一"
  };
  function englishWord(ctx) {
    return englishWords[(ctx.pageIndex + ctx.templateIndex) % englishWords.length];
  }

  const ENGLISH_TEMPLATES = {
    "e3-vocabulary-school": [
      (ctx) => {
        const word = englishWord(ctx);
        return autoChoice(ctx, `Read and choose. Which word means ${englishMeanings[word]}?`, word, englishWords.filter((item) => item !== word).slice(0, 3), `${word} means ${englishMeanings[word]}.`, ["Read the Chinese meaning.", "Find the matching English word.", `Choose ${word}.`], "三年级英语词汇");
      },
      (ctx) => autoChoice(ctx, "Which word is a colour?", "red", ["cat", "desk", "father"], "red is a colour word.", ["Read each word.", "Find the colour.", "Choose red."], "颜色词"),
      (ctx) => autoText(ctx, "Complete the word: h_llo. Please write the missing letter.", "e", "hello is spelled h-e-l-l-o.", ["Look at the word.", "Recall hello.", "The missing letter is e."], "单词拼写", ["e", "E"]),
      (ctx) => autoJudge(ctx, "The word cat means 猫。", "对", "cat 的意思是猫。", ["Read cat.", "Match the Chinese meaning.", "The statement is correct."], "词义判断"),
      (ctx) => autoChoice(ctx, "Choose the school thing.", "pencil", ["duck", "milk", "nose"], "pencil is a school thing.", ["Read the options.", "Find the school object.", "Choose pencil."], "同类词"),
      (ctx) => autoText(ctx, "Write the English word for 书包.", "schoolbag", "schoolbag means 书包.", ["Read the Chinese word.", "Recall the English word.", "Write schoolbag."], "词汇拼写", ["schoolbag", "bag"])
    ],
    "e3-phonics-short-vowels": [
      (ctx) => autoChoice(ctx, "Which word has the short a sound like apple?", "cat", ["cake", "bike", "nose"], "cat has the short a sound.", ["Say apple.", "Read the options.", "Choose cat."], "short a"),
      (ctx) => autoChoice(ctx, "Which letter comes after B?", "C", ["A", "D", "E"], "The alphabet order is A, B, C.", ["Say A B C.", "Find the next letter.", "Choose C."], "字母顺序"),
      (ctx) => autoText(ctx, "Complete the alphabet: A, B, __.", "C", "A, B, C are the first three letters.", ["Read the sequence.", "Recall alphabet order.", "Write C."], "字母填空", ["C", "c"]),
      (ctx) => autoJudge(ctx, "The letter M can start the word milk.", "对", "milk starts with m.", ["Read milk.", "Listen to the first sound.", "The statement is correct."], "首字母判断"),
      (ctx) => autoChoice(ctx, "Which word starts with /d/?", "dog", ["cat", "apple", "face"], "dog starts with d.", ["Say each word.", "Listen to the first sound.", "Choose dog."], "首音判断"),
      (ctx) => autoChoice(ctx, "Which pair is uppercase and lowercase of the same letter?", "Aa", ["Ab", "Bc", "Cd"], "A and a are the same letter in uppercase and lowercase.", ["Compare letters.", "Find same letter pair.", "Choose Aa."], "大小写配对")
    ],
    "e3-pattern-greetings": [
      (ctx) => autoChoice(ctx, "You meet your teacher in the morning. What can you say?", "Good morning!", ["Good night!", "I am a cat.", "It is red."], "Good morning is a greeting.", ["Read the situation.", "Choose a greeting.", "Say Good morning."], "问候语"),
      (ctx) => autoText(ctx, "Complete: Hello, I ___ Amy.", "am", "We say I am Amy.", ["Find the subject I.", "Use am.", "Complete the sentence."], "I am 句型", ["am"]),
      (ctx) => autoChoice(ctx, "Someone asks: What's your name? Which answer is best?", "My name is Mike.", ["It is yellow.", "I see a duck.", "Show me red."], "The question asks for a name.", ["Read the question.", "Find name answer.", "Choose My name is Mike."], "姓名问答"),
      (ctx) => autoJudge(ctx, "Hello can be used to greet someone.", "对", "Hello 是常用问候语。", ["Read hello.", "Think of greeting.", "Correct."], "问候判断"),
      (ctx) => autoChoice(ctx, "Choose the polite reply to Nice to meet you.", "Nice to meet you, too.", ["I am a ruler.", "It is blue.", "Open your book."], "Nice to meet you, too is a polite reply.", ["Read the greeting.", "Find matching reply.", "Choose it."], "礼貌应答"),
      (ctx) => autoText(ctx, "Complete: What ___ your name?", "is", "The sentence is What is your name?", ["Read the pattern.", "Use is.", "Complete the question."], "问句填空", ["is"])
    ],
    "e3-grammar-basic-be": [
      (ctx) => autoChoice(ctx, "Choose and complete: I ___ Sarah.", "am", ["is", "are", "be"], "We use am after I.", ["Find I.", "Use am.", "Choose am."], "be 动词"),
      (ctx) => autoChoice(ctx, "Choose and complete: It ___ a duck.", "is", ["am", "are", "be"], "We use is after it.", ["Find It.", "Use is.", "Choose is."], "It is"),
      (ctx) => autoJudge(ctx, "We say I am, not I is.", "对", "I 后面用 am。", ["Find subject I.", "Recall be verb.", "Statement is correct."], "be 判断"),
      (ctx) => autoText(ctx, "Complete: This ___ my face.", "is", "This is my face.", ["Read This.", "Use is.", "Complete the sentence."], "This is", ["is"]),
      (ctx) => autoChoice(ctx, "Which sentence is correct?", "I am Mike.", ["I is Mike.", "I are Mike.", "I be Mike."], "I goes with am.", ["Check subject I.", "Check be verb.", "Choose I am Mike."], "正确句子"),
      (ctx) => autoChoice(ctx, "Choose the plural be verb.", "are", ["am", "is", "a"], "are is used for plural subjects like they.", ["Recall be verbs.", "Find plural form.", "Choose are."], "be 动词辨析")
    ],
    "e3-reading-dialogue": [
      (ctx) => autoChoice(ctx, "Read: Amy: Hello, I'm Amy. Mike: Hi, I'm Mike. Who is the girl?", "Amy", ["Mike", "John", "Zoom"], "The girl says I'm Amy.", ["Read the dialogue.", "Find the girl's name.", "Choose Amy."], "短对话信息"),
      (ctx) => autoChoice(ctx, "Read: I see red and blue. What colours do I see?", "red and blue", ["cat and dog", "one and two", "milk and bread"], "The sentence names red and blue.", ["Find colour words.", "Match the option.", "Choose red and blue."], "颜色定位"),
      (ctx) => autoJudge(ctx, "In 'I have a pencil', pencil is a school object.", "对", "pencil 是学习用品。", ["Read the sentence.", "Find pencil.", "Judge the meaning."], "阅读判断"),
      (ctx) => autoText(ctx, "Read: I am ten years old. How old am I? Write the number.", "10", "ten means 10.", ["Read the sentence.", "Find ten.", "Write 10."], "年龄信息", ["10", "ten"]),
      (ctx) => autoChoice(ctx, "Read: This is my nose. Which body part is mentioned?", "nose", ["desk", "apple", "duck"], "The sentence says nose.", ["Read the sentence.", "Find body word.", "Choose nose."], "阅读定位"),
      (ctx) => autoChoice(ctx, "Read: The cat is black. What animal is it?", "cat", ["dog", "pig", "bear"], "The animal in the sentence is cat.", ["Find animal word.", "Match option.", "Choose cat."], "动物信息")
    ]
  };

  [
    "e3-unit-1-1",
    "e3-unit-1-2",
    "e3-unit-1-3",
    "e3-unit-1-4",
    "e3-unit-1-5",
    "e3-unit-1-6",
    "e3-unit-2-1",
    "e3-unit-2-2",
    "e3-unit-2-3",
    "e3-unit-2-4",
    "e3-unit-2-5",
    "e3-unit-2-6"
  ].forEach((pointId, index) => {
    const bases = ["e3-vocabulary-school", "e3-pattern-greetings", "e3-grammar-basic-be", "e3-phonics-short-vowels", "e3-reading-dialogue"];
    ENGLISH_TEMPLATES[pointId] = ENGLISH_TEMPLATES[bases[index % bases.length]];
  });

  function addOlympiadPageImageSeeds() {
    const sourceId = "g3-math-olympiad-training";
    const pointCycle = ["g3-thinking", "g3-appendix", "g3-reading", "g3-word-two-step"];
    [1, 2, 3, 4].forEach((page, index) => {
      imageChoice(
        `ref-g3-img-math-olympiad-page-${pad(page)}`,
        pointCycle[index % pointCycle.length],
        sourceId,
        page,
        `参考截图来自三年级奥数综合训练第 ${page} 页。做这一页的奥数题时，最适合先做什么？`,
        "先整理数量关系，再选择倒推、列表、画图或列式",
        ["直接猜一个答案", "只看图片颜色", "把所有数字都相乘"],
        "三年级奥数综合题常混合文字和图形信息，先把关系整理清楚再计算更稳。",
        ["读题并圈出关键条件。", "选择合适的整理方法。", "代回题意检查。"],
        "奥数页截图审题",
        `小学三年级奥数综合训练第 ${page} 页整页截图入库。`,
        pdfCrop(sourceId, page, `assets/reference/grade3/g3-math-olympiad-page-p${pad(page)}.png`, `三年级奥数综合训练第 ${page} 页截图`, "整页截图，供奥数题号级派生题回查")
      );
    });
  }

  function addOlympiadDerivedSeeds() {
    const sourceId = "g3-math-olympiad-training";
    const steps = ["读清题目条件。", "选用倒推、列表、画图或列式整理。", "计算后代回原题检查。"];
    const entries = [
      { n: 1, p: 1, point: "g3-thinking", type: "逆推还原", q: "幼儿园买来一些苹果，昨天吃了一半，今天又吃了剩下的一半，还剩 18 个。一共买来多少个苹果？", a: "72", exp: "今天吃前有 18 × 2 = 36 个，昨天吃前有 36 × 2 = 72 个。", accept: ["72", "72个"] },
      { n: 2, p: 1, point: "g3-appendix", type: "连续数巧算", q: "131+132+133+134+135 可以写成几乘几？结果是多少？", a: "133×5=665", exp: "5 个连续数的平均数是中间数 133，和是 133 × 5 = 665。", accept: ["133×5=665", "665"] },
      { n: 3, p: 1, point: "g3-thinking", type: "三视图", q: "根据上面看、正面看、侧面看的图形判断立体图形时，最适合先确定什么？", a: "每个位置的最高层数", exp: "三视图题要先把俯视位置确定，再用正面和侧面高度限制每列层数。", accept: ["每个位置的最高层数", "最高层数", "位置和高度"] },
      { n: 4, p: 1, point: "g3-word-two-step", type: "水果代换", q: "天平显示 3 个苹果等于 1 个梨加 1 个苹果，梨重 200 克；菠萝等于 6 个苹果。菠萝重多少克？", a: "600", exp: "3 个苹果 = 梨 + 1 个苹果，所以梨 = 2 个苹果。梨 200 克，则苹果 100 克，菠萝 6 个苹果是 600 克。", accept: ["600", "600克"] },
      { n: 5, p: 1, point: "g3-thinking", type: "动物代换", q: "1 头大象 + 5 头牛 = 10 吨，2 头大象 + 5 头牛 = 15 吨，1 头大象 + 1 条鲸鱼 = 12 吨。鲸鱼多少吨？", a: "7", exp: "两式相减得大象 5 吨；代回得牛 1 吨；鲸鱼是 12 - 5 = 7 吨。", accept: ["7", "7吨"] },
      { n: 6, p: 1, point: "g3-reading", type: "统筹优化", q: "烧开水 13 分钟、洗红领巾 5 分钟、整理房间 10 分钟，这些事可并行安排。至少需要多少分钟完成？", a: "13", exp: "洗红领巾和整理房间都可以安排在烧水的 13 分钟内完成。", accept: ["13", "13分钟"] },
      { n: 7, p: 1, point: "g3-word-two-step", type: "爬楼梯", q: "楼梯题中“每两层之间有 15 级台阶”，从 1 楼到 6 楼要走几个楼层间隔？", a: "5", exp: "从 1 楼到 6 楼经过 1-2、2-3、3-4、4-5、5-6，共 5 个间隔。", accept: ["5", "5个"] },
      { n: 8, p: 2, point: "g3-appendix", type: "火柴棒", q: "火柴棒题要求移动一根使 5×135=405 成立，第一步最应该观察什么？", a: "哪些数字移动一根后会变形", exp: "火柴棒数字题要先找能通过一根火柴改变的数字或符号，再验证等式。", accept: ["哪些数字移动一根后会变形", "可变数字", "数字形状"] },
      { n: 9, p: 2, point: "g3-appendix", type: "最大乘积", q: "用 1、3、5、7 组成“□□□×□”，要使积最大，三位数和一位数应怎样搭配？", a: "531×7", exp: "一位数放最大的 7，剩下 5、3、1 组成尽量大的三位数 531。", accept: ["531×7", "531*7"] },
      { n: 10, p: 2, point: "g3-vertical", type: "竖式谜", q: "竖式谜题中，看到乘积末尾是 25，乘数是 5，最适合先看哪一位？", a: "个位", exp: "乘法竖式从个位突破最稳，末尾 25 能帮助判断被乘数个位。", accept: ["个位"] },
      { n: 11, p: 2, point: "g3-word-two-step", type: "蜗牛爬树", q: "蜗牛爬 15 米树，白天上爬 4 米，夜间下滑 3 米。第几天能到树顶？", a: "12", exp: "前 11 天每天净上升 1 米，到第 12 天白天从 11 米爬到 15 米。", accept: ["12", "第12天", "12天"] },
      { n: 12, p: 2, point: "g3-perimeter", type: "拼长方形周长", q: "两张长 10 厘米、宽 5 厘米的长方形纸拼成一个周长最小的新长方形，周长是多少厘米？", a: "40", exp: "沿长边拼成 10×10 的正方形，周长最小，为 10 × 4 = 40 厘米。", accept: ["40", "40厘米"] },
      { n: 13, p: 3, point: "g3-reading", type: "买三赠一", q: "书店 72 元一套，买三本赠一本。做平均价格题时，应先求什么？", a: "实际得到的本数", exp: "优惠题要先看实际付钱的数量和实际得到的数量，再求平均每本价格。", accept: ["实际得到的本数", "得到的本数"] },
      { n: 14, p: 3, point: "g3-thinking", type: "年龄倍数", q: "小明今年 5 岁，奶奶今年 65 岁。今年奶奶年龄是小明的多少倍？明年呢？", a: "13倍，11倍", exp: "今年 65 ÷ 5 = 13；明年 66 ÷ 6 = 11。", accept: ["13倍，11倍", "13,11", "13倍 11倍"] },
      { n: 15, p: 3, point: "g3-word-two-step", type: "植树问题", q: "一条 343 米的公路边每隔 7 米架设一根电线杆，两端都架，一共要多少根？", a: "50", exp: "343 ÷ 7 = 49 个间隔，两端都架时杆数是 49 + 1 = 50。", accept: ["50", "50根"] },
      { n: 16, p: 3, point: "g3-reading", type: "错看除数", q: "一道除法题把除数 8 看成 3，得到商 24。正确的商是多少？", a: "9", exp: "被除数是 3 × 24 = 72，正确商是 72 ÷ 8 = 9。", accept: ["9"] },
      { n: 17, p: 3, point: "g3-vertical", type: "竖式补全", q: "补全除法竖式时，最适合先利用哪两个信息？", a: "商和余数", exp: "除法竖式可从商、乘积、余数的关系逐层还原。", accept: ["商和余数", "商、余数"] },
      { n: 18, p: 3, point: "g3-unit", type: "闰年生日", q: "小明今年 20 岁，但只过了 5 个生日。他的生日是几月几日？", a: "2月29日", exp: "4 年才出现一次的生日是闰年的 2 月 29 日。", accept: ["2月29日", "2.29", "2月29"] },
      { n: 19, p: 3, point: "g3-thinking", type: "年龄排序", q: "佳佳比丽丽大，小青不是最大的，但她比佳佳和丽丽都大。四人中乐乐也在其中，谁最大？", a: "乐乐", exp: "小青比佳佳、丽丽大但不是最大，所以最大的是乐乐。", accept: ["乐乐"] },
      { n: 20, p: 4, point: "g3-reading", type: "楼层职业推理", q: "四层楼中丁住第 4 层；工程师在第 1 层；教师、医生、工人从低到高相邻。丁的职业是什么？", a: "工人", exp: "第 1 层是工程师，教师在 2 层、医生在 3 层、工人在 4 层，所以丁是工人。", accept: ["工人"] }
    ];

    entries.forEach((item) => {
      const answer = String(item.a);
      add(item.point, [{
        id: `ref-g3-olympiad-q${pad(item.n)}`,
        answerType: "text",
        text: `根据奥数 PDF 第 ${item.n} 题改写：${item.q}`,
        answer,
        acceptedAnswers: (item.accept || [answer]).map(String),
        explanation: item.exp,
        steps,
        templateType: item.type,
        sourceMeta: source(sourceId, item.p, `小学三年级奥数综合训练第 ${item.p} 页第 ${item.n} 题改写。`, "manual-rewrite")
      }]);
    });
  }

  function addGeneratedFromScanIndex() {
    (scanIndex.pages || []).forEach((pageRecord, pageIndex) => {
      const pointId = pageRecord.pointHint;
      const templates = MATH_TEMPLATES[pointId] || CHINESE_TEMPLATES[pointId] || ENGLISH_TEMPLATES[pointId] || CHINESE_TEMPLATES["c3-paragraph-reading"];
      const items = templates.slice(0, 6).map((factory, templateIndex) => {
        const ctx = {
          pageRecord,
          pageIndex,
          templateIndex,
          id: `ref-g3-auto-${pageRecord.sourceId}-p${pad(pageRecord.page)}-q${templateIndex + 1}`
        };
        return factory(ctx);
      }).filter(Boolean);
      if (items.length) add(pointId, items);
    });
  }

  addImageSeeds();
  addOlympiadPageImageSeeds();
  addOlympiadDerivedSeeds();
  addGeneratedFromScanIndex();

  window.MathCampGrade3ReferenceQuestionSeeds = {
    BANK
  };
})();
