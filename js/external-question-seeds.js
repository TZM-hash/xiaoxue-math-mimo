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

  function balanceTextSeed(id, prompt, answer, questionType, explanation, steps) {
    const value = String(answer);
    return {
      id,
      answerType: "text",
      text: prompt,
      answer: value,
      acceptedAnswers: [value],
      explanation,
      steps,
      questionType,
      sourceMeta: {
        ...SOURCE.hangzhouEdu,
        name: "杭州教材单元平衡原创题",
        note: "用于补齐上下册有效题量的原创同步题，不对应参考资料原题。"
      }
    };
  }

  function balanceSeries(pointId, count, build) {
    return Array.from({ length: count }, (_, index) => build(index + 1, `${pointId}-balance-${index + 1}`));
  }

  const CURRICULUM_BALANCE_BANK = {
    "g1-10-add": balanceSeries("g1-10-add", 12, (n, id) => {
      const a = 2 + n % 7;
      const b = 1 + n % Math.max(1, 10 - a);
      return balanceTextSeed(id, `${a} + ${b} = ?`, a + b, "10以内口算", `把 ${a} 和 ${b} 合起来，得到 ${a + b}。`, [`从 ${a} 开始。`, `再加 ${b}。`, `结果是 ${a + b}。`]);
    }),
    "g1-100-number": balanceSeries("g1-100-number", 4, (n, id) => {
      const number = 24 + n * 13;
      return balanceTextSeed(id, `${number} 的十位上是几？`, Math.floor(number / 10), "百以内数位", `${number} 的十位数字是 ${Math.floor(number / 10)}。`, ["从右边找到个位。", "左边一位是十位。", `十位上是 ${Math.floor(number / 10)}。`]);
    }),
    "g1-money": balanceSeries("g1-money", 4, (n, id) => {
      const yuan = n + 1;
      const jiao = n + 2;
      return balanceTextSeed(id, `${yuan} 元 ${jiao} 角一共是多少角？`, yuan * 10 + jiao, "元角换算", `1 元是 10 角，${yuan} 元 ${jiao} 角是 ${yuan * 10 + jiao} 角。`, [`${yuan} 元换成 ${yuan * 10} 角。`, `再加 ${jiao} 角。`, `共 ${yuan * 10 + jiao} 角。`]);
    }),
    "g1-statistics": balanceSeries("g1-statistics", 4, (n, id) => {
      const circle = n + 3;
      const square = n + 5;
      return balanceTextSeed(id, `分类统计：圆形有 ${circle} 个，正方形有 ${square} 个。正方形比圆形多几个？`, square - circle, "分类比较", `用正方形数量减圆形数量，${square} - ${circle} = ${square - circle}。`, [`正方形有 ${square} 个。`, `圆形有 ${circle} 个。`, `相差 ${square - circle} 个。`]);
    }),
    "g2-100-add": balanceSeries("g2-100-add", 30, (n, id) => {
      const a = 20 + n;
      const b = 11 + n % 19;
      return balanceTextSeed(id, `${a} + ${b} = ?`, a + b, "100以内加法", `按数位相加，${a} + ${b} = ${a + b}。`, ["个位相加。", "十位相加并处理进位。", `结果是 ${a + b}。`]);
    }),
    "g2-vertical": balanceSeries("g2-vertical", 28, (n, id) => {
      const a = 70 + n;
      const b = 12 + n % 17;
      return balanceTextSeed(id, `用竖式计算：${a} - ${b} = ?`, a - b, "100以内减法竖式", `相同数位对齐，从个位减起，${a} - ${b} = ${a - b}。`, ["把个位和十位分别对齐。", "从个位减起，不够减时向十位退 1。", `结果是 ${a - b}。`]);
    }),
    "g2-length-measure": balanceSeries("g2-length-measure", 28, (n, id) => {
      const meters = 1 + n % 8;
      const centimeters = 5 + n * 2;
      return balanceTextSeed(id, `${meters} 米 ${centimeters} 厘米一共是多少厘米？`, meters * 100 + centimeters, "米厘米换算", `1 米是 100 厘米，合计 ${meters * 100 + centimeters} 厘米。`, [`${meters} 米换成 ${meters * 100} 厘米。`, `再加 ${centimeters} 厘米。`, `共 ${meters * 100 + centimeters} 厘米。`]);
    }),
    "g2-table": balanceSeries("g2-table", 28, (n, id) => {
      const a = 2 + n % 8;
      const b = 2 + Math.floor(n / 4) % 8;
      return balanceTextSeed(id, `${a} × ${b} = ?`, a * b, "乘法口诀", `根据乘法口诀，${a} × ${b} = ${a * b}。`, [`确定两个乘数 ${a} 和 ${b}。`, "回忆对应口诀。", `积是 ${a * b}。`]);
    }),
    "g3-decimal-intro": balanceSeries("g3-decimal-intro", 20, (n, id) => {
      const a = (10 + n) / 10;
      const b = (2 + n % 7) / 10;
      const answer = (a + b).toFixed(1);
      return balanceTextSeed(id, `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, answer, "一位小数加法", `小数点对齐后相加，结果是 ${answer}。`, ["把小数点对齐。", "按整数加法计算。", `结果写成 ${answer}。`]);
    }),
    "g3-position-area": balanceSeries("g3-position-area", 20, (n, id) => {
      const length = 4 + n % 9;
      const width = 2 + Math.floor(n / 3) % 7;
      return balanceTextSeed(id, `长方形长 ${length} 米、宽 ${width} 米，面积是多少平方米？`, length * width, "长方形面积", `长方形面积是长乘宽，${length} × ${width} = ${length * width}。`, ["写出面积公式。", `代入 ${length} 和 ${width}。`, `面积是 ${length * width} 平方米。`]);
    }),
    "g3-statistics": balanceSeries("g3-statistics", 15, (n, id) => {
      const a = 8 + n;
      const b = 5 + n % 9;
      const c = 6 + n % 7;
      return balanceTextSeed(id, `统计表中三组数量分别是 ${a}、${b}、${c}，合计是多少？`, a + b + c, "统计合计", `把三组数据相加，得到 ${a + b + c}。`, [`读出 ${a}、${b}、${c}。`, "求合计使用加法。", `合计 ${a + b + c}。`]);
    }),
    "g4-large": balanceSeries("g4-large", 12, (n, id) => {
      const a = 12000 + n * 137;
      const b = 2100 + n * 29;
      return balanceTextSeed(id, `${a} + ${b} = ?`, a + b, "大数加法", `相同数位对齐相加，结果是 ${a + b}。`, ["先对齐数位。", "从个位依次相加。", `结果是 ${a + b}。`]);
    }),
    "g4-vertical": balanceSeries("g4-vertical", 12, (n, id) => {
      const a = 120 + n;
      const b = 11 + n % 9;
      return balanceTextSeed(id, `${a} × ${b} = ?`, a * b, "三位数乘两位数", `按竖式计算，${a} × ${b} = ${a * b}。`, ["先乘个位。", "再乘十位并错开一位。", `相加得到 ${a * b}。`]);
    }),
    "g5-factor-multiple": balanceSeries("g5-factor-multiple", 28, (n, id) => {
      const factor = 2 + n % 8;
      const multiple = factor * (3 + n);
      return balanceTextSeed(id, `${multiple} ÷ ${factor} = ?`, multiple / factor, "倍数特征", `${multiple} 能被 ${factor} 整除，商是 ${multiple / factor}。`, [`确认 ${multiple} 是 ${factor} 的倍数。`, `计算 ${multiple} ÷ ${factor}。`, `商是 ${multiple / factor}。`]);
    }),
    "g5-fraction": balanceSeries("g5-fraction", 18, (n, id) => {
      const denominator = 6 + n % 7;
      const a = 1 + n % 2;
      const b = 2 + n % 3;
      return balanceTextSeed(id, `${a}/${denominator} + ${b}/${denominator} 的分子相加后是多少？`, a + b, "同分母分数加法", `同分母分数相加时分母不变，分子 ${a} + ${b} = ${a + b}。`, ["确认分母相同。", "分母保持不变。", `分子相加得 ${a + b}。`]);
    }),
    "g5-volume": balanceSeries("g5-volume", 18, (n, id) => {
      const length = 3 + n % 7;
      const width = 2 + n % 5;
      const height = 2 + Math.floor(n / 3) % 6;
      return balanceTextSeed(id, `长方体长 ${length} cm、宽 ${width} cm、高 ${height} cm，体积是多少立方厘米？`, length * width * height, "长方体体积", `体积 = 长 × 宽 × 高，结果是 ${length * width * height}。`, ["写出体积公式。", `代入 ${length}、${width}、${height}。`, `体积是 ${length * width * height} 立方厘米。`]);
    }),
    "g5-line-statistics": balanceSeries("g5-line-statistics", 18, (n, id) => {
      const values = [8 + n, 10 + n, 14 + n, 11 + n];
      return balanceTextSeed(id, `折线统计图四个时段的数据是 ${values.join("、")}，最大值是多少？`, Math.max(...values), "折线统计图极值", `比较四个数据，最大值是 ${Math.max(...values)}。`, ["读出四个数据。", "逐一比较大小。", `最大值是 ${Math.max(...values)}。`]);
    }),
    "g6-negative": balanceSeries("g6-negative", 3, (n, id) => {
      const depth = 4 + n * 3;
      return balanceTextSeed(id, `海平面以下 ${depth} 米记作多少米？`, -depth, "生活负数", `海平面以下使用负数，记作 -${depth} 米。`, ["以海平面为 0。", "海平面以下使用负号。", `记作 -${depth} 米。`]);
    }),
    "g6-cylinder-cone": balanceSeries("g6-cylinder-cone", 3, (n, id) => {
      const radius = 2 + n;
      const height = 3 + n;
      const answer = (3.14 * radius * radius * height).toFixed(2).replace(/\.00$/, "");
      return balanceTextSeed(id, `圆柱底面半径 ${radius} cm、高 ${height} cm，体积约是多少立方厘米？（π取3.14）`, answer, "圆柱体积", `圆柱体积 = 3.14 × ${radius} × ${radius} × ${height} = ${answer}。`, [`底面积是 3.14 × ${radius} × ${radius}。`, `再乘高 ${height}。`, `体积约 ${answer} 立方厘米。`]);
    })
  };

  // ------------------------------------------------------------------
  // 数学题库扩充（2026 全量优化）
  // 目标：补齐数学一年级空知识点，以及二/四年级缺失的核心单元与六年级题量。
  // 说明：全部使用程序化生成，答案由代码计算，保证正确；每个知识点使用多套
  // 题型模板轮换，避免“换数字仍雷同”导致的相似题堆积。所有条目会与既有题库
  // 合并去重（uniqueSeeds），不会覆盖已有内容。
  // ------------------------------------------------------------------
  function mathBalanceSeed(id, prompt, answer, templateType, explanation, steps) {
    return balanceTextSeed(id, prompt, answer, templateType, explanation, steps);
  }
  // 按模板列表轮换生成一批题：templates 是一组 (index, id) => seed 的函数，
  // 生成第 k 题时使用第 (k % templates.length) 个模板，保证题型均匀交替。
  function rotatingSeries(pointId, count, templates) {
    return Array.from({ length: count }, (_, index) => {
      const template = templates[index % templates.length];
      return template(index + 1, `${pointId}-expand-${index + 1}`);
    });
  }

  const MATH_EXPANSION_BANK = {
    // 一年级：把加起来后再看进位/十位讲清楚，为竖式意识打基础。
    // 10 以内加减是一上核心单元，多补题量同时平衡上下册（上册点较少）。
    "g1-10-add": rotatingSeries("g1-10-add", 90, [
        (n, id) => {
          const total = 6 + (n % 4);
          const part = 1 + (n % Math.max(1, total - 1));
          return mathBalanceSeed(id, `${total} 可以分成 ${part} 和几？`, total - part, "数的分与合", `${total} 分成 ${part} 和 ${total - part}。`, [`总数是 ${total}。`, `已经分出 ${part}。`, `另一部分是 ${total - part}。`]);
        },
        (n, id) => {
          const a = 3 + (n % 5);
          const b = 2 + (n % 4);
          return mathBalanceSeed(id, `树上有 ${a} 只小鸟，又飞来 ${b} 只，一共有几只？`, a + b, "10以内加法应用", `原来 ${a} 只，又来 ${b} 只，一共 ${a + b} 只。`, [`原来 ${a} 只。`, `又飞来 ${b} 只。`, `${a} + ${b} = ${a + b} 只。`]);
        },
        (n, id) => {
          const total = 7 + (n % 3);
          const eaten = 1 + (n % 4);
          return mathBalanceSeed(id, `盘子里有 ${total} 个苹果，吃掉 ${eaten} 个，还剩几个？`, total - eaten, "10以内减法应用", `吃掉就是减去，${total} - ${eaten} = ${total - eaten} 个。`, [`原来 ${total} 个。`, `吃掉 ${eaten} 个。`, `${total} - ${eaten} = ${total - eaten} 个。`]);
        },
        (n, id) => {
          const a = 1 + (n % 8);
          const b = 1 + ((n + 3) % Math.max(1, 9 - a));
          return mathBalanceSeed(id, `${a} + ${b} = ?`, a + b, "10以内口算", `把 ${a} 和 ${b} 合起来，得到 ${a + b}。`, [`从 ${a} 开始。`, `再数 ${b} 个。`, `是 ${a + b}。`]);
        },
        (n, id) => {
          const total = 5 + (n % 5);
          const part = 1 + (n % Math.max(1, total - 1));
          return mathBalanceSeed(id, `${total} - ${part} = ?`, total - part, "10以内减法", `从 ${total} 里去掉 ${part}，还剩 ${total - part}。`, [`总数 ${total}。`, `去掉 ${part}。`, `是 ${total - part}。`]);
        }
    ]),
    // 一年级 20 以内竖式意识（一下笔算萌芽，只练数位对齐）。
    "g1-vertical": rotatingSeries("g1-vertical", 16, [
      (n, id) => {
        const a = 11 + (n % 8);
        const b = 2 + (n % 7);
        return mathBalanceSeed(id, `用竖式的方法算：${a} + ${b} = ?`, a + b, "20以内加法竖式", `个位对齐，从个位加起，${a} + ${b} = ${a + b}。`, ["个位和个位对齐。", "先加个位，满十进一。", `结果是 ${a + b}。`]);
      },
      (n, id) => {
        const a = 13 + (n % 7);
        const b = 2 + (n % 6);
        return mathBalanceSeed(id, `用竖式的方法算：${a} - ${b} = ?`, a - b, "20以内减法竖式", `个位对齐，从个位减起，${a} - ${b} = ${a - b}。`, ["个位和个位对齐。", "从个位减起。", `结果是 ${a - b}。`]);
      }
    ]),
    // 一年级连加连减、加减混合（year：一上一下都有）。
    "g1-two-step": rotatingSeries("g1-two-step", 16, [
      (n, id) => {
        const a = 3 + (n % 4);
        const b = 2 + (n % 3);
        const c = 1 + (n % 3);
        return mathBalanceSeed(id, `${a} + ${b} + ${c} = ?`, a + b + c, "连加", `先算 ${a} + ${b} = ${a + b}，再加 ${c}，得 ${a + b + c}。`, [`先算前两个：${a} + ${b} = ${a + b}。`, `再加 ${c}。`, `结果是 ${a + b + c}。`]);
      },
      (n, id) => {
        const a = 12 + (n % 6);
        const b = 2 + (n % 4);
        const c = 1 + (n % 3);
        return mathBalanceSeed(id, `${a} - ${b} - ${c} = ?`, a - b - c, "连减", `先算 ${a} - ${b} = ${a - b}，再减 ${c}，得 ${a - b - c}。`, [`先算 ${a} - ${b} = ${a - b}。`, `再减 ${c}。`, `结果是 ${a - b - c}。`]);
      },
      (n, id) => {
        const a = 8 + (n % 5);
        const b = 3 + (n % 4);
        const c = 2 + (n % 3);
        return mathBalanceSeed(id, `${a} + ${b} - ${c} = ?`, a + b - c, "加减混合", `先算 ${a} + ${b} = ${a + b}，再减 ${c}，得 ${a + b - c}。`, [`先算 ${a} + ${b} = ${a + b}。`, `再减 ${c}。`, `结果是 ${a + b - c}。`]);
      }
    ]),
    // 一年级比多比少与补数。
    "g1-compare": rotatingSeries("g1-compare", 16, [
      (n, id) => {
        const a = 5 + (n % 8);
        const diff = 1 + (n % 5);
        return mathBalanceSeed(id, `${a + diff} 比 ${a} 多几？`, diff, "比多少", `多多少用减法：${a + diff} - ${a} = ${diff}。`, [`两个数是 ${a + diff} 和 ${a}。`, "多多少用减法。", `${a + diff} - ${a} = ${diff}。`]);
      },
      (n, id) => {
        const target = 10 + (n % 8);
        const part = 2 + (n % 6);
        return mathBalanceSeed(id, `${part} 再添上几就是 ${target}？`, target - part, "补数", `从 ${part} 到 ${target} 差 ${target - part}。`, [`目标是 ${target}。`, `已有 ${part}。`, `${target} - ${part} = ${target - part}。`]);
      }
    ]),
    // 一年级数序与第几。
    "g1-number-order": rotatingSeries("g1-number-order", 14, [
      (n, id) => {
        const number = 5 + (n % 12);
        return mathBalanceSeed(id, `${number} 后面相邻的一个数是多少？`, number + 1, "相邻数", `比 ${number} 多 1 的数是 ${number + 1}。`, [`从 ${number} 开始。`, "向后数一个。", `是 ${number + 1}。`]);
      },
      (n, id) => {
        const front = 3 + (n % 6);
        return mathBalanceSeed(id, `小朋友排队，明明前面有 ${front} 人，明明排第几？`, front + 1, "第几问题", `前面 ${front} 人，明明就排在第 ${front + 1}。`, [`前面有 ${front} 人。`, "再数上明明自己。", `明明排第 ${front + 1}。`]);
      }
    ]),
    // 一年级图形与位置。
    "g1-shape": rotatingSeries("g1-shape", 12, [
      (n, id) => {
        const tri = 2 + (n % 4);
        const rect = 3 + (n % 5);
        return mathBalanceSeed(id, `图形里有 ${tri} 个三角形和 ${rect} 个长方形，一共有几个图形？`, tri + rect, "数图形", `把两种图形加起来，${tri} + ${rect} = ${tri + rect}。`, [`三角形 ${tri} 个。`, `长方形 ${rect} 个。`, `一共 ${tri + rect} 个。`]);
      },
      (n, id) => {
        const total = 5 + (n % 5);
        const left = 1 + (n % Math.max(1, total - 1));
        return mathBalanceSeed(id, `一排有 ${total} 个小朋友，从左数第 ${left} 个后面还有几个？`, total - left, "位置与顺序", `第 ${left} 个后面还有 ${total} - ${left} = ${total - left} 个。`, [`一共 ${total} 个。`, `他排第 ${left}。`, `后面 ${total - left} 个。`]);
      }
    ]),
    // 一年级简单应用题。
    "g1-simple-word": rotatingSeries("g1-simple-word", 16, [
      (n, id) => {
        const a = 4 + (n % 6);
        const b = 3 + (n % 5);
        return mathBalanceSeed(id, `红花 ${a} 朵，黄花 ${b} 朵，一共多少朵？`, a + b, "求一共", `求一共用加法，${a} + ${b} = ${a + b}。`, [`红花 ${a} 朵。`, `黄花 ${b} 朵。`, `${a} + ${b} = ${a + b} 朵。`]);
      },
      (n, id) => {
        const total = 12 + (n % 6);
        const used = 3 + (n % 6);
        return mathBalanceSeed(id, `有 ${total} 张卡片，送给同学 ${used} 张，还剩多少张？`, total - used, "求还剩", `还剩用减法，${total} - ${used} = ${total - used}。`, [`原有 ${total} 张。`, `送出 ${used} 张。`, `${total} - ${used} = ${total - used} 张。`]);
      },
      (n, id) => {
        const small = 3 + (n % 5);
        const more = 2 + (n % 4);
        return mathBalanceSeed(id, `弟弟有 ${small} 个气球，哥哥比弟弟多 ${more} 个，哥哥有几个？`, small + more, "比多比少", `比弟弟多 ${more} 个，用加法，${small} + ${more} = ${small + more}。`, [`弟弟 ${small} 个。`, `哥哥多 ${more} 个。`, `${small} + ${more} = ${small + more} 个。`]);
      }
    ]),
    // 一年级思维阅读：练"问什么、用哪个数"。
    "g1-reading": rotatingSeries("g1-reading", 12, [
      (n, id) => {
        const a = 4 + (n % 5);
        const b = 2 + (n % 4);
        return mathBalanceSeed(id, `笼子里有 ${a} 只白兔和 ${b} 只灰兔，另外草地上还有 ${a + b + 2} 只羊。问一共有多少只兔子？`, a + b, "筛选有用条件", `问的是兔子，羊的数量是多余条件，只把两种兔子相加：${a} + ${b} = ${a + b}。`, ["先看清问题：一共多少只兔子。", "羊的数量与问题无关，排除。", `${a} + ${b} = ${a + b} 只。`]);
      },
      (n, id) => {
        const total = 10 + (n % 6);
        const boys = 4 + (n % 4);
        return mathBalanceSeed(id, `一共有 ${total} 个小朋友，其中男生 ${boys} 人，女生有几人？`, total - boys, "读题找关系", `女生 = 总数 - 男生 = ${total} - ${boys} = ${total - boys}。`, [`总数 ${total} 人。`, `男生 ${boys} 人。`, `女生 ${total - boys} 人。`]);
      }
    ]),
    // 一年级思维精进：找规律、量感。
    "g1-thinking": rotatingSeries("g1-thinking", 12, [
      (n, id) => {
        const start = 1 + (n % 4);
        const step = 2;
        const fourth = start + step * 3;
        return mathBalanceSeed(id, `按规律填数：${start}、${start + step}、${start + step * 2}、( )。`, fourth, "找规律", `每次加 ${step}，第四个数是 ${fourth}。`, [`观察相邻两数都差 ${step}。`, `第三个数 ${start + step * 2} 再加 ${step}。`, `是 ${fourth}。`]);
      },
      (n, id) => {
        const groups = 2 + (n % 4);
        const each = 2 + (n % 3);
        return mathBalanceSeed(id, `每组 ${each} 个，共 ${groups} 组，一共有多少个？`, groups * each, "几个几", `${groups} 个 ${each} 相加，也就是 ${groups} × ${each} = ${groups * each}。`, [`每组 ${each} 个。`, `有 ${groups} 组。`, `一共 ${groups * each} 个。`]);
      }
    ]),
    // 一年级附加题：轻量拓展。
    "g1-appendix": rotatingSeries("g1-appendix", 12, [
      (n, id) => {
        const people = 4 + (n % 5);
        return mathBalanceSeed(id, `${people} 个小朋友排成一排，每两个人之间站 1 只小猫，一共有几只小猫？`, people - 1, "间隔问题", `${people} 个人之间有 ${people - 1} 个空，所以有 ${people - 1} 只小猫。`, [`${people} 个人排一排。`, "空隙数比人数少 1。", `是 ${people - 1} 只。`]);
      },
      (n, id) => {
        const a = 2 + (n % 4);
        return mathBalanceSeed(id, `1、${1 + a}、${1 + 2 * a}、${1 + 3 * a}……照这样下去，第 5 个数是多少？`, 1 + 4 * a, "数列规律", `每次加 ${a}，第 5 个数是 1 + 4 × ${a} = ${1 + 4 * a}。`, [`相邻两数都差 ${a}。`, `第 4 个数是 ${1 + 3 * a}。`, `再加 ${a} 得 ${1 + 4 * a}。`]);
      }
    ]),
    // 一年级 20 以内进位/退位补量。
    "g1-20-add": rotatingSeries("g1-20-add", 16, [
      (n, id) => {
        const a = 8 + (n % 2);
        const b = 3 + (n % 6);
        return mathBalanceSeed(id, `${a} + ${b} = ?`, a + b, "凑十法", `${a} 凑成 10 需要 ${10 - a}，${b} 拆成 ${10 - a} 和 ${b - (10 - a)}，得 ${a + b}。`, [`${a} 差 ${10 - a} 凑十。`, `从 ${b} 里拿 ${10 - a}。`, `10 + ${b - (10 - a)} = ${a + b}。`]);
      },
      (n, id) => {
        const a = 12 + (n % 6);
        const b = 4 + (n % 5);
        return mathBalanceSeed(id, `${a} - ${b} = ?`, a - b, "破十法", `把 ${a} 看成 10 和 ${a - 10}，先算 10 - ${b} = ${10 - b}，再加 ${a - 10}，得 ${a - b}。`, [`${a} 分成 10 和 ${a - 10}。`, `10 - ${b} = ${10 - b}。`, `${10 - b} + ${a - 10} = ${a - b}。`]);
      }
    ]),
    // 一年级 100 以内数的认识补量（lower）。
    "g1-100-number": rotatingSeries("g1-100-number", 6, [
      (n, id) => {
        const tens = 2 + (n % 7);
        const ones = 1 + (n % 8);
        const number = tens * 10 + ones;
        return mathBalanceSeed(id, `${number} 里面有几个十和几个一？先回答几个十。`, tens, "数的组成", `${number} 的十位是 ${tens}，表示 ${tens} 个十。`, ["看十位数字。", `十位是 ${tens}。`, `所以有 ${tens} 个十。`]);
      },
      (n, id) => {
        const a = 20 + (n % 40);
        const b = a + 1 + (n % 20);
        return mathBalanceSeed(id, `${a} 和 ${b} 哪个大？填较大的数。`, Math.max(a, b), "大小比较", `先比十位，${b} 比 ${a} 大。`, ["先比较十位。", "十位相同再比个位。", `较大的是 ${Math.max(a, b)}。`]);
      }
    ]),
    // 一年级人民币补量（lower）。
    "g1-money": rotatingSeries("g1-money", 6, [
      (n, id) => {
        const jiao = 12 + (n % 8);
        return mathBalanceSeed(id, `${jiao} 角等于几元几角？先回答几元。`, Math.floor(jiao / 10), "角化元角", `${jiao} 角 = ${Math.floor(jiao / 10)} 元 ${jiao % 10} 角。`, ["10 角 = 1 元。", `${jiao} 角里有 ${Math.floor(jiao / 10)} 个 10 角。`, `是 ${Math.floor(jiao / 10)} 元 ${jiao % 10} 角。`]);
      },
      (n, id) => {
        const pay = 10;
        const cost = 3 + (n % 6);
        return mathBalanceSeed(id, `买文具用去 ${cost} 元，付 ${pay} 元，应找回几元？`, pay - cost, "购物找零", `找零 = 付款 - 花费 = ${pay} - ${cost} = ${pay - cost} 元。`, [`付了 ${pay} 元。`, `花了 ${cost} 元。`, `找回 ${pay - cost} 元。`]);
      }
    ]),
    // 一年级分类统计补量（lower）。
    "g1-statistics": rotatingSeries("g1-statistics", 12, [
      (n, id) => {
        const red = 3 + (n % 5);
        const blue = 2 + (n % 4);
        const yellow = 1 + (n % 3);
        return mathBalanceSeed(id, `统计气球：红 ${red} 个、蓝 ${blue} 个、黄 ${yellow} 个，一共多少个？`, red + blue + yellow, "分类合计", `把三类相加，${red} + ${blue} + ${yellow} = ${red + blue + yellow}。`, ["按颜色分类计数。", "把各类数量相加。", `一共 ${red + blue + yellow} 个。`]);
      },
      (n, id) => {
        const cat = 5 + (n % 5);
        const dog = 2 + (n % 4);
        return mathBalanceSeed(id, `图中猫有 ${cat} 只，狗有 ${dog} 只，哪种动物最多？填数量。`, Math.max(cat, dog), "比较多少", `${cat} 比 ${dog} 多，所以最多的是 ${Math.max(cat, dog)} 只。`, ["比较两类数量。", `${cat} 大于 ${dog}。`, `最多 ${Math.max(cat, dog)} 只。`]);
      }
    ]),
    // ---------- 二年级：补齐 4 个空知识点（均为二下 lower） ----------
    "g2-remainder": rotatingSeries("g2-remainder", 24, [
      (n, id) => {
        const divisor = 3 + (n % 5);
        const quotient = 2 + (n % 6);
        const remainder = 1 + (n % (divisor - 1 || 1));
        const dividend = divisor * quotient + remainder;
        return mathBalanceSeed(id, `${dividend} ÷ ${divisor} = ? 余几？先回答商。`, quotient, "有余数除法", `${dividend} ÷ ${divisor} = ${quotient} 余 ${remainder}，余数要比除数 ${divisor} 小。`, [`想 ${divisor} × ${quotient} = ${divisor * quotient}。`, `还剩 ${dividend} - ${divisor * quotient} = ${remainder}。`, `商是 ${quotient}，余 ${remainder}。`]);
      },
      (n, id) => {
        const perBag = 4 + (n % 3);
        const bags = 3 + (n % 5);
        const extra = 1 + (n % (perBag - 1 || 1));
        const total = perBag * bags + extra;
        return mathBalanceSeed(id, `${total} 个糖果，每袋装 ${perBag} 个，最多能装满几袋？`, bags, "余数应用-装袋", `${total} ÷ ${perBag} = ${bags} 余 ${extra}，装满 ${bags} 袋还剩 ${extra} 个。`, [`每袋 ${perBag} 个。`, `${total} ÷ ${perBag} = ${bags} 余 ${extra}。`, `最多装满 ${bags} 袋。`]);
      },
      (n, id) => {
        const perBoat = 4 + (n % 3);
        const boats = 3 + (n % 5);
        const extra = 1 + (n % (perBoat - 1 || 1));
        const total = perBoat * boats + extra;
        return mathBalanceSeed(id, `${total} 个小朋友划船，每船坐 ${perBoat} 人，至少需要几条船？`, boats + 1, "余数应用-进一法", `${total} ÷ ${perBoat} = ${boats} 余 ${extra}，剩下的人也要一条船，所以至少 ${boats + 1} 条。`, [`${total} ÷ ${perBoat} = ${boats} 余 ${extra}。`, "剩下的人还需要一条船。", `至少 ${boats + 1} 条船。`]);
      }
    ]),
    "g2-ten-thousand": rotatingSeries("g2-ten-thousand", 22, [
      (n, id) => {
        const thousands = 1 + (n % 8);
        const hundreds = n % 10;
        const number = thousands * 1000 + hundreds * 100 + (n % 10) * 10 + (n % 9);
        return mathBalanceSeed(id, `${number} 里千位上是几？`, thousands, "万以内数位", `${number} 从右往左第四位是千位，是 ${thousands}。`, ["从个位开始数位。", "第四位是千位。", `千位是 ${thousands}。`]);
      },
      (n, id) => {
        const a = 1000 + (n * 137) % 8000;
        const b = 1000 + (n * 211) % 8000;
        return mathBalanceSeed(id, `${a} 和 ${b} 哪个大？填较大的数。`, Math.max(a, b), "万以内比较", `位数相同先比最高位，较大的是 ${Math.max(a, b)}。`, ["先看是否位数相同。", "从最高位逐位比较。", `较大的是 ${Math.max(a, b)}。`]);
      }
    ]),
    "g2-mass": rotatingSeries("g2-mass", 20, [
      (n, id) => {
        const kg = 2 + (n % 6);
        return mathBalanceSeed(id, `${kg} 千克等于多少克？`, kg * 1000, "克千克换算", `1 千克 = 1000 克，${kg} 千克 = ${kg * 1000} 克。`, ["记住 1 千克 = 1000 克。", `${kg} × 1000。`, `是 ${kg * 1000} 克。`]);
      },
      (n, id) => {
        const options = ["克", "千克"];
        const heavy = n % 2 === 0;
        const thing = heavy ? "一袋大米" : "一个鸡蛋";
        const answer = heavy ? "千克" : "克";
        return mathBalanceSeed(id, `称${thing}的质量，用“克”还是“千克”更合适？`, answer, "质量单位选择", `${thing}比较${heavy ? "重" : "轻"}，用 ${answer} 更合适。`, [`判断${thing}的轻重。`, heavy ? "较重的物品用千克。" : "较轻的物品用克。", `选 ${answer}。`]);
      }
    ]),
    "g2-statistics": rotatingSeries("g2-statistics", 20, [
      (n, id) => {
        const a = 5 + (n % 6);
        const b = 3 + (n % 5);
        const c = 2 + (n % 4);
        return mathBalanceSeed(id, `调查最喜欢的水果：苹果 ${a} 人、香蕉 ${b} 人、橘子 ${c} 人，一共调查了多少人？`, a + b + c, "数据合计", `把三种人数相加，${a} + ${b} + ${c} = ${a + b + c}。`, ["读出每种水果的人数。", "求一共用加法。", `共 ${a + b + c} 人。`]);
      },
      (n, id) => {
        const a = 8 + (n % 6);
        const b = 3 + (n % 4);
        return mathBalanceSeed(id, `统计表中喜欢跳绳的有 ${a} 人，喜欢踢毽的有 ${b} 人，跳绳比踢毽多几人？`, a - b, "数据比较", `多多少用减法，${a} - ${b} = ${a - b}。`, [`跳绳 ${a} 人。`, `踢毽 ${b} 人。`, `${a} - ${b} = ${a - b} 人。`]);
      }
    ]),
    // 二年级 upper 侧同步补量，维持上下册平衡。
    "g2-100-add": rotatingSeries("g2-100-add", 44, [
      (n, id) => {
        const a = 25 + (n % 60);
        const b = 6 + (n % 9);
        return mathBalanceSeed(id, `${a} + ${b} = ?`, a + b, "100以内进位加法", `个位相加满十向十位进 1，${a} + ${b} = ${a + b}。`, ["先算个位。", "满十进一。", `结果是 ${a + b}。`]);
      },
      (n, id) => {
        const a = 40 + (n % 55);
        const b = 6 + (n % 9);
        return mathBalanceSeed(id, `${a} - ${b} = ?`, a - b, "100以内退位减法", `个位不够减向十位退 1，${a} - ${b} = ${a - b}。`, ["个位不够减。", "向十位退一。", `结果是 ${a - b}。`]);
      }
    ]),
    "g2-length-measure": rotatingSeries("g2-length-measure", 20, [
      (n, id) => {
        const meters = 1 + (n % 6);
        const cm = 10 + (n % 80);
        return mathBalanceSeed(id, `${meters} 米 ${cm} 厘米 = 多少厘米？`, meters * 100 + cm, "米厘米换算", `1 米 = 100 厘米，共 ${meters * 100 + cm} 厘米。`, [`${meters} 米 = ${meters * 100} 厘米。`, `再加 ${cm} 厘米。`, `是 ${meters * 100 + cm} 厘米。`]);
      },
      (n, id) => {
        const cmA = 20 + (n % 60);
        const cmB = 5 + (n % 15);
        return mathBalanceSeed(id, `一支铅笔长 ${cmA} 厘米，用去 ${cmB} 厘米，还剩多长？`, cmA - cmB, "长度计算", `${cmA} - ${cmB} = ${cmA - cmB} 厘米。`, [`原来 ${cmA} 厘米。`, `用去 ${cmB} 厘米。`, `还剩 ${cmA - cmB} 厘米。`]);
      }
    ]),
    // ---------- 四年级：补齐 2 个空知识点（均为四下 lower） ----------
    "g4-decimal": rotatingSeries("g4-decimal", 40, [
      (n, id) => {
        const whole = 1 + (n % 8);
        const tenth = 1 + (n % 9);
        const value = `${whole}.${tenth}`;
        return mathBalanceSeed(id, `小数 ${value} 的小数部分表示十分之几？填几。`, tenth, "小数意义", `${value} 的小数点后一位在十分位，表示十分之 ${tenth}。`, ["小数点后第一位是十分位。", `这里是 ${tenth}。`, `即十分之 ${tenth}。`]);
      },
      (n, id) => {
        const a = (10 + n) / 10;
        const b = (3 + (n % 6)) / 10;
        const answer = (a + b).toFixed(1);
        return mathBalanceSeed(id, `${a.toFixed(1)} + ${b.toFixed(1)} = ?`, answer, "一位小数加法", `小数点对齐相加，结果是 ${answer}。`, ["小数点对齐。", "按整数加法计算。", `结果是 ${answer}。`]);
      },
      (n, id) => {
        const a = (20 + n) / 10;
        const b = (2 + (n % 8)) / 10;
        const answer = (a - b).toFixed(1);
        return mathBalanceSeed(id, `${a.toFixed(1)} - ${b.toFixed(1)} = ?`, answer, "一位小数减法", `小数点对齐相减，结果是 ${answer}。`, ["小数点对齐。", "按整数减法计算。", `结果是 ${answer}。`]);
      },
      (n, id) => {
        const a = (10 + n) / 10;
        const b = a + (1 + (n % 5)) / 10;
        return mathBalanceSeed(id, `比较大小，${a.toFixed(1)} 和 ${b.toFixed(1)} 中较大的是多少？`, b.toFixed(1), "小数比较", `先比整数部分，再比十分位，较大的是 ${b.toFixed(1)}。`, ["先比整数部分。", "再比小数部分。", `较大的是 ${b.toFixed(1)}。`]);
      }
    ]),
    "g4-observation": rotatingSeries("g4-observation", 24, [
      (n, id) => {
        const faces = 3;
        return mathBalanceSeed(id, `从正面、上面、左面观察同一个长方体，一共能看到几个不同的面的形状？`, faces, "三视图", `从正面、上面、侧面观察，能得到 3 个方向的视图。`, ["分别从三个方向看。", "正面、上面、侧面各一个。", `共 ${faces} 个视图。`]);
      },
      (n, id) => {
        const count = 2 + (n % 4);
        return mathBalanceSeed(id, `一个图形沿一条直线对折后两边完全重合，这样的对称轴题里，正方形有几条对称轴？`, 4, "轴对称", `正方形有 4 条对称轴：两条中线、两条对角线。`, ["找能对折重合的直线。", "正方形上下、左右、两条对角线都可以。", "共 4 条。"]);
      },
      (n, id) => {
        const step = 2 + (n % 5);
        return mathBalanceSeed(id, `一个点向右平移 ${step} 格，再向右平移 ${step} 格，一共向右平移了几格？`, step * 2, "平移", `两次平移方向相同，距离相加：${step} + ${step} = ${step * 2} 格。`, [`第一次 ${step} 格。`, `第二次 ${step} 格。`, `一共 ${step * 2} 格。`]);
      }
    ]),
    // 四年级 upper 侧同步补量，维持上下册平衡。
    "g4-large": rotatingSeries("g4-large", 24, [
      (n, id) => {
        const a = 12000 + (n * 317) % 80000;
        const b = 2100 + (n * 53) % 5000;
        return mathBalanceSeed(id, `${a} + ${b} = ?`, a + b, "大数加法", `相同数位对齐相加，结果是 ${a + b}。`, ["数位对齐。", "从个位依次相加。", `是 ${a + b}。`]);
      },
      (n, id) => {
        const a = 50000 + (n * 411) % 40000;
        const b = 1200 + (n * 77) % 8000;
        return mathBalanceSeed(id, `${a} - ${b} = ?`, a - b, "大数减法", `相同数位对齐相减，结果是 ${a - b}。`, ["数位对齐。", "从个位依次相减。", `是 ${a - b}。`]);
      }
    ]),
    "g4-vertical": rotatingSeries("g4-vertical", 22, [
      (n, id) => {
        const a = 120 + (n % 700);
        const b = 12 + (n % 80);
        return mathBalanceSeed(id, `${a} × ${b} = ?`, a * b, "三位数乘两位数", `按竖式先乘个位再乘十位，${a} × ${b} = ${a * b}。`, ["先乘个位。", "再乘十位并错位。", `相加得 ${a * b}。`]);
      },
      (n, id) => {
        const divisor = 12 + (n % 70);
        const quotient = 3 + (n % 40);
        const dividend = divisor * quotient;
        return mathBalanceSeed(id, `${dividend} ÷ ${divisor} = ?`, quotient, "除数是两位数的除法", `试商后，${dividend} ÷ ${divisor} = ${quotient}。`, ["先试商。", `${divisor} × ${quotient} = ${dividend}。`, `商是 ${quotient}。`]);
      }
    ]),
    // ---------- 六年级：整体扩量，重点圆柱圆锥、负数、比例、方程 ----------
    "g6-cylinder-cone": rotatingSeries("g6-cylinder-cone", 12, [
      (n, id) => {
        const radius = 2 + (n % 6);
        const height = 3 + (n % 8);
        const answer = (3.14 * radius * radius * height).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `圆柱底面半径 ${radius} cm、高 ${height} cm，体积约多少立方厘米？（π取3.14）`, answer, "圆柱体积", `V = 3.14 × ${radius}² × ${height} = ${answer}。`, [`底面积 3.14 × ${radius}² = ${(3.14 * radius * radius).toFixed(2).replace(/\.?0+$/, "")}。`, `再乘高 ${height}。`, `约 ${answer} 立方厘米。`]);
      },
      (n, id) => {
        const radius = 2 + (n % 5);
        const height = 3 + (n % 6);
        const answer = (3.14 * radius * radius * height / 3).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `圆锥底面半径 ${radius} cm、高 ${height} cm，体积约多少立方厘米？（π取3.14）`, answer, "圆锥体积", `圆锥体积是等底等高圆柱的三分之一，V = 3.14 × ${radius}² × ${height} ÷ 3 = ${answer}。`, ["先算对应圆柱体积。", "再除以 3。", `约 ${answer} 立方厘米。`]);
      }
    ]),
    "g6-negative": rotatingSeries("g6-negative", 16, [
      (n, id) => {
        const depth = 3 + (n % 12);
        return mathBalanceSeed(id, `海平面以下 ${depth} 米记作多少米？`, -depth, "生活负数", `海平面以下用负数，记作 -${depth} 米。`, ["海平面为 0。", "以下用负号。", `记作 -${depth} 米。`]);
      },
      (n, id) => {
        const rise = 2 + (n % 10);
        const drop = 1 + (n % 8);
        return mathBalanceSeed(id, `气温先上升 ${rise}℃ 记作 +${rise}℃，那么下降 ${drop}℃ 记作多少？`, -drop, "正负意义", `上升为正，下降为负，下降 ${drop}℃ 记作 -${drop}℃。`, ["上升记正。", "下降记负。", `是 -${drop}℃。`]);
      }
    ]),
    "g6-ratio": rotatingSeries("g6-ratio", 18, [
      (n, id) => {
        const part = 2 + (n % 4);
        const other = 3 + (n % 5);
        const total = 30 + (n % 10) * (part + other);
        const each = total / (part + other);
        const first = each * part;
        return mathBalanceSeed(id, `把 ${total} 按 ${part}∶${other} 分配，较小的一份（占 ${part} 份）是多少？`, Number.isInteger(each) ? first : each * part, "按比例分配", `总份数 ${part + other}，每份 ${total} ÷ ${part + other} = ${each}，${part} 份是 ${first}。`, [`总份数 ${part} + ${other} = ${part + other}。`, `每份 ${total} ÷ ${part + other} = ${each}。`, `${part} 份是 ${first}。`]);
      },
      (n, id) => {
        const a = 2 + (n % 6);
        const b = a * (2 + (n % 4));
        return mathBalanceSeed(id, `化简比 ${a}∶${b} 的后项与前项的商是多少（即 ${b} ÷ ${a}）？`, b / a, "比的化简", `${a}∶${b} 中 ${b} ÷ ${a} = ${b / a}。`, ["找前项后项。", `${b} ÷ ${a}。`, `是 ${b / a}。`]);
      }
    ]),
    "g6-equation": rotatingSeries("g6-equation", 16, [
      (n, id) => {
        const x = 3 + (n % 12);
        const b = 2 + (n % 9);
        const result = x + b;
        return mathBalanceSeed(id, `解方程：x + ${b} = ${result}，x = ?`, x, "一步方程", `两边同时减 ${b}，x = ${result} - ${b} = ${x}。`, [`x + ${b} = ${result}。`, `两边减 ${b}。`, `x = ${x}。`]);
      },
      (n, id) => {
        const x = 2 + (n % 9);
        const a = 2 + (n % 6);
        const result = a * x;
        return mathBalanceSeed(id, `解方程：${a}x = ${result}，x = ?`, x, "一步方程", `两边同时除以 ${a}，x = ${result} ÷ ${a} = ${x}。`, [`${a}x = ${result}。`, `两边除以 ${a}。`, `x = ${x}。`]);
      },
      (n, id) => {
        const x = 2 + (n % 8);
        const a = 2 + (n % 4);
        const b = 1 + (n % 7);
        const result = a * x + b;
        return mathBalanceSeed(id, `解方程：${a}x + ${b} = ${result}，x = ?`, x, "两步方程", `先两边减 ${b} 得 ${a}x = ${result - b}，再除以 ${a}，x = ${x}。`, [`两边减 ${b}：${a}x = ${result - b}。`, `两边除以 ${a}。`, `x = ${x}。`]);
      }
    ]),
    "g6-two-step": rotatingSeries("g6-two-step", 16, [
      (n, id) => {
        const base = 40 + (n % 40);
        const answer = (base * (1 - 0.25)).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `${base} 的 (1 - 25%) 是多少？`, answer, "分百比两步计算", `先算 1 - 25% = 75%，再求 ${base} × 75% = ${answer}。`, ["先算括号 1 - 25% = 75%。", `再求 ${base} × 75%。`, `是 ${answer}。`]);
      },
      (n, id) => {
        const whole = 60 + (n % 60);
        const answer = (whole * 2 / 3).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `${whole} 的 2/3 是多少？`, answer, "分数两步", `${whole} × 2/3 = ${answer}。`, ["求几分之几用乘法。", `${whole} × 2 ÷ 3。`, `是 ${answer}。`]);
      }
    ]),
    "g6-vertical": rotatingSeries("g6-vertical", 16, [
      (n, id) => {
        const a = (100 + n * 7) / 100;
        const b = (50 + n * 3) / 100;
        const answer = (a + b).toFixed(2);
        return mathBalanceSeed(id, `${a.toFixed(2)} + ${b.toFixed(2)} = ?`, answer, "小数竖式加法", `小数点对齐相加，结果 ${answer}。`, ["小数点对齐。", "按整数加法算。", `是 ${answer}。`]);
      },
      (n, id) => {
        const a = (400 + n * 11) / 100;
        const b = (120 + n * 5) / 100;
        const answer = (a - b).toFixed(2);
        return mathBalanceSeed(id, `${a.toFixed(2)} - ${b.toFixed(2)} = ?`, answer, "小数竖式减法", `小数点对齐相减，结果 ${answer}。`, ["小数点对齐。", "按整数减法算。", `是 ${answer}。`]);
      }
    ]),
    "g6-reading": rotatingSeries("g6-reading", 12, [
      (n, id) => {
        const total = 200 + (n % 8) * 50;
        const percent = 20 + (n % 4) * 5;
        const answer = total * percent / 100;
        return mathBalanceSeed(id, `材料：六年级共 ${total} 人，其中参加科技社团的占 ${percent}%，另有一些同学参加合唱（人数未知）。问参加科技社团的有多少人？`, answer, "读题筛选条件", `合唱人数是干扰信息，只用总人数和百分数：${total} × ${percent}% = ${answer}。`, ["先看问题问科技社团。", "合唱人数与问题无关，排除。", `${total} × ${percent}% = ${answer}。`]);
      },
      (n, id) => {
        const a = 3 + (n % 5);
        const b = 2 + (n % 4);
        const speed = 60;
        const time = a + b;
        const answer = speed * time;
        return mathBalanceSeed(id, `材料：一辆车每小时行 ${speed} 千米，上午行 ${a} 小时，下午行 ${b} 小时，途中还休息了 1 小时。问一共行驶多少千米？`, answer, "读题排除干扰", `休息时间不行驶，是干扰条件。总行驶时间 ${a} + ${b} = ${time} 小时，路程 ${speed} × ${time} = ${answer}。`, ["休息时间不计入行驶。", `行驶 ${time} 小时。`, `${speed} × ${time} = ${answer} 千米。`]);
      }
    ]),
    "g6-appendix": rotatingSeries("g6-appendix", 12, [
      (n, id) => {
        const salt = 10 + (n % 10);
        const water = 90 + (n % 30);
        const answer = (salt / (salt + water) * 100).toFixed(1);
        return mathBalanceSeed(id, `盐 ${salt} 克溶于水 ${water} 克，盐水的含盐率约是百分之几？`, answer, "浓度问题", `含盐率 = 盐 ÷ 盐水总量 × 100% = ${salt} ÷ ${salt + water} × 100% ≈ ${answer}%。`, [`盐水总量 ${salt} + ${water} = ${salt + water} 克。`, `盐占 ${salt} 克。`, `含盐率约 ${answer}%。`]);
      },
      (n, id) => {
        const speedA = 50 + (n % 20);
        const speedB = 40 + (n % 15);
        const time = 2 + (n % 4);
        const answer = (speedA + speedB) * time;
        return mathBalanceSeed(id, `甲乙两车从两地相向而行，甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，${time} 小时相遇，两地相距多少千米？`, answer, "相遇问题", `相遇路程 = 速度和 × 时间 = (${speedA} + ${speedB}) × ${time} = ${answer}。`, [`速度和 ${speedA} + ${speedB} = ${speedA + speedB}。`, `乘时间 ${time}。`, `相距 ${answer} 千米。`]);
      }
    ]),
    // 六年级 upper 侧同步补量（圆、分数百分数综合），维持上下册平衡。
    "g6-circle": rotatingSeries("g6-circle", 26, [
      (n, id) => {
        const radius = 2 + (n % 8);
        const answer = (2 * 3.14 * radius).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `圆的半径是 ${radius} cm，周长约多少厘米？（π取3.14）`, answer, "圆的周长", `周长 = 2πr = 2 × 3.14 × ${radius} = ${answer}。`, ["周长公式 C = 2πr。", `代入 r = ${radius}。`, `约 ${answer} 厘米。`]);
      },
      (n, id) => {
        const radius = 2 + (n % 8);
        const answer = (3.14 * radius * radius).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `圆的半径是 ${radius} cm，面积约多少平方厘米？（π取3.14）`, answer, "圆的面积", `面积 = πr² = 3.14 × ${radius}² = ${answer}。`, ["面积公式 S = πr²。", `代入 r = ${radius}。`, `约 ${answer} 平方厘米。`]);
      },
      (n, id) => {
        const diameter = 4 + (n % 10);
        const answer = (3.14 * diameter).toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `圆的直径是 ${diameter} cm，周长约多少厘米？（π取3.14）`, answer, "圆的周长-直径", `周长 = πd = 3.14 × ${diameter} = ${answer}。`, ["周长公式 C = πd。", `代入 d = ${diameter}。`, `约 ${answer} 厘米。`]);
      }
    ]),
    "g6-fraction-percent": rotatingSeries("g6-fraction-percent", 26, [
      (n, id) => {
        const denominator = 4 + (n % 6);
        const numerator = 1 + (n % (denominator - 1 || 1));
        const answer = Math.round(numerator / denominator * 100);
        return mathBalanceSeed(id, `把分数 ${numerator}/${denominator} 化成百分数约是百分之几？（保留整数）`, answer, "分数化百分数", `${numerator} ÷ ${denominator} ≈ ${(numerator / denominator).toFixed(2)}，约 ${answer}%。`, [`分数化小数：${numerator} ÷ ${denominator}。`, "小数乘 100 变百分数。", `约 ${answer}%。`]);
      },
      (n, id) => {
        const percent = 20 + (n % 6) * 5;
        const value = percent / 100;
        const answer = value.toFixed(2).replace(/\.?0+$/, "");
        return mathBalanceSeed(id, `${percent}% 写成小数是多少？`, answer, "百分数化小数", `${percent}% = ${percent} ÷ 100 = ${answer}。`, ["百分数去掉 % 除以 100。", `${percent} ÷ 100。`, `是 ${answer}。`]);
      },
      (n, id) => {
        const whole = 40 + (n % 8) * 10;
        const percent = 25 + (n % 4) * 5;
        const answer = whole * percent / 100;
        return mathBalanceSeed(id, `${whole} 的 ${percent}% 是多少？`, answer, "求百分之几", `${whole} × ${percent}% = ${answer}。`, ["求百分之几用乘法。", `${whole} × ${percent}%。`, `是 ${answer}。`]);
      }
    ])
  };

  // ------------------------------------------------------------------
  // 语文 / 英语 / 科学题库扩充（2026 全量优化）
  // 语文：为高年级补句子、标点、字词题型；英语：补五六年级阅读与词汇；
  // 科学：加深实验设计、数据证据、步骤排序等探究题型。
  // 均为选择题原创题，答案唯一、含解析与步骤，走 external 题源合并去重。
  // ------------------------------------------------------------------
  function subjectChoiceSeed(id, prompt, correct, wrongs, questionType, explanation, steps, meta) {
    return {
      id,
      answerType: "choice",
      prompt,
      correct,
      wrongs,
      explanation,
      steps,
      questionType,
      sourceMeta: meta || SOURCE.inspired
    };
  }
  function choiceSeries(pointId, templates) {
    return templates.map((template, index) => template(`${pointId}-sx-${index + 1}`));
  }

  const SUBJECT_EXPANSION_BANK = {
    // ---------- 英语五年级：阅读与词汇 ----------
    "e5-reading-schedule": choiceSeries("e5-reading-schedule", [
      (id) => subjectChoiceSeed(id, "Read the timetable. Monday: Music; Tuesday: PE; Wednesday: Art. What lesson do they have on Tuesday?", "PE", ["Music", "Art", "Maths"], "日程阅读", "The timetable shows Tuesday is PE.", ["Find Tuesday in the timetable.", "Read the lesson next to it.", "Choose PE."], SOURCE.eolPattern),
      (id) => subjectChoiceSeed(id, "Read the notice. Library open time: 8:00 a.m. to 5:00 p.m. When does the library close?", "At 5:00 p.m.", ["At 8:00 a.m.", "At 12:00 p.m.", "At 9:00 p.m."], "信息定位", "The notice says the library closes at 5:00 p.m.", ["Find the word close time.", "Read 5:00 p.m.", "Choose At 5:00 p.m."], SOURCE.eolPattern),
      (id) => subjectChoiceSeed(id, "Read: Lily gets up at 6:30 and goes to school at 7:20. What does she do at 6:30?", "She gets up.", ["She goes to school.", "She has lunch.", "She goes to bed."], "细节理解", "The sentence says Lily gets up at 6:30.", ["Find 6:30 in the sentence.", "Read the action.", "Choose She gets up."], SOURCE.zxxkPattern),
      (id) => subjectChoiceSeed(id, "Read: On Sundays Tom often plays football with his friends in the park. Where does Tom play football?", "In the park.", ["At school.", "In the shop.", "At home."], "阅读定位", "The sentence says in the park.", ["Find the place word.", "It is the park.", "Choose In the park."], SOURCE.zxxkPattern)
    ]),
    "e5-vocabulary-week-season": choiceSeries("e5-vocabulary-week-season", [
      (id) => subjectChoiceSeed(id, "Choose the word that means 春天.", "spring", ["winter", "autumn", "summer"], "词义匹配", "spring 的意思是春天。", ["Recall the four seasons.", "Match 春天.", "Choose spring."], SOURCE.pep),
      (id) => subjectChoiceSeed(id, "Which day comes right after Monday?", "Tuesday", ["Sunday", "Friday", "Thursday"], "星期顺序", "Monday 之后是 Tuesday。", ["Say the days in order.", "After Monday is Tuesday.", "Choose Tuesday."], SOURCE.pep)
    ]),
    // ---------- 英语六年级：阅读与语法 ----------
    "e6-reading-story": choiceSeries("e6-reading-story", [
      (id) => subjectChoiceSeed(id, "Read: Last weekend Ben visited his grandma and helped her water the flowers. What did Ben do last weekend?", "He visited his grandma.", ["He went to school.", "He watched a film.", "He played computer games."], "记叙文理解", "The passage says Ben visited his grandma.", ["Find the time words last weekend.", "Read what Ben did.", "Choose He visited his grandma."], SOURCE.zxxkPattern),
      (id) => subjectChoiceSeed(id, "Read: The Great Wall is very long and many people visit it every year. What is the passage about?", "The Great Wall.", ["A small river.", "A new school.", "A birthday party."], "主旨理解", "The passage talks about the Great Wall.", ["Find the repeated topic.", "It is the Great Wall.", "Choose The Great Wall."], SOURCE.eolPattern),
      (id) => subjectChoiceSeed(id, "Read: Amy was ill yesterday, so she stayed at home and read books. Why did Amy stay at home?", "Because she was ill.", ["Because it was sunny.", "Because she had a party.", "Because school was closed."], "因果推断", "The passage says Amy was ill, so she stayed home.", ["Find the reason word so.", "Read Amy was ill.", "Choose Because she was ill."], SOURCE.zxxkPattern),
      (id) => subjectChoiceSeed(id, "Read the plan. This weekend: Saturday go hiking; Sunday clean the room. What will they do on Sunday?", "Clean the room.", ["Go hiking.", "Go swimming.", "Watch TV."], "计划阅读", "The plan says Sunday clean the room.", ["Find Sunday in the plan.", "Read the activity.", "Choose Clean the room."], SOURCE.eolPattern)
    ]),
    "e6-vocabulary-travel-feeling": choiceSeries("e6-vocabulary-travel-feeling", [
      (id) => subjectChoiceSeed(id, "Choose the word that means 高兴的.", "happy", ["angry", "tired", "hungry"], "情感词义", "happy 的意思是高兴的。", ["Recall feeling words.", "Match 高兴的.", "Choose happy."], SOURCE.pep),
      (id) => subjectChoiceSeed(id, "We travel by ___ when we want to fly in the sky.", "plane", ["bike", "ship", "bus"], "交通词汇", "在天上飞用 plane（飞机）。", ["Think about flying in the sky.", "Match the vehicle.", "Choose plane."], SOURCE.pep)
    ]),
    // ---------- 科学：实验设计 / 数据证据 / 步骤排序（year 桶，不影响上下册平衡） ----------
    "s5-inquiry-data-evidence": choiceSeries("s5-inquiry-data-evidence", [
      (id) => subjectChoiceSeed(id, "测量同一片树叶长度，三次分别是 8.1 cm、8.0 cm、8.2 cm。最合理的记录方式是什么？", "三次都记录，取接近的值作为结果", ["只记最大的一次", "把三次都改成 8.1", "随便写一个数"], "数据处理", "多次测量取相近值能减少误差，数据要真实记录。", ["先如实记录三次。", "比较是否接近。", "取相近值作为结果。"], SOURCE.shijuanPattern),
      (id) => subjectChoiceSeed(id, "研究阳光对绿豆发芽的影响时，下面哪一组是需要控制相同的条件？", "水量、温度、种子数量", ["阳光的有无", "只改变实验目的", "换成不同的植物"], "变量控制", "只改变阳光，其他条件都要保持相同。", ["确定研究的是阳光。", "阳光是要改变的量。", "其他条件保持相同。"], SOURCE.jyeooPattern),
      (id) => subjectChoiceSeed(id, "下面哪种做法最能保证实验结论可靠？", "多次重复实验并记录数据", ["只做一次就下结论", "凭感觉猜结果", "只保留想要的数据"], "证据意识", "重复实验并用数据支撑结论更可靠。", ["一次实验有偶然性。", "多次重复更稳定。", "结论要基于数据。"], SOURCE.edupScience)
    ]),
    "s6-inquiry-model-reasoning": choiceSeries("s6-inquiry-model-reasoning", [
      (id) => subjectChoiceSeed(id, "用手电筒和地球仪演示昼夜时，手电筒最适合代表什么？", "太阳", ["月球", "云", "海洋"], "模型对应", "手电筒发光，代表能发光的太阳。", ["找模型里发光的物体。", "对应能发光的天体。", "选太阳。"], SOURCE.zhejiangEdu),
      (id) => subjectChoiceSeed(id, "把制作小车的过程排序：①画设计图 ②测试改进 ③组装小车。合理顺序是？", "①③②", ["②①③", "③②①", "②③①"], "步骤排序", "工程一般先设计、再组装、最后测试改进。", ["先画设计图。", "再组装小车。", "最后测试改进。"], SOURCE.moeCurriculum),
      (id) => subjectChoiceSeed(id, "记录一周气温后画折线图，折线图最适合表示什么？", "气温随时间的变化趋势", ["各地面积大小", "物体的颜色", "同学的名字"], "数据表达", "折线图适合表示数量随时间的变化。", ["折线图看趋势。", "横轴是时间。", "选气温变化趋势。"], SOURCE.smartEdu)
    ]),
    "s5-matter-dissolve": choiceSeries("s5-matter-dissolve", [
      (id) => subjectChoiceSeed(id, "要加快食盐在水中的溶解，下面哪种做法有效？", "用筷子搅拌", ["把水静置不动", "把盐结成大块", "把水温降到最低"], "溶解影响因素", "搅拌能加快溶解，此外提高水温、把盐弄碎也可以。", ["回忆影响溶解快慢的因素。", "搅拌能加快溶解。", "选用筷子搅拌。"], SOURCE.edupScience)
    ]),
    // ---------- 语文五六年级：句子、字词（year 桶） ----------
    "c5-context-word": choiceSeries("c5-context-word", [
      (id) => subjectChoiceSeed(id, "联系句子选词填空：夜深了，山村显得格外( )。", "宁静", ["热闹", "拥挤", "喧哗"], "语境选词", "夜深山村应是安静的，选“宁静”。", ["先读句子的情境。", "夜深应安静。", "选“宁静”。"], SOURCE.zxxkPattern),
      (id) => subjectChoiceSeed(id, "下面哪一组是一对近义词？", "美丽——漂亮", ["高兴——伤心", "白天——黑夜", "前进——后退"], "近义词", "“美丽”和“漂亮”意思相近，是近义词。", ["回忆近义词的含义。", "比较四组词。", "选意思相近的一组。"], SOURCE.pep)
    ]),
    "c6-language-basic": choiceSeries("c6-language-basic", [
      (id) => subjectChoiceSeed(id, "给句子加标点：他问我明天去不去图书馆( )正确的一项是？", "问号", ["句号", "感叹号", "逗号"], "标点运用", "这是一个疑问句，句末用问号。", ["判断句子语气。", "疑问句用问号。", "选“问号”。"], SOURCE.smartEdu),
      (id) => subjectChoiceSeed(id, "下面哪个句子没有语病？", "我们要养成认真读书的好习惯。", ["我们要养成认真读书。", "因为下雨，所以我们都很高兴地淋湿了。", "他大约五岁左右。"], "病句辨析", "A 句成分完整、表达通顺，没有语病。", ["逐句检查成分与逻辑。", "排除搭配不当、重复的句子。", "选表达通顺的一句。"], SOURCE.cnjyPattern),
      (id) => subjectChoiceSeed(id, "把下面词语补充完整：( )钉截铁。", "斩", ["崭", "暂", "占"], "字词积累", "成语是“斩钉截铁”，应填“斩”。", ["回忆成语“斩钉截铁”。", "确认第一个字。", "选“斩”。"], SOURCE.pep)
    ])
  };

  function normalizedContent(value) {
    return String(value === undefined || value === null ? "" : value)
      .replace(/\r\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (!value || typeof value !== "object") return value;
    return Object.keys(value).sort().reduce((result, key) => {
      result[key] = stableValue(value[key]);
      return result;
    }, {});
  }

  function seedContentKey(seed) {
    const item = seed || {};
    return JSON.stringify(stableValue({
      prompt: normalizedContent(item.prompt || item.text || item.title),
      answer: normalizedContent(item.answer !== undefined ? item.answer : item.correct),
      answerType: item.answerType || (item.correct !== undefined ? "choice" : "text"),
      wrongs: compactList(item.wrongs || item.options || []).slice().sort(),
      diagram: item.diagram || null,
      sourceImage: item.sourceImage || null
    }));
  }

  function uniqueSeeds(items) {
    const seen = new Set();
    return (items || []).filter((seed) => {
      const key = seedContentKey(seed);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  [
    window.MathCampGrade2ReferenceQuestionSeeds,
    window.MathCampGrade2OriginalQuestionSeeds,
    window.MathCampGrade3ReferenceQuestionSeeds,
    window.MathCampGrade3OriginalQuestionSeeds,
    window.MathCampGrade4ReferenceQuestionSeeds,
    window.MathCampGrade4OriginalQuestionSeeds,
    window.MathCampGrade5ReferenceQuestionSeeds,
    window.MathCampGrade5OriginalQuestionSeeds,
    window.MathCampGrade6ReferenceQuestionSeeds,
    window.MathCampGrade6OriginalQuestionSeeds
  ].forEach((module) => mergeSeedBank(module && module.BANK));
  mergeSeedBank(CURRICULUM_BALANCE_BANK);
  mergeSeedBank(MATH_EXPANSION_BANK);
  mergeSeedBank(SUBJECT_EXPANSION_BANK);

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
    return uniqueSeeds(BANK[String(point?.id || "")] || []);
  }

  function rawForPoint(point) {
    return (BANK[String(point?.id || "")] || []).slice();
  }

  function makeQuestion(deps, point, options = {}) {
    const list = forPoint(point);
    if (!list.length) return null;
    const pick = typeof deps?.pick === "function" ? deps.pick : (items) => items[0];
    const seed = pick(list) || list[0];
    return normalizeSeed(deps || {}, point, seed);
  }

  // 运行时按命名空间注册额外题源（如校内自定义题库）。
  // 同一命名空间可重复调用以覆盖上一次结果（增删批次后重算）。
  const extraSeedNamespaces = {};
  function rebuildExtraSeeds() {
    // 先移除所有已注册命名空间的旧题，再重新并入。
    Object.values(extraSeedNamespaces).forEach((byPoint) => {
      Object.entries(byPoint || {}).forEach(([pointId, items]) => {
        const list = BANK[pointId];
        if (!Array.isArray(list) || !Array.isArray(items) || !items.length) return;
        BANK[pointId] = list.filter((entry) => !items.includes(entry));
      });
    });
    Object.keys(extraSeedNamespaces).forEach((ns) => {
      mergeSeedBank(extraSeedNamespaces[ns]);
    });
  }
  function registerExtraSeeds(namespace, byPoint) {
    if (!namespace) return;
    // 撤销该命名空间旧题
    const previous = extraSeedNamespaces[namespace];
    if (previous) {
      Object.entries(previous).forEach(([pointId, items]) => {
        const list = BANK[pointId];
        if (Array.isArray(list) && Array.isArray(items)) {
          BANK[pointId] = list.filter((entry) => !items.includes(entry));
        }
      });
    }
    extraSeedNamespaces[namespace] = byPoint && typeof byPoint === "object" ? byPoint : {};
    mergeSeedBank(extraSeedNamespaces[namespace]);
  }

  window.MathCampExternalQuestionSeeds = {
    sources: SOURCE,
    forPoint,
    rawForPoint,
    seedContentKey,
    makeQuestion,
    registerExtraSeeds,
    rebuildExtraSeeds,
    BANK
  };
})();
