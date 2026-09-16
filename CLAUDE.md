# CLAUDE.md

This file gives Claude Code guidance for working in this repository.

## What this is

**JS-Component Suite**: a set of UI components, samples and app templates built on **basic.js** (`basic/basic.js`). basic.js is a small, dependency-free library by Bugra Ozden where the whole UI is built in plain JavaScript. It creates DOM objects directly, so there is no HTML markup, no CSS authoring and no virtual DOM. It is licensed under Apache 2.0.

There is **no build system, package.json, bundler, linter or test runner**. Every page is a standalone `.htm` file that loads scripts with `<script src>`. To run a page, open it in a browser. The VS Code Live Server extension is configured on port 5505 (`.vscode/settings.json`).

## Directory map

| Path | Contents |
|---|---|
| `basic/` | The core library: `basic.js`, `basic.css`, fonts (Open Sans), `scroll-bar.js`. **All other code depends on it.** |
| `comp-m1/` | Generation 1 components (legacy). They use the `UICore.createDefaultValues(Comp, {...})` namespace-object pattern from `ui-core.js`. |
| `comp-m2/` | Generation 2 components that use `startObject`/`endObject`. Includes `ui-standards.js`/`.css`, which provide design tokens (`UI.COLOR_*`, `UI.TEXT_*`, `UI.ROUND_*`), CSS variables and `UI.applyTheme(isDark)` for dark mode. |
| `comp-m3/` | Generation 3 components (newest, 2026). They follow the same pattern as m2 and group styles in a nested `style: {...}` default. Some were AI-generated. |
| `comp-m4/` | Generation 4 components (started September 2026), same m2/m3 pattern. `select-date.js` (replaces the unfinished `comp-m3/select-date.js`) and `select-file.js` (drop zone / file dialog; browsers never expose real disk paths). |
| `01-basic-samples-m1/` | Numbered tutorial pages for the core library. |
| `02-comp-m{1,2,3,4}-samples/` | One demo `.htm` per component. Each page loads `../basic/...` and `../comp-mX/<name>.js`. |
| `03-page-m2/`, `04-template-m1/`, `04-template-m2/` | Full app templates: `js-admin-panel` (a modular admin panel planned to use Supabase, with iframe modules and `managers/`, `common/`, `pages/`), `js-form` (a contact form that posts to Supabase), `todo-app` and `js-data-table`. |
| `05-showcase-m2/` | Links (`.webloc`) to live showcase apps. |
| `__handbook/english`, `__handbook/turkce` | The basic.js handbook in Markdown, in English and Turkish. |
| `context/` | Short AI-context docs: `basic-js-core.md` and `basic-js-components.md`. |
| `__developer-toolkit/` | VS Code extensions (`.vsix`) for basic.js: a completer, an object navigator and a view inspector. |
| `experimental/` | Prototypes, plus Python helpers: `_remake_components_js.py` concatenates `*.min.js` into `components.js`, and `__make-pack/` packs or minifies the scripts referenced by an HTML file (needs `pip install jsmin`). |
| `test/` | Manual test pages. There are no automated tests. |
| `_component-template.js`, `_empty-project-template.htm` | Starting points for a new component and a new page. |
| `components.js` | An example of pasting several `.min.js` components into one file. |

Files and folders prefixed with `delete-` (and `context-delete/`) are marked obsolete. Don't use them as references or update them. Files prefixed with `unfinished-` are work in progress.

## Core basic.js concepts

- **Startup**: when the page loads, basic.js creates the global `page` (a `MainBox`) and then calls the global `start()` if one exists. Older pages use `window.onload = function(){...}` instead. If a global `loop()` is defined, it runs every 1000 ms (change the interval with `setLoopTimer(ms)`).
- **Constructors**: `Box`, `Label`, `Button`, `Input` (TextBox) and `Icon` (Image). Positional arguments are `(left, top, width, height)`, and an optional props object comes **last**, for example `Label({ text: "Hi", fontSize: 16 })` or `Box(0, 0, "100%", "100%", { color: "red" })`. `obj.props({...})` applies props after creation. The underlying DOM element is `obj.elem`.
- **`that`**: the most recently created object. Code commonly styles it right after creating it (`that.elem.style.whiteSpace = "nowrap"`). `prevThat` is the object created before it.
- **`page` never scrolls** (`basic.css` sets `body { overflow: hidden }`). If a page's content can be taller or wider than the screen, put it inside a full-screen `Box` and turn on that Box's scrolling. Don't try to make `page` or `<body>` scroll:
  ```js
  startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 }); // scrollX: 1 for horizontal
      VGroup({ width: "100%", height: "auto", align: "center top", gap: 20, padding: 40 }); // height "auto" so content can exceed the Box
          // ... page content
      endGroup();
  endBox();
  ```
  Sample and template pages that stack content vertically must follow this rule (see `02-comp-m3-samples/check-box.htm`).
