/* Bismillah */

/*
CHROME TOOLS: the parts the Node tools of test/ share (compare-pages.js, focus-rings.js, run-tests.js, screenshot.js):
the server of the repository (and of an old commit), git, puppeteer and Chrome, the list of the samples, and the runs
of the tools (a tool says when another one runs at the same time).

    const chrome = require("./_chrome.js");
    const server = await chrome.startServer({ commit: "HEAD", listFolders: true, pages: { "/__x__.htm": html } });
    const browser = await chrome.launchChrome();          // { scrollBars: true }: bars that take room
    const run = chrome.startRun("screenshot");   // ... run.noteOthers() on the way; run.end() in a finally
*/

"use strict";

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SAMPLES_FOLDER = "02-comp-examples";
const CHROME_FILE = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OLD_PATH = "/__old__"; // the server gives the files of the old commit under this path
const LISTEN_BACKLOG = 511; // WHY: a page asks for many files at once; a small backlog drops connections
const MAX_FILE_SIZE = 100 * 1024 * 1024; // bytes: the biggest file read from git

const MIME_TYPES = {
    ".htm": "text/html",
    ".html": "text/html",
    ".js": "text/javascript",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
};

// *** GIT:

const runGit = function (args) {
    return execFileSync("git", args, { cwd: ROOT, stdio: ["ignore", "pipe", "ignore"], maxBuffer: MAX_FILE_SIZE });
};

const readGitLines = function (args) {
    return runGit(args).toString().split("\n").filter(Boolean);
};

const isInCommit = function (commit, relativePath) {
    try {
        runGit(["cat-file", "-e", commit + ":./" + relativePath]);
        return true;
    } catch (error) {
        return false;
    }
};

// WHY the folder when git has no such file: a gitignored picture is the same in both.
const readOldFile = function (commit, relativePath) {
    if (isInCommit(commit, relativePath)) return runGit(["show", commit + ":./" + relativePath]);
    return fs.readFileSync(path.join(ROOT, relativePath));
};

// *** THE PAGES:

const listSamples = function () {
    return fs.readdirSync(path.join(ROOT, SAMPLES_FOLDER))
        .filter(function (name) { return name.endsWith(".htm"); })
        .sort()
        .map(function (name) { return SAMPLES_FOLDER + "/" + name; });
};

// A name of a sample ("tabs.htm") or a path from the root ("04-templates/web-forms/order-form.htm")
const toPagePath = function (name) {
    // WHY the file without its ?query / #hash: index.htm?lang=tr is a page of the root too (it was looked for in
    //     02-comp-examples)
    const file = name.split(/[?#]/)[0];
    if (file.includes("/") || fs.existsSync(path.join(ROOT, file))) return name;
    return SAMPLES_FOLDER + "/" + name;
};

// The folder page of Live Server: basic.js Designer reads the links with a title and the icon-directory class.
const folderListing = function (folderPath) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true }).filter(function (entry) {
        return entry.name.charAt(0) !== ".";
    });
    const links = entries.map(function (entry) {
        const kind = (entry.isDirectory()) ? "icon-directory" : "icon-file";
        const href = encodeURIComponent(entry.name) + ((entry.isDirectory()) ? "/" : "");
        return '<a href="' + href + '" title="' + entry.name + '" class="icon ' + kind + '">' + entry.name + "</a>";
    });
    return "<!DOCTYPE html><title>listing directory</title>\n" + links.join("\n");
};

// *** THE SERVER:

// path: /comp/tabs.js is the file in the folder, /__old__/comp/tabs.js the file in the commit.
// pages: { "/path.htm": html } made by the tool; listFolders: a folder answers with its list, as in Live Server.
const startServer = function ({ commit = "", pages = {}, listFolders = false } = {}) {
    const oldFiles = new Map();

    const answer = function (response, data, extension) {
        response.writeHead(200, {
            "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
            "Cache-Control": "no-store",
        });
        response.end(data);
    };

    const server = http.createServer(function (request, response) {
        try {
            const urlPath = decodeURIComponent(request.url.split("?")[0]);
            if (pages[urlPath] !== undefined) {
                answer(response, pages[urlPath], ".htm");
                return;
            }
            const isOld = (commit !== "" && urlPath.startsWith(OLD_PATH + "/"));
            const relativePath = path.normalize((isOld) ? urlPath.slice(OLD_PATH.length + 1) : urlPath.slice(1));
            if (relativePath.startsWith("..")) throw new Error("out of the repository");

            const fullPath = path.join(ROOT, relativePath);
            if (listFolders && fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
                answer(response, folderListing(fullPath), ".htm");
                return;
            }
            if (!isOld) {
                answer(response, fs.readFileSync(fullPath), path.extname(relativePath));
                return;
            }
            if (!oldFiles.has(relativePath)) oldFiles.set(relativePath, readOldFile(commit, relativePath));
            answer(response, oldFiles.get(relativePath), path.extname(relativePath));
        } catch (error) {
            response.writeHead(404);
            response.end();
        }
    });

    return new Promise(function (resolve) {
        server.listen(0, "127.0.0.1", LISTEN_BACKLOG, function () { resolve(server); });
    });
};

