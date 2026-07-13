(function () {
  var MAX_SET_SIZE = 100;

  function buildAdaptiveQuestionSet(deps, count, preferred) {
    var profile = deps.activeProfile();
    var total = deps.clamp(Number(count) || deps.state.setSize || 10, 1, MAX_SET_SIZE);
    var grade = Number(profile.grade || deps.state.grade);
    var selected = [];
    var usedSignatures = new Set();
    var usedFamilyKeys = new Set();
    var avoidRepeatKeys = deps.avoidRepeatKeys instanceof Set ? deps.avoidRepeatKeys : new Set();
    var recentFamilyKeys = deps.recentFamilyKeys instanceof Set ? deps.recentFamilyKeys : new Set();
    var recentPointIds = deps.recentPointIds instanceof Set ? deps.recentPointIds : new Set();
    var externalChanceForPoint = typeof deps.externalQuestionChanceForPoint === "function"
      ? deps.externalQuestionChanceForPoint
      : function () { return typeof deps.externalQuestionChance === "number" ? deps.externalQuestionChance : undefined; };
    var previousSignature = "";
    var pick = typeof deps.createRoundQuestionPicker === "function" ? deps.createRoundQuestionPicker(preferred) : null;
    var dailyPlan = deps.dailyPlan && typeof deps.dailyPlan === "object" ? deps.dailyPlan : null;
    var allocations = dailyPlan && dailyPlan.allocations || {};
    var due = deps.dueWrongbook(profile, grade);
    var reviewQuota = dailyPlan ? Math.max(0, Number(allocations.review) || 0) : Math.max(0, Math.floor(total * 0.25));
    var dueVariantCount = Math.min(due.length, reviewQuota);
    function termBucket(point) {
      var term = String(point && point.curriculum && point.curriculum.term || "");
      var upper = term.indexOf("上") >= 0;
      var lower = term.indexOf("下") >= 0;
      if (upper && !lower) return "upper";
      if (lower && !upper) return "lower";
      return "year";
    }
    function interleaveTerms(points) {
      var pools = { upper: [], lower: [], year: [] };
      (points || []).forEach(function (point) { pools[termBucket(point)].push(point); });
      if (!pools.upper.length || !pools.lower.length) return (points || []).slice();
      var ordered = [];
      var index = 0;
      while (index < pools.upper.length || index < pools.lower.length || index < pools.year.length) {
        if (index < pools.upper.length) ordered.push(pools.upper[index]);
        if (index < pools.lower.length) ordered.push(pools.lower[index]);
        if (index % 2 === 0 && index / 2 < pools.year.length) ordered.push(pools.year[index / 2]);
        index += 1;
      }
      pools.year.slice(Math.ceil(index / 2)).forEach(function (point) { ordered.push(point); });
      return ordered;
    }
    var gradePoints = interleaveTerms(typeof deps.availablePoints === "function" ? deps.availablePoints(grade) : []);
    var freshGradePoints = gradePoints.filter(function (point) { return !recentPointIds.has(point.id); });
    var freshFillOffset = 0;
    function addQuestion(question) {
      if (!question) return;
      selected.push(question);
      previousSignature = deps.signature(question);
      usedSignatures.add(previousSignature);
      if (question.learningMeta && question.learningMeta.familyKey) usedFamilyKeys.add(question.learningMeta.familyKey);
    }
    function makeForPoint(point, options) {
      options = options || {};
      if (typeof deps.makeDistinctQuestionForPoint === "function") {
        return deps.makeDistinctQuestionForPoint(point, preferred, {
          usedSignatures: usedSignatures,
          usedFamilyKeys: usedFamilyKeys,
          previousSignature: previousSignature,
          pick: pick,
          avoidRepeatKeys: avoidRepeatKeys,
          recentFamilyKeys: recentFamilyKeys,
          targetDifficulty: typeof deps.targetDifficultyForPoint === "function" ? deps.targetDifficultyForPoint(point) : undefined,
          chainStage: options.chainStage,
          preferredFamilyKey: options.preferredFamilyKey,
          avoidFamilyKey: options.avoidFamilyKey,
          externalChance: externalChanceForPoint(point)
        });
      }
      return deps.makeStrictQuestionForPoint(point, preferred);
    }
    function freshFillPoint() {
      if (freshGradePoints.length && freshFillOffset < freshGradePoints.length) {
        var fresh = freshGradePoints[freshFillOffset % freshGradePoints.length];
        freshFillOffset += 1;
        return fresh;
      }
      return deps.choosePoint();
    }

    due.slice(0, dueVariantCount).forEach(function (item) {
      var point = deps.pointMap[item && item.question && item.question.pointId];
      if (!point || point.grade !== grade) return;
      var chainStage = item.chainStage || "scaffold";
      var originalFamilyKey = typeof deps.questionFamilyKey === "function" ? deps.questionFamilyKey(item.question || {}) : "";
      var dueQuestion = makeForPoint(point, {
        chainStage: chainStage,
        preferredFamilyKey: chainStage === "sameModel" ? originalFamilyKey : "",
        avoidFamilyKey: chainStage === "transfer" ? originalFamilyKey : ""
      });
      if (!dueQuestion) return;
      addQuestion({
        ...dueQuestion,
        planSegment: dailyPlan ? "review" : undefined,
        reviewSource: "due",
        reviewSourceWrongId: item.id,
        reviewChainStage: chainStage
      });
    });

    var weak = interleaveTerms(deps.weakestPoints(Math.max(4, total)).filter(function (point) { return point.grade === grade; }));
    if (recentPointIds.size && weak.length > 1) {
      weak = weak.filter(function (point) { return !recentPointIds.has(point.id); })
        .concat(weak.filter(function (point) { return recentPointIds.has(point.id); }));
    }
    var reviewShortfall = dailyPlan ? Math.max(0, reviewQuota - selected.length) : 0;
    var weakQuota = dailyPlan ? Math.max(0, Number(allocations.weak) || 0) + reviewShortfall : Math.max(2, Math.ceil(total * 0.45));
    var weakTarget = Math.min(total - selected.length, weakQuota);
    var weakStop = selected.length + weakTarget;
    var weakAttempts = 0;
    while (selected.length < weakStop && weak.length && weakAttempts < total * 8) {
      weakAttempts += 1;
      var weakQuestion = makeForPoint(weak[selected.length % weak.length]);
      if (!weakQuestion) continue;
      addQuestion({
        ...weakQuestion,
        planSegment: dailyPlan ? "weak" : undefined,
        reviewSource: "weak"
      });
    }

    function addFromPointPool(pool, quota, segment, source) {
      if (!dailyPlan || !pool.length || quota <= 0) return;
      var target = Math.min(total, selected.length + quota);
      var attempts = 0;
      while (selected.length < target && attempts < total * 8) {
        var point = pool[attempts % pool.length];
        attempts += 1;
        var question = makeForPoint(point);
        if (!question) continue;
        addQuestion({ ...question, planSegment: segment, reviewSource: source });
      }
    }

    if (dailyPlan) {
      var currentPoints = gradePoints.filter(function (point) { return termBucket(point) === dailyPlan.term; });
      if (!currentPoints.length) currentPoints = gradePoints.filter(function (point) { return termBucket(point) !== "year"; });
      addFromPointPool(currentPoints.length ? currentPoints : gradePoints, Math.max(0, Number(allocations.current) || 0), "current", "current-term");

      var challengePoints = gradePoints.filter(function (point) {
        return point.sourceType === "abilityLine" || ["appendix", "thinking", "reading"].includes(String(point.topic || ""));
      });
      addFromPointPool(challengePoints.length ? challengePoints : weak.slice().reverse(), Math.max(0, Number(allocations.challenge) || 0), "challenge", "challenge");
    }

    var fillAttempts = 0;
    while (selected.length < total && fillAttempts < total * 12) {
      fillAttempts += 1;
      var fillQuestion = makeForPoint(freshFillPoint());
      addQuestion(dailyPlan && fillQuestion ? { ...fillQuestion, planSegment: "weak", reviewSource: "weak-fill" } : fillQuestion);
    }

    return deps.shuffle(selected).slice(0, total);
  }

  function buildDailyQuestionSet(deps, count, preferred, plan) {
    return buildAdaptiveQuestionSet({ ...deps, dailyPlan: plan || deps.dailyPlan || {} }, count, preferred);
  }

  window.MathCampPracticeEngine = {
    buildAdaptiveQuestionSet: buildAdaptiveQuestionSet,
    buildDailyQuestionSet: buildDailyQuestionSet
  };
})();
