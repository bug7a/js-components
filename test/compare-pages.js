/* Bismillah */

/*
COMPARE PAGES: does a page still work the same after a change?

Every page is opened twice, as it is now and as it was in a git commit, and the two are compared:
the DOM, a screenshot, the text after every press and every typed field, and the console. At 1280 and 390 px.
The old page loads the old basic/ and comp/ too, so a change in a component is measured as well.
In both pages the clock stands still at 6 Nov 2026 12:00 and Math.random gives the same numbers in every run.

    node test/compare-pages.js                          the samples changed since the last commit,
                                                        and the samples that load a changed component
    node test/compare-pages.js tabs.htm dialog.htm      these pages (of 02-comp-examples, or a path from the root)
    node test/compare-pages.js --all                    every sample (long)
    node test/compare-pages.js --base HEAD~3 tabs.htm   against another commit
    node test/compare-pages.js --width 1280 tabs.htm    at this width only: a quick check (a big page in half the time)
                                                        (any width; under 500 px the window is 844 high, else 800)
    node test/compare-pages.js old.htm=new.htm          a page that got a new name: old.htm of the commit, new.htm now
    node test/compare-pages.js --run "openPageByKey('roles')" 04-templates/ozden-panel/index.htm
                                                        --run: JavaScript after the load (a page of a panel, a tab, a
                                                        dialog), in the old page and in the new one, before the picture;
                                                        more than one --run: each is a state of its own, compared one
                                                        after the other in one browser (the pages of a panel at once);
                                                        an object pressed in an earlier state of the page (the same
                                                        look, text and place: the menu and the bar of a panel) is not
                                                        pressed again, its line says "skipped", and the 60 presses of a
                                                        state go to its own objects
    node test/compare-pages.js --init "localStorage.setItem('appid_login', '{}')" ...
                                                        --init: JavaScript before the scripts of the page (a login
                                                        that the page keeps in localStorage); with --run, in that order
    node test/compare-pages.js --picture-only draft.htm=copy.htm
                                                        only the picture after the load (and --run): no presses, no
                                                        typing, no DOM (the log stays); a draft of _designs/ and a copy
                                                        of it drawn by the component, in seconds
    node test/compare-pages.js --press-all --run "openPageByKey('Home')" --run "openPageByKey('Orders')" ...
                                                        --press-all: every object in every state, also the ones an
                                                        earlier state pressed (twice the time on a panel)
    node test/compare-pages.js --moving-clock ...       the clock of the pages goes on from 6 Nov 2026 12:00, for a
                                                        page that waits for the time to pass (without it Date.now()
                                                        and new Date() give that moment all the time)

The results:
    SAME    no difference (a difference that goes away when the page is opened again was only timing)
    LIVE    it differs, and it differs from itself too in the same parts, in any of the runs of the old page or of
            the new one (a live chart, a running animation, a timer): this tool can not tell; read the lines it prints
    DIFF    a real difference. The exit code is 1, the pictures and the texts are in the folder it prints
A difference of the picture prints where the pixels changed: the box (x, y), how many pixels, and how many of them
changed strongly (more than 40 of 255 in a color: more than the smoothing of an edge). The old | new picture of that
part is saved as -diff.png, enlarged when it is small. A change of 3 of 255 or less is not counted: it is not seen,
and Chrome draws the same page in more than one way.
Under a difference of a text (dom, endDom, presses, log): its first line, old and new, around the first letter that
differs, then the changes of all its lines, word by word, the most common first:
    the changes of all 80 lines: - "cursor: pointer;" x64, + "cursor: pointer;" x16
HTML written as text: every run looks for a tag or an entity in a text that is seen (after the load, after every press
and every typed field; not in pre, code or a textarea: code is text there). A component writes its texts as plain text
(allowHtml: 0), so HTML that a page gives it is shown as it is written. Only in the new page: a difference ("html as
text", DIFF). In the old page too: printed under the result, which stays (MarkdownView shows one on purpose). A page
that can not be opened in the commit, or that is not in it, is still opened now and looked at.
The files of a run are in a folder of its own (compare-pages/<day-time-process> in the temp folder of the system);
the folders older than 48 hours are deleted when a run starts. When another tool with Chrome runs at the same time
(compare-pages, run-tests, screenshot or focus-rings of another session), it says so at the start and under the
totals: two browsers side by side give false differences.

It presses and types, nothing else: hover, drag and the keyboard are not measured.
Before the screenshot an endless animation (a turning ring, pulsing dots) is stopped at its start, in both pages.
It needs Chrome and puppeteer-core (npm install puppeteer-core; CHROME_PATH for another place of Chrome).
WHY one browser, one page at a time: three browsers side by side gave 22 false differences in 122 pages.
*/

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const chrome = require("./_chrome.js");
const { ROOT, SAMPLES_FOLDER, OLD_PATH, readGitLines, isInCommit, listSamples, sleep } = chrome;

const OUT_ROOT = path.join(os.tmpdir(), "compare-pages");
const OLD_RUN_AGE = 48 * 60 * 60 * 1000; // ms: the folder of an older run is deleted when a run starts