- **Implicit containers**: new objects are added to the current default container. `startBox()`/`endBox()` and `AutoLayout`/`HGroup`/`VGroup` … `endGroup()` push and pop that container. **Every start call needs a matching end call.** basic.js warns in the console about start calls that were never ended.
- **AutoLayout** (flexbox): props are `flow: "horizontal"|"vertical"`, `align: "left top"` (any combination), `gap`, `padding` (a number or `[x, y]`) and `fit: 1` (sets width and height to `"auto"`). A group defaults to 100% × 100%.
- **Common props**: `color` (background), `textColor`, `border`, `borderColor`, `round`, `opacity`, `visible`, `clickable`, `clipContent`, `scrollY`. Alignment helpers: `center()`, `centerBy(obj)`, `aline(obj, "right", space, "center")`.
- **Events**: `obj.on("click", (self, event) => {})` returns a remover function. Resize handlers use `obj.onResize(fn)` and `page.onResize(fn)`.
- **Motion**: `obj.setMotion("left 0.3s, opacity 0.2s")`, then change the properties.
- **Helpers**: `Black(a)`, `White(a)` (rgba strings), `println`, `num`, `str`, `random`, `storage.save/load`, `waitAndRun(timer, fn, ms)` (debounce), `withPageZoom`, `isMobile`, `go(url)`.

## Writing a component (m2/m3 pattern)

Follow `_component-template.js` or a `comp-m3/*.js` file such as `button-with-icon.js`:

```js
"use strict";
const MyCompDefaults = { width: 240, height: 70, labelText: "", onClick: function (self) {}, style: { box: {}, label: {} } };

const MyComp = function (params = {}) {
    mergeIntoIfMissing(params, MyCompDefaults);   // deep-fills missing keys (mutates params)
    let box = startObject(params);                // container box; children created below go inside it

    // *** PRIVATE VARIABLES / FUNCTIONS
    // *** PUBLIC VARIABLES / FUNCTIONS  → box.setX = function (v) { box.x = v; box.child.text = v; };
    box.destroy = function () { box.remove(); box = null; };

    // *** OBJECT VIEW  → build children (box.label = Label({...}), groups, etc.)
    // *** OBJECT INIT CODE  → box.on("click", ...), initial setters
    return endObject(box);                        // closes the container and makes `that` === box
};
```

- `startObject(defaults, params)` (the two-argument form used in `input-b.js`) does the same merge. Params take precedence over defaults in both forms.
- Every default value becomes a public property on `box`. After creation, change values through explicit `setX()` methods, not JS getters or setters.
- To inherit from another component, use `startExtendedObject(ParentComp, params)` … `endExtendedObject(box)` (see `comp-m2/email-input-b.js`, which extends `InputB`).
- Name components in PascalCase with a matching `XxxDefaults` object. Put component assets in a sibling folder with the same name (`comp-m3/smart-table/*.png`).
- Files keep the house header comment (`/* Bismillah */`, name/version, developer). Comments mix English and Turkish. Keep the existing section markers (`// *** PUBLIC FUNCTIONS:`, `// BOX:`, `// LABEL:`, …).

## Conventions and gotchas

- **`.min.js` twins**: most sources have a hand-produced `name.min.js` next to them, and samples and templates often load the `.min` version. The repo has no minification script for single files. After you edit a source file, tell the user that its `.min.js` is now stale, or regenerate it if asked. Otherwise pages that load the `.min` file won't pick up the change.
- Template folders contain **copies** of the library and components, for example `04-template-m1/todo-app/library/basic.js`, which differs from `basic/basic.js`, and `js-admin-panel/common/ui-standards.js`. Fixing `basic/` or `comp-m*/` does not update those copies.
- Script order matters: load `basic.css` and `basic.js` first, then `ui-standards` if you use it, then the components, then the page code. A component that extends another must load after its parent.
- Paths are relative to the `.htm` file (samples use `../basic/`, templates in `04-template-*/<app>/` use `../../basic/`).
- The current library version is in the `basic/basic.js` header (v26.03.26 at the time of writing).
