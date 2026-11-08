/* Bismillah */

/*

ToolBar - v26.11

UI COMPONENT
- The row of small buttons of a window, under its menus: icons with a hint, lines between the groups of buttons, buttons
  that stay pressed (bold, a view), a button that opens a menu.
- NEEDS comp/context-menu.js (its menus) and comp/menu-bar.js (its shortcuts), loaded first. comp/tooltip.js, when it is
  loaded, draws the hints (else: the title of the browser).
- Too many buttons for the window: the last ones go into a "..." menu at the end, and come back when there is room.
- A shortcut runs its item and is written in its hint: "Ctrl+S" (Ctrl is also Cmd on a Mac; the rules are the ones of MenuBar).
  The same shortcut in a ToolBar and a MenuBar runs only one of them.
- Keyboard: Tab comes to the bar (one stop); ArrowLeft, ArrowRight, Home and End go between the buttons; Enter or Space press
  a button; ArrowDown opens its menu.
- Style packages: "light" (default), "dark", "minimal", "minimalDark" (a package of params: its height too; setTheme()
  changes only the colors and the shapes). Select with styleName (ToolBar.styles), or later with setTheme().

AN ITEM: { key, text, icon, iconFile, hint, shortcut, toggle, group, checked, enabled, items, data, onClick }
- "-" or { type: "separator" }: a line between the buttons. " " or { type: "space" }: the next items stand at the right end.
- A text is also accepted: "Save" -> { text: "Save" }.
- text: plain text next to its icon (never read as HTML). No text: an icon button.
- icon: a name of ToolBar.ICONS ("save", "undo", "bold"...), or an SVG text (your own code, not a user text) that uses
  stroke="currentColor". iconFile: an image file.
- hint: its bubble, and its name for a screen reader. A button with a text needs none.
- toggle: 1: it stays pressed and a click changes it: read item.checked. group: "align": one button of the group stays pressed.
  checked alone: it is pressed only when the page says so (setItemChecked()).
- items: it opens a menu: the items of a ContextMenu, each with its own onClick.
- onClick: function (self, item) {}. The onClick of the ToolBar is called too.

USAGE:
const bar = ToolBar({
    items: [
        { key: "new", icon: "new", hint: "New", onClick: function (self, item) { println("New"); } },
        { key: "save", icon: "save", hint: "Save", shortcut: "Ctrl+S" },
        "-",
        { key: "bold", icon: "bold", hint: "Bold", toggle: 1 },
        { key: "left", icon: "alignLeft", hint: "Left", group: "align", checked: 1 },
        { key: "right", icon: "alignRight", hint: "Right", group: "align" },
        "-",
        { key: "insert", text: "Insert", items: ["A picture", "A table"] },
        " ",
        { key: "run", icon: "play", text: "Run", shortcut: "F9" },
    ],
    onClick: function (self, item) { println(item.key); },
});
bar.setItemEnabled("save", 0);
bar.setItemChecked("bold", 1);       // onClick is not called
bar.isItemChecked("bold");           // true
bar.getCheckedKeys();                // ["bold", "left"]
bar.clickItem("run");                // as a click
bar.setItems([...]);
bar.setTheme("dark");

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ToolBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: 42,
    shrink: 0, // WHY: In a full group its row must not get thinner: its height is its buttons.
    items: [], // [ITEM] (See AN ITEM above)
    enabled: 1,
    ariaLabel: "Tool bar",
    moreText: "More", // The name of the "..." button
    onClick: function (self, item) { }, // An item (with a click, the keyboard, its shortcut or clickItem())
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to ToolBar.styles
    style: { // Light style package (default)
        box: { color: "#F4F4F2", lineColor: Black(0.12) },
        layout: { padding: 6, gap: 2 },
        button: { height: 30, padding: 8, gap: 6, round: 6, fontSize: 13, iconSize: 18, textColor: Black(0.72) },
        buttonHover: { color: Black(0.07), borderColor: "" }, // borderColor: the edge (button.border). "": its own
        buttonOn: { color: Black(0.13), textColor: Black(0.92), borderColor: "" }, // It stays pressed, or its menu is open.
        separator: { height: 18, space: 4, color: Black(0.16) },
        bubble: { fontSize: 12, padding: [9, 5], color: "#2B2B2A", textColor: White(0.95), round: 6, border: 0, shadow: "0 2px 8px " + Black(0.18) }, // Its hint
        disabled: { opacity: 0.35 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
        menuStyleName: "light", // The package of its menu
        menu: { item: { height: 30, fontSize: 13 } }, // Over that package
        menuMinWidth: 170,
    },
};

const ToolBar = function (params = {}) {

    // Merge style package: params.style > ToolBar.styles[styleName] > ToolBarDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, ToolBar.styles, ToolBarDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ToolBarDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let entries = []; // { kind: "button", "more", "separator", "space"; item, object, isHovered, tooltip }: what is on the row
    let hiddenEntries = []; // The ones that did not fit: they are in the "..." menu.
    let moreEntry = null;
    let tabEntry = null; // The button that the Tab key comes to
    let openEntry = null; // The button whose menu is open
    let openEntryAtPress = null; // The one that was open when the mouse was pressed
    let isUsedWithKeys = 0; // 1: the last thing was a key, not the mouse

    // *** PUBLIC VARIABLES:
    // NOTE: box.items are the items of the bar, item.checked is their state. Default values are also public variables.

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, ToolBar.styles, ToolBarDefaults);
        mergeIntoIfMissing(fresh, ToolBarDefaults);
        return fresh.style;
    };

    const toItem = function (given) {
        if (given === "-") return { type: "separator" };
        if (given === " ") return { type: "space" };
        if (typeof given != "object" || given === null) return { text: String(given) };
        return MenuBar.copyItem(given);
    };

    // A click changes it.
    const isToggle = function (item) {
        return (basic.isOn(item.toggle) || !!item.group);
    };

    const isChecked = function (item) {
        return basic.isOn(item.checked);
    };

    const canStayPressed = function (item) {
        return (isToggle(item) || item.checked !== undefined);
    };

    const isItemEnabled = function (item) {
        return (box.enabled == 1 && !(item.enabled !== undefined && !basic.isOn(item.enabled)));
    };

    const hasMenu = function (entry) {
        return (entry.kind === "more" || Array.isArray(entry.item.items));
    };

    const isEntryEnabled = function (entry) {
        return (entry.kind === "more") ? box.enabled == 1 : isItemEnabled(entry.item);
    };

    const isPressButton = function (entry) {
        return (entry.kind === "button" || entry.kind === "more");
    };

    // The buttons the keys go between: on the row, and enabled.
    const getUsableEntries = function () {
        return entries.filter(function (entry) {
            return isPressButton(entry) && entry.object.visible != 0 && isEntryEnabled(entry);
        });
    };

    const chooseTabEntry = function () {
        const usable = getUsableEntries();
        if (!usable.includes(tabEntry)) tabEntry = usable[0] || null;
    };

    // The edge of a button (button.border: the minimal packages): on, under the mouse, or its own
    const getButtonEdge = function (isOn, isOver) {
        if (isOn && _s.buttonOn.borderColor) return _s.buttonOn.borderColor;
        if (isOver && _s.buttonHover.borderColor) return _s.buttonHover.borderColor;
        return _s.button.borderColor || "transparent";
    };

    // PAINT: a button: the mouse on it, pressed, its menu open, disabled; only one of them is reached with Tab.
    const paintButton = function (entry) {
        const button = entry.object;
        const isEnabled = isEntryEnabled(entry);
        const isOn = (entry === openEntry || (entry.kind === "button" && isChecked(entry.item)));
        let color = "transparent";
        if (entry.isHovered && isEnabled) color = _s.buttonHover.color;
        if (isOn) color = _s.buttonOn.color;
        button.color = color;
        if (_s.button.border) button.borderColor = getButtonEdge(isOn, entry.isHovered && isEnabled);
        button.textColor = (isOn) ? _s.buttonOn.textColor : _s.button.textColor;
        button.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        button.cursor = (isEnabled) ? "pointer" : "default";
        button.tabIndex = (entry === tabEntry) ? 0 : -1;
        button.aria = { disabled: (isEnabled) ? "false" : "true" };
        if (entry.kind === "button" && canStayPressed(entry.item)) button.aria = { pressed: (isChecked(entry.item)) ? "true" : "false" };
        if (hasMenu(entry)) button.aria = { expanded: (entry === openEntry) ? "true" : "false" };
    };

    const paintButtons = function () {
        chooseTabEntry();
        entries.filter(isPressButton).forEach(paintButton);
    };

    // The look of an object of the row that comes from the style (the first drawing and setTheme).
    const applyEntryLook = function (entry) {
        if (entry.kind === "separator") {
            entry.object.props({ height: _s.separator.height, color: _s.separator.color });
            entry.object.css.margin = "0 " + _s.separator.space + "px";
            return;
        }
        if (!isPressButton(entry)) return;
        const hasText = (entry.kind === "button" && !!entry.item.text);
        entry.object.props({ height: _s.button.height, fontSize: _s.button.fontSize, round: _s.button.round });
        if (_s.button.border) entry.object.props({ border: _s.button.border, borderColor: _s.button.borderColor || "transparent" });
        // WHY minWidth and no padding: an icon button is a square.
        entry.object.css = {
            minWidth: _s.button.height + "px",
            padding: (hasText) ? "0 " + _s.button.padding + "px" : "0",
            gap: _s.button.gap + "px",
        };
        entry.object.setFocusRing(_s.focus.ringColor);
        if (entry.tooltip) entry.tooltip.look = _s.bubble;
    };

    const applyBarLook = function () {
        box.color = _s.box.color;
        box.css.borderBottom = "1px solid " + _s.box.lineColor;
        box.layout.gap = _s.layout.gap;
        box.layout.padding = [_s.layout.padding, 0];
        box.elem.style.setProperty("--tool-bar-icon", _s.button.iconSize + "px");
    };

    const createTooltip = function (entry, text) {
        return Tooltip({ target: entry.object, hintText: text, hintPosition: "bottom", look: _s.bubble });
    };

    // The bubble of a button, and its name. WHY aria: an icon button has no other name for a screen reader.
    const applyHint = function (entry) {
        const text = ToolBar.getHintText(entry.item);
        entry.object.aria = { label: entry.item.hint || entry.item.text || "" };
        if (typeof Tooltip === "undefined") {
            entry.object.elem.title = text;
            return;
        }
        if (entry.tooltip && text) {
            entry.tooltip.setHintText(text);
            return;
        }
        if (entry.tooltip) entry.tooltip.remove(); // WHY: A Tooltip with no text draws an empty bubble.
        entry.tooltip = (text) ? createIn(box.layout, function () { return createTooltip(entry, text); }) : null;
    };

    // BUTTON: A button of the row (an item, or the "...")
    const createButtonObject = function (entry, html) {
        entry.object = Button({
            width: "auto",
            color: "transparent",
            shrink: 0,
            css: { display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" },
        });
        entry.object.minimal = 1;
        entry.object.text = html;
        entry.object.onHoverChange(function (self, isOver) {
            entry.isHovered = isOver;
            paintButton(entry);
        });
        entry.object.on("click", function (self, event) { onButtonClick(entry, event); });
        entry.object.on("keydown", function (self, event) { onButtonKeyDown(entry, event); });
    };

    const createEntry = function (item) {
        const entry = { kind: "button", item: item, isHovered: 0, tooltip: null };
        if (item.type === "separator" || item.type === "space") {
            entry.kind = item.type;
            // BOX: A line, or an empty place that takes the rest of the row
            entry.object = (item.type === "separator")
                ? Box({ width: 1, shrink: 0 })
                : Box({ width: 0, height: 1, grow: 1, shrink: 0, color: "transparent" });
        } else {
            createButtonObject(entry, ToolBar.getButtonHtml(item));
            if (Array.isArray(item.items)) entry.object.aria = { haspopup: "menu" };
            applyHint(entry);
        }
        applyEntryLook(entry);
        return entry;
    };

    const createMoreEntry = function () {
        const entry = { kind: "more", item: { hint: box.moreText }, isHovered: 0, tooltip: null };
        createButtonObject(entry, ToolBar.getButtonHtml({ icon: "more" }));
        entry.object.aria = { haspopup: "menu" };
        applyHint(entry);
        applyEntryLook(entry);
        entry.object.visible = 0; // WHY: fitItems() shows it, also when the bar is drawn later.
        return entry;
    };

    const removeEntries = function () {
        entries.forEach(function (entry) {
            if (entry.tooltip) entry.tooltip.remove();
            entry.object.remove();
        });
        entries = [];
        hiddenEntries = [];
        moreEntry = null;
    };

    const createEntries = function () {
        createIn(box.layout, function () {
            entries = box.items.map(createEntry);
            moreEntry = createMoreEntry();
            entries.push(moreEntry);
        });
    };

    const isRowFull = function () {
        return (box.layout.elem.scrollWidth > box.layout.elem.clientWidth);
    };

    // The last items go into the "..." menu until the row has room.
    // WHY the measure of the page, one by one: icons, texts, lines and gaps all count, and the row knows their sum.
    const fitItems = function () {
        if (box.layout.elem.clientWidth === 0) return; // WHY: Not drawn yet: box.onResize comes back.
        const itemEntries = entries.filter(function (entry) { return entry !== moreEntry; });
        itemEntries.forEach(function (entry) { entry.object.visible = 1; });
        moreEntry.object.visible = 0;
        hiddenEntries = [];
        if (isRowFull()) {
            moreEntry.object.visible = 1;
            for (let index = itemEntries.length - 1; index >= 0 && isRowFull(); index--) {
                itemEntries[index].object.visible = 0;
                hiddenEntries.unshift(itemEntries[index]);
            }
            hideLinesAtTheEnd(itemEntries);
        }
        paintButtons();
    };

    // WHY: A line or an empty place with no button after it means nothing.
    const hideLinesAtTheEnd = function (itemEntries) {
        const shown = itemEntries.filter(function (entry) { return entry.object.visible != 0; });
        for (let index = shown.length - 1; index >= 0 && !isPressButton(shown[index]); index--) {
            shown[index].object.visible = 0;
            hiddenEntries.unshift(shown[index]);
        }
    };

    // An item as its menu takes it. WHY a copy that knows the item: a ContextMenu copies its items, and the press needs the real one.
    const toMenuItem = function (item) {
        if (typeof item != "object" || item === null) return item;
        if (item.type === "separator") return "-";
        const copy = Object.assign({}, item);
        copy.toolItem = item;
        copy.onClick = null;
        copy.text = String(item.text || item.hint || item.key || "");
        if (item.icon) copy.icon = ToolBar.getIconSvg(item.icon);
        if (item.shortcut) copy.shortcut = MenuBar.shortcutText(item.shortcut);
        if (isToggle(item)) copy.checked = (isChecked(item)) ? 1 : 0;
        if (Array.isArray(item.items)) copy.items = item.items.map(toMenuItem);
        return copy;
    };

    // The items of the "..." menu. WHY no empty places and no line at the ends: a menu has no use for them.
    const getHiddenItems = function () {
        const items = hiddenEntries.map(function (entry) { return entry.item; }).filter(function (item) { return item.type !== "space"; });
        while (items.length && items[0].type === "separator") items.shift();
        while (items.length && items[items.length - 1].type === "separator") items.pop();
        return items;
    };

    const openMenuOf = function (entry, withKeyboard) {
        const items = (entry.kind === "more") ? getHiddenItems() : entry.item.items;
        if (items.length === 0) return; // WHY: A ContextMenu with no items does not open: the button must not stay "open".
        box.menu.setItems(items.map(toMenuItem));
        openEntry = entry;
        tabEntry = entry;
        box.menu.openBelow(entry.object);
        if (withKeyboard) box.menu.activateFirst();
        paintButtons();
    };

    const onMenuClose = function () {
        const closedEntry = openEntry;
        openEntry = null;
        paintButtons();
        // WHY the keys: the focus was in the menu. After the mouse a focus by code would show the ring of the keyboard.
        if (closedEntry && isUsedWithKeys) closedEntry.object.elem.focus({ preventScroll: true });
    };

    const setItemCheckedInGroup = function (item, value) {
        if (!item.group || !value) {
            item.checked = (value) ? 1 : 0;
            return;
        }
        MenuBar.forEachItem(box.items, function (other) {
            if (other.group === item.group) other.checked = (other === item) ? 1 : 0;
        });
    };

    const pressItem = function (item) {
        if (!isItemEnabled(item)) return;
        // WHY group: one button of a group always stays pressed: a click on it changes nothing.
        if (isToggle(item)) setItemCheckedInGroup(item, (item.group) ? 1 : !isChecked(item));
        paintButtons();
        if (typeof item.onClick === "function") item.onClick(box, item);
        if (!box.isRemoved) box.onClick(box, item); // WHY: The item may have removed the bar (a window drawn again).
    };

    const onButtonClick = function (entry, event) {
        if (entry.tooltip) entry.tooltip.hideHint(); // WHY: The menu opens where the bubble is, and the button was found.
        if (!isEntryEnabled(entry)) return;
        tabEntry = entry;
        if (!hasMenu(entry)) {
            pressItem(entry.item);
            return;
        }
        const isFromKeyboard = (event.detail === 0); // WHY: Enter and Space make a click without a mouse.
        // WHY: The press closed this open menu just before this click (ContextMenu closes on a press outside it).
        const wasOpenAtPress = (!isFromKeyboard && openEntryAtPress === entry);
        openEntryAtPress = null;
        if (!wasOpenAtPress) openMenuOf(entry, isFromKeyboard);
    };

    // The button a key goes to, or null for another key.
    const entryOfKey = function (entry, key) {
        const usable = getUsableEntries();
        const place = usable.indexOf(entry);
        if (key === "ArrowRight") return usable[(place + 1) % usable.length];
        if (key === "ArrowLeft") return usable[(place - 1 + usable.length) % usable.length];
        if (key === "Home") return usable[0];
        if (key === "End") return usable[usable.length - 1];
        return null;
    };

    const focusEntry = function (entry) {
        tabEntry = entry;
        paintButtons();
        entry.object.elem.focus();
    };

    const onButtonKeyDown = function (entry, event) {
        if (openEntry) return; // WHY: The open menu reads the keys.
        const target = entryOfKey(entry, event.key);
        if (target) {
            event.preventDefault();
            focusEntry(target);
        } else if (event.key === "ArrowDown" && hasMenu(entry) && isEntryEnabled(entry)) {
            event.preventDefault();
            openMenuOf(entry, 1);
        }
    };

    const onWindowKeyDown = function (self, event) {
        if (box.enabled != 1 || event.defaultPrevented) return; // WHY defaultPrevented: a MenuBar has run this shortcut.
        if (box.elem.getClientRects().length === 0) return; // WHY: A bar in a hidden tab: its Ctrl+S belongs to the tab in front.
        const item = MenuBar.findShortcutItem(box.items, event);
        if (!item || MenuBar.isDialogOpen()) return;
        event.preventDefault(); // WHY: Ctrl+S must not also open the save window of the browser.
        if (event.repeat) return; // WHY: A held key runs it once.
        box.closeMenu();
        pressItem(item);
    };

    // The first item with this key, in the bar or in a menu of it.
    const findItem = function (key) {
        let found = null;
        MenuBar.forEachItem(box.items, function (item) {
            if (!found && item.key == key) found = item;
        });
        return found;
    };

    const findEntry = function (item) {
        return entries.find(function (entry) { return entry.item === item; });
    };

    const createMenu = function () {
        return ContextMenu({
            styleName: _s.menuStyleName,
            style: _s.menu,
            minWidth: _s.menuMinWidth,
            ariaLabel: box.ariaLabel,
            onClick: function (self, menuItem) { pressItem(menuItem.toolItem || menuItem); },
            onClose: onMenuClose,
        });
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        box.closeMenu();
        removeEntries();
        box.items = (Array.isArray(items)) ? items.map(toItem) : [];
        createEntries();
        fitItems();
        paintButtons();
    };
    // USAGE: bar.setItems([{ icon: "save", hint: "Save" }, "-", "Reset"])

    box.setItemEnabled = function (key, value) {
        const item = findItem(key);
        if (!item) return;
        item.enabled = basic.isOn(value) ? 1 : 0;
        paintButtons();
    };
    // USAGE: bar.setItemEnabled("save", 0)

    // onClick is not called. In a group the others go off.
    box.setItemChecked = function (key, value) {
        const item = findItem(key);
        if (!item) return;
        setItemCheckedInGroup(item, basic.isOn(value));
        paintButtons();
    };
    // USAGE: bar.setItemChecked("bold", 1)

    box.setItemText = function (key, text) {
        const item = findItem(key);
        if (!item) return;
        item.text = text;
        const entry = findEntry(item);
        if (!entry) return;
        entry.object.text = ToolBar.getButtonHtml(item);
        applyEntryLook(entry);
        applyHint(entry);
        fitItems();
    };

    box.setItemHint = function (key, text) {
        const item = findItem(key);
        if (!item) return;
        item.hint = text;
        const entry = findEntry(item);
        if (entry) applyHint(entry);
    };

    box.isItemChecked = function (key) {
        const item = findItem(key);
        return (!!item && isChecked(item));
    };
    // USAGE: bar.isItemChecked("bold")

    box.getCheckedKeys = function () {
        const keys = [];
        MenuBar.forEachItem(box.items, function (item) {
            if (isChecked(item)) keys.push(item.key);
        });
        return keys;
    };
    // USAGE: bar.getCheckedKeys()

    // As a click on it (onClick is called). WHY not a button with a menu: it can be in the "..." menu, with no place to open under.
    box.clickItem = function (key) {
        const item = findItem(key);
        if (item && !Array.isArray(item.items)) pressItem(item);
    };

    box.closeMenu = function () {
        if (openEntry) box.menu.close();
    };

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        if (box.enabled != 1) box.closeMenu();
        paintButtons();
    };
    // USAGE: get: bar.enabled, set: bar.setEnabled(0)

    // Another style package while it is on the page. A style given by the page stays over it.
    // WHY the menu is made again: a ContextMenu keeps the style it was made with.
    box.setTheme = function (styleName) {
        box.closeMenu();
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        box.menu.remove();
        box.menu = createMenu();
        applyBarLook();
        entries.forEach(applyEntryLook);
        paintButtons();
    };
    // USAGE: bar.setTheme("dark")

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        // WHY isRemoved and box is not set to null: an item can remove the bar in its onClick, and the code of its click goes on.
        if (box.isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).
        box.menu.remove(); // WHY: not with box.own(): setTheme() makes a new one, and own() would keep the old one to the end.
        superRemove.call(box);
    };
    // USAGE: bar.remove();

    // *** OBJECT VIEW:

    // BOX: The bar
    box.css.boxSizing = "border-box";
    box.role = "toolbar";
    box.aria = { label: box.ariaLabel };

    // GROUP: The buttons (made by createEntries)
    box.layout = HGroup({ width: "100%", height: "100%", align: "left center" });
    endGroup();

    // *** OBJECT INIT CODE:

    basic.addCss("tool-bar-icon",
        ".tool-bar-icon { display: block; flex-shrink: 0; width: var(--tool-bar-icon); height: var(--tool-bar-icon); }" +
        ".tool-bar-icon svg, .tool-bar-icon img { display: block; width: 100%; height: 100%; }" +
        ".tool-bar-arrow { display: block; flex-shrink: 0; width: 12px; height: 12px; margin-right: -2px; }" +
        ".tool-bar-arrow svg { display: block; width: 100%; height: 100%; }" +
        // WHY: The mouse going from the icon to the text would close and open the bubble of its button.
        ".tool-bar-icon, .tool-bar-text, .tool-bar-arrow { pointer-events: none; }");

    box.menu = createMenu();

    // WHY capture on window: it runs before the capture of ContextMenu on document, which closes the menu.
    box.listenTo(window, "pointerdown", function () {
        openEntryAtPress = openEntry;
        isUsedWithKeys = 0;
    }, true);
    box.listenTo(window, "keydown", function () { isUsedWithKeys = 1; }, true);
    box.listenTo(window, "keydown", onWindowKeyDown);

    applyBarLook();
    box.setItems(params.items);
    box.onResize(fitItems);

    // WHY: A text measured before its font came is narrower: the row may be full when the font comes.
    if (document.fonts && document.fonts.status !== "loaded") {
        document.fonts.ready.then(function () {
            if (!box.isRemoved) fitItems();
        });
    }

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

ToolBar.SVG_START = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
    ' stroke-linecap="round" stroke-linejoin="round">';

// The inside of the icons of a bar. USAGE: { icon: "save" }. Your own one: ToolBar.ICONS.star = '<path d="..."/>';
ToolBar.ICONS = {
    new: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    save: '<path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M8 3v5h7V3"/><path d="M7 21v-7h10v7"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    cut: '<circle cx="6" cy="6.5" r="2.5"/><circle cx="6" cy="17.5" r="2.5"/><path d="M8 8.2 20 17"/><path d="M8 15.8 20 7"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/>',
    paste: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><rect x="9" y="2.5" width="6" height="4" rx="1"/>',
    delete: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10.5 11v5"/><path d="M13.5 11v5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.7"/><path d="M20 4.5V11h-6.5"/>',
    settings: '<path d="M4 7h9"/><path d="M17 7h3"/><circle cx="15" cy="7" r="2"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="9" cy="17" r="2"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    bold: '<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z"/><path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z"/>',
    italic: '<path d="M14.5 5H10"/><path d="M14 19H9.5"/><path d="M13 5l-2 14"/>',
    underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 20.5h14"/>',
    alignLeft: '<path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h13"/>',
    alignCenter: '<path d="M4 6h16"/><path d="M7 12h10"/><path d="M5.5 18h13"/>',
    alignRight: '<path d="M4 6h16"/><path d="M10 12h10"/><path d="M7 18h13"/>',
    more: '<circle cx="5.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18.5" cy="12" r="1"/>',
    arrowDown: '<path d="m7 10 5 5 5-5"/>',
};

// An icon as an SVG text: a name of ToolBar.ICONS, or an SVG text as it is.
ToolBar.getIconSvg = function (icon) {
    const text = String(icon).trim();
    if (text.startsWith("<")) return text;
    const inside = ToolBar.ICONS[text];
    if (inside === undefined) {
        console.warn("ToolBar: There is no icon named " + text);
        return "";
    }
    return ToolBar.SVG_START + inside + "</svg>";
};

// The inside of a button: its icon, its text and, for a menu, a small arrow. WHY escape: its text can be a text of a user.
ToolBar.getButtonHtml = function (item) {
    let html = "";
    if (item.iconFile) html += '<span class="tool-bar-icon"><img alt="" src="' + basic.escapeHtml(item.iconFile) + '"></span>';
    else if (item.icon) html += '<span class="tool-bar-icon">' + ToolBar.getIconSvg(item.icon) + "</span>";
    if (item.text) html += '<span class="tool-bar-text">' + basic.escapeHtml(String(item.text)) + "</span>";
    if (Array.isArray(item.items)) html += '<span class="tool-bar-arrow">' + ToolBar.getIconSvg("arrowDown") + "</span>";
    return html;
};

// The text of its bubble: its name and its shortcut. WHY none for a button with only a text: it would repeat the button.
ToolBar.getHintText = function (item) {
    if (!item.shortcut) return item.hint || "";
    const shortcut = MenuBar.shortcutText(item.shortcut);
    const name = item.hint || item.text;
    return (name) ? name + " (" + shortcut + ")" : shortcut;
};

// *** STYLE PACKAGES:
// USAGE: ToolBar({ styleName: "dark" })
// USAGE: ToolBar({ style: { button: { iconSize: 20 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: ToolBar.styles.myStyle = { box: { color: "tomato" } };
ToolBar.styles = {

    // The ground of MenuBar, a soft line under it, gray icons.
    light: ToolBarDefaults.style,

    // For a dark window; a dark menu.
    dark: {
        box: { color: "#232322", lineColor: White(0.1) },
        button: { textColor: White(0.74) },
        buttonHover: { color: White(0.09) },
        buttonOn: { color: White(0.17), textColor: White(0.95) },
        separator: { color: White(0.16) },
        bubble: { color: "#4A4A48", shadow: "0 2px 8px " + Black(0.45) },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
        menuStyleName: "dark",
    },

};

// The minimal theme (_designs/minimal-theme.htm): no fill (the ground of the window), one line under it, 28 px quiet
// buttons with a 14 px icon: a line around the one under the mouse, an ink line around the one that is on; its hint is
// a bubble on the ground with a line, its menu ContextMenu minimal. minimalDark: the same on a dark window.
ToolBar.createMinimalStyle = function (colors) {
    return {
        height: 36,
        style: {
            box: { color: "transparent", lineColor: colors.line },
            layout: { padding: 4, gap: 2 },
            button: { height: 28, padding: 8, gap: 6, round: 4, fontSize: 13, iconSize: 14, textColor: colors.text, border: 1, borderColor: "transparent" },
            buttonHover: { color: "transparent", borderColor: colors.lineHover },
            buttonOn: { color: "transparent", textColor: colors.ink, borderColor: colors.ink },
            separator: { height: 16, space: 4, color: colors.line },
            bubble: { fontSize: 12, padding: [8, 4], color: colors.ground, textColor: colors.text, round: 4, border: 1, borderColor: colors.line, shadow: "none" },
            disabled: { opacity: 0.35 },
            focus: { ringColor: colors.focus },
            menuStyleName: colors.menuStyleName,
            menu: { item: { height: 28, fontSize: 13 } },
            menuMinWidth: 170,
        },
    };
};
ToolBar.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), line: Black(0.2), lineHover: Black(0.45), ink: "#1F1F1F", focus: "#3D8BD9", menuStyleName: "minimal" };
ToolBar.styles.minimal = ToolBar.createMinimalStyle(ToolBar.MINIMAL_COLORS);
ToolBar.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), line: White(0.18), lineHover: White(0.42), ink: "#EDEDEB", focus: "#7FB6DE", menuStyleName: "minimalDark" };
ToolBar.styles.minimalDark = ToolBar.createMinimalStyle(ToolBar.MINIMAL_DARK_COLORS);
