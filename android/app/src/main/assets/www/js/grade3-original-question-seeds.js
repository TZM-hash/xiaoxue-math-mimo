(function () {
  "use strict";

  const BANK = {};

  function source(note) {
    return {
      kind: "codexOriginal",
      name: "Codex original grade 3 expansion",
      url: "codex-original:grade3-question-expansion",
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

  // 数学原创题：围绕三年级万以内计算、周长、分数、统计和应用题补充。
  add("g3-multi-add", [
    text("orig-g3-math-multiadd-001", "计算 436 + 287 = ?", "723", "相同数位对齐，个位满十进 1。", ["个位 6 + 7 = 13。", "十位 3 + 8 + 1 = 12。", "百位 4 + 2 + 1 = 7。"], "万以内进位加法", "原创补充三位数进位加法。"),
    choice("orig-g3-math-multiadd-002", "估算 699 - 298，下面哪个结果最合理？", "约 400", ["约 100", "约 900", "约 40"], "699 接近 700，298 接近 300，700 - 300 = 400。", ["把数看成整百。", "做估算。", "选择约 400。"], "减法估算", "原创补充万以内估算。")
  ]);

  add("g3-vertical", [
    text("orig-g3-math-vertical-001", "用竖式思路计算 218 × 3 = ?", "654", "从个位乘起，3 × 8 = 24 进 2，逐位相乘。", ["个位乘。", "十位乘并加进位。", "百位乘并加进位。"], "乘法竖式", "原创补充多位乘一位数。"),
    choice("orig-g3-math-vertical-002", "列竖式计算 408 - 159 时，个位 8 不够减 9，应该怎么做？", "向十位退 1，不够时继续向百位退", ["直接写 1", "把 159 改成 951", "只算百位"], "中间有 0 时需要连续退位。", ["先看个位。", "十位是 0，需要向百位退。", "再完成减法。"], "连续退位", "原创补充竖式易错点。")
  ]);

  add("g3-mul-div", [
    text("orig-g3-math-muldiv-001", "42 × 6 = ?", "252", "42 × 6 = 40 × 6 + 2 × 6 = 240 + 12 = 252。", ["拆成 40 和 2。", "分别乘 6。", "合起来。"], "两位数乘一位数", "原创补充乘法口算。"),
    choice("orig-g3-math-muldiv-002", "96 个苹果平均装进 4 个箱子，每箱几个？", "24 个", ["20 个", "92 个", "100 个"], "平均分用除法，96 ÷ 4 = 24。", ["找总数 96。", "找份数 4。", "用除法。"], "一位数除法应用", "原创补充除法应用。")
  ]);

  add("g3-two-step", [
    text("orig-g3-math-twostep-001", "每盒彩笔 18 支，买 4 盒后送出 15 支，还剩多少支？", "57", "先算 18 × 4 = 72，再算 72 - 15 = 57。", ["先求总数。", "再减送出。", "得 57。"], "乘减两步", "原创补充两步应用。"),
    choice("orig-g3-math-twostep-002", "学校买来 96 本书，先分给 3 个班，每班同样多，每班又捐出 5 本。每班还剩几本？正确算式是？", "96 ÷ 3 - 5", ["96 - 3 × 5", "96 ÷ 5 + 3", "96 + 3 - 5"], "先平均分到每班，再看每班捐出。", ["先除以 3。", "每班再减 5。", "选择除减算式。"], "除减两步", "原创补充两步列式。")
  ]);

  add("g3-remainder", [
    text("orig-g3-math-rem-001", "38 ÷ 5 = ? 余 ?（请写成“7余3”这样的形式）", "7余3", "5 × 7 = 35，38 - 35 = 3。", ["试商 7。", "乘回去是 35。", "余 3。"], "有余数除法", "原创补充余数表达。", ["7余3", "7 余 3"]),
    choice("orig-g3-math-rem-002", "45 人坐车，每辆车坐 8 人，至少需要几辆车？", "6 辆", ["5 辆", "7 辆", "8 辆"], "45 ÷ 8 = 5 余 5，余下的人也要一辆车。", ["先除。", "有余数。", "商加 1。"], "进一法", "原创补充有余数应用。")
  ]);

  add("g3-perimeter", [
    text("orig-g3-math-perimeter-001", "长方形长 12 cm，宽 5 cm，周长是多少厘米？", "34", "长方形周长 = (12 + 5) × 2 = 34。", ["长宽相加。", "再乘 2。", "得 34。"], "长方形周长", "原创补充周长公式。"),
    choice("orig-g3-math-perimeter-002", "正方形边长 9 米，周长是多少？", "36 米", ["18 米", "81 米", "13 米"], "正方形周长 = 边长 × 4，9 × 4 = 36。", ["找到边长。", "乘 4。", "写单位。"], "正方形周长", "原创补充正方形周长。")
  ]);

  add("g3-unit", [
    text("orig-g3-math-unit-001", "3 千米 = ? 米。", "3000", "1 千米 = 1000 米，3 千米 = 3000 米。", ["记住进率。", "3 个 1000。", "填 3000。"], "长度换算", "原创补充千米米换算。"),
    choice("orig-g3-math-unit-002", "一节课 40 分钟，9:00 开始，什么时候结束？", "9:40", ["9:04", "10:00", "8:40"], "9:00 经过 40 分钟是 9:40。", ["从 9:00 开始。", "加 40 分钟。", "得到 9:40。"], "经过时间", "原创补充时间应用。")
  ]);

  add("g3-fraction-intro", [
    text("orig-g3-math-fraction-001", "把一个圆平均分成 6 份，涂其中 1 份，涂色部分是几分之一？", "1/6", "平均分成 6 份，其中 1 份是 1/6。", ["确认平均分。", "总份数作分母。", "取 1 份。"], "几分之一", "原创补充分数初步。", ["1/6", "六分之一"]),
    choice("orig-g3-math-fraction-002", "同分母分数 2/8 + 3/8 等于多少？", "5/8", ["5/16", "6/8", "1/8"], "同分母相加，分母不变，分子相加。", ["分母 8 不变。", "2 + 3 = 5。", "结果是 5/8。"], "同分母加法", "原创补充分数加法。")
  ]);

  add("g3-statistics", [
    text("orig-g3-math-stat-001", "统计表中三(1)班有 32 人，三(2)班有 35 人，两个班一共有多少人？", "67", "32 + 35 = 67。", ["读出两个数据。", "求合计用加法。", "得到 67。"], "统计表合计", "原创补充读表合计。"),
    choice("orig-g3-math-stat-002", "读统计表时，想知道“最多”的项目，应该怎么做？", "比较同一列或同一行的数据大小", ["只看表格颜色", "只看第一格", "不看标题"], "最多最少要在同类数据中比较。", ["看清行列标题。", "比较数据。", "找最大。"], "统计比较", "原创补充统计方法。")
  ]);

  add("g3-word-two-step", [
    text("orig-g3-math-word-001", "水果店运来 5 箱橘子，每箱 24 个，卖出 38 个，还剩多少个？", "82", "先算 24 × 5 = 120，再算 120 - 38 = 82。", ["先求总数。", "再减卖出。", "回答还剩。"], "两步应用题", "原创补充生活应用。"),
    choice("orig-g3-math-word-002", "小红有 16 张贴纸，小明的贴纸数是小红的 3 倍。两人一共有多少张？第一步先算什么？", "小明有多少张", ["小红少几张", "贴纸颜色", "一共有几个人"], "要求两人一共，小明数量未知，要先求小明。", ["读最后问题。", "找未知量。", "先求小明。"], "倍数应用", "原创补充倍的认识。")
  ]);

  add("g3-reading", [
    choice("orig-g3-math-reading-001", "题目：操场有 84 人，离开 27 人，其中女生有 35 人。求操场还剩多少人，哪个条件是干扰信息？", "女生有 35 人", ["操场有 84 人", "离开 27 人", "84 和 27"], "求总人数剩余，只用 84 和 27。", ["看问题。", "找有用条件。", "排除女生人数。"], "干扰条件", "原创补充读题筛选。"),
    judge("orig-g3-math-reading-002", "做应用题时，先读问题再找条件，有助于减少乱用数字。", "对", "问题决定需要哪些条件。", ["先看问什么。", "再圈条件。", "列式。"], "读题策略", "原创补充审题方法。")
  ]);

  add("g3-thinking", [
    text("orig-g3-math-thinking-001", "找规律：4，9，14，19，下一个数是多少？", "24", "每次加 5，19 + 5 = 24。", ["比较相邻数。", "发现每次加 5。", "继续加。"], "数列规律", "原创补充规律题。"),
    choice("orig-g3-math-thinking-002", "甲比乙多 10 张卡片，甲给乙几张后两人一样多？", "5 张", ["10 张", "2 张", "20 张"], "给 5 张后，甲少 5、乙多 5，差距减少 10。", ["看差是 10。", "给出一张差距减少 2。", "10 的一半是 5。"], "移多补少", "原创补充思维题。")
  ]);

  add("g3-appendix", [
    choice("orig-g3-math-appendix-001", "红黄蓝绿按顺序循环，第 18 个是什么颜色？", "黄", ["红", "蓝", "绿"], "4 个一组，18 ÷ 4 余 2，第 2 个是黄。", ["找循环组。", "算余数。", "对应颜色。"], "周期规律", "原创补充附加题。"),
    text("orig-g3-math-appendix-002", "4 件上衣和 3 条裤子，每次选 1 件上衣和 1 条裤子，一共有几种搭配？", "12", "4 × 3 = 12 种。", ["上衣 4 种。", "裤子 3 种。", "相乘。"], "搭配计数", "原创补充搭配题。")
  ]);

  // 语文原创题：围绕三年级词句段运用、阅读、古诗和习作片段补充。
  add("c3-word-meaning", [
    choice("orig-g3-cn-word-001", "材料：他观察得很仔细，连叶子边上的小水珠都画了下来。“仔细”的意思最接近哪一个？", "认真细致", ["非常着急", "声音响亮", "颜色鲜艳"], "连小水珠都画下来，说明观察认真细致。", ["联系上下文。", "抓动作细节。", "判断词义。"], "语境词义", "原创补充三年级语境词义。"),
    text("orig-g3-cn-word-002", "写出“热闹”的反义词。", "安静", "热闹表示人多声杂，反义词可以是安静。", ["理解热闹。", "找相反意思。", "写安静。"], "反义词", "原创补充词语积累。", ["安静", "冷清"])
  ]);

  add("c3-sentence-transform", [
    choice("orig-g3-cn-sentence-001", "把“妹妹把花瓶擦干净了。”改为被字句，正确的是？", "花瓶被妹妹擦干净了。", ["妹妹被花瓶擦干净了。", "擦干净被妹妹花瓶。", "花瓶把妹妹擦干净了。"], "被字句要把受事“花瓶”放前面。", ["找动作对象。", "用被字句。", "保持意思。"], "被字句", "原创补充句式转换。"),
    judge("orig-g3-cn-sentence-002", "改写句子时，主要意思要和原句保持一致。", "对", "句式变了，意思不能变。", ["读原句。", "改写。", "核对意思。"], "句式方法", "原创补充句式判断。")
  ]);

  add("c3-rhetoric", [
    choice("orig-g3-cn-rhetoric-001", "“小溪唱着歌向前跑去。”使用了什么修辞？", "拟人", ["比喻", "反问", "排比"], "把小溪写成人会唱歌、会跑，是拟人。", ["找人的动作。", "判断对象。", "选择拟人。"], "拟人", "原创补充修辞识别。"),
    choice("orig-g3-cn-rhetoric-002", "下面哪一句是比喻句？", "天上的云像一群白羊。", ["我像昨天一样早起。", "他好像知道答案。", "这里像学校。"], "把云比作白羊，有相似点。", ["找本体和喻体。", "判断是否打比方。", "选择比喻句。"], "比喻", "原创补充比喻辨析。")
  ]);

  add("c3-paragraph-reading", [
    choice("orig-g3-cn-reading-001", "材料：海边真热闹。有人堆沙堡，有人捡贝壳，还有人在浅水边嬉戏。题目：这段主要写什么？", "海边真热闹", ["贝壳很硬", "沙堡很高", "天气很冷"], "第一句总写海边真热闹，后面都是具体活动。", ["读完整段。", "找中心句。", "概括段意。"], "段意概括", "原创补充段落阅读。"),
    judge("orig-g3-cn-reading-002", "概括段意时，不能只抓一个小细节代替整段意思。", "对", "段意要看整段主要内容。", ["读整段。", "分清细节和中心。", "概括主要意思。"], "阅读方法", "原创补充阅读判断。")
  ]);

  add("c3-writing-piece", [
    choice("orig-g3-cn-writing-001", "围绕“教室真安静”写片段，下面哪个材料最合适？", "同学们低头写字，只听见笔尖沙沙声", ["操场上有人踢球", "厨房飘来香味", "小河里有鱼"], "笔尖沙沙声能表现教室安静。", ["看中心意思。", "判断材料是否相关。", "选择教室场景。"], "围绕中心", "原创补充习作片段。"),
    judge("orig-g3-cn-writing-002", "写观察记录时，按时间顺序写变化会更清楚。", "对", "时间顺序能呈现变化过程。", ["记录时间。", "写变化。", "按顺序表达。"], "观察记录", "原创补充表达方法。")
  ]);

  add("c3-poem", [
    choice("orig-g3-cn-poem-001", "读诗句“霜叶红于二月花”，主要写到了什么颜色？", "红色", ["黑色", "蓝色", "白色"], "诗句中的“红”直接写出颜色。", ["读诗句。", "抓颜色词。", "选择红色。"], "古诗关键词", "原创补充古诗理解。"),
    judge("orig-g3-cn-poem-002", "理解古诗时，可以抓景物词来想象画面。", "对", "景物词能帮助理解诗句画面。", ["找景物。", "想象画面。", "理解诗意。"], "古诗方法", "原创补充古诗方法。")
  ]);

  add("c3-accumulation", [
    choice("orig-g3-cn-acc-001", "“三个臭皮匠，顶个诸葛亮”说明什么？", "团结合作力量大", ["天气变化快", "颜色很鲜艳", "东西很便宜"], "这句谚语强调大家合作能想出好办法。", ["读谚语。", "理解意思。", "选择团结合作。"], "谚语理解", "原创补充日积月累。"),
    choice("orig-g3-cn-acc-002", "下面哪个成语含有人体部位？", "摇头晃脑", ["春暖花开", "万物复苏", "秋高气爽"], "摇头晃脑中有头、脑。", ["读成语。", "找人体部位。", "选择摇头晃脑。"], "成语分类", "原创补充成语积累。")
  ]);

  add("c3-practice", [
    choice("orig-g3-cn-practice-001", "介绍植物观察活动，哪一项最应该写清？", "观察对象和发现", ["铅笔价格", "电视节目", "鞋子颜色"], "观察活动要围绕观察对象和发现表达。", ["确定主题。", "写观察对象。", "写发现。"], "综合实践表达", "原创补充实践表达。"),
    judge("orig-g3-cn-practice-002", "小组交流时，认真听别人发言也是重要能力。", "对", "交流既要表达，也要倾听。", ["听别人发言。", "理解观点。", "再补充。"], "口语交际", "原创补充实践判断。")
  ]);

  // 英语原创题：围绕三年级起点英语词汇、字母、句型、语法和短对话补充。
  add("e3-vocabulary-school", [
    choice("orig-g3-en-vocab-001", "Which word means 铅笔?", "pencil", ["duck", "red", "mouth"], "pencil means 铅笔.", ["Read the Chinese meaning.", "Match the English word.", "Choose pencil."], "词汇理解", "原创补充英语词汇。"),
    text("orig-g3-en-vocab-002", "Write the English word for 红色.", "red", "red means 红色.", ["Read the Chinese meaning.", "Recall the colour word.", "Write red."], "颜色词拼写", "原创补充英语拼写。", ["red", "Red"])
  ]);

  add("e3-phonics-short-vowels", [
    choice("orig-g3-en-phonics-001", "Which word starts with /c/?", "cat", ["dog", "apple", "face"], "cat starts with c.", ["Say each word.", "Listen to the first sound.", "Choose cat."], "首音判断", "原创补充自然拼读。"),
    text("orig-g3-en-phonics-002", "Complete: A, B, __.", "C", "The alphabet order is A, B, C.", ["Read A and B.", "Recall the next letter.", "Write C."], "字母顺序", "原创补充字母题。", ["C", "c"])
  ]);

  add("e3-pattern-greetings", [
    choice("orig-g3-en-pattern-001", "You meet a friend. What can you say?", "Hello!", ["It is a duck.", "Show me blue.", "I see a ruler."], "Hello is a greeting.", ["Read the situation.", "Choose a greeting.", "Say Hello."], "问候语", "原创补充英语句型。"),
    text("orig-g3-en-pattern-002", "Complete: What ___ your name?", "is", "The question is What is your name?", ["Read the pattern.", "Use is.", "Complete the question."], "姓名问句", "原创补充问答句。", ["is"])
  ]);

  add("e3-grammar-basic-be", [
    choice("orig-g3-en-grammar-001", "Choose: I ___ Mike.", "am", ["is", "are", "be"], "I goes with am.", ["Find I.", "Choose am.", "Read the sentence."], "be 动词", "原创补充英语语法。"),
    judge("orig-g3-en-grammar-002", "We say It is a dog.", "对", "It 后面用 is。", ["Find It.", "Use is.", "The sentence is correct."], "be 动词判断", "原创补充英语判断。")
  ]);

  add("e3-reading-dialogue", [
    choice("orig-g3-en-reading-001", "Read: Hello, I'm Amy. Who is speaking?", "Amy", ["Mike", "John", "Sarah"], "The sentence says I'm Amy.", ["Read the sentence.", "Find the name.", "Choose Amy."], "短句信息定位", "原创补充英语阅读。"),
    choice("orig-g3-en-reading-002", "Read: I see a yellow duck. What colour is the duck?", "yellow", ["red", "blue", "black"], "The sentence says yellow duck.", ["Find the colour word.", "Match the question.", "Choose yellow."], "颜色阅读", "原创补充英语短文定位。")
  ]);

  window.MathCampGrade3OriginalQuestionSeeds = {
    BANK
  };
})();
