(function (root) {
  "use strict";

  const DEFAULT_RATIOS = Object.freeze({ weak: 0.4, review: 0.3, current: 0.2, challenge: 0.1 });
  const SEGMENTS = ["weak", "review", "current", "challenge"];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function allocate(total, ratios = DEFAULT_RATIOS) {
    const count = Math.max(1, Math.floor(Number(total) || 10));
    const weighted = SEGMENTS.map((id, index) => {
      const raw = count * clamp(ratios[id], 0, 1);
      return { id, index, raw, count: Math.floor(raw), remainder: raw - Math.floor(raw) };
    });
    let remaining = count - weighted.reduce((sum, item) => sum + item.count, 0);
    weighted.slice().sort((a, b) => b.remainder - a.remainder || a.index - b.index).forEach((item) => {
      if (remaining <= 0) return;
      weighted[item.index].count += 1;
      remaining -= 1;
    });
    return Object.fromEntries(weighted.map((item) => [item.id, item.count]));
  }

  function currentTerm(date = new Date()) {
    const month = Number(date && typeof date.getMonth === "function" ? date.getMonth() + 1 : 9) || 9;
    return month >= 2 && month <= 7 ? "lower" : "upper";
  }

  function masteryStatus(mastery = {}, context = {}) {
    const attempts = Math.max(0, Number(mastery.attempts) || 0);
    const correct = clamp(mastery.correct, 0, attempts);
    const score = clamp(Number.isFinite(Number(mastery.score)) ? mastery.score : (attempts ? correct / attempts * 100 : 0), 0, 100);
    const accuracy = attempts ? Math.round(correct / attempts * 100) : 0;
    const wrongs = Math.max(0, Number(context.wrongs) || 0);
    const due = Math.max(0, Number(context.due) || 0);
    if (!attempts) return { id: "new", label: "未学习", score, accuracy };
    if (due || wrongs || score < 55 || (attempts >= 3 && accuracy < 70)) return { id: "weak", label: "需要巩固", score, accuracy };
    if (attempts >= 8 && accuracy >= 85 && score >= 78) return { id: "mastered", label: "已掌握", score, accuracy };
    return { id: "learning", label: "学习中", score, accuracy };
  }

  function needsDiagnostic(profile = {}, options = {}) {
    const grade = Number(options.grade || profile.grade) || 1;
    const subject = String(options.subject || "math");
    const history = Array.isArray(profile.history) ? profile.history : [];
    const scoped = history.filter((item) => Number(item.grade || grade) === grade && (!item.subject || item.subject === subject));
    const mastery = profile.mastery && typeof profile.mastery === "object" ? profile.mastery : {};
    const practicedPoints = Object.values(mastery).filter((item) => Number(item && item.attempts) > 0).length;
    return scoped.length < 12 || practicedPoints < 3;
  }

  function buildPlan(options = {}) {
    const profile = options.profile || {};
    const total = clamp(Math.floor(Number(options.setSize) || 10), 4, 100);
    const grade = clamp(Number(options.grade || profile.grade) || 1, 1, 6);
    const subject = String(options.subject || "math");
    const allocations = allocate(total, options.ratios || DEFAULT_RATIOS);
    const diagnostic = needsDiagnostic(profile, { grade, subject });
    const dueCount = Math.max(0, Number(options.dueCount) || 0);
    const term = options.term || currentTerm(options.date);
    return {
      version: 1,
      date: String(options.dateKey || ""),
      grade,
      subject,
      total,
      term,
      mode: diagnostic ? "diagnostic" : "adaptive",
      title: diagnostic ? "起始诊断计划" : "每日智能计划",
      allocations,
      availableReview: Math.min(dueCount, allocations.review),
      segments: [
        { id: "weak", label: diagnostic ? "能力诊断" : "薄弱强化", count: allocations.weak, ratio: 40 },
        { id: "review", label: "间隔复习", count: allocations.review, ratio: 30 },
        { id: "current", label: term === "lower" ? "下册新知" : "上册新知", count: allocations.current, ratio: 20 },
        { id: "challenge", label: "综合挑战", count: allocations.challenge, ratio: 10 }
      ]
    };
  }

  function normalizeStoredPlan(plan, fallback = {}) {
    if (!plan || typeof plan !== "object") return null;
    return buildPlan({
      profile: fallback.profile || {},
      grade: plan.grade || fallback.grade,
      subject: plan.subject || fallback.subject,
      setSize: plan.total || fallback.setSize,
      dateKey: plan.date || fallback.dateKey,
      term: plan.term,
      dueCount: plan.availableReview
    });
  }

  const api = { DEFAULT_RATIOS, allocate, currentTerm, masteryStatus, needsDiagnostic, buildPlan, normalizeStoredPlan };
  root.MathCampDailyLearningPlan = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
