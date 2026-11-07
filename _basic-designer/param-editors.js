/* Bismillah */

/*

basic-designer: the rows of the Parameters view and their small editors

- A row: its name | its text field. The field stays a text that can be written; what it holds decides what is added to it
  (param-kinds.js): a color has its swatch at its start (as in the Box view), a switch or a button at its end.
- A click on the name does the same as that button; a number also changes when its name is dragged.
- The small editors are windows at the left of the panel, so the page stays in sight and shows every change at once. Their
  titles move them. A list of data is too big for that: it opens in its own window (JsonEditor.open of comp/json-editor.js).
- A change makes the component again, so a drag sends only a few changes in a second (sendParamLive).

Developer: Bugra Ozden

*/

"use strict";

// *** ICONS: small line pictures on a grid of 16, as the icons of the top bar.

BasicDesigner.PARAM_ICONS = {
    chevron: "M4.5 6.5L8 10l3.5-3.5",
    sliders: "M2 5h6.5M11.5 5H14M2 11h2.5M7.5 11H14M8.5 3.5v3h3v-3zM4.5 9.5v3h3v-3z",
    expand: "M9.5 2.5h4v4M13.5 2.5L9 7M6.5 13.5h-4v-4M2.5 13.5L7 9",
    table: "M2 3h12v10H2zM2 6.5h12M2 10h12M6.5 3v10",
    braces: "M6 2.5c-1.5 0-2 .7-2 2v2c0 .9-.5 1.5-1.5 1.5 1 0 1.5.6 1.5 1.5v2c0 1.3.5 2 2 2M10 2.5c1.5 0 2 .7 2 2v2c0 .9.5 1.5 1.5 1.5-1 0-1.5.6-1.5 1.5v2c0 1.3-.5 2-2 2",
    sides: "M2.5 2.5h11v11h-11zM6 6h4v4H6z",
    corners: "M5.5 3.5h5a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3v-3a3 3 0 0 1 3-3z", // WHY a card: the four corners are the prefix of the field
    gap: "M2.5 3v10M13.5 3v10M5.5 8h5M7 6.5L5.5 8 7 9.5M9 6.5l1.5 1.5L9 9.5",
    shadow: "M2.5 2.5h8.5v8.5H2.5zM13.5 5.5v8h-8",
    line: "M2 5h12M2 8h5M9 8h5M2 11h2M6 11h2M10 11h2",
    motion: "M2 12.5C7 12.5 7 3.5 14 3.5",
    filter: "M2.5 3.5h11L9 9v4l-2 1V9z",
    align: "M3 3h2v2H3zM7 3h2v2H7zM11 3h2v2h-2zM3 7h2v2H3zM7 7h2v2H7zM11 7h2v2h-2zM3 11h2v2H3zM7 11h2v2H7zM11 11h2v2h-2z",
    picture: "M2 3h12v10H2zM2 11l3.5-3.5L8 10l2.5-2.5L14 11M5.5 5.5v.01",
    fn: "M10.5 2.5c-1.5 0-2.2.8-2.5 2.2L6.5 11.3c-.3 1.4-1 2.2-2.5 2.2M5 6.5h5",
    calendar: "M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3",
    clock: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3.2l2.2 1.3",
    gradient: "M2.5 2.5h11v11h-11zM5.5 2.5v11M8.5 2.5v11M11 2.5v11",
    back: "M5 3.5L2 6.5l3 3M2 6.5h7.5a3.5 3.5 0 0 1 0 7H7",
    forward: "M11 3.5l3 3-3 3M14 6.5H6.5a3.5 3.5 0 0 0 0 7H9",
    close: "M4 4l8 8M12 4l-8 8",
    plus: "M8 3v10M3 8h10",
    trash: "M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.7 8.5h5.6l.7-8.5",
    copy: "M5.5 5.5h8v8h-8zM2.5 10.5v-8h8",
    up: "M8 13V3M4 7l4-4 4 4",
    down: "M8 3v10M4 9l4 4 4-4",
    dots: "M6 3.5v.01M10 3.5v.01M6 8v.01M10 8v.01M6 12.5v.01M10 12.5v.01",
    columns: "M2.5 3h4v10h-4zM9.5 3h4v10h-4z",
    check: "M3.5 8.5l3 3 6-7",
    text: "M3 4h10M8 4v9M5.5 13h5",
};

BasicDesigner.paramIcon = function (name, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none"' +
        ' stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' +
        BasicDesigner.PARAM_ICONS[name] + '"/></svg>';
};

// *** THE ROWS:

BasicDesigner.PARAM_ROW_HEIGHT = 24;
BasicDesigner.PARAM_FIELD_HEIGHT = 22;
BasicDesigner.PARAM_NAME_WIDTH = 104;
BasicDesigner.PARAM_ROW_GAP = 4; // Between a name and its field
BasicDesigner.PARAM_ROWS_SIDE = 10; // The space at both sides of the rows
BasicDesigner.PARAM_BUTTON_WIDTH = 20;
BasicDesigner.PARAM_SWATCH_SIZE = 14;
BasicDesigner.PARAM_THUMB_COLOR = "#8A8A8A"; // WHY a middle gray: black icons and white icons both show on it
BasicDesigner.CHECKER = "repeating-conic-gradient(#BBBBBB 0% 25%, #FFFFFF 0% 50%) 0 0 / 6px 6px";

BasicDesigner.paramsObject = null; // The component the rows show (a change makes a new one, with the same id)

// The component of the rows now, also when it was made again a moment ago.
BasicDesigner.currentParamsObject = function () {
    const obj = BasicDesigner.paramsObject;
    if (!obj || !obj._isRemoved) return obj;
    return BasicDesigner.objectOfKey(String(obj.__bd.id));
};

// The default of a style value: the package of its styleName over XxxDefaults.style.
BasicDesigner.paramDefaultsOf = function (obj) {
    const s = BasicDesigner.state;
    const defaults = s.rt.cloneParams(s.rt.findDefaults(obj.__bd.component) || {});
    const packages = s.rt.findStyles(obj.__bd.component);
    const stylePackage = packages && packages[obj.__bd.params.styleName];
    if (!stylePackage) return defaults;
    // WHY: a package with its own "style" key is a package of params: its other keys are the defaults of this look too.
    const isParamsPackage = BasicDesigner.isPlain(stylePackage.style);
    const packageStyle = (isParamsPackage) ? stylePackage.style : stylePackage;
    if (BasicDesigner.isPlain(defaults.style)) {
        const merged = s.rt.cloneParams(packageStyle);
        s.win.mergeIntoIfMissing(merged, defaults.style);
        defaults.style = merged;
    }
    if (isParamsPackage) {
        Object.keys(stylePackage).forEach(function (key) {
            if (key !== "style") defaults[key] = s.rt.cloneParams(stylePackage[key]);
        });
    }
    return defaults;
};

// Every row to show: the order of XxxDefaults (the keys the page added: at the end). The objects (style) are groups.
BasicDesigner.paramRowsOf = function (obj) {
    const s = BasicDesigner.state;
    const id = obj.__bd.id;
    const name = obj.__bd.component;
    const rows = [];

    const orderOf = function (object, defaults) {
        const keys = Object.keys(object);
        if (!BasicDesigner.isPlain(defaults)) return keys;
        const first = Object.keys(defaults).filter(function (key) { return key in object; });
        return first.concat(keys.filter(function (key) { return first.indexOf(key) === -1; }));
    };

    // Not the default value: the page (or a style package) gave it.
    const isGiven = function (value, def) {
        if (typeof value === "function") return false;
        try { return JSON.stringify(value) !== JSON.stringify(def); } catch (error) { return value !== def; }
    };

    const words = s.paramFilter.toLowerCase().split(/\s+/).filter(Boolean);
    const isFiltering = (words.length > 0 || s.paramOnlyChanged);
    const hasWords = function (pathText) {
        const text = pathText.toLowerCase();
        return words.every(function (word) { return text.indexOf(word) !== -1; });
    };

    const collect = function (rows, object, path, level, defaults) {
        orderOf(object, defaults).forEach(function (key) {
            const value = object[key];
            const def = BasicDesigner.isPlain(defaults) ? defaults[key] : undefined;
            const rowPath = path.concat([key]);
            const pathText = rowPath.join(".");
            const note = BasicDesigner.noteOfParam(name, pathText);
            const row = { key: key, path: rowPath, pathText: pathText, level: level, value: value, def: def, note: note };
            if (BasicDesigner.isPlain(value)) {
                // WHY open while filtering: a closed object must not hide what is searched.
                row.isGroup = true;
                row.isClosed = (!isFiltering && s.paramCollapsed.has(id + ":" + pathText));
                const inside = [];
                if (!row.isClosed) collect(inside, value, rowPath, level + 1, def);
                const isEmptyMatch = (!s.paramOnlyChanged && hasWords(pathText) && !Object.keys(value).length);
                if (!isFiltering || inside.length || isEmptyMatch) rows.push(row);
                inside.forEach(function (insideRow) { rows.push(insideRow); });
                return;
            }
            row.isGiven = isGiven(value, def);
            row.kind = BasicDesigner.paramKindOf(key, value, def, note, name);
            const isChangedHere = s.changes.has(id + ":param:" + pathText);
            const isShown = hasWords(pathText) && (!s.paramOnlyChanged || row.isGiven || isChangedHere);
            if (isShown) rows.push(row);
        });
    };

    collect(rows, obj.__bd.params, [], 0, BasicDesigner.paramDefaultsOf(obj));
    return rows;
};

// *** THE SEARCH OF THE PARAMETERS, and "only what is not the default": some components have more than a hundred rows.

BasicDesigner.PARAM_FILTER_HEIGHT = 26;

BasicDesigner.applyParamFilter = function () {
    const ui = BasicDesigner.ui;
    const obj = BasicDesigner.currentParamsObject();
    if (obj) BasicDesigner.showParams(obj);
    ui.paramsList.elem.scrollTop = 0;
};

BasicDesigner.clearParamFilter = function () {
    const ui = BasicDesigner.ui;
    BasicDesigner.state.paramFilter = "";
    if (ui.paramSearch) ui.paramSearch.setText("");
};

// GROUP: The search and the button of the changed values
BasicDesigner.buildParamFilter = function (left, top, width) {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const s = BasicDesigner.state;
    const height = BasicDesigner.PARAM_FILTER_HEIGHT;
    const GAP = 4;
    const dot = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" style="display:block"><circle cx="8" cy="8" r="3.5" fill="currentColor"/></svg>';
    HGroup(left, top, width, height, { align: "left center", gap: GAP, color: "transparent" });
        const holder = HGroup({ width: width - height - GAP, height: height, align: "left center", color: "transparent" });
        holder.shrink = 0;
            ui.paramSearch = SearchInput({
                styleName: "ozdenDark",
                left: 0,
                top: 0,
                width: width - height - GAP,
                height: height,
                fontSize: 12,
                searchIconSize: 14,
                searchIconLeft: 8,
                searchIconGap: 6,
                clearIconRight: 8,
                round: 5,
                color: C.field,
                border: 0,
                borderBottomStyle: "none",
                textOffsetY: 0,
                clearIconOffsetY: 0,
                clearOnEscape: 1,
                placeholderText: "Search the parameters",
                onSearch: function (text) {
                    s.paramFilter = String(text || "");
                    BasicDesigner.applyParamFilter();
                },
            });
        endGroup();
        ui.btnOnlyChanged = BasicDesigner.iconButton({
            html: dot,
            name: "Only the values that are not the default",
            description: "The rows with a • and the rows changed here.",
            size: height,
            color: C.accent,
            onClick: function () {
                s.paramOnlyChanged = !s.paramOnlyChanged;
                ui.btnOnlyChanged.setActive(s.paramOnlyChanged);
                BasicDesigner.applyParamFilter();
            },
        });
    endGroup();
};

// The same rows can be painted again instead of being made again. WHY: the rows stay under the mouse while a color is
// dragged: the focus, the scroll and the opener of an open editor are kept.
BasicDesigner.signatureOfParamRow = function (row) {
    if (row.isGroup) return row.pathText + "=" + ((row.isClosed) ? "closed" : "open");
    return row.pathText + "=" + row.kind.name;
};

BasicDesigner.drawParamRows = function (obj) {
    const ui = BasicDesigner.ui;
    const isSameObject = (BasicDesigner.paramsObject && BasicDesigner.paramsObject.__bd.id === obj.__bd.id);
    BasicDesigner.paramsObject = obj;
    const rows = BasicDesigner.paramRowsOf(obj);
    const signature = obj.__bd.id + "|" + rows.map(BasicDesigner.signatureOfParamRow).join(",");
    if (ui.paramRows && ui.paramRowsSignature === signature) {
        rows.forEach(function (row) { ui.paramRowViews[row.pathText].refresh(row); });
        return;
    }

    BasicDesigner.hideTip(); // WHY: a tip of a button of the old rows would stay on the screen.
    const scrollTop = (isSameObject) ? ui.paramsList.elem.scrollTop : 0;
    const focused = document.activeElement;
    const focusedPath = (focused && focused.dataset) ? focused.dataset.paramPath : "";
    if (ui.paramRows) ui.paramRows.remove();
    ui.paramRowViews = {};
    ui.paramRowsSignature = signature;
    createIn(ui.paramsList, function () {
        // GROUP: The rows
        ui.paramRows = VGroup({ width: "100%", height: "auto", align: "left top", gap: 1, padding: [BasicDesigner.PARAM_ROWS_SIDE, 6], color: "transparent", position: "relative" });
        ui.paramRows.css = { alignItems: "stretch" };
            rows.forEach(function (row) {
                const build = (row.isGroup) ? BasicDesigner.buildParamGroupRow : BasicDesigner.buildParamRow;
                ui.paramRowViews[row.pathText] = build(row);
            });
            if (!rows.length) BasicDesigner.popoverNote("No parameter here. Change the search, or press the • button.");
        endGroup();
    });
    ui.paramsList.elem.scrollTop = scrollTop;
    const focusedView = ui.paramRowViews[focusedPath];
    if (focusedView && focusedView.input) focusedView.input.focus();
};

