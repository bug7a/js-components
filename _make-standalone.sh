#!/bin/bash
# Bismillah
#
# Make a project folder work on its own (outside this repository).
# v26.10 - Bugra Ozden
#
# By default the project folder is NOT changed: a ready copy is made in _dist/<project name>/ (gitignored),
# so you keep working (and debugging) on the project with the sources of the repository. (2026-10-31)
#
# The pages in this repo load the library and the components from the repo root:
#   <script src="../../basic/basic.min.js">   <script src="../../comp/tabs.js">
# (the components have no .min twins in the repo: their .min files are made here, from the sources)
# This script copies the project, with what its pages load, into the output folder, and
# rewrites those paths there:
#
#   my-project/basic/   basic.min.js, basic.min.css, LICENSE, font/
#                       + the other files of basic/ the pages load, as .min (scroll-bar.min.js)
#   my-project/comp/    every component in ONE file, comp/components.min.js (the default since 2026-10-31;
#                       made from the sources with terser, in the order the pages load them). The pages
#                       get one <script> for it, in the place of their first component. The icon folders
#                       of the components are copied into comp/<folder>/ and the paths in the code point there.
#                       --separate: one name.min.js file for each component instead.
#   my-project/comp/_sources.txt   where every file of comp/ comes from
#
# Run it again after the project, the library or a component changes: the output folder is made
# again from scratch every time (do not edit files in it; it has a _standalone.txt note).
#
# --in-place: the project folder itself becomes standalone (its pages are rewritten, basic/ and comp/
#   are made in it). For sites that live so in the repository (03-webpages/webpage-basicjs,
#   04-templates/todo-app-example, __projects/webpage-ozden-panel). A project made in place with one
#   file per component keeps that layout at the next runs (comp/_sources.txt tells it). A component
#   line written later into such a page (../comp/name.js, over or under its comp/components.min.js
#   line) goes into the one file, and the page keeps one line for it. (2026-11-05)
#   To take a component out, delete its line in comp/_sources.txt and run the script again: it leaves
#   components.min.js (the pages are not changed), or, with one file per component, its <script> line
#   leaves every page. The code that uses it must go first. (2026-11-05, the user) A file of comp/ that
#   the script did not make (no name.min.js with a source in comp/ of the repository) keeps its line:
#   it is deleted with a warning, as comp/ is made again from scratch. A line whose source is not in
#   the repository (a typo, comp-m2/... from before 2026-10-31) stops the run before anything is written.
#
# --gzip: every text file of the output (.htm, .js, .css, .svg, .json, fonts...) is also written as
#   name.gz (gzip -9), next to it. For a server that sends the packed files itself (Ex: a small board
#   like an ESP32, which has little room). (2026-11-05)
#
# It only fixes the <script src> / <link href> of the .htm / .html pages. Paths that leave
# the folder in the project's own code ("../../" in a config.js) are listed at the end:
# change those by hand.
#
# USAGE:
#   ./_make-standalone.sh _projects/my-first-project              -> _dist/my-first-project/
#   ./_make-standalone.sh _projects/my-first-project --out ~/site  -> the given folder
#   ./_make-standalone.sh _projects/my-first-project --list       Only shows what it would do.
#   ./_make-standalone.sh _projects/my-first-project --separate   One .min.js for each component.
#   ./_make-standalone.sh 03-webpages/webpage-basicjs --in-place   The project folder itself.
#   ./_make-standalone.sh _projects/my-first-project --gzip       A .gz of every text file too.
#
# It only needs node (npx downloads terser).

set -u
cd "$(dirname "$0")" || exit 1   # the repo root

# *** SETTINGS:

export BASIC_ALWAYS="basic.min.js basic.min.css LICENSE font"   # basic/ files every copy gets
export COMP_DIRS="comp"   # (comp-m2 / comp-m3 / comp-m4 were put together in comp/ on 2026-10-31)
export KEEP_COMMENTS="Bismillah"                                    # the house header stays in the min file

# *** MAIN:

