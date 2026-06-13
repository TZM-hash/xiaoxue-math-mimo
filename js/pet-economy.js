(function () {
  const SHOP = [
    { id: "basicFood", name: "普通猫粮", tier: "basic", price: 18, icon: "🍚", desc: "饥饿值 +25。每天基础照料用品，和小毛巾搭配约等于一天消耗。", effects: { hunger: 25 } },
    { id: "towel", name: "小毛巾", tier: "basic", price: 14, icon: "🧺", desc: "清洁值 +20。答对 20 题加基础任务奖励，约可覆盖两天基础用量。", effects: { clean: 20 } },
    { id: "premiumFood", name: "高级猫粮", tier: "advanced", price: 48, icon: "🥫", desc: "饥饿值 +60。适合几天没有照料后一次补回来。", effects: { hunger: 60 } },
    { id: "bath", name: "泡泡澡", tier: "advanced", price: 44, icon: "🛁", desc: "清洁值 +55，心情 +5。适合清洁值很低时使用。", effects: { clean: 55, mood: 5 } },
    { id: "yarnBall", name: "毛线球", tier: "advanced", price: 40, icon: "🧶", desc: "心情 +25，亲密 +3。便宜玩具，适合多完成一组练习后奖励一下。", effects: { mood: 25, bond: 3 } },
    { id: "teaser", name: "逗猫棒", tier: "rare", price: 72, icon: "🎣", desc: "心情 +40，亲密 +8。需要连续几天坚持练习才适合常买。", effects: { mood: 40, bond: 8 } },
    { id: "fishToy", name: "小鱼玩具", tier: "rare", price: 120, icon: "🐟", desc: "心情 +65，亲密 +15。高价值玩具，用来消耗攒下来的金币。", effects: { mood: 65, bond: 15 } },
    { id: "renameCard", name: "改名卡", tier: "rare", price: 100, icon: "🏷️", desc: "修改宠物名字一次。", rename: true }
  ];

  const DAILY_TASKS = [
    { id: "daily-10", title: "答对 10 题", target: 10, reward: 8, bond: 1, progressKey: "todayCorrect" },
    { id: "daily-20", title: "答对 20 题", target: 20, reward: 14, bond: 2, progressKey: "todayCorrect" },
    { id: "daily-wrong-3", title: "复习 3 道错题", target: 3, reward: 12, bond: 3, progressKey: "todayWrongReview" },
    { id: "daily-quiz-1", title: "完成 1 次限时小测", target: 1, reward: 10, bond: 2, progressKey: "todayTimedQuiz" }
  ];

  const WEEKLY_TASKS = [
    { id: "weekly-days-5", title: "连续练习 5 天", target: 5, reward: 32, bond: 5, progressKey: "learningDays" },
    { id: "weekly-wrong-10", title: "本周复习 10 道错题", target: 10, reward: 28, bond: 4, progressKey: "weekWrongReview" },
    { id: "weekly-master-3", title: "清空 3 道错题", target: 3, reward: 34, bond: 6, progressKey: "weekMasteredWrong" },
    { id: "weekly-points-4", title: "练过 4 个知识点", target: 4, reward: 22, bond: 3, progressKey: "weekPointCount" },
    { id: "weekly-accuracy-80", title: "本周正确率 80%", target: 80, reward: 26, bond: 4, progressKey: "weekAccuracy" },
    { id: "weekly-challenge-2", title: "通过 2 个小关卡", target: 2, reward: 30, bond: 5, progressKey: "weekChallengePass" }
  ];

  const CARE_LIMITS = {
    encourage: { daily: 5, mood: 2, bond: 1, xp: 2 },
    feed: { daily: 4 },
    clean: { daily: 4 },
    play: { daily: 3 }
  };

  const STAGES = [
    { id: "kitten", name: "幼年招财", minLevel: 1, copy: "刚开始陪练，喜欢短一点的小练习。" },
    { id: "active", name: "活力招财", minLevel: 3, copy: "已经习惯每天陪你练，会在错题后提醒复盘。" },
    { id: "study", name: "学霸招财", minLevel: 6, copy: "能陪你冲关卡和限时小测，适合挑战更难题。" },
    { id: "guardian", name: "守护招财", minLevel: 10, copy: "长期坚持后的伙伴，会优先守住薄弱点和错题。" }
  ];

  window.MathCampPetEconomy = { SHOP, DAILY_TASKS, WEEKLY_TASKS, CARE_LIMITS, STAGES };
})();
