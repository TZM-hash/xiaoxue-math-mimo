# Adaptive Learning Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add evidence-based mastery, dynamic difficulty, quality gating, semantic deduplication, staged hints, optional confidence, and wrong-question learning chains while preserving four visible cause options per subject.

**Architecture:** Add a pure `MathCampLearningQuality` module for scoring and state transitions. Keep DOM, profile persistence, and practice orchestration in `app.js`, and pass quality helpers into `practice-engine.js` for candidate filtering and weighting. All new persisted fields are optional and normalized for backward compatibility.

**Tech Stack:** Vanilla JavaScript, browser local storage, Node-based rule/layout/browser tests, Android static asset mirror.

**Status:** Implemented and verified on 2026-07-11.

---

### Task 1: Pure Learning Quality Engine

**Files:**
- Create: `js/learning-quality-engine.js`
- Create: `tests/learning-quality-engine.test.js`
- Modify: `package.json`

- [ ] Write failing tests for confidence normalization, diagnostic inference, mastery deltas, difficulty scoring, quality scoring, family keys, and review-chain transitions.
- [ ] Run `node tests/learning-quality-engine.test.js` and confirm the module is missing.
- [ ] Implement pure functions with no DOM or storage dependencies.
- [ ] Run the new test and confirm all quality-engine cases pass.

### Task 2: Load Module and Normalize Optional Learning Evidence

**Files:**
- Modify: `index.html`
- Modify: `js/app.js`
- Modify: `tests/question-rules.test.js`
- Modify: `tests/frontend-layout.test.js`

- [ ] Add failing tests for old-profile migration and normalized optional evidence fields.
- [ ] Load `learning-quality-engine.js` before `practice-engine.js` and `app.js`.
- [ ] Normalize mastery `score`, diagnostics, stable correct count, history evidence, wrong-item chain stage, and recent diagnosis without changing required question fields.
- [ ] Verify old profiles retain history, mastery, and wrongbook entries.

### Task 3: Confidence Control and Per-Question Timing

**Files:**
- Modify: `index.html`
- Modify: `css/practice.css`
- Modify: `css/responsive-overrides.css`
- Modify: `js/app.js`
- Modify: `tests/browser-smoke.test.js`
- Modify: `tests/frontend-layout.test.js`

- [ ] Add failing layout and browser tests for a three-option optional confidence control.
- [ ] Add `确定 / 不确定 / 猜的` segmented buttons near the answer controls.
- [ ] Reset confidence and question start time on each rendered question.
- [ ] Record confidence and elapsed time on first submission without blocking unanswered confidence.
- [ ] Verify the control fits a 390×844 viewport without hiding answer actions.

### Task 4: Three-Level Hints and Evidence-Based Mastery

**Files:**
- Modify: `js/app.js`
- Modify: `tests/question-rules.test.js`
- Modify: `tests/browser-smoke.test.js`

- [ ] Add failing tests for three distinct hint levels and confidence/hint-sensitive mastery changes.
- [ ] Replace the single hint reveal with level 1 direction, level 2 method, and level 3 key-step content.
- [ ] Record the highest hint level used and reset it between questions.
- [ ] Update mastery using the learning-quality engine while preserving legacy attempts, correct, level, and streak fields.
- [ ] Keep visible cause chips at exactly four for every subject.

### Task 5: Quality Gate and Semantic Diversity

**Files:**
- Modify: `js/app.js`
- Modify: `js/practice-engine.js`
- Modify: `tests/question-rules.test.js`
- Modify: `tests/learning-quality-engine.test.js`

- [ ] Add failing tests showing low-quality questions are rejected when alternatives exist and same-family questions are deprioritized.
- [ ] Compute quality scores after generation and attach only internal runtime metadata.
- [ ] Track used/recent family keys alongside exact repeat keys.
- [ ] Prefer unused families and acceptable quality while retaining a fallback path for small pools.
- [ ] Extend quality audit output with numeric score and reasons.

### Task 6: Wrong-Question Learning Chain and Dynamic Review

**Files:**
- Modify: `js/app.js`
- Modify: `js/practice-engine.js`
- Modify: `tests/question-rules.test.js`

- [ ] Add failing tests for `scaffold -> sameModel -> transfer -> delayed` progression and reset on error.
- [ ] Persist optional `chainStage`, recent diagnosis, confidence, and hint level on wrong items.
- [ ] Generate easier scaffold variants first, same-model variants next, transfer variants after stable success, then delayed review.
- [ ] Require stable, low-hint, non-guess success before moving a wrong item to mastered history.
- [ ] Keep existing due dates and review stages compatible with old data.

### Task 7: Adaptive Difficulty and Weekly Mix

**Files:**
- Modify: `js/app.js`
- Modify: `js/practice-engine.js`
- Modify: `tests/question-rules.test.js`

- [ ] Add failing tests for dynamic difficulty targets and mixed daily/weekly composition.
- [ ] Calculate target difficulty from mastery score and recent evidence.
- [ ] Weight candidate points by mastery score, diagnosis evidence, due chains, recent exposure, and target difficulty.
- [ ] Keep strict point practice within the selected point while balancing format, family, and difficulty.
- [ ] Reuse existing daily, timed, weak, and wrongbook entries rather than adding new navigation.

### Task 8: Synchronization and Verification

**Files:**
- Mirror all modified Web assets into `android/app/src/main/assets/www/`.

- [ ] Run `npm test`.
- [ ] Run `scripts/sync-android-assets.ps1` and its `-Check` mode.
- [ ] Run `npm run sync:android:check` and `git diff --check`.
- [ ] Capture desktop and 390×844 screenshots for math, Chinese, English, and science.
- [ ] Confirm confidence controls, staged hints, answer controls, and choice options have no clipping or overlap.
