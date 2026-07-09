/**
 * ============================================================================
 * 语文题库生成器（chinese-question-generator.js）
 * ----------------------------------------------------------------------------
 * 【题目从哪里来】
 *   每个知识点（point，id 形如 "c1-pinyin"、"c3-textbook-rhetoric-basic"）
 *   对应一组“种子”（spec）。运行时由 makeQuestion() 把种子加工成一道题，
 *   再由外层抽题引擎（app.js 的 makeDistinctQuestionForPoint + signature 去重）
 *   保证同一知识点连续抽题不重复。
 *
 *   种子越多 → 同一知识点能产出的不重复题越多。这是题库“不机械”的关键：
 *   引擎只能从种子池里取，种子只有 1 条时无论怎么去重都会很快重复。
 *
 * 【两类种子来源】
 *   1) 能力线知识点（如 c1-pinyin、c3-rhetoric）→ 存放在 POINT_SPECS。
 *      - 值可以是【单条对象】，也可以是【对象数组】（推荐，数组=多题）。
 *      - 每条对象字段：
 *          prompt         题干（选择题的问法）
 *          correct        正确答案（会被放到 A 选项，运行时打乱）
 *          wrongs         干扰项数组（3 个）
 *          explanation    解析
 *          commonPitfalls 常见易错点（可选）
 *          aliases        可接受的其它答案写法（可选，如拼音 "ma1"）
 *          directInput    该题专属的填空变体（可选，见下）
 *
 *   2) 教材类知识点（如 c1-textbook-pinyin-tone）→ 存放在 TEXTBOOK_EXAM_SPECS，
 *      用紧凑数组格式，节省篇幅：
 *          单条：["材料...\n题目...", 正确答案, [干扰1, 干扰2, 干扰3], 可选aliases]
 *          多条：[ [单条], [单条], ... ]   ← 第一个元素是数组即视为多题
 *      （少数教材点在 DIRECT_INPUT_SPECS 里另配了手写填空题。）
 *
 * 【选择题 + 填空题】
 *   specsForPoint() 会把每条选择种子自动配一道填空题：
 *     - 若该种子写了 directInput，用它；
 *     - 否则调用 directInputSpec() 派生：优先用 deriveInputFromChoice()，
 *       把“选择题的正确答案”当填空答案、“解析”当提示（并抹掉提示里的答案，
 *       避免答案出现在题干里）；派生不出合格题时，回退到按 topic 的通用填空。
 *
 * 【怎么加题 / 改题】
 *   - 给能力线知识点加题：把 POINT_SPECS["xxx"] 改成数组，往里加对象即可。
 *   - 给教材点加题：把 TEXTBOOK_EXAM_SPECS["xxx"] 改成“数组套数组”的多条格式。
 *   - 客观题（拼音/字形/量词/修辞/标点等，答案唯一）适合多扩；
 *     依赖特定短文/情境的题（阅读理解/习作/看图写话）单条即可，强行扩会稀释质量。
 *   - 硬性规则（tests/chinese-question-bank.test.js 会校验）：
 *       * 填空题答案只能是汉字、只有一个标准答案；
 *       * 答案不能出现在题干或材料里（否则送分/无意义）；
 *       * 全程用中文，别混入英文单词。
 *   - 改完务必：① node 语法自检 ② npm test ③ 把文件同步到
 *     android/app/src/main/assets/www/js/（Android 镜像，测试会校验哈希一致）。
 * ============================================================================
 */
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

  function objectiveChoice(deps, point, spec) {
    const layout = window.MathCampQuestionSpec.choiceLayout(deps, { correct: spec.correct, wrongs: spec.wrongs });
    const aliases = Array.isArray(spec.aliases) ? spec.aliases : [];
    return {
      text: `${spec.prompt}\n${layout.optionText}`,
      answerType: "choice",
      answer: layout.answer,
      acceptedAnswers: layout.acceptedAnswers(aliases),
      answerLabel: layout.answerLabel,
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
    "c1-pinyin": [
      {
        prompt: "【拼音认读与拼写】“妈”的正确拼音是哪一个？",
        correct: "mā",
        wrongs: ["má", "nā", "mō"],
        aliases: ["ma1", "mā"],
        explanation: "“妈”读第一声 mā，声母是 m，韵母是 a。",
        commonPitfalls: ["声调混淆", "声母 m 和 n 混淆"]
      },
      {
        prompt: "【拼音认读与拼写】“河”的正确拼音是哪一个？",
        correct: "hé",
        wrongs: ["hē", "hě", "kě"],
        aliases: ["he2", "hé"],
        explanation: "“河”读第二声 hé，声母是 h，韵母是 e。",
        commonPitfalls: ["声调混淆", "声母 h 和 k 混淆"]
      },
      {
        prompt: "【拼音认读与拼写】下面哪个字是整体认读音节？",
        correct: "yǔ（雨）",
        wrongs: ["mù（木）", "tǔ（土）", "hé（河）"],
        aliases: ["yu3", "yǔ", "雨"],
        explanation: "“雨”yǔ 是整体认读音节，不用拼读，直接认读。",
        commonPitfalls: ["整体认读音节和拼读音节混淆"]
      },
      {
        prompt: "【拼音认读与拼写】“白”的正确拼音是哪一个？",
        correct: "bái",
        wrongs: ["bái tiān", "pái", "bǎi"],
        aliases: ["bai2", "bái"],
        explanation: "“白”读第二声 bái，声母是 b，韵母是 ai。",
        commonPitfalls: ["声调混淆", "声母 b 和 p 混淆"]
      }
    ],
    "c1-character": [
      {
        prompt: "【识字写字入门】“明”字的结构判断正确的是哪一项？",
        correct: "左右结构，由“日”和“月”组成",
        wrongs: ["上下结构，由“木”和“月”组成", "独体字，没有偏旁", "半包围结构"],
        explanation: "“明”左边是“日”，右边是“月”，属于左右结构。",
        commonPitfalls: ["结构判断错误", "偏旁看漏"]
      },
      {
        prompt: "【识字写字入门】“休”字最恰当的解释是哪一项？",
        correct: "一个人靠在树旁休息",
        wrongs: ["两个人在说话", "把木头砍断", "太阳照在树上"],
        explanation: "“休”左边是单人旁“亻”，右边是“木”，表示人靠着树休息。",
        commonPitfalls: ["偏旁含义不清", "看字形乱猜"]
      },
      {
        prompt: "【识字写字入门】下面哪个字是上下结构？",
        correct: "花",
        wrongs: ["林", "河", "叫"],
        explanation: "“花”上面是草字头“艹”，下面是“化”，是上下结构；林、河、叫都是左右结构。",
        commonPitfalls: ["上下结构和左右结构混淆"]
      },
      {
        prompt: "【识字写字入门】“水”字的第一笔是哪一笔？",
        correct: "竖钩",
        wrongs: ["横", "撇", "点"],
        explanation: "“水”先写中间的竖钩，再写两边的笔画。",
        commonPitfalls: ["笔顺记错", "第一笔写成撇"]
      },
      {
        prompt: "【识字写字入门】“们”字的偏旁是哪一个？",
        correct: "单人旁 亻",
        wrongs: ["双人旁 彳", "竖心旁 忄", "反犬旁 犭"],
        explanation: "“们”左边是单人旁“亻”，常和人有关，如“我们、你们”。",
        commonPitfalls: ["单人旁和双人旁混淆"]
      }
    ],
    "c1-word": [
      {
        prompt: "【词语积累】“一（ ）花”中量词最合适的是哪一个？",
        correct: "朵",
        wrongs: ["只", "条", "本"],
        explanation: "花通常用量词“朵”，应说“一朵花”。",
        commonPitfalls: ["量词搭配错误"]
      },
      {
        prompt: "【词语积累】“一（ ）鱼”中量词最合适的是哪一个？",
        correct: "条",
        wrongs: ["朵", "本", "座"],
        explanation: "鱼通常用量词“条”，应说“一条鱼”。",
        commonPitfalls: ["量词搭配错误"]
      },
      {
        prompt: "【词语积累】“大”的反义词是哪一个？",
        correct: "小",
        wrongs: ["多", "高", "长"],
        explanation: "“大”和“小”意思相反，是一对反义词。",
        commonPitfalls: ["反义词和近义词混淆"]
      },
      {
        prompt: "【词语积累】和“高兴”意思最接近的词语是哪一个？",
        correct: "开心",
        wrongs: ["难过", "生气", "着急"],
        explanation: "“高兴”和“开心”都表示心情好，是近义词。",
        commonPitfalls: ["把反义词当近义词"]
      },
      {
        prompt: "【词语积累】下面哪个词语搭配最合适？",
        correct: "弯弯的月亮",
        wrongs: ["弯弯的太阳", "圆圆的小河", "长长的星星"],
        explanation: "月亮常被形容成“弯弯的”，符合生活经验。",
        commonPitfalls: ["词语搭配不当"]
      }
    ],
    "c1-sentence": [
      {
        prompt: "【句子入门】下面哪一句把话说完整了？",
        correct: "小鸟在树上唱歌。",
        wrongs: ["小鸟在。", "树上唱。", "唱歌小鸟树。"],
        explanation: "完整句要说清谁在哪里做什么。",
        commonPitfalls: ["句子缺少人物或动作"]
      },
      {
        prompt: "【句子入门】照样子把话说完整，哪一句最好？\n例：弟弟在画画。",
        correct: "妹妹在跳绳。",
        wrongs: ["妹妹在。", "跳绳妹妹。", "在跳绳。"],
        explanation: "仿照“谁在做什么”的样子，要把人物和动作都说清楚。",
        commonPitfalls: ["仿写时漏掉人物或动作"]
      },
      {
        prompt: "【句子入门】下面哪一句词语顺序是对的？",
        correct: "太阳升起来了。",
        wrongs: ["升起来太阳了。", "了太阳升起来。", "起来升太阳了。"],
        explanation: "先说“谁”（太阳），再说“做什么”（升起来了），语序才通顺。",
        commonPitfalls: ["词语顺序打乱"]
      },
      {
        prompt: "【句子入门】给“天空中飞着小鸟”配上问句，哪一句合适？",
        correct: "天空中飞着什么？",
        wrongs: ["天空中飞着。", "飞着小鸟什么。", "小鸟天空飞？"],
        explanation: "针对“小鸟”提问，用“什么”来问最合适。",
        commonPitfalls: ["问句要素不完整"]
      },
      {
        prompt: "【句子入门】哪一句说清了“什么时候做什么”？",
        correct: "早上，我背着书包去上学。",
        wrongs: ["书包去上学。", "早上上学书包我。", "去上学。"],
        explanation: "先说时间“早上”，再说人物和事情，句子就清楚完整了。",
        commonPitfalls: ["缺少时间或人物"]
      }
    ],
    "c1-reading": [
      {
        prompt: "【短文阅读启蒙】短文写“小兔把萝卜送给奶奶”。小兔做了什么？",
        correct: "把萝卜送给奶奶",
        wrongs: ["去河边钓鱼", "把书放进书包", "在树下睡觉"],
        explanation: "题目问小兔做的事，应回到短文直接找动作。",
        commonPitfalls: ["人物动作对应错误"]
      },
      {
        prompt: "【短文阅读启蒙】短文写“早上，小明在公园里跑步”。小明在哪里跑步？",
        correct: "公园里",
        wrongs: ["学校里", "家里", "河边"],
        explanation: "短文直接写了“在公园里跑步”，问地点就回到原文找。",
        commonPitfalls: ["把时间当地点", "凭印象乱答"]
      },
      {
        prompt: "【短文阅读启蒙】短文写“下雨了，小鸭高兴地在水里游”。小鸭的心情怎么样？",
        correct: "高兴",
        wrongs: ["害怕", "生气", "难过"],
        explanation: "短文里“高兴地”直接写出了小鸭的心情。",
        commonPitfalls: ["没抓表示心情的词"]
      },
      {
        prompt: "【短文阅读启蒙】短文写“妈妈买了苹果、香蕉和梨”。妈妈没有买下面哪样水果？",
        correct: "西瓜",
        wrongs: ["苹果", "香蕉", "梨"],
        explanation: "短文写的是苹果、香蕉和梨，没有提到西瓜。",
        commonPitfalls: ["没有逐一核对信息"]
      },
      {
        prompt: "【短文阅读启蒙】短文写“小猫先喝牛奶，再睡觉”。小猫先做什么？",
        correct: "喝牛奶",
        wrongs: ["睡觉", "捉老鼠", "玩球"],
        explanation: "抓住表示顺序的“先”字，小猫先喝牛奶。",
        commonPitfalls: ["顺序词看反"]
      }
    ],
    "c1-poem": [
      {
        prompt: "【古诗积累】“床前明月光”写到的景物是哪一个？",
        correct: "明月光",
        wrongs: ["春风", "荷花", "白雪"],
        explanation: "诗句里直接出现“明月光”，写的是月光。",
        commonPitfalls: ["只凭印象乱选"]
      },
      {
        prompt: "【古诗积累】“春眠不觉晓，处处闻啼鸟”里听到的是什么声音？",
        correct: "鸟叫声",
        wrongs: ["流水声", "风声", "读书声"],
        explanation: "“闻啼鸟”就是听到鸟叫，“闻”在这里是“听到”的意思。",
        commonPitfalls: ["把“闻”理解成用鼻子闻"]
      },
      {
        prompt: "【古诗积累】“锄禾日当午”这句诗告诉我们要怎么做？",
        correct: "爱惜粮食",
        wrongs: ["早睡早起", "多喝水", "认真画画"],
        explanation: "这首《悯农》讲农民辛苦种粮，提醒我们要爱惜粮食。",
        commonPitfalls: ["不理解古诗主题"]
      },
      {
        prompt: "【古诗积累】“白毛浮绿水，红掌拨清波”写的是哪种动物？",
        correct: "鹅",
        wrongs: ["鸭", "鱼", "青蛙"],
        explanation: "《咏鹅》中“白毛”“红掌”都是鹅的样子。",
        commonPitfalls: ["只看颜色乱猜动物"]
      },
      {
        prompt: "【古诗积累】“欲穷千里目，更上一层楼”告诉我们什么道理？",
        correct: "站得高才能看得远",
        wrongs: ["下雨要打伞", "早上要早起", "写字要工整"],
        explanation: "想看得更远，就要登得更高，比喻要不断进步。",
        commonPitfalls: ["只看字面不懂道理"]
      }
    ],
    "c1-picture": [
      {
        prompt: "【看图说话】看图说话先要说清什么？",
        correct: "谁在哪里做什么",
        wrongs: ["天气怎么样", "物品有几种", "故事有什么道理"],
        explanation: "低年级看图说话先抓人物、地点和事情。",
        commonPitfalls: ["画面信息不完整"]
      },
      {
        prompt: "【看图说话】图上：小朋友在草地上放风筝。下面哪句话说得最清楚？",
        correct: "小朋友在草地上放风筝。",
        wrongs: ["放风筝。", "小朋友。", "草地风筝小朋友。"],
        explanation: "要把人物“小朋友”、地点“草地上”、事情“放风筝”都说清楚。",
        commonPitfalls: ["只说一部分", "词语顺序乱"]
      },
      {
        prompt: "【看图说话】图上有太阳、小鸟和一片树林。说话时先说什么比较好？",
        correct: "先说画面里有什么",
        wrongs: ["先说自己的名字", "先说昨天的事", "先说明天去哪"],
        explanation: "看图说话要先看清并说出画面里的事物，再说它们在做什么。",
        commonPitfalls: ["说的内容和图无关"]
      },
      {
        prompt: "【看图说话】图上：妈妈在厨房做饭。哪句话最完整？",
        correct: "妈妈在厨房里做饭。",
        wrongs: ["妈妈做饭。", "在厨房。", "做饭妈妈厨房。"],
        explanation: "补上地点“厨房里”，句子才把“谁在哪里做什么”说全。",
        commonPitfalls: ["漏说地点"]
      },
      {
        prompt: "【看图说话】图上有好几个小朋友在做不同的事，说话时怎样更有条理？",
        correct: "按顺序一个一个说",
        wrongs: ["只说其中一个", "全都挤在一句里", "只说自己喜欢的"],
        explanation: "人物多的时候，按“有的……有的……还有的……”顺序说更清楚。",
        commonPitfalls: ["表达没有条理"]
      }
    ],
    "c1-expression": [
      {
        prompt: "【口语表达】向同学借橡皮时，哪句话最有礼貌？",
        correct: "请问可以借我用一下橡皮吗？",
        wrongs: ["快把橡皮给我", "橡皮拿来", "我不要说话"],
        explanation: "请求别人帮助时要使用礼貌用语。",
        commonPitfalls: ["请求表达不礼貌"]
      },
      {
        prompt: "【口语表达】不小心踩到了同学的脚，应该说哪句话？",
        correct: "对不起，我不是故意的。",
        wrongs: ["谁让你站这儿", "没关系", "谢谢你"],
        explanation: "做错事影响到别人，要主动道歉说“对不起”。",
        commonPitfalls: ["该道歉时用错礼貌用语"]
      },
      {
        prompt: "【口语表达】同学帮你捡起了掉在地上的笔，你应该说什么？",
        correct: "谢谢你！",
        wrongs: ["对不起", "没关系", "再见"],
        explanation: "别人帮助了自己，要说“谢谢”表示感谢。",
        commonPitfalls: ["感谢和道歉用语混淆"]
      },
      {
        prompt: "【口语表达】第一次向新同学介绍自己，哪句话最合适？",
        correct: "你好，我叫小明，很高兴认识你。",
        wrongs: ["你是谁呀", "我不认识你", "快走开"],
        explanation: "自我介绍要有问候、说清名字，并表达友好。",
        commonPitfalls: ["介绍不完整", "语气不友好"]
      },
      {
        prompt: "【口语表达】早上到学校见到老师，应该怎么问好？",
        correct: "老师早上好！",
        wrongs: ["喂，老师", "老师再见", "老师，我走了"],
        explanation: "早上见到老师要主动、有礼貌地问“早上好”。",
        commonPitfalls: ["问候语和告别语混淆"]
      }
    ],
    "c2-sound-shape": [
      {
        prompt: "【字音字形】下面哪组形近字搭配正确？",
        correct: "晴天的“晴”是日字旁",
        wrongs: ["清水的“清”是日字旁", "请客的“请”是木字旁", "情感的“情”是三点水"],
        explanation: "“晴”和太阳有关，是日字旁。",
        commonPitfalls: ["形近字偏旁混淆"]
      },
      {
        prompt: "【字音字形】“清水”的“清”应该是什么偏旁？",
        correct: "三点水 氵",
        wrongs: ["日字旁 日", "言字旁 讠", "竖心旁 忄"],
        explanation: "“清”和水有关，是三点水“氵”。",
        commonPitfalls: ["形近字偏旁混淆"]
      },
      {
        prompt: "【字音字形】“为”是多音字，“因为”里的“为”读哪个音？",
        correct: "wèi",
        wrongs: ["wéi", "wǎi", "wāi"],
        explanation: "“因为”的“为”读第四声 wèi；“为了”“行为”里也读 wèi。",
        commonPitfalls: ["多音字读音混淆"]
      },
      {
        prompt: "【字音字形】下面哪个词语没有错别字？",
        correct: "认真",
        wrongs: ["认针", "人真", "仞真"],
        explanation: "“认真”表示态度严肃、不马虎，“针、人、仞”都是错字。",
        commonPitfalls: ["同音字、形近字混淆"]
      },
      {
        prompt: "【字音字形】“漂”是多音字，“漂亮”的“漂”读哪个音？",
        correct: "piào",
        wrongs: ["piāo", "piǎo", "biào"],
        explanation: "“漂亮”读 piào；“漂浮”读 piāo；“漂白”读 piǎo。",
        commonPitfalls: ["多音字读音混淆"]
      }
    ],
    "c2-word-match": [
      {
        prompt: "【词语搭配】下面哪个搭配最恰当？",
        correct: "灿烂的阳光",
        wrongs: ["灿烂的铅笔", "奔跑的桌子", "香甜的石头"],
        explanation: "“灿烂”常用来形容阳光、笑容等。",
        commonPitfalls: ["词语搭配不当"]
      },
      {
        prompt: "【词语搭配】“（ ）的河水”括号里填哪个词最合适？",
        correct: "清清",
        wrongs: ["红红", "高高", "圆圆"],
        explanation: "河水常用“清清的”来形容，符合生活经验。",
        commonPitfalls: ["形容词和事物搭配不当"]
      },
      {
        prompt: "【词语搭配】下面哪个动词搭配正确？",
        correct: "弹钢琴",
        wrongs: ["弹足球", "弹跑步", "弹画画"],
        explanation: "钢琴用手指“弹”，足球是“踢”，画是“画”。",
        commonPitfalls: ["动词和名词搭配错误"]
      },
      {
        prompt: "【词语搭配】“一（ ）清泉”里最合适的量词是哪个？",
        correct: "股",
        wrongs: ["朵", "只", "本"],
        explanation: "泉水流动常用量词“股”，说“一股清泉”。",
        commonPitfalls: ["量词搭配不当"]
      },
      {
        prompt: "【词语搭配】下面哪个搭配最恰当？",
        correct: "鲜艳的红旗",
        wrongs: ["鲜艳的声音", "响亮的花朵", "明亮的歌声"],
        explanation: "“鲜艳”形容颜色，红旗颜色鲜艳，搭配正确。",
        commonPitfalls: ["形容词用错对象"]
      }
    ],
    "c2-sentence": [
      {
        prompt: "【句子训练】把“花开了”扩句，哪一句更具体通顺？",
        correct: "公园里的桃花慢慢开了。",
        wrongs: ["花开。", "开了花公园慢慢。", "桃花公园的了。"],
        explanation: "扩句要补充合适的信息，同时保持语序通顺。",
        commonPitfalls: ["扩句后语序混乱"]
      },
      {
        prompt: "【句子训练】把“鸟儿飞”扩句，哪一句最具体通顺？",
        correct: "一群小鸟在天空中自由地飞。",
        wrongs: ["鸟飞。", "飞鸟天空一群。", "在飞鸟儿的。"],
        explanation: "扩句可以加上数量、地点和样子，让句子更生动。",
        commonPitfalls: ["扩句后语序混乱"]
      },
      {
        prompt: "【句子训练】照样子写句子，哪一句符合“……像……”的样子？",
        correct: "弯弯的月亮像小船。",
        wrongs: ["月亮很弯。", "小船像。", "像月亮小船弯。"],
        explanation: "用“……像……”打比方，要把两样相似的事物连起来。",
        commonPitfalls: ["比喻句结构不完整"]
      },
      {
        prompt: "【句子训练】下面哪一句是问句？",
        correct: "你喜欢吃苹果吗？",
        wrongs: ["我喜欢吃苹果。", "苹果真好吃。", "快吃苹果。"],
        explanation: "问句用来提问，句末常有“吗、呢”，用问号结尾。",
        commonPitfalls: ["问句和陈述句混淆"]
      },
      {
        prompt: "【句子训练】把“小明打扫教室”换个说法，哪一句意思不变？",
        correct: "教室被小明打扫得干干净净。",
        wrongs: ["教室打扫小明。", "小明被教室打扫。", "打扫小明教室干净。"],
        explanation: "改成“被”字句时，被打扫的“教室”放前面，意思不变。",
        commonPitfalls: ["把字句被字句转换出错"]
      }
    ],
    "c2-punctuation": [
      {
        prompt: "【标点与语气】“你今天去图书馆吗”句末应使用什么标点？",
        correct: "？",
        wrongs: ["。", "，", "、"],
        explanation: "这句话是在提问，句末应该用问号。",
        commonPitfalls: ["疑问句错用句号"]
      },
      {
        prompt: "【标点与语气】“这里的风景真美啊”句末应使用什么标点？",
        correct: "！",
        wrongs: ["。", "？", "，"],
        explanation: "这句话表达强烈的赞叹，句末用感叹号。",
        commonPitfalls: ["感叹句错用句号"]
      },
      {
        prompt: "【标点与语气】“我买了苹果□香蕉和梨”方框里应填什么标点？",
        correct: "、",
        wrongs: ["，", "。", "！"],
        explanation: "并列的词语之间用顿号“、”隔开。",
        commonPitfalls: ["顿号和逗号混淆"]
      },
      {
        prompt: "【标点与语气】“今天天气很好□我们去公园玩”方框里应填什么标点？",
        correct: "，",
        wrongs: ["、", "。", "？"],
        explanation: "一句话中间的停顿用逗号，两个小分句之间用逗号连接。",
        commonPitfalls: ["逗号和句号混淆"]
      },
      {
        prompt: "【标点与语气】下面哪句话的标点用得对？",
        correct: "你叫什么名字？",
        wrongs: ["你叫什么名字。", "你叫什么名字，", "你叫什么名字、"],
        explanation: "这是在提问，句末必须用问号。",
        commonPitfalls: ["问句漏用问号"]
      }
    ],
    "c2-reading": [
      {
        prompt: "【短文阅读】短文说“小雨先写作业，再收拾书包”。小雨先做什么？",
        correct: "写作业",
        wrongs: ["收拾书包", "去操场跑步", "看电视"],
        explanation: "题目问“先做什么”，要抓表示顺序的“先”。",
        commonPitfalls: ["顺序词看错"]
      },
      {
        prompt: "【短文阅读】短文说“因为下雨了，运动会改到下周举行”。运动会为什么改期？",
        correct: "因为下雨了",
        wrongs: ["因为放假", "因为人太少", "因为天太热"],
        explanation: "抓住表示原因的“因为”，运动会改期是因为下雨。",
        commonPitfalls: ["没找到表示原因的词"]
      },
      {
        prompt: "【短文阅读】短文说“小松鼠把松果藏进树洞，准备过冬”。小松鼠藏松果是为了什么？",
        correct: "准备过冬",
        wrongs: ["送给朋友", "玩游戏", "扔掉"],
        explanation: "短文写“准备过冬”，说明藏松果是为了冬天有吃的。",
        commonPitfalls: ["没抓住表示目的的词"]
      },
      {
        prompt: "【短文阅读】短文说“乌鸦把小石子一颗一颗放进瓶子，水慢慢升高了”。水为什么升高？",
        correct: "因为放进了石子",
        wrongs: ["因为下雨了", "因为瓶子小", "因为乌鸦喝了水"],
        explanation: "石子放进瓶子占了空间，水面就升高了。",
        commonPitfalls: ["因果关系判断错误"]
      },
      {
        prompt: "【短文阅读】短文说“小明先洗手，然后吃饭，最后刷牙睡觉”。小明最后做什么？",
        correct: "刷牙睡觉",
        wrongs: ["洗手", "吃饭", "写作业"],
        explanation: "抓住“最后”这个顺序词，小明最后是刷牙睡觉。",
        commonPitfalls: ["顺序词看错"]
      }
    ],
    "c2-poem": [
      {
        prompt: "【古诗积累】“春眠不觉晓”写的是哪个季节？",
        correct: "春天",
        wrongs: ["夏天", "秋天", "冬天"],
        explanation: "诗句开头就是“春眠”，写的是春天。",
        commonPitfalls: ["诗句关键词没抓住"]
      },
      {
        prompt: "【古诗积累】“小荷才露尖尖角”写的是哪个季节的景物？",
        correct: "夏天",
        wrongs: ["春天", "秋天", "冬天"],
        explanation: "荷花在夏天开放，“小荷”写的是初夏的荷叶。",
        commonPitfalls: ["季节和景物对应错误"]
      },
      {
        prompt: "【古诗积累】“二月春风似剪刀”把春风比作什么？",
        correct: "剪刀",
        wrongs: ["小船", "月亮", "丝带"],
        explanation: "《咏柳》里用“似剪刀”把春风比作剪刀，剪出细长的柳叶。",
        commonPitfalls: ["没找出比喻的事物"]
      },
      {
        prompt: "【古诗积累】“谁知盘中餐，粒粒皆辛苦”告诉我们什么道理？",
        correct: "要爱惜粮食",
        wrongs: ["要多睡觉", "要早起床", "要多运动"],
        explanation: "每一粒粮食都来之不易，要珍惜，不能浪费。",
        commonPitfalls: ["不理解古诗表达的道理"]
      },
      {
        prompt: "【古诗积累】“遥看瀑布挂前川”里“遥看”是什么意思？",
        correct: "远远地看",
        wrongs: ["低头看", "很快地看", "闭眼看"],
        explanation: "“遥”表示远，“遥看”就是从远处看瀑布。",
        commonPitfalls: ["不理解古诗字词"]
      }
    ],
    "c2-picture-writing": [
      {
        prompt: "【看图写话】看图写话按顺序表达，哪一项最合适？",
        correct: "先写时间地点，再写人物做事",
        wrongs: ["先写感受，再写天气变化", "先写道理，再写书名作者", "先写标点，再写拼音声调"],
        explanation: "看图写话要按画面顺序写清楚。",
        commonPitfalls: ["表达没有顺序"]
      },
      {
        prompt: "【看图写话】图上：下课了，同学们在操场上活动。哪句话写得最生动？",
        correct: "下课了，同学们有的跳绳，有的踢球，还有的在跑步。",
        wrongs: ["同学们在操场。", "下课了。", "操场很大。"],
        explanation: "用“有的……有的……还有的……”能把热闹的场面写具体。",
        commonPitfalls: ["场面写得太简单"]
      },
      {
        prompt: "【看图写话】写一件事时，最后通常应该写什么？",
        correct: "事情的结果或自己的感受",
        wrongs: ["天气和日期", "书名和作者", "拼音和声调"],
        explanation: "写事要有头有尾，结尾可以写结果或自己的想法。",
        commonPitfalls: ["写话没有结尾"]
      },
      {
        prompt: "【看图写话】图上：小明帮老奶奶过马路。这幅图主要想告诉我们什么？",
        correct: "要帮助有需要的人",
        wrongs: ["马路很宽", "天气很热", "小明个子高"],
        explanation: "图画表现的是助人为乐，中心是要乐于帮助别人。",
        commonPitfalls: ["抓不住图画的中心"]
      },
      {
        prompt: "【看图写话】写下雪的场景，下面哪句话写得最具体？",
        correct: "雪花像洁白的鹅毛，慢慢地从天上飘下来。",
        wrongs: ["下雪了。", "雪很白。", "天上有雪。"],
        explanation: "用比喻和动作把雪花的样子写出来，句子更生动具体。",
        commonPitfalls: ["描写不具体"]
      }
    ],
    "c2-usage": [
      {
        prompt: "【综合语用】写留言条时，最需要写清楚的是哪一项？",
        correct: "留言给谁、什么事、谁留言",
        wrongs: ["人物外貌和景物", "故事开头和结尾", "拼音声母和韵母"],
        explanation: "留言条要把对象、事情和署名写清楚。",
        commonPitfalls: ["应用文要素缺失"]
      },
      {
        prompt: "【综合语用】给同学写请假条，下面哪项内容最不能少？",
        correct: "请假的原因和时间",
        wrongs: ["自己的爱好", "喜欢的颜色", "家里的宠物"],
        explanation: "请假条要写清为什么请假、请假多久，别人才明白。",
        commonPitfalls: ["请假条要素不全"]
      },
      {
        prompt: "【综合语用】接电话时，第一句话说什么最合适？",
        correct: "你好，请问你找谁？",
        wrongs: ["你是谁呀", "干什么", "不知道"],
        explanation: "接电话要先礼貌问好，再问清对方要找谁。",
        commonPitfalls: ["电话礼貌用语缺失"]
      },
      {
        prompt: "【综合语用】写通知时，下面哪一项内容最重要？",
        correct: "活动的时间、地点和内容",
        wrongs: ["自己的心情", "天气变化", "同学的外貌"],
        explanation: "通知要让大家知道什么时候、在哪里、做什么。",
        commonPitfalls: ["通知要素不清"]
      },
      {
        prompt: "【综合语用】问路时，怎样说最有礼貌又清楚？",
        correct: "您好，请问去图书馆怎么走？",
        wrongs: ["图书馆在哪", "喂，图书馆", "带我去图书馆"],
        explanation: "问路要先礼貌问候，再清楚说出要去的地方。",
        commonPitfalls: ["问路不礼貌或不清楚"]
      }
    ],
    "c3-word-meaning": [
      {
        prompt: "【字词辨析】“他听得很认真”中“认真”的近义词是哪一个？",
        correct: "仔细",
        wrongs: ["热闹", "明亮", "慌忙"],
        explanation: "“认真”和“仔细”都表示不马虎。",
        commonPitfalls: ["不联系语境理解词义"]
      },
      {
        prompt: "【字词辨析】“天气渐渐变冷了”中“渐渐”的意思最接近哪一个？",
        correct: "慢慢",
        wrongs: ["立刻", "忽然", "永远"],
        explanation: "“渐渐”表示变化很慢，和“慢慢”意思接近。",
        commonPitfalls: ["把表示快慢的词理解反"]
      },
      {
        prompt: "【字词辨析】“这道题很简单”中“简单”的反义词是哪一个？",
        correct: "复杂",
        wrongs: ["容易", "普通", "干净"],
        explanation: "“简单”和“复杂”意思相反，是一对反义词。",
        commonPitfalls: ["近义词和反义词混淆"]
      },
      {
        prompt: "【字词辨析】“小溪的水很清澈”中“清澈”是形容什么的？",
        correct: "水很清、很透明",
        wrongs: ["水很多", "水很快", "水很冷"],
        explanation: "“清澈”形容水清而透明，能看清水底。",
        commonPitfalls: ["望文生义"]
      },
      {
        prompt: "【字词辨析】联系句子，“他脸上露出得意的神情”里“得意”表示什么心情？",
        correct: "满意、高兴",
        wrongs: ["生气", "害怕", "难过"],
        explanation: "“得意”指因为称心如意而高兴、满意。",
        commonPitfalls: ["不联系语境理解词义"]
      }
    ],
    "c3-sentence-transform": [
      {
        prompt: "【句式转换】“小明把书放进书包。”改成被字句正确的是哪一项？",
        correct: "书被小明放进书包。",
        wrongs: ["小明被书放进书包。", "书把小明放进书包。", "放进书包小明书。"],
        explanation: "被字句要把原来被处理的事物“书”放到前面。",
        commonPitfalls: ["把施事和受事颠倒"]
      },
      {
        prompt: "【句式转换】“风把树叶吹落了。”改成被字句正确的是哪一项？",
        correct: "树叶被风吹落了。",
        wrongs: ["风被树叶吹落了。", "树叶把风吹落了。", "吹落了风树叶。"],
        explanation: "被字句里被处理的“树叶”放前面，“风”放到“被”后面。",
        commonPitfalls: ["主语宾语颠倒"]
      },
      {
        prompt: "【句式转换】把“难道我们能不爱护环境吗？”改成陈述句，哪一句意思相同？",
        correct: "我们应该爱护环境。",
        wrongs: ["我们不用爱护环境。", "我们能爱护环境吗。", "爱护环境难道吗。"],
        explanation: "反问句表达肯定的意思，去掉反问就是“我们应该爱护环境”。",
        commonPitfalls: ["反问句改陈述句意思弄反"]
      },
      {
        prompt: "【句式转换】“老师表扬了小红。”改成把字句正确的是哪一项？",
        correct: "老师把小红表扬了。",
        wrongs: ["小红把老师表扬了。", "老师被小红表扬了。", "表扬了小红老师把。"],
        explanation: "把字句里做动作的“老师”在前，“把”后面跟被处理的“小红”。",
        commonPitfalls: ["把字句语序出错"]
      },
      {
        prompt: "【句式转换】把“教室里很安静。”改成感叹句，哪一句最合适？",
        correct: "教室里多么安静啊！",
        wrongs: ["教室里安静吗？", "教室里不安静。", "安静教室里。"],
        explanation: "感叹句可以加“多么……啊”，句末用感叹号表达强烈语气。",
        commonPitfalls: ["感叹句和疑问句混淆"]
      }
    ],
    "c3-rhetoric": [
      {
        prompt: "【修辞初步】“弯弯的月亮像小船”使用了哪种修辞？",
        correct: "比喻",
        wrongs: ["排比", "反问", "夸张"],
        explanation: "句中用“像”把月亮比作小船，是比喻。",
        commonPitfalls: ["修辞名称混淆"]
      },
      {
        prompt: "【修辞初步】“小鸟在枝头唱着欢快的歌”使用了哪种修辞？",
        correct: "拟人",
        wrongs: ["比喻", "排比", "反问"],
        explanation: "小鸟本不会“唱歌”，把它当人来写，是拟人。",
        commonPitfalls: ["比喻和拟人混淆"]
      },
      {
        prompt: "【修辞初步】“操场上有的跳绳，有的踢球，有的跑步”使用了哪种修辞？",
        correct: "排比",
        wrongs: ["比喻", "拟人", "夸张"],
        explanation: "连用三个结构相似的“有的……”，是排比。",
        commonPitfalls: ["没数清并列句"]
      },
      {
        prompt: "【修辞初步】“他饿得能吃下一头牛”使用了哪种修辞？",
        correct: "夸张",
        wrongs: ["比喻", "拟人", "排比"],
        explanation: "“吃下一头牛”是故意说得很大，表示非常饿，是夸张。",
        commonPitfalls: ["夸张和比喻混淆"]
      },
      {
        prompt: "【修辞初步】“春风像妈妈的手，轻轻抚摸着我的脸”主要使用了哪种修辞？",
        correct: "比喻",
        wrongs: ["反问", "排比", "夸张"],
        explanation: "用“像”把春风比作妈妈的手，是比喻。",
        commonPitfalls: ["比喻和拟人分不清"]
      }
    ],
    "c3-paragraph-reading": [
      {
        prompt: "【段落阅读】一段话围绕“公园真美”写花、树和小湖，这段主要写什么？",
        correct: "公园真美",
        wrongs: ["小明去买书", "天气很冷", "教室很安静"],
        explanation: "花、树、小湖都围绕“公园真美”展开。",
        commonPitfalls: ["只抓细节不概括中心"]
      },
      {
        prompt: "【段落阅读】一段话先写“早上”，再写“中午”，最后写“傍晚”的景色，这段是按什么顺序写的？",
        correct: "时间顺序",
        wrongs: ["从远到近", "从上到下", "由多到少"],
        explanation: "“早上、中午、傍晚”是表示时间的词，说明按时间顺序写。",
        commonPitfalls: ["分不清写作顺序"]
      },
      {
        prompt: "【段落阅读】一段话开头写“我家的小猫非常可爱”，接着写它的样子和动作。这一句在段落中起什么作用？",
        correct: "总起，概括这段的意思",
        wrongs: ["总结全文", "举一个例子", "提出疑问"],
        explanation: "开头概括、后面具体说明，这样的句子是总起句。",
        commonPitfalls: ["分不清总起句和总结句"]
      },
      {
        prompt: "【段落阅读】短文说“秋天到了，果园里的苹果红了，梨黄了，葡萄紫了”。这段主要写什么季节？",
        correct: "秋天",
        wrongs: ["春天", "夏天", "冬天"],
        explanation: "苹果红、梨黄、葡萄紫都是秋天果园成熟的景象。",
        commonPitfalls: ["景物和季节对应错误"]
      },
      {
        prompt: "【段落阅读】一段话围绕“小明是个爱帮助人的孩子”写了他扶老人、帮同学、让座位。这些内容和中心句是什么关系？",
        correct: "用具体事例说明中心句",
        wrongs: ["和中心句无关", "只是随便举例", "和中心句相反"],
        explanation: "三件事都在说明小明爱帮助人，是围绕中心句写的事例。",
        commonPitfalls: ["看不出事例和中心的联系"]
      }
    ],
    "c3-writing-piece": [
      {
        prompt: "【习作片段】围绕“校园真热闹”这个意思，下面哪一句最具体？",
        correct: "操场上，同学们有的跳绳，有的跑步，还有的踢球。",
        wrongs: ["校园真热闹。", "我很喜欢校园。", "今天是星期三。"],
        explanation: "具体片段要围绕中心写出画面和活动。",
        commonPitfalls: ["只重复中心句"]
      },
      {
        prompt: "【习作片段】要写出“妈妈很辛苦”，下面哪一句最能表现出来？",
        correct: "深夜，妈妈还在灯下为我缝补破了的书包。",
        wrongs: ["妈妈很辛苦。", "我爱妈妈。", "妈妈是女的。"],
        explanation: "通过具体的动作和场景，比直接说“辛苦”更有感染力。",
        commonPitfalls: ["只讲道理不写画面"]
      },
      {
        prompt: "【习作片段】描写“天很热”，下面哪一句写得最生动？",
        correct: "太阳火辣辣地照着，柏油马路都快被晒化了。",
        wrongs: ["天很热。", "今天温度高。", "我觉得热。"],
        explanation: "用具体的景物和感受来表现热，比直接说“热”更生动。",
        commonPitfalls: ["描写笼统"]
      },
      {
        prompt: "【习作片段】一篇写事的作文，开头下面哪种写法比较好？",
        correct: "放学路上发生的一件事，到现在我还记得清清楚楚。",
        wrongs: ["我要写一件事。", "这就是我的作文。", "今天我很无聊。"],
        explanation: "好的开头能引出要写的事，又能引起读者兴趣。",
        commonPitfalls: ["开头空洞"]
      },
      {
        prompt: "【习作片段】写完一件事后，下面哪种结尾最合适？",
        correct: "这件事让我明白了帮助别人是快乐的。",
        wrongs: ["完了。", "我写好了。", "今天天气不错。"],
        explanation: "写事的结尾可以写出自己的感受或明白的道理。",
        commonPitfalls: ["结尾和内容无关"]
      }
    ],
    "c3-poem": [
      {
        prompt: "【古诗理解】“遥知不是雪，为有暗香来”写的是哪种植物？",
        correct: "梅花",
        wrongs: ["荷花", "菊花", "桃花"],
        explanation: "这两句出自写梅花的诗，“暗香”是关键。",
        commonPitfalls: ["只看“雪”误判"]
      },
      {
        prompt: "【古诗理解】“停车坐爱枫林晚”中的“坐”是什么意思？",
        correct: "因为",
        wrongs: ["坐下", "座位", "马上"],
        explanation: "古诗里“坐”常表示“因为”，这句是说因为喜爱枫林才停下车。",
        commonPitfalls: ["用今义理解古诗字词"]
      },
      {
        prompt: "【古诗理解】“儿童急走追黄蝶”中的“走”是什么意思？",
        correct: "跑",
        wrongs: ["行走", "离开", "走路"],
        explanation: "古诗里“走”是“跑”的意思，写儿童飞快地追蝴蝶。",
        commonPitfalls: ["古今词义不分"]
      },
      {
        prompt: "【古诗理解】“九月九日忆山东兄弟”这首诗表达了什么感情？",
        correct: "思念家乡和亲人",
        wrongs: ["喜爱春天", "赞美老师", "热爱运动"],
        explanation: "“忆兄弟”写出诗人在重阳节思念家乡亲人的心情。",
        commonPitfalls: ["不理解古诗情感"]
      },
      {
        prompt: "【古诗理解】“霜叶红于二月花”是说霜叶比二月的花怎么样？",
        correct: "更红、更美",
        wrongs: ["一样红", "没有花红", "已经枯了"],
        explanation: "“红于”就是“比……更红”，赞美经霜的枫叶比春花还红艳。",
        commonPitfalls: ["不理解“于”表示比较"]
      }
    ],
    "c3-accumulation": [
      {
        prompt: "【课内外积累】“亡羊补牢”告诉我们的意思是哪一个？",
        correct: "出了问题及时补救还不晚",
        wrongs: ["羊越多越好", "门不用修", "只要跑得快"],
        explanation: "成语积累要理解故事背后的意思。",
        commonPitfalls: ["只看字面意思"]
      },
      {
        prompt: "【课内外积累】“守株待兔”这个成语用来比喻什么样的人？",
        correct: "不努力，只想不劳而获、靠运气的人",
        wrongs: ["很勤劳的人", "跑得很快的人", "很聪明的人"],
        explanation: "农夫等着兔子再撞树桩，比喻死守经验、妄想不劳而获。",
        commonPitfalls: ["不理解成语寓意"]
      },
      {
        prompt: "【课内外积累】“拔苗助长”告诉我们什么道理？",
        correct: "做事不能急于求成，要遵循规律",
        wrongs: ["种地要多施肥", "苗长得越快越好", "做事要用力气"],
        explanation: "把苗拔高反而害死了苗，说明违背规律、急于求成会坏事。",
        commonPitfalls: ["只看字面不懂道理"]
      },
      {
        prompt: "【课内外积累】下面哪个词语是形容做事很有把握的？",
        correct: "胸有成竹",
        wrongs: ["七上八下", "手忙脚乱", "无精打采"],
        explanation: "“胸有成竹”比喻做事之前已有通盘考虑，很有把握。",
        commonPitfalls: ["成语意思张冠李戴"]
      },
      {
        prompt: "【课内外积累】“画蛇添足”这个成语提醒我们什么？",
        correct: "做多余的事反而把事情弄糟",
        wrongs: ["画画要认真", "蛇有四只脚", "要多动脑筋"],
        explanation: "给蛇画上脚是多此一举，比喻做了多余的事反而不好。",
        commonPitfalls: ["不理解成语寓意"]
      }
    ],
    "c3-practice": [
      {
        prompt: "【综合实践表达】观察记录植物变化，哪一项最适合写进记录？",
        correct: "今天新长出两片嫩绿的叶子",
        wrongs: ["我今天去了操场跑步", "这本书的插图很好看", "妈妈做的晚饭很香"],
        explanation: "观察记录要写清具体变化。",
        commonPitfalls: ["记录空泛"]
      },
      {
        prompt: "【综合实践表达】做观察记录时，下面哪一项信息最应该写清楚？",
        correct: "观察的日期和看到的变化",
        wrongs: ["自己喜欢的动画片", "同桌的生日", "明天的天气预报"],
        explanation: "观察记录要写明时间和观察到的具体变化，便于比较。",
        commonPitfalls: ["记录要素不全"]
      },
      {
        prompt: "【综合实践表达】小组要办一期“节约用水”手抄报，下面哪个内容最合适？",
        correct: "介绍生活中节约用水的小方法",
        wrongs: ["自己最爱的零食", "喜欢的游戏排名", "同学的身高体重"],
        explanation: "手抄报内容要围绕“节约用水”这个主题。",
        commonPitfalls: ["内容偏离主题"]
      },
      {
        prompt: "【综合实践表达】记录一次小实验，下面哪句话写得最清楚？",
        correct: "把盐放进水里搅一搅，盐慢慢化没了。",
        wrongs: ["做实验很好玩。", "我做了实验。", "实验用到了水。"],
        explanation: "实验记录要写清做了什么、看到什么现象。",
        commonPitfalls: ["只写感受不写过程"]
      },
      {
        prompt: "【综合实践表达】采访长辈了解家乡的变化，下面哪个问题问得最好？",
        correct: "以前的街道和现在比有什么不一样？",
        wrongs: ["您今年多大了？", "您喜欢吃什么？", "您叫什么名字？"],
        explanation: "采访要围绕“家乡的变化”提问，才能得到有用的内容。",
        commonPitfalls: ["提问偏离采访主题"]
      }
    ],
    "c4-word-sentence": [
      {
        prompt: "【词句段运用】“终于”放入哪一句最能表现等待后的结果？",
        correct: "等了很久，公交车终于来了。",
        wrongs: ["我终于正在吃饭。", "终于蓝色很高。", "书包终于桌子。"],
        explanation: "“终于”表示经过等待或努力后出现结果。",
        commonPitfalls: ["词语语境不匹配"]
      },
      {
        prompt: "【词句段运用】“不但……而且……”填入哪一句最通顺？",
        correct: "他不但学习好，而且乐于助人。",
        wrongs: ["他不但学习好，而且很矮。", "不但下雨而且太阳。", "他而且不但爱笑。"],
        explanation: "“不但……而且……”表示递进，前后要是同类、程度加深的内容。",
        commonPitfalls: ["关联词搭配不当"]
      },
      {
        prompt: "【词句段运用】“虽然……但是……”填入哪一句最合适？",
        correct: "虽然天气很冷，但是他坚持锻炼。",
        wrongs: ["虽然天气冷，但是很冷。", "虽然他跑，但是苹果。", "但是虽然他来了。"],
        explanation: "“虽然……但是……”表示转折，前后意思要相反。",
        commonPitfalls: ["关联词表达的关系用错"]
      },
      {
        prompt: "【词句段运用】下面哪一句用“渐渐”用得最恰当？",
        correct: "天色渐渐暗了下来。",
        wrongs: ["他渐渐一下子跳起来。", "渐渐苹果很甜。", "我渐渐立刻跑走了。"],
        explanation: "“渐渐”表示慢慢地变化，不能和“一下子、立刻”一起用。",
        commonPitfalls: ["词语和句意矛盾"]
      },
      {
        prompt: "【词句段运用】要表示“只要……就……”的条件关系，哪一句正确？",
        correct: "只要认真复习，就能取得好成绩。",
        wrongs: ["只要认真复习，但是好成绩。", "只要苹果，就跑步。", "就只要复习成绩。"],
        explanation: "“只要……就……”表示条件，满足前面就有后面的结果。",
        commonPitfalls: ["关联词搭配错误"]
      }
    ],
    "c4-sick-sentence": [
      {
        prompt: "【病句修改】下面哪一句没有语病？",
        correct: "我们认真完成了作业。",
        wrongs: ["我们认真作业完成了。", "通过努力，使我进步了。", "他大约一定会来。"],
        explanation: "A 句成分完整、搭配恰当、语序通顺。",
        commonPitfalls: ["成分残缺", "语序不当"]
      },
      {
        prompt: "【病句修改】“他大约一定会来。”这句话的毛病是什么？",
        correct: "“大约”和“一定”意思矛盾，重复多余",
        wrongs: ["缺少标点", "用词太少", "没有主语"],
        explanation: "“大约”表示不确定，“一定”表示确定，二者矛盾，应删去一个。",
        commonPitfalls: ["前后矛盾看不出"]
      },
      {
        prompt: "【病句修改】“通过这次活动，使我受到了教育。”应该怎么改？",
        correct: "删去“使”，改成“这次活动让我受到了教育”",
        wrongs: ["删去“教育”", "加一个问号", "把“我”去掉"],
        explanation: "“通过……使……”连用会导致句子缺主语，去掉“使”即可。",
        commonPitfalls: ["成分残缺辨认不出"]
      },
      {
        prompt: "【病句修改】“他从小就养成了讲卫生。”缺少了什么？",
        correct: "缺少宾语，应改成“养成了讲卫生的好习惯”",
        wrongs: ["缺少主语", "缺少标点", "缺少时间"],
        explanation: "“养成了”后面缺少宾语中心词，要补上“好习惯”。",
        commonPitfalls: ["宾语残缺"]
      },
      {
        prompt: "【病句修改】“我把作业几乎全部写完了。”改正后哪一句更通顺？",
        correct: "我几乎把作业全部写完了。",
        wrongs: ["我把几乎作业写完全部。", "作业我把全部几乎写完。", "几乎我把写完作业全部。"],
        explanation: "“几乎”修饰“全部”，位置要放在“把”字前面，语序才通顺。",
        commonPitfalls: ["语序不当"]
      }
    ],
    "c4-rhetoric-punctuation": [
      {
        prompt: "【修辞与标点】“这朵花笑弯了腰。”主要使用了哪种修辞？",
        correct: "拟人",
        wrongs: ["设问", "排比", "反问"],
        explanation: "把花当作人来写，说它“笑弯了腰”，是拟人。",
        commonPitfalls: ["修辞和标点混淆"]
      },
      {
        prompt: "【修辞与标点】“是谁把教室打扫得这么干净？原来是值日生。”这里用了哪种修辞？",
        correct: "设问",
        wrongs: ["反问", "比喻", "夸张"],
        explanation: "先自己提问再自己回答，是设问。",
        commonPitfalls: ["设问和反问混淆"]
      },
      {
        prompt: "【修辞与标点】“难道我们能忘记老师的教导吗？”这句用了哪种修辞？",
        correct: "反问",
        wrongs: ["设问", "拟人", "排比"],
        explanation: "用问句表达“不能忘记”的肯定意思，只问不答，是反问。",
        commonPitfalls: ["反问和设问分不清"]
      },
      {
        prompt: "【修辞与标点】引用别人说的话时，应该用哪种标点把话引起来？",
        correct: "引号“ ”",
        wrongs: ["书名号《 》", "破折号 ——", "省略号 ……"],
        explanation: "直接引用人物说的话，要用引号标出来。",
        commonPitfalls: ["引号和书名号混淆"]
      },
      {
        prompt: "【修辞与标点】“《西游记》是一部有名的小说。”句中书名应该用什么标点？",
        correct: "书名号《 》",
        wrongs: ["引号“ ”", "括号（ ）", "顿号、"],
        explanation: "书名、篇名要用书名号《 》标出来。",
        commonPitfalls: ["书名号和引号混淆"]
      }
    ],
    "c4-modern-reading": [
      {
        prompt: "【现代文阅读】短文写妈妈冒雨送伞，最能体现妈妈什么特点？",
        correct: "关心孩子",
        wrongs: ["喜欢画画", "害怕读书", "不爱出门"],
        explanation: "人物行为“冒雨送伞”体现关心。",
        commonPitfalls: ["人物特点概括不准"]
      },
      {
        prompt: "【现代文阅读】短文写“老爷爷把捡到的钱包交给了警察”，这表现了老爷爷什么品质？",
        correct: "拾金不昧、诚实",
        wrongs: ["爱管闲事", "很有钱", "记性好"],
        explanation: "捡到钱包主动上交，表现了老爷爷诚实、不贪财的品质。",
        commonPitfalls: ["由行为概括品质不准"]
      },
      {
        prompt: "【现代文阅读】读文章时，要概括一段话的主要内容，最好的方法是什么？",
        correct: "抓住这段话的关键句和主要事件",
        wrongs: ["把每个字都背下来", "只看第一个词", "数一数有几句话"],
        explanation: "概括内容要找关键句、抓住主要人物和事件。",
        commonPitfalls: ["概括抓不住重点"]
      },
      {
        prompt: "【现代文阅读】短文结尾写“我明白了：付出才有收获”。这句话在文中起什么作用？",
        correct: "点明道理，总结全文",
        wrongs: ["提出问题", "介绍人物外貌", "描写景物"],
        explanation: "结尾点出道理、总结全文，是文章的中心所在。",
        commonPitfalls: ["看不出结尾句的作用"]
      },
      {
        prompt: "【现代文阅读】文章说“他攥紧拳头，一句话也不说”，这主要描写了人物的什么？",
        correct: "动作和神态",
        wrongs: ["外貌", "语言", "居住环境"],
        explanation: "“攥紧拳头”是动作，“一句话不说”是神态，表现人物内心。",
        commonPitfalls: ["描写方法辨认不清"]
      }
    ],
    "c4-writing-topic": [
      {
        prompt: "【习作审题】题目是“记一次难忘的活动”，选材最合适的是哪一项？",
        correct: "写参加校园运动会接力赛的经过",
        wrongs: ["介绍一种文具的用途", "默写一首古诗", "记录一顿普通午饭"],
        explanation: "审题要抓“活动”和“难忘”。",
        commonPitfalls: ["选材跑题"]
      },
      {
        prompt: "【习作审题】题目是“我的好朋友”，下面哪个选材最切题？",
        correct: "写好朋友帮助我、和我一起进步的事",
        wrongs: ["介绍我家的新房子", "写一次旅游见闻", "抄写一段课文"],
        explanation: "这个题目要写“人”，要通过具体事例表现朋友的特点。",
        commonPitfalls: ["写人却没有具体事例"]
      },
      {
        prompt: "【习作审题】题目是“一件后悔的事”，审题时要特别抓住哪个词？",
        correct: "后悔",
        wrongs: ["一件", "事", "的"],
        explanation: "“后悔”是题眼，选的事一定要能体现出后悔的心情。",
        commonPitfalls: ["抓不住题眼"]
      },
      {
        prompt: "【习作审题】写“难忘的一节课”，下面哪种开头更能吸引人？",
        correct: "那节课发生的事，直到现在我都忘不了。",
        wrongs: ["我要写一节课。", "今天我很高兴。", "上课铃响了。"],
        explanation: "开头点出“忘不了”，紧扣题目又能引起兴趣。",
        commonPitfalls: ["开头没扣题"]
      },
      {
        prompt: "【习作审题】题目要求写“景”，下面哪个内容跑题了？",
        correct: "详细写和同学吵架的经过",
        wrongs: ["写公园清晨的景色", "写雨后的田野", "写秋天的校园"],
        explanation: "写景要突出景物，写“吵架经过”属于写事，跑题了。",
        commonPitfalls: ["写景变写事"]
      }
    ],
    "c4-poem-classic": [
      {
        prompt: "【古诗文积累】“不识庐山真面目，只缘身在此山中”告诉我们什么？",
        correct: "看问题有时要跳出局部",
        wrongs: ["山里没有路", "庐山没有景色", "只要低头走路"],
        explanation: "诗句借看山说明认识事物要有整体角度。",
        commonPitfalls: ["诗意理解停留字面"]
      },
      {
        prompt: "【古诗文积累】“欲穷千里目，更上一层楼”这两句诗蕴含的道理是什么？",
        correct: "想要有更高的成就，就要不断进取",
        wrongs: ["楼越高越危险", "看风景要花钱", "走路要抬头"],
        explanation: "登得越高看得越远，比喻只有不断努力才能有更大的收获。",
        commonPitfalls: ["只看字面不懂哲理"]
      },
      {
        prompt: "【古诗文积累】“谁言寸草心，报得三春晖”表达了什么感情？",
        correct: "子女难以报答母亲的深恩",
        wrongs: ["春天草长得快", "太阳很温暖", "小草很坚强"],
        explanation: "用小草报答不了阳光，比喻子女难报母亲养育之恩。",
        commonPitfalls: ["不理解比喻的含义"]
      },
      {
        prompt: "【古诗文积累】“居高声自远，非是藉秋风”借蝉说明了什么道理？",
        correct: "品格高尚的人名声自然远扬，不需要凭借外力",
        wrongs: ["蝉的叫声很大", "秋天风很大", "站高处更凉快"],
        explanation: "诗人借蝉自喻，说明立身高洁的人声名远播靠的是自身。",
        commonPitfalls: ["托物言志理解不到位"]
      },
      {
        prompt: "【古诗文积累】“黑发不知勤学早，白首方悔读书迟”劝告我们什么？",
        correct: "要趁年轻珍惜时间、努力学习",
        wrongs: ["老了要染头发", "读书要读得慢", "早睡才能早起"],
        explanation: "这两句劝人年少时就要勤奋读书，不要老了才后悔。",
        commonPitfalls: ["劝学主题理解偏差"]
      }
    ],
    "c4-info-reading": [
      {
        prompt: "【资料提取】通知写“周五下午三点在操场集合”，集合地点是哪里？",
        correct: "操场",
        wrongs: ["图书馆", "教室", "校门口"],
        explanation: "资料提取题要从材料中直接定位地点。",
        commonPitfalls: ["时间地点混淆"]
      },
      {
        prompt: "【资料提取】通知写“周五下午三点在操场集合”，集合时间是什么时候？",
        correct: "周五下午三点",
        wrongs: ["周五上午三点", "周六下午三点", "周五中午"],
        explanation: "要从材料中准确提取时间，注意是“下午三点”。",
        commonPitfalls: ["时间信息看错"]
      },
      {
        prompt: "【资料提取】药品说明写“儿童每次一片，每天两次”。一个孩子一天一共吃几片？",
        correct: "两片",
        wrongs: ["一片", "三片", "四片"],
        explanation: "每次一片、每天两次，一天就是 1×2＝2 片。",
        commonPitfalls: ["没结合数量计算"]
      },
      {
        prompt: "【资料提取】图书借阅规则写“每人每次最多借三本，借期两周”。下面哪种做法符合规定？",
        correct: "借两本，十天后归还",
        wrongs: ["借五本", "借期一个月", "一次借十本"],
        explanation: "不超过三本、不超过两周都符合规定，借两本、十天归还可以。",
        commonPitfalls: ["没有对照规则判断"]
      },
      {
        prompt: "【资料提取】车站牌写“开往东站，途经市图书馆、体育馆、火车站”。这趟车不到下面哪个站？",
        correct: "飞机场",
        wrongs: ["市图书馆", "体育馆", "火车站"],
        explanation: "牌子上没有“飞机场”，说明这趟车不到飞机场。",
        commonPitfalls: ["没逐条核对信息"]
      }
    ],
    "c4-usage": [
      {
        prompt: "【综合语用】写通知时，下面哪项信息最必须写清？",
        correct: "时间、地点、事情、通知对象",
        wrongs: ["人物外貌和心情", "景物样子和声音", "古诗题目和作者"],
        explanation: "通知属于应用文，要素必须清楚。",
        commonPitfalls: ["应用文格式要素缺失"]
      },
      {
        prompt: "【综合语用】写一则寻物启事，下面哪项内容最重要？",
        correct: "丢失物品的样子和联系方式",
        wrongs: ["自己的爱好", "喜欢的季节", "昨天的作业"],
        explanation: "寻物启事要写清丢了什么、什么样子、怎么联系失主。",
        commonPitfalls: ["启事要素不全"]
      },
      {
        prompt: "【综合语用】给外地的爷爷写信，信的开头应该先写什么？",
        correct: "对爷爷的称呼和问候",
        wrongs: ["自己的成绩", "天气预报", "作文题目"],
        explanation: "书信开头要先写称呼（如“亲爱的爷爷”）并问好。",
        commonPitfalls: ["书信格式缺称呼"]
      },
      {
        prompt: "【综合语用】制作一张活动海报，下面哪项内容可以不写？",
        correct: "自己昨天做的梦",
        wrongs: ["活动的时间", "活动的地点", "活动的主题"],
        explanation: "海报要突出活动信息，与活动无关的内容不必写。",
        commonPitfalls: ["内容和主题无关"]
      },
      {
        prompt: "【综合语用】在班级群里通知“明天带彩笔”，怎样表达最清楚礼貌？",
        correct: "各位同学请注意：明天美术课请带上彩笔，谢谢。",
        wrongs: ["都带彩笔！", "记得东西", "明天有事"],
        explanation: "通知要说清对象、事情，语气礼貌，别人才明白该做什么。",
        commonPitfalls: ["通知含糊不清"]
      }
    ],
    "c5-context-word": [
      {
        prompt: "【语境词语】“他郑重地接过奖状”中“郑重”最接近哪种意思？",
        correct: "严肃认真",
        wrongs: ["轻松随意", "慌张急促", "幽默风趣"],
        explanation: "结合“接过奖状”的语境，“郑重”表示严肃认真。",
        commonPitfalls: ["脱离语境解释词义"]
      },
      {
        prompt: "【语境词语】“听到这个消息，大家都沸腾了”中“沸腾”在句中是什么意思？",
        correct: "情绪高涨、非常热烈",
        wrongs: ["水烧开了", "很生气", "很安静"],
        explanation: "“沸腾”本指水开，这里比喻大家情绪高涨、场面热烈。",
        commonPitfalls: ["只用本义不看语境"]
      },
      {
        prompt: "【语境词语】“老师意味深长地看了我一眼”中“意味深长”形容什么？",
        correct: "含义深，让人回味",
        wrongs: ["时间很长", "路程很远", "声音很大"],
        explanation: "“意味深长”指话语或神情含义深刻，值得细细体会。",
        commonPitfalls: ["望文生义理解成“时间长”"]
      },
      {
        prompt: "【语境词语】“他做事一丝不苟”中“一丝不苟”是什么意思？",
        correct: "非常认真，一点也不马虎",
        wrongs: ["一根线也没有", "很小气", "动作很慢"],
        explanation: "“苟”是马虎，“一丝不苟”指做事认真细致，毫不马虎。",
        commonPitfalls: ["不理解成语中“苟”的意思"]
      },
      {
        prompt: "【语境词语】“面对困难，他毫不气馁”中“气馁”的意思是什么？",
        correct: "失去信心和勇气",
        wrongs: ["生气发火", "喘不上气", "很有力气"],
        explanation: "“气馁”指遇到挫折失去信心，“毫不气馁”就是没有灰心。",
        commonPitfalls: ["把“气馁”误解为“生气”"]
      }
    ],
    "c5-paragraph-structure": [
      {
        prompt: "【句段篇章】一段先总写“秋天很美”，再写田野、果园、小河，这是哪种结构？",
        correct: "总分结构",
        wrongs: ["倒叙结构", "并列字词", "问答格式"],
        explanation: "先总说，再分写几个方面，是总分结构。",
        commonPitfalls: ["段落关系判断错误"]
      },
      {
        prompt: "【句段篇章】一段话先分别写了操场、教室、花园，最后说“我们的校园真美”，这是哪种结构？",
        correct: "分总结构",
        wrongs: ["总分结构", "倒叙结构", "并列结构"],
        explanation: "先分写几个方面，最后总结，是分总结构。",
        commonPitfalls: ["分总和总分弄反"]
      },
      {
        prompt: "【句段篇章】文章开头先写结果，再回过头交代事情的经过，这种记叙顺序是什么？",
        correct: "倒叙",
        wrongs: ["顺叙", "插叙", "分述"],
        explanation: "先写结果、再回叙经过，是倒叙，能设置悬念、吸引读者。",
        commonPitfalls: ["记叙顺序分不清"]
      },
      {
        prompt: "【句段篇章】记叙中间插入一段与主要情节有关的往事，然后接着往下写，这叫什么？",
        correct: "插叙",
        wrongs: ["倒叙", "顺叙", "总结"],
        explanation: "在叙述中暂时中断，插入相关往事，之后再接原来的内容，是插叙。",
        commonPitfalls: ["插叙和倒叙混淆"]
      },
      {
        prompt: "【句段篇章】一段话中，起承上启下作用的句子叫什么？",
        correct: "过渡句",
        wrongs: ["总起句", "总结句", "中心句"],
        explanation: "既连接上文又引出下文的句子是过渡句，使文章连贯。",
        commonPitfalls: ["各类句子作用分不清"]
      }
    ],
    "c5-reading": [
      {
        prompt: "【阅读理解】文章反复写老人的微笑，最可能是在表现什么？",
        correct: "老人亲切乐观",
        wrongs: ["老人很生气", "老人不会说话", "老人讨厌孩子"],
        explanation: "人物神态反复出现，通常服务于人物特点。",
        commonPitfalls: ["表达方法和内容割裂"]
      },
      {
        prompt: "【阅读理解】文章多处描写风雨交加的环境，这样写的主要作用可能是什么？",
        correct: "烘托紧张的气氛，突出人物处境艰难",
        wrongs: ["说明天气预报", "凑够文章字数", "介绍季节知识"],
        explanation: "环境描写往往用来烘托气氛、衬托人物心情或处境。",
        commonPitfalls: ["看不出环境描写的作用"]
      },
      {
        prompt: "【阅读理解】读记叙文，要体会人物的内心，最应该关注什么？",
        correct: "人物的语言、动作、神态和心理描写",
        wrongs: ["文章的字数", "有几个自然段", "标题有几个字"],
        explanation: "人物的言行和心理描写是体会内心情感的关键。",
        commonPitfalls: ["脱离描写空谈情感"]
      },
      {
        prompt: "【阅读理解】文章题目是“灯”，全文借灯写人的关怀，这个题目的作用是什么？",
        correct: "既是线索，又含有象征意义",
        wrongs: ["只是随便起的", "说明文章很短", "表示时间地点"],
        explanation: "“灯”贯穿全文是线索，又象征温暖和关怀，题目含义深。",
        commonPitfalls: ["体会不出题目的深意"]
      },
      {
        prompt: "【阅读理解】概括文章的主要内容，比较好的方法是什么？",
        correct: "说清楚“谁做了什么、结果怎样”",
        wrongs: ["把开头一句照抄", "只写自己的感受", "数一数有几段"],
        explanation: "记叙文可以抓住主要人物、事件和结果来概括主要内容。",
        commonPitfalls: ["概括不完整或偏离主要事件"]
      }
    ],
    "c5-expository-reading": [
      {
        prompt: "【说明与叙事阅读】说明文介绍“竹子的生长特点”，阅读时应先抓什么？",
        correct: "说明对象和特点",
        wrongs: ["人物对话", "诗人情感", "故事结局"],
        explanation: "说明文阅读先抓说明对象，再找特点。",
        commonPitfalls: ["文体阅读方法混用"]
      },
      {
        prompt: "【说明与叙事阅读】“鲸的最大的可达十几万公斤”这句话用了什么说明方法？",
        correct: "列数字",
        wrongs: ["打比方", "作比较", "举例子"],
        explanation: "用具体数字“十几万公斤”来说明，是列数字的说明方法。",
        commonPitfalls: ["说明方法辨认不清"]
      },
      {
        prompt: "【说明与叙事阅读】“松鼠的尾巴像一把降落伞”用了什么说明方法？",
        correct: "打比方",
        wrongs: ["列数字", "作比较", "分类别"],
        explanation: "把尾巴比作降落伞，用打比方让说明更形象生动。",
        commonPitfalls: ["打比方和作比较混淆"]
      },
      {
        prompt: "【说明与叙事阅读】“太阳离我们约有一亿五千万公里，比月亮远得多”主要用了什么说明方法？",
        correct: "作比较",
        wrongs: ["打比方", "举例子", "下定义"],
        explanation: "把太阳和月亮的远近作比较，突出太阳离得远。",
        commonPitfalls: ["作比较辨认不出"]
      },
      {
        prompt: "【说明与叙事阅读】说明文语言的一个重要特点是什么？",
        correct: "准确、严谨",
        wrongs: ["夸张、华丽", "含糊、随意", "押韵、抒情"],
        explanation: "说明文要把事物介绍清楚，语言讲究准确严谨。",
        commonPitfalls: ["混淆说明文和记叙文的语言特点"]
      }
    ],
    "c5-writing-structure": [
      {
        prompt: "【习作结构】写“我的植物朋友”，重点段最适合写什么？",
        correct: "植物的样子、变化和自己的观察",
        wrongs: ["比赛经过和比分", "人物语言和动作", "通知时间和地点"],
        explanation: "习作重点段要围绕题目展开具体内容。",
        commonPitfalls: ["重点段空泛"]
      },
      {
        prompt: "【习作结构】写一篇写人的文章，怎样才能把人物写得生动？",
        correct: "通过具体事例和人物的言行来表现",
        wrongs: ["只写“他很好”", "多写景物描写", "反复写他的名字"],
        explanation: "写人要用具体事例和语言、动作、神态来表现人物特点。",
        commonPitfalls: ["只贴标签不写事例"]
      },
      {
        prompt: "【习作结构】一篇文章要做到详略得当，应该怎样安排？",
        correct: "重点内容写详细，次要内容写简略",
        wrongs: ["所有内容都写详细", "所有内容都一笔带过", "越到后面写得越多"],
        explanation: "与中心关系密切的详写，关系不大的略写，才能突出重点。",
        commonPitfalls: ["详略不当，主次不分"]
      },
      {
        prompt: "【习作结构】写游记类作文，比较好的顺序是什么？",
        correct: "按游览的地点或先后顺序来写",
        wrongs: ["想到哪写到哪", "按字数多少排列", "先写结尾再写开头"],
        explanation: "游记常按游览的路线或时间顺序写，条理才清楚。",
        commonPitfalls: ["顺序混乱"]
      },
      {
        prompt: "【习作结构】文章的中心思想主要通过什么来表达？",
        correct: "具体的事例和细节描写",
        wrongs: ["华丽的词语堆砌", "很长的句子", "很多的标点"],
        explanation: "中心思想要靠具体的内容来体现，而不是靠喊口号。",
        commonPitfalls: ["空喊中心不写内容"]
      }
    ],
    "c5-classic": [
      {
        prompt: "【古诗文与文言启蒙】文言词“曰”通常是什么意思？",
        correct: "说",
        wrongs: ["跑", "看", "吃"],
        explanation: "文言启蒙中，“曰”常解释为“说”。",
        commonPitfalls: ["常见文言词不熟"]
      },
      {
        prompt: "【古诗文与文言启蒙】文言文中“弈秋，通国之善弈者也”中“善”是什么意思？",
        correct: "擅长",
        wrongs: ["善良", "好人", "喜欢"],
        explanation: "“善弈”指擅长下棋，“善”在这里是“擅长、善于”。",
        commonPitfalls: ["用今义“善良”理解"]
      },
      {
        prompt: "【古诗文与文言启蒙】“思援弓缴而射之”中“之”指代的是什么？",
        correct: "天上的天鹅（鸿鹄）",
        wrongs: ["弓箭", "另一个人", "老师"],
        explanation: "联系上文，“之”指想射的天鹅，“射之”就是射它。",
        commonPitfalls: ["代词指代不清"]
      },
      {
        prompt: "【古诗文与文言启蒙】文言词“走”在古文中一般是什么意思？",
        correct: "跑",
        wrongs: ["行走", "离开", "走路"],
        explanation: "文言里“走”多指“跑”，如“弃甲曳兵而走”。",
        commonPitfalls: ["古今词义混淆"]
      },
      {
        prompt: "【古诗文与文言启蒙】《两小儿辩日》中两个小孩争论的是什么问题？",
        correct: "太阳什么时候离人更近",
        wrongs: ["谁的年龄大", "谁跑得快", "谁更聪明"],
        explanation: "两小儿争论太阳早晨和中午哪个时候离人更近。",
        commonPitfalls: ["没读懂文言故事内容"]
      }
    ],
    "c5-book-reading": [
      {
        prompt: "【整本书阅读】评价一个人物形象，最应该依据什么？",
        correct: "人物的具体言行和情节",
        wrongs: ["故事发生的季节", "章节标题的长短", "插图出现的位置"],
        explanation: "整本书阅读要用情节和言行支撑人物评价。",
        commonPitfalls: ["评价没有依据"]
      },
      {
        prompt: "【整本书阅读】读一本长篇小说，做读书笔记时记录什么最有价值？",
        correct: "主要情节、人物特点和自己的感受",
        wrongs: ["每页有几个字", "书的价格", "出版的年份"],
        explanation: "读书笔记应记录情节、人物和体会，便于加深理解。",
        commonPitfalls: ["笔记记录无关内容"]
      },
      {
        prompt: "【整本书阅读】要了解一本书的大致内容，最快的办法是什么？",
        correct: "读目录和序言（前言）",
        wrongs: ["从最后一页读起", "只看插图", "数一数有多少章"],
        explanation: "目录和序言能帮我们快速了解全书结构和主要内容。",
        commonPitfalls: ["不会利用目录和序言"]
      },
      {
        prompt: "【整本书阅读】《西游记》中，能表现孙悟空本领高强的情节是哪一个？",
        correct: "大闹天宫",
        wrongs: ["刘备三顾茅庐", "武松打虎", "林黛玉葬花"],
        explanation: "“大闹天宫”出自《西游记》，突出孙悟空神通广大；其他情节出自别的名著。",
        commonPitfalls: ["把不同名著的情节弄混"]
      },
      {
        prompt: "【整本书阅读】和同学分享一本好书时，下面哪种做法最合适？",
        correct: "说清推荐理由和精彩之处",
        wrongs: ["把结局全部剧透", "只说“很好看”", "念一遍书名就行"],
        explanation: "分享好书要讲清推荐理由和精彩内容，又不宜完全剧透。",
        commonPitfalls: ["分享空洞或剧透"]
      }
    ],
    "c5-integrated": [
      {
        prompt: "【综合运用】读两则材料后表达观点，最重要的是哪一项？",
        correct: "观点明确，并能引用材料依据",
        wrongs: ["罗列人物名字", "描写天气变化", "复述个人经历"],
        explanation: "材料表达要有观点，也要有材料依据。",
        commonPitfalls: ["观点和材料脱节"]
      },
      {
        prompt: "【综合运用】开展“节约用水”调查后写建议书，下面哪一条最有用？",
        correct: "提出具体可行的节水办法",
        wrongs: ["描写水的颜色", "抄写一首古诗", "写自己的生日"],
        explanation: "建议书要针对问题提出具体、能做到的办法。",
        commonPitfalls: ["建议空泛不具体"]
      },
      {
        prompt: "【综合运用】做一次班级读书情况的小调查，第一步应该做什么？",
        correct: "确定调查的问题和对象",
        wrongs: ["先写调查报告", "先画一幅画", "先开庆祝会"],
        explanation: "调查要先明确调查什么、调查谁，再去收集信息。",
        commonPitfalls: ["调查没有明确目标"]
      },
      {
        prompt: "【综合运用】几位同学对“该不该带手机上学”看法不同，讨论时应该怎么做？",
        correct: "摆事实、讲道理，尊重不同意见",
        wrongs: ["谁声音大听谁的", "谁个子高听谁的", "谁先说听谁的"],
        explanation: "讨论问题要以理服人，用事实和道理说话，也要尊重别人。",
        commonPitfalls: ["讨论只争输赢不讲道理"]
      },
      {
        prompt: "【综合运用】搜集资料制作“家乡的变化”手抄报，下面哪种资料最合适？",
        correct: "家乡过去和现在的照片、数据对比",
        wrongs: ["自己喜欢的漫画", "明星的海报", "游戏攻略"],
        explanation: "手抄报要围绕“家乡的变化”这个主题选材，对比资料最能说明变化。",
        commonPitfalls: ["资料与主题无关"]
      }
    ],
    "c6-language-basic": [
      {
        prompt: "【语基综合】下面哪一项同时做到字词和标点都正确？",
        correct: "同学们认真复习，准备迎接考试。",
        wrongs: ["同学们认针复习，准备迎接考试。", "同学们认真复习？准备迎接考试？", "同学们认真复习准备，迎接。"],
        explanation: "A 项字词正确，逗号和句号使用也合适。",
        commonPitfalls: ["语基综合检查不全面"]
      },
      {
        prompt: "【语基综合】下面哪一组词语的字形和搭配都正确？",
        correct: "波澜壮阔的大海",
        wrongs: ["波澜壮阔的天空", "波蓝壮阔的大海", "波澜状阔的大海"],
        explanation: "“波澜壮阔”形容水势浩大，用来形容大海，字形也无误。",
        commonPitfalls: ["形近字写错", "成语用错对象"]
      },
      {
        prompt: "【语基综合】“他的这种精神值得我们学习和发扬。”这句话最恰当的评价是什么？",
        correct: "用词搭配恰当，句子通顺",
        wrongs: ["搭配不当", "成分残缺", "前后矛盾"],
        explanation: "“学习”“发扬”都能和“精神”搭配，句子完整通顺，没有语病。",
        commonPitfalls: ["把正确句判成病句"]
      },
      {
        prompt: "【语基综合】下面哪个句子中的成语使用正确？",
        correct: "他做事总是三思而后行，很稳重。",
        wrongs: ["这道题很简单，真是雪中送炭。", "他成绩很好，简直不耻下问。", "教室很安静，大家七嘴八舌。"],
        explanation: "“三思而后行”指做事前反复考虑，与“稳重”相符；其余成语都用错了语境。",
        commonPitfalls: ["成语望文生义、褒贬误用"]
      },
      {
        prompt: "【语基综合】“无论遇到多大困难，他都没有放弃。”这句话使用的关联词表示什么关系？",
        correct: "条件关系",
        wrongs: ["因果关系", "转折关系", "并列关系"],
        explanation: "“无论……都……”表示不管什么条件结果都不变，是条件关系。",
        commonPitfalls: ["关联词表示的关系判断错误"]
      }
    ],
    "c6-reading-strategy": [
      {
        prompt: "【阅读策略】快速了解文章主要内容时，最适合先做什么？",
        correct: "浏览标题、开头、结尾和关键句",
        wrongs: ["逐字精读每个词语", "先摘抄全部生字", "先分析所有修辞"],
        explanation: "浏览是一种快速把握内容的阅读策略。",
        commonPitfalls: ["阅读策略使用不当"]
      },
      {
        prompt: "【阅读策略】带着“文章讲了一件什么事”的问题去读，这属于哪种阅读方法？",
        correct: "带着问题读，有目的地阅读",
        wrongs: ["随便翻翻", "只看插图", "从后往前读"],
        explanation: "先明确问题再阅读，能提高阅读的针对性和效率。",
        commonPitfalls: ["漫无目的地读"]
      },
      {
        prompt: "【阅读策略】读到不理解的词语，比较好的做法是什么？",
        correct: "联系上下文或查工具书理解",
        wrongs: ["直接跳过不管", "随便猜一个意思", "把整段都删掉"],
        explanation: "联系上下文推测、借助字典词典，都是理解词语的好办法。",
        commonPitfalls: ["遇到生词不会处理"]
      },
      {
        prompt: "【阅读策略】要提高阅读速度，下面哪种做法比较合适？",
        correct: "扩大视野，一次看一个词组，不回读",
        wrongs: ["每个字都念出声", "读一句退回去读一遍", "用手指着一个字一个字读"],
        explanation: "默读、成组地看、不频繁回读，可以有效提高阅读速度。",
        commonPitfalls: ["逐字读、反复回读拖慢速度"]
      },
      {
        prompt: "【阅读策略】读完一篇文章后，为了加深理解，下面哪种做法最好？",
        correct: "想一想文章表达了什么，并联系生活思考",
        wrongs: ["马上合上书什么都不想", "只记住有几个自然段", "只关心文章多长"],
        explanation: "读后回顾主旨、联系实际思考，能把阅读真正内化。",
        commonPitfalls: ["读完不思考不回顾"]
      }
    ],
    "c6-view-summary": [
      {
        prompt: "【观点概括】一段话先说“节约用水很重要”，后面列举理由，作者观点是什么？",
        correct: "节约用水很重要",
        wrongs: ["水龙头是银色的", "今天下雨了", "杯子很大"],
        explanation: "观点通常是作者明确表达的判断，理由用来支撑观点。",
        commonPitfalls: ["把例子当观点"]
      },
      {
        prompt: "【观点概括】阅读议论性的文字，怎样才能准确把握作者的观点？",
        correct: "抓住表明态度的中心句",
        wrongs: ["数一数有几个例子", "看有几个标点", "只看第一个词"],
        explanation: "作者的观点往往集中在表明态度、看法的中心句里。",
        commonPitfalls: ["找不准中心句"]
      },
      {
        prompt: "【观点概括】一段话举了“许多名人惜时”的例子，这些例子的作用是什么？",
        correct: "用事例支撑“要珍惜时间”的观点",
        wrongs: ["凑字数", "介绍名人生平", "说明名人很多"],
        explanation: "举例子是为了证明观点，让作者的看法更有说服力。",
        commonPitfalls: ["看不出事例和观点的关系"]
      },
      {
        prompt: "【观点概括】要反驳“看电视只有坏处”这个说法，下面哪种理由最有力？",
        correct: "举出看电视能增长见识的具体例子",
        wrongs: ["说“我不同意”", "说“你说得不对”", "换个话题不谈"],
        explanation: "反驳观点要摆事实、讲道理，用具体例子最有说服力。",
        commonPitfalls: ["只表态不讲理由"]
      },
      {
        prompt: "【观点概括】概括一段议论文字的主要观点，最好用什么形式表达？",
        correct: "一句明确的判断句",
        wrongs: ["一个疑问句", "一串例子", "一段描写"],
        explanation: "观点是明确的看法，用一句判断句概括最清楚。",
        commonPitfalls: ["概括含糊不明确"]
      }
    ],
    "c6-writing-upgrade": [
      {
        prompt: "【习作升格】让“我很开心”更具体，哪一句更好？",
        correct: "我捧着奖状，忍不住笑了起来。",
        wrongs: ["我很开心很开心。", "开心开心开心。", "天气是蓝色的。"],
        explanation: "习作升格要用动作、神态等细节表现心情。",
        commonPitfalls: ["表达空泛重复"]
      },
      {
        prompt: "【习作升格】要把“教室很安静”写得更生动，哪一句更好？",
        correct: "教室里静得能听见笔尖在纸上沙沙作响。",
        wrongs: ["教室很安静很安静。", "教室安静。", "教室里有桌子。"],
        explanation: "用具体的声音细节来衬托安静，比直接说“安静”更有画面感。",
        commonPitfalls: ["描写笼统"]
      },
      {
        prompt: "【习作升格】把“他跑得快”改得更形象，哪一句最好？",
        correct: "他像离弦的箭一样冲了出去。",
        wrongs: ["他跑得很快很快。", "他跑跑跑。", "他会跑步。"],
        explanation: "用比喻“像离弦的箭”，把“快”写得生动可感。",
        commonPitfalls: ["不会用修辞使描写生动"]
      },
      {
        prompt: "【习作升格】文章结尾，下面哪种写法更能深化中心？",
        correct: "由这件事，我懂得了坚持就会有收获。",
        wrongs: ["这篇作文写完了。", "我不知道写什么了。", "今天到此结束。"],
        explanation: "结尾由事及理、点明感悟，能升华文章的中心。",
        commonPitfalls: ["结尾无力、草草收场"]
      },
      {
        prompt: "【习作升格】要让人物对话更真实自然，应该怎么写？",
        correct: "根据人物身份和情境写出符合他的话",
        wrongs: ["所有人说话都一个样", "对话越长越好", "不写提示语"],
        explanation: "不同身份、不同情境的人说话方式不同，对话要贴合人物。",
        commonPitfalls: ["对话千人一面"]
      }
    ],
    "c6-classic": [
      {
        prompt: "【古诗文言】理解古诗情感时，最应该结合什么？",
        correct: "关键词、画面和诗人表达的情感",
        wrongs: ["句子数量和行距", "人物外貌和动作", "通知格式和署名"],
        explanation: "古诗文理解要抓关键词和画面，再体会情感。",
        commonPitfalls: ["只翻译字面不体会情感"]
      },
      {
        prompt: "【古诗文言】“粉骨碎身浑不怕，要留清白在人间”借石灰表达了诗人怎样的志向？",
        correct: "不怕牺牲、保持高洁品格",
        wrongs: ["喜欢烧石灰", "怕弄脏衣服", "想变得有钱"],
        explanation: "《石灰吟》托物言志，借石灰表达坚贞不屈、清白做人的志向。",
        commonPitfalls: ["托物言志理解不到位"]
      },
      {
        prompt: "【古诗文言】“千磨万击还坚劲，任尔东西南北风”中的竹子象征什么样的人？",
        correct: "顽强不屈、不怕打击的人",
        wrongs: ["随风摇摆的人", "怕吃苦的人", "爱说话的人"],
        explanation: "《竹石》借竹子扎根岩石、经受风吹，象征坚强不屈的品格。",
        commonPitfalls: ["读不出象征意义"]
      },
      {
        prompt: "【古诗文言】“死去元知万事空，但悲不见九州同”表达了诗人怎样的感情？",
        correct: "盼望国家统一的爱国之情",
        wrongs: ["害怕死亡", "思念朋友", "喜爱游山玩水"],
        explanation: "《示儿》中陆游临终仍牵挂国家统一，表达了深沉的爱国情。",
        commonPitfalls: ["体会不到爱国主题"]
      },
      {
        prompt: "【古诗文言】文言文《伯牙鼓琴》主要赞美了什么？",
        correct: "知音难得、深厚的友谊",
        wrongs: ["琴弹得响", "山水很美", "读书很多"],
        explanation: "伯牙、锺子期的故事赞美了心灵相通的知音之情。",
        commonPitfalls: ["没读懂文言故事的主旨"]
      }
    ],
    "c6-transition": [
      {
        prompt: "【小升初综合】做语文综合题时，最合理的顺序是哪一项？",
        correct: "先审题，再定位材料，最后规范作答",
        wrongs: ["先写作文标题，再看材料", "先整理书包，再读题目", "先背古诗，再看要求"],
        explanation: "综合题要先明确要求，再到材料中找依据。",
        commonPitfalls: ["审题和定位脱节"]
      },
      {
        prompt: "【小升初综合】考试时遇到不会做的难题，比较好的做法是什么？",
        correct: "先做会做的题，回头再攻难题",
        wrongs: ["卡在难题上不动", "空着不看直接交卷", "随便乱写一个"],
        explanation: "先易后难能保证会做的分不丢，也为难题留下时间。",
        commonPitfalls: ["时间分配不合理"]
      },
      {
        prompt: "【小升初综合】写作文前，先花几分钟做什么最有帮助？",
        correct: "审清题意，列一个简单的提纲",
        wrongs: ["先算能写多少字", "先想开头几个字", "先削好铅笔"],
        explanation: "审题、列提纲能让作文结构清楚、不跑题。",
        commonPitfalls: ["不列提纲想到哪写到哪"]
      },
      {
        prompt: "【小升初综合】答阅读题时，答案一般应该从哪里来？",
        correct: "紧扣原文，结合问题作答",
        wrongs: ["全凭想象编写", "照抄题目", "写和文章无关的话"],
        explanation: "阅读题的答案要有原文依据，不能脱离文本凭空写。",
        commonPitfalls: ["答案脱离原文"]
      },
      {
        prompt: "【小升初综合】做完试卷后，剩下的时间最应该做什么？",
        correct: "检查有没有漏题和明显错误",
        wrongs: ["马上睡觉", "和同学说话", "玩橡皮"],
        explanation: "检查能发现漏答、错别字等问题，减少不必要的失分。",
        commonPitfalls: ["不检查就交卷"]
      }
    ],
    "c6-famous-book": [
      {
        prompt: "【名著阅读】分析名著人物形象时，哪一项最有依据？",
        correct: "结合人物经历、语言和行为分析",
        wrongs: ["根据故事发生季节分析", "根据章节数量分析", "根据插图位置分析"],
        explanation: "名著人物分析要基于情节、语言和行为。",
        commonPitfalls: ["人物分析没有文本依据"]
      },
      {
        prompt: "【名著阅读】《西游记》中孙悟空最突出的性格特点是什么？",
        correct: "机智勇敢、爱憎分明",
        wrongs: ["胆小怕事", "懒惰贪睡", "不辨是非"],
        explanation: "从大闹天宫、三打白骨精等情节可见孙悟空机智勇敢、爱憎分明。",
        commonPitfalls: ["脱离情节评价人物"]
      },
      {
        prompt: "【名著阅读】《鲁滨逊漂流记》主要讲述了一个怎样的故事？",
        correct: "鲁滨逊流落荒岛、顽强求生的经历",
        wrongs: ["一个国王打仗的故事", "几个孩子上学的故事", "一只猫的故事"],
        explanation: "小说讲鲁滨逊在荒岛上克服困难、独立生存二十多年的传奇经历。",
        commonPitfalls: ["不了解名著主要内容"]
      },
      {
        prompt: "【名著阅读】读名著时，做批注的好处是什么？",
        correct: "记录理解和感受，加深对作品的思考",
        wrongs: ["把书写满就行", "字数越多越好", "抄写原文最省事"],
        explanation: "批注是随读随记想法和疑问，能促进思考、加深理解。",
        commonPitfalls: ["为批注而批注，没有思考"]
      },
      {
        prompt: "【名著阅读】向别人推荐一部名著时，下面哪种理由最能打动人？",
        correct: "讲清书中精彩情节和自己的真实感受",
        wrongs: ["说它字很多", "说它很厚", "说老师让读的"],
        explanation: "推荐要结合精彩内容和真切感受，才有说服力和感染力。",
        commonPitfalls: ["推荐理由空洞"]
      }
    ],
    "c6-expression": [
      {
        prompt: "【综合表达】演讲稿表达建议时，哪种写法更规范？",
        correct: "先提出观点，再说明理由和具体建议",
        wrongs: ["先写景物，再写人物外貌", "全篇复述活动经过", "主要介绍文具用途"],
        explanation: "综合表达要观点清楚、理由充分、建议具体。",
        commonPitfalls: ["观点不明确", "理由不充分"]
      },
      {
        prompt: "【综合表达】做一次口头发言，怎样才能让听众听得明白？",
        correct: "条理清楚，先说什么后说什么想好",
        wrongs: ["想到哪说到哪", "声音越小越好", "说得越快越好"],
        explanation: "发言要有条理，按顺序表达，听众才容易听懂。",
        commonPitfalls: ["发言杂乱无章"]
      },
      {
        prompt: "【综合表达】参加辩论时，反驳对方观点最有力的方式是什么？",
        correct: "指出对方理由的漏洞，并摆出事实",
        wrongs: ["提高嗓门压过对方", "重复自己的话", "嘲笑对方"],
        explanation: "辩论以理服人，抓住对方漏洞、用事实反驳最有力量。",
        commonPitfalls: ["只争气势不讲道理"]
      },
      {
        prompt: "【综合表达】写一份倡议书，下面哪一项内容必不可少？",
        correct: "倡议的事由和具体号召大家怎么做",
        wrongs: ["自己的考试成绩", "喜欢的电视剧", "家里的地址"],
        explanation: "倡议书要写清为什么倡议、号召大家做什么，才能起到号召作用。",
        commonPitfalls: ["倡议书要素不全"]
      },
      {
        prompt: "【综合表达】主持一次班会，开场白最恰当的是哪一句？",
        correct: "同学们好，今天我们班会的主题是“诚信”。",
        wrongs: ["随便说两句吧。", "我也不知道说啥。", "你们自己看着办。"],
        explanation: "开场白要礼貌问好并点明班会主题，让大家明确内容。",
        commonPitfalls: ["开场白不明主题"]
      }
    ]
  };

  const TEXTBOOK_EXAM_SPECS = {
    "c1-textbook-pinyin-initial-final": [
      ["材料：音节“mā”由声母 m、韵母 a 和第一声组成。\n题目：“mā”的声母是哪一个？", "m", ["a", "ā", "mā"]],
      ["材料：音节“hé”由声母 h、韵母 e 组成。\n题目：“hé”的韵母是哪一个？", "e", ["h", "é", "hé"]],
      ["材料：整体认读音节可以直接读出，不用拼读。\n题目：下面哪一个是整体认读音节？", "yi", ["ma", "he", "bo"]]
    ],
    "c1-textbook-pinyin-tone": [
      ["材料：mā、má、mǎ、mà 的声调不同。\n题目：“mǎ”是第几声？", "第三声", ["第一声", "第二声", "第四声"]],
      ["材料：一声平、二声扬、三声拐弯、四声降。\n题目：“má”是第几声？", "第二声", ["第一声", "第三声", "第四声"]],
      ["材料：声调标在韵母上。\n题目：“bà”是第几声？", "第四声", ["第一声", "第二声", "第三声"]]
    ],
    "c1-textbook-syllable-spelling": [
      ["材料：“花”的读音是 huā。\n题目：“花”的正确拼音是哪一个？", "huā", ["hā", "fā", "hǎ"]],
      ["材料：“书”的读音是 shū。\n题目：“书”的正确拼音是哪一个？", "shū", ["sū", "shǔ", "chū"]],
      ["材料：“水”的读音是 shuǐ。\n题目：“水”的正确拼音是哪一个？", "shuǐ", ["shuī", "suǐ", "chuǐ"]]
    ],
    "c1-textbook-common-characters": [
      ["材料：日、月、山、水都是常见汉字。\n题目：“山”表示哪一类事物？", "自然中的山", ["学习用品", "人物动作", "天气现象"]],
      ["材料：口、耳、目、手都是表示身体部位的字。\n题目：“目”指身体的哪个部位？", "眼睛", ["耳朵", "嘴巴", "手"]],
      ["材料：上、下、左、右表示方位。\n题目：“上”的反义字是哪一个？", "下", ["左", "右", "中"]]
    ],
    "c1-textbook-stroke-order": [
      ["材料：写“十”时，先写横，再写竖。\n题目：“十”的第一笔是什么？", "横", ["竖", "撇", "捺"]],
      ["材料：写“火”要按笔顺来。\n题目：“火”的最后一笔是什么？", "捺", ["点", "横", "竖"]],
      ["材料：汉字笔顺一般先横后竖、先撇后捺。\n题目：写“人”字先写哪一笔？", "撇", ["捺", "横", "竖"]]
    ],
    "c1-textbook-radical-structure": [
      ["材料：“明”左边是“日”，右边是“月”。\n题目：“明”是什么结构？", "左右结构", ["上下结构", "独体字", "半包围结构"]],
      ["材料：“花”上面是草字头，下面是“化”。\n题目：“花”是什么结构？", "上下结构", ["左右结构", "独体字", "半包围结构"]],
      ["材料：“日”“月”“水”这些字没有偏旁。\n题目：“日”是什么结构？", "独体字", ["左右结构", "上下结构", "半包围结构"]]
    ],
    "c1-textbook-quantifier-basic": [
      ["材料：花通常说“一朵花”，书通常说“一本书”。\n题目：“一（ ）花”中应填哪个量词？", "朵", ["本", "条", "只"]],
      ["材料：鱼用“条”，鸟用“只”。\n题目：“一（ ）鱼”中应填哪个量词？", "条", ["朵", "本", "座"]],
      ["材料：书用“本”，山用“座”。\n题目：“一（ ）书”中应填哪个量词？", "本", ["朵", "条", "只"]]
    ],
    "c1-textbook-complete-sentence": [
      ["材料：完整句要说清谁、在哪里、做什么。\n题目：下面哪一句表达完整？", "小鸟在树上唱歌。", ["小鸟在。", "树上唱。", "唱歌小鸟树。"]],
      ["材料：把话说完整，要有人物和动作。\n题目：下面哪一句最完整？", "妹妹在教室里画画。", ["妹妹在。", "画画教室。", "在教室画。"]],
      ["材料：完整句语序要通顺。\n题目：下面哪一句语序正确？", "太阳升起来了。", ["升起来太阳了。", "了太阳升。", "起来太阳升了。"]]
    ],
    "c1-textbook-picture-speaking": ["材料：图中小朋友在操场跳绳。\n题目：看图说话时，下面哪一句最清楚？", "小朋友在操场跳绳。", ["小朋友。", "在操场。", "跳绳操场小朋友。"]],
    "c1-textbook-short-reading-info": ["材料：小兔把萝卜送给奶奶。\n题目：小兔做了什么？", "把萝卜送给奶奶", ["去河边钓鱼", "把书放进书包", "在树下睡觉"]],

    "c2-textbook-sound-shape": [
      ["材料：“晴”和太阳有关，“清”和水有关。\n题目：“晴天”的“晴”是什么偏旁？", "日字旁", ["三点水", "言字旁", "木字旁"]],
      ["材料：“清”和水有关，是三点水。\n题目：“清水”的“清”是什么偏旁？", "三点水", ["日字旁", "言字旁", "提手旁"]],
      ["材料：“请”表示说话有礼貌，和语言有关。\n题目：“请问”的“请”是什么偏旁？", "言字旁", ["日字旁", "三点水", "竖心旁"]]
    ],
    "c2-textbook-polyphone": [
      ["材料：“长大”和“长短”里的“长”读音不同。\n题目：“长大”中的“长”应读哪一个？", "zhǎng", ["cháng", "zhàng", "chǎn"]],
      ["材料：“乐”在“快乐”和“音乐”里读音不同。\n题目：“快乐”中的“乐”应读哪一个？", "lè", ["yuè", "yào", "luè"]],
      ["材料：“行”在“行走”和“银行”里读音不同。\n题目：“银行”中的“行”应读哪一个？", "háng", ["xíng", "hàng", "xìng"]]
    ],
    "c2-textbook-word-collocation": [
      ["材料：词语搭配要自然、合适。\n题目：下面哪个搭配最恰当？", "灿烂的阳光", ["灿烂的铅笔", "奔跑的桌子", "香甜的石头"]],
      ["材料：动词和名词要搭配得当。\n题目：下面哪个搭配正确？", "弹钢琴", ["弹足球", "弹跑步", "弹画画"]],
      ["材料：形容词修饰合适的事物。\n题目：下面哪个搭配最恰当？", "鲜艳的红旗", ["鲜艳的声音", "响亮的花朵", "明亮的歌声"]]
    ],
    "c2-textbook-synonym-antonym": [
      ["材料：“高兴”和“快乐”意思接近。\n题目：“高兴”的近义词是哪一个？", "快乐", ["难过", "矮小", "安静"]],
      ["材料：“认真”和“仔细”意思接近。\n题目：“认真”的近义词是哪一个？", "仔细", ["马虎", "热闹", "明亮"]],
      ["材料：“大”和“小”意思相反。\n题目：“大”的反义词是哪一个？", "小", ["多", "高", "长"]]
    ],
    "c2-textbook-sentence-expansion": [
      ["材料：扩句要让句子更具体，也要保持通顺。\n题目：把“花开了”扩句，哪一句最合适？", "公园里的桃花慢慢开了。", ["花开。", "开了花公园慢慢。", "桃花公园的了。"]],
      ["材料：扩句可以加上数量、样子等。\n题目：把“鸟儿飞”扩句，哪一句最合适？", "一群小鸟在天空中自由地飞。", ["鸟飞。", "飞鸟天空一群。", "在飞鸟儿的。"]],
      ["材料：扩句后语序要通顺。\n题目：把“雪花飘”扩句，哪一句最合适？", "洁白的雪花轻轻地飘下来。", ["雪飘。", "飘雪花白的。", "下来飘雪花轻。"]]
    ],
    "c2-textbook-punctuation-tone": [
      ["材料：“你今天去图书馆吗”是在提问。\n题目：这句话句末应使用什么标点？", "？", ["。", "！", "，"]],
      ["材料：“这里的风景真美啊”表达强烈赞叹。\n题目：这句话句末应使用什么标点？", "！", ["。", "？", "，"]],
      ["材料：“我买了苹果、香蕉和梨”中并列词语之间用顿号。\n题目：并列的词语之间应使用什么标点？", "、", ["，", "。", "！"]]
    ],
    "c2-textbook-sequence-reading": ["材料：小雨先写作业，再收拾书包。\n题目：小雨先做什么？", "写作业", ["收拾书包", "去操场跑步", "看电视"]],
    "c2-textbook-cause-effect": ["材料：因为下雨，大家把活动改到教室里。\n题目：活动改到教室里的原因是什么？", "下雨", ["天气晴朗", "教室很新", "大家想画画"]],
    "c2-textbook-message-note": ["材料：小明给妈妈留言：我去图书馆了，下午四点回来。\n题目：这张留言条写清了什么？", "去了哪里和什么时候回来", ["活动感受和心情", "读书方法和书名", "人物外貌和动作"]],
    "c2-textbook-picture-writing-order": ["材料：图中小朋友先给小树浇水，再扶正小树，最后整理工具。\n题目：小朋友先做什么？", "给小树浇水", ["扶正小树", "整理工具", "回教室"]],

    "c3-textbook-context-word": [
      ["材料：他听得很认真，还把重点记在本子上。\n题目：句中“认真”的意思最接近哪一个？", "专心、不马虎", ["高兴地笑", "跑得很快", "声音很大"]],
      ["材料：天渐渐黑了，路灯一盏盏亮起来。\n题目：句中“渐渐”的意思最接近哪一个？", "慢慢地", ["立刻", "忽然", "永远"]],
      ["材料：小溪的水很清澈，能看见水底的石头。\n题目：句中“清澈”是形容什么的？", "水很清、很透明", ["水很多", "水很快", "水很冷"]]
    ],
    "c3-textbook-sentence-transform": [
      ["材料：小明把书放进书包。\n题目：改成“被”字句，哪一句正确？", "书被小明放进书包。", ["小明被书放进书包。", "书包被小明放进书。", "小明书包被放进书。"]],
      ["材料：风把树叶吹落了。\n题目：改成“被”字句，哪一句正确？", "树叶被风吹落了。", ["风被树叶吹落了。", "树叶把风吹落了。", "吹落了风树叶。"]],
      ["材料：难道我们能不爱护环境吗？\n题目：改成陈述句，哪一句意思相同？", "我们应该爱护环境。", ["我们不用爱护环境。", "我们能爱护环境吗。", "爱护环境难道吗。"]]
    ],
    "c3-textbook-rhetoric-basic": [
      ["材料：弯弯的月亮像小船。\n题目：这句话使用了什么修辞方法？", "比喻", ["拟人", "排比", "反问"]],
      ["材料：小鸟在枝头唱着欢快的歌。\n题目：这句话使用了什么修辞方法？", "拟人", ["比喻", "排比", "夸张"]],
      ["材料：操场上有的跳绳，有的踢球，有的跑步。\n题目：这句话使用了什么修辞方法？", "排比", ["比喻", "拟人", "反问"]]
    ],
    "c3-textbook-paragraph-main": ["材料：公园真美。花儿开了，树木绿了，小湖亮晶晶的。\n题目：这段话主要写什么？", "公园真美", ["小湖很深", "树木会说话", "花儿需要浇水"]],
    "c3-textbook-reading-detail": ["材料：小鹿看见小伙伴口渴，就把自己的水让给了他。\n题目：小鹿做了什么？", "把水让给口渴的小伙伴", ["自己喝完了水", "跑去摘果子", "把书放进书包"]],
    "c3-textbook-poem-image": ["材料：“遥知不是雪，为有暗香来。”诗句写到洁白和香气。\n题目：诗句描写的是什么？", "梅花", ["荷花", "柳树", "小草"]],
    "c3-textbook-idiom-meaning": [
      ["材料：羊丢了以后，主人及时修补羊圈。\n题目：这个故事说明的道理是哪一项？", "出了问题及时补救还不晚", ["羊越多越好", "门不用修", "跑得快最重要"]],
      ["材料：农夫等着兔子再撞树桩，结果什么也没等到。\n题目：“守株待兔”比喻哪种人？", "只想不劳而获、靠运气的人", ["很勤劳的人", "跑得很快的人", "很聪明的人"]],
      ["材料：有人怕苗长得慢，把苗一棵棵往上拔，结果苗都枯死了。\n题目：“拔苗助长”告诉我们什么道理？", "做事不能急于求成", ["种地要多施肥", "苗长得越快越好", "做事要用力气"]]
    ],
    "c3-textbook-observation-record": ["材料：豆芽第一天露白，第三天长出细根。\n题目：豆芽第三天有什么变化？", "长出细根", ["开出红花", "变成石头", "飞到树上"]],
    "c3-textbook-around-one-idea": ["材料：操场真热闹。同学们有的跳绳，有的跑步，还有的踢球。\n题目：这几句话围绕哪一个意思写？", "操场真热闹", ["天气真冷", "教室很安静", "书包很重"]],
    "c3-textbook-practical-expression": ["材料：介绍一次植物观察活动，要说清时间、发现和感受。\n题目：下面哪一项最适合写进介绍里？", "我周三发现豆芽长出了细根，很惊喜。", ["我喜欢蓝色。", "今天的铅笔很短。", "门外有一辆车。"]],

    "c4-textbook-context-sentence": [
      ["材料：他等了很久，车终于来了。\n题目：“终于”在句中说明什么？", "等了很久后出现结果", ["事情刚刚开始", "声音特别大", "动作正在进行"]],
      ["材料：他不但学习好，而且乐于助人。\n题目：“不但……而且……”表示什么关系？", "递进关系", ["转折关系", "选择关系", "因果关系"]],
      ["材料：虽然天气很冷，但是他坚持锻炼。\n题目：“虽然……但是……”表示什么关系？", "转折关系", ["递进关系", "并列关系", "条件关系"]]
    ],
    "c4-textbook-sick-sentence": [
      ["材料：通过努力，使我进步了。\n题目：下面哪种修改最恰当？", "删去“使”", ["加上问号", "把“努力”改成拼音", "把句子倒着写"]],
      ["材料：他大约一定会来。\n题目：这句话的毛病是什么？", "“大约”和“一定”意思矛盾", ["缺少标点", "用词太少", "没有主语"]],
      ["材料：他从小就养成了讲卫生。\n题目：这句话缺少了什么？", "缺少宾语（好习惯）", ["缺少主语", "缺少标点", "缺少时间"]]
    ],
    "c4-textbook-punctuation-effect": [
      ["材料：妈妈说：“明天我们去图书馆。”\n题目：人物说话后面接原话，通常要使用哪组标点？", "冒号和引号", ["顿号和省略号", "书名号和破折号", "逗号和句号"]],
      ["材料：《西游记》是一部有名的小说。\n题目：句中书名应该用什么标点？", "书名号", ["引号", "括号", "顿号"]],
      ["材料：我买了苹果、香蕉和梨。\n题目：句中并列词语之间用的是什么标点？", "顿号", ["逗号", "句号", "分号"]]
    ],
    "c4-textbook-rhetoric-effect": [
      ["材料：花儿在风中点头，好像在和我们打招呼。\n题目：这句话主要使用了什么修辞方法？", "拟人", ["夸张", "设问", "对偶"]],
      ["材料：他饿得能吃下一头牛。\n题目：这句话使用了什么修辞方法？", "夸张", ["比喻", "拟人", "排比"]],
      ["材料：是谁把教室打扫得这么干净？原来是值日生。\n题目：这句话使用了什么修辞方法？", "设问", ["反问", "比喻", "夸张"]]
    ],
    "c4-textbook-info-extraction": ["材料：通知：周五下午三点，全班同学在操场集合。\n题目：集合地点在哪里？", "操场", ["教室", "图书馆", "食堂"]],
    "c4-textbook-character-quality": [
      ["材料：妈妈冒雨送伞，一路担心孩子淋湿。\n题目：材料体现了妈妈怎样的特点？", "关心孩子", ["粗心大意", "喜欢旅行", "不守时间"]],
      ["材料：老爷爷把捡到的钱包交给了警察。\n题目：材料体现了老爷爷怎样的品质？", "拾金不昧", ["爱管闲事", "很有钱", "记性好"]],
      ["材料：同学摔倒了，小明马上把他扶起来送到医务室。\n题目：材料体现了小明怎样的品质？", "乐于助人", ["胆子很大", "跑得很快", "力气很大"]]
    ],
    "c4-textbook-structure-order": ["材料：先总写校园美，再分写花坛、操场、教室。\n题目：这段话采用了什么结构？", "总分结构", ["倒叙结构", "问答结构", "并列词语"]],
    "c4-textbook-writing-topic": ["材料：习作题目是“记一次难忘的活动”。\n题目：下面哪种材料最合适？", "写一次参加接力赛的经过", ["介绍一种文具的特点", "默写一首古诗", "记录今天的午饭"]],
    "c4-textbook-notice-application": ["材料：班级要通知同学参加周五的读书分享会。\n题目：通知中必须写清哪一项？", "时间、地点和事情", ["人物外貌和动作", "身高、体重和年龄", "声母、韵母和声调"]],
    "c4-textbook-poem-philosophy": ["材料：“不识庐山真面目，只缘身在此山中。”\n题目：这两句诗启发我们什么？", "看问题有时要换个角度", ["山里没有路", "只要低头走路", "所有山都一样"]],

    "c5-textbook-context-emotion": [
      ["材料：他郑重地接过奖状，向老师鞠了一躬。\n题目：“郑重”在句中表示什么？", "态度严肃认真", ["心情轻松随意", "动作慌张急促", "语气十分幽默"]],
      ["材料：听到这个好消息，全班都沸腾了。\n题目：“沸腾”在句中表示什么？", "情绪高涨、非常热烈", ["水烧开了", "很生气", "很安静"]],
      ["材料：老师意味深长地看了我一眼，我一下子明白了。\n题目：“意味深长”在句中形容什么？", "含义深，让人回味", ["时间很长", "路程很远", "声音很大"]]
    ],
    "c5-textbook-paragraph-structure": ["材料：开头总说秋天很美，后面写田野、果园、小河。\n题目：这段材料的结构是什么？", "总分结构", ["倒叙结构", "问答格式", "地点转换"]],
    "c5-textbook-explanation-method": ["材料：这座桥长约五十米，比普通小桥宽得多。\n题目：这句话主要用了哪些说明方法？", "列数字和作比较", ["动作描写和语言描写", "比喻和拟人", "引用古诗和排比"]],
    "c5-textbook-character-detail": ["材料：他攥紧拳头，盯着终点线，一步也不肯停。\n题目：这些细节表现了人物什么特点？", "坚持不放弃", ["害怕交流", "喜欢安静", "不懂礼貌"]],
    "c5-textbook-book-reading": ["材料：评价一个人物是否勇敢，需要举出他面对困难时的具体经历。\n题目：下面哪种评价最有依据？", "他遇到危险仍想办法帮助同伴，所以很勇敢。", ["他总是穿整齐的衣服，所以勇敢。", "故事发生在早晨，所以勇敢。", "他去过很多地方，所以勇敢。"]],
    "c5-textbook-classical-word": [
      ["材料：“其人弗能应也”中的“弗”常表示“不”。\n题目：“弗能应也”的“弗”是什么意思？", "不", ["跑", "看", "吃"]],
      ["材料：“弈秋，通国之善弈者也”中的“善”表示擅长。\n题目：“善弈”的“善”是什么意思？", "擅长", ["善良", "好人", "喜欢"]],
      ["材料：文言里“走”常指“跑”，如“儿童急走追黄蝶”。\n题目：文言词“走”一般是什么意思？", "跑", ["行走", "离开", "走路"]]
    ],
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

  function buildSourcePlan(count, sourcePolicy) {
    const total = Math.max(0, Math.floor(Number(count) || 0));
    if (!total) return [];
    const sources = Array.isArray(sourcePolicy?.sources) && sourcePolicy.sources.length ? sourcePolicy.sources : ["inTextbook"];
    return Array.from({ length: total }, () => sources[0] || "inTextbook");
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

  function buildTextbookChoiceSpec(point, sourceLabel, entry) {
    const [prompt, correct, wrongs, aliases] = entry;
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

  function textbookExamSpec(point, sourceLabel) {
    const spec = TEXTBOOK_EXAM_SPECS[point.id];
    if (!spec) return null;
    // 兼容两种写法：单条 [prompt, correct, wrongs, aliases]
    // 或多条 [[...], [...], ...]。多条时返回 spec 数组。
    const isMulti = Array.isArray(spec[0]);
    if (isMulti) {
      const list = spec
        .filter((entry) => Array.isArray(entry) && entry.length >= 3)
        .map((entry) => buildTextbookChoiceSpec(point, sourceLabel, entry));
      return list.length ? list : null;
    }
    return buildTextbookChoiceSpec(point, sourceLabel, spec);
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

  // 判断一个选择题答案是否适合直接改造成"填空题答案"：
  // 纯中文、长度适中（1-6 字）、不是整句（不含标点），这样填空才有唯一解。
  function isFillableAnswer(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    if (value.length < 1 || value.length > 6) return false;
    // 含句末标点或明显是整句/短语解释的，不适合做填空答案
    if (/[，。！？、；：“”（）\s]/.test(value)) return false;
    // 必须是纯中文（含少量常见汉字），排除拼音、字母、数字
    return /^[一-龥]+$/.test(value);
  }

  // 基于选择题 spec 派生一道内容一致的填空题：把该题的正确答案作为填空答案，
  // 用它的解析作为提示。这样每道选择题都能生出贴合自身的填空，而不是所有题
  // 都套同一句通用填空。提示中必须隐去答案本身，否则不派生（回退到通用填空）。
  function deriveInputFromChoice(point, baseSpec) {
    if (!baseSpec || !isFillableAnswer(baseSpec.correct)) return null;
    const answer = String(baseSpec.correct).trim();
    const header = inputHeader(point);
    // 若答案本身就出现在标题（知识点名称）里，派生会暴露答案，放弃
    if (header.includes(answer)) return null;
    // 排除教材题的通用解析模板（“这题对应……”），它没有实质提示价值
    const rawHint = String(baseSpec.explanation || "").trim();
    if (!rawHint || /^这题对应/.test(rawHint)) return null;
    // 用解析做提示，但要把答案字样抹掉，避免答案出现在题干里
    const hint = rawHint.split(answer).join("（ ）");
    // 抹掉后若提示为空、过短，或仍残留答案，则放弃派生
    if (hint.length < 4 || hint.includes(answer)) return null;
    return {
      questionType: "根据提示填空",
      prompt: `${header}\n提示：${hint}\n题目：根据上面的提示，写出正确答案。请直接输入答案本身。`,
      correct: answer,
      acceptedAnswers: [answer],
      explanation: rawHint,
      commonPitfalls: baseSpec.commonPitfalls || ["没有结合提示作答"]
    };
  }

  function directInputSpec(point, baseSpec) {
    if (DIRECT_INPUT_SPECS[point.id]) return DIRECT_INPUT_SPECS[point.id];
    // 优先根据当前选择题内容派生填空，保证题文与考点一致
    const derived = deriveInputFromChoice(point, baseSpec);
    if (derived) return derived;
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
    const list = (Array.isArray(specs) ? specs : [specs]).filter(Boolean);
    if (!list.length) return [];
    const result = [];
    const seenInputPrompts = new Set();
    list.forEach((spec) => {
      // 每条种子都作为一道选择题
      result.push({ ...spec, format: "choice" });
      // 优先使用种子自带的填空变体，否则回退到按知识点推导的默认填空
      const inputSpec = spec.directInput
        ? { ...spec.directInput }
        : directInputSpec(point, spec);
      if (inputSpec && !seenInputPrompts.has(inputSpec.prompt)) {
        seenInputPrompts.add(inputSpec.prompt);
        result.push({ ...inputSpec, format: "input" });
      }
    });
    return result;
  }

  function questionTemplateCountForPoint(point) {
    return specsForPoint(point || {}).length;
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
    const data = spec.format === "input" ? objectiveInput(point, spec) : objectiveChoice(deps || {}, point, spec);
    return baseQuestion(deps || {}, point, data);
  }

  window.MathCampChineseQuestionGenerator = { makeQuestion, buildSourcePlan, questionTemplateCountForPoint };
})();
