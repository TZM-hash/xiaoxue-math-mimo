(function () {
  "use strict";

  function clampProgress(value, target) {
    const safeTarget = Math.max(1, Number(target) || 1);
    return Math.max(0, Math.min(safeTarget, Number(value) || 0));
  }

  function pct(value, target) {
    return Math.round(clampProgress(value, target) / Math.max(1, Number(target) || 1) * 100);
  }

  function buildTodayRoute(data = {}) {
    const weakTarget = Math.max(3, Number(data.weakTarget) || 8);
    const wrongTarget = Math.max(1, Number(data.wrongTarget) || 3);
    const reviewTarget = Math.max(1, Number(data.reviewTarget) || 3);
    const weakProgress = clampProgress(data.weakProgress, weakTarget);
    const wrongProgress = clampProgress(data.wrongProgress, wrongTarget);
    const reviewProgress = clampProgress(data.reviewProgress, reviewTarget);
    const reviewDue = Number(data.reviewDue || 0);
    const hasWrongbook = Number(data.wrongAvailable || 0) > 0;
    const hasReview = reviewDue > 0;
    const timedDone = Number(data.timedProgress || 0) >= 1;
    const challengeDone = Number(data.challengeProgress || 0) >= 1;

    const steps = [
      {
        id: "review",
        action: "review",
        index: "1",
        title: "复习检查",
        detail: hasReview ? `${reviewProgress}/${reviewTarget} 题 · 到期 ${reviewDue} 题` : "暂无到期错题，保持节奏",
        progress: hasReview ? reviewProgress : 1,
        target: hasReview ? reviewTarget : 1,
        pct: hasReview ? pct(reviewProgress, reviewTarget) : 100,
        complete: !hasReview || reviewProgress >= reviewTarget,
        disabled: !hasReview,
        actionLabel: hasReview ? (reviewProgress >= reviewTarget ? "继续复习" : "开始复习") : "已完成"
      },
      {
        id: "weak",
        action: "weak",
        index: "2",
        title: "薄弱点练习",
        detail: data.weakPoint ? `${data.weakPoint.label} · ${weakProgress}/${weakTarget} 题` : `${weakProgress}/${weakTarget} 题`,
        progress: weakProgress,
        target: weakTarget,
        pct: pct(weakProgress, weakTarget),
        complete: weakProgress >= weakTarget,
        disabled: false,
        actionLabel: weakProgress >= weakTarget ? "再练一组" : "开始"
      },
      {
        id: "wrongbook",
        action: "wrongbook",
        index: "3",
        title: "错题检查",
        detail: hasWrongbook ? `${wrongProgress}/${wrongTarget} 题 · 错题本 ${data.wrongAvailable} 题` : "暂无错题，保持今日节奏",
        progress: hasWrongbook ? wrongProgress : 1,
        target: hasWrongbook ? wrongTarget : 1,
        pct: hasWrongbook ? pct(wrongProgress, wrongTarget) : 100,
        complete: !hasWrongbook || wrongProgress >= wrongTarget,
        disabled: !hasWrongbook,
        actionLabel: hasWrongbook ? (wrongProgress >= wrongTarget ? "继续订正" : "去订正") : "已清空"
      },
      {
        id: timedDone ? "challenge" : "timed",
        action: timedDone ? "challenge" : "timed",
        index: "4",
        title: "限时小测",
        detail: timedDone
          ? (challengeDone ? "今天已挑战，继续冲关" : "用一关检查今天状态")
          : "10 题 / 5 分钟，做一次收尾",
        progress: timedDone || challengeDone ? 1 : 0,
        target: 1,
        pct: timedDone || challengeDone ? 100 : 0,
        complete: timedDone || challengeDone,
        disabled: false,
        actionLabel: timedDone ? "去闯关" : "开始小测"
      }
    ];

    const current = steps.find((step) => !step.complete && !step.disabled);
    return steps.map((step) => ({ ...step, current: current ? step.id === current.id : false }));
  }

  window.MathCampHomeRoute = { buildTodayRoute };
})();
