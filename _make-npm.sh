#!/bin/bash

# Bismillah
#
# Makes the npm package create-basicjs in _dist/create-basicjs/ (2026-11-02, the user): _npm/create-basicjs/, the
# starter (./_make-starter.sh) and the mobile templates with their paths for the root of a project.
# It never publishes. To publish, raise the version in _npm/create-basicjs/package.json, run this, then (from this
# folder: bin/verify-package.js stops a publish from _npm/create-basicjs/):
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
// from: its folder; levels: how many "../" go from its pages to the root of the repository
const TEMPLATES = [
    { name: "starter", from: "04-templates/mobile-app-template/starter", levels: 3 },
    { name: "classic", from: "04-templates/mobile-app-template/classic", levels: 3 },
    { name: "shop", from: "04-templates/mobile-app-template/shop", levels: 3 },
    { name: "booking", from: "04-templates/mobile-app-template/booking", levels: 3 },
    { name: "coffee-shop", from: "04-templates/mobile-app-template/coffee-shop", levels: 3 },
    { name: "panel", from: "04-templates/ozden-panel", levels: 2 },
    { name: "forms", from: "04-templates/web-forms", levels: 2 },
];
const NOT_IN_A_TEMPLATE = /^(\.DS_Store|delete-.*|basic)$/; // forms/basic/ only says where the library is
const TEXT_FILE = /\.(js|htm|css)$/;
const DEMO_EMAIL = "demo@example.com";

fs.rmSync(path.join(starter, "_starter.txt"));
fs.renameSync(path.join(starter, ".gitignore"), path.join(starter, "gitignore")); // WHY: npm leaves a .gitignore out of a package

const walk = function (folder, onFile) {
    fs.readdirSync(folder, { withFileTypes: true }).forEach(function (entry) {
        const full = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(full, onFile);
        else onFile(full);
    });
};

// "../../comp/" from a page of the template -> "_basic/comp/"; one "../" more (a page in a folder) stays one "../" more
const pathsInProject = function (text, levels) {
    const withFolders = text.replace(/(["'`])((?:\.\.\/)+)(basic|comp|assets)\//g, function (found, quote, ups, folder) {
        const extraLevels = ups.length / 3 - levels;
        return (extraLevels < 0) ? found : quote + "../".repeat(extraLevels) + "_basic/" + folder + "/";
    });
    return withFolders.replace(/(const LIB_PATH = ")((?:\.\.\/)+)(")/g, function (found, start, ups, end) {
        return start + "../".repeat(ups.length / 3 - levels) + "_basic/" + end;
    });
};

TEMPLATES.forEach(function (template) {
    const target = path.join(out, "payload", "templates", template.name);
    fs.cpSync(path.join(repo, template.from), target, { recursive: true, filter: (f) => !NOT_IN_A_TEMPLATE.test(path.basename(f)) });
    fs.renameSync(path.join(target, "readme.md"), path.join(target, "TEMPLATE.md"));
    fs.rmSync(path.join(target, "LICENSE"), { force: true });
    walk(target, function (file) {
        if (!TEXT_FILE.test(file)) return;
        const text = fs.readFileSync(file, "utf8");
        const rewritten = pathsInProject(text, template.levels).split("bugra.ozden@gmail.com").join(DEMO_EMAIL);
        if (rewritten !== text) fs.writeFileSync(file, rewritten);
    });
});

// WHY: A module page is shown in a frame of the panel, as high as its content: alone, the check would report its height.
const panelFolder = path.join(out, "payload", "templates", "panel");
fs.readdirSync(panelFolder).filter((name) => /^module\d+$/.test(name)).forEach(function (folder) {
    fs.readdirSync(path.join(panelFolder, folder)).filter((name) => name.endsWith(".htm")).forEach(function (name) {
        const file = path.join(panelFolder, folder, name);
        fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace(/<head>/, '<head>\n    <meta name="basic-check" content="skip">'));
    });
});

// The forms are separate pages: the start page lists them
const formsFolder = path.join(out, "payload", "templates", "forms");
const formPages = fs.readdirSync(formsFolder).filter((name) => name.endsWith(".htm"));
fs.mkdirSync(path.join(formsFolder, "app"));
fs.writeFileSync(path.join(formsFolder, "app", "app.js"), `"use strict";

// The start page: a list of the forms of this project. Open one and change it, or make this page your own.

const FORM_PAGES = ${JSON.stringify(formPages)};

const start = function () {

    page.color = "whitesmoke";

    const scrollBox = startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "center top", gap: 12, padding: [16, 40] });

            Label({ text: "Forms", fontSize: 28, fontFamily: "opensans-bold" });

            FORM_PAGES.forEach(function (fileName) {
                SmartButton({
                    labelText: fileName.replace(".htm", "").split("-").join(" "),
                    onClick: function () { location.href = fileName; },
                });
            });

        endGroup();

    endBox();

    ScrollBar({ scrollableBox: scrollBox });

};
`);
NODE

find "$OUT" -name '.DS_Store' -delete
echo "Done: $OUT ($(du -sh "$OUT" | cut -f1))"
