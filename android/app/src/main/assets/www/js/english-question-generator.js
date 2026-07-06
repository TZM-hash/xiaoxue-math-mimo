/**
 * ============================================================================
 * 英语题库生成器（english-question-generator.js）
 * ----------------------------------------------------------------------------
 * 【题目从哪里来】
 *   每个知识点（point）对应一组“种子”（spec）。运行时 makeQuestion() 把种子
 *   加工成一道题，外层抽题引擎（app.js）负责去重，保证连续抽题不重复。
 *   种子越多 → 同一知识点能产出的不重复题越多，题库越不机械。
 *
 * 【两层种子来源，专属优先】
 *   1) 知识点专属题池 → POINT_SPECS，key 是具体单元 id（如 "e3-unit-1-1"）。
 *      这是让“同一 topic 的不同单元不再抽出同一道题”的关键：每个单元有自己
 *      贴合课文单词/句型的题。结构：
 *          POINT_SPECS["e3-unit-1-1"] = { choices: [...], inputs: [...] }
 *      - choices：选择题数组，每条字段：
 *          questionType   题型标签（如“情景选择”“听音选词”）
 *          prompt         题干
 *          correct        正确答案（放 A 选项，运行时打乱）
 *          wrongs         干扰项数组
 *          explanation    解析
 *          audioPrompt    可选，听力题用 { type:"tts", lang:"en-US", text:"..." }
 *          commonPitfalls 常见易错点（可选）
 *      - inputs：填空题数组（单词拼写等），字段同上（correct 为英文答案）。
 *
 *   2) 通用题池 → TOPIC_SPECS，key 是大类 topic（vocabulary/pattern/grammar/
 *      phonics/reading）。没有专属题池的单元回退到这里。
 *
 * 【合并规则】specsForPoint()：
 *   最终题 = 该单元 POINT_SPECS 的题（排在前，优先出）+ TOPIC_SPECS 通用题（补充）。
 *   所以填了专属池的单元既有自己的题，也能被通用题补足数量。
 *
 * 【怎么加题 / 改题】
 *   - 给某单元加题：在 POINT_SPECS 里按 unit id 加 { choices, inputs } 即可。
 *     单元 id 规则：e{年级}-unit-{学期}-{单元}，如 e5-unit-2-3。
 *     各单元的单词/句型见 english-curriculum-data.js（是命题依据）。
 *   - 题目要贴合该单元实际教学内容（PEP 人教版），别放到错误的单元。
 *   - 填空题的首字母提示（如 "h____"）必须和 correct 的首字母一致。
 *   - 改完务必：① node 语法自检 ② npm test（含 english-question-bank.test.js）
 *     ③ 同步到 android/app/src/main/assets/www/js/（测试会校验镜像哈希一致）。
 * ============================================================================
 */
