(function () {
  "use strict";

  const root = document.documentElement;
  let themeTimer = 0;
  let feedbackTimer = 0;
  let petTimer = 0;
  let reducedMotionQuery = null;

  function classifyPerformance(capabilities = {}) {
    const hardwareConcurrency = Number(capabilities.hardwareConcurrency ?? navigator.hardwareConcurrency ?? 0);
    const deviceMemory = Number(capabilities.deviceMemory ?? navigator.deviceMemory ?? 0);
    const saveData = Boolean(capabilities.saveData ?? navigator.connection?.saveData);
    const androidWebView = capabilities.androidWebView ?? root.classList.contains("android-webview");
    if (saveData || androidWebView || (deviceMemory > 0 && deviceMemory <= 4) || (hardwareConcurrency > 0 && hardwareConcurrency <= 4)) return "low";
    if ((deviceMemory > 0 && deviceMemory <= 6) || (hardwareConcurrency > 0 && hardwareConcurrency <= 6)) return "medium";
    return "high";
  }

  function applyPerformanceClass() {
    const level = classifyPerformance();
    root.classList.remove("effects-performance-low", "effects-performance-medium");
    if (level !== "high") root.classList.add(`effects-performance-${level}`);
    root.dataset.effectPerformance = level;
    return level;
  }

  function syncReducedMotion() {
    const reduced = Boolean(reducedMotionQuery?.matches);
    root.classList.toggle("effects-reduced-motion", reduced);
    return reduced;
  }

  function beginThemeTransition() {
    root.classList.remove("theme-transitioning");
    void root.offsetWidth;
    root.classList.add("theme-transitioning");
    window.clearTimeout(themeTimer);
    themeTimer = window.setTimeout(() => root.classList.remove("theme-transitioning"), 460);
  }

  function setPetReaction(reaction = "idle", duration = 900) {
    const assistant = document.getElementById("floatingPetAssistant");
    if (!assistant) return;
    assistant.dataset.reaction = reaction;
    window.clearTimeout(petTimer);
    if (reaction !== "idle" && duration > 0) {
      petTimer = window.setTimeout(() => {
        if (!assistant.classList.contains("is-dragging")) assistant.dataset.reaction = "idle";
      }, duration);
    }
  }

  function syncAnswerFeedback() {
    const feedback = document.getElementById("feedback");
    const card = document.getElementById("practiceCard");
    if (!feedback || !card) return;
    const kind = feedback.classList.contains("good") ? "good" : feedback.classList.contains("bad") ? "bad" : "";
    if (!kind) return;
    card.classList.remove("answer-feedback-good", "answer-feedback-bad");
    void card.offsetWidth;
    card.classList.add(`answer-feedback-${kind}`);
    setPetReaction(kind === "good" ? "correct" : "wrong", kind === "good" ? 920 : 760);
    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(() => card.classList.remove("answer-feedback-good", "answer-feedback-bad"), 720);
  }

  function wrapLeadingIcon(element) {
    if (!element || element.dataset.iconNormalized === "true") return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode();
    if (!textNode) return;
    const match = textNode.nodeValue.match(/^(\s*)([\p{Extended_Pictographic}\u2600-\u27BF])\s*/u);
    element.dataset.iconNormalized = "true";
    if (!match) return;
    const icon = document.createElement("span");
    icon.className = "ui-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = match[2];
    textNode.nodeValue = `${match[1]}${textNode.nodeValue.slice(match[0].length)}`;
    textNode.parentNode.insertBefore(icon, textNode);
  }

  function normalizeIcons(scope = document) {
    const selector = "button, .tab-btn, .pill, .tag";
    if (scope.matches?.(selector)) wrapLeadingIcon(scope);
    scope.querySelectorAll?.(selector).forEach(wrapLeadingIcon);
  }

  function observeTheme() {
    new MutationObserver((records) => {
      if (records.some((record) => record.attributeName === "data-theme")) beginThemeTransition();
    }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  }

  function observeFeedback() {
    const feedback = document.getElementById("feedback");
    if (!feedback) return;
    new MutationObserver(syncAnswerFeedback).observe(feedback, { attributes: true, attributeFilter: ["class"] });
  }

  function observeDynamicUI() {
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        normalizeIcons(node);
        if (node.matches(".reward-ribbon") || node.querySelector(".reward-ribbon")) setPetReaction("reward", 1100);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  function bindPetActions() {
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-floating-pet-action='hint'], #petHintBtn")) setPetReaction("hint", 820);
    });
  }

  function init() {
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionQuery.addEventListener?.("change", syncReducedMotion);
    syncReducedMotion();
    applyPerformanceClass();
    normalizeIcons();
    observeTheme();
    observeFeedback();
    observeDynamicUI();
    bindPetActions();
    const assistant = document.getElementById("floatingPetAssistant");
    if (assistant && !assistant.dataset.reaction) assistant.dataset.reaction = "idle";
    root.classList.add("visual-polish-ready");
  }

  window.MathCampVisualPolish = {
    classifyPerformance,
    applyPerformanceClass,
    beginThemeTransition,
    setPetReaction,
    syncAnswerFeedback
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
