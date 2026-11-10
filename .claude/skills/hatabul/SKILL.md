---
name: hatabul
description: Find and list the big bugs of a file or a project that must be fixed; it changes nothing (the user picks from the list what to fix). Use when the user writes /hatabul <file or project>, or asks "X'teki hataları bul" / "hata bul".
argument-hint: "<dosya ya da proje, Ör: comp/tabs.js, tabs, 02-comp-examples/dialog.htm, 04-templates/ozden-panel>"
---

# /hatabul: the list of the bugs that must be fixed

Target: $ARGUMENTS. If it is empty, ask which file or project.

**This command changes no file.** It finds, proves and lists. The user picks from the list what to fix ("1, 3'ü düzelt"); the fix is a new job.

## The target

- A file: that file, and what it needs to be understood (the component it uses, the page that loads it).
- A component name (`tabs`, `SmartButton`): `comp/<name>.js` and its samples in `index/catalog.js`.
- A folder (a project, a template, a site): its own `CLAUDE.md` / `readme.md` first, then its code. A big project: start with what runs first and what the user touches most (start, the main pages, forms, saving data), not with every file in order.
- Read the row of its folder in `context/repo-map.md` (its history: a thing that looks wrong may be on purpose) and `context/basic-js-code-rules.md` (the rules of the house: a break of them is a bug only when it breaks something, see below).
- One session, no subagents.

## What is a big bug (only these)

A bug that a user of the page or of the component meets, or that loses something:

- An exception, a page that does not open, a feature that does not work, a wrong result.
- Data lost or sent wrong (a form, a save, a value read from the wrong key).
- Security: HTML or text of a user put into the page without escaping (`allowHtml` is for trusted text only), a secret (a password, a key, a real service address of the user) in code that is published.
- A leak or a double: a listener, a timer, an observer or an object on `page` that `remove()` does not clean; a handler that runs twice.
- A page that can not be used on a phone (390 px: a text or a button cut, out of the screen), or with the keyboard (a control that can not be reached or pressed).
- A wrong rule of basic.js that breaks something: a missing `endBox()` / `endGroup()`, an object made inside a Button / Label, `overflow` in `css` in place of `scrollY`, a closing script tag written as text in an inline script, two `</svg>` in an `.svg` file.

**Not a big bug** (not listed, at most one line at the end): style, names, comments, order, a long function, a "better way", a missing feature, old code that works, an old name kept on purpose (`fit: 1`, `classic`, `css: { alignItems: "stretch" }`), a look the user chose.

## Prove each one

A bug is listed as proved only when it is seen: open the page (`node test/screenshot.js <page> --print "..."`, `--run`, `--click`, `--cut --width 390`), or a few lines in a scratchpad page that show it. Nothing is written into the repository for it. A suspicion that can not be shown goes into a separate part of the list: "Gösterilemedi".

## The list

- No big bug: say so in one line ("Düzeltilmesi gereken büyük bir hata yok").
- Otherwise the table of the house, numbered, most serious first: 🔴 a crash, data, security; 🟠 a broken feature, a phone, the keyboard; 🟡 smaller, but it must be fixed. Each row: the number, what happens to the user, where (`[file:line](file#Lline)`), the proof (how it was seen), the fix in one line, its size (one line / one function / many files).
- A picture for a bug that is seen.
- Under "Bilmen gerekenler": what was looked at and what was not (a big project), the suspicions that could not be shown.
- The last line: "Düzeltmek istediklerinin numaralarını yaz."
