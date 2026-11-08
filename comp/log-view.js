/* Bismillah */

/*

LogView - v26.11

UI COMPONENT
- The output of a program: one line for each message, colored by its level (info, success, warn, error, debug),
  with its time and the name of its level.
- It follows the last line. A scroll up stops that (the lines being read stay in place); a small "12 new" button
  goes back to the end. It also waits while a text is selected.
- The texts are shown as they are (never as HTML), they can be selected and copied, and their spaces are kept.
  A text with many lines becomes many lines. A long line wraps under its own text (wrapLines: 0: it does not wrap,
  the view scrolls sideways).
- maxLines: the oldest lines go, so a program that writes for days does not fill the memory.
- A fast program does not draw for each line: the lines that come together are drawn together.
- setLevels(["warn", "error"]) shows only those levels.
- Uses ScrollBar (basic/scroll-bar.js) if the page has loaded it; it works without it too.
- Style packages: "light" (default), "dark". Select with styleName (LogView.styles), or later with setTheme().

USAGE:
const log = LogView({ width: 600, height: 300 });
log.addLine("Reading config.json");
log.success("14 files found");
log.warn("photo.jpg is very large");
log.error("disk.bin can not be read");
log.debug("cache: 31 items");
log.addLine("A line of a level of your own", "myLevel");  // its look: style.levels.myLevel (or info)
log.clearLines();
log.getText();                                            // all the lines that are shown, as a text
log.setLevels(["warn", "error"]);  log.setLevels([]);     // [] : all of them
log.setShowTime(0);
log.setShowLevel(0);
log.setWrapLines(0);
log.setAutoScroll(0);                                     // it does not follow the last line
log.setTheme("dark");                                     // the lines stay
log.scrollToEnd();                                        // goes to the end, and follows again
LogView({ styleName: "dark", lines: ["First line", { text: "Second line", level: "warn" }] });
LogView({ levelTexts: { info: "BİLGİ", warn: "UYARI", error: "HATA" }, emptyText: "Henüz çıktı yok.", newLinesText: "{count} yeni" });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const LogViewDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: "100%",
    height: 260,
    lines: [], // The first lines: "Text" or { text, level, time }
    maxLines: 1000, // The oldest lines go. 0: no limit
    autoScroll: 1, // 1: follows the last line
    showTime: 1,
    showLevel: 1,
    wrapLines: 1,
    emptyText: "No output yet.",
    newLinesText: "{count} new", // The button that goes back to the end
    levelTexts: { info: "INFO", success: "OK", warn: "WARN", error: "ERROR", debug: "DEBUG" },
    ariaLabel: "Output",
    styleName: "light", // "light", "dark" or a name added to LogView.styles
    style: { // Light style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.14), round: 8 },
        line: {
            fontSize: 13,
            lineHeight: 20,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            paddingX: 10,
            space: 1, // Space above and below the text of a line
        },
        area: { paddingY: 6 },
        time: { textColor: Black(0.5) },
        // text: the text of the line, tag: the name of its level, color: the ground of the line
        levels: {
            info: { text: Black(0.84), tag: "#2467B8", color: "transparent" },
            success: { text: "#1F7A5C", tag: "#1F7A5C", color: "transparent" },
            warn: { text: "#7A5000", tag: "#7A5000", color: "rgba(241, 199, 74, 0.2)" },
            error: { text: "#B93226", tag: "#B93226", color: "rgba(232, 121, 109, 0.14)" },
            debug: { text: Black(0.55), tag: Black(0.55), color: "transparent" },
        },
        empty: { fontSize: 13, textColor: Black(0.45) },
        newLines: {
            color: "#37474A",
            hoverColor: "#2A383B",
            textColor: "white",
            fontSize: 12,
            height: 28,
            paddingX: 12,
            round: 14,
            bottom: 10,
            shadow: "0 2px 8px " + Black(0.25),
        },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", neverHide: 0, showDots: 0 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const LogView = function (params = {}) {

    // Merge style package: params.style > LogView.styles[styleName] > LogViewDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, LogView.styles, LogViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, LogViewDefaults);

    // Edit params, if needed:
    const firstLines = (Array.isArray(params.lines)) ? params.lines : [];
    params.lines = []; // WHY: The first lines are added below, like every other line.

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const BOTTOM_SPACE = 4; // px: this near to the end counts as the end
    const TIME_LENGTH = 8; // "12:03:41"
    let shownLevels = []; // []: all of them
    let isFollowing = 1; // 0: the reader scrolled up
    let newLineCount = 0; // The lines that came after the reader scrolled up
    let lastScrollTop = 0; // The place the last scroll event saw
    let cancelDraw = null; // The cancel function of the waiting drawing

    // *** PUBLIC VARIABLES:
    // NOTE: box.lines: [{ text, level, time }]: all the lines. (Read only: change them with addLine() and clearLines().)
    // NOTE: Default values are also public variables. (box.maxLines, box.autoScroll, box.showTime...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, LogView.styles, LogViewDefaults);
        mergeIntoIfMissing(fresh, LogViewDefaults);
        return fresh.style;
    };

    const lookOfLevel = function (level) {
        return _s.levels[level] || _s.levels.info;
    };

    const isLevelShown = function (level) {
        return (shownLevels.length == 0 || shownLevels.indexOf(level) >= 0);
    };

    const currentTime = function () {
        const now = new Date();
        return [now.getHours(), now.getMinutes(), now.getSeconds()].map(basic.twoDigitFormat).join(":");
    };

    // WHY: All the names have the same length, so the texts of the lines start at the same place.
    const tagLength = function () {
        const texts = Object.keys(box.levelTexts).map(function (level) { return box.levelTexts[level]; });
        return Math.max.apply(null, texts.map(function (text) { return text.length; }));
    };

    const tagOfLine = function (line) {
        const text = box.levelTexts[line.level] || String(line.level).toUpperCase();
        return text.padEnd(tagLength());
    };

    // The letters in front of the text of a line
    const prefixLength = function () {
        const timeLength = (box.showTime == 1) ? TIME_LENGTH + 1 : 0;
        const levelLength = (box.showLevel == 1) ? tagLength() + 1 : 0;
        return timeLength + levelLength;
    };

    const coloredText = function (text, color) {
        return '<span style="color: ' + color + '">' + basic.escapeHtml(text) + "</span>";
    };

    // CONTENT: the time, the name of the level and the text of a line
    const rowText = function (line) {
        let html = "";
        if (box.showTime == 1) html += coloredText(line.time, _s.time.textColor) + " ";
        if (box.showLevel == 1) html += coloredText(tagOfLine(line), lookOfLevel(line.level).tag) + " ";
        return html + basic.escapeHtml(line.text);
    };

    // WHY: A long line wraps under its own text, not under its time: the letters of the mono font have one width.
    const hangingIndent = function () {
        const length = prefixLength();
        return {
            paddingLeft: "calc(" + length + "ch + " + _s.line.paddingX + "px)",
            textIndent: (-length) + "ch",
        };
    };

    // PAINT: everything of the row of a line that comes from the style and the params
    const paintRow = function (line) {
        const look = lookOfLevel(line.level);
        line.row.props({
            fontSize: _s.line.fontSize,
            lineHeight: _s.line.lineHeight,
            fontFamily: _s.line.fontFamily,
            textColor: look.text,
            color: look.color,
        });
        // WHY: pre-wrap keeps the spaces of the output (a table written with spaces); anywhere breaks a long path.
        line.row.css = {
            whiteSpace: (box.wrapLines == 1) ? "pre-wrap" : "pre",
            overflowWrap: "anywhere",
            padding: _s.line.space + "px " + _s.line.paddingX + "px",
            ...hangingIndent(),
        };
        line.row.text = rowText(line);
        line.row.visible = isLevelShown(line.level) ? 1 : 0;
    };

    // DATA: the object of one line. Its container must be set. (createIn)
    const createRow = function (line) {
        line.row = Label({ width: "auto", selectable: 1, cursor: "text", shrink: 0 });
        paintRow(line);
    };

    const isSelectingText = function () {
        const selection = window.getSelection();
        return !!(selection && !selection.isCollapsed && box.elem.contains(selection.anchorNode));
    };

    // Lines are being read: they stay where they are.
    const isViewHeld = function () {
        return (box.autoScroll != 1 || !isFollowing || isSelectingText());
    };

    // The oldest lines go. The lines being read stay where they are.
    const dropOldLines = function () {
        if (box.maxLines <= 0 || box.lines.length <= box.maxLines) return;
        const elem = box.scrollArea.elem;
        const heightBefore = elem.scrollHeight;
        box.lines.splice(0, box.lines.length - box.maxLines).forEach(function (line) {
            if (line.row) line.row.remove();
        });
        if (isViewHeld()) elem.scrollTop -= (heightBefore - elem.scrollHeight);
    };

    // PAINT: the text of an empty view and the button that goes back to the end
    const paintNotes = function () {
        const hasShownLine = box.lines.some(function (line) { return isLevelShown(line.level); });
        box.emptyGroup.visible = (hasShownLine) ? 0 : 1;
        box.btnNewLines.visible = (newLineCount > 0) ? 1 : 0;
        box.btnNewLines.plainText = "↓ " + box.newLinesText.split("{count}").join(newLineCount);
    };

    const isAtEnd = function () {
        const elem = box.scrollArea.elem;
        return (elem.scrollHeight - elem.scrollTop - elem.clientHeight <= BOTTOM_SPACE);
    };

    const followLastLine = function () {
        if (isViewHeld()) return;
        box.scrollArea.elem.scrollTop = box.scrollArea.elem.scrollHeight;
    };

    // WHY: A fast program writes many lines at once. They are drawn together, and only the last maxLines of them.
    const drawNewLines = function () {
        cancelDraw = null;
        dropOldLines();
        const newLines = box.lines.filter(function (line) { return !line.row; });
        createIn(box.lineGroup, function () {
            newLines.forEach(createRow);
        });
        if (box.autoScroll == 1 && !isFollowing) {
            newLineCount += newLines.filter(function (line) { return isLevelShown(line.level); }).length;
        }
        paintNotes();
        followLastLine();
    };

    const scheduleDraw = function () {
        if (!cancelDraw) cancelDraw = box.after(0, drawNewLines);
    };

    const addLines = function (text, level, time) {
        // WHY: The last end of line of a printed text is not one more empty line.
        String(text).replace(/\r?\n$/, "").split(/\r?\n/).forEach(function (lineText) {
            box.lines.push({ text: lineText, level: level, time: time, row: null });
        });
    };

    // Everything of the rows that depends on a param (setShowTime, setShowLevel, setWrapLines, setLevels)
    const refreshRows = function () {
        box.lineGroup.css.width = (box.wrapLines == 1) ? "100%" : "max-content";
        box.lines.forEach(function (line) {
            if (line.row) paintRow(line);
        });
        paintNotes();
        followLastLine();
    };

    // LOOK: everything that comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        const look = _s.newLines;
        box.props(_s.box);
        box.scrollArea.setFocusRing(_s.focus.ringColor);
        box.lineGroup.padding = [0, _s.area.paddingY];
        box.lblEmpty.props(_s.empty);
        box.btnNewLines.props({
            height: look.height,
            fontSize: look.fontSize,
            color: look.color,
            textColor: look.textColor,
            round: look.round,
            boxShadow: look.shadow,
        });
        box.btnNewLines.css.padding = "0 " + look.paddingX + "px";
        box.btnNewLines.css.bottom = look.bottom + "px";
        box.btnNewLines.setFocusRing(_s.focus.ringColor);
        applyScrollBarLook();
        refreshRows();
    };

    const applyScrollBarLook = function () {
        if (!box.scrollBar) return;
        Object.assign(box.scrollBar, _s.scrollBar);
        box.scrollBar.boxScrollBarTop.color = _s.scrollBar.bar_color;
        box.scrollBar.boxScrollBarLeft.color = _s.scrollBar.bar_color;
    };

    // The reader moved: at the end the view follows again, above it the view stays.
    const onScroll = function () {
        // WHY: A scroll event comes a frame late. If lines came meanwhile and nothing moved, it would look like a scroll up.
        if (box.scrollArea.elem.scrollTop === lastScrollTop) return;
        lastScrollTop = box.scrollArea.elem.scrollTop;
        const wasFollowing = isFollowing;
        isFollowing = isAtEnd() ? 1 : 0;
        if (isFollowing && !wasFollowing) {
            newLineCount = 0;
            paintNotes();
        }
    };

    // *** PUBLIC FUNCTIONS:

    // WHY the name: box.add() is a function of every Box (a ScrollBar calls it on its parent).
    // time: "12:03:41" (when it was not written just now). "": the time of now.
    box.addLine = function (text, level = "info", time = "") {
        addLines(text, level, time || currentTime());
        scheduleDraw();
    };
    // USAGE: log.addLine("Reading config.json") / log.addLine("Hello", "success")

    box.info = function (text) { box.addLine(text, "info"); };
    box.success = function (text) { box.addLine(text, "success"); };
    box.warn = function (text) { box.addLine(text, "warn"); };
    box.error = function (text) { box.addLine(text, "error"); };
    box.debug = function (text) { box.addLine(text, "debug"); };

    box.clearLines = function () {
        box.lines.forEach(function (line) {
            if (line.row) line.row.remove();
        });
        box.lines = [];
        newLineCount = 0;
        isFollowing = 1;
        box.scrollArea.elem.scrollTop = 0;
        lastScrollTop = 0;
        paintNotes();
    };
    // USAGE: log.clearLines()

    // All the lines that are shown, as they look: for a Copy button or a file.
    box.getText = function () {
        return box.lines.filter(function (line) { return isLevelShown(line.level); }).map(function (line) {
            const time = (box.showTime == 1) ? line.time + " " : "";
            const tag = (box.showLevel == 1) ? tagOfLine(line) + " " : "";
            return time + tag + line.text;
        }).join("\n");
    };
    // USAGE: navigator.clipboard.writeText(log.getText())

    // Goes to the end and follows the last line again.
    box.scrollToEnd = function () {
        isFollowing = 1;
        newLineCount = 0;
        box.scrollArea.elem.scrollTop = box.scrollArea.elem.scrollHeight;
        paintNotes();
    };

    box.setAutoScroll = function (value) {
        box.autoScroll = basic.isOn(value) ? 1 : 0;
        if (box.autoScroll == 1) box.scrollToEnd();
    };
    // USAGE: get: log.autoScroll, set: log.setAutoScroll(0)

    box.setShowTime = function (value) {
        box.showTime = basic.isOn(value) ? 1 : 0;
        refreshRows();
    };
    // USAGE: log.setShowTime(0)

    box.setShowLevel = function (value) {
        box.showLevel = basic.isOn(value) ? 1 : 0;
        refreshRows();
    };
    // USAGE: log.setShowLevel(0)

    box.setWrapLines = function (value) {
        box.wrapLines = basic.isOn(value) ? 1 : 0;
        box.scrollArea.scrollX = (box.wrapLines == 1) ? 0 : 1;
        refreshRows();
    };
    // USAGE: log.setWrapLines(0)

    box.setMaxLines = function (value) {
        box.maxLines = value;
        dropOldLines();
        paintNotes();
    };
    // USAGE: log.setMaxLines(200)

    box.setLevels = function (levels) {
        shownLevels = (Array.isArray(levels)) ? levels.slice() : [];
        newLineCount = 0;
        refreshRows();
    };
    // USAGE: log.setLevels(["warn", "error"]) / log.setLevels([]) // all of them

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: log.setTheme("dark")

    // *** OBJECT VIEW:

    // BOX: The lines scroll in it
    box.scrollArea = startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
    box.scrollArea.scrollX = (box.wrapLines == 1) ? 0 : 1;
    // WHY: dropOldLines() keeps the place of the reader itself; the browser must not do it a second time.
    box.scrollArea.css.overflowAnchor = "none";
    box.scrollArea.role = "log";
    box.scrollArea.aria = { label: box.ariaLabel };
    box.scrollArea.tabIndex = 0; // WHY: The keys of a focused box scroll it (arrows, Page Up, Home, End).

        // GROUP: The lines
        box.lineGroup = VGroup({
            width: (box.wrapLines == 1) ? "100%" : "max-content",
            height: "auto",
            align: "left top",
            gap: 0,
            css: { minWidth: "100%", boxSizing: "border-box", alignItems: "stretch" },
        });
        endGroup();

    endBox();

    // GROUP: The text of an empty view, in the middle at every size
    box.emptyGroup = VGroup({ left: 0, top: 0, width: "100%", height: "100%", align: "center center", padding: 12 });
        box.lblEmpty = Label({ plainText: box.emptyText, textAlign: "center" });
    endGroup();

    // BUTTON: Goes back to the end
    box.btnNewLines = Button({
        width: "auto",
        css: {
            whiteSpace: "nowrap",
            left: "50%",
            top: "auto",
            transform: "translateX(-50%)", // WHY: In the middle at every width of its text.
        },
        visible: 0,
    });
    box.btnNewLines.minimal = 1;

    if (typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollArea }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.scrollArea.on("scroll", onScroll);
    box.btnNewLines.on("click", box.scrollToEnd);
    box.btnNewLines.onHoverChange(function (self, isOver) {
        self.color = (isOver) ? _s.newLines.hoverColor : _s.newLines.color;
    });

    // WHY: A narrower box wraps more lines, and a hidden box has no end to go to: the end is found again.
    box.onResize(followLastLine);

    firstLines.forEach(function (line) {
        if (line && typeof line == "object") addLines(line.text, line.level || "info", line.time || currentTime());
        else addLines(line, "info", currentTime());
    });
    applyLook();
    drawNewLines();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: LogView({ styleName: "dark" })
// USAGE: LogView({ styleName: "dark", style: { line: { fontSize: 12 } } }) // Change only some keys.
// USAGE: LogView({ style: { levels: { myLevel: { text: "purple", tag: "purple", color: "transparent" } } } })
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: LogView.styles.myStyle = { box: { color: "#FFFDF5" } };
LogView.styles = {

    // A white panel, dark text; a warning and an error also have a soft ground.
    light: LogViewDefaults.style,

    // For a dark window.
    dark: {
        box: { color: "#1C1C1B", borderColor: White(0.1) },
        time: { textColor: White(0.48) },
        levels: {
            info: { text: White(0.86), tag: "#7DBBEB", color: "transparent" },
            success: { text: "#7FE3B5", tag: "#7FE3B5", color: "transparent" },
            warn: { text: "#F1C74A", tag: "#F1C74A", color: "rgba(241, 199, 74, 0.1)" },
            error: { text: "#FF9F93", tag: "#FF9F93", color: "rgba(232, 121, 109, 0.14)" },
            debug: { text: White(0.52), tag: White(0.52), color: "transparent" },
        },
        empty: { textColor: White(0.5) },
        newLines: { color: "#DDE5E6", hoverColor: "#F2F6F6", textColor: "#1C1C1B", shadow: "0 2px 8px " + Black(0.5) },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};
