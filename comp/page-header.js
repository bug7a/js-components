/* Bismillah */

/*

PageHeader - v26.11

THE HEADER OF A PAGE THAT SLIDES IN OVER THE TABS of a mobile app.
- The sizes are px of a 600 px design: the page is fitted with page.fit(600, 800), like the mobile template
  (04-templates/mobile-app-template/classic).
- A white header, 105 px high, a thin soft line at the bottom.
- A small back link at the top left: a chevron and a text ("Back", or the name of the page under it: "Settings"),
  in a soft blue. It can be clicked (a bigger place than it looks, for a finger), Tab reaches it, Enter / Space
  press it (role "button", a focus ring only for the keyboard).
- A big title (28 px, bold) under it, at the left; a long title ends with "...".
- The chevron is drawn in SVG in backColor, or your own file (backIconFile).

USAGE:
const header = PageHeader({ titleText: "Security", backText: "Settings", onBack: function (self) { App.goBack(); } });
header.setTitleText("Privacy");
header.setBackText("Back");
header.setBackVisible(0);
PageHeader({ titleText: "Details", backColor: "indianred", color: "whitesmoke" });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const PageHeaderDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0, // The header stands at the top of its container (a page)
    top: 0,
    width: "100%",
    height: 105,
    color: "white", // The background of the header
    titleText: "",
    backText: "Back", // The text of the back link (Ex: the name of the page it goes back to)
    showBack: 1, // 1: the back link over the title (setBackVisible)
    backColor: "#689BD2", // The drawn chevron and the text of the back link
    backIconFile: "", // "": a chevron drawn in SVG in backColor
    onBack: function (self) { }, // The back link is clicked (or pressed with Enter / Space)
    style: {
        layout: {
            side: 20, // The space at the left and the right
            backTop: 24, // The back link stands this far from the top
            titleBottom: 24, // The title stands this far from the bottom
        },
        back: {
            iconSize: 20,
            fontSize: 14,
            gap: 3, // Between the chevron and the text
            tapSpace: 8, // A clear space around the link: a bigger place to click (the link does not move)
            round: 4, // The corners of the focus ring
        },
        title: {
            fontSize: 28,
            bold: 1,
            textColor: Black(0.8),
        },
        line: {
            width: 1,
            color: Black(0.1),
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.6)", // The ring of the keyboard focus
        },
    },
};

const PageHeader = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PageHeaderDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;

    // *** PRIVATE FUNCTIONS:

    const goBack = function () {
        box.onBack(box);
    };

    // *** PUBLIC FUNCTIONS:

    box.setTitleText = function (text) {
        box.titleText = text;
        box.lblTitle.plainText = text;
    };
    // USAGE: header.setTitleText("Security")

    box.setBackText = function (text) {
        box.backText = text;
        box.lblBack.plainText = text;
        box.btnBack.aria = { label: String(text) };
    };
    // USAGE: header.setBackText("Settings")

    box.setBackVisible = function (value) {
        box.showBack = basic.isOn(value) ? 1 : 0;
        box.btnBack.visible = box.showBack;
    };
    // USAGE: get: header.showBack, set: header.setBackVisible(0)

    // *** OBJECT VIEW:

    // BOX: Header
    box.shrink = 0; // WHY: in a group with a fixed height the header keeps its height
    box.css = { borderBottom: _s.line.width + "px solid " + _s.line.color };

    // GROUP: Back link (the chevron and the text)
    // WHY tapSpace: the group is bigger than the link by a clear padding, the link stays at (side, backTop)
    const _b = _s.back;
    box.btnBack = HGroup({
        left: _s.layout.side - _b.tapSpace,
        top: _s.layout.backTop - _b.tapSpace,
        hug: 1,
        padding: _b.tapSpace,
        gap: _b.gap,
        align: "left center",
        round: _b.round,
        clickable: 1,
        cursor: "pointer",
        role: "button",
        tabIndex: 0,
    });

        // ICON: Chevron
        box.icoBack = Icon({ width: _b.iconSize, height: _b.iconSize, alt: "" });
        box.icoBack.load(box.backIconFile || PageHeader.toSvgFile(PageHeader.drawChevron(box.backColor)));

        // LABEL: Back text
        box.lblBack = Label({ fontSize: _b.fontSize, textColor: box.backColor });
        box.lblBack.css = { whiteSpace: "nowrap" };

    endGroup();

    // LABEL: Title
    box.lblTitle = Label({
        left: _s.layout.side,
        bottom: _s.layout.titleBottom,
        width: "calc(100% - " + (_s.layout.side * 2) + "px)",
        ..._s.title,
        ellipsis: 1,
    });
    box.lblTitle.role = "heading";
    box.lblTitle.aria = { level: 1 };

    // *** OBJECT INIT CODE:

    box.btnBack.setFocusRing(_s.focus.ringColor);
    box.btnBack.on("click", goBack);

    // KEYBOARD: Enter / Space press the back link
    box.btnBack.on("keydown", function (self, event) {
        if (event.key != "Enter" && event.key != " ") return;
        event.preventDefault(); // WHY: Space must not scroll the page
        if (event.repeat) return; // WHY: a held key goes back once
        goBack();
    });

    box.setTitleText(box.titleText);
    box.setBackText(box.backText);
    box.setBackVisible(box.showBack);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// An SVG text as a file for an Icon (a data URI)
PageHeader.toSvgFile = function (svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

// A chevron to the left (24 x 24)
PageHeader.drawChevron = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 6L8.9 12l5.7 6"/></svg>';
};
