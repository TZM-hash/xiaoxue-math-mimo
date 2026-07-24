const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const assert = require("assert");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8").replace(/\r\n/g, "\n");
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

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert(start >= 0, `Expected source to contain function ${name}`);
  const next = source.indexOf("\n    function ", start + 1);
  return source.slice(start, next >= 0 ? next : source.length);
}

const html = read("index.html");
const manifest = read("manifest.webmanifest");
const cssFiles = [
  "css/theme-tokens.css",
  "css/app-shell.css",
  "css/practice.css",
  "css/pet-space.css",
  "css/reports-print.css",
  "css/responsive-overrides.css",
  "css/animations.css",
  "css/animations-enhanced.css",
  "css/effects-settings.css"
];
const visualPolishCss = fs.existsSync(path.join(root, "css/visual-polish.css")) ? read("css/visual-polish.css") : "";
const css = [...cssFiles.map(read), visualPolishCss].join("\n");
const mathQuestionMakers = read("js/math-question-makers.js");
const app = [read("js/app.js"), mathQuestionMakers].join("\n");
const runtimeConfig = read("js/runtime-config.js");
const cloudSync = read("js/cloud-sync.js");
const homeRoute = read("js/home-route.js");
const dressupMeta = read("js/pet-dressup-meta.js");
const questionEnhancements = read("js/question-enhancements.js");
const cursorEffects = read("js/cursor-effects.js");
const uiAnimations = read("js/ui-animations.js");
const animationIntegration = read("js/animation-integration.js");
const microInteractions = read("js/micro-interactions.js");
const effectsControlIntegrated = read("js/effects-control-integrated.js");
const visualPolish = fs.existsSync(path.join(root, "js/visual-polish.js")) ? read("js/visual-polish.js") : "";
const uiFeedback = read("js/ui-feedback.js");
const grade3ReferenceSeeds = read("js/grade3-reference-question-seeds.js");
const grade4ReferenceSeeds = read("js/grade4-reference-question-seeds.js");
const scienceQuestionGenerator = read("js/science-question-generator.js");
const chineseQuestionGenerator = read("js/chinese-question-generator.js");
const timerFix = read("js/timer-fix.js");
const questionGenerator = read("js/question-generator.js");
const questionBank = read("js/question-bank.js");
const questionBankCoverage = read("js/question-bank-coverage.js");
const learningInsights = read("js/learning-insights.js");
const learningQuality = read("js/learning-quality-engine.js");
const subjectRegistry = read("js/subject-registry.js");
const practiceEngine = read("js/practice-engine.js");
const reportModule = read("js/report.js");
const petModule = read("js/pet.js");
const petExperience = fs.existsSync(path.join(root, "js/pet-experience.js")) ? read("js/pet-experience.js") : "";
const importExportModule = read("js/import-export.js");
const questionSourceSummary = read("js/question-source-summary.js");
const packageJson = read("package.json");
const mojibakeTokens = ["\\u93c1", "\\u93b7", "\\u7edb", "\\u95bf", "\\u9983", "\\u8133", "\\u923f", "\\u9241", "\\u9286", "\\u4fd9", "\\u6992", "\\u5744", "\\u6624", "\\ufffd"];
const mojibake = new RegExp(mojibakeTokens.join("|") + "|\\?\\?\\?");

