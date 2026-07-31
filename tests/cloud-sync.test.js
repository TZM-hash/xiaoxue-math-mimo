const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const storage = new Map();
const writes = [];
let profilesResult = { data: [], error: null };
let settingsResult = { data: [], error: null };
const quietConsole = { ...console, error() {} };

function makeQuery(table, operation = "select") {
  const query = {
    table,
    operation,
    selected: "",
    select(fields) {
      this.selected = fields;
      return this;
    },
    limit() { return this; },
    eq() { return this; },
    order() { return this; },
    upsert(payload) {
      writes.push({ table, payload });
      this.operation = "upsert";
      return this;
    },
    then(resolve, reject) {
      try {
        if (this.operation === "upsert") return Promise.resolve({ data: null, error: null }).then(resolve, reject);
        if (table === "user_data" && this.selected === "owner_id") {
          return Promise.resolve({ data: [], error: null }).then(resolve, reject);
        }
        const result = table === "user_data" ? profilesResult : settingsResult;
        return Promise.resolve(result).then(resolve, reject);
      } catch (error) {
        return Promise.reject(error).then(resolve, reject);
      }
    }
  };
  return query;
}

const context = {
  console: quietConsole,
  Date,
  Math,
  Promise,
  setTimeout: () => 0,
  clearTimeout() {},
  localStorage: {
    getItem: (key) => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  document: {
    createElement: () => ({ appendChild() {} }),
    head: { appendChild() {} },
    documentElement: { appendChild() {} }
  },
  supabase: {
    createClient: () => ({
      from(table) { return makeQuery(table); }
    })
  }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "js/cloud-sync.js"), "utf8"), context, { filename: "js/cloud-sync.js" });

(async () => {
  const CloudSync = context.window.MathCampCloudSync;
  assert(CloudSync, "cloud sync module should be exposed");
  assert.strictEqual(await CloudSync.initSupabase({ url: "https://example.supabase.co", anonKey: "test-key" }), true);

  const localProfiles = [{ id: "local", updatedAt: 10, history: [], wrongbook: [], masteredWrong: [] }];
  profilesResult = { data: null, error: { message: "temporary network failure" } };
  settingsResult = { data: [], error: null };
  writes.length = 0;

  const result = await CloudSync.fullSync(localProfiles, "local", { updatedAt: 10 });

  assert.strictEqual(result.syncError, true, "profile read failure should be surfaced as a sync error");
  assert.strictEqual(result.changed, false, "profile read failure should not apply cloud data");
  assert.deepStrictEqual(result.profiles, localProfiles, "profile read failure should keep local profiles in memory");
  assert.strictEqual(writes.some((write) => write.table === "user_data"), false, "profile read failure must not overwrite cloud profiles");

  profilesResult = { data: [], error: null };
  settingsResult = { data: [], error: null };
  writes.length = 0;
  const firstSync = await CloudSync.fullSync(localProfiles, "local", { updatedAt: 10 });
  assert.strictEqual(firstSync.syncError, false, "an empty cloud should be treated as a valid first sync");
  assert.strictEqual(writes.some((write) => write.table === "user_data"), true, "an empty cloud should receive the local profiles");
  console.log("Cloud sync failure-safety tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
