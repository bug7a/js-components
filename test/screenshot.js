/* Bismillah */

/*
SCREENSHOT: one picture of a page (or of a part of it) for a report, in one command.

    node test/screenshot.js tabs.htm                         a sample at 1280 px (a name alone is in 02-comp-examples)
    node test/screenshot.js tabs.htm --width 390             at the width of a phone
    node test/screenshot.js "index.htm#/text-field"           a page with a #hash (or a ?query)
    node test/screenshot.js _basic-designer/index.htm --run "BasicDesigner.openFolderDialog()" --clip "[role=dialog]"
    node test/screenshot.js tabs.htm --before                the page of the last commit left, the page now right
    node test/screenshot.js tabs.htm --before HEAD~2 --name tabs-fix
    node test/screenshot.js _screenshots/try.htm --before    a page outside git (a page of yours to try a component):
                                                             the same page with basic/ and comp/ of the commit | now
    node test/screenshot.js --join 2026-11-09-hero-old.png 2026-11-09-hero-new.png --label "before: amber" \
        --label "after: teal" --name hero-colors             two pictures of yours side by side, with labels (Ex: a
                                                             page outside git that changed itself)
    node test/screenshot.js stepper.htm --print "document.title" --print "page.width" --no-picture
    node test/screenshot.js stepper.htm --width 390 --cut --no-picture
                                                             is anything cut on a phone? (the texts; exit code 1)
    node test/screenshot.js item-list.htm --clip-text 'styleName: "light"' --clip-text 'styleName: "dark" ·'
                                                             the two cards with these titles (lower on the page too)
    node test/screenshot.js "03-webpages/webpage-handbook/index.htm#/box" --click "Run" --click "Copy"
    node test/screenshot.js "03-webpages/webpage-handbook/index.htm#/using-components" --click "Run" \
        --click "Your name" --type "Ada" --click "Save"     (the example runs in an iframe: it is searched too)
    node test/screenshot.js 04-templates/ozden-panel/index.htm --init "localStorage.setItem('appid_login', '{}')" \
        --run "openPageByKey('Reports')"                    (a page of the panel: it opens after its login)
    node test/screenshot.js index.htm --og index/og-image.jpg
                                                             the link preview of a site, made again

Options:
    --init "code"     runs before the scripts of the page, in the page of --before too: a login that the page keeps
                      in localStorage
    --run "code"      runs in the page after it is loaded (await works): open a menu, a dialog, a state
    --wait-for "js"   after the load it waits until this JavaScript is true (30 s at most), then --run: a page that
                      loads in parts (basic.js Designer: "BasicDesigner.state.rt"); in the page of --before too. Still
                      not true: an error (exit code 1), and the picture shows where the page stopped
    --click "text"    a click of the mouse on the element that shows this text (or has it as its aria-label, title or
                      placeholder), in the page or in one of its iframes of the same origin, brought into the window
    --type "text"     types the text with the keyboard into the field that has the focus (a --click on it before)
                      --click and --type run after --run, one after the other in the order they are given
    --clip "x"        only this part: a basic.js expression (BasicDesigner.ui.pageMenu, a box or its elem, or a list
                      of them) or a CSS selector ([role=dialog], #id: its first element that is seen); --margin px
                      around it (12). More than one --clip: the part that holds all of them. A part out of the
                      window (lower in a ScrollArea) is scrolled into it; a taller one makes the window taller
    --clip-text "t"   only the box around a title: the card or the group of the element whose text starts with
                      this text (its parent). With --clip and more --clip-text: the part that holds them all
    --before [commit] before | after in one picture, with labels (HEAD by default). A page that is not in the
                      commit (outside git, or new) is the page now in both, with basic/ and comp/ of the commit
    --live            the page through Live Server (port 5505, it must run), as VS Code shows it: with the reload
                      script that it puts into the pages and the SVG files (not with --before)
    --join a b        no page: the pictures a and b side by side, a on the left (a path, or a name in _screenshots/;
                      .png, .jpg, .webp); --name: a-vs-b by default. Take the old state first with --name, then the new
                      one, then join them. The labels are as large as the pictures need (a picture of 2x pixels: 2x)
    --label "text"    the label of a picture of --join, the left one first (its file name without the date by default)
    --name what       the file: _screenshots/YYYY-MM-DD-what.png (the name of the page by default)
    --og file.jpg     the link preview of a site (og:image): the first screen of the page in a window of 1200 x 630,
                      its scroll bars hidden, a JPEG into this file of the repository, not into _screenshots/ (not
                      with --before or --clip). With --height: a taller one (the picture of the README: 1250)
    --width, --height the window (1280 x 800; a width under 500 is 844 high)
    --scale n         pixels per px (2 for a part, 1 for the whole window)
    --wait ms         after the load, after --run and after each --click and --type (600)
    --print "expr"    writes the value of a JavaScript expression of the page in the terminal, after --run (await
                      works; more than one --print: each one): a check without reading a picture
    --no-picture      only the --print values and the errors: no picture is saved
    --cut             the texts cut at this width, after --run: by the left edge of the window or of a box of the
                      page (a card narrower than what is in it): they can not be reached; by the right edge of a box
                      (a title wider than its card, a label narrower than its text), with no "..." (an ellipsis is
                      on purpose): its end can not be read; so exit code 1. And the ones that go out on the right of
                      the window (a note: a carousel or a bar of tabs does it on purpose). A text in a part that
                      scrolls to the side is not counted

It prints the file, and the errors of the page (exit code 1 when the page throws, or --clip or --click finds nothing).
When another tool with Chrome runs at the same time (another session), it says so at the end (a NOTE).
The pictures older than 48 hours in _screenshots/ are deleted first (never readme.md).
The server lists a folder as Live Server does, so the Open Folder of basic.js Designer works in it.
It needs Chrome and puppeteer-core, like compare-pages.js (CHROME_PATH for another place of Chrome).
*/

