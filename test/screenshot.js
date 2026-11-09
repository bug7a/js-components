/* Bismillah */

/*
SCREENSHOT: one picture of a page (or of a part of it) for a report, in one command.

    node test/screenshot.js tabs.htm                         a sample at 1280 px (a name alone is in 02-comp-examples)
    node test/screenshot.js tabs.htm --width 390             at the width of a phone
    node test/screenshot.js "index.htm#/text-field"           a page with a #hash (or a ?query)
    node test/screenshot.js _basic-designer/index.htm --run "BasicDesigner.openFolderDialog()" --clip "[role=dialog]"
    node test/screenshot.js tabs.htm --before                the page of the last commit left, the page now right
    node test/screenshot.js tabs.htm --before HEAD~2 --name tabs-fix
    node test/screenshot.js stepper.htm --print "document.title" --print "page.width" --no-picture
    node test/screenshot.js item-list.htm --clip-text 'styleName: "light"' --clip-text 'styleName: "dark" ·'
                                                             the two cards with these titles (lower on the page too)
    node test/screenshot.js "03-webpages/webpage-handbook/index.htm#/box" --click "Run" --click "Copy"
    node test/screenshot.js "03-webpages/webpage-handbook/index.htm#/using-components" --click "Run" \
        --click "Your name" --type "Ada" --click "Save"     (the example runs in an iframe: it is searched too)
    node test/screenshot.js 04-templates/ozden-panel/index.htm --init "localStorage.setItem('appid_login', '{}')" \
        --run "openPageByKey('Reports')"                    (a page of the panel: it opens after its login)

Options:
    --init "code"     runs before the scripts of the page, in the page of --before too: a login that the page keeps
                      in localStorage
    --run "code"      runs in the page after it is loaded (await works): open a menu, a dialog, a state
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
    --before [commit] before | after in one picture, with labels (HEAD by default)
    --name what       the file: _screenshots/YYYY-MM-DD-what.png (the name of the page by default)
    --width, --height the window (1280 x 800; a width under 500 is 844 high)
    --scale n         pixels per px (2 for a part, 1 for the whole window)
    --wait ms         after the load, after --run and after each --click and --type (600)
    --print "expr"    writes the value of a JavaScript expression of the page in the terminal, after --run (await
                      works; more than one --print: each one): a check without reading a picture
    --no-picture      only the --print values and the errors: no picture is saved

It prints the file, and the errors of the page (exit code 1 when the page throws, or --clip or --click finds nothing).
When another tool with Chrome runs at the same time (another session), it says so at the end (a NOTE).
The pictures older than 48 hours in _screenshots/ are deleted first (never readme.md).
The server lists a folder as Live Server does, so the Open Folder of basic designer works in it.
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
        if (message.type() !== "error" && message.type() !== "warn") return;
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
        if (options.isNoPicture) return { picture: null, log, prints };
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

// *** BEFORE | AFTER: the two pictures side by side, drawn by the browser itself (no image library).

const SIDE_GAP = 16; // px between the pictures
const LABEL_HEIGHT = 28; // px

const sideBySide = async function (browser, before, after, beforeLabel, scale) {
    const context = await browser.createBrowserContext();
    try {
        const page = await context.newPage();
        await chrome.guardPage(page);
        const half = function (picture, label) {
            const source = "data:image/png;base64," + Buffer.from(picture).toString("base64");
            return '<div class="side"><div class="label">' + label + '</div><img src="' + source + '"></div>';
        };
        const html = "<!DOCTYPE html><style>" +
            "body { margin: 0; background: #E9E9EC; font: 13px -apple-system, sans-serif; color: #333; }" +
            "#all { display: inline-flex; gap: " + SIDE_GAP + "px; padding: " + SIDE_GAP + "px; align-items: flex-start; }" +
            ".label { height: " + LABEL_HEIGHT + "px; font-weight: 600; }" +
            "img { display: block; zoom: " + (1 / scale) + "; }" +
            "</style><div id=\"all\">" + half(before, beforeLabel) + half(after, "after (now)") + "</div>";
        await page.setViewport({ width: 4000, height: 3000, deviceScaleFactor: scale });
        await page.setContent(html, { waitUntil: "load" });
        const all = await page.$("#all");
        return await all.screenshot();
    } finally {
        await context.close();
    }
};

// *** START:

const todayText = function () {
    const now = new Date();
    const twoDigits = function (number) { return String(number).padStart(2, "0"); };
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate());
};

const readOptions = function (args) {
    const options = { page: "", init: "", run: "", actions: [], clips: [], prints: [], name: "", before: "", width: DEFAULT_WIDTH,
        height: 0, scale: 0, wait: DEFAULT_WAIT, margin: DEFAULT_MARGIN, isNoPicture: false, isHelp: false };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const hasValue = (args[i + 1] !== undefined && !args[i + 1].startsWith("--"));
        if (arg === "--help") options.isHelp = true;
        else if (arg === "--before") options.before = (hasValue) ? args[++i] : "HEAD";
        else if (arg === "--init") options.init = args[++i];
        else if (arg === "--run") options.run = args[++i];
        else if (arg === "--click") options.actions.push({ kind: "click", text: args[++i] });
        else if (arg === "--type") options.actions.push({ kind: "type", text: args[++i] });
        else if (arg === "--clip") options.clips.push(args[++i]);
        else if (arg === "--clip-text") options.clips.push({ text: args[++i] });
        else if (arg === "--print") options.prints.push(args[++i]);
        else if (arg === "--no-picture") options.isNoPicture = true;
        else if (arg === "--name") options.name = args[++i];
        else if (arg === "--width") options.width = Number(args[++i]);
        else if (arg === "--height") options.height = Number(args[++i]);
        else if (arg === "--scale") options.scale = Number(args[++i]);
        else if (arg === "--wait") options.wait = Number(args[++i]);
        else if (arg === "--margin") options.margin = Number(args[++i]);
        else options.page = chrome.toPagePath(arg);
    }
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
    if (options.isHelp || !options.page) {
        console.log(chrome.helpText(__filename));
        return 0;
    }

    // WHY # too: a page of the catalog is index.htm#/text-field
    const pageFile = options.page.split(/[?#]/)[0];
    if (!fs.existsSync(path.join(ROOT, pageFile))) throw new Error("No such page: " + pageFile);
    if (options.before && !isInCommit(options.before, pageFile)) throw new Error(pageFile + " is not in " + options.before);

    deleteOldPictures();
    fs.mkdirSync(SCREENSHOTS_FOLDER, { recursive: true });

    const server = await chrome.startServer({ commit: options.before, listFolders: true });
    const browser = await chrome.launchChrome();
    const origin = "http://127.0.0.1:" + server.address().port;
    const file = path.join(SCREENSHOTS_FOLDER, todayText() + "-" + options.name + ".png");
    let hasError = false;
    const run = chrome.startRun("screenshot");

    try {
        const after = await takePicture(browser, origin + "/" + options.page, options);
        let picture = after.picture;
        if (options.before) {
            const before = await takePicture(browser, origin + OLD_PATH + "/" + options.page, options);
            if (!options.isNoPicture) {
                picture = await sideBySide(browser, before.picture, after.picture, "before (" + options.before + ")", options.scale);
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
