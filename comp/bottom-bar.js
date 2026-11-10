/* Bismillah */

/*

Component: BottomBar - v26.11
Description: Mobile application bottom bar component that creates buttons from a JSON list.
Started Date: December 2025
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

- Design idea from an Instagram post by shahinurstk02

NEEDS: comp/badge.js (Badge), loaded before the first item is created.
ITEMS: { iconFile, selectedIconFile, text, color }. selectedIconFile is the icon of the selected item ("": its iconFile).

THE NAME OF THE SELECTED ITEM (labelMode):
- "inline" (the default): next to its icon, in the selected box.
- "float": the selected box is only around the icon; the name shows over it in a small pill (style.floatLabel) and
  fades out after floatLabelTime ms. The pill follows the selected box. (Sample: 02-comp-examples/bottom-bar-2.htm)
- "none": no names.
ITEM COLORS: items[i].color is the color of the selected box behind that item (else style.selectedBox.color).
BADGES: the badge param goes to the Badge of every item (its style is the badgeStyle of Badge). An item shows its
  badge after bar.setBadge(index, value); bar.setBadge(index, "") removes it.
THE SPACE AFTER THE NAME: layout.labelEndSpace (and the empty side of an icon box bigger than its icon) goes after
  the name, so the selected box looks even at both ends.
KEYBOARD AND SCREEN READERS: every item is a button named by its text ("Tab 1"... without a text); the Tab key
  reaches it, Enter / Space choose it like a click.

USAGE:
const bar = BottomBar({
    top: page.height - 100,
    items: [{ iconFile: "home.png", selectedIconFile: "homes.png", text: "Home" }, { iconFile: "search.png", text: "Search" }],
    onItemClick: function (self, item, index) { println(item.data.text); },
});
bar.setBadge(1, 5);
bar.selectByIndex(0);
bar.setLabelMode("float");

// A tab bar: a white bar, a circle in the color of the item behind the selected
// icon, its name over it for a moment, a number badge with a white ring (also "0" and "1").
BottomBar({
    bottom: 0,
    height: 80,
    labelMode: "float",
    items: [{ iconFile: "home.png", text: "Home", color: "#5ABB9F" }, { iconFile: "tasks.png", text: "Tasks" }],
    badge: {
        showZero: 1,
        dotForOne: 0,
        style: { color: "indianred", border: 3, borderColor: "white", textColor: "white" },
        numberStyle: { fontSize: 14, bold: 1, padding: [8, 3], round: 20, top: -10, right: -14 },
    },
    style: {
        container: { gradient: "white" }, // NOTE: gradient is the CSS background of the box: it is written over color.
        background: { gradient: "none", round: 0 },
        layout: { barHeight: 80, padding: 20, itemSpacing: 40, iconGap: 0, selectionPadding: 8 },
        selectedBox: { color: "#141414", border: 0 },
    },
});

*/

"use strict";

// Default values:
const BottomBarDefaults = {
    selectedIndex: 0,
    left: 0,
    width: "100%",
    height: 100,
    items: [], // [{ iconFile: "home.png", selectedIconFile: "homes.png", text: "Home", color: "#5ABB9F" }] (selectedIconFile, color: optional)
    onItemClick: function (self, item, index) { },
    hoverEffect: true, // For desktop usage
    labelMode: "inline", // "inline": the name next to the selected icon, "float": over it for a moment, "none": no names
    allowHtml: 0, // 1: the names of the items are HTML (only for your own texts)
    floatLabelTime: 600, // ms: from the moment the name shows over the selected item to its fade out ("float")
    badge: { // The params of the Badge of every item (comp/badge.js)
        showZero: 0, // 1: a badge set to 0 shows "0" (0: hidden)
        dotForOne: 1, // 1: a dot for 1, 0: the number 1
        maxValue: 99, // More: "99+"
        dotSize: 12,
        style: { color: "#FE5D49" }, // The dot and the number: color, border, borderColor, textColor (badgeStyle of Badge)
        numberStyle: {}, // Only the number, over style: fontSize, bold, padding, round, top, right...
    },
    style: {
        container: {
            color: "transparent",
            gradient: "linear-gradient(to bottom, transparent, whitesmoke)",
            border: 0,
        },
        background: {
            gradient: "linear-gradient(to right, #FFC8C1, #A5E5EB)",
            border: 0,
            round: 100,
        },
        // Layout configuration
        layout: {
            barHeight: 76, // The height of the bar (the background)
            iconBoxSize: 40, // The box of an icon: the button of the item, with its badge
            padding: 40,
            itemSpacing: 20,
            iconGap: 6,
            selectionPadding: 14,
            // px more after the name of the selected item: an icon file has an empty edge at its left, a name has none
            // at its right, so the same padding looked smaller after the name. 0: no more space
            labelEndSpace: 6,
        },
        icon: {
            width: 40,
            height: 40,
        },
        label: {
            textColor: "#FE5D49",
        },
        selectedBox: {
            color: "#EAEAE9", // An item with its own color (items[i].color) gives its color instead.
            round: 100,
            border: 1,
            borderColor: "#FFFFFF",
            height: 56,
        },
        floatLabel: { // labelMode: "float": the pill of the name over the selected item (any prop of a Label)
            fontSize: 14,
            textColor: Black(0.8),
            color: White(0.8),
            border: 1,
            borderColor: Black(0.6),
            round: 6,
            padding: [8, 3],
            space: 20, // px between the selected box and the pill
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.8)", // The ring of an item that has the keyboard focus
        },
    }
};

const BottomBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BottomBarDefaults);

    // BOX: Component container
    const box = startObject(params);
    box.color = box.style.container.color;
    box.border = box.style.container.border;
    box.css.background = box.style.container.gradient;

    // *** PRIVATE VARIABLES:
    const BAR_WIDTH = 350; // The first width of the bar; refresh() gives it the width of its items.
    const SELECTED_BOX_WIDTH = 142; // The first width; refresh() sets it around the selected item.
    const LABEL_FIRST_LEFT = 12;
    const LABEL_RAISE = 2; // px above the center line: it looks centered next to the icon.
    const HOVER_ICON_OPACITY = 0.5;
    const REFRESH_DELAY = 3; // ms: many changes in a row make one refresh.
    const stillClipContent = box.clipContent; // WHY: "float" lets the pill stand over the bar; another mode puts it back.
    let isFloatLabelWaiting = 1; // 1: the next refresh() shows the name over the selected item (the first view, a selection)
    let isFloatLabelPlaced = 0;
    let cancelFloatLabelHide = null; // The cancel function of the timer that fades the name out (box.after)

    // *** PUBLIC VARIABLES:
    box.itemObjList = [];
    // NOTE: An item object: { icon (box: icon.i1 normal, icon.i2 selected), label, badge, index, data }
    // NOTE: box.lblFloat is the pill of the name over the selected item (only with labelMode: "float").

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const isFloatMode = function () {
        return box.labelMode === "float";
    };

    // WHY: "inline" is the default: an unknown mode is "inline".
    const isInlineMode = function () {
        return box.labelMode !== "float" && box.labelMode !== "none";
    };

    // The icon of the selected item: a file of its own, or its icon again.
    const getSelectedIconFile = function (itemData) {
        return itemData.selectedIconFile || itemData.iconFile;
    };

    // The name of an item for a screen reader
    const getItemName = function (itemData, index) {
        return itemData.text || ("Tab " + (index + 1));
    };

    // The space after the name, to look like the space before the icon.
    // WHY the icon box: an icon box bigger than its icon has an empty side before the icon, and it counts there too.
    const getLabelEndSpace = function (item) {
        const iconEmptySide = (item.icon.width - box.style.icon.width) / 2;
        return iconEmptySide + box.style.layout.labelEndSpace;
    };

    // The width of an item in the bar: the selected one shows its name next to its icon ("inline").
    const getItemWidth = function (item, isSelected) {
        if (!isSelected || !isInlineMode()) return item.icon.width;
        return item.icon.width + box.style.layout.iconGap + item.label.width + getLabelEndSpace(item);
    };

    // The label of the selected item is next to its icon ("inline"); the others wait under their icon.
    const getLabelLeft = function (item, isSelected) {
        if (!isSelected || !isInlineMode()) return item.icon.left;
        return item.icon.left + item.icon.width + box.style.layout.iconGap;
    };

    // The space at the ends of the bar: layout.padding, or less when the items would not fit on a narrow phone.
    // WHY selectionPadding: the selected box must stay in the bar.
    const getBarPadding = function () {
        const _layout = box.style.layout;
        const itemsWidth = box.itemObjList.reduce(function (sum, item, index) {
            return sum + getItemWidth(item, index == box.selectedIndex);
        }, 0);
        const spacingWidth = _layout.itemSpacing * (box.itemObjList.length - 1);
        const spareWidth = box.width - itemsWidth - spacingWidth - (_layout.padding * 2);
        if (!box.width || spareWidth >= 0) return _layout.padding;
        return Math.max(_layout.selectionPadding, _layout.padding + (spareWidth / 2));
    };

    // PAINT: the selected item shows its selected icon (and its label: "inline").
    const paintItem = function (item, isSelected) {
        item.label.opacity = (isSelected && isInlineMode()) ? 1 : 0;
        item.icon.i1.opacity = isSelected ? 0 : 1;
        item.icon.i2.opacity = isSelected ? 1 : 0;
        item.icon.clickable = isSelected ? 0 : 1;
        item.icon.aria = { pressed: isSelected };
    };

    // The color of the selected box: the color of the selected item, or the color of the style.
    // WHY: Only when an item has a color: a page that paints the box itself (selectedBox.color = ...) keeps its color.
    const paintSelectedBoxColor = function (item) {
        const hasItemColors = box.itemObjList.some((each) => each.data.color);
        if (!hasItemColors) return;
        box.selectedBox.color = item.data.color || box.style.selectedBox.color;
    };

    // The selected box is around the icon (and the label: "inline") of the selected item.
    const placeSelectedBox = function (item) {
        const _layout = box.style.layout;
        box.selectedBox.opacity = 1;
        box.selectedBox.left = item.icon.left - _layout.selectionPadding;
        box.selectedBox.width = getItemWidth(item, true) + (_layout.selectionPadding * 2);
        paintSelectedBoxColor(item);
    };

    // THE NAME OVER THE SELECTED ITEM (labelMode: "float"):

    // The props of the pill: the floatLabel style without space.
    // WHY: space is a setter of a Label (its padding); here it is the gap over the selected box.
    const getFloatLabelLook = function () {
        const look = { ...box.style.floatLabel };
        delete look.space;
        return look;
    };

    // LABEL: The pill. Its container must be set (createIn).
    const createFloatLabel = function () {
        const label = Label({ ...getFloatLabelLook(), opacity: 0 });
        label.css = { whiteSpace: "nowrap" }; // WHY: A long name stays on one line near the edge of the bar.
        label.aria = { hidden: true }; // WHY: The name is already the name of the item for a screen reader.
        label.setMotion("left 0.3s, opacity 0.3s");
        label.onResize(placeFloatLabel); // WHY: The size of its text is known after it is drawn.
        return label;
    };

    // Over the middle of the selected box. (In the box of the component: the bar does not cut it.)
    const placeFloatLabel = function () {
        if (!box.lblFloat) return;
        const innerBorder = box.innerBox.border || 0;
        const selectedBoxCenter = box.innerBox.left + innerBorder + box.selectedBox.left + (box.selectedBox.width / 2);
        const selectedBoxTop = box.innerBox.top + innerBorder + box.selectedBox.top;
        if (!isFloatLabelPlaced) box.lblFloat.dontMotion(); // WHY: The first place: it does not fly in from far.
        isFloatLabelPlaced = 1;
        box.lblFloat.left = Math.round(selectedBoxCenter - (box.lblFloat.width / 2));
        box.lblFloat.top = Math.round(selectedBoxTop - box.style.floatLabel.space - box.lblFloat.height);
    };

    const hideFloatLabel = function () {
        if (cancelFloatLabelHide) cancelFloatLabelHide();
        cancelFloatLabelHide = null;
        box.lblFloat.opacity = 0;
    };

    // The name fades in over the selected item; floatLabelTime ms later it fades out.
    const showFloatLabel = function (item) {
        hideFloatLabel(); // WHY: Its timer starts again.
        if (!item.data.text) return; // No name: no pill
        setText(box.lblFloat, item.data.text);
        placeFloatLabel();
        box.lblFloat.opacity = 1;
        cancelFloatLabelHide = box.after(box.floatLabelTime, hideFloatLabel);
    };

    // After refresh(): the name shows after a selection (and at the first view), else the pill only follows.
    const refreshFloatLabel = function () {
        if (!box.lblFloat) return;
        const selectedItem = box.itemObjList[box.selectedIndex];
        if (!isFloatMode() || !selectedItem) {
            hideFloatLabel();
            return;
        }
        if (isFloatLabelWaiting) {
            isFloatLabelWaiting = 0;
            showFloatLabel(selectedItem);
            return;
        }
        placeFloatLabel();
    };

    // "float": the pill is made the first time (a bar of another mode has no extra object),
    // and the box of the component lets it stand over the bar.
    const applyLabelMode = function () {
        if (isFloatMode()) {
            box.clipContent = 0;
            if (!box.lblFloat) box.lblFloat = createIn(box, createFloatLabel);
            return;
        }
        if (box.lblFloat) box.clipContent = stillClipContent; // "float" was on before
    };

    // The user chose an item: a click, Enter or Space.
    const selectByUser = function (itemView, index) {
        box.selectedIndex = index;
        isFloatLabelWaiting = 1;
        box.onItemClick(box, itemView, index);
        box.refresh();
    };

    const createButtons = function (items) {
        items.forEach((itemData, index) => {
            createButton(itemData, index);
        });
    };

    // BADGE: The badge param of the bar. Its style is the badgeStyle of Badge.
    // NOTE: The objects are copied: Badge fills its defaults into them, the param of the bar does not change.
    const createItemBadge = function () {
        const { style, numberStyle, ...badgeParams } = box.badge;
        return Badge({
            ...badgeParams,
            value: "", // WHY: No value: hidden until setBadge(), also with showZero: 1.
            badgeStyle: { ...style },
            numberStyle: { ...numberStyle },
        });
    };

    // KEYBOARD AND SCREEN READERS: the icon box is the button of the item.
    const makeItemAccessible = function (itemView, itemData, index) {
        const iconBox = itemView.icon;
        iconBox.role = "button";
        iconBox.aria = { label: getItemName(itemData, index) };
        iconBox.tabIndex = 0;
        iconBox.setFocusRing(box.style.focus.ringColor);
        iconBox.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault(); // WHY: Space must not scroll the page.
            if (box.selectedIndex == index) return; // WHY: Like the mouse: the selected item can not be clicked.
            selectByUser(itemView, index);
        });
    };

    // ICON BOX: the normal and the selected icon on each other, and the badge.
    const createItemIcon = function (itemView, itemData, index) {

        const _iconBoxSize = box.style.layout.iconBoxSize;

        itemView.icon = startBox({
            width: _iconBoxSize,
            height: _iconBoxSize,
            color: "transparent",
            position: "absolute", // WHY: refresh() places the items itself (left), not a flex layout.
            clipContent: 0, // WHY: A badge can stand out of the corner of the icon (badge.numberStyle top / right).
        });
        box.innerBox.add(itemView.icon);
        itemView.icon.center("top");
        itemView.icon.setMotion("left 0.3s, opacity 0.3s");
        itemView.icon.cursor = "pointer";
        itemView.icon.on("click", function () {
            selectByUser(itemView, index);
        });
        makeItemAccessible(itemView, itemData, index);

            // ICON: normal (black)
            itemView.icon.i1 = Icon(0, 0, {
                width: box.style.icon.width,
                height: box.style.icon.height,
                position: "absolute",
            });
            itemView.icon.i1.center(); // WHY: An icon box bigger than the icon (layout.iconBoxSize).
            itemView.icon.i1.load(itemData.iconFile);
            itemView.icon.i1.setMotion("opacity 0.3s");

            // ICON: selected (orange)
            itemView.icon.i2 = Icon(0, 0, {
                width: box.style.icon.width,
                height: box.style.icon.height,
                position: "absolute",
                opacity: 0,
            });
            itemView.icon.i2.center();
            itemView.icon.i2.load(getSelectedIconFile(itemData));
            itemView.icon.i2.setMotion("opacity 0.3s");

            // Hover effect for icons (for desktop usage)
            if (box.hoverEffect) {
                itemView.icon.on("mouseover", function () {
                    itemView.icon.i2.opacity = HOVER_ICON_OPACITY;
                });
                itemView.icon.on("mouseout", function () {
                    if (box.selectedIndex != index) itemView.icon.i2.opacity = 0;
                });
            }

            // Badge with number
            itemView.badge = createItemBadge();

        endBox();
    };

    // LABEL: shown only when the item is selected ("inline").
    const createItemLabel = function (itemView, itemData) {
        itemView.label = Label({
            left: LABEL_FIRST_LEFT,
            width: "auto",
            height: "auto",
            color: "transparent",
            textColor: box.style.label.textColor,
            position: "absolute", // WHY: refresh() places the items itself (left), not a flex layout.
            opacity: 0,
        });
        setText(itemView.label, itemData.text);
        itemView.label.css = { whiteSpace: "nowrap" }; // WHY: A name of two words broke while the bar was growing.
        box.innerBox.add(itemView.label);
        itemView.label.center("top");
        itemView.label.top -= LABEL_RAISE;
        itemView.label.setMotion("left 0.3s, opacity 0.3s");
        itemView.label.aria = { hidden: true }; // WHY: The text is the name of the button of the item (its icon box).
        itemView.label.onResize(box.refreshOneTime); // WHY: The width of the label is known only after it is drawn.
    };

    const createButton = function (itemData, index) {
        const itemView = {};
        createItemIcon(itemView, itemData, index);
        createItemLabel(itemView, itemData);
        itemView.index = index;
        itemView.data = itemData;

        box.itemObjList.push(itemView);
        box.refreshOneTime();
    };

    // *** PUBLIC FUNCTIONS:

    // Many calls in a row make one refresh().
    // NOTE: box.after() is a timer of the box: it can not run after remove().
    box.refreshOneTime = function () {
        if (box.refreshTimeout) box.refreshTimeout();
        box.refreshTimeout = box.after(REFRESH_DELAY, function () { box.refresh(); });
    };

    // value: a number; "" removes the badge.
    box.setBadge = function (index, value) {
        box.itemObjList[index].badge.setValue(value);
    };
    // USAGE: bar.setBadge(1, 5)

    box.selectNone = function () {
        box.selectedIndex = -1;
        box.refreshOneTime();
    };

    box.selectByIndex = function (index) {
        box.selectedIndex = index;
        isFloatLabelWaiting = 1; // The name shows over it ("float").
        box.refreshOneTime();
    };
    // USAGE: get: bar.selectedIndex, set: bar.selectByIndex(2)

    box.setLabelMode = function (mode) {
        box.labelMode = mode;
        applyLabelMode();
        box.refreshOneTime();
    };
    // USAGE: get: bar.labelMode, set: bar.setLabelMode("float") // "inline", "float", "none"

    // Places the items from the left: the selected one is wider ("inline": icon + label), then the bar takes their width.
    box.refresh = function () {

        const _layout = box.style.layout;
        const _barPadding = getBarPadding();
        let _currentLeft = _barPadding;

        if (box.selectedIndex == -1) box.selectedBox.opacity = 0;

        box.itemObjList.forEach((item, index) => {
            const isSelected = (index == box.selectedIndex);
            item.icon.left = _currentLeft;
            item.label.left = getLabelLeft(item, isSelected);
            paintItem(item, isSelected);
            if (isSelected) placeSelectedBox(item);
            _currentLeft += getItemWidth(item, isSelected) + _layout.itemSpacing;
        });

        _currentLeft += _barPadding - _layout.itemSpacing;
        box.innerBox.width = _currentLeft;
        box.innerBox.center();

        refreshFloatLabel();

    };

    // *** OBJECT VIEW:

    // BOX: The bar (the items are added into it by createButton)
    box.innerBox = startBox({
        round: box.style.background.round,
        width: BAR_WIDTH,
        height: box.style.layout.barHeight,
        border: box.style.background.border,
    });
    box.innerBox.css.background = box.style.background.gradient;
    box.innerBox.setMotion("width 0.3s, left 0.3s");

        // BOX: Behind the selected item
        box.selectedBox = Box(0, 0, SELECTED_BOX_WIDTH, box.style.selectedBox.height, box.style.selectedBox);
        box.selectedBox.opacity = 0;
        box.selectedBox.setMotion("left 0.3s, width 0.3s, opacity 0.3s, background-color 0.3s");
        box.selectedBox.center("top");

    endBox();

    // NOTE: The pill of the name (box.lblFloat, "float") is made by applyLabelMode(), over the bar.

    // *** OBJECT INIT CODE:
    applyLabelMode();
    createButtons(box.items);
    box.onResize(function () {
        box.innerBox.dontMotion();
        box.innerBox.center();
        box.refreshOneTime(); // WHY: A narrower screen (a phone turned) may need a smaller padding.
        if (!box.lblFloat) return;
        box.lblFloat.dontMotion();
        placeFloatLabel();
    });

    return endObject(box);

};
