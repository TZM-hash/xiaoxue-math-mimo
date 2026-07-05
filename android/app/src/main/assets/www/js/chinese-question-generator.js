(function () {
  "use strict";

  function choose(deps, items) {
    return deps && typeof deps.pick === "function" ? deps.pick(items) : items[Math.floor(Math.random() * items.length)];
  }

  function uid(deps) {
    return deps && typeof deps.uid === "function" ? deps.uid("cq") : `cq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function baseQuestion(deps, point, data) {
    return {
      id: uid(deps),
      subject: "chinese",
      grade: point.grade,
      pointId: point.id,
      topic: point.topic,
      kind: point.label,
      templateType: data.templateType || point.label,
      curriculumBand: point.curriculum && point.curriculum.band,
      sourceType: point.sourceType || data.sourceType || "abilityLine",
      sourceLabel: point.sourceLabel || data.sourceLabel || "",
      subskills: [point.short, point.label].filter(Boolean).slice(0, 3),
      commonPitfalls: data.commonPitfalls || [],
      ...data
    };
  }

  function objectiveChoice(point, spec) {
    const options = [spec.correct, ...spec.wrongs].slice(0, 4);
    const labels = ["A", "B", "C", "D"];
    const aliases = Array.isArray(spec.aliases) ? spec.aliases : [];
    return {
      text: `${spec.prompt}\n${options.map((option, index) => `${labels[index]}. ${option}`).join("\n")}`,
      answerType: "choice",
      answer: "A",
      acceptedAnswers: ["A", spec.correct, `A.${spec.correct}`, `A. ${spec.correct}`, ...aliases],
      answerLabel: `A. ${spec.correct}`,
      questionType: spec.questionType || "选择题",
      explanation: spec.explanation,
      steps: spec.steps || [
        `先确认本题考查“${point.label}”。`,
        "再逐项比较选项和题目要求。",
        "选择最符合知识点规则的一项。"
      ],
      commonPitfalls: spec.commonPitfalls || []
    };
  }

  function objectiveInput(point, spec) {
    const answer = String(spec.correct || "").trim();
    return {
      text: spec.prompt,
      answerType: "text",
      answer,
      acceptedAnswers: answer ? [answer] : [],
      answerLabel: answer,
      questionType: spec.questionType || "直接输入",
      explanation: spec.explanation,
      steps: spec.steps || [
        `先读材料，确认本题考查“${point.label}”。`,
        "再根据语境判断唯一要填写的汉字或词语。",
        "最后只输入答案本身，不输入选项字母。"
      ],
      commonPitfalls: spec.commonPitfalls || []
    };
  }

  const POINT_SPECS = {
    "c1-pinyin": {
      prompt: "【拼音认读与拼写】“妈”的正确拼音是哪一个？",
      correct: "mā",
      wrongs: ["má", "nā", "mō"],
      aliases: ["ma1", "mā"],
      explanation: "“妈”读第一声 mā，声母是 m，韵母是 a。",
      commonPitfalls: ["声调混淆", "声母 m 和 n 混淆"]
    },
    "c1-character": {
      prompt: "【识字写字入门】“明”字的结构判断正确的是哪一项？",
      correct: "左右结构，由“日”和“月”组成",
      wrongs: ["上下结构，由“木”和“月”组成", "独体字，没有偏旁", "半包围结构"],
      explanation: "“明”左边是“日”，右边是“月”，属于左右结构。",
      commonPitfalls: ["结构判断错误", "偏旁看漏"]
    },
    "c1-word": {
      prompt: "【词语积累】“一（ ）花”中量词最合适的是哪一个？",
      correct: "朵",
      wrongs: ["只", "条", "本"],
      explanation: "花通常用量词“朵”，应说“一朵花”。",
      commonPitfalls: ["量词搭配错误"]
    },
    "c1-sentence": {
      prompt: "【句子入门】下面哪一句把话说完整了？",
      correct: "小鸟在树上唱歌。",
      wrongs: ["小鸟在。", "树上唱。", "唱歌小鸟树。"],
      explanation: "完整句要说清谁在哪里做什么。",
      commonPitfalls: ["句子缺少人物或动作"]
    },
    "c1-reading": {
      prompt: "【短文阅读启蒙】短文写“小兔把萝卜送给奶奶”。小兔做了什么？",
      correct: "把萝卜送给奶奶",
      wrongs: ["去河边钓鱼", "把书放进书包", "在树下睡觉"],
      explanation: "题目问小兔做的事，应回到短文直接找动作。",
      commonPitfalls: ["人物动作对应错误"]
    },
    "c1-poem": {
      prompt: "【古诗积累】“床前明月光”写到的景物是哪一个？",
      correct: "明月光",
      wrongs: ["春风", "荷花", "白雪"],
      explanation: "诗句里直接出现“明月光”，写的是月光。",
      commonPitfalls: ["只凭印象乱选"]
    },
    "c1-picture": {
      prompt: "【看图说话】看图说话先要说清什么？",
      correct: "谁在哪里做什么",
      wrongs: ["天气怎么样", "物品有几种", "故事有什么道理"],
      explanation: "低年级看图说话先抓人物、地点和事情。",
      commonPitfalls: ["画面信息不完整"]
    },
    "c1-expression": {
      prompt: "【口语表达】向同学借橡皮时，哪句话最有礼貌？",
      correct: "请问可以借我用一下橡皮吗？",
      wrongs: ["快把橡皮给我", "橡皮拿来", "我不要说话"],
      explanation: "请求别人帮助时要使用礼貌用语。",
      commonPitfalls: ["请求表达不礼貌"]
    },
    "c2-sound-shape": {
      prompt: "【字音字形】下面哪组形近字搭配正确？",
      correct: "晴天的“晴”是日字旁",
      wrongs: ["清水的“清”是日字旁", "请客的“请”是木字旁", "情感的“情”是三点水"],
      explanation: "“晴”和太阳有关，是日字旁。",
      commonPitfalls: ["形近字偏旁混淆"]
    },
    "c2-word-match": {
      prompt: "【词语搭配】下面哪个搭配最恰当？",
      correct: "灿烂的阳光",
      wrongs: ["灿烂的铅笔", "奔跑的桌子", "香甜的石头"],
      explanation: "“灿烂”常用来形容阳光、笑容等。",
      commonPitfalls: ["词语搭配不当"]
    },
    "c2-sentence": {
      prompt: "【句子训练】把“花开了”扩句，哪一句更具体通顺？",
      correct: "公园里的桃花慢慢开了。",
      wrongs: ["花开。", "开了花公园慢慢。", "桃花公园的了。"],
      explanation: "扩句要补充合适的信息，同时保持语序通顺。",
      commonPitfalls: ["扩句后语序混乱"]
    },
    "c2-punctuation": {
      prompt: "【标点与语气】“你今天去图书馆吗”句末应使用什么标点？",
      correct: "？",
      wrongs: ["。", "，", "、"],
      explanation: "这句话是在提问，句末应该用问号。",
      commonPitfalls: ["疑问句错用句号"]
    },
    "c2-reading": {
      prompt: "【短文阅读】短文说“小雨先写作业，再收拾书包”。小雨先做什么？",
      correct: "写作业",
      wrongs: ["收拾书包", "去操场跑步", "看电视"],
      explanation: "题目问“先做什么”，要抓表示顺序的“先”。",
      commonPitfalls: ["顺序词看错"]
    },
    "c2-poem": {
      prompt: "【古诗积累】“春眠不觉晓”写的是哪个季节？",
      correct: "春天",
      wrongs: ["夏天", "秋天", "冬天"],
      explanation: "诗句开头就是“春眠”，写的是春天。",
      commonPitfalls: ["诗句关键词没抓住"]
    },
    "c2-picture-writing": {
      prompt: "【看图写话】看图写话按顺序表达，哪一项最合适？",
      correct: "先写时间地点，再写人物做事",
      wrongs: ["先写感受，再写天气变化", "先写道理，再写书名作者", "先写标点，再写拼音声调"],
      explanation: "看图写话要按画面顺序写清楚。",
      commonPitfalls: ["表达没有顺序"]
    },
    "c2-usage": {
      prompt: "【综合语用】写留言条时，最需要写清楚的是哪一项？",
      correct: "留言给谁、什么事、谁留言",
      wrongs: ["人物外貌和景物", "故事开头和结尾", "拼音声母和韵母"],
      explanation: "留言条要把对象、事情和署名写清楚。",
      commonPitfalls: ["应用文要素缺失"]
    },
    "c3-word-meaning": {
      prompt: "【字词辨析】“他听得很认真”中“认真”的近义词是哪一个？",
      correct: "仔细",
      wrongs: ["热闹", "明亮", "慌忙"],
      explanation: "“认真”和“仔细”都表示不马虎。",
      commonPitfalls: ["不联系语境理解词义"]
    },
    "c3-sentence-transform": {
      prompt: "【句式转换】“小明把书放进书包。”改成被字句正确的是哪一项？",
      correct: "书被小明放进书包。",
      wrongs: ["小明被书放进书包。", "书把小明放进书包。", "放进书包小明书。"],
      explanation: "被字句要把原来被处理的事物“书”放到前面。",
      commonPitfalls: ["把施事和受事颠倒"]
    },
    "c3-rhetoric": {
      prompt: "【修辞初步】“弯弯的月亮像小船”使用了哪种修辞？",
      correct: "比喻",
      wrongs: ["排比", "反问", "夸张"],
      explanation: "句中用“像”把月亮比作小船，是比喻。",
      commonPitfalls: ["修辞名称混淆"]
    },
    "c3-paragraph-reading": {
      prompt: "【段落阅读】一段话围绕“公园真美”写花、树和小湖，这段主要写什么？",
      correct: "公园真美",
      wrongs: ["小明去买书", "天气很冷", "教室很安静"],
      explanation: "花、树、小湖都围绕“公园真美”展开。",
      commonPitfalls: ["只抓细节不概括中心"]
    },
    "c3-writing-piece": {
      prompt: "【习作片段】围绕“校园真热闹”这个意思，下面哪一句最具体？",
      correct: "操场上，同学们有的跳绳，有的跑步，还有的踢球。",
      wrongs: ["校园真热闹。", "我很喜欢校园。", "今天是星期三。"],
      explanation: "具体片段要围绕中心写出画面和活动。",
      commonPitfalls: ["只重复中心句"]
    },
    "c3-poem": {
      prompt: "【古诗理解】“遥知不是雪，为有暗香来”写的是哪种植物？",
      correct: "梅花",
      wrongs: ["荷花", "菊花", "桃花"],
      explanation: "这两句出自写梅花的诗，“暗香”是关键。",
      commonPitfalls: ["只看“雪”误判"]
    },
    "c3-accumulation": {
      prompt: "【课内外积累】“亡羊补牢”告诉我们的意思是哪一个？",
      correct: "出了问题及时补救还不晚",
      wrongs: ["羊越多越好", "门不用修", "只要跑得快"],
      explanation: "成语积累要理解故事背后的意思。",
      commonPitfalls: ["只看字面意思"]
    },
    "c3-practice": {
      prompt: "【综合实践表达】观察记录植物变化，哪一项最适合写进记录？",
      correct: "今天新长出两片嫩绿的叶子",
      wrongs: ["我今天去了操场跑步", "这本书的插图很好看", "妈妈做的晚饭很香"],
      explanation: "观察记录要写清具体变化。",
      commonPitfalls: ["记录空泛"]
    },
    "c4-word-sentence": {
      prompt: "【词句段运用】“终于”放入哪一句最能表现等待后的结果？",
      correct: "等了很久，公交车终于来了。",
      wrongs: ["我终于正在吃饭。", "终于蓝色很高。", "书包终于桌子。"],
      explanation: "“终于”表示经过等待或努力后出现结果。",
      commonPitfalls: ["词语语境不匹配"]
    },
    "c4-sick-sentence": {
      prompt: "【病句修改】下面哪一句没有语病？",
      correct: "我们认真完成了作业。",
      wrongs: ["我们认真作业完成了。", "通过努力，使我进步了。", "他大约一定会来。"],
      explanation: "A 句成分完整、搭配恰当、语序通顺。",
      commonPitfalls: ["成分残缺", "语序不当"]
    },
    "c4-rhetoric-punctuation": {
      prompt: "【修辞与标点】“这朵花笑弯了腰。”主要使用了哪种修辞？",
      correct: "拟人",
      wrongs: ["设问", "排比", "反问"],
      explanation: "把花当作人来写，说它“笑弯了腰”，是拟人。",
      commonPitfalls: ["修辞和标点混淆"]
    },
    "c4-modern-reading": {
      prompt: "【现代文阅读】短文写妈妈冒雨送伞，最能体现妈妈什么特点？",
      correct: "关心孩子",
      wrongs: ["喜欢画画", "害怕读书", "不爱出门"],
      explanation: "人物行为“冒雨送伞”体现关心。",
      commonPitfalls: ["人物特点概括不准"]
    },
    "c4-writing-topic": {
      prompt: "【习作审题】题目是“记一次难忘的活动”，选材最合适的是哪一项？",
      correct: "写参加校园运动会接力赛的经过",
      wrongs: ["介绍一种文具的用途", "默写一首古诗", "记录一顿普通午饭"],
      explanation: "审题要抓“活动”和“难忘”。",
      commonPitfalls: ["选材跑题"]
    },
    "c4-poem-classic": {
      prompt: "【古诗文积累】“不识庐山真面目，只缘身在此山中”告诉我们什么？",
      correct: "看问题有时要跳出局部",
      wrongs: ["山里没有路", "庐山没有景色", "只要低头走路"],
      explanation: "诗句借看山说明认识事物要有整体角度。",
      commonPitfalls: ["诗意理解停留字面"]
    },
    "c4-info-reading": {
      prompt: "【资料提取】通知写“周五下午三点在操场集合”，集合地点是哪里？",
      correct: "操场",
      wrongs: ["图书馆", "教室", "校门口"],
      explanation: "资料提取题要从材料中直接定位地点。",
      commonPitfalls: ["时间地点混淆"]
    },
    "c4-usage": {
      prompt: "【综合语用】写通知时，下面哪项信息最必须写清？",
      correct: "时间、地点、事情、通知对象",
      wrongs: ["人物外貌和心情", "景物样子和声音", "古诗题目和作者"],
      explanation: "通知属于应用文，要素必须清楚。",
      commonPitfalls: ["应用文格式要素缺失"]
    },
    "c5-context-word": {
      prompt: "【语境词语】“他郑重地接过奖状”中“郑重”最接近哪种意思？",
      correct: "严肃认真",
      wrongs: ["轻松随意", "慌张急促", "幽默风趣"],
      explanation: "结合“接过奖状”的语境，“郑重”表示严肃认真。",
      commonPitfalls: ["脱离语境解释词义"]
    },
    "c5-paragraph-structure": {
      prompt: "【句段篇章】一段先总写“秋天很美”，再写田野、果园、小河，这是哪种结构？",
      correct: "总分结构",
      wrongs: ["倒叙结构", "并列字词", "问答格式"],
      explanation: "先总说，再分写几个方面，是总分结构。",
      commonPitfalls: ["段落关系判断错误"]
    },
    "c5-reading": {
      prompt: "【阅读理解】文章反复写老人的微笑，最可能是在表现什么？",
      correct: "老人亲切乐观",
      wrongs: ["老人很生气", "老人不会说话", "老人讨厌孩子"],
      explanation: "人物神态反复出现，通常服务于人物特点。",
      commonPitfalls: ["表达方法和内容割裂"]
    },
    "c5-expository-reading": {
      prompt: "【说明与叙事阅读】说明文介绍“竹子的生长特点”，阅读时应先抓什么？",
      correct: "说明对象和特点",
      wrongs: ["人物对话", "诗人情感", "故事结局"],
      explanation: "说明文阅读先抓说明对象，再找特点。",
      commonPitfalls: ["文体阅读方法混用"]
    },
    "c5-writing-structure": {
      prompt: "【习作结构】写“我的植物朋友”，重点段最适合写什么？",
      correct: "植物的样子、变化和自己的观察",
      wrongs: ["比赛经过和比分", "人物语言和动作", "通知时间和地点"],
      explanation: "习作重点段要围绕题目展开具体内容。",
      commonPitfalls: ["重点段空泛"]
    },
    "c5-classic": {
      prompt: "【古诗文与文言启蒙】文言词“曰”通常是什么意思？",
      correct: "说",
      wrongs: ["跑", "看", "吃"],
      explanation: "文言启蒙中，“曰”常解释为“说”。",
      commonPitfalls: ["常见文言词不熟"]
    },
    "c5-book-reading": {
      prompt: "【整本书阅读】评价一个人物形象，最应该依据什么？",
      correct: "人物的具体言行和情节",
      wrongs: ["故事发生的季节", "章节标题的长短", "插图出现的位置"],
      explanation: "整本书阅读要用情节和言行支撑人物评价。",
      commonPitfalls: ["评价没有依据"]
    },
    "c5-integrated": {
      prompt: "【综合运用】读两则材料后表达观点，最重要的是哪一项？",
      correct: "观点明确，并能引用材料依据",
      wrongs: ["罗列人物名字", "描写天气变化", "复述个人经历"],
      explanation: "材料表达要有观点，也要有材料依据。",
      commonPitfalls: ["观点和材料脱节"]
    },
    "c6-language-basic": {
      prompt: "【语基综合】下面哪一项同时做到字词和标点都正确？",
      correct: "同学们认真复习，准备迎接考试。",
      wrongs: ["同学们认针复习，准备迎接考试。", "同学们认真复习？准备迎接考试？", "同学们认真复习准备，迎接。"],
      explanation: "A 项字词正确，逗号和句号使用也合适。",
      commonPitfalls: ["语基综合检查不全面"]
    },
    "c6-reading-strategy": {
      prompt: "【阅读策略】快速了解文章主要内容时，最适合先做什么？",
      correct: "浏览标题、开头、结尾和关键句",
      wrongs: ["逐字精读每个词语", "先摘抄全部生字", "先分析所有修辞"],
      explanation: "浏览是一种快速把握内容的阅读策略。",
      commonPitfalls: ["阅读策略使用不当"]
    },
    "c6-view-summary": {
      prompt: "【观点概括】一段话先说“节约用水很重要”，后面列举理由，作者观点是什么？",
      correct: "节约用水很重要",
      wrongs: ["水龙头是银色的", "今天下雨了", "杯子很大"],
      explanation: "观点通常是作者明确表达的判断，理由用来支撑观点。",
      commonPitfalls: ["把例子当观点"]
    },
    "c6-writing-upgrade": {
      prompt: "【习作升格】让“我很开心”更具体，哪一句更好？",
      correct: "我捧着奖状，忍不住笑了起来。",
      wrongs: ["我很开心很开心。", "开心开心开心。", "天气是蓝色的。"],
      explanation: "习作升格要用动作、神态等细节表现心情。",
      commonPitfalls: ["表达空泛重复"]
    },
    "c6-classic": {
      prompt: "【古诗文言】理解古诗情感时，最应该结合什么？",
      correct: "关键词、画面和诗人表达的情感",
      wrongs: ["句子数量和行距", "人物外貌和动作", "通知格式和署名"],
      explanation: "古诗文理解要抓关键词和画面，再体会情感。",
      commonPitfalls: ["只翻译字面不体会情感"]
    },
    "c6-transition": {
      prompt: "【小升初综合】做语文综合题时，最合理的顺序是哪一项？",
      correct: "先审题，再定位材料，最后规范作答",
      wrongs: ["先写作文标题，再看材料", "先整理书包，再读题目", "先背古诗，再看要求"],
      explanation: "综合题要先明确要求，再到材料中找依据。",
      commonPitfalls: ["审题和定位脱节"]
    },
    "c6-famous-book": {
      prompt: "【名著阅读】分析名著人物形象时，哪一项最有依据？",
      correct: "结合人物经历、语言和行为分析",
      wrongs: ["根据故事发生季节分析", "根据章节数量分析", "根据插图位置分析"],
      explanation: "名著人物分析要基于情节、语言和行为。",
      commonPitfalls: ["人物分析没有文本依据"]
    },
    "c6-expression": {
      prompt: "【综合表达】演讲稿表达建议时，哪种写法更规范？",
      correct: "先提出观点，再说明理由和具体建议",
      wrongs: ["先写景物，再写人物外貌", "全篇复述活动经过", "主要介绍文具用途"],
      explanation: "综合表达要观点清楚、理由充分、建议具体。",
      commonPitfalls: ["观点不明确", "理由不充分"]
    }
  };

  const TEXTBOOK_EXAM_SPECS = {
    "c1-textbook-pinyin-initial-final": ["材料：音节“mā”由声母 m、韵母 a 和第一声组成。\n题目：“mā”的声母是哪一个？", "m", ["a", "ā", "mā"]],
    "c1-textbook-pinyin-tone": ["材料：mā、má、mǎ、mà 的声调不同。\n题目：“mǎ”是第几声？", "第三声", ["第一声", "第二声", "第四声"]],
    "c1-textbook-syllable-spelling": ["材料：“花”的读音是 huā。\n题目：“花”的正确拼音是哪一个？", "huā", ["hā", "fā", "hǎ"]],
    "c1-textbook-common-characters": ["材料：日、月、山、水都是常见汉字。\n题目：“山”表示哪一类事物？", "自然中的山", ["学习用品", "人物动作", "天气现象"]],
    "c1-textbook-stroke-order": ["材料：写“十”时，先写横，再写竖。\n题目：“十”的第一笔是什么？", "横", ["竖", "撇", "捺"]],
    "c1-textbook-radical-structure": ["材料：“明”左边是“日”，右边是“月”。\n题目：“明”是什么结构？", "左右结构", ["上下结构", "独体字", "半包围结构"]],
    "c1-textbook-quantifier-basic": ["材料：花通常说“一朵花”，书通常说“一本书”。\n题目：“一（ ）花”中应填哪个量词？", "朵", ["本", "条", "只"]],
    "c1-textbook-complete-sentence": ["材料：完整句要说清谁、在哪里、做什么。\n题目：下面哪一句表达完整？", "小鸟在树上唱歌。", ["小鸟在。", "树上唱。", "唱歌小鸟树。"]],
    "c1-textbook-picture-speaking": ["材料：图中小朋友在操场跳绳。\n题目：看图说话时，下面哪一句最清楚？", "小朋友在操场跳绳。", ["小朋友。", "在操场。", "跳绳操场小朋友。"]],
    "c1-textbook-short-reading-info": ["材料：小兔把萝卜送给奶奶。\n题目：小兔做了什么？", "把萝卜送给奶奶", ["去河边钓鱼", "把书放进书包", "在树下睡觉"]],

    "c2-textbook-sound-shape": ["材料：“晴”和太阳有关，“清”和水有关。\n题目：“晴天”的“晴”是什么偏旁？", "日字旁", ["三点水", "言字旁", "木字旁"]],
    "c2-textbook-polyphone": ["材料：“长大”和“长短”里的“长”读音不同。\n题目：“长大”中的“长”应读哪一个？", "zhǎng", ["cháng", "zhàng", "chǎn"]],
    "c2-textbook-word-collocation": ["材料：词语搭配要自然、合适。\n题目：下面哪个搭配最恰当？", "灿烂的阳光", ["灿烂的铅笔", "奔跑的桌子", "香甜的石头"]],
    "c2-textbook-synonym-antonym": ["材料：“高兴”和“快乐”意思接近。\n题目：“高兴”的近义词是哪一个？", "快乐", ["难过", "矮小", "安静"]],
    "c2-textbook-sentence-expansion": ["材料：扩句要让句子更具体，也要保持通顺。\n题目：把“花开了”扩句，哪一句最合适？", "公园里的桃花慢慢开了。", ["花开。", "开了花公园慢慢。", "桃花公园的了。"]],
    "c2-textbook-punctuation-tone": ["材料：“你今天去图书馆吗”是在提问。\n题目：这句话句末应使用什么标点？", "？", ["。", "！", "，"]],
    "c2-textbook-sequence-reading": ["材料：小雨先写作业，再收拾书包。\n题目：小雨先做什么？", "写作业", ["收拾书包", "去操场跑步", "看电视"]],
    "c2-textbook-cause-effect": ["材料：因为下雨，大家把活动改到教室里。\n题目：活动改到教室里的原因是什么？", "下雨", ["天气晴朗", "教室很新", "大家想画画"]],
    "c2-textbook-message-note": ["材料：小明给妈妈留言：我去图书馆了，下午四点回来。\n题目：这张留言条写清了什么？", "去了哪里和什么时候回来", ["活动感受和心情", "读书方法和书名", "人物外貌和动作"]],
    "c2-textbook-picture-writing-order": ["材料：图中小朋友先给小树浇水，再扶正小树，最后整理工具。\n题目：小朋友先做什么？", "给小树浇水", ["扶正小树", "整理工具", "回教室"]],

    "c3-textbook-context-word": ["材料：他听得很认真，还把重点记在本子上。\n题目：句中“认真”的意思最接近哪一个？", "专心、不马虎", ["高兴地笑", "跑得很快", "声音很大"]],
    "c3-textbook-sentence-transform": ["材料：小明把书放进书包。\n题目：改成“被”字句，哪一句正确？", "书被小明放进书包。", ["小明被书放进书包。", "书包被小明放进书。", "小明书包被放进书。"]],
    "c3-textbook-rhetoric-basic": ["材料：弯弯的月亮像小船。\n题目：这句话使用了什么修辞方法？", "比喻", ["拟人", "排比", "反问"]],
    "c3-textbook-paragraph-main": ["材料：公园真美。花儿开了，树木绿了，小湖亮晶晶的。\n题目：这段话主要写什么？", "公园真美", ["小湖很深", "树木会说话", "花儿需要浇水"]],
    "c3-textbook-reading-detail": ["材料：小鹿看见小伙伴口渴，就把自己的水让给了他。\n题目：小鹿做了什么？", "把水让给口渴的小伙伴", ["自己喝完了水", "跑去摘果子", "把书放进书包"]],
    "c3-textbook-poem-image": ["材料：“遥知不是雪，为有暗香来。”诗句写到洁白和香气。\n题目：诗句描写的是什么？", "梅花", ["荷花", "柳树", "小草"]],
    "c3-textbook-idiom-meaning": ["材料：羊丢了以后，主人及时修补羊圈。\n题目：这个故事说明的道理是哪一项？", "出了问题及时补救还不晚", ["羊越多越好", "门不用修", "跑得快最重要"]],
    "c3-textbook-observation-record": ["材料：豆芽第一天露白，第三天长出细根。\n题目：豆芽第三天有什么变化？", "长出细根", ["开出红花", "变成石头", "飞到树上"]],
    "c3-textbook-around-one-idea": ["材料：操场真热闹。同学们有的跳绳，有的跑步，还有的踢球。\n题目：这几句话围绕哪一个意思写？", "操场真热闹", ["天气真冷", "教室很安静", "书包很重"]],
    "c3-textbook-practical-expression": ["材料：介绍一次植物观察活动，要说清时间、发现和感受。\n题目：下面哪一项最适合写进介绍里？", "我周三发现豆芽长出了细根，很惊喜。", ["我喜欢蓝色。", "今天的铅笔很短。", "门外有一辆车。"]],

    "c4-textbook-context-sentence": ["材料：他等了很久，车终于来了。\n题目：“终于”在句中说明什么？", "等了很久后出现结果", ["事情刚刚开始", "声音特别大", "动作正在进行"]],
    "c4-textbook-sick-sentence": ["材料：通过努力，使我进步了。\n题目：下面哪种修改最恰当？", "删去“使”", ["加上问号", "把“努力”改成拼音", "把句子倒着写"]],
    "c4-textbook-punctuation-effect": ["材料：妈妈说：“明天我们去图书馆。”\n题目：人物说话后面接原话，通常要使用哪组标点？", "冒号和引号", ["顿号和省略号", "书名号和破折号", "逗号和句号"]],
    "c4-textbook-rhetoric-effect": ["材料：花儿在风中点头，好像在和我们打招呼。\n题目：这句话主要使用了什么修辞方法？", "拟人", ["夸张", "设问", "对偶"]],
    "c4-textbook-info-extraction": ["材料：通知：周五下午三点，全班同学在操场集合。\n题目：集合地点在哪里？", "操场", ["教室", "图书馆", "食堂"]],
    "c4-textbook-character-quality": ["材料：妈妈冒雨送伞，一路担心孩子淋湿。\n题目：材料体现了妈妈怎样的特点？", "关心孩子", ["粗心大意", "喜欢旅行", "不守时间"]],
    "c4-textbook-structure-order": ["材料：先总写校园美，再分写花坛、操场、教室。\n题目：这段话采用了什么结构？", "总分结构", ["倒叙结构", "问答结构", "并列词语"]],
    "c4-textbook-writing-topic": ["材料：习作题目是“记一次难忘的活动”。\n题目：下面哪种材料最合适？", "写一次参加接力赛的经过", ["介绍一种文具的特点", "默写一首古诗", "记录今天的午饭"]],
    "c4-textbook-notice-application": ["材料：班级要通知同学参加周五的读书分享会。\n题目：通知中必须写清哪一项？", "时间、地点和事情", ["人物外貌和动作", "身高、体重和年龄", "声母、韵母和声调"]],
    "c4-textbook-poem-philosophy": ["材料：“不识庐山真面目，只缘身在此山中。”\n题目：这两句诗启发我们什么？", "看问题有时要换个角度", ["山里没有路", "只要低头走路", "所有山都一样"]],

    "c5-textbook-context-emotion": ["材料：他郑重地接过奖状，向老师鞠了一躬。\n题目：“郑重”在句中表示什么？", "态度严肃认真", ["心情轻松随意", "动作慌张急促", "语气十分幽默"]],
    "c5-textbook-paragraph-structure": ["材料：开头总说秋天很美，后面写田野、果园、小河。\n题目：这段材料的结构是什么？", "总分结构", ["倒叙结构", "问答格式", "地点转换"]],
    "c5-textbook-explanation-method": ["材料：这座桥长约五十米，比普通小桥宽得多。\n题目：这句话主要用了哪些说明方法？", "列数字和作比较", ["动作描写和语言描写", "比喻和拟人", "引用古诗和排比"]],
    "c5-textbook-character-detail": ["材料：他攥紧拳头，盯着终点线，一步也不肯停。\n题目：这些细节表现了人物什么特点？", "坚持不放弃", ["害怕交流", "喜欢安静", "不懂礼貌"]],
    "c5-textbook-book-reading": ["材料：评价一个人物是否勇敢，需要举出他面对困难时的具体经历。\n题目：下面哪种评价最有依据？", "他遇到危险仍想办法帮助同伴，所以很勇敢。", ["他总是穿整齐的衣服，所以勇敢。", "故事发生在早晨，所以勇敢。", "他去过很多地方，所以勇敢。"]],
    "c5-textbook-classical-word": ["材料：“其人弗能应也”中的“弗”常表示“不”。\n题目：“弗能应也”的“弗”是什么意思？", "不", ["跑", "看", "吃"]],
    "c5-textbook-material-viewpoint": ["材料：两则材料都提到节约用水的重要性。\n题目：根据材料，可以提出哪一个观点？", "我们应该节约用水", ["铅笔越长越好", "操场需要刷漆", "古诗都要背诵"]],
    "c5-textbook-writing-structure": ["材料：写“我的植物朋友”，重点应写样子、变化和观察。\n题目：下面哪一项最适合放在重点段？", "叶子由浅绿变深绿，我每天记录它的变化。", ["我昨天打篮球。", "书包里有三本书。", "教室门口很热闹。"]],
    "c5-textbook-scene-description": ["材料：运动会上，先写全场热闹，再写接力队员冲刺。\n题目：这种写场景的方法叫什么？", "点面结合", ["按时间倒叙", "借景抒情", "首尾照应"]],
    "c5-textbook-integrated-language": ["材料：修改一段话时，要同时看错别字、病句和标点。\n题目：下面哪一项属于语基综合检查？", "检查错别字、病句和标点", ["概括人物品质", "分析说明方法", "想象古诗画面"]],

    "c6-textbook-language-basic": ["材料：一段话中既有错别字，也有标点使用问题。\n题目：修改这段话时，最合适的做法是什么？", "从字词、句子和标点多方面检查", ["概括段落大意", "分析人物品质", "体会古诗画面"]],
    "c6-textbook-reading-strategy": ["材料：想快速了解文章主要内容，可以先看标题、开头、结尾和关键句。\n题目：这种阅读方法更接近哪一种？", "浏览", ["逐字精读", "背诵标点", "摘录生字"]],
    "c6-textbook-view-summary": ["材料：一段话先说节约用水很重要，后面列举三个理由。\n题目：作者的主要观点是什么？", "节约用水很重要", ["今天下雨", "杯子很大", "水龙头是银色的"]],
    "c6-textbook-non-continuous": ["材料：活动海报写明时间，路线图标出集合地点。\n题目：完成活动安排题时，应该怎样读材料？", "整合海报和路线图的信息", ["概括人物性格", "赏析古诗意象", "修改句子语序"]],
    "c6-textbook-argument-evidence": ["材料：建议学校增加阅读角，需要说明原因和好处。\n题目：下面哪一项表达最完整？", "建议增加阅读角，因为能方便同学课间阅读。", ["增加阅读角。", "我今天很开心。", "学校的树很高。"]],
    "c6-textbook-writing-upgrade": ["材料：“我很开心”可以改成“我捧着奖状，忍不住笑了起来”。\n题目：修改后的句子好在哪里？", "用动作和神态写得更具体", ["删掉了人物", "改变了事情结果", "改成了说明文"]],
    "c6-textbook-classical-reading": ["材料：读古诗时，关键词能帮助想象画面和体会情感。\n题目：理解古诗文时，下面哪种方法更合适？", "抓关键词、想画面、体会情感", ["统计句子数量", "改变诗句顺序", "改写人物对话"]],
    "c6-textbook-famous-book": ["材料：分析人物勇敢，要联系他面对困难时的选择。\n题目：下面哪一项分析最有依据？", "他遇到困难仍保护同伴，说明他勇敢。", ["他说话声音大，所以勇敢。", "故事发生在海边，所以勇敢。", "他经常散步，所以勇敢。"]],
    "c6-textbook-speech-expression": ["材料：做读书演讲，要先说观点，再举例说明。\n题目：演讲开头最适合先说什么？", "自己的读书观点", ["活动的座位安排", "文具的购买价格", "午餐的菜品名称"]],
    "c6-textbook-transition-review": ["材料：综合题同时给材料和问题，需要先看清要求。\n题目：做综合题的第一步是什么？", "先审题", ["先概括主题", "先修改错别字", "先写作文题目"]]
  };

  function fallbackSpec(point) {
    return {
      prompt: `【${point.label}】下面哪一项最符合“${point.helper}”这个训练目标？`,
      correct: point.helper.replace(/[。.!！?？]$/g, ""),
      wrongs: ["只看字面随便猜", "不读题目直接选", "答案和题目无关"],
      explanation: `本题对应“${point.label}”，要围绕“${point.helper}”判断。`,
      commonPitfalls: ["没有看清知识点要求"]
    };
  }

  function buildSourcePlan(count) {
    const total = Math.max(0, Math.floor(Number(count) || 0));
    if (!total) return [];
    return Array.from({ length: total }, () => "inTextbook");
  }

  function firstUseful(items, fallback) {
    return (items || []).map((item) => String(item || "").trim()).find(Boolean) || fallback;
  }

  function readingApplication(bookTitle, skills, themes) {
    const focus = firstUseful([...skills, ...themes], "人物、情节和主题");
    return {
      material: `阅读提示：读《${bookTitle}》时，先找人物做了什么、事情怎样发展，再说自己的理解。`,
      correct: focus,
      wrongs: ["只整理课内生字结构", "只判断句末标点", "只比较拼音声调"]
    };
  }

  function extraApplication(point, skills, examples) {
    const focus = firstUseful([...skills, ...examples], point.short || "语文迁移能力");
    return {
      material: `情境：班级正在做“${point.label.replace(/^原创拓展：/, "")}”小练习，需要把学过的方法用到新材料里。`,
      correct: focus,
      wrongs: ["整本书人物评价", "课内生字偏旁结构", "古诗作者朝代积累"]
    };
  }

  function topicDistractors(point) {
    const topic = point.topic || "";
    if (topic === "pinyin") return ["判断汉字偏旁结构", "概括短文主要内容", "选择应用文格式要素"];
    if (topic === "character") return ["判断句子表达是否完整", "概括自然段中心意思", "分析人物品质"];
    if (topic === "word") return ["判断拼音声调变化", "安排习作开头结尾", "提取通知中的地点"];
    if (topic === "sentence" || topic === "punctuation") return ["辨析形近字偏旁", "概括整本书人物形象", "判断说明文方法"];
    if (topic === "reading") return ["辨析字音字形", "选择句末标点", "安排习作选材"];
    if (topic === "poem") return ["判断通知格式", "分析说明文列数字", "修改病句语序"];
    if (topic === "writing") return ["判断拼音声调", "辨析形近字偏旁", "提取古诗景物"];
    return ["拼音声调辨析", "阅读中心概括", "习作表达方法"];
  }

  function cleanWrongOptions(point, correct, wrongs) {
    const badPattern = /只看|只写|只背|随便|页码|颜色|不读|不看|无关/;
    const base = (Array.isArray(wrongs) ? wrongs : []).filter((item) => item && !badPattern.test(String(item)));
    const fallback = topicDistractors(point);
    const result = [];
    [...base, ...fallback].forEach((item) => {
      const text = String(item || "").trim();
      if (!text || text === correct || result.includes(text)) return;
      result.push(text);
    });
    return result.slice(0, 3);
  }

  function textbookExamSpec(point, sourceLabel) {
    const spec = TEXTBOOK_EXAM_SPECS[point.id];
    if (!spec) return null;
    const [prompt, correct, wrongs, aliases] = spec;
    return {
      prompt: `【${sourceLabel}】${point.label}\n${prompt}`,
      correct,
      wrongs,
      aliases,
      explanation: `这题对应${sourceLabel}里的“${point.label}”。按真实试卷的做法，先读材料和题目要求，再回到语境中选择答案。`,
      steps: [
        "先读材料，圈出题目问的关键信息。",
        "再把每个选项放回材料或句子中比较。",
        "最后选择语义、读音、格式或表达最准确的一项。"
      ],
      commonPitfalls: ["脱离语境作答", "没有看清题目要求"]
    };
  }

  function materialText(material, point) {
    const text = String(material || "").trim() || `材料：读下面内容，完成“${point.label}”相关练习。`;
    return /^材料：|^阅读材料：|^情境：|^阅读提示：/.test(text) ? text : `材料：${text}`;
  }

  function textbookExamPrompt(point, sourceLabel, material) {
    const header = `【${sourceLabel}】${point.label}`;
    const topic = point.topic || "";
    const materialLine = materialText(material, point);
    if (topic === "pinyin") {
      return `${header}\n${materialLine}\n题目：下面哪一项读音或拼写判断正确？`;
    }
    if (topic === "character") {
      return `${header}\n${materialLine}\n题目：下面哪一项字音、字形或偏旁判断正确？`;
    }
    if (topic === "word") {
      return `${header}\n${materialLine}\n题目：结合语境，下面哪一项词语理解或搭配正确？`;
    }
    if (topic === "sentence") {
      return `${header}\n${materialLine}\n题目：按要求选择表达正确、通顺的一项。`;
    }
    if (topic === "punctuation") {
      return `${header}\n${materialLine}\n题目：下面哪一项标点、语气或表达方法判断正确？`;
    }
    if (topic === "reading") {
      return `${header}\n${materialLine}\n题目：根据材料，下面哪一项回答正确？`;
    }
    if (topic === "poem") {
      return `${header}\n${materialLine}\n题目：根据诗句或古文内容，下面哪一项理解正确？`;
    }
    if (topic === "writing") {
      return `${header}\n${materialLine}\n题目：按习作或表达要求，下面哪一项最合适？`;
    }
    return `${header}\n${materialLine}\n题目：根据题目要求，选择正确的一项。`;
  }

  function sourceSpec(point) {
    const sourceType = point.sourceType || "abilityLine";
    const sourceLabel = point.sourceLabel || "";
    const curriculum = point.curriculum || {};
    const knowledge = curriculum.knowledge || {};
    const skills = knowledge.skills || curriculum.questionTypes || [];
    const words = knowledge.words || [];
    const characters = knowledge.characters || [];
    if (sourceType === "inTextbook") {
      const examSpec = textbookExamSpec(point, sourceLabel);
      if (examSpec) return examSpec;
      const material = knowledge.material || `材料：根据“${point.label}”这个知识点，读一个新句子或新短文再判断。`;
      const correct = knowledge.correct || firstUseful([...skills, ...words, ...characters], point.label);
      const wrongs = Array.isArray(knowledge.wrongs) && knowledge.wrongs.length
        ? knowledge.wrongs
        : ["只看字形不看语境", "只背课文题目", "把课外读物当作依据"];
      return {
        prompt: textbookExamPrompt(point, sourceLabel, material),
        correct,
        wrongs: cleanWrongOptions(point, correct, wrongs),
        explanation: `这题对应${sourceLabel}里的“${point.label}”。题目使用新材料，不要求背课文原句；按题目要求回到材料判断即可。`,
        steps: [
          "先读材料和题目要求，判断要选读音、字词、句子、阅读理解还是表达方法。",
          `再抓关键信息：${[...skills, ...words, ...characters].slice(0, 5).join("、") || point.helper}。`,
          "最后把选项代回材料或语境中检验，选择最通顺、最符合题意的一项。"
        ],
        commonPitfalls: ["脱离语境作答", "看到熟悉词语就直接选"]
      };
    }
    if (sourceType === "recommendedReading") {
      const bookTitle = curriculum.bookTitle || point.label.replace(/^推荐读物《|》$/g, "");
      const application = readingApplication(bookTitle, skills, knowledge.themes || []);
      return {
        prompt: `【${sourceLabel}】${point.label}：${application.material} 下面哪一项最适合作为阅读关注点？`,
        correct: application.correct,
        wrongs: application.wrongs,
        explanation: `推荐读物题不考原文背诵，重点考整本书阅读方法：人物、情节、主题和阅读分享。`,
        steps: [
          `先确认推荐读物是《${bookTitle}》。`,
          `再抓阅读能力点：${[...skills, ...(knowledge.themes || [])].slice(0, 5).join("、") || point.helper}。`,
          "最后选择能帮助理解整本书的一项。"
        ],
        commonPitfalls: ["人物评价没有依据", "只记零散情节不概括主题"]
      };
    }
    if (sourceType === "extraOriginal") {
      const application = extraApplication(point, skills, knowledge.examples || []);
      return {
        prompt: `【${sourceLabel}】${point.label}：${application.material} 下面哪一项最符合这个拓展训练？`,
        correct: application.correct,
        wrongs: application.wrongs,
        explanation: `原创拓展题用于补充课外能力，材料会贴合当前年级，但不直接复制教材或读物正文。`,
        steps: [
          `先看清题源是“${sourceLabel}”。`,
          `再抓训练重点：${[...skills, ...(knowledge.examples || [])].slice(0, 5).join("、") || point.helper}。`,
          "最后联系语境选择表达最规范的一项。"
        ],
        commonPitfalls: ["审题不清", "课外迁移时忽略语境"]
      };
    }
    return fallbackSpec(point);
  }

  function reinforcementSpec(point, spec) {
    const pitfalls = Array.isArray(spec.commonPitfalls) && spec.commonPitfalls.length ? spec.commonPitfalls : ["没有看清知识点要求"];
    const originalPrompt = String(spec.prompt || `【${point.label}】选择正确的一项。`);
    const prompt = originalPrompt.includes("题目：")
      ? originalPrompt.replace("题目：", "题目：再读题目，")
      : originalPrompt.replace(/】/, "】再读题目，");
    return {
      ...spec,
      prompt,
      explanation: `这题继续练“${point.label}”。${spec.explanation || "要根据题目材料和选项作答。"}`,
      steps: [
        "先重新读题，确认题目问的具体内容。",
        "再把每个选项放回题干或材料中比较。",
        "最后选择和题意完全对应的一项。"
      ],
      commonPitfalls: pitfalls
    };
  }

  function textbookRecheckSpec(spec) {
    const prompt = String(spec.prompt || "").includes("题目：")
      ? String(spec.prompt).replace("题目：", "题目：再读材料，")
      : `${spec.prompt}\n题目：再读材料，选择正确的一项。`;
    return {
      ...spec,
      prompt,
      explanation: `${spec.explanation || ""} 再练时仍要回到材料本身，不能只看知识点名称。`.trim(),
      steps: [
        "先重新读材料，确认题目问的是哪一个具体信息。",
        "再逐项比较选项是否符合材料和题目要求。",
        "最后选出和材料完全对应的一项。"
      ],
      commonPitfalls: spec.commonPitfalls || ["脱离语境作答", "没有看清题目要求"]
    };
  }

  const DIRECT_INPUT_SPECS = {
    "c1-textbook-common-characters": {
      questionType: "课文词语填空",
      prompt: "【课内教材】常见汉字与课文词语填空\n材料：这个词语指家里照顾我的女性长辈。\n题目：我爱（ ）。请写出括号里的汉字词语。",
      correct: "妈妈",
      explanation: "“家里照顾我的女性长辈”对应“妈妈”，括号里填“妈妈”。",
      commonPitfalls: ["把拼音当答案", "同音字写错"]
    },
    "c1-textbook-quantifier-basic": {
      questionType: "固定词语填空",
      prompt: "【课内教材】量词填空\n材料：量词要和后面的事物搭配。\n题目：一（ ）花。请写出括号里的汉字。",
      correct: "朵",
      explanation: "固定搭配是“一朵花”，答案唯一为“朵”。",
      commonPitfalls: ["量词搭配错误"]
    },
    "c2-textbook-polyphone": {
      questionType: "课文词语填空",
      prompt: "【课内教材】多音字语境理解\n材料：“长大”的意思是从小变大。\n题目：“长大”的“长”在词语中表示（ ）。请写出括号里的汉字词语。",
      correct: "成长",
      explanation: "“长大”里的“长”表示成长，不要求输入拼音。",
      commonPitfalls: ["多音字读音混淆"]
    },
    "c2-textbook-word-collocation": {
      questionType: "固定词语填空",
      prompt: "【课内教材】固定词语填空\n材料：括号里的词语指太阳发出的光。\n题目：早晨，灿烂的（ ）照进教室。请写出括号里的汉字词语。",
      correct: "阳光",
      explanation: "根据材料原句，括号里只能填“阳光”。",
      commonPitfalls: ["词语搭配不当"]
    },
    "c5-textbook-integrated-language": {
      questionType: "错别字改正",
      prompt: "【课内教材】语基综合检查\n材料：句子“做完习作后，要认针检查错别字、病句和标点”中有一个同音错字。\n题目：词语“认针”中的错别字应改成哪个字？请直接输入正确的汉字。",
      correct: "真",
      explanation: "“认针”应改为“认真”，“针”是错别字，应改成“真”。",
      commonPitfalls: ["形近字混淆", "只看读音不看字形"]
    }
  };

  function inputHeader(point) {
    return `【${point.sourceLabel || "课内教材"}】${point.label}`;
  }

  function directInputSpec(point, baseSpec) {
    if (DIRECT_INPUT_SPECS[point.id]) return DIRECT_INPUT_SPECS[point.id];
    const header = inputHeader(point);
    const identity = `${point.id} ${point.label} ${point.short || ""} ${point.helper || ""}`;

    if (/polyphone|多音/.test(point.id + point.label + point.helper)) {
      return {
        questionType: "课文词语填空",
        prompt: `${header}\n材料：“长大”的意思是从小变大，“长短”说的是长度。\n题目：“长大”的“长”表示（ ）。请写出括号里的汉字词语。`,
        correct: "成长",
        explanation: "“长大”里的“长”表示成长，不需要输入拼音。",
        commonPitfalls: ["多音字读音混淆"]
      };
    }

    if (point.topic === "punctuation") {
      return {
        questionType: "固定词语填空",
        prompt: `${header}\n材料：句子要表达询问语气。\n题目：你今天去图书馆（ ）。请写出括号里的语气词汉字。`,
        correct: "吗",
        explanation: "表示询问语气时，句末常用语气词“吗”。",
        commonPitfalls: ["句末标点混淆"]
      };
    }

    if (point.topic === "character") {
      return {
        questionType: "错别字改正",
        prompt: `${header}\n材料：“认针学习”中有一个同音错字，正确词语表示态度严肃、不马虎。\n题目：“认针学习”中的错别字应改成哪个字？请直接输入正确的汉字。`,
        correct: "真",
        explanation: "“认真”的“真”表示真实、确切，这里“针”用错了。",
        commonPitfalls: ["同音字混淆", "形近字混淆"]
      };
    }

    if (point.topic === "pinyin") {
      return {
        questionType: "课文词语填空",
        prompt: `${header}\n材料：这个词语指家里照顾我的女性长辈。\n题目：我爱（ ）。请写出括号里的汉字词语。`,
        correct: "妈妈",
        explanation: "根据材料“我爱妈妈”，括号里只能填“妈妈”。",
        commonPitfalls: ["声调位置错误", "声母混淆"]
      };
    }

    if (/成语|accumulation|亡羊|寓言/.test(identity)) {
      return {
        questionType: "成语填空",
        prompt: `${header}\n材料：这个成语常用来说明出了问题及时补救还不晚。\n题目：亡羊补（ ）。请写出括号里的汉字。`,
        correct: "牢",
        explanation: "固定成语是“亡羊补牢”，括号里只能填“牢”。",
        commonPitfalls: ["成语关键字写错"]
      };
    }

    if (point.topic === "word") {
      return {
        questionType: "固定词语填空",
        prompt: `${header}\n材料：括号里的词语指太阳发出的光。\n题目：早晨，灿烂的（ ）照进教室。请写出括号里的汉字词语。`,
        correct: "阳光",
        explanation: "根据材料原句，括号里只能填“阳光”。",
        commonPitfalls: ["搭配对象不恰当"]
      };
    }

    if (point.topic === "sentence") {
      return {
        questionType: "固定词语填空",
        prompt: `${header}\n材料：前半句说明原因，后半句说明结果。\n题目：因为下雨，（ ）活动改到教室里。请写出括号里的关联词。`,
        correct: "所以",
        explanation: "“因为……所以……”是一组固定关联词，括号里填“所以”。",
        commonPitfalls: ["句子成分搭配不当"]
      };
    }

    if (point.topic === "poem") {
      return {
        questionType: "诗词填空",
        prompt: `${header}\n材料：读古诗要抓住诗句中的景物词。\n题目：床前明（ ）光。请填括号里的汉字。`,
        correct: "月",
        explanation: "诗句中的景物是“明月光”，括号里应填“月”。",
        commonPitfalls: ["只凭印象填无关景物"]
      };
    }

    if (point.topic === "writing") {
      return {
        questionType: "课文词语填空",
        prompt: `${header}\n材料：写通知要说清什么时候、在哪里、做什么。\n题目：写通知要写清时间、地点和（ ）。请写出括号里的汉字词语。`,
        correct: "事情",
        explanation: "通知的基本要素包括时间、地点和事情，括号里填“事情”。",
        commonPitfalls: ["句子信息不完整"]
      };
    }

    if (point.topic === "reading") {
      return {
        questionType: "课文词语填空",
        prompt: `${header}\n材料：这个人物称呼指爸爸或妈妈的母亲。\n题目：小兔把萝卜送给（ ）。请写出括号里的人物称呼。`,
        correct: "奶奶",
        explanation: "材料直接写明“小兔把萝卜送给奶奶”。",
        commonPitfalls: ["没有回到材料定位"]
      };
    }

    return {
      questionType: "成语填空",
      prompt: `${header}\n材料：这个成语表示出了问题及时补救还不晚。\n题目：亡羊补（ ）。请写出括号里的汉字。`,
      correct: "牢",
      explanation: "固定成语是“亡羊补牢”，括号里只能填“牢”。",
      commonPitfalls: ["成语关键字写错"]
    };
  }

  function specsForPoint(point) {
    const specs = POINT_SPECS[point.id] || sourceSpec(point);
    const list = Array.isArray(specs) ? specs : [specs];
    const choiceSpec = list[0];
    return [
      { ...choiceSpec, format: "choice" },
      { ...directInputSpec(point, choiceSpec), format: "input" }
    ];
  }

  function makeQuestion(deps, point) {
    const allSpecs = specsForPoint(point);
    let spec;
    if (deps && typeof deps.pick === "function") {
      spec = deps.pick(allSpecs);
    } else {
      const mode = deps?.state?.answerMode || "";
      const preferredFormat = mode === "input" ? "input" : mode === "choice" ? "choice" : "";
      const candidates = preferredFormat ? allSpecs.filter((item) => item.format === preferredFormat) : allSpecs;
      spec = choose(deps || {}, candidates.length ? candidates : allSpecs);
    }
    const data = spec.format === "input" ? objectiveInput(point, spec) : objectiveChoice(point, spec);
    return baseQuestion(deps || {}, point, data);
  }

  window.MathCampChineseQuestionGenerator = { makeQuestion, buildSourcePlan };
})();
