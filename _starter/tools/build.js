"use strict";

// Makes the ready copy of the project in dist/. It needs only Node.js: no install and no internet.
//   node _basic/tools/build.js
//
// - The pages load basic/basic.min.js and comp/components.min.js (only the components they use, in the same order).
// - dist/ does not need _basic/: everything it uses is copied, and the paths are rewritten.
// - The page index.htm becomes index.html: servers and app tools look for that name.
// - dist/ is made from scratch every time, so do not change files in it.
// - At the end it checks dist/ in Chrome, when there is one (check.js). --no-check: it does not.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const BASIC = path.join(ROOT, "_basic");
const DIST = path.join(ROOT, "dist");
const NOT_COPIED = new Set(["_basic", "dist", "node_modules", ".git", ".github", ".vscode", ".claude", ".check", ".gitignore", ".DS_Store", "_starter.txt"]);
const TEXT_FILE = /\.(js|mjs|css|htm|html|json|svg|webmanifest)$/i;
const MARK_FILE = ".nojekyll"; // WHY: GitHub Pages does not publish some folders without it. It also marks a folder made here.
const BUNDLE_NAME = "comp/components.min.js";
const SCRIPT_TAG = /[ \t]*<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>[ \t]*\r?\n?/gi;
const LIBRARY_FILES = {
    "_basic/basic/basic.js": "basic/basic.min.js",
    "_basic/basic/basic.css": "basic/basic.min.css",
    "_basic/basic/scroll-bar.js": "basic/scroll-bar.min.js",
};

const toDiskPath = (publishedPath) => path.join(...publishedPath.split("/"));

const copyInto = function (from, to) {
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.cpSync(from, to, { recursive: true, filter: (file) => !NOT_COPIED.has(path.basename(file)) });
};

const clearDist = function () {
    if (!fs.existsSync(DIST)) return;
    const isEmpty = (fs.readdirSync(DIST).length === 0);
    if (!isEmpty && !fs.existsSync(path.join(DIST, MARK_FILE))) {
        throw new Error("dist/ has files that this tool did not make. Move them, then run it again.");
    }
    fs.rmSync(DIST, { recursive: true, force: true });
};

// "_basic/comp/x.js" -> "x", other files -> null
const componentNameOf = function (src) {
    const match = src.match(/^_basic\/comp\/([^/]+)\.js$/);
    if (!match) return null;
    return fs.existsSync(path.join(BASIC, "min", match[1] + ".min.js")) ? match[1] : null;
};

// The script tags of the components become one tag, at the place of the first one
const usePublishedFiles = function (html, components) {
    let isBundleWritten = false;
    const withScripts = html.replace(SCRIPT_TAG, function (tag, src) {
        const name = componentNameOf(src);
        if (!name) return tag;
        if (!components.includes(name)) components.push(name);
        if (isBundleWritten) return "";
        isBundleWritten = true;
        return tag.replace(src, BUNDLE_NAME);
    });
    return Object.keys(LIBRARY_FILES).reduce(function (text, source) {
        return text.split(source).join(LIBRARY_FILES[source]);
    }, withScripts);
};

// The paths inside _basic/ that a text names. A path that ends with "/" is a folder.
const collectBasicPaths = function (text, found) {
    (text.match(/_basic\/(?:basic|comp|assets)\/[^"'`)\s,;?#]*/g) || []).forEach((item) => found.add(item));
};

const rewriteBasicPaths = function (text) {
    return text
        .replace(/_basic\/assets\//g, "basic-assets/")
        .replace(/_basic\/(basic|comp)\//g, "$1/")
        .replace(/(["'`/])index\.htm(?=["'`?#])/g, "$1index.html");
};

const copyBasicPath = function (basicPath) {
    const from = path.join(ROOT, toDiskPath(basicPath));
    if (basicPath === "_basic/comp/") {
        // WHY: A template gives the folder and adds the file in code: only the folders of the pictures are needed.
        fs.readdirSync(from, { withFileTypes: true }).filter((entry) => entry.isDirectory()).forEach(function (entry) {
            copyBasicPath("_basic/comp/" + entry.name);
        });
        return;
    }
    if (!fs.existsSync(from)) {
        console.warn("Not found: " + basicPath);
        return;
    }
    copyInto(from, path.join(DIST, toDiskPath(rewriteBasicPaths(basicPath))));
};

const walkFiles = function (folder, onFile) {
    fs.readdirSync(folder, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walkFiles(full, onFile);
        else onFile(full);
    });
};

const build = function () {

    clearDist();
    fs.mkdirSync(DIST, { recursive: true });

    // The files of the project
    fs.readdirSync(ROOT).forEach(function (name) {
        if (NOT_COPIED.has(name) || /\.md$/i.test(name)) return;
        copyInto(path.join(ROOT, name), path.join(DIST, name));
    });

    // The pages: their tags first, so the list of the components is known
    const components = [];
    const pages = [];
    walkFiles(DIST, function (file) {
        if (!/\.html?$/i.test(file)) return;
        fs.writeFileSync(file, usePublishedFiles(fs.readFileSync(file, "utf8"), components));
        pages.push(file);
    });
    if (!pages.length) throw new Error("There is no .htm page in the project.");

    // The library
    ["basic.min.js", "basic.min.css", "scroll-bar.min.js", "LICENSE", "font"].forEach(function (name) {
        copyBasicPath("_basic/basic/" + name);
    });

    // The components, in the order the pages load them
    const bundle = components.map(function (name) {
        return fs.readFileSync(path.join(BASIC, "min", name + ".min.js"), "utf8").trim();
    }).join("\n");
    if (components.length) {
        const bundleFile = path.join(DIST, toDiskPath(BUNDLE_NAME));
        fs.mkdirSync(path.dirname(bundleFile), { recursive: true });
        fs.writeFileSync(bundleFile, bundle);
    }

    // Every file of _basic/ that the copy names, then the paths
    const basicPaths = new Set();
    walkFiles(DIST, function (file) {
        if (TEXT_FILE.test(file)) collectBasicPaths(fs.readFileSync(file, "utf8"), basicPaths);
    });
    basicPaths.forEach(copyBasicPath);
    walkFiles(DIST, function (file) {
        if (!TEXT_FILE.test(file) || file.endsWith(".min.js") && file.includes("chart-")) return;
        const text = fs.readFileSync(file, "utf8");
        const rewritten = rewriteBasicPaths(text);
        if (rewritten !== text) fs.writeFileSync(file, rewritten);
    });

    const indexPage = path.join(DIST, "index.htm");
    if (fs.existsSync(indexPage)) fs.renameSync(indexPage, path.join(DIST, "index.html"));
    fs.writeFileSync(path.join(DIST, MARK_FILE), "");

    console.log("dist/ is ready: " + pages.length + " page(s), " + components.length + " component(s).");
    console.log("Publish the files inside dist/. To see it: npx serve dist");

};

try {
    build();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

if (!process.argv.includes("--no-check")) {
    spawnSync(process.execPath, [path.join(__dirname, "check.js"), "--dist"], { stdio: "inherit" });
}
