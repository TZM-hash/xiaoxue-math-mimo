(function () {
  function buildAdaptiveQuestionSet(deps, count, preferred) {
    var profile = deps.activeProfile();
    var total = deps.clamp(Number(count) || deps.state.setSize || 10, 1, 80);
    var grade = Number(profile.grade || deps.state.grade);
    var selected = [];
    var usedSignatures = new Set();
    var previousSignature = "";
    var pick = typeof deps.createRoundQuestionPicker === "function" ? deps.createRoundQuestionPicker(preferred) : null;
    var due = deps.dueWrongbook(profile, grade);
    var dueVariantCount = Math.min(due.length, Math.max(0, Math.floor(total * 0.25)));
    function addQuestion(question) {
      if (!question) return;
      selected.push(question);
      previousSignature = deps.signature(question);
      usedSignatures.add(previousSignature);
    }
    function makeForPoint(point) {
      if (typeof deps.makeDistinctQuestionForPoint === "function") {
        return deps.makeDistinctQuestionForPoint(point, preferred, { usedSignatures: usedSignatures, previousSignature: previousSignature, pick: pick });
      }
      return deps.makeStrictQuestionForPoint(point, preferred);
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

    var weak = deps.weakestPoints(4).filter(function (point) { return point.grade === grade; });
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
      addQuestion(makeForPoint(deps.choosePoint()));
    }

    return deps.shuffle(selected).slice(0, total);
  }

  window.MathCampPracticeEngine = {
    buildAdaptiveQuestionSet: buildAdaptiveQuestionSet
  };
})();
