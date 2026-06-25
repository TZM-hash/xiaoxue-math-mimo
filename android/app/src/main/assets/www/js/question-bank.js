(function () {
    const grades = [1, 2, 3, 4, 5, 6];
    const gradeNames = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
    const causes = ["未标记", "不会做", "计算粗心", "读题理解", "概念单位"];
    const causeTagsByTopic = {
      addsub: ["计算粗心", "读题理解", "不会做"],
      compare: ["读题理解", "计算粗心", "不会做"],
      muldiv: ["概念单位", "计算粗心", "不会做"],
      remainder: ["概念单位", "读题理解", "不会做"],
      mixed: ["计算粗心", "不会做", "读题理解"],
      twostep: ["不会做", "计算粗心", "读题理解"],
      vertical: ["计算粗心", "不会做", "概念单位"],
      large: ["计算粗心", "不会做", "读题理解"],
      geometry: ["概念单位", "读题理解", "不会做"],
      decimal: ["概念单位", "计算粗心", "不会做"],
      fraction: ["概念单位", "不会做", "读题理解"],
      unit: ["概念单位", "读题理解", "不会做"],
      percent: ["概念单位", "读题理解", "不会做"],
      ratio: ["概念单位", "读题理解", "不会做"],
      statistics: ["读题理解", "不会做", "计算粗心"],
      equation: ["不会做", "概念单位", "计算粗心"],
      word: ["读题理解", "不会做", "概念单位"],
      reading: ["读题理解", "不会做", "计算粗心"],
      thinking: ["读题理解", "概念单位", "不会做"],
      appendix: ["读题理解", "不会做", "概念单位"]
    };
    const rawPoints = [
      { id: "g1-10-add", grade: 1, topic: "addsub", label: "10 以内加减", short: "10以内", helper: "数数、凑数、基础加减" },
      { id: "g1-20-add", grade: 1, topic: "addsub", label: "20 以内加减", short: "20以内", helper: "凑十、拆数、简单应用" },
      { id: "g1-vertical", grade: 1, topic: "vertical", label: "20 以内竖式计算", short: "竖式", helper: "个位对齐、从个位算起、只练加减" },
      { id: "g1-two-step", grade: 1, topic: "twostep", label: "20 以内两步加减", short: "两步加减", helper: "连加连减、先算第一步再算第二步" },
      { id: "g1-compare", grade: 1, topic: "compare", label: "数的比较与补数", short: "比较", helper: "谁多谁少、差多少" },
      { id: "g1-number-order", grade: 1, topic: "compare", label: "数序与第几", short: "数序第几", helper: "前后第几、排队人数、最大最小" },
      { id: "g1-shape", grade: 1, topic: "geometry", label: "图形与位置入门", short: "图形位置", helper: "数图形、左右位置、简单排列" },
      { id: "g1-simple-word", grade: 1, topic: "word", label: "一年级简单应用题", short: "一上应用", helper: "一共、还剩、比多比少" },
      { id: "g1-reading", grade: 1, topic: "reading", label: "一年级思维阅读训练", short: "思维阅读", helper: "读懂问什么、找有用数字、排除背景信息" },
      { id: "g1-thinking", grade: 1, topic: "thinking", label: "一年级思维精进题型", short: "精进", helper: "量感、规律、表达、干扰条件" },
      { id: "g1-appendix", grade: 1, topic: "appendix", label: "一年级附加题", short: "附加", helper: "找规律、数感、简单排队问题" },
      { id: "g2-100-add", grade: 2, topic: "addsub", label: "100 以内进退位", short: "100以内", helper: "两位数加减、进位退位" },
      { id: "g2-vertical", grade: 2, topic: "vertical", label: "100 以内竖式计算", short: "竖式", helper: "数位对齐、进位退位、写清过程" },
      { id: "g2-two-step", grade: 2, topic: "twostep", label: "100 以内两步运算", short: "两步运算", helper: "连加连减、加减混合、表内乘除两步" },
      { id: "g2-two-step-muldiv", grade: 2, topic: "twostep", label: "表内两步乘除法", short: "乘除两步", helper: "表内乘除连算、先乘后除、先除后乘" },
      { id: "g2-table", grade: 2, topic: "muldiv", label: "乘法口诀", short: "口诀", helper: "乘法意义、表内除法" },
      { id: "g2-table-div", grade: 2, topic: "muldiv", label: "表内除法", short: "表内除", helper: "平均分、想乘算除" },
      { id: "g2-time-money", grade: 2, topic: "unit", label: "时间与人民币", short: "时间钱币", helper: "元角分、时分、简单经过时间" },
      { id: "g2-length-measure", grade: 2, topic: "unit", label: "长度单位与测量", short: "长度测量", helper: "米厘米换算、简单测量语境" },
      { id: "g2-angle-view", grade: 2, topic: "geometry", label: "角与观察物体", short: "角观察", helper: "直角、线段读图、观察物体、平移" },
      { id: "g2-simple-word", grade: 2, topic: "word", label: "低年级应用题", short: "应用题", helper: "求一共、还剩、每份" },
      { id: "g2-reading", grade: 2, topic: "reading", label: "二年级思维阅读训练", short: "思维阅读", helper: "筛条件、看关键词、判断第一步" },
      { id: "g2-thinking", grade: 2, topic: "thinking", label: "二年级思维精进题型", short: "精进", helper: "估算、策略、找错、干扰条件" },
      { id: "g2-appendix", grade: 2, topic: "appendix", label: "二年级附加题", short: "附加", helper: "周期规律、简单倍数、平均分思维" },
      { id: "g3-multi-add", grade: 3, topic: "addsub", label: "多位数加减", short: "多位加减", helper: "三四位数计算" },
      { id: "g3-vertical", grade: 3, topic: "vertical", label: "多位数竖式计算", short: "竖式", helper: "三位数加减、乘一位数、除一位数" },
      { id: "g3-mul-div", grade: 3, topic: "muldiv", label: "多位数乘除", short: "乘除", helper: "两位数乘一位数、除法" },
      { id: "g3-two-step", grade: 3, topic: "twostep", label: "两步乘除与加减", short: "两步计算", helper: "乘除后加减、先求中间结果" },
      { id: "g3-remainder", grade: 3, topic: "remainder", label: "有余数除法", short: "余数", helper: "商和余数" },
      { id: "g3-perimeter", grade: 3, topic: "geometry", label: "周长入门", short: "周长", helper: "长方形、正方形、数格子周长" },
      { id: "g3-unit", grade: 3, topic: "unit", label: "时间与长度单位", short: "单位入门", helper: "米厘米、时分、千克克" },
      { id: "g3-fraction-intro", grade: 3, topic: "fraction", label: "分数初步", short: "分数初步", helper: "几分之几、同分母简单加减" },
      { id: "g3-statistics", grade: 3, topic: "statistics", label: "统计图表入门", short: "统计", helper: "读表格、求最多最少、简单合计" },
      { id: "g3-word-two-step", grade: 3, topic: "word", label: "两步应用题", short: "两步应用", helper: "先求中间量，再回答问题" },
      { id: "g3-reading", grade: 3, topic: "reading", label: "三年级思维阅读训练", short: "思维阅读", helper: "找关系、识别干扰、分清先后步骤" },
      { id: "g3-thinking", grade: 3, topic: "thinking", label: "三年级思维精进题型", short: "精进", helper: "估算、改错、表格阅读、干扰条件" },
      { id: "g3-appendix", grade: 3, topic: "appendix", label: "三年级附加题", short: "附加", helper: "和差倍、植树雏形、有余数综合" },
      { id: "g4-mixed", grade: 4, topic: "mixed", label: "四则混合运算", short: "混合", helper: "先乘除后加减、括号" },
      { id: "g4-vertical", grade: 4, topic: "vertical", label: "多位乘除竖式", short: "乘除竖式", helper: "多位乘法、除法试商、数位对齐" },
      { id: "g4-two-step", grade: 4, topic: "twostep", label: "两步混合计算", short: "两步混合", helper: "括号、乘除优先、两步竖式" },
      { id: "g4-large", grade: 4, topic: "large", label: "大数计算", short: "大数", helper: "万以内到亿以内" },
      { id: "g4-area", grade: 4, topic: "geometry", label: "面积计算", short: "面积", helper: "数格子、组合图形、周长面积辨析" },
      { id: "g4-angle-triangle", grade: 4, topic: "geometry", label: "角与三角形四边形", short: "角图形", helper: "角度量、三角形、平行四边形和梯形" },
      { id: "g4-mul-div", grade: 4, topic: "muldiv", label: "多位乘除专项", short: "多位乘除", helper: "两三位数乘除法" },
      { id: "g4-statistics", grade: 4, topic: "statistics", label: "平均数与统计", short: "平均数", helper: "平均数、总量、数据比较" },
      { id: "g4-word", grade: 4, topic: "word", label: "四年级应用题", short: "四上应用", helper: "行程、购物、倍数关系" },
      { id: "g4-reading", grade: 4, topic: "reading", label: "四年级思维阅读训练", short: "思维阅读", helper: "条件推理、真假判断、表格阅读" },
      { id: "g4-thinking", grade: 4, topic: "thinking", label: "四年级思维精进题型", short: "精进", helper: "策略选择、估算、量感、干扰条件" },
      { id: "g4-appendix", grade: 4, topic: "appendix", label: "四年级附加题", short: "附加", helper: "植树、和差倍、年龄与盈亏入门" },
      { id: "g5-decimal-add", grade: 5, topic: "decimal", label: "小数加减", short: "小数加减", helper: "小数点对齐、位数补零" },
      { id: "g5-vertical", grade: 5, topic: "vertical", label: "小数竖式计算", short: "小数竖式", helper: "小数点对齐、补 0、按整数方法计算" },
      { id: "g5-decimal", grade: 5, topic: "decimal", label: "小数运算", short: "小数", helper: "小数加减乘除" },
      { id: "g5-two-step", grade: 5, topic: "twostep", label: "小数分数两步计算", short: "两步小分", helper: "小数两步、同分母分数两步" },
      { id: "g5-fraction", grade: 5, topic: "fraction", label: "分数基础", short: "分数", helper: "同分母加减、求一个数的几分之几" },
      { id: "g5-unit", grade: 5, topic: "unit", label: "单位换算", short: "单位", helper: "长度、质量、时间" },
      { id: "g5-percent", grade: 5, topic: "percent", label: "百分数与折扣", short: "百分数", helper: "折扣、百分之几" },
      { id: "g5-average-stat", grade: 5, topic: "statistics", label: "平均数应用", short: "平均数", helper: "平均数、总数、反推数据" },
      { id: "g5-equation", grade: 5, topic: "equation", label: "简易方程", short: "方程", helper: "用 x 表示未知数、等式两边同变" },
      { id: "g5-volume", grade: 5, topic: "geometry", label: "长方体与正方体", short: "体积", helper: "观察物体、体积、表面积、棱长和" },
      { id: "g5-geometry-motion", grade: 5, topic: "geometry", label: "多边形面积与图形运动", short: "图形运动", helper: "多边形面积、三视图、展开图、轴对称旋转" },
      { id: "g5-word", grade: 5, topic: "word", label: "五年级综合应用题", short: "五上应用", helper: "小数、分数、百分数语境" },
      { id: "g5-reading", grade: 5, topic: "reading", label: "五年级思维阅读训练", short: "思维阅读", helper: "多条件推理、比例语境、结论判断" },
      { id: "g5-thinking", grade: 5, topic: "thinking", label: "五年级思维精进题型", short: "精进", helper: "开放题、可能性、找错、干扰条件" },
      { id: "g5-appendix", grade: 5, topic: "appendix", label: "五年级附加题", short: "附加", helper: "鸡兔同笼、行程、工程、平均数" },
      { id: "g6-ratio", grade: 6, topic: "ratio", label: "比和比例", short: "比例", helper: "按比例分配" },
      { id: "g6-vertical", grade: 6, topic: "vertical", label: "综合竖式计算", short: "综合竖式", helper: "小数、百分数和多位数竖式计算" },
      { id: "g6-fraction-percent", grade: 6, topic: "fraction", label: "分数百分数综合", short: "综合", helper: "分数、小数、百分数互通" },
      { id: "g6-two-step", grade: 6, topic: "twostep", label: "分百比两步计算", short: "两步综合", helper: "分数、百分数、比和比例的两步计算" },
      { id: "g6-percent", grade: 6, topic: "percent", label: "百分数应用", short: "百分数应用", helper: "折扣、增长、百分之几" },
      { id: "g6-circle", grade: 6, topic: "geometry", label: "圆的周长与面积", short: "圆", helper: "半径、直径、圆环、周长面积" },
      { id: "g6-solid-position", grade: 6, topic: "geometry", label: "位置方向与圆柱圆锥", short: "立体方向", helper: "路线图、扇形、圆柱圆锥、展开图" },
      { id: "g6-scale", grade: 6, topic: "ratio", label: "比例尺应用", short: "比例尺", helper: "图上距离、实际距离、比例尺换算" },
      { id: "g6-equation", grade: 6, topic: "equation", label: "方程综合", short: "方程综合", helper: "含未知数的等量关系与两步方程" },
      { id: "g6-complex-word", grade: 6, topic: "word", label: "综合应用题", short: "综合应用", helper: "多步列式、单位与关系" },
      { id: "g6-reading", grade: 6, topic: "reading", label: "六年级思维阅读训练", short: "思维阅读", helper: "综合阅读、必要条件、逻辑结论" },
      { id: "g6-thinking", grade: 6, topic: "thinking", label: "六年级思维精进题型", short: "精进", helper: "综合估算、分类讨论、生活阅读、干扰条件" },
      { id: "g6-appendix", grade: 6, topic: "appendix", label: "六年级附加题", short: "附加", helper: "浓度、比例、复杂行程、分数百分数综合" }
    ];
    const curriculumProfile = {
      id: "hangzhou-pep-primary-math",
      region: "浙江省杭州市",
      textbook: "小学数学（按人教版单元线）",
      sourceNote: "按杭州小学常用人教版数学单元顺序组织，兼顾义务教育数学课程标准（2022年版）的数与运算、图形与几何、统计与概率、综合与实践四类素养。",
      rolloutNote: "低年级新教材逐年滚动更新时，只需替换本表的单元映射，题目 ID 和练习记录可以继续沿用。"
    };
    const gradeCurriculum = {
      1: {
        first: ["准备课", "位置", "1-5 的认识和加减法", "认识图形（一）", "6-10 的认识和加减法", "11-20 各数的认识", "认识钟表", "20 以内进位加法"],
        second: ["认识图形（二）", "20 以内退位减法", "分类与整理", "100 以内数的认识", "认识人民币", "100 以内加法和减法（一）", "找规律"],
        focus: ["数数与数序", "凑十拆数", "看图列式", "简单比较", "读题找条件"]
      },
      2: {
        first: ["长度单位", "100 以内加法和减法（二）", "角的初步认识", "表内乘法（一）", "观察物体（一）", "表内乘法（二）", "认识时间", "数学广角-搭配（一）"],
        second: ["数据收集整理", "表内除法（一）", "图形的运动（一）", "表内除法（二）", "混合运算", "有余数的除法", "万以内数的认识", "克和千克", "数学广角-推理"],
        focus: ["100 以内笔算", "乘法口诀", "平均分", "长度与时间", "一步到两步解决问题"]
      },
      3: {
        first: ["时、分、秒", "万以内的加法和减法（一）", "测量", "万以内的加法和减法（二）", "倍的认识", "多位数乘一位数", "长方形和正方形", "分数的初步认识", "数学广角-集合"],
        second: ["位置与方向（一）", "除数是一位数的除法", "复式统计表", "两位数乘两位数", "面积", "年、月、日", "小数的初步认识", "数学广角-搭配（二）"],
        focus: ["万以内计算", "倍的关系", "周长面积区分", "分数初步", "统计表阅读"]
      },
      4: {
        first: ["大数的认识", "公顷和平方千米", "角的度量", "三位数乘两位数", "平行四边形和梯形", "除数是两位数的除法", "条形统计图", "数学广角-优化"],
        second: ["四则运算", "观察物体（二）", "运算定律", "小数的意义和性质", "三角形", "小数的加法和减法", "图形的运动（二）", "平均数与条形统计图", "数学广角-鸡兔同笼"],
        focus: ["大数读写", "多位乘除", "运算顺序和定律", "面积单位", "平均数"]
      },
      5: {
        first: ["小数乘法", "位置", "小数除法", "可能性", "简易方程", "多边形的面积", "数学广角-植树问题"],
        second: ["观察物体（三）", "因数与倍数", "长方体和正方体", "分数的意义和性质", "图形的运动（三）", "分数的加法和减法", "折线统计图", "数学广角-找次品"],
        focus: ["小数乘除", "简易方程", "面积模型", "长方体和正方体", "分数意义"]
      },
      6: {
        first: ["分数乘法", "位置与方向（二）", "分数除法", "比", "圆", "百分数（一）", "扇形统计图", "数学广角-数与形"],
        second: ["负数", "百分数（二）", "圆柱与圆锥", "比例", "数学广角-鸽巢问题", "整理和复习"],
        focus: ["分数百分数应用", "比和比例", "圆与立体图形", "统计图阅读", "综合建模"]
      }
    };
    const pointCurriculum = {
      "g1-10-add": { term: "一上", unit: "1-10 的认识和加减法", stage: "当前基础", focus: "先会数、会分合，再用加减表示合起来和拿走。", questionTypes: ["看图列式", "凑数补数", "10以内口算"] },
      "g1-20-add": { term: "一上/一下", unit: "20 以内进位加法、退位减法", stage: "核心巩固", focus: "围绕凑十、破十和拆数，建立 20 以内加减的稳定方法。", questionTypes: ["凑十法", "破十法", "20以内应用"] },
      "g1-vertical": { term: "一下复习", unit: "100 以内加法和减法（一）笔算萌芽", stage: "校内补充", focus: "只把数位对齐的意识提前建立，不拔高到复杂笔算。", questionTypes: ["数位对齐", "20以内竖式", "缺数验算"] },
      "g1-two-step": { term: "一上/一下", unit: "连加、连减、加减混合解决问题", stage: "核心巩固", focus: "按事情发生顺序写出第一步和第二步，避免只算一步。", questionTypes: ["连加连减", "加减混合", "先后顺序"] },
      "g1-compare": { term: "一上/一下", unit: "数的认识与比较", stage: "当前基础", focus: "分清大于、小于、比多比少和补到目标数。", questionTypes: ["比多比少", "求差", "补数"] },
      "g1-number-order": { term: "一上/一下", unit: "11-20 各数的认识、100 以内数的认识", stage: "当前基础", focus: "理解前后、第几、相邻数和数序。", questionTypes: ["前后第几", "相邻数", "排队人数"] },
      "g1-shape": { term: "一上/一下", unit: "位置、认识图形（一）（二）", stage: "当前基础", focus: "在数图形、左右位置和排队问题中建立空间表达。", questionTypes: ["数图形", "左右前后", "图形分类"] },
      "g1-simple-word": { term: "一上/一下", unit: "加减法解决问题", stage: "核心巩固", focus: "先读问题，再找一共、还剩、比多比少对应的数量关系。", questionTypes: ["一共", "还剩", "比多比少"] },
      "g1-reading": { term: "一上/一下", unit: "解决问题读题训练", stage: "专项能力", focus: "把题目问什么和哪些数字有用分开看。", questionTypes: ["找问题", "筛条件", "排除背景数", "干扰条件"] },
      "g1-thinking": { term: "一上/一下", unit: "分类与整理、找规律、认识图形", stage: "专项能力", focus: "用量感、规律和算式表达训练低年级数学语言。", questionTypes: ["量感判断", "规律数列", "干扰条件", "数学表达"] },
      "g1-appendix": { term: "一下", unit: "找规律、数学乐园", stage: "拓展思维", focus: "用数列、排队、图形规律做轻量思维训练。", questionTypes: ["找规律", "排队", "简单数感"] },
      "g2-100-add": { term: "二上", unit: "100 以内加法和减法（二）", stage: "当前核心", focus: "掌握两位数进位加、退位减和验算意识。", questionTypes: ["进位加", "退位减", "笔算验算"] },
      "g2-vertical": { term: "二上", unit: "100 以内加法和减法（二）", stage: "当前核心", focus: "相同数位对齐，从个位算起，写清进位和退位。", questionTypes: ["加法竖式", "减法竖式", "缺数竖式"] },
      "g2-two-step": { term: "二下", unit: "混合运算", stage: "核心巩固", focus: "从一步应用过渡到两步，先求中间量再回答。", questionTypes: ["连加连减", "加减混合", "乘除加减"] },
      "g2-two-step-muldiv": { term: "二下", unit: "表内除法、混合运算", stage: "核心巩固", focus: "用口诀支撑表内乘除连算，理解先算什么。", questionTypes: ["乘除连算", "先乘后除", "平均分两步"] },
      "g2-table": { term: "二上/二下", unit: "表内乘法、表内除法", stage: "当前核心", focus: "把几个几、平均分和乘除互逆联系起来。", questionTypes: ["乘法口诀", "几个几", "想乘算除"] },
      "g2-table-div": { term: "二下", unit: "表内除法（一）（二）", stage: "当前核心", focus: "看到平均分、每份、每人等语境，能列出除法。", questionTypes: ["平均分", "包含除", "想乘算除"] },
      "g2-time-money": { term: "二上/一下复习", unit: "认识时间、认识人民币", stage: "生活应用", focus: "时间读法和元角分换算放在生活题里练。", questionTypes: ["经过几分", "元角分", "生活换算"] },
      "g2-length-measure": { term: "二上", unit: "长度单位", stage: "当前基础", focus: "米、厘米和简单测量语境要先统一单位。", questionTypes: ["米厘米换算", "测量估计", "长度比较"] },
      "g2-angle-view": { term: "二上/二下", unit: "角的初步认识、观察物体（一）、图形的运动（一）", stage: "当前基础", focus: "先会数角、认直角，再用线段和简单观察图读出有用信息。", questionTypes: ["数直角", "线段合成", "观察物体", "图形运动"] },
      "g2-simple-word": { term: "二上/二下", unit: "乘加乘减、表内除法解决问题", stage: "核心巩固", focus: "从求一共、还剩扩展到每份、几份和两步应用。", questionTypes: ["每份几份", "乘加乘减", "干扰条件"] },
      "g2-reading": { term: "二下", unit: "数学广角-推理、解决问题", stage: "专项能力", focus: "先筛有用条件，再判断第一步该算什么。", questionTypes: ["条件筛选", "第一步判断", "干扰条件", "简单推理"] },
      "g2-thinking": { term: "二上/二下", unit: "长度单位、认识时间、数学广角-搭配（一）、推理", stage: "专项能力", focus: "把估算、策略选择、找错和生活阅读放在二年级可读情境中练。", questionTypes: ["估算合理性", "策略选择", "找错改错", "干扰条件"] },
      "g2-appendix": { term: "二上/二下", unit: "数学广角-搭配（一）、推理", stage: "拓展思维", focus: "用列表、画图和排除法做轻量拓展。", questionTypes: ["搭配", "推理", "周期规律"] },
      "g3-multi-add": { term: "三上", unit: "万以内的加法和减法（一）（二）", stage: "当前核心", focus: "把三四位数加减的估算、笔算和验算连起来。", questionTypes: ["多位加减", "估算", "验算"] },
      "g3-vertical": { term: "三上/三下", unit: "多位数乘一位数、除数是一位数的除法、两位数乘两位数", stage: "当前核心", focus: "竖式中重点看进位、退位、试商和数位位置。", questionTypes: ["乘法竖式", "除法竖式", "多位加减竖式"] },
      "g3-mul-div": { term: "三上/三下", unit: "多位数乘一位数、除数是一位数的除法", stage: "当前核心", focus: "把乘法意义、除法平均分和竖式步骤连接起来。", questionTypes: ["多位乘一位", "一位数除法", "乘除应用"] },
      "g3-two-step": { term: "三上/三下", unit: "倍的认识、两步解决问题", stage: "核心巩固", focus: "先求倍数关系或中间量，再进行第二步计算。", questionTypes: ["乘除加减", "括号两步", "倍的关系"] },
      "g3-remainder": { term: "二下复习/三上过渡", unit: "有余数的除法", stage: "复习巩固", focus: "理解商和余数，解决装袋、坐车这类要不要加一的问题。", questionTypes: ["商和余数", "最多能装", "至少需要"] },
      "g3-perimeter": { term: "三上", unit: "长方形和正方形", stage: "当前核心", focus: "先分清周长是围一圈，再套长方形、正方形周长公式。", questionTypes: ["长方形周长", "正方形周长", "数格子周长", "边长反推"] },
      "g3-unit": { term: "三上/三下", unit: "时分秒、测量、年月日", stage: "当前基础", focus: "长度、质量、时间换算先统一单位再计算。", questionTypes: ["时分秒", "长度质量", "经过时间"] },
      "g3-fraction-intro": { term: "三上", unit: "分数的初步认识", stage: "当前核心", focus: "从平均分理解几分之一、几分之几和同分母简单加减。", questionTypes: ["几分之一", "同分母加减", "整体与部分"] },
      "g3-statistics": { term: "三下", unit: "复式统计表", stage: "当前基础", focus: "读表格先找行列，再求合计、最多最少和差。", questionTypes: ["读表", "合计", "最多最少"] },
      "g3-word-two-step": { term: "三上/三下", unit: "倍的认识、两步解决问题", stage: "核心巩固", focus: "读懂数量关系，明确先求哪个中间量。", questionTypes: ["倍数应用", "归一问题", "干扰条件"] },
      "g3-reading": { term: "三上/三下", unit: "数学广角-集合、搭配（二）", stage: "专项能力", focus: "通过表格、集合和条件句训练读题顺序。", questionTypes: ["表格阅读", "关系推理", "条件排除", "干扰条件"] },
      "g3-thinking": { term: "三上/三下", unit: "测量、复式统计表、长方形和正方形、数学广角", stage: "专项能力", focus: "估算、改错、表格阅读和分类讨论用于训练检查与建模。", questionTypes: ["估算合理性", "找错改错", "干扰条件", "分类讨论"] },
      "g3-appendix": { term: "三上/三下", unit: "数学广角-集合、搭配（二）", stage: "拓展思维", focus: "用画图、枚举、余数和倍的关系处理拓展题。", questionTypes: ["集合", "搭配", "和差倍雏形"] },
      "g4-mixed": { term: "四下", unit: "四则运算、运算定律", stage: "当前核心", focus: "先看括号，再看乘除优先，最后加减；能用运算定律简算。", questionTypes: ["四则混合", "括号", "简便计算"] },
      "g4-vertical": { term: "四上", unit: "三位数乘两位数、除数是两位数的除法", stage: "当前核心", focus: "多位乘除竖式要写清试商、进位和部分积。", questionTypes: ["三位乘两位", "除数两位", "试商"] },
      "g4-two-step": { term: "四下", unit: "四则运算", stage: "核心巩固", focus: "把两步混合算式写成清楚的中间过程。", questionTypes: ["两步混合", "括号两步", "乘除优先"] },
      "g4-large": { term: "四上", unit: "大数的认识", stage: "当前基础", focus: "亿以内数的读写、改写和大数计算要按数位分级。", questionTypes: ["大数读写", "改写估算", "大数加减"] },
      "g4-area": { term: "三下复习/四上拓展", unit: "面积、公顷和平方千米", stage: "复习拓展", focus: "区分周长和面积，知道平方厘米、平方米、公顷、平方千米。", questionTypes: ["数格子面积", "组合图形拆分", "周长面积辨析", "面积单位"] },
      "g4-angle-triangle": { term: "四上/四下", unit: "角的度量、平行四边形和梯形、三角形、图形的运动（二）", stage: "当前核心", focus: "把量角、三角形内角和、四边形特征和简单轴对称放到读图题里练。", questionTypes: ["角的度量", "三角形内角和", "三角形分类", "平行四边形和梯形"] },
      "g4-mul-div": { term: "四上", unit: "三位数乘两位数、除数是两位数的除法", stage: "当前核心", focus: "乘除专项重点练速度、时间、路程和试商。", questionTypes: ["多位乘法", "多位除法", "行程数量关系"] },
      "g4-statistics": { term: "四下", unit: "平均数与条形统计图", stage: "当前基础", focus: "平均数先求总量，再平均分；统计图要读清单位。", questionTypes: ["平均数", "条形统计图", "反推数据"] },
      "g4-word": { term: "四上/四下", unit: "三位数乘两位数、四则运算、数学广角", stage: "核心巩固", focus: "购物、行程、倍数和优化题都要先找数量关系。", questionTypes: ["速度时间路程", "购物满减", "优化问题"] },
      "g4-reading": { term: "四上/四下", unit: "条形统计图、数学广角-优化", stage: "专项能力", focus: "在表格、统计图和真假条件中练读题判断。", questionTypes: ["统计阅读", "真假判断", "条件排序", "干扰条件"] },
      "g4-thinking": { term: "四上/四下", unit: "运算定律、角的度量、平均数与条形统计图、数学广角-优化", stage: "专项能力", focus: "重点训练选择策略、估算合理性、量感和生活表格阅读。", questionTypes: ["策略选择", "估算合理性", "量感判断", "干扰条件"] },
      "g4-appendix": { term: "四上/四下", unit: "数学广角-优化、鸡兔同笼", stage: "拓展思维", focus: "把复杂题先转成表格、假设或画图模型。", questionTypes: ["优化", "鸡兔同笼", "和差倍"] },
      "g5-decimal-add": { term: "四下复习/五上衔接", unit: "小数的加法和减法、小数乘除法前置", stage: "衔接巩固", focus: "小数加减先把小数点对齐，为五上小数乘除打基础。", questionTypes: ["小数加法", "小数减法", "补零对齐"] },
      "g5-vertical": { term: "五上", unit: "小数乘法、小数除法", stage: "当前核心", focus: "小数竖式先按整数算，再处理小数点位置。", questionTypes: ["小数乘法竖式", "小数除法竖式", "验算"] },
      "g5-decimal": { term: "五上", unit: "小数乘法、小数除法", stage: "当前核心", focus: "掌握小数乘除的意义、计算和生活应用。", questionTypes: ["小数乘法", "小数除法", "单价数量总价"] },
      "g5-two-step": { term: "五上/五下", unit: "小数四则、分数的加法和减法", stage: "核心巩固", focus: "两步计算要先确定小数或分数部分的中间结果。", questionTypes: ["小数两步", "分数两步", "乘除加减"] },
      "g5-fraction": { term: "五下", unit: "分数的意义和性质、分数加减法", stage: "当前核心", focus: "从整体和单位“1”理解分数，再做同分母和异分母加减。", questionTypes: ["分数意义", "通分约分", "分数加减"] },
      "g5-unit": { term: "五上/五下", unit: "多边形面积、长方体和正方体中的单位换算", stage: "基础巩固", focus: "面积、体积、长度、质量、时间换算都要先写换算关系。", questionTypes: ["面积单位", "体积单位", "综合换算"] },
      "g5-percent": { term: "六上预习/生活拓展", unit: "百分数（一）", stage: "预习拓展", focus: "提前用折扣、百分之几理解百分数生活语境。", questionTypes: ["百分之几", "折扣", "降价"] },
      "g5-average-stat": { term: "四下复习/五下统计衔接", unit: "平均数、折线统计图", stage: "复习巩固", focus: "平均数反推和统计图阅读要看清总量、份数和单位。", questionTypes: ["平均数", "反推数据", "统计阅读"] },
      "g5-equation": { term: "五上", unit: "简易方程", stage: "当前核心", focus: "用 x 表示未知数，根据等量关系列方程并解方程。", questionTypes: ["等量关系", "一步方程", "两步方程"] },
      "g5-volume": { term: "五下", unit: "长方体和正方体", stage: "当前核心", focus: "区分棱长和、表面积、体积，先写公式再代入。", questionTypes: ["观察物体", "体积", "表面积", "棱长和"] },
      "g5-geometry-motion": { term: "五上/五下", unit: "位置、多边形的面积、观察物体（三）、图形的运动（三）", stage: "当前核心", focus: "重点训练底和高、三视图、正方体展开图、轴对称和旋转后的读图判断。", questionTypes: ["多边形面积", "三视图", "展开图", "轴对称旋转"] },
      "g5-word": { term: "五上/五下", unit: "小数乘除、简易方程、分数应用", stage: "核心巩固", focus: "把单价数量总价、方程等量关系和分数单位“1”读清楚。", questionTypes: ["小数应用", "方程应用", "分数应用"] },
      "g5-reading": { term: "五上/五下", unit: "简易方程、统计与分数应用", stage: "专项能力", focus: "多条件题先找单位“1”、未知数和必要条件。", questionTypes: ["多条件筛选", "方程阅读", "统计结论", "干扰条件"] },
      "g5-thinking": { term: "五上/五下", unit: "简易方程、多边形面积、可能性、折线统计图、数学广角", stage: "专项能力", focus: "开放题、可能性、找错和策略表达帮助孩子从会算走向会解释。", questionTypes: ["开放多答案", "可能性", "找错改错", "干扰条件"] },
      "g5-appendix": { term: "五上/五下", unit: "数学广角-植树问题、找次品", stage: "拓展思维", focus: "用模型识别植树、找次品、行程和平均数拓展。", questionTypes: ["植树问题", "找次品", "平均数拓展"] },
      "g6-ratio": { term: "六上/六下", unit: "比、比例", stage: "当前核心", focus: "先求总份数或对应量，再做按比例分配和正反比例判断。", questionTypes: ["比的意义", "按比分配", "正比例"] },
      "g6-vertical": { term: "六下", unit: "整理和复习-数与代数", stage: "综合复习", focus: "综合竖式用于检查多位数、小数、百分数计算稳定性。", questionTypes: ["小数竖式", "多位乘除", "综合验算"] },
      "g6-fraction-percent": { term: "六上", unit: "分数乘法、分数除法、百分数（一）", stage: "当前核心", focus: "分数、百分数和小数互化后再解决实际问题。", questionTypes: ["分数乘除", "百分数互化", "单位1判断"] },
      "g6-two-step": { term: "六上/六下", unit: "分数百分数、比和比例综合", stage: "核心巩固", focus: "两步综合题先判断单位“1”或比例关系，再列式。", questionTypes: ["分百两步", "比和比例两步", "单位1"] },
      "g6-percent": { term: "六上/六下", unit: "百分数（一）（二）", stage: "当前核心", focus: "折扣、增长率、成数、税率都要转成百分数关系。", questionTypes: ["折扣", "增长率", "百分数应用"] },
      "g6-circle": { term: "六上", unit: "圆", stage: "当前核心", focus: "分清半径、直径、周长和面积公式。", questionTypes: ["圆周长", "圆面积", "圆环面积", "半径直径"] },
      "g6-solid-position": { term: "六上/六下", unit: "位置与方向（二）、圆、圆柱与圆锥、比例尺", stage: "当前核心", focus: "在路线图、扇形、圆柱圆锥和展开图中筛掉无关条件，选择正确公式。", questionTypes: ["位置方向", "扇形半圆", "圆柱圆锥", "展开图"] },
      "g6-scale": { term: "六下", unit: "比例-比例尺", stage: "当前核心", focus: "图上距离、实际距离、比例尺三者单位必须统一。", questionTypes: ["求实际距离", "求图上距离", "单位换算"] },
      "g6-equation": { term: "六下", unit: "整理和复习-式与方程", stage: "综合复习", focus: "用方程复盘等量关系，处理两步未知数问题。", questionTypes: ["等量关系", "两步方程", "方程应用"] },
      "g6-complex-word": { term: "六上/六下", unit: "分数、百分数、比和比例综合应用", stage: "综合复习", focus: "复杂应用题先画数量关系，再拆成两到三步。", questionTypes: ["分数应用", "百分数应用", "比例应用"] },
      "g6-reading": { term: "六上/六下", unit: "数与形、鸽巢问题、综合实践", stage: "专项能力", focus: "综合阅读题重点判断必要条件、隐藏关系和结论是否必然。", questionTypes: ["必要条件", "逻辑结论", "综合推理", "干扰条件"] },
      "g6-thinking": { term: "六上/六下", unit: "数与形、百分数、比和比例、整理和复习", stage: "专项能力", focus: "综合估算、分类讨论、生活阅读和数学表达用于小升初前的思维整合。", questionTypes: ["综合估算", "分类讨论", "生活阅读", "干扰条件"] },
      "g6-appendix": { term: "六上/六下", unit: "数学广角-数与形、鸽巢问题", stage: "拓展思维", focus: "把浓度、行程、比例和抽屉原理转成模型。", questionTypes: ["数与形", "鸽巢问题", "比例拓展"] }
    };
    function fallbackCurriculum(point) {
      const grade = Number(point.grade) || 1;
      return {
        term: grade <= 2 ? `${grade}年级上/下` : `${grade}年级综合`,
        unit: point.label,
        stage: point.topic === "appendix" ? "拓展思维" : "专项巩固",
        focus: point.helper,
        questionTypes: [point.short || point.label]
      };
    }
    const points = rawPoints.map((point) => {
      const local = pointCurriculum[point.id] || fallbackCurriculum(point);
      const term = local.term || fallbackCurriculum(point).term;
      const unit = local.unit || point.label;
      return {
        ...point,
        curriculum: {
          ...curriculumProfile,
          grade: point.grade,
          topic: point.topic,
          term,
          unit,
          stage: local.stage || "专项巩固",
          focus: local.focus || point.helper,
          questionTypes: Array.isArray(local.questionTypes) && local.questionTypes.length ? local.questionTypes : [point.short || point.label],
          band: `${curriculumProfile.region} / ${curriculumProfile.textbook} / ${term} / ${unit}`
        }
      };
    });
    const pointMap = Object.fromEntries(points.map((point) => [point.id, point]));
    const allOption = { id: "auto", label: "按年级混合 / 自适应" };

    window.MathCampQuestionBank = {
      grades,
      gradeNames,
      causes,
      causeTagsByTopic,
      curriculumProfile,
      gradeCurriculum,
      points,
      pointMap,
      allOption
    };
  })();
