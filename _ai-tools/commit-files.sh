#!/bin/bash
# Bismillah
#
# commit-files - v26.11
# Commit some files without the shared index.
#
# The sessions that work in this folder at the same time share one index: a "git add" of one goes into the
# commit of another. This script makes the commit in a temporary index, from HEAD and the given files only,
# and moves main only when HEAD is still the commit it started from.
#
# USAGE:
#   ./_ai-tools/commit-files.sh -m "message" a.js b.htm           a.js and b.htm as they are in the folder
#   ./_ai-tools/commit-files.sh -F message.txt a.js               the message from a file (a text of more lines)
#   ./_ai-tools/commit-files.sh -m "..." test/x.htm=/tmp/x.htm    test/x.htm with the text of /tmp/x.htm (Ex: HEAD and only my
#                                                        lines of a page that other sessions change too)
#   ./_ai-tools/commit-files.sh --dry-run -m "..." a.js           what would be committed (its diff); nothing is committed
#   ./_ai-tools/commit-files.sh -m "..." new.js --delete old.js   old.js leaves the repository (a moved file: the new path, and
#                                                        --delete the old one; it must not be in the folder any more)
#
# The paths are from the root of the repository; a version file (file=version) and the message file from the
# folder you are in. It prints the files of the commit and the commit. After it the shared index follows HEAD
# for these files, unless something of them is staged there (then it says so and leaves it).
# A file of the folder is committed whole: give a version (file=version) when other sessions changed lines of it.
# A test page in the commit: run it as it is in the commit after it (node test/run-tests.js behavior --commit HEAD).
#
# WHY not git commit: it commits the shared index, with what others added to it.
# WHY commit-tree and update-ref with the old HEAD: a commit of another session between the start and the end
#     would be undone without a word (the tree is made from the HEAD of the start).
#
# Started Date: November 2026
# Webpage: https://bug7a.github.io/js-components/
#
# Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
# Licensed under the Apache License, Version 2.0
# SPDX-License-Identifier: Apache-2.0

set -u
CALLER_DIR="$(pwd)"
# The root of the repository (this script is in its _ai-tools folder)
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)" || exit 1

MESSAGE=""
MESSAGE_FILE=""
IS_DRY_RUN=0
ENTRIES=()
DELETIONS=()

# A path from the folder of the caller (an absolute path stays as it is)
fromCaller() {
    case "$1" in
        /*) echo "$1" ;;
        *) echo "$CALLER_DIR/$1" ;;
    esac
}

while [ $# -gt 0 ]; do
    case "$1" in
        -m) MESSAGE="${2:-}"; shift 2 ;;
        -F) MESSAGE_FILE="$(fromCaller "${2:-}")"; shift 2 ;;
        --dry-run) IS_DRY_RUN=1; shift ;;
        --delete) DELETIONS+=("${2:-}"); shift 2 ;;
        -h|--help) sed -n '4,/^$/p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) ENTRIES+=("$1"); shift ;;
    esac
done

if [ -z "$MESSAGE" ] && [ -z "$MESSAGE_FILE" ] && [ "$IS_DRY_RUN" = 0 ]; then
    echo "A message is needed: -m \"...\" or -F file"
    exit 2
fi
if [ ${#ENTRIES[@]} -eq 0 ] && [ ${#DELETIONS[@]} -eq 0 ]; then
    echo "No file to commit."
    exit 2
fi

START_HEAD="$(git rev-parse HEAD)"
TEMP_DIR="$(mktemp -d -t commit-files)"
trap 'rm -rf "$TEMP_DIR"' EXIT
export GIT_INDEX_FILE="$TEMP_DIR/index"
git read-tree "$START_HEAD"

PATHS=()
# WHY ${X[@]+"${X[@]}"}: an empty array is an unbound variable for "set -u" in the bash of macOS (3.2)
for entry in ${ENTRIES[@]+"${ENTRIES[@]}"}; do
    path="${entry%%=*}"
    source="$path"
    [ "$entry" != "$path" ] && source="$(fromCaller "${entry#*=}")"
    if [ ! -f "$source" ]; then
        echo "Not a file: $source"
        exit 2
    fi
    # The mode of the file in HEAD (a new one: its own)
    mode="$(git ls-tree "$START_HEAD" -- "$path" | awk '{ print $1 }')"
    if [ -z "$mode" ]; then
        mode="100644"
        [ -x "$source" ] && mode="100755"
    fi
    # WHY --path: the attributes of the path in the repository count, also for a version file in /tmp
    blob="$(git hash-object -w --path="$path" -- "$source")" || exit 2
    git update-index --add --cacheinfo "$mode,$blob,$path" || exit 2
    PATHS+=("$path")
done

for path in ${DELETIONS[@]+"${DELETIONS[@]}"}; do
    if [ -e "$path" ]; then
        echo "Still in the folder (move or delete it first): $path"
        exit 2
    fi
    if [ -z "$(git ls-tree "$START_HEAD" -- "$path")" ]; then
        echo "Not in HEAD: $path"
        exit 2
    fi
    git update-index --force-remove -- "$path" || exit 2
    PATHS+=("$path")
done

if git diff --cached --quiet "$START_HEAD"; then
    echo "Nothing to commit: the files are as they are in HEAD."
    exit 1
fi
git diff --cached --stat "$START_HEAD"
if [ "$IS_DRY_RUN" = 1 ]; then
    git diff --cached "$START_HEAD"
    exit 0
fi

TREE="$(git write-tree)"
if [ -n "$MESSAGE_FILE" ]; then
    COMMIT="$(git commit-tree "$TREE" -p "$START_HEAD" -F "$MESSAGE_FILE")" || exit 2
else
    COMMIT="$(git commit-tree "$TREE" -p "$START_HEAD" -m "$MESSAGE")" || exit 2
fi
unset GIT_INDEX_FILE

if ! git update-ref -m "commit: $(git log -1 --format=%s "$COMMIT")" HEAD "$COMMIT" "$START_HEAD"; then
    echo "HEAD moved while this ran: nothing was committed. Run it again (a version file: make it again on the new HEAD)."
    exit 1
fi
git log --oneline -1

# The shared index: it held the old HEAD of these files; without this its next commit would undo this one.
for path in "${PATHS[@]}"; do
    shared="$(git ls-files -s -- "$path" | awk '{ print $2 }')"
    old="$(git rev-parse -q --verify "$START_HEAD:$path" 2>/dev/null || true)"
    if [ "$shared" = "$old" ]; then
        git reset -q -- "$path"
    else
        echo "Left as it is in the shared index (something of it is staged there): $path"
    fi
done

for path in "${PATHS[@]}"; do
    case "$path" in
        test/*-test.htm|test/behavior/*) echo "A test page is in it: run it as it is in the commit (node test/run-tests.js ... --commit HEAD)." ; break ;;
    esac
done