BasicDesigner.paramGuides = function (level) {
    let html = "";
    for (let i = 0; i < level; i++) {
        html += '<span style="display:inline-block;flex:0 0 10px;align-self:stretch;border-left:1px solid #5A5A5A;margin-left:' + ((i) ? 0 : 2) + 'px"></span>';
    }
    return html;
};

// WHY: a list of many rows must not become a tip of many screens.
BasicDesigner.TIP_TEXT_LIMIT = 300;
BasicDesigner.shortTipText = function (text) {
    if (text.length <= BasicDesigner.TIP_TEXT_LIMIT) return text;
    return text.slice(0, BasicDesigner.TIP_TEXT_LIMIT) + "…";
};

// What a mouse that stays on a name reads: where it is, what the code says about it, its default.
BasicDesigner.paramHint = function (row) {
    const lines = [row.pathText];
    if (row.note) lines.push(row.note);
    if (row.isGiven) lines.push("Not the default: " + BasicDesigner.shortTipText(BasicDesigner.paramText(row.def).text));
    return lines.join("\n");
};

// GROUP: an object (style, style.tab...): a click closes or opens it, its button shows it as a table of names and values.
BasicDesigner.buildParamGroupRow = function (row) {
    const C = BasicDesigner.colors;
    const view = { row: row };

    view.box = HGroup({ width: "100%", height: BasicDesigner.PARAM_ROW_HEIGHT, align: "left center", gap: 2, color: "transparent", position: "relative" });
    view.box.shrink = 0;
        const head = Label({ height: BasicDesigner.PARAM_ROW_HEIGHT, fontSize: 12, textColor: C.text, color: "transparent", cursor: "pointer", clickable: 1 });
        head.grow = 1;
        head.css = { display: "flex", alignItems: "center", whiteSpace: "nowrap", minWidth: "0px", overflow: "hidden" };
        view.btnTable = BasicDesigner.paramFieldButton("braces", "As a table", "Names and values. A new name can be added there.", function () {
            BasicDesigner.openParamTable(view.row);
        });
        view.btnTable.opacity = 0.7;
    endGroup();

    view.refresh = function (next) {
        view.row = next;
        head.text = BasicDesigner.paramGuides(next.level) +
            '<span style="flex:0 0 14px;color:' + C.soft + '">' + ((next.isClosed) ? "▸" : "▾") + "</span>" +
            '<span style="font-family:opensans-bold">' + BasicDesigner.esc(next.key) + "</span>" +
            '<span style="color:' + C.dim + ';margin-left:6px">{ ' + Object.keys(next.value).length + " }</span>";
        head.elem.title = BasicDesigner.paramHint(next);
    };
    view.refresh(row);

    head.on("click", function () {
        const s = BasicDesigner.state;
        const closedKey = BasicDesigner.paramsObject.__bd.id + ":" + view.row.pathText;
        if (view.row.isClosed) s.paramCollapsed.delete(closedKey);
        else s.paramCollapsed.add(closedKey);
        BasicDesigner.showParams(BasicDesigner.currentParamsObject());
    });
    return view;
};

// ROW: name | value
BasicDesigner.buildParamRow = function (row) {
    const view = { row: row, editor: BasicDesigner.PARAM_EDITORS[row.kind.name] || {} };

    view.box = HGroup({ width: "100%", height: BasicDesigner.PARAM_ROW_HEIGHT, align: "left center", gap: BasicDesigner.PARAM_ROW_GAP, color: "transparent", position: "relative" });
    view.box.shrink = 0;
        view.lblName = BasicDesigner.buildParamName(view);
        view.field = BasicDesigner.buildParamField(view);
    endGroup();
    if (row.kind.name === "color") view.strip = BasicDesigner.buildParamColorStrip(view);

    view.refresh = function (next) {
        view.row = next;
        BasicDesigner.paintParamRow(view);
    };
    BasicDesigner.paintParamRow(view);
    return view;
};

// GROUP: The colors under the field of a color (the ticks of the color picker, as in the Box view). WHY the same ticks: a
// color group chosen once is at hand under every color. It is empty while no tick is on.
// WHY only under the color in use (the last one clicked or written): under every color row the list was three times longer.
// Not the row under the mouse: the rows under it would move while the mouse goes down.
BasicDesigner.activeColorRow = null; // { id, pathText }

BasicDesigner.isActiveColorRow = function (pathText) {
    const active = BasicDesigner.activeColorRow;
    const obj = BasicDesigner.paramsObject;
    return !!(active && obj && active.id === obj.__bd.id && active.pathText === pathText);
};

BasicDesigner.setActiveColorRow = function (pathText) {
    const ui = BasicDesigner.ui;
    BasicDesigner.activeColorRow = { id: BasicDesigner.paramsObject.__bd.id, pathText: pathText };
    Object.keys(ui.paramRowViews || {}).forEach(function (key) {
        const view = ui.paramRowViews[key];
        if (view.strip) view.strip.setHidden(key !== pathText);
    });
};

BasicDesigner.buildParamColorStrip = function (view) {
    const strip = BasicDesigner.ui.panel.buildColorStrip({
        key: "param:" + view.row.pathText,
        hint: view.row.key,
        width: BasicDesigner.config.rightWidth - BasicDesigner.PARAM_ROWS_SIDE * 2 - BasicDesigner.PARAM_NAME_WIDTH - BasicDesigner.PARAM_ROW_GAP,
        onPick: function (value) {
            BasicDesigner.applyParamValue(BasicDesigner.currentParamsObject(), view.row.path, value);
        },
    });
    strip.obj.css.marginLeft = (BasicDesigner.PARAM_NAME_WIDTH + BasicDesigner.PARAM_ROW_GAP) + "px";
    strip.setHidden(!BasicDesigner.isActiveColorRow(view.row.pathText));
    view.input.addEventListener("focus", function () { BasicDesigner.setActiveColorRow(view.row.pathText); });
    return strip;
};

// The dot of a value that is not the default: a click goes back to the default.
BasicDesigner.resetParamToDefault = function (view) {
    const row = view.row;
    const obj = BasicDesigner.currentParamsObject();
    BasicDesigner.closeParamEditors();
    if (!obj) return;
    BasicDesigner.applyParamValue(obj, row.path, row.def);
    BasicDesigner.setStatus(row.pathText + ": back to the default.");
};

BasicDesigner.buildParamName = function (view) {
    const C = BasicDesigner.colors;
    const editor = view.editor;
    // LABEL: The name
    const lbl = Label({ width: BasicDesigner.PARAM_NAME_WIDTH, height: BasicDesigner.PARAM_ROW_HEIGHT, fontSize: 12, color: "transparent" });
    lbl.shrink = 0;
    lbl.css = { display: "flex", alignItems: "center", whiteSpace: "nowrap", overflow: "hidden" };
    lbl.clickable = 1;
    lbl.cursor = (editor.canScrub) ? "ew-resize" : ((editor.open) ? "pointer" : "default");
    lbl.onHoverChange(function (self, isOver) {
        lbl.isHovered = isOver;
        lbl.textColor = (isOver || view.row.isGiven) ? C.text : C.soft;
    });
    BasicDesigner.scrubOn(lbl, {
        read: function () { return (editor.canScrub) ? view.row.value : null; },
        step: function () { return BasicDesigner.rangeOfNumber(view.row.key, view.row.value).step; },
        min: function () { return BasicDesigner.rangeOfNumber(view.row.key, view.row.value).min; },
        write: function (value) { BasicDesigner.sendParamLive(BasicDesigner.paramsObject.__bd.id, view.row.path, value); },
        onClick: function (pressEvent) {
            const isOnDot = (pressEvent.target.closest && pressEvent.target.closest("[data-param-reset]"));
            if (isOnDot) BasicDesigner.resetParamToDefault(view);
            else BasicDesigner.openParamEditor(view);
        },
    });
    return lbl;
};

// GROUP: The value: a text that can always be written, between what the kind adds at its start and at its end.
BasicDesigner.buildParamField = function (view) {
    const C = BasicDesigner.colors;
    const editor = view.editor;
    const field = HGroup({ width: "auto", height: BasicDesigner.PARAM_FIELD_HEIGHT, align: "left center", gap: 0, color: C.field, round: 4, position: "relative" });
    field.css = { flex: "1 1 0px", minWidth: "0px" };

        if (editor.leading === "swatch") view.swatch = BasicDesigner.buildParamSwatch(view);
        if (editor.leading === "thumb") view.thumb = BasicDesigner.buildParamThumb(view);

        const input = BasicDesigner.rawInput(field);
        input.dataset.paramPath = view.row.pathText;
        input.setAttribute("aria-label", view.row.pathText);
        view.input = input;

        if (editor.trailing === "switch") view.toggle = BasicDesigner.buildParamSwitch(view);
        else if (editor.open && editor.icon) {
            view.opener = BasicDesigner.paramFieldButton(editor.icon, editor.tipName, editor.tipText, function () { BasicDesigner.openParamEditor(view); });
        }

    endGroup();

    input.addEventListener("focus", function () { field.boxShadow = "inset 0 0 0 1px " + C.accent; });
    input.addEventListener("blur", function () {
        field.boxShadow = "none";
        BasicDesigner.commitParamInput(view);
    });
    input.addEventListener("keydown", function (event) { BasicDesigner.onParamInputKey(view, event); });
    return field;
};

BasicDesigner.onParamInputKey = function (view, event) {
    event.stopPropagation(); // WHY: V / I / Enter are the keys of the designer.
    const input = view.input;
    if (event.key === "Enter") {
        input.blur();
        return;
    }
    if (event.key === "Escape") {
        input.value = view.shownText;
        input.blur();
        return;
    }
    if (event.altKey && event.key === "ArrowDown" && view.editor.open) {
        event.preventDefault();
        BasicDesigner.openParamEditor(view);
        return;
    }
    const isStep = (event.key === "ArrowUp" || event.key === "ArrowDown");
    if (!isStep || !view.editor.canScrub || typeof view.row.value !== "number") return;
    event.preventDefault();
    const range = BasicDesigner.rangeOfNumber(view.row.key, view.row.value);
    const direction = (event.key === "ArrowUp") ? 1 : -1;
    const steps = (event.shiftKey) ? 10 : 1;
    const next = BasicDesigner.roundToStep(view.row.value + direction * steps * range.step, range.step, range.min);
    input.value = String(next);
    view.shownText = input.value;
    view.row.value = next;
    BasicDesigner.sendParamLive(BasicDesigner.paramsObject.__bd.id, view.row.path, next);
};

BasicDesigner.commitParamInput = function (view) {
    const input = view.input;
    if (input.readOnly || input.value === view.shownText) return;
    let value;
    try {
        value = BasicDesigner.valueOfParamText(input.value, view.row);
    } catch (error) {
        BasicDesigner.setStatus(view.row.pathText + ": " + error.message, "error");
        input.value = view.shownText;
        return;
    }
    BasicDesigner.flushParamLive();
    BasicDesigner.applyParamValue(BasicDesigner.currentParamsObject(), view.row.path, value);
};

// WHY the padding: a dot of 3 px is too small for a mouse.
BasicDesigner.paramDotHtml = function (row) {
    const C = BasicDesigner.colors;
    const defaultText = (row.def === undefined) ? "not given" : BasicDesigner.shortTipText(BasicDesigner.paramText(row.def).text);
    return '<span data-param-reset="1" title="' + BasicDesigner.esc("Back to the default: " + defaultText) + '" style="flex:0 0 auto;color:' + C.accent + ';padding:0px 4px;cursor:pointer">•</span>';
};

BasicDesigner.paintParamRow = function (view) {
    const C = BasicDesigner.colors;
    const row = view.row;
    const shown = BasicDesigner.paramText(row.value);
    const nameHtml = BasicDesigner.paramGuides(row.level) + '<span style="overflow:hidden;text-overflow:ellipsis">' + BasicDesigner.esc(row.key) + "</span>" +
        ((row.isGiven) ? BasicDesigner.paramDotHtml(row) : "");
    if (view.nameHtml !== nameHtml) {
        view.nameHtml = nameHtml;
        view.lblName.text = nameHtml;
    }
    view.lblName.textColor = (row.isGiven || view.lblName.isHovered) ? C.text : C.soft;
    view.lblName.elem.title = BasicDesigner.paramHint(row);

    view.shownText = shown.text;
    view.input.readOnly = !shown.editable;
    view.input.style.color = (shown.editable) ? C.text : C.dim;
    view.input.title = BasicDesigner.shortTipText(shown.text);
    if (document.activeElement !== view.input) view.input.value = shown.text;

    if (view.swatch) BasicDesigner.paintParamSwatch(view.swatch, row.value);
    if (view.thumb) BasicDesigner.paintParamThumb(view.thumb, row.value);
    if (view.strip) view.strip.paint((row.value === null || row.value === undefined) ? "" : row.value);
    if (view.toggle) view.toggle.setOn(row.value === 1 || row.value === true);
    if (view.opener && view.editor.tipOf) view.opener.tip.description = view.editor.tipOf(row);
};

// A raw input (the Input of basic.js has its own big style) that fills what is left in its group.
BasicDesigner.rawInput = function (parent, props = {}) {
    const C = BasicDesigner.colors;
    const input = document.createElement("input");
    input.type = props.type || "text";
    input.spellcheck = false;
    input.value = (props.value === undefined || props.value === null) ? "" : String(props.value);
    input.style.cssText = "flex:1 1 0px;min-width:0px;width:100%;height:100%;box-sizing:border-box;border:0;background:transparent;color:" + C.text + ";" +
        "font:12px opensans, sans-serif;padding:0px 6px;outline:none;pointer-events:auto;user-select:text";
    parent.elem.appendChild(input);
    return input;
};

// A raw textarea of many lines.
BasicDesigner.rawTextarea = function (parent, props = {}) {
    const C = BasicDesigner.colors;
    const area = document.createElement("textarea");
    area.spellcheck = false;
    area.value = (props.value === undefined || props.value === null) ? "" : String(props.value);
    const font = (props.isCode) ? "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" : "12px opensans, sans-serif";
    area.style.cssText = "width:100%;height:100%;box-sizing:border-box;border:0;resize:none;background:transparent;color:" + C.text + ";" +
        "font:" + font + ";line-height:18px;padding:8px;outline:none;pointer-events:auto;user-select:text;white-space:" + ((props.isCode) ? "pre" : "pre-wrap");
    area.readOnly = !!props.isReadOnly;
    parent.elem.appendChild(area);
    return area;
};

