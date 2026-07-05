(function () {
  "use strict";

  const SUBJECT_IDS = ["math", "chinese", "english", "science"];
  const SUBJECT_META = {
    chinese: { id: "chinese", label: "语文", short: "语", bankKey: "MathCampChineseQuestionBank" },
    math: { id: "math", label: "数学", short: "数", bankKey: "MathCampQuestionBank" },
    english: { id: "english", label: "英语", short: "英", bankKey: "" },
    science: { id: "science", label: "科学", short: "科", bankKey: "" }
  };

  function safeSubjectId(value) {
    return SUBJECT_IDS.includes(value) ? value : "math";
  }

  function createSubjectState(subjectId, existing) {
    const source = existing && typeof existing === "object" ? existing : {};
    return {
      subjectId: safeSubjectId(subjectId),
      history: Array.isArray(source.history) ? source.history : [],
      wrongbook: Array.isArray(source.wrongbook) ? source.wrongbook : [],
      masteredWrong: Array.isArray(source.masteredWrong) ? source.masteredWrong : [],
      mastery: source.mastery && typeof source.mastery === "object" ? source.mastery : {},
      settings: {
        pointId: "auto",
        setSize: 10,
        adaptive: true,
        dailyGoal: 20,
        answerSpace: "auto",
        answerMode: "auto",
        printTemplate: "practice",
        printOutputMode: "answers",
        inputMethod: "keyboard",
        ...(source.settings || {})
      },
      challenge: source.challenge && typeof source.challenge === "object" ? source.challenge : { gradeLevels: {} }
    };
  }

  function normalizeProfileSubjects(profile) {
    const normalized = { ...(profile || {}) };
    const existing = normalized.subjects && typeof normalized.subjects === "object" ? normalized.subjects : {};
    normalized.subjects = {
      math: createSubjectState("math", existing.math || {
        history: normalized.history,
        wrongbook: normalized.wrongbook,
        masteredWrong: normalized.masteredWrong,
        mastery: normalized.mastery,
        settings: normalized.settings,
        challenge: normalized.rewards && normalized.rewards.challenge
      }),
      chinese: createSubjectState("chinese", existing.chinese),
      english: createSubjectState("english", existing.english),
      science: createSubjectState("science", existing.science)
    };
    return normalized;
  }

  function subjectState(profile, subjectId) {
    const safe = safeSubjectId(subjectId);
    if (!profile.subjects) profile.subjects = normalizeProfileSubjects(profile).subjects;
    if (!profile.subjects[safe]) profile.subjects[safe] = createSubjectState(safe);
    return profile.subjects[safe];
  }

  function bindSubjectState(profile, subjectId) {
    const state = subjectState(profile, subjectId);
    if (Array.isArray(profile.history) && profile.history !== state.history && profile.history.length && !state.history.length) state.history = profile.history;
    if (Array.isArray(profile.wrongbook) && profile.wrongbook !== state.wrongbook && profile.wrongbook.length && !state.wrongbook.length) state.wrongbook = profile.wrongbook;
    if (Array.isArray(profile.masteredWrong) && profile.masteredWrong !== state.masteredWrong && profile.masteredWrong.length && !state.masteredWrong.length) state.masteredWrong = profile.masteredWrong;
    if (profile.mastery && profile.mastery !== state.mastery && Object.keys(profile.mastery).length && !Object.keys(state.mastery || {}).length) state.mastery = profile.mastery;
    if (profile.settings && profile.settings !== state.settings && Object.keys(profile.settings).length) state.settings = { ...state.settings, ...profile.settings };
    profile.history = state.history;
    profile.wrongbook = state.wrongbook;
    profile.masteredWrong = state.masteredWrong;
    profile.mastery = state.mastery;
    profile.settings = state.settings;
    return state;
  }

  function syncBoundSubject(profile, subjectId) {
    if (!profile || !profile.subjects) return null;
    const state = subjectState(profile, subjectId);
    state.history = Array.isArray(profile.history) ? profile.history : state.history;
    state.wrongbook = Array.isArray(profile.wrongbook) ? profile.wrongbook : state.wrongbook;
    state.masteredWrong = Array.isArray(profile.masteredWrong) ? profile.masteredWrong : state.masteredWrong;
    state.mastery = profile.mastery && typeof profile.mastery === "object" ? profile.mastery : state.mastery;
    state.settings = profile.settings && typeof profile.settings === "object" ? profile.settings : state.settings;
    return state;
  }

  function subjectBank(subjectId) {
    const meta = SUBJECT_META[safeSubjectId(subjectId)];
    return meta.bankKey ? window[meta.bankKey] : null;
  }

  window.MathCampSubjects = {
    SUBJECT_IDS,
    SUBJECT_META,
    safeSubjectId,
    createSubjectState,
    normalizeProfileSubjects,
    subjectState,
    bindSubjectState,
    syncBoundSubject,
    subjectBank
  };
})();
