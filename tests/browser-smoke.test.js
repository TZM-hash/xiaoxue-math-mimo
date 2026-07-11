const fs = require("fs");
const http = require("http");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const requireBrowser = process.argv.includes("--required") || process.env.MATHCAMP_REQUIRE_BROWSER === "1";
const root = path.resolve(__dirname, "..");
const appUrl = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");
const viewports = [
  { name: "desktop", width: 1366, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

async function runSmoke(createPage) {
  for (const viewport of viewports) {
    const page = await createPage(viewport);
    try {
      await page.addInitScript(() => { window.__MATHCAMP_TEST__ = true; });
      await page.goto(appUrl);
      await page.waitForSelector("#practiceView", { timeout: 10000 });
      await page.waitForFunction(() => window.mathCampDebug && window.MathCampQuestionBankCoverage);

      const result = await page.evaluate(() => {
        const debug = window.mathCampDebug;
        debug.selectSubject("math");
        debug.els.gradeGrid.querySelectorAll("button")[3].click();
        const point = debug.pointMap["g4-angle-triangle"];
        debug.state.pointId = point.id;
        debug.state.setSize = 4;
        debug.els.setSizeInput.value = "4";
        debug.els.pointSelect.value = point.id;
        debug.startNewSet({ autoFocus: false });
        // 跳到第一道带图示的题再渲染，避免受抽题顺序影响（部分题为纯文字题）。
        const diagramIndex = debug.state.currentSet.findIndex((question) => question.diagram);
        if (diagramIndex >= 0) {
          debug.state.index = diagramIndex;
          debug.renderPracticeQuestion();
        }
        const coverage = window.MathCampQuestionBankCoverage.buildCoverageReport(window.MathCampQuestionBank);
        return {
          setSize: debug.state.currentSet.length,
          hasDiagram: debug.state.currentSet.some((question) => question.diagram),
          firstDiagramType: debug.state.currentSet[debug.state.index]?.diagram?.type || "",
          diagramTypes: debug.state.currentSet.map((question) => question.diagram?.type || ""),
          diagramHidden: document.getElementById("questionDiagram").hidden,
          diagramMarkup: document.getElementById("questionDiagram").innerHTML.length,
          highGaps: coverage.gaps.filter((gap) => gap.level === "high").length
        };
      });

      if (result.setSize !== 4) throw new Error(`${viewport.name}: practice set did not build`);
      if (!result.hasDiagram || !result.diagramMarkup) throw new Error(`${viewport.name}: geometry diagram did not render ${JSON.stringify(result)}`);
      if (result.highGaps) throw new Error(`${viewport.name}: question bank has high coverage gaps`);

      const chineseResult = await page.evaluate(() => {
        const debug = window.mathCampDebug;
        debug.selectSubject("chinese");
        debug.els.gradeGrid.querySelectorAll("button")[2].click();
        debug.state.pointId = "c3-paragraph-reading";
        debug.state.setSize = 3;
        debug.els.setSizeInput.value = "3";
        debug.els.pointSelect.value = "c3-paragraph-reading";
        debug.startNewSet({ autoFocus: false });
        return {
          subject: debug.state.subject,
          setSize: debug.state.currentSet.length,
          hasChinesePoint: debug.state.currentSet.every((question) => question.pointId === "c3-paragraph-reading"),
          hasExplanation: debug.state.currentSet.every((question) => question.explanation && question.steps && question.steps.length),
          titleOptionCount: document.querySelectorAll("#questionText .question-option").length,
          answerOptionCount: document.querySelectorAll("#answerModePanel .answer-option").length
        };
      });

      if (chineseResult.subject !== "chinese") throw new Error(`${viewport.name}: Chinese subject did not activate`);
      if (chineseResult.setSize !== 3) throw new Error(`${viewport.name}: Chinese practice set did not build`);
      if (!chineseResult.hasChinesePoint || !chineseResult.hasExplanation) throw new Error(`${viewport.name}: Chinese questions missing metadata`);
      if (chineseResult.titleOptionCount !== 0 || chineseResult.answerOptionCount !== 4) {
        throw new Error(`${viewport.name}: objective choices should render once ${JSON.stringify(chineseResult)}`);
      }

      const scienceLayout = await page.evaluate(() => {
        const debug = window.mathCampDebug;
        debug.selectSubject("science");
        debug.state.grade = 3;
        debug.state.pointId = "s3-earth-air-weather";
        debug.els.pointSelect.innerHTML = debug.pointOptionsHTML(3, debug.state.pointId);
        debug.els.pointSelect.value = debug.state.pointId;
        debug.state.setSize = 3;
        debug.els.setSizeInput.value = "3";
        debug.startNewSet({ focus: true });
        const confidenceButtons = Array.from(document.querySelectorAll("#confidenceControl [data-confidence]"));
        confidenceButtons.find((button) => button.dataset.confidence === "guess")?.click();
        debug.els.petHintBtn.click();
        const firstHint = debug.els.methodHint.textContent;
        debug.els.petHintBtn.click();
        const secondHint = debug.els.methodHint.textContent;
        const visible = Array.from(document.querySelectorAll("#questionText, #answerModePanel, #answerModePanel .answer-option"));
        const viewportWidth = document.documentElement.clientWidth;
        return {
          documentOverflow: document.documentElement.scrollWidth - viewportWidth,
          widestRight: Math.max(...visible.map((element) => element.getBoundingClientRect().right), 0),
          viewportWidth,
          confidenceCount: confidenceButtons.length,
          selectedConfidence: debug.state.selectedConfidence,
          hintLevel: debug.state.hintLevel,
          hintsDiffer: firstHint !== secondHint,
          confidenceFits: document.getElementById("confidenceControl").getBoundingClientRect().right <= viewportWidth + 1
        };
      });
      if (scienceLayout.documentOverflow > 1 || scienceLayout.widestRight > scienceLayout.viewportWidth + 1) {
        throw new Error(`${viewport.name}: science question overflows viewport ${JSON.stringify(scienceLayout)}`);
      }
      if (scienceLayout.confidenceCount !== 3 || scienceLayout.selectedConfidence !== "guess" || !scienceLayout.confidenceFits) {
        throw new Error(`${viewport.name}: confidence control failed ${JSON.stringify(scienceLayout)}`);
      }
      if (scienceLayout.hintLevel !== 2 || !scienceLayout.hintsDiffer) {
        throw new Error(`${viewport.name}: staged hints failed ${JSON.stringify(scienceLayout)}`);
      }

      const interactionResult = await page.evaluate(async () => {
        document.getElementById("backToSetupBtn")?.click();
        await new Promise((resolve) => setTimeout(resolve, 20));
        let animationError = "";
        const onError = (event) => { animationError = event.error?.message || event.message || "unknown error"; };
        window.addEventListener("error", onError);

        window.MathCampAnimationIntegration?.setupNumberCounters?.();
        const todayPill = document.getElementById("todayPill");
        if (!todayPill.firstChild) todayPill.textContent = "0";
        if (todayPill.firstChild?.nodeType === Node.TEXT_NODE) todayPill.firstChild.data = "1";
        await new Promise((resolve) => setTimeout(resolve, 30));
        window.removeEventListener("error", onError);

        window.MathCampMicroInteractions?.enhanceSwitches?.();
        const nativeSwitch = document.querySelector(".custom-switch input[type='checkbox']");
        nativeSwitch?.focus();
        const switchFocusable = Boolean(nativeSwitch && document.activeElement === nativeSwitch && getComputedStyle(nativeSwitch).display !== "none");

        const returnTarget = document.getElementById("adaptiveToggle");
        returnTarget.focus();
        window.MathCampEffectsControl?.openModal?.();
        await new Promise((resolve) => setTimeout(resolve, 30));
        const effectsModal = document.getElementById("effectsSettingsModal");
        const modalFocused = Boolean(effectsModal?.contains(document.activeElement));
        window.MathCampEffectsControl?.closeModal?.();
        await new Promise((resolve) => setTimeout(resolve, 350));

        const themeSelect = document.getElementById("themeSelect");
        const fieldLabelTopmost = (fieldSelector) => {
          const label = document.querySelector(`${fieldSelector} .floating-label`);
          if (!label) return null;
          const rect = label.getBoundingClientRect();
          if (!rect.width || !rect.height) return null;
          const previousPointerEvents = label.style.pointerEvents;
          label.style.pointerEvents = "auto";
          const layers = document.elementsFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          label.style.pointerEvents = previousPointerEvents;
          const input = label.parentElement?.querySelector("input");
          const labelIndex = layers.indexOf(label);
          const inputIndex = layers.indexOf(input);
          return {
            topmost: labelIndex >= 0 && inputIndex >= 0 && labelIndex < inputIndex,
            labelIndex,
            inputIndex,
            labelZIndex: getComputedStyle(label).zIndex,
            inputZIndex: getComputedStyle(input).zIndex
          };
        };
        themeSelect.value = "glass-clear";
        themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 30));
        const clearTheme = document.documentElement.dataset.theme;
        const clearBackdrop = getComputedStyle(document.querySelector(".panel, .card, .home-dashboard")).backdropFilter;
        const clearSetupLabelLayers = [
          fieldLabelTopmost(".setup-set-size-field"),
          fieldLabelTopmost(".setup-daily-goal-field")
        ];
        themeSelect.value = "glass-pop";
        themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 30));
        const popTheme = document.documentElement.dataset.theme;
        const popSetupLabelLayers = [
          fieldLabelTopmost(".setup-set-size-field"),
          fieldLabelTopmost(".setup-daily-goal-field")
        ];

        return {
          animationError,
          switchFocusable,
          switchDisplay: nativeSwitch ? getComputedStyle(nativeSwitch).display : "missing",
          switchId: nativeSwitch?.id || "",
          activeElementId: document.activeElement?.id || "",
          activeElementTag: document.activeElement?.tagName || "",
          modalFocused,
          focusRestored: document.activeElement === returnTarget,
          clearTheme,
          popTheme,
          clearBackdrop,
          clearSetupLabelLayers,
          popSetupLabelLayers
        };
      });

      if (interactionResult.animationError) throw new Error(`${viewport.name}: number counter mutation failed: ${interactionResult.animationError}`);
      if (interactionResult.switchDisplay === "none" || !interactionResult.switchId) {
        throw new Error(`${viewport.name}: custom switch hides the native checkbox ${JSON.stringify(interactionResult)}`);
      }
      if (viewport.width >= 700 && !interactionResult.switchFocusable) {
        throw new Error(`${viewport.name}: custom switch lost native keyboard focus ${JSON.stringify(interactionResult)}`);
      }
      if (viewport.width >= 700 && (!interactionResult.modalFocused || !interactionResult.focusRestored)) {
        throw new Error(`${viewport.name}: effects modal focus flow failed ${JSON.stringify(interactionResult)}`);
      }
      if (interactionResult.clearTheme !== "glass-clear" || interactionResult.popTheme !== "glass-pop" || interactionResult.clearBackdrop === "none") {
        throw new Error(`${viewport.name}: glass theme switching failed ${JSON.stringify(interactionResult)}`);
      }
      const visibleGlassLabelLayers = [...interactionResult.clearSetupLabelLayers, ...interactionResult.popSetupLabelLayers].filter(Boolean);
      if (visibleGlassLabelLayers.some((item) => !item.topmost)) {
        throw new Error(`${viewport.name}: glass theme setup labels are covered by inputs ${JSON.stringify(interactionResult)}`);
      }
    } finally {
      await page.close();
    }
  }
}

