/* Bismillah */

/*
RUN AUDIT: the audits of basic.js Designer (audit-runner.js) from the terminal. The designer opens audit/audit.htm in
headless Chrome, with the plain server of the tests (test/_chrome.js). WHY not Live Server: it reloads the page when a
file of the workspace changes, and a long audit stops in the middle.

    node _basic-designer/audit/run-audit.js                          read, list, extra, special, mouse, param, editor, manual
    node _basic-designer/audit/run-audit.js editor manual            these audits
    node _basic-designer/audit/run-audit.js change                   every property as the panel changes it (about 8 minutes)
    node _basic-designer/audit/run-audit.js change --only box.tick,checkPlain    runChangeAudit of these objects only

It prints every audit (passed / tested, or the differences of read) and its fails, then the errors of the page.
The exit code is 1 when an audit failed or did not finish, 2 when the tool itself could not run.
read runs first when it is named: the last check of extra makes the CheckBox again, read after it measures the old parts.
It needs Chrome and puppeteer-core, like the tools of test/ (CHROME_PATH for another place of Chrome).
*/

"use strict";

const chrome = require("../../test/_chrome.js");

// name -> the function of audit-runner.js (read gives a list of differences, the others { passed, fails } or { tested, fails })
const AUDITS = {
    read: "readAudit",
    list: "runListAudit",
    extra: "runExtraAudit",
    special: "runSpecialAudit",
    mouse: "runMouseAudit",
    param: "runParamAudit",
    editor: "runEditorAudit",
    manual: "runManualAudit",
    change: "runChangeAudit",
};
const DEFAULT_AUDITS = ["read", "list", "extra", "special", "mouse", "param", "editor", "manual"];

const DESIGNER_PAGE = "_basic-designer/index.htm";
const AUDIT_PAGE = "_basic-designer/audit/audit.htm";
const RUNNER_FILE = "audit/audit-runner.js"; // from the page of the designer
const WINDOW = { width: 1600, height: 1000 };
const LOAD_TIMEOUT = 60000; // ms
const SETTLE_TIME = 1500; // ms: the page of the audit makes its objects, the layers are read
const AUDIT_TIMEOUT = 15 * 60 * 1000; // ms: the change audit takes about 8 minutes
const LOOK_INTERVAL = 500; // ms between two looks at the result
const CLOSE_TIMEOUT = 5000; // ms
const SHOWN_LINES = 40; // the fails of one audit that are printed

// *** IN THE PAGE:

// Starts an audit; its result (or its error) waits in the page. WHY not awaited in one call: a call of the browser has
// a time limit (3 minutes), the change audit takes longer (a waitForFunction is one long call too).
const startAudit = function (functionName, only) {
    window.__auditResult = null;
    window.__auditError = "";
    Promise.resolve().then(function () {
        return window[functionName](only || undefined);
    }).then(function (result) {
        window.__auditResult = JSON.parse(JSON.stringify(result));
    }).catch(function (error) {
        window.__auditError = String((error && error.message) || error);
    });
};

const loadRunner = function (file) {
    return new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = file + "?" + Date.now();
        script.onload = resolve;
        script.onerror = function () { reject(new Error("could not load " + file)); };
        document.head.appendChild(script);
    });
};

// *** THE DESIGNER:

const openDesigner = async function (browser, origin, problems) {
    const page = await browser.newPage();
    page.on("pageerror", function (error) { problems.push("PAGE ERROR " + error.message); });
    // WHY accept: a confirm of the designer would wait for a click forever
    page.on("dialog", function (dialog) {
        problems.push("DIALOG " + dialog.message());
        dialog.accept().catch(function () { });
    });
    page.on("response", function (response) {
        if (response.status() < 400 || response.url().includes("favicon")) return;
        problems.push("NOT FOUND (" + response.status() + ") " + response.url().replace(origin, ""));
    });
    await page.setViewport(WINDOW);
    await page.goto(origin + "/" + DESIGNER_PAGE, { waitUntil: "load", timeout: LOAD_TIMEOUT });
    await page.waitForFunction("window.BasicDesigner && BasicDesigner.state", { timeout: LOAD_TIMEOUT });
    await page.evaluate(function (pagePath) { return BasicDesigner.load(pagePath); }, AUDIT_PAGE);
    await page.waitForFunction("BasicDesigner.state.rt && BasicDesigner.state.tree.length > 0", { timeout: LOAD_TIMEOUT });
    await chrome.sleep(SETTLE_TIME);
    await page.evaluate(loadRunner, RUNNER_FILE);
    await page.evaluate("collectAuditObjects()");
    return page;
};

