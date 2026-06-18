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
const questionEnhancements = read("js/question-enhancements.js");
const cursorEffects = read("js/cursor-effects.js");
const timerFix = read("js/timer-fix.js");

assertContains(html, 'id="homeRouteList"', "首页应包含今日学习路线容器");
assertContains(html, 'id="homeCockpitMeter"', "home should include a task cockpit meter");
assertContains(html, 'id="homeSettingsCard"', "mobile home should include the compact student/type summary card");
assertContains(html, 'id="desktopPracticeOverview"', "desktop practice setup should have an overview panel instead of showing the question card");
assertContains(html, 'id="desktopOverviewWeakList"', "desktop overview should include weak-point chips");
assertContains(html, 'id="desktopOverviewStartBtn"', "desktop overview should include a direct start-practice action");
assertContains(html, 'data-jump="report"', "desktop overview should link to the learning report");
assertContains(html, 'data-open-learning-map', "desktop overview should link to the knowledge map");
assertContains(html, 'id="knowledgeMapView"', "knowledge map should use a standalone report-style view");
assertContains(html, 'id="learningKnowledgeMap"', "knowledge map view should include the knowledge map mount");
assertContains(html, 'id="petStagePanelSlot"', "mobile pet growth modal should include a stage/quality slot");
assertContains(html, 'id="petShowcaseCard"', "pet space should include a visible showcase card");
assertContains(html, 'id="petShowcasePanelSlot"', "mobile pet plan menu should host the showcase card");
assertContains(html, 'id="petShopAdvisor"', "pet shop should include a recommendation panel");
assertContains(html, 'id="petDressupPreview"', "dressup modal should include a current display preview");
assertNotContains(html, 'id="rippleContainer"', "global click ripple container should be removed");
assertContains(html, 'data-open-pet-modal="themes"', "pet plan menu should include the theme shop entry");
assertContains(html, 'pet-theme-shop-menu-entry', "theme shop menu entry should be targetable for mobile-only display");
assertContains(html, 'id="openPetThemeShopBtn"', "desktop pet space should include a direct theme shop button");
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
assertContains(app, "openPetThemeShopBtn", "desktop theme shop button should be wired to the theme shop modal");
assertNotContains(app, "initRippleEffect", "app should not register a global click ripple effect");
assertContains(app, 'startNewSet({ autoFocus: false })', "initial practice should stay on the online-practice setup page instead of entering focus mode");
assertContains(app, 'if (isCompactPracticeViewport()) {\n      setPracticeLayer("setup");\n      setTypeSettingsOpen(true);\n      rememberPracticeViewState();\n    }', "mobile/tablet cold launch should open the online-practice type settings page");
assertContains(app, 'document.body.classList.toggle("practice-return-visible", layer === "focus")', "all focused practice modes should use the challenge-style return bar");
assertContains(app, 'state.view === "practice" && window.matchMedia("(max-width: 1180px)").matches', "mobile/tablet practice rounds should default to focus layout");
assertContains(app, 'isCompactPracticeViewport() && mode === "step"', "tablet practice should hide step answering like mobile");
assertContains(app, "stepOption.hidden = compact", "custom answer mode picker should omit step answering on compact viewports");
assertContains(app, "function returnToPracticeSetup()", "practice return flow should be explicit");
assertContains(app, "setTypeSettingsOpen(false);", "practice return should restore the default online-practice home layout");
assertContains(app, "function closeTypeSettings()", "type settings return flow should be explicit");
assertContains(app, "function rememberPracticeViewState()", "practice tab should remember the state before switching away");
assertContains(app, "function restorePracticeViewState()", "practice tab should restore the previous online-practice state");
assertContains(app, "state.practiceReturnState", "practice state should be stored explicitly instead of inferred from viewport");
assertContains(app, "setPracticeLayer(\"setup\");", "the focused practice return button should go back to the practice home");
assertNotContains(app, "if (btn.dataset.view === \"practice\") setTypeSettingsOpen(false);", "practice tab should not discard the previous type-settings/home/focus state");
assertContains(app, "btn.dataset.view === \"practice\" && state.view === \"practice\" && document.body.classList.contains(\"type-settings-open\")", "clicking the current practice tab from type settings should return to the practice home");
assertContains(app, "restorePracticeViewState();", "practice tab returns should restore the saved online-practice layout");
assertContains(app, "const count = state.setSize;", "challenge rounds should use the configured per-round question count");
assertContains(app, "els.challengePanel?.addEventListener(\"click\"", "desktop challenge panel should start challenge from the whole entry");
assertContains(app, "window.scrollTo(0, 0);", "entering focused practice should not depend on a previous page scroll position");
assertContains(app, "开局主题", "theme shop should group starter themes like the dressup collection layout");
assertContains(app, "养成解锁", "theme shop should group unlockable themes like the dressup collection layout");
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
assertNotContains(questionEnhancements, "const isQuestionArea = e.target.closest", "clicking the practice card should not leave a full-screen focus blur overlay");
assertContains(cursorEffects, "particle.textContent = '★'", "valid click effect should use star burst particles");
assertNotContains(cursorEffects, "createRipple(x, y)", "valid click effect should not include a center ripple");
assertNotContains(cursorEffects, ".card, .tab-btn", "valid click effect should not treat ordinary cards as click targets");
assertNotContains(cursorEffects, "this.setupParticleTrail();", "cursor effects should not leave mouse trail particles outside click targets");
assertNotContains(timerFix, "#timerStat::before", "timer display should not add a pseudo element over the real time text");
assertContains(questionEnhancements, "document.querySelectorAll('.timer-progress-ring').forEach", "timer enhancement should remove the old ring overlay");

