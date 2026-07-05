const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const context = { window: {}, console };
context.globalThis = context;
vm.createContext(context);

const source = fs.readFileSync(path.join(root, "js/handwriting-input.js"), "utf8");
vm.runInContext(source, context, { filename: "js/handwriting-input.js" });

const api = context.window.MathCampHandwritingInput;
assert(api, "手写模块应暴露为 MathCampHandwritingInput");
const state = api.createEmptyState(300, 200);
state.strokes.push([{ x: 1, y: 2, pressure: 0.5 }, { x: 3, y: 4, pressure: 0.6 }]);
const packed = api.serialize(state);
assert.strictEqual(packed.width, 300);
assert.strictEqual(packed.height, 200);
assert.strictEqual(packed.strokes.length, 1);
assert.strictEqual(JSON.stringify(packed.strokes[0][0]), JSON.stringify({ x: 1, y: 2, pressure: 0.5 }));
api.clear(state);
assert.strictEqual(state.strokes.length, 0);
assert.strictEqual(state.undone.length, 0);

console.log("Handwriting input tests passed.");
