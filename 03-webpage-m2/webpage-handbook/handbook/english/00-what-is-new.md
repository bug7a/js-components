# basic.js — Release Notes (What is New?)

This document contains new features, updates, and changes added to the basic.js library.

---

## Version 26.10.25

*   **NOT COMPATIBLE: helpers under `basic.*`:** `num`, `str`, `isMobile`, `go` and `twoDigitFormat` are now `basic.num()`, `basic.str()`, `basic.isMobile()`, `basic.go()` and `basic.twoDigitFormat()`; they are not globals any more.
*   **NOT COMPATIBLE: the old `create*` globals are removed:** `createBox`, `createLabel`, `createButton`, `createImage` / `createIcon`, `createTextBox` / `createInput`. Use `Box()`, `Label()`, `Button()`, `Icon()`, `Input()` (the same, with props). The functions stay as `basic.createBox()`... A page written for an older version that uses them needs only the new name.
*   **`Alpha(color, percent)`:** like `Black(0.5)` / `White(0.5)`, for any color: `Alpha("#456789", 0.5)` gives `"rgba(69,103,137,0.5)"`. Hex colors become `rgba`; a name, `rgb()` or a `var(--token)` goes through `color-mix`. Fully compatible. Reference: `basic/basic-what-is-new.md`.

---

## Version 26.10.24

*   **`basic.applyStylePackage(params, Comp.styles, CompDefaults)`:** the style packages of a component (`styleName: "dark"`) in one line, in place of the three lines every component wrote. The order is the same: `params.style` > the package of `styleName` > `Defaults.style`. A package can also be given as it is, `Tabs({ style: Tabs.styles.dark })`: it is copied, so the package itself is never changed. Fully compatible. `comp-m4/tabs.js` and `_component-template.js` use it (they need v26.10.24). Reference: `basic/basic-what-is-new.md`.

---

## Version 26.10.23

*   **Simpler components, fully compatible:** every page and component written for the previous versions works unchanged. The global things of an object are now cleaned by its `remove()`, so a component does not need its own `remove()` for them (before, 42 of the 63 components overrode `remove()` only to clean them, and a forgotten one leaked). Reference with examples: `basic/basic-what-is-new.md`. Self-checking test page: `test/basic-test.htm` (137 checks).
*   **Cleaned by `remove()`:** `obj.listenTo(window, "keydown", func)` (an event of another element; returns the remover), `obj.onPageResize(func)`, `obj.after(ms, func)` (once; returns the cancel function), `obj.every(ms, func)` (again and again; returns the stop function), `obj.own(otherObject)` (an object made somewhere else, for example a menu on `page`, is removed with it).
*   **New methods (every object):** `onHoverChange(func)` (`func(self, isOver)`), `setFocusRing(color)` (a focus ring only for the keyboard, CSS `:focus-visible`).
*   **basic:** `isOn(value)` (`1`, `"1"`, `true`), `addCss(id, css, replace)` (a `<style>` once: for `:hover`, `::-webkit-scrollbar`, `@keyframes`...).
*   **`createIn(container, func)`** returns the result of `func`: `const menu = box.own(createIn(page, function () { return Box(...); }));`
*   **Fix (groups):** `grow`, `shrink` and `css` given in the props of a group (`HGroup`, `VGroup`, `AutoLayout`) were written over by its flex styles and lost. Now `VGroup({ align: "left top", css: { alignItems: "stretch" } })` and `HGroup({ grow: 1 })` work as written.
*   **Fix (`rotate`):** `obj.rotate = 45` threw away the rest of the transform (a `translateY()`, a `scale()`). Now it changes only its own `rotate()` part.
*   **Accessibility props (every object):** `role` (`"button"`, `"tab"`...), `aria` (`{ label: "Close", selected: true }`: only the given keys change, `null` removes one) and `tabIndex`. They replace `elem.setAttribute("aria-...")` lines. See "Common Properties".
*   **The component template** (`_component-template.js`) is written with them; `comp-m4/tree-view.js` is the first component without its own `remove()`.

---

## Version 26.09.18

