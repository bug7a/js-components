# basic.js Core

For **basic.js v26.10.25** (`basic.version`). The changes of every version: `basic/basic-what-is-new.md`. How the code is written: `context/basic-js-code-rules.md`. Components: `context/basic-js-components.md`.

basic.js builds the whole UI in plain JavaScript: it creates DOM objects directly. No HTML markup, no CSS authoring, no virtual DOM.

## Start

basic.js creates the global `page` and then calls the global `start()` (older pages use `window.onload`). A global `loop()` runs every 1000 ms (`setLoopTimer(ms)`).

```javascript
const start = function () {
    page.color = "whitesmoke";
    Label({ text: "Hello", fontSize: 24 });
    that.center();
};
```

### The `page` object
- `page.width`, `page.height` (the visible area), `page.color`, `page.title`.
- `page.fit(width, maxWidth)`: zooms the page so `width` fits. `page.autoFit(width, height)`.
- `page.onResize(fn)` / `page.remove_onResize(fn)`, `page.on(event, fn)`, `page.onKeyDown(fn)`.

## Objects

Positional arguments `(left, top, width, height)`, and an optional props object **last**:

```javascript
Box(10, 10, 100, 100, { color: "red" });
Label({ text: "Hi", fontSize: 16 });
Button({ text: "Save", width: 120, height: 40 });
Input({ width: 240, height: 40, placeholder: "Name" });   // a text field
Icon({ width: 32, height: 32 }); that.load("icon.png");    // a picture
obj.props({ color: "white" });                             // props after creation
```

- `Box`, `Label`, `Button`, `Input`, `Icon`. The DOM element is `obj.elem` (Input: `obj.inputElement`).
- `that` is the last object created, `prevThat` the one before. `makeBasicObject(obj)` makes a custom object `that`.
- `TextBox`, `Image` and the `create*` functions (`createBox`...) are not globals any more (v26.10.25): use `Input`, `Icon`, `Box`...

### Common props
`left`, `top`, `right`, `bottom`, `width`, `height` (a number is px; `"100%"`, `"auto"`, `"calc(...)"`), `color` (background), `textColor`, `fontSize`, `fontFamily`, `bold`, `italic`, `lineHeight`, `textAlign`, `opacity`, `visible`, `border`, `borderColor`, `round`, `padding` (a number, `[x, y]` or `[left, top, right, bottom]`), `position`, `zIndex`, `clickable`, `cursor`, `boxShadow`, `rotate`, `scrollX` / `scrollY`, `clipContent`, `grow` / `shrink`, `css` (`{ ... }` or a CSS string), `role`, `aria` (`{ label: "Close" }`), `tabIndex`.

- **`text` is HTML.** Every text from a user or a server goes in with `plainText`.
- Label: `ellipsis: 1` (one line, "..."), `selectable: 1`, `clipContent: 0` (the text may go out of the label).
- Input: `value`, `placeholder`, `inputType`, `maxLength`, `readOnly`, `focus()`, `blur()`, `select()`, `onEnter(fn)`, `onChange(fn)`.
- An SVG with `stroke="currentColor"` in a Label takes the label's `textColor`.

### Methods
`show()`, `hide()`, `toggle()`, `setSize()`, `setPosition()`, `bringToFront()`, `contains(obj)`, `animate(props, ms, easing)` (a Promise), `center(axis)` (`"left"`, `"top"` or both), `centerBy(obj)`, `aline(obj, "right", space, "center")`.

### Reading sizes
**`obj.width` / `obj.height` never read `"auto"` or `"100%"`**: for a text value they give the measured size (a number; 0 for an `"auto"` box that is not drawn yet). Read such a value from the params before the object is created.

## Containers and layout

New objects go into the current default container.

```javascript
startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
    VGroup({ width: "100%", height: "auto", align: "center top", gap: 20, padding: 40 });
        Label({ text: "Title" });
        HGroup({ hug: 1, gap: 8 });
            Button({ text: "OK" });
            Button({ text: "Cancel" });
        endGroup();
    endGroup();
endBox();
```

