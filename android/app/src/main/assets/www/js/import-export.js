(function () {
  function buildArchiveData(deps) {
    return {
      version: 6,
      type: "miaomiao-math-complete-archive",
      format: "json",
      app: "miaomiao-math",
      platform: "cross-platform",
      compatibleWith: ["web", "android-webview", "ios-webview"],
      exportedAt: new Date().toISOString(),
      profiles: deps.state.profiles.map(deps.normalizeProfile).filter(Boolean),
      activeId: deps.state.activeId,
      systemSettings: deps.collectSystemSettings()
    };
  }

  function parseImportBackup(deps, raw) {
    var data = JSON.parse(raw);
    if (!data || !Array.isArray(data.profiles) || !data.profiles.length) throw new Error("格式不正确");
    var archiveVersion = Number(data.version) || 0;
    var before = data.profiles.reduce(function (acc, profile) {
      acc.profiles += 1;
      acc.wrong += Array.isArray(profile && profile.wrongbook) ? profile.wrongbook.length : 0;
      acc.mastered += Array.isArray(profile && profile.masteredWrong) ? profile.masteredWrong.length : 0;
      acc.history += Array.isArray(profile && profile.history) ? profile.history.length : 0;
      if (deps.isPlainObject(profile && profile.rewards && profile.rewards.pet)) acc.pets += 1;
      return acc;
    }, { profiles: 0, wrong: 0, mastered: 0, history: 0, pets: 0 });
    var profiles = deps.uniquifyRecordIds(data.profiles.map(deps.normalizeProfile).filter(Boolean), "student");
    if (!profiles.length) throw new Error("没有有效学生档案");
    var activeId = profiles.some(function (profile) { return profile.id === data.activeId; }) ? data.activeId : profiles[0].id;
    var systemSettings = (deps.isPlainObject(data.systemSettings) || deps.isPlainObject(data.settings))
      ? deps.normalizeSystemSettings(data.systemSettings || data.settings)
      : deps.collectSystemSettings();
    var wrongCount = profiles.reduce(function (sum, profile) { return sum + profile.wrongbook.length; }, 0);
    var masteredCount = profiles.reduce(function (sum, profile) { return sum + profile.masteredWrong.length; }, 0);
    var historyCount = profiles.reduce(function (sum, profile) { return sum + profile.history.length; }, 0);
    var petCount = profiles.reduce(function (sum, profile) {
      return sum + (deps.isPlainObject(profile.rewards && profile.rewards.pet) ? 1 : 0);
    }, 0);
    var repairNotes = [];
    if (archiveVersion && archiveVersion < 6) repairNotes.push("Auto upgraded archive v" + archiveVersion + " -> v6");
    if (before.profiles !== profiles.length) repairNotes.push("丢弃 " + (before.profiles - profiles.length) + " 个无效学生档案");
    if (before.wrong !== wrongCount) repairNotes.push("修复/丢弃 " + (before.wrong - wrongCount) + " 条异常错题");
    if (before.mastered !== masteredCount) repairNotes.push("修复/丢弃 " + (before.mastered - masteredCount) + " 条已掌握错题记录");
    if (before.history !== historyCount) repairNotes.push("修复/丢弃 " + (before.history - historyCount) + " 条异常练习记录");
    return { raw: raw, profiles: profiles, activeId: activeId, systemSettings: systemSettings, wrongCount: wrongCount, masteredCount: masteredCount, historyCount: historyCount, petCount: petCount, repairNotes: repairNotes };
  }

  window.MathCampImportExport = {
    buildArchiveData: buildArchiveData,
    parseImportBackup: parseImportBackup
  };
})();
