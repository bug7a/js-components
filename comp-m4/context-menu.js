/* Bismillah */

/*

ContextMenu - v26.09

UI COMPONENT TEMPLATE
- A simple menu that opens at the mouse point. (Like the right click menu of Windows, but simpler.)
- Items can be only text, or icon + text.
- If at least one item has an icon, all texts start at the same place. (Items without icon get an empty icon space.)
- If no item has an icon, texts start near the left side.
- "-" in the item list adds a separator line.
- Closes on: item click, click outside, Escape, mouse wheel outside, page resize, window blur.
- Keyboard: ArrowUp/ArrowDown to move, Enter or Space to click, Escape to close.

ITEM: { text, key, iconFile, enabled, data, onClick }
- A string is also accepted: "Copy" -> { text: "Copy" }
- "-" or { type: "separator" }: Separator line
- enabled: 0 -> Shown, but can not be clicked.
- onClick: function (self, item, index) {} -> Optional, only for this item.

USAGE:
const menu = ContextMenu({ items: ["Open", "-", { text: "Delete", key: "delete", iconFile: "delete.png" }] });
menu.attachTo(myBox);                 // Right click on myBox opens the menu.
menu.attachTo(myButton, "click");     // Left click on myButton opens the menu.
menu.openAt(event.clientX, event.clientY);

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ContextMenuDefaults = {
    key: "0",
    items: [], // [{ text, key, iconFile, enabled, data, onClick }, "-", "Text"]
    target: null, // An object (or a list of objects). The menu opens on it with the trigger.
    trigger: "contextmenu", // "contextmenu": Right click, "click": Left click
    minWidth: 180,
    maxWidth: 320, // Long texts are cut with "...". 0: No limit.
    enabled: 1,
    ariaLabel: "Menu",
    onClick: function (self, item, index) { }, // self.source: The object that opened the menu.
    onOpen: function (self) { },
    onClose: function (self) { },
    style: {
        menu: {
            color: "white",
            border: 1,
            borderColor: Black(0.12),
            round: 8,
            padding: 4,
            shadow: "0px 8px 24px " + Black(0.14),
            zIndex: 1000,
        },
        item: {
            height: 32,
            fontSize: 14,
            textColor: Black(0.85),
            color: "transparent",
            round: 5,
            padding: 10, // Left and right space
            gap: 10, // Space between icon and text
        },
        itemHover: {
            textColor: Black(0.9),
            color: Black(0.06),
        },
        disabled: {
            textColor: Black(0.35),
            opacity: 0.4, // Icon opacity
        },
        icon: {
            width: 16,
            height: 16,
        },
        separator: {
            color: Black(0.1),
            space: 4, // Space above and below the line
        },
    }
};

const ContextMenu = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ContextMenuDefaults);

    // Edit params, if needed:
    const _ms = params.style.menu;
    params.width = "auto";
    params.height = "auto";
    params.color = _ms.color;
    params.border = _ms.border;
    params.borderColor = _ms.borderColor;
    params.round = _ms.round;

    // WHY: The menu must be over everything. Create it directly on the page,
    // even if ContextMenu() is called inside a group.
    const _previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: Component container (the menu panel)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let rows = []; // Created row objects (items and separators)
    let attachedList = []; // [{ obj, trigger, removeEvent }]
    let isOpen = 0;
    let activeIndex = -1;
    let skipOpenFor = null; // WHY: A click on the opener button (while open) must close the menu, not open it again.
    let skipOpenTime = 0;
    let openPageSize = ""; // Page size when the menu was opened.

    // *** PUBLIC VARIABLES:
    // [var] Items: [{ text, key, iconFile, enabled, data, onClick } or { type: "separator" }]
    box.items = [];
    // [var] The object that opened the menu. (attachTo) null: Opened with openAt().
    box.source = null;

    // *** PRIVATE FUNCTIONS:

    // Create objects inside a container, after the component is created.
    const createIn = function (container, func) {
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
        func();
        setDefaultContainerBox(previous);
    };

    const normalizeItem = function (item) {
        if (item === "-" || (item && item.type == "separator")) {
            return { type: "separator" };
        }
        if (typeof item == "string" || typeof item == "number") {
            return { type: "item", text: String(item), enabled: 1 };
        }
        const result = Object.assign({ text: "", enabled: 1 }, item);
        result.type = "item";
        result.enabled = (result.enabled == 1 || result.enabled === true) ? 1 : 0;
        return result;
    };

    const isInsideMenu = function (element) {
        return !!(box && element && box.elem.contains(element));
    };

    const isClickableIndex = function (index) {
        const item = box.items[index];
        return !!(item && item.type == "item" && item.enabled == 1);
    };

    const setActive = function (index) {

        if (activeIndex == index) return;

        const oldRow = rows[activeIndex];
        if (oldRow && oldRow.label) setRowHover(oldRow, 0);

        activeIndex = index;

        const newRow = rows[activeIndex];
        if (newRow && newRow.label) setRowHover(newRow, 1);

    };

    const setRowHover = function (row, isOver) {
        const style = (isOver) ? _s.itemHover : _s.item;
        row.color = style.color;
        row.label.textColor = (row.item.enabled == 1) ? style.textColor : _s.disabled.textColor;
    };

    // Move the active item with the keyboard. Skips separators and disabled items.
    const moveActive = function (direction) {

        const count = box.items.length;
        if (count == 0) return;

        // WHY: No active item: ArrowDown starts from the first item, ArrowUp from the last item.
        let index = (activeIndex < 0 && direction < 0) ? count : activeIndex;
        for (let i = 0; i < count; i++) {
            index = (index + direction + count) % count;
            if (isClickableIndex(index)) {
                setActive(index);
                return;
            }
        }

    };

    const createSeparator = function () {

        // BOX: Line
        const line = Box({
            width: "auto",
            height: 1,
            color: _s.separator.color,
        });
        line.elem.style.flexShrink = "0";
        line.elem.style.margin = _s.separator.space + "px " + _s.item.padding + "px";
        line.elem.setAttribute("role", "separator");

        return line;

    };

    const createItem = function (item, index, hasIcon) {

        // GROUP: Row (icon space + label)
        const row = HGroup({
            width: "auto",
            height: _s.item.height,
            align: "left center",
            gap: _s.item.gap,
            color: _s.item.color,
            round: _s.item.round,
        });
        row.elem.style.padding = "0px " + _s.item.padding + "px";
        row.elem.style.flexShrink = "0";
        row.elem.style.cursor = (item.enabled == 1) ? "pointer" : "default";
        row.elem.setAttribute("role", "menuitem");
        row.elem.setAttribute("aria-disabled", (item.enabled == 1) ? "false" : "true");
        row.item = item;
        row.index = index;

            // ICON: Only if one of the items has an icon.
            // WHY: Items without an icon get an empty space, so every text starts at the same place.
            if (hasIcon) {
                if (item.iconFile) {
                    row.icon = Icon({
                        width: _s.icon.width,
                        height: _s.icon.height,
                    });
                    row.icon.load(item.iconFile);
                    row.icon.elem.alt = "";
                    if (item.enabled != 1) row.icon.opacity = _s.disabled.opacity;
                } else {
                    row.icon = Box({
                        width: _s.icon.width,
                        height: _s.icon.height,
                        color: "transparent",
                    });
                }
                row.icon.elem.style.flexShrink = "0";
            }

            // LABEL: Text
            row.label = Label({
                text: ContextMenu.escapeHtml(item.text),
                fontSize: _s.item.fontSize,
                textColor: (item.enabled == 1) ? _s.item.textColor : _s.disabled.textColor,
            });
            row.label.elem.style.whiteSpace = "nowrap";
            row.label.elem.style.overflow = "hidden";
            row.label.elem.style.textOverflow = "ellipsis";
            row.label.elem.style.minWidth = "0";
            row.label.elem.style.flexShrink = "1";

        endGroup();

        row.on("mouseenter", function () {
            setActive((item.enabled == 1) ? index : -1);
        });

        row.on("click", function () {
            box.clickItem(index);
        });

        return row;

    };

    const render = function () {

        rows.forEach(function (obj) { obj.remove(); });
        rows = [];
        activeIndex = -1;

        const hasIcon = box.items.some(function (item) { return item.type == "item" && item.iconFile; });

        createIn(box.content, function () {

            box.items.forEach(function (item, index) {

                // WHY: endGroup() (in createItem) sets the container to the last started group, not to box.content.
                setDefaultContainerBox(box.content);

                if (item.type == "separator") {
                    rows.push(createSeparator());
                } else {
                    rows.push(createItem(item, index, hasIcon));
                }

            });

        });

    };

    // Put the menu at the point. If there is no space, open it to the left and/or up.
    const positionMenu = function (x, y) {

        const menuWidth = box.elem.offsetWidth;
        const menuHeight = box.elem.offsetHeight;
        const space = 8; // Minimum space to the page sides

        let left = x;
        let top = y;
        let originX = "left";
        let originY = "top";

        if (left + menuWidth > page.width - space) {
            left = x - menuWidth;
            originX = "right";
        }
        if (top + menuHeight > page.height - space) {
            top = y - menuHeight;
            originY = "bottom";
        }

        left = Math.max(space, Math.min(left, page.width - menuWidth - space));
        top = Math.max(space, Math.min(top, page.height - menuHeight - space));

        box.left = left;
        box.top = top;
        box.elem.style.transformOrigin = originX + " " + originY;

    };

    const onDocumentPointerDown = function (event) {

        if (isInsideMenu(event.target)) return;

        // Left click on the opener button: close only. (Do not open again with the click event.)
        if (event.button === 0 && box.source && box.source.elem.contains(event.target)) {
            const info = attachedList.find(function (a) { return a.obj == box.source; });
            if (info && info.trigger == "click") {
                skipOpenFor = box.source;
                skipOpenTime = Date.now();
            }
        }

        box.close();

    };

    const onDocumentKeyDown = function (event) {

        if (event.key === "Escape") {
            event.preventDefault();
            box.close();
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActive(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActive(-1);
        } else if (event.key === "Enter" || event.key === " ") {
            if (activeIndex < 0) return;
            event.preventDefault();
            box.clickItem(activeIndex);
        } else if (event.key === "Tab") {
            box.close();
        }

    };

    const onDocumentWheel = function (event) {
        if (!isInsideMenu(event.target)) box.close();
    };

    const onWindowBlur = function () {
        box.close();
    };

    const onPageResize = function () {
        // WHY: Close only if the size really changed. (Some browsers call resize without a change.)
        if (isOpen && page.width + "x" + page.height != openPageSize) box.close();
    };

    const addDocumentEvents = function () {
        // WHY: Capture phase: Some objects stop the event. The menu must still close.
        document.addEventListener("pointerdown", onDocumentPointerDown, true);
        document.addEventListener("keydown", onDocumentKeyDown, true);
        document.addEventListener("wheel", onDocumentWheel, true);
        window.addEventListener("blur", onWindowBlur);
    };

    const removeDocumentEvents = function () {
        document.removeEventListener("pointerdown", onDocumentPointerDown, true);
        document.removeEventListener("keydown", onDocumentKeyDown, true);
        document.removeEventListener("wheel", onDocumentWheel, true);
        window.removeEventListener("blur", onWindowBlur);
    };

    const setItemsSilent = function (items) {
        box.items = (items || []).map(normalizeItem);
        render();
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        setItemsSilent(items);
        if (isOpen) box.close(); // WHY: The size changes. Open it again at the new point.
    };
    // USAGE: menu.setItems(["Open", "-", { text: "Delete", key: "delete" }])

    box.getItems = function () {
        return box.items.slice();
    };

    box.getItemByKey = function (key) {
        return box.items.find(function (item) { return item.key == key; }) || null;
    };

    box.setItemEnabled = function (key, enabled) {
        const item = box.getItemByKey(key);
        if (!item) return;
        item.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        render();
    };
    // USAGE: menu.setItemEnabled("paste", 0)

    // x, y: Mouse point on the screen. (event.clientX, event.clientY)
    box.openAt = function (x, y, source = null) {

        if (box.enabled != 1 || box.items.length == 0) return;
        if (isOpen) box.close();

        isOpen = 1;
        box.source = source;
        openPageSize = page.width + "x" + page.height;

        // Show hidden (opacity 0) first, so the size can be measured.
        box.setMotion("none");
        box.opacity = 0;
        box.elem.style.transform = "scale(0.97)";
        box.visible = 1;

        positionMenu(withPageZoom(x), withPageZoom(y));

        // Small open animation
        requestAnimationFrame(function () {
            if (!box || !isOpen) return;
            box.setMotion("opacity 0.12s, transform 0.12s");
            box.opacity = 1;
            box.elem.style.transform = "scale(1)";
        });

        box.elem.focus({ preventScroll: true });
        addDocumentEvents();
        box.onOpen(box);

    };

    // Open at the mouse point of an event.
    box.openWithEvent = function (event, source = null) {
        box.openAt(event.clientX, event.clientY, source);
    };
    // USAGE: myBox.on("contextmenu", function (self, event) { event.preventDefault(); menu.openWithEvent(event, self); });

    box.close = function () {

        if (!isOpen) return;
        isOpen = 0;

        removeDocumentEvents();
        setActive(-1);
        box.setMotion("none");
        box.visible = 0;

        box.onClose(box);

    };

    box.isOpen = function () {
        return isOpen;
    };

    // Same as a user click on the item.
    box.clickItem = function (index) {

        if (!isClickableIndex(index)) return;

        const item = box.items[index];

        // WHY: Close first. onClick can open a dialog or another menu.
        box.close();

        if (typeof item.onClick === "function") item.onClick(box, item, index);
        box.onClick(box, item, index);

    };

    // Opens the menu on the object with the trigger. Returns a function to remove it.
    box.attachTo = function (obj, trigger) {

        trigger = trigger || box.trigger;

        const removeEvent = obj.on(trigger, function (self, event) {

            event.preventDefault(); // WHY: Do not show the browser menu.

            // WHY: Time limit: If the mouse was released outside the button, there was no click to skip.
            const skip = (skipOpenFor == obj && Date.now() - skipOpenTime < 1000);
            skipOpenFor = null;
            if (skip) return;

            if (box.enabled != 1) return;

            box.openWithEvent(event, obj);

        });

        attachedList.push({ obj: obj, trigger: trigger, removeEvent: removeEvent });

        return function () {
            box.detach(obj);
        };

    };
    // USAGE: menu.attachTo(fileRow) or menu.attachTo(moreButton, "click")

    box.detach = function (obj) {
        attachedList = attachedList.filter(function (info) {
            if (info.obj != obj) return true;
            if (typeof info.removeEvent === "function") info.removeEvent();
            return false;
        });
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1) box.close();
    };
    // USAGE: get: menu.enabled, set: menu.setEnabled(0)

    box.refresh = function () {
        render();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        box.close();
        attachedList.slice().forEach(function (info) { box.detach(info.obj); });
        page.remove_onResize(onPageResize);

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    box.elem.style.position = "fixed";
    box.elem.style.zIndex = String(_ms.zIndex);
    box.elem.style.boxShadow = _ms.shadow;
    box.elem.style.padding = _ms.padding + "px";
    box.elem.style.boxSizing = "border-box";
    box.elem.style.minWidth = box.minWidth + "px";
    if (box.maxWidth > 0) box.elem.style.maxWidth = box.maxWidth + "px";
    box.elem.style.outline = "none";
    box.elem.style.userSelect = "none";
    box.elem.tabIndex = -1;
    box.elem.setAttribute("role", "menu");
    box.elem.setAttribute("aria-label", box.ariaLabel);

    // GROUP: Rows (created by render)
    box.content = VGroup({
        width: "auto",
        height: "auto",
        align: "left top",
        gap: 0,
        position: "relative", // WHY: Component size is "auto". A relative group makes the container wrap it.
    });
    // WHY: Rows fill the menu width, so the hover color is as wide as the menu.
    box.content.elem.style.alignItems = "stretch";

    endGroup();

    // *** OBJECT INIT CODE:

    // WHY: Keep the focus in the menu when an item is pressed.
    box.on("mousedown", function (self, event) { event.preventDefault(); });
    box.on("contextmenu", function (self, event) { event.preventDefault(); });
    box.on("mouseleave", function () { setActive(-1); });

    page.onResize(onPageResize);

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    setItemsSilent(params.items); // WHY: Copy the array. The default [] must not be shared between components.
    box.visible = 0;

    if (box.target) {
        const targets = Array.isArray(box.target) ? box.target : [box.target];
        targets.forEach(function (obj) { box.attachTo(obj, box.trigger); });
    }

    endObject(box);

    setDefaultContainerBox(_previousContainer);

    return box;

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Item texts must not be read as HTML.
ContextMenu.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};
