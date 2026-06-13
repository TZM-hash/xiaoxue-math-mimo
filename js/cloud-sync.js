(function () {
  "use strict";

  var SYNC_DEBOUNCE_MS = 3000;
  var SYNC_RETRY_MS = 30000;
  var syncTimer = null;
  var retryTimer = null;
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
      if (!window.supabase || !window.supabase.createClient) {
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
      console.log("[CloudSync] 初始化成功，owner:", getOwnerId());
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

      if (local && !cloud) {
        merged.push(local);
      } else if (!local && cloud) {
        merged.push(cloud);
      } else {
        var localTime = getProfileTime(local);
        var cloudTime = getProfileTime(cloud);
        merged.push(cloudTime > localTime ? cloud : local);
      }
    });

    return merged;
  }

  function getProfileTime(profile) {
    if (!profile || !profile.history || !profile.history.length) return 0;
    var latest = 0;
    profile.history.forEach(function (item) {
      var t = Number(item.time) || 0;
      if (t > latest) latest = t;
    });
    return latest;
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

  async function fullSync(localProfiles, localActiveId) {
    if (!syncEnabled) return { profiles: localProfiles, activeId: localActiveId, changed: false };

    setSyncStatus("syncing");
    var cloudRows = await pullAllProfiles();

    if (!cloudRows) {
      await pushProfiles(localProfiles, localActiveId);
      return { profiles: localProfiles, activeId: localActiveId, changed: false };
    }

    var merged = mergeProfiles(localProfiles, cloudRows);

    var deviceRow = cloudRows.find(function (r) { return r.device_id === deviceId; });
    var mergedActiveId = localActiveId || (deviceRow && deviceRow.active_id) || "";

    if (JSON.stringify(merged) !== JSON.stringify(localProfiles)) {
      await pushProfiles(merged, mergedActiveId);
      return { profiles: merged, activeId: mergedActiveId, changed: true };
    }

    setSyncStatus("synced");
    return { profiles: merged, activeId: mergedActiveId, changed: false };
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
    getConfig: getConfig,
    saveConfig: saveConfig,
    getSyncCode: getSyncCode,
    setSyncCode: setSyncCode,
    getDeviceId: getDeviceIdExport,
    pushProfiles: pushProfiles,
    pullAllProfiles: pullAllProfiles,
    pushSettings: pushSettings,
    pullSettings: pullSettings,
    mergeProfiles: mergeProfiles,
    scheduleSync: scheduleSync,
    fullSync: fullSync,
    isSyncEnabled: isSyncEnabled,
    onSyncStatus: onSyncStatus,
    disconnect: disconnect
  };
})();
