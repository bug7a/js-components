/* Bismillah */

/*

GridGroup - v26.11

UI COMPONENT
- A group whose objects stand in columns and rows: a form of titles and fields, the keys of a calculator, tiles. Start it
  like HGroup and VGroup, and close it with endGroup(). The objects go into the cells in order, left to right.
- columns: 3: three equal columns. [120, "1fr", "auto"]: px, a part of the room, the width of its content. A text is CSS as
  it is: "repeat(auto-fill, minmax(160px, 1fr))": as many columns as fit (a width of a phone too).
- rows: none: as many as the objects need, each as high as its content. 4, or a list or a text, as columns. With a height
  (height: "100%", rows: 4) equal rows fill it.
- gap: 8, or [column gap, row gap].
- align: where each object stands in its cell: "left center", "center". None: it fills the cell. An object with a width of
  its own keeps it: width: "100%" fills the cell.
- place(obj, { column, row, columnSpan, rowSpan, align }): one object in a cell of its own (from 0), over more than one cell.
- It has no look of its own, so no style package: color, round and padding are the ones of every group.
- clipContent: 0 by default: a button that lifts under the mouse is not cut at the edge of the group.

USAGE:
GridGroup({ columns: 3, gap: 8 });
    Label({ text: "Name" });
    Label({ text: "Size" });
    Label({ text: "Date" });
endGroup();

const form = GridGroup({ columns: ["auto", "1fr"], gap: [12, 8], align: "left center" });
    Label({ text: "Name" });
    Input({ width: "100%", height: 36 });
endGroup();

const keys = GridGroup({ columns: 4, gap: 8 });
    const zero = SmartButton({ labelText: "0", width: "100%" });
    keys.place(zero, { columnSpan: 2 });
endGroup();

keys.setColumns(3);
keys.setGap([4, 8]);

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const GridGroupDefaults = {
    width: "100%",
    height: "auto", // "auto": as high as its rows.
    columns: 2, // A number, a list ([120, "1fr", "auto"]) or a text (CSS)
    rows: null, // null: as many as the objects need. A number, a list or a text, as columns.
    gap: 0, // px, or [column gap, row gap]
    align: "", // "": the objects fill their cells. "left center", "center"...: where each one stands in its cell.
    clipContent: 0,
};

const GridGroup = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, GridGroupDefaults);

    // WHY a copy without align: for HGroup it is where the objects stand in the group; here it is in their cells.
    const groupProps = Object.assign({}, params, { gap: GridGroup.toGapText(params.gap) });
    delete groupProps.align;

    // GROUP: The grid. WHY HGroup: its objects take their places in its flow, and endGroup() closes it.
    const box = HGroup(groupProps);

    // *** PRIVATE FUNCTIONS:

    const applyTracks = function () {
        box.css = {
            gridTemplateColumns: GridGroup.toTracks(box.columns),
            gridTemplateRows: GridGroup.toTracks(box.rows),
        };
    };

    const applyAlign = function () {
        const place = GridGroup.toCellPlace(box._align);
        box.css = { justifyItems: place.horizontal, alignItems: place.vertical };
    };

    // *** PUBLIC FUNCTIONS:

    box.setColumns = function (columns) {
        box.columns = columns;
        applyTracks();
    };
    // USAGE: grid.setColumns(3) / grid.setColumns([120, "1fr"])

    box.setRows = function (rows) {
        box.rows = rows;
        applyTracks();
    };

    box.setGap = function (gap) {
        box.gap = GridGroup.toGapText(gap);
    };
    // USAGE: grid.setGap(8) / grid.setGap([12, 4])

    box.setAlign = function (align) {
        box._align = align;
        applyAlign();
    };
    // USAGE: grid.setAlign("left center")

    // One object in a cell of its own. column, row: from 0; not given: the next free cell. columnSpan, rowSpan: how many cells it takes.
    box.place = function (obj, where = {}) {
        obj.css = {
            gridColumn: GridGroup.toCellLine(where.column, where.columnSpan),
            gridRow: GridGroup.toCellLine(where.row, where.rowSpan),
        };
        if (where.align) {
            const place = GridGroup.toCellPlace(where.align);
            obj.css = { justifySelf: place.horizontal, alignSelf: place.vertical };
        }
        return obj;
    };
    // USAGE: grid.place(zero, { columnSpan: 2 }) / grid.place(title, { column: 1, row: 0 })

    // *** OBJECT INIT CODE:

    // WHY start: the flex group centers its lines; the rows and the columns start at the corner of the grid.
    box.css = { display: "grid", justifyContent: "start", alignContent: "start" };
    box._align = params.align;
    applyTracks();
    applyAlign();

    // WHY again: writing the display brought a hidden group back. (visible keeps the display it finds: "grid")
    if (params.visible !== undefined) box.visible = params.visible;

    return box;

};

// *** STATIC FUNCTIONS:

// WHY minmax(0, ...): a part of the room would grow with a long content, and the columns would not stay equal.
GridGroup.toTrack = function (track) {
    if (typeof track === "number") return track + "px";
    return (/^[\d.]+fr$/.test(track)) ? "minmax(0, " + track + ")" : track;
};

// columns or rows as CSS: 3 -> three equal ones, a list -> one by one, a text -> as it is. null: as the objects need.
GridGroup.toTracks = function (tracks) {
    if (tracks === null || tracks === undefined) return "";
    if (typeof tracks === "number") return "repeat(" + tracks + ", minmax(0, 1fr))";
    if (Array.isArray(tracks)) return tracks.map(GridGroup.toTrack).join(" ");
    return String(tracks);
};

// 8 -> "8px", [12, 4] (column, row) -> "4px 12px" (CSS: row, column)
GridGroup.toGapText = function (gap) {
    if (Array.isArray(gap)) return gap[1] + "px " + gap[0] + "px";
    return (typeof gap === "number") ? gap + "px" : gap;
};

// A column or a row of an object as CSS: from 0, and how many cells it takes.
GridGroup.toCellLine = function (start, span) {
    const spanText = "span " + (span || 1);
    if (start === null || start === undefined) return spanText;
    return (start + 1) + " / " + spanText;
};

GridGroup.CELL_PLACES = { left: "start", right: "end", top: "start", bottom: "end" };

// "left center" -> { horizontal: "start", vertical: "center" }. A side that is not named fills the cell.
GridGroup.toCellPlace = function (align) {
    const words = String(align || "").split(" ");
    const hasCenter = words.includes("center");
    const placeOf = function (word) {
        if (word) return GridGroup.CELL_PLACES[word];
        return (hasCenter) ? "center" : "stretch";
    };
    return {
        horizontal: placeOf(words.find(function (word) { return word === "left" || word === "right"; })),
        vertical: placeOf(words.find(function (word) { return word === "top" || word === "bottom"; })),
    };
};