async function runWithPlaywright() {
  let chromium;
  try {
    ({ chromium } = require("playwright"));
  } catch (_) {
    return false;
  }

  const browser = await chromium.launch();
  try {
    await runSmoke((viewport) => browser.newPage({ viewport }));
  } finally {
    await browser.close();
  }
  console.log("Browser smoke tests passed with Playwright.");
  return true;
}

function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}: ${body}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

function commandExists(command) {
  const pathDirs = (process.env.PATH || "").split(path.delimiter);
  const extensions = process.platform === "win32"
    ? (process.env.PATHEXT || ".EXE;.CMD;.BAT").split(";")
    : [""];

  return pathDirs.some((dir) => {
    if (!dir) return false;
    return extensions.some((extension) => fs.existsSync(path.join(dir, command + extension.toLowerCase()))
      || fs.existsSync(path.join(dir, command + extension.toUpperCase())));
  });
}

function browserCandidates() {
  const envPath = process.env.MATHCAMP_CHROMIUM_PATH || process.env.CHROME_PATH;
  const programFiles = process.env.ProgramFiles || process.env.PROGRAMFILES;
  const programFilesX86 = process.env["ProgramFiles(x86)"] || process.env["PROGRAMFILES(X86)"];
  const candidates = [
    envPath,
    process.platform === "win32" && programFiles && path.join(programFiles, "Google/Chrome/Application/chrome.exe"),
    process.platform === "win32" && programFilesX86 && path.join(programFilesX86, "Google/Chrome/Application/chrome.exe"),
    process.platform === "win32" && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
    process.platform === "win32" && programFiles && path.join(programFiles, "Microsoft/Edge/Application/msedge.exe"),
    process.platform === "win32" && programFilesX86 && path.join(programFilesX86, "Microsoft/Edge/Application/msedge.exe"),
    process.platform === "darwin" && "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    process.platform === "darwin" && "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    process.platform !== "win32" && "google-chrome",
    process.platform !== "win32" && "chromium",
    process.platform !== "win32" && "chromium-browser",
    process.platform !== "win32" && "microsoft-edge"
  ].filter(Boolean);

  return candidates.filter((candidate) => candidate.includes(path.sep) ? fs.existsSync(candidate) : commandExists(candidate));
}

