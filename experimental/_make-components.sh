#!/bin/bash
# Bismillah
#
# Make comp/components.js: every component in one file, with their icons next to it.
# v26.09 - Bugra Ozden
#
# comp/components.js holds the .min.js code of every component in comp-m1 ... comp-m4,
# one after the other. A page loads only basic.js and this file. The icon folders of the
# components are copied into comp/, and the icon paths in the code are rewritten to
# "comp/<folder>/<file>". These paths are relative to the page, so the page must be in
# the folder that holds comp/:
#
#   my-app/index.htm                    <script src="basic/basic.js"></script>
#   my-app/comp/components.js           <script src="comp/components.js"></script>
#   my-app/comp/smart-table/*.png
#
# SAME NAME: one script can not define the same global (const) twice. When two components
# have the same name (CheckBox in comp-m1 and in comp-m3), only the newest one is used:
# a newer generation wins (comp-m4 > comp-m1), and in the same generation the higher
# "-vN" in the file name wins (login-page-v2.js > login-page.js).
#
# USAGE:
#   ./experimental/_make-components.sh           Makes comp/components.js and copies the icon folders.
#   ./experimental/_make-components.sh --list    Only shows what would go in. Writes nothing.
#
# The .min.js twin is used when it is up to date. When there is no twin, or the source is
# newer, the source is minified here (no twin is written). It only needs node (npx
# downloads terser).

set -u
cd "$(dirname "$0")/.." || exit 1   # the repo root (this script is in experimental/)

# *** SETTINGS:

export SOURCE_DIRS="comp-m1 comp-m2 comp-m3 comp-m4"   # oldest generation first
export OUT_DIR="comp"
export OUT_FILE="components.js"
export ICON_PATH="comp/"                  # the icon paths in the code start with this (relative to the page)
export LOAD_FIRST="ui-core.js utils.js"   # comp-m1 files use UICore while they load
export EXCLUDE="ui-standards.js"          # opt-in theme tokens: it writes the theme CSS into the page when it loads

# *** MAIN:

export IS_LIST=0
for argument in "$@"; do
    case "$argument" in
        --list) IS_LIST=1 ;;
        -h | --help) sed -n '3,28p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "Unknown option: $argument (try --help)"; exit 1 ;;
    esac
done

# The terser package (npx downloads it once). Its parser finds the names each file defines.
terserBin="$(npx --yes -p terser -c 'command -v terser' 2>/dev/null)"
if [ -z "$terserBin" ]; then echo "terser could not be loaded with npx."; exit 1; fi
TERSER_DIR="$(cd "$(dirname "$terserBin")/../terser" && pwd)" || exit 1
export TERSER_DIR

node - <<'NODE_CODE'
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const terser = require(process.env.TERSER_DIR);

const list = (text) => text.split(/\s+/).filter(Boolean);
const sourceDirs = list(process.env.SOURCE_DIRS);
const loadFirst = list(process.env.LOAD_FIRST);
const exclude = list(process.env.EXCLUDE);
const outDir = process.env.OUT_DIR;
const outFile = path.join(outDir, process.env.OUT_FILE);
const iconPath = process.env.ICON_PATH;
const isList = process.env.IS_LIST === "1";