const DESKTOP_SIZE = { width: 1280, height: 800 };
const PHONE_SIZE = { width: 390, height: 844 };
const SIZES = [DESKTOP_SIZE, PHONE_SIZE];
const PHONE_WIDTH = 500; // px: a --width under it gets the height of a phone

const LOAD_WAIT = 900; // ms: after the load event, for the first animations of a page
const PRESS_WAIT = 90; // ms: after a press
const TYPE_WAIT = 30; // ms: after typing in a field
const END_WAIT = 200; // ms: before the last look at the DOM
const LOAD_TIMEOUT = 30000; // ms
const MAX_PRESSES = 60; // of a page (a table has very many rows)
const OPENED_LEVELS = 2; // what a press opens is pressed too: a row of a list, a button of a dialog
const TRIES = 3; // a real difference stays in every try
const LOG_WIDTH = 170; // letters of a line in the report
const CHANGE_KINDS = 4; // the most common changes printed under a difference
const CHANGE_WIDTH = 60; // letters of a change in the report
const MAX_WORDS = 400; // a longer line is not compared word by word (the table of a longer one is slow)
const HTML_ITEMS_SHOWN = 3; // texts with HTML written as text, printed under a result

// *** THE FOLDER OF A RUN (WHY: a run deleted the one folder of all at its start, also the files of a run of another
//     session that was not done yet):

const twoDigits = function (number) {
    return String(number).padStart(2, "0");
};

const RUN_START = new Date();

// 2026-11-09-101530-4242: the time it started and its process
const runFolderName = function () {
    const day = RUN_START.getFullYear() + "-" + twoDigits(RUN_START.getMonth() + 1) + "-" + twoDigits(RUN_START.getDate());
    const time = twoDigits(RUN_START.getHours()) + twoDigits(RUN_START.getMinutes()) + twoDigits(RUN_START.getSeconds());
    return day + "-" + time + "-" + process.pid;
};

const OUT_FOLDER = path.join(OUT_ROOT, runFolderName());

// WHY by age, not all: the folder of another run may be in use now.
const deleteOldRuns = function () {
    if (!fs.existsSync(OUT_ROOT)) return;
    const now = Date.now();
    fs.readdirSync(OUT_ROOT).forEach(function (name) {
        const file = path.join(OUT_ROOT, name);
        try {
            if (now - fs.statSync(file).mtimeMs > OLD_RUN_AGE) fs.rmSync(file, { recursive: true, force: true });
        } catch (error) {
            // another run deleted it first
        }
    });
};

// A run in which every page was the same leaves no folder.
const deleteEmptyFolder = function () {
    if (fs.existsSync(OUT_FOLDER) && fs.readdirSync(OUT_FOLDER).length === 0) fs.rmdirSync(OUT_FOLDER);
};

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