- **Every start call needs its end call** (`startBox` / `endBox`, `HGroup` / `VGroup` / `endGroup`). basic.js warns about the ones not ended.
- Group props: `align` (`"left top"`, `"center"`...), `gap`, `padding`, `wrap: 1`, `justify` (`"space-between"`...), `hug: 1` (width and height `"auto"`: the group wraps its content; `fit: 1` is its old name). A group is 100% x 100% by default.
- `AutoLayout` / `endAutoLayout` and `startFlexBox` / `endFlexBox` are old names of the groups: do not use them in new code.
- **Only a Box holds other objects** (the groups are boxes). An object inside a `Button`, `Label`, `Input` or `Icon` sends its mouse events to it: put an overlay next to it in the same box, `position: "absolute"`.
- **Objects into an existing box later:** `createIn(box, function () { ... })` (it puts the previous container back, also on an error; it returns the result of the function). `setDefaultContainerBox()` is not part of the start / end stack.
- A Box with `height: "auto"` does not grow with basic.js children (they are absolute): use a group, or `position: "relative"` children.
- Children created in a hidden group (`visible: 0` at create time) are not flex items: hide the group after its children are created.

### Scrolling
**`page` never scrolls** (`body { overflow: hidden }`). Long content goes into a full screen Box with `scrollY: 1` (or `scrollX`) and an inner group with `height: "auto"`, as above. A scrolling Box gets a `ScrollBar` (`basic/scroll-bar.js`): `if (typeof ScrollBar !== "undefined") ScrollBar({ scrollableBox: box });` after `endBox()`.

### Clipping
**Every Box and every group cuts what goes past its edges** (`clipContent: 1`). A button that lifts under the mouse, a card that grows, a shadow, a glow or a focus ring is cut. Give the groups around such objects `clipContent: 0` (every box up to the page); keep `1` only where cutting is wanted (round picture frames, a scrolling list).

## Events

```javascript
const removeClick = btn.on("click", function (self, event) { println("clicked"); });
btn.once("click", fn);
obj.onResize(fn);                      // the size of the object changed
obj.onHoverChange(function (self, isOver) { ... });
```

`obj.off(event, fn)`, or the remover returned by `on()`.

## Removing

`obj.remove()` removes the object, its events and **every basic.js object inside it** (parents first; a child's `destroy()` is called first when it has one). A removed object has `isRemoved` / `_isRemoved = 1` and must not be added again.

These are cleaned by `remove()` too, so use them instead of the raw browser functions:

```javascript
obj.listenTo(window, "keydown", function (self, event) { ... });   // window / document events
obj.onPageResize(function () { ... });                              // instead of page.onResize
const cancel = obj.after(300, function () { ... });                 // instead of setTimeout
const stop = obj.every(1000, function () { ... });                  // instead of setInterval
obj.menu = obj.own(createIn(page, function () { return Box(...); }));   // an object on the page
```

Objects created directly on `page` from inside another object (without `own`) are not its children: remove them yourself.

## Motion
- `obj.setMotion("left 0.3s, opacity 0.2s")`, then change the props.
- `obj.withMotion(function (self) { ... })`: the changes inside are animated. `obj.dontMotion()`: the next changes are not.
- `obj.animate({ left: 100, opacity: 0 }, 300)`: a Promise.

## Helpers
- `println(text)`, `random(min, max)`.
- `Black(a)`, `White(a)`: rgba texts. `Alpha(color, a)`: any color made transparent (`a` from 0 to 1).
- `basic.num(text)`, `basic.str(value)`, `basic.isMobile()`, `basic.go(url, target)`, `basic.twoDigitFormat(n)`, `basic.escapeHtml(text)`, `basic.isOn(v)` (1, "1", true), `basic.clamp()`, `basic.lerp()`.
- `basic.storage.save(key, value)`, `.load(key)`, `.loadOr(key, fallback)`, `.has(key)`, `.remove(key)`, `.clear()` (localStorage, JSON; the global `storage` is not defined).
- `basic.clock`, `basic.date` (not globals).
- `waitAndRun(timer, fn, ms)`: a debounce (`timer = waitAndRun(timer, fn, 120)`). `await basic.sleep(ms)`, `await basic.nextFrame()`.
- `basic.addCss(id, css)`: a `<style>` once (for `:hover`, `::placeholder`, `@keyframes`).
- `withPageZoom(px)`: a mouse position in page units when the page is zoomed.

## Gotchas
- A global helper of a page must not be named like a basic.js global (`Box`, `Label`, `random`, `println`...). Prefer `MyPage.createButton`.
- An inline `<script>` must not contain a closing tag as plain text, even `</body>` in a string: write `<\/body>` (Live Server puts its script before the first `</body>` of the file).
- `basic.css` gives every box `pointer-events: none` and the page `user-select: none`: a raw HTML element (a `<textarea>`) needs `pointer-events: auto; user-select: text`.