PROJECT=""
export IS_LIST=0
export ONE_FILE=0       # 1: --one-file given (one file is also the default for a new output)
export SEPARATE=0       # 1: --separate (one file for each component)
export IN_PLACE=0
export MAKE_GZIP=0      # 1: --gzip (WHY not GZIP: the gzip command reads its options from a variable named so)
export OUT_DIR=""
isOutNext=0
for argument in "$@"; do
    if [ "$isOutNext" = "1" ]; then OUT_DIR="$argument"; isOutNext=0; continue; fi
    case "$argument" in
        --list) IS_LIST=1 ;;
        --one-file) ONE_FILE=1 ;;
        --separate) SEPARATE=1 ;;
        --in-place) IN_PLACE=1 ;;
        --gzip) MAKE_GZIP=1 ;;
        --out) isOutNext=1 ;;
        -h | --help) sed -n '3,50p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "Unknown option: $argument (try --help)"; exit 1 ;;
        *) PROJECT="$argument" ;;
    esac
done

if [ -z "$PROJECT" ]; then echo "Give a project folder: ./_make-standalone.sh _projects/my-first-project"; exit 1; fi
if [ "$isOutNext" = "1" ]; then echo "--out needs a folder."; exit 1; fi
if [ "$IN_PLACE" = "1" ] && [ -n "$OUT_DIR" ]; then echo "--in-place and --out can not go together."; exit 1; fi
if [ "$ONE_FILE" = "1" ] && [ "$SEPARATE" = "1" ]; then echo "--one-file and --separate can not go together."; exit 1; fi
if [ -n "$OUT_DIR" ]; then mkdir -p "$OUT_DIR" && OUT_DIR="$(cd "$OUT_DIR" && pwd)" || exit 1; fi
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
const ONE_FILE_NAME = "components.min.js";
const list = (text) => text.split(/\s+/).filter(Boolean);
const basicAlways = list(process.env.BASIC_ALWAYS);
const compDirs = list(process.env.COMP_DIRS);
const keepComments = new RegExp(process.env.KEEP_COMMENTS);

const IN_PLACE = process.env.IN_PLACE === "1";
const MAKE_GZIP = process.env.MAKE_GZIP === "1";
const GZIP_TYPES = /\.(html?|m?js|css|svg|json|txt|xml|webmanifest|ttf|otf)$/i; // WHY not .png / .woff2: they are packed already
// The folder the standalone project is made in: the project itself (--in-place), --out, or _dist/<name>
const OUT = IN_PLACE ? PROJECT : (process.env.OUT_DIR || path.join(REPO, "_dist", path.basename(PROJECT)));
const MARKER_FILE = path.join(OUT, "_standalone.txt");
const isInside = (folder, parent) => (folder + path.sep).startsWith(parent + path.sep);
if (!IN_PLACE && (OUT === REPO || isInside(OUT, PROJECT) || isInside(PROJECT, OUT))) {
    console.log("The output folder can not be the repository, or be inside the project (or hold it): " + OUT);
    process.exit(1);
}
// The place in the output of a file of the project
const toOut = (file) => IN_PLACE ? file : path.join(OUT, path.relative(PROJECT, file));

const BASIC_OUT = path.join(OUT, "basic");
const COMP_OUT = path.join(OUT, "comp");
const SOURCES_FILE = path.join(COMP_OUT, "_sources.txt");
const OWN_BASIC = path.join(PROJECT, "basic");   // --in-place: the copies of an earlier run (not pages)
const OWN_COMP = path.join(PROJECT, "comp");