const preparePage = function (settings = {}) {

    // WHY: a random value or the time on a page would differ in every run.
    let seed = 12345;
    Math.random = function () {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };

    const RealDate = Date;
    const fixedStart = new RealDate(2026, 10, 6, 12, 0, 0).getTime();
    const realStart = RealDate.now();
    // WHY a clock that stands still: the time a page shows (the clock of a panel) was a second apart in two runs, and
    //     the page LIVE, where a real change could hide.
    const readNow = function () {
        if (settings.isClockStopped) return fixedStart;
        return fixedStart + (RealDate.now() - realStart);
    };
    window.Date = class extends RealDate {
        constructor(...args) {
            if (args.length === 0) super(readNow());
            else super(...args);
        }
        static now() {
            return readNow();
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

    const isSeen = function (elem) {
        if (!isDrawn(elem)) return false;
        if (!elem.checkVisibility) return true;
        return elem.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    };

    // A tag or an entity written as text. WHY: a component writes its texts as plain text (allowHtml: 0); HTML that
    // a page gives it (a word in color) is shown as it is written.
    const HTML_AS_TEXT = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|&(#[0-9]+|#x[0-9a-f]+|[a-z]+);/i;
    const CODE_PLACES = "script, style, noscript, template, textarea, pre, code, [contenteditable]"; // code is text there
    const EXCERPT_BEFORE = 20; // letters before the found tag
    const EXCERPT_LENGTH = 90; // letters of a found text

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

    // The same object in another state of the page (one pressed there is not pressed again): its look and attributes,
    // its place and its text.
    const KEY_TEXT_LENGTH = 100; // letters of the text of an object in its key
    const keyOf = function (elem) {
        const rect = elem.getBoundingClientRect();
        const place = [rect.left, rect.top, rect.width, rect.height].map(Math.round).join(" ");
        const text = (elem.innerText || "").replace(/\s+/g, " ").trim().slice(0, KEY_TEXT_LENGTH);
        return describeElem(elem, 0) + " @ " + place + " :: " + text;
    };

    window.__compare = {

        // WHY: an endless animation (a turning ring, pulsing dots) is at another moment in every picture.
        holdEndlessAnimations: function () {
            document.getAnimations().forEach(function (animation) {
                if (animation.effect.getComputedTiming().endTime !== Infinity) return;
                animation.pause();
                animation.currentTime = 0;
            });
            // An animation of an SVG (SMIL) is not in getAnimations().
            document.querySelectorAll("svg").forEach(function (svg) {
                if (!svg.querySelector("[repeatCount='indefinite']")) return;
                svg.pauseAnimations();
                svg.setCurrentTime(0);
            });
        },

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

        // The texts that are seen and have HTML written in them (HTML_AS_TEXT), cut around the tag.
        findHtmlAsText: function () {
            const found = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const match = HTML_AS_TEXT.exec(node.data);
                if (!match) continue;
                const parent = node.parentElement;
                if (!parent || parent.closest(CODE_PLACES) || !isSeen(parent)) continue;
                const from = Math.max(0, match.index - EXCERPT_BEFORE);
                found.push(node.data.slice(from, from + EXCERPT_LENGTH).replace(/\s+/g, " ").trim());
            }
            return found;
        },

        // pressedBefore: the keys of the objects pressed in the earlier states of the page, or null (--press-all).
        collectTargets: function (pressedBefore) {
            this.targets = findPressable();
            this.seen = new Set(this.targets);
            this.fields = [...document.querySelectorAll("input, textarea")].filter(isDrawn);
            this.keys = pressedBefore ? this.targets.map(keyOf) : [];
            const pressed = new Set(pressedBefore || []);
            this.isSkipped = this.keys.map(function (key) { return pressed.has(key); });
            return { targets: this.targets.length, fields: this.fields.length };
        },

        pressTarget: function (index) {
            const elem = (this.targets || [])[index];
            if (!elem || !elem.isConnected) return "gone";
            if ((this.isSkipped || [])[index]) return "skipped";
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

// The texts with HTML written in them (findHtmlAsText), each with the moment it was first seen.
const createHtmlRecorder = function (page) {
    const found = new Map();
    return {
        look: async function (moment) {
            const texts = await page.evaluate(function () { return window.__compare.findHtmlAsText(); })
                .catch(function () { return []; });
            texts.forEach(function (text) {
                if (!found.has(text)) found.set(text, moment);
            });
        },
        list: function () {
            return [...found].map(function (entry) { return { text: entry[0], moment: entry[1] }; });
        },
    };
};

const pressOpenedObjects = async function (page, startUrl, lines, htmlAsText, pressMoment) {
    for (let level = 0; level < OPENED_LEVELS; level++) {
        const openedCount = await page.evaluate(function () { return window.__compare.pressOpened(); });
        if (openedCount === 0) return;
        await sleep(PRESS_WAIT);
        if (page.url() !== startUrl) return;
        lines.push("  opened " + openedCount + " " + await page.evaluate(function () { return window.__compare.readState(); }));
        await htmlAsText.look(pressMoment + ", in what it opened");
    }
};

// pressedIndexes: the objects it pressed are added to it. WHY a skipped object is not counted: the presses of a state go
//     to its own objects.
const pressEverything = async function (page, startUrl, targetCount, lines, htmlAsText, pressedIndexes) {
    let pressCount = 0;
    for (let index = 0; index < targetCount && pressCount < MAX_PRESSES; index++) {
        const result = await page.evaluate(function (i) { return window.__compare.pressTarget(i); }, index);
        if (result === "skipped") {
            lines.push("press " + index + " skipped: pressed in an earlier state");
            continue;
        }
        pressCount++;
        pressedIndexes.push(index);
        await sleep(PRESS_WAIT);
        if (page.url() !== startUrl) {
            lines.push("press " + index + " went to " + withoutOldPath(page.url()));
            return;
        }
        lines.push("press " + index + " " + result + " " + await page.evaluate(function () { return window.__compare.readState(); }));
        await htmlAsText.look("after press " + index);
        await pressOpenedObjects(page, startUrl, lines, htmlAsText, "after press " + index);
    }
};

const typeEverywhere = async function (page, fieldCount, lines, htmlAsText) {
    for (let index = 0; index < fieldCount; index++) {
        const result = await page.evaluate(function (i) { return window.__compare.typeInField(i); }, index);
        await sleep(TYPE_WAIT);
        lines.push("type " + index + " " + result + " " + await page.evaluate(function () { return window.__compare.readState(); }));
        await htmlAsText.look("after typing in field " + index);
    }
};

// WHY a new context for every run: localStorage of one run (a login page) must not reach the next.
// steps: { init, run, isClockStopped }: JavaScript before the scripts of the page, and after its load (the same in the
// old page); isClockStopped: the time of the page does not move (the default; --moving-clock: it goes on).
// Also { pressedBefore, pressedNow } (not with --press-all): the keys of the objects the earlier states pressed (they
// are not pressed), and the set the keys of the ones this run presses go into (stepsOfState()).
const runPage = async function (browser, url, size, steps) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        const log = [];
        await page.setRequestInterception(true);
        watchPage(page, log);
        await page.setViewport(size);
        await page.evaluateOnNewDocument(preparePage, { isClockStopped: steps.isClockStopped });
        if (steps.init) await page.evaluateOnNewDocument(steps.init);
        await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT });
        await sleep(LOAD_WAIT);
        if (steps.run) {
            await page.evaluate(steps.run);
            await sleep(LOAD_WAIT); // WHY: what it opened has its first animations too
        }

        await page.evaluate(function () { window.__compare.holdEndlessAnimations(); });
        const picture = await page.screenshot({ captureBeyondViewport: false });
        const dom = await page.evaluate(function () { return window.__compare.dumpDom(); });
        const htmlAsText = createHtmlRecorder(page);
        await htmlAsText.look("after the load");
        const counts = await page.evaluate(function (pressedBefore) {
            return window.__compare.collectTargets(pressedBefore);
        }, steps.pressedBefore || null);

        // WHY: a draft and a copy of it made with the component have other DOMs, and their presses took minutes.
        if (steps.isPictureOnly) return { picture, dom: "", endDom: "", presses: "", log: log.join("\n"), counts, htmlAsText: htmlAsText.list() };

        // WHY read before the presses: a press can open another page, where the keys are gone.
        const targetKeys = await page.evaluate(function () { return window.__compare.keys; });
        const presses = [];
        const pressedIndexes = [];
        const startUrl = page.url();
        try {
            await pressEverything(page, startUrl, counts.targets, presses, htmlAsText, pressedIndexes);
            await typeEverywhere(page, counts.fields, presses, htmlAsText);
            await sleep(END_WAIT);
        } catch (error) {
            // WHY the same in both runs: a press that reloads the page ends the list here.
            presses.push("stopped: " + error.message.split("\n")[0]);
        }
        if (steps.pressedNow) {
            pressedIndexes.forEach(function (index) { steps.pressedNow.add(targetKeys[index]); });
        }
        const endDom = await page.evaluate(function () { return window.__compare.dumpDom(); }).catch(function () { return ""; });

        return { picture, dom, endDom, presses: presses.join("\n"), log: log.join("\n"), counts, htmlAsText: htmlAsText.list() };
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
    const pairs = [];
    for (let i = 0; i < lineCount; i++) {
        if (oldLines[i] === newLines[i]) continue;
        pairs.push({ lineNumber: i + 1, oldLine: oldLines[i] || "", newLine: newLines[i] || "" });
    }
    if (pairs.length === 0) return null;
    return { part, count: pairs.length, lineNumber: pairs[0].lineNumber, oldLine: pairs[0].oldLine, newLine: pairs[0].newLine, pairs };
};

// *** THE CHANGES OF ALL THE LINES (WHY: the first line alone does not tell if 168 different lines are one change):

// The longest common words of two lines, as a table: common[i][j] = the count from oldWords[i] and newWords[j] on
const commonWordsTable = function (oldWords, newWords) {
    const common = [];
    for (let i = oldWords.length; i >= 0; i--) {
        common[i] = new Array(newWords.length + 1).fill(0);
        if (i === oldWords.length) continue;
        for (let j = newWords.length - 1; j >= 0; j--) {
            const isSame = (oldWords[i] === newWords[j]);
            common[i][j] = isSame ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
        }
    }
    return common;
};

// The changes of one line, word by word: [{ removed: "a b", added: "c" }] ([] for a line too long to look into)
const changesOfLine = function (oldLine, newLine) {
    const oldWords = oldLine ? oldLine.split(" ") : [];
    const newWords = newLine ? newLine.split(" ") : [];
    if (oldWords.length > MAX_WORDS || newWords.length > MAX_WORDS) return [];
    const common = commonWordsTable(oldWords, newWords);
    const changes = [];
    let removed = [];
    let added = [];
    const closeChange = function () {
        if (removed.length > 0 || added.length > 0) changes.push({ removed: removed.join(" "), added: added.join(" ") });
        removed = [];
        added = [];
    };
    let i = 0;
    let j = 0;
    while (i < oldWords.length || j < newWords.length) {
        if (i < oldWords.length && j < newWords.length && oldWords[i] === newWords[j]) {
            closeChange();
            i++;
            j++;
        } else if (j < newWords.length && (i === oldWords.length || common[i][j + 1] >= common[i + 1][j])) {
            added.push(newWords[j++]);
        } else {
            removed.push(oldWords[i++]);
        }
    }
    closeChange();
    return changes;
};

// The changes of all the different lines, the most common first: [{ removed, added, count }]
const countChanges = function (pairs) {
    const counts = new Map();
    pairs.forEach(function (pair) {
        changesOfLine(pair.oldLine, pair.newLine).forEach(function (change) {
            const key = JSON.stringify([change.removed, change.added]);
            const counted = counts.get(key) || { removed: change.removed, added: change.added, count: 0 };
            counted.count++;
            counts.set(key, counted);
        });
    });
    return [...counts.values()].sort(function (a, b) { return b.count - a.count; });
};

const cutChange = function (text) {
    return JSON.stringify(text.length > CHANGE_WIDTH ? text.slice(0, CHANGE_WIDTH) + "..." : text);
};

// + "added", - "removed", "removed" -> "added"; and how many times
const describeChange = function (change) {
    let text = cutChange(change.removed) + " -> " + cutChange(change.added);
    if (!change.removed) text = "+ " + cutChange(change.added);
    if (!change.added) text = "- " + cutChange(change.removed);
    return text + " x" + change.count;
};

const describeChanges = function (pairs) {
    const changes = countChanges(pairs);
    if (changes.length === 0) return "";
    const shown = changes.slice(0, CHANGE_KINDS).map(describeChange).join(", ");
    const otherCount = changes.length - CHANGE_KINDS;
    return (otherCount > 0) ? shown + " and " + otherCount + " other changes" : shown;
};

// WHY not only the bytes: Chrome draws the same page in more than one way (seen: 36 px that changed by 3 of 255).
const isSamePicture = async function (browser, oldPicture, newPicture) {
    if (Buffer.compare(oldPicture, newPicture) === 0) return true;
    const change = await measurePictureChange(browser, oldPicture, newPicture, { ...PICTURE_LIMITS, isCountOnly: true });
    return (change === null);
};

const compareRuns = async function (browser, oldRun, newRun) {
    const differences = [];
    const isPictureSame = await isSamePicture(browser, oldRun.picture, newRun.picture);
    if (!isPictureSame) differences.push({ part: "picture" });
    TEXT_PARTS.forEach(function (part) {
        const difference = compareTexts(part, oldRun[part], newRun[part]);
        if (difference) differences.push(difference);
    });
    return differences;
};

// The parts in which the runs of one page are not all the same.
// WHY each one against the first: a run that is the same as the first one is the same as the others too.
const findLiveParts = async function (browser, runs) {
    const parts = [];
    for (const run of runs.slice(1)) {
        const differences = await compareRuns(browser, runs[0], run);
        differences.forEach(function (difference) { parts.push(difference.part); });
    }
    return parts;
};

// *** HTML WRITTEN AS TEXT:

const htmlTextsOf = function (runs) {
    return new Set(runs.flatMap(function (run) {
        return run.htmlAsText.map(function (item) { return item.text; });
    }));
};

// HTML written as text in the new page and in no run of the old page: a difference (none: null).
const findNewHtmlAsText = function (oldRuns, newRun) {
    const oldTexts = htmlTextsOf(oldRuns);
    const items = newRun.htmlAsText.filter(function (item) { return !oldTexts.has(item.text); });
    return (items.length > 0) ? { part: "html as text", items: items } : null;
};

// HTML written as text in the old page too: printed, not a difference (a page may show a tag on purpose).
const findHtmlInBoth = function (oldRuns, newRun) {
    const oldTexts = htmlTextsOf(oldRuns);
    return newRun.htmlAsText.filter(function (item) { return oldTexts.has(item.text); });
};

const saveRun = function (fileStart, run) {
    fs.writeFileSync(fileStart + ".png", run.picture);
    TEXT_PARTS.forEach(function (part) {
        fs.writeFileSync(fileStart + "." + part + ".txt", run[part]);
    });
};

// A page to compare: its path in the commit and its path now (the same, unless it got a new name)
const toPagePair = function (arg) {
    const parts = arg.split("=");
    const newPath = chrome.toPagePath(parts[parts.length - 1]);
    const oldPath = (parts.length > 1) ? chrome.toPagePath(parts[0]) : newPath;
    return { oldPath: oldPath, newPath: newPath };
};

const describePair = function (pair) {
    let text = pair.newPath;
    if (pair.oldPath !== pair.newPath) text += " (" + pair.oldPath + " in the commit)";
    if (pair.steps.run) text += " --run " + pair.steps.run;
    return text;
};

// WHY the name of the run: the states of one page (more than one --run) must not write over the files of each other.
const fileStartOf = function (pair, size) {
    const name = path.basename(pair.newPath, ".htm") + (pair.runName ? "-" + pair.runName : "");
    return path.join(OUT_FOLDER, name + "-" + size.width);
};

// Nothing to compare with: the new page is still opened and looked at (HTML written as text; its files are saved).
const lookWithoutOld = async function (browser, newUrl, size, pair, reason) {
    const newRun = await runPage(browser, newUrl, size, pair.steps);
    const fileStart = fileStartOf(pair, size);
    saveRun(fileStart + "-new", newRun);
    const differences = [{ part: "old page", reason: reason }];
    const newHtml = findNewHtmlAsText([], newRun);
    if (newHtml) differences.push(newHtml);
    return { status: "DIFF", counts: newRun.counts, differences, fileStart, isWithoutOld: true, htmlInBoth: [] };
};

// The keys of the objects pressed in the earlier states of a page at a size, in the old page and in the
// new one ("old tabs.htm 1280" -> Set)
const pressedInStates = new Map();

// The steps of the runs of a state: what the earlier states of its page pressed (not pressed again; --press-all: none)
// and the set its own presses go into.
// WHY a copy for pressedBefore: every run of a state (a try again, the runs of LIVE) skips the same objects.
const stepsOfState = function (pair, size, version) {
    if (!pair.steps.isPressOnce) return pair.steps;
    const stateKey = version + " " + pair.newPath + " " + size.width;
    if (!pressedInStates.has(stateKey)) pressedInStates.set(stateKey, new Set());
    const pressedNow = pressedInStates.get(stateKey);
    return Object.assign({}, pair.steps, { pressedBefore: [...pressedNow], pressedNow: pressedNow });
};

const compareAtSize = async function (browser, port, pair, size) {
    const oldUrl = "http://127.0.0.1:" + port + OLD_PATH + "/" + pair.oldPath;
    const newUrl = "http://127.0.0.1:" + port + "/" + pair.newPath;
    const oldSteps = stepsOfState(pair, size, "old");
    const newSteps = stepsOfState(pair, size, "new");
    let oldRun, newRun, differences;
    const oldRuns = [];
    const newRuns = [];

    for (let attempt = 1; attempt <= TRIES; attempt++) {
        try {
            oldRun = await runPage(browser, oldUrl, size, oldSteps);
        } catch (error) {
            // WHY on: the new page of an old page that throws is still looked at (it hid HTML written as text).
            return lookWithoutOld(browser, newUrl, size, pair, "it can not be opened in the commit: " + error.message.split("\n")[0]);
        }
        newRun = await runPage(browser, newUrl, size, newSteps);
        oldRuns.push(oldRun);
        newRuns.push(newRun);
        differences = await compareRuns(browser, oldRun, newRun);
        const newHtml = findNewHtmlAsText(oldRuns, newRun);
        if (newHtml) differences.push(newHtml);
        if (differences.length === 0) return { status: "SAME", counts: newRun.counts, htmlInBoth: findHtmlInBoth(oldRuns, newRun) };
    }

    const fileStart = fileStartOf(pair, size);
    saveRun(fileStart + "-old", oldRun);
    saveRun(fileStart + "-new", newRun);
    const pictureDifference = differences.find(function (difference) { return difference.part === "picture"; });
    if (pictureDifference) {
        pictureDifference.place = await describePictureChange(browser, oldRun.picture, newRun.picture, fileStart + "-diff.png");
    }

    // Does the page differ from itself in the same parts? Every run of the old page and of the new one counts.
    newRuns.push(await runPage(browser, newUrl, size, newSteps));
    newRuns.push(await runPage(browser, newUrl, size, newSteps));
    const oldLiveParts = await findLiveParts(browser, oldRuns);
    const newLiveParts = await findLiveParts(browser, newRuns);
    const liveParts = oldLiveParts.concat(newLiveParts);
    const isLive = differences.every(function (difference) { return liveParts.includes(difference.part); });
    const htmlInBoth = findHtmlInBoth(oldRuns, newRun);
    return { status: isLive ? "LIVE" : "DIFF", counts: newRun.counts, differences, fileStart, htmlInBoth };
};

// *** THE CHANGED PART OF A PICTURE:

const INVISIBLE_CHANGE = 3; // of 255 in a color: a change this small is not seen, and it is not counted
const STRONG_CHANGE = 40; // of 255 in a color: a change that is seen (the smoothing of an edge changes less)
const DIFF_MARGIN = 24; // px around the changed part
const DIFF_GAP = 16; // px between the old and the new part
const DIFF_MAX_WIDTH = 1800; // px of the saved picture (a small part is enlarged up to 4 times)
const DIFF_LABEL_HEIGHT = 22; // px

const PICTURE_LIMITS = {
    invisibleChange: INVISIBLE_CHANGE,
    strongChange: STRONG_CHANGE,
    margin: DIFF_MARGIN,
    gap: DIFF_GAP,
    maxWidth: DIFF_MAX_WIDTH,
    labelHeight: DIFF_LABEL_HEIGHT,
};

// Runs in the browser: the box of the changed pixels (of the strong ones when there are any) and the picture of that
// part, old | new (with isCountOnly: only how many). null when no pixel changed more than invisibleChange.
const findPictureChange = async function (oldSource, newSource, limits) {
    const loadImage = function (source) {
        return new Promise(function (resolve, reject) {
            const image = new Image();
            image.onload = function () { resolve(image); };
            image.onerror = reject;
            image.src = source;
        });
    };
    const readPixels = function (image) {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
    };
    const newBox = function () {
        return { left: Infinity, top: Infinity, right: -1, bottom: -1, count: 0 };
    };
    const addToBox = function (box, x, y) {
        box.left = Math.min(box.left, x);
        box.top = Math.min(box.top, y);
        box.right = Math.max(box.right, x);
        box.bottom = Math.max(box.bottom, y);
        box.count++;
    };

    const oldImage = await loadImage(oldSource);
    const newImage = await loadImage(newSource);
    const oldPixels = readPixels(oldImage);
    const newPixels = readPixels(newImage);
    const width = Math.min(oldImage.width, newImage.width);
    const height = Math.min(oldImage.height, newImage.height);
    const changed = newBox();
    const strong = newBox();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const oldAt = (y * oldImage.width + x) * 4;
            const newAt = (y * newImage.width + x) * 4;
            let change = 0;
            for (let channel = 0; channel < 4; channel++) {
                change = Math.max(change, Math.abs(oldPixels[oldAt + channel] - newPixels[newAt + channel]));
            }
            if (change <= limits.invisibleChange) continue;
            addToBox(changed, x, y);
            if (change > limits.strongChange) addToBox(strong, x, y);
        }
    }
    if (changed.count === 0) return null;
    if (limits.isCountOnly) return { changedCount: changed.count };

    const box = (strong.count > 0) ? strong : changed;
    const left = Math.max(0, box.left - limits.margin);
    const top = Math.max(0, box.top - limits.margin);
    const partWidth = Math.min(width, box.right + 1 + limits.margin) - left;
    const partHeight = Math.min(height, box.bottom + 1 + limits.margin) - top;
    const scale = Math.min(4, limits.maxWidth / (partWidth * 2 + limits.gap));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(partWidth * scale * 2 + limits.gap);
    canvas.height = Math.round(partHeight * scale) + limits.labelHeight;
    const context = canvas.getContext("2d");
    context.fillStyle = "#E9E9EC";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = (scale < 1); // WHY: an enlarged part shows its pixels as they are
    context.fillStyle = "#333333";
    context.font = "600 13px sans-serif";
    [oldImage, newImage].forEach(function (image, index) {
        const x = index * (partWidth * scale + limits.gap);
        context.fillText((index === 0) ? "old" : "new", x + 2, limits.labelHeight - 7);
        const target = { width: partWidth * scale, height: partHeight * scale };
        context.drawImage(image, left, top, partWidth, partHeight, x, limits.labelHeight, target.width, target.height);
    });
    return {
        box: { left: box.left, top: box.top, right: box.right, bottom: box.bottom },
        changedCount: changed.count,
        strongCount: strong.count,
        isSizeChanged: (oldImage.width !== newImage.width || oldImage.height !== newImage.height),
        picture: canvas.toDataURL("image/png"),
    };
};

