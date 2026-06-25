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