"use strict";

const fs = require("fs");
const path = require("path");
const chrome = require("./_chrome.js");
const { ROOT, OLD_PATH, isInCommit, sleep } = chrome;

const SCREENSHOTS_FOLDER = path.join(ROOT, "_screenshots");

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const PHONE_WIDTH = 500; // a window narrower than this is a phone
const PHONE_HEIGHT = 844;
const DEFAULT_WAIT = 600; // ms: the first animations of a page, the motion of a menu
const DEFAULT_MARGIN = 12; // px around a clipped part
const LOAD_TIMEOUT = 30000; // ms
const OLD_PICTURE_AGE = 48 * 60 * 60 * 1000; // ms
const CUT_TEXTS_SHOWN = 4; // texts written under a --cut line
const OG_SIZE = { width: 1200, height: 630 }; // px: the picture of a link preview (og:image)
const OG_QUALITY = 90; // of its JPEG
const LIVE_SERVER = "http://127.0.0.1:5505"; // --live: the port of .vscode/settings.json

// *** FILES:

const deleteOldPictures = function () {
    if (!fs.existsSync(SCREENSHOTS_FOLDER)) return;
    const now = Date.now();
    fs.readdirSync(SCREENSHOTS_FOLDER).forEach(function (name) {
        if (name === "readme.md") return;
        const file = path.join(SCREENSHOTS_FOLDER, name);
        const stat = fs.statSync(file);
        if (stat.isFile() && now - stat.mtimeMs > OLD_PICTURE_AGE) fs.unlinkSync(file);
    });
};

// *** IN THE PAGE:

// An address as a path of the repository (the server and the old-commit part taken out).
const withoutOrigin = function (text) {
    return text.replace(/http:\/\/127\.0\.0\.1:\d+/g, "").split(OLD_PATH + "/").join("/");
};

const watchPage = function (page, log) {
    page.on("pageerror", function (error) { log.push({ isError: true, text: "PAGE ERROR " + error.message }); });
    page.on("dialog", function (dialog) {
        log.push({ isError: false, text: "DIALOG " + dialog.message() });
        dialog.dismiss().catch(function () {});
    });
    page.on("console", function (message) {
        const isErrorEvent = message.text().startsWith("ERROR EVENT "); // chrome.guardPage writes it
        if (message.type() !== "error" && message.type() !== "warn" && !isErrorEvent) return;
        if (message.text().startsWith("Failed to load resource")) return; // WHY: the "response" line names the file
        log.push({ isError: false, text: "CONSOLE " + message.type() + " " + withoutOrigin(message.text()) });
    });
    page.on("response", function (response) {
        if (response.status() < 400 || response.url().includes("favicon")) return;
        log.push({ isError: false, text: "NOT FOUND (" + response.status() + ") " + withoutOrigin(response.url()) });
    });
    page.on("requestfailed", function (request) {
        const reason = (request.failure() && request.failure().errorText) || "";
        if (reason === "net::ERR_ABORTED") return; // WHY: a page that loads another one stops the first one
        log.push({ isError: false, text: "REQUEST FAILED " + reason + " " + withoutOrigin(request.url()) });
    });
};