// *** CHROME:

const loadPuppeteer = function () {
    const places = ["puppeteer-core", path.join(ROOT, "__video/node_modules/puppeteer-core")];
    for (const place of places) {
        try {
            return require(place);
        } catch (error) {
            // WHY no error yet: the next place may have it.
        }
    }
    throw new Error("puppeteer-core is not found. Install it: npm install puppeteer-core");
};

// scrollBars: a scroll bar takes room, as in WebKit with "Show scroll bars: Always" (a mouse on a Mac) and on Windows.
// WHY: puppeteer hides the bars of headless Chrome (--hide-scrollbars) and on a Mac they lie over the content, so a box
//      that a bar makes narrower was never tested: a JsonEditor changed its size again in the same frame there
//      ("ResizeObserver loop completed with undelivered notifications") and every test passed. A box of basic.js keeps
//      its bar of 0 px (basic.css), as in WebKit.
const SCROLL_BAR_ARGS = ["--disable-features=OverlayScrollbar"];

const launchChrome = function ({ scrollBars = false } = {}) {
    const options = { headless: "new", executablePath: CHROME_FILE, args: ["--no-sandbox"] };
    if (scrollBars) {
        options.args = options.args.concat(SCROLL_BAR_ARGS);
        options.ignoreDefaultArgs = ["--hide-scrollbars"];
    }
    return loadPuppeteer().launch(options);
};

const sleep = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
};

// --wait-for of the tools: a page that loads in parts (basic.js Designer and the page in its iframe) is ready when this
// JavaScript is true. An error of it is "not yet" (a thing that is not made yet). false: still not true after timeout ms.
const WAIT_FOR_INTERVAL = 100; // ms: how often it is asked
const waitUntilTrue = async function (page, expression, timeout) {
    const isTrue = "(function () { try { return !!(" + expression + "); } catch (error) { return false; } })()";
    try {
        await page.waitForFunction(isTrue, { timeout: timeout, polling: WAIT_FOR_INTERVAL });
        return true;
    } catch (error) {
        if (error.name === "TimeoutError") return false;
        throw error;
    }
};

// A page of the checks never opens a program of the computer. WHY: compare-pages pressed every button of the panel of
//     04-templates, and every "Send an e-mail" (location.href = "mailto:...") opened a draft in Mail. A navigation to
//     such an address is cancelled (the Navigation API sees location.href, a link and a form), a link of one is not
//     followed, and window.open of one does nothing. It runs in the page, before its scripts.
const blockOuterLinks = function () {
    const isOuter = function (url) {
        const text = String(url || "");
        return /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^(https?|about|blob|data|javascript|file):/i.test(text);
    };
    if (window.navigation) {
        window.navigation.addEventListener("navigate", function (event) {
            if (isOuter(event.destination.url)) event.preventDefault();
        });
    }
    document.addEventListener("click", function (event) {
        const link = (event.target && event.target.closest) ? event.target.closest("a[href]") : null;
        if (link && isOuter(link.getAttribute("href"))) event.preventDefault();
    }, true);
    const realOpen = window.open;
    window.open = function (url) {
        if (isOuter(url)) return null;
        return realOpen.apply(window, arguments);
    };
};

// An error event of the window that is not an exception goes to the console ("ERROR EVENT ..."), where the tools read it.
// WHY: "ResizeObserver loop completed with undelivered notifications" is such an event: puppeteer gives no "pageerror"
//      for it and the console does not show it, so no tool saw it. An exception is not written again (its "pageerror"
//      says it); a message once in a page (a loop says it at every frame). console.info, not error: the test pages
//      count a console.error as an error of a component, and components-test leaves the loop out on purpose (a
//      notice of the browser). It runs in the page, before its scripts.
const reportErrorEvents = function () {
    const reported = new Set();
    window.addEventListener("error", function (event) {
        if (event.error || reported.has(event.message)) return;
        reported.add(event.message);
        console.info("ERROR EVENT " + event.message);
    });
};

