"use strict";

// Opens the project in Chrome at a phone width and a desktop width, and reports what a person would see is wrong:
// errors, files that were not found, things that leave the screen, things cut by their parent.
// It needs Node.js and Chrome or Edge: nothing to install.
//   node _basic/tools/check.js            the project
//   node _basic/tools/check.js --dist     the ready copy in dist/
//
// It writes a picture of each view to .check/, so a person or an AI tool can look at the page.
// An app with more than one view tells it how to open them (the name of the file is the name of the view):
//   window.checkViews = { orders: function () { App.showPage("orders"); }, settings: function () { App.showPage("settings"); } };
//
// Every page is checked, also the ones in folders. A page that can not be checked alone says so, and the report counts
// it as skipped:
//   <meta name="basic-check" content="skip">
//
// Exit code: 0 no problem, 1 problems found, 2 could not run.

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const USE_DIST = process.argv.includes("--dist");
const SERVED_FOLDER = USE_DIST ? path.join(ROOT, "dist") : ROOT;
const PICTURES = path.join(ROOT, ".check");
const WIDTHS = [390, 1200];
const WINDOW_HEIGHT = 800;
const SMALLEST_WINDOW = 520; // WHY: headless Chrome does not go under 500 px, so a phone width is a frame in the window.
const WAIT_FOR_PAGE_MS = 6000;
const STOP_CHROME_MS = 25000;
const MAX_PROBLEMS_SHOWN = 8;
const NOT_PAGE_FOLDERS = new Set(["_basic", "dist", "node_modules", ".git", ".check"]);
const TYPES = { ".htm": "text/html", ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp", ".ttf": "font/ttf", ".woff2": "font/woff2" };

// *** THE CODE THAT RUNS IN THE PAGE (before the scripts of the page)
const PAGE_CHECK = function () {
    const query = new URLSearchParams(location.search);
    const viewName = query.get("__view") || "";
    const report = { view: viewName, errors: [], offScreen: [], cut: [], views: [] };
    const addOnce = (list, text) => { if (!list.includes(text)) list.push(text); };

    window.addEventListener("error", function (event) {
        if (event.target && event.target !== window) return; // A file: the server sees it
        addOnce(report.errors, "Error: " + event.message);
    }, true);
    window.addEventListener("unhandledrejection", (event) => addOnce(report.errors, "Error: " + (event.reason && event.reason.message || event.reason)));
    ["error", "warn"].forEach(function (level) {
        const write = console[level];
        console[level] = function (...args) {
            addOnce(report.errors, "Console " + level + ": " + args.join(" ").slice(0, 160));
            write.apply(console, args);
        };
    });

    const nameOf = function (elem) {
        const text = (elem.textContent || elem.placeholder || elem.getAttribute("aria-label") || "").trim();
        return text ? '"' + text.slice(0, 24) + '"' : "<" + elem.tagName.toLowerCase() + ">";
    };

    const isSeen = function (elem, rect) {
        if (rect.width < 1 || rect.height < 1) return false;
        for (let item = elem; item && item.nodeType === 1; item = item.parentElement) {
            const style = getComputedStyle(item);
            if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) return false;
        }
        return true;
    };

    // WHY not pictures: a photo cut by a card or a picture that leaves the edge is often the design.
    const isThing = function (elem) {
        if (/^(INPUT|TEXTAREA|BUTTON|SELECT)$/.test(elem.tagName)) return true;
        if (elem.hasAttribute("role") || elem.hasAttribute("tabindex")) return true;
        const isOwnPointer = (getComputedStyle(elem).cursor === "pointer" && getComputedStyle(elem.parentElement).cursor !== "pointer");
        if (isOwnPointer) return true; // A control without a text: a toggle
        if (elem.tagName === "IMG" || elem.tagName === "CANVAS") return false;
        return elem.childElementCount === 0 && elem.textContent.trim() !== "";
    };

    const scrollsOn = function (elem, axis) {
        for (let item = elem.parentElement; item; item = item.parentElement) {
            if (/auto|scroll/.test(getComputedStyle(item)[axis])) return true;
        }
        return false;
    };

    const checkCut = function (elem, rect) {
        const hasEllipsis = (getComputedStyle(elem).textOverflow === "ellipsis");
        for (let item = elem.parentElement; item && item !== document.documentElement; item = item.parentElement) {
            const style = getComputedStyle(item);
            if (/auto|scroll/.test(style.overflowY + style.overflowX)) return;
            if (style.overflowX === "visible" && style.overflowY === "visible") continue;
            const box = item.getBoundingClientRect();
            if (box.width < 2 || box.height < 2) continue;
            const isOutside = (rect.right <= box.left || rect.left >= box.right || rect.bottom <= box.top || rect.top >= box.bottom);
            if (isOutside) return; // A closed part: a panel that slides, a tab that is not shown
            const isCut = (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1);
            if (isCut && !hasEllipsis) {
                addOnce(report.cut, nameOf(elem) + " is " + Math.round(rect.width) + " x " + Math.round(rect.height) + ", its parent cuts it at " + Math.round(box.width) + " x " + Math.round(box.height));
                return;
            }
        }
    };

    // WHY every object, not only texts and controls: a Toggle has none of these marks. A panel that slides is placed by
    // hand; a thing in the flow of a group that is outside the group was pushed out, and nobody can see it.
    const checkPushedOut = function (elem) {
        const parent = elem.parentElement;
        if (!parent) return;
        const parentStyle = getComputedStyle(parent);
        if (!/flex/.test(parentStyle.display) || parentStyle.overflowX === "visible" || /auto|scroll/.test(parentStyle.overflowX + parentStyle.overflowY)) return;
        if (!/static|relative/.test(getComputedStyle(elem).position)) return;
        const rect = elem.getBoundingClientRect();
        const box = parent.getBoundingClientRect();
        const wantedWidth = parseFloat(elem.style.width);
        if (wantedWidth >= 8 && rect.width < 1 && getComputedStyle(elem).display !== "none" && box.width >= 2) {
            addOnce(report.cut, nameOf(elem) + " wants " + wantedWidth + " px, but its neighbours squeezed it to 0: nobody can see it");
        }
        if (rect.width < 8 || rect.height < 8 || box.width < 2 || box.height < 2 || !isSeen(elem, rect)) return;
        if (rect.left >= box.right || rect.right <= box.left || rect.top >= box.bottom || rect.bottom <= box.top) {
            addOnce(report.cut, nameOf(elem) + " is pushed out of its group: nobody can see it (" + Math.round(rect.left) + ", " + Math.round(rect.top) + ")");
        }
    };

    const checkLayout = function () {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        document.querySelectorAll("body *").forEach(function (elem) {
            checkPushedOut(elem);
            if (!isThing(elem)) return;
            const rect = elem.getBoundingClientRect();
            if (!isSeen(elem, rect)) return;
            // WHY rect.right > 0: a thing all the way out at the left is put there to hide it.
            const isOutX = (rect.right > screenWidth + 1 || (rect.left < -1 && rect.right > 0)) && !scrollsOn(elem, "overflowX");
            const isOutY = (rect.top > screenHeight + 1) && !scrollsOn(elem, "overflowY");
            if (isOutX || isOutY) addOnce(report.offScreen, nameOf(elem) + " leaves the screen (" + Math.round(rect.left) + ", " + Math.round(rect.top) + ")");
            else checkCut(elem, rect);
        });
    };

    const send = function () {
        report.views = Object.keys(window.checkViews || {});
        const request = new XMLHttpRequest();
        request.open("POST", "/__report", false);
        request.send(JSON.stringify(report));
    };

    window.addEventListener("load", function () {
        setTimeout(async function () {
            try {
                if (viewName) await window.checkViews[viewName]();
            } catch (error) {
                addOnce(report.errors, "Error in checkViews." + viewName + ": " + error.message);
            }
            setTimeout(function () {
                checkLayout();
                send();
            }, 900);
        }, 900);
    });
};