// "../comp/waiting/", "../../comp/waiting/", "comp/action-button/"
const ICON_FOLDER_PATH = /(["'`])(?:\.\.\/)*(comp)\/([\w.-]+)\//g;
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
            if ((IN_PLACE && (full === OWN_BASIC || full === OWN_COMP)) || entry.name === "node_modules" || entry.name.startsWith(".")) return;
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

// Where a comp/ file came from in the last run (components.min.js: one line for each of its sources)
const oldSources = {};
const oldOneFile = [];
const hadSources = IN_PLACE && fs.existsSync(SOURCES_FILE);
const missingSources = [];
if (hadSources) {
    fs.readFileSync(SOURCES_FILE, "utf8").split("\n").forEach(function (line) {
        const match = /^(\S+)\s+<-\s+(\S+)/.exec(line);
        if (!match) return;
        if (!fs.existsSync(path.join(REPO, match[2]))) missingSources.push(match[2]);
        if (match[1] === ONE_FILE_NAME) oldOneFile.push(match[2]);
        else oldSources[match[1]] = match[2];
    });
}
// WHY (2026-11-05): a line of a source that is not there (a typo, or comp-m2/... from before 2026-10-31) stops
//      the run before anything is written. Skipped, it changed the layout and took the components out of the pages.
if (missingSources.length) {
    console.log("comp/_sources.txt of " + rel(PROJECT) + " names sources that are not in the repository (nothing was written):");
    missingSources.forEach(function (source) { console.log("  " + source); });
    console.log("Write their place in the repository (Ex: comp/form.js), or delete the line to take the component out.");
    process.exit(1);
}
// One file is the default. --separate: one file each. WHY: a project made in place with one file for each
// component keeps that layout (its pages load those files) unless --one-file is given.
const madeSeparate = Object.keys(oldSources).length > 0 && oldOneFile.length === 0;
const isOneFile = process.env.ONE_FILE === "1" || (process.env.SEPARATE !== "1" && !madeSeparate);

// *** FIND WHAT THE PAGES LOAD:

const basicFiles = {};   // "scroll-bar.min.js" -> repo source file
const compFiles = {};    // "tabs.min.js" -> "comp/tabs.js"
const rewrites = [];     // { page, from, to } (to: "" = the <script> is removed: --one-file)
const pageComps = {};    // --one-file: page -> its component sources, in their order

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

        if (inProject && !IN_PLACE) continue;   // a file of the project: it is copied with the project

        if (inProject) {

            // Already a copy (a second run)
            const inside = path.relative(PROJECT, target).split(path.sep);
            if (inside[0] === "basic" && inside.length > 1) {
                const name = inside.slice(1).join("/");
                if (inside.length === 2 && fs.existsSync(path.join(REPO, "basic", name))) basicFiles[name] = path.join(REPO, "basic", name);
            } else if (inside[0] === "comp" && inside.length === 2 && inside[1] === ONE_FILE_NAME) {
                const list = (pageComps[page] = pageComps[page] || []);
                // WHY: a component line over this one became the one file already: two lines would load every component twice
                if (list.length) rewrites.push({ page: page, from: value, to: "", note: "(removed: a line above it loads " + ONE_FILE_NAME + " now)" });
                else if (!oldOneFile.length) rewrites.push({ page: page, from: value, to: "", note: "(removed: comp/_sources.txt lists no component of it)" });
                oldOneFile.forEach(function (source) {
                    if (list.indexOf(source) === -1) list.push(source);
                });
            } else if (inside[0] === "comp" && inside.length === 2) {
                const source = oldSources[inside[1]];
                const sourceInRepo = "comp/" + inside[1].replace(/\.min\.js$/, ".js");
                const madeHere = hadSources && /\.min\.js$/.test(inside[1]) && fs.existsSync(path.join(REPO, sourceInRepo));
                if (source) compFiles[inside[1]] = source;
                // WHY (2026-11-05, the user): a line deleted in comp/_sources.txt takes the component out of the pages, as out of components.min.js
                else if (madeHere) rewrites.push({ page: page, from: value, to: "", note: "(removed: " + sourceInRepo + " is not in comp/_sources.txt)" });
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
                // font/... (copied with the folder)
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
            if (isOneFile) {
                const list = (pageComps[page] = pageComps[page] || []);
                // WHY "": the first component of the page becomes the one file, the others go
                if (list.length) newTarget = "";
                else newTarget = path.join(COMP_OUT, ONE_FILE_NAME);
                list.push(source);
            }

        } else {
            warnings.push(rel(page) + ": " + value + " is outside the project and is not in basic/ or comp/ (not copied)");
            continue;
        }

        let to = "";
        if (newTarget) {
            to = path.relative(toOut(baseDir), newTarget).split(path.sep).join("/");
            if (value !== clean) to += value.slice(clean.length);   // keeps ?v=2 or #hash
        }
        rewrites.push({ page: page, from: value, to: to });

    }

});

// --one-file: the components of every page in one list; a component comes after the ones a page loads before it
const oneFileOrder = [];
Object.keys(pageComps).forEach(function (page) {
    let place = 0;
    pageComps[page].forEach(function (source) {
        const index = oneFileOrder.indexOf(source);
        if (index > -1) {
            place = Math.max(place, index + 1);
            return;
        }
        oneFileOrder.splice(place, 0, source);
        place++;
    });
});

basicAlways.forEach(function (name) {
    if (fs.existsSync(path.join(REPO, "basic", name))) basicFiles[name] = path.join(REPO, "basic", name);
});

