# 多学科、语文题库与全屏手写实现计划

> **给执行代理的要求：** 按本文任务顺序执行。每个任务使用复选框跟踪；每完成一组改动就运行对应验证。涉及代码实现时，优先使用 `superpowers:executing-plans` 或按任务分段执行。

**目标：** 在现有数学练习项目中加入真正独立的语文学科，并为数学、语文共同增加键盘输入与移动端/平板端全屏手写作答能力。

**架构：** 新增“学科注册表 + 学科数据层”。数学旧数据迁移进 `subjects.math`，语文使用 `subjects.chinese`。题库、做题、错题本、掌握度、学习报告、知识地图、打印题单、闯关记录按学科隔离；学生档案、宠物空间、金币经验、主题、导入导出外壳和云同步外壳继续共用。

**技术栈：** 原生 HTML/CSS/JavaScript、localStorage、Android WebView 镜像资源、Node.js 测试、现有 `npm test`、现有 Android 资源同步脚本。

---

## 一、已确认需求

- 数学和语文的数据必须切割：题库、练习记录、错题本、掌握度、学习报告、知识地图、打印题单、闯关记录互不混用。
- 宠物空间、金币、经验、主题装扮、学生档案、云同步外壳、导入导出外壳保持共用。
- 现有数学数据不能丢失，需要自动迁移到数学学科。
- 语文题库以浙江省杭州市小学语文教材线为依据，按杭州常用统编版小学语文一至六年级单元能力线组织。
- 语文题目材料使用原创内容，不直接复制教材长文；知识点、题型和难度贴合杭州教材进度。
- 每一道语文题都必须提供参考答案、解析和答题步骤。
- 语文错因数量与数学一致，保留 5 类：`未标记`、`不会做`、`字词基础`、`阅读理解`、`表达规范`。
- 数学和语文都支持键盘输入。
- 移动端和平板端支持全屏手写，不固定某个小手写区域。
- 手写第一版不强依赖 OCR/AI 识别，先保存笔迹并支持参考答案后的自评或订正。
- 后续英语、科学应能复用这次建立的多学科底座。

## 二、文件规划

**新增文件**

- `js/subject-registry.js`：学科注册表、学科默认状态、旧数据迁移、当前学科题库读取。
- `js/chinese-question-bank.js`：语文题库元数据、年级、错因、知识点、杭州教材线信息。
- `js/chinese-question-generator.js`：语文题目生成器。
- `js/handwriting-input.js`：全屏手写画布、笔迹序列化、撤销、重做、清空。
- `tests/subject-isolation.test.js`：学科数据迁移与隔离测试。
- `tests/chinese-question-bank.test.js`：语文题库和生成器质量测试。
- `tests/answer-modes.test.js`：文本答案、多答案、自评题、数字答案测试。
- `tests/handwriting-input.test.js`：手写模块序列化和清空测试。

**修改文件**

- `index.html`：加载新增脚本，加入全屏手写浮层，补充语文/手写相关入口。
- `css/themes.css`：全屏手写样式、语文短文题块、学科标签、工具条样式。
- `js/app.js`：核心接入。把原本数学专用的题库、记录、错题、报告读取改成当前学科读取。
- `js/question-generator.js`：按学科分发数学或语文生成器。
- `js/practice-engine.js`：自适应练习改为读取当前学科数据。
- `js/report.js`：学习报告改为读取当前学科数据。
- `js/learning-insights.js`：错因诊断支持数学和语文不同错因。
- `js/question-bank-coverage.js`：题库巡检支持数学和语文。
- `js/import-export.js`：导入导出保留新的多学科结构。
- `js/cloud-sync.js`：云同步合并多学科字段。
- `tests/question-rules.test.js`：加载新模块并校验数学不回退。
- `tests/frontend-layout.test.js`：校验新增脚本、手写浮层和学科隔离入口。
- `tests/browser-smoke.test.js`：浏览器冒烟测试加入语文练习。
- `scripts/question-bank-coverage.js`：输出数学和语文题库巡检结果。
- `android/app/src/main/assets/www/...`：通过同步脚本镜像 Web 资源。

## 三、任务 1：建立学科注册表与旧数据迁移

**目标：** 先把数据结构从单科改成多学科，并确保旧数学数据进入 `subjects.math`。

**涉及文件：**