// Runs in the page: the rectangle that holds every clip, brought into the window with its margin. A clip is a
// basic.js expression (an object, an element or a list of them), a CSS selector (its first element that is seen) or
// { text } (--clip-text: the parent of the deepest element whose text starts with it: a title in its card).
// WHY "seen": a closed panel or a hidden layer of the page is often the first element of a selector ([role=dialog]).
// WHY brought into the window: a part lower in a ScrollArea was cut at the bottom of the picture (the page does not
//     scroll, its box does). scroll-margin keeps the margin above it in the window.
const findClipRect = function (clips, margin) {
    const isSeen = function (element) {
        const rect = element.getBoundingClientRect();
        return (rect.width > 0 && rect.height > 0);
    };
    const textOf = function (element) { return element.textContent.replace(/\s+/g, " ").trim(); };
    const elementsOfText = function (text) {
        const wanted = text.replace(/\s+/g, " ").trim();
        const isStartedByText = function (element) { return textOf(element).startsWith(wanted); };
        const title = [...document.querySelectorAll("body *")].filter(isSeen).find(function (element) {
            return isStartedByText(element) && ![...element.children].some(isStartedByText);
        });
        return (title && title.parentElement) ? [title.parentElement] : [];
    };
    const elementsOf = function (clip) {
        if (clip && typeof clip === "object") return elementsOfText(clip.text);
        let found = null;
        try {
            found = (0, eval)(clip); // WHY indirect: the globals of the page, not the variables of this function
        } catch (error) {
            found = null; // WHY: a CSS selector is not JavaScript
        }
        const list = (found && typeof found.length === "number" && !found.elem) ? Array.from(found) : [found];
        const elements = list.map(function (item) { return (item && item.elem) ? item.elem : item; })
            .filter(function (item) { return item instanceof Element; });
        if (elements.length) return elements;
        try {
            const first = Array.from(document.querySelectorAll(clip)).find(isSeen);
            return (first) ? [first] : [];
        } catch (error) {
            return [];
        }
    };
    const unionOf = function (elements) {
        const rects = elements.map(function (element) { return element.getBoundingClientRect(); });
        const left = Math.min.apply(null, rects.map(function (rect) { return rect.left; }));
        const top = Math.min.apply(null, rects.map(function (rect) { return rect.top; }));
        const right = Math.max.apply(null, rects.map(function (rect) { return rect.right; }));
        const bottom = Math.max.apply(null, rects.map(function (rect) { return rect.bottom; }));
        return { x: left, y: top, width: right - left, height: bottom - top };
    };
    const elements = clips.flatMap(elementsOf).filter(isSeen);
    if (!elements.length) return null;
    const rect = unionOf(elements);
    const isInWindow = (rect.y >= margin && rect.y + rect.height + margin <= window.innerHeight);
    if (isInWindow) return rect;
    const topOf = function (element) { return element.getBoundingClientRect().top; };
    const topmost = elements.reduce(function (a, b) { return (topOf(b) < topOf(a)) ? b : a; });
    const ownScrollMargin = topmost.style.scrollMarginTop;
    topmost.style.scrollMarginTop = margin + "px";
    topmost.scrollIntoView({ block: "start", inline: "nearest" });
    topmost.style.scrollMarginTop = ownScrollMargin;
    return unionOf(elements);
};

