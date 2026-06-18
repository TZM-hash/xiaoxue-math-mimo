(function () {
  function buildAdaptiveQuestionSet(deps, count, preferred) {
    var profile = deps.activeProfile();
    var total = deps.clamp(Number(count) || deps.state.setSize || 10, 1, 80);
    var grade = Number(profile.grade || deps.state.grade);
    var selected = [];
    var usedSignatures = new Set();
    var due = deps.dueWrongbook(profile, grade);
    var dueVariantCount = Math.min(due.length, Math.max(0, Math.floor(total * 0.25)));

    due.slice(0, dueVariantCount).forEach(function (item) {
      var point = deps.pointMap[item && item.question && item.question.pointId];
      if (!point || point.grade !== grade) return;
      selected.push({
        ...deps.makeStrictQuestionForPoint(point, preferred),
        reviewSource: "due",
        reviewSourceWrongId: item.id
      });
    });

    var weak = deps.weakestPoints(4).filter(function (point) { return point.grade === grade; });
    var weakTarget = Math.min(total - selected.length, Math.max(2, Math.ceil(total * 0.45)));
    while (selected.length < dueVariantCount + weakTarget && weak.length) {
      selected.push({
        ...deps.makeStrictQuestionForPoint(weak[selected.length % weak.length], preferred),
        reviewSource: "weak"
      });
    }

    while (selected.length < total) {
      selected.push(deps.applyQuestionInteraction(deps.makeQuestion(deps.choosePoint()), preferred));
    }

    return deps.shuffle(selected).filter(function (question) {
      var sig = deps.signature(question);
      if (usedSignatures.has(sig)) return false;
      usedSignatures.add(sig);
      return true;
    }).concat(Array.from({ length: total }, function () {
      return deps.applyQuestionInteraction(deps.makeQuestion(deps.choosePoint()), preferred);
    })).slice(0, total);
  }

  window.MathCampPracticeEngine = {
    buildAdaptiveQuestionSet: buildAdaptiveQuestionSet
  };
})();
