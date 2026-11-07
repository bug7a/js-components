/* Bismillah */

/*
COMPARE PAGES: does a page still work the same after a change?

Every page is opened twice, as it is now and as it was in a git commit, and the two are compared:
the DOM, a screenshot, the text after every press and every typed field, and the console. At 1280 and 390 px.
The old page loads the old basic/ and comp/ too, so a change in a component is measured as well.

    node test/compare-pages.js                          the samples changed since the last commit,
                                                        and the samples that load a changed component
    node test/compare-pages.js tabs.htm dialog.htm      these pages (of 02-comp-examples, or a path from the root)
    node test/compare-pages.js --all                    every sample (long)
    node test/compare-pages.js --base HEAD~3 tabs.htm   against another commit

The results:
    SAME    no difference (a difference that goes away when the page is opened again was only timing)
    LIVE    it differs, and it differs from itself too in the same parts (a live chart, a running animation):
            this tool can not tell; read the lines it prints
    DIFF    a real difference. The exit code is 1, the pictures and the texts are in the folder it prints

It presses and types, nothing else: hover, drag and the keyboard are not measured.
It needs Chrome and puppeteer-core (npm install puppeteer-core; CHROME_PATH for another place of Chrome).
WHY one browser, one page at a time: three browsers side by side gave 22 false differences in 122 pages.
*/

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const chrome = require("./_chrome.js");
const { ROOT, SAMPLES_FOLDER, OLD_PATH, readGitLines, isInCommit, listSamples, sleep } = chrome;

const OUT_FOLDER = path.join(os.tmpdir(), "compare-pages");

const SIZES = [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
];

const LOAD_WAIT = 900; // ms: after the load event, for the first animations of a page
const PRESS_WAIT = 90; // ms: after a press
const TYPE_WAIT = 30; // ms: after typing in a field
const END_WAIT = 200; // ms: before the last look at the DOM
const LOAD_TIMEOUT = 30000; // ms
const MAX_PRESSES = 60; // of a page (a table has very many rows)
const OPENED_LEVELS = 2; // what a press opens is pressed too: a row of a list, a button of a dialog
const TRIES = 3; // a real difference stays in every try
const LOG_WIDTH = 170; // letters of a line in the report

// *** THE PAGES TO COMPARE:

// The samples changed since the commit, and the samples that load a changed component.
const findChangedPages = function (base) {
    const changedFiles = readGitLines(["diff", "--name-only", base, "--", SAMPLES_FOLDER, "comp"]);
    const pages = new Set(changedFiles.filter(function (file) {
        return file.startsWith(SAMPLES_FOLDER + "/") && file.endsWith(".htm");
    }));
    const changedComponents = changedFiles.filter(function (file) {
        return file.startsWith("comp/") && file.endsWith(".js");
    });
    if (changedComponents.length === 0) return [...pages];

    listSamples().forEach(function (page) {
        const pageText = fs.readFileSync(path.join(ROOT, page), "utf8");
        const loadsChanged = changedComponents.some(function (file) { return pageText.includes("../" + file); });
        if (loadsChanged) pages.add(page);
    });
    return [...pages];
};

// *** IN THE PAGE: this function runs in the browser, before the scripts of the page.

