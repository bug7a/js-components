#!/bin/bash
# Bismillah
#
# Makes the content of the GitHub repository javascript-mobile-app-template from this repository.
# v26.11 - Bugra Ozden
#
# The mobile templates are developed here, in 04-templates/mobile-app-template/. The repository
# javascript-mobile-app-template holds their ready copies: every template in its own folder, with its own
# basic/ and comp/ (made by _make-standalone.sh) and an index.html, so that one folder works alone.
#
# This script writes those files into a local clone of that repository. It never commits or pushes: look at
# the changes in GitHub Desktop and commit them there.
#
# The files of the root of that repository (README.md, index.html, CONTRIBUTING.md, .gitignore) are in
# 04-templates/mobile-app-template/_repo-files/: change them there, not in the copy.
#
# It keeps .git, every .DS_Store and the folders of KEEP_FOLDERS of the clone. Everything else in the clone is
# made again: a file changed there by hand is overwritten. (git still has it.)
#
# USAGE:
#   ./_make-template-repo.sh                 Writes into the default clone (TARGET below).
#   ./_make-template-repo.sh ~/some/clone    Writes into the given clone.
#   ./_make-template-repo.sh --list          Only shows what would change. Nothing is written.
#
# A new template: add its folder to TEMPLATES, and to the table and the list of _repo-files.
#
# It needs node (npx downloads terser, like _make-standalone.sh).

set -euo pipefail
cd "$(dirname "$0")" || exit 1   # the repo root

# *** SETTINGS:

TARGET="$HOME/Documents/GitHub/javascript-mobile-app-template"
TEMPLATE_DIR="04-templates/mobile-app-template"
TEMPLATES="starter classic coffee-shop shop booking"
ROOT_FILES="README.md index.html CONTRIBUTING.md .gitignore"
KEEP_FOLDERS="sample"   # folders of the clone that are not made here (the user's own, not in git)
REPOSITORY_NAME="javascript-mobile-app-template"

# *** PRIVATE FUNCTIONS:

fail() {
    echo "$1" >&2
    exit 1
}

# WHY: --delete below clears the folder: it must be the clone of the right repository.
checkTarget() {
    [ -d "$TARGET/.git" ] || fail "Not a git clone: $TARGET"
    local remote
    remote="$(git -C "$TARGET" remote get-url origin 2>/dev/null || true)"
    case "$remote" in
        *"$REPOSITORY_NAME"*) ;;
        *) fail "This clone is not $REPOSITORY_NAME: $remote" ;;
    esac
}

# The readme of a template, for a folder that stands alone.
adaptReadmes() {
    node - "$1" <<'NODE'
const fs = require("fs"), path = require("path");
const output = process.argv[2];
const replaceAll = (text, from, to) => text.split(from).join(to);
fs.readdirSync(output, { withFileTypes: true }).filter((entry) => entry.isDirectory()).forEach(function (entry) {
    const file = path.join(output, entry.name, "readme.md");
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, "utf8");
    text = text.replace(/## A copy outside the repository\n[\s\S]*?(?=\n## |$)/, "");
    text = replaceAll(text, "Open `index.htm` with a web server (Live Server: port 5505).", "Open `index.html` with a web server (the VS Code Live Server extension).");
    text = replaceAll(text, "native project, and rename `index.htm` to `index.html`. The steps are in [`../readme.md`](../readme.md).", "native project. The steps are in the [main readme](../README.md).");
    text = replaceAll(text, "`index.htm`", "`index.html`");
    text = replaceAll(text, "the files of the standalone copy in the `www` folder", "the files of this folder in the `www` folder");
    text = text.replace(/For Android and iOS, see .*\n/, "For Android and iOS, see the [main readme](../README.md).\n");
    text = replaceAll(text, "- Depo kökünden bir HTTP sunucusu başlat: `python3 -m http.server 5505 --bind 127.0.0.1`.\n- `http://127.0.0.1:5505/04-templates/mobile-app-template/coffee-shop/index.htm` adresini aç.\n",
        "- Bu klasörde bir HTTP sunucusu başlat: `python3 -m http.server 5505 --bind 127.0.0.1`.\n- `http://127.0.0.1:5505/index.html` adresini aç.\n");
    text = replaceAll(text, "- Ortak `../../../basic/` ve `../../../comp/` dosyalarını salt okunur bağımlılık olarak kullanır. Bu klasör tek başına taşınırsa bağımlılıkları da paketlemek gerekir.\n",
        "- `basic/` ve `comp/` bu klasörün içindedir: klasör tek başına çalışır.\n");
    text = text.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
    fs.writeFileSync(file, text);
    if (text.includes("_make-standalone") || text.includes("../../../")) console.error("   CHECK: " + file);
});
NODE
}