assertContains(html, 'id="homeRouteList"', "首页应包含今日学习路线容器");
assertContains(html, "<title>喵喵学习</title>", "页面标题应使用多学科应用名");
assertContains(html, 'aria-label="喵喵学习"', "顶部品牌应使用多学科应用名");
assertContains(manifest, '"name": "喵喵学习"', "PWA manifest 应使用多学科应用名");
assertContains(manifest, '"short_name": "喵喵学习"', "PWA manifest 短名称应使用多学科应用名");
assertNotContains(html, "喵喵数学", "页面可见品牌不应继续使用旧数学名称");
assertContains(html, 'id="homeCockpitMeter"', "home should include a task cockpit meter");
assertContains(html, 'id="homeSettingsCard"', "mobile home should include the compact student/type summary card");
assertContains(html, 'id="desktopPracticeOverview"', "desktop practice setup should have an overview panel instead of showing the question card");
assertContains(html, 'id="desktopOverviewWeakList"', "desktop overview should include weak-point chips");
assertContains(html, 'id="desktopOverviewStartBtn"', "desktop overview should include a direct start-practice action");
assertContains(html, 'data-jump="report"', "desktop overview should link to the learning report");
assertContains(html, 'data-open-learning-map', "desktop overview should link to the knowledge map");
assertContains(html, 'id="questionDiagram"', "practice card should include a mount for generated geometry diagrams");
assertContains(html, 'id="knowledgeMapView"', "knowledge map should use a standalone report-style view");
assertContains(html, 'id="learningKnowledgeMap"', "knowledge map view should include the knowledge map mount");
assertContains(html, 'id="petStagePanelSlot"', "mobile pet growth modal should include a stage/quality slot");
assertContains(html, 'id="petShowcaseCard"', "pet space should include a visible showcase card");
assertContains(html, 'src="js/pet-experience.js"', "页面应加载宠物体验增强模块");
assertContains(app, "data-pet-free-care", "今日照料应提供每日一次免费照料");
assertContains(app, "data-pet-daily-choice", "随机事件区域应提供每日陪伴选择");
assertContains(app, "data-pet-bell-slot", "宠物空间应提供低频找铃铛玩法");
assertContains(app, "data-pet-preview", "装扮卡片应支持即时预览");
assertContains(app, "pet-afford-progress", "商店物品应显示金币积累进度");
assertContains(petExperience, "function ensureStarterKit", "宠物体验模块应提供幂等开局礼包");
assertContains(petExperience, "function playBellGame", "宠物体验模块应提供每日轻量玩法");
assertContains(css, ".pet-room-stage[data-pet-state]", "宠物房间应根据状态强化视觉表现");
assertContains(css, ".pet-preview-active", "装扮预览应有明确视觉状态");
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
assertContains(html, 'data-start-logic-reading', "learning modal should include the logic reading training entry");
assertContains(html, '<strong>思维阅读训练</strong>', "learning modal should label the logic reading entry");
assertContains(html, '题库质量巡检', "data page should expose question bank quality audit");
assertContains(html, 'id="sourceAuditSummary"', "data page should expose question source audit summary");
assertContains(html, 'id="sourceAuditResult"', "data page should expose question source audit results");
assertContains(html, 'data-source-filter="reference"', "question source audit should filter reference-derived questions");
assertContains(html, 'data-source-filter="original"', "question source audit should filter original extension questions");
assertContains(html, 'data-source-filter="self-drawn"', "question source audit should filter self-drawn diagram questions");
assertContains(html, 'data-source-filter="scan"', "question source audit should filter scan-page rewrites");
assertContains(html, 'data-source-filter="pdf-image"', "question source audit should filter PDF screenshot questions");
assertContains(html, 'id="questionBankSubjectFilter"', "question bank manager should filter by subject");
assertContains(html, 'id="questionBankGradeFilter"', "question bank manager should filter by grade");
assertContains(html, 'id="questionBankPointFilter"', "question bank manager should filter by point");
assertContains(html, 'id="testSupabaseConfigBtn"', "cloud sync settings should include a connection test button");
assertNotContains(html, 'id="wordRelationPanel"', "word relation training panel should be removed from the practice screen");
assertContains(html, 'id="heroTitle">今日学习路线</h1>', "home hero title should be today's route");
assertContains(html, 'data-top-mode-action', "mobile top action should use the type setting entry");
assertContains(html, 'nav-label-mobile">⚙️ 题型设置</span>', "mobile top action should be labeled as type settings");
assertContains(html, 'data-open-subject', "top navigation should include the subject selector entry");
assertContains(html, 'document.documentElement.dataset.subject', "page should initialize the saved subject before app startup");
assertContains(html, 'mathcamp-selected-subject-v1', "page should read the persisted subject during first paint");
assertContains(html, 'id="subjectModal"', "page should include a subject selector modal");
assertContains(html, 'data-subject-choice="chinese"', "subject selector should include Chinese");
assertContains(html, 'data-subject-choice="math"', "subject selector should include math");
assertContains(html, 'data-subject-choice="english"', "subject selector should include English");
assertContains(html, 'data-subject-choice="science"', "subject selector should include science");
assertNotContains(html, 'id="handwritingOverlay"', "page should not include fullscreen handwriting overlay without OCR");
assertNotContains(html, 'id="handwritingCanvas"', "page should not include a handwriting canvas without OCR");
assertNotContains(html, 'value="handwriting"', "answer mode selector should remove handwriting");
assertContains(html, 'class="home-mode-grid"', "mobile home should include mode cards");
assertContains(html, 'id="homeStartPracticeBtn"', "mobile home practice card should start a round");
assertContains(html, '<span>今日练习</span>', "首页主练习入口应保持轻量的一键今日练习");
assertContains(html, '<strong>开始今日练习</strong>', "首页主练习入口应让用户一键开始");
assertContains(html, 'id="floatingPetAssistant"', "移动/平板应包含悬浮招财助手容器");
assertContains(html, 'id="floatingPetButton"', "悬浮招财应有可点击可拖动的猫咪入口");
assertContains(html, 'id="floatingPetPanel"', "悬浮招财应有弹窗风格提示面板");
assertContains(html, 'data-floating-pet-action="hint"', "悬浮招财面板应包含提示动作");
assertContains(html, 'data-floating-pet-action="explain"', "悬浮招财面板应包含讲一下动作");
assertContains(html, 'data-floating-pet-action="cause"', "悬浮招财面板应包含错因建议动作");
assertContains(html, 'id="closeTypeSettingsBtn"', "type settings page should include a home return button");
assertNotContains(html, 'id="systemProfileGradeInput"', "system settings should not expose a separate grade selector");
assertContains(html, 'src="js/home-route.js"', "页面应加载今日学习路线模块");
assertContains(html, 'src="js/pet-dressup-meta.js"', "页面应加载装扮馆来源文案模块");
assertContains(html, 'src="js/runtime-config.js"', "page should load runtime defaults before feature modules");
assertContains(html, 'src="js/question-bank-coverage.js"', "page should load the question-bank coverage module");
assertContains(html, 'src="js/chinese-curriculum-data.js"', "页面应加载语文教材知识库");
assertContains(html, 'src="js/chinese-question-bank.js"', "页面应加载语文题库");
assertContains(html, 'src="js/english-curriculum-data.js"', "页面应加载英语教材知识库");
assertContains(html, 'src="js/english-question-bank.js"', "页面应加载英语题库");
assertContains(html, 'src="js/science-curriculum-data.js"', "页面应加载科学教材知识库");
assertContains(html, 'src="js/science-question-bank.js"', "页面应加载科学题库");
assertContains(html, 'src="js/subject-registry.js"', "页面应加载学科注册表");
assertContains(html, 'src="js/chinese-question-generator.js"', "页面应加载语文题目生成器");
assertContains(html, 'src="js/question-spec-utils.js"', "页面应加载选择题规格工具");
assertContains(html, 'src="js/grade2-reference-source-meta.js"', "页面应加载二年级资料来源清单");
assertContains(html, 'src="js/grade2-reference-scan-index.js"', "页面应加载二年级资料逐页扫描索引");
assertContains(html, 'src="js/grade2-reference-question-seeds.js"', "页面应加载二年级资料派生题源");
assertContains(html, 'src="js/grade2-original-question-seeds.js"', "页面应加载二年级原创扩展题源");
assertContains(html, 'src="js/grade3-reference-source-meta.js"', "页面应加载三年级资料来源清单");
assertContains(html, 'src="js/grade3-reference-scan-index.js"', "页面应加载三年级资料逐页扫描索引");
assertContains(html, 'src="js/grade3-reference-question-seeds.js"', "页面应加载三年级资料派生题源");
assertContains(html, 'src="js/grade3-original-question-seeds.js"', "页面应加载三年级原创扩展题源");
assertContains(html, 'src="js/grade4-reference-source-meta.js"', "页面应加载四年级资料来源清单");
assertContains(html, 'src="js/grade4-reference-scan-index.js"', "页面应加载四年级资料逐页扫描索引");
assertContains(html, 'src="js/grade4-reference-question-seeds.js"', "页面应加载四年级资料派生题源");
assertContains(html, 'src="js/grade4-original-question-seeds.js"', "页面应加载四年级原创扩展题源");
assertContains(html, 'src="js/external-question-seeds.js"', "页面应加载扩展题源模块");
assertContains(html, 'src="js/english-question-generator.js"', "页面应加载英语题目生成器");
assertContains(html, 'src="js/science-question-generator.js"', "页面应加载科学题目生成器");
assertNotContains(html, 'src="js/handwriting-input.js"', "页面不应加载手写输入模块");
assertContains(html, 'src="js/learning-insights.js"', "page should load learning insight diagnostics");
assertNotContains(html, "supabase.min.js", "Supabase SDK should not be loaded during offline-first startup");
assertContains(html, 'id="cloudSyncDetail"', "云同步设置应包含同步详情页");
assertContains(html, 'id="setSizeInput" type="number" min="3" max="100"', "每轮题量输入框应允许设置到 100 题");
assertNotContains(html, 'id="reportGoal"', "学习报告顶部应移除重复的今日目标指标");
assertNotContains(html, 'id="reportChallenge"', "学习报告顶部应移除重复的关卡指标");
assertNotContains(html, 'id="reportStreak"', "学习报告顶部应移除连续天数指标");
assertNotContains(html, 'report-more-card', "学习报告应直接删除低频细节区，而不是折叠隐藏");
assertContains(html, 'id="reportWeakList"', "学习报告应保留薄弱点优先级摘要");
assertContains(html, 'id="reportCauseSummary"', "学习报告应保留错因摘要");
assertContains(html, 'id="reportTrendSummary"', "学习报告应保留趋势摘要");
assertContains(html, 'id="reportParentCoach"', "学习报告应包含家长诊断卡");
assertContains(html, 'report-visual-card', "学习报告应包含图形概览卡填充桌面空间");
assertContains(html, 'id="reportAccuracyDonut"', "学习报告图形概览应包含正确率圆环");
assertContains(html, 'id="reportTopicBars"', "学习报告图形概览应包含题型构成条形图");
assertContains(html, 'id="reportRhythmDots"', "学习报告图形概览应包含本周节奏点阵");
assertNotContains(html, 'id="rewardGrid"', "学习报告不应保留奖励徽章列表");
assertNotContains(html, 'id="weekGrid"', "学习报告不应保留近 7 天柱状图");
assertNotContains(html, 'id="historyList"', "学习报告不应保留最近记录列表");
assertContains(html, 'src="js/question-generator.js"', "页面应加载拆分后的题目生成模块");
assertContains(html, 'src="js/question-source-summary.js"', "页面应加载题目来源统计模块");
assertContains(html, 'src="js/practice-engine.js"', "页面应加载拆分后的练习引擎模块");
assertContains(html, 'src="js/learning-quality-engine.js"', "页面应加载学习质量引擎模块");
assertContains(html, '<option value="glass-clear">', "主题设置应提供清透玻璃主题");
assertContains(html, '<option value="glass-pop">', "主题设置应提供缤纷玻璃主题");
assertContains(css, ':root[data-theme="glass-clear"]', "主题令牌应定义清透玻璃主题");
assertContains(css, ':root[data-theme="glass-pop"]', "主题令牌应定义缤纷玻璃主题");
assertContains(css, 'backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));', "毛玻璃主题应使用统一背景模糊和饱和度令牌");
assertContains(css, 'radial-gradient(circle at 14% 12%', "毛玻璃主题背景应包含柔和光球");
assertContains(html, 'href="css/visual-polish.css"', "页面应加载统一视觉精修样式");
assertContains(html, 'src="js/visual-polish.js"', "页面应加载统一视觉精修控制器");
assertContains(css, "--motion-fast: 150ms", "视觉系统应统一快速交互时长");
assertContains(css, "--elevation-raised", "视觉系统应提供统一悬浮阴影层级");
assertContains(css, "--glass-layer-content", "毛玻璃主题应区分内容层玻璃强度");
assertContains(css, "font-variant-numeric: tabular-nums", "统计数字应使用等宽数字避免跳动");
assertContains(css, ":focus-visible", "控件应提供统一键盘聚焦状态");
assertContains(css, ".theme-transitioning", "主题切换应提供平滑过渡状态");
assertContains(css, ".answer-feedback-good", "答对状态应提供专用视觉反馈");
assertContains(css, '.floating-pet-assistant[data-reaction="correct"]', "悬浮猫咪应响应答对状态");
assertContains(css, ".effects-performance-low", "低性能设备应降低模糊和环境动画");
assertContains(css, "@media (prefers-reduced-motion: reduce)", "视觉系统应尊重系统减少动态效果设置");
assertContains(css, "--depth-card-rest", "立体视觉应提供统一卡片承托阴影");
assertContains(css, "--depth-control-inset", "立体视觉应提供输入控件内凹阴影");
assertContains(css, ".depth-surface", "立体视觉应使用不改变布局的共享表面规则");
assertContains(css, "box-shadow: var(--depth-control-inset)", "输入框应使用内凹立体效果");
assertContains(css, "html.android-webview", "Android 应使用简化立体阴影避免性能负担");
assertContains(css, ".answer-option[aria-pressed=\"true\"]", "选中答案应提供明确立体高光");
assertContains(css, ".enhanced-input-wrapper .input-indicator", "增强输入框的指示线应保持在内凹表面上方");
assertContains(css, "transform: scaleX(0)", "输入指示线应使用不影响布局的缩放过渡");
assertContains(visualPolish, "function classifyPerformance", "视觉控制器应判断设备性能等级");
assertContains(visualPolish, "MutationObserver", "视觉控制器应监听主题和答题状态变化");
assertContains(visualPolish, "dataset.reaction", "视觉控制器应驱动悬浮猫咪状态动画");
assertContains(visualPolish, "visual-polish-ready", "视觉控制器初始化后应暴露就绪状态");
assertContains(html, 'id="confidenceControl"', "练习页应提供可选答题信心控件");
assertNotContains(html, 'id="readAloudBtn"', "练习页不应保留通用读题按钮");
assertNotContains(app, "function readQuestionAloud", "应用不应保留通用整题朗读功能");
assertContains(html, 'id="startWeakReportBtn">生成周复习', "学习报告应复用现有入口提供周复习组卷");
assertContains(html, 'data-confidence="sure"', "答题信心控件应包含确定选项");
assertContains(html, 'data-confidence="unsure"', "答题信心控件应包含不确定选项");
assertContains(html, 'data-confidence="guess"', "答题信心控件应包含猜测选项");
assertContains(css, ".confidence-control", "答题信心控件应有稳定布局样式");
assertContains(app, "questionStartedAt", "答题流程应记录单题开始时间");
assertContains(app, "selectedConfidence", "答题流程应记录可选信心值");
assertContains(app, "hintLevel", "答题流程应记录最高提示等级");
assertContains(learningQuality, "function updateMasteryState", "学习质量引擎应提供掌握度更新函数");
assertContains(html, 'src="js/question-rules-engine.js"', "页面应加载拆分后的题目规则引擎");
assertContains(html, 'src="js/question-interaction.js"', "页面应加载拆分后的答题交互模块");
assertContains(html, 'src="js/report.js"', "页面应加载拆分后的报告模块");
assertContains(html, 'src="js/pet.js"', "页面应加载拆分后的宠物模块");
assertContains(html, 'src="js/import-export.js"', "页面应加载拆分后的导入导出模块");

