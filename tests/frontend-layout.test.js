const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function hash(relativePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relativePath))).digest("hex");
}

function assertContains(source, fragment, message) {
  assert(source.includes(fragment), message || `Expected source to contain ${fragment}`);
}

function assertNotContains(source, fragment, message) {
  assert(!source.includes(fragment), message || `Expected source not to contain ${fragment}`);
}

const html = read("index.html");
const css = read("css/themes.css");
const app = read("js/app.js");
const homeRoute = read("js/home-route.js");
const dressupMeta = read("js/pet-dressup-meta.js");

assertContains(html, 'id="homeRouteList"', "首页应包含今日学习路线容器");
assertContains(html, 'id="homeSettingsCard"', "mobile home should include the compact student/type summary card");
assertContains(html, 'id="heroTitle">今日学习路线</h1>', "home hero title should be today's route");
assertContains(html, 'data-top-mode-action', "mobile top action should use the type setting entry");
assertContains(html, 'nav-label-mobile">⚙️ 题型设置</span>', "mobile top action should be labeled as type settings");
assertContains(html, 'class="home-mode-grid"', "mobile home should include mode cards");
assertContains(html, 'id="homeStartPracticeBtn"', "mobile home practice card should start a round");
assertContains(html, 'id="closeTypeSettingsBtn"', "type settings page should include a home return button");
assertNotContains(html, 'id="systemProfileGradeInput"', "system settings should not expose a separate grade selector");
assertContains(html, 'src="js/home-route.js"', "页面应加载今日学习路线模块");
assertContains(html, 'src="js/pet-dressup-meta.js"', "页面应加载装扮馆来源文案模块");

assertContains(app, "homeRouteList: document.getElementById", "app 应缓存首页路线 DOM");
assertContains(app, "homeSettingsCard: document.getElementById", "app should bind the mobile home summary card");
assertContains(app, "renderHomeSettingsCard", "app should render the mobile home summary card from current type settings");
assertContains(app, "practice-view-active", "app should expose current view state for responsive home route");
assertContains(app, "type-settings-open", "app should expose mobile type settings state");
assertContains(app, "handleTopModeAction", "top mode button should branch by mobile viewport");
assertContains(app, "homeStartPracticeBtn", "home practice card should have a click handler");
assertContains(app, "HomeRoute.buildTodayRoute", "首页路线应由拆分模块生成");
assertContains(app, "data-home-route", "首页路线按钮应有稳定动作标识");
assertContains(app, "PetDressupMeta.unlockSourceText", "装扮馆应使用来源文案模块");
assertContains(app, "pet-collection-source", "装扮馆卡片应渲染解锁来源");
assertContains(app, "pet-collection-progress", "装扮馆卡片应渲染解锁进度");
assertNotContains(app, "systemProfileGradeInput", "app should not bind removed system grade control");

assertContains(homeRoute, "window.MathCampHomeRoute", "今日学习路线模块应暴露全局接口");
assertContains(homeRoute, "buildTodayRoute", "今日学习路线模块应导出 buildTodayRoute");
assertContains(dressupMeta, "window.MathCampPetDressupMeta", "装扮馆文案模块应暴露全局接口");
assertContains(dressupMeta, "unlockSourceText", "装扮馆文案模块应导出来源函数");
assertContains(dressupMeta, "unlockProgressText", "装扮馆文案模块应导出进度函数");

assertContains(css, ".home-route-list", "CSS 应包含首页路线网格");
assertContains(css, ".home-settings-card", "CSS should style the mobile home summary card");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) .home-settings-card", "mobile home should show the summary card only on the home state");
assertContains(css, ".home-route-step", "CSS 应包含首页路线步骤卡片");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .home-dashboard", "mobile/tablet should show compact route on practice home");
assertContains(css, ".home-mode-grid", "CSS should include mobile home mode card grid");
assertContains(css, ".tab-btn[data-top-mode-action] .nav-label-mobile", "mobile top mode action should reveal type settings label");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) #practiceView", "mobile home should hide the setup page until type settings opens");
assertContains(css, "body.practice-view-active.type-settings-open:not(.practice-focus-mode) .practice-workspace > .panel .setup-step-primary .field:first-child", "type settings page should show grade settings");
assertContains(css, ".pet-collection-source", "CSS 应包含装扮馆来源文案样式");
assertContains(css, ".pet-collection-progress", "CSS 应包含装扮馆进度文案样式");
assertContains(css, "#petDressupModal .pet-collection-grid", "移动端装扮馆应保留网格布局覆盖");
assertContains(css, "grid-template-columns: repeat(2, minmax(0, 1fr));", "移动端装扮馆应支持每行两个");
assertContains(css, "#petShopModal .pet-shop-card", "移动端商店弹窗应有尺寸约束");
assertContains(css, "#petBagModal .pet-bag-card", "移动端背包弹窗应有尺寸约束");
assertContains(css, ".pet-bag-card .pet-bag-list", "背包滚动区应有布局约束");
assertContains(css, "min-height: 0;", "滚动区应允许底部详情显示");

[
  "index.html",
  "manifest.webmanifest",
  "css/themes.css",
  "js/app.js",
  "js/home-route.js",
  "js/pet-dressup-meta.js",
  "js/pet-economy.js",
  "js/question-bank.js"
].forEach((relativePath) => {
  const androidPath = path.join("android/app/src/main/assets/www", relativePath);
  assert.strictEqual(hash(relativePath), hash(androidPath), `${relativePath} should match Android asset mirror`);
});

console.log("Frontend layout contract tests passed.");
