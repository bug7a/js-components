/* Bismillah */

/*

basic-designer: the table window of a list or an object of a parameter

- A list (items, options, rows, tags...) or an object is shown as a table: + adds a row, a click on a cell changes it, a
  title sorts, a row is dragged to another place. A cell that holds a list or an object opens as a table of its own.
- WHY a window over the whole designer: a table needs the width, and nobody designs while typing data. The changes go to
  the component with Apply (one undo step in the designer). Inside the window Cmd/Ctrl+Z undoes its own steps.
- Every shape of a list is kept: [{ a, b }], ["A", "B"], [[1, 2], [3, 4]] and mixed ones ["A", { text: "B" }, "-"].
- The functions of the rows (onClick...) stay in their rows; only their code can not be changed here.

Developer: Bugra Ozden

*/

"use strict";

BasicDesigner.TABLE = {
    ROW_HEIGHT: 30,
    HEAD_HEIGHT: 32,
    HANDLE_WIDTH: 22,
    NUMBER_WIDTH: 38,
    END_WIDTH: 30,
    MIN_COLUMN: 64,
    COLUMN_EDGE_WIDTH: 7,
    MAX_AUTO_COLUMN: 320,
    LETTER_WIDTH: 7,
    MARGIN: 24,
    ADD_ROW_WIDTH: 120,
    Z_INDEX: 8900, // WHY: under the tips (9000), the lists (9100) and the dialogs (9600)
    ROW_BUFFER: 12, // Rows drawn out of sight: a small scroll draws nothing
    HISTORY_LIMIT: 100,
    DRAG_SCROLL_EDGE: 28,
    DRAG_SCROLL_STEP: 14,
    SURE_TIME: 5000,
    EDITOR_LINE_HEIGHT: 18,
    EDITOR_MAX_LINES: 6,
    PLAIN_KEY: "(value)", // The column of a row that is a plain value ("A", 12)
    NAME_KEY: "(name)", // An object: the name of a row
    VALUE_KEY: "(data)", // An object: the value of a row
};

// *** THE DATA OF A TABLE: a list or an object <-> rows and columns. Nothing here draws.

BasicDesigner.nextTableRowId = 1;

// shape: "object" { a: 1 }, "array" [1, 2], "plain" "A", "pair" a row of an object.
BasicDesigner.newTableRow = function (shape, cells) {
    return { id: BasicDesigner.nextTableRowId++, shape: shape, cells: cells };
};

BasicDesigner.tableRowsOfList = function (list) {
    return list.map(function (item) {
        if (BasicDesigner.isPlain(item)) return BasicDesigner.newTableRow("object", Object.assign({}, item));
        if (Array.isArray(item)) {
            const cells = {};
            item.forEach(function (value, index) { cells[index] = value; });
            return BasicDesigner.newTableRow("array", cells);
        }
        const plainCells = {};
        plainCells[BasicDesigner.TABLE.PLAIN_KEY] = item;
        return BasicDesigner.newTableRow("plain", plainCells);
    });
};

BasicDesigner.newTableColumn = function (key, hint) {
    const T = BasicDesigner.TABLE;
    const column = { key: key, title: key, width: T.MIN_COLUMN, note: "", options: null };
    if (key === T.PLAIN_KEY) column.title = "value";
    if (/^\d+$/.test(key)) column.title = String(Number(key) + 1);
    if (hint) {
        column.note = hint.note || "";
        if (hint.options && hint.options.length >= 2) column.options = hint.options;
    }
    return column;
};

// The columns of the rows, in the order of their first use. An empty list: the keys its comment names (hints).
BasicDesigner.tableColumnsOfRows = function (rows, hints) {
    const T = BasicDesigner.TABLE;
    const columns = [];
    const hintOf = function (key) { return hints.find(function (hint) { return hint.key === key; }); };
    const add = function (key) {
        const isKnown = columns.some(function (column) { return column.key === key; });
        if (!isKnown) columns.push(BasicDesigner.newTableColumn(key, hintOf(key)));
    };
    if (rows.some(function (row) { return row.shape === "plain"; })) add(T.PLAIN_KEY);
    rows.forEach(function (row) {
        if (row.shape === "array") Object.keys(row.cells).forEach(add);
    });
    rows.forEach(function (row) {
        if (row.shape === "object") Object.keys(row.cells).forEach(add);
    });
    if (!columns.length) hints.forEach(function (hint) { add(hint.key); });
    if (!columns.length) add(T.PLAIN_KEY);
    return columns;
};

BasicDesigner.tableLevelOf = function (value, hints) {
    const T = BasicDesigner.TABLE;
    if (Array.isArray(value)) {
        const listRows = BasicDesigner.tableRowsOfList(value);
        return { isObject: false, rows: listRows, columns: BasicDesigner.tableColumnsOfRows(listRows, hints || []) };
    }
    const pairRows = Object.keys(value).map(function (name) {
        const cells = {};
        cells[T.NAME_KEY] = name;
        cells[T.VALUE_KEY] = value[name];
        return BasicDesigner.newTableRow("pair", cells);
    });
    const nameColumn = BasicDesigner.newTableColumn(T.NAME_KEY);
    nameColumn.title = "name";
    const valueColumn = BasicDesigner.newTableColumn(T.VALUE_KEY);
    valueColumn.title = "value";
    return { isObject: true, rows: pairRows, columns: [nameColumn, valueColumn] };
};

// A row -> its item. WHY the plain cell can be next to other cells: a plain row that got a value in another column becomes
// an object, and its value stays (with the name "value"; renaming the column turns all of them into that name).
BasicDesigner.valueOfTableRow = function (row, columns) {
    const T = BasicDesigner.TABLE;
    if (row.shape === "array") {
        const list = columns.filter(function (column) { return /^\d+$/.test(column.key); }).map(function (column) { return row.cells[column.key]; });
        while (list.length && list[list.length - 1] === undefined) list.pop();
        return list.map(function (item) { return (item === undefined) ? null : item; });
    }
    const named = columns.filter(function (column) { return column.key !== T.PLAIN_KEY && row.cells[column.key] !== undefined; });
    const plain = row.cells[T.PLAIN_KEY];
    if (!named.length && plain !== undefined) return plain;
    if (!named.length && row.shape === "plain") return "";
    const item = {};
    if (plain !== undefined) item.value = plain;
    named.forEach(function (column) { item[column.key] = row.cells[column.key]; });
    // WHY: a cell of a column that is not shown any more (a function of another shape) is not lost.
    Object.keys(row.cells).forEach(function (key) {
        if (key !== T.PLAIN_KEY && !(key in item) && typeof row.cells[key] === "function") item[key] = row.cells[key];
    });
    return item;
};

// The table -> its list or its object. A name that is used twice throws.
BasicDesigner.valueOfTableLevel = function (level) {
    const T = BasicDesigner.TABLE;
    if (!level.isObject) {
        return level.rows.map(function (row) { return BasicDesigner.valueOfTableRow(row, level.columns); });
    }
    const object = {};
    level.rows.forEach(function (row) {
        const name = String(row.cells[T.NAME_KEY] ?? "").trim();
        if (name === "") throw new Error("a row has no name");
        if (name in object) throw new Error("the name \"" + name + "\" is used twice");
        const value = row.cells[T.VALUE_KEY];
        object[name] = (value === undefined) ? "" : value;
    });
    return object;
};

BasicDesigner.textOfTableValue = function (value) {
    if (value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "function") return "ƒ function";
    if (BasicDesigner.isOtherObject(value)) return BasicDesigner.paramText(value).text;
    try { return JSON.stringify(value); } catch (error) { return String(value); }
};

// A Date, an object of basic.js... It stays in its cell, but it can not be written.
BasicDesigner.isOtherObject = function (value) {
    return value !== null && typeof value === "object" && !Array.isArray(value) && !BasicDesigner.isPlain(value);
};

// WHY not a short list of numbers: [14, 10] is read and written faster as a text than as a table of its own.
BasicDesigner.isNestedValue = function (value) {
    const isSidesList = (Array.isArray(value) && value.length <= 4 && value.every(function (item) { return typeof item === "number"; }));
    if (isSidesList && value.length) return false;
    return Array.isArray(value) || BasicDesigner.isPlain(value);
};