// Short looks at the page until the audit has a result: { result, error }
const waitForResult = async function (page) {
    const endAt = Date.now() + AUDIT_TIMEOUT;
    while (Date.now() < endAt) {
        const done = await page.evaluate("(window.__auditResult !== null || window.__auditError !== '') ? { result: window.__auditResult, error: window.__auditError } : null");
        if (done) return done;
        await chrome.sleep(LOOK_INTERVAL);
    }
    return { result: null, error: "did not finish in " + Math.round(AUDIT_TIMEOUT / 60000) + " minutes" };
};

// { title, isPassed, lines }
const runAudit = async function (page, name, only) {
    const startedAt = Date.now();
    await page.evaluate(startAudit, AUDITS[name], only);
    const done = await waitForResult(page);
    const seconds = Math.round((Date.now() - startedAt) / 1000);
    if (done.error) return { title: name + ": ERROR " + done.error, isPassed: false, lines: [] };
    const result = done.result;
    if (Array.isArray(result)) {
        return { title: name + " (" + seconds + " s): " + result.length + " differences", isPassed: !result.length, lines: result };
    }
    const passed = (result.passed) ? result.passed.length : result.tested;
    const title = name + " (" + seconds + " s): " + passed + " passed / tested, " + result.fails.length + " fails";
    return { title: title, isPassed: !result.fails.length, lines: result.fails.map(function (fail) { return "FAIL " + fail; }) };
};

// *** START:

const readOptions = function (args) {
    const options = { names: [], only: null, isHelp: false };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--help") options.isHelp = true;
        else if (arg === "--only") options.only = (args[++i] || "").split(",").filter(Boolean);
        else options.names.push(arg);
    }
    if (!options.names.length) options.names = DEFAULT_AUDITS.slice();
    // WHY read first: see the header
    const readIndex = options.names.indexOf("read");
    if (readIndex > 0) options.names.unshift(options.names.splice(readIndex, 1)[0]);
    return options;
};

const closeBrowser = async function (browser) {
    // WHY a time limit: a page that asks before it unloads kept the close waiting.
    await Promise.race([browser.close(), chrome.sleep(CLOSE_TIMEOUT)]);
    if (browser.process()) browser.process().kill("SIGKILL");
};

const main = async function () {
    const options = readOptions(process.argv.slice(2));
    if (options.isHelp) {
        console.log(chrome.helpText(__filename));
        return 0;
    }
    const unknown = options.names.filter(function (name) { return !AUDITS[name]; });
    if (unknown.length) throw new Error("No such audit: " + unknown.join(", ") + " (" + Object.keys(AUDITS).join(", ") + ")");

    const server = await chrome.startServer({ listFolders: true });
    const browser = await chrome.launchChrome();
    const origin = "http://127.0.0.1:" + server.address().port;
    const problems = [];
    let isAllPassed = true;

    try {
        const page = await openDesigner(browser, origin, problems);
        for (const name of options.names) {
            const result = await runAudit(page, name, options.only);
            console.log(result.title);
            result.lines.slice(0, SHOWN_LINES).forEach(function (line) { console.log("  " + String(line).slice(0, 400)); });
            if (result.lines.length > SHOWN_LINES) console.log("  ... " + (result.lines.length - SHOWN_LINES) + " more");
            if (!result.isPassed) isAllPassed = false;
        }
    } finally {
        if (problems.length) console.log("The page:\n  " + problems.slice(0, SHOWN_LINES).join("\n  "));
        await closeBrowser(browser);
        server.close();
    }

    return (isAllPassed) ? 0 : 1;
};

main().then(function (exitCode) {
    process.exit(exitCode);
}).catch(function (error) {
    console.error(error.message);
    process.exit(2);
});
