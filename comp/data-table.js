/* Bismillah */

/*

Data Table - v26.10

A table made from data: the columns from a list of objects, the rows from a list of arrays (or objects).
WHEN TO USE IT: the better looking table (style packages, sorting, search, selection, your own
cells), but the data it can hold has a limit: every row is a basic.js object (about 9 DOM nodes), all made at once.
Measured (headless Chrome, Apple M1, 4 columns), the time to the screen: 200 rows 0.07 s, 1 000 rows
0.13 s, 2 000 rows 0.27 s, 5 000 rows 0.65 s, 10 000 rows 1.4 s (a phone is slower). Up to about 2 000 rows. Very big
data (tens of thousands of rows, very many columns): comp/smart-table.js (SmartTable: it makes only the rows that are
seen; 100 000 rows in about 0.1 s in the Tauri template). A few rows inside a text: comp/tiny-table.js (TinyTable).
- Samples: 02-comp-examples/data-table.htm, data-table-2.htm ... data-table-5.htm (data: assets/data-table/).
- Sorting: a click on a sortable title (again: the other direction), the keyboard (Enter / Space on a title), sortBy().
- Search: showSearch: 1 puts a SearchInput (comp/search-input.js, load it first) in the header; search(). Escape
  clears it (searchParams: { clearOnEscape: 0 } turns it off).
- Selection: a click, the arrow keys (Home / End), Enter runs onRowClick. select(id), getSelectedData().
- updateRows() adds, changes and removes rows by their id: the sorting, the search and the selection stay.
- Your own cell: column.createView(cell, value, row, self) makes objects in the cell (a chart, a button). It runs
  again when the value of the row changes (updateRows, updateRow).
- The rows scroll with the ScrollBar of basic.js (basic/scroll-bar.js, load it first; useScrollBar: 0 turns it off).
- A table narrower than its columns (a phone): the rows scroll to the side and the titles go with them; an "auto"
  column is never narrower than its minWidth.
- The rows off the screen are not laid out or drawn (CSS content-visibility: auto): 10 000 rows came on the
  screen in 2.2 s before, 1.4 s now, a sort took 315 ms, now 210 ms.
- The values are shown as plain text (a value can not inject HTML).
- Style packages: "light" (default; the old name "classic" works too), "plain" (white, lines only), "dark",
  "minimal", "minimalDark" (the minimal theme, _designs/minimal-theme.htm: as SmartTable "minimal"). (DataTable.styles)

A COLUMN:
{
    key: "age",           // its name (sortBy("age"), search(text, "age"))
    title: "Age",         // the text of the title ("": an empty title)
    valueIndex: 3,        // the index of the value in a row array (no value: the index of the column).
                          // A row object: row[key].
    type: "number",       // "text" (default) or "number": how it is sorted
    width: 100,           // a number or "auto" (default): the "auto" columns share the width that is left
    minWidth: 100,        // an "auto" column is never narrower (default 100); a narrower table scrolls to the side
    align: "left",        // "left" (default), "center", "right"
    sortable: 1,          // a click on the title sorts the rows
    iconFile: "",         // a small icon before the title
    cellColor: "",        // the color of the cells of the column ("": the color of the row)
    cellStyle: {},        // props of the labels of the column (Ex: { fontSize: 12, bold: 1 })
    createView: null,     // function (cell, value, row, self) {}: your objects in the cell (cell.label is hidden)
}

USAGE:
const table = DataTable({
    width: 600,
    height: 400,
    titleText: "Customers",
    showSearch: 1,
    columns: [
        { key: "id", title: "#", valueIndex: 0, type: "number", width: 60, sortable: 1 },
        { key: "name", title: "Name", valueIndex: 1, sortable: 1 },
        { key: "city", title: "City", valueIndex: 2 },
    ],
    rows: [[1, "John Smith", "New York"], [2, "Jane Doe", "Paris"]],
    sortKey: "name",
    onRowClick: function (self, row) { println(row.data); },
});
table.updateRows(newRows);
table.sortBy("id", "desc");
table.search("paris");
table.select(2);
DataTable({ styleName: "dark", ... });

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const DataTableDefaults = {
    width: 600,
    height: 400,
    columns: [], // See "A COLUMN" above.
    rows: [], // [[1, "John", "Paris"], ...] or [{ id: 1, name: "John", city: "Paris" }, ...]
    idIndex: 0, // The id of a row array: row[idIndex]
    idKey: "id", // The id of a row object: row[idKey]
    sortKey: "", // "": the order of the data
    sortDirection: "asc", // "asc" or "desc"
    canSelect: 1, // 0: a click runs onRowClick, no row is selected
    rowHeight: "auto", // "auto": as high as its text (more lines); a number: one line, cut with "..."
    titleText: "", // "": no title in the header
    showSearch: 0, // 1: a search box in the header (comp/search-input.js SearchInput must be loaded)
    searchParams: {}, // More params of the SearchInput. Ex: { placeholder: "Ara" }
    emptyText: "There are no records.",
    noResultText: "No records found.",
    sortIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" width="512" height="512"><path d="M17.71,9.88l-4.3-4.29a2,2,0,0,0-2.82,0L6.29,9.88a1,1,0,0,0,0,1.41,1,1,0,0,0,1.42,0L11,8V19a1,1,0,0,0,2,0V8l3.29,3.29a1,1,0,1,0,1.42-1.41Z"/></svg>'),
    useScrollBar: 1, // basic/scroll-bar.js ScrollBar
    onRowClick: function (self, row) {}, // A click on a row, or Enter on the selected row
    onSelect: function (self, row) {}, // The selected row changed (row: null when nothing is selected). Not with silent: 1
    onSort: function (self) {}, // self.sortKey, self.sortDirection
    styleName: "light", // "light" ("classic": its old name), "plain", "dark", "minimal", "minimalDark" or a name added to DataTable.styles
    style: { // Light style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.15), round: 6 },
        focus: { ringColor: "rgba(95, 158, 160, 0.6)" },
        header: { height: 60, padding: [16, 0], gap: 12 },
        headerTitle: { fontSize: 20, textColor: Black(0.75), fontFamily: "opensans-bold" },
        search: { width: 220, height: 40, fontSize: 16, searchIconSize: 20 }, // + the params of SearchInput
        searchStyleName: "ozden",
        titleRow: { height: 50, color: "whitesmoke", lineColor: Black(0.2) },
        titleCell: {
            padding: 10,
            gap: 6,
            fontSize: 15,
            textColor: Black(0.8),
            fontFamily: "opensans-bold",
            lineColor: Black(0.08), // between two titles
            hoverColor: "white",
            uppercase: 1,
        },
        titleIcon: { size: 16, opacity: 0.7, invert: 0 }, // invert: 1 -> a dark icon is drawn light (a dark page)
        sortIcon: { size: 16, opacity: 0.25, activeOpacity: 1, invert: 0 },
        row: {
            padding: [10, 12], // the space around the text of a cell: [left / right, top / bottom]
            fontSize: 15,
            textColor: Black(0.7),
            fontFamily: "opensans",
            oddColor: "white",
            evenColor: "#F7F7F7",
            hoverColor: "rgba(254, 193, 8, 0.08)",
            selectedColor: "rgba(254, 193, 8, 0.18)",
            lineColor: Black(0.08),
        },
        empty: { fontSize: 15, textColor: Black(0.45), top: 40 },
        scrollBar: { neverHide: 0, showDots: 0 },
    },
};

const DataTable = function (params = {}) {

    // Merge style package: params.style > DataTable.styles[styleName] > DataTableDefaults.style (light)
    basic.applyStylePackage(params, DataTable.styles, DataTableDefaults);

    // Merge params:
    mergeIntoIfMissing(params, DataTableDefaults);

    // Edit params: copies, the caller's lists do not change
    params.columns = DataTable.fitColumns(params.columns);
    params.rows = Array.isArray(params.rows) ? params.rows.slice() : [];

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const ARROW_DOWN = 180; // deg: the sort icon of "desc"
    const ROW_LINE_HEIGHT = 1.4; // the line of a text in a row, x its font size (only a guess: guessRowHeight)
    let searchText = "";
    let searchKey = "";
    let shownRowCount = 0;

    // *** PUBLIC VARIABLES:
    box.rowList = []; // The row objects, in the order of the data. (row.data, row.id, row.cells)
    box.shownRows = []; // The rows that are seen, in the order on the screen
    box.selectedRow = null;
    box.titleCells = []; // The title cells, in the order of the columns
    // NOTE: Default values are also public variables. (box.columns, box.sortKey, box.sortDirection...)

    // *** PRIVATE FUNCTIONS:

    const getRowId = function (data) {
        if (Array.isArray(data)) return data[box.idIndex];
        return data ? data[box.idKey] : undefined;
    };

    const getValue = function (data, column) {
        if (Array.isArray(data)) return data[column.valueIndex];
        return data ? data[column.key] : undefined;
    };

    const findColumn = function (key) {
        return box.columns.find(function (column) { return column.key == key; }) || null;
    };

    // The width the columns need: a narrower table scrolls to the side.
    const findColumnsWidth = function () {
        return box.columns.reduce(function (sum, column) {
            return sum + ((column.width == "auto") ? column.minWidth : Number(column.width));
        }, 0);
    };

    const findRow = function (id) {
        return box.rowList.find(function (row) { return row.id == id; }) || null;
    };

    // The flex size of a column: a number is fixed, "auto" shares the free width, not under its minWidth.
    // WHY the minimum: with a minimum of 0, a narrow table (a phone) gave its "auto" column no width, and its text
    //     broke after every letter, so every row was very tall.
    const applyColumnWidth = function (cell, column) {
        if (column.width == "auto") {
            cell.width = 0;
            cell.css = { flex: "1 1 0", minWidth: column.minWidth + "px" };
            return;
        }
        cell.css = { flex: "0 0 auto" };
        cell.width = column.width;
    };

    // *** THE TITLES:

    const createTitleCell = function (column, index) {

        const isLast = (index == box.columns.length - 1);

        // GROUP: Title cell
        const titleCell = HGroup({
            height: "100%",
            align: DataTable.toAlign(column.align),
            gap: _s.titleCell.gap,
            padding: [_s.titleCell.padding, 0],
            color: "transparent",
        });
        applyColumnWidth(titleCell, column);
        if (!isLast) titleCell.css = { borderRight: "1px solid " + _s.titleCell.lineColor };
        titleCell.column = column;

            if (column.iconFile) {
                // ICON: Title icon
                titleCell.icon = Icon({ width: _s.titleIcon.size, height: _s.titleIcon.size, opacity: _s.titleIcon.opacity });
                titleCell.icon.load(column.iconFile);
                titleCell.icon.shrink = 0;
                if (_s.titleIcon.invert) titleCell.icon.css = { filter: "invert(1)" };
            }

            // LABEL: Title text
            titleCell.label = Label({
                plainText: column.title,
                fontSize: _s.titleCell.fontSize,
                textColor: _s.titleCell.textColor,
                fontFamily: _s.titleCell.fontFamily,
                ellipsis: 1,
                css: { minWidth: "0px", textTransform: _s.titleCell.uppercase ? "uppercase" : "none" },
            });

            if (column.sortable) {
                // ICON: Sort direction
                titleCell.sortIcon = Icon({ width: _s.sortIcon.size, height: _s.sortIcon.size, opacity: _s.sortIcon.opacity });
                titleCell.sortIcon.load(box.sortIconFile);
                titleCell.sortIcon.shrink = 0;
                if (_s.sortIcon.invert) titleCell.sortIcon.css = { filter: "invert(1)" };
                titleCell.sortIcon.setMotion("opacity 0.3s, transform 0.3s");
            }

        endGroup();

        if (column.sortable) makeTitleSortable(titleCell);

        return titleCell;

    };

    const makeTitleSortable = function (titleCell) {

        titleCell.clickable = 1;
        titleCell.cursor = "pointer";
        titleCell.role = "button";
        titleCell.tabIndex = 0;
        titleCell.aria = { label: "Sort by " + (titleCell.column.title || titleCell.column.key) };
        titleCell.setFocusRing(_s.focus.ringColor);

        titleCell.onHoverChange(function (self, isOver) {
            titleCell.color = isOver ? _s.titleCell.hoverColor : "transparent";
        });
        titleCell.on("click", function () {
            toggleSort(titleCell.column);
        });
        titleCell.on("keydown", function (self, event) {
            if (event.key != "Enter" && event.key != " ") return;
            event.preventDefault();
            toggleSort(titleCell.column);
        });

    };

    // The same title again changes the direction; another title starts with "asc".
    const toggleSort = function (column) {
        const isSameColumn = (box.sortKey == column.key);
        const direction = (isSameColumn && box.sortDirection == "asc") ? "desc" : "asc";
        box.sortBy(column.key, direction);
        box.onSort(box);
    };

    const paintSortIcons = function () {
        box.titleCells.forEach(function (titleCell) {
            if (!titleCell.sortIcon) return;
            const isActive = (titleCell.column.key == box.sortKey);
            titleCell.sortIcon.opacity = isActive ? _s.sortIcon.activeOpacity : _s.sortIcon.opacity;
            titleCell.sortIcon.rotate = (isActive && box.sortDirection == "desc") ? ARROW_DOWN : 0;
            titleCell.aria = { sort: isActive ? DataTable.toAriaSort(box.sortDirection) : "none" };
        });
    };

    // *** THE ROWS:

    // A row: a group of cells. Its container must be set (createIn).
    // The height of a row before the browser draws it (content-visibility). "auto" rows: one line of text.
    const guessRowHeight = function () {
        if (typeof box.rowHeight === "number") return box.rowHeight;
        const padding = _s.row.padding;
        const paddingY = Array.isArray(padding) ? padding[1] : (padding || 0);
        return Math.round(_s.row.fontSize * ROW_LINE_HEIGHT + paddingY * 2 + 1);
    };

    const createRow = function (data) {

        // GROUP: Row
        // WHY content-visibility: the browser does not lay out and draw the rows off the screen. Measured
        //     with 10 000 rows: on the screen 2.2 s -> 1.5 s, a sort 315 -> 151 ms. Every row is still made (most of
        //     the time); the "auto" of contain-intrinsic-size keeps the real height of a row once it was drawn.
        const row = HGroup({
            width: "100%",
            height: box.rowHeight,
            align: "left top",
            color: _s.row.oddColor,
            clickable: 1,
            cursor: "pointer",
            role: "row",
            css: {
                borderBottom: "1px solid " + _s.row.lineColor,
                flex: "0 0 auto",
                contentVisibility: "auto",
                containIntrinsicSize: "auto " + guessRowHeight() + "px",
            },
        });
        row.data = data;
        row.id = getRowId(data);
        row.isHover = 0;
        row.cells = [];

            box.columns.forEach(function (column) {
                row.cells.push(createCell(row, column));
            });

        endGroup();

        row.onHoverChange(function (self, isOver) {
            row.isHover = isOver;
            paintRow(row);
        });
        row.on("click", function () {
            clickRow(row);
        });

        return row;

    };

    const createCell = function (row, column) {

        const isOneLine = (box.rowHeight != "auto");

        // GROUP: Cell
        const cell = HGroup({
            height: "auto",
            align: DataTable.toAlign(column.align),
            padding: _s.row.padding,
            color: column.cellColor || "transparent",
            role: "cell",
            css: { alignSelf: "stretch" },
        });
        applyColumnWidth(cell, column);
        cell.column = column;

            // LABEL: Value
            cell.label = Label({
                fontSize: _s.row.fontSize,
                textColor: _s.row.textColor,
                fontFamily: _s.row.fontFamily,
                textAlign: column.align,
                ellipsis: isOneLine ? 1 : 0,
                css: isOneLine ? { minWidth: "0px" } : { minWidth: "0px", whiteSpace: "normal", overflowWrap: "anywhere" },
                ...column.cellStyle,
            });

        endGroup();

        applyCellValue(cell, row);
        return cell;

    };

    // The value of the row in the cell: its text, or the objects of column.createView (made again).
    const applyCellValue = function (cell, row) {

        const column = cell.column;
        const value = getValue(row.data, column);

        if (!column.createView) {
            cell.label.plainText = DataTable.toText(value);
            return;
        }

        cell.label.visible = 0;
        if (cell.content) cell.content.remove();
        cell.content = createIn(cell, function () {
            const content = HGroup({ width: "100%", height: "auto", align: DataTable.toAlign(column.align), clipContent: 0 });
                column.createView(cell, value, row, box);
            endGroup();
            return content;
        });

    };

    // A row that exists already gets its new data (its objects stay).
    const refreshRow = function (row, data) {
        row.data = data;
        row.cells.forEach(function (cell) {
            applyCellValue(cell, row);
        });
    };

    const addRowObject = function (data) {
        const row = createIn(box.rowsGroup, function () { return createRow(data); });
        box.rowList.push(row);
        return row;
    };

    const removeRowObject = function (row) {
        if (row == box.selectedRow) box.selectedRow = null;
        row.remove();
    };

    // The color of a row: selected > under the mouse > odd / even.
    const paintRow = function (row) {
        if (row == box.selectedRow) {
            row.color = _s.row.selectedColor;
        } else if (row.isHover) {
            row.color = _s.row.hoverColor;
        } else {
            row.color = row.isEven ? _s.row.evenColor : _s.row.oddColor;
        }
        row.aria = { selected: (row == box.selectedRow) };
    };

    // *** SORT AND SEARCH: one function shows the rows (the order, the search, the colors, the empty text)

    const compareRows = function (rowA, rowB, column) {
        const a = getValue(rowA.data, column);
        const b = getValue(rowB.data, column);
        if (column.type == "number") return (parseFloat(a) || 0) - (parseFloat(b) || 0);
        // WHY numeric: "10" comes after "9"; sensitivity base: "a" and "A" are sorted together
        return DataTable.toText(a).localeCompare(DataTable.toText(b), undefined, { numeric: true, sensitivity: "base" });
    };

    const getSortedRows = function () {
        const column = findColumn(box.sortKey);
        if (!column) return box.rowList.slice();
        const direction = (box.sortDirection == "desc") ? -1 : 1;
        return box.rowList.slice().sort(function (rowA, rowB) {
            return compareRows(rowA, rowB, column) * direction;
        });
    };

    const isRowMatching = function (row) {
        if (searchText == "") return true;
        return box.columns.some(function (column) {
            if (searchKey && searchKey != column.key) return false;
            return DataTable.toSearchText(getValue(row.data, column)).includes(searchText);
        });
    };

    // WHY the CSS order: the rows are flex items; sorting moves no object and makes nothing again.
    const showRows = function () {

        box.shownRows = [];

        getSortedRows().forEach(function (row, order) {
            row.css = { order: String(order) };
            row.visible = isRowMatching(row) ? 1 : 0;
            if (!row.visible) return;
            row.isEven = (box.shownRows.length % 2 == 1);
            box.shownRows.push(row);
        });
        shownRowCount = box.shownRows.length;

        box.rowList.forEach(paintRow);
        paintSortIcons();
        showEmptyText();

    };

    const showEmptyText = function () {
        box.lblEmpty.plainText = (box.rowList.length == 0) ? box.emptyText : box.noResultText;
        box.lblEmpty.visible = (shownRowCount == 0) ? 1 : 0;
    };

    // *** SELECTION:

    const setSelectedRow = function (row, silent) {
        if (row == box.selectedRow) return;
        const oldRow = box.selectedRow;
        box.selectedRow = row;
        if (oldRow) paintRow(oldRow);
        if (row) paintRow(row);
        if (!silent) box.onSelect(box, row);
    };

    const clickRow = function (row) {
        if (box.canSelect) setSelectedRow(row, 0);
        box.onRowClick(box, row);
    };

    // The arrow keys move the selection over the rows that are seen.
    const moveSelection = function (step) {
        if (box.shownRows.length == 0) return;
        let index = box.shownRows.indexOf(box.selectedRow);
        // Nothing selected: a step down (Home) starts before the first row, a step up (End) after the last one
        if (index == -1) index = (step > 0) ? -1 : box.shownRows.length;
        const next = Math.max(0, Math.min(box.shownRows.length - 1, index + step));
        setSelectedRow(box.shownRows[next], 0);
        scrollToRow(box.shownRows[next]);
    };

    // Scrolls only the rows (not the page around the table) to show a row.
    // WHY not elem.scrollIntoView(): it scrolls every box around the row too; a table half out of a scrolling page
    //     moved the page at a selection (the same fault was found in FullScreenSelect and ItemList).
    // NOTE: offsetTop is the place on the screen, also after a sort (the rows are ordered with their CSS order).
    const scrollToRow = function (row) {
        const area = box.scrollBox.elem;
        const rowTop = row.elem.offsetTop + box.rowsGroup.elem.offsetTop;
        const rowBottom = rowTop + row.elem.offsetHeight;
        if (rowTop < area.scrollTop) area.scrollTop = rowTop;
        else if (rowBottom > area.scrollTop + area.clientHeight) area.scrollTop = rowBottom - area.clientHeight;
    };

    const onKeyDown = function (self, event) {
        if (event.target != box.elem) return; // (a key of the search box or of a title)
        if (!box.canSelect) return;
        const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: 10, PageUp: -10, End: Infinity, Home: -Infinity };
        if (steps[event.key] !== undefined) {
            event.preventDefault();
            moveSelection(steps[event.key]);
            return;
        }
        if (event.key == "Enter" && box.selectedRow) {
            event.preventDefault();
            box.onRowClick(box, box.selectedRow);
        }
    };

    // *** THE HEADER (a title and the search box)

    const createHeader = function () {

        if (!box.titleText && box.showSearch != 1) return 0;

        // GROUP: Header
        box.header = HGroup({
            left: 0,
            top: 0,
            width: "100%",
            height: _s.header.height,
            align: "left center",
            gap: _s.header.gap,
            padding: _s.header.padding,
            clipContent: 0,
            position: "absolute",
        });

            // LABEL: The title of the table
            box.lblTitle = Label({ ..._s.headerTitle, plainText: box.titleText, ellipsis: 1, grow: 1, css: { minWidth: "0px" } });

            if (box.showSearch == 1) createSearch();

        endGroup();

        return _s.header.height;

    };

    const createSearch = function () {

        if (typeof SearchInput === "undefined") {
            console.warn("DataTable: showSearch needs comp/search-input.js (SearchInput).");
            return;
        }

        const searchParams = Object.assign(
            { styleName: _s.searchStyleName, clearOnEscape: 1 }, // (Escape clears the search, as in SmartTable)
            _s.search,
            box.searchParams,
        );
        searchParams.onChange = function (self) {
            box.search(self.getSearchText());
        };
        box.searchInput = SearchInput(searchParams);
        box.searchInput.shrink = 0;
        box.searchInput.css = { maxWidth: "60%" }; // WHY: on a narrow table (a phone) the title keeps room

    };

    // *** PUBLIC FUNCTIONS:

    // All the rows again. (The selection goes; the sorting and the search stay.)
    box.setRows = function (rows) {
        box.clearRows();
        box.rows = Array.isArray(rows) ? rows.slice() : [];
        box.rows.forEach(addRowObject);
        showRows();
    };
    // USAGE: table.setRows([[1, "John"], [2, "Jane"]])

    // Adds, changes and removes rows by their id. The objects of the rows that stay are kept.
    box.updateRows = function (rows) {

        // WHY a list for each id: rows with the same id (object rows with no id, a first column that repeats) kept
        //     only the last one in the map. The others stayed on the screen out of box.rowList, so clearRows() and
        //     setRows() could not remove them either ("ghost" rows).
        const oldRows = new Map();
        box.rowList.forEach(function (row) {
            if (!oldRows.has(row.id)) oldRows.set(row.id, []);
            oldRows.get(row.id).push(row);
        });

        box.rows = Array.isArray(rows) ? rows.slice() : [];
        box.rowList = [];

        box.rows.forEach(function (data) {
            const sameId = oldRows.get(getRowId(data));
            const row = (sameId && sameId.length) ? sameId.shift() : null;
            if (!row) {
                addRowObject(data);
                return;
            }
            refreshRow(row, data);
            box.rowList.push(row);
        });

        const hadSelection = !!box.selectedRow;
        oldRows.forEach(function (list) { list.forEach(function (row) { removeRowObject(row); }); });
        showRows();
        if (hadSelection && !box.selectedRow) box.onSelect(box, null);

    };
    // USAGE: data.push([101, "New"]); table.updateRows(data);

    box.addRow = function (data) {
        box.rows.push(data);
        addRowObject(data);
        showRows();
    };

    // A row with this id gets the new data (its objects stay).
    box.updateRow = function (data) {
        const row = findRow(getRowId(data));
        if (!row) return;
        box.rows[box.rowList.indexOf(row)] = data;
        refreshRow(row, data);
        showRows();
    };

    box.removeRow = function (id) {
        const row = findRow(id);
        if (!row) return;
        const index = box.rowList.indexOf(row);
        const wasSelected = (row == box.selectedRow);
        box.rows.splice(index, 1);
        box.rowList.splice(index, 1);
        removeRowObject(row);
        showRows();
        if (wasSelected) box.onSelect(box, null);
    };
    // USAGE: table.removeRow(5)

    box.clearRows = function () {
        box.rowList.forEach(removeRowObject);
        box.rowList = [];
        box.rows = [];
        showRows();
    };

    // A copy of the data of the rows (in the order of the data)
    box.getRows = function () {
        return box.rows.slice();
    };

    box.getRow = function (id) {
        return findRow(id);
    };

    // key: the key of a column ("": the order of the data); direction: "asc" or "desc"
    box.sortBy = function (key, direction = "asc") {
        box.sortKey = findColumn(key) ? key : "";
        box.sortDirection = (direction == "desc") ? "desc" : "asc";
        box.scrollBox.elem.scrollTop = 0;
        showRows();
    };
    // USAGE: table.sortBy("age", "desc")

    box.clearSort = function () {
        box.sortBy("");
    };

    // Shows only the rows with the text (in the column key, or in every column). Returns the count of the rows seen.
    box.search = function (text, key = "") {
        searchText = DataTable.toSearchText(text).trim();
        searchKey = key;
        box.scrollBox.elem.scrollTop = 0;
        showRows();
        return shownRowCount;
    };
    // USAGE: table.search("paris") / table.search("") // all

    // silent: 1 -> onSelect is not called.
    box.select = function (id, silent = 0) {
        if (!box.canSelect) return 0;
        const row = findRow(id);
        if (!row) return 0;
        setSelectedRow(row, silent);
        scrollToRow(row);
        return 1;
    };

    box.clearSelection = function (silent = 0) {
        setSelectedRow(null, silent);
    };

    box.getSelectedId = function () {
        return box.selectedRow ? box.selectedRow.id : null;
    };

    box.getSelectedData = function () {
        return box.selectedRow ? box.selectedRow.data : null;
    };

    box.setTitleText = function (text) {
        box.titleText = text;
        if (box.lblTitle) box.lblTitle.plainText = text;
    };

    // The biggest id of the rows (a new row gets the next one)
    box.getBiggestId = function () {
        let biggestId = 0;
        box.rows.forEach(function (data) {
            biggestId = Math.max(biggestId, basic.num(getRowId(data)) || 0);
        });
        return biggestId;
    };

    // *** OBJECT VIEW:

    box.props(_s.box);
    box.role = "grid";
    box.tabIndex = 0;
    box.aria = { label: box.titleText || "Table" };
    box.setFocusRing(_s.focus.ringColor);

    const headerHeight = createHeader();
    const rowsTop = headerHeight + _s.titleRow.height;

    // GROUP: Title row
    box.titleRow = HGroup({
        left: 0,
        top: headerHeight,
        width: "100%",
        height: _s.titleRow.height,
        align: "left center",
        color: _s.titleRow.color,
        position: "absolute",
        role: "row",
        css: { borderBottom: "1px solid " + _s.titleRow.lineColor, borderTop: headerHeight ? "1px solid " + _s.titleRow.lineColor : "none" },
    });

        box.columns.forEach(function (column, i) {
            box.titleCells.push(createTitleCell(column, i));
        });

    endGroup();

    // BOX: Scrolling area of the rows (to the side too, when the table is narrower than its columns)
    box.scrollBox = startBox(0, rowsTop, "100%", "calc(100% - " + rowsTop + "px)", { color: "transparent", scrollY: 1, scrollX: 1 });

        // GROUP: Rows (the order: their CSS order, showRows)
        box.rowsGroup = VGroup({ width: "100%", height: "auto", align: "left top", css: { minWidth: findColumnsWidth() + "px" } });
        endGroup();

    endBox();

    // WHY: the titles are not in the box that scrolls (they stay at the top); they go to the side with the rows.
    box.scrollBox.on("scroll", function () {
        box.titleRow.elem.scrollLeft = box.scrollBox.elem.scrollLeft;
    });

    // LABEL: No rows / no result
    box.lblEmpty = Label({
        left: 0,
        top: rowsTop + _s.empty.top,
        width: "100%",
        fontSize: _s.empty.fontSize,
        textColor: _s.empty.textColor,
        textAlign: "center",
        visible: 0,
    });

    if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollBox }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.on("keydown", onKeyDown);
    const startRows = box.rows;
    box.rows = [];
    box.setRows(startRows);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The columns with their defaults (copies: the caller's objects do not change).
DataTable.fitColumns = function (columns) {
    if (!Array.isArray(columns)) return [];
    return columns.map(function (column, i) {
        const fitted = Object.assign({
            key: "column" + i,
            title: "",
            valueIndex: i,
            type: "text",
            width: "auto",
            minWidth: 100, // px: the least width of an "auto" column (a narrower table scrolls to the side)
            align: "left",
            sortable: 0,
            iconFile: "",
            cellColor: "",
            cellStyle: {},
            createView: null,
        }, column);
        fitted.title = DataTable.toText(fitted.title);
        return fitted;
    });
};

DataTable.toText = function (value) {
    if (value === undefined || value === null) return "";
    return String(value);
};

// Lower case, the Turkish letters without their marks: "İstanbul" is found with "istanbul".
DataTable.toSearchText = function (value) {
    return DataTable.toText(value).toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
};

// "left" / "center" / "right" -> the align of a group
DataTable.toAlign = function (align) {
    if (align == "center") return "center center";
    if (align == "right") return "right center";
    return "left center";
};

DataTable.toAriaSort = function (direction) {
    return (direction == "desc") ? "descending" : "ascending";
};

// *** STYLE PACKAGES:
// USAGE: DataTable({ styleName: "plain" })
// USAGE: DataTable({ styleName: "dark", style: { row: { fontSize: 13 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the light style.
DataTable.styles = {

    // A light gray title row, striped rows, a soft yellow selection.
    light: DataTableDefaults.style,

    // White, no stripes, only lines: a table in a page.
    plain: {
        box: { color: "white", border: 0, round: 0 },
        titleRow: { height: 50, color: "white", lineColor: Black(0.2) },
        titleCell: { lineColor: "transparent", hoverColor: "whitesmoke", uppercase: 0 },
        row: { evenColor: "white", hoverColor: Black(0.02), selectedColor: Black(0.05) },
    },

    // For a dark page.
    dark: {
        box: { color: "#232428", border: 1, borderColor: "rgba(255, 255, 255, 0.12)", round: 6 },
        focus: { ringColor: "rgba(95, 179, 181, 0.7)" },
        headerTitle: { fontSize: 20, textColor: "rgba(255, 255, 255, 0.9)", fontFamily: "opensans-bold" },
        searchStyleName: "ozdenDark",
        titleRow: { height: 50, color: "#2B2D31", lineColor: "rgba(255, 255, 255, 0.14)" },
        titleCell: { textColor: "rgba(255, 255, 255, 0.85)", lineColor: "rgba(255, 255, 255, 0.08)", hoverColor: "#33353A" },
        titleIcon: { size: 16, opacity: 0.8, invert: 1 },
        sortIcon: { size: 16, opacity: 0.3, activeOpacity: 1, invert: 1 },
        row: {
            textColor: "rgba(255, 255, 255, 0.75)",
            oddColor: "#232428",
            evenColor: "#27292D",
            hoverColor: "#2E3035",
            selectedColor: "#24383A",
            lineColor: "rgba(255, 255, 255, 0.06)",
        },
        empty: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.45)", top: 40 },
        scrollBar: { neverHide: 0, showDots: 0, bar_color: "#A0A0A0", bar_mouseOverColor: "#D0D0D0" },
    },

};
DataTable.styles.classic = DataTable.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm), as SmartTable "minimal": small (30 px titles, rows of a 13 px text),
// on the ground of the window with a line around it; no stripes, thin lines between the rows, soft titles over a line,
// a faint row under the mouse and a stronger one for the selected row. minimalDark: the same on a dark window.
DataTable.createMinimalStyle = function (colors) {
    return {
        box: { color: colors.ground, border: 1, borderColor: colors.line, round: 4 },
        focus: { ringColor: colors.focus },
        header: { height: 40, padding: [12, 0], gap: 10 },
        headerTitle: { fontSize: 14, textColor: colors.text, fontFamily: "opensans-bold" },
        search: { width: 200, height: 28, fontSize: 13, searchIconSize: 14 },
        searchStyleName: colors.minimalName,
        titleRow: { height: 30, color: colors.ground, lineColor: colors.line },
        titleCell: { padding: 10, gap: 6, fontSize: 12, textColor: colors.softText, fontFamily: "opensans-bold", lineColor: "transparent", hoverColor: colors.hover, uppercase: 0 },
        titleIcon: { size: 14, opacity: 0.7, invert: colors.invertIcons },
        sortIcon: { size: 14, opacity: 0.3, activeOpacity: 1, invert: colors.invertIcons },
        row: { padding: [10, 5], fontSize: 13, textColor: colors.text, fontFamily: "opensans", oddColor: colors.ground, evenColor: colors.ground, hoverColor: colors.hover, selectedColor: colors.selected, lineColor: colors.track },
        empty: { fontSize: 12, textColor: colors.softText, top: 30 },
        scrollBar: { neverHide: 0, showDots: 0, bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3 },
    };
};
DataTable.MINIMAL_COLORS = {
    ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), line: Black(0.2), track: Black(0.08), hover: Black(0.03),
    selected: Black(0.06), focus: "#3D8BD9", scrollBar: "#9A9A98", invertIcons: 0, minimalName: "minimal",
};
DataTable.styles.minimal = DataTable.createMinimalStyle(DataTable.MINIMAL_COLORS);
DataTable.MINIMAL_DARK_COLORS = {
    ground: "#1A1A19", text: White(0.88), softText: White(0.55), line: White(0.18), track: White(0.08), hover: White(0.04),
    selected: White(0.08), focus: "#7FB6DE", scrollBar: "#A0A0A0", invertIcons: 1, minimalName: "minimalDark",
};
DataTable.styles.minimalDark = DataTable.createMinimalStyle(DataTable.MINIMAL_DARK_COLORS);