assertContains(app, "homeRouteList: document.getElementById", "app 应缓存首页路线 DOM");
assertContains(app, "homeCockpitMeter: document.getElementById", "app should bind the home task cockpit meter");
assertContains(app, "homeSettingsCard: document.getElementById", "app should bind the mobile home summary card");
assertContains(app, "renderHomeSettingsCard", "app should render the mobile home summary card from current type settings");
assertContains(app, "activeSubjectId", "app should expose active subject helper");
assertContains(app, "activeLearning", "app should read subject-scoped learning data");
assertContains(app, "activeBank", "app should read subject-scoped question bank");
assertNotContains(app, "openHandwritingMode", "app should remove fullscreen handwriting mode");
assertNotContains(app, "submitHandwritingAnswer", "app should remove handwriting submit flow");
assertContains(app, "normalizeTextAnswer", "app should support Chinese text answer matching");
assertContains(app, "structuredQuestionTitleHTML", "non-choice Chinese and data question text should be structured into readable lines");
assertContains(functionBody(app, "renderQuestionTitle"), "structuredQuestionTitleHTML(question)", "practice question rendering should format ordinary long prompts instead of dumping one oversized line");
assertContains(app, "function hasAudioPrompt", "app should detect questions with playable English audio prompts");
assertContains(app, "function speakQuestionPrompt", "app should speak English audio prompts through system TTS");
assertContains(app, "speechSynthesis", "app should use the browser or WebView speechSynthesis API for English pronunciation");
assertContains(app, "data-audio-prompt-play", "practice question rendering should include a play button for audio-prompt questions");
assertNotContains(app, "renderWordRelationPanel", "app should not render the removed word relation training panel");
assertContains(app, "runQuestionQualityAudit", "app should expose a question bank quality audit");
assertContains(app, "window.mathCampQualityAudit", "quality audit should be available from the browser console");
assertContains(app, "function runQuestionSourceAudit", "app should expose a question source audit");
assertContains(app, "window.mathCampQuestionSourceAudit", "question source audit should be available from the browser console");
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
assertContains(app, "function readingPointForGrade", "app should resolve grade-specific logic reading points");
assertContains(app, "function startLogicReadingTraining", "app should start logic reading training from the learning modal");
assertContains(app, "data-start-logic-reading", "app should wire the logic reading training entry");
assertContains(app, "makeReading", "app should generate dedicated logic reading questions");
assertContains(app, "function normalizeQuestionDiagram", "app should sanitize generated geometry diagrams");
assertContains(app, "function normalizeQuestionSourceImage", "app should sanitize PDF screenshot question images");
assertContains(app, "assets\\/reference\\/(?:grade2|grade3|grade4)\\/", "PDF screenshot image sanitizer should allow grade2, grade3, and grade4 reference assets");
assertContains(app, "function renderQuestionDiagram", "app should render generated geometry diagrams");
assertContains(app, "question-source-image", "practice rendering should mount PDF screenshot question images");
assertContains(app, '"grid-shape"', "app should allow grid-shape geometry diagrams");
assertContains(app, '"block-view"', "app should allow block-view geometry diagrams");
assertContains(app, '"motion-grid"', "app should allow motion-grid geometry diagrams");
assertContains(app, '"circle-ring"', "app should allow circle-ring geometry diagrams");
assertContains(app, '"angle-measure"', "app should allow angle-measure geometry diagrams");
assertContains(app, '"polygon-shape"', "app should allow polygon-shape geometry diagrams");
assertContains(app, '"polygon-area"', "app should allow polygon-area geometry diagrams");
assertContains(app, '"symmetry-grid"', "app should allow symmetry-grid geometry diagrams");
assertContains(app, '"rotation-grid"', "app should allow rotation-grid geometry diagrams");
assertContains(app, '"solid-net"', "app should allow solid-net geometry diagrams");
assertContains(app, '"three-view"', "app should allow three-view geometry diagrams");
assertContains(app, '"route-map"', "app should allow route-map geometry diagrams");
assertContains(app, '"cylinder-cone"', "app should allow cylinder-cone geometry diagrams");
assertContains(app, '"sector-shape"', "app should allow sector-shape geometry diagrams");
assertContains(app, "function renderDiagramGridShape", "app should render grid counting diagrams");
assertContains(app, "function renderDiagramBlockView", "app should render observation-object diagrams");
assertContains(app, "function renderDiagramMotionGrid", "app should render shape motion diagrams");
assertContains(app, "function renderDiagramCircleRing", "app should render circle ring diagrams");
assertContains(app, "function renderDiagramAngleMeasure", "app should render angle measurement diagrams");
assertContains(app, "function renderDiagramPolygonShape", "app should render polygon feature diagrams");
assertContains(app, "function renderDiagramPolygonArea", "app should render polygon area diagrams");
assertContains(app, "function renderDiagramSymmetryGrid", "app should render symmetry diagrams");
assertContains(app, "function renderDiagramRotationGrid", "app should render rotation diagrams");
assertContains(app, "function renderDiagramSolidNet", "app should render solid net diagrams");
assertContains(app, "function renderDiagramThreeView", "app should render three-view diagrams");
assertContains(app, "function renderDiagramRouteMap", "app should render route map diagrams");
assertContains(app, "function renderDiagramCylinderCone", "app should render cylinder/cone diagrams");
assertContains(app, "function renderDiagramSectorShape", "app should render sector diagrams");
assertContains(app, "renderQuestionDiagram(current)", "practice rendering should update the geometry diagram per question");
assertContains(app, "function makeThinking", "app should generate classified thinking-skill questions");
assertContains(app, "thinking: makeThinking", "question generation should route thinking points to the thinking maker");
assertContains(app, "templateType: \"估算合理性\"", "thinking maker should classify estimation questions");
assertContains(app, "templateType: \"找错改错\"", "thinking maker should classify correction questions");
assertContains(app, "templateType: \"生活阅读\"", "thinking maker should classify life-reading questions");
assertContains(app, "templateType: \"可能性\"", "thinking maker should classify probability questions");
assertContains(app, "templateType: \"干扰条件推理\"", "thinking maker should classify distractor reasoning questions");
assertContains(app, "function curriculumBrief", "app should render textbook unit metadata for knowledge points");
assertContains(app, "function curriculumSelectLabel", "app should render textbook-aware knowledge labels");
assertContains(app, "function curriculumSelectShortLabel", "knowledge selectors should use compact textbook labels");
assertContains(app, "function curriculumPointLabel", "selected knowledge summaries should use textbook-aware labels");
assertContains(app, "pointOptionsHTML(wrongGrade, wrongPoint", "wrongbook knowledge filter should reuse textbook-aware point options");
assertContains(app, "全部知识点", "wrongbook knowledge filter should keep the all option concise");
assertNotContains(app, 'opts.push(`<optgroup', "knowledge selectors should not split options into semester groups");
assertNotContains(app, "function curriculumSelectGroup", "knowledge selectors should not keep a semester grouping helper");
assertContains(app, "withCurriculumProfile", "knowledge detail should include Hangzhou textbook alignment");
assertContains(app, "curriculumHelperText(row.point)", "knowledge map should show textbook unit context");
assertContains(app, 'state.mode === "logic-reading" ? "思维阅读训练"', "practice mode tag should label logic reading training");
assertContains(app, 'topic === "reading" ? "思维阅读"', "report topic bars should localize logic reading");
assertContains(app, 'thinking: "思维精进"', "report topic bars should localize thinking-skill practice");
assertContains(app, "renderPetShopAdvisor", "app should render pet shop recommendations");
assertContains(app, "renderPetDressupPreview", "app should render current dressup preview");
assertContains(app, "renderPetThemeShop", "app should render the system theme shop");
assertContains(app, "systemThemeOwned", "app should lock non-initial system themes behind pet growth");
assertContains(app, "openPetThemeShopBtn", "desktop theme shop button should be wired to the theme shop modal");
assertNotContains(app, "initRippleEffect", "app should not register a global click ripple effect");
assertContains(app, 'startNewSet({ autoFocus: false })', "initial practice should stay on the online-practice home page instead of entering focus mode");
assertNotContains(app, 'startNewSet({ focus: window.matchMedia("(max-width: 1180px)").matches })', "cold launch should not auto-enter the focused question mode");
assertContains(app, 'document.body.classList.toggle("practice-return-visible", layer === "focus")', "all focused practice modes should use the challenge-style return bar");
assertContains(app, 'state.view === "practice" && window.matchMedia("(max-width: 1180px)").matches', "mobile/tablet practice rounds should default to focus layout");
assertContains(app, 'els.startSetBtn.addEventListener("click", () => startNewSet({ focus: true }))', "primary generated practice should enter focused layout on desktop");
assertContains(app, 'els.desktopOverviewStartBtn?.addEventListener("click", () => startNewSet({ focus: true }))', "desktop overview generated practice should enter focused layout");
assertContains(app, 'els.homeStartPracticeBtn?.addEventListener("click", () => startSmartDailyPractice({ focus: true }))', "home practice card should start the smart daily practice without extra choices");
assertContains(app, "function startSmartDailyPractice", "app should expose a lightweight smart daily practice entry");
assertContains(app, "function buildSmartDailyQuestionSet", "app should build a mixed one-click daily set");
assertContains(app, "function recordReviewSourceAttempt", "daily review variants should update the source wrong item automatically");
assertContains(app, "function buildParentWeeklyPrompt", "report should include one short parent-facing weekly prompt");
assertContains(app, "function roundPetSummary", "round completion should include a one-sentence pet coach summary");
assertContains(app, 'isCompactPracticeViewport() && mode === "step"', "tablet practice should hide step answering like mobile");
assertContains(app, "stepOption.hidden = compact", "custom answer mode picker should omit step answering on compact viewports");
assertContains(app, 'const nonMath = activeSubjectId() !== "math";', "非数学学科都应隐藏分步作答");
assertContains(app, "stepOption.hidden = compact || nonMath", "非数学学科应隐藏分步作答");
assertContains(functionBody(app, "startPointSet"), "enterPracticeFocus();", "knowledge, weak-point, appendix, hard-word, and logic-reading practice should enter focused layout");
assertContains(functionBody(app, "startWrongbookPractice"), "enterPracticeFocus();", "wrongbook and review practice should enter focused layout");
assertContains(functionBody(app, "resumeChallengeSet"), "enterPracticeFocus();", "resumed challenge practice should enter focused layout");
assertContains(functionBody(app, "startChallengeSet"), "enterPracticeFocus();", "challenge practice should enter focused layout");
assertContains(functionBody(app, "startTimedQuizSet"), "enterPracticeFocus();", "timed quiz practice should enter focused layout");
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
assertContains(app, "renderCloudSyncSummary", "app 应渲染云同步详情");
assertContains(app, "MathCampQuestionGenerator.makeQuestion", "app 应委托题目生成模块生成题目");
assertContains(app, "MathCampPracticeEngine.buildAdaptiveQuestionSet", "app 应委托练习引擎生成自适应题组");
assertContains(app, "MathCampReport.buildReportModel", "app 应委托报告模块计算报告数据");
assertContains(app, "MathCampPet.taskState", "app 应委托宠物模块计算任务状态");
assertContains(app, "MathCampImportExport.buildArchiveData", "app 应委托导入导出模块构建存档");
assertContains(app, "MathCampImportExport.parseImportBackup", "app 应委托导入导出模块解析存档");
assertContains(app, "renderReportWeakSummary", "学习报告应渲染薄弱点摘要");
assertContains(app, "renderReportCauseSummary", "学习报告应渲染错因摘要");
assertContains(app, "renderReportTrendSummary", "学习报告应渲染趋势摘要");
assertContains(app, "renderReportVisualSummary", "学习报告应渲染图形概览");
assertNotContains(app, "data-daily-plan", "学习报告不应保留多步处方入口");
assertNotContains(app, "systemProfileGradeInput", "app should not bind removed system grade control");