const frameOf = function (pageName, width, viewName) {
    const address = "/" + encodeURI(pageName) + "?__view=" + encodeURIComponent(viewName);
    return '<!DOCTYPE html><html><body style="margin:0;background:#fff"><iframe src="' + address + '" style="display:block;width:' + width + "px;height:" + WINDOW_HEIGHT + 'px;border:0"></iframe></body></html>';
};

// *** THE SERVER
const missingFiles = new Set();
let lastReport = null;

const answerFile = function (urlPath, response) {
    const file = path.join(SERVED_FOLDER, decodeURIComponent(urlPath));
    if (!file.startsWith(SERVED_FOLDER) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (!/favicon/.test(urlPath)) missingFiles.add(urlPath);
        response.writeHead(404);
        response.end();
        return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
    if (/\.html?$/i.test(file)) {
        const html = fs.readFileSync(file, "utf8").replace(/<head[^>]*>/i, (head) => head + '<script src="/__check.js"></script>');
        response.writeHead(200, { "Content-Type": type });
        response.end(html);
        return;
    }
    response.writeHead(200, { "Content-Type": type });
    fs.createReadStream(file).pipe(response);
};

const server = http.createServer(function (request, response) {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/__check.js") {
        response.writeHead(200, { "Content-Type": "text/javascript" });
        response.end("(" + PAGE_CHECK.toString() + ")();");
        return;
    }
    if (url.pathname === "/__frame") {
        response.writeHead(200, { "Content-Type": "text/html" });
        response.end(frameOf(url.searchParams.get("page"), url.searchParams.get("width"), url.searchParams.get("view") || ""));
        return;
    }
    if (url.pathname === "/__report") {
        let body = "";
        request.on("data", (part) => { body += part; });
        request.on("end", function () {
            lastReport = JSON.parse(body);
            response.writeHead(200);
            response.end();
        });
        return;
    }
    answerFile(url.pathname, response);
});

