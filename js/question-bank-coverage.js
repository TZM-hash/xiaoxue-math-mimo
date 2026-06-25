(function () {
  "use strict";

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function topicCounts(points) {
    return points.reduce(function (acc, point) {
      var topic = point.topic || "unknown";
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {});
  }

  function pointQuestionTypes(point) {
    return list(point && point.curriculum && point.curriculum.questionTypes).filter(Boolean);
  }

  function gradeSummary(points, grade) {
    var gradePoints = points.filter(function (point) { return Number(point.grade) === Number(grade); });
    var questionTypes = unique(gradePoints.flatMap(pointQuestionTypes));
    var topics = topicCounts(gradePoints);
    return {
      grade: Number(grade),
      totalPoints: gradePoints.length,
      topics: topics,
      topicCount: Object.keys(topics).length,
      questionTypes: questionTypes,
      questionTypeCount: questionTypes.length,
      geometryPoints: gradePoints.filter(function (point) { return point.topic === "geometry"; }).length,
      readingPoints: gradePoints.filter(function (point) { return point.topic === "reading"; }).length,
      thinkingPoints: gradePoints.filter(function (point) { return point.topic === "thinking"; }).length,
      wordPoints: gradePoints.filter(function (point) { return point.topic === "word"; }).length,
      points: gradePoints.map(function (point) {
        return {
          id: point.id,
          label: point.label,
          topic: point.topic,
          questionTypes: pointQuestionTypes(point)
        };
      })
    };
  }

  function coverageGaps(summary) {
    var gaps = [];
    summary.grades.forEach(function (grade) {
      if (!grade.geometryPoints) gaps.push({ level: "high", grade: grade.grade, message: "missing geometry point" });
      if (!grade.readingPoints) gaps.push({ level: "high", grade: grade.grade, message: "missing reading point" });
      if (!grade.thinkingPoints) gaps.push({ level: "high", grade: grade.grade, message: "missing thinking point" });
      if (grade.totalPoints < 8) gaps.push({ level: "medium", grade: grade.grade, message: "too few knowledge points" });
      if (grade.questionTypeCount < 18) gaps.push({ level: "medium", grade: grade.grade, message: "question type variety is thin" });
      grade.points.forEach(function (point) {
        if (point.questionTypes.length < 2) {
          gaps.push({ level: "low", grade: grade.grade, pointId: point.id, message: "point has fewer than 2 tagged question types" });
        }
      });
    });
    return gaps;
  }

  function buildCoverageReport(bank) {
    var questionBank = bank || window.MathCampQuestionBank || {};
    var points = list(questionBank.points);
    var grades = list(questionBank.grades).length ? questionBank.grades : unique(points.map(function (point) { return point.grade; }));
    var summaries = grades.map(function (grade) { return gradeSummary(points, grade); });
    var allQuestionTypes = unique(points.flatMap(pointQuestionTypes));
    var summary = {
      generatedAt: new Date().toISOString(),
      totalPoints: points.length,
      totalGrades: summaries.length,
      totalTopics: Object.keys(topicCounts(points)).length,
      totalQuestionTypes: allQuestionTypes.length,
      grades: summaries
    };
    summary.gaps = coverageGaps(summary);
    return summary;
  }

  function formatCoverageReport(report) {
    var lines = [
      "Question bank coverage",
      "grade | points | topics | q-types | geometry | reading | thinking",
      "----- | ------ | ------ | ------- | -------- | ------- | --------"
    ];
    report.grades.forEach(function (grade) {
      lines.push([
        grade.grade,
        grade.totalPoints,
        grade.topicCount,
        grade.questionTypeCount,
        grade.geometryPoints,
        grade.readingPoints,
        grade.thinkingPoints
      ].join(" | "));
    });
    var high = report.gaps.filter(function (gap) { return gap.level === "high"; }).length;
    var medium = report.gaps.filter(function (gap) { return gap.level === "medium"; }).length;
    var low = report.gaps.filter(function (gap) { return gap.level === "low"; }).length;
    lines.push("");
    lines.push("gaps: high=" + high + ", medium=" + medium + ", low=" + low);
    return lines.join("\n");
  }

  window.MathCampQuestionBankCoverage = {
    buildCoverageReport,
    formatCoverageReport,
    coverageGaps
  };
})();