const measurePictureChange = async function (browser, oldPicture, newPicture, limits) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        const toSource = function (picture) { return "data:image/png;base64," + Buffer.from(picture).toString("base64"); };
        return await page.evaluate(findPictureChange, toSource(oldPicture), toSource(newPicture), limits);
    } finally {
        await context.close();
    }
};

// The changed part of the two pictures as a line of the report; its picture goes to the file.
const describePictureChange = async function (browser, oldPicture, newPicture, file) {
    const change = await measurePictureChange(browser, oldPicture, newPicture, PICTURE_LIMITS);
    if (!change) return "no change that is seen (only the files differ)";
    fs.writeFileSync(file, Buffer.from(change.picture.split(",")[1], "base64"));
    const box = change.box;
    const sizeNote = (change.isSizeChanged) ? ", the size of the picture changed" : "";
    return "x " + box.left + "-" + box.right + ", y " + box.top + "-" + box.bottom + " (" + change.changedCount
        + " px changed, " + change.strongCount + " strongly" + sizeNote + "): " + file;
};

// *** THE REPORT:

const cutAround = function (oldLine, newLine) {
    let at = 0;
    while (at < oldLine.length && oldLine[at] === newLine[at]) at++;
    const from = Math.max(0, at - 40);
    return [oldLine.slice(from, from + LOG_WIDTH), newLine.slice(from, from + LOG_WIDTH)];
};