// Every page a tool opens: await chrome.guardPage(page) before its goto().
const guardPage = function (page) {
    return Promise.all([page.evaluateOnNewDocument(blockOuterLinks), page.evaluateOnNewDocument(reportErrorEvents)]);
};

// The header comment of a tool, for its --help.
const helpText = function (toolFile) {
    const header = fs.readFileSync(toolFile, "utf8").split("*/")[1];
    return header.replace("/*", "").trim();
};

// *** THE RUNS OF THE TOOLS: a tool that opens Chrome says when another one runs at the same time.
// WHY: two browsers side by side change the timing (a test fails, a picture is taken in a motion, compare-pages finds
//      false differences), and the sessions of one folder run the tools at the same time.

const RUNS_FOLDER = path.join(os.tmpdir(), "basicjs-tool-runs"); // 4242.json while the run 4242 runs: { pid, tool, since }
const TOLD_PART = ".told-by-"; // 4242.told-by-4343.json: the run 4343 told the run 4242 that it runs too

const twoDigits = function (number) {
    return String(number).padStart(2, "0");
};

const isRunning = function (pid) {
    try {
        process.kill(pid, 0); // WHY 0: it only asks whether the process is there
        return true;
    } catch (error) {
        return error.code === "EPERM"; // it is there, but of another user
    }
};

const readJson = function (file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        return null; // it is gone, or it is being written
    }
};

const listRunFiles = function () {
    try {
        return fs.readdirSync(RUNS_FOLDER);
    } catch (error) {
        return [];
    }
};

// A run that lives now, from its file (null: it is gone). The files of a run that ended without end() (stopped with
// Ctrl + C) are deleted: its own file and the files that told it of others.
const readLivingRun = function (name) {
    const file = path.join(RUNS_FOLDER, name);
    const pid = Number(name.split(".")[0]);
    if (isRunning(pid)) return name.includes(TOLD_PART) ? null : readJson(file);
    fs.rmSync(file, { force: true });
    return null;
};

const findLivingRuns = function () {
    return listRunFiles().map(readLivingRun).filter(Boolean);
};

// A run of a tool, from its start to end(): it looks for the other runs (noteOthers: at the start, on the way and in
// end()) and tells them that it runs too, so a short run that started first knows of a later one at its end.
//     const run = chrome.startRun("screenshot");
//     try { ... run.noteOthers() before a page ... } finally { run.end(); }
//     if (run.hasOthers()) console.log(run.describeOthers());
const startRun = function (tool) {
    const now = new Date();
    const self = { pid: process.pid, tool: tool, since: twoDigits(now.getHours()) + ":" + twoDigits(now.getMinutes()) };
    const ownFile = path.join(RUNS_FOLDER, process.pid + ".json");
    const toldStart = process.pid + TOLD_PART;
    const others = new Map();
    fs.mkdirSync(RUNS_FOLDER, { recursive: true });
    fs.writeFileSync(ownFile, JSON.stringify(self));

    const tell = function (run) {
        fs.writeFileSync(path.join(RUNS_FOLDER, run.pid + TOLD_PART + process.pid + ".json"), JSON.stringify(self));
    };

    const noteOthers = function () {
        findLivingRuns().forEach(function (run) {
            if (run.pid === process.pid) return;
            others.set(run.pid, run);
            tell(run);
        });
        listRunFiles().filter(function (name) { return name.startsWith(toldStart); }).forEach(function (name) {
            const run = readJson(path.join(RUNS_FOLDER, name));
            if (run) others.set(run.pid, run);
        });
    };

    const end = function () {
        noteOthers();
        fs.rmSync(ownFile, { force: true });
        listRunFiles().filter(function (name) { return name.startsWith(toldStart); }).forEach(function (name) {
            fs.rmSync(path.join(RUNS_FOLDER, name), { force: true });
        });
    };

    const describeOthers = function () {
        const list = [...others.values()].map(function (run) {
            return run.tool + " (pid " + run.pid + ", since " + run.since + ")";
        }).join(", ");
        return "NOTE: another tool with Chrome runs in this time too: " + list + ". Two browsers side by side change "
            + "the timing: run again alone what failed or differs.";
    };

    noteOthers();
    return { noteOthers, end, describeOthers, hasOthers: function () { return others.size > 0; } };
};

module.exports = {
    ROOT, SAMPLES_FOLDER, OLD_PATH,
    runGit, readGitLines, isInCommit,
    listSamples, toPagePath, startServer, launchChrome, guardPage, sleep, waitUntilTrue, helpText, startRun,
};
