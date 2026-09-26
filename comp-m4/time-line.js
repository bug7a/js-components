/* Bismillah */

/*

Time Line - v26.09

UI COMPONENT TEMPLATE
- A simple vertical time line: a dot for every item and a line between the dots.
- An item has a time, a title and a text. All of them are optional.
- The component grows with its items (height is always "auto"). Put it in a scrolling
  Box or in a VGroup for a long list.
- Every color, size and space is in the style object. Nothing else is needed: no image
  files, no other component.

ITEM: { time, title, text, color, key, data }
- A string is also accepted: "Order created" -> { title: "Order created" }
- color: The color of the dot of that item. (Empty: style.dot.color)
- key and data are not shown. They come back in onClick.

USAGE:
const timeLine = TimeLine({
    width: 320,
    items: [
        { time: "09:30", title: "Order created", text: "Order #1024 was created." },
        { time: "11:00", title: "Packed", color: "#E0A038" },
    ],
    clickableItems: 1,
    onClick: function (self, item, index) { println(item.title); },
});
timeLine.addItem({ time: "14:20", title: "Sent" });
timeLine.setItems([]);

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TimeLineDefaults = {
    key: "0",
    width: 320, // A number or "100%". (The height always grows with the items.)
    items: [], // [{ time, title, text, color, key, data }] or ["Order created"]
    itemGap: 20, // Space between two items. (The line is drawn in it.)
    dotSize: 12,
    lineWidth: 2,
    showLine: 1, // 0: Only the dots.
    clickableItems: 0, // 1: An item can be clicked. (onClick)
    enabled: 1,
    onClick: function (self, item, index) { },
    style: {
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
            textColor: Black(0.4),
        },
        title: {
            fontSize: 15,
            textColor: Black(0.85),
            bold: 1,
        },
        text: {
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

    // Merge params:
    mergeIntoIfMissing(params, TimeLineDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.height = "auto"; // WHY: The component is as tall as its items.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let rows = []; // Created item rows

    // *** PUBLIC VARIABLES:
    // [var] Items: [{ time, title, text, color, key, data }]
    box.items = [];

    // *** PRIVATE FUNCTIONS:

    const normalizeItem = function (item) {
        if (typeof item == "string" || typeof item == "number") {
            return { title: String(item) };
        }
        return Object.assign({ time: "", title: "", text: "" }, item);
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
                css: { alignSelf: "stretch", flexShrink: "0" },
            });

                // BOX: Dot
                row.dot = Box({
                    width: box.dotSize,
                    height: box.dotSize,
                    round: 100,
                    color: item.color || _s.dot.color,
                    border: _s.dot.border,
                    borderColor: _s.dot.borderColor,
                    css: { flexShrink: "0", marginTop: _s.dot.topSpace + "px" },
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
                gap: 2,
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
                if (item.title !== "") {
                    row.lblTitle = Label({
                        width: "100%",
                        plainText: item.title,
                        fontSize: _s.title.fontSize,
                        textColor: _s.title.textColor,
                        bold: _s.title.bold,
                    });
                }

                // LABEL: Text
                if (item.text !== "") {
                    row.lblText = Label({ // WHY: not row.text. Box.text writes innerHTML.
                        width: "100%",
                        plainText: item.text,
                        fontSize: _s.text.fontSize,
                        textColor: _s.text.textColor,
                        lineHeight: _s.text.lineHeight,
                    });
                }

            endGroup();

        endGroup();

        if (box.clickableItems == 1) {

            row.clickable = 1;
            row.cursor = "pointer";
            row.setMotion("opacity 0.15s");

            row.on("click", function (self, event) {
                if (box.enabled == 1) box.onClick(box, item, index, event);
            });
            row.on("mouseover", function () {
                if (box.enabled == 1) row.opacity = _s.hover.opacity;
            });
            row.on("mouseout", function () {
                row.opacity = 1;
            });

        }

        return row;

    };

    const render = function () {

        rows.forEach(function (row) { row.remove(); });
        rows = [];

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
        render();
    };
    // USAGE: timeLine.setItems([{ time: "09:30", title: "Order created" }, "Packed"])

    box.getItems = function () {
        return box.items.slice();
    };

    // Add a new item to the end of the line.
    box.addItem = function (item) {
        box.items.push(normalizeItem(item));
        render();
    };
    // USAGE: timeLine.addItem({ time: "14:20", title: "Sent" })

    box.clear = function () {
        box.setItems([]);
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        render(); // WHY: The cursor and the click of every row change.
    };
    // USAGE: get: timeLine.enabled, set: timeLine.setEnabled(0)

    box.refresh = function () {
        render();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };
    // USAGE: timeLine.remove();

    // *** OBJECT VIEW:

    box.elem.setAttribute("role", "list");

    // GROUP: The item rows (created by render)
    box.content = VGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: 0, // WHY: The space between the items is the bottom margin of the texts. (See createRow)
        position: "relative", // WHY: Component height is "auto". A relative group makes the container wrap it.
    });

    endGroup();

    // *** OBJECT INIT CODE:

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    box.setItems(params.items); // WHY: Copy the array. The default [] must not be shared between components.

    return endObject(box);

};
