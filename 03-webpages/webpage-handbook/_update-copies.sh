#!/bin/bash

# Bismillah
#
# Refreshes the copies that make this site work on its own (outside the repository):
#   basic/     <- ../../basic      (basic.min.js, basic.min.css, scroll-bar.min.js, the font and the pictures)
#   comp/      <- ../../comp       (web-view, search-results, toast: the site; tooltip, smart-button, text-field,
#                                   dialog, select-box: the examples that use a component, js/code-block.js -> KIT)
#   handbook/  <- ../../__handbook (english/, turkce/: the chapters and the files of their examples)
#
# Run it after the library, a component or a chapter of the handbook is changed:
#   ./03-webpages/webpage-handbook/_update-copies.sh      (from anywhere)
#
# The components have no .min.js twins, so their .min.js files are made here with terser (npx, like _make-min-js.sh).
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
cp -R "$REPO/basic/font" "$SITE/basic/"
echo "  basic/     ok"

# COMP
rm -rf "$SITE/comp"
mkdir -p "$SITE/comp"
# WHY the notice: terser keeps only the Bismillah line of a header (as _make-min-js.sh does)
addNotice() {
    local source="$1" min="$2" notice
    notice="$(grep -m1 -E '^[[:space:]]*Copyright [0-9]' "$source" | sed -E 's/^[[:space:]]+//')"
    [ -n "$notice" ] || return 0
    notice="/*! $notice | Apache-2.0 | https://bug7a.github.io/js-components/ */"
    { head -n 1 "$min"; echo "$notice"; tail -n +2 "$min"; } > "$min.tmp" && mv "$min.tmp" "$min"
}

# WHY from the source: the components have no .min twins in the repository (2026-10-30)
for name in web-view search-results toast tooltip smart-button text-field dialog select-box; do
    npx --yes terser "$REPO/comp/$name.js" --compress --mangle --comments "/Bismillah/" -o "$SITE/comp/$name.min.js"
    addNotice "$REPO/comp/$name.js" "$SITE/comp/$name.min.js"
    node --check "$SITE/comp/$name.min.js"
done
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
// WHY: Not needed offline: notes, this script, sitemap.xml (for search engines), the link preview picture (assets/og-image.jpg; the logo in assets/ is saved). (The app files are saved by easy-pwa.js itself.)
const skip = /^(readme\.md|sitemap\.xml|_update-copies\.sh|assets\/og-image\.jpg|\.DS_Store|.*\/\.DS_Store)/;
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
