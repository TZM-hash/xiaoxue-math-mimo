(function () {
  "use strict";

  const BANK = {};

  function source(note) {
    return {
      kind: "codexOriginal",
      name: "Codex original grade 5 expansion",
      url: "codex-original:grade5-question-expansion",
      license: "Original practice item generated for this private question bank",
      maintainerNote: note
    };
  }

  function add(pointId, items) {
    BANK[pointId] = (BANK[pointId] || []).concat(items);
  }

  function text(id, textValue, answer, explanation, steps, templateType, note, acceptedAnswers) {
    return {
      id,
      answerType: "text",
      text: textValue,
      answer: String(answer),
      acceptedAnswers: (acceptedAnswers || [String(answer)]).map(String),
      explanation,
      steps,
      templateType,
      sourceMeta: source(note)
    };
  }

  function choice(id, prompt, correct, wrongs, explanation, steps, questionType, note) {
    return {
      id,
      answerType: "choice",
      prompt,
      correct,
      wrongs,
      explanation,
      steps,
      questionType,
      sourceMeta: source(note)
    };
  }

  function judge(id, statement, answer, explanation, steps, templateType, note) {
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
      sourceMeta: source(note)
    };
  }

  add("g5-decimal", [
    text("orig-g5-math-decimal-001", "计算 1.5 × 4 = ?", "6", "1.5 × 4 = 6.0 = 6。", ["按整数乘 15 × 4 = 60。", "点一位小数得 6.0。", "写成 6。"], "小数乘整数", "原创补充五年级小数乘法。"),
    choice("orig-g5-math-decimal-002", "计算 2.4 × 0.5 的积有几位小数？", "两位", ["一位", "三位", "没有小数"], "两个因数各一位小数，积有两位小数。", ["数因数小数位。", "相加得 2。", "积两位小数。"], "积的小数位数", "原创补充小数位数。")
  ]);

  add("g5-decimal-add", [
    text("orig-g5-math-decadd-001", "计算 3.6 + 2.45 = ?", "6.05", "小数点对齐相加：3.60 + 2.45 = 6.05。", ["对齐小数点。", "从低位加。", "写出 6.05。"], "小数加法", "原创补充小数加法。"),
    text("orig-g5-math-decadd-002", "计算 5.2 - 1.75 = ?", "3.45", "5.20 - 1.75 = 3.45。", ["对齐小数点。", "不够减向前借。", "写出 3.45。"], "小数减法", "原创补充小数减法。")
  ]);

  add("g5-equation", [
    text("orig-g5-math-eq-001", "解方程 x + 12 = 30，x = ?", "18", "两边同时减 12，x = 18。", ["两边减 12。", "得到 x。", "代入检验。"], "解一步方程", "原创补充解方程。"),
    text("orig-g5-math-eq-002", "解方程 3x = 45，x = ?", "15", "两边同时除以 3，x = 15。", ["两边除以 3。", "得到 x。", "检验。"], "解一步方程", "原创补充解方程。")
  ]);

  add("g5-geometry-motion", [
    text("orig-g5-math-geo-001", "一个三角形底 8 cm，高 5 cm，面积是多少平方厘米？", "20", "三角形面积 = 底 × 高 ÷ 2 = 8 × 5 ÷ 2 = 20。", ["底乘高。", "除以 2。", "写平方厘米。"], "三角形面积", "原创补充三角形面积。"),
    choice("orig-g5-math-geo-002", "平行四边形面积的计算公式是？", "底 × 高", ["底 × 高 ÷ 2", "边 × 边", "底 + 高"], "平行四边形面积等于底乘高。", ["回忆公式。", "底乘高。", "选择正确项。"], "平行四边形面积", "原创补充面积公式。")
  ]);

  add("g5-volume", [
    text("orig-g5-math-vol-001", "一个长方体长 5 cm、宽 4 cm、高 3 cm，体积是多少立方厘米？", "60", "长方体体积 = 长 × 宽 × 高 = 5 × 4 × 3 = 60。", ["长乘宽。", "再乘高。", "写立方厘米。"], "长方体体积", "原创补充体积。"),
    judge("orig-g5-math-vol-002", "正方体的体积等于棱长的三次方。", "对", "正方体体积 = 棱长 × 棱长 × 棱长。", ["回忆公式。", "棱长连乘三次。", "判断正确。"], "正方体体积", "原创补充体积判断。")
  ]);

  add("g5-percent", [
    text("orig-g5-math-percent-001", "把 0.75 化成百分数是多少？", "75%", "小数点右移两位并添百分号，0.75 = 75%。", ["小数点右移两位。", "添百分号。", "写 75%。"], "小数化百分数", "原创补充百分数。", ["75%", "75％", "百分之75"]),
    choice("orig-g5-math-percent-002", "一批产品合格率 98%，表示合格数占总数的？", "百分之九十八", ["九十八倍", "九十八个", "九十八分之一"], "百分数表示占总数的百分之几。", ["理解百分率。", "占总数比例。", "选择正确说法。"], "百分数意义", "原创补充百分数意义。")
  ]);

  add("g5-fraction", [
    text("orig-g5-math-frac-001", "计算 2/7 + 3/7 = ?（写成几分之几）", "5/7", "同分母分数相加，分母不变，分子相加。", ["分母不变。", "分子相加。", "写 5/7。"], "同分母分数加法", "原创补充分数加法。", ["5/7", "5／7"]),
    choice("orig-g5-math-frac-002", "下面哪个分数是最简分数？", "5/8", ["4/8", "6/8", "2/8"], "5 和 8 只有公因数 1，是最简分数。", ["看公因数。", "只有 1 才最简。", "选 5/8。"], "最简分数", "原创补充最简分数。")
  ]);

  add("g5-word", [
    text("orig-g5-math-word-001", "一辆车每小时行 65 千米，行了 3 小时，一共行多少千米？", "195", "路程 = 速度 × 时间 = 65 × 3 = 195。", ["找速度时间。", "相乘。", "写千米。"], "行程问题", "原创补充行程。"),
    choice("orig-g5-math-word-002", "已知路程和速度，求时间用什么算式？", "路程 ÷ 速度", ["路程 × 速度", "速度 ÷ 路程", "路程 + 速度"], "时间 = 路程 ÷ 速度。", ["回忆关系。", "路程除速度。", "选择算式。"], "行程列式", "原创补充行程列式。")
  ]);

  window.MathCampGrade5OriginalQuestionSeeds = {
    BANK
  };
})();
