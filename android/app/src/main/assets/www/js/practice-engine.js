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
    var due = deps.dueWrongbook(profile, grade);
    var dueVariantCount = Math.min(due.length, Math.max(0, Math.floor(total * 0.25)));
    var gradePoints = typeof deps.availablePoints === "function" ? deps.availablePoints(grade) : [];
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
        reviewSource: "due",
        reviewSourceWrongId: item.id,
        reviewChainStage: chainStage
      });
    });

    var weak = deps.weakestPoints(Math.max(4, total)).filter(function (point) { return point.grade === grade; });
    if (recentPointIds.size && weak.length > 1) {
      weak = weak.filter(function (point) { return !recentPointIds.has(point.id); })
        .concat(weak.filter(function (point) { return recentPointIds.has(point.id); }));
    }
    var weakTarget = Math.min(total - selected.length, Math.max(2, Math.ceil(total * 0.45)));
    var weakAttempts = 0;
    while (selected.length < dueVariantCount + weakTarget && weak.length && weakAttempts < total * 8) {
      weakAttempts += 1;
      var weakQuestion = makeForPoint(weak[selected.length % weak.length]);
      if (!weakQuestion) continue;
      addQuestion({
        ...weakQuestion,
        reviewSource: "weak"
      });
    }

    var fillAttempts = 0;
    while (selected.length < total && fillAttempts < total * 12) {
      fillAttempts += 1;
      addQuestion(makeForPoint(freshFillPoint()));
    }

    return deps.shuffle(selected).slice(0, total);
  }

  window.MathCampPracticeEngine = {
    buildAdaptiveQuestionSet: buildAdaptiveQuestionSet
  };
})();
