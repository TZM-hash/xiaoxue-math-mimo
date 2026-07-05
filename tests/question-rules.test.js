const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

class FakeElement {
  constructor(id = "", tagName = "div") {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      toggle: (name, force) => {
        const enabled = force === undefined ? !this.classes.has(name) : Boolean(force);
        if (enabled) this.classes.add(name);
        else this.classes.delete(name);
        return enabled;
      },
      contains: (name) => this.classes.has(name)
    };
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.value = "";
    this.textContent = "";
    this.innerHTML = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
  }
  addEventListener(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
    return child;
  }
  remove() {}
  click() {
    (this.listeners.click || []).forEach((listener) => listener({ target: this, preventDefault() {} }));
  }
  focus() {}
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name]; }
  toggleAttribute(name, force) {
    if (force === false) delete this.attributes[name];
    else this.attributes[name] = "";
  }
  removeAttribute(name) { delete this.attributes[name]; }
  querySelector(selector) {
    if (selector === 'option[value="step"]') return new FakeElement("", "option");
    if (selector === ".print-fit-warning") return null;
    return new FakeElement("", "div");
  }
  querySelectorAll() { return []; }
  closest() { return null; }
  insertAdjacentHTML(_position, html) {
    this.innerHTML += html;
  }
}
function makeDocument(ids) {
  const elements = new Map(ids.map((id) => [id, new FakeElement(id)]));
  const documentElement = new FakeElement("documentElement", "html");
  documentElement.dataset = { theme: "classic" };
  const body = new FakeElement("body", "body");
  const document = {
    documentElement,
    body,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new FakeElement(id));
      return elements.get(id);
    },
    querySelector(selector) {
      if (selector === "meta[name='theme-color']") return new FakeElement("", "meta");
      return new FakeElement("", "div");
    },
    querySelectorAll(selector) {
      if (selector === ".tab-btn") {
        return ["practice", "wrongbook", "report", "print", "tasks", "petspace", "data"].map((view) => {
          const el = new FakeElement("", "button");
          el.dataset.view = view;
          return el;
        });
      }
      if (selector.includes("musicToggle")) return [this.getElementById("musicToggle")];
      if (selector.includes("soundToggle")) return [this.getElementById("soundToggle")];
      if (selector.includes("themeSelect")) return [this.getElementById("themeSelect")];
      return [];
    },
    createElement(tagName) {
      return new FakeElement("", tagName);
    },
    addEventListener() {}
  };
  return document;
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const document = makeDocument(ids);
const storage = new Map();

const context = {
  console,
  document,
  navigator: { clipboard: { writeText: async () => {} }, userAgent: "" },
  SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) {
    this.text = text;
    this.lang = "";
    this.rate = 1;
    this.pitch = 1;
  },
  speechSynthesis: {
    spoken: [],
    cancel() {},
    speak(utterance) { this.spoken.push({ text: utterance.text, lang: utterance.lang, rate: utterance.rate, pitch: utterance.pitch }); },
    getVoices: () => []
  },
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => { storage.set(key, String(value)); },
    removeItem: (key) => { storage.delete(key); }
  },
  location: { pathname: "/index.html", href: "http://localhost/index.html" },
  Blob: function Blob(parts, options) { this.parts = parts; this.options = options; },
  URL: {
    createObjectURL: () => "blob:mock",
    revokeObjectURL() {}
  },
  setTimeout: (fn) => {
    if (typeof fn === "function") fn();
    return 1;
  },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  addEventListener() {},
  removeEventListener() {},
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  print() {}
};
context.window = context;
context.globalThis = context;
context.__MATHCAMP_TEST__ = true;

vm.createContext(context);
[
  "js/storage.js",
  "js/runtime-config.js",
  "js/print-layout.js",
  "js/ui-feedback.js",
  "js/question-bank.js",
  "js/chinese-curriculum-data.js",
  "js/chinese-question-bank.js",
  "js/english-curriculum-data.js",
  "js/english-question-bank.js",
  "js/subject-registry.js",
  "js/question-bank-coverage.js",
  "js/learning-insights.js",
  "js/pet-economy.js",
  "js/chinese-question-generator.js",
  "js/english-question-generator.js",
  "js/question-generator.js",
  "js/handwriting-input.js",
  "js/practice-engine.js",
  "js/report.js",
  "js/pet.js",
  "js/import-export.js",
  "js/home-route.js",
  "js/pet-dressup-meta.js",
  "js/cloud-sync.js",
  "js/app.js"
].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

if (typeof context.mathCampSelfTest !== "function") {
  throw new Error("mathCampSelfTest was not exposed");
}
if (!context.mathCampDebug) {
  throw new Error("mathCampDebug was not exposed");
}

function runDataBoundaryTests() {
  const debug = context.mathCampDebug;
  const maliciousId = 'bad" autofocus onfocus="alert(1)';
  const backup = {
    version: 4,
    activeId: maliciousId,
    profiles: [
      "not-a-profile",
      {
        id: maliciousId,
        name: "<b>坏档案</b>",
        grade: 2,
        wrongbook: [
          {
            id: 'wrong" data-delete-wrong="x',
            question: { id: 'q" x="1', grade: 2, pointId: "g2-100-add", topic: "addsub", text: "46 + 7 = ?", answer: 53 },
            cause: "粗心计算错"
          },
          { id: "broken", question: null }
        ],
        history: [{ grade: 9, pointId: 'bad" id', text: "<script>", correct: false }]
      },
      {
        id: maliciousId,
        name: "重复 ID",
        grade: 3,
        wrongbook: [],
        history: []
      }
    ]
  };

  debug.els.importText.value = JSON.stringify(backup);
  const parsed = debug.parseImportBackup();
  assert.strictEqual(parsed.profiles.length, 2, "导入应丢弃非对象档案");
  assert.notStrictEqual(parsed.profiles[0].id, maliciousId, "恶意学生 id 应重生成");
  assert.notStrictEqual(parsed.profiles[1].id, maliciousId, "重复/恶意学生 id 应重生成");
  assert.notStrictEqual(parsed.profiles[0].id, parsed.profiles[1].id, "导入后学生 id 应唯一");
  assert.strictEqual(parsed.profiles[0].wrongbook.length, 1, "异常错题应被丢弃");
  assert(!parsed.profiles[0].wrongbook[0].id.includes('"'), "错题 id 不应保留属性注入字符");
  assert(parsed.repairNotes.some((note) => note.includes("丢弃 1 个无效学生档案")), "导入预览应报告丢弃的无效档案");

  debug.state.profiles = [{ ...parsed.profiles[0], id: maliciousId }];
  debug.state.activeId = maliciousId;
  debug.renderChrome();
  assert(!debug.els.profileSelect.innerHTML.includes('value="bad" autofocus'), "学生下拉不应注入额外属性");
  assert(debug.els.profileSelect.innerHTML.includes("&quot;"), "学生下拉应转义属性引号");

  const originalSetItem = context.localStorage.setItem;
  context.localStorage.setItem = () => { throw new Error("quota exceeded"); };
  assert.strictEqual(debug.saveProfiles(), false, "保存失败时 saveProfiles 应返回 false");
  assert.strictEqual(debug.els.saveStatus.classList.contains("bad"), true, "保存失败时状态栏应标记异常");
  context.localStorage.setItem = originalSetItem;
  assert.strictEqual(debug.saveProfiles(), true, "恢复存储后 saveProfiles 应返回 true");
  assert.strictEqual(debug.els.saveStatus.classList.contains("bad"), false, "恢复保存后状态栏应移除异常标记");
}

