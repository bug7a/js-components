#!/bin/bash
# Bismillah
#
# Make the .min.js twins of the library and the components.
# v26.09 - Bugra Ozden
#
# There is no build system in this repo: every page loads its scripts with <script src>,
# and most sources have a hand-made "name.min.js" next to them that the samples and the
# templates load. When a source is edited and its twin is not, those pages keep running
# the old code. This script finds and rebuilds those twins. Nothing else is touched.
#
# USAGE:
#   ./_make-min-js.sh                    Lists the stale twins. Writes nothing. (default)
#   ./_make-min-js.sh --build            Rebuilds only the stale twins.
#   ./_make-min-js.sh --build --all      Rebuilds every twin.
#   ./_make-min-js.sh --build a.js b.js  Rebuilds the twins of the given sources.
#
# NOTE: "stale" = the source file is newer than its .min.js (file dates). A fresh
#       "git clone" or a branch change can rewrite the dates, so after one of those
#       run "--build --all" or trust git instead of this list.
#
# It only needs node (npx downloads terser). A twin is never created for a source
# that does not already have one.

set -u
cd "$(dirname "$0")" || exit 1

# *** SETTINGS:

SOURCE_DIRS="basic comp-m1 comp-m2 comp-m3 comp-m4"
KEEP_COMMENTS="/Bismillah/"                       # the house header stays in the min file
KEEP_COMMENTS_BASIC="/Bismillah|basic\.js \(v/"   # basic.js also keeps its version line

# *** PRIVATE FUNCTIONS:

# Is this source ours to minify? (no min twins for the frozen and the obsolete files)
isSkipped() {
    case "$(basename "$1")" in
        *.min.js | basic-bugra.js | delete-* | unfinished-*) return 0 ;;
    esac
    return 1
}

# Every source that has a .min.js next to it.
collectSources() {
    local dir file
    for dir in $SOURCE_DIRS; do
        [ -d "$dir" ] || continue
        for file in "$dir"/*.js; do
            [ -f "$file" ] || continue
            isSkipped "$file" && continue
            [ -f "${file%.js}.min.js" ] && echo "$file"
        done
    done
}

# Writes the .min.js of one source. Returns 1 when terser or the syntax check fails.
buildOne() {
    local src="$1" min="${1%.js}.min.js" comments="$KEEP_COMMENTS" tempDir temp

    [ "$src" = "basic/basic.js" ] && comments="$KEEP_COMMENTS_BASIC"

    # NOTE: the temp file must end with ".js", "node --check" refuses the random mktemp name.
    tempDir="$(mktemp -d)"
    temp="$tempDir/out.js"

    if ! npx --yes terser "$src" --compress --mangle --comments "$comments" -o "$temp" 2>/tmp/terser-error.txt; then
        echo "   FAILED (terser): $src"; sed 's/^/      /' /tmp/terser-error.txt | head -4; rm -rf "$tempDir"; return 1
    fi

    if ! node --check "$temp" 2>/dev/null; then
        echo "   FAILED (broken output): $src"; rm -rf "$tempDir"; return 1
    fi

    cat "$temp" > "$min"   # not mv: the file keeps its permissions
    rm -rf "$tempDir"
    printf "   %-34s %6s -> %s bytes\n" "$min" "$(wc -c < "$src" | tr -d ' ')" "$(wc -c < "$min" | tr -d ' ')"
    return 0
}

# *** MAIN:

isBuild=0; isAll=0; givenFiles=""

for argument in "$@"; do
    case "$argument" in
        --build) isBuild=1 ;;
        --all)   isAll=1 ;;
        -h | --help) sed -n '3,25p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        -*) echo "Unknown option: $argument (try --help)"; exit 1 ;;
        *)  givenFiles="$givenFiles $argument"; isBuild=1 ;;
    esac
done

# WHICH SOURCES:
if [ -n "$givenFiles" ]; then
    targets="$givenFiles"
else
    targets=""
    for src in $(collectSources); do
        if [ "$isAll" = 1 ] || [ "$src" -nt "${src%.js}.min.js" ]; then targets="$targets $src"; fi
    done
fi

targets="$(echo $targets)"   # trims

if [ -z "$targets" ]; then
    echo "Every .min.js is up to date."
    exit 0
fi

# LIST ONLY:
if [ "$isBuild" = 0 ]; then
    echo "Stale .min.js twins (the source is newer):"
    for src in $targets; do echo "   $src"; done
    echo
    echo "$(echo $targets | wc -w | tr -d ' ') file(s). Run \"./_make-min-js.sh --build\" to rebuild them."
    exit 0
fi

# BUILD:
echo "Making the .min.js files..."
failCount=0
for src in $targets; do
    if [ ! -f "$src" ]; then echo "   NOT FOUND: $src"; failCount=$((failCount + 1)); continue; fi
    buildOne "$src" || failCount=$((failCount + 1))
done

echo
if [ "$failCount" = 0 ]; then
    echo "Done. $(echo $targets | wc -w | tr -d ' ') file(s)."
else
    echo "Done with $failCount error(s)."
    exit 1
fi