// "the text" (the moment it was seen), ... and 2 more
const describeHtmlItems = function (items) {
    const shown = items.slice(0, HTML_ITEMS_SHOWN).map(function (item) {
        return JSON.stringify(item.text) + " (" + item.moment + ")";
    });
    const otherCount = items.length - HTML_ITEMS_SHOWN;
    return (otherCount > 0) ? shown.join(", ") + " and " + otherCount + " more" : shown.join(", ");
};

const printHtmlInBoth = function (items) {
    if (!items || items.length === 0) return;
    console.log("    html as text, in the old page too: " + describeHtmlItems(items));
};

const printResult = function (size, result) {
    const counts = "(" + result.counts.targets + " objects, " + result.counts.fields + " fields)";
    if (result.status === "SAME") {
        console.log("  " + size.width + ": SAME " + counts);
        printHtmlInBoth(result.htmlInBoth);
        return;
    }
    const parts = result.differences.map(function (difference) { return difference.part; }).join(", ");
    console.log("  " + size.width + ": " + result.status + " " + counts + ": " + parts);
    result.differences.forEach(function (difference) {
        if (difference.part === "picture") {
            console.log("    picture: " + difference.place);
            return;
        }
        if (difference.part === "old page") {
            console.log("    old page: " + difference.reason);
            return;
        }
        if (difference.part === "html as text") {
            console.log("    html as text, only in the new page: " + describeHtmlItems(difference.items));
            return;
        }
        const [oldText, newText] = cutAround(difference.oldLine, difference.newLine);
        console.log("    " + difference.part + ", " + difference.count + " lines, the first at line " + difference.lineNumber + ":");
        console.log("      old: " + oldText);
        console.log("      new: " + newText);
        const changes = describeChanges(difference.pairs);
        if (changes) console.log("      the changes of all " + difference.count + " lines: " + changes);
    });
    printHtmlInBoth(result.htmlInBoth);
    const files = result.isWithoutOld ? "-new.png, -new.dom.txt ..." : "-old.png, -new.png, .dom.txt ...";
    console.log("    files: " + result.fileStart + files);
};

