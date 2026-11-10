/* Bismillah */

/*

basic.js Designer: what a parameter of a component holds

- Every row of the Parameters view has a kind (color, number, list...), read from its name, its value, its default and
  the comment after it in XxxDefaults: variant: "underline", // "underline", "pill"
- The kind chooses the editor of the row (param-editors.js; a list: JsonEditor.open) and how a typed text becomes a value.
  WHY a guess is enough: the text field of a row always stays, so a wrong kind only gives a useless button.
- Nothing here draws. The texts of a shadow, a line, a motion and a gradient are read and written here.

Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// *** THE COMMENTS OF THE CODE:

BasicDesigner.paramNotes = {}; // component name -> { paths: { "style.box.color": comment }, lines, parentName }
BasicDesigner.NO_NOTES = { paths: {}, lines: [], parentName: "" };
BasicDesigner.notesNotFoundAt = {}; // component name -> how many files were read when its file was not among them

// A line of code -> { code, comment }: the // that is not in a text.
BasicDesigner.splitComment = function (line) {
    let quote = "";
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quote) {
            if (char === "\\") i++;
            else if (char === quote) quote = "";
            continue;
        }
        if (char === '"' || char === "'" || char === "`") quote = char;
        else if (char === "/" && line[i + 1] === "/") return { code: line.slice(0, i), comment: line.slice(i + 2).trim() };
    }
    return { code: line, comment: "" };
};

// How many brackets a line of code opens (less the ones it closes). The texts do not count.
BasicDesigner.openBrackets = function (code) {
    const plain = code.replace(/"(\\.|[^"\\])*"|'(\\.|[^'\\])*'|`(\\.|[^`\\])*`/g, '""');
    const opened = (plain.match(/[{[(]/g) || []).length;
    const closed = (plain.match(/[}\])]/g) || []).length;
    return opened - closed;
};

// The comment of every default of XxxDefaults: "style.box.color" -> its text. A line of the object at a time, as the
// files are written. WHY by lines: a wrong reading of a strange line costs one hint, not the Parameters view.
BasicDesigner.readDefaultsNotes = function (lines, name) {
    const notes = {};
    const start = lines.findIndex(function (line) { return line.indexOf("const " + name + "Defaults") === 0; });
    if (start === -1) return notes;
    const levels = [{ key: "", open: 1 }];
    const pathOf = function (key) {
        return levels.slice(1).map(function (level) { return level.key; }).concat(key).join(".");
    };
    for (let i = start + 1; i < lines.length && levels.length; i++) {
        const parts = BasicDesigner.splitComment(lines[i]);
        const open = BasicDesigner.openBrackets(parts.code);
        const match = parts.code.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
        if (match) notes[pathOf(match[1])] = parts.comment;
        if (match && open > 0) {
            levels.push({ key: match[1], open: open });
            continue;
        }
        let closing = (open < 0) ? -open : 0;
        while (closing > 0 && levels.length) {
            const top = levels[levels.length - 1];
            const closedHere = Math.min(closing, top.open);
            top.open -= closedHere;
            closing -= closedHere;
            if (top.open === 0) levels.pop();
        }
    }
    return notes;
};

BasicDesigner.notesOfComponent = function (name) {
    const known = BasicDesigner.paramNotes[name];
    if (known) return known;
    const sources = BasicDesigner.state.sources;
    const sourceCount = Object.keys(sources).length;
    // WHY: this runs for every row at every change: the files are searched again only when a new one came.
    if (BasicDesigner.notesNotFoundAt[name] === sourceCount) return BasicDesigner.NO_NOTES;
    const mark = "const " + name + "Defaults";
    const url = Object.keys(sources).find(function (key) {
        return sources[key].some(function (line) { return line.indexOf(mark) === 0; });
    });
    if (!url) {
        BasicDesigner.notesNotFoundAt[name] = sourceCount;
        return BasicDesigner.NO_NOTES;
    }
    const lines = sources[url];
    const extended = lines.join("\n").match(/startExtendedObject\(\s*([A-Za-z_$][\w$]*)/);
    const notes = { paths: BasicDesigner.readDefaultsNotes(lines, name), lines: lines, parentName: (extended) ? extended[1] : "" };
    BasicDesigner.paramNotes[name] = notes;
    return notes;
};

// The comment of a parameter, or "" (a component that extends another one: the comment of its parent).
// WHY not a "WHY:" comment: it tells a developer why the code is so, it does not say what the value can be.
BasicDesigner.noteOfParam = function (name, pathText) {
    const notes = BasicDesigner.notesOfComponent(name);
    const own = notes.paths[pathText];
    const isForDevelopers = /^WHY\b/.test(String(own || ""));
    if (own && !isForDevelopers) return own;
    if (!notes.parentName || notes.parentName === name) return "";
    return BasicDesigner.noteOfParam(notes.parentName, pathText);
};

// The values a comment lists: "underline", "pill" -> ["underline", "pill"]; 1, 0, "auto" -> [1, 0, "auto"].
// WHY cut at "Ex:": what follows is an example, not a choice. WHY without the brackets: they explain (a tab can set its own "closable").
BasicDesigner.optionsOfNote = function (note) {
    const text = String(note || "").split(/\bEx:/)[0].replace(/\([^()]*\)/g, " ").replace(/\d\s*-\s*\d/g, " ");
    const options = [];
    const add = function (value) {
        if (options.indexOf(value) === -1) options.push(value);
    };
    const pattern = /"([^"]*)"|(?:^|[\s,(])(-?\d+(?:\.\d+)?)(?=\s*(?:,|:|\bor\b|\||$))/g;
    let match = pattern.exec(text);
    while (match) {
        if (match[1] !== undefined && /^[\w -]*$/.test(match[1])) add(match[1]);
        if (match[2] !== undefined) add(Number(match[2]));
        match = pattern.exec(text);
    }
    return options;
};

// The keys in { a, b: 1, c: "x" | "y" } -> [{ key, options }]. The objects inside it are left out.
BasicDesigner.keysOfShape = function (text) {
    let inner = String(text);
    let previous = "";
    while (inner !== previous) {
        previous = inner;
        inner = inner.replace(/\{[^{}]*\}/g, "");
    }
    const keys = [];
    inner.split(",").forEach(function (part) {
        const match = part.match(/^\s*([A-Za-z_$][\w$]*)\s*(?:\([^)]*\)\s*)?(?::(.*))?$/);
        if (!match) return;
        keys.push({ key: match[1], note: (match[2] || "").trim(), options: BasicDesigner.optionsOfNote(match[2] || "") });
    });
    return keys;
};

// The first { ... } of a text, with the objects inside it: "[{ a, b: { c } }]" -> "a, b: { c }". "" when there is none.
BasicDesigner.firstShapeOf = function (text) {
    const value = String(text);
    const start = value.indexOf("{");
    if (start === -1) return "";
    let depth = 0;
    for (let i = start; i < value.length; i++) {
        if (value[i] === "{") depth++;
        if (value[i] === "}") depth--;
        if (depth === 0) return value.slice(start + 1, i);
    }
    return value.slice(start + 1);
};

// The block of the header of a component: "AN ITEM: { key, text }" or "A COLUMN:" and an object of lines with their
// comments. name: "ITEM", "A COLUMN"... -> [{ key, note, options }]
BasicDesigner.keysOfHeaderBlock = function (lines, name) {
    const word = name.replace(/^(A|AN)\s+/i, "");
    const mark = new RegExp("^(A |AN )?" + word + ":");
    const start = lines.findIndex(function (line) { return mark.test(line); });
    if (start === -1) return [];
    const shape = BasicDesigner.firstShapeOf(lines[start]);
    if (shape) return BasicDesigner.keysOfShape(shape);
    const keys = [];
    for (let i = start + 1; i < lines.length; i++) {
        const text = lines[i].trim();
        if (text === "}" || text === "") {
            if (keys.length) break;
            continue;
        }
        const parts = BasicDesigner.splitComment(lines[i]);
        const match = parts.code.match(/^\s*([A-Za-z_$][\w$]*)\s*:/);
        if (match) keys.push({ key: match[1], note: parts.comment, options: BasicDesigner.optionsOfNote(parts.comment) });
    }
    return keys;
};

// What the rows of a list hold, from its comment: [{ key, text, iconFile }] or [ITEM] (See AN ITEM above).
BasicDesigner.columnsOfNote = function (name, note) {
    const text = String(note || "");
    const notes = BasicDesigner.notesOfComponent(name);
    const named = text.match(/[Ss]ee\s+"?((?:A |AN )?[A-Z][A-Z ]*[A-Z])"?\s+above/);
    const shape = BasicDesigner.firstShapeOf(text);
    let keys = [];
    if (shape) keys = BasicDesigner.keysOfShape(shape);
    else if (named) keys = BasicDesigner.keysOfHeaderBlock(notes.lines, named[1]);
    // WHY: a function can not be written in a table (it stays when the page gave one).
    return keys.filter(function (column) { return !/^(on[A-Z]|create[A-Z].*View$)/.test(column.key); });
};

// *** THE KIND OF A PARAMETER:

BasicDesigner.COLOR_TEXT = /^(#[0-9a-f]{3,8}|(rgb|hsl)a?\(.*\)|var\(--.*\)|color-mix\(.*\))$/i;
BasicDesigner.COLOR_KEY = /(^|[a-z_])color$/i;
BasicDesigner.PICTURE_TEXT = /^(data:image\/|<svg\b)|\.(png|jpe?g|gif|svg|webp|avif|ico)(\?.*)?$/i;
BasicDesigner.PICTURE_KEY = /(^|[a-z_])(file|src)$/i;
BasicDesigner.BORDER_KEY = /^border(Top|Right|Bottom|Left)(Style)?$|^borderStyle$|[a-z]Border(Top|Right|Bottom|Left)$/;
BasicDesigner.BORDER_TEXT = /^$|^none$|\b(solid|dashed|dotted|double)\b/;
BasicDesigner.SIZE_KEY = /^(width|height|left|top|right|bottom)$|[a-z](Width|Height)$/;
BasicDesigner.PADDING_KEY = /(^|[a-z_])(padding|margin)$/i; // [8, 4] of these names
BasicDesigner.CORNERS_KEY = /(^|[a-z_])round$/i; // [12, 0] of these names: the corners of a round (basic.js v26.11.07)
BasicDesigner.GAP_KEY = /(^|[a-z_])gap$/i; // [12, 8] of these names: x and y (basic.js v26.11.07)
BasicDesigner.SIDES_KEY = /^padding$/; // 8 or [8, 4]. WHY not rightPadding: 60: one side, it stays one number.
BasicDesigner.ALIGN_TEXT = /^$|^(left|center|right|top|bottom|middle)( (left|center|right|top|bottom|middle))?$/;
BasicDesigner.SIDE_ALIGN_KEY = /[a-z]Align$/;
BasicDesigner.MOTION_KEY = /(^|[a-z])(motion|transition)$/i;
BasicDesigner.EASING_KEY = /(^|[a-z])(ease|easing)$/i;
BasicDesigner.FILTER_KEY = /(^|[a-z])filter$/i;
BasicDesigner.SHADOW_KEY = /(^|[a-z])shadow$/i;
BasicDesigner.FONT_KEY = /(^|[a-z])fontFamily$/i;
BasicDesigner.TONE_KEY = /(^|[a-z])tone$/i;
BasicDesigner.STYLE_NAME_KEY = /(^|[a-z])styleName$/i;
BasicDesigner.DATE_TEXT = /^\d{4}-\d{2}-\d{2}/;
BasicDesigner.TIME_TEXT = /^\d{1,2}:\d{2}/;
BasicDesigner.GRADIENT_TEXT = /^linear-gradient\(/i;
BasicDesigner.LONG_TEXT_KEY = /(html|markdown|svg|code)(text)?$/i;

// A key that says "on or off". WHY a list too: many of them have no word in common (animated, bold, loop...).
BasicDesigner.FLAG_START = /^(is|has|can|use|show|allow|must|auto|create|invert|enable|hide|keep|need|close|clear|open)[A-Z_]/;
BasicDesigner.NUMBER_END = /(time|delay|duration|size|gap|count|rotate|round|space|padding|opacity|angle|index|step|length|margin|offset|scale)$/i;
BasicDesigner.FLAG_KEYS = ["enabled", "disabled", "animated", "visible", "bold", "italic", "uppercase", "lowercase", "wrap", "multiple", "checked",
    "readOnly", "opened", "searchable", "editable", "closable", "removable", "vertical", "horizontal", "inline", "loop", "swipe", "keyboard",
    "dots", "arrows", "stacked", "stripes", "secondStripes", "indeterminate", "waiting", "busy", "ripple", "fade", "mask", "exclusive", "clearable",
    "toolbar", "lazy", "interactive", "clipContent", "hug", "fit", "minimal", "directory", "roundCap", "joinEdge", "panels", "addButton", "fullWidth",
    "wrapLabel", "wrapLines", "autoHeight", "autoWidth", "titleBold", "titleUppercase", "labelBoldFont", "neverHide", "invert", "invertColor",
    "invertIcon", "coverField", "darkTrack", "hoverEffect", "spellCheck", "typeAhead", "preventPageDrop", "trimOnClick", "currentClickable",
    "clickableItems", "remotePictures", "wheelZoom", "wheelScroll", "pageScroll", "panelOpened", "holdToRepeat", "beginAtZero", "tableView",
    "selected", "highlightTitle", "highlightLine", "showValueLabel", "stacked", "headGrow", "valueBubble", "pauseOnHover", "scrollToSelected",
    "aroundLabel", "beforeValue", "enlargeToFit", "doubleInputAlwaysHorizontal", "minimalButton", "fitLineCount", "toggleOnDoubleClick", "dotForOne"];

BasicDesigner.isOnOffValue = function (value) {
    return value === 0 || value === 1 || value === true || value === false || value === null || value === undefined;
};

BasicDesigner.isFlagParam = function (key, value, note) {
    if (typeof value === "boolean") return true;
    if (!BasicDesigner.isOnOffValue(value)) return false;
    if (BasicDesigner.FLAG_KEYS.indexOf(key) !== -1) return true;
    if (BasicDesigner.NUMBER_END.test(key)) return false;
    if (BasicDesigner.FLAG_START.test(key)) return true;
    // WHY the start of the comment: "0: Sunday, 1: Monday" is a choice of numbers, "1: Tabs are stacked" is a switch.
    const text = String(note || "");
    return /(^|[.;]\s*)1:/.test(text) || /^\s*(1,\s*0|0,\s*1)\s*$/.test(text);
};

// The style packages of the component the name of a parameter points to: searchStyleName -> SearchInput.styles.
BasicDesigner.STYLE_NAME_COMPONENTS = {
    search: "SearchInput", searchInput: "SearchInput", menu: "ContextMenu", field: "TextField", input: "TextField", button: "SmartButton",
    code: "CodeEditor", tabs: "Tabs", checkBox: "CheckBox", itemList: "ItemList", sidePanel: "SidePanel", stepper: "Stepper", selectColor: "ColorPicker",
};

BasicDesigner.stylePackagesOf = function (key, componentName) {
    const rt = BasicDesigner.state.rt;
    if (!rt) return [];
    const prefix = key.replace(BasicDesigner.STYLE_NAME_KEY, "$1");
    const owner = (key === "styleName") ? componentName : BasicDesigner.STYLE_NAME_COMPONENTS[prefix];
    const packages = (owner) ? rt.findStyles(owner) : null;
    return (packages) ? Object.keys(packages) : [];
};

BasicDesigner.tonesOfKit = function () {
    const win = BasicDesigner.state.win;
    if (!win) return [];
    let tones = null;
    try { tones = win.eval("typeof SmartButton !== 'undefined' ? SmartButton.tones : null"); } catch (error) { }
    return (tones) ? Object.keys(tones) : [];
};

// What the options of a menu say: [value, ...] -> [{ value, text }]. A value that is not in the list is added: it is what
// the field holds now.
BasicDesigner.optionItems = function (values, current) {
    const list = values.slice();
    const isTextNow = (typeof current === "string" && current !== "") || typeof current === "number";
    if (isTextNow && list.indexOf(current) === -1) list.unshift(current);
    return list.map(function (value) {
        return { value: value, text: (value === "") ? '""  (empty)' : String(value) };
    });
};

// The comment of a list or an object starts with its shape: [12, 19, 7] or { labels, datasets }.
BasicDesigner.isListNote = function (note) {
    return /^\s*[[{]/.test(String(note || ""));
};

// The kind of a value: { name, options? }. name: function, readonly, table, padding, corners, gap, color, gradient,
// picture, flag, font, shadow, border, motion, easing, filter, align, size, number, list, date, time, text, any.
BasicDesigner.paramKindOf = function (key, value, def, note, componentName) {

    const isNotGiven = (value === null || value === undefined);
    if (typeof value === "function" || typeof def === "function" || /^on[A-Z]/.test(key)) return { name: "function" };
    if (isNotGiven && /^\s*function\b/.test(String(note || ""))) return { name: "function" };
    // WHY: labels: null, // ["Jan", "Feb"] is a list that is empty now; its comment is not a choice of values.
    if (isNotGiven && BasicDesigner.isListNote(note)) return { name: "table" };
    if (Array.isArray(value)) {
        const isSides = (value.length >= 2 && value.length <= 4 && value.every(function (v) { return typeof v === "number"; }));
        if (isSides && BasicDesigner.PADDING_KEY.test(key)) return { name: "padding" };
        if (isSides && BasicDesigner.CORNERS_KEY.test(key)) return { name: "corners" };
        if (isSides && value.length === 2 && BasicDesigner.GAP_KEY.test(key)) return { name: "gap" };
        return { name: "table" };
    }
    if (value !== null && typeof value === "object") return { name: (BasicDesigner.isPlain(value)) ? "table" : "readonly" };

    const text = (typeof value === "string") ? value : "";
    const isEmpty = (value === null || value === undefined || value === "");
    const isCssColor = (window.CSS && CSS.supports("color", text.trim()));

    if (BasicDesigner.GRADIENT_TEXT.test(text) || (/gradient$/i.test(key) && isEmpty)) return { name: "gradient" };
    if (BasicDesigner.COLOR_TEXT.test(text.trim())) return { name: "color" };
    if (BasicDesigner.COLOR_KEY.test(key) && (isEmpty || isCssColor)) return { name: "color" };
    if (key === "background" && (isEmpty || isCssColor)) return { name: "color" };
    if (BasicDesigner.PICTURE_TEXT.test(text)) return { name: "picture" };
    if (BasicDesigner.PICTURE_KEY.test(key) && typeof value !== "number") return { name: "picture" };
    if (BasicDesigner.SIDES_KEY.test(key) && (typeof value === "number" || isEmpty)) return { name: "padding" };

    if (BasicDesigner.STYLE_NAME_KEY.test(key)) {
        const packages = BasicDesigner.stylePackagesOf(key, componentName);
        const named = (packages.length) ? packages : BasicDesigner.optionsOfNote(note);
        if (named.length) return { name: "list", options: BasicDesigner.optionItems(named, value) };
    }
    if (BasicDesigner.TONE_KEY.test(key)) {
        const tones = BasicDesigner.tonesOfKit();
        if (tones.length) return { name: "list", options: BasicDesigner.optionItems([""].concat(tones), value) };
    }
    if (BasicDesigner.FONT_KEY.test(key) && typeof value !== "number") return { name: "font" };
    if (BasicDesigner.SHADOW_KEY.test(key) && typeof value !== "number") return { name: "shadow" };
    if (BasicDesigner.BORDER_KEY.test(key) && typeof value !== "number" && BasicDesigner.BORDER_TEXT.test(text)) return { name: "border" };
    if (BasicDesigner.MOTION_KEY.test(key) && typeof value !== "number" && /^$|\d\s*m?s\b/.test(text)) return { name: "motion" };
    if (BasicDesigner.EASING_KEY.test(key) && typeof value !== "number") return { name: "easing" };
    if (BasicDesigner.FILTER_KEY.test(key) && typeof value !== "number") return { name: "filter" };
    if (key === "align" && BasicDesigner.ALIGN_TEXT.test(text) && typeof value !== "number") return { name: "align" };
    if (BasicDesigner.SIDE_ALIGN_KEY.test(key) && BasicDesigner.ALIGN_TEXT.test(text) && typeof value !== "number") {
        return { name: "list", options: BasicDesigner.optionItems(["left", "center", "right"], value) };
    }
    if (/date$/i.test(key) && (isEmpty || BasicDesigner.DATE_TEXT.test(text))) return { name: "date" };
    if (/time$/i.test(key) && (isEmpty || BasicDesigner.TIME_TEXT.test(text))) return { name: "time" };

    // WHY the words first: 1, 0, "auto" is a choice, also when the value now is a number of a switch.
    const options = BasicDesigner.optionsOfNote(note);
    const isListed = (isEmpty && options.length >= 2) || options.indexOf(value) !== -1;
    const hasWords = options.some(function (option) { return typeof option === "string" && /[a-z]/i.test(option); });
    if (hasWords && options.length >= 2 && isListed) return { name: "list", options: BasicDesigner.optionItems(options, value) };
    if (BasicDesigner.isFlagParam(key, value, note)) return { name: "flag" };
    if (options.length >= 2 && isListed) return { name: "list", options: BasicDesigner.optionItems(options, value) };

    // WHY the check of the text: a caption of a list of texts can have the same name (texts: { width: "Width" }).
    const isSizeText = (typeof value !== "string" || value === "" || CSS.supports("width", value));
    if (BasicDesigner.SIZE_KEY.test(key) && isSizeText) return { name: "size" };
    if (typeof value === "number") return { name: "number" };
    if (typeof value === "string") return { name: "text" };
    return { name: "any" };

};

// *** A TYPED TEXT -> A VALUE: every kind reads its text here. A wrong text throws, its message goes to the status bar.

BasicDesigner.numberOfText = function (text) {
    const trimmed = String(text).trim();
    if (trimmed === "" || isNaN(Number(trimmed))) return null;
    return Number(trimmed);
};

BasicDesigner.PARAM_TEXT_READERS = {
    color: function (text) {
        const trimmed = String(text).trim();
        if (trimmed === "" || CSS.supports("color", trimmed)) return trimmed;
        throw new Error("not a color. Ex: #3871E0, rgba(0, 0, 0, 0.5), indianred");
    },
    number: function (text) {
        const number = BasicDesigner.numberOfText(text);
        if (number !== null) return number;
        const trimmed = String(text).trim();
        if (trimmed === "null") return null;
        // WHY: many numbers of the kit take a size too (rowHeight, tabWidth: "auto").
        if (trimmed && CSS.supports("width", trimmed)) return trimmed;
        throw new Error("a number is needed");
    },
    size: function (text) {
        const number = BasicDesigner.numberOfText(text);
        if (number !== null) return number;
        if (String(text).trim() === "null") return null;
        const size = BasicDesigner.parseSizeText(text);
        if (size === undefined) throw new Error("not a size. Ex: 240, 100%, calc(100% - 20px), auto");
        return size;
    },
    padding: function (text) {
        // WHY the brackets: the field shows a list as [14,10]; it is written again in the same way.
        const padding = BasicDesigner.parsePaddingText(String(text).replace(/[[\]]/g, " "));
        if (padding === undefined) throw new Error("not a padding. Ex: 14, or 14, 10 (x, y), or 14, 10, 6, 2 (left, top, right, bottom)");
        if (typeof padding === "number") return padding;
        return padding.split(",").map(Number);
    },
    corners: function (text) {
        const round = BasicDesigner.parseListText(String(text).replace(/[[\]]/g, " "), "round");
        if (round === undefined) throw new Error("not a round. Ex: 8, or 12, 0 (top, bottom), or 12, 12, 0, 12 (top left, top right, bottom right, bottom left)");
        if (typeof round === "number") return round;
        return round.split(",").map(Number);
    },
    gap: function (text) {
        const gap = BasicDesigner.parseListText(String(text).replace(/[[\]]/g, " "), "gap");
        if (gap === undefined) throw new Error("not a gap. Ex: 8, or 12, 8 (x: in a line, y: between the lines)");
        if (typeof gap === "number") return gap;
        return gap.split(",").map(Number);
    },
    flag: function (text, row) {
        const word = String(text).trim().toLowerCase();
        const isBoolean = (typeof row.value === "boolean");
        if (word === "null") return null;
        if (word === "1" || word === "true" || word === "on" || word === "yes") return (isBoolean) ? true : 1;
        if (word === "0" || word === "false" || word === "off" || word === "no" || word === "") return (isBoolean) ? false : 0;
        const number = BasicDesigner.numberOfText(text);
        if (number !== null) return number;
        throw new Error("1 or 0 is needed");
    },
    list: function (text, row) {
        const number = BasicDesigner.numberOfText(text);
        const isNumberOption = (row.kind.options || []).some(function (option) { return option.value === number; });
        if (number !== null && (isNumberOption || typeof row.value === "number")) return number;
        if (String(text).trim() === "null" && row.value === null) return null;
        return String(text);
    },
    table: function (text, row) {
        return BasicDesigner.keepFunctions(JSON.parse(text), row.value);
    },
    any: function (text) {
        try { return JSON.parse(text); } catch (error) { return String(text); }
    },
    date: function (text) {
        return String(text).trim() || null;
    },
    time: function (text) {
        return String(text).trim() || null;
    },
};

// A text the row's own kind can not read keeps its old kind's rule: a number stays a number, a text stays a text.
BasicDesigner.valueOfParamText = function (text, row) {
    const reader = BasicDesigner.PARAM_TEXT_READERS[row.kind.name];
    if (reader) return reader(text, row);
    return BasicDesigner.parseParam(text, row.value);
};

// The functions of the old value stay in a new value of a list or an object.
// WHY: a table and a JSON text can not hold a function; the callbacks of the rows (onClick...) must not be lost.
// WHY of JsonEditor: one copy, the one of the table window (comp/json-editor.js, loaded before the designer).
BasicDesigner.keepFunctions = JsonEditor.keepFunctions;

// *** THE TEXTS OF CSS: read a text into parts, write the parts back.

// "a(1, 2), b" -> ["a(1, 2)", "b"]: a comma that is not in brackets.
BasicDesigner.splitAtCommas = function (text) {
    const parts = [];
    let depth = 0;
    let current = "";
    String(text).split("").forEach(function (char) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (char === "," && depth === 0) {
            parts.push(current.trim());
            current = "";
            return;
        }
        current += char;
    });
    if (current.trim()) parts.push(current.trim());
    return parts;
};

// "1px solid red" -> ["1px", "solid", "red"]: a space that is not in brackets.
BasicDesigner.splitAtSpaces = function (text) {
    const parts = [];
    let depth = 0;
    let current = "";
    String(text).split("").forEach(function (char) {
        if (char === "(") depth++;
        if (char === ")") depth--;
        if (/\s/.test(char) && depth === 0) {
            if (current) parts.push(current);
            current = "";
            return;
        }
        current += char;
    });
    if (current) parts.push(current);
    return parts;
};

BasicDesigner.isLengthWord = function (word) {
    return /^-?\d*\.?\d+(px|em|rem|%)?$/.test(word);
};

BasicDesigner.pixelsOfWord = function (word) {
    return parseFloat(word) || 0;
};

// SHADOW: "0px 4px 12px rgba(0, 0, 0, 0.18), inset 0 -3px 0 red" -> [{ x, y, blur, spread, color, inset }]
BasicDesigner.readShadow = function (text) {
    const value = String(text || "").trim();
    if (!value || value === "none") return [];
    return BasicDesigner.splitAtCommas(value).map(function (part) {
        const words = BasicDesigner.splitAtSpaces(part);
        const lengths = words.filter(BasicDesigner.isLengthWord).map(BasicDesigner.pixelsOfWord);
        const color = words.find(function (word) { return !BasicDesigner.isLengthWord(word) && word !== "inset"; });
        return {
            x: lengths[0] || 0,
            y: lengths[1] || 0,
            blur: lengths[2] || 0,
            spread: lengths[3] || 0,
            color: color || "rgba(0, 0, 0, 0.2)",
            inset: words.indexOf("inset") !== -1,
        };
    });
};

BasicDesigner.writeShadow = function (layers) {
    return layers.map(function (layer) {
        const words = [layer.x + "px", layer.y + "px", layer.blur + "px"];
        if (layer.spread) words.push(layer.spread + "px");
        words.push(layer.color);
        if (layer.inset) words.unshift("inset");
        return words.join(" ");
    }).join(", ");
};

// LINE: "1px solid rgba(0, 0, 0, 0.2)" -> { width, style, color }
BasicDesigner.LINE_STYLES = ["solid", "dashed", "dotted", "double"];

BasicDesigner.readLine = function (text) {
    const line = { width: 1, style: "solid", color: "rgba(0, 0, 0, 0.2)", isNone: false };
    const value = String(text || "").trim();
    if (!value || value === "none") {
        line.isNone = true;
        return line;
    }
    BasicDesigner.splitAtSpaces(value).forEach(function (word) {
        if (BasicDesigner.isLengthWord(word)) line.width = BasicDesigner.pixelsOfWord(word);
        else if (BasicDesigner.LINE_STYLES.indexOf(word) !== -1) line.style = word;
        else line.color = word;
    });
    return line;
};

BasicDesigner.writeLine = function (line) {
    if (line.isNone) return "none";
    return line.width + "px " + line.style + " " + line.color;
};

// MOTION: "background-color 0.2s, left 0.3s ease" -> [{ property, seconds, easing }]. "0.25s": no property (all of them).
BasicDesigner.isTimeWord = function (word) {
    return /^-?\d*\.?\d+m?s$/.test(word);
};

BasicDesigner.secondsOfWord = function (word) {
    const number = parseFloat(word) || 0;
    return (/ms$/.test(word)) ? number / 1000 : number;
};

BasicDesigner.readMotion = function (text) {
    const value = String(text || "").trim();
    if (!value || value === "none") return [];
    return BasicDesigner.splitAtCommas(value).map(function (part) {
        const words = BasicDesigner.splitAtSpaces(part);
        const times = words.filter(BasicDesigner.isTimeWord);
        const others = words.filter(function (word) { return !BasicDesigner.isTimeWord(word); });
        const isEasing = function (word) { return /^(ease|linear|step|cubic-bezier)/.test(word); };
        return {
            property: others.find(function (word) { return !isEasing(word); }) || "",
            seconds: (times[0]) ? BasicDesigner.secondsOfWord(times[0]) : 0.2,
            delay: (times[1]) ? times[1] : "",
            easing: others.find(isEasing) || "",
        };
    });
};

BasicDesigner.writeMotion = function (layers) {
    return layers.map(function (layer) {
        const words = [];
        if (layer.property) words.push(layer.property);
        words.push(layer.seconds + "s");
        if (layer.easing) words.push(layer.easing);
        if (layer.delay) words.push(layer.delay);
        return words.join(" ");
    }).join(", ");
};

// GRADIENT: "linear-gradient(to right, #111, #222 40%)" -> { direction, stops: [{ color, place }] }. null: another form.
BasicDesigner.readGradient = function (text) {
    const value = String(text || "").trim();
    if (!value) return { direction: "to bottom", stops: [{ color: "#FFFFFF", place: "" }, { color: "#000000", place: "" }] };
    const match = value.match(/^linear-gradient\((.*)\)$/i);
    if (!match) return null;
    const parts = BasicDesigner.splitAtCommas(match[1]);
    const isDirection = /^(to\s|-?\d*\.?\d+(deg|rad|turn)$)/.test(parts[0]);
    const direction = (isDirection) ? parts.shift() : "to bottom";
    const stops = parts.map(function (part) {
        const words = BasicDesigner.splitAtSpaces(part);
        return { color: words[0], place: words.slice(1).join(" ") };
    });
    return { direction: direction, stops: stops };
};

BasicDesigner.writeGradient = function (gradient) {
    const stops = gradient.stops.map(function (stop) {
        return (stop.place) ? stop.color + " " + stop.place : stop.color;
    });
    return "linear-gradient(" + [gradient.direction].concat(stops).join(", ") + ")";
};

// PADDING: 8, [8, 4], [1, 2, 3, 4] (left, top, right, bottom: the order of basic.js) -> { left, top, right, bottom }
BasicDesigner.readPaddingSides = function (value) {
    if (Array.isArray(value) && value.length === 4) return { left: value[0], top: value[1], right: value[2], bottom: value[3] };
    if (Array.isArray(value) && value.length >= 2) return { left: value[0], top: value[1], right: value[0], bottom: value[1] };
    const all = (typeof value === "number") ? value : 0;
    return { left: all, top: all, right: all, bottom: all };
};

// The shortest value that says the same.
BasicDesigner.writePaddingSides = function (sides) {
    const isSameX = (sides.left === sides.right);
    const isSameY = (sides.top === sides.bottom);
    if (isSameX && isSameY && sides.left === sides.top) return sides.left;
    if (isSameX && isSameY) return [sides.left, sides.top];
    return [sides.left, sides.top, sides.right, sides.bottom];
};

// CORNERS of a round: 8, [12, 0] (top, bottom), [12, 12, 0, 4] (top left, top right, bottom right, bottom left: the order
// of basic.js) -> { topLeft, topRight, bottomRight, bottomLeft }. WHY [x, y, z] -> [x, y]: basic.js reads three as two.
BasicDesigner.CORNER_NAMES = ["topLeft", "topRight", "bottomRight", "bottomLeft"];

BasicDesigner.readCorners = function (value) {
    if (Array.isArray(value) && value.length === 4) return { topLeft: value[0], topRight: value[1], bottomRight: value[2], bottomLeft: value[3] };
    if (Array.isArray(value) && value.length >= 2) return { topLeft: value[0], topRight: value[0], bottomRight: value[1], bottomLeft: value[1] };
    const first = (Array.isArray(value)) ? value[0] : value;
    const all = (typeof first === "number") ? first : 0;
    return { topLeft: all, topRight: all, bottomRight: all, bottomLeft: all };
};

// The shortest value that says the same.
BasicDesigner.writeCorners = function (corners) {
    const isTopAndBottom = (corners.topLeft === corners.topRight && corners.bottomRight === corners.bottomLeft);
    if (isTopAndBottom && corners.topLeft === corners.bottomRight) return corners.topLeft;
    if (isTopAndBottom) return [corners.topLeft, corners.bottomRight];
    return [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft];
};

// GAP: 8 (or "8px": basic.js reads a number gap as its text), [12, 8] (x: between the items of a line, y: between the
// lines) -> { x, y }
BasicDesigner.readGap = function (value) {
    if (Array.isArray(value) && value.length >= 2) return { x: value[0], y: value[1] };
    const first = (Array.isArray(value)) ? value[0] : value;
    const all = parseFloat(first) || 0;
    return { x: all, y: all };
};

BasicDesigner.writeGap = function (gap) {
    return (gap.x === gap.y) ? gap.x : [gap.x, gap.y];
};

// PICTURE: an SVG text of a data address, or "" -> the text of the SVG. <svg ...> -> the data address.
BasicDesigner.svgOfPicture = function (value) {
    const text = String(value || "").trim();
    if (/^<svg\b/i.test(text)) return text;
    const match = text.match(/^data:image\/svg\+xml(;utf8)?,(.*)$/i);
    if (!match) return "";
    try { return decodeURIComponent(match[2]); } catch (error) { return ""; }
};

BasicDesigner.pictureOfSvg = function (svgText) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(String(svgText).trim());
};

// A picture value -> the address to show it in the designer: a path of a parameter is relative to the page.
BasicDesigner.pictureAddress = function (value) {
    const text = String(value || "").trim();
    if (!text) return "";
    if (/^<svg\b/i.test(text)) return BasicDesigner.pictureOfSvg(text);
    if (/^(data:|https?:|blob:)/i.test(text)) return text;
    const s = BasicDesigner.state;
    return new URL(text, new URL(s.pagePath, s.rootUrl)).href;
};

// A color value the designer can paint: a token of the page is read from the page.
BasicDesigner.paintableColor = function (value) {
    const text = String(value || "").trim();
    const match = text.match(/^var\((--[\w-]+)/);
    const win = BasicDesigner.state.win;
    if (!match || !win) return text;
    return win.getComputedStyle(win.document.documentElement).getPropertyValue(match[1]).trim() || text;
};
