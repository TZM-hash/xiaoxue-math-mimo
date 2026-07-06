(function () {
  function externalQuestion(deps, point, options) {
    if (!window.MathCampExternalQuestionSeeds) return null;
    if (options && options.strict && !options.preferExternal) return null;
    var shouldUse = Boolean(options && options.preferExternal);
    if (!shouldUse && !(options && options.strict)) shouldUse = Math.random() < 0.16;
    if (!shouldUse) return null;
    return window.MathCampExternalQuestionSeeds.makeQuestion(deps || {}, point, options || {});
  }

  function makeQuestion(deps, point, options) {
    var external = externalQuestion(deps, point, options || {});
    if (external) return deps.ensureQuestionMatchesRule(point, external, options || {});
    if ((point && point.subject === "chinese") || /^c\d-/.test(String(point && point.id || ""))) {
      return window.MathCampChineseQuestionGenerator.makeQuestion(deps || {}, point, options || {});
    }
    if ((point && point.subject === "english") || /^e\d-/.test(String(point && point.id || ""))) {
      return window.MathCampEnglishQuestionGenerator.makeQuestion(deps || {}, point, options || {});
    }
    if ((point && point.subject === "science") || /^s\d-/.test(String(point && point.id || ""))) {
      return window.MathCampScienceQuestionGenerator.makeQuestion(deps || {}, point, options || {});
    }
    var profile = deps.activeProfile();
    var level = deps.state.adaptive ? deps.masteryFor(profile, point.id).level : 2;
    var makers = deps.makers;
    var allowTopicVariation = point.id !== "g2-100-add";

    if (allowTopicVariation && !options.strict && Math.random() < 0.26) {
      var supplemental = deps.makeSupplementalQuestion(point, level);
      if (supplemental) return deps.ensureQuestionMatchesRule(point, supplemental, options);
    }
    if (allowTopicVariation && !options.strict && Math.random() < 0.38) {
      var extra = deps.makeExtraQuestion(point, level);
      if (extra) return deps.ensureQuestionMatchesRule(point, extra, options);
    }
    return deps.ensureQuestionMatchesRule(point, makers[point.topic](point, level), options);
  }

  window.MathCampQuestionGenerator = {
    makeQuestion: makeQuestion
  };
})();
