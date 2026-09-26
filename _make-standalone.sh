#!/bin/bash
# Bismillah
#
# Make a project folder work on its own (outside this repository).
# v26.09 - Bugra Ozden
#
# The pages in this repo load the library and the components from the repo root:
#   <script src="../../basic/basic.min.js">   <script src="../../comp-m4/tabs.min.js">
# This script copies what the pages of a project load into the project folder, and
# rewrites those paths:
#
#   my-project/basic/   basic.min.js, basic.min.css, LICENSE, font/, img/
#                       + the other files of basic/ the pages load, as .min (scroll-bar.min.js)
#   my-project/comp/    every component the pages load, as name.min.js (made from its source
#                       with terser), and its icon folder (comp-m2/waiting/ -> comp/waiting/;
#                       the icon paths in the code are rewritten to "comp/<folder>/")
#   my-project/comp/_sources.txt   where every file of comp/ comes from
#
# Run it again after the library or a component changes: it reads the pages (and
# comp/_sources.txt) again and refreshes basic/ and comp/. Both folders are made again from
# scratch every time: do not edit files in them.
#
# It only fixes the <script src> / <link href> of the .htm / .html pages. Paths that leave
# the folder in the project's own code ("../../" in a config.js) are listed at the end:
# change those by hand.
#
# USAGE:
#   ./_make-standalone.sh 03-webpage-m2/webpage-basicjs          Copies and rewrites.
#   ./_make-standalone.sh 03-webpage-m2/webpage-basicjs --list   Only shows what it would do.
#
# It only needs node (npx downloads terser).

set -u
cd "$(dirname "$0")" || exit 1   # the repo root

# *** SETTINGS:

export BASIC_ALWAYS="basic.min.js basic.min.css LICENSE font img"   # basic/ files every copy gets
export COMP_DIRS="comp-m1 comp-m2 comp-m3 comp-m4"
export KEEP_COMMENTS="Bismillah"                                    # the house header stays in the min file

# *** MAIN:

PROJECT=""
export IS_LIST=0
for argument in "$@"; do
    case "$argument" in
        --list) IS_LIST=1 ;;
        -h | --help) sed -n '3,31p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "Unknown option: $argument (try --help)"; exit 1 ;;
        *) PROJECT="$argument" ;;
    esac
done

if [ -z "$PROJECT" ]; then echo "Give a project folder: ./_make-standalone.sh 03-webpage-m2/webpage-basicjs"; exit 1; fi
if [ ! -d "$PROJECT" ]; then echo "Not a folder: $PROJECT"; exit 1; fi

export REPO="$(pwd)"
export PROJECT_DIR="$(cd "$PROJECT" && pwd)"

case "$PROJECT_DIR/" in
    "$REPO/"*) ;;
    *) echo "The project must be inside this repository."; exit 1 ;;
esac
if [ "$PROJECT_DIR" = "$REPO" ]; then echo "The repository root is not a project folder."; exit 1; fi

# The terser package (npx downloads it once).
terserBin="$(npx --yes -p terser -c 'command -v terser' 2>/dev/null)"
if [ -z "$terserBin" ]; then echo "terser could not be loaded with npx."; exit 1; fi
TERSER_DIR="$(cd "$(dirname "$terserBin")/../terser" && pwd)" || exit 1
export TERSER_DIR

node - <<'NODE_CODE'
"use strict";
const fs = require("fs");
const path = require("path");
const terser = require(process.env.TERSER_DIR);

const REPO = process.env.REPO;
const PROJECT = process.env.PROJECT_DIR;
const isList = process.env.IS_LIST === "1";
const list = (text) => text.split(/\s+/).filter(Boolean);
const basicAlways = list(process.env.BASIC_ALWAYS);
const compDirs = list(process.env.COMP_DIRS);
const keepComments = new RegExp(process.env.KEEP_COMMENTS);

const BASIC_OUT = path.join(PROJECT, "basic");
const COMP_OUT = path.join(PROJECT, "comp");
const SOURCES_FILE = path.join(COMP_OUT, "_sources.txt");