// Runs in the page: the middle of the element that shows this text (or has it as its aria-label, title or
// placeholder), in the page or in an iframe of the same origin (an example in a WebView), brought into the window.
// null when there is none.
// WHY the deepest element with the text: it is the one under the mouse (a label in a button).
const findClickPoint = function (text) {
    const wanted = text.trim();
    const LABELS = ["aria-label", "title", "placeholder"];
    const textOf = function (elem) { return elem.textContent.replace(/\s+/g, " ").trim(); };
    const isShown = function (elem) {
        const rect = elem.getBoundingClientRect();
        const style = elem.ownerDocument.defaultView.getComputedStyle(elem);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
    };
    const findIn = function (doc) {
        const shown = [...doc.querySelectorAll("body *")].filter(isShown);
        const byText = shown.find(function (elem) {
            if (textOf(elem) !== wanted) return false;
            return ![...elem.children].some(function (child) { return textOf(child) === wanted; });
        });
        const byLabel = shown.find(function (elem) {
            return LABELS.some(function (name) { return elem.getAttribute(name) === wanted; });
        });
        return byText || byLabel || null;
    };
    // The page first, then its iframes: the element and the iframes around it, the outer one first.
    const search = function (doc) {
        const target = findIn(doc);
        if (target) return { target: target, frames: [] };
        for (const frame of doc.querySelectorAll("iframe")) {
            let inner = null;
            try { inner = frame.contentDocument; } catch (error) { inner = null; } // WHY: another origin can not be read
            if (!inner || !inner.body) continue;
            const found = search(inner);
            if (found) return { target: found.target, frames: [frame].concat(found.frames) };
        }
        return null;
    };
    const found = search(document);
    if (!found) return null;
    found.frames.forEach(function (frame) { frame.scrollIntoView({ block: "center", inline: "center" }); });
    found.target.scrollIntoView({ block: "center", inline: "center" });
    // WHY the frames are added: the place of an element in an iframe is from the corner of that iframe.
    const rect = found.target.getBoundingClientRect();
    let x = rect.left + rect.width / 2;
    let y = rect.top + rect.height / 2;
    found.frames.forEach(function (frame) {
        const frameRect = frame.getBoundingClientRect();
        x += frameRect.left + frame.clientLeft;
        y += frameRect.top + frame.clientTop;
    });
    return { x: x, y: y };
};

const runCode = function (code) {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    return new AsyncFunction(code)();
};

// Runs in the page: the value of an expression as a text (JSON when it can be).
const readValue = async function (expression) {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const value = await new AsyncFunction("return (" + expression + ");")();
    if (value === undefined) return "undefined";
    if (value instanceof Element) return "<" + value.tagName.toLowerCase() + "> " + value.textContent.trim().slice(0, 120);
    try {
        const text = JSON.stringify(value);
        return (text === undefined) ? String(value) : text;
    } catch (error) {
        return String(value); // WHY: a basic.js object refers to itself (its elem, its parent)
    }
};

// The --print values: "expression = value" (an expression that throws is an error of the log).
const readPrints = async function (page, expressions, log) {
    const prints = [];
    for (const expression of expressions) {
        try {
            prints.push(expression + " = " + await page.evaluate(readValue, expression));
        } catch (error) {
            log.push({ isError: true, text: "PRINT ERROR " + expression + ": " + error.message.split("\n")[0] });
        }
    }
    return prints;
};