// LABEL: a small button at the end of a field. Its tip says what it opens.
BasicDesigner.paramFieldButton = function (iconName, tipName, tipText, onPress) {
    const C = BasicDesigner.colors;
    const btn = Label({
        text: BasicDesigner.paramIcon(iconName, 14),
        width: BasicDesigner.PARAM_BUTTON_WIDTH,
        height: BasicDesigner.PARAM_FIELD_HEIGHT,
        color: "transparent",
        textColor: C.soft,
        round: 4,
        clickable: 1,
        cursor: "pointer",
        lineHeight: "0",
        shrink: 0,
        css: { display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.12s" },
    });
    btn.role = "button";
    btn.aria = { label: tipName };
    btn.tip = { type: tipName, description: tipText || "" };
    btn.onHoverChange(function (self, isOver) {
        btn.color = (isOver) ? C.fieldHover : "transparent";
        btn.textColor = (isOver) ? C.text : C.soft;
        if (isOver) BasicDesigner.showTip(btn, btn.tip);
        else BasicDesigner.hideTip();
    });
    btn.on("click", function () {
        BasicDesigner.hideTip();
        onPress();
    });
    return btn;
};

// BOX: a color over a checkerboard (a transparent color shows it).
BasicDesigner.paintParamSwatch = function (swatch, value) {
    const color = BasicDesigner.paintableColor(value) || "transparent";
    swatch.css.background = "linear-gradient(" + color + ", " + color + "), " + BasicDesigner.CHECKER;
};

BasicDesigner.buildSwatchBox = function (onPress) {
    const size = BasicDesigner.PARAM_SWATCH_SIZE;
    const swatch = Box({ width: size, height: size, round: 3, color: "transparent", clickable: 1, cursor: "pointer" });
    swatch.shrink = 0;
    swatch.css = { position: "relative", left: "0px", top: "0px", marginLeft: "4px" };
    swatch.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.25)";
    swatch.role = "button";
    swatch.aria = { label: "Open the color picker", haspopup: "dialog" };
    swatch.elem.title = "Open the color picker";
    swatch.on("click", onPress);
    return swatch;
};

BasicDesigner.buildParamSwatch = function (view) {
    return BasicDesigner.buildSwatchBox(function () { BasicDesigner.openParamEditor(view); });
};

// BOX: the picture of a row. A picture with "no size" of its own fills it.
BasicDesigner.paintParamThumb = function (thumb, value) {
    const address = BasicDesigner.pictureAddress(value);
    thumb.css.backgroundImage = (address) ? 'url("' + address.replace(/"/g, "%22") + '")' : "none";
};