*   **Fixes and additions, fully compatible:** every page and component written for the previous versions works unchanged (137 sample and template pages were compared in headless Chrome: identical DOM). Nothing to change in pages. The previous version (26.09.17) is kept as `basic/backup/v26.09.17/basic-bugra.js` / `basic-bugra.min.js` for reference. Full reference with examples: `basic/basic-what-is-new.md`. Self-checking test page: `test/basic-test.htm`.
*   **Fixes:** `"100"` and `"50%"` / `"calc()"` work for `left`, `top`, `right`, `bottom`, `width`, `height`. Children created in a hidden group (`VGroup({ visible: 0 })`) are real flex items. Creating an object before the page is ready throws a clear error. A page variable named like a library helper (`const createButton`) can not break `Button()`. `remove()` clears the pending motion timers. `props()` returns the object.
*   **New properties (every object):** `css`, `cursor`, `zIndex`, `boxShadow`, `fontFamily`, `bold`, `italic`, `lineHeight`, `ellipsis`, `selectable`, `grow`, `shrink`, `plainText`, `isRemoved`, `children`.
*   **New methods (every object):** `show()`, `hide()`, `toggle()`, `setSize()`, `setPosition()`, `bringToFront()`, `contains()`, `once()`, `animate()` (returns a Promise).
*   **Input:** `value`, `placeholder`, `inputType`, `maxLength`, `readOnly`, `focus()`, `blur()`, `select()`, `onEnter()`. **Icon:** `alt`, `imageFit`.
*   **Groups:** `wrap: 1` and `justify: "space-between" | "left" | "center" | "right" | ...` for `HGroup` / `VGroup` / `AutoLayout`.
*   **`hug: 1`:** a new, clearer name for the `fit: 1` parameter of the groups (the group wraps its content, `width/height: "auto"`). `fit` keeps working exactly as before, and after creation `group.hug` and `group.fit` both return 1.
*   **`createIn(container, func)`:** creates objects inside an existing box (for example a component's list box after the component is created) and restores the previous default container afterwards, also when `func` throws. The safe form of `setDefaultContainerBox()`. It has its own start/end stack, so groups started inside it stay in that box even when it is called while another box is still open (fixed on 2026-10-05).
*   **page:** `on()`, `off()`, `onKeyDown()`, `title`. **basic:** `version`, `isReady`, `sleep()`, `nextFrame()`, `clamp()`, `lerp()`, `objectOf()`, `escapeHtml()`, `storage.loadOr()`.

---

## Version 26.09.17

*   **`remove()` removes the children too:** When an object is removed, all basic.js objects inside it are removed as well (parents first). If a child has a `destroy()` function (the component template), it is called first, so components can clean their global events (for example `page.onResize`, `window` events, static lists like `RadioButton` groups).
    *   **Why:** Before, only the removed object itself was cleaned. The children kept their `onResize` registrations and global events, so a removed page stayed in the memory with all of its objects. In the admin panel template, every page change kept about 400 DOM nodes and 250 event listeners (after 240 page changes: 70 MB memory, 121,000 DOM nodes). Now it is 0.
    *   **Note:** A removed object is not for use again. Do not add an object to the screen again after `remove()`; create a new one.
    *   **Note:** Objects created directly on `page` (for example a `ContextMenu` opened by a page) are not inside the page box. Remove them yourself in the `remove()` of your page or component.
    *   **Note:** The components of this suite now put that cleanup in `remove()` instead of `destroy()` (`const superRemove = box.remove;` … `superRemove.call(box);`), so a component is removed like any other object: `myComponent.remove();`. `destroy()` is still called first for the objects that have one (for example `ScrollBar`).
*   **`object.elem._basicObject`:** Every element keeps a link to its basic.js object (set by `makeBasicObject()`).
*   **`object._isRemoved`:** `1` after `remove()`. A second `remove()` call does nothing.

---

## Version 26.03.26

*   **`HGroup()`, `VGroup()`, `endGroup()`:** Added to automatically align interface elements horizontally or vertically on the screen (Auto Layout).
*   **`parentBox` / `containerBox`:** Added so that objects can directly reference the main box (container) they are in.
*   **`HGroup({ fit: 1 })`:** Added the feature for auto-layout groups (HGroup, VGroup, etc.) to automatically wrap their dimensions according to the objects inside them (shrink-to-fit).
*   **`basic.storage`:** The structure previously located outside was moved to the `basic.storage` namespace. Also, features for checking with `has()` and deleting all data with `clear()` were added.
*   **`basic.clock`:** Clock operations were gathered under the `basic.clock` roof. Structural updates such as `.millisecond` were made in variable names.
*   **`basic.date`:** Date operations were gathered under the `basic.date` roof. New `.dayOfWeek` and `.dayOfMonth` properties were added to directly access information for that day.
*   **`waitAndRun()`:** For performance management, a function was added that allows certain functions to be run in a controlled manner (debounced) and delayed with millisecond intervals.
*   **`mergeIntoIfMissing(params, defaults)`:** A function was added that safely copies (merges) parameter objects, including nested (deep) objects, by adding only the missing properties without overwriting existing data.
*   **`Black()` / `White()` Opacity:** Practical color functions that directly take an opacity value were added. Example usage: `Black(0.2)`, `White(0)`.

---

## Version 25.06

*   **`AutoLayout()` / `endAutoLayout()`:** New functions were added to start and end auto layout operations.
*   **`.clipContent`:** A new property was added to clip or hide content that exceeds its boundaries (overflow).
*   **`autoFit()`:** The name of the old `fitAuto()` function was updated to `autoFit()` to provide better naming consistency.
*   **`.totalLeft` / `.totalTop`:** New properties were added to get the total (absolute) position of an element directly relative to the main page.
*   **`.padding`:** Inner spacing (padding) definitions were made much more flexible. Now a single value supports horizontal/vertical as an array, or full box model formats.
    *   Example usages: `.padding = 4`, `.padding = [12, 4]`, `.padding = [14, 4, 14, 4]`
