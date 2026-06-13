(function () {
  "use strict";

  function get(key, fallback = "") {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (_) {
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function json(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function onCloudSyncReady(callback) {
    if (typeof callback !== "function") return;
    if (window.MathCampCloudSync && window.MathCampCloudSync.isSyncEnabled()) {
      callback();
      return;
    }
    var check = setInterval(function () {
      if (window.MathCampCloudSync && window.MathCampCloudSync.isSyncEnabled()) {
        clearInterval(check);
        callback();
      }
    }, 500);
    setTimeout(function () { clearInterval(check); }, 10000);
  }

  window.MathCampStorage = { get, set, json, onCloudSyncReady };
})();
