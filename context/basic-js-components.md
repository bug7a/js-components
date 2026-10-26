# basic.js Components

How a component of this repository is written (comp-m4, basic.js v26.10.25). The full starting point is `_component-template.js` at the root: copy it. How the code reads: `context/basic-js-code-rules.md`. The core library: `context/basic-js-core.md`.

## The shape

```javascript
"use strict";

// Default values:
const MyCompDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 240,
    height: "auto",
    labelText: "",
    value: 0,
    enabled: 1,
    onChange: function (self) { }, // Not at create time, not with silent: 1
    styleName: "classic", // "classic", "dark" or a name added to MyComp.styles
    style: { // Classic style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.15), round: 8 },
        label: { fontSize: 15, textColor: Black(0.85) },
        hover: { color: "#F5F6F4" },
        focus: { ringColor: "rgba(95, 158, 160, 0.6)" },
    },
};

const MyComp = function (params = {}) {

    // Merge style package: params.style > MyComp.styles[styleName] > MyCompDefaults.style
    basic.applyStylePackage(params, MyComp.styles, MyCompDefaults);

    // Merge params:
    mergeIntoIfMissing(params, MyCompDefaults);

    // Edit params, if needed:
    const isAutoHeight = (String(params.height) === "auto"); // WHY: box.height reads the measured size after startObject

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;

    // *** PRIVATE FUNCTIONS:
    const paint = function () { /* the look of the state */ };

    // *** PUBLIC FUNCTIONS:
    box.setValue = function (value, silent = 0) {
        if (value === box.value) return;
        box.value = value;
        paint();
        if (!silent) box.onChange(box);
    };
    // USAGE: comp.setValue(5) or comp.setValue(5, 1) // silent

    // *** OBJECT VIEW:
    box.props({ color: _s.box.color, border: _s.box.border, borderColor: _s.box.borderColor, round: _s.box.round });
    box.lblText = Label({ plainText: box.labelText, fontSize: _s.label.fontSize, textColor: _s.label.textColor });

    // *** OBJECT INIT CODE:
    box.on("click", function () { box.setValue(box.value + 1); });
    paint();

    return endObject(box);
};

// *** STYLE PACKAGES:
MyComp.styles = {
    classic: MyCompDefaults.style,
    dark: { box: { color: "#1A1A19", borderColor: White(0.1) }, label: { textColor: White(0.9) } }, // only the keys that differ
};
```

- `startObject(params)` makes the container box and puts the objects created until `endObject(box)` into it. `endObject` makes `that` the component. (`startObject(defaults, params)`, the two argument form, merges too.)
- **Every default becomes a public property on the box** (`box.labelText`). Change it later with a `setX()` function, never with a JS getter / setter.
- **A default must not be named like a basic.js setter**: `text`, `color` (only the background of the box), `title`, `html` (it wipes the children), `visible`, `zoom`... Use `labelText`, `htmlText`, `scale`.
- PascalCase name, an `XxxDefaults` object, assets in a sibling folder with the same name (`comp-m4/tabs/`).
- The house header (`/* Bismillah */`, name - version, what it does, `USAGE:`, developer) and the section markers (`// *** PRIVATE VARIABLES:`, `// *** OBJECT VIEW:`, `// BOX:`, `// LABEL:`...).

## Style packages
- `basic.applyStylePackage(params, Comp.styles, CompDefaults)` is the first line: `params.style` > the package of `styleName` > the defaults. The package is copied, never changed.
- A package has only the keys that differ from the default style. A new key in the default style is filled into every package: when the old look of a package must stay, give it that key (Ex: `opacity: 1` in `selected`).
- `mergeIntoIfMissing` copies 4 levels; deeper objects are kept by reference. Keep the style flat.
- A component whose look is in flat params (comp-m2 `InputB`) uses a package of params instead: `mergeIntoIfMissing(params, Comp.styles[name])` before the defaults.
- Colors of themes the user picks at run time (`Modal`, `Toast`, `ChartBox`): `X.THEMES` + `basic.resolveTheme(X.THEMES, name)`; `style` keeps only the shapes.

## Events and state
- **`onChange` is not called at create time, by `setItems()` / `setOptions()`, or with `silent: 1`**, and not when the value did not change.
- The state is decided in one place (`getState()` or `getLook()`): normal, hover, selected, disabled. `paint()` draws it, without measuring.
- Drawing functions named by their job: `createItems()` (from the data; one item: `createItem()`), `applyContent()`, `paint()`, `refreshLayout()` (what depends on the sizes), `drawAll()`. A setter calls only the one it needs.
- Keyboard: `box.role`, `box.aria = {...}`, `box.tabIndex`, Enter / Space like a click, `box.setFocusRing(color)` (only for the keyboard). In a list only one row is in the Tab order.
- A text of the user is written with `plainText`.

## Sizes
- **Read `"auto"` / `"100%"` from `params` before `startObject()`.** After it `box.width` / `box.height` are the measured numbers, so `box.height === "auto"` is never true (a TreeView with `height: "auto"` was 0 px high because of it).
- `height: "auto"`: the content is a group (or `position: "relative"`), so the box grows with it. Otherwise a scrolling box with a `ScrollBar` (`if (typeof ScrollBar !== "undefined")`).
- A group clips its content: `clipContent: 0` on the groups around rows that lift, grow or have a focus ring.

## Objects on the page (menus, popups, lists)
- Create them on `page` so they are over everything: `box.menu = box.own(createIn(page, function () { return Box(...); }))`. `own` removes them with the component.
- Close an open popup in `remove()` (a remove while it is open must not leave it on the page).
- Created outside a group but shown inside one (a `ScrollBar` for a list in a panel group): create it outside, it moves itself; created inside a group it becomes a part of the group's layout.

## Cleaning up
Register global things through the box; `remove()` of basic.js cleans them, so most components need no `remove()` of their own:

```javascript
box.listenTo(document, "keydown", function (self, event) { ... });  // not document.addEventListener
box.onPageResize(function () { ... });                             // not page.onResize
box.after(300, fn); box.every(1000, fn);                           // not setTimeout / setInterval
```

Override `remove()` only for what basic.js can not know (a static list, a Chart.js instance, a `setTimeout` loop, document events of a drag, a popup not owned):

```javascript
// WHY: the local copy is called, because a component that extends this one overwrites box.superRemove.
const superRemove = box.remove;
box.superRemove = superRemove;
box.remove = function () {
    if (!box) return;            // WHY: remove() can be called twice (also by the parent's remove()).
    MyComp.list = MyComp.list.filter(function (c) { return c !== box; });
    superRemove.call(box);       // basic.js remove(): the events and the objects inside
    box = null;                  // so the box is declared with let
};
```

Never write a `destroy()` for a component: everything is removed with `remove()`. To extend a component: `startExtendedObject(ParentComp, params)` ... `endExtendedObject(box)` (see `comp-m2/email-input-b.js`).

## When the component is ready
1. A sample page `02-comp-mX-samples/<name>.htm`: a scrolling Box, cards, every style package; it loads the source files (`../basic/basic.js`, `../comp-m4/<name>.js`), not `.min.js`.
2. `test/components-test.htm`: add it to `COMPONENTS` (`{ file, name, deps, setup }`), open `?only=<name>`: the title must say ALL PASS.
3. The `.min.js` twin: create an empty `<name>.min.js` once, then `./_make-min-js.sh --build comp-mX/<name>.js` (after every change too).
4. The catalog: `index/catalog.js` (+ the `<noscript>` list in `index.htm`) and its line in CLAUDE.md.
