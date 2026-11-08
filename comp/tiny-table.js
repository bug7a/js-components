/* Bismillah */

/*

Tiny Table - v26.10

A light table for short lists: a colored title row, one line rows (a long text ends with "..."), a soft color under
the mouse.
WHEN TO USE IT: a small table between the lines of a page, like a table in a text, for small
data that needs nothing more: it has no sorting, no search and no selection. A table with them: comp/data-table.js
(DataTable); very big data: comp/smart-table.js (SmartTable).
- columns: [{ title, width, align }]; rows: [["1", "404", "Not found"], ...]. The texts are plain text;
  allowHtml: 1 lets them be HTML (Ex: <b>bold</b>), only for texts of your own code, never for user input.
- bodyHeight: "auto" (as high as the rows) or a number: the rows scroll (basic/scroll-bar.js ScrollBar when loaded).
- A text that does not fit ends with "..." and slides under the mouse (comp/scrolling-text.js ScrollingText,
  mode "hover"; load it first. Without it: only "..."). The text of a cell or a title is cell.label.
- onCellCreate(cell, self): change a cell when it is made (cell.rowIndex, cell.columnIndex, cell.value, cell.label).
- onRowClick(self, rowIndex): a click on a row.
- setRows(rows): new rows (the cells are made again).
- Style packages: "classic" (default), "light", "dark". (TinyTable.styles)

USAGE:
TinyTable({
    columns: [{ title: "ID", width: 50, align: "center" }, { title: "VALUE", width: 80 }, { title: "DESCRIPTION", width: 380 }],
    rows: [["1", "404", "HTTP status code for Not Found"], ["2", "null", "The absence of a value"]],
    style: { header: { color: "indianred" } },
});

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const TinyTableDefaults = {
    width: "auto", // As wide as the columns
    height: "auto",
    columns: [], // [{ title, width (px), align: "left" | "center" | "right" }]
    rows: [], // [["text", "text", ...], ...]
    bodyHeight: "auto", // "auto" or a number: the rows scroll
    allowHtml: 0, // 1: the titles and the cells are HTML (only for your own texts)
    onCellCreate: function (cell, self) {}, // cell.rowIndex, cell.columnIndex, cell.value, cell.label (Ex: cell.label.bold = 1)
    onRowClick: function (self, rowIndex) {},
    styleName: "classic", // "classic", "light", "dark" or a name added to TinyTable.styles
    style: { // Classic style package (default)
        box: { color: "white", border: 2, borderColor: "#141414", round: 4 },
        header: { color: "#141414", lineColor: "#141414", textColor: "white", fontSize: 18, padding: [8, 8] },
        body: { color: "white", paddingY: 10 },
        cell: { textColor: "rgba(0, 0, 0, 0.9)", fontSize: 16, padding: [8, 4] },
        rowHover: { color: "whitesmoke", lineColor: "rgba(0, 0, 0, 0.2)" },
        scrollBar: { neverHide: 0, showDots: 0 },
    },
};

const TinyTable = function (params = {}) {

    // Merge style package: params.style > TinyTable.styles[styleName] > TinyTableDefaults.style (classic)
    basic.applyStylePackage(params, TinyTable.styles, TinyTableDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TinyTableDefaults);

    // Edit params: copies, the caller's lists do not change
    params.columns = Array.isArray(params.columns) ? params.columns.slice() : [];
    params.rows = Array.isArray(params.rows) ? params.rows.slice() : [];

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const LINE_WIDTH = 1; // between two titles / two cells
    const isScrolling = (params.bodyHeight !== "auto");

    // *** PUBLIC VARIABLES:
    box.rowList = []; // The row groups (row.cells: the labels)

    // *** PRIVATE FUNCTIONS:

    const toText = function (value) {
        return (value === undefined || value === null) ? "" : String(value);
    };

    // A text of a cell or a title. A text that does not fit: "..." and it slides under the mouse (ScrollingText).
    // The text itself is item.label (the same with a plain Label).
    const createTextItem = function (value, width, look, align) {

        if (typeof ScrollingText !== "undefined") {
            const item = ScrollingText({
                width: width,
                labelText: toText(value),
                allowHtml: box.allowHtml,
                mode: "hover",
                style: {
                    box: { color: look.color || "transparent", padding: look.padding },
                    label: { fontSize: look.fontSize, textColor: look.textColor, textAlign: align },
                },
            });
            item.shrink = 0;
            return item;
        }

        const label = Label({
            width: width,
            padding: look.padding,
            color: look.color || "transparent",
            textColor: look.textColor,
            fontSize: look.fontSize,
            textAlign: align,
            ellipsis: 1,
            shrink: 0,
        });
        if (box.allowHtml == 1) label.text = toText(value);
        else label.plainText = toText(value);
        label.label = label;
        return label;

    };

    const getColumnWidth = function (index) {
        const column = box.columns[index];
        return (column && column.width) ? column.width : "auto";
    };

    // One cell of a row. Its container must be set.
    const createCell = function (value, rowIndex, columnIndex) {
        const column = box.columns[columnIndex] || {};
        const cell = createTextItem(value, getColumnWidth(columnIndex), _s.cell, column.align || "left");
        cell.rowIndex = rowIndex;
        cell.columnIndex = columnIndex;
        cell.value = value;
        box.onCellCreate(cell, box);
        if (cell.refresh) cell.refresh(); // WHY: onCellCreate may change the width of the text (Ex: bold)
        return cell;
    };

    // GROUP: One row. Its container must be set.
    const createRow = function (data, rowIndex) {

        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: LINE_WIDTH,
            color: "transparent",
            clickable: 1,
            cursor: "pointer",
            role: "row",
        });
        row.rowIndex = rowIndex;
        row.cells = [];

            (Array.isArray(data) ? data : []).forEach(function (value, columnIndex) {
                row.cells.push(createCell(value, rowIndex, columnIndex));
            });

        endGroup();

        row.onHoverChange(function (self, isOver) {
            paintRow(row, isOver);
        });
        row.on("click", function () {
            box.onRowClick(box, rowIndex);
        });

        return row;

    };

    // Under the mouse: a soft color and a thin line over and under the row (box-shadow: the rows do not move)
    const paintRow = function (row, isOver) {
        const line = _s.rowHover.lineColor;
        row.color = isOver ? _s.rowHover.color : "transparent";
        row.boxShadow = isOver ? "inset 0 " + LINE_WIDTH + "px 0 " + line + ", inset 0 -" + LINE_WIDTH + "px 0 " + line : "none";
    };

    const createRows = function () {
        box.rowList.forEach(function (row) { row.remove(); });
        box.rowList = createIn(box.rowsGroup, function () {
            return box.rows.map(createRow);
        });
    };

    // *** PUBLIC FUNCTIONS:

    box.setRows = function (rows) {
        if (box._isRemoved) return; // WHY: a removed table must not get new rows (their observers stay)
        box.rows = Array.isArray(rows) ? rows.slice() : [];
        createRows();
    };
    // USAGE: table.setRows([["1", "A"], ["2", "B"]])

    // *** OBJECT VIEW:

    box.props(_s.box);
    box.role = "table";

    // GROUP: Layout (the title row, the rows)
    box.layout = VGroup({ width: "auto", height: "auto", align: "left top", gap: 0, position: "relative" });

        // GROUP: Title row (the lines between the titles are its color seen through the gaps)
        box.header = HGroup({ width: "auto", height: "auto", align: "left top", gap: LINE_WIDTH, color: _s.header.lineColor, role: "row" });
        box.header.css = { width: "max-content" };

            box.titleList = box.columns.map(function (column, i) {
                // Title
                const title = createTextItem(column.title, getColumnWidth(i), _s.header, "left");
                title.role = "columnheader";
                return title;
            });

        endGroup();

        // BOX: Rows (they scroll when bodyHeight is a number)
        box.body = startBox({
            width: "100%",
            height: isScrolling ? box.bodyHeight : "auto",
            color: _s.body.color,
            scrollY: isScrolling ? 1 : 0,
        });

            // GROUP: Rows
            box.rowsGroup = VGroup({
                width: "100%",
                height: "auto",
                align: "left top",
                gap: 0,
                padding: [0, _s.body.paddingY],
                position: "relative", // WHY: the body ("auto") grows with it
            });
            endGroup();

        endBox();
        if (!isScrolling) box.body.position = "relative";

    endGroup();

    if (isScrolling && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.body }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    createRows();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: TinyTable({ styleName: "light" })
// USAGE: TinyTable({ style: { header: { color: "indianred" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the classic style.
TinyTable.styles = {

    // A black title row, a black frame.
    classic: TinyTableDefaults.style,

    // A soft gray title row and frame.
    light: {
        box: { color: "white", border: 1, borderColor: "rgba(0, 0, 0, 0.15)", round: 6 },
        header: { color: "#F2F3F1", lineColor: "rgba(0, 0, 0, 0.08)", textColor: "rgba(0, 0, 0, 0.75)", fontSize: 16, padding: [10, 8] },
        cell: { textColor: "rgba(0, 0, 0, 0.75)", fontSize: 15, padding: [10, 5] },
        rowHover: { color: "#F7F8F6", lineColor: "rgba(0, 0, 0, 0.08)" },
    },

    // For a dark page.
    dark: {
        box: { color: "#232428", border: 1, borderColor: "rgba(255, 255, 255, 0.14)", round: 6 },
        header: { color: "#2B2D31", lineColor: "rgba(255, 255, 255, 0.1)", textColor: "rgba(255, 255, 255, 0.85)", fontSize: 16, padding: [10, 8] },
        body: { color: "#232428", paddingY: 10 },
        cell: { textColor: "rgba(255, 255, 255, 0.78)", fontSize: 15, padding: [10, 5] },
        rowHover: { color: "#2E3035", lineColor: "rgba(255, 255, 255, 0.08)" },
        scrollBar: { neverHide: 0, showDots: 0, bar_color: "#A0A0A0", bar_mouseOverColor: "#D0D0D0" },
    },

};