assertContains(css, ".home-route-list", "CSS 应包含首页路线网格");
assertContains(css, ".home-cockpit-meter", "CSS should style the home task cockpit");
assertContains(css, ".timer-progress-ring", "CSS should explicitly suppress the old timer ring overlay");
assertContains(css, ".home-settings-card", "CSS should style the mobile home summary card");
assertContains(css, ".learning-map-panel", "CSS should style the learning knowledge map");
assertContains(css, "#knowledgeMapView .learning-map-grid", "knowledge map page should have report-style page layout CSS");
assertContains(css, ".pet-quality-panel", "CSS should style the pet learning quality panel");
assertContains(css, "pet-room-idle", "CSS should include pet daily idle animation");
assertContains(css, "[data-room-theme=\"forest\"]", "pet room should visibly react to selected room themes");
assertContains(css, "[data-decor-rug=\"true\"]", "pet room should visibly react to equipped furniture");
assertContains(css, "[data-expression=\"proud\"]", "pet room should visibly react to learning quality expressions");
assertContains(css, ".pet-showcase-card", "CSS should style the pet display showcase");
assertContains(css, ".pet-space-actions", "CSS should style the direct pet action row");
assertContains(css, "#petspaceView.active .pet-space-actions .pet-plan-mobile-btn", "mobile/tablet pet actions should keep the plan menu entry");
assertContains(css, "#petspaceView.active .pet-space-actions", "desktop pet actions should support compact button grid");
assertContains(css, ".pet-theme-shop-direct-btn", "desktop pet actions should expose a theme shop button");
assertContains(css, ".pet-space-actions .pet-theme-shop-direct-btn", "tablet/mobile should hide the desktop theme shop action");
assertContains(css, "#petspaceView.active .pet-care-dashboard", "desktop pet care dashboard should have compact layout rules");
assertContains(css, "grid-template-columns: repeat(6, minmax(0, 1fr));", "desktop pet care dashboard should compress cards into one row");
assertContains(css, "#petShowcasePanelSlot:empty", "empty mobile pet plan showcase slot should collapse");
assertContains(css, "#learningModal .hub-action-grid", "learning modal should support the knowledge map action");
assertContains(css, "#knowledgeMapView.view.active", "knowledge map view should share report-style scrolling behavior");
assertContains(css, ".pet-shop-advisor", "CSS should style the pet shop advisor");
assertContains(css, ".pet-dressup-preview", "CSS should style the dressup preview");
assertContains(css, ".pet-theme-shop-grid", "CSS should style the theme shop grid");
assertContains(css, ".pet-theme-shop-board", "CSS should style the theme shop progress board");
assertContains(css, ".pet-plan-menu-grid .pet-theme-shop-menu-entry", "desktop/tablet pet plan menu should be able to hide the theme shop entry");
assertContains(css, "#petThemeShopModal .pet-collection-grid", "theme shop should share the dressup collection grid on mobile");
assertContains(css, ".pet-theme-shop-preview-swatch", "theme shop should include a dressup-style preview swatch");
assertContains(css, "body.pet-modal-open #petspaceView.view.active", "pet modals should not inherit view animation transforms");
assertContains(css, ".pet-achievement-board", "CSS should style the achievement board");
assertContains(css, "#petspaceView.active #petGrowthPanelModal .pet-stage-card", "mobile growth modal should reveal the moved pet stage card");
assertNotContains(css, ".word-relation-panel", "CSS should not keep removed word relation panel styles");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) .home-settings-card", "mobile home should show the summary card only on the home state");
assertContains(css, ".home-route-step", "CSS 应包含首页路线步骤卡片");
assertContains(css, "grid-template-columns: repeat(4, minmax(0, 1fr));", "desktop/tablet home route should show four steps in one row");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .home-dashboard", "mobile/tablet should show compact route on practice home");
assertContains(css, "body.practice-view-active.practice-focus-mode .home-dashboard", "desktop challenge/focus mode should keep the compact route header");
assertContains(css, "body.practice-view-active.practice-focus-mode .app", "desktop focused practice should be constrained to the viewport");
assertContains(css, "body.practice-view-active.practice-focus-mode .app-header {\n        display: grid;", "desktop focused practice should keep the top header visible");
assertContains(css, "body.practice-view-active.practice-focus-mode #practiceView", "desktop focused practice view should not require page scrolling");
assertContains(css, "body.practice-view-active.practice-focus-mode .status-strip .stat {\n        min-height: 34px;", "desktop focused practice status strip should stay compact across practice modes");
assertContains(css, "body.practice-view-active.practice-focus-mode .mission-card {\n        min-height: 38px;", "desktop focused practice mission cards should not reserve a large block");
assertContains(css, ".tab-btn[data-top-mode-action] {\n        display: none !important;", "desktop top challenge shortcut should be hidden");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .panel #challengePanel", "desktop type settings panel should expose the challenge mode entry");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .panel #challengePanel #startTimedQuizBtn", "desktop challenge entry should keep the left panel focused on challenge mode");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .desktop-practice-overview", "desktop practice setup should show the overview panel");
assertContains(css, "grid-template-columns: minmax(0, 1.1fr) minmax(0, .95fr) minmax(0, .95fr);", "desktop overview should use a dense three-column dashboard");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .overview-chip-list", "desktop overview should show compact weak-point chips");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-card {\n        display: none;", "desktop practice setup should hide the live question and companion before entering focus mode");
assertContains(css, "body:not(.practice-view-active) .home-dashboard", "non-practice desktop views should not show the practice route header");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) #practiceView", "desktop practice home should also stay inside the viewport after returning");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .main-stack", "desktop returned practice home should constrain the inner practice stack");
assertContains(css, ".home-mode-grid", "CSS should include mobile home mode card grid");
assertContains(css, ".tab-btn[data-top-mode-action] .nav-label-mobile", "mobile top mode action should reveal type settings label");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) #practiceView", "mobile home should hide the setup page until type settings opens");
assertContains(css, "body.practice-view-active.type-settings-open:not(.practice-focus-mode) .practice-workspace > .panel .setup-step-primary .field:first-child", "type settings page should show grade settings");
assertContains(css, "body.practice-view-active.type-settings-open:not(.practice-focus-mode) .practice-workspace > .panel .setup-set-size-field", "mobile type settings page should show per-round question count");
assertContains(css, ".practice-focus-mode .appendix-card", "tablet focus layout should control appendix challenge card visibility");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-card .companion-card", "desktop practice companion cards should expand instead of creating nested scrollbars");
assertContains(css, "@media (min-width: 621px) and (max-width: 1180px)", "tablet-specific layout rules should be present");
assertContains(css, "@media (min-width: 621px) and (max-width: 980px)", "tablet top navigation should have a dedicated breakpoint");
assertContains(css, ".tab-btn[data-top-mode-action]", "tablet navigation should be able to hide the redundant challenge button");
assertContains(css, "grid-template-columns: repeat(4, minmax(0, 1fr));", "tablet top navigation should fit the remaining four buttons in one row");
assertContains(css, ".practice-focus-mode .method-card,\n      .practice-focus-mode .appendix-card", "tablet practice companion should show method and appendix cards");
assertContains(css, "body.practice-view-active #practiceView.view.active.view-enter", "tablet practice view should not animate itself below the viewport on first load");
assertContains(css, "#petBagModal .pet-bag-grid", "tablet bag grid should avoid item overlap");
assertContains(css, "grid-template-columns: repeat(2, minmax(0, 1fr));", "tablet bag should use a stable two-column grid");
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
  "js/cursor-effects.js",
  "js/home-route.js",
  "js/question-enhancements.js",
  "js/pet-dressup-meta.js",
  "js/pet-economy.js",
  "js/question-bank.js"
].forEach((relativePath) => {
  const androidPath = path.join("android/app/src/main/assets/www", relativePath);
  assert.strictEqual(hash(relativePath), hash(androidPath), `${relativePath} should match Android asset mirror`);
});

console.log("Frontend layout contract tests passed.");