function runUpgradeFeatureTests() {
  const debug = context.mathCampDebug;
  const legacy = debug.normalizeProfile({
    id: "student-upgrade",
    name: "Upgrade",
    grade: 3,
    settings: { printTemplate: "daily-plan" },
    wrongbook: [],
    history: [
      { date: "2026-06-08", time: 1, grade: 3, pointId: "g3-muldiv", correct: false, cause: "乘法口诀不熟", text: "6 × 7 = ?" },
      { date: "2026-06-08", time: 2, grade: 3, pointId: "g3-word-two-step", correct: false, cause: "不会列式", text: "两步应用题" },
      { date: "2026-06-08", time: 3, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "18 + 6 × 2 = ?" }
    ],
    rewards: {}
  });
  assert(legacy.rewards.challenge, "旧档案应补齐闯关奖励状态");
  assert.strictEqual(legacy.settings.printTemplate, "daily-plan", "今日推荐卷模板应保留");
  const progress = debug.challengeProgress(legacy, 3);
  assert.strictEqual(progress.level, 1, "新闯关进度从第 1 关开始");
  assert.strictEqual(progress.passed, 0, "新闯关进度应没有通关记录");

  const pet = legacy.rewards.pet;
  assert.strictEqual(pet.name, "招财", "新宠物默认名应为招财");
  assert.strictEqual(pet.coins, 0, "新宠物初始金币应为 0");
  assert.strictEqual(pet.inventory.renameCard, 0, "改名卡背包数量应初始化");
  assert.strictEqual(pet.mood, 70, "宠物心情初始值应为 70");
  assert.strictEqual(pet.hunger, 70, "宠物饥饿初始值应为 70");
  assert.strictEqual(pet.clean, 70, "宠物清洁初始值应为 70");
  assert.strictEqual(pet.bond, 40, "宠物亲密初始值应为 40");
  assert(pet.tasks && pet.tasks.daily && pet.tasks.weekly, "新宠物应包含任务领取桶");
  assert(pet.wish && pet.wish.date === debug.todayKey(), "新宠物应生成今日心愿");
  assert(pet.event && pet.event.date === debug.todayKey(), "新宠物应生成今日随机事件");
  assert(pet.memories && Array.isArray(pet.memories.log), "新宠物应包含成长日记");
  assert.strictEqual(debug.petDailyTasks.length, 6, "每日宠物任务应包含到期错题复习任务");
  assert(!debug.petDailyTasks.some((task) => task.id === "daily-special-5"), "每日任务不应包含专项练习");
  assert(debug.petDailyTasks.some((task) => task.id === "daily-30"), "每日任务应包含 30 题目标");
  assert(debug.petDailyTasks.some((task) => task.id === "daily-due-3"), "每日任务应包含到期错题复习");
  assert(debug.petDailyTasks.some((task) => task.id === "daily-quiz-1"), "每日任务应包含限时小测");
  assert.strictEqual(debug.petWeeklyTasks.length, 7, "每周宠物任务应包含到期错题复习任务");
  assert(debug.petWeeklyTasks.some((task) => task.id === "weekly-challenge-2"), "每周任务应包含闯关通关目标");
  assert(debug.petWeeklyTasks.some((task) => task.id === "weekly-due-8"), "每周任务应包含到期错题复习");

  debug.state.profiles = [legacy];
  debug.state.activeId = legacy.id;
  debug.state.grade = 3;
  debug.state.pointId = "auto";
  debug.state.adaptive = true;
  const questions = debug.dailyPlanPrintQuestions(legacy, 3, "auto", 12);
  assert.strictEqual(questions.length, 12, "今日推荐卷应生成请求数量");
  assert(questions.every((question) => question.grade === 3), "今日推荐卷应保持所选年级");
  assert(questions.some((question) => question.printPlanTag), "今日推荐卷应标记题目来源");

  const taskDate = debug.todayKey();
  legacy.history.unshift(
    { date: taskDate, time: 4, grade: 3, pointId: "g3-muldiv", correct: true, cause: "不会做", text: "8 × 7 = ?", mode: "wrongbook" },
    { date: taskDate, time: 5, grade: 3, pointId: "g3-muldiv", correct: true, cause: "不会做", text: "9 × 6 = ?", mode: "wrongbook" },
    { date: taskDate, time: 6, grade: 3, pointId: "g3-muldiv", correct: true, cause: "不会做", text: "42 ÷ 6 = ?", mode: "wrongbook" },
    { date: taskDate, time: 7, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "限时", mode: "timed" }
  );
  const wrongReviewTask = debug.petTaskState(legacy, debug.petDailyTasks.find((task) => task.id === "daily-wrong-3"), "daily");
  const timedTask = debug.petTaskState(legacy, debug.petDailyTasks.find((task) => task.id === "daily-quiz-1"), "daily");
  assert.strictEqual(wrongReviewTask.complete, true, "错题本练习应计入每日错题复习任务");
  legacy.history.unshift(
    { date: taskDate, time: 8, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 9, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 10, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 11, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 12, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 13, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 14, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" },
    { date: taskDate, time: 15, grade: 3, pointId: "g3-mixed", correct: true, cause: "不会做", text: "到期复习", mode: "due-review" }
  );
  const dueReviewTask = debug.petTaskState(legacy, debug.petDailyTasks.find((task) => task.id === "daily-due-3"), "daily");
  const weeklyDueReviewTask = debug.petTaskState(legacy, debug.petWeeklyTasks.find((task) => task.id === "weekly-due-8"), "weekly");
  assert.strictEqual(dueReviewTask.complete, true, "到期错题复习应计入专属任务");
  assert.strictEqual(weeklyDueReviewTask.complete, true, "到期错题复习应计入每周专属任务");
  assert.strictEqual(timedTask.complete, true, "限时小测应计入每日限时任务");
}

function runPetRewardClaimTests() {
  const debug = context.mathCampDebug;
  const taskProfile = debug.normalizeProfile({ id: "claim-task", name: "Claim", grade: 2 });
  const today = debug.todayKey();
  taskProfile.history = Array.from({ length: 30 }, (_, index) => ({
    date: today,
    time: index + 1,
    grade: 2,
    pointId: "g2-100-add",
    correct: true,
    cause: "",
    text: `${index} + 1 = ?`
  }));
  debug.state.profiles = [taskProfile];
  debug.state.activeId = taskProfile.id;
  const daily20 = debug.petDailyTasks.find((task) => task.id === "daily-20");
  const daily30 = debug.petDailyTasks.find((task) => task.id === "daily-30");
  assert.strictEqual(debug.petTaskState(taskProfile, daily20, "daily").complete, true, "20 题任务应可领取");
  assert.strictEqual(debug.petTaskState(taskProfile, daily30, "daily").complete, true, "30 题任务应可领取");
  debug.claimPetTask("daily", "daily-20");
  debug.claimPetTask("daily", "daily-30");
  const coinsAfterTask = debug.petState(taskProfile).coins;
  assert.strictEqual(debug.petTaskState(taskProfile, daily20, "daily").claimed, true, "领取后任务应立即变成已完成");
  assert.strictEqual(debug.petTaskState(taskProfile, daily30, "daily").claimed, true, "30 题任务领取后应立即变成已完成");
  const reopenedTaskProfile = debug.normalizeProfile(JSON.parse(JSON.stringify(taskProfile)));
  debug.state.profiles = [reopenedTaskProfile];
  debug.state.activeId = reopenedTaskProfile.id;
  assert.strictEqual(debug.petTaskState(reopenedTaskProfile, daily20, "daily").claimed, true, "刷新后每日任务不应恢复领取按钮");
  assert.strictEqual(debug.petTaskState(reopenedTaskProfile, daily30, "daily").claimed, true, "刷新后 30 题每日任务不应恢复领取按钮");
  debug.claimPetTask("daily", "daily-20");
  assert.strictEqual(debug.petState(reopenedTaskProfile).coins, coinsAfterTask, "重复打开任务页不应再次发放每日任务金币");

  const giftProfile = debug.normalizeProfile({ id: "claim-gift", name: "Gift", grade: 2 });
  debug.state.profiles = [giftProfile];
  debug.state.activeId = giftProfile.id;
  const giftPet = debug.petState(giftProfile);
  giftPet.xp = 160;
  debug.petState(giftProfile);
  debug.claimPetLevelReward(2);
  const coinsAfterGift = debug.petState(giftProfile).coins;
  assert(debug.petState(giftProfile).rewardsClaimed[2], "成长礼物领取状态应写入存档");
  debug.claimPetLevelReward(2);
  assert.strictEqual(debug.petState(giftProfile).coins, coinsAfterGift, "成长礼物不应重复领取");
  const reopenedGiftProfile = debug.normalizeProfile(JSON.parse(JSON.stringify(giftProfile)));
  assert(reopenedGiftProfile.rewards.pet.rewardsClaimed[2], "刷新后成长礼物领取状态应保留");

  const storyProfile = debug.normalizeProfile({ id: "claim-story", name: "Story", grade: 2 });
  debug.state.profiles = [storyProfile];
  debug.state.activeId = storyProfile.id;
  debug.petState(storyProfile).xp = 640;
  const storyPet = debug.petState(storyProfile);
  storyPet.story["chapter-1"] = { progress: 12, complete: true, claimed: false };
  debug.claimPetStoryReward("chapter-1");
  const coinsAfterStory = debug.petState(storyProfile).coins;
  assert.strictEqual(debug.petState(storyProfile).story["chapter-1"].claimed, true, "剧情奖励领取状态应写入存档");
  debug.claimPetStoryReward("chapter-1");
  assert.strictEqual(debug.petState(storyProfile).coins, coinsAfterStory, "剧情奖励不应重复领取");

  const eventProfile = debug.normalizeProfile({ id: "claim-event", name: "Event", grade: 2 });
  const eventPet = debug.petState(eventProfile);
  const event = debug.currentPetEvent(eventPet);
  assert(event, "随机事件应存在");
  assert.strictEqual(debug.resolvePetEvent(eventPet, event), true, "首次解决随机事件应成功");
  const coinsAfterEvent = eventPet.coins;
  assert.strictEqual(debug.resolvePetEvent(eventPet, event), false, "已完成随机事件不应再次解决");
  assert.strictEqual(eventPet.coins, coinsAfterEvent, "随机事件不应重复发放金币");

  const achievementProfile = debug.normalizeProfile({ id: "claim-achievement", name: "Achieve", grade: 2 });
  achievementProfile.history = Array.from({ length: 50 }, (_, index) => ({
    date: debug.todayKey(),
    time: Date.now() + index,
    pointId: "g2-100-add",
    grade: 2,
    correct: true,
    cause: "未标记",
    mode: "practice",
    text: "1 + 1 = ?"
  }));
  debug.state.profiles = [achievementProfile];
  debug.state.activeId = achievementProfile.id;
  const achievementPet = debug.petState(achievementProfile);
  assert(achievementPet.unlockedThemes.sunny, "旧存档应自动补齐默认小窝主题");
  assert(achievementPet.achievements && achievementPet.achievements.claimed, "旧存档应自动补齐成就领取桶");
  const firstAchievement = debug.petAchievements.find((item) => item.id === "answer-50");
  assert(debug.petAchievementState(achievementProfile, firstAchievement).complete, "50 题成就应可领取");
  debug.claimPetAchievement("answer-50");
  const coinsAfterAchievement = debug.petState(achievementProfile).coins;
  assert.strictEqual(debug.petState(achievementProfile).achievements.claimed["answer-50"], true, "成就领取状态应写入存档");
  debug.claimPetAchievement("answer-50");
  assert.strictEqual(debug.petState(achievementProfile).coins, coinsAfterAchievement, "成就不应重复领取金币");
}

function runPetEconomyTests() {
  const debug = context.mathCampDebug;
  const shopById = Object.fromEntries(debug.petShopCatalog.map((item) => [item.id, item]));
  const dailyById = Object.fromEntries(debug.petDailyTasks.map((task) => [task.id, task]));
  const tiers = new Set(debug.petShopCatalog.map((item) => item.tier));
  const twoDaysCompleteCare = shopById.basicFood.price + shopById.towel.price + shopById.yarnBall.price;
  const expectedDaily30Income = 30 * 2 + dailyById["daily-10"].reward + dailyById["daily-20"].reward + dailyById["daily-30"].reward;
  const expectedRoundBonus = Math.min(10, Math.ceil(30 / 2));
  const wrongReviewBoost = dailyById["daily-wrong-3"].reward;

  assert(tiers.has("basic") && tiers.has("advanced") && tiers.has("rare"), "宠物商店应按基础、进阶、长期目标分层");
  assert.strictEqual(twoDaysCompleteCare, 84, "两天完整基础照料成本应为 84 金币");
  assert.strictEqual(expectedDaily30Income, 92, "30 题全对加基础每日任务约为 92 金币");
  assert(expectedDaily30Income > twoDaysCompleteCare, "30 题基础收益应覆盖两天完整基础照料");
  assert.strictEqual(expectedDaily30Income - twoDaysCompleteCare, 8, "30 题基础收益应留下少量结余");
  assert.strictEqual(expectedDaily30Income + expectedRoundBonus - twoDaysCompleteCare, 18, "完成整轮后应有可攒装扮的结余");
  assert.strictEqual(expectedDaily30Income + wrongReviewBoost - twoDaysCompleteCare, 20, "复习错题后应有明确结余");
  assert.strictEqual(shopById.renameCard.price, 120, "改名卡价格应稳定为 120 金币");
  assert(shopById.fishToy.price > expectedDaily30Income, "高级玩具不应一天基础练习就轻易买到");

  const rewardProfile = debug.normalizeProfile({ id: "reward-test", name: "Reward", grade: 2 });
  debug.state.profiles = [rewardProfile];
  debug.state.activeId = rewardProfile.id;
  debug.state.roundCoins = 0;
  assert.strictEqual(debug.awardQuestionReward(false, {}), 0, "答错题目不应奖励金币");
  assert.strictEqual(debug.petState(rewardProfile).coins, 0, "答错后宠物金币不应增加");
  assert.strictEqual(debug.awardQuestionReward(true, {}), 2, "答对普通题应奖励 2 金币");
  assert.strictEqual(debug.petState(rewardProfile).coins, 2, "答对后宠物金币应增加");

  const pet = debug.petState(debug.normalizeProfile({ id: "pet-care", name: "Care", grade: 2 }));
  assert.strictEqual(pet.level, 1, "New pet initial level should be 1");
  assert.strictEqual(pet.xp, 0, "New pet initial XP should be 0");
  assert.strictEqual(debug.petCareLeft(pet, "encourage"), 5, "每日摸摸应有收益次数上限");
  for (let index = 0; index < 5; index += 1) assert.strictEqual(debug.consumePetCare(pet, "encourage"), true, "上限内摸摸应获得收益");
  assert.strictEqual(debug.consumePetCare(pet, "encourage"), false, "超过上限后摸摸不应继续刷收益");
  assert.strictEqual(debug.petGrowthStage({ level: 1 }).name, "幼年招财", "1 级应是幼年阶段");
  assert.strictEqual(debug.petGrowthStage({ level: 6 }).name, "学霸招财", "6 级应解锁学霸阶段");
  assert(debug.petWishes.length >= 4, "宠物应有多种每日心愿");
  assert(debug.petRandomEvents.length >= 5, "宠物应有随机事件池");
  assert(debug.petStoryChapters.length >= 2, "宠物应有剧情章节");
  assert(debug.petLevelRewards.some((reward) => reward.level === 10), "等级奖励应覆盖守护招财阶段");
  assert.strictEqual(debug.petCopy("招财陪练", { rewards: { pet: { name: "小橘" } } }), "小橘陪练", "改名卡后默认宠物名文案应全局替换");

  const growthProfile = debug.normalizeProfile({ id: "pet-growth", name: "Growth", grade: 2 });
  debug.state.profiles = [growthProfile];
  debug.state.activeId = growthProfile.id;
  const growthPet = debug.petState(growthProfile);
  const wish = debug.currentPetWish(growthPet);
  const event = debug.currentPetEvent(growthPet);
  debug.advancePetProgressFromQuestion(growthProfile, true);
  const advancedPet = debug.petState(growthProfile);
  assert.strictEqual(advancedPet.wish.progress, wish ? 1 : 0, "答对题目应推进今日心愿");
  assert.strictEqual(advancedPet.event.progress, event ? 1 : 0, "答对题目应推进随机事件");
  advancedPet.xp = 160;
  const leveledPet = debug.petState(growthProfile);
  assert(debug.pendingPetLevelRewards(leveledPet).some((reward) => reward.level === 2), "升级后应出现待领取成长礼物");
  const archive = debug.buildArchiveData();
  const archivedPet = archive.profiles.find((profile) => profile.id === growthProfile.id).rewards.pet;
  assert(archivedPet.wish && archivedPet.event && archivedPet.story && archivedPet.memories && archivedPet.decorations, "完整存档应包含宠物新增养成字段");
  const merged = context.MathCampCloudSync.mergeProfiles(
    [{ ...growthProfile, updatedAt: 1000, rewards: { ...growthProfile.rewards, pet: { ...archivedPet, coins: 1 } } }],
    [{ device_id: "cloud", profiles: [{ ...growthProfile, updatedAt: 2000, rewards: { ...growthProfile.rewards, pet: { ...archivedPet, coins: 9 } } }] }]
  );
  assert.strictEqual(debug.petState(merged[0]).coins, 9, "云同步应按档案更新时间合并纯宠物数据变更");
  assert.strictEqual(debug.safeThemeId("star"), "star", "星空主题应注册");
  assert.strictEqual(debug.safeThemeId("forest"), "forest", "森林主题应注册");
  assert.strictEqual(debug.safeThemeId("candy"), "candy", "糖果主题应注册");
  assert.strictEqual(debug.safeThemeId("rainbow"), "rainbow", "彩虹主题应注册");
  assert.strictEqual(debug.safeThemeId("ocean"), "ocean", "海洋主题应注册");
  assert.strictEqual(debug.safeThemeId("storybook"), "storybook", "童话书主题应注册");
  assert.strictEqual(debug.safeThemeId("playground"), "playground", "游乐场主题应注册");
  assert(debug.themeRegistry.star && debug.themeRegistry.forest && debug.themeRegistry.candy && debug.themeRegistry.rainbow, "新增主题应存在于主题注册表");
  assert.strictEqual(debug.systemThemeOwned("classic", growthProfile), true, "经典主题应初始解锁");
  assert.strictEqual(debug.systemThemeOwned("eye-care", growthProfile), true, "护眼主题应初始解锁");
  assert.strictEqual(debug.systemThemeOwned("anime", growthProfile), true, "二次元主题应初始解锁");
  assert.strictEqual(debug.systemThemeOwned("purple", growthProfile), false, "紫色主题开局应锁定");
  assert.strictEqual(debug.systemThemeOwned("rainbow", growthProfile), false, "儿童新增主题开局应锁定");
  debug.grantSystemTheme(debug.petState(growthProfile), "rainbow");
  assert.strictEqual(debug.systemThemeOwned("rainbow", growthProfile), true, "主题商店购买后应记录拥有状态");
}

function runTypeSettingsPersistenceTests() {
  const debug = context.mathCampDebug;
  const point = debug.availablePoints(4).find((item) => item.id !== "auto") || debug.availablePoints(4)[0];
  assert(point, "grade 4 should expose at least one knowledge point");

  const profile = debug.normalizeProfile({
    id: "type-settings-profile",
    name: "Type Settings",
    grade: 2,
    settings: { pointId: "auto", setSize: 10, adaptive: true, dailyGoal: 20, answerMode: "auto" }
  });
  debug.state.profiles = [profile];
  debug.state.activeId = profile.id;
  debug.state.grade = 4;
  debug.state.pointId = point.id;
  debug.els.pointSelect.value = point.id;
  debug.els.setSizeInput.value = "8";
  debug.els.adaptiveToggle.checked = false;
  debug.els.answerModeSelect.value = "choice";
  debug.els.dailyGoalInput.value = "35";

  debug.startNewSet();

  const saved = debug.state.profiles[0];
  assert.strictEqual(saved.grade, 4, "starting a set should persist the selected grade");
  assert.strictEqual(saved.settings.pointId, point.id, "starting a set should persist the selected knowledge point");
  assert.strictEqual(saved.settings.setSize, 8, "starting a set should persist set size");
  assert.strictEqual(saved.settings.adaptive, false, "starting a set should persist adaptive setting");
  assert.strictEqual(saved.settings.answerMode, "choice", "starting a set should persist answer mode");
  assert.strictEqual(saved.settings.dailyGoal, 35, "starting a set should persist daily goal");
  assert.strictEqual(debug.state.currentSet.length, 8, "saved type settings should generate a full set");

  const storedProfiles = JSON.parse(context.localStorage.getItem("mathcamp-profiles-v4") || "[]");
  const stored = storedProfiles.find((item) => item.id === profile.id);
  assert(stored, "starting a set should write the profile to local storage");
  assert.strictEqual(stored.grade, 4, "local storage should keep the selected grade for next launch");
  assert.strictEqual(stored.settings.pointId, point.id, "local storage should keep the selected knowledge point for next launch");
  assert.strictEqual(stored.settings.answerMode, "choice", "local storage should keep the selected answer mode for next launch");
  assert.strictEqual(stored.settings.dailyGoal, 35, "local storage should keep the selected daily goal for next launch");
}

function runArchiveCloudCoverageTests() {
  const debug = context.mathCampDebug;
  const today = debug.todayKey();
  const point = debug.availablePoints(4)[0];
  const wish = debug.petWishes[0];
  const event = debug.petRandomEvents[0];
  const chapter = debug.petStoryChapters[0];
  const theme = debug.petRoomThemes.find((item) => item.id === "star") || debug.petRoomThemes.find((item) => item.id !== "sunny") || debug.petRoomThemes[0];
  const furniture = debug.petFurniture.find((item) => item.id === "rug") || debug.petFurniture[0];
  const outfit = debug.petOutfits[0];
  const achievement = debug.petAchievements[0];
  const dailyTask = debug.petDailyTasks[0];
  const weeklyTask = debug.petWeeklyTasks[0];

  assert(point && wish && event && chapter && theme && furniture && outfit && achievement && dailyTask && weeklyTask, "pet archive test data should be available");

  const richPet = {
    name: "Mimo",
    coins: 321,
    xp: 450,
    mood: 88,
    hunger: 77,
    clean: 66,
    bond: 55,
    inventory: { basicFood: 3, towel: 2, yarnBall: 1 },
    careLog: { date: today, encourage: 2, feed: 1, clean: 1, play: 1 },
    tasks: { daily: { [dailyTask.id]: today }, weekly: { [weeklyTask.id]: "week-key" } },
    wish: { date: today, id: wish.id, itemId: wish.itemId, progress: 2, fulfilled: true },
    rewardsClaimed: { "level-2": true, "level-3": true },
    decorations: { [furniture.id]: true, storyShelf: true },
    ownedFurniture: { [furniture.id]: true },
    equippedFurniture: { [furniture.id]: true },
    unlockedThemes: { sunny: true, [theme.id]: true },
    roomTheme: theme.id,
    outfits: { [outfit.id]: true },
    outfit: outfit.id,
    achievements: { claimed: { [achievement.id]: true } },
    event: { date: today, id: event.id, progress: 2, resolved: true },
    story: { [chapter.id]: { progress: 3, complete: true, claimed: true } },
    memories: {
      wishes: 4,
      careDays: 5,
      events: 6,
      stories: 7,
      levelGifts: 8,
      lastCareCompleteDate: today,
      log: [{ date: today, title: "Care day", desc: "Full pet archive" }]
    },
    lastRewardDate: today,
    lastDecayDate: today,
    lastPracticeDate: today,
    lastCareDate: today,
    runaway: { status: "away", awayDate: today, lostDate: "" }
  };
  const readingPoint = debug.pointMap["g4-reading"];
  const thinkingPoint = debug.pointMap["g4-thinking"];
  const geometryPoint = debug.pointMap["g4-angle-triangle"];
  const geometryQuestion = debug.makeQuestion(geometryPoint, { strict: true });
  const masteredGeometryQuestion = debug.makeQuestion(geometryPoint, { strict: true });
  const profile = debug.normalizeProfile({
    id: "pet-archive-rich",
    name: "Pet Archive",
    grade: 4,
    settings: { pointId: point.id, setSize: 12, adaptive: false, dailyGoal: 33, answerMode: "judge" },
    history: [
      { date: today, time: Date.now(), grade: 4, pointId: point.id, text: "1 + 1 = ?", answer: 2, correct: true },
      { date: today, time: Date.now() + 1, grade: 4, pointId: readingPoint.id, text: "读题训练记录", correct: false, mode: "logic-reading" },
      { date: today, time: Date.now() + 2, grade: 4, pointId: thinkingPoint.id, text: "思维精进记录", correct: true, mode: "practice" }
    ],
    wrongbook: [
      { id: "wrong-rich", question: { id: "q-rich", grade: 4, pointId: point.id, topic: point.topic, text: "3 + 5 = ?", answer: 8 }, cause: "careless" },
      { id: "wrong-geometry-rich", question: geometryQuestion, cause: "读题理解" }
    ],
    masteredWrong: [
      { id: "mastered-rich", question: { id: "q-mastered", grade: 4, pointId: point.id, topic: point.topic, text: "2 + 6 = ?", answer: 8 }, masteredAt: Date.now() },
      { id: "mastered-geometry-rich", question: masteredGeometryQuestion, masteredAt: Date.now() + 3 }
    ],
    mastery: {
      [readingPoint.id]: { attempts: 3, correct: 1, level: 2, streak: 0 },
      [thinkingPoint.id]: { attempts: 4, correct: 4, level: 3, streak: 4 },
      [geometryPoint.id]: { attempts: 2, correct: 1, level: 2, streak: 1 }
    },
    rewards: { pet: richPet }
  });

  function assertRichPet(pet, label) {
    assert.strictEqual(pet.name, "Mimo", `${label}: pet name should persist`);
    assert.strictEqual(pet.coins, 321, `${label}: coins should persist`);
    assert.strictEqual(pet.xp, 450, `${label}: xp should persist`);
    assert.strictEqual(pet.level, 4, `${label}: level should be derived from xp and persist`);
    assert.strictEqual(pet.inventory.basicFood, 3, `${label}: bag inventory should persist`);
    assert.strictEqual(pet.careLog.encourage, 2, `${label}: care log should persist`);
    assert.strictEqual(pet.tasks.daily[dailyTask.id], today, `${label}: daily task claims should persist`);
    assert.strictEqual(pet.tasks.weekly[weeklyTask.id], "week-key", `${label}: weekly task claims should persist`);
    assert.strictEqual(pet.wish.id, wish.id, `${label}: daily wish should persist`);
    assert.strictEqual(pet.rewardsClaimed["level-2"], true, `${label}: level rewards should persist`);
    assert.strictEqual(pet.decorations[furniture.id], true, `${label}: decorations should persist`);
    assert.strictEqual(pet.ownedFurniture[furniture.id], true, `${label}: furniture ownership should persist`);
    assert.strictEqual(pet.equippedFurniture[furniture.id], true, `${label}: equipped furniture should persist`);
    assert.strictEqual(pet.unlockedThemes[theme.id], true, `${label}: theme unlocks should persist`);
    assert.strictEqual(pet.roomTheme, theme.id, `${label}: active room theme should persist`);
    assert.strictEqual(pet.outfits[outfit.id], true, `${label}: outfit ownership should persist`);
    assert.strictEqual(pet.outfit, outfit.id, `${label}: equipped outfit should persist`);
    assert.strictEqual(pet.achievements.claimed[achievement.id], true, `${label}: achievement claims should persist`);
    assert.strictEqual(pet.event.id, event.id, `${label}: random event should persist`);
    assert.strictEqual(pet.event.resolved, true, `${label}: random event state should persist`);
    assert.strictEqual(pet.story[chapter.id].claimed, true, `${label}: story reward state should persist`);
    assert.strictEqual(pet.memories.wishes, 4, `${label}: growth memory counters should persist`);
    assert.strictEqual(pet.memories.log[0].title, "Care day", `${label}: growth records should persist`);
    assert.strictEqual(pet.lastRewardDate, today, `${label}: pet dates should persist`);
    assert.strictEqual(pet.lastPracticeDate, today, `${label}: practice date should persist`);
    assert.strictEqual(pet.lastCareDate, today, `${label}: care date should persist`);
    assert.strictEqual(pet.runaway.status, "away", `${label}: runaway status should persist`);
  }

  debug.state.profiles = [profile];
  debug.state.activeId = profile.id;
  debug.state.theme = "eye-care";
  debug.state.musicOn = true;
  debug.state.soundOn = false;
  context.localStorage.setItem("mathcamp-effects-settings", JSON.stringify({
    cursorEffects: false,
    rewardParticles: false,
    ambientAnimations: false
  }));
  context.MathCampCloudSync.setSyncCode("family-sync");
  debug.saveSystemSettingsSnapshot({ updatedAt: 123456 }, { touch: false, sync: false });
  assert.strictEqual(debug.saveProfiles(), true, "saveProfiles should persist the rich archive profile locally before export");

  const archive = debug.buildArchiveData();
  const archivedProfile = archive.profiles.find((item) => item.id === profile.id);
  assert(archivedProfile, "archive should include the rich pet profile");
  assert.strictEqual(archive.systemSettings.theme, "eye-care", "archive should include active system theme");
  assert.strictEqual(archive.systemSettings.musicOn, true, "archive should include music setting");
  assert.strictEqual(archive.systemSettings.soundOn, false, "archive should include sound setting");
  assert.strictEqual(archive.systemSettings.effects.cursorEffects, false, "archive should include effect settings");
  assert.strictEqual(archive.systemSettings.effects.rewardParticles, false, "archive should include reward particle setting");
  assert.strictEqual(archive.systemSettings.syncCode, "family-sync", "archive should include sync code but not Supabase secrets");
  assert.strictEqual(Object.prototype.hasOwnProperty.call(archive.systemSettings, "supabaseAnonKey"), false, "archive should not export Supabase anon key");
  assert.strictEqual(archivedProfile.settings.pointId, point.id, "archive should include type settings");
  assert.strictEqual(archivedProfile.settings.dailyGoal, 33, "archive should include daily goal");
  assert.strictEqual(archivedProfile.history.length, 3, "archive should include practice, reading, and thinking history");
  assert(archivedProfile.history.some((item) => item.pointId === readingPoint.id && item.mode === "logic-reading"), "archive should include logic reading practice history");
  assert(archivedProfile.history.some((item) => item.pointId === thinkingPoint.id), "archive should include thinking skill practice history");
  assert.strictEqual(archivedProfile.wrongbook.length, 2, "archive should include wrongbook, including generated geometry questions");
  assert.strictEqual(archivedProfile.masteredWrong.length, 2, "archive should include mastered wrongbook, including generated geometry questions");
  const archivedGeometryWrong = archivedProfile.wrongbook.find((item) => item.question.pointId === geometryPoint.id);
  assert(archivedGeometryWrong?.question.diagram, "archive should keep geometry diagram data in wrongbook questions");
  assert(archivedGeometryWrong.question.curriculumBand.includes("浙江省杭州市"), "archive should keep Hangzhou curriculum band on generated questions");
  assert.strictEqual(archivedProfile.mastery[readingPoint.id].attempts, 3, "archive should include reading mastery");
  assert.strictEqual(archivedProfile.mastery[thinkingPoint.id].correct, 4, "archive should include thinking mastery");
  assertRichPet(archivedProfile.rewards.pet, "export");
  const savedProfiles = JSON.parse(context.localStorage.getItem("mathcamp-profiles-v4") || "[]");
  const savedProfile = savedProfiles.find((item) => item.id === profile.id);
  assert(savedProfile, "saveProfiles should persist the normalized rich profile locally");
  assert(savedProfile.wrongbook.some((item) => item.question.pointId === geometryPoint.id && item.question.diagram), "local save should include new geometry diagram questions");
  assert(savedProfile.history.some((item) => item.pointId === readingPoint.id && item.mode === "logic-reading"), "local save should include logic reading history");

  debug.els.importText.value = JSON.stringify(archive);
  const imported = debug.parseImportBackup();
  const importedProfile = imported.profiles.find((item) => item.id === profile.id);
  assert(importedProfile, "import preview should include the rich pet profile");
  assert.strictEqual(importedProfile.settings.answerMode, "judge", "import should keep type settings");
  assert.strictEqual(imported.systemSettings.theme, "eye-care", "import preview should keep system theme");
  assert.strictEqual(imported.systemSettings.effects.ambientAnimations, false, "import preview should keep effect toggles");
  assert(importedProfile.history.some((item) => item.pointId === readingPoint.id && item.mode === "logic-reading"), "import should keep logic reading history");
  assert(importedProfile.wrongbook.some((item) => item.question.pointId === geometryPoint.id && item.question.diagram), "import should keep generated geometry diagram wrongbook data");
  assert.strictEqual(importedProfile.mastery[thinkingPoint.id].level, 3, "import should keep thinking mastery state");
  assertRichPet(importedProfile.rewards.pet, "import");

  const cloudProfile = JSON.parse(JSON.stringify(archivedProfile));
  cloudProfile.updatedAt = archivedProfile.updatedAt + 1000;
  cloudProfile.rewards.pet.coins = 777;
  cloudProfile.rewards.pet.inventory.basicFood = 9;
  const merged = context.MathCampCloudSync.mergeProfiles(
    [{ ...archivedProfile, updatedAt: archivedProfile.updatedAt - 1000 }],
    [{ device_id: "cloud", profiles: [cloudProfile], active_id: profile.id }]
  );
  const mergedPet = debug.petState(merged[0]);
  assert(merged[0].history.some((item) => item.pointId === readingPoint.id && item.mode === "logic-reading"), "cloud sync should keep logic reading history");
  assert(merged[0].wrongbook.some((item) => item.question.pointId === geometryPoint.id && item.question.diagram), "cloud sync should keep generated geometry diagram wrongbook data");
  assert.strictEqual(merged[0].mastery[thinkingPoint.id].correct, 4, "cloud sync should keep thinking mastery state");
  assert.strictEqual(mergedPet.coins, 777, "cloud sync should prefer newer full pet data");
  assert.strictEqual(mergedPet.inventory.basicFood, 9, "cloud sync should keep newer bag inventory");
  assertRichPet({ ...mergedPet, coins: 321, inventory: { ...mergedPet.inventory, basicFood: 3 } }, "cloud");

  const newerCloudSettings = context.MathCampCloudSync.mergeSettings(
    { theme: "classic", musicOn: false, soundOn: true, effects: { cursorEffects: true }, syncCode: "local", updatedAt: 100 },
    { theme: "eye-care", musicOn: true, soundOn: false, effects: { cursorEffects: false }, syncCode: "cloud", updatedAt: 200 }
  );
  assert.strictEqual(newerCloudSettings.changed, true, "cloud sync should report newer system settings");
  assert.strictEqual(newerCloudSettings.settings.theme, "eye-care", "cloud sync should prefer newer system settings");
  const newerLocalSettings = context.MathCampCloudSync.mergeSettings(
    { theme: "anime", musicOn: true, soundOn: true, effects: { cursorEffects: true }, syncCode: "local", updatedAt: 300 },
    { theme: "classic", updatedAt: 200 }
  );
  assert.strictEqual(newerLocalSettings.changed, false, "cloud sync should keep newer local system settings");
  assert.strictEqual(newerLocalSettings.settings.theme, "anime", "newer local system settings should win");
}

function runInteractionBoundaryTests() {
  const debug = context.mathCampDebug;
  assert.strictEqual(debug.parseNumericAnswer("1/2"), 0.5, "应支持分数输入");
  assert.strictEqual(debug.parseNumericAnswer("-3"), -3, "应支持负数输入");
  assert.strictEqual(debug.parseNumericAnswer("12厘米"), 12, "应忽略常见单位");
  assert(Number.isNaN(debug.parseNumericAnswer("abc")), "非数字输入应返回 NaN");

  const point = debug.pointMap["g4-mixed"] || Object.values(debug.pointMap).find((item) => item.topic === "mixed");
  assert(point, "应存在四则混合题知识点");
  const negativeQuestion = {
    id: "negative-choice",
    grade: point.grade,
    pointId: point.id,
    topic: point.topic,
    kind: point.label,
    text: "3 - 8 = ?",
    answer: -5,
    steps: ["先算 3 - 8，结果是 -5。"]
  };
  const choiceQuestion = debug.applyQuestionInteraction({ ...negativeQuestion }, "choice");
  assert.strictEqual(choiceQuestion.interaction.mode, "choice", "负数答案也应支持选择题模式");
  assert.strictEqual(debug.interactionRuleIssues(choiceQuestion).length, 0, "负数选择题不应出现选项不足或缺少正确答案");
  assert(choiceQuestion.interaction.options.some((option) => Number(option.value) === -5), "负数选择题应包含正确答案");

  const judgeQuestion = debug.applyQuestionInteraction({ ...negativeQuestion }, "judge");
  assert.strictEqual(judgeQuestion.interaction.mode, "judge", "负数答案也应支持判断题模式");
  assert.strictEqual(debug.interactionRuleIssues(judgeQuestion).length, 0, "负数判断题应保持有效真假状态");

  const formulaQuestion = debug.applyQuestionInteraction({
    id: "formula-word",
    grade: 2,
    pointId: "g2-simple-word",
    topic: "word",
    text: "书架上有 23 本故事书，又放上 15 本。一共有多少本？请列出算式并写出答案。",
    answerType: "formula",
    answer: 38,
    formulaAnswer: "23+15=38",
    acceptedFormulas: ["23+15=38", "15+23=38"],
    word: true,
    steps: ["23 + 15 = 38"]
  }, "auto");
  assert.strictEqual(formulaQuestion.interaction.mode, "input", "数学列算式题应使用系统输入框");
  assert.strictEqual(debug.interactionRuleIssues(formulaQuestion).length, 0, "数学列算式题应通过交互规则检查");
  assert.strictEqual(debug.answerMatches(formulaQuestion, { raw: "38", value: 38 }), false, "列算式题只填答案不能判对");
  assert.strictEqual(debug.answerMatches(formulaQuestion, { raw: "23+15=38", value: NaN }), true, "列算式题填正确算式和答案应判对");
  assert.strictEqual(debug.answerMatches(formulaQuestion, { raw: "15 + 23 = 38", value: NaN }), true, "列算式题应支持等价交换加法算式");
  assert.strictEqual(debug.answerMatches(formulaQuestion, { raw: "23+15=39", value: NaN }), false, "列算式题最终答案错误不能判对");
}

function runTwoStepMulDivTests() {
  const debug = context.mathCampDebug;
  assert(!debug.pointMap["g1-two-step-muldiv"], "grade 1 should not include two-step multiplication/division");
  Object.values(debug.pointMap).filter((point) => point.grade === 1).forEach((point) => {
    for (let i = 0; i < 40; i += 1) {
      const question = debug.makeQuestion(point);
      assert(!/[×÷]/.test(question.text), `grade 1 question should not contain multiplication/division: ${question.text}`);
      assert.strictEqual(question.grade, 1, "grade 1 question should stay in grade 1");
    }
  });
  ["g2-two-step-muldiv"].forEach((pointId) => {
    const point = debug.pointMap[pointId];
    assert(point, `${pointId} 应存在于题库`);
    for (let i = 0; i < 30; i += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      assert.strictEqual(question.pointId, pointId, `${pointId} 应生成严格匹配知识点的题`);
      assert.strictEqual(question.grade, point.grade, `${pointId} 应保持对应年级`);
      assert(/[×÷]/.test(question.text), `${pointId} 应包含乘除表达式`);
      assert(Number.isFinite(Number(question.answer)), `${pointId} 应生成数字答案`);
    }
  });
}

function runVerticalQuestionTests() {
  const debug = context.mathCampDebug;
  const verticalPoints = Object.values(debug.pointMap).filter((point) => point.topic === "vertical");
  assert.strictEqual(verticalPoints.length, 6, "vertical calculation should be available for grades 1-6");
  verticalPoints.forEach((point) => {
    for (let index = 0; index < 30; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const display = [
        question.text,
        question.explanation,
        ...(Array.isArray(question.steps) ? question.steps : [])
      ].filter(Boolean).join(" ");
      assert.strictEqual(question.pointId, point.id, `${point.id} should generate strict vertical questions`);
      assert.strictEqual(question.topic, "vertical", `${point.id} should keep vertical topic`);
      assert.strictEqual(question.grade, point.grade, `${point.id} should keep grade`);
      assert(/竖式|数位|对齐|进位|退位|试商|小数点/.test(display), `${point.id} should include vertical calculation context`);
      if (Number(point.grade) === 1) {
        assert(!/[\u00d7\u00f7]/.test(display), `grade 1 vertical question should not include multiplication/division: ${display}`);
      }
    }
  });
}

function runSpecialSetPurityTests() {
  const debug = context.mathCampDebug;
  debug.selectSubject("math");
  const points = Object.values(debug.pointMap);
  ["g1-number-order", "g2-length-measure", "g3-fraction-intro", "g5-average-stat", "g6-equation"].forEach((pointId) => {
    assert(debug.pointMap[pointId], `${pointId} should exist in the expanded question bank`);
  });
  points.forEach((point) => {
    debug.state.grade = point.grade;
    debug.state.pointId = point.id;
    debug.els.pointSelect.value = point.id;
    debug.els.setSizeInput.value = "8";
    debug.els.adaptiveToggle.checked = true;
    debug.els.answerModeSelect.value = "auto";
    debug.startNewSet();
    assert.strictEqual(debug.state.currentSet.length, 8, `${point.id} should build a full practice set`);
    debug.state.currentSet.forEach((question, index) => {
      const issues = debug.questionRuleIssues(point, question, { strict: true });
      assert.strictEqual(question.pointId, point.id, `${point.id} set question ${index + 1} should keep selected point`);
      assert.strictEqual(question.topic, point.topic, `${point.id} set question ${index + 1} should keep selected topic`);
      assert.strictEqual(question.grade, point.grade, `${point.id} set question ${index + 1} should keep selected grade`);
      assert.strictEqual(issues.length, 0, `${point.id} set question ${index + 1} should not mix question type: ${issues.join("; ")}`);
    });
  });
  [
    ["g2-table-div", /÷|平均分|每人|分成/],
    ["g4-area", /面积|平方米|平方厘米/],
    ["g5-decimal-add", /[+\-]/],
    ["g6-scale", /比例尺|图上|实际距离/]
  ].forEach(([pointId, pattern]) => {
    const point = debug.pointMap[pointId];
    assert(point, `${pointId} should exist for specialty purity checks`);
    for (let index = 0; index < 24; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const display = [question.text, question.explanation, ...(Array.isArray(question.steps) ? question.steps : [])].join(" ");
      assert.strictEqual(debug.questionRuleIssues(point, question, { strict: true }).length, 0, `${pointId} should not mix question type`);
      assert(pattern.test(display), `${pointId} should keep specialty context: ${display}`);
    }
  });
}

function runDecimalFormatTests() {
  const debug = context.mathCampDebug;
  Object.values(debug.pointMap).filter((point) => point.topic === "decimal").forEach((point) => {
    for (let i = 0; i < 40; i += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const text = [
        question.text,
        question.answerLabel,
        question.explanation,
        ...(Array.isArray(question.steps) ? question.steps : [])
      ].filter(Boolean).join(" ");
      const decimals = text.match(/-?\d+\.\d+/g) || [];
      decimals.forEach((value) => {
        assert(/^-?\d+\.\d{2}$/.test(value), `decimal display should keep two digits: ${value} in ${question.text}`);
      });
    }
  });
}

function runGradeAndDecimalDisplayTests() {
  const debug = context.mathCampDebug;
  const points = Object.values(debug.pointMap);
  const gradeOnePoints = points.filter((point) => Number(point.grade) === 1);
  assert(gradeOnePoints.length > 0, "grade 1 points should exist");
  assert(gradeOnePoints.every((point) => !/mul|div/i.test(`${point.id} ${point.topic} ${point.label}`)), "grade 1 should not expose multiplication/division points");

  gradeOnePoints.forEach((point) => {
    for (let index = 0; index < 50; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const display = [
        question.text,
        question.answerLabel,
        question.explanation,
        ...(Array.isArray(question.steps) ? question.steps : [])
      ].filter(Boolean).join(" ");
      assert(!/[\u00d7\u00f7]/.test(display), `grade 1 question should not include multiplication/division: ${display}`);
      assert.strictEqual(question.grade, 1, "grade 1 strict question should stay in grade 1");
    }
  });

  points.forEach((point) => {
    for (let index = 0; index < 20; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const display = [
        question.text,
        question.answerLabel,
        question.explanation,
        ...(Array.isArray(question.steps) ? question.steps : [])
      ].filter(Boolean).join(" ");
      const decimals = display.match(/-?\d+\.\d+/g) || [];
      decimals.forEach((decimal) => {
        assert(/^-?\d+\.\d{2}$/.test(decimal), `decimal display should keep two places: ${decimal} in ${display}`);
      });
    }
  });
}

function runMultiStepWordProblemTests() {
  const debug = context.mathCampDebug;
  const targetPointIds = ["g2-simple-word", "g3-word-two-step", "g4-word", "g5-word", "g6-complex-word"];
  let sawFishDistractor = false;
  let sawShoppingDiscount = false;
  let sawFormulaQuestion = false;

  targetPointIds.forEach((pointId) => {
    const point = debug.pointMap[pointId];
    assert(point, `${pointId} should exist for multi-step word problem checks`);
    let sawDistractor = false;
    let sawMultiStep = false;

    for (let index = 0; index < 480 && (!sawDistractor || !sawMultiStep || !sawFishDistractor || !sawShoppingDiscount || !sawFormulaQuestion); index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const steps = Array.isArray(question.steps) ? question.steps.filter(Boolean) : [];
      const display = [
        question.templateType,
        question.text,
        question.explanation,
        ...steps
      ].filter(Boolean).join(" ");

      assert.strictEqual(question.word, true, `${pointId} should keep word problem marker`);
      assert.strictEqual(debug.questionRuleIssues(point, question, { strict: true }).length, 0, `${pointId} should keep strict question rules`);

      if (/干扰|其中|不用再|本次不能用|赠品|样品|书签|已经包含/.test(display)) sawDistractor = true;
      if (steps.length >= 3 && /先|再|最后|还要|原来|优惠后|总数/.test(display)) sawMultiStep = true;

      const fishMatch = question.text.match(/吃了 (\d+) 条小鱼，还剩 (\d+) 条鱼，其中有 (\d+) 条是鲤鱼。原来有多少条鱼/);
      if (fishMatch) {
        const [, eaten, left, carp] = fishMatch.map(Number);
        assert(carp <= left, "fish distractor count should be part of the remaining fish");
        assert.strictEqual(question.answer, eaten + left, "fish distractor problem should add eaten and remaining fish only");
        sawFishDistractor = true;
      }

      const shoppingMatch = question.text.match(/原价 (\d+) 元的书包，店铺活动满 (\d+) 减 (\d+) 元，另需配送费 (\d+) 元/);
      if (shoppingMatch) {
        const [, price, threshold, discount, fee] = shoppingMatch.map(Number);
        assert(price >= threshold, "shopping discount should meet the threshold");
        assert.strictEqual(question.answer, price - discount + fee, "shopping problem should subtract discount and add delivery fee");
        sawShoppingDiscount = true;
      }

      if (question.answerType === "formula") {
        assert(question.formulaAnswer || (Array.isArray(question.acceptedFormulas) && question.acceptedFormulas.length), "formula question should declare an expected formula");
        assert(/列出算式|列式|算式/.test(question.text), "formula question should ask the child to write the equation");
        assert.strictEqual(debug.applyQuestionInteraction({ ...question }, "auto").interaction.mode, "input", "formula question should use input mode");
        sawFormulaQuestion = true;
      }
    }

    assert(sawDistractor, `${pointId} should generate word problems with distractor conditions`);
    assert(sawMultiStep, `${pointId} should generate word problems requiring multiple reasoning steps`);
  });

  assert(sawFishDistractor, "word problem set should include the fish-count distractor style");
  assert(sawShoppingDiscount, "word problem set should include the full-reduction plus delivery-fee style");
  assert(sawFormulaQuestion, "word problem generation should include formula-and-answer input questions");
}

function runLogicReadingQuestionTests() {
  const debug = context.mathCampDebug;
  const readingPoints = Object.values(debug.pointMap).filter((point) => point.topic === "reading");
  const globalTemplates = new Set();

  assert.strictEqual(readingPoints.length, 6, "logic reading should provide one point for each grade");
  [1, 2, 3, 4, 5, 6].forEach((grade) => {
    assert(debug.pointMap[`g${grade}-reading`], `grade ${grade} should include a logic reading point`);
  });

  readingPoints.forEach((point) => {
    const localTemplates = new Set();
    for (let index = 0; index < 320; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const steps = Array.isArray(question.steps) ? question.steps.filter(Boolean) : [];
      const display = [
        question.templateType,
        question.text,
        question.explanation,
        ...steps
      ].filter(Boolean).join(" ");

      assert.strictEqual(question.topic, "reading", `${point.id} should keep reading topic`);
      assert.strictEqual(question.pointId, point.id, `${point.id} should keep selected point`);
      assert.strictEqual(question.word, true, `${point.id} should keep word marker for reading comprehension`);
      assert(Number.isFinite(Number(question.answer)), `${point.id} should produce a numeric answer`);
      assert(steps.length >= 2, `${point.id} should provide reasoning steps`);
      assert(/读题|有用|无关|干扰|先算|结论|判断|一定|条件|推理|序号/.test(display), `${point.id} should include reading and reasoning context: ${display}`);
      assert.strictEqual(debug.questionRuleIssues(point, question, { strict: true }).length, 0, `${point.id} should pass strict question rules`);

      localTemplates.add(question.templateType);
      globalTemplates.add(question.templateType);
    }
    assert(localTemplates.size >= 5, `${point.id} should cover multiple logic reading templates`);
  });

  ["读题筛条件", "干扰条件识别", "步骤顺序判断", "购物逻辑", "比例阅读", "必要条件判断", "干扰条件进阶"].forEach((template) => {
    assert(globalTemplates.has(template), `logic reading bank should include ${template}`);
  });
}

function runThinkingSkillQuestionTests() {
  const debug = context.mathCampDebug;
  const thinkingPoints = Object.values(debug.pointMap).filter((point) => point.topic === "thinking");
  const expectedTemplates = ["估算合理性", "策略选择", "量感判断", "找错改错", "开放多答案", "生活阅读", "规律数列", "分类讨论", "可能性", "数学表达", "干扰条件推理"];
  const globalTemplates = new Set();

  assert.strictEqual(thinkingPoints.length, 6, "thinking skills should provide one point for each grade");
  [1, 2, 3, 4, 5, 6].forEach((grade) => {
    assert(debug.pointMap[`g${grade}-thinking`], `grade ${grade} should include a thinking skill point`);
  });

  thinkingPoints.forEach((point) => {
    const localTemplates = new Set();
    for (let index = 0; index < 220; index += 1) {
      const question = debug.makeQuestion(point, { strict: true });
      const display = [question.templateType, question.text, question.explanation, ...(question.steps || [])].join(" ");
      assert.strictEqual(question.topic, "thinking", `${point.id} should keep thinking topic`);
      assert.strictEqual(question.pointId, point.id, `${point.id} should keep selected point`);
      assert.strictEqual(question.word, true, `${point.id} should keep word marker for thinking problems`);
      assert(Number.isFinite(Number(question.answer)), `${point.id} should produce a numeric answer`);
      assert(expectedTemplates.includes(question.templateType), `${point.id} should use a known thinking template: ${question.templateType}`);
      assert(/估算|合理|策略|量感|改错|错误|开放|可能|表|票据|课程|规律|至少|分类|算式|表达|序号|选择|例如|干扰|有用|无关/.test(display), `${point.id} should include thinking category context: ${display}`);
      assert.strictEqual(debug.questionRuleIssues(point, question, { strict: true }).length, 0, `${point.id} should pass strict question rules`);
      localTemplates.add(question.templateType);
      globalTemplates.add(question.templateType);
    }
    assert(localTemplates.size >= 3, `${point.id} should cover multiple thinking templates`);
  });

  expectedTemplates.forEach((template) => {
    assert(globalTemplates.has(template), `thinking skill bank should include ${template}`);
  });
}

function runGeometryDiagramQuestionTests() {
  const debug = context.mathCampDebug;
  const expectedTypes = new Set(["shape-count", "position-row", "angle-set", "segment-chain", "rectangle", "square", "composite-rect", "cuboid", "circle", "circle-ring", "grid-shape", "block-view", "motion-grid", "angle-measure", "polygon-shape", "polygon-area", "symmetry-grid", "rotation-grid", "solid-net", "three-view", "route-map", "cylinder-cone", "sector-shape"]);
  const globalTypes = new Set();
  const globalTemplates = new Set();
  [1, 2, 3, 4, 5, 6].forEach((grade) => {
    const geometryPoints = debug.availablePoints(grade).filter((point) => point.topic === "geometry");
    assert(geometryPoints.length >= 1, `grade ${grade} should include a geometry point`);
    const seenTypes = new Set();
    geometryPoints.forEach((point) => {
      for (let i = 0; i < 60; i += 1) {
        const question = debug.makeQuestion(point, { strict: true });
        assert(question.diagram, `${point.id} should generate a visible geometry diagram`);
        assert(expectedTypes.has(question.diagram.type), `${point.id} should use a known diagram type: ${question.diagram.type}`);
        assert.strictEqual(question.topic, "geometry", `${point.id} should stay in geometry topic`);
        assert.strictEqual(question.pointId, point.id, `${point.id} should keep point id`);
        assert.strictEqual(debug.questionRuleIssues(point, question, { strict: true }).length, 0, `${point.id} geometry diagram question should pass rule checks`);
        seenTypes.add(question.diagram.type);
        globalTypes.add(question.diagram.type);
        if (question.templateType) globalTemplates.add(question.templateType);
      }
    });
    assert(seenTypes.size >= 1, `grade ${grade} should generate diagram types`);
  });

  assert(debug.pointMap["g2-angle-view"], "grade 2 should include an explicit angle and observation geometry point");
  const grade2Samples = Array.from({ length: 120 }, () => debug.makeQuestion(debug.pointMap["g2-angle-view"], { strict: true }));
  assert(grade2Samples.some((question) => question.diagram.type === "angle-set"), "grade 2 geometry should include angle counting diagrams");
  assert(grade2Samples.some((question) => question.diagram.type === "segment-chain"), "grade 2 geometry should include line-segment diagrams");
  assert(grade2Samples.some((question) => question.diagram.type === "motion-grid"), "grade 2 geometry should include shape motion diagrams");
  assert(grade2Samples.some((question) => question.diagram.type === "block-view"), "grade 2 geometry should include observation-object diagrams");
  assert(debug.pointMap["g4-angle-triangle"], "grade 4 should include angle, triangle, and quadrilateral geometry");
  assert(debug.pointMap["g5-geometry-motion"], "grade 5 should include polygon area and motion geometry");
  assert(debug.pointMap["g6-solid-position"], "grade 6 should include solid and position geometry");
  ["grid-shape", "block-view", "motion-grid", "circle-ring", "angle-measure", "polygon-shape", "polygon-area", "symmetry-grid", "rotation-grid", "solid-net", "three-view", "route-map", "cylinder-cone", "sector-shape"].forEach((type) => {
    assert(globalTypes.has(type), `geometry bank should include ${type} diagrams`);
  });
  ["数格子周长", "数格子面积", "组合图形拆分", "周长面积辨析", "观察物体", "图形运动", "圆环面积", "角的分类", "三角形内角和", "四边形特征", "平行四边形面积", "轴对称位置", "旋转读图", "展开图判断", "三视图", "位置方向读图", "圆柱体积", "圆锥体积", "扇形面积", "半圆周长"].forEach((template) => {
    assert(globalTemplates.has(template), `geometry bank should classify ${template} questions`);
  });
}

function runHangzhouCurriculumMetadataTests() {
  const debug = context.mathCampDebug;
  const bank = context.MathCampQuestionBank;
  assert(bank.curriculumProfile, "question bank should expose a curriculum profile");
  assert.strictEqual(bank.curriculumProfile.region, "浙江省杭州市", "curriculum profile should target Hangzhou");
  assert(bank.curriculumProfile.textbook.includes("人教版"), "curriculum profile should record the Renjiao textbook line");
  [1, 2, 3, 4, 5, 6].forEach((grade) => {
    const gradePlan = bank.gradeCurriculum[grade];
    assert(gradePlan, `grade ${grade} should have textbook unit classification`);
    assert(Array.isArray(gradePlan.first) && gradePlan.first.length >= 5, `grade ${grade} should list first-term units`);
    assert(Array.isArray(gradePlan.second) && gradePlan.second.length >= 5, `grade ${grade} should list second-term units`);
    assert(Array.isArray(gradePlan.focus) && gradePlan.focus.length >= 4, `grade ${grade} should list skill focus`);
  });

  Object.values(debug.pointMap).forEach((point) => {
    const curriculum = point.curriculum;
    assert(curriculum, `${point.id} should carry curriculum metadata`);
    assert.strictEqual(curriculum.region, "浙江省杭州市", `${point.id} should target Hangzhou`);
    assert(curriculum.textbook.includes("人教版"), `${point.id} should keep textbook version`);
    assert(curriculum.term, `${point.id} should include term`);
    assert(curriculum.unit, `${point.id} should include textbook unit`);
    assert(curriculum.stage, `${point.id} should include learning stage`);
    assert(curriculum.focus, `${point.id} should include lesson focus`);
    assert(Array.isArray(curriculum.questionTypes) && curriculum.questionTypes.length >= 1, `${point.id} should include concrete question types`);
    assert(curriculum.band.includes("浙江省杭州市"), `${point.id} curriculum band should include region`);
  });

  assert(debug.pointMap["g1-10-add"].curriculum.unit.includes("1-10"), "grade 1 add/sub should align to 1-10 recognition and calculation");
  assert(debug.pointMap["g2-table-div"].curriculum.unit.includes("表内除法"), "grade 2 division should align to table division");
  assert(debug.pointMap["g5-equation"].curriculum.unit.includes("简易方程"), "grade 5 equation should align to simple equations");
  assert(debug.pointMap["g6-scale"].curriculum.term === "六下", "scale should be placed in grade 6 second term");
  assert(debug.pointMap["g6-scale"].curriculum.unit.includes("比例"), "scale should align to the proportion unit");
  assert(debug.pointMap["g5-percent"].curriculum.stage.includes("预习"), "early percent practice should be marked as preview");
  assert(debug.pointMap["g3-remainder"].curriculum.stage.includes("复习"), "remainder in grade 3 should be marked as review");

  const grade2Labels = debug.availablePoints(2).map((point) => debug.curriculumSelectLabel(point));
  assert(grade2Labels.some((label) => label.includes("二上") && label.includes("100 以内加法和减法（二）")), "grade 2 selector labels should include first-term textbook units");
  assert(grade2Labels.some((label) => label.includes("二下") && label.includes("表内除法")), "grade 2 selector labels should include second-term textbook units");
  assert.strictEqual(debug.curriculumSelectShortLabel(debug.pointMap["g2-100-add"]), "100以内加减 · 100以内", "selector short labels should keep compact unit context without semester labels");
  assert.strictEqual(debug.curriculumSelectShortLabel(debug.pointMap["g2-table-div"]), "表内除法 · 表内除", "selector short labels should keep division context concise without semester labels");
  assert.strictEqual(debug.knowledgeDetailTitle(debug.pointMap["g2-100-add"]), "100以内", "knowledge detail title should prefer concise point short labels");
  assert.strictEqual(debug.knowledgeDetailTitle(debug.pointMap["g2-table-div"]), "表内除", "knowledge detail title should prefer concise point short labels");
  assert(!debug.knowledgeDetailTitle(debug.pointMap["g2-table-div"]).includes("二下"), "knowledge detail title should not include semester labels");
  assert(!debug.knowledgeDetailTitle(debug.pointMap["g2-table-div"]).includes("（"), "knowledge detail title should not include long textbook unit suffixes");
  assert(debug.curriculumPointRank(debug.pointMap["g2-100-add"]) < debug.curriculumPointRank(debug.pointMap["g2-table-div"]), "textbook unit order should still be available without semester groups");
  const grade2Options = debug.pointOptionsHTML(2, "g2-table-div");
  assert(!grade2Options.includes("<optgroup"), "selector options should not split knowledge points into semester groups");
  assert(!grade2Options.includes("data-group="), "selector options should not carry semester group metadata");
  assert(grade2Options.includes(">表内除法 · 表内除</option>"), "selector options should show compact textbook-aware labels");
  assert(!grade2Options.includes(">二下 · 表内除法 · 表内除</option>"), "selector options should not show semester labels in menu text");
  assert(!grade2Options.includes(">二下 · 表内除法（一）（二） · 表内除法</option>"), "selector options should not show the long textbook label in the menu text");
  const wrongbookOptions = debug.pointOptionsHTML(2, "all", { autoValue: "all", autoLabel: "全部知识点" });
  assert(wrongbookOptions.startsWith('<option value="all" selected>全部知识点</option>'), "wrongbook selector should keep a concise all option");
  const migratedWrongbookOptions = debug.pointOptionsHTML(2, "auto", { autoValue: "all", autoLabel: "全部知识点" });
  assert(migratedWrongbookOptions.startsWith('<option value="all" selected>全部知识点</option>'), "wrongbook selector should migrate stale auto selections to all");

  const scaleQuestion = debug.makeQuestion(debug.pointMap["g6-scale"], { strict: true });
  assert(scaleQuestion.curriculumBand.includes("浙江省杭州市"), "generated questions should carry Hangzhou curriculum band");
  assert(scaleQuestion.curriculumBand.includes("比例-比例尺"), "generated scale questions should carry textbook unit band");

  const equationProfile = debug.knowledgeProfileFor(debug.pointMap["g5-equation"]);
  assert(equationProfile.rule.includes("简易方程"), "knowledge detail should mention the textbook unit");
  assert(equationProfile.rule.includes("用 x 表示未知数"), "knowledge detail should include the lesson focus");
  assert(equationProfile.subskills.some((item) => /方程|等量/.test(item)), "knowledge detail should include concrete textbook question types");
  assert(debug.curriculumHelperText(debug.pointMap["g1-10-add"]).includes("一上"), "helper text should include term context");
}

function runFineGrainedCloudMergeTests() {
  const debug = context.mathCampDebug;
  const point = debug.availablePoints(4)[0];
  const local = debug.normalizeProfile({
    id: "cloud-merge-fine",
    name: "Cloud Merge",
    grade: 4,
    history: [{ id: "local-history", date: debug.todayKey(), time: 100, grade: 4, pointId: point.id, correct: true, cause: "", mode: "practice", text: "1 + 1 = ?" }],
    wrongbook: [{ id: "local-wrong", signature: "local-sig", question: { id: "q-local", grade: 4, pointId: point.id, topic: point.topic, text: "3 + 4 = ?", answer: 7 }, cause: "careless", updatedAt: 100 }],
    masteredWrong: [{ id: "local-mastered", signature: "local-mastered-sig", question: { id: "q-local-m", grade: 4, pointId: point.id, topic: point.topic, text: "2 + 6 = ?", answer: 8 }, cause: "careless", masteredAt: 120, updatedAt: 120 }],
    mastery: { [point.id]: { attempts: 2, correct: 1, level: 2, streak: 1 } },
    rewards: { clearedWrong: 1, pet: { coins: 1 } },
    updatedAt: 1000
  });
  const cloud = debug.normalizeProfile({
    ...local,
    history: [{ id: "cloud-history", date: debug.todayKey(), time: 200, grade: 4, pointId: point.id, correct: false, cause: "", mode: "wrongbook", text: "5 + 5 = ?" }],
    wrongbook: [{ id: "cloud-wrong", signature: "cloud-sig", question: { id: "q-cloud", grade: 4, pointId: point.id, topic: point.topic, text: "8 + 4 = ?", answer: 12 }, cause: "understand", updatedAt: 200 }],
    masteredWrong: [{ id: "cloud-mastered", signature: "cloud-mastered-sig", question: { id: "q-cloud-m", grade: 4, pointId: point.id, topic: point.topic, text: "7 + 1 = ?", answer: 8 }, cause: "understand", masteredAt: 220, updatedAt: 220 }],
    mastery: { [point.id]: { attempts: 5, correct: 4, level: 3, streak: 2 } },
    rewards: { clearedWrong: 2, pet: { coins: 9 } },
    updatedAt: 2000
  });
  const merged = context.MathCampCloudSync.mergeProfiles(
    [local],
    [{ device_id: "cloud", profiles: [cloud], active_id: local.id }]
  )[0];
  assert(merged.history.some((item) => item.time === 100 && item.text === "1 + 1 = ?"), "merge should keep local history");
  assert(merged.history.some((item) => item.time === 200 && item.text === "5 + 5 = ?"), "merge should keep cloud history");
  assert(merged.wrongbook.some((item) => item.id === "local-wrong"), "merge should keep local wrongbook");
  assert(merged.wrongbook.some((item) => item.id === "cloud-wrong"), "merge should keep cloud wrongbook");
  assert(merged.masteredWrong.some((item) => item.id === "local-mastered"), "merge should keep local mastered wrong");
  assert(merged.masteredWrong.some((item) => item.id === "cloud-mastered"), "merge should keep cloud mastered wrong");
  assert(merged.mastery[point.id].attempts >= 5, "merge should keep strongest mastery");
  assert.strictEqual(debug.petState(merged).coins, 9, "newer pet state should win");

  const summary = context.MathCampCloudSync.mergeSummary(
    [local],
    [merged],
    true
  );
  assert(summary.history >= 1, "merge summary should report history gains");
  assert(summary.wrongbook >= 1, "merge summary should report wrongbook gains");
  assert(summary.masteredWrong >= 1, "merge summary should report mastered wrong gains");
  assert.strictEqual(summary.settingsChanged, true, "merge summary should carry settings change state");
}

function runAdaptiveRouteTests() {
  const debug = context.mathCampDebug;
  const profile = debug.normalizeProfile({
    id: "adaptive-route",
    name: "Adaptive",
    grade: 3,
    wrongbook: [{
      id: "due-wrong",
      signature: "due-sig",
      question: { id: "q-due", grade: 3, pointId: "g3-mul-div", topic: "muldiv", text: "6 × 7 = ?", answer: 42 },
      cause: "不会做",
      wrongCount: 2,
      correctStreak: 0,
      reviewStage: 0,
      dueDate: debug.todayKey(),
      updatedAt: Date.now()
    }],
    history: []
  });
  debug.state.profiles = [profile];
  debug.state.activeId = profile.id;
  debug.state.grade = 3;
  debug.state.pointId = "auto";
  debug.state.adaptive = true;
  const set = debug.buildAdaptiveQuestionSet(10, "auto");
  assert.strictEqual(set.length, 10, "adaptive practice should build a full set");
  assert(set.some((question) => question.reviewSource === "due" || question.reviewSource === "weak"), "adaptive practice should include review-oriented questions");
  assert(set.every((question) => question.grade === 3), "adaptive practice should stay in grade");
}

function questionSetSignature(question) {
  return `${question.pointId}|${question.text}|${question.answerLabel || question.answer}`;
}

function assertNoAdjacentRepeatedQuestions(set, message) {
  for (let index = 1; index < set.length; index += 1) {
    assert.notStrictEqual(
      questionSetSignature(set[index]),
      questionSetSignature(set[index - 1]),
      `${message}：第 ${index} 题和第 ${index + 1} 题不应连续完全相同`
    );
  }
}

function runQuestionSetDedupeTests() {
  const debug = context.mathCampDebug;
  const originalRandom = vm.runInContext("Math.random", context);
  context.__originalMathRandom = originalRandom;
  vm.runInContext("Math.random = () => 0", context);
  try {
    const profile = debug.normalizeProfile({ id: "dedupe-profile", name: "Dedupe", grade: 3 });
    debug.state.profiles = [profile];
    debug.state.activeId = profile.id;
    debug.state.answerMode = "auto";
    debug.els.answerModeSelect.value = "auto";
    debug.els.setSizeInput.value = "6";

    debug.selectSubject("chinese");
    debug.state.grade = 3;
    const chinesePoint = debug.activeBank().pointMap["c3-word-meaning"];
    const chineseSet = debug.buildQuestionSetForPoint(chinesePoint, 6, "auto");
    assert.strictEqual(chineseSet.length, 6, "语文专项组卷应保持题目数量");
    assert(new Set(chineseSet.map(questionSetSignature)).size >= 2, "语文专项组卷应在可用模板之间轮换");
    assertNoAdjacentRepeatedQuestions(chineseSet, "语文专项组卷");

    debug.selectSubject("english");
    debug.state.grade = 3;
    const englishPoint = debug.activeBank().pointMap["e3-vocabulary-school"];
    const englishSet = debug.buildQuestionSetForPoint(englishPoint, 6, "auto");
    assert.strictEqual(englishSet.length, 6, "英语专项组卷应保持题目数量");
    assert(new Set(englishSet.map(questionSetSignature)).size >= 2, "英语专项组卷应在可用模板之间轮换");
    assertNoAdjacentRepeatedQuestions(englishSet, "英语专项组卷");

    debug.state.pointId = "auto";
    debug.state.adaptive = true;
    const adaptiveEnglishSet = debug.buildAdaptiveQuestionSet(8, "auto");
    assert.strictEqual(adaptiveEnglishSet.length, 8, "英语自适应组卷应保持题目数量");
    assertNoAdjacentRepeatedQuestions(adaptiveEnglishSet, "英语自适应组卷");
  } finally {
    vm.runInContext("Math.random = __originalMathRandom", context);
    delete context.__originalMathRandom;
  }
}

function runArchiveVersionTests() {
  const debug = context.mathCampDebug;
  const archive = debug.buildArchiveData();
  assert.strictEqual(archive.version, 6, "archive version should advance after migration");
  debug.els.importText.value = JSON.stringify({ ...archive, version: 5 });
  const parsed = debug.parseImportBackup();
  assert(parsed.repairNotes.some((note) => /v5|v6/.test(note)), "older archives should report an upgrade note");
}

function runCoverageAndInsightTests() {
  const debug = context.mathCampDebug;
  const coverage = debug.buildQuestionBankCoverage();
  assert(coverage && coverage.totalPoints >= 60, "coverage report should include the expanded question bank");
  assert.strictEqual(coverage.gaps.filter((gap) => gap.level === "high").length, 0, "each grade should keep geometry, reading, and thinking coverage");
  coverage.grades.forEach((grade) => {
    assert(grade.geometryPoints >= 1, `grade ${grade.grade} should include geometry coverage`);
    assert(grade.readingPoints >= 1, `grade ${grade.grade} should include reading coverage`);
    assert(grade.thinkingPoints >= 1, `grade ${grade.grade} should include thinking coverage`);
  });

  const profile = debug.normalizeProfile({
    id: "insight-profile",
    name: "Insight",
    grade: 4,
    wrongbook: [{
      id: "insight-wrong",
      question: { id: "q-insight", grade: 4, pointId: "g4-word", topic: "word", text: "题中有会员折扣，但问题只问原价购买。实际要排除折扣这个干扰条件。", answer: 48 },
      cause: "干扰条件",
      wrongCount: 1
    }],
    history: [
      { grade: 4, pointId: "g4-word", correct: false, cause: "干扰条件", text: "多余条件导致列式错误" },
      { grade: 4, pointId: "g4-word", correct: true, cause: "", text: "应用题" }
    ]
  });
  const insights = debug.buildWeakPointInsights(profile, { grade: 4, points: [debug.pointMap["g4-word"]], limit: 1 });
  assert.strictEqual(insights.length, 1, "weak-point insight should return a recommendation");
  assert.strictEqual(insights[0].mainCause, "干扰条件", "insight should detect distractor-condition mistakes");
  assert(insights[0].advice.includes("不用") || insights[0].advice.includes("无关"), "insight advice should tell the child to filter distractors");
}

function runUtf8EncodingTests() {
  const files = ["js/app.js", "js/cloud-sync.js", "js/runtime-config.js", "js/question-bank-coverage.js", "js/learning-insights.js", "js/pet-economy.js", "js/subject-registry.js", "js/chinese-question-bank.js", "js/chinese-question-generator.js", "js/english-question-bank.js", "js/english-question-generator.js", "js/handwriting-input.js", "index.html", "tests/question-rules.test.js", "tests/frontend-layout.test.js", "tests/english-question-bank.test.js"];
  const mojibakeTokens = ["\u93c1", "\u93b7", "\u7edb", "\u95bf", "\u9983", "\u8133", "\u923f", "\u9241", "\u9286", "\u4fd9", "\u6992", "\u5744", "\u6624", "\ufffd"];
  const mojibake = new RegExp(mojibakeTokens.join("|"));
  files.forEach((file) => {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(!mojibake.test(source), `${file} 应保持 UTF-8 文本，不能混入乱码`);
  });
}

function runChineseSubjectIntegrationTests() {
  const debug = context.mathCampDebug;
  const originalMatchMedia = context.matchMedia;
  const profile = debug.normalizeProfile({ id: "student-chinese", name: "语文测试", grade: 3 });
  debug.state.profiles = [profile];
  debug.state.activeId = profile.id;
  debug.selectSubject("chinese");
  debug.state.grade = 3;
  debug.state.pointId = "auto";
  debug.state.setSize = 10;
  debug.els.setSizeInput.value = "10";
  debug.els.pointSelect.value = "auto";
  debug.startNewSet({ autoFocus: false });
  const sourceCounts = debug.state.currentSet.reduce((acc, question) => {
    acc[question.sourceType] = (acc[question.sourceType] || 0) + 1;
    return acc;
  }, {});
  assert.strictEqual(sourceCounts.inTextbook, 10, "语文自动组卷应全部来自杭州教材同步知识点");
  assert.strictEqual(sourceCounts.recommendedReading || 0, 0, "语文自动组卷不应再按比例混入推荐读物题");
  assert.strictEqual(sourceCounts.extraOriginal || 0, 0, "语文自动组卷不应再按比例混入原创拓展题");

  debug.state.pointId = "c3-paragraph-reading";
  debug.state.setSize = 3;
  debug.els.setSizeInput.value = "3";
  debug.els.pointSelect.value = "c3-paragraph-reading";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.subject, "chinese", "应能切换到语文学科");
  assert.strictEqual(debug.state.currentSet.length, 3, "语文学科应能生成一组题");
  assert(debug.state.currentSet.every((question) => question.subject === "chinese"), "语文题应带 subject=chinese");
  assert(debug.state.currentSet.every((question) => question.pointId === "c3-paragraph-reading"), "语文专项练习应保持指定知识点");
  assert(debug.state.currentSet.every((question) => question.explanation && Array.isArray(question.steps) && question.steps.length), "每道语文题都应有解析和步骤");

  debug.els.petHintBtn.click();
  assert(
    /短文|原文|完整句|诗句/.test(debug.els.methodHint.textContent),
    "语文题点击招财提示时，应提示回到文本定位并完整表达"
  );
  assert(!debug.els.methodHint.textContent.includes("思维阅读题"), "语文阅读提示不应复用数学思维阅读文案");

  const desktopChineseStep = debug.applyQuestionInteraction({ ...debug.state.currentSet[0] }, "step");
  assert.strictEqual(desktopChineseStep.interaction.mode, "input", "语文题在桌面端也不应使用分步作答，应回落到系统键盘输入");

  const explicitChineseChoice = debug.applyQuestionInteraction({
    subject: "chinese",
    pointId: "c3-word-meaning",
    topic: "word",
    text: "材料：阳光照进教室，桌面变得明亮。\n题目：“明亮”的近义词是哪一个？\nA. 光亮\nB. 黑暗\nC. 寒冷\nD. 安静",
    answerType: "choice",
    answer: "A",
    acceptedAnswers: ["A", "光亮", "A. 光亮"],
    answerLabel: "A. 光亮",
    explanation: "“明亮”和“光亮”意思接近。"
  }, "auto");
  assert.strictEqual(explicitChineseChoice.interaction.mode, "choice", "语文 A/B/C/D 题在自动模式下应归类为选择题");
  assert.strictEqual(debug.interactionRuleIssues(explicitChineseChoice).length, 0, "语文选择题自动模式应生成有效选择面板");

  const explicitChineseInput = debug.applyQuestionInteraction({
    subject: "chinese",
    pointId: "c2-textbook-sound-shape",
    topic: "character",
    text: "材料：晴和太阳有关，清和水有关。\n题目：“晴天”的“晴”应填什么偏旁？请直接输入汉字。",
    answerType: "text",
    answer: "日",
    acceptedAnswers: ["日", "日字旁"],
    explanation: "“晴”表示天气晴朗，和太阳有关，是日字旁。"
  }, "auto");
  assert.strictEqual(explicitChineseInput.interaction.mode, "input", "语文直接输入汉字题在自动模式下应使用系统键盘");

  for (const grade of [1, 2, 3, 4, 5, 6]) {
    debug.state.grade = grade;
    debug.availablePoints(grade).filter((point) => point.subject === "chinese").forEach((point) => {
      const question = debug.makeQuestion(point, { strict: true });
      assert.strictEqual(debug.applyQuestionInteraction({ ...question }, "input").interaction.mode, "input", `${point.id} 语文输入题应使用系统键盘`);
      assert.strictEqual(debug.applyQuestionInteraction({ ...question }, "step").interaction.mode, "input", `${point.id} 语文题不应支持分步作答`);
      const choiceMode = debug.applyQuestionInteraction({ ...question }, "choice").interaction.mode;
      assert.strictEqual(choiceMode, question.answerType === "choice" ? "choice" : "input", `${point.id} 语文题应按题目类型决定是否显示选择面板`);
      assert.strictEqual(debug.applyQuestionInteraction({ ...question }, "judge").interaction.mode, "judge", `${point.id} 语文判断题应使用判断面板`);
    });
  }
  debug.state.grade = 3;

  context.matchMedia = (query) => ({
    matches: query.includes("1180px") || query.includes("620px"),
    addEventListener() {},
    removeEventListener() {}
  });
  debug.state.answerMode = "input";
  debug.els.answerModeSelect.value = "input";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.els.answerModePanel.hidden, true, "语文直接输入题不应弹出额外答题面板");
  assert.strictEqual(debug.els.numberPad.hidden, true, "语文直接输入题在移动和平板端不应显示数字键盘");

  debug.state.answerMode = "step";
  debug.els.answerModeSelect.value = "step";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.currentSet[0].interaction.mode, "input", "语文题不应使用分步作答，应回落到系统键盘输入");
  assert.strictEqual(debug.els.answerModePanel.hidden, true, "语文题选择分步作答时也不应显示分步面板");
  assert(!debug.els.answerModePanel.innerHTML.includes("分步作答"), "语文答题面板不应出现分步作答");
  assert.strictEqual(debug.els.numberPad.hidden, true, "语文题回落输入时仍不应显示数字键盘");

  debug.state.pointId = "c3-writing-piece";
  debug.els.pointSelect.value = "c3-writing-piece";
  debug.state.answerMode = "input";
  debug.els.answerModeSelect.value = "input";
  debug.startNewSet({ autoFocus: false });
  assert.notStrictEqual(debug.state.currentSet[0].answerType, "longText", "语文习作片段应尽量改为客观题，避免主观长文本自评");
  assert.strictEqual(debug.state.currentSet[0].answerType, "text", "语文习作片段应使用可判分的文字答案");
  assert.strictEqual(debug.state.currentSet[0].interaction.mode, "input", "语文客观文字题应使用系统键盘输入");
  assert.strictEqual(debug.els.answerInput.readOnly, false, "语文文字题输入框应允许系统键盘输入文字");
  assert.strictEqual(debug.els.answerInput.getAttribute("inputmode"), "text", "语文文字题应使用文本输入模式");

  debug.state.pointId = "c3-word-meaning";
  debug.els.pointSelect.value = "c3-word-meaning";
  debug.state.answerMode = "choice";
  debug.els.answerModeSelect.value = "choice";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.currentSet[0].interaction.mode, "choice", "语文选择题应保持选择作答模式");
  assert.strictEqual(debug.els.answerModePanel.hidden, false, "语文选择题应弹出选择面板");
  assert(debug.els.answerModePanel.innerHTML.includes("选择题"), "语文选择题面板应显示选择题标题");
  assert.strictEqual(debug.els.numberPad.hidden, true, "语文选择题不应同时显示数字键盘");
  assert(debug.els.questionText.innerHTML.includes("question-options"), "题干中的 A/B/C 选项应拆成独立选项区");
  assert(debug.els.questionText.innerHTML.includes("question-option"), "题干中的每个选项应独立成行，便于读题");

  debug.state.answerMode = "judge";
  debug.els.answerModeSelect.value = "judge";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.currentSet[0].interaction.mode, "judge", "语文判断题应保持判断作答模式");
  assert.strictEqual(debug.els.answerModePanel.hidden, false, "语文判断题应弹出判断面板");
  assert(debug.els.answerModePanel.innerHTML.includes("判断对错"), "语文判断题面板应显示判断题标题");
  assert.strictEqual(debug.els.numberPad.hidden, true, "语文判断题不应同时显示数字键盘");

  context.matchMedia = originalMatchMedia;
}

