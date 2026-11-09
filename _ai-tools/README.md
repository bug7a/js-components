# _ai-tools: the helper scripts of the AI sessions

The scripts that make the work of an AI session in this repository easier: they are for the sessions, not for the pages
of the kit. A tool that people use too goes into the repository (`test/`, the root). In git since 2026-11-08, so a
session has them wherever the repository is (another computer, a session in the cloud).

- **Small:** only scripts and this README. What a script makes (a version of a file, a picture, a log) goes into the
  scratchpad of the session, never here; `.gitignore` of this folder keeps everything else out.
- **A script** has the house header (`# Bismillah`, its name and version, the license block) and its usage at the top.
- **Run from the root** of the repository.

| Script | What it does |
|---|---|
| `commit-files.sh` | A commit of the given files only, made in a temporary index: the sessions that work at the same time share one index, and a `git add` of one went into the commit of another. `file=version` commits a version of a file (HEAD with only my lines), `--delete` takes a file out, `--dry-run` shows the diff. A shared file (`CLAUDE.md`, `context/repo-map.md`, `_designs/readme.md` by lines; `index/catalog.js`, `test/behavior/*.js`, `test/behavior-test.htm`, `test/components-test.htm` by blocks) with more than one change is not committed whole: it lists the changes and stops (exit 2); `--mine <file>` when all are mine. `CLAUDE.md` ("Commit") says when. |
| `version-of.py` | The version of a file to commit with `./_ai-tools/commit-files.sh` (`file=version`): HEAD with only my changes of the folder's file (`--with "a text of my lines"` or `--lines A-B`). It lists every change as "mine" or "left" and checks that all the changes give the folder's file again. |
| `edit_text.py` | Text edits that never miss in silence: `replace(text, old, new, count)` and `replace_word(...)` stop when the count is not right; `load()` / `save()` keep the line ends (CRLF stays CRLF). A module for a python3 script. |

```bash
python3 _ai-tools/version-of.py test/behavior-test.htm --with "SmartTable: a click on a row" -o /tmp/x/behavior-test.htm
./_ai-tools/commit-files.sh -F message.txt comp/smart-table.js test/behavior-test.htm=/tmp/x/behavior-test.htm
```

```python
import sys; sys.path.insert(0, "_ai-tools")
from edit_text import load, save, replace
text = replace(load("comp/form.js"), "onSendClick: function(json) {},", "onSendClick: function(self, json) {},")
save("comp/form.js", text)
```
