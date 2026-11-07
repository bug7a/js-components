/* Bismillah */

/*
FOCUS RINGS: does a click of the mouse leave a ring that is for the keyboard?

A ring (or a line) that shows where the keys go must not show after a click (:focus-visible is false then). Every
object of a page that takes the focus is clicked with the mouse; then the look of the focused object (its outline,
box-shadow and edge, and the ones of the objects in it and of the two around it) is read before and after blur():
a difference is a mark that the click showed. The fields that take a text are skipped (input, textarea, the roles
textbox, searchbox, combobox and spinbutton): there a click shows where the typing goes, as it should.

    node test/focus-rings.js                          every sample
    node test/focus-rings.js tabs.htm tree-view.htm   these pages (of 02-comp-examples, or a path from the root)

First it checks itself on a page of its own: a box that draws a ring at every focus and a box with the ring of
basic.js (setFocusRing). When it does not find the first one, or finds the second one, it stops (exit code 2).

The results:
    CLEAN    no mark after a click
    HIDDEN   a ring drawn at every focus, in a transparent color: it does not show now, but it shows after a click
             when a page gives it a color (draw it for :focus-visible only)
    RING     a mark after a click: the object, the property, before -> after. The exit code is 1.

It clicks, nothing else: the ring of the keyboard itself (Tab) is not measured.
It needs Chrome and puppeteer-core (npm install puppeteer-core; CHROME_PATH for another place of Chrome).
WHY three tabs side by side: each check compares a tab with itself (before and after blur), so the tabs do not
disturb it (as they disturb the pictures of compare-pages).
*/

"use strict";

const chrome = require("./_chrome.js");
const { listSamples, toPagePath, sleep } = chrome;

const SELF_CHECK_PATH = "/__self-check__.htm"; // the page of the self check, made by the server

const TABS = 3;
const LOAD_WAIT = 600; // ms: after the load, for the first animations of a page
const CLICK_WAIT = 450; // ms: WHY: the motions of a click (a color, a knob) end first; then only the focus may differ
const BLUR_WAIT = 400; // ms
const LOAD_TIMEOUT = 20000; // ms
const MAX_OBJECTS = 14; // clicked on a page
const PER_KIND = 1; // objects of one kind (role, class, tabindex) on a page: the rows of a list are alike
const RELOAD_EVERY = 5; // clicks: a page is opened again, so the dialogs and menus a click opened go away
const AROUND_LEVELS = 2; // the objects around the focused one that are read too
const MAX_INSIDE = 80; // the objects in the focused one that are read

const FOCUS_TAKERS = '[tabindex]:not([tabindex="-1"]), [role=tab], [role=option], [role=treeitem], [role=menuitem], ' +
    "[role=radio], [role=checkbox], [role=switch], [role=slider], [role=button], button";
const TEXT_FIELDS = "input, textarea, select, [contenteditable=true], [contenteditable=''], " +
    "[role=textbox], [role=searchbox], [role=combobox], [role=spinbutton]";

