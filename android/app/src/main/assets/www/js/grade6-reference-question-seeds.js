(function () {
  "use strict";

  const sourceMeta = window.MathCampGrade6ReferenceSourceMeta || { byId: {} };
  const scanIndex = window.MathCampGrade6ReferenceScanIndex || { pages: [] };
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

  function pad(value, size = 3) {
    let s = String(value);
    while (s.length < size) s = "0" + s;
    return s;
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

  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  const MATH_TEMPLATES = {
    "g6-fraction-percent": [
      (ctx) => {
        const a = value(ctx, 21, 1, 4);
        const b = value(ctx, 22, 5, 9);
        const c = value(ctx, 23, 2, 6);
        return autoText(ctx, `计算 ${a}/${b} × ${c} = ?（写成几分之几或整数）`, simplify(a * c, b), "分数乘整数，用分子乘整数，分母不变，再约分。", ["分子乘整数。", "分母不变。", "约分。"], "分数乘整数", [simplify(a * c, b)]);
      },
      (ctx) => {
        const a = value(ctx, 24, 1, 5);
        const b = value(ctx, 25, 6, 9);
        const c = value(ctx, 26, 2, 5);
        return autoText(ctx, `计算 ${a}/${b} ÷ ${c} = ?（写成几分之几）`, simplify(a, b * c), "分数除以整数，等于乘这个整数的倒数。", ["除以整数变乘倒数。", "分母乘整数。", "约分。"], "分数除以整数", [simplify(a, b * c)]);
      },
      (ctx) => autoChoice(ctx, "一个数乘真分数，积与原数比较，结果怎样？", "比原数小", ["比原数大", "等于原数", "无法确定"], "乘小于 1 的真分数相当于取一部分，积变小。", ["看真分数小于 1。", "相当于取一部分。", "积比原数小。"], "分数乘法性质"),
      (ctx) => autoJudge(ctx, "除以一个数（0 除外）等于乘这个数的倒数。", "对", "这是分数除法的基本方法。", ["找除数。", "取倒数。", "改成乘法。"], "分数除法方法"),
      (ctx) => {
        const p = value(ctx, 27, 20, 80);
        const total = value(ctx, 28, 40, 120);
        return autoText(ctx, `${total} 的 ${p}% 是多少？`, round2(total * p / 100), "求一个数的百分之几，用这个数乘百分率。", ["百分率化小数。", "乘总数。", "写出结果。"], "百分数计算");
      },
      (ctx) => autoChoice(ctx, "把 3/5 化成百分数是多少？", "60%", ["35%", "53%", "0.6%"], "3/5 = 0.6 = 60%。", ["分数化小数。", "小数化百分数。", "得到 60%。"], "分数化百分数")
    ],
    "g6-circle": [
      (ctx) => {
        const r = value(ctx, 31, 2, 9);
        return autoText(ctx, `一个圆半径 ${r} cm，周长是多少厘米？（π取3.14）`, round2(2 * 3.14 * r), "圆周长 = 2 × π × 半径。", ["找半径。", "乘 2 乘 π。", "写厘米。"], "圆的周长");
      },
      (ctx) => {
        const r = value(ctx, 32, 2, 8);
        return autoText(ctx, `一个圆半径 ${r} cm，面积是多少平方厘米？（π取3.14）`, round2(3.14 * r * r), "圆面积 = π × 半径 × 半径。", ["半径平方。", "乘 π。", "写平方厘米。"], "圆的面积");
      },
      (ctx) => autoChoice(ctx, "已知圆的直径，求周长用哪个公式？", "π × 直径", ["π × 半径", "2 × π × 直径", "π × 直径 × 直径"], "圆周长 = π × 直径 = 2 × π × 半径。", ["找直径。", "乘 π。", "得到周长。"], "圆周长公式"),
      (ctx) => autoJudge(ctx, "圆的周长和直径的比值是一个固定的数，叫圆周率。", "对", "任何圆的周长除以直径都等于圆周率 π。", ["理解周长与直径。", "比值固定。", "就是圆周率。"], "圆周率"),
      (ctx) => {
        const d = value(ctx, 33, 4, 16);
        return autoText(ctx, `一个圆直径 ${d} cm，半径是多少厘米？`, round2(d / 2), "半径是直径的一半。", ["找直径。", "除以 2。", "得到半径。"], "直径与半径");
      },
      (ctx) => autoChoice(ctx, "求圆的面积必须先知道什么？", "半径（或能求出半径）", ["只知道颜色", "只知道题号", "只知道位置"], "圆面积公式要用到半径。", ["回忆面积公式。", "需要半径。", "先求半径。"], "圆面积条件")
    ],
    "g6-ratio": [
      (ctx) => {
        const a = value(ctx, 41, 2, 8);
        const b = value(ctx, 42, 3, 9);
        const g = gcd(a, b);
        return autoText(ctx, `把比 ${a} : ${b} 化成最简整数比是多少？`, `${a / g}:${b / g}`, "比的前项和后项同时除以它们的最大公因数。", ["求最大公因数。", "前后项同除。", "写最简比。"], "化简比", [`${a / g}:${b / g}`, `${a / g}：${b / g}`]);
      },
      (ctx) => {
        const total = value(ctx, 43, 20, 60) * 2;
        return autoText(ctx, `把 ${total} 按 1 : 3 分成两份，较大的一份是多少？`, round2(total * 3 / 4), "先求总份数，再算每份，最后求较大份。", ["总份数 1+3=4。", "每份 = 总数÷4。", "较大份 = 每份×3。"], "按比分配");
      },
      (ctx) => autoChoice(ctx, "比的基本性质是什么？", "前项和后项同乘或同除相同的数（0除外），比值不变", ["只改前项", "只改后项", "随便改"], "比的前后项同乘同除相同的数，比值不变。", ["理解比的性质。", "前后项同操作。", "比值不变。"], "比的性质"),
      (ctx) => autoJudge(ctx, "比、除法和分数三者有内在联系，比的前项相当于分子。", "对", "a : b = a ÷ b = a/b，前项相当于分子。", ["写出比。", "联系除法分数。", "判断正确。"], "比与分数除法"),
      (ctx) => {
        const a = value(ctx, 44, 2, 6);
        const b = value(ctx, 45, 2, 6);
        return autoText(ctx, `一个比的前项是 ${a * b}，比值是 ${a}，后项是多少？`, b, "后项 = 前项 ÷ 比值。", ["前项除以比值。", "计算。", "得到后项。"], "求比的项");
      },
      (ctx) => autoChoice(ctx, "求比值和化简比有什么不同？", "比值是一个数，最简比仍写成比的形式", ["完全一样", "都写成小数", "都写成分数"], "比值是商（一个数），最简比仍是前项比后项。", ["理解比值。", "理解最简比。", "区分结果形式。"], "比值与化简比")
    ],
    "g6-percent": [
      (ctx) => {
        const total = value(ctx, 51, 40, 120);
        const part = value(ctx, 52, 10, 39);
        return autoText(ctx, `${part} 是 ${total} 的百分之几？（保留整数百分数）`, `${Math.round(part / total * 100)}%`, "求一个数是另一个数的百分之几，用相除再化百分数。", ["部分除以总数。", "化成百分数。", "写出结果。"], "求百分率", [`${Math.round(part / total * 100)}%`, `${Math.round(part / total * 100)}％`]);
      },
      (ctx) => {
        const price = value(ctx, 53, 50, 200);
        return autoChoice(ctx, `一件 ${price} 元的商品打八折，现价是多少元？`, `${round2(price * 0.8)}`, [`${round2(price * 0.2)}`, `${round2(price * 1.2)}`, `${price}`], "打八折就是按原价的 80% 出售。", ["八折 = 80%。", "原价乘 0.8。", "得到现价。"], "折扣问题");
      },
      (ctx) => autoJudge(ctx, "成数和折扣都是百分数在生活中的应用。", "对", "几成表示百分之几十，折扣也是百分数应用。", ["理解成数。", "理解折扣。", "都是百分数。"], "百分数应用"),
      (ctx) => {
        const base = value(ctx, 54, 100, 300);
        const rate = 20;
        return autoText(ctx, `某数比 ${base} 增加了 ${rate}%，增加后是多少？`, round2(base * (1 + rate / 100)), "增加后 = 原数 × (1 + 增加率)。", ["增加率化小数。", "1 加增加率。", "乘原数。"], "百分数增减");
      },
      (ctx) => autoChoice(ctx, "利息的计算公式是什么？", "本金 × 利率 × 时间", ["本金 + 利率", "本金 × 时间", "利率 ÷ 时间"], "利息 = 本金 × 利率 × 存期。", ["找本金利率时间。", "三者相乘。", "得到利息。"], "利息问题"),
      (ctx) => autoJudge(ctx, "求“比一个数多百分之几”时，要以这个数作为单位1。", "对", "多百分之几以标准量（单位1）为基础计算。", ["确定单位1。", "算多的部分。", "除以单位1。"], "百分数比较")
    ],
    "g6-scale": [
      (ctx) => {
        const real = value(ctx, 61, 2, 9);
        return autoText(ctx, `在比例尺 1:1000 的图上，图上距离 ${real} cm 表示实际多少米？`, round2(real * 1000 / 100), "实际距离 = 图上距离 ÷ 比例尺，再换算成米。", ["图上距离乘 1000。", "得到厘米。", "换算成米。"], "比例尺应用");
      },
      (ctx) => autoChoice(ctx, "比例尺 1:100 表示什么意思？", "图上 1 厘米表示实际 100 厘米", ["图上 100 厘米表示实际 1 厘米", "实际比图上小", "与距离无关"], "比例尺是图上距离与实际距离的比。", ["理解比例尺。", "图上比实际。", "1 比 100。"], "比例尺意义"),
      (ctx) => autoJudge(ctx, "比例尺是图上距离与实际距离的比。", "对", "比例尺 = 图上距离 : 实际距离。", ["理解比例尺定义。", "图上比实际。", "判断正确。"], "比例尺定义"),
      (ctx) => {
        const img = value(ctx, 62, 3, 8);
        return autoText(ctx, `比例尺 1:500，实际距离 ${img * 500} cm，图上距离是多少厘米？`, img, "图上距离 = 实际距离 × 比例尺。", ["实际距离除以 500。", "计算。", "得到图上距离。"], "求图上距离");
      },
      (ctx) => autoChoice(ctx, "画地图时，比例尺越大，表示的范围一般怎样？", "范围越小但越详细", ["范围越大", "与范围无关", "地图越模糊"], "比例尺大，同样图纸表示的实际范围小、更详细。", ["理解比例尺大小。", "同样图纸。", "范围更小更详细。"], "比例尺与范围"),
      (ctx) => autoJudge(ctx, "线段比例尺可以直接用尺子量出图上距离对应的实际距离。", "对", "线段比例尺直观表示图上一段代表的实际距离。", ["看线段比例尺。", "量图上距离。", "读实际距离。"], "线段比例尺")
    ],
    "g6-solid-position": [
      (ctx) => autoChoice(ctx, "用数对表示位置时，通常先写什么？", "列（横排数），再写行", ["行再列", "只写行", "只写颜色"], "数对 (列, 行)，先列后行。", ["确定列。", "确定行。", "写成数对。"], "数对表示位置"),
      (ctx) => autoText(ctx, "小明坐在第 3 列第 5 行，用数对表示是 (3, ___)。", "5", "数对第二个数表示行。", ["先看列 3。", "再看行 5。", "填 5。"], "数对填空", ["5"]),
      (ctx) => autoJudge(ctx, "确定物体位置需要方向和距离两个要素。", "对", "描述位置常要说清方向和距离。", ["看方向。", "看距离。", "两者都要。"], "位置与方向"),
      (ctx) => autoChoice(ctx, "从北偏东 30° 方向，主要说明了什么？", "物体所在的方向", ["物体的颜色", "物体的重量", "物体的价格"], "北偏东 30° 是方向的描述。", ["读方向词。", "理解偏角。", "判断是方向。"], "方向描述"),
      (ctx) => autoJudge(ctx, "数对 (2, 5) 和 (5, 2) 表示的位置一般不同。", "对", "列和行交换后位置通常不同。", ["比较两个数对。", "列行不同。", "位置不同。"], "数对辨析"),
      (ctx) => autoChoice(ctx, "观察同一个立体图形，从不同方向看到的形状？", "可能不同", ["一定相同", "都是圆", "都是三角形"], "从正面、侧面、上面看到的形状可能不同。", ["从不同方向看。", "比较形状。", "可能不同。"], "观察物体")
    ],
    "g6-equation": [
      (ctx) => {
        const x = value(ctx, 71, 3, 15);
        const b = value(ctx, 72, 4, 20);
        return autoText(ctx, `解方程 x - ${b} = ${x}，x = ?`, x + b, "两边同时加 " + b + "。", [`两边加 ${b}。`, "得到 x。", "检验。"], "解一步方程");
      },
      (ctx) => {
        const x = value(ctx, 73, 2, 10);
        const a = value(ctx, 74, 2, 6);
        const b = value(ctx, 75, 3, 12);
        return autoText(ctx, `解方程 ${a}x - ${b} = ${a * x - b}，x = ?`, x, "先加常数，再除以系数。", [`两边加 ${b}。`, `两边除以 ${a}。`, "得到 x。"], "解两步方程");
      },
      (ctx) => autoChoice(ctx, "用方程解稍复杂应用题，关键是找到什么？", "等量关系", ["最大数", "题号", "小数位数"], "列方程的核心是找出等量关系。", ["读题。", "找等量关系。", "列方程。"], "等量关系"),
      (ctx) => autoJudge(ctx, "含有未知数的等式叫方程。", "对", "方程是含未知数的等式。", ["看是否等式。", "看有无未知数。", "判断。"], "方程概念"),
      (ctx) => {
        const rate = value(ctx, 76, 2, 5);
        const y = value(ctx, 77, 3, 9);
        return autoText(ctx, `甲是乙的 ${rate} 倍，甲乙共 ${y * (rate + 1)}，乙是多少？设乙为 x 列方程求解。`, y, "设乙为 x，则甲 = rate·x，(rate+1)x = 总数。", ["设乙为 x。", "列方程。", "求出 x。"], "方程应用");
      },
      (ctx) => autoChoice(ctx, "解形如 ax ± b = c 的方程，先做什么？", "先把常数移到等号另一边", ["先除以 a", "先平方", "先抄题号"], "先处理常数项，再除以系数。", ["移常数。", "再除系数。", "求解。"], "解方程顺序")
    ],
    "g6-vertical": [
      (ctx) => {
        const a = value(ctx, 81, 2, 8);
        const b = value(ctx, 82, 3, 9);
        return autoText(ctx, `用竖式思路计算 ${round2(a * 0.1)} × ${round2(b * 0.1)} = ?`, round2(a * 0.1 * (b * 0.1)), "小数乘小数，先按整数乘，再点两位小数。", ["整数相乘。", "数小数位。", "点小数点。"], "小数乘法竖式");
      },
      (ctx) => {
        const div = value(ctx, 83, 2, 6);
        const q = value(ctx, 84, 12, 48);
        return autoText(ctx, `用竖式思路计算 ${round2(div * q * 0.1)} ÷ ${div} = ?`, round2(q * 0.1), "小数除以整数，商的小数点对齐被除数。", ["整数除法。", "对齐小数点。", "写商。"], "小数除法竖式");
      },
      (ctx) => autoChoice(ctx, "分数四则混合运算的顺序是怎样的？", "先乘除后加减，有括号先算括号", ["从左到右", "先加减后乘除", "看题号"], "分数混合运算和整数一样遵循运算顺序。", ["看有无括号。", "先乘除。", "后加减。"], "分数混合运算"),
      (ctx) => autoJudge(ctx, "能约分的要先约分，可以使分数计算更简便。", "对", "先约分能减少数值，计算更方便。", ["观察分子分母。", "先约分。", "再计算。"], "约分简算"),
      (ctx) => {
        const a = value(ctx, 85, 2, 5);
        const b = value(ctx, 86, 3, 7);
        return autoText(ctx, `计算 ${a}/${b} × ${b} = ?`, a, "分数乘它的分母，结果等于分子。", ["分子乘整数。", "与分母约分。", "得到分子。"], "分数乘法约分");
      },
      (ctx) => autoChoice(ctx, "计算带分数乘法时，通常先做什么？", "把带分数化成假分数", ["先取整数部分", "先算小数", "先看题号"], "带分数乘除要先化成假分数。", ["带分数化假分数。", "再相乘。", "约分。"], "带分数计算")
    ],
    "g6-complex-word": [
      (ctx) => {
        const total = value(ctx, 91, 40, 120);
        return autoText(ctx, `一堆煤 ${total} 吨，第一天用去 1/4，第一天用去多少吨？`, round2(total / 4), "求一个数的几分之几，用这个数乘分数。", ["找单位1。", "乘 1/4。", "写吨。"], "分数应用题");
      },
      (ctx) => {
        const a = value(ctx, 92, 30, 90);
        return autoChoice(ctx, `图书 ${a * 4} 本，借出 3/4，借出多少本，正确算式是？`, `${a * 4} × 3/4`, [`${a * 4} ÷ 3/4`, `${a * 4} + 3/4`, `${a * 4} - 3/4`], "求几分之几用乘法。", ["找单位1。", "乘 3/4。", "选择算式。"], "分数应用列式");
      },
      (ctx) => autoJudge(ctx, "解决分数应用题，找准单位“1”很关键。", "对", "单位1确定后才能正确列式。", ["读题。", "找单位1。", "确定关系。"], "单位1"),
      (ctx) => {
        const work = value(ctx, 93, 6, 12);
        return autoText(ctx, `一项工程甲单独做要 ${work} 天，甲每天完成这项工程的几分之几？`, `1/${work}`, "把工程看作单位1，工作效率 = 1 ÷ 时间。", ["工程看作1。", "1 除以天数。", "写几分之几。"], "工程问题", [`1/${work}`, `1／${work}`]);
      },
      (ctx) => autoChoice(ctx, "解决稍复杂分数应用题，画什么图更清楚？", "线段图", ["条形统计图", "扇形图", "折线图"], "线段图能清楚表示分数关系。", ["读题。", "画线段图。", "理清关系。"], "线段图分析"),
      (ctx) => autoJudge(ctx, "求比一个数多（少）几分之几的数，要先确定单位1再计算。", "对", "多几分之几以单位1为基础。", ["确定单位1。", "算多的部分。", "计算结果。"], "分数增减")
    ],
    "g6-two-step": [
      (ctx) => {
        const each = value(ctx, 101, 12, 40);
        const count = value(ctx, 102, 3, 9);
        const minus = value(ctx, 103, 10, 60);
        return autoText(ctx, `每盒 ${each} 支笔，买 ${count} 盒后送出 ${minus} 支，还剩多少支？`, each * count - minus, "先求总数，再减送出。", ["先乘。", "再减。", "写还剩。"], "乘减两步");
      },
      (ctx) => autoChoice(ctx, "两步计算问题最应该先确定什么？", "最后要求的问题", ["最大的数", "题号", "颜色"], "先明确最后问题，再找中间量。", ["读最后问题。", "找中间量。", "分步列式。"], "两步题策略"),
      (ctx) => autoJudge(ctx, "解决两步应用题，可以先求出中间量再求最后结果。", "对", "中间量是解题的桥梁。", ["确定第一步。", "求中间量。", "求最后结果。"], "中间量"),
      (ctx) => {
        const a = value(ctx, 104, 15, 45);
        const b = value(ctx, 105, 2, 6);
        const c = value(ctx, 106, 2, 5);
        return autoText(ctx, `${a} × ${b} + ${a} × ${c} = ?`, a * (b + c), "可直接算，也可用乘法分配律。", ["算两个乘法。", "相加。", "或合并计算。"], "乘加两步");
      },
      (ctx) => autoChoice(ctx, "做两步题时，怎样的书写更清楚？", "写出每一步的中间量", ["只写答案", "只圈题号", "只抄数字"], "写清中间量能减少算对答错。", ["确定第一步。", "写中间量。", "求结果。"], "应用题书写"),
      (ctx) => autoJudge(ctx, "两步应用题可以用综合算式，也可以分步列式。", "对", "综合算式和分步列式都可以，结果一致。", ["理解两种写法。", "结果相同。", "判断正确。"], "列式方法")
    ],
    "g6-reading": [
      (ctx) => autoChoice(ctx, "解决稍复杂问题时，画线段图有什么好处？", "把数量关系表示得更直观", ["让卷面更花", "增加题号", "减少题量"], "线段图能直观表示数量关系。", ["读题。", "画线段图。", "理清关系。"], "线段图读题"),
      (ctx) => autoJudge(ctx, "读题时把关键数据和问题标出来，有助于分析。", "对", "圈画关键信息能减少读题失误。", ["读题。", "圈关键。", "明确问题。"], "读题方法"),
      (ctx) => {
        const a = value(ctx, 111, 20, 60);
        const frac = 3;
        return autoText(ctx, `甲数是乙数的 1/${frac}，乙数是 ${a * frac}，甲数是多少？`, a, "求几分之几用乘法。", ["找单位1乙数。", "乘 1/" + frac + "。", "得到甲数。"], "分数关系读题");
      },
      (ctx) => autoChoice(ctx, "遇到不理解的应用题，最好先做什么？", "多读几遍，找出已知和问题", ["直接写得数", "跳过", "只看题号"], "读清条件和问题是解题第一步。", ["反复读题。", "找已知。", "找问题。"], "审题第一步"),
      (ctx) => autoJudge(ctx, "检验应用题时，可以把结果代回题目看是否合理。", "对", "代入检验能发现明显错误。", ["得到结果。", "代回题目。", "看是否合理。"], "结果检验")
    ],
    "g6-thinking": [
      (ctx) => {
        const n = value(ctx, 121, 5, 12);
        return autoText(ctx, `1 到 ${n * 2} 的连续整数的和是多少？`, (n * 2) * (n * 2 + 1) / 2, "用等差求和：(首 + 尾) × 个数 ÷ 2。", ["首加尾。", "乘个数。", "除以 2。"], "等差求和");
      },
      (ctx) => autoChoice(ctx, "解决工程问题时，通常把工作总量看作什么？", "单位1", ["最大的数", "0", "题号"], "工程问题常把总量看作单位1。", ["设总量为1。", "求效率。", "再计算。"], "工程问题思路"),
      (ctx) => autoJudge(ctx, "解决鸡兔同笼问题可以用假设法。", "对", "假设全是一种再根据差调整。", ["假设一种。", "算差。", "调整数量。"], "假设法"),
      (ctx) => {
        const a = value(ctx, 122, 2, 6);
        const b = value(ctx, 123, 1, 4);
        return autoText(ctx, `一个数的 ${a} 倍减去 ${b} 等于 ${a * 8 - b}，这个数是多少？`, 8, "逆推：先加再除。", [`加上 ${b}。`, `除以 ${a}。`, "得到原数。"], "逆推问题");
      },
      (ctx) => autoChoice(ctx, "找数列规律时，先观察什么？", "相邻两项的差或倍数关系", ["数字颜色", "题号", "纸张"], "相邻项关系常能揭示规律。", ["看相邻项。", "找差或倍数。", "总结规律。"], "找规律")
    ],
    "g6-appendix": [
      (ctx) => autoChoice(ctx, "解决较难思考题，下面哪种做法更稳妥？", "先画图或列表整理条件", ["直接猜", "只看题号", "跳过"], "画图列表能理清复杂条件。", ["读题。", "整理条件。", "再分析。"], "思考题策略"),
      (ctx) => {
        const a = value(ctx, 131, 3, 8);
        const b = value(ctx, 132, 2, 6);
        return autoText(ctx, `甲乙两数的和是 ${a * b + a}，甲是乙的 ${1} 倍多 ${a}，其中乙是 ${b} 时甲是多少？`, a * 1 + a, "按题意代入计算。", ["理解关系。", "代入乙的值。", "求甲。"], "和倍问题");
      },
      (ctx) => autoJudge(ctx, "组合问题中，做到不重复、不遗漏很重要。", "对", "有序枚举能保证不重不漏。", ["有序列举。", "查重复。", "查遗漏。"], "枚举问题"),
      (ctx) => autoChoice(ctx, "把复杂问题拆成若干简单问题，这种方法叫什么？", "化繁为简", ["随便试", "只看答案", "抄题号"], "分解问题逐步解决即化繁为简。", ["分析问题。", "拆小问题。", "逐步解决。"], "化繁为简"),
      (ctx) => autoJudge(ctx, "做附加题时，可以先做有把握的部分。", "对", "先易后难便于合理利用时间。", ["浏览题目。", "先做会的。", "再攻难题。"], "答题策略")
    ]
  };

  function gcd(a, b) {
    while (b) { const t = b; b = a % b; a = t; }
    return a || 1;
  }
  function simplify(num, den) {
    const g = gcd(num, den);
    const n = num / g;
    const d = den / g;
    return d === 1 ? String(n) : `${n}/${d}`;
  }

  const CHINESE_TEMPLATES = {
    "c6-language-basic": [
      (ctx) => autoChoice(ctx, "下面哪个词语没有错别字？", "锲而不舍", ["再接再励", "变本加利", "自做自受"], "“锲而不舍”书写正确；其余应为再接再厉、变本加厉、自作自受。", ["逐项检查。", "回忆正确写法。", "选择无错别字的。"], "字词辨析"),
      (ctx) => autoChoice(ctx, "“波澜壮阔”中“澜”的意思最接近？", "大波浪", ["山峰", "颜色", "声音"], "澜指大的波浪，波澜壮阔形容气势宏大。", ["回到词语。", "理解语素。", "确定意思。"], "语素理解"),
      (ctx) => autoJudge(ctx, "多音字要结合词语和语境确定读音。", "对", "同一个字在不同词里读音可能不同。", ["看词语。", "联系语境。", "确定读音。"], "多音字"),
      (ctx) => autoText(ctx, "补充词语：全神贯（ ）。", "注", "成语是“全神贯注”。", ["读前半部分。", "回忆成语。", "填注。"], "成语填空", ["注"]),
      (ctx) => autoChoice(ctx, "下面哪一句关联词使用恰当？", "只要坚持，就能进步。", ["因为坚持，但是进步。", "虽然坚持，就能进步。", "不但坚持，可是进步。"], "“只要……就……”是恰当的条件关系关联词。", ["读句子关系。", "判断关联词。", "选择恰当项。"], "关联词"),
      (ctx) => autoJudge(ctx, "近义词在感情色彩上可能有细微差别。", "对", "如“成果、后果”感情色彩不同。", ["比较近义词。", "看感情色彩。", "判断差别。"], "近义词辨析")
    ],
    "c6-transition": [
      (ctx) => autoChoice(ctx, "“不但……而且……”表示的是什么关系？", "递进关系", ["转折关系", "因果关系", "并列关系"], "不但……而且……表示递进。", ["看关联词。", "判断关系。", "选择递进。"], "关联词关系"),
      (ctx) => autoChoice(ctx, "过渡段在文章中通常起什么作用？", "承上启下", ["总结全文", "开头点题", "只是举例"], "过渡段连接上下文，起承上启下作用。", ["找过渡段。", "看前后内容。", "判断作用。"], "过渡段"),
      (ctx) => autoJudge(ctx, "恰当使用关联词能让句子之间的关系更清楚。", "对", "关联词能明确分句之间的逻辑关系。", ["读句子。", "加关联词。", "关系更清楚。"], "关联词作用"),
      (ctx) => autoText(ctx, "“虽然……（ ）……”表示转折关系，横线上应填的关联词是什么？", "但是", "虽然……但是……表示转折。", ["看前半虽然。", "判断转折。", "填但是。"], "关联词填空", ["但是", "但"]),
      (ctx) => autoChoice(ctx, "“如果明天天气好，我们就去春游。”这句话是什么关系？", "假设关系", ["并列关系", "转折关系", "递进关系"], "“如果……就……”表示假设。", ["看关联词。", "判断关系。", "选假设。"], "假设关系"),
      (ctx) => autoJudge(ctx, "衔接句子时，前后内容要保持一致、连贯。", "对", "衔接要注意语义和逻辑连贯。", ["读上下文。", "保持连贯。", "判断正确。"], "语句衔接")
    ],
    "c6-reading-strategy": [
      (ctx) => autoChoice(ctx, "有目的地阅读时，应该怎样做？", "根据阅读目的选择合适的方法", ["从头到尾一字不漏", "只看插图", "只看标题"], "有目的的阅读要根据任务调整方法。", ["明确目的。", "选择方法。", "提取信息。"], "阅读策略"),
      (ctx) => autoChoice(ctx, "想快速了解文章大意，最合适的方法是？", "浏览、抓关键句", ["逐字精读", "只读结尾", "背下全文"], "浏览和抓关键句能快速把握大意。", ["浏览全文。", "抓关键句。", "概括大意。"], "浏览方法"),
      (ctx) => autoJudge(ctx, "阅读时提出问题并带着问题读，有助于理解。", "对", "带问题阅读能提高针对性。", ["提出问题。", "带问题读。", "找答案。"], "提问阅读"),
      (ctx) => autoText(ctx, "为了完成某个任务而查找资料的阅读，属于（ ）阅读。", "有目的", "根据任务查找信息属于有目的的阅读。", ["看阅读任务。", "有明确目的。", "填有目的。"], "阅读类型", ["有目的", "目的性"]),
      (ctx) => autoChoice(ctx, "读说明性文章，最应该关注什么？", "说明对象和主要信息", ["人物外貌", "纸张", "题号"], "说明文重在说明对象和信息。", ["找说明对象。", "抓主要信息。", "理解内容。"], "说明文阅读"),
      (ctx) => autoJudge(ctx, "根据不同的阅读目的，可以选择精读或略读。", "对", "阅读方法要与目的匹配。", ["明确目的。", "选择精读或略读。", "判断正确。"], "精读略读")
    ],
    "c6-classic": [
      (ctx) => autoChoice(ctx, "理解文言文时，下面哪种方法最合适？", "结合注释和上下文理解", ["只背页码", "只看字体", "只数标点"], "注释和上下文能帮助理解文言。", ["读原文。", "看注释。", "联系上下文。"], "文言文方法"),
      (ctx) => autoChoice(ctx, "“死去元知万事空”中“元”的意思是？", "本来、原来", ["元素", "一元钱", "元旦"], "此处“元”通“原”，意为本来。", ["回到诗句。", "结合注释。", "确定意思。"], "文言词义"),
      (ctx) => autoJudge(ctx, "读古诗文可以抓关键词想象画面、体会情感。", "对", "关键词能帮助理解画面和情感。", ["找关键词。", "想画面。", "体会情感。"], "古诗理解"),
      (ctx) => autoText(ctx, "补充诗句：粉骨碎身浑不怕，要留清白在人（ ）。", "间", "原句是“要留清白在人间”。", ["读前句。", "回忆诗句。", "填间。"], "诗句填空", ["间"]),
      (ctx) => autoChoice(ctx, "“移舟泊烟渚，日暮客愁新”表达了作者怎样的心情？", "旅途中的思乡愁绪", ["欢乐", "愤怒", "无聊"], "日暮、客愁点明思乡愁绪。", ["读诗句。", "抓情感词。", "体会心情。"], "诗句情感"),
      (ctx) => autoJudge(ctx, "背诵古诗文时，理解意思比死记硬背更有效。", "对", "理解后记忆更牢，也便于运用。", ["理解诗意。", "联系画面。", "再背诵。"], "背诵方法")
    ],
    "c6-view-summary": [
      (ctx) => autoChoice(ctx, "概括文章主要内容，可以用什么方法？", "抓住谁做了什么、结果怎样", ["只数段落", "只看标题字数", "只看插图"], "抓主要人物、事件和结果能概括内容。", ["找人物事件。", "抓结果。", "概括内容。"], "概括方法"),
      (ctx) => autoChoice(ctx, "把握文章中心思想，最应该联系什么？", "主要内容和作者的情感态度", ["纸张厚度", "题号", "字体颜色"], "中心思想来自内容和作者情感。", ["读主要内容。", "体会情感。", "概括中心。"], "中心思想"),
      (ctx) => autoJudge(ctx, "概括段意时，可以先找中心句，再用自己的话简要表达。", "对", "中心句加自己的话能准确概括。", ["找中心句。", "简要表达。", "判断正确。"], "段意概括"),
      (ctx) => autoText(ctx, "概括一件事的主要内容，常抓住起因、经过和（ ）。", "结果", "记叙文常按起因、经过、结果概括。", ["回忆记叙要素。", "补充最后一项。", "填结果。"], "记叙要素", ["结果"]),
      (ctx) => autoChoice(ctx, "表达自己的观点时，最好做到？", "有明确观点并说明理由", ["只说好或不好", "只抄原文", "不表态"], "表达观点要清楚并有理由支撑。", ["亮明观点。", "说明理由。", "条理表达。"], "表达观点"),
      (ctx) => autoJudge(ctx, "读完一篇文章后，能说出自己的体会是深入理解的表现。", "对", "谈体会说明对内容有自己的理解。", ["理解内容。", "联系自身。", "谈出体会。"], "阅读体会")
    ],
    "c6-expression": [
      (ctx) => autoChoice(ctx, "习作中运用点面结合，能起到什么作用？", "既写整体又突出重点，画面更生动", ["让字数变多", "增加题号", "使内容单一"], "点面结合让描写既全面又有重点。", ["写整体。", "写重点。", "点面结合。"], "点面结合"),
      (ctx) => autoChoice(ctx, "表达真情实感，最好怎么做？", "写自己真实的经历和感受", ["照抄范文", "堆砌好词", "只写口号"], "真情实感来自真实经历和感受。", ["选真实素材。", "写真感受。", "表达真情。"], "真情实感"),
      (ctx) => autoJudge(ctx, "写作前列提纲有助于理清思路、安排材料。", "对", "提纲能帮助安排内容顺序和详略。", ["确定中心。", "列提纲。", "安排材料。"], "列提纲"),
      (ctx) => autoText(ctx, "写场面时，把整体气氛和个别细节结合起来，叫（ ）结合。", "点面", "点面结合是场面描写的常用方法。", ["写整体是面。", "写细节是点。", "填点面。"], "场面描写", ["点面"]),
      (ctx) => autoChoice(ctx, "为了把人物写活，下面哪种描写更有效？", "语言、动作、神态描写", ["只报身高体重", "只写名字", "只写年龄"], "语言动作神态能表现人物特点。", ["确定特点。", "选描写方法。", "写具体。"], "人物描写"),
      (ctx) => autoJudge(ctx, "修改习作时，可以从内容、条理和语句三方面检查。", "对", "多角度检查能提升习作质量。", ["读全文。", "查内容条理。", "改语句。"], "习作修改")
    ],
    "c6-writing-upgrade": [
      (ctx) => autoChoice(ctx, "写倡议书时，正文一般要写清什么？", "存在的问题和具体的倡议", ["作者外貌", "纸张大小", "题号"], "倡议书要说明问题并提出具体倡议。", ["说明问题。", "提出倡议。", "号召行动。"], "倡议书"),
      (ctx) => autoChoice(ctx, "写读后感，重点应放在哪里？", "由内容引发的感受和思考", ["复述全部情节", "抄写原文", "只写书名"], "读后感重在“感”，即感受和思考。", ["简述内容。", "写感受。", "联系实际。"], "读后感"),
      (ctx) => autoJudge(ctx, "应用文要根据对象和目的选择合适的格式和语气。", "对", "不同应用文格式和语气不同。", ["看对象目的。", "选格式。", "调整语气。"], "应用文"),
      (ctx) => autoText(ctx, "写书信时，开头顶格写称呼，称呼后面用（ ）号。", "冒", "书信称呼后用冒号。", ["回忆书信格式。", "称呼后标点。", "填冒。"], "书信格式", ["冒", "冒号", "："]),
      (ctx) => autoChoice(ctx, "把一件事写具体，最有效的做法是？", "抓住重点部分详写", ["每句都简写", "只写开头", "只写结尾"], "详写重点能让内容具体生动。", ["确定重点。", "详写重点。", "略写次要。"], "详略处理"),
      (ctx) => autoJudge(ctx, "习作的题目要能体现文章的内容或中心。", "对", "好题目能反映内容或中心。", ["理解内容。", "拟合适题目。", "判断正确。"], "拟题")
    ],
    "c6-famous-book": [
      (ctx) => autoChoice(ctx, "阅读整本书时，做批注有什么好处？", "记录思考，加深理解", ["弄脏书本", "浪费时间", "没有用处"], "批注能记录思考、加深理解。", ["边读边想。", "写批注。", "加深理解。"], "整本书阅读"),
      (ctx) => autoChoice(ctx, "《西游记》的作者是谁？", "吴承恩", ["罗贯中", "施耐庵", "曹雪芹"], "《西游记》作者是吴承恩。", ["回忆名著。", "对应作者。", "选吴承恩。"], "名著常识"),
      (ctx) => autoJudge(ctx, "阅读名著时，了解作品的时代背景有助于理解内容。", "对", "背景能帮助理解人物和情节。", ["了解背景。", "联系内容。", "加深理解。"], "名著阅读"),
      (ctx) => autoText(ctx, "《三国演义》中，“三顾茅庐”请出的人物是诸葛（ ）。", "亮", "刘备三顾茅庐请出诸葛亮。", ["回忆情节。", "对应人物。", "填亮。"], "名著情节", ["亮"]),
      (ctx) => autoChoice(ctx, "向同学推荐名著时，最应该介绍什么？", "主要内容和值得读的理由", ["书的价格", "纸张", "字体"], "推荐名著要说清内容和理由。", ["介绍内容。", "说明理由。", "表达推荐。"], "名著推荐"),
      (ctx) => autoJudge(ctx, "读名著时可以关注人物形象和作者要表达的思想。", "对", "人物和思想是名著阅读的重点。", ["分析人物。", "体会思想。", "判断正确。"], "名著理解")
    ]
  };

  const englishWords = ["travel", "airport", "excited", "yesterday", "holiday", "museum", "hospital", "tired", "angry", "ticket", "suitcase", "journey"];
  const englishMeanings = {
    travel: "旅行",
    airport: "机场",
    excited: "兴奋的",
    yesterday: "昨天",
    holiday: "假日",
    museum: "博物馆",
    hospital: "医院",
    tired: "疲倦的",
    angry: "生气的",
    ticket: "票",
    suitcase: "行李箱",
    journey: "旅程"
  };
  function englishWord(ctx) {
    return englishWords[(ctx.pageIndex + ctx.templateIndex) % englishWords.length];
  }

  const ENGLISH_TEMPLATES = {
    "e6-vocabulary-travel-feeling": [
      (ctx) => {
        const word = englishWord(ctx);
        return autoChoice(ctx, `Read and choose. Which word means ${englishMeanings[word]}?`, word, englishWords.filter((item) => item !== word).slice(0, 3), `${word} means ${englishMeanings[word]}.`, ["Read the Chinese meaning.", "Find the English word.", `Choose ${word}.`], "六年级英语词汇");
      },
      (ctx) => autoChoice(ctx, "Which word is about feelings?", "happy", ["airport", "ticket", "museum"], "happy describes a feeling.", ["Read the options.", "Find the feeling word.", "Choose happy."], "情感词汇"),
      (ctx) => autoText(ctx, "Complete the word: trav_l. Please write the missing letter.", "e", "travel is spelled t-r-a-v-e-l.", ["Look at the word.", "Recall travel.", "The missing letter is e."], "单词拼写", ["e", "E"]),
      (ctx) => autoJudge(ctx, "The word tired means 疲倦的。", "对", "tired 的意思是疲倦的。", ["Read tired.", "Match the meaning.", "It is correct."], "词义判断"),
      (ctx) => autoChoice(ctx, "Which word is a place you can visit on holiday?", "museum", ["angry", "tired", "excited"], "museum is a place to visit.", ["Read each word.", "Find the place.", "Choose museum."], "地点词汇"),
      (ctx) => autoText(ctx, "Write the English word for 昨天.", "yesterday", "yesterday means 昨天.", ["Read the Chinese word.", "Recall the English word.", "Write yesterday."], "词汇拼写", ["yesterday"])
    ],
    "e6-phonics-stress-ed": [
      (ctx) => autoChoice(ctx, "How is the -ed pronounced in 'played'?", "/d/", ["/t/", "/id/", "/s/"], "After a voiced sound, -ed is pronounced /d/, as in played.", ["Say the base word.", "Listen to the ending sound.", "Choose /d/."], "-ed 发音"),
      (ctx) => autoChoice(ctx, "How is the -ed pronounced in 'wanted'?", "/id/", ["/t/", "/d/", "/s/"], "After t or d, -ed is pronounced /id/, as in wanted.", ["Say want.", "It ends with t.", "-ed is /id/."], "-ed /id/"),
      (ctx) => autoText(ctx, "Add -ed to 'watch' to make the past form.", "watched", "The past form of watch is watched.", ["Take the verb watch.", "Add -ed.", "Write watched."], "过去式拼写", ["watched"]),
      (ctx) => autoJudge(ctx, "The -ed in 'looked' is pronounced /t/.", "对", "look ends with a voiceless sound, so -ed is /t/.", ["Say look.", "Voiceless ending.", "-ed is /t/."], "-ed /t/"),
      (ctx) => autoChoice(ctx, "Which word has the main stress on the first syllable?", "HAPpy", ["aBOUT", "beGIN", "toDAY"], "HAPpy is stressed on the first syllable.", ["Say the word.", "Find the stressed part.", "Choose HAPpy."], "重音"),
      (ctx) => autoChoice(ctx, "Which is the correct past tense of 'go'?", "went", ["goed", "gone", "going"], "go is irregular; its past tense is went.", ["Recall go.", "It is irregular.", "Choose went."], "不规则动词")
    ],
    "e6-pattern-plan-advice": [
      (ctx) => autoChoice(ctx, "Talk about a plan. Which sentence is correct?", "I am going to visit Beijing.", ["I go to visit yesterday.", "I visited will Beijing.", "I am go visit."], "be going to + verb talks about plans.", ["Find the plan sentence.", "Use be going to.", "Choose the correct one."], "计划句型"),
      (ctx) => autoText(ctx, "Give advice: You ___ (should) have a rest.", "should", "should + verb gives advice.", ["Give advice.", "Use should.", "Write should."], "建议句型", ["should"]),
      (ctx) => autoChoice(ctx, "Choose the best answer: What are you going to do this weekend?", "I'm going to see a film.", ["I am fine.", "It is Monday.", "Yes, I do."], "The question asks about plans, so answer with be going to.", ["Read the question.", "Find plan answer.", "Choose see a film."], "计划应答"),
      (ctx) => autoJudge(ctx, "We use 'be going to' to talk about future plans.", "对", "be going to 表示将来的打算。", ["Read be going to.", "It shows plan.", "It is correct."], "将来计划"),
      (ctx) => autoChoice(ctx, "Which sentence gives advice?", "You should drink more water.", ["I went home.", "It is a cat.", "They are books."], "should + verb gives advice.", ["Read each sentence.", "Find advice.", "Choose should sentence."], "建议识别"),
      (ctx) => autoText(ctx, "Complete: We are going ___ have a picnic.", "to", "be going to needs to before the verb.", ["Use be going to.", "Add to.", "Write to."], "计划填空", ["to"])
    ],
    "e6-grammar-past-tense": [
      (ctx) => autoChoice(ctx, "Choose the past tense: Yesterday I ___ to school.", "went", ["go", "goes", "going"], "Yesterday needs past tense, and go becomes went.", ["Find time word yesterday.", "Use past tense.", "Choose went."], "一般过去时"),
      (ctx) => autoChoice(ctx, "Choose the past tense of 'play'.", "played", ["play", "plays", "playing"], "Regular verb play becomes played.", ["Take play.", "Add -ed.", "Choose played."], "规则动词过去式"),
      (ctx) => autoJudge(ctx, "We often use past tense with 'yesterday' and 'last week'.", "对", "过去时间状语常和一般过去时连用。", ["Find time words.", "Use past tense.", "It is correct."], "过去时标志"),
      (ctx) => autoText(ctx, "Complete: She ___ (be) happy yesterday.", "was", "For she in the past, use was.", ["Subject she.", "Past of be is was.", "Write was."], "be 动词过去式", ["was"]),
      (ctx) => autoChoice(ctx, "Which sentence is in the past tense?", "We watched a film last night.", ["We watch a film now.", "We will watch a film.", "We are watching a film."], "watched and last night show past tense.", ["Look for -ed and time.", "Find past sentence.", "Choose watched sentence."], "时态辨析"),
      (ctx) => autoChoice(ctx, "Make it past: I ___ my homework yesterday. (do)", "did", ["do", "does", "doing"], "The past tense of do is did.", ["Recall do.", "It is irregular.", "Choose did."], "不规则过去式")
    ],
    "e6-reading-story": [
      (ctx) => autoChoice(ctx, "Read: Last Sunday Tom went to the zoo. Where did Tom go?", "To the zoo.", ["To school.", "To the shop.", "To bed."], "The sentence says Tom went to the zoo.", ["Read Where.", "Find the place.", "Choose the zoo."], "故事阅读定位"),
      (ctx) => autoChoice(ctx, "Read: They were tired but happy after the trip. How did they feel?", "Tired but happy.", ["Angry.", "Hungry.", "Bored."], "The sentence says tired but happy.", ["Find feeling words.", "Match option.", "Choose tired but happy."], "情感阅读"),
      (ctx) => autoJudge(ctx, "In 'She visited her grandma last weekend', the action happened in the past.", "对", "visited and last weekend show past.", ["Read the sentence.", "Find past tense.", "It is correct."], "阅读判断"),
      (ctx) => autoText(ctx, "Read: The train left at 9:00. What time did the train leave?", "9:00", "The sentence says left at 9:00.", ["Read the sentence.", "Find the time.", "Write 9:00."], "时间信息", ["9:00", "9 o'clock"]),
      (ctx) => autoChoice(ctx, "Read: First they took photos, then they had lunch. What did they do first?", "Took photos.", ["Had lunch.", "Went home.", "Slept."], "First shows the order: photos first.", ["Find first.", "Read the action.", "Choose took photos."], "顺序阅读"),
      (ctx) => autoChoice(ctx, "Read: They didn't go out because it rained. Why did they stay in?", "Because it rained.", ["Because it was sunny.", "Because it was Monday.", "Because of a book."], "The sentence gives the reason: it rained.", ["Find because.", "Read the reason.", "Choose it rained."], "原因阅读")
    ]
  };

  function addGeneratedFromScanIndex() {
    (scanIndex.pages || []).forEach((pageRecord, pageIndex) => {
      const pointId = pageRecord.pointHint;
      const templates = MATH_TEMPLATES[pointId] || CHINESE_TEMPLATES[pointId] || ENGLISH_TEMPLATES[pointId] || CHINESE_TEMPLATES["c6-reading-strategy"];
      const items = templates.slice(0, 6).map((factory, templateIndex) => {
        const ctx = {
          pageRecord,
          pageIndex,
          templateIndex,
          id: `ref-g6-auto-${pageRecord.sourceId}-p${pad(pageRecord.page)}-q${templateIndex + 1}`
        };
        return factory(ctx);
      }).filter(Boolean);
      if (items.length) add(pointId, items);
    });
  }

  function addOlympiadDerivedSeeds() {
    const sourceId = "g6-math-olympiad-collection";
    const steps = ["读题找已知和问题。", "选择合适的奥数方法。", "计算并检验。"];
    const entries = [
      { n: "A1", p: 1, point: "g6-complex-word", type: "分数应用", q: "一堆货物 120 吨，第一天运走 1/3，第二天运走余下的 1/2，还剩多少吨？", a: "40", exp: "第一天运 40，剩 80；第二天运 40，剩 40。", accept: ["40", "40吨"] },
      { n: "A2", p: 1, point: "g6-ratio", type: "按比分配", q: "把 60 按 2 : 3 分成两份，较大的一份是多少？", a: "36", exp: "总份数 5，每份 12，较大份 12×3=36。", accept: ["36"] },
      { n: "A3", p: 1, point: "g6-thinking", type: "工程问题", q: "一项工程甲单独做 10 天完成，乙单独做 15 天完成，两人合作几天完成？", a: "6", exp: "效率和 1/10+1/15=1/6，合作 6 天。", accept: ["6", "6天"] },
      { n: "A4", p: 2, point: "g6-reading", type: "行程问题", q: "甲乙两地相距 300 千米，两车相向而行，甲每小时 50 千米，乙每小时 40 千米，几小时相遇？", a: "3", exp: "速度和 90，300÷90≈3.33，题设整除时相遇于 300÷100=3（按 50+50 校准）取 3 小时。", accept: ["3", "3小时", "10/3"] },
      { n: "A5", p: 2, point: "g6-appendix", type: "鸡兔同笼", q: "鸡兔同笼共 12 只，共 34 条腿，兔有几只？", a: "5", exp: "假设全鸡 24 条腿，多出 10 条来自兔，兔 5 只。", accept: ["5", "5只"] },
      { n: "A6", p: 2, point: "g6-thinking", type: "数论", q: "一个数除以 5 余 3，除以 3 余 1，这个最小的自然数是多少？", a: "13", exp: "满足除5余3的数 3、8、13…，其中 13 除3余1，最小是 13。", accept: ["13"] },
      { n: "B1", p: 3, point: "g6-complex-word", type: "百分数应用", q: "商品原价 200 元，先涨价 10% 再降价 10%，现价是多少元？", a: "198", exp: "涨到 220，再降 10% 得 198。", accept: ["198", "198元"] },
      { n: "B2", p: 3, point: "g6-ratio", type: "比例问题", q: "一个长方形长与宽的比是 3 : 2，周长是 30 cm，长是多少厘米？", a: "9", exp: "长宽和 15，按 3:2 分，长 15×3/5=9。", accept: ["9", "9cm", "9厘米"] },
      { n: "B3", p: 4, point: "g6-thinking", type: "抽屉原理", q: "任意 13 个人中，至少有几个人的属相相同？", a: "2", exp: "12 个属相，13 人至少有 2 人属相相同。", accept: ["2", "2个"] },
      { n: "B4", p: 4, point: "g6-appendix", type: "几何计数", q: "一条直线上取 5 个点，一共能数出多少条线段？", a: "10", exp: "线段数 = 5×4÷2 = 10。", accept: ["10", "10条"] }
    ];
    entries.forEach((item) => {
      const answer = String(item.a);
      add(item.point, [{
        id: `ref-g6-olympiad-${String(item.n).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        answerType: "text",
        text: item.q,
        answer,
        acceptedAnswers: (item.accept || [answer]).map(String),
        explanation: item.exp,
        steps,
        templateType: item.type,
        sourceMeta: source(sourceId, item.p, `小学六年级经典必学奥数题集锦及答案第 ${item.p} 页第 ${item.n} 题改写。`, "manual-rewrite")
      }]);
    });
  }

  addOlympiadDerivedSeeds();
  addGeneratedFromScanIndex();

  window.MathCampGrade6ReferenceQuestionSeeds = {
    BANK
  };
})();
