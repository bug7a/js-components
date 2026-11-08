/* Bismillah */

/*

MenuBar - v26.11

UI COMPONENT
- The row of menus at the top of a window of a program: File, Edit, View, Help.
- Its menus are ContextMenus (comp/context-menu.js: load it first), so an item can have an icon, a check mark, a
  submenu, a shortcut, and can be disabled.
- A click opens a menu, a second click closes it. While a menu is open, the mouse on another title opens that one.
- Keyboard: Tab comes to the bar; ArrowLeft / ArrowRight go between the titles (also while a menu is open);
  ArrowDown, Enter or Space open a menu; ArrowUp / ArrowDown go between its items; ArrowRight opens a submenu;
  Escape closes.
- A shortcut is shown in its item and it runs the item: "Ctrl+S", "Ctrl+Shift+N", "F5". Ctrl is also Cmd on a Mac, and
  the Mac shows it as ⌘S. It does not run under a dialog, nor for a disabled item, and a held key runs it once. In a
  text field only the shortcuts with Ctrl run, and Ctrl+C, V, X, A, Z, Y stay with the field. With a selected text
  on the page Ctrl+C copies it.
- An item can remove the bar in its onClick (a page that draws its window again).
- Too many titles for a narrow window: the row scrolls sideways.
- Style packages: "light" (default), "dark", "minimal", "minimalDark" (a package of params: its height too; setTheme()
  changes only the colors and the shapes). Select with styleName (MenuBar.styles), or later with setTheme().

MENU: { text, key, enabled, items, onClick }
- items: its items (below). A menu without items is a title that only runs its onClick.
ITEM: { text, key, icon, iconFile, shortcut, checked, enabled, items, data, onClick }
- A string is also accepted: "Copy" -> { text: "Copy" }. "-": a separator line. (As in ContextMenu)
- onClick: function (self, item, menu) {}: self is the MenuBar. The onClick of the MenuBar is called too.

USAGE:
const bar = MenuBar({
    menus: [
        { text: "File", key: "file", items: [
            { text: "Open", key: "open", shortcut: "Ctrl+O" },
            { text: "Save", key: "save", shortcut: "Ctrl+S" },
            { text: "Open recent", items: ["a.txt", "b.txt"] },
            "-",
            { text: "Quit", key: "quit", enabled: 0 },
        ] },
        { text: "View", key: "view", items: [
            { text: "Word wrap", key: "wrap", checked: 1 },
        ] },
    ],
    onClick: function (self, item, menu) { println(menu.text + " > " + item.text); },
});
bar.setItemEnabled("quit", 1);
bar.setItemChecked("wrap", 0);
bar.setMenus([...]);
bar.closeMenu();
bar.setTheme("dark");            // the check marks and the disabled items stay
MenuBar({ styleName: "dark" });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const MenuBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: 34,
    menus: [], // [{ text, key, enabled, items, onClick }]
    enabled: 1,
    ariaLabel: "Menu bar",
    onClick: function (self, item, menu) { }, // An item (with a click, the keyboard or its shortcut)
    onMenuOpen: function (self, menu) { },
    onMenuClose: function (self, menu) { },
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to MenuBar.styles
    style: { // Light style package (default)
        box: { color: "#F4F4F2", lineColor: Black(0.12) },
        layout: { padding: 4, gap: 2 },
        title: { fontSize: 13, textColor: Black(0.82), height: 26, padding: 10, round: 5 },
        titleHover: { color: Black(0.07), borderColor: "" }, // borderColor: the edge (title.border). "": its own
        titleOpen: { color: Black(0.11), borderColor: "" },
        disabled: { opacity: 0.4 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
        menuStyleName: "light", // The package of its ContextMenus
        menu: { // Over that package
            item: { height: 30, fontSize: 13 },
        },
        menuMinWidth: 200,
    },
};

const MenuBar = function (params = {}) {

    // Merge style package: params.style > MenuBar.styles[styleName] > MenuBarDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, MenuBar.styles, MenuBarDefaults);

    // Merge params:
    mergeIntoIfMissing(params, MenuBarDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let openIndex = -1; // The menu that is open (-1: none)
    let openIndexAtPress = -1; // The menu that was open when the mouse was pressed
    let focusIndex = 0; // The title that the Tab key comes to
    let isUsedWithKeys = 0; // 1: the last thing was a key, not the mouse

    // *** PUBLIC VARIABLES:
    box.menuList = []; // [{ menu, title, contextMenu }]: the menus and their objects
    // NOTE: Default values are also public variables. (box.menus, box.enabled...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, MenuBar.styles, MenuBarDefaults);
        mergeIntoIfMissing(fresh, MenuBarDefaults);
        return fresh.style;
    };

    const isOpen = function (index) {
        return (openIndex == index);
    };

    const isMenuEnabled = function (menu) {
        return (box.enabled == 1 && !(menu.enabled !== undefined && !basic.isOn(menu.enabled)));
    };

    const hasItems = function (menu) {
        return (Array.isArray(menu.items) && menu.items.length > 0);
    };

    // WHY: A ContextMenu makes its own copy of its items. Each copy knows the item of the bar, so a callback gets its
    //      present state. Its shortcut is the text to show, and it runs through runItem() alone.
    const toContextMenuItem = function (item) {
        if (typeof item != "object" || item === null) return item;
        const copy = Object.assign({}, item);
        copy.barItem = item;
        copy.onClick = null;
        if (item.shortcut) copy.shortcut = MenuBar.shortcutText(item.shortcut);
        if (Array.isArray(item.items)) copy.items = item.items.map(toContextMenuItem);
        return copy;
    };

    const toContextMenuItems = function (menu) {
        return (menu.items || []).map(toContextMenuItem);
    };

    const runItem = function (item, menu) {
        if (typeof item.onClick == "function") item.onClick(box, item, menu);
        if (!box.isRemoved) box.onClick(box, item, menu); // WHY: The item may have removed the bar (a window drawn again).
    };

    // The edge of a title (title.border: the minimal packages): open, under the mouse, or its own
    const getTitleEdge = function (index, isOver) {
        if (isOpen(index) && _s.titleOpen.borderColor) return _s.titleOpen.borderColor;
        if (isOver && _s.titleHover.borderColor) return _s.titleHover.borderColor;
        return _s.title.borderColor || "transparent";
    };

    // PAINT: the titles: open, the mouse on it, disabled; only one of them is reached with Tab.
    const paintTitle = function (entry, index, isOver) {
        const title = entry.title;
        const isEnabled = isMenuEnabled(entry.menu);
        let color = "transparent";
        if (isOver && isEnabled) color = _s.titleHover.color;
        if (isOpen(index)) color = _s.titleOpen.color;
        title.color = color;
        if (_s.title.border) title.borderColor = getTitleEdge(index, isOver && isEnabled);
        title.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        title.cursor = (isEnabled) ? "pointer" : "default";
        title.tabIndex = (index == focusIndex) ? 0 : -1;
        title.aria = { disabled: isEnabled ? "false" : "true" };
        if (hasItems(entry.menu)) title.aria = { expanded: isOpen(index) ? "true" : "false" };
    };

    const paintTitles = function () {
        box.menuList.forEach(function (entry, index) { paintTitle(entry, index, 0); });
    };

    const openMenu = function (index, withKeyboard) {
        const entry = box.menuList[index];
        if (!entry || !hasItems(entry.menu) || !isMenuEnabled(entry.menu)) return;
        box.closeMenu();
        openIndex = index;
        focusIndex = index;
        entry.contextMenu.openBelow(entry.title);
        if (withKeyboard) entry.contextMenu.activateFirst();
        paintTitles();
        box.onMenuOpen(box, entry.menu);
    };

    // The next title that can be used, in a direction (-1, 1). -1: there is none.
    const nextIndex = function (fromIndex, direction, needsItems) {
        const count = box.menuList.length;
        for (let step = 1; step <= count; step++) {
            const index = (fromIndex + direction * step + count * step) % count;
            const menu = box.menuList[index].menu;
            if (isMenuEnabled(menu) && (!needsItems || hasItems(menu))) return index;
        }
        return -1;
    };

    const focusTitle = function (index) {
        if (!box.menuList[index]) return;
        focusIndex = index;
        paintTitles();
        box.menuList[index].title.elem.focus();
    };

    const onTitleClick = function (index, event) {
        const entry = box.menuList[index];
        if (!isMenuEnabled(entry.menu)) return;

        if (!hasItems(entry.menu)) {
            runItem(entry.menu, entry.menu);
            return;
        }

        const isFromKeyboard = (event.detail === 0); // WHY: Enter and Space make a click without a mouse.

        // WHY: The press closed this open menu just before this click (ContextMenu closes on a press outside it),
        //      so this click must not open it again.
        const wasOpenAtPress = (!isFromKeyboard && openIndexAtPress == index);
        openIndexAtPress = -1;
        if (wasOpenAtPress) return;

        openMenu(index, isFromKeyboard);
    };

    const onTitleKeyDown = function (index, event) {
        if (openIndex >= 0) return; // WHY: The open menu reads the keys.
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const next = nextIndex(index, (event.key === "ArrowRight") ? 1 : -1, 0);
            if (next >= 0) focusTitle(next);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu(index, 1);
        }
    };

    // The side keys of an open menu: the next menu of the bar opens.
    const onSideKey = function (direction) {
        const next = nextIndex(openIndex, direction, 1);
        if (next >= 0 && next != openIndex) openMenu(next, 1);
    };

    const onContextMenuClose = function (index) {
        if (openIndex != index) return;
        openIndex = -1;
        paintTitles();
        // WHY the keys: the focus was in the menu, and a keyboard user would lose the place. After the mouse a focus by
        //     code would show the ring of the keyboard on the title.
        if (isUsedWithKeys) box.menuList[index].title.elem.focus({ preventScroll: true });
        box.onMenuClose(box, box.menuList[index].menu);
    };

    // WHY: One ContextMenu for each menu. It stands on the page: box.remove() and removeMenus() remove it.
    const createContextMenu = function (menu, index) {
        return ContextMenu({
            items: toContextMenuItems(menu),
            styleName: _s.menuStyleName,
            style: _s.menu,
            minWidth: _s.menuMinWidth,
            ariaLabel: menu.text,
            onClick: function (self, item) { runItem(item.barItem || item, menu); },
            onClose: function () { onContextMenuClose(index); },
            onSideKey: function (self, direction) { onSideKey(direction); },
        });
    };

    const applyTitleLook = function (title) {
        title.props({ height: _s.title.height, fontSize: _s.title.fontSize, textColor: _s.title.textColor, round: _s.title.round });
        if (_s.title.border) title.props({ border: _s.title.border, borderColor: _s.title.borderColor || "transparent" });
        title.css.padding = "0 " + _s.title.padding + "px";
        title.setFocusRing(_s.focus.ringColor);
    };

    const createMenu = function (menu, index) {

        // BUTTON: The title
        const title = Button({
            width: "auto",
            color: "transparent",
            shrink: 0,
            css: { whiteSpace: "nowrap" },
        });
        title.minimal = 1;
        title.plainText = menu.text;
        title.role = "menuitem";
        if (hasItems(menu)) title.aria = { haspopup: "menu" };
        applyTitleLook(title);

        const contextMenu = createContextMenu(menu, index);

        title.onHoverChange(function (self, isOver) {
            paintTitle(box.menuList[index], index, isOver);
            const isOtherMenuOpen = (openIndex >= 0 && openIndex != index);
            if (isOver && isOtherMenuOpen && hasItems(menu)) openMenu(index, 0);
        });
        title.on("click", function (self, event) { onTitleClick(index, event); });
        title.on("keydown", function (self, event) { onTitleKeyDown(index, event); });

        return { menu: menu, title: title, contextMenu: contextMenu };

    };

    const removeMenus = function () {
        box.closeMenu();
        box.menuList.forEach(function (entry) {
            entry.contextMenu.remove();
            entry.title.remove();
        });
        box.menuList = [];
    };

    const applyBarLook = function () {
        box.color = _s.box.color;
        box.css.borderBottom = "1px solid " + _s.box.lineColor;
        box.layout.gap = _s.layout.gap;
        box.layout.padding = [_s.layout.padding, 0];
    };

    // LOOK: everything that comes from the style (setTheme)
    // WHY the titles stay: one of them may have the focus. The menus are made again: a ContextMenu keeps its style.
    const applyLook = function () {
        applyBarLook();
        box.menuList.forEach(function (entry, index) {
            applyTitleLook(entry.title);
            entry.contextMenu.remove();
            entry.contextMenu = createContextMenu(entry.menu, index);
        });
        paintTitles();
    };

    const createMenus = function () {
        removeMenus();
        openIndex = -1;
        focusIndex = Math.max(0, box.menus.findIndex(isMenuEnabled));
        box.menuList = box.menus.map(function (menu, index) {
            return createIn(box.layout, function () { return createMenu(menu, index); });
        });
        paintTitles();
    };

    // The item (and its menu) that runs with this key. null: none.
    const findShortcutItem = function (event) {
        for (const entry of box.menuList) {
            const item = (isMenuEnabled(entry.menu)) ? MenuBar.findShortcutItem(entry.menu.items, event) : null;
            if (item) return { item: item, menu: entry.menu };
        }
        return null;
    };

    const onWindowKeyDown = function (self, event) {
        if (box.enabled != 1 || event.defaultPrevented) return;
        const found = findShortcutItem(event);
        if (!found || MenuBar.isDialogOpen()) return;
        event.preventDefault(); // WHY: Ctrl+S must not also open the save window of the browser.
        if (event.repeat) return; // WHY: A held key runs it once (a job that starts and stops many times).
        box.closeMenu();
        runItem(found.item, found.menu);
    };

    // The menu of an item (the first one that has it), and the item
    const findItem = function (key) {
        let found = null;
        box.menuList.forEach(function (entry) {
            MenuBar.forEachItem(entry.menu.items, function (item) {
                if (!found && item.key == key) found = { item: item, entry: entry };
            });
        });
        return found;
    };

    // The first level is changed in place; an item of a submenu needs its menu to be made again.
    const applyItemChange = function (found, changeInPlace) {
        const contextMenu = found.entry.contextMenu;
        if (contextMenu.getItemByKey(found.item.key)) changeInPlace(contextMenu);
        else contextMenu.setItems(toContextMenuItems(found.entry.menu));
    };

    // *** PUBLIC FUNCTIONS:

    box.setMenus = function (menus) {
        box.menus = (Array.isArray(menus)) ? menus.map(MenuBar.copyItem) : [];
        createMenus();
    };
    // USAGE: bar.setMenus([{ text: "File", items: ["Open", "Save"] }])

    box.closeMenu = function () {
        const entry = box.menuList[openIndex];
        if (entry) entry.contextMenu.close();
    };
    // USAGE: bar.closeMenu()

    box.setItemEnabled = function (key, value) {
        const found = findItem(key);
        if (!found) return;
        found.item.enabled = basic.isOn(value) ? 1 : 0;
        applyItemChange(found, function (contextMenu) { contextMenu.setItemEnabled(key, found.item.enabled); });
    };
    // USAGE: bar.setItemEnabled("paste", 0)

    box.setItemChecked = function (key, value) {
        const found = findItem(key);
        if (!found) return;
        found.item.checked = basic.isOn(value) ? 1 : 0;
        applyItemChange(found, function (contextMenu) { contextMenu.setItemChecked(key, found.item.checked); });
    };
    // USAGE: bar.setItemChecked("wrap", 0)

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        if (box.enabled != 1) box.closeMenu();
        paintTitles();
    };
    // USAGE: get: bar.enabled, set: bar.setEnabled(0)

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: bar.setTheme("dark")

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        // WHY isRemoved and box is not set to null: an item can remove the bar in its onClick, and the code of its
        //     click goes on.
        if (box.isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).
        removeMenus(); // WHY: not with box.own(): setMenus() makes new ones, and own() would keep the old ones to the end.
        superRemove.call(box);
    };
    // USAGE: bar.remove();

    // *** OBJECT VIEW:

    // BOX: The bar
    box.css.boxSizing = "border-box";
    box.role = "menubar";
    box.aria = { label: box.ariaLabel };

    // GROUP: The titles (made by createMenus)
    box.layout = HGroup({
        width: "100%",
        height: "100%",
        align: "left center",
        scrollX: 1, // WHY: A narrow window still reaches every title.
    });
    box.layout.css.scrollbarWidth = "none";
    endGroup();

    // *** OBJECT INIT CODE:

    // WHY capture on window: it runs before the capture of ContextMenu on document, which closes the menu.
    box.listenTo(window, "pointerdown", function () {
        openIndexAtPress = openIndex;
        isUsedWithKeys = 0;
    }, true);
    box.listenTo(window, "keydown", function () { isUsedWithKeys = 1; }, true);
    box.listenTo(window, "keydown", onWindowKeyDown);

    applyBarLook();
    box.setMenus(params.menus);

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

MenuBar.FIELD_KEYS = ["c", "v", "x", "a", "z", "y"];

MenuBar.isMac = function () {
    return /Mac|iPhone|iPad/.test(navigator.platform || "");
};

// "Ctrl+Shift+S" -> { ctrl: true, shift: true, alt: false, key: "s" }
MenuBar.parseShortcut = function (text) {
    const parts = String(text).toLowerCase().split("+").map(function (part) { return part.trim(); });
    return {
        ctrl: (parts.indexOf("ctrl") >= 0 || parts.indexOf("cmd") >= 0),
        shift: parts.indexOf("shift") >= 0,
        alt: parts.indexOf("alt") >= 0,
        key: parts[parts.length - 1],
    };
};

// WHY ctrlKey or metaKey: "Ctrl" of a shortcut is Cmd on a Mac. A page writes one shortcut for both.
MenuBar.isShortcutEvent = function (shortcut, event) {
    const isCtrlDown = (event.ctrlKey || event.metaKey);
    if (shortcut.ctrl != isCtrlDown || shortcut.shift != event.shiftKey || shortcut.alt != event.altKey) return false;
    const key = (event.key === " ") ? "space" : String(event.key).toLowerCase();
    return (key == shortcut.key);
};

// WHY a copy: setItemChecked() and setItemEnabled() write in the items, and the data of the page must not change
//      (two bars can be made from one list).
MenuBar.copyItem = function (item) {
    if (typeof item != "object" || item === null) return item;
    const copy = Object.assign({}, item);
    if (Array.isArray(item.items)) copy.items = item.items.map(MenuBar.copyItem);
    return copy;
};

// SHORTCUTS of a list of items: the items (their submenus too) that have one. (ToolBar uses them too.)

MenuBar.forEachItem = function (items, func) {
    (items || []).forEach(function (item) {
        if (typeof item != "object" || item === null) return;
        func(item);
        MenuBar.forEachItem(item.items, func);
    });
};

MenuBar.isTextField = function (element) {
    if (!element || !element.tagName) return false;
    return (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable);
};

// WHY the rects: a closed Dialog can stay in the page, hidden.
MenuBar.isDialogOpen = function () {
    return Array.from(document.querySelectorAll('[aria-modal="true"]')).some(function (element) {
        return element.getClientRects().length > 0;
    });
};

// WHY: In a text field these keys belong to the field (a menu may also have Copy and Paste).
MenuBar.isKeyOfField = function (shortcut) {
    return (!shortcut.ctrl || (MenuBar.FIELD_KEYS.indexOf(shortcut.key) >= 0 && !shortcut.alt));
};

// WHY: A text selected on the page (a line of a LogView) is copied by the browser, also with a Copy in a menu.
MenuBar.isCopyOfSelection = function (shortcut) {
    return (shortcut.ctrl && shortcut.key === "c" && !window.getSelection().isCollapsed);
};

// The first item of a list that runs with this key. null: none.
MenuBar.findShortcutItem = function (items, event) {
    const inTextField = MenuBar.isTextField(event.target);
    let found = null;
    MenuBar.forEachItem(items, function (item) {
        if (found || !item.shortcut) return;
        const shortcut = MenuBar.parseShortcut(item.shortcut);
        if (!MenuBar.isShortcutEvent(shortcut, event)) return;
        if (inTextField && MenuBar.isKeyOfField(shortcut)) return;
        if (MenuBar.isCopyOfSelection(shortcut)) return;
        if (item.enabled !== undefined && !basic.isOn(item.enabled)) return;
        found = item;
    });
    return found;
};

// The text to show in an item. On a Mac: "Ctrl+Shift+S" -> "⇧⌘S"
MenuBar.shortcutText = function (text) {
    if (!MenuBar.isMac()) return String(text);
    const parts = String(text).split("+").map(function (part) { return part.trim(); });
    const key = parts[parts.length - 1];
    const lowerParts = parts.map(function (part) { return part.toLowerCase(); });
    let marks = "";
    if (lowerParts.indexOf("alt") >= 0) marks += "⌥";
    if (lowerParts.indexOf("shift") >= 0) marks += "⇧";
    if (lowerParts.indexOf("ctrl") >= 0 || lowerParts.indexOf("cmd") >= 0) marks += "⌘";
    return marks + key.toUpperCase();
};

// *** STYLE PACKAGES:
// USAGE: MenuBar({ styleName: "dark" })
// USAGE: MenuBar({ styleName: "dark", style: { title: { fontSize: 14 } } }) // Change only some keys.
// USAGE: MenuBar({ style: { menu: { menu: { round: 4 } } } }) // The ContextMenus too.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: MenuBar.styles.myStyle = { box: { color: "tomato" } };
MenuBar.styles = {

    // A light gray bar, dark text, a soft line under it; white menus.
    light: MenuBarDefaults.style,

    // For a dark window; dark menus.
    dark: {
        box: { color: "#232322", lineColor: White(0.1) },
        title: { textColor: White(0.86) },
        titleHover: { color: White(0.09) },
        titleOpen: { color: White(0.15) },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
        menuStyleName: "dark",
    },

};

// The minimal theme (_designs/minimal-theme.htm): no fill (the ground of the window), one line under it, 13 px titles
// with a line around the one under the mouse and an ink line around the open one; its menus are ContextMenu minimal.
MenuBar.createMinimalStyle = function (colors) {
    return {
        height: 30,
        style: {
            box: { color: "transparent", lineColor: colors.line },
            layout: { padding: 2, gap: 2 },
            title: { fontSize: 13, textColor: colors.text, height: 24, padding: 9, round: 3, border: 1, borderColor: "transparent" },
            titleHover: { color: "transparent", borderColor: colors.lineHover },
            titleOpen: { color: "transparent", borderColor: colors.ink },
            disabled: { opacity: 0.4 },
            focus: { ringColor: colors.focus },
            menuStyleName: colors.menuStyleName,
            menu: { item: { height: 28, fontSize: 13 } },
            menuMinWidth: 180,
        },
    };
};
MenuBar.MINIMAL_COLORS = { text: Black(0.85), line: Black(0.2), lineHover: Black(0.45), ink: "#1F1F1F", focus: "#3D8BD9", menuStyleName: "minimal" };
MenuBar.styles.minimal = MenuBar.createMinimalStyle(MenuBar.MINIMAL_COLORS);
MenuBar.MINIMAL_DARK_COLORS = { text: White(0.88), line: White(0.18), lineHover: White(0.42), ink: "#EDEDEB", focus: "#7FB6DE", menuStyleName: "minimalDark" };
MenuBar.styles.minimalDark = MenuBar.createMinimalStyle(MenuBar.MINIMAL_DARK_COLORS);