// Runs in the page (--cut): the texts cut by the left edge of a box of the page (a card narrower than what is in it)
// or of the window, the ones cut by the right edge of a box with no ellipsis, and the ones that go out on the right
// of the window. A text in a part that scrolls to the side is not counted: it can be reached.
const findCutTexts = function () {
    const width = window.innerWidth;
    const EDGE = 2; // px over an edge that are not counted (a rounding)
    const SEEN = 8; // px of a text that must be on the other side of the edge: one all out is not seen, not cut
    const isScrollingX = function (elem) {
        return ["auto", "scroll"].includes(getComputedStyle(elem).overflowX) && elem.scrollWidth > elem.clientWidth + 1;
    };
    const ownTextOf = function (elem) {
        return [...elem.childNodes]
            .filter(function (node) { return node.nodeType === Node.TEXT_NODE; })
            .map(function (node) { return node.textContent.trim(); })
            .join(" ").trim();
    };
    // The words of a text, not its element: a Label as wide as its card cuts its own text (overflow: hidden of
    // basic.css). WHY word by word: the space at the end of a line of a text that wraps (pre-wrap) stands out of its
    // box and is not seen.
    const textRectOf = function (elem) {
        const range = document.createRange();
        let left = Infinity;
        let right = -Infinity;
        elem.childNodes.forEach(function (node) {
            if (node.nodeType !== Node.TEXT_NODE) return;
            const words = /\S+/g;
            for (let word = words.exec(node.textContent); word; word = words.exec(node.textContent)) {
                range.setStart(node, word.index);
                range.setEnd(node, word.index + word[0].length);
                [...range.getClientRects()].forEach(function (part) {
                    if (part.width < 1) return;
                    left = Math.min(left, part.left);
                    right = Math.max(right, part.right);
                });
            }
        });
        return (left === Infinity) ? null : { left: left, right: right };
    };
    // WHY: a text in a box whose edge fades (a mask: ScrollingText) is cut on purpose, also where a box around it cuts too
    const isMasked = function (elem) {
        const style = getComputedStyle(elem);
        return [style.maskImage, style.webkitMaskImage].some(function (mask) { return mask && mask !== "none"; });
    };
    const found = { windowLeft: [], boxLeft: [], boxRight: [], right: [] };
    document.querySelectorAll("body *").forEach(function (elem) {
        const text = ownTextOf(elem);
        if (!text) return;
        const rect = elem.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1 || rect.bottom < 0) return;
        const style = getComputedStyle(elem);
        if (style.visibility === "hidden" || Number(style.opacity) === 0) return;
        // The boxes that cut what goes out of them, the nearest first (its own box too for the right edge)
        const boxes = [];
        let isInAMask = isMasked(elem);
        for (let parent = elem.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            if (getComputedStyle(parent).overflowX === "visible") continue;
            if (isScrollingX(parent)) return;
            boxes.push(parent.getBoundingClientRect());
            isInAMask = isInAMask || isMasked(parent);
        }
        const rightBoxes = (style.overflowX === "visible") ? boxes : [rect].concat(boxes);
        const nearest = boxes[0] || { left: 0, right: width };
        const shortText = text.slice(0, 30);
        // WHY its own box too: a Label cuts what goes out of it. WHY not with an ellipsis: "..." cuts on purpose. WHY not
        //     white-space: pre: the lines of a code keep their length and its editor scrolls them to the side.
        const textRect = textRectOf(elem) || rect;
        const isCutOnPurpose = (style.textOverflow === "ellipsis" || style.whiteSpace === "pre" || isInAMask);
        const isCutOnTheRight = !isCutOnPurpose && rightBoxes.some(function (box) {
            return box.right < width - 0.5 && textRect.right > box.right + EDGE && textRect.left < box.right - SEEN;
        });
        if (isCutOnTheRight) found.boxRight.push(shortText);
        const isCutByABox = boxes.some(function (box) {
            return box.left > 0.5 && rect.left < box.left - EDGE && rect.right > box.left + SEEN;
        });
        if (isCutByABox) found.boxLeft.push(shortText);
        else if (rect.left < -EDGE && rect.right > SEEN && nearest.left <= 0.5) found.windowLeft.push(shortText);
        const isOutOnTheRight = (rect.right > width + EDGE && rect.left < width - SEEN && nearest.right >= width - 0.5);
        if (isOutOnTheRight) found.right.push(shortText);
    });
    return found;
};

// The --cut lines of the log: a text cut on the left is an error (it can not be reached), one on the right a note.
const describeCut = function (cut, width) {
    const listOf = function (texts) {
        const shown = texts.slice(0, CUT_TEXTS_SHOWN).map(function (text) { return JSON.stringify(text); }).join(", ");
        const otherCount = texts.length - CUT_TEXTS_SHOWN;
        return (otherCount > 0) ? shown + " and " + otherCount + " more" : shown;
    };
    const lines = [];
    const add = function (texts, where, isError) {
        if (texts.length === 0) return;
        const title = (isError) ? "CUT: " : "CUT (a note): ";
        lines.push({ isError: isError, text: title + texts.length + " texts " + where + ": " + listOf(texts) });
    };
    add(cut.windowLeft, "by the left edge of the window", true);
    add(cut.boxLeft, "by the left edge of a box", true);
    add(cut.boxRight, "by the right edge of a box (no \"...\")", true);
    add(cut.right, "go out on the right", false);
    if (lines.length === 0) lines.push({ isError: false, text: "CUT: no text is cut at " + width + " px" });
    return lines;
};

const nameOfClip = function (clip) {
    return (typeof clip === "string") ? clip : "the text \"" + clip.text + "\"";
};

// The clipped part with its margin, inside the window.
const clipWithMargin = function (rect, margin, size) {
    const left = Math.max(0, Math.floor(rect.x - margin));
    const top = Math.max(0, Math.floor(rect.y - margin));
    const right = Math.min(size.width, Math.ceil(rect.x + rect.width + margin));
    const bottom = Math.min(size.height, Math.ceil(rect.y + rect.height + margin));
    return { x: left, y: top, width: right - left, height: bottom - top };
};

// Runs in the page (--og): hides the scroll bars at the right edge of the window, the narrow boxes that the ScrollBar
// of basic.js draws (its bar and the dots at its ends). WHY: a link preview shows the page; a bar would be a stripe at
// its edge.
const hideScrollBars = function () {
    const BAR_WIDTH = 12; // px at most: a bar, its track or a dot
    const EDGE = 16; // px from the right edge of the window
    document.querySelectorAll("div").forEach(function (elem) {
        const rect = elem.getBoundingClientRect();
        const isNarrow = (rect.width > 0 && rect.width <= BAR_WIDTH);
        if (isNarrow && rect.right > window.innerWidth - EDGE) elem.style.visibility = "hidden";
    });
};

