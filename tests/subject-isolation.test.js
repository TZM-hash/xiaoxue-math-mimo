const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console, Date };
context.globalThis = context;
vm.createContext(context);

[
  "js/question-bank.js",
  "js/chinese-question-bank.js",
  "js/subject-registry.js"
].forEach((file) => {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(source, context, { filename: file });
});

const Subjects = context.window.MathCampSubjects;
assert(Subjects, "学科注册表应暴露为 MathCampSubjects");

const legacy = {
  id: "student-1",
  grade: 3,
  history: [{ pointId: "g3-mul-div", correct: true, grade: 3 }],
  wrongbook: [{ id: "wrong-1", question: { pointId: "g3-mul-div", grade: 3 } }],
  masteredWrong: [],
  mastery: { "g3-mul-div": { attempts: 1, correct: 1, level: 1, streak: 1 } },
  settings: { pointId: "g3-mul-div", setSize: 10 }
};

const migrated = Subjects.normalizeProfileSubjects(legacy);
assert.strictEqual(migrated.subjects.math.history.length, 1, "旧练习记录应迁移到数学");
assert.strictEqual(migrated.subjects.math.wrongbook.length, 1, "旧错题应迁移到数学");
assert.strictEqual(migrated.subjects.chinese.history.length, 0, "语文历史初始应为空");
assert.strictEqual(migrated.subjects.chinese.wrongbook.length, 0, "语文错题初始应为空");
assert.strictEqual(migrated.subjects.math.settings.pointId, "g3-mul-div", "数学设置应保留旧知识点");
assert.strictEqual(migrated.subjects.chinese.settings.pointId, "auto", "语文设置应从混合开始");

const profile = Subjects.normalizeProfileSubjects({ id: "student-2", grade: 4 });
Subjects.subjectState(profile, "math").history.push({ subject: "math", correct: true, pointId: "g4-mixed", grade: 4 });
Subjects.subjectState(profile, "chinese").history.push({ subject: "chinese", correct: false, pointId: "c4-modern-reading", grade: 4 });
assert.strictEqual(Subjects.subjectState(profile, "math").history.length, 1, "数学记录应独立保存");
assert.strictEqual(Subjects.subjectState(profile, "chinese").history.length, 1, "语文记录应独立保存");
assert.notStrictEqual(
  Subjects.subjectState(profile, "math").history[0].pointId,
  Subjects.subjectState(profile, "chinese").history[0].pointId,
  "数学和语文记录不应混用同一知识点"
);

console.log("Subject isolation tests passed.");
