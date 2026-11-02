#!/bin/bash

# Bismillah
#
# Makes the npm package create-basicjs in _dist/create-basicjs/ (2026-11-02, the user): _npm/create-basicjs/, the
# starter (./_make-starter.sh) and the mobile templates with their paths for the root of a project.
# It never publishes. To publish, raise the version in _npm/create-basicjs/package.json, run this, then:
#   cd _dist/create-basicjs && npm publish --access public

set -e

REPO="$(cd "$(dirname "$0")" && pwd)"
OUT="$REPO/_dist/create-basicjs"

rm -rf "$OUT"
mkdir -p "$OUT/payload"
cp -R "$REPO/_npm/create-basicjs/." "$OUT/"
"$REPO/_make-starter.sh" --out "$OUT/payload/starter"

node - "$REPO" "$OUT" <<'NODE'
const fs = require("fs"), path = require("path");
const repo = process.argv[2], out = process.argv[3];
const starter = path.join(out, "payload", "starter");
const TEMPLATE_NAMES = ["starter", "classic", "shop", "booking", "coffee-shop"];
const TEXT_FILE = /\.(js|htm|css)$/;

fs.rmSync(path.join(starter, "_starter.txt"));
fs.renameSync(path.join(starter, ".gitignore"), path.join(starter, "gitignore")); // WHY: npm leaves a .gitignore out of a package

const walk = function (folder, onFile) {
    fs.readdirSync(folder, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    });
};

TEMPLATE_NAMES.forEach(function (name) {
    const target = path.join(out, "payload", "templates", name);
    fs.cpSync(path.join(repo, "04-templates/mobile-app-template", name), target, { recursive: true, filter: (f) => path.basename(f) !== ".DS_Store" });
    fs.renameSync(path.join(target, "readme.md"), path.join(target, "TEMPLATE.md"));
    walk(target, function (file) {
        if (!TEXT_FILE.test(file)) return;
        const text = fs.readFileSync(file, "utf8");
        const rewritten = text.replace(/(["'`])\.\.\/\.\.\/\.\.\/(basic|comp|assets)\//g, "$1_basic/$2/");
        if (rewritten !== text) fs.writeFileSync(file, rewritten);
    });
});
NODE

find "$OUT" -name '.DS_Store' -delete
echo "Done: $OUT ($(du -sh "$OUT" | cut -f1))"