// The page of the self check: a box with a ring at every focus (a click shows it: it must be found) and a box with
// the ring of basic.js (only for the keyboard: it must not be found).
const SELF_CHECK_PAGE = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Focus rings: self check</title>
<link rel="stylesheet" href="/basic/basic.css"><script src="/basic/basic.js"><\/script>
<script>
const start = function () {
    const badBox = Box(40, 40, 160, 40, { color: "whitesmoke", tabIndex: 0, clickable: 1 });
    badBox.elem.setAttribute("aria-label", "a ring at every focus");
    badBox.on("focus", function () { badBox.boxShadow = "inset 0 0 0 2px blue"; });
    badBox.on("blur", function () { badBox.boxShadow = "none"; });
    const goodBox = Box(40, 120, 160, 40, { color: "whitesmoke", tabIndex: 0, clickable: 1 });
    goodBox.elem.setAttribute("aria-label", "the ring of basic.js");
    goodBox.setFocusRing("blue");
};
<\/script></head><body></body></html>`;

// *** IN THE PAGE: these functions run in the browser.

// Marks the objects to click (data-focus-ring-id) and returns their ids: one of a kind, not the text fields.
const markObjects = function (focusTakers, textFields, perKind, maxObjects) {
    const countOfKind = {};
    const ids = [];
    document.querySelectorAll(focusTakers).forEach(function (object, index) {
        if (ids.length >= maxObjects || object.matches(textFields)) return;
        const box = object.getBoundingClientRect();
        if (box.width < 4 || box.height < 4 || getComputedStyle(object).visibility === "hidden") return;
        const kind = (object.getAttribute("role") || object.tagName) + "|" + object.className + "|" + object.getAttribute("tabindex");
        countOfKind[kind] = (countOfKind[kind] || 0) + 1;
        if (countOfKind[kind] > perKind) return;
        object.setAttribute("data-focus-ring-id", "f" + index);
        ids.push("f" + index);
    });
    return ids;
};

// The middle of an object, when the mouse can reach it there (nothing over it). null: it can not be clicked.
const findClickPoint = function (id) {
    const object = document.querySelector("[data-focus-ring-id='" + id + "']");
    if (!object) return null;
    object.scrollIntoView({ block: "center", inline: "center" });
    const box = object.getBoundingClientRect();
    if (box.width < 4 || box.height < 4) return null;
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const top = document.elementFromPoint(x, y);
    if (!top || !(top === object || object.contains(top) || top.contains(object))) return null;
    return { x: x, y: y };
};

// The look of the focused object and of the objects in it and around it (kept for readLookAgain)
const readFocusedLook = function (textFields, aroundLevels, maxInside) {
    const focused = document.activeElement;
    if (!focused || focused === document.body || focused === document.documentElement) return null;
    if (focused.matches(textFields)) return { isTextField: 1 };
    const objects = [focused];
    const places = ["it"];
    let parent = focused.parentElement;
    for (let level = 0; level < aroundLevels && parent; level++, parent = parent.parentElement) {
        objects.push(parent);
        places.push("around it");
    }
    Array.from(focused.querySelectorAll("*")).slice(0, maxInside).forEach(function (inside) {
        objects.push(inside);
        places.push("in it");
    });
    window.focusRingObjects = objects;
    window.focusRingFocused = focused;
    window.focusRingLookOf = function (object) {
        if (!object.isConnected) return null;
        const style = getComputedStyle(object);
        return {
            outline: style.outlineStyle + " " + style.outlineWidth + " " + style.outlineColor,
            outlineStyle: style.outlineStyle,
            shadow: style.boxShadow,
            edge: style.borderTopColor + " " + style.borderTopWidth,
            edgeWidth: parseFloat(style.borderTopWidth) || 0,
        };
    };
    const name = focused.getAttribute("aria-label") || (focused.textContent || "").trim().slice(0, 30);
    return { looks: objects.map(window.focusRingLookOf), places: places, role: focused.getAttribute("role") || focused.tagName.toLowerCase(), name: name };
};

const blurFocused = function () {
    window.focusRingFocused.blur();
};

const readLookAgain = function () {
    return window.focusRingObjects.map(window.focusRingLookOf);
};

// *** THE CHECK:

// WHY: rgba(..., 0) parts only: a ring that is there but does not show (the default color of some components)
const isTransparentShadow = function (shadow) {
    const colors = shadow.match(/rgba?\([^)]*\)/g) || [];
    return colors.length > 0 && colors.every(function (color) { return /rgba\([^)]*,\s*0\)/.test(color); });
};

// The marks of the focus: what differs between the look before and after blur()
const findMarks = function (before, after, places) {
    const marks = [];
    before.forEach(function (look, index) {
        const lookAfter = after[index];
        if (!look || !lookAfter) return; // WHY: an object that went away with the focus (a tooltip) is not a mark
        const where = (index === 0) ? "" : " (an object " + places[index] + ")";
        if (look.outline !== lookAfter.outline && look.outlineStyle !== "none") {
            marks.push({ kind: "RING", text: "outline" + where + ": " + look.outline + " -> " + lookAfter.outline });
        }
        if (look.shadow !== lookAfter.shadow) {
            const kind = isTransparentShadow(look.shadow) ? "HIDDEN" : "RING";
            marks.push({ kind: kind, text: "box-shadow" + where + ": " + look.shadow + " -> " + lookAfter.shadow });
        }
        if (look.edge !== lookAfter.edge && look.edgeWidth > 0) {
            marks.push({ kind: "RING", text: "edge" + where + ": " + look.edge + " -> " + lookAfter.edge });
        }
    });
    return marks;
};

// Clicks one object with the mouse and reads its marks. null: it was not clicked, or it gave no focus to measure.
const clickAndRead = async function (page, id) {
    const point = await page.evaluate(findClickPoint, id);
    if (!point) return null;
    await page.mouse.click(point.x, point.y);
    await sleep(CLICK_WAIT);
    const before = await page.evaluate(readFocusedLook, TEXT_FIELDS, AROUND_LEVELS, MAX_INSIDE);
    if (!before || before.isTextField) return { isClicked: 1 };
    await page.evaluate(blurFocused);
    await sleep(BLUR_WAIT);
    const after = await page.evaluate(readLookAgain);
    return { isClicked: 1, isFocused: 1, role: before.role, name: before.name, marks: findMarks(before.looks, after, before.places) };
};

// Every object of a page that takes the focus, clicked; the page is opened again now and then
const checkPage = async function (browser, port, pagePath) {
    const page = await browser.newPage();
    page.on("dialog", function (dialog) { dialog.dismiss().catch(function () {}); });
    await page.setViewport({ width: 1280, height: 900 });
    const url = "http://127.0.0.1:" + port + "/" + pagePath;
    const open = async function () {
        await page.goto(url, { waitUntil: "networkidle0", timeout: LOAD_TIMEOUT }).catch(function () {});
        await sleep(LOAD_WAIT);
        return page.evaluate(markObjects, FOCUS_TAKERS, TEXT_FIELDS, PER_KIND, MAX_OBJECTS).catch(function () { return []; });
    };
    const result = { pagePath: pagePath, clicked: 0, focused: 0, found: [] };
    const ids = await open();
    for (let index = 0; index < ids.length; index++) {
        if (index > 0 && index % RELOAD_EVERY === 0) await open();
        try {
            const read = await clickAndRead(page, ids[index]);
            if (page.url() !== url) {
                await open(); // WHY: a click went to another page (a link)
                continue;
            }
            if (!read) continue;
            result.clicked++;
            if (!read.isFocused) continue;
            result.focused++;
            read.marks.forEach(function (mark) { result.found.push({ kind: mark.kind, role: read.role, name: read.name, text: mark.text }); });
        } catch (error) {
            await open();
        }
    }
    await page.close();
    return result;
};

// *** THE REPORT:

const getStatus = function (result) {
    if (result.found.some(function (mark) { return mark.kind === "RING"; })) return "RING";
    if (result.found.length > 0) return "HIDDEN";
    return "CLEAN";
};

const printResult = function (result) {
    console.log(result.pagePath + "  " + getStatus(result) + " (" + result.clicked + " clicked, " + result.focused + " focused)");
    result.found.forEach(function (mark) {
        console.log("    " + mark.kind + "  " + mark.role + " \"" + mark.name + "\": " + mark.text.slice(0, 150));
    });
};

// The tool checks itself: it must find the ring at every focus, and not the ring of basic.js
const runSelfCheck = async function (browser, port) {
    const result = await checkPage(browser, port, SELF_CHECK_PATH.slice(1));
    const names = result.found.map(function (mark) { return mark.name; });
    const isRightResult = names.includes("a ring at every focus") && !names.includes("the ring of basic.js");
    if (isRightResult) {
        console.log("Self check: the ring at every focus is found, the ring of basic.js is not.\n");
        return true;
    }
    console.log("SELF CHECK FAILED: this tool does not see the rings right; its results can not be trusted.");
    printResult(result);
    return false;
};

// Its own pages for each tab: the 1st, 4th... page to the first tab, the 2nd, 5th... to the second one
const checkPagesInTabs = async function (browser, port, pages) {
    const results = new Array(pages.length);
    const runTab = async function (tabIndex) {
        for (let index = tabIndex; index < pages.length; index += TABS) {
            results[index] = await checkPage(browser, port, pages[index]);
            printResult(results[index]);
        }
    };
    const tabs = [];
    for (let tabIndex = 0; tabIndex < TABS; tabIndex++) tabs.push(runTab(tabIndex));
    await Promise.all(tabs);
    return results;
};

const printTotals = function (results) {
    const count = function (status) { return results.filter(function (result) { return getStatus(result) === status; }).length; };
    const clicked = results.reduce(function (sum, result) { return sum + result.clicked; }, 0);
    const focused = results.reduce(function (sum, result) { return sum + result.focused; }, 0);
    console.log("\nPages: " + count("CLEAN") + " clean, " + count("HIDDEN") + " hidden, " + count("RING") + " with a ring" +
        " (" + clicked + " clicked, " + focused + " focused)");
};

const main = async function () {
    const args = process.argv.slice(2);
    if (args.includes("--help") || args.includes("-h")) {
        console.log(chrome.helpText(__filename));
        return 0;
    }
    const pages = (args.length > 0) ? args.map(toPagePath) : listSamples();

    const server = await chrome.startServer({ pages: { [SELF_CHECK_PATH]: SELF_CHECK_PAGE } });
    const browser = await chrome.launchChrome();
    try {
        const port = server.address().port;
        if (!await runSelfCheck(browser, port)) return 2;
        const results = await checkPagesInTabs(browser, port, pages);
        printTotals(results);
        return results.some(function (result) { return getStatus(result) === "RING"; }) ? 1 : 0;
    } finally {
        await browser.close();
        server.close();
    }
};

main().then(function (exitCode) {
    process.exitCode = exitCode;
}).catch(function (error) {
    console.error(error.message);
    process.exitCode = 2;
});
