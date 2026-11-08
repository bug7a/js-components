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
| `version-of.py` | The version of a file to commit with `./_commit-files.sh` (`file=version`): HEAD with only my changes of the folder's file (`--with "a text of my lines"` or `--lines A-B`). It lists every change as "mine" or "left" and checks that all the changes give the folder's file again. |
| `edit_text.py` | Text edits that never miss in silence: `replace(text, old, new, count)` and `replace_word(...)` stop when the count is not right; `load()` / `save()` keep the line ends (CRLF stays CRLF). A module for a python3 script. |

```bash
python3 _ai-tools/version-of.py test/behavior-test.htm --with "SmartTable: a click on a row" -o /tmp/x/behavior-test.htm
./_commit-files.sh -F message.txt comp/smart-table.js test/behavior-test.htm=/tmp/x/behavior-test.htm
```

```python
import sys; sys.path.insert(0, "_ai-tools")
from edit_text import load, save, replace
text = replace(load("comp/form.js"), "onSendClick: function(json) {},", "onSendClick: function(self, json) {},")
save("comp/form.js", text)
```

`_commit-files.sh` stays at the root: the commit rule of `CLAUDE.md` names it, and the sessions that run at the same
time call it there.
