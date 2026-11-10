/* Bismillah */

/*

CodeEditor - v26.11

UI COMPONENT
- A text editor for code: line numbers, colors by language, the line of the cursor. A long line does not wrap: the
  view scrolls sideways.
- Languages: "python", "javascript", "json", "html", "css", "sql", "bash", "text". CodeEditor.languages takes your own.
- The typing is the <textarea> of the browser: selection, copy, paste, undo and the input of every language work as
  they do everywhere. The colors are drawn behind it, only for the lines that are seen, so a file of 100000 lines stays
  fast.
- Keys: Tab and Shift + Tab indent (also many lines), Enter keeps the indent of its line (one more after ":" in Python,
  after "{", "[" or "(" in the others), Backspace in the indent goes back one level, Ctrl (or Cmd) + / comments the
  lines out. Undo takes all of them back. Escape, then Tab leaves the editor (for a keyboard user).
- changeDelay (ms): onChange waits for the typing to rest (for a big text sent to another place).
- Style packages: "light" (default), "dark". Select with styleName (CodeEditor.styles), or later with setTheme().

USAGE:
const editor = CodeEditor({
    width: 600, height: 400,
    language: "python",
    value: "def hello():\n    print('Hello')\n",
    onChange: function (self) { println(self.value.length); },
    onCursorChange: function (self) { println(self.cursorLine + ":" + self.cursorColumn); },
});
editor.setValue("x = 1\n");        // onChange is called; setValue(text, 1): silent. Undo starts again.
editor.getValue();                 // the text now (self.value too)
editor.insertText("print(x)");     // at the cursor; undo takes it back
editor.getSelectedText();
editor.setLanguage("javascript");
editor.setReadOnly(1);
editor.setShowLineNumbers(0);
editor.setTabSize(2);
editor.goToLine(120);
editor.focusEditor();
editor.setTheme("dark");
CodeEditor({ styleName: "dark", placeholder: "Write here", changeDelay: 150 });

A NEW LANGUAGE:
CodeEditor.languages.toml = { lineComment: "#", strings: ['"""', '"', "'"], multiLineStrings: ['"""'], keywords: ["true", "false"], propertyWords: 1 };
Its keys: lineComment, blockComment: [start, end], strings (the longest first), multiLineStrings, keywords, builtins,
ignoreCase: 1, callWords: 1 (a word before "(" is a function), propertyWords: 1 (a word before ":" is a property),
propertyStrings: 1 (a string before ":" is a property), decorators: "@", variables: "$", indentAfter: ":" (the letters
at the end of a line that open one more level). tokenize: function (text, state): your own, instead of all of them:
returns { parts: [[kind, text], ...], state }. kind: "keyword", "string", "number", "comment", "builtin", "function",
"property", "tag", "attribute", "variable", "" (plain). state goes to the next line.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const CodeEditorDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: 320,
    value: "", // The text
    language: "text", // A name of CodeEditor.languages
    tabSize: 4, // The spaces of one level
    readOnly: 0,
    showLineNumbers: 1,
    placeholder: "",
    changeDelay: 0, // ms: onChange waits for the typing to rest
    ariaLabel: "Code",
    onChange: function (self) { }, // self.value changed. (Not at create time, not with silent: 1)
    onCursorChange: function (self) { }, // self.cursorLine, self.cursorColumn (from 1)
    styleName: "light", // "light", "dark" or a name added to CodeEditor.styles
    style: { // Light style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.14), round: 8 },
        text: {
            fontSize: 13,
            lineHeight: 20,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            color: "#2B2B2A",
            caretColor: "#111111",
            paddingX: 10,
            paddingY: 8,
        },
        gutter: { color: "#F6F6F4", lineColor: Black(0.08), textColor: Black(0.38), activeTextColor: Black(0.8), space: 1 }, // space: letters at each side
        activeLine: { color: "rgba(91, 186, 193, 0.1)" },
        selection: { color: "rgba(91, 186, 193, 0.35)" },
        placeholder: { color: Black(0.4) },
        scrollBar: { color: Black(0.22), hoverColor: Black(0.4), size: 10 },
        // The colors of the code
        kinds: {
            keyword: "#8A2F8E",
            string: "#1F7A3D",
            number: "#A85A00",
            comment: "#7A7F87",
            builtin: "#00717A",
            function: "#2467B8",
            property: "#2467B8",
            tag: "#A32A4B",
            attribute: "#A85A00",
            variable: "#00717A",
        },
    },
};

const CodeEditor = function (params = {}) {

    // Merge style package: params.style > CodeEditor.styles[styleName] > CodeEditorDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, CodeEditor.styles, CodeEditorDefaults);

    // Merge params:
    mergeIntoIfMissing(params, CodeEditorDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const BUFFER_LINES = 25; // Lines drawn over and under the ones that are seen: a small scroll draws nothing
    const MAX_COLORED_LETTERS = 2000; // A longer line is colored up to here (a minified file)
    const MIN_GUTTER_DIGITS = 2;
    const CARET_MARGIN_LINES = 2; // goToLine() keeps this many lines around the line
    let lines = [""];
    let lineStates = [null]; // lineStates[i]: the state of the tokenizer at the start of line i
    let validStateCount = 1; // The states up to here are right
    let drawnFirstLine = -1; // The lines of the code layer now
    let drawnLastLine = -1;
    let cancelChange = null; // The waiting onChange (changeDelay)
    let canLeaveWithTab = 0; // 1: Escape was pressed: the next Tab leaves the editor

    // *** PUBLIC VARIABLES:
    box.cursorLine = 1; // Read only (from 1)
    box.cursorColumn = 1;
    // NOTE: Default values are also public variables. (box.value, box.language, box.readOnly...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, CodeEditor.styles, CodeEditorDefaults);
        mergeIntoIfMissing(fresh, CodeEditorDefaults);
        return fresh.style;
    };

    const languageDefinition = function () {
        return CodeEditor.languages[box.language] || CodeEditor.languages.text;
    };

    const textarea = function () {
        return box.textareaElem;
    };

    // WHY up to the line: a change only moves the states after it, and only the lines that are seen ask for them.
    const makeStatesUpTo = function (lineIndex) {
        const definition = languageDefinition();
        for (let i = validStateCount; i <= lineIndex && i < lines.length; i++) {
            const previousText = lines[i - 1].slice(0, MAX_COLORED_LETTERS);
            lineStates[i] = CodeEditor.tokenizeLine(previousText, lineStates[i - 1], definition).state;
            validStateCount = i + 1;
        }
    };

    const lineHtml = function (lineIndex) {
        const text = lines[lineIndex];
        const colored = text.slice(0, MAX_COLORED_LETTERS);
        const result = CodeEditor.tokenizeLine(colored, lineStates[lineIndex], languageDefinition());
        const html = result.parts.map(CodeEditor.partHtml).join("");
        return html + basic.escapeHtml(text.slice(MAX_COLORED_LETTERS));
    };

    const lineHeight = function () {
        return _s.text.lineHeight;
    };

    // CONTENT: the lines that are seen and the ones around them. force: also when they are the same lines.
    const drawVisibleLines = function (force) {
        const elem = textarea();
        const firstSeen = Math.floor(elem.scrollTop / lineHeight());
        const seenCount = Math.ceil(elem.clientHeight / lineHeight()) + 1;
        const lastSeen = Math.min(lines.length - 1, firstSeen + seenCount);
        const isInDrawnLines = (firstSeen >= drawnFirstLine && lastSeen <= drawnLastLine);

        if (force || !isInDrawnLines) {
            drawnFirstLine = Math.max(0, firstSeen - BUFFER_LINES);
            drawnLastLine = Math.min(lines.length - 1, lastSeen + BUFFER_LINES);
            makeStatesUpTo(drawnLastLine);
            drawCode();
            drawGutter();
        }
        placeLayers();
    };

    const drawCode = function () {
        const parts = [];
        for (let i = drawnFirstLine; i <= drawnLastLine; i++) parts.push(lineHtml(i));
        box.codeLayer.text = parts.join("\n");
    };

    const drawGutter = function () {
        const numbers = [];
        for (let i = drawnFirstLine; i <= drawnLastLine; i++) {
            const isActive = (i + 1 === box.cursorLine);
            numbers.push((isActive) ? '<span class="code-editor-active-number">' + (i + 1) + "</span>" : String(i + 1));
        }
        box.gutterLayer.text = numbers.join("\n");
    };

    // LAYOUT: the layers follow the scroll of the textarea
    const placeLayers = function () {
        const elem = textarea();
        const top = _s.text.paddingY + drawnFirstLine * lineHeight() - elem.scrollTop;
        const left = _s.text.paddingX - elem.scrollLeft;
        box.codeLayer.css.transform = "translate(" + left + "px, " + top + "px)";
        box.gutterLayer.css.transform = "translateY(" + top + "px)";
        box.activeLine.top = _s.text.paddingY + (box.cursorLine - 1) * lineHeight() - elem.scrollTop;
    };

    // LAYOUT: the gutter is as wide as the number of the last line
    const refreshGutterWidth = function () {
        const digits = Math.max(MIN_GUTTER_DIGITS, String(lines.length).length);
        const letters = digits + 2 * _s.gutter.space;
        const width = (box.showLineNumbers == 1) ? "calc(" + letters + "ch + 1px)" : "0px";
        box.gutter.visible = (box.showLineNumbers == 1) ? 1 : 0;
        box.gutter.css.width = width;
        box.gutterLayer.css.right = _s.gutter.space + "ch";
        box.codeArea.css.left = width;
        box.codeArea.css.width = "calc(100% - " + width + ")";
    };

    // The state of a changed text: the states before the first changed line stay.
    const readValue = function () {
        // WHY once: a big textarea makes its value again at every read (about 100 ms for 100000 lines in WebKit).
        const value = textarea().value;
        const newLines = value.split("\n");
        let firstChanged = 0;
        const shorter = Math.min(lines.length, newLines.length);
        while (firstChanged < shorter && lines[firstChanged] === newLines[firstChanged]) firstChanged++;
        lines = newLines;
        lineStates.length = Math.min(lineStates.length, lines.length);
        validStateCount = Math.min(validStateCount, firstChanged + 1, lines.length);
        box.value = value;
    };

    // The line and the column of the cursor, and what shows them
    const readCursor = function () {
        const cursor = textarea().selectionStart;
        let line = 1;
        let lineStart = 0;
        let lineBreak = box.value.indexOf("\n");
        while (lineBreak >= 0 && lineBreak < cursor) {
            line++;
            lineStart = lineBreak + 1;
            lineBreak = box.value.indexOf("\n", lineStart);
        }
        const column = cursor - lineStart + 1;
        const isSame = (line === box.cursorLine && column === box.cursorColumn);
        const isOtherLine = (line !== box.cursorLine);
        box.cursorLine = line;
        box.cursorColumn = column;
        if (isOtherLine) drawGutter();
        placeLayers();
        if (!isSame) box.onCursorChange(box);
    };

    const tellChange = function () {
        if (cancelChange) cancelChange();
        cancelChange = null;
        if (box.changeDelay <= 0) {
            box.onChange(box);
            return;
        }
        cancelChange = box.after(box.changeDelay, function () {
            cancelChange = null;
            box.onChange(box);
        });
    };

    const onInput = function () {
        readValue();
        refreshGutterWidth();
        drawVisibleLines(1);
        readCursor();
        tellChange();
    };

    // WHY execCommand: the only way that stays in the undo of the textarea (setRangeText and value do not).
    const insertAtSelection = function (text) {
        const elem = textarea();
        elem.focus();
        const isDone = (text === "") ? document.execCommand("delete") : document.execCommand("insertText", false, text);
        if (!isDone) {
            elem.setRangeText(text, elem.selectionStart, elem.selectionEnd, "end");
            onInput();
        }
    };

    // The start and the end of the whole lines of the selection, as places in the text
    const selectedLineRange = function () {
        const elem = textarea();
        const value = elem.value;
        const start = value.lastIndexOf("\n", elem.selectionStart - 1) + 1;
        // WHY: A selection that ends at the start of a line does not take that line.
        const lastPlace = (elem.selectionEnd > elem.selectionStart && value[elem.selectionEnd - 1] === "\n") ? elem.selectionEnd - 1 : elem.selectionEnd;
        let end = value.indexOf("\n", lastPlace);
        if (end < 0) end = value.length;
        return { start: start, end: end };
    };

    // Changes the whole lines of the selection with one step of undo, and selects them.
    const changeSelectedLines = function (changeLine) {
        const elem = textarea();
        const range = selectedLineRange();
        const oldLines = elem.value.slice(range.start, range.end).split("\n");
        const newText = oldLines.map(changeLine).join("\n");
        elem.setSelectionRange(range.start, range.end);
        insertAtSelection(newText);
        elem.setSelectionRange(range.start, range.start + newText.length);
    };

    const indentOne = function () {
        return " ".repeat(box.tabSize);
    };

    const isManyLines = function () {
        const elem = textarea();
        return elem.value.slice(elem.selectionStart, elem.selectionEnd).includes("\n");
    };

    const onTabKey = function () {
        if (isManyLines()) {
            changeSelectedLines(function (line) { return (line.length > 0) ? indentOne() + line : line; });
            return;
        }
        const elem = textarea();
        const lineStart = elem.value.lastIndexOf("\n", elem.selectionStart - 1) + 1;
        const column = elem.selectionStart - lineStart;
        insertAtSelection(" ".repeat(box.tabSize - (column % box.tabSize)));
    };

    const onShiftTabKey = function () {
        changeSelectedLines(function (line) {
            const spaces = line.match(/^ */)[0].length;
            return line.slice(Math.min(spaces, box.tabSize));
        });
    };

    const onEnterKey = function () {
        const elem = textarea();
        const lineStart = elem.value.lastIndexOf("\n", elem.selectionStart - 1) + 1;
        const beforeCursor = elem.value.slice(lineStart, elem.selectionStart);
        const indent = beforeCursor.match(/^[ \t]*/)[0];
        const opensLevel = (languageDefinition().indentAfter || "").includes(beforeCursor.trimEnd().slice(-1) || " ");
        insertAtSelection("\n" + indent + ((opensLevel) ? indentOne() : ""));
    };

    // In the indent, Backspace goes back to the level before. Returns 1 when it did.
    const onBackspaceKey = function () {
        const elem = textarea();
        if (elem.selectionStart !== elem.selectionEnd) return 0;
        const lineStart = elem.value.lastIndexOf("\n", elem.selectionStart - 1) + 1;
        const beforeCursor = elem.value.slice(lineStart, elem.selectionStart);
        if (beforeCursor.length === 0 || beforeCursor.trim().length > 0) return 0;
        const count = ((beforeCursor.length - 1) % box.tabSize) + 1;
        elem.setSelectionRange(elem.selectionStart - count, elem.selectionStart);
        insertAtSelection("");
        return 1;
    };

    const toggleLineComment = function () {
        const mark = languageDefinition().lineComment;
        if (!mark) return;
        const elem = textarea();
        const range = selectedLineRange();
        const oldLines = elem.value.slice(range.start, range.end).split("\n");
        const isCommented = oldLines.every(function (line) { return line.trim() === "" || line.trimStart().startsWith(mark); });
        changeSelectedLines(function (line) {
            if (line.trim() === "") return line;
            if (!isCommented) return line.replace(/^(\s*)/, "$1" + mark + " ");
            return line.replace(new RegExp("^(\\s*)" + CodeEditor.escapeRegExp(mark) + " ?"), "$1");
        });
    };

    const onKeyDown = function (event) {
        const isTab = (event.key === "Tab");
        const isCommentKey = (event.key === "/" && (event.ctrlKey || event.metaKey));
        if (event.key === "Escape") canLeaveWithTab = 1;
        else if (!isTab) canLeaveWithTab = 0;

        if (isTab && canLeaveWithTab) {
            canLeaveWithTab = 0;
            return; // WHY: The Tab of the browser: a keyboard user can leave the editor.
        }
        if (box.readOnly == 1) return;

        if (isTab) {
            event.preventDefault();
            if (event.shiftKey) onShiftTabKey();
            else onTabKey();
        } else if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            onEnterKey();
        } else if (event.key === "Backspace" && !event.isComposing) {
            if (onBackspaceKey()) event.preventDefault();
        } else if (isCommentKey) {
            event.preventDefault();
            toggleLineComment();
        }
    };

    // LOOK: everything that comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        const text = _s.text;
        const fontCss = { fontFamily: text.fontFamily, fontSize: text.fontSize + "px", lineHeight: text.lineHeight + "px" };
        box.props(_s.box);
        box.gutter.color = _s.gutter.color;
        // WHY the font of the code on these two: their widths are written in ch, the width of a letter of their own font.
        box.gutter.css = { ...fontCss, borderRight: "1px solid " + _s.gutter.lineColor };
        box.codeArea.css = fontCss;
        box.gutterLayer.css = { ...fontCss, color: _s.gutter.textColor };
        box.codeLayer.css = { ...fontCss, color: text.color, tabSize: box.tabSize };
        box.activeLine.color = _s.activeLine.color;
        box.activeLine.height = text.lineHeight;
        Object.assign(textarea().style, fontCss, {
            padding: text.paddingY + "px " + text.paddingX + "px",
            caretColor: text.caretColor,
            tabSize: box.tabSize,
        });
        const variables = { "--code-editor-selection": _s.selection.color, "--code-editor-placeholder": _s.placeholder.color,
            "--code-editor-active-number": _s.gutter.activeTextColor, "--code-editor-bar": _s.scrollBar.color,
            "--code-editor-bar-hover": _s.scrollBar.hoverColor, "--code-editor-bar-size": _s.scrollBar.size + "px" };
        Object.keys(_s.kinds).forEach(function (kind) { variables["--code-editor-" + kind] = _s.kinds[kind]; });
        Object.keys(variables).forEach(function (name) { box.elem.style.setProperty(name, variables[name]); });
        refreshGutterWidth();
        drawVisibleLines(1);
    };

    // Everything of a new text
    const showValue = function () {
        lines = [""];
        lineStates = [null];
        validStateCount = 1;
        readValue();
        textarea().scrollTop = 0;
        textarea().scrollLeft = 0;
        box.cursorLine = 1;
        box.cursorColumn = 1;
        refreshGutterWidth();
        drawVisibleLines(1);
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called. NOTE: The undo of the browser starts again with a new text.
    box.setValue = function (value, silent = 0) {
        const text = (value === null || value === undefined) ? "" : String(value);
        if (text === textarea().value) return; // the same text: nothing to draw, no onChange
        textarea().value = text;
        showValue();
        if (!silent) tellChange();
    };
    // USAGE: get: editor.value (or editor.getValue()), set: editor.setValue("x = 1\n")

    box.getValue = function () {
        return textarea().value;
    };

    // At the cursor, over the selected text. Undo takes it back.
    box.insertText = function (text) {
        insertAtSelection(String(text));
    };
    // USAGE: editor.insertText("print(x)")

    box.getSelectedText = function () {
        const elem = textarea();
        return elem.value.slice(elem.selectionStart, elem.selectionEnd);
    };

    box.setLanguage = function (language) {
        box.language = language;
        validStateCount = 1;
        drawVisibleLines(1);
    };
    // USAGE: editor.setLanguage("python")

    box.setReadOnly = function (value) {
        box.readOnly = basic.isOn(value) ? 1 : 0;
        textarea().readOnly = (box.readOnly == 1);
    };
    // USAGE: editor.setReadOnly(1)

    box.setShowLineNumbers = function (value) {
        box.showLineNumbers = basic.isOn(value) ? 1 : 0;
        refreshGutterWidth();
    };
    // USAGE: editor.setShowLineNumbers(0)

    box.setTabSize = function (size) {
        box.tabSize = size;
        textarea().style.tabSize = size;
        box.codeLayer.css.tabSize = size;
    };
    // USAGE: editor.setTabSize(2)

    // Puts the cursor at the start of a line (from 1) and shows it.
    box.goToLine = function (lineNumber) {
        const elem = textarea();
        const line = basic.clamp(Math.round(lineNumber), 1, lines.length);
        let place = 0;
        for (let i = 0; i < line - 1; i++) place += lines[i].length + 1;
        elem.focus({ preventScroll: true });
        elem.setSelectionRange(place, place);
        const top = (line - 1) * lineHeight();
        const margin = CARET_MARGIN_LINES * lineHeight();
        const isSeen = (top - margin >= elem.scrollTop && top + lineHeight() + margin <= elem.scrollTop + elem.clientHeight);
        if (!isSeen) elem.scrollTop = Math.max(0, top - elem.clientHeight / 2);
        drawVisibleLines(0);
        readCursor();
    };
    // USAGE: editor.goToLine(120)

    box.focusEditor = function () {
        textarea().focus({ preventScroll: true });
    };
    // USAGE: editor.focusEditor()

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: editor.setTheme("dark")

    // *** OBJECT VIEW:

    basic.addCss("code-editor",
        ".code-editor-textarea { position: absolute; left: 0; top: 0; width: 100%; height: 100%; margin: 0; border: 0; outline: none;" +
        " resize: none; box-sizing: border-box; background: transparent; color: transparent; -webkit-text-fill-color: transparent;" +
        " white-space: pre; overflow: auto; pointer-events: auto; user-select: text; -webkit-user-select: text; font-variant-ligatures: none; }" +
        ".code-editor-textarea::selection { background: var(--code-editor-selection); }" +
        ".code-editor-textarea::placeholder { color: var(--code-editor-placeholder); -webkit-text-fill-color: var(--code-editor-placeholder); }" +
        ".code-editor-textarea::-webkit-scrollbar { width: var(--code-editor-bar-size); height: var(--code-editor-bar-size); }" +
        ".code-editor-textarea::-webkit-scrollbar-thumb { background: var(--code-editor-bar); border-radius: 6px; border: 2px solid transparent; background-clip: padding-box; }" +
        ".code-editor-textarea::-webkit-scrollbar-thumb:hover { background: var(--code-editor-bar-hover); border: 2px solid transparent; background-clip: padding-box; }" +
        ".code-editor-textarea::-webkit-scrollbar-corner { background: transparent; }" +
        ".code-editor-layer { white-space: pre; font-variant-ligatures: none; overflow: visible; width: max-content; }" +
        ".code-editor-active-number { color: var(--code-editor-active-number); }" +
        CodeEditor.KIND_NAMES.map(function (kind) { return ".code-editor-" + kind + " { color: var(--code-editor-" + kind + "); }"; }).join("")
    );

    // BOX: The line numbers
    box.gutter = startBox({ left: 0, top: 0, height: "100%", css: { boxSizing: "border-box" } });

        // LABEL: The numbers that are seen
        box.gutterLayer = Label({ top: 0, textAlign: "right" });
        box.gutterLayer.elem.classList.add("code-editor-layer");
        box.gutterLayer.css.left = "auto";
        box.gutterLayer.aria = { hidden: "true" };

    endBox();

    // BOX: The code
    box.codeArea = startBox({ top: 0, height: "100%", color: "transparent" });

        // BOX: The line of the cursor
        box.activeLine = Box({ left: 0, width: "100%" });

        // LABEL: The colored code that is seen (behind the textarea)
        box.codeLayer = Label({ left: 0, top: 0 });
        box.codeLayer.elem.classList.add("code-editor-layer");
        box.codeLayer.aria = { hidden: "true" };

    endBox();

    // TEXTAREA: The typing. A raw element: basic.js has no object of more lines. Its text is transparent, over the colors.
    box.textareaElem = document.createElement("textarea");
    box.textareaElem.classList.add("code-editor-textarea");
    box.textareaElem.wrap = "off";
    box.textareaElem.spellcheck = false;
    box.textareaElem.setAttribute("autocomplete", "off");
    box.textareaElem.setAttribute("autocorrect", "off");
    box.textareaElem.setAttribute("autocapitalize", "off");
    box.textareaElem.setAttribute("aria-label", box.ariaLabel);
    box.textareaElem.placeholder = box.placeholder;
    box.textareaElem.readOnly = (box.readOnly == 1);
    box.textareaElem.value = (box.value === null || box.value === undefined) ? "" : String(box.value);
    box.codeArea.elem.appendChild(box.textareaElem);

    // *** OBJECT INIT CODE:

    box.listenTo(textarea(), "input", onInput);
    box.listenTo(textarea(), "scroll", function () { drawVisibleLines(0); });
    box.listenTo(textarea(), "keydown", function (self, event) { onKeyDown(event); });
    box.listenTo(textarea(), "keyup", readCursor);
    box.listenTo(textarea(), "mouseup", readCursor);
    box.listenTo(textarea(), "focus", readCursor);
    box.listenTo(document, "selectionchange", function () {
        if (document.activeElement === textarea()) readCursor();
    });
    // WHY: The first drawing has no height when the box is not on the page yet; a new height shows more lines.
    box.onResize(function () { drawVisibleLines(0); });

    readValue();
    applyLook();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

CodeEditor.KIND_NAMES = ["keyword", "string", "number", "comment", "builtin", "function", "property", "tag", "attribute", "variable"];

CodeEditor.escapeRegExp = function (text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// [kind, text] as HTML
CodeEditor.partHtml = function (part) {
    const text = basic.escapeHtml(part[1]);
    return (part[0]) ? '<span class="code-editor-' + part[0] + '">' + text + "</span>" : text;
};

CodeEditor.NUMBER = /^(0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(\.\d*)?([eE][+-]?\d+)?|\.\d+([eE][+-]?\d+)?)/;
// WHY the letters of every language: "şif" is one word, not "ş" and the keyword "if".
CodeEditor.WORD = /^[\p{L}_][\p{L}\p{N}_]*/u;
CodeEditor.WORD_LETTER = /[\p{L}\p{N}_]/u;

// The text from a place to the end of a string, with the letters after a backslash skipped. -1: it does not end here.
CodeEditor.findStringEnd = function (text, from, mark) {
    let index = from;
    while (index < text.length) {
        if (text[index] === "\\") {
            index += 2;
        } else if (text.startsWith(mark, index)) {
            return index + mark.length;
        } else {
            index++;
        }
    }
    return -1;
};

// The kind of a word by its place
CodeEditor.kindOfWord = function (word, restOfLine, definition) {
    const lookedUp = (definition.ignoreCase) ? word.toLowerCase() : word;
    if (definition.keywordSet.has(lookedUp)) return "keyword";
    if (definition.builtinSet.has(lookedUp)) return "builtin";
    if (definition.callWords && /^\s*\(/.test(restOfLine)) return "function";
    if (definition.propertyWords && /^\s*:/.test(restOfLine)) return "property";
    return "";
};

// WHY sets, made once: the words are looked up for every word of every line that is drawn.
CodeEditor.prepareDefinition = function (definition) {
    if (definition.keywordSet) return;
    definition.keywordSet = new Set(definition.keywords || []);
    definition.builtinSet = new Set(definition.builtins || []);
};

// One line: { parts: [[kind, text], ...], state }. state: the end mark of what is still open at the end of the line.
CodeEditor.tokenizeLine = function (text, state, definition) {
    if (definition.tokenize) return definition.tokenize(text, state);
    CodeEditor.prepareDefinition(definition);

    const parts = [];
    const add = function (kind, value) {
        if (value.length === 0) return;
        const last = parts[parts.length - 1];
        if (last && last[0] === kind) last[1] += value;
        else parts.push([kind, value]);
    };
    let index = 0;
    let openState = state;

    // WHAT IS STILL OPEN from the lines before (a comment, a string of many lines)
    if (openState) {
        const isString = (definition.multiLineStrings || []).includes(openState);
        const end = (isString) ? CodeEditor.findStringEnd(text, 0, openState) : text.indexOf(openState);
        const kind = (isString) ? "string" : "comment";
        if (end < 0) {
            add(kind, text);
            return { parts: parts, state: openState };
        }
        const stop = (isString) ? end : end + openState.length;
        add(kind, text.slice(0, stop));
        index = stop;
        openState = null;
    }

    const lineComment = definition.lineComment;
    const blockComment = definition.blockComment;
    const strings = definition.strings || [];
    const multiLine = definition.multiLineStrings || [];

    while (index < text.length) {
        const rest = text.slice(index);
        const letter = text[index];

        if (lineComment && rest.startsWith(lineComment)) {
            add("comment", rest);
            break;
        }

        if (blockComment && rest.startsWith(blockComment[0])) {
            const end = text.indexOf(blockComment[1], index + blockComment[0].length);
            if (end < 0) {
                add("comment", rest);
                openState = blockComment[1];
                break;
            }
            add("comment", text.slice(index, end + blockComment[1].length));
            index = end + blockComment[1].length;
            continue;
        }

        const stringMark = strings.find(function (mark) { return rest.startsWith(mark); });
        if (stringMark) {
            const end = CodeEditor.findStringEnd(text, index + stringMark.length, stringMark);
            if (end < 0) {
                add("string", rest);
                if (multiLine.includes(stringMark)) openState = stringMark;
                break;
            }
            const isProperty = (definition.propertyStrings && /^\s*:/.test(text.slice(end)));
            add((isProperty) ? "property" : "string", text.slice(index, end));
            index = end;
            continue;
        }

        const isAfterWord = (index > 0 && CodeEditor.WORD_LETTER.test(text[index - 1]));
        const numberMatch = (isAfterWord) ? null : CodeEditor.NUMBER.exec(rest);
        if (numberMatch) {
            add("number", numberMatch[0]);
            index += numberMatch[0].length;
            continue;
        }

        if (definition.decorators && letter === definition.decorators) {
            const decorator = CodeEditor.WORD.exec(rest.slice(1));
            if (decorator) {
                add("function", letter + decorator[0]);
                index += 1 + decorator[0].length;
                continue;
            }
        }

        if (definition.variables && letter === definition.variables) {
            const variable = CodeEditor.WORD.exec(rest.slice(1));
            if (variable) {
                add("variable", letter + variable[0]);
                index += 1 + variable[0].length;
                continue;
            }
        }

        const wordMatch = CodeEditor.WORD.exec(rest);
        if (wordMatch) {
            const word = wordMatch[0];
            add(CodeEditor.kindOfWord(word, rest.slice(word.length), definition), word);
            index += word.length;
            continue;
        }

        add("", letter);
        index++;
    }

    return { parts: parts, state: openState };
};

// HTML has tags instead of words. state: "-->" (a comment), "tag" (the attributes of a tag go on)
CodeEditor.tokenizeHtml = function (text, state) {
    const parts = [];
    let index = 0;
    let openState = state;

    const readTagInside = function () {
        while (index < text.length) {
            const rest = text.slice(index);
            const closing = /^\/?>/.exec(rest);
            if (closing) {
                parts.push(["tag", closing[0]]);
                index += closing[0].length;
                openState = null;
                return;
            }
            const attribute = /^[A-Za-z_:@][\w:.-]*/.exec(rest);
            const quoted = /^("[^"]*"?|'[^']*'?)/.exec(rest);
            if (attribute) {
                parts.push(["attribute", attribute[0]]);
                index += attribute[0].length;
            } else if (quoted) {
                parts.push(["string", quoted[0]]);
                index += quoted[0].length;
            } else {
                parts.push(["", text[index]]);
                index++;
            }
        }
        openState = "tag";
    };

    if (openState === "-->") {
        const end = text.indexOf("-->");
        if (end < 0) return { parts: [["comment", text]], state: "-->" };
        parts.push(["comment", text.slice(0, end + 3)]);
        index = end + 3;
        openState = null;
    } else if (openState === "tag") {
        readTagInside();
    }

    while (index < text.length) {
        const rest = text.slice(index);
        if (rest.startsWith("<!--")) {
            const end = text.indexOf("-->", index + 4);
            if (end < 0) {
                parts.push(["comment", rest]);
                return { parts: parts, state: "-->" };
            }
            parts.push(["comment", text.slice(index, end + 3)]);
            index = end + 3;
            continue;
        }
        const opening = /^<\/?[A-Za-z!][\w:-]*/.exec(rest);
        if (opening) {
            parts.push(["tag", opening[0]]);
            index += opening[0].length;
            readTagInside();
            continue;
        }
        const nextTag = rest.indexOf("<", 1);
        const stop = (nextTag < 0) ? text.length : index + nextTag;
        parts.push(["", text.slice(index, stop)]);
        index = stop;
    }

    return { parts: parts, state: openState };
};

// *** LANGUAGES:
CodeEditor.languages = {

    text: {
        tokenize: function (line) { return { parts: [["", line]], state: null }; },
    },

    python: {
        lineComment: "#",
        strings: ['"""', "'''", '"', "'"],
        multiLineStrings: ['"""', "'''"],
        keywords: ["False", "None", "True", "and", "as", "assert", "async", "await", "break", "class", "continue", "def", "del", "elif", "else", "except", "finally", "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try", "while", "with", "yield"],
        builtins: ["abs", "all", "any", "bool", "bytes", "dict", "dir", "enumerate", "filter", "float", "format", "getattr", "hasattr", "input", "int", "isinstance", "iter", "len", "list", "map", "max", "min", "next", "object", "open", "print", "range", "repr", "reversed", "round", "set", "setattr", "sorted", "str", "sum", "super", "tuple", "type", "zip", "self", "cls"],
        callWords: 1,
        decorators: "@",
        indentAfter: ":",
    },

    javascript: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
        strings: ['"', "'", "`"],
        multiLineStrings: ["`"],
        keywords: ["async", "await", "break", "case", "catch", "class", "const", "continue", "default", "delete", "do", "else", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "let", "new", "null", "of", "return", "static", "super", "switch", "this", "throw", "true", "try", "typeof", "undefined", "var", "void", "while", "yield"],
        builtins: ["Array", "Boolean", "Date", "Error", "JSON", "Map", "Math", "Number", "Object", "Promise", "RegExp", "Set", "String", "console", "document", "window"],
        callWords: 1,
        indentAfter: "{[(",
    },

    json: {
        strings: ['"'],
        keywords: ["true", "false", "null"],
        propertyStrings: 1,
        indentAfter: "{[",
    },

    css: {
        blockComment: ["/*", "*/"],
        strings: ['"', "'"],
        propertyWords: 1,
        variables: "#", // #fff, #title
        indentAfter: "{",
    },

    sql: {
        lineComment: "--",
        blockComment: ["/*", "*/"],
        strings: ["'", '"'],
        ignoreCase: 1,
        keywords: ["add", "all", "alter", "and", "as", "asc", "between", "by", "case", "create", "delete", "desc", "distinct", "drop", "else", "end", "exists", "from", "group", "having", "in", "index", "inner", "insert", "into", "is", "join", "key", "left", "like", "limit", "not", "null", "offset", "on", "or", "order", "outer", "primary", "right", "select", "set", "table", "then", "union", "unique", "update", "values", "view", "when", "where"],
        builtins: ["avg", "count", "max", "min", "sum", "coalesce", "lower", "upper", "integer", "text", "real", "varchar", "boolean", "date"],
        callWords: 1,
        indentAfter: "(",
    },

    bash: {
        lineComment: "#",
        strings: ['"', "'"],
        keywords: ["case", "do", "done", "elif", "else", "esac", "exit", "export", "fi", "for", "function", "if", "in", "local", "return", "set", "then", "until", "while"],
        builtins: ["cat", "cd", "chmod", "cp", "echo", "find", "grep", "ls", "mkdir", "mv", "pwd", "read", "rm", "sed", "sudo", "touch"],
        variables: "$",
        indentAfter: "{(",
    },

    html: {
        tokenize: CodeEditor.tokenizeHtml,
    },

};

// *** STYLE PACKAGES:
// USAGE: CodeEditor({ styleName: "dark" })
// USAGE: CodeEditor({ styleName: "dark", style: { kinds: { keyword: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: CodeEditor.styles.myStyle = { box: { color: "#FFFDF5" } };
CodeEditor.styles = {

    // White, a soft gray for the numbers.
    light: CodeEditorDefaults.style,

    // For a dark window.
    dark: {
        box: { color: "#1C1C1B", borderColor: White(0.1) },
        text: { color: "#E6E6E3", caretColor: "#FFFFFF" },
        gutter: { color: "#232322", lineColor: White(0.08), textColor: White(0.38), activeTextColor: White(0.85) },
        activeLine: { color: White(0.05) },
        selection: { color: "rgba(111, 198, 205, 0.35)" },
        placeholder: { color: White(0.42) },
        scrollBar: { color: White(0.22), hoverColor: White(0.4) },
        kinds: {
            keyword: "#D7A2E8",
            string: "#8FD694",
            number: "#F0B56A",
            comment: "#8D939B",
            builtin: "#6FC6CD",
            function: "#8CC4EE",
            property: "#8CC4EE",
            tag: "#F08FA8",
            attribute: "#F0B56A",
            variable: "#6FC6CD",
        },
    },

};
