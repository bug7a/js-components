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
- Submenus: an item with items: [...] has a › at its end. Its menu opens at its side on
  hover, a click, Enter or ArrowRight (at the left when there is no room). ArrowLeft or Escape closes only the
  submenu. A click on an item of a submenu closes every menu and calls onClick(self, item, index) of the menu
  (self: the menu of the click, item: the item of the submenu). Submenus can have submenus.
- For a menu of a program (MenuBar uses them): an item with shortcut has a soft text at its end (only
  a text: the page runs it, or MenuBar), an item with checked (0 / 1) has a check mark in the icon place
  (setItemChecked), and openBelow(obj) opens the menu under an object (over it when there is no room).
- Style packages: "light" (default; the old name "classic" works too), "dark", "minimal", "minimalDark". Select with styleName. (ContextMenu.styles)

ITEM: { text, key, iconFile, icon, items, shortcut, checked, enabled, data, onClick }
- A string is also accepted: "Copy" -> { text: "Copy" }
- "-" or { type: "separator" }: Separator line
- icon: an SVG text ("<svg ...>", your own code, not a user text). Drawn with the color of the text of the item
  (use stroke="currentColor" or fill="currentColor"), so one icon works in every style (dark too). Its size: style.icon.
- iconFile: an image file (its colors are its own).
- items: the items of its submenu (the item itself is not clicked).
- shortcut: a soft text at the end of the row ("Ctrl+S").
- checked: 0 or 1: the item is a choice that can be on: a check mark when 1 (its place stays empty when 0). Over an icon.
- enabled: 0 -> Shown, but can not be clicked.
- onClick: function (self, item, index) {} -> Optional, only for this item.

USAGE:
const menu = ContextMenu({ items: ["Open", "-", { text: "Delete", key: "delete", iconFile: "delete.png" }] });
const menu2 = ContextMenu({ items: [{ text: "Copy to", icon: "<svg ...>", items: [{ text: "My colors", key: "mine" }] }] });
menu.attachTo(myBox);                 // Right click on myBox opens the menu.
menu.attachTo(myButton, "click");     // Left click on myButton opens the menu.
menu.openAt(event.clientX, event.clientY);
menu.openBelow(myButton);             // Under the object, at its left edge.
menu.setItemChecked("wrap", 1);

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

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
    onSideKey: function (self, direction) { }, // ArrowRight (1) / ArrowLeft (-1) that no submenu takes (MenuBar: the next menu)
    parentMenu: null, // (inside) The menu of a submenu: it handles the keys and the clicks outside for it.
    styleName: "light", // "light" ("classic": its old name), "dark", "minimal", "minimalDark" or a name added to ContextMenu.styles
    style: { // Light style package (default)
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
            border: 0, // px: an edge around every item (its color: borderColor, itemHover.borderColor). 0: none
            borderColor: "transparent",
        },
        itemHover: {
            textColor: Black(0.9),
            color: Black(0.06),
            borderColor: "", // the edge of the item under the mouse (item.border). "": its own
        },
        disabled: {
            textColor: Black(0.35),
            opacity: 0.4, // Icon opacity
        },
        icon: {
            width: 16,
            height: 16,
            opacity: 0.85, // An SVG icon (icon): a little softer than its text
        },
        submenu: {
            arrowOpacity: 0.55, // The › at the end of an item with a submenu
            overlap: 4, // px: a submenu covers the edge of its menu a little
        },
        shortcut: {
            fontSize: 12,
            opacity: 0.6, // It takes the color of the text of its item.
            space: 24, // Space before it
        },
        separator: {
            color: Black(0.1),
            space: 4, // Space above and below the line
        },
    }
};

