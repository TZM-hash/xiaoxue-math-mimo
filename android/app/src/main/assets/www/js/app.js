const STORE = {
      profiles: "mathcamp-profiles-v4",
      active: "mathcamp-active-profile-v4",
      music: "mathcamp-music-enabled-v4",
      sound: "mathcamp-sound-enabled-v4",
      theme: "mathcamp-theme-v1"
    };
    const THEME_REGISTRY = {
      classic: { label: "经典", icon: "🌿", metaColor: "#3aa47c", desc: "清爽稳定的默认主题。", initial: true },
      "eye-care": { label: "护眼", icon: "🍃", metaColor: "#6c9a57", desc: "柔和绿调，适合长时间练习。", initial: true },
      anime: { label: "二次元", icon: "🌸", metaColor: "#d85ca6", desc: "轻快明亮的卡通配色。", initial: true },
      purple: { label: "紫色", icon: "💜", metaColor: "#8b5cf6", desc: "梦幻紫色学习桌。", unlockLevel: 3, price: 60 },
      rainbow: { label: "彩虹", icon: "🌈", metaColor: "#ff8a4c", desc: "多彩但不刺眼，适合低年级。", unlockLevel: 4, price: 80 },
      forest: { label: "森林", icon: "🌳", metaColor: "#287a55", desc: "像在小森林里安静做题。", unlockLevel: 5, price: 90 },
      ocean: { label: "海洋", icon: "🌊", metaColor: "#2f92c9", desc: "清亮蓝绿，像海边课堂。", unlockLevel: 7, price: 110 },
      candy: { label: "糖果", icon: "🍬", metaColor: "#df5f8f", desc: "甜甜的儿童感配色。", unlockLevel: 8, price: 120 },
      storybook: { label: "童话书", icon: "📖", metaColor: "#c97a38", desc: "温暖纸张和故事书色调。", unlockLevel: 10, price: 150 },
      star: { label: "星空", icon: "🌙", metaColor: "#334eb8", desc: "明亮星空，不使用深色背景。", unlockLevel: 12, price: 180 },
      playground: { label: "游乐场", icon: "🎈", metaColor: "#e45f6b", desc: "活泼红蓝黄，适合奖励阶段。", unlockLevel: 15, price: 220 }
    };
    const INITIAL_SYSTEM_THEME_IDS = Object.freeze(Object.keys(THEME_REGISTRY).filter((id) => THEME_REGISTRY[id].initial));
    const SYSTEM_THEME_IDS = Object.freeze(Object.keys(THEME_REGISTRY));
    const Storage = window.MathCampStorage;
    const PrintLayout = window.MathCampPrintLayout;
    const UI = window.MathCampUIFeedback;
    const PetEconomy = window.MathCampPetEconomy || {};
    const HomeRoute = window.MathCampHomeRoute || {};
    const PetDressupMeta = window.MathCampPetDressupMeta || {};
    const { grades, gradeNames, causes, causeTagsByTopic, points, pointMap, allOption } = window.MathCampQuestionBank;
    const isAndroidWebView = () => document.documentElement.classList.contains("android-webview");
    const isLowMotionMode = () => isAndroidWebView();
    function effectSettingEnabled(key) {
      try {
        const saved = JSON.parse(localStorage.getItem("mathcamp-effects-settings") || "{}");
        return saved[key] !== false;
      } catch (e) {
        return true;
      }
    }
    const AUDIO_ASSETS = {
      bgm: "assets/audio/bgm-soft-loop.wav",
      effects: {
        correct: "assets/audio/sfx-correct.wav",
        wrong: "assets/audio/sfx-wrong.wav",
        finish: "assets/audio/sfx-finish.wav",
        "meow-happy": "assets/audio/sfx-meow-happy.wav"
      },
      keys: {
        "0": "assets/audio/sfx-key-0.wav",
        "1": "assets/audio/sfx-key-1.wav",
        "2": "assets/audio/sfx-key-2.wav",
        "3": "assets/audio/sfx-key-3.wav",
        "4": "assets/audio/sfx-key-4.wav",
        "5": "assets/audio/sfx-key-5.wav",
        "6": "assets/audio/sfx-key-6.wav",
        "7": "assets/audio/sfx-key-7.wav",
        "8": "assets/audio/sfx-key-8.wav",
        "9": "assets/audio/sfx-key-9.wav",
        ".": "assets/audio/sfx-key-dot.wav",
        "/": "assets/audio/sfx-key-slash.wav",
        "%": "assets/audio/sfx-key-percent.wav",
        ":": "assets/audio/sfx-key-colon.wav",
        "-": "assets/audio/sfx-key-minus.wav",
        "余": "assets/audio/sfx-key-remainder.wav",
        "⌫": "assets/audio/sfx-key-backspace.wav",
        "清空": "assets/audio/sfx-key-clear.wav"
      }
    };
    const EFFECT_FILE_BY_KIND = {
      correct: "correct",
      wrong: "wrong",
      finish: "finish",
      meow: "meow-happy",
      "meow-happy": "meow-happy"
    };
    const badgeCatalog = [
      { id: "first-set", title: "第一次完成", desc: "完成任意一轮练习。", test: (p) => p.history.length >= 3 },
      { id: "daily-goal", title: "今日达标", desc: "当天完成每日目标题数。", test: (p) => todayItems(p).length >= dailyGoal(p) },
      { id: "accuracy-80", title: "稳定 80%", desc: "累计 30 题后正确率达到 80%。", test: (p) => p.history.length >= 30 && accuracyOf(p.history) >= 80 },
      { id: "streak-3", title: "连续学习 3 天", desc: "连续 3 天都有练习记录。", test: (p) => learningDaysFor(p) >= 3 },
      { id: "wrong-cleaner", title: "错题清理员", desc: "至少一题连续做对 3 次后自动移除。", test: (p) => (p.rewards?.clearedWrong || 0) >= 1 },
      { id: "challenge-pass", title: "闯关小勇士", desc: "通过任意一个闯关关卡。", test: (p) => Object.values(p.rewards?.challenge?.gradeLevels || {}).some((item) => (item.passed || 0) >= 1) },
      { id: "hundred", title: "百题里程碑", desc: "累计完成 100 道题。", test: (p) => p.history.length >= 100 },
      { id: "five-points", title: "知识点探索", desc: "练过 5 个不同知识点。", test: (p) => new Set(p.history.map((item) => item.pointId)).size >= 5 },
      { id: "careful-review", title: "认真订正", desc: "保存过 5 次错因。", test: (p) => p.history.filter((item) => causes.includes(normalizeCause(item.cause))).length >= 5 }
    ];
    const PET_XP_PER_LEVEL = 150;
    const PET_SHOP = Array.isArray(PetEconomy.SHOP) ? PetEconomy.SHOP : [];
    const PET_ITEM_MAP = Object.fromEntries(PET_SHOP.map((item) => [item.id, item]));
    const PET_CARE_LIMITS = PetEconomy.CARE_LIMITS || {};
    const PET_STAGES = Array.isArray(PetEconomy.STAGES) ? PetEconomy.STAGES : [
      { id: "kitten", name: "幼年招财", minLevel: 1, copy: "刚开始陪练，喜欢短一点的小练习。" }
    ];
    const PET_WISHES = Array.isArray(PetEconomy.WISHES) ? PetEconomy.WISHES : [];
    const PET_SKILLS = Array.isArray(PetEconomy.SKILLS) ? PetEconomy.SKILLS : [];
    const PET_LEVEL_REWARDS = Array.isArray(PetEconomy.LEVEL_REWARDS) ? PetEconomy.LEVEL_REWARDS : [];
    const PET_DECORATIONS = Array.isArray(PetEconomy.DECORATIONS) ? PetEconomy.DECORATIONS : [];
    const PET_RANDOM_EVENTS = Array.isArray(PetEconomy.RANDOM_EVENTS) ? PetEconomy.RANDOM_EVENTS : [];
    const PET_STORY_CHAPTERS = Array.isArray(PetEconomy.STORY_CHAPTERS) ? PetEconomy.STORY_CHAPTERS : [];
    const PET_ROOM_THEMES = Array.isArray(PetEconomy.ROOM_THEMES) ? PetEconomy.ROOM_THEMES : [];
    const PET_FURNITURE = Array.isArray(PetEconomy.FURNITURE) ? PetEconomy.FURNITURE : [];
    const PET_OUTFITS = Array.isArray(PetEconomy.OUTFITS) ? PetEconomy.OUTFITS : [];
    const PET_ACHIEVEMENTS = Array.isArray(PetEconomy.ACHIEVEMENTS) ? PetEconomy.ACHIEVEMENTS : [];
    const PET_DECORATION_MAP = Object.fromEntries(PET_DECORATIONS.map((item) => [item.id, item]));
    const PET_LEVEL_REWARD_MAP = Object.fromEntries(PET_LEVEL_REWARDS.map((item) => [String(item.level), item]));
    const PET_ROOM_THEME_MAP = Object.fromEntries(PET_ROOM_THEMES.map((item) => [item.id, item]));
    const PET_FURNITURE_MAP = Object.fromEntries(PET_FURNITURE.map((item) => [item.id, item]));
    const PET_OUTFIT_MAP = Object.fromEntries(PET_OUTFITS.map((item) => [item.id, item]));
    const PET_ACHIEVEMENT_MAP = Object.fromEntries(PET_ACHIEVEMENTS.map((item) => [item.id, item]));
    const PET_IMAGE_BASE = "assets/cat-states-app";
    const PET_IMAGES = {
      idle: "cat_idle.png",
      correct: "cat_correct.png",
      wrong: "cat_wrong.png",
      hint: "cat_hint.png",
      encourage: "cat_encourage.png",
      finish: "cat_finish.png",
      hungry: "cat_hungry.png",
      dirty: "cat_dirty.png",
      bondClose: "cat_bond_close.png",
      fed: "cat_fed.png",
      cleanComfy: "cat_clean_comfy.png",
      play: "cat_play.png",
      away: "cat_away.png",
      lost: "cat_lost.png"
    };
    const PET_ACTION_IMAGE = {
      correct: "correct",
      wrong: "wrong",
      hint: "hint",
      encourage: "encourage",
      finish: "finish",
      fed: "fed",
      clean: "cleanComfy",
      comfy: "cleanComfy",
      play: "play",
      away: "away",
      lost: "lost"
    };
    const petTaskProgress = {
      todayCount: (profile) => todayItems(profile).length,
      todayCorrect: (profile) => todayItems(profile).filter((item) => item.correct).length,
      todayWrongReview: (profile) => todayItems(profile).filter((item) => item.mode === "wrongbook").length,
      todayTimedQuiz: (profile) => todayItems(profile).filter((item) => item.mode === "timed").length ? 1 : 0,
      learningDays: (profile) => learningDaysFor(profile),
      weekWrongReview: (profile) => currentWeekItems(profile).filter((item) => item.mode === "wrongbook").length,
      weekMasteredWrong: (profile) => currentWeekMasteredWrong(profile).length,
      weekPointCount: (profile) => new Set(currentWeekItems(profile).map((item) => item.pointId).filter(Boolean)).size,
      weekAccuracy: (profile) => accuracyOf(currentWeekItems(profile)),
      weekChallengePass: (profile) => Object.values(profile.rewards?.challenge?.gradeLevels || {}).reduce((sum, item) => sum + (Number(item.weekPassed) || 0), 0)
    };
    const attachPetTaskProgress = (task) => ({
      ...task,
      progress: petTaskProgress[task.progressKey] || (() => 0)
    });
    const PET_DAILY_TASKS = (Array.isArray(PetEconomy.DAILY_TASKS) ? PetEconomy.DAILY_TASKS : []).map(attachPetTaskProgress);
    const PET_WEEKLY_TASKS = (Array.isArray(PetEconomy.WEEKLY_TASKS) ? PetEconomy.WEEKLY_TASKS : []).map(attachPetTaskProgress);

    const els = {
      profileSelect: document.getElementById("profileSelect"),
      quickAddProfileBtn: document.getElementById("quickAddProfileBtn"),
      tabs: [...document.querySelectorAll(".tab-btn")],
      views: {
        practice: document.getElementById("practiceView"),
        petspace: document.getElementById("petspaceView"),
        tasks: document.getElementById("tasksView"),
        wrongbook: document.getElementById("wrongbookView"),
        report: document.getElementById("reportView"),
        knowledgeMap: document.getElementById("knowledgeMapView"),
        print: document.getElementById("printView"),
        data: document.getElementById("dataView")
      },
      wrongCountPill: document.getElementById("wrongCountPill"),
      todayPill: document.getElementById("todayPill"),
      petCoinPill: document.getElementById("petCoinPill"),
      homePlanCopy: document.getElementById("homePlanCopy"),
      homeCockpitMeter: document.getElementById("homeCockpitMeter"),
      homeSettingsCard: document.getElementById("homeSettingsCard"),
      homeWeakList: document.getElementById("homeWeakList"),
      homeRouteList: document.getElementById("homeRouteList"),
      homeStartWeakBtn: document.getElementById("homeStartWeakBtn"),
      homeStartTimedBtn: document.getElementById("homeStartTimedBtn"),
      homeStartChallengeBtn: document.getElementById("homeStartChallengeBtn"),
      homeStartPracticeBtn: document.getElementById("homeStartPracticeBtn"),
      homePetTitle: document.getElementById("homePetTitle"),
      homePetCopy: document.getElementById("homePetCopy"),
      homeChallengeCopy: document.getElementById("homeChallengeCopy"),
      homeChallengeModeCopy: document.getElementById("homeChallengeModeCopy"),
      homeChallengePanel: document.getElementById("homeChallengePanel"),
      homeTimedCopy: document.getElementById("homeTimedCopy"),
      musicToggle: document.getElementById("musicToggle"),
      soundToggle: document.getElementById("soundToggle"),
      musicToggles: [...document.querySelectorAll("#musicToggle, [data-sound-kind='music']")],
      soundToggles: [...document.querySelectorAll("#soundToggle, [data-sound-kind='sound']")],
      themeSelect: document.getElementById("themeSelect"),
      themeSelects: [...document.querySelectorAll("#themeSelect")],
      themeOptions: [...document.querySelectorAll("[data-theme-option]")],
      practiceWorkspace: document.getElementById("practiceWorkspace"),
      backToSetupBtn: document.getElementById("backToSetupBtn"),
      closeTypeSettingsBtn: document.getElementById("closeTypeSettingsBtn"),
      gradeGrid: document.getElementById("gradeGrid"),
      pointSelect: document.getElementById("pointSelect"),
      answerModeSelect: document.getElementById("answerModeSelect"),
      adaptiveToggle: document.getElementById("adaptiveToggle"),
      setSizeInput: document.getElementById("setSizeInput"),
      dailyGoalInput: document.getElementById("dailyGoalInput"),
      dailyGoalCard: document.getElementById("dailyGoalCard"),
      challengePanel: document.getElementById("challengePanel"),
      startChallengeBtn: document.getElementById("startChallengeBtn"),
      startTimedQuizBtn: document.getElementById("startTimedQuizBtn"),
      adaptiveHint: document.getElementById("adaptiveHint"),
      knowledgeDetail: document.getElementById("knowledgeDetail"),
      startSetBtn: document.getElementById("startSetBtn"),
      gradeStat: document.getElementById("gradeStat"),
      progressStat: document.getElementById("progressStat"),
      timerStat: document.getElementById("timerStat"),
      correctStat: document.getElementById("correctStat"),
      streakStat: document.getElementById("streakStat"),
      missionStrip: document.getElementById("missionStrip"),
      missionGoal: document.getElementById("missionGoal"),
      missionStreak: document.getElementById("missionStreak"),
      missionNext: document.getElementById("missionNext"),
      gradeTag: document.getElementById("gradeTag"),
      pointTag: document.getElementById("pointTag"),
      modeTag: document.getElementById("modeTag"),
      questionText: document.getElementById("questionText"),
      answerInput: document.getElementById("answerInput"),
      answerControlSlot: document.getElementById("answerControlSlot"),
      numberPad: document.getElementById("numberPad"),
      answerModePanel: document.getElementById("answerModePanel"),
      checkBtn: document.getElementById("checkBtn"),
      nextBtn: document.getElementById("nextBtn"),
      skipBtn: document.getElementById("skipBtn"),
      showAnswerBtn: document.getElementById("showAnswerBtn"),
      similarBtn: document.getElementById("similarBtn"),
      resetSetBtn: document.getElementById("resetSetBtn"),
      practiceCard: document.getElementById("practiceCard"),
      celebrationLayer: document.getElementById("celebrationLayer"),
      feedback: document.getElementById("feedback"),
      mobilePetHintPopover: document.getElementById("mobilePetHintPopover"),
      mobilePetHintTitle: document.getElementById("mobilePetHintTitle"),
      mobilePetHintText: document.getElementById("mobilePetHintText"),
      mobilePetHintClose: document.getElementById("mobilePetHintClose"),
      causePanel: document.getElementById("causePanel"),
      causeSelect: document.getElementById("causeSelect"),
      causeQuickTags: document.getElementById("causeQuickTags"),
      saveCauseBtn: document.getElementById("saveCauseBtn"),
      companionArt: document.getElementById("companionArt"),
      petCharacterBtn: document.getElementById("petCharacterBtn"),
      companionTalk: document.getElementById("companionTalk"),
      bubbleText: document.getElementById("bubbleText"),
      petLevel: document.getElementById("petLevel"),
      petEnergy: document.getElementById("petEnergy"),
      petEnergyText: document.getElementById("petEnergyText"),
      petConfidence: document.getElementById("petConfidence"),
      petConfidenceText: document.getElementById("petConfidenceText"),
      petClean: document.getElementById("petClean"),
      petCleanText: document.getElementById("petCleanText"),
      petBond: document.getElementById("petBond"),
      petBondText: document.getElementById("petBondText"),
      petInventory: document.getElementById("petInventory"),
      petCompanionTitle: document.getElementById("petCompanionTitle"),
      petEncourageBtn: document.getElementById("petEncourageBtn"),
      petHintBtn: document.getElementById("petHintBtn"),
      progressDots: document.getElementById("progressDots"),
      methodHint: document.getElementById("methodHint"),
      appendixPreview: document.getElementById("appendixPreview"),
      appendixBtn: document.getElementById("appendixBtn"),
      hardWordBtn: document.getElementById("hardWordBtn"),
      summaryPanel: document.getElementById("summaryPanel"),
      challengeResultOverlay: document.getElementById("challengeResultOverlay"),
      challengeResultTitle: document.getElementById("challengeResultTitle"),
      challengeResultBody: document.getElementById("challengeResultBody"),
      challengeResultActions: document.getElementById("challengeResultActions"),
      challengeResultClose: document.getElementById("challengeResultClose"),
      mobileChallengeResult: document.getElementById("mobileChallengeResult"),
      reviewPanel: document.getElementById("reviewPanel"),
      petSpaceTitle: document.getElementById("petSpaceTitle"),
      petSpaceLead: document.getElementById("petSpaceLead"),
      petSpaceCoins: document.getElementById("petSpaceCoins"),
      petRunawayNotice: document.getElementById("petRunawayNotice"),
      petRoomStage: document.getElementById("petRoomStage"),
      petRoomName: document.getElementById("petRoomName"),
      petRoomStatus: document.getElementById("petRoomStatus"),
      petRoomWalker: document.getElementById("petRoomWalker"),
      petStageCard: document.getElementById("petStageCard"),
      petSpaceLevel: document.getElementById("petSpaceLevel"),
      petSpaceXp: document.getElementById("petSpaceXp"),
      petSkillStrip: document.getElementById("petSkillStrip"),
      petSpaceBars: document.getElementById("petSpaceBars"),
      petShowcaseCard: document.getElementById("petShowcaseCard"),
      petWishCard: document.getElementById("petWishCard"),
      petLevelGiftCard: document.getElementById("petLevelGiftCard"),
      petWishPanelSlot: document.getElementById("petWishPanelSlot"),
      petCarePlanPanelSlot: document.getElementById("petCarePlanPanelSlot"),
      petEventPanelSlot: document.getElementById("petEventPanelSlot"),
      petStagePanelSlot: document.getElementById("petStagePanelSlot"),
      petShowcasePanelSlot: document.getElementById("petShowcasePanelSlot"),
      petMemoryPanelSlot: document.getElementById("petMemoryPanelSlot"),
      petLevelGiftPanelSlot: document.getElementById("petLevelGiftPanelSlot"),
      petStoryPanelSlot: document.getElementById("petStoryPanelSlot"),
      petCareScore: document.getElementById("petCareScore"),
      petCareChecklist: document.getElementById("petCareChecklist"),
      petEventCard: document.getElementById("petEventCard"),
      petStoryCard: document.getElementById("petStoryCard"),
      petMemoryCard: document.getElementById("petMemoryCard"),
      petTaskSummary: document.getElementById("petTaskSummary"),
      taskTodayCount: document.getElementById("taskTodayCount"),
      taskWrongReviewCount: document.getElementById("taskWrongReviewCount"),
      taskCoinCount: document.getElementById("taskCoinCount"),
      petDailyTaskList: document.getElementById("petDailyTaskList"),
      petWeeklyTaskList: document.getElementById("petWeeklyTaskList"),
      openPetShopBtn: document.getElementById("openPetShopBtn"),
      openPetBagBtn: document.getElementById("openPetBagBtn"),
      openPetTaskBtn: document.getElementById("openPetTaskBtn"),
      openPetPlanBtn: document.getElementById("openPetPlanBtn"),
      openPetDressupBtn: document.getElementById("openPetDressupBtn"),
      openPetAchievementBtn: document.getElementById("openPetAchievementBtn"),
      petShopModal: document.getElementById("petShopModal"),
      petBagModal: document.getElementById("petBagModal"),
      petTaskModal: document.getElementById("petTaskModal"),
      petCarePanelModal: document.getElementById("petCarePanelModal"),
      petGrowthPanelModal: document.getElementById("petGrowthPanelModal"),
      petPlanMenuModal: document.getElementById("petPlanMenuModal"),
      petDressupModal: document.getElementById("petDressupModal"),
      petThemeShopModal: document.getElementById("petThemeShopModal"),
      petAchievementModal: document.getElementById("petAchievementModal"),
      petShopGrid: document.getElementById("petShopGrid"),
      petBagList: document.getElementById("petBagList"),
      petDressupGrid: document.getElementById("petDressupGrid"),
      petThemeShopGrid: document.getElementById("petThemeShopGrid"),
      petThemeShopBoard: document.getElementById("petThemeShopBoard"),
      petAchievementList: document.getElementById("petAchievementList"),
      petDressupSummary: document.getElementById("petDressupSummary"),
      petThemeShopSummary: document.getElementById("petThemeShopSummary"),
      petAchievementSummary: document.getElementById("petAchievementSummary"),
      petShopAdvisor: document.getElementById("petShopAdvisor"),
      petDressupPreview: document.getElementById("petDressupPreview"),
      petAchievementBoard: document.getElementById("petAchievementBoard"),
      petShopDetail: document.getElementById("petShopDetail"),
      petBagDetail: document.getElementById("petBagDetail"),
      petRenameCard: document.getElementById("petRenameCard"),
      petNameInput: document.getElementById("petNameInput"),
      confirmRenamePetBtn: document.getElementById("confirmRenamePetBtn"),
      cancelRenamePetBtn: document.getElementById("cancelRenamePetBtn"),
      petRoomCatBtn: document.getElementById("petRoomCatBtn"),
      learningModal: document.getElementById("learningModal"),
      learningKnowledgeMap: document.getElementById("learningKnowledgeMap"),
      systemModal: document.getElementById("systemModal"),
      systemProfileNameInput: document.getElementById("systemProfileNameInput"),
      saveSystemProfileBtn: document.getElementById("saveSystemProfileBtn"),
      archiveModal: document.getElementById("archiveModal"),
      practiceWrongAllBtn: document.getElementById("practiceWrongAllBtn"),
      practiceWeakBtn: document.getElementById("practiceWeakBtn"),
      deleteSelectedBtn: document.getElementById("deleteSelectedBtn"),
      wrongPointFilter: document.getElementById("wrongPointFilter"),
      wrongCauseFilter: document.getElementById("wrongCauseFilter"),
      wrongbookList: document.getElementById("wrongbookList"),
      reportToday: document.getElementById("reportToday"),
      reportAccuracy: document.getElementById("reportAccuracy"),
      reportStreak: document.getElementById("reportStreak"),
      reportWeakCount: document.getElementById("reportWeakCount"),
      reportGoal: document.getElementById("reportGoal"),
      reportChallenge: document.getElementById("reportChallenge"),
      levelTag: document.getElementById("levelTag"),
      rewardGrid: document.getElementById("rewardGrid"),
      weekGrid: document.getElementById("weekGrid"),
      masteryGrid: document.getElementById("masteryGrid"),
      parentAdviceList: document.getElementById("parentAdviceList"),
      trendReportList: document.getElementById("trendReportList"),
      causeReportList: document.getElementById("causeReportList"),
      historyList: document.getElementById("historyList"),
      startWeakReportBtn: document.getElementById("startWeakReportBtn"),
      clearTodayBtn: document.getElementById("clearTodayBtn"),
      printGrade: document.getElementById("printGrade"),
      printPoint: document.getElementById("printPoint"),
      printCount: document.getElementById("printCount"),
      perPageInput: document.getElementById("perPageInput"),
      printPresets: document.getElementById("printPresets"),
      paperDirection: document.getElementById("paperDirection"),
      printTemplateSelect: document.getElementById("printTemplateSelect"),
      printExportMode: document.getElementById("printExportMode"),
      printNameLine: document.getElementById("printNameLine"),
      answerSpaceSelect: document.getElementById("answerSpaceSelect"),
      generatePrintBtn: document.getElementById("generatePrintBtn"),
      printWeakBtn: document.getElementById("printWeakBtn"),
      printBtn: document.getElementById("printBtn"),
      paperStage: document.getElementById("paperStage"),
      profileNameInput: document.getElementById("profileNameInput"),
      profileGradeInput: document.getElementById("profileGradeInput"),
      saveProfileBtn: document.getElementById("saveProfileBtn"),
      addProfileBtn: document.getElementById("addProfileBtn"),
      deleteProfileBtn: document.getElementById("deleteProfileBtn"),
      profileList: document.getElementById("profileList"),
      exportBtn: document.getElementById("exportBtn"),
      copyExportBtn: document.getElementById("copyExportBtn"),
      chooseArchiveFileBtn: document.getElementById("chooseArchiveFileBtn"),
      importFileInput: document.getElementById("importFileInput"),
      clearAllBtn: document.getElementById("clearAllBtn"),
      importText: document.getElementById("importText"),
      importBtn: document.getElementById("importBtn"),
      importPreview: document.getElementById("importPreview"),
      saveStatus: document.getElementById("saveStatus"),
      ruleCheckBtn: document.getElementById("ruleCheckBtn"),
      ruleCheckResult: document.getElementById("ruleCheckResult")
    };

    function uid(prefix = "id") {
      return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    function rand(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function pick(items) {
      return items[rand(0, items.length - 1)];
    }
    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
    function round1(value) {
      return Math.round(value * 10) / 10;
    }
    function formatAnswer(value, label) {
      if (label) return label;
      const number = Number(value);
      if (!Number.isFinite(number)) return String(value ?? "");
      return Number.isInteger(number) ? String(number) : number.toFixed(2);
    }
    function formatDecimalText(value) {
      return String(value ?? "").replace(/-?\d+\.\d+/g, (match) => {
        const number = Number(match);
        return Number.isFinite(number) ? number.toFixed(2) : match;
      });
    }
    function normalizeQuestionDisplay(question) {
      if (!question || typeof question !== "object") return question;
      ["text", "answerLabel", "explanation", "templateType"].forEach((key) => {
        if (typeof question[key] === "string") question[key] = formatDecimalText(question[key]);
      });
      if (Array.isArray(question.steps)) question.steps = question.steps.map((step) => typeof step === "string" ? formatDecimalText(step) : step);
      return question;
    }
    function answerValueLabel(value, label = "") {
      return label || formatAnswer(value);
    }
    function normalizeAnswerText(value) {
      return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[，,。．]/g, ".")
        .replace(/[：]/g, ":")
        .replace(/[（）()]/g, "")
        .replace(/\s+/g, "")
        .replace(/個/g, "个")
        .replace(/剩余/g, "余")
        .replace(/余数/g, "余");
    }
    function comparableAnswerText(value) {
      return normalizeAnswerText(value)
        .replace(/[.。·，,、\s]/g, "")
        .replace(/[袋辆个元米厘米平方厘米立方厘米小时分钟页克千克角人包本张块%]/g, "");
    }
    function parseNumericAnswer(raw) {
      const text = normalizeAnswerText(raw);
      if (!text) return NaN;
      if (/^-?\d+(?:\.\d+)?%$/.test(text)) return Number(text.slice(0, -1));
      if (/^-?\d+(?:\.\d+)?\/-?\d+(?:\.\d+)?$/.test(text)) {
        const [a, b] = text.split("/").map(Number);
        return b === 0 ? NaN : a / b;
      }
      if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
      const withoutUnits = text.replace(/[袋辆个元米厘米平方厘米立方厘米小时分钟页克千克角人包本张块]/g, "");
      if (/^-?\d+(?:\.\d+)?$/.test(withoutUnits)) return Number(withoutUnits);
      return NaN;
    }
    function answerLabelMatches(raw, question) {
      const label = normalizeAnswerText(question?.answerLabel || "");
      if (!label) return false;
      const text = normalizeAnswerText(raw);
      if (!text) return false;
      if (text === label) return true;
      return comparableAnswerText(text) === comparableAnswerText(label);
    }
    function answerMatches(question, parsed) {
      if (answerLabelMatches(parsed.raw, question)) return true;
      const expected = Number(question.answer);
      if (!Number.isFinite(parsed.value) || !Number.isFinite(expected)) return false;
      const tolerance = Number.isInteger(expected) ? 0.05 : 0.08;
      return Math.abs(parsed.value - expected) < tolerance;
    }
    function shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = rand(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    function escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
    }
    function escapeAttr(value) {
      return escapeHTML(value).replace(/`/g, "&#96;");
    }
    function isPlainObject(value) {
      return Boolean(value) && typeof value === "object" && !Array.isArray(value);
    }
    function safeRecordId(value, prefix = "id") {
      const text = String(value || "");
      return /^[A-Za-z0-9_-]{1,80}$/.test(text) ? text : uid(prefix);
    }
    function normalizeCause(cause) {
      const text = String(cause || "").trim();
      if (causes.includes(text)) return text;
      const legacy = {
        "粗心计算错": "计算粗心",
        "进位/退位错误": "计算粗心",
        "乘法口诀不熟": "概念单位",
        "运算顺序弄错": "不会做",
        "步骤顺序": "不会做",
        "其他": "不会做",
        "没看清题目": "读题理解",
        "不会列式": "不会做",
        "概念混淆": "概念单位",
        "单位漏换": "概念单位",
        "最后一步算错": "计算粗心",
        "单位没换算": "概念单位",
        "小数/分数理解不稳": "概念单位"
      };
      return legacy[text] || "未标记";
    }
    function uniquifyRecordIds(items, prefix = "id") {
      const seen = new Set();
      return items.map((item) => {
        let id = safeRecordId(item.id, prefix);
        if (seen.has(id)) id = uid(prefix);
        seen.add(id);
        return { ...item, id };
      });
    }
    function safeThemeId(id) {
      return Object.prototype.hasOwnProperty.call(THEME_REGISTRY, id) ? id : "classic";
    }
    function systemThemeOwned(id, profile = null) {
      const themeId = safeThemeId(id);
      if (INITIAL_SYSTEM_THEME_IDS.includes(themeId)) return true;
      const targetProfile = profile || (typeof activeProfile === "function" ? activeProfile() : null);
      const owned = targetProfile?.rewards?.pet?.systemThemes;
      return Boolean(owned && owned[themeId]);
    }
    function grantSystemTheme(pet, id) {
      const themeId = safeThemeId(id);
      if (!THEME_REGISTRY[themeId]) return false;
      pet.systemThemes = isPlainObject(pet.systemThemes) ? pet.systemThemes : {};
      const had = Boolean(pet.systemThemes[themeId]);
      pet.systemThemes[themeId] = true;
      return !had;
    }
    function unlockedSystemThemeId(id, profile = null) {
      const themeId = safeThemeId(id);
      return systemThemeOwned(themeId, profile) ? themeId : "classic";
    }
    function storageGet(key, fallback = "") {
      return Storage.get(key, fallback);
    }
    function storageSet(key, value) {
      return Storage.set(key, value);
    }
    function storageJSON(key, fallback) {
      return Storage.json(key, fallback);
    }
    function updateSaveStatus(ok = true, message = "") {
      if (!els.saveStatus) return;
      els.saveStatus.classList.toggle("bad", !ok);
      els.saveStatus.textContent = ok
        ? (message || "数据保存状态：已保存。")
        : (message || "数据保存状态：保存失败，请先导出备份，避免学习记录丢失。");
    }
    function updateThemeButtons() {
      els.themeSelects.forEach((select) => {
        Array.from(select.options || []).forEach((option) => {
          const themeId = safeThemeId(option.value);
          const theme = THEME_REGISTRY[themeId];
          if (!option.dataset.baseLabel) option.dataset.baseLabel = option.textContent.trim();
          const owned = systemThemeOwned(themeId);
          option.disabled = !owned;
          option.textContent = owned ? option.dataset.baseLabel : `${theme.icon || ""} 🔒 ${theme.label}`;
        });
        select.value = state.theme;
        select.title = `当前主题：${THEME_REGISTRY[state.theme].label}`;
      });
      els.themeOptions.forEach((button) => {
        const active = button.dataset.themeOption === state.theme;
        button.setAttribute("aria-pressed", String(active));
        button.title = active ? `当前主题：${THEME_REGISTRY[state.theme].label}` : `切换到${button.textContent.trim()}主题`;
      });
    }
    function applyTheme(id, options = {}) {
      const requested = safeThemeId(id);
      const nextTheme = unlockedSystemThemeId(requested);
      if (requested !== nextTheme && options.notify !== false) {
        UI.notify("这个主题还没有解锁，可以去养成计划的主题商店查看。", { tone: "warn" });
      }
      state.theme = nextTheme;
      document.documentElement.dataset.theme = state.theme;
      const meta = document.querySelector("meta[name='theme-color']");
      if (meta) meta.setAttribute("content", THEME_REGISTRY[state.theme].metaColor);
      updateThemeButtons();
      syncCustomSelects();
      if (options.save !== false) {
        storageSet(STORE.theme, state.theme);
      }
    }
    function todayKey(offset = 0) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    function dateKeyFromDayNumber(value) {
      const day = Number(value);
      if (!Number.isFinite(day)) return todayKey();
      const date = new Date(day * 86400000);
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
    }
    function addDaysToKey(key, offset = 0) {
      const base = dayNumber(key || todayKey());
      if (!Number.isFinite(base)) return todayKey(offset);
      return dateKeyFromDayNumber(base + Number(offset || 0));
    }
    function dayNumber(key) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || ""));
      if (!match) return NaN;
      return Math.floor(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / 86400000);
    }
    function daysBetween(from, to = todayKey()) {
      const a = dayNumber(from);
      const b = dayNumber(to);
      if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
      return Math.max(0, b - a);
    }
    function latestProfileActivityTime(profile) {
      if (!profile || !Array.isArray(profile.history)) return 0;
      return profile.history.reduce((latest, item) => Math.max(latest, Number(item?.time) || 0), 0);
    }
    function isMobilePracticeViewport() {
      return window.matchMedia("(max-width: 620px)").matches;
    }
    function isCompactPracticeViewport() {
      return window.matchMedia("(max-width: 1180px)").matches;
    }
    function isCompactAppViewport() {
      return window.matchMedia("(max-width: 1180px)").matches || isAndroidWebView();
    }
    function closeWithMotion(element, afterClose) {
      if (!element || element.hidden) {
        afterClose?.();
        return;
      }
      const token = `${Date.now()}-${Math.random()}`;
      element.dataset.closeToken = token;
      element.classList.add("is-closing");
      window.setTimeout(() => {
        if (element.dataset.closeToken !== token || !element.classList.contains("is-closing")) return;
        element.hidden = true;
        element.classList.remove("is-closing");
        delete element.dataset.closeToken;
        afterClose?.();
      }, isAndroidWebView() ? 40 : 190);
    }
    function waitForPrintLayout() {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }
    function shouldHideAnswerControlsForWrong(question) {
      const mode = question?.interaction?.mode || "input";
      return isCompactPracticeViewport() || mode === "choice" || mode === "judge";
    }
    function normalizeAnswerModeForViewport(mode) {
      return isMobilePracticeViewport() && mode === "step" ? "input" : mode;
    }
    function shouldUseCustomAnswerKeyboard(mode = "input") {
      return (mode === "input" || mode === "step") && isCompactPracticeViewport();
    }
    function syncAnswerModeAvailability() {
      const stepOption = els.answerModeSelect?.querySelector('option[value="step"]');
      if (!stepOption) return;
      const mobile = isMobilePracticeViewport();
      stepOption.disabled = mobile;
      if (mobile && els.answerModeSelect.value === "step") {
        els.answerModeSelect.value = "input";
        state.answerMode = "input";
      }
    }
    function customSelectLabel(select) {
      const option = select?.selectedOptions?.[0] || select?.querySelector("option:checked") || select?.querySelector("option");
      return option ? option.textContent.trim() : "请选择";
    }
    function setCustomSelectOpenState(wrap, isOpen) {
      if (!wrap) return;
      [".field", ".panel", ".practice-workspace", ".app-header"].forEach((selector) => {
        wrap.closest(selector)?.classList.toggle("select-open", isOpen);
      });
    }
    function closeCustomSelects(except = null) {
      document.querySelectorAll(".custom-select.open").forEach((wrap) => {
        if (wrap !== except) {
          wrap.classList.remove("open");
          setCustomSelectOpenState(wrap, false);
          wrap.closest(".field")?.classList.remove("select-active");
          wrap.querySelector(".custom-select-button")?.setAttribute("aria-expanded", "false");
        }
      });
    }
    function renderCustomSelectOptions(select) {
      const wrap = select.closest(".custom-select");
      if (!wrap) return;
      const menu = wrap.querySelector(".custom-select-menu");
      const button = wrap.querySelector(".custom-select-button");
      if (!menu || !button) return;
      button.querySelector(".custom-select-value").textContent = customSelectLabel(select);
      menu.innerHTML = "";
      [...select.options].forEach((option) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "custom-select-option";
        item.textContent = option.textContent;
        item.dataset.value = option.value;
        item.disabled = option.disabled;
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option.selected));
        item.addEventListener("click", () => {
          if (option.disabled) return;
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          renderCustomSelectOptions(select);
          closeCustomSelects();
        });
        menu.appendChild(item);
      });
    }
    function setupCustomSelect(select) {
      if (!select || select.dataset.customSelectReady === "true") return;
      select.dataset.customSelectReady = "true";
      const wrap = document.createElement("span");
      wrap.className = "custom-select";
      if (select.id) wrap.classList.add(`custom-select--${select.id}`);
      select.classList.forEach((className) => wrap.classList.add(`custom-select--${className}`));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "custom-select-button";
      button.setAttribute("aria-haspopup", "listbox");
      button.setAttribute("aria-expanded", "false");
      button.innerHTML = `<span class="custom-select-value"></span><span class="custom-select-arrow" aria-hidden="true"></span>`;
      const menu = document.createElement("span");
      menu.className = "custom-select-menu";
      menu.setAttribute("role", "listbox");
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);
      wrap.appendChild(button);
      wrap.appendChild(menu);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const willOpen = !wrap.classList.contains("open");
        closeCustomSelects(willOpen ? wrap : null);
        renderCustomSelectOptions(select);
        wrap.classList.toggle("open", willOpen);
        setCustomSelectOpenState(wrap, willOpen);
        wrap.closest(".field")?.classList.toggle("select-active", willOpen);
        button.setAttribute("aria-expanded", String(willOpen));
      });
      select.addEventListener("change", () => renderCustomSelectOptions(select));
      renderCustomSelectOptions(select);
    }
    function syncCustomSelects(root = document) {
      root.querySelectorAll("select").forEach(setupCustomSelect);
      root.querySelectorAll("select[data-custom-select-ready='true']").forEach(renderCustomSelectOptions);
    }
    function createProfile(name = "小学生", grade = 1) {
      return {
        id: uid("student"),
        name,
        grade: clamp(Number(grade) || 1, 1, 6),
        wrongbook: [],
        masteredWrong: [],
        history: [],
        mastery: {},
        updatedAt: Date.now(),
        settings: { pointId: "auto", setSize: 10, adaptive: true, dailyGoal: 20, answerSpace: "auto", answerMode: "auto", printTemplate: "practice", printOutputMode: "answers" },
        rewards: {
          clearedWrong: 0,
          challenge: { gradeLevels: {} },
          pet: createDefaultPetState()
        }
      };
    }
    function defaultPetInventory() {
      return Object.fromEntries(PET_SHOP.map((item) => [item.id, 0]));
    }
    function defaultSystemThemes() {
      return Object.fromEntries(INITIAL_SYSTEM_THEME_IDS.map((id) => [id, true]));
    }
    function createDefaultPetState(options = {}) {
      const today = todayKey();
      return {
        name: "招财",
        coins: 0,
        mood: 70,
        hunger: 70,
        clean: 70,
        bond: 40,
        xp: 0,
        level: 1,
        inventory: defaultPetInventory(),
        careLog: { date: today, encourage: 0, feed: 0, clean: 0, play: 0 },
        tasks: { daily: {}, weekly: {} },
        wish: { date: today, id: "", itemId: "", progress: 0, fulfilled: false },
        rewardsClaimed: {},
        decorations: {},
        systemThemes: defaultSystemThemes(),
        roomTheme: "sunny",
        unlockedThemes: { sunny: true },
        ownedFurniture: {},
        equippedFurniture: {},
        outfits: {},
        outfit: "",
        achievements: { claimed: {} },
        event: { date: today, id: "", progress: 0, resolved: false },
        story: {},
        memories: { wishes: 0, careDays: 0, events: 0, stories: 0, levelGifts: 0, log: [], lastCareCompleteDate: "" },
        lastRewardDate: "",
        lastDecayDate: today,
        lastPracticeDate: "",
        lastCareDate: "",
        runaway: { status: "home", awayDate: "", lostDate: "" },
        ...(options || {})
      };
    }
    function normalizePetName(value) {
      const text = String(value || "").trim().replace(/\s+/g, "");
      if (!text) return "招财";
      if (/^[\u4e00-\u9fa5]{1,6}$/.test(text)) return text;
      if (/^[A-Za-z0-9]{1,12}$/.test(text)) return text;
      return "";
    }
    function petDisplayName(profile = activeProfile()) {
      return normalizePetName(profile?.rewards?.pet?.name) || "招财";
    }
    function petCopy(text, profile = activeProfile()) {
      return String(text || "").replace(/招财/g, petDisplayName(profile));
    }
    function petStageCopy(stage, profile = activeProfile()) {
      return {
        ...(stage || {}),
        name: petCopy(stage?.name || "", profile),
        copy: petCopy(stage?.copy || "", profile)
      };
    }
    function normalizePetBooleanMap(raw = {}, allowedIds = []) {
      const source = isPlainObject(raw) ? raw : {};
      const allowed = new Set(allowedIds);
      const result = {};
      Object.keys(source).forEach((key) => {
        if (!allowed.size || allowed.has(key)) result[key] = Boolean(source[key]);
      });
      return result;
    }
    function countTruthy(record = {}) {
      return Object.values(record || {}).filter(Boolean).length;
    }
    function grantPetTheme(pet, id) {
      if (!id || !PET_ROOM_THEME_MAP[id]) return false;
      pet.unlockedThemes = isPlainObject(pet.unlockedThemes) ? pet.unlockedThemes : {};
      const had = Boolean(pet.unlockedThemes[id]);
      pet.unlockedThemes[id] = true;
      return !had;
    }
    function grantPetFurniture(pet, id, equip = true) {
      if (!id || !PET_FURNITURE_MAP[id]) return false;
      pet.ownedFurniture = isPlainObject(pet.ownedFurniture) ? pet.ownedFurniture : {};
      pet.equippedFurniture = isPlainObject(pet.equippedFurniture) ? pet.equippedFurniture : {};
      const had = Boolean(pet.ownedFurniture[id]);
      pet.ownedFurniture[id] = true;
      if (equip) pet.equippedFurniture[id] = true;
      return !had;
    }
    function grantPetOutfit(pet, id, equip = false) {
      if (!id || !PET_OUTFIT_MAP[id]) return false;
      pet.outfits = isPlainObject(pet.outfits) ? pet.outfits : {};
      const had = Boolean(pet.outfits[id]);
      pet.outfits[id] = true;
      if (equip) pet.outfit = id;
      return !had;
    }
    function applyPetLevel(pet) {
      pet.xp = Math.max(0, Number(pet.xp) || 0);
      pet.level = clamp(Math.floor(pet.xp / PET_XP_PER_LEVEL) + 1, 1, 99);
      return pet.level;
    }
    function normalizePetState(raw = {}, profile = null) {
      const base = createDefaultPetState();
      const pet = { ...base, ...(isPlainObject(raw) ? raw : {}) };
      const legacyInventory = {
        basicFood: Math.max(0, Number(raw?.food) || 0),
        yarnBall: Math.max(0, Number(raw?.toys) || 0),
        teaser: Math.max(0, Number(raw?.treats) || 0)
      };
      pet.name = normalizePetName(pet.name) || "招财";
      pet.coins = Math.max(0, Number(pet.coins) || 0);
      pet.mood = clamp(Number(pet.mood) || 70, 0, 100);
      pet.hunger = clamp(Number(pet.hunger) || 70, 0, 100);
      pet.clean = clamp(Number(pet.clean) || 70, 0, 100);
      pet.bond = clamp(Number(pet.bond) || 40, 0, 100);
      pet.inventory = { ...defaultPetInventory(), ...legacyInventory, ...(isPlainObject(pet.inventory) ? pet.inventory : {}) };
      Object.keys(pet.inventory).forEach((key) => {
        pet.inventory[key] = Math.max(0, Math.floor(Number(pet.inventory[key]) || 0));
      });
      pet.careLog = isPlainObject(pet.careLog) ? pet.careLog : {};
      if (pet.careLog.date !== todayKey()) {
        pet.careLog = { date: todayKey(), encourage: 0, feed: 0, clean: 0, play: 0 };
      } else {
        pet.careLog = {
          date: todayKey(),
          encourage: Math.max(0, Number(pet.careLog.encourage) || 0),
          feed: Math.max(0, Number(pet.careLog.feed) || 0),
          clean: Math.max(0, Number(pet.careLog.clean) || 0),
          play: Math.max(0, Number(pet.careLog.play) || 0)
        };
      }
      pet.tasks = {
        daily: isPlainObject(pet.tasks?.daily) ? pet.tasks.daily : {},
        weekly: isPlainObject(pet.tasks?.weekly) ? pet.tasks.weekly : {}
      };
      pet.wish = normalizePetWish(pet.wish, pet);
      pet.rewardsClaimed = isPlainObject(pet.rewardsClaimed) ? pet.rewardsClaimed : {};
      Object.keys(pet.rewardsClaimed).forEach((key) => {
        if (!pet.rewardsClaimed[key]) delete pet.rewardsClaimed[key];
      });
      pet.decorations = isPlainObject(pet.decorations) ? pet.decorations : {};
      Object.keys(pet.decorations).forEach((key) => {
        pet.decorations[key] = Boolean(pet.decorations[key]);
      });
      pet.ownedFurniture = normalizePetBooleanMap(pet.ownedFurniture, PET_FURNITURE.map((item) => item.id));
      pet.equippedFurniture = normalizePetBooleanMap(pet.equippedFurniture, PET_FURNITURE.map((item) => item.id));
      Object.keys(pet.decorations).forEach((key) => {
        if (pet.decorations[key] && PET_FURNITURE_MAP[key]) {
          pet.ownedFurniture[key] = true;
          if (pet.equippedFurniture[key] !== false) pet.equippedFurniture[key] = true;
        }
      });
      applyPetLevel(pet);
      pet.systemThemes = normalizePetBooleanMap(pet.systemThemes, SYSTEM_THEME_IDS);
      INITIAL_SYSTEM_THEME_IDS.forEach((id) => grantSystemTheme(pet, id));
      pet.unlockedThemes = normalizePetBooleanMap(pet.unlockedThemes, PET_ROOM_THEMES.map((item) => item.id));
      grantPetTheme(pet, "sunny");
      PET_ROOM_THEMES.forEach((theme) => {
        if (Number(pet.level || 1) >= Number(theme.minLevel || 1) && Number(theme.price || 0) === 0) grantPetTheme(pet, theme.id);
      });
      pet.roomTheme = PET_ROOM_THEME_MAP[pet.roomTheme] && pet.unlockedThemes?.[pet.roomTheme] ? pet.roomTheme : "sunny";
      pet.outfits = normalizePetBooleanMap(pet.outfits, PET_OUTFITS.map((item) => item.id));
      pet.outfit = PET_OUTFIT_MAP[pet.outfit] && pet.outfits?.[pet.outfit] ? pet.outfit : "";
      pet.achievements = isPlainObject(pet.achievements) ? pet.achievements : {};
      pet.achievements.claimed = normalizePetBooleanMap(pet.achievements.claimed, PET_ACHIEVEMENTS.map((item) => item.id));
      pet.event = normalizePetEvent(pet.event, pet);
      pet.story = normalizePetStory(pet.story);
      pet.memories = normalizePetMemories(pet.memories);
      pet.lastRewardDate = /^\d{4}-\d{2}-\d{2}$/.test(String(pet.lastRewardDate || "")) ? pet.lastRewardDate : "";
      pet.lastDecayDate = /^\d{4}-\d{2}-\d{2}$/.test(String(pet.lastDecayDate || "")) ? pet.lastDecayDate : todayKey();
      pet.lastPracticeDate = /^\d{4}-\d{2}-\d{2}$/.test(String(pet.lastPracticeDate || "")) ? pet.lastPracticeDate : "";
      pet.lastCareDate = /^\d{4}-\d{2}-\d{2}$/.test(String(pet.lastCareDate || "")) ? pet.lastCareDate : "";
      pet.runaway = { status: "home", awayDate: "", lostDate: "", ...(isPlainObject(pet.runaway) ? pet.runaway : {}) };
      if (!["home", "away", "lost"].includes(pet.runaway.status)) pet.runaway.status = "home";
      applyPetLevel(pet);
      applyPetOfflineRules(pet, profile);
      return pet;
    }
    function applyPetOfflineRules(pet, profile = null) {
      const today = todayKey();
      const elapsed = daysBetween(pet.lastDecayDate, today);
      if (elapsed > 0 && pet.runaway.status !== "lost") {
        pet.hunger = clamp(pet.hunger - elapsed * 12, 0, 100);
        pet.clean = clamp(pet.clean - elapsed * 8, 0, 100);
        pet.mood = clamp(pet.mood - elapsed * 7, 0, 100);
        pet.bond = clamp(pet.bond - elapsed * 3, 0, 100);
        pet.lastDecayDate = today;
      }
      const history = Array.isArray(profile?.history) ? profile.history : [];
      const mostRecentPractice = history.map((item) => item.date).filter(Boolean).sort().pop() || pet.lastPracticeDate || today;
      const inactiveDays = daysBetween(mostRecentPractice, today);
      const critical = pet.mood < 10 && pet.hunger < 10 && pet.clean < 10;
      if (pet.runaway.status === "home" && inactiveDays >= 7 && critical) {
        pet.runaway = { status: "away", awayDate: today, lostDate: "" };
      }
      if (pet.runaway.status === "away" && daysBetween(pet.runaway.awayDate, today) > 3) {
        pet.runaway = { status: "lost", awayDate: pet.runaway.awayDate || today, lostDate: today };
      }
    }
    function normalizeProfile(profile) {
      if (!isPlainObject(profile)) return null;
      const normalized = { ...createProfile(profile?.name || "小学生", profile?.grade || 1), ...(profile || {}) };
      normalized.id = safeRecordId(normalized.id, "student");
      normalized.name = String(normalized.name || "小学生").trim().slice(0, 24) || "小学生";
      normalized.grade = clamp(Number(normalized.grade) || 1, 1, 6);
      normalized.updatedAt = Math.max(0, Number(normalized.updatedAt) || latestProfileActivityTime(normalized) || Date.now());
      normalized.wrongbook = Array.isArray(normalized.wrongbook)
        ? uniquifyRecordIds(normalized.wrongbook.map(normalizeWrongItem).filter(Boolean).slice(0, 300), "wrong")
        : [];
      normalized.masteredWrong = Array.isArray(normalized.masteredWrong)
        ? uniquifyRecordIds(normalized.masteredWrong.map(normalizeMasteredWrongItem).filter(Boolean).slice(0, 500), "mastered")
        : [];
      normalized.history = Array.isArray(normalized.history)
        ? normalized.history.map(normalizeHistoryItem).filter(Boolean).slice(0, 2500)
        : [];
      normalized.mastery = normalized.mastery && typeof normalized.mastery === "object" ? normalized.mastery : {};
      normalized.settings = {
        pointId: "auto",
        setSize: 10,
        adaptive: true,
        dailyGoal: 20,
        answerSpace: "auto",
        answerMode: "auto",
        printTemplate: "practice",
        printOutputMode: "answers",
        ...(normalized.settings || {})
      };
      normalized.settings.setSize = clamp(Number(normalized.settings.setSize) || 10, 3, 40);
      normalized.settings.dailyGoal = clamp(Number(normalized.settings.dailyGoal) || 20, 5, 200);
      normalized.settings.pointId = safePointId(normalized.settings.pointId || "auto", normalized.grade);
      if (!["auto", "input", "choice", "judge", "step"].includes(normalized.settings.answerMode)) normalized.settings.answerMode = "auto";
      delete normalized.settings.motionLite;
      if (!["practice", "daily-plan", "exam", "wrong-review", "explain", "parent-sign"].includes(normalized.settings.printTemplate)) normalized.settings.printTemplate = "practice";
      if (!["questions", "answers", "explanations"].includes(normalized.settings.printOutputMode)) normalized.settings.printOutputMode = "answers";
      normalized.rewards = { clearedWrong: 0, challenge: { gradeLevels: {} }, ...(normalized.rewards || {}) };
      normalized.rewards.challenge = {
        gradeLevels: {},
        ...(normalized.rewards.challenge || {})
      };
      normalized.rewards.challenge.gradeLevels = Object.fromEntries(
        Object.entries(normalized.rewards.challenge.gradeLevels || {}).map(([grade, item]) => [String(clamp(Number(grade) || 1, 1, 6)), {
          level: clamp(Number(item?.level) || 1, 1, 30),
          passed: Math.max(0, Number(item?.passed) || 0),
          weekPassed: Math.max(0, Number(item?.weekPassed) || 0),
          bestRate: clamp(Number(item?.bestRate) || 0, 0, 100),
          lastRate: clamp(Number(item?.lastRate) || 0, 0, 100),
          lastPlayedAt: String(item?.lastPlayedAt || ""),
          todayDate: /^\d{4}-\d{2}-\d{2}$/.test(String(item?.todayDate || "")) ? String(item.todayDate) : todayKey(),
          todayPlays: Math.max(0, Number(item?.todayPlays) || 0),
          todayBestLevel: Math.max(0, Number(item?.todayBestLevel) || 0),
          draft: isPlainObject(item?.draft) && item.draft.date === todayKey() ? item.draft : null
        }])
      );
      normalized.rewards.pet = normalizePetState(normalized.rewards.pet || {}, normalized);
      return normalized;
    }
    function pointForQuestion(question) {
      const grade = clamp(Number(question?.grade) || 1, 1, 6);
      const explicit = pointMap[question?.pointId];
      if (explicit && explicit.grade === grade) return explicit;
      const byTopic = availablePoints(grade).find((point) => point.topic === question?.topic);
      return byTopic || availablePoints(grade)[0] || points[0];
    }
    function normalizeStoredQuestion(question) {
      if (!isPlainObject(question)) return null;
      const text = String(question.text || "").trim();
      const answer = Number(question.answer);
      if (!text || !Number.isFinite(answer)) return null;
      const point = pointForQuestion(question);
      const kp = knowledgeProfileFor(point);
      const steps = Array.isArray(question.steps)
        ? question.steps.map((step) => String(step || "").trim()).filter(Boolean).slice(0, 5)
        : [];
      return {
        ...question,
        id: safeRecordId(question.id, "q"),
        grade: point.grade,
        pointId: point.id,
        topic: point.topic,
        kind: String(question.kind || point.label),
        text,
        answer,
        answerLabel: String(question.answerLabel || ""),
        word: Boolean(question.word),
        explanation: String(question.explanation || point.helper || "先看清题意，再按步骤计算。"),
        steps: steps.length ? steps : [String(question.explanation || point.helper || "先看清题意，再按步骤计算。")],
        subskills: Array.isArray(question.subskills) && question.subskills.length ? question.subskills.slice(0, 4) : kp.subskills.slice(0, 3),
        commonPitfalls: Array.isArray(question.commonPitfalls) && question.commonPitfalls.length ? question.commonPitfalls.slice(0, 4) : kp.pitfalls.slice(0, 3),
        templateType: String(question.templateType || templateLabelFor(question)),
        curriculumBand: String(question.curriculumBand || curriculumBandFor(point))
      };
    }
    function normalizeWrongItem(item) {
      if (!isPlainObject(item)) return null;
      const question = normalizeStoredQuestion(item.question);
      if (!question) return null;
      const cause = normalizeCause(item.cause);
      const reviewStage = clamp(Number(item.reviewStage ?? item.correctStreak ?? 0) || 0, 0, 4);
      const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(String(item.dueDate || "")) ? String(item.dueDate) : todayKey();
      return {
        id: safeRecordId(item.id, "wrong"),
        signature: String(item.signature || signature(question)),
        question,
        cause,
        wrongCount: clamp(Number(item.wrongCount) || 1, 1, 999),
        correctStreak: clamp(Number(item.correctStreak) || 0, 0, 3),
        reviewStage,
        dueDate,
        lastReviewedAt: Number(item.lastReviewedAt) || 0,
        lastResult: item.lastResult === "correct" ? "correct" : "wrong",
        updatedAt: Number(item.updatedAt) || Date.now()
      };
    }
    function normalizeMasteredWrongItem(item) {
      if (!isPlainObject(item)) return null;
      const question = normalizeStoredQuestion(item.question);
      if (!question) return null;
      return {
        id: safeRecordId(item.id, "mastered"),
        signature: String(item.signature || signature(question)),
        question,
        cause: normalizeCause(item.cause),
        wrongCount: clamp(Number(item.wrongCount) || 1, 1, 999),
        masteredAt: Number(item.masteredAt || item.updatedAt) || Date.now(),
        reviewCount: clamp(Number(item.reviewCount) || 3, 0, 999)
      };
    }
    function normalizeHistoryItem(item) {
      if (!isPlainObject(item)) return null;
      const grade = clamp(Number(item.grade) || 1, 1, 6);
      const pointId = pointBelongsToGrade(item.pointId, grade) ? item.pointId : "auto";
      return {
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? item.date : todayKey(),
        time: Number(item.time) || Date.now(),
        pointId,
        grade,
        correct: Boolean(item.correct),
        cause: normalizeCause(item.cause),
        mode: ["practice", "wrongbook", "similar", "weak", "timed", "appendix", "hard-word", "challenge"].includes(item.mode) ? item.mode : "practice",
        text: String(item.text || "").slice(0, 160)
      };
    }
    function migrateOldWrongbook() {
      try {
        const old = storageJSON("mathcamp-wrongbook-v2", []);
        if (!Array.isArray(old) || !old.length) return [];
        return old.slice(0, 80).map((item) => normalizeWrongItem({
          id: item.id || uid("wrong"),
          signature: `${item.text}|${item.answer}`,
          question: {
            id: item.questionId || uid("q"),
            grade: item.grade || 1,
            pointId: item.pointId || "g1-20-add",
            topic: item.topic || "addsub",
            kind: item.kind || "旧版错题",
            text: item.text,
            answer: Number(item.answer),
            answerLabel: item.answerLabel || "",
            explanation: item.explanation || "这道题来自旧版错题本。可以先重新做一遍，再根据讲解补充错因。",
            steps: [item.explanation || "先看清题意，再按运算顺序计算。"]
          },
          cause: item.cause || "未标记",
          wrongCount: item.wrongCount || 1,
          correctStreak: item.correctStreak || 0,
          lastResult: item.lastResult || "wrong",
          updatedAt: item.updatedAt || Date.now()
        })).filter(Boolean);
      } catch (_) {
        return [];
      }
    }
    function loadProfiles() {
      try {
        const saved = storageJSON(STORE.profiles, []);
        if (Array.isArray(saved) && saved.length) {
          const normalized = saved.map(normalizeProfile).filter(Boolean);
          if (normalized.length) return normalized;
        }
      } catch (_) {}
      const profile = createProfile("小学生", 1);
      profile.wrongbook = migrateOldWrongbook();
      return [profile];
    }

    const state = {
      view: "practice",
      profiles: loadProfiles(),
      activeId: storageGet(STORE.active, ""),
      grade: 1,
      pointId: "auto",
      setSize: 10,
      adaptive: true,
      mode: "normal",
      answerMode: "auto",
      currentSet: [],
      index: 0,
      checked: false,
      correct: 0,
      streak: 0,
      records: [],
      roundCoins: 0,
      lastWrongRecordId: "",
      setFinished: false,
      challengeMeta: null,
      timedMeta: null,
      printQuestions: [],
      printBlockedReason: "",
      printSignature: "",
      pendingImport: null,
      practiceLayer: "setup",
      stepHintOpen: false,
      setStartedAt: 0,
      setElapsedMs: 0,
      timerId: null,
      timedTimerId: null,
      autoNextId: null,
      petActionTimer: null,
      petRoomFeedbackTimer: null,
      petRoomWalkTimer: null,
      petRoomWalkWarmupTimers: [],
      petRoomWalkMotionTimer: null,
      petTaskClaimLocks: new Set(),
      petItemActionLocks: new Set(),
      theme: safeThemeId(storageGet(STORE.theme, document.documentElement.dataset.theme || "classic")),
      musicOn: storageGet(STORE.music, "false") === "true",
      soundOn: storageGet(STORE.sound, "false") === "true",
      audio: {
        ctx: null,
        bgm: null,
        bgmStartFailed: false,
        effectPlayers: {},
        failedEffects: {},
        keyPlayers: {},
        failedKeys: {},
        unlocked: false,
        unlockPromise: null,
        lastSoundAt: 0,
        lastKeySoundAt: 0
      }
    };
    if (!state.profiles.some((profile) => profile.id === state.activeId)) state.activeId = state.profiles[0].id;

    function activeProfile() {
      return state.profiles.find((profile) => profile.id === state.activeId) || state.profiles[0];
    }
    function todayItems(profile = activeProfile()) {
      return profile.history.filter((item) => item.date === todayKey());
    }
    function dailyGoal(profile = activeProfile()) {
      return clamp(Number(profile.settings?.dailyGoal) || 20, 5, 200);
    }
    function accuracyOf(items) {
      if (!items.length) return 0;
      return Math.round(items.filter((item) => item.correct).length / items.length * 100);
    }
    function learningDaysFor(profile = activeProfile()) {
      const days = new Set(profile.history.map((item) => item.date));
      let count = 0;
      for (let i = 0; i < 365; i += 1) {
        if (days.has(todayKey(-i))) count += 1;
        else break;
      }
      return count;
    }
    function learnerLevel(profile = activeProfile()) {
      return clamp(Math.floor(profile.history.length / 50) + 1, 1, 99);
    }
    function unlockedBadges(profile = activeProfile()) {
      return badgeCatalog.filter((badge) => badge.test(profile));
    }
    function renderDailyGoal() {
      const profile = activeProfile();
      const done = todayItems(profile).length;
      const goal = dailyGoal(profile);
      els.dailyGoalCard.innerHTML = `<strong>${done} / ${goal}</strong><span>${done >= goal ? "今日目标已完成" : "今日目标进度"}</span>`;
      if (els.reportGoal) els.reportGoal.textContent = `${Math.min(100, Math.round(done / goal * 100))}%`;
      renderMissionStrip(profile);
      renderChallengePanel(profile);
      renderHomeDashboard(profile);
    }
    function nextMilestoneCopy(streak = state.streak) {
      if (streak >= 10) return "连对 10+，保持节奏";
      const next = streak >= 5 ? 10 : streak >= 3 ? 5 : 3;
      return `再答对 ${next - streak} 题点亮奖励`;
    }
    function resetChallengeDaily(progress) {
      const today = todayKey();
      if (progress.todayDate !== today) {
        progress.todayDate = today;
        progress.todayPlays = 0;
        progress.todayBestLevel = 0;
        progress.draft = null;
      }
      return progress;
    }
    function normalizeChallengeDraft(raw, grade, level) {
      if (!isPlainObject(raw) || raw.date !== todayKey()) return null;
      const questions = Array.isArray(raw.currentSet)
        ? raw.currentSet.map((question) => {
          const normalized = normalizeStoredQuestion(question);
          if (!normalized) return null;
          if (isPlainObject(question?.interaction)) normalized.interaction = { ...question.interaction };
          return normalized;
        }).filter(Boolean)
        : [];
      if (!questions.length) return null;
      const records = Array.isArray(raw.records)
        ? raw.records.map((record) => {
          if (!record || !record.question) return null;
          const question = normalizeStoredQuestion(record.question);
          if (!question) return null;
          if (isPlainObject(record.question?.interaction)) question.interaction = { ...record.question.interaction };
          return {
            id: safeRecordId(record.id, "record"),
            date: record.date === todayKey() ? record.date : todayKey(),
            time: Number(record.time) || Date.now(),
            question,
            answer: Number(record.answer),
            correct: Boolean(record.correct),
            cause: normalizeCause(record.cause)
          };
        }).filter(Boolean)
        : [];
      return {
        date: todayKey(),
        grade: clamp(Number(raw.grade) || grade, 1, 6),
        level: clamp(Number(raw.level) || level, 1, 30),
        count: questions.length,
        passRate: clamp(Number(raw.passRate) || 80, 50, 100),
        index: clamp(Number(raw.index) || 0, 0, questions.length - 1),
        checked: Boolean(raw.checked),
        correct: clamp(Number(raw.correct) || 0, 0, questions.length),
        streak: clamp(Number(raw.streak) || 0, 0, questions.length),
        roundCoins: Math.max(0, Number(raw.roundCoins) || 0),
        elapsedMs: Math.max(0, Number(raw.elapsedMs) || 0),
        lastWrongRecordId: String(raw.lastWrongRecordId || ""),
        currentSet: questions,
        records
      };
    }
    function renderMissionStrip(profile = activeProfile()) {
      if (!els.missionGoal || !els.missionStreak || !els.missionNext) return;
      const done = todayItems(profile).length;
      const goal = dailyGoal(profile);
      const remaining = Math.max(0, goal - done);
      const wrongCount = currentGradeWrongbook(profile, profile.grade || state.grade).length;
      const total = state.currentSet.length || state.setSize || Number(profile.settings?.setSize) || 10;
      const answered = state.records.filter(Boolean).length;
      els.missionGoal.textContent = done >= goal ? "今日目标已完成" : `${done} / ${goal} 题，还差 ${remaining} 题`;
      els.missionStreak.textContent = state.streak ? `已连对 ${state.streak} 题，${nextMilestoneCopy()}` : "连对 3 题可拿小奖励";
      if (state.setFinished) {
        els.missionNext.textContent = wrongCount ? `错题本还有 ${wrongCount} 题，建议先复习` : "可以继续下一轮或打印题单";
      } else if (answered > 0) {
        els.missionNext.textContent = `本轮已完成 ${answered}/${total}，保持当前速度`;
      } else if (wrongCount) {
        els.missionNext.textContent = `本年级 ${wrongCount} 道错题，适合先复练`;
      } else {
        els.missionNext.textContent = "先完成一轮小练习";
      }
    }
    function challengeProgress(profile = activeProfile(), grade = profile.grade || state.grade) {
      profile.rewards = { clearedWrong: 0, challenge: { gradeLevels: {} }, ...(profile.rewards || {}) };
      profile.rewards.challenge = { gradeLevels: {}, ...(profile.rewards.challenge || {}) };
      const key = String(clamp(Number(grade) || 1, 1, 6));
      if (!profile.rewards.challenge.gradeLevels[key]) {
        profile.rewards.challenge.gradeLevels[key] = { level: 1, passed: 0, bestRate: 0, lastRate: 0, lastPlayedAt: "", todayDate: todayKey(), todayPlays: 0, todayBestLevel: 0, draft: null };
      }
      const progress = resetChallengeDaily(profile.rewards.challenge.gradeLevels[key]);
      const weekKey = currentWeekKey();
      if (progress.weekKey !== weekKey) {
        progress.weekKey = weekKey;
        progress.weekPassed = 0;
      }
      progress.draft = normalizeChallengeDraft(progress.draft, Number(key), progress.level);
      return progress;
    }
    function renderChallengePanel(profile = activeProfile()) {
      const progress = challengeProgress(profile, profile.grade || state.grade);
      const nextCount = clamp(6 + Math.floor((progress.level - 1) / 2), 6, 14);
      const draft = progress.draft;
      const todayBest = progress.todayBestLevel ? `第 ${progress.todayBestLevel} 关` : "还未开始";
      [els.challengePanel, els.homeChallengePanel].filter(Boolean).forEach((panel) => {
        panel.querySelector("strong").textContent = `闯关模式 · 第 ${progress.level} 关`;
        panel.querySelector("span").textContent = draft
          ? `已保存到第 ${draft.index + 1}/${draft.count} 题，今天可继续；本关 ${nextCount} 题，80% 以上过关。`
          : `本关 ${nextCount} 题，80% 以上过关；通过后自动进入下一关。`;
        let stats = panel.querySelector(".challenge-stats");
        if (!stats) {
          stats = document.createElement("div");
          stats.className = "challenge-stats";
          panel.querySelector("div")?.appendChild(stats);
        }
        stats.innerHTML = `
          <b>今日闯关 ${progress.todayPlays || 0} 次</b>
          <b>今日最高 ${todayBest}</b>
          <b>最佳 ${progress.bestRate || "--"}%</b>`;
        const action = panel.querySelector("[data-start-challenge], #startChallengeBtn");
        if (action) action.textContent = draft ? "继续闯关" : "开始闯关";
      });
      if (els.reportChallenge) els.reportChallenge.textContent = progress.level;
      if (els.homeChallengeCopy) els.homeChallengeCopy.textContent = draft ? `继续第 ${progress.level} 关` : `第 ${progress.level} 关 · 今日 ${progress.todayPlays || 0} 次`;
      if (els.homeChallengeModeCopy) els.homeChallengeModeCopy.textContent = draft ? `继续第 ${progress.level} 关` : `第 ${progress.level} 关`;
    }
    function weakPointScore(profile, point) {
      const m = masteryFor(profile, point.id);
      const accuracy = m.attempts ? Math.round(m.correct / m.attempts * 100) : 0;
      const wrongs = profile.wrongbook.filter((item) => item.question.pointId === point.id).length;
      const recent = profile.history.slice(0, 40).filter((item) => item.pointId === point.id && !item.correct).length;
      return { accuracy, wrongs, recent, attempts: m.attempts || 0 };
    }
    function answerModeLabel(mode) {
      return {
        auto: "智能混合",
        input: "直接输入",
        choice: "选择题",
        judge: "判断对错",
        step: "分步作答"
      }[mode] || "智能混合";
    }
    function renderHomeSettingsCard(profile = activeProfile()) {
      if (!els.homeSettingsCard || !profile) return;
      const grade = clamp(Number(state.grade || profile.grade) || 1, 1, 6);
      const pointId = safePointId(state.pointId || profile.settings?.pointId || "auto", grade);
      const mode = normalizeAnswerModeForViewport(state.answerMode || profile.settings?.answerMode || "auto");
      els.homeSettingsCard.innerHTML = `
        <div class="home-settings-main">
          <strong>${escapeHTML(profile.name)}</strong>
          <span>${escapeHTML(gradeNames[grade - 1] || `${grade}年级`)}</span>
        </div>
        <div class="home-settings-meta">
          <span title="知识点：${escapeAttr(pointLabel(pointId))}">知识点：${escapeHTML(pointLabel(pointId))}</span>
          <span>答题：${escapeHTML(answerModeLabel(mode))}</span>
          <span>目标：${dailyGoal(profile)}题</span>
        </div>`;
    }
    function renderHomeDashboard(profile = activeProfile()) {
      if (!els.homeWeakList) return;
      renderHomeSettingsCard(profile);
      const weak = weakestPoints(3);
      const pet = petState(profile);
      const stage = petStageCopy(petGrowthStage(pet), profile);
      const done = todayItems(profile).length;
      const goal = dailyGoal(profile);
      if (els.homePlanCopy) {
        const first = weak[0];
        els.homePlanCopy.textContent = first
          ? `今天按 4 步走：先复习到期错题，再练"${first.label}"，最后用小测或闯关收尾。`
          : "今天按 4 步走：先复习到期错题，再完成一组基础练习，最后用小测或闯关收尾。";
      }
      if (els.homeCockpitMeter) {
        const quality = petLearningQuality(profile);
        const dueCount = dueWrongbook(profile, profile.grade || state.grade).length;
        const pct = clamp(Math.round(done / Math.max(1, goal) * 100), 0, 100);
        els.homeCockpitMeter.innerHTML = `
          <span><b>${done}/${goal}</b><em>今日进度</em><i class="pet-mini-progress"><b style="--value:${pct}%"></b></i></span>
          <span><b>${dueCount}</b><em>待复习</em></span>
          <span><b>${quality.recentCount ? `${quality.rate}%` : "--"}</b><em>${escapeHTML(quality.label)}</em></span>`;
      }
      els.homeWeakList.innerHTML = weak.map((point, index) => {
        const score = weakPointScore(profile, point);
        const meta = score.attempts
          ? `正确率 ${score.accuracy}% · 错题 ${score.wrongs} 道`
          : "新知识点 · 先做基础题";
        return `<button class="weak-chip ${index === 0 ? "active" : ""}" type="button" data-home-point="${point.id}">
          <strong>${escapeHTML(point.label)}</strong>
          <span>${escapeHTML(meta)}</span>
        </button>`;
      }).join("");
      els.homeWeakList.querySelectorAll("[data-home-point]").forEach((btn) => {
        btn.addEventListener("click", () => startPointSet(btn.dataset.homePoint, 8, "weak"));
      });
      if (els.homeRouteList && typeof HomeRoute.buildTodayRoute === "function") {
        const today = todayItems(profile);
        const weakIds = new Set(weak.map((point) => point.id));
        const weakToday = today.filter((item) => item.mode === "weak" || weakIds.has(item.pointId)).length;
        const wrongToday = today.filter((item) => item.mode === "wrongbook").length;
        const timedToday = today.filter((item) => item.mode === "timed").length;
        const challengeToday = today.filter((item) => item.mode === "challenge").length;
        const progress = challengeProgress(profile, profile.grade || state.grade);
        const wrongAvailable = currentGradeWrongbook(profile, profile.grade || state.grade).length;
        const reviewDue = dueWrongbook(profile, profile.grade || state.grade);
        const reviewToday = today.filter((item) => item.mode === "wrongbook").length;
        const reviewTarget = Math.min(3, Math.max(1, reviewDue.length + reviewToday));
        const steps = HomeRoute.buildTodayRoute({
          weakPoint: weak[0] || null,
          weakProgress: weakToday,
          weakTarget: 8,
          reviewProgress: reviewToday,
          reviewTarget,
          reviewDue: reviewDue.length,
          wrongProgress: wrongToday,
          wrongTarget: Math.min(3, Math.max(1, wrongAvailable)),
          wrongAvailable,
          timedProgress: timedToday,
          challengeProgress: Math.max(challengeToday ? 1 : 0, progress.todayPlays ? 1 : 0),
          done,
          goal
        });
        els.homeRouteList.innerHTML = steps.map((step) => `<article class="home-route-step ${step.complete ? "is-complete" : ""} ${step.current ? "is-current" : ""}">
          <div class="home-route-step-head"><b>${escapeHTML(step.index)}</b><strong>${escapeHTML(step.title)}</strong></div>
          <span>${escapeHTML(step.detail)}</span>
          <div class="pet-mini-progress" aria-hidden="true"><i style="--value:${clamp(Number(step.pct) || 0, 0, 100)}%"></i></div>
          <button class="${step.current ? "primary" : "secondary"}" type="button" data-home-route="${escapeAttr(step.action)}" ${step.disabled ? "disabled" : ""}>${escapeHTML(step.actionLabel)}</button>
        </article>`).join("");
        els.homeRouteList.querySelectorAll("[data-home-route]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (btn.dataset.homeRoute === "review") startDueReviewPractice();
            else if (btn.dataset.homeRoute === "wrongbook") startWrongbookPractice();
            else if (btn.dataset.homeRoute === "timed") startTimedQuizSet();
            else if (btn.dataset.homeRoute === "challenge") startChallengeSet();
            else startWeakPractice();
          });
        });
      }
      if (els.homePetTitle) els.homePetTitle.textContent = `${petDisplayName(profile)} · ${stage.name}`;
      if (els.homePetCopy) els.homePetCopy.textContent = `${stage.copy} ${petCareHint(pet)}`;
      if (els.homeTimedCopy) els.homeTimedCopy.textContent = done >= goal ? "目标完成后可挑战" : "10 题 / 5 分钟";
    }
    function renderNumberPad() {
      const keys = [
        "7", "8", "9", "⌫",
        "4", "5", "6", "清空",
        "1", "2", "3", "余",
        "0", ".", "/", "%",
        ":", "-"
      ];
      els.numberPad.innerHTML = keys.map((key) => {
        return `<button type="button" data-key="${key}">${key}</button>`;
      }).join("");
    }
    function renderRewards(profile = activeProfile()) {
      const unlocked = new Set(unlockedBadges(profile).map((badge) => badge.id));
      const pet = renderPetInventory(profile);
      const name = petDisplayName(profile);
      const dailyTasks = PET_DAILY_TASKS.map((task) => petTaskState(profile, task, "daily"));
      const weeklyTasks = PET_WEEKLY_TASKS.map((task) => petTaskState(profile, task, "weekly"));
      const taskReady = [...dailyTasks, ...weeklyTasks].filter((task) => task.complete && !task.claimed).length;
      const taskDone = [...dailyTasks, ...weeklyTasks].filter((task) => task.claimed).length;
      els.levelTag.textContent = `学生 Lv. ${learnerLevel(profile)} · ${name} Lv. ${pet.level}`;
      els.rewardGrid.innerHTML = `
        <article class="badge-card pet-care-card unlocked">
          <strong>${escapeHTML(name)}养成</strong>
          <span>金币 ${pet.coins} · 背包 ${petInventoryCount(pet)} 件 · ${escapeHTML(petStatusLabel(pet))}</span>
          <span>成长经验 ${pet.xp} / 下一等级 ${pet.level * PET_XP_PER_LEVEL}</span>
        </article>
        <article class="badge-card ${taskReady || taskDone ? "unlocked" : ""}">
          <strong>任务奖励</strong>
          <span>${taskReady ? `${taskReady} 项可领取` : `已完成 ${taskDone} 项`}</span>
          <span>答对题目会获得金币，错题复习和每周坚持会有额外奖励。</span>
        </article>
      ` + badgeCatalog.map((badge) => `
        <article class="badge-card ${unlocked.has(badge.id) ? "unlocked" : ""}">
          <strong>${escapeHTML(badge.title)}</strong>
          <span>${escapeHTML(badge.desc)}</span>
        </article>`).join("");
    }
    function renderWeek(profile = activeProfile()) {
      const days = Array.from({ length: 7 }, (_, index) => {
        const offset = index - 6;
        const date = todayKey(offset);
        const items = profile.history.filter((item) => item.date === date);
        return { date, count: items.length, rate: accuracyOf(items) };
      });
      const max = Math.max(1, ...days.map((day) => day.count));
      els.weekGrid.innerHTML = days.map((day) => {
        const label = day.date.slice(5).replace("-", "/");
        const height = `${Math.max(10, Math.round(day.count / max * 92))}px`;
        return `<div class="day-bar"><i style="--h:${height}"></i><span>${label}</span><span>${day.count}题 ${day.count ? day.rate + "%" : "--"}</span></div>`;
      }).join("");
    }
    function recentWindow(profile, days, startOffset = 0) {
      const keys = new Set(Array.from({ length: days }, (_, index) => todayKey(startOffset - index)));
      return profile.history.filter((item) => keys.has(item.date));
    }
    function currentWeekKey(offset = 0) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const start = new Date(date);
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    }
    function currentWeekItems(profile = activeProfile()) {
      const weekStart = currentWeekKey();
      return profile.history.filter((item) => String(item.date || "") >= weekStart && String(item.date || "") <= todayKey());
    }
    function currentWeekMasteredWrong(profile = activeProfile()) {
      const weekStart = new Date(`${currentWeekKey()}T00:00:00`).getTime();
      return (profile.masteredWrong || []).filter((item) => Number(item.masteredAt || 0) >= weekStart);
    }
    function pointAttemptRows(profile, grade = profile.grade) {
      const rows = {};
      profile.history
        .filter((item) => Number(item.grade || grade) === Number(grade))
        .forEach((item) => {
          if (!rows[item.pointId]) rows[item.pointId] = { pointId: item.pointId, total: 0, correct: 0 };
          rows[item.pointId].total += 1;
          if (item.correct) rows[item.pointId].correct += 1;
        });
      return Object.values(rows).map((row) => ({
        ...row,
        rate: row.total ? Math.round(row.correct / row.total * 100) : 0
      }));
    }
    function saveProfiles() {
      const profile = activeProfile();
      if (profile) profile.updatedAt = Date.now();
      const savedProfiles = storageSet(STORE.profiles, JSON.stringify(state.profiles));
      const savedActive = storageSet(STORE.active, state.activeId);
      const ok = Boolean(savedProfiles && savedActive);
      if (!savedProfiles || !savedActive) {
        console.warn("学习数据暂时无法写入本地存储，请导出备份后再继续大量练习。");
        updateSaveStatus(false);
      } else {
        updateSaveStatus(true);
        if (window.MathCampCloudSync && window.MathCampCloudSync.isSyncEnabled()) {
          window.MathCampCloudSync.scheduleSync(state.profiles, state.activeId);
        }
      }
      renderChrome();
      return ok;
    }
    async function initCloudSync() {
      if (!window.MathCampCloudSync) return;
      var CloudSync = window.MathCampCloudSync;
      var savedConfig = CloudSync.getConfig();
      if (savedConfig && savedConfig.url && savedConfig.anonKey) {
        var ok = await CloudSync.initSupabase(savedConfig);
        if (ok) {
          var result = await CloudSync.fullSync(state.profiles, state.activeId);
          if (result.changed) {
            state.profiles = result.profiles;
            if (result.activeId) state.activeId = result.activeId;
            saveProfiles();
            renderChrome();
            UI.notify("云端数据已同步到本地。");
          }
          CloudSync.onSyncStatus(function (status) {
            updateCloudSyncStatus(status);
          });
        }
      }
    }
    function updateCloudSyncStatus(status) {
      var el = document.getElementById("cloudSyncStatus");
      if (!el) return;
      var labels = {
        ready: "☁️ 云端同步已就绪",
        syncing: "🔄 正在同步…",
        synced: "✅ 已同步",
        error: "⚠️ 同步出错，稍后重试",
        retrying: "🔄 重试中…",
        disconnected: "📴 离线模式"
      };
      el.textContent = labels[status] || status;
    }
    function availablePoints(grade = state.grade) {
      const normalizedGrade = clamp(Number(grade) || 1, 1, 6);
      return points.filter((point) => point.grade === normalizedGrade);
    }
    function pointBelongsToGrade(pointId, grade = state.grade) {
      if (pointId === "auto") return true;
      return availablePoints(grade).some((point) => point.id === pointId);
    }
    function safePointId(pointId, grade = state.grade) {
      return pointBelongsToGrade(pointId, grade) ? pointId : "auto";
    }
    function pointLabel(id) {
      return pointMap[id]?.label || "按年级混合";
    }
    function appendixPointForGrade(grade = state.grade) {
      return pointMap[`g${clamp(Number(grade) || 1, 1, 6)}-appendix`] || pointMap["g6-appendix"];
    }
    function wordPointForGrade(grade = state.grade) {
      const map = {
        1: "g1-simple-word",
        2: "g2-simple-word",
        3: "g3-word-two-step",
        4: "g4-word",
        5: "g5-word",
        6: "g6-complex-word"
      };
      return pointMap[map[clamp(Number(grade) || 1, 1, 6)]] || pointMap["g6-complex-word"];
    }
    function curriculumBandFor(point) {
      const grade = clamp(Number(point?.grade) || state.grade, 1, 6);
      const topicBands = {
        addsub: "计算基础",
        compare: "数感比较",
        muldiv: "乘除基础",
        remainder: "除法拓展",
        mixed: "运算顺序",
        twostep: "两步计算",
        vertical: "竖式计算",
        large: "大数计算",
        geometry: "图形与空间",
        decimal: "小数运算",
        fraction: "分数理解",
        unit: "单位换算",
        percent: "百分数应用",
        ratio: "比与比例",
        statistics: "统计读图",
        equation: "方程入门",
        word: "应用建模",
        appendix: "思维拓展"
      };
      const term = grade <= 2 ? "低年级" : grade <= 4 ? "中年级" : "高年级";
      return `${term} / ${topicBands[point?.topic] || "综合练习"}`;
    }
    function templateLabelFor(question) {
      if (!question) return "规则计算";
      if (question.templateType) return question.templateType;
      if (question.word) return "情境应用";
      if (question.topic === "appendix") return "拓展思维";
      if (question.topic === "mixed") return "运算顺序";
      if (question.topic === "twostep") return "两步计算";
      if (question.topic === "vertical") return "竖式计算";
      return "规则计算";
    }
    function methodHintFor(question) {
      if (!question) return '先判断题型，再列式。遇到应用题，先把"已知"和"要求"分开看。';
      const hints = {
        addsub: "加减题先看符号。加法是合起来，减法是拿走或比较差多少。",
        compare: "比较多少一般用减法：大数减小数。",
        muldiv: '乘除题先想"每份多少、几份"或用乘法口诀反推。',
        remainder: "有余数除法先找不超过被除数的最大倍数，再看剩下多少。",
        mixed: "混合运算先看括号，再算乘除，最后算加减。",
        twostep: "两步计算先写第一步的中间结果，再把中间结果放进第二步继续算。",
        vertical: "竖式计算先把相同数位对齐；小数题要把小数点对齐，再从低位算起。",
        large: "大数计算按位对齐，先分步写清楚，不要跳步心算。",
        geometry: "图形题先写公式，再把长、宽、边长这些数字放进去。",
        decimal: "小数加减要小数点对齐；小数乘除先按整数算，再放回小数点。",
        fraction: "分数题先看分母。求几分之几通常先平均分，再取几份。",
        unit: "单位题先写换算关系，例如 1 米 = 100 厘米。",
        percent: "百分数题先把百分数或折扣换成小数/分数，再列式。",
        ratio: "比例题先求总份数，再求每一份是多少。",
        statistics: "统计题先读清表格或数据，找总数、最多最少、平均数这些关键词。",
        equation: "方程题先把未知数看成 x，等式两边做相同的运算。",
        word: '应用题先找"已知什么、要求什么"，再把数量关系翻译成算式。',
        appendix: "附加题不要急着算，先判断模型：规律、和差倍、植树、行程、比例或假设法。"
      };
      return hints[question.topic] || hints.word;
    }
    function verticalSpecFromText(text) {
      const match = String(text || "").match(/用竖式计算：(.+?)\s*([+\-×÷])\s*(.+?)\s*=\s*(.+?)(?:，|$)/);
      if (!match) return null;
      return {
        top: match[1].trim(),
        operator: match[2],
        bottom: match[3].trim(),
        result: match[4].trim()
      };
    }
    function renderQuestionTitle(question) {
      if (!els.questionText) return;
      els.questionText.classList.toggle("word", Boolean(question?.word));
      els.questionText.classList.toggle("vertical-question", question?.topic === "vertical");
      if (question?.topic !== "vertical") {
        els.questionText.textContent = question?.text || "";
        return;
      }
      const spec = question.vertical || verticalSpecFromText(question.text);
      if (!spec) {
        els.questionText.textContent = question.text || "";
        return;
      }
      els.questionText.innerHTML = `
        <span class="vertical-title">用竖式计算</span>
        <span class="vertical-stack" aria-label="${escapeAttr(question.text || "竖式计算")}">
          <span class="vertical-row top">${escapeHTML(spec.top)}</span>
          <span class="vertical-row bottom"><b>${escapeHTML(spec.operator)}</b><span>${escapeHTML(spec.bottom)}</span></span>
          <span class="vertical-line" aria-hidden="true"></span>
          <span class="vertical-row result">${escapeHTML(spec.result || "?")}</span>
        </span>`;
    }
    function stepHintContent(question) {
      const mode = question?.interaction?.mode || "input";
      if (mode !== "step") return "";
      if (!state.stepHintOpen) {
        return `
        <div class="step-gate">
          <strong>提示默认隐藏</strong>
          <span>${escapeHTML(petCopy('先独立读题和列式；需要帮助时，点右侧"让招财提示"。'))}</span>
        </div>`;
      }
      if (!state.checked) {
        return `
        <div class="step-gate">
          <strong>${escapeHTML(petCopy("招财提示"))}</strong>
          <span>${escapeHTML(methodHintFor(question))}</span>
          <span>先写出数量关系，再自己算最终答案；完整步骤会在检查后出现。</span>
        </div>`;
      }
      return `
      <div class="step-solver">
        ${(question.steps || [methodHintFor(question)]).slice(0, 4).map((step, index) => `<div class="step-line"><b>${index + 1}</b><span>${escapeHTML(step)}</span></div>`).join("")}
      </div>`;
    }
    function knowledgeProfileFor(point) {
      if (!point) {
        return {
          rule: "按当前年级混合练习，系统会根据错题和正确率自动分配知识点。",
          subskills: ["口算", "应用理解", "错题巩固"],
          pitfalls: ["看错符号", "跳步计算", "没有检查答案"],
          practice: "建议先做 10 题小轮练习，再看错因报告。"
        };
      }
      const byTopic = {
        addsub: {
          rule: "先判断加法还是减法，再看是否需要进位、退位或按位对齐。",
          subskills: ["数位对齐", "凑十拆数", "进位退位", "反向验算"],
          pitfalls: ["个位满十忘进位", "个位不够减忘退位", "把加减号看反"],
          practice: "先做直接输入，再穿插判断题检查概念。"
        },
        compare: {
          rule: "比较题先找大数和小数，再判断是求多多少、少多少，还是补到目标数。",
          subskills: ["大小比较", "求差", "补数", "关键词识别"],
          pitfalls: ["把多多少做成加法", "没有分清谁和谁比较"],
          practice: "适合选择题和直接输入混合练。"
        },
        muldiv: {
          rule: "乘法看每份多少和几份，除法看平均分或包含分。",
          subskills: ["口诀匹配", "乘法意义", "平均分", "乘除互逆"],
          pitfalls: ["口诀不熟", "除法方向弄反", "把份数和每份数混淆"],
          practice: "先用选择题降低挫败，再逐步切到输入。"
        },
        remainder: {
          rule: "先找不超过被除数的最大倍数，再计算剩下多少。",
          subskills: ["找最大倍数", "商和余数", "余数小于除数", "应用表达"],
          pitfalls: ["余数大于除数", "只写商忘记余数"],
          practice: "适合分步作答，先写商，再看余数。"
        },
        mixed: {
          rule: "有括号先算括号，没有括号先乘除后加减，同级从左到右。",
          subskills: ["括号优先", "乘除优先", "同级顺序", "分步书写"],
          pitfalls: ["从左到右乱算", "漏算括号", "中间结果抄错"],
          practice: "建议使用分步作答，减少心算跳步。"
        },
        twostep: {
          rule: "两步计算要先确定第一步算什么，把中间结果写下来，再继续算第二步。",
          subskills: ["找第一步", "记录中间量", "按顺序计算", "结果验算"],
          pitfalls: ["跳过中间结果", "第二步用错数", "加减乘除顺序混乱"],
          practice: "建议先用直接输入，答错后看分步讲解，再做 3 道同类题。"
        },
        vertical: {
          rule: "竖式计算要把个位、十位、百位或小数点对齐，从低位开始算，进位、退位和试商都要写清楚。",
          subskills: ["数位对齐", "进位退位", "小数点对齐", "验算"],
          pitfalls: ["数位没对齐", "进位退位漏写", "小数点位置放错", "除法试商不稳"],
          practice: "建议用直接输入或分步作答；做错后先看竖式步骤，再做同类题巩固。"
        },
        geometry: {
          rule: "先判断图形和公式，再把边长、半径、长宽等数据代入。",
          subskills: ["识别图形", "公式记忆", "单位意识", "代入计算"],
          pitfalls: ["周长面积混淆", "半径直径混淆", "单位漏写"],
          practice: "适合分步作答：公式 -> 代入 -> 计算。"
        },
        word: {
          rule: "先读题找已知和要求，再把数量关系翻译成算式。",
          subskills: ["圈关键词", "数量关系", "列式", "分步计算"],
          pitfalls: ["没看清题目", "不会列式", "只算一步"],
          practice: "优先用分步作答，再做同类题巩固。"
        },
        appendix: {
          rule: "先识别模型，再选择规律、和差倍、植树、行程、比例或假设法。",
          subskills: ["模型识别", "画图列表", "找规律", "逆向思考"],
          pitfalls: ["一上来硬算", "没有找规律", "模型判断错误"],
          practice: "每次少量练习，重在讲清思路。"
        }
      };
      const fallback = {
        rule: `${point.label} 要先看清概念，再按固定方法分步计算。`,
        subskills: ["概念理解", "单位/符号", "分步计算", "检查答案"],
        pitfalls: ["概念混淆", "单位漏换", "最后一步算错"],
        practice: "建议直接输入和分步作答交替使用。"
      };
      const profile = byTopic[point.topic] || fallback;
      if (point.id === "g2-100-add") {
        return {
          rule: "只练 100 以内进位加法和退位减法：加法个位满十要进 1，减法个位不够要向十位借 1。",
          subskills: ["个位进位", "十位加进位", "个位退位", "退位后再减"],
          pitfalls: ["进位后十位忘加 1", "退位后个位没有加 10", "结果超过 100"],
          practice: '建议先用直接输入，再用判断题检查"是否进退位"。'
        };
      }
      return profile;
    }
    function renderKnowledgeDetail() {
      const point = state.pointId === "auto" ? null : pointMap[state.pointId];
      const profile = knowledgeProfileFor(point);
      if (!els.knowledgeDetail) return;
      const wasOpen = Boolean(els.knowledgeDetail.open);
      els.knowledgeDetail.innerHTML = `
        <summary>知识点详情说明</summary>
        <div class="knowledge-card-body">
        <strong>${point ? escapeHTML(point.label) : "按年级混合 / 自适应"}</strong>
        <p>${escapeHTML(profile.rule)}</p>
        <div class="chip-row">${profile.subskills.map((item) => `<span class="mini-chip">${escapeHTML(item)}</span>`).join("")}</div>
        <div class="chip-row">${profile.pitfalls.slice(0, 3).map((item) => `<span class="mini-chip">易错：${escapeHTML(item)}</span>`).join("")}</div>
        <p style="margin-top:10px">${escapeHTML(profile.practice)}</p>
        </div>`;
      els.knowledgeDetail.open = wasOpen;
    }
    function chooseInteractionMode(question, preferred = state.answerMode || "auto") {
      preferred = normalizeAnswerModeForViewport(preferred);
      if (preferred !== "auto") return preferred;
      if (question.word || question.topic === "mixed" || question.topic === "twostep" || question.topic === "vertical" || question.topic === "geometry") return isMobilePracticeViewport() ? "input" : "step";
      if (question.topic === "compare" || question.topic === "muldiv") return Math.random() > 0.5 ? "choice" : "input";
      if (question.topic === "addsub" && Math.random() > 0.7) return "judge";
      return "input";
    }
    function numericDistractors(answer) {
      const base = Number(answer);
      const allowNegative = base < 0;
      const offsets = shuffle([-10, -5, -2, -1, 1, 2, 5, 10, 12]);
      const values = [];
      offsets.forEach((offset) => {
        const value = Number.isInteger(base) ? base + offset : round1(base + offset / 10);
        if (Number.isFinite(value) && (allowNegative || value >= 0) && !values.includes(value) && Math.abs(value - base) > 0.001) values.push(value);
      });
      return values.slice(0, 3);
    }
    function applyQuestionInteraction(question, preferred = state.answerMode || "auto") {
      const mode = chooseInteractionMode(question, preferred);
      const finalMode = question.answerLabel && (mode === "choice" || mode === "judge") ? "input" : mode;
      const interaction = { mode: finalMode };
      if (finalMode === "choice") {
        const options = shuffle([Number(question.answer), ...numericDistractors(question.answer)]).slice(0, 4);
        if (!options.some((value) => Math.abs(value - Number(question.answer)) < 0.001)) options[0] = Number(question.answer);
        interaction.options = shuffle(options).map((value) => ({ label: formatAnswer(value), value }));
      } else if (finalMode === "judge") {
        const wrong = numericDistractors(question.answer)[0] ?? Number(question.answer) + 1;
        const truthful = Math.random() > 0.5;
        interaction.statementValue = truthful ? Number(question.answer) : wrong;
        interaction.truthful = truthful;
      }
      question.interaction = interaction;
      return question;
    }
    function makeStrictQuestionForPoint(point, preferred = state.answerMode) {
      const target = pointMap[point?.id] || point;
      if (!target) return applyQuestionInteraction(makeQuestion(choosePoint()), preferred);
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const question = makeQuestion(target, { strict: true });
        const issues = questionRuleIssues(target, question, { strict: true });
        if (!issues.length) return applyQuestionInteraction(question, preferred);
      }
      return applyQuestionInteraction(makeQuestion(target, { strict: true }), preferred);
    }
    function buildQuestionSetForPoint(point, count, preferred = state.answerMode) {
      const target = pointMap[point?.id] || point;
      if (!target) return [];
      const total = clamp(Number(count) || state.setSize || 10, 1, 80);
      return Array.from({ length: total }, () => makeStrictQuestionForPoint(target, preferred));
    }
    function interactionRuleIssues(question) {
      const interaction = question?.interaction;
      if (!interaction) return [];
      const issues = [];
      if (!["input", "choice", "judge", "step"].includes(interaction.mode)) issues.push("答题方式未知");
      if (interaction.mode === "choice") {
        const values = (interaction.options || []).map((option) => Number(option.value));
        if (values.length < 2) issues.push("选择题选项不足");
        if (!values.some((value) => Math.abs(value - Number(question.answer)) < 0.001)) issues.push("选择题缺少正确答案");
      }
      if (interaction.mode === "judge") {
        if (!Number.isFinite(Number(interaction.statementValue))) issues.push("判断题陈述答案无效");
        if (typeof interaction.truthful !== "boolean") issues.push("判断题真假值无效");
      }
      if (interaction.mode === "step" && !(question.steps || []).length) issues.push("分步题缺少步骤");
      return issues;
    }
    function masteryFor(profile, pointId) {
      if (!profile.mastery[pointId]) profile.mastery[pointId] = { attempts: 0, correct: 0, level: 1, streak: 0 };
      return profile.mastery[pointId];
    }
    function masteryAccuracy(profile, pointId) {
      const m = masteryFor(profile, pointId);
      return m.attempts ? m.correct / m.attempts : 0;
    }
    function weakestPoints(limit = 4) {
      const profile = activeProfile();
      return availablePoints(profile.grade)
        .map((point) => {
          const m = masteryFor(profile, point.id);
          const accuracy = m.attempts ? m.correct / m.attempts : 0.45;
          const wrongs = profile.wrongbook.filter((item) => item.question.pointId === point.id).length;
          return { point, score: accuracy - wrongs * 0.08 + Math.min(m.attempts, 5) * 0.015 };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map((entry) => entry.point);
    }
    function choosePoint() {
      const options = availablePoints(state.grade);
      if (state.pointId !== "auto") return pointMap[state.pointId] || options[0];
      return chooseAutoPoint(options, state.adaptive);
    }
    function chooseAutoPoint(options, adaptive = true) {
      if (!state.adaptive) return pick(options);
      if (!adaptive) return pick(options);
      const profile = activeProfile();
      const recentWrongPointIds = profile.history
        .filter((item) => !item.correct)
        .slice(0, 30)
        .map((item) => item.pointId);
      const weighted = [];
      options.forEach((point) => {
        const m = masteryFor(profile, point.id);
        const accuracy = m.attempts ? m.correct / m.attempts : 0.3;
        const wrongs = profile.wrongbook.filter((item) => item.question.pointId === point.id).length;
        const recentWrongs = recentWrongPointIds.filter((id) => id === point.id).length;
        const coldStart = m.attempts < 3 ? 2 : 0;
        const levelBoost = clamp(6 - (Number(m.level) || 1), 1, 5);
        const weight = clamp(Math.round((1 - accuracy) * 8 + wrongs * 2.4 + recentWrongs * 1.6 + coldStart + levelBoost), 1, 18);
        for (let i = 0; i < weight; i += 1) weighted.push(point);
      });
      return pick(weighted.length ? weighted : options);
    }

    function makeQuestion(point = choosePoint(), options = {}) {
      const profile = activeProfile();
      const level = state.adaptive ? masteryFor(profile, point.id).level : 2;
      const makers = {
        addsub: makeAddSub,
        compare: makeCompare,
        muldiv: makeMulDiv,
        remainder: makeRemainder,
        mixed: makeMixed,
        twostep: makeTwoStep,
        vertical: makeVertical,
        large: makeLarge,
        geometry: makeGeometry,
        decimal: makeDecimal,
        fraction: makeFraction,
        unit: makeUnit,
        percent: makePercent,
        ratio: makeRatio,
        statistics: makeStatistics,
        equation: makeEquation,
        word: makeWord,
        appendix: makeAppendix
      };
      const allowTopicVariation = point.id !== "g2-100-add";
      if (allowTopicVariation && !options.strict && Math.random() < 0.26) {
        const supplemental = makeSupplementalQuestion(point, level);
        if (supplemental) return ensureQuestionMatchesRule(point, supplemental, options);
      }
      if (allowTopicVariation && !options.strict && Math.random() < 0.38) {
        const extra = makeExtraQuestion(point, level);
        if (extra) return ensureQuestionMatchesRule(point, extra, options);
      }
      return ensureQuestionMatchesRule(point, makers[point.topic](point, level), options);
    }
    function baseQuestion(point, data) {
      const kp = knowledgeProfileFor(point);
      return normalizeQuestionDisplay({
        id: uid("q"),
        grade: point.grade || state.grade,
        pointId: point.id,
        topic: point.topic,
        kind: point.label,
        subskills: kp.subskills.slice(0, 3),
        commonPitfalls: kp.pitfalls.slice(0, 3),
        templateType: data?.templateType || (data?.word ? "情境应用" : point.topic === "appendix" ? "拓展思维" : point.topic === "mixed" ? "运算顺序" : point.topic === "twostep" ? "两步计算" : point.topic === "vertical" ? "竖式计算" : "规则计算"),
        curriculumBand: curriculumBandFor(point),
        ...data
      });
    }
    function questionNumbers(question) {
      return (String(question?.text || "").match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(Number.isFinite);
    }
    function questionPatternKey(question) {
      return String(question?.text || "")
        .replace(/-?\d+(?:\.\d+)?/g, "#")
        .replace(/[A-Za-z]/g, "x")
        .replace(/\s+/g, "")
        .slice(0, 80);
    }
    function textHas(question, pattern) {
      return pattern.test(`${question?.text || ""} ${question?.answerLabel || ""} ${question?.explanation || ""}`);
    }
    function textHasMulDiv(question) {
      return textHas(question, /[×÷]/);
    }
    function decimalDisplayIssues(question) {
      const source = [
        question?.text,
        question?.answerLabel,
        question?.explanation,
        ...(Array.isArray(question?.steps) ? question.steps : [])
      ].filter((item) => typeof item === "string").join(" ");
      const matches = source.match(/-?\d+\.\d+/g) || [];
      return matches.filter((item) => !/^-?\d+\.\d{2}$/.test(item));
    }
    function topicSpecificRuleIssues(point, question) {
      const issues = [];
      if (!point || !question) return issues;
      if (!Array.isArray(question.subskills) || !question.subskills.length) issues.push("缺少子技能标记");
      if (!Array.isArray(question.commonPitfalls) || !question.commonPitfalls.length) issues.push("缺少易错点标记");
      if (!question.templateType) issues.push("缺少模板类型标记");
      if (!question.curriculumBand) issues.push("缺少课程层级标记");
      if (Number(point.grade) === 1 && textHasMulDiv(question)) issues.push("一年级题目混入乘除法");
      const decimalLeaks = decimalDisplayIssues(question);
      if (decimalLeaks.length) issues.push(`小数显示未保留两位：${decimalLeaks.slice(0, 3).join("、")}`);
      if (point.topic === "remainder" && !textHas(question, /余|至少需要|最多能装满|不用填/)) issues.push("余数题缺少余数语境");
      if (point.topic === "fraction" && !textHas(question, /\/|分数|百分|几分之/)) issues.push("分数题缺少分数语境");
      if (point.topic === "percent" && !textHas(question, /%|百分|折/)) issues.push("百分数题缺少百分数/折扣语境");
      if (point.topic === "ratio" && !textHas(question, /比例|比例尺|份|:/)) issues.push("比例题缺少比例语境");
      if (point.topic === "unit" && !textHas(question, /米|厘米|千克|克|小时|分|元|角|公顷|平方米|千米/)) issues.push("单位题缺少单位换算语境");
      if (point.topic === "equation" && !textHas(question, /x|方程|未知数/)) issues.push("方程题缺少未知数语境");
      if (point.topic === "statistics" && !textHas(question, /平均|统计|表|数据|最多|最少|合计/)) issues.push("统计题缺少统计语境");
      if (point.id === "g6-circle" && !textHas(question, /圆|半径|直径|π|3\.14/)) issues.push("圆题缺少圆的公式语境");
      if (point.id === "g5-volume" && !textHas(question, /长方体|正方体|体积|表面积|立方/)) issues.push("体积题缺少立体图形语境");
      if (point.topic === "mixed" && !/[×÷()+\-]/.test(String(question.text || ""))) issues.push("混合运算题缺少运算符");
      if (point.topic === "twostep" && !/[×÷()+\-]/.test(String(question.text || ""))) issues.push("两步计算题缺少运算符");
      if (point.topic === "vertical" && !textHas(question, /竖式|数位|对齐|进位|退位|试商|小数点/)) issues.push("竖式题缺少竖式计算语境");
      return issues;
    }
    function isCarryOrBorrow100(question) {
      const text = String(question?.text || "");
      const add = text.match(/^(\d+)\s*\+\s*(\d+)/);
      const sub = text.match(/^(\d+)\s*-\s*(\d+)/);
      if (add) {
        const a = Number(add[1]);
        const b = Number(add[2]);
        return a > 0 && b > 0 && a + b <= 100 && a + b === Number(question.answer) && (a % 10) + (b % 10) >= 10;
      }
      if (sub) {
        const a = Number(sub[1]);
        const b = Number(sub[2]);
        return a <= 100 && b > 0 && a > b && a - b === Number(question.answer) && (a % 10) < (b % 10);
      }
      return false;
    }
    function questionRuleIssues(point, question, options = {}) {
      const issues = [];
      if (!point || !question) return ["题目为空"];
      if (Number(question.grade) !== Number(point.grade)) issues.push("年级不一致");
      if (question.pointId !== point.id) issues.push("知识点不一致");
      if (question.topic !== point.topic) issues.push("题型主题不一致");
      const numbers = questionNumbers(question);
      const answer = Number(question.answer);
      if (!Number.isFinite(answer)) issues.push("答案不是数字");
      if (point.id === "g1-10-add" && Math.max(...numbers, answer) > 10) issues.push("10以内题越界");
      if (point.id === "g1-20-add" && Math.max(...numbers, answer) > 20) issues.push("20以内题越界");
      if (point.id === "g2-100-add") {
        if (Math.max(...numbers, answer) > 100 || answer < 0) issues.push("100以内题越界");
        if (question.word) issues.push("100以内进退位混入应用题");
        if (!isCarryOrBorrow100(question)) issues.push("不是进位加法或退位减法");
      }
      const calculated = tryEvaluateQuestion(question);
      if (Number.isFinite(calculated) && Math.abs(calculated - answer) > 0.08) issues.push(`题干算式与答案不一致，应为 ${formatAnswer(calculated)}`);
      issues.push(...topicSpecificRuleIssues(point, question));
      return issues;
    }
    function tryEvaluateQuestion(question) {
      const text = String(question?.text || "").trim();
      if (question?.word) return NaN;
      if (question?.answerLabel && /余|:|%|\/|辆|袋|个|元|米|厘米|平方|立方|小时|分钟/.test(question.answerLabel)) return NaN;
      if (/余|至少|最多|填写商|填余数|可填小数|π|取3\.14/.test(text)) return NaN;
      const expr = text.replace(/=.+$/, "").replace("?", "").trim();
      if (!/^[\d\s+\-×÷().]+$/.test(expr)) return NaN;
      const jsExpr = expr.replace(/×/g, "*").replace(/÷/g, "/");
      try {
        const value = Function(`"use strict"; return (${jsExpr});`)();
        return Number.isFinite(value) ? round1(value) : NaN;
      } catch (_) {
        return NaN;
      }
    }
    function ensureQuestionMatchesRule(point, question, options = {}) {
      const issues = questionRuleIssues(point, question, options);
      const mustRepair = options.strict || issues.length > 0;
      if (!mustRepair || !issues.length) return question;
      for (let i = 0; i < 12; i += 1) {
        const retry = ({
          addsub: makeAddSub,
          compare: makeCompare,
          muldiv: makeMulDiv,
          remainder: makeRemainder,
          mixed: makeMixed,
          twostep: makeTwoStep,
          vertical: makeVertical,
          large: makeLarge,
          geometry: makeGeometry,
          decimal: makeDecimal,
          fraction: makeFraction,
          unit: makeUnit,
          percent: makePercent,
          ratio: makeRatio,
          statistics: makeStatistics,
          equation: makeEquation,
          word: makeWord,
          appendix: makeAppendix
        })[point.topic](point, Math.max(1, masteryFor(activeProfile(), point.id).level || 1));
        const retryIssues = questionRuleIssues(point, retry, options);
        if (!retryIssues.length) return retry;
      }
      return question;
    }
    function pointQualityWarnings(point, idCounts, labelCounts) {
      const warnings = [];
      if (!point?.id || !/^g[1-6]-/.test(point.id)) warnings.push("知识点 id 命名不规范");
      if (!Number.isInteger(Number(point?.grade)) || Number(point.grade) < 1 || Number(point.grade) > 6) warnings.push("年级不在 1-6 范围");
      if (!point?.topic || !causeTagsByTopic[point.topic]) warnings.push("题型主题缺少错因标签配置");
      if (!point?.label || String(point.label).length < 3) warnings.push("知识点名称过短");
      if (!point?.short || String(point.short).length > 8) warnings.push("短标题缺失或过长");
      if (!point?.helper || String(point.helper).length < 6) warnings.push("练习说明不够明确");
      if (idCounts.get(point.id) > 1) warnings.push("知识点 id 重复");
      if (labelCounts.get(`${point.grade}-${point.label}`) > 1) warnings.push("同年级知识点名称重复");
      return warnings;
    }
    function questionQualityWarnings(point, question) {
      const warnings = [];
      const text = String(question?.text || "").trim();
      const explanation = String(question?.explanation || "").trim();
      const steps = Array.isArray(question?.steps) ? question.steps.filter(Boolean) : [];
      if (text.length < 5) warnings.push("题干过短");
      if (!/[？?]/.test(text)) warnings.push("题干缺少问号");
      if (explanation.length < 10) warnings.push("解析过短");
      if (steps.length < 2) warnings.push("步骤少于 2 步");
      if (point?.topic === "word" && !question?.word) warnings.push("应用题知识点未标记 word");
      return warnings;
    }
    function runQuestionRuleSelfTest(sampleSize = 80) {
      const oldGrade = state.grade;
      const oldPoint = state.pointId;
      const oldAdaptive = state.adaptive;
      const result = {
        total: 0,
        failed: 0,
        warningTotal: 0,
        categories: {
          strictPoint: { total: 0, failed: 0 },
          gradeRandom: { total: 0, failed: 0 },
          interaction: { total: 0, failed: 0 },
          coverage: { total: 0, failed: 0 }
        },
        warningCategories: {
          metadata: { total: 0, warning: 0 },
          duplicate: { total: 0, warning: 0 },
          answerQuality: { total: 0, warning: 0 }
        },
        failures: [],
        warnings: []
      };
      const record = (category, point, question, issues) => {
        result.total += 1;
        result.categories[category].total += 1;
        if (!issues.length) return;
        result.failed += 1;
        result.categories[category].failed += 1;
        if (result.failures.length < 30) {
          result.failures.push({
            category,
            grade: point?.grade || question?.grade,
            point: point?.label || pointLabel(question?.pointId),
            text: question?.text || "",
            issues
          });
        }
      };
      const warn = (category, point, question, issues) => {
        result.warningCategories[category].total += 1;
        if (!issues.length) return;
        result.warningTotal += 1;
        result.warningCategories[category].warning += 1;
        if (result.warnings.length < 40) {
          result.warnings.push({
            category,
            grade: point?.grade || question?.grade,
            point: point?.label || pointLabel(question?.pointId),
            text: question?.text || "",
            issues
          });
        }
      };
      const idCounts = points.reduce((map, point) => map.set(point.id, (map.get(point.id) || 0) + 1), new Map());
      const labelCounts = points.reduce((map, point) => map.set(`${point.grade}-${point.label}`, (map.get(`${point.grade}-${point.label}`) || 0) + 1), new Map());
      points.forEach((point) => warn("metadata", point, { text: point.helper || point.label }, pointQualityWarnings(point, idCounts, labelCounts)));
      points.forEach((point) => {
        state.grade = point.grade;
        state.pointId = point.id;
        const patterns = new Set();
        const signatures = new Map();
        for (let i = 0; i < sampleSize; i += 1) {
          const mode = ["input", "choice", "judge", "step"][i % 4];
          const question = applyQuestionInteraction(makeQuestion(point, { strict: true }), mode);
          patterns.add(questionPatternKey(question));
          const sig = `${question.text}|${formatAnswer(question.answer, question.answerLabel)}`;
          signatures.set(sig, (signatures.get(sig) || 0) + 1);
          record("strictPoint", point, question, [...questionRuleIssues(point, question, { strict: true }), ...interactionRuleIssues(question)]);
          warn("answerQuality", point, question, questionQualityWarnings(point, question));
        }
        const repeated = [...signatures.entries()].filter(([, count]) => count >= Math.max(6, Math.ceil(sampleSize * .28)));
        warn("duplicate", point, { text: `${point.label} 精确重复 ${repeated.length} 组` }, repeated.length ? [`同一知识点抽样出现高频重复题干：${repeated[0][0].slice(0, 60)}`] : []);
        for (let i = 0; i < Math.max(8, Math.floor(sampleSize / 2)); i += 1) {
          const level = Math.max(1, masteryFor(activeProfile(), point.id).level || 1);
          [makeSupplementalQuestion(point, level), makeExtraQuestion(point, level)]
            .filter(Boolean)
            .map((question) => ensureQuestionMatchesRule(point, question, { strict: true }))
            .forEach((question) => patterns.add(questionPatternKey(question)));
        }
        const minPatterns = point.id === "g2-100-add" || point.topic === "appendix" ? 2 : 3;
        record("coverage", point, { text: `${point.label} 题干模板覆盖 ${patterns.size} 种` }, patterns.size >= minPatterns ? [] : [`题干模板少于 ${minPatterns} 种`]);
      });
      grades.forEach((grade) => {
        state.grade = grade;
        state.pointId = "auto";
        state.adaptive = false;
        const options = availablePoints(grade);
        for (let i = 0; i < sampleSize; i += 1) {
          const target = chooseAutoPoint(options, false);
          const question = applyQuestionInteraction(makeQuestion(target), ["input", "choice", "judge", "step"][i % 4]);
          const actualPoint = pointMap[question.pointId] || target;
          const issues = [
            ...(Number(question.grade) === grade ? [] : [`随机练习混入${gradeNames[(Number(question.grade) || grade) - 1] || "其他年级"}`]),
            ...questionRuleIssues(actualPoint, question),
            ...interactionRuleIssues(question)
          ];
          record("gradeRandom", actualPoint, question, issues);
        }
      });
      points.forEach((point) => {
        state.grade = point.grade;
        state.pointId = point.id;
        ["input", "choice", "judge", "step"].forEach((mode) => {
          const question = applyQuestionInteraction(makeQuestion(point, { strict: true }), mode);
          record("interaction", point, question, interactionRuleIssues(question));
        });
      });
      state.grade = oldGrade;
      state.pointId = oldPoint;
      state.adaptive = oldAdaptive;
      return result;
    }
    function runQuestionQualityAudit(sampleSize = 48) {
      return runQuestionRuleSelfTest(sampleSize);
    }
    function renderRuleCheckResult(result) {
      if (!els.ruleCheckResult) return;
      const labels = {
        strictPoint: "专项练习",
        gradeRandom: "按年级随机",
        interaction: "答题控件",
        coverage: "模板覆盖",
        metadata: "知识点元数据",
        duplicate: "题干重复",
        answerQuality: "解析完整度"
      };
      const categoryText = Object.entries(result.categories).map(([key, item]) => {
        const ok = item.failed === 0 ? "通过" : `${item.failed} 个问题`;
        return `<span>${labels[key] || key}：${item.total} 次，${ok}</span>`;
      }).join(" · ");
      const warningText = Object.entries(result.warningCategories || {}).map(([key, item]) => {
        const ok = item.warning === 0 ? "无预警" : `${item.warning} 个预警`;
        return `<span>${labels[key] || key}：${item.total} 项，${ok}</span>`;
      }).join(" · ");
      const failures = result.failures.slice(0, 8).map((failure) => `
        <li>
          <strong>${labels[failure.category] || failure.category} / ${gradeNames[(Number(failure.grade) || 1) - 1] || "未知年级"} / ${escapeHTML(failure.point || "未知知识点")}</strong><br>
          ${escapeHTML(failure.text || "未记录题干")}<br>
          <span class="muted">${failure.issues.map(escapeHTML).join("；")}</span>
        </li>`).join("");
      const warnings = (result.warnings || []).slice(0, 6).map((warning) => `
        <li>
          <strong>${labels[warning.category] || warning.category} / ${gradeNames[(Number(warning.grade) || 1) - 1] || "未知年级"} / ${escapeHTML(warning.point || "未知知识点")}</strong><br>
          ${escapeHTML(warning.text || "未记录题干")}<br>
          <span class="muted">${warning.issues.map(escapeHTML).join("；")}</span>
        </li>`).join("");
      els.ruleCheckResult.className = `rule-check-panel ${result.failed ? "bad" : "good"}`;
      els.ruleCheckResult.innerHTML = result.failed
        ? `<strong>发现 ${result.failed} 个硬规则风险</strong><p>${categoryText}</p><ul>${failures}</ul><p class="muted">质量预警：${warningText}</p>${warnings ? `<ul>${warnings}</ul>` : ""}<p class="muted">这里只显示前几条；需要完整结果可在控制台运行 mathCampQualityAudit(80)。</p>`
        : `<strong>${result.warningTotal ? `硬规则通过，发现 ${result.warningTotal} 个质量预警` : "质量巡检通过"}</strong><p>${categoryText}</p><p>质量预警：${warningText}</p>${warnings ? `<ul>${warnings}</ul>` : `<p class="muted">本次抽样没有发现年级、知识点、答题控件、重复题干或解析完整度问题。</p>`}`;
    }
    function runRuleCheckFromUI() {
      if (!els.ruleCheckBtn || !els.ruleCheckResult) return;
      els.ruleCheckBtn.disabled = true;
      els.ruleCheckResult.className = "rule-check-panel";
      els.ruleCheckResult.textContent = "正在自动巡检题库质量，请稍等...";
      window.setTimeout(() => {
        try {
          const result = runQuestionQualityAudit(32);
          renderRuleCheckResult(result);
        } catch (error) {
          els.ruleCheckResult.className = "rule-check-panel bad";
          els.ruleCheckResult.textContent = `质量巡检运行失败：${error?.message || error}`;
        } finally {
          els.ruleCheckBtn.disabled = false;
        }
      }, 30);
    }
    function makeSupplementalQuestion(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const templates = {
        addsub: [
          () => {
            const cap = grade === 1 ? 20 : grade === 2 ? 100 : grade === 3 ? 1000 : grade === 4 ? 10000 : grade === 5 ? 100000 : 1000000;
            const a = rand(Math.max(3, Math.floor(cap * 0.08)), Math.max(12, Math.floor(cap * (0.18 + level * 0.05))));
            const b = rand(2, Math.max(8, Math.floor(a * 0.6)));
            return baseQuestion(point, {
              text: `在 ${a} 后面再加 ${b}，结果是多少？`,
              answer: a + b,
              word: true,
              explanation: `"再加"就是加法。把原来的 ${a} 和新增加的 ${b} 合起来，${a} + ${b} = ${a + b}。`,
              steps: [`原来有 ${a}。`, `又增加 ${b}。`, `合起来是 ${a + b}。`]
            });
          },
          () => {
            const total = grade === 1 ? rand(12, 20) : rand(45, 90 + grade * 80);
            const left = rand(3, Math.floor(total / 2));
            return baseQuestion(point, {
              text: `${total} - ? = ${left}`,
              answer: total - left,
              explanation: `被减数是 ${total}，结果是 ${left}，要求减去了多少，用 ${total} - ${left}。`,
              steps: [`看成缺少的减数。`, `${total} - ${left} = ${total - left}。`]
            });
          }
        ],
        compare: [
          () => {
            const a = rand(8, 28 + grade * 12);
            const diff = rand(2, 8 + level * 3);
            return baseQuestion(point, {
              text: `白色金吉拉有 ${a} 张卡片，小朋友比它多 ${diff} 张。小朋友有多少张？`,
              answer: a + diff,
              word: true,
              explanation: `"比它多 ${diff} 张"就是在 ${a} 的基础上加 ${diff}。`,
              steps: [`金吉拉有 ${a} 张。`, `小朋友多 ${diff} 张。`, `${a} + ${diff} = ${a + diff} 张。`]
            });
          },
          () => {
            const a = rand(10, 50 + grade * 15);
            const b = a + rand(3, 18);
            return baseQuestion(point, {
              text: `${a}、${b}、${b - rand(1, 4)} 这三个数里，最小的数是多少？`,
              answer: a,
              word: true,
              explanation: `比较大小时先看高位，三个数中 ${a} 最小。`,
              steps: [`把三个数从小到大比较。`, `最小的是 ${a}。`]
            });
          }
        ],
        muldiv: [
          () => {
            if (grade === 1) return null;
            const groups = rand(2, grade <= 2 ? 9 : 16);
            const each = rand(2, grade <= 2 ? 9 : 24);
            return baseQuestion(point, {
              text: `每组 ${each} 个练习章，有 ${groups} 组，一共有多少个？`,
              answer: each * groups,
              word: true,
              explanation: `每组一样多，求一共多少，用乘法。${each} × ${groups} = ${each * groups}。`,
              steps: [`每组 ${each} 个。`, `有 ${groups} 组。`, `${each} × ${groups} = ${each * groups}。`]
            });
          },
          () => {
            if (grade === 1) return null;
            const each = rand(2, 9 + level);
            const groups = rand(3, 12);
            return baseQuestion(point, {
              text: `${each * groups} 个贴纸平均分给 ${groups} 个小朋友，每人几个？`,
              answer: each,
              word: true,
              explanation: `平均分用除法。${each * groups} ÷ ${groups} = ${each}。`,
              steps: [`总数 ${each * groups}。`, `平均分成 ${groups} 份。`, `每份 ${each}。`]
            });
          }
        ],
        remainder: [
          () => {
            const divisor = rand(3, 9);
            const quotient = rand(5, 16 + level);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} 个本子，每 ${divisor} 个装一包，可以装满几包，还剩几个？`,
              answer: quotient,
              answerLabel: `${quotient} 包，剩 ${remainder} 个`,
              word: true,
              explanation: `${total} ÷ ${divisor} = ${quotient} 余 ${remainder}，所以可以装满 ${quotient} 包，还剩 ${remainder} 个。`,
              steps: [`${divisor} × ${quotient} = ${divisor * quotient}。`, `${total} - ${divisor * quotient} = ${remainder}。`]
            });
          }
        ],
        mixed: [
          () => {
            const a = rand(18, 70 + level * 12);
            const b = rand(2, 9);
            const c = rand(3, 10);
            return baseQuestion(point, {
              text: `${a} + ${b} × ${c} = ?`,
              answer: a + b * c,
              explanation: `没有括号时先乘除后加减。先算 ${b} × ${c} = ${b * c}，再加 ${a}。`,
              steps: [`先算乘法 ${b} × ${c} = ${b * c}。`, `再算 ${a} + ${b * c} = ${a + b * c}。`]
            });
          },
          () => {
            const a = rand(6, 18);
            const b = rand(4, 16);
            const c = pick([2, 3, 4, 5]);
            return baseQuestion(point, {
              text: `(${a} + ${b}) × ${c} - ${a} = ?`,
              answer: (a + b) * c - a,
              explanation: `先算括号，再乘，最后减。`,
              steps: [`${a} + ${b} = ${a + b}。`, `${a + b} × ${c} = ${(a + b) * c}。`, `${(a + b) * c} - ${a} = ${(a + b) * c - a}。`]
            });
          }
        ],
        large: [
          () => {
            const a = rand(12000, 98000);
            const b = rand(3000, 26000);
            return baseQuestion(point, {
              text: `${a} 比 ${b} 多多少？`,
              answer: a - b,
              word: true,
              explanation: `求多多少，用较大的数减较小的数。${a} - ${b} = ${a - b}。`,
              steps: [`大数是 ${a}。`, `小数是 ${b}。`, `相差 ${a - b}。`]
            });
          }
        ],
        geometry: grade <= 2 ? [
          () => {
            const triangles = rand(2, 7);
            const circles = rand(2, 7);
            return baseQuestion(point, {
              text: `图形盒里有 ${triangles} 个三角形和 ${circles} 个圆形，一共有多少个图形？`,
              answer: triangles + circles,
              word: true,
              explanation: `数图形时把两类合起来，用加法。${triangles} + ${circles} = ${triangles + circles}。`,
              steps: [`三角形 ${triangles} 个。`, `圆形 ${circles} 个。`, `一共 ${triangles + circles} 个。`]
            });
          }
        ] : grade === 3 ? [
          () => {
            const side = rand(5, 18);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，周长是多少 cm？`,
              answer: side * 4,
              word: true,
              explanation: `正方形周长 = 边长 × 4。${side} × 4 = ${side * 4}。`,
              steps: [`写公式：周长 = 边长 × 4。`, `代入 ${side} × 4。`]
            });
          }
        ] : grade === 4 ? [
          () => {
            const side = rand(4, 22);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，面积是多少平方厘米？`,
              answer: side * side,
              word: true,
              explanation: `正方形面积 = 边长 × 边长。${side} × ${side} = ${side * side}。`,
              steps: [`写公式：面积 = 边长 × 边长。`, `代入 ${side} × ${side}。`]
            });
          }
        ] : grade === 5 ? [
          () => {
            const side = rand(3, 10);
            return baseQuestion(point, {
              text: `正方体棱长 ${side} cm，体积是多少立方厘米？`,
              answer: side * side * side,
              word: true,
              explanation: `正方体体积 = 棱长 × 棱长 × 棱长。${side} × ${side} × ${side} = ${side * side * side}。`,
              steps: [`写公式：V = a × a × a。`, `代入 ${side}。`]
            });
          }
        ] : [
          () => {
            const radius = rand(2, 8);
            return baseQuestion(point, {
              text: `圆的半径是 ${radius} cm，直径是多少 cm？`,
              answer: radius * 2,
              word: true,
              explanation: `直径是半径的 2 倍。${radius} × 2 = ${radius * 2}。`,
              steps: [`半径 ${radius} cm。`, `直径 = 半径 × 2。`]
            });
          }
        ],
        decimal: [
          () => {
            const a = round1(rand(24, 128) / 10);
            const b = round1(rand(8, 64) / 10);
            return baseQuestion(point, {
              text: `${a} - ${b} = ?`,
              answer: round1(a - b),
              explanation: `小数减法要把小数点对齐，再按位相减。`,
              steps: [`小数点对齐。`, `${a} - ${b} = ${formatAnswer(round1(a - b))}。`]
            });
          }
        ],
        fraction: [
          () => {
            const d = pick([6, 8, 10, 12]);
            const a = rand(1, d - 2);
            const b = rand(1, d - a - 1);
            return baseQuestion(point, {
              text: `${a}/${d} + ${b}/${d} = ?`,
              answer: round1((a + b) / d),
              answerLabel: `${a + b}/${d}`,
              explanation: `同分母分数相加，分母不变，分子相加。${a} + ${b} = ${a + b}。`,
              steps: [`分母都是 ${d}。`, `分子相加得到 ${a + b}。`]
            });
          }
        ],
        unit: [
          () => {
            const kg = rand(2, 18);
            return baseQuestion(point, {
              text: `${kg} 千克 = ? 克`,
              answer: kg * 1000,
              explanation: `1 千克 = 1000 克，所以 ${kg} 千克 = ${kg * 1000} 克。`,
              steps: [`记住换算关系。`, `${kg} × 1000 = ${kg * 1000}。`]
            });
          }
        ],
        percent: [
          () => {
            const price = rand(60, 300);
            const discount = pick([
              { label: "七折", rate: 0.7 },
              { label: "七五折", rate: 0.75 },
              { label: "八折", rate: 0.8 },
              { label: "八五折", rate: 0.85 },
              { label: "九折", rate: 0.9 }
            ]);
            return baseQuestion(point, {
              text: `${price} 元的书打${discount.label}，现价多少元？`,
              answer: round1(price * discount.rate),
              word: true,
              explanation: `${discount.label}表示按原价的 ${Math.round(discount.rate * 100)}% 计算。${price} × ${discount.rate} = ${formatAnswer(round1(price * discount.rate))}。`,
              steps: [`把折扣转成比例。`, `原价 × 折扣比例。`]
            });
          }
        ],
        ratio: [
          () => {
            const a = rand(2, 5);
            const b = rand(3, 7);
            const each = rand(6, 18);
            return baseQuestion(point, {
              text: `红球和蓝球的数量比是 ${a}:${b}，一共有 ${(a + b) * each} 个球。蓝球有多少个？`,
              answer: b * each,
              word: true,
              explanation: `总份数是 ${a + b} 份，每份 ${(a + b) * each} ÷ ${a + b} = ${each} 个，蓝球有 ${b} 份。`,
              steps: [`总份数 ${a} + ${b} = ${a + b}。`, `每份 ${each} 个。`, `蓝球 ${b * each} 个。`]
            });
          }
        ],
        statistics: [
          () => {
            const a = rand(12, 40);
            const b = rand(12, 40);
            const c = rand(12, 40);
            const d = rand(12, 40);
            return baseQuestion(point, {
              text: `四次跳绳分别是 ${a}、${b}、${c}、${d} 下，平均每次多少下？`,
              answer: round1((a + b + c + d) / 4),
              word: true,
              explanation: `平均数 = 总数 ÷ 份数。先求总数，再除以 4。`,
              steps: [`总数是 ${a + b + c + d}。`, `${a + b + c + d} ÷ 4 = ${formatAnswer(round1((a + b + c + d) / 4))}。`]
            });
          }
        ],
        equation: [
          () => {
            const x = rand(3, 20 + level * 5);
            const times = rand(2, 8);
            return baseQuestion(point, {
              text: `${times}x = ${times * x}，x = ?`,
              answer: x,
              explanation: `等式两边同时除以 ${times}，得到 x = ${x}。`,
              steps: [`${times * x} ÷ ${times} = ${x}。`]
            });
          }
        ],
        word: [
          () => {
            if (grade === 1) return null;
            const per = rand(4, grade <= 2 ? 9 : 18);
            const days = rand(3, 8);
            const extra = rand(2, 12);
            return baseQuestion(point, {
              text: `白色金吉拉每天做 ${per} 道口算，连续做 ${days} 天后又多做 ${extra} 道,一共做了多少道？`,
              answer: per * days + extra,
              word: true,
              explanation: `先求连续 ${days} 天一共做多少，再加上多做的 ${extra} 道。`,
              steps: [`${per} × ${days} = ${per * days}。`, `${per * days} + ${extra} = ${per * days + extra}。`]
            });
          },
          () => {
            const total = rand(40, 140 + grade * 20);
            const used = rand(12, Math.floor(total / 2));
            const add = rand(8, 45);
            return baseQuestion(point, {
              text: `书架原有 ${total} 本书，借走 ${used} 本，又放回 ${add} 本。现在有多少本？`,
              answer: total - used + add,
              word: true,
              explanation: `先借走要减，再放回要加。${total} - ${used} + ${add} = ${total - used + add}。`,
              steps: [`借走后 ${total - used} 本。`, `放回后 ${total - used + add} 本。`]
            });
          }
        ],
        appendix: [
          () => {
            const start = rand(2, 12);
            const step = rand(2, 6);
            const gap = rand(1, 4);
            return baseQuestion(point, {
              text: `找规律：${start}，${start + step}，${start + step * 2 + gap}，${start + step * 3 + gap * 3}，下一个数是多少？`,
              answer: start + step * 4 + gap * 6,
              word: true,
              explanation: `相邻差依次是 ${step}、${step + gap}、${step + gap * 2}，下一次应增加 ${step + gap * 3}。`,
              steps: [`先看差的变化。`, `下一次差是 ${step + gap * 3}。`, `下一个数是 ${start + step * 4 + gap * 6}。`]
            });
          }
        ]
      };
      const list = templates[point.topic];
      return list ? pick(list)() : null;
    }
    function makeExtraQuestion(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const templates = {
        addsub: [
          () => {
            const base = grade <= 1 ? 20 : grade <= 2 ? 100 : grade <= 3 ? 1000 : grade <= 4 ? 10000 : 100000;
            const a = grade <= 1 ? rand(2, 8) : rand(Math.floor(base * 0.25), Math.max(Math.floor(base * 0.25) + 10, base - 160));
            const b = grade <= 1 ? rand(2, 8) : rand(18, Math.min(base - a - 12, 120 + level * 40));
            const c = grade <= 1 ? rand(1, Math.max(1, 20 - a - b)) : rand(6, 35);
            return baseQuestion(point, {
              text: `${a} + ${b} + ${c} = ?`,
              answer: a + b + c,
              explanation: `连加题可以先把前两个数相加，再加第三个数。${a} + ${b} + ${c} = ${a + b + c}。`,
              steps: [`先算 ${a} + ${b} = ${a + b}。`, `再加 ${c}，得到 ${a + b + c}。`]
            });
          },
          () => {
            const a = grade <= 1 ? rand(12, 20) : rand(60, 400 + level * 120);
            const b = rand(5, Math.floor(a / 2));
            const c = rand(3, Math.floor((a - b) / 2));
            return baseQuestion(point, {
              text: `${a} - ${b} - ${c} = ?`,
              answer: a - b - c,
              explanation: `连续减法按顺序计算，也可以先把要减的数合起来。${a} - (${b} + ${c}) = ${a - b - c}。`,
              steps: [`先算要减的总数：${b} + ${c} = ${b + c}。`, `再算 ${a} - ${b + c} = ${a - b - c}。`]
            });
          }
        ],
        compare: [
          () => {
            const a = rand(8, grade <= 1 ? 20 : 99);
            const diff = rand(2, grade <= 1 ? 9 : 28);
            return baseQuestion(point, {
              text: `${a + diff} 比 ${a} 多多少？`,
              answer: diff,
              explanation: `求多多少，用较大的数减较小的数。${a + diff} - ${a} = ${diff}。`,
              steps: [`大数是 ${a + diff}。`, `小数是 ${a}。`, `相差 ${diff}。`]
            });
          }
        ],
        muldiv: [
          () => {
            if (grade === 1) return null;
            const a = rand(2, grade <= 2 ? 9 : 24);
            const b = rand(3, 9 + level);
            const c = rand(2, 6);
            return baseQuestion(point, {
              text: `${a} × ${b} + ${c} = ?`,
              answer: a * b + c,
              explanation: `先算乘法，再算加法。${a} × ${b} = ${a * b}，再加 ${c}。`,
              steps: [`先算 ${a} × ${b} = ${a * b}。`, `再算 ${a * b} + ${c} = ${a * b + c}。`]
            });
          },
          () => {
            if (grade === 1) return null;
            const quotient = rand(4, 18);
            const divisor = rand(2, 9);
            const multiplier = rand(2, 5);
            return baseQuestion(point, {
              text: `${quotient * divisor} ÷ ${divisor} × ${multiplier} = ?`,
              answer: quotient * multiplier,
              explanation: `同级运算从左到右。先算 ${quotient * divisor} ÷ ${divisor} = ${quotient}，再乘 ${multiplier}。`,
              steps: [`先算除法得到 ${quotient}。`, `再算 ${quotient} × ${multiplier} = ${quotient * multiplier}。`]
            });
          }
        ],
        remainder: [
          () => {
            const divisor = rand(4, 9);
            const quotient = rand(7, 18);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} ÷ ${divisor} = ?（填余数）`,
              answer: remainder,
              answerLabel: `${quotient} 余 ${remainder}`,
              explanation: `${divisor} × ${quotient} = ${divisor * quotient}，${total} - ${divisor * quotient} = ${remainder}。`,
              steps: [`找最接近的倍数 ${divisor * quotient}。`, `剩下 ${remainder}。`]
            });
          }
        ],
        mixed: [
          () => {
            const a = rand(12, 48);
            const b = rand(2, 8);
            const c = rand(3, 9);
            return baseQuestion(point, {
              text: `(${a} + ${b}) × ${c} = ?`,
              answer: (a + b) * c,
              explanation: `有括号先算括号。${a} + ${b} = ${a + b}，再乘 ${c}。`,
              steps: [`括号：${a} + ${b} = ${a + b}。`, `${a + b} × ${c} = ${(a + b) * c}。`]
            });
          }
        ],
        large: [
          () => {
            const a = rand(12000, 98000);
            const b = rand(2000, 18000);
            const c = rand(500, 3000);
            return baseQuestion(point, {
              text: `${a} + ${b} - ${c} = ?`,
              answer: a + b - c,
              explanation: `大数连加减要按位对齐，先算前两项，再减最后一项。${a} + ${b} - ${c} = ${a + b - c}。`,
              steps: [`先算 ${a} + ${b} = ${a + b}。`, `再算 ${a + b} - ${c} = ${a + b - c}。`]
            });
          }
        ],
        geometry: [
          () => {
            const w = rand(4, 18);
            const h = rand(3, 12);
            return baseQuestion(point, {
              text: `长方形长 ${w} cm，宽 ${h} cm，周长是多少 cm？`,
              answer: (w + h) * 2,
              word: true,
              explanation: `长方形周长 = (长 + 宽) × 2。(${w} + ${h}) × 2 = ${(w + h) * 2}。`,
              steps: [`先算一组长宽和：${w} + ${h} = ${w + h}。`, `再乘 2 得到周长。`]
            });
          },
          () => {
            const side = rand(3, 16);
            return baseQuestion(point, {
              text: `正方形边长 ${side} cm，周长是多少 cm？`,
              answer: side * 4,
              word: true,
              explanation: `正方形四条边一样长，周长 = 边长 × 4。`,
              steps: [`${side} × 4 = ${side * 4}。`]
            });
          }
        ],
        decimal: [
          () => {
            const a = round1(rand(25, 96) / 10);
            const b = round1(rand(12, 68) / 10);
            const c = round1(rand(5, 35) / 10);
            return baseQuestion(point, {
              text: `${a} + ${b} - ${c} = ?`,
              answer: round1(a + b - c),
              explanation: "小数加减混合仍然要小数点对齐，再按从左到右计算。",
              steps: [`先算 ${a} + ${b} = ${formatAnswer(round1(a + b))}。`, `再减 ${c} 得 ${formatAnswer(round1(a + b - c))}。`]
            });
          }
        ],
        fraction: [
          () => {
            const d = pick([5, 6, 8, 10, 12]);
            const a = rand(2, d - 1);
            const b = rand(1, a - 1);
            return baseQuestion(point, {
              text: `${a}/${d} - ${b}/${d} = ?（可填小数）`,
              answer: round1((a - b) / d),
              answerLabel: `${a - b}/${d}`,
              explanation: `同分母分数相减，分母不变，分子相减。${a} - ${b} = ${a - b}。`,
              steps: [`分母都是 ${d}。`, `分子相减：${a} - ${b} = ${a - b}。`]
            });
          }
        ],
        unit: [
          () => {
            const meters = rand(2, 18);
            const cm = rand(5, 95);
            return baseQuestion(point, {
              text: `${meters} 米 ${cm} 厘米 = ? 厘米`,
              answer: meters * 100 + cm,
              explanation: `1 米 = 100 厘米。${meters} 米是 ${meters * 100} 厘米，再加 ${cm} 厘米。`,
              steps: [`${meters} 米 = ${meters * 100} 厘米。`, `合计 ${meters * 100 + cm} 厘米。`]
            });
          }
        ],
        percent: [
          () => {
            const price = rand(80, 360);
            const rate = pick([15, 20, 25, 30, 40]);
            return baseQuestion(point, {
              text: `${price} 元的商品降价 ${rate}%，降价多少元？`,
              answer: round1(price * rate / 100),
              explanation: `降价金额 = 原价 × 降价百分比。${price} × ${rate}% = ${formatAnswer(round1(price * rate / 100))}。`,
              steps: [`把 ${rate}% 看成 ${rate}/100。`, `用 ${price} × ${rate}%。`]
            });
          }
        ],
        ratio: [
          () => {
            const a = rand(2, 6);
            const b = a + rand(1, 5);
            const each = rand(8, 24);
            return baseQuestion(point, {
              text: `甲乙数量比是 ${a}:${b}，甲有 ${a * each} 个，乙有多少个？`,
              answer: b * each,
              explanation: `甲的 ${a} 份是 ${a * each} 个，所以每份是 ${each} 个，乙有 ${b} 份。`,
              steps: [`每份：${a * each} ÷ ${a} = ${each}。`, `乙：${each} × ${b} = ${b * each}。`]
            });
          }
        ],
        statistics: [
          () => {
            const a = rand(18, 40);
            const b = rand(18, 40);
            const c = rand(18, 40);
            return baseQuestion(point, {
              text: `三天分别读书 ${a}、${b}、${c} 页，平均每天读多少页？`,
              answer: round1((a + b + c) / 3),
              word: true,
              explanation: `平均数 = 总数 ÷ 份数。(${a} + ${b} + ${c}) ÷ 3 = ${formatAnswer(round1((a + b + c) / 3))}。`,
              steps: [`总页数：${a + b + c} 页。`, `平均：${a + b + c} ÷ 3。`]
            });
          }
        ],
        equation: [
          () => {
            const x = rand(4, 24 + level * 6);
            const left = rand(8, 32);
            return baseQuestion(point, {
              text: `${left} + x = ${left + x}，x = ?`,
              answer: x,
              explanation: `等式两边同时减去 ${left}，得到 x = ${x}。`,
              steps: [`${left + x} - ${left} = ${x}。`]
            });
          }
        ],
        word: [
          () => {
            const a = rand(12, grade <= 2 ? 60 : 180);
            const b = rand(6, Math.floor(a / 2));
            const c = rand(4, 30);
            return baseQuestion(point, {
              text: `白色金吉拉有 ${a} 颗小鱼饼，送给朋友 ${b} 颗，又得到 ${c} 颗。现在有多少颗？`,
              answer: a - b + c,
              word: true,
              explanation: `先送出要减，再得到要加。${a} - ${b} + ${c} = ${a - b + c}。`,
              steps: [`送出后：${a} - ${b} = ${a - b}。`, `又得到：${a - b} + ${c} = ${a - b + c}。`]
            });
          }
        ],
        appendix: [
          () => {
            const start = rand(3, 15);
            const step = rand(3, 8);
            return baseQuestion(point, {
              text: `找规律：${start}，${start + step}，${start + step * 2}，${start + step * 3}，下一个数是多少？`,
              answer: start + step * 4,
              word: true,
              explanation: `每次增加 ${step}，所以再加一次 ${step}。`,
              steps: [`相邻两个数都相差 ${step}。`, `下一个是 ${start + step * 3} + ${step} = ${start + step * 4}。`]
            });
          }
        ]
      };
      const list = templates[point.topic];
      return list ? pick(list)() : null;
    }
    function makeAddSub(point, level) {
      const maxByGrade = [20, 100, 1000, 10000, 100000, 1000000];
      if (point.id === "g1-10-add") {
        const variant = rand(1, 3);
        if (variant === 1) {
          const answer = rand(2, 10);
          const a = rand(1, answer - 1);
          const b = answer - a;
          return baseQuestion(point, {
            text: `${a} + ${b} = ?`,
            answer,
            explanation: `这是 10 以内加法。可以从 ${a} 开始往后数 ${b} 个数，也可以把两个数合起来，最后得到 ${answer}。`,
            steps: [`先确认结果不能超过 10。`, `从 ${a} 往后数 ${b} 个。`, `得到 ${a} + ${b} = ${answer}。`]
          });
        }
        if (variant === 2) {
          const target = rand(4, 10);
          const known = rand(1, target - 1);
          const answer = target - known;
          return baseQuestion(point, {
            text: `${known} 加上多少等于 ${target}？`,
            answer,
            word: true,
            explanation: `这是 10 以内补数题。想从 ${known} 数到 ${target} 还差几个，也可以用 ${target} - ${known}。`,
            steps: [`目标数是 ${target}。`, `已经有 ${known}。`, `${target} - ${known} = ${answer}，所以还差 ${answer}。`],
            templateType: "补数关系"
          });
        }
        const a = rand(2, 10);
        const b = rand(1, a - 1);
        const answer = a - b;
        return baseQuestion(point, {
          text: `${a} - ${b} = ?`,
          answer,
          explanation: `这是 10 以内减法。可以从 ${a} 里面拿走 ${b} 个，数一数还剩多少，最后得到 ${answer}。`,
          steps: [`先从 ${a} 开始。`, `拿走 ${b} 个。`, `剩下 ${a} - ${b} = ${answer}。`]
        });
      }
      if (point.id === "g2-100-add") {
        const makeCarryAdd = () => {
          const onesA = rand(4, 9);
          const onesB = rand(10 - onesA, 9);
          const tensA = rand(1, 7);
          const maxTensB = Math.max(1, 8 - tensA);
          const tensB = rand(1, maxTensB);
          const a = tensA * 10 + onesA;
          const b = tensB * 10 + onesB;
          const answer = a + b;
          return baseQuestion(point, {
            text: `${a} + ${b} = ?`,
            answer,
            explanation: `这是一道 100 以内进位加法。个位 ${onesA} + ${onesB} 满 10，要向十位进 1，最后得到 ${answer}。`,
            steps: [`先算个位：${onesA} + ${onesB} = ${onesA + onesB}，满 10 进 1。`, `再算十位，记得加上进来的 1。`, `${a} + ${b} = ${answer}。`]
          });
        };
        const makeBorrowSub = () => {
          const onesA = rand(0, 7);
          const onesB = rand(onesA + 1, 9);
          const tensA = rand(3, 9);
          const tensB = rand(1, tensA - 1);
          const a = tensA * 10 + onesA;
          const b = tensB * 10 + onesB;
          const answer = a - b;
          return baseQuestion(point, {
            text: `${a} - ${b} = ?`,
            answer,
            explanation: `这是一道 100 以内退位减法。个位 ${onesA} 不够减 ${onesB}，要从十位退 1 当 10，最后得到 ${answer}。`,
            steps: [`个位不够减：${onesA} < ${onesB}。`, `从十位退 1，个位变成 ${onesA + 10}。`, `${a} - ${b} = ${answer}。`]
          });
        };
        return Math.random() > 0.5 ? makeCarryAdd() : makeBorrowSub();
      }
      const pointGrade = clamp(Number(point.grade) || state.grade, 1, 6);
      const cap = maxByGrade[pointGrade - 1];
      const max = Math.min(cap, Math.round(20 * Math.pow(4.2, pointGrade - 1) * (0.75 + level * 0.18)));
      const op = Math.random() > 0.48 ? "+" : "-";
      const answer = op === "+" ? rand(3, max) : null;
      let a = op === "+" ? rand(2, answer - 1) : rand(2, max);
      let b = op === "+" ? answer - a : rand(1, Math.min(a - 1, Math.max(8, Math.floor(max * (0.35 + level * 0.08)))));
      const finalAnswer = op === "+" ? answer : a - b;
      return baseQuestion(point, {
        text: `${a} ${op} ${b} = ?`,
        answer: finalAnswer,
        explanation: op === "+"
          ? `这是加法，就是把 ${a} 和 ${b} 合在一起。可以先算整十、整百部分，再算剩下的部分，最后得到 ${finalAnswer}。`
          : `这是减法，就是从 ${a} 里面拿走 ${b}。如果不能一下算出，可以把 ${b} 拆成好减的几部分，分步减，最后得到 ${finalAnswer}。`,
        steps: op === "+" ? [`先看运算符号：这是加法。`, `把 ${a} 和 ${b} 合起来。`, `算出 ${a} + ${b} = ${finalAnswer}。`] : [`先看运算符号：这是减法。`, `从 ${a} 里减去 ${b}。`, `算出 ${a} - ${b} = ${finalAnswer}。`]
      });
    }
    function makeCompare(point, level) {
      const a = rand(6, 24 + level * 10);
      const diff = rand(2, 8 + level * 4);
      const b = a + diff;
      const variants = [
        () => baseQuestion(point, {
          text: `${b} 比 ${a} 多多少？`,
          answer: diff,
          word: true,
          explanation: `问"多多少"就是求两个数的差。用较大的 ${b} 减去较小的 ${a}，得到 ${diff}。`,
          steps: [`找到两个数：${b} 和 ${a}。`, `比较多少用减法。`, `${b} - ${a} = ${diff}。`]
        }),
        () => baseQuestion(point, {
          text: `${a} 比 ${b} 少多少？`,
          answer: diff,
          word: true,
          explanation: `问"少多少"也是比较两个数的差。用大数 ${b} 减小数 ${a}，得到 ${diff}。`,
          steps: [`大数是 ${b}。`, `小数是 ${a}。`, `${b} - ${a} = ${diff}。`]
        }),
        () => {
          const target = rand(10, 20 + level * 8);
          const part = rand(2, target - 2);
          return baseQuestion(point, {
            text: `${part} 加上多少等于 ${target}？`,
            answer: target - part,
            word: true,
            explanation: `这是补数题。想从 ${part} 到 ${target} 还差多少，用 ${target} - ${part}。`,
            steps: [`目标是 ${target}。`, `已经有 ${part}。`, `${target} - ${part} = ${target - part}。`]
          });
        },
        () => {
          const nums = [rand(3, 18), rand(5, 24), rand(8, 28)].sort((x, y) => x - y);
          return baseQuestion(point, {
            text: `${nums.join("、")} 这三个数中，最大的数是多少？`,
            answer: nums[2],
            word: true,
            explanation: `比大小时从十位再到个位看。${nums.join("、")} 中最大的数是 ${nums[2]}。`,
            steps: [`按从小到大排：${nums.join(" < ")}。`, `排在最后的是最大数。`, `最大数是 ${nums[2]}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeMulDiv(point, level) {
      const pointGrade = clamp(Number(point.grade) || state.grade, 1, 6);
      const forceDivision = point.id === "g2-table-div";
      const tableOnly = point.id === "g2-table" || forceDivision;
      if (forceDivision) {
        const divisor = rand(2, 9);
        const quotient = rand(2, 9);
        const total = divisor * quotient;
        const variants = [
          () => baseQuestion(point, {
            text: `${total} ÷ ${divisor} = ?`,
            answer: quotient,
            explanation: `这是表内除法，可以用乘法口诀反过来想。因为 ${divisor} × ${quotient} = ${total}，所以 ${total} ÷ ${divisor} = ${quotient}。`,
            steps: [`先看除数是 ${divisor}。`, `想口诀：${divisor} × ${quotient} = ${total}。`, `所以商是 ${quotient}。`]
          }),
          () => baseQuestion(point, {
            text: `${total} 个圆片，每 ${divisor} 个分一组，可以分成几组？`,
            answer: quotient,
            word: true,
            explanation: `每 ${divisor} 个一组，求能分几组，用除法。${total} ÷ ${divisor} = ${quotient}。`,
            steps: [`总数是 ${total}。`, `每组 ${divisor} 个。`, `${total} ÷ ${divisor} = ${quotient} 组。`]
          }),
          () => baseQuestion(point, {
            text: `${total} 支铅笔平均分给 ${quotient} 个小朋友，每人几支？`,
            answer: divisor,
            word: true,
            explanation: `平均分给 ${quotient} 人，每人一样多，用除法。${total} ÷ ${quotient} = ${divisor}。`,
            steps: [`总共有 ${total} 支。`, `平均分给 ${quotient} 人。`, `${total} ÷ ${quotient} = ${divisor} 支。`]
          })
        ];
        return pick(variants)();
      }
      if (tableOnly || Math.random() > 0.45 || pointGrade <= 2) {
        const a = rand(2, tableOnly ? 9 : Math.min(12 + level * 4, pointGrade >= 5 ? 36 : 18));
        const b = rand(2, tableOnly ? 9 : Math.min(9 + level * 2, pointGrade >= 4 ? 20 : 12));
        const variants = [
          () => baseQuestion(point, {
            text: `${a} × ${b} = ?`,
            answer: a * b,
            explanation: `乘法可以看成"${b} 组，每组 ${a} 个"。想乘法口诀或分组相加，${a} × ${b} = ${a * b}。`,
            steps: [`把乘法看成 ${b} 组。`, `每组有 ${a} 个。`, `一共是 ${a} × ${b} = ${a * b}。`]
          }),
          () => baseQuestion(point, {
            text: `${b} 个盘子，每盘放 ${a} 个草莓，一共有多少个草莓？`,
            answer: a * b,
            word: true,
            explanation: `每盘数量相同，求总数用乘法。${a} × ${b} = ${a * b}。`,
            steps: [`每盘 ${a} 个。`, `有 ${b} 个盘子。`, `${a} × ${b} = ${a * b} 个。`]
          }),
          () => baseQuestion(point, {
            text: `${a} + ${a} + ${a} + ${a} = ?`,
            answer: a * 4,
            explanation: `几个相同的数相加，可以改成乘法。这里是 4 个 ${a} 相加，等于 ${a} × 4。`,
            steps: [`看见 4 个 ${a}。`, `改写成 ${a} × 4。`, `${a} × 4 = ${a * 4}。`]
          })
        ];
        return pick(variants)();
      }
      const divisor = rand(2, Math.min(12 + level * 3, pointGrade >= 4 ? 30 : 12));
      const quotient = rand(3, Math.min(16 + level * 7, pointGrade >= 4 ? 70 : 18));
      return baseQuestion(point, {
        text: `${divisor * quotient} ÷ ${divisor} = ?`,
        answer: quotient,
        explanation: `除法表示平均分。想"${divisor} 乘几等于 ${divisor * quotient}"，所以答案是 ${quotient}。`,
        steps: [`把 ${divisor * quotient} 平均分成 ${divisor} 份。`, `想乘法：${divisor} × ${quotient} = ${divisor * quotient}。`, `所以商是 ${quotient}。`]
      });
    }
    function makeRemainder(point, level) {
      const divisor = rand(3, 9 + level);
      const quotient = rand(4, 12 + level * 3);
      const remainder = rand(1, divisor - 1);
      const total = divisor * quotient + remainder;
      const variants = [
        () => baseQuestion(point, {
          text: `${total} ÷ ${divisor} = ?（填写商，小数不用填）`,
          answer: quotient,
          answerLabel: `${quotient} 余 ${remainder}`,
          explanation: `有余数除法先找最接近 ${total} 但不超过它的 ${divisor} 的倍数。${divisor} × ${quotient} = ${divisor * quotient}，还剩 ${remainder}，所以是 ${quotient} 余 ${remainder}。`,
          steps: [`找 ${divisor} 的倍数。`, `${divisor} × ${quotient} = ${divisor * quotient}，再大就超过 ${total}。`, `${total} - ${divisor * quotient} = ${remainder}，所以商 ${quotient} 余 ${remainder}。`]
        }),
        () => baseQuestion(point, {
          text: `${total} 个扣子，每 ${divisor} 个装一袋，最多能装满几袋？`,
          answer: quotient,
          answerLabel: `${quotient} 袋，余 ${remainder} 个`,
          word: true,
          explanation: `每 ${divisor} 个装一袋，先看能装满几袋。${divisor} × ${quotient} = ${divisor * quotient}，还剩 ${remainder} 个。`,
          steps: [`找不超过 ${total} 的 ${divisor} 的倍数。`, `${divisor} × ${quotient} = ${divisor * quotient}。`, `剩下 ${total} - ${divisor * quotient} = ${remainder} 个。`]
        }),
        () => baseQuestion(point, {
          text: `${total} 名同学坐车，每辆车坐 ${divisor} 人，至少需要几辆车？`,
          answer: quotient + 1,
          answerLabel: `${quotient + 1} 辆`,
          word: true,
          explanation: `坐车问题有余数时，剩下的人也需要一辆车。${total} ÷ ${divisor} = ${quotient} 余 ${remainder}，所以至少 ${quotient + 1} 辆。`,
          steps: [`先除：${total} ÷ ${divisor} = ${quotient} 余 ${remainder}。`, `有余下的 ${remainder} 人。`, `所以车数要加 1，是 ${quotient + 1} 辆。`]
        })
      ];
      return pick(variants)();
    }
    function makeMixed(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const variants = [
        () => {
          const a = rand(3, 12 + level * 3);
          const b = rand(2, 10 + level * 2);
          const c = rand(8, 60 + level * 12);
          const answer = a * b + c;
          return baseQuestion(point, {
            text: `${a} × ${b} + ${c} = ?`,
            answer,
            explanation: `混合运算要先算乘除，再算加减。先算 ${a} × ${b} = ${a * b}，再算 ${a * b} + ${c} = ${answer}。`,
            steps: [`先算乘法：${a} × ${b} = ${a * b}。`, `再算加法：${a * b} + ${c} = ${answer}。`]
          });
        },
        () => {
          const c = pick([2, 3, 4, 5, 6, 8, 10]);
          const answer = rand(8, 38 + level * 8);
          const sum = answer * c;
          const a = rand(12, sum - 8);
          const b = sum - a;
          return baseQuestion(point, {
            text: `(${a} + ${b}) ÷ ${c} = ?`,
            answer,
            explanation: `有括号时先算括号。先算 ${a} + ${b} = ${sum}，再算 ${sum} ÷ ${c} = ${answer}。`,
            steps: [`先算括号：${a} + ${b} = ${sum}。`, `再算除法：${sum} ÷ ${c} = ${answer}。`]
          });
        },
        () => {
          const a = rand(70, 220);
          const b = rand(3, 9 + level);
          const c = rand(4, 18 + level * 3);
          const answer = a - b * c;
          return baseQuestion(point, {
            text: `${a} - ${b} × ${c} = ?`,
            answer,
            explanation: `先乘除后加减。先算 ${b} × ${c} = ${b * c}，再算 ${a} - ${b * c} = ${answer}。`,
            steps: [`先算乘法：${b} × ${c} = ${b * c}。`, `再算减法：${a} - ${b * c} = ${answer}。`]
          });
        },
        () => {
          const divisor = rand(3, 9);
          const quotient = rand(8, 28 + level * 6);
          const add = rand(12, 68);
          const dividend = divisor * quotient;
          const answer = quotient + add;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} + ${add} = ?`,
            answer,
            explanation: `先算除法，再算加法。${dividend} ÷ ${divisor} = ${quotient}，${quotient} + ${add} = ${answer}。`,
            steps: [`先算除法：${dividend} ÷ ${divisor} = ${quotient}。`, `再算加法：${quotient} + ${add} = ${answer}。`]
          });
        },
        () => {
          const a = rand(grade <= 3 ? 8 : 18, grade <= 3 ? 40 : 120 + level * 16);
          const b = rand(grade <= 3 ? 4 : 12, grade <= 3 ? 30 : 80 + level * 10);
          const c = rand(2, grade <= 3 ? 6 : 12);
          const d = rand(3, Math.max(4, Math.floor((a + b) * c * 0.35)));
          const answer = (a + b) * c - d;
          return baseQuestion(point, {
            text: `(${a} + ${b}) × ${c} - ${d} = ?`,
            answer,
            explanation: `有括号先算括号，再算乘法，最后算减法。先算 ${a} + ${b} = ${a + b}，再乘 ${c}，最后减 ${d}。`,
            steps: [`先算括号：${a} + ${b} = ${a + b}。`, `再算乘法：${a + b} × ${c} = ${(a + b) * c}。`, `最后减：${(a + b) * c} - ${d} = ${answer}。`],
            templateType: "括号混合"
          });
        },
        () => {
          const divisor = pick([2, 3, 4, 5, 6, 8]);
          const answer = rand(grade <= 3 ? 6 : 12, grade <= 3 ? 28 : 90 + level * 8);
          const multiplier = rand(2, grade <= 3 ? 6 : 12);
          const sum = answer * divisor;
          const a = rand(3, Math.max(4, Math.floor(sum / multiplier) - 1));
          const b = Math.max(2, Math.floor(sum / multiplier) - a);
          const targetSum = a + b;
          const product = targetSum * multiplier;
          return baseQuestion(point, {
            text: `(${a} + ${b}) × ${multiplier} ÷ ${divisor} = ?`,
            answer: round1(product / divisor),
            explanation: `先算括号，再按从左到右算乘除。${a} + ${b} = ${targetSum}，${targetSum} × ${multiplier} = ${product}，再除以 ${divisor}。`,
            steps: [`括号：${a} + ${b} = ${targetSum}。`, `乘法：${targetSum} × ${multiplier} = ${product}。`, `除法：${product} ÷ ${divisor} = ${formatAnswer(round1(product / divisor))}。`],
            templateType: "括号乘除"
          });
        }
      ];
      return pick(variants)();
    }
    function makeTwoStep(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const integerAddSub = (max) => {
        const variant = rand(1, 4);
        if (variant === 1) {
          const a = rand(2, Math.max(3, Math.floor(max * 0.45)));
          const b = rand(2, Math.max(3, Math.floor(max * 0.35)));
          const c = rand(1, Math.max(2, max - a - b));
          return baseQuestion(point, {
            text: `${a} + ${b} + ${c} = ?`,
            answer: a + b + c,
            explanation: `两步连加先算前两个数，再加第三个数。${a} + ${b} = ${a + b}，${a + b} + ${c} = ${a + b + c}。`,
            steps: [`第一步：${a} + ${b} = ${a + b}。`, `第二步：${a + b} + ${c} = ${a + b + c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const a = rand(Math.max(8, Math.floor(max * 0.55)), max);
          const b = rand(2, Math.max(3, Math.floor(a * 0.35)));
          const c = rand(1, Math.max(2, Math.floor((a - b) * 0.45)));
          return baseQuestion(point, {
            text: `${a} - ${b} - ${c} = ?`,
            answer: a - b - c,
            explanation: `两步连减按顺序算，也可以先合并要减的数。`,
            steps: [`第一步：${a} - ${b} = ${a - b}。`, `第二步：${a - b} - ${c} = ${a - b - c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 3) {
          const a = rand(4, Math.max(6, Math.floor(max * 0.4)));
          const b = rand(3, Math.max(5, Math.floor(max * 0.45)));
          const c = rand(2, Math.max(3, Math.floor((a + b) * 0.55)));
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: a + b - c,
            explanation: `加减混合从左到右算，先把两部分合起来，再拿走一部分。`,
            steps: [`第一步：${a} + ${b} = ${a + b}。`, `第二步：${a + b} - ${c} = ${a + b - c}。`],
            templateType: "两步计算"
          });
        }
        const a = rand(Math.max(10, Math.floor(max * 0.45)), max);
        const b = rand(2, Math.max(3, Math.floor(a * 0.35)));
        const c = rand(2, Math.max(3, max - (a - b)));
        return baseQuestion(point, {
          text: `${a} - ${b} + ${c} = ?`,
          answer: a - b + c,
          explanation: `加减混合从左到右算，先减再加。`,
          steps: [`第一步：${a} - ${b} = ${a - b}。`, `第二步：${a - b} + ${c} = ${a - b + c}。`],
          templateType: "两步计算"
        });
      };
      const mulDivAddSub = () => {
        const a = rand(2, grade <= 3 ? 9 : 24 + level * 4);
        const b = rand(2, grade <= 3 ? 9 : 18 + level * 3);
        const c = rand(4, grade <= 3 ? 35 : 120 + level * 30);
        const variant = rand(1, 4);
        if (variant === 1) {
          return baseQuestion(point, {
            text: `${a} × ${b} + ${c} = ?`,
            answer: a * b + c,
            explanation: `先算乘法，再算加法。${a} × ${b} = ${a * b}，再加 ${c}。`,
            steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${a * b} + ${c} = ${a * b + c}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const quotient = rand(4, grade <= 3 ? 18 : 60 + level * 8);
          const divisor = rand(2, grade <= 3 ? 9 : 16);
          const add = rand(5, grade <= 3 ? 40 : 120);
          const dividend = quotient * divisor;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} + ${add} = ?`,
            answer: quotient + add,
            explanation: `先算除法，再算加法。${dividend} ÷ ${divisor} = ${quotient}，再加 ${add}。`,
            steps: [`第一步：${dividend} ÷ ${divisor} = ${quotient}。`, `第二步：${quotient} + ${add} = ${quotient + add}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 3) {
          const left = rand(grade <= 3 ? 6 : 20, grade <= 3 ? 40 : 180);
          const right = rand(grade <= 3 ? 4 : 12, grade <= 3 ? 35 : 120);
          const multiplier = rand(2, grade <= 3 ? 6 : 12);
          return baseQuestion(point, {
            text: `(${left} + ${right}) × ${multiplier} = ?`,
            answer: (left + right) * multiplier,
            explanation: `有括号时先算括号，再算乘法。先合起来，再看有几组。`,
            steps: [`第一步：${left} + ${right} = ${left + right}。`, `第二步：${left + right} × ${multiplier} = ${(left + right) * multiplier}。`],
            templateType: "两步计算"
          });
        }
        const lower = Math.max(60, a * b + 10);
        const upper = Math.max(lower + 40, grade <= 3 ? 180 : 520 + level * 80);
        const base = rand(lower, upper);
        return baseQuestion(point, {
          text: `${base} - ${a} × ${b} = ?`,
          answer: base - a * b,
          explanation: `先算乘法，再算减法。${a} × ${b} = ${a * b}，再用 ${base} 减去中间结果。`,
          steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${base} - ${a * b} = ${base - a * b}。`],
          templateType: "两步计算"
        });
      };
      const twoStepMulDiv = () => {
        const tableMax = grade <= 1 ? 5 : 9;
        const variant = rand(1, 5);
        if (variant === 1) {
          const a = rand(2, tableMax);
          const b = rand(2, grade <= 1 ? 4 : tableMax);
          const c = rand(2, grade <= 1 ? 3 : 6);
          return baseQuestion(point, {
            text: `${a} × ${b} × ${c} = ?`,
            answer: a * b * c,
            explanation: `两步乘法按顺序算。先算 ${a} × ${b} = ${a * b}，再算 ${a * b} × ${c} = ${a * b * c}。`,
            steps: [`第一步：${a} × ${b} = ${a * b}。`, `第二步：${a * b} × ${c} = ${a * b * c}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 2) {
          const divisor = rand(2, tableMax);
          const quotient = rand(2, grade <= 1 ? 6 : tableMax);
          const multiplier = rand(2, grade <= 1 ? 4 : tableMax);
          const dividend = divisor * quotient;
          return baseQuestion(point, {
            text: `${dividend} ÷ ${divisor} × ${multiplier} = ?`,
            answer: quotient * multiplier,
            explanation: `乘除同级，从左到右算。先算 ${dividend} ÷ ${divisor} = ${quotient}，再算 ${quotient} × ${multiplier} = ${quotient * multiplier}。`,
            steps: [`第一步：${dividend} ÷ ${divisor} = ${quotient}。`, `第二步：${quotient} × ${multiplier} = ${quotient * multiplier}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 3) {
          const a = rand(2, tableMax);
          const b = rand(2, grade <= 1 ? 4 : tableMax);
          const product = a * b;
          const divisor = pick(Array.from({ length: tableMax - 1 }, (_, index) => index + 2).filter((n) => product % n === 0));
          return baseQuestion(point, {
            text: `${a} × ${b} ÷ ${divisor} = ?`,
            answer: product / divisor,
            explanation: `先乘再除。先算 ${a} × ${b} = ${product}，再算 ${product} ÷ ${divisor} = ${product / divisor}。`,
            steps: [`第一步：${a} × ${b} = ${product}。`, `第二步：${product} ÷ ${divisor} = ${product / divisor}。`],
            templateType: "两步乘除法"
          });
        }
        if (variant === 4) {
          const firstDivisor = rand(2, tableMax);
          const secondDivisor = rand(2, grade <= 1 ? 4 : tableMax);
          const answer = rand(2, grade <= 1 ? 5 : tableMax);
          const total = answer * firstDivisor * secondDivisor;
          return baseQuestion(point, {
            text: `${total} ÷ ${firstDivisor} ÷ ${secondDivisor} = ?`,
            answer,
            explanation: `连续除法从左到右算。先平均分一次，再把结果继续平均分。`,
            steps: [`第一步：${total} ÷ ${firstDivisor} = ${total / firstDivisor}。`, `第二步：${total / firstDivisor} ÷ ${secondDivisor} = ${answer}。`],
            templateType: "两步乘除法"
          });
        }
        const groups = rand(2, grade <= 1 ? 4 : 8);
        const each = rand(2, grade <= 1 ? 5 : 9);
        const total = groups * each;
        const share = pick(Array.from({ length: tableMax - 1 }, (_, index) => index + 2).filter((n) => total % n === 0));
        return baseQuestion(point, {
          text: `${groups} 组小棒，每组 ${each} 根，一共再平均分给 ${share} 人，每人几根？（${groups} × ${each} ÷ ${share}）`,
          answer: total / share,
          word: true,
          explanation: `先求一共有多少根，再平均分。${groups} × ${each} = ${total}，${total} ÷ ${share} = ${total / share}。`,
          steps: [`第一步：${groups} × ${each} = ${total} 根。`, `第二步：${total} ÷ ${share} = ${total / share} 根。`],
          templateType: "两步乘除法"
        });
      };
      const decimalFractionPercent = () => {
        const variant = rand(1, 3);
        if (variant === 1) {
          const a = round1(rand(24, 120 + level * 10) / 10);
          const b = round1(rand(8, 72) / 10);
          const c = round1(rand(5, 45) / 10);
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: round1(a + b - c),
            explanation: `小数两步加减仍然要小数点对齐，再从左到右计算。`,
            steps: [`第一步：${a} + ${b} = ${formatAnswer(round1(a + b))}。`, `第二步：${formatAnswer(round1(a + b))} - ${c} = ${formatAnswer(round1(a + b - c))}。`],
            templateType: "两步计算"
          });
        }
        if (variant === 2) {
          const d = pick([6, 8, 10, 12]);
          const a = rand(1, Math.floor(d / 2));
          const b = rand(1, d - a - 1);
          const c = rand(1, Math.max(1, a + b - 1));
          return baseQuestion(point, {
            text: `${a}/${d} + ${b}/${d} - ${c}/${d} = ?（可填小数）`,
            answer: round1((a + b - c) / d),
            answerLabel: `${a + b - c}/${d}`,
            explanation: `同分母分数两步加减，分母不变，分子按顺序加减。`,
            steps: [`第一步：${a}/${d} + ${b}/${d} = ${a + b}/${d}。`, `第二步：${a + b}/${d} - ${c}/${d} = ${a + b - c}/${d}。`],
            templateType: "两步计算"
          });
        }
        const total = rand(120, 600);
        const rate = pick([10, 15, 20, 25, 30, 40]);
        const extra = rand(8, 60);
        return baseQuestion(point, {
          text: `${total} 的 ${rate}% 再加 ${extra} 是多少？`,
          answer: round1(total * rate / 100 + extra),
          explanation: `先求 ${total} 的 ${rate}%，再加 ${extra}。`,
          steps: [`第一步：${total} × ${rate}% = ${formatAnswer(round1(total * rate / 100))}。`, `第二步：${formatAnswer(round1(total * rate / 100))} + ${extra} = ${formatAnswer(round1(total * rate / 100 + extra))}。`],
          templateType: "两步计算"
        });
      };
      if (point.id === "g2-two-step-muldiv") return twoStepMulDiv();
      if (grade === 1) return integerAddSub(20);
      if (grade === 2) return Math.random() > 0.45 ? integerAddSub(100) : mulDivAddSub();
      if (grade <= 4) return Math.random() > 0.35 ? mulDivAddSub() : integerAddSub(grade === 3 ? 1000 : 10000);
      return Math.random() > 0.45 ? decimalFractionPercent() : mulDivAddSub();
    }
    function makeVertical(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const verticalQuestion = (data) => baseQuestion(point, {
        ...data,
        vertical: data.vertical || verticalSpecFromText(data.text),
        templateType: data.templateType || "竖式计算"
      });
      const makeAdd = (max) => {
        const a = rand(Math.max(2, Math.floor(max * 0.18)), Math.max(3, Math.floor(max * 0.72)));
        const b = rand(2, Math.max(3, max - a));
        const answer = a + b;
        return verticalQuestion({
          text: `用竖式计算：${a} + ${b} = ?`,
          answer,
          explanation: `竖式加法要把个位、十位等相同数位对齐，从个位算起；个位满十时向十位进 1，结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 的个位对齐。`, `第二步：从个位加起，满十就向前一位进 1。`, `第三步：得到 ${a} + ${b} = ${answer}。`]
        });
      };
      const makeSub = (max) => {
        const a = rand(Math.max(8, Math.floor(max * 0.45)), max);
        const b = rand(2, Math.max(3, Math.floor(a * 0.68)));
        const answer = a - b;
        return verticalQuestion({
          text: `用竖式计算：${a} - ${b} = ?`,
          answer,
          explanation: `竖式减法要把相同数位对齐，从个位减起；个位不够减时向十位退 1，结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 的个位对齐。`, `第二步：从个位减起，不够减就向前一位退 1。`, `第三步：得到 ${a} - ${b} = ${answer}。`]
        });
      };
      const makeMissingAddend = (max) => {
        const total = rand(Math.max(8, Math.floor(max * 0.45)), max);
        const known = rand(2, Math.max(3, Math.floor(total * 0.62)));
        const answer = total - known;
        return verticalQuestion({
          text: `用竖式计算：${known} + □ = ${total}，□ = ?`,
          answer,
          explanation: `缺数竖式可以用减法验算。把 ${total} 和 ${known} 按数位对齐，用 ${total} - ${known} 求出缺少的数，结果是 ${answer}。`,
          steps: [`第一步：把 ${total} 写在上面，${known} 写在下面，数位对齐。`, `第二步：用竖式算 ${total} - ${known}。`, `第三步：缺少的数是 ${answer}。`]
        });
      };
      const makeMul = () => {
        const a = rand(grade <= 3 ? 22 : 108, grade <= 3 ? 98 : 860 + level * 40);
        const b = rand(grade <= 3 ? 2 : 12, grade <= 3 ? 9 : 46);
        const answer = a * b;
        return verticalQuestion({
          text: `用竖式计算：${a} × ${b} = ?`,
          answer,
          explanation: `竖式乘法要把乘数按数位对齐，先算个位上的乘积，再处理十位上的乘积，最后把部分积相加。结果是 ${answer}。`,
          steps: [`第一步：把 ${a} 和 ${b} 按数位写成竖式。`, `第二步：从个位开始逐位相乘，注意进位。`, `第三步：部分积相加，${a} × ${b} = ${answer}。`]
        });
      };
      const makeDiv = () => {
        const divisor = rand(grade <= 3 ? 2 : 6, grade <= 3 ? 9 : 24);
        const quotient = rand(grade <= 3 ? 12 : 18, grade <= 3 ? 96 : 220 + level * 18);
        const dividend = divisor * quotient;
        return verticalQuestion({
          text: `用竖式计算：${dividend} ÷ ${divisor} = ?`,
          answer: quotient,
          explanation: `竖式除法要从高位开始试商，商要写在对应数位上，每一步乘回去再相减。结果是 ${quotient}。`,
          steps: [`第一步：从 ${dividend} 的高位开始看够不够除以 ${divisor}。`, `第二步：试商后乘回去，再相减。`, `第三步：继续下一位，得到 ${dividend} ÷ ${divisor} = ${quotient}。`]
        });
      };
      const makeDecimal = () => {
        const a = round1(rand(120, 980 + level * 20) / 10);
        const b = round1(rand(18, 260) / 10);
        if (Math.random() > 0.45) {
          const answer = round1(a + b);
          return verticalQuestion({
            text: `用竖式计算：${formatAnswer(a)} + ${formatAnswer(b)} = ?`,
            answer,
            explanation: `小数竖式加法要先把小数点对齐，再把相同数位对齐，按整数加法计算。结果是 ${formatAnswer(answer)}。`,
            steps: [`第一步：把 ${formatAnswer(a)} 和 ${formatAnswer(b)} 的小数点对齐。`, `第二步：从最低位加起，注意进位。`, `第三步：小数点落在同一列，答案是 ${formatAnswer(answer)}。`]
          });
        }
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        const answer = round1(big - small);
        return verticalQuestion({
          text: `用竖式计算：${formatAnswer(big)} - ${formatAnswer(small)} = ?`,
          answer,
          explanation: `小数竖式减法要把小数点对齐，位数不够时可以补 0，再按整数减法计算。结果是 ${formatAnswer(answer)}。`,
          steps: [`第一步：把小数点对齐，位数不够可以补 0。`, `第二步：从最低位减起，不够减就退位。`, `第三步：答案是 ${formatAnswer(answer)}。`]
        });
      };
      if (grade === 1) return pick([() => makeAdd(20), () => makeSub(20), () => makeMissingAddend(20)])();
      if (grade === 2) return pick([() => makeAdd(100), () => makeSub(100), () => makeMissingAddend(100)])();
      if (grade === 3) return pick([() => makeAdd(1000), () => makeSub(1000), makeMul, makeDiv])();
      if (grade === 4) return Math.random() > 0.42 ? pick([makeMul, makeDiv])() : pick([() => makeAdd(10000), () => makeSub(10000)])();
      if (grade === 5) return Math.random() > 0.35 ? makeDecimal() : pick([makeMul, makeDiv])();
      return pick([makeDecimal, makeMul, makeDiv, () => makeAdd(100000), () => makeSub(100000)])();
    }
    function makeLarge(point, level) {
      const variants = [
        () => {
          const a = rand(1200, 9000 + level * 18000);
          const b = rand(300, 5000 + level * 9000);
          const c = Math.floor(b / 2);
          return baseQuestion(point, {
            text: `${a} + ${b} - ${c} = ?`,
            answer: a + b - c,
            explanation: `大数计算不要急，按从左到右的顺序分两步。先算 ${a} + ${b}，再减去 ${c}。`,
            steps: [`先算 ${a} + ${b} = ${a + b}。`, `再算 ${a + b} - ${c} = ${a + b - c}。`]
          });
        },
        () => {
          const a = rand(12000, 98000);
          const b = rand(2000, 18000);
          const c = rand(1000, 9000);
          const answer = a - b + c;
          return baseQuestion(point, {
            text: `${a} - ${b} + ${c} = ?`,
            answer,
            explanation: `同级运算从左往右算。先算 ${a} - ${b} = ${a - b}，再加 ${c}，得到 ${answer}。`,
            steps: [`先算减法：${a} - ${b} = ${a - b}。`, `再算加法：${a - b} + ${c} = ${answer}。`]
          });
        },
        () => {
          const unit = pick([10, 100, 1000, 10000]);
          const count = rand(12, 98 + level * 20);
          const add = rand(3, 45) * (unit / 10);
          const answer = count * unit + add;
          return baseQuestion(point, {
            text: `${count} 个 ${unit} 加上 ${add} 是多少？`,
            answer,
            explanation: `先把 ${count} 个 ${unit} 看成 ${count} × ${unit} = ${count * unit}，再加 ${add}。`,
            steps: [`${count} × ${unit} = ${count * unit}。`, `${count * unit} + ${add} = ${answer}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeGeometry(point, level) {
      if (point.id === "g1-shape") {
        if (Math.random() > 0.5) {
          const circles = rand(3, 8);
          const squares = rand(2, 7);
          return baseQuestion(point, {
            text: `图形卡片里有 ${circles} 个圆形和 ${squares} 个正方形，一共有多少个图形？`,
            answer: circles + squares,
            word: true,
            explanation: `数图形时按种类分别数，再合起来。${circles} 个圆形加 ${squares} 个正方形，一共 ${circles + squares} 个。`,
            steps: [`圆形 ${circles} 个。`, `正方形 ${squares} 个。`, `${circles} + ${squares} = ${circles + squares} 个。`]
          });
        }
        const left = rand(2, 6);
        const right = rand(1, 5);
        return baseQuestion(point, {
          text: `小猫排在队伍中，左边有 ${left} 人，右边有 ${right} 人。队伍一共有多少人？`,
          answer: left + right + 1,
          word: true,
          explanation: `位置题要把自己也算进去。左边 ${left} 人，右边 ${right} 人，再加小猫自己 1 人。`,
          steps: [`左边 ${left} 人。`, `右边 ${right} 人。`, `总人数：${left} + 1 + ${right} = ${left + right + 1}。`]
        });
      }
      if (point.id === "g5-volume") {
        const length = rand(4, 12 + level);
        const width = rand(3, 9 + level);
        const height = rand(2, 8 + level);
        if (Math.random() > 0.45) {
          const answer = length * width * height;
          return baseQuestion(point, {
            text: `长方体长 ${length} cm，宽 ${width} cm，高 ${height} cm，体积是多少立方厘米？`,
            answer,
            word: true,
            explanation: `长方体体积 = 长 × 宽 × 高。把三个方向的长度相乘：${length} × ${width} × ${height} = ${answer}。`,
            steps: [`写公式：体积 = 长 × 宽 × 高。`, `代入：${length} × ${width} × ${height}。`, `结果是 ${answer} 立方厘米。`]
          });
        }
        const answer = 2 * (length * width + length * height + width * height);
        return baseQuestion(point, {
          text: `长方体长 ${length} cm，宽 ${width} cm，高 ${height} cm，表面积是多少平方厘米？`,
          answer,
          word: true,
          explanation: `长方体表面积有 3 组相同的面。先算长×宽、长×高、宽×高，再把和乘 2。`,
          steps: [`三个不同面的面积：${length * width}、${length * height}、${width * height}。`, `和是 ${length * width + length * height + width * height}。`, `表面积：${length * width + length * height + width * height} × 2 = ${answer}。`]
        });
      }
      if (point.id === "g6-circle") {
        const r = rand(3, 12);
        if (Math.random() > 0.5) {
          const answer = round1(2 * 3.14 * r);
          return baseQuestion(point, {
            text: `圆的半径是 ${r} cm，周长约是多少 cm？（π取3.14）`,
            answer,
            word: true,
            explanation: `圆周长公式是 C = 2πr。代入半径 ${r}，2 × 3.14 × ${r} = ${formatAnswer(answer)}。`,
            steps: [`写公式：C = 2πr。`, `代入：2 × 3.14 × ${r}。`, `周长约 ${formatAnswer(answer)} cm。`]
          });
        }
        const answer = round1(3.14 * r * r);
        return baseQuestion(point, {
          text: `圆的半径是 ${r} cm，面积约是多少平方厘米？（π取3.14）`,
          answer,
          word: true,
          explanation: `圆面积公式是 S = πr²。半径 ${r}，所以面积是 3.14 × ${r} × ${r}。`,
          steps: [`写公式：S = πr²。`, `代入：3.14 × ${r} × ${r}。`, `面积约 ${formatAnswer(answer)} 平方厘米。`]
        });
      }
      const length = rand(5, 18 + level * 4);
      const width = rand(3, Math.max(4, length - 1));
      if (point.id.includes("perimeter")) {
        const variant = rand(1, 3);
        if (variant === 1) {
          const answer = (length + width) * 2;
          return baseQuestion(point, {
            text: `长方形长 ${length} cm，宽 ${width} cm，周长是多少 cm？`,
            answer,
            word: true,
            explanation: `周长是绕图形一圈的长度。长方形周长 =（长 + 宽）× 2，所以是（${length} + ${width}）× 2 = ${answer} cm。`,
            steps: [`先把长和宽加起来：${length} + ${width} = ${length + width}。`, `长方形有两组长和宽，所以乘 2。`, `${length + width} × 2 = ${answer} cm。`]
          });
        }
        if (variant === 2) {
          const half = length + width;
          return baseQuestion(point, {
            text: `长方形的一组长和宽合起来是 ${half} cm，周长是多少 cm？`,
            answer: half * 2,
            word: true,
            explanation: `长方形周长由两组"长 + 宽"组成。一组长宽和是 ${half} cm，所以周长是 ${half} × 2 = ${half * 2} cm。`,
            steps: [`一组长宽和是 ${half} cm。`, `长方形有两组长宽和。`, `${half} × 2 = ${half * 2} cm。`],
            templateType: "周长关系"
          });
        }
        const side = rand(4, 18);
        return baseQuestion(point, {
          text: `正方形边长 ${side} cm，周长是多少 cm？`,
          answer: side * 4,
          word: true,
          explanation: `正方形四条边一样长，周长 = 边长 × 4。${side} × 4 = ${side * 4} cm。`,
          steps: [`正方形有 4 条相同的边。`, `每条边 ${side} cm。`, `${side} × 4 = ${side * 4} cm。`]
        });
      }
      if (Math.random() > 0.45) {
        const answer = length * width;
        return baseQuestion(point, {
          text: `长方形长 ${length} m，宽 ${width} m，面积是多少平方米？`,
          answer,
          word: true,
          explanation: `面积表示铺满里面有多大。长方形面积 = 长 × 宽，所以 ${length} × ${width} = ${answer} 平方米。`,
          steps: [`找到长 ${length} m、宽 ${width} m。`, `面积用长乘宽。`, `${length} × ${width} = ${answer} 平方米。`]
        });
      }
      const side = rand(5, 24);
      return baseQuestion(point, {
        text: `正方形边长 ${side} m，面积是多少平方米？`,
        answer: side * side,
        word: true,
        explanation: `正方形面积 = 边长 × 边长。${side} × ${side} = ${side * side} 平方米。`,
        steps: [`写公式：正方形面积 = 边长 × 边长。`, `代入：${side} × ${side}。`, `结果是 ${side * side} 平方米。`]
      });
    }
    function makeDecimal(point, level) {
      const a = round1(rand(12, 98 + level * 20) / 10);
      const b = round1(rand(8, 60 + level * 12) / 10);
      if (point.id === "g5-decimal" && Math.random() > 0.58) {
        if (Math.random() > 0.5) {
          const multiplier = rand(2, 9);
          const answer = round1(a * multiplier);
          return baseQuestion(point, {
            text: `${a} × ${multiplier} = ?`,
            answer,
            explanation: `小数乘整数，可以先按整数乘法算，再看小数有几位。${a} 有 1 位小数，算完把小数点放回去，得到 ${formatAnswer(answer)}。`,
            steps: [`先把 ${a} 看成 ${Math.round(a * 10)} 来乘。`, `${Math.round(a * 10)} × ${multiplier} = ${Math.round(a * 10) * multiplier}。`, `原来有 1 位小数，所以答案是 ${formatAnswer(answer)}。`]
          });
        }
        const divisor = rand(2, 9);
        const quotient = round1(rand(12, 90 + level * 12) / 10);
        const dividend = round1(quotient * divisor);
        return baseQuestion(point, {
          text: `${dividend} ÷ ${divisor} = ?`,
          answer: quotient,
          explanation: `小数除以整数，先像整数除法一样分，最后把小数点对齐放回商里。因为 ${quotient} × ${divisor} = ${dividend}，所以答案是 ${formatAnswer(quotient)}。`,
          steps: [`想反向乘法：几乘 ${divisor} 等于 ${dividend}。`, `${quotient} × ${divisor} = ${dividend}。`, `所以 ${dividend} ÷ ${divisor} = ${formatAnswer(quotient)}。`]
        });
      }
      const op = Math.random() > 0.5 ? "+" : "-";
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      const answer = op === "+" ? round1(a + b) : round1(big - small);
      return baseQuestion(point, {
        text: op === "+" ? `${a} + ${b} = ?` : `${big} - ${small} = ?`,
        answer,
        explanation: `小数加减要把小数点对齐，再按整数方法算。算完小数点仍然对齐，所以答案是 ${formatAnswer(answer)}。`,
        steps: [`小数点对齐。`, `按整数加减法计算。`, `把小数点放回同样的位置，得到 ${formatAnswer(answer)}。`]
      });
    }
    function makeFraction(point, level) {
      if (point.id === "g6-fraction-percent" && Math.random() > 0.5) {
        const denominator = pick([4, 5, 8, 10, 20]);
        const numerator = rand(1, denominator - 1);
        const answer = round1(numerator / denominator * 100);
        return baseQuestion(point, {
          text: `${numerator}/${denominator} 等于百分之多少？`,
          answer,
          answerLabel: `${formatAnswer(answer)}%`,
          explanation: `把分数化成百分数，可以先算 ${numerator} ÷ ${denominator}，再乘 100。结果约是 ${formatAnswer(answer)}%。`,
          steps: [`先算 ${numerator} ÷ ${denominator}。`, `再把小数乘 100 变成百分数。`, `得到 ${formatAnswer(answer)}%。`]
        });
      }
      if (Math.random() > 0.45) {
        const denominator = pick([4, 5, 6, 8, 10, 12]);
        let a = rand(1, Math.floor(denominator / 2));
        let b = rand(1, denominator - a - 1);
        const answer = round1((a + b) / denominator);
        return baseQuestion(point, {
          text: `${a}/${denominator} + ${b}/${denominator} = ?（可填小数）`,
          answer,
          answerLabel: `${a + b}/${denominator}`,
          explanation: `同分母分数相加，分母不变，只把分子相加。${a} + ${b} = ${a + b}，所以答案是 ${a + b}/${denominator}。`,
          steps: [`看分母：两个分母都是 ${denominator}。`, `分母不变。`, `分子相加：${a} + ${b} = ${a + b}。`]
        });
      }
      const total = rand(24, 120 + level * 20);
      const denominator = pick([3, 4, 5, 6, 8]);
      const numerator = rand(1, denominator - 1);
      const base = Math.ceil(total / denominator) * denominator;
      const answer = base / denominator * numerator;
      return baseQuestion(point, {
        text: `${base} 的 ${numerator}/${denominator} 是多少？`,
        answer,
        explanation: `求一个数的几分之几，可以先平均分。先算 ${base} ÷ ${denominator} = ${base / denominator}，再乘 ${numerator}，得到 ${answer}。`,
        steps: [`先把 ${base} 平均分成 ${denominator} 份。`, `每份是 ${base / denominator}。`, `取 ${numerator} 份：${base / denominator} × ${numerator} = ${answer}。`]
      });
    }
    function makeUnit(point, level) {
      if (point.id === "g2-time-money") {
        if (Math.random() > 0.5) {
          const yuan = rand(2, 18);
          const jiao = rand(1, 9);
          return baseQuestion(point, {
            text: `${yuan} 元 ${jiao} 角 = ? 角`,
            answer: yuan * 10 + jiao,
            explanation: `1 元 = 10 角。先把 ${yuan} 元换成 ${yuan * 10} 角，再加 ${jiao} 角。`,
            steps: [`${yuan} 元 = ${yuan * 10} 角。`, `${yuan * 10} + ${jiao} = ${yuan * 10 + jiao} 角。`]
          });
        }
        const start = rand(7, 10);
        const minutes = pick([15, 20, 25, 30, 35, 45]);
        return baseQuestion(point, {
          text: `${start}:00 过 ${minutes} 分是几点几分？（填写分钟数）`,
          answer: minutes,
          answerLabel: `${start}:${String(minutes).padStart(2, "0")}`,
          explanation: `整点过几分，小时不变，分钟就是过了的 ${minutes} 分。完整时间是 ${start}:${String(minutes).padStart(2, "0")}。`,
          steps: [`从 ${start}:00 开始。`, `过 ${minutes} 分。`, `时间是 ${start}:${String(minutes).padStart(2, "0")}。`]
        });
      }
      const type = pick(point.grade >= 5 ? ["mcm", "kg", "time", "km", "area"] : ["mcm", "kg", "time"]);
      if (type === "km") {
        const km = rand(1, 8 + level);
        const m = rand(100, 900);
        return baseQuestion(point, {
          text: `${km} 千米 ${m} 米 = ? 米`,
          answer: km * 1000 + m,
          explanation: `1 千米 = 1000 米。先把 ${km} 千米换成 ${km * 1000} 米，再加 ${m} 米。`,
          steps: [`${km} 千米 = ${km * 1000} 米。`, `${km * 1000} + ${m} = ${km * 1000 + m} 米。`]
        });
      }
      if (type === "area") {
        const ha = rand(1, 9);
        return baseQuestion(point, {
          text: `${ha} 公顷 = ? 平方米`,
          answer: ha * 10000,
          explanation: `1 公顷 = 10000 平方米。${ha} 公顷就是 ${ha} × 10000 平方米。`,
          steps: [`记住 1 公顷 = 10000 平方米。`, `${ha} × 10000 = ${ha * 10000}。`]
        });
      }
      if (type === "mcm") {
        const m = rand(2, 9 + level);
        const cm = rand(5, 90);
        return baseQuestion(point, {
          text: `${m} 米 ${cm} 厘米 = ? 厘米`,
          answer: m * 100 + cm,
          explanation: `1 米 = 100 厘米。先把 ${m} 米换成 ${m * 100} 厘米，再加 ${cm} 厘米，得到 ${m * 100 + cm} 厘米。`,
          steps: [`记住 1 米 = 100 厘米。`, `${m} 米 = ${m * 100} 厘米。`, `${m * 100} + ${cm} = ${m * 100 + cm} 厘米。`]
        });
      }
      if (type === "kg") {
        const kg = rand(1, 6 + level);
        const g = rand(100, 900);
        return baseQuestion(point, {
          text: `${kg} 千克 ${g} 克 = ? 克`,
          answer: kg * 1000 + g,
          explanation: `1 千克 = 1000 克。先把 ${kg} 千克换成 ${kg * 1000} 克，再加 ${g} 克。`,
          steps: [`记住 1 千克 = 1000 克。`, `${kg} 千克 = ${kg * 1000} 克。`, `${kg * 1000} + ${g} = ${kg * 1000 + g} 克。`]
        });
      }
      const h = rand(1, 4 + level);
      const min = rand(5, 50);
      return baseQuestion(point, {
        text: `${h} 小时 ${min} 分 = ? 分`,
        answer: h * 60 + min,
        explanation: `1 小时 = 60 分。先把 ${h} 小时换成 ${h * 60} 分，再加 ${min} 分。`,
        steps: [`记住 1 小时 = 60 分。`, `${h} 小时 = ${h * 60} 分。`, `${h * 60} + ${min} = ${h * 60 + min} 分。`]
      });
    }
    function makePercent(point, level) {
      const variants = [
        () => {
          const price = rand(20, 120 + level * 40);
          const discount = pick([0.5, 0.6, 0.75, 0.8, 0.85, 0.9]);
          const answer = round1(price * discount);
          return baseQuestion(point, {
            text: `一本练习册 ${price} 元，打 ${discount * 10} 折后需要多少元？`,
            answer,
            word: true,
            explanation: `${discount * 10} 折就是原价的 ${discount}。用 ${price} × ${discount}，得到 ${formatAnswer(answer)} 元。`,
            steps: [`把折扣改成小数：${discount * 10} 折 = ${discount}。`, `用原价乘折扣：${price} × ${discount}。`, `结果是 ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const total = rand(80, 360);
          const percent = pick([15, 20, 25, 30, 40, 50, 60]);
          const answer = round1(total * percent / 100);
          return baseQuestion(point, {
            text: `${total} 人中有 ${percent}% 参加数学社团，参加的人数是多少？`,
            answer,
            word: true,
            explanation: `求一个数的百分之几，用这个数乘百分数。${total} × ${percent}% = ${formatAnswer(answer)}。`,
            steps: [`把 ${percent}% 看成 ${percent}/100。`, `${total} × ${percent} ÷ 100 = ${formatAnswer(answer)}。`]
          });
        },
        () => {
          const oldPrice = rand(60, 260);
          const percent = pick([10, 15, 20, 25, 30]);
          const increase = round1(oldPrice * percent / 100);
          const answer = round1(oldPrice + increase);
          return baseQuestion(point, {
            text: `一件文具原价 ${oldPrice} 元，涨价 ${percent}% 后是多少元？`,
            answer,
            word: true,
            explanation: `涨价后是原价加上涨价部分。先求 ${oldPrice} 的 ${percent}% 是 ${formatAnswer(increase)}，再加回原价。`,
            steps: [`增加：${oldPrice} × ${percent}% = ${formatAnswer(increase)}。`, `现价：${oldPrice} + ${formatAnswer(increase)} = ${formatAnswer(answer)}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeRatio(point, level) {
      if (point.id === "g6-scale") {
        if (Math.random() > 0.5) {
          const scale = pick([1000, 2000, 5000, 10000]);
          const mapCm = rand(2, 9);
          const answer = round1(mapCm * scale / 100);
          return baseQuestion(point, {
            text: `比例尺 1:${scale} 的图上，距离是 ${mapCm} cm，实际距离是多少米？`,
            answer,
            word: true,
            explanation: `比例尺 1:${scale} 表示图上 1 cm 对应实际 ${scale} cm。先算厘米，再换成米。`,
            steps: [`实际厘米：${mapCm} × ${scale} = ${mapCm * scale} cm。`, `换成米：${mapCm * scale} ÷ 100 = ${formatAnswer(answer)} 米。`]
          });
        }
        const actualM = rand(120, 900);
        const scale = pick([1000, 2000, 5000, 10000]);
        const answer = round1(actualM * 100 / scale);
        return baseQuestion(point, {
          text: `实际距离 ${actualM} 米，比例尺 1:${scale}，图上距离是多少厘米？`,
          answer,
          word: true,
          explanation: `先把实际距离换成厘米，再除以比例尺中的 ${scale}。`,
          steps: [`${actualM} 米 = ${actualM * 100} cm。`, `图上距离：${actualM * 100} ÷ ${scale} = ${formatAnswer(answer)} cm。`]
        });
      }
      const variants = [
        () => {
          const a = rand(2, 5 + level);
          const b = rand(3, 7 + level);
          const unit = rand(4, 12);
          const total = (a + b) * unit;
          const answer = a * unit;
          return baseQuestion(point, {
            text: `把 ${total} 个贴纸按 ${a}:${b} 分给甲和乙，甲分到多少个？`,
            answer,
            word: true,
            explanation: `比例 ${a}:${b} 一共有 ${a + b} 份。先算每份 ${total} ÷ ${a + b} = ${unit}，甲有 ${a} 份，所以 ${unit} × ${a} = ${answer}。`,
            steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${unit}。`, `甲有 ${a} 份：${unit} × ${a} = ${answer}。`]
          });
        },
        () => {
          const each = rand(3, 9);
          const known = rand(4, 8);
          const target = rand(10, 18);
          const answer = each * target;
          return baseQuestion(point, {
            text: `${known} 个零件需要 ${known * each} 分钟，照这样做，${target} 个零件需要多少分钟？`,
            answer,
            word: true,
            explanation: `这是正比例关系。先求每个零件需要 ${each} 分钟，再乘 ${target} 个。`,
            steps: [`每个零件：${known * each} ÷ ${known} = ${each} 分钟。`, `${target} 个：${each} × ${target} = ${answer} 分钟。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeStatistics(point, level) {
      if (point.id === "g3-statistics") {
        const a = rand(8, 24);
        const b = rand(6, 22);
        const c = rand(5, 20);
        if (Math.random() > 0.5) {
          return baseQuestion(point, {
            text: `三组同学收集卡片：一组 ${a} 张，二组 ${b} 张，三组 ${c} 张。一共收集多少张？`,
            answer: a + b + c,
            word: true,
            explanation: `读统计表时先找到每组数量，再求合计。${a} + ${b} + ${c} = ${a + b + c}。`,
            steps: [`一组 ${a} 张，二组 ${b} 张，三组 ${c} 张。`, `求总数用加法。`, `总数是 ${a + b + c} 张。`]
          });
        }
        const max = Math.max(a, b, c);
        const min = Math.min(a, b, c);
        return baseQuestion(point, {
          text: `三组卡片数分别是 ${a}、${b}、${c} 张，最多的一组比最少的一组多多少张？`,
          answer: max - min,
          word: true,
          explanation: `比较最多和最少，先找最大数 ${max}，再找最小数 ${min}，用减法求差。`,
          steps: [`最大数是 ${max}。`, `最小数是 ${min}。`, `${max} - ${min} = ${max - min}。`]
        });
      }
      const nums = [
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4),
        rand(8, 24 + level * 4)
      ];
      if (Math.random() > 0.45) {
        const sum = nums.reduce((acc, item) => acc + item, 0);
        const answer = round1(sum / nums.length);
        return baseQuestion(point, {
          text: `四天阅读页数分别是 ${nums.join("、")} 页，平均每天读多少页？`,
          answer,
          word: true,
          explanation: `平均数 = 总数 ÷ 份数。先把四天页数加起来，再除以 4。`,
          steps: [`总页数：${nums.join(" + ")} = ${sum}。`, `平均数：${sum} ÷ 4 = ${formatAnswer(answer)}。`]
        });
      }
      const avg = rand(12, 28);
      const total = avg * 5;
      const known = [rand(8, 24), rand(8, 24), rand(8, 24), rand(8, 24)];
      let last = total - known.reduce((acc, item) => acc + item, 0);
      if (last <= 0 || last > 60) {
        known[0] = avg - 2;
        known[1] = avg + 1;
        known[2] = avg + 3;
        known[3] = avg - 1;
        last = total - known.reduce((acc, item) => acc + item, 0);
      }
      return baseQuestion(point, {
        text: `5 次口算平均每次 ${avg} 分，前 4 次分别是 ${known.join("、")} 分，第 5 次要多少分？`,
        answer: last,
        word: true,
        explanation: `平均数反推总数：平均 ${avg} 分、5 次，总分是 ${total}。再减去前 4 次。`,
        steps: [`总分：${avg} × 5 = ${total}。`, `前 4 次合计：${known.reduce((acc, item) => acc + item, 0)}。`, `第 5 次：${total} - ${known.reduce((acc, item) => acc + item, 0)} = ${last}。`]
      });
    }
    function makeEquation(point, level) {
      const variants = [
        () => {
          const x = rand(6, 48 + level * 10);
          const add = rand(8, 70);
          return baseQuestion(point, {
            text: `x + ${add} = ${x + add}，x = ?`,
            answer: x,
            explanation: `等式两边同时减去 ${add}，就能留下 x。${x + add} - ${add} = ${x}。`,
            steps: [`原式：x + ${add} = ${x + add}。`, `两边减 ${add}。`, `x = ${x}。`]
          });
        },
        () => {
          const x = rand(4, 28 + level * 8);
          const factor = rand(2, 9);
          return baseQuestion(point, {
            text: `${factor}x = ${factor * x}，x = ?`,
            answer: x,
            explanation: `${factor}x 表示 ${factor} × x。等式两边同时除以 ${factor}。`,
            steps: [`${factor}x = ${factor * x}。`, `两边除以 ${factor}。`, `x = ${x}。`]
          });
        },
        () => {
          const x = rand(5, 36);
          const factor = rand(2, 8);
          const add = rand(6, 30);
          const total = factor * x + add;
          return baseQuestion(point, {
            text: `${factor}x + ${add} = ${total}，x = ?`,
            answer: x,
            explanation: `先把加上的 ${add} 去掉，再除以 ${factor}。`,
            steps: [`两边减 ${add}：${total} - ${add} = ${factor * x}。`, `再除以 ${factor}：${factor * x} ÷ ${factor} = ${x}。`]
          });
        }
      ];
      return pick(variants)();
    }
    function makeWord(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const lowAddSub = [
        () => {
          const total = point.id === "g1-simple-word" ? rand(8, 20) : rand(28, 96);
          const used = rand(2, Math.floor(total / 2));
          return baseQuestion(point, {
            text: `盒子里原来有 ${total} 颗贴纸，用掉 ${used} 颗，还剩多少颗？`,
            answer: total - used,
            word: true,
            explanation: `题目问"还剩"，说明要从原来的数量里拿走一部分，用减法。${total} - ${used} = ${total - used}。`,
            steps: [`原来有 ${total} 颗。`, `用掉 ${used} 颗，要做减法。`, `${total} - ${used} = ${total - used} 颗。`]
          });
        },
        () => {
          const a = point.id === "g1-simple-word" ? rand(3, 9) : rand(12, 45);
          const b = point.id === "g1-simple-word" ? rand(2, 20 - a) : rand(8, 45);
          return baseQuestion(point, {
            text: `书架上有 ${a} 本故事书，又放上 ${b} 本。一共有多少本？`,
            answer: a + b,
            word: true,
            explanation: `题目问"一共"，就是把两部分合起来，用加法。${a} + ${b} = ${a + b}。`,
            steps: [`先找到两部分：${a} 本和 ${b} 本。`, `求一共用加法。`, `${a} + ${b} = ${a + b} 本。`]
          });
        },
        () => {
          const a = point.id === "g1-simple-word" ? rand(4, 12) : rand(16, 50);
          const diff = point.id === "g1-simple-word" ? rand(2, 8) : rand(6, 22);
          return baseQuestion(point, {
            text: `小猫有 ${a + diff} 枚贴纸，小兔有 ${a} 枚。小猫比小兔多多少枚？`,
            answer: diff,
            word: true,
            explanation: `问"多多少"就是比较两个数的差。用小猫的 ${a + diff} 减小兔的 ${a}。`,
            steps: [`小猫 ${a + diff} 枚。`, `小兔 ${a} 枚。`, `${a + diff} - ${a} = ${diff} 枚。`]
          });
        },
        () => {
          const red = point.id === "g1-simple-word" ? rand(3, 10) : rand(12, 38);
          const blue = point.id === "g1-simple-word" ? rand(2, 9) : rand(8, 32);
          const give = rand(1, Math.max(1, Math.floor((red + blue) / 3)));
          return baseQuestion(point, {
            text: `手工盒里有 ${red} 张红纸和 ${blue} 张蓝纸，送给同学 ${give} 张后，还剩多少张纸？`,
            answer: red + blue - give,
            word: true,
            explanation: `先求红纸和蓝纸一共有多少，再减去送出的数量。`,
            steps: [`先合起来：${red} + ${blue} = ${red + blue} 张。`, `再减去送出的 ${give} 张。`, `${red + blue} - ${give} = ${red + blue - give} 张。`],
            templateType: "两步应用"
          });
        }
      ];
      const equalGroup = [
        () => {
          const each = rand(3, 9 + level);
          const boxes = rand(2, 8);
          return baseQuestion(point, {
            text: `每盒有 ${each} 支铅笔，老师准备了 ${boxes} 盒。一共有多少支铅笔？`,
            answer: each * boxes,
            word: true,
            explanation: `每盒数量一样，求一共有多少，用乘法。${each} × ${boxes} = ${each * boxes}。`,
            steps: [`每盒 ${each} 支。`, `一共有 ${boxes} 盒。`, `用乘法：${each} × ${boxes} = ${each * boxes}。`]
          });
        },
        () => {
          const each = rand(3, 9);
          const groups = rand(3, 9);
          return baseQuestion(point, {
            text: `${each * groups} 个苹果平均装进 ${groups} 个袋子，每袋装多少个？`,
            answer: each,
            word: true,
            explanation: `题目说"平均装进"，每袋一样多，用除法。${each * groups} ÷ ${groups} = ${each}。`,
            steps: [`总共有 ${each * groups} 个。`, `平均分成 ${groups} 袋。`, `${each * groups} ÷ ${groups} = ${each} 个。`]
          });
        },
        () => {
          const each = rand(2, 8);
          const groups = rand(3, 9);
          return baseQuestion(point, {
            text: `${each * groups} 个扣子，每 ${each} 个穿成一串，可以穿成几串？`,
            answer: groups,
            word: true,
            explanation: `每 ${each} 个一串，求有几串，用除法。${each * groups} ÷ ${each} = ${groups}。`,
            steps: [`总数是 ${each * groups} 个。`, `每串 ${each} 个。`, `${each * groups} ÷ ${each} = ${groups} 串。`]
          });
        },
        () => {
          const each = rand(2, 8);
          const boxes = rand(3, 8);
          const extra = rand(2, 16);
          return baseQuestion(point, {
            text: `${boxes} 盒饼干，每盒 ${each} 块，又拿来 ${extra} 块散装饼干。一共有多少块？`,
            answer: boxes * each + extra,
            word: true,
            explanation: `先求盒装饼干有多少块，再加上散装的数量。`,
            steps: [`盒装：${boxes} × ${each} = ${boxes * each} 块。`, `加上散装：${boxes * each} + ${extra} = ${boxes * each + extra} 块。`],
            templateType: "两步应用"
          });
        }
      ];
      const twoStep = [
        () => {
          const total = rand(60, 160 + level * 40);
          const used = rand(12, 40 + level * 8);
          const add = rand(10, 35 + level * 6);
          return baseQuestion(point, {
            text: `图书角原有 ${total} 本书，借走 ${used} 本，又新买 ${add} 本。现在有多少本？`,
            answer: total - used + add,
            word: true,
            explanation: `先处理"借走"，用减法；再处理"新买"，用加法。${total} - ${used} + ${add} = ${total - used + add}。`,
            steps: [`借走后：${total} - ${used} = ${total - used}。`, `又新买：${total - used} + ${add} = ${total - used + add}。`]
          });
        },
        () => {
          const rows = rand(3, 8 + level);
          const each = rand(4, 12 + level);
          const given = rand(5, 20);
          const answer = rows * each - given;
          return baseQuestion(point, {
            text: `操场上摆了 ${rows} 排椅子，每排 ${each} 把，已经坐了 ${given} 人。还空着多少把椅子？`,
            answer,
            word: true,
            explanation: `先求椅子总数，再减去已经坐的人数。${rows} × ${each} - ${given} = ${answer}。`,
            steps: [`先求总椅子数：${rows} × ${each} = ${rows * each}。`, `再减去已坐的 ${given} 人。`, `${rows * each} - ${given} = ${answer} 把。`]
          });
        },
        () => {
          const price = rand(5, 18);
          const count = rand(3, 8);
          const extra = rand(4, 20);
          return baseQuestion(point, {
            text: `每盒彩泥 ${price} 元，买 ${count} 盒后还剩 ${extra} 元。原来带了多少元？`,
            answer: price * count + extra,
            word: true,
            explanation: `先求买彩泥花了多少钱，再加上剩下的钱。${price} × ${count} + ${extra} = ${price * count + extra}。`,
            steps: [`花费：${price} × ${count} = ${price * count} 元。`, `原来钱数：${price * count} + ${extra} = ${price * count + extra} 元。`]
          });
        },
        () => {
          const days = rand(3, 6);
          const daily = rand(8, 24);
          const extra = rand(5, 30);
          return baseQuestion(point, {
            text: `小明计划 ${days} 天每天读 ${daily} 页，后来又多读了 ${extra} 页。一共读了多少页？`,
            answer: days * daily + extra,
            word: true,
            explanation: `先求按计划读了多少页，再加上多读的页数。`,
            steps: [`计划页数：${daily} × ${days} = ${daily * days} 页。`, `再加多读：${daily * days} + ${extra} = ${daily * days + extra} 页。`],
            templateType: "两步应用"
          });
        },
        () => {
          const total = rand(80, 240 + level * 30);
          const each = rand(8, 24);
          const days = rand(2, Math.max(3, Math.floor(total / each) - 1));
          const answer = total - each * days;
          return baseQuestion(point, {
            text: `练习册共有 ${total} 道题，已经做了 ${days} 天，每天做 ${each} 道。还剩多少道？`,
            answer,
            word: true,
            explanation: `先求已经做了多少道，再用总题数减去已做题数。`,
            steps: [`已做：${each} × ${days} = ${each * days} 道。`, `剩下：${total} - ${each * days} = ${answer} 道。`],
            templateType: "两步应用"
          });
        }
      ];
      const upperWord = [
        () => {
          const speed = rand(45, 90);
          const hours = rand(2, 5);
          const rest = rand(12, 45);
          const answer = speed * hours + rest;
          return baseQuestion(point, {
            text: `校车每小时行 ${speed} 千米，行了 ${hours} 小时后又行了 ${rest} 千米，一共行了多少千米？`,
            answer,
            word: true,
            explanation: `先用速度乘时间求前面行的路程，再加上后来又行的路程。${speed} × ${hours} + ${rest} = ${answer}。`,
            steps: [`先求前 ${hours} 小时行了多少：${speed} × ${hours} = ${speed * hours}。`, `再加上后来行的 ${rest} 千米。`, `${speed * hours} + ${rest} = ${answer} 千米。`]
          });
        },
        () => {
          const price = rand(18, 96);
          const count = rand(3, 9);
          const pay = price * count + rand(5, 30);
          const answer = pay - price * count;
          return baseQuestion(point, {
            text: `每盒彩笔 ${price} 元，买 ${count} 盒，付了 ${pay} 元，应找回多少元？`,
            answer,
            word: true,
            explanation: `先求一共花了多少钱，再用付款金额减去花费。${pay} - ${price} × ${count} = ${answer}。`,
            steps: [`先求花费：${price} × ${count} = ${price * count} 元。`, `再求找回：${pay} - ${price * count} = ${answer} 元。`]
          });
        },
        () => {
          const known = rand(3, 8);
          const each = rand(12, 36);
          const target = known + rand(3, 8);
          const answer = each * target;
          return baseQuestion(point, {
            text: `${known} 箱矿泉水有 ${known * each} 瓶，照这样装，${target} 箱有多少瓶？`,
            answer,
            word: true,
            explanation: `这是归一问题。先求每箱多少瓶，再求 ${target} 箱。`,
            steps: [`每箱：${known * each} ÷ ${known} = ${each} 瓶。`, `${target} 箱：${each} × ${target} = ${answer} 瓶。`]
          });
        },
        () => {
          const days = rand(3, 7);
          const done = rand(20, 60);
          const completed = days * done;
          const total = rand(completed + 20, completed + 220);
          const answer = total - done * days;
          return baseQuestion(point, {
            text: `一本练习册有 ${total} 道题，已经连续 ${days} 天每天做 ${done} 道，还剩多少道？`,
            answer,
            word: true,
            explanation: `先求已经做了多少道，再用总数减去已做数量。`,
            steps: [`已做：${done} × ${days} = ${done * days} 道。`, `剩下：${total} - ${done * days} = ${answer} 道。`]
          });
        },
        () => {
          const first = rand(35, 90);
          const second = first + rand(12, 45);
          const times = rand(2, 5);
          const answer = (first + second) * times;
          return baseQuestion(point, {
            text: `甲、乙两个小组一小时分别整理 ${first} 本和 ${second} 本图书，合作 ${times} 小时能整理多少本？`,
            answer,
            word: true,
            explanation: `合作问题先求一小时合做多少，再乘合作时间。`,
            steps: [`一小时合做：${first} + ${second} = ${first + second} 本。`, `${times} 小时：${first + second} × ${times} = ${answer} 本。`],
            templateType: "合作问题"
          });
        },
        () => {
          const unit = rand(12, 36);
          const known = rand(3, 7);
          const target = known + rand(2, 6);
          const answer = unit * (target - known);
          return baseQuestion(point, {
            text: `${known} 箱牛奶有 ${unit * known} 盒，照这样装，增加到 ${target} 箱还要再准备多少盒？`,
            answer,
            word: true,
            explanation: `先求每箱多少盒，再求多出来的箱数需要多少盒。`,
            steps: [`每箱：${unit * known} ÷ ${known} = ${unit} 盒。`, `多出的箱数：${target} - ${known} = ${target - known} 箱。`, `还要：${unit} × ${target - known} = ${answer} 盒。`],
            templateType: "归一变式"
          });
        }
      ];
      const decimalPercentWord = [
        () => {
          const price = round1(rand(120, 480) / 10);
          const count = rand(2, 6);
          const answer = round1(price * count);
          return baseQuestion(point, {
            text: `一本笔记本 ${price} 元，买 ${count} 本需要多少元？`,
            answer,
            word: true,
            explanation: `单价是小数，数量相同，求总价用乘法。${price} × ${count} = ${formatAnswer(answer)} 元。`,
            steps: [`找到单价 ${price} 元。`, `买 ${count} 本，用乘法。`, `${price} × ${count} = ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const pages = rand(120, 360);
          const percent = pick([10, 15, 20, 25, 30, 40]);
          const answer = round1(pages * percent / 100);
          return baseQuestion(point, {
            text: `一本书有 ${pages} 页，已经读了 ${percent}%。已经读了多少页？`,
            answer,
            word: true,
            explanation: `${percent}% 表示把整体分成 100 份取 ${percent} 份。${pages} × ${percent}% = ${formatAnswer(answer)} 页。`,
            steps: [`把 ${percent}% 看成 ${percent}/100。`, `用总页数乘百分数：${pages} × ${percent}%。`, `得到 ${formatAnswer(answer)} 页。`]
          });
        },
        () => {
          const price = rand(80, 300);
          const discount = pick([0.7, 0.75, 0.8, 0.85, 0.9]);
          const answer = round1(price * (1 - discount));
          return baseQuestion(point, {
            text: `书包原价 ${price} 元，现在打 ${discount * 10} 折，便宜了多少元？`,
            answer,
            word: true,
            explanation: `便宜的钱 = 原价 - 折后价。也可以用原价乘少掉的比例 ${formatAnswer(1 - discount)}。`,
            steps: [`折后价：${price} × ${discount} = ${formatAnswer(round1(price * discount))} 元。`, `便宜：${price} - ${formatAnswer(round1(price * discount))} = ${formatAnswer(answer)} 元。`]
          });
        },
        () => {
          const total = rand(180, 600);
          const firstRate = pick([20, 25, 30, 40]);
          const extra = rand(20, 90);
          const answer = round1(total * firstRate / 100 + extra);
          return baseQuestion(point, {
            text: `一本书有 ${total} 页，先读了 ${firstRate}%，又读了 ${extra} 页，一共读了多少页？`,
            answer,
            word: true,
            explanation: `先把百分数转成页数，再加上后来读的页数。`,
            steps: [`先读：${total} × ${firstRate}% = ${formatAnswer(round1(total * firstRate / 100))} 页。`, `一共：${formatAnswer(round1(total * firstRate / 100))} + ${extra} = ${formatAnswer(answer)} 页。`],
            templateType: "百分数应用"
          });
        },
        () => {
          const a = rand(3, 7);
          const b = a + rand(2, 5);
          const each = rand(12, 30);
          const total = (a + b) * each;
          const answer = each * b;
          return baseQuestion(point, {
            text: `把 ${total} 张卡片按 ${a}:${b} 分给两个小组，第二组分到多少张？`,
            answer,
            word: true,
            explanation: `比例分配先求总份数和每份数量，再乘第二组的份数。`,
            steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${each} 张。`, `第二组：${each} × ${b} = ${answer} 张。`],
            templateType: "比例分配"
          });
        }
      ];
      if (point.id === "g1-simple-word") return pick(lowAddSub)();
      if (point.id === "g2-simple-word") return pick([...lowAddSub, ...equalGroup])();
      if (point.id === "g3-word-two-step") return pick(twoStep)();
      if (point.id === "g4-word") return pick([...twoStep, ...upperWord])();
      if (point.id === "g5-word" || point.id === "g6-complex-word") return pick([...upperWord, ...decimalPercentWord])();
      if (grade <= 1) return pick(lowAddSub)();
      if (grade <= 2) return pick([...lowAddSub, ...equalGroup])();
      if (grade <= 3) return pick([...equalGroup, ...twoStep])();
      if (grade <= 4) return pick([...twoStep, ...upperWord])();
      return pick([...upperWord, ...decimalPercentWord])();
    }

    function makeAppendix(point, level) {
      const grade = clamp(Number(point.grade) || state.grade, 1, 6);
      const makers = {
        1: [
          () => {
            const start = rand(2, 8);
            const step = rand(2, 4);
            const a = start;
            const b = start + step;
            const c = start + step * 2;
            const answer = start + step * 3;
            return baseQuestion(point, {
              text: `找规律：${a}，${b}，${c}，下一个数是多少？`,
              answer,
              word: true,
              explanation: `这列数每次都增加 ${step}。从 ${c} 再加 ${step}，得到 ${answer}。`,
              steps: [`先看 ${a} 到 ${b} 增加了 ${step}。`, `再看 ${b} 到 ${c} 也增加了 ${step}。`, `所以下一个是 ${c} + ${step} = ${answer}。`]
            });
          },
          () => {
            const before = rand(2, 7);
            const after = rand(2, 7);
            const answer = before + after + 1;
            return baseQuestion(point, {
              text: `小猫排队，前面有 ${before} 只，后面有 ${after} 只。这一队一共有多少只小猫？`,
              answer,
              word: true,
              explanation: `排队题别忘了把"小猫自己"也算进去。前面 ${before} 只，后面 ${after} 只，再加自己 1 只。`,
              steps: [`前面有 ${before} 只。`, `后面有 ${after} 只。`, `总数 = ${before} + 1 + ${after} = ${answer}。`]
            });
          },
          () => {
            const a = rand(3, 9);
            const b = a + rand(2, 5);
            const c = b + rand(2, 5);
            const answer = b;
            return baseQuestion(point, {
              text: `把 ${a}、${b}、${c} 从小到大排，中间的数是多少？`,
              answer,
              word: true,
              explanation: `先按从小到大排好，排在中间的就是第二个数。${a}、${b}、${c} 中间是 ${answer}。`,
              steps: [`从小到大：${a} < ${b} < ${c}。`, `中间位置是第二个。`, `中间的数是 ${answer}。`]
            });
          }
        ],
        2: [
          () => {
            const cycle = ["红", "黄", "蓝"];
            const n = rand(10, 30 + level * 4);
            const answer = (n - 1) % cycle.length + 1;
            return baseQuestion(point, {
              text: `彩灯按"红、黄、蓝"循环排列，第 ${n} 盏灯是第几种颜色？（红填1，黄填2，蓝填3）`,
              answer,
              word: true,
              explanation: `这是周期问题。3 盏一组，看第 ${n} 盏在这一组里的第几个位置。余数 ${n % 3 || 3} 对应第 ${answer} 种颜色。`,
              steps: [`一组有 3 盏。`, `${n} ÷ 3 看余数。`, `位置是第 ${answer} 种。`]
            });
          },
          () => {
            const each = rand(3, 8);
            const known = rand(2, 5);
            const target = known + rand(2, 4);
            const answer = each * target;
            return baseQuestion(point, {
              text: `${known} 个盒子装了 ${each * known} 块橡皮，照这样装，${target} 个盒子装多少块？`,
              answer,
              word: true,
              explanation: `先求每个盒子装多少，再求 ${target} 个盒子。这里每盒 ${each} 块，所以 ${target} 盒是 ${answer} 块。`,
              steps: [`每盒：${each * known} ÷ ${known} = ${each} 块。`, `${target} 盒：${each} × ${target} = ${answer} 块。`]
            });
          },
          () => {
            const group = rand(2, 6);
            const fullGroups = rand(4, 9);
            const missing = rand(1, group - 1);
            const total = fullGroups * group + (group - missing);
            return baseQuestion(point, {
              text: `${total} 个珠子按每组 ${group} 个圈起来，最后一组还差 ${missing} 个才能满一组。已经圈满了多少组？`,
              answer: fullGroups,
              word: true,
              explanation: `最后一组还差 ${missing} 个，说明最后一组已经有 ${group - missing} 个。先拿掉这不满的一组，再看前面有多少整组。`,
              steps: [`不满的一组有 ${group} - ${missing} = ${group - missing} 个。`, `整组部分有 ${total} - ${group - missing} = ${fullGroups * group} 个。`, `${fullGroups * group} ÷ ${group} = ${fullGroups} 组。`]
            });
          }
        ],
        3: [
          () => {
            const diff = rand(4, 14) * 2;
            const small = rand(12, 36);
            const big = small + diff;
            return baseQuestion(point, {
              text: `甲有 ${big} 张卡片，乙有 ${small} 张。甲给乙多少张后，两人一样多？`,
              answer: diff / 2,
              word: true,
              explanation: `两人差 ${diff} 张。要变得一样多，只要把差的一半从多的人给少的人。`,
              steps: [`先求差：${big} - ${small} = ${diff}。`, `差的一半是 ${diff} ÷ 2 = ${diff / 2}。`, `甲给乙 ${diff / 2} 张后一样多。`]
            });
          },
          () => {
            const gap = rand(3, 7);
            const trees = rand(6, 18);
            const answer = (trees - 1) * gap;
            return baseQuestion(point, {
              text: `一条路的一边种了 ${trees} 棵树，每两棵相距 ${gap} 米，从第一棵到最后一棵相距多少米？`,
              answer,
              word: true,
              explanation: `植树问题要先数"间隔"。${trees} 棵树之间有 ${trees - 1} 个间隔，每个间隔 ${gap} 米。`,
              steps: [`间隔数 = ${trees} - 1 = ${trees - 1}。`, `总距离 = ${trees - 1} × ${gap} = ${answer} 米。`]
            });
          },
          () => {
            const divisor = rand(4, 9);
            const quotient = rand(5, 12);
            const remainder = rand(1, divisor - 1);
            const total = divisor * quotient + remainder;
            return baseQuestion(point, {
              text: `${total} 个苹果装箱，每箱装 ${divisor} 个，装满后还剩几个苹果？`,
              answer: remainder,
              word: true,
              explanation: `这是余数问题。先看最多能装满多少箱，再看剩下多少。${total} ÷ ${divisor} = ${quotient} 余 ${remainder}。`,
              steps: [`找 ${divisor} 的倍数：${divisor} × ${quotient} = ${divisor * quotient}。`, `${total} - ${divisor * quotient} = ${remainder}。`, `所以还剩 ${remainder} 个。`]
            });
          }
        ],
        4: [
          () => {
            const small = rand(12, 36);
            const times = rand(2, 4);
            const sum = small + small * times;
            return baseQuestion(point, {
              text: `甲、乙共有 ${sum} 本书，甲的本数是乙的 ${times} 倍。乙有多少本？`,
              answer: small,
              word: true,
              explanation: `和倍问题先看"份数"。乙是 1 份，甲是 ${times} 份，一共 ${times + 1} 份。`,
              steps: [`总份数：${times} + 1 = ${times + 1}。`, `每份：${sum} ÷ ${times + 1} = ${small}。`, `乙是 1 份，所以乙有 ${small} 本。`]
            });
          },
          () => {
            const gap = rand(4, 8);
            const length = gap * rand(10, 24);
            const answer = length / gap + 1;
            return baseQuestion(point, {
              text: `一条 ${length} 米长的小路，两端都种树，每隔 ${gap} 米种一棵。一共种多少棵？`,
              answer,
              word: true,
              explanation: `两端都种树，棵数 = 间隔数 + 1。先算 ${length} ÷ ${gap} = ${length / gap} 个间隔。`,
              steps: [`间隔数：${length} ÷ ${gap} = ${length / gap}。`, `两端都种，所以加 1。`, `棵数 = ${length / gap} + 1 = ${answer}。`]
            });
          },
          () => {
            const age = rand(8, 15);
            const diff = rand(18, 32);
            const years = rand(3, 8);
            return baseQuestion(point, {
              text: `小明今年 ${age} 岁，爸爸比他大 ${diff} 岁。${years} 年后爸爸比小明大多少岁？`,
              answer: diff,
              word: true,
              explanation: `年龄差不会随着时间改变。过了 ${years} 年，两个人都长 ${years} 岁，差仍然是 ${diff} 岁。`,
              steps: [`现在爸爸比小明大 ${diff} 岁。`, `${years} 年后两人都增加 ${years} 岁。`, `年龄差仍是 ${diff} 岁。`]
            });
          }
        ],
        5: [
          () => {
            const chickens = rand(8, 22);
            const rabbits = rand(5, 16);
            const heads = chickens + rabbits;
            const feet = chickens * 2 + rabbits * 4;
            return baseQuestion(point, {
              text: `鸡兔同笼，共 ${heads} 个头、${feet} 条腿。兔有多少只？`,
              answer: rabbits,
              word: true,
              explanation: `先假设全是鸡，就有 ${heads * 2} 条腿。多出来的腿每只兔比鸡多 2 条，所以兔数是差 ÷ 2。`,
              steps: [`假设全是鸡：${heads} × 2 = ${heads * 2} 条腿。`, `多出来：${feet} - ${heads * 2} = ${feet - heads * 2} 条。`, `兔子：${feet - heads * 2} ÷ 2 = ${rabbits} 只。`]
            });
          },
          () => {
            const speedA = rand(45, 70);
            const speedB = speedA + rand(10, 25);
            const time = rand(2, 5);
            const answer = (speedA + speedB) * time;
            return baseQuestion(point, {
              text: `两车从两地同时相向而行，甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，${time} 小时相遇。两地相距多少千米？`,
              answer,
              word: true,
              explanation: `相向而行时，每小时合起来接近 ${speedA + speedB} 千米。再乘时间就是总路程。`,
              steps: [`速度和：${speedA} + ${speedB} = ${speedA + speedB}。`, `总路程：${speedA + speedB} × ${time} = ${answer} 千米。`]
            });
          },
          () => {
            const a = rand(6, 12);
            const b = a + rand(2, 6);
            const days = rand(3, 8);
            const answer = (a + b) * days;
            return baseQuestion(point, {
              text: `甲每天做 ${a} 个零件，乙每天做 ${b} 个零件，两人合作 ${days} 天一共做多少个？`,
              answer,
              word: true,
              explanation: `合作问题先求一天合做多少，再乘天数。${a} + ${b} = ${a + b}，再乘 ${days}。`,
              steps: [`一天合做：${a} + ${b} = ${a + b} 个。`, `${days} 天：${a + b} × ${days} = ${answer} 个。`]
            });
          }
        ],
        6: [
          () => {
            const a = rand(4, 8);
            const b = a + rand(2, 5);
            const total = (a + b) * rand(12, 28);
            const answer = total / (a + b) * b;
            return baseQuestion(point, {
              text: `把 ${total} 元按 ${a}:${b} 分给甲乙两人，乙分到多少元？`,
              answer,
              word: true,
              explanation: `比例分配先求总份数，再求每份。乙占 ${b} 份。`,
              steps: [`总份数：${a} + ${b} = ${a + b}。`, `每份：${total} ÷ ${a + b} = ${total / (a + b)}。`, `乙：${total / (a + b)} × ${b} = ${answer} 元。`]
            });
          },
          () => {
            const water = rand(80, 180);
            const salt = rand(8, 30);
            const addWater = rand(20, 80);
            const answer = round1(salt / (water + salt + addWater) * 100);
            return baseQuestion(point, {
              text: `有盐 ${salt} 克、水 ${water} 克，又加入 ${addWater} 克水。现在盐水浓度约是多少%？`,
              answer,
              word: true,
              explanation: `浓度 = 盐的质量 ÷ 盐水总质量 × 100%。加水后盐不变，总质量变大。`,
              steps: [`盐仍是 ${salt} 克。`, `盐水总质量：${salt} + ${water} + ${addWater} = ${salt + water + addWater} 克。`, `浓度：${salt} ÷ ${salt + water + addWater} × 100% ≈ ${formatAnswer(answer)}%。`]
            });
          },
          () => {
            const speedA = rand(50, 80);
            const speedB = rand(35, 60);
            const distance = (speedA + speedB) * rand(3, 6);
            const answer = round1(distance / (speedA + speedB));
            return baseQuestion(point, {
              text: `甲乙两车相向而行，相距 ${distance} 千米。甲每小时 ${speedA} 千米，乙每小时 ${speedB} 千米，几小时相遇？`,
              answer,
              word: true,
              explanation: `相向而行时用速度和。时间 = 路程 ÷ 速度和。${distance} ÷ (${speedA} + ${speedB}) = ${formatAnswer(answer)}。`,
              steps: [`速度和：${speedA} + ${speedB} = ${speedA + speedB}。`, `时间：${distance} ÷ ${speedA + speedB} = ${formatAnswer(answer)} 小时。`]
            });
          }
        ]
      };
      return pick(makers[grade] || makers[6])();
    }

    async function ensureAudio() {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!state.audio.ctx) {
        const ctx = new AudioContextClass();
        state.audio.ctx = ctx;
      }
      if (state.audio.ctx.state === "suspended") {
        try { await state.audio.ctx.resume(); } catch (_) {}
      }
      state.audio.unlocked = state.audio.ctx.state === "running";
      return state.audio.ctx;
    }
    async function unlockAudio() {
      if (state.audio.unlocked && state.audio.ctx) return state.audio.ctx;
      if (state.audio.unlockPromise) return state.audio.unlockPromise;
      state.audio.unlockPromise = (async () => {
        const ctx = await ensureAudio();
        if (!ctx) return null;
        if (state.musicOn) startBackgroundMusic();
        return ctx;
      })();
      try {
        return await state.audio.unlockPromise;
      } finally {
        state.audio.unlockPromise = null;
      }
    }
    function handleAudioGesture() {
      if (state.musicOn && (!state.audio.bgm || state.audio.bgm.paused)) startBackgroundMusic();
    }
    function getBgmPlayer() {
      if (!state.audio.bgm) {
        const audio = new Audio(AUDIO_ASSETS.bgm);
        audio.loop = true;
        audio.preload = "none";
        audio.volume = isAndroidWebView() ? 0.22 : 0.28;
        audio.addEventListener("error", () => {
          state.audio.bgmStartFailed = true;
        });
        audio.addEventListener("canplay", () => {
          state.audio.bgmStartFailed = false;
        });
        state.audio.bgm = audio;
      }
      return state.audio.bgm;
    }
    function resetBgmPlayerForRetry() {
      state.audio.bgmStartFailed = false;
      if (!state.audio.bgm) return;
      try {
        state.audio.bgm.pause();
        state.audio.bgm.currentTime = 0;
        state.audio.bgm.load();
      } catch (_) {
        state.audio.bgm = null;
      }
    }
    function getEffectPlayer(effectId) {
      if (!effectId || state.audio.failedEffects[effectId]) return null;
      if (!state.audio.effectPlayers[effectId]) {
        const audio = new Audio(AUDIO_ASSETS.effects[effectId]);
        audio.preload = "auto";
        audio.volume = isAndroidWebView() ? 0.42 : 0.52;
        audio.addEventListener("error", () => {
          state.audio.failedEffects[effectId] = true;
        });
        state.audio.effectPlayers[effectId] = audio;
      }
      return state.audio.effectPlayers[effectId];
    }
    function getKeySoundPlayer(key) {
      const src = AUDIO_ASSETS.keys[key];
      if (!src || state.audio.failedKeys[key]) return null;
      if (!state.audio.keyPlayers[key]) {
        const audio = new Audio(src);
        audio.preload = "auto";
        audio.volume = isAndroidWebView() ? 0.32 : 0.38;
        audio.addEventListener("error", () => {
          state.audio.failedKeys[key] = true;
        });
        state.audio.keyPlayers[key] = audio;
      }
      return state.audio.keyPlayers[key];
    }
    function playEffectFile(kind) {
      const effectId = EFFECT_FILE_BY_KIND[kind];
      const player = getEffectPlayer(effectId);
      if (!player) return false;
      try {
        player.pause();
        player.currentTime = 0;
        const result = player.play();
        if (result?.catch) {
          result.catch(() => {
            state.audio.failedEffects[effectId] = true;
            if (!isAndroidWebView()) playSyntheticSound(kind);
          });
        }
        return true;
      } catch (_) {
        state.audio.failedEffects[effectId] = true;
        return false;
      }
    }
    function playKeySound(key) {
      if (!state.soundOn) return;
      const now = performance.now ? performance.now() : Date.now();
      if (now - state.audio.lastKeySoundAt < 32) return;
      const player = getKeySoundPlayer(key);
      if (!player) return;
      state.audio.lastKeySoundAt = now;
      try {
        player.pause();
        player.currentTime = 0;
        const result = player.play();
        if (result?.catch) result.catch(() => { state.audio.failedKeys[key] = true; });
      } catch (_) {
        state.audio.failedKeys[key] = true;
      }
    }
    async function tone(frequency, duration = 0.12, type = "sine", volume = 0.08, delay = 0) {
      const ctx = await ensureAudio();
      if (!ctx) return;
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.03);
      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (_) {}
      };
    }
    async function sweepTone(from, to, duration = 0.18, type = "sine", volume = 0.08, delay = 0) {
      const ctx = await ensureAudio();
      if (!ctx) return;
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.04);
      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (_) {}
      };
    }
    async function noiseBurst(duration = 0.08, volume = 0.035, delay = 0) {
      const ctx = await ensureAudio();
      if (!ctx) return;
      const start = ctx.currentTime + delay;
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(900, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(start);
      source.stop(start + duration + 0.02);
      source.onended = () => {
        try { source.disconnect(); filter.disconnect(); gain.disconnect(); } catch (_) {}
      };
    }
    function playSyntheticSound(kind) {
      if (kind === "correct") {
        tone(523.25, 0.1, "triangle", 0.082, 0);
        tone(659.25, 0.12, "triangle", 0.088, 0.07);
        tone(783.99, 0.16, "triangle", 0.092, 0.16);
        sweepTone(680, 1040, 0.16, "sine", 0.035, 0.05);
      } else if (kind === "wrong") {
        tone(233.08, 0.11, "sine", 0.072, 0);
        tone(174.61, 0.18, "sine", 0.062, 0.12);
        noiseBurst(0.07, 0.018, 0.03);
      } else if (kind === "finish") {
        tone(392, 0.1, "triangle", 0.078, 0);
        tone(523.25, 0.14, "triangle", 0.084, 0.1);
        tone(659.25, 0.2, "triangle", 0.09, 0.22);
        playSound("meow-happy");
      } else if (kind === "tap") {
        tone(420, 0.055, "sine", 0.045, 0);
      } else if (kind === "select") {
        tone(520, 0.045, "triangle", 0.046, 0);
        tone(650, 0.055, "triangle", 0.038, 0.035);
      } else if (kind === "action") {
        tone(330, 0.055, "square", 0.034, 0);
        tone(495, 0.075, "triangle", 0.048, 0.055);
      } else if (kind === "save") {
        tone(587.33, 0.08, "triangle", 0.06, 0);
        tone(783.99, 0.1, "triangle", 0.056, 0.075);
      } else if (kind === "delete") {
        sweepTone(260, 130, 0.16, "sawtooth", 0.035, 0);
      } else if (kind === "print") {
        tone(392, 0.07, "sine", 0.05, 0);
        tone(523.25, 0.07, "sine", 0.045, 0.08);
      } else if (kind === "meow" || kind === "meow-happy") {
        const cheerful = kind === "meow-happy";
        sweepTone(cheerful ? 520 : 430, cheerful ? 780 : 620, cheerful ? 0.26 : 0.32, "sine", cheerful ? 0.075 : 0.068, 0);
        sweepTone(cheerful ? 760 : 650, cheerful ? 540 : 390, cheerful ? 0.2 : 0.28, "triangle", cheerful ? 0.038 : 0.032, cheerful ? 0.13 : 0.16);
        noiseBurst(0.06, 0.012, cheerful ? 0.02 : 0.05);
      }
    }
    function playSound(kind) {
      if (!state.soundOn) return;
      if (isAndroidWebView() && !["correct", "wrong", "finish", "meow", "meow-happy"].includes(kind)) return;
      const now = performance.now ? performance.now() : Date.now();
      const minGap = (kind === "correct" || kind === "wrong" || kind === "finish") ? 120 : 90;
      if (now - state.audio.lastSoundAt < minGap) return;
      state.audio.lastSoundAt = now;
      if (!playEffectFile(kind) && !isAndroidWebView()) playSyntheticSound(kind);
    }
    async function startBackgroundMusic() {
      if (!state.musicOn) return;
      const player = getBgmPlayer();
      if (!player || state.audio.bgmStartFailed) return;
      stopBackgroundMusic();
      if (!Number.isFinite(player.currentTime)) player.currentTime = 0;
      const result = player.play();
      if (result?.catch) {
        result.catch(() => {
          state.audio.bgmStartFailed = true;
          updateSoundButtons();
          UI.notify("当前环境暂时不能自动播放背景音乐，设置已保留，点一次音乐开关后会重试。", { tone: "warn", duration: 3600 });
        });
      }
    }
    function stopBackgroundMusic() {
      if (state.audio.bgm) {
        try { state.audio.bgm.pause(); } catch (_) {}
      }
    }
    function handleAudioVisibility() {
      if (document.hidden) {
        stopBackgroundMusic();
        stopPetRoomWalk();
      } else if (state.musicOn) {
        startBackgroundMusic();
      }
      if (!document.hidden && state.view === "petspace") startPetRoomWalk();
    }
    function updateSoundButtons() {
      els.musicToggles.forEach((button) => {
        button.setAttribute("aria-pressed", String(state.musicOn));
        button.textContent = button.dataset.soundKind === "music"
          ? (state.musicOn ? "音乐 开" : "音乐 关")
          : (state.musicOn ? "背景音乐 开" : "背景音乐 关");
      });
      els.soundToggles.forEach((button) => {
        button.setAttribute("aria-pressed", String(state.soundOn));
        button.textContent = state.soundOn ? "音效 开" : "音效 关";
      });
    }
    async function toggleMusic() {
      state.musicOn = !state.musicOn;
      storageSet(STORE.music, String(state.musicOn));
      updateSoundButtons();
      if (state.musicOn) {
        resetBgmPlayerForRetry();
        startBackgroundMusic();
        if (state.soundOn) playSound("action");
      }
      else stopBackgroundMusic();
    }
    async function toggleSound() {
      state.soundOn = !state.soundOn;
      storageSet(STORE.sound, String(state.soundOn));
      updateSoundButtons();
      if (state.soundOn) {
        playSound("meow-happy");
      }
    }
    function soundForButton(button) {
      if (!button || button.disabled) return "";
      if (button.closest(".sound-controls")) return "";
      if (button.matches("[data-theme-option]")) return "select";
      if (button.closest(".number-pad")) return "";
      if (button.id === "checkBtn") return "";
      if (button.matches("[data-choice-value], [data-judge]")) return "select";
      if (button.id === "petEncourageBtn" || button.id === "petHintBtn") return "meow";
      if (button.id === "saveCauseBtn" || button.id === "saveProfileBtn" || button.id === "importBtn" || button.id === "copyExportBtn" || button.id === "exportBtn") return "save";
      if (button.id === "printBtn" || button.id === "generatePrintBtn" || button.id === "printWeakBtn" || button.closest(".print-presets")) return "print";
      if (button.classList.contains("danger") || button.id === "deleteSelectedBtn" || button.id === "deleteProfileBtn" || button.id === "clearAllBtn") return "delete";
      if (button.classList.contains("primary") || button.id === "checkBtn" || button.id === "nextBtn" || button.id === "skipBtn") return "action";
      return "tap";
    }
    function playButtonSound(event) {
      const button = event.target.closest("button");
      const kind = soundForButton(button);
      if (kind) playSound(kind);
    }
    function burst(kind) {
      if (!effectSettingEnabled("rewardParticles")) return;
      if (isAndroidWebView()) {
        els.celebrationLayer.innerHTML = "";
        const token = document.createElement("span");
        token.className = `burst-token ${kind === "wrong" ? "wrong" : ""}`;
        token.textContent = kind === "correct" ? "真棒" : "再试";
        token.style.setProperty("--x", "50%");
        token.style.setProperty("--y", "42%");
        token.style.setProperty("--dx", "0px");
        token.style.setProperty("--dy", kind === "correct" ? "-42px" : "24px");
        token.style.setProperty("--rot", "0deg");
        token.style.setProperty("--dur", "460ms");
        els.celebrationLayer.appendChild(token);
        window.setTimeout(() => token.remove(), 520);
        return;
      }
      const tokens = kind === "correct"
        ? (state.streak >= 3 ? ["🥳", "🌟", "连对", "+1", "太稳啦", "🎉"] : ["😄", "⭐", "+1", "真棒", "会了", "👏"])
        : ["😢", "慢慢来", "看步骤", "再试", "🧩"];
      els.celebrationLayer.innerHTML = "";
      tokens.forEach((label, index) => {
        const token = document.createElement("span");
        token.className = `burst-token ${kind === "wrong" ? "wrong" : "correct"}`;
        token.textContent = label;
        token.style.setProperty("--x", `${36 + index * (kind === "correct" ? 11 : 17)}%`);
        token.style.setProperty("--y", `${kind === "correct" ? 34 + (index % 2) * 12 : 42 + index * 8}%`);
        token.style.setProperty("--dx", `${(index - 2) * 34}px`);
        token.style.setProperty("--dy", `${kind === "correct" ? -110 - index * 8 : 48 + index * 14}px`);
        token.style.setProperty("--rot", `${(index - 2) * 12}deg`);
        token.style.setProperty("--dur", `${kind === "correct" ? 980 : 760}ms`);
        els.celebrationLayer.appendChild(token);
      });
      window.setTimeout(() => {
        els.celebrationLayer.querySelectorAll(".burst-token").forEach((token) => token.remove());
      }, 1100);
    }
    function streakMilestone(streak) {
      if (streak === 10) return { title: "连对 10 题", copy: "招财送你 10 金币，下一轮继续稳住。", xp: 20, coins: 10 };
      if (streak === 5) return { title: "连对 5 题", copy: "招财送你 5 金币，说明方法很稳定。", xp: 12, coins: 5 };
      if (streak === 3) return { title: "连对 3 题", copy: "小连胜达成，招财的心情也上来了。", xp: 8, mood: 3 };
      return null;
    }
    function showRewardRibbon(milestone) {
      if (!milestone || !els.celebrationLayer || !effectSettingEnabled("rewardParticles")) return;
      const ribbon = document.createElement("div");
      ribbon.className = "reward-ribbon";
      ribbon.innerHTML = `<strong>${escapeHTML(petCopy(milestone.title))}</strong><span>${escapeHTML(petCopy(milestone.copy))}</span>`;
      els.celebrationLayer.appendChild(ribbon);
      window.setTimeout(() => ribbon.remove(), isAndroidWebView() ? 900 : 1700);
    }
    function awardStreakMilestone(milestone) {
      const profile = activeProfile();
      const pet = petState(profile);
      if (milestone.coins) awardCoins(milestone.coins, milestone.title);
      pet.mood = clamp(pet.mood + Number(milestone.mood || 0), 0, 100);
      pet.xp += Number(milestone.xp || 0);
      renderPetInventory(profile);
      showRewardRibbon(milestone);
      UI.notify(petCopy(milestone.title), { duration: 1800 });
    }
    function triggerAnswerAnimation(kind) {
      els.practiceCard.dataset.mood = kind;
      setPetAction(kind, kind === "correct" ? (state.streak >= 3 ? "连胜" : "答对") : "再试");
      if (isLowMotionMode()) {
        burst(kind);
        return;
      }
      els.practiceCard.classList.remove("result-animate");
      void els.practiceCard.offsetWidth;
      els.practiceCard.classList.add("result-animate");
      window.setTimeout(() => els.practiceCard.classList.remove("result-animate"), 540);
      burst(kind);
    }

    function petTokenLabels(kind) {
      if (kind === "correct") return ["星星", "猫粮", "加油"];
      if (kind === "wrong") return ["慢慢来", "看步骤"];
      if (kind === "hint") return ["提示", "圈数字", "想方法"];
      if (kind === "encourage") return ["呼噜", "陪你", "稳住"];
      if (kind === "finish") return ["完成", "奖励"];
      return ["加油"];
    }

    function sprinklePetTokens(kind) {
      if (!els.companionArt || isLowMotionMode() || !effectSettingEnabled("rewardParticles")) return;
      const labels = petTokenLabels(kind).slice(0, kind === "wrong" ? 2 : 3);
      labels.forEach((label, index) => {
        const token = document.createElement("span");
        token.className = `pet-token ${kind}`;
        token.textContent = label;
        token.style.setProperty("--px", `${28 + index * 22}%`);
        token.style.setProperty("--delay", `${index * 72}ms`);
        els.companionArt.appendChild(token);
        window.setTimeout(() => token.remove(), 1080);
      });
    }

    function triggerPetRoomFeedback(kind = "idle", bubble = "") {
      if (state.view !== "petspace" || !els.petRoomWalker || isLowMotionMode()) return;
      const mood = ["feed", "fed"].includes(kind)
        ? "fed"
        : ["clean", "cleanComfy"].includes(kind)
          ? "clean"
          : kind === "play"
            ? "play"
            : ["encourage", "finish", "correct", "hint"].includes(kind)
              ? "encourage"
              : "comfy";
      const labels = {
        fed: ["吃饱啦", "开心"],
        clean: ["干净", "舒服"],
        play: ["好玩", "扑一下"],
        encourage: [bubble || "呼噜", "亲密+1"],
        comfy: [bubble || "舒服", "状态提升"]
      }[mood] || [bubble || "开心"];
      els.petRoomWalker.dataset.feedback = mood;
      els.petRoomWalker.classList.remove("pet-room-feedback");
      void els.petRoomWalker.offsetWidth;
      els.petRoomWalker.classList.add("pet-room-feedback");
      els.petRoomWalker.querySelectorAll(".pet-room-token").forEach((node) => node.remove());
      labels.slice(0, 2).forEach((label, index) => {
        const token = document.createElement("span");
        token.className = "pet-room-token";
        token.textContent = label;
        token.style.setProperty("--token-x", `${index ? 68 : 28}%`);
        token.style.setProperty("--token-delay", `${index * 95}ms`);
        els.petRoomWalker.appendChild(token);
        window.setTimeout(() => token.remove(), 1150);
      });
      if (state.petRoomFeedbackTimer) window.clearTimeout(state.petRoomFeedbackTimer);
      state.petRoomFeedbackTimer = window.setTimeout(() => {
        els.petRoomWalker?.classList.remove("pet-room-feedback");
        if (els.petRoomWalker) delete els.petRoomWalker.dataset.feedback;
      }, 1180);
    }

    function setPetAction(kind = "idle", bubble = "") {
      if (!els.petCharacterBtn) return;
      const mood = ["correct", "wrong", "hint", "encourage", "finish"].includes(kind) ? kind : "idle";
      const actionImage = PET_ACTION_IMAGE[kind] || "";
      els.petCharacterBtn.dataset.petMood = mood;
      if (els.companionArt) els.companionArt.dataset.petMood = mood;
      triggerPetRoomFeedback(kind, bubble);
      if (actionImage) syncPetImage(actionImage);
      if (bubble && els.bubbleText) els.bubbleText.textContent = bubble;
      if (state.petActionTimer) window.clearTimeout(state.petActionTimer);
      els.petCharacterBtn.classList.remove("pet-action");
      if (!isLowMotionMode()) {
        void els.petCharacterBtn.offsetWidth;
        els.petCharacterBtn.classList.add("pet-action");
        sprinklePetTokens(mood);
      }
      state.petActionTimer = window.setTimeout(() => {
        els.petCharacterBtn?.classList.remove("pet-action");
        if (els.petCharacterBtn) els.petCharacterBtn.dataset.petMood = "idle";
        if (els.companionArt) els.companionArt.dataset.petMood = "idle";
        syncPetImage();
      }, isLowMotionMode() ? 600 : 1500);
    }

    function shouldUseMobilePetHintPopover() {
      return state.practiceLayer === "focus" && window.matchMedia("(max-width: 620px)").matches;
    }

    function closePetHintPopover() {
      if (!els.mobilePetHintPopover) return;
      els.mobilePetHintPopover.hidden = true;
      els.mobilePetHintPopover.dataset.kind = "hint";
      els.mobilePetHintPopover.closest(".companion")?.classList.remove("hint-open", "result-open");
    }

    function clearAutoReturn() {
      if (state.autoReturnId) {
        clearTimeout(state.autoReturnId);
        state.autoReturnId = null;
      }
    }

    function startAutoReturnTimer() {
      // 练习/闯关模式结束后不再自动返回，等用户手动点"返回"或"下一轮/下一关"
    }

    function openPetHintPopover(message, options = {}) {
      if (!els.mobilePetHintPopover || !els.mobilePetHintText) return;
      clearAutoReturn();
      const kind = options.kind || "hint";
      const wasOpen = !els.mobilePetHintPopover.hidden;
      const sameKind = els.mobilePetHintPopover.dataset.kind === kind;

      // 如果弹窗已打开且是同类型，直接更新内容，不关闭重开
      if (wasOpen && sameKind) {
        if (options.html) els.mobilePetHintText.innerHTML = message;
        else els.mobilePetHintText.textContent = message;
        return;
      }

      // 如果弹窗已打开但类型不同，先关闭再打开新类型
      if (wasOpen && !sameKind) {
        els.mobilePetHintPopover.hidden = true;
        els.mobilePetHintPopover.closest(".companion")?.classList.remove("hint-open", "result-open");
        setTimeout(() => {
          openPetHintPopover(message, options);
        }, 100);
        return;
      }

      // 弹窗未打开，直接打开
      els.mobilePetHintPopover.dataset.kind = kind;
      if (els.mobilePetHintTitle) {
        els.mobilePetHintTitle.innerHTML = `<span aria-hidden="true">${kind === "result" ? "🏁" : kind === "answer" ? "👁️" : "🐾"}</span> ${escapeHTML(options.title || `${petDisplayName()}小提示`)}`;
      }
      if (els.mobilePetHintClose) els.mobilePetHintClose.setAttribute("aria-label", kind === "result" ? "关闭本轮结果" : kind === "answer" ? "关闭答案" : `关闭${petDisplayName()}提示`);
      if (options.html) els.mobilePetHintText.innerHTML = message;
      else els.mobilePetHintText.textContent = message;
      els.mobilePetHintPopover.hidden = false;
      els.mobilePetHintPopover.closest(".companion")?.classList.add("hint-open");
      els.mobilePetHintPopover.closest(".companion")?.classList.toggle("result-open", kind === "result");
    }

    function setFeedback(kind, message, face = "") {
      els.feedback.className = `feedback ${kind || ""}`.trim();
      if (face) els.feedback.dataset.face = face;
      else delete els.feedback.dataset.face;
      els.feedback.textContent = petCopy(message);
      els.feedback.classList.remove("feedback-bounce");
      void els.feedback.offsetWidth;
      els.feedback.classList.add("feedback-bounce");
      window.setTimeout(() => els.feedback.classList.remove("feedback-bounce"), 520);
    }

    function renderChrome() {
      const profile = activeProfile();
      const profileOptions = state.profiles.map((item) => `<option value="${escapeAttr(item.id)}" ${item.id === profile.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("");
      els.profileSelect.innerHTML = profileOptions;
      const today = profile.history.filter((item) => item.date === todayKey());
      els.wrongCountPill.textContent = `错题本 ${profile.wrongbook.length} 题`;
      els.todayPill.textContent = `今日 ${today.length} 题`;
      renderPetInventory(profile);
      renderDailyGoal();
      if (state.view === "tasks") renderPetTasks(profile);
      syncCustomSelects();
    }
    function renderGradeOptions() {
      els.gradeGrid.innerHTML = "";
      grades.forEach((grade) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice grade-choice";
        btn.innerHTML = `<span class="grade-choice-main"><b>${gradeNames[grade - 1]}</b></span>`;
        btn.setAttribute("aria-pressed", String(state.grade === grade));
        btn.setAttribute("aria-label", gradeNames[grade - 1]);
        btn.addEventListener("click", () => {
          state.grade = grade;
          state.pointId = safePointId(state.pointId, grade);
          renderGradeOptions();
          renderPointSelects();
        });
        els.gradeGrid.appendChild(btn);
      });
    }
    function pointOptionsHTML(grade, selected = "auto") {
      const safeSelected = safePointId(selected, grade);
      const opts = [`<option value="auto" ${safeSelected === "auto" ? "selected" : ""}>${allOption.label}</option>`];
      availablePoints(grade).forEach((point) => {
        opts.push(`<option value="${point.id}" ${safeSelected === point.id ? "selected" : ""}>${point.label}</option>`);
      });
      return opts.join("");
    }
    function renderPointSelects() {
      state.pointId = safePointId(state.pointId, state.grade);
      els.pointSelect.innerHTML = pointOptionsHTML(state.grade, state.pointId);
      const currentPrintGrade = clamp(Number(els.printGrade.value) || state.grade, 1, 6);
      els.printGrade.innerHTML = grades.map((grade) => `<option value="${grade}" ${grade === currentPrintGrade ? "selected" : ""}>${gradeNames[grade - 1]}</option>`).join("");
      els.printGrade.value = String(currentPrintGrade);
      const printGrade = Number(els.printGrade.value || state.grade);
      const printPoint = safePointId(els.printPoint.value || "auto", printGrade);
      els.printPoint.innerHTML = pointOptionsHTML(printGrade, printPoint);
      els.printPoint.value = printPoint;
      els.profileGradeInput.innerHTML = grades.map((grade) => `<option value="${grade}">${gradeNames[grade - 1]}</option>`).join("");
      els.causeSelect.value = "未标记";
      els.wrongCauseFilter.innerHTML = [`<option value="all">全部错因</option>`, ...causes.map((cause) => `<option value="${escapeAttr(cause)}">${escapeHTML(cause)}</option>`)].join("");
      const wrongGrade = activeProfile().grade || state.grade;
      const wrongPoint = safePointId(els.wrongPointFilter.value || "all", wrongGrade);
      els.wrongPointFilter.innerHTML = [`<option value="all">全部本年级知识点</option>`, ...availablePoints(wrongGrade).map((point) => `<option value="${point.id}">${point.label}</option>`)].join("");
      els.wrongPointFilter.value = wrongPoint === "auto" ? "all" : wrongPoint;
      els.adaptiveHint.textContent = state.pointId === "auto"
        ? "当前会按年级混合出题；开启自适应时，会优先安排薄弱知识点。"
        : `${pointLabel(state.pointId)}：${pointMap[state.pointId]?.helper || "专项练习"}。`;
      renderKnowledgeDetail();
      renderHomeSettingsCard();
      syncCustomSelects();
    }
    function renderProfilePanel() {
      const profile = activeProfile();
      els.profileNameInput.value = profile.name;
      els.profileGradeInput.value = String(profile.grade);
      if (els.systemProfileNameInput) els.systemProfileNameInput.value = profile.name;
      els.profileList.innerHTML = state.profiles.map((item) => {
        const total = item.history.length;
        const correct = item.history.filter((entry) => entry.correct).length;
        const rate = total ? Math.round(correct / total * 100) : 0;
        return `<article class="profile-card">
          <div class="item-top">
            <div>
              <h3>${escapeHTML(item.name)}</h3>
              <div class="mini-meta"><span>${gradeNames[item.grade - 1]}</span><span>${total} 题记录</span><span>正确率 ${rate || "--"}%</span><span>错题 ${item.wrongbook.length} 题</span></div>
            </div>
            <button class="secondary" type="button" data-use-profile="${escapeAttr(item.id)}">${item.id === state.activeId ? "使用中" : "切换"}</button>
          </div>
        </article>`;
      }).join("");
      els.profileList.querySelectorAll("[data-use-profile]").forEach((btn) => {
        btn.addEventListener("click", () => switchProfile(btn.dataset.useProfile));
      });
    }
    function syncFromProfile() {
      const profile = activeProfile();
      state.grade = profile.grade || 1;
      state.pointId = safePointId(profile.settings?.pointId || "auto", state.grade);
      state.setSize = profile.settings?.setSize || 10;
      state.adaptive = profile.settings?.adaptive !== false;
      state.answerMode = normalizeAnswerModeForViewport(profile.settings?.answerMode || "auto");
      profile.settings = { ...(profile.settings || {}), pointId: state.pointId };
      els.setSizeInput.value = String(state.setSize);
      els.dailyGoalInput.value = String(dailyGoal(profile));
      els.answerSpaceSelect.value = profile.settings?.answerSpace || "auto";
      els.answerModeSelect.value = state.answerMode;
      if (els.printTemplateSelect) els.printTemplateSelect.value = profile.settings?.printTemplate || "practice";
      if (els.printExportMode) els.printExportMode.value = profile.settings?.printOutputMode || "answers";
      syncAnswerModeAvailability();
      els.adaptiveToggle.checked = state.adaptive;
      applyTheme(state.theme, { notify: false });
      renderChrome();
      renderGradeOptions();
      renderPointSelects();
      renderProfilePanel();
      syncCustomSelects();
    }
    function switchProfile(id) {
      if (!state.profiles.some((profile) => profile.id === id)) return;
      state.activeId = id;
      updateSaveStatus(storageSet(STORE.active, id));
      syncFromProfile();
      startNewSet();
      if (state.view === "wrongbook") renderWrongbook();
      if (state.view === "tasks") renderPetTasks();
      if (state.view === "report") renderReport();
      if (state.view === "knowledgeMap") renderLearningKnowledgeMap();
    }
    function showView(view) {
      const previous = state.view;
      state.view = view;
      document.body.classList.toggle("practice-view-active", view === "practice");
      if (view !== "practice") setTypeSettingsOpen(false);
      els.tabs.forEach((btn) => btn.setAttribute("aria-selected", String(btn.dataset.view === view)));
      Object.entries(els.views).forEach(([key, element]) => {
        const active = key === view;
        element.classList.toggle("active", active);
        // 确保所有视图切换都有动画效果，包括切回在线练习页
        if (active && previous !== view && previous !== null) {
          element.classList.remove("view-enter");
          void element.offsetWidth;
          element.classList.add("view-enter");

          // 移动端：为在线练习页的内部元素也添加动画
          if (view === "practice" && window.matchMedia("(max-width: 1180px)").matches) {
            // 移动端home-dashboard是#practiceView的兄弟节点，需要单独添加动画
            const homeDashboard = document.querySelector(".home-dashboard");
            if (homeDashboard) {
              homeDashboard.classList.remove("view-enter");
              void homeDashboard.offsetWidth;
              homeDashboard.classList.add("view-enter");
            }
          }
        }
      });
      if (view !== "practice") setPracticeLayer("setup");
      if (view === "practice" && state.practiceLayer !== "focus") {
        setPracticeLayer("setup");
      }
      if (view === "wrongbook") renderWrongbook();
      if (view === "petspace") {
        renderPetSpace();
        startPetRoomWalk();
      } else {
        stopPetRoomWalk();
      }
      if (view === "tasks") renderPetTasks();
      if (view === "report") renderReport();
      if (view === "knowledgeMap") renderLearningKnowledgeMap();
      if (view === "print") syncPrintControls();
      if (view === "data") renderProfilePanel();
    }
    function setTypeSettingsOpen(open) {
      document.body.classList.toggle("type-settings-open", Boolean(open));
    }
    function openTypeSettings() {
      showView("practice");
      setPracticeLayer("setup");
      setTypeSettingsOpen(true);
    }
    function closeTypeSettings() {
      setTypeSettingsOpen(false);
      showView("practice");
      if (window.matchMedia("(max-width: 620px)").matches) {
        const homeDashboard = document.querySelector(".home-dashboard");
        if (homeDashboard) {
          homeDashboard.classList.remove("view-enter");
          void homeDashboard.offsetWidth;
          homeDashboard.classList.add("view-enter");
        }
      }
    }
    function handleTopModeAction() {
      if (window.matchMedia("(max-width: 620px)").matches) openTypeSettings();
      else startChallengeSet();
    }
    function syncCompactOnlyFeatures() {
      els.tabs
        .filter((btn) => btn.dataset.view === "petspace")
        .forEach((btn) => {
          btn.hidden = false;
          btn.setAttribute("aria-hidden", "false");
          btn.tabIndex = 0;
        });
    }

    function setPracticeLayer(layer) {
      const previous = state.practiceLayer;
      state.practiceLayer = layer;
      if (els.practiceWorkspace) {
        els.practiceWorkspace.classList.toggle("focus-mode", layer === "focus");
        // 添加动画效果到panel和main-stack
        if (previous !== layer && window.matchMedia("(max-width: 1180px)").matches) {
          const animTarget = layer === "focus"
            ? els.practiceWorkspace.querySelector(".main-stack")
            : els.practiceWorkspace.querySelector(".panel");
          if (animTarget) {
            animTarget.classList.remove("view-enter");
            void animTarget.offsetWidth;
            animTarget.classList.add("view-enter");
          }
        }
      }
      document.body.classList.toggle("practice-focus-mode", layer === "focus");
      document.body.classList.toggle("practice-return-visible", layer === "focus" && state.mode !== "normal");
      if (layer === "focus") setTypeSettingsOpen(false);
      if (layer !== "focus") closePetHintPopover();
    }

    function enterPracticeFocus() {
      setPracticeLayer("focus");
      if (window.matchMedia("(max-width: 1180px)").matches) {
        const stack = els.practiceWorkspace?.querySelector(".main-stack");
        if (stack) stack.scrollTop = 0;
      }
    }

    function returnToPracticeSetup() {
      els.mobileChallengeResult.hidden = true;
      setPracticeLayer("setup");
      setTypeSettingsOpen(true);
    }

    function formatDuration(ms = 0) {
      const total = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    function clearAutoNext() {
      if (state.autoNextId) {
        window.clearTimeout(state.autoNextId);
        state.autoNextId = null;
      }
    }
    function scheduleNextQuestion(delay = 900) {
      clearAutoNext();
      state.autoNextId = window.setTimeout(() => {
        state.autoNextId = null;
        nextQuestion();
      }, delay);
    }

    function updateTimerDisplay() {
      if (state.timedMeta && !state.setFinished) {
        const left = Math.max(0, state.timedMeta.endsAt - Date.now());
        if (els.timerStat) els.timerStat.textContent = formatDuration(left);
        return;
      }
      const elapsed = currentRoundElapsedMs();
      if (els.timerStat) els.timerStat.textContent = formatDuration(elapsed);
    }
    function currentRoundElapsedMs() {
      return state.setStartedAt ? state.setElapsedMs + Math.max(0, Date.now() - state.setStartedAt) : state.setElapsedMs;
    }

    function resetRoundRuntime() {
      clearAutoNext();
      if (state.timerId) window.clearInterval(state.timerId);
      if (state.timedTimerId) window.clearInterval(state.timedTimerId);
      state.timerId = null;
      state.timedTimerId = null;
      state.setStartedAt = 0;
      state.setElapsedMs = 0;
      state.timedMeta = null;
      updateTimerDisplay();
    }

    function startRoundTimer(elapsedMs = 0) {
      clearAutoNext();
      if (state.timerId) window.clearInterval(state.timerId);
      state.setStartedAt = Date.now();
      state.setElapsedMs = Math.max(0, Number(elapsedMs) || 0);
      updateTimerDisplay();
      state.timerId = window.setInterval(updateTimerDisplay, 1000);
    }
    function updateTimedQuizTimer() {
      if (!state.timedMeta || state.setFinished) return;
      const left = Math.max(0, state.timedMeta.endsAt - Date.now());
      if (els.timerStat) els.timerStat.textContent = formatDuration(left);
      if (left <= 0) {
        clearAutoNext();
        state.timedMeta.expired = true;
        if (state.timedTimerId) window.clearInterval(state.timedTimerId);
        state.timedTimerId = null;
        finishSet();
      }
    }
    function startTimedQuizTimer(limitMs) {
      if (state.timedTimerId) window.clearInterval(state.timedTimerId);
      state.timedMeta = { limitMs, endsAt: Date.now() + limitMs, expired: false };
      updateTimedQuizTimer();
      state.timedTimerId = window.setInterval(updateTimedQuizTimer, 250);
    }

    function stopRoundTimer() {
      if (state.setStartedAt) state.setElapsedMs = currentRoundElapsedMs();
      if (state.timerId) window.clearInterval(state.timerId);
      if (state.timedTimerId) window.clearInterval(state.timedTimerId);
      state.timerId = null;
      state.timedTimerId = null;
      state.setStartedAt = 0;
      updateTimerDisplay();
      return state.setElapsedMs;
    }

    function petState(profile = activeProfile()) {
      profile.rewards = { clearedWrong: 0, ...(profile.rewards || {}) };
      profile.rewards.pet = normalizePetState(profile.rewards.pet || {}, profile);
      return profile.rewards.pet;
    }

    function petInventoryCount(pet) {
      return Object.values(pet.inventory || {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
    }

    function petStatusLabel(pet) {
      if (pet.runaway?.status === "lost") return "需要重新领养";
      if (pet.runaway?.status === "away") return "离家出走中";
      if (pet.hunger < 20 || pet.clean < 20 || pet.mood < 20) return "需要照顾";
      if (pet.bond >= 80) return "特别亲近";
      return "状态稳定";
    }
    function petStableImageKey(pet) {
      if (pet.runaway?.status === "lost") return "lost";
      if (pet.runaway?.status === "away") return "away";
      if (pet.hunger < 25) return "hungry";
      if (pet.clean < 25) return "dirty";
      if (pet.bond >= 80) return "bondClose";
      return "idle";
    }
    function petImagePath(key = "idle") {
      return `${PET_IMAGE_BASE}/${PET_IMAGES[key] || PET_IMAGES.idle}`;
    }
    function syncPetImage(key = "") {
      const profile = activeProfile();
      const pet = petState(profile);
      const imageKey = key || petStableImageKey(pet);
      const src = petImagePath(imageKey);
      document.documentElement.style.setProperty("--cat-photo", `url("${src}")`);
      document.querySelectorAll("[data-pet-image]").forEach((img) => {
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        if (img.hasAttribute("alt") && img.getAttribute("alt")) img.setAttribute("alt", petDisplayName(profile));
      });
    }
    function petGrowthStage(pet) {
      const level = Number(pet?.level) || 1;
      return PET_STAGES
        .slice()
        .sort((a, b) => Number(b.minLevel || 1) - Number(a.minLevel || 1))
        .find((stage) => level >= Number(stage.minLevel || 1)) || PET_STAGES[0];
    }
    function petSkillUnlocked(pet, skill) {
      return (Number(pet?.level) || 1) >= Number(skill?.minLevel || 1) && (Number(pet?.bond) || 0) >= Number(skill?.minBond || 0);
    }
    function petUnlockedSkillIds(pet) {
      return PET_SKILLS.filter((skill) => petSkillUnlocked(pet, skill)).map((skill) => skill.id);
    }
    function petLearningQuality(profile = activeProfile()) {
      const today = todayItems(profile);
      const recent = today.length ? today : (profile.history || []).slice(0, 12);
      const rate = recent.length ? accuracyOf(recent) : 0;
      const reviewCount = today.filter((item) => item.mode === "wrongbook").length;
      const pointCount = new Set(today.map((item) => item.pointId).filter(Boolean)).size;
      const dueCount = dueWrongbook(profile, profile.grade || state.grade).length;
      let label = "建立节奏";
      if (recent.length >= 10 && rate >= 90) label = "高质量学习";
      else if (recent.length >= 6 && rate >= 75) label = "稳定学习";
      else if (reviewCount > 0) label = "认真复习";
      else if (recent.length > 0 && rate < 60) label = "需要慢一点";
      const xpBonus = recent.length >= 10 && rate >= 90 ? 2 : recent.length >= 6 && rate >= 75 ? 1 : 0;
      return { rate, recentCount: recent.length, reviewCount, pointCount, dueCount, label, xpBonus };
    }
    function petLearningQualityHTML(profile = activeProfile(), pet = petState(profile)) {
      const quality = petLearningQuality(profile);
      const skills = petUnlockedSkillIds(pet);
      const activeSkills = skills.length
        ? skills.map((id) => PET_SKILLS.find((skill) => skill.id === id)?.title).filter(Boolean).join("、")
        : "暂无已激活技能";
      return `<div class="pet-quality-panel">
        <div><strong>${escapeHTML(quality.label)}</strong><span>今日正确率 ${quality.recentCount ? quality.rate + "%" : "--"} · 复习 ${quality.reviewCount} 题 · 到期 ${quality.dueCount} 题</span></div>
        <div><strong>技能影响</strong><span>${escapeHTML(activeSkills)}${quality.xpBonus ? ` · 高质量答题经验 +${quality.xpBonus}` : ""}</span></div>
      </div>`;
    }
    function petExpression(profile = activeProfile(), pet = petState(profile), quality = petLearningQuality(profile)) {
      if (pet.runaway?.status === "lost") return { key: "lost", icon: "?" };
      if (pet.runaway?.status === "away") return { key: "away", icon: "…" };
      if (pet.hunger < 25) return { key: "hungry", icon: "饭" };
      if (pet.clean < 25) return { key: "dirty", icon: "洗" };
      if (pet.mood < 30) return { key: "tired", icon: "慢" };
      if (quality.recentCount >= 10 && quality.rate >= 90) return { key: "proud", icon: "稳" };
      if (quality.reviewCount > 0) return { key: "focused", icon: "复" };
      if (pet.bond >= 80) return { key: "close", icon: "亲" };
      return { key: "calm", icon: "学" };
    }
    function normalizePetWish(raw = {}, pet = null) {
      const today = todayKey();
      const wish = isPlainObject(raw) ? { ...raw } : {};
      const wishDef = PET_WISHES.find((item) => item.id === wish.id);
      if (wish.date !== today || !wishDef) {
        const nextWish = choosePetWish(pet || {});
        return {
          date: today,
          id: nextWish?.id || "",
          itemId: nextWish?.itemId || "",
          progress: 0,
          fulfilled: false
        };
      }
      return {
        date: today,
        id: wish.id,
        itemId: wish.itemId || wishDef.itemId || "",
        progress: clamp(Number(wish.progress) || 0, 0, Number(wishDef.practiceTarget) || 10),
        fulfilled: Boolean(wish.fulfilled)
      };
    }
    function choosePetWish(pet = {}) {
      if (!PET_WISHES.length) return null;
      const level = Number(pet.level) || 1;
      const candidates = PET_WISHES
        .filter((wish) => level >= Number(wish.minLevel || 1))
        .map((wish) => {
          const value = Number(pet[wish.need]) || 0;
          const gap = Math.max(0, Number(wish.threshold || 60) - value);
          const item = PET_ITEM_MAP[wish.itemId];
          const inventory = Number(pet.inventory?.[wish.itemId]) || 0;
          const coinGap = Math.max(0, Number(item?.price || 0) - (Number(pet.coins) || 0));
          return { wish, score: gap * 4 + (inventory ? 18 : 0) + (coinGap ? 8 : 0) };
        })
        .sort((a, b) => b.score - a.score);
      return (candidates[0] || {}).wish || PET_WISHES[0];
    }
    function currentPetWish(pet) {
      pet.wish = normalizePetWish(pet.wish, pet);
      return PET_WISHES.find((wish) => wish.id === pet.wish.id) || choosePetWish(pet);
    }
    function normalizePetEvent(raw = {}, pet = null) {
      const today = todayKey();
      const event = isPlainObject(raw) ? { ...raw } : {};
      const eventDef = PET_RANDOM_EVENTS.find((item) => item.id === event.id);
      if (event.date !== today || !eventDef) {
        const nextEvent = choosePetEvent(pet || {});
        return {
          date: today,
          id: nextEvent?.id || "",
          progress: 0,
          resolved: false
        };
      }
      return {
        date: today,
        id: event.id,
        progress: clamp(Number(event.progress) || 0, 0, Number(eventDef.target) || 10),
        resolved: Boolean(event.resolved)
      };
    }
    function choosePetEvent(pet = {}) {
      if (!PET_RANDOM_EVENTS.length) return null;
      const level = Number(pet.level) || 1;
      const pool = PET_RANDOM_EVENTS.filter((event) => level >= Number(event.minLevel || 1));
      if (!pool.length) return null;
      const seed = `${todayKey()}-${level}-${Number(pet.bond) || 0}`;
      const sum = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return pool[sum % pool.length];
    }
    function currentPetEvent(pet) {
      pet.event = normalizePetEvent(pet.event, pet);
      return PET_RANDOM_EVENTS.find((event) => event.id === pet.event.id) || choosePetEvent(pet);
    }
    function normalizePetStory(raw = {}) {
      const source = isPlainObject(raw) ? raw : {};
      const story = {};
      PET_STORY_CHAPTERS.forEach((chapter) => {
        const saved = isPlainObject(source[chapter.id]) ? source[chapter.id] : {};
        story[chapter.id] = {
          progress: clamp(Number(saved.progress) || 0, 0, Number(chapter.target) || 1),
          complete: Boolean(saved.complete),
          claimed: Boolean(saved.claimed)
        };
      });
      return story;
    }
    function normalizePetMemories(raw = {}) {
      const source = isPlainObject(raw) ? raw : {};
      return {
        wishes: Math.max(0, Number(source.wishes) || 0),
        careDays: Math.max(0, Number(source.careDays) || 0),
        events: Math.max(0, Number(source.events) || 0),
        stories: Math.max(0, Number(source.stories) || 0),
        levelGifts: Math.max(0, Number(source.levelGifts) || 0),
        lastCareCompleteDate: /^\d{4}-\d{2}-\d{2}$/.test(String(source.lastCareCompleteDate || "")) ? source.lastCareCompleteDate : "",
        log: Array.isArray(source.log) ? source.log.filter(isPlainObject).slice(0, 12).map((item) => ({
          date: /^\d{4}-\d{2}-\d{2}$/.test(String(item.date || "")) ? item.date : todayKey(),
          title: String(item.title || "成长记录").slice(0, 24),
          desc: String(item.desc || "").slice(0, 80)
        })) : []
      };
    }
    function addPetMemory(pet, title, desc = "") {
      pet.memories = normalizePetMemories(pet.memories);
      const entry = { date: todayKey(), title: String(title || "成长记录").slice(0, 24), desc: String(desc || "").slice(0, 80) };
      pet.memories.log = [entry, ...pet.memories.log.filter((item) => item.title !== entry.title || item.date !== entry.date)].slice(0, 12);
    }
    function pendingPetLevelRewards(pet) {
      return PET_LEVEL_REWARDS.filter((reward) => Number(pet.level) >= Number(reward.level) && !pet.rewardsClaimed?.[reward.level]);
    }
    function applyPetDecoration(pet, id) {
      if (!id) return false;
      pet.decorations = isPlainObject(pet.decorations) ? pet.decorations : {};
      const had = Boolean(pet.decorations[id]);
      pet.decorations[id] = true;
      grantPetFurniture(pet, id, true);
      return !had;
    }
    function applyPetCollectionReward(pet, reward = {}) {
      if (reward.itemId && PET_ITEM_MAP[reward.itemId]) {
        pet.inventory[reward.itemId] = (Number(pet.inventory[reward.itemId]) || 0) + Math.max(1, Number(reward.itemCount) || 1);
      }
      if (reward.decoration) applyPetDecoration(pet, reward.decoration);
      if (reward.furniture) grantPetFurniture(pet, reward.furniture, true);
      if (reward.roomTheme) grantPetTheme(pet, reward.roomTheme);
      if (reward.outfit) grantPetOutfit(pet, reward.outfit, true);
    }
    function advancePetProgressFromQuestion(profile, correct, context = {}) {
      const pet = petState(profile);
      if (pet.runaway?.status !== "home") return;
      const quality = petLearningQuality(profile);
      const mode = context.mode || state.mode || "practice";
      const qualityXp = correct ? quality.xpBonus + (mode === "wrongbook" ? 1 : 0) + (mode === "timed" && quality.rate >= 80 ? 1 : 0) : 0;
      if (qualityXp) pet.xp += qualityXp;
      if (correct && quality.rate >= 85 && quality.recentCount >= 6) pet.mood = clamp(pet.mood + 1, 0, 100);
      if (correct && quality.rate >= 90 && quality.recentCount >= 10) pet.bond = clamp(pet.bond + 1, 0, 100);
      if (correct && mode === "wrongbook") pet.bond = clamp(pet.bond + 1, 0, 100);
      if (correct && mode === "timed" && quality.rate >= 80) pet.mood = clamp(pet.mood + 1, 0, 100);
      if (!correct && quality.recentCount >= 6 && quality.rate < 60) pet.mood = clamp(pet.mood - 1, 0, 100);
      const wish = currentPetWish(pet);
      if (correct && wish && !pet.wish.fulfilled) {
        pet.wish.progress = clamp(Number(pet.wish.progress) + 1, 0, Number(wish.practiceTarget) || 10);
      }
      const event = currentPetEvent(pet);
      if (correct && event && !pet.event.resolved) {
        pet.event.progress = clamp(Number(pet.event.progress) + 1, 0, Number(event.target) || 10);
        if (pet.event.progress >= Number(event.target || 1)) resolvePetEvent(pet, event);
      }
      PET_STORY_CHAPTERS.forEach((chapter) => {
        if (Number(pet.level) < Number(chapter.minLevel || 1)) return;
        const stateForChapter = pet.story?.[chapter.id];
        if (!stateForChapter || stateForChapter.claimed || stateForChapter.complete || !correct) return;
        stateForChapter.progress = clamp(Number(stateForChapter.progress) + 1, 0, Number(chapter.target) || 1);
        if (stateForChapter.progress >= Number(chapter.target || 1)) stateForChapter.complete = true;
      });
      if (qualityXp) applyPetLevel(pet);
      updatePetCareMemory(profile, pet);
    }
    function resolvePetEvent(pet, event) {
      if (!event || pet.event?.resolved) return false;
      pet.event.resolved = true;
      pet.coins += Math.max(0, Number(event.rewardCoins) || 0);
      pet.mood = clamp(pet.mood + Number(event.mood || 0), 0, 100);
      pet.clean = clamp(pet.clean + Number(event.clean || 0), 0, 100);
      pet.bond = clamp(pet.bond + Number(event.bond || 0), 0, 100);
      pet.xp += 6 + Number(event.bond || 0);
      pet.memories = normalizePetMemories(pet.memories);
      pet.memories.events += 1;
      addPetMemory(pet, event.title, `随机事件完成，金币 +${Number(event.rewardCoins) || 0}`);
      applyPetLevel(pet);
      return true;
    }
    function petCareChecklist(profile = activeProfile(), pet = petState(profile)) {
      const today = todayItems(profile);
      return [
        { id: "feed", label: "喂食", detail: pet.hunger >= 65 ? "饱饱的" : "用猫粮补到 65", done: pet.hunger >= 65 },
        { id: "clean", label: "清洁", detail: pet.clean >= 65 ? "干干净净" : "用毛巾或泡泡澡补到 65", done: pet.clean >= 65 },
        { id: "play", label: "玩耍", detail: pet.mood >= 65 ? "心情很好" : "玩具或摸摸能提升心情", done: pet.mood >= 65 },
        { id: "practice", label: "练习", detail: `${today.length}/${Math.min(10, dailyGoal(profile))} 题`, done: today.length >= Math.min(10, dailyGoal(profile)) }
      ];
    }
    function updatePetCareMemory(profile = activeProfile(), pet = petState(profile)) {
      const checklist = petCareChecklist(profile, pet);
      if (!checklist.every((item) => item.done)) return false;
      pet.memories = normalizePetMemories(pet.memories);
      if (pet.memories.lastCareCompleteDate === todayKey()) return false;
      pet.memories.lastCareCompleteDate = todayKey();
      pet.memories.careDays += 1;
      pet.bond = clamp(pet.bond + 2, 0, 100);
      pet.xp += 8;
      applyPetLevel(pet);
      return true;
    }
    function finishPetWishWithItem(itemId, pet = petState(activeProfile())) {
      const wish = currentPetWish(pet);
      if (!wish || pet.wish?.fulfilled || wish.itemId !== itemId) return false;
      pet.wish.fulfilled = true;
      pet.wish.progress = Number(wish.practiceTarget) || pet.wish.progress || 0;
      pet.memories = normalizePetMemories(pet.memories);
      pet.memories.wishes = Math.max(0, Number(pet.memories.wishes) || 0) + 1;
      pet.mood = clamp(pet.mood + Number(wish.bonusMood || 0), 0, 100);
      pet.bond = clamp(pet.bond + Number(wish.bonusBond || 0), 0, 100);
      pet.xp += 8 + Number(wish.bonusBond || 0);
      applyPetLevel(pet);
      return true;
    }
    function petCareKindForItem(item) {
      if (item?.rename) return "";
      if (item?.effects?.hunger) return "feed";
      if (item?.effects?.clean) return "clean";
      if (item?.effects?.mood || item?.effects?.bond) return "play";
      return "";
    }
    function petCareLimit(kind) {
      return Math.max(0, Number(PET_CARE_LIMITS[kind]?.daily) || 0);
    }
    function petCareLeft(pet, kind) {
      const limit = petCareLimit(kind);
      if (!limit) return Infinity;
      if (!pet.careLog || pet.careLog.date !== todayKey()) pet.careLog = { date: todayKey(), encourage: 0, feed: 0, clean: 0, play: 0 };
      return Math.max(0, limit - (Number(pet.careLog[kind]) || 0));
    }
    function consumePetCare(pet, kind) {
      if (!kind) return true;
      if (!pet.careLog || pet.careLog.date !== todayKey()) pet.careLog = { date: todayKey(), encourage: 0, feed: 0, clean: 0, play: 0 };
      if (petCareLeft(pet, kind) <= 0) return false;
      pet.careLog[kind] = (Number(pet.careLog[kind]) || 0) + 1;
      return true;
    }
    function petCareHint(pet) {
      return `今日陪伴：摸摸 ${petCareLeft(pet, "encourage")} 次、喂食 ${petCareLeft(pet, "feed")} 次、清洁 ${petCareLeft(pet, "clean")} 次、玩耍 ${petCareLeft(pet, "play")} 次可获得完整收益。`;
    }

    function renderPetInventory(profile = activeProfile()) {
      const pet = petState(profile);
      applyPetLevel(pet);
      if (els.petInventory) {
        els.petInventory.textContent = `金币 ${pet.coins} · 背包 ${petInventoryCount(pet)} 件 · ${petStatusLabel(pet)}`;
      }
      if (els.petCoinPill) els.petCoinPill.textContent = `金币 ${pet.coins}`;
      return pet;
    }

    function petTaskState(profile, task, period) {
      const pet = petState(profile);
      const key = period === "weekly" ? currentWeekKey() : todayKey();
      const bucket = pet.tasks?.[period] || {};
      const done = clamp(Number(task.progress(profile)) || 0, 0, 999);
      const target = Math.max(1, Number(task.target) || 1);
      const claimed = bucket[task.id] === key;
      return { ...task, period, key, done, target, complete: done >= target, claimed };
    }

    function renderPetTaskCard(task) {
      const pct = Math.min(100, Math.round(task.done / task.target * 100));
      const disabled = !task.complete || task.claimed;
      const action = task.claimed ? "已完成" : task.complete ? "领取" : `${task.done}/${task.target}`;
      const cls = task.claimed ? "claimed" : task.complete ? "complete" : "";
      return `<article class="pet-task-card ${cls}">
        <div>
          <strong>${escapeHTML(task.title)}</strong>
          <span>${task.done}/${task.target} · 奖励 ${task.reward} 金币${task.bond ? ` · 亲密 +${task.bond}` : ""}</span>
          <div class="pet-task-progress" aria-hidden="true"><i style="--value:${pct}%"></i></div>
        </div>
        <button class="${task.complete && !task.claimed ? "primary" : "secondary"}" type="button" data-pet-task-period="${task.period}" data-pet-task-id="${task.id}" ${disabled ? "disabled" : ""}>${escapeHTML(action)}</button>
      </article>`;
    }

    function renderPetTasks(profile = activeProfile()) {
      if (!els.petDailyTaskList || !els.petWeeklyTaskList) return;
      const pet = petState(profile);
      const daily = PET_DAILY_TASKS.map((task) => petTaskState(profile, task, "daily"));
      const weekly = PET_WEEKLY_TASKS.map((task) => petTaskState(profile, task, "weekly"));
      els.petDailyTaskList.innerHTML = daily.map(renderPetTaskCard).join("");
      els.petWeeklyTaskList.innerHTML = weekly.map(renderPetTaskCard).join("");
      const ready = [...daily, ...weekly].filter((task) => task.complete && !task.claimed).length;
      const claimedToday = daily.filter((task) => task.claimed).length;
      if (els.petTaskSummary) els.petTaskSummary.textContent = ready ? `${ready} 项可领取` : `今日已完成 ${claimedToday} 项`;
      if (els.taskTodayCount) els.taskTodayCount.textContent = `${todayItems(profile).length} 题`;
      if (els.taskWrongReviewCount) els.taskWrongReviewCount.textContent = `${todayItems(profile).filter((item) => item.mode === "wrongbook").length} 题`;
      if (els.taskCoinCount) els.taskCoinCount.textContent = String(pet.coins);
    }

    function claimPetTask(period, id) {
      const catalog = period === "weekly" ? PET_WEEKLY_TASKS : PET_DAILY_TASKS;
      const taskDef = catalog.find((task) => task.id === id);
      if (!taskDef) return;
      const lockKey = `${period}:${id}`;
      if (state.petTaskClaimLocks.has(lockKey)) return;
      const profile = activeProfile();
      const task = petTaskState(profile, taskDef, period);
      if (!task.complete || task.claimed) return;
      const pet = petState(profile);
      state.petTaskClaimLocks.add(lockKey);
      document.querySelectorAll(`[data-pet-task-period="${period}"][data-pet-task-id="${id}"]`).forEach((btn) => {
        btn.disabled = true;
        btn.textContent = "领取中...";
      });
      const before = {
        tasks: JSON.parse(JSON.stringify(pet.tasks || { daily: {}, weekly: {} })),
        coins: pet.coins,
        bond: pet.bond,
        mood: pet.mood,
        xp: pet.xp,
        level: pet.level,
        lastCoinReason: pet.lastCoinReason,
        roundCoins: state.roundCoins
      };
      pet.tasks = { daily: {}, weekly: {}, ...(pet.tasks || {}) };
      pet.tasks[period] = { ...(pet.tasks[period] || {}), [task.id]: task.key };
      const roundCoinsBefore = state.roundCoins;
      awardCoins(task.reward, task.title);
      state.roundCoins = roundCoinsBefore;
      pet.bond = clamp(pet.bond + Number(task.bond || 0), 0, 100);
      pet.mood = clamp(pet.mood + 4, 0, 100);
      pet.xp += 6 + Number(task.bond || 0);
      applyPetLevel(pet);
      if (!saveProfiles()) {
        pet.tasks = before.tasks;
        pet.coins = before.coins;
        pet.bond = before.bond;
        pet.mood = before.mood;
        pet.xp = before.xp;
        pet.level = before.level;
        pet.lastCoinReason = before.lastCoinReason;
        state.roundCoins = before.roundCoins;
        state.petTaskClaimLocks.delete(lockKey);
        renderPetTasks(profile);
        renderPetInventory(profile);
        UI.notify("本地保存失败，奖励没有领取。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      renderPetSpace(profile);
      renderPetTasks(profile);
      document.querySelectorAll(`[data-pet-task-period="${period}"][data-pet-task-id="${id}"]`).forEach((btn) => {
        btn.disabled = true;
        btn.textContent = "已完成";
        btn.classList.remove("primary");
        btn.classList.add("secondary");
      });
      updatePetStatus(`招财：${task.title}完成了，额外奖励 ${task.reward} 金币。`, "领奖励");
      setPetAction("finish", "领奖励");
      UI.notify(`已完成：${task.title}，金币 +${task.reward}`);
      state.petTaskClaimLocks.delete(lockKey);
    }

    function awardCoins(amount, reason = "") {
      const profile = activeProfile();
      const pet = profile.rewards?.pet || petState(profile);
      const gain = Math.max(0, Math.floor(Number(amount) || 0));
      if (!gain) return 0;
      pet.coins += gain;
      state.roundCoins += gain;
      if (reason) pet.lastCoinReason = reason;
      return gain;
    }

    function awardQuestionReward(correct, question) {
      if (!correct) {
        const pet = petState();
        pet.xp += 1;
        pet.lastPracticeDate = todayKey();
        return 0;
      }
      let gain = 2;
      if (state.mode === "wrongbook" && correct) gain += 2;
      awardCoins(gain, "答题奖励");
      const pet = petState();
      pet.xp += 2;
      pet.mood = clamp(pet.mood + 1, 0, 100);
      if (state.mode === "wrongbook" && correct) pet.bond = clamp(pet.bond + 1, 0, 100);
      pet.lastPracticeDate = todayKey();
      return gain;
    }

    function awardRoundRewards(total, correct, rate) {
      const profile = activeProfile();
      const pet = petState(profile);
      const today = todayKey();
      const firstRoundToday = pet.lastRewardDate !== today;
      const reward = {
        coins: correct ? Math.min(10, Math.ceil(correct / 2)) : 0,
        mood: total ? 6 + (rate >= 80 ? 3 : 0) : 0,
        bond: total ? 4 + (state.mode === "wrongbook" ? 3 : 0) + (state.mode === "challenge" && rate >= 80 ? 2 : 0) : 0,
        xp: total + correct + (rate >= 80 ? 10 : 0) + (firstRoundToday ? 12 : 0) + (state.mode === "timed" && total >= 8 ? 8 : 0),
        foundBack: false
      };
      awardCoins(reward.coins, "完成一轮");
      pet.mood = clamp(pet.mood + reward.mood, 0, 100);
      pet.bond = clamp(pet.bond + reward.bond, 0, 100);
      pet.xp += reward.xp;
      pet.lastRewardDate = today;
      pet.lastPracticeDate = today;
      if (pet.runaway?.status === "away" && daysBetween(pet.runaway.awayDate, today) <= 3) {
        pet.runaway = { status: "home", awayDate: "", lostDate: "" };
        pet.level = Math.max(1, (Number(pet.level) || 1) - 1);
        pet.xp = Math.max(0, (pet.level - 1) * PET_XP_PER_LEVEL);
        pet.bond = clamp(pet.bond - 20, 0, 100);
        pet.mood = Math.max(pet.mood, 35);
        pet.hunger = Math.max(pet.hunger, 35);
        pet.clean = Math.max(pet.clean, 35);
        reward.foundBack = true;
      }
      applyPetLevel(pet);
      renderPetInventory(profile);
      return reward;
    }

    function updatePetStatus(message = "", bubble = "") {
      const profile = activeProfile();
      const pet = renderPetInventory(profile);
      if (!state.petActionTimer) syncPetImage();
      const paint = (bar, text, value) => {
        if (!bar || !text) return;
        bar.style.setProperty("--value", `${value}%`);
        text.textContent = String(value);
      };
      paint(els.petEnergy, els.petEnergyText, pet.mood);
      paint(els.petConfidence, els.petConfidenceText, pet.hunger);
      paint(els.petClean, els.petCleanText, pet.clean);
      paint(els.petBond, els.petBondText, pet.bond);
      if (els.petLevel) els.petLevel.textContent = `${petDisplayName(profile)} Lv.${pet.level}`;
      if (els.petCompanionTitle) els.petCompanionTitle.textContent = `${petDisplayName(profile)}陪练`;
      els.tabs.filter((btn) => btn.dataset.view === "petspace").forEach((btn) => {
        btn.textContent = `🐾 ${petDisplayName(profile)}空间`;
      });
      els.tabs.filter((btn) => btn.dataset.view === "tasks").forEach((btn) => {
        btn.textContent = "✅ 任务";
      });
      document.querySelectorAll("[data-jump='petspace']").forEach((btn) => {
        const prefix = btn.closest(".pet-actions") ? "🏠" : "🐾 进入";
        btn.textContent = `${prefix}${petDisplayName(profile)}空间`;
      });
      if (message) els.companionTalk.textContent = petCopy(message, profile);
      if (bubble) els.bubbleText.textContent = bubble;
      if (els.petCharacterBtn) {
        const title = `摸摸${petDisplayName(profile)}：心情 ${pet.mood}，饥饿 ${pet.hunger}，清洁 ${pet.clean}，亲密 ${pet.bond}`;
        els.petCharacterBtn.title = title;
        els.petCharacterBtn.setAttribute("aria-label", title);
        els.petCharacterBtn.querySelector("img")?.setAttribute("alt", petDisplayName(profile));
      }
      if (els.petEncourageBtn) els.petEncourageBtn.textContent = `🐾 摸摸${petDisplayName(profile)}`;
      if (els.petHintBtn) {
        const hintLabel = `让${petDisplayName(profile)}提示`;
        const full = document.createElement("span");
        const compact = document.createElement("span");
        full.className = "pet-hint-full";
        compact.className = "pet-hint-compact";
        compact.setAttribute("aria-hidden", "true");
        full.textContent = `💡 ${hintLabel}`;
        compact.textContent = "提示";
        els.petHintBtn.textContent = "";
        els.petHintBtn.appendChild(full);
        els.petHintBtn.appendChild(compact);
        els.petHintBtn.title = hintLabel;
        els.petHintBtn.setAttribute("aria-label", hintLabel);
      }
      if (els.mobilePetHintTitle) els.mobilePetHintTitle.innerHTML = `<span aria-hidden="true">🐾</span> ${escapeHTML(petDisplayName(profile))}小提示`;
      if (els.mobilePetHintClose) els.mobilePetHintClose.setAttribute("aria-label", `关闭${petDisplayName(profile)}提示`);
      renderPetSpace(profile);
    }

    function petBarHTML(label, value) {
      const tone = value < 20 ? "danger" : value < 40 ? "warn" : "good";
      return `<div class="pet-space-bar ${tone}">
        <span>${label}</span>
        <div class="bar-track"><div class="bar-fill" style="--value:${value}%"></div></div>
        <b>${value}</b>
      </div>`;
    }
    function renderPetSkillStrip(pet) {
      if (!els.petSkillStrip) return;
      const unlocked = new Set(petUnlockedSkillIds(pet));
      els.petSkillStrip.innerHTML = PET_SKILLS.length ? PET_SKILLS.map((skill) => {
        const active = unlocked.has(skill.id);
        const lock = active ? "已影响学习体验" : `Lv.${skill.minLevel} / 亲密 ${skill.minBond}`;
        return `<span class="${active ? "unlocked" : "locked"}" title="${escapeAttr(skill.desc)}">${active ? "✓" : lock} ${escapeHTML(skill.title)}</span>`;
      }).join("") : "";
    }
    function renderPetWishCard(profile, pet) {
      if (!els.petWishCard) return;
      const wish = currentPetWish(pet);
      if (!wish) {
        els.petWishCard.innerHTML = `<h3>今日心愿</h3><p>${escapeHTML(petCopy("今天先完成一组练习，招财会慢慢说出想要什么。", profile))}</p>`;
        return;
      }
      const item = PET_ITEM_MAP[wish.itemId] || {};
      const progress = clamp(Number(pet.wish?.progress) || 0, 0, Number(wish.practiceTarget) || 1);
      const target = Math.max(1, Number(wish.practiceTarget) || 1);
      const practiceLeft = Math.max(0, target - progress);
      const have = Number(pet.inventory?.[wish.itemId]) || 0;
      const coinGap = Math.max(0, Number(item.price || 0) - Number(pet.coins || 0));
      const done = Boolean(pet.wish?.fulfilled);
      const action = done
        ? `<button class="secondary" type="button" disabled>已满足</button>`
        : have > 0
          ? `<button class="primary" type="button" data-pet-use="${escapeAttr(wish.itemId)}">使用${escapeHTML(item.name || "用品")}</button>`
          : coinGap <= 0
            ? `<button class="primary" type="button" data-pet-buy="${escapeAttr(wish.itemId)}">购买${escapeHTML(item.name || "用品")}</button>`
            : `<button class="secondary" type="button" data-pet-wish-practice>做 ${practiceLeft || 3} 题攒心愿</button>`;
      els.petWishCard.innerHTML = `
        <div class="pet-card-title"><span aria-hidden="true">${item.icon || "⭐"}</span><div><h3>今日心愿</h3><p>${escapeHTML(petCopy(wish.title, profile))}</p></div></div>
        <div class="pet-mini-progress"><i style="--value:${Math.round(progress / target * 100)}%"></i></div>
        <p>${done ? `${petDisplayName(profile)}很开心，今天的心愿完成啦。` : coinGap > 0 ? `还差 ${coinGap} 金币。完成 ${practiceLeft || 3} 道学习任务会继续推进心愿。` : `已经可以买 ${item.name || "用品"} 了。`}</p>
        ${action ? `<div class="pet-card-actions">${action}</div>` : ""}`;
    }
    function renderPetCarePlan(profile, pet) {
      const checklist = petCareChecklist(profile, pet);
      const done = checklist.filter((item) => item.done).length;
      if (els.petCareScore) els.petCareScore.textContent = `${done}/${checklist.length}`;
      if (els.petCareChecklist) {
        els.petCareChecklist.innerHTML = checklist.map((item) => `<div class="${item.done ? "done" : ""}">
          <span>${item.done ? "✓" : "·"}</span>
          <strong>${escapeHTML(item.label)}</strong>
          <em>${escapeHTML(item.detail)}</em>
        </div>`).join("");
      }
    }
    function renderPetLevelGiftCard(pet, profile = activeProfile()) {
      if (!els.petLevelGiftCard) return;
      const pending = pendingPetLevelRewards(pet)[0];
      if (!pending) {
        const next = PET_LEVEL_REWARDS.find((reward) => Number(reward.level) > Number(pet.level));
        els.petLevelGiftCard.innerHTML = `
          <h3>成长礼物</h3>
          <p>${next ? `Lv.${next.level} 可领取：${petCopy(next.title, profile)}。` : "所有阶段礼物都已经领取。"}</p>`;
        return;
      }
      const item = PET_ITEM_MAP[pending.itemId] || {};
      els.petLevelGiftCard.innerHTML = `
        <div class="pet-card-title"><span aria-hidden="true">🎁</span><div><h3>成长礼物</h3><p>Lv.${pending.level} · ${escapeHTML(petCopy(pending.title, profile))}</p></div></div>
        <p>奖励：金币 +${Number(pending.coins) || 0}${pending.itemId ? `，${item.name || "用品"} x${Number(pending.itemCount) || 1}` : ""}${pending.unlock ? `，解锁${petCopy(pending.unlock, profile)}` : ""}</p>
        <div class="pet-card-actions"><button class="primary" type="button" data-pet-claim-level="${pending.level}">领取礼物</button></div>`;
    }
    function renderPetEventCard(pet, profile = activeProfile()) {
      if (!els.petEventCard) return;
      const event = currentPetEvent(pet);
      if (!event) {
        els.petEventCard.innerHTML = `<h3>随机事件</h3><p>Lv.3 后会出现更多小窝事件。</p>`;
        return;
      }
      const progress = clamp(Number(pet.event?.progress) || 0, 0, Number(event.target) || 1);
      const target = Math.max(1, Number(event.target) || 1);
      const item = PET_ITEM_MAP[event.itemId] || {};
      const itemAction = event.itemId && !pet.event?.resolved && (Number(pet.inventory?.[event.itemId]) || 0) > 0
        ? `<button class="secondary" type="button" data-pet-event-use="${escapeAttr(event.itemId)}">使用${escapeHTML(item.name || "用品")}</button>`
        : "";
      els.petEventCard.innerHTML = `
        <div class="pet-card-title"><span aria-hidden="true">${event.rare ? "🗺️" : "🎲"}</span><div><h3>随机事件</h3><p>${escapeHTML(petCopy(event.title, profile))}</p></div></div>
        <p>${pet.event?.resolved ? escapeHTML(petCopy(`事件完成，招财收获了金币 +${Number(event.rewardCoins) || 0}。`, profile)) : escapeHTML(petCopy(event.desc, profile))}</p>
        <div class="pet-mini-progress"><i style="--value:${Math.round(progress / target * 100)}%"></i></div>
        <div class="pet-card-actions">
          ${pet.event?.resolved ? `<button class="secondary" type="button" disabled>已完成</button>` : `<button class="primary" type="button" data-pet-event-practice>做 ${target - progress} 题推进</button>`}
          ${itemAction}
        </div>`;
    }
    function renderPetStoryCard(pet, profile = activeProfile()) {
      if (!els.petStoryCard) return;
      const available = PET_STORY_CHAPTERS.filter((chapter) => Number(pet.level) >= Number(chapter.minLevel || 1));
      const chapter = available.find((item) => !pet.story?.[item.id]?.claimed) || available[available.length - 1] || PET_STORY_CHAPTERS[0];
      if (!chapter) {
        els.petStoryCard.innerHTML = `<h3>${escapeHTML(petCopy("招财故事", profile))}</h3><p>升级后会解锁剧情章节。</p>`;
        return;
      }
      const locked = Number(pet.level) < Number(chapter.minLevel || 1);
      const stateForChapter = pet.story?.[chapter.id] || { progress: 0, complete: false, claimed: false };
      const progress = clamp(Number(stateForChapter.progress) || 0, 0, Number(chapter.target) || 1);
      const target = Math.max(1, Number(chapter.target) || 1);
      els.petStoryCard.innerHTML = `
        <div class="pet-card-title"><span aria-hidden="true">📖</span><div><h3>${escapeHTML(petCopy("招财故事", profile))}</h3><p>${escapeHTML(petCopy(chapter.title, profile))}</p></div></div>
        <p>${locked ? `Lv.${chapter.minLevel} 解锁这一章。` : escapeHTML(petCopy(chapter.desc, profile))}</p>
        <div class="pet-mini-progress"><i style="--value:${Math.round(progress / target * 100)}%"></i></div>
        <div class="pet-card-actions">
          ${locked ? `<button class="secondary" type="button" disabled>未解锁</button>` : stateForChapter.claimed ? `<button class="secondary" type="button" disabled>已收藏</button>` : stateForChapter.complete ? `<button class="primary" type="button" data-pet-claim-story="${escapeAttr(chapter.id)}">领取剧情奖励</button>` : `<button class="primary" type="button" data-pet-story-practice>继续故事 ${progress}/${target}</button>`}
        </div>`;
    }
    function renderPetMemoryCard(pet, profile = activeProfile()) {
      if (!els.petMemoryCard) return;
      const memories = normalizePetMemories(pet.memories);
      const decor = PET_FURNITURE.filter((item) => pet.ownedFurniture?.[item.id]).slice(-4);
      els.petMemoryCard.innerHTML = `
        <div class="pet-card-title"><span aria-hidden="true">📔</span><div><h3>成长日记</h3><p>心愿 ${memories.wishes} · 事件 ${memories.events} · 故事 ${memories.stories}</p></div></div>
        <div class="pet-decoration-row">${decor.length ? decor.map((item) => `<span title="${escapeAttr(petCopy(item.desc, profile))}">${item.icon} ${escapeHTML(petCopy(item.title, profile))}</span>`).join("") : "<span>还没有装饰</span>"}</div>
        <div class="pet-memory-list">${memories.log.length ? memories.log.slice(0, 3).map((item) => `<p><strong>${escapeHTML(petCopy(item.title, profile))}</strong><em>${escapeHTML(item.date)}</em><br>${escapeHTML(petCopy(item.desc, profile))}</p>`).join("") : "<p>完成心愿、随机事件或剧情后，会留下成长记录。</p>"}</div>`;
    }
    function petCollectionRewardText(reward = {}) {
      const parts = [];
      if (Number(reward.coins) > 0) parts.push(`金币 +${Number(reward.coins)}`);
      if (reward.itemId && PET_ITEM_MAP[reward.itemId]) parts.push(`${PET_ITEM_MAP[reward.itemId].name} x${Number(reward.itemCount) || 1}`);
      if (reward.roomTheme && PET_ROOM_THEME_MAP[reward.roomTheme]) parts.push(`主题：${PET_ROOM_THEME_MAP[reward.roomTheme].title}`);
      if (reward.furniture && PET_FURNITURE_MAP[reward.furniture]) parts.push(`家具：${PET_FURNITURE_MAP[reward.furniture].title}`);
      if (reward.decoration && PET_FURNITURE_MAP[reward.decoration]) parts.push(`家具：${PET_FURNITURE_MAP[reward.decoration].title}`);
      if (reward.outfit && PET_OUTFIT_MAP[reward.outfit]) parts.push(`装扮：${PET_OUTFIT_MAP[reward.outfit].title}`);
      return parts.join(" · ") || "成长奖励";
    }
    function petAchievementValue(profile, pet, key) {
      const today = todayItems(profile);
      if (key === "answerCount") return profile.history.length;
      if (key === "learningDays") return learningDaysFor(profile);
      if (key === "todayAccuracy") return today.length ? accuracyOf(today) : 0;
      if (key === "careDays") return Number(pet.memories?.careDays) || 0;
      if (key === "wishes") return Number(pet.memories?.wishes) || 0;
      if (key === "events") return Number(pet.memories?.events) || 0;
      if (key === "stories") return Number(pet.memories?.stories) || 0;
      if (key === "petLevel") return Number(pet.level) || 1;
      if (key === "furnitureCount") return countTruthy(pet.ownedFurniture);
      if (key === "outfitCount") return countTruthy(pet.outfits);
      if (key === "themeCount") return countTruthy(pet.unlockedThemes);
      return 0;
    }
    function petAchievementState(profile, achievement) {
      const pet = petState(profile);
      const value = petAchievementValue(profile, pet, achievement.progressKey);
      const target = Math.max(1, Number(achievement.target) || 1);
      const complete = achievement.progressKey === "todayAccuracy"
        ? todayItems(profile).length >= 10 && value >= target
        : value >= target;
      return {
        ...achievement,
        value,
        target,
        pct: Math.min(100, Math.round(value / target * 100)),
        complete,
        claimed: Boolean(pet.achievements?.claimed?.[achievement.id])
      };
    }
    function petAchievementGroupKey(state) {
      const key = state.progressKey || "";
      if (["answerCount", "learningDays", "todayAccuracy", "petLevel"].includes(key)) return "学习成长";
      if (["careDays", "wishes", "events", "stories"].includes(key)) return "陪伴照料";
      return "收藏展示";
    }
    function equippedFurnitureList(pet) {
      return PET_FURNITURE.filter((item) => pet.equippedFurniture?.[item.id]);
    }
    function petCollectionCounts(pet) {
      return {
        themes: countTruthy(pet.unlockedThemes),
        furniture: countTruthy(pet.ownedFurniture),
        equippedFurniture: equippedFurnitureList(pet).length,
        outfits: countTruthy(pet.outfits),
        achievements: countTruthy(pet.achievements?.claimed)
      };
    }
    function nextCollectionGoal(pet) {
      const level = Number(pet.level || 1);
      const candidates = [
        ...PET_ROOM_THEMES.map((item) => ({ kind: "theme", item, owned: Boolean(pet.unlockedThemes?.[item.id]) })),
        ...PET_FURNITURE.map((item) => ({ kind: "furniture", item, owned: Boolean(pet.ownedFurniture?.[item.id]) })),
        ...PET_OUTFITS.map((item) => ({ kind: "outfit", item, owned: Boolean(pet.outfits?.[item.id]) }))
      ].filter((entry) => !entry.owned);
      return candidates
        .map((entry) => ({
          ...entry,
          levelGap: Math.max(0, Number(entry.item.minLevel || 1) - level),
          coinGap: Math.max(0, Number(entry.item.price || 0) - Number(pet.coins || 0))
        }))
        .sort((a, b) => a.levelGap - b.levelGap || a.coinGap - b.coinGap || Number(a.item.price || 0) - Number(b.item.price || 0))[0];
    }
    function renderPetShowcase(profile = activeProfile(), pet = petState(profile)) {
      if (!els.petShowcaseCard) return;
      const theme = PET_ROOM_THEME_MAP[pet.roomTheme] || PET_ROOM_THEME_MAP.sunny || { title: "阳光小窝", icon: "" };
      const outfit = pet.outfit ? PET_OUTFIT_MAP[pet.outfit] : null;
      const furniture = equippedFurnitureList(pet);
      const counts = petCollectionCounts(pet);
      const next = nextCollectionGoal(pet);
      const nextCopy = next
        ? next.levelGap > 0
          ? `Lv.${next.item.minLevel} 解锁 ${next.item.title}`
          : next.coinGap > 0
            ? `${next.item.title} 还差 ${next.coinGap} 金币`
            : `${next.item.title} 可以解锁`
        : "收藏已全部点亮";
      els.petShowcaseCard.innerHTML = `
        <div class="pet-showcase-head">
          <div>
            <h3>展示成果</h3>
            <p class="muted">${escapeHTML(theme.title)} · ${outfit ? escapeHTML(outfit.title) : "未穿戴装扮"} · 成就 ${counts.achievements}/${PET_ACHIEVEMENTS.length}</p>
          </div>
          <button class="secondary compact-btn" type="button" data-open-pet-modal="dressup">去装扮</button>
        </div>
        <div class="pet-showcase-grid">
          <span><b>${theme.icon || "◌"}</b><strong>${escapeHTML(theme.title)}</strong><em>当前主题</em></span>
          <span><b>${outfit?.icon || "◇"}</b><strong>${escapeHTML(outfit?.title || "清爽原貌")}</strong><em>当前造型</em></span>
          <span><b>▦</b><strong>${counts.equippedFurniture}/${counts.furniture}</strong><em>已摆放家具</em></span>
          <span><b>🏅</b><strong>${counts.achievements}</strong><em>已领成就</em></span>
        </div>
        <div class="pet-showcase-strip">
          ${furniture.length ? furniture.slice(0, 5).map((item) => `<i title="${escapeAttr(item.desc || item.title)}">${item.icon || "✦"} ${escapeHTML(item.title)}</i>`).join("") : "<i>还没有摆放家具</i>"}
          <i>${escapeHTML(nextCopy)}</i>
        </div>`;
      els.petShowcaseCard.querySelector("[data-open-pet-modal]")?.addEventListener("click", (event) => {
        event.stopPropagation();
        openPetModal(event.currentTarget.dataset.openPetModal, { returnToPlan: Boolean(event.currentTarget.closest("#petPlanMenuModal")) });
      });
    }
    function petShopRecommendation(profile = activeProfile(), pet = petState(profile)) {
      const wish = currentPetWish(pet);
      if (wish && !pet.wish?.fulfilled && PET_ITEM_MAP[wish.itemId]) {
        return { item: PET_ITEM_MAP[wish.itemId], reason: "今日心愿需要" };
      }
      const lowNeeds = [
        { key: "hunger", label: "饥饿值偏低", itemIds: ["basicFood", "premiumFood"] },
        { key: "clean", label: "清洁值偏低", itemIds: ["towel", "bath"] },
        { key: "mood", label: "心情需要补一补", itemIds: ["yarnBall", "teaser"] },
        { key: "bond", label: "亲密值可以提升", itemIds: ["yarnBall", "fishToy"] }
      ].filter((need) => Number(pet[need.key]) < 65).sort((a, b) => Number(pet[a.key]) - Number(pet[b.key]));
      for (const need of lowNeeds) {
        const item = need.itemIds.map((id) => PET_ITEM_MAP[id]).filter(Boolean).find((entry) => Number(entry.price || 0) <= Number(pet.coins || 0)) || PET_ITEM_MAP[need.itemIds[0]];
        if (item) return { item, reason: need.label };
      }
      const affordable = PET_SHOP.filter((item) => Number(item.price || 0) <= Number(pet.coins || 0)).sort((a, b) => Number(b.price || 0) - Number(a.price || 0))[0];
      return affordable ? { item: affordable, reason: "当前金币可购买" } : { item: PET_ITEM_MAP.basicFood || PET_SHOP[0], reason: "先攒基础照料用品" };
    }
    function renderPetShopAdvisor(profile = activeProfile(), pet = petState(profile)) {
      if (!els.petShopAdvisor) return;
      const recommendation = petShopRecommendation(profile, pet);
      const item = recommendation?.item;
      const careLeft = item ? petCareLeft(pet, petCareKindForItem(item)) : 0;
      const gap = item ? Math.max(0, Number(item.price || 0) - Number(pet.coins || 0)) : 0;
      els.petShopAdvisor.innerHTML = item ? `
        <div>
          <strong>推荐购买：${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(recommendation.reason)} · ${gap ? `还差 ${gap} 金币` : "金币足够"}${Number.isFinite(careLeft) ? ` · 今日收益 ${careLeft} 次` : ""}</span>
        </div>
        <button class="${gap ? "secondary" : "primary"} compact-btn" type="button" data-pet-buy="${escapeAttr(item.id)}" ${gap ? "disabled" : ""}>${gap ? "继续攒金币" : "购买"}</button>` : "";
    }
    function renderPetDressupPreview(profile = activeProfile(), pet = petState(profile)) {
      if (!els.petDressupPreview) return;
      const theme = PET_ROOM_THEME_MAP[pet.roomTheme] || PET_ROOM_THEME_MAP.sunny || { title: "阳光小窝", icon: "" };
      const outfit = pet.outfit ? PET_OUTFIT_MAP[pet.outfit] : null;
      const furniture = equippedFurnitureList(pet);
      const counts = petCollectionCounts(pet);
      els.petDressupPreview.innerHTML = `
        <div class="pet-dressup-preview-scene" data-room-theme="${escapeAttr(pet.roomTheme || "sunny")}" data-outfit="${escapeAttr(pet.outfit || "")}">
          <span>${theme.icon || "☀️"}</span>
          <b>${outfit?.icon || "🐾"}</b>
        </div>
        <div>
          <strong>当前展示</strong>
          <p>${escapeHTML(theme.title)} · ${outfit ? escapeHTML(outfit.title) : "未穿戴装扮"} · 已摆放 ${counts.equippedFurniture} 件家具</p>
          <div class="pet-dressup-preview-tags">
            ${furniture.length ? furniture.slice(0, 4).map((item) => `<span>${item.icon || "✦"} ${escapeHTML(item.title)}</span>`).join("") : "<span>还没有摆放家具</span>"}
          </div>
        </div>`;
    }
    function renderPetAchievementBoard(profile = activeProfile()) {
      if (!els.petAchievementBoard) return;
      const states = PET_ACHIEVEMENTS.map((item) => petAchievementState(profile, item));
      const groups = ["学习成长", "陪伴照料", "收藏展示"].map((group) => {
        const items = states.filter((state) => petAchievementGroupKey(state) === group);
        const complete = items.filter((state) => state.claimed).length;
        const ready = items.filter((state) => state.complete && !state.claimed).length;
        const pct = items.length ? Math.round(complete / items.length * 100) : 0;
        return { group, items, complete, ready, pct };
      });
      const next = states.find((state) => state.complete && !state.claimed) || states.filter((state) => !state.claimed).sort((a, b) => b.pct - a.pct)[0];
      els.petAchievementBoard.innerHTML = `
        <div class="pet-achievement-board-next">
          <strong>${next ? escapeHTML(next.complete && !next.claimed ? `可领取：${next.title}` : `接近完成：${next.title}`) : "成就已全部完成"}</strong>
          <span>${next ? `${escapeHTML(petAchievementGroupKey(next))} · ${next.value}/${next.target} · ${escapeHTML(petCollectionRewardText(next))}` : "奖励都已经进入收藏展示"}</span>
        </div>
        <div class="pet-achievement-board-grid">
          ${groups.map((group) => `<span>
            <strong>${escapeHTML(group.group)}</strong>
            <em>${group.complete}/${group.items.length}${group.ready ? ` · ${group.ready} 可领` : ""}</em>
            <i class="pet-mini-progress"><b style="--value:${group.pct}%"></b></i>
          </span>`).join("")}
        </div>`;
    }
    function renderPetAchievementCard(state) {
      const action = state.claimed
        ? `<button class="secondary" type="button" disabled>已完成</button>`
        : state.complete
          ? `<button class="primary" type="button" data-pet-claim-achievement="${escapeAttr(state.id)}">领取</button>`
          : `<button class="secondary" type="button" disabled>${state.value}/${state.target}</button>`;
      return `<article class="pet-achievement-card ${state.claimed ? "claimed" : state.complete ? "complete" : ""}">
        <div>
          <strong>${escapeHTML(state.title)}</strong>
          <span>${escapeHTML(state.desc)}</span>
          <small>${escapeHTML(petCollectionRewardText(state))}</small>
          <div class="pet-mini-progress"><i style="--value:${state.pct}%"></i></div>
        </div>
        ${action}
      </article>`;
    }
    function renderPetAchievements(profile = activeProfile()) {
      if (!els.petAchievementList) return;
      const states = PET_ACHIEVEMENTS.map((item) => petAchievementState(profile, item));
      const ready = states.filter((item) => item.complete && !item.claimed).length;
      const claimed = states.filter((item) => item.claimed).length;
      if (els.petAchievementSummary) els.petAchievementSummary.textContent = ready ? `${ready} 项可领取` : `已完成 ${claimed}/${states.length}`;
      renderPetAchievementBoard(profile);
      els.petAchievementList.innerHTML = states.map(renderPetAchievementCard).join("");
    }
    function collectionCard(kind, item, pet) {
      const minLevel = Number(item.minLevel || 1);
      const levelLocked = Number(pet.level || 1) < minLevel;
      const price = Math.max(0, Number(item.price) || 0);
      const metaSources = {
        levelRewards: PET_LEVEL_REWARDS,
        storyChapters: PET_STORY_CHAPTERS,
        achievements: PET_ACHIEVEMENTS
      };
      let owned = false;
      let active = false;
      let action = "";
      if (kind === "theme") {
        owned = Boolean(pet.unlockedThemes?.[item.id]);
        active = pet.roomTheme === item.id;
        action = levelLocked
          ? `<button class="secondary" type="button" disabled>Lv.${minLevel}</button>`
          : owned
            ? `<button class="${active ? "secondary" : "primary"}" type="button" data-pet-equip-theme="${escapeAttr(item.id)}" ${active ? "disabled" : ""}>${active ? "使用中" : "使用"}</button>`
            : `<button class="primary" type="button" data-pet-buy-theme="${escapeAttr(item.id)}" ${pet.coins >= price ? "" : "disabled"}>${price} 金币</button>`;
      } else if (kind === "furniture") {
        owned = Boolean(pet.ownedFurniture?.[item.id]);
        active = Boolean(pet.equippedFurniture?.[item.id]);
        action = levelLocked
          ? `<button class="secondary" type="button" disabled>Lv.${minLevel}</button>`
          : owned
            ? `<button class="${active ? "secondary" : "primary"}" type="button" data-pet-equip-furniture="${escapeAttr(item.id)}">${active ? "收起" : "摆放"}</button>`
            : `<button class="primary" type="button" data-pet-buy-furniture="${escapeAttr(item.id)}" ${price > 0 && pet.coins >= price ? "" : "disabled"}>${price ? `${price} 金币` : "待解锁"}</button>`;
      } else {
        owned = Boolean(pet.outfits?.[item.id]);
        active = pet.outfit === item.id;
        action = levelLocked
          ? `<button class="secondary" type="button" disabled>Lv.${minLevel}</button>`
          : owned
            ? `<button class="${active ? "secondary" : "primary"}" type="button" data-pet-equip-outfit="${escapeAttr(item.id)}">${active ? "卸下" : "穿戴"}</button>`
            : `<button class="primary" type="button" data-pet-buy-outfit="${escapeAttr(item.id)}" ${pet.coins >= price ? "" : "disabled"}>${price} 金币</button>`;
      }
      const unlockSource = typeof PetDressupMeta.unlockSourceText === "function"
        ? PetDressupMeta.unlockSourceText(kind, item, metaSources)
        : `解锁来源：${levelLocked ? `Lv.${minLevel}` : price ? `${price} 金币购买` : "成长奖励"}`;
      const unlockProgress = typeof PetDressupMeta.unlockProgressText === "function"
        ? PetDressupMeta.unlockProgressText(kind, item, pet, metaSources)
        : owned ? "已拥有" : levelLocked ? `还差 ${minLevel - Number(pet.level || 1)} 级` : price > Number(pet.coins || 0) ? `还差 ${price - Number(pet.coins || 0)} 金币` : "可解锁";
      return `<article class="pet-collection-card ${owned ? "owned" : ""} ${active ? "active" : ""} ${levelLocked ? "locked" : ""}">
        <div class="pet-shop-icon" aria-hidden="true">${item.icon || "✦"}</div>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <span>${escapeHTML(item.desc || "")}</span>
          <small>${levelLocked ? `Lv.${minLevel} 解锁` : owned ? "已拥有" : `${price} 金币`}</small>
          <em class="pet-collection-source">${escapeHTML(unlockSource)}</em>
          <em class="pet-collection-progress">${escapeHTML(unlockProgress)}</em>
        </div>
        ${action}
      </article>`;
    }
    function renderPetDressup(profile = activeProfile()) {
      if (!els.petDressupGrid) return;
      const pet = petState(profile);
      const currentTheme = PET_ROOM_THEME_MAP[pet.roomTheme]?.title || "阳光小窝";
      const currentOutfit = pet.outfit ? PET_OUTFIT_MAP[pet.outfit]?.title || "已穿戴" : "未穿戴";
      if (els.petDressupSummary) {
        els.petDressupSummary.textContent = `${currentTheme} · 家具 ${countTruthy(pet.ownedFurniture)} · 装扮 ${countTruthy(pet.outfits)} · ${currentOutfit}`;
      }
      renderPetDressupPreview(profile, pet);
      els.petDressupGrid.innerHTML = `
        <section class="pet-collection-section">
          <div class="pet-shop-tier-head"><h3>小窝主题</h3><span>主题随宠物等级开放，金币用于真正装进小窝。</span></div>
          <div class="pet-collection-grid">${PET_ROOM_THEMES.map((item) => collectionCard("theme", item, pet)).join("")}</div>
        </section>
        <section class="pet-collection-section">
          <div class="pet-shop-tier-head"><h3>小窝家具</h3><span>家具可以摆放或收起，成长礼物和剧情也会赠送稀有家具。</span></div>
          <div class="pet-collection-grid">${PET_FURNITURE.map((item) => collectionCard("furniture", item, pet)).join("")}</div>
        </section>
        <section class="pet-collection-section">
          <div class="pet-shop-tier-head"><h3>宠物装扮</h3><span>装扮会显示在宠物身上，稀有装扮优先来自成就和剧情。</span></div>
          <div class="pet-collection-grid">${PET_OUTFITS.map((item) => collectionCard("outfit", item, pet)).join("")}</div>
        </section>`;
    }
    function systemThemeProgressText(theme, pet) {
      if (systemThemeOwned(theme.id)) return "已拥有";
      const minLevel = Number(theme.unlockLevel || 1);
      const price = Math.max(0, Number(theme.price) || 0);
      if (Number(pet.level || 1) < minLevel) return `还差 ${minLevel - Number(pet.level || 1)} 级`;
      if (pet.coins < price) return `还差 ${price - pet.coins} 金币`;
      return "可解锁";
    }
    function systemThemeCard(theme, pet) {
      const owned = systemThemeOwned(theme.id);
      const active = state.theme === theme.id;
      const minLevel = Number(theme.unlockLevel || 1);
      const price = Math.max(0, Number(theme.price) || 0);
      const levelLocked = Number(pet.level || 1) < minLevel;
      const canBuy = !owned && !levelLocked && pet.coins >= price;
      const action = owned
        ? `<button class="${active ? "secondary" : "primary"}" type="button" data-use-system-theme="${escapeAttr(theme.id)}" ${active ? "disabled" : ""}>${active ? "使用中" : "使用"}</button>`
        : levelLocked
          ? `<button class="secondary" type="button" disabled>Lv.${minLevel}</button>`
          : `<button class="primary" type="button" data-buy-system-theme="${escapeAttr(theme.id)}" ${canBuy ? "" : "disabled"}>${price} 金币</button>`;
      return `<article class="pet-collection-card pet-theme-card ${owned ? "owned" : ""} ${active ? "active" : ""} ${!owned ? "locked" : ""}">
        <div class="pet-shop-icon" aria-hidden="true">${theme.icon || "✦"}</div>
        <div>
          <strong>${escapeHTML(theme.label)}</strong>
          <span>${escapeHTML(theme.desc || "")}</span>
          <small>${theme.initial ? "开局可用" : `Lv.${minLevel} · ${price} 金币`}</small>
          <em class="pet-collection-source">${theme.initial ? "基础主题" : "养成计划主题商店"}</em>
          <em class="pet-collection-progress">${escapeHTML(systemThemeProgressText(theme, pet))}</em>
        </div>
        ${action}
      </article>`;
    }
    function renderPetThemeShop(profile = activeProfile()) {
      if (!els.petThemeShopGrid) return;
      const pet = petState(profile);
      const themes = SYSTEM_THEME_IDS.map((id) => ({ id, ...THEME_REGISTRY[id] }));
      const ownedCount = themes.filter((theme) => systemThemeOwned(theme.id, profile)).length;
      const nextTheme = themes.find((theme) => !systemThemeOwned(theme.id, profile));
      if (els.petThemeShopSummary) els.petThemeShopSummary.textContent = `已拥有 ${ownedCount}/${themes.length}`;
      if (els.petThemeShopBoard) {
        els.petThemeShopBoard.innerHTML = nextTheme
          ? `<strong>下一个目标：${escapeHTML(nextTheme.label)}</strong><span>需要 Lv.${Number(nextTheme.unlockLevel || 1)}，${Math.max(0, Number(nextTheme.price) || 0)} 金币。当前 Lv.${Number(pet.level || 1)}，金币 ${Number(pet.coins || 0)}。</span>`
          : `<strong>主题全部收集完成</strong><span>可以在系统设置里随时切换已拥有主题。</span>`;
      }
      els.petThemeShopGrid.innerHTML = themes.map((theme) => systemThemeCard(theme, pet)).join("");
    }
    function shouldUsePetPanelModals() {
      return window.matchMedia("(max-width: 980px)").matches;
    }
    function movePetCard(card, slot, home) {
      if (!card || !slot || !home) return;
      const target = shouldUsePetPanelModals() ? slot : home;
      if (card.parentElement !== target) target.appendChild(card);
    }
    function movePetStageCard() {
      if (!els.petStageCard || !els.petStagePanelSlot) return;
      if (shouldUsePetPanelModals()) {
        if (els.petStageCard.parentElement !== els.petStagePanelSlot) els.petStagePanelSlot.appendChild(els.petStageCard);
        return;
      }
      const petRoomInfo = document.querySelector(".pet-room-info");
      const progress = document.querySelector(".pet-space-progress");
      if (!petRoomInfo || !progress) return;
      if (els.petStageCard.parentElement !== petRoomInfo || els.petStageCard.nextElementSibling !== progress) {
        if (typeof petRoomInfo.insertBefore === "function") petRoomInfo.insertBefore(els.petStageCard, progress);
        else if (els.petStageCard.parentElement !== petRoomInfo) petRoomInfo.appendChild(els.petStageCard);
      }
    }
    function movePetShowcaseCard() {
      if (!els.petShowcaseCard || !els.petShowcasePanelSlot) return;
      if (shouldUsePetPanelModals()) {
        if (els.petShowcaseCard.parentElement !== els.petShowcasePanelSlot) els.petShowcasePanelSlot.appendChild(els.petShowcaseCard);
        return;
      }
      const bars = els.petSpaceBars;
      const dashboard = document.querySelector(".pet-care-dashboard");
      if (!bars || !dashboard) return;
      if (els.petShowcaseCard.parentElement !== bars.parentElement || els.petShowcaseCard.nextElementSibling !== dashboard) {
        if (typeof bars.parentElement?.insertBefore === "function") bars.parentElement.insertBefore(els.petShowcaseCard, dashboard);
        else if (els.petShowcaseCard.parentElement !== bars.parentElement) bars.parentElement.appendChild(els.petShowcaseCard);
      }
    }
    function syncPetPanelLayout() {
      const dashboard = document.querySelector(".pet-care-dashboard");
      if (!dashboard) return;
      movePetCard(els.petWishCard, els.petWishPanelSlot, dashboard);
      const carePlanCard = els.petCareChecklist?.closest(".pet-care-plan-card");
      movePetCard(carePlanCard, els.petCarePlanPanelSlot, dashboard);
      movePetCard(els.petEventCard, els.petEventPanelSlot, dashboard);
      movePetStageCard();
      movePetShowcaseCard();
      movePetCard(els.petMemoryCard, els.petMemoryPanelSlot, dashboard);
      movePetCard(els.petLevelGiftCard, els.petLevelGiftPanelSlot, dashboard);
      movePetCard(els.petStoryCard, els.petStoryPanelSlot, dashboard);
      document.body.classList.toggle("pet-panel-compact", shouldUsePetPanelModals());
    }

    function renderPetRunawayNotice(pet, profile) {
      if (!els.petRunawayNotice) return;
      const name = petDisplayName(profile);
      if (pet.runaway?.status === "away") {
        const left = Math.max(0, 3 - daysBetween(pet.runaway.awayDate, todayKey()));
        els.petRunawayNotice.hidden = false;
        els.petRunawayNotice.className = "pet-runaway-notice away";
        els.petRunawayNotice.innerHTML = `
          <strong>${escapeHTML(name)}离家出走了</strong>
          <p>还有 ${left} 天找回期。3 天内完成一轮练习，就能把${escapeHTML(name)}找回来；回来后等级和亲密值会降低一点。</p>
          <button class="primary" type="button" data-pet-start-rescue>去完成一轮练习</button>`;
        return;
      }
      if (pet.runaway?.status === "lost") {
        els.petRunawayNotice.hidden = false;
        els.petRunawayNotice.className = "pet-runaway-notice lost";
        els.petRunawayNotice.innerHTML = `
          <strong>${escapeHTML(name)}已经走远了</strong>
          <p>找回期已经结束，只能重新领养。金币和背包会保留，宠物等级、经验和亲密值会重置。</p>
          <button class="danger" type="button" data-pet-readopt>重新领养</button>`;
        return;
      }
      if (pet.hunger < 20 || pet.clean < 20 || pet.mood < 20) {
        els.petRunawayNotice.hidden = false;
        els.petRunawayNotice.className = "pet-runaway-notice warn";
        els.petRunawayNotice.innerHTML = `<strong>${escapeHTML(name)}需要照顾</strong><p>心情、饥饿或清洁过低时，连续多天不练习会触发离家出走风险。</p>`;
        return;
      }
      els.petRunawayNotice.hidden = true;
      els.petRunawayNotice.innerHTML = "";
    }

    function movePetRoomCat(options = {}) {
      if (!els.petRoomCatBtn || !els.petRoomWalker) return;
      const scene = els.petRoomWalker.closest(".pet-room-scene");
      if (!scene) return;
      const sceneBox = scene.getBoundingClientRect();
      const catBox = els.petRoomCatBtn.getBoundingClientRect();
      if (!sceneBox.width || !sceneBox.height || !catBox.width || !catBox.height) return;
      const safe = Math.max(14, Math.min(sceneBox.width, sceneBox.height) * 0.045);
      const minLeft = safe + catBox.width / 2;
      const maxLeft = Math.max(minLeft, sceneBox.width - safe - catBox.width / 2);
      const minBottom = safe + 8;
      const maxBottom = Math.max(minBottom, Math.min(sceneBox.height * 0.56, sceneBox.height - safe - catBox.height - 8));
      const previousLeft = Number(scene.dataset.petWalkLeft || minLeft);
      const previousBottom = Number(scene.dataset.petWalkBottom || minBottom);
      const minStep = Math.min(sceneBox.width, sceneBox.height) * 0.18;
      let left = previousLeft;
      let bottom = previousBottom;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        left = rand(Math.round(minLeft), Math.round(maxLeft));
        bottom = rand(Math.round(minBottom), Math.round(maxBottom));
        if (options.instant || Math.hypot(left - previousLeft, bottom - previousBottom) >= minStep) break;
      }
      scene.dataset.petWalkLeft = String(left);
      scene.dataset.petWalkBottom = String(bottom);
      scene.style.setProperty("--pet-left", `${left}px`);
      scene.style.setProperty("--pet-bottom", `${bottom}px`);
      scene.style.setProperty("--pet-dir", left < previousLeft ? "-1" : "1");
      [els.petRoomWalker, els.petRoomCatBtn].filter(Boolean).forEach((node) => {
        if (options.instant) node.classList.add("no-transition");
        else node.classList.remove("no-transition");
      });
      if (!options.instant) {
        els.petRoomWalker.classList.add("is-walking");
        window.clearTimeout(state.petRoomWalkMotionTimer);
        state.petRoomWalkMotionTimer = window.setTimeout(() => {
          els.petRoomWalker?.classList.remove("is-walking");
        }, 1500);
      }
    }

    function startPetRoomWalk() {
      if (!els.petRoomCatBtn) return;
      if (state.petRoomWalkTimer) window.clearInterval(state.petRoomWalkTimer);
      state.petRoomWalkWarmupTimers.forEach((timer) => window.clearTimeout(timer));
      state.petRoomWalkWarmupTimers = [];
      movePetRoomCat({ instant: true });
      window.setTimeout(() => {
        els.petRoomWalker?.classList.remove("no-transition");
        els.petRoomCatBtn?.classList.remove("no-transition");
      }, 40);
      [520, 1550, 2900].forEach((delay) => {
        state.petRoomWalkWarmupTimers.push(window.setTimeout(() => {
          if (state.view === "petspace" && !document.hidden) movePetRoomCat();
        }, delay));
      });
      state.petRoomWalkTimer = window.setInterval(() => {
        if (state.view !== "petspace" || document.hidden) return;
        movePetRoomCat();
      }, isLowMotionMode() ? 5200 : 3600);
    }

    function stopPetRoomWalk() {
      if (state.petRoomWalkTimer) window.clearInterval(state.petRoomWalkTimer);
      if (state.petRoomWalkMotionTimer) window.clearTimeout(state.petRoomWalkMotionTimer);
      state.petRoomWalkWarmupTimers.forEach((timer) => window.clearTimeout(timer));
      state.petRoomWalkTimer = null;
      state.petRoomWalkWarmupTimers = [];
      state.petRoomWalkMotionTimer = null;
      els.petRoomWalker?.classList.remove("is-walking", "no-transition");
      els.petRoomCatBtn?.classList.remove("no-transition");
    }

    function renderPetSpace(profile = activeProfile()) {
      if (!els.petShopGrid || !els.petBagList) return;
      const pet = petState(profile);
      const name = petDisplayName(profile);
      const xpInLevel = pet.xp % PET_XP_PER_LEVEL;
      const stage = petStageCopy(petGrowthStage(pet), profile);
      if (els.petSpaceTitle) els.petSpaceTitle.textContent = `${name}小窝`;
      if (els.petSpaceLead) els.petSpaceLead.textContent = `${stage.name}：${stage.copy}`;
      if (els.petRoomCatBtn) els.petRoomCatBtn.setAttribute("aria-label", `摸摸${name}`);
      if (els.petSpaceCoins) els.petSpaceCoins.textContent = String(pet.coins);
      if (els.petRoomStage) els.petRoomStage.dataset.petState = pet.runaway?.status || "home";
      if (els.petRoomStage) {
        const quality = petLearningQuality(profile);
        const expression = petExpression(profile, pet, quality);
        const outfit = pet.outfit ? PET_OUTFIT_MAP[pet.outfit] : null;
        els.petRoomStage.dataset.roomTheme = pet.roomTheme || "sunny";
        els.petRoomStage.dataset.outfit = pet.outfit || "";
        els.petRoomStage.dataset.quality = quality.rate >= 90 && quality.recentCount >= 10 ? "excellent" : quality.rate >= 75 && quality.recentCount >= 6 ? "steady" : quality.rate < 60 && quality.recentCount >= 6 ? "slow" : "building";
        els.petRoomStage.dataset.expression = expression.key;
        els.petRoomStage.dataset.decorRug = String(Boolean(pet.equippedFurniture?.rug));
        els.petRoomStage.dataset.decorCurtain = String(Boolean(pet.equippedFurniture?.curtain));
        els.petRoomStage.dataset.decorLamp = String(Boolean(pet.equippedFurniture?.studyLamp || pet.equippedFurniture?.starLamp));
        els.petRoomStage.dataset.decorBadge = String(Boolean(pet.equippedFurniture?.guardianBadge));
        els.petRoomStage.dataset.decorDesk = String(Boolean(pet.equippedFurniture?.bookDesk));
        els.petRoomStage.dataset.decorBed = String(Boolean(pet.equippedFurniture?.royalBed));
        els.petRoomStage.dataset.decorBasket = String(Boolean(pet.equippedFurniture?.toyBasket));
        if (els.petRoomCatBtn) {
          els.petRoomCatBtn.dataset.outfitIcon = outfit?.icon || "";
          els.petRoomCatBtn.dataset.expressionIcon = expression.key === "calm" ? "" : expression.icon;
        }
      }
      if (els.petRoomName) els.petRoomName.textContent = pet.runaway?.status === "lost"
        ? "等待重新领养"
        : pet.runaway?.status === "away"
          ? `${name}暂时离家了`
          : `${name}今天在等你练习`;
      if (els.petRoomStatus) els.petRoomStatus.textContent = pet.runaway?.status === "home"
        ? `完成练习、复习错题和闯关会影响成长。当前状态：${petStatusLabel(pet)}。${petLearningQuality(profile).label}会影响经验、心情和亲密。${petCareHint(pet)}`
        : pet.runaway?.status === "away"
          ? `完成一轮练习可以找回${name}。`
          : "重新领养后可以继续从 1 级开始养成。";
      if (els.petStageCard) {
        const nextStage = PET_STAGES
          .slice()
          .sort((a, b) => Number(a.minLevel || 1) - Number(b.minLevel || 1))
          .find((item) => Number(item.minLevel || 1) > Number(pet.level || 1));
        els.petStageCard.innerHTML = `
          <strong>${escapeHTML(stage.name)}</strong>
          <span>${escapeHTML(stage.copy)}</span>
          <em>${nextStage ? `Lv.${nextStage.minLevel} 解锁${petCopy(nextStage.name, profile)}` : "成长阶段已全部解锁"}</em>
          ${petLearningQualityHTML(profile, pet)}`;
      }
      if (els.petSpaceLevel) els.petSpaceLevel.textContent = `${stage.name} · Lv.${pet.level}`;
      if (els.petSpaceXp) els.petSpaceXp.textContent = `${xpInLevel} / ${PET_XP_PER_LEVEL}`;
      if (els.petSpaceBars) {
        els.petSpaceBars.innerHTML = [
          petBarHTML("心情值", pet.mood),
          petBarHTML("饥饿值", pet.hunger),
          petBarHTML("清洁值", pet.clean),
          petBarHTML("亲密值", pet.bond)
        ].join("");
      }
      renderPetSkillStrip(pet);
      renderPetWishCard(profile, pet);
      renderPetLevelGiftCard(pet, profile);
      renderPetCarePlan(profile, pet);
      renderPetEventCard(pet, profile);
      renderPetStoryCard(pet, profile);
      renderPetMemoryCard(pet, profile);
      renderPetShowcase(profile, pet);
      renderPetDressup(profile);
      renderPetAchievements(profile);
      syncPetPanelLayout();
      renderPetRunawayNotice(pet, profile);
      const tierLabels = { basic: "基础照料", advanced: "进阶用品", rare: "长期目标" };
      const tierCopy = {
        basic: "20 题基础练习约能覆盖两天基础照料。",
        advanced: "完成额外练习后使用，主要补状态和亲密。",
        rare: "连续坚持几天后再购买，作为长期目标。"
      };
      renderPetShopAdvisor(profile, pet);
      const recommendedShopItem = petShopRecommendation(profile, pet)?.item?.id || "";
      els.petShopGrid.innerHTML = ["basic", "advanced", "rare"].map((tier) => {
        const items = PET_SHOP.filter((item) => (item.tier || "advanced") === tier);
        if (!items.length) return "";
        return `<section class="pet-shop-tier" aria-label="${tierLabels[tier]}">
          <div class="pet-shop-tier-head">
            <h3>${tierLabels[tier]}</h3>
            <span>${tierCopy[tier]}</span>
          </div>
          <div class="pet-shop-tier-grid">
            ${items.map((item) => {
              const afford = pet.coins >= item.price && pet.runaway?.status !== "lost";
              const careKind = petCareKindForItem(item);
              const left = careKind ? petCareLeft(pet, careKind) : Infinity;
              const recommended = item.id === recommendedShopItem;
              return `<article class="pet-shop-item ${recommended ? "recommended" : ""}" tabindex="0" role="button" data-pet-detail="${item.id}" aria-label="查看${escapeHTML(item.name)}作用">
                <div class="pet-shop-icon" aria-hidden="true">${item.icon}</div>
                <strong>${escapeHTML(item.name)}</strong>
                <small>${recommended ? "推荐 · " : ""}${tierLabels[tier]}${Number.isFinite(left) ? ` · 今日 ${left} 次` : ""}</small>
                <div class="pet-shop-buy">
                  <span>${item.price} 金币</span>
                  <button class="primary" type="button" data-pet-buy="${item.id}" ${afford ? "" : "disabled"}>购买</button>
                </div>
              </article>`;
            }).join("")}
          </div>
        </section>`;
      }).join("");
      const bagItems = PET_SHOP.filter((item) => (pet.inventory?.[item.id] || 0) > 0);
      els.petBagList.innerHTML = bagItems.length ? `<div class="pet-bag-grid">
        ${bagItems.map((item) => `<article class="pet-bag-item" tabindex="0" role="button" data-pet-detail="${item.id}" aria-label="查看${escapeHTML(item.name)}作用">
          <div class="pet-bag-icon" aria-hidden="true">${item.icon}</div>
          <strong>${escapeHTML(item.name)}</strong>
          <small>${escapeHTML(petCopy(tierLabels[item.tier || "advanced"] || "招财用品", profile))}</small>
          <div class="pet-shop-buy">
            <span>背包 ${pet.inventory[item.id]} 件</span>
            <button class="primary" type="button" data-pet-use="${item.id}" ${pet.runaway?.status === "lost" && !item.rename ? "disabled" : ""}>使用</button>
          </div>
        </article>`).join("")}
      </div>` : `<section class="pet-bag-empty" aria-live="polite">
        <div class="pet-bag-icon" aria-hidden="true">🎒</div>
        <strong>背包还是空的</strong>
        <span>完成练习获得金币后，可以先去宠物商店买普通猫粮、小毛巾或毛线球。</span>
      </section>`;
      hidePetItemDetails();
      syncCustomSelects(els.petspaceView || document);
    }

    function hidePetItemDetails() {
      [els.petShopDetail, els.petBagDetail].forEach((box) => {
        if (!box) return;
        box.hidden = true;
        box.innerHTML = "";
      });
      // 清除所有选中状态
      [els.petShopGrid, els.petBagList].forEach((container) => {
        if (!container) return;
        container.querySelectorAll("[data-pet-detail]").forEach((card) => {
          card.classList.remove("is-selected");
          card.setAttribute("aria-selected", "false");
        });
      });
    }

    function showPetItemDetail(itemId, kind = "shop") {
      const item = PET_ITEM_MAP[itemId];
      const box = kind === "bag" ? els.petBagDetail : els.petShopDetail;
      if (!item || !box) return;

      // 清除同类型物品的选中状态
      const container = kind === "bag" ? els.petBagList : els.petShopGrid;
      if (container) {
        container.querySelectorAll("[data-pet-detail]").forEach((card) => {
          card.classList.remove("is-selected");
          card.setAttribute("aria-selected", "false");
        });
        // 添加当前物品的选中状态
        const selectedCard = container.querySelector(`[data-pet-detail="${itemId}"]`);
        if (selectedCard) {
          selectedCard.classList.add("is-selected");
          selectedCard.setAttribute("aria-selected", "true");
        }
      }

      const actionCopy = item.rename
        ? "使用后可以修改一次宠物名字，全程序里的陪练、提示和空间名称会同步更新。"
        : `使用后：${item.desc}`;
      const careKind = petCareKindForItem(item);
      const pet = petState(activeProfile());
      const careCopy = careKind
        ? `今日可收益 ${petCareLeft(pet, careKind)} 次；超过后仍可使用，但不再额外增加当天互动收益。`
        : item.rename
          ? "改名卡不受每日收益次数限制。"
          : "这是长期目标物品，不占每日基础照料收益次数。";
      box.innerHTML = `
        <div class="pet-item-detail-card">
          <button class="pet-detail-close" type="button" data-close-pet-detail aria-label="关闭物品说明">×</button>
          <div class="pet-shop-icon" aria-hidden="true">${item.icon}</div>
          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <p>${escapeHTML(actionCopy)}</p>
            <span>${item.price} 金币 · ${escapeHTML(careCopy)}</span>
          </div>
        </div>`;
      box.hidden = false;
    }

    function petModalFor(kind) {
      if (kind === "bag") return els.petBagModal;
      if (kind === "tasks") return els.petTaskModal;
      if (kind === "care") return els.petCarePanelModal;
      if (kind === "growth") return els.petGrowthPanelModal;
      if (kind === "plan") return els.petPlanMenuModal;
      if (kind === "dressup") return els.petDressupModal;
      if (kind === "themes") return els.petThemeShopModal;
      if (kind === "achievements") return els.petAchievementModal;
      return els.petShopModal;
    }
    function resetPetModalScrollAnchor() {
      const view = els.views?.petspace;
      if (!view) return;
      try {
        view.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch (_) {
        view.scrollTop = 0;
        view.scrollLeft = 0;
      }
    }

    function openPetModal(kind, options = {}) {
      const target = petModalFor(kind);
      if (!target) return;
      resetPetModalScrollAnchor();
      renderPetSpace(activeProfile());
      if (kind === "tasks") renderPetTasks();
      if (kind === "dressup") renderPetDressup();
      if (kind === "themes") renderPetThemeShop();
      if (kind === "achievements") renderPetAchievements();
      if (options.returnToPlan && target !== els.petPlanMenuModal) target.dataset.returnPetPlan = "true";
      else delete target.dataset.returnPetPlan;
      target.hidden = false;
      target.classList.remove("is-closing");
      delete target.dataset.closeToken;
      document.body.classList.add("pet-modal-open");
      closePetModals({ except: target });
      const focusTarget = target.querySelector("[data-close-pet-modal], button, input");
      window.setTimeout(() => {
        try { focusTarget?.focus({ preventScroll: true }); } catch (_) {}
      }, 0);
    }

    function closePetModals(options = {}) {
      const except = options.except || null;
      const openModals = [els.petShopModal, els.petBagModal, els.petTaskModal, els.petCarePanelModal, els.petGrowthPanelModal, els.petPlanMenuModal, els.petDressupModal, els.petThemeShopModal, els.petAchievementModal].filter((modal) => modal && modal !== except && !modal.hidden);
      openModals.forEach((modal, index) => {
        closeWithMotion(modal, index === openModals.length - 1 ? () => {
          if (!except || except.hidden) document.body.classList.remove("pet-modal-open");
        } : null);
      });
      if (!openModals.length && (!except || except.hidden)) document.body.classList.remove("pet-modal-open");
    }

    function closePetModalWithReturn(modal) {
      if (!modal) {
        closePetModals();
        return;
      }
      if (modal.dataset.returnPetPlan === "true") {
        delete modal.dataset.returnPetPlan;
        closeWithMotion(modal, () => openPetModal("plan"));
        return;
      }
      closePetModals();
    }

    function knowledgeMapRows(profile = activeProfile(), grade = profile.grade || state.grade) {
      return availablePoints(grade).map((point) => {
        const mastery = masteryFor(profile, point.id);
        const attempts = Number(mastery.attempts) || 0;
        const rate = attempts ? Math.round((Number(mastery.correct) || 0) / attempts * 100) : 0;
        const wrong = (profile.wrongbook || []).filter((item) => item.question?.pointId === point.id).length;
        const due = dueWrongbook(profile, grade).filter((item) => item.question?.pointId === point.id).length;
        const level = attempts >= 8 && rate >= 85 && !wrong ? "mastered" : wrong || due || (attempts >= 3 && rate < 75) ? "weak" : attempts ? "learning" : "new";
        return { point, attempts, rate, wrong, due, level };
      });
    }
    function knowledgeMapLevelLabel(level) {
      return { mastered: "已掌握", learning: "学习中", weak: "需巩固", new: "待开启" }[level] || "学习中";
    }
    function renderLearningKnowledgeMap(profile = activeProfile()) {
      if (!els.learningKnowledgeMap) return;
      const grade = clamp(Number(profile.grade || state.grade) || 1, 1, 6);
      const rows = knowledgeMapRows(profile, grade);
      const mastered = rows.filter((row) => row.level === "mastered").length;
      const weak = rows.filter((row) => row.level === "weak").length;
      const next = rows.find((row) => row.due > 0) || rows.find((row) => row.level === "weak") || rows.find((row) => row.level === "new") || rows[0];
      els.learningKnowledgeMap.innerHTML = `
        <div class="learning-map-head">
          <div>
            <h3>知识地图</h3>
            <p class="muted">${escapeHTML(gradeNames[grade - 1] || `${grade}年级`)} · 已掌握 ${mastered}/${rows.length} · 需巩固 ${weak}</p>
          </div>
          ${next ? `<button class="primary compact-btn" type="button" data-map-practice="${escapeAttr(next.point.id)}">${next.due ? "先复习到期" : "开始下一点"}</button>` : ""}
        </div>
        <div class="learning-map-grid">
          ${rows.map((row) => `<button class="learning-map-node ${row.level}" type="button" data-map-practice="${escapeAttr(row.point.id)}">
            <strong>${escapeHTML(row.point.short || row.point.label)}</strong>
            <span>${escapeHTML(row.point.helper || row.point.label)}</span>
            <em>${knowledgeMapLevelLabel(row.level)} · ${row.attempts ? `${row.rate}%` : "未练"}${row.due ? ` · 到期 ${row.due}` : row.wrong ? ` · 错题 ${row.wrong}` : ""}</em>
          </button>`).join("")}
        </div>`;
      els.learningKnowledgeMap.querySelectorAll("[data-map-practice]").forEach((btn) => {
        btn.addEventListener("click", () => {
          closeHubModals();
          const pointId = btn.dataset.mapPractice;
          const dueIds = dueWrongbook(profile, grade).filter((item) => item.question?.pointId === pointId).map((item) => item.id);
          if (dueIds.length) startWrongbookPractice(dueIds.slice(0, 6));
          else startPointSet(pointId, 8, "knowledge-map");
        });
      });
    }
    function openLearningKnowledgeMap(profile = activeProfile()) {
      if (!els.learningKnowledgeMap || !els.views.knowledgeMap) return;
      closeHubModals();
      showView("knowledgeMap");
      renderLearningKnowledgeMap(profile);
      window.setTimeout(() => {
        try { els.views.knowledgeMap.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) {}
      }, 0);
    }

    function openHubModal(modal) {
      if (!modal) return;
      if (modal === els.systemModal) renderProfilePanel();
      modal.hidden = false;
      modal.classList.remove("is-closing");
      delete modal.dataset.closeToken;
      document.body.classList.add("hub-modal-open");
      closeHubModals({ except: modal });
      const focusTarget = modal.querySelector("[data-close-learning], [data-close-system], button, input, select");
      window.setTimeout(() => {
        try { focusTarget?.focus({ preventScroll: true }); } catch (_) {}
      }, 0);
    }

    function closeHubModals(options = {}) {
      const except = options.except || null;
      const openModals = [els.learningModal, els.systemModal].filter((modal) => modal && modal !== except && !modal.hidden);
      openModals.forEach((modal, index) => {
        closeWithMotion(modal, index === openModals.length - 1 ? () => {
          if (!except || except.hidden) document.body.classList.remove("hub-modal-open");
        } : null);
      });
      if (!openModals.length && (!except || except.hidden)) document.body.classList.remove("hub-modal-open");
    }

    function saveSystemProfile() {
      if (!els.systemProfileNameInput) return;
      const profile = activeProfile();
      const before = { name: profile.name };
      profile.name = (els.systemProfileNameInput.value || profile.name).trim().slice(0, 18);
      if (!saveProfiles()) {
        profile.name = before.name;
        saveProfiles();
        syncFromProfile();
        UI.notify("本地保存失败，学生资料没有修改。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      syncFromProfile();
      UI.notify("学生设置已保存。");
    }

    function showItemFloatText(itemId, text, color, action) {
      const selector = action === "buy" ? `[data-pet-buy="${itemId}"]` : `[data-pet-use="${itemId}"]`;
      const btn = document.querySelector(selector);
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const float = document.createElement("div");
      float.textContent = text;
      float.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        transform: translate(-50%, -50%);
        color: ${color};
        font-size: 18px;
        font-weight: 900;
        pointer-events: none;
        z-index: 10000;
        text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: floatUp 1.2s ease-out forwards;
      `;
      document.body.appendChild(float);
      setTimeout(() => float.remove(), 1200);
    }

    function buyPetItem(id) {
      const item = PET_ITEM_MAP[id];
      if (!item) return;
      const lockKey = `buy:${id}`;
      if (state.petItemActionLocks.has(lockKey)) return;
      const profile = activeProfile();
      const pet = petState(profile);
      if (pet.runaway?.status === "lost") {
        UI.notify("需要先重新领养宠物，才能继续购买用品。", { tone: "bad" });
        return;
      }
      if (pet.coins < item.price) {
        UI.notify(`金币不足，还差 ${item.price - pet.coins} 金币。`, { tone: "bad" });
        return;
      }
      state.petItemActionLocks.add(lockKey);
      document.querySelectorAll(`[data-pet-buy="${id}"]`).forEach((btn) => {
        btn.disabled = true;
      });
      const before = {
        coins: pet.coins,
        inventory: { ...(pet.inventory || {}) }
      };
      pet.coins -= item.price;
      pet.inventory[item.id] = (pet.inventory[item.id] || 0) + 1;
      if (!saveProfiles()) {
        pet.coins = before.coins;
        pet.inventory = before.inventory;
        state.petItemActionLocks.delete(lockKey);
        renderPetSpace(profile);
        UI.notify("本地保存失败，购买没有完成。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      state.petItemActionLocks.delete(lockKey);
      renderPetSpace(profile);
      showItemFloatText(id, "+1", "var(--success)", "buy");
      updatePetStatus(`${petDisplayName(profile)}收到了${item.name}，可以在背包里使用。`, "买到啦");
    }

    function applyPetItemEffects(pet, item) {
      Object.entries(item.effects || {}).forEach(([key, value]) => {
        pet[key] = clamp((Number(pet[key]) || 0) + Number(value || 0), 0, 100);
      });
      pet.lastCareDate = todayKey();
      pet.xp += item.rename ? 0 : 3;
      applyPetLevel(pet);
    }

    function usePetItem(id) {
      const item = PET_ITEM_MAP[id];
      if (!item) return;
      const lockKey = `use:${id}`;
      if (state.petItemActionLocks.has(lockKey)) return;
      const profile = activeProfile();
      const pet = petState(profile);
      if ((pet.inventory?.[id] || 0) <= 0) return;
      if (item.rename) {
        openPetModal("bag");
        if (els.petRenameCard) els.petRenameCard.hidden = false;
        if (els.petNameInput) {
          els.petNameInput.value = petDisplayName(profile);
          els.petNameInput.focus();
        }
        return;
      }
      if (pet.runaway?.status === "lost") {
        UI.notify("宠物已经丢失，需要重新领养后才能使用用品。", { tone: "bad" });
        return;
      }
      const careKind = petCareKindForItem(item);
      const before = {
        inventory: { ...(pet.inventory || {}) },
        careLog: { ...(pet.careLog || {}) },
        mood: pet.mood,
        hunger: pet.hunger,
        clean: pet.clean,
        bond: pet.bond,
        xp: pet.xp,
        level: pet.level,
        lastCareDate: pet.lastCareDate
      };
      if (careKind && !consumePetCare(pet, careKind)) {
        UI.notify("今天这类照料已经足够了，先把金币留到明天。", { tone: "warn" });
        updatePetStatus(`${petDisplayName(profile)}今天已经很满足了，继续练题比继续使用用品更有效。`, "已满足");
        return;
      }
      state.petItemActionLocks.add(lockKey);
      document.querySelectorAll(`[data-pet-use="${id}"]`).forEach((btn) => {
        btn.disabled = true;
      });
      pet.inventory[id] -= 1;
      applyPetItemEffects(pet, item);
      const wishDone = finishPetWishWithItem(id, pet);
      const careDone = updatePetCareMemory(profile, pet);
      if (!saveProfiles()) {
        pet.inventory = before.inventory;
        pet.careLog = before.careLog;
        pet.mood = before.mood;
        pet.hunger = before.hunger;
        pet.clean = before.clean;
        pet.bond = before.bond;
        pet.xp = before.xp;
        pet.level = before.level;
        pet.lastCareDate = before.lastCareDate;
        state.petItemActionLocks.delete(lockKey);
        renderPetSpace(profile);
        UI.notify("本地保存失败，用品没有使用。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      state.petItemActionLocks.delete(lockKey);
      showItemFloatText(id, "-1", "var(--danger)", "use");
      renderPetSpace(profile);
      closePetModals();
      updatePetStatus(`${petDisplayName(profile)}使用了${item.name}。${item.desc}。${wishDone ? "今日心愿也完成了。" : ""}${careDone ? "今日照料清单完成，亲密增加。" : ""}`, wishDone ? "心愿" : "舒服");
      setPetAction(careKind === "feed" ? "fed" : careKind === "clean" ? "clean" : careKind === "play" ? "play" : "comfy", "舒服");
    }

    function petCollectionDef(kind, id) {
      if (kind === "theme") return PET_ROOM_THEME_MAP[id];
      if (kind === "furniture") return PET_FURNITURE_MAP[id];
      if (kind === "outfit") return PET_OUTFIT_MAP[id];
      return null;
    }
    function petCollectionOwned(pet, kind, id) {
      if (kind === "theme") return Boolean(pet.unlockedThemes?.[id]);
      if (kind === "furniture") return Boolean(pet.ownedFurniture?.[id]);
      if (kind === "outfit") return Boolean(pet.outfits?.[id]);
      return false;
    }
    function buyPetCollection(kind, id) {
      const def = petCollectionDef(kind, id);
      if (!def) return;
      const profile = activeProfile();
      const pet = petState(profile);
      if (Number(pet.level || 1) < Number(def.minLevel || 1)) {
        UI.notify(`需要 ${petDisplayName(profile)} 达到 Lv.${Number(def.minLevel || 1)} 才能解锁。`, { tone: "warn" });
        return;
      }
      if (petCollectionOwned(pet, kind, id)) {
        equipPetCollection(kind, id);
        return;
      }
      const price = Math.max(0, Number(def.price) || 0);
      if (!price || pet.coins < price) {
        UI.notify(price ? `金币不足，还差 ${price - pet.coins} 金币。` : "这个收藏需要通过升级、剧情或成就获得。", { tone: "bad" });
        return;
      }
      const before = {
        coins: pet.coins,
        unlockedThemes: { ...(pet.unlockedThemes || {}) },
        ownedFurniture: { ...(pet.ownedFurniture || {}) },
        equippedFurniture: { ...(pet.equippedFurniture || {}) },
        outfits: { ...(pet.outfits || {}) },
        roomTheme: pet.roomTheme,
        outfit: pet.outfit
      };
      pet.coins -= price;
      if (kind === "theme") {
        grantPetTheme(pet, id);
        pet.roomTheme = id;
      } else if (kind === "furniture") {
        grantPetFurniture(pet, id, true);
      } else if (kind === "outfit") {
        grantPetOutfit(pet, id, true);
      }
      addPetMemory(pet, def.title, `装扮馆解锁：${def.title}`);
      if (!saveProfiles()) {
        pet.coins = before.coins;
        pet.unlockedThemes = before.unlockedThemes;
        pet.ownedFurniture = before.ownedFurniture;
        pet.equippedFurniture = before.equippedFurniture;
        pet.outfits = before.outfits;
        pet.roomTheme = before.roomTheme;
        pet.outfit = before.outfit;
        UI.notify("本地保存失败，装扮购买没有完成。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      renderPetSpace(profile);
      renderPetDressup(profile);
      updatePetStatus(`${petDisplayName(profile)}解锁了${def.title}。`, "新收藏");
    }
    function equipPetCollection(kind, id) {
      const def = petCollectionDef(kind, id);
      if (!def) return;
      const profile = activeProfile();
      const pet = petState(profile);
      if (!petCollectionOwned(pet, kind, id)) return;
      if (kind === "theme") {
        pet.roomTheme = id;
      } else if (kind === "furniture") {
        pet.equippedFurniture = isPlainObject(pet.equippedFurniture) ? pet.equippedFurniture : {};
        pet.equippedFurniture[id] = !pet.equippedFurniture[id];
      } else if (kind === "outfit") {
        pet.outfit = pet.outfit === id ? "" : id;
      }
      if (!saveProfiles()) return;
      renderPetSpace(profile);
      renderPetDressup(profile);
      updatePetStatus(`${petDisplayName(profile)}更新了${def.title}。`, kind === "outfit" ? "换装" : "装扮");
    }
    function buySystemTheme(id) {
      const themeId = safeThemeId(id);
      const def = THEME_REGISTRY[themeId];
      if (!def) return;
      const profile = activeProfile();
      const pet = petState(profile);
      if (systemThemeOwned(themeId, profile)) {
        useSystemTheme(themeId);
        return;
      }
      const minLevel = Number(def.unlockLevel || 1);
      const price = Math.max(0, Number(def.price) || 0);
      if (Number(pet.level || 1) < minLevel) {
        UI.notify(`需要招财达到 Lv.${minLevel} 才能解锁。`, { tone: "warn" });
        return;
      }
      if (pet.coins < price) {
        UI.notify(`金币不足，还差 ${price - pet.coins} 金币。`, { tone: "bad" });
        return;
      }
      const before = { coins: pet.coins, systemThemes: { ...(pet.systemThemes || {}) }, theme: state.theme };
      pet.coins -= price;
      grantSystemTheme(pet, themeId);
      if (!saveProfiles()) {
        pet.coins = before.coins;
        pet.systemThemes = before.systemThemes;
        state.theme = before.theme;
        UI.notify("本地保存失败，主题没有解锁。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      applyTheme(themeId);
      renderChrome();
      renderPetThemeShop(profile);
      updatePetStatus(`${petDisplayName(profile)}解锁了${def.label}主题。`, "新主题");
    }
    function useSystemTheme(id) {
      const themeId = safeThemeId(id);
      const profile = activeProfile();
      if (!systemThemeOwned(themeId, profile)) {
        UI.notify("这个主题还没有解锁。", { tone: "warn" });
        renderPetThemeShop(profile);
        return;
      }
      applyTheme(themeId);
      renderPetThemeShop(profile);
      UI.notify(`已切换到${THEME_REGISTRY[themeId].label}主题。`);
    }
    function claimPetAchievement(id) {
      const achievement = PET_ACHIEVEMENT_MAP[id];
      if (!achievement) return;
      const profile = activeProfile();
      const pet = petState(profile);
      const stateForAchievement = petAchievementState(profile, achievement);
      if (!stateForAchievement.complete || stateForAchievement.claimed) return;
      pet.achievements = isPlainObject(pet.achievements) ? pet.achievements : { claimed: {} };
      pet.achievements.claimed = isPlainObject(pet.achievements.claimed) ? pet.achievements.claimed : {};
      pet.achievements.claimed[id] = true;
      pet.coins += Math.max(0, Number(achievement.coins) || 0);
      applyPetCollectionReward(pet, achievement);
      pet.xp += 12;
      applyPetLevel(pet);
      addPetMemory(pet, achievement.title, `成就完成：${petCollectionRewardText(achievement)}`);
      if (!saveProfiles()) return;
      renderPetSpace(profile);
      renderPetAchievements(profile);
      renderPetDressup(profile);
      updatePetStatus(`${petDisplayName(profile)}完成成就：${achievement.title}。`, "成就");
      UI.notify(`成就奖励已领取：${achievement.title}`);
    }

    function claimPetLevelReward(level) {
      const profile = activeProfile();
      const pet = petState(profile);
      const reward = PET_LEVEL_REWARD_MAP[String(level)];
      if (!reward || Number(pet.level) < Number(reward.level) || pet.rewardsClaimed?.[reward.level]) return;
      pet.rewardsClaimed = isPlainObject(pet.rewardsClaimed) ? pet.rewardsClaimed : {};
      pet.rewardsClaimed[reward.level] = todayKey();
      pet.coins += Math.max(0, Number(reward.coins) || 0);
      applyPetCollectionReward(pet, reward);
      pet.memories = normalizePetMemories(pet.memories);
      pet.memories.levelGifts += 1;
      addPetMemory(pet, `Lv.${reward.level} ${reward.title}`, reward.unlock ? `解锁${reward.unlock}` : `成长礼物：金币 +${Number(reward.coins) || 0}`);
      if (!saveProfiles()) return;
      renderPetSpace(profile);
      updatePetStatus(`${petDisplayName(profile)}升到 Lv.${reward.level}，领取了${reward.title}。`, "升级礼物");
      UI.notify(`已领取 Lv.${reward.level} 成长礼物。`);
    }

    function claimPetStoryReward(id) {
      const profile = activeProfile();
      const pet = petState(profile);
      const chapter = PET_STORY_CHAPTERS.find((item) => item.id === id);
      const story = pet.story?.[id];
      if (!chapter || !story || !story.complete || story.claimed) return;
      story.claimed = true;
      pet.coins += Math.max(0, Number(chapter.rewardCoins) || 0);
      pet.bond = clamp(pet.bond + Number(chapter.rewardBond || 0), 0, 100);
      pet.xp += 18 + Number(chapter.rewardBond || 0);
      applyPetCollectionReward(pet, chapter);
      pet.memories = normalizePetMemories(pet.memories);
      pet.memories.stories += 1;
      addPetMemory(pet, chapter.title, `剧情完成，金币 +${Number(chapter.rewardCoins) || 0}，亲密 +${Number(chapter.rewardBond) || 0}`);
      applyPetLevel(pet);
      if (!saveProfiles()) return;
      renderPetSpace(profile);
      updatePetStatus(`${petDisplayName(profile)}完成了故事：${chapter.title}。`, "故事完成");
      UI.notify(`剧情奖励已领取：金币 +${Number(chapter.rewardCoins) || 0}`);
    }

    function resolvePetEventWithItem(itemId) {
      const profile = activeProfile();
      const pet = petState(profile);
      const event = currentPetEvent(pet);
      if (!event || pet.event?.resolved || event.itemId !== itemId || (Number(pet.inventory?.[itemId]) || 0) <= 0) return;
      pet.inventory[itemId] -= 1;
      resolvePetEvent(pet, event);
      if (!saveProfiles()) return;
      renderPetSpace(profile);
      updatePetStatus(`${petDisplayName(profile)}用${PET_ITEM_MAP[itemId]?.name || "用品"}解决了${event.title}。`, "事件完成");
    }

    function startPetEventPractice() {
      const pet = petState(activeProfile());
      const event = currentPetEvent(pet);
      const left = Math.max(3, (Number(event?.target) || 5) - (Number(pet.event?.progress) || 0));
      closePetModals();
      startPointSet(state.pointId === "auto" ? choosePoint().id : state.pointId, Math.min(12, left), "pet-event");
    }

    function startPetStoryPractice() {
      const pet = petState(activeProfile());
      const chapter = PET_STORY_CHAPTERS.find((item) => Number(pet.level) >= Number(item.minLevel || 1) && !pet.story?.[item.id]?.claimed && !pet.story?.[item.id]?.complete);
      const left = chapter ? Math.max(3, Number(chapter.target) - Number(pet.story?.[chapter.id]?.progress || 0)) : 5;
      closePetModals();
      startPointSet(state.pointId === "auto" ? choosePoint().id : state.pointId, Math.min(12, left), "pet-story");
    }

    function renamePet() {
      const profile = activeProfile();
      const pet = petState(profile);
      if ((pet.inventory?.renameCard || 0) <= 0) {
        UI.notify("背包里没有改名卡。", { tone: "bad" });
        return;
      }
      const nextName = normalizePetName(els.petNameInput?.value || "");
      if (!nextName) {
        UI.notify("名字支持 1-6 个中文字符，或 1-12 个英文/数字字符。", { tone: "bad" });
        return;
      }
      pet.inventory.renameCard -= 1;
      pet.name = nextName;
      if (!saveProfiles()) return;
      if (els.petRenameCard) els.petRenameCard.hidden = true;
      renderPetSpace(profile);
      updatePetStatus(`${nextName}记住了新名字，以后提示和陪练都会一起改。`, "新名字");
      UI.notify(`宠物已改名为${nextName}。`);
    }

    function readoptPet() {
      const profile = activeProfile();
      const oldPet = petState(profile);
      const keptCoins = oldPet.coins;
      const keptInventory = { ...oldPet.inventory };
      profile.rewards.pet = createDefaultPetState({ coins: keptCoins, inventory: keptInventory });
      saveProfiles();
      renderPetSpace(profile);
      updatePetStatus("新的招财已经回到宠物空间。先完成一轮练习，重新建立亲密感。", "重新开始");
    }

    function renderStats() {
      const current = state.currentSet[state.index];
      const total = state.currentSet.length || state.setSize;
      els.gradeStat.textContent = state.grade;
      els.progressStat.textContent = `${Math.min(state.index + 1, total)}/${total}`;
      updateTimerDisplay();
      els.correctStat.textContent = state.correct;
      els.streakStat.textContent = state.streak;
      els.gradeTag.textContent = gradeNames[state.grade - 1];
      els.pointTag.textContent = current ? pointLabel(current.pointId) : pointLabel(state.pointId);
      els.modeTag.textContent = state.mode === "wrongbook" ? "错题复练" : state.mode === "similar" ? "同类巩固" : state.mode === "weak" ? "薄弱点练习" : state.mode === "timed" ? "限时小测" : state.mode === "appendix" ? "附加题挑战" : state.mode === "hard-word" ? "应用题强化" : state.mode === "challenge" ? `闯关第 ${state.challengeMeta?.level || 1} 关` : "普通练习";
      els.progressDots.innerHTML = "";
      for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("span");
        dot.className = "dot";
        if (state.records[i]?.correct === true) dot.classList.add("correct");
        if (state.records[i]?.correct === false) dot.classList.add("wrong");
        els.progressDots.appendChild(dot);
      }
      renderMissionStrip();
      updatePetStatus();
    }
    function restoreCausePanelPlacement() {
      if (!els.causePanel || !els.answerControlSlot) return;
      els.answerModePanel?.classList.remove("wrong-inline-cause");
      els.causePanel.classList.remove("inline-cause");
      if (els.causePanel.parentElement !== els.answerControlSlot) {
        els.answerControlSlot.appendChild(els.causePanel);
      }
    }
    function renderCauseQuickTags(question) {
      if (!els.causeQuickTags || !els.causeSelect) return;
      const tags = ["不会做", "计算粗心", "读题理解", "概念单位"];
      const selected = els.causeSelect.value || "未标记";
      els.causeQuickTags.innerHTML = "";
      tags.forEach((cause) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `cause-chip${cause === selected ? " active" : ""}`;
        btn.dataset.causeChip = cause;
        btn.dataset.shortLabel = cause;
        btn.setAttribute("aria-label", `保存错因：${cause}`);
        btn.innerHTML = `<span class="cause-label-full">${escapeHTML(cause)}</span><span class="cause-label-mobile">${escapeHTML(cause)}</span>`;
        els.causeQuickTags.appendChild(btn);
      });
    }
    function showCausePanelForWrong(question) {
      restoreCausePanelPlacement();
      renderCauseQuickTags(question);
      els.causePanel.classList.add("active");
      const mode = question?.interaction?.mode || "input";
      const inlineMode = isMobilePracticeViewport() && (mode === "choice" || mode === "judge");
      if (!inlineMode) return;
      els.answerModePanel.hidden = false;
      els.answerModePanel.classList.add("wrong-inline-cause");
      els.causePanel.classList.add("inline-cause");
      els.answerModePanel.appendChild(els.causePanel);
    }
    function isWaitingForCauseSave() {
      return Boolean(state.checked && state.lastWrongRecordId && els.causePanel?.classList.contains("active"));
    }
    function renderAnswerModePanel(question) {
      if (!els.answerModePanel || !question) return;
      restoreCausePanelPlacement();
      const interaction = question.interaction || applyQuestionInteraction(question, state.answerMode);
      els.practiceCard.dataset.interaction = interaction.mode;
      els.answerModePanel.hidden = interaction.mode === "input";
      els.numberPad.hidden = interaction.mode === "choice" || interaction.mode === "judge";
      els.answerInput.readOnly = interaction.mode === "choice" || interaction.mode === "judge" || shouldUseCustomAnswerKeyboard(interaction.mode);
      els.answerInput.setAttribute("inputmode", shouldUseCustomAnswerKeyboard(interaction.mode) ? "none" : "decimal");
      els.answerInput.placeholder = interaction.mode === "choice"
        ? "请选择一个答案"
        : interaction.mode === "judge"
          ? "请选择对或错"
          : "在这里输入答案";
      if (interaction.mode === "input") {
        els.answerModePanel.innerHTML = "";
        return;
      }
      if (interaction.mode === "choice") {
        els.answerModePanel.innerHTML = `
          <strong>选择题</strong>
          <div class="answer-mode-copy">先自己心算，再点一个选项；系统会自动填入答案。</div>
          <div class="choice-options">
            ${(interaction.options || []).map((option) => `<button class="answer-option" type="button" data-choice-value="${escapeAttr(option.value)}" aria-pressed="false">${escapeHTML(option.label)}</button>`).join("")}
          </div>`;
        els.answerModePanel.querySelectorAll("[data-choice-value]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (state.checked) return;
            els.answerModePanel.querySelectorAll(".answer-option").forEach((item) => item.setAttribute("aria-pressed", "false"));
            btn.setAttribute("aria-pressed", "true");
            els.answerInput.value = btn.dataset.choiceValue;
            checkAnswer();
          });
        });
        return;
      }
      if (interaction.mode === "judge") {
        const label = answerValueLabel(interaction.statementValue);
        els.answerModePanel.innerHTML = `
          <strong>判断对错</strong>
          <div class="answer-mode-copy judge-statement">这题的答案是 <b>${escapeHTML(label)}</b>，判断对错。</div>
          <div class="judge-options">
            <button class="answer-option" type="button" data-judge="true" aria-pressed="false">✅ 正确</button>
            <button class="answer-option" type="button" data-judge="false" aria-pressed="false">❌ 错误</button>
          </div>`;
        els.answerModePanel.querySelectorAll("[data-judge]").forEach((btn) => {
          btn.addEventListener("click", () => {
            if (state.checked) return;
            els.answerModePanel.querySelectorAll(".answer-option").forEach((item) => item.setAttribute("aria-pressed", "false"));
            btn.setAttribute("aria-pressed", "true");
            const childSaysTrue = btn.dataset.judge === "true";
            els.answerInput.value = childSaysTrue === Boolean(interaction.truthful) ? String(question.answer) : String(interaction.statementValue);
            checkAnswer();
          });
        });
        return;
      }
      els.answerModePanel.innerHTML = `
        <strong>分步作答</strong>
        <div class="answer-mode-copy">${escapeHTML(petCopy("先自己列式和计算；需要时再让招财给一点思路。"))}</div>
        ${stepHintContent(question)}`;
    }
    function startNewSet(options = {}) {
      const profile = activeProfile();
      state.mode = "normal";
      state.challengeMeta = null;
      state.setSize = clamp(Number(els.setSizeInput.value) || 10, 3, 40);
      state.adaptive = els.adaptiveToggle.checked;
      syncAnswerModeAvailability();
      state.answerMode = normalizeAnswerModeForViewport(els.answerModeSelect.value || "auto");
      els.answerModeSelect.value = state.answerMode;
      syncCustomSelects();
      state.pointId = safePointId(els.pointSelect.value || "auto", state.grade);
      els.pointSelect.value = state.pointId;
      profile.grade = state.grade;
      profile.settings = {
        ...(profile.settings || {}),
        pointId: state.pointId,
        setSize: state.setSize,
        adaptive: state.adaptive,
        dailyGoal: clamp(Number(els.dailyGoalInput.value) || 20, 5, 200),
        answerSpace: els.answerSpaceSelect.value || "auto",
        answerMode: state.answerMode,
        printTemplate: els.printTemplateSelect?.value || profile.settings?.printTemplate || "practice",
        printOutputMode: els.printExportMode?.value || profile.settings?.printOutputMode || "answers"
      };
      saveProfiles();
      syncCustomSelects();
      const strictPoint = state.pointId !== "auto";
      const selectedPoint = strictPoint ? pointMap[state.pointId] : null;
      state.currentSet = selectedPoint
        ? buildQuestionSetForPoint(selectedPoint, state.setSize, state.answerMode)
        : Array.from({ length: state.setSize }, () => applyQuestionInteraction(makeQuestion(choosePoint()), state.answerMode));
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      resetRoundRuntime();
      renderPracticeQuestion();
      if (options.focus) {
        enterPracticeFocus();
        startRoundTimer();
      }
    }
    function startPointSet(pointId, count = 3, mode = "similar") {
      const point = pointMap[pointId] || choosePoint();
      state.mode = mode;
      state.challengeMeta = null;
      state.pointId = point.id;
      state.currentSet = buildQuestionSetForPoint(point, count, mode === "hard-word" ? "step" : state.answerMode);
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      showView("practice");
      resetRoundRuntime();
      renderPracticeQuestion();
      enterPracticeFocus();
      startRoundTimer();
    }
    function currentGradeWrongbook(profile = activeProfile(), grade = Number(profile.grade || state.grade)) {
      grade = Number(grade || profile.grade || state.grade);
      const today = todayKey();
      return profile.wrongbook
        .filter((item) => Number(item.question.grade || grade) === grade)
        .sort((a, b) => String(a.dueDate || today).localeCompare(String(b.dueDate || today)) || (a.correctStreak || 0) - (b.correctStreak || 0) || (b.wrongCount || 0) - (a.wrongCount || 0));
    }
    function startWrongbookPractice(ids = currentGradeWrongbook().map((item) => item.id)) {
      const profile = activeProfile();
      const queue = ids.map((id) => profile.wrongbook.find((item) => item.id === id)).filter(Boolean);
      if (!queue.length) return;
      state.mode = "wrongbook";
      state.challengeMeta = null;
      state.currentSet = queue.map((item) => applyQuestionInteraction({ ...item.question, wrongId: item.id }, state.answerMode));
      state.grade = state.currentSet[0].grade || profile.grade;
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      showView("practice");
      resetRoundRuntime();
      renderPracticeQuestion();
      enterPracticeFocus();
      startRoundTimer();
    }
    function startDueReviewPractice() {
      const due = dueWrongbook(activeProfile()).slice(0, Math.max(1, Math.min(8, state.setSize || 8)));
      if (due.length) {
        startWrongbookPractice(due.map((item) => item.id));
        return;
      }
      startWrongbookPractice();
    }
    function challengeDraftPayload() {
      if (state.mode !== "challenge" || !state.challengeMeta || state.setFinished) return null;
      return {
        date: todayKey(),
        grade: state.challengeMeta.grade,
        level: state.challengeMeta.level,
        count: state.currentSet.length,
        passRate: state.challengeMeta.passRate,
        index: state.index,
        checked: state.checked,
        correct: state.correct,
        streak: state.streak,
        roundCoins: state.roundCoins,
        elapsedMs: currentRoundElapsedMs(),
        lastWrongRecordId: state.lastWrongRecordId,
        currentSet: state.currentSet,
        records: state.records
      };
    }
    function saveChallengeDraft(options = {}) {
      if (state.mode !== "challenge" || !state.challengeMeta) return true;
      const profile = activeProfile();
      const progress = challengeProgress(profile, state.challengeMeta.grade);
      progress.draft = state.setFinished ? null : challengeDraftPayload();
      if (options.render !== false) renderChallengePanel(profile);
      return options.persist ? saveProfiles() : true;
    }
    function clearChallengeDraft(profile = activeProfile(), grade = state.challengeMeta?.grade || state.grade) {
      const progress = challengeProgress(profile, grade);
      progress.draft = null;
    }
    function resetCurrentSet() {
      if (state.mode !== "challenge" || !state.challengeMeta) {
        startNewSet({ focus: true });
        return;
      }
      const profile = activeProfile();
      const grade = state.challengeMeta.grade || state.grade;
      clearChallengeDraft(profile, grade);
      stopRoundTimer();
      state.setFinished = true;
      if (!saveProfiles()) {
        UI.notify("本地保存失败，闯关保存进度没有清掉。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      UI.notify("本轮闯关已重置，已清除刚才保存的进度。", { duration: 2600 });
      startChallengeSet();
    }
    function restoreCheckedChallengeQuestion(record) {
      if (!record) return;
      state.checked = true;
      els.answerInput.disabled = true;
      els.checkBtn.disabled = true;
      els.answerModePanel.querySelectorAll(".answer-option").forEach((btn) => {
        btn.disabled = true;
      });
      setFeedback(record.correct ? "good" : "bad", record.correct
        ? '已恢复到上次答对的位置，点"下一题"继续闯关。'
        : '已恢复到上次答错的位置，保存错因或点"下一题"继续闯关。', record.correct ? "😄" : "😯");
      updatePetStatus(record.correct ? "招财：这关我帮你记着了，继续下一题就行。" : "招财：这题也保存着，先把错因补上再继续。", "已保存");
      if (!record.correct) {
        state.lastWrongRecordId = record.id;
        showCausePanelForWrong(record.question);
      }
    }
    function resumeChallengeSet(draft) {
      state.grade = draft.grade;
      state.mode = "challenge";
      state.challengeMeta = { grade: draft.grade, level: draft.level, count: draft.count, passRate: draft.passRate };
      state.currentSet = draft.currentSet;
      state.index = draft.index;
      state.checked = false;
      state.correct = draft.correct;
      state.streak = draft.streak;
      state.records = draft.records;
      state.roundCoins = draft.roundCoins;
      state.lastWrongRecordId = draft.lastWrongRecordId;
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      showView("practice");
      resetRoundRuntime();
      renderPracticeQuestion();
      if (draft.checked && draft.records[draft.index]) restoreCheckedChallengeQuestion(draft.records[draft.index]);
      enterPracticeFocus();
      startRoundTimer(draft.elapsedMs);
      UI.notify(`继续第 ${draft.level} 关：已保存到第 ${draft.index + 1}/${draft.count} 题。`, { duration: 3200 });
    }
    function startChallengeSet() {
      const profile = activeProfile();
      const progress = challengeProgress(profile, profile.grade || state.grade);
      const grade = clamp(Number(profile.grade || state.grade) || 1, 1, 6);
      if (progress.draft) {
        resumeChallengeSet(progress.draft);
        return;
      }
      const level = progress.level || 1;
      const count = clamp(10 + Math.floor((level - 1) / 2), 10, 14);
      const pointsForGrade = availablePoints(grade);
      const weak = weakestPoints(4).filter((point) => point.grade === grade);
      const challengePool = [...weak, ...pointsForGrade].filter((point, index, list) => list.findIndex((item) => item.id === point.id) === index);
      state.grade = grade;
      state.mode = "challenge";
      state.challengeMeta = { grade, level, count, passRate: 80 };
      state.currentSet = Array.from({ length: count }, (_, index) => {
        const point = challengePool[index % challengePool.length] || chooseAutoPoint(pointsForGrade, false);
        const mode = index % 5 === 4 ? "judge" : index % 3 === 2 ? "choice" : state.answerMode;
        return makeStrictQuestionForPoint(point, normalizeAnswerModeForViewport(mode));
      });
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      showView("practice");
      resetRoundRuntime();
      renderPracticeQuestion();
      enterPracticeFocus();
      startRoundTimer();
      saveChallengeDraft({ persist: true });
      UI.notify(`开始第 ${level} 关：完成 ${count} 题，正确率 80% 以上过关。`, { duration: 3200 });
    }
    function startTimedQuizSet() {
      const profile = activeProfile();
      const grade = clamp(Number(profile.grade || state.grade) || 1, 1, 6);
      const pointsForGrade = availablePoints(grade);
      const weak = weakestPoints(4).filter((point) => point.grade === grade);
      const pool = [...weak, ...pointsForGrade].filter((point, index, list) => list.findIndex((item) => item.id === point.id) === index);
      state.grade = grade;
      state.mode = "timed";
      state.challengeMeta = null;
      state.currentSet = Array.from({ length: 10 }, (_, index) => {
        const point = pool[index % pool.length] || chooseAutoPoint(pointsForGrade, false);
        const mode = index % 4 === 1 ? "choice" : index % 4 === 3 ? "judge" : "input";
        return makeStrictQuestionForPoint(point, normalizeAnswerModeForViewport(mode));
      });
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      delete state._lastFinishResult;
      els.summaryPanel.hidden = true;
      els.challengeResultOverlay.hidden = true;
      els.mobileChallengeResult.hidden = true;
      els.reviewPanel.hidden = true;
      showView("practice");
      resetRoundRuntime();
      renderPracticeQuestion();
      enterPracticeFocus();
      startRoundTimer();
      startTimedQuizTimer(5 * 60 * 1000);
      UI.notify("限时小测开始：10 题，5 分钟内完成。", { duration: 3200 });
    }
    function renderPracticeQuestion() {
      const current = state.currentSet[state.index];
      if (!current) {
        finishSet();
        return;
      }
      state.grade = current.grade || state.grade;
      state.checked = false;
      clearAutoNext();
      closePetHintPopover();
      els.practiceCard.removeAttribute("data-mood");
      els.practiceCard.classList.remove("result-animate", "question-enter");
      void els.practiceCard.offsetWidth;
      els.practiceCard.classList.add("question-enter");
      window.setTimeout(() => els.practiceCard.classList.remove("question-enter"), 360);
      renderQuestionTitle(current);
      els.answerInput.value = "";
      els.answerInput.disabled = false;
      els.answerInput.readOnly = false;
      els.checkBtn.disabled = false;
      els.nextBtn.textContent = state.index === state.currentSet.length - 1 ? "🏁 查看结果" : "➡️ 下一题";
      els.similarBtn.disabled = false;
      if (els.showAnswerBtn) els.showAnswerBtn.disabled = true;
      setFeedback("", "", "");
      restoreCausePanelPlacement();
      els.causePanel.classList.remove("active");
      els.causeSelect.value = "未标记";
      renderCauseQuickTags(current);
      els.saveCauseBtn.textContent = "直接下一题";
      els.saveCauseBtn.disabled = false;
      state.stepHintOpen = false;
      const petPrompt = current.word ? '我陪你先读题：找"已知什么、要求什么"，再决定用加减乘除。' : '我陪你先看运算符号，再按正确顺序计算。';
      els.companionTalk.textContent = petPrompt;
      els.methodHint.textContent = petCopy('提示默认隐藏。需要帮助时，点"让招财提示"。');
      renderAnswerModePanel(current);
      const interactionMode = current.interaction?.mode || "input";
      setFeedback("", interactionMode === "choice"
        ? "点选一个答案后，系统会马上检查。"
        : interactionMode === "judge"
          ? "判断这句话正确或错误，点一下就会检查。"
          : current.answerLabel
            ? "这题可能有余数或分数，输入主要数值即可，讲解里会显示完整答案。"
            : '输入答案后点"检查答案"，按回车也可以提交。', "🤔");
      const appendixPoint = appendixPointForGrade(state.grade);
      els.appendixPreview.textContent = `${gradeNames[state.grade - 1]}附加题：${appendixPoint.helper}。答题前先想模型，再列式。`;
      renderStats();
      updatePetStatus(petPrompt, "陪你");
      window.setTimeout(() => {
        const compactLayout = window.matchMedia("(max-width: 1180px)").matches;
        if ((interactionMode === "input" || interactionMode === "step") && !compactLayout) {
          els.answerInput.focus({ preventScroll: true });
        }
      }, 30);
    }
    function parseAnswer() {
      const question = state.currentSet[state.index];
      const raw = els.answerInput.value.trim().replace("，", ".").replace("。", ".");
      const mode = question?.interaction?.mode || "input";
      if (!raw) {
        if (mode === "choice") return { valid: false, message: "先选一个答案，再让招财检查。" };
        if (mode === "judge") return { valid: false, message: "先判断正确或错误，再让招财检查。" };
        return { valid: false, message: "还没有填写答案。先写一个结果，再让招财检查。" };
      }
      if (answerLabelMatches(raw, question)) return { valid: true, value: Number(question.answer), raw };
      const value = parseNumericAnswer(raw);
      if (!Number.isFinite(value)) {
        return {
          valid: false,
          message: "答案格式不太对。可以填整数/小数、3/4、75%、8:05，余数题可填 3余2 或只填商。"
        };
      }
      return { valid: true, value, raw };
    }
    function updateMastery(pointId, correct) {
      const m = masteryFor(activeProfile(), pointId);
      m.attempts += 1;
      if (correct) {
        m.correct += 1;
        m.streak += 1;
        if (m.streak >= 3) {
          m.level = clamp(m.level + 1, 1, 5);
          m.streak = 0;
        }
      } else {
        m.streak = 0;
        m.level = clamp(m.level - 1, 1, 5);
      }
    }
    function signature(question) {
      return `${question.pointId}|${question.text}|${formatAnswer(question.answer, question.answerLabel)}`;
    }
    const REVIEW_STAGE_OFFSETS = [0, 1, 3, 7];
    function nextReviewDueDate(stage) {
      const offset = REVIEW_STAGE_OFFSETS[clamp(Number(stage) || 0, 0, REVIEW_STAGE_OFFSETS.length - 1)] ?? 7;
      return addDaysToKey(todayKey(), offset);
    }
    function dueWrongbook(profile = activeProfile(), grade = Number(profile.grade || state.grade)) {
      const today = todayKey();
      return currentGradeWrongbook(profile, grade)
        .filter((item) => String(item.dueDate || today) <= today)
        .sort((a, b) => String(a.dueDate || today).localeCompare(String(b.dueDate || today)) || (a.correctStreak || 0) - (b.correctStreak || 0) || (b.wrongCount || 0) - (a.wrongCount || 0));
    }
    function reviewDateLabel(item) {
      const due = String(item?.dueDate || todayKey());
      if (due <= todayKey()) return "今日待复习";
      if (due === todayKey(1)) return "明天复习";
      return `${due.slice(5).replace("-", "/")} 复习`;
    }
    function upsertWrong(question, cause = "未标记") {
      const profile = activeProfile();
      const sig = signature(question);
      const found = profile.wrongbook.find((item) => item.signature === sig);
      if (found) {
        found.wrongCount += 1;
        found.correctStreak = 0;
        found.reviewStage = 0;
        found.dueDate = todayKey();
        found.lastReviewedAt = Date.now();
        found.lastResult = "wrong";
        found.cause = cause || found.cause || "未标记";
        found.updatedAt = Date.now();
        return found.id;
      }
      const item = {
        id: uid("wrong"),
        signature: sig,
        question: { ...question },
        cause: cause || "未标记",
        wrongCount: 1,
        correctStreak: 0,
        reviewStage: 0,
        dueDate: todayKey(),
        lastReviewedAt: Date.now(),
        lastResult: "wrong",
        updatedAt: Date.now()
      };
      profile.wrongbook.unshift(item);
      profile.wrongbook = profile.wrongbook.slice(0, 300);
      return item.id;
    }
    function markWrongAsMastered(profile, item) {
      if (!profile || !item) return;
      const mastered = {
        id: uid("mastered"),
        signature: item.signature,
        question: { ...item.question },
        cause: item.cause || "未标记",
        wrongCount: Number(item.wrongCount || 1),
        masteredAt: Date.now(),
        reviewCount: Number(item.correctStreak || 3)
      };
      profile.masteredWrong = [mastered, ...(profile.masteredWrong || []).filter((entry) => entry.signature !== item.signature)].slice(0, 500);
    }
    function updateWrongbookAttempt(id, correct) {
      const profile = activeProfile();
      const item = profile.wrongbook.find((entry) => entry.id === id);
      if (!item) return;
      if (correct) {
        item.correctStreak += 1;
        item.reviewStage = clamp((Number(item.reviewStage) || 0) + 1, 0, 4);
        item.dueDate = nextReviewDueDate(item.reviewStage);
        item.lastReviewedAt = Date.now();
        item.lastResult = "correct";
        item.updatedAt = Date.now();
        const pet = petState(profile);
        const hasWrongbookBuddy = petUnlockedSkillIds(pet).includes("wrongbookBuddy");
        pet.bond = clamp(pet.bond + 1, 0, 100);
        if (hasWrongbookBuddy) pet.bond = clamp(pet.bond + 1, 0, 100);
        pet.mood = clamp(pet.mood + 1, 0, 100);
        if (item.correctStreak >= 3) {
          markWrongAsMastered(profile, item);
          profile.wrongbook = profile.wrongbook.filter((entry) => entry.id !== id);
          profile.rewards.clearedWrong = (profile.rewards.clearedWrong || 0) + 1;
          awardCoins(8, "掌握错题");
          pet.bond = clamp(pet.bond + 3, 0, 100);
          els.companionTalk.textContent = petCopy('这道错题已经连续做对 3 次，移入"已掌握错题"记录了。招财额外奖励 8 金币。');
          showRewardRibbon({ title: "错题掌握", copy: "连续做对 3 次，招财把它收进已掌握记录。", coins: 8 });
        }
      } else {
        item.correctStreak = 0;
        item.reviewStage = 0;
        item.dueDate = todayKey();
        item.lastReviewedAt = Date.now();
        item.wrongCount += 1;
        item.lastResult = "wrong";
        item.updatedAt = Date.now();
      }
    }
    function settleChallengeResult(total, correct, rate) {
      if (state.mode !== "challenge" || !state.challengeMeta) return null;
      const profile = activeProfile();
      const progress = challengeProgress(profile, state.challengeMeta.grade);
      const passed = rate >= state.challengeMeta.passRate;
      progress.lastRate = rate;
      progress.bestRate = Math.max(Number(progress.bestRate) || 0, rate);
      progress.lastPlayedAt = todayKey();
      progress.todayDate = todayKey();
      progress.todayPlays = (Number(progress.todayPlays) || 0) + 1;
      progress.todayBestLevel = Math.max(Number(progress.todayBestLevel) || 0, state.challengeMeta.level);
      if (passed) {
        progress.passed = Math.max(Number(progress.passed) || 0, state.challengeMeta.level);
        progress.level = clamp((Number(progress.level) || 1) + 1, 1, 30);
        progress.weekPassed = (Number(progress.weekPassed) || 0) + 1;
      }
      progress.draft = null;
      return {
        passed,
        level: state.challengeMeta.level,
        nextLevel: progress.level,
        passRate: state.challengeMeta.passRate,
        copy: passed
          ? `第 ${state.challengeMeta.level} 关通过，下一次进入第 ${progress.level} 关。`
          : `第 ${state.challengeMeta.level} 关还差一点，正确率达到 ${state.challengeMeta.passRate}% 就能过关。`
      };
    }
    function addHistory(entry) {
      const profile = activeProfile();
      profile.history.unshift(entry);
      profile.history = profile.history.slice(0, 2500);
      advancePetProgressFromQuestion(profile, Boolean(entry.correct), entry);
      renderDailyGoal();
    }
    function checkAnswer() {
      if (state.checked) return;
      const current = state.currentSet[state.index];
      const parsed = parseAnswer();
      if (!parsed.valid) {
        setFeedback("bad", parsed.message, "😯");
        updatePetStatus("招财先等你把答案写上。写完以后，我再帮你检查。", "等你");
        triggerAnswerAnimation("wrong");
        playSound("wrong");
        return;
      }
      const expected = Number(current.answer);
      const correct = answerMatches(current, parsed);
      state.checked = true;
      const coinGain = awardQuestionReward(correct, current);
      if ((current.interaction?.mode || "input") === "step" && state.stepHintOpen) {
        renderAnswerModePanel(current);
      }
      const record = {
        id: uid("record"),
        date: todayKey(),
        time: Date.now(),
        question: current,
        answer: parsed.value,
        correct,
        cause: "未标记"
      };
      if (correct) {
        state.correct += 1;
        state.streak += 1;
        const pet = petState(activeProfile());
        const skillCoins = petUnlockedSkillIds(pet).includes("streakSpark") && state.streak > 0 && state.streak % 5 === 0
          ? awardCoins(1, "连对鼓励")
          : 0;
        const milestone = streakMilestone(state.streak);
        const coinCopy = `金币 +${coinGain + skillCoins}${skillCoins ? "（含连对鼓励 +1）" : ""}`;
        setFeedback("good", milestone ? `${milestone.title}！正确答案是 ${formatAnswer(expected, current.answerLabel)}。${coinCopy}。` : `招财：答对啦。正确答案是 ${formatAnswer(expected, current.answerLabel)}。${coinCopy}。`, state.streak >= 3 ? "🥳" : "😄");
        updatePetStatus(milestone ? `招财：${milestone.copy}` : state.streak >= 3 ? "招财：连续答对很稳定，2 秒后我带你去下一题。" : "招财：这题很稳，2 秒后自动进入下一题。", milestone ? "奖励" : "答对");
        triggerAnswerAnimation("correct");
        if (milestone) awardStreakMilestone(milestone);
        playSound("correct");
      } else {
        state.streak = 0;
        const firstHint = current.word
          ? `先看"已知什么、要求什么"，再检查数量关系：${methodHintFor(current)}`
          : methodHintFor(current);
        setFeedback("bad", `招财：这题先不急着看答案。第一步提示：${firstHint} 点"查看答案"可以看完整答案和步骤。`, "😢");
        updatePetStatus("招财：我先给你读题和方法提示，这题也会进入错题复习日程。", "看方法");
        triggerAnswerAnimation("wrong");
        playSound("wrong");
        els.numberPad.hidden = shouldHideAnswerControlsForWrong(current);
        showCausePanelForWrong(current);
        if (els.showAnswerBtn) els.showAnswerBtn.disabled = false;
      }
      updateMastery(current.pointId, correct);
      if (state.mode === "wrongbook") updateWrongbookAttempt(current.wrongId, correct);
      else if (!correct) upsertWrong(current);
      addHistory({ date: record.date, time: record.time, pointId: current.pointId, grade: current.grade, correct, cause: record.cause, text: current.text, mode: state.mode || "practice" });
      state.records[state.index] = record;
      state.lastWrongRecordId = correct ? "" : record.id;
      els.answerInput.disabled = true;
      els.checkBtn.disabled = true;
      els.answerModePanel.querySelectorAll(".answer-option").forEach((btn) => {
        btn.disabled = true;
      });
      saveChallengeDraft({ persist: false, render: false });
      saveProfiles();
      renderStats();
      if (correct) {
        state.autoNextId = window.setTimeout(() => {
          state.autoNextId = null;
          nextQuestion();
        }, 2000);
      }
    }
    function saveCurrentCause() {
      if (!state.lastWrongRecordId) return;
      clearAutoNext();
      const cause = normalizeCause(els.causeSelect.value || "未标记");
      const record = state.records.find((item) => item?.id === state.lastWrongRecordId);
      if (!record) return;
      const beforeRecordCause = record.cause;
      record.cause = cause;
      const profile = activeProfile();
      const historyItem = profile.history.find((item) => item.time === record.time);
      const beforeHistoryCause = historyItem?.cause;
      if (historyItem) historyItem.cause = cause;
      const sig = signature(record.question);
      const wrong = profile.wrongbook.find((item) => item.signature === sig);
      const beforeWrongCause = wrong?.cause;
      if (wrong) wrong.cause = cause;
      if (!saveProfiles()) {
        record.cause = beforeRecordCause;
        if (historyItem) historyItem.cause = beforeHistoryCause;
        if (wrong) wrong.cause = beforeWrongCause;
        saveProfiles();
        setFeedback("bad", "本地保存失败，错因没有保存。请先导出备份。", "⚠️");
        updatePetStatus("招财：这次没有写进本地存储，先别刷新页面，可以先导出备份。", "保存失败");
        return;
      }
      setFeedback("saved", `已保存错因：${cause}。做完本轮后可以在错题回顾里看讲解。`, "📝");
      updatePetStatus(`招财：我记住了，这题的错因是"${cause}"。回顾时我们就从这里重新拆。`, "记住了");
      els.saveCauseBtn.textContent = "✅ 已保存";
      els.saveCauseBtn.disabled = true;
      const current = state.currentSet[state.index];
      els.numberPad.hidden = shouldHideAnswerControlsForWrong(current);
      if (!els.causePanel.classList.contains("inline-cause")) {
        els.answerModePanel.hidden = true;
        els.causePanel.classList.remove("active");
      }
      state.lastWrongRecordId = "";
      saveChallengeDraft({ persist: true });
      scheduleNextQuestion(900);
    }
    function nextQuestion() {
      clearAutoNext();
      closePetHintPopover();
      if (!state.checked && els.answerInput.value.trim()) {
        checkAnswer();
        if (!state.checked) return;
      }
      if (state.index >= state.currentSet.length - 1) {
        finishSet();
        return;
      }
      state.index += 1;
      renderPracticeQuestion();
      saveChallengeDraft({ persist: true });
    }
    function showAnswerPopover() {
      const current = state.currentSet[state.index];
      if (!current || !state.checked) return;
      const answerText = `正确答案：${formatAnswer(current.answer, current.answerLabel)}`;
      const steps = (current.steps && current.steps.length ? current.steps : [current.explanation || methodHintFor(current)]).slice(0, 4);
      const pitfall = (current.commonPitfalls || [])[0] || "容易跳步或看错题意";
      const detailHTML = `
        <div class="answer-detail-popover">
          <strong>${escapeHTML(answerText)}</strong>
          <p>${escapeHTML(methodHintFor(current))}</p>
          <ol>${steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol>
          <span>易错点：${escapeHTML(pitfall)}</span>
        </div>`;
      if (els.methodHint) {
        els.methodHint.textContent = `${answerText}。${methodHintFor(current)}`;
      }
      if (shouldUseMobilePetHintPopover()) {
        openPetHintPopover(detailHTML, { kind: "answer", title: "查看答案", html: true });
      } else {
        UI.notify(`${answerText}。${steps[0] || methodHintFor(current)}`, { duration: 5200 });
      }
    }

    function skipQuestion() {
      clearAutoNext();
      if (state.checked) return nextQuestion();
      const current = state.currentSet[state.index];
      const point = current?.pointId ? pointMap[current.pointId] : (state.pointId === "auto" ? choosePoint() : pointMap[state.pointId]);
      state.currentSet[state.index] = applyQuestionInteraction(makeQuestion(point, { strict: Boolean(current?.pointId) || state.pointId !== "auto" }), state.answerMode);
      renderPracticeQuestion();
    }
    function roundAdviceHTML(wrong, rate, challenge) {
      const profile = activeProfile();
      const weak = weakestPoints(1)[0];
      const wrongCount = currentGradeWrongbook(profile).length;
      const title = wrong.length
        ? "先复盘，再继续"
        : challenge?.passed
          ? "可以继续闯关"
          : rate >= 85
            ? "状态稳定，可以加一点挑战"
            : "下一轮先补薄弱点";
      const copy = wrong.length
        ? `本轮 ${wrong.length} 道错题，建议先看招财讲解，再做同类题 3 道。`
        : challenge?.passed
          ? `第 ${challenge.level} 关已经通过，下一关会稍微提高题量和题型切换。`
          : rate >= 85
            ? "正确率比较稳，可以尝试附加题或应用题强化，训练读题和建模。"
            : weak
              ? `建议下一轮练"${weak.label}"，先把这个知识点做稳。`
              : "建议再做一轮 6-10 题，积累更多练习样本。";
      return petCopy(`
        <div class="round-coach">
          <div>
            <span class="round-coach-kicker">招财建议</span>
            <strong>${escapeHTML(title)}</strong>
            <p>${escapeHTML(copy)}</p>
          </div>
          <div class="round-coach-mini">
            <span>错题本 ${wrongCount} 题</span>
            <span>下一奖励：${nextMilestoneCopy()}</span>
          </div>
        </div>`);
    }
    function roundActionCardsHTML(wrong, rate) {
      const weak = weakestPoints(1)[0];
      const printCopy = wrong.length
        ? `把本轮 ${wrong.length} 道错题和解析打印出来，适合订正后贴到错题本。`
        : "把本轮题目生成带答案的讲解卷，适合纸面复习或给家长检查。";
      const similarCopy = wrong.length
        ? "先挑本轮第一道错题的同类题练 3 道，马上巩固刚刚卡住的知识点。"
        : weak
          ? `下一轮优先练"${weak.label}"，保持节奏，不用一次练太多。`
          : "继续做一小轮，积累更多练习记录后建议会更准。";
      return petCopy(`
        <div class="round-action-grid" aria-label="本轮学习闭环">
          <button class="round-action-card" type="button" id="roundReviewAction">
            <strong>${wrong.length ? "先看错题讲解" : "查看本轮总结"}</strong>
            <span>${wrong.length ? "招财会把每道错题拆成孩子能听懂的步骤。" : "确认本轮做得稳的地方，再决定下一轮练什么。"}</span>
          </button>
          <button class="round-action-card" type="button" id="roundSimilarAction">
            <strong>${wrong.length ? "同类题 3 道" : "按薄弱点继续"}</strong>
            <span>${escapeHTML(similarCopy)}</span>
          </button>
          <button class="round-action-card" type="button" id="roundPrintAction">
            <strong>打印本轮题单</strong>
            <span>${escapeHTML(printCopy)}</span>
          </button>
        </div>`);
    }
    function performanceSummary(rate, passed) {
      if (rate >= 100) return "\u{1F31F} 太厉害了！全部答对，你是数学小天才！";
      if (rate >= 90) return "\u{1F44D} 非常棒！正确率很高，继续保持！";
      if (rate >= 80) return passed ? "\u{1F389} 过关了！做得不错，继续保持！" : "\u{1F4AA} 做得不错，再稳一点就能全对了！";
      if (rate >= 60) return "\u{1F4DA} 还可以哦，多练几道会越来越好的！";
      if (rate >= 40) return "\u{2764}\u{FE0F} 别灰心，每次练习都在进步！加油！";
      return "\u{1F431} 慢慢来，认真看题，你可以的！我们一起加油！";
    }
    function mobileResultPopoverHTML({ total, correct, rate, wrongCount, reward, challenge }) {
      const title = challenge
        ? (challenge.passed ? `第 ${challenge.level} 关通过` : `第 ${challenge.level} 关还差一点`)
        : wrongCount ? "先复盘错题" : "本轮完成得很稳";
      const summary = performanceSummary(rate, challenge?.passed);
      const next = challenge?.passed
        ? `下一次进入第 ${challenge.nextLevel} 关。`
        : wrongCount
          ? `有 ${wrongCount} 道错题，先看讲解再继续。`
          : "可以继续下一轮，或者打印题单巩固。";
      return `
        <span class="mobile-result-title">${escapeHTML(title)}</span>
        <span class="mobile-result-summary">${escapeHTML(summary)}</span>
        <span class="mobile-result-grid">
          <b><em>${total}</em><small>完成</small></b>
          <b><em>${correct}</em><small>答对</small></b>
          <b><em>${rate}%</em><small>正确率</small></b>
          <b><em>+${reward.coins}</em><small>奖励</small></b>
        </span>
        <span class="mobile-result-next">${escapeHTML(next)}</span>
        ${challenge ? `
        <div class="result-buttons">
          <button class="soft-btn" type="button" id="mcrBackBtn">← 返回设置</button>
          <button class="danger" type="button" id="mcrNextBtn">${challenge.passed ? "下一关 →" : "再试一次 →"}</button>
        </div>` : ''}`;
    }
    function desktopResultPopoverHTML({ total, correct, rate, wrongCount, reward, challenge, elapsedMs, mode }) {
      const isPractice = mode === "practice" || mode === "normal" || (!challenge && mode !== "challenge");
      const icon = isPractice ? (wrongCount ? "\u{1F4DD}" : "\u{1F389}")
        : challenge?.passed ? "\u{1F3C6}" : "\u{1F4AA}";
      const title = isPractice
        ? (wrongCount ? "本轮练习完成" : "本轮全对通过")
        : challenge?.passed ? `第 ${challenge.level} 关通过` : `第 ${challenge.level} 关还差一点`;
      const subtitle = isPractice
        ? (wrongCount ? `有 ${wrongCount} 道错题，建议回顾再开下一轮。` : "这一轮完成得很稳，可以继续下一轮。")
        : challenge?.passed ? `下一次进入第 ${challenge.nextLevel} 关` : `正确率还差 ${challenge.passRate - rate}% 到达过关线`;
      const summary = performanceSummary(rate, challenge?.passed);
      const bodyHTML = `
        <p class="crs-summary">${escapeHTML(summary)}</p>
        <div class="crs-stat-grid">
          <div class="crs-stat"><em>${icon}</em><strong>${escapeHTML(title)}</strong><span>${escapeHTML(subtitle)}</span></div>
          <div class="crs-stat"><b>${total}</b><span>完成题目</span></div>
          <div class="crs-stat"><b>${correct}</b><span>答对题目</span></div>
          <div class="crs-stat"><b>${rate}%</b><span>本轮正确率</span></div>
          <div class="crs-stat"><b>${formatDuration(elapsedMs)}</b><span>本轮用时</span></div>
          <div class="crs-stat"><b>+${reward.coins}</b><span>完成奖励</span></div>
          <div class="crs-stat"><b>+${state.roundCoins}</b><span>本轮金币</span></div>
          <div class="crs-stat"><b>${reward.foundBack ? "已找回" : `+${reward.bond}`}</b><span>${reward.foundBack ? "宠物状态" : "亲密值"}</span></div>
        </div>
        ${wrongCount ? (isPractice ? `<p class="crs-hint">有 ${wrongCount} 道错题，建议先回顾错题再开下一轮。</p>` : `<p class="crs-hint">有 ${wrongCount} 道错题，建议先回顾错题再继续闯关。</p>`) : ""}`;
      const actionsHTML = isPractice
        ? `
        <button class="soft-btn" type="button" id="crsBackBtn">← 返回设置</button>
        <button class="danger" type="button" id="crsNextBtn">下一轮 →</button>`
        : `
        <button class="soft-btn" type="button" id="crsBackBtn">← 返回设置</button>
        <button class="danger" type="button" id="crsNextBtn">${challenge?.passed ? "下一关 →" : "再试一次 →"}</button>`;
      return { titleHTML: `<span aria-hidden="true">${icon}</span> ${escapeHTML(title)}`, bodyHTML, actionsHTML };
    }
    function openDesktopResultPopover(result, mode) {
      if (!els.challengeResultOverlay) return;
      clearAutoReturn();
      els.challengeResultTitle.innerHTML = result.titleHTML;
      els.challengeResultBody.innerHTML = result.bodyHTML;
      els.challengeResultActions.innerHTML = result.actionsHTML;
      els.challengeResultOverlay.hidden = false;
      els.challengeResultOverlay.querySelector("#crsBackBtn")?.addEventListener("click", () => { closeDesktopResultPopover(); returnToPracticeSetup(); });
      if (mode === "practice" || mode === "normal") {
        els.challengeResultOverlay.querySelector("#crsNextBtn")?.addEventListener("click", () => { closeDesktopResultPopover(); startNewSet(); });
      } else {
        els.challengeResultOverlay.querySelector("#crsNextBtn")?.addEventListener("click", () => { closeDesktopResultPopover(); startChallengeSet(); });
      }
    }
    function closeDesktopResultPopover() {
      if (!els.challengeResultOverlay) return;
      els.challengeResultOverlay.hidden = true;
    }

    function kidExplainHTML(question, cause = "未标记") {
      const point = pointMap[question?.pointId];
      const kp = knowledgeProfileFor(point);
      const pitfall = causes.includes(normalizeCause(cause))
        ? causeAdvice(cause)
        : (question?.commonPitfalls || kp.pitfalls || ["容易跳步或看错符号"])[0];
      const steps = (question?.steps && question.steps.length ? question.steps : [question?.explanation || methodHintFor(question)]).slice(0, 4);
      return petCopy(`
        <div class="kid-explain">
          <div class="kid-explain-head"><span>招财讲一讲</span><strong>${escapeHTML(templateLabelFor(question))}</strong></div>
          <div class="kid-explain-grid">
            <div><b>先看什么</b><p>${escapeHTML(methodHintFor(question))}</p></div>
            <div><b>怎么算</b><ol>${steps.map((step) => `<li>${escapeHTML(step)}</li>`).join("")}</ol></div>
            <div><b>容易错哪</b><p>${escapeHTML(String(pitfall))}</p></div>
          </div>
        </div>`);
    }
    function printRoundSheet() {
      const records = state.records.filter((record) => record?.question);
      if (!records.length) {
        UI.notify("本轮还没有可打印的题目。", { tone: "bad" });
        return;
      }
      const firstGrade = records[0].question.grade || state.grade;
      els.printGrade.value = String(firstGrade);
      els.printPoint.innerHTML = pointOptionsHTML(firstGrade, "auto");
      els.printPoint.value = "auto";
      els.printCount.value = String(records.length);
      els.perPageInput.value = String(Math.min(20, Math.max(6, records.length)));
      if (els.printTemplateSelect) els.printTemplateSelect.value = "explain";
      if (els.printExportMode) els.printExportMode.value = "explanations";
      state.printQuestions = records.map((record, index) => ({
        ...record.question,
        printPlanTag: record.correct ? "本轮答对" : `本轮错题 · ${record.cause || "未标记"}`,
        printCause: record.correct ? "" : (record.cause || "未标记"),
        printWrongCount: record.correct ? 0 : 1,
        roundOrder: index + 1
      }));
      state.printBlockedReason = "已生成本轮练习讲解卷，包含题目、答案和简短解析。";
      state.printSignature = printSettingsSignature();
      updatePrintPresetButtons(Number(els.perPageInput.value) || 20);
      syncCustomSelects();
      showView("print");
      renderPrintSheet(state.printQuestions.length, Number(els.perPageInput.value) || 20);
    }
    function finishSet() {
      // 结果弹窗关闭后允许重新打开（复用首次计算的结果）
      if (state.setFinished) {
        if (state._lastFinishResult) {
          const r = state._lastFinishResult;
          const isChallenge = state.mode === "challenge";
          if (shouldUseMobilePetHintPopover() && els.mobilePetHintPopover.hidden) {
            openPetHintPopover(mobileResultPopoverHTML({ total: r.total, correct: r.correct, rate: r.rate, wrongCount: r.wrongCount, reward: r.reward, challenge: r.challenge }), {
              kind: "result", title: isChallenge ? "闯关结果" : "本轮结果", html: true
            });
            if (isChallenge) {
              setTimeout(() => {
                const backBtn = document.getElementById("mcrBackBtn");
                const nextBtn = document.getElementById("mcrNextBtn");
                if (backBtn) backBtn.addEventListener("click", () => { closePetHintPopover(); returnToPracticeSetup(); });
                if (nextBtn) nextBtn.addEventListener("click", () => { closePetHintPopover(); startChallengeSet(); });
              }, 50);
            }
          } else if (!shouldUseMobilePetHintPopover() && els.challengeResultOverlay.hidden) {
            openDesktopResultPopover(desktopResultPopoverHTML({ total: r.total, correct: r.correct, rate: r.rate, wrongCount: r.wrongCount, reward: r.reward, challenge: r.challenge, elapsedMs: r.elapsedMs, mode: state.mode }), isChallenge ? "challenge" : "practice");
          }
        }
        return;
      }
      state.setFinished = true;
      clearAutoNext();
      restoreCausePanelPlacement();
      els.causePanel.classList.remove("active");
      els.answerModePanel.hidden = true;
      const elapsedMs = stopRoundTimer();
      const total = state.records.length;
      const wrong = state.records.filter((record) => record && !record.correct);
      playSound("finish");
      els.summaryPanel.hidden = true;
      els.reviewPanel.hidden = true;
      const rate = total ? Math.round(state.correct / total * 100) : 0;
      const challenge = settleChallengeResult(total, state.correct, rate);
      const reward = awardRoundRewards(total, state.correct, rate);
      setPetAction(wrong.length ? "hint" : "finish", wrong.length ? "复盘" : "完成");
      const finishedTitle = state.mode === "wrongbook" ? "错题复练结束"
        : state.mode === "challenge" ? (challenge?.passed ? "闯关成功" : "闯关复盘")
        : state.mode === "timed" ? (state.timedMeta?.expired ? "限时小测时间到" : "限时小测完成")
        : "本轮练习完成";
      const finishedCopy = state.mode === "timed"
        ? (state.timedMeta?.expired ? "时间到了，先看本次错题和薄弱点；下次可以少量多次练。" : "限时小测完成了，下面先看错题和用时节奏。")
        : challenge ? challenge.copy : "招财陪你完成这一轮了。下面可以回顾本轮错题，也可以直接按薄弱知识点继续练。";
      els.challengeResultOverlay.hidden = true;
      // 统一 summary panel（桌面端和移动端共用）
      els.summaryPanel.innerHTML = petCopy(`
        <h2>${escapeHTML(finishedTitle)}</h2>
        <p class="muted">${escapeHTML(finishedCopy)}</p>
        <div class="summary-grid">
          <div class="summary-mini"><strong>${total}</strong><span>完成题目</span></div>
          <div class="summary-mini"><strong>${state.correct}</strong><span>答对题目</span></div>
          <div class="summary-mini"><strong>${rate}%</strong><span>本轮正确率</span></div>
          ${challenge ? `<div class="summary-mini"><strong>${challenge.passed ? "过关" : `${challenge.passRate}%`}</strong><span>${challenge.passed ? "闯关结果" : "过关线"}</span></div>` : ""}
          <div class="summary-mini"><strong>${formatDuration(elapsedMs)}</strong><span>本轮用时</span></div>
          <div class="summary-mini"><strong>+${reward.coins}</strong><span>完成奖励</span></div>
          <div class="summary-mini"><strong>+${state.roundCoins}</strong><span>本轮金币</span></div>
          <div class="summary-mini"><strong>${reward.foundBack ? "已找回" : `+${reward.bond}`}</strong><span>${reward.foundBack ? "宠物状态" : "亲密值"}</span></div>
        </div>
        ${roundAdviceHTML(wrong, rate, challenge)}
        ${roundActionCardsHTML(wrong, rate)}
        <div class="row-actions">
          <button class="${challenge ? 'soft-btn' : 'primary'}" type="button" id="reviewWrongBtn">${wrong.length ? "回顾本轮错题" : "查看本轮总结"}</button>
          <button class="${challenge ? 'danger' : 'secondary'}" type="button" id="continueWeakBtn">${challenge?.passed ? "继续下一关" : "按薄弱点继续练"}</button>
          <button class="secondary" type="button" data-jump="wrongbook">打开错题本</button>
        </div>`);
      els.summaryPanel.querySelector("#reviewWrongBtn").addEventListener("click", renderRoundReview);
      els.summaryPanel.querySelector("#roundReviewAction").addEventListener("click", renderRoundReview);
      els.summaryPanel.querySelector("#roundSimilarAction").addEventListener("click", () => {
        const firstWrong = wrong[0]?.question;
        if (firstWrong?.pointId) startPointSet(firstWrong.pointId, 3, "similar");
        else startWeakPractice();
      });
      els.summaryPanel.querySelector("#roundPrintAction").addEventListener("click", printRoundSheet);
      els.summaryPanel.querySelector("#continueWeakBtn").addEventListener("click", () => {
        if (challenge?.passed) startChallengeSet();
        else startWeakPractice();
      });
      els.summaryPanel.querySelector("[data-jump]").addEventListener("click", () => showView("wrongbook"));
      setFeedback(wrong.length ? "bad" : "good", wrong.length ? '招财：本轮有错题，点"回顾本轮错题"可以看通俗讲解。' : "招财：本轮没有错题，完成得很稳。", wrong.length ? "📒" : "🏆");
      updatePetStatus(wrong.length ? "招财：错题不用怕，我们把每一步拆开看。" : "招财：这一轮很稳，我的信心也涨起来了。", wrong.length ? "复盘" : "完成");
      // 缓存本轮结果，供弹窗关闭后重新打开使用
      state._lastFinishResult = { total, correct: state.correct, rate, wrongCount: wrong.length, reward, challenge, elapsedMs };
      // 移动端闯关：弹窗模式显示闯关结果
      if (state.mode === "challenge" && challenge && shouldUseMobilePetHintPopover()) {
        els.summaryPanel.hidden = true;
        els.mobileChallengeResult.hidden = true;
        openPetHintPopover(mobileResultPopoverHTML({ total, correct: state.correct, rate, wrongCount: wrong.length, reward, challenge }), {
          kind: "result",
          title: "闯关结果",
          html: true
        });
        // 绑定弹窗内按钮事件
        setTimeout(() => {
          const backBtn = document.getElementById("mcrBackBtn");
          const nextBtn = document.getElementById("mcrNextBtn");
          if (backBtn) backBtn.addEventListener("click", () => { closePetHintPopover(); returnToPracticeSetup(); });
          if (nextBtn) nextBtn.addEventListener("click", () => { closePetHintPopover(); startChallengeSet(); });
        }, 50);
      } else if (state.mode === "challenge" && challenge) {
        // 桌面/平板闯关：弹窗模式显示闯关结果
        els.summaryPanel.hidden = true;
        els.mobileChallengeResult.hidden = true;
        openDesktopResultPopover(desktopResultPopoverHTML({ total, correct: state.correct, rate, wrongCount: wrong.length, reward, challenge, elapsedMs, mode: "challenge" }), "challenge");
      } else {
        // 普通练习 / 限时 / 错题模式
        els.mobileChallengeResult.hidden = true;
        if (shouldUseMobilePetHintPopover()) {
          // 移动端：保持现有弹窗
          openPetHintPopover(mobileResultPopoverHTML({ total, correct: state.correct, rate, wrongCount: wrong.length, reward, challenge }), {
            kind: "result",
            title: "本轮结果",
            html: true
          });
        } else {
          // 桌面/平板练习模式：弹窗显示本轮结果
          els.summaryPanel.hidden = true;
          openDesktopResultPopover(desktopResultPopoverHTML({ total, correct: state.correct, rate, wrongCount: wrong.length, reward, challenge: null, elapsedMs, mode: "practice" }), "practice");
        }
      }
      els.answerInput.disabled = true;
      els.checkBtn.disabled = true;
      saveProfiles();
      renderChrome();
      renderChallengePanel(activeProfile());
      if (state.view === "report") renderReport();
    }
    function renderRoundReview() {
      const wrong = state.records.filter((record) => record && !record.correct);
      els.reviewPanel.hidden = false;
      if (!wrong.length) {
        els.reviewPanel.innerHTML = petCopy(`<h2>本轮错题回顾</h2><div class="empty-state">招财：这一轮没有错题。可以继续练下一轮，或者去打印题单做纸面练习。</div>`);
        return;
      }
      els.reviewPanel.innerHTML = petCopy(`
        <h2>本轮错题回顾</h2>
        <p class="muted">招财会先用孩子能听懂的话解释，再给 2-3 个步骤。建议看完后点"同类题 3 道"马上巩固。</p>
        <div class="review-list">
          ${wrong.map((record, index) => {
            const q = record.question;
            return `<article class="review-item">
              <div class="item-top">
                <div>
                  <h3>${index + 1}. ${escapeHTML(q.text)}</h3>
                  <div class="mini-meta"><span>${pointLabel(q.pointId)}</span><span>你的答案：${formatAnswer(record.answer)}</span><span>正确答案：${formatAnswer(q.answer, q.answerLabel)}</span><span>错因：${escapeHTML(record.cause)}</span></div>
                </div>
                <button class="secondary" type="button" data-similar="${escapeAttr(q.pointId)}">同类题 3 道</button>
              </div>
              ${questionLearningMetaHTML(q)}
              ${kidExplainHTML(q, record.cause)}
            </article>`;
          }).join("")}
        </div>`);
      els.reviewPanel.querySelectorAll("[data-similar]").forEach((btn) => {
        btn.addEventListener("click", () => startPointSet(btn.dataset.similar, 3, "similar"));
      });
    }
    function startWeakPractice() {
      const weak = weakestPoints(1)[0] || availablePoints(state.grade)[0];
      startPointSet(weak.id, Math.min(10, state.setSize), "weak");
    }
    function startCausePractice(cause) {
      const profile = activeProfile();
      const grade = Number(profile.grade || state.grade);
      const related = profile.history
        .filter((item) => !item.correct && normalizeCause(item.cause) === cause && Number(item.grade || grade) === grade)
        .map((item) => item.pointId)
        .filter((id) => pointBelongsToGrade(id, grade));
      const wrongRelated = profile.wrongbook
        .filter((item) => normalizeCause(item.cause) === cause && Number(item.question.grade || grade) === grade)
        .map((item) => item.question.pointId)
        .filter((id) => pointBelongsToGrade(id, grade));
      const counts = [...related, ...wrongRelated].reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});
      const pointId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || weakestPoints(1)[0]?.id;
      if (pointId) startPointSet(pointId, Math.min(10, state.setSize), "similar");
    }

    function filteredWrongbook() {
      const point = els.wrongPointFilter.value || "all";
      const cause = els.wrongCauseFilter.value === "all" ? "all" : normalizeCause(els.wrongCauseFilter.value || "all");
      const grade = activeProfile().grade || state.grade;
      return activeProfile().wrongbook.filter((item) => {
        const gradeOk = Number(item.question.grade || grade) === Number(grade);
        const pointOk = point === "all" || item.question.pointId === point;
        const causeOk = cause === "all" || normalizeCause(item.cause) === cause;
        return gradeOk && pointOk && causeOk;
      });
    }
    function wrongMasteryStatus(item) {
      if ((item.correctStreak || 0) >= 2) return { label: "接近掌握", tone: "", copy: "再连续做对 1 次就会自动移出错题本。" };
      if ((item.wrongCount || 0) >= 3) return { label: "高频错题", tone: "topic", copy: "建议先看讲解，再做同类题，不要只刷答案。" };
      if (item.lastResult === "correct") return { label: "正在巩固", tone: "", copy: "上次复练答对了，继续保持稳定。" };
      return { label: "待订正", tone: "topic", copy: "先标记错因，再做 3 道同类题巩固。" };
    }
    function wrongProgressHTML(streak = 0) {
      return `<div class="wrong-progress" aria-label="连续做对进度">${[0, 1, 2].map((index) => `<span class="${index < streak ? "done" : ""}"></span>`).join("")}</div>`;
    }
    function wrongbookPetCoachHTML(profile, list) {
      const name = petDisplayName(profile);
      const gradeWrongCount = currentGradeWrongbook(profile, profile.grade || state.grade).length;
      const hot = list.filter((item) => (item.wrongCount || 0) >= 3);
      const almost = list.filter((item) => (item.correctStreak || 0) >= 2);
      const weak = weakestPoints(1)[0];
      const title = almost.length
        ? `再稳一下，${name}就能帮你清掉错题`
        : list.some((item) => String(item.dueDate || todayKey()) <= todayKey())
          ? `${name}排好了今日复习`
          : hot.length
          ? `${name}发现了高频错题`
          : gradeWrongCount
            ? `${name}帮你排好了复习顺序`
            : `${name}的小错题篮清空了`;
      const copy = almost.length
        ? `有 ${almost.length} 道题已经连续做对 2 次，再做对 1 次会自动移入已掌握记录，并额外奖励金币。`
        : list.some((item) => String(item.dueDate || todayKey()) <= todayKey())
          ? `今天有 ${list.filter((item) => String(item.dueDate || todayKey()) <= todayKey()).length} 道到期错题。先复习这些题，做对后会自动排到下一次复习。`
        : hot.length
          ? `先攻 ${hot.length} 道反复出错的题。建议先看讲解，再点"同类题"做 3 道变式。`
          : gradeWrongCount
            ? weak
              ? `本年级还有 ${gradeWrongCount} 道错题。今天可以从"${weak.label}"开始，${name}会把错因一起记下来。`
              : `本年级还有 ${gradeWrongCount} 道错题。先按连续做对次数少的题复练。`
            : "今天没有需要复习的错题，可以先做一轮普通练习，或者挑战薄弱知识点。";
      return `<article class="wrong-pet-coach">
        <div>
          <span class="round-coach-kicker">招财错题助手</span>
          <strong>${escapeHTML(title)}</strong>
          <p>${escapeHTML(copy)}</p>
        </div>
        <button class="secondary" type="button" data-jump="petspace">去宠物空间</button>
      </article>`;
    }
    function questionLearningMetaHTML(question, limit = 3) {
      if (!question) return "";
      const subskills = Array.isArray(question.subskills) ? question.subskills.slice(0, limit) : [];
      const pitfalls = Array.isArray(question.commonPitfalls) ? question.commonPitfalls.slice(0, limit) : [];
      const chips = [
        question.curriculumBand || curriculumBandFor(pointMap[question.pointId]),
        templateLabelFor(question),
        ...subskills.map((item) => `练：${item}`),
        ...pitfalls.slice(0, 2).map((item) => `防：${item}`)
      ].filter(Boolean);
      if (!chips.length) return "";
      return `<div class="chip-row">${chips.map((item) => `<span class="mini-chip">${escapeHTML(item)}</span>`).join("")}</div>`;
    }
    function masteredWrongSummaryHTML(profile) {
      const mastered = (profile.masteredWrong || []).filter((item) => Number(item.question.grade || profile.grade) === Number(profile.grade));
      if (!mastered.length) return "";
      const recent = mastered.slice(0, 3).map((item) => `${pointLabel(item.question.pointId)} · ${normalizeCause(item.cause)}`).join("；");
      return `<div class="report-item">
        <div class="item-top"><h3>已掌握错题</h3><span class="mastered-chip">${mastered.length} 题</span></div>
        <p>这些题已经连续做对 3 次，从错题本移入掌握记录。最近掌握：${escapeHTML(recent)}。</p>
      </div>`;
    }
    function causeSelectHTML(selected, id) {
      const normalizedSelected = normalizeCause(selected);
      return `<select data-wrong-cause="${escapeAttr(id)}" aria-label="修改错因">${causes.map((cause) => `<option value="${escapeAttr(cause)}" ${cause === normalizedSelected ? "selected" : ""}>${escapeHTML(cause)}</option>`).join("")}</select>`;
    }
    function renderWrongbook() {
      const list = filteredWrongbook();
      const profile = activeProfile();
      const gradeWrongbook = currentGradeWrongbook(profile);
      els.practiceWrongAllBtn.disabled = !gradeWrongbook.length;
      els.practiceWeakBtn.disabled = !profile.wrongbook.length && !profile.history.length;
      els.deleteSelectedBtn.disabled = true;
      if (!list.length) {
        els.wrongbookList.innerHTML = `${wrongbookPetCoachHTML(profile, list)}${masteredWrongSummaryHTML(profile)}<div class="empty-state">这里暂时没有符合筛选条件的错题。在线练习做错的题会自动出现在这里。</div>`;
        els.wrongbookList.querySelector("[data-jump='petspace']")?.addEventListener("click", () => showView("petspace"));
        return;
      }
      const grouped = {
        due: list.filter((item) => String(item.dueDate || todayKey()) <= todayKey()),
        hot: list.filter((item) => (item.wrongCount || 0) >= 3),
        almost: list.filter((item) => (item.correctStreak || 0) >= 2),
        normal: list.filter((item) => (item.wrongCount || 0) < 3 && (item.correctStreak || 0) < 2)
      };
      const summary = `<div class="report-item">
        <div class="item-top"><h3>当前错题分层</h3><span class="tag">本年级 ${gradeWrongbook.length} 题</span></div>
        <div class="mini-meta"><span>今日复习 ${grouped.due.length} 题</span><span>反复错 ${grouped.hot.length} 题</span><span>快掌握 ${grouped.almost.length} 题</span><span>待订正 ${grouped.normal.length} 题</span></div>
        <div class="wrong-task-grid">
          <button class="wrong-task" type="button" data-wrong-task="due" ${grouped.due.length ? "" : "disabled"}>
            <strong>今日待复习</strong><span>${grouped.due.length || 0} 题 · 按间隔复习</span>
          </button>
          <button class="wrong-task" type="button" data-wrong-task="hot" ${grouped.hot.length ? "" : "disabled"}>
            <strong>先攻高频错题</strong><span>${grouped.hot.length || 0} 题 · 先看讲解再练</span>
          </button>
          <button class="wrong-task" type="button" data-wrong-task="almost" ${grouped.almost.length ? "" : "disabled"}>
            <strong>清掉快掌握题</strong><span>${grouped.almost.length || 0} 题 · 再对 1 次可移出</span>
          </button>
          <button class="wrong-task" type="button" data-wrong-task="normal" ${grouped.normal.length ? "" : "disabled"}>
            <strong>整理待订正题</strong><span>${grouped.normal.length || 0} 题 · 标错因后复练</span>
          </button>
        </div>
      </div>${masteredWrongSummaryHTML(profile)}`;
      els.wrongbookList.innerHTML = wrongbookPetCoachHTML(profile, list) + summary + list.map((item) => {
        const q = item.question;
        const status = wrongMasteryStatus(item);
        return `<article class="wrong-item">
          <div class="wrong-top">
            <div>
              <h3>${escapeHTML(pointLabel(q.pointId))}</h3>
              <div class="wrong-meta"><span class="tag ${status.tone}">${status.label}</span><span>${escapeHTML(reviewDateLabel(item))}</span><span>已错 ${item.wrongCount} 次</span><span>连续做对 ${item.correctStreak}/3</span></div>
              ${wrongProgressHTML(item.correctStreak || 0)}
              <div class="wrong-meta"><span>错因</span>${causeSelectHTML(item.cause || "未标记", item.id)}<span>${escapeHTML(status.copy)}</span></div>
            </div>
            <div class="wrong-actions">
              <button class="primary" type="button" data-practice-wrong="${escapeAttr(item.id)}">再做一次</button>
              <button class="secondary" type="button" data-similar-wrong="${escapeAttr(q.pointId)}">同类题</button>
              <button class="danger" type="button" data-delete-wrong="${escapeAttr(item.id)}">删除</button>
            </div>
          </div>
          <label class="select-line"><input type="checkbox" value="${escapeAttr(item.id)}" />选中这道错题</label>
        </article>`;
      }).join("");
      els.wrongbookList.querySelector("[data-jump='petspace']")?.addEventListener("click", () => showView("petspace"));
      els.wrongbookList.querySelectorAll("[data-wrong-task]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const ids = (grouped[btn.dataset.wrongTask] || []).slice(0, 8).map((item) => item.id);
          if (ids.length) startWrongbookPractice(ids);
        });
      });
      els.wrongbookList.querySelectorAll("[data-practice-wrong]").forEach((btn) => btn.addEventListener("click", () => startWrongbookPractice([btn.dataset.practiceWrong])));
      els.wrongbookList.querySelectorAll("[data-similar-wrong]").forEach((btn) => btn.addEventListener("click", () => startPointSet(btn.dataset.similarWrong, 3, "similar")));
      els.wrongbookList.querySelectorAll("[data-delete-wrong]").forEach((btn) => btn.addEventListener("click", () => deleteWrongItems([btn.dataset.deleteWrong])));
      els.wrongbookList.querySelectorAll("[data-wrong-cause]").forEach((select) => {
        select.addEventListener("change", () => updateWrongCause(select.dataset.wrongCause, select.value));
      });
      syncCustomSelects(els.wrongbookList);
      const refreshDeleteState = () => {
        const checked = els.wrongbookList.querySelectorAll("input[type='checkbox']:checked").length;
        els.deleteSelectedBtn.disabled = checked <= 0;
      };
      els.wrongbookList.querySelectorAll("input[type='checkbox']").forEach((input) => input.addEventListener("change", refreshDeleteState));
      refreshDeleteState();
    }
    function updateWrongCause(id, cause) {
      const profile = activeProfile();
      const item = profile.wrongbook.find((entry) => entry.id === id);
      if (!item) return;
      const before = { cause: item.cause, updatedAt: item.updatedAt };
      item.cause = cause || "未标记";
      item.updatedAt = Date.now();
      if (!saveProfiles()) {
        item.cause = before.cause;
        item.updatedAt = before.updatedAt;
        saveProfiles();
        UI.notify("本地保存失败，错因没有修改。请先导出备份。", { tone: "bad", duration: 4200 });
      }
      if (state.view === "wrongbook") renderWrongbook();
      if (state.view === "report") renderReport();
    }
    async function deleteWrongItems(ids) {
      const profile = activeProfile();
      const idSet = new Set(ids);
      const removed = profile.wrongbook.filter((item) => idSet.has(item.id));
      if (!removed.length) return;
      const confirmed = await UI.confirm(`确定删除选中的 ${removed.length} 道错题吗？`, {
        title: "删除错题",
        confirmText: "删除",
        danger: true
      });
      if (!confirmed) return;
      const before = [...profile.wrongbook];
      profile.wrongbook = profile.wrongbook.filter((item) => !idSet.has(item.id));
      if (!saveProfiles()) {
        profile.wrongbook = before;
        saveProfiles();
        renderWrongbook();
        UI.notify("本地保存失败，错题没有删除。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      renderWrongbook();
      UI.notify(`已删除 ${removed.length} 道错题。`, {
        actionText: "撤销",
        duration: 5200,
        onAction: () => {
          const existing = new Set(profile.wrongbook.map((item) => item.id));
          const beforeUndo = [...profile.wrongbook];
          profile.wrongbook = [...removed.filter((item) => !existing.has(item.id)), ...profile.wrongbook].slice(0, 300);
          if (!saveProfiles()) {
            profile.wrongbook = beforeUndo;
            saveProfiles();
            UI.notify("本地保存失败，撤销没有完成。请先导出备份。", { tone: "bad", duration: 4200 });
          }
          renderWrongbook();
        }
      });
    }

    function learningDays() {
      return learningDaysFor(activeProfile());
    }
    function renderReport() {
      const profile = activeProfile();
      const mobileReport = isMobilePracticeViewport();
      const history = profile.history;
      const today = history.filter((item) => item.date === todayKey());
      const correct = history.filter((item) => item.correct).length;
      const accuracy = history.length ? Math.round(correct / history.length * 100) : 0;
      const weak = weakestPoints(6).filter((point) => masteryAccuracy(profile, point.id) < 0.78 || profile.wrongbook.some((item) => item.question.pointId === point.id));
      els.reportToday.textContent = today.length;
      els.reportAccuracy.textContent = history.length ? `${accuracy}%` : "--";
      els.reportStreak.textContent = learningDays();
      els.reportWeakCount.textContent = weak.length;
      renderDailyGoal();
      renderRewards(profile);
      renderWeek(profile);
      const shownPoints = mobileReport
        ? availablePoints(profile.grade).slice(0, 4)
        : availablePoints(profile.grade);
      els.masteryGrid.innerHTML = shownPoints.map((point) => {
        const m = masteryFor(profile, point.id);
        const rate = m.attempts ? Math.round(m.correct / m.attempts * 100) : 0;
        return `<div class="mastery-card">
          <div class="item-top">
            <h3>${point.label}</h3>
            <span class="tag">难度 ${m.level}/5</span>
          </div>
          <p class="muted">${point.helper}</p>
          <div class="bar-track"><div class="bar-fill" style="--w:${m.attempts ? rate : 8}%"></div></div>
          <div class="mini-meta"><span>${m.attempts} 次练习</span><span>正确率 ${m.attempts ? rate + "%" : "--"}</span></div>
        </div>`;
      }).join("");
      const causeCounts = {};
      history.filter((item) => !item.correct).forEach((item) => {
        const cause = normalizeCause(item.cause);
        causeCounts[cause] = (causeCounts[cause] || 0) + 1;
      });
      const causeRows = Object.entries(causeCounts).sort((a, b) => b[1] - a[1]);
      const masteredForGrade = (profile.masteredWrong || []).filter((item) => Number(item.question.grade || profile.grade) === Number(profile.grade));
      els.causeReportList.innerHTML = causeRows.length ? causeRows.map(([cause, count]) => `
        <div class="report-item">
          <div class="item-top"><h3>${escapeHTML(cause)}</h3><span class="tag">${count} 次</span></div>
          <p>${causeAdvice(cause)}</p>
          <div class="row-actions"><button class="secondary" type="button" data-cause-practice="${escapeAttr(cause)}">按这个错因复练</button></div>
        </div>`).join("") : `<div class="empty-state">还没有错题记录。做几轮练习后，这里会显示最常见的错因。</div>`;
      if (masteredForGrade.length) {
        els.causeReportList.insertAdjacentHTML("beforeend", `
          <div class="report-item">
            <div class="item-top"><h3>已掌握错题沉淀</h3><span class="mastered-chip">${masteredForGrade.length} 题</span></div>
            <p>这些题已经连续做对 3 次，不再占用错题本，但会保留在报告里，方便家长看到孩子从"反复错"到"已掌握"的变化。</p>
          </div>`);
      }
      els.causeReportList.querySelectorAll("[data-cause-practice]").forEach((btn) => {
        btn.addEventListener("click", () => startCausePractice(btn.dataset.causePractice));
      });
      els.historyList.innerHTML = history.slice(0, mobileReport ? 3 : 12).map((item) => `
        <div class="report-item">
          <div class="item-top"><h3>${escapeHTML(item.text)}</h3><span class="tag ${item.correct ? "" : "topic"}">${item.correct ? "答对" : "答错"}</span></div>
          <div class="mini-meta"><span>${item.date}</span><span>${pointLabel(item.pointId)}</span><span>${escapeHTML(normalizeCause(item.cause))}</span></div>
        </div>`).join("") || `<div class="empty-state">还没有练习记录。先完成一轮在线练习。</div>`;
      renderTrendReport(profile, weak, accuracy);
      renderParentAdvice(profile, weak, causeRows, accuracy, today.length);
    }
    function renderTrendReport(profile, weakPoints, accuracy) {
      if (!els.trendReportList) return;
      const last7 = recentWindow(profile, 7, 0);
      const prev7 = recentWindow(profile, 7, -7);
      const lastRate = accuracyOf(last7);
      const prevRate = accuracyOf(prev7);
      const delta = last7.length && prev7.length ? lastRate - prevRate : 0;
      const rows = pointAttemptRows(profile, profile.grade).filter((row) => row.total >= 3);
      const strongest = rows.slice().sort((a, b) => b.rate - a.rate || b.total - a.total)[0];
      const weakest = rows.slice().sort((a, b) => a.rate - b.rate || b.total - a.total)[0];
      const planPoint = weakPoints[0] || (weakest?.pointId ? pointMap[weakest.pointId] : availablePoints(profile.grade)[0]);
      const trendText = !last7.length
        ? "本周还没有练习数据，先完成 1 轮 6-10 题的小练习建立样本。"
        : prev7.length
          ? `近 7 天完成 ${last7.length} 题，正确率 ${lastRate}%，比上一周期${delta >= 0 ? "提高" : "下降"} ${Math.abs(delta)} 个百分点。`
          : `近 7 天完成 ${last7.length} 题，正确率 ${lastRate}%。继续保持每天少量练习，报告会越来越准确。`;
      const planCopy = planPoint
        ? `建议接下来优先练"${planPoint.label}"：先做 6 道基础题，再做 3 道同类题，最后回看错因。`
        : "建议先按当前年级混合练习，积累足够记录后再自动推荐专项。";
      const dailyPlan = buildDailyPlan(profile, planPoint, weakPoints);
      els.trendReportList.innerHTML = `
        <div class="report-item">
          <div class="item-top"><h3>本周趋势</h3><span class="tag">${delta > 0 ? "上升" : delta < 0 ? "需稳住" : "观察中"}</span></div>
          <p>${escapeHTML(trendText)}</p>
        </div>
        <div class="report-item">
          <div class="item-top"><h3>掌握对比</h3><span class="tag">知识点</span></div>
          <div class="mini-meta"><span>较稳：${strongest ? `${pointLabel(strongest.pointId)} ${strongest.rate}%` : "暂无"}</span><span>需巩固：${weakest ? `${pointLabel(weakest.pointId)} ${weakest.rate}%` : "暂无"}</span><span>总体：${profile.history.length ? accuracy + "%" : "--"}</span></div>
        </div>
        <div class="report-item">
          <div class="item-top"><h3>下一轮计划</h3><span class="tag">可执行</span></div>
          <p>${escapeHTML(planCopy)}</p>
          ${planPoint ? `<div class="row-actions"><button class="secondary" type="button" data-trend-point="${escapeAttr(planPoint.id)}">按计划练一轮</button></div>` : ""}
        </div>
        <div class="report-item">
          <div class="item-top"><h3>今日学习处方</h3><span class="tag">${dailyPlan.total} 题</span></div>
          <div class="plan-stack">
            ${dailyPlan.steps.map((step, index) => `<div class="plan-step"><b>${index + 1}</b><div><strong>${escapeHTML(step.title)}</strong><small>${escapeHTML(step.copy)}</small></div><div class="plan-step-actions"><span class="tag">${escapeHTML(step.count)}</span><button class="secondary compact-btn" type="button" data-daily-plan="${index}">${escapeHTML(step.action || "开始")}</button></div></div>`).join("")}
          </div>
        </div>`;
      els.trendReportList.querySelectorAll("[data-trend-point]").forEach((btn) => {
        btn.addEventListener("click", () => startPointSet(btn.dataset.trendPoint, Math.min(10, state.setSize), "similar"));
      });
      els.trendReportList.querySelectorAll("[data-daily-plan]").forEach((btn) => {
        btn.addEventListener("click", () => startDailyPlanStep(Number(btn.dataset.dailyPlan) || 0));
      });
    }
    function buildDailyPlan(profile, planPoint, weakPoints = []) {
      const gradeWrong = currentGradeWrongbook(profile).length;
      const target = clamp(Math.min(dailyGoal(profile), Math.max(10, Number(profile.settings?.setSize) || 10)), 6, 24);
      const reviewCount = Math.min(5, gradeWrong);
      const weakCount = planPoint ? Math.max(3, Math.min(8, target - reviewCount - 2)) : 0;
      const mixedCount = Math.max(0, target - reviewCount - weakCount);
      const steps = [];
      if (reviewCount) {
        steps.push({
          type: "wrongbook",
          title: "先复习错题",
          copy: "优先做本年级错题本中连续做对次数少的题，做对后推进掌握进度。",
          count: `${reviewCount} 题`,
          amount: reviewCount,
          action: "复习错题"
        });
      }
      if (planPoint) {
        steps.push({
          type: "point",
          pointId: planPoint.id,
          title: `巩固 ${planPoint.label}`,
          copy: weakPoints.length > 1 ? `这是当前最需要补的知识点之一，做完再看错因是否集中。` : "先做基础题，再做 1-2 道变式题。",
          count: `${weakCount || 6} 题`,
          amount: weakCount || 6,
          action: "开始专项"
        });
      }
      steps.push({
        type: "mixed",
        title: "最后混合检查",
        copy: "从当前年级随机抽题，检查孩子能不能在切换题型时保持稳定。",
        count: `${Math.max(3, mixedCount || 3)} 题`,
        amount: Math.max(3, mixedCount || 3),
        action: "混合练习"
      });
      return { total: steps.reduce((sum, step) => sum + (Number.parseInt(step.count, 10) || 0), 0), steps };
    }
    function startDailyPlanStep(index = 0) {
      const profile = activeProfile();
      const history = profile.history || [];
      const correct = history.filter((item) => item.correct).length;
      const accuracy = history.length ? Math.round(correct / history.length * 100) : 0;
      const weak = weakestPoints(6).filter((point) => masteryAccuracy(profile, point.id) < 0.78 || profile.wrongbook.some((item) => item.question.pointId === point.id));
      const rows = pointAttemptRows(profile, profile.grade).filter((row) => row.total >= 3);
      const weakest = rows.slice().sort((a, b) => a.rate - b.rate || b.total - a.total)[0];
      const planPoint = weak[0] || (weakest?.pointId ? pointMap[weakest.pointId] : availablePoints(profile.grade)[0]);
      const plan = buildDailyPlan(profile, planPoint, weak);
      const step = plan.steps[index] || plan.steps[0];
      if (!step) return;
      if (step.type === "wrongbook") {
        const ids = currentGradeWrongbook(profile)
          .slice()
          .sort((a, b) => (a.correctStreak || 0) - (b.correctStreak || 0) || (b.wrongCount || 0) - (a.wrongCount || 0) || (b.updatedAt || 0) - (a.updatedAt || 0))
          .slice(0, step.amount || 5)
          .map((item) => item.id);
        if (ids.length) startWrongbookPractice(ids);
        return;
      }
      if (step.type === "point" && step.pointId) {
        startPointSet(step.pointId, clamp(Number(step.amount) || 6, 3, 20), "similar");
        return;
      }
      els.pointSelect.value = "auto";
      els.setSizeInput.value = String(clamp(Number(step.amount) || 6, 3, 20));
      startNewSet({ focus: true });
    }
    function renderParentAdvice(profile, weakPoints, causeRows, accuracy, todayCount) {
      if (!els.parentAdviceList) return;
      const advices = [];
      const goal = dailyGoal(profile);
      if (todayCount < goal) {
        advices.push({
          title: "今天先完成小目标",
          copy: `今日已完成 ${todayCount}/${goal} 题。建议做一轮 10 题以内的小练习，保持节奏比一次做太多更重要。`,
          action: "开始 10 题练习",
          pointId: "auto"
        });
      }
      const weak = weakPoints[0];
      if (weak) {
        const kp = knowledgeProfileFor(weak);
        advices.push({
          title: `优先巩固：${weak.label}`,
          copy: `${kp.rule} 建议使用"${weak.topic === "word" || weak.topic === "mixed" ? "分步作答" : "智能混合"}"，连续做 6-10 题后再看错因。`,
          action: "按这个知识点练",
          pointId: weak.id
        });
      }
      if (causeRows.length) {
        const [cause, count] = causeRows[0];
        advices.push({
          title: `最常见错因：${cause}`,
          copy: `${count} 次。${causeAdvice(cause)}`,
          action: "按这个错因复练",
          cause
        });
      }
      if (profile.history.length >= 20 && accuracy >= 85 && weakPoints.length <= 1) {
        advices.push({
          title: "可以增加挑战题",
          copy: "最近正确率比较稳定，可以加入本年级附加题或应用题强化，训练读题和建模能力。",
          action: "挑战附加题",
          pointId: appendixPointForGrade(profile.grade).id
        });
      }
      if (!advices.length) {
        advices.push({
          title: "先建立学习样本",
          copy: "先完成 2-3 轮练习，系统会根据错题、正确率和知识点覆盖情况给出更准确的建议。",
          action: "开始练习",
          pointId: "auto"
        });
      }
      els.parentAdviceList.innerHTML = advices.slice(0, 4).map((item) => `
        <div class="report-item parent-advice-card">
          <div class="item-top"><h3>${escapeHTML(item.title)}</h3><span class="tag">建议</span></div>
          <p>${escapeHTML(item.copy)}</p>
          <div class="row-actions"><button class="secondary" type="button" ${item.cause ? `data-parent-cause="${escapeAttr(item.cause)}"` : `data-parent-point="${escapeAttr(item.pointId)}"`}>${escapeHTML(item.action)}</button></div>
        </div>`).join("");
      els.parentAdviceList.querySelectorAll("[data-parent-point]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const pointId = btn.dataset.parentPoint;
          if (pointId === "auto") {
            showView("practice");
            startNewSet({ focus: true });
          } else {
            startPointSet(pointId, Math.min(10, state.setSize), pointMap[pointId]?.topic === "appendix" ? "appendix" : "similar");
          }
        });
      });
      els.parentAdviceList.querySelectorAll("[data-parent-cause]").forEach((btn) => {
        btn.addEventListener("click", () => startCausePractice(btn.dataset.parentCause));
      });
    }
    function causeAdvice(cause) {
      const map = {
        "计算粗心": "建议让孩子算完后反向检查一遍，重点看符号、进退位、口诀和最后一步。",
        "读题理解": '先划关键词，例如"一共、还剩、平均、每份、比多比少"，再决定用什么算式。',
        "概念单位": "先回到概念和单位关系，例如口诀、分数意义、小数点位置、1 米 = 100 厘米。",
        "不会做": "建议先看招财讲解，把题目拆成第一步、第二步，再做 2-3 道同类题。"
      };
      return map[normalizeCause(cause)] || "先让孩子说出自己第一步想怎么算，再对照讲解找差异。";
    }

    function syncPrintControls() {
      els.printGrade.value = String(state.grade);
      const printGrade = Number(els.printGrade.value);
      const printPoint = safePointId(els.printPoint.value || state.pointId || "auto", printGrade);
      els.printPoint.innerHTML = pointOptionsHTML(printGrade, printPoint);
      els.printPoint.value = printPoint;
      els.answerSpaceSelect.value = activeProfile().settings?.answerSpace || "auto";
      if (els.printTemplateSelect) els.printTemplateSelect.value = activeProfile().settings?.printTemplate || "practice";
      if (els.printExportMode) els.printExportMode.value = activeProfile().settings?.printOutputMode || "answers";
      if (!isAndroidWebView() && (!state.printQuestions.length || state.printSignature !== printSettingsSignature())) generatePrintSheet();
    }
    function updatePrintPresetButtons(perPage = Number(els.perPageInput.value) || 20) {
      els.printPresets.querySelectorAll("[data-per-page]").forEach((btn) => {
        btn.classList.toggle("active", Number(btn.dataset.perPage) === Number(perPage));
      });
    }
    function printDensity(perPage, hasWord) {
      return PrintLayout.density(perPage, hasWord);
    }
    function printColumnCount(density, direction) {
      return PrintLayout.columnCount(density, direction);
    }
    function printRowGap(density) {
      return PrintLayout.rowGap(density);
    }
    function printRowMinHeight(hasWord, spaceClass) {
      return PrintLayout.rowMinHeight(hasWord, spaceClass);
    }
    function maxReadablePerPrintPage(requestedPerPage, hasWord, direction, spaceClass) {
      return PrintLayout.maxReadablePerPage({
        requestedPerPage,
        hasWord,
        direction,
        spaceClass,
        hasNameLine: els.printNameLine.checked
      });
    }
    function answerSpaceClass(perPage, hasWord) {
      return PrintLayout.answerSpaceClass(els.answerSpaceSelect.value || "auto", perPage, hasWord);
    }
    function syncPrintPageStyle() {
      const direction = els.paperDirection.value === "landscape" ? "landscape" : "portrait";
      document.getElementById("printPageStyle").textContent = `@media print { @page { size: A4 ${direction}; margin: 0; } }`;
    }
    function printSettingsSignature() {
      return [
        els.printGrade.value,
        els.printPoint.value,
        els.printCount.value,
        els.perPageInput.value,
        els.paperDirection.value,
        els.printTemplateSelect?.value || "practice",
        els.printExportMode?.value || "answers",
        els.printNameLine.checked ? "name" : "no-name",
        els.answerSpaceSelect.value || "auto",
        activeProfile().id
      ].join("|");
    }
    function generatePrintSheet() {
      const oldGrade = state.grade;
      const oldPoint = state.pointId;
      state.grade = clamp(Number(els.printGrade.value) || 1, 1, 6);
      const pointId = safePointId(els.printPoint.value || "auto", state.grade);
      els.printPoint.value = pointId;
      const count = clamp(Number(els.printCount.value) || 40, 1, 400);
      const perPage = clamp(Number(els.perPageInput.value) || 20, 1, 100);
      els.perPageInput.value = String(perPage);
      const profile = activeProfile();
      const template = els.printTemplateSelect?.value || "practice";
      const outputMode = els.printExportMode?.value || "answers";
      profile.settings = { ...(profile.settings || {}), answerSpace: els.answerSpaceSelect.value || "auto", printTemplate: template, printOutputMode: outputMode };
      const printOptions = availablePoints(state.grade);
      const strictPrintPoint = pointId !== "auto";
      state.printBlockedReason = "";
      if (template === "daily-plan") {
        state.printQuestions = dailyPlanPrintQuestions(profile, state.grade, pointId, count);
      } else if (template === "wrong-review") {
        const wrongSource = currentGradeWrongbook(profile, state.grade)
          .filter((item) => pointId === "auto" || item.question.pointId === pointId)
          .map((item) => ({ ...item.question, printCause: item.cause, printWrongCount: item.wrongCount }));
        if (wrongSource.length) {
          state.printQuestions = wrongSource.slice(0, count);
          if (state.printQuestions.length < count) {
            const supplementPool = [...new Set(wrongSource.map((q) => q.pointId).filter((id) => pointBelongsToGrade(id, state.grade)))];
            const fallbackPoint = pointId === "auto" ? null : pointMap[pointId];
            const supplementCount = count - state.printQuestions.length;
            const supplements = Array.from({ length: supplementCount }, (_, index) => {
              const point = pointMap[supplementPool[index % supplementPool.length]] || fallbackPoint || printOptions[0];
              return {
                ...makeStrictQuestionForPoint(point, "input"),
                printCause: "同类变式",
                printWrongCount: 0,
                printSupplement: true
              };
            });
            state.printQuestions.push(...supplements);
            state.printBlockedReason = `当前错题不足 ${count} 题，已自动补入 ${supplements.length} 道同知识点变式题，方便订正后马上巩固。`;
          }
        } else {
          state.printQuestions = [];
          state.printBlockedReason = pointId === "auto"
            ? `${gradeNames[state.grade - 1]}当前没有可打印的错题。可以先在线练习，或把模板改成"普通练习卷"。`
            : `${gradeNames[state.grade - 1]}的"${pointLabel(pointId)}"当前没有错题。可以重新选择知识点，或改为生成同类新题。`;
        }
      } else {
        state.printQuestions = Array.from({ length: count }, () => {
          const point = pointId === "auto" ? chooseAutoPoint(printOptions, false) : pointMap[pointId] || printOptions[0];
          return strictPrintPoint ? makeStrictQuestionForPoint(point, "input") : makeQuestion(point);
        });
      }
      state.grade = oldGrade;
      state.pointId = oldPoint;
      state.printSignature = printSettingsSignature();
      updatePrintPresetButtons(perPage);
      saveProfiles();
      renderPrintSheet(count, perPage);
    }
    function generateWeakPrintSheet() {
      const profile = activeProfile();
      const weak = weakestPoints(1)[0] || availablePoints(profile.grade || state.grade)[0];
      if (!weak) return;
      els.printGrade.value = String(weak.grade);
      els.printPoint.innerHTML = pointOptionsHTML(weak.grade, weak.id);
      els.printPoint.value = weak.id;
      syncCustomSelects();
      generatePrintSheet();
    }
    function dailyPlanPrintQuestions(profile, grade, pointId, count) {
      const printOptions = availablePoints(grade);
      const strictPoint = pointId !== "auto";
      const wrongSource = currentGradeWrongbook(profile, grade)
        .filter((item) => !strictPoint || item.question.pointId === pointId)
        .sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0) || (a.correctStreak || 0) - (b.correctStreak || 0))
        .map((item) => ({
          ...item.question,
          printPlanTag: `错题复习 · ${item.cause || "未标记"}`,
          printCause: item.cause,
          printWrongCount: item.wrongCount
        }));
      const weakPoints = (strictPoint ? [pointMap[pointId]].filter(Boolean) : weakestPoints(4).filter((point) => point.grade === grade));
      const questions = wrongSource.slice(0, Math.min(Math.ceil(count * 0.35), 10));
      while (questions.length < Math.ceil(count * 0.72) && weakPoints.length) {
        const point = weakPoints[questions.length % weakPoints.length];
        questions.push({
          ...makeStrictQuestionForPoint(point, "input"),
          printPlanTag: `薄弱巩固 · ${point.label}`
        });
      }
      while (questions.length < count) {
        const point = strictPoint ? pointMap[pointId] : chooseAutoPoint(printOptions, false);
        questions.push({
          ...(strictPoint ? makeStrictQuestionForPoint(point || printOptions[0], "input") : makeQuestion(point || printOptions[0])),
          printPlanTag: strictPoint ? `专项检查 · ${pointLabel(pointId)}` : "混合检查"
        });
      }
      const wrongCount = questions.filter((q) => q.printCause).length;
      const weakLabel = weakPoints[0]?.label || (strictPoint ? pointLabel(pointId) : "按年级混合");
      state.printBlockedReason = `今日推荐卷已组合 ${wrongCount} 道错题复习、薄弱点"${weakLabel}"和混合检查题。`;
      return questions.slice(0, count);
    }
    function renderPrintSheet(count, perPage) {
      syncPrintPageStyle();
      const profile = activeProfile();
      const direction = els.paperDirection.value;
      const date = todayKey();
      const template = els.printTemplateSelect?.value || "practice";
      const templateClass = `template-${template}`;
      const templateTitle = {
        practice: "数学练习题单",
        "daily-plan": "今日推荐练习卷",
        exam: "数学限时练习卷",
        "wrong-review": "错题复习卷",
        explain: "数学练习讲解卷",
        "parent-sign": "数学家庭练习单"
      }[template] || "数学练习题单";
      if (!state.printQuestions.length) {
        els.printBtn.disabled = true;
        els.paperStage.innerHTML = `
          <article class="paper ${direction === "landscape" ? "landscape" : ""} ${templateClass}">
            <header class="paper-head">
              <div>
                <div class="paper-title">${gradeNames[(Number(els.printGrade.value) || 1) - 1]}${templateTitle}</div>
                <div class="paper-lines"><span>${escapeHTML(profile.name)}</span><span>${pointLabel(els.printPoint.value)}</span></div>
              </div>
              <div>未生成</div>
            </header>
            <div class="empty-state">
              ${escapeHTML(state.printBlockedReason || "当前筛选下没有可打印的题目。")}
              <div class="row-actions" style="margin-top:16px">
                <button class="secondary" type="button" data-empty-print-template="practice">改为普通练习卷</button>
                <button class="secondary" type="button" data-empty-print-point="auto">查看全年级错题</button>
              </div>
            </div>
          </article>`;
        els.paperStage.querySelector("[data-empty-print-template]")?.addEventListener("click", () => {
          els.printTemplateSelect.value = "practice";
          generatePrintSheet();
        });
        els.paperStage.querySelector("[data-empty-print-point]")?.addEventListener("click", () => {
          els.printPoint.value = "auto";
          generatePrintSheet();
        });
        return;
      }
      els.printBtn.disabled = false;
      const hasWord = state.printQuestions.some((q) => q.word);
      const density = printDensity(perPage, hasWord);
      const spaceClass = answerSpaceClass(perPage, hasWord);
      const actualPerPage = maxReadablePerPrintPage(perPage, hasWord, direction, spaceClass);
      const pages = [];
      for (let start = 0; start < state.printQuestions.length; start += actualPerPage) {
        pages.push({ start, questions: state.printQuestions.slice(start, start + actualPerPage) });
      }
      const rowMin = printRowMinHeight(hasWord, spaceClass);
      const requestedPages = Math.max(1, Math.ceil(state.printQuestions.length / perPage));
      const pageAdvice = `实际按 ${pages.length} 页导出，每页最多 ${actualPerPage} 题；不会强行压缩字号或裁切题目。`;
      const fitWarning = actualPerPage < perPage
        ? `<div class="print-fit-warning">当前题目内容过多，按每页 ${perPage} 题会导致字号过小或内容被裁切；${pageAdvice}</div>`
        : pages.length > requestedPages
          ? `<div class="print-fit-warning">当前题目内容较多，已按清晰可读的 A4 排版自动分页；${pageAdvice}</div>`
          : "";
      const supplementWarning = (template === "wrong-review" && state.printBlockedReason && state.printQuestions.some((q) => q.printSupplement)) || (template === "daily-plan" && state.printBlockedReason)
        ? `<div class="print-fit-warning">${escapeHTML(state.printBlockedReason)}</div>`
        : "";
      els.paperStage.innerHTML = `${fitWarning}${supplementWarning}${pages.map((page, pageIndex) => `
        <article class="paper ${direction === "landscape" ? "landscape" : ""} ${templateClass}">
          <header class="paper-head">
            <div>
              <div class="paper-title">${gradeNames[(Number(els.printGrade.value) || 1) - 1]}${templateTitle}</div>
              ${els.printNameLine.checked ? `<div class="paper-lines"><span>姓名：__________</span><span>班级：__________</span><span>日期：${date}</span><span>用时：__________</span></div>` : ""}
            </div>
            <div>第 ${pageIndex + 1} / ${pages.length} 页</div>
          </header>
          <div class="question-grid ${density} ${spaceClass}" style="--print-row-min:${rowMin}px;">
            ${page.questions.map((q, index) => `<div class="question-cell ${q.word ? "word" : ""}"><span class="q-no">${page.start + index + 1}</span><span class="q-text">${escapeHTML(q.text.replace("?", "______"))}${template === "wrong-review" && q.printCause ? `<br><small>${q.printSupplement ? "变式：" : "错因："}${escapeHTML(q.printCause)}${q.printSupplement ? "" : ` · 已错 ${Number(q.printWrongCount || 1)} 次`}</small>` : ""}${template === "daily-plan" && q.printPlanTag ? `<br><small>${escapeHTML(q.printPlanTag)}</small>` : ""}</span></div>`).join("")}
          </div>
          ${template === "parent-sign" ? `<div class="parent-sign-line"><span>家长签字：__________</span><span>订正情况：__________</span><span>鼓励一句：__________</span></div>` : ""}
          <footer class="mini-meta"><span>${escapeHTML(profile.name)}</span><span>本页 ${page.questions.length} 题</span><span>${pointLabel(els.printPoint.value)}</span></footer>
        </article>`).join("")}`;
      const outputMode = els.printExportMode?.value || "answers";
      const includeAnswers = outputMode === "answers" || outputMode === "explanations" || template === "explain";
      const includeExplanations = outputMode === "explanations" || template === "explain";
      if (includeAnswers) {
        const answersPerPage = direction === "landscape" ? 120 : 90;
        for (let start = 0; start < state.printQuestions.length; start += answersPerPage) {
          const answers = state.printQuestions.slice(start, start + answersPerPage);
          const answerPage = Math.floor(start / answersPerPage) + 1;
          const answerTotal = Math.ceil(state.printQuestions.length / answersPerPage);
          els.paperStage.insertAdjacentHTML("beforeend", `
          <article class="paper ${direction === "landscape" ? "landscape" : ""} ${templateClass}">
            <header class="paper-head"><div class="paper-title">参考答案</div><div>第 ${answerPage} / ${answerTotal} 页</div></header>
            <div class="answer-key">${answers.map((q, index) => `<div><span class="q-no">${start + index + 1}</span><span>${formatAnswer(q.answer, q.answerLabel)}</span></div>`).join("")}</div>
          </article>`);
        }
      }
      if (includeExplanations) {
        const explanationsPerPage = direction === "landscape" ? 36 : 28;
        for (let start = 0; start < state.printQuestions.length; start += explanationsPerPage) {
          const explanations = state.printQuestions.slice(start, start + explanationsPerPage);
          const explainPage = Math.floor(start / explanationsPerPage) + 1;
          const explainTotal = Math.ceil(state.printQuestions.length / explanationsPerPage);
          els.paperStage.insertAdjacentHTML("beforeend", `
          <article class="paper ${direction === "landscape" ? "landscape" : ""} ${templateClass}">
            <header class="paper-head"><div class="paper-title">简短解析</div><div>第 ${explainPage} / ${explainTotal} 页</div></header>
            <div class="explain-key">${explanations.map((q, index) => `<div><strong class="q-no">${start + index + 1}</strong> ${escapeHTML(q.explanation)}</div>`).join("")}</div>
          </article>`);
        }
      }
    }
    async function printCurrentSheet() {
      generatePrintSheet();
      await waitForPrintLayout();
      if (!state.printQuestions.length) {
        UI.notify(state.printBlockedReason || "当前没有可打印的题目。", { tone: "bad" });
        return;
      }
      const fitWarning = els.paperStage.querySelector(".print-fit-warning");
      if (fitWarning) UI.notify(fitWarning.textContent.trim(), { duration: 4600 });
      if (isAndroidWebView() && window.MathCampAndroid?.print) {
        window.MathCampAndroid.print("喵喵数学题单");
        return;
      }
      window.print();
    }

    async function addProfile() {
      const name = await UI.prompt("请输入学生姓名：", "新同学", { title: "新增学生", maxLength: 18 });
      if (!name) return;
      const beforeProfiles = [...state.profiles];
      const beforeActiveId = state.activeId;
      const profile = createProfile(name.trim().slice(0, 18), state.grade);
      state.profiles.push(profile);
      state.activeId = profile.id;
      if (!saveProfiles()) {
        state.profiles = beforeProfiles;
        state.activeId = beforeActiveId;
        saveProfiles();
        syncFromProfile();
        UI.notify("本地保存失败，学生档案没有新增。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      syncFromProfile();
      startNewSet();
      UI.notify("已新增学生档案。");
    }
    function openArchiveModal() {
      if (!els.archiveModal) return;
      els.archiveModal.hidden = false;
      els.archiveModal.classList.remove("is-closing");
      delete els.archiveModal.dataset.closeToken;
      document.body.classList.add("archive-modal-open");
    }
    function closeArchiveModal() {
      if (!els.archiveModal) return;
      closeWithMotion(els.archiveModal, () => {
        document.body.classList.remove("archive-modal-open");
        resetImportPreview();
      });
    }
    function readArchiveFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        els.importText.value = String(reader.result || "");
        resetImportPreview();
        UI.notify("备份文件已读取，可以点击导入。");
      });
      reader.addEventListener("error", () => {
        UI.notify("备份文件读取失败。", { tone: "bad" });
      });
      reader.readAsText(file, "utf-8");
    }
    function buildArchiveData() {
      return {
        version: 5,
        type: "miaomiao-math-complete-archive",
        format: "json",
        app: "miaomiao-math",
        platform: "cross-platform",
        compatibleWith: ["web", "android-webview", "ios-webview"],
        exportedAt: new Date().toISOString(),
        profiles: state.profiles.map(normalizeProfile).filter(Boolean),
        activeId: state.activeId
      };
    }
    function buildArchiveText() {
      return JSON.stringify(buildArchiveData(), null, 2);
    }
    function exportData() {
      const text = buildArchiveText();
      els.importText.value = text;
      resetImportPreview();
      const blob = new Blob([text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `miaomiao-math-complete-archive-${todayKey()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
    function resetImportPreview() {
      state.pendingImport = null;
      if (els.importPreview) {
        els.importPreview.hidden = true;
        els.importPreview.classList.remove("bad");
        els.importPreview.textContent = "";
      }
      if (els.importBtn) els.importBtn.textContent = "从文本导入完整存档";
    }
    function parseImportBackup() {
      const raw = els.importText.value || "";
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.profiles) || !data.profiles.length) throw new Error("格式不正确");
      const before = data.profiles.reduce((acc, profile) => {
        acc.profiles += 1;
        acc.wrong += Array.isArray(profile?.wrongbook) ? profile.wrongbook.length : 0;
        acc.mastered += Array.isArray(profile?.masteredWrong) ? profile.masteredWrong.length : 0;
        acc.history += Array.isArray(profile?.history) ? profile.history.length : 0;
        if (isPlainObject(profile?.rewards?.pet)) acc.pets += 1;
        return acc;
      }, { profiles: 0, wrong: 0, mastered: 0, history: 0, pets: 0 });
      const profiles = uniquifyRecordIds(data.profiles.map(normalizeProfile).filter(Boolean), "student");
      if (!profiles.length) throw new Error("没有有效学生档案");
      const activeId = profiles.some((profile) => profile.id === data.activeId) ? data.activeId : profiles[0].id;
      const wrongCount = profiles.reduce((sum, profile) => sum + profile.wrongbook.length, 0);
      const masteredCount = profiles.reduce((sum, profile) => sum + profile.masteredWrong.length, 0);
      const historyCount = profiles.reduce((sum, profile) => sum + profile.history.length, 0);
      const petCount = profiles.reduce((sum, profile) => sum + (isPlainObject(profile.rewards?.pet) ? 1 : 0), 0);
      const repairNotes = [];
      if (before.profiles !== profiles.length) repairNotes.push(`丢弃 ${before.profiles - profiles.length} 个无效学生档案`);
      if (before.wrong !== wrongCount) repairNotes.push(`修复/丢弃 ${before.wrong - wrongCount} 条异常错题`);
      if (before.mastered !== masteredCount) repairNotes.push(`修复/丢弃 ${before.mastered - masteredCount} 条已掌握错题记录`);
      if (before.history !== historyCount) repairNotes.push(`修复/丢弃 ${before.history - historyCount} 条异常练习记录`);
      return { raw, profiles, activeId, wrongCount, masteredCount, historyCount, petCount, repairNotes };
    }
    async function importData() {
      try {
        const pending = parseImportBackup();
        if (!state.pendingImport || state.pendingImport.raw !== pending.raw) {
          state.pendingImport = pending;
          if (els.importPreview) {
            els.importPreview.hidden = false;
            els.importPreview.classList.remove("bad");
            const repairCopy = pending.repairNotes.length ? `<br><span>已自动处理：${pending.repairNotes.map(escapeHTML).join("；")}。</span>` : "";
            els.importPreview.innerHTML = `将导入 <strong>${pending.profiles.length}</strong> 个学生档案、<strong>${pending.historyCount}</strong> 条练习记录、<strong>${pending.wrongCount}</strong> 条错题、<strong>${pending.masteredCount}</strong> 条已掌握记录、<strong>${pending.petCount}</strong> 份宠物养成数据。${repairCopy}<br>再次点击"确认导入"会覆盖当前本机数据。`;
          }
          els.importBtn.textContent = "确认导入";
          return;
        }
        const confirmed = await UI.confirm("确认用这份备份覆盖当前本机学习数据吗？", {
          title: "覆盖当前数据",
          confirmText: "确认导入",
          danger: true
        });
        if (!confirmed) return;
        const beforeProfiles = [...state.profiles];
        const beforeActiveId = state.activeId;
        const beforePending = state.pendingImport;
        state.profiles = pending.profiles;
        state.activeId = pending.activeId;
        state.pendingImport = null;
        if (!saveProfiles()) {
          state.profiles = beforeProfiles;
          state.activeId = beforeActiveId;
          state.pendingImport = beforePending || pending;
          saveProfiles();
          syncFromProfile();
          if (els.importPreview) {
            els.importPreview.hidden = false;
            els.importPreview.classList.add("bad");
            els.importPreview.textContent = "本地保存失败：导入没有覆盖当前数据。请先导出备份或清理浏览器存储后再试。";
          }
          els.importBtn.textContent = "确认导入";
          UI.notify("本地保存失败，导入没有覆盖当前数据。", { tone: "bad", duration: 5200 });
          return;
        }
        syncFromProfile();
        startNewSet();
        resetImportPreview();
        UI.notify("导入完成。");
      } catch (error) {
        if (els.importPreview) {
          els.importPreview.hidden = false;
          els.importPreview.classList.add("bad");
          els.importPreview.textContent = "导入失败：请检查备份文本是否完整。";
        }
        els.importBtn.textContent = "从文本导入完整存档";
        state.pendingImport = null;
      }
    }

    els.tabs.forEach((btn) => btn.addEventListener("click", () => {
      if (btn.dataset.view) {
        showView(btn.dataset.view);
        if (btn.dataset.view === "practice") setTypeSettingsOpen(false);
      }
    }));
    document.querySelectorAll("[data-top-mode-action]").forEach((btn) => btn.addEventListener("click", handleTopModeAction));
    document.querySelectorAll("[data-jump]").forEach((btn) => btn.addEventListener("click", () => {
      closeHubModals();
      showView(btn.dataset.jump);
    }));
    document.querySelectorAll("[data-open-learning]").forEach((btn) => btn.addEventListener("click", () => openHubModal(els.learningModal)));
    document.querySelectorAll("[data-open-learning-map]").forEach((btn) => btn.addEventListener("click", () => openLearningKnowledgeMap(activeProfile())));
    document.querySelectorAll("[data-close-learning]").forEach((btn) => btn.addEventListener("click", closeHubModals));
    document.querySelectorAll("[data-open-system]").forEach((btn) => btn.addEventListener("click", () => openHubModal(els.systemModal)));
    document.querySelectorAll("[data-close-system]").forEach((btn) => btn.addEventListener("click", closeHubModals));
    [els.learningModal, els.systemModal].forEach((modal) => {
      modal?.addEventListener("click", (event) => {
        if (event.target === modal) closeHubModals();
      });
    });
    document.querySelectorAll("[data-open-archive]").forEach((btn) => btn.addEventListener("click", () => {
      closeHubModals();
      openArchiveModal();
    }));
    document.querySelectorAll("[data-close-archive]").forEach((btn) => btn.addEventListener("click", closeArchiveModal));
    els.archiveModal?.addEventListener("click", (event) => {
      if (event.target === els.archiveModal) closeArchiveModal();
    });
    els.profileSelect.addEventListener("change", () => switchProfile(els.profileSelect.value));
    els.quickAddProfileBtn.addEventListener("click", addProfile);
    els.saveSystemProfileBtn?.addEventListener("click", saveSystemProfile);
    els.musicToggles.forEach((button) => button.addEventListener("click", toggleMusic));
    els.soundToggles.forEach((button) => button.addEventListener("click", toggleSound));
    els.themeSelects.forEach((select) => select.addEventListener("change", () => applyTheme(select.value)));
    els.themeOptions.forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.themeOption)));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".custom-select")) closeCustomSelects();
    });
    if (!isAndroidWebView()) {
      document.addEventListener("pointerdown", handleAudioGesture, true);
      document.addEventListener("touchstart", handleAudioGesture, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", handleAudioVisibility);
    window.addEventListener("pagehide", stopBackgroundMusic);
    if (!isAndroidWebView()) document.addEventListener("click", playButtonSound, true);
    els.pointSelect.addEventListener("change", () => {
      state.pointId = els.pointSelect.value;
      renderPointSelects();
    });
    els.answerModeSelect.addEventListener("change", () => {
      syncAnswerModeAvailability();
      state.answerMode = normalizeAnswerModeForViewport(els.answerModeSelect.value || "auto");
      els.answerModeSelect.value = state.answerMode;
      const profile = activeProfile();
      profile.settings = { ...(profile.settings || {}), answerMode: state.answerMode };
      saveProfiles();
      syncCustomSelects();
    });
    els.adaptiveToggle.addEventListener("change", () => { state.adaptive = els.adaptiveToggle.checked; });
    els.dailyGoalInput.addEventListener("change", () => {
      const profile = activeProfile();
      profile.settings = { ...(profile.settings || {}), dailyGoal: clamp(Number(els.dailyGoalInput.value) || 20, 5, 200) };
      els.dailyGoalInput.value = String(profile.settings.dailyGoal);
      saveProfiles();
      if (state.view === "report") renderReport();
    });
    els.startSetBtn.addEventListener("click", () => startNewSet({ focus: true }));
    els.homeStartPracticeBtn?.addEventListener("click", () => startNewSet({ focus: true }));
    els.startChallengeBtn?.addEventListener("click", startChallengeSet);
    els.backToSetupBtn.addEventListener("click", returnToPracticeSetup);
    els.closeTypeSettingsBtn?.addEventListener("click", closeTypeSettings);
    els.checkBtn.addEventListener("click", checkAnswer);
    els.nextBtn.addEventListener("click", nextQuestion);
    if (els.skipBtn) els.skipBtn.addEventListener("click", skipQuestion);
    if (els.showAnswerBtn) els.showAnswerBtn.addEventListener("click", showAnswerPopover);
    els.resetSetBtn.addEventListener("click", resetCurrentSet);
    els.similarBtn.addEventListener("click", () => {
      const current = state.currentSet[state.index];
      if (current) startPointSet(current.pointId, 3, "similar");
    });
    els.petEncourageBtn.addEventListener("click", () => {
      const profile = activeProfile();
      const pet = petState(profile);
      const limit = PET_CARE_LIMITS.encourage || { xp: 2, mood: 2, bond: 1 };
      const hasCareReward = consumePetCare(pet, "encourage");
      if (hasCareReward) {
        pet.xp += Number(limit.xp || 2);
        pet.mood = clamp(pet.mood + Number(limit.mood || 2), 0, 100);
        pet.bond = clamp(pet.bond + Number(limit.bond || 1), 0, 100);
      }
      pet.lastCareDate = todayKey();
      const lines = [
        ["招财：收到摸摸。我们慢慢来，先把题目里最重要的数字找出来。", "呼噜"],
        ["招财：先别急着算，先看清题目问的是什么。", "陪你"],
        ["招财：如果连错两题，我们就换成同类基础题稳一下。", "稳住"],
        ["招财：做完这一小轮，我会帮你把错题拆成步骤。", "加油"]
      ];
      const [message, bubble] = pick(lines);
      updatePetStatus(hasCareReward ? message : "招财：今天已经陪我玩够啦，继续练题会更有用。", hasCareReward ? bubble : "已满足");
      setPetAction("encourage", hasCareReward ? bubble : "陪你");
      playSound("meow");
      saveProfiles();
      renderPetSpace(profile);
    });
    els.petCharacterBtn?.addEventListener("click", () => {
      els.petEncourageBtn.click();
    });
    els.petRoomCatBtn?.addEventListener("click", () => {
      els.petEncourageBtn.click();
    });
    els.petHintBtn.addEventListener("click", () => {
      const current = state.currentSet[state.index];
      if (!current) return;
      state.stepHintOpen = true;
      const hint = methodHintFor(current);
      els.methodHint.textContent = hint;
      if (!isWaitingForCauseSave()) {
        renderAnswerModePanel(current);
      }
      updatePetStatus(`招财：这题属于"${pointLabel(current.pointId)}"。${hint}`, "提示");
      if (shouldUseMobilePetHintPopover()) openPetHintPopover(hint);
      setPetAction("hint", "提示");
    });
    els.mobilePetHintClose?.addEventListener("click", closePetHintPopover);
    els.challengeResultClose?.addEventListener("click", closeDesktopResultPopover);
    els.challengeResultOverlay?.addEventListener("click", function(e) { if (e.target === els.challengeResultOverlay || e.target.classList.contains("crs-backdrop")) closeDesktopResultPopover(); });
    els.petShopGrid?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-pet-buy]");
      if (btn) {
        buyPetItem(btn.dataset.petBuy);
        return;
      }
      const card = event.target.closest("[data-pet-detail]");
      if (card) showPetItemDetail(card.dataset.petDetail, "shop");
    });
    els.petShopGrid?.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-pet-detail]");
      if (!card) return;
      event.preventDefault();
      showPetItemDetail(card.dataset.petDetail, "shop");
    });
    els.openPetShopBtn?.addEventListener("click", () => openPetModal("shop"));
    els.openPetBagBtn?.addEventListener("click", () => openPetModal("bag"));
    els.openPetTaskBtn?.addEventListener("click", () => openPetModal("tasks"));
    els.openPetPlanBtn?.addEventListener("click", () => openPetModal("plan"));
    els.openPetDressupBtn?.addEventListener("click", () => openPetModal("dressup"));
    els.openPetAchievementBtn?.addEventListener("click", () => openPetModal("achievements"));
    document.querySelectorAll("[data-open-pet-modal]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openPetModal(button.dataset.openPetModal, { returnToPlan: Boolean(button.closest("#petPlanMenuModal")) });
      });
    });
    const handlePetPanelAction = (event) => {
      if (event.target.closest("#petShopGrid, #petBagList")) return;
      const openPetPanelBtn = event.target.closest("[data-open-pet-modal]");
      if (openPetPanelBtn) {
        openPetModal(openPetPanelBtn.dataset.openPetModal, { returnToPlan: Boolean(openPetPanelBtn.closest("#petPlanMenuModal")) });
        return;
      }
      const buyBtn = event.target.closest("[data-pet-buy]");
      if (buyBtn) {
        buyPetItem(buyBtn.dataset.petBuy);
        return;
      }
      const useBtn = event.target.closest("[data-pet-use]");
      if (useBtn) {
        usePetItem(useBtn.dataset.petUse);
        return;
      }
      const levelBtn = event.target.closest("[data-pet-claim-level]");
      if (levelBtn) {
        claimPetLevelReward(levelBtn.dataset.petClaimLevel);
        return;
      }
      const storyBtn = event.target.closest("[data-pet-claim-story]");
      if (storyBtn) {
        claimPetStoryReward(storyBtn.dataset.petClaimStory);
        return;
      }
      const achievementBtn = event.target.closest("[data-pet-claim-achievement]");
      if (achievementBtn) {
        claimPetAchievement(achievementBtn.dataset.petClaimAchievement);
        return;
      }
      const buyThemeBtn = event.target.closest("[data-pet-buy-theme]");
      if (buyThemeBtn) {
        buyPetCollection("theme", buyThemeBtn.dataset.petBuyTheme);
        return;
      }
      const equipThemeBtn = event.target.closest("[data-pet-equip-theme]");
      if (equipThemeBtn) {
        equipPetCollection("theme", equipThemeBtn.dataset.petEquipTheme);
        return;
      }
      const buyFurnitureBtn = event.target.closest("[data-pet-buy-furniture]");
      if (buyFurnitureBtn) {
        buyPetCollection("furniture", buyFurnitureBtn.dataset.petBuyFurniture);
        return;
      }
      const equipFurnitureBtn = event.target.closest("[data-pet-equip-furniture]");
      if (equipFurnitureBtn) {
        equipPetCollection("furniture", equipFurnitureBtn.dataset.petEquipFurniture);
        return;
      }
      const buyOutfitBtn = event.target.closest("[data-pet-buy-outfit]");
      if (buyOutfitBtn) {
        buyPetCollection("outfit", buyOutfitBtn.dataset.petBuyOutfit);
        return;
      }
      const equipOutfitBtn = event.target.closest("[data-pet-equip-outfit]");
      if (equipOutfitBtn) {
        equipPetCollection("outfit", equipOutfitBtn.dataset.petEquipOutfit);
        return;
      }
      const buySystemThemeBtn = event.target.closest("[data-buy-system-theme]");
      if (buySystemThemeBtn) {
        buySystemTheme(buySystemThemeBtn.dataset.buySystemTheme);
        return;
      }
      const useSystemThemeBtn = event.target.closest("[data-use-system-theme]");
      if (useSystemThemeBtn) {
        useSystemTheme(useSystemThemeBtn.dataset.useSystemTheme);
        return;
      }
      const eventUseBtn = event.target.closest("[data-pet-event-use]");
      if (eventUseBtn) {
        resolvePetEventWithItem(eventUseBtn.dataset.petEventUse);
        return;
      }
      if (event.target.closest("[data-pet-event-practice]")) {
        startPetEventPractice();
        return;
      }
      if (event.target.closest("[data-pet-wish-practice]")) {
        const pet = petState(activeProfile());
        const wish = currentPetWish(pet);
        const left = Math.max(3, (Number(wish?.practiceTarget) || 5) - (Number(pet.wish?.progress) || 0));
        closePetModals();
        startPointSet(state.pointId === "auto" ? choosePoint().id : state.pointId, Math.min(12, left), "pet-wish");
        return;
      }
      if (event.target.closest("[data-pet-story-practice]")) {
        startPetStoryPractice();
      }
    };
    els.petspaceView?.addEventListener("click", handlePetPanelAction);
    els.petCarePanelModal?.addEventListener("click", handlePetPanelAction);
    els.petGrowthPanelModal?.addEventListener("click", handlePetPanelAction);
    els.petPlanMenuModal?.addEventListener("click", handlePetPanelAction);
    els.petShopModal?.addEventListener("click", handlePetPanelAction);
    els.petDressupModal?.addEventListener("click", handlePetPanelAction);
    els.petThemeShopModal?.addEventListener("click", handlePetPanelAction);
    els.petAchievementModal?.addEventListener("click", handlePetPanelAction);
    [els.petShopModal, els.petBagModal, els.petTaskModal, els.petCarePanelModal, els.petGrowthPanelModal, els.petPlanMenuModal, els.petDressupModal, els.petThemeShopModal, els.petAchievementModal].forEach((modal) => {
      modal?.addEventListener("click", (event) => {
        if (event.target === modal || event.target.closest("[data-close-pet-modal]")) closePetModalWithReturn(modal);
        if (event.target.closest("[data-close-pet-detail]")) hidePetItemDetails();
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (!els.petShopModal?.hidden || !els.petBagModal?.hidden || !els.petTaskModal?.hidden || !els.petCarePanelModal?.hidden || !els.petGrowthPanelModal?.hidden || !els.petPlanMenuModal?.hidden || !els.petDressupModal?.hidden || !els.petThemeShopModal?.hidden || !els.petAchievementModal?.hidden)) {
        const modal = [els.petShopModal, els.petBagModal, els.petTaskModal, els.petCarePanelModal, els.petGrowthPanelModal, els.petPlanMenuModal, els.petDressupModal, els.petThemeShopModal, els.petAchievementModal].find((item) => item && !item.hidden);
        closePetModalWithReturn(modal);
      }
      if (event.key === "Escape" && (!els.learningModal?.hidden || !els.systemModal?.hidden)) closeHubModals();
      if (event.key === "Escape" && !els.archiveModal?.hidden) closeArchiveModal();
    });
    els.petBagList?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-pet-use]");
      if (btn) {
        usePetItem(btn.dataset.petUse);
        return;
      }
      const card = event.target.closest("[data-pet-detail]");
      if (card) showPetItemDetail(card.dataset.petDetail, "bag");
    });
    els.petBagList?.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-pet-detail]");
      if (!card) return;
      event.preventDefault();
      showPetItemDetail(card.dataset.petDetail, "bag");
    });
    els.petRunawayNotice?.addEventListener("click", (event) => {
      if (event.target.closest("[data-pet-start-rescue]")) {
        showView("practice");
        startNewSet({ focus: true });
      }
      if (event.target.closest("[data-pet-readopt]")) readoptPet();
    });
    els.views.tasks?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-pet-task-id]");
      if (!btn) return;
      claimPetTask(btn.dataset.petTaskPeriod, btn.dataset.petTaskId);
    });
    els.petTaskModal?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-pet-task-id]");
      if (!btn) return;
      claimPetTask(btn.dataset.petTaskPeriod, btn.dataset.petTaskId);
    });
    els.confirmRenamePetBtn?.addEventListener("click", renamePet);
    els.cancelRenamePetBtn?.addEventListener("click", () => {
      if (els.petRenameCard) els.petRenameCard.hidden = true;
    });
    els.petNameInput?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        renamePet();
      }
    });
    els.appendixBtn.addEventListener("click", () => {
      const point = appendixPointForGrade(state.grade);
      startPointSet(point.id, Math.min(8, state.setSize), "appendix");
    });
    els.hardWordBtn.addEventListener("click", () => {
      const point = wordPointForGrade(state.grade);
      startPointSet(point.id, Math.min(8, state.setSize), "hard-word");
    });
    els.answerInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        if (state.checked) nextQuestion();
        else checkAnswer();
      }
    });
    els.numberPad.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-key]");
      if (!btn || els.answerInput.disabled) return;
      const key = btn.dataset.key;
      playKeySound(key);
      if (key === "⌫") {
        els.answerInput.value = els.answerInput.value.slice(0, -1);
      } else if (key === "清空") {
        els.answerInput.value = "";
      } else if (key === ".") {
        if (!els.answerInput.value.includes(".")) els.answerInput.value += ".";
      } else if (key === "/") {
        if (!els.answerInput.value.includes("/")) els.answerInput.value += "/";
      } else if (key === "-") {
        els.answerInput.value = els.answerInput.value.startsWith("-") ? els.answerInput.value.slice(1) : `-${els.answerInput.value}`;
      } else {
        els.answerInput.value += key;
      }
      if (!isCompactPracticeViewport()) {
        els.answerInput.focus({ preventScroll: true });
      }
    });
    els.saveCauseBtn.addEventListener("click", saveCurrentCause);
    els.causeQuickTags?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-cause-chip]");
      if (!btn) return;
      els.causeSelect.value = btn.dataset.causeChip;
      renderCauseQuickTags(state.currentSet[state.index]);
      syncCustomSelects();
      saveCurrentCause();
    });
    els.causeSelect.addEventListener("change", () => renderCauseQuickTags(state.currentSet[state.index]));
    els.homeStartWeakBtn?.addEventListener("click", startWeakPractice);
    els.homeStartTimedBtn?.addEventListener("click", startTimedQuizSet);
    els.homeStartChallengeBtn?.addEventListener("click", startChallengeSet);
    document.querySelectorAll("[data-start-challenge]").forEach((btn) => btn.addEventListener("click", startChallengeSet));
    document.querySelectorAll("[data-start-timed]").forEach((btn) => btn.addEventListener("click", startTimedQuizSet));
    els.startTimedQuizBtn?.addEventListener("click", startTimedQuizSet);
    els.practiceWrongAllBtn.addEventListener("click", () => startWrongbookPractice());
    els.practiceWeakBtn.addEventListener("click", startWeakPractice);
    els.deleteSelectedBtn.addEventListener("click", () => {
      const ids = [...els.wrongbookList.querySelectorAll("input[type='checkbox']:checked")].map((input) => input.value);
      if (ids.length) deleteWrongItems(ids);
    });
    [els.wrongPointFilter, els.wrongCauseFilter].forEach((control) => control.addEventListener("change", renderWrongbook));
    els.startWeakReportBtn.addEventListener("click", startWeakPractice);
    els.clearTodayBtn.addEventListener("click", async () => {
      const profile = activeProfile();
      const today = profile.history.filter((item) => item.date === todayKey());
      if (!today.length) {
        UI.notify("今天还没有练习记录。", { tone: "bad" });
        return;
      }
      const confirmed = await UI.confirm(`确定清空今天的 ${today.length} 条练习记录吗？`, {
        title: "清空今日记录",
        confirmText: "清空",
        danger: true
      });
      if (!confirmed) return;
      const before = [...profile.history];
      profile.history = profile.history.filter((item) => item.date !== todayKey());
      if (!saveProfiles()) {
        profile.history = before;
        saveProfiles();
        renderReport();
        UI.notify("本地保存失败，今日记录没有清空。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      renderReport();
      UI.notify(`已清空今天的 ${today.length} 条记录。`, {
        actionText: "撤销",
        duration: 5200,
        onAction: () => {
          const afterClear = [...profile.history];
          profile.history = before;
          if (!saveProfiles()) {
            profile.history = afterClear;
            saveProfiles();
            UI.notify("本地保存失败，撤销没有完成。请先导出备份。", { tone: "bad", duration: 4200 });
          }
          renderReport();
        }
      });
    });
    els.printGrade.addEventListener("change", () => {
      els.printPoint.innerHTML = pointOptionsHTML(Number(els.printGrade.value), "auto");
      syncCustomSelects();
      generatePrintSheet();
    });
    [els.printPoint, els.printCount, els.perPageInput, els.paperDirection, els.printTemplateSelect, els.printExportMode, els.printNameLine, els.answerSpaceSelect].filter(Boolean).forEach((control) => {
      control.addEventListener("change", generatePrintSheet);
    });
    els.printPresets.querySelectorAll("[data-per-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        els.perPageInput.value = btn.dataset.perPage;
        generatePrintSheet();
      });
    });
    els.generatePrintBtn.addEventListener("click", generatePrintSheet);
    els.printWeakBtn.addEventListener("click", generateWeakPrintSheet);
    els.printBtn.addEventListener("click", printCurrentSheet);
    els.saveProfileBtn.addEventListener("click", () => {
      const profile = activeProfile();
      const before = { name: profile.name, grade: profile.grade, stateGrade: state.grade };
      profile.name = (els.profileNameInput.value || profile.name).trim().slice(0, 18);
      profile.grade = clamp(Number(els.profileGradeInput.value) || profile.grade, 1, 6);
      state.grade = profile.grade;
      if (!saveProfiles()) {
        profile.name = before.name;
        profile.grade = before.grade;
        state.grade = before.stateGrade;
        saveProfiles();
        syncFromProfile();
        UI.notify("本地保存失败，学生资料没有修改。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      syncFromProfile();
      startNewSet();
      UI.notify("学生资料已保存。");
    });
    els.addProfileBtn.addEventListener("click", addProfile);
    els.deleteProfileBtn.addEventListener("click", async () => {
      if (state.profiles.length <= 1) {
        UI.notify("至少保留一个学生档案。", { tone: "bad" });
        return;
      }
      const confirmed = await UI.confirm("确定删除当前学生档案和数据吗？", {
        title: "删除学生档案",
        confirmText: "删除",
        danger: true
      });
      if (!confirmed) return;
      const beforeProfiles = [...state.profiles];
      const beforeActiveId = state.activeId;
      state.profiles = state.profiles.filter((profile) => profile.id !== state.activeId);
      state.activeId = state.profiles[0].id;
      if (!saveProfiles()) {
        state.profiles = beforeProfiles;
        state.activeId = beforeActiveId;
        saveProfiles();
        syncFromProfile();
        UI.notify("本地保存失败，学生档案没有删除。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      syncFromProfile();
      startNewSet();
      UI.notify("已删除当前学生档案。");
    });
    els.exportBtn.addEventListener("click", exportData);
    els.copyExportBtn.addEventListener("click", async () => {
      if (!els.importText.value) {
        els.importText.value = buildArchiveText();
        resetImportPreview();
      }
      try {
        await navigator.clipboard.writeText(els.importText.value);
        UI.notify("完整存档文本已复制。");
      } catch (_) {
        UI.notify("复制失败，可以手动选中文本复制。", { tone: "bad" });
      }
    });
    els.chooseArchiveFileBtn?.addEventListener("click", () => els.importFileInput?.click());
    els.importFileInput?.addEventListener("change", () => {
      readArchiveFile(els.importFileInput.files?.[0]);
      els.importFileInput.value = "";
    });
    els.importBtn.addEventListener("click", importData);
    els.importText.addEventListener("input", resetImportPreview);
    els.ruleCheckBtn?.addEventListener("click", runRuleCheckFromUI);
    els.clearAllBtn.addEventListener("click", async () => {
      const confirmed = await UI.confirm("确定清空所有学生档案、错题和学习记录吗？", {
        title: "清空全部数据",
        confirmText: "清空",
        danger: true
      });
      if (!confirmed) return;
      const beforeProfiles = [...state.profiles];
      const beforeActiveId = state.activeId;
      state.profiles = [createProfile("小学生", 1)];
      state.activeId = state.profiles[0].id;
      if (!saveProfiles()) {
        state.profiles = beforeProfiles;
        state.activeId = beforeActiveId;
        saveProfiles();
        syncFromProfile();
        UI.notify("本地保存失败，全部数据没有清空。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
      syncFromProfile();
      startNewSet();
      UI.notify("已清空并重建默认学生档案。");
    });

    var supabaseUrlEl = document.getElementById("supabaseUrl");
    var supabaseAnonKeyEl = document.getElementById("supabaseAnonKey");
    var syncCodeInputEl = document.getElementById("syncCodeInput");
    var saveSupabaseConfigBtnEl = document.getElementById("saveSupabaseConfigBtn");
    var syncNowBtnEl = document.getElementById("syncNowBtn");
    if (supabaseUrlEl && window.MathCampCloudSync) {
      var savedCfg = window.MathCampCloudSync.getConfig();
      if (savedCfg) {
        supabaseUrlEl.value = savedCfg.url || "";
        supabaseAnonKeyEl.value = savedCfg.anonKey || "";
      }
      var savedSyncCode = window.MathCampCloudSync.getSyncCode();
      if (syncCodeInputEl && savedSyncCode) {
        syncCodeInputEl.value = savedSyncCode;
      }
    }
    saveSupabaseConfigBtnEl?.addEventListener("click", async () => {
      var url = supabaseUrlEl?.value?.trim();
      var anonKey = supabaseAnonKeyEl?.value?.trim();
      var syncCode = syncCodeInputEl?.value?.trim() || "";
      if (!url || !anonKey) {
        UI.notify("请填写 Supabase URL 和 Anon Key。", { tone: "bad" });
        return;
      }
      if (!url.startsWith("http")) url = "https://" + url;
      if (!url.endsWith(".supabase.co")) {
        UI.notify("URL 格式应为 https://xxxxx.supabase.co", { tone: "bad" });
        return;
      }
      var config = { url: url, anonKey: anonKey };
      window.MathCampCloudSync.saveConfig(config);
      window.MathCampCloudSync.setSyncCode(syncCode);
      var ok = await window.MathCampCloudSync.initSupabase(config);
      if (ok) {
        UI.notify("云端同步已启用。");
        var result = await window.MathCampCloudSync.fullSync(state.profiles, state.activeId);
        if (result.changed) {
          state.profiles = result.profiles;
          if (result.activeId) state.activeId = result.activeId;
          saveProfiles();
          renderChrome();
          UI.notify("云端数据已同步到本地。");
        }
        window.MathCampCloudSync.onSyncStatus(updateCloudSyncStatus);
      } else {
        UI.notify("初始化失败，请检查配置并确认已执行建表 SQL。", { tone: "bad" });
      }
    });
    syncNowBtnEl?.addEventListener("click", async () => {
      if (!window.MathCampCloudSync?.isSyncEnabled()) {
        UI.notify("请先保存 Supabase 配置。", { tone: "bad" });
        return;
      }
      UI.notify("正在同步…");
      var result = await window.MathCampCloudSync.fullSync(state.profiles, state.activeId);
      if (result.changed) {
        state.profiles = result.profiles;
        if (result.activeId) state.activeId = result.activeId;
        saveProfiles();
        renderChrome();
        UI.notify("同步完成，云端数据已合并。");
      } else {
        UI.notify("已是最新，无需同步。");
      }
    });

    applyTheme(state.theme, { save: false });
    document.body.classList.toggle("practice-view-active", state.view === "practice");
    syncCompactOnlyFeatures();
    updateSoundButtons();
    renderNumberPad();
    syncFromProfile();
    startNewSet();
    if (!isAndroidWebView()) generatePrintSheet();
    initCloudSync();
    if (state.musicOn) {
      startBackgroundMusic();
    }
    window.addEventListener("resize", () => {
      closeCustomSelects();
      syncCompactOnlyFeatures();
      const before = state.answerMode;
      syncAnswerModeAvailability();
      state.answerMode = normalizeAnswerModeForViewport(state.answerMode);
      if (before !== state.answerMode) {
        els.answerModeSelect.value = state.answerMode;
        renderPracticeQuestion();
      }
      syncCustomSelects();
    });
    window.mathCampSelfTest = runQuestionRuleSelfTest;
    window.mathCampQualityAudit = runQuestionQualityAudit;
    if (window.__MATHCAMP_TEST__) {
      window.mathCampDebug = {
        normalizeProfile,
        challengeProgress,
        dailyPlanPrintQuestions,
        generatePrintSheet,
        buildArchiveData,
        parseImportBackup,
        petState,
        petTaskState,
        petShopCatalog: PET_SHOP,
        petDailyTasks: PET_DAILY_TASKS,
        petWeeklyTasks: PET_WEEKLY_TASKS,
        petCareLeft,
        consumePetCare,
        petGrowthStage,
        petCopy,
        petWishes: PET_WISHES,
        petSkills: PET_SKILLS,
        petLevelRewards: PET_LEVEL_REWARDS,
        petRoomThemes: PET_ROOM_THEMES,
        petFurniture: PET_FURNITURE,
        petOutfits: PET_OUTFITS,
        petAchievements: PET_ACHIEVEMENTS,
        petRandomEvents: PET_RANDOM_EVENTS,
        petStoryChapters: PET_STORY_CHAPTERS,
        currentPetWish,
        currentPetEvent,
        advancePetProgressFromQuestion,
        pendingPetLevelRewards,
        claimPetLevelReward,
        claimPetTask,
        claimPetStoryReward,
        resolvePetEventWithItem,
        resolvePetEvent,
        claimPetAchievement,
        buyPetCollection,
        equipPetCollection,
        buySystemTheme,
        useSystemTheme,
        systemThemeOwned,
        grantSystemTheme,
        renderPetThemeShop,
        petAchievementState,
        latestProfileActivityTime,
        awardQuestionReward,
        safeThemeId,
        themeRegistry: THEME_REGISTRY,
        currentWeekItems,
        renderChrome,
        renderPetSpace,
        renderWrongbook,
        saveProfiles,
        makeQuestion,
        makeStrictQuestionForPoint,
        buildQuestionSetForPoint,
        startNewSet,
        applyQuestionInteraction,
        questionRuleIssues,
        interactionRuleIssues,
        runQuestionQualityAudit,
        parseNumericAnswer,
        todayKey,
        availablePoints,
        pointMap,
        state,
        els
      };
    }

    // 全局点击涟漪特效
    (function initRippleEffect() {
      const rippleContainer = document.getElementById('rippleContainer');
      if (!rippleContainer) return;

      let lastTouchTime = 0;

      function createRipple(x, y) {
        // 创建主涟漪
        const mainRipple = document.createElement('div');
        mainRipple.className = 'ripple-effect ripple-main';
        mainRipple.style.left = x + 'px';
        mainRipple.style.top = y + 'px';
        rippleContainer.appendChild(mainRipple);

        // 创建波纹环
        const waveRipple = document.createElement('div');
        waveRipple.className = 'ripple-effect ripple-wave';
        waveRipple.style.left = x + 'px';
        waveRipple.style.top = y + 'px';
        rippleContainer.appendChild(waveRipple);

        // 创建粒子效果（8个方向）
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2;
          const distance = 60 + Math.random() * 40;
          const particleX = Math.cos(angle) * distance;
          const particleY = Math.sin(angle) * distance;

          const particle = document.createElement('div');
          particle.className = 'ripple-effect ripple-particle';
          particle.style.left = x + 'px';
          particle.style.top = y + 'px';
          particle.style.setProperty('--particle-x', particleX + 'px');
          particle.style.setProperty('--particle-y', particleY + 'px');
          particle.style.animationDelay = (i * 0.03) + 's';
          rippleContainer.appendChild(particle);

          // 清理粒子
          setTimeout(() => {
            if (particle.parentNode === rippleContainer) {
              rippleContainer.removeChild(particle);
            }
          }, 700 + (i * 30));
        }

        // 清理主涟漪和波纹
        setTimeout(() => {
          if (mainRipple.parentNode === rippleContainer) {
            rippleContainer.removeChild(mainRipple);
          }
          if (waveRipple.parentNode === rippleContainer) {
            rippleContainer.removeChild(waveRipple);
          }
        }, 900);
      }

      // 监听触摸和点击事件，防止移动端重复触发
      document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          createRipple(touch.clientX, touch.clientY);
          lastTouchTime = Date.now();
        }
      }, { passive: true });

      document.addEventListener('click', (e) => {
        // 移动端touchstart已触发过则跳过click
        if (Date.now() - lastTouchTime < 300) return;
        createRipple(e.clientX, e.clientY);
      });
    })();