assertContains(homeRoute, "window.MathCampHomeRoute", "今日学习路线模块应暴露全局接口");
assertContains(homeRoute, "buildTodayRoute", "今日学习路线模块应导出 buildTodayRoute");
assertContains(homeRoute, "reviewDue", "home route should include due review progress");
assertContains(dressupMeta, "window.MathCampPetDressupMeta", "装扮馆文案模块应暴露全局接口");
assertContains(dressupMeta, "unlockSourceText", "装扮馆文案模块应导出来源函数");
assertContains(dressupMeta, "unlockProgressText", "装扮馆文案模块应导出进度函数");
assertContains(questionGenerator, "window.MathCampQuestionGenerator", "题目生成模块应暴露全局接口");
assertContains(questionGenerator, "makeQuestion", "题目生成模块应导出 makeQuestion");
assertContains(runtimeConfig, "ANDROID_DEFAULT_EFFECTS", "runtime config should define Android-specific effect defaults");
assertContains(runtimeConfig, "cursorEffects: false", "Android defaults should disable cursor effects");
assertContains(cloudSync, "ensureSupabaseSdk", "cloud sync should lazy-load the Supabase SDK");
assertContains(cloudSync, "loading-sdk", "cloud sync should expose SDK loading status");
assertContains(cloudSync, "testConnection", "cloud sync should expose a lightweight connection test");
assertContains(cloudSync, "pendingProfilePush", "cloud sync should retain the latest failed profile payload for retry");
assertContains(cloudSync, "pushProfiles(pending.profiles, pending.activeId)", "cloud sync retry timer should perform a real profile push");
assertContains(cloudSync, "scheduleRetry(profiles, activeId, sequence)", "failed profile pushes should schedule their payload for retry");
assertContains(questionSourceSummary, "summarizeQuestionSources", "question source summary module should export source summary helper");
assertContains(app, "roundQuestionSourceSummary", "finish summary should expose round source statistics");
assertContains(app, "questionBankAuditFilterFromUI", "question bank audit should combine source, subject, grade and point filters");
assertContains(packageJson, '"docs:generate"', "package should expose readable docs generation command");
assertContains(packageJson, '"reference:inventory"', "package should expose reference inventory command");
assertContains(packageJson, '"assets:report"', "package should expose asset size report command");
assertContains(questionBankCoverage, "buildCoverageReport", "question coverage module should export a coverage report builder");
assertContains(learningInsights, "buildWeakPointInsights", "learning insight module should export weak-point recommendations");
assertContains(app, "LearningInsights", "app should consume the learning insight module");
assertContains(app, "function recommendCauseForQuestion", "app should infer a recommended mistake cause after a wrong answer");
assertContains(app, "function petCoachForCause", "app should turn 招财 into a subject-aware study assistant");
assertContains(app, "function buildParentDiagnosis", "app should build a parent-facing diagnosis from mistakes");
assertContains(app, "renderParentDiagnosis", "app should render the parent diagnosis card in the report");
assertContains(app, "floatingPetAssistant: document.getElementById", "app should bind the floating pet assistant");
assertContains(app, "function normalizeFloatingPetPosition", "floating pet should clamp and snap its draggable position");
assertContains(app, "function applyFloatingPetPosition", "floating pet should apply remembered position");
assertContains(app, "function openFloatingPetPanel", "floating pet should open a popup-style action panel");
assertContains(app, "function handleFloatingPetAction", "floating pet should route hint/explain/cause actions");
assertContains(app, "function shouldShowFloatingPetAssistant", "floating pet should only appear in mobile/tablet focused practice");
assertContains(app, "function floatingPetCareAlert", "floating pet should detect low care state before prompting");
assertContains(app, "data-floating-pet-care-action=\"petspace\"", "floating pet care prompt should offer a lightweight care action");
assertContains(app, "mathcamp-floating-pet-position-v1", "floating pet should remember the custom position");
assertContains(app, "buildQuestionBankCoverage", "app debug API should expose the question-bank coverage report");
assertContains(questionBank, 'reading: ["读题理解", "不会做", "计算粗心"]', "question bank should define reading cause tags");
assertContains(questionBank, 'thinking: ["读题理解", "概念单位", "不会做"]', "question bank should define thinking cause tags");
assertContains(questionBank, 'id: "g1-reading"', "question bank should include grade 1 logic reading");
assertContains(questionBank, 'id: "g6-reading"', "question bank should include grade 6 logic reading");
assertContains(questionBank, 'id: "g1-thinking"', "question bank should include grade 1 thinking skills");
assertContains(questionBank, 'id: "g6-thinking"', "question bank should include grade 6 thinking skills");
assertContains(questionBank, 'id: "g2-angle-view"', "question bank should include grade 2 geometry diagrams");
assertContains(questionBank, 'id: "g4-angle-triangle"', "question bank should include grade 4 angle and polygon geometry");
assertContains(questionBank, 'id: "g5-geometry-motion"', "question bank should include grade 5 motion and polygon geometry");
assertContains(questionBank, 'id: "g6-solid-position"', "question bank should include grade 6 solid and position geometry");
assertContains(questionBank, "curriculumProfile", "question bank should expose textbook curriculum profile");
assertContains(questionBank, 'region: "浙江省杭州市"', "question bank should align curriculum metadata to Hangzhou");
assertContains(questionBank, 'textbook: "小学数学（按人教版单元线）"', "question bank should record the textbook line");
assertContains(questionBank, "gradeCurriculum", "question bank should expose grade-by-grade textbook units");
assertContains(questionBank, '"g6-scale": { term: "六下", unit: "比例-比例尺"', "question bank should map scale to the sixth-grade proportion unit");
assertContains(practiceEngine, "window.MathCampPracticeEngine", "练习引擎模块应暴露全局接口");
assertContains(practiceEngine, "buildAdaptiveQuestionSet", "练习引擎模块应导出自适应组题函数");
assertContains(reportModule, "window.MathCampReport", "报告模块应暴露全局接口");
assertContains(reportModule, "buildReportModel", "报告模块应导出报告模型函数");
assertContains(petModule, "window.MathCampPet", "宠物模块应暴露全局接口");
assertContains(petModule, "taskState", "宠物模块应导出任务状态函数");
assertContains(importExportModule, "window.MathCampImportExport", "导入导出模块应暴露全局接口");
assertContains(importExportModule, "parseImportBackup", "导入导出模块应导出解析函数");
assertNotContains(questionEnhancements, "const isQuestionArea = e.target.closest", "clicking the practice card should not leave a full-screen focus blur overlay");
assertContains(cursorEffects, "particle.textContent = '★'", "valid click effect should use star burst particles");
assertContains(cursorEffects, "closest('[data-subject-choice]')", "subject selector buttons should be excluded from click explosion effects");
assertContains(uiAnimations, "closest('[data-subject-choice]')", "subject selector buttons should be excluded from UI click ripple effects");
assertContains(animationIntegration, "isAnswerFeedbackNode", "answer celebration effects should only observe real feedback nodes");
assertNotContains(animationIntegration, "node.textContent?.includes('正确')", "ordinary page copy containing 正确率 should not trigger correct-answer bursts");
assertContains(animationIntegration, "mutation.target.parentElement", "number counter observers should handle text-node mutations through the parent element");
assertNotContains(animationIntegration, "mutation.target.closest('strong')", "number counter observers should not call closest on text nodes");
assertNotContains(microInteractions, '.custom-switch input[type="checkbox"] {\n      display: none;', "custom switches should keep their native checkbox focusable");
assertContains(microInteractions, '.custom-switch input[type="checkbox"]:focus-visible + .switch-track', "custom switches should expose a keyboard focus indicator");
assertContains(effectsControlIntegrated, "initialized: false", "effects control should track whether it has already initialized");
assertContains(effectsControlIntegrated, "if (this.initialized) return", "effects control initialization should be idempotent");
assertContains(effectsControlIntegrated, "this.returnFocusElement = document.activeElement", "effects settings should remember the trigger focus");
assertContains(effectsControlIntegrated, "this.returnFocusElement?.focus?.()", "effects settings should restore focus after closing");
assertContains(app, "objectiveQuestionPromptHTML", "objective questions should have a prompt-only title renderer");
assertNotContains(css, "white-space: nowrap;\n      word-break: keep-all;\n      overflow-x: auto;", "question options should wrap instead of scrolling horizontally");
assertContains(css, "overflow-wrap: anywhere;", "practice question content should allow long text to wrap within the viewport");
assertNotContains(css, "body.practice-view-active.practice-focus-mode .floating-pet-assistant {\n        display: none !important;", "mobile practice focus should keep the draggable floating pet visible");
assertContains(uiFeedback, "root.replaceChildren(toast)", "notifications should replace the previous toast instead of stacking over practice controls");
assertNotContains(grade3ReferenceSeeds, '"参考截图来自', "grade 3 student prompts should not expose reference-production wording");
assertNotContains(grade4ReferenceSeeds, '"参考截图来自', "grade 4 student prompts should not expose reference-production wording");
assertNotContains(grade3ReferenceSeeds, "reference page", "grade 3 English prompts should not expose reference-production wording");
assertNotContains(grade4ReferenceSeeds, "reference page", "grade 4 English prompts should not expose reference-production wording");
assertNotContains(css + grade3ReferenceSeeds + grade4ReferenceSeeds, "DOCX 期中卷改写", "student prompts should not expose document-production wording");
assertNotContains(scienceQuestionGenerator, "只看图片漂亮不漂亮", "science distractors should use plausible misconceptions");
assertNotContains(scienceQuestionGenerator, "天气和宇宙现象需要长期观察或模型模拟", "science fallback explanations should not mix weather and astronomy");
assertNotContains(chineseQuestionGenerator, '"只看字面随便猜", "不读题目直接选", "答案和题目无关"', "Chinese fallback distractors should be point-specific");
assertNotContains(chineseQuestionGenerator, "按真实试卷的做法", "Chinese explanations should explain the actual skill instead of using generic exam copy");
assertNotContains(cursorEffects, "createRipple(x, y)", "valid click effect should not include a center ripple");
assertNotContains(cursorEffects, ".card, .tab-btn", "valid click effect should not treat ordinary cards as click targets");
assertNotContains(cursorEffects, "this.setupParticleTrail();", "cursor effects should not leave mouse trail particles outside click targets");
assertNotContains(timerFix, "#timerStat::before", "timer display should not add a pseudo element over the real time text");
assertContains(questionEnhancements, "document.querySelectorAll('.timer-progress-ring').forEach", "timer enhancement should remove the old ring overlay");