const SKIPPED_FILE = /\.min\.js$|^delete-|^unfinished-/;
const SKIPPED_ASSET = /^\.|\.webloc$/; // .DS_Store, links to web pages
// "../comp-m2/waiting/", "../../comp-m2/waiting/", "comp-m1/ui-action-button/", "components/ui-table/" (old comp-m1 path)
const ICON_FOLDER_PATH = /(["'`])(?:\.\.\/)*(comp-m[1-4]|components)\/([\w.-]+)\//g;

const warnings = [];

const fail = function (message) {
    console.log("ERROR: " + message);
    process.exit(1);
};

// The global names a file defines: const/let/var, function and class at the top level.
const findTopLevelNames = async function (code) {
    const result = await terser.minify(code, { compress: false, mangle: false, format: { ast: true, code: false } });
    const names = [];
    for (const statement of result.ast.body) {
        if (statement.definitions) {
            statement.definitions.forEach((definition) => { if (definition.name && definition.name.name) names.push(definition.name.name); });
        } else if (statement.name && statement.name.name) {
            names.push(statement.name.name);
        }
    }
    return names;
};

// Every component source, with its minified code.
const collectFiles = async function () {
    const files = [];
    for (let generation = 0; generation < sourceDirs.length; generation++) {
        const dir = sourceDirs[generation];
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir).sort()) {
            if (!name.endsWith(".js") || SKIPPED_FILE.test(name) || exclude.includes(name)) continue;

            const src = path.join(dir, name);
            const min = src.replace(/\.js$/, ".min.js");
            const versionMatch = name.match(/-v(\d+)\.js$/);
            const file = { dir, name, src, generation, rank: generation * 100 + (versionMatch ? Number(versionMatch[1]) : 1) };

            if (fs.existsSync(min) && fs.statSync(min).mtimeMs >= fs.statSync(src).mtimeMs) {
                file.from = min;
                file.code = fs.readFileSync(min, "utf8");
            } else {
                file.from = src + (fs.existsSync(min) ? "  (its .min.js is older, minified here)" : "  (no .min.js, minified here)");
                const result = await terser.minify(fs.readFileSync(src, "utf8"), { compress: true, mangle: true });
                file.code = result.code;
            }
            file.code = file.code.replace(/^\s*\/\*\s*Bismillah\s*\*\/\s*/, "").replace(/^(["'])use strict\1;?\s*/, "").trim();
            file.names = await findTopLevelNames(file.code);
            files.push(file);
        }
    }
    return files;
};

// Newest first: a file whose name is already taken by a newer file is left out.
const chooseFiles = function (files) {
    const owners = new Map(); // name -> file
    const kept = [];
    const leftOut = [];
    const newestFirst = [...files].sort((a, b) => b.rank - a.rank || a.src.localeCompare(b.src));

    for (const file of newestFirst) {
        const sameName = file.names.find((name) => owners.has(name));
        if (sameName) {
            const newer = owners.get(sameName);
            if (newer.rank === file.rank) {
                fail(file.src + " and " + newer.src + " both define \"" + sameName + "\" and none of them is newer. Add one of them to EXCLUDE.");
            }
            leftOut.push({ file, newer, name: sameName });
            continue;
        }
        file.names.forEach((name) => owners.set(name, file));
        kept.push(file);
    }

    // Load order: oldest generation first, LOAD_FIRST files at the top of their generation.
    const firstIndex = (file) => { const index = loadFirst.indexOf(file.name); return (index < 0) ? loadFirst.length : index; };
    kept.sort((a, b) => a.generation - b.generation || firstIndex(a) - firstIndex(b) || a.name.localeCompare(b.name));
    leftOut.sort((a, b) => a.file.src.localeCompare(b.file.src));
    return { kept, leftOut };
};

// Rewrites the icon paths to ICON_PATH and returns the icon folders to copy: folder name -> source folder.
const moveIconPaths = function (kept) {
    const folders = new Map();

    const addFolder = function (name, from, usedBy) {
        if (!fs.existsSync(from) || !fs.statSync(from).isDirectory()) {
            warnings.push(usedBy + ": the icon folder " + from + " is not there.");
            return;
        }
        const other = folders.get(name);
        if (other && other !== from) fail("Two icon folders have the same name: " + other + " and " + from);
        folders.set(name, from);
    };

    for (const file of kept) {
        // The component's own folder (Ex: comp-m3/smart-table/, comp-m4/chart-box/)
        const ownFolder = path.join(file.dir, file.name.replace(/\.js$/, ""));
        if (fs.existsSync(ownFolder) && fs.statSync(ownFolder).isDirectory()) addFolder(path.basename(ownFolder), ownFolder, file.src);

        // The folders in the icon paths
        file.code = file.code.replace(ICON_FOLDER_PATH, function (all, quote, where, folder) {
            addFolder(folder, (where === "components") ? path.join(file.dir, folder) : path.join(where, folder), file.src);
            return quote + iconPath + folder + "/";
        });
    }

    // An empty folder (only skipped files in it) is not copied.
    for (const [name, from] of folders) {
        if (!fs.readdirSync(from).some((item) => !SKIPPED_ASSET.test(item))) folders.delete(name);
    }
    return folders;
};

const makeText = function (kept) {
    const today = new Date().toISOString().slice(0, 10);
    const lines = [
        "/* Bismillah */",
        "/*",
        "",
        "JS-Component Suite - components.js",
        "Made by _make-components.sh on " + today + ". Do not edit this file: edit the components and run the script again.",
        "",
        "- Load it after basic.js: <script src=\"comp/components.js\"></script>",
        "- The icons are in the folders next to this file. The icon paths start with \"" + iconPath + "\" (relative to the page).",
        "",
        "COMPONENTS:",
    ];
    kept.forEach((file) => lines.push("- " + file.src + ": " + file.names.filter((name) => !name.endsWith("Defaults")).join(", ")));
    lines.push("", "*/", "\"use strict\";", "");

    for (const file of kept) {
        lines.push("// " + file.src, file.code + ";", "");
    }
    return lines.join("\n");
};

const main = async function () {
    const files = await collectFiles();
    const { kept, leftOut } = chooseFiles(files);
    const folders = moveIconPaths(kept);
    const text = makeText(kept);

    // A broken file (Ex: the same const twice) must not be written.
    try {
        new vm.Script(text, { filename: outFile });
    } catch (error) {
        fail("The result has a syntax error, nothing is written: " + error.message);
    }

    console.log("Components (" + kept.length + "):");
    kept.forEach((file) => console.log("   " + file.from));

    if (leftOut.length) {
        console.log("\nLeft out, a newer one has the same name:");
        leftOut.forEach((item) => console.log("   " + item.file.src.padEnd(34) + " -> " + item.newer.src + "  (" + item.name + ")"));
    }
    if (exclude.length) console.log("\nExcluded in the settings: " + exclude.join(", "));

    console.log("\nIcon folders (" + folders.size + "):");
    for (const [name, from] of folders) console.log("   " + from.padEnd(34) + " -> " + path.join(outDir, name));

    if (warnings.length) {
        console.log("\nWARNINGS:");
        warnings.forEach((warning) => console.log("   " + warning));
    }

    if (isList) {
        console.log("\nNothing is written (--list).");
        return;
    }

    fs.mkdirSync(outDir, { recursive: true });
    for (const [name, from] of folders) {
        const to = path.join(outDir, name);
        fs.rmSync(to, { recursive: true, force: true });
        fs.cpSync(from, to, { recursive: true, filter: (item) => item === from || !SKIPPED_ASSET.test(path.basename(item)) });
    }
    fs.writeFileSync(outFile, text);
    console.log("\nDone: " + outFile + " (" + Buffer.byteLength(text) + " bytes)");
};

main().catch((error) => fail(error.stack || String(error)));
NODE_CODE