BasicDesigner.buildParamThumb = function (view) {
    const size = BasicDesigner.PARAM_SWATCH_SIZE;
    const thumb = Box({ width: size, height: size, round: 3, color: BasicDesigner.PARAM_THUMB_COLOR, clickable: 1, cursor: "pointer" });
    thumb.shrink = 0;
    thumb.css = { position: "relative", left: "0px", top: "0px", marginLeft: "4px", backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" };
    thumb.elem.title = "Choose a picture";
    thumb.on("click", function () { BasicDesigner.openParamEditor(view); });
    return thumb;
};

// BOX: a small switch. setOn(isOn) paints it.
BasicDesigner.SWITCH_WIDTH = 24;
BasicDesigner.SWITCH_HEIGHT = 14;
BasicDesigner.SWITCH_KNOB = 10;

BasicDesigner.buildSwitch = function (onPress) {
    const C = BasicDesigner.colors;
    const toggle = startBox({ width: BasicDesigner.SWITCH_WIDTH, height: BasicDesigner.SWITCH_HEIGHT, round: BasicDesigner.SWITCH_HEIGHT / 2, color: C.fieldBorderStrong, clickable: 1, cursor: "pointer" });
    toggle.shrink = 0;
    toggle.css = { position: "relative", left: "0px", top: "0px", marginRight: "4px", transition: "background-color 0.12s" };
    toggle.role = "switch";
        const knob = Box({ left: 2, top: 2, width: BasicDesigner.SWITCH_KNOB, height: BasicDesigner.SWITCH_KNOB, round: BasicDesigner.SWITCH_KNOB / 2, color: "#FFFFFF" });
        knob.css.transition = "left 0.12s";
    endBox();
    toggle.setOn = function (isOn) {
        toggle.color = (isOn) ? C.accent : C.fieldBorderStrong;
        knob.left = (isOn) ? BasicDesigner.SWITCH_WIDTH - BasicDesigner.SWITCH_KNOB - 2 : 2;
        toggle.aria = { checked: (isOn) ? "true" : "false" };
    };
    toggle.on("click", onPress);
    return toggle;
};

BasicDesigner.buildParamSwitch = function (view) {
    return BasicDesigner.buildSwitch(function () { BasicDesigner.toggleParamFlag(view); });
};

BasicDesigner.toggleParamFlag = function (view) {
    const row = view.row;
    const isOn = (row.value === 1 || row.value === true);
    const isBoolean = (typeof row.value === "boolean");
    const on = (isBoolean) ? true : 1;
    const off = (isBoolean) ? false : 0;
    BasicDesigner.applyParamValue(BasicDesigner.currentParamsObject(), row.path, (isOn) ? off : on);
};

// The editor of a row opens, or closes when it is open already.
BasicDesigner.openParamEditor = function (view) {
    const editor = view.editor;
    if (!editor.open) return;
    const pathText = view.row.pathText;
    const popover = BasicDesigner.paramPopover;
    const isOpenHere = (popover && popover.pathText === pathText) || BasicDesigner.isParamColorOpenHere(pathText);
    BasicDesigner.closeParamEditors();
    if (!isOpenHere) editor.open(view);
};

BasicDesigner.paramColor = null; // { pathText, closedAt }: the color picker of a row (closedAt: 0 while it is open)
BasicDesigner.lastPressTime = 0;
document.addEventListener("pointerdown", function (event) { BasicDesigner.lastPressTime = event.timeStamp; }, true);

// WHY the time of the press: a press on the name is outside of the color picker: it closes the picker before the click
// arrives, and that click must not open it again.
BasicDesigner.isParamColorOpenHere = function (pathText) {
    const color = BasicDesigner.paramColor;
    if (!color || color.pathText !== pathText) return false;
    return !color.closedAt || color.closedAt >= BasicDesigner.lastPressTime;
};

// *** A CHANGE WHILE THE MOUSE MOVES: every change makes the component again, so a few of them go in a second.

BasicDesigner.LIVE_APPLY_TIME = 90; // ms
BasicDesigner.liveParam = null; // { id, path, pathText, value, hasValue, timer }
BasicDesigner.paramEditId = null; // The id of the component whose editor is open: another selection closes it

BasicDesigner.applyLiveValue = function (live) {
    const obj = BasicDesigner.objectOfKey(String(live.id));
    if (!obj || obj._isRemoved) return;
    BasicDesigner.applyParamValue(obj, live.path, live.value, true);
};

BasicDesigner.sendParamLive = function (id, path, value) {
    const pathText = path.join(".");
    let live = BasicDesigner.liveParam;
    if (live && (live.id !== id || live.pathText !== pathText)) {
        BasicDesigner.flushParamLive();
        live = null;
    }
    if (!live) {
        live = { id: id, path: path, pathText: pathText, hasValue: false, timer: null };
        BasicDesigner.liveParam = live;
    }
    live.value = value;
    live.hasValue = true;
    if (!live.timer) BasicDesigner.runParamLive();
};

BasicDesigner.runParamLive = function () {
    const live = BasicDesigner.liveParam;
    if (!live) return;
    if (!live.hasValue) {
        BasicDesigner.finishParamLive();
        return;
    }
    live.hasValue = false;
    const startedAt = performance.now();
    BasicDesigner.applyLiveValue(live);
    // WHY: a big component takes long to make: the next one waits, so the mouse stays smooth.
    const spent = performance.now() - startedAt;
    live.timer = setTimeout(function () {
        live.timer = null;
        BasicDesigner.runParamLive();
    }, Math.max(BasicDesigner.LIVE_APPLY_TIME, spent * 2));
};

BasicDesigner.flushParamLive = function () {
    const live = BasicDesigner.liveParam;
    if (!live) return;
    clearTimeout(live.timer);
    if (live.hasValue) {
        live.hasValue = false;
        BasicDesigner.applyLiveValue(live);
    }
    BasicDesigner.finishParamLive();
};

// The layers are read again when the changes end. WHY not after each one: on a big page the tree takes longer than the change.
BasicDesigner.finishParamLive = function () {
    const live = BasicDesigner.liveParam;
    if (!live) return;
    BasicDesigner.liveParam = null;
    const obj = BasicDesigner.objectOfKey(String(live.id));
    if (obj) BasicDesigner.refreshLayersAfterChange(obj);
};

// What an editor changes: edit.value is the value now, edit.set(value) sends a new one.
BasicDesigner.startParamEdit = function (row) {
    const id = BasicDesigner.paramsObject.__bd.id;
    const edit = {
        id: id,
        key: row.key,
        path: row.path,
        pathText: row.pathText,
        note: row.note,
        def: row.def,
        before: row.value,
        value: row.value,
        set: function (value) {
            edit.value = value;
            if (edit.onChange) edit.onChange();
            BasicDesigner.sendParamLive(id, row.path, value);
        },
    };
    BasicDesigner.paramEditId = id;
    return edit;
};

BasicDesigner.closeParamEditors = function () {
    const hadEditor = (BasicDesigner.paramEditId !== null);
    BasicDesigner.paramEditId = null;
    BasicDesigner.closeParamList();
    const popover = BasicDesigner.paramPopover;
    if (popover) popover.close();
    // WHY only then: the color picker of the Box view is not ours.
    if (hadEditor) BasicDesigner.ui.panel.closeColorPicker();
    BasicDesigner.flushParamLive();
};

// *** A LABEL THAT CHANGES A NUMBER: a pixel is a step (Shift: ten). A press that does not move is a click.

BasicDesigner.SCRUB_START_DISTANCE = 3;

BasicDesigner.roundToStep = function (value, step, min) {
    const decimals = (String(step).split(".")[1] || "").length;
    const rounded = Number((Math.round(value / step) * step).toFixed(decimals));
    if (min === undefined || min === null) return rounded;
    return Math.max(min, rounded);
};

// options: { read(): the number now (not a number: no drag), write(value), step(), min(), onClick(pressEvent) }
BasicDesigner.scrubOn = function (handle, options) {
    handle.elem.addEventListener("pointerdown", function (event) {
        if (event.button !== 0) return;
        event.preventDefault();
        // WHY: preventDefault keeps the focus where it is: a field that is being written must finish first.
        if (BasicDesigner.isTextTarget(document.activeElement)) document.activeElement.blur();
        const startX = event.clientX;
        const startValue = options.read();
        const canDrag = (typeof startValue === "number");
        let isDragging = false;
        handle.elem.setPointerCapture(event.pointerId);
        const onMove = function (moveEvent) {
            const distance = moveEvent.clientX - startX;
            if (!isDragging && Math.abs(distance) < BasicDesigner.SCRUB_START_DISTANCE) return;
            isDragging = true;
            if (!canDrag) return;
            const step = options.step();
            const factor = (moveEvent.shiftKey) ? 10 : 1;
            options.write(BasicDesigner.roundToStep(startValue + distance * step * factor, step, options.min()));
        };
        const onUp = function () {
            handle.elem.removeEventListener("pointermove", onMove);
            handle.elem.removeEventListener("pointerup", onUp);
            handle.elem.removeEventListener("pointercancel", onUp);
            if (isDragging) BasicDesigner.flushParamLive();
            else if (options.onClick) options.onClick(event);
        };
        handle.elem.addEventListener("pointermove", onMove);
        handle.elem.addEventListener("pointerup", onUp);
        handle.elem.addEventListener("pointercancel", onUp);
    });
};

// *** THE RANGE OF A NUMBER: what its slider covers and its usual values.

BasicDesigner.NUMBER_RANGES = [
    { key: /opacity$/i, min: 0, max: 1, step: 0.05, values: [0, 0.25, 0.5, 0.75, 1] },
    { key: /(fontSize|textSize|titleSize)$/i, min: 1, max: 72, step: 1, values: [10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32] },
    { key: /(round|radius)$/i, min: 0, max: 60, step: 1, values: [0, 2, 4, 6, 8, 10, 12, 16, 20, 999] },
    { key: /(border|thickness|lineWidth|ringWidth)$/i, min: 0, max: 16, step: 1, values: [0, 1, 2, 3, 4] },
    { key: /(gap|spacing|indent)$/i, min: 0, max: 64, step: 1, values: [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32] },
    { key: /(space|top|left|right|bottom|offsetX|offsetY)$/i, min: null, max: 100, step: 1, values: [0, 4, 8, 10, 12, 16, 20, 24, 32, 40] },
    { key: /(iconSize|size)$/i, min: 0, max: 96, step: 1, values: [12, 14, 16, 18, 20, 24, 28, 32, 40, 48] },
    { key: /scale$/i, min: 0, max: 3, step: 0.01, values: [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 2] },
    { key: /(rotate|angle)$/i, min: -360, max: 360, step: 1, values: [-90, -45, 0, 45, 90, 180] },
    { key: /(brightness|ratio|share|lighten)$/i, min: 0, max: 2, step: 0.01, values: [] },
];

// A line height is a ratio (1.5) or pixels (20): the size of the value tells which.
BasicDesigner.LINE_HEIGHT_KEY = /lineHeight$/i;
BasicDesigner.LARGEST_LINE_RATIO = 4;
BasicDesigner.LINE_RATIO_RANGE = { min: 0.8, max: 3, step: 0.05, values: [1, 1.2, 1.35, 1.5, 1.6, 2] };
BasicDesigner.LINE_PIXELS_RANGE = { min: 8, max: 60, step: 1, values: [16, 18, 20, 22, 24, 28, 32] };

// Seconds or milliseconds: the kit has both, the size of the value tells which.
BasicDesigner.TIME_KEY = /(motion|duration|time|delay|speed)$/i;
BasicDesigner.LONGEST_SECONDS = 10;
BasicDesigner.SECONDS_RANGE = { min: 0, max: 3, step: 0.05, values: [0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 1, 2] };
BasicDesigner.MILLISECONDS_RANGE = { min: 0, max: 3000, step: 50, values: [100, 150, 200, 300, 500, 1000, 2000] };

BasicDesigner.rangeOfNumber = function (key, value) {
    const number = (typeof value === "number") ? value : 0;
    let range = BasicDesigner.NUMBER_RANGES.find(function (item) { return item.key.test(key); });
    if (!range && BasicDesigner.LINE_HEIGHT_KEY.test(key)) {
        range = (number <= BasicDesigner.LARGEST_LINE_RATIO) ? BasicDesigner.LINE_RATIO_RANGE : BasicDesigner.LINE_PIXELS_RANGE;
    }
    if (!range && BasicDesigner.TIME_KEY.test(key)) {
        range = (number <= BasicDesigner.LONGEST_SECONDS) ? BasicDesigner.SECONDS_RANGE : BasicDesigner.MILLISECONDS_RANGE;
    }
    const hasDecimals = (number % 1 !== 0);
    if (!range) {
        range = { min: (number < 0) ? null : 0, max: 100, step: (hasDecimals) ? 0.1 : 1, values: [] };
    }
    const result = Object.assign({}, range);
    // WHY: a value over the usual range must still be on the slider.
    result.max = Math.max(range.max, Math.ceil(Math.abs(number) * 1.5));
    if (hasDecimals && result.step >= 1) result.step = 0.1;
    return result;
};

// *** THE SMALL WINDOW OF AN EDITOR: at the left of the panel, at the height of its row. Its title moves it; it stays there
// for the next one (a double click on the title puts it back).

BasicDesigner.POPOVER_SPACE = 8;
BasicDesigner.POPOVER_MARGIN = 8;
BasicDesigner.POPOVER_Z_INDEX = 8900; // WHY: under the tips (9000) and the dialogs (9600)
BasicDesigner.paramPopover = null;
BasicDesigner.popoverMovedTo = null; // { left, top }

// DRAG: a title moves its window. getPlace(): the first place. place(left, top): writes the new one.
BasicDesigner.moveByTitle = function (title, windowBox, place, reset) {
    title.clickable = 1;
    title.cursor = "move";
    title.elem.title = "Drag to move · Double click: back to its place";
    title.elem.addEventListener("pointerdown", function (event) {
        if (event.button !== 0 || event.target !== title.elem) return;
        event.preventDefault();
        const rect = windowBox.elem.getBoundingClientRect();
        const startX = event.clientX - rect.left;
        const startY = event.clientY - rect.top;
        const onMove = function (moveEvent) { place(moveEvent.clientX - startX, moveEvent.clientY - startY); };
        const onUp = function () {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            window.removeEventListener("pointercancel", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
    });
    title.elem.addEventListener("dblclick", function (event) {
        if (event.target === title.elem) reset();
    });
};

// options: { width, build(body, popover) } popover: { edit, draw(), close(), box, pathText }
// view.edit: what the window changes when it is not a parameter (a property of the Box view: BasicDesigner.startBoxEdit);
// view.row.title: its title (the name of the parameter without it).
BasicDesigner.openParamPopover = function (view, options) {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const row = view.row;
    const width = options.width || 260;
    const fieldRect = view.field.elem.getBoundingClientRect();
    const popover = { edit: view.edit || BasicDesigner.startParamEdit(row), pathText: row.pathText };
    // WHY the panel: the rows of the parameters are hidden while the Box view is shown (their left is 0 then).
    const sideBox = (view.edit) ? ui.panel : ui.paramsView;
    let btnBack = null;

    const placeAt = function (left, top) {
        const box = popover.box;
        box.left = Math.round(Math.max(BasicDesigner.POPOVER_MARGIN, Math.min(left, window.innerWidth - width - BasicDesigner.POPOVER_MARGIN)));
        box.top = Math.round(Math.max(BasicDesigner.POPOVER_MARGIN, Math.min(top, window.innerHeight - box.elem.offsetHeight - BasicDesigner.POPOVER_MARGIN)));
    };

    popover.place = function () {
        const moved = BasicDesigner.popoverMovedTo;
        if (moved) {
            placeAt(moved.left, moved.top);
            return;
        }
        const panelLeft = sideBox.elem.getBoundingClientRect().left;
        placeAt(panelLeft - width - BasicDesigner.POPOVER_SPACE, fieldRect.top);
    };

    popover.close = function () {
        if (popover.isClosed) return;
        popover.isClosed = true;
        if (BasicDesigner.paramPopover === popover) BasicDesigner.paramPopover = null;
        BasicDesigner.paramEditId = null;
        BasicDesigner.closeParamList();
        if (ui.panel.isColorPickerOpen()) ui.panel.closeColorPicker();
        BasicDesigner.flushParamLive();
        popover.box.remove();
    };

    popover.draw = function () {
        if (popover.body) popover.body.remove();
        createIn(popover.box, function () {
            // GROUP: What the kind draws
            popover.body = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, color: "transparent" });
            popover.body.css = { alignItems: "stretch" };
            popover.body.clipContent = 0;
                options.build(popover.body, popover);
            endGroup();
        });
    };

    popover.edit.onChange = function () {
        btnBack.setEnabled(!BasicDesigner.isSameParamValue(popover.edit.value, popover.edit.before));
    };

    createIn(page, function () {
        // GROUP: The window
        popover.box = VGroup({ left: 0, top: 0, width: width, height: "auto", align: "left top", gap: 8, padding: 12, color: C.menu, round: 8, border: 1, borderColor: C.line, clickable: 1 });
        popover.box.css = { alignItems: "stretch", boxSizing: "border-box", maxHeight: "calc(100% - 16px)" };
        popover.box.scrollY = 1;
        popover.box.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
        popover.box.zIndex = BasicDesigner.POPOVER_Z_INDEX;
        popover.box.role = "dialog";
        popover.box.aria = { label: row.pathText };

            // GROUP: The title
            const title = HGroup({ width: "100%", height: 24, align: "left center", gap: 2, color: "transparent" });
                const lblTitle = Label({ text: "", fontSize: 12, textColor: C.text, fontFamily: "opensans-bold", ellipsis: 1 });
                lblTitle.plainText = row.title || row.key;
                lblTitle.grow = 1;
                lblTitle.css = { minWidth: "0px", lineHeight: "24px" };
                btnBack = BasicDesigner.iconButton({ path: BasicDesigner.PARAM_ICONS.back, name: "Back to the value before", size: 24, iconSize: 14,
                    onClick: function () {
                        popover.edit.set(popover.edit.before);
                        popover.draw();
                    } });
                BasicDesigner.iconButton({ path: BasicDesigner.PARAM_ICONS.close, name: "Close (Escape)", size: 24, iconSize: 14, onClick: popover.close });
            endGroup();
            BasicDesigner.moveByTitle(title, popover.box, function (left, top) {
                BasicDesigner.popoverMovedTo = { left: left, top: top };
                popover.place();
            }, function () {
                BasicDesigner.popoverMovedTo = null;
                popover.place();
            });

            if (row.note) BasicDesigner.popoverNote(row.note);

        endGroup();
    });

    popover.edit.onChange();
    popover.draw();
    popover.place();
    BasicDesigner.paramPopover = popover;

    popover.box.on("keydown", function (self, event) { event.stopPropagation(); }); // WHY: Not a key of the designer (Backspace would delete the object).
    popover.box.listenTo(document, "pointerdown", function (self, event) {
        const target = event.target;
        if (BasicDesigner.colorPick) return; // WHY: this click on the page gives the color of this window.
        if (popover.box.elem.contains(target) || view.box.elem.contains(target)) return;
        if (ui.panel.isPopupElement(target) || BasicDesigner.isInParamList(target)) return;
        if (ui.dialog && ui.dialog.elem.contains(target)) return;
        popover.close();
    }, true);
    popover.box.listenTo(document, "keydown", function (self, event) {
        if (event.key !== "Escape" || ui.dialog || BasicDesigner.colorPick) return;
        event.stopImmediatePropagation();
        if (BasicDesigner.paramList) {
            BasicDesigner.closeParamList();
            return;
        }
        if (ui.panel.isColorPickerOpen()) {
            ui.panel.closeColorPicker();
            return;
        }
        popover.close();
    }, true);
    return popover;
};

// LABEL: what the comment of the code says about a parameter.
BasicDesigner.popoverNote = function (text) {
    const C = BasicDesigner.colors;
    const lbl = Label({ text: "", width: "100%", height: "auto", fontSize: 11, textColor: C.soft });
    lbl.plainText = text;
    lbl.css = { whiteSpace: "normal", lineHeight: "15px", position: "relative", left: "0px", top: "0px" };
    lbl.shrink = 0;
    return lbl;
};

// LABEL: a small caption over a part of an editor.
BasicDesigner.popoverCaption = function (text) {
    const C = BasicDesigner.colors;
    const lbl = Label({ text: "", fontSize: 11, textColor: C.soft });
    lbl.plainText = text;
    lbl.shrink = 0;
    return lbl;
};

BasicDesigner.isSameParamValue = function (a, b) {
    try { return JSON.stringify(a) === JSON.stringify(b); } catch (error) { return a === b; }
};

// *** A LIST UNDER A FIELD: Up / Down, Enter, Escape. A text that is not in the list can always be written in the field.

BasicDesigner.PARAM_LIST_ROW_HEIGHT = 26;
BasicDesigner.PARAM_LIST_MAX_HEIGHT = 320;
BasicDesigner.PARAM_LIST_MIN_WIDTH = 190;
BasicDesigner.PARAM_LIST_Z_INDEX = 9100; // WHY: over the window of an editor and the table window
BasicDesigner.paramList = null;

BasicDesigner.isInParamList = function (target) {
    return !!(BasicDesigner.paramList && BasicDesigner.paramList.elem.contains(target));
};

BasicDesigner.closeParamList = function () {
    const list = BasicDesigner.paramList;
    if (!list) return;
    BasicDesigner.paramList = null;
    list.remove();
};

// options: { rect: where it opens, items: [{ value, text, font, color }], current, onPick(value), width }
BasicDesigner.openParamList = function (options) {
    const C = BasicDesigner.colors;
    BasicDesigner.closeParamList();
    const items = options.items;
    if (!items.length) return null;
    const width = Math.max(options.rect.width, options.width || BasicDesigner.PARAM_LIST_MIN_WIDTH);
    const rowViews = [];
    let activeIndex = -1;

    const paint = function () {
        rowViews.forEach(function (row, index) { row.color = (index === activeIndex) ? C.hover : "transparent"; });
    };

    const pick = function (item) {
        BasicDesigner.closeParamList();
        options.onPick(item.value);
    };

    const list = createIn(page, function () {
        // GROUP: The list
        const group = VGroup({ left: 0, top: 0, width: width, height: "auto", align: "left top", gap: 0, padding: 4, color: C.menu, round: 8, border: 1, borderColor: C.line, clickable: 1, scrollY: 1 });
        group.css = { alignItems: "stretch", boxSizing: "border-box", maxHeight: BasicDesigner.PARAM_LIST_MAX_HEIGHT + "px", outline: "none" };
        group.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
        group.zIndex = BasicDesigner.PARAM_LIST_Z_INDEX;
        group.role = "listbox";
        group.tabIndex = 0;
            items.forEach(function (item, index) {
                const isSelected = BasicDesigner.isSameParamValue(item.value, options.current);
                if (isSelected) activeIndex = index;
                // GROUP: A row
                const row = HGroup({ width: "100%", height: BasicDesigner.PARAM_LIST_ROW_HEIGHT, align: "left center", gap: 4, padding: [4, 0], round: 5, color: "transparent", clickable: 1, cursor: "pointer" });
                row.shrink = 0;
                row.role = "option";
                row.aria = { selected: (isSelected) ? "true" : "false" };
                    const lblCheck = Label({ text: (isSelected) ? BasicDesigner.paramIcon("check", 14) : "", width: 16, height: BasicDesigner.PARAM_LIST_ROW_HEIGHT, textColor: C.text, lineHeight: "0" });
                    lblCheck.shrink = 0;
                    lblCheck.css = { display: "flex", alignItems: "center" };
                    if (item.color) {
                        const dot = BasicDesigner.buildSwatchBox(function () { });
                        dot.clickable = 0;
                        dot.css.marginLeft = "0px";
                        BasicDesigner.paintParamSwatch(dot, item.color);
                    }
                    const lblText = Label({ text: "", height: BasicDesigner.PARAM_LIST_ROW_HEIGHT, fontSize: (item.font) ? 13 : 12, textColor: C.text, ellipsis: 1 });
                    lblText.plainText = item.text;
                    lblText.grow = 1;
                    lblText.css = { minWidth: "0px", lineHeight: BasicDesigner.PARAM_LIST_ROW_HEIGHT + "px" };
                    if (item.font) lblText.fontFamily = item.font;
                endGroup();
                row.elem.title = item.hint || item.text;
                row.onHoverChange(function (self, isOver) {
                    if (!isOver) return;
                    activeIndex = index;
                    paint();
                });
                row.on("click", function () { pick(item); });
                rowViews.push(row);
            });
        endGroup();
        return group;
    });

    const height = list.elem.offsetHeight;
    const hasRoomBelow = (options.rect.bottom + height + BasicDesigner.POPOVER_MARGIN < window.innerHeight);
    list.left = Math.round(Math.max(BasicDesigner.POPOVER_MARGIN, Math.min(options.rect.right - width, window.innerWidth - width - BasicDesigner.POPOVER_MARGIN)));
    list.top = Math.round((hasRoomBelow) ? options.rect.bottom + 2 : Math.max(BasicDesigner.POPOVER_MARGIN, options.rect.top - height - 2));
    BasicDesigner.paramList = list;
    paint();
    list.elem.focus({ preventScroll: true });
    if (activeIndex !== -1) rowViews[activeIndex].elem.scrollIntoView({ block: "nearest" });

    list.on("keydown", function (self, event) {
        event.stopPropagation();
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const step = (event.key === "ArrowDown") ? 1 : -1;
            activeIndex = (activeIndex + step + items.length) % items.length;
            paint();
            rowViews[activeIndex].elem.scrollIntoView({ block: "nearest" });
        } else if (event.key === "Enter" && activeIndex !== -1) {
            event.preventDefault();
            pick(items[activeIndex]);
        } else if (event.key === "Escape") {
            event.preventDefault();
            BasicDesigner.closeParamList();
        }
    });
    list.listenTo(document, "pointerdown", function (self, event) {
        if (!list.elem.contains(event.target)) BasicDesigner.closeParamList();
    }, true);
    return list;
};