assertContains(css, ".home-route-list", "CSS 应包含首页路线网格");
assertContains(css, ".home-cockpit-meter", "CSS should style the home task cockpit");
assertContains(css, ".timer-progress-ring", "CSS should explicitly suppress the old timer ring overlay");
assertContains(css, ".home-settings-card", "CSS should style the mobile home summary card");
assertContains(css, ".question-diagram", "CSS should style generated geometry diagrams");
assertContains(css, ".question-source-image", "CSS should style PDF screenshot question images");
assertContains(css, ".source-audit-toolbar", "CSS should style question source filter controls");
assertContains(css, ".custom-select--wrongPointFilter .custom-select-option", "wrongbook knowledge filter should use compact option typography");
assertContains(css, ".custom-select--printPoint .custom-select-option", "print knowledge selector should use compact option typography");
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
assertContains(css, ".floating-pet-assistant", "CSS should style the floating pet assistant");
assertContains(css, ".floating-pet-panel", "CSS should style the floating pet popup panel");
assertContains(css, "@media (min-width: 1181px)", "desktop should be able to hide the floating pet assistant");
assertContains(css, ".floating-pet-assistant.is-dragging", "dragging state should visually stabilize the floating pet");
assertContains(css, ".cause-chip.recommended", "错因标签应突出招财推荐项");
assertContains(css, 'content: "建议";', "推荐错因标签应显示建议标记");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode):not(.type-settings-open) .home-settings-card", "mobile home should show the summary card only on the home state");
assertContains(css, ".home-route-step", "CSS 应包含首页路线步骤卡片");
assertContains(css, "grid-template-columns: repeat(4, minmax(0, 1fr));", "desktop/tablet home route should show four steps in one row");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .home-dashboard", "mobile/tablet should show compact route on practice home");
assertContains(css, "body.practice-view-active.practice-focus-mode .home-dashboard", "desktop challenge/focus mode should keep the compact route header");
assertContains(css, "body.practice-view-active.practice-focus-mode .app", "desktop focused practice should be constrained to the viewport");
assertContains(css, "body.practice-view-active.practice-focus-mode .app-header {\n        display: grid;", "desktop focused practice should keep the top header visible");
assertContains(css, "body.practice-view-active.practice-focus-mode #practiceView", "desktop focused practice view should not require page scrolling");
assertContains(css, "body.practice-view-active.practice-focus-mode .companion {\n        display: grid;\n        grid-template-rows: auto auto auto auto auto;\n        align-content: start;", "desktop focused practice companion should stack cards naturally instead of squeezing them");
assertContains(css, "body.practice-view-active.practice-focus-mode .companion-card,\n      body.practice-view-active.practice-focus-mode .method-card,\n      body.practice-view-active.practice-focus-mode .appendix-card {\n        min-height: 0;\n        max-height: none;\n        overflow: visible;", "desktop focused practice companion cards should rely on the companion scroll area");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .panel {\n        min-height: 0;\n        overflow-x: hidden !important;\n        overflow-y: auto !important;", "final desktop practice setup override should keep the settings panel scrollable");
assertContains(css, "body.practice-view-active.practice-focus-mode .answer-panel {\n        min-height: 0;\n        max-height: 100%;\n        overflow-x: hidden !important;\n        overflow-y: auto !important;", "desktop focused practice answer panel should scroll when diagrams and number pad exceed the viewport");
assertContains(css, "body.practice-view-active.practice-focus-mode .app {\n        padding: 4px 0;\n        gap: 4px;", "desktop focused practice should reduce outer vertical whitespace");
assertContains(css, "body.practice-view-active.practice-focus-mode .home-dashboard {\n        padding: 7px 9px;", "desktop focused practice route header should be compact");
assertContains(css, "body.practice-view-active.practice-focus-mode .practice-card {\n        min-height: 0;\n        max-height: 100%;\n        padding: clamp(14px, 1.6vw, 18px);\n        gap: 12px;\n        overflow: hidden;", "desktop focused practice card should leave vertical overflow to the inner answer panel");
assertContains(css, "body.practice-view-active.practice-focus-mode .question {\n        min-height: 88px;\n        margin-bottom: 10px;\n        font-size: clamp(18px, 2.2vw, 24px);", "desktop focused practice question should use the same readable scale as choice prompts");
assertContains(css, "body.practice-view-active.practice-focus-mode .question-diagram svg {\n        max-height: 180px;", "desktop focused geometry diagrams should stay inside shorter screens");
assertContains(css, "body.practice-view-active.practice-focus-mode .number-pad button {\n        min-height: 44px;", "desktop focused number pad should be shorter without becoming tiny");
assertContains(css, "body.practice-view-active.practice-focus-mode .answer-panel > * {\n        flex: 0 0 auto;", "desktop focused practice children should not be compressed into overlap");
assertContains(css, "body.practice-view-active.practice-focus-mode .answer-mode-panel,\n      body.practice-view-active.practice-focus-mode .choice-options,\n      body.practice-view-active.practice-focus-mode .judge-options,\n      body.practice-view-active.practice-focus-mode .cause-panel {\n        min-height: 0;", "desktop focused choice, judge, step, and cause panels should be allowed to scroll with the answer panel");
assertContains(css, "body.practice-view-active.practice-focus-mode .answer-control-slot,\n      body.practice-view-active.practice-focus-mode .number-pad,\n      body.practice-view-active.practice-focus-mode .practice-actions {\n        flex: 0 0 auto;", "desktop focused practice controls should not be compressed or clipped at the bottom");
assertContains(css, "body.practice-view-active.practice-focus-mode .companion {\n        display: flex !important;\n        flex-direction: column;", "final desktop focused practice override should prevent companion grid row compression");
assertContains(css, "body.practice-view-active.practice-focus-mode .method-card,\n      body.practice-view-active.practice-focus-mode .appendix-card {\n        display: block !important;\n        min-height: 0;\n        max-height: none !important;\n        overflow: visible !important;", "desktop companion method and appendix cards should not overlap when content grows");
assertContains(css, "body.practice-view-active.practice-focus-mode .status-strip .stat {\n        min-height: 34px;", "desktop focused practice status strip should stay compact across practice modes");
assertContains(css, "body.practice-view-active.practice-focus-mode .mission-card {\n        min-height: 38px;", "desktop focused practice mission cards should not reserve a large block");
assertContains(css, ".question-line", "question text should support explicit readable line breaks");
assertContains(css, ".audio-prompt-card", "audio prompt questions should have a readable playback control");
assertContains(css, ".audio-prompt-play", "audio prompt playback should use a stable button class");
assertContains(css, ".question-line.label-line", "question labels such as 材料 and 题目 should get dedicated line styling");
assertContains(css, "font-size: clamp(18px, 2.2vw, 24px);", "word-style prompts should use a stable readable size instead of oversized mobile text");
assertContains(css, ".answer-input {\n      min-height: 58px;\n      font-size: clamp(18px, 2.2vw, 24px);", "typed answers should use the same readable scale as prompts");
assertContains(css, ".judge-statement {\n      display: block;\n      color: color-mix(in oklch, var(--fg), white 4%);\n      font-size: clamp(18px, 2.2vw, 24px);", "judge answer statements should not enlarge answers beyond prompt scale");
assertContains(css, ".judge-statement b {\n      color: color-mix(in oklch, var(--subject-accent), black 18%);\n      font-size: inherit;", "highlighted judge answers should keep the same size as the statement");
assertContains(css, "body.practice-view-active.practice-focus-mode .question.word {\n        min-height: 76px;\n        margin-bottom: 8px;\n        font-size: clamp(18px, 2.4vw, 22px);", "focused mobile/tablet word prompts should stay readable without becoming huge");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .panel {\n        box-sizing: border-box;\n        min-height: 0;\n        height: 100%;\n        max-height: 100%;\n        padding: 8px 10px;\n        align-self: stretch;\n        overflow-x: hidden;\n        overflow-y: auto;", "desktop practice setup panel should scroll when knowledge details expand");
assertContains(css, "@media (max-height: 860px)", "desktop practice should have a low-height scroll fallback");
assertContains(css, "html:has(body.practice-view-active),\n        body.practice-view-active {\n          height: auto;", "low-height desktop practice should release the fixed body height");
assertContains(css, "overflow-y: auto;", "low-height desktop practice should allow vertical page scrolling");
assertContains(css, "body.practice-view-active.practice-focus-mode .practice-card {\n          height: auto;\n          max-height: none;\n          overflow: visible;", "low-height focused practice should not clip the question card");
assertContains(css, "body.practice-view-active:not(.practice-focus-mode) .practice-workspace > .panel {\n          height: auto;\n          max-height: none;\n          overflow: visible;", "low-height practice setup should not clip the settings panel");
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
assertContains(css, "grid-template-columns: repeat(5, minmax(0, 1fr));", "tablet top navigation should fit the five subject-aware buttons in one row");
assertContains(css, ".tab-btn[data-open-subject] {\n        grid-column: 5 / 9;\n        grid-row: 2;", "mobile subject selector should align with the middle column of the top row");
assertContains(css, ".tab-btn[data-open-subject] { grid-column: 5 / 9; }", "narrow mobile subject selector should stay aligned with the middle column");
assertContains(css, "#subjectModal .hub-action-grid", "subject selector modal should have its own responsive grid");
assertContains(css, ".subject-choice-card.is-active", "subject selector should show the active subject");
assertContains(app, "subjectModal: document.getElementById(\"subjectModal\")", "app should register the subject selector modal");
assertContains(app, "function applySubjectTheme", "app should sync the current subject to the document theme layer");
assertContains(app, "document.documentElement.dataset.subject = subject", "subject theme should be exposed as a root data attribute");
assertContains(app, "subjectThemeMeta", "app should read subject theme metadata for copy and colors");
assertContains(app, "document.querySelectorAll(\"[data-open-subject]\")", "app should open the subject selector from navigation");
assertContains(app, "document.querySelectorAll(\"[data-subject-choice]\")", "app should bind subject choice buttons");
assertContains(app, "closeHubModals();\n      UI.notify(`已选择${SUBJECTS[next].label}。`);", "selecting a subject should close the subject selector modal");
assertContains(subjectRegistry, "themeLabel", "subject registry should define visual theme labels");
assertContains(subjectRegistry, "metaColor", "subject registry should define per-subject browser theme colors");
["chinese", "math", "english", "science"].forEach((subject) => {
  assertContains(css, `:root[data-subject="${subject}"]`, `${subject} should have CSS subject theme tokens`);
});
assertContains(css, "--subject-symbols", "CSS should define subject-specific practice symbols");
assertContains(css, "content: var(--subject-symbols);", "practice card decoration should follow the active subject");
assertContains(css, "content: var(--subject-hero-symbols);", "home hero decoration should follow the active subject");
assertContains(css, ".tab-btn[data-open-subject]", "subject selector tab should visually reflect the active subject");
assertContains(css, ".practice-focus-mode .method-card,\n      .practice-focus-mode .appendix-card", "tablet practice companion should show method and appendix cards");
assertContains(css, "body.practice-view-active #practiceView.view.active.view-enter", "tablet practice view should not animate itself below the viewport on first load");
assertContains(css, "@media (max-width: 1180px) {\n      html:has(body.practice-view-active.practice-focus-mode),\n      body.practice-view-active.practice-focus-mode {\n        height: auto;\n        min-height: 100%;\n        overflow-x: hidden;\n        overflow-y: auto;", "mobile and tablet focused practice should allow page scrolling");
assertContains(css, "body.practice-view-active.practice-focus-mode .app {\n        height: auto;\n        min-height: 100dvh;\n        overflow: visible;", "mobile and tablet focused practice app should grow with content");
assertContains(css, "body.practice-view-active.practice-focus-mode .practice-workspace.focus-mode > .main-stack,\n      body.practice-view-active.practice-focus-mode .practice-workspace > .main-stack {\n        grid-template-rows: auto auto auto !important;\n        padding-bottom: max(16px, env(safe-area-inset-bottom));", "mobile and tablet focused practice stack should expose all lower controls");
assertContains(css, "body.practice-view-active.practice-focus-mode .answer-panel {\n        min-height: 0;\n        max-height: none;\n        overflow: visible;", "mobile and tablet focused practice answers should scroll with the page");
assertContains(css, "body.practice-view-active.practice-focus-mode .practice-card > .companion {\n        display: none !important;", "mobile and tablet focused practice should hide the fixed companion now that the floating pet handles coaching");
assertContains(app, "function shouldUseMobilePetHintPopover() {\n      return false;", "mobile focused practice should not route hints or results through the hidden fixed companion");
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
assertContains(css, ".cloud-sync-detail", "CSS 应包含云同步详情样式");
assertContains(css, ".parent-diagnosis-card", "CSS 应包含家长诊断卡样式");
assertContains(css, ".parent-diagnosis-actions", "家长诊断卡应包含可行动按钮区域样式");
assertContains(css, "#reportView .report-grid {\n        grid-template-columns: repeat(3, minmax(0, 1fr));", "桌面学习报告顶部应只展示三个核心指标");
assertContains(css, "#reportView .report-card:nth-of-type(1) {\n        grid-column: 1 / 8;", "桌面学习报告行动卡应占据左侧大区");
assertContains(css, "#reportView .report-card:nth-of-type(4) {\n        grid-column: 7 / -1;", "桌面学习报告趋势摘要应占据右侧大区");
assertContains(css, "min-height: calc(100dvh - 126px);", "桌面学习报告应吃满可用高度");
assertContains(css, "#reportView .report-card:nth-of-type(5) {\n        grid-column: 1 / -1;", "桌面学习报告图形概览应横跨底部");
assertContains(css, "#reportView .report-visual-grid", "学习报告应包含图形概览网格样式");

assertContains(css, "grid-template-rows: auto auto auto minmax(220px, 1fr);", "desktop report upper summary should grow with content instead of clipping");
assertContains(css, "#reportView .report-card h2 {\n        margin: 0;\n        font-size: 19px;", "desktop report card headings should be larger after compacting height");
assertContains(css, "#reportView .report-item h3 {\n        font-size: 14.5px;", "desktop report item headings should be larger after compacting height");
assertContains(css, "overflow: visible;", "desktop report cards should not clip summary content");
assertContains(app, 'topic === "vertical" ? "竖式计算" : topic === "twostep" ? "两步计算"', "report topic bars should localize vertical and twostep labels");
assertContains(css, "width: min(156px, 100%);", "desktop report visual donut should be larger");
assertContains(css, "font: 950 31px/1 var(--font-display);", "desktop report visual donut text should be larger");
assertContains(css, "#reportView .report-bar-track {\n      height: 14px;", "report visual bars should render with the larger base height");
assertContains(app, "Math.max(10, Math.min(28, day.count * 4 + 10))", "desktop report rhythm dots should be larger");
assertContains(css, "#reportView .report-donut {\n      --value: 0%;", "report donut graphic styling should be available outside desktop-only breakpoints");
assertContains(css, "conic-gradient(var(--accent) var(--value)", "report donut should render as a real circular chart on compact layouts");
assertContains(css, "#reportView .report-bar-track i {\n      display: block;", "report bar fills should render on compact layouts");
assertContains(css, "#reportView .report-dot-row {\n      display: grid;", "report rhythm chart should render on compact layouts");
assertContains(css, "grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);", "tablet report visual grid should keep charts visible in two columns");
assertContains(css, "#reportView .report-visual-panel:nth-child(3) {\n        grid-column: 1 / -1;", "tablet report rhythm chart should span the full row");
assertContains(css, "#reportView .main-stack {\n        grid-template-columns: 1fr;", "mobile report should use a single-column card flow");
assertContains(css, "#reportView .report-visual-grid {\n        grid-template-columns: 1fr;\n        gap: 9px;", "mobile report visual grid should stack charts vertically");
assertContains(app, 'style="--dot-size:${size}px"', "report rhythm dots should expose size through CSS variables");
assertContains(css, "width: min(var(--dot-size, 14px), 16px);", "mobile report rhythm dots should be capped by CSS");
assertContains(css, "width: clamp(88px, 28vw, 112px);", "mobile report donut should fit inside the visual card");
assertContains(css, "#reportView .report-visual-panel:first-child {\n        grid-template-columns: auto minmax(0, 1fr);", "compact report donut panel should keep the donut and copy aligned");

[
  "index.html",
  "css/themes.css",
  ...cssFiles,
  "js/app.js",
  "js/math-question-makers.js",
  "js/cloud-sync.js",
  "js/runtime-config.js",
  "js/question-bank-coverage.js",
  "js/learning-insights.js",
  "js/pet-economy.js",
  "js/question-spec-utils.js",
  "js/grade2-reference-source-meta.js",
  "js/grade2-reference-scan-index.js",
  "js/grade2-reference-question-seeds.js",
  "js/grade2-original-question-seeds.js",
  "js/grade3-reference-source-meta.js",
  "js/grade3-reference-scan-index.js",
  "js/grade3-reference-question-seeds.js",
  "js/grade3-original-question-seeds.js",
  "js/grade4-reference-source-meta.js",
  "js/grade4-reference-scan-index.js",
  "js/grade4-reference-question-seeds.js",
  "js/grade4-original-question-seeds.js",
  "js/external-question-seeds.js",
  "js/subject-registry.js",
  "js/chinese-question-bank.js",
  "js/chinese-question-generator.js",
  "js/english-question-bank.js",
  "js/english-question-generator.js",
  "js/science-curriculum-data.js",
  "js/science-question-bank.js",
  "js/science-question-generator.js",
  "js/question-generator.js",
  "js/learning-quality-engine.js",
  "js/practice-engine.js",
  "js/question-rules-engine.js",
  "js/question-interaction.js",
  "js/question-source-summary.js",
  "js/report.js",
  "js/pet.js",
  "js/import-export.js",
  "tests/question-rules.test.js",
  "tests/frontend-layout.test.js"
].forEach((relativePath) => {
  const source = read(relativePath);
  assert(!mojibake.test(source), `${relativePath} should stay valid UTF-8 without mojibake`);
});

[
  "index.html",
  "manifest.webmanifest",
  "css/themes.css",
  ...cssFiles,
  "js/app.js",
  "js/math-question-makers.js",
  "js/runtime-config.js",
  "js/cloud-sync.js",
  "js/cursor-effects.js",
  "js/home-route.js",
  "js/question-bank-coverage.js",
  "js/learning-insights.js",
  "js/subject-registry.js",
  "js/chinese-curriculum-data.js",
  "js/chinese-question-bank.js",
  "js/chinese-question-generator.js",
  "js/english-curriculum-data.js",
  "js/english-question-bank.js",
  "js/english-question-generator.js",
  "js/science-curriculum-data.js",
  "js/science-question-bank.js",
  "js/science-question-generator.js",
  "js/question-enhancements.js",
  "js/pet-dressup-meta.js",
  "js/pet-economy.js",
  "js/question-spec-utils.js",
  "js/grade2-reference-source-meta.js",
  "js/grade2-reference-scan-index.js",
  "js/grade2-reference-question-seeds.js",
  "js/grade2-original-question-seeds.js",
  "js/grade3-reference-source-meta.js",
  "js/grade3-reference-scan-index.js",
  "js/grade3-reference-question-seeds.js",
  "js/grade3-original-question-seeds.js",
  "js/grade4-reference-source-meta.js",
  "js/grade4-reference-scan-index.js",
  "js/grade4-reference-question-seeds.js",
  "js/grade4-original-question-seeds.js",
  "js/external-question-seeds.js",
  "js/question-generator.js",
  "js/practice-engine.js",
  "js/question-rules-engine.js",
  "js/question-interaction.js",
  "js/question-source-summary.js",
  "js/report.js",
  "js/pet.js",
  "js/import-export.js",
  "js/question-bank.js"
].forEach((relativePath) => {
  const androidPath = path.join("android/app/src/main/assets/www", relativePath);
  assert.strictEqual(hash(relativePath), hash(androidPath), `${relativePath} should match Android asset mirror`);
});

console.log("Frontend layout contract tests passed.");
