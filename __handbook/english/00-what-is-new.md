# basic.js — Release Notes (What is New?)

This document contains new features, updates, and changes added to the basic.js library.

---

## Version 26.09.17

*   **`remove()` removes the children too:** When an object is removed, all basic.js objects inside it are removed as well (parents first). If a child has a `destroy()` function (the component template), it is called first, so components can clean their global events (for example `page.onResize`, `window` events, static lists like `RadioButton` groups).
    *   **Why:** Before, only the removed object itself was cleaned. The children kept their `onResize` registrations and global events, so a removed page stayed in the memory with all of its objects. In the admin panel template, every page change kept about 400 DOM nodes and 250 event listeners (after 240 page changes: 70 MB memory, 121,000 DOM nodes). Now it is 0.
    *   **Note:** A removed object is not for use again. Do not add an object to the screen again after `remove()`; create a new one.
    *   **Note:** Objects created directly on `page` (for example a `ContextMenu` opened by a page) are not inside the page box. Call their `destroy()` in the `destroy()` of your page.
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
