(function () {
  "use strict";

  var SYNC_DEBOUNCE_MS = 3000;
  var SYNC_RETRY_MS = 30000;
  var SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  var SUPABASE_SDK_TIMEOUT_MS = 12000;
  var syncTimer = null;
  var retryTimer = null;
  var sdkTimer = null;
  var sdkPromise = null;
  var client = null;
  var deviceId = null;
  var syncCode = "";
  var syncEnabled = false;
  var syncStatusListeners = [];

  function setSyncStatus(status) {
    syncStatusListeners.forEach(function (fn) {
      try { fn(status); } catch (_) {}
    });
  }

  function onSyncStatus(fn) {
    if (typeof fn === "function") syncStatusListeners.push(fn);
  }

  function debugLog() {
    if (window.MathCampRuntime && typeof window.MathCampRuntime.debugLog === "function") {
      window.MathCampRuntime.debugLog.apply(window.MathCampRuntime, arguments);
    }
  }

  function hasSupabaseSdk() {
    return Boolean(window.supabase && window.supabase.createClient);
  }

  function loadSupabaseSdk() {
    if (hasSupabaseSdk()) return Promise.resolve(true);
    if (sdkPromise) return sdkPromise;
    if (typeof document === "undefined" || !document.createElement) return Promise.resolve(false);

    sdkPromise = new Promise(function (resolve) {
      var target = document.head || document.documentElement || document.body;
      if (!target || !target.appendChild) {
        sdkPromise = null;
        resolve(false);
        return;
      }

      var script = document.createElement("script");
      var done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        if (sdkTimer) {
          clearTimeout(sdkTimer);
          sdkTimer = null;
        }
        if (!ok) sdkPromise = null;
        resolve(Boolean(ok));
      }

      setSyncStatus("loading-sdk");
      script.src = SUPABASE_SDK_URL;
      script.async = true;
      script.onload = function () { finish(hasSupabaseSdk()); };
      script.onerror = function () { finish(false); };
      sdkTimer = setTimeout(function () { finish(hasSupabaseSdk()); }, SUPABASE_SDK_TIMEOUT_MS);
      target.appendChild(script);
    });
    return sdkPromise;
  }

  async function ensureSupabaseSdk() {
    if (hasSupabaseSdk()) return true;
    return loadSupabaseSdk();
  }

  function getConfig() {
    try {
      var raw = localStorage.getItem("mathcamp-supabase-config");
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveConfig(config) {
    try {
      localStorage.setItem("mathcamp-supabase-config", JSON.stringify(config));
      return true;
    } catch (_) {
      return false;
    }
  }

  function getDeviceId() {
    try {
      var id = localStorage.getItem("mathcamp-device-id");
      if (id) return id;
      id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("mathcamp-device-id", id);
      return id;
    } catch (_) {
      return "dev-" + Date.now().toString(36);
    }
  }

  function getSyncCode() {
    try {
      return localStorage.getItem("mathcamp-sync-code") || "";
    } catch (_) {
      return "";
    }
  }

  function setSyncCode(code) {
    try {
      syncCode = code || "";
      if (syncCode) {
        localStorage.setItem("mathcamp-sync-code", syncCode);
      } else {
        localStorage.removeItem("mathcamp-sync-code");
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function getOwnerId() {
    return syncCode || deviceId;
  }

  async function initSupabase(config) {
    if (!config || !config.url || !config.anonKey) {
      console.warn("[CloudSync] 未配置 Supabase，云端同步不可用。");
      return false;
    }

    try {
      if (!await ensureSupabaseSdk()) {
        setSyncStatus("offline");
        console.warn("[CloudSync] Supabase SDK 未加载。");
        return false;
      }

      client = window.supabase.createClient(config.url, config.anonKey);
      deviceId = getDeviceId();
      syncCode = getSyncCode();

      var { error } = await client.from("user_data").select("owner_id").limit(1);
      if (error && error.code === "42P01") {
        console.warn("[CloudSync] user_data 表不存在，请在 Supabase 控制台执行建表 SQL。");
        setSyncStatus("error");
        return false;
      }

      syncEnabled = true;
      debugLog("[CloudSync] 初始化成功，owner:", getOwnerId());
      setSyncStatus("ready");
      return true;
    } catch (err) {
      console.error("[CloudSync] 初始化失败:", err);
      setSyncStatus("error");
      return false;
    }
  }

  async function pushProfiles(profiles, activeId) {
    if (!syncEnabled || !client) return false;

    try {
      var now = new Date().toISOString();
      var ownerId = getOwnerId();
      var payload = {
        owner_id: ownerId,
        device_id: deviceId,
        profiles: JSON.parse(JSON.stringify(profiles)),
        active_id: activeId,
        updated_at: now
      };

      var { error } = await client
        .from("user_data")
        .upsert(payload, { onConflict: "owner_id,device_id" });

      if (error) throw error;
      setSyncStatus("synced");
      return true;
    } catch (err) {
      console.error("[CloudSync] 推送失败:", err);
      setSyncStatus("error");
      scheduleRetry();
      return false;
    }
  }

  async function pushSettings(settings) {
    if (!syncEnabled || !client) return false;

    try {
      var ownerId = getOwnerId();
      var { error } = await client
        .from("user_settings")
        .upsert({
          owner_id: ownerId,
          device_id: deviceId,
          settings: settings,
          updated_at: new Date().toISOString()
        }, { onConflict: "owner_id,device_id" });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("[CloudSync] 设置推送失败:", err);
      return false;
    }
  }

  async function pullAllProfiles() {
    if (!syncEnabled || !client) return null;

    try {
      var ownerId = getOwnerId();
      var { data, error } = await client
        .from("user_data")
        .select("device_id,profiles,active_id,updated_at")
        .eq("owner_id", ownerId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      if (!data || !data.length) return null;
      return data;
    } catch (err) {
      console.error("[CloudSync] 拉取失败:", err);
      return null;
    }
  }

  async function pullSettings() {
    if (!syncEnabled || !client) return null;

    try {
      var ownerId = getOwnerId();
      var { data, error } = await client
        .from("user_settings")
        .select("settings")
        .eq("owner_id", ownerId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || !data.length) return null;
      return data[0].settings;
    } catch (err) {
      console.error("[CloudSync] 设置拉取失败:", err);
      return null;
    }
  }

  function arrayByKey(items, keyFn) {
    var map = {};
    (Array.isArray(items) ? items : []).forEach(function (item) {
      if (!item) return;
      var key = keyFn(item);
      if (!key) return;
      var existing = map[key];
      if (!existing || itemTime(item) >= itemTime(existing)) map[key] = item;
    });
    return map;
  }

  function itemTime(item) {
    return Math.max(
      Number(item && item.updatedAt) || 0,
      Number(item && item.time) || 0,
      Number(item && item.masteredAt) || 0,
      Number(item && item.lastReviewedAt) || 0
    );
  }

  function countRecords(profile) {
    return {
      history: Array.isArray(profile && profile.history) ? profile.history.length : 0,
      wrongbook: Array.isArray(profile && profile.wrongbook) ? profile.wrongbook.length : 0,
      masteredWrong: Array.isArray(profile && profile.masteredWrong) ? profile.masteredWrong.length : 0
    };
  }

  function blankSummary() {
    return {
      profiles: 0,
      history: 0,
      wrongbook: 0,
      masteredWrong: 0,
      settingsChanged: false
    };
  }

  function mergeUniqueRecords(localItems, cloudItems, keyFn, limit) {
    var localMap = arrayByKey(localItems, keyFn);
    var cloudMap = arrayByKey(cloudItems, keyFn);
    var keys = Object.keys(localMap).concat(Object.keys(cloudMap).filter(function (key) { return !localMap[key]; }));
    return keys.map(function (key) {
      var local = localMap[key];
      var cloud = cloudMap[key];
      if (local && !cloud) return local;
      if (!local && cloud) return cloud;
      return itemTime(cloud) > itemTime(local) ? cloud : local;
    }).sort(function (a, b) {
      return itemTime(b) - itemTime(a);
    }).slice(0, limit || 1000);
  }

  function mergeMastery(localMastery, cloudMastery) {
    var merged = {};
    var keys = new Set(Object.keys(localMastery || {}).concat(Object.keys(cloudMastery || {})));
    keys.forEach(function (key) {
      var local = (localMastery || {})[key] || {};
      var cloud = (cloudMastery || {})[key] || {};
      merged[key] = {
        attempts: Math.max(Number(local.attempts) || 0, Number(cloud.attempts) || 0),
        correct: Math.max(Number(local.correct) || 0, Number(cloud.correct) || 0),
        level: Math.max(Number(local.level) || 1, Number(cloud.level) || 1),
        streak: Math.max(Number(local.streak) || 0, Number(cloud.streak) || 0)
      };
      if (merged[key].correct > merged[key].attempts) merged[key].correct = merged[key].attempts;
    });
    return merged;
  }

  function mergeChallenge(localChallenge, cloudChallenge) {
    var merged = { gradeLevels: {} };
    var localLevels = (localChallenge && localChallenge.gradeLevels) || {};
    var cloudLevels = (cloudChallenge && cloudChallenge.gradeLevels) || {};
    var grades = new Set(Object.keys(localLevels).concat(Object.keys(cloudLevels)));
    grades.forEach(function (grade) {
      var local = localLevels[grade] || {};
      var cloud = cloudLevels[grade] || {};
      var localTime = Math.max(Number(local.lastPlayedAt) || 0, Number(local.updatedAt) || 0);
      var cloudTime = Math.max(Number(cloud.lastPlayedAt) || 0, Number(cloud.updatedAt) || 0);
      merged.gradeLevels[grade] = {
        ...(cloudTime > localTime ? local : cloud),
        ...(cloudTime > localTime ? cloud : local),
        level: Math.max(Number(local.level) || 1, Number(cloud.level) || 1),
        passed: Math.max(Number(local.passed) || 0, Number(cloud.passed) || 0),
        weekPassed: Math.max(Number(local.weekPassed) || 0, Number(cloud.weekPassed) || 0),
        bestRate: Math.max(Number(local.bestRate) || 0, Number(cloud.bestRate) || 0),
        todayBestLevel: Math.max(Number(local.todayBestLevel) || 0, Number(cloud.todayBestLevel) || 0),
        draft: cloudTime > localTime ? cloud.draft || null : local.draft || null
      };
    });
    return merged;
  }

  function mergeRewards(localRewards, cloudRewards, preferCloud) {
    var local = localRewards || {};
    var cloud = cloudRewards || {};
    var primary = preferCloud ? cloud : local;
    var secondary = preferCloud ? local : cloud;
    return {
      ...secondary,
      ...primary,
      clearedWrong: Math.max(Number(local.clearedWrong) || 0, Number(cloud.clearedWrong) || 0),
      challenge: mergeChallenge(local.challenge, cloud.challenge),
      pet: primary.pet || secondary.pet || {}
    };
  }

  function mergeProfile(local, cloud) {
    if (!local) return cloud;
    if (!cloud) return local;
    var localTime = getProfileTime(local);
    var cloudTime = getProfileTime(cloud);
    var preferCloud = cloudTime > localTime;
    var primary = preferCloud ? cloud : local;
    var secondary = preferCloud ? local : cloud;
    var history = mergeUniqueRecords(local.history, cloud.history, function (item) {
      return [item.time, item.pointId, item.text, item.correct].join("|");
    }, 2500);
    var wrongbook = mergeUniqueRecords(local.wrongbook, cloud.wrongbook, function (item) {
      return item.signature || item.id;
    }, 300);
    var masteredWrong = mergeUniqueRecords(local.masteredWrong, cloud.masteredWrong, function (item) {
      return item.signature || item.id;
    }, 500);
    return {
      ...secondary,
      ...primary,
      history: history,
      wrongbook: wrongbook,
      masteredWrong: masteredWrong,
      mastery: mergeMastery(local.mastery, cloud.mastery),
      rewards: mergeRewards(local.rewards, cloud.rewards, preferCloud),
      updatedAt: Math.max(Number(local.updatedAt) || 0, Number(cloud.updatedAt) || 0, itemTime(history[0]))
    };
  }

  function mergeProfiles(localProfiles, cloudRows) {
    if (!cloudRows || !cloudRows.length) return localProfiles;

    var localMap = {};
    localProfiles.forEach(function (p) {
      if (p && p.id) localMap[p.id] = p;
    });

    var cloudMap = {};
    cloudRows.forEach(function (row) {
      if (!row || !Array.isArray(row.profiles)) return;
      row.profiles.forEach(function (p) {
        if (!p || !p.id) return;
        var existing = cloudMap[p.id];
        if (!existing || getProfileTime(p) > getProfileTime(existing)) {
          cloudMap[p.id] = p;
        }
      });
    });

    var allIds = new Set(Object.keys(cloudMap).concat(Object.keys(localMap)));
    var merged = [];

    allIds.forEach(function (id) {
      var local = localMap[id];
      var cloud = cloudMap[id];

      merged.push(mergeProfile(local, cloud));
    });

    return merged;
  }

  function profileTotals(profiles) {
    return (Array.isArray(profiles) ? profiles : []).reduce(function (sum, profile) {
      var counts = countRecords(profile);
      sum.profiles += profile ? 1 : 0;
      sum.history += counts.history;
      sum.wrongbook += counts.wrongbook;
      sum.masteredWrong += counts.masteredWrong;
      return sum;
    }, blankSummary());
  }

  function mergeSummary(localProfiles, mergedProfiles, settingsChanged) {
    var local = profileTotals(localProfiles);
    var merged = profileTotals(mergedProfiles);
    return {
      profiles: Math.max(0, merged.profiles - local.profiles),
      history: Math.max(0, merged.history - local.history),
      wrongbook: Math.max(0, merged.wrongbook - local.wrongbook),
      masteredWrong: Math.max(0, merged.masteredWrong - local.masteredWrong),
      settingsChanged: Boolean(settingsChanged)
    };
  }

  function getProfileTime(profile) {
    if (!profile) return 0;
    var latest = Number(profile.updatedAt) || 0;
    if (Array.isArray(profile.history)) {
      profile.history.forEach(function (item) {
        var t = Number(item.time) || 0;
        if (t > latest) latest = t;
      });
    }
    return latest;
  }

  function getSettingsTime(settings) {
    return Math.max(0, Number(settings?.updatedAt) || 0);
  }

  function mergeSettings(localSettings, cloudSettings) {
    if (!cloudSettings) return { settings: localSettings || null, changed: false };
    if (!localSettings || getSettingsTime(cloudSettings) > getSettingsTime(localSettings)) {
      return {
        settings: {
          ...(localSettings || {}),
          ...cloudSettings,
          effects: { ...((localSettings || {}).effects || {}), ...(cloudSettings.effects || {}) }
        },
        changed: true
      };
    }
    return {
      settings: {
        ...cloudSettings,
        ...localSettings,
        effects: { ...(cloudSettings.effects || {}), ...(localSettings.effects || {}) }
      },
      changed: false
    };
  }

  function scheduleSync(profiles, activeId) {
    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(function () {
      syncTimer = null;
      pushProfiles(profiles, activeId);
    }, SYNC_DEBOUNCE_MS);
  }

  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () {
      retryTimer = null;
      setSyncStatus("retrying");
    }, SYNC_RETRY_MS);
  }

  async function fullSync(localProfiles, localActiveId, localSettings) {
    if (!syncEnabled) {
      return {
        profiles: localProfiles,
        activeId: localActiveId,
        systemSettings: localSettings || null,
        changed: false,
        settingsChanged: false,
        summary: blankSummary()
      };
    }

    setSyncStatus("syncing");
    var cloudRows = await pullAllProfiles();
    var cloudSettings = await pullSettings();
    var settingsMerge = mergeSettings(localSettings, cloudSettings);
    var mergedSettings = settingsMerge.settings;
    var settingsChanged = settingsMerge.changed;
    if (!settingsChanged && localSettings) {
      await pushSettings(localSettings);
    }

    if (!cloudRows) {
      await pushProfiles(localProfiles, localActiveId);
      if (localSettings) await pushSettings(localSettings);
      return {
        profiles: localProfiles,
        activeId: localActiveId,
        systemSettings: mergedSettings,
        changed: false,
        settingsChanged: settingsChanged,
        summary: { ...blankSummary(), settingsChanged: settingsChanged }
      };
    }

    var merged = mergeProfiles(localProfiles, cloudRows);
    var summary = mergeSummary(localProfiles, merged, settingsChanged);

    var deviceRow = cloudRows.find(function (r) { return r.device_id === deviceId; });
    var mergedActiveId = localActiveId || (deviceRow && deviceRow.active_id) || "";

    if (JSON.stringify(merged) !== JSON.stringify(localProfiles)) {
      await pushProfiles(merged, mergedActiveId);
      return {
        profiles: merged,
        activeId: mergedActiveId,
        systemSettings: mergedSettings,
        changed: true,
        settingsChanged: settingsChanged,
        summary: summary
      };
    }

    setSyncStatus("synced");
    return {
      profiles: merged,
      activeId: mergedActiveId,
      systemSettings: mergedSettings,
      changed: false,
      settingsChanged: settingsChanged,
      summary: summary
    };
  }

  function isSyncEnabled() {
    return syncEnabled;
  }

  function getDeviceIdExport() {
    return deviceId || getDeviceId();
  }

  function disconnect() {
    syncEnabled = false;
    if (syncTimer) { clearTimeout(syncTimer); syncTimer = null; }
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    client = null;
  }

  window.MathCampCloudSync = {
    initSupabase: initSupabase,
    ensureSupabaseSdk: ensureSupabaseSdk,
    getConfig: getConfig,
    saveConfig: saveConfig,
    getSyncCode: getSyncCode,
    setSyncCode: setSyncCode,
    getDeviceId: getDeviceIdExport,
    pushProfiles: pushProfiles,
    pullAllProfiles: pullAllProfiles,
    pushSettings: pushSettings,
    pullSettings: pullSettings,
    mergeSettings: mergeSettings,
    mergeProfile: mergeProfile,
    mergeProfiles: mergeProfiles,
    mergeSummary: mergeSummary,
    scheduleSync: scheduleSync,
    fullSync: fullSync,
    isSyncEnabled: isSyncEnabled,
    onSyncStatus: onSyncStatus,
    disconnect: disconnect
  };
})();