const preparePage = function () {

    // WHY: a random value or the time on a page would differ in every run.
    let seed = 12345;
    Math.random = function () {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    const RealDate = Date;
    const fixedStart = new RealDate(2026, 10, 6, 12, 0, 0).getTime();
    const realStart = RealDate.now();
    window.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) super(fixedStart + (RealDate.now() - realStart));
            else super(...args);
        }
        static now() {
            return fixedStart + (RealDate.now() - realStart);
        }
    };

    const isPressable = function (elem) {
        if (elem.hasAttribute("role") || elem.hasAttribute("tabindex")) return true;
        return getComputedStyle(elem).cursor === "pointer";
    };

    const isDrawn = function (elem) {
        const rect = elem.getBoundingClientRect();
        return rect.width >= 1 && rect.height >= 1;
    };

    // The outermost pressable objects: a press on a button, not also on the label in it.
    const findPressable = function () {
        return [...document.querySelectorAll("body *")].filter(function (elem) {
            if (!isPressable(elem) || !isDrawn(elem)) return false;
            return !(elem.parentElement && isPressable(elem.parentElement));
        });
    };

    const fireMouse = function (elem, withPointer) {
        const rect = elem.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        const options = { bubbles: true, cancelable: true, clientX: clientX, clientY: clientY, view: window };
        if (withPointer) elem.dispatchEvent(new PointerEvent("pointerdown", options));
        elem.dispatchEvent(new MouseEvent("mousedown", options));
        if (withPointer) elem.dispatchEvent(new PointerEvent("pointerup", options));
        elem.dispatchEvent(new MouseEvent("mouseup", options));
        elem.click();
    };

    const describeElem = function (elem, depth) {
        const ownText = [...elem.childNodes]
            .filter(function (node) { return node.nodeType === Node.TEXT_NODE; })
            .map(function (node) { return node.textContent.trim(); })
            .filter(Boolean)
            .join(" ");
        // WHY sorted: the same styles written in another order are the same look.
        const style = (elem.getAttribute("style") || "").split(";")
            .map(function (rule) { return rule.trim(); })
            .filter(Boolean)
            .sort()
            .join("; ");
        const attributes = ["src", "href", "placeholder", "value", "type", "role", "aria-label"]
            .filter(function (name) { return elem.hasAttribute(name); })
            .map(function (name) { return name + "=" + elem.getAttribute(name); })
            .join(" ");
        const className = (typeof elem.className === "string") ? elem.className : "";
        return " ".repeat(depth) + elem.tagName + " #" + elem.id + " ." + className
            + " [" + style + "] " + attributes + " :: " + ownText;
    };

    window.__compare = {

        dumpDom: function () {
            const lines = [];
            const walk = function (elem, depth) {
                lines.push(describeElem(elem, depth));
                [...elem.children].forEach(function (child) {
                    if (child.tagName !== "SCRIPT") walk(child, depth + 1);
                });
            };
            walk(document.body, 0);
            return lines.join("\n");
        },

        readState: function () {
            const count = document.body.querySelectorAll("*").length;
            return count + " | " + document.title + " | " + document.body.innerText.replace(/\s+/g, " ");
        },

        collectTargets: function () {
            this.targets = findPressable();
            this.seen = new Set(this.targets);
            this.fields = [...document.querySelectorAll("input, textarea")].filter(isDrawn);
            return { targets: this.targets.length, fields: this.fields.length };
        },

        pressTarget: function (index) {
            const elem = (this.targets || [])[index];
            if (!elem || !elem.isConnected) return "gone";
            fireMouse(elem, true);
            return "pressed";
        },

        // Presses one of the objects that came with the last press. Returns how many came.
        pressOpened: function () {
            if (!this.seen) return 0;
            const opened = findPressable().filter(function (elem) { return !this.seen.has(elem); }, this);
            opened.forEach(function (elem) { this.seen.add(elem); }, this);
            if (opened.length === 0) return 0;
            // WHY the second one: the first row of a list is often the selected one, which changes nothing.
            fireMouse(opened[Math.min(1, opened.length - 1)], false);
            return opened.length;
        },

        typeInField: function (index) {
            const field = (this.fields || [])[index];
            if (!field || !field.isConnected) return "gone";
            if (["file", "checkbox", "radio", "range"].includes(field.type)) return "skipped";
            const prototype = (field.tagName === "TEXTAREA") ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            // WHY the setter of the prototype: a page may watch the value property of its own field.
            Object.getOwnPropertyDescriptor(prototype, "value").set.call(field, "12");
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "2" }));
            return "typed";
        },
    };
};

// *** ONE RUN OF A PAGE:

const withoutOldPath = function (text) {
    return text.split(OLD_PATH + "/").join("/");
};

const watchPage = function (page, log) {
    page.on("pageerror", function (error) { log.push("PAGE ERROR " + error.message); });
    page.on("dialog", function (dialog) {
        log.push("DIALOG " + dialog.message());
        dialog.dismiss().catch(function () {});
    });
    page.on("console", function (message) {
        const where = (message.location() && message.location().url) || "";
        if (where.includes("favicon")) return;
        log.push("CONSOLE " + message.type() + " " + withoutOldPath(message.text()));
    });
    page.on("requestfailed", function (request) {
        log.push("REQUEST FAILED " + withoutOldPath(request.url()));
    });
    // WHY only this computer: a form must not send anything, and the network would change the results.
    page.on("request", function (request) {
        const url = request.url();
        const isLocal = url.startsWith("http://127.0.0.1") || url.startsWith("data:") || url.startsWith("blob:");
        if (isLocal) request.continue();
        else request.abort();
    });
};

const pressOpenedObjects = async function (page, startUrl, lines) {
    for (let level = 0; level < OPENED_LEVELS; level++) {
        const openedCount = await page.evaluate(function () { return window.__compare.pressOpened(); });
        if (openedCount === 0) return;
        await sleep(PRESS_WAIT);
        if (page.url() !== startUrl) return;
        lines.push("  opened " + openedCount + " " + await page.evaluate(function () { return window.__compare.readState(); }));
    }
};