// *** REPORT:

console.log("Project: " + rel(PROJECT) + "  (" + pages.length + " page" + (pages.length == 1 ? "" : "s") + ")");
console.log("  out:    " + (IN_PLACE ? "the project folder itself (--in-place)" : (isInside(OUT, REPO) ? rel(OUT) : OUT)));
console.log("  basic/  " + Object.keys(basicFiles).sort().join(", "));
if (isOneFile) console.log("  comp/   " + (oneFileOrder.length ? ONE_FILE_NAME + " <- " + oneFileOrder.join(", ") : "(none)"));
else console.log("  comp/   " + (Object.keys(compFiles).length ? Object.keys(compFiles).sort().map((name) => name + " <- " + compFiles[name]).join(", ") : "(none)"));
if (MAKE_GZIP) console.log("  gzip:   every text file of the output also as name.gz");
rewrites.forEach(function (item) {
    console.log("  " + rel(item.page) + ": " + item.from + " -> " + (item.to || item.note || "(removed: it is in " + ONE_FILE_NAME + ")"));
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
            if ((IN_PLACE && (full === OWN_BASIC || full === OWN_COMP)) || entry.name === "node_modules" || entry.name.startsWith(".")) return;
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

// --gzip: a .gz next to every text file of the output (not the notes of this script: _standalone.txt, _sources.txt)
const writeGzipFiles = function () {
    const zlib = require("zlib");
    let count = 0;
    let rawBytes = 0;
    let gzipBytes = 0;
    const pack = function (dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
            const full = path.join(dir, entry.name);
            if (entry.name === "node_modules" || entry.name.startsWith(".")) return;
            if (entry.isDirectory()) return pack(full);
            if (!GZIP_TYPES.test(entry.name) || entry.name.startsWith("_")) return;
            const raw = fs.readFileSync(full);
            const packed = zlib.gzipSync(raw, { level: 9 });
            fs.writeFileSync(full + ".gz", packed);
            count++;
            rawBytes += raw.length;
            gzipBytes += packed.length;
        });
    };
    pack(OUT);
    const kb = (bytes) => (bytes / 1024).toFixed(1) + " KB";
    console.log("gzip: " + count + " files, " + kb(rawBytes) + " -> " + kb(gzipBytes));
};

