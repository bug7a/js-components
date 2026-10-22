# basic.js v26.10.23 — what changed

`basic/basic.js` (v26.10.23, 2026-10-23) is v26.09.18 (`basic/basic-v26.09.18.md`) plus the additions below. Every page and component written for the previous versions runs unchanged, with the same globals, the same defaults and the same DOM output.

Files: `basic/basic.js` (source), `basic/basic.min.js` (minified with terser), `test/basic-test.htm` (self-checking test page: 123 checks; the tab title says `ALL PASS`). Release notes: `__handbook/english/00-what-is-new.md` (and `turkce/`).

Naming rule for the additions (the same as v26.09.18): no new globals; names that components already use were not taken. `listen` (the `box.listen` of `PropertyPanel`) and `onHover` (a parameter of `TreeView`) are used by components, so the new methods are `listenTo` and `onHoverChange`.

---

## The additions

For simpler components: the global things of an object are cleaned by its `remove()`, so most components do not
override `remove()` any more (42 of 63 components did it only for this). `test/basic-test.htm`: 123 checks.

| What | Use |
|---|---|
| `obj.listenTo(target, event, func, capture)` | an event of `window` / `document` / any element: `func(self, event)`. Returns the remover. Removed by `remove()`. |
| `obj.onPageResize(func)` | the resize of the window, `func(self, event)`. Removed by `remove()` (`page.onResize` is not). |
| `obj.after(ms, func)` | `func(self)` once. Returns the cancel function. Stopped by `remove()` (never runs on a removed object). |
| `obj.every(ms, func)` | `func(self)` again and again. Returns the stop function. Stopped by `remove()`. |
| `obj.own(other)` | an object made somewhere else (a menu, a popup on `page`) is removed with `obj`. Returns `other`. |
| `obj.onHoverChange(func)` | `func(self, isOver, event)`: 1 on `mouseenter`, 0 on `mouseleave`. Returns the remover. |
| `obj.setFocusRing(color)` | a ring only for the keyboard (CSS `:focus-visible`, not after a mouse click). `""`: none. |
| `basic.isOn(value)` | `1`, `"1"`, `true` -> true. (the `v == 1 \|\| v === true` of the components) |
| `basic.addCss(id, css, replace)` | a `<style>` once (the same id: nothing, unless `replace`). For `:hover`, `::-webkit-scrollbar`, `@keyframes`... |
| `createIn(container, func)` | now returns the result of `func`: `const menu = obj.own(createIn(page, function () { return Box(...); }));` |

```js
const MyComp = function (params = {}) {
    let box = startObject(params);
    box.listenTo(document, "keydown", function (self, event) { if (event.key === "Escape") box.close(); });
    box.onPageResize(function () { box.layout.gap = (page.width < 480) ? 6 : 10; });
    const stop = box.every(1000, function () { box.lblTime.text = new Date().toLocaleTimeString(); });
    box.menu = box.own(createIn(page, function () { return Box(0, 0, 200, 100, { visible: 0 }); }));
    // No remove() override: basic.js removes the listeners, stops the timers and removes box.menu.
    return endObject(box);
};
```

## In the components

- `_component-template.js` is written with them (`onPageResize`, `after`, `onHoverChange`, `setFocusRing`, `basic.isOn`; its `remove()` block stays only for what basic.js does not know).
- `comp-m4/tree-view.js` is the first component without its own `remove()` (its type-ahead timer is `box.after`).
- The older components are converted when they are touched, not all at once.
- The copies of basic.js in the other folders (`03-webpage-m2/webpage-handbook/basic/` (`_update-copies.sh`), `03-webpage-m2/webpage-basicjs/basic/`, the game, the admin panel demo) do not get these until they are copied again: a component that uses them needs the new basic.js.

## Maintenance

- After editing `basic/basic.js`, rebuild the min file:
  ```
  npx terser basic/basic.js --compress --mangle --comments "/Bismillah|basic\.js \(v/" -o basic/basic.min.js
  ```
  then open `test/basic-test.htm` (the source) and the same page with `basic.min.js`: the tab title must say `ALL PASS`.
- The timer checks of the test wait for their result (up to 4 s), not for a fixed time: Chrome slows the timers of a tab in the background down to about 1 s.