function runEnglishSubjectIntegrationTests() {
  const debug = context.mathCampDebug;
  const originalMatchMedia = context.matchMedia;
  const profile = debug.normalizeProfile({ id: "student-english", name: "英语测试", grade: 1 });
  debug.state.profiles = [profile];
  debug.state.activeId = profile.id;
  debug.selectSubject("english");
  assert.strictEqual(debug.state.subject, "english", "应能切换到英语学科");
  assert.strictEqual(debug.state.grade, 3, "英语三年级起点，低年级切换后应自动落到三年级");

  debug.state.pointId = "auto";
  debug.state.setSize = 8;
  debug.els.setSizeInput.value = "8";
  debug.els.pointSelect.value = "auto";
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.currentSet.length, 8, "英语学科应能生成一组题");
  assert(debug.state.currentSet.every((question) => question.subject === "english"), "英语题应带 subject=english");
  assert(debug.state.currentSet.every((question) => question.explanation && Array.isArray(question.steps) && question.steps.length), "每道英语题都应有解析和步骤");
  assert(debug.state.currentSet.every((question) => ["choice", "text"].includes(question.answerType)), "英语题应保持客观可判分题型");

  const englishChoice = debug.applyQuestionInteraction({
    subject: "english",
    pointId: "e3-vocabulary-school",
    topic: "vocabulary",
    text: "【词汇理解】Which word means 铅笔？\nA. pencil\nB. window\nC. rainy\nD. chicken",
    answerType: "choice",
    answer: "A",
    acceptedAnswers: ["A", "pencil", "A. pencil"],
    answerLabel: "A. pencil",
    explanation: "pencil means 铅笔。"
  }, "auto");
  assert.strictEqual(englishChoice.interaction.mode, "choice", "英语 A/B/C/D 题应显示选择面板");
  assert.strictEqual(debug.interactionRuleIssues(englishChoice).length, 0, "英语选择题应生成有效选项");
  assert.strictEqual(debug.answerMatches(englishChoice, { raw: "pencil", value: NaN }), true, "英语选择题应接受正确英文选项文本");

  const englishInput = debug.applyQuestionInteraction({
    subject: "english",
    pointId: "e5-grammar-there-present",
    topic: "grammar",
    text: "【语法填空】题目：He ____ football yesterday. 请只输入空格处英文。",
    answerType: "text",
    answer: "played",
    acceptedAnswers: ["played"],
    explanation: "yesterday 表示一般过去时，play 的过去式是 played。"
  }, "auto");
  assert.strictEqual(englishInput.interaction.mode, "input", "英语直接输入题应使用系统键盘");
  assert.strictEqual(debug.answerMatches(englishInput, { raw: "Played", value: NaN }), true, "英语输入题判分应忽略大小写");

  const audioQuestion = {
    subject: "english",
    pointId: "e3-vocabulary-school",
    topic: "vocabulary",
    text: "【听音选词】点击播放录音，选择你听到的单词。\nA. pencil\nB. window\nC. rainy\nD. chicken",
    answerType: "choice",
    answer: "A",
    acceptedAnswers: ["A", "pencil", "A. pencil"],
    answerLabel: "A. pencil",
    audioPrompt: { type: "tts", lang: "en-US", text: "pencil" },
    explanation: "录音读的是 pencil。"
  };
  assert.strictEqual(debug.hasAudioPrompt(audioQuestion), true, "英语听力题应识别为可播放题");
  debug.renderQuestionTitle(audioQuestion);
  assert(debug.els.questionText.innerHTML.includes("data-audio-prompt-play"), "英语听力题题干应显示播放录音按钮");
  assert(debug.els.questionText.innerHTML.includes("点击播放录音"), "英语听力题应保留读题提示");
  debug.speakQuestionPrompt(audioQuestion);
  assert.strictEqual(context.speechSynthesis.spoken.at(-1).text, "pencil", "点击播放应朗读 audioPrompt.text");
  assert.strictEqual(context.speechSynthesis.spoken.at(-1).lang, "en-US", "英语发音应使用 en-US");

  for (const grade of [3, 4, 5, 6]) {
    debug.state.grade = grade;
    const points = debug.availablePoints(grade).filter((point) => point.subject === "english");
    assert(points.length >= 10, `${grade} 年级应有英语知识点`);
    points.slice(0, 6).forEach((point) => {
      const question = debug.makeQuestion(point, { strict: true });
      assert.strictEqual(question.subject, "english", `${point.id} 应生成英语题`);
      assert.strictEqual(debug.applyQuestionInteraction({ ...question }, "step").interaction.mode, "input", `${point.id} 英语题不应进入数学分步作答`);
      const choiceMode = debug.applyQuestionInteraction({ ...question }, "choice").interaction.mode;
      assert.strictEqual(choiceMode, question.answerType === "choice" ? "choice" : "input", `${point.id} 英语题应按题目类型显示选择面板`);
    });
  }

  debug.state.grade = 3;
  debug.state.pointId = "e3-vocabulary-school";
  debug.els.pointSelect.value = "e3-vocabulary-school";
  debug.state.answerMode = "input";
  debug.els.answerModeSelect.value = "input";
  context.matchMedia = (query) => ({
    matches: query.includes("1180px") || query.includes("620px"),
    addEventListener() {},
    removeEventListener() {}
  });
  debug.startNewSet({ autoFocus: false });
  assert.strictEqual(debug.state.currentSet[0].interaction.mode, "input", "英语输入题移动端应保持系统键盘输入");
  assert.strictEqual(debug.els.answerInput.readOnly, false, "英语输入题输入框应允许系统键盘输入");
  assert.strictEqual(debug.els.answerInput.getAttribute("inputmode"), "text", "英语输入题应使用文本输入模式");
  assert.strictEqual(debug.els.numberPad.hidden, true, "英语输入题不应显示数字键盘");
  assert(!/已知什么|加减乘除/.test(debug.els.companionTalk.textContent), "英语做题提示不应复用数学应用题文案");

  context.matchMedia = originalMatchMedia;
}

