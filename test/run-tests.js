/* Bismillah */

/*
RUN TESTS: the self-checking test pages from the terminal, one after the other.

    node test/run-tests.js                              components and behavior (the tests of a changed component)
    node test/run-tests.js behavior                     one test page: basic, samples, components or behavior
    node test/run-tests.js basic components behavior    several
    node test/run-tests.js components --only tabs       ?only= of the page: a part of the file name (components, samples)
                                                        or of the test name (behavior), in any case, "-" not counted;
                                                        a text that is in none of them FAILS (a typo tests nothing)
    node test/run-tests.js --only scroll-area           one component: its file in components, its tests in behavior (10 s)
    node test/run-tests.js behavior --commit HEAD       the page as it is in a commit, with the basic/ and comp/ of that commit
    node test/run-tests.js --scroll-bars                scroll bars that take room, as WebKit with "Show scroll bars: Always"
                                                        (a mouse on a Mac) and Windows: a box a bar makes narrower is tested

It prints the title of every page ("... - ALL PASS" or "... - 2 FAILED") and the lines of what failed or warned, and
the errors of the page that no check of it saw (PAGE ERROR: an exception; ERROR EVENT: an error event of the window,
as a ResizeObserver loop).
Then the catalog (not with --commit): every sample of 02-comp-examples is a sample in index/catalog.js, and every
sample named there is a file.
The exit code is 1 when a page failed or did not finish, 2 when the tool itself could not run.
It needs Chrome and puppeteer-core, like compare-pages.js (CHROME_PATH for another place of Chrome).
WHY one page at a time: the pages measure sizes and times; two pages side by side made each other slow. When another
tool with Chrome runs at the same time (another session), it says so at the start and at the end (a NOTE).
WHY --commit: a test page is committed in parts (each session its own lines); the folder has the whole page and passes,
while the commits had a test without its first lines, and their page did not open for two days.
*/

"use strict";

const fs = require("fs");
const path = require("path");
const chrome = require("./_chrome.js");

const PAGES = {
    basic: "test/basic-test.htm",
    samples: "test/basic-samples-test.htm",
    components: "test/components-test.htm",
    behavior: "test/behavior-test.htm",
};
const DEFAULT_PAGES = ["components", "behavior"];

const WINDOW = { width: 1280, height: 800 };
const LOAD_TIMEOUT = 30000; // ms
const FINISH_TIMEOUT = 10 * 60 * 1000; // ms: behavior-test takes about 70 s
const LOOK_INTERVAL = 300; // ms between two looks at the title
const FINISHED_TITLE = /ALL PASS| FAILED/;
const PROBLEM_LINE = /^\s*(✗|!|FAIL|WARN)/;

// *** IN THE PAGE:

// The lines of the page that name a failed or warned check.
const readProblemLines = function (problemSource) {
    const problem = new RegExp(problemSource);
    return document.body.innerText.split("\n").filter(function (line) { return problem.test(line); });
};

// *** ONE PAGE:

// The same line once, with how many times it came ("... (4 times)"). WHY: a ResizeObserver loop says it at every frame.
const withoutRepeats = function (lines) {
    const counts = new Map();
    lines.forEach(function (line) { counts.set(line, (counts.get(line) || 0) + 1); });
    return [...counts].map(function ([line, count]) {
        return (count > 1) ? line + " (" + count + " times)" : line;
    });
};

const runPage = async function (browser, url) {
    const context = await browser.createBrowserContext();
    const errors = [];
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        page.on("pageerror", function (error) { errors.push("PAGE ERROR " + error.message); });
        page.on("console", function (message) {
            if (message.text().startsWith("ERROR EVENT ")) errors.push(message.text()); // chrome.guardPage writes it
        });
        await page.setViewport(WINDOW);
        await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT });
        await page.waitForFunction("/ALL PASS| FAILED/.test(document.title)", { timeout: FINISH_TIMEOUT, polling: LOOK_INTERVAL });
        const title = await page.title();
        const problems = await page.evaluate(readProblemLines, PROBLEM_LINE.source);
        return { title: title, isPassed: !/ FAILED/.test(title), lines: problems.concat(withoutRepeats(errors)) };
    } catch (error) {
        return { title: "did not finish: " + error.message.split("\n")[0], isPassed: false, lines: withoutRepeats(errors) };
    } finally {
        await context.close();
    }
};