- 新增：`js/subject-registry.js`
- 修改：`index.html`
- 修改：`js/app.js`
- 新增：`tests/subject-isolation.test.js`
- 修改：`tests/question-rules.test.js`

**步骤：**

- [ ] 新增 `tests/subject-isolation.test.js`，先写失败测试：旧结构中的 `history`、`wrongbook`、`mastery`、`settings` 必须迁移到 `subjects.math`，`subjects.chinese` 初始为空。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/subject-isolation.test.js`，确认失败。
- [ ] 新增 `js/subject-registry.js`，提供：
  - `safeSubjectId(value)`
  - `createSubjectState(subjectId, existing)`
  - `normalizeProfileSubjects(profile)`
  - `subjectState(profile, subjectId)`
  - `subjectBank(subjectId)`
- [ ] 在 `index.html` 中，在 `js/question-bank.js` 后加载 `js/subject-registry.js`。
- [ ] 在 `js/app.js` 中引入 `window.MathCampSubjects`，替换本地硬编码 `SUBJECTS` 的来源。
- [ ] 在 `normalizeProfile(profile)` 内调用 `normalizeProfileSubjects`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/subject-isolation.test.js`，确认通过。

**验收：**

- 旧数学记录不丢失。
- 语文学科拥有独立空数据桶。
- 学科选择仍能正常保存。

## 四、任务 2：新增杭州教材线语文题库

**目标：** 建立语文知识点数据，按 1-6 年级覆盖杭州小学语文常见统编版能力线。

**涉及文件：**

- 新增：`js/chinese-question-bank.js`
- 新增：`tests/chinese-question-bank.test.js`
- 修改：`index.html`

**语文错因：**

```js
["未标记", "不会做", "字词基础", "阅读理解", "表达规范"]
```

**年级知识点建议：**

- 一年级：拼音认读与拼写、识字写字入门、词语积累、句子入门、短文阅读启蒙、古诗积累、看图说话、口语表达。
- 二年级：字音字形、词语搭配、句子训练、标点与语气、短文阅读、古诗积累、看图写话、综合语用。
- 三年级：字词辨析、句式转换、修辞初步、段落阅读、习作片段、古诗理解、课内外积累、综合实践表达。
- 四年级：词句段运用、病句修改、修辞与标点、现代文阅读、习作审题、古诗文积累、资料提取、综合语用。
- 五年级：语境词语、句段篇章、阅读理解、说明与叙事阅读、习作结构、古诗文与文言启蒙、整本书阅读、综合运用。
- 六年级：语基综合、阅读策略、观点概括、习作升格、古诗文言、小升初综合、名著阅读、综合表达。

**步骤：**

- [ ] 新增 `tests/chinese-question-bank.test.js`，断言：
  - `window.MathCampChineseQuestionBank` 存在。
  - 语文错因为 5 类。
  - 每个年级至少 8 个知识点。
  - 每个知识点 `curriculum.region` 为 `浙江省杭州市`。
  - 关键知识点如 `c1-pinyin`、`c6-reading-strategy` 存在。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`，确认失败。
- [ ] 新增 `js/chinese-question-bank.js`，导出：
  - `grades`
  - `gradeNames`
  - `causes`
  - `causeTagsByTopic`
  - `curriculumProfile`
  - `points`
  - `pointMap`
  - `allOption`
- [ ] 在 `index.html` 中，在 `js/question-bank.js` 后加载 `js/chinese-question-bank.js`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`，确认通过。

**验收：**

- 语文题库结构与数学题库结构兼容。
- 题库标明杭州教材线。
- 语文错因数量与数学一致。

## 五、任务 3：把页面读写切到当前学科

**目标：** 当前选择数学就读数学数据，当前选择语文就读语文数据。

**涉及文件：**

- 修改：`js/app.js`
- 修改：`js/practice-engine.js`
- 修改：`js/report.js`
- 修改：`js/learning-insights.js`
- 修改：`tests/subject-isolation.test.js`

**步骤：**

- [ ] 在 `js/app.js` 中新增当前学科辅助函数：
  - `activeSubjectId()`
  - `activeBank()`
  - `activeLearning(profile)`
  - `bankGrades()`
  - `bankGradeNames()`
  - `bankCauses()`
  - `bankPoints()`
  - `bankPointMap()`
