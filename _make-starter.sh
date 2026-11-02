#!/bin/bash

# Bismillah
#
# Makes the starter of a new project (2026-11-02, the user): a folder that works outside the repository, with
# everything an AI tool needs. Its own files are in _starter/. The rest comes from the repository into _basic/.
#
#   ./_make-starter.sh                  writes _dist/starter/ (made from scratch at every run)
#   ./_make-starter.sh --out <folder>   writes there
#
# WHY the paths are rewritten: the components and the samples say "../comp/...", which works from a folder next to
# comp/. In a project the page is at the root, so they say "_basic/comp/...". A sample gets <base href="../../">, so
# its code is the same code that works in the project, and it still opens from _basic/examples/.
#
# WHY _basic/min/: the project makes dist/ with no install and no internet, so the components are minified here, once
# (only in this copy: the repository has no .min.js next to a component), and tools/build.js only joins them.
#
# It only needs node (npx downloads terser). A folder without the note _starter.txt is never cleared.

set -e

REPO="$(cd "$(dirname "$0")" && pwd)"
OUT="$REPO/_dist/starter"
if [ "$1" = "--out" ]; then
    if [ -z "$2" ]; then echo "--out needs a folder."; exit 1; fi
    mkdir -p "$2"
    OUT="$(cd "$2" && pwd)"
fi

if [ -d "$OUT" ] && [ -n "$(ls -A "$OUT")" ]; then
    if [ ! -f "$OUT/_starter.txt" ]; then echo "$OUT has files that this script did not make: nothing was changed."; exit 1; fi
    rm -rf "$OUT"
fi
mkdir -p "$OUT"

# The terser package (npx downloads it once).
terserBin="$(npx --yes -p terser -c 'command -v terser' 2>/dev/null)"
if [ -z "$terserBin" ]; then echo "terser could not be loaded with npx."; exit 1; fi
export TERSER_DIR="$(cd "$(dirname "$terserBin")/../terser" && pwd)"

node - "$REPO" "$OUT" <<'NODE'
const fs = require("fs"), path = require("path"), vm = require("vm");
const terser = require(process.env.TERSER_DIR);
(async function () {
const repo = process.argv[2], out = process.argv[3];
const copy = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.cpSync(from, to, { recursive: true, filter: (f) => path.basename(f) !== ".DS_Store" }); };
const inRepo = (name) => path.join(repo, name);
const inBasic = (name) => path.join(out, "_basic", name);
const textFile = /\.(js|htm|html|md|css)$/;

const walk = function (folder, onFile) {
    fs.readdirSync(folder, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    });
};