const result = context.mathCampSelfTest(32);
if (result.failed) {
  console.error(JSON.stringify(result.failures.slice(0, 10), null, 2));
  throw new Error(`Question rule self-test failed: ${result.failed}/${result.total}`);
}
runDataBoundaryTests();
runUpgradeFeatureTests();
runPetRewardClaimTests();
runPetEconomyTests();
runTypeSettingsPersistenceTests();
runArchiveCloudCoverageTests();
runFineGrainedCloudMergeTests();
runAdaptiveRouteTests();
runQuestionSetDedupeTests();
runArchiveVersionTests();
runCoverageAndInsightTests();
runUtf8EncodingTests();
runInteractionBoundaryTests();
runTwoStepMulDivTests();
runVerticalQuestionTests();
runSpecialSetPurityTests();
runDecimalFormatTests();
runGradeAndDecimalDisplayTests();
runMultiStepWordProblemTests();
runLogicReadingQuestionTests();
runThinkingSkillQuestionTests();
runGeometryDiagramQuestionTests();
runHangzhouCurriculumMetadataTests();
runChineseSubjectIntegrationTests();
runEnglishSubjectIntegrationTests();

console.log(`Question rule self-test passed: ${result.total} samples, 0 failures.`);
console.log("Data boundary tests passed.");
console.log("Upgrade feature tests passed.");
console.log("Pet reward claim tests passed.");
console.log("Pet economy tests passed.");
console.log("Type settings persistence tests passed.");
console.log("Archive and cloud coverage tests passed.");
console.log("Question coverage and insight tests passed.");
console.log("Interaction boundary tests passed.");
console.log("Two-step multiplication/division tests passed.");
console.log("Vertical calculation tests passed.");
console.log("Special practice set purity tests passed.");
console.log("Decimal format tests passed.");
console.log("Grade boundary and decimal display tests passed.");
console.log("Multi-step word problem tests passed.");
console.log("Logic reading question tests passed.");
console.log("Thinking skill question tests passed.");
console.log("Geometry diagram question tests passed.");
console.log("Hangzhou curriculum metadata tests passed.");
console.log("Chinese subject integration tests passed.");
console.log("English subject integration tests passed.");