// --wait-for: a page that is not ready is still taken, with an error.
const waitForReady = async function (page, expression, log) {
    const isReady = await chrome.waitUntilTrue(page, expression, LOAD_TIMEOUT);
    if (isReady) return;
    log.push({ isError: true, text: "WAIT-FOR ERROR not true after " + (LOAD_TIMEOUT / 1000) + " s: " + expression });
};

const takePicture = async function (browser, url, options) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        if (options.init) await page.evaluateOnNewDocument(options.init);
        const log = [];
        watchPage(page, log);
        await page.setViewport({ width: options.width, height: options.height, deviceScaleFactor: options.scale });
        await page.goto(url, { waitUntil: "load", timeout: LOAD_TIMEOUT });
        if (options.waitFor) await waitForReady(page, options.waitFor, log);
        await sleep(options.wait);

        if (options.run) {
            try {
                await page.evaluate(runCode, options.run);
            } catch (error) {
                log.push({ isError: true, text: "RUN ERROR " + error.message.split("\n")[0] });
            }
            await sleep(options.wait);
        }

        for (const action of options.actions) {
            if (action.kind === "type") {
                await page.keyboard.type(action.text);
                await sleep(options.wait);
                continue;
            }
            const point = await page.evaluate(findClickPoint, action.text);
            if (!point) {
                log.push({ isError: true, text: "CLICK: nothing shows the text or the label \"" + action.text + "\"" });
                continue;
            }
            await page.mouse.click(point.x, point.y);
            await sleep(options.wait);
        }

        const prints = await readPrints(page, options.prints, log);
        if (options.isCut) log.push(...describeCut(await page.evaluate(findCutTexts), options.width));
        if (options.isNoPicture) return { picture: null, log, prints };
        if (options.og) {
            await page.evaluate(hideScrollBars);
            return { picture: await page.screenshot({ type: "jpeg", quality: OG_QUALITY }), log, prints };
        }
        if (!options.clips.length) return { picture: await page.screenshot(), log, prints };

        let rect = await page.evaluate(findClipRect, options.clips, options.margin);
        if (!rect || rect.width === 0 || rect.height === 0) {
            log.push({ isError: true, text: "CLIP: nothing is found for " + options.clips.map(nameOfClip).join(" + ") });
            return { picture: await page.screenshot(), log, prints };
        }
        // WHY: a part taller than the window (or at the end of a box that can not scroll more) was still cut.
        let size = { width: options.width, height: options.height };
        const neededHeight = Math.ceil(rect.y + rect.height + options.margin);
        if (neededHeight > size.height) {
            size = { width: options.width, height: neededHeight };
            await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: options.scale });
            await sleep(options.wait);
            rect = await page.evaluate(findClipRect, options.clips, options.margin);
        }
        const clip = clipWithMargin(rect, options.margin, size);
        return { picture: await page.screenshot({ clip }), log, prints };
    } finally {
        await context.close();
    }
};

// *** SIDE BY SIDE: two pictures with their labels, drawn by the browser itself (no image library).
// --before: the page of a commit | the page now. --join: two pictures of yours.

const SIDE_GAP = 16; // px between the pictures
const LABEL_HEIGHT = 28; // px
const SIDE_VIEW = { width: 4000, height: 3000 }; // px: room for two wide pictures
const PICTURE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

const escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// sides: [{ picture, label, type }], the left one first. Every picture keeps its own pixels (zoom 1 / scale).
// scale 0: found from the pictures (--join): one more for every DEFAULT_WIDTH of the widest, so the labels of a
// picture of 2x pixels are as large as the ones of --before.
const sideBySide = async function (browser, sides, scale) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        const half = function (side) {
            const source = "data:" + (side.type || "image/png") + ";base64," + Buffer.from(side.picture).toString("base64");
            return '<div class="side"><div class="label">' + escapeHtml(side.label) + '</div><img src="' + source + '"></div>';
        };
        const html = "<!DOCTYPE html><style>" +
            "body { margin: 0; background: #E9E9EC; font: 13px -apple-system, sans-serif; color: #333; }" +
            "#all { display: inline-flex; gap: " + SIDE_GAP + "px; padding: " + SIDE_GAP + "px; align-items: flex-start; }" +
            ".label { height: " + LABEL_HEIGHT + "px; font-weight: 600; white-space: nowrap; }" +
            "img { display: block; zoom: var(--zoom); }" +
            "</style><div id=\"all\">" + sides.map(half).join("") + "</div>";
        await page.setViewport({ width: SIDE_VIEW.width, height: SIDE_VIEW.height, deviceScaleFactor: scale || 1 });
        await page.setContent(html, { waitUntil: "load" });
        if (!scale) {
            const widest = await page.evaluate(function () {
                return Math.max.apply(null, [...document.images].map(function (image) { return image.naturalWidth; }));
            });
            scale = Math.max(1, Math.round(widest / DEFAULT_WIDTH));
            await page.setViewport({ width: SIDE_VIEW.width, height: SIDE_VIEW.height, deviceScaleFactor: scale });
        }
        await page.evaluate(function (zoom) { document.documentElement.style.setProperty("--zoom", zoom); }, 1 / scale);
        const all = await page.$("#all");
        return await all.screenshot();
    } finally {
        await context.close();
    }
};

