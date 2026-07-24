# Question Experience Quality Implementation Plan

> **For agentic workers:** Execute inline in three testable phases. Use test-first changes and verify the Web and Android mirrors after each phase.

**Goal:** Improve question content quality, selection diversity, subject-specific answering, and responsive question layout across all subjects.

**Architecture:** Keep the existing question object contract. Add presentation helpers in `app.js`, quality heuristics in the existing rules engine/tests, and derive selection buckets from current fields instead of introducing shared schema. Apply responsive changes through the existing practice CSS.

**Tech Stack:** Vanilla JavaScript, CSS, Node assertion tests, Edge CDP browser smoke, Android WebView asset mirror.

---

### Task 1: Remove duplicate objective options

**Files:**
- Modify: `js/app.js`
- Test: `tests/frontend-layout.test.js`
- Test: `tests/browser-smoke.test.js`

- [ ] Add a failing contract asserting objective question titles render only the prompt when an interactive choice panel is active.
- [ ] Add browser assertions that each choice label appears once in the visible question card.
- [ ] Implement a prompt-only rendering helper and keep full options in the answer button panel.
- [ ] Run layout and browser tests.

### Task 2: Fix mobile reflow and overlay collisions

**Files:**
- Modify: `css/practice.css`
- Modify: `css/responsive-overrides.css`
- Modify: `js/app.js`
- Test: `tests/frontend-layout.test.js`
- Test: `tests/browser-smoke.test.js`

- [ ] Add failing contracts for `min-width: 0`, overflow wrapping, mobile single-column options, and a reserved bottom interaction area.
- [ ] Add browser measurements proving no horizontal overflow at 390×844.
- [ ] Implement responsive wrapping and move/hide floating assistance while primary controls occupy the lower viewport.
- [ ] Verify four subjects on desktop and mobile.

### Task 3: Add visible-question quality rules

**Files:**
- Modify: `js/question-rules-engine.js`
- Modify: `tests/question-rules.test.js`
- Modify: `tests/frontend-layout.test.js`

- [ ] Add failing tests for production-language leakage, generic nonsense distractors, and cross-topic science explanations.
- [ ] Add warning rules without changing existing hard correctness rules.
- [ ] Verify the audit reports the known low-quality examples.

### Task 4: Clean known low-quality sources

**Files:**
- Modify: `js/grade3-reference-question-seeds.js`
- Modify: `js/grade4-reference-question-seeds.js`
- Modify: `js/science-question-generator.js`
- Modify: `js/chinese-question-generator.js`
- Test: subject question-bank tests and `tests/question-rules.test.js`

- [ ] Add failing source assertions rejecting student-visible “参考截图/改写题” prefixes.
- [ ] Rewrite the known reference prompts as direct student questions.
- [ ] Split science weather and model fallback concepts; replace absurd distractors with plausible misconceptions.
- [ ] Replace Chinese generic fallback choices and generic explanation with point-specific wording derived from existing metadata.
- [ ] Run all subject and rule tests.

### Task 5: Balance question selection

**Files:**
- Modify: `js/app.js`
- Modify: `js/practice-engine.js`
- Test: `tests/question-rules.test.js`

- [ ] Add failing tests showing a round should use multiple available templates/modes and avoid repeated answer positions.
- [ ] Derive selection buckets from `answerType`, `questionType`, `sourceType`, `sourceMeta`, and current interaction mode.
- [ ] Select by underrepresented bucket before falling back to existing distinct-question logic.
- [ ] Preserve recent-question avoidance and adaptive weak-point priority.
- [ ] Run rule and subject-isolation tests.

### Task 6: Improve subject-specific answering copy

**Files:**
- Modify: `js/app.js`
- Modify: `js/question-interaction.js`
- Test: `tests/answer-modes.test.js`
- Test: `tests/frontend-layout.test.js`

- [ ] Add failing tests for subject-specific input placeholders and hint copy.
- [ ] Implement concise subject-aware prompts using existing subject and answer-type fields.
- [ ] Keep choice and judge interactions immediate; preserve math numeric keyboard behavior.
- [ ] Run answer-mode and browser tests.

### Task 7: Integrate and verify

**Files:**
- Mirror modified Web assets into `android/app/src/main/assets/www/`.

- [ ] Run `npm test`.
- [ ] Run `npm run sync:android:check`.
- [ ] Capture four-subject desktop and mobile screenshots.
- [ ] Confirm no horizontal overflow, duplicate options, blocked primary actions, or production-language leakage.
