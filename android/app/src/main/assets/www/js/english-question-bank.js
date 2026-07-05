(function () {
  "use strict";

  const curriculumData = window.MathCampEnglishCurriculumData || {};
  const curriculumProfile = curriculumData.curriculumProfile || {
    region: "浙江省杭州市",
    textbook: "小学英语（三年级起点 PEP 人教版）",
    publisher: "人民教育出版社"
  };
  const grades = [3, 4, 5, 6];
  const gradeNames = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"];
  const causes = ["未标记", "不会做", "单词不熟", "句型语法", "阅读定位"];
  const topicLabels = {
    vocabulary: "词汇理解",
    phonics: "自然拼读",
    pattern: "句型运用",
    grammar: "语法规则",
    reading: "阅读理解"
  };
  const topicShort = {
    vocabulary: "词汇",
    phonics: "拼读",
    pattern: "句型",
    grammar: "语法",
    reading: "阅读"
  };
  const topicHelpers = {
    vocabulary: "理解教材核心词汇，能在情境中选择或拼写正确单词。",
    phonics: "根据字母和字母组合读音规律判断单词拼读。",
    pattern: "掌握教材核心问答句型，能根据情境补全表达。",
    grammar: "辨析 be 动词、时态、名词单复数、代词和介词等规则。",
    reading: "阅读短对话或短文，定位人物、时间、地点、活动和原因。"
  };
  const pointMeta = {
    3: {
      vocabulary: ["e3-vocabulary-school", "校园与家庭词汇", "school family colours animals food numbers"],
      phonics: ["e3-phonics-short-vowels", "字母与短元音", "Aa-Zz short a/e/i/o/u"],
      pattern: ["e3-pattern-greetings", "问候和自我介绍", "Hello I am What's your name"],
      grammar: ["e3-grammar-basic-be", "be 动词入门", "I am He is It is"],
      reading: ["e3-reading-dialogue", "短对话信息定位", "name age colour animal family"]
    },
    4: {
      vocabulary: ["e4-vocabulary-home-school", "教室家庭与购物词汇", "classroom schoolbag home food clothes shopping"],
      phonics: ["e4-phonics-silent-e", "开音节和 r 控制音", "a-e i-e o-e er ir ur ar or"],
      pattern: ["e4-pattern-location-time", "地点时间和购物问答", "Where is What time How much"],
      grammar: ["e4-grammar-plural-pronoun", "复数和物主代词", "these those mine yours they are"],
      reading: ["e4-reading-notice", "通知和短文信息提取", "time place weather price"]
    },
    5: {
      vocabulary: ["e5-vocabulary-week-season", "星期季节和活动词汇", "week season food nature calendar"],
      phonics: ["e5-phonics-letter-groups", "常见字母组合", "ee ea ow oo ai ay th sh"],
      pattern: ["e5-pattern-habit-ability", "习惯能力和喜好表达", "When do you What can you Which season"],
      grammar: ["e5-grammar-there-present", "there be 和现在进行时", "There is There are is doing are doing"],
      reading: ["e5-reading-schedule", "日程和说明文阅读", "schedule season calendar park"]
    },
    6: {
      vocabulary: ["e6-vocabulary-travel-feeling", "交通职业情绪和变化词汇", "transport jobs feelings travel weekend"],
      phonics: ["e6-phonics-stress-ed", "句子重音和 -ed 读音", "sentence stress linking -ed"],
      pattern: ["e6-pattern-plan-advice", "计划建议和问路表达", "be going to should How can I get there"],
      grammar: ["e6-grammar-past-tense", "比较级和一般过去时", "taller older cleaned went did"],
      reading: ["e6-reading-story", "篇章阅读和时态线索", "past story plan comparison"]
    }
  };

  function curriculumFor(grade, topic) {
    return {
      region: curriculumProfile.region,
      textbook: curriculumProfile.textbook,
      publisher: curriculumProfile.publisher,
      stage: "课内教材",
      band: `${curriculumProfile.region} / ${curriculumProfile.textbook} / ${grade}年级 / ${topicLabels[topic]}`
    };
  }

  function createPoint(grade, topic) {
    const [id, label, helperDetail] = pointMeta[grade][topic];
    return {
      id,
      subject: "english",
      grade,
      topic,
      label,
      short: topicShort[topic],
      helper: `${topicHelpers[topic]} 核心范围：${helperDetail}。`,
      sourceType: "inTextbook",
      sourceLabel: "课内教材",
      curriculum: curriculumFor(grade, topic),
      questionTypes: topic === "vocabulary"
        ? ["词义匹配", "单词拼写", "同类词"]
        : topic === "phonics"
          ? ["读音判断", "字母组合", "单词拼写"]
          : topic === "pattern"
            ? ["情景交际", "问答匹配", "句型填空"]
            : topic === "grammar"
              ? ["语法选择", "语法填空", "句子改错"]
              : ["短文细节", "信息定位", "主旨理解"]
    };
  }

  const points = grades.flatMap((grade) => {
    const base = ["vocabulary", "phonics", "pattern", "grammar", "reading"].map((topic) => createPoint(grade, topic));
    const unitPoints = (curriculumData.grades?.[grade]?.terms || []).flatMap((term, termIndex) =>
      (term.units || []).map((unit, unitIndex) => {
        const topic = unitIndex % 5 === 0 ? "vocabulary" : unitIndex % 5 === 1 ? "pattern" : unitIndex % 5 === 2 ? "grammar" : unitIndex % 5 === 3 ? "phonics" : "reading";
        return {
          id: `e${grade}-unit-${termIndex + 1}-${unitIndex + 1}`,
          subject: "english",
          grade,
          topic,
          label: `${unit.title} 同步练习`,
          short: topicShort[topic],
          helper: `${unit.title}：${(unit.knowledge?.words || []).slice(0, 5).join(", ")}；${(unit.knowledge?.patterns || []).slice(0, 2).join(" / ")}。`,
          sourceType: "inTextbook",
          sourceLabel: "课内教材",
          curriculum: {
            ...curriculumFor(grade, topic),
            term: term.name,
            unit: unit.title,
            knowledge: unit.knowledge || {}
          },
          questionTypes: createPoint(grade, topic).questionTypes
        };
      })
    );
    return [...base, ...unitPoints];
  });

  const pointMap = Object.fromEntries(points.map((point) => [point.id, point]));
  const pointsByGrade = Object.fromEntries(grades.map((grade) => [grade, points.filter((point) => point.grade === grade)]));
  const pointsByTopic = Object.fromEntries(Object.keys(topicLabels).map((topic) => [topic, points.filter((point) => point.topic === topic)]));

  window.MathCampEnglishQuestionBank = {
    subject: "english",
    grades,
    gradeNames,
    causes,
    points,
    pointMap,
    pointsByGrade,
    pointsByTopic,
    curriculumProfile,
    topicLabels
  };
})();