// *** JOIN: two pictures of yours side by side (Ex: a page outside git that changed itself).

// A picture by a path (from the working folder or the repository) or by its name in _screenshots/
const findPicture = function (name) {
    const places = [path.resolve(name), path.join(ROOT, name), path.join(SCREENSHOTS_FOLDER, name)];
    const file = places.find(function (place) { return fs.existsSync(place) && fs.statSync(place).isFile(); });
    if (!file) throw new Error("No such picture: " + name);
    const type = PICTURE_TYPES[path.extname(file).toLowerCase()];
    if (!type) throw new Error("Not a picture (.png, .jpg, .webp): " + name);
    return { file: file, type: type };
};

// "2026-11-09-hero-old.png" -> "hero-old"
const nameOfPicture = function (file) {
    return path.basename(file).replace(/\.\w+$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
};

const joinPictures = async function (options) {
    const names = options.join.filter(function (name) { return name && !name.startsWith("--"); });
    if (names.length !== 2) throw new Error("--join takes two pictures: --join a.png b.png");
    // WHY read first: the old pictures of _screenshots/ are deleted below, and a picture to join may be one of them
    const sides = names.map(function (name, index) {
        const found = findPicture(name);
        return { picture: fs.readFileSync(found.file), type: found.type, file: found.file,
            label: options.labels[index] || nameOfPicture(found.file) };
    });
    const name = options.name || nameOfPicture(sides[0].file) + "-vs-" + nameOfPicture(sides[1].file);
    deleteOldPictures();
    fs.mkdirSync(SCREENSHOTS_FOLDER, { recursive: true });
    const file = path.join(SCREENSHOTS_FOLDER, todayText() + "-" + name + ".png");
    const browser = await chrome.launchChrome();
    const run = chrome.startRun("screenshot");
    try {
        fs.writeFileSync(file, await sideBySide(browser, sides, (options.isScaleGiven) ? options.scale : 0));
    } finally {
        await browser.close();
        run.end();
    }
    console.log(path.relative(ROOT, file));
    if (run.hasOthers()) console.log(run.describeOthers());
    return 0;
};

// *** START:

const todayText = function () {
    const now = new Date();
    const twoDigits = function (number) { return String(number).padStart(2, "0"); };
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate());
};