// "../comp/x", "../../comp/x", 'comp/x' in a text: "_basic/comp/x"
const PATHS_AT_ROOT = function (text) {
    return text
        .replace(/(["'`(])(?:\.\.\/)+(basic|comp|assets)\//g, "$1_basic/$2/")
        .replace(/(["'`(])(?:\.\.\/)+01-basic-js-by-example\/assets\//g, "$1_basic/assets/tutorial/")
        .replace(/02-comp-examples\//g, "_basic/examples/");
};

// *** PROJECT FILES
copy(inRepo("_starter"), out);
fs.renameSync(path.join(out, "gitignore"), path.join(out, ".gitignore")); // WHY: npm drops a file named .gitignore
fs.mkdirSync(inBasic("tools"), { recursive: true });
fs.readdirSync(path.join(out, "tools")).forEach((name) => fs.renameSync(path.join(out, "tools", name), inBasic("tools/" + name)));
const toolVersion = JSON.parse(fs.readFileSync(inRepo("_npm/create-basicjs/package.json"), "utf8")).version;
fs.writeFileSync(inBasic("VERSION"), toolVersion + "\n");
fs.rmSync(path.join(out, "tools"), { recursive: true });
fs.mkdirSync(path.join(out, "assets"));
fs.writeFileSync(path.join(out, "assets", ".gitkeep"), "");

// *** LIBRARY
["basic.js", "basic.css", "basic.min.js", "basic.min.css", "scroll-bar.js", "scroll-bar.min.js", "LICENSE", "font"].forEach(function (name) {
    copy(inRepo("basic/" + name), inBasic("basic/" + name));
});

// *** COMPONENTS
copy(inRepo("comp"), inBasic("comp"));

// *** EXAMPLES
copy(inRepo("02-comp-examples"), inBasic("examples"));
const exampleFolders = fs.readdirSync(inBasic("examples"), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const localPaths = new RegExp("([\"'`(])(" + exampleFolders.join("|") + ")/", "g");
const examplePages = new Set(fs.readdirSync(inBasic("examples")).filter((name) => name.endsWith(".htm")));
const toLocalPage = (found, quote, name) => examplePages.has(name) ? quote + "_basic/examples/" + name : found; // an example opened by another one
walk(inBasic("examples"), function (file) {
    if (!file.endsWith(".htm")) return;
    const text = PATHS_AT_ROOT(fs.readFileSync(file, "utf8")).replace(localPaths, "$1_basic/examples/$2/").replace(/(["'`])([a-z0-9-]+\.htm)/g, toLocalPage);
    if (!/<head>/.test(text)) throw new Error("no <head>: " + file);
    fs.writeFileSync(file, text.replace(/<head>/, '<head>\n    <base href="../../"><!-- This page uses the paths of a page at the root of the project. -->'));
});
walk(inBasic("comp"), function (file) {
    if (!textFile.test(file)) return;
    fs.writeFileSync(file, PATHS_AT_ROOT(fs.readFileSync(file, "utf8")));
});

// *** MINIFIED COMPONENTS: for tools/build.js
fs.mkdirSync(inBasic("min"), { recursive: true });
const components = fs.readdirSync(inBasic("comp")).filter((name) => name.endsWith(".js") && !name.endsWith(".min.js"));
for (const name of components) {
    const result = await terser.minify(fs.readFileSync(inBasic("comp/" + name), "utf8"), { compress: true, mangle: true, format: { comments: /Bismillah/ } });
    fs.writeFileSync(inBasic("min/" + name.replace(/\.js$/, ".min.js")), result.code);
}

// *** ASSETS: only the files that the components and the examples name
const used = new Set();
const collect = function (file) {
    if (!textFile.test(file)) return;
    (fs.readFileSync(file, "utf8").match(/_basic\/assets\/[^"'`)\s]+/g) || []).forEach((p) => used.add(p.replace("_basic/assets/", "")));
};
walk(inBasic("comp"), collect);
walk(inBasic("examples"), collect);
used.forEach(function (name) {
    const from = inRepo("assets/" + name);
    if (fs.existsSync(from)) copy(from, inBasic("assets/" + name));
});

// The pictures of the tutorial that the examples name in code (Ex: "carrot.png" in a list)
const tutorialAssets = inRepo("01-basic-js-by-example/assets");
const exampleTexts = [];
walk(inBasic("examples"), (file) => { if (file.endsWith(".htm")) exampleTexts.push(fs.readFileSync(file, "utf8")); });
const allExamples = exampleTexts.filter((text) => text.includes("_basic/assets/tutorial/")).join("\n");
fs.readdirSync(tutorialAssets).forEach(function (name) {
    if (allExamples.includes(name)) copy(path.join(tutorialAssets, name), inBasic("assets/tutorial/" + name));
});

// *** DOCUMENTS
["basic-js-core.md", "basic-js-components.md", "basic-js-code-rules.md", "basic-js-animated-rules.md"].forEach(function (name) {
    const text = fs.readFileSync(inRepo("context/" + name), "utf8");
    fs.mkdirSync(inBasic("docs"), { recursive: true });
    fs.writeFileSync(inBasic("docs/" + name), PATHS_AT_ROOT(text).replace(/(^|[\s(`"])comp\/([a-z])/g, "$1_basic/comp/$2"));
});
copy(inRepo("basic/basic-what-is-new.md"), inBasic("docs/what-is-new.md"));
copy(inRepo("_component-template.js"), inBasic("docs/component-template.js"));
copy(inRepo("__handbook/english"), inBasic("docs/handbook"));
["test-project.htm", "test.png"].forEach((name) => fs.rmSync(inBasic("docs/handbook/" + name), { force: true }));

// *** THE LIST OF THE COMPONENTS, from the catalog
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(inRepo("index/catalog.js"), "utf8") + ";this.LIST = CATALOG.COMPONENTS;", context);
const rows = ["# The components", "", "Each one: its file, the files it needs (load them first), and its examples.", ""];
const categories = {};
context.LIST.forEach(function (item) {
    (categories[item.cat] = categories[item.cat] || []).push(item);
});
const atRoot = (file) => PATHS_AT_ROOT('"../' + file + '"').slice(1, -1).replace(/^\.\.\//, "");
Object.keys(categories).forEach(function (category) {
    rows.push("## " + category, "");
    categories[category].forEach(function (item) {
        rows.push("### " + item.name, "", item.en, "", "- file: `_basic/" + item.source + "`");
        if (item.deps && item.deps.length) rows.push("- needs: " + item.deps.map((d) => "`_basic/" + d + "`").join(", "));
        const samples = (item.samples || []).map((s) => "`" + atRoot(s.file || s) + "`");
        if (samples.length) rows.push("- examples: " + samples.join(", "));
        rows.push("");
    });
});
fs.writeFileSync(inBasic("docs/component-index.md"), rows.join("\n"));

fs.writeFileSync(path.join(out, "_starter.txt"), "Made by _make-starter.sh of the js-components repository.\n");
console.log("Components: " + context.LIST.length + ", assets: " + used.size);
})().catch(function (error) { console.error(error); process.exit(1); });
NODE

echo "Done: $OUT ($(du -sh "$OUT" | cut -f1))"