class CdpPage {
  constructor(webSocketUrl, viewport) {
    this.id = 1;
    this.pending = new Map();
    this.loaded = false;
    this.viewport = viewport;
    this.socket = new WebSocket(webSocketUrl);
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => this.handleMessage(event));
    this.socket.addEventListener("close", () => {
      for (const { reject } of this.pending.values()) reject(new Error("CDP socket closed"));
      this.pending.clear();
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (message.method === "Page.loadEventFired") {
      this.loaded = true;
      return;
    }
    if (!message.id || !this.pending.has(message.id)) return;
    const { resolve, reject } = this.pending.get(message.id);
    this.pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message));
    } else {
      resolve(message.result || {});
    }
  }

  async command(method, params = {}) {
    await this.opened;
    const id = this.id++;
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(payload);
    });
  }

  async addInitScript(fn) {
    await this.command("Page.enable");
    await this.command("Runtime.enable");
    await this.command("Page.addScriptToEvaluateOnNewDocument", { source: `(${fn.toString()})();` });
    await this.command("Emulation.setDeviceMetricsOverride", {
      width: this.viewport.width,
      height: this.viewport.height,
      deviceScaleFactor: 1,
      mobile: this.viewport.width < 700
    });
  }

  async goto(url) {
    this.loaded = false;
    await this.command("Page.navigate", { url });
    await this.waitFor(() => this.loaded, { timeout: 10000 });
  }

  async evaluate(fn) {
    const result = await this.command("Runtime.evaluate", {
      expression: `(${fn.toString()})();`,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description
        || result.exceptionDetails.exception?.value
        || result.exceptionDetails.text
        || "Evaluation failed";
      throw new Error(detail);
    }
    return result.result ? result.result.value : undefined;
  }

  async waitForSelector(selector, options = {}) {
    await this.waitForFunction((target) => Boolean(document.querySelector(target)), options, selector);
  }

  async waitForFunction(fn, options = {}, arg) {
    const expression = arg === undefined
      ? `(${fn.toString()})();`
      : `(${fn.toString()})(${JSON.stringify(arg)});`;
    await this.waitFor(async () => {
      const result = await this.command("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
      return Boolean(result.result && result.result.value);
    }, options);
  }

  async waitFor(predicate, options = {}) {
    const timeout = options.timeout || 10000;
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (await predicate()) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Timed out waiting for browser condition");
  }

  async close() {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
  }
}

async function runWithSystemBrowser() {
  const [executable] = browserCandidates();
  if (!executable) return false;

  const port = await reservePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "mathcamp-browser-"));
  const browser = spawn(executable, [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  try {
    await waitForDevTools(port, browser);
    await runSmoke(async (viewport) => {
      const target = await newTarget(port);
      return new CdpPage(target.webSocketDebuggerUrl, viewport);
    });
  } finally {
    browser.kill();
    await new Promise((resolve) => browser.once("exit", resolve));
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  console.log(`Browser smoke tests passed with ${path.basename(executable)}.`);
  return true;
}

async function waitForDevTools(port, browser) {
  const started = Date.now();
  while (Date.now() - started < 10000) {
    if (browser.exitCode !== null) {
      throw new Error(`Browser exited before DevTools became available: ${browser.exitCode}`);
    }
    try {
      await requestJson(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch (_) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Timed out waiting for browser DevTools endpoint");
}

async function newTarget(port) {
  try {
    return await requestJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  } catch (_) {
    return requestJson(`http://127.0.0.1:${port}/json/new?about:blank`);
  }
}

(async () => {
  if (await runWithPlaywright()) return;
  if (await runWithSystemBrowser()) return;

  const message = "No Playwright install or Chrome/Edge executable was found; skipping browser smoke test.";
  if (requireBrowser) throw new Error(message);
  console.log(message);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