const readOptions = function (args) {
    const options = { page: "", init: "", run: "", actions: [], clips: [], prints: [], name: "", before: "", width: DEFAULT_WIDTH,
        height: 0, scale: 0, wait: DEFAULT_WAIT, margin: DEFAULT_MARGIN, isNoPicture: false, isHelp: false, join: [], labels: [],
        isScaleGiven: false, og: "", waitFor: "" };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const hasValue = (args[i + 1] !== undefined && !args[i + 1].startsWith("--"));
        if (arg === "--help") options.isHelp = true;
        else if (arg === "--before") options.before = (hasValue) ? args[++i] : "HEAD";
        else if (arg === "--join") options.join = [args[++i], args[++i]];
        else if (arg === "--label") options.labels.push(args[++i]);
        else if (arg === "--init") options.init = args[++i];
        else if (arg === "--wait-for") options.waitFor = args[++i];
        else if (arg === "--run") options.run = args[++i];
        else if (arg === "--click") options.actions.push({ kind: "click", text: args[++i] });
        else if (arg === "--type") options.actions.push({ kind: "type", text: args[++i] });
        else if (arg === "--clip") options.clips.push(args[++i]);
        else if (arg === "--clip-text") options.clips.push({ text: args[++i] });
        else if (arg === "--print") options.prints.push(args[++i]);
        else if (arg === "--no-picture") options.isNoPicture = true;
        else if (arg === "--cut") options.isCut = true;
        else if (arg === "--name") options.name = args[++i];
        else if (arg === "--og") options.og = args[++i];
        else if (arg === "--live") options.isLive = true;
        else if (arg === "--width") options.width = Number(args[++i]);
        else if (arg === "--height") options.height = Number(args[++i]);
        else if (arg === "--scale") { options.scale = Number(args[++i]); options.isScaleGiven = true; }
        else if (arg === "--wait") options.wait = Number(args[++i]);
        else if (arg === "--margin") options.margin = Number(args[++i]);
        else options.page = chrome.toPagePath(arg);
    }
    if (options.og) Object.assign(options, { width: OG_SIZE.width, height: options.height || OG_SIZE.height, scale: 1 });
    if (!options.height) options.height = (options.width < PHONE_WIDTH) ? PHONE_HEIGHT : DEFAULT_HEIGHT;
    if (!options.scale) options.scale = (options.clips.length) ? 2 : 1;
    if (!options.name) options.name = path.basename(options.page.split(/[?#]/)[0]).replace(/\.html?$/i, "");
    return options;
};

const printLog = function (title, log) {
    log.forEach(function (line) { console.log("  " + title + line.text); });
};

const printValues = function (title, prints) {
    prints.forEach(function (line) { console.log(title + line); });
};

const main = async function () {
    const options = readOptions(process.argv.slice(2));
    if (options.join.length && !options.isHelp) return joinPictures(options);
    if (options.isHelp || !options.page) {
        console.log(chrome.helpText(__filename));
        return 0;
    }

    // WHY # too: a page of the catalog is index.htm#/text-field
    const pageFile = options.page.split(/[?#]/)[0];
    if (!fs.existsSync(path.join(ROOT, pageFile))) throw new Error("No such page: " + pageFile);
    // WHY no stop: a page that is not in the commit is served from the folder under the old path too (readOldFile), so
    //     its basic/ and comp/ are the ones of the commit: a page made to try a component shows its change
    const isPageInCommit = !options.before || isInCommit(options.before, pageFile);
    if (options.og && (options.before || options.clips.length)) throw new Error("--og is the first screen of the page now: not with --before or --clip");
    if (options.isLive && options.before) throw new Error("--live shows the page now: not with --before");

    deleteOldPictures();
    fs.mkdirSync(SCREENSHOTS_FOLDER, { recursive: true });

    const server = await chrome.startServer({ commit: options.before, listFolders: true });
    const browser = await chrome.launchChrome();
    // WHY --live: Live Server changes what it serves (its script), and a page can break only there
    const origin = (options.isLive) ? LIVE_SERVER : "http://127.0.0.1:" + server.address().port;
    // WHY --og into the repository: the link preview is a file of the site (assets/og-image.jpg)
    const file = (options.og) ? path.resolve(ROOT, options.og)
        : path.join(SCREENSHOTS_FOLDER, todayText() + "-" + options.name + ".png");
    let hasError = false;
    const run = chrome.startRun("screenshot");

    try {
        const after = await takePicture(browser, origin + "/" + options.page, options);
        let picture = after.picture;
        if (options.before) {
            const before = await takePicture(browser, origin + OLD_PATH + "/" + options.page, options);
            if (!options.isNoPicture) {
                const beforeLabel = (isPageInCommit) ? "before (" + options.before + ")" : "before (basic/, comp/ of " + options.before + ")";
                const sides = [{ picture: before.picture, label: beforeLabel }, { picture: after.picture, label: "after (now)" }];
                picture = await sideBySide(browser, sides, options.scale);
            }
            printLog("before: ", before.log);
            printValues("before: ", before.prints);
        }
        printLog((options.before) ? "after: " : "", after.log);
        printValues((options.before) ? "after: " : "", after.prints);
        hasError = after.log.some(function (line) { return line.isError; });
        if (!options.isNoPicture) fs.writeFileSync(file, picture);
    } finally {
        await browser.close();
        server.close();
        run.end();
    }

    if (!options.isNoPicture) console.log(path.relative(ROOT, file));
    if (run.hasOthers()) console.log(run.describeOthers());
    return (hasError) ? 1 : 0;
};

main().then(function (exitCode) {
    process.exitCode = exitCode;
}).catch(function (error) {
    console.error(error.message);
    process.exitCode = 2;
});
