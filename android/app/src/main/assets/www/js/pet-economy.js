(function () {
  const SHOP = [
    { id: "basicFood", name: "普通猫粮", tier: "basic", price: 19, icon: "🍚", desc: "饥饿值 +25。每天基础照料用品，和小毛巾搭配约等于一天消耗。", effects: { hunger: 25 } },
    { id: "towel", name: "小毛巾", tier: "basic", price: 12, icon: "🧺", desc: "清洁值 +20。答对 20 题加基础任务奖励，刚好约可覆盖两天基础用量。", effects: { clean: 20 } },
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

  const WISHES = [
    { id: "wish-food", itemId: "basicFood", title: "想吃普通猫粮", need: "hunger", threshold: 55, practiceTarget: 5, bonusMood: 3, bonusBond: 1 },
    { id: "wish-clean", itemId: "towel", title: "想用小毛巾擦一擦", need: "clean", threshold: 55, practiceTarget: 5, bonusMood: 2, bonusBond: 1 },
    { id: "wish-play", itemId: "yarnBall", title: "想玩毛线球", need: "mood", threshold: 60, practiceTarget: 8, bonusMood: 4, bonusBond: 2 },
    { id: "wish-teaser", itemId: "teaser", title: "想和你玩逗猫棒", need: "bond", threshold: 68, minLevel: 3, practiceTarget: 10, bonusMood: 5, bonusBond: 3 }
  ];

  const SKILLS = [
    { id: "calmHint", title: "安心提示", minLevel: 2, minBond: 45, desc: "提示按钮会优先提醒读题步骤，适合卡住时稳一下。" },
    { id: "wrongbookBuddy", title: "错题陪练", minLevel: 4, minBond: 55, desc: "复习错题答对时额外亲密 +1，帮助把薄弱点养成亲密值。" },
    { id: "streakSpark", title: "连对鼓励", minLevel: 6, minBond: 70, desc: "连对 5 题时会额外给 1 枚金币，让坚持更有手感。" },
    { id: "guardianFocus", title: "守护专注", minLevel: 10, minBond: 85, desc: "进入薄弱点练习时，会优先选择最近错过的知识点。" }
  ];

  const LEVEL_REWARDS = [
    { level: 2, title: "安心提示", coins: 20, unlock: "亲密技能：安心提示", skillId: "calmHint", decoration: "nameTag" },
    { level: 3, title: "小窝地毯", coins: 12, itemId: "towel", itemCount: 1, unlock: "随机事件", decoration: "rug" },
    { level: 4, title: "成长日记", coins: 16, itemId: "basicFood", itemCount: 1, unlock: "成长日记", decoration: "diary" },
    { level: 5, title: "故事第一章", coins: 24, unlock: "招财故事", storyId: "chapter-1", decoration: "storyShelf" },
    { level: 6, title: "学霸招财", coins: 28, itemId: "yarnBall", itemCount: 1, unlock: "亲密技能：连对鼓励", skillId: "streakSpark", decoration: "studyLamp" },
    { level: 7, title: "心愿扩展", coins: 18, itemId: "yarnBall", itemCount: 1, unlock: "更多心愿", decoration: "toyBasket" },
    { level: 8, title: "小窝窗帘", coins: 22, itemId: "premiumFood", itemCount: 1, unlock: "稀有随机事件", decoration: "curtain" },
    { level: 9, title: "错题伙伴", coins: 26, itemId: "bath", itemCount: 1, unlock: "亲密技能：错题陪练", skillId: "wrongbookBuddy", decoration: "medal" },
    { level: 10, title: "守护招财", coins: 36, itemId: "teaser", itemCount: 1, unlock: "守护薄弱点练习", skillId: "guardianFocus", storyId: "chapter-2", decoration: "guardianBadge" }
  ];

  const DECORATIONS = [
    { id: "nameTag", title: "名字贴", icon: "🏷️", desc: "招财把名字贴在小窝门口。" },
    { id: "rug", title: "小地毯", icon: "▤", desc: "小窝地面变得软软的。" },
    { id: "diary", title: "成长日记", icon: "📔", desc: "记录每天照顾招财的回忆。" },
    { id: "storyShelf", title: "故事书架", icon: "📚", desc: "招财故事会放在这里。" },
    { id: "studyLamp", title: "学习灯", icon: "💡", desc: "陪练时的小灯亮起来。" },
    { id: "toyBasket", title: "玩具篮", icon: "🧺", desc: "心愿玩具有地方收纳了。" },
    { id: "curtain", title: "小窗帘", icon: "▥", desc: "小窝窗边更温暖。" },
    { id: "medal", title: "错题奖章", icon: "🏅", desc: "纪念认真复习错题。" },
    { id: "guardianBadge", title: "守护徽章", icon: "🛡️", desc: "长期坚持后的守护标记。" }
  ];

  const RANDOM_EVENTS = [
    { id: "sunny-nap", title: "阳光午睡", desc: "今天小窝阳光很好，完成 3 题帮招财铺好垫子。", target: 3, rewardCoins: 6, mood: 4, bond: 1, minLevel: 1 },
    { id: "lost-bell", title: "铃铛不见了", desc: "招财的铃铛滚到题目堆里了，答对 5 题一起找回来。", target: 5, rewardCoins: 10, mood: 3, bond: 2, minLevel: 2 },
    { id: "messy-room", title: "小窝整理", desc: "小窝有点乱，完成 5 题或用小毛巾都能帮上忙。", target: 5, rewardCoins: 8, clean: 6, bond: 1, itemId: "towel", minLevel: 3 },
    { id: "mystery-box", title: "神秘盒子", desc: "招财发现一个小盒子，连续做一组题就能打开。", target: 8, rewardCoins: 14, mood: 5, bond: 2, minLevel: 5 },
    { id: "rare-map", title: "数学森林地图", desc: "地图上亮起一条路，完成 10 题获得故事线索。", target: 10, rewardCoins: 18, mood: 6, bond: 3, minLevel: 8, rare: true }
  ];

  const STORY_CHAPTERS = [
    { id: "chapter-1", title: "招财第一次整理小窝", minLevel: 5, target: 12, desc: "完成 12 题，帮招财把新小窝布置好。", rewardCoins: 20, rewardBond: 4, decoration: "storyShelf" },
    { id: "chapter-2", title: "数学森林的守护徽章", minLevel: 10, target: 20, desc: "完成 20 题，陪招财找到守护薄弱点的徽章。", rewardCoins: 34, rewardBond: 6, decoration: "guardianBadge" }
  ];

  window.MathCampPetEconomy = {
    SHOP,
    DAILY_TASKS,
    WEEKLY_TASKS,
    CARE_LIMITS,
    STAGES,
    WISHES,
    SKILLS,
    LEVEL_REWARDS,
    DECORATIONS,
    RANDOM_EVENTS,
    STORY_CHAPTERS
  };
})();