// *** START:

const readOptions = function (args) {
    const options = { names: [], only: "", commit: "", scrollBars: false, isHelp: false };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--help") options.isHelp = true;
        else if (arg === "--only") options.only = args[++i] || "";
        else if (arg === "--commit") options.commit = args[++i] || "HEAD";
        else if (arg === "--scroll-bars") options.scrollBars = true;
        else options.names.push(arg);
    }
    if (!options.names.length) options.names = DEFAULT_PAGES;
    return options;
};

// *** THE CATALOG:

const CATALOG_FILE = "index/catalog.js";
const CATALOG_SAMPLE = /"(02-comp-examples\/[\w.-]+\.htm)"/g;

// The samples of the folder that the catalog does not name, and the ones it names that are not files.
// WHY: a new or renamed sample was left out of the catalog again and again (tabs-2, form, text-field-6 / 7...).
const checkCatalog = function () {
    const catalog = fs.readFileSync(path.join(chrome.ROOT, CATALOG_FILE), "utf8");
    const named = new Set(Array.from(catalog.matchAll(CATALOG_SAMPLE), function (match) { return match[1]; }));
    const samples = chrome.listSamples();
    const notNamed = samples.filter(function (page) { return !named.has(page); });
    const notFiles = [...named].filter(function (page) { return !samples.includes(page); });
    return { notNamed, notFiles };
};

const printCatalog = function () {
    const result = checkCatalog();
    const problemCount = result.notNamed.length + result.notFiles.length;
    if (problemCount === 0) {
        console.log("Catalog: every sample is in " + CATALOG_FILE + " - ALL PASS");
        return true;
    }
    console.log("Catalog: " + problemCount + " FAILED");
    result.notNamed.forEach(function (page) { console.log("  ✗ not in " + CATALOG_FILE + ": " + page); });
    result.notFiles.forEach(function (page) { console.log("  ✗ in " + CATALOG_FILE + ", no such file: " + page); });
    return false;
};

const main = async function () {
    const options = readOptions(process.argv.slice(2));
    if (options.isHelp) {
        console.log(chrome.helpText(__filename));
        return 0;
    }
    const unknown = options.names.filter(function (name) { return !PAGES[name]; });
    if (unknown.length) throw new Error("No such test: " + unknown.join(", ") + " (" + Object.keys(PAGES).join(", ") + ")");

    const server = await chrome.startServer({ commit: options.commit });
    const browser = await chrome.launchChrome({ scrollBars: options.scrollBars });
    // A commit: the server gives its files under OLD_PATH (the page and the scripts it loads from there)
    const origin = "http://127.0.0.1:" + server.address().port + ((options.commit) ? chrome.OLD_PATH : "");
    let isAllPassed = true;
    const run = chrome.startRun("run-tests");
    if (run.hasOthers()) console.log(run.describeOthers());

    try {
        for (const name of options.names) {
            run.noteOthers();
            const query = (options.only) ? "?only=" + encodeURIComponent(options.only) : "";
            const result = await runPage(browser, origin + "/" + PAGES[name] + query);
            console.log(result.title);
            result.lines.forEach(function (line) { console.log("  " + line.trim()); });
            if (!result.isPassed) isAllPassed = false;
        }
    } finally {
        await browser.close();
        server.close();
        run.end();
    }

    // WHY not with --commit: the catalog of the folder, not of the commit
    if (!options.commit && !printCatalog()) isAllPassed = false;
    if (run.hasOthers()) console.log(run.describeOthers());
    return (isAllPassed) ? 0 : 1;
};

main().then(function (exitCode) {
    process.exitCode = exitCode;
}).catch(function (error) {
    console.error(error.message);
    process.exitCode = 2;
});
