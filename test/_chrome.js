/* Bismillah */

/*
CHROME TOOLS: the parts the Node tools of test/ share (compare-pages.js, focus-rings.js, screenshot.js):
the server of the repository (and of an old commit), git, puppeteer and Chrome, the list of the samples.

    const chrome = require("./_chrome.js");
    const server = await chrome.startServer({ commit: "HEAD", listFolders: true, pages: { "/__x__.htm": html } });
    const browser = await chrome.launchChrome();
*/

"use strict";

const http = require("http");
const fs = require("fs");
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
    if (name.includes("/") || fs.existsSync(path.join(ROOT, name))) return name;
    return SAMPLES_FOLDER + "/" + name;
};

// The folder page of Live Server: basic designer reads the links with a title and the icon-directory class.
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

const launchChrome = function () {
    return loadPuppeteer().launch({ headless: "new", executablePath: CHROME_FILE, args: ["--no-sandbox"] });
};

const sleep = function (ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
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

// Every page a tool opens: await chrome.guardPage(page) before its goto().
const guardPage = function (page) {
    return page.evaluateOnNewDocument(blockOuterLinks);
};

// The header comment of a tool, for its --help.
const helpText = function (toolFile) {
    const header = fs.readFileSync(toolFile, "utf8").split("*/")[1];
    return header.replace("/*", "").trim();
};

module.exports = {
    ROOT, SAMPLES_FOLDER, OLD_PATH,
    runGit, readGitLines, isInCommit,
    listSamples, toPagePath, startServer, launchChrome, guardPage, sleep, helpText,
};
