(function () {
  "use strict";

  const STARTER_ITEMS = { basicFood: 1, towel: 1, yarnBall: 1 };
  const DAILY_CHOICES = [
    { id: "walk", icon: "🌿", title: "窗边散步", message: "一起在窗边走了走，心情更轻松。", effects: { mood: 6, bond: 2 } },
    { id: "play", icon: "🧶", title: "玩毛线球", message: "追着毛线球跑了几圈，今天很有精神。", effects: { mood: 8, bond: 1 } },
    { id: "rest", icon: "🌙", title: "安静休息", message: "在小窝里安静休息了一会儿，状态稳定下来。", effects: { clean: 3, mood: 4 } }
  ];

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, number(value)));
  }

  function normalizeExperience(pet, today = "") {
    pet.experience = pet.experience && typeof pet.experience === "object" ? pet.experience : {};
    pet.experience.starterClaimed = Boolean(pet.experience.starterClaimed || pet.starterClaimed);
    pet.experience.freeCareDate = String(pet.experience.freeCareDate || "");
    pet.experience.dailyChoiceDate = String(pet.experience.dailyChoiceDate || "");
    pet.experience.dailyChoiceId = String(pet.experience.dailyChoiceId || "");
    pet.experience.bellGameDate = String(pet.experience.bellGameDate || "");
    pet.experience.bellGameSlot = Math.max(0, Math.floor(number(pet.experience.bellGameSlot)));
    pet.experience.bellFound = Boolean(pet.experience.bellFound);
    pet.experience.careSequence = Math.max(0, Math.floor(number(pet.experience.careSequence)));
    if (today && pet.experience.dailyChoiceDate !== today) pet.experience.dailyChoiceId = "";
    if (today && pet.experience.bellGameDate !== today) {
      pet.experience.bellGameSlot = 0;
      pet.experience.bellFound = false;
    }
    return pet.experience;
  }

  function ensureStarterKit(pet) {
    if (!pet || pet.starterClaimed || pet.experience?.starterClaimed) return false;
    pet.inventory = pet.inventory && typeof pet.inventory === "object" ? pet.inventory : {};
    Object.entries(STARTER_ITEMS).forEach(([id, count]) => {
      pet.inventory[id] = Math.max(0, Math.floor(number(pet.inventory[id]))) + count;
    });
    pet.coins = Math.max(0, Math.floor(number(pet.coins))) + 12;
    pet.starterClaimed = true;
    normalizeExperience(pet).starterClaimed = true;
    return true;
  }

  function applyDailyFreeCare(pet, today) {
    const experience = normalizeExperience(pet, today);
    if (!today || experience.freeCareDate === today) return { applied: false, stat: "", value: 0 };
    const stats = ["hunger", "clean", "mood"];
    const stat = stats.sort((a, b) => number(pet[a], 70) - number(pet[b], 70))[0];
    const before = clamp(pet[stat], 0, 100);
    pet[stat] = clamp(before + 15, 0, 100);
    pet.bond = clamp(number(pet.bond, 40) + 1, 0, 100);
    pet.xp = Math.max(0, number(pet.xp)) + 3;
    experience.freeCareDate = today;
    return { applied: true, stat, value: pet[stat] - before };
  }

  function careReaction(kind, petName = "招财", sequence = 0) {
    const lines = {
      encourage: [
        `${petName}轻轻蹭了蹭你的手。`,
        `${petName}眯起眼睛，发出小小的呼噜声。`,
        `${petName}抬起爪子和你碰了一下。`
      ],
      feed: [`${petName}认真吃完了猫粮。`, `${petName}吃饱后满足地舔了舔爪子。`, `${petName}把饭碗吃得干干净净。`],
      clean: [`${petName}变得干净又蓬松。`, `${petName}舒服地甩了甩尾巴。`, `${petName}现在闻起来清清爽爽。`],
      play: [`${petName}追着玩具跑了起来。`, `${petName}扑住玩具后得意地看着你。`, `${petName}玩累后在原地趴了一会儿。`]
    };
    const options = lines[kind] || lines.encourage;
    return options[Math.abs(Math.floor(number(sequence))) % options.length];
  }

  function shopProgress(coins, price) {
    const safePrice = Math.max(1, Math.floor(number(price, 1)));
    const safeCoins = Math.max(0, Math.floor(number(coins)));
    const gap = Math.max(0, safePrice - safeCoins);
    return {
      gap,
      pct: Math.min(100, Math.round(safeCoins / safePrice * 100)),
      practiceSets: gap ? Math.max(1, Math.ceil(gap / 10)) : 0
    };
  }

  function dailyChoices() {
    return DAILY_CHOICES.map((choice) => ({ ...choice, effects: { ...choice.effects } }));
  }

  function applyEffects(pet, effects = {}) {
    Object.entries(effects).forEach(([key, value]) => {
      pet[key] = clamp(number(pet[key], key === "bond" ? 40 : 70) + number(value), 0, 100);
    });
  }

  function applyDailyChoice(pet, choiceId, today) {
    const experience = normalizeExperience(pet, today);
    const choice = DAILY_CHOICES.find((item) => item.id === choiceId);
    if (!choice || !today || experience.dailyChoiceDate === today) return { applied: false, choice: null };
    applyEffects(pet, choice.effects);
    pet.xp = Math.max(0, number(pet.xp)) + 2;
    experience.dailyChoiceDate = today;
    experience.dailyChoiceId = choice.id;
    return { applied: true, choice };
  }

  function bellWinningSlot(today) {
    const sum = [...String(today || "")].reduce((total, char) => total + char.charCodeAt(0), 0);
    return sum % 3 + 1;
  }

  function playBellGame(pet, slot, today) {
    const experience = normalizeExperience(pet, today);
    if (!today || experience.bellGameDate === today) {
      return { played: false, found: experience.bellFound, winningSlot: bellWinningSlot(today) };
    }
    const selected = Math.max(1, Math.min(3, Math.floor(number(slot, 1))));
    const winningSlot = bellWinningSlot(today);
    const found = selected === winningSlot;
    experience.bellGameDate = today;
    experience.bellGameSlot = selected;
    experience.bellFound = found;
    pet.mood = clamp(number(pet.mood, 70) + (found ? 6 : 3), 0, 100);
    pet.bond = clamp(number(pet.bond, 40) + (found ? 2 : 1), 0, 100);
    pet.coins = Math.max(0, Math.floor(number(pet.coins))) + (found ? 8 : 3);
    pet.xp = Math.max(0, number(pet.xp)) + (found ? 4 : 2);
    return { played: true, found, winningSlot, rewardCoins: found ? 8 : 3 };
  }

  function contextMessage(profile = {}, pet = {}, subjectLabels = {}) {
    const history = Array.isArray(profile.history) ? profile.history : [];
    const latest = history.slice().sort((a, b) => number(b.time) - number(a.time))[0];
    const subject = String(latest?.subject || profile.subject || "math");
    const subjectMeta = subjectLabels[subject];
    const label = (typeof subjectMeta === "string" ? subjectMeta : subjectMeta?.label) || { math: "数学", chinese: "语文", english: "英语", science: "科学" }[subject] || "学习";
    const correct = history.slice(-5).filter((item) => item.correct).length;
    if (!history.length) return `今天可以先完成一小组${label}练习，${pet.name || "招财"}会陪你慢慢开始。`;
    if (correct >= 4) return `最近的${label}练习很稳定，${pet.name || "招财"}记得你连续做对了不少题。`;
    if (history.slice(-5).some((item) => !item.correct)) return `${pet.name || "招财"}记得最近的${label}练习里还有需要巩固的地方，可以先复习一道错题。`;
    return `${pet.name || "招财"}记得你最近在练${label}，今天也会继续陪着你。`;
  }

  window.MathCampPetExperience = {
    STARTER_ITEMS,
    normalizeExperience,
    ensureStarterKit,
    applyDailyFreeCare,
    careReaction,
    shopProgress,
    dailyChoices,
    applyDailyChoice,
    bellWinningSlot,
    playBellGame,
    contextMessage
  };
})();
