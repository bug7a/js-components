# Bismillah
"""version-of - v26.11
The version of a file to commit with ./_commit-files.sh (file=version): the file as it is in HEAD, with only those
changes of the folder's file that are mine.

WHY: the sessions share one folder; a file that others change too (Ex: test/behavior-test.htm) is committed with HEAD and
my lines only, and that version was made by hand in every job (a lost blank line, a version made from an old HEAD).

Usage (from the root of the repository):
    python3 _ai-tools/version-of.py test/behavior-test.htm --with "SmartTable: a click on a row" -o /tmp/x/version.htm
    ./_commit-files.sh -F message.txt comp/smart-table.js test/behavior-test.htm=/tmp/x/version.htm

    --with TEXT     a change is mine when one of its lines has this text (more --with: any of them)
    --lines A-B     a change is mine when it touches these lines of the folder's file (1-based; more: any of them)
    -o FILE         where the version goes (without it: printed)
Every change is listed on stderr ("mine" or "left", its lines in the folder's file and its first line), so the choice can
be checked; exit code 1 when no change is mine.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
"""

import argparse
import re
import subprocess
import sys

HUNK_HEADER = re.compile(r"^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@")


def run_git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def changes_of(path):
    """The changes of the folder's file against HEAD: [{old_start, old_count, new_start, new_count, lines}]."""
    changes = []
    for line in run_git("diff", "-U0", "--no-color", "--no-ext-diff", "HEAD", "--", path).splitlines():
        header = HUNK_HEADER.match(line)
        if header:
            old_start, old_count, new_start, new_count = header.groups()
            changes.append({"old_start": int(old_start), "old_count": int(old_count or 1), "new_start": int(new_start),
                            "new_count": int(new_count or 1), "lines": []})
        elif changes and line[:1] in ("+", "-") and not line.startswith(("+++", "---")):
            changes[-1]["lines"].append(line)
    return changes


def touches(change, first, last):
    start = change["new_start"]
    end = start + max(change["new_count"], 1) - 1
    return start <= last and first <= end


def is_mine(change, texts, ranges):
    if any(text in line for line in change["lines"] for text in texts):
        return True
    return any(touches(change, first, last) for first, last in ranges)


def apply(head_lines, work_lines, changes):
    """HEAD with these changes; the new lines come from the folder's file (its own line ends)."""
    version = list(head_lines)
    for change in sorted(changes, key=lambda change: change["old_start"], reverse=True):
        new_lines = work_lines[change["new_start"] - 1:change["new_start"] - 1 + change["new_count"]] if change["new_count"] else []
        if change["old_count"] == 0:
            version[change["old_start"]:change["old_start"]] = new_lines  # WHY: "-12,0" adds after line 12
        else:
            version[change["old_start"] - 1:change["old_start"] - 1 + change["old_count"]] = new_lines
    return version


def line_range(text):
    first, _, last = text.partition("-")
    return int(first), int(last or first)


def main():
    parser = argparse.ArgumentParser(description="HEAD of a file with only my changes of the folder's file.")
    parser.add_argument("path", help="the file, from the root of the repository")
    parser.add_argument("--with", dest="texts", action="append", default=[], help="a text of my lines")
    parser.add_argument("--lines", action="append", default=[], type=line_range, help="A-B: my lines in the folder's file")
    parser.add_argument("-o", dest="output", default="", help="the version file (printed without it)")
    arguments = parser.parse_args()
    if not arguments.texts and not arguments.lines:
        parser.error("give --with or --lines: which changes are mine")

    head_text = run_git("show", f"HEAD:{arguments.path}")
    with open(arguments.path, encoding="utf-8", newline="") as file:
        work_text = file.read()
    head_lines = head_text.splitlines(keepends=True)
    work_lines = work_text.splitlines(keepends=True)
    changes = changes_of(arguments.path)
    # WHY: every change on HEAD must give the folder's file, else the changes were read wrong
    if "".join(apply(head_lines, work_lines, changes)) != work_text:
        sys.exit("version-of: the changes do not give the folder's file again; make this version by hand")

    mine = [change for change in changes if is_mine(change, arguments.texts, arguments.lines)]
    for change in changes:
        first = change["new_start"]
        last = first + max(change["new_count"], 1) - 1
        mark = "mine" if change in mine else "left"
        print(f"{mark}  lines {first}-{last}: {(change['lines'] or [''])[0][:100]}", file=sys.stderr)
    if not mine:
        sys.exit("version-of: no change is mine")

    version = "".join(apply(head_lines, work_lines, mine))
    if arguments.output:
        with open(arguments.output, "w", encoding="utf-8", newline="") as file:
            file.write(version)
    else:
        sys.stdout.write(version)


if __name__ == "__main__":
    main()