(async function () {

    // OUTPUT FOLDER: made again from scratch (only a folder this script made, or an empty one, is cleared)
    if (!IN_PLACE) {
        if (fs.existsSync(OUT) && fs.readdirSync(OUT).length && !fs.existsSync(MARKER_FILE)) {
            console.log("\nThe output folder is not empty and was not made by this script: " + OUT + " (nothing was written)");
            process.exit(1);
        }
        fs.rmSync(OUT, { recursive: true, force: true });
        fs.mkdirSync(OUT, { recursive: true });
        fs.readdirSync(PROJECT, { withFileTypes: true }).forEach(function (entry) {
            if (entry.name === "node_modules" || entry.name.startsWith(".")) return;
            const source = path.join(PROJECT, entry.name);
            if (entry.isDirectory()) copyFolder(source, path.join(OUT, entry.name));
            else fs.copyFileSync(source, path.join(OUT, entry.name));
        });
        fs.writeFileSync(MARKER_FILE,
            "Made by _make-standalone.sh (repository root) from " + rel(PROJECT) + ".\n"
            + "Do not edit the files here: change the project, then run the script again (this folder is made again from scratch).\n");
    }

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

    // The license notice of a source in one line ("/*! Copyright ... | Apache-2.0 | Webpage */"); "" when it has none
    const noticeOf = function (code) {
        const lineOf = function (pattern) {
            const found = code.match(pattern);
            return found ? found[1].trim() : "";
        };
        const copyright = lineOf(/^\s*(Copyright \d.*)$/m);
        if (!copyright) return "";
        const parts = [copyright, lineOf(/^\s*SPDX-License-Identifier:\s*(.*)$/m), lineOf(/^\s*Webpage:\s*(.*)$/m)];
        return "/*! " + parts.filter(Boolean).join(" | ") + " */";
    };

    // WHY: terser keeps only the Bismillah line of a header: the license notice goes with every copy (Apache 2.0, 4c).
    // shownNotices: the notices already in the same file (components.min.js has the same notice once)
    const withNotice = function (minCode, code, shownNotices) {
        const notice = noticeOf(code);
        if (!notice || /Copyright \d/.test(minCode) || shownNotices.has(notice)) return minCode;
        shownNotices.add(notice);
        const BISMILLAH = "/* Bismillah */\n";
        if (!minCode.startsWith(BISMILLAH)) return notice + "\n" + minCode;
        return BISMILLAH + notice + "\n" + minCode.slice(BISMILLAH.length);
    };

    // A source as a .min code; its icon folders are copied into comp/ and the paths in the code point there
    const minifyComponent = async function (source, shownNotices = new Set()) {
        const code = fs.readFileSync(path.join(REPO, source), "utf8");
        const result = await terser.minify(code, {
            compress: true,
            mangle: true,
            format: { comments: keepComments },
        });
        return withNotice(result.code, code, shownNotices).replace(ICON_FOLDER_PATH, function (all, quote, gen, folder) {
            const from = path.join(REPO, gen, folder);
            if (!fs.existsSync(from) || !fs.statSync(from).isDirectory()) return all;
            copyFolder(from, path.join(COMP_OUT, folder));
            return quote + "comp/" + folder + "/";
        });
    };

    const names = isOneFile ? (oneFileOrder.length ? [ONE_FILE_NAME] : []) : Object.keys(compFiles).sort();
    const sourcesLines = [];
    if (names.length) {
        fs.mkdirSync(COMP_OUT, { recursive: true });
        if (isOneFile) {
            const codes = [];
            const shownNotices = new Set();
            for (const source of oneFileOrder) {
                codes.push(await minifyComponent(source, shownNotices));
                sourcesLines.push(ONE_FILE_NAME + " <- " + source);
            }
            // WHY ";": a file that ends without one must not run into the next
            fs.writeFileSync(path.join(COMP_OUT, ONE_FILE_NAME), codes.join("\n;\n") + "\n");
        }
        for (const name of (isOneFile ? [] : names)) {
            const source = compFiles[name];
            fs.writeFileSync(path.join(COMP_OUT, name), (await minifyComponent(source)) + "\n");
            sourcesLines.push(name + " <- " + source);
        }
        // WHY: only a run in place reads this file again; elsewhere an edit here does nothing
        let howToEdit = "Do not edit: run the script again.";
        if (IN_PLACE && isOneFile) howToEdit = "To take a component out of " + ONE_FILE_NAME + ": delete its line, then run the script again (--in-place).";
        else if (IN_PLACE) howToEdit = "To take a component out of the pages: delete its line, then run the script again (--in-place).";
        fs.writeFileSync(SOURCES_FILE,
            "# Made by _make-standalone.sh (repository root). " + howToEdit + "\n"
            + "# <file in comp/> <- <its source in the repository>\n"
            + sourcesLines.join("\n") + "\n");
    }

    // PAGES
    const byPage = {};
    rewrites.forEach(function (item) { (byPage[item.page] = byPage[item.page] || []).push(item); });
    Object.keys(byPage).forEach(function (page) {
        let html = fs.readFileSync(toOut(page), "utf8");
        // --one-file: the <script> lines of the components that are in comp/components.min.js now
        byPage[page].filter((rewrite) => rewrite.to === "").forEach(function (rewrite) {
            const escaped = rewrite.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            html = html.replace(new RegExp("[ \\t]*<script\\b[^>]*\\bsrc\\s*=\\s*([\"'])" + escaped + "\\1[^>]*>\\s*<\\/script>[^\\S\\n]*\\n?"), "");
        });
        html = html.replace(TAG_PATH, function (all, start, quote, value) {
            const item = byPage[page].find((rewrite) => rewrite.from === value && rewrite.to);
            return item ? start + quote + item.to + quote : all;
        });
        fs.writeFileSync(toOut(page), html);
    });

    if (MAKE_GZIP) writeGzipFiles();

    const compCount = isOneFile ? ONE_FILE_NAME + " (" + oneFileOrder.length + " components)" : names.length;
    console.log("\nDone: basic/ (" + Object.keys(basicFiles).length + "), comp/ (" + compCount + "), " + Object.keys(byPage).length + " page(s) rewritten, in "
        + (IN_PLACE ? "the project folder" : (isInside(OUT, REPO) ? rel(OUT) : OUT)) + ".");
    finish();

})().catch(function (error) {
    console.error(error);
    process.exit(1);
});
NODE_CODE
