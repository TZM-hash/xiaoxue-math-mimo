# Glass Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two immediately available glass themes with distinct clear and colorful visual directions, complete theme switching, Android mirroring, and responsive verification.

**Architecture:** Extend the existing theme registry and token system instead of adding a new theme engine. Theme-specific tokens define colors and glass strength, while shared selectors apply translucent surfaces and backdrop blur only to the two new themes.

**Tech Stack:** Vanilla JavaScript, CSS custom properties, `backdrop-filter`, static HTML, Edge browser tests, Android asset mirror.

---

### Task 1: Register Starter Themes

**Files:**
- Modify: `js/app.js`
- Modify: `index.html`
- Modify: `tests/question-rules.test.js`
- Modify: `tests/frontend-layout.test.js`

- [ ] Add failing tests for `glass-clear` and `glass-pop` registry entries, starter ownership, and settings options.
- [ ] Add both themes to `THEME_REGISTRY` with `initial: true`.
- [ ] Add both options to the theme selector.
- [ ] Verify old themes and current selections remain unchanged.

### Task 2: Add Theme Tokens and Glass Surfaces

**Files:**
- Modify: `css/theme-tokens.css`
- Modify: `css/app-shell.css`
- Modify: `css/practice.css`
- Modify: `css/pet-space.css`
- Modify: `css/reports-print.css`
- Modify: `tests/frontend-layout.test.js`

- [ ] Add failing source assertions for both token blocks and glass properties.
- [ ] Define clear-glass and colorful-glass palettes, opacity, blur, saturation, borders, and shadows.
- [ ] Add shared theme selectors for headers, navigation, cards, repeated items, modals, floating panels, inputs, and answer options.
- [ ] Add theme-specific gradient and decorative background layers behind application content.
- [ ] Add opaque fallback surfaces before backdrop-filter declarations.

### Task 3: Browser Interaction and Responsive QA

**Files:**
- Modify: `tests/browser-smoke.test.js`
- Mirror Web assets into `android/app/src/main/assets/www/`.

- [ ] Add browser tests that switch to both themes and confirm `data-theme` changes.
- [ ] Verify both themes are available without unlocking.
- [ ] Run full tests and Android sync checks.
- [ ] Capture desktop and 390×844 screenshots for home, practice, and theme shop states.
- [ ] Confirm text contrast, glass fallback, gradients, light decorations, floating cat, and controls render without clipping or overlap.
