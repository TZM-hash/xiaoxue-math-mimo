(function () {
  function buildAdaptiveQuestionSet(deps, count, preferred) {
    var profile = deps.activeProfile();
    var total = deps.clamp(Number(count) || deps.state.setSize || 10, 1, 80);
    var grade = Number(profile.grade || deps.state.grade);
    var selected = [];
    var usedSignatures = new Set();
    var avoidRepeatKeys = deps.avoidRepeatKeys instanceof Set ? deps.avoidRepeatKeys : new Set();
    var recentPointIds = deps.recentPointIds instanceof Set ? deps.recentPointIds : new Set();
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
    }
    function makeForPoint(point) {
      if (typeof deps.makeDistinctQuestionForPoint === "function") {
        return deps.makeDistinctQuestionForPoint(point, preferred, { usedSignatures: usedSignatures, previousSignature: previousSignature, pick: pick, avoidRepeatKeys: avoidRepeatKeys });
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
      var dueQuestion = makeForPoint(point);
      if (!dueQuestion) return;
      addQuestion({
        ...dueQuestion,
        reviewSource: "due",
        reviewSourceWrongId: item.id
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
