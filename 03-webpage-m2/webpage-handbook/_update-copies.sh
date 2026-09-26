#!/bin/bash

# Bismillah
#
# Refreshes the copies that make this site work on its own (outside the repository):
#   basic/     <- ../../basic      (basic.min.js, basic.min.css, scroll-bar.min.js, the font and the pictures)
#   comp/      <- ../../comp-m4    (web-view.min.js, search-results.min.js, toast.min.js)
#   handbook/  <- ../../__handbook (english/, turkce/: the chapters and the files of their examples)
#
# Run it after the library, a component or a chapter of the handbook is changed:
#   ./03-webpage-m2/webpage-handbook/_update-copies.sh      (from anywhere)
#
# comp-m4/toast.js has no .min.js twin, so comp/toast.min.js is made here with terser (npx, like _make-min-js.sh).
#
# Then it writes offlineFiles in easy-pwa.js (between "OFFLINE FILES START" and "END"): every file of the site,
# so the app (PWA, offline mode) saves all the chapters and the files of the examples at the first visit.

set -e

SITE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$SITE/../.." && pwd)"

echo "Site: $SITE"

# BASIC
rm -rf "$SITE/basic"
mkdir -p "$SITE/basic"
cp "$REPO/basic/basic.min.js" "$REPO/basic/basic.min.css" "$REPO/basic/scroll-bar.min.js" "$REPO/basic/LICENSE" "$SITE/basic/"
cp -R "$REPO/basic/font" "$REPO/basic/img" "$SITE/basic/"
echo "  basic/     ok"

# COMP
rm -rf "$SITE/comp"
mkdir -p "$SITE/comp"
cp "$REPO/comp-m4/web-view.min.js" "$REPO/comp-m4/search-results.min.js" "$SITE/comp/"
npx --yes terser "$REPO/comp-m4/toast.js" --compress --mangle --comments "/Bismillah/" -o "$SITE/comp/toast.min.js"
node --check "$SITE/comp/toast.min.js"
echo "  comp/      ok"

# HANDBOOK
# WHY: "handbook", not "__handbook": Jekyll (GitHub Pages) does not publish the folders that start with "_".
rm -rf "$SITE/handbook"
mkdir -p "$SITE/handbook"
cp -R "$REPO/__handbook/english" "$REPO/__handbook/turkce" "$SITE/handbook/"
echo "  handbook/  ok"

# OFFLINE FILES of easy-pwa.js
node - "$SITE" <<'NODE'
const fs = require("fs"), path = require("path");
const site = process.argv[2];
// WHY: Not needed offline: notes, this script, the link preview picture (assets/og-image.jpg; the logo in assets/ is saved). (The app files are saved by easy-pwa.js itself.)
const skip = /^(readme\.md|_update-copies\.sh|assets\/og-image\.jpg|\.DS_Store|.*\/\.DS_Store)/;
const files = [];
const walk = function (dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(site, full).split(path.sep).join("/");
        if (skip.test(rel)) return;
        if (entry.isDirectory()) walk(full); else files.push(rel);
    });
};
walk(site);
files.sort();
const list = ["./"].concat(files).map(function (f) { return "            \"" + f + "\","; }).join("\n");
const file = path.join(site, "easy-pwa.js");
const text = fs.readFileSync(file, "utf8");
const re = /(\/\/ OFFLINE FILES START\n)[\s\S]*?(\n\s*\/\/ OFFLINE FILES END)/;
if (!re.test(text)) { console.error("  easy-pwa.js: OFFLINE FILES START / END not found"); process.exit(1); }
fs.writeFileSync(file, text.replace(re, "$1        offlineFiles: [\n" + list + "\n        ],$2"));
console.log("  easy-pwa.js offlineFiles: " + (files.length + 1) + " files");
NODE