const pressEverything = async function (page, startUrl, targetCount, lines) {
    const pressCount = Math.min(targetCount, MAX_PRESSES);
    for (let index = 0; index < pressCount; index++) {
        const result = await page.evaluate(function (i) { return window.__compare.pressTarget(i); }, index);
        await sleep(PRESS_WAIT);
        if (page.url() !== startUrl) {
            lines.push("press " + index + " went to " + withoutOldPath(page.url()));
            return;
        }
        lines.push("press " + index + " " + result + " " + await page.evaluate(function () { return window.__compare.readState(); }));
        await pressOpenedObjects(page, startUrl, lines);
    }
};

const typeEverywhere = async function (page, fieldCount, lines) {
    for (let index = 0; index < fieldCount; index++) {
        const result = await page.evaluate(function (i) { return window.__compare.typeInField(i); }, index);
        await sleep(TYPE_WAIT);
        lines.push("type " + index + " " + result + " " + await page.evaluate(function () { return window.__compare.readState(); }));
    }
};

// WHY a new context for every run: localStorage of one run (a login page) must not reach the next.
const runPage = async function (browser, url, size) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        const log = [];
        await page.setRequestInterception(true);
        watchPage(page, log);
        await page.setViewport(size);
        await page.evaluateOnNewDocument(preparePage);
        await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT });
        await sleep(LOAD_WAIT);

        const picture = await page.screenshot({ captureBeyondViewport: false });
        const dom = await page.evaluate(function () { return window.__compare.dumpDom(); });
        const counts = await page.evaluate(function () { return window.__compare.collectTargets(); });

        const presses = [];
        const startUrl = page.url();
        try {
            await pressEverything(page, startUrl, counts.targets, presses);
            await typeEverywhere(page, counts.fields, presses);
            await sleep(END_WAIT);
        } catch (error) {
            // WHY the same in both runs: a press that reloads the page ends the list here.
            presses.push("stopped: " + error.message.split("\n")[0]);
        }
        const endDom = await page.evaluate(function () { return window.__compare.dumpDom(); }).catch(function () { return ""; });

        return { picture, dom, endDom, presses: presses.join("\n"), log: log.join("\n"), counts };
    } finally {
        await context.close();
    }
};

// *** COMPARING TWO RUNS:

const TEXT_PARTS = ["dom", "endDom", "presses", "log"];

// WHY: a time the page measures itself ("Created in 9 ms") is different in every run.
const withoutTimes = function (text) {
    return withoutOldPath(text).replace(/\b\d+ ms\b/g, "N ms");
};

const compareTexts = function (part, oldText, newText) {
    const oldLines = withoutTimes(oldText).split("\n");
    const newLines = withoutTimes(newText).split("\n");
    const lineCount = Math.max(oldLines.length, newLines.length);
    let count = 0;
    let firstLine = -1;
    for (let i = 0; i < lineCount; i++) {
        if (oldLines[i] === newLines[i]) continue;
        count++;
        if (firstLine === -1) firstLine = i;
    }
    if (count === 0) return null;
    return { part, count, lineNumber: firstLine + 1, oldLine: oldLines[firstLine] || "", newLine: newLines[firstLine] || "" };
};

const compareRuns = function (oldRun, newRun) {
    const differences = [];
    if (Buffer.compare(oldRun.picture, newRun.picture) !== 0) differences.push({ part: "picture" });
    TEXT_PARTS.forEach(function (part) {
        const difference = compareTexts(part, oldRun[part], newRun[part]);
        if (difference) differences.push(difference);
    });
    return differences;
};

const saveRun = function (fileStart, run) {
    fs.writeFileSync(fileStart + ".png", run.picture);
    TEXT_PARTS.forEach(function (part) {
        fs.writeFileSync(fileStart + "." + part + ".txt", run[part]);
    });
};

const compareAtSize = async function (browser, port, pagePath, size) {
    const oldUrl = "http://127.0.0.1:" + port + OLD_PATH + "/" + pagePath;
    const newUrl = "http://127.0.0.1:" + port + "/" + pagePath;
    let oldRun, newRun, differences;

    for (let attempt = 1; attempt <= TRIES; attempt++) {
        oldRun = await runPage(browser, oldUrl, size);
        newRun = await runPage(browser, newUrl, size);
        differences = compareRuns(oldRun, newRun);
        if (differences.length === 0) return { status: "SAME", counts: newRun.counts };
    }

    const fileStart = path.join(OUT_FOLDER, path.basename(pagePath, ".htm") + "-" + size.width);
    saveRun(fileStart + "-old", oldRun);
    saveRun(fileStart + "-new", newRun);

    // Does the page differ from itself in the same parts?
    const ownDifferences = compareRuns(await runPage(browser, newUrl, size), await runPage(browser, newUrl, size));
    const ownParts = ownDifferences.map(function (difference) { return difference.part; });
    const isLive = differences.every(function (difference) { return ownParts.includes(difference.part); });
    return { status: isLive ? "LIVE" : "DIFF", counts: newRun.counts, differences, fileStart };
};

