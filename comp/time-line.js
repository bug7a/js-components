/* Bismillah */

/*

Time Line - v26.09

UI COMPONENT TEMPLATE
- A simple vertical time line: a dot for every item and a line between the dots.
- An item has a time, a text and a description. All of them are optional.
- The component grows with its items (height is always "auto"). Put it in a scrolling
  Box or in a VGroup for a long list.
- Every color, size and space is in the style object. Nothing else is needed: no image
  files, no other component.
- What happened, and when: a history that grows (addItem). For the steps of a job and the step of now: StepBar.
- Style packages: "light" (default), "dark", "minimal", "minimalDark". Select with styleName (TimeLine.styles), or
  later with setTheme(). minimal and minimalDark also give the sizes (dotSize, lineWidth, itemGap) the page does not give.

ITEM: { time, text, description, color, key, data } (style.title and style.description are the look of the two texts)
- A string is also accepted: "Order created" -> { text: "Order created" }
- color: The color of the dot of that item. (Empty: style.dot.color)
- key and data are not shown. They come back in onClick.

USAGE:
const timeLine = TimeLine({
    width: 320,
    items: [
        { time: "09:30", text: "Order created", description: "Order #1024 was created." },
        { time: "11:00", text: "Packed", color: "#E0A038" },
    ],
    clickableItems: 1,
    onClick: function (self, item, index) { println(item.text); },
});
timeLine.addItem({ time: "14:20", text: "Sent" });
timeLine.setItems([]);
TimeLine({ styleName: "dark", items: ["Order created", "Packed"] }); // On a dark page
timeLine.setTheme("minimal");

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const TimeLineDefaults = {
    key: "0",
    width: 320, // A number or "100%". (The height always grows with the items.)
    items: [], // [{ time, text, description, color, key, data }] or ["Order created"]
    itemGap: 20, // Space between two items. (The line is drawn in it.)
    dotSize: 12,
    lineWidth: 2,
    showLine: 1, // 0: Only the dots.
    clickableItems: 0, // 1: An item can be clicked. (onClick)
    enabled: 1,
    onClick: function (self, item, index) { },
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to TimeLine.styles
    style: { // Light style package (default)
        row: {
            gap: 12, // Space between the dots and the texts
        },
        dot: {
            color: "#3871E0",
            border: 0,
            borderColor: White(1),
            topSpace: 4, // WHY: The dot looks better in the middle of the first text line.
        },
        line: {
            color: Black(0.12),
        },
        time: {
            fontSize: 12,
            textColor: Black(0.54), // WHY: 4.5:1 on white, as WCAG asks of a text
        },
        title: {
            fontSize: 15,
            textColor: Black(0.85),
            bold: 1,
        },
        description: {
            fontSize: 14,
            textColor: Black(0.55),
            lineHeight: "1.45",
        },
        hover: {
            opacity: 0.6, // Mouse over an item. (clickableItems: 1)
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const TimeLine = function (params = {}) {

    // Merge style package: params.style > TimeLine.styles[styleName] > TimeLineDefaults.style (light)
    const pageParams = Object.assign({}, params); // WHY: setTheme() puts what the page gave over another package.
    basic.applyStylePackage(params, TimeLine.styles, TimeLineDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TimeLineDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.height = "auto"; // WHY: The component is as tall as its items.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const TEXT_GAP = 2; // Space between the time, the text and the description
    const HOVER_MOTION = "opacity 0.15s";
    let rows = []; // Created item rows

    // *** PUBLIC VARIABLES:
    // [var] Items: [{ time, text, description, color, key, data }]
    box.items = [];

    // *** PRIVATE FUNCTIONS:

    // The params of a package (its style, and the sizes of a package of params), with what the page gave over them.
    const paramsOfPackage = function (styleName) {
        const fresh = Object.assign({}, pageParams, { styleName: styleName });
        basic.applyStylePackage(fresh, TimeLine.styles, TimeLineDefaults);
        mergeIntoIfMissing(fresh, TimeLineDefaults);
        return fresh;
    };

    const normalizeItem = function (item) {
        if (typeof item == "string" || typeof item == "number") {
            return { time: "", text: String(item), description: "" }; // WHY: an undefined time made an empty label; its gap moved the text.
        }
        return Object.assign({ time: "", text: "", description: "" }, item);
    };

    // A row: the rail (dot + line) and the texts next to it.
    const createRow = function (item, index) {

        const isLast = (index == box.items.length - 1);

        // GROUP: Item row
        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: _s.row.gap,
        });

            // GROUP: Rail (dot + line)
            // WHY: alignSelf "stretch" makes it as tall as the row. So the line can grow
            //      until the dot of the next item, through the space under the texts.
            row.rail = VGroup({
                width: box.dotSize,
                height: "auto",
                align: "center top",
                gap: 0,
                shrink: 0,
                css: { alignSelf: "stretch" },
            });

                // BOX: Dot
                row.dot = Box({
                    width: box.dotSize,
                    height: box.dotSize,
                    round: 100,
                    color: item.color || _s.dot.color,
                    border: _s.dot.border,
                    borderColor: _s.dot.borderColor,
                    shrink: 0,
                    css: { marginTop: _s.dot.topSpace + "px" },
                });

                // BOX: Line to the next dot. (grow: 1 = the rest of the row)
                if (box.showLine == 1 && !isLast) {
                    row.line = Box({
                        width: box.lineWidth,
                        height: 0,
                        color: _s.line.color,
                        grow: 1,
                    });
                }

            endGroup();

            // GROUP: Texts
            // WHY: The space between the items is the bottom margin of the texts, not the gap of
            //      the list. A gap would cut the line.
            row.content = VGroup({
                width: "auto",
                height: "auto",
                align: "left top",
                gap: TEXT_GAP,
                grow: 1,
                css: { minWidth: "0", marginBottom: (isLast) ? "0px" : box.itemGap + "px" },
            });

                // LABEL: Time
                if (item.time !== "") {
                    row.lblTime = Label({
                        width: "100%",
                        plainText: item.time, // WHY: plainText, not text. An item text is not HTML.
                        fontSize: _s.time.fontSize,
                        textColor: _s.time.textColor,
                    });
                }

                // LABEL: Title
                if (item.text !== "") {
                    row.lblTitle = Label({
                        width: "100%",
                        plainText: item.text,
                        fontSize: _s.title.fontSize,
                        textColor: _s.title.textColor,
                        bold: _s.title.bold,
                    });
                }

                // LABEL: Description
                if (item.description !== "") {
                    row.lblText = Label({ // WHY: not row.text. Box.text writes innerHTML.
                        width: "100%",
                        plainText: item.description,
                        fontSize: _s.description.fontSize,
                        textColor: _s.description.textColor,
                        lineHeight: _s.description.lineHeight,
                    });
                }

            endGroup();

        endGroup();

        if (box.clickableItems == 1) makeRowClickable(row, item, index);

        return row;

    };

    const makeRowClickable = function (row, item, index) {

        row.clickable = 1;
        row.cursor = "pointer";
        row.setMotion(HOVER_MOTION);

        row.on("click", function (self, event) {
            if (box.enabled != 1) return;
            box.onClick(box, item, index, event);
        });
        row.on("mouseover", function () {
            if (box.enabled != 1) return;
            row.opacity = _s.hover.opacity;
        });
        row.on("mouseout", function () {
            row.opacity = 1;
        });

    };

    const removeRows = function () {
        rows.forEach(function (row) { row.remove(); });
        rows = [];
    };

    const drawAll = function () {

        removeRows();

        createIn(box.content, function () {

            box.items.forEach(function (item, index) {
                // WHY: endGroup() (in createRow) sets the container to the last started group, not to
                //      box.content. While the page is still being created, that is another box.
                setDefaultContainerBox(box.content);
                rows.push(createRow(item, index));
            });

        });

        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;

    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        box.items = (items || []).map(normalizeItem);
        drawAll();
    };
    // USAGE: timeLine.setItems([{ time: "09:30", text: "Order created" }, "Packed"])

    box.getItems = function () {
        return box.items.slice();
    };

    // Add a new item to the end of the line.
    box.addItem = function (item) {
        box.items.push(normalizeItem(item));
        drawAll();
    };
    // USAGE: timeLine.addItem({ time: "14:20", text: "Sent" })

    box.clear = function () {
        box.setItems([]);
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        drawAll(); // WHY: The cursor and the click of every row change.
    };
    // USAGE: get: timeLine.enabled, set: timeLine.setEnabled(0)

    box.refresh = function () {
        drawAll();
    };

    // Another style package while it is on the page. What the page gave (its style, a dotSize) stays over it.
    box.setTheme = function (styleName) {
        const fresh = paramsOfPackage(styleName);
        box.styleName = styleName;
        box.style = fresh.style;
        _s = fresh.style;
        box.dotSize = fresh.dotSize;
        box.lineWidth = fresh.lineWidth;
        box.itemGap = fresh.itemGap;
        drawAll();
    };
    // USAGE: timeLine.setTheme("dark")

    // *** OBJECT VIEW:

    box.role = "list";

    // GROUP: The item rows (created by drawAll)
    box.content = VGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: 0, // WHY: The space between the items is the bottom margin of the texts. (See createRow)
        position: "relative", // WHY: Component height is "auto". A relative group makes the container wrap it.
    });

    endGroup();

    // *** OBJECT INIT CODE:

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    box.setItems(params.items); // WHY: Copy the array. The default [] must not be shared between components.

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: TimeLine({ styleName: "dark" })
// USAGE: TimeLine({ styleName: "dark", style: { dot: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
TimeLine.styles = {

    // Blue dots on a light page.
    light: TimeLineDefaults.style,

    // For a dark page: a lighter blue, light texts. borderColor: the ring of a dot with a border, in the color of the page.
    dark: {
        dot: { color: "#6C98EF", borderColor: "#1A1A19" },
        line: { color: White(0.16) },
        time: { textColor: White(0.5) },
        title: { textColor: White(0.88) },
        description: { textColor: White(0.6) },
    },

};

// The minimal theme (_designs/minimal-theme.htm): small ink dots on a 1 px line, a 13 px title of the normal weight and
// 12 px texts. A package of params: it gives the sizes too, when the page does not give them. minimalDark: on a dark window.
TimeLine.createMinimalStyle = function (palette) {
    return {
        dotSize: 7, // WHY odd: the 1 px line in the middle of the dot stays on a whole pixel.
        lineWidth: 1,
        itemGap: 16,
        style: {
            row: { gap: 10 },
            dot: { color: palette.ink, borderColor: palette.ground, topSpace: 5 },
            line: { color: palette.line },
            time: { fontSize: 11, textColor: palette.softText },
            title: { fontSize: 13, textColor: palette.text, bold: 0 },
            description: { fontSize: 12, textColor: palette.softText },
        },
    };
};
TimeLine.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), line: Black(0.2), ink: "#1F1F1F" };
TimeLine.styles.minimal = TimeLine.createMinimalStyle(TimeLine.MINIMAL_COLORS);
TimeLine.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), line: White(0.18), ink: "#EDEDEB" };
TimeLine.styles.minimalDark = TimeLine.createMinimalStyle(TimeLine.MINIMAL_DARK_COLORS);
