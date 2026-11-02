# Instructions for AI coding tools

This is a web app made with **basic.js**: the whole interface is built in plain JavaScript. There is no HTML markup in the body, no CSS authoring, no virtual DOM, no package.json and no build step while developing. Answer in the language of the user.

## Where things are

- `index.htm`: loads the library, the components and the app files, in that order.
- `app/`: the code of the app. New files go here. Each new file gets a `<script>` line in `index.htm`.
- `assets/`: the pictures and files of the app.
- `_basic/`: the library and its references. **Never change anything in `_basic/`**: an update replaces the folder. A component of your own goes to `app/`.

## Before you write code

1. Read `_basic/docs/basic-js-core.md` and `_basic/docs/basic-js-code-rules.md`.
2. Look for a ready component in `_basic/docs/component-index.md`. Use it instead of drawing your own.
3. Open the example it lists in `_basic/examples/` and copy the usage. Examples use the same paths as `index.htm`, so their code works in this project as it is.

More: `_basic/docs/basic-js-components.md` (how a component is made), `_basic/docs/component-template.js` (a starting point), `_basic/docs/handbook/` (every object and property), `_basic/docs/what-is-new.md`.

## Adding a component

Add a `<script>` line to `index.htm` for the component and for every file in its `needs` list, with the needed files first:

```html
<script src="_basic/comp/tooltip.js" type="text/javascript" charset="utf-8"></script>
<script src="_basic/comp/smart-button.js" type="text/javascript" charset="utf-8"></script>
```

Pages load the source files (`name.js`). Components have no `.min.js` files.

## Rules that are easy to miss

- `const start = function () {}` is the entry point. basic.js creates the global `page` and then calls it. `loop()` runs every second when it exists.
- Objects: `Box`, `Label`, `Button`, `Input`, `Icon`. Arguments: `(left, top, width, height, { props })`, or only `{ props }`.
- Every `startBox()` needs its `endBox()`, every `HGroup()` / `VGroup()` / `AutoLayout()` needs its `endGroup()`.
- **Only a Box or a group holds other objects.** Nothing is created inside a Button, Label, Input or Icon.
- **`page` never scrolls.** Long content goes in a full-screen Box with `scrollY: 1`, with a `VGroup({ width: "100%", height: "auto" })` in it. Give that Box a `ScrollBar({ scrollableBox: box })`.
- A Box with `height: "auto"` does not grow with its children. Use a group for that.
- A group clips its content. Around things that move or lift, use `clipContent: 0`.
- **A group with a fixed height cuts what is taller than it.** Give a row `height: "auto"`, or give its objects a height that fits. A SmartButton with `pill`, `pillSolid` or `outlined` is about 50 px high: in a 40 px row give it `height: 40`.
- **The page must work from 360 px wide.** Do not use a fixed width for a card or a page column: use `width: "100%"` with `css: { maxWidth: "480px" }`, and keep the side padding small (16 px).
- **A group is 100% wide and 100% high by default.** Inside a row it pushes its neighbours out of the screen, and nothing warns you. Always give a group in a row its width. To take the free space of a row: `VGroup({ width: "auto", height: "auto", grow: 1, css: { minWidth: "0px" } })`.
- Use `hug: 1` for a group as big as its content.
- Use `scrollY` / `scrollX`, never `overflow` in `css`.
- Use the props of basic.js (`color`, `textColor`, `round`, `border`), not `elem.style`.
- To add objects to an existing box later, use `createIn(box, function () { ... })`.
- Do not name your helpers like basic.js globals (`Box`, `Label`, `random`...). Keep them on an object: `App.createRow()`.
- Do not write a closing script tag as plain text inside an inline script.

- Write the texts of the app in the language of the user, also the texts a component shows by default. Ex: `Dialog.confirm` takes `confirmText` and `cancelText`.

## Default components

- A button: `SmartButton`. **Use the default look: give no `styleName`** (it is `ozdenType1`: a gray surface, a thin edge, a darker line at the bottom).
  - The main action of a screen: `styleName: "primary"`. A delete: `styleName: "danger"`. Also `warning`, `success`, `info`.
  - A quiet button in a list or a toolbar: `styleName: "ozdenType4"`. On a dark page: `ozdenType1Dark` ... `ozdenType4Dark`.
  - `pill`, `pillSolid` and `outlined` are for status labels and for a design the user asks for, not for ordinary buttons. Their color comes from `tone` (`blue`, `primary`, `danger`...).
- A dialog: `Dialog` (`Dialog.confirm`, `Dialog.alert`, `Dialog.prompt`).
- A bubble or popover: `Tooltip`.
- A search box: `SearchInput` with `styleName: "ozden"`, or `"ozdenDark"` on a dark page.
- A loading view: `LoadingScreen`.

## Publish

`node _basic/tools/build.js` makes the ready site in `dist/`. It needs only Node.js. Publish the files inside `dist/`, and never change them by hand: the folder is made again at every run. Run it after the last change: it also checks `dist/` in Chrome.

## Run and check

Pages that read files do not work from `file://`: the user serves the folder with `npx serve`.

**After every change run `node _basic/tools/check.js`.** It opens the page at 390 px and at 1200 px, and lists errors, missing files, and things that leave the screen or are cut. Fix every line it lists. Then read the pictures in `.check/` and look at them: the tool can not judge the design.

An app with more than one view must tell the tool how to open them, or the other views are not checked:

```javascript
window.checkViews = {
    products: function () { App.showPage("products"); },
    settings: function () { App.showPage("settings"); },
};
```

It checks every page, also the ones in folders. A page shown only inside another page can say `<meta name="basic-check" content="skip">`.

The tool needs Chrome or Edge. When it can not run, run `node --check` on the files you changed, and tell the user that the page was not opened.