// The list of a row: the pick goes to the component at once.
BasicDesigner.openParamListOfRow = function (view, items) {
    const row = view.row;
    BasicDesigner.openParamList({
        rect: view.field.elem.getBoundingClientRect(),
        items: items,
        current: row.value,
        onPick: function (value) {
            BasicDesigner.applyParamValue(BasicDesigner.currentParamsObject(), row.path, value);
        },
    });
};

// *** SMALL OBJECTS OF THE EDITORS:

// GROUP: [label | number]. A drag of the label changes it. options: { label, value, width, step, min, max, onChange(value) }
BasicDesigner.paramNumberField = function (options) {
    const C = BasicDesigner.colors;
    const step = options.step || 1;
    const box = HGroup({ width: options.width || 56, height: 24, align: "left center", gap: 0, color: C.field, round: 4 });
    box.shrink = 0;
        let lbl = null;
        if (options.label) {
            lbl = Label({ text: "", height: 24, fontSize: 10, textColor: C.soft, clickable: 1, cursor: "ew-resize" });
            lbl.plainText = options.label;
            lbl.shrink = 0;
            lbl.css = { display: "flex", alignItems: "center", paddingLeft: "6px" };
        }
        const input = BasicDesigner.rawInput(box, { value: options.value });
        input.style.padding = "0px 4px";
        input.setAttribute("aria-label", options.ariaLabel || options.label || "Number");
    endGroup();
    box.elem.title = options.ariaLabel || "";

    const limit = function (value) {
        let result = value;
        if (options.min !== undefined && options.min !== null) result = Math.max(options.min, result);
        if (options.max !== undefined && options.max !== null) result = Math.min(options.max, result);
        return result;
    };

    const send = function (value) {
        box.value = value;
        options.onChange(value);
    };

    box.value = options.value;
    box.setValue = function (value) {
        box.value = value;
        if (document.activeElement !== input) input.value = String(value);
    };

    input.addEventListener("focus", function () { box.boxShadow = "inset 0 0 0 1px " + C.accent; });
    input.addEventListener("blur", function () {
        box.boxShadow = "none";
        input.value = String(box.value);
    });
    input.addEventListener("input", function () {
        const number = BasicDesigner.numberOfText(input.value);
        if (number !== null) send(limit(number));
    });
    input.addEventListener("keydown", function (event) {
        const isStep = (event.key === "ArrowUp" || event.key === "ArrowDown");
        if (event.key === "Enter") input.blur();
        if (!isStep) return;
        event.preventDefault();
        const direction = (event.key === "ArrowUp") ? 1 : -1;
        const steps = (event.shiftKey) ? 10 : 1;
        const next = limit(BasicDesigner.roundToStep(Number(box.value) + direction * steps * step, step));
        input.value = String(next);
        send(next);
    });
    if (lbl) {
        BasicDesigner.scrubOn(lbl, {
            read: function () { return Number(box.value) || 0; },
            step: function () { return step; },
            min: function () { return options.min; },
            write: function (value) {
                input.value = String(value);
                send(limit(value));
            },
            onClick: function () { input.focus(); },
        });
    }
    return box;
};

// BOX: a slider. options: { value, min, max, step, ariaLabel, onChange(value) }
BasicDesigner.PARAM_SLIDER_KNOB = 12;

BasicDesigner.paramSlider = function (options) {
    const C = BasicDesigner.colors;
    const knobSize = BasicDesigner.PARAM_SLIDER_KNOB;
    const min = (options.min === undefined || options.min === null) ? -options.max : options.min;
    const track = startBox({ width: 10, height: 18, color: "transparent", clickable: 1, cursor: "pointer" });
    track.grow = 1;
    track.css = { position: "relative", left: "0px", top: "0px", minWidth: "0px" };
    track.clipContent = 0;
    track.tabIndex = 0;
    track.role = "slider";
    track.aria = { label: options.ariaLabel || "Value", valuemin: min, valuemax: options.max };
    track.setFocusRing(C.accent);
        const line = Box({ left: 0, top: 7, width: "100%", height: 4, round: 2, color: C.fieldBorderStrong });
        line.clickable = 0;
        const fill = Box({ left: 0, top: 7, width: 0, height: 4, round: 2, color: C.accent });
        fill.clickable = 0;
        const knob = Box({ left: 0, top: 3, width: knobSize, height: knobSize, round: knobSize / 2, color: "#FFFFFF" });
        knob.clickable = 0;
    endBox();

    let value = options.value;

    track.setValue = function (next) {
        value = next;
        const ratio = Math.max(0, Math.min(1, (Number(next) - min) / (options.max - min)));
        const place = Math.round(ratio * (track.elem.clientWidth - knobSize));
        knob.left = place;
        fill.width = place + knobSize / 2;
        track.aria = { valuenow: next };
    };

    const send = function (next) {
        track.setValue(next);
        options.onChange(next);
    };

    const moveTo = function (event) {
        const rect = track.elem.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left - knobSize / 2) / (rect.width - knobSize)));
        send(BasicDesigner.roundToStep(min + ratio * (options.max - min), options.step, min));
    };

    track.elem.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        track.elem.focus();
        track.elem.setPointerCapture(event.pointerId);
        moveTo(event);
        const onUp = function () {
            track.elem.removeEventListener("pointermove", moveTo);
            track.elem.removeEventListener("pointerup", onUp);
            track.elem.removeEventListener("pointercancel", onUp);
            BasicDesigner.flushParamLive();
        };
        track.elem.addEventListener("pointermove", moveTo);
        track.elem.addEventListener("pointerup", onUp);
        track.elem.addEventListener("pointercancel", onUp);
    });
    track.on("keydown", function (self, event) {
        const isUp = (event.key === "ArrowRight" || event.key === "ArrowUp");
        const isDown = (event.key === "ArrowLeft" || event.key === "ArrowDown");
        if (!isUp && !isDown) return;
        event.preventDefault();
        const steps = (event.shiftKey) ? 10 : 1;
        const next = Number(value) + ((isUp) ? 1 : -1) * steps * options.step;
        send(BasicDesigner.roundToStep(Math.max(min, Math.min(options.max, next)), options.step, min));
    });
    track.setValue(value);
    return track;
};

// GROUP: The usual values. options: { values, current, format(value), onPick(value) }
BasicDesigner.paramChips = function (options) {
    const C = BasicDesigner.colors;
    const group = HGroup({ width: "100%", height: "auto", align: "left top", gap: 4, wrap: 1, color: "transparent" });
    group.shrink = 0;
        options.values.forEach(function (value) {
            const isCurrent = BasicDesigner.isSameParamValue(value, options.current);
            const text = (options.format) ? options.format(value) : String(value);
            const chip = Label({ text: "", height: 22, fontSize: 11, textColor: (isCurrent) ? C.accentLight : C.soft, color: (isCurrent) ? C.selectedRow : C.field, round: 4, clickable: 1, cursor: "pointer" });
            chip.plainText = text;
            chip.shrink = 0;
            chip.css = { display: "flex", alignItems: "center", padding: "0px 7px", whiteSpace: "nowrap" };
            chip.onHoverChange(function (self, isOver) {
                if (!isCurrent) chip.color = (isOver) ? C.fieldHover : C.field;
                if (!isCurrent) chip.textColor = (isOver) ? C.text : C.soft;
            });
            chip.on("click", function () { options.onPick(value); });
        });
    endGroup();
    return group;
};

// GROUP: One of a few. options: { options: [{ value, text }], value, width, onPick(value) }
BasicDesigner.paramSegmented = function (options) {
    const C = BasicDesigner.colors;
    const height = 24;
    const group = HGroup({ width: options.width || "100%", height: height, align: "left center", gap: 0, color: C.field, round: 5 });
    group.shrink = 0;
    group.role = "radiogroup";
        options.options.forEach(function (option) {
            const isSelected = (option.value === options.value);
            const seg = Label({ text: "", height: height, fontSize: 11, round: 5, textColor: (isSelected) ? C.text : C.soft, color: (isSelected) ? C.bar : "transparent", clickable: 1, cursor: "pointer" });
            seg.plainText = option.text;
            seg.grow = 1;
            seg.css = { flexBasis: "0px", display: "flex", alignItems: "center", justifyContent: "center", whiteSpace: "nowrap" };
            seg.boxShadow = (isSelected) ? "inset 0 0 0 1px " + C.fieldBorderStrong : "none";
            seg.role = "radio";
            seg.aria = { checked: (isSelected) ? "true" : "false" };
            if (!isSelected) seg.onHoverChange(function (self, isOver) { seg.color = (isOver) ? C.fieldHover : "transparent"; });
            seg.on("click", function () { options.onPick(option.value); });
        });
    endGroup();
    return group;
};

// GROUP: [■ text] a color inside an editor: its swatch opens the color picker at the left of the window.
// options: { value, hint, besideBox, noPagePick, onChange(value) }
BasicDesigner.paramColorField = function (options) {
    const C = BasicDesigner.colors;
    const box = HGroup({ width: "auto", height: 24, align: "left center", gap: 0, color: C.field, round: 4 });
    box.css = { flex: "1 1 0px", minWidth: "0px" };
        let value = options.value;
        const swatch = BasicDesigner.buildSwatchBox(function () {
            const panel = BasicDesigner.ui.panel;
            panel.openColorPickerFor({
                key: "param-part:" + options.hint,
                hint: options.hint,
                value: value,
                opener: swatch,
                rect: box.elem.getBoundingClientRect(),
                besideRect: options.besideBox.elem.getBoundingClientRect(),
                noPagePick: options.noPagePick,
                commit: function (next) {
                    value = next;
                    BasicDesigner.paintParamSwatch(swatch, next);
                    input.value = next;
                    options.onChange(next);
                },
            });
        });
        const input = BasicDesigner.rawInput(box, { value: value });
        input.setAttribute("aria-label", options.hint);
    endGroup();
    BasicDesigner.paintParamSwatch(swatch, value);
    input.addEventListener("focus", function () { box.boxShadow = "inset 0 0 0 1px " + C.accent; });
    input.addEventListener("blur", function () { box.boxShadow = "none"; });
    input.addEventListener("input", function () {
        const text = input.value.trim();
        if (!CSS.supports("color", text)) return;
        value = text;
        BasicDesigner.paintParamSwatch(swatch, text);
        options.onChange(text);
    });
    return box;
};

// A row of an editor: a plain text button.
BasicDesigner.paramTextButton = function (text, onClick) {
    const C = BasicDesigner.colors;
    const btn = BasicDesigner.toolButton(text, onClick, { color: C.field, hoverColor: C.fieldHover });
    btn.height = 24;
    btn.fontSize = 11;
    return btn;
};

// LABEL: a small icon with a click, in a row of an editor. (Ex: delete a layer)
BasicDesigner.paramSmallIconButton = function (iconName, name, onClick) {
    return BasicDesigner.iconButton({ path: BasicDesigner.PARAM_ICONS[iconName], name: name, size: 24, iconSize: 14, onClick: onClick });
};

// GROUP: [text ⌄] a text with a list of its usual values. options: { value, items, width, ariaLabel, onChange(value) }
BasicDesigner.paramComboField = function (options) {
    const C = BasicDesigner.colors;
    const box = HGroup({ width: options.width || "auto", height: 24, align: "left center", gap: 0, color: C.field, round: 4 });
    box.shrink = 0;
    if (!options.width) box.css = { flex: "1 1 0px", minWidth: "0px" };
        const input = BasicDesigner.rawInput(box, { value: options.value });
        input.setAttribute("aria-label", options.ariaLabel || "Value");
        if (options.placeholder) input.placeholder = options.placeholder;
        BasicDesigner.paramFieldButton("chevron", options.ariaLabel || "Values", "", function () {
            BasicDesigner.openParamList({
                rect: box.elem.getBoundingClientRect(),
                items: options.items,
                current: input.value,
                onPick: function (value) {
                    input.value = value;
                    options.onChange(value);
                },
            });
        });
    endGroup();
    input.addEventListener("focus", function () { box.boxShadow = "inset 0 0 0 1px " + C.accent; });
    input.addEventListener("blur", function () { box.boxShadow = "none"; });
    input.addEventListener("input", function () { options.onChange(input.value); });
    return box;
};

// *** THE EDITORS OF THE KINDS:

// COLOR: the color picker of the panel, its groups and its recent colors. WHY its swatch and not its name alone: the Box
// view opens the same window from the same place.
BasicDesigner.openParamColor = function (view) {
    BasicDesigner.setActiveColorRow(view.row.pathText);
    const edit = BasicDesigner.startParamEdit(view.row);
    const color = { pathText: view.row.pathText, closedAt: 0 };
    BasicDesigner.paramColor = color;
    BasicDesigner.ui.panel.openColorPickerFor({
        key: "param:" + view.row.pathText,
        hint: view.row.key,
        value: (edit.value === null || edit.value === undefined) ? "" : edit.value,
        opener: view.swatch,
        rect: view.field.elem.getBoundingClientRect(),
        commit: edit.set,
        onClose: function () {
            color.closedAt = performance.now();
            BasicDesigner.paramEditId = null;
            BasicDesigner.flushParamLive();
        },
    });
};

