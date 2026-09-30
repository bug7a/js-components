/* Bismillah */

/*

SortableList - v26.09

UI COMPONENT TEMPLATE
- A list whose order can be changed. (Sıralama nesnesi: verilen itemlerin sırasını düzenleyebildiğin liste.)
- Items: strings or objects { key, text, desc, locked }. getItems() / getKeys() give the new order.
- Mouse and touch: drag the handle (dragBy: "handle", default) or the whole row (dragBy: "row").
  The other rows slide out of the way. Near the top / bottom edge the list scrolls by itself.
- Keyboard: ArrowUp / ArrowDown move the focus. Space or Enter grabs the row, the arrow keys move it,
  Space / Enter drops it, Escape puts it back. Alt (or Ctrl) + ArrowUp / ArrowDown moves the row at once.
  Screen readers hear the moves (aria-live). Texts are in "texts" (English by default).
- showButtons: 1 -> Up / down buttons on every row. removable: 1 -> A remove (x) button (and the Delete key).
- locked: 1 on an item -> It does not move and the other rows can not pass it (Ex: a fixed first row).
- showNumbers: 1 -> The position number (1, 2, 3...) at the left of the row.
- createItemView(item, index, self) -> Draw your own row content (instead of the text and the description).
- height: "auto" -> The list grows with its rows. Otherwise it scrolls with basic/scroll-bar.js (if it is loaded).
- onChange(self, item, fromIndex, toIndex) is NOT called when the component is created,
  by setItems() or by the silent: 1 parameter.
- Everything is drawn with code (no image files needed).
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (SortableList.styles)

USAGE:
const list = SortableList({
    width: 360,
    height: 320,
    items: ["Sales", "Stock", "Collections", "Branches"],
    onChange: function (self, item, fromIndex, toIndex) { println(self.getKeys()); },
});
list.getItems();                          // Items in the new order (the same objects / strings you gave)
list.moveItem(0, 2);                      // onChange is called
list.addItem({ key: "hr", text: "Staff", desc: "Headcount by department" });
list.removeItem(1);
SortableList({ items: [{ key: "home", text: "Home", locked: 1 }, "Orders", "Reports"], showButtons: 1, removable: 1 });
SortableList({ height: "auto", dragBy: "row", showNumbers: 0, styleName: "modern" });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SortableListDefaults = {
    key: "0",
    width: 340,
    height: 320, // "auto": grows with the rows (no scrolling)
    items: [], // Strings or { key, text, desc, locked }
    dragBy: "handle", // "handle": drag by the grip at the left, "row": drag by the whole row (touch: the list then scrolls only by the scroll bar)
    showHandle: 1, // The grip at the left. (dragBy: "row" can hide it)
    showNumbers: 1, // Position numbers
    showButtons: 0, // Up / down buttons
    removable: 0, // A remove button and the Delete key
    enabled: 1,
    rowGap: 6, // Space between the rows
    emptyText: "No items",
    useScrollBar: 1, // basic/scroll-bar.js. 0: the scrollbar of the browser.
    ariaLabel: "Sortable list",
    createItemView: null, // function (item, index, self) { ... } Objects created here go into the content group of the row.
    texts: {
        handle: "Drag to reorder",
        moveUp: "Move up",
        moveDown: "Move down",
        remove: "Remove",
        locked: "Locked",
        grabbed: "{text} grabbed. Position {position} of {count}. Use the arrow keys to move, Space to drop, Escape to cancel.",
        moved: "{text}: position {position} of {count}.",
        dropped: "{text} dropped at position {position} of {count}.",
        canceled: "Move canceled. {text} is back at position {position}.",
        removed: "{text} removed.",
    },
    onChange: function (self, item, fromIndex, toIndex) { }, // self.getItems() for the new order
    onRemove: function (self, item, index) { },
    onItemClick: function (self, item, index) { },
    onDragStart: function (self, item, index) { },
    onDragEnd: function (self, item, index) { }, // index: the new position
    styleName: "classic", // "classic", "modern", "dark" or a name added to SortableList.styles
    style: { // Classic style package (default)
        box: {
            color: "transparent",
            border: 0,
            borderColor: "transparent",
            round: 0,
            padding: 4, // Room around the rows (the shadow of the dragged row)
        },
        row: {
            color: White(1),
            hoverColor: "#FAFAF9",
            border: 1,
            borderColor: Black(0.12),
            round: 8,
            padding: [12, 10],
            gap: 10, // Space between the parts of a row
            minHeight: 48,
        },
        rowFocus: {
            borderColor: "#141414",
        },
        rowDragging: {
            color: White(1),
            borderColor: Black(0.3),
            boxShadow: "0px 10px 24px rgba(0, 0, 0, 0.16)",
            scale: 1.02,
        },
        rowLocked: {
            color: "#F4F4F3",
        },
        handle: {
            iconColor: Black(0.3),
            hoverColor: Black(0.65),
            size: 18,
        },
        number: {
            width: 22,
            fontSize: 13,
            textColor: Black(0.4),
            fontFamily: "opensans-bold",
        },
        text: {
            fontSize: 15,
            textColor: "#141414",
            fontFamily: "",
        },
        desc: {
            fontSize: 12,
            textColor: Black(0.45),
        },
        button: {
            size: 28,
            iconSize: 14,
            iconColor: Black(0.55),
            hoverColor: Black(0.06),
            round: 6,
            disabledOpacity: 0.25,
        },
        empty: {
            fontSize: 14,
            textColor: Black(0.4),
        },
        disabled: {
            opacity: 0.5,
        },
        scrollBar: {
            bar_color: "#9A9A98",
            bar_mouseOverColor: "#6A6A68",
            bar_width: 4,
            bar_round: 3,
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
        },
    }
};

const SortableList = function (params = {}) {

    // Merge style package: params.style > SortableList.styles[styleName] > SortableListDefaults.style (classic)
    const _styleName = params.styleName || SortableListDefaults.styleName;
    const _stylePackage = SortableList.styles[_styleName];
    if (!_stylePackage) console.warn("SortableList: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, SortableListDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;
    const startItems = params.items;
    params.items = []; // WHY: The default array must not be shared by the instances. box.items is set below.
    const isAutoHeight = (String(params.height) === "auto"); // WHY: box.height reads 0 for "auto", so it is read here.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const ROW_TRANSITION = "background-color 0.15s, border-color 0.15s, box-shadow 0.15s";
    let entries = []; // { item, key, text, desc, locked, row, ... } in the current order
    let drag = null; // Pointer drag state
    let grab = null; // Keyboard grab state: { entry, startIndex }
    let isSettling = 0; // The dropped row is sliding to its place
    let settleTimer = null;
    let autoScrollFrame = null;
    let isReordering = 0; // WHY: Moving a focused row in the DOM fires blur. It must not drop the grabbed row.
    let suppressClick = 0; // WHY: The pointerup of a drag also fires a click on the row.

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.items is the current order, the same as getItems())

    // *** PRIVATE FUNCTIONS:

    // "Sales" or { key, text, desc, locked } -> entry
    const toEntry = function (item) {
        const isObject = (item !== null && typeof item === "object");
        const text = isObject ? String(item.text ?? item.key ?? "") : String(item ?? "");
        return {
            item: item,
            key: isObject ? String(item.key ?? text) : text,
            text: text,
            desc: isObject ? String(item.desc ?? "") : "",
            locked: (isObject && (item.locked == 1 || item.locked === true)) ? 1 : 0,
            row: null,
        };
    };

    const indexOf = function (entry) {
        return entries.indexOf(entry);
    };

    const syncItems = function () {
        box.items = entries.map(function (e) { return e.item; });
    };

    const formatText = function (template, entry) {
        return String(template || "")
            .replace("{text}", entry.text)
            .replace("{position}", String(indexOf(entry) + 1))
            .replace("{count}", String(entries.length));
    };

    const announce = function (template, entry) {
        box.lblLive.plainText = formatText(template, entry);
    };

    // Can the row at index move one step in direction (-1 / 1)?
    const canMove = function (index, direction) {
        const target = index + direction;
        if (box.enabled != 1) return 0;
        if (index < 0 || target < 0 || target >= entries.length) return 0;
        return (!entries[index].locked && !entries[target].locked) ? 1 : 0;
    };

    const paintRow = function (entry) {
        const row = entry.row;
        if (!row) return;
        const isDragged = (drag && drag.active && drag.entry === entry) || (grab && grab.entry === entry);
        const isFocused = (document.activeElement === row.elem);
        let color = entry.locked ? _s.rowLocked.color : _s.row.color;
        if (entry.isHover && !entry.locked && box.enabled == 1) color = _s.row.hoverColor;
        if (isDragged) color = _s.rowDragging.color;
        row.color = color;
        row.borderColor = isDragged ? _s.rowDragging.borderColor : (isFocused ? _s.rowFocus.borderColor : _s.row.borderColor);
        row.elem.style.boxShadow = isDragged ? _s.rowDragging.boxShadow : "none";
        row.elem.style.zIndex = isDragged ? "10" : "";
        row.elem.setAttribute("aria-grabbed", (grab && grab.entry === entry) ? "true" : "false");
    };

    const paintButton = function (btn, isEnabled) {
        if (!btn) return;
        btn.elem.style.opacity = isEnabled ? "1" : String(_s.button.disabledOpacity);
        btn.elem.style.cursor = isEnabled ? "pointer" : "default";
        btn.elem.setAttribute("aria-disabled", isEnabled ? "false" : "true");
        if (!isEnabled) btn.color = "transparent";
    };

    // Numbers, aria and the button states after a change of the order.
    const updateRows = function () {
        entries.forEach(function (entry, index) {
            const row = entry.row;
            if (!row) return;
            if (row.lblNumber) row.lblNumber.plainText = String(index + 1);
            row.elem.setAttribute("aria-posinset", String(index + 1));
            row.elem.setAttribute("aria-setsize", String(entries.length));
            paintButton(row.btnUp, canMove(index, -1));
            paintButton(row.btnDown, canMove(index, 1));
            paintRow(entry);
        });
        box.lblEmpty.visible = (entries.length == 0) ? 1 : 0;
        syncItems();
        if (box.scrollBar) box.scrollBar.refreshScroll();
    };

    // Changes the order of the data and the DOM. (No onChange)
    const moveEntry = function (from, to) {
        if (from === to || from < 0 || to < 0 || from >= entries.length || to >= entries.length) return 0;
        const entry = entries.splice(from, 1)[0];
        entries.splice(to, 0, entry);
        const elem = entry.row.elem;
        const hadFocus = (document.activeElement === elem);
        const next = entries[to + 1];
        isReordering = 1;
        box.wrapper.elem.insertBefore(elem, next ? next.row.elem : null);
        if (hadFocus) elem.focus({ preventScroll: true });
        isReordering = 0;
        updateRows();
        return 1;
    };

    const moveBy = function (entry, direction, fireChange) {
        const from = indexOf(entry);
        if (!canMove(from, direction)) return 0;
        moveEntry(from, from + direction);
        entry.row.elem.scrollIntoView({ block: "nearest" });
        if (fireChange) box.onChange(box, entry.item, from, from + direction);
        return 1;
    };

    const focusRow = function (index) {
        const entry = entries[Math.max(0, Math.min(index, entries.length - 1))];
        if (!entry) return;
        entry.row.elem.focus({ preventScroll: true });
        entry.row.elem.scrollIntoView({ block: "nearest" });
    };

    // *** KEYBOARD GRAB:

    const startGrab = function (entry) {
        if (box.enabled != 1 || entry.locked || grab || drag || isSettling) return;
        grab = { entry: entry, startIndex: indexOf(entry) };
        paintRow(entry);
        announce(box.texts.grabbed, entry);
        box.onDragStart(box, entry.item, grab.startIndex);
    };

    // apply: 1 -> Keep the new position. 0 -> Back to the start position.
    const endGrab = function (apply) {
        if (!grab) return;
        const g = grab;
        grab = null;
        const index = indexOf(g.entry);
        if (!apply && index !== g.startIndex) moveEntry(index, g.startIndex);
        paintRow(g.entry);
        const finalIndex = indexOf(g.entry);
        if (finalIndex < 0) return; // WHY: The row may be removed while it is grabbed.
        announce(apply ? box.texts.dropped : box.texts.canceled, g.entry);
        box.onDragEnd(box, g.entry.item, finalIndex);
        if (apply && finalIndex !== g.startIndex) box.onChange(box, g.entry.item, g.startIndex, finalIndex);
    };

    const onRowKeyDown = function (entry, event) {

        if (box.enabled != 1 || isSettling) return;
        const key = event.key;
        const index = indexOf(entry);

        if (grab && grab.entry === entry) {
            if (key === "ArrowUp" || key === "ArrowDown") {
                event.preventDefault();
                if (moveBy(entry, (key === "ArrowUp") ? -1 : 1, 0)) announce(box.texts.moved, entry);
            } else if (key === " " || key === "Enter") {
                event.preventDefault();
                endGrab(1);
            } else if (key === "Escape") {
                event.preventDefault();
                endGrab(0);
                entry.row.elem.scrollIntoView({ block: "nearest" });
            } else if (key === "Tab") {
                endGrab(1);
            }
            return;
        }

        switch (key) {
            case "ArrowUp":
            case "ArrowDown":
                event.preventDefault();
                if (event.altKey || event.ctrlKey || event.metaKey) {
                    if (moveBy(entry, (key === "ArrowUp") ? -1 : 1, 1)) announce(box.texts.moved, entry);
                } else {
                    focusRow(index + ((key === "ArrowUp") ? -1 : 1));
                }
                break;
            case "Home": event.preventDefault(); focusRow(0); break;
            case "End": event.preventDefault(); focusRow(entries.length - 1); break;
            case " ":
            case "Enter":
                event.preventDefault();
                startGrab(entry);
                break;
            case "Delete":
            case "Backspace":
                if (box.removable == 1) { event.preventDefault(); removeEntry(entry, 0, 1); }
                break;
        }

    };

    // *** POINTER DRAG:

    const getScrollTop = function () {
        return isAutoHeight ? 0 : box.scrollBox.elem.scrollTop;
    };

    const onPointerDown = function (entry, self, event) {
        if (box.enabled != 1 || entry.locked || drag || grab || isSettling) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        event.preventDefault(); // WHY: No text selection, no native drag.
        entry.row.elem.focus({ preventScroll: true });
        const y = withPageZoom(event.clientY);
        drag = { entry: entry, source: self, pointerId: event.pointerId, startY: y, lastY: y, lastClientY: event.clientY, startScroll: getScrollTop(), active: 0 };
        try { self.elem.setPointerCapture(event.pointerId); } catch (e) { }
    };

    const onPointerMove = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag.lastY = withPageZoom(event.clientY);
        drag.lastClientY = event.clientY;
        if (!drag.active) {
            if (Math.abs(drag.lastY - drag.startY) < 4) return; // WHY: A small move is still a click.
            beginDrag();
        }
        updateDrag();
        updateAutoScroll();
    };

    const onPointerUp = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (drag.active) {
            suppressClick = 1;
            finishDrag(1);
        } else {
            drag = null;
        }
    };

    const onPointerCancel = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (drag.active) finishDrag(0); else drag = null;
    };

    const beginDrag = function () {
        const index = indexOf(drag.entry);
        drag.active = 1;
        drag.index = index;
        drag.target = index;
        drag.tops = entries.map(function (e) { return e.row.elem.offsetTop; });
        drag.heights = entries.map(function (e) { return e.row.elem.offsetHeight; });
        // The locked rows are walls: the dragged row stays between them.
        drag.minIndex = 0;
        drag.maxIndex = entries.length - 1;
        for (let i = index - 1; i >= 0; i--) { if (entries[i].locked) { drag.minIndex = i + 1; break; } }
        for (let i = index + 1; i < entries.length; i++) { if (entries[i].locked) { drag.maxIndex = i - 1; break; } }
        entries.forEach(function (e, i) {
            e.row.elem.style.transition = (i === index) ? ROW_TRANSITION : ROW_TRANSITION + ", transform 0.18s ease";
        });
        drag.source.elem.style.cursor = "grabbing";
        paintRow(drag.entry);
        box.onDragStart(box, drag.entry.item, index);
    };

    const updateDrag = function () {
        if (!drag || !drag.active) return;
        const i = drag.index, t = drag.tops, h = drag.heights;
        let dy = (drag.lastY - drag.startY) + (getScrollTop() - drag.startScroll);
        const minDy = t[drag.minIndex] - t[i];
        const maxDy = (t[drag.maxIndex] + h[drag.maxIndex]) - (t[i] + h[i]);
        dy = Math.max(minDy, Math.min(dy, maxDy));

        // Target: the dragged row passes a row when its center passes the center of that row.
        const center = t[i] + h[i] / 2 + dy;
        let target = i;
        for (let k = drag.minIndex; k < i; k++) { if (center < t[k] + h[k] / 2) { target = k; break; } }
        for (let k = drag.maxIndex; k > i; k--) { if (center > t[k] + h[k] / 2) { target = k; break; } }
        drag.target = target;

        const slot = h[i] + box.rowGap;
        entries.forEach(function (e, k) {
            if (k === i) return;
            let shift = 0;
            if (i < target && k > i && k <= target) shift = -slot;
            else if (target < i && k >= target && k < i) shift = slot;
            e.row.elem.style.transform = shift ? "translateY(" + shift + "px)" : "";
            if (e.row.lblNumber) e.row.lblNumber.plainText = String(k + 1 + ((shift < 0) ? -1 : (shift > 0) ? 1 : 0));
        });
        entries[i].row.elem.style.transform = "translateY(" + dy + "px) scale(" + _s.rowDragging.scale + ")";
        if (entries[i].row.lblNumber) entries[i].row.lblNumber.plainText = String(target + 1); // The numbers show the new order while dragging.
    };

    // Scrolls the list while the pointer is near its top or bottom edge.
    const updateAutoScroll = function () {
        if (isAutoHeight || !drag || !drag.active) return;
        const rect = box.scrollBox.elem.getBoundingClientRect();
        const edge = Math.min(48, rect.height / 4);
        const y = drag.lastClientY;
        let speed = 0;
        if (y < rect.top + edge) speed = -(rect.top + edge - y) / 3;
        else if (y > rect.bottom - edge) speed = (y - (rect.bottom - edge)) / 3;
        drag.scrollSpeed = Math.max(-18, Math.min(18, Math.round(speed)));
        if (drag.scrollSpeed && !autoScrollFrame) autoScrollFrame = requestAnimationFrame(autoScrollTick);
    };

    const autoScrollTick = function () {
        autoScrollFrame = null;
        if (!box || !drag || !drag.active || !drag.scrollSpeed) return;
        const el = box.scrollBox.elem;
        const before = el.scrollTop;
        el.scrollTop = before + drag.scrollSpeed;
        if (el.scrollTop === before) return; // At the end: stop the loop.
        updateDrag();
        autoScrollFrame = requestAnimationFrame(autoScrollTick);
    };

    const stopAutoScroll = function () {
        if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
        autoScrollFrame = null;
    };

    // apply: 1 -> Drop at the target. 0 -> Back to the start.
    const finishDrag = function (apply) {
        stopAutoScroll();
        const d = drag;
        const i = d.index, t = d.tops, h = d.heights;
        const target = apply ? d.target : i;
        let finalDy = 0;
        if (target > i) finalDy = (t[target] + h[target]) - (t[i] + h[i]);
        else if (target < i) finalDy = t[target] - t[i];
        if (!apply) entries.forEach(function (e, k) { if (k !== i) e.row.elem.style.transform = ""; });

        // The dropped row slides to its place, then the order changes.
        const elem = d.entry.row.elem;
        elem.style.transition = ROW_TRANSITION + ", transform 0.16s ease";
        elem.style.transform = "translateY(" + finalDy + "px)";
        d.source.elem.style.cursor = "";
        drag = null;
        isSettling = 1;
        paintRow(d.entry);

        settleTimer = setTimeout(function () {
            settleTimer = null;
            isSettling = 0;
            if (!box) return;
            entries.forEach(function (e) {
                e.row.elem.style.transition = "none";
                e.row.elem.style.transform = "";
            });
            if (!moveEntry(i, target)) updateRows(); // WHY: Puts back the numbers changed while dragging.
            void box.wrapper.elem.offsetHeight; // WHY: Applies the "none" transition before it is set back.
            entries.forEach(function (e) { e.row.elem.style.transition = ROW_TRANSITION; });
            const finalIndex = indexOf(d.entry);
            box.onDragEnd(box, d.entry.item, finalIndex);
            if (target !== i) {
                announce(box.texts.dropped, d.entry);
                box.onChange(box, d.entry.item, i, finalIndex);
            }
        }, 170);
    };

    // *** VIEW:

    const createIconButton = function (svg, ariaLabel) {
        const btn = Label({
            text: svg,
            width: _s.button.size,
            height: _s.button.size,
            round: _s.button.round,
            color: "transparent",
            clickable: 1,
        });
        btn.elem.style.display = "flex";
        btn.elem.style.alignItems = "center";
        btn.elem.style.justifyContent = "center";
        btn.elem.style.lineHeight = "0";
        btn.elem.style.flexShrink = "0";
        btn.elem.style.cursor = "pointer";
        btn.elem.style.transition = "background-color 0.15s";
        btn.elem.setAttribute("role", "button");
        btn.elem.setAttribute("aria-label", ariaLabel);
        btn.elem.setAttribute("title", ariaLabel);
        btn.on("mouseenter", function () { if (btn.elem.getAttribute("aria-disabled") !== "true") btn.color = _s.button.hoverColor; });
        btn.on("mouseleave", function () { btn.color = "transparent"; });
        // WHY: A press on a button must not start a drag of the row (dragBy: "row").
        btn.on("pointerdown", function (self, event) { event.stopPropagation(); event.preventDefault(); });
        return btn;
    };

    const createRow = function (entry) {

        const isRowDrag = (box.dragBy === "row");

        // GROUP: Row
        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: _s.row.gap,
            padding: _s.row.padding,
            color: entry.locked ? _s.rowLocked.color : _s.row.color,
            border: _s.row.border,
            borderColor: _s.row.borderColor,
            round: _s.row.round,
        });
        entry.row = row;
        row.elem.style.minHeight = _s.row.minHeight + "px";
        row.elem.style.boxSizing = "border-box";
        row.elem.style.flexShrink = "0";
        row.elem.style.outline = "none";
        row.elem.style.transition = ROW_TRANSITION;
        row.elem.style.transformOrigin = "center center";
        row.elem.setAttribute("role", "option");
        row.elem.setAttribute("aria-roledescription", "sortable item");
        row.elem.setAttribute("aria-label", entry.text + (entry.desc ? ", " + entry.desc : "") + (entry.locked ? ", " + box.texts.locked : ""));
        row.clickable = 1;
        row.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        if (isRowDrag && !entry.locked) {
            row.elem.style.cursor = "grab";
            row.elem.style.touchAction = "none";
        }

            // LABEL: Handle (grip, or a lock for a locked row)
            if (box.showHandle == 1) {
                row.handle = Label({
                    text: entry.locked ? SortableList.getLockSvg(_s.handle.iconColor, _s.handle.size - 2) : SortableList.getGripSvg(_s.handle.iconColor, _s.handle.size),
                    width: _s.handle.size + 6,
                    height: _s.handle.size + 10,
                    clickable: 1,
                });
                row.handle.elem.style.display = "flex";
                row.handle.elem.style.alignItems = "center";
                row.handle.elem.style.justifyContent = "center";
                row.handle.elem.style.lineHeight = "0";
                row.handle.elem.style.flexShrink = "0";
                row.handle.elem.style.marginLeft = "-4px";
                row.handle.elem.setAttribute("aria-hidden", "true");
                row.handle.elem.setAttribute("title", entry.locked ? box.texts.locked : box.texts.handle);
                if (!entry.locked) {
                    row.handle.elem.style.cursor = "grab";
                    row.handle.elem.style.touchAction = "none";
                    row.handle.on("mouseenter", function () { if (box.enabled == 1) row.handle.text = SortableList.getGripSvg(_s.handle.hoverColor, _s.handle.size); });
                    row.handle.on("mouseleave", function () { row.handle.text = SortableList.getGripSvg(_s.handle.iconColor, _s.handle.size); });
                }
            }

            // LABEL: Position number
            if (box.showNumbers == 1) {
                row.lblNumber = Label({
                    plainText: "",
                    width: _s.number.width,
                    fontSize: _s.number.fontSize,
                    textColor: _s.number.textColor,
                    textAlign: "center",
                });
                row.lblNumber.elem.style.flexShrink = "0";
                row.lblNumber.elem.style.fontVariantNumeric = "tabular-nums";
                if (_s.number.fontFamily) row.lblNumber.elem.style.fontFamily = _s.number.fontFamily;
            }

            // GROUP: Content (text, description or your own view)
            row.content = VGroup({ width: "auto", height: "auto", align: "left center", gap: 2 });
            row.content.elem.style.flex = "1 1 0";
            row.content.elem.style.minWidth = "0";

                if (typeof box.createItemView === "function") {
                    box.createItemView(entry.item, indexOf(entry), box);
                } else {
                    row.lblText = Label({
                        plainText: entry.text,
                        width: "100%",
                        fontSize: _s.text.fontSize,
                        textColor: _s.text.textColor,
                        ellipsis: 1,
                    });
                    if (_s.text.fontFamily) row.lblText.elem.style.fontFamily = _s.text.fontFamily;
                    if (entry.desc) {
                        row.lblDesc = Label({
                            plainText: entry.desc,
                            width: "100%",
                            fontSize: _s.desc.fontSize,
                            textColor: _s.desc.textColor,
                            ellipsis: 1,
                        });
                    }
                }

            endGroup();

            // LABEL: Up / down buttons
            if (box.showButtons == 1) {
                row.btnUp = createIconButton(SortableList.getChevronSvg("up", _s.button.iconColor, _s.button.iconSize), box.texts.moveUp);
                row.btnUp.on("click", function (self, event) { event.stopPropagation(); if (moveBy(entry, -1, 1)) { announce(box.texts.moved, entry); entry.row.elem.focus({ preventScroll: true }); } });
                row.btnDown = createIconButton(SortableList.getChevronSvg("down", _s.button.iconColor, _s.button.iconSize), box.texts.moveDown);
                row.btnDown.on("click", function (self, event) { event.stopPropagation(); if (moveBy(entry, 1, 1)) { announce(box.texts.moved, entry); entry.row.elem.focus({ preventScroll: true }); } });
            }

            // LABEL: Remove button
            if (box.removable == 1) {
                row.btnRemove = createIconButton(SortableList.getCloseSvg(_s.button.iconColor, _s.button.iconSize), box.texts.remove);
                row.btnRemove.on("click", function (self, event) { event.stopPropagation(); if (box.enabled == 1) removeEntry(entry, 0, 1); });
            }

        endGroup();

        // Events of the row
        const dragSource = (isRowDrag || !row.handle) ? row : row.handle;
        if (!entry.locked && (isRowDrag || row.handle)) {
            dragSource.on("pointerdown", function (self, event) { onPointerDown(entry, self, event); });
            dragSource.on("pointermove", onPointerMove);
            dragSource.on("pointerup", onPointerUp);
            dragSource.on("pointercancel", onPointerCancel);
        }
        row.on("keydown", function (self, event) { onRowKeyDown(entry, event); });
        row.on("focus", function () { paintRow(entry); });
        row.on("blur", function () {
            if (isReordering) return;
            if (grab && grab.entry === entry) endGrab(1);
            paintRow(entry);
        });
        row.on("mouseenter", function () { entry.isHover = 1; if (!drag) paintRow(entry); });
        row.on("mouseleave", function () { entry.isHover = 0; if (!drag) paintRow(entry); });
        row.on("click", function () {
            if (suppressClick) { suppressClick = 0; return; }
            if (box.enabled == 1) box.onItemClick(box, entry.item, indexOf(entry));
        });

        return row;
    };

    // Draws all the rows again.
    const render = function () {
        if (grab) grab = null;
        if (box.wrapper) box.wrapper.remove();
        const host = isAutoHeight ? box : box.scrollBox;
        createIn(host, function () {
            // GROUP: Rows
            box.wrapper = VGroup({
                width: "100%",
                height: "auto",
                align: "left top",
                gap: box.rowGap,
                padding: _s.box.padding,
            });
            box.wrapper.elem.style.alignItems = "stretch";
            box.wrapper.elem.style.boxSizing = "border-box";
            box.wrapper.position = "relative"; // WHY: The scroll box (or the auto height box) grows with it.
            box.wrapper.elem.setAttribute("role", "listbox");
            box.wrapper.elem.setAttribute("aria-label", box.ariaLabel);
                entries.forEach(createRow);
            endGroup();
        });
        updateRows();
    };

    const removeEntry = function (entry, silent, moveFocus) {
        const index = indexOf(entry);
        if (index < 0) return null;
        if (grab && grab.entry === entry) grab = null;
        const hadFocus = (document.activeElement === entry.row.elem);
        entries.splice(index, 1);
        isReordering = 1;
        entry.row.remove();
        isReordering = 0;
        entry.row = null;
        updateRows();
        if (!silent) announce(box.texts.removed, entry);
        if (hadFocus && moveFocus && entries.length) focusRow(Math.min(index, entries.length - 1));
        if (!silent) box.onRemove(box, entry.item, index);
        return entry.item;
    };

    const isBusy = function () {
        return (drag && drag.active) || isSettling;
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        if (isBusy()) return;
        entries = (Array.isArray(items) ? items : []).map(toEntry);
        render();
    };
    // USAGE: list.setItems(["A", "B", { key: "c", text: "C", desc: "Third", locked: 1 }]) // onChange is not called.

    box.getItems = function () {
        return entries.map(function (e) { return e.item; });
    };
    // USAGE: const order = list.getItems(); // The same strings / objects in the new order.

    box.getKeys = function () {
        return entries.map(function (e) { return e.key; });
    };
    // USAGE: list.getKeys() // ["sales", "stock", ...] (a string item is its own key)

    box.getIndexByKey = function (key) {
        return entries.findIndex(function (e) { return e.key === String(key); });
    };

    // silent: 1 -> onChange is not called. A locked row does not move. Returns 1 when it moved.
    box.moveItem = function (fromIndex, toIndex, silent = 0) {
        if (isBusy()) return 0;
        const from = Number(fromIndex);
        const to = Math.max(0, Math.min(Number(toIndex), entries.length - 1));
        const entry = entries[from];
        if (!entry || entry.locked || from === to) return 0;
        moveEntry(from, to);
        if (!silent) box.onChange(box, entry.item, from, to);
        return 1;
    };
    // USAGE: list.moveItem(0, 3)

    box.moveUp = function (index) {
        const entry = entries[index];
        return (entry && !isBusy()) ? moveBy(entry, -1, 1) : 0;
    };

    box.moveDown = function (index) {
        const entry = entries[index];
        return (entry && !isBusy()) ? moveBy(entry, 1, 1) : 0;
    };

    // index: -1 or empty -> at the end.
    box.addItem = function (item, index = -1) {
        if (isBusy()) return;
        const entry = toEntry(item);
        const at = (index < 0 || index > entries.length) ? entries.length : index;
        entries.splice(at, 0, entry);
        createIn(box.wrapper, function () { createRow(entry); });
        const next = entries[at + 1];
        if (next) box.wrapper.elem.insertBefore(entry.row.elem, next.row.elem);
        updateRows();
    };
    // USAGE: list.addItem("New item") or list.addItem({ key: "x", text: "X" }, 0)

    // silent: 1 -> onRemove is not called. Returns the removed item.
    box.removeItem = function (index, silent = 0) {
        if (isBusy()) return null;
        const entry = entries[index];
        return entry ? removeEntry(entry, silent, 0) : null;
    };
    // USAGE: list.removeItem(2)

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1 && grab) endGrab(0);
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
        entries.forEach(function (e) { if (e.row) e.row.elem.tabIndex = (box.enabled == 1) ? 0 : -1; });
        updateRows();
    };
    // USAGE: get: list.enabled, set: list.setEnabled(0)

    box.focusItem = function (index = 0) {
        focusRow(index);
    };

    box.refresh = function () {
        updateRows();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        stopAutoScroll();
        clearTimeout(settleTimer);
        settleTimer = null;
        drag = null;
        grab = null;
        if (box.scrollBar) { box.scrollBar.remove(); box.scrollBar = null; }
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.style.boxSizing = "border-box";

    if (!isAutoHeight) {
        // BOX: Scrolling area
        box.scrollBox = Box(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
    }

    // LABEL: Empty text
    box.lblEmpty = Label({
        plainText: box.emptyText,
        width: "100%",
        fontSize: _s.empty.fontSize,
        textColor: _s.empty.textColor,
        textAlign: "center",
        padding: [0, 20],
        visible: 0,
    });
    if (isAutoHeight) box.lblEmpty.position = "relative";
    else box.lblEmpty.top = 24;

    // LABEL: Screen reader messages (not visible)
    box.lblLive = Label({ left: 0, top: 0, width: 1, height: 1, opacity: 0, plainText: "" });
    box.lblLive.elem.setAttribute("aria-live", "polite");
    box.lblLive.elem.style.overflow = "hidden";

    if (!isAutoHeight && box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollBox, neverHide: 0, showDots: 0 }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    if (!isAutoHeight) {
        // WHY: A wheel scroll during a drag moves the list under the dragged row.
        box.scrollBox.on("scroll", function () { if (drag && drag.active) updateDrag(); });
    }

    entries = (Array.isArray(startItems) ? startItems : []).map(toEntry);
    render();
    box.setEnabled(box.enabled);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

SortableList.getGripSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="' + color + '"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>';
};

SortableList.getLockSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
};

SortableList.getChevronSvg = function (direction, color, size) {
    const path = (direction === "up") ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
};

SortableList.getCloseSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: SortableList({ styleName: "modern" })
// USAGE: SortableList({ styleName: "dark", style: { row: { round: 4 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SortableList.styles.myStyle = { row: { color: "ivory" } };
SortableList.styles = {

    // White rows with a thin border.
    classic: SortableListDefaults.style,

    // Soft cadetblue rows, no border. Same colors as the modern Stepper, CheckBox, ProgressBar and Tabs.
    modern: {
        row: { color: "#EEF5F5", hoverColor: "#E4EFEF", border: 1, borderColor: "transparent", round: 12, padding: [14, 10], gap: 10, minHeight: 50 },
        rowFocus: { borderColor: "cadetblue" },
        rowDragging: { color: White(1), borderColor: "cadetblue", boxShadow: "0px 12px 28px rgba(47, 95, 97, 0.25)", scale: 1.02 },
        rowLocked: { color: "#F5F8F8" },
        handle: { iconColor: "#8FB5B6", hoverColor: "#2F5F61", size: 18 },
        number: { width: 22, fontSize: 13, textColor: "cadetblue", fontFamily: "opensans-bold" },
        text: { fontSize: 15, textColor: "#2F5F61", fontFamily: "" },
        desc: { fontSize: 12, textColor: "#6E9A9B" },
        button: { size: 28, iconSize: 14, iconColor: "#2F5F61", hoverColor: "#CFE2E2", round: 100, disabledOpacity: 0.25 },
        empty: { fontSize: 14, textColor: "#6E9A9B" },
        scrollBar: { bar_color: "#CFE2E2", bar_mouseOverColor: "cadetblue", bar_width: 4, bar_round: 3, bar_opacity: 0.6, bar_mouseOverOpacity: 1, bar_padding: 2 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE, TagInput, Tabs and Stepper "dark".
    dark: {
        row: { color: "#232322", hoverColor: "#2A2A29", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: [12, 10], gap: 10, minHeight: 48 },
        rowFocus: { borderColor: "#65A293" },
        rowDragging: { color: "#2C2C2B", borderColor: "#65A293", boxShadow: "0px 12px 28px rgba(0, 0, 0, 0.5)", scale: 1.02 },
        rowLocked: { color: "#1C1C1B" },
        handle: { iconColor: "rgba(255, 255, 255, 0.3)", hoverColor: "rgba(255, 255, 255, 0.8)", size: 18 },
        number: { width: 22, fontSize: 13, textColor: "#65A293", fontFamily: "opensans-bold" },
        text: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)", fontFamily: "" },
        desc: { fontSize: 12, textColor: "rgba(255, 255, 255, 0.45)" },
        button: { size: 28, iconSize: 14, iconColor: "rgba(255, 255, 255, 0.75)", hoverColor: "rgba(255, 255, 255, 0.10)", round: 6, disabledOpacity: 0.25 },
        empty: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.45)" },
        disabled: { opacity: 0.4 },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

};
