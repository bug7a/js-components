# Bismillah
"""edit_text - v26.11
Text edits that never miss in silence: every replacement says how many times it must match, and stops when it does
not. The line ends of a file (LF or CRLF) stay as they are.

WHY: a replacement that matched nothing went on without a word, and a file read with the default newline mode came back
with its CRLF turned into LF (10 samples in one commit).

Usage (from the root of the repository, in a python3 script or a heredoc):
    import sys; sys.path.insert(0, "_ai-tools")
    from edit_text import load, save, replace, replace_word
    text = load("comp/form.js")
    text = replace(text, "onSendClick: function(json) {},", "onSendClick: function(self, json) {},")   # once
    text = replace_word(text, "descText", "descriptionText", 4)                                        # a whole word, 4 times
    save("comp/form.js", text)

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
"""

import re

# A word of JavaScript: letters, digits, _ and $
WORD_EDGE_BEFORE = r"(?<![A-Za-z0-9_$])"
WORD_EDGE_AFTER = r"(?![A-Za-z0-9_$])"


def load(path):
    # WHY newline="": the line ends of the file are read as they are (CRLF stays CRLF)
    with open(path, encoding="utf-8", newline="") as file:
        return file.read()


def save(path, text):
    with open(path, "w", encoding="utf-8", newline="") as file:
        file.write(text)


def replace(text, old, new, count=1):
    """old -> new; old must be in the text exactly count times."""
    found = text.count(old)
    if found != count:
        raise AssertionError("replace: %r is found %d times, not %d" % (old[:80], found, count))
    return text.replace(old, new)


def replace_word(text, old, new, count=None):
    """A whole word old -> new (Ex: descText, not descTextColor); with count, it must be found that many times."""
    pattern = WORD_EDGE_BEFORE + re.escape(old) + WORD_EDGE_AFTER
    found = len(re.findall(pattern, text))
    if count is not None and found != count:
        raise AssertionError("replace_word: %r is found %d times, not %d" % (old, found, count))
    return re.sub(pattern, new, text)