// NUMBER: a slider, the number, the usual values. view.range: a range of its own (rangeOfNumber guesses one).
BasicDesigner.openParamNumber = function (view) {
    const range = view.range || BasicDesigner.rangeOfNumber(view.row.key, view.row.value);
    BasicDesigner.openParamPopover(view, {
        width: 250,
        build: function (body, popover) {
            const edit = popover.edit;
            let slider = null;
            let field = null;
            // GROUP: The slider and the number
            const row = HGroup({ width: "100%", height: 24, align: "left center", gap: 10, color: "transparent" });
            row.clipContent = 0;
            row.shrink = 0;
                slider = BasicDesigner.paramSlider({ value: edit.value, min: range.min, max: range.max, step: range.step, ariaLabel: edit.key,
                    onChange: function (value) {
                        field.setValue(value);
                        edit.set(value);
                    } });
                field = BasicDesigner.paramNumberField({ value: edit.value, width: 64, step: range.step, min: range.min, ariaLabel: edit.key,
                    onChange: function (value) {
                        slider.setValue(value);
                        edit.set(value);
                    } });
            endGroup();
            if (range.values.length) {
                BasicDesigner.paramChips({ values: range.values, current: edit.value, onPick: function (value) {
                    edit.set(value);
                    popover.draw();
                } });
            }
        },
    });
};

// SIZE: the usual ones of the Box view. (240, 100%, auto: its text is read as there.)
BasicDesigner.openParamSizeList = function (view) {
    BasicDesigner.openParamListOfRow(view, BasicDesigner.SIZE_PRESETS.map(function (item) {
        return { value: item.value, text: item.text };
    }));
};

BasicDesigner.openParamOptions = function (view) {
    BasicDesigner.openParamListOfRow(view, view.row.kind.options || []);
};

// FONT: the fonts of the page, then the usual ones. Each row is written in its font.
BasicDesigner.USUAL_FONTS = [
    "opensans",
    "opensans-bold",
    "system-ui, -apple-system, 'Segoe UI', sans-serif",
    "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "Georgia, 'Times New Roman', serif",
    "Arial, Helvetica, sans-serif",
];

BasicDesigner.fontsOfPage = function () {
    const win = BasicDesigner.state.win;
    const names = [];
    if (!win || !win.document.fonts) return names;
    win.document.fonts.forEach(function (face) {
        const name = String(face.family).replace(/^["']|["']$/g, "");
        if (names.indexOf(name) === -1) names.push(name);
    });
    return names;
};

BasicDesigner.openParamFontList = function (view) {
    const fonts = BasicDesigner.fontsOfPage();
    BasicDesigner.USUAL_FONTS.forEach(function (font) {
        if (fonts.indexOf(font) === -1) fonts.push(font);
    });
    const current = view.row.value;
    if (current && fonts.indexOf(current) === -1) fonts.unshift(current);
    const items = fonts.map(function (font) { return { value: font, text: font, font: font }; });
    items.unshift({ value: "", text: '""  (not given)' });
    BasicDesigner.openParamListOfRow(view, items);
};

// EASING: the words of CSS and the curve of the motions of the kit.
BasicDesigner.USUAL_EASINGS = [
    { value: "ease", text: "ease" },
    { value: "linear", text: "linear" },
    { value: "ease-in", text: "ease-in" },
    { value: "ease-out", text: "ease-out" },
    { value: "ease-in-out", text: "ease-in-out" },
    { value: "cubic-bezier(0.2, 0.8, 0.2, 1)", text: "the kit: cubic-bezier(0.2, 0.8, 0.2, 1)" },
    { value: "cubic-bezier(0.2, 0, 0, 1)", text: "cubic-bezier(0.2, 0, 0, 1)" },
];

BasicDesigner.USUAL_FILTERS = [
    { value: "", text: '""  (none)' },
    { value: "none", text: "none" },
    { value: "brightness(0) invert(1)", text: "white icon: brightness(0) invert(1)" },
    { value: "brightness(0)", text: "black icon: brightness(0)" },
    { value: "grayscale(1)", text: "gray: grayscale(1)" },
    { value: "opacity(0.5)", text: "half: opacity(0.5)" },
    { value: "brightness(1.2)", text: "lighter: brightness(1.2)" },
    { value: "brightness(0.85)", text: "darker: brightness(0.85)" },
    { value: "blur(2px)", text: "blur(2px)" },
];

BasicDesigner.openParamFixedList = function (view, items) {
    const list = items.slice();
    const current = view.row.value;
    const isKnown = list.some(function (item) { return item.value === current; });
    if (current && !isKnown) list.unshift({ value: current, text: String(current) });
    BasicDesigner.openParamListOfRow(view, list);
};

// PADDING: its four sides around a box. The same value on all sides: one number; x and y: two; else four.
BasicDesigner.USUAL_PADDINGS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24];
BasicDesigner.USUAL_BORDERS = [0, 1, 2, 3, 4];

BasicDesigner.openParamPadding = function (view) {
    BasicDesigner.openParamSides(view, BasicDesigner.USUAL_PADDINGS);
};

// SIDES: a padding, or the widths of a border (the Box view): the same order in basic.js (left, top, right, bottom).
// usualValues: the chips under them.
BasicDesigner.openParamSides = function (view, usualValues) {
    BasicDesigner.openParamPopover(view, {
        width: 230,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const sides = BasicDesigner.readPaddingSides(edit.value);
            if (popover.isLinked === undefined) popover.isLinked = (typeof edit.value === "number");
            const fields = {};

            const send = function (changedSide, value) {
                sides[changedSide] = value;
                if (popover.isLinked) {
                    ["left", "top", "right", "bottom"].forEach(function (side) {
                        sides[side] = value;
                        if (side !== changedSide) fields[side].setValue(value);
                    });
                }
                edit.set(BasicDesigner.writePaddingSides(sides));
            };

            const sideField = function (side, label) {
                fields[side] = BasicDesigner.paramNumberField({ label: label, value: sides[side], width: 58, min: 0, ariaLabel: side,
                    onChange: function (value) { send(side, value); } });
                return fields[side];
            };

            // GROUP: The sides, around a box
            const diagram = VGroup({ width: "100%", height: "auto", align: "center center", gap: 6, color: "transparent" });
            diagram.shrink = 0;
                sideField("top", "T");
                HGroup({ width: "100%", height: 28, align: "center center", gap: 6, color: "transparent" });
                    sideField("left", "L");
                    const middle = Box({ width: 40, height: 28, round: 3, color: "transparent" });
                    middle.shrink = 0;
                    middle.css = { position: "relative", left: "0px", top: "0px", border: "1px dashed " + C.fieldBorderStrong, boxSizing: "border-box" };
                    sideField("right", "R");
                endGroup();
                sideField("bottom", "B");
            endGroup();

            // GROUP: The same on all sides
            const linked = HGroup({ width: "100%", height: 20, align: "left center", gap: 8, color: "transparent" });
            linked.shrink = 0;
                const toggle = BasicDesigner.buildSwitch(function () {
                    popover.isLinked = !popover.isLinked;
                    if (popover.isLinked) send("left", sides.left);
                    popover.draw();
                });
                toggle.setOn(popover.isLinked);
                BasicDesigner.popoverCaption("The same on all sides");
            endGroup();

            BasicDesigner.paramChips({ values: usualValues, current: (popover.isLinked) ? sides.left : null, onPick: function (value) {
                popover.isLinked = true;
                edit.set(value);
                popover.draw();
            } });
        },
    });
};

// CORNERS: the four corners of a round, around a card that shows them. The same on all corners: one number; the top ones
// and the bottom ones: two; else four (the order of basic.js: top left, top right, bottom right, bottom left).
BasicDesigner.USUAL_ROUNDS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 999];
BasicDesigner.PILL_ROUND = 999;
BasicDesigner.CORNER_PREVIEW_LIMIT = 16; // px: half of the height of the card (32); a bigger round is drawn as this
BasicDesigner.CORNER_CARD_WIDTH = 176;

BasicDesigner.openParamCorners = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 230,
        build: function (body, popover) {
            const edit = popover.edit;
            const corners = BasicDesigner.readCorners(edit.value);
            if (popover.isLinked === undefined) popover.isLinked = (typeof edit.value === "number");
            const fields = {};
            let card = null;

            const paint = function () {
                const drawn = BasicDesigner.CORNER_NAMES.map(function (corner) {
                    return Math.min(corners[corner], BasicDesigner.CORNER_PREVIEW_LIMIT) + "px";
                });
                card.css.borderRadius = drawn.join(" ");
            };

            const send = function (changedCorner, value) {
                corners[changedCorner] = value;
                if (popover.isLinked) {
                    BasicDesigner.CORNER_NAMES.forEach(function (corner) {
                        corners[corner] = value;
                        if (corner !== changedCorner) fields[corner].setValue(value);
                    });
                }
                paint();
                edit.set(BasicDesigner.writeCorners(corners));
            };

            // GROUP: Two corners over or under the card, at its ends
            const cornerRow = function (left, right) {
                const row = HGroup({ width: BasicDesigner.CORNER_CARD_WIDTH, height: 24, align: "left center", justify: "space-between", color: "transparent" });
                row.shrink = 0;
                    [left, right].forEach(function (pair) {
                        const corner = pair[0];
                        fields[corner] = BasicDesigner.paramNumberField({ label: pair[1], value: corners[corner], width: 64, min: 0, ariaLabel: pair[2],
                            onChange: function (value) { send(corner, value); } });
                    });
                endGroup();
            };

            // GROUP: The corners, around a card that shows them
            const diagram = VGroup({ width: "100%", height: "auto", align: "center top", gap: 6, color: "transparent" });
            diagram.shrink = 0;
                cornerRow(["topLeft", "TL", "Top left"], ["topRight", "TR", "Top right"]);
                card = BasicDesigner.paramPreviewCard(64);
                card.width = BasicDesigner.CORNER_CARD_WIDTH - 32;
                card.center();
                cornerRow(["bottomLeft", "BL", "Bottom left"], ["bottomRight", "BR", "Bottom right"]);
            endGroup();
            paint();

            // GROUP: The same on all corners
            const linked = HGroup({ width: "100%", height: 20, align: "left center", gap: 8, color: "transparent" });
            linked.shrink = 0;
                const toggle = BasicDesigner.buildSwitch(function () {
                    popover.isLinked = !popover.isLinked;
                    if (popover.isLinked) send("topLeft", corners.topLeft);
                    popover.draw();
                });
                toggle.setOn(popover.isLinked);
                BasicDesigner.popoverCaption("The same on all corners");
            endGroup();

            BasicDesigner.paramChips({
                values: BasicDesigner.USUAL_ROUNDS,
                current: (popover.isLinked) ? corners.topLeft : null,
                format: function (value) { return (value === BasicDesigner.PILL_ROUND) ? "Pill" : String(value); },
                onPick: function (value) {
                    popover.isLinked = true;
                    edit.set(value);
                    popover.draw();
                },
            });
        },
    });
};

// GAP: x (between the items of a line) and y (between the lines of a wrap), with a few boxes that show them.
BasicDesigner.USUAL_GAPS = [0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 32];
BasicDesigner.GAP_PREVIEW_LIMIT = 16; // px: a bigger gap is drawn as this
BasicDesigner.GAP_PREVIEW_ITEMS = 5;
BasicDesigner.GAP_PREVIEW_ITEM_WIDTH = 30;
BasicDesigner.GAP_PREVIEW_WIDTH = 124; // WHY: three boxes and the largest gap fit in a line: always two lines

BasicDesigner.openParamGap = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 230,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const gap = BasicDesigner.readGap(edit.value);
            if (popover.isLinked === undefined) popover.isLinked = (gap.x === gap.y);
            const fields = {};
            let items = null;

            const paint = function () {
                items.css = {
                    columnGap: Math.min(gap.x, BasicDesigner.GAP_PREVIEW_LIMIT) + "px",
                    rowGap: Math.min(gap.y, BasicDesigner.GAP_PREVIEW_LIMIT) + "px",
                };
            };

            const send = function (changedAxis, value) {
                gap[changedAxis] = value;
                if (popover.isLinked) {
                    const otherAxis = (changedAxis === "x") ? "y" : "x";
                    gap[otherAxis] = value;
                    fields[otherAxis].setValue(value);
                }
                paint();
                edit.set(BasicDesigner.writeGap(gap));
            };

            // GROUP: x and y
            const row = HGroup({ width: "100%", height: 24, align: "left center", gap: 6, color: "transparent" });
            row.shrink = 0;
                fields.x = BasicDesigner.paramNumberField({ label: "X", value: gap.x, width: "auto", min: 0, ariaLabel: "x: between the items of a line",
                    onChange: function (value) { send("x", value); } });
                fields.x.css = { flex: "1 1 0px", minWidth: "0px" };
                fields.y = BasicDesigner.paramNumberField({ label: "Y", value: gap.y, width: "auto", min: 0, ariaLabel: "y: between the lines",
                    onChange: function (value) { send("y", value); } });
                fields.y.css = { flex: "1 1 0px", minWidth: "0px" };
            endGroup();
            BasicDesigner.popoverCaption("X: between the items of a line · Y: between the lines (wrap)");

            // GROUP: A few boxes in two lines that show the gap (in the middle of a light ground, whatever its height)
            const ground = VGroup({ width: "100%", height: 64, align: "center center", round: 6, color: "#E9E9E7" });
            ground.shrink = 0;
                items = HGroup({ width: BasicDesigner.GAP_PREVIEW_WIDTH, height: "auto", align: "left top", wrap: 1, color: "transparent" });
                items.shrink = 0;
                for (let i = 0; i < BasicDesigner.GAP_PREVIEW_ITEMS; i++) {
                    const item = Box({ width: BasicDesigner.GAP_PREVIEW_ITEM_WIDTH, height: 14, round: 3, color: C.accent });
                    item.shrink = 0;
                }
                endGroup();
            endGroup();
            paint();

            // GROUP: The same in both ways
            const linked = HGroup({ width: "100%", height: 20, align: "left center", gap: 8, color: "transparent" });
            linked.shrink = 0;
                const toggle = BasicDesigner.buildSwitch(function () {
                    popover.isLinked = !popover.isLinked;
                    if (popover.isLinked) send("x", gap.x);
                    popover.draw();
                });
                toggle.setOn(popover.isLinked);
                BasicDesigner.popoverCaption("The same in both ways");
            endGroup();

            BasicDesigner.paramChips({ values: BasicDesigner.USUAL_GAPS, current: (popover.isLinked) ? gap.x : null, onPick: function (value) {
                popover.isLinked = true;
                edit.set(value);
                popover.draw();
            } });
        },
    });
};