const printTotals = function (totals) {
    console.log("");
    console.log("Pages: " + totals.SAME + " same, " + totals.LIVE + " live, " + totals.DIFF + " different, "
        + totals.SKIPPED + " without an old version");
};

// *** START:

const readWidth = function (text) {
    const width = Number(text);
    if (Number.isInteger(width) && width > 0) return width;
    throw new Error("--width takes a number of px: --width 390");
};

const readOptions = function (args) {
    const options = { base: "HEAD", isAll: false, isHelp: false, pages: [], widths: [], init: "", runs: [],
        isClockStopped: true, isPictureOnly: false, isPressAll: false };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--base") options.base = args[++i];
        else if (args[i] === "--init") options.init = args[++i] || "";
        else if (args[i] === "--run") options.runs.push(args[++i] || "");
        else if (args[i] === "--moving-clock") options.isClockStopped = false;
        else if (args[i] === "--picture-only") options.isPictureOnly = true;
        else if (args[i] === "--press-all") options.isPressAll = true;
        else if (args[i] === "--all") options.isAll = true;
        else if (args[i] === "--width") options.widths.push(readWidth(args[++i]));
        else if (args[i] === "--help") options.isHelp = true;
        // WHY: an option it does not know was taken for the name of a page, and nothing said so.
        else if (args[i].startsWith("--")) throw new Error("Unknown option " + args[i] + ": node test/compare-pages.js --help");
        else options.pages.push(toPagePair(args[i]));
    }
    return options;
};

