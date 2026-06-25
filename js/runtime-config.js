(function () {
  "use strict";

  var ANDROID_DEFAULT_EFFECTS = Object.freeze({
    cursorEffects: false,
    seasonEffects: false,
    themeBackgrounds: false,
    catInteraction: true,
    questionEnhancements: true,
    microInteractions: true,
    uiAnimations: false,
    rewardParticles: false,
    focusBlur: false,
    ambientAnimations: false
  });

  var WEB_DEFAULT_EFFECTS = Object.freeze({
    cursorEffects: true,
    seasonEffects: true,
    themeBackgrounds: true,
    catInteraction: true,
    questionEnhancements: true,
    microInteractions: true,
    uiAnimations: true,
    rewardParticles: true,
    focusBlur: true,
    ambientAnimations: true
  });

  function isAndroidWebView() {
    try {
      return Boolean(
        document.documentElement.classList.contains("android-webview") ||
        (navigator.userAgent || "").includes("MiaoMiaoMathAndroid") ||
        ((navigator.userAgent || "").includes("Android") && location.href.includes("android_asset"))
      );
    } catch (_) {
      return false;
    }
  }

  function defaultEffectSettings() {
    return { ...(isAndroidWebView() ? ANDROID_DEFAULT_EFFECTS : WEB_DEFAULT_EFFECTS) };
  }

  function savedEffectSettings() {
    try {
      return JSON.parse(localStorage.getItem("mathcamp-effects-settings") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function effectSettings() {
    return { ...defaultEffectSettings(), ...savedEffectSettings() };
  }

  function effectSettingEnabled(key) {
    var settings = effectSettings();
    return settings[key] !== false;
  }

  function debugEnabled() {
    try {
      return localStorage.getItem("mathcamp-debug") === "1" || /[?&]debug=1\b/.test(location.search || "");
    } catch (_) {
      return false;
    }
  }

  function debugLog() {
    if (!debugEnabled() || !window.console || !console.log) return;
    console.log.apply(console, arguments);
  }

  window.MathCampRuntime = {
    isAndroidWebView,
    defaultEffectSettings,
    effectSettings,
    effectSettingEnabled,
    debugEnabled,
    debugLog
  };
})();