- [ ] 改造高频函数：
  - `availablePoints`
  - `pointLabel`
  - `safePointId`
  - `pointOptionsHTML`
  - `masteryFor`
  - `masteryAccuracy`
  - `weakestPoints`
  - `choosePoint`
- [ ] 把练习、错题、报告中的 `profile.history`、`profile.wrongbook`、`profile.masteredWrong`、`profile.mastery`、`profile.settings` 改为 `activeLearning(profile)` 下的数据。
- [ ] 新增记录时写入 `subject: activeSubjectId()`。
- [ ] `selectSubject(subjectId)` 后刷新知识点下拉、错题本、报告、首页状态。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; npm test`，修复剩余数学硬编码读取。

**验收：**

- 语文练习记录不会出现在数学报告。
- 数学错题不会出现在语文错题本。
- 切换学科后知识点下拉随学科变化。

## 六、任务 4：扩展答案模型，支持文本答案和自评

**目标：** 保留数学数字自动判题，同时支持语文字词、拼音、短句、多答案、开放题自评。

**涉及文件：**

- 修改：`js/app.js`
- 新增：`tests/answer-modes.test.js`
- 修改：`tests/question-rules.test.js`

**题目字段：**

```js
{
  answerType: "number" | "text" | "longText" | "handwriting" | "selfReview",
  answer: "...",
  acceptedAnswers: ["..."],
  answerLabel: "参考答案",
  explanation: "解析",
  steps: ["步骤一", "步骤二"]
}
```

**步骤：**

- [ ] 新增 `tests/answer-modes.test.js`，断言源码包含 `normalizeTextAnswer`、`acceptedAnswers`、`answerType`、`selfReview`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/answer-modes.test.js`，确认失败。
- [ ] 在 `js/app.js` 增加：
  - `normalizeTextAnswer(value)`
  - `textAnswerMatches(raw, question)`
  - `isSelfReviewQuestion(question)`
- [ ] 修改 `answerMatches(question, parsed)`：
  - 数学数字题继续走原逻辑。
  - `answerType === "text"` 或存在 `acceptedAnswers` 时走文本匹配。
  - `longText`、`handwriting`、`selfReview` 进入自评流程。
- [ ] 新增 `renderSelfReviewControls(question)`，显示：
  - `我答对了`
  - `部分正确`
  - `需要订正`
- [ ] 新增 `finishSelfReview(question, result)`，把自评结果写入当前学科学习记录。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/answer-modes.test.js; npm test`。

**验收：**

- 数学数字答案不受影响。
- 语文字词类题可自动判题。
- 阅读简答、看图写话、习作片段可提交后自评。

## 七、任务 5：增加移动端/平板端全屏手写

**目标：** 手写不固定小区域，在移动端和平板端进入全屏画布。

**涉及文件：**

- 新增：`js/handwriting-input.js`
- 修改：`index.html`
- 修改：`css/themes.css`
- 修改：`js/app.js`
- 新增：`tests/handwriting-input.test.js`
- 修改：`tests/frontend-layout.test.js`

**手写体验：**

- 顶部显示可收起题干条。
- 中间整个可视区域为手写画布。
- 底部悬浮工具条包含：撤销、重做、清空、退出、提交。
- 题目提交后保存笔迹数据。
- 看参考答案后进入自评。

**步骤：**

- [ ] 新增 `tests/handwriting-input.test.js`，测试 `createEmptyState`、`serialize`、`clear`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/handwriting-input.test.js`，确认失败。
- [ ] 新增 `js/handwriting-input.js`，提供：
  - `createEmptyState(width, height)`
  - `serialize(state)`
  - `clear(state)`
  - `undo(state)`
  - `redo(state)`
- [ ] 在 `index.html` 新增 `handwritingOverlay`、`handwritingCanvas`、题干条和工具条。
- [ ] 在 `index.html` 中加载 `js/handwriting-input.js`。
- [ ] 在 `css/themes.css` 增加全屏手写样式，使用 `position: fixed; inset: 0;`。
- [ ] 在 `js/app.js` 绑定手写 DOM：
  - `handwritingOverlay`
  - `handwritingCanvas`
  - `handwritingUndoBtn`
  - `handwritingRedoBtn`
  - `handwritingClearBtn`
  - `handwritingExitBtn`
  - `handwritingSubmitBtn`
- [ ] 新增：
  - `openHandwritingMode(question)`
  - `closeHandwritingMode()`
  - `submitHandwritingAnswer()`