// A preview of a look on a card over a light ground, in an editor. Returns the card.
BasicDesigner.paramPreviewCard = function (height) {
    const ground = startBox({ width: "100%", height: height, round: 6, color: "#E9E9E7" });
    ground.shrink = 0;
    ground.css = { position: "relative", left: "0px", top: "0px" };
        const card = Box({ width: 96, height: Math.max(24, height - 32), round: 8, color: "#FFFFFF" });
        card.center();
    endBox();
    return card;
};

// SHADOW: its layers, a card that shows it, the usual ones.
BasicDesigner.USUAL_SHADOWS = [
    { text: "None", value: "" },
    { text: "Small", value: "0px 2px 6px rgba(0, 0, 0, 0.12)" },
    { text: "Medium", value: "0px 4px 12px rgba(0, 0, 0, 0.18)" },
    { text: "Large", value: "0px 10px 30px rgba(0, 0, 0, 0.2)" },
    { text: "Line under", value: "inset 0px -2px 0px rgba(0, 0, 0, 0.1)" },
];

BasicDesigner.openParamShadow = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 312,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const layers = BasicDesigner.readShadow(edit.value);
            const card = BasicDesigner.paramPreviewCard(76);
            const paint = function () { card.boxShadow = BasicDesigner.writeShadow(layers) || "none"; };
            paint();

            const send = function () {
                paint();
                edit.set(BasicDesigner.writeShadow(layers));
            };

            layers.forEach(function (layer, index) {
                // GROUP: A layer
                const block = VGroup({ width: "100%", height: "auto", align: "left top", gap: 4, padding: 6, color: C.raised, round: 6 });
                block.css = { alignItems: "stretch", boxSizing: "border-box" };
                block.shrink = 0;
                    // GROUP: Its numbers
                    HGroup({ width: "100%", height: 24, align: "left center", gap: 4, color: "transparent" }).shrink = 0;
                        const numberOf = function (key, label) {
                            BasicDesigner.paramNumberField({ label: label, value: layer[key], width: "auto", ariaLabel: key,
                                onChange: function (value) {
                                    layer[key] = value;
                                    send();
                                } }).css = { flex: "1 1 0px", minWidth: "0px" };
                        };
                        numberOf("x", "X");
                        numberOf("y", "Y");
                        numberOf("blur", "B");
                        numberOf("spread", "S");
                    endGroup();
                    // GROUP: Its color, inside or outside, delete
                    const colorRow = HGroup({ width: "100%", height: 24, align: "left center", gap: 4, color: "transparent" });
                    colorRow.shrink = 0;
                        BasicDesigner.paramColorField({ value: layer.color, hint: "Shadow color", besideBox: popover.box,
                            onChange: function (value) {
                                layer.color = value;
                                send();
                            } });
                        const insideText = (layer.inset) ? "Inside" : "Outside";
                        BasicDesigner.paramTextButton(insideText, function () {
                            layer.inset = !layer.inset;
                            send();
                            popover.draw();
                        });
                        BasicDesigner.paramSmallIconButton("trash", "Delete this layer", function () {
                            layers.splice(index, 1);
                            send();
                            popover.draw();
                        });
                    endGroup();
                endGroup();
            });

            // GROUP: A new layer, the usual shadows
            BasicDesigner.paramChips({
                values: BasicDesigner.USUAL_SHADOWS.map(function (item) { return item.value; }),
                current: edit.value,
                format: function (value) { return BasicDesigner.USUAL_SHADOWS.find(function (item) { return item.value === value; }).text; },
                onPick: function (value) {
                    edit.set(value);
                    popover.draw();
                },
            });
            const btnAdd = BasicDesigner.paramTextButton("+ Layer", function () {
                layers.push({ x: 0, y: 4, blur: 12, spread: 0, color: "rgba(0, 0, 0, 0.18)", inset: false });
                send();
                popover.draw();
            });
            btnAdd.width = "100%";
            popover.place();
        },
    });
};

// LINE: its width, its look and its color.
BasicDesigner.openParamBorder = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 270,
        build: function (body, popover) {
            const edit = popover.edit;
            const line = BasicDesigner.readLine(edit.value);
            // BOX: How it looks
            const preview = Box({ width: "100%", height: 20, color: "#E9E9E7", round: 4 });
            preview.shrink = 0;
            preview.css = { position: "relative", left: "0px", top: "0px", boxSizing: "border-box" };
            const paint = function () { preview.css.borderBottom = BasicDesigner.writeLine(line); };
            paint();

            const send = function () {
                paint();
                edit.set(BasicDesigner.writeLine(line));
            };

            const looks = BasicDesigner.LINE_STYLES.slice(0, 3).map(function (style) { return { value: style, text: style }; });
            looks.push({ value: "none", text: "none" });
            BasicDesigner.paramSegmented({
                options: looks,
                value: (line.isNone) ? "none" : line.style,
                onPick: function (value) {
                    line.isNone = (value === "none");
                    if (!line.isNone) line.style = value;
                    send();
                    popover.draw();
                },
            });
            // GROUP: Its width and its color
            const row = HGroup({ width: "100%", height: 24, align: "left center", gap: 6, color: "transparent" });
            row.shrink = 0;
                BasicDesigner.paramNumberField({ label: "W", value: line.width, width: 56, min: 0, ariaLabel: "Width of the line",
                    onChange: function (value) {
                        line.width = value;
                        send();
                    } });
                BasicDesigner.paramColorField({ value: line.color, hint: "Line color", besideBox: popover.box,
                    onChange: function (value) {
                        line.color = value;
                        send();
                    } });
            endGroup();
            popover.place();
        },
    });
};

// MOTION: what moves, in how long, with which curve.
BasicDesigner.USUAL_MOTION_PROPERTIES = ["", "all", "transform", "opacity", "background-color", "color", "border-color", "box-shadow", "width", "height", "left", "top"];

BasicDesigner.openParamMotion = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 350,
        build: function (body, popover) {
            const edit = popover.edit;
            const layers = BasicDesigner.readMotion(edit.value);
            const send = function () { edit.set(BasicDesigner.writeMotion(layers)); };
            const propertyItems = BasicDesigner.USUAL_MOTION_PROPERTIES.map(function (property) {
                return { value: property, text: (property) ? property : '""  (not named)' };
            });
            const easingItems = [{ value: "", text: '""  (ease)' }].concat(BasicDesigner.USUAL_EASINGS);

            layers.forEach(function (layer, index) {
                // GROUP: A motion
                const row = HGroup({ width: "100%", height: 24, align: "left center", gap: 4, color: "transparent" });
                row.shrink = 0;
                    BasicDesigner.paramComboField({ value: layer.property, items: propertyItems, ariaLabel: "What moves", placeholder: "all",
                        onChange: function (value) {
                            layer.property = value.trim();
                            send();
                        } });
                    BasicDesigner.paramNumberField({ label: "s", value: layer.seconds, width: 60, step: 0.05, min: 0, ariaLabel: "Seconds",
                        onChange: function (value) {
                            layer.seconds = value;
                            send();
                        } });
                    BasicDesigner.paramComboField({ value: layer.easing, items: easingItems, width: 92, ariaLabel: "Curve", placeholder: "ease",
                        onChange: function (value) {
                            layer.easing = value.trim();
                            send();
                        } });
                    BasicDesigner.paramSmallIconButton("trash", "Delete this motion", function () {
                        layers.splice(index, 1);
                        send();
                        popover.draw();
                    });
                endGroup();
            });

            const btnAdd = BasicDesigner.paramTextButton("+ Motion", function () {
                layers.push({ property: "opacity", seconds: 0.2, easing: "", delay: "" });
                send();
                popover.draw();
            });
            btnAdd.width = "100%";
            popover.place();
        },
    });
};

// GRADIENT: its direction and its colors. Another form (radial): a text.
BasicDesigner.GRADIENT_DIRECTIONS = ["to bottom", "to top", "to right", "to left", "to bottom right", "to top right", "45deg", "135deg"];

BasicDesigner.openParamGradient = function (view) {
    if (!BasicDesigner.readGradient(view.row.value)) {
        BasicDesigner.openParamText(view);
        return;
    }
    BasicDesigner.openParamPopover(view, {
        width: 300,
        build: function (body, popover) {
            const edit = popover.edit;
            const gradient = BasicDesigner.readGradient(edit.value) || BasicDesigner.readGradient("");
            // BOX: How it looks
            const preview = Box({ width: "100%", height: 44, round: 6, color: "transparent" });
            preview.shrink = 0;
            preview.css = { position: "relative", left: "0px", top: "0px" };
            const paint = function () {
                preview.css.background = BasicDesigner.writeGradient(gradient) + ", " + BasicDesigner.CHECKER;
            };
            paint();

            const send = function () {
                paint();
                edit.set(BasicDesigner.writeGradient(gradient));
            };

            BasicDesigner.paramComboField({
                value: gradient.direction,
                items: BasicDesigner.GRADIENT_DIRECTIONS.map(function (direction) { return { value: direction, text: direction }; }),
                ariaLabel: "Direction",
                width: "100%",
                onChange: function (value) {
                    gradient.direction = value.trim() || "to bottom";
                    send();
                },
            });

            gradient.stops.forEach(function (stop, index) {
                // GROUP: A color and its place
                const row = HGroup({ width: "100%", height: 24, align: "left center", gap: 4, color: "transparent" });
                row.shrink = 0;
                    BasicDesigner.paramColorField({ value: stop.color, hint: "Color " + (index + 1), besideBox: popover.box,
                        onChange: function (value) {
                            stop.color = value;
                            send();
                        } });
                    // GROUP: Its place on the line (Ex: 40%)
                    const placeBox = HGroup({ width: 56, height: 24, align: "left center", color: BasicDesigner.colors.field, round: 4 });
                    placeBox.shrink = 0;
                        const placeInput = BasicDesigner.rawInput(placeBox, { value: stop.place });
                        placeInput.placeholder = "auto";
                        placeInput.setAttribute("aria-label", "Place of the color");
                        placeInput.addEventListener("input", function () {
                            stop.place = placeInput.value.trim();
                            send();
                        });
                    endGroup();
                    BasicDesigner.paramSmallIconButton("trash", "Delete this color", function () {
                        if (gradient.stops.length <= 2) return;
                        gradient.stops.splice(index, 1);
                        send();
                        popover.draw();
                    });
                endGroup();
            });

            const btnAdd = BasicDesigner.paramTextButton("+ Color", function () {
                gradient.stops.push({ color: "#FFFFFF", place: "" });
                send();
                popover.draw();
            });
            btnAdd.width = "100%";
            popover.place();
        },
    });
};

// ALIGN: the nine places of the content of a group.
BasicDesigner.ALIGN_ROWS = [
    ["left top", "center top", "right top"],
    ["left center", "center", "right center"],
    ["left bottom", "center bottom", "right bottom"],
];

// "top left" and "left top", "center center" and "center" are the same place.
BasicDesigner.normalAlign = function (text) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const across = words.find(function (word) { return word === "left" || word === "right"; }) || "center";
    const down = words.find(function (word) { return word === "top" || word === "bottom"; }) || "center";
    if (!words.length) return "";
    if (across === "center" && down === "center") return "center";
    return across + " " + down;
};

BasicDesigner.openParamAlign = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 170,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const current = BasicDesigner.normalAlign(edit.value);
            const CELL = 28;
            // GROUP: The places
            const grid = VGroup({ width: CELL * 3 + 8, height: CELL * 3 + 8, align: "left top", gap: 4, color: "transparent" });
            grid.shrink = 0;
                BasicDesigner.ALIGN_ROWS.forEach(function (places) {
                    const row = HGroup({ width: "100%", height: CELL, align: "left center", gap: 4, color: "transparent" });
                    row.shrink = 0;
                        places.forEach(function (place) {
                            const isSelected = (place === current);
                            const cell = Label({ text: "", width: CELL, height: CELL, round: 4, color: (isSelected) ? C.accent : C.field, clickable: 1, cursor: "pointer" });
                            cell.shrink = 0;
                            cell.elem.title = place;
                            cell.aria = { label: place };
                            cell.role = "button";
                            if (!isSelected) cell.onHoverChange(function (self, isOver) { cell.color = (isOver) ? C.fieldHover : C.field; });
                            cell.on("click", function () {
                                edit.set(place);
                                popover.draw();
                            });
                        });
                    endGroup();
                });
            endGroup();
        },
    });
};

// PICTURE: how it looks, a file of the project, or the code of an SVG.
BasicDesigner.openParamPicture = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 300,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const address = BasicDesigner.pictureAddress(edit.value);

            // BOX: How it looks (a middle gray: black and white icons both show on it)
            const preview = Icon({ width: "100%", height: 96, imageFit: "contain", color: BasicDesigner.PARAM_THUMB_COLOR, round: 6 });
            preview.shrink = 0;
            preview.css = { position: "relative", left: "0px", top: "0px" };
            if (address) preview.load(address);

            // GROUP: Choose, empty
            const buttons = HGroup({ width: "100%", height: 24, align: "left center", gap: 6, color: "transparent" });
            buttons.shrink = 0;
                const btnChoose = BasicDesigner.paramTextButton("Choose a file…", function () {
                    BasicDesigner.openPictureBrowser(String(edit.value || ""), function (repoPath) {
                        edit.set(BasicDesigner.pathFromPage(repoPath));
                        popover.draw();
                    });
                });
                btnChoose.grow = 1;
                BasicDesigner.paramTextButton("Empty", function () {
                    edit.set("");
                    popover.draw();
                });
            endGroup();

            // BOX: The code of an SVG: it is written into the value as a data address
            BasicDesigner.popoverCaption("SVG code");
            const holder = Box({ width: "100%", height: 110, color: C.field, round: 4 });
            holder.shrink = 0;
            holder.css = { position: "relative", left: "0px", top: "0px" };
            const area = BasicDesigner.rawTextarea(holder, { value: BasicDesigner.svgOfPicture(edit.value), isCode: true });
            area.placeholder = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\">…<\/svg>";
            area.setAttribute("aria-label", "SVG code");
            area.addEventListener("input", function () {
                const text = area.value.trim();
                if (!/^<svg\b/i.test(text)) return;
                const isRawSvg = /^<svg\b/i.test(String(edit.before || ""));
                const next = (isRawSvg) ? text : BasicDesigner.pictureOfSvg(text);
                edit.set(next);
                preview.load(BasicDesigner.pictureAddress(next));
            });
            popover.place();
        },
    });
};

