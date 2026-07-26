const STORE = {
      profiles: "mathcamp-profiles-v4",
      active: "mathcamp-active-profile-v4",
      music: "mathcamp-music-enabled-v4",
      sound: "mathcamp-sound-enabled-v4",
      theme: "mathcamp-theme-v1",
      subject: "mathcamp-selected-subject-v1",
      floatingPet: "mathcamp-floating-pet-position-v1",
      system: "mathcamp-system-settings-v1"
    };
    const MAX_SET_SIZE = 100;
    // 本地存储连续写入失败次数，用于在配额耗尽时触发一次自动备份引导。
    const LOCAL_SAVE_FAILURE_ALERT_THRESHOLD = 2;
    let localSaveFailureStreak = 0;
    let localSaveBackupPromptShown = false;
    // 本地档案改动计数：云同步用它检测“覆盖窗口”内是否有新的本地写入，避免整表替换丢数据。
    let localProfileMutationVersion = 0;
    // 高频保存防抖：答题等热点路径用 scheduleSaveProfiles 合并多次写入，减少主线程阻塞。
    const SAVE_DEBOUNCE_MS = 400;
    let saveProfilesTimer = null;
    const SubjectRegistry = window.MathCampSubjects || {};
    const LearningQuality = window.MathCampLearningQuality || {};
    const SUBJECTS = Object.freeze(SubjectRegistry.SUBJECT_META || {
      chinese: { label: "语文", short: "语", icon: "文", metaColor: "#c66b3d", themeLabel: "纸页阅读", themeCopy: "阅读、写作、古诗文会使用更温暖的纸页色和文字符号。" },
      math: { label: "数学", short: "数", icon: "数", metaColor: "#3aa47c", themeLabel: "清爽计算", themeCopy: "计算、应用、图形保持清亮绿色和算式符号。" },
      english: { label: "英语", short: "英", icon: "En", metaColor: "#4f7ed8", themeLabel: "蓝调语言", themeCopy: "词汇、句型、阅读会使用轻快蓝色和字母提示。" },
      science: { label: "科学", short: "科", icon: "科", metaColor: "#2f9b87", themeLabel: "实验探究", themeCopy: "观察、实验、探究会使用自然青绿和实验符号。" }
    });
    const EFFECT_SETTING_KEYS = Object.freeze([
      "cursorEffects",
      "seasonEffects",
      "themeBackgrounds",
      "catInteraction",
      "questionEnhancements",
      "microInteractions",
      "uiAnimations",
      "rewardParticles",
      "focusBlur",
      "ambientAnimations"
    ]);
    const THEME_REGISTRY = {
      classic: { label: "经典", icon: "🌿", metaColor: "#3aa47c", desc: "清爽稳定的默认主题。", initial: true },
      "eye-care": { label: "护眼", icon: "🍃", metaColor: "#6c9a57", desc: "柔和绿调，适合长时间练习。", initial: true },
      anime: { label: "二次元", icon: "🌸", metaColor: "#d85ca6", desc: "轻快明亮的卡通配色。", initial: true },
      "glass-clear": { label: "清透玻璃", icon: "🫧", metaColor: "#43b9ad", desc: "浅青薄荷柔光，清透安静的毛玻璃。", initial: true },
      "glass-pop": { label: "缤纷玻璃", icon: "🎨", metaColor: "#ef5f78", desc: "鲜艳卡通色彩与多层柔光毛玻璃。", initial: true },
      purple: { label: "紫色", icon: "💜", metaColor: "#8b5cf6", desc: "梦幻紫色学习桌。", unlockLevel: 3, price: 70 },
      rainbow: { label: "彩虹", icon: "🌈", metaColor: "#ff8a4c", desc: "多彩但不刺眼，适合低年级。", unlockLevel: 4, price: 95 },
      forest: { label: "森林", icon: "🌳", metaColor: "#287a55", desc: "像在小森林里安静做题。", unlockLevel: 5, price: 120 },
      ocean: { label: "海洋", icon: "🌊", metaColor: "#2f92c9", desc: "清亮蓝绿，像海边课堂。", unlockLevel: 7, price: 145 },
      candy: { label: "糖果", icon: "🍬", metaColor: "#df5f8f", desc: "甜甜的儿童感配色。", unlockLevel: 8, price: 160 },
      storybook: { label: "童话书", icon: "📖", metaColor: "#c97a38", desc: "温暖纸张和故事书色调。", unlockLevel: 10, price: 190 },
      star: { label: "星空", icon: "🌙", metaColor: "#334eb8", desc: "明亮星空，不使用深色背景。", unlockLevel: 12, price: 230 },
      playground: { label: "游乐场", icon: "🎈", metaColor: "#e45f6b", desc: "活泼红蓝黄，适合奖励阶段。", unlockLevel: 15, price: 280 }
    };
    const INITIAL_SYSTEM_THEME_IDS = Object.freeze(Object.keys(THEME_REGISTRY).filter((id) => THEME_REGISTRY[id].initial));
    const SYSTEM_THEME_IDS = Object.freeze(Object.keys(THEME_REGISTRY));
    const Storage = window.MathCampStorage;
    const PrintLayout = window.MathCampPrintLayout;
    const UI = window.MathCampUIFeedback;
    const PetEconomy = window.MathCampPetEconomy || {};
    const PetExperience = window.MathCampPetExperience || {};
    const HomeRoute = window.MathCampHomeRoute || {};
    const PetDressupMeta = window.MathCampPetDressupMeta || {};
    const LearningInsights = window.MathCampLearningInsights || {};
    const QuestionBankCoverage = window.MathCampQuestionBankCoverage || {};
    const QuestionSourceSummary = window.MathCampQuestionSourceSummary || {};
    const { grades, gradeNames, causes, causeTagsByTopic, gradeCurriculum, points, pointMap } = window.MathCampQuestionBank;
    const isAndroidWebView = () => document.documentElement.classList.contains("android-webview");
    const isLowMotionMode = () => isAndroidWebView();
    function effectSettingEnabled(key) {
      if (window.MathCampRuntime?.effectSettingEnabled) return window.MathCampRuntime.effectSettingEnabled(key);
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
      { id: "wrong-cleaner", title: "错题清理员", desc: "至少一题完成四次间隔复习后自动移除。", test: (p) => (p.rewards?.clearedWrong || 0) >= 1 },
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
      todayDueReview: (profile) => todayItems(profile).filter((item) => item.mode === "due-review").length,
      todayTimedQuiz: (profile) => todayItems(profile).filter((item) => item.mode === "timed").length ? 1 : 0,
      learningDays: (profile) => learningDaysFor(profile),
      weekWrongReview: (profile) => currentWeekItems(profile).filter((item) => item.mode === "wrongbook").length,
      weekDueReview: (profile) => currentWeekItems(profile).filter((item) => item.mode === "due-review").length,
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
        bank: document.getElementById("bankView")
      },
      wrongCountPill: document.getElementById("wrongCountPill"),
      todayPill: document.getElementById("todayPill"),
      petCoinPill: document.getElementById("petCoinPill"),
      homePlanCopy: document.getElementById("homePlanCopy"),
      homeCockpitMeter: document.getElementById("homeCockpitMeter"),
      homePlanMix: document.getElementById("homePlanMix"),
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
      desktopOverviewLevel: document.getElementById("desktopOverviewLevel"),
      desktopOverviewStudent: document.getElementById("desktopOverviewStudent"),
      desktopOverviewPlan: document.getElementById("desktopOverviewPlan"),
      desktopOverviewDone: document.getElementById("desktopOverviewDone"),
      desktopOverviewAccuracy: document.getElementById("desktopOverviewAccuracy"),
      desktopOverviewSetSize: document.getElementById("desktopOverviewSetSize"),
      desktopOverviewDays: document.getElementById("desktopOverviewDays"),
      desktopOverviewChallengeBadge: document.getElementById("desktopOverviewChallengeBadge"),
      desktopOverviewChallenge: document.getElementById("desktopOverviewChallenge"),
      desktopOverviewChallengeDetail: document.getElementById("desktopOverviewChallengeDetail"),
      desktopOverviewWrongBadge: document.getElementById("desktopOverviewWrongBadge"),
      desktopOverviewWeakCount: document.getElementById("desktopOverviewWeakCount"),
      desktopOverviewWeakList: document.getElementById("desktopOverviewWeakList"),
      desktopOverviewPetBadge: document.getElementById("desktopOverviewPetBadge"),
      desktopOverviewPet: document.getElementById("desktopOverviewPet"),
      desktopOverviewPetDetail: document.getElementById("desktopOverviewPetDetail"),
      desktopOverviewParent: document.getElementById("desktopOverviewParent"),
      desktopOverviewParentDetail: document.getElementById("desktopOverviewParentDetail"),
      desktopOverviewReportBadge: document.getElementById("desktopOverviewReportBadge"),
      desktopOverviewReport: document.getElementById("desktopOverviewReport"),
      desktopOverviewReportDetail: document.getElementById("desktopOverviewReportDetail"),
      desktopOverviewNext: document.getElementById("desktopOverviewNext"),
      desktopOverviewNextDetail: document.getElementById("desktopOverviewNextDetail"),
      desktopOverviewStartBtn: document.getElementById("desktopOverviewStartBtn"),
      desktopOverviewGoalPercent: document.getElementById("desktopOverviewGoalPercent"),
      desktopOverviewGoalBar: document.getElementById("desktopOverviewGoalBar"),
      desktopOverviewLearningBoard: document.getElementById("desktopOverviewLearningBoard"),
      desktopOverviewStudyList: document.getElementById("desktopOverviewStudyList"),
      desktopOverviewChallengeToday: document.getElementById("desktopOverviewChallengeToday"),
      desktopOverviewChallengeBest: document.getElementById("desktopOverviewChallengeBest"),
      desktopOverviewChallengeList: document.getElementById("desktopOverviewChallengeList"),
      desktopOverviewDueWrong: document.getElementById("desktopOverviewDueWrong"),
      desktopOverviewWrongRate: document.getElementById("desktopOverviewWrongRate"),
      desktopOverviewWrongList: document.getElementById("desktopOverviewWrongList"),
      desktopOverviewWeakTips: document.getElementById("desktopOverviewWeakTips"),
      desktopOverviewWeakBoard: document.getElementById("desktopOverviewWeakBoard"),
      desktopOverviewPetCoins: document.getElementById("desktopOverviewPetCoins"),
      desktopOverviewPetMood: document.getElementById("desktopOverviewPetMood"),
      desktopOverviewPetItems: document.getElementById("desktopOverviewPetItems"),
      desktopOverviewPetBond: document.getElementById("desktopOverviewPetBond"),
      desktopOverviewPetList: document.getElementById("desktopOverviewPetList"),
      desktopOverviewWeekCount: document.getElementById("desktopOverviewWeekCount"),
      desktopOverviewMastered: document.getElementById("desktopOverviewMastered"),
      desktopOverviewReportList: document.getElementById("desktopOverviewReportList"),
      desktopOverviewNextList: document.getElementById("desktopOverviewNextList"),
      gradeTag: document.getElementById("gradeTag"),
      pointTag: document.getElementById("pointTag"),
      modeTag: document.getElementById("modeTag"),
      questionText: document.getElementById("questionText"),
      questionDiagram: document.getElementById("questionDiagram"),
      answerInput: document.getElementById("answerInput"),
      answerControlSlot: document.getElementById("answerControlSlot"),
      numberPad: document.getElementById("numberPad"),
      answerModePanel: document.getElementById("answerModePanel"),
      confidenceControl: document.getElementById("confidenceControl"),
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
      floatingPetAssistant: document.getElementById("floatingPetAssistant"),
      floatingPetButton: document.getElementById("floatingPetButton"),
      floatingPetBadge: document.getElementById("floatingPetBadge"),
      floatingPetPanel: document.getElementById("floatingPetPanel"),
      floatingPetTitle: document.getElementById("floatingPetTitle"),
      floatingPetMessage: document.getElementById("floatingPetMessage"),
      floatingPetExtra: document.getElementById("floatingPetExtra"),
      floatingPetClose: document.getElementById("floatingPetClose"),
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
      openPetThemeShopBtn: document.getElementById("openPetThemeShopBtn"),
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
      petCatOutfit: document.getElementById("petCatOutfit"),
      petCatExpression: document.getElementById("petCatExpression"),
      petRoomProps: document.getElementById("petRoomProps"),
      petCheckinBtn: document.getElementById("petCheckinBtn"),
      learningModal: document.getElementById("learningModal"),
      learningKnowledgeMap: document.getElementById("learningKnowledgeMap"),
      subjectModal: document.getElementById("subjectModal"),
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
      trendReportList: document.getElementById("trendReportList"),
      reportParentCoach: document.getElementById("reportParentCoach"),
      reportWeakList: document.getElementById("reportWeakList"),
      reportCauseSummary: document.getElementById("reportCauseSummary"),
      reportTrendSummary: document.getElementById("reportTrendSummary"),
      reportAccuracyDonut: document.getElementById("reportAccuracyDonut"),
      reportAccuracyDonutText: document.getElementById("reportAccuracyDonutText"),
      reportAccuracyCopy: document.getElementById("reportAccuracyCopy"),
      reportTopicBars: document.getElementById("reportTopicBars"),
      reportRhythmDots: document.getElementById("reportRhythmDots"),
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
      ruleCheckResult: document.getElementById("ruleCheckResult"),
      sourceFilterBtns: [...document.querySelectorAll("[data-source-filter]")],
      sourceAuditSummary: document.getElementById("sourceAuditSummary"),
      sourceAuditResult: document.getElementById("sourceAuditResult"),
      questionBankSubjectFilter: document.getElementById("questionBankSubjectFilter"),
      questionBankGradeFilter: document.getElementById("questionBankGradeFilter"),
      questionBankPointFilter: document.getElementById("questionBankPointFilter"),
      exportBankExcelBtn: document.getElementById("exportBankExcelBtn"),
      exportBankExcelStatus: document.getElementById("exportBankExcelStatus"),
      customBankNameInput: document.getElementById("customBankNameInput"),
      customBankFileInput: document.getElementById("customBankFileInput"),
      customBankChooseBtn: document.getElementById("customBankChooseBtn"),
      customBankFileName: document.getElementById("customBankFileName"),
      customBankImageInput: document.getElementById("customBankImageInput"),
      customBankImageBtn: document.getElementById("customBankImageBtn"),
      customBankImageName: document.getElementById("customBankImageName"),
      previewCustomBankBtn: document.getElementById("previewCustomBankBtn"),
      importCustomBankBtn: document.getElementById("importCustomBankBtn"),
      customBankImportStatus: document.getElementById("customBankImportStatus"),
      customBankPreview: document.getElementById("customBankPreview"),
      customBankList: document.getElementById("customBankList"),
      bankDetailTitle: document.getElementById("bankDetailTitle"),
      bankDetailMeta: document.getElementById("bankDetailMeta"),
      bankDetailBody: document.getElementById("bankDetailBody"),
      bankReviewToolbar: document.getElementById("bankReviewToolbar"),
      bankAuditSummary: document.getElementById("bankAuditSummary"),
      publishCustomBankBtn: document.getElementById("publishCustomBankBtn"),
      disableCustomBankBtn: document.getElementById("disableCustomBankBtn"),
      reviewCustomBankBtn: document.getElementById("reviewCustomBankBtn"),
      auditCustomBankBtn: document.getElementById("auditCustomBankBtn"),
      bankSelectAllQuestions: document.getElementById("bankSelectAllQuestions"),
      bankBulkGradeSelect: document.getElementById("bankBulkGradeSelect"),
      bankBulkSubjectSelect: document.getElementById("bankBulkSubjectSelect"),
      bankBulkTermSelect: document.getElementById("bankBulkTermSelect"),
      bankBulkPointSelect: document.getElementById("bankBulkPointSelect"),
      bankBulkDifficultySelect: document.getElementById("bankBulkDifficultySelect"),
      applyBankBulkEditBtn: document.getElementById("applyBankBulkEditBtn"),
      bankVersionHistory: document.getElementById("bankVersionHistory")
    };

    const {
      uid,
      rand,
      pick,
      clamp,
      round1,
      simplifyFraction,
      formatAnswer,
      formatDecimalText,
      normalizeQuestionDisplay,
      answerValueLabel,
      normalizeAnswerText,
      comparableAnswerText,
      parseNumericAnswer,
      answerLabelMatches,
      normalizeTextAnswer,
      textAnswerMatches,
      normalizeFormulaAnswer,
      formulaAnswerMatches,
      isSelfReviewQuestion,
      isChineseQuestion,
      isEnglishQuestion,
      isScienceQuestion,
      isLanguageQuestion,
      isNonMathQuestion
    } = window.MathCampUtils;
    // 纯格式化 / 日期 / HTML 转义工具（从 app.js 抽到 app-format-utils.js，只搬不改）。
    const {
      escapeHTML,
      escapeAttr,
      isPlainObject,
      todayKey,
      dateKeyFromDayNumber,
      dayNumber,
      accuracyOf
    } = window.MathCampFormatUtils;
    function hasAudioPrompt(question) {
      const prompt = question?.audioPrompt;
      return Boolean(isEnglishQuestion(question) && prompt && prompt.type === "tts" && String(prompt.text || "").trim());
    }
    function speakQuestionPrompt(question) {
      if (!hasAudioPrompt(question)) return false;
      const synth = window.speechSynthesis;
      const Utterance = window.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
      if (!synth || !Utterance) {
        UI.notify("当前设备暂不支持英文发音。", { tone: "bad" });
        return false;
      }
      const prompt = question.audioPrompt;
      const utterance = new Utterance(String(prompt.text || "").trim());
      utterance.lang = prompt.lang || "en-US";
      utterance.rate = Number(prompt.rate) || 0.9;
      utterance.pitch = Number(prompt.pitch) || 1;
      const voices = typeof synth.getVoices === "function" ? synth.getVoices() : [];
      const voice = voices.find((item) => /^en[-_]/i.test(item.lang || "")) || voices.find((item) => /English/i.test(item.name || ""));
      if (voice) utterance.voice = voice;
      if (typeof synth.cancel === "function") synth.cancel();
      synth.speak(utterance);
      return true;
    }
    // 把题目整理成适合中文朗读的纯文本（含选择题选项）。
    function answerMatches(question, parsed) {      if (isSelfReviewQuestion(question)) return false;
      if (question?.answerType === "choice") return textAnswerMatches(parsed.raw, question) || answerLabelMatches(parsed.raw, question);
      if (question?.answerType === "formula") return formulaAnswerMatches(parsed.raw, question);
      if (question?.answerType === "text" || Array.isArray(question?.acceptedAnswers)) {
        return textAnswerMatches(parsed.raw, question);
      }
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
    function normalizeQuestionDiagram(diagram) {
      if (!isPlainObject(diagram)) return null;
      const type = String(diagram.type || "");
      const allowedTypes = new Set(["shape-count", "position-row", "angle-set", "segment-chain", "rectangle", "square", "composite-rect", "cuboid", "circle", "circle-ring", "grid-shape", "block-view", "motion-grid", "angle-measure", "polygon-shape", "polygon-area", "symmetry-grid", "rotation-grid", "solid-net", "three-view", "route-map", "cylinder-cone", "sector-shape"]);
      if (!allowedTypes.has(type)) return null;
      const clean = { type };
      ["caption", "unit", "mode", "angleType"].forEach((key) => {
        if (diagram[key] !== undefined) clean[key] = String(diagram[key] || "").slice(0, 24);
      });
      ["length", "width", "height", "side", "radius", "innerRadius", "diameter", "angle", "angle2", "base", "base2", "scale", "distance", "east", "north", "left", "right", "a", "b", "c", "d", "rows", "cols", "startX", "startY", "endX", "endY", "moveX", "moveY"].forEach((key) => {
        if (diagram[key] !== undefined) clean[key] = clamp(Number(diagram[key]) || 0, 0, 999);
      });
      if (Array.isArray(diagram.shapes)) {
        clean.shapes = diagram.shapes.slice(0, 8).map((shape) => ({
          kind: ["circle", "square", "triangle", "rectangle"].includes(String(shape?.kind || "")) ? String(shape.kind) : "square",
          count: clamp(Number(shape?.count) || 0, 0, 12),
          label: String(shape?.label || "").slice(0, 12)
        })).filter((shape) => shape.count > 0);
      }
      if (Array.isArray(diagram.angles)) {
        clean.angles = diagram.angles.slice(0, 8).map((angle) => ({
          type: ["right", "acute", "obtuse"].includes(String(angle?.type || "")) ? String(angle.type) : "acute",
          label: String(angle?.label || "").slice(0, 4)
        }));
      }
      if (Array.isArray(diagram.columns)) {
        clean.columns = diagram.columns.slice(0, 5).map((value) => clamp(Number(value) || 1, 1, 4));
      }
      if (Array.isArray(diagram.cells)) {
        clean.cells = diagram.cells.slice(0, 80).map((cell) => {
          if (typeof cell === "string") {
            const parts = cell.split(",").map((value) => Number(value));
            return { x: clamp(parts[0] || 0, 0, 12), y: clamp(parts[1] || 0, 0, 12) };
          }
          return { x: clamp(Number(cell?.x) || 0, 0, 12), y: clamp(Number(cell?.y) || 0, 0, 12) };
        });
      }
      return clean;
    }
    function normalizeQuestionSourceImage(image) {
      if (!isPlainObject(image)) return null;
      const src = String(image.src || "").trim();
      // 允许两类来源：内置参考资料裁图路径，或校内题库上传的 data URL 图片。
      const isReferencePath = /^assets\/reference\/(?:grade2|grade3|grade4)\/[A-Za-z0-9._-]+\.png$/.test(src);
      const isDataUrl = /^data:image\/(?:png|jpe?g|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$/.test(src);
      if (!isReferencePath && !isDataUrl) return null;
      return {
        src,
        alt: String(image.alt || "参考资料题图").slice(0, 80),
        sourceId: String(image.sourceId || "").slice(0, 60),
        sourceFile: String(image.sourceFile || "").slice(0, 120),
        sourcePath: String(image.sourcePath || "").slice(0, 180),
        sourcePage: Number.isFinite(Number(image.sourcePage)) ? Number(image.sourcePage) : null,
        cropNote: String(image.cropNote || "").slice(0, 140)
      };
    }
    function safeRecordId(value, prefix = "id") {
      const text = String(value || "");
      return /^[A-Za-z0-9_-]{1,80}$/.test(text) ? text : uid(prefix);
    }
    function subjectIdFromPointId(pointId) {
      const text = String(pointId || "");
      if (/^c\d-/.test(text)) return "chinese";
      if (/^e\d-/.test(text)) return "english";
      if (/^s\d-/.test(text)) return "science";
      return "math";
    }
    function subjectIdFromQuestion(question) {
      return safeSubjectId(question?.subject || subjectIdFromPointId(question?.pointId));
    }
    function bankForSubject(subjectId) {
      const safe = safeSubjectId(subjectId);
      if (SubjectRegistry.subjectBank) return SubjectRegistry.subjectBank(safe) || window.MathCampQuestionBank;
      if (safe === "chinese") return window.MathCampChineseQuestionBank || window.MathCampQuestionBank;
      if (safe === "english") return window.MathCampEnglishQuestionBank || window.MathCampQuestionBank;
      if (safe === "science") return window.MathCampScienceQuestionBank || window.MathCampQuestionBank;
      return window.MathCampQuestionBank;
    }
    function cleanCauseOptions(list) {
      return [...new Set((Array.isArray(list) ? list : []).map((cause) => String(cause || "").trim()).filter((cause) => cause && cause !== "未标记"))].slice(0, 4);
    }
    function causeOptionsForSubject(subjectId = "math") {
      const options = cleanCauseOptions(bankForSubject(subjectId)?.causes);
      return options.length ? options : cleanCauseOptions(causes);
    }
    function causeOptionsForQuestion(question) {
      return causeOptionsForSubject(subjectIdFromQuestion(question));
    }
    function pointForCauseDiagnosis(question) {
      const subject = subjectIdFromQuestion(question);
      const bank = bankForSubject(subject);
      return bank?.pointMap?.[question?.pointId] || pointMap[question?.pointId] || {
        id: question?.pointId || "",
        grade: question?.grade || 1,
        subject,
        topic: question?.topic || "",
        label: question?.kind || question?.pointId || "当前知识点",
        short: question?.kind || ""
      };
    }
    function topicDiagnosisText(question, point) {
      return [
        question?.topic,
        point?.topic,
        point?.id,
        point?.label,
        point?.short,
        point?.helper,
        question?.text,
        question?.explanation
      ].map((item) => String(item || "")).join(" ");
    }
    function recommendCauseForQuestion(question, answer = "", options = {}) {
      const subject = subjectIdFromQuestion(question);
      const causesForSubject = causeOptionsForQuestion(question);
      const point = options.point || pointForCauseDiagnosis(question);
      const insightCause = LearningInsights.diagnoseCause?.({
        cause: "",
        text: question?.text,
        answer,
        question,
        explanation: question?.explanation
      }, point);
      if (causesForSubject.includes(insightCause)) return insightCause;
      const text = topicDiagnosisText(question, point);
      const match = (pattern) => pattern.test(text);
      let fallback = "不会做";
      if (subject === "chinese") {
        if (match(/拼音|声调|字音|字形|词|偏旁|量词|多音|形近|近义|反义|搭配|word|pinyin|character/)) fallback = "字词基础";
        else if (match(/阅读|短文|概括|诗|文言|信息|中心|人物|情节|资料|观点|原文|reading|poem/)) fallback = "阅读理解";
        else if (match(/句|标点|表达|习作|写话|病句|应用文|口语|修辞|sentence|writing|punctuation/)) fallback = "表达规范";
      } else if (subject === "english") {
        if (match(/单词|词汇|拼写|字母|phonics|发音|读音|元音|组合|word|vocabulary|spelling/)) fallback = "单词不熟";
        else if (match(/句型|语法|时态|be 动词|过去式|比较级|复数|代词|pattern|grammar|tense/)) fallback = "句型语法";
        else if (match(/阅读|短文|定位|疑问词|where|when|who|what|why|信息|细节|reading/)) fallback = "阅读定位";
      } else if (subject === "science") {
        if (match(/观察|实验|记录|变量|控制|公平|测量|现象|测试|inquiry/)) fallback = "观察实验";
        else if (match(/证据|结论|推理|支持|数据|模型|解释|可靠|evidence|data/)) fallback = "证据推理";
        else if (match(/概念|混淆|结构|性质|溶解|岩石|土壤|电路|能量|太阳系|生命周期|life|matter/)) fallback = "概念不清";
      } else {
        if (match(/读题|理解|条件|关系|先求|问什么|必要|干扰|无关|多余|只问|实际|word|reading/)) fallback = "读题理解";
        else if (match(/单位|概念|公式|周长|面积|体积|比例|百分|分数|角|圆|图形|geometry|unit|ratio|percent|fraction/)) fallback = "概念单位";
        else if (match(/计算|粗心|口算|竖式|进位|退位|小数点|口诀|addsub|muldiv|decimal|vertical|mixed|twostep/)) fallback = "计算粗心";
      }
      return causesForSubject.includes(fallback) ? fallback : (causesForSubject[0] || "不会做");
    }
    function petCoachForCause(question, cause) {
      const point = pointForCauseDiagnosis(question);
      const advice = LearningInsights.adviceForCause?.(cause, point) || "先看一步提示，再做同类小练习。";
      const subject = subjectIdFromQuestion(question);
      const prefix = {
        math: "招财：我来当计算小教练。",
        chinese: "招财：我来当阅读小搭档。",
        english: "招财：我来当英语小领读。",
        science: "招财：我来当实验观察员。"
      }[subject] || "招财：我来陪你拆这题。";
      return `${prefix}${advice}`;
    }
    function allCauseOptions() {
      return cleanCauseOptions([
        ...causeOptionsForSubject("math"),
        ...causeOptionsForSubject("chinese"),
        ...causeOptionsForSubject("english"),
        ...causeOptionsForSubject("science")
      ]);
    }
    function normalizeCause(cause) {
      const text = String(cause || "").trim();
      if (allCauseOptions().includes(text)) return text;
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
        "小数/分数理解不稳": "概念单位",
        "干扰条件": "读题理解"
      };
      const normalized = legacy[text] || "";
      return allCauseOptions().includes(normalized) ? normalized : "未标记";
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
    function safeSubjectId(id) {
      if (SubjectRegistry.safeSubjectId) return SubjectRegistry.safeSubjectId(id);
      return Object.prototype.hasOwnProperty.call(SUBJECTS, id) ? id : "math";
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
    function normalizeEffectsSettings(settings = {}) {
      const normalized = {};
      EFFECT_SETTING_KEYS.forEach((key) => {
        normalized[key] = settings?.[key] !== false;
      });
      return normalized;
    }
    function readEffectsSettings() {
      try {
        return normalizeEffectsSettings(JSON.parse(localStorage.getItem("mathcamp-effects-settings") || "{}"));
      } catch (_) {
        return normalizeEffectsSettings({});
      }
    }
    function writeEffectsSettings(settings) {
      try {
        localStorage.setItem("mathcamp-effects-settings", JSON.stringify(normalizeEffectsSettings(settings)));
      } catch (_) {}
    }
    function normalizeSystemSettings(settings = {}) {
      return {
        version: 1,
        theme: safeThemeId(settings.theme || "classic"),
        musicOn: Boolean(settings.musicOn),
        soundOn: Boolean(settings.soundOn),
        effects: normalizeEffectsSettings(settings.effects || {}),
        syncCode: String(settings.syncCode || "").trim().slice(0, 80),
        updatedAt: Math.max(0, Number(settings.updatedAt) || 0)
      };
    }
    function readSystemSettingsSnapshot() {
      return normalizeSystemSettings(storageJSON(STORE.system, {}));
    }
    function getCurrentSyncCode() {
      if (window.MathCampCloudSync?.getSyncCode) return window.MathCampCloudSync.getSyncCode();
      try {
        return localStorage.getItem("mathcamp-sync-code") || "";
      } catch (_) {
        return "";
      }
    }
    function collectSystemSettings() {
      const snapshot = readSystemSettingsSnapshot();
      return normalizeSystemSettings({
        ...snapshot,
        theme: state?.theme || snapshot.theme,
        musicOn: Boolean(state?.musicOn),
        soundOn: Boolean(state?.soundOn),
        effects: readEffectsSettings(),
        syncCode: getCurrentSyncCode()
      });
    }
    function saveSystemSettingsSnapshot(settings = null, options = {}) {
      const now = options.touch === false ? 0 : Date.now();
      const base = settings ? normalizeSystemSettings(settings) : collectSystemSettings();
      const previous = readSystemSettingsSnapshot();
      const normalized = normalizeSystemSettings({
        ...base,
        updatedAt: Number(base.updatedAt) || Number(previous.updatedAt) || now
      });
      if (options.touch !== false) normalized.updatedAt = now;
      storageSet(STORE.system, JSON.stringify(normalized));
      if (options.sync !== false && window.MathCampCloudSync?.isSyncEnabled?.()) {
        window.MathCampCloudSync.pushSettings(normalized);
      }
      return normalized;
    }
    function applySystemSettings(settings, options = {}) {
      const normalized = normalizeSystemSettings(settings);
      state.theme = safeThemeId(normalized.theme);
      state.musicOn = Boolean(normalized.musicOn);
      state.soundOn = Boolean(normalized.soundOn);
      storageSet(STORE.music, String(state.musicOn));
      storageSet(STORE.sound, String(state.soundOn));
      writeEffectsSettings(normalized.effects);
      if (window.MathCampEffectsControl) {
        window.MathCampEffectsControl.settings = {
          ...window.MathCampEffectsControl.settings,
          ...normalized.effects
        };
        window.MathCampEffectsControl.applySettings?.();
      }
      if (window.MathCampCloudSync?.setSyncCode) window.MathCampCloudSync.setSyncCode(normalized.syncCode);
      applyTheme(state.theme, { save: false, notify: false });
      storageSet(STORE.theme, state.theme);
      updateSoundButtons();
      saveSystemSettingsSnapshot(normalized, {
        touch: options.touch !== false,
        sync: options.sync !== false
      });
      return normalized;
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
    function subjectThemeMeta(subjectId = activeSubjectId()) {
      return SUBJECTS[safeSubjectId(subjectId)] || SUBJECTS.math;
    }
    function updateMetaColor() {
      const meta = document.querySelector("meta[name='theme-color']");
      if (!meta) return;
      meta.setAttribute("content", subjectThemeMeta().metaColor || THEME_REGISTRY[state.theme].metaColor);
    }
    function applySubjectTheme(subjectId = activeSubjectId()) {
      const subject = safeSubjectId(subjectId);
      document.documentElement.dataset.subject = subject;
      updateMetaColor();
    }
    function applyTheme(id, options = {}) {
      const requested = safeThemeId(id);
      const nextTheme = unlockedSystemThemeId(requested);
      if (requested !== nextTheme && options.notify !== false) {
        UI.notify("这个主题还没有解锁，可以去养成计划的主题商店查看。", { tone: "warn" });
      }
      state.theme = nextTheme;
      document.documentElement.dataset.theme = state.theme;
      updateMetaColor();
      updateThemeButtons();
      syncCustomSelects();
      if (options.save !== false) {
        storageSet(STORE.theme, state.theme);
        saveSystemSettingsSnapshot();
      }
    }
    function addDaysToKey(key, offset = 0) {
      const base = dayNumber(key || todayKey());
      if (!Number.isFinite(base)) return todayKey(offset);
      return dateKeyFromDayNumber(base + Number(offset || 0));
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
      if (isNonMathQuestion(question)) return true;
      const mode = question?.interaction?.mode || "input";
      return isCompactPracticeViewport() || mode === "choice" || mode === "judge";
    }
    function normalizeAnswerModeForViewport(mode) {
      return isCompactPracticeViewport() && mode === "step" ? "input" : mode;
    }
    function shouldUseCustomAnswerKeyboard(mode = "input", question = null) {
      if (isNonMathQuestion(question)) return false;
      if (question?.answerType === "formula") return false;
      return (mode === "input" || mode === "step") && isCompactPracticeViewport();
    }
    function syncAnswerModeAvailability() {
      const stepOption = els.answerModeSelect?.querySelector('option[value="step"]');
      if (!stepOption) return;
      const compact = isCompactPracticeViewport();
      const nonMath = activeSubjectId() !== "math";
      stepOption.disabled = compact || nonMath;
      stepOption.hidden = compact || nonMath;
      if ((compact || nonMath) && els.answerModeSelect.value === "step") {
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
      let lastGroup = "";
      [...select.options].forEach((option) => {
        if (option.hidden) return;
        const group = option.dataset.group || option.parentElement?.label || "";
        if (group && group !== lastGroup) {
          const groupItem = document.createElement("div");
          groupItem.className = "custom-select-group";
          groupItem.textContent = group;
          menu.appendChild(groupItem);
          lastGroup = group;
        } else if (!group) {
          lastGroup = "";
        }
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
        schemaVersion: 2,
        id: uid("student"),
        name,
        grade: clamp(Number(grade) || 1, 1, 6),
        wrongbook: [],
        masteredWrong: [],
        history: [],
        mastery: {},
        learningPlan: null,
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
        starterClaimed: false,
        experience: {
          starterClaimed: false,
          freeCareDate: "",
          dailyChoiceDate: "",
          dailyChoiceId: "",
          bellGameDate: "",
          bellGameSlot: 0,
          bellFound: false,
          careSequence: 0
        },
        careLog: { date: today, encourage: 0, feed: 0, clean: 0, play: 0 },
        tasks: { daily: {}, weekly: {} },
        wish: { date: today, id: "", itemId: "", progress: 0, fulfilled: false },
        checkin: { date: "", streak: 0, bestStreak: 0, total: 0 },
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
      const starterEligible = !isPlainObject(raw) || Object.keys(raw).length === 0 || raw.starterClaimed === false || raw.experience?.starterClaimed === false;
      pet.experience = typeof PetExperience.normalizeExperience === "function"
        ? PetExperience.normalizeExperience(pet, todayKey())
        : (isPlainObject(pet.experience) ? pet.experience : {});
      if (starterEligible && typeof PetExperience.ensureStarterKit === "function") PetExperience.ensureStarterKit(pet);
      else if (!pet.starterClaimed) {
        pet.starterClaimed = true;
        pet.experience.starterClaimed = true;
      }
      pet.starterClaimed = Boolean(pet.starterClaimed || pet.experience?.starterClaimed);
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
      pet.checkin = normalizePetCheckin(pet.checkin);
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
      normalized.schemaVersion = 2;
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
      normalized.mastery = Object.fromEntries(Object.entries(normalized.mastery && typeof normalized.mastery === "object" ? normalized.mastery : {})
        .map(([pointId, mastery]) => [pointId, LearningQuality.normalizeMasteryState?.(mastery) || mastery]));
      normalized.learningPlan = window.MathCampDailyLearningPlan?.normalizeStoredPlan?.(normalized.learningPlan, {
        profile: normalized,
        grade: normalized.grade,
        subject: normalized.activeSubject || "math",
        setSize: normalized.settings?.setSize || 10,
        dateKey: todayKey()
      }) || null;
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
      normalized.settings.setSize = clamp(Number(normalized.settings.setSize) || 10, 3, MAX_SET_SIZE);
      normalized.settings.dailyGoal = clamp(Number(normalized.settings.dailyGoal) || 20, 5, 200);
      normalized.settings.pointId = safePointId(normalized.settings.pointId || "auto", normalized.grade);
      if (normalized.settings.answerMode === "handwriting") normalized.settings.answerMode = "input";
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
      if (SubjectRegistry.normalizeProfileSubjects) {
        const withSubjects = SubjectRegistry.normalizeProfileSubjects(normalized);
        normalized.subjects = withSubjects.subjects;
      }
      return normalized;
    }
    function pointForQuestion(question) {
      const grade = clamp(Number(question?.grade) || 1, 1, 6);
      const explicit = bankPointMap()[question?.pointId] || pointMap[question?.pointId];
      if (explicit && explicit.grade === grade) return explicit;
      const byTopic = availablePoints(grade).find((point) => point.topic === question?.topic);
      return byTopic || availablePoints(grade)[0] || points[0];
    }
    function normalizeStoredQuestion(question) {
      if (!isPlainObject(question)) return null;
      const text = String(question.text || "").trim();
      if (!text) return null;
      const answerType = String(question.answerType || "").trim();
      const keepsTextAnswer = ["choice", "text", "judge", "longText", "selfReview"].includes(answerType)
        || Array.isArray(question.acceptedAnswers)
        || question.answerLabel;
      const numericAnswer = Number(question.answer);
      if (!keepsTextAnswer && !Number.isFinite(numericAnswer)) return null;
      const rawAnswer = question.answer ?? question.answerLabel ?? "";
      const answer = keepsTextAnswer ? String(rawAnswer).trim() : numericAnswer;
      if (keepsTextAnswer && !answer && !question.answerLabel) return null;
      const point = pointForQuestion(question);
      const kp = knowledgeProfileFor(point);
      const steps = Array.isArray(question.steps)
        ? question.steps.map((step) => String(step || "").trim()).filter(Boolean).slice(0, 5)
        : [];
      const acceptedAnswers = [...new Set((Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers : (keepsTextAnswer && answer ? [answer] : []))
        .map((item) => String(item || "").trim())
        .filter(Boolean))];
      return {
        ...question,
        id: safeRecordId(question.id, "q"),
        grade: point.grade,
        pointId: point.id,
        topic: point.topic,
        kind: String(question.kind || point.label),
        text,
        answer,
        answerType: answerType || (keepsTextAnswer ? "text" : question.answerType),
        answerLabel: String(question.answerLabel || ""),
        acceptedAnswers,
        word: Boolean(question.word),
        diagram: normalizeQuestionDiagram(question.diagram),
        sourceImage: normalizeQuestionSourceImage(question.sourceImage),
        sourceMeta: isPlainObject(question.sourceMeta) ? { ...question.sourceMeta } : question.sourceMeta,
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
        correctStreak: clamp(Number(item.correctStreak) || 0, 0, 4),
        reviewStage,
        chainStage: ["scaffold", "sameModel", "transfer", "delayed"].includes(item.chainStage) ? item.chainStage : "scaffold",
        recentDiagnostic: LearningQuality.normalizeDiagnostic?.(item.recentDiagnostic) || "uncertain",
        confidence: LearningQuality.normalizeConfidence?.(item.confidence) || "",
        hintLevel: clamp(Number(item.hintLevel) || 0, 0, 3),
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
        reviewCount: clamp(Number(item.reviewCount) || 4, 0, 999)
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
        mode: ["practice", "daily-smart", "weekly-review", "wrongbook", "due-review", "similar", "weak", "timed", "appendix", "hard-word", "logic-reading", "challenge"].includes(item.mode) ? item.mode : "practice",
        text: String(item.text || "").slice(0, 160),
        confidence: LearningQuality.normalizeConfidence?.(item.confidence) || "",
        elapsedMs: Math.max(0, Number(item.elapsedMs) || 0),
        hintLevel: clamp(Number(item.hintLevel) || 0, 0, 3),
        firstTryCorrect: item.firstTryCorrect === undefined ? Boolean(item.correct) : Boolean(item.firstTryCorrect),
        diagnostic: LearningQuality.normalizeDiagnostic?.(item.diagnostic) || "uncertain",
        difficultyScore: clamp(Number(item.difficultyScore) || 0, 0, 5),
        masteryDelta: clamp(Number(item.masteryDelta) || 0, -20, 20)
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
      recentQuestionKeys: [],
      recentQuestionFamilyKeys: [],
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
      customBankImportPreview: null,
      selectedBankId: "",
      practiceLayer: "setup",
      practiceReturnState: { layer: "setup", typeSettingsOpen: false },
      stepHintOpen: false,
      hintLevel: 0,
      selectedConfidence: "",
      questionStartedAt: 0,
      setStartedAt: 0,
      setElapsedMs: 0,
      timerId: null,
      timedTimerId: null,
      autoNextId: null,
      petActionTimer: null,
      floatingPetCareAlertShown: false,
      petRoomFeedbackTimer: null,
      petRoomWalkTimer: null,
      petRoomWalkWarmupTimers: [],
      petRoomWalkMotionTimer: null,
      petTaskClaimLocks: new Set(),
      petItemActionLocks: new Set(),
      petDressupPreview: null,
      theme: safeThemeId(storageGet(STORE.theme, document.documentElement.dataset.theme || "classic")),
      subject: safeSubjectId(storageGet(STORE.subject, "math")),
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
    const floatingPetDrag = {
      active: false,
      moved: false,
      suppressClick: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      current: null
    };

    function activeSubjectId() {
      return safeSubjectId(state.subject || "math");
    }
    function activeBank() {
      return SubjectRegistry.subjectBank?.(activeSubjectId()) || window.MathCampQuestionBank;
    }
    function bankGrades() {
      return activeBank().grades || grades;
    }
    function bankGradeNames() {
      return activeBank().gradeNames || gradeNames;
    }
    function bankCauses() {
      return causeOptionsForSubject(activeSubjectId());
    }
    function bankPoints() {
      return activeBank().points || points;
    }
    function bankPointMap() {
      return activeBank().pointMap || pointMap;
    }
    function activeLearning(profile = activeProfile()) {
      if (!profile) return null;
      return SubjectRegistry.subjectState ? SubjectRegistry.subjectState(profile, activeSubjectId()) : profile;
    }
    function bindProfileToActiveSubject(profile) {
      if (!profile || !SubjectRegistry.bindSubjectState) return profile;
      SubjectRegistry.bindSubjectState(profile, activeSubjectId());
      return profile;
    }
    function activeProfile() {
      const profile = state.profiles.find((item) => item.id === state.activeId) || state.profiles[0];
      return bindProfileToActiveSubject(profile);
    }
    function todayItems(profile = activeProfile()) {
      return profile.history.filter((item) => item.date === todayKey());
    }
    function dailyGoal(profile = activeProfile()) {
      return clamp(Number(profile.settings?.dailyGoal) || 20, 5, 200);
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
    function renderDesktopPracticeOverview(profile = activeProfile()) {
      if (!els.desktopOverviewStudent) return;
      const grade = clamp(Number(profile.grade || state.grade) || 1, 1, 6);
      const gradeName = gradeNames[grade - 1] || `${grade}年级`;
      const today = todayItems(profile);
      const done = today.length;
      const goal = dailyGoal(profile);
      const accuracy = accuracyOf(today);
      const pet = petState(profile);
      const weakPoints = weakestPoints(4);
      const weak = weakPoints.map((point) => pointLabel(point.id));
      const challenge = challengeProgress(profile, grade);
      const due = dueWrongbook(profile, grade);
      const week = currentWeekItems(profile);
      const weekAccuracy = accuracyOf(week);
      const masteredCount = Object.values(profile.mastery || {})
        .filter((item) => Number(item.attempts) >= 3 && Number(item.correct) / Math.max(1, Number(item.attempts)) >= 0.85)
        .length;
      const setSize = state.setSize || Number(profile.settings?.setSize) || 10;
      const days = learningDaysFor(profile);
      const level = learnerLevel(profile);
      const goalPct = Math.min(100, Math.round(done / Math.max(1, goal) * 100));
      const wrongCount = profile.wrongbook.length;
      const totalAttempts = profile.history.length;
      const wrongRate = totalAttempts ? `${Math.round(wrongCount / Math.max(1, totalAttempts) * 100)}%` : "--";
      const petItems = petInventoryCount(pet);
      const listHTML = (items) => items
        .map((item) => `<span>${escapeHTML(item)}</span>`)
        .join("");
      const tileHTML = (items) => items
        .map((item) => `<span><b>${escapeHTML(item.value)}</b><strong>${escapeHTML(item.label)}</strong><em>${escapeHTML(item.detail)}</em></span>`)
        .join("");
      const lastTime = latestProfileActivityTime(profile);
      const lastPracticeCopy = lastTime ? new Date(lastTime).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "暂无记录";
      const weekDoneDays = new Set(week.map((item) => item.date)).size;
      const remainingToday = Math.max(0, goal - done);
      const dailyPace = remainingToday <= 0 ? "今日已达标" : remainingToday <= setSize ? "再做一轮可达标" : `还需约 ${Math.ceil(remainingToday / Math.max(1, setSize))} 轮`;
      const lowCare = ["hunger", "clean", "mood"]
        .map((key) => ({ key, value: Number(pet[key]) || 0 }))
        .sort((a, b) => a.value - b.value)[0];
      const lowCareLabel = { hunger: "饱腹", clean: "清洁", mood: "心情" }[lowCare?.key] || "状态";
      const estimatedCareDays = Math.max(0, Math.floor((Number(pet.coins) || 0) / 30));
      const weakMasteries = (weakPoints.length ? weakPoints : availablePoints(grade).slice(0, 4)).slice(0, 4).map((point) => {
        const mastery = profile.mastery?.[point.id] || {};
        const attempts = Number(mastery.attempts) || 0;
        const correct = Number(mastery.correct) || 0;
        const rate = attempts ? Math.round(correct / attempts * 100) : 0;
        return { label: pointLabel(point.id), attempts, rate };
      });
      const challengeCount = challenge?.draft?.count || setSize;
      const challengeCopy = challenge?.draft
        ? `已保存到第 ${challenge.draft.index + 1}/${challenge.draft.count} 题`
        : `本关 ${challengeCount} 题，80% 以上过关`;
      els.desktopOverviewStudent.textContent = `${profile.name || "小学员"} · ${gradeName}`;
      if (els.desktopOverviewLevel) els.desktopOverviewLevel.textContent = `Lv.${level}`;
      els.desktopOverviewPlan.textContent = `今日路线建议：先复习到期错题，再练 ${weak.slice(0, 2).join("、") || "按年级混合"}。`;
      if (els.desktopOverviewDone) els.desktopOverviewDone.textContent = `${done}/${goal}`;
      if (els.desktopOverviewAccuracy) els.desktopOverviewAccuracy.textContent = today.length ? `${accuracy}%` : "--";
      if (els.desktopOverviewSetSize) els.desktopOverviewSetSize.textContent = `${setSize}题`;
      if (els.desktopOverviewDays) els.desktopOverviewDays.textContent = `${days}天`;
      if (els.desktopOverviewGoalPercent) els.desktopOverviewGoalPercent.textContent = `${goalPct}%`;
      if (els.desktopOverviewGoalBar) els.desktopOverviewGoalBar.style.setProperty("--value", `${goalPct}%`);
      if (els.desktopOverviewLearningBoard) {
        els.desktopOverviewLearningBoard.innerHTML = tileHTML([
          { label: "今日节奏", value: dailyPace, detail: `还差 ${remainingToday} 题` },
          { label: "最近练习", value: lastPracticeCopy, detail: week.length ? `本周已练 ${week.length} 题` : "本周等待开始" },
          { label: "推荐安排", value: weak[0] || "混合练习", detail: `${setSize} 题一轮更稳` }
        ]);
      }
      if (els.desktopOverviewChallengeBadge) els.desktopOverviewChallengeBadge.textContent = `第 ${challenge.level || 1} 关`;
      if (els.desktopOverviewChallenge) els.desktopOverviewChallenge.textContent = challenge?.draft ? "继续保存的闯关" : "今天可继续挑战";
      if (els.desktopOverviewChallengeDetail) {
        els.desktopOverviewChallengeDetail.textContent = `${challengeCopy}，今日 ${challenge.todayPlays || 0} 次，最高第 ${challenge.todayBestLevel || 0} 关。`;
      }
      if (els.desktopOverviewChallengeToday) els.desktopOverviewChallengeToday.textContent = `${challenge.todayPlays || 0}次`;
      if (els.desktopOverviewChallengeBest) els.desktopOverviewChallengeBest.textContent = challenge.todayBestLevel ? `第${challenge.todayBestLevel}关` : "未开始";
      if (els.desktopOverviewChallengeList) {
        els.desktopOverviewChallengeList.innerHTML = listHTML([
          challenge?.draft ? `已保存到第 ${challenge.draft.index + 1} 题，适合直接继续` : `本关 ${challengeCount} 题，建议一次完成`,
          challenge.todayPlays ? `今日已挑战 ${challenge.todayPlays} 次，注意保持节奏` : "过关条件：正确率达到 80%"
        ]);
      }
      if (els.desktopOverviewWrongBadge) els.desktopOverviewWrongBadge.textContent = `${wrongCount}题`;
      els.desktopOverviewPet.textContent = `${pet.name || "招财"} · ${petStatusLabel(pet)}`;
      if (els.desktopOverviewPetBadge) els.desktopOverviewPetBadge.textContent = `亲密 ${pet.bond}`;
      els.desktopOverviewPetDetail.textContent = `金币 ${pet.coins}，背包 ${petItems} 件，心情 ${pet.mood}，完成练习会继续成长。`;
      els.desktopOverviewParent.textContent = due.length ? `到期复习 ${due.length} 题` : "错题压力较轻";
      els.desktopOverviewParentDetail.textContent = wrongCount
        ? `错题本共 ${wrongCount} 题，建议先处理到期错题，再开始新题。`
        : "当前错题本为空，可以保持短时高频练习。";
      if (els.desktopOverviewDueWrong) els.desktopOverviewDueWrong.textContent = `${due.length}题`;
      if (els.desktopOverviewWrongRate) els.desktopOverviewWrongRate.textContent = wrongRate;
      if (els.desktopOverviewWrongList) {
        els.desktopOverviewWrongList.innerHTML = listHTML([
          due.length ? `先处理到期 ${due.length} 题，再做新题` : "错题未到期，先按今日路线走",
          accuracy < 80 && today.length ? "今日正确率偏低，下一轮建议降一点速度" : "当前节奏稳定，继续累积正确率"
        ]);
      }
      if (els.desktopOverviewWeakCount) els.desktopOverviewWeakCount.textContent = `${weak.length || 0}项`;
      if (els.desktopOverviewWeakList) {
        els.desktopOverviewWeakList.innerHTML = (weak.length ? weak : ["按年级混合", "每日路线"]).slice(0, 4)
          .map((label, index) => `<span class="${index === 0 ? "active" : ""}">${escapeHTML(label)}</span>`)
          .join("");
      }
      if (els.desktopOverviewStudyList) {
        els.desktopOverviewStudyList.innerHTML = listHTML([
          `今日还差 ${Math.max(0, goal - done)} 题达标`,
          today.length ? `今天已练 ${today.length} 题，正确率 ${accuracy}%` : "今天尚未开始，适合先做一轮短练习"
        ]);
      }
      if (els.desktopOverviewWeakTips) {
        els.desktopOverviewWeakTips.innerHTML = listHTML([
          weak.length ? `先练 ${weak[0]}，再穿插混合题` : "暂无明显薄弱点，按今日路线推进",
          due.length ? `错题到期 ${due.length} 题，建议本轮前复习` : "错题复习压力低，可以开始新题",
          `知识点掌握 ${masteredCount} 个，继续积累稳定度`
        ]);
      }
      if (els.desktopOverviewWeakBoard) {
        els.desktopOverviewWeakBoard.innerHTML = tileHTML(weakMasteries.slice(0, 4).map((item) => ({
          label: item.label,
          value: item.attempts ? `${item.rate}%` : "待练",
          detail: item.attempts ? `${item.attempts} 次记录` : "还没有稳定记录"
        })));
      }
      if (els.desktopOverviewReportBadge) els.desktopOverviewReportBadge.textContent = week.length ? `${week.length}题` : "本周";
      if (els.desktopOverviewReport) els.desktopOverviewReport.textContent = week.length ? `本周正确率 ${weekAccuracy}%` : "暂无本周记录";
      if (els.desktopOverviewReportDetail) {
        els.desktopOverviewReportDetail.textContent = `已掌握 ${masteredCount} 个知识点，今日目标完成 ${goalPct}%。可打开报告或知识地图查看细节。`;
      }
      if (els.desktopOverviewPetCoins) els.desktopOverviewPetCoins.textContent = `${pet.coins}`;
      if (els.desktopOverviewPetMood) els.desktopOverviewPetMood.textContent = `${pet.mood}`;
      if (els.desktopOverviewPetItems) els.desktopOverviewPetItems.textContent = `${petItems}件`;
      if (els.desktopOverviewPetBond) els.desktopOverviewPetBond.textContent = `${pet.bond}`;
      if (els.desktopOverviewPetList) {
        els.desktopOverviewPetList.innerHTML = listHTML([
          `${lowCareLabel}最低 ${lowCare?.value ?? 0}，优先照顾这一项`,
          `金币约可支撑 ${estimatedCareDays} 天基础消耗`,
          `下一等级还差 ${Math.max(0, pet.level * PET_XP_PER_LEVEL - pet.xp)} 经验`
        ]);
      }
      if (els.desktopOverviewWeekCount) els.desktopOverviewWeekCount.textContent = `${week.length}题`;
      if (els.desktopOverviewMastered) els.desktopOverviewMastered.textContent = `${masteredCount}个`;
      if (els.desktopOverviewReportList) {
        els.desktopOverviewReportList.innerHTML = listHTML([
          week.length ? `本周练习 ${week.length} 题，覆盖 ${weekDoneDays} 天` : "本周还没有形成报告数据",
          `知识地图已掌握 ${masteredCount} 个点，薄弱点 ${weak.length || 0} 项`
        ]);
      }
      els.desktopOverviewNext.textContent = challenge?.draft
        ? `已保存闯关进度：第 ${challenge.level || 1} 关`
        : `准备开始 ${setSize} 题练习`;
      if (els.desktopOverviewNextDetail) {
        els.desktopOverviewNextDetail.textContent = `左侧可调整年级、知识点、题量和每日目标；推荐优先完成今日路线，再处理错题本。`;
      }
      if (els.desktopOverviewNextList) {
        els.desktopOverviewNextList.innerHTML = listHTML([
          `当前年级：${gradeName}`,
          weak.length ? `推荐知识点：${weak[0]}` : "推荐知识点：按年级混合",
          `本轮题量：${setSize} 题，每日目标：${goal} 题`,
          challenge?.draft ? "可继续上次闯关，也可生成新练习" : "生成后会进入桌面专注做题布局"
        ]);
      }
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
      renderDesktopPracticeOverview(profile);
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
      const passRate = challengePassRateForLevel(progress.level || 1);
      const draft = progress.draft;
      const todayBest = progress.todayBestLevel ? `第 ${progress.todayBestLevel} 关` : "还未开始";
      [els.challengePanel, els.homeChallengePanel].filter(Boolean).forEach((panel) => {
        panel.querySelector("strong").textContent = `闯关模式 · 第 ${progress.level} 关`;
        panel.querySelector("span").textContent = draft
          ? `已保存到第 ${draft.index + 1}/${draft.count} 题，今天可继续；本关 ${nextCount} 题，${passRate}% 以上过关。`
          : `本关 ${nextCount} 题，${passRate}% 以上过关；通过后自动进入下一关。`;
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
      const pointText = curriculumPointLabel(pointId);
      const mode = normalizeAnswerModeForViewport(state.answerMode || profile.settings?.answerMode || "auto");
      els.homeSettingsCard.innerHTML = `
        <div class="home-settings-main">
          <strong>${escapeHTML(profile.name)}</strong>
          <span>${escapeHTML(gradeNames[grade - 1] || `${grade}年级`)}</span>
        </div>
        <div class="home-settings-meta">
          <span title="知识点：${escapeAttr(pointText)}">知识点：${escapeHTML(pointText)}</span>
          <span>答题：${escapeHTML(answerModeLabel(mode))}</span>
          <span>目标：${dailyGoal(profile)}题</span>
        </div>`;
    }
    function renderHomeDashboard(profile = activeProfile()) {
      if (!els.homeWeakList) return;
      renderHomeSettingsCard(profile);
      const subjectMeta = subjectThemeMeta();
      const weak = weakestPoints(3);
      const pet = petState(profile);
      const stage = petStageCopy(petGrowthStage(pet), profile);
      const done = todayItems(profile).length;
      const goal = dailyGoal(profile);
      const dailyPlan = window.MathCampDailyLearningPlan?.buildPlan?.({
        profile,
        grade: profile.grade || state.grade,
        subject: activeSubjectId(),
        setSize: state.setSize || profile.settings?.setSize || 10,
        dueCount: dueWrongbook(profile, profile.grade || state.grade).length,
        dateKey: todayKey()
      });
      if (els.homePlanCopy) {
        const first = weak[0];
        const prefix = dailyPlan?.mode === "diagnostic" ? "学习数据还不够，今天先完成起始诊断" : "今天按掌握情况智能组卷";
        els.homePlanCopy.textContent = first
          ? `${subjectMeta.label} · ${prefix}，重点关注“${first.label}”。`
          : `${subjectMeta.label} · ${prefix}，完成后会更新知识点掌握状态。`;
      }
      if (els.homePlanMix && dailyPlan) {
        els.homePlanMix.innerHTML = `<strong>${escapeHTML(dailyPlan.title)}</strong>${dailyPlan.segments.map((segment) => `
          <span data-plan-segment="${escapeAttr(segment.id)}"><b>${segment.count}题</b><em>${escapeHTML(segment.label)} ${segment.ratio}%</em></span>`).join("")}`;
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
      if (!els.levelTag || !els.rewardGrid) return;
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
      if (!els.weekGrid) return;
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
      if (profile && SubjectRegistry.syncBoundSubject) SubjectRegistry.syncBoundSubject(profile, activeSubjectId());
      const profilesForSave = state.profiles
        .map((item) => normalizeProfile(cloneForStorage(item)))
        .filter(Boolean);
      const payloadProfiles = profilesForSave.length ? profilesForSave : state.profiles;
      const payloadActiveId = payloadProfiles.some((item) => item.id === state.activeId)
        ? state.activeId
        : payloadProfiles[0]?.id || state.activeId;
      const savedProfiles = storageSet(STORE.profiles, JSON.stringify(payloadProfiles));
      const savedActive = storageSet(STORE.active, payloadActiveId);
      const ok = Boolean(savedProfiles && savedActive);
      if (!savedProfiles || !savedActive) {
        console.warn("学习数据暂时无法写入本地存储，请导出备份后再继续大量练习。");
        handleSaveFailure();
      } else {
        localSaveFailureStreak = 0;
        updateSaveStatus(true);
        localProfileMutationVersion += 1;
        if (window.MathCampCloudSync && window.MathCampCloudSync.isSyncEnabled()) {
          window.MathCampCloudSync.scheduleSync(payloadProfiles, payloadActiveId);
        }
      }
      renderChrome();
      return ok;
    }
    // 防抖保存：合并短时间内的多次保存请求（如连续答题），减少对主线程和
    // localStorage 的频繁写入。仅用于不依赖同步返回值的高频路径；关键操作
    // （购买、领奖、改档案）仍直接调用 saveProfiles() 以便即时拿到成功与否。
    function scheduleSaveProfiles() {
      if (saveProfilesTimer) clearTimeout(saveProfilesTimer);
      saveProfilesTimer = setTimeout(() => {
        saveProfilesTimer = null;
        saveProfiles();
      }, SAVE_DEBOUNCE_MS);
    }
    // 立即写入任何挂起的防抖保存，用于页面隐藏/关闭前确保数据落盘。
    function flushPendingSaveProfiles() {
      if (!saveProfilesTimer) return;
      clearTimeout(saveProfilesTimer);
      saveProfilesTimer = null;
      saveProfiles();
    }
    // 深拷贝档案用于写入：优先使用 structuredClone（更快、无需二次序列化），
    // 在不支持的环境下回退到 JSON 方式。
    function cloneForStorage(item) {
      const source = item || {};
      if (typeof structuredClone === "function") {
        try {
          return structuredClone(source);
        } catch (_) {
          // 含不可克隆字段时回退到 JSON。
        }
      }
      return JSON.parse(JSON.stringify(source));
    }
    // 连续写入失败时，主动引导用户导出备份，避免学习记录默默丢失。
    function handleSaveFailure() {
      localSaveFailureStreak += 1;
      updateSaveStatus(false);
      if (localSaveFailureStreak < LOCAL_SAVE_FAILURE_ALERT_THRESHOLD) return;
      if (localSaveBackupPromptShown) return;
      localSaveBackupPromptShown = true;
      if (UI && typeof UI.notify === "function") {
        UI.notify("本地存储已满或不可写，正在为你自动导出备份，请妥善保存文件。", { tone: "bad", duration: 6000 });
      }
      // 自动触发一次导出，尽量抢救当前进度。
      if (typeof exportData === "function") {
        Promise.resolve().then(() => exportData()).catch(() => {});
      }
    }
    async function initCloudSync() {
      if (!window.MathCampCloudSync) return;
      var CloudSync = window.MathCampCloudSync;
      var savedConfig = CloudSync.getConfig();
      if (savedConfig && savedConfig.url && savedConfig.anonKey) {
        var ok = await CloudSync.initSupabase(savedConfig);
        if (ok) {
          // 记录同步开始时的本地改动版本；若首轮同步的 await 期间用户又做了题，
          // 直接整表替换会吞掉这些新记录，这里检测到后再用当前状态重新合并一次。
          var mutationVersionBeforeSync = localProfileMutationVersion;
          var result = await CloudSync.fullSync(state.profiles, state.activeId, collectSystemSettings());
          if (localProfileMutationVersion !== mutationVersionBeforeSync && typeof CloudSync.mergeProfiles === "function") {
            // 用云端合并结果与“同步期间的最新本地档案”再合并一次，保留两边的新数据。
            result = {
              ...result,
              profiles: CloudSync.mergeProfiles(state.profiles, result.profiles || []),
              activeId: state.activeId || result.activeId,
              changed: true
            };
          }
          renderCloudSyncSummary(result);
          if (result.settingsChanged && result.systemSettings) {
            applySystemSettings(result.systemSettings, { touch: false, sync: false });
          }
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
        "loading-sdk": "正在加载云同步组件…",
        offline: "离线模式，本地练习可正常使用",
        disconnected: "📴 离线模式"
      };
      el.textContent = labels[status] || status;
    }
    function renderCloudSyncSummary(result) {
      var el = document.getElementById("cloudSyncDetail");
      if (!el || !result || !result.summary) return;
      var summary = result.summary;
      var parts = [
        `练习 ${Number(summary.history) || 0} 条`,
        `错题 ${Number(summary.wrongbook) || 0} 条`,
        `已掌握错题 ${Number(summary.masteredWrong) || 0} 条`
      ];
      if (Number(summary.profiles) > 0) parts.push(`新增档案 ${Number(summary.profiles)} 个`);
      if (summary.settingsChanged) parts.push("系统设置已更新");
      el.hidden = false;
      el.textContent = `本次同步详情：合并 ${parts.join("，")}。`;
    }
    function availablePoints(grade = state.grade) {
      const normalizedGrade = clamp(Number(grade) || 1, 1, 6);
      return bankPoints()
        .filter((point) => point.grade === normalizedGrade)
        .slice()
        .sort((a, b) => curriculumPointRank(a) - curriculumPointRank(b) || a.id.localeCompare(b.id));
    }
    function pointBelongsToGrade(pointId, grade = state.grade) {
      if (pointId === "auto") return true;
      return availablePoints(grade).some((point) => point.id === pointId);
    }
    function safePointId(pointId, grade = state.grade) {
      return pointBelongsToGrade(pointId, grade) ? pointId : "auto";
    }
    function pointLabel(id) {
      return bankPointMap()[id]?.label || pointMap[id]?.label || "按年级混合";
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
    function readingPointForGrade(grade = state.grade) {
      return pointMap[`g${clamp(Number(grade) || 1, 1, 6)}-reading`] || pointMap["g6-reading"];
    }
    function curriculumBandFor(point) {
      const curriculum = point?.curriculum;
      if (curriculum?.band) return curriculum.band;
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
        reading: "思维阅读",
        appendix: "思维拓展"
      };
      const term = grade <= 2 ? "低年级" : grade <= 4 ? "中年级" : "高年级";
      return `${term} / ${topicBands[point?.topic] || "综合练习"}`;
    }
    function curriculumBrief(point) {
      const curriculum = point?.curriculum;
      if (!curriculum) return "";
      return [curriculum.term, curriculum.unit].filter(Boolean).join(" / ");
    }
    function curriculumHelperText(point) {
      const helper = point?.helper || point?.label || "";
      const brief = curriculumBrief(point);
      return brief ? `${brief} / ${helper}` : helper;
    }
    function curriculumUnitRank(point) {
      const curriculum = point?.curriculum || {};
      const plan = gradeCurriculum?.[Number(point?.grade) || 1];
      const units = [...(plan?.first || []), ...(plan?.second || [])];
      const unitText = String(curriculum.unit || point?.label || "");
      const index = units.findIndex((unit) => unitText.includes(unit) || unit.includes(unitText));
      return index >= 0 ? index : 999;
    }
    function curriculumPointRank(point) {
      return curriculumUnitRank(point);
    }
    function curriculumSelectLabel(point) {
      const curriculum = point?.curriculum || {};
      const prefix = [curriculum.term, curriculum.unit].filter(Boolean).join(" · ");
      return prefix ? `${prefix} · ${point.label}` : point.label;
    }
    function compactText(text, limit = 9) {
      const chars = Array.from(String(text || "").trim());
      return chars.length > limit ? `${chars.slice(0, limit).join("")}...` : chars.join("");
    }
    function compactCurriculumUnit(unit) {
      const text = String(unit || "")
        .replace(/[（(][^）)]{1,6}[）)]/g, "")
        .replace(/100 以内/g, "100以内")
        .replace(/20 以内/g, "20以内")
        .replace(/10 以内/g, "10以内")
        .replace(/加法和减法/g, "加减")
        .replace(/乘法和除法/g, "乘除")
        .replace(/认识时间/g, "时间")
        .replace(/认识人民币/g, "人民币")
        .replace(/数学广角[-－]/g, "")
        .replace(/解决问题/g, "应用")
        .replace(/小数的/g, "小数")
        .replace(/分数的/g, "分数")
        .replace(/、/g, "/")
        .trim();
      return compactText(text, 9);
    }
    function curriculumSelectShortLabel(point) {
      const curriculum = point?.curriculum || {};
      const unit = compactCurriculumUnit(curriculum.unit);
      const name = compactText(point?.short || point?.label || "", 7);
      return [unit, name].filter(Boolean).join(" · ") || point?.label || "";
    }
    function knowledgeDetailTitle(point) {
      if (!point) return "按年级混合";
      const name = compactText(point.short || point.label || "", 6);
      const unit = compactCurriculumUnit(point.curriculum?.unit || "");
      if (!unit || unit === name || unit.includes(name) || name.includes(unit)) return name || point.label;
      return `${compactText(unit, 6)} · ${name}`;
    }
    function curriculumPointLabel(pointId) {
      const point = pointMap[pointId];
      return point ? curriculumSelectLabel(point) : "按教材混合";
    }
    function uniqueList(items, limit = 4) {
      const seen = new Set();
      return items.filter((item) => {
        const text = String(item || "").trim();
        if (!text || seen.has(text)) return false;
        seen.add(text);
        return true;
      }).slice(0, limit);
    }
    function withCurriculumProfile(point, profile) {
      const curriculum = point?.curriculum;
      if (!curriculum) return profile;
      const scope = [curriculum.textbook, curriculum.term, curriculum.unit, curriculum.stage].filter(Boolean).join(" / ");
      const rulePrefix = [scope, curriculum.focus].filter(Boolean).join(": ");
      return {
        rule: rulePrefix ? `${rulePrefix}。${profile.rule}` : profile.rule,
        subskills: uniqueList([...(curriculum.questionTypes || []), ...(profile.subskills || [])], 4),
        pitfalls: profile.pitfalls,
        practice: profile.practice,
        curriculum
      };
    }
    function templateLabelFor(question) {
      if (!question) return "规则计算";
      if (question.templateType) return question.templateType;
      if (question.word) return "情境应用";
      if (question.topic === "appendix") return "拓展思维";
      if (question.topic === "thinking") return "思维精进";
      if (question.topic === "mixed") return "运算顺序";
      if (question.topic === "twostep") return "两步计算";
      if (question.topic === "vertical") return "竖式计算";
      if (question.topic === "reading") return "思维阅读";
      return "规则计算";
    }
    function shortPromptForHint(text) {
      const prompt = String(text || "").replace(/\s+/g, " ").trim();
      return prompt.length > 36 ? `${prompt.slice(0, 36)}...` : prompt;
    }
    function chineseMethodHintFor(question) {
      const prompt = shortPromptForHint(question?.text);
      const prefix = prompt ? `先看这题问的“${prompt}”。` : "";
      const hints = {
        pinyin: "再看字音、声调和词语搭配，放回句子里判断。",
        character: "再看字形结构和容易混淆的笔画，放回词语里检查。",
        word: "再比较词语意思和语境，选择最通顺、最准确的表达。",
        sentence: "再把句子读一遍，检查顺序是否清楚、表达是否完整。",
        punctuation: "再读出停顿和语气，判断逗号、句号、问号或感叹号是否合适。",
        reading: "回到短文原句定位依据，圈出人物、动作或关键词，再用完整句回答。",
        poem: "抓住诗句里的关键词，联系诗意和积累，再说清选择依据。",
        writing: "先想清要写的内容和顺序，句子要通顺完整，标点也要检查。"
      };
      return `${prefix}${hints[question?.topic] || "先读清题目要求，再回到句子或短文里找依据，答案要写完整。"}`;
    }
    function englishMethodHintFor(question) {
      const prompt = shortPromptForHint(question?.text);
      const prefix = prompt ? `先看这题问的“${prompt}”。` : "";
      const hints = {
        vocabulary: "再看英文词放在什么情境里，先判断词义，再检查拼写。",
        phonics: "再找字母或字母组合，想一想它在这个单词里的常见发音。",
        pattern: "先判断别人问什么，再用对应句型回答，别只看单个熟词。",
        grammar: "先找主语和时间词，再决定 be 动词、时态或词形变化。",
        reading: "先看疑问词问的是人、地点、时间还是事情，再回到短文定位原句。"
      };
      return `${prefix}${hints[question?.topic] || "先读英文情境，再根据词汇、句型或语法规则判断唯一答案。"}`;
    }
    function scienceMethodHintFor(question) {
      const prompt = shortPromptForHint(question?.text);
      const prefix = prompt ? `先看这题问的“${prompt}”。` : "";
      const hints = {
        life: "再看观察记录里的结构、生命活动和环境条件，用证据判断生命现象。",
        matter: "再比较材料或物质变化前后的现象，别把看不见误认为消失。",
        earth: "再看连续记录或模型关系，分清一次现象和长期规律。",
        engineering: "先明确需求和限制，再看测试结果是否支持改进方案。",
        inquiry: "先找研究问题和变量，再检查证据能不能支持结论。"
      };
      return `${prefix}${hints[question?.topic] || "先读观察或实验记录，再用证据支持结论，不要只凭感觉作答。"}`;
    }
    function methodHintFor(question) {
      if (!question) return '先判断题型，再列式。遇到应用题，先把"已知"和"要求"分开看。';
      if (isChineseQuestion(question)) return chineseMethodHintFor(question);
      if (isEnglishQuestion(question)) return englishMethodHintFor(question);
      if (isScienceQuestion(question)) return scienceMethodHintFor(question);
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
        reading: "思维阅读题先判断问题目标，再筛有用条件，最后看哪一步或哪条结论最合适。",
        thinking: "精进题先判断分类：估算看范围，改错找错误，生活阅读先读表，开放题先找一个符合条件的例子。",
        appendix: "附加题不要急着算，先判断模型：规律、和差倍、植树、行程、比例或假设法。"
      };
      return hints[question.topic] || hints.word;
    }
    function hintForLevel(question, level = 1) {
      const safeLevel = clamp(Number(level) || 1, 1, 3);
      if (safeLevel === 1) {
        if (isChineseQuestion(question)) return "先看题目问什么，再回到短文或原文圈出直接相关的词句，作答时注意完整表达。";
        if (isEnglishQuestion(question)) return "先看疑问词、空格前后和句子的时间信息。";
        if (isScienceQuestion(question)) return "先分清观察到的现象、改变的条件和要解释的结论。";
        return question?.word ? "先分开看已知条件和问题，不要急着计算。" : "先确认运算符号、单位和计算顺序。";
      }
      if (safeLevel === 2) return methodHintFor(question);
      const steps = (Array.isArray(question?.steps) ? question.steps : []).slice(0, 2).map((step, index) => `${index + 1}. ${step}`).join(" ");
      return steps || methodHintFor(question);
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
    function splitInlineChoiceText(text) {
      const source = String(text || "").trim();
      const matches = [...source.matchAll(/[A-D][\.\uff0e、]\s*/g)];
      const uniqueKeys = new Set(matches.map((match) => match[0][0].toUpperCase()));
      if (matches.length < 2 || uniqueKeys.size !== matches.length) return null;
      const options = matches.map((match, index) => {
        const key = match[0][0].toUpperCase();
        const start = match.index + match[0].length;
        const end = index + 1 < matches.length ? matches[index + 1].index : source.length;
        return { key, text: source.slice(start, end).trim() };
      }).filter((option) => option.text);
      if (options.length < 2) return null;
      return {
        prompt: source.slice(0, matches[0].index).trim(),
        options
      };
    }
    function choiceQuestionTitleHTML(question) {
      const split = splitInlineChoiceText(question?.text);
      if (!split) return null;
      return `
        <span class="question-prompt">${escapeHTML(split.prompt)}</span>
        <span class="question-options" aria-label="题目选项">
          ${split.options.map((option) => `
            <span class="question-option">
              <b>${escapeHTML(option.key)}.</b>
              <span>${escapeHTML(option.text)}</span>
            </span>`).join("")}
        </span>`;
    }
    function objectiveQuestionPromptHTML(question) {
      const split = splitInlineChoiceText(question?.text);
      if (!split) return null;
      return `<span class="question-prompt">${escapeHTML(split.prompt)}</span>`;
    }
    function audioPromptHTML(question) {
      if (!hasAudioPrompt(question)) return "";
      return `
        <span class="audio-prompt-card">
          <button class="secondary audio-prompt-play" type="button" data-audio-prompt-play aria-label="播放英文录音">▶</button>
          <span>
            <b>听力题</b>
            <em>点击播放录音，可以重复听。</em>
          </span>
        </span>`;
    }
    function structuredQuestionTitleHTML(question) {
      const text = String(question?.text || "").trim();
      if (!text) return "";
      const expanded = text
        .replace(/\r/g, "")
        .replace(/(。|！|？)(请)/g, "$1\n$2")
        .replace(/(\S)(材料：|题目：|要求：|提示：|情境：|阅读提示：)/g, "$1\n$2");
      const lines = expanded
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      return lines.map((line) => {
        const label = line.match(/^(【[^】]+】|材料：|题目：|要求：|提示：|情境：|阅读提示：)/)?.[0] || "";
        const body = label ? line.slice(label.length).trim() : line;
        const labelClass = label ? " label-line" : "";
        const labelHTML = label ? `<b>${escapeHTML(label)}</b>` : "";
        return `<span class="question-line${labelClass}">${labelHTML}${body ? `<span>${escapeHTML(body)}</span>` : ""}</span>`;
      }).join("");
    }
    function renderQuestionTitle(question) {
      if (!els.questionText) return;
      els.questionText.classList.toggle("word", Boolean(question?.word));
      els.questionText.classList.toggle("vertical-question", question?.topic === "vertical");
      const choiceHTML = choiceQuestionTitleHTML(question);
      const titleHTML = choiceHTML && question?.interaction?.mode === "choice"
        ? objectiveQuestionPromptHTML(question)
        : choiceHTML;
      const audioHTML = audioPromptHTML(question);
      els.questionText.classList.toggle("choice-question", Boolean(choiceHTML));
      if (question?.passage) {
        els.questionText.classList.add("word");
        els.questionText.innerHTML = `${audioHTML}<span class="question-passage">${escapeHTML(question.passage)}</span>${titleHTML || structuredQuestionTitleHTML(question)}`;
        return;
      }
      if (titleHTML) {
        els.questionText.classList.add("word");
        els.questionText.innerHTML = `${audioHTML}${titleHTML}`;
        return;
      }
      if (question?.topic !== "vertical") {
        els.questionText.classList.add("word");
        els.questionText.innerHTML = `${audioHTML}${structuredQuestionTitleHTML(question)}`;
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
    function diagramSvg(content, caption = "", viewBox = "0 0 320 180") {
      return `<svg viewBox="${escapeAttr(viewBox)}" role="img" aria-label="${escapeAttr(caption || "题目图形")}" xmlns="http://www.w3.org/2000/svg">${content}</svg>${caption ? `<span>${escapeHTML(caption)}</span>` : ""}`;
    }
    function diagramShape(kind, x, y, size, label = "") {
      const fill = { circle: "#f9d56e", square: "#79c2ff", triangle: "#87d68d", rectangle: "#ffad8a" }[kind] || "#79c2ff";
      const stroke = "#31424f";
      const text = label ? `<text x="${x + size / 2}" y="${y + size + 14}" text-anchor="middle">${escapeHTML(label)}</text>` : "";
      if (kind === "circle") return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${text}`;
      if (kind === "triangle") return `<polygon points="${x + size / 2},${y} ${x + size},${y + size} ${x},${y + size}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${text}`;
      if (kind === "rectangle") return `<rect x="${x}" y="${y + 5}" width="${size + 8}" height="${size - 10}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${text}`;
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="5" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${text}`;
    }
    function renderDiagramShapeCount(diagram) {
      const pieces = [];
      const shapes = diagram.shapes || [];
      const sequence = shapes.flatMap((shape) => Array.from({ length: shape.count }, () => shape.kind));
      sequence.slice(0, 18).forEach((kind, index) => {
        const x = 30 + index % 6 * 43;
        const y = 24 + Math.floor(index / 6) * 44;
        pieces.push(diagramShape(kind, x, y, 28));
      });
      const legend = shapes.map((shape, index) => {
        const x = 34 + index * 92;
        return `${diagramShape(shape.kind, x, 146, 18)}<text x="${x + 28}" y="161">${escapeHTML(shape.label || shape.kind)} ${shape.count}</text>`;
      }).join("");
      return diagramSvg(`${pieces.join("")}${legend}`, diagram.caption || "按种类数图形");
    }
    function renderDiagramPositionRow(diagram) {
      const left = clamp(Number(diagram.left) || 0, 0, 8);
      const right = clamp(Number(diagram.right) || 0, 0, 8);
      const total = left + right + 1;
      const start = 160 - (total - 1) * 14;
      const people = Array.from({ length: total }, (_, index) => {
        const x = start + index * 28;
        const isFocus = index === left;
        return `<circle cx="${x}" cy="82" r="${isFocus ? 13 : 10}" fill="${isFocus ? "#f9d56e" : "#9fd6ff"}" stroke="#31424f" stroke-width="2"/><text x="${x}" y="118" text-anchor="middle">${isFocus ? "我" : index + 1}</text>`;
      }).join("");
      return diagramSvg(`${people}<path d="M46 82H274" stroke="#9aa7b2" stroke-width="2" stroke-dasharray="5 6"/><text x="62" y="45">左边 ${left} 人</text><text x="222" y="45">右边 ${right} 人</text>`, diagram.caption || "排队位置图");
    }
    function renderDiagramAngleSet(diagram) {
      const angles = diagram.angles || [];
      const angleSvg = (angle, index) => {
        const x = 45 + index % 4 * 70;
        const y = 58 + Math.floor(index / 4) * 68;
        const ray = angle.type === "right" ? "M0 0H38 M0 0V-38" : angle.type === "obtuse" ? "M0 0H38 M0 0L-28 -28" : "M0 0H38 M0 0L28 -28";
        const mark = angle.type === "right" ? `<path d="M13 0V-13H0" fill="none" stroke="#31424f" stroke-width="2"/>` : `<path d="M16 -2A18 18 0 0 ${angle.type === "obtuse" ? 0 : 1} ${angle.type === "obtuse" ? "-12 -12" : "12 -12"}" fill="none" stroke="#31424f" stroke-width="2"/>`;
        return `<g transform="translate(${x} ${y})"><path d="${ray}" stroke="#31424f" stroke-width="4" stroke-linecap="round"/>${mark}<text x="4" y="25">${escapeHTML(angle.label || String(index + 1))}</text></g>`;
      };
      return diagramSvg(angles.map(angleSvg).join(""), diagram.caption || "数一数直角");
    }
    function renderDiagramSegmentChain(diagram) {
      const a = Number(diagram.length) || 4;
      const b = Number(diagram.width) || 3;
      return diagramSvg(`<path d="M48 92H272" stroke="#31424f" stroke-width="5" stroke-linecap="round"/><circle cx="48" cy="92" r="5" fill="#31424f"/><circle cx="168" cy="92" r="5" fill="#31424f"/><circle cx="272" cy="92" r="5" fill="#31424f"/><text x="48" y="122" text-anchor="middle">A</text><text x="168" y="122" text-anchor="middle">B</text><text x="272" y="122" text-anchor="middle">C</text><text x="108" y="72" text-anchor="middle">${a} cm</text><text x="220" y="72" text-anchor="middle">${b} cm</text>`, diagram.caption || "线段长度图");
    }
    function renderDiagramRectangle(diagram) {
      const l = Number(diagram.length) || 8;
      const w = Number(diagram.width) || 4;
      const unit = diagram.unit || "cm";
      return diagramSvg(`<rect x="66" y="44" width="188" height="96" rx="6" fill="#dff2ff" stroke="#31424f" stroke-width="3"/><text x="160" y="34" text-anchor="middle">长 ${l} ${escapeHTML(unit)}</text><text x="270" y="96" text-anchor="middle" transform="rotate(90 270 96)">宽 ${w} ${escapeHTML(unit)}</text>`, diagram.caption || "长方形示意图");
    }
    function renderDiagramSquare(diagram) {
      const side = Number(diagram.side) || 6;
      const unit = diagram.unit || "cm";
      return diagramSvg(`<rect x="96" y="34" width="128" height="128" rx="6" fill="#e7f8dc" stroke="#31424f" stroke-width="3"/><text x="160" y="24" text-anchor="middle">边长 ${side} ${escapeHTML(unit)}</text><text x="235" y="102" transform="rotate(90 235 102)" text-anchor="middle">边长 ${side} ${escapeHTML(unit)}</text>`, diagram.caption || "正方形示意图");
    }
    function renderDiagramCompositeRect(diagram) {
      const a = Number(diagram.a) || 12;
      const b = Number(diagram.b) || 8;
      const c = Number(diagram.c) || 4;
      const d = Number(diagram.d) || 3;
      return diagramSvg(`<path d="M66 34H254V82H194V146H66Z" fill="#ffe5c7" stroke="#31424f" stroke-width="3" stroke-linejoin="round"/><path d="M194 82H254V146H194Z" fill="#fff" stroke="#9aa7b2" stroke-width="2" stroke-dasharray="6 5"/><text x="160" y="24" text-anchor="middle">总长 ${a} m</text><text x="47" y="92" text-anchor="middle" transform="rotate(-90 47 92)">总宽 ${b} m</text><text x="224" y="76" text-anchor="middle">挖去 ${c} m</text><text x="264" y="118" transform="rotate(90 264 118)" text-anchor="middle">${d} m</text>`, diagram.caption || "组合图形示意图");
    }
    function renderDiagramCuboid(diagram) {
      const l = Number(diagram.length) || 8;
      const w = Number(diagram.width) || 5;
      const h = Number(diagram.height) || 4;
      return diagramSvg(`<polygon points="78,68 202,68 246,38 122,38" fill="#e4f6ff" stroke="#31424f" stroke-width="3"/><polygon points="202,68 246,38 246,126 202,156" fill="#c9e9ff" stroke="#31424f" stroke-width="3"/><polygon points="78,68 202,68 202,156 78,156" fill="#f2fbff" stroke="#31424f" stroke-width="3"/><text x="140" y="176" text-anchor="middle">长 ${l} cm</text><text x="235" y="36" text-anchor="middle">宽 ${w} cm</text><text x="260" y="102" text-anchor="middle" transform="rotate(90 260 102)">高 ${h} cm</text>`, diagram.caption || "长方体示意图");
    }
    function renderDiagramCircle(diagram) {
      const r = Number(diagram.radius) || Math.round((Number(diagram.diameter) || 8) / 2);
      const diameter = Number(diagram.diameter) || r * 2;
      const showDiameter = diagram.mode === "diameter";
      const line = showDiameter ? `<path d="M82 92H238" stroke="#31424f" stroke-width="3"/><text x="160" y="80" text-anchor="middle">直径 ${diameter} cm</text>` : `<path d="M160 92H238" stroke="#31424f" stroke-width="3"/><text x="202" y="80" text-anchor="middle">半径 ${r} cm</text>`;
      return diagramSvg(`<circle cx="160" cy="92" r="78" fill="#fff4d2" stroke="#31424f" stroke-width="3"/><circle cx="160" cy="92" r="4" fill="#31424f"/>${line}`, diagram.caption || "圆的示意图");
    }
    function renderDiagramCircleRing(diagram) {
      const outer = clamp(Number(diagram.radius) || 8, 2, 20);
      const inner = clamp(Number(diagram.innerRadius) || Math.max(1, outer - 3), 1, outer - 1);
      return diagramSvg(`<circle cx="160" cy="92" r="78" fill="#ffe8a8" stroke="#31424f" stroke-width="3"/><circle cx="160" cy="92" r="40" fill="#fff" stroke="#31424f" stroke-width="3"/><path d="M160 92H238" stroke="#31424f" stroke-width="3"/><path d="M160 92H200" stroke="#71808b" stroke-width="3"/><text x="205" y="82" text-anchor="middle">外半径 ${outer} cm</text><text x="148" y="116" text-anchor="middle">内半径 ${inner} cm</text>`, diagram.caption || "圆环面积示意图");
    }
    function renderDiagramGridShape(diagram) {
      const rows = clamp(Number(diagram.rows) || 4, 1, 8);
      const cols = clamp(Number(diagram.cols) || 5, 1, 10);
      const size = Math.min(28, Math.floor(210 / cols), Math.floor(118 / rows));
      const originX = Math.round((320 - cols * size) / 2);
      const originY = 26;
      const filled = new Set((diagram.cells || []).map((cell) => `${cell.x},${cell.y}`));
      const cells = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const isFilled = filled.has(`${x},${y}`);
          cells.push(`<rect x="${originX + x * size}" y="${originY + y * size}" width="${size}" height="${size}" fill="${isFilled ? "#bfe6a8" : "#fff"}" stroke="#71808b" stroke-width="1.5"/>`);
        }
      }
      const note = diagram.unit ? `<text x="160" y="${originY + rows * size + 24}" text-anchor="middle">每小格边长 1 ${escapeHTML(diagram.unit)}</text>` : "";
      return diagramSvg(`${cells.join("")}${note}`, diagram.caption || "数格子图形");
    }
    function renderDiagramBlockView(diagram) {
      const columns = (diagram.columns || [2, 3, 1]).slice(0, 5);
      const size = 24;
      const totalWidth = columns.length * size;
      const originX = Math.round((320 - totalWidth) / 2);
      const baseY = 140;
      const blocks = [];
      columns.forEach((height, column) => {
        for (let layer = 0; layer < height; layer += 1) {
          const x = originX + column * size;
          const y = baseY - (layer + 1) * size;
          blocks.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${layer % 2 ? "#dff2ff" : "#f6fbff"}" stroke="#31424f" stroke-width="2"/>`);
        }
        blocks.push(`<text x="${originX + column * size + size / 2}" y="164" text-anchor="middle">${column + 1}</text>`);
      });
      return diagramSvg(`${blocks.join("")}<text x="160" y="22" text-anchor="middle">正面看到的方块列</text>`, diagram.caption || "观察物体示意图");
    }
    function renderDiagramMotionGrid(diagram) {
      const rows = clamp(Number(diagram.rows) || 4, 2, 8);
      const cols = clamp(Number(diagram.cols) || 6, 2, 10);
      const size = Math.min(28, Math.floor(220 / cols), Math.floor(118 / rows));
      const originX = Math.round((320 - cols * size) / 2);
      const originY = 28;
      const startX = clamp(Number(diagram.startX) || 0, 0, cols - 1);
      const startY = clamp(Number(diagram.startY) || 0, 0, rows - 1);
      const endX = clamp(Number(diagram.endX) || startX, 0, cols - 1);
      const endY = clamp(Number(diagram.endY) || startY, 0, rows - 1);
      const grid = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          grid.push(`<rect x="${originX + x * size}" y="${originY + y * size}" width="${size}" height="${size}" fill="#fff" stroke="#8b99a5" stroke-width="1.5"/>`);
        }
      }
      const cellRect = (x, y, fill, label) => `<rect x="${originX + x * size + 4}" y="${originY + y * size + 4}" width="${size - 8}" height="${size - 8}" rx="4" fill="${fill}" stroke="#31424f" stroke-width="2"/><text x="${originX + x * size + size / 2}" y="${originY + y * size + size / 2 + 5}" text-anchor="middle">${label}</text>`;
      const sx = originX + startX * size + size / 2;
      const sy = originY + startY * size + size / 2;
      const ex = originX + endX * size + size / 2;
      const ey = originY + endY * size + size / 2;
      const arrow = `<defs><marker id="motionArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#31424f"/></marker></defs><path d="M${sx} ${sy}L${ex} ${ey}" stroke="#31424f" stroke-width="3" stroke-linecap="round" marker-end="url(#motionArrow)"/>`;
      return diagramSvg(`${grid.join("")}${arrow}${cellRect(startX, startY, "#a9d6ff", "前")}${cellRect(endX, endY, "#ffd36e", "后")}`, diagram.caption || "平移示意图");
    }
    function renderDiagramAngleMeasure(diagram) {
      const angle = clamp(Number(diagram.angle) || 60, 10, 170);
      const rad = -angle * Math.PI / 180;
      const x2 = 160 + Math.cos(rad) * 90;
      const y2 = 118 + Math.sin(rad) * 90;
      const mark = angle === 90 ? `<path d="M178 118V100H160" fill="none" stroke="#31424f" stroke-width="2"/>` : `<path d="M190 118A30 30 0 0 0 ${160 + Math.cos(rad) * 30} ${118 + Math.sin(rad) * 30}" fill="none" stroke="#31424f" stroke-width="2"/>`;
      return diagramSvg(`<path d="M160 118H260" stroke="#31424f" stroke-width="4" stroke-linecap="round"/><path d="M160 118L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#31424f" stroke-width="4" stroke-linecap="round"/><circle cx="160" cy="118" r="5" fill="#31424f"/>${mark}<text x="178" y="92">${angle}°</text><text x="205" y="148" text-anchor="middle">边长 ${Number(diagram.length) || 6} cm</text>`, diagram.caption || "角的度量示意图");
    }
    function renderDiagramPolygonShape(diagram) {
      const mode = diagram.mode || "triangle";
      if (mode === "trapezoid") {
        return diagramSvg(`<polygon points="92,48 218,48 258,142 62,142" fill="#fff1cf" stroke="#31424f" stroke-width="3"/><path d="M92 48H218M62 142H258" stroke="#31424f" stroke-width="4"/><text x="155" y="38" text-anchor="middle">上底 ${Number(diagram.base) || 6} cm</text><text x="160" y="164" text-anchor="middle">下底 ${Number(diagram.base2) || 12} cm</text><text x="268" y="96" transform="rotate(90 268 96)" text-anchor="middle">腰 ${Number(diagram.side) || 5} cm</text>`, diagram.caption || "梯形特征图");
      }
      if (mode === "parallelogram") {
        return diagramSvg(`<polygon points="82,142 222,142 252,50 112,50" fill="#dff2ff" stroke="#31424f" stroke-width="3"/><path d="M112 50V142" stroke="#d35f5f" stroke-width="3" stroke-dasharray="6 5"/><text x="152" y="164" text-anchor="middle">底 ${Number(diagram.base) || 10} cm</text><text x="126" y="98" text-anchor="middle" transform="rotate(-90 126 98)">高 ${Number(diagram.height) || 6} cm</text>`, diagram.caption || "平行四边形示意图");
      }
      return diagramSvg(`<polygon points="160,34 58,144 262,144" fill="#e7f8dc" stroke="#31424f" stroke-width="3"/><text x="160" y="28" text-anchor="middle">${Number(diagram.angle) || 60}°</text><text x="76" y="136">${Number(diagram.angle2) || 60}°</text><text x="232" y="136">${Number(diagram.a) || 60}°</text><text x="160" y="166" text-anchor="middle">边 ${Number(diagram.side) || 8} cm</text>`, diagram.caption || "三角形示意图");
    }
    function renderDiagramPolygonArea(diagram) {
      const mode = diagram.mode || "parallelogram";
      const base = Number(diagram.base) || Number(diagram.length) || 10;
      const height = Number(diagram.height) || Number(diagram.width) || 6;
      if (mode === "triangle") {
        return diagramSvg(`<polygon points="160,36 70,144 250,144" fill="#e7f8dc" stroke="#31424f" stroke-width="3"/><path d="M160 36V144" stroke="#d35f5f" stroke-width="3" stroke-dasharray="6 5"/><text x="160" y="166" text-anchor="middle">底 ${base} cm</text><text x="176" y="94">高 ${height} cm</text><text x="244" y="92" transform="rotate(48 244 92)">斜边 ${Number(diagram.side) || base - 1} cm</text>`, diagram.caption || "三角形面积示意图");
      }
      if (mode === "trapezoid") {
        const top = Number(diagram.base2) || Math.max(2, base - 4);
        return diagramSvg(`<polygon points="110,48 210,48 260,144 60,144" fill="#fff1cf" stroke="#31424f" stroke-width="3"/><path d="M110 48V144" stroke="#d35f5f" stroke-width="3" stroke-dasharray="6 5"/><text x="160" y="38" text-anchor="middle">上底 ${top} cm</text><text x="160" y="166" text-anchor="middle">下底 ${base} cm</text><text x="126" y="100">高 ${height} cm</text>`, diagram.caption || "梯形面积示意图");
      }
      return diagramSvg(`<polygon points="82,144 222,144 252,48 112,48" fill="#dff2ff" stroke="#31424f" stroke-width="3"/><path d="M112 48V144" stroke="#d35f5f" stroke-width="3" stroke-dasharray="6 5"/><text x="152" y="166" text-anchor="middle">底 ${base} cm</text><text x="126" y="100">高 ${height} cm</text><text x="244" y="94" transform="rotate(-72 244 94)">邻边 ${Number(diagram.side) || height + 2} cm</text>`, diagram.caption || "平行四边形面积示意图");
    }
    function renderDiagramSymmetryGrid(diagram) {
      const rows = clamp(Number(diagram.rows) || 5, 3, 8);
      const cols = clamp(Number(diagram.cols) || 7, 5, 10);
      const size = Math.min(24, Math.floor(210 / cols), Math.floor(118 / rows));
      const originX = Math.round((320 - cols * size) / 2);
      const originY = 28;
      const axis = Math.floor(cols / 2);
      const x = clamp(Number(diagram.startX) || 1, 0, cols - 1);
      const y = clamp(Number(diagram.startY) || Math.floor(rows / 2), 0, rows - 1);
      const mirrorX = clamp(Number(diagram.endX) || (cols - 1 - x), 0, cols - 1);
      const grid = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          grid.push(`<rect x="${originX + c * size}" y="${originY + r * size}" width="${size}" height="${size}" fill="#fff" stroke="#8b99a5" stroke-width="1.2"/>`);
        }
      }
      const block = (c, fill, label) => `<rect x="${originX + c * size + 4}" y="${originY + y * size + 4}" width="${size - 8}" height="${size - 8}" rx="4" fill="${fill}" stroke="#31424f" stroke-width="2"/><text x="${originX + c * size + size / 2}" y="${originY + y * size + size / 2 + 5}" text-anchor="middle">${label}</text>`;
      return diagramSvg(`${grid.join("")}<path d="M${originX + (axis + 0.5) * size} ${originY - 8}V${originY + rows * size + 8}" stroke="#d35f5f" stroke-width="3" stroke-dasharray="7 5"/>${block(x, "#a9d6ff", "前")}${block(mirrorX, "#ffd36e", "后")}`, diagram.caption || "轴对称示意图");
    }
    function renderDiagramRotationGrid(diagram) {
      const rows = 5;
      const cols = 5;
      const size = 24;
      const originX = 100;
      const originY = 28;
      const startX = clamp(Number(diagram.startX) || 2, 0, 4);
      const startY = clamp(Number(diagram.startY) || 1, 0, 4);
      const endX = clamp(Number(diagram.endX) || 3, 0, 4);
      const endY = clamp(Number(diagram.endY) || 2, 0, 4);
      const grid = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) grid.push(`<rect x="${originX + x * size}" y="${originY + y * size}" width="${size}" height="${size}" fill="#fff" stroke="#8b99a5" stroke-width="1.2"/>`);
      }
      const dot = (x, y, fill, label) => `<circle cx="${originX + x * size + size / 2}" cy="${originY + y * size + size / 2}" r="9" fill="${fill}" stroke="#31424f" stroke-width="2"/><text x="${originX + x * size + size / 2}" y="${originY + y * size + size / 2 + 5}" text-anchor="middle">${label}</text>`;
      return diagramSvg(`<defs><marker id="rotationArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#31424f"/></marker></defs>${grid.join("")}<circle cx="${originX + 2.5 * size}" cy="${originY + 2.5 * size}" r="4" fill="#31424f"/><path d="M174 68A38 38 0 0 1 214 108" fill="none" stroke="#31424f" stroke-width="3" marker-end="url(#rotationArrow)"/>${dot(startX, startY, "#a9d6ff", "前")}${dot(endX, endY, "#ffd36e", "后")}`, diagram.caption || "旋转示意图");
    }
    function renderDiagramSolidNet(diagram) {
      const size = 30;
      const ox = 82;
      const oy = 34;
      const cells = diagram.mode === "cube5" ? [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]] : [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [1, 3]];
      const pieces = cells.map(([x, y], index) => `<rect x="${ox + x * size}" y="${oy + y * size}" width="${size}" height="${size}" fill="${index === 2 ? "#ffd36e" : "#dff2ff"}" stroke="#31424f" stroke-width="2"/><text x="${ox + x * size + size / 2}" y="${oy + y * size + 20}" text-anchor="middle">${index + 1}</text>`).join("");
      return diagramSvg(`${pieces}<text x="226" y="68">正方体展开图</text><text x="226" y="94">编号只帮助读图</text>`, diagram.caption || "展开图示意图");
    }
    function renderDiagramThreeView(diagram) {
      const columns = (diagram.columns || [2, 3, 1]).slice(0, 5);
      const size = 14;
      const front = columns.map((height, index) => Array.from({ length: height }, (_, layer) => `<rect x="${34 + index * size}" y="${94 - layer * size}" width="${size}" height="${size}" fill="#dff2ff" stroke="#31424f" stroke-width="1.4"/>`).join("")).join("");
      const top = columns.map((_, index) => `<rect x="${166 + index * size}" y="80" width="${size}" height="${size}" fill="#fff1cf" stroke="#31424f" stroke-width="1.4"/>`).join("");
      const rightHeight = Math.max(...columns);
      const right = Array.from({ length: rightHeight }, (_, layer) => `<rect x="238" y="${94 - layer * size}" width="${size}" height="${size}" fill="#e7f8dc" stroke="#31424f" stroke-width="1.4"/>`).join("");
      return diagramSvg(`<text x="60" y="28" text-anchor="middle">正面</text>${front}<text x="198" y="28" text-anchor="middle">上面</text>${top}<text x="250" y="28" text-anchor="middle">右面</text>${right}`, diagram.caption || "三视图示意图");
    }
    function renderDiagramRouteMap(diagram) {
      const east = Number(diagram.east) || 300;
      const north = Number(diagram.north) || 400;
      const distance = Number(diagram.distance) || 0;
      if (north <= 0) {
        const label = distance ? `图上距离 ${distance} cm` : `向东 ${east} m`;
        return diagramSvg(`<defs><marker id="routeArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#31424f"/></marker></defs><path d="M70 104H250" fill="none" stroke="#31424f" stroke-width="4" marker-end="url(#routeArrow)"/><circle cx="70" cy="104" r="6" fill="#31424f"/><circle cx="250" cy="104" r="6" fill="#ffd36e" stroke="#31424f" stroke-width="2"/><text x="70" y="132" text-anchor="middle">甲地</text><text x="250" y="132" text-anchor="middle">乙地</text><text x="160" y="88" text-anchor="middle">${escapeHTML(label)}</text><text x="160" y="48" text-anchor="middle">比例尺 1:${Number(diagram.scale) || 1000}</text>`, diagram.caption || "比例尺路线图");
      }
      return diagramSvg(`<defs><marker id="routeArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#31424f"/></marker></defs><path d="M70 136H230V48" fill="none" stroke="#31424f" stroke-width="4" marker-end="url(#routeArrow)"/><circle cx="70" cy="136" r="6" fill="#31424f"/><circle cx="230" cy="48" r="6" fill="#ffd36e" stroke="#31424f" stroke-width="2"/><text x="70" y="158" text-anchor="middle">学校</text><text x="240" y="40">图书馆</text><text x="150" y="126" text-anchor="middle">向东 ${east} m</text><text x="248" y="92" transform="rotate(90 248 92)" text-anchor="middle">向北 ${north} m</text><text x="278" y="34">北↑</text>`, diagram.caption || "位置方向路线图");
    }
    function renderDiagramCylinderCone(diagram) {
      const r = Number(diagram.radius) || 4;
      const h = Number(diagram.height) || 9;
      if (diagram.mode === "cone") {
        return diagramSvg(`<path d="M160 34L88 132Q160 164 232 132Z" fill="#fff1cf" stroke="#31424f" stroke-width="3"/><ellipse cx="160" cy="132" rx="72" ry="22" fill="none" stroke="#31424f" stroke-width="3"/><path d="M160 132H232" stroke="#31424f" stroke-width="3"/><path d="M160 34V132" stroke="#d35f5f" stroke-width="3" stroke-dasharray="6 5"/><text x="198" y="124">半径 ${r} cm</text><text x="142" y="84">高 ${h} cm</text>`, diagram.caption || "圆锥示意图");
      }
      return diagramSvg(`<ellipse cx="160" cy="48" rx="72" ry="22" fill="#dff2ff" stroke="#31424f" stroke-width="3"/><rect x="88" y="48" width="144" height="92" fill="#f6fbff" stroke="#31424f" stroke-width="3"/><ellipse cx="160" cy="140" rx="72" ry="22" fill="#dff2ff" stroke="#31424f" stroke-width="3"/><path d="M160 140H232" stroke="#31424f" stroke-width="3"/><text x="198" y="132">半径 ${r} cm</text><text x="246" y="94" transform="rotate(90 246 94)">高 ${h} cm</text>`, diagram.caption || "圆柱示意图");
    }
    function renderDiagramSectorShape(diagram) {
      const r = Number(diagram.radius) || 6;
      const angle = clamp(Number(diagram.angle) || 90, 30, 180);
      const large = angle > 180 ? 1 : 0;
      const end = angle * Math.PI / 180;
      const x = 160 + Math.cos(end) * 78;
      const y = 92 - Math.sin(end) * 78;
      if (diagram.mode === "semicircle") {
        return diagramSvg(`<path d="M82 104A78 78 0 0 1 238 104H82Z" fill="#fff4d2" stroke="#31424f" stroke-width="3"/><path d="M82 104H238" stroke="#31424f" stroke-width="3"/><text x="160" y="122" text-anchor="middle">直径 ${r * 2} cm</text>`, diagram.caption || "半圆示意图");
      }
      return diagramSvg(`<path d="M160 92H238A78 78 0 ${large} 0 ${x.toFixed(1)} ${y.toFixed(1)}Z" fill="#fff4d2" stroke="#31424f" stroke-width="3"/><path d="M160 92H238" stroke="#31424f" stroke-width="3"/><circle cx="160" cy="92" r="4" fill="#31424f"/><text x="198" y="84">半径 ${r} cm</text><text x="164" y="122">${angle}°</text>`, diagram.caption || "扇形示意图");
    }
    // 判断是否应隐藏参考截图：内置参考题中题干含“改写”的，数字被重编、
    // 与整页扫描图不符，会误导孩子；这类图隐藏。校内题库上传的图片（data URL）始终显示。
    function renderQuestionDiagram(question) {
      if (!els.questionDiagram) return;
      const diagram = normalizeQuestionDiagram(question?.diagram);
      const sourceImage = normalizeQuestionSourceImage(question?.sourceImage);
      const renderers = {
        "shape-count": renderDiagramShapeCount,
        "position-row": renderDiagramPositionRow,
        "angle-set": renderDiagramAngleSet,
        "segment-chain": renderDiagramSegmentChain,
        rectangle: renderDiagramRectangle,
        square: renderDiagramSquare,
        "composite-rect": renderDiagramCompositeRect,
        cuboid: renderDiagramCuboid,
        circle: renderDiagramCircle,
        "circle-ring": renderDiagramCircleRing,
        "grid-shape": renderDiagramGridShape,
        "block-view": renderDiagramBlockView,
        "motion-grid": renderDiagramMotionGrid,
        "angle-measure": renderDiagramAngleMeasure,
        "polygon-shape": renderDiagramPolygonShape,
        "polygon-area": renderDiagramPolygonArea,
        "symmetry-grid": renderDiagramSymmetryGrid,
        "rotation-grid": renderDiagramRotationGrid,
        "solid-net": renderDiagramSolidNet,
        "three-view": renderDiagramThreeView,
        "route-map": renderDiagramRouteMap,
        "cylinder-cone": renderDiagramCylinderCone,
        "sector-shape": renderDiagramSectorShape
      };
      const imageHtml = sourceImage
        ? `<figure class="question-source-image"><img src="${escapeAttr(sourceImage.src)}" alt="${escapeAttr(sourceImage.alt)}" loading="lazy" decoding="async"/>${sourceImage.cropNote ? `<figcaption>${escapeHTML(sourceImage.cropNote)}</figcaption>` : ""}</figure>`
        : "";
      const diagramHtml = diagram && renderers[diagram.type] ? renderers[diagram.type](diagram) : "";
      const html = [imageHtml, diagramHtml].filter(Boolean).join("");
      els.questionDiagram.hidden = !html;
      els.questionDiagram.innerHTML = html;
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
        reading: {
          rule: "先判断题目到底问什么，再筛有用条件、排除干扰信息，最后选择正确的推理步骤或结论。",
          subskills: ["读懂问题", "筛选条件", "排除干扰", "逻辑推理"],
          pitfalls: ["见数字就算", "把干扰条件也加进去", "没有分清先后顺序"],
          practice: "适合少量高质量练习：先说出理由，再输入选项序号或结果。"
        },
        thinking: {
          rule: "先判断题型分类：估算看大约范围，策略题选最省力方法，改错题先找错因，生活阅读先读表格或票据。",
          subskills: ["估算合理", "找错改错", "生活阅读", "数学表达"],
          pitfalls: ["不看题型直接计算", "单位量感不合理", "开放题只想到一个固定答案"],
          practice: "建议用分步作答，先说这题属于哪一类，再计算或选择序号。"
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
        return withCurriculumProfile(point, {
          rule: "只练 100 以内进位加法和退位减法：加法个位满十要进 1，减法个位不够要向十位借 1。",
          subskills: ["个位进位", "十位加进位", "个位退位", "退位后再减"],
          pitfalls: ["进位后十位忘加 1", "退位后个位没有加 10", "结果超过 100"],
          practice: '建议先用直接输入，再用判断题检查"是否进退位"。'
        });
      }
      return withCurriculumProfile(point, profile);
    }
    function renderKnowledgeDetail() {
      const point = state.pointId === "auto" ? null : (bankPointMap()[state.pointId] || pointMap[state.pointId]);
      const profile = knowledgeProfileFor(point);
      if (!els.knowledgeDetail) return;
      const wasOpen = Boolean(els.knowledgeDetail.open);
      els.knowledgeDetail.innerHTML = `
        <summary>知识点详情说明</summary>
        <div class="knowledge-card-body">
        <strong>${escapeHTML(knowledgeDetailTitle(point))}</strong>
        <p>${escapeHTML(profile.rule)}</p>
        <div class="chip-row">${profile.subskills.map((item) => `<span class="mini-chip">${escapeHTML(item)}</span>`).join("")}</div>
        <div class="chip-row">${profile.pitfalls.slice(0, 3).map((item) => `<span class="mini-chip">易错：${escapeHTML(item)}</span>`).join("")}</div>
        <p style="margin-top:10px">${escapeHTML(profile.practice)}</p>
        </div>`;
      els.knowledgeDetail.open = wasOpen;
    }
    const interactionEngine = window.MathCampQuestionInteraction.create({
      formatAnswer,
      isMobilePracticeViewport,
      isNonMathQuestion,
      isSelfReviewQuestion,
      normalizeAnswerModeForViewport,
      normalizeFormulaAnswer,
      round1,
      shuffle,
      splitInlineChoiceText,
      state,
      textAnswerMatches
    });
    const applyQuestionInteraction = interactionEngine.applyQuestionInteraction;
    const chooseInteractionMode = interactionEngine.chooseInteractionMode;
    const interactionRuleIssues = interactionEngine.interactionRuleIssues;
    const numericDistractors = interactionEngine.numericDistractors;
    const chineseAnswerValue = interactionEngine.textAnswerValue;
    const chineseChoiceOptions = interactionEngine.textChoiceOptions;
    function questionSpecBucket(spec) {
      const format = spec?.format || "input";
      const questionType = String(spec?.questionType || "通用题").trim() || "通用题";
      return `${format}:${questionType}`;
    }
    function createRoundQuestionPicker(preferred = state.answerMode) {
      const bucketCounts = new Map();
      const tieOffsets = new Map();
      return function pickQuestionSpec(items) {
        const list = Array.isArray(items) ? items.filter(Boolean) : [];
        if (!list.length) return undefined;
        const preferredFormat = preferred === "input" ? "input" : preferred === "choice" ? "choice" : "";
        const pool = preferredFormat ? list.filter((item) => item.format === preferredFormat) : list;
        const candidates = pool.length ? pool : list;
        const minimum = Math.min(...candidates.map((item) => bucketCounts.get(questionSpecBucket(item)) || 0));
        const underrepresented = candidates.filter((item) => (bucketCounts.get(questionSpecBucket(item)) || 0) === minimum);
        const tieKey = underrepresented.map(questionSpecBucket).join("|");
        const offset = tieOffsets.get(tieKey) || 0;
        tieOffsets.set(tieKey, offset + 1);
        const selected = underrepresented[offset % underrepresented.length];
        const bucket = questionSpecBucket(selected);
        bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + 1);
        return selected;
      };
    }
    function externalQuestionChanceForPoint(point) {
      const id = String(point?.id || "");
      if (/^c\d-/.test(id) && /(writing|picture)/.test(id)) return 0;
      const externalCount = externalQuestionCountForPoint(point);
      if (!externalCount) return 0;
      const localCount = localQuestionTemplateCountForPoint(point);
      return Math.min(0.65, externalCount / Math.max(1, externalCount + localCount));
    }
    function externalQuestionCountForPoint(point) {
      return window.MathCampExternalQuestionSeeds?.forPoint?.(point || {})?.length || 0;
    }
    function localQuestionTemplateCountForPoint(point) {
      const id = String(point?.id || "");
      if (/^c\d-/.test(id)) {
        return window.MathCampChineseQuestionGenerator?.questionTemplateCountForPoint?.(point || {}) || 1;
      }
      if (/^e\d-/.test(id)) {
        return window.MathCampEnglishQuestionGenerator?.questionTemplateCountForPoint?.(point || {}) || 1;
      }
      if (/^s\d-/.test(id)) {
        return window.MathCampScienceQuestionGenerator?.questionTemplateCountForPoint?.(point || {}) || 1;
      }
      return 1;
    }
    function makeStrictQuestionForPoint(point, preferred = state.answerMode, generationOptions = {}) {
      const target = bankPointMap()[point?.id] || pointMap[point?.id] || point;
      const fallbackPoint = choosePoint();
      if (!target && !fallbackPoint) return null;
      if (!target) return applyQuestionInteraction(enrichQuestionLearningMeta(makeQuestion(fallbackPoint)), preferred);
      let qualityFallback = null;
      for (let attempt = 0; attempt < 16; attempt += 1) {
        const question = enrichQuestionLearningMeta(makeQuestion(target, { strict: true, ...generationOptions }));
        const issues = questionRuleIssues(target, question, { strict: true });
        if (!qualityFallback || question.learningMeta.qualityScore > qualityFallback.learningMeta.qualityScore) qualityFallback = question;
        if (!issues.length && question.learningMeta.qualityScore >= 60) return applyQuestionInteraction(question, preferred);
      }
      return applyQuestionInteraction(qualityFallback || enrichQuestionLearningMeta(makeQuestion(target, { strict: true, ...generationOptions })), preferred);
    }
    function enrichQuestionLearningMeta(question) {
      if (!question) return question;
      const supported = enhanceQuestionTeachingSupport(question);
      const quality = LearningQuality.scoreQuestionQuality?.(supported) || { score: 100, reasons: [] };
      const mastery = masteryFor(activeProfile(), supported.pointId);
      return {
        ...supported,
        learningMeta: {
          ...(supported.learningMeta || {}),
          qualityScore: quality.score,
          qualityReasons: quality.reasons,
          familyKey: LearningQuality.questionFamilyKey?.(supported) || questionRepeatKey(supported),
          difficultyScore: LearningQuality.estimateDifficulty?.(supported, mastery) || clamp(Number(mastery.level) || 1, 1, 5)
        }
      };
    }
    function enhanceQuestionTeachingSupport(question) {
      const explanation = String(question?.explanation || "").trim();
      if (/易错提醒|检查方法/.test(explanation)) return question;
      const pitfall = (Array.isArray(question?.commonPitfalls) ? question.commonPitfalls : []).map((item) => String(item || "").trim()).find(Boolean);
      const subject = subjectIdFromQuestion(question);
      const check = {
        math: "把结果代回条件，并检查运算符号、单位和数量关系",
        chinese: "把答案放回原句或材料，确认表达完整且有依据",
        english: "把答案放回句子，检查词义、语法和拼写",
        science: "用观察记录、变量或证据重新核对结论"
      }[subject] || "把答案放回题目条件重新核对";
      return {
        ...question,
        explanation: `${explanation}${explanation ? " " : ""}易错提醒：${pitfall || "不要只凭第一印象作答"}。检查方法：${check}。`
      };
    }
    function makeDistinctQuestionForPoint(point, preferred = state.answerMode, scope = {}) {
      const target = bankPointMap()[point?.id] || pointMap[point?.id] || point;
      const fallbackPoint = choosePoint();
      if (!target && !fallbackPoint) return null;
      if (!target) return applyQuestionInteraction(makeQuestion(fallbackPoint), preferred);
      const used = scope.usedSignatures instanceof Set ? scope.usedSignatures : new Set();
      const avoidRepeatKeys = scope.avoidRepeatKeys instanceof Set ? scope.avoidRepeatKeys : new Set();
      const usedFamilyKeys = scope.usedFamilyKeys instanceof Set ? scope.usedFamilyKeys : new Set();
      const recentFamilyKeys = scope.recentFamilyKeys instanceof Set ? scope.recentFamilyKeys : new Set();
      const baseTargetDifficulty = Number(scope.targetDifficulty) || targetDifficultyForPoint(target);
      const targetDifficulty = LearningQuality.chainDifficultyTarget?.(scope.chainStage, baseTargetDifficulty) || baseTargetDifficulty;
      const previous = String(scope.previousSignature || "");
      let fallback = null;
      let uniqueRecentFallback = null;
      let bestCandidate = null;
      let bestPriority = -Infinity;
      let last = null;
      for (let attempt = 0; attempt < 32; attempt += 1) {
        const generationOptions = {
          pick: scope.pick,
          ...(scope.preferExternal ? { preferExternal: true } : {}),
          ...(scope.disableExternal || (attempt > 0 && last?.enrichment) ? { disableExternal: true } : {}),
          ...(typeof scope.externalChance === "number" ? { externalChance: scope.externalChance } : {}),
          ...(scope.chainStage ? { chainStage: scope.chainStage } : {}),
          difficultyLevel: Math.round(targetDifficulty)
        };
        const question = makeStrictQuestionForPoint(target, preferred, generationOptions);
        const sig = signature(question);
        const repeatKey = questionRepeatKey(question);
        const meta = question.learningMeta || {};
        const priority = LearningQuality.candidatePriority?.(meta, {
          targetDifficulty,
          usedFamilyKeys,
          recentFamilyKeys,
          preferredFamilyKey: scope.preferredFamilyKey,
          avoidFamilyKey: scope.avoidFamilyKey
        }) || 0;
        last = question;
        if (sig !== previous && !used.has(sig) && !avoidRepeatKeys.has(repeatKey) && priority > bestPriority) {
          bestCandidate = question;
          bestPriority = priority;
        }
        const familyMatchesScope = (!scope.preferredFamilyKey || meta.familyKey === scope.preferredFamilyKey)
          && (!scope.avoidFamilyKey || meta.familyKey !== scope.avoidFamilyKey);
        if (sig !== previous && !used.has(sig) && !avoidRepeatKeys.has(repeatKey)
          && !usedFamilyKeys.has(meta.familyKey) && !recentFamilyKeys.has(meta.familyKey)
          && familyMatchesScope && meta.qualityScore >= 60 && Math.abs((meta.difficultyScore || targetDifficulty) - targetDifficulty) <= 0.9) return question;
        if (sig !== previous && !used.has(sig) && !uniqueRecentFallback) uniqueRecentFallback = question;
        if (sig !== previous && !fallback) fallback = question;
      }
      return bestCandidate || uniqueRecentFallback || fallback || last || makeStrictQuestionForPoint(target, preferred, { pick: scope.pick });
    }
    function targetDifficultyForPoint(point) {
      return LearningQuality.targetDifficultyForMastery?.(masteryFor(activeProfile(), point?.id)) || 2.5;
    }
    function buildQuestionSetForPoint(point, count, preferred = state.answerMode) {
      const target = bankPointMap()[point?.id] || pointMap[point?.id] || point;
      if (!target) return [];
      const total = clamp(Number(count) || state.setSize || 10, 1, MAX_SET_SIZE);
      const usedSignatures = new Set();
      const usedFamilyKeys = new Set();
      const avoidRepeatKeys = recentQuestionRepeatKeys(activeProfile(), target.grade);
      const recentFamilyKeys = recentQuestionFamilyKeySet(activeProfile(), target.grade);
      const pick = createRoundQuestionPicker(preferred);
      let previousSignature = "";
      return Array.from({ length: total }, () => {
        const question = makeDistinctQuestionForPoint(target, preferred, { usedSignatures, usedFamilyKeys, previousSignature, pick, avoidRepeatKeys, recentFamilyKeys, targetDifficulty: targetDifficultyForPoint(target), externalChance: externalQuestionChanceForPoint(target) });
        if (!question) return null;
        previousSignature = signature(question);
        usedSignatures.add(previousSignature);
        if (question.learningMeta?.familyKey) usedFamilyKeys.add(question.learningMeta.familyKey);
        return question;
      }).filter(Boolean);
    }
    function buildChineseBalancedQuestionSet(count = state.setSize, preferred = state.answerMode) {
      const total = clamp(Number(count) || state.setSize || 10, 1, MAX_SET_SIZE);
      const bank = activeBank();
      const plan = window.MathCampChineseQuestionGenerator?.buildSourcePlan?.(total, bank.autoSourcePolicy)
        || Array.from({ length: total }, () => "inTextbook");
      const pointsForGrade = availablePoints(state.grade);
      const sourceOffsets = {};
      const usedSignatures = new Set();
      const usedFamilyKeys = new Set();
      const avoidRepeatKeys = recentQuestionRepeatKeys(activeProfile(), state.grade);
      const recentFamilyKeys = recentQuestionFamilyKeySet(activeProfile(), state.grade);
      const pick = createRoundQuestionPicker(preferred);
      let previousSignature = "";
      function pointTermBucket(point) {
        const term = String(point?.curriculum?.term || "");
        const upper = term.includes("上");
        const lower = term.includes("下");
        if (upper && !lower) return "upper";
        if (lower && !upper) return "lower";
        return "year";
      }
      return plan.map((sourceType) => {
        const pool = pointsForGrade.filter((point) => point.sourceType === sourceType);
        const fallbackPool = pointsForGrade.filter((point) => point.sourceType !== "abilityLine");
        let candidates = pool.length ? pool : fallbackPool.length ? fallbackPool : pointsForGrade;
        const offset = sourceOffsets[sourceType] || 0;
        sourceOffsets[sourceType] = offset + 1;
        if (sourceType === "inTextbook") {
          const preferredTerm = offset % 2 === 0 ? "upper" : "lower";
          const termCandidates = candidates.filter((point) => pointTermBucket(point) === preferredTerm);
          if (termCandidates.length) candidates = termCandidates;
        }
        const point = candidates[Math.floor(offset / (sourceType === "inTextbook" ? 2 : 1)) % candidates.length] || choosePoint();
        const question = makeDistinctQuestionForPoint(point, preferred, { usedSignatures, usedFamilyKeys, previousSignature, pick, avoidRepeatKeys, recentFamilyKeys, targetDifficulty: targetDifficultyForPoint(point), externalChance: externalQuestionChanceForPoint(point) });
        if (!question) return null;
        previousSignature = signature(question);
        usedSignatures.add(previousSignature);
        if (question.learningMeta?.familyKey) usedFamilyKeys.add(question.learningMeta.familyKey);
        return question;
      }).filter(Boolean);
    }
    function buildAdaptiveQuestionSet(count = state.setSize, preferred = state.answerMode) {
      if (activeSubjectId() === "chinese" && state.pointId === "auto") {
        return buildChineseBalancedQuestionSet(count, preferred);
      }
      return window.MathCampPracticeEngine.buildAdaptiveQuestionSet({
        activeProfile,
        applyQuestionInteraction,
        availablePoints,
        choosePoint,
        clamp,
        dueWrongbook,
        externalQuestionChanceForPoint,
        makeQuestion,
        makeDistinctQuestionForPoint,
        makeStrictQuestionForPoint,
        pointMap: bankPointMap(),
        avoidRepeatKeys: recentQuestionRepeatKeys(activeProfile(), state.grade),
        recentFamilyKeys: recentQuestionFamilyKeySet(activeProfile(), state.grade),
        recentPointIds: recentQuestionPointIds(activeProfile(), state.grade),
        questionFamilyKey: LearningQuality.questionFamilyKey,
        targetDifficultyForPoint,
        createRoundQuestionPicker,
        shuffle,
        signature,
        state,
        weakestPoints
      }, count, preferred);
    }
    function buildSmartDailyQuestionSet(count = state.setSize, preferred = state.answerMode) {
      const profile = activeProfile();
      const dailyPlan = window.MathCampDailyLearningPlan?.buildPlan?.({
        profile,
        grade: state.grade,
        subject: activeSubjectId(),
        setSize: count,
        dueCount: dueWrongbook(profile, state.grade).length,
        dateKey: todayKey()
      }) || null;
      if (dailyPlan) profile.learningPlan = dailyPlan;
      return window.MathCampPracticeEngine.buildDailyQuestionSet({
        activeProfile,
        applyQuestionInteraction,
        availablePoints,
        choosePoint,
        clamp,
        dueWrongbook,
        externalQuestionChanceForPoint,
        makeQuestion,
        makeDistinctQuestionForPoint,
        makeStrictQuestionForPoint,
        pointMap: bankPointMap(),
        avoidRepeatKeys: recentQuestionRepeatKeys(activeProfile(), state.grade),
        recentFamilyKeys: recentQuestionFamilyKeySet(activeProfile(), state.grade),
        recentPointIds: recentQuestionPointIds(activeProfile(), state.grade),
        questionFamilyKey: LearningQuality.questionFamilyKey,
        targetDifficultyForPoint,
        createRoundQuestionPicker,
        shuffle,
        signature,
        state,
        weakestPoints,
        dailyPlan
      }, count, preferred, dailyPlan).map((question) => ({
        ...question,
        dailySmart: true,
        diagnostic: dailyPlan?.mode === "diagnostic",
        reviewSource: question.reviewSource || "fresh"
      }));
    }
    function buildWeeklyReviewQuestionSet(count = state.setSize, preferred = state.answerMode) {
      const total = clamp(Number(count) || state.setSize || 10, 1, MAX_SET_SIZE);
      const profile = activeProfile();
      const weeklyNeed = new Map();
      currentWeekItems(profile).forEach((item) => {
        if (Number(item.grade || state.grade) !== Number(state.grade)) return;
        if (item.subject && item.subject !== activeSubjectId()) return;
        const pointId = item.pointId;
        if (!pointId || pointId === "auto") return;
        const need = (item.correct ? 0 : 4) + (Number(item.hintLevel) || 0) + (item.confidence === "guess" ? 2 : item.confidence === "unsure" ? 1 : 0);
        weeklyNeed.set(pointId, (weeklyNeed.get(pointId) || 0) + need);
      });
      dueWrongbook(profile, state.grade).forEach((item) => {
        const pointId = item?.question?.pointId;
        if (pointId) weeklyNeed.set(pointId, (weeklyNeed.get(pointId) || 0) + 6);
      });
      const candidates = availablePoints(state.grade).slice().sort((a, b) => {
        const needDiff = (weeklyNeed.get(b.id) || 0) - (weeklyNeed.get(a.id) || 0);
        if (needDiff) return needDiff;
        return (masteryFor(profile, a.id).score || 0) - (masteryFor(profile, b.id).score || 0);
      });
      const usedSignatures = new Set();
      const usedFamilyKeys = new Set();
      const avoidRepeatKeys = recentQuestionRepeatKeys(profile, state.grade);
      const recentFamilyKeys = recentQuestionFamilyKeySet(profile, state.grade);
      const pickQuestion = createRoundQuestionPicker(preferred);
      let previousSignature = "";
      return Array.from({ length: total }, (_, index) => {
        const point = candidates[index % Math.max(1, candidates.length)] || choosePoint();
        const question = makeDistinctQuestionForPoint(point, preferred, {
          usedSignatures,
          usedFamilyKeys,
          previousSignature,
          pick: pickQuestion,
          avoidRepeatKeys,
          recentFamilyKeys,
          targetDifficulty: targetDifficultyForPoint(point),
          externalChance: externalQuestionChanceForPoint(point)
        });
        if (!question) return null;
        previousSignature = signature(question);
        usedSignatures.add(previousSignature);
        if (question.learningMeta?.familyKey) usedFamilyKeys.add(question.learningMeta.familyKey);
        return { ...question, weeklyReview: true, reviewSource: "weekly" };
      }).filter(Boolean);
    }
    function masteryFor(profile, pointId) {
      if (!profile.mastery[pointId]) profile.mastery[pointId] = { attempts: 0, correct: 0, level: 1, streak: 0, score: 12, stableCorrect: 0, diagnostics: {} };
      if (LearningQuality.normalizeMasteryState) profile.mastery[pointId] = LearningQuality.normalizeMasteryState(profile.mastery[pointId]);
      return profile.mastery[pointId];
    }
    function masteryAccuracy(profile, pointId) {
      const m = masteryFor(profile, pointId);
      return m.attempts ? m.correct / m.attempts : 0;
    }
    function weakestPoints(limit = 4) {
      const profile = activeProfile();
      const recentPointIds = recentQuestionPointIds(profile, profile.grade || state.grade, 60);
      return availablePoints(profile.grade)
        .map((point) => {
          const m = masteryFor(profile, point.id);
          const accuracy = m.attempts ? m.correct / m.attempts : 0.45;
          const masteryScore = clamp(Number(m.score) || 0, 0, 100) / 100;
          const wrongs = profile.wrongbook.filter((item) => item.question.pointId === point.id).length;
          const recentPenalty = recentPointIds.has(point.id) ? 0.22 : 0;
          return { point, score: (accuracy + masteryScore) / 2 - wrongs * 0.08 + Math.min(m.attempts, 5) * 0.015 + recentPenalty };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map((entry) => entry.point);
    }
    function choosePoint() {
      const options = availablePoints(state.grade);
      if (state.pointId !== "auto") return bankPointMap()[state.pointId] || pointMap[state.pointId] || options[0];
      return chooseAutoPoint(options, state.adaptive);
    }
    function chooseAutoPoint(options, adaptive = true) {
      if (!state.adaptive) return pick(options);
      if (!adaptive) return pick(options);
      const profile = activeProfile();
      const dueCounts = new Map();
      const recentPointIds = recentQuestionPointIds(profile, state.grade, 60);
      dueWrongbook(profile, state.grade).forEach((item) => {
        const pointId = item?.question?.pointId;
        if (!pointId) return;
        dueCounts.set(pointId, (dueCounts.get(pointId) || 0) + 1);
      });
      const recentWrongPointIds = profile.history
        .filter((item) => !item.correct)
        .slice(0, 30)
        .map((item) => item.pointId);
      const weighted = [];
      options.forEach((point) => {
        const m = masteryFor(profile, point.id);
        const accuracy = m.attempts ? m.correct / m.attempts : 0.3;
        const masteryNeed = 1 - clamp(Number(m.score) || 0, 0, 100) / 100;
        const diagnosticNeed = Object.values(m.diagnostics || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
        const wrongs = profile.wrongbook.filter((item) => item.question.pointId === point.id).length;
        const dueBoost = (dueCounts.get(point.id) || 0) * 4;
        const recentWrongs = recentWrongPointIds.filter((id) => id === point.id).length;
        const coldStart = m.attempts < 3 ? 2 : 0;
        const levelBoost = clamp(6 - (Number(m.level) || 1), 1, 5);
        const recentPenalty = recentPointIds.has(point.id) ? 10 : 0;
        const weight = clamp(Math.round((1 - accuracy) * 5 + masteryNeed * 6 + Math.min(diagnosticNeed, 5) * 0.8 + wrongs * 2.4 + dueBoost + recentWrongs * 1.6 + coldStart + levelBoost - recentPenalty), 0, 18);
        for (let i = 0; i < weight; i += 1) weighted.push(point);
      });
      return pick(weighted.length ? weighted : options);
    }

    function makeQuestion(point = choosePoint(), options = {}) {
      return window.MathCampQuestionGenerator.makeQuestion({
        activeProfile,
        ensureQuestionMatchesRule,
        makeExtraQuestion,
        makeSupplementalQuestion,
        masteryFor,
        pick: options.pick,
        shuffle,
        state,
        makers
      }, point, options);
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
        templateType: data?.templateType || (data?.word ? "情境应用" : point.topic === "appendix" ? "拓展思维" : point.topic === "reading" ? "思维阅读" : point.topic === "thinking" ? "思维精进" : point.topic === "mixed" ? "运算顺序" : point.topic === "twostep" ? "两步计算" : point.topic === "vertical" ? "竖式计算" : "规则计算"),
        curriculumBand: curriculumBandFor(point),
        ...data
      });
    }
    const ruleEngine = window.MathCampQuestionRules.create({
      formatAnswer,
      isNonMathQuestion,
      round1
    });
    const questionNumbers = ruleEngine.questionNumbers;
    const questionPatternKey = ruleEngine.questionPatternKey;
    const questionRuleIssues = ruleEngine.questionRuleIssues;
    const topicSpecificRuleIssues = ruleEngine.topicSpecificRuleIssues;
    const tryEvaluateQuestion = ruleEngine.tryEvaluateQuestion;
    function ensureQuestionMatchesRule(point, question, options = {}) {
      const issues = questionRuleIssues(point, question, options);
      const mustRepair = options.strict || issues.length > 0;
      if (!mustRepair || !issues.length) return question;
      for (let i = 0; i < 12; i += 1) {
        const retry = makers[point.topic](point, Math.max(1, masteryFor(activeProfile(), point.id).level || 1));
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
      if (!point?.curriculum?.term || !point.curriculum?.unit || !point.curriculum?.stage) warnings.push("缺少杭州教材单元定位");
      if (!Array.isArray(point?.curriculum?.questionTypes) || !point.curriculum.questionTypes.length) warnings.push("缺少教材题型标签");
      if (idCounts.get(point.id) > 1) warnings.push("知识点 id 重复");
      if (labelCounts.get(`${point.grade}-${point.label}`) > 1) warnings.push("同年级知识点名称重复");
      return warnings;
    }
    function questionQualityWarnings(point, question) {
      const warnings = [];
      const text = String(question?.text || "").trim();
      const explanation = String(question?.explanation || "").trim();
      const visibleCopy = `${text}\n${explanation}`;
      const steps = Array.isArray(question?.steps) ? question.steps.filter(Boolean) : [];
      if (text.length < 5) warnings.push("题干过短");
      if (!/[？?]/.test(text)) warnings.push("题干缺少问号");
      if (explanation.length < 10) warnings.push("解析过短");
      if (steps.length < 2) warnings.push("步骤少于 2 步");
      if (point?.topic === "word" && !question?.word) warnings.push("应用题知识点未标记 word");
      if (/参考截图|改写题|(?:PDF|DOCX).{0,24}改写|根据.{0,24}(?:PDF|DOCX).{0,24}改写|按真实试卷的做法|本题对应.+里的/.test(visibleCopy)) {
        warnings.push("题干含学生不需要看到的制作说明");
      }
      const genericDistractorPhrases = ["只看字面随便猜", "不读题目直接选", "答案和题目无关"];
      if (genericDistractorPhrases.filter((phrase) => text.includes(phrase)).length >= 2) {
        warnings.push("干扰项使用固定万能错误话术");
      }
      const scienceQuestion = question?.subject === "science" || /^s\d-/.test(String(question?.pointId || ""));
      if (scienceQuestion && point?.topic === "earth" && /天气/.test(visibleCopy) && /宇宙|天体|模型位置/.test(visibleCopy)) {
        warnings.push("科学题混合了不相关的概念范围");
      }
      const quality = LearningQuality.scoreQuestionQuality?.(question);
      if (quality && quality.score < 60) warnings.push(`题目质量分过低（${quality.score}）`);
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
    function questionBankPointForAudit(pointId) {
      const subjects = ["math", "chinese", "english", "science"];
      for (const subject of subjects) {
        const bank = SubjectRegistry.subjectBank?.(subject);
        const point = bank?.pointMap?.[pointId] || bank?.points?.find?.((item) => item.id === pointId);
        if (point) return { ...point, subject };
      }
      const point = pointMap[pointId] || {};
      return { ...point, subject: point.subject || (/^c\d-/.test(pointId) ? "chinese" : /^e\d-/.test(pointId) ? "english" : /^s\d-/.test(pointId) ? "science" : "math") };
    }
    function flattenGradeSeedModule(module, bucketLabel, gradeLabel, grade) {
      return Object.entries(module?.BANK || {}).flatMap(([pointId, items]) => (items || []).map((item) => ({
        pointId,
        grade,
        subject: questionBankPointForAudit(pointId).subject,
        pointLabel: questionBankPointForAudit(pointId).label || pointId,
        bucketLabel: gradeLabel ? `${gradeLabel}${bucketLabel}` : bucketLabel,
        id: item.id,
        answerType: item.answerType || "text",
        templateType: item.templateType || item.questionType || "",
        sourceMeta: item.sourceMeta || {},
        hasDiagram: Boolean(item.diagram),
        hasSourceImage: Boolean(item.sourceImage),
        sourceImage: item.sourceImage || null
      })));
    }
    function questionSourceAuditItems() {
      return [
        ...flattenGradeSeedModule(window.MathCampGrade2ReferenceQuestionSeeds, "参考资料派生", "二年级", 2),
        ...flattenGradeSeedModule(window.MathCampGrade2OriginalQuestionSeeds, "原创扩展", "二年级", 2),
        ...flattenGradeSeedModule(window.MathCampGrade3ReferenceQuestionSeeds, "参考资料派生", "三年级", 3),
        ...flattenGradeSeedModule(window.MathCampGrade3OriginalQuestionSeeds, "原创扩展", "三年级", 3),
        ...flattenGradeSeedModule(window.MathCampGrade4ReferenceQuestionSeeds, "参考资料派生", "四年级", 4),
        ...flattenGradeSeedModule(window.MathCampGrade4OriginalQuestionSeeds, "原创扩展", "四年级", 4)
      ];
    }
    function matchesSourceFilter(item, filter) {
      const meta = item.sourceMeta || {};
      if (filter === "reference") return meta.kind === "referenceDerived";
      if (filter === "original") return meta.kind === "codexOriginal";
      if (filter === "self-drawn") return meta.visualPolicy === "self-drawn-diagram" || item.hasDiagram;
      if (filter === "scan") return meta.scanStatus === "scan-image" || meta.quality === "scan-page-rewrite";
      if (filter === "pdf-image") return item.hasSourceImage || meta.visualPolicy === "pdf-crop-image";
      return true;
    }
    function normalizeQuestionSourceAuditFilter(filter = "all") {
      if (typeof filter === "string") return { source: filter, subject: "all", grade: "all", pointId: "all" };
      return {
        source: filter?.source || "all",
        subject: filter?.subject || "all",
        grade: filter?.grade || "all",
        pointId: filter?.pointId || "all"
      };
    }
    function questionBankAuditFilterFromUI(source = null) {
      return {
        source: source || els.sourceFilterBtns.find((btn) => btn.classList.contains("active"))?.dataset.sourceFilter || "all",
        subject: els.questionBankSubjectFilter?.value || "all",
        grade: els.questionBankGradeFilter?.value || "all",
        pointId: els.questionBankPointFilter?.value || "all"
      };
    }
    function itemMatchesQuestionBankFilters(item, filters) {
      if (filters.subject !== "all" && item.subject !== filters.subject) return false;
      if (filters.grade !== "all" && Number(item.grade) !== Number(filters.grade)) return false;
      if (filters.pointId !== "all" && item.pointId !== filters.pointId) return false;
      return true;
    }
    function runQuestionSourceAudit(filter = "all") {
      const filters = normalizeQuestionSourceAuditFilter(filter);
      const normalizedFilter = ["all", "reference", "original", "self-drawn", "scan", "pdf-image"].includes(filters.source) ? filters.source : "all";
      filters.source = normalizedFilter;
      const items = questionSourceAuditItems();
      const scopedItems = items.filter((item) => itemMatchesQuestionBankFilters(item, filters));
      const filtered = scopedItems.filter((item) => matchesSourceFilter(item, normalizedFilter));
      const countBy = (predicate) => items.filter(predicate).length;
      const scopedCountBy = (predicate) => scopedItems.filter(predicate).length;
      return {
        filter: normalizedFilter,
        filters,
        total: filtered.length,
        counts: {
          all: items.length,
          reference: countBy((item) => item.sourceMeta?.kind === "referenceDerived"),
          original: countBy((item) => item.sourceMeta?.kind === "codexOriginal"),
          selfDrawn: countBy((item) => item.sourceMeta?.visualPolicy === "self-drawn-diagram" || item.hasDiagram),
          scan: countBy((item) => item.sourceMeta?.scanStatus === "scan-image" || item.sourceMeta?.quality === "scan-page-rewrite"),
          pdfImage: countBy((item) => item.hasSourceImage || item.sourceMeta?.visualPolicy === "pdf-crop-image"),
          scopedAll: scopedItems.length,
          scopedReference: scopedCountBy((item) => item.sourceMeta?.kind === "referenceDerived"),
          scopedOriginal: scopedCountBy((item) => item.sourceMeta?.kind === "codexOriginal")
        },
        items: filtered.slice(0, 36).map((item) => ({
          id: item.id,
          pointId: item.pointId,
          pointLabel: item.pointLabel,
          grade: item.grade,
          subject: item.subject,
          bucketLabel: item.bucketLabel,
          answerType: item.answerType,
          templateType: item.templateType,
          sourceFile: item.sourceMeta?.sourceFile || "",
          sourcePage: item.sourceMeta?.sourcePage || null,
          quality: item.sourceMeta?.quality || "",
          scanStatus: item.sourceMeta?.scanStatus || "",
          visualPolicy: item.sourceMeta?.visualPolicy || "",
          imageSrc: item.sourceImage?.src || ""
        }))
      };
    }
    function syncQuestionBankPointFilter() {
      if (!els.questionBankPointFilter) return;
      const current = els.questionBankPointFilter.value || "all";
      const filters = questionBankAuditFilterFromUI();
      const pointsForSelect = questionSourceAuditItems()
        .filter((item) => itemMatchesQuestionBankFilters(item, { ...filters, pointId: "all" }))
        .reduce((map, item) => {
          if (!map.has(item.pointId)) map.set(item.pointId, item);
          return map;
        }, new Map());
      const options = [`<option value="all">全部知识点</option>`].concat(
        Array.from(pointsForSelect.values())
          .sort((a, b) => Number(a.grade) - Number(b.grade) || String(a.pointId).localeCompare(String(b.pointId)))
          .map((item) => `<option value="${escapeHTML(item.pointId)}">${escapeHTML(item.pointLabel)}</option>`)
      );
      els.questionBankPointFilter.innerHTML = options.join("");
      els.questionBankPointFilter.value = pointsForSelect.has(current) ? current : "all";
    }
    function renderQuestionSourceAudit(filter = "all") {
      if (!els.sourceAuditResult || !els.sourceAuditSummary) return;
      const filters = normalizeQuestionSourceAuditFilter(typeof filter === "string" ? questionBankAuditFilterFromUI(filter) : filter);
      const result = runQuestionSourceAudit(filters);
      els.sourceFilterBtns.forEach((btn) => {
        const active = btn.dataset.sourceFilter === result.filter;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
      els.sourceAuditSummary.innerHTML = [
        `全部 ${result.counts.all}`,
        `参考资料派生 ${result.counts.reference}`,
        `原创扩展 ${result.counts.original}`,
        `自绘图形 ${result.counts.selfDrawn}`,
        `扫描页改写 ${result.counts.scan}`,
        `PDF截图 ${result.counts.pdfImage}`,
        `当前筛选 ${result.counts.scopedAll}`
      ].map((text) => `<span>${escapeHTML(text)}</span>`).join("");
      // 题源详细列表不在页面展示（数量庞大且非家长所需），仅保留上方统计与筛选。
      // 详细数据仍可通过「导出题库 Excel」获取。
      if (els.sourceAuditResult) {
        els.sourceAuditResult.hidden = true;
        els.sourceAuditResult.innerHTML = "";
      }
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
    const {
      makeSupplementalQuestion,
      makeExtraQuestion,
      makeAddSub,
      makeCompare,
      makeMulDiv,
      makeRemainder,
      makeMixed,
      makeTwoStep,
      makeVertical,
      makeLarge,
      makeGeometry,
      makeDecimal,
      makeFraction,
      makeUnit,
      makePercent,
      makeRatio,
      makeStatistics,
      makeEquation,
      makeWord,
      makeReading,
      makeThinking,
      makeAppendix,
      makers
    } = window.MathCampMathQuestionMakers.create({
      baseQuestion,
      clamp,
      formatAnswer,
      pick,
      rand,
      round1,
      shuffle,
      simplifyFraction,
      state,
      verticalSpecFromText
    });

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
      saveSystemSettingsSnapshot();
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
      saveSystemSettingsSnapshot();
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
        spawnPetFx(els.celebrationLayer, [{
          text: kind === "correct" ? "真棒" : "再试",
          className: `burst-token ${kind === "wrong" ? "wrong" : ""}`,
          vars: { "--x": "50%", "--y": "42%", "--dx": "0px", "--dy": kind === "correct" ? "-42px" : "24px", "--rot": "0deg", "--dur": "460ms" },
          life: PET_FX_TIMING.burstTokenLife
        }]);
        return;
      }
      const tokens = kind === "correct"
        ? (state.streak >= 3 ? ["🥳", "🌟", "连对", "+1", "太稳啦", "🎉"] : ["😄", "⭐", "+1", "真棒", "会了", "👏"])
        : ["😢", "慢慢来", "看步骤", "再试", "🧩"];
      els.celebrationLayer.innerHTML = "";
      spawnPetFx(els.celebrationLayer, tokens.map((label, index) => ({
        text: label,
        className: `burst-token ${kind === "wrong" ? "wrong" : "correct"}`,
        vars: {
          "--x": `${36 + index * (kind === "correct" ? 11 : 17)}%`,
          "--y": `${kind === "correct" ? 34 + (index % 2) * 12 : 42 + index * 8}%`,
          "--dx": `${(index - 2) * 34}px`,
          "--dy": `${kind === "correct" ? -110 - index * 8 : 48 + index * 14}px`,
          "--rot": `${(index - 2) * 12}deg`,
          "--dur": `${kind === "correct" ? 980 : 760}ms`
        },
        life: kind === "correct" ? 1000 : 780
      })));
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
    // —— 统一宠物反馈特效(WP-C):计时常量化 + 单一 token 生成核心 ——
    // 三套原有实现(sprinklePetTokens / triggerPetRoomFeedback / burst)统一收口到
    // spawnPetFx,计时与错峰全部来自此表,消除散落硬编码。
    const PET_FX_TIMING = Object.freeze({
      actionReset: 1500,        // setPetAction 动作复位
      actionResetLowMotion: 600,
      tokenLife: 1080,          // 伴练猫飘字生命周期
      roomTokenLife: 1150,      // 房间猫飘字生命周期
      roomFeedbackReset: 1180,  // 房间反馈 class 复位
      walkStep: 1500,           // 房间猫单步走路动画
      walkInterval: 3600,       // 房间猫常规走动间隔
      walkIntervalLowMotion: 5200,
      walkWarmup: Object.freeze([520, 1550, 2900]), // 进入空间后的三次热身走位
      tokenStagger: 72,         // 伴练猫飘字错峰
      roomTokenStagger: 95,     // 房间猫飘字错峰
      burstTokenLife: 520       // 全屏 burst token 移除
    });
    // 统一 token 生成核心:在 mount 下按 specs 生成一组飘字并定时清理。
    // specs: [{ text, className, vars: { cssVar: value }, life }]
    function spawnPetFx(mount, specs = []) {
      if (!mount || !Array.isArray(specs)) return;
      specs.forEach((spec) => {
        if (!spec || !spec.text) return;
        const token = document.createElement("span");
        token.className = spec.className || "pet-token";
        token.textContent = spec.text;
        Object.entries(spec.vars || {}).forEach(([key, value]) => token.style.setProperty(key, value));
        mount.appendChild(token);
        window.setTimeout(() => token.remove(), Number(spec.life) || PET_FX_TIMING.tokenLife);
      });
    }

    function sprinklePetTokens(kind) {
      if (!els.companionArt || isLowMotionMode() || !effectSettingEnabled("rewardParticles")) return;
      const labels = petTokenLabels(kind).slice(0, kind === "wrong" ? 2 : 3);
      spawnPetFx(els.companionArt, labels.map((label, index) => ({
        text: label,
        className: `pet-token ${kind}`,
        vars: { "--px": `${28 + index * 22}%`, "--delay": `${index * PET_FX_TIMING.tokenStagger}ms` },
        life: PET_FX_TIMING.tokenLife
      })));
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
      spawnPetFx(els.petRoomWalker, labels.slice(0, 2).map((label, index) => ({
        text: label,
        className: "pet-room-token",
        vars: { "--token-x": `${index ? 68 : 28}%`, "--token-delay": `${index * PET_FX_TIMING.roomTokenStagger}ms` },
        life: PET_FX_TIMING.roomTokenLife
      })));
      if (state.petRoomFeedbackTimer) window.clearTimeout(state.petRoomFeedbackTimer);
      state.petRoomFeedbackTimer = window.setTimeout(() => {
        els.petRoomWalker?.classList.remove("pet-room-feedback");
        if (els.petRoomWalker) delete els.petRoomWalker.dataset.feedback;
      }, PET_FX_TIMING.roomFeedbackReset);
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
      }, isLowMotionMode() ? PET_FX_TIMING.actionResetLowMotion : PET_FX_TIMING.actionReset);
    }

    function shouldUseMobilePetHintPopover() {
      return false;
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

    function floatingPetViewport() {
      return {
        width: Math.max(320, Number(window.innerWidth) || document.documentElement.clientWidth || 390),
        height: Math.max(520, Number(window.innerHeight) || document.documentElement.clientHeight || 780)
      };
    }
    function shouldShowFloatingPetAssistant(options = {}) {
      const view = options.view || state.view;
      const layer = options.layer || state.practiceLayer;
      const width = Number(options.width);
      const compact = Number.isFinite(width)
        ? width <= 1180
        : window.matchMedia("(max-width: 1180px)").matches;
      return view === "practice" && layer === "focus" && compact;
    }
    function normalizeFloatingPetPosition(raw = {}, viewport = floatingPetViewport()) {
      const size = 66;
      const margin = 12;
      const maxX = Math.max(margin, Number(viewport.width || 390) - size - margin);
      const maxY = Math.max(margin, Number(viewport.height || 780) - size - 30);
      const inputX = Number(raw.x);
      const inputY = Number(raw.y);
      const y = clamp(Number.isFinite(inputY) ? inputY : maxY - 72, margin, maxY);
      const side = raw.side === "left" || raw.side === "right"
        ? raw.side
        : (Number.isFinite(inputX) && inputX < Number(viewport.width || 390) / 2 ? "left" : "right");
      const x = side === "left" ? margin : maxX;
      return { x, y, side };
    }
    function readFloatingPetPosition() {
      try {
        return normalizeFloatingPetPosition(JSON.parse(storageGet(STORE.floatingPet, "{}") || "{}"));
      } catch (_) {
        return normalizeFloatingPetPosition({});
      }
    }
    function saveFloatingPetPosition(position) {
      const normalized = normalizeFloatingPetPosition(position);
      storageSet(STORE.floatingPet, JSON.stringify(normalized));
      return normalized;
    }
    function applyFloatingPetPosition(position = readFloatingPetPosition()) {
      if (!els.floatingPetAssistant) return position;
      const normalized = normalizeFloatingPetPosition(position);
      els.floatingPetAssistant.style.setProperty("--floating-pet-x", `${Math.round(normalized.x)}px`);
      els.floatingPetAssistant.style.setProperty("--floating-pet-y", `${Math.round(normalized.y)}px`);
      els.floatingPetAssistant.dataset.side = normalized.side;
      floatingPetDrag.current = normalized;
      return normalized;
    }
    function closeFloatingPetPanel() {
      if (!els.floatingPetPanel) return;
      els.floatingPetPanel.hidden = true;
      els.floatingPetAssistant?.classList.remove("panel-open");
    }
    function floatingPetCareAlert(profile = activeProfile(), threshold = 30) {
      const pet = petState(profile);
      const labels = { mood: "心情值", hunger: "饥饿值", clean: "清洁值", bond: "亲密值" };
      const tips = {
        mood: "摸摸它或玩一会儿",
        hunger: "喂一点猫粮",
        clean: "用毛巾或泡泡澡清洁",
        bond: "多陪它互动一下"
      };
      const needs = ["mood", "hunger", "clean", "bond"]
        .map((key) => ({ key, label: labels[key], value: clamp(Number(pet[key]) || 0, 0, 100), tip: tips[key] }))
        .filter((item) => item.value < threshold);
      if (!needs.length) return null;
      const worst = needs.slice().sort((a, b) => a.value - b.value)[0];
      return {
        title: `${petDisplayName(profile)}需要照料`,
        body: `${needs.map((item) => `${item.label} ${item.value}`).join("，")}，已经低于安全值 ${threshold}。先${worst.tip}，招财会更有精神陪你学习。`,
        needs
      };
    }
    function floatingPetActionMessage(action, question = state.currentSet[state.index]) {
      if (action === "care") {
        const alert = floatingPetCareAlert();
        if (alert) {
          return {
            title: alert.title,
            body: alert.body,
            extraHTML: `<button class="secondary compact-btn" type="button" data-floating-pet-care-action="petspace">去照料</button>`
          };
        }
        return { title: "招财状态稳定", body: "招财现在状态还不错，可以安心开始练习。", extraHTML: "" };
      }
      if (!question) {
        return { title: "招财小助手", body: "先开始一轮练习，招财就能根据当前题目给你提示。", extraHTML: "" };
      }
      if (action === "explain") {
        const steps = (question.steps && question.steps.length ? question.steps : [question.explanation || methodHintFor(question)]).slice(0, 2);
        return {
          title: "招财讲一下",
          body: `${methodHintFor(question)} ${steps.join(" ")}`,
          extraHTML: ""
        };
      }
      if (action === "cause") {
        const cause = recommendCauseForQuestion(question, els.answerInput?.value || "");
        const canSave = Boolean(state.lastWrongRecordId);
        return {
          title: "错因建议",
          body: canSave
            ? `招财建议先标记为“${cause}”。${petCoachForCause(question, cause)}`
            : `如果这题答错，我会优先判断是不是“${cause}”。先做完，我再帮你确认。`,
          extraHTML: canSave ? `<button class="secondary compact-btn" type="button" data-floating-pet-save-cause="${escapeAttr(cause)}">保存“${escapeHTML(cause)}”</button>` : ""
        };
      }
      const nextLevel = clamp((Number(state.hintLevel) || 0) + 1, 1, 3);
      return { title: `招财第 ${nextLevel} 级提示`, body: hintForLevel(question, nextLevel), extraHTML: "" };
    }
    function openFloatingPetPanel(action = "") {
      if (!els.floatingPetPanel || !els.floatingPetMessage) return;
      const message = floatingPetActionMessage(action || "hint");
      if (els.floatingPetTitle) els.floatingPetTitle.textContent = message.title;
      els.floatingPetMessage.textContent = message.body;
      if (els.floatingPetExtra) els.floatingPetExtra.innerHTML = message.extraHTML || "";
      els.floatingPetPanel.hidden = false;
      els.floatingPetAssistant?.classList.add("panel-open");
    }
    function handleFloatingPetAction(action) {
      const current = state.currentSet[state.index];
      if (action === "hint" && current) {
        state.stepHintOpen = true;
        state.hintLevel = clamp(state.hintLevel + 1, 1, 3);
        const hint = hintForLevel(current, state.hintLevel);
        if (els.methodHint) els.methodHint.textContent = hint;
        if (!isWaitingForCauseSave()) renderAnswerModePanel(current);
        updatePetStatus(`招财：第 ${state.hintLevel} 级提示。${hint}`, "提示");
        setPetAction("hint", `${state.hintLevel}级`);
      }
      openFloatingPetPanel(action || "hint");
    }
    function syncFloatingPetBadge() {
      if (!els.floatingPetBadge) return;
      const careAlert = floatingPetCareAlert();
      const show = Boolean(state.lastWrongRecordId || isWaitingForCauseSave() || careAlert);
      els.floatingPetBadge.hidden = !show;
      els.floatingPetBadge.textContent = (state.lastWrongRecordId || isWaitingForCauseSave()) ? "建议" : (careAlert ? "照料" : "");
    }
    function maybeOpenFloatingPetCareAlert() {
      if (state.floatingPetCareAlertShown || !shouldShowFloatingPetAssistant()) return;
      if (!floatingPetCareAlert()) return;
      state.floatingPetCareAlertShown = true;
      window.setTimeout(() => {
        if (shouldShowFloatingPetAssistant() && els.floatingPetPanel?.hidden) openFloatingPetPanel("care");
      }, 240);
    }
    function syncFloatingPetVisibility() {
      if (!els.floatingPetAssistant) return;
      const visible = shouldShowFloatingPetAssistant();
      els.floatingPetAssistant.hidden = !visible;
      if (!visible) {
        closeFloatingPetPanel();
        return;
      }
      applyFloatingPetPosition();
      syncFloatingPetBadge();
      maybeOpenFloatingPetCareAlert();
    }
    function floatingPetPoint(event) {
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      return {
        x: Number(touch?.clientX ?? event.clientX) || 0,
        y: Number(touch?.clientY ?? event.clientY) || 0
      };
    }
    function beginFloatingPetDrag(event) {
      if (!els.floatingPetAssistant) return;
      const point = floatingPetPoint(event);
      const current = floatingPetDrag.current || applyFloatingPetPosition();
      floatingPetDrag.active = true;
      floatingPetDrag.moved = false;
      floatingPetDrag.startX = point.x;
      floatingPetDrag.startY = point.y;
      floatingPetDrag.originX = current.x;
      floatingPetDrag.originY = current.y;
      els.floatingPetAssistant.classList.add("is-dragging");
    }
    function moveFloatingPetDrag(event) {
      if (!floatingPetDrag.active) return;
      const point = floatingPetPoint(event);
      const dx = point.x - floatingPetDrag.startX;
      const dy = point.y - floatingPetDrag.startY;
      if (Math.abs(dx) + Math.abs(dy) > 6) floatingPetDrag.moved = true;
      const raw = { x: floatingPetDrag.originX + dx, y: floatingPetDrag.originY + dy };
      const viewport = floatingPetViewport();
      const size = 66;
      const margin = 12;
      const x = clamp(raw.x, margin, Math.max(margin, viewport.width - size - margin));
      const y = clamp(raw.y, margin, Math.max(margin, viewport.height - size - 30));
      applyFloatingPetPosition({ x, y, side: x < viewport.width / 2 ? "left" : "right" });
      if (event.cancelable) event.preventDefault();
    }
    function endFloatingPetDrag() {
      if (!floatingPetDrag.active) return;
      floatingPetDrag.active = false;
      els.floatingPetAssistant?.classList.remove("is-dragging");
      const saved = saveFloatingPetPosition(floatingPetDrag.current || {});
      applyFloatingPetPosition(saved);
      if (floatingPetDrag.moved) {
        floatingPetDrag.suppressClick = true;
        window.setTimeout(() => { floatingPetDrag.suppressClick = false; }, 80);
      }
    }
    function initFloatingPetAssistant() {
      if (!els.floatingPetAssistant || !els.floatingPetButton) return;
      syncFloatingPetVisibility();
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
      if (els.profileSelect) {
        els.profileSelect.innerHTML = state.profiles.map((item) => `<option value="${escapeAttr(item.id)}" ${item.id === profile.id ? "selected" : ""}>${escapeHTML(item.name)}</option>`).join("");
      }
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
      bankGrades().forEach((grade) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice grade-choice";
        btn.innerHTML = `<span class="grade-choice-main"><b>${bankGradeNames()[grade - 1]}</b></span>`;
        btn.setAttribute("aria-pressed", String(state.grade === grade));
        btn.setAttribute("aria-label", bankGradeNames()[grade - 1]);
        btn.addEventListener("click", () => {
          state.grade = grade;
          state.pointId = safePointId(state.pointId, grade);
          renderGradeOptions();
          renderPointSelects();
        });
        els.gradeGrid.appendChild(btn);
      });
    }
    function pointOptionsHTML(grade, selected = "auto", options = {}) {
      const autoValue = options.autoValue || "auto";
      const autoLabel = options.autoLabel || "按教材混合";
      let safeSelected = selected === autoValue ? autoValue : safePointId(selected, grade);
      if (safeSelected === "auto" && autoValue !== "auto") safeSelected = autoValue;
      const opts = [`<option value="${escapeAttr(autoValue)}" ${safeSelected === autoValue ? "selected" : ""}>${escapeHTML(autoLabel)}</option>`];
      availablePoints(grade).forEach((point) => {
        const label = curriculumSelectShortLabel(point);
        opts.push(`<option value="${escapeAttr(point.id)}" title="${escapeAttr(curriculumHelperText(point))}" ${safeSelected === point.id ? "selected" : ""}>${escapeHTML(label)}</option>`);
      });
      return opts.join("");
    }
    function renderPointSelects() {
      state.pointId = safePointId(state.pointId, state.grade);
      els.pointSelect.innerHTML = pointOptionsHTML(state.grade, state.pointId);
      const currentPrintGrade = clamp(Number(els.printGrade.value) || state.grade, 1, 6);
      els.printGrade.innerHTML = bankGrades().map((grade) => `<option value="${grade}" ${grade === currentPrintGrade ? "selected" : ""}>${bankGradeNames()[grade - 1]}</option>`).join("");
      els.printGrade.value = String(currentPrintGrade);
      const printGrade = Number(els.printGrade.value || state.grade);
      const printPoint = safePointId(els.printPoint.value || "auto", printGrade);
      els.printPoint.innerHTML = pointOptionsHTML(printGrade, printPoint);
      els.printPoint.value = printPoint;
      els.profileGradeInput.innerHTML = bankGrades().map((grade) => `<option value="${grade}">${bankGradeNames()[grade - 1]}</option>`).join("");
      els.causeSelect.value = "未标记";
      els.wrongCauseFilter.innerHTML = [`<option value="all">全部错因</option>`, ...bankCauses().map((cause) => `<option value="${escapeAttr(cause)}">${escapeHTML(cause)}</option>`)].join("");
      const wrongGrade = activeProfile().grade || state.grade;
      const currentWrongPoint = els.wrongPointFilter.value || "all";
      const wrongPoint = pointBelongsToGrade(currentWrongPoint, wrongGrade) ? currentWrongPoint : "all";
      els.wrongPointFilter.innerHTML = pointOptionsHTML(wrongGrade, wrongPoint, {
        autoValue: "all",
        autoLabel: "全部知识点"
      });
      els.wrongPointFilter.value = wrongPoint;
      els.adaptiveHint.textContent = state.pointId === "auto"
        ? "当前会按年级混合出题；开启自适应时，会优先安排薄弱知识点。"
        : `${curriculumPointLabel(state.pointId)}：${curriculumHelperText(bankPointMap()[state.pointId]) || "专项练习"}。`;
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
      applySubjectTheme();
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
    function rememberPracticeViewState() {
      state.practiceReturnState = {
        layer: state.practiceLayer || "setup",
        typeSettingsOpen: document.body.classList.contains("type-settings-open")
      };
    }

    function restorePracticeViewState() {
      const saved = state.practiceReturnState || { layer: "setup", typeSettingsOpen: false };
      if (saved.typeSettingsOpen) {
        setPracticeLayer("setup");
        setTypeSettingsOpen(true);
      } else if (saved.layer === "focus") {
        enterPracticeFocus();
      } else {
        setPracticeLayer("setup");
        setTypeSettingsOpen(false);
      }
    }

    function showView(view) {
      const previous = state.view;
      if (previous === "practice" && view !== "practice") rememberPracticeViewState();
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
          if (view === "practice" && isCompactPracticeViewport()) {
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
      if (view !== "practice") {
        setPracticeLayer("setup");
      } else if (previous !== "practice") {
        restorePracticeViewState();
      } else if (state.practiceLayer !== "focus") {
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
      if (view === "bank") {
        syncQuestionBankPointFilter();
        renderQuestionSourceAudit(questionBankAuditFilterFromUI());
        if (window.MathCampCustomBank) renderCustomBankList();
      }
    }
    function setTypeSettingsOpen(open) {
      document.body.classList.toggle("type-settings-open", Boolean(open));
      if (state.view === "practice") {
        state.practiceReturnState = {
          layer: state.practiceLayer || "setup",
          typeSettingsOpen: Boolean(open)
        };
      }
    }
    function openTypeSettings() {
      showView("practice");
      setPracticeLayer("setup");
      setTypeSettingsOpen(true);
    }
    function closeTypeSettings() {
      setTypeSettingsOpen(false);
      showView("practice");
      setPracticeLayer("setup");
      rememberPracticeViewState();
      window.scrollTo(0, 0);
      if (isMobilePracticeViewport()) {
        const homeDashboard = document.querySelector(".home-dashboard");
        if (homeDashboard) {
          homeDashboard.classList.remove("view-enter");
          void homeDashboard.offsetWidth;
          homeDashboard.classList.add("view-enter");
        }
      }
    }
    function handleTopModeAction() {
      if (isMobilePracticeViewport()) openTypeSettings();
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
        if (previous !== layer && isCompactPracticeViewport()) {
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
      document.body.classList.toggle("practice-return-visible", layer === "focus");
      if (layer === "focus") setTypeSettingsOpen(false);
      if (layer !== "focus") closePetHintPopover();
      syncFloatingPetVisibility();
    }

    function enterPracticeFocus() {
      setPracticeLayer("focus");
      rememberPracticeViewState();
      if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
      const stack = els.practiceWorkspace?.querySelector(".main-stack");
      if (stack) stack.scrollTop = 0;
    }

    function returnToPracticeSetup() {
      els.mobileChallengeResult.hidden = true;
      setTypeSettingsOpen(false);
      setPracticeLayer("setup");
      rememberPracticeViewState();
      if (typeof window.scrollTo === "function") window.scrollTo(0, 0);
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
    function resolveAssetUrl(src = "") {
      const text = String(src || "");
      if (/^(?:[a-z]+:)?\/\//i.test(text) || /^(?:data|blob|file):/i.test(text)) return text;
      if (typeof window.URL === "function") {
        try { return new window.URL(text, window.location.href).href; } catch (_) {}
      }
      const base = String(window.location?.href || "");
      const cleanBase = base.split(/[?#]/)[0];
      const dir = cleanBase.includes("/") ? cleanBase.slice(0, cleanBase.lastIndexOf("/") + 1) : "";
      return `${dir}${text.replace(/^\.\//, "")}`;
    }
    function syncPetImage(key = "") {
      const profile = activeProfile();
      const pet = petState(profile);
      const imageKey = key || petStableImageKey(pet);
      const src = petImagePath(imageKey);
      const cssSrc = resolveAssetUrl(src);
      document.documentElement.style.setProperty("--cat-photo", `url("${cssSrc}")`);
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
      // 表情图标统一为 emoji(淘汰单汉字),保证跨字体渲染一致
      if (pet.runaway?.status === "lost") return { key: "lost", icon: "❓" };
      if (pet.runaway?.status === "away") return { key: "away", icon: "💨" };
      if (pet.hunger < 25) return { key: "hungry", icon: "🍚" };
      if (pet.clean < 25) return { key: "dirty", icon: "🛁" };
      if (pet.mood < 30) return { key: "tired", icon: "😪" };
      if (quality.recentCount >= 10 && quality.rate >= 90) return { key: "proud", icon: "🌟" };
      if (quality.reviewCount > 0) return { key: "focused", icon: "📖" };
      if (pet.bond >= 80) return { key: "close", icon: "💗" };
      return { key: "calm", icon: "" };
    }
    // 统一装扮视觉数据:图层位置 + 图标 + 主题色(数据驱动,替代 CSS 硬编码几何图形)
    function petOutfitVisual(outfitId) {
      const item = outfitId ? PET_OUTFIT_MAP[outfitId] : null;
      if (!item) return { id: "", layer: "", icon: "", accent: "" };
      return {
        id: item.id,
        layer: item.layer || "head",
        icon: item.icon || "",
        accent: item.accent || ""
      };
    }
    // 统一渲染房间猫的分层:装扮层(按 layer 定位) + 表情层。
    // 替代旧的 data-outfit-icon(emoji) 与 data-outfit(CSS 几何图形) 双轨伪元素方案。
    function syncPetCatLayers(profile = activeProfile(), pet = petState(profile)) {
      const outfit = petOutfitVisual(pet.outfit);
      if (els.petCatOutfit) {
        els.petCatOutfit.textContent = outfit.icon;
        els.petCatOutfit.dataset.layer = outfit.layer;
        els.petCatOutfit.dataset.outfit = outfit.id;
        els.petCatOutfit.style.setProperty("--outfit-accent", outfit.accent || "transparent");
        els.petCatOutfit.hidden = !outfit.icon;
      }
      if (els.petCatExpression) {
        const quality = petLearningQuality(profile);
        const expression = petExpression(profile, pet, quality);
        els.petCatExpression.textContent = expression.icon;
        els.petCatExpression.dataset.expression = expression.key;
        els.petCatExpression.hidden = !expression.icon;
      }
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
    // —— 每日签到（进空间摸摸猫领金币 + 连续登录奖励）——
    const PET_CHECKIN_BASE_COINS = 6;
    const PET_CHECKIN_STEP_COINS = 2;
    const PET_CHECKIN_MAX_COINS = 20;
    const PET_CHECKIN_CYCLE = 7; // 每连续 7 天额外一份彩蛋奖励
    const PET_CHECKIN_CYCLE_BONUS = 12;
    function normalizePetCheckin(raw = {}) {
      const source = isPlainObject(raw) ? raw : {};
      const date = /^\d{4}-\d{2}-\d{2}$/.test(String(source.date || "")) ? source.date : "";
      const streak = Math.max(0, Math.floor(Number(source.streak) || 0));
      return {
        date,
        streak,
        bestStreak: Math.max(streak, Math.floor(Number(source.bestStreak) || 0)),
        total: Math.max(0, Math.floor(Number(source.total) || 0))
      };
    }
    function petCheckinRewardFor(streak) {
      const day = Math.max(1, Number(streak) || 1);
      const coins = Math.min(
        PET_CHECKIN_MAX_COINS,
        PET_CHECKIN_BASE_COINS + (day - 1) * PET_CHECKIN_STEP_COINS
      );
      const cycleBonus = day % PET_CHECKIN_CYCLE === 0 ? PET_CHECKIN_CYCLE_BONUS : 0;
      return { coins, cycleBonus, bond: cycleBonus ? 2 : 1 };
    }
    function petCheckedInToday(pet) {
      return normalizePetCheckin(pet?.checkin).date === todayKey();
    }
    // 领取今日签到；返回 { applied, coins, bond, streak, cycleBonus }，已领过则 applied=false。
    function applyPetCheckin(pet) {
      const today = todayKey();
      const checkin = normalizePetCheckin(pet.checkin);
      if (checkin.date === today) return { applied: false, ...checkin };
      const gap = checkin.date ? daysBetween(checkin.date, today) : 0;
      const streak = gap === 1 ? checkin.streak + 1 : 1;
      const reward = petCheckinRewardFor(streak);
      const totalCoins = reward.coins + reward.cycleBonus;
      pet.coins = Math.max(0, (Number(pet.coins) || 0) + totalCoins);
      pet.bond = clamp((Number(pet.bond) || 0) + reward.bond, 0, 100);
      pet.mood = clamp((Number(pet.mood) || 0) + 3, 0, 100);
      pet.checkin = {
        date: today,
        streak,
        bestStreak: Math.max(streak, checkin.bestStreak),
        total: checkin.total + 1
      };
      return { applied: true, coins: totalCoins, bond: reward.bond, streak, cycleBonus: reward.cycleBonus };
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
      const qualityXp = correct ? quality.xpBonus + (mode === "wrongbook" || mode === "due-review" ? 1 : 0) + (mode === "timed" && quality.rate >= 80 ? 1 : 0) : 0;
      if (qualityXp) pet.xp += qualityXp;
      if (correct && quality.rate >= 85 && quality.recentCount >= 6) pet.mood = clamp(pet.mood + 1, 0, 100);
      if (correct && quality.rate >= 90 && quality.recentCount >= 10) pet.bond = clamp(pet.bond + 1, 0, 100);
      if (correct && (mode === "wrongbook" || mode === "due-review")) pet.bond = clamp(pet.bond + 1, 0, 100);
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
      renderDesktopPracticeOverview(profile);
      return pet;
    }

    function petTaskState(profile, task, period) {
      return window.MathCampPet.taskState({
        clamp,
        currentWeekKey,
        petState,
        todayKey
      }, profile, task, period);
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
      if (els.taskWrongReviewCount) els.taskWrongReviewCount.textContent = `${todayItems(profile).filter((item) => item.mode === "wrongbook" || item.mode === "due-review").length} 题`;
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
      if ((state.mode === "wrongbook" || state.mode === "due-review") && correct) gain += 2;
      awardCoins(gain, "答题奖励");
      const pet = petState();
      pet.xp += 2;
      pet.mood = clamp(pet.mood + 1, 0, 100);
      if ((state.mode === "wrongbook" || state.mode === "due-review") && correct) pet.bond = clamp(pet.bond + 1, 0, 100);
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
        bond: total ? 4 + ((state.mode === "wrongbook" || state.mode === "due-review") ? 3 : 0) + (state.mode === "challenge" && rate >= 80 ? 2 : 0) : 0,
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
      // 互动路径只同步房间 stage(WP-D),不整页重建,避免闪烁/卡顿
      syncPetRoomStage(profile, pet);
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
      const freeCareUsed = pet.experience?.freeCareDate === todayKey();
      if (els.petCareScore) els.petCareScore.textContent = `${done}/${checklist.length}`;
      if (els.petCareChecklist) {
        els.petCareChecklist.innerHTML = checklist.map((item) => `<div class="${item.done ? "done" : ""}">
          <span>${item.done ? "✓" : "·"}</span>
          <strong>${escapeHTML(item.label)}</strong>
          <em>${escapeHTML(item.detail)}</em>
        </div>`).join("") + `<button class="${freeCareUsed ? "secondary" : "primary"} pet-free-care" type="button" data-pet-free-care ${freeCareUsed ? "disabled" : ""}>${freeCareUsed ? "今日免费照料已使用" : "今日免费照料"}</button>`;
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
    function petDailyActivitiesHTML(pet) {
      const today = todayKey();
      const choices = typeof PetExperience.dailyChoices === "function" ? PetExperience.dailyChoices() : [];
      const selectedChoice = pet.experience?.dailyChoiceDate === today ? pet.experience.dailyChoiceId : "";
      const bellPlayed = pet.experience?.bellGameDate === today;
      const bellSlot = Number(pet.experience?.bellGameSlot) || 0;
      const bellFound = Boolean(pet.experience?.bellFound);
      return `<div class="pet-daily-activities">
        <div class="pet-daily-choice">
          <strong>今日陪伴</strong>
          <div>${choices.map((choice) => `<button class="secondary" type="button" data-pet-daily-choice="${escapeAttr(choice.id)}" ${selectedChoice ? "disabled" : ""}>${choice.icon || "🐾"} ${escapeHTML(choice.title)}</button>`).join("")}</div>
          ${selectedChoice ? `<small>今天已经陪伴过啦，明天会有新的选择。</small>` : ""}
        </div>
        <div class="pet-bell-game">
          <strong>找铃铛</strong>
          <div>${[1, 2, 3].map((slot) => `<button class="secondary ${bellPlayed && slot === bellSlot ? "selected" : ""}" type="button" data-pet-bell-slot="${slot}" ${bellPlayed ? "disabled" : ""} aria-label="选择第 ${slot} 个垫子">${bellPlayed && slot === bellSlot ? (bellFound ? "🔔" : "🐾") : "▰"}</button>`).join("")}</div>
          <small>${bellPlayed ? (bellFound ? "找到铃铛，奖励已经收好。" : "今天没猜中，也获得了陪伴奖励。") : "每天一次，选一个垫子看看。"}</small>
        </div>
      </div>`;
    }
    function renderPetEventCard(pet, profile = activeProfile()) {
      if (!els.petEventCard) return;
      const event = currentPetEvent(pet);
      if (!event) {
        els.petEventCard.innerHTML = `<h3>随机事件</h3><p>Lv.3 后会出现更多小窝事件。</p>${petDailyActivitiesHTML(pet)}`;
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
        </div>
        ${petDailyActivitiesHTML(pet)}`;
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
      const affordability = item && typeof PetExperience.shopProgress === "function"
        ? PetExperience.shopProgress(pet.coins, item.price)
        : { gap: item ? Math.max(0, Number(item.price || 0) - Number(pet.coins || 0)) : 0, pct: 0, practiceSets: 0 };
      const gap = affordability.gap;
      els.petShopAdvisor.innerHTML = item ? `
        <div>
          <strong>推荐购买：${escapeHTML(item.name)}</strong>
          <span>${escapeHTML(recommendation.reason)} · ${gap ? `还差 ${gap} 金币，约 ${affordability.practiceSets} 轮短练习` : "金币足够"}${Number.isFinite(careLeft) ? ` · 今日收益 ${careLeft} 次` : ""}</span>
          <i class="pet-afford-progress"><b style="--value:${affordability.pct}%"></b></i>
        </div>
        <button class="${gap ? "secondary" : "primary"} compact-btn" type="button" data-pet-buy="${escapeAttr(item.id)}" ${gap ? "disabled" : ""}>${gap ? `差 ${gap} 金币` : "购买"}</button>` : "";
    }
    function renderPetDressupPreview(profile = activeProfile(), pet = petState(profile), preview = state.petDressupPreview) {
      if (!els.petDressupPreview) return;
      const previewDef = preview ? petCollectionDef(preview.kind, preview.id) : null;
      const themeId = preview?.kind === "theme" && previewDef ? preview.id : pet.roomTheme;
      const outfitId = preview?.kind === "outfit" && previewDef ? preview.id : pet.outfit;
      const theme = PET_ROOM_THEME_MAP[themeId] || PET_ROOM_THEME_MAP.sunny || { title: "阳光小窝", icon: "" };
      const outfit = outfitId ? PET_OUTFIT_MAP[outfitId] : null;
      const furniture = equippedFurnitureList(pet).filter((item) => !(preview?.kind === "furniture" && item.id === preview.id));
      if (preview?.kind === "furniture" && previewDef) furniture.unshift(previewDef);
      const counts = petCollectionCounts(pet);
      els.petDressupPreview.innerHTML = `
        <div class="pet-dressup-preview-scene" data-room-theme="${escapeAttr(themeId || "sunny")}" data-outfit="${escapeAttr(outfitId || "")}">
          <span>${theme.icon || "☀️"}</span>
          <b>${outfit?.icon || "🐾"}</b>
        </div>
        <div>
          <strong>${previewDef ? "试穿预览" : "当前展示"}</strong>
          <p>${escapeHTML(theme.title)} · ${outfit ? escapeHTML(outfit.title) : "未穿戴装扮"} · ${previewDef?.title ? `正在预览 ${escapeHTML(previewDef.title)}` : `已摆放 ${counts.equippedFurniture} 件家具`}</p>
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
      const previewActive = state.petDressupPreview?.kind === kind && state.petDressupPreview?.id === item.id;
      return `<article class="pet-collection-card ${owned ? "owned" : ""} ${active ? "active" : ""} ${levelLocked ? "locked" : ""} ${previewActive ? "pet-preview-active" : ""}" tabindex="0" role="button" data-pet-preview="${escapeAttr(`${kind}:${item.id}`)}" aria-label="预览${escapeAttr(item.title)}">
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
      renderPetDressupPreview(profile, pet, state.petDressupPreview);
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
        const boardTheme = nextTheme || themes.find((theme) => state.theme === theme.id) || themes[0];
        const boardColor = boardTheme?.metaColor || "#8fd3b4";
        els.petThemeShopBoard.innerHTML = nextTheme
          ? `<div class="pet-theme-shop-preview-swatch" style="--theme-preview:${escapeAttr(boardColor)}"><span>${escapeHTML(boardTheme.icon || "🌈")}</span></div><div><strong>下一个目标：${escapeHTML(nextTheme.label)}</strong><span>需要 Lv.${Number(nextTheme.unlockLevel || 1)}，${Math.max(0, Number(nextTheme.price) || 0)} 金币。当前 Lv.${Number(pet.level || 1)}，金币 ${Number(pet.coins || 0)}。</span></div>`
          : `<div class="pet-theme-shop-preview-swatch" style="--theme-preview:${escapeAttr(boardColor)}"><span>${escapeHTML(boardTheme?.icon || "🌈")}</span></div><div><strong>主题全部收集完成</strong><span>可以在系统设置里随时切换已拥有主题。</span></div>`;
      }
      const groups = [
        {
          title: "开局主题",
          desc: "经典、护眼、二次元开局直接可用。",
          items: themes.filter((theme) => theme.initial)
        },
        {
          title: "养成解锁",
          desc: "剩余主题跟随招财等级和金币逐步解锁。",
          items: themes.filter((theme) => !theme.initial)
        }
      ].filter((group) => group.items.length);
      els.petThemeShopGrid.innerHTML = groups.map((group) => `
        <section class="pet-collection-section">
          <div class="pet-shop-tier-head"><h3>${escapeHTML(group.title)}</h3><span>${escapeHTML(group.desc)}</span></div>
          <div class="pet-collection-grid">${group.items.map((theme) => systemThemeCard(theme, pet)).join("")}</div>
        </section>`).join("");
    }
    function shouldUsePetPanelModals() {
      return window.matchMedia("(max-width: 980px)").matches;
    }
    function shouldPlacePetBarsInRoomInfo() {
      return window.matchMedia("(min-width: 981px)").matches;
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
      const dashboard = document.querySelector(".pet-care-dashboard");
      const petRoomCard = dashboard?.closest(".pet-room-card");
      if (!petRoomCard || !dashboard) return;
      if (els.petShowcaseCard.parentElement !== petRoomCard || els.petShowcaseCard.nextElementSibling !== dashboard) {
        if (typeof petRoomCard.insertBefore === "function") petRoomCard.insertBefore(els.petShowcaseCard, dashboard);
        else if (els.petShowcaseCard.parentElement !== petRoomCard) petRoomCard.appendChild(els.petShowcaseCard);
      }
    }
    function movePetSpaceBars() {
      if (!els.petSpaceBars || !els.petRoomStage) return;
      const petRoomInfo = document.querySelector(".pet-room-info");
      const home = els.petRoomStage.parentElement;
      if (!petRoomInfo || !home) return;
      if (shouldPlacePetBarsInRoomInfo()) {
        const anchor = els.petSkillStrip?.nextElementSibling || null;
        if (els.petSpaceBars.parentElement !== petRoomInfo || els.petSpaceBars.previousElementSibling !== els.petSkillStrip) {
          if (typeof petRoomInfo.insertBefore === "function") petRoomInfo.insertBefore(els.petSpaceBars, anchor);
          else if (els.petSpaceBars.parentElement !== petRoomInfo) petRoomInfo.appendChild(els.petSpaceBars);
        }
        return;
      }
      if (els.petSpaceBars.parentElement !== home || els.petSpaceBars.previousElementSibling !== els.petRoomStage) {
        const afterStage = els.petRoomStage.nextElementSibling;
        if (typeof home.insertBefore === "function") home.insertBefore(els.petSpaceBars, afterStage);
        else if (els.petSpaceBars.parentElement !== home) home.appendChild(els.petSpaceBars);
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
      movePetSpaceBars();
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
        }, PET_FX_TIMING.walkStep);
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
      PET_FX_TIMING.walkWarmup.forEach((delay) => {
        state.petRoomWalkWarmupTimers.push(window.setTimeout(() => {
          if (state.view === "petspace" && !document.hidden) movePetRoomCat();
        }, delay));
      });
      state.petRoomWalkTimer = window.setInterval(() => {
        if (state.view !== "petspace" || document.hidden) return;
        movePetRoomCat();
      }, isLowMotionMode() ? PET_FX_TIMING.walkIntervalLowMotion : PET_FX_TIMING.walkInterval);
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

    function renderPetCheckin(pet, profile = activeProfile()) {
      if (!els.petCheckinBtn) return;
      const checkin = normalizePetCheckin(pet.checkin);
      const done = checkin.date === todayKey();
      const reward = petCheckinRewardFor(checkin.streak + 1);
      const totalCoins = reward.coins + reward.cycleBonus;
      const streakLabel = checkin.streak > 0 ? `连续 ${checkin.streak} 天` : "今日首次签到";
      els.petCheckinBtn.innerHTML = `
        <span class="pet-checkin-left">
          <strong>${done ? "✅ 今日已签到" : "🐾 每日签到"}</strong>
          <em>${done ? `${streakLabel} · 已累计 ${checkin.total} 天` : streakLabel}</em>
        </span>
        <span class="pet-checkin-right">
          ${done
            ? `<span class="pet-checkin-done">明天再来领奖励</span>`
            : `<span class="pet-checkin-reward">+${totalCoins} 金币</span>${reward.cycleBonus ? `<i>连签彩蛋 +${reward.cycleBonus}</i>` : ""}`}
        </span>`;
      els.petCheckinBtn.classList.toggle("is-done", done);
      els.petCheckinBtn.disabled = done;
      els.petCheckinBtn.setAttribute("aria-pressed", String(done));
    }

    // 轻量房间 stage 同步(WP-D):只更新房间舞台 data-*、猫分层、等级/经验、状态条、技能条、签到。
    // 互动路径(updatePetStatus)调它避免 renderPetSpace 整页 innerHTML 重建导致的闪烁/卡顿。
    function syncPetRoomStage(profile = activeProfile(), pet = petState(profile)) {
      const name = petDisplayName(profile);
      const xpInLevel = pet.xp % PET_XP_PER_LEVEL;
      const stage = petStageCopy(petGrowthStage(pet), profile);
      if (els.petSpaceTitle) els.petSpaceTitle.textContent = `${name}小窝`;
      if (els.petSpaceLead) els.petSpaceLead.textContent = `${stage.name}：${stage.copy}`;
      if (els.petRoomCatBtn) els.petRoomCatBtn.setAttribute("aria-label", `摸摸${name}`);
      if (els.petSpaceCoins) els.petSpaceCoins.textContent = String(pet.coins);
      if (els.petRoomStage) {
        els.petRoomStage.dataset.petState = pet.runaway?.status || "home";
        const quality = petLearningQuality(profile);
        const expression = petExpression(profile, pet, quality);
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
        // 房间氛围装饰物:按当前主题渲染 props 图层(数据驱动,替代纯渐变)
        if (els.petRoomProps) {
          const theme = PET_ROOM_THEME_MAP[pet.roomTheme] || PET_ROOM_THEME_MAP.sunny;
          const props = Array.isArray(theme?.props) ? theme.props : [];
          els.petRoomProps.innerHTML = props
            .map((icon, index) => `<span class="pet-room-prop" style="--prop-index:${index}">${escapeHTML(icon)}</span>`)
            .join("");
        }
        // 装扮/表情由分层 DOM 渲染(syncPetCatLayers),不再用 data-outfit-icon/data-expression-icon 伪元素
        syncPetCatLayers(profile, pet);
      }
      if (els.petRoomName) els.petRoomName.textContent = pet.runaway?.status === "lost"
        ? "等待重新领养"
        : pet.runaway?.status === "away"
          ? `${name}暂时离家了`
          : `${name}记得你的学习进度`;
      const contextMessage = typeof PetExperience.contextMessage === "function"
        ? PetExperience.contextMessage(profile, pet, Object.fromEntries(Object.entries(SUBJECTS).map(([id, meta]) => [id, meta.label])))
        : "";
      if (els.petRoomStatus) els.petRoomStatus.textContent = pet.runaway?.status === "home"
        ? `${contextMessage} 当前状态：${petStatusLabel(pet)}。${petCareHint(pet)}`
        : pet.runaway?.status === "away"
          ? `完成一轮练习可以找回${name}。`
          : "重新领养后可以继续从 1 级开始养成。";
      if (els.petStageCard) {
        const nextStage = PET_STAGES
          .slice()
          .sort((a, b) => Number(a.minLevel || 1) - Number(b.minLevel || 1))
          .find((item) => Number(item.minLevel || 1) > Number(pet.level || 1));
        const nextCollection = nextCollectionGoal(pet);
        const nextLevelReward = PET_LEVEL_REWARDS.find((reward) => Number(reward.level) > Number(pet.level));
        const xpLeft = PET_XP_PER_LEVEL - xpInLevel;
        const collectionCopy = nextCollection
          ? nextCollection.levelGap > 0
            ? `收藏目标：Lv.${nextCollection.item.minLevel} 解锁${nextCollection.item.title}`
            : nextCollection.coinGap > 0
              ? `收藏目标：${nextCollection.item.title}还差 ${nextCollection.coinGap} 金币`
              : `收藏目标：${nextCollection.item.title}现在可以解锁`
          : "收藏目标已全部完成";
        els.petStageCard.innerHTML = `
          <strong>${escapeHTML(stage.name)}</strong>
          <span>${escapeHTML(stage.copy)}</span>
          <em>${nextStage ? `Lv.${nextStage.minLevel} 解锁${petCopy(nextStage.name, profile)}` : "成长阶段已全部解锁"}</em>
          <div class="pet-next-goal"><b>下一个目标</b><span>${escapeHTML(collectionCopy)}</span><small>${nextLevelReward ? `再获得 ${xpLeft} 经验接近 Lv.${pet.level + 1}，后续礼物：${petCopy(nextLevelReward.title, profile)}` : `再获得 ${xpLeft} 经验升级`}</small></div>
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
      renderPetCheckin(pet, profile);
    }

    function renderPetSpace(profile = activeProfile()) {
      if (!els.petShopGrid || !els.petBagList) return;
      const pet = petState(profile);
      syncPetRoomStage(profile, pet);
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
        basic: "30 题练习约能覆盖两天完整基础照料，并留下少量结余。",
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
              const affordability = typeof PetExperience.shopProgress === "function"
                ? PetExperience.shopProgress(pet.coins, item.price)
                : { gap: Math.max(0, item.price - pet.coins), pct: 0, practiceSets: 0 };
              const careKind = petCareKindForItem(item);
              const left = careKind ? petCareLeft(pet, careKind) : Infinity;
              const recommended = item.id === recommendedShopItem;
              return `<article class="pet-shop-item ${recommended ? "recommended" : ""}" tabindex="0" role="button" data-pet-detail="${item.id}" aria-label="查看${escapeHTML(item.name)}作用">
                <div class="pet-shop-icon" aria-hidden="true">${item.icon}</div>
                <strong>${escapeHTML(item.name)}</strong>
                <small>${recommended ? "推荐 · " : ""}${tierLabels[tier]}${Number.isFinite(left) ? ` · 今日 ${left} 次` : ""}</small>
                <div class="pet-shop-buy">
                  <span>${affordability.gap ? `还差 ${affordability.gap} 金币 · 约 ${affordability.practiceSets} 轮` : `${item.price} 金币`}</span>
                  <i class="pet-afford-progress"><b style="--value:${affordability.pct}%"></b></i>
                  <button class="primary" type="button" data-pet-buy="${item.id}" ${afford ? "" : "disabled"}>${afford ? "购买" : `差 ${affordability.gap} 金币`}</button>
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
      if (openModals.includes(els.petDressupModal)) state.petDressupPreview = null;
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
      if (modal === els.petDressupModal) state.petDressupPreview = null;
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
        const level = window.MathCampDailyLearningPlan?.masteryStatus?.(mastery, { wrongs: wrong, due })?.id
          || (attempts >= 8 && rate >= 85 && !wrong ? "mastered" : wrong || due || (attempts >= 3 && rate < 75) ? "weak" : attempts ? "learning" : "new");
        return { point, attempts, rate, wrong, due, level };
      });
    }
    function knowledgeMapLevelLabel(level) {
      return { mastered: "已掌握", learning: "学习中", weak: "需要巩固", new: "未学习" }[level] || "学习中";
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
            <span>${escapeHTML(curriculumHelperText(row.point) || row.point.label)}</span>
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

    function renderSubjectChoices() {
      document.querySelectorAll("[data-subject-choice]").forEach((button) => {
        const subjectId = safeSubjectId(button.dataset.subjectChoice);
        const meta = subjectThemeMeta(subjectId);
        const active = subjectId === state.subject;
        const icon = button.querySelector("span");
        const label = button.querySelector("strong");
        const copy = button.querySelector("small");
        if (icon) icon.textContent = meta.icon || meta.short || meta.label;
        if (label) label.textContent = meta.label;
        if (copy) copy.textContent = meta.themeCopy || `${meta.label}专项练习`;
        button.title = `${meta.label}主题：${meta.themeLabel || "学科空间"}`;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    function resetPracticeStateForSubjectSwitch() {
      if (state.mode === "challenge" && state.challengeMeta) {
        clearChallengeDraft(activeProfile(), state.challengeMeta.grade || state.grade);
      }
      clearAutoNext();
      stopRoundTimer();
      restoreCausePanelPlacement();
      state.mode = "normal";
      state.challengeMeta = null;
      state.timedMeta = null;
      state.currentSet = [];
      state.index = 0;
      state.checked = false;
      state.correct = 0;
      state.streak = 0;
      state.records = [];
      state.roundCoins = 0;
      state.lastWrongRecordId = "";
      state.setFinished = false;
      state.stepHintOpen = false;
      delete state._lastFinishResult;
      if (els.answerInput) {
        els.answerInput.value = "";
        els.answerInput.disabled = false;
        els.answerInput.readOnly = false;
      }
      if (els.checkBtn) els.checkBtn.disabled = false;
      if (els.showAnswerBtn) els.showAnswerBtn.disabled = true;
      if (els.summaryPanel) els.summaryPanel.hidden = true;
      if (els.reviewPanel) els.reviewPanel.hidden = true;
      if (els.challengeResultOverlay) els.challengeResultOverlay.hidden = true;
      if (els.mobileChallengeResult) els.mobileChallengeResult.hidden = true;
      if (els.causePanel) els.causePanel.classList.remove("active", "inline-cause");
      if (els.answerModePanel) {
        els.answerModePanel.hidden = true;
        els.answerModePanel.innerHTML = "";
        els.answerModePanel.classList.remove("wrong-inline-cause");
      }
      if (els.feedback) {
        els.feedback.className = "feedback";
        els.feedback.textContent = "";
      }
      setPracticeLayer("setup");
      setTypeSettingsOpen(false);
    }

    function selectSubject(subjectId) {
      const next = safeSubjectId(subjectId);
      const changed = next !== activeSubjectId();
      const currentProfile = activeProfile();
      if (changed) resetPracticeStateForSubjectSwitch();
      if (currentProfile && SubjectRegistry.syncBoundSubject) SubjectRegistry.syncBoundSubject(currentProfile, activeSubjectId());
      state.subject = next;
      storageSet(STORE.subject, next);
      applySubjectTheme(next);
      const profile = activeProfile();
      bindProfileToActiveSubject(profile);
      const supportedGrades = bankGrades();
      const preferredGrade = Number(profile.grade || state.grade) || supportedGrades[0] || 1;
      state.grade = supportedGrades.includes(preferredGrade) ? preferredGrade : supportedGrades[0] || preferredGrade;
      state.pointId = safePointId(profile.settings?.pointId || "auto", state.grade);
      state.answerMode = normalizeAnswerModeForViewport(profile.settings?.answerMode || "auto");
      renderGradeOptions();
      renderPointSelects();
      renderChrome();
      renderHomeDashboard(profile);
      if (state.view === "report") renderReport();
      if (state.view === "wrongbook") renderWrongbook();
      renderSubjectChoices();
      closeHubModals();
      UI.notify(`已选择${SUBJECTS[next].label}。`);
    }

    function openHubModal(modal) {
      if (!modal) return;
      if (modal === els.systemModal) renderProfilePanel();
      if (modal === els.subjectModal) renderSubjectChoices();
      modal.hidden = false;
      modal.classList.remove("is-closing");
      delete modal.dataset.closeToken;
      document.body.classList.add("hub-modal-open");
      closeHubModals({ except: modal });
      const focusTarget = modal.querySelector("[data-close-learning], [data-close-subject], [data-close-system], button, input, select");
      window.setTimeout(() => {
        try { focusTarget?.focus({ preventScroll: true }); } catch (_) {}
      }, 0);
    }

    function closeHubModals(options = {}) {
      const except = options.except || null;
      const openModals = [els.learningModal, els.subjectModal, els.systemModal].filter((modal) => modal && modal !== except && !modal.hidden);
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

    function nextPetCareReaction(pet, kind, profile = activeProfile()) {
      pet.experience = typeof PetExperience.normalizeExperience === "function"
        ? PetExperience.normalizeExperience(pet, todayKey())
        : (pet.experience || {});
      const sequence = Number(pet.experience.careSequence) || 0;
      pet.experience.careSequence = sequence + 1;
      return typeof PetExperience.careReaction === "function"
        ? PetExperience.careReaction(kind, petDisplayName(profile), sequence)
        : `${petDisplayName(profile)}很开心。`;
    }

    function triggerPetCollectionUnlock() {
      window.MathCampVisualPolish?.setPetReaction?.("reward", 1100);
      if (!els.petRoomStage) return;
      els.petRoomStage.classList.remove("collection-unlocked");
      void els.petRoomStage.offsetWidth;
      els.petRoomStage.classList.add("collection-unlocked");
      window.setTimeout(() => els.petRoomStage?.classList.remove("collection-unlocked"), 900);
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
      const reaction = nextPetCareReaction(pet, careKind || "encourage", profile);
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
      updatePetStatus(`${reaction}${wishDone ? " 今日心愿也完成了。" : ""}${careDone ? " 今日照料清单完成，亲密增加。" : ""}`, wishDone ? "心愿" : "舒服");
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
      state.petDressupPreview = null;
      renderPetDressup(profile);
      updatePetStatus(`${petDisplayName(profile)}解锁了${def.title}。`, "新收藏");
      triggerPetCollectionUnlock();
      UI.notify(`已解锁：${def.title}`);
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
      state.petDressupPreview = null;
      renderPetDressup(profile);
      updatePetStatus(`${petDisplayName(profile)}更新了${def.title}。`, kind === "outfit" ? "换装" : "装扮");
      triggerPetCollectionUnlock();
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
      triggerPetCollectionUnlock();
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
      triggerPetCollectionUnlock();
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
      triggerPetCollectionUnlock();
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
      const before = {
        renameCard: pet.inventory.renameCard,
        name: pet.name
      };
      pet.inventory.renameCard -= 1;
      pet.name = nextName;
      if (!saveProfiles()) {
        pet.inventory.renameCard = before.renameCard;
        pet.name = before.name;
        saveProfiles();
        renderPetSpace(profile);
        UI.notify("本地保存失败，改名卡没有使用。请先导出备份。", { tone: "bad", duration: 4200 });
        return;
      }
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
      els.modeTag.textContent = state.mode === "due-review" ? "到期错题复习" : state.mode === "weekly-review" ? "本周综合复习" : state.mode === "wrongbook" ? "错题复练" : state.mode === "similar" ? "同类巩固" : state.mode === "weak" ? "薄弱点练习" : state.mode === "timed" ? "限时小测" : state.mode === "appendix" ? "附加题挑战" : state.mode === "hard-word" ? "应用题强化" : state.mode === "logic-reading" ? "思维阅读训练" : state.mode === "custom-bank" ? `校内题库：${state.customBankMeta?.name || "练习"}` : state.mode === "challenge" ? `闯关第 ${state.challengeMeta?.level || 1} 关` : "普通练习";
      els.progressDots.innerHTML = "";
      for (let i = 0; i < total; i += 1) {
        const dot = document.createElement("span");
        dot.className = "dot";
        if (state.records[i]?.correct === true) dot.classList.add("correct");
        if (state.records[i]?.correct === false) dot.classList.add("wrong");
        els.progressDots.appendChild(dot);
      }
      renderMissionStrip();
      renderDesktopPracticeOverview();
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
    function renderCauseQuickTags(question, options = {}) {
      if (!els.causeQuickTags || !els.causeSelect) return;
      const tags = causeOptionsForQuestion(question);
      const recommended = recommendCauseForQuestion(question);
      if (options.forceRecommendation || !tags.includes(els.causeSelect.value)) {
        els.causeSelect.value = recommended;
      }
      const selected = tags.includes(els.causeSelect.value) ? els.causeSelect.value : recommended;
      els.causeQuickTags.innerHTML = "";
      if (Array.isArray(els.causeQuickTags.children)) els.causeQuickTags.children = [];
      tags.forEach((cause) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `cause-chip${cause === selected ? " active" : ""}${cause === recommended ? " recommended" : ""}`;
        btn.dataset.causeChip = cause;
        btn.dataset.shortLabel = cause;
        if (cause === recommended) btn.dataset.recommendedCause = "true";
        btn.setAttribute("aria-label", cause === recommended ? `招财建议保存错因：${cause}` : `保存错因：${cause}`);
        btn.innerHTML = `<span class="cause-label-full">${escapeHTML(cause)}</span><span class="cause-label-mobile">${escapeHTML(cause)}</span>`;
        els.causeQuickTags.appendChild(btn);
      });
    }
    function showCausePanelForWrong(question) {
      restoreCausePanelPlacement();
      const recommended = recommendCauseForQuestion(question, els.answerInput?.value || "", { forceRecommendation: true });
      els.causeSelect.value = recommended;
      renderCauseQuickTags(question, { forceRecommendation: true });
      const title = els.causePanel?.querySelector(".cause-panel-title");
      if (title) title.textContent = `招财建议先标记为“${recommended}”。点它确认保存，也可以改选。`;
      els.causePanel.classList.add("active");
      syncFloatingPetBadge();
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
    function setSelectedConfidence(value = "") {
      state.selectedConfidence = LearningQuality.normalizeConfidence?.(value) || "";
      els.confidenceControl?.querySelectorAll("[data-confidence]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.confidence === state.selectedConfidence));
      });
    }
    function answerPlaceholderForQuestion(question) {
      if (question?.answerType === "formula") return "输入算式和答案，如 23+15=38";
      if (isChineseQuestion(question)) return "根据语境输入词语或简短答案";
      if (isEnglishQuestion(question)) return "输入英文单词或短语，注意拼写";
      if (isScienceQuestion(question)) return "输入科学概念、现象或证据";
      if (question?.answerType === "text" || question?.answerType === "longText" || Array.isArray(question?.acceptedAnswers)) return "输入数值、单位或简短答案";
      return "输入数值，注意单位";
    }
    function answerGuidanceForQuestion(question) {
      if (question?.answerType === "formula") return '写出完整算式和结果，再点“检查答案”；按回车也可以提交。';
      if (isChineseQuestion(question)) return '结合材料或语境填写关键词、词语或简短答案，再检查是否答到题目要求。';
      if (isEnglishQuestion(question)) return '填写英文单词或短语，提交前检查大小写和拼写。';
      if (isScienceQuestion(question)) return '填写概念、观察现象或证据，答案要和题目中的实验记录对应。';
      return '输入答案后点“检查答案”，按回车也可以提交。';
    }
    function renderAnswerModePanel(question) {
      if (!els.answerModePanel || !question) return;
      restoreCausePanelPlacement();
      const interaction = question.interaction || applyQuestionInteraction(question, state.answerMode);
      els.practiceCard.dataset.interaction = interaction.mode;
      els.answerModePanel.hidden = interaction.mode === "input";
      els.answerInput.readOnly = interaction.mode === "choice" || interaction.mode === "judge" || shouldUseCustomAnswerKeyboard(interaction.mode, question);
      const textLikeAnswer = question.answerType === "text" || question.answerType === "formula" || question.answerType === "longText" || question.answerType === "selfReview" || Array.isArray(question.acceptedAnswers);
      els.numberPad.hidden = textLikeAnswer || isNonMathQuestion(question) || interaction.mode === "choice" || interaction.mode === "judge";
      els.answerInput.setAttribute("inputmode", shouldUseCustomAnswerKeyboard(interaction.mode, question) ? "none" : textLikeAnswer || isNonMathQuestion(question) ? "text" : "decimal");
      els.answerInput.placeholder = interaction.mode === "choice"
        ? "请选择一个答案"
        : interaction.mode === "judge"
          ? "请选择对或错"
          : answerPlaceholderForQuestion(question);
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
        const label = answerValueLabel(interaction.statementValue, interaction.statementLabel);
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
      state.setSize = clamp(Number(els.setSizeInput.value) || 10, 3, MAX_SET_SIZE);
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
      const selectedPoint = strictPoint ? bankPointMap()[state.pointId] : null;
      state.currentSet = selectedPoint
        ? buildQuestionSetForPoint(selectedPoint, state.setSize, state.answerMode)
        : buildAdaptiveQuestionSet(state.setSize, state.answerMode);
      rememberRecentQuestionSet(state.currentSet);
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
      const shouldFocus = options.focus || (options.autoFocus !== false && state.view === "practice" && window.matchMedia("(max-width: 1180px)").matches);
      if (shouldFocus) {
        enterPracticeFocus();
        startRoundTimer();
      }
    }
    function startSmartDailyPractice(options = {}) {
      const profile = activeProfile();
      state.mode = "daily-smart";
      state.challengeMeta = null;
      state.setSize = clamp(Number(els.setSizeInput.value) || 10, 3, MAX_SET_SIZE);
      state.adaptive = true;
      syncAnswerModeAvailability();
      state.answerMode = normalizeAnswerModeForViewport(els.answerModeSelect.value || "auto");
      els.answerModeSelect.value = state.answerMode;
      state.pointId = "auto";
      els.pointSelect.value = "auto";
      profile.grade = state.grade;
      profile.settings = {
        ...(profile.settings || {}),
        pointId: state.pointId,
        setSize: state.setSize,
        adaptive: true,
        dailyGoal: clamp(Number(els.dailyGoalInput.value) || 20, 5, 200),
        answerSpace: els.answerSpaceSelect.value || "auto",
        answerMode: state.answerMode,
        printTemplate: els.printTemplateSelect?.value || profile.settings?.printTemplate || "practice",
        printOutputMode: els.printExportMode?.value || profile.settings?.printOutputMode || "answers"
      };
      saveProfiles();
      syncCustomSelects();
      state.currentSet = buildSmartDailyQuestionSet(state.setSize, state.answerMode);
      rememberRecentQuestionSet(state.currentSet);
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
      const shouldFocus = options.focus || (options.autoFocus !== false && state.view === "practice" && window.matchMedia("(max-width: 1180px)").matches);
      if (shouldFocus) {
        enterPracticeFocus();
        startRoundTimer();
      }
    }
    function startPointSet(pointId, count = 3, mode = "similar") {
      const point = bankPointMap()[pointId] || pointMap[pointId] || choosePoint();
      state.mode = mode;
      state.challengeMeta = null;
      state.pointId = point.id;
      state.currentSet = buildQuestionSetForPoint(point, count, mode === "hard-word" || mode === "logic-reading" ? "step" : state.answerMode);
      rememberRecentQuestionSet(state.currentSet);
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
    function startWrongbookPractice(ids = currentGradeWrongbook().map((item) => item.id), options = {}) {
      const profile = activeProfile();
      const queue = ids.map((id) => profile.wrongbook.find((item) => item.id === id)).filter(Boolean);
      if (!queue.length) return;
      state.mode = options.mode || "wrongbook";
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
        startWrongbookPractice(due.map((item) => item.id), { mode: "due-review" });
        return;
      }
      startWrongbookPractice();
    }
    function customBankStatusLabel(status) {
      return { review: "待审核", published: "已发布", disabled: "已停用" }[status] || "待审核";
    }
    function allCurriculumPointsForBankEditor() {
      const ids = SubjectRegistry.SUBJECT_IDS || ["math", "chinese", "english", "science"];
      return ids.flatMap((subject) => {
        const bank = SubjectRegistry.subjectBank?.(subject);
        return (bank?.points || []).map((point) => ({ ...point, subject: point.subject || subject }));
      }).sort((a, b) => Number(a.grade) - Number(b.grade) || String(a.label).localeCompare(String(b.label), "zh-CN"));
    }
    function syncBankBulkPointOptions() {
      if (!els.bankBulkPointSelect) return;
      const current = els.bankBulkPointSelect.value;
      const grade = Number(els.bankBulkGradeSelect?.value) || 0;
      const subject = els.bankBulkSubjectSelect?.value || "";
      const options = allCurriculumPointsForBankEditor().filter((point) => {
        return (!grade || Number(point.grade) === grade) && (!subject || point.subject === subject);
      });
      els.bankBulkPointSelect.innerHTML = `<option value="">知识点保持不变</option><option value="__clear__">取消知识点关联</option>`
        + options.map((point) => `<option value="${escapeAttr(point.id)}">${escapeHTML(`${gradeNames[point.grade - 1]} · ${point.label}`)}</option>`).join("");
      els.bankBulkPointSelect.value = options.some((point) => point.id === current) || current === "__clear__" ? current : "";
      syncCustomSelects();
    }
    function renderBankReviewToolbar(bank, audit) {
      if (!els.bankReviewToolbar) return;
      if (!bank || !audit) {
        els.bankReviewToolbar.hidden = true;
        return;
      }
      els.bankReviewToolbar.hidden = false;
      if (els.bankAuditSummary) {
        els.bankAuditSummary.innerHTML = `<strong>${escapeHTML(customBankStatusLabel(bank.status))} · v${Number(bank.version) || 1}</strong>
          <span>质量均分 ${audit.averageScore} · 硬问题 ${audit.counts.high} · 提醒 ${audit.counts.medium} · 可直接使用 ${audit.counts.ok}</span>`;
        els.bankAuditSummary.className = `bank-audit-summary ${audit.canPublish ? "is-ready" : "has-risk"}`;
      }
      if (els.publishCustomBankBtn) {
        els.publishCustomBankBtn.hidden = bank.status === "published";
        els.publishCustomBankBtn.disabled = !audit.canPublish;
        els.publishCustomBankBtn.title = audit.canPublish ? "审核通过并加入智能练习" : `请先处理 ${audit.counts.high} 道硬规则问题`;
      }
      if (els.disableCustomBankBtn) els.disableCustomBankBtn.hidden = bank.status === "disabled";
      if (els.reviewCustomBankBtn) els.reviewCustomBankBtn.hidden = bank.status === "review";
      if (els.bankVersionHistory) {
        const history = (bank.history || []).slice(-5).reverse();
        els.bankVersionHistory.innerHTML = history.length
          ? history.map((item) => `<span><b>v${Number(item.version) || 1}</b>${escapeHTML(item.summary || item.action || "更新")}<em>${escapeHTML(String(item.at || "").slice(0, 10))}</em></span>`).join("")
          : `<span class="muted">尚无版本记录。</span>`;
      }
      if (els.bankSelectAllQuestions) els.bankSelectAllQuestions.checked = false;
      syncBankBulkPointOptions();
    }
    function renderCustomBankList() {
      const CustomBank = window.MathCampCustomBank;
      if (!els.customBankList || !CustomBank) return;
      const banks = CustomBank.listBanks();
      if (!banks.length) {
        els.customBankList.innerHTML = `<p class="muted">还没有导入校内题库。选择一个 .xlsx 或 .csv 文件后点「导入题库」。</p>`;
        state.selectedBankId = "";
        renderBankDetail("");
        return;
      }
      if (state.selectedBankId && !banks.some((bank) => bank.id === state.selectedBankId)) {
        state.selectedBankId = "";
      }
      els.customBankList.innerHTML = banks.map((bank) => {
        const when = bank.importedAt ? String(bank.importedAt).slice(0, 10) : "";
        const fmt = bank.sourceFormat ? bank.sourceFormat.toUpperCase() : "";
        const active = bank.id === state.selectedBankId;
        const status = customBankStatusLabel(bank.status);
        const statusAction = bank.status === "published"
          ? `<button class="secondary" type="button" data-custom-bank-disable="${escapeAttr(bank.id)}">停用</button>`
          : bank.status === "disabled"
            ? `<button class="secondary" type="button" data-custom-bank-review="${escapeAttr(bank.id)}">退回审核</button>`
            : `<button class="primary" type="button" data-custom-bank-publish="${escapeAttr(bank.id)}">审核发布</button>`;
        return `<div class="report-item ${active ? "report-item-active" : ""}" data-custom-bank-id="${escapeAttr(bank.id)}">
          <div>
            <strong>${escapeHTML(bank.name)} <span class="bank-status-badge" data-status="${escapeAttr(bank.status)}">${escapeHTML(status)}</span></strong>
            <div class="muted">${bank.enabledCount}/${bank.count} 题启用 · v${bank.version}${fmt ? ` · ${fmt}` : ""}${when ? ` · ${when}` : ""}</div>
          </div>
          <div class="row-actions">
            <button class="${active ? "primary" : "secondary"}" type="button" data-custom-bank-view="${escapeAttr(bank.id)}">查看题目</button>
            <button class="primary" type="button" data-custom-bank-practice="${escapeAttr(bank.id)}">整批练习</button>
            ${statusAction}
            <button class="secondary" type="button" data-custom-bank-rename="${escapeAttr(bank.id)}">重命名</button>
            <button class="danger" type="button" data-custom-bank-delete="${escapeAttr(bank.id)}">删除</button>
          </div>
        </div>`;
      }).join("");
      renderBankDetail(state.selectedBankId);
    }
    function bankAnswerTypeLabel(type) {
      return type === "choice" ? "选择题" : type === "judge" ? "判断题" : "填空 / 应用";
    }
    async function renderBankDetail(bankId) {
      if (!els.bankDetailBody) return;
      const CustomBank = window.MathCampCustomBank;
      const bank = bankId && CustomBank ? CustomBank.getBank(bankId) : null;
      if (!bank) {
        if (els.bankDetailTitle) els.bankDetailTitle.textContent = "题目详情";
        if (els.bankDetailMeta) els.bankDetailMeta.textContent = "点击左侧「校内题库」中某个批次的「查看题目」，这里会显示该批次的全部题目。";
        els.bankDetailBody.innerHTML = `<p class="bank-detail-empty muted">还没有选择题库批次。</p>`;
        renderBankReviewToolbar(null, null);
        return;
      }
      const questions = Array.isArray(bank.questions) ? bank.questions : [];
      const audit = CustomBank.auditBank?.(bankId) || { counts: { high: 0, medium: 0, low: 0, ok: questions.length }, averageScore: 100, canPublish: true, rows: [] };
      renderBankReviewToolbar(bank, audit);
      // 有图片则先解析
      if (bank.hasImages && typeof CustomBank.resolveBankImages === "function") {
        await CustomBank.resolveBankImages(bankId);
        // 解析期间用户可能切换了批次，避免错渲染
        if (state.selectedBankId !== bankId) return;
      }
      const typeCounts = questions.reduce((acc, q) => {
        const t = q.answerType || "text";
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const countSummary = Object.entries(typeCounts)
        .map(([type, n]) => `${bankAnswerTypeLabel(type)} ${n}`)
        .join(" · ");
      const imageCount = questions.filter((q) => q.imageName).length;
      if (els.bankDetailTitle) els.bankDetailTitle.textContent = bank.name;
      if (els.bankDetailMeta) els.bankDetailMeta.textContent = `共 ${questions.length} 题${countSummary ? ` · ${countSummary}` : ""}${imageCount ? ` · 含图 ${imageCount}` : ""}`;
      if (!questions.length) {
        els.bankDetailBody.innerHTML = `<p class="bank-detail-empty muted">这个批次没有题目。</p>`;
        return;
      }
      els.bankDetailBody.innerHTML = questions.map((q, index) => {
        const type = q.answerType || "text";
        const auditRow = audit.rows?.[index] || { highestSeverity: "ok", score: 100, issues: [] };
        const pointBadge = q.pointId
          ? `<span class="bank-q-badge is-point">${escapeHTML(pointLabel(q.pointId))}</span>`
          : `<span class="bank-q-badge is-loose">未关联知识点</span>`;
        const imageUrl = q.imageName && CustomBank.bankImageUrl ? CustomBank.bankImageUrl(bankId, q.imageName) : "";
        const imageBadge = q.imageName
          ? `<span class="bank-q-badge ${imageUrl ? "is-image" : "is-loose"}">${imageUrl ? "图片题" : "图片缺失"}</span>`
          : "";
        const imageHtml = imageUrl
          ? `<figure class="bank-q-image"><img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(q.imageName || "题目图片")}" loading="lazy" decoding="async"/></figure>`
          : (q.imageName ? `<div class="bank-q-missing muted">图片「${escapeHTML(q.imageName)}」未关联（导入时未选择该图片文件）。</div>` : "");
        let stem = "";
        let answerHtml = "";
        if (type === "choice") {
          const options = [q.correct, ...(Array.isArray(q.wrongs) ? q.wrongs : [])].filter((v) => v != null && String(v).trim() !== "");
          const labels = ["A", "B", "C", "D", "E", "F"];
          stem = `<div class="bank-q-stem">${escapeHTML(q.prompt || "")}</div>`
            + `<ol class="bank-q-options">${options.map((opt) => `<li>${escapeHTML(String(opt))}</li>`).join("")}</ol>`;
          answerHtml = `<span class="bank-q-answer">正确答案：${escapeHTML(String(q.correct || ""))}</span>`;
        } else if (type === "judge") {
          stem = `<div class="bank-q-stem">${escapeHTML(q.text || "")}</div>`;
          answerHtml = `<span class="bank-q-answer">答案：${escapeHTML(String(q.answer || ""))}</span>`;
        } else {
          stem = q.text ? `<div class="bank-q-stem">${escapeHTML(q.text)}</div>` : "";
          answerHtml = q.displayOnly
            ? `<span class="bank-q-answer bank-q-answer-loose">展示题（不判分）</span>`
            : `<span class="bank-q-answer">答案：${escapeHTML(String(q.answer || ""))}</span>`;
        }
        const steps = Array.isArray(q.steps) && q.steps.length
          ? `<div class="bank-q-steps"><span class="bank-q-label">步骤</span>${q.steps.map((s) => `<span>${escapeHTML(String(s))}</span>`).join("")}</div>`
          : "";
        const explanation = q.explanation
          ? `<div class="bank-q-explain"><span class="bank-q-label">解析</span>${escapeHTML(String(q.explanation))}</div>`
          : "";
        const qualityLabel = auditRow.highestSeverity === "high" ? "硬问题" : auditRow.highestSeverity === "medium" ? "需完善" : auditRow.highestSeverity === "low" ? "小提醒" : "质量通过";
        const issueText = auditRow.issues?.length ? auditRow.issues.map((item) => item.message).join("；") : "答案、题型和元数据检查通过";
        return `<article class="bank-q-item ${q.enabled === false ? "is-disabled" : ""}">
          <div class="bank-q-top">
            <label class="bank-q-select"><input type="checkbox" data-bank-q-select="${escapeAttr(q.id)}" aria-label="选择第 ${index + 1} 题" /></label>
            <span class="bank-q-index">${index + 1}</span>
            <span class="bank-q-type">${bankAnswerTypeLabel(type)}</span>
            ${pointBadge}
            ${imageBadge}
            <span class="bank-q-badge quality-${escapeAttr(auditRow.highestSeverity)}" title="${escapeAttr(issueText)}">${escapeHTML(qualityLabel)} ${auditRow.score}</span>
            <label class="bank-q-enable"><input type="checkbox" data-bank-q-enabled="${escapeAttr(q.id)}" ${q.enabled !== false ? "checked" : ""} /><span>${q.enabled !== false ? "启用" : "停用"}</span></label>
          </div>
          ${imageHtml}
          ${stem}
          <div class="bank-q-foot">${answerHtml}</div>
          ${steps}
          ${explanation}
        </article>`;
      }).join("");
      els.bankDetailBody.scrollTop = 0;
    }
    function readFileForImport(file) {
      return new Promise((resolve, reject) => {
        const name = String(file.name || "").toLowerCase();
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("文件读取失败"));
        if (name.endsWith(".xlsx")) {
          reader.onload = () => resolve({ fileName: file.name, bytes: new Uint8Array(reader.result) });
          reader.readAsArrayBuffer(file);
        } else {
          reader.onload = () => resolve({ fileName: file.name, text: String(reader.result || "") });
          reader.readAsText(file, "utf-8");
        }
      });
    }
    function renderCustomBankImportPreview(preview) {
      if (!els.customBankPreview) return;
      if (!preview?.result) {
        els.customBankPreview.hidden = true;
        els.customBankPreview.innerHTML = "";
        if (els.importCustomBankBtn) els.importCustomBankBtn.disabled = true;
        return;
      }
      const { result, audit } = preview;
      const issues = (audit.rows || []).flatMap((row, index) => row.issues.map((item) => ({ ...item, index: index + 1 }))).slice(0, 8);
      els.customBankPreview.hidden = false;
      els.customBankPreview.innerHTML = `<div class="bank-preview-summary">
          <strong>解析完成：${result.questions.length} 题</strong>
          <span>质量均分 ${audit.averageScore} · 硬问题 ${audit.counts.high} · 提醒 ${audit.counts.medium} · 跳过 ${result.skipped.length} 行</span>
        </div>
        ${issues.length ? `<ul>${issues.map((item) => `<li><b>第 ${item.index} 题</b>${escapeHTML(item.message)}</li>`).join("")}</ul>` : `<p>当前预览未发现答案、题型或元数据问题。</p>`}
        <p class="muted">确认后只会进入待审核区，不会立即混入学生的智能练习。</p>`;
      if (els.importCustomBankBtn) els.importCustomBankBtn.disabled = false;
    }
    async function prepareCustomBankImportFromUI() {
      const Excel = window.MathCampQuestionBankExcel;
      const Audit = window.MathCampQuestionQualityAudit;
      const status = els.customBankImportStatus;
      const file = els.customBankFileInput?.files?.[0];
      if (!Excel || !Audit) {
        if (status) status.textContent = "导入预览模块未加载。";
        return;
      }
      if (!file) {
        if (status) status.textContent = "请先选择一个 .xlsx 或 .csv 文件。";
        return;
      }
      if (status) status.textContent = "正在解析并检查题目...";
      try {
        const input = await readFileForImport(file);
        const nameFromFile = String(file.name || "").replace(/\.(xlsx|csv)$/i, "");
        const bankName = (els.customBankNameInput?.value || "").trim() || nameFromFile || "校内题库";
        const result = Excel.parseImportFile(input, { bankName });
        if (!result.questions.length) {
          state.customBankImportPreview = null;
          renderCustomBankImportPreview(null);
          if (status) status.textContent = `没有解析出题目（共 ${result.totalRows} 行，跳过 ${result.skipped.length} 行）。`;
          return;
        }
        const audit = Audit.auditQuestions(result.questions);
        state.customBankImportPreview = { fileName: file.name, bankName, result, audit };
        renderCustomBankImportPreview(state.customBankImportPreview);
        if (status) status.textContent = audit.canPublish
          ? "预览完成。确认后进入待审核，可继续批量维护后发布。"
          : `预览完成，发现 ${audit.counts.high} 道硬规则问题；导入后需修正才能发布。`;
      } catch (error) {
        state.customBankImportPreview = null;
        renderCustomBankImportPreview(null);
        if (status) status.textContent = `解析失败：${error?.message || error}`;
      }
    }
    async function importCustomBankFromUI() {
      const CustomBank = window.MathCampCustomBank;
      const status = els.customBankImportStatus;
      if (!CustomBank) {
        if (status) status.textContent = "导入模块未加载。";
        return;
      }
      const preview = state.customBankImportPreview;
      const file = els.customBankFileInput?.files?.[0];
      if (!preview?.result || !file || preview.fileName !== file.name) {
        if (status) status.textContent = "请先解析并预览当前文件。";
        return;
      }
      if (status) status.textContent = "正在导入...";
      try {
        const result = preview.result;
        const bankName = (els.customBankNameInput?.value || "").trim() || preview.bankName;
        // 处理关联图片：按文件名匹配用户选择的图片，存入 IndexedDB
        const Images = window.MathCampBankImages;
        const neededImages = Array.isArray(result.imageNames) ? result.imageNames : [];
        const pickedFiles = [...(els.customBankImageInput?.files || [])];
        const pickedMap = {};
        pickedFiles.forEach((f) => { pickedMap[f.name] = f; });
        let matchedImages = 0;
        let missingImages = 0;
        const addedBank = CustomBank.addBank({
          name: bankName,
          questions: result.questions,
          sourceFormat: result.sourceFormat,
          hasImages: neededImages.length > 0,
          status: "review"
        });
        if (neededImages.length && Images) {
          for (const imageName of neededImages) {
            const f = pickedMap[imageName];
            if (!f) { missingImages += 1; continue; }
            try {
              const dataUrl = await Images.fileToDataUrl(f);
              await Images.putImage(addedBank.id, imageName, dataUrl);
              matchedImages += 1;
            } catch (_) { missingImages += 1; }
          }
          await CustomBank.resolveBankImages(addedBank.id);
        }
        if (addedBank && addedBank.id) state.selectedBankId = addedBank.id;
        renderCustomBankList();
        if (els.customBankFileInput) els.customBankFileInput.value = "";
        if (els.customBankFileName) els.customBankFileName.textContent = "未选择任何文件";
        if (els.customBankImageInput) els.customBankImageInput.value = "";
        if (els.customBankImageName) els.customBankImageName.textContent = "未选择图片";
        if (els.customBankNameInput) els.customBankNameInput.value = "";
        state.customBankImportPreview = null;
        renderCustomBankImportPreview(null);
        const skipNote = result.skipped.length ? `，跳过 ${result.skipped.length} 行（格式不全）` : "";
        const imgNote = neededImages.length
          ? `，图片 ${matchedImages}/${neededImages.length} 张已关联${missingImages ? `（${missingImages} 张缺文件）` : ""}`
          : "";
        if (status) status.textContent = `已导入待审核批次「${bankName}」：${result.questions.length} 题${skipNote}${imgNote}。审核发布前不会混入日常练习。`;
      } catch (error) {
        if (status) status.textContent = `导入失败：${error?.message || error}`;
      }
    }
    async function startCustomBankPractice(bankId) {
      const CustomBank = window.MathCampCustomBank;
      if (!CustomBank) return;
      const bank = CustomBank.getBank(bankId);
      if (!bank) return;
      if (bank.hasImages && typeof CustomBank.resolveBankImages === "function") {
        await CustomBank.resolveBankImages(bankId);
      }
      const questions = CustomBank.practiceQuestionsForBank(bankId, { shuffle, shuffleOptions: shuffle });
      if (!questions.length) {
        UI.notify("这个题库没有可作答的题目（可能都是纯展示图片题）。", { tone: "bad" });
        return;
      }
      state.mode = "custom-bank";
      state.challengeMeta = null;
      state.customBankMeta = { id: bank.id, name: bank.name };
      state.currentSet = questions.map((question) => applyQuestionInteraction(question, state.answerMode));
      state.grade = Number(state.currentSet[0].grade) || Number(activeProfile().grade) || state.grade;
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
    function publishCustomBankFromUI(bankId = state.selectedBankId) {
      const CustomBank = window.MathCampCustomBank;
      const result = CustomBank?.publishBank?.(bankId);
      if (!result?.ok) {
        UI.notify(result?.reason || "题库暂时不能发布。", { tone: "bad", duration: 4200 });
        if (bankId) {
          state.selectedBankId = bankId;
          renderCustomBankList();
        }
        return false;
      }
      state.selectedBankId = bankId;
      renderCustomBankList();
      UI.notify("题库审核通过，已加入日常智能练习。", { tone: "good" });
      return true;
    }
    function setCustomBankWorkflowStatus(bankId, status) {
      const CustomBank = window.MathCampCustomBank;
      if (!CustomBank?.setBankStatus?.(bankId, status)) return false;
      state.selectedBankId = bankId;
      renderCustomBankList();
      UI.notify(status === "disabled" ? "题库已停用，不再混入智能练习。" : "题库已退回待审核。", { tone: "good" });
      return true;
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
    function challengeDifficultyForLevel(level = 1) {
      return clamp(1 + Math.floor((Number(level) - 1) / 2), 1, 8);
    }
    function challengePassRateForLevel(level = 1) {
      return clamp(80 + Math.floor((Number(level) - 1) / 4) * 2, 80, 90);
    }
    function challengeInteractionMode(index, level = 1) {
      const difficulty = challengeDifficultyForLevel(level);
      if (difficulty >= 3) return index % 6 === 5 ? "choice" : "input";
      if (difficulty >= 2) return index % 5 === 4 ? "judge" : index % 4 === 2 ? "choice" : "input";
      return index % 5 === 4 ? "judge" : index % 3 === 2 ? "choice" : state.answerMode;
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
      state.setSize = clamp(Number(els.setSizeInput.value) || Number(profile.settings?.setSize) || state.setSize || 10, 3, MAX_SET_SIZE);
      els.setSizeInput.value = String(state.setSize);
      profile.settings = {
        ...(profile.settings || {}),
        setSize: state.setSize
      };
      saveProfiles();
      const count = state.setSize;
      const difficultyLevel = challengeDifficultyForLevel(level);
      const passRate = challengePassRateForLevel(level);
      const pointsForGrade = availablePoints(grade);
      const weak = weakestPoints(4).filter((point) => point.grade === grade);
      const challengePool = [...weak, ...pointsForGrade].filter((point, index, list) => list.findIndex((item) => item.id === point.id) === index);
      state.grade = grade;
      state.mode = "challenge";
      state.challengeMeta = { grade, level, count, passRate, difficultyLevel };
      state.currentSet = Array.from({ length: count }, (_, index) => {
        const point = challengePool[index % challengePool.length] || chooseAutoPoint(pointsForGrade, false);
        const mode = challengeInteractionMode(index, level);
        const question = makeStrictQuestionForPoint(point, normalizeAnswerModeForViewport(mode), { difficultyLevel, challengeLevel: level, challengeIndex: index, externalChance: externalQuestionChanceForPoint(point) });
        return {
          ...question,
          subject: activeSubjectId(),
          challengeDifficulty: { level: difficultyLevel, challengeLevel: level, passRate }
        };
      });
      rememberRecentQuestionSet(state.currentSet);
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
      UI.notify(`开始第 ${level} 关：完成 ${count} 题，正确率 ${passRate}% 以上过关。`, { duration: 3200 });
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
      rememberRecentQuestionSet(state.currentSet);
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
      state.questionStartedAt = Date.now();
      state.hintLevel = 0;
      setSelectedConfidence("");
      clearAutoNext();
      closePetHintPopover();
      els.practiceCard.removeAttribute("data-mood");
      els.practiceCard.classList.remove("result-animate", "question-enter");
      void els.practiceCard.offsetWidth;
      els.practiceCard.classList.add("question-enter");
      window.setTimeout(() => els.practiceCard.classList.remove("question-enter"), 360);
      renderQuestionTitle(current);
      renderQuestionDiagram(current);
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
      syncFloatingPetBadge();
      els.saveCauseBtn.textContent = "直接下一题";
      els.saveCauseBtn.disabled = false;
      state.stepHintOpen = false;
      const petPrompt = isChineseQuestion(current)
        ? "我陪你先读题：看清题目问什么，再回到句子、短文或诗句里找依据。"
        : isEnglishQuestion(current)
          ? "我陪你先读英语情境：先看疑问词和空格前后，再判断词汇、句型或语法。"
        : isScienceQuestion(current)
          ? "我陪你先读科学记录：先看观察或实验现象，再用证据支持结论。"
        : current.word ? '我陪你先读题：找"已知什么、要求什么"，再决定用加减乘除。' : '我陪你先看运算符号，再按正确顺序计算。';
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
            : answerGuidanceForQuestion(current), "🤔");
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
      const originalRaw = els.answerInput.value.trim();
      const raw = question?.answerType === "text" || question?.answerType === "formula" || question?.answerType === "longText" || Array.isArray(question?.acceptedAnswers)
        ? originalRaw
        : originalRaw.replace("，", ".").replace("。", ".");
      const mode = question?.interaction?.mode || "input";
      if (!raw) {
        if (mode === "choice") return { valid: false, message: "先选一个答案，再让招财检查。" };
        if (mode === "judge") return { valid: false, message: "先判断正确或错误，再让招财检查。" };
        return { valid: false, message: "还没有填写答案。先写一个结果，再让招财检查。" };
      }
      if (isSelfReviewQuestion(question)) return { valid: true, value: NaN, raw };
      if (question?.answerType === "choice") return { valid: true, value: NaN, raw };
      if (question?.answerType === "formula") return { valid: true, value: NaN, raw };
      if (question?.answerType === "text" || Array.isArray(question?.acceptedAnswers)) return { valid: true, value: NaN, raw };
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
    function updateMastery(pointId, correct, evidence = {}) {
      const profile = activeProfile();
      const current = masteryFor(profile, pointId);
      if (LearningQuality.updateMasteryState) {
        profile.mastery[pointId] = LearningQuality.updateMasteryState(current, { ...evidence, correct });
        return profile.mastery[pointId];
      }
      current.attempts += 1;
      if (correct) current.correct += 1;
      return current;
    }
    function signature(question) {
      return `${question.pointId}|${question.text}|${formatAnswer(question.answer, question.answerLabel)}`;
    }
    function questionRepeatKey(question) {
      return `${question?.pointId || ""}|${question?.text || ""}`;
    }
    function recentQuestionRepeatKeys(profile = activeProfile(), grade = Number(profile?.grade || state.grade), limit = 80) {
      const subject = activeSubjectId();
      const keys = new Set(Array.isArray(state.recentQuestionKeys) ? state.recentQuestionKeys.filter(Boolean) : []);
      (Array.isArray(profile?.history) ? profile.history : []).slice(0, limit).forEach((item) => {
        if (Number(item.grade || grade) !== Number(grade)) return;
        if (item.subject && item.subject !== subject) return;
        if (!item.pointId || !item.text) return;
        keys.add(`${item.pointId}|${item.text}`);
      });
      return keys;
    }
    function recentQuestionPointIds(profile = activeProfile(), grade = Number(profile?.grade || state.grade), limit = 80) {
      const keys = recentQuestionRepeatKeys(profile, grade, limit);
      const ids = new Set();
      keys.forEach((key) => {
        const pointId = String(key || "").split("|")[0];
        if (pointId) ids.add(pointId);
      });
      return ids;
    }
    function recentQuestionFamilyKeySet(profile = activeProfile(), grade = Number(profile?.grade || state.grade), limit = 80) {
      const subject = activeSubjectId();
      const keys = new Set(Array.isArray(state.recentQuestionFamilyKeys) ? state.recentQuestionFamilyKeys.filter(Boolean) : []);
      (Array.isArray(profile?.history) ? profile.history : []).slice(0, limit).forEach((item) => {
        if (Number(item.grade || grade) !== Number(grade)) return;
        if (item.subject && item.subject !== subject) return;
        const familyKey = LearningQuality.questionFamilyKey?.({ pointId: item.pointId, text: item.text, questionType: item.questionType || "" });
        if (familyKey) keys.add(familyKey);
      });
      return keys;
    }
    function rememberRecentQuestionSet(questions, limit = 160) {
      const existing = Array.isArray(state.recentQuestionKeys) ? state.recentQuestionKeys : [];
      const generated = (questions || []).map(questionRepeatKey).filter((key) => key && !key.endsWith("|"));
      const combined = [...existing, ...generated].slice(-limit * 2);
      const seen = new Set();
      const compact = [];
      for (let index = combined.length - 1; index >= 0; index -= 1) {
        const key = combined[index];
        if (!key || seen.has(key)) continue;
        seen.add(key);
        compact.unshift(key);
      }
      state.recentQuestionKeys = compact.slice(-limit);
      const families = (questions || []).map((question) => question?.learningMeta?.familyKey || LearningQuality.questionFamilyKey?.(question)).filter(Boolean);
      state.recentQuestionFamilyKeys = [...new Set([...(state.recentQuestionFamilyKeys || []), ...families])].slice(-limit);
    }
    const REVIEW_STAGE_OFFSETS = [1, 3, 7, 14];
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
    function upsertWrong(question, cause = "未标记", evidence = {}) {
      const profile = activeProfile();
      const sig = signature(question);
      const found = profile.wrongbook.find((item) => item.signature === sig);
      if (found) {
        found.wrongCount += 1;
        found.correctStreak = 0;
        found.reviewStage = 0;
        found.dueDate = nextReviewDueDate(0);
        found.lastReviewedAt = Date.now();
        found.lastResult = "wrong";
        found.cause = cause || found.cause || "未标记";
        found.chainStage = "scaffold";
        found.recentDiagnostic = LearningQuality.normalizeDiagnostic?.(evidence.diagnostic) || found.recentDiagnostic || "uncertain";
        found.confidence = LearningQuality.normalizeConfidence?.(evidence.confidence) || "";
        found.hintLevel = clamp(Number(evidence.hintLevel) || 0, 0, 3);
        found.updatedAt = Date.now();
        return found.id;
      }
      const item = {
        id: uid("wrong"),
        signature: sig,
        subject: activeSubjectId(),
        question: { ...question, subject: activeSubjectId() },
        cause: cause || "未标记",
        wrongCount: 1,
        correctStreak: 0,
        reviewStage: 0,
        chainStage: "scaffold",
        recentDiagnostic: LearningQuality.normalizeDiagnostic?.(evidence.diagnostic) || "uncertain",
        confidence: LearningQuality.normalizeConfidence?.(evidence.confidence) || "",
        hintLevel: clamp(Number(evidence.hintLevel) || 0, 0, 3),
        dueDate: nextReviewDueDate(0),
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
    function updateWrongbookAttemptForProfile(profile, id, correct, evidence = {}) {
      if (!profile || !Array.isArray(profile.wrongbook)) return false;
      const itemIndex = profile.wrongbook.findIndex((entry) => entry.id === id);
      const item = itemIndex >= 0 ? profile.wrongbook[itemIndex] : null;
      if (!item) return false;
      if (correct) {
        const stable = LearningQuality.isStableEvidence ? LearningQuality.isStableEvidence({ ...evidence, correct }) : true;
        item.correctStreak = clamp((Number(item.correctStreak) || 0) + 1, 0, 4);
        item.reviewStage = clamp((Number(item.reviewStage) || 0) + 1, 0, 4);
        item.chainStage = LearningQuality.nextChainStage?.(item.chainStage || "scaffold", { correct, stable }) || item.chainStage || "scaffold";
        item.dueDate = nextReviewDueDate(item.reviewStage);
        item.lastReviewedAt = Date.now();
        item.lastResult = "correct";
        item.updatedAt = Date.now();
        const pet = petState(profile);
        const hasWrongbookBuddy = petUnlockedSkillIds(pet).includes("wrongbookBuddy");
        pet.bond = clamp(pet.bond + 1, 0, 100);
        if (hasWrongbookBuddy) pet.bond = clamp(pet.bond + 1, 0, 100);
        pet.mood = clamp(pet.mood + 1, 0, 100);
        if (item.correctStreak >= 4 && item.chainStage === "delayed") {
          markWrongAsMastered(profile, item);
          profile.wrongbook.splice(itemIndex, 1);
          if (!profile.rewards) profile.rewards = {};
          profile.rewards.clearedWrong = (profile.rewards.clearedWrong || 0) + 1;
          awardCoins(8, "掌握错题");
          pet.bond = clamp(pet.bond + 3, 0, 100);
          els.companionTalk.textContent = petCopy('这道错题已经完成 1、3、7、14 天四次复习，移入"已掌握错题"记录了。招财额外奖励 8 金币。');
          showRewardRibbon({ title: "错题掌握", copy: "完成四次间隔复习，招财把它收进已掌握记录。", coins: 8 });
        }
      } else {
        item.correctStreak = 0;
        item.reviewStage = 0;
        item.chainStage = "scaffold";
        item.recentDiagnostic = LearningQuality.normalizeDiagnostic?.(evidence.diagnostic) || item.recentDiagnostic || "uncertain";
        item.confidence = LearningQuality.normalizeConfidence?.(evidence.confidence) || "";
        item.hintLevel = clamp(Number(evidence.hintLevel) || 0, 0, 3);
        item.dueDate = nextReviewDueDate(0);
        item.lastReviewedAt = Date.now();
        item.wrongCount += 1;
        item.lastResult = "wrong";
        item.updatedAt = Date.now();
      }
      return true;
    }
    function updateWrongbookAttempt(id, correct, evidence = {}) {
      return updateWrongbookAttemptForProfile(activeProfile(), id, correct, evidence);
    }
    function recordReviewSourceAttempt(question, correct, evidence = {}) {
      const sourceId = question?.reviewSourceWrongId || "";
      if (!sourceId) return false;
      let updated = updateWrongbookAttempt(sourceId, correct, evidence);
      const candidates = [];
      state.profiles.forEach((profile) => {
        candidates.push(profile);
        Object.values(profile.subjects || {}).forEach((subjectProfile) => candidates.push(subjectProfile));
      });
      const seen = new Set();
      for (const profile of candidates) {
        if (!profile || seen.has(profile)) continue;
        seen.add(profile);
        updated = updateWrongbookAttemptForProfile(profile, sourceId, correct, evidence) || updated;
      }
      return updated;
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
      entry.subject = activeSubjectId();
      profile.history.unshift(entry);
      profile.history = profile.history.slice(0, 2500);
      advancePetProgressFromQuestion(profile, Boolean(entry.correct), entry);
      renderDailyGoal();
    }
    function renderSelfReviewControls(question) {
      if (!els.answerModePanel) return;
      els.answerModePanel.hidden = false;
      els.answerModePanel.innerHTML = `
        <strong>自评订正</strong>
        <div class="answer-mode-copy">看完参考答案后，选择这题的掌握情况。</div>
        <div class="judge-options">
          <button class="answer-option" type="button" data-self-review="correct">我答对了</button>
          <button class="answer-option" type="button" data-self-review="partial">部分正确</button>
          <button class="answer-option" type="button" data-self-review="wrong">需要订正</button>
        </div>`;
      els.answerModePanel.querySelectorAll("[data-self-review]").forEach((btn) => {
        btn.addEventListener("click", () => finishSelfReview(question, btn.dataset.selfReview));
      });
    }
    function finishSelfReview(question, result) {
      const correct = result === "correct";
      const cause = result === "wrong" ? "不会做" : "未标记";
      const record = {
        id: uid("record"),
        date: todayKey(),
        time: Date.now(),
        question,
        answer: Number.NaN,
        answerText: els.answerInput.value.trim(),
        correct,
        cause,
        selfReview: result
      };
      const evidence = {
        confidence: state.selectedConfidence,
        hintLevel: state.hintLevel,
        elapsedMs: Math.max(0, Date.now() - state.questionStartedAt),
        diagnostic: correct ? "uncertain" : LearningQuality.inferDiagnostic?.(question, { cause })
      };
      const beforeScore = masteryFor(activeProfile(), question.pointId).score;
      const mastery = updateMastery(question.pointId, correct, evidence);
      if (!correct) upsertWrong(question, cause, evidence);
      addHistory({ date: record.date, time: record.time, pointId: question.pointId, grade: question.grade, correct, cause, text: question.text, mode: state.mode || "practice", selfReview: result, ...evidence, firstTryCorrect: correct, masteryDelta: Math.round((mastery.score || 0) - (beforeScore || 0)) });
      state.records[state.index] = record;
      els.answerInput.disabled = true;
      els.checkBtn.disabled = true;
      renderStats();
      scheduleSaveProfiles();
      setFeedback(correct ? "good" : "saved", correct ? "已标记为掌握。" : "已保存订正，后续会安排复习。", correct ? "😄" : "📝");
      if (!correct && els.showAnswerBtn) els.showAnswerBtn.disabled = false;
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
      if (isSelfReviewQuestion(current)) {
        state.checked = true;
        if (els.showAnswerBtn) els.showAnswerBtn.disabled = false;
        setFeedback("saved", "已保存作答。先看参考答案，再选择掌握情况。", "📝");
        renderSelfReviewControls(current);
        return;
      }
      const expected = Number(current.answer);
      const correct = answerMatches(current, parsed);
      const elapsedMs = Math.max(0, Date.now() - state.questionStartedAt);
      const confidence = state.selectedConfidence;
      const hintLevel = state.hintLevel;
      const diagnostic = correct ? "uncertain" : LearningQuality.inferDiagnostic?.(current, { answer: parsed.raw || parsed.value || "" }) || "uncertain";
      const difficultyScore = LearningQuality.estimateDifficulty?.(current, masteryFor(activeProfile(), current.pointId)) || 0;
      const evidence = { confidence, hintLevel, elapsedMs, diagnostic, expectedMs: 35000 + difficultyScore * 7000 };
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
        cause: "未标记",
        confidence,
        elapsedMs,
        hintLevel,
        firstTryCorrect: correct,
        diagnostic,
        difficultyScore
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
        const recommendedCause = recommendCauseForQuestion(current, parsed.raw || parsed.text || parsed.value || "");
        const firstHint = current.word
          ? `先看"已知什么、要求什么"，再检查数量关系：${methodHintFor(current)}`
          : methodHintFor(current);
        setFeedback("bad", `招财：这题先不急着看答案。我先判断可能是“${recommendedCause}”。第一步提示：${firstHint} 点"查看答案"可以看完整答案和步骤。`, "😢");
        updatePetStatus(petCoachForCause(current, recommendedCause), "学习建议");
        triggerAnswerAnimation("wrong");
        playSound("wrong");
        els.numberPad.hidden = shouldHideAnswerControlsForWrong(current);
        showCausePanelForWrong(current);
        if (els.showAnswerBtn) els.showAnswerBtn.disabled = false;
      }
      const beforeScore = masteryFor(activeProfile(), current.pointId).score;
      const mastery = updateMastery(current.pointId, correct, evidence);
      const masteryDelta = Math.round((mastery.score || 0) - (beforeScore || 0));
      const updatedReviewSource = recordReviewSourceAttempt(current, correct, evidence);
      if (state.mode === "wrongbook") updateWrongbookAttempt(current.wrongId, correct, evidence);
      else if (!correct && !updatedReviewSource) upsertWrong(current, "未标记", evidence);
      addHistory({ date: record.date, time: record.time, pointId: current.pointId, grade: current.grade, correct, cause: record.cause, text: current.text, mode: state.mode || "practice", ...evidence, firstTryCorrect: correct, difficultyScore, masteryDelta });
      state.records[state.index] = record;
      state.lastWrongRecordId = correct ? "" : record.id;
      els.answerInput.disabled = true;
      els.checkBtn.disabled = true;
      els.answerModePanel.querySelectorAll(".answer-option").forEach((btn) => {
        btn.disabled = true;
      });
      saveChallengeDraft({ persist: false, render: false });
      scheduleSaveProfiles();
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
      updatePetStatus(petCoachForCause(record.question, cause), "复习建议");
      els.saveCauseBtn.textContent = "✅ 已保存";
      els.saveCauseBtn.disabled = true;
      const current = state.currentSet[state.index];
      els.numberPad.hidden = shouldHideAnswerControlsForWrong(current);
      if (!els.causePanel.classList.contains("inline-cause")) {
        els.answerModePanel.hidden = true;
        els.causePanel.classList.remove("active");
      }
      state.lastWrongRecordId = "";
      syncFloatingPetBadge();
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
      const previousSignature = current ? signature(current) : "";
      const usedSignatures = new Set(state.currentSet.filter((_, index) => index !== state.index).map(signature));
      state.currentSet[state.index] = makeDistinctQuestionForPoint(point, state.answerMode, {
        usedSignatures,
        previousSignature,
        pick: createRoundQuestionPicker(state.answerMode)
      });
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
    function roundQuestionSourceSummary(records = state.records) {
      if (QuestionSourceSummary.summarizeQuestionSources) {
        return QuestionSourceSummary.summarizeQuestionSources(records);
      }
      return { total: Array.isArray(records) ? records.length : 0, items: [{ id: "template", label: "本地模板/动态题", count: Array.isArray(records) ? records.length : 0 }], counts: {} };
    }
    function roundQuestionSourceSummaryHTML(records = state.records, compact = false) {
      const summary = roundQuestionSourceSummary(records);
      const items = summary.items.filter((item) => item.count > 0);
      if (!items.length) return "";
      const content = items.map((item) => `<span>${escapeHTML(item.label)} ${item.count}</span>`).join("");
      return compact
        ? `<span class="source-audit-summary round-source-summary">${content}</span>`
        : `<div class="source-audit-summary round-source-summary" aria-label="本轮来源统计"><strong>本轮来源统计</strong>${content}</div>`;
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
        ${roundQuestionSourceSummaryHTML(state.records, true)}
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
        ${roundQuestionSourceSummaryHTML(state.records)}
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
      const questionBank = bankForSubject(subjectIdFromQuestion(question));
      const point = questionBank?.pointMap?.[question?.pointId] || pointMap[question?.pointId];
      const kp = knowledgeProfileFor(point);
      const normalizedCause = normalizeCause(cause);
      const pitfall = causeOptionsForQuestion(question).includes(normalizedCause)
        ? (LearningInsights.adviceForCause?.(normalizedCause, point) || normalizedCause)
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
      const petSummary = roundPetSummary(wrong, rate);
      setPetAction(wrong.length ? "hint" : "finish", wrong.length ? "复盘" : "完成");
      const finishedTitle = state.mode === "due-review" ? "到期错题复习结束"
        : state.mode === "wrongbook" ? "错题复练结束"
        : state.mode === "daily-smart" ? "今日练习完成"
        : state.mode === "challenge" ? (challenge?.passed ? "闯关成功" : "闯关复盘")
        : state.mode === "timed" ? (state.timedMeta?.expired ? "限时小测时间到" : "限时小测完成")
        : "本轮练习完成";
      const finishedCopy = state.mode === "timed"
        ? (state.timedMeta?.expired ? "时间到了，先看本次错题和薄弱点；下次可以少量多次练。" : "限时小测完成了，下面先看错题和用时节奏。")
        : challenge ? challenge.copy : petSummary;
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
        ${roundQuestionSourceSummaryHTML(state.records)}
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
      updatePetStatus(petSummary, wrong.length ? "复盘建议" : "完成");
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
    function startWeeklyReviewPractice() {
      state.mode = "weekly-review";
      state.challengeMeta = null;
      state.pointId = "auto";
      state.currentSet = buildWeeklyReviewQuestionSet(Math.min(10, state.setSize || 10), state.answerMode);
      rememberRecentQuestionSet(state.currentSet);
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
    function startLogicReadingTraining() {
      const point = readingPointForGrade(activeProfile().grade || state.grade);
      const count = Math.max(8, Math.min(12, Number(state.setSize) || 10));
      closeHubModals();
      startPointSet(point.id, count, "logic-reading");
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
        <p>这些题已经完成四次间隔复习，从错题本移入掌握记录。最近掌握：${escapeHTML(recent)}。</p>
      </div>`;
    }
    function causeSelectHTML(selected, id) {
      const normalizedSelected = normalizeCause(selected);
      return `<select data-wrong-cause="${escapeAttr(id)}" aria-label="修改错因">${bankCauses().map((cause) => `<option value="${escapeAttr(cause)}" ${cause === normalizedSelected ? "selected" : ""}>${escapeHTML(cause)}</option>`).join("")}</select>`;
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
    function buildParentWeeklyPrompt(profile = activeProfile()) {
      const subjectLabel = subjectThemeMeta(activeSubjectId()).label || "当前学科";
      const week = currentWeekItems(profile);
      const mastered = currentWeekMasteredWrong(profile).length;
      if (!week.length) return `本周${subjectLabel}样本还少，先保持一键练习，不需要额外加题。`;
      const rows = LearningInsights.causeBreakdown?.(profile, bankPointMap(), { limit: 80, causes: bankCauses() }) || [];
      const cause = rows[0]?.cause || "基础巩固";
      const rate = accuracyOf(week);
      if (mastered > 0) return `本周${subjectLabel}主要看“${cause}”，已掌握 ${mastered} 道错题，下次轻练 6 题即可。`;
      return `本周${subjectLabel}正确率 ${rate}%，主要看“${cause}”，建议继续一键练习少量巩固。`;
    }
    function roundPetSummary(wrong = [], rate = 0) {
      if (!wrong.length) return "招财：这轮很稳，今天不用加量，保持这个节奏就很好。";
      const causeCounts = {};
      wrong.forEach((record) => {
        const cause = normalizeCause(record?.cause) || recommendCauseForQuestion(record?.question);
        causeCounts[cause] = (causeCounts[cause] || 0) + 1;
      });
      const mainCause = Object.entries(causeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "不会做";
      if (wrong.length >= 3 || rate < 60) return `招财：今天先不加量，主要处理“${mainCause}”，下一轮我会带你少量巩固。`;
      return `招财：这轮只要盯住“${mainCause}”，做 2-3 道同类题就够了。`;
    }
    function buildParentDiagnosis(profile = activeProfile(), weakPoints = [], rows = []) {
      const subjectLabel = subjectThemeMeta(activeSubjectId()).label || "当前学科";
      const pointMapForSubject = bankPointMap();
      const causeRows = LearningInsights.causeBreakdown?.(profile, pointMapForSubject, { limit: 120, causes: bankCauses() }) || [];
      const rowPoint = rows.find((row) => row?.pointId);
      const weakPoint = (weakPoints || []).filter(Boolean)[0]
        || (rowPoint ? pointMapForSubject[rowPoint.pointId] : null)
        || availablePoints(profile.grade)[0];
      const mainCause = causeRows[0]?.cause || "暂无明显错因";
      const weeklyItems = currentWeekItems(profile);
      const weeklyAccuracy = weeklyItems.length ? accuracyOf(weeklyItems) : 0;
      const mastered = currentWeekMasteredWrong(profile).length;
      const actionPoint = weakPoint?.id ? weakPoint : null;
      const actionLabel = actionPoint ? pointLabel(actionPoint.id) : "按年级混合练习";
      const advice = mainCause === "暂无明显错因"
        ? "先完成一轮 6-10 题，积累样本后再看趋势。"
        : (LearningInsights.adviceForCause?.(mainCause, actionPoint) || "下一轮先做少量同类题，观察是否连续稳定。");
      const summary = weeklyItems.length
        ? `${subjectLabel}本周完成 ${weeklyItems.length} 题，正确率 ${weeklyAccuracy}%。主要错因是“${mainCause}”，下一轮建议围绕“${actionLabel}”做 6-8 题。`
        : `${subjectLabel}还缺少本周样本，建议先做一轮 6-8 题，再看错因是否集中。`;
      return {
        title: "本周家长提示 · 家长诊断",
        subjectLabel,
        mainCause,
        weeklyPrompt: buildParentWeeklyPrompt(profile),
        summary,
        advice,
        actionPoint,
        actionLabel,
        weeklyCount: weeklyItems.length,
        weeklyAccuracy,
        mastered
      };
    }
    function renderParentDiagnosis(profile = activeProfile(), weakPoints = [], rows = []) {
      if (!els.reportParentCoach) return;
      const diagnosis = buildParentDiagnosis(profile, weakPoints, rows);
      els.reportParentCoach.innerHTML = `
        <div class="parent-diagnosis-head">
          <div><span class="eyebrow">${escapeHTML(diagnosis.subjectLabel)}</span><h3>${escapeHTML(diagnosis.title)}</h3></div>
          <span class="tag">${escapeHTML(diagnosis.mainCause)}</span>
        </div>
        <p>${escapeHTML(diagnosis.weeklyPrompt)}</p>
        <div class="mini-meta">
          <span>本周：${diagnosis.weeklyCount || 0} 题</span>
          <span>正确率：${diagnosis.weeklyCount ? diagnosis.weeklyAccuracy + "%" : "--"}</span>
          <span>已掌握错题：${diagnosis.mastered}</span>
        </div>
        <p>${escapeHTML(diagnosis.summary)}</p>
        <p class="parent-diagnosis-advice">${escapeHTML(diagnosis.advice)}</p>
        ${diagnosis.actionPoint ? `<div class="parent-diagnosis-actions"><button class="secondary compact-btn" type="button" data-parent-diagnosis-point="${escapeAttr(diagnosis.actionPoint.id)}">按诊断练一轮</button></div>` : ""}`;
      els.reportParentCoach.querySelectorAll("[data-parent-diagnosis-point]").forEach((btn) => {
        btn.addEventListener("click", () => startPointSet(btn.dataset.parentDiagnosisPoint, Math.min(8, state.setSize), "weak"));
      });
    }
    function renderReport() {
      const profile = activeProfile();
      const mobileReport = isMobilePracticeViewport();
      const report = window.MathCampReport.buildReportModel({
        availablePoints,
        masteryAccuracy,
        normalizeCause,
        todayKey,
        weakestPoints
      }, profile, { mobileReport });
      const history = report.history;
      const weak = report.weak;
      const accuracy = report.accuracy;
      els.reportToday.textContent = report.today.length;
      els.reportAccuracy.textContent = history.length ? `${accuracy}%` : "--";
      if (els.reportStreak) els.reportStreak.textContent = learningDays();
      els.reportWeakCount.textContent = weak.length;
      renderDailyGoal();
      renderTrendReport(profile, weak, accuracy);
      renderReportVisualSummary(profile, history, accuracy);
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
        ? "先完成 1 轮 6-10 题，建立今天的练习样本。"
        : prev7.length
          ? `近 7 天完成 ${last7.length} 题，正确率 ${lastRate}%，比上一周期${delta >= 0 ? "提高" : "下降"} ${Math.abs(delta)} 个百分点。`
          : `近 7 天完成 ${last7.length} 题，正确率 ${lastRate}%。`;
      const planCopy = planPoint
        ? `下一轮优先练“${planPoint.label}”，控制在 10 题以内。`
        : "下一轮按当前年级混合练习，先积累更多记录。";
      els.trendReportList.innerHTML = `
        <div class="report-item report-action-item">
          <div class="item-top"><h3>下一轮怎么练</h3><span class="tag">${delta > 0 ? "上升" : delta < 0 ? "需稳住" : "观察中"}</span></div>
          <p>${escapeHTML(trendText)} ${escapeHTML(planCopy)}</p>
          <div class="mini-meta"><span>较稳：${strongest ? `${pointLabel(strongest.pointId)} ${strongest.rate}%` : "暂无"}</span><span>需巩固：${weakest ? `${pointLabel(weakest.pointId)} ${weakest.rate}%` : "暂无"}</span></div>
          ${planPoint ? `<div class="row-actions"><button class="secondary" type="button" data-trend-point="${escapeAttr(planPoint.id)}">按计划练一轮</button></div>` : ""}
        </div>`;
      els.trendReportList.querySelectorAll("[data-trend-point]").forEach((btn) => {
        btn.addEventListener("click", () => startPointSet(btn.dataset.trendPoint, Math.min(10, state.setSize), "similar"));
      });
      renderReportWeakSummary(profile, weakPoints, rows);
      renderReportCauseSummary(profile);
      renderReportTrendSummary(last7, prev7, lastRate, prevRate, delta, accuracy);
      renderParentDiagnosis(profile, weakPoints, rows);
    }

    function renderReportWeakSummary(profile, weakPoints, rows = []) {
      if (!els.reportWeakList) return;
      const rowMap = Object.fromEntries(rows.map((row) => [row.pointId, row]));
      const insightMap = Object.fromEntries((LearningInsights.buildWeakPointInsights?.({ points: bankPoints(), pointMap: bankPointMap() }, profile, {
        points: weakPoints.length ? weakPoints : availablePoints(profile.grade),
        pointMap: bankPointMap(),
        grade: profile.grade,
        limit: 3
      }) || []).map((item) => [item.pointId, item]));
      const points = (weakPoints.length ? weakPoints : availablePoints(profile.grade)).slice(0, 3);
      els.reportWeakList.innerHTML = points.length ? points.map((point) => {
        const row = rowMap[point.id];
        const mastery = masteryFor(profile, point.id);
        const rate = row ? row.rate : (mastery.attempts ? Math.round(mastery.correct / mastery.attempts * 100) : 0);
        const insight = insightMap[point.id];
        const tag = row ? `${rate}%` : (insight?.mainCause || "待练");
        const copy = insight?.advice || point.helper;
        return `<div class="report-item compact-report-item">
          <div class="item-top"><h3>${escapeHTML(point.label)}</h3><span class="tag">${escapeHTML(tag)}</span></div>
          <p>${escapeHTML(copy)}</p>
        </div>`;
      }).join("") : `<div class="empty-state">暂无明显薄弱点，继续保持当前节奏。</div>`;
    }

    function renderReportCauseSummary(profile) {
      if (!els.reportCauseSummary) return;
      const rows = LearningInsights.causeBreakdown?.(profile, bankPointMap(), { limit: 120, causes: bankCauses() }) || [];
      els.reportCauseSummary.innerHTML = rows.length ? rows.slice(0, 3).map(({ cause, count }) => `
        <div class="report-item compact-report-item">
          <div class="item-top"><h3>${escapeHTML(cause)}</h3><span class="tag">${count} 次</span></div>
          <p>${escapeHTML(LearningInsights.adviceForCause?.(cause, null) || "下次练习时重点检查这一类错误。")}</p>
        </div>`).join("") : `<div class="empty-state">暂时没有明显错因。</div>`;
    }

    function renderReportTrendSummary(last7, prev7, lastRate, prevRate, delta, accuracy) {
      if (!els.reportTrendSummary) return;
      const trendLabel = last7.length && prev7.length ? (delta >= 0 ? "比上周期更稳" : "需要稳住正确率") : "继续积累样本";
      els.reportTrendSummary.innerHTML = `
        <div class="report-item compact-report-item">
          <div class="item-top"><h3>近 7 天</h3><span class="tag">${last7.length} 题</span></div>
          <p>正确率 ${last7.length ? lastRate + "%" : "--"}，${escapeHTML(trendLabel)}。</p>
        </div>
        <div class="report-item compact-report-item">
          <div class="item-top"><h3>总体状态</h3><span class="tag">${accuracy || "--"}${accuracy ? "%" : ""}</span></div>
          <p>上一周期正确率 ${prev7.length ? prevRate + "%" : "暂无"}。</p>
        </div>`;
    }

    function renderReportVisualSummary(profile, history = [], accuracy = 0) {
      if (els.reportAccuracyDonutText) {
        els.reportAccuracyDonutText.textContent = history.length ? `${accuracy}%` : "--";
      }
      if (els.reportAccuracyDonut) {
        els.reportAccuracyDonut.style.setProperty("--value", `${Math.max(0, Math.min(100, accuracy))}%`);
      }
      if (els.reportAccuracyCopy) {
        els.reportAccuracyCopy.textContent = history.length
          ? `近 ${history.length} 题的总体正确率是 ${accuracy}%。`
          : "先完成几道题，这里会显示正确率圆环。";
      }
      if (els.reportTopicBars) {
        const topicCounts = {};
        (history || []).forEach((item) => {
          const point = pointMap[item.pointId];
          const key = point ? point.topic : "other";
          topicCounts[key] = (topicCounts[key] || 0) + 1;
        });
        const total = Math.max(1, history.length);
        const topicLabels = {
          addsub: "加减",
          muldiv: "乘除",
          word: "应用题",
          reading: "思维阅读",
          thinking: "思维精进",
          geometry: "图形",
          mixed: "综合",
          appendix: "附加",
          decimal: "小数",
          fraction: "分数",
          compare: "比较",
          other: "其他"
        };
        const topTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
        els.reportTopicBars.innerHTML = topTopics.length ? topTopics.map(([topic, count]) => {
          const width = Math.max(10, Math.round(count / total * 100));
          const label = topic === "vertical" ? "竖式计算" : topic === "twostep" ? "两步计算" : topic === "reading" ? "思维阅读" : (topicLabels[topic] || topic);
          return `<div class="report-bar-row"><span>${escapeHTML(label)}</span><div class="report-bar-track"><i style="width:${width}%"></i></div><b>${width}%</b></div>`;
        }).join("") : `<div class="empty-state">暂无题型构成数据。</div>`;
      }
      if (els.reportRhythmDots) {
        const days = Array.from({ length: 7 }, (_, index) => {
          const offset = index - 6;
          const date = todayKey(offset);
          const items = (history || []).filter((item) => item.date === date);
          return { date, count: items.length, rate: accuracyOf(items) };
        });
        els.reportRhythmDots.innerHTML = days.map((day) => {
          const size = Math.max(10, Math.min(28, day.count * 4 + 10));
          return `<div class="report-rhythm-dot" title="${escapeAttr(day.date)}"><span style="--dot-size:${size}px"></span><small>${day.date.slice(5).replace("-", "/")}</small></div>`;
        }).join("");
      }
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
        window.MathCampAndroid.print("喵喵学习题单");
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
      const archive = window.MathCampImportExport.buildArchiveData({
        collectSystemSettings,
        normalizeProfile,
        state
      });
      if (window.MathCampCustomBank) {
        // 同步部分：题目 JSON（图片在异步的 buildArchiveText 里补上）
        archive.customBanks = window.MathCampCustomBank.exportAll();
      }
      return archive;
    }
    async function buildArchiveText() {
      const archive = buildArchiveData();
      // 用含图片的完整导出覆盖 customBanks（图片在 IndexedDB）
      if (window.MathCampCustomBank && typeof window.MathCampCustomBank.exportAllWithImages === "function") {
        try {
          archive.customBanks = await window.MathCampCustomBank.exportAllWithImages();
        } catch (_) { /* 保底：保留同步版 customBanks */ }
      }
      return JSON.stringify(archive, null, 2);
    }
    async function exportData() {
      const text = await buildArchiveText();
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
      return window.MathCampImportExport.parseImportBackup({
        collectSystemSettings,
        isPlainObject,
        normalizeProfile,
        normalizeSystemSettings,
        uniquifyRecordIds
      }, raw);
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
        const beforeSystemSettings = collectSystemSettings();
        const beforePending = state.pendingImport;
        state.profiles = pending.profiles;
        state.activeId = pending.activeId;
        applySystemSettings(pending.systemSettings || {}, { touch: false });
        state.pendingImport = null;
        if (!saveProfiles()) {
          state.profiles = beforeProfiles;
          state.activeId = beforeActiveId;
          applySystemSettings(beforeSystemSettings, { touch: false });
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
        if (window.MathCampCustomBank) {
          try {
            const parsed = JSON.parse(pending.raw);
            const cb = parsed.customBanks;
            if (cb && !Array.isArray(cb) && Array.isArray(cb.banks) && typeof window.MathCampCustomBank.replaceAllWithImages === "function") {
              // 新格式：含图片
              await window.MathCampCustomBank.replaceAllWithImages(cb);
              renderCustomBankList();
            } else if (Array.isArray(cb)) {
              // 旧格式：仅题目
              window.MathCampCustomBank.replaceAll(cb);
              renderCustomBankList();
            }
          } catch (_) { /* 忽略：旧备份没有 customBanks 字段 */ }
        }
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
        if (btn.dataset.view === "practice" && state.view === "practice" && document.body.classList.contains("type-settings-open")) {
          closeTypeSettings();
          return;
        }
        showView(btn.dataset.view);
      }
    }));
    document.querySelectorAll("[data-top-mode-action]").forEach((btn) => btn.addEventListener("click", handleTopModeAction));
    document.querySelectorAll("[data-jump]").forEach((btn) => btn.addEventListener("click", () => {
      closeHubModals();
      showView(btn.dataset.jump);
    }));
    document.querySelectorAll("[data-open-learning]").forEach((btn) => btn.addEventListener("click", () => openHubModal(els.learningModal)));
    document.querySelectorAll("[data-open-subject]").forEach((btn) => btn.addEventListener("click", () => openHubModal(els.subjectModal)));
    document.querySelectorAll("[data-open-learning-map]").forEach((btn) => btn.addEventListener("click", () => openLearningKnowledgeMap(activeProfile())));
    document.querySelectorAll("[data-start-logic-reading]").forEach((btn) => btn.addEventListener("click", startLogicReadingTraining));
    document.querySelectorAll("[data-close-learning]").forEach((btn) => btn.addEventListener("click", closeHubModals));
    document.querySelectorAll("[data-close-subject]").forEach((btn) => btn.addEventListener("click", closeHubModals));
    document.querySelectorAll("[data-subject-choice]").forEach((btn) => btn.addEventListener("click", () => selectSubject(btn.dataset.subjectChoice)));
    document.querySelectorAll("[data-open-system]").forEach((btn) => btn.addEventListener("click", () => openHubModal(els.systemModal)));
    document.querySelectorAll("[data-close-system]").forEach((btn) => btn.addEventListener("click", closeHubModals));
    [els.learningModal, els.subjectModal, els.systemModal].forEach((modal) => {
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
    els.profileSelect?.addEventListener("change", () => switchProfile(els.profileSelect.value));
    els.quickAddProfileBtn?.addEventListener("click", addProfile);
    els.saveSystemProfileBtn?.addEventListener("click", saveSystemProfile);
    els.musicToggles.forEach((button) => button.addEventListener("click", toggleMusic));
    els.soundToggles.forEach((button) => button.addEventListener("click", toggleSound));
    els.themeSelects.forEach((select) => select.addEventListener("change", () => applyTheme(select.value)));
    els.themeOptions.forEach((button) => button.addEventListener("click", () => applyTheme(button.dataset.themeOption)));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".custom-select")) closeCustomSelects();
      if (event.target.closest("[data-audio-prompt-play]")) {
        event.preventDefault();
        speakQuestionPrompt(state.currentSet[state.index]);
      }
      const zoomImg = event.target.closest(".question-source-image img, .bank-q-image img");
      if (zoomImg && zoomImg.getAttribute("src")) {
        openImageLightbox(zoomImg.getAttribute("src"), zoomImg.getAttribute("alt") || "题目大图");
      }
    });
    var lightbox = document.getElementById("imageLightbox");
    var lightboxImg = document.getElementById("imageLightboxImg");
    function openImageLightbox(src, alt) {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "题目大图";
      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
    }
    function closeImageLightbox() {
      if (!lightbox) return;
      lightbox.hidden = true;
      lightbox.setAttribute("aria-hidden", "true");
      if (lightboxImg) lightboxImg.src = "";
    }
    lightbox?.addEventListener("click", closeImageLightbox);
    document.getElementById("imageLightboxClose")?.addEventListener("click", (e) => { e.stopPropagation(); closeImageLightbox(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lightbox && !lightbox.hidden) closeImageLightbox(); });
    if (!isAndroidWebView()) {
      document.addEventListener("pointerdown", handleAudioGesture, true);
      document.addEventListener("touchstart", handleAudioGesture, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", handleAudioVisibility);
    window.addEventListener("pagehide", stopBackgroundMusic);
    // 页面进入后台或即将卸载前，立即写入挂起的防抖保存，避免丢失最后的答题数据。
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushPendingSaveProfiles();
    });
    window.addEventListener("pagehide", flushPendingSaveProfiles);
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
      syncFloatingPetVisibility();
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
    els.desktopOverviewStartBtn?.addEventListener("click", () => startNewSet({ focus: true }));
    els.homeStartPracticeBtn?.addEventListener("click", () => startSmartDailyPractice({ focus: true }));
    els.challengePanel?.addEventListener("click", (event) => {
      const startButton = event.target.closest("#startChallengeBtn");
      const desktopPanelClick = window.matchMedia("(min-width: 981px)").matches && !event.target.closest("#startTimedQuizBtn");
      if (!startButton && !desktopPanelClick) return;
      event.preventDefault();
      event.stopPropagation();
      startChallengeSet();
    }, true);
    els.startChallengeBtn?.addEventListener("click", startChallengeSet);
    els.backToSetupBtn.addEventListener("click", returnToPracticeSetup);
    els.closeTypeSettingsBtn?.addEventListener("click", closeTypeSettings);
    els.checkBtn.addEventListener("click", checkAnswer);
    els.confidenceControl?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-confidence]");
      if (!button || state.checked) return;
      setSelectedConfidence(button.dataset.confidence === state.selectedConfidence ? "" : button.dataset.confidence);
    });
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
      const message = nextPetCareReaction(pet, "encourage", profile);
      updatePetStatus(hasCareReward ? message : `${petDisplayName(profile)}今天已经收到足够多的摸摸啦，继续练题会更有用。`, hasCareReward ? "呼噜" : "已满足");
      setPetAction("encourage", hasCareReward ? "呼噜" : "陪你");
      playSound("meow");
      saveProfiles();
      renderPetSpace(profile);
    });
    els.petCharacterBtn?.addEventListener("click", () => {
      els.petEncourageBtn.click();
    });
    els.petRoomCatBtn?.addEventListener("click", () => {
      const profile = activeProfile();
      if (!profile) return;
      const pet = petState(profile);
      if (!petCheckedInToday(pet)) {
        els.petCheckinBtn?.click();
      } else {
        els.petEncourageBtn.click();
      }
    });
    els.petCheckinBtn?.addEventListener("click", () => {
      const profile = activeProfile();
      if (!profile) return;
      const pet = petState(profile);
      const result = applyPetCheckin(pet);
      if (!result.applied) {
        renderPetCheckin(pet, profile);
        return;
      }
      updateProfile(profile);
      setPetAction("encourage", "签到");
      playSound("meow");
      const bonusText = result.cycleBonus ? `，连签彩蛋再加 ${result.cycleBonus} 金币` : "";
      updatePetStatus(`签到成功！连续 ${result.streak} 天，领到 ${result.coins} 金币，亲密 +${result.bond}${bonusText}。`, "签到");
      saveProfiles();
      renderPetSpace(profile);
    });
    els.petHintBtn.addEventListener("click", () => {
      const current = state.currentSet[state.index];
      if (!current) return;
      state.stepHintOpen = true;
      state.hintLevel = clamp(state.hintLevel + 1, 1, 3);
      const hint = hintForLevel(current, state.hintLevel);
      els.methodHint.textContent = hint;
      if (!isWaitingForCauseSave()) {
        renderAnswerModePanel(current);
      }
      updatePetStatus(`招财：第 ${state.hintLevel} 级提示。${hint}`, "提示");
      if (shouldUseMobilePetHintPopover()) openPetHintPopover(hint);
      setPetAction("hint", `${state.hintLevel}级`);
    });
    els.mobilePetHintClose?.addEventListener("click", closePetHintPopover);
    els.floatingPetButton?.addEventListener("pointerdown", beginFloatingPetDrag);
    window.addEventListener("pointermove", moveFloatingPetDrag);
    window.addEventListener("pointerup", endFloatingPetDrag);
    window.addEventListener("pointercancel", endFloatingPetDrag);
    els.floatingPetButton?.addEventListener("click", (event) => {
      if (floatingPetDrag.suppressClick) {
        event.preventDefault();
        return;
      }
      openFloatingPetPanel("hint");
    });
    els.floatingPetClose?.addEventListener("click", closeFloatingPetPanel);
    els.floatingPetPanel?.addEventListener("click", (event) => {
      const careBtn = event.target.closest("[data-floating-pet-care-action]");
      if (careBtn) {
        closeFloatingPetPanel();
        showView("petspace");
        return;
      }
      const saveBtn = event.target.closest("[data-floating-pet-save-cause]");
      if (saveBtn) {
        els.causeSelect.value = saveBtn.dataset.floatingPetSaveCause;
        renderCauseQuickTags(state.currentSet[state.index]);
        saveCurrentCause();
        closeFloatingPetPanel();
        return;
      }
      const actionBtn = event.target.closest("[data-floating-pet-action]");
      if (actionBtn) handleFloatingPetAction(actionBtn.dataset.floatingPetAction);
    });
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
    els.openPetThemeShopBtn?.addEventListener("click", () => openPetModal("themes"));
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
      const previewCard = event.target.closest("[data-pet-preview]");
      if (previewCard && !event.target.closest("button")) {
        const [kind, id] = String(previewCard.dataset.petPreview || "").split(":");
        if (petCollectionDef(kind, id)) {
          state.petDressupPreview = { kind, id };
          renderPetDressup();
        }
        return;
      }
      if (event.target.closest("[data-pet-free-care]")) {
        const profile = activeProfile();
        const pet = petState(profile);
        const result = PetExperience.applyDailyFreeCare?.(pet, todayKey());
        if (!result?.applied) {
          UI.notify("今天的免费照料已经使用过了。", { tone: "warn" });
          return;
        }
        applyPetLevel(pet);
        pet.lastCareDate = todayKey();
        addPetMemory(pet, "今日免费照料", `${petDisplayName(profile)}的${{ hunger: "饥饿", clean: "清洁", mood: "心情" }[result.stat] || "状态"}提升了 ${result.value} 点。`);
        saveProfiles();
        renderPetSpace(profile);
        const action = result.stat === "hunger" ? "fed" : result.stat === "clean" ? "cleanComfy" : "play";
        setPetAction(action, "+15");
        UI.notify(`免费照料完成，${{ hunger: "饥饿值", clean: "清洁值", mood: "心情值" }[result.stat]} +${result.value}`);
        return;
      }
      const dailyChoiceBtn = event.target.closest("[data-pet-daily-choice]");
      if (dailyChoiceBtn) {
        const profile = activeProfile();
        const pet = petState(profile);
        const result = PetExperience.applyDailyChoice?.(pet, dailyChoiceBtn.dataset.petDailyChoice, todayKey());
        if (!result?.applied) {
          UI.notify("今天已经完成陪伴选择了。", { tone: "warn" });
          return;
        }
        applyPetLevel(pet);
        addPetMemory(pet, result.choice.title, result.choice.message);
        saveProfiles();
        renderPetSpace(profile);
        setPetAction(result.choice.id === "play" ? "play" : "encourage", "陪伴");
        UI.notify(result.choice.message);
        return;
      }
      const bellBtn = event.target.closest("[data-pet-bell-slot]");
      if (bellBtn) {
        const profile = activeProfile();
        const pet = petState(profile);
        const result = PetExperience.playBellGame?.(pet, bellBtn.dataset.petBellSlot, todayKey());
        if (!result?.played) {
          UI.notify("今天已经玩过找铃铛了。", { tone: "warn" });
          return;
        }
        applyPetLevel(pet);
        addPetMemory(pet, "找铃铛", result.found ? `在第 ${result.winningSlot} 个垫子下找到了铃铛。` : "虽然没有猜中，也一起开心地玩了一会儿。");
        saveProfiles();
        renderPetSpace(profile);
        setPetAction(result.found ? "play" : "encourage", result.found ? `+${result.rewardCoins}` : "有奖励");
        UI.notify(result.found ? `找到铃铛，金币 +${result.rewardCoins}` : `没有猜中，也获得金币 +${result.rewardCoins}`);
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
    els.petDressupModal?.addEventListener("keydown", (event) => {
      if (event.target.closest("button") || (event.key !== "Enter" && event.key !== " ")) return;
      const card = event.target.closest("[data-pet-preview]");
      if (!card) return;
      event.preventDefault();
      handlePetPanelAction(event);
    });
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
      if (event.key === "Escape" && (!els.learningModal?.hidden || !els.subjectModal?.hidden || !els.systemModal?.hidden)) closeHubModals();
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
    els.startWeakReportBtn.addEventListener("click", startWeeklyReviewPractice);
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
        els.importText.value = await buildArchiveText();
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
    els.sourceFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => renderQuestionSourceAudit(btn.dataset.sourceFilter || "all"));
    });
    [els.questionBankSubjectFilter, els.questionBankGradeFilter].forEach((select) => {
      select?.addEventListener("change", () => {
        syncQuestionBankPointFilter();
        renderQuestionSourceAudit(questionBankAuditFilterFromUI());
      });
    });
    els.questionBankPointFilter?.addEventListener("change", () => renderQuestionSourceAudit(questionBankAuditFilterFromUI()));
    els.exportBankExcelBtn?.addEventListener("click", () => {
      const Excel = window.MathCampQuestionBankExcel;
      if (!Excel) {
        if (els.exportBankExcelStatus) els.exportBankExcelStatus.textContent = "导出模块未加载。";
        return;
      }
      const ui = questionBankAuditFilterFromUI();
      // 把题源筛选（reference/original）映射到题库分类
      const bankMap = { reference: "参考", original: "原创" };
      const filter = {
        bank: bankMap[ui.source] || "all",
        subject: ui.subject || "all",
        grade: ui.grade || "all"
      };
      try {
        const count = Excel.exportToXlsx(filter);
        if (els.exportBankExcelStatus) {
          els.exportBankExcelStatus.textContent = count
            ? `已导出 ${count} 道题。`
            : "当前筛选没有可导出的题目。";
        }
      } catch (error) {
        if (els.exportBankExcelStatus) els.exportBankExcelStatus.textContent = `导出失败：${error?.message || error}`;
      }
    });
    els.customBankChooseBtn?.addEventListener("click", () => els.customBankFileInput?.click());
    els.customBankFileInput?.addEventListener("change", () => {
      const file = els.customBankFileInput.files?.[0];
      state.customBankImportPreview = null;
      renderCustomBankImportPreview(null);
      if (els.customBankFileName) els.customBankFileName.textContent = file ? file.name : "未选择任何文件";
      if (file && els.customBankNameInput && !els.customBankNameInput.value.trim()) {
        els.customBankNameInput.value = String(file.name || "").replace(/\.(xlsx|csv)$/i, "");
      }
    });
    els.previewCustomBankBtn?.addEventListener("click", prepareCustomBankImportFromUI);
    els.importCustomBankBtn?.addEventListener("click", importCustomBankFromUI);
    els.customBankImageBtn?.addEventListener("click", () => els.customBankImageInput?.click());
    els.customBankImageInput?.addEventListener("change", () => {
      const files = [...(els.customBankImageInput.files || [])];
      if (els.customBankImageName) {
        els.customBankImageName.textContent = files.length ? `已选 ${files.length} 张图片` : "未选择图片";
      }
    });
    els.customBankList?.addEventListener("click", async (event) => {
      const CustomBank = window.MathCampCustomBank;
      if (!CustomBank) return;
      const viewBtn = event.target.closest("[data-custom-bank-view]");
      if (viewBtn) {
        state.selectedBankId = viewBtn.dataset.customBankView;
        renderCustomBankList();
        return;
      }
      const practiceBtn = event.target.closest("[data-custom-bank-practice]");
      if (practiceBtn) {
        startCustomBankPractice(practiceBtn.dataset.customBankPractice);
        return;
      }
      const publishBtn = event.target.closest("[data-custom-bank-publish]");
      if (publishBtn) {
        publishCustomBankFromUI(publishBtn.dataset.customBankPublish);
        return;
      }
      const disableBtn = event.target.closest("[data-custom-bank-disable]");
      if (disableBtn) {
        setCustomBankWorkflowStatus(disableBtn.dataset.customBankDisable, "disabled");
        return;
      }
      const reviewBtn = event.target.closest("[data-custom-bank-review]");
      if (reviewBtn) {
        setCustomBankWorkflowStatus(reviewBtn.dataset.customBankReview, "review");
        return;
      }
      const renameBtn = event.target.closest("[data-custom-bank-rename]");
      if (renameBtn) {
        const id = renameBtn.dataset.customBankRename;
        const bank = CustomBank.getBank(id);
        const name = await UI.prompt("请输入新的批次名称：", bank?.name || "", { title: "重命名题库", maxLength: 40 });
        if (name && name.trim()) {
          CustomBank.renameBank(id, name.trim());
          renderCustomBankList();
        }
        return;
      }
      const deleteBtn = event.target.closest("[data-custom-bank-delete]");
      if (deleteBtn) {
        const id = deleteBtn.dataset.customBankDelete;
        const bank = CustomBank.getBank(id);
        const confirmed = await UI.confirm(`确定删除「${bank?.name || "该题库"}」吗？此操作不可撤销。`, {
          title: "删除校内题库",
          confirmText: "删除",
          danger: true
        });
        if (confirmed) {
          CustomBank.deleteBank(id);
          renderCustomBankList();
          if (els.customBankImportStatus) els.customBankImportStatus.textContent = "已删除该题库。";
        }
      }
    });
    [els.bankBulkGradeSelect, els.bankBulkSubjectSelect].forEach((select) => select?.addEventListener("change", syncBankBulkPointOptions));
    els.publishCustomBankBtn?.addEventListener("click", () => publishCustomBankFromUI());
    els.disableCustomBankBtn?.addEventListener("click", () => setCustomBankWorkflowStatus(state.selectedBankId, "disabled"));
    els.reviewCustomBankBtn?.addEventListener("click", () => setCustomBankWorkflowStatus(state.selectedBankId, "review"));
    els.auditCustomBankBtn?.addEventListener("click", () => {
      if (!state.selectedBankId) return;
      renderBankDetail(state.selectedBankId);
      UI.notify("题库质量审查已刷新。", { tone: "good" });
    });
    els.bankSelectAllQuestions?.addEventListener("change", () => {
      els.bankDetailBody?.querySelectorAll("[data-bank-q-select]").forEach((input) => { input.checked = els.bankSelectAllQuestions.checked; });
    });
    els.bankDetailBody?.addEventListener("change", (event) => {
      const input = event.target.closest("[data-bank-q-enabled]");
      if (!input || !state.selectedBankId) return;
      if (window.MathCampCustomBank?.setQuestionEnabled?.(state.selectedBankId, input.dataset.bankQEnabled, input.checked)) {
        renderCustomBankList();
      }
    });
    els.applyBankBulkEditBtn?.addEventListener("click", () => {
      const CustomBank = window.MathCampCustomBank;
      const ids = [...(els.bankDetailBody?.querySelectorAll("[data-bank-q-select]:checked") || [])].map((input) => input.dataset.bankQSelect);
      if (!ids.length) {
        UI.notify("请先选择需要批量修改的题目。", { tone: "bad" });
        return;
      }
      const pointValue = els.bankBulkPointSelect?.value || "";
      const patch = {};
      if (els.bankBulkGradeSelect?.value) patch.grade = Number(els.bankBulkGradeSelect.value);
      if (els.bankBulkSubjectSelect?.value) patch.subject = els.bankBulkSubjectSelect.value;
      if (els.bankBulkTermSelect?.value) patch.term = els.bankBulkTermSelect.value;
      if (pointValue) patch.pointId = pointValue === "__clear__" ? "" : pointValue;
      if (els.bankBulkDifficultySelect?.value) patch.difficultyScore = Number(els.bankBulkDifficultySelect.value);
      if (!Object.keys(patch).length) {
        UI.notify("请选择至少一个要修改的字段。", { tone: "bad" });
        return;
      }
      const changed = CustomBank?.batchUpdateQuestions?.(state.selectedBankId, ids, patch) || 0;
      renderCustomBankList();
      UI.notify(`已批量修改 ${changed} 题，并退回待审核。`, { tone: "good" });
    });
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
    var testSupabaseConfigBtnEl = document.getElementById("testSupabaseConfigBtn");
    var syncNowBtnEl = document.getElementById("syncNowBtn");
    if (supabaseUrlEl && window.MathCampCloudSync) {
      window.MathCampCloudSync.onSyncStatus(updateCloudSyncStatus);
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
    function readSupabaseConfigFromInputs() {
      var url = supabaseUrlEl?.value?.trim();
      var anonKey = supabaseAnonKeyEl?.value?.trim();
      if (!url || !anonKey) {
        return { error: "请填写 Supabase URL 和 Anon Key。" };
      }
      if (!url.startsWith("http")) url = "https://" + url;
      if (!url.endsWith(".supabase.co")) {
        return { error: "URL 格式应为 https://xxxxx.supabase.co" };
      }
      return { config: { url: url, anonKey: anonKey } };
    }
    saveSupabaseConfigBtnEl?.addEventListener("click", async () => {
      var syncCode = syncCodeInputEl?.value?.trim() || "";
      var cfgResult = readSupabaseConfigFromInputs();
      if (cfgResult.error) {
        UI.notify(cfgResult.error, { tone: "bad" });
        return;
      }
      var config = cfgResult.config;
      window.MathCampCloudSync.saveConfig(config);
      window.MathCampCloudSync.setSyncCode(syncCode);
      saveSystemSettingsSnapshot();
      var ok = await window.MathCampCloudSync.initSupabase(config);
      if (ok) {
        UI.notify("云端同步已启用。");
        var result = await window.MathCampCloudSync.fullSync(state.profiles, state.activeId, collectSystemSettings());
        renderCloudSyncSummary(result);
        if (result.settingsChanged && result.systemSettings) {
          applySystemSettings(result.systemSettings, { touch: false, sync: false });
        }
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
    testSupabaseConfigBtnEl?.addEventListener("click", async () => {
      if (!window.MathCampCloudSync?.testConnection) {
        UI.notify("当前版本不支持连接测试。", { tone: "bad" });
        return;
      }
      var cfgResult = readSupabaseConfigFromInputs();
      if (cfgResult.error) {
        UI.notify(cfgResult.error, { tone: "bad" });
        return;
      }
      updateCloudSyncStatus("loading-sdk");
      var result = await window.MathCampCloudSync.testConnection(cfgResult.config);
      updateCloudSyncStatus(result.ok ? "ready" : "error");
      var detailEl = document.getElementById("cloudSyncDetail");
      if (detailEl) {
        detailEl.hidden = false;
        detailEl.textContent = `连接测试：${result.message}`;
      }
      UI.notify(result.message, { tone: result.ok ? "good" : "bad", duration: 4200 });
    });
    syncNowBtnEl?.addEventListener("click", async () => {
      if (!window.MathCampCloudSync?.isSyncEnabled()) {
        UI.notify("请先保存 Supabase 配置。", { tone: "bad" });
        return;
      }
      UI.notify("正在同步…");
      var result = await window.MathCampCloudSync.fullSync(state.profiles, state.activeId, collectSystemSettings());
      renderCloudSyncSummary(result);
      if (result.settingsChanged && result.systemSettings) {
        applySystemSettings(result.systemSettings, { touch: false, sync: false });
      }
      if (!result.changed && result.settingsChanged) {
        UI.notify("系统设置已同步。");
        return;
      }
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

    window.MathCampSystemSettings = {
      collect: collectSystemSettings,
      apply: applySystemSettings,
      markUpdated: () => saveSystemSettingsSnapshot()
    };

    applyTheme(state.theme, { save: false });
    applySubjectTheme();
    document.body.classList.toggle("practice-view-active", state.view === "practice");
    syncCompactOnlyFeatures();
    updateSoundButtons();
    renderNumberPad();
    syncFromProfile();
    startNewSet({ autoFocus: false });
    initFloatingPetAssistant();
    if (!isAndroidWebView()) generatePrintSheet();
    initCloudSync();
    syncQuestionBankPointFilter();
    renderQuestionSourceAudit("all");
    if (window.MathCampCustomBank) {
      window.MathCampCustomBank.mergeIntoExternalSeeds();
      renderCustomBankList();
    }
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
      syncFloatingPetVisibility();
    });
    window.mathCampSelfTest = runQuestionRuleSelfTest;
    window.mathCampQualityAudit = runQuestionQualityAudit;
    window.mathCampQuestionSourceAudit = runQuestionSourceAudit;
    if (window.__MATHCAMP_TEST__) {
      window.mathCampDebug = {
        normalizeProfile,
        challengeProgress,
        dailyPlanPrintQuestions,
        generatePrintSheet,
        buildArchiveData,
        parseImportBackup,
        collectSystemSettings,
        applySystemSettings,
        renderCloudSyncSummary,
        saveSystemSettingsSnapshot,
        normalizeSystemSettings,
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
        causeOptionsForSubject,
        causeOptionsForQuestion,
        recommendCauseForQuestion,
        petCoachForCause,
        buildParentDiagnosis,
        renderParentDiagnosis,
        renderCauseQuickTags,
        shouldShowFloatingPetAssistant,
        floatingPetCareAlert,
        normalizeFloatingPetPosition,
        floatingPetActionMessage,
        applyFloatingPetPosition,
        openFloatingPetPanel,
        currentWeekItems,
        learningInsights: LearningInsights,
        questionBankCoverage: QuestionBankCoverage,
        buildQuestionBankCoverage: () => QuestionBankCoverage.buildCoverageReport?.(window.MathCampQuestionBank),
        buildWeakPointInsights: (profile, options = {}) => LearningInsights.buildWeakPointInsights?.({ points, pointMap }, profile || activeProfile(), { pointMap, ...options }),
        activeProfile,
        renderChrome,
        renderPetSpace,
        renderWrongbook,
        saveProfiles,
        selectSubject,
        activeSubjectId,
        activeBank,
        activeLearning,
        makeQuestion,
        makeStrictQuestionForPoint,
        externalQuestionChanceForPoint,
        externalQuestionCountForPoint,
        localQuestionTemplateCountForPoint,
        questionSpecBucket,
        createRoundQuestionPicker,
        buildQuestionSetForPoint,
        buildAdaptiveQuestionSet,
        buildSmartDailyQuestionSet,
        buildWeeklyReviewQuestionSet,
        startNewSet,
        renderPracticeQuestion,
        answerPlaceholderForQuestion,
        answerGuidanceForQuestion,
        hintForLevel,
        setSelectedConfidence,
        enrichQuestionLearningMeta,
        learningQuality: LearningQuality,
        startSmartDailyPractice,
        startWeeklyReviewPractice,
        startChallengeSet,
        challengeDifficultyForLevel,
        recordReviewSourceAttempt,
        nextReviewDueDate,
        reviewStageOffsets: REVIEW_STAGE_OFFSETS.slice(),
        buildParentWeeklyPrompt,
        roundPetSummary,
        hasAudioPrompt,
        speakQuestionPrompt,
        renderQuestionTitle,
        applyQuestionInteraction,
        answerMatches,
        questionRuleIssues,
        questionQualityWarnings,
        interactionRuleIssues,
        runQuestionQualityAudit,
        runQuestionSourceAudit,
        renderQuestionSourceAudit,
        roundQuestionSourceSummary,
        renderQuestionDiagram,
        normalizeQuestionSourceImage,
        parseNumericAnswer,
        todayKey,
        availablePoints,
        pointMap,
        bankPointMap,
        curriculumBandFor,
        curriculumBrief,
        curriculumHelperText,
        curriculumSelectLabel,
        curriculumSelectShortLabel,
        knowledgeDetailTitle,
        curriculumPointRank,
        pointOptionsHTML,
        knowledgeProfileFor,
        state,
        els
      };
    }