(function () {
  "use strict";

  function choose(deps, items) {
    return deps && typeof deps.pick === "function" ? deps.pick(items) : items[Math.floor(Math.random() * items.length)];
  }

  function uid(deps) {
    return deps && typeof deps.uid === "function" ? deps.uid("eq") : `eq-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function baseQuestion(deps, point, data) {
    return {
      id: uid(deps),
      subject: "english",
      grade: point.grade,
      pointId: point.id,
      topic: point.topic,
      kind: point.label,
      templateType: data.templateType || data.questionType || point.label,
      curriculumBand: point.curriculum && point.curriculum.band,
      sourceType: point.sourceType || "inTextbook",
      sourceLabel: point.sourceLabel || "课内教材",
      subskills: [point.short, point.label].filter(Boolean).slice(0, 3),
      commonPitfalls: data.commonPitfalls || [],
      ...data
    };
  }

  function choiceQuestion(deps, point, spec) {
    const layout = window.MathCampQuestionSpec.choiceLayout(deps, { correct: spec.correct, wrongs: spec.wrongs });
    return {
      text: `${spec.prompt}\n${layout.optionText}`,
      answerType: "choice",
      answer: layout.answer,
      acceptedAnswers: layout.acceptedAnswers(),
      answerLabel: layout.answerLabel,
      questionType: spec.questionType,
      audioPrompt: spec.audioPrompt,
      explanation: spec.explanation,
      steps: spec.steps || [
        "先读题干，确认要考词汇、语音、句型、语法还是阅读。",
        "再逐项把选项放回句子或短文中比较。",
        "最后选择最符合英语表达习惯和题目要求的一项。"
      ],
      commonPitfalls: spec.commonPitfalls || []
    };
  }

  function inputQuestion(point, spec) {
    const answer = String(spec.correct || "").trim();
    return {
      text: spec.prompt,
      answerType: "text",
      answer,
      acceptedAnswers: spec.acceptedAnswers || [answer],
      answerLabel: answer,
      questionType: spec.questionType,
      audioPrompt: spec.audioPrompt,
      explanation: spec.explanation,
      steps: spec.steps || [
        "先读空格前后的词，判断缺少的是单词、短语还是动词形式。",
        "再根据中文提示、时间词或固定句型确定唯一答案。",
        "最后只输入英文答案本身，不输入选项字母或中文。"
      ],
      commonPitfalls: spec.commonPitfalls || []
    };
  }

  const WORD_HINTS = {
    hello: "你好",
    miss: "小姐；女老师",
    red: "红色",
    yellow: "黄色",
    green: "绿色",
    blue: "蓝色",
    face: "脸",
    ear: "耳朵",
    eye: "眼睛",
    nose: "鼻子",
    mouth: "嘴巴",
    cat: "猫",
    dog: "狗",
    duck: "鸭子",
    pig: "猪",
    bear: "熊",
    bread: "面包",
    egg: "鸡蛋",
    milk: "牛奶",
    juice: "果汁",
    one: "一",
    two: "二",
    three: "三",
    four: "四",
    five: "五",
    teacher: "老师",
    student: "学生",
    pupil: "小学生",
    school: "学校",
    father: "爸爸",
    mother: "妈妈",
    brother: "兄弟",
    sister: "姐妹",
    tall: "高的",
    short: "矮的；短的",
    fat: "胖的",
    thin: "瘦的",
    desk: "书桌",
    chair: "椅子",
    box: "盒子",
    under: "在……下面",
    in: "在……里面",
    pear: "梨",
    apple: "苹果",
    orange: "橙子",
    banana: "香蕉",
    eleven: "十一",
    twelve: "十二",
    thirteen: "十三",
    fourteen: "十四",
    classroom: "教室",
    window: "窗户",
    blackboard: "黑板",
    light: "灯",
    schoolbag: "书包",
    strong: "强壮的",
    friendly: "友好的",
    quiet: "安静的",
    hair: "头发",
    bedroom: "卧室",
    kitchen: "厨房",
    bathroom: "浴室；卫生间",
    beef: "牛肉",
    chicken: "鸡肉；鸡",
    noodles: "面条",
    soup: "汤",
    parents: "父母",
    uncle: "叔叔；舅舅",
    aunt: "阿姨；姑姑",
    doctor: "医生",
    driver: "司机",
    library: "图书馆",
    breakfast: "早饭",
    lunch: "午饭",
    dinner: "晚饭",
    cold: "寒冷的",
    cool: "凉爽的",
    warm: "温暖的",
    hot: "炎热的",
    rainy: "下雨的",
    tomato: "西红柿",
    potato: "土豆",
    horse: "马",
    cow: "奶牛",
    clothes: "衣服",
    hat: "帽子",
    dress: "连衣裙",
    skirt: "短裙",
    pants: "裤子",
    sunglasses: "太阳镜",
    gloves: "手套",
    scarf: "围巾",
    umbrella: "雨伞",
    kind: "和蔼的",
    strict: "严格的",
    polite: "有礼貌的",
    helpful: "乐于助人的",
    monday: "星期一",
    tuesday: "星期二",
    wednesday: "星期三",
    weekend: "周末",
    sandwich: "三明治",
    salad: "沙拉",
    hamburger: "汉堡包",
    tea: "茶",
    sing: "唱歌",
    dance: "跳舞",
    clock: "钟",
    plant: "植物",
    bike: "自行车",
    photo: "照片",
    forest: "森林",
    river: "河流",
    lake: "湖泊",
    mountain: "高山",
    exercise: "锻炼；做运动",
    spring: "春天",
    summer: "夏天",
    autumn: "秋天",
    winter: "冬天",
    january: "一月",
    february: "二月",
    march: "三月",
    april: "四月",
    first: "第一",
    second: "第二",
    third: "第三",
    twelfth: "第十二",
    mine: "我的",
    yours: "你的；你们的",
    his: "他的",
    hers: "她的",
    theirs: "他们的",
    museum: "博物馆",
    bookstore: "书店",
    hospital: "医院",
    visit: "拜访；参观",
    film: "电影",
    trip: "旅行",
    supermarket: "超市",
    studies: "学习",
    puzzles: "谜；智力游戏",
    hiking: "远足",
    hobbies: "爱好",
    postman: "邮递员",
    businessman: "商人",
    scientist: "科学家",
    angry: "生气的",
    afraid: "害怕的",
    sad: "难过的",
    worried: "担心的",
    happy: "高兴的",
    younger: "更年轻的",
    older: "更年长的",
    taller: "更高的",
    shorter: "更矮的；更短的",
    cleaned: "打扫了",
    stayed: "待着；停留了",
    washed: "洗了",
    watched: "看了",
    went: "去；go 的过去式",
    camping: "野营",
    rode: "骑；ride 的过去式",
    hurt: "受伤",
    grass: "草坪",
    gym: "体育馆",
    ago: "以前",
    holiday: "假期",
    story: "故事",
    party: "聚会",
    memory: "回忆",
    dream: "梦想",
    friendship: "友谊"
  };

  function wordHint(word) {
    return WORD_HINTS[String(word || "").trim().toLowerCase()] || "";
  }

  const TOPIC_SPECS = {
    vocabulary: {
      choices: [
        {
          questionType: "选出不同类",
          prompt: "【选出不同类】选出每组中不同类的一项。",
          correct: "window",
          wrongs: ["pencil", "ruler", "eraser"],
          explanation: "pencil、ruler、eraser 都是学习用品，window 是教室物品，不同类。",
          commonPitfalls: ["只看熟词不分类", "中文词义不熟"]
        },
        {
          questionType: "图文匹配",
          prompt: "【Look and choose】图片提示：一个书包里有书和铅笔。选择最合适的单词。",
          correct: "schoolbag",
          wrongs: ["doctor", "rainy", "chicken"],
          explanation: "书和铅笔放在书包里，schoolbag 最符合图片情境。",
          commonPitfalls: ["看图信息抓不准", "相近词混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "pencil" },
          correct: "pencil",
          wrongs: ["window", "rainy", "chicken"],
          explanation: "录音读的是 pencil，表示“铅笔”。",
          steps: [
            "先点击播放录音，听清单词的开头和重音。",
            "再把听到的音和四个选项逐一对应。",
            "最后选择 pencil。"
          ],
          commonPitfalls: ["没有先完整听完录音", "相近词形混淆"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：铅笔\n题目：p____。请只输入完整英文单词。",
          correct: "pencil",
          explanation: "“铅笔”的英文是 pencil，拼写时注意 c 和 i 的位置。",
          commonPitfalls: ["漏写字母", "把中文意思当答案"]
        }
      ]
    },
    phonics: {
      choices: [
        {
          questionType: "语音辨析",
          prompt: "【语音辨析】选出画线字母 a 发音不同的一项。",
          correct: "cat",
          wrongs: ["cake", "name", "face"],
          explanation: "cake、name、face 中 a-e 常读 /eɪ/，cat 中 a 读 /æ/。",
          commonPitfalls: ["开闭音节混淆", "只按字母名称猜"]
        },
        {
          questionType: "听音辨词",
          prompt: "【听音辨词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "cake" },
          correct: "cake",
          wrongs: ["cat", "cap", "map"],
          explanation: "录音读的是 cake，a-e 结构发 /eɪ/，不要和 cat、cap 的短音混淆。",
          steps: [
            "先听录音中 a 的发音是长音还是短音。",
            "再比较 cake、cat、cap、map 的读音差别。",
            "最后选择 cake。"
          ],
          commonPitfalls: ["长短元音混淆", "只按字母外形猜"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据发音规律补全单词。\n提示：c_ke，意思是“蛋糕”。请只输入完整英文单词。",
          correct: "cake",
          explanation: "c_ke 中缺少 a，a-e 结构组成 cake。",
          commonPitfalls: ["漏写元音字母", "开音节规则不熟"]
        }
      ]
    },
    pattern: {
      choices: [
        {
          questionType: "补全对话",
          prompt: "【补全对话】读对话，选择最合适的一句。\nA: What would you like?\nB: ________",
          correct: "I'd like some milk.",
          wrongs: ["It's under the desk.", "He is my brother.", "I went camping."],
          explanation: "What would you like? 询问想要什么，回答可用 I'd like ...。",
          commonPitfalls: ["问答句型不匹配", "只看个别熟词"]
        },
        {
          questionType: "情景交际",
          prompt: "【情景交际】你想询问图书馆在哪里，应该说哪一句？",
          correct: "Where is the library?",
          wrongs: ["What colour is it?", "How old are you?", "I like apples."],
          explanation: "询问地点要用 Where is ...?",
          commonPitfalls: ["疑问词混淆", "情境没有读清"]
        },
        {
          questionType: "听句选答",
          prompt: "【听句选答】点击播放录音，选择最合适的答语。",
          audioPrompt: { type: "tts", lang: "en-US", text: "What would you like?" },
          correct: "I'd like some milk.",
          wrongs: ["It's under the desk.", "He is my brother.", "I went camping."],
          explanation: "录音问 What would you like?，应回答自己想要什么。",
          steps: [
            "先听清疑问句里的 would like。",
            "再判断这是询问“想要什么”。",
            "最后选择 I'd like some milk."
          ],
          commonPitfalls: ["没有听清疑问词", "答语和问句不匹配"]
        }
      ],
      inputs: [
        {
          questionType: "句型填空",
          prompt: "【句型填空】补全句子。\n题目：I ____ a student. 请只输入空格处英文。",
          correct: "am",
          explanation: "主语 I 搭配 be 动词 am。",
          commonPitfalls: ["be 动词搭配错误"]
        }
      ]
    },
    grammar: {
      choices: [
        {
          questionType: "单项选择",
          prompt: "【单项选择】选择正确的一项填入句子。\nHe ____ football yesterday.",
          correct: "played",
          wrongs: ["play", "plays", "playing"],
          explanation: "yesterday 表示过去时间，动词要用过去式 played。",
          commonPitfalls: ["忽略时间标志", "三单和过去式混淆"]
        },
        {
          questionType: "单项选择",
          prompt: "【单项选择】选择正确的一项填入句子。\nThere ____ a clock on the wall.",
          correct: "is",
          wrongs: ["are", "am", "be"],
          explanation: "a clock 是单数，there be 句型中用 There is ...。",
          commonPitfalls: ["there be 单复数不一致"]
        }
      ],
      inputs: [
        {
          questionType: "语法填空",
          prompt: "【语法填空】根据时间词补全句子。\n题目：He ____ football yesterday. 请只输入空格处英文。",
          correct: "played",
          explanation: "yesterday 是一般过去时标志，play 的过去式是 played。",
          commonPitfalls: ["动词过去式拼写错误", "忽略 yesterday"]
        }
      ]
    },
    reading: {
      choices: [
        {
          questionType: "阅读理解",
          prompt: "【阅读理解】Read and choose.\nTom goes to the park by bike on Sunday. He plays football with Mike.\nWhere does Tom go?",
          correct: "To the park.",
          wrongs: ["To the hospital.", "By bike.", "With Mike."],
          explanation: "题目问 Where，短文第一句写 Tom goes to the park。",
          commonPitfalls: ["把交通方式当地点", "没有定位疑问词"]
        },
        {
          questionType: "阅读判断",
          prompt: "【阅读判断】Read and choose.\nAmy has lunch at school. She likes fish and rice.\nWhich sentence is right?",
          correct: "Amy likes fish and rice.",
          wrongs: ["Amy has dinner at home.", "Amy likes bread only.", "Amy goes to the zoo."],
          explanation: "短文第二句直接说明 She likes fish and rice。",
          commonPitfalls: ["没有回到原文定位", "把无关信息当答案"]
        },
        {
          questionType: "听短文选择",
          prompt: "【听短文选择】点击播放录音，选择正确答案。\nWhere does Tom go?",
          audioPrompt: { type: "tts", lang: "en-US", text: "Tom goes to the park by bike on Sunday. He plays football with Mike." },
          correct: "To the park.",
          wrongs: ["To the hospital.", "By bike.", "With Mike."],
          explanation: "录音第一句说 Tom goes to the park，题目问地点，所以选 To the park.",
          steps: [
            "先听问题 Where，知道要找地点。",
            "再听短文中的 goes to the park。",
            "最后选择 To the park."
          ],
          commonPitfalls: ["把交通方式当地点", "只听到人物名没有定位地点"]
        }
      ],
      inputs: [
        {
          questionType: "短语填空",
          prompt: "【短语填空】根据情境补全句子。\nA boy wants to borrow books. He should go to the ____. 请只输入空格处英文单词。",
          correct: "library",
          explanation: "借书应去 library，空格处答案唯一。",
          commonPitfalls: ["没有根据情境定位地点词"]
        }
      ]
    }
  };

  function unitInputSpec(point) {
    const words = (point.curriculum?.knowledge?.words || []).filter((item) => /^[A-Za-z][A-Za-z -]*$/.test(item) && wordHint(item));
    const word = words.find((item) => item.length >= 4 && !item.includes(" ")) || "";
    if (!word) return null;
    const hint = wordHint(word);
    return {
      questionType: point.topic === "grammar" ? "语法填空" : point.topic === "pattern" ? "句型填空" : point.topic === "reading" ? "短语填空" : "单词拼写",
      prompt: `【填入单词】根据中文提示和首字母补全单词。\n中文：${hint}\n题目：${word[0].toLowerCase()}____。请只输入完整英文单词。`,
      correct: word,
      explanation: `“${hint}”对应的英文是 ${word}，首字母也是 ${word[0].toLowerCase()}。`,
      commonPitfalls: ["首字母后漏写", "单词拼写不熟"]
    };
  }

  // 知识点专属题池：key 为 point.id。填了的单元会优先用自己的题，避免同 topic
  // 不同单元抽出同一道题；未填的单元继续回退到 TOPIC_SPECS[point.topic]。
  // 形如 { "e3-unit-1-1": { choices: [...], inputs: [...] } }
  const POINT_SPECS = {
    // ===== 三年级上册 =====
    "e3-unit-1-1": { // Unit 1 Hello
      choices: [
        {
          questionType: "情景选择",
          prompt: "【Choose the best answer】早上第一次见到老师，最合适的问候是哪一句？",
          correct: "Good morning!",
          wrongs: ["Good night!", "Goodbye!", "Thank you!"],
          explanation: "早上问候用 Good morning!，晚安才用 Good night!。",
          commonPitfalls: ["把 morning 和 night 搞混", "问候语和告别语混淆"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Hello! What's your name?\n— ____",
          correct: "My name is Amy.",
          wrongs: ["I'm fine, thank you.", "It's a dog.", "Goodbye!"],
          explanation: "问 What's your name? 要用 My name is... 回答姓名。",
          commonPitfalls: ["答非所问", "把 How are you 的答语搬过来"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "hello" },
          correct: "hello",
          wrongs: ["hi", "Miss", "Mr"],
          explanation: "录音读的是 hello，意思是“你好”。",
          commonPitfalls: ["hello 和 hi 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：你好\n题目：h____。请只输入完整英文单词。",
          correct: "hello",
          explanation: "“你好”的英文是 hello。",
          commonPitfalls: ["漏写字母 l", "把中文意思当答案"]
        }
      ]
    },
    "e3-unit-1-2": { // Unit 2 Colours
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“红色”对应的英文单词是哪一个？",
          correct: "red",
          wrongs: ["blue", "green", "yellow"],
          explanation: "red 是“红色”，blue 蓝、green 绿、yellow 黄。",
          commonPitfalls: ["颜色词记混"]
        },
        {
          questionType: "情景选择",
          prompt: "【Choose the best answer】想请别人把红色的东西给你看，应该说哪一句？",
          correct: "Show me red.",
          wrongs: ["I see a dog.", "Good morning.", "How old are you?"],
          explanation: "Show me... 表示“给我看……”，这里请对方展示红色。",
          commonPitfalls: ["句型和情景不匹配"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的颜色单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "green" },
          correct: "green",
          wrongs: ["red", "blue", "yellow"],
          explanation: "录音读的是 green，意思是“绿色”。",
          commonPitfalls: ["green 和 blue 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：黄色\n题目：y____。请只输入完整英文单词。",
          correct: "yellow",
          explanation: "“黄色”的英文是 yellow，注意有两个 l。",
          commonPitfalls: ["漏写一个 l"]
        }
      ]
    },
    "e3-unit-1-3": { // Unit 3 Look at me
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“眼睛”对应的英文单词是哪一个？",
          correct: "eye",
          wrongs: ["ear", "nose", "mouth"],
          explanation: "eye 是“眼睛”，ear 耳朵、nose 鼻子、mouth 嘴巴。",
          commonPitfalls: ["五官单词记混"]
        },
        {
          questionType: "情景选择",
          prompt: "【Choose the best answer】想让大家看着你，应该说哪一句？",
          correct: "Look at me.",
          wrongs: ["Show me red.", "Good night.", "Thank you."],
          explanation: "Look at me. 表示“看着我”。",
          commonPitfalls: ["句型情景不符"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "nose" },
          correct: "nose",
          wrongs: ["eye", "ear", "mouth"],
          explanation: "录音读的是 nose，意思是“鼻子”。",
          commonPitfalls: ["nose 和 mouth 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：耳朵\n题目：e____。请只输入完整英文单词。",
          correct: "ear",
          explanation: "“耳朵”的英文是 ear。",
          commonPitfalls: ["ear 和 eye 混淆"]
        }
      ]
    },
    "e3-unit-1-4": { // Unit 4 We love animals
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“猫”对应的英文单词是哪一个？",
          correct: "cat",
          wrongs: ["dog", "duck", "pig"],
          explanation: "cat 是“猫”，dog 狗、duck 鸭、pig 猪。",
          commonPitfalls: ["动物单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's this?\n— ____ a dog.",
          correct: "It's",
          wrongs: ["I'm", "You're", "He's"],
          explanation: "问“这是什么”，回答用 It's a dog.（它是一只狗）。",
          commonPitfalls: ["It's 和 I'm 混用"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的动物单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "duck" },
          correct: "duck",
          wrongs: ["dog", "pig", "bear"],
          explanation: "录音读的是 duck，意思是“鸭子”。",
          commonPitfalls: ["duck 和 dog 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：熊\n题目：b____。请只输入完整英文单词。",
          correct: "bear",
          explanation: "“熊”的英文是 bear。",
          commonPitfalls: ["bear 和 bird 混淆"]
        }
      ]
    },
    "e3-unit-1-5": { // Unit 5 Let's eat
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“牛奶”对应的英文单词是哪一个？",
          correct: "milk",
          wrongs: ["bread", "egg", "juice"],
          explanation: "milk 是“牛奶”，bread 面包、egg 鸡蛋、juice 果汁。",
          commonPitfalls: ["食物单词记混"]
        },
        {
          questionType: "情景选择",
          prompt: "【Choose the best answer】想说“我想要一些面包”，应该说哪一句？",
          correct: "I'd like some bread.",
          wrongs: ["Look at me.", "How old are you?", "It's a cat."],
          explanation: "I'd like... 表示“我想要……”，是点餐、表达愿望的常用句。",
          commonPitfalls: ["句型和情景不匹配"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "juice" },
          correct: "juice",
          wrongs: ["milk", "bread", "egg"],
          explanation: "录音读的是 juice，意思是“果汁”。",
          commonPitfalls: ["juice 和 milk 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：鸡蛋\n题目：e____。请只输入完整英文单词。",
          correct: "egg",
          explanation: "“鸡蛋”的英文是 egg，有两个 g。",
          commonPitfalls: ["漏写一个 g"]
        }
      ]
    },
    "e3-unit-1-6": { // Unit 6 Happy birthday
      choices: [
        {
          questionType: "数字选择",
          prompt: "【Choose the best answer】数字“3”对应的英文单词是哪一个？",
          correct: "three",
          wrongs: ["two", "four", "five"],
          explanation: "three 是“3”，two 是 2、four 是 4、five 是 5。",
          commonPitfalls: ["数字单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— How old are you?\n— ____",
          correct: "I'm five years old.",
          wrongs: ["My name is Sam.", "It's a cat.", "Good morning."],
          explanation: "问“你几岁了”，要用 I'm ... years old. 回答年龄。",
          commonPitfalls: ["把问名字的答语搬过来"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的数字单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "four" },
          correct: "four",
          wrongs: ["one", "two", "five"],
          explanation: "录音读的是 four，意思是“4”。",
          commonPitfalls: ["four 和 five 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：二\n题目：t____。请只输入完整英文单词。",
          correct: "two",
          explanation: "“二”的英文是 two，注意 w 不发音。",
          commonPitfalls: ["漏写不发音的 w"]
        }
      ]
    },
    // ===== 三年级下册 =====
    "e3-unit-2-1": { // Unit 1 Welcome back to school
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“老师”对应的英文单词是哪一个？",
          correct: "teacher",
          wrongs: ["student", "pupil", "school"],
          explanation: "teacher 是“老师”，student/pupil 学生、school 学校。",
          commonPitfalls: ["师生单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Where are you from?\n— ____",
          correct: "I'm from China.",
          wrongs: ["I'm fine.", "It's a dog.", "Thank you."],
          explanation: "问“你来自哪里”，用 I'm from... 回答来自哪个地方。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "school" },
          correct: "school",
          wrongs: ["teacher", "student", "pupil"],
          explanation: "录音读的是 school，意思是“学校”。",
          commonPitfalls: ["school 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：学生\n题目：s____。请只输入完整英文单词。",
          correct: "student",
          explanation: "“学生”的英文是 student。",
          commonPitfalls: ["student 拼写错误"]
        }
      ]
    },
    "e3-unit-2-2": { // Unit 2 My family
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“妈妈”对应的英文单词是哪一个？",
          correct: "mother",
          wrongs: ["father", "brother", "sister"],
          explanation: "mother 是“妈妈”，father 爸爸、brother 兄弟、sister 姐妹。",
          commonPitfalls: ["家庭成员单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Who's that man?\n— ____",
          correct: "He's my father.",
          wrongs: ["She's my mother.", "It's a cat.", "I'm fine."],
          explanation: "that man（那个男人）要用 He 指代，回答 He's my father。",
          commonPitfalls: ["He 和 She 用反"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "sister" },
          correct: "sister",
          wrongs: ["mother", "father", "brother"],
          explanation: "录音读的是 sister，意思是“姐妹”。",
          commonPitfalls: ["sister 和 brother 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：爸爸\n题目：f____。请只输入完整英文单词。",
          correct: "father",
          explanation: "“爸爸”的英文是 father。",
          commonPitfalls: ["father 和 mother 拼混"]
        }
      ]
    },
    "e3-unit-2-3": { // Unit 3 At the zoo
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“高的”对应的英文单词是哪一个？",
          correct: "tall",
          wrongs: ["short", "fat", "thin"],
          explanation: "tall 是“高的”，short 矮/短、fat 胖、thin 瘦。",
          commonPitfalls: ["形容词反义词记混"]
        },
        {
          questionType: "反义词",
          prompt: "【Choose the best answer】tall 的反义词是哪一个？",
          correct: "short",
          wrongs: ["fat", "thin", "big"],
          explanation: "tall（高）的反义词是 short（矮）。",
          commonPitfalls: ["反义词配对错误"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "thin" },
          correct: "thin",
          wrongs: ["tall", "short", "fat"],
          explanation: "录音读的是 thin，意思是“瘦的”。",
          commonPitfalls: ["thin 和 thing 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：胖的\n题目：f____。请只输入完整英文单词。",
          correct: "fat",
          explanation: "“胖的”的英文是 fat。",
          commonPitfalls: ["fat 和 fan 混淆"]
        }
      ]
    },
    "e3-unit-2-4": { // Unit 4 Where is my car
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“椅子”对应的英文单词是哪一个？",
          correct: "chair",
          wrongs: ["desk", "box", "car"],
          explanation: "chair 是“椅子”，desk 书桌、box 盒子。",
          commonPitfalls: ["家具单词记混"]
        },
        {
          questionType: "方位介词",
          prompt: "【Choose the best answer】“在盒子里面”应该用哪个介词？\n____ the box",
          correct: "in",
          wrongs: ["on", "under", "to"],
          explanation: "in 表示“在……里面”，on 在上面，under 在下面。",
          commonPitfalls: ["方位介词 in/on/under 混用"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Where is my car?\n— It's ____ the desk.（在桌子下面）",
          correct: "under",
          wrongs: ["in", "on", "at"],
          explanation: "“在桌子下面”用 under the desk。",
          commonPitfalls: ["under 和 on 用反"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：书桌\n题目：d____。请只输入完整英文单词。",
          correct: "desk",
          explanation: "“书桌”的英文是 desk。",
          commonPitfalls: ["desk 和 disk 混淆"]
        }
      ]
    },
    "e3-unit-2-5": { // Unit 5 Do you like pears
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“苹果”对应的英文单词是哪一个？",
          correct: "apple",
          wrongs: ["pear", "orange", "banana"],
          explanation: "apple 是“苹果”，pear 梨、orange 橙、banana 香蕉。",
          commonPitfalls: ["水果单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Do you like pears?\n— Yes, ____",
          correct: "I do.",
          wrongs: ["I am.", "it is.", "I like."],
          explanation: "对 Do you...? 的肯定回答是 Yes, I do.。",
          commonPitfalls: ["Yes, I do. 答成 Yes, I am."]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的水果单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "banana" },
          correct: "banana",
          wrongs: ["apple", "pear", "orange"],
          explanation: "录音读的是 banana，意思是“香蕉”。",
          commonPitfalls: ["banana 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：橙子\n题目：o____。请只输入完整英文单词。",
          correct: "orange",
          explanation: "“橙子”的英文是 orange。",
          commonPitfalls: ["orange 拼写错误"]
        }
      ]
    },
    "e3-unit-2-6": { // Unit 6 How many
      choices: [
        {
          questionType: "数字选择",
          prompt: "【Choose the best answer】数字“12”对应的英文单词是哪一个？",
          correct: "twelve",
          wrongs: ["eleven", "thirteen", "fourteen"],
          explanation: "twelve 是“12”，eleven 11、thirteen 13、fourteen 14。",
          commonPitfalls: ["11-14 数字记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— How many books do you see?\n— ____",
          correct: "I see eleven.",
          wrongs: ["I'm eleven.", "Yes, I do.", "It's a book."],
          explanation: "How many...? 问数量，回答 I see + 数字。",
          commonPitfalls: ["数量和年龄回答混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的数字单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "thirteen" },
          correct: "thirteen",
          wrongs: ["eleven", "twelve", "fourteen"],
          explanation: "录音读的是 thirteen，意思是“13”。",
          commonPitfalls: ["thirteen 和 thirty 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：十一\n题目：e____。请只输入完整英文单词。",
          correct: "eleven",
          explanation: "“十一”的英文是 eleven。",
          commonPitfalls: ["eleven 拼写错误"]
        }
      ]
    },
    // ===== 四年级上册 =====
    "e4-unit-1-1": { // Unit 1 My classroom
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“窗户”对应的英文单词是哪一个？",
          correct: "window",
          wrongs: ["blackboard", "light", "door"],
          explanation: "window 是“窗户”，blackboard 黑板、light 灯。",
          commonPitfalls: ["教室物品单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's in the classroom?\n— ____",
          correct: "A blackboard and six lights.",
          wrongs: ["I'm fine.", "Yes, I do.", "He's my father."],
          explanation: "What's in...? 问里面有什么，要回答具体物品。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "blackboard" },
          correct: "blackboard",
          wrongs: ["window", "light", "classroom"],
          explanation: "录音读的是 blackboard，意思是“黑板”。",
          commonPitfalls: ["blackboard 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：教室\n题目：c____。请只输入完整英文单词。",
          correct: "classroom",
          explanation: "“教室”的英文是 classroom，由 class + room 合成。",
          commonPitfalls: ["classroom 拼写错误"]
        }
      ]
    },
    "e4-unit-1-2": { // Unit 2 My schoolbag
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“故事书”对应的英文单词是哪一个？",
          correct: "storybook",
          wrongs: ["maths book", "English book", "schoolbag"],
          explanation: "storybook 是“故事书”，maths book 数学书、English book 英语书。",
          commonPitfalls: ["各种 book 记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's in your schoolbag?\n— ____",
          correct: "I have three books.",
          wrongs: ["I'm fine.", "It's a cat.", "Yes, I do."],
          explanation: "问书包里有什么，用 I have... 回答拥有的物品。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "schoolbag" },
          correct: "schoolbag",
          wrongs: ["storybook", "notebook", "classroom"],
          explanation: "录音读的是 schoolbag，意思是“书包”。",
          commonPitfalls: ["schoolbag 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：书包\n题目：s____。请只输入完整英文单词。",
          correct: "schoolbag",
          explanation: "“书包”的英文是 schoolbag。",
          commonPitfalls: ["schoolbag 拼写错误"]
        }
      ]
    },
    "e4-unit-1-3": { // Unit 3 My friends
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“强壮的”对应的英文单词是哪一个？",
          correct: "strong",
          wrongs: ["friendly", "quiet", "tall"],
          explanation: "strong 是“强壮的”，friendly 友好的、quiet 安静的。",
          commonPitfalls: ["描述人的形容词记混"]
        },
        {
          questionType: "句型选择",
          prompt: "【Choose the best answer】“她有长头发”应该怎么说？",
          correct: "She has long hair.",
          wrongs: ["She have long hair.", "She is long hair.", "He has long hair."],
          explanation: "第三人称单数 she 后面用 has，不用 have。",
          commonPitfalls: ["has 和 have 混用", "he/she 用反"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "quiet" },
          correct: "quiet",
          wrongs: ["strong", "friendly", "hair"],
          explanation: "录音读的是 quiet，意思是“安静的”。",
          commonPitfalls: ["quiet 和 quite 混淆"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：友好的\n题目：f____。请只输入完整英文单词。",
          correct: "friendly",
          explanation: "“友好的”的英文是 friendly，由 friend + ly 构成。",
          commonPitfalls: ["friendly 拼写错误"]
        }
      ]
    },
    "e4-unit-1-4": { // Unit 4 My home
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“厨房”对应的英文单词是哪一个？",
          correct: "kitchen",
          wrongs: ["bedroom", "living room", "bathroom"],
          explanation: "kitchen 是“厨房”，bedroom 卧室、bathroom 卫生间。",
          commonPitfalls: ["房间单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Is she in the kitchen?\n— No, ____",
          correct: "she isn't.",
          wrongs: ["she is.", "he isn't.", "yes."],
          explanation: "对 Is she...? 的否定回答是 No, she isn't.。",
          commonPitfalls: ["肯定否定回答混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "bedroom" },
          correct: "bedroom",
          wrongs: ["bathroom", "kitchen", "living room"],
          explanation: "录音读的是 bedroom，意思是“卧室”。",
          commonPitfalls: ["bedroom 和 bathroom 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：卫生间\n题目：b____。请只输入完整英文单词。",
          correct: "bathroom",
          explanation: "“卫生间”的英文是 bathroom，由 bath + room 合成。",
          commonPitfalls: ["bathroom 拼写错误"]
        }
      ]
    },
    "e4-unit-1-5": { // Unit 5 Dinner's ready
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“面条”对应的英文单词是哪一个？",
          correct: "noodles",
          wrongs: ["beef", "chicken", "soup"],
          explanation: "noodles 是“面条”，beef 牛肉、chicken 鸡肉、soup 汤。",
          commonPitfalls: ["食物单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What would you like?\n— ____",
          correct: "I'd like some soup.",
          wrongs: ["Yes, I do.", "I'm fine.", "It's a cat."],
          explanation: "What would you like? 问想要什么，用 I'd like... 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "chicken" },
          correct: "chicken",
          wrongs: ["beef", "noodles", "soup"],
          explanation: "录音读的是 chicken，意思是“鸡肉”。",
          commonPitfalls: ["chicken 和 kitchen 混淆"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：汤\n题目：s____。请只输入完整英文单词。",
          correct: "soup",
          explanation: "“汤”的英文是 soup。",
          commonPitfalls: ["soup 和 soap 混淆"]
        }
      ]
    },
    "e4-unit-1-6": { // Unit 6 Meet my family
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“医生”对应的英文单词是哪一个？",
          correct: "doctor",
          wrongs: ["driver", "uncle", "aunt"],
          explanation: "doctor 是“医生”，driver 司机、uncle 叔叔、aunt 阿姨。",
          commonPitfalls: ["职业和亲属单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's his job?\n— ____",
          correct: "He's a driver.",
          wrongs: ["She's a driver.", "It's a car.", "Yes, he is."],
          explanation: "his 指男性，回答用 He's a...（他是一名……）。",
          commonPitfalls: ["he/she 用反"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "aunt" },
          correct: "aunt",
          wrongs: ["uncle", "doctor", "driver"],
          explanation: "录音读的是 aunt，意思是“阿姨、姑姑”。",
          commonPitfalls: ["aunt 和 uncle 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：父母\n题目：p____。请只输入完整英文单词。",
          correct: "parents",
          explanation: "“父母”的英文是 parents，注意结尾有 s。",
          commonPitfalls: ["漏写复数 s"]
        }
      ]
    },
    // ===== 四年级下册 =====
    "e4-unit-2-1": { // Unit 1 My school
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“图书馆”对应的英文单词是哪一个？",
          correct: "library",
          wrongs: ["teachers' office", "first floor", "playground"],
          explanation: "library 是“图书馆”，teachers' office 教师办公室。",
          commonPitfalls: ["校园场所单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Where is the library?\n— It's ____ the first floor.",
          correct: "on",
          wrongs: ["in", "under", "at"],
          explanation: "表示“在第几层”用 on，如 on the first floor。",
          commonPitfalls: ["floor 前介词用错"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "library" },
          correct: "library",
          wrongs: ["office", "floor", "playground"],
          explanation: "录音读的是 library，意思是“图书馆”。",
          commonPitfalls: ["library 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：图书馆\n题目：l____。请只输入完整英文单词。",
          correct: "library",
          explanation: "“图书馆”的英文是 library。",
          commonPitfalls: ["library 拼写错误"]
        }
      ]
    },
    "e4-unit-2-2": { // Unit 2 What time is it
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“午餐”对应的英文单词是哪一个？",
          correct: "lunch",
          wrongs: ["breakfast", "dinner", "music class"],
          explanation: "lunch 是“午餐”，breakfast 早餐、dinner 晚餐。",
          commonPitfalls: ["三餐单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What time is it?\n— ____",
          correct: "It's nine o'clock.",
          wrongs: ["I'm fine.", "It's a book.", "Yes, it is."],
          explanation: "What time is it? 问几点了，用 It's ... o'clock. 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "句型选择",
          prompt: "【Choose the best answer】“该吃午饭了”应该怎么说？",
          correct: "It's time for lunch.",
          wrongs: ["It's time lunch.", "It's a lunch.", "Time is lunch."],
          explanation: "It's time for + 名词，表示“该做某事了”。",
          commonPitfalls: ["漏掉 for"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：早餐\n题目：b____。请只输入完整英文单词。",
          correct: "breakfast",
          explanation: "“早餐”的英文是 breakfast。",
          commonPitfalls: ["breakfast 拼写错误"]
        }
      ]
    },
    "e4-unit-2-3": { // Unit 3 Weather
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“寒冷的”对应的英文单词是哪一个？",
          correct: "cold",
          wrongs: ["cool", "warm", "hot"],
          explanation: "cold 是“寒冷的”，cool 凉爽、warm 温暖、hot 炎热。",
          commonPitfalls: ["天气形容词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's the weather like?\n— ____",
          correct: "It's rainy.",
          wrongs: ["I'm fine.", "It's a cat.", "Yes, I do."],
          explanation: "问天气怎么样，用 It's + 天气词 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "warm" },
          correct: "warm",
          wrongs: ["cold", "cool", "hot"],
          explanation: "录音读的是 warm，意思是“温暖的”。",
          commonPitfalls: ["warm 和 cool 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：炎热的\n题目：h____。请只输入完整英文单词。",
          correct: "hot",
          explanation: "“炎热的”的英文是 hot。",
          commonPitfalls: ["hot 和 hat 混淆"]
        }
      ]
    },
    "e4-unit-2-4": { // Unit 4 At the farm
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“马”对应的英文单词是哪一个？",
          correct: "horse",
          wrongs: ["cow", "tomato", "potato"],
          explanation: "horse 是“马”，cow 奶牛，tomato/potato 是蔬菜。",
          commonPitfalls: ["农场动物和蔬菜混淆"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Are these tomatoes?\n— Yes, ____",
          correct: "they are.",
          wrongs: ["it is.", "they aren't.", "I am."],
          explanation: "对 Are these...? 的肯定回答是 Yes, they are.。",
          commonPitfalls: ["单复数回答混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "potato" },
          correct: "potato",
          wrongs: ["tomato", "horse", "cow"],
          explanation: "录音读的是 potato，意思是“土豆”。",
          commonPitfalls: ["potato 和 tomato 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：奶牛\n题目：c____。请只输入完整英文单词。",
          correct: "cow",
          explanation: "“奶牛”的英文是 cow。",
          commonPitfalls: ["cow 和 cat 混淆"]
        }
      ]
    },
    "e4-unit-2-5": { // Unit 5 My clothes
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“裙子”对应的英文单词是哪一个？",
          correct: "skirt",
          wrongs: ["hat", "dress", "pants"],
          explanation: "skirt 是“裙子”，hat 帽子、dress 连衣裙、pants 裤子。",
          commonPitfalls: ["衣物单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Whose coat is this?\n— It's ____.（我的）",
          correct: "mine",
          wrongs: ["my", "me", "I"],
          explanation: "Whose 问“谁的”，回答用名词性物主代词 mine（我的）。",
          commonPitfalls: ["my 和 mine 混用"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "dress" },
          correct: "dress",
          wrongs: ["skirt", "hat", "pants"],
          explanation: "录音读的是 dress，意思是“连衣裙”。",
          commonPitfalls: ["dress 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：帽子\n题目：h____。请只输入完整英文单词。",
          correct: "hat",
          explanation: "“帽子”的英文是 hat。",
          commonPitfalls: ["hat 和 hot 混淆"]
        }
      ]
    },
    "e4-unit-2-6": { // Unit 6 Shopping
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“雨伞”对应的英文单词是哪一个？",
          correct: "umbrella",
          wrongs: ["gloves", "scarf", "sunglasses"],
          explanation: "umbrella 是“雨伞”，gloves 手套、scarf 围巾、sunglasses 墨镜。",
          commonPitfalls: ["物品单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Can I help you?\n— ____",
          correct: "Yes, I'd like a scarf.",
          wrongs: ["I'm fine.", "It's a cat.", "No, thanks. I'm five."],
          explanation: "店员问 Can I help you?，顾客常用 I'd like... 说出需求。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "句型选择",
          prompt: "【Choose the best answer】想问“这个多少钱”，应该说哪一句？",
          correct: "How much is it?",
          wrongs: ["How old is it?", "How many is it?", "What time is it?"],
          explanation: "How much 问价钱，How old 问年龄，How many 问数量。",
          commonPitfalls: ["how much/many/old 混用"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：围巾\n题目：s____。请只输入完整英文单词。",
          correct: "scarf",
          explanation: "“围巾”的英文是 scarf。",
          commonPitfalls: ["scarf 拼写错误"]
        }
      ]
    },
    // ===== 五年级上册 =====
    "e5-unit-1-1": { // Unit 1 What's he like
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“严格的”对应的英文单词是哪一个？",
          correct: "strict",
          wrongs: ["kind", "polite", "helpful"],
          explanation: "strict 是“严格的”，kind 友善、polite 有礼貌、helpful 乐于助人。",
          commonPitfalls: ["性格形容词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What's he like?\n— ____",
          correct: "He's kind and helpful.",
          wrongs: ["He's a teacher.", "Yes, he is.", "He's fine."],
          explanation: "What's he like? 问“他是个什么样的人”，用性格形容词回答。",
          commonPitfalls: ["把问职业的答语搬过来"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "polite" },
          correct: "polite",
          wrongs: ["kind", "strict", "helpful"],
          explanation: "录音读的是 polite，意思是“有礼貌的”。",
          commonPitfalls: ["polite 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：友善的\n题目：k____。请只输入完整英文单词。",
          correct: "kind",
          explanation: "“友善的”的英文是 kind。",
          commonPitfalls: ["kind 和 find 混淆"]
        }
      ]
    },
    "e5-unit-1-2": { // Unit 2 My week
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“星期三”对应的英文单词是哪一个？",
          correct: "Wednesday",
          wrongs: ["Monday", "Tuesday", "weekend"],
          explanation: "Wednesday 是“星期三”，Monday 周一、Tuesday 周二。",
          commonPitfalls: ["星期单词记混", "Wednesday 拼写难"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What do you have on Mondays?\n— ____",
          correct: "I have maths and English.",
          wrongs: ["I'm fine.", "It's Monday.", "Yes, I do."],
          explanation: "问“周一你有什么课”，用 I have + 课程 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "Tuesday" },
          correct: "Tuesday",
          wrongs: ["Monday", "Wednesday", "weekend"],
          explanation: "录音读的是 Tuesday，意思是“星期二”。",
          commonPitfalls: ["Tuesday 和 Thursday 听混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：周末\n题目：w____。请只输入完整英文单词。",
          correct: "weekend",
          explanation: "“周末”的英文是 weekend，由 week + end 合成。",
          commonPitfalls: ["weekend 拼写错误"]
        }
      ]
    },
    "e5-unit-1-3": { // Unit 3 What would you like
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“三明治”对应的英文单词是哪一个？",
          correct: "sandwich",
          wrongs: ["salad", "hamburger", "tea"],
          explanation: "sandwich 是“三明治”，salad 沙拉、hamburger 汉堡、tea 茶。",
          commonPitfalls: ["食物单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What would you like to eat?\n— ____",
          correct: "I'd like a hamburger.",
          wrongs: ["I'd like some tea.", "Yes, I would.", "I'm hungry."],
          explanation: "问“想吃什么”（eat），要回答食物；喝的用 drink。",
          commonPitfalls: ["eat 和 drink 的答语混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "salad" },
          correct: "salad",
          wrongs: ["sandwich", "hamburger", "tea"],
          explanation: "录音读的是 salad，意思是“沙拉”。",
          commonPitfalls: ["salad 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：茶\n题目：t____。请只输入完整英文单词。",
          correct: "tea",
          explanation: "“茶”的英文是 tea。",
          commonPitfalls: ["tea 和 tee 混淆"]
        }
      ]
    },
    "e5-unit-1-4": { // Unit 4 What can you do
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“跳舞”对应的英文单词是哪一个？",
          correct: "dance",
          wrongs: ["sing", "draw", "swim"],
          explanation: "dance 是“跳舞”，sing 唱歌、draw 画画、swim 游泳。",
          commonPitfalls: ["动作动词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What can you do?\n— ____",
          correct: "I can sing and dance.",
          wrongs: ["Yes, I can.", "I'm fine.", "I have a dog."],
          explanation: "What can you do? 问“你会做什么”，用 I can... 回答本领。",
          commonPitfalls: ["把一般疑问句的答语搬过来"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】情态动词 can 后面的动词应该用什么形式？",
          correct: "动词原形，如 I can swim.",
          wrongs: ["加 s，如 I can swims.", "加 ing，如 I can swimming.", "加 ed，如 I can swimmed."],
          explanation: "can 后面用动词原形，不加 s、ing 或 ed。",
          commonPitfalls: ["can 后动词加了 s 或 ing"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：唱歌\n题目：s____。请只输入完整英文单词。",
          correct: "sing",
          explanation: "“唱歌”的英文是 sing。",
          commonPitfalls: ["sing 和 sign 混淆"]
        }
      ]
    },
    "e5-unit-1-5": { // Unit 5 There is a big bed
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“照片”对应的英文单词是哪一个？",
          correct: "photo",
          wrongs: ["clock", "plant", "bike"],
          explanation: "photo 是“照片”，clock 时钟、plant 植物、bike 自行车。",
          commonPitfalls: ["物品单词记混"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“床边有两把椅子”应该用哪个句型？",
          correct: "There are two chairs near the bed.",
          wrongs: ["There is two chairs near the bed.", "There have two chairs.", "There has two chairs."],
          explanation: "复数用 There are；单数用 There is；不用 have。",
          commonPitfalls: ["There is/are 单复数用错"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“桌子上有一个时钟”应该怎么说？",
          correct: "There is a clock on the desk.",
          wrongs: ["There are a clock on the desk.", "There is clocks on the desk.", "There have a clock."],
          explanation: "a clock 是单数，用 There is。",
          commonPitfalls: ["单数误用 There are"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：自行车\n题目：b____。请只输入完整英文单词。",
          correct: "bike",
          explanation: "“自行车”的英文是 bike。",
          commonPitfalls: ["bike 和 bake 混淆"]
        }
      ]
    },
    "e5-unit-1-6": { // Unit 6 In a nature park
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“森林”对应的英文单词是哪一个？",
          correct: "forest",
          wrongs: ["river", "lake", "mountain"],
          explanation: "forest 是“森林”，river 河、lake 湖、mountain 山。",
          commonPitfalls: ["自然景物单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Is there a river in the park?\n— Yes, ____",
          correct: "there is.",
          wrongs: ["there are.", "it is.", "there isn't."],
          explanation: "对 Is there...? 的肯定回答是 Yes, there is.。",
          commonPitfalls: ["there is/are 回答混淆"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "mountain" },
          correct: "mountain",
          wrongs: ["forest", "river", "lake"],
          explanation: "录音读的是 mountain，意思是“山”。",
          commonPitfalls: ["mountain 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：湖\n题目：l____。请只输入完整英文单词。",
          correct: "lake",
          explanation: "“湖”的英文是 lake。",
          commonPitfalls: ["lake 和 like 混淆"]
        }
      ]
    },
    // ===== 五年级下册 =====
    "e5-unit-2-1": { // Unit 1 My day
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“吃早饭”对应的英文短语是哪一个？",
          correct: "eat breakfast",
          wrongs: ["have class", "go for a walk", "do exercise"],
          explanation: "eat breakfast 吃早饭，have class 上课，go for a walk 散步。",
          commonPitfalls: ["日常活动短语记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— When do you eat breakfast?\n— ____",
          correct: "I usually eat breakfast at 7 o'clock.",
          wrongs: ["Yes, I do.", "It's breakfast.", "I'm fine."],
          explanation: "When 问“什么时候”，回答要含时间；usually 表示“通常”。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】表示“频率”的词，下面哪个正确？",
          correct: "usually（通常）",
          wrongs: ["yesterday（昨天）", "tomorrow（明天）", "here（这里）"],
          explanation: "usually 是频率副词，表示经常做某事。",
          commonPitfalls: ["频率副词和时间/地点词混淆"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：锻炼\n题目：e____。请只输入完整英文单词。",
          correct: "exercise",
          explanation: "“锻炼”的英文是 exercise。",
          commonPitfalls: ["exercise 拼写错误"]
        }
      ]
    },
    "e5-unit-2-2": { // Unit 2 My favourite season
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“秋天”对应的英文单词是哪一个？",
          correct: "autumn",
          wrongs: ["spring", "summer", "winter"],
          explanation: "autumn 是“秋天”，spring 春、summer 夏、winter 冬。",
          commonPitfalls: ["季节单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Which season do you like best?\n— ____",
          correct: "I like winter best.",
          wrongs: ["Yes, I do.", "It's cold.", "I'm fine."],
          explanation: "问“最喜欢哪个季节”，用 I like ... best. 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "spring" },
          correct: "spring",
          wrongs: ["summer", "autumn", "winter"],
          explanation: "录音读的是 spring，意思是“春天”。",
          commonPitfalls: ["spring 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：夏天\n题目：s____。请只输入完整英文单词。",
          correct: "summer",
          explanation: "“夏天”的英文是 summer，有两个 m。",
          commonPitfalls: ["漏写一个 m"]
        }
      ]
    },
    "e5-unit-2-3": { // Unit 3 My school calendar
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“一月”对应的英文单词是哪一个？",
          correct: "January",
          wrongs: ["February", "March", "April"],
          explanation: "January 是“一月”，February 二月、March 三月、April 四月。",
          commonPitfalls: ["月份单词记混", "January 拼写难"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— When is the sports meet?\n— ____",
          correct: "It's in April.",
          wrongs: ["Yes, it is.", "It's April.", "I'm fine."],
          explanation: "问“在什么时候”，月份前用 in，回答 It's in + 月份。",
          commonPitfalls: ["月份前介词用错"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "March" },
          correct: "March",
          wrongs: ["January", "February", "April"],
          explanation: "录音读的是 March，意思是“三月”。",
          commonPitfalls: ["March 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：二月\n题目：F____。请只输入完整英文单词。",
          correct: "February",
          explanation: "“二月”的英文是 February，注意中间的 r。",
          commonPitfalls: ["February 漏写 r"]
        }
      ]
    },
    "e5-unit-2-4": { // Unit 4 When is the art show
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】序数词“第一”对应的英文是哪一个？",
          correct: "first",
          wrongs: ["second", "third", "twelfth"],
          explanation: "first 第一、second 第二、third 第三、twelfth 第十二。",
          commonPitfalls: ["序数词记混"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】表示日期“在几月几日”应该用哪个介词？\n____ May 1st",
          correct: "on",
          wrongs: ["in", "at", "to"],
          explanation: "具体某一天用 on，如 on May 1st；月份用 in。",
          commonPitfalls: ["日期前介词 on/in 用错"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "second" },
          correct: "second",
          wrongs: ["first", "third", "twelfth"],
          explanation: "录音读的是 second，意思是“第二”。",
          commonPitfalls: ["second 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：第三\n题目：t____。请只输入完整英文单词。",
          correct: "third",
          explanation: "“第三”的英文是 third。",
          commonPitfalls: ["third 拼写错误"]
        }
      ]
    },
    "e5-unit-2-5": { // Unit 5 Whose dog is it
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“我的（东西）”对应的英文单词是哪一个？",
          correct: "mine",
          wrongs: ["yours", "his", "hers"],
          explanation: "mine 我的、yours 你的、his 他的、hers 她的。",
          commonPitfalls: ["物主代词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Whose dog is it?\n— It's ____.（她的）",
          correct: "hers",
          wrongs: ["her", "she", "his"],
          explanation: "Whose 问“谁的”，回答用名词性物主代词 hers（她的）。",
          commonPitfalls: ["her 和 hers 混用"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】下面哪一句用得对？\n“这本书是我的。”",
          correct: "This book is mine.",
          wrongs: ["This book is my.", "This book is me.", "This book is I."],
          explanation: "句末表示“我的”用 mine，不能用 my。",
          commonPitfalls: ["句末误用 my"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：你的（东西）\n题目：y____。请只输入完整英文单词。",
          correct: "yours",
          explanation: "“你的（东西）”的英文是 yours。",
          commonPitfalls: ["your 和 yours 混淆"]
        }
      ]
    },
    "e5-unit-2-6": { // Unit 6 Work quietly
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“他们正在读书”用现在进行时应该怎么说？",
          correct: "They are reading books.",
          wrongs: ["They reading books.", "They is reading books.", "They read books now."],
          explanation: "现在进行时是 be + 动词ing；they 用 are。",
          commonPitfalls: ["漏掉 be 动词", "be 动词用错"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What are they doing?\n— ____",
          correct: "They are eating lunch.",
          wrongs: ["They eat lunch.", "Yes, they are.", "They are lunch."],
          explanation: "问“他们正在做什么”，用现在进行时 They are + 动词ing 回答。",
          commonPitfalls: ["没用进行时回答"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】动词 read 的现在分词（-ing 形式）是哪一个？",
          correct: "reading",
          wrongs: ["readding", "reads", "readed"],
          explanation: "read 直接加 ing 变成 reading。",
          commonPitfalls: ["ing 形式变化出错"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：安静地\n题目：q____。请只输入完整英文单词。",
          correct: "quietly",
          explanation: "“安静地”的英文是 quietly，由 quiet + ly 构成。",
          commonPitfalls: ["quietly 拼写错误"]
        }
      ]
    },
    // ===== 六年级上册 =====
    "e6-unit-1-1": { // Unit 1 How can I get there
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“博物馆”对应的英文单词是哪一个？",
          correct: "museum",
          wrongs: ["post office", "bookstore", "hospital"],
          explanation: "museum 博物馆、post office 邮局、bookstore 书店、hospital 医院。",
          commonPitfalls: ["场所单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— How can I get to the museum?\n— ____",
          correct: "Turn left at the bookstore.",
          wrongs: ["It's a museum.", "Yes, I can.", "I'm fine."],
          explanation: "How can I get to...? 问怎么去，用指路的话回答，如 Turn left。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "hospital" },
          correct: "hospital",
          wrongs: ["museum", "bookstore", "post office"],
          explanation: "录音读的是 hospital，意思是“医院”。",
          commonPitfalls: ["hospital 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：书店\n题目：b____。请只输入完整英文单词。",
          correct: "bookstore",
          explanation: "“书店”的英文是 bookstore，由 book + store 合成。",
          commonPitfalls: ["bookstore 拼写错误"]
        }
      ]
    },
    "e6-unit-1-2": { // Unit 2 Ways to go to school
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“步行”对应的英文短语是哪一个？",
          correct: "on foot",
          wrongs: ["by bus", "by plane", "by bike"],
          explanation: "on foot 步行；by bus/plane/bike 乘公交/飞机/自行车。",
          commonPitfalls: ["出行方式短语记混", "on foot 误用 by"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— How do you come to school?\n— ____",
          correct: "I usually come by bus.",
          wrongs: ["Yes, I do.", "It's a bus.", "I'm fine."],
          explanation: "问“怎么来学校”，用 by + 交通工具 回答。",
          commonPitfalls: ["答非所问"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“乘飞机”应该怎么表达？",
          correct: "by plane",
          wrongs: ["by a plane", "on plane", "by foot"],
          explanation: "交通工具用 by + 名词（不加冠词）；步行才用 on foot。",
          commonPitfalls: ["by 后误加冠词"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：慢下来\n题目：s____ down。请只输入括号缺少的完整英文单词。",
          correct: "slow",
          explanation: "“慢下来”是 slow down，缺的词是 slow。",
          commonPitfalls: ["slow 和 slowly 混淆"]
        }
      ]
    },
    "e6-unit-1-3": { // Unit 3 My weekend plan
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“我打算去看电影”用一般将来时怎么说？",
          correct: "I'm going to see a film.",
          wrongs: ["I going to see a film.", "I'm go to see a film.", "I see a film."],
          explanation: "be going to 表示打算，结构是 be + going to + 动词原形。",
          commonPitfalls: ["漏掉 be 动词", "going to 后动词形式错"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What are you going to do this weekend?\n— ____",
          correct: "I'm going to visit my grandparents.",
          wrongs: ["Yes, I am.", "I visit grandparents.", "It's a weekend."],
          explanation: "问将来计划，用 I'm going to + 动词原形 回答。",
          commonPitfalls: ["没用 be going to 回答"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“超市”对应的英文单词是哪一个？",
          correct: "supermarket",
          wrongs: ["visit", "film", "trip"],
          explanation: "supermarket 超市，visit 参观、film 电影、trip 旅行。",
          commonPitfalls: ["名词和动词记混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：旅行\n题目：t____。请只输入完整英文单词。",
          correct: "trip",
          explanation: "“旅行”的英文是 trip。",
          commonPitfalls: ["trip 和 trap 混淆"]
        }
      ]
    },
    "e6-unit-1-4": { // Unit 4 I have a pen pal
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“徒步旅行”对应的英文单词是哪一个？",
          correct: "hiking",
          wrongs: ["studies", "puzzles", "hobbies"],
          explanation: "hiking 徒步、studies 学习、puzzles 拼图、hobbies 爱好。",
          commonPitfalls: ["爱好单词记混"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“他喜欢读书”应该怎么说？",
          correct: "He likes reading.",
          wrongs: ["He like reading.", "He likes read.", "He like read."],
          explanation: "第三人称单数 he 后动词加 s（likes）；like 后接动词ing。",
          commonPitfalls: ["第三人称单数漏加 s"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What are his hobbies?\n— ____",
          correct: "He likes hiking and reading.",
          wrongs: ["Yes, he does.", "He's fine.", "It's a hobby."],
          explanation: "问“他的爱好是什么”，用 He likes... 回答。",
          commonPitfalls: ["答非所问"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：爱好\n题目：h____。请只输入完整英文单词。",
          correct: "hobbies",
          explanation: "“爱好”的英文是 hobby，复数是 hobbies（把 y 变 i 加 es）。",
          commonPitfalls: ["hobbies 变复数出错"]
        }
      ]
    },
    "e6-unit-1-5": { // Unit 5 What does he do
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“科学家”对应的英文单词是哪一个？",
          correct: "scientist",
          wrongs: ["postman", "businessman", "factory worker"],
          explanation: "scientist 科学家、postman 邮递员、businessman 商人。",
          commonPitfalls: ["职业单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What does he do?\n— ____",
          correct: "He's a postman.",
          wrongs: ["Yes, he does.", "He's fine.", "He does homework."],
          explanation: "What does he do? 问“他的职业”，用 He's a + 职业 回答。",
          commonPitfalls: ["把 What does he do 理解成“他在做什么”"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“她在工厂工作”应该怎么说？",
          correct: "She works in a factory.",
          wrongs: ["She work in a factory.", "She working in a factory.", "She is work in a factory."],
          explanation: "第三人称单数 she 后动词加 s（works）。",
          commonPitfalls: ["第三人称单数漏加 s"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：邮递员\n题目：p____。请只输入完整英文单词。",
          correct: "postman",
          explanation: "“邮递员”的英文是 postman，由 post + man 合成。",
          commonPitfalls: ["postman 拼写错误"]
        }
      ]
    },
    "e6-unit-1-6": { // Unit 6 How do you feel
      choices: [
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“害怕的”对应的英文单词是哪一个？",
          correct: "afraid",
          wrongs: ["angry", "sad", "happy"],
          explanation: "afraid 害怕、angry 生气、sad 伤心、happy 高兴。",
          commonPitfalls: ["情绪单词记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— I'm angry.\n— You ____ take a deep breath.（你应该……）",
          correct: "should",
          wrongs: ["are", "do", "can't"],
          explanation: "should 表示“应该”，用来给建议。",
          commonPitfalls: ["should 后动词形式错"]
        },
        {
          questionType: "听音选词",
          prompt: "【听音选词】点击播放录音，选择你听到的单词。",
          audioPrompt: { type: "tts", lang: "en-US", text: "worried" },
          correct: "worried",
          wrongs: ["angry", "afraid", "happy"],
          explanation: "录音读的是 worried，意思是“担心的”。",
          commonPitfalls: ["worried 拼读不熟"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：伤心的\n题目：s____。请只输入完整英文单词。",
          correct: "sad",
          explanation: "“伤心的”的英文是 sad。",
          commonPitfalls: ["sad 和 said 混淆"]
        }
      ]
    },
    // ===== 六年级下册 =====
    "e6-unit-2-1": { // Unit 1 How tall are you
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“我比你高”应该怎么说？",
          correct: "I'm taller than you.",
          wrongs: ["I'm tall than you.", "I'm more tall than you.", "I'm tallest than you."],
          explanation: "比较级 taller + than 表示“比……更高”。",
          commonPitfalls: ["比较级不加 er", "比较级和最高级混用"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】old（年老的）的比较级是哪一个？",
          correct: "older",
          wrongs: ["oldest", "more old", "elder"],
          explanation: "old 的比较级直接加 er 变成 older。",
          commonPitfalls: ["比较级变化出错"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— How tall are you?\n— ____",
          correct: "I'm 160 cm tall.",
          wrongs: ["Yes, I am.", "I'm fine.", "It's tall."],
          explanation: "How tall 问身高，用 I'm ... cm tall. 回答。",
          commonPitfalls: ["答非所问"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：更矮的\n题目：s____。请只输入完整英文单词。",
          correct: "shorter",
          explanation: "“更矮的”是 short 的比较级 shorter。",
          commonPitfalls: ["漏写比较级 er"]
        }
      ]
    },
    "e6-unit-2-2": { // Unit 2 Last weekend
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“我昨天打扫了房间”用一般过去时怎么说？",
          correct: "I cleaned my room yesterday.",
          wrongs: ["I clean my room yesterday.", "I cleaning my room yesterday.", "I am clean my room."],
          explanation: "一般过去时动词用过去式，clean 的过去式是 cleaned。",
          commonPitfalls: ["动词没变过去式"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】watch（看）的过去式是哪一个？",
          correct: "watched",
          wrongs: ["watch", "watching", "watchs"],
          explanation: "规则动词 watch 加 ed 变成 watched。",
          commonPitfalls: ["过去式变化出错"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What did you do last weekend?\n— ____",
          correct: "I washed my clothes.",
          wrongs: ["I wash my clothes.", "Yes, I did.", "I'm fine."],
          explanation: "问过去做了什么，回答用动词过去式。",
          commonPitfalls: ["回答没用过去式"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：待/停留（过去式）\n题目：s____。请只输入完整英文单词。",
          correct: "stayed",
          explanation: "stay 的过去式是 stayed。",
          commonPitfalls: ["stayed 拼写错误"]
        }
      ]
    },
    "e6-unit-2-3": { // Unit 3 Where did you go
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】go（去）的过去式是哪一个？",
          correct: "went",
          wrongs: ["goed", "gone", "going"],
          explanation: "go 是不规则动词，过去式是 went。",
          commonPitfalls: ["不规则动词误加 ed"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— Where did you go on your holiday?\n— ____",
          correct: "I went to Xinjiang.",
          wrongs: ["I go to Xinjiang.", "Yes, I did.", "I'm fine."],
          explanation: "Where did you go 问过去去了哪里，用 I went to... 回答。",
          commonPitfalls: ["回答没用过去式 went"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】ride（骑）的过去式是哪一个？",
          correct: "rode",
          wrongs: ["rided", "ridden", "riding"],
          explanation: "ride 是不规则动词，过去式是 rode。",
          commonPitfalls: ["不规则动词过去式记错"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：露营\n题目：c____。请只输入完整英文单词。",
          correct: "camping",
          explanation: "“露营”的英文是 camping（go camping 去露营）。",
          commonPitfalls: ["camping 拼写错误"]
        }
      ]
    },
    "e6-unit-2-4": { // Unit 4 Then and now
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“以前这里有一个体育馆”用过去时的 there be 怎么说？",
          correct: "There was a gym here.",
          wrongs: ["There is a gym here.", "There were a gym here.", "There have a gym here."],
          explanation: "there be 的过去式：单数用 was，复数用 were。",
          commonPitfalls: ["was/were 单复数用错"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“……以前”对应的英文单词是哪一个？",
          correct: "ago",
          wrongs: ["grass", "gym", "dining hall"],
          explanation: "ago 表示“以前”，如 two years ago（两年前）。",
          commonPitfalls: ["ago 用法不熟"]
        },
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“过去有很多树”应该怎么说？",
          correct: "There were many trees.",
          wrongs: ["There was many trees.", "There are many trees.", "There is many trees."],
          explanation: "many trees 是复数，过去时用 were。",
          commonPitfalls: ["复数误用 was"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：草地\n题目：g____。请只输入完整英文单词。",
          correct: "grass",
          explanation: "“草地”的英文是 grass。",
          commonPitfalls: ["grass 漏写一个 s"]
        }
      ]
    },
    "e6-unit-2-5": { // Recycle Mike's happy days
      choices: [
        {
          questionType: "语法综合",
          prompt: "【Choose the best answer】“上周日我看望了奶奶”应该怎么说？",
          correct: "I visited my grandma last Sunday.",
          wrongs: ["I visit my grandma last Sunday.", "I will visit my grandma last Sunday.", "I am visiting my grandma last Sunday."],
          explanation: "有 last Sunday（上周日）要用一般过去时，visit 的过去式是 visited。",
          commonPitfalls: ["时间状语和时态不一致"]
        },
        {
          questionType: "语法综合",
          prompt: "【Choose the best answer】“明天我打算开派对”应该怎么说？",
          correct: "I'm going to have a party tomorrow.",
          wrongs: ["I had a party tomorrow.", "I have a party yesterday.", "I having a party tomorrow."],
          explanation: "tomorrow（明天）表示将来，用 be going to。",
          commonPitfalls: ["将来的事误用过去时"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“假期”对应的英文单词是哪一个？",
          correct: "holiday",
          wrongs: ["photo", "story", "party"],
          explanation: "holiday 假期、photo 照片、story 故事、party 聚会。",
          commonPitfalls: ["名词词义记混"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：聚会\n题目：p____。请只输入完整英文单词。",
          correct: "party",
          explanation: "“聚会”的英文是 party。",
          commonPitfalls: ["party 拼写错误"]
        }
      ]
    },
    "e6-unit-2-6": { // Graduation review
      choices: [
        {
          questionType: "语法选择",
          prompt: "【Choose the best answer】“我将上中学了”表达对未来的展望，应该怎么说？",
          correct: "I will go to middle school.",
          wrongs: ["I go to middle school yesterday.", "I went to middle school.", "I am go to middle school."],
          explanation: "will + 动词原形表示将来，展望未来常用 will。",
          commonPitfalls: ["将来时用错"]
        },
        {
          questionType: "词义选择",
          prompt: "【Choose the best answer】“梦想”对应的英文单词是哪一个？",
          correct: "dream",
          wrongs: ["memory", "friendship", "middle school"],
          explanation: "dream 梦想、memory 回忆、friendship 友谊。",
          commonPitfalls: ["抽象名词词义记混"]
        },
        {
          questionType: "对话补全",
          prompt: "【Complete the dialogue】— What do you want to be in the future?\n— ____",
          correct: "I want to be a teacher.",
          wrongs: ["I wanted a teacher.", "Yes, I do.", "I'm a teacher now."],
          explanation: "问“将来想成为什么”，用 I want to be a... 回答理想。",
          commonPitfalls: ["答非所问"]
        }
      ],
      inputs: [
        {
          questionType: "单词拼写",
          prompt: "【单词拼写】根据中文和首字母补全单词。\n中文：友谊\n题目：f____。请只输入完整英文单词。",
          correct: "friendship",
          explanation: "“友谊”的英文是 friendship，由 friend + ship 构成。",
          commonPitfalls: ["friendship 拼写错误"]
        }
      ]
    }
  };

  function specsForPoint(point) {
    const topicSpec = TOPIC_SPECS[point.topic] || TOPIC_SPECS.vocabulary;
    const pointSpec = POINT_SPECS[point.id] || {};
    const unitInput = /^e\d-unit-/.test(point.id) ? unitInputSpec(point) : null;
    // 专属选择题在前，topic 选择题在后作为补充
    const choices = [...(pointSpec.choices || []), ...topicSpec.choices]
      .map((spec) => ({ ...spec, format: "choice" }));
    const topicInputs = [unitInput || topicSpec.inputs[0], ...topicSpec.inputs.slice(unitInput ? 0 : 1)]
      .filter(Boolean);
    const inputs = [...(pointSpec.inputs || []), ...topicInputs]
      .map((spec) => ({ ...spec, format: "input" }));
    const result = [];
    const max = Math.max(choices.length, inputs.length);
    for (let index = 0; index < max; index += 1) {
      if (choices[index]) result.push(choices[index]);
      if (inputs[index]) result.push(inputs[index]);
    }
    return result;
  }

  function makeQuestion(deps, point) {
    const allSpecs = specsForPoint(point);
    let spec;
    if (deps && typeof deps.pick === "function") {
      spec = deps.pick(allSpecs);
    } else {
      const preferredFormat = deps?.state?.answerMode === "input" ? "input" : deps?.state?.answerMode === "choice" ? "choice" : "";
      const candidates = preferredFormat ? allSpecs.filter((item) => item.format === preferredFormat) : allSpecs;
      spec = choose(deps || {}, candidates.length ? candidates : allSpecs);
    }
    const data = spec.format === "input" ? inputQuestion(point, spec) : choiceQuestion(deps || {}, point, spec);
    return baseQuestion(deps || {}, point, data);
  }

  window.MathCampEnglishQuestionGenerator = { makeQuestion };
})();