// *** CHROME
const findBrowser = function () {
    const programs = [process.env.PROGRAMFILES, process.env["PROGRAMFILES(X86)"], process.env.LOCALAPPDATA].filter(Boolean);
    const places = [
        process.env.CHROME_PATH,
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/microsoft-edge",
    ];
    programs.forEach(function (folder) {
        places.push(path.join(folder, "Google", "Chrome", "Application", "chrome.exe"));
        places.push(path.join(folder, "Microsoft", "Edge", "Application", "msedge.exe"));
    });
    return places.find((place) => place && fs.existsSync(place)) || null;
};

const openInBrowser = function (browser, profile, address, picture, width) {
    return new Promise(function (resolve) {
        const windowWidth = Math.max(width, SMALLEST_WINDOW);
        const child = spawn(browser, [
            "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run", "--no-default-browser-check",
            "--user-data-dir=" + profile, "--window-size=" + windowWidth + "," + WINDOW_HEIGHT,
            "--virtual-time-budget=" + WAIT_FOR_PAGE_MS, "--screenshot=" + picture, address,
        ], { stdio: "ignore" });
        const timer = setTimeout(() => child.kill(), STOP_CHROME_MS);
        child.on("close", function () {
            clearTimeout(timer);
            resolve();
        });
        child.on("error", resolve);
    });
};

const printList = function (title, list) {
    if (!list.length) return;
    console.log("  " + title + " (" + list.length + "):");
    list.slice(0, MAX_PROBLEMS_SHOWN).forEach((item) => console.log("    - " + item));
    if (list.length > MAX_PROBLEMS_SHOWN) console.log("    ... and " + (list.length - MAX_PROBLEMS_SHOWN) + " more");
};

const checkOne = async function (browser, profile, port, pageName, width, viewName) {
    lastReport = null;
    missingFiles.clear();
    const pagePart = pageName.replace(/\.html?$/i, "").replace(/[\\/]/g, "-");
    const picture = path.join(PICTURES, pagePart + "-" + width + "-" + (viewName || "start") + ".png");
    const address = "http://127.0.0.1:" + port + "/__frame?page=" + encodeURIComponent(pageName) + "&width=" + width + "&view=" + encodeURIComponent(viewName);
    await openInBrowser(browser, profile, address, picture, width);
    const report = lastReport || { errors: ["The page did not finish: it may have stopped with an error."], offScreen: [], cut: [], views: [] };
    const missing = Array.from(missingFiles);
    const count = report.errors.length + report.offScreen.length + report.cut.length + missing.length;
    console.log((count ? "PROBLEM " : "ok      ") + width + " px, " + (viewName || "start") + "   picture: .check/" + path.basename(picture));
    printList("Errors", report.errors);
    printList("Files not found", missing);
    printList("Leaves the screen", report.offScreen);
    printList("Cut by its parent", report.cut);
    return { count: count, views: report.views };
};

// Every page of the project, also the ones in folders. The start page comes first.
const findPages = function (folder = "") {
    const pages = [];
    fs.readdirSync(path.join(SERVED_FOLDER, folder), { withFileTypes: true }).forEach(function (entry) {
        const relativePath = folder ? folder + "/" + entry.name : entry.name;
        if (entry.isDirectory()) {
            if (!NOT_PAGE_FOLDERS.has(entry.name)) pages.push(...findPages(relativePath));
        } else if (/\.html?$/i.test(entry.name)) {
            pages.push(relativePath);
        }
    });
    pages.sort((a, b) => Number(/^index\./i.test(b)) - Number(/^index\./i.test(a)));
    return pages;
};

const run = async function () {
    const browser = findBrowser();
    if (!browser) {
        console.log("Chrome or Edge was not found, so the page was not checked. Set CHROME_PATH to its file.");
        return 2;
    }
    if (!fs.existsSync(SERVED_FOLDER)) {
        console.log("dist/ does not exist. Run: node _basic/tools/build.js");
        return 2;
    }
    const allPages = findPages();
    const isSkipped = (pageName) => /<meta\s+name=["']basic-check["']\s+content=["']skip["']/i.test(fs.readFileSync(path.join(SERVED_FOLDER, pageName), "utf8"));
    const pages = allPages.filter((pageName) => !isSkipped(pageName));
    if (!pages.length) {
        console.log("There is no .htm page.");
        return 2;
    }
    fs.rmSync(PICTURES, { recursive: true, force: true });
    fs.mkdirSync(PICTURES, { recursive: true });
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), "basic-check-"));
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    let problems = 0;
    for (const pageName of pages) {
        if (pages.length > 1) console.log("\n" + pageName);
        for (const width of WIDTHS) {
            const first = await checkOne(browser, profile, port, pageName, width, "");
            problems += first.count;
            for (const viewName of first.views) {
                problems += (await checkOne(browser, profile, port, pageName, width, viewName)).count;
            }
        }
    }
    server.close();
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
    if (allPages.length > pages.length) console.log((allPages.length - pages.length) + " page(s) skipped by their basic-check tag.");
    console.log(problems ? problems + " problem(s). Look at the pictures in .check/ too." : "No problem found. Look at the pictures in .check/ too: this check can not judge the design.");
    return problems ? 1 : 0;
};

run().then((code) => process.exit(code), function (error) {
    console.error(error.message);
    process.exit(2);
});