- [ ] 提交手写后，将序列化笔迹写入当前题记录：

```js
handwriting: {
  width,
  height,
  strokes
}
```

- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/handwriting-input.test.js; npm test`。

**验收：**

- 移动端和平板端手写为全屏。
- 不需要固定小输入框。
- 手写提交后可查看参考答案并自评。
- 手写记录进入当前学科，不串到其他学科。

## 八、任务 6：新增语文题目生成器

**目标：** 语文学科可以真正生成可做题目，且每题有答案、解析和步骤。

**涉及文件：**

- 新增：`js/chinese-question-generator.js`
- 修改：`index.html`
- 修改：`js/question-generator.js`
- 修改：`tests/chinese-question-bank.test.js`
- 修改：`tests/question-rules.test.js`

**步骤：**

- [ ] 扩展 `tests/chinese-question-bank.test.js`，断言 `window.MathCampChineseQuestionGenerator` 存在。
- [ ] 测试生成 `c3-paragraph-reading`，要求结果包含：
  - `text`
  - `answerType`
  - `answer` 或 `answerLabel`
  - `explanation`
  - `steps`
  - `pointId`
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`，确认失败。
- [ ] 新增 `js/chinese-question-generator.js`，按 topic 提供生成器：
  - `pinyin`
  - `character`
  - `word`
  - `sentence`
  - `punctuation`
  - `reading`
  - `poem`
  - `writing`
- [ ] 每个生成器返回统一题目对象：

```js
{
  subject: "chinese",
  grade,
  pointId,
  topic,
  text,
  passage,
  answerType,
  answer,
  acceptedAnswers,
  answerLabel,
  explanation,
  steps,
  commonPitfalls
}
```

- [ ] 在 `index.html` 加载 `js/chinese-question-generator.js`。
- [ ] 在 `js/question-generator.js` 中按 `point.id` 前缀 `c` 或 `subject === "chinese"` 分发到语文生成器。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js; npm test`。

**验收：**

- 语文每个年级能生成题。
- 每题有解析。
- 字词类题可键盘自动判题。
- 阅读和表达类题可自评。

## 九、任务 7：接入语文练习、错题、报告、知识地图、打印题单

**目标：** 语文学科不是只有题库，而是完整接入现有学习闭环。

**涉及文件：**

- 修改：`js/app.js`
- 修改：`js/report.js`
- 修改：`js/learning-insights.js`
- 修改：`css/themes.css`
- 修改：`tests/frontend-layout.test.js`
- 修改：`tests/browser-smoke.test.js`

**步骤：**

- [ ] 练习页：选择语文后，年级和知识点显示语文知识点。
- [ ] 做题页：支持 `passage` 短文块显示。
- [ ] 做题页：语文题显示参考答案、解析和步骤。
- [ ] 错题本：读取当前学科错题。
- [ ] 错题本：语文错题显示孩子答案、参考答案、解析、错因、自评状态。
- [ ] 报告页：读取当前学科 `history` 和 `mastery`。
- [ ] 报告页：语文题型构成使用语文 topic 标签。
- [ ] 知识地图：读取当前学科知识点。
- [ ] 打印题单：语文题支持短文、答案页、解析页。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/frontend-layout.test.js; npm test`。

**验收：**

- 语文能从题型设置进入做题。
- 语文做错能进入语文错题本。
- 语文报告只显示语文数据。
- 数学报告不显示语文数据。
- 打印语文题单时能看到参考答案和解析页。

## 十、任务 8：语文错因与学习建议

**目标：** 报告和错题本能基于语文 5 类错因给出建议。

**涉及文件：**

- 修改：`js/learning-insights.js`
- 修改：`js/report.js`
- 修改：`js/app.js`
- 修改：`tests/chinese-question-bank.test.js`

**步骤：**

- [ ] 把 `js/learning-insights.js` 中固定数学错因列表改为可由当前学科传入。
- [ ] 当知识点 id 以 `c` 开头时，使用语文诊断规则：
  - 拼音、字音、字形、词语、偏旁、量词、多音字 → `字词基础`
  - 阅读、短文、概括、诗、文言、信息、中心、人物、情节 → `阅读理解`
  - 句子、标点、表达、习作、写话、病句、观点、应用文 → `表达规范`
  - 其他 → `不会做`
