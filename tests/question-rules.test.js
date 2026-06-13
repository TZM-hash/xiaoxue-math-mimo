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
  "js/print-layout.js",
  "js/ui-feedback.js",
  "js/question-bank.js",
  "js/pet-economy.js",
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
  assert.strictEqual(debug.petDailyTasks.length, 4, "每日宠物任务应包含限时小测任务");
  assert(!debug.petDailyTasks.some((task) => task.id === "daily-special-5"), "每日任务不应包含专项练习");
  assert(debug.petDailyTasks.some((task) => task.id === "daily-quiz-1"), "每日任务应包含限时小测");
  assert.strictEqual(debug.petWeeklyTasks.length, 6, "每周宠物任务应包含闯关任务");
  assert(debug.petWeeklyTasks.some((task) => task.id === "weekly-challenge-2"), "每周任务应包含闯关通关目标");

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
  assert.strictEqual(timedTask.complete, true, "限时小测应计入每日限时任务");
}

function runPetEconomyTests() {
  const debug = context.mathCampDebug;
  const shopById = Object.fromEntries(debug.petShopCatalog.map((item) => [item.id, item]));
  const dailyById = Object.fromEntries(debug.petDailyTasks.map((task) => [task.id, task]));
  const tiers = new Set(debug.petShopCatalog.map((item) => item.tier));
  const twoDaysBasicCare = (shopById.basicFood.price + shopById.towel.price) * 2;
  const expectedDaily20Income = 20 * 2 + dailyById["daily-10"].reward + dailyById["daily-20"].reward;
  const wrongReviewBoost = dailyById["daily-wrong-3"].reward;

  assert(tiers.has("basic") && tiers.has("advanced") && tiers.has("rare"), "宠物商店应按基础、进阶、长期目标分层");
  assert.strictEqual(twoDaysBasicCare, 64, "两天基础照料成本应为 64 金币");
  assert.strictEqual(expectedDaily20Income, 62, "20 题全对加基础每日任务约为 62 金币");
  assert(expectedDaily20Income >= twoDaysBasicCare - 4 && expectedDaily20Income <= twoDaysBasicCare + 6, "20 题基础收益应约覆盖两天基础照料");
  assert.strictEqual(expectedDaily20Income + wrongReviewBoost, 74, "复习错题后应有明确结余");
  assert.strictEqual(shopById.renameCard.price, 100, "改名卡价格应稳定为 100 金币");
  assert(shopById.fishToy.price > expectedDaily20Income, "高级玩具不应一天基础练习就轻易买到");

  const rewardProfile = debug.normalizeProfile({ id: "reward-test", name: "Reward", grade: 2 });
  debug.state.profiles = [rewardProfile];
  debug.state.activeId = rewardProfile.id;
  debug.state.roundCoins = 0;
  assert.strictEqual(debug.awardQuestionReward(false, {}), 0, "答错题目不应奖励金币");
  assert.strictEqual(debug.petState(rewardProfile).coins, 0, "答错后宠物金币不应增加");
  assert.strictEqual(debug.awardQuestionReward(true, {}), 2, "答对普通题应奖励 2 金币");
  assert.strictEqual(debug.petState(rewardProfile).coins, 2, "答对后宠物金币应增加");

  const pet = debug.petState(debug.normalizeProfile({ id: "pet-care", name: "Care", grade: 2 }));
  assert.strictEqual(debug.petCareLeft(pet, "encourage"), 5, "每日摸摸应有收益次数上限");
  for (let index = 0; index < 5; index += 1) assert.strictEqual(debug.consumePetCare(pet, "encourage"), true, "上限内摸摸应获得收益");
  assert.strictEqual(debug.consumePetCare(pet, "encourage"), false, "超过上限后摸摸不应继续刷收益");
  assert.strictEqual(debug.petGrowthStage({ level: 1 }).name, "幼年招财", "1 级应是幼年阶段");
  assert.strictEqual(debug.petGrowthStage({ level: 6 }).name, "学霸招财", "6 级应解锁学霸阶段");
  assert.strictEqual(debug.safeThemeId("star"), "star", "星空主题应注册");
  assert.strictEqual(debug.safeThemeId("forest"), "forest", "森林主题应注册");
  assert.strictEqual(debug.safeThemeId("candy"), "candy", "糖果主题应注册");
  assert(debug.themeRegistry.star && debug.themeRegistry.forest && debug.themeRegistry.candy, "新增主题应存在于主题注册表");
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
  const points = Object.values(debug.pointMap);
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

const result = context.mathCampSelfTest(32);
if (result.failed) {
  console.error(JSON.stringify(result.failures.slice(0, 10), null, 2));
  throw new Error(`Question rule self-test failed: ${result.failed}/${result.total}`);
}
runDataBoundaryTests();
runUpgradeFeatureTests();
runPetEconomyTests();
runInteractionBoundaryTests();
runTwoStepMulDivTests();
runVerticalQuestionTests();
runSpecialSetPurityTests();
runDecimalFormatTests();
runGradeAndDecimalDisplayTests();

console.log(`Question rule self-test passed: ${result.total} samples, 0 failures.`);
console.log("Data boundary tests passed.");
console.log("Upgrade feature tests passed.");
console.log("Pet economy tests passed.");
console.log("Interaction boundary tests passed.");
console.log("Two-step multiplication/division tests passed.");
console.log("Vertical calculation tests passed.");
console.log("Special practice set purity tests passed.");
console.log("Decimal format tests passed.");
console.log("Grade boundary and decimal display tests passed.");
