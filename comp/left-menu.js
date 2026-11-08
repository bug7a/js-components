/* Bismillah */

/*

LeftMenu - v26.09

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

- The menu opens when the mouse is over it. On a touch device there is no hover, so it opens with a tap:
  the first tap opens the menu (it does not select an item, because the texts are not visible when it is closed),
  the second tap selects the item and closes the menu. A tap outside the menu also closes it.
-- openOnClick: "auto" (touch device: tap, mouse: hover), 1: always tap, 0: always hover, "direct": a tap selects at
   once and the menu stays closed (for a short menu with clear icons).
-- itemHeight: the height of a button item. A page fitted with page.fit() is zoomed: for a finger give Ex: 44 / page.zoom.
-- leftMenu.setOpenOnClick(1) changes it later.
- Style packages: "dark" (default: a dark menu with a red selection) and "light" (for a light
  page: a light menu with a line at its right side, a soft shadow while it is open over the page, the cyan of
  SmartButton in light tones, dark icons and a dark scroll bar). A package is a package of params (LeftMenu.styles):
  LeftMenu({ styleName: "light" }), LeftMenu({ styleName: "light", selectedColor: "#DCEBEC" }) (a param wins).
  Samples: 02-comp-examples/left-menu.htm (dark), left-menu-2.htm (light).
- An item: { key, type: "button", text, iconFile, dontSelect } (dontSelect: 1: a click opens it, the selection stays)
  or a title { key, type: "header", text }. addItemToTop(item) / addItemToBottom(item) add one later.

Started Date: December 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const LeftMenuDefaults = {
    key: "0",
    expandedWidth: 250,           // Expanded width on hover
    itemHeight: 40,               // The height of a button item
    topBarHeight: 40,             // Height of top bar to account for
    backgroundColor: "#141414",   // Menu background color
    hoverColor: "rgba(255, 255, 255, 0.05)", // Hover color for buttons
    selectedColor: "#583432",     // Selected button color
    titleColor: "#8E342F",
    textColor: "rgba(255, 255, 255, 0.6)",           // Text color
    selectedTextColor: "rgba(255, 255, 255, 0.95)",
    allowHtml: 0, // 1: the texts of the items are HTML (only for your own texts)
    invertIconColor: 1,
    lineColor: "",                // A line at the right side of the menu ("": none)
    expandedShadow: "",           // The shadow of the open menu over the page ("": none). Ex: "6px 0 18px rgba(0, 0, 0, 0.08)"
    scrollBarColor: "#FFFFFF",    // The bar of the scroll of the items (a dark one on a light menu)
    openOnClick: "auto",          // "auto": Tap on a touch device, hover with a mouse. 1: Always tap, 0: Always hover.
    items: [],                    // [{ key, type: "button", text, iconFile }, { key, type: "header", text }]
    onItemClick: function(self, item) {}, // Callback when item is clicked
    onMenuToggle: function(self, isExpanded) {}, // Callback when menu expands/collapses
    styleName: "dark",            // "dark", "light" or a name added to LeftMenu.styles
    style: {},                    // WHY: the look is in the flat params above; the packages are packages of params (LeftMenu.styles)
};

const LeftMenu = function(params = {}) {

    // Merge style package: your params > LeftMenu.styles[styleName] (a package of params) > LeftMenuDefaults (dark)
    basic.applyStylePackage(params, LeftMenu.styles, LeftMenuDefaults);

    // Merge params:
    mergeIntoIfMissing(params, LeftMenuDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let isExpanded = 0;           // Menu expansion state
    let selectedItemKey = null;   // Currently selected item
    let useTapMode = 0;           // 1: The menu opens with a tap (touch device), not with hover.
    const itemList = [];          // Array to store menu items
    const itemElements = [];      // Array to store item UI elements
    const WIDTH = 40;             // Collapsed width (only the icons)
    const ICON_OPACITY = 0.6;     // The icon of an item that is not hovered or selected

    // *** PUBLIC VARIABLES:
    box.publicVar = 1;
    box.state = "collapsed";      // "collapsed", "expanded"

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    // The look of a button item: "normal", "hover" or "selected" (a gradient from the left)
    const paintButtonItem = function(buttonBox, look) {
        if (look === "normal") {
            buttonBox.css.background = "transparent";
            buttonBox.icon.opacity = ICON_OPACITY;
            buttonBox.textLabel.textColor = box.textColor;
            return;
        }
        const backColor = (look === "selected") ? box.selectedColor : box.hoverColor;
        buttonBox.css.background = `linear-gradient(to right, ${backColor} 0%, rgba(0,0,0,0) 100%)`;
        buttonBox.icon.opacity = 1;
        buttonBox.textLabel.textColor = box.selectedTextColor;
    };

    // Create a menu button item
    const createButtonItem = function(item) {

        const buttonBox = startBox({
            width: "100%",
            height: box.itemHeight,
            color: "transparent",
            clickable: 1,
            position: "relative",
        });
        buttonBox.setMotion("background-color 0.2s");
        buttonBox.cursor = "pointer";
        buttonBox.data = item;

            HGroup({
                align: "left center",
                gap: 20,
                padding: [8, 0],
            });

                // Icon
                buttonBox.icon = Icon({
                    width: 24,
                    height: 24,
                    color: "transparent",
                    opacity: ICON_OPACITY,
                });
                buttonBox.icon.load(item.iconFile);

                if (box.invertIconColor == 1) {
                    that.css.filter = "invert(100%)";
                }

                // Text label (hidden when collapsed)
                buttonBox.textLabel = Label({
                    textColor: box.textColor,
                    fontSize: 18,
                    color: "transparent",
                });
                setText(buttonBox.textLabel, item.text);

            endGroup();

        endBox();

        // Click handler
        buttonBox.on("click", function(self, event) {

            // WHY: The menu box also listens for the tap (to open itself). Without this, closing after a selection would open it again.
            if (event) event.stopPropagation();

            // WHY: Touch device, closed menu: only the icons are visible. The first tap opens the menu, it does not select.
            if (useTapMode && !isExpanded && box.openOnClick !== "direct") {
                expandMenu();
                return;
            }

            if (selectedItemKey != item.key) {
                if (!item.dontSelect) {
                    selectItem(item.key);
                }
                box.onItemClick(box, item);
            }

            // Touch device: the open menu must not stay over the page.
            if (useTapMode) collapseMenu();

        });

        // Hover effects
        buttonBox.on("mouseover", function() {
            if (useTapMode) return; // WHY: A touch also fires mouseover; the color would stay on the item.
            if (selectedItemKey != item.key) paintButtonItem(buttonBox, "hover");
        });

        buttonBox.on("mouseout", function() {
            if (useTapMode) return;
            if (selectedItemKey != item.key) paintButtonItem(buttonBox, "normal");
        });

        return buttonBox;
    };

    // Create a header item
    const createHeaderItem = function(item) {

        const headerBox = startBox({
            width: "100%",
            height: 29,
            color: "transparent",
            clickable: 1,
            position: "relative",
        });
        headerBox.data = item;

            // BOX: Line
            Box(0, 0, 100, 1, {
                color: box.titleColor,
            });
            that.top = 14;
            that.opacity = 0.50;

            AutoLayout({
                align: "left center",
                padding: [40, 0],
            });

                // Header text
                const headerText = Label({
                    textColor: box.titleColor,
                    fontSize: 12,
                    color: box.backgroundColor,
                    padding: [12, 0],
                });
                setText(headerText, item.text);
                headerText.css = { fontWeight: "bold", textTransform: "uppercase" };

            endAutoLayout();

        endBox();

        return headerBox;

    };

    box.clearSelection = function() {

        // The item selected before is not selected any more
        if (selectedItemKey) {
            const prev = itemElements.find(el => el.data.key === selectedItemKey);
            if (prev && prev.data.type === "button") {
                paintButtonItem(prev, "normal");
                prev.cursor = "pointer";
            }

            selectedItemKey = null;
        }

    }

    // Select an item (its look)
    const selectItem = function(itemKey) {

        // The item selected before is not selected any more
        box.clearSelection();

        // Select the new item
        const current = itemElements.find(el => el.data.key === itemKey);
        if (current && current.data.type === "button") {
            paintButtonItem(current, "selected");
            current.cursor = "default";

            selectedItemKey = itemKey;
        }

    };

    // Expand menu
    const expandMenu = function() {
        if (isExpanded) return;

        isExpanded = 1;
        box.state = "expanded";
        box.width = box.expandedWidth;
        paintShadow();

        box.onMenuToggle(box, 1);
    };

    // Collapse menu
    const collapseMenu = function() {
        if (!isExpanded) return;

        isExpanded = 0;
        box.state = "collapsed";
        box.width = WIDTH;
        paintShadow();

        box.onMenuToggle(box, 0);
    };

    // The shadow of the open menu over the page (expandedShadow)
    const paintShadow = function() {
        box.boxShadow = (isExpanded && box.expandedShadow) ? box.expandedShadow : "";
    };

    // Is this a touch device? (No mouse hover.)
    const isTouchDevice = function() {
        // WHY: "hover: none" is the real question (a tablet, a phone). basic.isMobile() is the fallback for old browsers.
        if (window.matchMedia && window.matchMedia("(hover: none)").matches) return 1;
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return 1;
        return basic.isMobile();
    };

    // Tap outside the menu: close it. (Only in tap mode)
    const onDocumentPointerDown = function(self, event) {
        if (!box || !useTapMode || !isExpanded) return;
        if (box.elem.contains(event.target)) return;
        collapseMenu();
    };

    // *** PUBLIC FUNCTIONS:

    // "auto": Tap on a touch device, hover with a mouse. 1: Always tap, 0: Always hover.
    box.setOpenOnClick = function(openOnClick) {
        box.openOnClick = openOnClick;
        if (openOnClick === "auto") {
            useTapMode = isTouchDevice();
        } else if (openOnClick === "direct") {
            useTapMode = 1;
        } else {
            useTapMode = basic.isOn(openOnClick) ? 1 : 0;
        }
        if (!useTapMode) collapseMenu(); // WHY: Hover mode starts closed; the mouse decides.
        return useTapMode;
    };
    // USAGE: leftMenu.setOpenOnClick(1) // Returns 1 if the menu opens with a tap.

    box.isTapMode = function() {
        return useTapMode;
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        // WHY: page.onResize() is not cleaned by box.remove(). (box.onPageResize() is a window resize: not the same time.)
        page.remove_onResize(resizeScrollableBox);

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // Add item to top of menu
    box.addItemToTop = function(item) {

        itemList.push(item);
        const element = item.type === "button" ? createButtonItem(item) : createHeaderItem(item);
        itemElements.push(element);

        // Add to UI at top using topBox
        box.topBox.add(element);

        return element;
    };

    // Add item to bottom of menu
    box.addItemToBottom = function(item) {

        itemList.push(item);
        const element = item.type === "button" ? createButtonItem(item) : createHeaderItem(item);
        itemElements.push(element);
        
        // Added at the bottom of the menu
        box.bottomBox.add(element);

        return element;

    };

    // Remove item by key
    box.removeItem = function(itemKey) {

        if (itemKey === selectedItemKey) box.clearSelection(); // The selected item is removed: the selection is cleared first.
        
        const index = itemList.findIndex(item => item.key === itemKey);
        if (index !== -1) {
            const element = itemElements[index];
            element.remove();
            itemList.splice(index, 1);
            itemElements.splice(index, 1);
        }

    };

    // Get selected item
    box.getSelectedItem = function() {
        return itemList.find(item => item.key === selectedItemKey);
    };

    // Set selected item
    box.setSelectedItem = function(itemKey) {
        selectItem(itemKey);
    };

    // Expand menu programmatically
    box.expand = function() {
        expandMenu();
    };

    // Collapse menu programmatically
    box.collapse = function() {
        collapseMenu();
    };

    // Toggle menu state
    box.toggle = function() {
        if (isExpanded) {
            collapseMenu();
        } else {
            expandMenu();
        }
    };

    // *** OBJECT VIEW:
    box.cursor = "default";
    box.color = box.backgroundColor;
    box.height = `calc(100% - ${box.topBarHeight}px)`;
    box.width = WIDTH;
    box.bottom = 0;
    box.left = 0;
    box.round = 0;

        const SPACE_BETWEEN = 30;
    
        box.scrollableBox = startBox(0, SPACE_BETWEEN, box.expandedWidth, 0);
        that.color = "transparent";
        that.scrollY = 1;

            box.topBox = VGroup({
                align: "top left",
                gap: 0,
                padding: 0,
                height: "auto",
                width: "100%",
            });
            that.position = "relative";

            // Add initial items
            box.items.forEach(item => {
                box.addItemToTop(item);
            });

            endGroup();

        endBox();

        // SCROLL BAR:
        box.scrollBar = ScrollBar({
            scrollableBox: box.scrollableBox,
            bar_border: 0,
            bar_round: 3,
            bar_borderColor: "rgba(0, 0, 0, 1)",
            bar_width: 4,
            bar_mouseOverWidth: 4,
            bar_mouseOverColor: box.scrollBarColor,
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
            bar_color: box.scrollBarColor,
            neverHide: 0,
            showDots: 1,
        });

        const resizeScrollableBox = function() {
            box.scrollableBox.height = box.height - (SPACE_BETWEEN * 2) - box.bottomBox.height - SPACE_BETWEEN;
        };

        // Menu container
        box.bottomBox = VGroup({
            align: "bottom left",
            gap: 0,
            padding: 0,
            height: "auto",
            width: box.expandedWidth,
        });
        that.bottom = SPACE_BETWEEN;
        that.left = 0;
        that.color = "transparent";
        box.bottomBox.onResize(function(self) {
            resizeScrollableBox();
        });

        page.onResize(resizeScrollableBox);

    endGroup();

    // BOX: The line at the right side (lineColor)
    // WHY a box made last (not a border of the menu): the colors of the selected item covered a line under them, and a
    //     border takes a px of the 40 px of the icons
    if (box.lineColor) {
        box.line = Box({ right: 0, top: 0, width: 1, height: "100%", color: box.lineColor });
    }

    // *** OBJECT INIT CODE:
    
    box.setOpenOnClick(box.openOnClick);

    // Hover events for expansion (mouse)
    box.on("mouseenter", function() {
        if (useTapMode) return;
        expandMenu();
    });

    box.on("mouseleave", function() {
        if (useTapMode) return;
        collapseMenu();
    });

    // Tap on the menu (also on an empty place of it): open it. (Touch device)
    box.on("click", function() {
        if (useTapMode && !isExpanded && box.openOnClick !== "direct") expandMenu();
    });

    // WHY: Capture, so it also works when the tap is stopped by another object. (Ex: a page that closes its own menu)
    box.listenTo(document, "pointerdown", onDocumentPointerDown, true); // NOTE: Removed by remove().

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: LeftMenu({ styleName: "light" })
// USAGE: LeftMenu({ styleName: "light", selectedColor: "#DCEBEC" }) // A param you give wins over the package.
// NOTE: Every package has "style: {}": the mark of a package of params (basic.js v26.10.27). A package needs only
//       the params that differ from LeftMenuDefaults (dark).
LeftMenu.styles = {

    // The look of LeftMenuDefaults: a dark menu with a red selection.
    dark: { style: {} },

    // For a light page: a light menu with a line at its right side and a soft shadow while it is
    // open over the page; the cyan of SmartButton (#5BBAC1) in light tones;
    // dark icons and a dark scroll bar.
    light: {
        style: {},
        backgroundColor: "#F7F7F5",
        hoverColor: Black(0.05),
        selectedColor: "#D1ECEE", // (#5BBAC1, 28 % on white)
        titleColor: "#3D8F96", // (a darker #5BBAC1: it reads on the light menu)
        textColor: Black(0.6),
        selectedTextColor: Black(0.88),
        invertIconColor: 0,
        lineColor: Black(0.08),
        expandedShadow: "6px 0 18px " + Black(0.08),
        scrollBarColor: "#373836",
    },

};
