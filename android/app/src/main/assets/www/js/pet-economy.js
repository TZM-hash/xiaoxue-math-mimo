(function () {
  const SHOP = [
    { id: "basicFood", name: "普通猫粮", tier: "basic", price: 24, icon: "🍚", desc: "饥饿值 +25。两天完整照料通常需要准备一份猫粮。", effects: { hunger: 25 } },
    { id: "towel", name: "小毛巾", tier: "basic", price: 18, icon: "🧺", desc: "清洁值 +20。和猫粮、毛线球搭配，约等于两天基础消耗。", effects: { clean: 20 } },
    { id: "premiumFood", name: "高级猫粮", tier: "advanced", price: 58, icon: "🥫", desc: "饥饿值 +60。适合几天没有照料后一次补回来。", effects: { hunger: 60 } },
    { id: "bath", name: "泡泡澡", tier: "advanced", price: 54, icon: "🛁", desc: "清洁值 +55，心情 +5。适合清洁值很低时使用。", effects: { clean: 55, mood: 5 } },
    { id: "yarnBall", name: "毛线球", tier: "advanced", price: 42, icon: "🧶", desc: "心情 +25，亲密 +3。30 题目标完成后仍能慢慢攒出来的基础玩具。", effects: { mood: 25, bond: 3 } },
    { id: "teaser", name: "逗猫棒", tier: "rare", price: 88, icon: "🎣", desc: "心情 +40，亲密 +8。需要连续几天坚持练习才适合常买。", effects: { mood: 40, bond: 8 } },
    { id: "fishToy", name: "小鱼玩具", tier: "rare", price: 136, icon: "🐟", desc: "心情 +65，亲密 +15。高价值玩具，用来消耗攒下来的金币。", effects: { mood: 65, bond: 15 } },
    { id: "renameCard", name: "改名卡", tier: "rare", price: 120, icon: "🏷️", desc: "修改宠物名字一次。", rename: true }
  ];

  const DAILY_TASKS = [
    { id: "daily-10", title: "答对 10 题", target: 10, reward: 8, bond: 1, progressKey: "todayCorrect" },
    { id: "daily-20", title: "答对 20 题", target: 20, reward: 12, bond: 2, progressKey: "todayCorrect" },
    { id: "daily-30", title: "答对 30 题", target: 30, reward: 12, bond: 2, progressKey: "todayCorrect" },
    { id: "daily-wrong-3", title: "复习 3 道错题", target: 3, reward: 12, bond: 3, progressKey: "todayWrongReview" },
    { id: "daily-due-3", title: "复习 3 道到期错题", target: 3, reward: 14, bond: 3, progressKey: "todayDueReview" },
    { id: "daily-quiz-1", title: "完成 1 次限时小测", target: 1, reward: 10, bond: 2, progressKey: "todayTimedQuiz" }
  ];

  const WEEKLY_TASKS = [
    { id: "weekly-days-5", title: "连续练习 5 天", target: 5, reward: 42, bond: 5, progressKey: "learningDays" },
    { id: "weekly-wrong-10", title: "本周复习 10 道错题", target: 10, reward: 36, bond: 4, progressKey: "weekWrongReview" },
    { id: "weekly-due-8", title: "本周复习 8 道到期错题", target: 8, reward: 44, bond: 5, progressKey: "weekDueReview" },
    { id: "weekly-master-3", title: "清空 3 道错题", target: 3, reward: 42, bond: 6, progressKey: "weekMasteredWrong" },
    { id: "weekly-points-4", title: "练过 4 个知识点", target: 4, reward: 30, bond: 3, progressKey: "weekPointCount" },
    { id: "weekly-accuracy-80", title: "本周正确率 80%", target: 80, reward: 34, bond: 4, progressKey: "weekAccuracy" },
    { id: "weekly-challenge-2", title: "通过 2 个小关卡", target: 2, reward: 38, bond: 5, progressKey: "weekChallengePass" }
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
    { level: 2, title: "安心提示", coins: 24, unlock: "亲密技能：安心提示", skillId: "calmHint", decoration: "nameTag" },
    { level: 3, title: "小窝地毯", coins: 18, itemId: "towel", itemCount: 1, unlock: "随机事件", decoration: "rug" },
    { level: 4, title: "成长日记", coins: 20, itemId: "basicFood", itemCount: 1, unlock: "成长日记", decoration: "diary" },
    { level: 5, title: "故事第一章", coins: 30, unlock: "招财故事", storyId: "chapter-1", decoration: "storyShelf" },
    { level: 6, title: "学霸招财", coins: 34, itemId: "yarnBall", itemCount: 1, unlock: "亲密技能：连对鼓励", skillId: "streakSpark", decoration: "studyLamp" },
    { level: 7, title: "心愿扩展", coins: 24, itemId: "yarnBall", itemCount: 1, unlock: "更多心愿", decoration: "toyBasket" },
    { level: 8, title: "小窝窗帘", coins: 28, itemId: "premiumFood", itemCount: 1, unlock: "稀有随机事件", decoration: "curtain" },
    { level: 9, title: "错题伙伴", coins: 32, itemId: "bath", itemCount: 1, unlock: "亲密技能：错题陪练", skillId: "wrongbookBuddy", decoration: "medal" },
    { level: 10, title: "守护招财", coins: 44, itemId: "teaser", itemCount: 1, unlock: "守护薄弱点练习", skillId: "guardianFocus", storyId: "chapter-2", decoration: "guardianBadge", roomTheme: "forest" },
    { level: 12, title: "装扮馆扩建", coins: 50, unlock: "高级小窝家具", furniture: "bookDesk", outfit: "scholarCap" },
    { level: 15, title: "星光小窝", coins: 60, itemId: "bath", itemCount: 1, unlock: "星空主题", roomTheme: "star", furniture: "starLamp" },
    { level: 20, title: "糖果庆典", coins: 72, itemId: "teaser", itemCount: 1, unlock: "糖果主题和节日装扮", roomTheme: "candy", outfit: "festivalCape" },
    { level: 30, title: "成长大师", coins: 110, itemId: "fishToy", itemCount: 1, unlock: "大师称号、海底主题和皇冠装扮", roomTheme: "ocean", outfit: "littleCrown", furniture: "royalBed" }
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

  const ROOM_THEMES = [
    // props: 房间内的氛围装饰物(emoji 图层,数据驱动),渲染进 pet-room-scene 增强主题氛围
    { id: "sunny", title: "阳光小窝", icon: "☀️", minLevel: 1, price: 0, props: ["☀️", "🌻", "🪴"], desc: "默认小窝，明亮温暖。" },
    { id: "forest", title: "森林小屋", icon: "🌿", minLevel: 5, price: 110, props: ["🌲", "🍄", "🐿️"], desc: "适合稳定练习后的清新主题。" },
    { id: "star", title: "星空房间", icon: "🌌", minLevel: 10, price: 170, props: ["⭐", "🌙", "✨"], desc: "夜空、星灯和安静的学习角。" },
    { id: "candy", title: "糖果乐园", icon: "🍬", minLevel: 15, price: 220, props: ["🍭", "🧁", "🍩"], desc: "色彩更活泼，适合长期收集。" },
    { id: "ocean", title: "海底小窝", icon: "🐚", minLevel: 20, price: 270, props: ["🐠", "🫧", "🐚"], desc: "高级主题，通过高等级或成就获得更划算。" },
    // —— 2026 主题扩充（配套 CSS 见 pet-space.css [data-room-theme]）——
    { id: "sakura", title: "樱花庭院", icon: "🌸", minLevel: 8, price: 150, props: ["🌸", "🍡", "⛩️"], desc: "春日粉樱，柔和治愈的小院子。" },
    { id: "aurora", title: "极光雪屋", icon: "❄️", minLevel: 16, price: 240, props: ["🌌", "❄️", "🛷"], desc: "冬夜极光，安静又梦幻。" },
    { id: "sunset", title: "黄昏暖阳", icon: "🌇", minLevel: 12, price: 200, props: ["🌇", "🕯️", "🦉"], desc: "傍晚橙红色调，温暖惬意。" }
  ];

  const FURNITURE = [
    { id: "rug", title: "条纹地毯", icon: "▣", minLevel: 2, price: 52, desc: "让小窝地面更柔软。" },
    { id: "curtain", title: "小窗帘", icon: "▥", minLevel: 4, price: 68, desc: "给窗边加一点仪式感。" },
    { id: "studyLamp", title: "学习灯", icon: "💡", minLevel: 6, price: 82, desc: "陪练时的小灯亮起来。" },
    { id: "bookDesk", title: "小书桌", icon: "📚", minLevel: 8, price: 105, desc: "剧情和学习主题的小家具。" },
    { id: "starLamp", title: "星星灯", icon: "⭐", minLevel: 12, price: 128, desc: "星空主题的闪亮家具。" },
    { id: "toyBasket", title: "玩具篮", icon: "🧶", minLevel: 7, price: 90, desc: "把玩具收纳起来，也能提高收集进度。" },
    { id: "royalBed", title: "软绵绵小床", icon: "🛏️", minLevel: 18, price: 180, desc: "高级小床，适合作为长期目标。" },
    { id: "guardianBadge", title: "守护徽章", icon: "🛡️", minLevel: 10, price: 0, desc: "完成成长奖励或剧情获得。" }
  ];

  const OUTFITS = [
    // layer: 装扮在猫身上的图层位置(head=头顶/neck=颈部/back=背部);accent: 主题色(数据驱动,替代 CSS 硬编码几何图形)
    { id: "redScarf", title: "红围巾", icon: "🧣", layer: "neck", accent: "#e05c5c", minLevel: 2, price: 60, desc: "第一件基础装扮。" },
    { id: "scholarCap", title: "学士帽", icon: "🎓", layer: "head", accent: "#4a5568", minLevel: 6, price: 98, desc: "适合认真复习错题的小伙伴。" },
    { id: "starCape", title: "星星披风", icon: "✨", layer: "back", accent: "#7aa2e8", minLevel: 10, price: 140, desc: "星空主题的可见奖励。" },
    { id: "festivalCape", title: "节日斗篷", icon: "🎀", layer: "back", accent: "#ef7d8f", minLevel: 15, price: 180, desc: "长期坚持后的节日装扮。" },
    { id: "littleCrown", title: "小皇冠", icon: "👑", layer: "head", accent: "#f2c14e", minLevel: 25, price: 260, desc: "高等级和成就系统里的稀有装扮。" },
    // —— 2026 装扮扩充：季节 / 节日套系（emoji 装扮，佩戴后显示在猫头顶）——
    { id: "springHat", title: "春日花环", icon: "🌸", layer: "head", accent: "#f2a7c3", minLevel: 3, price: 66, desc: "春季套系：戴上花环迎接春天。" },
    { id: "summerGlasses", title: "夏日墨镜", icon: "🕶️", layer: "head", accent: "#3a3f4a", minLevel: 5, price: 78, desc: "夏季套系：清凉一夏的小酷猫。" },
    { id: "autumnMaple", title: "秋叶徽章", icon: "🍁", layer: "neck", accent: "#d97b3f", minLevel: 7, price: 96, desc: "秋季套系：把落叶别在身上。" },
    { id: "winterHat", title: "冬日毛线帽", icon: "🧢", layer: "head", accent: "#5b8fd9", minLevel: 9, price: 108, desc: "冬季套系：暖暖的毛线帽。" },
    { id: "birthdayHat", title: "生日帽", icon: "🥳", layer: "head", accent: "#b48ae8", minLevel: 4, price: 88, desc: "节日套系：一起庆祝小小里程碑。" },
    { id: "graduationGown", title: "毕业礼袍", icon: "🎊", layer: "back", accent: "#3f4a63", minLevel: 20, price: 200, desc: "节日套系：陪你一路坚持到毕业季。" }
  ];

  const ACHIEVEMENTS = [
    { id: "answer-50", title: "认真开局", desc: "累计完成 50 道题。", target: 50, progressKey: "answerCount", coins: 26 },
    { id: "answer-100", title: "百题里程碑", desc: "累计完成 100 道题。", target: 100, progressKey: "answerCount", coins: 44, furniture: "bookDesk" },
    { id: "answer-300", title: "三百题远航", desc: "累计完成 300 道题。", target: 300, progressKey: "answerCount", coins: 90, roomTheme: "ocean" },
    { id: "streak-3", title: "连续三天", desc: "连续学习 3 天。", target: 3, progressKey: "learningDays", coins: 24, outfit: "redScarf" },
    { id: "streak-7", title: "一周陪伴", desc: "连续学习 7 天。", target: 7, progressKey: "learningDays", coins: 58, roomTheme: "forest" },
    { id: "accuracy-90-day", title: "今日很稳", desc: "今天至少做 10 题且正确率达到 90%。", target: 90, progressKey: "todayAccuracy", coins: 28 },
    { id: "care-3", title: "照料入门", desc: "完成 3 天今日照料。", target: 3, progressKey: "careDays", coins: 28, furniture: "toyBasket" },
    { id: "care-7", title: "温柔饲养员", desc: "完成 7 天今日照料。", target: 7, progressKey: "careDays", coins: 64, furniture: "royalBed" },
    { id: "wish-5", title: "心愿小管家", desc: "完成 5 个今日心愿。", target: 5, progressKey: "wishes", coins: 46, outfit: "starCape" },
    { id: "event-5", title: "事件解决者", desc: "完成 5 次随机事件。", target: 5, progressKey: "events", coins: 54, furniture: "starLamp" },
    { id: "story-3", title: "故事收藏家", desc: "领取 3 个剧情奖励。", target: 3, progressKey: "stories", coins: 72, outfit: "festivalCape" },
    { id: "level-10", title: "十级伙伴", desc: "宠物达到 Lv.10。", target: 10, progressKey: "petLevel", coins: 60, roomTheme: "star" },
    { id: "furniture-5", title: "小窝设计师", desc: "拥有 5 件家具。", target: 5, progressKey: "furnitureCount", coins: 58 },
    { id: "outfit-3", title: "造型收藏家", desc: "拥有 3 件宠物装扮。", target: 3, progressKey: "outfitCount", coins: 56 },
    { id: "theme-3", title: "主题探索家", desc: "拥有 3 个小窝主题。", target: 3, progressKey: "themeCount", coins: 76, outfit: "littleCrown" }
  ];

  const RANDOM_EVENTS = [
    { id: "sunny-nap", title: "阳光午睡", desc: "今天小窝阳光很好，完成 3 题帮招财铺好垫子。", target: 3, rewardCoins: 8, mood: 4, bond: 1, minLevel: 1 },
    { id: "lost-bell", title: "铃铛不见了", desc: "招财的铃铛滚到题目堆里了，答对 5 题一起找回来。", target: 5, rewardCoins: 12, mood: 3, bond: 2, minLevel: 2 },
    { id: "messy-room", title: "小窝整理", desc: "小窝有点乱，完成 5 题或用小毛巾都能帮上忙。", target: 5, rewardCoins: 10, clean: 6, bond: 1, itemId: "towel", minLevel: 3 },
    { id: "mystery-box", title: "神秘盒子", desc: "招财发现一个小盒子，连续做一组题就能打开。", target: 8, rewardCoins: 16, mood: 5, bond: 2, minLevel: 5 },
    { id: "rare-map", title: "数学森林地图", desc: "地图上亮起一条路，完成 10 题获得故事线索。", target: 10, rewardCoins: 22, mood: 6, bond: 3, minLevel: 8, rare: true },
    { id: "dressup-invite", title: "试穿邀请", desc: "招财想试试新装扮，完成 6 题获得一点装扮灵感。", target: 6, rewardCoins: 14, mood: 6, bond: 2, minLevel: 6 },
    { id: "furniture-spark", title: "小窝灵感", desc: "小窝角落亮了一下，完成 8 题获得家具收集奖励。", target: 8, rewardCoins: 20, clean: 4, bond: 2, minLevel: 10, rare: true },
    { id: "theme-ticket", title: "主题票根", desc: "完成 12 题，招财会把今天的坚持贴进主题图鉴。", target: 12, rewardCoins: 28, mood: 8, bond: 4, minLevel: 15, rare: true }
  ];

  const STORY_CHAPTERS = [
    { id: "chapter-1", title: "招财第一次整理小窝", minLevel: 5, target: 12, desc: "完成 12 题，帮招财把新小窝布置好。", rewardCoins: 26, rewardBond: 4, decoration: "storyShelf" },
    { id: "chapter-2", title: "数学森林的守护徽章", minLevel: 10, target: 20, desc: "完成 20 题，陪招财找到守护薄弱点的徽章。", rewardCoins: 42, rewardBond: 6, decoration: "guardianBadge" },
    { id: "chapter-3", title: "星空书桌的约定", minLevel: 15, target: 24, desc: "完成 24 题，把星星灯点亮，记录一次认真学习的夜晚。", rewardCoins: 52, rewardBond: 8, decoration: "starLamp", outfit: "starCape" },
    { id: "chapter-4", title: "糖果乐园的邀请函", minLevel: 20, target: 28, desc: "完成 28 题，帮招财准备一次小窝庆典。", rewardCoins: 66, rewardBond: 9, roomTheme: "candy", outfit: "festivalCape" },
    { id: "chapter-5", title: "海底小窝远航", minLevel: 30, target: 36, desc: "完成 36 题，解锁长期坚持后的高级收藏。", rewardCoins: 98, rewardBond: 12, roomTheme: "ocean", decoration: "royalBed", outfit: "littleCrown" }
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
    ROOM_THEMES,
    FURNITURE,
    OUTFITS,
    ACHIEVEMENTS,
    RANDOM_EVENTS,
    STORY_CHAPTERS
  };
})();
