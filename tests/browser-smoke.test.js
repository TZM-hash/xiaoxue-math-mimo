const path = require("path");

let chromium;
try {
  ({ chromium } = require("playwright"));
} catch (_) {
  console.log("Playwright is not installed; skipping browser smoke test.");
  process.exit(0);
}

(async () => {
  const root = path.resolve(__dirname, "..");
  const url = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");
  const browser = await chromium.launch();
  const viewports = [
    { name: "desktop", width: 1366, height: 900 },
    { name: "mobile", width: 390, height: 844 }
  ];

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.addInitScript(() => { window.__MATHCAMP_TEST__ = true; });
      await page.goto(url);
      await page.waitForSelector("#practiceView", { timeout: 10000 });
      await page.waitForFunction(() => window.mathCampDebug && window.MathCampQuestionBankCoverage);
      const result = await page.evaluate(() => {
        const debug = window.mathCampDebug;
        const point = debug.pointMap["g4-angle-triangle"];
        debug.state.grade = 4;
        debug.state.pointId = point.id;
        debug.state.setSize = 4;
        debug.els.pointSelect.value = point.id;
        debug.startNewSet({ autoFocus: false });
        const coverage = window.MathCampQuestionBankCoverage.buildCoverageReport(window.MathCampQuestionBank);
        return {
          setSize: debug.state.currentSet.length,
          hasDiagram: debug.state.currentSet.some((question) => question.diagram),
          diagramMarkup: document.getElementById("questionDiagram").innerHTML.length,
          highGaps: coverage.gaps.filter((gap) => gap.level === "high").length
        };
      });
      if (result.setSize !== 4) throw new Error(`${viewport.name}: practice set did not build`);
      if (!result.hasDiagram || !result.diagramMarkup) throw new Error(`${viewport.name}: geometry diagram did not render`);
      if (result.highGaps) throw new Error(`${viewport.name}: question bank has high coverage gaps`);
      const chineseResult = await page.evaluate(() => {
        const debug = window.mathCampDebug;
        debug.selectSubject("chinese");
        debug.state.grade = 3;
        debug.state.pointId = "c3-paragraph-reading";
        debug.state.setSize = 3;
        debug.els.setSizeInput.value = "3";
        debug.els.pointSelect.value = "c3-paragraph-reading";
        debug.startNewSet({ autoFocus: false });
        return {
          subject: debug.state.subject,
          setSize: debug.state.currentSet.length,
          hasChinesePoint: debug.state.currentSet.every((question) => question.pointId === "c3-paragraph-reading"),
          hasExplanation: debug.state.currentSet.every((question) => question.explanation && question.steps && question.steps.length)
        };
      });
      if (chineseResult.subject !== "chinese") throw new Error(`${viewport.name}: Chinese subject did not activate`);
      if (chineseResult.setSize !== 3) throw new Error(`${viewport.name}: Chinese practice set did not build`);
      if (!chineseResult.hasChinesePoint || !chineseResult.hasExplanation) throw new Error(`${viewport.name}: Chinese questions missing metadata`);
      await page.close();
    }
  } finally {
    await browser.close();
  }

  console.log("Browser smoke tests passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
