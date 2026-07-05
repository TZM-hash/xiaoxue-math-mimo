(function () {
  "use strict";

  var CAUSE_LABELS = ["计算粗心", "读题理解", "概念单位", "干扰条件", "不会做"];
  var CHINESE_CAUSE_LABELS = ["未标记", "不会做", "字词基础", "阅读理解", "表达规范"];

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeText(value) {
    return String(value || "");
  }

  function pointFor(pointMap, item) {
    var pointId = item && (item.pointId || item.question && item.question.pointId);
    return pointId && pointMap ? pointMap[pointId] : null;
  }

  function diagnoseCause(item, point) {
    var topic = point && point.topic;
    var isChinese = point && (point.subject === "chinese" || /^c\d-/.test(String(point.id || "")));
    var text = [
      item && item.cause,
      item && item.text,
      item && item.question && item.question.text,
      item && item.explanation,
      topic
    ].map(normalizeText).join(" ");

    if (isChinese) {
      if (/拼音|声调|字音|字形|词|偏旁|量词|多音|形近|近义|反义|搭配/.test(text) || ["pinyin", "character", "word"].includes(topic)) return "字词基础";
      if (/阅读|短文|概括|诗|文言|信息|中心|人物|情节|资料|名著|观点|策略/.test(text) || ["reading", "poem"].includes(topic)) return "阅读理解";
      if (/句|标点|表达|习作|写话|病句|应用文|口语|修辞/.test(text) || ["sentence", "punctuation", "writing"].includes(topic)) return "表达规范";
      return "不会做";
    }

    if (/干扰|无关|多余|背景|误导|只问|实际/.test(text)) return "干扰条件";
    if (/读题|理解|条件|关系|先求|问什么|必要/.test(text) || topic === "reading" || topic === "word") return "读题理解";
    if (/单位|概念|公式|周长|面积|体积|比例|百分|分数|角|圆|图形/.test(text) || ["geometry", "unit", "ratio", "percent", "fraction"].includes(topic)) return "概念单位";
    if (/计算|粗心|口算|竖式|进位|退位|小数点|口诀/.test(text) || ["addsub", "muldiv", "decimal", "vertical", "mixed", "twostep"].includes(topic)) return "计算粗心";
    return "不会做";
  }

  function adviceForCause(cause, point) {
    var label = point && (point.short || point.label) || "当前知识点";
    var map = {
      "计算粗心": "下一轮先少量慢练，要求写清关键中间数，再做速度。",
      "读题理解": "先圈问题和必要条件，把无关数字划掉，再列第一步。",
      "概念单位": "先复述公式或单位关系，再代入数字，特别检查单位是否统一。",
      "干扰条件": "读完后先说哪些条件不用，避免看到数字就计算。",
      "字词基础": "先读准字音、看清字形，再放回句子里理解词语。",
      "阅读理解": "先回到原文定位依据，再用完整句概括答案。",
      "表达规范": "先检查句子是否通顺，再看标点、顺序和表达是否完整。",
      "不会做": "先做同类基础题，必要时看一步提示，再回到原题。"
    };
    return label + "：" + (map[cause] || map["不会做"]);
  }

  function relevantMistakes(profile, pointId, pointMap, limit) {
    var history = list(profile && profile.history)
      .filter(function (item) { return !item.correct && (!pointId || item.pointId === pointId); })
      .slice(0, limit || 80);
    var wrongbook = list(profile && profile.wrongbook)
      .filter(function (item) { return !pointId || item.question && item.question.pointId === pointId; })
      .map(function (item) {
        return {
          pointId: item.question && item.question.pointId,
          cause: item.cause,
          text: item.question && item.question.text,
          question: item.question
        };
      });
    return history.concat(wrongbook).map(function (item) {
      return { item: item, point: pointFor(pointMap, item) };
    });
  }

  function causeBreakdown(profile, pointMap, options) {
    var opts = options || {};
    var counts = {};
    relevantMistakes(profile, opts.pointId, pointMap, opts.limit).forEach(function (entry) {
      var cause = diagnoseCause(entry.item, entry.point);
      counts[cause] = (counts[cause] || 0) + 1;
    });
    return Object.keys(counts).map(function (cause) {
      return { cause: cause, count: counts[cause] };
    }).sort(function (a, b) {
      var labels = Array.isArray(opts.causes) ? opts.causes : (CHINESE_CAUSE_LABELS.includes(a.cause) || CHINESE_CAUSE_LABELS.includes(b.cause) ? CHINESE_CAUSE_LABELS : CAUSE_LABELS);
      return b.count - a.count || labels.indexOf(a.cause) - labels.indexOf(b.cause);
    });
  }

  function buildWeakPointInsights(bank, profile, options) {
    var opts = options || {};
    var points = list(opts.points || bank && bank.points);
    var pointMap = opts.pointMap || (bank && bank.pointMap) || {};
    var grade = Number(opts.grade || profile && profile.grade) || 1;
    var limit = Number(opts.limit) || 3;
    var recent = list(profile && profile.history).slice(0, 50);

    return points
      .filter(function (point) { return Number(point.grade) === grade; })
      .map(function (point) {
        var mastery = profile && profile.mastery && profile.mastery[point.id] || {};
        var attempts = Number(mastery.attempts) || recent.filter(function (item) { return item.pointId === point.id; }).length;
        var correct = Number(mastery.correct) || recent.filter(function (item) { return item.pointId === point.id && item.correct; }).length;
        var wrongs = list(profile && profile.wrongbook).filter(function (item) {
          return item.question && item.question.pointId === point.id;
        }).length;
        var recentWrong = recent.filter(function (item) { return item.pointId === point.id && !item.correct; }).length;
        var accuracy = attempts ? Math.round(correct / Math.max(1, attempts) * 100) : 0;
        var causes = causeBreakdown(profile, pointMap, { pointId: point.id, limit: 40 });
        var mainCause = causes[0] && causes[0].cause || (attempts ? "不会做" : "读题理解");
        var score = wrongs * 4 + recentWrong * 3 + (attempts ? Math.max(0, 80 - accuracy) / 12 : 2);
        return {
          point: point,
          pointId: point.id,
          label: point.label,
          attempts: attempts,
          accuracy: accuracy,
          wrongs: wrongs,
          recentWrong: recentWrong,
          mainCause: mainCause,
          advice: adviceForCause(mainCause, point),
          score: score
        };
      })
      .sort(function (a, b) {
        return b.score - a.score || b.wrongs - a.wrongs || a.pointId.localeCompare(b.pointId);
      })
      .slice(0, limit);
  }

  function buildParentSuggestions(bank, profile, options) {
    var insights = buildWeakPointInsights(bank, profile, { limit: 3, ...(options || {}) });
    if (!insights.length) {
      return ["先完成一轮 6-10 题，积累足够记录后再做精准建议。"];
    }
    return insights.map(function (item) {
      return item.advice;
    });
  }

  window.MathCampLearningInsights = {
    CAUSE_LABELS,
    CHINESE_CAUSE_LABELS,
    diagnoseCause,
    adviceForCause,
    causeBreakdown,
    buildWeakPointInsights,
    buildParentSuggestions
  };
})();