// "../comp-m2/waiting/", "../../comp-m2/waiting/", "comp-m1/ui-action-button/"
const ICON_FOLDER_PATH = /(["'`])(?:\.\.\/)*(comp-m[1-4])\/([\w.-]+)\//g;
const SKIPPED_ASSET = /^\.|\.webloc$/; // .DS_Store, links to web pages
const TAG_PATH = /(<(?:script|link)\b[^>]*?\b(?:src|href)\s*=\s*)(["'])([^"']+)\2/gi;

const rel = (file) => path.relative(REPO, file);
const warnings = [];

// *** PAGES:

const pages = [];
const walk = function (dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (full === BASIC_OUT || full === COMP_OUT || entry.name === "node_modules" || entry.name.startsWith(".")) return;
            walk(full);
        } else if (/\.html?$/i.test(entry.name)) {
            pages.push(full);
        }
    });
};
walk(PROJECT);

// The folder a relative path of this page starts from (<base href> is taken into account)
const baseDirOf = function (page, html) {
    const base = /<base\b[^>]*\bhref\s*=\s*["']([^"']+)["']/i.exec(html);
    if (base && !/^[a-z]+:|^\/\//i.test(base[1])) return path.resolve(path.dirname(page), base[1]);
    return path.dirname(page);
};

// Where a comp/ file came from in the last run
const oldSources = {};
if (fs.existsSync(SOURCES_FILE)) {
    fs.readFileSync(SOURCES_FILE, "utf8").split("\n").forEach(function (line) {
        const match = /^(\S+)\s+<-\s+(\S+)/.exec(line);
        if (match) oldSources[match[1]] = match[2];
    });
}

// *** FIND WHAT THE PAGES LOAD:

const basicFiles = {};   // "scroll-bar.min.js" -> repo source file
const compFiles = {};    // "tabs.min.js" -> "comp-m4/tabs.js"
const rewrites = [];     // { page, from, to }

// The .min file of a basic/ file ("scroll-bar.js" -> "scroll-bar.min.js")
const minName = function (name) {
    if (/\.min\.(js|css)$/.test(name)) return name;
    return name.replace(/\.(js|css)$/, ".min.$1");
};

pages.forEach(function (page) {

    const html = fs.readFileSync(page, "utf8");
    const baseDir = baseDirOf(page, html);
    let match;
    TAG_PATH.lastIndex = 0;

    while ((match = TAG_PATH.exec(html))) {

        const value = match[3];
        if (/^[a-z]+:|^\/\/|^#|^data:/i.test(value)) continue;   // web addresses, anchors, inline data

        const clean = value.split(/[?#]/)[0];
        const target = path.resolve(baseDir, clean);
        const inProject = (target + path.sep).startsWith(PROJECT + path.sep);
        let newTarget = null;

        if (inProject) {

            // Already a copy (a second run)
            const inside = path.relative(PROJECT, target).split(path.sep);
            if (inside[0] === "basic" && inside.length > 1) {
                const name = inside.slice(1).join("/");
                if (inside.length === 2 && fs.existsSync(path.join(REPO, "basic", name))) basicFiles[name] = path.join(REPO, "basic", name);
            } else if (inside[0] === "comp" && inside.length === 2) {
                const source = oldSources[inside[1]];
                if (source) compFiles[inside[1]] = source;
                else warnings.push(rel(page) + ": " + value + " is in comp/ but not in comp/_sources.txt (it will be deleted)");
            }
            continue;

        }

        const fromRepo = path.relative(REPO, target).split(path.sep);

        if (fromRepo[0] === "basic") {

            const name = fromRepo.slice(1).join("/");
            if (fromRepo.length === 2 && /\.(js|css)$/.test(name)) {
                const min = minName(name);
                if (!fs.existsSync(path.join(REPO, "basic", min))) { warnings.push(rel(page) + ": " + value + " has no .min file in basic/"); continue; }
                basicFiles[min] = path.join(REPO, "basic", min);
                newTarget = path.join(BASIC_OUT, min);
            } else {
                // font/..., img/... (copied with the folder)
                newTarget = path.join(BASIC_OUT, name);
            }

        } else if (compDirs.indexOf(fromRepo[0]) > -1 && fromRepo.length === 2 && /\.js$/.test(fromRepo[1])) {

            const sourceName = fromRepo[1].replace(/\.min\.js$/, ".js");
            const source = fromRepo[0] + "/" + sourceName;
            if (!fs.existsSync(path.join(REPO, source))) { warnings.push(rel(page) + ": " + value + ": no source file " + source); continue; }
            const outName = sourceName.replace(/\.js$/, ".min.js");
            if (compFiles[outName] && compFiles[outName] !== source) {
                warnings.push(rel(page) + ": " + outName + " is loaded from " + compFiles[outName] + " and " + source + " (same name): " + compFiles[outName] + " is kept");
                continue;
            }
            compFiles[outName] = source;
            newTarget = path.join(COMP_OUT, outName);

        } else {
            warnings.push(rel(page) + ": " + value + " is outside the project and is not in basic/ or comp-m*/ (not copied)");
            continue;
        }

        let to = path.relative(baseDir, newTarget).split(path.sep).join("/");
        if (value !== clean) to += value.slice(clean.length);   // keeps ?v=2 or #hash
        rewrites.push({ page: page, from: value, to: to });

    }

});

basicAlways.forEach(function (name) {
    if (fs.existsSync(path.join(REPO, "basic", name))) basicFiles[name] = path.join(REPO, "basic", name);
});

// *** REPORT:

console.log("Project: " + rel(PROJECT) + "  (" + pages.length + " page" + (pages.length == 1 ? "" : "s") + ")");
console.log("  basic/  " + Object.keys(basicFiles).sort().join(", "));
console.log("  comp/   " + (Object.keys(compFiles).length ? Object.keys(compFiles).sort().map((name) => name + " <- " + compFiles[name]).join(", ") : "(none)"));
rewrites.forEach(function (item) {
    console.log("  " + rel(item.page) + ": " + item.from + " -> " + item.to);
});

// The basic/ twins that are older than their source
Object.keys(basicFiles).forEach(function (name) {
    const source = path.join(REPO, "basic", name.replace(/\.min\.(js|css)$/, ".$1"));
    if (source !== basicFiles[name] && fs.existsSync(source) && fs.statSync(source).mtimeMs > fs.statSync(basicFiles[name]).mtimeMs) {
        warnings.push("basic/" + name + " is older than its source: check it with ./_make-min-js.sh (file dates)");
    }
});

// Paths that leave the folder in the project's own code (not fixed here)
const leaving = [];
const scan = function (dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (full === BASIC_OUT || full === COMP_OUT || entry.name === "node_modules" || entry.name.startsWith(".")) return;
            scan(full);
        } else if (/\.(js|css|json|webmanifest)$/i.test(entry.name)) {
            fs.readFileSync(full, "utf8").split("\n").forEach(function (line, index) {
                const found = /(["'`(])((?:\.\.\/)+[^"'`)\s]*)/.exec(line);
                if (!found) return;
                // WHY: A path in a JavaScript file is relative to the page (usually the project root), a path in a CSS file to the file.
                const fromRoot = path.resolve(PROJECT, found[2]);
                const fromFile = path.resolve(path.dirname(full), found[2]);
                const outside = (target) => !(target + path.sep).startsWith(PROJECT + path.sep);
                if (outside(fromRoot) || outside(fromFile)) leaving.push(rel(full) + ":" + (index + 1) + "  " + line.trim().slice(0, 110));
            });
        }
    });
};
scan(PROJECT);

const finish = function () {
    if (leaving.length) {
        console.log("\nPaths that leave the folder in the project's code (change them by hand; a path from a");
        console.log("JavaScript file is relative to the page, so check them one by one):");
        leaving.forEach((line) => console.log("  " + line));
    }
    if (warnings.length) {
        console.log("\nWarnings:");
        warnings.forEach((line) => console.log("  " + line));
    }
};

if (isList) {
    finish();
    console.log("\n(--list: nothing was written)");
    process.exit(0);
}

// *** COPY:

const copyFolder = function (from, to) {
    fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from, { withFileTypes: true }).forEach(function (entry) {
        if (SKIPPED_ASSET.test(entry.name)) return;
        const source = path.join(from, entry.name);
        const target = path.join(to, entry.name);
        if (entry.isDirectory()) copyFolder(source, target);
        else fs.copyFileSync(source, target);
    });
};

(async function () {

    // BASIC
    fs.rmSync(BASIC_OUT, { recursive: true, force: true });
    fs.mkdirSync(BASIC_OUT, { recursive: true });
    Object.keys(basicFiles).sort().forEach(function (name) {
        const source = basicFiles[name];
        if (fs.statSync(source).isDirectory()) copyFolder(source, path.join(BASIC_OUT, name));
        else fs.copyFileSync(source, path.join(BASIC_OUT, name));
    });

    // COMP
    fs.rmSync(COMP_OUT, { recursive: true, force: true });
    const names = Object.keys(compFiles).sort();
    const sourcesLines = [];
    if (names.length) {
        fs.mkdirSync(COMP_OUT, { recursive: true });
        for (const name of names) {
            const source = compFiles[name];
            const result = await terser.minify(fs.readFileSync(path.join(REPO, source), "utf8"), {
                compress: true,
                mangle: true,
                format: { comments: keepComments },
            });
            // Icon folders: copied next to the file, and the paths in the code point there
            const code = result.code.replace(ICON_FOLDER_PATH, function (all, quote, gen, folder) {
                const from = path.join(REPO, gen, folder);
                if (!fs.existsSync(from) || !fs.statSync(from).isDirectory()) return all;
                copyFolder(from, path.join(COMP_OUT, folder));
                return quote + "comp/" + folder + "/";
            });
            fs.writeFileSync(path.join(COMP_OUT, name), code + "\n");
            sourcesLines.push(name + " <- " + source);
        }
        fs.writeFileSync(SOURCES_FILE,
            "# Made by _make-standalone.sh (repository root). Do not edit: run the script again.\n"
            + "# <file in comp/> <- <its source in the repository>\n"
            + sourcesLines.join("\n") + "\n");
    }

    // PAGES
    const byPage = {};
    rewrites.forEach(function (item) { (byPage[item.page] = byPage[item.page] || []).push(item); });
    Object.keys(byPage).forEach(function (page) {
        let html = fs.readFileSync(page, "utf8");
        html = html.replace(TAG_PATH, function (all, start, quote, value) {
            const item = byPage[page].find((rewrite) => rewrite.from === value);
            return item ? start + quote + item.to + quote : all;
        });
        fs.writeFileSync(page, html);
    });

    console.log("\nDone: basic/ (" + Object.keys(basicFiles).length + "), comp/ (" + names.length + "), " + Object.keys(byPage).length + " page(s) rewritten.");
    finish();

})().catch(function (error) {
    console.error(error);
    process.exit(1);
});
NODE_CODE