- [ ] 报告调用 `LearningInsights.causeBreakdown` 时传入 `bankCauses()`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js; npm test`。

**验收：**

- 语文错因只有 5 类。
- 报告里错因摘要符合语文。
- 数学错因仍保持原逻辑。

## 十一、任务 9：浏览器冒烟测试

**目标：** 确认数学和语文都能在真实页面环境生成题。

**涉及文件：**

- 修改：`tests/browser-smoke.test.js`

**步骤：**

- [ ] 保留现有数学几何题冒烟测试。
- [ ] 新增语文冒烟测试：
  - 选择 `chinese`
  - 年级设为三年级
  - 知识点设为 `c3-paragraph-reading`
  - 生成 3 题
  - 断言每题 `pointId` 以 `c3-` 开头
  - 断言每题包含 `explanation` 和 `steps`
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/browser-smoke.test.js`。

**验收：**

- 若安装 Playwright，数学和语文浏览器测试都通过。
- 若未安装 Playwright，保持现有跳过提示。

## 十二、任务 10：同步 Android WebView 资源

**目标：** Web 端改动同步到 Android 资产目录。

**涉及文件：**

- `android/app/src/main/assets/www/index.html`
- `android/app/src/main/assets/www/css/themes.css`
- `android/app/src/main/assets/www/js/app.js`
- `android/app/src/main/assets/www/js/subject-registry.js`
- `android/app/src/main/assets/www/js/chinese-question-bank.js`
- `android/app/src/main/assets/www/js/chinese-question-generator.js`
- `android/app/src/main/assets/www/js/handwriting-input.js`

**步骤：**

- [ ] 先运行检查：

```powershell
$ErrorActionPreference = 'Stop'; npm run sync:android:check
```

- [ ] 如果检查失败，运行同步：

```powershell
$ErrorActionPreference = 'Stop'; powershell -ExecutionPolicy Bypass -File scripts/sync-android-assets.ps1
```

- [ ] 再次运行：

```powershell
$ErrorActionPreference = 'Stop'; npm run sync:android:check
```

**验收：**

- Android 资产镜像与 Web 端一致。

## 十三、最终验证清单

- [ ] 学科隔离测试：

```powershell
$ErrorActionPreference = 'Stop'; node tests/subject-isolation.test.js
```

- [ ] 语文题库测试：

```powershell
$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js
```

- [ ] 答题方式测试：

```powershell
$ErrorActionPreference = 'Stop'; node tests/answer-modes.test.js
```

- [ ] 手写模块测试：

```powershell
$ErrorActionPreference = 'Stop'; node tests/handwriting-input.test.js
```

- [ ] 全量测试：

```powershell
$ErrorActionPreference = 'Stop'; npm test
```

- [ ] Android 同步检查：

```powershell
$ErrorActionPreference = 'Stop'; npm run sync:android:check
```

## 十四、人工验收脚本

1. 打开 `index.html`。
2. 默认数学下生成一轮练习，确认原有数学题可用。
3. 打开学科选择，切换到语文。
4. 选择三年级 `段落阅读`，生成一轮语文练习。
5. 确认语文题显示短文或题干，并能看到参考答案、解析和步骤。
6. 故意答错一道语文题，确认进入语文错题本。
7. 切回数学，确认数学错题本和报告不出现语文题。
8. 切回语文，确认语文报告显示语文练习记录。
9. 在移动端或平板宽度下进入手写模式，确认手写是全屏。
10. 手写提交后查看参考答案，选择自评，确认记录进入当前学科。

## 十五、风险与处理

- `js/app.js` 当前文件较大，改造时要优先增加小型辅助函数，避免一次性重构全文件。
- 旧数学数据迁移必须幂等，重复打开页面不能重复复制历史记录。
- 手写笔迹可能占用 localStorage，第一版要限制保存笔画数量和错题数量。
- 语文开放题不能强行自动判分，第一版用自评更稳。
- 中文题库要贴合杭州教材线，但题目材料必须原创，避免版权风险。

## 十六、执行建议

推荐按任务顺序分批执行：

1. 先做任务 1-3，完成多学科底座。
2. 再做任务 4-5，完成答案模型和全屏手写。
3. 再做任务 6-8，接入语文题库和学习闭环。
4. 最后做任务 9-10，完成浏览器验证和 Android 同步。

每一批结束后都运行对应测试，不要等全部实现后再统一修。

