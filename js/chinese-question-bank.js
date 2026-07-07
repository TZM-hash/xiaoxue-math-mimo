(function () {
  "use strict";

  const grades = [1, 2, 3, 4, 5, 6];
  const gradeNames = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
  const causes = ["不会做", "字词基础", "阅读理解", "表达规范"];
  const curriculumData = window.MathCampChineseCurriculumData || {};
  const autoSourcePolicy = curriculumData.autoSourcePolicy || { mode: "textbookOnly", sources: ["inTextbook"] };
  const sourceLabels = curriculumData.sourceLabels || {
    abilityLine: "能力线",
    inTextbook: "课内教材",
    recommendedReading: "推荐读物",
    extraOriginal: "原创拓展"
  };
  const causeTagsByTopic = {
    pinyin: ["字词基础", "不会做", "表达规范"],
    character: ["字词基础", "不会做", "表达规范"],
    word: ["字词基础", "阅读理解", "不会做"],
    sentence: ["表达规范", "字词基础", "不会做"],
    punctuation: ["表达规范", "阅读理解", "不会做"],
    reading: ["阅读理解", "不会做", "字词基础"],
    poem: ["阅读理解", "字词基础", "不会做"],
    writing: ["表达规范", "阅读理解", "不会做"]
  };
  const curriculumProfile = curriculumData.curriculumProfile || {
    id: "hangzhou-unified-primary-chinese",
    region: "浙江省杭州市",
    textbook: "小学语文（统编版单元能力线）",
    publisher: "人民教育出版社出版",
    sourceNote: "按杭州小学常用统编版语文一至六年级单元顺序和语文课程标准组织，题目材料使用原创文本。",
    rolloutNote: "后续教材微调时替换单元映射，题目 ID 与练习记录继续沿用。"
  };
  const gradeCurriculum = {
    1: { focus: ["拼音", "识字写字", "短文阅读", "看图说话"] },
    2: { focus: ["字音字形", "句子训练", "短文阅读", "看图写话"] },
    3: { focus: ["词句段运用", "段落阅读", "习作片段", "古诗理解"] },
    4: { focus: ["病句修改", "现代文阅读", "资料提取", "习作审题"] },
    5: { focus: ["语境词语", "篇章结构", "整本书阅读", "文言启蒙"] },
    6: { focus: ["语基综合", "阅读策略", "观点概括", "习作升格"] }
  };
  const rawPoints = [
    ["c1-pinyin", 1, "pinyin", "拼音认读与拼写", "拼音", "声母、韵母、整体认读和声调。"],
    ["c1-character", 1, "character", "识字写字入门", "识字", "常用字、笔画、偏旁和组词。"],
    ["c1-word", 1, "word", "词语积累", "词语", "量词、反义词、近义词和词语搭配。"],
    ["c1-sentence", 1, "sentence", "句子入门", "句子", "把话说完整，照样子写句子。"],
    ["c1-reading", 1, "reading", "短文阅读启蒙", "阅读", "找人物、时间、地点和简单信息。"],
    ["c1-poem", 1, "poem", "古诗积累", "古诗", "背诵、画面和常见词语理解。"],
    ["c1-picture", 1, "writing", "看图说话", "看图", "看清谁在哪里做什么。"],
    ["c1-expression", 1, "writing", "口语表达", "表达", "用完整句表达请求、感谢和介绍。"],
    ["c2-sound-shape", 2, "character", "字音字形", "音形", "多音字、形近字和易错字。"],
    ["c2-word-match", 2, "word", "词语搭配", "搭配", "动词、量词、形容词搭配。"],
    ["c2-sentence", 2, "sentence", "句子训练", "句子", "扩句、仿写和把句子写通顺。"],
    ["c2-punctuation", 2, "punctuation", "标点与语气", "标点", "句号、问号、感叹号和语气词。"],
    ["c2-reading", 2, "reading", "短文阅读", "阅读", "按短文内容判断、找原因和结果。"],
    ["c2-poem", 2, "poem", "古诗积累", "古诗", "诗句背诵、景物和情感。"],
    ["c2-picture-writing", 2, "writing", "看图写话", "写话", "按顺序写清人物、地点、事情。"],
    ["c2-usage", 2, "sentence", "综合语用", "语用", "留言、通知、礼貌表达。"],
    ["c3-word-meaning", 3, "word", "字词辨析", "辨析", "联系语境理解词义。"],
    ["c3-sentence-transform", 3, "sentence", "句式转换", "句式", "把字句、被字句、反问句入门。"],
    ["c3-rhetoric", 3, "sentence", "修辞初步", "修辞", "比喻、拟人和排比初步。"],
    ["c3-paragraph-reading", 3, "reading", "段落阅读", "段落", "概括自然段意思，找中心句。"],
    ["c3-writing-piece", 3, "writing", "习作片段", "片段", "围绕一个意思写几句话。"],
    ["c3-poem", 3, "poem", "古诗理解", "古诗", "理解诗句画面和关键词。"],
    ["c3-accumulation", 3, "word", "课内外积累", "积累", "成语、日积月累和名句运用。"],
    ["c3-practice", 3, "writing", "综合实践表达", "实践", "观察、记录和简短表达。"],
    ["c4-word-sentence", 4, "word", "词句段运用", "词句段", "词语语境、句段衔接和表达效果。"],
    ["c4-sick-sentence", 4, "sentence", "病句修改", "病句", "成分残缺、搭配不当和语序问题。"],
    ["c4-rhetoric-punctuation", 4, "punctuation", "修辞与标点", "修辞标点", "体会表达效果，正确使用常见标点。"],
    ["c4-modern-reading", 4, "reading", "现代文阅读", "现代文", "提取信息、理解原因和体会情感。"],
    ["c4-writing-topic", 4, "writing", "习作审题", "审题", "看清题目要求，选择合适材料。"],
    ["c4-poem-classic", 4, "poem", "古诗文积累", "古诗文", "诗意、关键词和传统文化常识。"],
    ["c4-info-reading", 4, "reading", "资料提取", "资料", "从表格、说明和材料中提取信息。"],
    ["c4-usage", 4, "writing", "综合语用", "语用", "通知、建议、口语交际和简短应用文。"],
    ["c5-context-word", 5, "word", "语境词语", "语境", "辨析词义、感情色彩和表达效果。"],
    ["c5-paragraph-structure", 5, "reading", "句段篇章", "篇章", "段落关系、过渡句和篇章结构。"],
    ["c5-reading", 5, "reading", "阅读理解", "阅读", "概括内容、体会人物和理解表达方法。"],
    ["c5-expository-reading", 5, "reading", "说明与叙事阅读", "说明叙事", "读懂说明对象、事件顺序和方法。"],
    ["c5-writing-structure", 5, "writing", "习作结构", "结构", "开头、重点段和结尾安排。"],
    ["c5-classic", 5, "poem", "古诗文与文言启蒙", "古文", "常见文言词、诗意和情感。"],
    ["c5-book-reading", 5, "reading", "整本书阅读", "整本书", "人物、情节和阅读感受。"],
    ["c5-integrated", 5, "writing", "综合运用", "综合", "材料阅读、观点表达和应用文。"],
    ["c6-language-basic", 6, "word", "语基综合", "语基", "字词句标点综合复习。"],
    ["c6-reading-strategy", 6, "reading", "阅读策略", "策略", "浏览、定位、概括和批注。"],
    ["c6-view-summary", 6, "reading", "观点概括", "观点", "抓观点、找依据、概括表达。"],
    ["c6-writing-upgrade", 6, "writing", "习作升格", "升格", "围绕中心选材，写具体有条理。"],
    ["c6-classic", 6, "poem", "古诗文言", "古文", "古诗文理解、词句解释和情感。"],
    ["c6-transition", 6, "reading", "小升初综合", "综合", "语基、阅读和表达综合训练。"],
    ["c6-famous-book", 6, "reading", "名著阅读", "名著", "人物形象、情节和主题。"],
    ["c6-expression", 6, "writing", "综合表达", "表达", "观点、建议、演讲和应用文表达。"]
  ];
  const textbookKnowledge = {
    1: [
      ["pinyin-initial-final", "pinyin", "声母韵母认读", "拼音", "认清声母、韵母和整体认读音节。", "拼音基础", "材料：看到音节“mā”，先分清声母 m、韵母 a 和第一声。", "声母、韵母和声调", ["偏旁部首", "句子扩写", "阅读中心句"], ["声母", "韵母", "声调"]],
      ["pinyin-tone", "pinyin", "四声与标调", "声调", "能读准一二三四声，知道声调不同意思可能不同。", "拼音基础", "材料：“mā、má、mǎ、mà”读音高低变化不同。", "声调不同，读音和意思会变化", ["量词搭配要准确", "句子要写完整", "自然段要找中心句"], ["四声", "标调", "读准"]],
      ["syllable-spelling", "pinyin", "音节拼读规则", "拼读", "练习两拼、三拼和整体认读音节。", "拼音进阶", "材料：“花”读 huā，要把 h、u、ā 连起来拼读。", "按声母韵母顺序拼读音节", ["按时间顺序写活动", "概括人物特点", "判断修辞方法"], ["两拼", "三拼", "整体认读"]],
      ["common-characters", "character", "常用字认读", "识字", "认识常用汉字，能结合词语理解字义。", "识字写字", "材料：“日、月、山、水”常和自然事物有关。", "结合词语和事物认读汉字", ["整本书人物评价", "说明文方法", "议论文观点"], ["认读", "组词", "字义"]],
      ["stroke-order", "character", "笔画笔顺", "笔顺", "知道先横后竖、先撇后捺等基本书写规则。", "识字写字", "材料：写“十”先写横，再写竖，笔顺清楚字才端正。", "按正确笔顺书写汉字", ["找文章中心", "引用材料观点", "比较人物形象"], ["笔画", "笔顺", "书写"]],
      ["radical-structure", "character", "偏旁和结构", "偏旁", "认识常见偏旁，初步判断左右、上下等结构。", "识字写字", "材料：“明”左边是日，右边是月，两个部分合成一个字。", "看偏旁和结构识字", ["看封面猜内容", "用数字说明事物", "写议论理由"], ["偏旁", "结构", "左右"]],
      ["quantifier-basic", "word", "量词搭配", "量词", "会说一朵花、一只鸟、一本书等常见搭配。", "词语积累", "材料：花通常说“一朵”，书通常说“一本”。", "量词要和事物搭配", ["按声调标音", "三角形内角和", "人物语言描写"], ["量词", "搭配", "词语"]],
      ["complete-sentence", "sentence", "完整句表达", "句子", "句子要说清谁、在哪里、做什么。", "句子入门", "材料：“小鸟在树上唱歌”说清了人物、地点和动作。", "完整句要有清楚的人物和动作", ["只写一个词就算句子", "只看拼音不看字形", "只背诗题不懂画面"], ["谁", "在哪里", "做什么"]],
      ["picture-speaking", "writing", "看图说话要素", "看图", "观察人物、地点、动作，用完整句表达。", "表达运用", "材料：图中小朋友在操场跳绳，表达时要说清人物和事情。", "看清人物、地点和事情", ["只判断标点", "只数自然段", "只比较反义词"], ["人物", "地点", "动作"]],
      ["short-reading-info", "reading", "短文信息提取", "阅读", "读短文找人物、时间、地点和事情。", "短文阅读", "材料：短文说“小兔把萝卜送给奶奶”，题目问小兔做了什么。", "回到短文找人物动作", ["按笔顺写字", "选择礼貌用语", "标出拼音声调"], ["人物", "时间", "地点", "事情"]]
    ],
    2: [
      ["sound-shape", "character", "字音字形辨析", "音形", "辨析形近字、同音字和易错字。", "识字写字", "材料：“晴”和太阳有关，“清”和水有关。", "根据偏旁和语境辨析字形", ["只看字长短", "只看标点", "只看作者"], ["形近字", "同音字", "偏旁"]],
      ["polyphone", "character", "多音字入门", "多音字", "能在词语中判断常见多音字读音。", "识字写字", "材料：“长大”和“长短”里的“长”读音不同。", "联系词语意思判断读音", ["按颜色分类", "只背课文标题", "看插图猜答案"], ["多音字", "词语", "语境"]],
      ["word-collocation", "word", "词语搭配", "搭配", "积累动词、形容词和名词的恰当搭配。", "词语积累", "材料：“灿烂的阳光”“认真地写字”搭配自然。", "词语要搭配恰当", ["拼音只看声母", "句末都用句号", "段落不用中心"], ["动词", "形容词", "搭配"]],
      ["synonym-antonym", "word", "近义词反义词", "词义", "理解常见近义词、反义词并联系语境使用。", "词语积累", "材料：“高兴”和“快乐”意思接近，“高”和“矮”意思相反。", "根据意思判断近义或反义关系", ["只看字数", "只看书名", "只看页码"], ["近义词", "反义词", "语境"]],
      ["sentence-expansion", "sentence", "扩句与仿写", "扩句", "在句子中补充时间、地点、样子等信息。", "句子训练", "材料：“花开了”可以扩成“公园里的桃花慢慢开了”。", "扩句要具体且通顺", ["随便调乱语序", "只写拼音不写字", "只选最长选项"], ["扩句", "仿写", "通顺"]],
      ["punctuation-tone", "punctuation", "句号问号感叹号", "标点", "根据语气选择句末标点。", "标点与语气", "材料：“你今天去图书馆吗”是在提问。", "疑问语气用问号", ["所有句子都用逗号", "只看第一个字", "不用读语气"], ["句号", "问号", "感叹号"]],
      ["sequence-reading", "reading", "顺序词阅读", "顺序", "抓住先、再、然后、最后理解事情顺序。", "短文阅读", "材料：小雨先写作业，再收拾书包。", "抓顺序词判断先后", ["只看人物名字", "只看标点数量", "只看字形结构"], ["先", "再", "然后", "最后"]],
      ["cause-effect", "reading", "原因结果阅读", "因果", "找出因为、所以等提示，理解原因和结果。", "短文阅读", "材料：因为下雨，大家把活动改到教室里。", "根据因果词找原因和结果", ["按笔顺写字", "选择量词", "判断声调"], ["因为", "所以", "结果"]],
      ["message-note", "sentence", "留言条要素", "语用", "留言条要写清对象、事情、署名和时间。", "综合语用", "材料：给妈妈留言，要说明自己去了哪里、什么时候回来。", "应用文要素要清楚", ["只写一个感叹号", "只写天气", "只写颜色"], ["对象", "事情", "署名", "时间"]],
      ["picture-writing-order", "writing", "看图写话顺序", "写话", "按画面顺序写清人物、地点和事情。", "表达运用", "材料：图中先浇水，再扶正小树，最后整理工具。", "按顺序写清画面内容", ["只写一个词", "不看人物动作", "只判断拼音"], ["顺序", "画面", "动作"]]
    ],
    3: [
      ["context-word", "word", "联系语境理解词语", "语境", "根据上下文理解词语意思。", "词句段运用", "材料：他听得很认真，还把重点记在本子上。", "联系上下文理解“认真”", ["只看偏旁", "只看页码", "只看插图颜色"], ["语境", "词义", "上下文"]],
      ["sentence-transform", "sentence", "把字句和被字句", "句式", "理解施事和受事，正确转换句式。", "句子训练", "材料：小明把书放进书包。", "被字句要把“书”放到前面", ["把人物和事物颠倒", "只加标点不改句式", "只找近义词"], ["把字句", "被字句", "施事受事"]],
      ["rhetoric-basic", "sentence", "比喻拟人初步", "修辞", "识别比喻、拟人等常见修辞。", "词句段运用", "材料：弯弯的月亮像小船。", "用“像”把月亮比作小船是比喻", ["句末问号", "偏旁结构", "留言格式"], ["比喻", "拟人", "排比"]],
      ["paragraph-main", "reading", "概括自然段意思", "段落", "抓中心句和关键词概括段意。", "段落阅读", "材料：一段话围绕“公园真美”写花、树和小湖。", "概括为“公园真美”", ["只抓一个细节", "只看第一个字", "只看作者"], ["段意", "中心句", "关键词"]],
      ["reading-detail", "reading", "细节定位", "定位", "回到短文找到人物、动作和原因。", "阅读理解", "材料：短文写小鹿把水让给了口渴的小伙伴。", "根据原文定位人物和动作", ["不读材料直接猜", "只选最长答案", "只看标题"], ["定位", "人物", "动作"]],
      ["poem-image", "poem", "古诗画面理解", "古诗", "抓诗句关键词想象画面。", "古诗理解", "材料：“遥知不是雪，为有暗香来”写到香气和洁白。", "结合关键词判断梅花画面", ["只数诗句字数", "只看标点", "只看作者名字"], ["关键词", "画面", "情感"]],
      ["idiom-meaning", "word", "成语意思理解", "成语", "联系故事理解成语寓意。", "积累运用", "材料：羊丢了以后及时修补羊圈。", "出了问题及时补救还不晚", ["羊越多越好", "门不用修", "只要跑得快"], ["成语", "寓意", "故事"]],
      ["observation-record", "writing", "观察记录", "观察", "记录事物变化要具体、有顺序。", "习作片段", "材料：豆芽第一天露白，第三天长出细根。", "观察记录要写清变化", ["只写很好很好", "不写时间", "只抄题目"], ["观察", "变化", "顺序"]],
      ["around-one-idea", "writing", "围绕一个意思写", "片段", "几句话都要服务同一个中心意思。", "习作片段", "材料：围绕“操场真热闹”写跳绳、跑步和踢球。", "细节要围绕中心意思", ["写无关天气", "只写一个字", "随便换主题"], ["中心", "具体", "片段"]],
      ["practical-expression", "writing", "综合实践表达", "实践", "把观察、记录、交流整理成清楚表达。", "综合实践", "材料：介绍一次植物观察活动，要说清时间、发现和感受。", "表达要有信息和顺序", ["只写心情", "只画图案", "不说发现"], ["观察", "记录", "表达"]]
    ],
    4: [
      ["context-sentence", "word", "词句段运用", "词句段", "理解词语在句段中的表达效果。", "词句段运用", "材料：“终于”表示等了很久之后出现结果。", "联系句段理解词语作用", ["只看字形", "只看书名", "只看页码"], ["语境", "表达效果", "句段"]],
      ["sick-sentence", "sentence", "病句修改", "病句", "辨析成分残缺、搭配不当和语序不当。", "句子训练", "材料：“通过努力，使我进步了”缺少明确主语。", "删去“使”或补出主语", ["加一个问号", "换成拼音", "只改字体"], ["成分残缺", "搭配不当", "语序"]],
      ["punctuation-effect", "punctuation", "标点表达效果", "标点", "根据停顿、语气和提示选择标点。", "标点训练", "材料：人物说话后面接原话，常要用冒号和引号。", "标点要配合语气和格式", ["只用逗号", "不用读语气", "只看字数"], ["冒号", "引号", "问号"]],
      ["rhetoric-effect", "punctuation", "修辞表达效果", "修辞", "体会比喻、拟人、排比的表达作用。", "表达方法", "材料：花儿在风中点头，好像人在打招呼。", "把花当作人来写是拟人", ["形近字辨析", "留言条署名", "拼音标调"], ["比喻", "拟人", "排比"]],
      ["info-extraction", "reading", "资料提取", "资料", "从通知、表格、说明中提取关键信息。", "资料阅读", "材料：通知写周五下午三点在操场集合。", "集合地点是操场", ["只看第一行", "把时间当地点", "不读标题"], ["通知", "表格", "地点"]],
      ["character-quality", "reading", "人物特点概括", "人物", "根据人物言行概括品质。", "现代文阅读", "材料：妈妈冒雨送伞，一路担心孩子淋湿。", "人物行为体现关心孩子", ["只看人物名字", "只看天气", "只看段落长短"], ["言行", "品质", "概括"]],
      ["structure-order", "reading", "段落结构和顺序", "结构", "理解总分、并列、时间和地点顺序。", "篇章阅读", "材料：先总写校园美，再分写花坛、操场、教室。", "这是总分结构", ["只看标点", "只看字形", "只看插图"], ["总分", "顺序", "结构"]],
      ["writing-topic", "writing", "习作审题选材", "审题", "看清题目要求，选择合适材料。", "习作训练", "材料：题目是“记一次难忘的活动”。", "应选择一次具体活动来写", ["介绍说明书", "抄一首古诗", "只写午饭"], ["审题", "选材", "活动"]],
      ["notice-application", "writing", "通知和建议", "应用文", "写清时间、地点、事情、对象。", "综合语用", "材料：班级要通知同学参加周五的读书分享会。", "通知要写清时间地点事情", ["只写心情", "只写颜色", "只写一个称呼"], ["通知", "建议", "要素"]],
      ["poem-philosophy", "poem", "古诗文关键词", "古诗文", "抓关键词理解诗意和哲理。", "古诗文积累", "材料：“不识庐山真面目，只缘身在此山中”说明观察角度。", "看问题有时要跳出局部", ["山里没有路", "只要低头走路", "只看诗题"], ["关键词", "诗意", "哲理"]]
    ],
    5: [
      ["context-emotion", "word", "词语感情色彩", "语境", "辨析词语意思、感情色彩和表达效果。", "词句段运用", "材料：“郑重地接过奖状”表现态度严肃认真。", "郑重表示严肃认真", ["非常吵闹", "颜色鲜艳", "动作很快"], ["词义", "感情色彩", "表达效果"]],
      ["paragraph-structure", "reading", "篇章结构", "篇章", "分析总分、过渡、照应和段落关系。", "篇章阅读", "材料：开头总说秋天很美，后面写田野、果园、小河。", "这是总分结构", ["倒叙结构", "问答格式", "并列字词"], ["总分", "过渡", "照应"]],
      ["explanation-method", "reading", "说明方法", "说明文", "识别列数字、作比较、举例子等说明方法。", "说明文阅读", "材料：这座桥长约五十米，比普通小桥宽得多。", "列数字和作比较能说明特点", ["人物语言描写", "古诗画面", "留言格式"], ["列数字", "作比较", "举例子"]],
      ["character-detail", "reading", "人物细节描写", "人物", "从动作、语言、神态体会人物。", "阅读理解", "材料：他攥紧拳头，盯着终点线，一步也不肯停。", "动作神态体现坚持", ["只看人物名字", "只看自然段数", "只看标点"], ["动作", "语言", "神态"]],
      ["book-reading", "reading", "整本书阅读方法", "整本书", "评价人物要结合情节和言行。", "整本书阅读", "材料：评价一个人物是否勇敢，需要举出具体经历。", "人物评价要有情节依据", ["只看封面颜色", "只看页码", "随便用形容词"], ["人物", "情节", "评价"]],
      ["classical-word", "poem", "文言常见词", "古文", "理解曰、弗、乃等常见文言词。", "文言启蒙", "材料：“其人弗能应也”中的“弗”常表示“不”。", "弗通常表示不", ["跑", "看", "吃"], ["曰", "弗", "乃"]],
      ["material-viewpoint", "writing", "观点和材料", "观点", "表达观点时要引用材料作依据。", "综合运用", "材料：两则材料都提到节约用水的重要性。", "观点要明确并引用材料依据", ["只抄标题", "只写感叹号", "不看材料"], ["观点", "理由", "材料"]],
      ["writing-structure", "writing", "习作结构安排", "结构", "安排开头、重点段和结尾。", "习作训练", "材料：写“我的植物朋友”，重点应写样子、变化和观察。", "重点段要围绕题目具体写", ["只写题目", "只写一句喜欢", "写篮球比赛"], ["开头", "重点段", "结尾"]],
      ["scene-description", "writing", "场景描写", "场景", "用点面结合写活动场景。", "习作训练", "材料：运动会上，先写全场热闹，再写接力队员冲刺。", "点面结合能写出场景", ["只写一个人名", "只写天气", "只写标点"], ["点面结合", "活动", "细节"]],
      ["integrated-language", "word", "语基综合检查", "语基", "综合检查字词句和标点。", "综合复习", "材料：修改一段话时，要同时看错别字、病句和标点。", "语基题要综合检查", ["只检查颜色", "只数句子", "只看页码"], ["字词", "句子", "标点"]]
    ],
    6: [
      ["language-basic", "word", "字词句标点综合", "语基", "综合复习字词、句子和标点。", "语基综合", "材料：一段话中既有错别字，也有标点使用问题。", "要从字词句标点多方面检查", ["只看插图", "只看书名", "只看页码"], ["字词", "句子", "标点"]],
      ["reading-strategy", "reading", "阅读策略选择", "策略", "根据任务选择浏览、定位、概括、批注。", "阅读策略", "材料：想快速了解文章主要内容，可以先看标题、开头、结尾和关键句。", "浏览能快速把握主要内容", ["逐字背诵标点", "只看插图颜色", "不读题"], ["浏览", "定位", "概括"]],
      ["view-summary", "reading", "观点概括", "观点", "抓作者观点，区分观点和例子。", "观点阅读", "材料：一段话先说节约用水很重要，后面列举三个理由。", "作者观点是节约用水很重要", ["水龙头是银色的", "今天下雨", "杯子很大"], ["观点", "理由", "例子"]],
      ["non-continuous", "reading", "非连续文本阅读", "非连续文本", "整合图表、海报、说明等多材料信息。", "资料阅读", "材料：活动海报写明时间，路线图标出集合地点。", "要整合多处信息作答", ["只看图片颜色", "只看第一行", "不看图例"], ["图表", "海报", "说明"]],
      ["argument-evidence", "writing", "观点理由和证据", "论证", "表达观点要有理由和具体证据。", "表达训练", "材料：建议学校增加阅读角，需要说明原因和好处。", "建议要有观点、理由和证据", ["只喊口号", "只写无关故事", "没有观点"], ["观点", "理由", "证据"]],
      ["writing-upgrade", "writing", "习作升格", "升格", "用动作、神态、环境让表达更具体。", "习作升格", "材料：“我很开心”可以改成“我捧着奖状，忍不住笑了起来”。", "细节能让表达更具体", ["重复开心开心", "写无关天气", "只写题目"], ["动作", "神态", "细节"]],
      ["classical-reading", "poem", "古诗文综合理解", "古文", "结合词句、画面和情感理解古诗文。", "古诗文言", "材料：读古诗时，关键词能帮助想象画面和体会情感。", "抓关键词、画面和情感理解", ["只数几个字", "只看纸张颜色", "只背标题"], ["词句", "画面", "情感"]],
      ["famous-book", "reading", "名著人物分析", "名著", "结合经历、语言、行为分析人物。", "名著阅读", "材料：分析人物勇敢，要联系他面对困难时的选择。", "结合经历和行为分析人物", ["只看名字长短", "只看封面颜色", "随便猜测"], ["人物", "经历", "行为"]],
      ["speech-expression", "writing", "演讲和建议表达", "表达", "演讲稿要观点清楚、理由充分、建议具体。", "综合表达", "材料：做读书演讲，要先说观点，再举例说明。", "先提出观点，再说明理由和建议", ["只喊一句口号", "全篇没有观点", "只写无关故事"], ["演讲", "观点", "建议"]],
      ["transition-review", "reading", "小升初综合审题", "综合", "先审题，再定位材料，最后规范作答。", "综合复习", "材料：综合题同时给材料和问题，需要先看清要求。", "先审题，再定位材料，最后作答", ["先猜答案", "只看最后一行", "不读材料"], ["审题", "定位", "规范"]]
    ]
  };
  function topicForLesson(type) {
    if (type === "拼音") return "pinyin";
    if (type === "识字") return "character";
    if (type === "古诗" || type === "文言") return "poem";
    if (type === "习作" || type === "口语交际") return "writing";
    if (type === "语文园地") return "word";
    return "reading";
  }
  function curriculumFor(sourceType, grade, meta) {
    const term = meta.term || `${grade}年级`;
    const unit = meta.unit || meta.title || sourceLabels[sourceType];
    const focus = meta.focus || meta.helper || "";
    return {
      ...curriculumProfile,
      term,
      unit,
      lessonTitle: meta.lessonTitle || "",
      bookTitle: meta.bookTitle || "",
      stage: meta.stage || (sourceType === "inTextbook" ? "课内教材" : sourceType === "recommendedReading" ? "推荐读物" : "原创拓展"),
      focus,
      knowledge: meta.knowledge || {},
      questionTypes: meta.questionTypes || [],
      band: `${curriculumProfile.region} / ${curriculumProfile.textbook} / ${term} / ${unit}`
    };
  }
  function pointFromRaw([id, grade, topic, label, short, helper]) {
    return {
    id,
    subject: "chinese",
    grade,
    topic,
    label,
    short,
    helper,
    sourceType: "abilityLine",
    sourceLabel: sourceLabels.abilityLine,
    curriculum: curriculumFor("abilityLine", grade, {
      term: `${grade}年级上/下`,
      unit: label,
      stage: topic === "writing" ? "表达运用" : topic === "reading" || topic === "poem" ? "阅读理解" : "基础积累",
      focus: helper,
      questionTypes: [short, label].filter(Boolean)
    })
    };
  }
  function textbookPoint(grade, termIndex, unitIndex, lessonIndex, term, unit, lesson) {
    const type = lesson.type || "课文";
    const knowledge = lesson.knowledge || {};
    const title = lesson.title || `${unit.theme}学习`;
    const words = knowledge.words || [];
    const skills = knowledge.skills || [];
    const label = `${title}（${unit.theme}）`;
    const helper = `${term.label}${unit.theme}：围绕《${title}》的${type}知识，练习${[...words, ...skills].slice(0, 4).join("、") || "课文理解和词句积累"}。`;
    return {
      id: `c${grade}-textbook-${termIndex + 1}-${unitIndex + 1}-${lessonIndex + 1}`,
      subject: "chinese",
      grade,
      topic: topicForLesson(type),
      label,
      short: type,
      helper,
      sourceType: "inTextbook",
      sourceLabel: sourceLabels.inTextbook,
      curriculum: curriculumFor("inTextbook", grade, {
        term: term.label,
        unit: unit.theme,
        lessonTitle: title,
        stage: type,
        focus: helper,
        knowledge,
        questionTypes: [type, ...skills].filter(Boolean).slice(0, 5)
      })
    };
  }
  function textbookKnowledgePoint(grade, item) {
    const [slug, topic, label, short, helper, unit, material, correct, wrongs, skills] = item;
    return {
      id: `c${grade}-textbook-${slug}`,
      subject: "chinese",
      grade,
      topic,
      label,
      short,
      helper,
      sourceType: "inTextbook",
      sourceLabel: sourceLabels.inTextbook,
      curriculum: curriculumFor("inTextbook", grade, {
        term: `${grade}年级教材知识点`,
        unit,
        stage: "教材同步知识点",
        focus: helper,
        knowledge: {
          material,
          correct,
          wrongs,
          skills: skills || [],
          examples: [material]
        },
        questionTypes: [short, ...(skills || [])].filter(Boolean).slice(0, 6)
      })
    };
  }
  function readingPoint(grade, index, book) {
    const skills = book.skills || [];
    const themes = book.themes || [];
    const helper = `${grade}年级推荐读物《${book.title}》：练习${[...skills, ...themes].slice(0, 5).join("、")}。`;
    return {
      id: `c${grade}-reading-book-${index + 1}`,
      subject: "chinese",
      grade,
      topic: "reading",
      label: `推荐读物《${book.title}》`,
      short: "整本书",
      helper,
      sourceType: "recommendedReading",
      sourceLabel: sourceLabels.recommendedReading,
      curriculum: curriculumFor("recommendedReading", grade, {
        term: `${grade}年级课外阅读`,
        unit: "推荐读物",
        bookTitle: book.title,
        focus: helper,
        knowledge: { author: book.author, skills, themes, source: book.source },
        questionTypes: ["整本书阅读", ...skills].slice(0, 5)
      })
    };
  }
  function extraPoint(grade, index, item) {
    const skills = item.skills || [];
    const examples = item.examples || [];
    const helper = `${grade}年级原创拓展“${item.theme}”：练习${[...skills, ...examples].slice(0, 5).join("、")}。`;
    return {
      id: `c${grade}-extra-${index + 1}`,
      subject: "chinese",
      grade,
      topic: item.theme && item.theme.includes("表达") ? "writing" : item.theme && item.theme.includes("拼音") ? "pinyin" : "word",
      label: `原创拓展：${item.theme}`,
      short: "拓展",
      helper,
      sourceType: "extraOriginal",
      sourceLabel: sourceLabels.extraOriginal,
      curriculum: curriculumFor("extraOriginal", grade, {
        term: `${grade}年级课外拓展`,
        unit: item.theme,
        focus: helper,
        knowledge: { skills, examples },
        questionTypes: ["原创拓展", ...skills].slice(0, 5)
      })
    };
  }
  function derivedCurriculumPoints() {
    const result = [];
    grades.forEach((grade) => {
      const gradeData = curriculumData.grades && curriculumData.grades[grade];
      if (!gradeData) return;
      (textbookKnowledge[grade] || []).forEach((item) => result.push(textbookKnowledgePoint(grade, item)));
      (gradeData.recommendedReadings || []).forEach((book, index) => result.push(readingPoint(grade, index, book)));
      (gradeData.extraOriginal || []).forEach((item, index) => result.push(extraPoint(grade, index, item)));
    });
    return result;
  }
  const abilityPoints = rawPoints.map(pointFromRaw);
  const points = [...abilityPoints, ...derivedCurriculumPoints()];
  const pointMap = Object.fromEntries(points.map((point) => [point.id, point]));
  const pointsBySource = Object.freeze({
    abilityLine: points.filter((point) => point.sourceType === "abilityLine"),
    inTextbook: points.filter((point) => point.sourceType === "inTextbook"),
    recommendedReading: points.filter((point) => point.sourceType === "recommendedReading"),
    extraOriginal: points.filter((point) => point.sourceType === "extraOriginal")
  });
  const allOption = { id: "auto", label: "按年级混合 / 自适应" };

  window.MathCampChineseQuestionBank = {
    grades,
    gradeNames,
    causes,
    causeTagsByTopic,
    curriculumProfile,
    curriculumData,
    autoSourcePolicy,
    sourceLabels,
    gradeCurriculum,
    points,
    pointsBySource,
    pointMap,
    allOption
  };
})();