// *** THE REPORT:

const cutAround = function (oldLine, newLine) {
    let at = 0;
    while (at < oldLine.length && oldLine[at] === newLine[at]) at++;
    const from = Math.max(0, at - 40);
    return [oldLine.slice(from, from + LOG_WIDTH), newLine.slice(from, from + LOG_WIDTH)];
};

const printResult = function (size, result) {
    const counts = "(" + result.counts.targets + " objects, " + result.counts.fields + " fields)";
    if (result.status === "SAME") {
        console.log("  " + size.width + ": SAME " + counts);
        return;
    }
    const parts = result.differences.map(function (difference) { return difference.part; }).join(", ");
    console.log("  " + size.width + ": " + result.status + " " + counts + ": " + parts);
    result.differences.forEach(function (difference) {
        if (difference.part === "picture") return;
        const [oldText, newText] = cutAround(difference.oldLine, difference.newLine);
        console.log("    " + difference.part + ", " + difference.count + " lines, the first at line " + difference.lineNumber + ":");
        console.log("      old: " + oldText);
        console.log("      new: " + newText);
    });
    console.log("    files: " + result.fileStart + "-old.png, -new.png, .dom.txt ...");
};

const printTotals = function (totals) {
    console.log("");
    console.log("Pages: " + totals.SAME + " same, " + totals.LIVE + " live, " + totals.DIFF + " different, "
        + totals.SKIPPED + " without an old version");
};

// *** START:

const readOptions = function (args) {
    const options = { base: "HEAD", isAll: false, isHelp: false, pages: [] };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--base") options.base = args[++i];
        else if (args[i] === "--all") options.isAll = true;
        else if (args[i] === "--help") options.isHelp = true;
        else options.pages.push(chrome.toPagePath(args[i]));
    }
    return options;
};

const choosePages = function (options) {
    if (options.isAll) return listSamples();
    if (options.pages.length > 0) return options.pages;
    return findChangedPages(options.base);
};

const compareAndPrint = async function (browser, port, pagePath, size) {
    try {
        const result = await compareAtSize(browser, port, pagePath, size);
        printResult(size, result);
        return result.status;
    } catch (error) {
        // WHY go on: a page that can not be opened must not stop the others.
        console.log("  " + size.width + ": DIFF: it can not be opened: " + error.message.split("\n")[0]);
        return "DIFF";
    }
};

// The result of a page is the worst result of its sizes.
const comparePage = async function (browser, port, pagePath) {
    console.log(pagePath);
    const statuses = [];
    for (const size of SIZES) {
        statuses.push(await compareAndPrint(browser, port, pagePath, size));
    }
    if (statuses.includes("DIFF")) return "DIFF";
    if (statuses.includes("LIVE")) return "LIVE";
    return "SAME";
};

const main = async function () {
    const options = readOptions(process.argv.slice(2));
    if (options.isHelp) {
        console.log(chrome.helpText(__filename));
        return 0;
    }

    const pages = choosePages(options);
    if (pages.length === 0) {
        console.log("No sample is changed since " + options.base + ". Name the pages, or use --all.");
        return 0;
    }

    fs.rmSync(OUT_FOLDER, { recursive: true, force: true });
    fs.mkdirSync(OUT_FOLDER, { recursive: true });

    const server = await chrome.startServer({ commit: options.base });
    const browser = await chrome.launchChrome();
    const totals = { SAME: 0, LIVE: 0, DIFF: 0, SKIPPED: 0 };

    try {
        for (const pagePath of pages) {
            if (!isInCommit(options.base, pagePath)) {
                console.log(pagePath + "\n  not in " + options.base + ": nothing to compare with");
                totals.SKIPPED++;
                continue;
            }
            totals[await comparePage(browser, server.address().port, pagePath)]++;
        }
    } finally {
        await browser.close();
        server.close();
    }

    printTotals(totals);
    return (totals.DIFF > 0) ? 1 : 0;
};

main().then(function (exitCode) {
    process.exitCode = exitCode;
}).catch(function (error) {
    console.error(error.message);
    process.exitCode = 2;
});