// TEXT: more room than the field of a row. Written in the page at once.
BasicDesigner.openParamText = function (view) {
    const row = view.row;
    const isCode = BasicDesigner.LONG_TEXT_KEY.test(row.key) || /<[a-z]/i.test(String(row.value || ""));
    const isAny = (row.kind.name === "any");
    const popover = BasicDesigner.openParamPopover(view, {
        width: 340,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            const holder = Box({ width: "100%", height: 150, color: C.field, round: 4 });
            holder.shrink = 0;
            holder.css = { position: "relative", left: "0px", top: "0px" };
            const shownValue = (typeof edit.value === "string") ? edit.value : BasicDesigner.paramText(edit.value).text;
            popover.area = BasicDesigner.rawTextarea(holder, { value: (edit.value === null || edit.value === undefined) ? "" : shownValue, isCode: isCode });
            popover.area.setAttribute("aria-label", edit.key);
            const lblInfo = BasicDesigner.popoverCaption("");
            const paintInfo = function () {
                if (isAny) {
                    const text = popover.area.value;
                    lblInfo.plainText = (text.trim() === "") ? "Empty: null" : "Reads as: " + BasicDesigner.nameOfValueType(BasicDesigner.PARAM_TEXT_READERS.any(text));
                    return;
                }
                lblInfo.plainText = popover.area.value.length + " characters";
            };
            paintInfo();
            popover.area.addEventListener("input", function () {
                paintInfo();
                if (!isAny) {
                    edit.set(popover.area.value);
                    return;
                }
                edit.set((popover.area.value.trim() === "") ? null : BasicDesigner.PARAM_TEXT_READERS.any(popover.area.value));
            });
            popover.area.addEventListener("keydown", function (event) {
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) popover.close();
            });
        },
    });
    popover.area.focus();
    popover.area.setSelectionRange(popover.area.value.length, popover.area.value.length);
};

BasicDesigner.nameOfValueType = function (value) {
    if (value === null) return "null";
    if (Array.isArray(value)) return "a list";
    if (typeof value === "object") return "an object";
    if (typeof value === "number") return "a number";
    if (typeof value === "boolean") return "yes / no";
    return "a text";
};

// DATE, TIME: the fields of the browser. Empty: null.
BasicDesigner.openParamDateOrTime = function (view, inputType) {
    BasicDesigner.openParamPopover(view, {
        width: 220,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const edit = popover.edit;
            // GROUP: The field
            const row = HGroup({ width: "100%", height: 28, align: "left center", gap: 6, color: "transparent" });
            row.shrink = 0;
                const fieldBox = HGroup({ width: "auto", height: 28, align: "left center", color: C.field, round: 4 });
                fieldBox.css = { flex: "1 1 0px", minWidth: "0px" };
                    const input = BasicDesigner.rawInput(fieldBox, { type: inputType, value: edit.value });
                    input.style.colorScheme = "dark";
                    input.setAttribute("aria-label", edit.key);
                    input.addEventListener("input", function () { edit.set(input.value || null); });
                endGroup();
                BasicDesigner.paramTextButton("Empty", function () {
                    edit.set(null);
                    popover.draw();
                });
            endGroup();
        },
    });
};

// A FUNCTION can not be written here: its code is shown.
BasicDesigner.openParamFunction = function (view) {
    BasicDesigner.openParamPopover(view, {
        width: 400,
        build: function (body, popover) {
            const C = BasicDesigner.colors;
            const value = popover.edit.value;
            const holder = Box({ width: "100%", height: 180, color: C.field, round: 4 });
            holder.shrink = 0;
            holder.css = { position: "relative", left: "0px", top: "0px" };
            const area = BasicDesigner.rawTextarea(holder, { value: (typeof value === "function") ? String(value) : "No function here.", isCode: true, isReadOnly: true });
            area.setAttribute("aria-label", "The code of " + popover.edit.key);
            const lblInfo = BasicDesigner.popoverNote("It can not be changed here. Write what it should do in the note for the AI, at the bottom of the panel.");
            lblInfo.textColor = C.dim;
        },
    });
};

// The list of a row, or a group as a table: its own window (JsonEditor.open of comp/json-editor.js, over the designer).
BasicDesigner.openParamTable = function (row) {
    const obj = BasicDesigner.currentParamsObject();
    if (!obj) return;
    const ui = BasicDesigner.ui;
    const s = BasicDesigner.state;
    BasicDesigner.closeParamEditors();
    const isObjectNote = /^\s*\{/.test(String(row.note || ""));
    const emptyValue = (isObjectNote) ? {} : [];
    ui.tableWindow = JsonEditor.open({
        styleName: "dark",
        style: BasicDesigner.tableStyle(),
        titleText: obj.__bd.component + " · " + row.pathText,
        noteText: row.note || "",
        value: (row.value === null || row.value === undefined) ? emptyValue : row.value,
        columns: BasicDesigner.tableColumnsOf(BasicDesigner.columnsOfNote(obj.__bd.component, row.note)),
        pictureBase: new URL(s.pagePath, s.rootUrl).href,
        onPickColor: BasicDesigner.pickTableColor,
        onPickPicture: BasicDesigner.pickTablePicture,
        colorOf: BasicDesigner.paintableColor,
        optionsOf: BasicDesigner.tableOptionsOf,
        onApply: function (value) {
            // WHY a timer: the component is made again from a clean stack. Its objects would take the frames of the
            //      table (comp/json-editor.js) as lines of the page (runtime.js can not tell them from a JsonEditor of the page).
            setTimeout(function () {
                const current = BasicDesigner.currentParamsObject();
                if (current) BasicDesigner.applyParamValue(current, row.path, value);
            }, 0);
        },
        onClose: function () {
            ui.tableWindow = null;
            ui.panel.closeColorPicker();
        },
    });
    // WHY: Escape closes a dialog of the designer over the table (the pictures of the project), not the table.
    ui.tableWindow.listenTo(document, "keydown", function (self, event) {
        if (event.key !== "Escape" || !ui.dialog) return;
        event.stopImmediatePropagation();
        BasicDesigner.closeDialog();
    }, true);
};

BasicDesigner.TABLE_Z_INDEX = 8900; // WHY: under the tips (9000), the lists (9100) and the dialogs (9600) of the designer
BasicDesigner.TABLE_ROUND = 12;
BasicDesigner.TABLE_NOTE_DEPTH = 3; // The lists in the cells of a list whose columns come from the comments

// The dark package of JsonEditor in the colors the designer has now (Settings: the background and the accent).
BasicDesigner.tableStyle = function () {
    const C = BasicDesigner.colors;
    return {
        box: { color: C.raised, borderColor: C.line, round: BasicDesigner.TABLE_ROUND },
        colors: {
            text: C.text,
            headText: C.text,
            soft: C.soft,
            dim: C.dim,
            icon: BasicDesigner.layerIconColors.object,
            line: C.line,
            rowLine: C.line,
            columnLine: C.line,
            headLine: C.fieldBorder,
            strongLine: C.fieldBorderStrong,
            ground: C.raised,
            head: C.raised,
            field: C.field,
            fieldHover: C.fieldHover,
            hover: C.hover,
            selected: C.selectedRow,
            segment: C.bar,
            accent: C.accent,
            accentHover: C.accentHover,
            accentText: C.accentLight,
            focus: C.accent,
            editor: C.menu,
        },
        search: { color: C.field },
        window: { zIndex: BasicDesigner.TABLE_Z_INDEX },
    };
};

// The columns the comment of a list names, with the columns of their own lists (a cell opens as a table with them).
BasicDesigner.tableColumnsOf = function (hints, depth = 0) {
    if (depth >= BasicDesigner.TABLE_NOTE_DEPTH) return hints;
    return hints.map(function (hint) {
        const inner = BasicDesigner.columnsOfNote("", hint.note);
        return Object.assign({}, hint, { columns: BasicDesigner.tableColumnsOf(inner, depth + 1) });
    });
};

// The choices of a text of the table from its name, as in the rows of the panel: the packages of a ...StyleName, the tones
// of SmartButton, the sides of an ...Align. null: none (the comments give the others: columns).
BasicDesigner.tableOptionsOf = function (key, value) {
    const kind = BasicDesigner.paramKindOf(key, value, undefined, "", "");
    if (kind.name !== "list") return null;
    return kind.options.map(function (option) { return option.value; });
};

// A color cell of the table: the color picker of the panel (its groups, its recent colors) at the cell.
BasicDesigner.pickTableColor = function (editor, cell) {
    BasicDesigner.ui.panel.openColorPickerFor({
        key: "table-cell",
        hint: cell.title,
        value: cell.value,
        noPagePick: 1,
        rect: { left: cell.x, top: cell.y, right: cell.x, bottom: cell.y + 4 },
        besideRect: { left: cell.x - 8, top: cell.y },
        commit: cell.setValue,
    });
};

// A picture cell of the table: a picture of the project, written relative to the page.
BasicDesigner.pickTablePicture = function (editor, cell) {
    BasicDesigner.openPictureBrowser(String(cell.value || ""), function (repoPath) {
        cell.setValue(BasicDesigner.pathFromPage(repoPath));
    });
};

BasicDesigner.tableTipOf = function (row) {
    const what = "Add, change, sort and move its rows.";
    if (!Array.isArray(row.value)) return what;
    const count = (row.value.length === 1) ? "1 row" : row.value.length + " rows";
    return count + ". " + what;
};

// What a kind adds to its row. open(view): its editor. leading: "swatch" or "thumb" at the start of the field. icon: the
// button at its end. trailing: "switch" in its place. canScrub: the name is dragged to change the number.
BasicDesigner.PARAM_EDITORS = {
    color: { leading: "swatch", open: BasicDesigner.openParamColor },
    picture: { leading: "thumb", icon: "picture", tipName: "Picture", tipText: "A file of the project, or the code of an SVG.", open: BasicDesigner.openParamPicture },
    flag: { trailing: "switch", open: BasicDesigner.toggleParamFlag },
    number: { icon: "sliders", tipName: "Number", tipText: "A slider and the usual values. (You can also drag its name.)", canScrub: true, open: BasicDesigner.openParamNumber },
    size: { icon: "chevron", tipName: "Size", tipText: "auto, fill... (You can also drag its name, or write 240, 100%, calc(100% - 20px).)", canScrub: true, open: BasicDesigner.openParamSizeList },
    padding: { icon: "sides", tipName: "Padding", tipText: "Its four sides. (You can also write 14, or 14, 10, or 14, 10, 6, 2.)", canScrub: true, open: BasicDesigner.openParamPadding },
    corners: { icon: "corners", tipName: "Corners", tipText: "Its four corners. (You can also write 8, or 12, 0, or 12, 12, 0, 12.)", open: BasicDesigner.openParamCorners },
    gap: { icon: "gap", tipName: "Gap", tipText: "X: between the items of a line, Y: between the lines. (You can also write 8, or 12, 8.)", open: BasicDesigner.openParamGap },
    list: { icon: "chevron", tipName: "Values", tipText: "What it can be.", open: BasicDesigner.openParamOptions },
    font: { icon: "chevron", tipName: "Fonts", tipText: "The fonts of the page and the usual ones.", open: BasicDesigner.openParamFontList },
    easing: { icon: "chevron", tipName: "Curves", tipText: "The curve of a motion.", open: function (view) { BasicDesigner.openParamFixedList(view, BasicDesigner.USUAL_EASINGS); } },
    filter: { icon: "filter", tipName: "Filters", tipText: "The usual filters of a picture.", open: function (view) { BasicDesigner.openParamFixedList(view, BasicDesigner.USUAL_FILTERS); } },
    shadow: { icon: "shadow", tipName: "Shadow", tipText: "Its layers, and how it looks.", open: BasicDesigner.openParamShadow },
    border: { icon: "line", tipName: "Line", tipText: "Its width, its look and its color.", open: BasicDesigner.openParamBorder },
    motion: { icon: "motion", tipName: "Motion", tipText: "What moves, in how long, with which curve.", open: BasicDesigner.openParamMotion },
    gradient: { icon: "gradient", tipName: "Gradient", tipText: "Its direction and its colors.", open: BasicDesigner.openParamGradient },
    align: { icon: "align", tipName: "Place", tipText: "The nine places of the content.", open: BasicDesigner.openParamAlign },
    date: { icon: "calendar", tipName: "Date", tipText: "", open: function (view) { BasicDesigner.openParamDateOrTime(view, "date"); } },
    time: { icon: "clock", tipName: "Time", tipText: "", open: function (view) { BasicDesigner.openParamDateOrTime(view, "time"); } },
    text: { icon: "expand", tipName: "A bigger field", tipText: "More room for a long text.", open: BasicDesigner.openParamText },
    any: { icon: "expand", tipName: "A bigger field", tipText: "A number, a text, yes / no or a list (JSON).", open: BasicDesigner.openParamText },
    function: { icon: "fn", tipName: "The code", tipText: "It is shown, it can not be changed here.", open: BasicDesigner.openParamFunction },
    table: {
        icon: "table",
        tipName: "As a table",
        tipOf: BasicDesigner.tableTipOf,
        open: function (view) { BasicDesigner.openParamTable(view.row); },
    },
};
