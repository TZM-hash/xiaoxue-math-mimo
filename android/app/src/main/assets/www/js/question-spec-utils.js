(function () {
  "use strict";

  const DEFAULT_LABELS = ["A", "B", "C", "D"];

  function compactList(items) {
    const seen = new Set();
    const result = [];
    (items || []).forEach((item) => {
      const value = String(item || "").trim();
      if (!value || seen.has(value)) return;
      seen.add(value);
      result.push(value);
    });
    return result;
  }

  function shuffleEntries(deps, entries) {
    const list = (entries || []).filter((entry) => entry && String(entry.text || "").trim());
    if (deps && typeof deps.shuffleOptions === "function") return deps.shuffleOptions(list).filter(Boolean);
    if (deps && typeof deps.shuffle === "function") return deps.shuffle(list).filter(Boolean);
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function choiceLayout(deps, spec) {
    const labels = Array.isArray(spec && spec.labels) && spec.labels.length ? spec.labels : DEFAULT_LABELS;
    const sourceOptions = Array.isArray(spec && spec.options)
      ? spec.options
      : [spec && spec.correct, ...((spec && spec.wrongs) || [])];
    const rawCorrectIndex = Number.isInteger(spec && spec.correctIndex) ? spec.correctIndex : 0;
    const correctIndex = Math.max(0, Math.min(rawCorrectIndex, sourceOptions.length - 1));
    const entries = sourceOptions.slice(0, labels.length).map((text, index) => ({
      text: String(text || "").trim(),
      correct: index === correctIndex
    }));
    const options = shuffleEntries(deps || {}, entries);
    const answerIndex = Math.max(0, options.findIndex((option) => option.correct));
    const answer = labels[answerIndex] || labels[0] || "A";
    const answerText = options[answerIndex]?.text || String(sourceOptions[correctIndex] || "").trim();
    const answerLabel = `${answer}. ${answerText}`;
    return {
      options,
      labels,
      answer,
      answerText,
      answerLabel,
      optionText: options.map((option, index) => `${labels[index]}. ${option.text}`).join("\n"),
      acceptedAnswers(extra = []) {
        return compactList([answer, answerText, `${answer}.${answerText}`, answerLabel, ...extra]);
      }
    };
  }

  window.MathCampQuestionSpec = {
    choiceLayout,
    compactList
  };
})();