// What sorts first: numbers by their size, texts as people read them, an empty cell at the end.
BasicDesigner.compareTableValues = function (a, b) {
    const isAEmpty = (a === undefined || a === null || a === "");
    const isBEmpty = (b === undefined || b === null || b === "");
    if (isAEmpty || isBEmpty) return (isAEmpty ? 1 : 0) - (isBEmpty ? 1 : 0);
    if (typeof a === "number" && typeof b === "number") return a - b;
    return BasicDesigner.textOfTableValue(a).localeCompare(BasicDesigner.textOfTableValue(b), undefined, { numeric: true, sensitivity: "base" });
};

// A pasted text -> { list } (JSON) or { grid } (lines of cells: a spreadsheet, or a text of lines), or null (one plain text).
BasicDesigner.readPastedTable = function (text) {
    const trimmed = String(text).trim();
    if (/^[[{]/.test(trimmed)) {
        try {
            const data = JSON.parse(trimmed);
            return { list: (Array.isArray(data)) ? data : [data] };
        } catch (error) { }
    }
    const hasTabs = (trimmed.indexOf("\t") !== -1);
    const hasLines = (trimmed.indexOf("\n") !== -1);
    if (!hasTabs && !hasLines) return null;
    return { grid: trimmed.split(/\r?\n/).map(function (line) { return line.split("\t"); }) };
};

// The kind a column shows, from its values and its name.
BasicDesigner.kindOfTableValues = function (key, values, note) {
    const T = BasicDesigner.TABLE;
    const isOwnKey = (key === T.PLAIN_KEY || key === T.NAME_KEY || key === T.VALUE_KEY || /^\d+$/.test(key));
    const name = (isOwnKey) ? "" : key;
    const sample = values.find(function (value) { return value !== null && value !== undefined; });
    const allAre = function (check) { return values.length > 0 && values.every(check); };
    if (allAre(function (value) { return typeof value === "boolean"; })) return "flag";
    const kind = BasicDesigner.paramKindOf(name, sample, undefined, note, "");
    if (kind.name === "color" || kind.name === "picture" || kind.name === "function") return kind.name;
    if (kind.name === "list") return "option";
    if (kind.name === "flag" && allAre(BasicDesigner.isOnOffValue)) return "flag";
    if (allAre(function (value) { return typeof value === "number"; })) return "number";
    if (kind.name === "number" || kind.name === "size" || kind.name === "padding") return "number";
    if (!values.length) return (kind.name === "flag") ? "flag" : "auto";
    return "text";
};

BasicDesigner.TABLE_COLUMN_TYPES = [
    { key: "", text: "From its values" },
    { key: "text", text: "Text" },
    { key: "number", text: "Number" },
    { key: "flag", text: "On / off" },
    { key: "color", text: "Color" },
    { key: "picture", text: "Picture" },
];

// *** THE WINDOW:

// options: { title, rootName, note, value, columnHints: [{ key, note, options }], onApply(value) }
BasicDesigner.openTableWindow = function (options) {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const T = BasicDesigner.TABLE;
    const ROW = T.ROW_HEIGHT;
    const GUTTER = T.HANDLE_WIDTH + T.NUMBER_WIDTH;

    // *** PRIVATE VARIABLES:

    const levels = []; // The root and the cells that were opened: { name, level data, undoList, redoList, selected, active...}
    let level = null;
    let viewRows = []; // The rows of the level after the search
    let searchText = "";
    let editing = null; // { rowId, columnKey, startText }
    let isJsonView = false;
    let isClosed = false;
    let isSureToCancel = false;
    let hasChanged = false; // Anything changed since the window opened
    let hoveredRowId = null;
    let drawnFirst = -1;
    let drawnLast = -1;
    let rowsLayer = null;
    let rowViews = new Map(); // The rows in sight: id -> { box, gutter, end }
    let dragRow = null;
    let cancelTimer = null;

    let windowBox = null;
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
    let jsonBox = null;
    let jsonArea = null;
    let lblInfo = null;
    let btnCancel = null;
    let btnUndo = null;
    let btnRedo = null;
    let btnDuplicate = null;
    let btnDelete = null;
    let btnUp = null;
    let btnDown = null;
    let searchInput = null;
    let tableButtons = [];
    let btnAddColumn = null;
    let menu = null;
    let viewSwitch = null;
    let viewSwitchHolder = null;
    let lblStatus = null;

    // *** THE LEVELS: a cell that holds a list or an object opens as a table of its own, and goes back into its cell.

    const openLevel = function (name, value, hints, writeBack) {
        const data = BasicDesigner.tableLevelOf(value, hints);
        data.name = name;
        data.writeBack = writeBack;
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
                value = BasicDesigner.valueOfTableLevel(level);
            } catch (error) {
                showStatus(error.message);
                return false;
            }
            const finished = levels.pop();
            level = levels[levels.length - 1];
            if (finished.undoList.length) finished.writeBack(value);
        }
        showLevel();
        return true;
    };

    const showLevel = function () {
        searchText = "";
        if (searchInput) searchInput.setText("");
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

    // *** HISTORY: inside the window. A step is a copy of the rows and the columns.

    const copyOfLevel = function (source) {
        return {
            rows: source.rows.map(function (row) { return { id: row.id, shape: row.shape, cells: Object.assign({}, row.cells) }; }),
            columns: source.columns.map(function (column) { return Object.assign({}, column); }),
        };
    };

    const remember = function () {
        level.undoList.push(copyOfLevel(level));
        if (level.undoList.length > T.HISTORY_LIMIT) level.undoList.shift();
        level.redoList = [];
        hasChanged = true;
        isSureToCancel = false;
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
        afterRowsChange();
        drawHead();
    };

    const undo = function () { goToStep(level.undoList, level.redoList); };
    const redo = function () { goToStep(level.redoList, level.undoList); };

    // *** ROWS AND COLUMNS:

    const refreshViewRows = function () {
        const word = searchText.trim().toLowerCase();
        viewRows = level.rows.filter(function (row) {
            if (!word) return true;
            return Object.keys(row.cells).some(function (key) {
                return BasicDesigner.textOfTableValue(row.cells[key]).toLowerCase().indexOf(word) !== -1;
            });
        });
    };

    const afterRowsChange = function () {
        refreshViewRows();
        drawRows(true);
        placeActive();
        paintButtons();
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
            cells[T.NAME_KEY] = "";
            cells[T.VALUE_KEY] = "";
            return BasicDesigner.newTableRow("pair", cells);
        }
        if (isIndexTable()) return BasicDesigner.newTableRow("array", {});
        const isPlainTable = (level.columns.length === 1 && level.columns[0].key === T.PLAIN_KEY);
        return BasicDesigner.newTableRow((isPlainTable) ? "plain" : "object", {});
    };

    // WHY the first cell opens: + is usually followed by the first value of the row.
    const addRow = function (place) {
        commitEdit();
        remember();
        searchText = "";
        searchInput.setText("");
        const row = newRow();
        const index = (place === undefined) ? level.rows.length : place;
        level.rows.splice(index, 0, row);
        level.selected.clear();
        afterRowsChange();
        const column = level.columns[0];
        setActive(row.id, column.key);
        scrollToActive();
        startEdit(row, column);
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
        afterRowsChange();
    };

    const duplicateRows = function (rows) {
        if (!rows.length) return;
        commitEdit();
        remember();
        let lastCopy = null;
        rows.forEach(function (row) {
            lastCopy = BasicDesigner.newTableRow(row.shape, Object.assign({}, row.cells));
            if (level.isObject) lastCopy.cells[T.NAME_KEY] = String(row.cells[T.NAME_KEY]) + "Copy";
            level.rows.splice(level.rows.indexOf(row) + 1, 0, lastCopy);
        });
        level.selected.clear();
        if (level.active) level.active.rowId = lastCopy.id;
        afterRowsChange();
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
        afterRowsChange();
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
            showStatus("The column \"" + key + "\" is already there.");
            return;
        }
        commitEdit();
        remember();
        level.columns.push(BasicDesigner.newTableColumn(key, (options.columnHints || []).find(function (hint) { return hint.key === key; })));
        fitColumns();
        drawHead();
        afterRowsChange();
    };

    // A list of arrays: the next place. Else a name.
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
            showStatus("A table keeps one column at least.");
            return;
        }
        commitEdit();
        remember();
        level.columns = level.columns.filter(function (item) { return item !== column; });
        level.rows.forEach(function (row) { delete row.cells[column.key]; });
        fitColumns();
        drawHead();
        afterRowsChange();
    };

    // WHY the plain column has its own rename: its rows become objects with that name ("A" -> { text: "A" }).
    const renameColumn = function (column, typedName) {
        const name = String(typedName).trim();
        if (!name || name === column.key) return;
        if (columnByKey(name)) {
            showStatus("The column \"" + name + "\" is already there.");
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
        column.title = name;
        drawHead();
        afterRowsChange();
    };

    const moveColumn = function (column, direction) {
        const index = level.columns.indexOf(column);
        const target = index + direction;
        if (target < 0 || target >= level.columns.length) return;
        remember();
        level.columns.splice(index, 1);
        level.columns.splice(target, 0, column);
        drawHead();
        afterRowsChange();
    };

    const sortBy = function (column, direction) {
        commitEdit();
        remember();
        const isSameKey = (level.sort && level.sort.key === column.key);
        const firstOrder = (isSameKey) ? level.sort.order : level.rows.map(function (row) { return row.id; });
        const compare = function (a, b) { return BasicDesigner.compareTableValues(a.cells[column.key], b.cells[column.key]); };
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
        afterRowsChange();
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
        return BasicDesigner.kindOfTableValues(column.key, valuesOfColumn(column), column.note);
    };

    // An object: the kind of a value comes from its own name, not from its column.
    const kindOfCell = function (row, column) {
        const value = row.cells[column.key];
        if (typeof value === "function" || BasicDesigner.isOtherObject(value)) return "function";
        if (BasicDesigner.isNestedValue(value)) return "nested";
        if (column.key === T.NAME_KEY) return "text";
        if (column.key === T.VALUE_KEY) {
            const kind = BasicDesigner.paramKindOf(String(row.cells[T.NAME_KEY] ?? ""), value, undefined, "", "");
            if (kind.name === "color" || kind.name === "picture" || kind.name === "flag") return kind.name;
            if (kind.name === "list") return "option";
            return (typeof value === "number") ? "number" : "auto";
        }
        return column.kindNow || "text";
    };

    // The typed text of a cell -> its value. It keeps the type the cell had when it can.
    const valueOfCellText = function (text, row, column) {
        const old = row.cells[column.key];
        const kind = kindOfCell(row, column);
        const isAlwaysThere = (column.key === T.NAME_KEY || column.key === T.VALUE_KEY || column.key === T.PLAIN_KEY || row.shape === "array");
        if (text === "") return (isAlwaysThere) ? "" : undefined;
        if (text === "null") return null;
        const number = BasicDesigner.numberOfText(text);
        if (column.key === T.NAME_KEY) return text;
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
        if (kind === "nested" || kind === "auto") {
            try { return JSON.parse(text); } catch (error) { return text; }
        }
        if (kind === "option" && number !== null && (column.options || []).indexOf(number) !== -1) return number;
        return text;
    };

    // *** THE WIDTHS OF THE COLUMNS: from what they hold; the free room goes to the columns that have not been sized by hand.

    const measuredWidth = function (column) {
        let longest = String(column.title).length + 3;
        const kind = kindOfColumn(column);
        level.rows.slice(0, 200).forEach(function (row) {
            longest = Math.max(longest, BasicDesigner.textOfTableValue(row.cells[column.key]).length);
        });
        const extra = (kind === "color" || kind === "picture" || kind === "option") ? 26 : 0;
        return Math.max(T.MIN_COLUMN, Math.min(T.MAX_AUTO_COLUMN, longest * T.LETTER_WIDTH + 20 + extra));
    };

    const fitColumns = function () {
        const room = Math.max(0, scroller.elem.clientWidth - GUTTER - T.END_WIDTH);
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
    };

    const totalWidth = function () {
        return GUTTER + T.END_WIDTH + level.columns.reduce(function (sum, column) { return sum + column.width; }, 0);
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
            headInner = HGroup({ left: GUTTER, top: 0, width: totalWidth() - GUTTER, height: T.HEAD_HEIGHT, align: "left center", gap: 0, color: "transparent" });
            headInner.clipContent = 0;
                level.columns.forEach(drawHeadCell);
            endGroup();
        });
        syncHead();
    };

    const drawHeadCell = function (column) {
        const isSorted = (level.sort && level.sort.key === column.key);
        const arrow = (isSorted) ? ((level.sort.direction === "asc") ? " ↑" : " ↓") : "";
        const canHaveMenu = (!level.isObject);
        // GROUP: A title
        const cell = HGroup({ width: column.width, height: T.HEAD_HEIGHT, align: "left center", gap: 0, padding: [8, 0], color: "transparent" });
        cell.shrink = 0;
        cell.css = { borderRight: "1px solid " + C.line, boxSizing: "border-box", position: "relative" };
        cell.clickable = 1;
        cell.cursor = "pointer";
            const lbl = Label({ text: "", height: T.HEAD_HEIGHT, fontSize: 12, textColor: (column.key === T.PLAIN_KEY) ? C.soft : C.text, fontFamily: "opensans-bold", ellipsis: 1 });
            lbl.plainText = column.title + arrow;
            lbl.grow = 1;
            lbl.css = { minWidth: "0px", lineHeight: T.HEAD_HEIGHT + "px" };
            if (canHaveMenu) {
                const btnMenu = BasicDesigner.paramFieldButton("chevron", "The menu of this column", "Sort, rename, its type, delete.", function () {
                    openColumnMenu(column, btnMenu);
                });
                btnMenu.opacity = 0.6;
            }
            // BOX: The edge that changes its width
            const edge = Box({ left: column.width - T.COLUMN_EDGE_WIDTH - 1, top: 0, width: T.COLUMN_EDGE_WIDTH, height: T.HEAD_HEIGHT, color: "transparent", clickable: 1, cursor: "col-resize" });
            edge.css = { position: "absolute" };
            connectColumnEdge(edge, column);
        endGroup();
        cell.elem.title = (column.note) ? column.title + ": " + column.note : column.title + " · a click sorts";
        cell.on("click", function (self, event) {
            if (event.target === cell.elem || event.target === lbl.elem) sortNext(column);
        });
    };

    const connectColumnEdge = function (edge, column) {
        edge.elem.addEventListener("pointerdown", function (event) {
            if (event.button !== 0) return;
            event.preventDefault();
            event.stopPropagation();
            const startX = event.clientX;
            const startWidth = column.width;
            edge.elem.setPointerCapture(event.pointerId);
            const onMove = function (moveEvent) {
                column.width = Math.max(T.MIN_COLUMN, startWidth + moveEvent.clientX - startX);
                column.isSized = true;
                drawHead();
                // WHY: the new head has a new edge: this drag goes on from the window (see onUp).
                drawRows(true);
                placeActive();
            };
            const onUp = function () {
                window.removeEventListener("pointermove", onMove);
                window.removeEventListener("pointerup", onUp);
                window.removeEventListener("pointercancel", onUp);
            };
            window.addEventListener("pointermove", onMove);
            window.addEventListener("pointerup", onUp);
            window.addEventListener("pointercancel", onUp);
        });
    };

    const syncHead = function () {
        if (!headInner) return;
        headInner.css.transform = "translateX(" + (-scroller.elem.scrollLeft) + "px)";
    };

    // *** THE ROWS: only the ones in sight are drawn, so a long list stays fast.

    const drawRows = function (isForced) {
        const scrollTop = scroller.elem.scrollTop;
        const height = scroller.elem.clientHeight;
        const firstSeen = Math.floor(scrollTop / ROW);
        const lastSeen = Math.ceil((scrollTop + height) / ROW);
        const isDrawn = (firstSeen >= drawnFirst && lastSeen <= drawnLast);
        if (!isForced && isDrawn) return;
        drawnFirst = Math.max(0, firstSeen - T.ROW_BUFFER);
        drawnLast = Math.min(viewRows.length, lastSeen + T.ROW_BUFFER);
        content.width = totalWidth();
        content.height = (viewRows.length + 1) * ROW;
        if (rowsLayer) rowsLayer.remove();
        rowViews = new Map();
        rowsLayer = createIn(content, function () {
            // BOX: The rows in sight
            const layer = startBox(0, 0, totalWidth(), (viewRows.length + 1) * ROW, { color: "transparent" });
            layer.clipContent = 0;
                for (let i = drawnFirst; i < drawnLast; i++) {
                    if (viewRows[i]) drawRow(viewRows[i], i);
                }
                drawAddRow();
            endBox();
            return layer;
        });
        // WHY: the ring, the line and the field of a cell stay over the rows (they are made first).
        rowsLayer.zIndex = 0;
        paintCounts();
    };

    const drawRow = function (row, viewIndex) {
        const view = {};
        // GROUP: A row
        view.box = HGroup({ left: 0, top: viewIndex * ROW, width: totalWidth(), height: ROW, align: "left center", gap: 0, color: "transparent" });
        view.box.clipContent = 0;
        view.box.css = { borderBottom: "1px solid " + C.line, boxSizing: "border-box" };
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
        if (level.selected.has(rowId)) back = C.selectedRow;
        const ground = (back === "transparent") ? C.raised : back;
        view.box.color = back;
        view.gutter.color = ground;
        view.end.color = ground;
        view.end.text = (isHovered) ? BasicDesigner.paramIcon("trash", 14) : "";
    };

    const paintRows = function () {
        rowViews.forEach(function (view, rowId) { paintRow(rowId); });
    };

    const drawGutter = function (row) {
        const place = level.rows.indexOf(row) + 1;
        // GROUP: The handle and the number. WHY sticky: they stay in sight when the table scrolls to the side.
        const gutter = HGroup({ width: GUTTER, height: ROW - 1, align: "left center", gap: 0, color: C.raised });
        gutter.shrink = 0;
        gutter.clipContent = 0;
        gutter.css = { position: "sticky", left: "0px", zIndex: "1" };
            const handle = Label({ text: BasicDesigner.paramIcon("dots", 14), width: T.HANDLE_WIDTH, height: ROW - 1, textColor: C.dim, lineHeight: "0" });
            handle.shrink = 0;
            handle.css = { display: "flex", alignItems: "center", justifyContent: "center" };
            const lblNumber = Label({ text: String(place), width: T.NUMBER_WIDTH - 8, height: ROW - 1, fontSize: 11, textColor: C.dim });
            lblNumber.shrink = 0;
            lblNumber.css = { lineHeight: (ROW - 1) + "px", textAlign: "right" };
        endGroup();
        return gutter;
    };

    const drawRowEnd = function () {
        const end = Label({ text: "", width: T.END_WIDTH, height: ROW - 1, color: C.raised, textColor: C.soft, lineHeight: "0" });
        end.shrink = 0;
        end.css = { display: "flex", alignItems: "center", justifyContent: "center", position: "sticky", right: "0px", zIndex: "1" };
        return end;
    };

    const drawCell = function (row, column) {
        const kind = kindOfCell(row, column);
        const value = row.cells[column.key];
        // GROUP: A cell (it does not take the mouse: the rows layer reads the place of a click)
        const cell = HGroup({ width: column.width, height: ROW - 1, align: "left center", gap: 6, padding: [8, 0], color: "transparent" });
        cell.shrink = 0;
        cell.css = { borderRight: "1px solid " + C.line, boxSizing: "border-box" };
            if (kind === "flag" && value !== undefined && value !== null) {
                const toggle = BasicDesigner.buildSwitch(function () { });
                toggle.clickable = 0;
                toggle.setOn(value === 1 || value === true);
            }
            if (kind === "color") {
                const swatch = BasicDesigner.buildSwatchBox(function () { });
                swatch.clickable = 0;
                swatch.css.marginLeft = "0px";
                BasicDesigner.paintParamSwatch(swatch, value);
            }
            if (kind === "picture") {
                const thumb = BasicDesigner.buildSwatchBox(function () { });
                thumb.clickable = 0;
                thumb.color = BasicDesigner.PARAM_THUMB_COLOR;
                thumb.css = { marginLeft: "0px", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
                BasicDesigner.paintParamThumb(thumb, value);
            }
            drawCellText(kind, value);
            if (kind === "option") drawCellIcon("chevron");
            if (kind === "nested") drawCellIcon("table");
        endGroup();
    };

    const drawCellText = function (kind, value) {
        const lbl = Label({ text: "", height: ROW - 1, fontSize: 12, textColor: C.text, ellipsis: 1 });
        lbl.grow = 1;
        lbl.css = { minWidth: "0px", lineHeight: (ROW - 1) + "px" };
        let text = BasicDesigner.textOfTableValue(value);
        if (value === null) lbl.textColor = C.dim;
        if (kind === "function") lbl.textColor = C.dim;
        if (kind === "picture") text = BasicDesigner.shortPicture(text);
        if (kind === "nested") {
            text = (Array.isArray(value)) ? "[ " + value.length + " ]" : "{ " + Object.keys(value).length + " }";
            lbl.textColor = C.accentLight;
        }
        lbl.plainText = text;
    };

    const drawCellIcon = function (iconName) {
        const icon = Label({ text: BasicDesigner.paramIcon(iconName, 14), width: 14, height: ROW - 1, textColor: C.dim, lineHeight: "0" });
        icon.shrink = 0;
        icon.css = { display: "flex", alignItems: "center" };
    };

    // GROUP: + at the end of the rows (it stays in sight when the table moves to the side, as the numbers of the rows).
    const drawAddRow = function () {
        const row = HGroup({ left: 0, top: viewRows.length * ROW, width: totalWidth(), height: ROW, align: "left center", color: "transparent" });
        row.clipContent = 0;
            const lbl = Label({ text: "", height: ROW, fontSize: 12, textColor: C.accentLight });
            lbl.plainText = (searchText.trim()) ? "" : "+  Add a row";
            lbl.css = { position: "sticky", left: "0px", paddingLeft: "12px", lineHeight: ROW + "px" };
        endGroup();
    };

    const paintCounts = function () {
        const rowCount = level.rows.length;
        const shownCount = viewRows.length;
        const countText = (searchText.trim()) ? shownCount + " of " + rowCount + " rows" : rowCount + ((rowCount === 1) ? " row" : " rows");
        lblInfo.plainText = countText + " · " + level.columns.length + ((level.columns.length === 1) ? " column" : " columns");
    };

    // *** THE ACTIVE CELL: a ring on it. Its text is written in a field over it.

    const setActive = function (rowId, columnKey) {
        level.active = { rowId: rowId, columnKey: columnKey };
        placeActive();
        paintButtons();
    };

    const placeActive = function () {
        const active = level.active;
        const viewIndex = (active) ? viewRows.findIndex(function (row) { return row.id === active.rowId; }) : -1;
        const column = (active) ? columnByKey(active.columnKey) : null;
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
        const active = level.active;
        const viewIndex = (active) ? viewRows.findIndex(function (row) { return row.id === active.rowId; }) : -1;
        const column = (active) ? columnByKey(active.columnKey) : null;
        if (viewIndex === -1 || !column) return;
        const top = viewIndex * ROW;
        const view = scroller.elem;
        if (top < view.scrollTop) view.scrollTop = top;
        if (top + ROW > view.scrollTop + view.clientHeight) view.scrollTop = top + ROW - view.clientHeight;
        const left = leftOfColumn(column.key);
        if (left - GUTTER < view.scrollLeft) view.scrollLeft = left - GUTTER;
        if (left + column.width + T.END_WIDTH > view.scrollLeft + view.clientWidth) view.scrollLeft = left + column.width + T.END_WIDTH - view.clientWidth;
        drawRows(false);
    };

    // direction across the rows and the columns of what is shown. Past the end of a row: the next row.
    const moveActive = function (rowStep, columnStep) {
        const active = level.active;
        if (!active || !viewRows.length) return false;
        const viewIndex = viewRows.findIndex(function (row) { return row.id === active.rowId; });
        const columnIndex = level.columns.findIndex(function (column) { return column.key === active.columnKey; });
        let nextRow = viewIndex + rowStep;
        let nextColumn = columnIndex + columnStep;
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
        const kind = kindOfCell(row, column);
        if (kind === "function") return;
        const value = row.cells[column.key];
        const text = BasicDesigner.textOfTableValue(value);
        editing = { rowId: row.id, columnKey: column.key, startText: text };
        const viewIndex = viewRows.indexOf(row);
        editorBox.left = leftOfColumn(column.key);
        editorBox.top = viewIndex * ROW;
        editorBox.width = Math.max(column.width, 140);
        editorArea.value = (firstText !== undefined) ? firstText : text;
        fitEditorHeight();
        editorBox.visible = 1;
        editorArea.focus();
        editorArea.setSelectionRange(editorArea.value.length, editorArea.value.length);
    };

    const fitEditorHeight = function () {
        const lines = editorArea.value.split("\n").length;
        const shown = Math.min(lines, T.EDITOR_MAX_LINES);
        editorBox.height = (shown <= 1) ? ROW : shown * T.EDITOR_LINE_HEIGHT + 12;
    };

    // Returns false when the text can not be written (nothing is lost: the field stays).
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
        if (level.sort) level.sort = null;
        column.kindNow = kindOfColumn(column);
        drawHead();
        refreshViewRows();
        drawRows(true);
        placeActive();
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
        const isOnStart = (hit.xInCell < BasicDesigner.PARAM_SWATCH_SIZE + 12);
        if (kind === "color" && isOnStart) {
            openColorCell(row, column, event);
            return;
        }
        if (kind === "picture" && isOnStart) {
            openPictureCell(row, column);
            return;
        }
        const isOnEnd = (hit.xInCell > column.width - 26);
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
        const isOn = (value === 1 || value === true);
        const on = (isBoolean) ? true : 1;
        const off = (isBoolean) ? false : 0;
        setCell(row, column.key, (isOn) ? off : on);
        afterRowsChange();
    };

    const openNestedCell = function (row, column) {
        commitEdit();
        level.scrollTop = scroller.elem.scrollTop;
        level.scrollLeft = scroller.elem.scrollLeft;
        const place = level.rows.indexOf(row) + 1;
        const name = (level.isObject) ? String(row.cells[T.NAME_KEY]) : "row " + place + " · " + column.title;
        const hints = BasicDesigner.columnsOfNote("", column.note);
        const parent = level;
        openLevel(name, row.cells[column.key], hints, function (value) {
            parent.undoList.push(copyOfLevel(parent));
            parent.redoList = [];
            const rowNow = parent.rows.find(function (item) { return item.id === row.id; });
            if (rowNow) rowNow.cells[column.key] = value;
            hasChanged = true;
        });
    };

    const openColorCell = function (row, column, event) {
        let isRemembered = false;
        ui.panel.openColorPickerFor({
            key: "table-cell",
            hint: column.title,
            value: row.cells[column.key],
            noPagePick: 1,
            rect: { left: event.clientX, top: event.clientY, right: event.clientX, bottom: event.clientY + 4 },
            besideRect: { left: event.clientX - 8, top: event.clientY },
            commit: function (value) {
                if (!isRemembered) remember(); // WHY once: a drag in the picker is one step of the undo
                isRemembered = true;
                setCell(row, column.key, value);
                drawRows(true);
            },
        });
    };

    const openPictureCell = function (row, column) {
        BasicDesigner.openPictureBrowser(String(row.cells[column.key] || ""), function (repoPath) {
            remember();
            setCell(row, column.key, BasicDesigner.pathFromPage(repoPath));
            afterRowsChange();
        });
    };

    const openOptionCell = function (row, column, event) {
        const values = column.options || (BasicDesigner.paramKindOf(String(row.cells[T.NAME_KEY] ?? column.key), row.cells[column.key], undefined, column.note, "").options || []).map(function (item) { return item.value; });
        BasicDesigner.openParamList({
            rect: { left: event.clientX, top: event.clientY, right: event.clientX + 180, bottom: event.clientY + 4, width: 180 },
            items: BasicDesigner.optionItems(values, row.cells[column.key]),
            current: row.cells[column.key],
            onPick: function (value) {
                remember();
                setCell(row, column.key, value);
                afterRowsChange();
            },
        });
    };

    // *** THE MOUSE ON THE ROWS: the objects of the rows do not take it, the place tells what was pressed.

    const hitOf = function (event) {
        const contentRect = content.elem.getBoundingClientRect();
        const viewRect = scroller.elem.getBoundingClientRect();
        const viewIndex = Math.floor((event.clientY - contentRect.top) / ROW);
        const xInView = event.clientX - viewRect.left;
        const hit = { viewIndex: viewIndex, row: viewRows[viewIndex] || null, part: "", column: null, xInCell: 0 };
        if (viewIndex >= viewRows.length) {
            hit.part = (xInView < T.ADD_ROW_WIDTH) ? "add" : "";
            return hit;
        }
        if (!hit.row) return hit;
        const endLeft = Math.min(viewRect.width, contentRect.width - scroller.elem.scrollLeft) - T.END_WIDTH;
        if (xInView < T.HANDLE_WIDTH) hit.part = "handle";
        else if (xInView < GUTTER) hit.part = "number";
        else if (xInView >= endLeft) hit.part = "delete";
        if (hit.part) return hit;
        let left = 0;
        const x = event.clientX - contentRect.left - GUTTER;
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
        if (!event.shiftKey) level.active = { rowId: row.id, columnKey: (level.active) ? level.active.columnKey : level.columns[0].key };
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
        content.cursor = (hit.part === "handle") ? "grab" : ((hit.part === "cell") ? "text" : "pointer");
        if (nextId === hoveredRowId) return;
        const previousId = hoveredRowId;
        hoveredRowId = nextId;
        paintRow(previousId);
        paintRow(nextId);
    };

    // DRAG: the handle of a row: a line shows its new place. Not while a search hides rows: the place would be a guess.
    const startRowDrag = function (event, row) {
        if (searchText.trim()) {
            showStatus("Clear the search to move a row.");
            return;
        }
        event.preventDefault();
        commitEdit();
        dragRow = { row: row, place: level.rows.indexOf(row) };
        const onMove = function (moveEvent) {
            const contentRect = content.elem.getBoundingClientRect();
            const viewRect = scroller.elem.getBoundingClientRect();
            if (moveEvent.clientY < viewRect.top + T.DRAG_SCROLL_EDGE) scroller.elem.scrollTop -= T.DRAG_SCROLL_STEP;
            if (moveEvent.clientY > viewRect.bottom - T.DRAG_SCROLL_EDGE) scroller.elem.scrollTop += T.DRAG_SCROLL_STEP;
            const place = Math.round((moveEvent.clientY - contentRect.top) / ROW);
            dragRow.place = Math.max(0, Math.min(level.rows.length, place));
            dropLine.top = Math.max(0, dragRow.place * ROW - 1);
            dropLine.width = totalWidth();
            dropLine.visible = 1;
        };
        const onUp = function () {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
            dropLine.visible = 0;
            finishRowDrag();
            // WHY after the click of this pointerup: it must not act on the row under the mouse.
            setTimeout(function () { dragRow = null; }, 0);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    };

    const finishRowDrag = function () {
        const from = level.rows.indexOf(dragRow.row);
        const to = (dragRow.place > from) ? dragRow.place - 1 : dragRow.place;
        if (to === from) return;
        remember();
        level.rows.splice(from, 1);
        level.rows.splice(to, 0, dragRow.row);
        level.sort = null;
        level.active = { rowId: dragRow.row.id, columnKey: (level.active) ? level.active.columnKey : level.columns[0].key };
        drawHead();
        afterRowsChange();
    };

    // *** MENUS:

    const openMenu = function (items, x, y) {
        if (!menu) {
            menu = createIn(page, function () {
                return ContextMenu({ styleName: "dark", minWidth: 200, onClick: function (self, item) { if (item.run) item.run(); } });
            });
            windowBox.own(menu);
        }
        menu.setItems(items);
        menu.openAt(x, y, windowBox);
    };

    const openRowMenu = function (row, x, y) {
        const place = level.rows.indexOf(row);
        const rows = (level.selected.has(row.id)) ? selectedRows() : [row];
        const isMany = (rows.length > 1);
        openMenu([
            { text: "Add a row above", key: "above", run: function () { addRow(place); } },
            { text: "Add a row below", key: "below", run: function () { addRow(place + 1); } },
            "-",
            { text: (isMany) ? "Duplicate " + rows.length + " rows" : "Duplicate", key: "duplicate", run: function () { duplicateRows(rows); } },
            { text: "Move up", key: "up", shortcut: "Alt+↑", run: function () { moveRows(rows, -1); } },
            { text: "Move down", key: "down", shortcut: "Alt+↓", run: function () { moveRows(rows, 1); } },
            "-",
            { text: (isMany) ? "Delete " + rows.length + " rows" : "Delete", key: "delete", run: function () { deleteRows(rows); } },
        ], x, y);
    };

    const openColumnMenu = function (column, button) {
        const rect = button.elem.getBoundingClientRect();
        const typeItems = BasicDesigner.TABLE_COLUMN_TYPES.map(function (type) {
            return {
                text: type.text,
                key: "type-" + type.key,
                checked: ((column.chosenKind || "") === type.key) ? 1 : 0,
                run: function () {
                    remember();
                    column.chosenKind = type.key;
                    column.kindNow = kindOfColumn(column);
                    afterRowsChange();
                },
            };
        });
        const canRename = (!/^\d+$/.test(column.key));
        openMenu([
            { text: "Sort A → Z", key: "asc", run: function () { sortBy(column, "asc"); } },
            { text: "Sort Z → A", key: "desc", run: function () { sortBy(column, "desc"); } },
            { text: "Back to the first order", key: "first", enabled: (level.sort) ? 1 : 0, run: function () { sortBy(column, ""); } },
            "-",
            { text: "Rename", key: "rename", enabled: (canRename) ? 1 : 0, run: function () { openColumnNamer(column); } },
            { text: "Type", key: "type", items: typeItems },
            { text: "Move left", key: "left", run: function () { moveColumn(column, -1); } },
            { text: "Move right", key: "right", run: function () { moveColumn(column, 1); } },
            "-",
            { text: "Delete the column", key: "delete", run: function () { deleteColumn(column); } },
        ], rect.left, rect.bottom + 2);
    };

    // A small field for a name, over the table. onDone(text)
    const askName = function (rect, placeholder, value, onDone) {
        let isFinished = false;
        const box = createIn(windowBox, function () {
            // GROUP: The field
            const group = HGroup({ left: rect.left - windowBox.elem.getBoundingClientRect().left, top: rect.top - windowBox.elem.getBoundingClientRect().top, width: 200, height: 28, align: "left center", color: C.field, round: 5, border: 1, borderColor: C.accent });
            group.zIndex = 5;
            group.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.45)";
            group.input = BasicDesigner.rawInput(group, { value: value });
            group.input.placeholder = placeholder;
            group.input.dataset.ownKeys = "1";
            endGroup();
            return group;
        });
        const finish = function (text) {
            if (isFinished) return;
            isFinished = true;
            box.remove();
            if (text !== null) onDone(text);
        };
        box.input.addEventListener("keydown", function (event) {
            event.stopPropagation();
            if (event.key === "Enter") finish(box.input.value);
            if (event.key === "Escape") finish(null);
        });
        box.input.addEventListener("blur", function () { finish(box.input.value); });
        box.input.focus();
        box.input.select();
    };

    const openColumnNamer = function (column) {
        const contentRect = content.elem.getBoundingClientRect();
        const left = contentRect.left + leftOfColumn(column.key);
        const viewRect = scroller.elem.getBoundingClientRect();
        askName({ left: Math.max(viewRect.left, left), top: viewRect.top - T.HEAD_HEIGHT + 2 }, "The name of the column", (column.key === T.PLAIN_KEY) ? "" : column.key, function (text) {
            renameColumn(column, text);
        });
    };

    // + Column: the names its comment gives, or a new one.
    const openColumnChooser = function (button) {
        const rect = button.elem.getBoundingClientRect();
        const hints = (levels.length === 1) ? options.columnHints || [] : [];
        const free = hints.filter(function (hint) { return !columnByKey(hint.key); });
        const askNewName = function () {
            askName({ left: rect.left, top: rect.bottom + 2 }, "The name of the new column", "", addColumn);
        };
        if (!free.length) {
            askNewName();
            return;
        }
        const items = free.map(function (hint) {
            return { text: hint.key, key: "column-" + hint.key, run: function () { addColumn(hint.key); } };
        });
        items.push("-");
        items.push({ text: "A new name…", key: "new", run: askNewName });
        openMenu(items, rect.left, rect.bottom + 2);
    };

    // *** COPY AND PASTE: a block of a spreadsheet goes into the cells from the active one; JSON adds rows.

    const pasteRows = function (list) {
        remember();
        const rows = BasicDesigner.tableRowsOfList(list);
        if (level.isObject) {
            showStatus("Paste a list into a list.");
            return;
        }
        BasicDesigner.tableColumnsOfRows(rows, []).forEach(function (column) {
            const isNewPlainColumn = (column.key === T.PLAIN_KEY && rows.every(function (row) { return row.shape !== "plain"; }));
            if (!columnByKey(column.key) && !isNewPlainColumn) level.columns.push(column);
        });
        level.rows = level.rows.concat(rows);
        fitColumns();
        drawHead();
        afterRowsChange();
        showStatus(rows.length + ((rows.length === 1) ? " row added." : " rows added."));
    };

    const pasteGrid = function (grid) {
        remember();
        const active = level.active;
        const firstColumn = (active) ? level.columns.findIndex(function (column) { return column.key === active.columnKey; }) : 0;
        const firstRow = (active) ? level.rows.findIndex(function (row) { return row.id === active.rowId; }) : level.rows.length;
        const headIsNames = grid.length > 1 && grid[0].every(function (text) { return !!columnByKey(text.trim()); });
        const dataLines = (headIsNames) ? grid.slice(1) : grid;
        dataLines.forEach(function (line, lineIndex) {
            const rowIndex = (headIsNames ? level.rows.length : firstRow + lineIndex);
            if (rowIndex >= level.rows.length) level.rows.push(newRow());
            const row = level.rows[rowIndex];
            line.forEach(function (text, cellIndex) {
                const column = (headIsNames) ? columnByKey(grid[0][cellIndex].trim()) : level.columns[firstColumn + cellIndex];
                if (column) setCell(row, column.key, valueOfCellText(text, row, column));
            });
        });
        fitColumns();
        drawHead();
        afterRowsChange();
        showStatus(dataLines.length + ((dataLines.length === 1) ? " line pasted." : " lines pasted."));
    };

    const onPaste = function (event) {
        const isOtherField = (event.target && event.target !== editorArea && /^(INPUT|TEXTAREA)$/.test(event.target.tagName));
        if (isJsonView || isOtherField) return;
        const text = (event.clipboardData) ? event.clipboardData.getData("text") : "";
        const pasted = BasicDesigner.readPastedTable(text);
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

    const onCopy = function (event) {
        if (isJsonView || editing) return;
        if (event.target && /^(INPUT|TEXTAREA)$/.test(event.target.tagName)) return;
        const rows = selectedRows();
        if (!rows.length) return;
        const lines = rows.map(function (row) {
            return level.columns.map(function (column) { return BasicDesigner.textOfTableValue(row.cells[column.key]); }).join("\t");
        });
        event.preventDefault();
        event.clipboardData.setData("text/plain", lines.join("\n"));
        showStatus((rows.length === 1) ? "A row was copied." : rows.length + " rows were copied.");
    };

    // *** THE JSON VIEW: the same data as a text.

    const jsonTextOfLevel = function () {
        return JSON.stringify(BasicDesigner.valueOfTableLevel(level), null, 2);
    };

    const showJsonView = function () {
        if (!commitEdit()) return;
        let text;
        try {
            text = jsonTextOfLevel();
        } catch (error) {
            showStatus(error.message);
            return;
        }
        isJsonView = true;
        jsonArea.value = text;
        jsonBox.startText = text;
        jsonBox.visible = 1;
        drawViewSwitch();
        paintButtons();
    };

    // Returns false when the text is not JSON: it stays, the place of the fault is in the status.
    const leaveJsonView = function () {
        const text = jsonArea.value;
        if (text === jsonBox.startText) {
            closeJsonView();
            return true;
        }
        let data;
        try {
            data = JSON.parse(text);
        } catch (error) {
            showStatus("Not JSON: " + error.message);
            return false;
        }
        const isRightShape = (level.isObject) ? BasicDesigner.isPlain(data) : Array.isArray(data);
        if (!isRightShape) {
            showStatus((level.isObject) ? "An object is needed: { ... }" : "A list is needed: [ ... ]");
            return false;
        }
        remember();
        const old = BasicDesigner.valueOfTableLevel(level);
        const fresh = BasicDesigner.tableLevelOf(BasicDesigner.keepFunctions(data, old), (levels.length === 1) ? options.columnHints : []);
        level.rows = fresh.rows;
        level.columns = fresh.columns;
        level.selected.clear();
        level.active = null;
        level.sort = null;
        closeJsonView();
        fitColumns();
        drawHead();
        afterRowsChange();
        return true;
    };

    const closeJsonView = function () {
        isJsonView = false;
        jsonBox.visible = 0;
        drawViewSwitch();
        paintButtons();
        showStatus("");
    };

    // *** THE PATH: the root and the cells opened in it. A click goes back.

    const drawPath = function () {
        if (groupPath.parts) groupPath.parts.forEach(function (part) { part.remove(); });
        groupPath.parts = createIn(groupPath, function () {
            const parts = [];
            levels.forEach(function (item, index) {
                const isLast = (index === levels.length - 1);
                if (index) {
                    const lblArrow = Label({ text: "›", fontSize: 14, textColor: C.dim, height: 26 });
                    lblArrow.css = { lineHeight: "26px" };
                    parts.push(lblArrow);
                }
                const lbl = Label({ text: "", fontSize: 14, textColor: (isLast) ? C.text : C.accentLight, fontFamily: "opensans-bold", height: 26 });
                lbl.plainText = (index) ? item.name : options.title;
                lbl.css = { lineHeight: "26px", whiteSpace: "nowrap" };
                if (!isLast) {
                    lbl.clickable = 1;
                    lbl.cursor = "pointer";
                    lbl.on("click", function () {
                        if (isJsonView && !leaveJsonView()) return;
                        closeLevelsTo(index);
                    });
                }
                parts.push(lbl);
            });
            return parts;
        });
        const note = (levels.length === 1) ? options.note : "";
        lblNote.plainText = note || "";
        lblNote.elem.title = note || "";
    };

    // *** THE TOOLBAR, THE FOOTER:

    const paintButtons = function () {
        const hasRows = selectedRows().length > 0;
        tableButtons.forEach(function (button) {
            button.visible = (isJsonView) ? 0 : 1;
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
        if (lblStatus) lblStatus.plainText = text;
    };

    const drawViewSwitch = function () {
        if (viewSwitch) viewSwitch.remove();
        viewSwitch = createIn(viewSwitchHolder, function () {
            return BasicDesigner.paramSegmented({
                width: 130,
                options: [{ value: "table", text: "Table" }, { value: "json", text: "JSON" }],
                value: (isJsonView) ? "json" : "table",
                onPick: function (value) {
                    if (value === "json") showJsonView();
                    else leaveJsonView();
                },
            });
        });
    };

    const copyJson = function () {
        commitEdit();
        try {
            const text = (isJsonView) ? jsonArea.value : jsonTextOfLevel();
            BasicDesigner.copyText(text);
            showStatus("The JSON was copied.");
        } catch (error) {
            showStatus(error.message);
        }
    };

    const buildToolbar = function () {
        // GROUP: The buttons of the table
        const bar = HGroup({ width: "100%", height: 44, align: "left center", gap: 4, padding: [14, 0], color: "transparent" });
        bar.shrink = 0;
        bar.clipContent = 0;
        bar.css = { borderBottom: "1px solid " + C.line, boxSizing: "border-box" };
            const btnAddRow = BasicDesigner.toolButton(BasicDesigner.paramIcon("plus", 14) + "<span style=\"margin-left:6px\">Row</span>", function () { addRow(); }, { color: C.field, hoverColor: C.fieldHover });
            btnAddColumn = BasicDesigner.toolButton(BasicDesigner.paramIcon("plus", 14) + "<span style=\"margin-left:6px\">Column</span>", addColumnFromButton, { color: C.field, hoverColor: C.fieldHover });
            const makeLine = function () {
                const line = Box({ width: 1, height: 20, color: C.line });
                line.shrink = 0;
                line.css = { position: "relative", left: "0px", top: "0px", margin: "0px 6px" };
                return line;
            };
            const line1 = makeLine();
            btnDuplicate = BasicDesigner.paramSmallIconButton("copy", "Duplicate (Cmd/Ctrl+D)", function () { duplicateRows(selectedRows()); });
            btnUp = BasicDesigner.paramSmallIconButton("up", "Move up (Alt+↑)", function () { moveRows(selectedRows(), -1); });
            btnDown = BasicDesigner.paramSmallIconButton("down", "Move down (Alt+↓)", function () { moveRows(selectedRows(), 1); });
            btnDelete = BasicDesigner.paramSmallIconButton("trash", "Delete (Delete)", function () { deleteRows(selectedRows()); });
            const line2 = makeLine();
            btnUndo = BasicDesigner.paramSmallIconButton("back", "Undo (Cmd/Ctrl+Z)", undo);
            btnRedo = BasicDesigner.paramSmallIconButton("forward", "Redo (Shift+Cmd/Ctrl+Z)", redo);
            const line3 = makeLine();

            // GROUP: The search
            const searchHolder = HGroup({ width: 220, height: 28, align: "left center", color: "transparent" });
            searchHolder.shrink = 0;
                searchInput = SearchInput({
                    styleName: "ozdenDark",
                    left: 0,
                    top: 0,
                    width: 220,
                    height: 28,
                    fontSize: 12,
                    searchIconSize: 14,
                    searchIconLeft: 8,
                    searchIconGap: 6,
                    clearIconRight: 8,
                    round: 6,
                    color: C.field,
                    border: 0,
                    borderBottomStyle: "none",
                    textOffsetY: 0,
                    placeholderText: "Search the rows",
                    onSearch: function (text) {
                        commitEdit();
                        searchText = String(text || "");
                        refreshViewRows();
                        scroller.elem.scrollTop = 0;
                        drawRows(true);
                        placeActive();
                    },
                });
            endGroup();

            // BOX: The free room
            const spacer = Box({ width: 1, height: 1, color: "transparent" });
            spacer.grow = 1;
            spacer.css = { position: "relative", left: "0px", top: "0px" };

            BasicDesigner.paramSmallIconButton("copy", "Copy as JSON", copyJson);
            viewSwitchHolder = HGroup({ width: 130, height: 24, align: "left center", color: "transparent" });
            viewSwitchHolder.shrink = 0;
            endGroup();
        endGroup();
        tableButtons = [btnAddRow, line1, btnDuplicate, btnUp, btnDown, btnDelete, line2, btnUndo, btnRedo, line3, searchHolder];
        drawViewSwitch();
    };

    const buildBody = function () {
        // BOX: The table and the JSON text
        const body = startBox({ width: "100%", height: 10, color: "transparent" });
        body.grow = 1;
        body.css = { position: "relative", left: "0px", top: "0px", minHeight: "0px" };

            // BOX: The titles
            headBox = startBox(0, 0, "100%", T.HEAD_HEIGHT, { color: C.raised });
            headBox.css = { borderBottom: "1px solid " + C.fieldBorder, boxSizing: "border-box" };
            endBox();
            // BOX: Over the titles that move to the side, as the numbers of the rows
            const headGutter = Box(0, 0, GUTTER, T.HEAD_HEIGHT, { color: C.raised });
            headGutter.css = { borderBottom: "1px solid " + C.fieldBorder, boxSizing: "border-box" };
            headGutter.zIndex = 1;

            // BOX: The rows
            scroller = startBox(0, T.HEAD_HEIGHT, "100%", "calc(100% - " + T.HEAD_HEIGHT + "px)", { color: "transparent" });
            scroller.scrollY = 1;
            scroller.scrollX = 1;
            scroller.elem.classList.add("basic-designer-table-scroll");
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

                    editorBox = startBox(0, 0, 0, ROW, { color: C.menu, visible: 0 });
                    editorBox.boxShadow = "inset 0 0 0 2px " + C.accent;
                    editorBox.zIndex = 4;
                    editorBox.clickable = 1;
                        editorArea = BasicDesigner.rawTextarea(editorBox, {});
                        editorArea.style.padding = "5px 8px";
                        editorArea.style.overflow = "hidden";
                        editorArea.style.whiteSpace = "pre";
                        editorArea.setAttribute("aria-label", "The value of the cell");
                    endBox();
                endBox();
            endBox();

            // BOX: The JSON text (over the table)
            jsonBox = startBox(0, 0, "100%", "100%", { color: C.raised, visible: 0 });
            jsonBox.zIndex = 6;
                jsonArea = BasicDesigner.rawTextarea(jsonBox, { isCode: true });
                jsonArea.style.padding = "12px 16px";
                jsonArea.setAttribute("aria-label", "JSON");
            endBox();
        endBox();
    };

    const buildFooter = function () {
        // GROUP: Fixed at the bottom: what the table holds, a message, Cancel and Apply
        const foot = HGroup({ width: "100%", height: 52, align: "left center", gap: 12, padding: [14, 0], color: "transparent" });
        foot.shrink = 0;
        foot.css = { borderTop: "1px solid " + C.line, boxSizing: "border-box" };
            lblInfo = Label({ text: "", fontSize: 12, textColor: C.soft });
            lblInfo.shrink = 0;
            lblStatus = Label({ text: "", fontSize: 12, textColor: C.accentLight, ellipsis: 1 });
            lblStatus.grow = 1;
            lblStatus.css = { minWidth: "0px" };
            const lblHint = Label({ text: "", fontSize: 11, textColor: C.dim });
            lblHint.plainText = "Tab: next cell · Enter: next row · Cmd/Ctrl+V: rows from a spreadsheet or JSON";
            lblHint.shrink = 0;
            btnCancel = BasicDesigner.toolButton("Cancel", requestCancel, { color: C.field, hoverColor: C.fieldHover });
            BasicDesigner.toolButton("Apply  (Cmd/Ctrl+Enter)", apply, { color: C.accent, hoverColor: C.accentHover });
        endGroup();
    };

    // *** OPEN, APPLY, CANCEL:

    const closeWindow = function () {
        if (isClosed) return;
        isClosed = true;
        clearTimeout(cancelTimer);
        BasicDesigner.closeParamList();
        ui.panel.closeColorPicker();
        ui.tableWindow = null;
        windowBox.remove();
    };

    const apply = function () {
        if (!commitEdit()) return;
        if (isJsonView && !leaveJsonView()) return;
        if (!closeLevelsTo(0)) return;
        let value;
        try {
            value = BasicDesigner.valueOfTableLevel(level);
        } catch (error) {
            showStatus(error.message);
            return;
        }
        const isChanged = hasChanged;
        closeWindow();
        if (isChanged) options.onApply(value);
    };

    // WHY two presses: a table can hold many typed values. The first press asks, and it ends by itself.
    const requestCancel = function () {
        const hasJsonChange = (isJsonView && jsonArea.value !== jsonBox.startText);
        if ((!hasChanged && !hasJsonChange) || isSureToCancel) {
            closeWindow();
            return;
        }
        isSureToCancel = true;
        btnCancel.text = "Discard the changes?";
        clearTimeout(cancelTimer);
        cancelTimer = setTimeout(function () {
            isSureToCancel = false;
            if (!isClosed) btnCancel.text = "Cancel";
        }, T.SURE_TIME);
    };

    // *** THE KEYS: the field of a cell first; then the cells; the text fields keep their own keys.

    const onEditorKey = function (event) {
        const isCommand = (event.metaKey || event.ctrlKey);
        if (event.key === "Enter" && isCommand) return false;
        if (event.key === "Enter" && event.shiftKey) {
            setTimeout(fitEditorHeight, 0);
            return true;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            commitEdit();
            const hasNext = moveActive(1, 0);
            if (hasNext) startEditActive();
            else content.elem.focus({ preventScroll: true });
            return true;
        }
        if (event.key === "Tab") {
            event.preventDefault();
            commitEdit();
            const hasNextCell = moveActive(0, (event.shiftKey) ? -1 : 1);
            if (hasNextCell) startEditActive();
            return true;
        }
        if (event.key === "Escape") {
            event.preventDefault();
            cancelEdit();
            return true;
        }
        if ((event.key === "ArrowUp" || event.key === "ArrowDown") && editorArea.value.indexOf("\n") === -1) {
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
        if (key === "Tab" && level.active) {
            event.preventDefault();
            moveActive(0, (event.shiftKey) ? -1 : 1);
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
            afterRowsChange();
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

    const onKeyDown = function (self, event) {
        if (isClosed || ui.dialog || BasicDesigner.paramList) return;
        if (event.target && event.target.closest && event.target.closest("[role=menu]")) return;
        if (ui.panel.isColorPickerOpen() && event.key === "Escape") return;

        const isCommand = (event.metaKey || event.ctrlKey);
        if (event.key === "Enter" && isCommand) {
            event.preventDefault();
            event.stopImmediatePropagation();
            apply();
            return;
        }
        const target = event.target;
        if (target && target.dataset && target.dataset.ownKeys) return;
        const isPressingButton = ((event.key === "Enter" || event.key === " ") && target && target.closest && target.closest("[role=button]"));
        if (isPressingButton) return;
        if (target === editorArea && onEditorKey(event)) {
            event.stopImmediatePropagation();
            return;
        }
        if (target === editorArea) return;
        const isOtherField = (target && /^(INPUT|TEXTAREA)$/.test(target.tagName));
        if (event.key === "Escape") {
            event.stopImmediatePropagation();
            if (isOtherField && target !== jsonArea) target.blur();
            else requestCancel();
            return;
        }
        if (isOtherField) return;
        if (onGridKey(event)) event.stopImmediatePropagation();
    };

    // *** OBJECT VIEW:

    createIn(page, function () {
        // BOX: The dark cover
        windowBox = startBox(0, 0, "100%", "100%", { color: "rgba(0, 0, 0, 0.55)" });
        windowBox.zIndex = T.Z_INDEX;
        windowBox.clickable = 1;
        windowBox.role = "dialog";
        windowBox.aria = { label: options.title, modal: true };

            // GROUP: The window
            const panel = VGroup(T.MARGIN, T.MARGIN, "calc(100% - " + (T.MARGIN * 2) + "px)", "calc(100% - " + (T.MARGIN * 2) + "px)", { align: "left top", gap: 0, color: C.raised, round: 12, border: 1, borderColor: C.line });
            panel.css = { alignItems: "stretch", boxSizing: "border-box" };
            panel.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.6)";
            panel.clickable = 1;

                // GROUP: The title: where it is, what the code says about it, close
                const titleBar = VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [14, 10], color: "transparent" });
                titleBar.css = { alignItems: "stretch", boxSizing: "border-box" };
                titleBar.shrink = 0;
                    const titleRow = HGroup({ width: "100%", height: 26, align: "left center", gap: 4, color: "transparent" });
                    titleRow.shrink = 0;
                        groupPath = HGroup({ width: 10, height: 26, align: "left center", gap: 8, color: "transparent" });
                        groupPath.grow = 1;
                        groupPath.css = { minWidth: "0px" };
                        endGroup();
                        BasicDesigner.iconButton({ path: BasicDesigner.PARAM_ICONS.close, name: "Close (Escape)", size: 26, iconSize: 14, onClick: requestCancel });
                    endGroup();
                    lblNote = Label({ text: "", height: 16, fontSize: 11, textColor: C.soft, ellipsis: 1 });
                    lblNote.css = { lineHeight: "16px" };
                    lblNote.shrink = 0;
                endGroup();

                buildToolbar();
                buildBody();
                buildFooter();

            endGroup();
        endBox();
    });

    // *** OBJECT INIT CODE:

    ui.tableWindow = windowBox;
    windowBox.closeWindow = closeWindow;

    basic.addCss("basic-designer-table-css",
        ".basic-designer-table-scroll::-webkit-scrollbar { width: 10px; height: 10px; }" +
        ".basic-designer-table-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.22); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }" +
        ".basic-designer-table-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.35); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }");

    content.on("click", onContentClick);
    content.on("mousemove", onContentMove);
    content.on("mouseleave", function () {
        const previousId = hoveredRowId;
        hoveredRowId = null;
        paintRow(previousId);
    });
    content.elem.addEventListener("pointerdown", function (event) {
        if (event.button !== 0 || event.target === editorArea) return;
        const hit = hitOf(event);
        if (hit.part === "handle" && hit.row) startRowDrag(event, hit.row);
    });
    content.elem.addEventListener("contextmenu", function (event) {
        const hit = hitOf(event);
        event.preventDefault();
        if (hit.row) openRowMenu(hit.row, event.clientX, event.clientY);
    });
    scroller.elem.addEventListener("scroll", function () {
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
    jsonArea.addEventListener("keydown", function (event) {
        if (event.key !== "Tab") return;
        event.preventDefault();
        const start = jsonArea.selectionStart;
        jsonArea.setRangeText("  ", start, jsonArea.selectionEnd, "end");
    });
    editorArea.addEventListener("blur", function () {
        if (!isClosed) commitEdit();
    });
    windowBox.listenTo(document, "keydown", onKeyDown, true);
    windowBox.listenTo(document, "paste", function (self, event) { onPaste(event); });
    windowBox.listenTo(document, "copy", function (self, event) { onCopy(event); });

    openLevel(options.rootName || "", options.value, options.columnHints || [], function () { });
    content.elem.focus({ preventScroll: true });
    return windowBox;

};
