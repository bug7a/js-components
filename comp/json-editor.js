/* Bismillah */

/*

JsonEditor - v26.11

UI COMPONENT
- A list or an object of JSON written in a table: the items of a menu, the products of a shop, the settings of a
  program. + adds a row, a click on a cell writes in it, a title sorts, a row is dragged to another place.
- Every shape of a list is kept: [{ a, b }], ["A", "B"], [[1, 2], [3, 4]] and mixed ones ["A", { text: "B" }, "-"].
  An object is a table of names and values.
- A cell that holds a list or an object opens as a table of its own; the path at the top goes back.
- The kind of a column comes from its values and its name: a text, a number, on / off (a switch), a color (a swatch:
  a click on it opens the color picker of the browser, or onPickColor), a picture (a small picture: onPickPicture
  chooses one), a choice (columns: options, or optionsOf). The menu of a column changes its kind, sorts, renames, moves
  and deletes it.
- Paste: a block of a spreadsheet (from the chosen cell), or a JSON list (its items become rows).
  Cmd/Ctrl+C copies the chosen rows as lines of cells.
- The JSON view shows the same value as a text. A text that is not JSON says where its fault is; the table waits.
- Its own undo (Cmd/Ctrl+Z, Shift for redo) and a search of the rows. Only the rows in sight are drawn, so a list of
  thousands of rows opens at once.
- The functions of the rows (onClick...) stay in their rows: a table and a JSON text can not hold their code.
- JsonEditor.open(): the editor in a window over the page, with Cancel and Apply.
- NEEDS comp/context-menu.js and comp/search-input.js, loaded first.
- Style packages: "light" (default), "dark", "minimal", "minimalDark" (the minimal theme, _designs/minimal-theme.htm).
  Select with styleName (JsonEditor.styles).

USAGE:
const editor = JsonEditor({
    height: 360,
    titleText: "Products",
    value: [{ name: "Apple", price: 1.2, unit: "kg", color: "#D64545", inStock: true }],
    columns: [{ key: "unit", options: ["kg", "piece"] }],
    onChange: function (self, value) { println(JSON.stringify(value)); },
});
editor.getValue();              // The list or the object. null: the table can not make one now (editor.errorText)
editor.setValue({ a: 1 });      // A new value; its undo starts again. (onChange is not called)
editor.setJsonText('[1, 2]');   // A text that is not JSON shows its error, the table stays.
editor.getJsonText();           // The value as a JSON text of 2 spaces
editor.setView("json");         // "table" or "json"
editor.undo();
editor.redo();
const win = JsonEditor.open({
    titleText: "Products",
    value: products,
    onApply: function (value) { products = value; }, // Apply, when something was changed
    onClose: function () { },                         // after Apply, Cancel or win.close()
});
win.close();                    // win.editor is the JsonEditor of the window
JsonEditor({
    pictureBase: "https://example.com/shop/",          // the relative pictures of the cells are read from here
    onPickPicture: function (self, cell) { myPictureList(cell.value, cell.setValue); },
    colorOf: function (value) { return myTheme.colorOf(value); },             // "var(--brand)" -> "#E0A038"
    optionsOf: function (key) { return (key === "size") ? ["S", "M", "L"] : null; },
});

A COLUMN (columns): { key, kind, options, note, columns }
- key: the name of the column. An empty list shows these columns. In an object: the name of a row.
- kind: "text", "number", "flag" (on / off), "color", "picture", "option". (None: from its values and its name)
- options: the choices of a cell: ["kg", "piece"]. A cell takes another value too, when it is written.
- note: a soft text on the title of the column.
- columns: [A COLUMN]: the columns of the list in its cells (the table it opens as).

A CELL (onPickColor, onPickPicture): { value, key, title, x, y, rect, setValue(value) }
- key: the name of the value (its column, or the name of the row of an object). x, y: the click. rect: the cell on the screen.
- setValue(): writes the cell (the calls of one pick are one step of the undo: a picker may write while it is dragged).

KEYS:
- A cell: a click or a letter writes in it. Tab: the next cell. Enter: the next row. Shift+Enter: a new line in it.
  ↑ ↓: the next row. Esc: gives up. Delete: empties it. Enter on a list or an object opens it.
- The rows: a click on a number chooses it (Shift: up to it, Cmd/Ctrl: one more). Delete deletes them,
  Cmd/Ctrl+D duplicates them, Alt+↑ ↓ moves them. Right click: the menu of a row.
- The window: Cmd/Ctrl+Enter applies. Esc closes it (when something was changed, at the second press).

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const JsonEditorDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: 400,
    value: [], // A list or an object (or its JSON text). The editor reads it into its rows: the value of the page does not change.
    titleText: "", // The name of the value at the start of the path. "": texts.list or texts.object
    noteText: "", // A soft line under the title (Ex: what a row holds)
    columns: [], // [A COLUMN] (See A COLUMN above): the columns of an empty list; the kind and the choices of a column
    showTitleBar: "auto", // "auto": when there is a title, a note or a table opened in a cell. 1: always
    showHint: 1, // The keys of the cells at the bottom
    pictureBase: "", // The address the relative pictures of the cells are read from. "": the page
    ariaLabel: "", // "": the titleText
    texts: {
        list: "List",
        object: "Object",
        name: "name",
        value: "value",
        addRow: "Row",
        addColumn: "Column",
        addRowAtEnd: "Add a row",
        search: "Search the rows",
        table: "Table",
        json: "JSON",
        copyJson: "Copy as JSON",
        duplicate: "Duplicate",
        duplicateRows: "Duplicate {count} rows",
        moveUp: "Move up",
        moveDown: "Move down",
        delete: "Delete",
        deleteRows: "Delete {count} rows",
        undo: "Undo",
        redo: "Redo",
        addAbove: "Add a row above",
        addBelow: "Add a row below",
        sortUp: "Sort A → Z",
        sortDown: "Sort Z → A",
        firstOrder: "Back to the first order",
        rename: "Rename",
        type: "Type",
        moveLeft: "Move left",
        moveRight: "Move right",
        deleteColumn: "Delete the column",
        columnMenu: "The menu of the column",
        sortHint: "{title} · a click sorts",
        newName: "A new name…",
        columnName: "The name of the column",
        newColumnName: "The name of the new column",
        fromValues: "From its values",
        kindText: "Text",
        kindNumber: "Number",
        kindFlag: "On / off",
        kindColor: "Color",
        kindPicture: "Picture",
        empty: "(empty)",
        function: "ƒ function",
        pictureData: "(in the code: {kind}, {size} KB)",
        rowOfPath: "row {number} · {column}",
        rows: "{count} rows",
        oneRow: "1 row",
        shownRows: "{shown} of {count} rows",
        columns: "{count} columns",
        oneColumn: "1 column",
        hint: "Tab: next cell · Enter: next row · Cmd/Ctrl+V: rows from a spreadsheet or JSON",
        columnExists: "The column \"{name}\" is already there.",
        lastColumn: "A table keeps one column at least.",
        clearSearch: "Clear the search to move a row.",
        pasteList: "Paste a list into a list.",
        rowsAdded: "{count} rows added.",
        oneRowAdded: "1 row added.",
        linesPasted: "{count} lines pasted.",
        oneLinePasted: "1 line pasted.",
        rowsCopied: "{count} rows were copied.",
        oneRowCopied: "A row was copied.",
        jsonCopied: "The JSON was copied.",
        notJson: "Not JSON: {error}",
        objectNeeded: "An object is needed: { ... }",
        listNeeded: "A list is needed: [ ... ]",
        noName: "A row has no name.",
        sameName: "The name \"{name}\" is used twice.",
        cellValue: "The value of the cell",
        cancel: "Cancel", // The window (JsonEditor.open)
        apply: "Apply",
        discard: "Discard the changes?",
        close: "Close",
    },
    onChange: function (self, value) { }, // The value changed in the table: a list or an object. (Not at create time, not with setValue())
    onPickColor: null, // function (self, cell) { }: your own color picker for a color cell (See A CELL above). null: the one of the browser
    onPickPicture: null, // function (self, cell) { }: a list of pictures for a picture cell (a click on its picture). null: the address is written
    colorOf: null, // function (value, self) { return a color }: the color a swatch paints, when only the page can read it (Ex: a token of another document). null: the value
    optionsOf: null, // function (key, value, self) { return [choices] or null }: the choices of a text of this name (a column, a row of an object), besides columns
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to JsonEditor.styles
    style: { // Light style package (default)
        box: { color: "#FFFFFF", border: 1, borderColor: Black(0.12), round: 10 },
        colors: {
            text: "#1F2328", // The values
            headText: "#1F2328", // The titles of the columns
            soft: "#6B6F76", // The note, the counts
            dim: "#9EA2A8", // The numbers of the rows, an empty value, a function
            icon: "#5A5E66", // The icons of the toolbar
            line: "#EBEBEA", // The lines of the bars
            rowLine: "#EBEBEA", // Between the rows
            columnLine: "#EBEBEA", // Between the columns
            headLine: "#DEDEDC", // Under the titles of the columns
            strongLine: "#CFCFCC", // A switch that is off, the chosen part of Table | JSON
            ground: "#FFFFFF", // Behind the rows (the numbers of the rows take it: they stay over the cells)
            head: "#F7F7F5", // The titles of the columns
            field: "#F0F0EE", // A button, the search
            fieldHover: "#E6E6E3",
            fieldLine: "", // A line around a button and around Table | JSON. "": none
            fieldLineHover: "",
            hover: "#F3F6F9", // A row under the mouse
            selected: "#E1ECF9", // A chosen row
            segment: "#FFFFFF", // The chosen part of Table | JSON
            accent: "#0C8CE9", // The ring of a cell, Apply, a switch that is on
            accentHover: "#2E9DEC",
            accentText: "#0B6CB5", // + Add a row, the path, a list in a cell, the messages
            onAccent: "#FFFFFF",
            focus: "#0C8CE9", // The ring of the keyboard
            editor: "#FFFFFF", // The field of a cell
            knob: "#FFFFFF", // The knob of a switch that is off (on: onAccent)
            swatchLine: "rgba(0, 0, 0, 0.15)",
            thumb: "#8A8A8A", // Behind a small picture: black and white icons both show on it
            scrollBar: Black(0.2),
            scrollBarHover: Black(0.35),
            placeholder: Black(0.38),
        },
        fontSize: 12,
        headFontSize: 12, // The titles of the columns
        titleFontSize: 14,
        codeFontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        rowHeight: 30,
        headHeight: 32,
        popupShadow: "0 6px 18px rgba(0, 0, 0, 0.18)", // The field of a new name
        searchStyleName: "ozden", // The package of the search (SearchInput.styles)
        search: { // Over that package
            height: 28,
            fontSize: 12,
            searchIconSize: 14,
            searchIconLeft: 8,
            searchIconGap: 6,
            clearIconRight: 8,
            round: 6,
            color: "#F0F0EE",
            border: 0,
            borderBottomStyle: "none",
            textOffsetY: 0,
            clearIconOffsetY: 0,
        },
        menuStyleName: "light", // The package of the menus (ContextMenu.styles)
        window: { // JsonEditor.open()
            coverColor: Black(0.35),
            shadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
            zIndex: 3900, // WHY: under a Dialog (4000): a dialog the page opens from the window comes over it
            margin: 24,
            narrowMargin: 8, // On a page narrower than 600 px
        },
    },
};

const JsonEditor = function (params = {}) {

    // Merge style package: params.style > JsonEditor.styles[styleName] > JsonEditorDefaults.style (light)
    basic.applyStylePackage(params, JsonEditor.styles, JsonEditorDefaults);

    // Merge params:
    mergeIntoIfMissing(params, JsonEditorDefaults);

    // Edit params:
    params.value = JsonEditor.rootValueOf(params.value);
    params.columns = (Array.isArray(params.columns)) ? params.columns.slice() : [];

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const C = _s.colors;
    const SIZE = JsonEditor.SIZES;
    const PLAIN_KEY = JsonEditor.PLAIN_KEY;
    const NAME_KEY = JsonEditor.NAME_KEY;
    const VALUE_KEY = JsonEditor.VALUE_KEY;
    const ROW = _s.rowHeight;
    const HEAD = _s.headHeight;
    const GUTTER = SIZE.HANDLE_WIDTH + SIZE.NUMBER_WIDTH;
    const LETTER_WIDTH = _s.fontSize * 0.58; // About the width of a letter of a cell: the first width of a column
    const looks = JsonEditor.looksOf(_s);

    const levels = []; // The table of the value and the cells opened in it: { name, rows, columns, undoList... }
    let level = null; // The table in sight
    let viewRows = []; // The rows of the level after the search
    let searchText = "";
    let editing = null; // The cell being written: { rowId, columnKey, startText }
    let isJsonView = false;
    let jsonStartText = "";
    let hoveredRowId = null;
    let drawnFirst = -1;
    let drawnLast = -1;
    let rowsLayer = null;
    let rowViews = new Map(); // The rows in sight: id -> { box, gutter, end }
    let dragRow = null;
    let menu = null;

    // The parts of the view
    let groupPath = null;
    let lblNote = null;
    let headBox = null;
    let headInner = null;
    let scroller = null;
    let content = null;
    let activeRing = null;
    let dropLine = null;
    let editorBox = null;
    let editorArea = null;
    let colorInput = null;
    let jsonBox = null;
    let jsonArea = null;
    let lblInfo = null;
    let lblStatus = null;
    let searchInput = null;
    let viewSwitch = null;
    let viewSwitchHolder = null;
    let btnAddColumn = null;
    let btnDuplicate = null;
    let btnDelete = null;
    let btnUp = null;
    let btnDown = null;
    let btnUndo = null;
    let btnRedo = null;
    let tableTools = []; // The parts of the toolbar that the JSON view hides

    // *** PUBLIC VARIABLES:
    box.errorText = ""; // Why the table can not make a value now (a name used twice...). "": it can
    box.isChanged = 0; // 1: something was changed since the value was given (create, setValue)
    // NOTE: Default values are also public variables. (box.value, box.titleText, box.columns...)
    // NOTE: box.titleBar, box.titleRow, box.toolbar and box.footer take objects of the page: createIn(editor.footer, ...)

    // *** PRIVATE FUNCTIONS:

    // A text of texts with its values: textOf("rows", { count: 3 }) -> "3 rows"
    const textOf = function (name, values) {
        return JsonEditor.fillText(box.texts[name], values);
    };

    const messageOf = function (error) {
        if (error.textKey) return textOf(error.textKey, { name: error.valueName });
        return error.message;
    };

    // What the page said about a column of the table in sight (columns; a cell opened in it: the columns of its column).
    const hintOf = function (key) {
        return level.hints.find(function (hint) { return hint.key === key; }) || null;
    };

    const titleOf = function (column) {
        if (column.key === PLAIN_KEY || column.key === VALUE_KEY) return box.texts.value;
        if (column.key === NAME_KEY) return box.texts.name;
        if (/^\d+$/.test(column.key)) return String(Number(column.key) + 1);
        return column.key;
    };

    // The text a cell shows.
    const shownTextOf = function (value) {
        if (typeof value === "function") return box.texts.function;
        return JsonEditor.textOfValue(value);
    };

    // A point of the mouse in an element, in the px of the page (page.fit() zooms the page).
    const pointIn = function (event, elem) {
        const rect = elem.getBoundingClientRect();
        return { x: withPageZoom(event.clientX - rect.left), y: withPageZoom(event.clientY - rect.top) };
    };

    // *** THE LEVELS: a cell that holds a list or an object opens as a table of its own, and goes back into its cell.

    // hints: [A COLUMN]. openedCell: { rowId, columnKey } of the cell in the level under it. (null: the value of the page)
    const openLevel = function (name, value, hints, openedCell) {
        const data = JsonEditor.levelOf(value, hints);
        data.name = name;
        data.hints = hints;
        data.openedCell = openedCell;
        data.undoList = [];
        data.redoList = [];
        data.selected = new Set();
        data.active = null; // { rowId, columnKey }
        data.sort = null; // { key, direction, order: the ids before the sort }
        data.scrollTop = 0;
        data.scrollLeft = 0;
        levels.push(data);
        level = data;
        fitColumns();
        showLevel();
    };

    // Back to the level at this place: each level goes into its cell.
    const closeLevelsTo = function (index) {
        if (!commitEdit()) return false;
        while (levels.length - 1 > index) {
            let value;
            try {
                value = JsonEditor.valueOfLevel(level);
            } catch (error) {
                showStatus(messageOf(error));
                return false;
            }
            const finished = levels.pop();
            level = levels[levels.length - 1];
            if (finished.undoList.length) writeIntoCell(finished.openedCell, value);
        }
        showLevel();
        return true;
    };

    // The value of a closed level goes into its cell: one step of the undo of the level under it.
    const writeIntoCell = function (cell, value) {
        level.undoList.push(copyOfLevel(level));
        level.redoList = [];
        const row = rowById(cell.rowId);
        if (row) row.cells[cell.columnKey] = value;
    };

    // The value of the whole table. The levels that are open go into their cells here (when they close, for real).
    // Throws when a table can not make a value (a name used twice).
    const readValue = function () {
        const top = levels[levels.length - 1];
        let value = JsonEditor.valueOfLevel(top);
        let isChangedAbove = (top.undoList.length > 0);
        for (let i = levels.length - 1; i > 0; i--) {
            const below = levels[i - 1];
            const openCell = { rowId: levels[i].openedCell.rowId, columnKey: levels[i].openedCell.columnKey, value: value };
            value = JsonEditor.valueOfLevel(below, (isChangedAbove) ? openCell : null);
            isChangedAbove = isChangedAbove || below.undoList.length > 0;
        }
        return value;
    };

    // After a change of the data: the value goes to the page. A table that can not make a value says why (not while a
    // cell is being written: a new row of an object has no name until its name is written).
    const reportChange = function () {
        let value;
        try {
            value = readValue();
        } catch (error) {
            box.errorText = messageOf(error);
            if (!editing) showStatus(box.errorText);
            return;
        }
        box.errorText = "";
        box.value = value;
        box.onChange(box, value);
    };

    const showLevel = function () {
        searchText = "";
        searchInput.setValue("", 1);
        drawPath();
        drawHead();
        refreshViewRows();
        scroller.elem.scrollTop = level.scrollTop;
        scroller.elem.scrollLeft = level.scrollLeft;
        syncHead();
        drawRows(true);
        placeActive();
        paintButtons();
    };

    // *** HISTORY: inside the editor. A step is a copy of the rows and the columns.

    const copyOfLevel = function (source) {
        return {
            rows: source.rows.map(function (row) { return { id: row.id, shape: row.shape, cells: Object.assign({}, row.cells) }; }),
            columns: source.columns.map(function (column) { return Object.assign({}, column); }),
        };
    };

    const remember = function () {
        level.undoList.push(copyOfLevel(level));
        if (level.undoList.length > SIZE.HISTORY_LIMIT) level.undoList.shift();
        level.redoList = [];
        box.isChanged = 1;
        showStatus("");
    };

    const goToStep = function (fromList, toList) {
        if (!fromList.length) return;
        commitEdit();
        toList.push(copyOfLevel(level));
        const step = fromList.pop();
        level.rows = step.rows;
        level.columns = step.columns;
        level.selected.clear();
        level.sort = null;
        drawHead();
        finishChange();
    };

    const undo = function () { goToStep(level.undoList, level.redoList); };
    const redo = function () { goToStep(level.redoList, level.undoList); };

    // *** ROWS AND COLUMNS:

    const refreshViewRows = function () {
        const word = searchText.trim().toLowerCase();
        viewRows = level.rows.filter(function (row) {
            if (!word) return true;
            return Object.keys(row.cells).some(function (key) {
                return JsonEditor.textOfValue(row.cells[key]).toLowerCase().indexOf(word) !== -1;
            });
        });
    };

    const afterRowsChange = function () {
        refreshViewRows();
        drawRows(true);
        placeActive();
        paintButtons();
    };

    // The data changed: draw it, and give the value to the page.
    const finishChange = function () {
        afterRowsChange();
        reportChange();
    };

    const rowById = function (id) {
        return level.rows.find(function (row) { return row.id === id; }) || null;
    };

    const columnByKey = function (key) {
        return level.columns.find(function (column) { return column.key === key; }) || null;
    };

    const isIndexTable = function () {
        return level.rows.some(function (row) { return row.shape === "array"; });
    };

    // A new row has the shape of the table.
    const newRow = function () {
        if (level.isObject) {
            const cells = {};
            cells[NAME_KEY] = "";
            cells[VALUE_KEY] = "";
            return JsonEditor.newRow("pair", cells);
        }
        if (isIndexTable()) return JsonEditor.newRow("array", {});
        const isPlainTable = (level.columns.length === 1 && level.columns[0].key === PLAIN_KEY);
        return JsonEditor.newRow((isPlainTable) ? "plain" : "object", {});
    };

    // WHY the first cell opens: + is usually followed by the first value of the row.
    const addRow = function (place) {
        commitEdit();
        remember();
        searchText = "";
        searchInput.setValue("", 1);
        const row = newRow();
        const index = (place === undefined) ? level.rows.length : place;
        level.rows.splice(index, 0, row);
        level.selected.clear();
        afterRowsChange();
        const column = level.columns[0];
        setActive(row.id, column.key);
        scrollToActive();
        startEdit(row, column);
        reportChange();
    };

    const selectedRows = function () {
        const list = level.rows.filter(function (row) { return level.selected.has(row.id); });
        if (list.length) return list;
        const active = level.active && rowById(level.active.rowId);
        return (active) ? [active] : [];
    };

    const deleteRows = function (rows) {
        if (!rows.length) return;
        commitEdit();
        remember();
        const ids = new Set(rows.map(function (row) { return row.id; }));
        const firstIndex = level.rows.findIndex(function (row) { return ids.has(row.id); });
        level.rows = level.rows.filter(function (row) { return !ids.has(row.id); });
        level.selected.clear();
        const next = level.rows[Math.min(firstIndex, level.rows.length - 1)];
        level.active = (next && level.active) ? { rowId: next.id, columnKey: level.active.columnKey } : null;
        finishChange();
    };

    const duplicateRows = function (rows) {
        if (!rows.length) return;
        commitEdit();
        remember();
        let lastCopy = null;
        rows.forEach(function (row) {
            lastCopy = JsonEditor.newRow(row.shape, Object.assign({}, row.cells));
            if (level.isObject) lastCopy.cells[NAME_KEY] = String(row.cells[NAME_KEY]) + "Copy";
            level.rows.splice(level.rows.indexOf(row) + 1, 0, lastCopy);
        });
        level.selected.clear();
        if (level.active) level.active.rowId = lastCopy.id;
        finishChange();
    };

    // direction: -1 up, 1 down. The rows move together and keep their order.
    const moveRows = function (rows, direction) {
        if (!rows.length) return;
        commitEdit();
        const indexes = rows.map(function (row) { return level.rows.indexOf(row); }).sort(function (a, b) { return a - b; });
        const isAtEnd = (direction < 0) ? indexes[0] === 0 : indexes[indexes.length - 1] === level.rows.length - 1;
        if (isAtEnd) return;
        remember();
        const ordered = (direction < 0) ? indexes : indexes.slice().reverse();
        ordered.forEach(function (index) {
            const row = level.rows.splice(index, 1)[0];
            level.rows.splice(index + direction, 0, row);
        });
        level.sort = null;
        drawHead();
        finishChange();
        scrollToActive();
    };

    const setCell = function (row, columnKey, value) {
        if (value === undefined) delete row.cells[columnKey];
        else row.cells[columnKey] = value;
    };

    const addColumn = function (name) {
        const key = String(name).trim();
        if (!key) return;
        if (columnByKey(key)) {
            showStatus(textOf("columnExists", { name: key }));
            return;
        }
        commitEdit();
        remember();
        level.columns.push(JsonEditor.newColumn(key, hintOf(key)));
        fitColumns();
        drawHead();
        afterRowsChange();
    };

    // A list of lists: the next place. Else a name.
    const addColumnFromButton = function (button) {
        if (level.isObject) return;
        if (isIndexTable()) {
            const used = level.columns.map(function (column) { return Number(column.key); }).filter(function (key) { return !isNaN(key); });
            addColumn(String(Math.max.apply(null, used.concat([-1])) + 1));
            return;
        }
        openColumnChooser(button);
    };

    const deleteColumn = function (column) {
        if (level.columns.length <= 1) {
            showStatus(box.texts.lastColumn);
            return;
        }
        commitEdit();
        remember();
        level.columns = level.columns.filter(function (item) { return item !== column; });
        level.rows.forEach(function (row) { delete row.cells[column.key]; });
        fitColumns();
        drawHead();
        finishChange();
    };

    // WHY the plain column has its own rename: its rows become objects with that name ("A" -> { text: "A" }).
    const renameColumn = function (column, typedName) {
        const name = String(typedName).trim();
        if (!name || name === column.key) return;
        if (columnByKey(name)) {
            showStatus(textOf("columnExists", { name: name }));
            return;
        }
        commitEdit();
        remember();
        level.rows.forEach(function (row) {
            if (row.shape === "plain") row.shape = "object";
            if (column.key in row.cells) {
                row.cells[name] = row.cells[column.key];
                delete row.cells[column.key];
            }
        });
        column.key = name;
        drawHead();
        finishChange();
    };

    const moveColumn = function (column, direction) {
        const index = level.columns.indexOf(column);
        const target = index + direction;
        if (target < 0 || target >= level.columns.length) return;
        remember();
        level.columns.splice(index, 1);
        level.columns.splice(target, 0, column);
        drawHead();
        finishChange();
    };

    // direction: "asc", "desc", or "" (the first order)
    const sortBy = function (column, direction) {
        commitEdit();
        remember();
        const isSameKey = (level.sort && level.sort.key === column.key);
        const firstOrder = (isSameKey) ? level.sort.order : level.rows.map(function (row) { return row.id; });
        const compare = function (a, b) { return JsonEditor.compareValues(a.cells[column.key], b.cells[column.key]); };
        if (direction === "asc") level.rows.sort(compare);
        if (direction === "desc") level.rows.sort(function (a, b) { return compare(b, a); });
        if (direction === "") {
            const placeOf = function (row) {
                const place = firstOrder.indexOf(row.id);
                return (place === -1) ? firstOrder.length : place;
            };
            level.rows.sort(function (a, b) { return placeOf(a) - placeOf(b); });
        }
        level.sort = (direction) ? { key: column.key, direction: direction, order: firstOrder } : null;
        drawHead();
        finishChange();
    };

    // A click on a title: A-Z, Z-A, the first order.
    const sortNext = function (column) {
        const now = (level.sort && level.sort.key === column.key) ? level.sort.direction : "";
        const next = { "": "asc", asc: "desc", desc: "" };
        sortBy(column, next[now]);
    };

    // *** THE KIND OF A CELL:

    const valuesOfColumn = function (column) {
        const values = [];
        level.rows.forEach(function (row) {
            const value = row.cells[column.key];
            if (value !== undefined && value !== null) values.push(value);
        });
        return values;
    };

    const kindOfColumn = function (column) {
        if (column.chosenKind) return column.chosenKind;
        if (column.options) return "option";
        const values = valuesOfColumn(column);
        const kind = JsonEditor.kindOfColumnValues(column.key, values);
        // WHY only a text: a color, a number or a switch keeps its own editor.
        const isText = (kind === "text" || kind === "auto");
        if (isText && askOptions(column.key, values[0]).length) return "option";
        return kind;
    };

    // An object: the kind of a value comes from its own name, not from its column.
    const kindOfCell = function (row, column) {
        const value = row.cells[column.key];
        if (typeof value === "function" || JsonEditor.isOtherObject(value)) return "function";
        if (JsonEditor.isNestedValue(value)) return "nested";
        if (column.key === NAME_KEY) return "text";
        if (column.key === VALUE_KEY) return kindOfNamedCell(row);
        return column.kindNow || "text";
    };

    const kindOfNamedCell = function (row) {
        const name = String(row.cells[NAME_KEY] ?? "");
        const value = row.cells[VALUE_KEY];
        const hint = hintOf(name);
        if (hint && hint.kind) return hint.kind;
        if (hint && hint.options) return "option";
        const kind = JsonEditor.kindOfNamedValue(name, value);
        if (kind === "color" || kind === "picture" || kind === "flag") return kind;
        const isText = (kind === "text" || kind === "any");
        if (isText && askOptions(name, value).length) return "option";
        return (typeof value === "number") ? "number" : "auto";
    };

    // The choices of a cell: the columns of the page (columns), else optionsOf. [] when it has none.
    const optionsOfCell = function (row, column) {
        const isNamed = (column.key === VALUE_KEY);
        const key = (isNamed) ? String(row.cells[NAME_KEY] ?? "") : column.key;
        const hint = (isNamed) ? hintOf(key) : column;
        if (hint && hint.options) return hint.options;
        return askOptions(key, row.cells[column.key]);
    };

    // The choices optionsOf gives for a value of this name. [] when there are none (or the name is one of the table).
    const askOptions = function (key, value) {
        if (!box.optionsOf || JsonEditor.isOwnKey(key)) return [];
        const options = box.optionsOf(key, value, box);
        return (Array.isArray(options)) ? options : [];
    };

    // The color a swatch paints (colorOf: a color only the page can read).
    const paintedColorOf = function (value) {
        const text = String(value ?? "").trim();
        if (!box.colorOf || !text) return text;
        return String(box.colorOf(text, box) || text);
    };

    // The typed text of a cell -> its value. It keeps the type the cell had when it can.
    const valueOfCellText = function (text, row, column) {
        const old = row.cells[column.key];
        const kind = kindOfCell(row, column);
        const isAlwaysThere = (column.key === NAME_KEY || column.key === VALUE_KEY || column.key === PLAIN_KEY || row.shape === "array");
        if (text === "") return (isAlwaysThere) ? "" : undefined;
        if (column.key === NAME_KEY) return text;
        if (text === "null") return null;
        const number = JsonEditor.numberOfText(text);
        if (typeof old === "number" || kind === "number") return (number !== null) ? number : text;
        if (typeof old === "boolean") {
            if (text === "true" || text === "1") return true;
            if (text === "false" || text === "0") return false;
        }
        if (kind === "flag") {
            if (text === "1" || text === "true") return 1;
            if (text === "0" || text === "false") return 0;
        }
        const isTextBefore = (typeof old === "string" && old !== "");
        if (kind === "auto" && isTextBefore) return text;
        if (kind === "nested" || kind === "auto") return JsonEditor.jsonOrText(text);
        const isOptionNumber = (number !== null && optionsOfCell(row, column).indexOf(number) !== -1);
        if (kind === "option" && isOptionNumber) return number;
        return text;
    };

    // *** THE WIDTHS OF THE COLUMNS: from what they hold; the free room goes to the columns that were not sized by hand.

    const measuredWidth = function (column) {
        let longest = titleOf(column).length + 3;
        const kind = kindOfColumn(column);
        level.rows.slice(0, SIZE.MEASURED_ROWS).forEach(function (row) {
            longest = Math.max(longest, shownTextOf(row.cells[column.key]).length);
        });
        const hasIcon = (kind === "color" || kind === "picture" || kind === "option");
        const extra = (hasIcon) ? SIZE.CELL_ICON_ROOM : 0;
        const width = longest * LETTER_WIDTH + SIZE.CELL_TEXT_ROOM + extra;
        return Math.max(SIZE.MIN_COLUMN, Math.min(SIZE.MAX_AUTO_COLUMN, width));
    };

    const fitColumns = function () {
        const room = Math.max(0, scroller.elem.clientWidth - GUTTER - SIZE.END_WIDTH);
        level.columns.forEach(function (column) {
            column.kindNow = kindOfColumn(column);
            if (!column.isSized) column.width = measuredWidth(column);
        });
        const total = level.columns.reduce(function (sum, column) { return sum + column.width; }, 0);
        const free = level.columns.filter(function (column) { return !column.isSized; });
        if (total < room && free.length) {
            const extra = Math.floor((room - total) / free.length);
            free.forEach(function (column) { column.width += extra; });
        }
        allowSideScroll(total > room);
    };

    // The bar under the rows only when the columns do not fit.
    // WHY: with the bar always allowed, a narrower table showed it for a moment (its columns were the wider ones) and lost
    //      it when they were fitted: the scroller changed its size again in the same frame (WebKit, where a scroll bar
    //      takes room: "ResizeObserver loop completed with undelivered notifications").
    const allowSideScroll = function (isWider) {
        scroller.scrollX = (isWider) ? 1 : 0;
    };

    const totalWidth = function () {
        return GUTTER + SIZE.END_WIDTH + level.columns.reduce(function (sum, column) { return sum + column.width; }, 0);
    };

    const leftOfColumn = function (columnKey) {
        let left = GUTTER;
        for (let i = 0; i < level.columns.length; i++) {
            if (level.columns[i].key === columnKey) return left;
            left += level.columns[i].width;
        }
        return left;
    };

    // *** THE HEAD OF THE TABLE:

    const drawHead = function () {
        level.columns.forEach(function (column) { column.kindNow = kindOfColumn(column); });
        if (headInner) headInner.remove();
        createIn(headBox, function () {
            // GROUP: The titles (they move with the table)
            headInner = HGroup({ left: GUTTER, top: 0, width: totalWidth() - GUTTER, height: HEAD, align: "left center", gap: 0, color: "transparent" });
            headInner.clipContent = 0;
                level.columns.forEach(drawHeadCell);
            endGroup();
        });
        syncHead();
    };

    const drawHeadCell = function (column) {
        const isSorted = (level.sort && level.sort.key === column.key);
        let arrow = "";
        if (isSorted) arrow = (level.sort.direction === "asc") ? " ↑" : " ↓";
        const title = titleOf(column);
        // GROUP: A title
        const cell = HGroup({ width: column.width, height: HEAD, align: "left center", gap: 0, padding: [SIZE.CELL_PADDING, 0], color: "transparent" });
        cell.shrink = 0;
        cell.css = { borderRight: "1px solid " + C.columnLine, boxSizing: "border-box", position: "relative" };
        cell.clickable = 1;
        cell.cursor = "pointer";
            const lbl = Label({ text: "", height: HEAD, fontSize: _s.headFontSize, textColor: (column.key === PLAIN_KEY) ? C.soft : C.headText, fontFamily: "opensans-bold", ellipsis: 1 });
            lbl.plainText = title + arrow;
            lbl.grow = 1;
            lbl.css = { minWidth: "0px", lineHeight: HEAD + "px" };
            // WHY no menu in an object: its two columns are its names and its values.
            if (!level.isObject) drawColumnMenuButton(column);
            // BOX: The edge that changes the width
            const edge = Box({
                left: column.width - SIZE.COLUMN_EDGE_WIDTH - 1,
                top: 0,
                width: SIZE.COLUMN_EDGE_WIDTH,
                height: HEAD,
                color: "transparent",
                clickable: 1,
                cursor: "col-resize",
            });
            edge.css = { position: "absolute" };
            connectColumnEdge(edge, column);
        endGroup();
        cell.elem.title = (column.note) ? title + ": " + column.note : textOf("sortHint", { title: title });
        cell.on("click", function (self, event) {
            if (event.target === cell.elem || event.target === lbl.elem) sortNext(column);
        });
    };

    // LABEL: ⌄ at the end of a title: the menu of the column
    const drawColumnMenuButton = function (column) {
        const btn = Label({
            text: JsonEditor.iconOf("chevron", SIZE.ICON),
            width: SIZE.HEAD_BUTTON_WIDTH,
            height: SIZE.HEAD_BUTTON_HEIGHT,
            color: "transparent",
            textColor: C.soft,
            round: 4,
            clickable: 1,
            cursor: "pointer",
            lineHeight: "0",
        });
        btn.shrink = 0;
        btn.css = { display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.12s" };
        btn.role = "button";
        btn.aria = { label: box.texts.columnMenu };
        btn.elem.title = box.texts.columnMenu;
        btn.onHoverChange(function (self, isOver) {
            btn.color = (isOver) ? C.fieldHover : "transparent";
            btn.textColor = (isOver) ? C.text : C.soft;
        });
        btn.on("click", function () { openColumnMenu(column, btn); });
    };

    // DRAG: the edge of a title. The window gets the moves: the head is drawn again with a new edge.
    const connectColumnEdge = function (edge, column) {
        edge.on("pointerdown", function (self, event) {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const startX = event.clientX;
            const startWidth = column.width;
            const removers = [];
            const onMove = function (self, moveEvent) {
                column.width = Math.max(SIZE.MIN_COLUMN, startWidth + withPageZoom(moveEvent.clientX - startX));
                column.isSized = true;
                allowSideScroll(totalWidth() > scroller.elem.clientWidth);
                drawHead();
                drawRows(true);
                placeActive();
            };
            const onUp = function () {
                removers.forEach(function (removeListener) { removeListener(); });
            };
            removers.push(box.listenTo(window, "pointermove", onMove));
            removers.push(box.listenTo(window, "pointerup", onUp));
            removers.push(box.listenTo(window, "pointercancel", onUp));
        });
    };

    const syncHead = function () {
        if (!headInner) return;
        headInner.css.transform = "translateX(" + (-scroller.elem.scrollLeft) + "px)";
    };

    // *** THE ROWS: only the ones in sight are drawn, so a long list stays fast.

    const drawRows = function (isForced) {
        const scrollTop = scroller.elem.scrollTop;
        const viewHeight = scroller.elem.clientHeight;
        const firstSeen = Math.floor(scrollTop / ROW);
        const lastSeen = Math.min(viewRows.length, Math.ceil((scrollTop + viewHeight) / ROW));
        const isDrawn = (firstSeen >= drawnFirst && lastSeen <= drawnLast);
        if (!isForced && isDrawn) return;
        drawnFirst = Math.max(0, firstSeen - SIZE.ROW_BUFFER);
        drawnLast = Math.min(viewRows.length, lastSeen + SIZE.ROW_BUFFER);
        const width = totalWidth();
        const height = (viewRows.length + 1) * ROW;
        content.width = width;
        content.height = height;
        if (rowsLayer) rowsLayer.remove();
        rowViews = new Map();
        rowsLayer = createIn(content, function () {
            // BOX: The rows in sight
            const layer = startBox(0, 0, width, height, { color: "transparent" });
            layer.clipContent = 0;
                for (let i = drawnFirst; i < drawnLast; i++) drawRow(viewRows[i], i);
                drawAddRow();
            endBox();
            return layer;
        });
        // WHY: the ring, the line and the field of a cell stay over the rows (they were made first).
        rowsLayer.zIndex = 0;
        paintCounts();
    };

    const drawRow = function (row, viewIndex) {
        const view = {};
        // GROUP: A row
        view.box = HGroup({ left: 0, top: viewIndex * ROW, width: totalWidth(), height: ROW, align: "left center", gap: 0, color: "transparent" });
        view.box.clipContent = 0;
        view.box.css = { borderBottom: "1px solid " + C.rowLine, boxSizing: "border-box" };
            view.gutter = drawGutter(row);
            level.columns.forEach(function (column) { drawCell(row, column); });
            view.end = drawRowEnd();
        endGroup();
        rowViews.set(row.id, view);
        paintRow(row.id);
    };

    // WHY the gutter and the end have the color of the row: they stay over the cells when the table moves to the side.
    const paintRow = function (rowId) {
        const view = rowViews.get(rowId);
        if (!view) return;
        const isHovered = (hoveredRowId === rowId);
        let back = "transparent";
        if (isHovered) back = C.hover;
        if (level.selected.has(rowId)) back = C.selected;
        const ground = (back === "transparent") ? C.ground : back;
        view.box.color = back;
        view.gutter.color = ground;
        view.end.color = ground;
        view.end.text = (isHovered) ? JsonEditor.iconOf("trash", SIZE.ICON) : "";
    };

    const paintRows = function () {
        rowViews.forEach(function (view, rowId) { paintRow(rowId); });
    };

    const drawGutter = function (row) {
        const place = level.rows.indexOf(row) + 1;
        // GROUP: The handle and the number. WHY sticky: they stay in sight when the table scrolls to the side.
        const gutter = HGroup({ width: GUTTER, height: ROW - 1, align: "left center", gap: 0, color: C.ground });
        gutter.shrink = 0;
        gutter.clipContent = 0;
        gutter.css = { position: "sticky", left: "0px", zIndex: "1" };
            const handle = Label({ text: JsonEditor.iconOf("dots", SIZE.ICON), width: SIZE.HANDLE_WIDTH, height: ROW - 1, textColor: C.dim, lineHeight: "0" });
            handle.shrink = 0;
            handle.css = { display: "flex", alignItems: "center", justifyContent: "center" };
            const lblNumber = Label({ text: String(place), width: SIZE.NUMBER_WIDTH - SIZE.NUMBER_SPACE, height: ROW - 1, fontSize: _s.fontSize - 1, textColor: C.dim });
            lblNumber.shrink = 0;
            lblNumber.css = { lineHeight: (ROW - 1) + "px", textAlign: "right" };
        endGroup();
        return gutter;
    };

    const drawRowEnd = function () {
        const end = Label({ text: "", width: SIZE.END_WIDTH, height: ROW - 1, color: C.ground, textColor: C.soft, lineHeight: "0" });
        end.shrink = 0;
        end.css = { display: "flex", alignItems: "center", justifyContent: "center", position: "sticky", right: "0px", zIndex: "1" };
        return end;
    };

    // GROUP: A cell. It does not take the mouse: the rows read the place of a click (hitOf).
    const drawCell = function (row, column) {
        const kind = kindOfCell(row, column);
        const value = row.cells[column.key];
        const cell = HGroup({ width: column.width, height: ROW - 1, align: "left center", gap: SIZE.CELL_GAP, padding: [SIZE.CELL_PADDING, 0], color: "transparent" });
        cell.shrink = 0;
        cell.css = { borderRight: "1px solid " + C.columnLine, boxSizing: "border-box" };
            if (kind === "flag" && value !== undefined && value !== null) drawSwitch(basic.isOn(value));
            if (kind === "color") drawSwatch(value);
            if (kind === "picture") drawThumb(value);
            drawCellText(kind, value);
            if (kind === "option") drawCellIcon("chevron");
            if (kind === "nested") drawCellIcon("table");
        endGroup();
    };

    // BOX: a small switch
    const drawSwitch = function (isOn) {
        const knobLeft = (isOn) ? SIZE.SWITCH_WIDTH - SIZE.SWITCH_KNOB - SIZE.SWITCH_SPACE : SIZE.SWITCH_SPACE;
        const toggle = startBox({ width: SIZE.SWITCH_WIDTH, height: SIZE.SWITCH_HEIGHT, round: SIZE.SWITCH_HEIGHT / 2, color: (isOn) ? C.accent : C.strongLine });
        toggle.shrink = 0;
        toggle.css = { position: "relative", left: "0px", top: "0px" };
            Box({ left: knobLeft, top: SIZE.SWITCH_SPACE, width: SIZE.SWITCH_KNOB, height: SIZE.SWITCH_KNOB, round: SIZE.SWITCH_KNOB / 2, color: (isOn) ? C.onAccent : C.knob });
        endBox();
    };

    // BOX: a color over a checkerboard (a transparent color shows it)
    const drawSwatch = function (value) {
        const color = paintedColorOf(value) || "transparent";
        const swatch = Box({ width: SIZE.SWATCH_SIZE, height: SIZE.SWATCH_SIZE, round: 3, color: "transparent" });
        swatch.shrink = 0;
        swatch.css = { position: "relative", left: "0px", top: "0px" };
        swatch.css.background = "linear-gradient(" + color + ", " + color + "), " + JsonEditor.CHECKER;
        swatch.boxShadow = "inset 0 0 0 1px " + C.swatchLine;
    };

    // BOX: a small picture
    const drawThumb = function (value) {
        const address = JsonEditor.pictureAddress(value, box.pictureBase);
        const thumb = Box({ width: SIZE.SWATCH_SIZE, height: SIZE.SWATCH_SIZE, round: 3, color: C.thumb });
        thumb.shrink = 0;
        thumb.css = { position: "relative", left: "0px", top: "0px", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
        if (address) thumb.css.backgroundImage = 'url("' + address.replace(/"/g, "%22") + '")';
    };

    const drawCellText = function (kind, value) {
        const lbl = Label({ text: "", height: ROW - 1, fontSize: _s.fontSize, textColor: C.text, ellipsis: 1 });
        lbl.grow = 1;
        lbl.css = { minWidth: "0px", lineHeight: (ROW - 1) + "px" };
        let text = shownTextOf(value);
        if (value === null || kind === "function") lbl.textColor = C.dim;
        if (kind === "picture") text = JsonEditor.shortPicture(text, box.texts.pictureData);
        if (kind === "nested") {
            text = JsonEditor.countTextOf(value);
            lbl.textColor = C.accentText;
        }
        lbl.plainText = text;
    };

    const drawCellIcon = function (iconName) {
        const icon = Label({ text: JsonEditor.iconOf(iconName, SIZE.ICON), width: SIZE.ICON, height: ROW - 1, textColor: C.dim, lineHeight: "0" });
        icon.shrink = 0;
        icon.css = { display: "flex", alignItems: "center" };
    };

    // GROUP: + at the end of the rows (it stays in sight when the table moves to the side, as the numbers of the rows)
    const drawAddRow = function () {
        const row = HGroup({ left: 0, top: viewRows.length * ROW, width: totalWidth(), height: ROW, align: "left center", color: "transparent" });
        row.clipContent = 0;
            const lbl = Label({ text: "", height: ROW, fontSize: _s.fontSize, textColor: C.accentText });
            lbl.plainText = (searchText.trim()) ? "" : "+  " + box.texts.addRowAtEnd;
            lbl.css = { position: "sticky", left: "0px", paddingLeft: SIZE.ADD_ROW_SPACE + "px", lineHeight: ROW + "px" };
        endGroup();
    };

    const paintCounts = function () {
        const rowCount = level.rows.length;
        const columnCount = level.columns.length;
        let rowsText = (rowCount === 1) ? box.texts.oneRow : textOf("rows", { count: rowCount });
        if (searchText.trim()) rowsText = textOf("shownRows", { shown: viewRows.length, count: rowCount });
        const columnsText = (columnCount === 1) ? box.texts.oneColumn : textOf("columns", { count: columnCount });
        lblInfo.plainText = rowsText + " · " + columnsText;
    };

    // *** THE ACTIVE CELL: a ring on it. Its text is written in a field over it.

    const setActive = function (rowId, columnKey) {
        level.active = { rowId: rowId, columnKey: columnKey };
        placeActive();
        paintButtons();
    };

    const viewIndexOfActive = function () {
        const active = level.active;
        if (!active) return -1;
        return viewRows.findIndex(function (row) { return row.id === active.rowId; });
    };

    const placeActive = function () {
        const viewIndex = viewIndexOfActive();
        const column = (level.active) ? columnByKey(level.active.columnKey) : null;
        if (viewIndex === -1 || !column) {
            activeRing.visible = 0;
            return;
        }
        activeRing.left = leftOfColumn(column.key);
        activeRing.top = viewIndex * ROW;
        activeRing.width = column.width;
        activeRing.height = ROW;
        activeRing.visible = 1;
    };

    const scrollToActive = function () {
        const viewIndex = viewIndexOfActive();
        const column = (level.active) ? columnByKey(level.active.columnKey) : null;
        if (viewIndex === -1 || !column) return;
        const view = scroller.elem;
        const top = viewIndex * ROW;
        if (top < view.scrollTop) view.scrollTop = top;
        if (top + ROW > view.scrollTop + view.clientHeight) view.scrollTop = top + ROW - view.clientHeight;
        const left = leftOfColumn(column.key);
        const right = left + column.width + SIZE.END_WIDTH;
        if (left - GUTTER < view.scrollLeft) view.scrollLeft = left - GUTTER;
        if (right > view.scrollLeft + view.clientWidth) view.scrollLeft = right - view.clientWidth;
        drawRows(false);
    };

    // A step across the rows and the columns of what is shown. Past the end of a row: the next row.
    const moveActive = function (rowStep, columnStep) {
        const active = level.active;
        if (!active || !viewRows.length) return false;
        let nextRow = viewIndexOfActive() + rowStep;
        let nextColumn = level.columns.findIndex(function (column) { return column.key === active.columnKey; }) + columnStep;
        if (nextColumn >= level.columns.length) {
            nextColumn = 0;
            nextRow++;
        }
        if (nextColumn < 0) {
            nextColumn = level.columns.length - 1;
            nextRow--;
        }
        if (nextRow < 0 || nextRow >= viewRows.length) return false;
        setActive(viewRows[nextRow].id, level.columns[nextColumn].key);
        scrollToActive();
        return true;
    };

    // *** WRITING IN A CELL:

    const startEdit = function (row, column, firstText) {
        if (kindOfCell(row, column) === "function") return;
        const text = JsonEditor.textOfValue(row.cells[column.key]);
        editing = { rowId: row.id, columnKey: column.key, startText: text };
        editorBox.left = leftOfColumn(column.key);
        editorBox.top = viewRows.indexOf(row) * ROW;
        editorBox.width = Math.max(column.width, SIZE.EDITOR_MIN_WIDTH);
        editorArea.value = (firstText !== undefined) ? firstText : text;
        fitEditorHeight();
        editorBox.visible = 1;
        editorArea.focus();
        editorArea.setSelectionRange(editorArea.value.length, editorArea.value.length);
    };

    const fitEditorHeight = function () {
        const lines = editorArea.value.split("\n").length;
        const shown = Math.min(lines, SIZE.EDITOR_MAX_LINES);
        editorBox.height = (shown <= 1) ? ROW : shown * SIZE.EDITOR_LINE_HEIGHT + SIZE.EDITOR_SPACE;
    };

    // Returns true: the cell is not being written any more.
    const commitEdit = function () {
        if (!editing) return true;
        const row = rowById(editing.rowId);
        const column = columnByKey(editing.columnKey);
        const text = editorArea.value;
        const startText = editing.startText;
        editing = null;
        editorBox.visible = 0;
        if (!row || !column || text === startText) return true;
        remember();
        setCell(row, column.key, valueOfCellText(text, row, column));
        level.sort = null;
        column.kindNow = kindOfColumn(column);
        drawHead();
        finishChange();
        return true;
    };

    const cancelEdit = function () {
        editing = null;
        editorBox.visible = 0;
        content.elem.focus({ preventScroll: true });
    };

    // A click on a cell: what it does comes from its kind.
    const pressCell = function (hit, event) {
        const row = hit.row;
        const column = hit.column;
        const kind = kindOfCell(row, column);
        setActive(row.id, column.key);
        if (kind === "flag") {
            toggleFlagCell(row, column);
            return;
        }
        if (kind === "nested") {
            openNestedCell(row, column);
            return;
        }
        const isOnSwatch = (hit.xInCell < SIZE.SWATCH_HIT);
        if (kind === "color" && isOnSwatch) {
            openColorCell(row, column, hit.viewIndex, event);
            return;
        }
        if (kind === "picture" && isOnSwatch && box.onPickPicture) {
            box.onPickPicture(box, cellOf(row, column, hit.viewIndex, event));
            return;
        }
        const isOnEnd = (hit.xInCell > column.width - SIZE.OPTION_HIT);
        if (kind === "option" && isOnEnd) {
            openOptionCell(row, column, event);
            return;
        }
        startEdit(row, column);
    };

    const toggleFlagCell = function (row, column) {
        commitEdit();
        remember();
        const value = row.cells[column.key];
        const isBoolean = (typeof value === "boolean");
        const on = (isBoolean) ? true : 1;
        const off = (isBoolean) ? false : 0;
        setCell(row, column.key, (basic.isOn(value)) ? off : on);
        finishChange();
    };

    const openNestedCell = function (row, column) {
        commitEdit();
        level.scrollTop = scroller.elem.scrollTop;
        level.scrollLeft = scroller.elem.scrollLeft;
        const place = level.rows.indexOf(row) + 1;
        let name = textOf("rowOfPath", { number: place, column: titleOf(column) });
        if (level.isObject) name = String(row.cells[NAME_KEY]);
        const hint = hintOf((level.isObject) ? name : column.key);
        const hints = (hint && Array.isArray(hint.columns)) ? hint.columns : [];
        openLevel(name, row.cells[column.key], hints, { rowId: row.id, columnKey: column.key });
    };

    // A cell for a picker (See A CELL above). The writes of one pick are one step of the undo.
    const cellOf = function (row, column, viewIndex, event) {
        const ownLevel = level;
        let isRemembered = false;
        const contentRect = content.elem.getBoundingClientRect();
        const left = contentRect.left + leftOfColumn(column.key) * page.zoom;
        const top = contentRect.top + viewIndex * ROW * page.zoom;
        const width = column.width * page.zoom;
        const height = ROW * page.zoom;
        return {
            value: row.cells[column.key],
            key: (column.key === VALUE_KEY) ? String(row.cells[NAME_KEY]) : column.key,
            title: titleOf(column),
            x: event.clientX,
            y: event.clientY,
            rect: { left: left, top: top, right: left + width, bottom: top + height, width: width, height: height },
            setValue: function (value) {
                // WHY: a picker of the page can stay open after the table of the cell was closed (or the editor removed).
                if (box._isRemoved || level !== ownLevel) return;
                if (!isRemembered) remember(); // WHY once: a picker writes while it is dragged
                isRemembered = true;
                setCell(row, column.key, value);
                finishChange();
            },
        };
    };

    // The color picker of the page (onPickColor), or the one of the browser at the cell. A drag in it changes the cell at once.
    const openColorCell = function (row, column, viewIndex, event) {
        const cell = cellOf(row, column, viewIndex, event);
        if (box.onPickColor) {
            box.onPickColor(box, cell);
            return;
        }
        colorInput.value = JsonEditor.hexOfColor(paintedColorOf(cell.value));
        colorInput.style.left = leftOfColumn(column.key) + "px";
        colorInput.style.top = (viewIndex + 1) * ROW + "px";
        colorInput.oninput = function () { cell.setValue(colorInput.value.toUpperCase()); };
        JsonEditor.openPicker(colorInput);
    };

    const openOptionCell = function (row, column, event) {
        const current = row.cells[column.key];
        const values = JsonEditor.optionValues(optionsOfCell(row, column), current);
        const items = values.map(function (value) {
            return {
                text: (value === "") ? box.texts.empty : String(value),
                checked: (value === current) ? 1 : 0,
                run: function () {
                    remember();
                    setCell(row, column.key, value);
                    finishChange();
                },
            };
        });
        openMenu(items, event.clientX, event.clientY);
    };

    // *** THE MOUSE ON THE ROWS: the objects of the rows do not take it, the place tells what was pressed.

    const hitOf = function (event) {
        const point = pointIn(event, content.elem);
        const xInView = pointIn(event, scroller.elem).x;
        const viewIndex = Math.floor(point.y / ROW);
        const hit = { viewIndex: viewIndex, row: viewRows[viewIndex] || null, part: "", column: null, xInCell: 0 };
        if (viewIndex >= viewRows.length) {
            hit.part = (xInView < SIZE.ADD_ROW_WIDTH) ? "add" : "";
            return hit;
        }
        if (!hit.row) return hit;
        const endLeft = Math.min(scroller.elem.clientWidth, totalWidth() - scroller.elem.scrollLeft) - SIZE.END_WIDTH;
        if (xInView < SIZE.HANDLE_WIDTH) hit.part = "handle";
        else if (xInView < GUTTER) hit.part = "number";
        else if (xInView >= endLeft) hit.part = "delete";
        if (hit.part) return hit;
        let left = 0;
        const x = point.x - GUTTER;
        for (let i = 0; i < level.columns.length; i++) {
            const column = level.columns[i];
            if (x < left + column.width) {
                hit.part = "cell";
                hit.column = column;
                hit.xInCell = x - left;
                break;
            }
            left += column.width;
        }
        return hit;
    };

    const selectRowByNumber = function (row, event) {
        const isAdding = (event.metaKey || event.ctrlKey);
        if (event.shiftKey && level.active) {
            const from = level.rows.findIndex(function (item) { return item.id === level.active.rowId; });
            const to = level.rows.indexOf(row);
            const start = Math.min(from, to);
            const end = Math.max(from, to);
            level.selected.clear();
            level.rows.slice(start, end + 1).forEach(function (item) { level.selected.add(item.id); });
        } else if (isAdding) {
            if (level.selected.has(row.id)) level.selected.delete(row.id);
            else level.selected.add(row.id);
        } else {
            const isOnlyThis = (level.selected.size === 1 && level.selected.has(row.id));
            level.selected.clear();
            if (!isOnlyThis) level.selected.add(row.id);
        }
        const columnKey = (level.active) ? level.active.columnKey : level.columns[0].key;
        if (!event.shiftKey) level.active = { rowId: row.id, columnKey: columnKey };
        paintRows();
        placeActive();
        paintButtons();
    };

    const onContentClick = function (self, event) {
        if (dragRow) return;
        if (event.target === editorArea) return;
        const hit = hitOf(event);
        commitEdit();
        if (hit.part === "add") {
            if (!searchText.trim()) addRow();
            return;
        }
        if (!hit.row) return;
        if (hit.part === "number") selectRowByNumber(hit.row, event);
        if (hit.part === "delete") deleteRows([hit.row]);
        if (hit.part === "cell") pressCell(hit, event);
        if (hit.part !== "cell") content.elem.focus({ preventScroll: true });
    };

    const onContentMove = function (self, event) {
        const hit = hitOf(event);
        const nextId = (hit.row) ? hit.row.id : null;
        let cursor = "pointer";
        if (hit.part === "handle") cursor = "grab";
        if (hit.part === "cell") cursor = "text";
        content.cursor = cursor;
        if (nextId === hoveredRowId) return;
        const previousId = hoveredRowId;
        hoveredRowId = nextId;
        paintRow(previousId);
        paintRow(nextId);
    };

    // DRAG: the handle of a row: a line shows its new place. Not while a search hides rows: the place would be a guess.
    const startRowDrag = function (event, row) {
        if (searchText.trim()) {
            showStatus(box.texts.clearSearch);
            return;
        }
        event.preventDefault();
        commitEdit();
        dragRow = { row: row, place: level.rows.indexOf(row) };
        const removers = [];
        const onMove = function (self, moveEvent) {
            const viewRect = scroller.elem.getBoundingClientRect();
            if (moveEvent.clientY < viewRect.top + SIZE.DRAG_SCROLL_EDGE) scroller.elem.scrollTop -= SIZE.DRAG_SCROLL_STEP;
            if (moveEvent.clientY > viewRect.bottom - SIZE.DRAG_SCROLL_EDGE) scroller.elem.scrollTop += SIZE.DRAG_SCROLL_STEP;
            const place = Math.round(pointIn(moveEvent, content.elem).y / ROW);
            dragRow.place = Math.max(0, Math.min(level.rows.length, place));
            dropLine.top = Math.max(0, dragRow.place * ROW - 1);
            dropLine.width = totalWidth();
            dropLine.visible = 1;
        };
        const onUp = function () {
            removers.forEach(function (removeListener) { removeListener(); });
            dropLine.visible = 0;
            finishRowDrag();
            // WHY after the click of this pointerup: it must not act on the row under the mouse.
            box.after(0, function () { dragRow = null; });
        };
        removers.push(box.listenTo(window, "pointermove", onMove));
        removers.push(box.listenTo(window, "pointerup", onUp));
        removers.push(box.listenTo(window, "pointercancel", onUp));
    };

    const finishRowDrag = function () {
        const from = level.rows.indexOf(dragRow.row);
        const to = (dragRow.place > from) ? dragRow.place - 1 : dragRow.place;
        if (to === from) return;
        remember();
        level.rows.splice(from, 1);
        level.rows.splice(to, 0, dragRow.row);
        level.sort = null;
        const columnKey = (level.active) ? level.active.columnKey : level.columns[0].key;
        level.active = { rowId: dragRow.row.id, columnKey: columnKey };
        drawHead();
        finishChange();
    };

    // *** MENUS:

    const openMenu = function (items, x, y) {
        if (!menu) {
            menu = box.own(createIn(page, function () {
                return ContextMenu({ styleName: _s.menuStyleName, minWidth: SIZE.MENU_MIN_WIDTH, onClick: runMenuItem });
            }));
        }
        menu.setItems(items);
        menu.openAt(x, y, box);
    };

    const runMenuItem = function (self, item) {
        if (item.run) item.run();
    };

    const openRowMenu = function (row, x, y) {
        const place = level.rows.indexOf(row);
        const rows = (level.selected.has(row.id)) ? selectedRows() : [row];
        const isMany = (rows.length > 1);
        const count = { count: rows.length };
        openMenu([
            { text: box.texts.addAbove, run: function () { addRow(place); } },
            { text: box.texts.addBelow, run: function () { addRow(place + 1); } },
            "-",
            { text: (isMany) ? textOf("duplicateRows", count) : box.texts.duplicate, shortcut: "Cmd/Ctrl+D", run: function () { duplicateRows(rows); } },
            { text: box.texts.moveUp, shortcut: "Alt+↑", run: function () { moveRows(rows, -1); } },
            { text: box.texts.moveDown, shortcut: "Alt+↓", run: function () { moveRows(rows, 1); } },
            "-",
            { text: (isMany) ? textOf("deleteRows", count) : box.texts.delete, run: function () { deleteRows(rows); } },
        ], x, y);
    };

    const openColumnMenu = function (column, button) {
        const rect = button.elem.getBoundingClientRect();
        const kindTexts = { "": "fromValues", text: "kindText", number: "kindNumber", flag: "kindFlag", color: "kindColor", picture: "kindPicture" };
        const typeItems = JsonEditor.TYPES.map(function (type) {
            return {
                text: box.texts[kindTexts[type]],
                checked: ((column.chosenKind || "") === type) ? 1 : 0,
                run: function () {
                    remember();
                    column.chosenKind = type;
                    column.kindNow = kindOfColumn(column);
                    afterRowsChange();
                },
            };
        });
        const canRename = (!/^\d+$/.test(column.key));
        openMenu([
            { text: box.texts.sortUp, run: function () { sortBy(column, "asc"); } },
            { text: box.texts.sortDown, run: function () { sortBy(column, "desc"); } },
            { text: box.texts.firstOrder, enabled: (level.sort) ? 1 : 0, run: function () { sortBy(column, ""); } },
            "-",
            { text: box.texts.rename, enabled: (canRename) ? 1 : 0, run: function () { openColumnNamer(column); } },
            { text: box.texts.type, items: typeItems },
            { text: box.texts.moveLeft, run: function () { moveColumn(column, -1); } },
            { text: box.texts.moveRight, run: function () { moveColumn(column, 1); } },
            "-",
            { text: box.texts.deleteColumn, run: function () { deleteColumn(column); } },
        ], rect.left, rect.bottom + SIZE.MENU_SPACE);
    };

    // A small field for a name, over the table: rect is a place on the screen. onDone(text)
    const askName = function (rect, placeholder, value, onDone) {
        let isFinished = false;
        const boxRect = box.elem.getBoundingClientRect();
        const field = createIn(box, function () {
            // GROUP: The field
            const group = HGroup({
                left: withPageZoom(rect.left - boxRect.left),
                top: withPageZoom(rect.top - boxRect.top),
                width: SIZE.NAME_FIELD_WIDTH,
                height: SIZE.NAME_FIELD_HEIGHT,
                align: "left center",
                color: C.editor,
                round: 5,
                border: 1,
                borderColor: C.accent,
            });
            group.zIndex = SIZE.NAME_FIELD_Z_INDEX;
            group.boxShadow = _s.popupShadow;
            endGroup();
            return group;
        });
        const input = createField(field, "input");
        input.value = value;
        input.placeholder = placeholder;
        input.style.padding = "0px 6px";
        const finish = function (text) {
            if (isFinished) return;
            isFinished = true;
            field.remove();
            if (text !== null) onDone(text);
        };
        input.addEventListener("keydown", function (event) {
            event.stopPropagation();
            if (event.key === "Enter") finish(input.value);
            if (event.key === "Escape") finish(null);
        });
        input.addEventListener("blur", function () { finish(input.value); });
        input.focus();
        input.select();
    };

    const openColumnNamer = function (column) {
        const contentRect = content.elem.getBoundingClientRect();
        const viewRect = scroller.elem.getBoundingClientRect();
        const left = contentRect.left + leftOfColumn(column.key) * page.zoom;
        const value = (column.key === PLAIN_KEY) ? "" : column.key;
        const place = { left: Math.max(viewRect.left, left), top: viewRect.top - (HEAD - 2) * page.zoom };
        askName(place, box.texts.columnName, value, function (text) {
            renameColumn(column, text);
        });
    };

    // + Column: the names the page gave (columns), or a new one.
    const openColumnChooser = function (button) {
        const rect = button.elem.getBoundingClientRect();
        const free = level.hints.filter(function (hint) { return !columnByKey(hint.key); });
        const askNewName = function () {
            askName({ left: rect.left, top: rect.bottom + SIZE.MENU_SPACE }, box.texts.newColumnName, "", addColumn);
        };
        if (!free.length) {
            askNewName();
            return;
        }
        const items = free.map(function (hint) {
            return { text: hint.key, run: function () { addColumn(hint.key); } };
        });
        items.push("-");
        items.push({ text: box.texts.newName, run: askNewName });
        openMenu(items, rect.left, rect.bottom + SIZE.MENU_SPACE);
    };

    // *** COPY AND PASTE: a block of a spreadsheet goes into the cells from the active one; JSON adds rows.

    const pasteRows = function (list) {
        if (level.isObject) {
            showStatus(box.texts.pasteList);
            return;
        }
        if (!list.length) return;
        remember();
        const rows = JsonEditor.rowsOfList(list);
        JsonEditor.columnsOfRows(rows, level.hints).forEach(function (column) {
            const isNewPlainColumn = (column.key === PLAIN_KEY && rows.every(function (row) { return row.shape !== "plain"; }));
            if (!columnByKey(column.key) && !isNewPlainColumn) level.columns.push(column);
        });
        level.rows = level.rows.concat(rows);
        fitColumns();
        drawHead();
        finishChange();
        const message = (rows.length === 1) ? box.texts.oneRowAdded : textOf("rowsAdded", { count: rows.length });
        if (!box.errorText) showStatus(message);
    };

    const pasteGrid = function (grid) {
        remember();
        const active = level.active;
        const firstColumn = (active) ? level.columns.findIndex(function (column) { return column.key === active.columnKey; }) : 0;
        const firstRow = (active) ? level.rows.findIndex(function (row) { return row.id === active.rowId; }) : level.rows.length;
        const isHeadOfNames = grid.length > 1 && grid[0].every(function (text) { return !!columnByKey(text.trim()); });
        const dataLines = (isHeadOfNames) ? grid.slice(1) : grid;
        dataLines.forEach(function (line, lineIndex) {
            const rowIndex = (isHeadOfNames) ? level.rows.length : firstRow + lineIndex;
            if (rowIndex >= level.rows.length) level.rows.push(newRow());
            const row = level.rows[rowIndex];
            line.forEach(function (text, cellIndex) {
                const column = (isHeadOfNames) ? columnByKey(grid[0][cellIndex].trim()) : level.columns[firstColumn + cellIndex];
                if (column) setCell(row, column.key, valueOfCellText(text, row, column));
            });
        });
        fitColumns();
        drawHead();
        finishChange();
        const message = (dataLines.length === 1) ? box.texts.oneLinePasted : textOf("linesPasted", { count: dataLines.length });
        if (!box.errorText) showStatus(message);
    };

    const onPaste = function (self, event) {
        const target = event.target;
        const isOtherField = (target !== editorArea && /^(INPUT|TEXTAREA)$/.test(target.tagName));
        if (isJsonView || isOtherField) return;
        const text = (event.clipboardData) ? event.clipboardData.getData("text") : "";
        const pasted = JsonEditor.readPastedText(text);
        if (!pasted) {
            // WHY: one text: a field being written takes it by itself; a chosen cell starts writing with it.
            const activeRow = level.active && rowById(level.active.rowId);
            if (!editing && activeRow) {
                event.preventDefault();
                startEdit(activeRow, columnByKey(level.active.columnKey), text);
            }
            return;
        }
        event.preventDefault();
        commitEdit();
        if (pasted.list) pasteRows(pasted.list);
        else pasteGrid(pasted.grid);
    };

    const onCopy = function (self, event) {
        if (isJsonView || editing) return;
        if (/^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;
        const rows = selectedRows();
        if (!rows.length) return;
        const lines = rows.map(function (row) {
            return level.columns.map(function (column) { return JsonEditor.textOfValue(row.cells[column.key]); }).join("\t");
        });
        event.preventDefault();
        event.clipboardData.setData("text/plain", lines.join("\n"));
        showStatus((rows.length === 1) ? box.texts.oneRowCopied : textOf("rowsCopied", { count: rows.length }));
    };

    // *** THE JSON VIEW: the same data as a text.

    const jsonTextOfLevel = function () {
        return JSON.stringify(JsonEditor.valueOfLevel(level), null, 2);
    };

    const showJsonView = function () {
        if (isJsonView) return;
        commitEdit();
        let text;
        try {
            text = jsonTextOfLevel();
        } catch (error) {
            showStatus(messageOf(error));
            return;
        }
        isJsonView = true;
        jsonArea.value = text;
        jsonStartText = text;
        jsonBox.visible = 1;
        drawViewSwitch();
        paintButtons();
    };

    // The text of the JSON view -> { data } or { error }.
    const readJsonText = function (text) {
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            return { error: textOf("notJson", { error: error.message }) };
        }
        const isRightShape = (level.isObject) ? JsonEditor.isPlain(data) : Array.isArray(data);
        if (!isRightShape) return { error: (level.isObject) ? box.texts.objectNeeded : box.texts.listNeeded };
        return { data: data };
    };

    // The text of the JSON view goes into the table. false: it is not JSON of the right shape (the status says why).
    const applyJsonText = function () {
        const text = jsonArea.value;
        if (text === jsonStartText) return true;
        const result = readJsonText(text);
        if (result.error) {
            box.errorText = result.error;
            showStatus(result.error);
            return false;
        }
        const old = JsonEditor.valueOfLevel(level);
        remember();
        const fresh = JsonEditor.levelOf(JsonEditor.keepFunctions(result.data, old), level.hints);
        level.rows = fresh.rows;
        level.columns = fresh.columns;
        level.selected.clear();
        level.active = null;
        level.sort = null;
        jsonStartText = text;
        fitColumns();
        drawHead();
        finishChange();
        return true;
    };

    const leaveJsonView = function () {
        if (!isJsonView) return true;
        if (!applyJsonText()) return false;
        closeJsonView();
        return true;
    };

    const closeJsonView = function () {
        isJsonView = false;
        jsonBox.visible = 0;
        drawViewSwitch();
        paintButtons();
        if (!box.errorText) showStatus("");
    };

    // *** THE PATH: the value and the cells opened in it. A click goes back.

    const drawPath = function () {
        if (groupPath.parts) groupPath.parts.forEach(function (part) { part.remove(); });
        groupPath.parts = createIn(groupPath, function () {
            const parts = [];
            levels.forEach(function (item, index) {
                if (index) parts.push(drawPathArrow());
                parts.push(drawPathPart(item, index));
            });
            return parts;
        });
        const note = (levels.length === 1) ? box.noteText : "";
        lblNote.plainText = note;
        lblNote.elem.title = note;
        lblNote.visible = (note) ? 1 : 0;
        const hasTitle = (box.titleText !== "" || box.noteText !== "" || levels.length > 1);
        box.titleBar.visible = (hasTitle || box.showTitleBar == 1) ? 1 : 0;
    };

    const drawPathArrow = function () {
        const lblArrow = Label({ text: "›", fontSize: _s.titleFontSize, textColor: C.dim, height: SIZE.TITLE_HEIGHT });
        lblArrow.css = { lineHeight: SIZE.TITLE_HEIGHT + "px" };
        lblArrow.shrink = 0;
        return lblArrow;
    };

    const drawPathPart = function (item, index) {
        const isLast = (index === levels.length - 1);
        const rootName = box.titleText || ((item.isObject) ? box.texts.object : box.texts.list);
        const lbl = Label({ text: "", fontSize: _s.titleFontSize, textColor: (isLast) ? C.text : C.accentText, fontFamily: "opensans-bold", height: SIZE.TITLE_HEIGHT, ellipsis: 1 });
        lbl.plainText = (index) ? item.name : rootName;
        lbl.css = { lineHeight: SIZE.TITLE_HEIGHT + "px", minWidth: "0px" };
        if (isLast) return lbl;
        lbl.shrink = 0;
        lbl.clickable = 1;
        lbl.cursor = "pointer";
        lbl.role = "button";
        lbl.tabIndex = 0;
        lbl.setFocusRing(C.focus);
        lbl.on("click", function () { goBackTo(index); });
        lbl.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            goBackTo(index);
        });
        return lbl;
    };

    const goBackTo = function (index) {
        if (!leaveJsonView()) return;
        closeLevelsTo(index);
    };

    // *** THE TOOLBAR, THE FOOTER:

    const paintButtons = function () {
        const hasRows = selectedRows().length > 0;
        tableTools.forEach(function (tool) {
            tool.visible = (isJsonView) ? 0 : 1;
        });
        // WHY: an object has its names and values: a new name is a new row.
        btnAddColumn.visible = (isJsonView || level.isObject) ? 0 : 1;
        btnDuplicate.setEnabled(hasRows);
        btnDelete.setEnabled(hasRows);
        btnUp.setEnabled(hasRows);
        btnDown.setEnabled(hasRows);
        btnUndo.setEnabled(level.undoList.length > 0);
        btnRedo.setEnabled(level.redoList.length > 0);
    };

    const showStatus = function (text) {
        lblStatus.plainText = text;
        lblStatus.elem.title = text;
    };

    // GROUP: Table | JSON
    const drawViewSwitch = function () {
        if (viewSwitch) viewSwitch.remove();
        viewSwitch = createIn(viewSwitchHolder, function () {
            const group = HGroup({ width: SIZE.VIEW_SWITCH_WIDTH, height: SIZE.VIEW_SWITCH_HEIGHT, align: "left center", gap: 0, color: C.field, round: SIZE.VIEW_SWITCH_ROUND });
            group.shrink = 0;
            // WHY the room inside the line: the ring of the chosen part lay on the line of the group (a double edge, corners that did not meet)
            if (C.fieldLine) group.props({ border: 1, borderColor: C.fieldLine, padding: SIZE.VIEW_SWITCH_INSET });
            group.role = "radiogroup";
                drawViewOption("table", box.texts.table);
                drawViewOption("json", box.texts.json);
            endGroup();
            return group;
        });
    };

    const drawViewOption = function (view, text) {
        const isSelected = ((view === "json") === isJsonView);
        const inset = (C.fieldLine) ? 1 + SIZE.VIEW_SWITCH_INSET : 0; // the line of the group and the room inside it
        const option = Label({
            text: "",
            height: SIZE.VIEW_SWITCH_HEIGHT - inset * 2,
            fontSize: _s.fontSize - 1,
            round: SIZE.VIEW_SWITCH_ROUND - inset, // WHY: its corners follow the corners of the group
            textColor: (isSelected) ? C.text : C.soft,
            color: (isSelected) ? C.segment : "transparent",
            clickable: 1,
            cursor: "pointer",
        });
        option.plainText = text;
        option.grow = 1;
        option.css = { flexBasis: "0px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" };
        option.boxShadow = (isSelected) ? "inset 0 0 0 1px " + C.strongLine : "none";
        option.role = "radio";
        option.tabIndex = 0;
        option.aria = { checked: (isSelected) ? "true" : "false" };
        option.setFocusRing(C.focus);
        if (!isSelected) option.onHoverChange(function (self, isOver) { option.color = (isOver) ? C.fieldHover : "transparent"; });
        option.on("click", function () { box.setView(view); });
        option.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            box.setView(view);
        });
    };

    const copyJson = function () {
        commitEdit();
        let text;
        try {
            text = (isJsonView) ? jsonArea.value : jsonTextOfLevel();
        } catch (error) {
            showStatus(messageOf(error));
            return;
        }
        JsonEditor.copyText(text)
            .then(function () { showStatus(box.texts.jsonCopied); })
            .catch(function (error) { showStatus(error.message); });
    };

    // A raw field (basic.js has no field that fills a box of the editor): "input" or "textarea".
    const createField = function (parentBox, tagName) {
        const field = document.createElement(tagName);
        field.spellcheck = false;
        field.className = "json-editor-field";
        field.style.fontSize = _s.fontSize + "px";
        parentBox.elem.appendChild(field);
        return field;
    };

    // GROUP: The title: the path of the table in sight and a note
    const buildTitleBar = function () {
        box.titleBar = VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [SIZE.BAR_SPACE, SIZE.TITLE_SPACE], color: "transparent" });
        box.titleBar.css = { alignItems: "stretch", boxSizing: "border-box" };
        box.titleBar.shrink = 0;
            box.titleRow = HGroup({ width: "100%", height: SIZE.TITLE_HEIGHT, align: "left center", gap: 4, color: "transparent" });
            box.titleRow.shrink = 0;
                groupPath = HGroup({ width: 10, height: SIZE.TITLE_HEIGHT, align: "left center", gap: 8, color: "transparent" });
                groupPath.grow = 1;
                groupPath.css = { minWidth: "0px" };
                endGroup();
            endGroup();
            lblNote = Label({ text: "", height: SIZE.NOTE_HEIGHT, fontSize: _s.fontSize - 1, textColor: C.soft, ellipsis: 1 });
            lblNote.css = { lineHeight: SIZE.NOTE_HEIGHT + "px" };
            lblNote.shrink = 0;
        endGroup();
    };

    // GROUP: The buttons of the table, the search, the view (they go to a second line on a narrow editor)
    const buildToolbar = function () {
        box.toolbar = HGroup({ width: "100%", height: "auto", align: "left center", gap: 4, padding: [SIZE.BAR_SPACE, SIZE.TOOLBAR_SPACE], wrap: 1, color: "transparent" });
        box.toolbar.shrink = 0;
        box.toolbar.clipContent = 0;
        box.toolbar.css = { borderBottom: "1px solid " + C.line, boxSizing: "border-box", rowGap: SIZE.TOOLBAR_SPACE + "px" };
            const btnAddRow = JsonEditor.textButton(JsonEditor.iconOf("plus", SIZE.ICON) + JsonEditor.spanOf(box.texts.addRow), looks.button, function () { addRow(); });
            btnAddColumn = JsonEditor.textButton(JsonEditor.iconOf("plus", SIZE.ICON) + JsonEditor.spanOf(box.texts.addColumn), looks.button, addColumnFromButton);

            // GROUP: The buttons of the chosen rows. WHY groups: a narrow editor puts a group on the next line, not half of it.
            const rowTools = startToolGroup();
                btnDuplicate = JsonEditor.iconButton("copy", box.texts.duplicate + " (Cmd/Ctrl+D)", looks.icon, function () { duplicateRows(selectedRows()); });
                btnUp = JsonEditor.iconButton("up", box.texts.moveUp + " (Alt+↑)", looks.icon, function () { moveRows(selectedRows(), -1); });
                btnDown = JsonEditor.iconButton("down", box.texts.moveDown + " (Alt+↓)", looks.icon, function () { moveRows(selectedRows(), 1); });
                btnDelete = JsonEditor.iconButton("trash", box.texts.delete + " (Delete)", looks.icon, function () { deleteRows(selectedRows()); });
            endGroup();

            // GROUP: Undo, redo
            const historyTools = startToolGroup();
                btnUndo = JsonEditor.iconButton("back", box.texts.undo + " (Cmd/Ctrl+Z)", looks.icon, undo);
                btnRedo = JsonEditor.iconButton("forward", box.texts.redo + " (Shift+Cmd/Ctrl+Z)", looks.icon, redo);
            endGroup();

            // GROUP: The search
            const searchHolder = HGroup({ width: SIZE.SEARCH_WIDTH, height: _s.search.height, align: "left center", color: "transparent" });
            // WHY the basis under its width: a narrow editor keeps it on the line of the buttons; it grows up to its width.
            searchHolder.css = { flex: "1 1 " + SIZE.SEARCH_BASIS + "px", maxWidth: SIZE.SEARCH_WIDTH + "px", minWidth: SIZE.SEARCH_MIN_WIDTH + "px", marginLeft: SIZE.SEARCH_SPACE + "px" };
                searchInput = SearchInput({
                    ..._s.search,
                    styleName: _s.searchStyleName,
                    left: 0,
                    top: 0,
                    width: "100%",
                    placeholder: box.texts.search,
                    onChange: function (self) { searchRows(self.getSearchText()); },
                });
            endGroup();

            // GROUP: Copy and Table | JSON. WHY the auto margin: at the right end, also when it goes to the next line.
            const viewTools = HGroup({ width: "auto", height: SIZE.VIEW_SWITCH_HEIGHT, align: "left center", gap: 4, color: "transparent" });
            viewTools.shrink = 0;
            viewTools.clipContent = 0;
            viewTools.css = { marginLeft: "auto" };
                JsonEditor.iconButton("copy", box.texts.copyJson, looks.icon, copyJson);
                viewSwitchHolder = HGroup({ width: SIZE.VIEW_SWITCH_WIDTH, height: SIZE.VIEW_SWITCH_HEIGHT, align: "left center", color: "transparent" });
                viewSwitchHolder.shrink = 0;
                endGroup();
            endGroup();
        endGroup();
        tableTools = [btnAddRow, rowTools, historyTools, searchHolder];
        drawViewSwitch();
    };

    // GROUP: a few buttons of the toolbar after a thin line. endGroup() closes it.
    const startToolGroup = function () {
        const group = HGroup({ width: "auto", height: SIZE.ICON_BUTTON, align: "left center", gap: 4, color: "transparent" });
        group.shrink = 0;
        group.clipContent = 0;
            // BOX: The line
            const line = Box({ width: 1, height: SIZE.TOOLBAR_LINE_HEIGHT, color: C.line });
            line.shrink = 0;
            line.css = { position: "relative", left: "0px", top: "0px", margin: "0px 6px" };
        return group;
    };

    const searchRows = function (text) {
        commitEdit();
        searchText = String(text || "");
        refreshViewRows();
        scroller.elem.scrollTop = 0;
        drawRows(true);
        placeActive();
    };

    // BOX: The titles, the rows and the JSON text
    const buildBody = function () {
        const body = startBox({ width: "100%", height: 10, color: "transparent" });
        body.grow = 1;
        body.css = { position: "relative", left: "0px", top: "0px", minHeight: "0px" };

            // BOX: The titles
            headBox = startBox(0, 0, "100%", HEAD, { color: C.head });
            headBox.css = { borderBottom: "1px solid " + C.headLine, boxSizing: "border-box" };
            endBox();
            // BOX: Over the titles that move to the side, as the numbers of the rows
            const headGutter = Box(0, 0, GUTTER, HEAD, { color: C.head });
            headGutter.css = { borderBottom: "1px solid " + C.headLine, boxSizing: "border-box" };
            headGutter.zIndex = 1;

            // BOX: The rows
            scroller = startBox(0, HEAD, "100%", "calc(100% - " + HEAD + "px)", { color: "transparent" });
            scroller.scrollY = 1;
            scroller.scrollX = 1;
            scroller.elem.classList.add("json-editor-scroll");
                content = startBox(0, 0, 100, 100, { color: "transparent" });
                content.clipContent = 0;
                content.clickable = 1;
                content.tabIndex = 0;
                content.css = { outline: "none" };

                    // BOX: The ring of the active cell, the line of a dragged row, the field of a cell
                    activeRing = Box(0, 0, 0, 0, { color: "transparent", visible: 0 });
                    activeRing.boxShadow = "inset 0 0 0 2px " + C.accent;
                    activeRing.zIndex = 2;
                    dropLine = Box(0, 0, 0, 2, { color: C.accent, visible: 0 });
                    dropLine.zIndex = 3;

                    editorBox = startBox(0, 0, 0, ROW, { color: C.editor, visible: 0 });
                    editorBox.boxShadow = "inset 0 0 0 2px " + C.accent;
                    editorBox.zIndex = 4;
                    editorBox.clickable = 1;
                        editorArea = createField(editorBox, "textarea");
                        editorArea.style.padding = SIZE.EDITOR_PADDING;
                        editorArea.style.overflow = "hidden";
                        editorArea.style.whiteSpace = "pre";
                        editorArea.setAttribute("aria-label", box.texts.cellValue);
                    endBox();
                endBox();
                // WHY a field of the browser: its color picker; it opens at the cell (a hidden field opens nowhere).
                colorInput = document.createElement("input");
                colorInput.type = "color";
                colorInput.className = "json-editor-color";
                colorInput.tabIndex = -1;
                content.elem.appendChild(colorInput);
            endBox();

            // BOX: The JSON text (over the table)
            jsonBox = startBox(0, 0, "100%", "100%", { color: C.ground, visible: 0 });
            jsonBox.zIndex = 6;
                jsonArea = createField(jsonBox, "textarea");
                jsonArea.classList.add("json-editor-scroll");
                jsonArea.style.fontFamily = _s.codeFontFamily;
                jsonArea.style.padding = SIZE.JSON_PADDING;
                jsonArea.style.whiteSpace = "pre";
                jsonArea.setAttribute("aria-label", box.texts.json);
            endBox();
        endBox();
    };

    // GROUP: At the bottom: what the table holds, a message, the keys (box.footer takes the buttons of a window)
    const buildFooter = function () {
        box.footer = HGroup({ width: "100%", height: SIZE.FOOTER_HEIGHT, align: "left center", gap: 12, padding: [SIZE.BAR_SPACE, 0], color: "transparent" });
        box.footer.shrink = 0;
        box.footer.css = { borderTop: "1px solid " + C.line, boxSizing: "border-box" };
            lblInfo = Label({ text: "", fontSize: _s.fontSize, textColor: C.soft });
            lblInfo.shrink = 0;
            // WHY these flex values: a message is read whole first; the keys take the room that is left.
            lblStatus = Label({ text: "", fontSize: _s.fontSize, textColor: C.accentText, ellipsis: 1 });
            lblStatus.css = { minWidth: "0px", flex: "0 1 auto" };
            const lblHint = Label({ text: "", fontSize: _s.fontSize - 1, textColor: C.dim, ellipsis: 1 });
            lblHint.plainText = box.texts.hint;
            lblHint.css = { minWidth: "0px", flex: "1 1 0px", textAlign: "right" };
            lblHint.visible = (box.showHint == 1) ? 1 : 0;
        endGroup();
    };

    // *** THE KEYS: the field of a cell first, then the cells. The other fields keep their own keys.

    const onEditorKey = function (event) {
        const isCommand = (event.metaKey || event.ctrlKey);
        if (event.key === "Enter" && isCommand) return false;
        if (event.key === "Enter" && event.shiftKey) {
            box.after(0, fitEditorHeight);
            return true;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
            const hasNextRow = moveActive(1, 0);
            if (hasNextRow) startEditActive();
            else content.elem.focus({ preventScroll: true });
            return true;
        }
        if (event.key === "Tab") {
            event.preventDefault();
            commitEdit();
            const hasNextCell = moveActive(0, (event.shiftKey) ? -1 : 1);
            if (hasNextCell) startEditActive();
            else content.elem.focus({ preventScroll: true });
            return true;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
            return true;
        }
        const isOneLine = (editorArea.value.indexOf("\n") === -1);
        if ((event.key === "ArrowUp" || event.key === "ArrowDown") && isOneLine) {
            event.preventDefault();
            commitEdit();
            moveActive((event.key === "ArrowUp") ? -1 : 1, 0);
            startEditActive();
            return true;
        }
        return false;
    };

    const startEditActive = function () {
        const active = level.active;
        const row = active && rowById(active.rowId);
        const column = active && columnByKey(active.columnKey);
        if (row && column) startEdit(row, column);
    };

    const onGridKey = function (event) {
        const isCommand = (event.metaKey || event.ctrlKey);
        const key = event.key;
        if (isCommand && key === "Enter") return false; // WHY: it is for the page (Apply in the window)
        if (isCommand && (key === "z" || key === "Z")) {
            event.preventDefault();
            if (event.shiftKey) redo();
            else undo();
            return true;
        }
        if (isCommand && (key === "y" || key === "Y")) {
            event.preventDefault();
            redo();
            return true;
        }
        if (isCommand && (key === "d" || key === "D")) {
            event.preventDefault();
            duplicateRows(selectedRows());
            return true;
        }
        if (event.altKey && (key === "ArrowUp" || key === "ArrowDown")) {
            event.preventDefault();
            moveRows(selectedRows(), (key === "ArrowUp") ? -1 : 1);
            return true;
        }
        const arrows = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (arrows[key]) {
            event.preventDefault();
            if (!level.active && viewRows.length) setActive(viewRows[0].id, level.columns[0].key);
            else moveActive(arrows[key][0], arrows[key][1]);
            return true;
        }
        // WHY not at the last cell: Tab leaves the table there (a table in a page must not keep the focus).
        if (key === "Tab" && level.active && moveActive(0, (event.shiftKey) ? -1 : 1)) {
            event.preventDefault();
            return true;
        }
        const activeRow = level.active && rowById(level.active.rowId);
        const activeColumn = level.active && columnByKey(level.active.columnKey);
        if (key === "Enter" && activeRow) {
            event.preventDefault();
            if (kindOfCell(activeRow, activeColumn) === "nested") openNestedCell(activeRow, activeColumn);
            else startEdit(activeRow, activeColumn);
            return true;
        }
        if ((key === "Delete" || key === "Backspace") && level.selected.size) {
            event.preventDefault();
            deleteRows(selectedRows());
            return true;
        }
        if ((key === "Delete" || key === "Backspace") && activeRow) {
            event.preventDefault();
            remember();
            setCell(activeRow, activeColumn.key, valueOfCellText("", activeRow, activeColumn));
            finishChange();
            return true;
        }
        const isTypedLetter = (key.length === 1 && !isCommand && !event.altKey);
        if (isTypedLetter && activeRow) {
            event.preventDefault();
            startEdit(activeRow, activeColumn, key);
            return true;
        }
        return false;
    };

    // A key the editor used does not go on to the page (or to the window of JsonEditor.open).
    const onKeyDown = function (self, event) {
        if (event.defaultPrevented) return; // WHY: a button of the editor or an open menu took it
        if (menu && menu.isOpen()) return;
        const target = event.target;
        if (target === editorArea) {
            if (onEditorKey(event)) event.stopPropagation();
            return;
        }
        if (target === jsonArea) return;
        const isOtherField = /^(INPUT|TEXTAREA)$/.test(target.tagName);
        if (isOtherField && event.key === "Escape") {
            event.stopPropagation();
            target.blur();
            content.elem.focus({ preventScroll: true });
        }
        if (isOtherField) return;
        if (onGridKey(event)) event.stopPropagation();
    };

    // *** PUBLIC FUNCTIONS:

    // The list or the object of the table. null: the table can not make one now (box.errorText says why).
    // NOTE: A cell being written is written first, and the text of the JSON view goes into the table.
    box.getValue = function () {
        commitEdit();
        if (isJsonView && !applyJsonText()) return null;
        try {
            const value = readValue();
            box.errorText = "";
            return value;
        } catch (error) {
            box.errorText = messageOf(error);
            showStatus(box.errorText);
            return null;
        }
    };
    // USAGE: const products = editor.getValue(); if (products === null) println(editor.errorText);

    // A new value: a list or an object (or its JSON text). Its undo starts again; onChange is not called.
    box.setValue = function (value) {
        editing = null;
        editorBox.visible = 0;
        if (isJsonView) closeJsonView();
        box.value = JsonEditor.rootValueOf(value);
        box.isChanged = 0;
        box.errorText = "";
        levels.length = 0;
        openLevel("", box.value, box.columns, null);
        showStatus("");
    };
    // USAGE: editor.setValue([{ name: "Apple", price: 1.2 }])

    // A text that is not JSON (or not a list or an object) shows its error; the table stays.
    box.setJsonText = function (text) {
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            box.errorText = textOf("notJson", { error: error.message });
            showStatus(box.errorText);
            return false;
        }
        if (!Array.isArray(data) && !JsonEditor.isPlain(data)) {
            box.errorText = box.texts.listNeeded;
            showStatus(box.errorText);
            return false;
        }
        box.setValue(data);
        return true;
    };
    // USAGE: editor.setJsonText('[{"name": "Apple"}]')

    // The value as a JSON text of 2 spaces. "": the table can not make a value now.
    box.getJsonText = function () {
        const value = box.getValue();
        if (value === null) return "";
        return JSON.stringify(value, null, 2);
    };

    // "table" or "json". false: the text of the JSON view is not right (it stays, the bottom bar says why).
    box.setView = function (view) {
        if (view === "json") {
            showJsonView();
            return isJsonView;
        }
        return leaveJsonView();
    };
    // USAGE: editor.setView("json")

    box.getView = function () {
        return (isJsonView) ? "json" : "table";
    };

    box.undo = function () { undo(); };
    box.redo = function () { redo(); };

    // 1: something was changed (also a text written in the JSON view that is not in the table yet).
    box.hasChanges = function () {
        const hasJsonChange = (isJsonView && jsonArea.value !== jsonStartText);
        return (box.isChanged == 1 || hasJsonChange) ? 1 : 0;
    };

    box.setTitleText = function (titleText, noteText = box.noteText) {
        box.titleText = titleText;
        box.noteText = noteText;
        box.aria = { label: box.ariaLabel || box.titleText || box.texts.table };
        drawPath();
    };
 // USAGE: editor.setTitleText("Products", "A row is a product")

    // The keys go to the table (Ex: after the editor opens in a window).
    box.focus = function () {
        content.elem.focus({ preventScroll: true });
    };

    // *** OBJECT VIEW:

    box.props(_s.box);
    box.role = "group";
    box.aria = { label: box.ariaLabel || box.titleText || box.texts.table };

    // GROUP: The parts one under the other: the title, the toolbar, the table, the bottom bar
    box.layout = VGroup({ left: 0, top: 0, width: "100%", height: "100%", align: "left top", gap: 0, color: "transparent" });
    box.layout.css = { alignItems: "stretch" };
        buildTitleBar();
        buildToolbar();
        buildBody();
        buildFooter();
    endGroup();

    // *** OBJECT INIT CODE:

    basic.addCss("json-editor",
        ".json-editor-field { display: block; width: 100%; height: 100%; box-sizing: border-box; margin: 0; border: 0; outline: none;" +
        " resize: none; background: transparent; color: var(--json-editor-text); caret-color: var(--json-editor-text);" +
        " font-family: inherit; line-height: 18px; pointer-events: auto; user-select: text; -webkit-user-select: text; }" +
        ".json-editor-field::placeholder { color: var(--json-editor-placeholder); }" +
        ".json-editor-scroll::-webkit-scrollbar { width: 10px; height: 10px; }" +
        ".json-editor-scroll::-webkit-scrollbar-thumb { background: var(--json-editor-bar); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }" +
        ".json-editor-scroll::-webkit-scrollbar-thumb:hover { background: var(--json-editor-bar-hover); border: 2px solid transparent; background-clip: padding-box; }" +
        ".json-editor-scroll::-webkit-scrollbar-corner { background: transparent; }" +
        ".json-editor-color { position: absolute; width: 1px; height: 1px; padding: 0; margin: 0; border: 0; opacity: 0; pointer-events: none; }");
    box.elem.style.setProperty("--json-editor-text", C.text);
    box.elem.style.setProperty("--json-editor-placeholder", C.placeholder);
    box.elem.style.setProperty("--json-editor-bar", C.scrollBar);
    box.elem.style.setProperty("--json-editor-bar-hover", C.scrollBarHover);

    content.on("click", onContentClick);
    content.on("mousemove", onContentMove);
    content.on("mouseleave", function () {
        const previousId = hoveredRowId;
        hoveredRowId = null;
        paintRow(previousId);
    });
    content.on("pointerdown", function (self, event) {
        if (event.button !== 0 || event.target === editorArea) return;
        const hit = hitOf(event);
        if (hit.part === "handle" && hit.row) startRowDrag(event, hit.row);
    });
    content.on("contextmenu", function (self, event) {
        const hit = hitOf(event);
        event.preventDefault();
        if (hit.row) openRowMenu(hit.row, event.clientX, event.clientY);
    });
    scroller.on("scroll", function () {
        syncHead();
        drawRows(false);
    });
    scroller.onResize(function () {
        fitColumns();
        drawHead();
        drawRows(true);
        placeActive();
    });
    editorArea.addEventListener("input", fitEditorHeight);
    editorArea.addEventListener("blur", function () {
        if (!box._isRemoved) commitEdit();
    });
    jsonArea.addEventListener("keydown", function (event) {
        if (event.key !== "Tab") return;
        event.preventDefault();
        jsonArea.setRangeText("  ", jsonArea.selectionStart, jsonArea.selectionEnd, "end");
    });
    box.on("keydown", onKeyDown);
    box.on("paste", onPaste);
    box.on("copy", onCopy);

    openLevel("", box.value, box.columns, null);

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

JsonEditor.SIZES = {
    HANDLE_WIDTH: 22,
    NUMBER_WIDTH: 38,
    NUMBER_SPACE: 8, // Between a number and its row
    END_WIDTH: 30,
    MIN_COLUMN: 64,
    MAX_AUTO_COLUMN: 320,
    COLUMN_EDGE_WIDTH: 7,
    CELL_PADDING: 8,
    CELL_GAP: 6,
    CELL_TEXT_ROOM: 20, // The padding of a cell, in its first width
    CELL_ICON_ROOM: 26, // A swatch, a picture or ⌄ in a cell
    SWATCH_SIZE: 14,
    SWATCH_HIT: 26, // A click at the start of a color cell opens the color picker
    OPTION_HIT: 26, // A click at the end of a cell of choices opens its list
    SWITCH_WIDTH: 24,
    SWITCH_HEIGHT: 14,
    SWITCH_KNOB: 10,
    SWITCH_SPACE: 2,
    ICON: 14,
    HEAD_BUTTON_WIDTH: 20,
    HEAD_BUTTON_HEIGHT: 22,
    ADD_ROW_WIDTH: 120,
    ADD_ROW_SPACE: 12,
    ROW_BUFFER: 12, // Rows drawn out of sight: a small scroll draws nothing
    MEASURED_ROWS: 200, // The first width of a column is read from these rows
    HISTORY_LIMIT: 100,
    DRAG_SCROLL_EDGE: 28,
    DRAG_SCROLL_STEP: 14,
    EDITOR_LINE_HEIGHT: 18,
    EDITOR_MAX_LINES: 6,
    EDITOR_SPACE: 12, // Over and under the lines of a field of many lines
    EDITOR_MIN_WIDTH: 140,
    EDITOR_PADDING: "5px 8px",
    JSON_PADDING: "12px 16px",
    NAME_FIELD_WIDTH: 200,
    NAME_FIELD_HEIGHT: 28,
    NAME_FIELD_Z_INDEX: 5,
    MENU_MIN_WIDTH: 200,
    MENU_SPACE: 2, // Between a button and its menu
    BAR_SPACE: 14, // At the sides of the bars
    TITLE_SPACE: 10, // Over and under the title
    TITLE_HEIGHT: 26,
    NOTE_HEIGHT: 16,
    TOOLBAR_SPACE: 8,
    TOOLBAR_LINE_HEIGHT: 20,
    SEARCH_WIDTH: 220,
    SEARCH_BASIS: 160,
    SEARCH_MIN_WIDTH: 120,
    SEARCH_SPACE: 8, // Before the search (the buttons before it end with no line)
    VIEW_SWITCH_WIDTH: 130,
    VIEW_SWITCH_HEIGHT: 24,
    VIEW_SWITCH_ROUND: 5,
    VIEW_SWITCH_INSET: 2, // px between a line around Table | JSON and its chosen part
    FOOTER_HEIGHT: 46,
    BUTTON_HEIGHT: 28,
    ICON_BUTTON: 24,
    CLOSE_BUTTON: 26,
    SURE_TIME: 5000, // ms: Cancel asks "Discard the changes?" this long
    NARROW_PAGE: 600, // px: the window has a small margin on a narrower page
};

JsonEditor.PLAIN_KEY = "(value)"; // The column of a row that is a plain value ("A", 12)
JsonEditor.NAME_KEY = "(name)"; // An object: the name of a row
JsonEditor.VALUE_KEY = "(data)"; // An object: the value of a row
JsonEditor.TYPES = ["", "text", "number", "flag", "color", "picture"]; // The types of the menu of a column ("": from its values)
JsonEditor.CHECKER = "repeating-conic-gradient(#BBBBBB 0% 25%, #FFFFFF 0% 50%) 0 0 / 6px 6px";
JsonEditor.nextRowId = 1;

// *** THE DATA OF A TABLE: a list or an object <-> rows and columns. Nothing here draws.

// The value of a new editor: a list or an object. A JSON text is read; anything else is an empty list.
JsonEditor.rootValueOf = function (value) {
    if (Array.isArray(value) || JsonEditor.isPlain(value)) return value;
    if (typeof value !== "string") return [];
    const data = JsonEditor.jsonOrText(value);
    if (Array.isArray(data) || JsonEditor.isPlain(data)) return data;
    return [];
};

// WHY the prototype of the prototype: an object of another window (an iframe) has another Object.
JsonEditor.isPlain = function (value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || Object.getPrototypeOf(proto) === null;
};

// A Date, an object of basic.js... It stays in its cell, but it can not be written.
JsonEditor.isOtherObject = function (value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) && !JsonEditor.isPlain(value);
};

// WHY not a short list of numbers: [14, 10] is read and written faster as a text than as a table of its own.
JsonEditor.isNestedValue = function (value) {
    const isNumbers = (Array.isArray(value) && value.every(function (item) { return typeof item === "number"; }));
    if (isNumbers && value.length && value.length <= 4) return false;
    return Array.isArray(value) || JsonEditor.isPlain(value);
};

// shape: "object" { a: 1 }, "array" [1, 2], "plain" "A", "pair" a row of an object.
JsonEditor.newRow = function (shape, cells) {
    return { id: JsonEditor.nextRowId++, shape: shape, cells: cells };
};

JsonEditor.rowsOfList = function (list) {
    return list.map(function (item) {
        if (JsonEditor.isPlain(item)) return JsonEditor.newRow("object", Object.assign({}, item));
        if (Array.isArray(item)) {
            const cells = {};
            item.forEach(function (value, index) { cells[index] = value; });
            return JsonEditor.newRow("array", cells);
        }
        const plainCells = {};
        plainCells[JsonEditor.PLAIN_KEY] = item;
        return JsonEditor.newRow("plain", plainCells);
    });
};

// hint: what the page said about the column (A COLUMN)
JsonEditor.newColumn = function (key, hint) {
    const column = { key: key, width: JsonEditor.SIZES.MIN_COLUMN, note: "", options: null, chosenKind: "" };
    if (!hint) return column;
    column.note = hint.note || "";
    if (Array.isArray(hint.options) && hint.options.length) column.options = hint.options.slice();
    if (hint.kind) column.chosenKind = hint.kind;
    return column;
};

// The columns of the rows, in the order of their first use. An empty list: the columns the page named.
JsonEditor.columnsOfRows = function (rows, hints) {
    const columns = [];
    const hintOf = function (key) { return hints.find(function (hint) { return hint.key === key; }); };
    const add = function (key) {
        const isKnown = columns.some(function (column) { return column.key === key; });
        if (!isKnown) columns.push(JsonEditor.newColumn(key, hintOf(key)));
    };
    if (rows.some(function (row) { return row.shape === "plain"; })) add(JsonEditor.PLAIN_KEY);
    rows.forEach(function (row) {
        if (row.shape === "array") Object.keys(row.cells).forEach(add);
    });
    rows.forEach(function (row) {
        if (row.shape === "object") Object.keys(row.cells).forEach(add);
    });
    if (!columns.length) hints.forEach(function (hint) { add(hint.key); });
    if (!columns.length) add(JsonEditor.PLAIN_KEY);
    return columns;
};

// A list or an object -> { isObject, rows, columns }
JsonEditor.levelOf = function (value, hints) {
    if (Array.isArray(value)) {
        const listRows = JsonEditor.rowsOfList(value);
        return { isObject: false, rows: listRows, columns: JsonEditor.columnsOfRows(listRows, hints || []) };
    }
    const pairRows = Object.keys(value).map(function (name) {
        const cells = {};
        cells[JsonEditor.NAME_KEY] = name;
        cells[JsonEditor.VALUE_KEY] = value[name];
        return JsonEditor.newRow("pair", cells);
    });
    const columns = [JsonEditor.newColumn(JsonEditor.NAME_KEY), JsonEditor.newColumn(JsonEditor.VALUE_KEY)];
    return { isObject: true, rows: pairRows, columns: columns };
};

// A row -> its item. WHY the plain cell can be next to other cells: a plain row that got a value in another column becomes
// an object, and its value stays (with the name "value"; renaming the column turns all of them into that name).
JsonEditor.valueOfRow = function (row, columns) {
    const PLAIN_KEY = JsonEditor.PLAIN_KEY;
    if (row.shape === "array") {
        const indexColumns = columns.filter(function (column) { return /^\d+$/.test(column.key); });
        const list = indexColumns.map(function (column) { return row.cells[column.key]; });
        while (list.length && list[list.length - 1] === undefined) list.pop();
        return list.map(function (item) { return (item === undefined) ? null : item; });
    }
    const named = columns.filter(function (column) { return column.key !== PLAIN_KEY && row.cells[column.key] !== undefined; });
    const plain = row.cells[PLAIN_KEY];
    if (!named.length && plain !== undefined) return plain;
    if (!named.length && row.shape === "plain") return "";
    const item = {};
    if (plain !== undefined) item.value = plain;
    named.forEach(function (column) { item[column.key] = row.cells[column.key]; });
    // WHY: a function of a column that is not shown any more (a row of another shape) is not lost.
    Object.keys(row.cells).forEach(function (key) {
        const isHiddenFunction = (key !== PLAIN_KEY && !(key in item) && typeof row.cells[key] === "function");
        if (isHiddenFunction) item[key] = row.cells[key];
    });
    return item;
};

// The table -> its list or its object. openCell: { rowId, columnKey, value }: a cell whose table is open now.
// A name that is empty or used twice throws (error.textKey: a key of texts).
JsonEditor.valueOfLevel = function (level, openCell) {
    const cellsOf = function (row) {
        if (!openCell || row.id !== openCell.rowId) return row.cells;
        const cells = Object.assign({}, row.cells);
        cells[openCell.columnKey] = openCell.value;
        return cells;
    };
    if (!level.isObject) {
        return level.rows.map(function (row) {
            return JsonEditor.valueOfRow({ shape: row.shape, cells: cellsOf(row) }, level.columns);
        });
    }
    const object = {};
    level.rows.forEach(function (row) {
        const cells = cellsOf(row);
        const name = String(cells[JsonEditor.NAME_KEY] ?? "").trim();
        if (name === "") throw JsonEditor.tableError("noName", "");
        if (Object.prototype.hasOwnProperty.call(object, name)) throw JsonEditor.tableError("sameName", name);
        const value = cells[JsonEditor.VALUE_KEY];
        object[name] = (value === undefined) ? "" : value;
    });
    return object;
};

JsonEditor.tableError = function (textKey, valueName) {
    const error = new Error(textKey);
    error.textKey = textKey;
    error.valueName = valueName;
    return error;
};

// A value as the text of its cell. A function has no text: its code is not data.
JsonEditor.textOfValue = function (value) {
    if (value === undefined || typeof value === "function") return "";
    if (typeof value === "string") return value;
    if (JsonEditor.isOtherObject(value)) return "[" + ((value.constructor && value.constructor.name) || "object") + "]";
    try {
        return JSON.stringify(value);
    } catch (error) {
        return String(value); // WHY: a value that holds itself
    }
};

// A list or an object in a cell: [ 3 ] or { 2 }
JsonEditor.countTextOf = function (value) {
    if (Array.isArray(value)) return "[ " + value.length + " ]";
    return "{ " + Object.keys(value).length + " }";
};

// A picture written in the code (a data address, often long) is shown short: what it is and how big.
JsonEditor.shortPicture = function (text, template) {
    if (!/^data:/i.test(text)) return text;
    const kind = (text.match(/^data:([^;,]+)/i) || [])[1] || "data";
    const size = Math.round(text.length / 1024 * 10) / 10;
    return JsonEditor.fillText(template, { kind: kind, size: size });
};

// The address of a picture: a text of an SVG becomes a data address; a relative path is read from base (when given).
JsonEditor.pictureAddress = function (value, base) {
    const text = String(value ?? "").trim();
    if (/^<svg\b/i.test(text)) return "data:image/svg+xml;utf8," + encodeURIComponent(text);
    if (!text || !base) return text;
    try {
        return new URL(text, base).href;
    } catch (error) {
        return text; // WHY: not an address (a typed text); the picture shows nothing
    }
};

// What sorts first: numbers by their size, texts as people read them, an empty cell at the end.
JsonEditor.compareValues = function (a, b) {
    const isAEmpty = (a === undefined || a === null || a === "");
    const isBEmpty = (b === undefined || b === null || b === "");
    if (isAEmpty || isBEmpty) return (isAEmpty ? 1 : 0) - (isBEmpty ? 1 : 0);
    if (typeof a === "number" && typeof b === "number") return a - b;
    return JsonEditor.textOfValue(a).localeCompare(JsonEditor.textOfValue(b), undefined, { numeric: true, sensitivity: "base" });
};

// A pasted text -> { list } (JSON) or { grid } (lines of cells: a spreadsheet, or a text of lines), or null (one plain text).
JsonEditor.readPastedText = function (text) {
    const trimmed = String(text).trim();
    if (/^[[{]/.test(trimmed)) {
        const data = JsonEditor.jsonOrText(trimmed);
        if (Array.isArray(data)) return { list: data };
        if (JsonEditor.isPlain(data)) return { list: [data] };
    }
    const hasTabs = (trimmed.indexOf("\t") !== -1);
    const hasLines = (trimmed.indexOf("\n") !== -1);
    if (!hasTabs && !hasLines) return null;
    return { grid: trimmed.split(/\r?\n/).map(function (line) { return line.split("\t"); }) };
};

JsonEditor.jsonOrText = function (text) {
    try {
        return JSON.parse(text);
    } catch (error) {
        return text;
    }
};

JsonEditor.numberOfText = function (text) {
    const trimmed = String(text).trim();
    if (trimmed === "" || isNaN(Number(trimmed))) return null;
    return Number(trimmed);
};

// The choices of a cell, with the value it holds now at the top when it is not one of them.
JsonEditor.optionValues = function (values, current) {
    const list = values.slice();
    const isValueNow = (typeof current === "string" && current !== "") || typeof current === "number";
    if (isValueNow && list.indexOf(current) === -1) list.unshift(current);
    return list;
};

// *** THE KIND OF A VALUE: from its name and itself. WHY a guess is enough: every cell can still be written as a text.

JsonEditor.COLOR_TEXT = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(.*\)|var\(--.*\)|color-mix\(.*\))$/i;
JsonEditor.COLOR_KEY = /(^|[a-z_])colou?r$/i;
JsonEditor.PICTURE_TEXT = /^(data:image\/|<svg\b)|\.(png|jpe?g|gif|svg|webp|avif|ico)(\?.*)?$/i;
JsonEditor.PICTURE_KEY = /(^|[a-z_])(file|src|image|picture|photo|avatar|thumbnail|logo)$/i;
JsonEditor.FLAG_START = /^(is|has|can|use|show|allow|must|auto|enable|hide|keep|need)[A-Z_]/;
JsonEditor.NUMBER_END = /(time|delay|duration|size|gap|count|round|opacity|index|step|length|width|height)$/i;
JsonEditor.FLAG_KEYS = ["enabled", "disabled", "active", "visible", "hidden", "selected", "checked", "done", "opened",
    "required", "editable", "removable", "animated", "bold", "italic", "published", "featured", "paid", "inStock", "available"];

JsonEditor.isOnOffValue = function (value) {
    return value === 0 || value === 1 || value === true || value === false || value === null || value === undefined;
};

// A name that says "on or off": active, isOpen, showPrices...
JsonEditor.isFlagName = function (name) {
    if (JsonEditor.FLAG_KEYS.indexOf(name) !== -1) return true;
    if (JsonEditor.NUMBER_END.test(name)) return false;
    return JsonEditor.FLAG_START.test(name);
};

JsonEditor.isCssColor = function (text) {
    return !!(window.CSS && CSS.supports("color", text));
};

// One value: "function", "color", "picture", "flag", "number", "text" or "any".
JsonEditor.kindOfNamedValue = function (name, value) {
    if (typeof value === "function") return "function";
    const text = (typeof value === "string") ? value.trim() : "";
    const isEmpty = (value === null || value === undefined || value === "");
    const isNumberOrFlag = (typeof value === "number" || typeof value === "boolean");
    if (JsonEditor.COLOR_TEXT.test(text)) return "color";
    if (JsonEditor.COLOR_KEY.test(name) && (isEmpty || JsonEditor.isCssColor(text))) return "color";
    if (JsonEditor.PICTURE_TEXT.test(text)) return "picture";
    if (JsonEditor.PICTURE_KEY.test(name) && !isNumberOrFlag) return "picture";
    if (typeof value === "boolean") return "flag";
    if (JsonEditor.isFlagName(name) && JsonEditor.isOnOffValue(value)) return "flag";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "text";
    return "any";
};

// A name the table gives a column (a plain value, the name and the value of an object, a place in a list): not of the page.
JsonEditor.isOwnKey = function (key) {
    return key === JsonEditor.PLAIN_KEY || key === JsonEditor.NAME_KEY || key === JsonEditor.VALUE_KEY || /^\d+$/.test(key);
};

// The kind of a column: "flag", "color", "picture", "function", "number", "text" or "auto" (an empty column).
JsonEditor.kindOfColumnValues = function (key, values) {
    const name = (JsonEditor.isOwnKey(key)) ? "" : key;
    const sample = values.find(function (value) { return value !== null && value !== undefined; });
    const allAre = function (check) { return values.length > 0 && values.every(check); };
    if (allAre(function (value) { return typeof value === "boolean"; })) return "flag";
    const kind = JsonEditor.kindOfNamedValue(name, sample);
    if (kind === "color" || kind === "picture" || kind === "function") return kind;
    if (kind === "flag" && allAre(JsonEditor.isOnOffValue)) return "flag";
    if (allAre(function (value) { return typeof value === "number"; })) return "number";
    if (!values.length) return (JsonEditor.isFlagName(name)) ? "flag" : "auto";
    return "text";
};

// *** THE FUNCTIONS OF THE ROWS: a table and a JSON text can not hold a function; the callbacks of the rows (onClick...)
// of the old value stay in the new value.

JsonEditor.keepFunctions = function (value, old) {
    if (Array.isArray(value) && Array.isArray(old)) {
        return value.map(function (item, index) { return JsonEditor.keepFunctions(item, JsonEditor.sameRowOf(item, old, index)); });
    }
    if (!JsonEditor.isPlain(value) || !JsonEditor.isPlain(old)) return value;
    const result = {};
    Object.keys(value).forEach(function (key) {
        result[key] = JsonEditor.keepFunctions(value[key], old[key]);
    });
    Object.keys(old).forEach(function (key) {
        if (typeof old[key] === "function" && !(key in result)) result[key] = old[key];
    });
    return result;
};

// The row of the old list that a new row came from: the same key (a moved row), or the same place.
JsonEditor.ROW_ID_KEYS = ["key", "id", "value", "text", "title"];
JsonEditor.sameRowOf = function (item, oldRows, index) {
    if (!JsonEditor.isPlain(item)) return oldRows[index];
    const idKey = JsonEditor.ROW_ID_KEYS.find(function (key) { return item[key] !== undefined; });
    if (!idKey) return oldRows[index];
    const same = oldRows.find(function (row) { return JsonEditor.isPlain(row) && row[idKey] === item[idKey]; });
    return (same !== undefined) ? same : oldRows[index];
};

// *** HELPERS OF THE VIEW:

// "{count} rows" + { count: 3 } -> "3 rows"
JsonEditor.fillText = function (template, values = {}) {
    return String(template).replace(/\{(\w+)\}/g, function (whole, name) {
        return (values[name] === undefined) ? whole : String(values[name]);
    });
};

JsonEditor.spanOf = function (text) {
    return '<span style="margin-left:6px">' + basic.escapeHtml(text) + "</span>";
};

// Line icons on a grid of 16, in the color of the text.
JsonEditor.ICONS = {
    chevron: "M4.5 6.5L8 10l3.5-3.5",
    table: "M2 3h12v10H2zM2 6.5h12M2 10h12M6.5 3v10",
    back: "M5 3.5L2 6.5l3 3M2 6.5h7.5a3.5 3.5 0 0 1 0 7H7",
    forward: "M11 3.5l3 3-3 3M14 6.5H6.5a3.5 3.5 0 0 0 0 7H9",
    close: "M4 4l8 8M12 4l-8 8",
    plus: "M8 3v10M3 8h10",
    trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5",
    copy: "M5.5 5.5h8v8h-8zM2.5 10.5v-8h8",
    up: "M8 13V3M4 7l4-4 4 4",
    down: "M8 3v10M4 9l4 4 4-4",
    dots: "M6 3.5v.01M10 3.5v.01M6 8v.01M10 8v.01M6 12.5v.01M10 12.5v.01",
};

JsonEditor.iconOf = function (name, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none"' +
        ' stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' +
        JsonEditor.ICONS[name] + '"/></svg>';
};

// The looks of the buttons (the toolbar, the bottom bar, the window) from the colors of a style.
JsonEditor.looksOf = function (style) {
    const C = style.colors;
    return {
        button: { color: C.field, hoverColor: C.fieldHover, lineColor: C.fieldLine, hoverLineColor: C.fieldLineHover, textColor: C.text, ringColor: C.focus, fontSize: style.fontSize },
        accent: { color: C.accent, hoverColor: C.accentHover, lineColor: "", hoverLineColor: "", textColor: C.onAccent, ringColor: C.focus, fontSize: style.fontSize },
        icon: { color: "transparent", hoverColor: C.hover, textColor: C.icon, ringColor: C.focus },
    };
};

// LABEL: a button of a text (htmlText: an icon may be in it).
// look: { color, hoverColor, lineColor, hoverLineColor ("": no line), textColor, ringColor, fontSize }
JsonEditor.textButton = function (htmlText, look, onPress) {
    const btn = Label({
        text: htmlText,
        height: JsonEditor.SIZES.BUTTON_HEIGHT,
        fontSize: look.fontSize,
        textColor: look.textColor,
        color: look.color,
        round: 5,
        clickable: 1,
        cursor: "pointer",
    });
    btn.shrink = 0;
    btn.css = { padding: "0px 10px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap", transition: "background-color 0.12s" };
    btn.role = "button";
    btn.tabIndex = 0;
    btn.setFocusRing(look.ringColor);
    if (look.lineColor) btn.props({ border: 1, borderColor: look.lineColor });
    btn.onHoverChange(function (self, isOver) {
        btn.color = (isOver) ? look.hoverColor : look.color;
        if (look.lineColor) btn.borderColor = (isOver) ? look.hoverLineColor : look.lineColor;
    });
    btn.on("click", function () { onPress(btn); });
    btn.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onPress(btn);
    });
    return btn;
};

// LABEL: a button of an icon; its name is its tip. setEnabled(isOn): a pale button that does nothing.
JsonEditor.iconButton = function (iconName, nameText, look, onPress, size = JsonEditor.SIZES.ICON_BUTTON) {
    let isEnabled = true;
    const btn = Label({
        text: JsonEditor.iconOf(iconName, JsonEditor.SIZES.ICON),
        width: size,
        height: size,
        color: look.color,
        textColor: look.textColor,
        round: 6,
        clickable: 1,
        cursor: "pointer",
        lineHeight: "0",
    });
    btn.shrink = 0;
    btn.css = { display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.12s, opacity 0.12s" };
    btn.role = "button";
    btn.aria = { label: nameText };
    btn.elem.title = nameText;
    btn.setFocusRing(look.ringColor);
    const paint = function (isOver) {
        btn.color = (isOver && isEnabled) ? look.hoverColor : look.color;
        btn.opacity = (isEnabled) ? 1 : 0.35;
        btn.cursor = (isEnabled) ? "pointer" : "default";
        btn.tabIndex = (isEnabled) ? 0 : -1;
        btn.aria = { disabled: !isEnabled };
    };
    const press = function () {
        if (isEnabled) onPress(btn);
    };
    btn.setEnabled = function (value) {
        isEnabled = !!value;
        paint(false);
    };
    btn.onHoverChange(function (self, isOver) { paint(isOver); });
    btn.on("click", press);
    btn.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        press();
    });
    paint(false);
    return btn;
};

// A color text -> "#RRGGBB" (the color picker of the browser takes no other form). Not a color: black.
JsonEditor.hexOfColor = function (text) {
    const context = document.createElement("canvas").getContext("2d");
    context.fillStyle = "#000000";
    context.fillStyle = String(text ?? "").trim();
    const color = context.fillStyle;
    if (color.charAt(0) === "#") return color;
    const parts = (color.match(/[\d.]+/g) || []).slice(0, 3);
    return "#" + parts.map(function (part) { return Number(part).toString(16).padStart(2, "0"); }).join("");
};

// Opens the picker of a field of the browser (a color). WHY the old way too: showPicker() is newer than the field.
JsonEditor.openPicker = function (field) {
    try {
        if (field.showPicker) {
            field.showPicker();
            return;
        }
    } catch (error) { }
    field.click();
};

// Copies a text. WHY the old way too: the Clipboard API is refused in a page that is not secure or not in focus.
JsonEditor.copyText = function (text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text).catch(function () { return JsonEditor.copyTextOldWay(text); });
    }
    return JsonEditor.copyTextOldWay(text);
};

JsonEditor.copyTextOldWay = function (text) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const isCopied = document.execCommand("copy");
    area.remove();
    if (!isCopied) return Promise.reject(new Error("The browser did not copy it."));
    return Promise.resolve();
};

// *** THE WINDOW: the editor over the page, with Cancel and Apply.

// options: the params of JsonEditor, onApply(value) (Apply, when something was changed), onCancel() and onClose() (the window
// closed: after Apply, Cancel or win.close()). Returns the window: win.editor is its JsonEditor, win.close() closes it.
JsonEditor.open = function (options = {}) {

    const params = Object.assign({}, options);
    const onApply = params.onApply || function (value) { };
    const onCancel = params.onCancel || function () { };
    const onClose = params.onClose || function () { };
    const onChange = params.onChange || function (self, value) { };
    delete params.onApply;
    delete params.onCancel;
    delete params.onClose;
    const opener = document.activeElement; // WHY: the focus goes back to it, and a window opened from a Dialog goes over it
    let editor = null;
    let btnCancel = null;
    let isSureToCancel = 0;
    let stopSureTimer = null;

    const win = createIn(page, function () {
        // BOX: The cover over the page (the window is in it)
        const cover = startBox(0, 0, "100%", "100%", { color: "transparent" });
        cover.clickable = 1;
            editor = JsonEditor(Object.assign(params, {
                showTitleBar: 1,
                onChange: function (self, value) {
                    resetCancel(); // WHY: a change after the first press of Cancel asks again
                    onChange(self, value);
                },
            }));
        endBox();
        return cover;
    });
    const look = editor.style.window;
    const looks = JsonEditor.looksOf(editor.style);
    const texts = editor.texts;

    // PRIVATE FUNCTIONS:

    const placeWindow = function () {
        const margin = (page.width < JsonEditor.SIZES.NARROW_PAGE) ? look.narrowMargin : look.margin;
        editor.left = margin;
        editor.top = margin;
        editor.width = "calc(100% - " + (margin * 2) + "px)";
        editor.height = "calc(100% - " + (margin * 2) + "px)";
    };

    const close = function () {
        if (win._isRemoved) return;
        win.remove();
        if (opener && opener.focus && opener.isConnected) opener.focus({ preventScroll: true });
        onClose();
    };

    const apply = function () {
        const value = editor.getValue();
        if (value === null) return; // WHY: the bottom bar of the editor says why (a name used twice...)
        const isChanged = editor.hasChanges();
        close();
        if (isChanged) onApply(value);
    };

    // WHY two presses: a table can hold many typed values. The first press asks; it ends by itself.
    const requestCancel = function () {
        if (!editor.hasChanges() || isSureToCancel) {
            close();
            onCancel();
            return;
        }
        isSureToCancel = 1;
        btnCancel.text = basic.escapeHtml(texts.discard);
        if (stopSureTimer) stopSureTimer();
        stopSureTimer = win.after(JsonEditor.SIZES.SURE_TIME, resetCancel);
    };

    const resetCancel = function () {
        isSureToCancel = 0;
        if (btnCancel) btnCancel.text = basic.escapeHtml(texts.cancel);
    };

    // THE KEYS: the ones the editor did not use (it stops them).
    const onKeyDown = function (self, event) {
        if (event.defaultPrevented) return;
        const isCommand = (event.metaKey || event.ctrlKey);
        if (event.key === "Enter" && isCommand) {
            event.preventDefault();
            apply();
            return;
        }
        if (event.key !== "Escape") return;
        event.preventDefault();
        requestCancel();
    };

    // VIEW:

    win.color = look.coverColor;
    win.zIndex = basic.zIndexAbove(opener, look.zIndex);
    win.role = "dialog";
    win.aria = { label: editor.titleText || texts.table, modal: true };
    editor.boxShadow = look.shadow;
    placeWindow();
    createIn(editor.titleRow, function () {
        JsonEditor.iconButton("close", texts.close + " (Escape)", looks.icon, requestCancel, JsonEditor.SIZES.CLOSE_BUTTON);
    });
    createIn(editor.footer, function () {
        btnCancel = JsonEditor.textButton(basic.escapeHtml(texts.cancel), looks.button, requestCancel);
        btnCancel.css = { marginLeft: "auto" }; // WHY: at the right end also without the keys of the cells (showHint: 0)
        const btnApply = JsonEditor.textButton(basic.escapeHtml(texts.apply), looks.accent, apply);
        btnApply.elem.title = texts.apply + " (Cmd/Ctrl+Enter)";
    });

    // INIT:

    win.onPageResize(placeWindow);
    win.listenTo(document, "keydown", onKeyDown);
    win.editor = editor;
    win.close = close;
    editor.focus();
    return win;

};

// *** STYLE PACKAGES:
// USAGE: JsonEditor({ styleName: "dark" })
// USAGE: JsonEditor({ styleName: "dark", style: { colors: { accent: "#3DAA81" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
JsonEditor.styles = {

    // White, dark text, soft lines, a blue accent.
    light: JsonEditorDefaults.style,

    // For a dark page: the table window of basic-designer.
    dark: {
        box: { color: "#262626", border: 1, borderColor: "#444444", round: 10 },
        colors: {
            text: "#FFFFFF",
            headText: "#FFFFFF",
            soft: "#A5A5A5",
            dim: "#6E6E6E",
            icon: "#C8C8C8",
            line: "#444444",
            rowLine: "#444444",
            columnLine: "#444444",
            headLine: "#4D4D4D",
            strongLine: "#5C5C5C",
            ground: "#262626",
            head: "#262626",
            field: "#383838",
            fieldHover: "#434343",
            hover: "#383838",
            selected: "#34435A",
            segment: "#2C2C2C",
            accent: "#0C8CE9",
            accentHover: "#3AA0F0",
            accentText: "#7CC4F8",
            onAccent: "#FFFFFF",
            focus: "#0C8CE9",
            editor: "#1E1E1E",
            swatchLine: "rgba(255, 255, 255, 0.25)",
            thumb: "#8A8A8A",
            scrollBar: "rgba(255, 255, 255, 0.22)",
            scrollBarHover: "rgba(255, 255, 255, 0.35)",
            placeholder: "rgba(255, 255, 255, 0.35)",
        },
        popupShadow: "0 6px 18px rgba(0, 0, 0, 0.45)",
        searchStyleName: "ozdenDark",
        search: { color: "#383838" },
        menuStyleName: "dark",
        window: { coverColor: "rgba(0, 0, 0, 0.55)", shadow: "0 20px 60px rgba(0, 0, 0, 0.6)" },
    },

};

// The minimal theme (_designs/minimal-theme.htm), as SmartTable "minimal": small (28 px rows, a 13 px text) on the ground of
// the window with a line around it: thin lines between the rows and none between the columns, soft titles over a line, a
// faint row under the mouse, buttons of lines (Apply is the only filled one: ink), the minimal search and menus.
// minimalDark: the same on a dark window.
// WHY opaque fills for the rows: the numbers of the rows stay over the cells when the table moves to the side.
JsonEditor.createMinimalStyle = function (colors) {
    return {
        box: { color: colors.ground, border: 1, borderColor: colors.line, round: 4 },
        colors: {
            text: colors.text,
            headText: colors.softText,
            soft: colors.softText,
            dim: colors.faintText,
            icon: colors.softText,
            line: colors.line,
            rowLine: colors.track,
            columnLine: "transparent",
            headLine: colors.line,
            strongLine: colors.edge,
            ground: colors.ground,
            head: colors.ground,
            field: "transparent",
            fieldHover: "transparent",
            fieldLine: colors.line,
            fieldLineHover: colors.lineHover,
            hover: colors.hover,
            selected: colors.selected,
            segment: colors.ground,
            accent: colors.ink,
            accentHover: colors.inkHover,
            accentText: colors.ink,
            onAccent: colors.onInk,
            focus: colors.focus,
            editor: colors.ground,
            swatchLine: colors.line,
            thumb: "#8A8A8A",
            scrollBar: colors.scrollBar,
            scrollBarHover: colors.scrollBarHover,
            placeholder: colors.faintText,
        },
        fontSize: 13,
        headFontSize: 12,
        rowHeight: 28,
        headHeight: 30,
        popupShadow: "none",
        searchStyleName: colors.minimalName,
        // WHY every key: the keys of the default search (made for its ozden package) would be over the minimal package too.
        search: {
            height: 28,
            fontSize: 13,
            searchIconSize: 14,
            searchIconLeft: 10,
            searchIconGap: 6,
            clearIconRight: 8,
            round: 14,
            color: "transparent",
            border: 1,
            borderBottomStyle: "1px solid " + colors.edge,
            textOffsetY: 0,
            clearIconOffsetY: 0,
        },
        menuStyleName: colors.minimalName,
        window: { coverColor: colors.cover, shadow: "none" },
    };
};
JsonEditor.MINIMAL_COLORS = {
    ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2), lineHover: Black(0.45),
    edge: Black(0.45), track: Black(0.08), hover: "#F7F7F7", selected: "#F0F0F0", ink: "#1F1F1F", inkHover: "#3A3A3A",
    onInk: "#FFFFFF", focus: "#3D8BD9", scrollBar: Black(0.2), scrollBarHover: Black(0.35), cover: Black(0.3), minimalName: "minimal",
};
JsonEditor.styles.minimal = JsonEditor.createMinimalStyle(JsonEditor.MINIMAL_COLORS);
JsonEditor.MINIMAL_DARK_COLORS = {
    ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18), lineHover: White(0.42),
    edge: White(0.42), track: White(0.08), hover: "#232322", selected: "#2C2C2B", ink: "#EDEDEB", inkHover: "#FFFFFF",
    onInk: "#1A1A19", focus: "#7FB6DE", scrollBar: White(0.22), scrollBarHover: White(0.35), cover: Black(0.6), minimalName: "minimalDark",
};
JsonEditor.styles.minimalDark = JsonEditor.createMinimalStyle(JsonEditor.MINIMAL_DARK_COLORS);