const choosePages = function (options) {
    let pairs = options.pages;
    if (options.isAll) pairs = listSamples().map(toPagePair);
    else if (pairs.length === 0) pairs = findChangedPages(options.base).map(toPagePair);
    // WHY one pair for each --run: each is a state of its own (a page of a panel), all of them in one browser.
    const runs = (options.runs.length > 0) ? options.runs : [""];
    return pairs.flatMap(function (pair) {
        return runs.map(function (run, index) {
            const runName = (runs.length > 1) ? "run" + (index + 1) : "";
            const steps = { init: options.init, run: run, isClockStopped: options.isClockStopped, isPictureOnly: options.isPictureOnly,
                isPressOnce: !options.isPressAll };
            return Object.assign({}, pair, { steps: steps, runName: runName });
        });
    });
};

const chooseSizes = function (options) {
    if (options.widths.length === 0) return SIZES;
    return options.widths.map(function (width) {
        const height = (width < PHONE_WIDTH) ? PHONE_SIZE.height : DESKTOP_SIZE.height;
        return { width: width, height: height };
    });
};

const compareAndPrint = async function (browser, port, pair, size) {
    try {
        const result = await compareAtSize(browser, port, pair, size);
        printResult(size, result);
        return result.status;
    } catch (error) {
        // WHY go on: a page that can not be opened must not stop the others.
        console.log("  " + size.width + ": DIFF: it can not be opened: " + error.message.split("\n")[0]);
        return "DIFF";
    }
};

