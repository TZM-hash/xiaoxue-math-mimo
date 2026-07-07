(function () {
  "use strict";

  const BANK = {};

  function source(note) {
    return {
      kind: "codexOriginal",
      name: "Codex original grade 4 expansion",
      url: "codex-original:grade4-question-expansion",
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

  add("g4-mixed", [
    text("orig-g4-math-mixed-001", "计算 180 + 24 × 6 = ?", "324", "先算乘法 24 × 6 = 144，再算 180 + 144 = 324。", ["先乘除。", "后加减。", "写出结果。"], "四则混合运算", "原创补充四年级混合运算。"),
    choice("orig-g4-math-mixed-002", "计算 (96 - 36) ÷ 5 时，第一步先算什么？", "96 - 36", ["36 ÷ 5", "96 ÷ 5", "96 + 36"], "有括号先算括号里面。", ["找括号。", "先算减法。", "再除以 5。"], "括号优先", "原创补充运算顺序。")
  ]);

  add("g4-vertical", [
    text("orig-g4-math-vertical-001", "用竖式思路计算 236 × 24 = ?", "5664", "236 × 24 = 236 × 4 + 236 × 20 = 944 + 4720 = 5664。", ["先乘个位。", "再乘十位。", "部分积相加。"], "三位数乘两位数", "原创补充乘法竖式。"),
    choice("orig-g4-math-vertical-002", "除数是两位数的除法试商时，常把除数看成什么？", "接近的整十数", ["个位数", "小数", "题号"], "把除数看成接近的整十数便于估商。", ["看除数。", "四舍五入成整十。", "试商后调整。"], "除法试商", "原创补充除法竖式。")
  ]);

  add("g4-two-step", [
    text("orig-g4-math-twostep-001", "每盒彩笔 28 支，买 6 盒后送出 35 支，还剩多少支？", "133", "28 × 6 = 168，168 - 35 = 133。", ["先求总数。", "再减送出。", "回答还剩。"], "乘减两步", "原创补充两步应用。"),
    choice("orig-g4-math-twostep-002", "学校买来 240 本书，又添 60 本，平均分给 5 个班。正确算式是？", "(240 + 60) ÷ 5", ["240 + 60 ÷ 5", "240 × 5 - 60", "240 ÷ 60 + 5"], "先求总本数，再平均分。", ["先加。", "再除。", "选择带括号算式。"], "加除两步", "原创补充两步列式。")
  ]);

  add("g4-large", [
    text("orig-g4-math-large-001", "560000 里面有多少个一万？", "56", "560000 = 56 个 10000。", ["按四位一级分级。", "看万级是 56。", "写 56。"], "大数分级", "原创补充亿以内数认识。"),
    choice("orig-g4-math-large-002", "比较 780900 和 780090，哪个更大？", "780900", ["780090", "一样大", "无法比较"], "位数相同，从高位依次比较，百位 9 大于 0。", ["位数相同。", "从高位比。", "找到不同数位。"], "大数比较", "原创补充大数比较。")
  ]);

  add("g4-area", [
    text("orig-g4-math-area-001", "长方形长 15 米，宽 8 米，面积是多少平方米？", "120", "长方形面积 = 长 × 宽，15 × 8 = 120。", ["找到长和宽。", "相乘求面积。", "写平方米。"], "长方形面积", "原创补充面积计算。"),
    choice("orig-g4-math-area-002", "正方形边长 11 厘米，面积是多少平方厘米？", "121 平方厘米", ["44 平方厘米", "22 平方厘米", "110 平方厘米"], "正方形面积 = 边长 × 边长，11 × 11 = 121。", ["找到边长。", "边长乘边长。", "写平方厘米。"], "正方形面积", "原创补充面积单位。")
  ]);

  add("g4-angle-triangle", [
    text("orig-g4-math-angle-001", "三角形两个内角分别是 50° 和 65°，第三个内角是多少度？", "65", "三角形内角和是 180°，180 - 50 - 65 = 65。", ["写出 180°。", "减去两个已知角。", "得到第三个角。"], "三角形内角和", "原创补充角与三角形。"),
    choice("orig-g4-math-angle-002", "量角时，量角器中心点应该对准哪里？", "角的顶点", ["角的一条边中点", "纸张左上角", "题号"], "中心点对准角的顶点，零刻度线对准一条边。", ["对准顶点。", "对准一边。", "读另一边刻度。"], "量角方法", "原创补充角度量。")
  ]);

  add("g4-mul-div", [
    text("orig-g4-math-muldiv-001", "48 × 32 = ?", "1536", "48 × 32 = 48 × 30 + 48 × 2 = 1440 + 96 = 1536。", ["拆成 30 和 2。", "分别相乘。", "合并结果。"], "两位数乘两位数", "原创补充多位乘法。"),
    choice("orig-g4-math-muldiv-002", "汽车每小时行 75 千米，4 小时行多少千米？", "300 千米", ["79 千米", "71 千米", "150 千米"], "速度 × 时间 = 路程，75 × 4 = 300。", ["找到速度。", "找到时间。", "相乘。"], "行程数量关系", "原创补充乘除应用。")
  ]);

  add("g4-statistics", [
    text("orig-g4-math-stat-001", "四次测试成绩分别是 80、90、85、95 分，平均分是多少？", "87.5", "平均数 = 总分 ÷ 次数，(80 + 90 + 85 + 95) ÷ 4 = 87.5。", ["先求总分。", "再除以 4。", "得到平均分。"], "平均数", "原创补充统计平均数。", ["87.5", "87.5分"]),
    choice("orig-g4-math-stat-002", "条形统计图每格表示 5 人，8 格表示多少人？", "40 人", ["13 人", "8 人", "5 人"], "每格 5 人，8 格是 5 × 8 = 40 人。", ["看每格数量。", "数格数。", "相乘。"], "条形统计图", "原创补充统计图读数。")
  ]);

  add("g4-word", [
    text("orig-g4-math-word-001", "书店每盒彩笔 36 元，买 5 盒优惠 20 元，应付多少元？", "160", "36 × 5 = 180，180 - 20 = 160。", ["先求原价总数。", "减去优惠。", "回答应付。"], "购物应用题", "原创补充四年级应用题。"),
    choice("orig-g4-math-word-002", "行程问题中“速度 × 时间”求什么？", "路程", ["单价", "面积", "平均数"], "速度、时间、路程的关系是速度 × 时间 = 路程。", ["找数量关系。", "速度乘时间。", "得到路程。"], "行程关系", "原创补充数量关系。")
  ]);

  add("g4-reading", [
    choice("orig-g4-math-reading-001", "题目：仓库有 360 箱牛奶，运走 120 箱；旁边有 40 箱矿泉水。求牛奶还剩多少箱，哪个条件是干扰信息？", "旁边有 40 箱矿泉水", ["仓库有 360 箱牛奶", "运走 120 箱", "求牛奶剩余"], "问题只问牛奶剩余，矿泉水数量无关。", ["读问题。", "找牛奶条件。", "排除矿泉水。"], "干扰条件", "原创补充读题筛条件。"),
    judge("orig-g4-math-reading-002", "表格题应先读表头和单位，再读数据。", "对", "表头和单位决定每个数据的含义。", ["看标题。", "看单位。", "再读数据。"], "表格阅读", "原创补充数学阅读策略。")
  ]);

  add("g4-thinking", [
    text("orig-g4-math-thinking-001", "找规律：7，14，28，56，下一个数是多少？", "112", "每次乘 2，56 × 2 = 112。", ["比较相邻数。", "发现乘 2。", "继续乘 2。"], "规律题", "原创补充思维训练。"),
    choice("orig-g4-math-thinking-002", "甲比乙多 24 元，甲给乙多少元后两人一样多？", "12 元", ["24 元", "6 元", "48 元"], "移多补少时，给出的数量是差的一半。", ["看差是 24。", "除以 2。", "得到 12。"], "移多补少", "原创补充思维策略。")
  ]);

  add("g4-appendix", [
    choice("orig-g4-math-appendix-001", "红黄蓝绿每 4 个一组循环，第 37 个是什么颜色？", "红", ["黄", "蓝", "绿"], "37 ÷ 4 余 1，第 1 个是红。", ["找周期 4。", "算余数。", "对应颜色。"], "周期规律", "原创补充附加题。"),
    text("orig-g4-math-appendix-002", "5 件上衣和 4 条裤子，每次选 1 件上衣和 1 条裤子，一共有几种搭配？", "20", "5 × 4 = 20 种。", ["上衣 5 种。", "裤子 4 种。", "相乘。"], "搭配计数", "原创补充搭配题。")
  ]);

  add("c4-word-sentence", [
    choice("orig-g4-cn-word-001", "材料：雨后的空气格外清新。“清新”的意思最接近哪一个？", "新鲜、爽快", ["非常吵闹", "十分沉重", "颜色鲜红"], "联系雨后空气，清新指新鲜爽快。", ["读句子。", "联系语境。", "选择词义。"], "语境词义", "原创补充四年级词句段。"),
    text("orig-g4-cn-word-002", "补充词语：鸦雀无（ ）。", "声", "成语是“鸦雀无声”。", ["读词语。", "回忆成语。", "填声。"], "成语填空", "原创补充词语积累。", ["声"])
  ]);

  add("c4-sick-sentence", [
    choice("orig-g4-cn-sick-001", "修改病句“通过这次练习，使我提高了速度。”最恰当的是？", "删去“通过”或“使”", ["删去速度", "加问号", "把练习改成美丽"], "“通过……使……”会让句子缺主语。", ["找主语。", "判断病因。", "删去一个词。"], "病句修改", "原创补充病句题。"),
    judge("orig-g4-cn-sick-002", "修改病句时，要尽量保持原句主要意思不变。", "对", "修改是让句子通顺，不是改成另一个意思。", ["读原句。", "找病因。", "最小修改。"], "修改原则", "原创补充病句判断。")
  ]);

  add("c4-rhetoric-punctuation", [
    choice("orig-g4-cn-rhetoric-001", "“小溪唱着歌奔向远方。”使用了什么修辞？", "拟人", ["比喻", "设问", "排比"], "把小溪写成人会唱歌，是拟人。", ["找人的动作。", "看对象。", "选择拟人。"], "修辞识别", "原创补充修辞题。"),
    text("orig-g4-cn-punc-002", "句子“太壮观了（ ）”句末最合适的标点是？", "！", "表达强烈感情时用感叹号。", ["读语气。", "判断感叹。", "填写标点。"], "标点填空", "原创补充标点题。", ["！", "!"])
  ]);

  add("c4-modern-reading", [
    choice("orig-g4-cn-reading-001", "材料：公园里，老人散步，孩子放风筝，花坛边传来笑声。题目：这段主要写什么？", "公园里十分热闹", ["花坛很小", "天气很冷", "大家在上课"], "多个人物活动和笑声表现公园热闹。", ["读完整段。", "抓活动。", "概括主要内容。"], "现代文阅读", "原创补充阅读概括。"),
    judge("orig-g4-cn-reading-002", "回答阅读题时，应尽量回到原文找依据。", "对", "材料依据能帮助准确作答。", ["读问题。", "定位原文。", "根据材料回答。"], "阅读方法", "原创补充阅读判断。")
  ]);

  add("c4-writing-topic", [
    choice("orig-g4-cn-writing-001", "习作题目“推荐一个好地方”，下面哪个材料最合适？", "介绍图书馆环境、藏书和推荐理由", ["计算面积", "默写英语单词", "只写天气"], "推荐好地方要写地点特点和理由。", ["审题。", "选地点。", "写推荐理由。"], "习作审题", "原创补充习作题。"),
    judge("orig-g4-cn-writing-002", "习作选材要围绕题目要求。", "对", "材料偏题会影响表达重点。", ["读题。", "圈关键词。", "选相关材料。"], "选材判断", "原创补充习作判断。")
  ]);

  add("c4-poem-classic", [
    choice("orig-g4-cn-poem-001", "理解“不识庐山真面目，只缘身在此山中”最合适的一项是？", "看问题有时要换个角度", ["山中没有路", "只要爬山就会迷路", "所有山都一样"], "身在山中看不全面，启发我们换角度观察。", ["读诗句。", "理解原因。", "概括道理。"], "古诗文理解", "原创补充古诗文。"),
    text("orig-g4-cn-poem-002", "补充诗句：半江瑟瑟半江（ ）。", "红", "原句是“半江瑟瑟半江红”。", ["读前半句。", "回忆诗句。", "填红。"], "诗句填空", "原创补充古诗积累。", ["红"])
  ]);

  add("c4-info-reading", [
    choice("orig-g4-cn-info-001", "通知写着“周三下午两点在报告厅集合”，集合地点是哪里？", "报告厅", ["操场", "教室", "图书馆"], "材料中直接写着在报告厅集合。", ["读通知。", "找地点。", "选择报告厅。"], "资料提取", "原创补充信息阅读。"),
    judge("orig-g4-cn-info-002", "从表格提取信息时，行列标题很重要。", "对", "行列标题说明数据代表什么。", ["看表头。", "定位行列。", "读取数据。"], "表格阅读", "原创补充资料题。")
  ]);

  add("c4-usage", [
    choice("orig-g4-cn-usage-001", "劝同学节约用水，哪句话更得体？", "请随手关紧水龙头，我们一起节约用水吧。", ["你怎么这么浪费！", "水龙头很好看。", "今天有数学课。"], "劝说要礼貌，并提出具体做法。", ["明确目的。", "语气礼貌。", "提出建议。"], "口语交际", "原创补充综合语用。"),
    judge("orig-g4-cn-usage-002", "通知应写清时间、地点和事情。", "对", "这三项能让别人知道何时何地做什么。", ["写时间。", "写地点。", "写事项。"], "通知写作", "原创补充应用文。")
  ]);

  add("e4-vocabulary-home-school", [
    choice("orig-g4-en-vocab-001", "Which word means 教室?", "classroom", ["fork", "uncle", "rainy"], "classroom means 教室.", ["Read the Chinese meaning.", "Match the English word.", "Choose classroom."], "词汇理解", "原创补充四年级英语词汇。"),
    text("orig-g4-en-vocab-002", "Write the English word for 书包.", "schoolbag", "schoolbag means 书包.", ["Read the Chinese meaning.", "Recall the word.", "Write schoolbag."], "单词拼写", "原创补充英语拼写。", ["schoolbag", "bag"])
  ]);

  add("e4-phonics-silent-e", [
    choice("orig-g4-en-phonics-001", "Which word has the long a sound with silent e?", "cake", ["cat", "bag", "map"], "cake has a-e and the final e is silent.", ["Read the words.", "Find a-e.", "Choose cake."], "自然拼读", "原创补充开音节。"),
    judge("orig-g4-en-phonics-002", "The final e in bike is usually silent.", "对", "bike 中末尾 e 不单独发音。", ["Read bike.", "Notice final e.", "Judge the sound."], "silent e 判断", "原创补充拼读判断。")
  ]);

  add("e4-pattern-location-time", [
    choice("orig-g4-en-pattern-001", "You want to ask the time. What should you say?", "What time is it?", ["Where is my bag?", "How much is it?", "What colour is it?"], "What time is it? asks about time.", ["Read the situation.", "Find time question.", "Choose it."], "情景交际", "原创补充句型问答。"),
    text("orig-g4-en-pattern-002", "Complete: ___ is the library?", "Where", "Where asks about place.", ["Ask about place.", "Use Where.", "Complete the question."], "地点问句", "原创补充句型填空。", ["Where", "where"])
  ]);

  add("e4-grammar-plural-pronoun", [
    choice("orig-g4-en-grammar-001", "Choose: These ___ my books.", "are", ["is", "am", "be"], "These is plural, so use are.", ["Find These.", "Use plural be verb.", "Choose are."], "复数语法", "原创补充英语语法。"),
    judge("orig-g4-en-grammar-002", "We say They are friends.", "对", "They 后面用 are。", ["Find They.", "Use are.", "Judge correct."], "代词判断", "原创补充语法判断。")
  ]);

  add("e4-reading-notice", [
    choice("orig-g4-en-reading-001", "Read: Art Club is in Room 302. Where is Art Club?", "In Room 302.", ["On Friday.", "At 8:00.", "It is rainy."], "Where asks about place, and the sentence says Room 302.", ["Read the question.", "Find the place.", "Choose Room 302."], "通知阅读", "原创补充英语阅读。"),
    choice("orig-g4-en-reading-002", "Read: The coat is 80 yuan. How much is the coat?", "80 yuan.", ["8 o'clock.", "Room 80.", "80 students."], "How much asks about price.", ["Find the price.", "Match the question.", "Choose 80 yuan."], "购物阅读", "原创补充英语信息定位。")
  ]);

  // 额外原创题，避免后续删改时跌破维护门槛。
  add("g4-area", [
    judge("orig-g4-math-area-003", "面积单位和长度单位不能随便混用。", "对", "面积用平方厘米、平方米等单位，长度用厘米、米等单位。", ["区分长度。", "区分面积。", "判断单位。"], "面积单位判断", "原创补充面积易错点。")
  ]);
  add("e4-reading-notice", [
    text("orig-g4-en-reading-003", "Read: Class starts at 8:00. What time does class start?", "8:00", "The sentence says starts at 8:00.", ["Read the sentence.", "Find the time.", "Write 8:00."], "时间信息定位", "原创补充英语阅读填空。", ["8:00", "8 o'clock"])
  ]);

  window.MathCampGrade4OriginalQuestionSeeds = {
    BANK
  };
})();
