(function () {
  "use strict";

  const BANK = {};

  function source(note) {
    return {
      kind: "codexOriginal",
      name: "Codex original grade 6 expansion",
      url: "codex-original:grade6-question-expansion",
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

  add("g6-fraction-percent", [
    text("orig-g6-math-fp-001", "计算 3/4 × 8 = ?", "6", "分子乘整数再约分：3 × 8 ÷ 4 = 6。", ["分子乘 8。", "与分母约分。", "得到 6。"], "分数乘整数", "原创补充六年级分数乘法。"),
    text("orig-g6-math-fp-002", "计算 4/5 ÷ 2 = ?（写成几分之几）", "2/5", "除以 2 等于乘 1/2，得 2/5。", ["除以 2 变乘 1/2。", "计算。", "写 2/5。"], "分数除以整数", "原创补充分数除法。", ["2/5", "2／5"])
  ]);

  add("g6-circle", [
    text("orig-g6-math-circle-001", "一个圆半径 5 cm，周长是多少厘米？（π取3.14）", "31.4", "周长 = 2 × 3.14 × 5 = 31.4。", ["2 乘 π。", "乘半径。", "写厘米。"], "圆的周长", "原创补充圆周长。"),
    text("orig-g6-math-circle-002", "一个圆半径 2 cm，面积是多少平方厘米？（π取3.14）", "12.56", "面积 = 3.14 × 2 × 2 = 12.56。", ["半径平方。", "乘 π。", "写平方厘米。"], "圆的面积", "原创补充圆面积。")
  ]);

  add("g6-ratio", [
    text("orig-g6-math-ratio-001", "把比 12 : 18 化成最简整数比是多少？", "2:3", "同时除以最大公因数 6。", ["求公因数 6。", "前后项同除。", "写 2:3。"], "化简比", "原创补充化简比。", ["2:3", "2：3"]),
    choice("orig-g6-math-ratio-002", "把 40 按 3 : 5 分配，较小的一份是多少？", "15", ["25", "8", "5"], "总份数 8，每份 5，较小份 5×3=15。", ["总份数 8。", "每份 5。", "较小份 15。"], "按比分配", "原创补充按比分配。")
  ]);

  add("g6-percent", [
    text("orig-g6-math-percent-001", "20 是 50 的百分之几？", "40%", "20 ÷ 50 = 0.4 = 40%。", ["相除。", "化百分数。", "写 40%。"], "求百分率", "原创补充百分率。", ["40%", "40％", "百分之40"]),
    choice("orig-g6-math-percent-002", "一件商品 100 元打七折后是多少元？", "70", ["30", "170", "107"], "打七折即按 70% 出售，100 × 0.7 = 70。", ["七折 = 70%。", "乘 0.7。", "得 70。"], "折扣问题", "原创补充折扣。")
  ]);

  add("g6-complex-word", [
    text("orig-g6-math-word-001", "一堆沙 60 吨，第一天运走 1/4，运走多少吨？", "15", "60 × 1/4 = 15。", ["找单位1。", "乘 1/4。", "写吨。"], "分数应用", "原创补充分数应用。"),
    choice("orig-g6-math-word-002", "解决分数应用题时，首先要找准什么？", "单位1", ["最大数", "题号", "小数位数"], "找准单位1是解分数应用题的关键。", ["读题。", "找单位1。", "再列式。"], "单位1", "原创补充解题方法。")
  ]);

  add("g6-equation", [
    text("orig-g6-math-eq-001", "解方程 2x + 5 = 17，x = ?", "6", "两边减 5 得 2x=12，再除以 2 得 6。", ["两边减 5。", "两边除以 2。", "得 x=6。"], "解两步方程", "原创补充解方程。"),
    judge("orig-g6-math-eq-002", "含有未知数的等式叫方程。", "对", "方程是含未知数的等式。", ["看是否等式。", "看有无未知数。", "判断正确。"], "方程概念", "原创补充方程概念。")
  ]);

  add("g6-scale", [
    text("orig-g6-math-scale-001", "比例尺 1:1000 的图上，量得两地 4 cm，实际相距多少米？", "40", "实际 = 4 × 1000 = 4000 cm = 40 m。", ["图上距离乘 1000。", "得厘米。", "换算成米。"], "比例尺应用", "原创补充比例尺。"),
    choice("orig-g6-math-scale-002", "比例尺 1:50000 表示图上 1 cm 代表实际多少？", "50000 cm", ["5000 cm", "500 cm", "50 cm"], "比例尺 1:50000 表示图上 1 cm 代表实际 50000 cm。", ["理解比例尺。", "图上比实际。", "选 50000 cm。"], "比例尺意义", "原创补充比例尺意义。")
  ]);

  add("g6-solid-position", [
    text("orig-g6-math-pos-001", "小红坐在第 4 列第 2 行，用数对表示是 (4, ___)。", "2", "数对第二个数表示行，这里是 2。", ["先看列 4。", "再看行 2。", "填 2。"], "数对表示位置", "原创补充数对。", ["2"]),
    judge("orig-g6-math-pos-002", "用数对表示位置时，一般先写列再写行。", "对", "数对 (列, 行)，先列后行。", ["回忆数对规则。", "先列后行。", "判断正确。"], "数对规则", "原创补充数对规则。")
  ]);

  window.MathCampGrade6OriginalQuestionSeeds = {
    BANK
  };
})();
