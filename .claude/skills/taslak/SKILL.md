---
name: taslak
description: Make a draft design (taslak) of a component or a page in _designs/: every look and every state drawn side by side with plain basic.js objects, no component behind it, to be edited visually in basic-designer. Use when the user writes /taslak <component or page>, or asks for "X'in taslağı" / "taslak yap".
argument-hint: "<bileşen ya da sayfa, Ör: progress-bar, comp/tabs.js, 02-comp-examples/dialog.htm>"
---

# /taslak: a draft design in `_designs/`

Target: $ARGUMENTS (a component name, a `comp/` file or a page). If it is empty, ask which one.

## Read first

1. `_designs/readme.md`: the rules of a draft (the source of truth).
2. `_designs/smart-button.htm`: the model page (the values at the top, `STATES`, the grid in `start()`, one short function per cell).
3. The source of the target: for a component its `XxxDefaults.style` and every package in `Xxx.styles`; its row in `context/repo-map.md` for its states and history.
4. `context/basic-js-code-rules.md`.

## The draft

- File: `_designs/<file name of the component>.htm` (`comp/progress-bar.js` → `_designs/progress-bar.htm`). If it exists, refresh its copied values from the component instead of starting again, and say so.
- It loads only `../basic/basic.css` and `../basic/basic.js`: **no component file**. Every part is a plain basic.js object (`Box`, `Label`, `Icon`, `HGroup` / `VGroup`), so basic.js Designer can select and change each one.
- The values sit at the top in plain objects (`LOOKS`, `STATES`...), copied from the component's packages, with a comment naming where each came from.
- A grid: one row per state, one column per style package; a Label at the start of each row and over each column.
- Every state: normal, hover, pressed, keyboard focus, disabled, waiting, error, empty, full, long text... whatever the component has. Hover / pressed / a moving part are drawn as a still frame of that moment.
- The page scrolls inside a full-screen Box (`scrollY: 1`, `scrollX: 1`); groups that hold things that move out of their box get `clipContent: 0`.
- A header comment: `// DRAFT DESIGN of comp/<file> (<Name>).` and the basic.js Designer address (the date goes into the table of `_designs/readme.md`, not into the code):
  `http://127.0.0.1:5505/_basic-designer/index.htm?page=_designs/<file>.htm`

## Check and finish

- Open the page headless (puppeteer-core is in `__video/node_modules`; Live Server on port 5505), read the console errors and look at the screenshot; fix what is wrong. Crop the screenshot to the draft (`_screenshots/YYYY-MM-DD-<name>-taslak.png`).
- Add a row for it to the table of `_designs/readme.md`.
- The report: the draft's path, its basic.js Designer address, the screenshot after the table.
- Carrying changes back to the component is NOT part of this command: the user edits the draft in basic.js Designer and sends it with **Send to AI** (a note like "bileşene aktar" when needed). Say this in one line at the end.
