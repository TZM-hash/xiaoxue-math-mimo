(function () {
  function buildReportModel(deps, profile, options) {
    var history = Array.isArray(profile.history) ? profile.history : [];
    var today = history.filter(function (item) { return item.date === deps.todayKey(); });
    var correct = history.filter(function (item) { return item.correct; }).length;
    var accuracy = history.length ? Math.round(correct / history.length * 100) : 0;
    var weak = deps.weakestPoints(6).filter(function (point) {
      return deps.masteryAccuracy(profile, point.id) < 0.78 ||
        (Array.isArray(profile.wrongbook) && profile.wrongbook.some(function (item) {
          return item.question && item.question.pointId === point.id;
        }));
    });
    var shownPoints = options.mobileReport
      ? deps.availablePoints(profile.grade).slice(0, 4)
      : deps.availablePoints(profile.grade);
    var causeCounts = {};

    history.filter(function (item) { return !item.correct; }).forEach(function (item) {
      var cause = deps.normalizeCause(item.cause);
      causeCounts[cause] = (causeCounts[cause] || 0) + 1;
    });

    return {
      history: history,
      today: today,
      accuracy: accuracy,
      weak: weak,
      shownPoints: shownPoints,
      causeRows: Object.entries(causeCounts).sort(function (a, b) { return b[1] - a[1]; }),
      masteredForGrade: (profile.masteredWrong || []).filter(function (item) {
        return Number(item.question && (item.question.grade || profile.grade)) === Number(profile.grade);
      })
    };
  }

  window.MathCampReport = {
    buildReportModel: buildReportModel
  };
})();