makeTemplate() {
    local name="$1" output="$2"
    ./_make-standalone.sh "$TEMPLATE_DIR/$name" --out "$output/$name" | grep '^Done' | sed 's/, in .*//' | sed "s/^Done/   $name/"
    sed -i.bak 's#"../../../comp/"#"comp/"#' "$output/$name/app/settings.js"
    rm "$output/$name/app/settings.js.bak"
    mv "$output/$name/index.htm" "$output/$name/index.html"
    rm -f "$output/$name/_standalone.txt"
}

isKeptFolder() {
    local kept
    for kept in $KEEP_FOLDERS; do
        [ "$1" = "$kept" ] && return 0
    done
    return 1
}

# Folders that held only .DS_Store files stay after rsync (it keeps them): they go.
# WHY the kept folders are skipped: they are the user's own; their files are not made here.
removeEmptyFolders() {
    local folder
    while IFS= read -r folder; do
        isKeptFolder "$(basename "$folder")" && continue
        if [ -z "$(find "$folder" ! -type d ! -name .DS_Store -print -quit)" ]; then rm -rf "$folder"; fi
    done < <(find "$TARGET" -mindepth 1 -maxdepth 1 -type d ! -name .git)
}

# *** MAIN:

IS_LIST=0
for argument in "$@"; do
    case "$argument" in
        --list) IS_LIST=1 ;;
        -*) fail "Unknown option: $argument" ;;
        *) TARGET="$argument" ;;
    esac
done

checkTarget

OUTPUT="$(mktemp -d)"
CHANGES="$(mktemp)"   # WHY not in OUTPUT: everything in OUTPUT goes to the clone.
trap 'rm -rf "$OUTPUT" "$CHANGES"' EXIT

echo "Making the templates:"
for name in $TEMPLATES; do makeTemplate "$name" "$OUTPUT"; done
adaptReadmes "$OUTPUT"
for file in $ROOT_FILES; do cp "$TEMPLATE_DIR/_repo-files/$file" "$OUTPUT/"; done
cp LICENSE "$OUTPUT/"

OPTIONS=(-rc --delete --exclude=.git --exclude=.DS_Store --itemize-changes)
for folder in $KEEP_FOLDERS; do OPTIONS+=("--exclude=/$folder/"); done

if [ "$IS_LIST" = 1 ]; then
    echo "What would change in $TARGET:"
    # WHY the grep: a line with only "T" is a file with another date and the same content.
    rsync "${OPTIONS[@]}" -n "$OUTPUT/" "$TARGET/" | grep -v '^\.f\.\.T\.\.\.\. ' | cut -c1-100 || true
    echo "(--list: nothing was written)"
    exit 0
fi

rsync "${OPTIONS[@]}" "$OUTPUT/" "$TARGET/" 2>/dev/null > "$CHANGES" || [ $? -eq 23 ]   # 23: a folder with only .DS_Store
removeEmptyFolders

echo "Done: $(grep -vc '^\.f\.\.T\.\.\.\. ' "$CHANGES" || true) change(s) in $TARGET. Look at them in GitHub Desktop and commit there."
