(function () {
  "use strict";

  const sourceMeta = window.MathCampGrade5ReferenceSourceMeta || { byId: {} };
  const scanIndex = window.MathCampGrade5ReferenceScanIndex || { pages: [] };
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

  // 保留两位小数
  function round2(n) {
    return Math.round(n * 100) / 100;
  }

  const MATH_TEMPLATES = {
    "g5-decimal": [
      (ctx) => {
        const a = value(ctx, 21, 12, 48);
        const b = value(ctx, 22, 2, 9);
        const prod = round2(a * 0.1 * b);
        return autoText(ctx, `计算 ${round2(a * 0.1)} × ${b} = ?`, prod, "小数乘整数，先按整数乘，再点小数点。", ["先按整数相乘。", "数出小数位数。", "点上小数点。"], "小数乘整数");
      },
      (ctx) => {
        const a = value(ctx, 23, 20, 90);
        const b = value(ctx, 24, 2, 5);
        return autoText(ctx, `计算 ${round2(a * 0.1)} ÷ ${b} = ?`, round2(a * 0.1 / b), "小数除以整数，商的小数点要和被除数对齐。", ["按整数除法计算。", "对齐小数点。", "写出商。"], "小数除以整数");
      },
      (ctx) => autoChoice(ctx, "小数乘法计算后，怎样确定积的小数位数？", "看两个因数一共有几位小数", ["看被乘数位数", "看题号", "随便点一位"], "积的小数位数等于两个因数小数位数之和。", ["数第一个因数小数位。", "数第二个因数小数位。", "相加确定积的位数。"], "积的小数位数"),
      (ctx) => autoJudge(ctx, "一个数除以小于 1 的小数，商会比原来的数大。", "对", "除以小于 1 的数相当于放大，所以商变大。", ["理解除以小数。", "比较除数与 1。", "判断商的变化。"], "小数除法性质"),
      (ctx) => {
        const n = value(ctx, 25, 15, 95);
        return autoText(ctx, `把 ${round2(n * 0.01)} 保留一位小数，约是多少？`, round2(Math.round(n / 10) / 10), "保留一位小数看第二位四舍五入。", ["找到百分位。", "四舍五入。", "写出近似数。"], "小数近似数");
      },
      (ctx) => autoChoice(ctx, "下面哪个积最接近 6？", "2.1 × 3", ["2.1 × 2", "1.2 × 3", "0.9 × 3"], "2.1 × 3 = 6.3，最接近 6。", ["估算各积。", "比较与 6 的差。", "选最接近的。"], "小数乘法估算")
    ],
    "g5-decimal-add": [
      (ctx) => {
        const a = value(ctx, 31, 15, 88);
        const b = value(ctx, 32, 6, 40);
        return autoText(ctx, `计算 ${round2(a * 0.1)} + ${round2(b * 0.1)} = ?`, round2(a * 0.1 + b * 0.1), "小数加法要小数点对齐再相加。", ["对齐小数点。", "从低位加起。", "点上小数点。"], "小数加法");
      },
      (ctx) => {
        const a = value(ctx, 33, 60, 98);
        const b = value(ctx, 34, 10, 55);
        return autoText(ctx, `计算 ${round2(a * 0.1)} - ${round2(b * 0.1)} = ?`, round2(a * 0.1 - b * 0.1), "小数减法同样要小数点对齐。", ["对齐小数点。", "不够减向前借。", "写出结果。"], "小数减法");
      },
      (ctx) => autoChoice(ctx, "计算小数加减法时，最关键的一步是什么？", "小数点对齐", ["末位对齐", "先算高位", "忽略小数点"], "只有小数点对齐，相同数位才对齐。", ["写竖式。", "对齐小数点。", "相同数位相加减。"], "小数加减对齐"),
      (ctx) => autoJudge(ctx, "3.5 元 + 4 角 = 3.9 元。", "对", "4 角是 0.4 元，3.5 + 0.4 = 3.9 元。", ["统一单位。", "换成元。", "相加。"], "小数加法应用"),
      (ctx) => {
        const a = value(ctx, 35, 20, 60);
        const b = value(ctx, 36, 5, 30);
        const c = value(ctx, 37, 5, 25);
        return autoText(ctx, `买文具用了 ${round2(a * 0.1)} 元和 ${round2(b * 0.1)} 元，付了 ${round2((a + b + c) * 0.1)} 元，应找回多少元？`, round2(c * 0.1), "先算总花费，再用付款减去花费。", ["先加两项花费。", "用付款减花费。", "得到找回。"], "小数加减应用");
      },
      (ctx) => autoChoice(ctx, "6.3 + 2.7 用简便方法可看成？", "凑成 9", ["凑成 10", "凑成 8", "无法简便"], "6.3 + 2.7 = 9，正好凑成整数。", ["观察小数部分。", "看能否凑整。", "得到 9。"], "小数简算")
    ],
    "g5-vertical": [
      (ctx) => {
        const a = value(ctx, 41, 12, 46);
        const b = value(ctx, 42, 11, 39);
        return autoText(ctx, `用竖式思路计算 ${round2(a * 0.1)} × ${round2(b * 0.1)} = ?`, round2(a * 0.1 * (b * 0.1)), "小数乘小数，先按整数乘，再数两位因数的小数位数点小数点。", ["按整数相乘。", "数小数位数。", "点上小数点。"], "小数乘小数竖式");
      },
      (ctx) => {
        const divisor = value(ctx, 43, 2, 8);
        const quotient = value(ctx, 44, 12, 48);
        return autoText(ctx, `用竖式思路计算 ${round2(divisor * quotient * 0.1)} ÷ ${divisor} = ?`, round2(quotient * 0.1), "小数除以整数，商的小数点和被除数小数点对齐。", ["按整数除法算。", "对齐小数点。", "写出商。"], "小数除法竖式");
      },
      (ctx) => autoChoice(ctx, "除数是小数时，竖式第一步应先做什么？", "把除数转化成整数", ["直接除", "去掉被除数小数点", "先加 1"], "除数是小数要先移动小数点变成整数，被除数同步移动。", ["看除数小数位。", "同时移动小数点。", "再按整数除法算。"], "除数是小数"),
      (ctx) => autoJudge(ctx, "小数除法中，被除数和除数的小数点要同时移动相同位数。", "对", "同时移动才能保持商不变。", ["看除数小数位。", "被除数同步移动。", "商不变。"], "小数点移动"),
      (ctx) => {
        const a = value(ctx, 45, 24, 96);
        const b = value(ctx, 46, 3, 8);
        return autoText(ctx, `${round2(a * 0.1)} ÷ ${round2(b * 0.1)} 化成整数除法后，被除数变成多少？`, a, "除数一位小数，被除数和除数同时扩大 10 倍。", ["除数扩大 10 倍。", "被除数同步扩大。", "写出新被除数。"], "小数除法转化");
      },
      (ctx) => autoChoice(ctx, "验算小数除法时，可以怎样做？", "商 × 除数看是否等于被除数", ["商 + 除数", "只看小数位", "看题号"], "乘法是除法的逆运算，可用来验算。", ["写出商。", "商乘除数。", "核对被除数。"], "小数除法验算")
    ],
    "g5-equation": [
      (ctx) => {
        const x = value(ctx, 51, 3, 18);
        const b = value(ctx, 52, 4, 20);
        const c = x + b;
        return autoText(ctx, `解方程 x + ${b} = ${c}，x = ?`, x, "方程两边同时减去相同的数。", ["两边同时减 " + b + "。", "得到 x。", "代入检验。"], "解一步方程");
      },
      (ctx) => {
        const x = value(ctx, 53, 2, 12);
        const a = value(ctx, 54, 2, 9);
        const b = value(ctx, 55, 3, 15);
        const c = a * x + b;
        return autoText(ctx, `解方程 ${a}x + ${b} = ${c}，x = ?`, x, "先移常数，再两边同除以系数。", [`两边同时减 ${b}。`, `两边同时除以 ${a}。`, "得到 x。"], "解两步方程");
      },
      (ctx) => autoChoice(ctx, "解方程的依据主要是什么？", "等式的性质", ["数的顺序", "题号大小", "小数位数"], "等式两边同时加减乘除相同的数，等式仍然成立。", ["理解等式性质。", "两边同样操作。", "求出未知数。"], "等式性质"),
      (ctx) => autoJudge(ctx, "解方程后，把解代入原方程可以检验是否正确。", "对", "代入后两边相等说明解正确。", ["求出解。", "代入原方程。", "看两边是否相等。"], "方程检验"),
      (ctx) => {
        const each = value(ctx, 56, 3, 9);
        const count = value(ctx, 57, 4, 12);
        const total = each * count;
        return autoText(ctx, `设每本 x 元，买 ${count} 本共 ${total} 元，列方程 ${count}x = ${total}，x = ?`, each, "两边同时除以本数求出单价。", [`列方程 ${count}x = ${total}。`, `两边除以 ${count}。`, "得到单价。"], "方程应用");
      },
      (ctx) => autoChoice(ctx, "用方程解应用题时，第一步通常做什么？", "设未知数为 x", ["先写答案", "先画图涂色", "先抄题号"], "设未知数是列方程的基础。", ["读题找等量关系。", "设未知数。", "列出方程。"], "列方程步骤")
    ],
    "g5-fraction": [
      (ctx) => {
        const a = value(ctx, 61, 1, 5);
        const b = value(ctx, 62, 6, 9);
        const c = value(ctx, 63, 1, 3);
        return autoText(ctx, `计算 ${a}/${b} + ${c}/${b} = ?（结果写成几分之几）`, `${a + c}/${b}`, "同分母分数相加，分母不变，分子相加。", ["分母不变。", "分子相加。", "写出结果。"], "同分母分数加法", [`${a + c}/${b}`, `${a + c}／${b}`]);
      },
      (ctx) => autoChoice(ctx, "把 3/4 和 5/8 通分，公分母最小是多少？", "8", ["4", "12", "32"], "4 和 8 的最小公倍数是 8。", ["找分母 4 和 8。", "求最小公倍数。", "公分母是 8。"], "通分"),
      (ctx) => autoJudge(ctx, "分数的分子和分母同时乘或除以相同的数（0 除外），分数大小不变。", "对", "这是分数的基本性质。", ["理解分数性质。", "同乘同除。", "大小不变。"], "分数基本性质"),
      (ctx) => {
        const b = value(ctx, 64, 2, 6);
        const k = value(ctx, 65, 2, 4);
        return autoText(ctx, `把 ${k}/${b * k} 约分成最简分数是多少？`, `1/${b}`, "分子分母同时除以最大公因数。", [`找公因数 ${k}。`, "分子分母同时除以它。", "写成最简分数。"], "约分", [`1/${b}`, `1／${b}`]);
      },
      (ctx) => autoChoice(ctx, "下面哪个分数是最简分数？", "3/7", ["4/8", "6/9", "10/15"], "3 和 7 只有公因数 1，是最简分数。", ["看分子分母公因数。", "公因数只有 1 才最简。", "选择 3/7。"], "最简分数"),
      (ctx) => autoJudge(ctx, "假分数的分子大于或等于分母。", "对", "假分数的分子不小于分母，可化成带分数或整数。", ["看分子分母大小。", "分子≥分母是假分数。", "判断正确。"], "真分数假分数")
    ],
    "g5-geometry-motion": [
      (ctx) => {
        const b = value(ctx, 71, 4, 16);
        const h = value(ctx, 72, 3, 12);
        return autoText(ctx, `一个平行四边形底 ${b} cm，高 ${h} cm，面积是多少平方厘米？`, b * h, "平行四边形面积 = 底 × 高。", ["找出底和高。", "底乘高。", "写平方厘米。"], "平行四边形面积");
      },
      (ctx) => {
        const b = value(ctx, 73, 4, 18);
        const h = value(ctx, 74, 4, 14);
        return autoText(ctx, `一个三角形底 ${b} cm，高 ${h} cm，面积是多少平方厘米？`, round2(b * h / 2), "三角形面积 = 底 × 高 ÷ 2。", ["底乘高。", "除以 2。", "写平方厘米。"], "三角形面积");
      },
      (ctx) => {
        const a = value(ctx, 75, 3, 12);
        const b = value(ctx, 76, 5, 16);
        const h = value(ctx, 77, 3, 10);
        return autoText(ctx, `一个梯形上底 ${a} cm，下底 ${b} cm，高 ${h} cm，面积是多少平方厘米？`, round2((a + b) * h / 2), "梯形面积 = (上底 + 下底) × 高 ÷ 2。", ["上底加下底。", "乘高。", "除以 2。"], "梯形面积");
      },
      (ctx) => autoChoice(ctx, "求三角形面积时容易忘记哪一步？", "最后除以 2", ["底乘高", "找高", "写单位"], "三角形面积是与它等底等高平行四边形的一半。", ["底乘高。", "记得除以 2。", "写平方单位。"], "三角形面积易错"),
      (ctx) => autoJudge(ctx, "等底等高的平行四边形和三角形，三角形面积是平行四边形的一半。", "对", "三角形可以看成平行四边形的一半。", ["比较底和高。", "平行四边形面积。", "三角形是一半。"], "等底等高")
    ],
    "g5-volume": [
      (ctx) => {
        const a = value(ctx, 81, 3, 12);
        const b = value(ctx, 82, 3, 10);
        const c = value(ctx, 83, 2, 9);
        return autoText(ctx, `一个长方体长 ${a} cm、宽 ${b} cm、高 ${c} cm，体积是多少立方厘米？`, a * b * c, "长方体体积 = 长 × 宽 × 高。", ["长乘宽。", "再乘高。", "写立方厘米。"], "长方体体积");
      },
      (ctx) => {
        const a = value(ctx, 84, 2, 9);
        return autoText(ctx, `一个正方体棱长 ${a} cm，体积是多少立方厘米？`, a * a * a, "正方体体积 = 棱长 × 棱长 × 棱长。", ["棱长连乘三次。", "计算结果。", "写立方厘米。"], "正方体体积");
      },
      (ctx) => autoChoice(ctx, "1 立方分米等于多少立方厘米？", "1000", ["100", "10", "10000"], "1 分米 = 10 厘米，10 × 10 × 10 = 1000。", ["换算棱长。", "立方计算。", "得到 1000。"], "体积单位换算"),
      (ctx) => autoJudge(ctx, "长方体的表面积和体积单位相同。", "错", "表面积用平方单位，体积用立方单位。", ["回忆表面积单位。", "回忆体积单位。", "两者不同。"], "体积表面积单位"),
      (ctx) => {
        const a = value(ctx, 85, 3, 10);
        const b = value(ctx, 86, 3, 8);
        const c = value(ctx, 87, 2, 7);
        return autoText(ctx, `一个长方体长 ${a} cm、宽 ${b} cm、高 ${c} cm，表面积是多少平方厘米？`, 2 * (a * b + a * c + b * c), "表面积 = (长×宽 + 长×高 + 宽×高) × 2。", ["算三个面。", "相加。", "乘 2。"], "长方体表面积");
      },
      (ctx) => autoChoice(ctx, "求不规则物体体积时，常用什么方法？", "排水法（看水面上升）", ["直接量长宽高", "称重量", "看颜色"], "把物体放入水中，上升的水的体积就是物体体积。", ["放入量杯。", "看水面上升。", "上升体积即物体体积。"], "不规则物体体积")
    ],
    "g5-average-stat": [
      (ctx) => {
        const a = value(ctx, 91, 60, 95);
        const b = value(ctx, 92, 60, 95);
        const c = value(ctx, 93, 60, 95);
        return autoText(ctx, `三次成绩分别是 ${a}、${b}、${c} 分，平均分是多少？`, round2((a + b + c) / 3), "平均数 = 总和 ÷ 个数。", ["先求总和。", "除以个数。", "写出平均数。"], "平均数");
      },
      (ctx) => autoChoice(ctx, "求平均数的基本方法是什么？", "总数量 ÷ 总份数", ["最大数 ÷ 2", "只看最小数", "所有数相乘"], "平均数等于总数量除以总份数。", ["求总数。", "数份数。", "相除。"], "平均数方法"),
      (ctx) => autoJudge(ctx, "复式统计图便于比较两组数据。", "对", "复式统计图把两组数据画在一起便于对比。", ["理解复式图。", "看两组数据。", "便于比较。"], "复式统计图"),
      (ctx) => {
        const a = value(ctx, 94, 40, 80);
        const b = value(ctx, 95, 40, 80);
        return autoText(ctx, `甲组平均 ${a} 个，乙组平均 ${b} 个，两组平均相差多少个？`, Math.abs(a - b), "用较大平均数减较小平均数。", ["比较两个平均数。", "大减小。", "得到相差。"], "平均数比较");
      },
      (ctx) => autoChoice(ctx, "下面哪种情况更适合用平均数表示整体水平？", "多次测量成绩", ["只有一次数据", "彼此毫无关系的数", "题号"], "多次数据求平均能反映整体水平。", ["看数据是否同类。", "求平均。", "反映整体。"], "平均数意义")
    ],
    "g5-percent": [
      (ctx) => {
        const n = value(ctx, 101, 20, 80);
        return autoText(ctx, `把小数 ${round2(n / 100)} 化成百分数是多少？`, `${n}%`, "小数化百分数，小数点向右移两位再添百分号。", ["小数点右移两位。", "添百分号。", "写出百分数。"], "小数化百分数", [`${n}%`, `${n}％`, `百分之${n}`]);
      },
      (ctx) => autoChoice(ctx, "25% 化成分数是多少？", "1/4", ["1/2", "1/25", "25"], "25% = 25/100 = 1/4。", ["写成 25/100。", "约分。", "得到 1/4。"], "百分数化分数"),
      (ctx) => autoJudge(ctx, "百分数表示一个数是另一个数的百分之几，不带单位名称。", "对", "百分数是一种比率，不带具体单位。", ["理解百分数意义。", "是比率。", "不带单位。"], "百分数意义"),
      (ctx) => {
        const total = value(ctx, 102, 40, 120);
        const percent = 25;
        return autoText(ctx, `一批零件共 ${total * 4} 个，合格率 ${percent}% 表示合格的有多少个？`, total, "合格数 = 总数 × 合格率。", ["总数乘百分率。", "计算。", "写出合格数。"], "百分数应用");
      },
      (ctx) => autoChoice(ctx, "求“一个数是另一个数的百分之几”，用什么方法？", "两数相除再化百分数", ["两数相加", "两数相乘", "看题号"], "先相除得到比值，再化成百分数。", ["确定比较量和标准量。", "相除。", "化成百分数。"], "求百分率")
    ],
    "g5-unit": [
      (ctx) => autoChoice(ctx, "1 公顷等于多少平方米？", "10000", ["100", "1000", "100000"], "1 公顷 = 10000 平方米。", ["回忆公顷。", "换算平方米。", "得到 10000。"], "面积单位"),
      (ctx) => autoChoice(ctx, "1 升等于多少毫升？", "1000", ["100", "10", "10000"], "1 升 = 1000 毫升。", ["回忆升。", "换算毫升。", "得到 1000。"], "容积单位"),
      (ctx) => {
        const n = value(ctx, 111, 2, 9);
        return autoText(ctx, `${n} 平方米等于多少平方分米？`, n * 100, "1 平方米 = 100 平方分米。", ["回忆进率 100。", "乘 100。", "写出结果。"], "面积单位换算");
      },
      (ctx) => autoJudge(ctx, "相邻两个面积单位之间的进率是 100。", "对", "如平方米和平方分米、平方分米和平方厘米进率都是 100。", ["列出面积单位。", "看相邻进率。", "判断 100。"], "面积进率"),
      (ctx) => {
        const n = value(ctx, 112, 2, 8);
        return autoText(ctx, `${n} 立方分米等于多少立方厘米？`, n * 1000, "1 立方分米 = 1000 立方厘米。", ["回忆进率 1000。", "乘 1000。", "写出结果。"], "体积单位换算");
      },
      (ctx) => autoChoice(ctx, "测量一间教室的占地面积，用哪个单位更合适？", "平方米", ["平方厘米", "平方毫米", "毫升"], "教室较大，用平方米更合适。", ["估计大小。", "选合适单位。", "用平方米。"], "单位选择")
    ],
    "g5-word": [
      (ctx) => {
        const speed = value(ctx, 121, 40, 80);
        const time = value(ctx, 122, 2, 6);
        return autoText(ctx, `一辆汽车每小时行 ${speed} 千米，${time} 小时行多少千米？`, speed * time, "路程 = 速度 × 时间。", ["找速度和时间。", "相乘。", "写出路程。"], "行程问题");
      },
      (ctx) => {
        const total = value(ctx, 123, 120, 360);
        const speed = value(ctx, 124, 30, 60);
        return autoChoice(ctx, `甲乙两地相距 ${total} 千米，每小时行 ${speed} 千米，求时间的算式是？`, `${total} ÷ ${speed}`, [`${total} × ${speed}`, `${total} - ${speed}`, `${speed} ÷ ${total}`], "时间 = 路程 ÷ 速度。", ["找路程和速度。", "路程除以速度。", "选择算式。"], "行程列式");
      },
      (ctx) => autoJudge(ctx, "相遇问题中，总路程等于两个物体速度和乘相遇时间。", "对", "相遇时两者路程之和等于总距离。", ["理解相遇。", "速度和乘时间。", "等于总路程。"], "相遇问题"),
      (ctx) => {
        const price = value(ctx, 125, 3, 12);
        const count = value(ctx, 126, 5, 20);
        const pay = value(ctx, 127, 60, 200);
        const cost = price * count;
        return autoText(ctx, `每支笔 ${price} 元，买 ${count} 支，付 ${cost + (pay % 10 + 1)} 元应找回多少元？`, pay % 10 + 1, "先算总价，再用付款减总价。", ["单价乘数量。", "付款减总价。", "得到找回。"], "购物应用");
      },
      (ctx) => autoChoice(ctx, "解决行程问题时，先要理清哪三个量？", "速度、时间、路程", ["长、宽、高", "分子、分母、商", "题号、页码、答案"], "行程问题围绕速度、时间、路程三个量。", ["读题。", "找三量。", "选择关系。"], "行程三量")
    ],
    "g5-two-step": [
      (ctx) => {
        const a = value(ctx, 131, 12, 40);
        const b = value(ctx, 132, 3, 9);
        const c = value(ctx, 133, 10, 50);
        return autoText(ctx, `每箱 ${a} 瓶饮料，买 ${b} 箱后又用去 ${c} 瓶，还剩多少瓶？`, a * b - c, "先求总数，再减用去的。", ["先乘求总数。", "减用去。", "写还剩。"], "乘减两步");
      },
      (ctx) => autoChoice(ctx, `原有 ${240} 元，又收入 ${60} 元，平均分给 ${6} 天，正确算式是？`, "(240 + 60) ÷ 6", ["240 + 60 ÷ 6", "240 × 6 - 60", "240 ÷ 6 + 60"], "先求总钱数，再平均分。", ["先加。", "再除。", "选带括号算式。"], "加除两步"),
      (ctx) => autoJudge(ctx, "两步应用题要先确定最后问题，再找中间量。", "对", "最后问题决定第一步先求什么。", ["读最后问题。", "找中间量。", "分步列式。"], "两步题策略"),
      (ctx) => {
        const a = value(ctx, 134, 15, 45);
        const b = value(ctx, 135, 2, 6);
        const c = value(ctx, 136, 2, 5);
        return autoText(ctx, `${a} × ${b} + ${a} × ${c} = ?`, a * (b + c), "可以直接算，也可以用乘法分配律。", ["算两个乘法。", "相加。", "或合并计算。"], "乘加两步");
      },
      (ctx) => autoChoice(ctx, "解决两步问题时，草稿写清什么更不容易错？", "写出中间量的名称", ["只写答案", "只圈题号", "只抄数字"], "写清中间量能避免算对却答错。", ["确定第一步。", "写中间量。", "求最后问题。"], "应用题书写")
    ],
    "g5-reading": [
      (ctx) => autoChoice(ctx, "解决稍复杂的应用题时，画线段图有什么好处？", "帮助理清数量关系", ["让卷面更花", "增加题号", "减少计算"], "线段图能把数量关系直观表示出来。", ["读题。", "画线段图。", "理清关系。"], "线段图读题"),
      (ctx) => autoJudge(ctx, "读题时，把关键数据和问题圈出来有助于分析。", "对", "圈画关键信息能减少读题失误。", ["读题。", "圈关键数据。", "明确问题。"], "读题方法"),
      (ctx) => {
        const a = value(ctx, 141, 20, 60);
        const b = value(ctx, 142, 5, 20);
        return autoText(ctx, `甲比乙多 ${b} 个，甲有 ${a + b} 个，乙有多少个？`, a, "用甲的数量减去多出的部分。", ["读关系。", "甲减多出。", "得到乙。"], "多几少几");
      },
      (ctx) => autoChoice(ctx, "遇到不理解的应用题，最好先做什么？", "多读几遍并找出已知和问题", ["直接写得数", "跳过", "只看题号"], "读清已知条件和问题是解题第一步。", ["反复读题。", "找已知。", "找问题。"], "审题第一步"),
      (ctx) => autoJudge(ctx, "检查应用题时，可以把得数代回题目看是否合理。", "对", "代入检验能发现明显错误。", ["得到答案。", "代回题目。", "看是否合理。"], "结果检验")
    ],
    "g5-thinking": [
      (ctx) => {
        const n = value(ctx, 151, 5, 12);
        return autoText(ctx, `从 1 加到 ${n * 2} 的连续整数的和是多少？`, (n * 2) * (n * 2 + 1) / 2, "用高斯求和：(首 + 尾) × 个数 ÷ 2。", ["首加尾。", "乘个数。", "除以 2。"], "等差求和");
      },
      (ctx) => autoChoice(ctx, "用假设法解鸡兔同笼时，先假设什么？", "假设全部是同一种动物", ["假设没有动物", "假设都是鸡蛋", "看题号"], "先假设全是鸡或全是兔，再根据脚数差调整。", ["假设全是一种。", "算脚数差。", "调整数量。"], "鸡兔同笼"),
      (ctx) => autoJudge(ctx, "找规律时，先观察相邻两项的差或倍数关系。", "对", "相邻项的关系常能揭示规律。", ["观察相邻项。", "看差或倍数。", "总结规律。"], "找规律方法"),
      (ctx) => {
        const a = value(ctx, 152, 2, 6);
        const b = value(ctx, 153, 1, 4);
        return autoText(ctx, `一个数的 ${a} 倍再加 ${b} 等于 ${a * 7 + b}，这个数是多少？`, 7, "用逆推：先减再除。", [`减去 ${b}。`, `除以 ${a}。`, "得到原数。"], "逆推问题");
      },
      (ctx) => autoChoice(ctx, "解决植树问题（两端都栽）时，棵数和间隔数是什么关系？", "棵数 = 间隔数 + 1", ["棵数 = 间隔数", "棵数 = 间隔数 - 1", "棵数 = 间隔数 × 2"], "两端都栽时，棵数比间隔数多 1。", ["画线段。", "数间隔。", "棵数多 1。"], "植树问题")
    ],
    "g5-appendix": [
      (ctx) => autoChoice(ctx, "解决稍难的思考题时，下面哪种做法更稳妥？", "先画图或列表整理条件", ["直接猜答案", "只看题号", "跳过不做"], "画图列表能帮助理清复杂条件。", ["读题。", "整理条件。", "再分析。"], "思考题策略"),
      (ctx) => {
        const a = value(ctx, 161, 3, 8);
        const b = value(ctx, 162, 2, 6);
        return autoText(ctx, `用 ${a} 元和 ${b} 元的纸币付款，要正好付 ${a * 2 + b * 2} 元，各用几张（写 ${a} 元张数）？`, 2, "凑钱问题可以先试算再确定。", ["设张数。", "试算总额。", "确定张数。"], "凑数问题");
      },
      (ctx) => autoJudge(ctx, "解决组合问题时，做到不重复、不遗漏很重要。", "对", "有序枚举能保证不重不漏。", ["有序列举。", "检查重复。", "检查遗漏。"], "枚举问题"),
      (ctx) => autoChoice(ctx, "遇到复杂问题时，把大问题拆成小问题的方法叫什么？", "化繁为简", ["随便试", "只看答案", "抄题号"], "把复杂问题分解成简单问题逐步解决。", ["分析问题。", "拆成小问题。", "逐步解决。"], "化繁为简"),
      (ctx) => autoJudge(ctx, "附加题做不出时，可以先做会做的部分拿分。", "对", "先易后难有助于合理分配时间。", ["浏览题目。", "先做会的。", "再攻难题。"], "答题策略")
    ]
  };

  const CHINESE_TEMPLATES = {
    "c5-context-word": [
      (ctx) => autoChoice(ctx, "材料：他小心翼翼地捧着那盆花。题目：“小心翼翼”的意思是？", "非常谨慎小心", ["动作很快", "毫不在意", "很粗心"], "联系“捧着花”可知强调谨慎小心。", ["回到句子。", "联系动作。", "确定意思。"], "语境词义"),
      (ctx) => autoChoice(ctx, "下面哪一项词语搭配更恰当？", "灿烂的阳光", ["锋利的歌声", "浑浊的笑容", "宽广的味道"], "灿烂常用来形容阳光。", ["读中心词。", "判断修饰。", "选择自然搭配。"], "词语搭配"),
      (ctx) => autoJudge(ctx, "理解词语可以结合上下文和生活经验。", "对", "上下文和经验能帮助推断词义。", ["找词语位置。", "联系上下文。", "判断意思。"], "词义方法"),
      (ctx) => autoText(ctx, "补充词语：专心致（ ）。", "志", "成语是“专心致志”。", ["读前半部分。", "回忆成语。", "填志。"], "成语填空", ["志"]),
      (ctx) => autoChoice(ctx, "“他像离弦的箭一样冲了出去”这句话说明他？", "跑得很快", ["站着不动", "很害怕", "很累"], "离弦的箭形容速度快。", ["找比喻对象。", "理解特点。", "得出意思。"], "比喻理解"),
      (ctx) => autoJudge(ctx, "同一个词在不同句子里可能有不同意思。", "对", "多义词要结合语境理解。", ["看句子。", "联系语境。", "确定含义。"], "多义词")
    ],
    "c5-paragraph-structure": [
      (ctx) => autoChoice(ctx, "一段话中，能概括全段意思的句子通常叫什么？", "中心句", ["过渡句", "结尾句", "问句"], "中心句概括段落主要意思。", ["读全段。", "找概括性句子。", "判断中心句。"], "中心句"),
      (ctx) => autoChoice(ctx, "“总—分—总”结构的段落，开头一般起什么作用？", "总起、点明中心", ["举例子", "写结尾", "提问题"], "总起句常在开头点明中心。", ["看开头句。", "判断作用。", "选择总起。"], "段落结构"),
      (ctx) => autoJudge(ctx, "过渡句常常起承上启下的作用。", "对", "过渡句连接上下文，使表达更连贯。", ["找过渡句。", "看前后内容。", "判断作用。"], "过渡句作用"),
      (ctx) => autoText(ctx, "把几层意思按先后顺序连起来，常用的表示顺序的词有“首先、接着、然后、（ ）”。", "最后", "这些是表示先后顺序的词语。", ["读顺序词。", "补充最后一步。", "填最后。"], "顺序词", ["最后"]),
      (ctx) => autoChoice(ctx, "概括段意时，最好抓住什么？", "中心句和关键词", ["标点数量", "字体", "页码"], "中心句和关键词能反映段落重点。", ["读全段。", "找中心句。", "抓关键词。"], "段意概括"),
      (ctx) => autoJudge(ctx, "分析段落结构有助于理解作者的表达顺序。", "对", "理清结构能更好把握内容。", ["划分层次。", "看结构。", "理解顺序。"], "结构分析")
    ],
    "c5-reading": [
      (ctx) => autoChoice(ctx, "材料：夜深了，村庄安静下来，只有远处传来几声犬吠。题目：这段主要写什么？", "深夜村庄的安静", ["白天的热闹", "上学的路上", "商店营业"], "关键词是夜深、安静、犬吠。", ["读全段。", "抓关键词。", "概括内容。"], "主要内容"),
      (ctx) => autoChoice(ctx, "回答阅读题“为什么”时，最应该怎么做？", "回原文找前后依据", ["只抄标题", "看插图", "随便猜"], "原因题要在原文找依据。", ["读问题。", "定位原文。", "用依据作答。"], "原因题"),
      (ctx) => autoJudge(ctx, "阅读题的答案应尽量从材料中找依据。", "对", "有依据的答案更准确。", ["读问题。", "回材料。", "找依据。"], "阅读依据"),
      (ctx) => autoText(ctx, "材料：妈妈把伞塞进我的书包，让我别淋雨。题目：妈妈让我别做什么？", "淋雨", "答案可从材料最后找到。", ["找人物。", "找叮嘱内容。", "写淋雨。"], "细节定位", ["淋雨", "别淋雨"]),
      (ctx) => autoChoice(ctx, "体会人物心情，可以抓住什么描写？", "动作、语言和神态", ["纸张", "题号", "页码"], "动作、语言、神态能表现人物心情。", ["找描写。", "联系情境。", "体会心情。"], "人物心情"),
      (ctx) => autoJudge(ctx, "概括文章主要内容时，可以用“谁做了什么、结果怎样”的方法。", "对", "这种方法能快速抓住主要内容。", ["找人物。", "找事件。", "概括结果。"], "概括方法")
    ],
    "c5-classic": [
      (ctx) => autoChoice(ctx, "理解古诗文时，下面哪种方法最合适？", "结合注释和关键词想象画面", ["只背页码", "只看字体", "只数标点"], "注释和关键词能帮助理解诗意。", ["读诗句。", "看注释。", "想画面。"], "古诗文方法"),
      (ctx) => autoChoice(ctx, "“忽如一夜春风来，千树万树梨花开”描写的是什么景象？", "雪景（用梨花比喻雪）", ["春天开花", "秋天落叶", "夏天下雨"], "诗句用梨花比喻雪，写北方雪景。", ["读诗句。", "理解比喻。", "判断景象。"], "诗句理解"),
      (ctx) => autoJudge(ctx, "读古诗可以抓景物词想象画面，体会情感。", "对", "景物词能帮助理解画面和情感。", ["找景物。", "想画面。", "体会情感。"], "古诗画面"),
      (ctx) => autoText(ctx, "补充诗句：欲穷千里目，更上一层（ ）。", "楼", "原句是“更上一层楼”。", ["读前句。", "回忆诗句。", "填楼。"], "诗句填空", ["楼"]),
      (ctx) => autoChoice(ctx, "理解文言词语时，最应该借助什么？", "注释和上下文", ["题号颜色", "页边花纹", "字数"], "文言词义要结合注释和语境。", ["看注释。", "读上下文。", "确定意思。"], "文言词义"),
      (ctx) => autoJudge(ctx, "背诵古诗文时，理解意思比死记硬背效果更好。", "对", "理解后记忆更牢，也便于运用。", ["理解诗意。", "联系画面。", "再背诵。"], "背诵方法")
    ],
    "c5-expository-reading": [
      (ctx) => autoChoice(ctx, "说明文常用的说明方法有哪些？", "举例子、列数字、作比较", ["拟人、夸张、押韵", "只用比喻", "只讲故事"], "说明文常用举例子、列数字、作比较等方法。", ["读说明文。", "找说明方法。", "判断类型。"], "说明方法"),
      (ctx) => autoChoice(ctx, "“鲸的身体很大，最大的有十几万千克重。”用了什么说明方法？", "列数字", ["打比方", "举例子", "作比较"], "用具体数字说明鲸很大，是列数字。", ["看句子。", "找数字。", "判断方法。"], "列数字"),
      (ctx) => autoJudge(ctx, "说明文语言讲求准确，常用表示程度或范围的词。", "对", "如“大约”“之一”等能使表达更准确。", ["读说明文。", "找限定词。", "体会准确性。"], "说明文语言"),
      (ctx) => autoText(ctx, "“松鼠的尾巴像一把（ ）。”这句话用了打比方，横线填一个物体名。", "伞", "把松鼠尾巴比作伞，形象说明它的形状。", ["找本体尾巴。", "想相似物体。", "填伞。"], "打比方", ["伞", "降落伞"]),
      (ctx) => autoChoice(ctx, "阅读说明文，最应该先弄清什么？", "说明的对象和主要特点", ["作者年龄", "纸张颜色", "题号"], "先明确说明对象和特点才能抓住重点。", ["读标题。", "找说明对象。", "抓特点。"], "说明对象"),
      (ctx) => autoJudge(ctx, "作比较能突出被说明事物的特点。", "对", "通过比较能让特点更鲜明。", ["找比较对象。", "看突出什么。", "判断作用。"], "作比较")
    ],
    "c5-writing-structure": [
      (ctx) => autoChoice(ctx, "写一件事，把过程写清楚最应该按什么顺序？", "事情发展顺序", ["字数多少", "颜色深浅", "题号大小"], "记事习作常按事情发展顺序写。", ["确定事件。", "理清顺序。", "分段写。"], "记叙顺序"),
      (ctx) => autoChoice(ctx, "写人物时，为了表现人物特点，最好写什么？", "具体事例和细节", ["身高数字", "纸张", "页码"], "通过具体事例和细节能表现人物特点。", ["确定特点。", "选事例。", "写细节。"], "写人方法"),
      (ctx) => autoJudge(ctx, "习作要围绕一个中心来写，不能东拉西扯。", "对", "中心明确才能重点突出。", ["确定中心。", "选相关材料。", "围绕中心写。"], "中心明确"),
      (ctx) => autoText(ctx, "作文开头点题、结尾照应开头，这样的结构叫首尾（ ）。", "呼应", "首尾呼应使文章结构完整。", ["看开头结尾。", "判断关系。", "填呼应。"], "首尾呼应", ["呼应", "照应"]),
      (ctx) => autoChoice(ctx, "把场面写生动，可以怎么做？", "既写整体又写个别细节", ["只写一句", "只写题目", "只写数字"], "点面结合能让场面更生动。", ["写整体气氛。", "写个别细节。", "点面结合。"], "场面描写"),
      (ctx) => autoJudge(ctx, "修改作文时，可以检查详略是否得当。", "对", "重点内容要详写，次要内容略写。", ["读全文。", "看重点。", "调整详略。"], "详略得当")
    ],
    "c5-book-reading": [
      (ctx) => autoChoice(ctx, "读一本书时，先看什么能大致了解内容？", "书名、目录和封面", ["只看页码", "只看字体", "只看价格"], "书名、目录、封面能帮助了解大意。", ["看书名。", "读目录。", "了解大意。"], "整本书阅读"),
      (ctx) => autoChoice(ctx, "做读书笔记时，记录什么最有价值？", "好词好句和自己的感受", ["纸张厚度", "书的重量", "题号"], "摘抄好词好句并写感受能加深理解。", ["摘抄好句。", "写感受。", "整理笔记。"], "读书笔记"),
      (ctx) => autoJudge(ctx, "遇到不理解的内容，可以联系上下文或查资料。", "对", "联系上下文和查资料能帮助理解。", ["标出疑问。", "联系上下文。", "查资料。"], "阅读方法"),
      (ctx) => autoText(ctx, "阅读时预测故事情节，是一种主动阅读的（ ）。", "策略", "预测是主动阅读策略之一。", ["理解预测。", "属于方法。", "填策略。"], "阅读策略", ["策略", "方法"]),
      (ctx) => autoChoice(ctx, "向别人推荐一本书时，最应该说清什么？", "书的内容和推荐理由", ["书的价格", "纸张", "出版年份"], "推荐书要说明内容和为什么推荐。", ["介绍内容。", "说明理由。", "表达推荐。"], "好书推荐"),
      (ctx) => autoJudge(ctx, "长时间坚持阅读有助于积累语言和开阔视野。", "对", "阅读能积累语言、增长见识。", ["坚持阅读。", "积累语言。", "开阔视野。"], "阅读习惯")
    ],
    "c5-integrated": [
      (ctx) => autoChoice(ctx, "开展“遨游汉字王国”综合活动，最合适的做法是？", "搜集资料并整理成果", ["只玩游戏", "只抄题号", "什么都不做"], "综合性学习要搜集资料并整理展示。", ["确定主题。", "搜集资料。", "整理成果。"], "综合性学习"),
      (ctx) => autoChoice(ctx, "制作活动海报时，内容最应该做到？", "主题清楚、信息完整", ["字越多越好", "颜色越乱越好", "只写题号"], "海报要主题突出、信息清楚。", ["确定主题。", "写清信息。", "版面清楚。"], "海报制作"),
      (ctx) => autoJudge(ctx, "搜集资料时要注明资料来源。", "对", "注明来源体现尊重和严谨。", ["搜集资料。", "记录来源。", "整理引用。"], "资料来源"),
      (ctx) => autoText(ctx, "汉字的字体演变顺序中，甲骨文之后是（ ）文。", "金", "汉字字体大致经历甲骨文、金文、小篆等。", ["回忆字体演变。", "甲骨文之后。", "填金。"], "汉字文化", ["金", "金文"]),
      (ctx) => autoChoice(ctx, "小组合作完成任务时，怎样更高效？", "明确分工、互相配合", ["各做各的不沟通", "一人全包", "只讨论不动手"], "明确分工和配合能提高效率。", ["确定任务。", "合理分工。", "互相配合。"], "小组合作"),
      (ctx) => autoJudge(ctx, "展示成果时，条理清楚、语言简洁更受欢迎。", "对", "清楚简洁的表达便于别人理解。", ["整理成果。", "条理表达。", "简洁清楚。"], "成果展示")
    ]
  };

  const englishWords = ["Monday", "spring", "weekend", "morning", "science", "music", "dinner", "homework", "season", "winter", "breakfast", "holiday"];
  const englishMeanings = {
    Monday: "星期一",
    spring: "春天",
    weekend: "周末",
    morning: "早晨",
    science: "科学",
    music: "音乐",
    dinner: "晚餐",
    homework: "家庭作业",
    season: "季节",
    winter: "冬天",
    breakfast: "早餐",
    holiday: "假日"
  };
  function englishWord(ctx) {
    return englishWords[(ctx.pageIndex + ctx.templateIndex) % englishWords.length];
  }

  const ENGLISH_TEMPLATES = {
    "e5-vocabulary-week-season": [
      (ctx) => {
        const word = englishWord(ctx);
        return autoChoice(ctx, `Read and choose. Which word means ${englishMeanings[word]}?`, word, englishWords.filter((item) => item !== word).slice(0, 3), `${word} means ${englishMeanings[word]}.`, ["Read the Chinese meaning.", "Find the English word.", `Choose ${word}.`], "五年级英语词汇");
      },
      (ctx) => autoChoice(ctx, "Which word is a day of the week?", "Sunday", ["spring", "science", "dinner"], "Sunday is a day of the week.", ["Read the options.", "Find the weekday.", "Choose Sunday."], "星期词汇"),
      (ctx) => autoText(ctx, "Complete the word: sprin_. Please write the missing letter.", "g", "spring is spelled s-p-r-i-n-g.", ["Look at the word.", "Recall spring.", "The missing letter is g."], "单词拼写", ["g", "G"]),
      (ctx) => autoJudge(ctx, "The word winter means 冬天。", "对", "winter 的意思是冬天。", ["Read winter.", "Match the meaning.", "It is correct."], "词义判断"),
      (ctx) => autoChoice(ctx, "Which word is a season?", "summer", ["Monday", "music", "homework"], "summer is a season.", ["Read each word.", "Find the season.", "Choose summer."], "季节词"),
      (ctx) => autoText(ctx, "Write the English word for 周末.", "weekend", "weekend means 周末.", ["Read the Chinese word.", "Recall the English word.", "Write weekend."], "词汇拼写", ["weekend", "week end"])
    ],
    "e5-phonics-letter-groups": [
      (ctx) => autoChoice(ctx, "Which word has the /iː/ sound like in 'see'?", "tree", ["cat", "dog", "map"], "tree has the long e sound.", ["Say the words.", "Listen for long e.", "Choose tree."], "字母组合 ee"),
      (ctx) => autoChoice(ctx, "Which word has the /ʃ/ sound?", "ship", ["sit", "top", "pen"], "ship starts with the sh sound.", ["Say each word.", "Listen for sh.", "Choose ship."], "字母组合 sh"),
      (ctx) => autoText(ctx, "Complete: rai_. Add a letter to make rain.", "n", "rain is r-a-i-n.", ["Look at rai_.", "Recall rain.", "Write n."], "字母组合 ai", ["n", "N"]),
      (ctx) => autoJudge(ctx, "The letters 'ch' in 'chair' make the /tʃ/ sound.", "对", "ch 在 chair 中发 /tʃ/。", ["Say chair.", "Listen for ch.", "It is correct."], "字母组合判断"),
      (ctx) => autoChoice(ctx, "Which pair has the same sound?", "night and light", ["cat and cake", "sun and moon", "book and boot"], "night and light both have the igh sound.", ["Read the pairs.", "Find same sound.", "Choose night and light."], "同音辨析"),
      (ctx) => autoChoice(ctx, "Which word begins with the /θ/ sound?", "think", ["this", "dog", "cat"], "think begins with the voiceless th sound.", ["Say the words.", "Listen to the first sound.", "Choose think."], "首音判断")
    ],
    "e5-pattern-habit-ability": [
      (ctx) => autoChoice(ctx, "Ask about ability. Which sentence is correct?", "Can you swim?", ["Are you swim?", "Do you can swim?", "You swim can?"], "We use Can you ...? to ask about ability.", ["Find the ability question.", "Use Can you.", "Choose the correct one."], "能力问句"),
      (ctx) => autoText(ctx, "Complete: I ___ get up at six every day. (habit)", "get up", "For habits we use present simple, like I get up at six.", ["Talk about a habit.", "Use present simple.", "Complete the sentence."], "习惯表达", ["get up", "getup"]),
      (ctx) => autoChoice(ctx, "Choose the best answer: What can you do? ", "I can play the piano.", ["I am fine.", "It is Monday.", "It is rainy."], "What can you do? asks about ability.", ["Read the question.", "Find ability answer.", "Choose play the piano."], "能力应答"),
      (ctx) => autoJudge(ctx, "We use 'can' + verb to talk about ability.", "对", "can 后面加动词原形表示能力。", ["Read can.", "Add a verb.", "It is correct."], "情态动词 can"),
      (ctx) => autoChoice(ctx, "Which sentence talks about a daily habit?", "I do my homework after school.", ["I can fly.", "Look at the bird!", "It's a nice hat."], "Present simple often shows daily habits.", ["Read each sentence.", "Find daily action.", "Choose homework sentence."], "习惯句型"),
      (ctx) => autoText(ctx, "Complete: She ___ (can) sing well.", "can", "Use can before the verb sing.", ["Talk about ability.", "Use can.", "Write can."], "能力填空", ["can"])
    ],
    "e5-grammar-there-present": [
      (ctx) => autoChoice(ctx, "Choose and complete: There ___ a book on the desk.", "is", ["are", "am", "be"], "A book is singular, so use There is.", ["Look at a book.", "Singular needs is.", "Choose is."], "There be 单数"),
      (ctx) => autoChoice(ctx, "Choose and complete: There ___ two cats in the room.", "are", ["is", "am", "be"], "Two cats is plural, so use There are.", ["Look at two cats.", "Plural needs are.", "Choose are."], "There be 复数"),
      (ctx) => autoJudge(ctx, "We say 'There is a pen' for one thing.", "对", "单数用 There is。", ["Count the thing.", "One needs is.", "It is correct."], "There be 判断"),
      (ctx) => autoText(ctx, "Complete: There ___ some milk in the cup. (is/are)", "is", "Milk is uncountable, so use is.", ["Look at milk.", "Uncountable uses is.", "Write is."], "不可数名词", ["is"]),
      (ctx) => autoChoice(ctx, "Which sentence is correct?", "There are three books.", ["There is three books.", "There am books.", "There be books."], "Three books is plural, so There are.", ["Check the noun.", "Use are for plural.", "Choose correct sentence."], "正确句子"),
      (ctx) => autoChoice(ctx, "Present simple third person: He ___ TV every evening.", "watches", ["watch", "watching", "watched"], "Third person singular adds -es to watch.", ["Find subject He.", "Add -es.", "Choose watches."], "三单动词")
    ],
    "e5-reading-schedule": [
      (ctx) => autoChoice(ctx, "Read: Music class is on Wednesday. When is music class?", "On Wednesday.", ["On Monday.", "At 8 o'clock.", "In the park."], "The sentence says music class is on Wednesday.", ["Read When.", "Find the day.", "Choose Wednesday."], "课程表阅读"),
      (ctx) => autoChoice(ctx, "Read: I have English at 9:00. What time is English?", "At 9:00.", ["On Friday.", "In Room 5.", "It's sunny."], "The sentence says at 9:00.", ["Find the time.", "Match the option.", "Choose 9:00."], "时间阅读"),
      (ctx) => autoJudge(ctx, "In 'PE is on Friday afternoon', the day is Friday.", "对", "The sentence talks about Friday.", ["Read the sentence.", "Find the day.", "It is correct."], "阅读判断"),
      (ctx) => autoText(ctx, "Read: School starts at 8:00 and ends at 4:00. What time does school end?", "4:00", "The sentence says ends at 4:00.", ["Read the sentence.", "Find end time.", "Write 4:00."], "时间信息", ["4:00", "4 o'clock"]),
      (ctx) => autoChoice(ctx, "Read: On Saturday I do my homework and play football. What does the writer do on Saturday?", "homework and football", ["only sleep", "go to school", "nothing"], "The sentence names homework and football.", ["Find the actions.", "Match option.", "Choose homework and football."], "周末阅读"),
      (ctx) => autoChoice(ctx, "Read: My favourite season is spring because it is warm. Why does the writer like spring?", "Because it is warm.", ["Because it is cold.", "Because it is Monday.", "Because it is a book."], "The sentence gives the reason: it is warm.", ["Find because.", "Read the reason.", "Choose warm."], "原因阅读")
    ]
  };

  function addGeneratedFromScanIndex() {
    (scanIndex.pages || []).forEach((pageRecord, pageIndex) => {
      const pointId = pageRecord.pointHint;
      const templates = MATH_TEMPLATES[pointId] || CHINESE_TEMPLATES[pointId] || ENGLISH_TEMPLATES[pointId] || CHINESE_TEMPLATES["c5-reading"];
      const items = templates.slice(0, 6).map((factory, templateIndex) => {
        const ctx = {
          pageRecord,
          pageIndex,
          templateIndex,
          id: `ref-g5-auto-${pageRecord.sourceId}-p${pad(pageRecord.page)}-q${templateIndex + 1}`
        };
        return factory(ctx);
      }).filter(Boolean);
      if (items.length) add(pointId, items);
    });
  }

  function addOlympiadDerivedSeeds() {
    const sourceId = "g5-math-olympiad-training";
    const steps = ["读题找已知和问题。", "选择合适的奥数方法。", "计算并检验。"];
    const entries = [
      { n: "A1", p: 1, point: "g5-thinking", type: "等差数列", q: "求 2+4+6+…+100 的和是多少？", a: "2550", exp: "共 50 个偶数，(2+100)×50÷2=2550。", accept: ["2550"] },
      { n: "A2", p: 1, point: "g5-word", type: "相遇问题", q: "甲乙两地相距 480 千米，两车同时相对开出，甲每小时 60 千米，乙每小时 60 千米，几小时相遇？", a: "4", exp: "速度和 120，480÷120=4 小时。", accept: ["4", "4小时"] },
      { n: "A3", p: 1, point: "g5-geometry-motion", type: "面积割补", q: "把一个平行四边形沿高剪开再拼成长方形，面积会怎样变化？", a: "不变", exp: "割补前后面积相等，只是形状改变。", accept: ["不变", "面积不变"] },
      { n: "A4", p: 2, point: "g5-reading", type: "还原问题", q: "一个数加上 8 再乘 3 得 45，这个数是多少？", a: "7", exp: "逆推：45÷3=15，15-8=7。", accept: ["7"] },
      { n: "A5", p: 2, point: "g5-appendix", type: "鸡兔同笼", q: "鸡兔共 10 只，共 28 条腿。鸡有几只？", a: "6", exp: "假设全是鸡有 20 条腿，多出 8 条来自兔，兔 4 只，鸡 6 只。", accept: ["6", "6只"] },
      { n: "A6", p: 2, point: "g5-thinking", type: "植树问题", q: "一条 200 米的路一侧每隔 10 米栽一棵树，两端都栽，共栽几棵？", a: "21", exp: "间隔 200÷10=20 个，两端都栽是 21 棵。", accept: ["21", "21棵"] },
      { n: "B1", p: 3, point: "g5-word", type: "追及问题", q: "弟弟先走，每分钟 60 米，5 分钟后哥哥每分钟 90 米去追，几分钟追上？", a: "10", exp: "弟弟先行 300 米，速度差 30，300÷30=10 分钟。", accept: ["10", "10分钟"] },
      { n: "B2", p: 3, point: "g5-appendix", type: "盈亏问题", q: "分苹果，每人 4 个多 3 个，每人 5 个少 2 个。有几人？", a: "5", exp: "两次相差 3+2=5 个，每人差 1 个，5÷1=5 人。", accept: ["5", "5人"] },
      { n: "B3", p: 4, point: "g5-reading", type: "年龄问题", q: "今年爸爸 35 岁，儿子 7 岁，几年后爸爸年龄是儿子的 3 倍？", a: "7", exp: "年龄差 28 不变，3 倍时儿子占 1 份即 14 岁，14-7=7 年后。", accept: ["7", "7年"] },
      { n: "B4", p: 4, point: "g5-thinking", type: "数字规律", q: "1、4、9、16、25…第 10 个数是多少？", a: "100", exp: "这是平方数列，第 n 个是 n²，第 10 个是 100。", accept: ["100"] }
    ];
    entries.forEach((item) => {
      const answer = String(item.a);
      add(item.point, [{
        id: `ref-g5-olympiad-${String(item.n).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        answerType: "text",
        text: `根据奥数 PDF 第 ${item.n} 题改写：${item.q}`,
        answer,
        acceptedAnswers: (item.accept || [answer]).map(String),
        explanation: item.exp,
        steps,
        templateType: item.type,
        sourceMeta: source(sourceId, item.p, `小学五年级奥数培训综合训练及答案第 ${item.p} 页第 ${item.n} 题改写。`, "manual-rewrite")
      }]);
    });
  }

  addOlympiadDerivedSeeds();
  addGeneratedFromScanIndex();

  window.MathCampGrade5ReferenceQuestionSeeds = {
    BANK
  };
})();