const ContextMenu = function (params = {}) {

    // Merge style package: params.style > ContextMenu.styles[styleName] > ContextMenuDefaults.style (light)
    basic.applyStylePackage(params, ContextMenu.styles, ContextMenuDefaults);

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
    params.padding = _ms.padding;
    params.zIndex = _ms.zIndex;
    params.boxShadow = _ms.shadow;

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
    const PAGE_SIDE_SPACE = 8; // Minimum space between the menu and the page sides
    const OPENER_CLICK_TIME_LIMIT = 1000; // ms
    const OPEN_MOTION = "opacity 0.12s, transform 0.12s";
    const ARROW_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4l4 4-4 4"/></svg>';
    const ARROW_WIDTH = 14;
    const CHECK_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>';
    let openSubmenuIndex = -1; // The item whose submenu is open (-1: none)

    // *** PUBLIC VARIABLES:
    // [var] Items: [{ text, key, iconFile, enabled, data, onClick } or { type: "separator" }]
    box.items = [];
    // [var] The object that opened the menu. (attachTo) null: Opened with openAt().
    box.source = null;

    // *** PRIVATE FUNCTIONS:

    const toFlag = function (value) {
        return basic.isOn(value) ? 1 : 0;
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
        result.enabled = toFlag(result.enabled);
        return result;
    };

    const isSubmenuItem = function (item) {
        return !!(item && item.type == "item" && Array.isArray(item.items) && item.items.length);
    };

    const isCheckItem = function (item) {
        return (item.type == "item" && item.checked !== undefined && item.checked !== null);
    };

    const openSubmenu = function () {
        const row = rows[openSubmenuIndex];
        return (row && row.submenu && row.submenu.isOpen()) ? row.submenu : null;
    };

    // The menu and its open submenus
    const isInsideMenu = function (element) {
        if (!box || !element) return false;
        if (box.elem.contains(element)) return true;
        const submenu = openSubmenu();
        return !!(submenu && submenu.containsElement(element));
    };

    // The first menu (a submenu closes it with every click on an item)
    const rootMenu = function () {
        let menu = box;
        while (menu.parentMenu) menu = menu.parentMenu;
        return menu;
    };

    const isClickableIndex = function (index) {
        const item = box.items[index];
        return !!(item && item.type == "item" && item.enabled == 1);
    };

    const setActive = function (index) {

        if (activeIndex == index) return;

        // WHY: Another item of this menu: its open submenu goes. (Not -1: the mouse may be going into the submenu.)
        if (index >= 0 && index != openSubmenuIndex) box.closeSubmenu();

        const oldRow = rows[activeIndex];
        const keepsHover = (activeIndex == openSubmenuIndex && openSubmenu()); // The item of the open submenu stays painted.
        if (oldRow && oldRow.label && !keepsHover) setRowHover(oldRow, 0);

        activeIndex = index;

        const newRow = rows[activeIndex];
        if (newRow && newRow.label) setRowHover(newRow, 1);

    };

    const setRowHover = function (row, isOver) {
        const style = (isOver) ? _s.itemHover : _s.item;
        const textColor = (row.item.enabled == 1) ? style.textColor : _s.disabled.textColor;
        row.color = style.color;
        if (_s.item.border) row.borderColor = (isOver && _s.itemHover.borderColor) ? _s.itemHover.borderColor : _s.item.borderColor;
        row.label.textColor = textColor;
        // WHY: An SVG icon and the › are drawn with currentColor: they take the color of the text.
        if (row.icon && row.icon.isSvg) row.icon.textColor = textColor;
        if (row.arrow) row.arrow.textColor = textColor;
        if (row.lblShortcut) row.lblShortcut.textColor = textColor;
    };

    // Enabled/disabled view of a row. (Colors, cursor, icon opacity)
    const updateRowEnabled = function (row) {
        const enabled = (row.item.enabled == 1);
        row.cursor = (enabled) ? "pointer" : "default";
        row.aria = { disabled: (enabled) ? "false" : "true" };
        if (row.icon) {
            const normalOpacity = (row.icon.isSvg) ? _s.icon.opacity : 1;
            const hasPicture = (row.item.iconFile || row.item.icon);
            row.icon.opacity = (enabled || !hasPicture) ? normalOpacity : _s.disabled.opacity;
        }
        if (isSubmenuItem(row.item)) row.aria = { haspopup: "menu" };
        setRowHover(row, 0);
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

    const showCheckMark = function (row) {
        const isChecked = basic.isOn(row.item.checked);
        row.icon.text = (isChecked) ? CHECK_ICON : "";
        row.aria = { checked: (isChecked) ? "true" : "false" };
    };

    const createSeparator = function () {

        // BOX: Line
        const line = Box({
            width: "auto",
            height: 1,
            color: _s.separator.color,
            shrink: 0,
        });
        line.css.margin = _s.separator.space + "px " + _s.item.padding + "px";
        line.role = "separator";

        return line;

    };

    const createItem = function (item, index, hasIcon) {

        // GROUP: Row (icon space + label)
        const row = HGroup({
            width: "auto",
            height: _s.item.height,
            align: "left center",
            gap: _s.item.gap,
            padding: [_s.item.padding, 0],
            round: _s.item.round,
        });
        if (_s.item.border) row.props({ border: _s.item.border, borderColor: _s.item.borderColor });
        row.role = "menuitem";
        row.item = item;

            // ICON: Only if one of the items has an icon.
            // WHY: Items without an icon get an empty space, so every text starts at the same place.
            if (hasIcon) {
                if (isCheckItem(item)) {
                    // LABEL: The check mark (the color of the text)
                    row.icon = Label({ width: _s.icon.width, height: _s.icon.height, shrink: 0 });
                    row.icon.elem.classList.add("context-menu-svg");
                    row.icon.isSvg = 1;
                    row.role = "menuitemcheckbox";
                    showCheckMark(row);
                } else if (item.icon) {
                    // LABEL: An SVG icon (the color of the text)
                    row.icon = Label({ width: _s.icon.width, height: _s.icon.height, shrink: 0 });
                    row.icon.text = item.icon;
                    row.icon.elem.classList.add("context-menu-svg");
                    row.icon.isSvg = 1;
                } else if (item.iconFile) {
                    row.icon = Icon({
                        width: _s.icon.width,
                        height: _s.icon.height,
                        shrink: 0,
                    });
                    row.icon.load(item.iconFile);
                    row.icon.elem.alt = "";
                } else {
                    row.icon = Box({
                        width: _s.icon.width,
                        height: _s.icon.height,
                        color: "transparent",
                        shrink: 0,
                    });
                }
            }

            // LABEL: Text
            // WHY: plainText: Item texts must not be read as HTML. (Label.text uses innerHTML.)
            row.label = Label({
                plainText: item.text,
                fontSize: _s.item.fontSize,
                ellipsis: 1,
                shrink: 1,
            });
            row.label.css.minWidth = "0";
            row.label.grow = 1; // WHY: the › of a submenu goes to the end of the row

            // LABEL: Its shortcut
            if (item.shortcut) {
                row.lblShortcut = Label({
                    plainText: item.shortcut,
                    fontSize: _s.shortcut.fontSize,
                    opacity: _s.shortcut.opacity,
                    shrink: 0,
                    css: { marginLeft: (_s.shortcut.space - _s.item.gap) + "px", whiteSpace: "nowrap" },
                });
            }

            // LABEL: › (the item opens a submenu)
            if (isSubmenuItem(item)) {
                row.arrow = Label({ width: ARROW_WIDTH, height: _s.icon.height, shrink: 0, opacity: _s.submenu.arrowOpacity });
                row.arrow.text = ARROW_ICON;
                row.arrow.elem.classList.add("context-menu-svg");
            }

        endGroup();

        updateRowEnabled(row);

        row.on("mouseenter", function () {
            setActive((item.enabled == 1) ? index : -1);
            if (item.enabled == 1 && isSubmenuItem(item)) showSubmenu(index, 0);
        });

        row.on("click", function () {
            if (isSubmenuItem(item)) {
                if (item.enabled == 1) showSubmenu(index, 0);
                return;
            }
            box.clickItem(index);
        });

        return row;

    };

    const render = function () {

        removeSubmenus();
        rows.forEach(function (obj) { obj.remove(); });
        rows = [];
        activeIndex = -1;

        const hasIcon = box.items.some(function (item) { return item.type == "item" && (item.iconFile || item.icon || isCheckItem(item)); });

        box.items.forEach(function (item, index) {
            // WHY: One createIn per row: endGroup() (in createItem) sets the container to the last started group, not to box.content.
            createIn(box.content, function () {
                rows.push((item.type == "separator") ? createSeparator() : createItem(item, index, hasIcon));
            });
        });

    };

    // Put the menu at the point. If there is no space, open it to the left and/or up.
    const positionMenu = function (x, y) {

        const menuWidth = box.elem.offsetWidth;
        const menuHeight = box.elem.offsetHeight;

        let left = x;
        let top = y;
        let originX = "left";
        let originY = "top";

        if (left + menuWidth > page.width - PAGE_SIDE_SPACE) {
            left = x - menuWidth;
            originX = "right";
        }
        if (top + menuHeight > page.height - PAGE_SIDE_SPACE) {
            top = y - menuHeight;
            originY = "bottom";
        }

        left = Math.max(PAGE_SIDE_SPACE, Math.min(left, page.width - menuWidth - PAGE_SIDE_SPACE));
        top = Math.max(PAGE_SIDE_SPACE, Math.min(top, page.height - menuHeight - PAGE_SIDE_SPACE));

        box.left = left;
        box.top = top;
        box.css.transformOrigin = originX + " " + originY;

    };

    // *** SUBMENUS: one ContextMenu for each item with items (made the first time it opens, on the page).
    // Its keys and the clicks outside come through this menu (parentMenu), so only one menu reads a key.

    const removeSubmenus = function () {
        openSubmenuIndex = -1;
        rows.forEach(function (row) {
            if (row.submenu) row.submenu.remove();
            row.submenu = null;
        });
    };

    // withKeyboard: its first item is active (the keys go to it)
    const showSubmenu = function (index, withKeyboard) {
        const row = rows[index];
        const item = box.items[index];
        if (!row || !isSubmenuItem(item)) return;
        if (openSubmenuIndex != index || !openSubmenu()) {
            box.closeSubmenu();
            if (!row.submenu) {
                row.submenu = ContextMenu({
                    items: item.items,
                    styleName: box.styleName,
                    style: _s,
                    minWidth: box.minWidth,
                    maxWidth: box.maxWidth,
                    ariaLabel: item.text,
                    parentMenu: box,
                    // The click of an item of the submenu goes to the onClick of this menu (and so up to the first one).
                    onClick: function (self, subItem, subIndex) { box.onClick(self, subItem, subIndex); },
                });
            }
            openSubmenuIndex = index;
            setRowHover(row, 1);
            row.submenu.openBeside(row.elem.getBoundingClientRect());
        }
        if (withKeyboard) row.submenu.activateFirst();
    };

    // At the right of the item (at its left when there is no room), its first item at the height of the item.
    const positionBeside = function (rect) {

        const menuWidth = box.elem.offsetWidth;
        const menuHeight = box.elem.offsetHeight;
        const overlap = _s.submenu.overlap;
        const firstItemSpace = _s.menu.padding + _s.menu.border;

        let left = withPageZoom(rect.right) - overlap;
        let originX = "left";
        if (left + menuWidth > page.width - PAGE_SIDE_SPACE) {
            left = withPageZoom(rect.left) - menuWidth + overlap;
            originX = "right";
        }
        const top = withPageZoom(rect.top) - firstItemSpace;

        box.left = Math.max(PAGE_SIDE_SPACE, Math.min(left, page.width - menuWidth - PAGE_SIDE_SPACE));
        box.top = Math.max(PAGE_SIDE_SPACE, Math.min(top, page.height - menuHeight - PAGE_SIDE_SPACE));
        box.css.transformOrigin = originX + " top";

    };

    // Under the object at its left edge; over it when there is no room under it and there is room over it.
    const positionBelow = function (rect) {

        const menuWidth = box.elem.offsetWidth;
        const menuHeight = box.elem.offsetHeight;
        const left = withPageZoom(rect.left);
        const bottom = withPageZoom(rect.bottom);
        const top = withPageZoom(rect.top);
        const hasRoomBelow = (bottom + menuHeight <= page.height - PAGE_SIDE_SPACE);
        const hasRoomAbove = (top - menuHeight >= PAGE_SIDE_SPACE);
        const opensAbove = (!hasRoomBelow && hasRoomAbove);

        box.left = Math.max(PAGE_SIDE_SPACE, Math.min(left, page.width - menuWidth - PAGE_SIDE_SPACE));
        box.top = (opensAbove) ? (top - menuHeight) : Math.max(PAGE_SIDE_SPACE, Math.min(bottom, page.height - menuHeight - PAGE_SIDE_SPACE));
        box.css.transformOrigin = "left " + ((opensAbove) ? "bottom" : "top");

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

    // The keys of the first menu (a document listener); a submenu gets them through handleKey().
    const onDocumentKeyDown = function (event) {

        // WHY: A submenu opened with the keys (or with an active item) reads the keys, not this menu.
        const submenu = openSubmenu();
        if (submenu && submenu.hasActive()) {
            submenu.handleKey(event);
            return;
        }

        const activeItem = box.items[activeIndex];
        const isOpenKey = (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ");

        if (event.key === "Escape" || (event.key === "ArrowLeft" && box.parentMenu)) {
            event.preventDefault();
            // WHY: this Escape closes the menu only (a page listener after it would also clear its selection)
            if (event.key === "Escape") event.stopPropagation();
            // A submenu closes only itself; its item in the menu before stays active.
            if (box.parentMenu) box.parentMenu.closeSubmenu();
            else box.close();
        } else if (isOpenKey && isSubmenuItem(activeItem) && activeItem.enabled == 1) {
            event.preventDefault();
            showSubmenu(activeIndex, 1);
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
            rootMenu().close();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            // WHY: the side keys that no menu used go to the first menu (MenuBar: the next menu of the bar).
            event.preventDefault();
            const firstMenu = rootMenu();
            firstMenu.onSideKey(firstMenu, (event.key === "ArrowRight") ? 1 : -1);
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

    // Events only needed while the menu is open.
    const setOpenEvents = function (isOn) {
        const method = (isOn) ? "addEventListener" : "removeEventListener";
        // WHY: Capture phase: Some objects stop the event. The menu must still close.
        document[method]("pointerdown", onDocumentPointerDown, true);
        document[method]("keydown", onDocumentKeyDown, true);
        document[method]("wheel", onDocumentWheel, true);
        window[method]("blur", onWindowBlur);
        if (isOn) page.onResize(onPageResize);
        else page.remove_onResize(onPageResize);
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        box.items = (items || []).map(normalizeItem);
        render();
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
        item.enabled = toFlag(enabled);
        // WHY: Update only this row, not render() all of them.
        const index = box.items.indexOf(item);
        if (item.enabled != 1 && activeIndex == index) setActive(-1);
        updateRowEnabled(rows[index]);
        if (activeIndex == index) setRowHover(rows[index], 1);
    };
    // USAGE: menu.setItemEnabled("paste", 0)

    box.setItemChecked = function (key, checked) {
        const item = box.getItemByKey(key);
        if (!item || !isCheckItem(item)) return;
        item.checked = toFlag(checked);
        showCheckMark(rows[box.items.indexOf(item)]);
    };
    // USAGE: menu.setItemChecked("wrap", 1)

    // Shows the menu: place() puts it. (A submenu has no events of its own: its first menu has them.)
    const showMenu = function (place) {

        isOpen = 1;
        openPageSize = page.width + "x" + page.height;

        // WHY: a menu of a row in a Dialog or a SidePanel opens over them (under them it is invisible but holds
        //      the keys); a submenu over its menu
        box.zIndex = basic.zIndexAbove(box.parentMenu || box.source, _ms.zIndex);

        // Show hidden (opacity 0) first, so the size can be measured.
        box.setMotion("none");
        box.opacity = 0;
        box.css.transform = "scale(0.97)";
        box.visible = 1;

        place();

        // Small open animation
        requestAnimationFrame(function () {
            if (!box || !isOpen) return;
            box.setMotion(OPEN_MOTION);
            box.opacity = 1;
            box.css.transform = "scale(1)";
        });

        if (!box.parentMenu) {
            box.elem.focus({ preventScroll: true });
            setOpenEvents(1);
        }
        box.onOpen(box);

    };

    // x, y: Mouse point on the screen. (event.clientX, event.clientY)
    box.openAt = function (x, y, source = null) {

        if (box.enabled != 1 || box.items.length == 0) return;
        if (isOpen) box.close();

        box.source = source;
        showMenu(function () { positionMenu(withPageZoom(x), withPageZoom(y)); });

    };

    // Open at the mouse point of an event.
    box.openWithEvent = function (event, source = null) {
        box.openAt(event.clientX, event.clientY, source);
    };
    // USAGE: myBox.on("contextmenu", function (self, event) { event.preventDefault(); menu.openWithEvent(event, self); });

    // Open under the object. (It is the source of the menu.)
    box.openBelow = function (obj) {

        if (box.enabled != 1 || box.items.length == 0) return;
        if (isOpen) box.close();

        box.source = obj;
        showMenu(function () { positionBelow(obj.elem.getBoundingClientRect()); });

    };
    // USAGE: menu.openBelow(myButton)

    box.close = function () {

        if (!isOpen) return;
        isOpen = 0;

        box.closeSubmenu();
        if (!box.parentMenu) setOpenEvents(0);
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

        // An item with a submenu is not clicked: it opens its submenu.
        if (isSubmenuItem(item)) {
            showSubmenu(index, 1);
            return;
        }

        // WHY: Close first (every menu, with the menus before a submenu). onClick can open a dialog or another menu.
        rootMenu().close();

        if (typeof item.onClick === "function") item.onClick(box, item, index);
        box.onClick(box, item, index);

    };

    // Opens the menu on the object with the trigger. Returns a function to remove it.
    box.attachTo = function (obj, trigger) {

        trigger = trigger || box.trigger;

        const removeEvent = obj.on(trigger, function (self, event) {

            event.preventDefault(); // WHY: Do not show the browser menu.

            // WHY: Time limit: If the mouse was released outside the button, there was no click to skip.
            const skip = (skipOpenFor == obj && Date.now() - skipOpenTime < OPENER_CLICK_TIME_LIMIT);
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
        box.enabled = toFlag(enabled);
        if (box.enabled != 1) box.close();
    };
    // USAGE: get: menu.enabled, set: menu.setEnabled(0)

    box.refresh = render;

    // (inside: used by the submenus)

    box.closeSubmenu = function () {
        const submenu = openSubmenu();
        const row = rows[openSubmenuIndex];
        const index = openSubmenuIndex;
        openSubmenuIndex = -1;
        if (submenu) submenu.close();
        if (row && row.label && activeIndex != index) setRowHover(row, 0);
    };

    // A submenu opens at the side of the item of its menu before. (rect: the item on the screen)
    box.openBeside = function (rect) {
        if (box.items.length == 0) return;
        if (isOpen) box.close();
        box.source = (box.parentMenu) ? box.parentMenu.source : null; // WHY: onClick reads self.source
        showMenu(function () { positionBeside(rect); });
    };

    box.containsElement = isInsideMenu;
    box.handleKey = onDocumentKeyDown;
    box.hasActive = function () { return (activeIndex >= 0) ? 1 : 0; };
    box.activateFirst = function () {
        setActive(-1);
        moveActive(1);
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        box.close();
        attachedList.slice().forEach(function (info) { box.detach(info.obj); });
        removeSubmenus(); // WHY: they are on the page, not in this box

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    // An SVG icon fills its place.
    basic.addCss("context-menu-svg", ".context-menu-svg { display: flex; align-items: center; justify-content: center; } .context-menu-svg svg { display: block; width: 100%; height: 100%; }");

    box.css = {
        position: "fixed",
        boxSizing: "border-box",
        minWidth: box.minWidth + "px",
        outline: "none",
        userSelect: "none",
    };
    if (box.maxWidth > 0) box.css.maxWidth = box.maxWidth + "px";
    box.tabIndex = -1;
    box.role = "menu";
    box.aria = { label: box.ariaLabel };

    // GROUP: Rows (created by render)
    box.content = VGroup({
        width: "auto",
        height: "auto",
        align: "left top",
        gap: 0,
        position: "relative", // WHY: Component size is "auto". A relative group makes the container wrap it.
    });
    // WHY: Rows fill the menu width, so the hover color is as wide as the menu.
    box.content.css.alignItems = "stretch";

    endGroup();

    // *** OBJECT INIT CODE:

    // WHY: Keep the focus in the menu when an item is pressed.
    box.on("mousedown", function (self, event) { event.preventDefault(); });
    box.on("contextmenu", function (self, event) { event.preventDefault(); });
    box.on("mouseleave", function () { setActive(-1); });

    box.setEnabled(box.enabled);
    box.setItems(params.items); // WHY: Copy the array. The default [] must not be shared between components.
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

// For user data in your own Label.text. (Kept for old code: same as basic.escapeHtml.)
ContextMenu.escapeHtml = basic.escapeHtml;

// *** STYLE PACKAGES:
// USAGE: ContextMenu({ styleName: "dark" })
// USAGE: ContextMenu({ styleName: "dark", style: { menu: { round: 4 } } }) // Change only some keys.
// USAGE: ContextMenu({ style: ContextMenu.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// NOTE: An iconFile is an image: give light icons to the items of a dark menu. An SVG icon (icon) takes the text color.
// USAGE: ContextMenu.styles.myStyle = { menu: { round: 4 } };
ContextMenu.styles = {

    // White, dark text, a soft line.
    light: ContextMenuDefaults.style,

    // Dark theme, same colors as SelectBox "dark".
    dark: {
        menu: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)", shadow: "0px 8px 24px rgba(0, 0, 0, 0.5)" },
        item: { textColor: "rgba(255, 255, 255, 0.85)" },
        itemHover: { textColor: "rgba(255, 255, 255, 0.95)", color: "rgba(255, 255, 255, 0.08)" },
        disabled: { textColor: "rgba(255, 255, 255, 0.35)" },
        separator: { color: "rgba(255, 255, 255, 0.10)" },
    },

};
ContextMenu.styles.classic = ContextMenu.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): on the ground of the window with a line and no shadow, 28 px items
// with a 13 px text, a line around the item under the mouse. minimalDark: the same on a dark window.
ContextMenu.createMinimalStyle = function (colors) {
    return {
        menu: { color: colors.ground, border: 1, borderColor: colors.line, round: 4, padding: 4, shadow: "none" },
        item: { height: 28, fontSize: 13, textColor: colors.text, color: "transparent", round: 3, padding: 8, gap: 8, border: 1, borderColor: "transparent" },
        itemHover: { textColor: colors.text, color: "transparent", borderColor: colors.lineHover },
        disabled: { textColor: colors.faintText, opacity: 0.4 },
        icon: { width: 14, height: 14, opacity: 0.85 },
        shortcut: { fontSize: 12, opacity: 0.5, space: 20 },
        separator: { color: colors.line, space: 4 },
    };
};
ContextMenu.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), faintText: Black(0.54), line: Black(0.2), lineHover: Black(0.45) };
ContextMenu.styles.minimal = ContextMenu.createMinimalStyle(ContextMenu.MINIMAL_COLORS);
ContextMenu.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), faintText: White(0.48), line: White(0.18), lineHover: White(0.42) };
ContextMenu.styles.minimalDark = ContextMenu.createMinimalStyle(ContextMenu.MINIMAL_DARK_COLORS);
