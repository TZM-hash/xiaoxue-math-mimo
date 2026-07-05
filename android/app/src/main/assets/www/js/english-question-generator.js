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

  function choiceQuestion(point, spec) {
    const labels = ["A", "B", "C", "D"];
    const options = [spec.correct, ...spec.wrongs].slice(0, 4);
    return {
      text: `${spec.prompt}\n${options.map((option, index) => `${labels[index]}. ${option}`).join("\n")}`,
      answerType: "choice",
      answer: "A",
      acceptedAnswers: ["A", spec.correct, `A.${spec.correct}`, `A. ${spec.correct}`],
      answerLabel: `A. ${spec.correct}`,
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

  function specsForPoint(point) {
    const topicSpec = TOPIC_SPECS[point.topic] || TOPIC_SPECS.vocabulary;
    const unitInput = /^e\d-unit-/.test(point.id) ? unitInputSpec(point) : null;
    const choices = topicSpec.choices.map((spec) => ({ ...spec, format: "choice" }));
    const inputs = [unitInput || topicSpec.inputs[0], ...topicSpec.inputs.slice(unitInput ? 0 : 1)]
      .filter(Boolean)
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
    const data = spec.format === "input" ? inputQuestion(point, spec) : choiceQuestion(point, spec);
    return baseQuestion(deps || {}, point, data);
  }

  window.MathCampEnglishQuestionGenerator = { makeQuestion };
})();
