/* Bismillah */

/*

ActionTabBar - v26.11

UI COMPONENT
- A tab bar for the bottom of a mobile app, with a big round "+" button at its right end: the tabs (an icon over a
  text) change the page, the "+" runs the main action of the app (Ex: add a spending).
- The selected tab is clear (opacity 1), the others are faded. A short line under the selected tab slides to it
  (0.2 s). Only transform moves; no motion at the first view; none when the system asks for reduced motion.
- The "+" is drawn in SVG (no image file) and calls onAction. A tap on a tab selects it and calls onChange.
- KEYBOARD AND ACCESSIBILITY: the tabs are a tablist (role "tab", aria-selected) with one Tab stop (roving tabindex):
  Left / Right arrows, Home, End move between them, Enter / Space select. The "+" is a button (Tab reaches it,
  Enter / Space; its name: actionAriaLabel). A focus ring only for the keyboard.
- THE SIZES are px of a 600 px design (the page is fitted with page.fit(600, 800)): the tabs
  are 130 px wide from x 30, so three tabs fit next to the "+".
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- NEEDS basic.js v26.10.23 (role, aria, tabIndex, setFocusRing).

USAGE:
const tabBar = ActionTabBar({
    bottom: 0,
    items: [
        { key: "status", text: "STATUS", iconFile: "../assets/tab-bar/status.png" },
        { key: "receipts", text: "RECEIPTS", iconFile: "../assets/tab-bar/transactions.png" },
        { key: "tools", text: "TOOLS", iconFile: "../assets/tab-bar/settings.png" },
    ],
    value: "status",
    onChange: function (self) { openPage(self.value); },
    onAction: function (self) { openNewSpending(); },
});
tabBar.setValue("tools");        // onChange is called
tabBar.setValue("status", 1);    // silent: onChange is not called
tabBar.getIndex();               // 0: the index of the selected tab

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ActionTabBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 600,
    height: 150,
    items: [], // [{ key, text, iconFile }] (Only at create time)
    value: null, // The key of the selected tab. null: the first tab
    ariaLabel: "Tabs", // The name of the tab list for a screen reader
    actionAriaLabel: "Add", // The name of the "+" button for a screen reader
    onChange: function (self) { }, // self.value, self.previousValue, self.getIndex()
    onAction: function (self) { }, // The "+" button
    style: {
        bar: {
            space: 20, // From the left, the top and the right of the box
            height: 100,
            background: "linear-gradient(to bottom, #D8D8D8, #D8D8D800)",
            round: 20,
            border: 1,
            borderColor: "#141414",
        },
        item: { // A tab: as high as the bar
            left: 30, // The first tab, from the left of the box
            width: 130,
            gap: 5, // Between the tabs
            round: 16, // The shape of its focus ring
            passiveOpacity: 0.4, // A tab that is not selected
        },
        icon: {
            size: 40,
            top: 12,
        },
        label: {
            bottom: 12,
            fontSize: 23,
            textColor: "#000000",
            opacity: 0.6,
        },
        indicator: { // The line under the selected tab
            top: 106,
            width: 60,
            height: 4,
            color: "#40A5AF",
            opacity: 0.8,
            round: 4,
            motionTime: 0.2, // s: it slides to the selected tab. 0: no motion
            ease: "ease",
        },
        action: { // The round "+" button
            top: 10,
            right: 35,
            size: 120,
            color: "#FFFFFF",
            border: 2,
            borderColor: "#141414",
            round: 100,
            iconSize: 48,
            iconColor: "#000000",
            iconLine: 2.35, // On a 24 px grid
            iconOpacity: 0.65,
        },
        focus: {
            ringColor: "rgba(64, 165, 175, 0.9)", // The ring of the keyboard focus (a tab, the "+")
        },
    },
};

const ActionTabBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ActionTabBarDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.items = ActionTabBar.normalizeItems(params.items); // WHY: A copy: the array of the caller does not change.

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let itemList = []; // A Box for every tab (item.data: { key, text, iconFile }; item.icon, item.label)

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    // NOTE: Default values are also public variables. (box.items, box.value)

    // *** PRIVATE FUNCTIONS:

    // DRAWING: each function does one job:
    // createItems()       -> a Box for every tab                                          (the first drawing)
    // showSelectedItem()  -> after box.value changed: the look of the tabs, the line under the selected one
    //                        and the Tab order                                              (setValue)

    const findItem = function (key) {
        return itemList.find(function (item) { return item.data.key === key; }) || null;
    };

    const isMotionOn = function () {
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    // The left of a tab in the box: from style.item.left, one after the other.
    const getItemLeft = function (index) {
        return _s.item.left + index * (_s.item.width + _s.item.gap);
    };

    // The line is in the middle under its tab.
    const getIndicatorLeft = function (index) {
        return getItemLeft(index) + (_s.item.width - _s.indicator.width) / 2;
    };

    // DATA: one tab, in the tab list. (createIn)
    const createItem = function (data, index) {

        // BOX: Tab
        const item = startBox({
            left: getItemLeft(index),
            top: _s.bar.space,
            width: _s.item.width,
            height: _s.bar.height,
            color: "transparent",
            round: _s.item.round,
        });

            // ICON:
            item.icon = Icon({
                left: (_s.item.width - _s.icon.size) / 2,
                top: _s.icon.top,
                width: _s.icon.size,
                height: _s.icon.size,
                alt: "",
            });

            // LABEL: Text
            item.label = Label({ ..._s.label, left: 0, width: "100%", textAlign: "center", plainText: data.text });

        endBox();

        item.data = data;
        item.cursor = "pointer";
        item.role = "tab";
        item.aria = { label: data.text };
        item.setFocusRing(_s.focus.ringColor);
        if (data.iconFile) item.icon.load(data.iconFile);
        else item.icon.visible = 0;

        item.on("click", function () { selectByUser(item); });
        item.on("keydown", function (self, event) { onItemKeyDown(item, event); });
        return item;

    };

    const createItems = function () {
        itemList = box.items.map(function (data, index) {
            return createIn(box.tabList, function () { return createItem(data, index); });
        });
    };

    // The line slides to the selected tab. (isAnimated: 0 -> it jumps: the first view)
    const moveIndicator = function (isAnimated) {
        const index = box.getIndex();
        box.indicator.visible = (index >= 0) ? 1 : 0;
        if (index < 0) return;
        const seconds = _s.indicator.motionTime;
        const isMoving = (isAnimated && seconds > 0 && isMotionOn());
        box.indicator.setMotionNow((isMoving) ? "transform " + seconds + "s " + _s.indicator.ease : "none");
        box.indicator.css.transform = "translateX(" + getIndicatorLeft(index) + "px)";
    };

    // Roving tabindex: only one tab is in the Tab order.
    // WHY: The only place that sets the tabIndex of the tabs: with two places, two tabs could be in the Tab order.
    const makeTabbable = function (tabbableItem) {
        itemList.forEach(function (item) {
            item.tabIndex = (item === tabbableItem) ? 0 : -1;
        });
    };

    // THE SELECTED TAB IS SHOWN: the look of the tabs, the line under the selected one, the Tab order.
    // WHY: One place, so no setter can forget a part.
    const showSelectedItem = function (isAnimated) {
        const selectedItem = findItem(box.value);
        itemList.forEach(function (item) {
            const isSelected = (item === selectedItem);
            item.opacity = (isSelected) ? 1 : _s.item.passiveOpacity;
            item.aria = { selected: isSelected };
        });
        moveIndicator(isAnimated);
        makeTabbable(selectedItem || itemList[0]);
    };

    const focusItem = function (item) {
        makeTabbable(item);
        item.elem.focus({ preventScroll: true });
    };

    // A tap on a tab: it is selected and takes the focus (a ring only for the keyboard).
    const selectByUser = function (item) {
        box.setValue(item.data.key);
        focusItem(item);
    };

    const onItemKeyDown = function (item, event) {
        const index = itemList.indexOf(item);
        const count = itemList.length;
        const key = event.key;
        if (key === "ArrowLeft") focusItem(itemList[(index - 1 + count) % count]); // WHY: % goes round at both ends.
        else if (key === "ArrowRight") focusItem(itemList[(index + 1) % count]);
        else if (key === "Home") focusItem(itemList[0]);
        else if (key === "End") focusItem(itemList[count - 1]);
        else if (key === "Enter" || key === " ") box.setValue(item.data.key);
        else return; // Another key: the browser keeps it.
        event.preventDefault();
    };

    const runAction = function () {
        box.onAction(box);
    };

    const onActionKeyDown = function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        runAction();
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called. Returns 1 when the tab exists.
    box.setValue = function (key, silent = 0) {
        if (!findItem(key)) return 0;
        if (box.value === key) return 1;
        box.previousValue = box.value;
        box.value = key;
        showSelectedItem(1);
        if (!silent) box.onChange(box);
        return 1;
    };
    // USAGE: tabBar.setValue("tools")

    // The index of a tab (default: the selected one). -1: no tab with this key.
    box.getIndex = function (key = box.value) {
        return itemList.findIndex(function (item) { return item.data.key === key; });
    };

    // *** OBJECT VIEW:

    const _b = _s.bar;
    const _a = _s.action;

    // BOX: The bar (a gray that fades to the bottom)
    box.bar = Box({
        left: _b.space,
        top: _b.space,
        width: "calc(100% - " + (_b.space * 2) + "px)",
        height: _b.height,
        color: "transparent",
        round: _b.round,
        border: _b.border,
        borderColor: _b.borderColor,
        css: { background: _b.background },
    });

    // BOX: The tab list (the tabs are made by createItems())
    box.tabList = Box({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });
    box.tabList.role = "tablist";
    box.tabList.aria = { label: box.ariaLabel };

    // BOX: The line under the selected tab
    box.indicator = Box({
        left: 0,
        top: _s.indicator.top,
        width: _s.indicator.width,
        height: _s.indicator.height,
        color: _s.indicator.color,
        opacity: _s.indicator.opacity,
        round: _s.indicator.round,
    });

    // LABEL: The round "+" button
    box.btnAction = Label({
        right: _a.right,
        top: _a.top,
        width: _a.size,
        height: _a.size,
        color: _a.color,
        border: _a.border,
        borderColor: _a.borderColor,
        round: _a.round,
        text: ActionTabBar.getPlusSvg(_a.iconColor, _a.iconSize, _a.iconLine, _a.iconOpacity),
        lineHeight: "0",
        clickable: 1,
        cursor: "pointer",
        css: { display: "flex", alignItems: "center", justifyContent: "center" },
    });
    box.btnAction.role = "button";
    box.btnAction.aria = { label: box.actionAriaLabel };
    box.btnAction.tabIndex = 0;
    box.btnAction.setFocusRing(_s.focus.ringColor);

    // *** OBJECT INIT CODE:

    box.btnAction.on("click", runAction);
    box.btnAction.on("keydown", onActionKeyDown);

    createItems();
    if (!findItem(box.value)) box.value = (itemList.length) ? itemList[0].data.key : null;
    showSelectedItem(0);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// A tab: { key, text, iconFile }. A text is a tab too: "Home" -> { key: "Home", text: "Home", iconFile: "" }
ActionTabBar.normalizeItems = function (items) {
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
        if (typeof item !== "object" || item === null) return { key: String(item), text: String(item), iconFile: "" };
        const text = (item.text === undefined || item.text === null) ? "" : String(item.text);
        const key = (item.key === undefined) ? text : item.key;
        return { key: key, text: text, iconFile: item.iconFile || "" };
    });
};

// The "+" of the action button. line: the width of its lines on the 24 px grid of the icon (round ends).
ActionTabBar.getPlusSvg = function (color, size, line, opacity) {
    const GRID_SIZE = 24;
    const middle = GRID_SIZE / 2;
    const start = line / 2; // WHY: The round ends touch the edges of the grid.
    const end = GRID_SIZE - line / 2;
    const path = "M" + middle + " " + start + "V" + end + "M" + start + " " + middle + "H" + end;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24"' +
        ' fill="none" stroke="' + color + '" stroke-width="' + line + '" stroke-linecap="round" opacity="' + opacity + '"' +
        ' aria-hidden="true"><path d="' + path + '"/></svg>';
};
