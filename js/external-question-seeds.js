(function () {
  "use strict";

  const SOURCE = {
    gutenbergAlice: {
      kind: "openResource",
      name: "Project Gutenberg: Alice's Adventures in Wonderland",
      url: "https://www.gutenberg.org/cache/epub/11/pg11.txt",
      license: "Public domain in the United States"
    },
    openStaxPrealgebra: {
      kind: "openResource",
      name: "OpenStax Prealgebra 2e",
      url: "https://openstax.org/books/prealgebra-2e/pages/1-introduction",
      license: "CC BY"
    },
    openStaxBiology: {
      kind: "openResource",
      name: "OpenStax Biology 2e",
      url: "https://openstax.org/books/biology-2e/pages/1-introduction",
      license: "CC BY"
    },
    nasaSolarSystem: {
      kind: "openResource",
      name: "NASA Science: Solar System",
      url: "https://science.nasa.gov/solar-system/",
      license: "Public educational reference"
    },
    smartEdu: {
      kind: "openResource",
      name: "国家中小学智慧教育平台",
      url: "https://basic.smartedu.cn/",
      license: "Official public education resource reference"
    },
    pep: {
      kind: "openResource",
      name: "人民教育出版社教材资源",
      url: "https://www.pep.com.cn/",
      license: "Official textbook resource reference"
    },
    hangzhouEdu: {
      kind: "inspiredOriginal",
      name: "杭州市教育局与浙江教学要求参考",
      url: "https://edu.hangzhou.gov.cn/",
      license: "Regional curriculum alignment reference"
    },
    zhejiangEdu: {
      kind: "openResource",
      name: "浙江省教育厅教学要求参考",
      url: "https://jyt.zj.gov.cn/",
      license: "Regional public education reference"
    },
    zjerCloud: {
      kind: "openResource",
      name: "浙江教育资源公共服务平台",
      url: "https://yun.zjer.cn/",
      license: "Regional teaching resource reference"
    },
    moeCurriculum: {
      kind: "openResource",
      name: "教育部义务教育课程方案和课程标准参考",
      url: "http://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html",
      license: "Official curriculum standards reference"
    },
    edupScience: {
      kind: "openResource",
      name: "教育科学出版社小学科学教材资源参考",
      url: "https://www.edup.com.cn/",
      license: "Textbook publisher reference"
    },
    zxxkPattern: {
      kind: "inspiredOriginal",
      name: "学科网小学题型结构参考",
      url: "https://www.zxxk.com/",
      license: "Original rewrite from question pattern only"
    },
    zujuanPattern: {
      kind: "inspiredOriginal",
      name: "组卷网小学题型结构参考",
      url: "https://www.zujuan.com/",
      license: "Original rewrite from question pattern only"
    },
    jyeooPattern: {
      kind: "inspiredOriginal",
      name: "菁优网小学题型结构参考",
      url: "https://www.jyeoo.com/",
      license: "Original rewrite from question pattern only"
    },
    cnjyPattern: {
      kind: "inspiredOriginal",
      name: "21世纪教育网小学题型结构参考",
      url: "https://www.21cnjy.com/",
      license: "Original rewrite from question pattern only"
    },
    aoshuPattern: {
      kind: "inspiredOriginal",
      name: "奥数网小学题型结构参考",
      url: "https://www.aoshu.com/",
      license: "Original rewrite from question pattern only"
    },
    shijuanPattern: {
      kind: "inspiredOriginal",
      name: "第一试卷网小学题型结构参考",
      url: "https://www.shijuan1.com/",
      license: "Original rewrite from question pattern only"
    },
    eolPattern: {
      kind: "inspiredOriginal",
      name: "中国教育在线小学学习题型参考",
      url: "https://www.eol.cn/",
      license: "Original rewrite from question pattern only"
    },
    publicPoetry: {
      kind: "openResource",
      name: "Public-domain classical Chinese poetry",
      url: "https://zh.wikisource.org/wiki/唐诗三百首",
      license: "Public-domain text reference"
    },
    inspired: {
      kind: "inspiredOriginal",
      name: "Common primary-school exam pattern, original rewrite",
      url: "https://openstax.org/",
      license: "Original item based on topic pattern"
    }
  };

  const BANK = {
    "g1-20-add": [
      {
        id: "ext-math-g1-20-smartedu-1",
        answerType: "text",
        text: "9 + 6 = ?",
        answer: 15,
        acceptedAnswers: ["15"],
        explanation: "把 6 拆成 1 和 5，9 + 1 = 10，10 + 5 = 15。",
        steps: ["先想 9 还差 1 凑成 10。", "把 6 拆成 1 和 5。", "9 + 1 + 5 = 15。"],
        templateType: "20以内凑十加法",
        sourceMeta: SOURCE.smartEdu
      }
    ],
    "g2-100-add": [
      {
        id: "ext-math-g2-carry-openstax-1",
        answerType: "text",
        text: "47 + 8 = ?",
        answer: 55,
        acceptedAnswers: ["55"],
        explanation: "个位 7 + 8 = 15，需要向十位进 1，所以 47 + 8 = 55。",
        steps: ["先算个位 7 + 8 = 15。", "写 5，向十位进 1。", "十位 4 加进位 1，结果是 55。"],
        templateType: "100以内进位加法",
        sourceMeta: SOURCE.smartEdu
      }
    ],
    "g2-table-div": [
      {
        id: "ext-math-g2-table-div-aoshu-1",
        answerType: "text",
        text: "24 个贴纸平均分给 6 个小朋友，24 ÷ 6 = ? 每人分到几个？",
        answer: 4,
        acceptedAnswers: ["4"],
        explanation: "平均分用除法，想口诀四六二十四，所以 24 ÷ 6 = 4。",
        steps: ["先看关键词“平均分给 6 个小朋友”。", "列式 24 ÷ 6。", "想 6 × 4 = 24，所以每人 4 个。"],
        templateType: "表内除法平均分",
        sourceMeta: SOURCE.aoshuPattern
      }
    ],
    "g3-fraction-intro": [
      {
        id: "ext-math-g3-fraction-zhejiang-1",
        answerType: "text",
        text: "把一个圆平均分成 4 份，涂其中 1 份，这个几分之一的分母是几？",
        answer: 4,
        acceptedAnswers: ["4"],
        explanation: "平均分成 4 份，每份是这个圆的 1/4，分母表示平均分的总份数。",
        steps: ["先确认是平均分。", "总共分成 4 份。", "所以分数 1/4 的分母是 4。"],
        templateType: "分数初步",
        sourceMeta: SOURCE.zhejiangEdu
      }
    ],
    "g4-word": [
      {
        id: "ext-math-g4-word-inspired-1",
        answerType: "text",
        text: "图书角有 6 个书架，每个书架放 18 本书，又新添了 24 本。现在一共有多少本书？",
        answer: 132,
        acceptedAnswers: ["132"],
        explanation: "先求原来 6 个书架共有多少本，再加上新添的 24 本。",
        steps: ["原来有 18 × 6 = 108 本。", "再加上新添的 24 本。", "108 + 24 = 132 本。"],
        templateType: "两步应用题",
        word: true,
        sourceMeta: SOURCE.zujuanPattern
      }
    ],
    "g5-decimal": [
      {
        id: "ext-math-g5-decimal-zxxk-1",
        answerType: "text",
        text: "3.50 + 2.40 = ?",
        answer: "5.90",
        acceptedAnswers: ["5.90", "5.9"],
        explanation: "小数加法要把小数点对齐，3.50 + 2.40 = 5.90。",
        steps: ["先把 3.50 和 2.40 的小数点对齐。", "按整数方法算 350 + 240 = 590。", "结果点回两位小数，是 5.90。"],
        templateType: "小数加法",
        sourceMeta: SOURCE.zxxkPattern
      }
    ],
    "g5-percent": [
      {
        id: "ext-math-g5-percent-hangzhou-1",
        answerType: "text",
        text: "一件书包原价 80 元，活动价打九折。九折表示原价的 90%，现价多少元？",
        answer: 72,
        acceptedAnswers: ["72"],
        explanation: "九折就是按原价的 90% 付款，80 × 90% = 72。",
        steps: ["先把九折理解成 90%。", "求 80 元的 90%。", "80 × 90% = 72 元。"],
        templateType: "百分数与折扣",
        sourceMeta: SOURCE.hangzhouEdu
      }
    ],
    "g6-percent": [
      {
        id: "ext-math-g6-percent-shijuan-1",
        answerType: "text",
        text: "学校图书馆去年有 1000 本科普书，今年增加 15%。今年有多少本科普书？",
        answer: 1150,
        acceptedAnswers: ["1150"],
        explanation: "今年数量是去年的 100% + 15% = 115%，1000 × 115% = 1150。",
        steps: ["先求今年相当于去年的 115%。", "列式 1000 × 115%。", "计算得到 1150 本。"],
        templateType: "百分数增长",
        sourceMeta: SOURCE.shijuanPattern
      }
    ],
    "c1-pinyin": [
      {
        id: "ext-chinese-c1-pinyin-poetry-1",
        answerType: "choice",
        prompt: "材料：古诗里常写“明月”“春风”等景物。题目：“月”的正确拼音是哪一个？",
        correct: "yue4",
        wrongs: ["ye4", "yuan4", "yue2"],
        answerText: "yue4",
        acceptedExtra: ["yuè"],
        explanation: "“月”读 yuè，声母是 y，韵母是 ue，读第四声。",
        steps: ["先认准汉字“月”。", "再判断它的声母和韵母。", "最后确定声调是第四声。"],
        questionType: "拼音辨认",
        sourceMeta: SOURCE.pep
      }
    ],
    "c2-punctuation": [
      {
        id: "ext-chinese-c2-punctuation-smartedu-1",
        answerType: "choice",
        prompt: "材料：妈妈问：“你今天把图书还了吗” 这句话是在提问。题目：句末最合适的标点是哪一个？",
        correct: "问号",
        wrongs: ["句号", "逗号", "省略号"],
        explanation: "这句话有提问语气，句末应使用问号。",
        steps: ["先判断这句话是在问问题。", "疑问语气的句末用问号。", "所以选择“问号”。"],
        questionType: "标点辨析",
        sourceMeta: SOURCE.smartEdu
      }
    ],
    "c3-word-meaning": [
      {
        id: "ext-chinese-c3-word-zxxk-1",
        answerType: "choice",
        prompt: "材料：小队员们仔细观察叶片的变化，还把发现认真记在本子上。题目：联系语境，“仔细”的意思最接近哪一个？",
        correct: "认真、细心",
        wrongs: ["速度很快", "声音很大", "颜色鲜艳"],
        explanation: "文中说他们观察并记录变化，“仔细”强调认真、细心。",
        steps: ["先回到词语所在句子。", "结合“观察”“认真记”判断语境。", "选择“认真、细心”。"],
        questionType: "语境词义",
        sourceMeta: SOURCE.zxxkPattern
      }
    ],
    "c3-paragraph-reading": [
      {
        id: "ext-chinese-c3-reading-inspired-1",
        answerType: "choice",
        prompt: "材料：小雨后，操场边的小树叶子更亮了。几个同学约好先擦干长椅，再把落叶扫进袋子。题目：这段话主要写了什么？",
        correct: "同学们雨后整理操场边的环境",
        wrongs: ["同学们在操场比赛跑步", "老师讲解怎样种小树", "大家讨论明天的天气"],
        explanation: "短文的关键动作是擦长椅、扫落叶，都是整理环境。",
        steps: ["先找人物：几个同学。", "再找主要动作：擦长椅、扫落叶。", "合起来概括为雨后整理环境。"],
        questionType: "段意概括",
        sourceMeta: SOURCE.zxxkPattern
      }
    ],
    "c4-sick-sentence": [
      {
        id: "ext-chinese-c4-sick-21cnjy-1",
        answerType: "choice",
        prompt: "题目：修改病句“通过这次劳动，使我明白了合作的重要。”最恰当的一项是哪一个？",
        correct: "删去“通过”或“使”，让句子有明确主语",
        wrongs: ["把“劳动”改成“劳动了”", "在句末加一个问号", "把“合作”改成“合唱”"],
        explanation: "“通过”和“使”连用会让句子缺少主语，删去其中一个即可。",
        steps: ["先找句子的主语。", "发现“通过……使……”导致主语不明确。", "删去“通过”或“使”即可修改。"],
        questionType: "病句修改",
        sourceMeta: SOURCE.cnjyPattern
      }
    ],
    "c5-integrated": [
      {
        id: "ext-chinese-c5-integrated-hangzhou-1",
        answerType: "choice",
        prompt: "材料：学校发起“节约用水”倡议。题目：下面哪一句最适合写进倡议书？",
        correct: "从今天起，让我们随手关紧水龙头，珍惜每一滴水",
        wrongs: ["我昨天在操场上跑得很快", "水杯的颜色有很多种", "这本书的封面很好看"],
        explanation: "倡议书要围绕主题提出明确行动，随手关紧水龙头符合“节约用水”。",
        steps: ["先确定主题是节约用水。", "再看选项是否提出行动。", "选择能发出倡议的一句。"],
        questionType: "综合语用",
        sourceMeta: SOURCE.hangzhouEdu
      }
    ],
    "c6-reading-strategy": [
      {
        id: "ext-chinese-c6-strategy-zhejiang-1",
        answerType: "choice",
        prompt: "题目：要在一篇长文章中快速找到“杭州亚运场馆开放时间”，最合适的阅读策略是哪一个？",
        correct: "先浏览标题和小标题，再定位关键词“开放时间”",
        wrongs: ["从头到尾逐字背诵", "只看插图颜色", "不看题目直接猜答案"],
        explanation: "带着任务阅读时，应先浏览结构，再用关键词定位相关信息。",
        steps: ["先明确要找的信息是开放时间。", "浏览标题、小标题了解结构。", "用关键词快速定位。"],
        questionType: "阅读策略",
        sourceMeta: SOURCE.zhejiangEdu
      }
    ],
    "c6-view-summary": [
      {
        id: "ext-chinese-c6-view-eol-1",
        answerType: "choice",
        prompt: "材料：作者先提出“公共图书馆应延长周末开放时间”，后面列举学生和家长的需求。题目：作者的主要观点是什么？",
        correct: "公共图书馆应延长周末开放时间",
        wrongs: ["学生周末都喜欢打篮球", "家长不需要图书馆", "图书馆只摆放科普书"],
        explanation: "材料开头直接提出观点，后面的内容是在提供理由。",
        steps: ["先找表示观点的句子。", "区分观点和后面的例子。", "概括为图书馆应延长周末开放时间。"],
        questionType: "观点概括",
        sourceMeta: SOURCE.eolPattern
      }
    ],
    "e3-vocabulary-school": [
      {
        id: "ext-english-e3-school-gutenberg-1",
        answerType: "choice",
        prompt: "Read and choose. In the sentence \"Alice had a pencil in her hand\", which word means 铅笔?",
        correct: "pencil",
        wrongs: ["window", "rabbit", "garden"],
        explanation: "pencil 的意思是“铅笔”，符合题目中的中文提示。",
        steps: ["Read the sentence and find the school object.", "Match the Chinese meaning 铅笔.", "Choose pencil."],
        questionType: "单词理解",
        sourceMeta: SOURCE.pep
      }
    ],
    "e3-phonics-short-vowels": [
      {
        id: "ext-english-e3-phonics-pep-1",
        answerType: "choice",
        prompt: "Read and choose. Which word has the short a sound like apple?",
        correct: "cat",
        wrongs: ["cake", "bike", "nose"],
        explanation: "cat has the short a sound /a/. The other words have long vowel sounds.",
        steps: ["Say apple and listen to the short a sound.", "Read each option aloud.", "Choose cat."],
        questionType: "自然拼读",
        sourceMeta: SOURCE.pep
      }
    ],
    "e4-pattern-location-time": [
      {
        id: "ext-english-e4-pattern-21cnjy-1",
        answerType: "choice",
        prompt: "Choose the best sentence. You want to ask the time. What should you say?",
        correct: "What time is it?",
        wrongs: ["Where is my bag?", "How much is it?", "What colour is it?"],
        explanation: "To ask about time, we say \"What time is it?\"",
        steps: ["Find the situation: ask the time.", "Match it with the time question pattern.", "Choose What time is it?"],
        questionType: "情景交际",
        sourceMeta: SOURCE.cnjyPattern
      }
    ],
    "e4-reading-notice": [
      {
        id: "ext-english-e4-notice-eol-1",
        answerType: "choice",
        prompt: "Read the notice. Art Club: Friday, 4:10 p.m., Room 302. Question: Where is Art Club?",
        correct: "In Room 302.",
        wrongs: ["On Monday.", "At 7:30 a.m.", "In the dining room."],
        explanation: "The notice says Art Club is in Room 302.",
        steps: ["Read the question word Where.", "Find the place in the notice.", "Choose In Room 302."],
        questionType: "通知信息定位",
        sourceMeta: SOURCE.eolPattern
      }
    ],
    "e5-grammar-there-present": [
      {
        id: "ext-english-e5-there-pep-1",
        answerType: "choice",
        prompt: "Choose and complete. There ___ two pictures on the wall.",
        correct: "are",
        wrongs: ["is", "am", "be"],
        explanation: "two pictures is plural, so we use There are.",
        steps: ["Find the noun phrase: two pictures.", "It is plural.", "Use are after There."],
        questionType: "there be",
        sourceMeta: SOURCE.pep
      }
    ],
    "e5-reading-schedule": [
      {
        id: "ext-english-e5-schedule-eol-1",
        answerType: "choice",
        prompt: "Read the schedule. 7:30 morning exercises; 8:00 English class; 9:00 art class. What do students do at 8:00?",
        correct: "They have English class.",
        wrongs: ["They have art class.", "They go home.", "They play football."],
        explanation: "The schedule shows 8:00 English class.",
        steps: ["Find 8:00 in the schedule.", "Read the activity next to it.", "Choose They have English class."],
        questionType: "日程阅读",
        sourceMeta: SOURCE.eolPattern
      }
    ],
    "e6-grammar-past-tense": [
      {
        id: "ext-english-e6-past-zujuan-1",
        answerType: "choice",
        prompt: "Choose and complete. Yesterday Mike ___ his room and watched TV.",
        correct: "cleaned",
        wrongs: ["clean", "cleans", "cleaning"],
        explanation: "Yesterday shows past time, so clean becomes cleaned.",
        steps: ["Find the time word Yesterday.", "Use the simple past tense.", "Choose cleaned."],
        questionType: "一般过去时",
        sourceMeta: SOURCE.zujuanPattern
      }
    ],
    "e6-reading-story": [
      {
        id: "ext-english-e6-reading-gutenberg-1",
        answerType: "choice",
        prompt: "Read and choose. Alice saw a white rabbit run past her. What did Alice see?",
        correct: "A white rabbit.",
        wrongs: ["A blue pencil.", "A tall tree.", "A yellow bus."],
        explanation: "The sentence says Alice saw a white rabbit, so the correct answer is \"A white rabbit.\"",
        steps: ["Find the subject Alice.", "Find what she saw: a white rabbit.", "Choose the matching answer."],
        questionType: "阅读定位",
        sourceMeta: SOURCE.gutenbergAlice
      }
    ],
    "s1-life-plant-basic": [
      {
        id: "ext-science-s1-plant-smartedu-1",
        answerType: "choice",
        prompt: "观察一株凤仙花。下列哪一项更像植物的共同特征？",
        correct: "需要水和阳光，会慢慢生长",
        wrongs: ["会自己插上电源", "都能在空中飞行", "不需要任何环境条件"],
        explanation: "大多数植物需要水、阳光和适宜环境，并会经历生长变化。",
        steps: ["先想植物生活需要什么。", "再看是否会生长变化。", "选择需要水和阳光、会生长的一项。"],
        questionType: "生命现象判断",
        sourceMeta: SOURCE.smartEdu
      }
    ],
    "s2-matter-water-air": [
      {
        id: "ext-science-s2-air-zjer-1",
        answerType: "choice",
        prompt: "把空杯倒扣入水中，杯里的纸团没有湿。这主要说明什么？",
        correct: "空气占据空间",
        wrongs: ["空气没有质量", "水不会流动", "纸一定防水"],
        explanation: "倒扣的杯子里有空气，空气占据空间，水不容易进入杯底。",
        steps: ["先观察纸团没有湿。", "思考杯子里原来有什么。", "得出空气占据空间。"],
        questionType: "现象解释",
        sourceMeta: SOURCE.zjerCloud
      }
    ],
    "s3-inquiry-fair-test": [
      {
        id: "ext-science-s3-fair-test-openstax-1",
        answerType: "choice",
        prompt: "观察实验：比较水温对食盐溶解快慢的影响。哪种做法更公平？",
        correct: "只改变水温，水量和食盐量保持相同",
        wrongs: ["同时改变水温和食盐量", "每杯水量都不同", "不记录溶解时间"],
        explanation: "公平实验一次只改变一个条件，其他条件要保持相同。",
        steps: ["先找要研究的条件：水温。", "只改变水温。", "水量、食盐量和记录方式保持相同。"],
        questionType: "实验设计",
        sourceMeta: SOURCE.jyeooPattern
      }
    ],
    "s4-earth-rock-soil": [
      {
        id: "ext-science-s4-soil-21cnjy-1",
        answerType: "choice",
        prompt: "把土壤放入水中搅拌后静置，通常先沉到下层的是什么？",
        correct: "颗粒较大的砂粒",
        wrongs: ["漂在水面的空气", "完全透明的清水", "正在发芽的种子"],
        explanation: "颗粒较大的砂粒较重，静置后通常更容易沉到下层。",
        steps: ["先观察土壤由不同颗粒组成。", "比较颗粒大小和沉降快慢。", "判断砂粒更容易沉在下层。"],
        questionType: "观察分类",
        sourceMeta: SOURCE.cnjyPattern
      }
    ],
    "s5-matter-dissolve": [
      {
        id: "ext-science-s5-dissolve-edup-1",
        answerType: "choice",
        prompt: "比较水温对糖溶解快慢的影响，哪种实验设计更公平？",
        correct: "只改变水温，糖的多少和水量保持相同",
        wrongs: ["热水杯放很多糖，冷水杯放很少糖", "每杯水量都不同", "只观察一次且不记录时间"],
        explanation: "研究水温影响时，只能改变水温，其他条件要尽量保持相同。",
        steps: ["先确定研究的问题是水温。", "只改变水温。", "糖量、水量和记录方法保持相同。"],
        questionType: "公平实验",
        sourceMeta: SOURCE.edupScience
      }
    ],
    "s5-inquiry-data-evidence": [
      {
        id: "ext-science-s5-data-shijuan-1",
        answerType: "choice",
        prompt: "三次测试小车在同一斜面上行驶的距离分别是 48 厘米、51 厘米、50 厘米。更合理的做法是什么？",
        correct: "记录多次数据，比较整体趋势再下结论",
        wrongs: ["只保留最大的一次", "把数据随便改成一样", "不看数据直接下结论"],
        explanation: "多次测量能减少偶然误差，结论要建立在数据证据上。",
        steps: ["先保留三次真实数据。", "比较数据是否接近。", "结合整体趋势作出结论。"],
        questionType: "数据证据",
        sourceMeta: SOURCE.shijuanPattern
      }
    ],
    "s6-earth-solar-system": [
      {
        id: "ext-science-s6-solar-nasa-1",
        answerType: "choice",
        prompt: "资料：太阳位于太阳系中心，行星围绕太阳运行。下列说法哪一项正确？",
        correct: "地球是围绕太阳运行的行星",
        wrongs: ["太阳围绕地球运行", "月球是太阳系中心", "所有行星都会自己发光"],
        explanation: "太阳是太阳系中心天体，地球等行星围绕太阳运行。",
        steps: ["先确定中心天体是太阳。", "再判断地球属于行星。", "所以地球围绕太阳运行。"],
        questionType: "证据推理",
        sourceMeta: SOURCE.smartEdu
      }
    ],
    "s6-inquiry-model-reasoning": [
      {
        id: "ext-science-s6-model-zhejiang-1",
        answerType: "choice",
        prompt: "用一个小球和一盏灯模拟月相变化时，哪种对应关系更合理？",
        correct: "小球代表月球，灯代表太阳，观察者代表地球上的人",
        wrongs: ["灯代表月球，小球代表云", "观察者代表太阳内部", "小球代表所有行星一起发光"],
        explanation: "模型要抓住关键对应关系：灯提供光，小球反射光，观察者看到亮面变化。",
        steps: ["先确定模型中的主要对象。", "灯能发光，对应太阳。", "小球反射光，对应月球。"],
        questionType: "模型推理",
        sourceMeta: SOURCE.zhejiangEdu
      }
    ]
  };

  function mergeSeedBank(extensionBank) {
    Object.entries(extensionBank || {}).forEach(([pointId, items]) => {
      if (!Array.isArray(items) || !items.length) return;
      BANK[pointId] = (BANK[pointId] || []).concat(items);
    });
  }

  [
    window.MathCampGrade2ReferenceQuestionSeeds,
    window.MathCampGrade2OriginalQuestionSeeds,
    window.MathCampGrade3ReferenceQuestionSeeds,
    window.MathCampGrade3OriginalQuestionSeeds
  ].forEach((module) => mergeSeedBank(module && module.BANK));

  function subjectForPoint(point) {
    const id = String(point?.id || "");
    if (point?.subject) return point.subject;
    if (/^c\d-/.test(id)) return "chinese";
    if (/^e\d-/.test(id)) return "english";
    if (/^s\d-/.test(id)) return "science";
    return "math";
  }

  function compactList(items) {
    if (window.MathCampQuestionSpec?.compactList) return window.MathCampQuestionSpec.compactList(items);
    const seen = new Set();
    return (items || []).map((item) => String(item || "").trim()).filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  }

  function withChoice(deps, seed) {
    const layout = window.MathCampQuestionSpec.choiceLayout(deps || {}, {
      correct: seed.correct,
      wrongs: seed.wrongs || []
    });
    return {
      text: `${seed.prompt}\n${layout.optionText}`,
      answer: layout.answer,
      answerLabel: layout.answerLabel,
      acceptedAnswers: layout.acceptedAnswers(seed.acceptedExtra || [])
    };
  }

  function cloneMeta(meta) {
    return { ...(meta || {}) };
  }

  function cloneSourceImage(image) {
    if (!image || typeof image !== "object" || Array.isArray(image)) return null;
    return { ...image };
  }

  function normalizeSeed(deps, point, seed) {
    const subject = subjectForPoint(point);
    const common = {
      id: seed.id,
      grade: point.grade,
      pointId: point.id,
      topic: point.topic,
      kind: point.label,
      templateType: seed.templateType || seed.questionType || "扩展题源",
      curriculumBand: point.curriculum?.band || point.curriculum?.unit || point.label,
      explanation: seed.explanation,
      steps: seed.steps || [],
      questionType: seed.questionType || seed.templateType || "扩展题",
      subskills: seed.subskills || [point.short || point.label, point.helper || point.topic].filter(Boolean).slice(0, 3),
      commonPitfalls: seed.commonPitfalls || (subject === "math" ? ["读题漏条件", "计算步骤跳步"] : ["只看关键词", "忽略材料依据"]),
      sourceType: point.sourceType || "external",
      sourceLabel: point.sourceLabel || "扩展题源",
      sourceMeta: cloneMeta(seed.sourceMeta || SOURCE.inspired),
      diagram: seed.diagram ? { ...seed.diagram } : null,
      sourceImage: cloneSourceImage(seed.sourceImage),
      enrichment: true
    };
    if (subject !== "math") common.subject = subject;
    if (seed.word) common.word = true;
    if (seed.answerType === "choice") {
      return {
        ...common,
        ...withChoice(deps, seed),
        answerType: "choice"
      };
    }
    const answer = String(seed.answer || "").trim();
    return {
      ...common,
      text: seed.text || seed.prompt,
      answerType: seed.answerType || "text",
      answer,
      acceptedAnswers: compactList(seed.acceptedAnswers || [answer])
    };
  }

  function forPoint(point) {
    return (BANK[String(point?.id || "")] || []).slice();
  }

  function makeQuestion(deps, point, options = {}) {
    const list = forPoint(point);
    if (!list.length) return null;
    const pick = typeof deps?.pick === "function" ? deps.pick : (items) => items[0];
    const seed = pick(list) || list[0];
    return normalizeSeed(deps || {}, point, seed);
  }

  window.MathCampExternalQuestionSeeds = {
    sources: SOURCE,
    forPoint,
    makeQuestion
  };
})();
