const assert = require("assert");
const plan = require("../js/daily-learning-plan.js");

assert.deepStrictEqual(plan.allocate(10), { weak: 4, review: 3, current: 2, challenge: 1 });
assert.strictEqual(Object.values(plan.allocate(7)).reduce((sum, value) => sum + value, 0), 7);
assert.strictEqual(plan.currentTerm(new Date("2026-04-01T00:00:00Z")), "lower");
assert.strictEqual(plan.currentTerm(new Date("2026-10-01T00:00:00Z")), "upper");
assert.strictEqual(plan.masteryStatus({}, {}).id, "new");
assert.strictEqual(plan.masteryStatus({ attempts: 4, correct: 2, score: 48 }, {}).id, "weak");
assert.strictEqual(plan.masteryStatus({ attempts: 10, correct: 9, score: 86 }, {}).id, "mastered");

const diagnostic = plan.buildPlan({ profile: { grade: 3, history: [], mastery: {} }, grade: 3, subject: "math", setSize: 10, dueCount: 2, date: new Date("2026-04-01T00:00:00Z") });
assert.strictEqual(diagnostic.mode, "diagnostic");
assert.deepStrictEqual(diagnostic.allocations, { weak: 4, review: 3, current: 2, challenge: 1 });
assert.strictEqual(diagnostic.availableReview, 2);

const experienced = {
  grade: 3,
  history: Array.from({ length: 12 }, (_, index) => ({ grade: 3, subject: "math", correct: index % 2 === 0 })),
  mastery: { a: { attempts: 4 }, b: { attempts: 4 }, c: { attempts: 4 } }
};
assert.strictEqual(plan.buildPlan({ profile: experienced, grade: 3, subject: "math", setSize: 20 }).mode, "adaptive");

console.log("Daily learning plan tests passed.");
