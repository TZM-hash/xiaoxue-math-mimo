# 语文教材知识库与题源比例实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 将语文学科从“能力线题库”升级为“杭州地区统编版/人教社出版教材知识库 + 推荐读物 + 原创拓展”的题源体系，并按课内 50%、推荐读物 25%、原创拓展 25% 出题。

**架构：** 新增独立 `js/chinese-curriculum-data.js` 管理教材、推荐读物和原创拓展元数据；`js/chinese-question-bank.js` 继续暴露兼容现有页面的知识点，但从教材知识库派生年级、单元、题源标签；`js/chinese-question-generator.js` 根据题源计划生成客观可判分题，并保留每题答案、解析和步骤。

**技术栈：** 原生 JavaScript IIFE、现有 VM 单元测试、现有 Android WebView 静态资源同步脚本。

---

## 任务 1：新增教材知识库测试

**文件：**
- 修改：`tests/chinese-question-bank.test.js`

- [ ] 增加失败测试，断言 `window.MathCampChineseCurriculumData` 存在。
- [ ] 断言教材口径为“浙江省杭州市 / 统编版 / 人民教育出版社出版”。
- [ ] 断言题源比例为 `inTextbook: 0.5`、`recommendedReading: 0.25`、`extraOriginal: 0.25`。
- [ ] 断言每个年级都有上下册教材、课文条目、生字或词语知识、推荐读物和原创拓展主题。
- [ ] 断言语文题库 `points` 中三类题源均存在，且每个年级课内、推荐读物、原创拓展都能找到对应知识点。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`，预期失败。

## 任务 2：新增教材知识库数据文件

**文件：**
- 新增：`js/chinese-curriculum-data.js`
- 修改：`index.html`
- 修改：`tests/frontend-layout.test.js`

- [ ] 创建 `window.MathCampChineseCurriculumData`，包含：
  - `curriculumProfile`
  - `autoSourcePolicy`
  - `grades`
  - `sourceLabels`
- [ ] 每个年级提供：
  - `terms`：上册、下册
  - `units`：单元主题
  - `lessons`：课文/识字/语文园地/习作/口语交际/快乐读书吧条目
  - `recommendedReadings`：推荐读物书名、作者、阅读能力点、考查方向
  - `extraOriginal`：原创课外拓展主题、能力点、考查方向
- [ ] 不复制教材正文或推荐书正文，只记录课题、字词、主题、能力点。
- [ ] 在 `index.html` 中于 `js/chinese-question-bank.js` 前加载 `js/chinese-curriculum-data.js`。
- [ ] 在 `tests/frontend-layout.test.js` 中断言页面加载该文件。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`，预期进入下一处失败。

## 任务 3：重构语文题库派生逻辑

**文件：**
- 修改：`js/chinese-question-bank.js`

- [ ] 从 `MathCampChineseCurriculumData` 派生教材知识点：
  - 课内教材点：`c{grade}-textbook-*`
  - 推荐读物点：`c{grade}-reading-book-*`
  - 原创拓展点：`c{grade}-extra-*`
- [ ] 保留现有 48 个能力线知识点，避免已有练习记录、错题本和专项入口失效。
- [ ] 为每个 point 增加：
  - `sourceType`
  - `sourceLabel`
  - `curriculum.term`
  - `curriculum.unit`
  - `curriculum.lessonTitle` 或 `curriculum.bookTitle`
  - `curriculum.knowledge`
- [ ] 导出 `autoSourcePolicy`、`curriculumData`、`pointsBySource`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`。

## 任务 4：实现题源比例调度与教材题生成

**文件：**
- 修改：`js/chinese-question-generator.js`
- 修改：`js/app.js`
- 修改：`tests/chinese-question-bank.test.js`
- 修改：`tests/question-rules.test.js`

- [ ] 在生成器中新增三类 spec：
  - 课内教材：围绕课文、识字、生字词、语文园地、习作目标生成客观题。
  - 推荐读物：围绕书名、人物、主题、阅读策略生成客观题。
  - 原创拓展：围绕成语、古诗、非连续文本、生活语用、表达规范生成客观题。
- [ ] 新增 `buildSourcePlan(count, weights)`，规则：
  - 10 题生成 `5/3/2` 或 `5/2/3`，总量接近 50/25/25。
  - 小题量时保证优先包含课内，3 题及以上尽量覆盖三类。
- [ ] 在 `app.js` 的语文自适应组卷路径中按题源计划选择知识点。
- [ ] 保持专项知识点练习不强制混合题源，避免用户选定某个知识点后被打散。
- [ ] 每道题继续保持 `answerType: "text"`、答案、解析、步骤。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js; node tests/question-rules.test.js`。

## 任务 5：同步 Android 并完整验证

**文件：**
- Android 镜像：`android/app/src/main/assets/www/**`

- [ ] 运行 `$ErrorActionPreference = 'Stop'; & '.\scripts\sync-android-assets.ps1'`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; npm run sync:android:check`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/frontend-layout.test.js`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/chinese-question-bank.test.js`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; node tests/question-rules.test.js`。
- [ ] 运行 `$ErrorActionPreference = 'Stop'; npm test`。

## 验收标准

- 语文知识库以“浙江省杭州市 / 统编版 / 人民教育出版社出版”为口径。
- 每个年级都有上下册教材知识、课文/识字/园地/习作/口语交际/快乐读书吧条目。
- 每个年级都有推荐读物与原创拓展题源。
- 语文混合组卷按课内 50%、推荐读物 25%、原创拓展 25% 接近分配。
- 专项练习仍按用户选择的知识点生成。
- 每道语文题都有答案、解析、步骤，并尽量使用客观题。
- Web 与 Android 静态资源一致。
