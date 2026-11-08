/* Bismillah */

/*

SettingsRow - v26.11

A ROW OF A SETTINGS PAGE of a mobile app.
- The sizes are px of a 600 px design: the page is fitted with page.fit(600, 800), like the mobile template
  (04-templates/mobile-app-template/classic).
- A white row, 100 px high, a thin line at the bottom. A title (20 px) at the left; with a small text (descriptionText,
  one line, "..." at its end) the title stands 14 px over the middle and the small text 14 px under it.
- setDescriptionText(text): the small text fades in or out and the title slides to its place (0.3 s; no motion at the
  first view, none with prefers-reduced-motion). The old text stays while it fades out.
- A control at the right: control: function (row) { Toggle({...}); } -> the objects made in it stand in a row at
  the right side, 20 px from the right, in the middle of the row (they need no left / top / right).
- arrow: 1 -> a chevron at the right (drawn in SVG), for a row that opens a page. Give that row an onClick: a row
  with onClick can be clicked (role "button"), Tab reaches it, Enter / Space press it (a focus ring only for the
  keyboard). A click on a control in the row is the control's own (it does not call onClick).
- titleColor: Ex: "orangered" for a row that deletes something.
- SettingsRow.createSection(titleText, params): the band between the groups of rows (Ex: "APPEARANCE").
- The rows go one under the other in a VGroup (in a box that scrolls: CLAUDE.md).

USAGE:
VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });
    SettingsRow.createSection("APPEARANCE");
    SettingsRow({ titleText: "Dark Mode", descriptionText: "Use interface colors inverted.", control: function (row) {
        Toggle({ width: 60, height: 40, onChange: function (self) { saveDarkMode(self.value); } });
    } });
    const videoRow = SettingsRow({ titleText: "Video Quality", descriptionText: "Remaining disk space: 2.3GB" });
    SettingsRow({ titleText: "Security", arrow: 1, onClick: function (self) { App.open("security"); } });
    SettingsRow({ titleText: "Delete All Downloads", titleColor: "orangered", arrow: 1, onClick: deleteDownloads });
endGroup();
videoRow.setDescriptionText("");          // the small text fades out, the title slides to the middle
videoRow.setTitleColor("orangered");

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SettingsRowDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: "100%",
    height: 100,
    color: "white", // The background of the row
    titleText: "",
    descriptionText: "", // The small text under the title. "": the title stands in the middle (setDescriptionText)
    titleColor: Black(0.8), // Ex: "orangered" for a row that deletes something (setTitleColor)
    control: null, // function (row): the objects made in it stand at the right (Ex: a Toggle). Its result: row.controlObject
    arrow: 0, // 1: a chevron at the right (a row that opens a page: give it onClick)
    onClick: null, // function (self, event): the row can be clicked (role "button", Enter / Space)
    style: {
        layout: {
            side: 20, // The space at the left and the right
            gap: 10, // Between the texts, the objects of the control and the arrow
            textShift: 14, // With a small text: the title goes up and the small text down by this much from the middle
        },
        title: {
            fontSize: 20,
        },
        desc: {
            fontSize: 18,
            textColor: Black(0.5),
        },
        arrow: {
            size: 36,
            color: Black(0.8),
        },
        line: {
            width: 1,
            color: Black(0.2),
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.6)", // The ring of the keyboard focus
        },
        motionTime: 0.3, // s: the small text fades, the title slides
    },
};

const SettingsRow = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SettingsRowDefaults);

    // Edit params, if needed:
    params.descriptionText = SettingsRow.toText(params.descriptionText);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const isClickable = (typeof box.onClick === "function");

    // *** PUBLIC VARIABLES:
    box.controlObject = null; // What control() returned (Ex: the Toggle), or null
    // NOTE: Default values are also public variables. (box.titleText, box.descriptionText...)

    // *** PRIVATE FUNCTIONS:

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    // The middle of the row moved by shift px (no measuring: the label is moved by its own half height)
    const getMiddleTransform = function (shift) {
        return "translateY(calc(-50% + " + shift + "px))";
    };

    // The small text fades in or out (its old text stays while it fades out), the title slides to its place.
    const showTexts = function () {
        const hasDesc = (box.descriptionText !== "");
        if (hasDesc) box.lblDesc.plainText = box.descriptionText;
        box.lblDesc.opacity = hasDesc ? 1 : 0;
        box.lblDesc.aria = { hidden: hasDesc ? null : true };
        const titleShift = hasDesc ? -_s.layout.textShift : 0;
        box.lblTitle.css = { transform: getMiddleTransform(titleShift) };
    };

    // WHY setMotion(): it starts a moment later, so the first view does not move
    const applyMotion = function () {
        if (isReducedMotion()) return;
        const time = _s.motionTime + "s";
        box.lblTitle.setMotion("transform " + time);
        box.lblDesc.setMotion("opacity " + time);
    };

    // The objects of control() go into their group at the right.
    // WHY no places: an object in a group is relative, and the "right: 20" of an object in a box would move it 20 px
    //     to the left; the group places them.
    const createControl = function () {
        if (typeof box.control !== "function") return;
        box.controlObject = createIn(box.controlGroup, function () {
            return box.control(box);
        }) || null;
        box.controlGroup.children.forEach(function (obj) {
            obj.css = { left: "", right: "", top: "", bottom: "" };
        });
    };

    // A click on a control in the row (a Toggle) is the control's own
    const isFromControl = function (event) {
        return box.controlGroup.elem.contains(event.target);
    };

    const press = function (event) {
        box.onClick(box, event);
    };

    // A row with onClick: the mouse, Tab and Enter / Space
    const makeClickable = function () {
        box.clickable = 1;
        box.cursor = "pointer";
        box.role = "button";
        box.tabIndex = 0;
        box.setFocusRing(_s.focus.ringColor);
        box.on("click", function (self, event) {
            if (isFromControl(event)) return;
            press(event);
        });
        box.on("keydown", function (self, event) {
            if (event.target !== box.elem) return; // WHY: the keys of a control in the row stay its own
            if (event.key != "Enter" && event.key != " ") return;
            event.preventDefault(); // WHY: Space must not scroll the page
            if (event.repeat) return; // WHY: a held key presses once
            press(event);
        });
    };

    // *** PUBLIC FUNCTIONS:

    box.setTitleText = function (text) {
        box.titleText = text;
        box.lblTitle.plainText = text;
    };
    // USAGE: row.setTitleText("Dark Mode")

    // The small text fades in / out and the title slides (0.3 s)
    box.setDescriptionText = function (text) {
        box.descriptionText = SettingsRow.toText(text);
        showTexts();
    };
    // USAGE: get: row.descriptionText, set: row.setDescriptionText("Remaining disk space: 2.3GB") / row.setDescriptionText("")

    box.setTitleColor = function (color) {
        box.titleColor = color;
        box.lblTitle.textColor = color;
    };
    // USAGE: row.setTitleColor("orangered")

    // *** OBJECT VIEW:

    // BOX: Row
    box.shrink = 0; // WHY: in a group with a fixed height the rows keep their height (the box scrolls)
    box.css = { borderBottom: _s.line.width + "px solid " + _s.line.color };

    // GROUP: Layout (the texts take the free room; the control and the arrow stand at the right)
    box.layout = HGroup({ width: "100%", height: "100%", align: "left center", gap: _s.layout.gap, padding: [_s.layout.side, 0] });

        // BOX: Texts (the title and the small text around the middle of the row)
        box.texts = startBox({ height: "100%", color: "transparent" });
        box.texts.css = { flex: "1 1 0", minWidth: "0px" }; // WHY: it takes the free room, its texts end with "..."

            // LABEL: Title
            box.lblTitle = Label({ left: 0, top: "50%", width: "100%", ..._s.title, textColor: box.titleColor, ellipsis: 1 });

            // LABEL: Small text (one line)
            box.lblDesc = Label({ left: 0, top: "50%", width: "100%", ..._s.desc, ellipsis: 1 });
            box.lblDesc.css = { transform: getMiddleTransform(_s.layout.textShift) };

        endBox();

        // GROUP: The objects of control() (createControl)
        box.controlGroup = HGroup({ width: "auto", height: "100%", align: "right center", gap: _s.layout.gap });
        endGroup();

        // ICON: Arrow
        if (box.arrow == 1) {
            box.icoArrow = Icon({ width: _s.arrow.size, height: _s.arrow.size, alt: "" });
            box.icoArrow.load(SettingsRow.toSvgFile(SettingsRow.drawChevron(_s.arrow.color)));
        }

    endGroup();

    // *** OBJECT INIT CODE:

    createControl();
    // WHY after its objects: an object made in a hidden group is not a flex item
    box.controlGroup.visible = (box.controlGroup.children.length > 0) ? 1 : 0;

    if (isClickable) makeClickable();

    box.setTitleText(box.titleText);
    showTexts();
    applyMotion();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

// "" for null / undefined, else the value as a text
SettingsRow.toText = function (value) {
    return (value === null || value === undefined) ? "" : String(value);
};

// An SVG text as a file for an Icon (a data URI)
SettingsRow.toSvgFile = function (svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
};

// A chevron to the right (24 x 24)
SettingsRow.drawChevron = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.6 6l6 6-6 6"/></svg>';
};

// THE SECTION: the band between the groups of rows. Its look (params over these; Ex: { color: "white" }):
SettingsRow.sectionDefaults = {
    width: "100%",
    height: 90,
    color: "whitesmoke",
    style: {
        title: { left: 20, top: 50, fontSize: 18, bold: 1, textColor: Black(0.8) },
        line: { width: 3, color: Black(0.1) },
    },
};

// Returns the band (band.lblTitle is its title).
SettingsRow.createSection = function (titleText, params = {}) {

    // WHY a new object: the params of the page and sectionDefaults are not changed by the merge
    const sectionParams = { titleText: titleText };
    mergeIntoIfMissing(sectionParams, params);
    mergeIntoIfMissing(sectionParams, SettingsRow.sectionDefaults);

    // BOX: Band
    const section = startObject(sectionParams);
    section.shrink = 0; // WHY: in a group with a fixed height the band keeps its height
    const _s = section.style;
    section.css = { borderBottom: _s.line.width + "px solid " + _s.line.color };

        // LABEL: Title
        section.lblTitle = Label({ ..._s.title, plainText: section.titleText });
        section.lblTitle.role = "heading";
        section.lblTitle.aria = { level: 2 };

    return endObject(section);

};
// USAGE: SettingsRow.createSection("APPEARANCE")