// A page that is not in the commit: nothing to compare with, but it is still opened at each size and looked at.
const lookAtNewPage = async function (browser, port, pair, sizes, base) {
    console.log(describePair(pair) + "\n  not in " + base + ": nothing to compare with (a new name: old.htm=new.htm)");
    const newUrl = "http://127.0.0.1:" + port + "/" + pair.newPath;
    let status = "SKIPPED";
    for (const size of sizes) {
        try {
            const newRun = await runPage(browser, newUrl, size, pair.steps);
            const newHtml = findNewHtmlAsText([], newRun);
            if (!newHtml) continue;
            console.log("  " + size.width + ": html as text: " + describeHtmlItems(newHtml.items));
        } catch (error) {
            console.log("  " + size.width + ": it can not be opened: " + error.message.split("\n")[0]);
        }
        status = "DIFF";
    }
    return status;
};

// The result of a page is the worst result of its sizes.
const comparePage = async function (browser, port, pair, sizes) {
    console.log(describePair(pair));
    const statuses = [];
    for (const size of sizes) {
        statuses.push(await compareAndPrint(browser, port, pair, size));
    }
    if (statuses.includes("DIFF")) return "DIFF";
    if (statuses.includes("LIVE")) return "LIVE";
    return "SAME";
};

// The pages in one browser. The other tools with Chrome are looked for before every page (one may start later).
const compareAll = async function (options, pages, sizes, run) {
    if (run.hasOthers()) console.log(run.describeOthers() + "\n");

    const server = await chrome.startServer({ commit: options.base });
    const browser = await chrome.launchChrome();
    const totals = { SAME: 0, LIVE: 0, DIFF: 0, SKIPPED: 0 };

    try {
        for (const pair of pages) {
            run.noteOthers();
            if (!isInCommit(options.base, pair.oldPath)) {
                totals[await lookAtNewPage(browser, server.address().port, pair, sizes, options.base)]++;
                continue;
            }
            totals[await comparePage(browser, server.address().port, pair, sizes)]++;
        }
    } finally {
        await browser.close();
        server.close();
    }

    run.noteOthers();
    printTotals(totals);
    if (run.hasOthers()) console.log(run.describeOthers());
    return (totals.DIFF > 0) ? 1 : 0;
};

const main = async function () {
    const options = readOptions(process.argv.slice(2));
    if (options.isHelp) {
        console.log(chrome.helpText(__filename));
        return 0;
    }

    const pages = choosePages(options);
    const sizes = chooseSizes(options);
    if (pages.length === 0) {
        console.log("No sample is changed since " + options.base + ". Name the pages, or use --all.");
        return 0;
    }

    deleteOldRuns();
    fs.mkdirSync(OUT_FOLDER, { recursive: true });
    const run = chrome.startRun("compare-pages");
    try {
        return await compareAll(options, pages, sizes, run);
    } finally {
        run.end();
        deleteEmptyFolder();
    }
};

main().then(function (exitCode) {
    process.exitCode = exitCode;
}).catch(function (error) {
    console.error(error.message);
    process.exitCode = 2;
});
