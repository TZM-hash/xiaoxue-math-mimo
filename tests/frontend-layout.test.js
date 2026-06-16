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
assertContains(html, 'id="homeCockpitMeter"', "home should include a task cockpit meter");
assertContains(html, 'id="homeSettingsCard"', "mobile home should include the compact student/type summary card");
assertContains(html, 'id="knowledgeMapView"', "knowledge map should use a standalone report-style view");
assertContains(html, 'id="learningKnowledgeMap"', "knowledge map view should include the knowledge map mount");
assertContains(html, 'id="petStagePanelSlot"', "mobile pet growth modal should include a stage/quality slot");
assertContains(html, 'id="petShowcaseCard"', "pet space should include a visible showcase card");
assertContains(html, 'id="petShowcasePanelSlot"', "mobile pet plan menu should host the showcase card");
assertContains(html, 'id="petShopAdvisor"', "pet shop should include a recommendation panel");
assertContains(html, 'id="petDressupPreview"', "dressup modal should include a current display preview");
assertContains(html, 'data-open-pet-modal="themes"', "pet plan menu should include the theme shop entry");
assertContains(html, 'id="petThemeShopModal"', "pet plan should include a system theme shop modal");
assertContains(html, 'id="petAchievementBoard"', "achievement modal should include grouped progress board");
assertContains(html, 'data-open-learning-map', "learning modal should open knowledge map from a dedicated action");
assertContains(html, '题库质量巡检', "data page should expose question bank quality audit");
assertNotContains(html, 'id="wordRelationPanel"', "word relation training panel should be removed from the practice screen");
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
assertContains(app, "homeCockpitMeter: document.getElementById", "app should bind the home task cockpit meter");
assertContains(app, "homeSettingsCard: document.getElementById", "app should bind the mobile home summary card");
assertContains(app, "renderHomeSettingsCard", "app should render the mobile home summary card from current type settings");
assertNotContains(app, "renderWordRelationPanel", "app should not render the removed word relation training panel");
assertContains(app, "runQuestionQualityAudit", "app should expose a question bank quality audit");
assertContains(app, "window.mathCampQualityAudit", "quality audit should be available from the browser console");
assertContains(app, "renderLearningKnowledgeMap", "app should render the learning knowledge map");
assertContains(app, 'knowledgeMap: document.getElementById("knowledgeMapView")', "app should bind the standalone knowledge map view");
assertContains(app, "petLearningQuality", "app should bind pet growth to learning quality");
assertContains(app, "petExpression", "app should map pet state into visible expressions");
assertContains(app, "dataset.outfitIcon", "pet room should expose outfit icons on the visible pet");
assertContains(app, "dataset.expressionIcon", "pet room should expose expression icons on the visible pet");
assertContains(app, "movePetStageCard", "app should move the pet stage quality card into the mobile growth modal");
assertContains(app, "renderPetShowcase", "app should render pet display outcomes");
assertContains(app, "movePetShowcaseCard", "app should move pet showcase into mobile pet plan menu");
assertContains(app, "closePetModalWithReturn", "pet plan child modals should return to plan menu on close");
assertContains(app, "openLearningKnowledgeMap", "learning map should be opened from the learning modal action");
assertContains(app, 'showView("knowledgeMap")', "learning map button should jump to the standalone page");
assertContains(app, "renderPetShopAdvisor", "app should render pet shop recommendations");
assertContains(app, "renderPetDressupPreview", "app should render current dressup preview");
assertContains(app, "renderPetThemeShop", "app should render the system theme shop");
assertContains(app, "systemThemeOwned", "app should lock non-initial system themes behind pet growth");
assertContains(app, "renderPetAchievementBoard", "app should render grouped achievement progress");
assertContains(app, "dueWrongbook", "app should support scheduled wrongbook review");
assertContains(app, "startDueReviewPractice", "home review route should start due wrongbook practice");
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
assertContains(homeRoute, "reviewDue", "home route should include due review progress");
assertContains(dressupMeta, "window.MathCampPetDressupMeta", "装扮馆文案模块应暴露全局接口");
assertContains(dressupMeta, "unlockSourceText", "装扮馆文案模块应导出来源函数");
assertContains(dressupMeta, "unlockProgressText", "装扮馆文案模块应导出进度函数");

assertContains(css, ".home-route-list", "CSS 应包含首页路线网格");
assertContains(css, ".home-cockpit-meter", "CSS should style the home task cockpit");
assertContains(css, ".home-settings-card", "CSS should style the mobile home summary card");
assertContains(css, ".learning-map-panel", "CSS should style the learning knowledge map");
assertContains(css, "#knowledgeMapView .learning-map-grid", "knowledge map page should have report-style page layout CSS");
assertContains(css, ".pet-quality-panel", "CSS should style the pet learning quality panel");
assertContains(css, "pet-room-idle", "CSS should include pet daily idle animation");
assertContains(css, "[data-room-theme=\"forest\"]", "pet room should visibly react to selected room themes");
assertContains(css, "[data-decor-rug=\"true\"]", "pet room should visibly react to equipped furniture");
assertContains(css, "[data-expression=\"proud\"]", "pet room should visibly react to learning quality expressions");
assertContains(css, ".pet-showcase-card", "CSS should style the pet display showcase");
assertContains(css, "#petShowcasePanelSlot:empty", "empty mobile pet plan showcase slot should collapse");
assertContains(css, "#learningModal .hub-action-grid", "learning modal should support the knowledge map action");
assertContains(css, "#knowledgeMapView.view.active", "knowledge map view should share report-style scrolling behavior");
assertContains(css, ".pet-shop-advisor", "CSS should style the pet shop advisor");
assertContains(css, ".pet-dressup-preview", "CSS should style the dressup preview");
assertContains(css, ".pet-theme-shop-grid", "CSS should style the theme shop grid");
assertContains(css, ".pet-theme-shop-board", "CSS should style the theme shop progress board");
assertContains(css, ".pet-achievement-board", "CSS should style the achievement board");
assertContains(css, "#petspaceView.active #petGrowthPanelModal .pet-stage-card", "mobile growth modal should reveal the moved pet stage card");
assertNotContains(css, ".word-relation-panel", "CSS should not keep removed word relation panel styles");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) .home-settings-card", "mobile home should show the summary card only on the home state");
assertContains(css, ".home-route-step", "CSS 应包含首页路线步骤卡片");
assertContains(css, "grid-template-columns: repeat(4, minmax(0, 1fr));", "desktop/tablet home route should show four steps in one row");
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
