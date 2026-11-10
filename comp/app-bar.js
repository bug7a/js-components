/* Bismillah */

/*

AppBar - v26.11

THE TOP BAR OF A TAB PAGE of a mobile app.
- The sizes are px of a 600 px design: the page is fitted with page.fit(600, 800), like the mobile template
  (04-templates/mobile-app-template/classic).
- A white bar, 105 px high. The title (28 px, bold) in the middle (titleAlign "center") or at the left ("left");
  a long title ends with "...". In the middle it keeps the same room at both sides, so it stays in the middle of
  the bar when only one button is shown.
- A back button at the left (showBack: 1) and a menu button at the right (showMenu: 1): 40 x 40, 20 px from the
  sides. The buttons and the title stand 24 px from the bottom of the bar.
- The buttons are SmartButtons (styleName "ozden4": a gray square under the mouse), with only an icon and an
  aria label: the keyboard and the screen readers work as with every SmartButton.
- The icons are drawn in SVG in iconColor (a back arrow with a shaft, three dots), or your own files
  (backIconFile, menuIconFile: a file keeps its own colors).
- line: 1 -> a 2 px soft line at the bottom. Its place is always there (a clear line when it is off), so the title
  and the buttons do not move when it changes.
- NEEDS: comp/smart-button.js, loaded before the bar is created.

USAGE:
const bar = AppBar({ titleText: "Settings", titleAlign: "left", line: 1, onMenu: function (self) { menu.open(); } });
AppBar({ titleText: "Details", showBack: 1, onBack: function (self) { App.goBack(); } });
AppBar({ titleText: "Green", color: "#5ABB9F", iconColor: "white", style: { title: { textColor: "white" } } });
bar.setTitleText("Tasks");
bar.setTitleAlign("center");
bar.setLine(0);
bar.setBackVisible(1);
bar.setMenuVisible(0);

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const AppBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0, // The bar stands at the top of its container (a page)
    top: 0,
    width: "100%",
    height: 105,
    color: "white", // The background of the bar
    titleText: "",
    titleAlign: "center", // "center" or "left" (set later with setTitleAlign)
    line: 0, // 1: a soft line at the bottom (setLine)
    showBack: 0, // 1: the back button at the left (setBackVisible)
    showMenu: 1, // 1: the menu button at the right (setMenuVisible)
    backIconFile: "", // "": a back arrow drawn in SVG (Ex: "assets/icons/back.svg")
    menuIconFile: "", // "": three dots drawn in SVG
    iconColor: Black(0.8), // The color of the drawn icons (a file keeps its own colors)
    backAriaLabel: "Back", // What a screen reader says for the buttons
    menuAriaLabel: "Menu",
    onBack: function (self) { },
    onMenu: function (self) { },
    style: {
        layout: {
            side: 20, // The space at the left and the right
            bottom: 24, // The buttons and the title stand this far from the bottom
            titleGap: 10, // The least space between a button and the title
            // WHY: the back arrow is in line with the title, at (side, bottom): in a 40 px button it stands that far only
            //      when the button goes 3 px to the left and down
            backShift: 3,
        },
        title: {
            fontSize: 28,
            bold: 1,
            textColor: Black(0.8),
        },
        button: {
            size: 40,
            iconSize: 34, // In the middle of the button
        },
        line: {
            width: 2,
            color: Black(0.1),
        },
    },
};

const AppBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, AppBarDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;

    // *** PRIVATE FUNCTIONS:

    // The room of a button with its gap to the title (0: the button is not shown)
    const getButtonRoom = function (isShown) {
        if (!isShown) return 0;
        return _s.button.size + _s.layout.titleGap;
    };

    // TITLE: at the left, or in the middle with the same room at both sides (so it is in the middle of the bar)
    const placeTitle = function () {
        const backRoom = getButtonRoom(box.showBack == 1);
        const menuRoom = getButtonRoom(box.showMenu == 1);
        const isLeft = (box.titleAlign == "left");
        const sideRoom = Math.max(backRoom, menuRoom);
        const leftSpace = _s.layout.side + (isLeft ? backRoom : sideRoom);
        const rightSpace = _s.layout.side + (isLeft ? menuRoom : sideRoom);
        box.lblTitle.left = leftSpace;
        box.lblTitle.width = "calc(100% - " + (leftSpace + rightSpace) + "px)";
        box.lblTitle.textAlign = box.titleAlign;
    };

    // WHY always a border: a clear line when it is off, so the title and the buttons stay at the same place
    const paintLine = function () {
        const lineColor = (box.line == 1) ? _s.line.color : "transparent";
        box.css = { borderBottom: _s.line.width + "px solid " + lineColor };
    };

    // BUTTON: only an icon, in the middle (place: { left, bottom } or { right, bottom })
    const createButton = function (iconFile, ariaLabel, onClick, place) {
        const iconSpace = (_s.button.size - _s.button.iconSize) / 2;
        const button = SmartButton({
            styleName: "ozden4",
            labelText: "",
            iconFile: iconFile,
            ariaLabel: ariaLabel,
            width: _s.button.size,
            height: _s.button.size,
            ...place,
            style: {
                layout: { padding: [iconSpace, iconSpace] },
                icon: { width: _s.button.iconSize, height: _s.button.iconSize, opacity: 1 },
            },
            onClick: onClick,
        });
        button.icon.alt = ""; // WHY: load() writes the file as the alt text (a drawn icon is a long data URI)
        return button;
    };

    // *** PUBLIC FUNCTIONS:

    box.setTitleText = function (text) {
        box.titleText = text;
        box.lblTitle.plainText = text;
    };
    // USAGE: bar.setTitleText("Settings")

    box.setTitleAlign = function (align) {
        box.titleAlign = (align == "left") ? "left" : "center";
        placeTitle();
    };
    // USAGE: get: bar.titleAlign, set: bar.setTitleAlign("left")

    box.setLine = function (value) {
        box.line = basic.isOn(value) ? 1 : 0;
        paintLine();
    };
    // USAGE: bar.setLine(1)

    box.setBackVisible = function (value) {
        box.showBack = basic.isOn(value) ? 1 : 0;
        box.btnBack.visible = box.showBack;
        placeTitle();
    };
    // USAGE: get: bar.showBack, set: bar.setBackVisible(1)

    box.setMenuVisible = function (value) {
        box.showMenu = basic.isOn(value) ? 1 : 0;
        box.btnMenu.visible = box.showMenu;
        placeTitle();
    };
    // USAGE: get: bar.showMenu, set: bar.setMenuVisible(0)

    // *** OBJECT VIEW:

    // BOX: Bar
    box.shrink = 0; // WHY: in a group with a fixed height the bar keeps its height
    paintLine();

    // LABEL: Title (placeTitle gives its left and its width)
    box.lblTitle = Label({ bottom: _s.layout.bottom, ..._s.title, ellipsis: 1 });
    box.lblTitle.role = "heading";
    box.lblTitle.aria = { level: 1 };

    // BUTTON: Back (left)
    const backIconFile = box.backIconFile || AppBar.toSvgFile(AppBar.drawBackArrow(box.iconColor));
    box.btnBack = createButton(backIconFile, box.backAriaLabel, function () {
        box.onBack(box);
    }, { left: _s.layout.side - _s.layout.backShift, bottom: _s.layout.bottom - _s.layout.backShift });

    // BUTTON: Menu (right)
    const menuIconFile = box.menuIconFile || AppBar.toSvgFile(AppBar.drawMenuDots(box.iconColor));
    box.btnMenu = createButton(menuIconFile, box.menuAriaLabel, function () {
        box.onMenu(box);
    }, { right: _s.layout.side, bottom: _s.layout.bottom });

    // *** OBJECT INIT CODE:

    box.setTitleText(box.titleText);
    box.setTitleAlign(box.titleAlign);
    box.setBackVisible(box.showBack);
    box.setMenuVisible(box.showMenu);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// An SVG text as a file for an Icon (a data URI)
AppBar.toSvgFile = function (svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

// A back arrow with a shaft (24 x 24)
AppBar.drawBackArrow = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H7.6M12 7l-5 5 5 5"/></svg>';
};

// Three dots one under the other (24 x 24)
AppBar.MENU_DOT_RADIUS = 2.5;
AppBar.MENU_DOT_PLACES = [2.5, 12, 21.5];
AppBar.drawMenuDots = function (color) {
    const dots = AppBar.MENU_DOT_PLACES.map(function (y) {
        return '<circle cx="12" cy="' + y + '" r="' + AppBar.MENU_DOT_RADIUS + '"/>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="' + color + '">' + dots.join("") + "</svg>";
};
