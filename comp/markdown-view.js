/* Bismillah */

/*

MarkdownView - v26.11

UI COMPONENT
- A text written in Markdown, drawn on the page: a report, the notes of a program, the answer of an AI.
- Headings, lists (in lists, with numbers, with check marks), quotes, code, tables, lines, links, pictures, **bold**, *italic*,
  ~~deleted~~, `code`.
- A text is never read as HTML: "<b>" is shown as it is, and a link or a picture with an address like "javascript:..." stays
  a text. No script of a text runs. A picture with a remote address stays a link: a browser loads a picture by itself, so its
  server would learn that the text was opened, and its address can carry data (the answer of an AI). A text you trust:
  remotePictures: 1. A picture of the page and a data: address are always drawn.
- A text that comes piece by piece: appendText(). Only the blocks that changed are drawn again, and the view follows the end
  until the reader scrolls up.
- Code: a button copies it. comp/code-editor.js, when it is loaded, gives it colors: "python", "javascript", "json", "html",
  "css", "sql", "bash" (and "py", "js", "sh"...).
- height: a number or "100%": the text scrolls inside it (basic/scroll-bar.js when it is loaded). "auto": it grows with its text.
- A click on a link: onLinkClick when it is given, else a new tab. A link to "#a-heading" goes to that heading of the text.
- Style packages: "light" (default), "dark". Select with styleName (MarkdownView.styles), or later with setTheme().

USAGE:
const view = MarkdownView({
    height: 400,
    markdownText: "# A report\n\nSome **bold** words and a [link](https://example.com).",
    onLinkClick: function (self, address) { println(address); },
});
view.setMarkdownText("# Another text");
view.appendText("\n\nThe next words");
view.getMarkdownText();
view.getHeadings();                     // [{ id: "another-text", level: 1, text: "Another text" }]
view.scrollToHeading("another-text");
view.setTheme("dark");

MarkdownView.parse("# Hi").title;       // "Hi": the text without a view

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const MarkdownViewDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "100%", // A number or "100%": the text scrolls inside it. "auto": it grows with its text.
    markdownText: "", // The text. setMarkdownText(), appendText()
    emptyText: "", // Shown when there is no text
    autoScroll: 1, // 1: with appendText() the view follows the end, until the reader scrolls up
    remotePictures: 0, // 1: a picture with an http address is drawn, not a link (See the note at the top)
    useScrollBar: 1, // basic/scroll-bar.js (when it is loaded), with a height that is not "auto". 0: the scrollbar of the browser
    ariaLabel: "Document",
    copyText: "Copy", // The button of a code
    copiedText: "Copied",
    onLinkClick: null, // function (self, address) {}: a link comes to you, not to the browser. null: it opens in a new tab.
    styleName: "light", // "light", "dark" or a name added to MarkdownView.styles
    style: { // Light style package (default)
        box: { color: "white" },
        page: { padding: [22, 18], gap: 12, maxWidth: 820 }, // WHY maxWidth: A line as wide as a big window is hard to read.
        text: { fontSize: 15, lineRatio: 1.6, textColor: Black(0.8), softColor: Black(0.5), strongColor: Black(0.92) },
        // The sizes and the space above, for the levels 1 to 6. The line under the levels 1 and 2.
        heading: { fontSizes: [27, 22, 18, 16, 15, 14], spaces: [16, 14, 10, 8, 6, 6], lineRatio: 1.3, textColor: Black(0.92), lineColor: Black(0.1), linePadding: 6 },
        link: { color: "#1F7A83", lineColor: "rgba(31, 122, 131, 0.35)" },
        inlineCode: { color: Black(0.06) },
        quote: { textColor: Black(0.62), lineColor: Black(0.16), lineSize: 3, padding: 14 },
        table: { lineColor: Black(0.14), headColor: Black(0.04) },
        line: { color: Black(0.12), space: 6 },
        check: { color: Black(0.3), onColor: "#1F7A83", markColor: "white" },
        code: {
            color: "#F6F6F4",
            border: 1,
            borderColor: Black(0.08),
            round: 8,
            fontSize: 13,
            lineHeight: 20,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
            textColor: "#2B2B2A",
            padding: [14, 2],
            bottomPadding: 12,
            bar: { height: 34, paddingRight: 6, fontSize: 12, textColor: Black(0.5) }, // WHY no left: its text stands over the code.
            button: { height: 26, padding: 8, gap: 5, round: 6, fontSize: 12, iconSize: 14, textColor: Black(0.6), hoverColor: Black(0.07) },
        },
        codeStyleName: "light", // The package of CodeEditor whose colors the code takes
        empty: { fontSize: 14, textColor: Black(0.45) },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3 },
    },
};

const MarkdownView = function (params = {}) {

    // Merge style package: params.style > MarkdownView.styles[styleName] > MarkdownViewDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, MarkdownView.styles, MarkdownViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, MarkdownViewDefaults);

    // WHY before startObject: box.height never reads "auto".
    const isAutoHeight = (String(params.height) === "auto");

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let entries = []; // { key, object }: the blocks on the view, in order
    const headingLabels = new Map(); // id -> the label of a heading
    let cancelDraw = null;
    let isFollowing = 1; // 1: the reader is at the end, and the view follows it
    let lastScrollTop = 0;
    const DRAW_DELAY = 33; // ms: pieces of a text that come faster are drawn together
    const BOTTOM_SPACE = 30; // px: this near to the end is at the end
    const HEADING_SPACE = 12; // px: above a heading the view goes to
    const COPIED_TIME = 1500; // ms: how long the button says it is copied

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.markdownText, box.emptyText...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, MarkdownView.styles, MarkdownViewDefaults);
        mergeIntoIfMissing(fresh, MarkdownViewDefaults);
        return fresh.style;
    };

    const parseText = function () {
        return MarkdownView.parse(box.markdownText, { remotePictures: box.remotePictures });
    };

    // BLOCKS: each kind of block as objects

    const createTextLabel = function (html, look) {
        const label = Label(Object.assign({ width: "100%", text: html, selectable: 1 }, look));
        label.elem.classList.add("markdown-view-text");
        return label;
    };

    const createParagraph = function (block, index, textColor) {
        return createTextLabel(block.html, {
            fontSize: _s.text.fontSize,
            lineHeight: Math.round(_s.text.fontSize * _s.text.lineRatio),
            textColor: textColor,
        });
    };

    const createHeading = function (block, index) {
        const look = _s.heading;
        const fontSize = look.fontSizes[block.level - 1];
        const label = createTextLabel(block.html, {
            fontSize: fontSize,
            lineHeight: Math.round(fontSize * look.lineRatio),
            bold: 1,
            textColor: look.textColor,
            role: "heading",
            aria: { level: block.level },
        });
        if (index > 0) label.css.marginTop = look.spaces[block.level - 1] + "px";
        if (block.level <= 2) {
            label.css.borderBottom = "1px solid " + look.lineColor;
            label.css.paddingBottom = look.linePadding + "px";
        }
        headingLabels.set(block.id, label);
        return label;
    };

    const createQuote = function (block) {
        const look = _s.quote;
        // GROUP: A line on its left, its blocks in it
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.page.gap, clipContent: 0 });
        group.css.borderLeft = look.lineSize + "px solid " + look.lineColor;
        group.css.paddingLeft = look.padding + "px";
        group.css.boxSizing = "border-box";
            block.blocks.forEach(function (innerBlock, index) { createBlock(innerBlock, index, look.textColor); });
        endGroup();
        return group;
    };

    const createLine = function () {
        // BOX: A line across the text
        const line = Box({ width: "100%", height: 1, color: _s.line.color });
        line.css.margin = _s.line.space + "px 0";
        return line;
    };

    const showCopyState = function (button, isCopied) {
        const text = (isCopied) ? box.copiedText : box.copyText;
        button.text = MarkdownView.copyButtonHtml(text, isCopied);
        button.aria = { label: text };
    };

    const copyCode = function (button, code) {
        MarkdownView.copyToClipboard(code).then(function () {
            if (button.isRemoved) return;
            showCopyState(button, 1);
            box.after(COPIED_TIME, function () {
                if (!button.isRemoved) showCopyState(button, 0);
            });
        }).catch(function (error) {
            console.warn("MarkdownView: The code could not be copied. " + error);
        });
    };

    const createCopyButton = function (code) {
        const look = _s.code.button;
        // BUTTON: Copies the code
        const button = Button({
            width: "auto",
            height: look.height,
            color: "transparent",
            round: look.round,
            fontSize: look.fontSize,
            textColor: look.textColor,
            shrink: 0,
            css: { display: "flex", alignItems: "center", gap: look.gap + "px", padding: "0 " + look.padding + "px", whiteSpace: "nowrap" },
        });
        button.minimal = 1;
        button.elem.style.setProperty("--markdown-view-copy-icon", look.iconSize + "px");
        button.setFocusRing(_s.focus.ringColor);
        showCopyState(button, 0);
        button.onHoverChange(function (self, isOver) { self.color = (isOver) ? look.hoverColor : "transparent"; });
        button.on("click", function () { copyCode(button, code); });
        return button;
    };

    const createCode = function (block) {
        const look = _s.code;
        const card = VGroup({ width: "100%", height: "auto", align: "left top", color: look.color, border: look.border, borderColor: look.borderColor, round: look.round });
            // GROUP: Its language and its button
            const bar = HGroup({ width: "100%", height: look.bar.height, align: "left center", shrink: 0 });
            bar.css.padding = "0 " + look.bar.paddingRight + "px 0 " + look.padding[0] + "px";
            bar.css.boxSizing = "border-box";
                Label({ plainText: block.language, fontSize: look.bar.fontSize, textColor: look.bar.textColor, grow: 1, ellipsis: 1 });
                createCopyButton(block.code);
            endGroup();
            // GROUP: Its lines. WHY scrollX: a line of code is not wrapped.
            const lines = VGroup({ width: "100%", height: "auto", align: "left top", padding: look.padding, clipContent: 0 });
            lines.scrollX = 1;
            lines.css.paddingBottom = look.bottomPadding + "px";
                const label = Label({
                    text: MarkdownView.codeHtml(block.code, block.language),
                    fontSize: look.fontSize,
                    lineHeight: look.lineHeight,
                    textColor: look.textColor,
                    selectable: 1,
                    css: { fontFamily: look.fontFamily, whiteSpace: "pre", width: "max-content", minWidth: "100%", overflow: "visible" },
                });
                label.elem.classList.add("markdown-view-code");
            endGroup();
        endGroup();
        return card;
    };

    const createBlock = function (block, index, textColor) {
        if (block.type === "heading") return createHeading(block, index);
        if (block.type === "quote") return createQuote(block);
        if (block.type === "code") return createCode(block);
        if (block.type === "line") return createLine();
        return createParagraph(block, index, textColor);
    };

    // What stayed the same stays on the page, with its selection. WHY: a text that comes piece by piece changes only at its end.
    const drawText = function () {
        cancelDraw = null;
        const blocks = parseText().blocks;
        const keys = blocks.map(function (block) { return JSON.stringify(block); });
        let sameCount = 0;
        while (sameCount < entries.length && entries[sameCount].key === keys[sameCount]) sameCount++;
        entries.splice(sameCount).forEach(function (entry) { entry.object.remove(); });
        createIn(box.blockGroup, function () {
            for (let index = sameCount; index < blocks.length; index++) {
                entries.push({ key: keys[index], object: createBlock(blocks[index], index, _s.text.textColor) });
            }
        });
        paintEmpty();
    };

    const drawAgain = function () {
        const scrollTop = (box.scrollArea) ? box.scrollArea.elem.scrollTop : 0;
        entries.forEach(function (entry) { entry.object.remove(); });
        entries = [];
        drawText();
        if (box.scrollArea) box.scrollArea.elem.scrollTop = scrollTop;
    };

    // PAINT: the text of an empty view
    const paintEmpty = function () {
        const isEmpty = (entries.length === 0 && box.emptyText !== "");
        box.lblEmpty.plainText = box.emptyText;
        box.lblEmpty.visible = (isEmpty) ? 1 : 0;
    };

    const isSelectingText = function () {
        const selection = window.getSelection();
        return !!(selection && !selection.isCollapsed && box.elem.contains(selection.anchorNode));
    };

    const isAtEnd = function () {
        if (!box.scrollArea) return true;
        const elem = box.scrollArea.elem;
        return (elem.scrollHeight - elem.scrollTop - elem.clientHeight <= BOTTOM_SPACE);
    };

    const goToEnd = function () {
        const elem = box.scrollArea.elem;
        elem.scrollTop = elem.scrollHeight;
        lastScrollTop = elem.scrollTop; // WHY: Its scroll event comes a frame late, when more text may have come: not a scroll up.
    };

    const followEnd = function () {
        if (!box.scrollArea || box.autoScroll != 1 || !isFollowing || isSelectingText()) return;
        goToEnd();
    };

    const drawNewPieces = function () {
        drawText();
        followEnd();
    };

    // The reader moved: at the end the view follows again, above it the view stays.
    const onScroll = function () {
        const scrollTop = box.scrollArea.elem.scrollTop;
        if (scrollTop === lastScrollTop) return;
        lastScrollTop = scrollTop;
        isFollowing = isAtEnd() ? 1 : 0;
    };

    const onBlockClick = function (self, event) {
        const link = event.target.closest("a");
        if (!link) return;
        const address = link.getAttribute("href");
        if (address.charAt(0) === "#") {
            event.preventDefault(); // WHY: The address of the page stays: a site can have its own pages after a "#".
            box.scrollToHeading(address.slice(1));
            return;
        }
        if (typeof box.onLinkClick !== "function") return;
        event.preventDefault();
        box.onLinkClick(box, address);
    };

    const applyScrollBarLook = function () {
        if (!box.scrollBar) return;
        Object.assign(box.scrollBar, _s.scrollBar);
        box.scrollBar.boxScrollBarTop.color = _s.scrollBar.bar_color;
        box.scrollBar.boxScrollBarLeft.color = _s.scrollBar.bar_color;
    };

    const refreshScroll = function () {
        if (box.scrollBar && box.scrollBar.refreshScroll) box.scrollBar.refreshScroll();
    };

    // WHY variables: the parts of a text are HTML in a Label, and only a style sheet reaches them.
    const applyTextColors = function () {
        const variables = {
            "--markdown-view-soft": _s.text.softColor,
            "--markdown-view-strong": _s.text.strongColor,
            "--markdown-view-link": _s.link.color,
            "--markdown-view-link-line": _s.link.lineColor,
            "--markdown-view-inline-code": _s.inlineCode.color,
            "--markdown-view-table-line": _s.table.lineColor,
            "--markdown-view-table-head": _s.table.headColor,
            "--markdown-view-check": _s.check.color,
            "--markdown-view-check-on": _s.check.onColor,
            "--markdown-view-check-mark": _s.check.markColor,
            "--markdown-view-ring": _s.focus.ringColor,
            "--markdown-view-mono": _s.code.fontFamily,
        };
        Object.assign(variables, MarkdownView.codeColors(_s.codeStyleName));
        Object.keys(variables).forEach(function (name) { box.elem.style.setProperty(name, variables[name]); });
    };

    const applyLook = function () {
        box.props(_s.box);
        box.blockGroup.gap = _s.page.gap;
        box.blockGroup.padding = _s.page.padding;
        box.blockGroup.css.maxWidth = _s.page.maxWidth + "px";
        box.lblEmpty.props({ fontSize: _s.empty.fontSize, textColor: _s.empty.textColor });
        if (box.scrollArea) box.scrollArea.setFocusRing(_s.focus.ringColor);
        applyTextColors();
        applyScrollBarLook();
    };

    // *** PUBLIC FUNCTIONS:

    // The scroll stays where it is. A new document: scrollToTop() after it.
    box.setMarkdownText = function (text) {
        box.markdownText = (text === null || text === undefined) ? "" : String(text);
        drawText();
        isFollowing = isAtEnd() ? 1 : 0;
    };
 // USAGE: view.setMarkdownText("# A title")

    // The next piece of the text. WHY later: a stream brings many small pieces, and they are drawn together.
    box.appendText = function (text) {
        if (text === null || text === undefined) return;
        box.markdownText += String(text);
        if (!cancelDraw) cancelDraw = box.after(DRAW_DELAY, drawNewPieces);
    };
    // USAGE: view.appendText(" and the next words")

    box.getMarkdownText = function () {
        return box.markdownText;
    };

    box.clear = function () {
        box.setMarkdownText("");
    };

    box.setEmptyText = function (text) {
        box.emptyText = (text === null || text === undefined) ? "" : String(text);
        paintEmpty();
    };

    box.setAutoScroll = function (value) {
        box.autoScroll = basic.isOn(value) ? 1 : 0;
        if (box.autoScroll == 1) box.scrollToEnd();
    };
    // USAGE: get: view.autoScroll, set: view.setAutoScroll(0)

    // [{ id, level, text }]: for a list of the headings next to the text. A heading in a quote too.
    box.getHeadings = function () {
        return MarkdownView.headingsOf(parseText().blocks);
    };

    // id: as in getHeadings(), or its text as it is written in a link ("#a-heading").
    box.scrollToHeading = function (id) {
        const label = headingLabels.get(MarkdownView.slug(id));
        if (!label || label.isRemoved) return;
        if (!box.scrollArea) {
            label.elem.scrollIntoView({ block: "start" });
            return;
        }
        const area = box.scrollArea.elem;
        const distance = label.elem.getBoundingClientRect().top - area.getBoundingClientRect().top;
        area.scrollTop = Math.max(0, area.scrollTop + distance - HEADING_SPACE);
    };
    // USAGE: view.scrollToHeading("a-heading")

    box.scrollToTop = function () {
        if (box.scrollArea) box.scrollArea.elem.scrollTop = 0;
    };

    // It goes to the end, and follows again.
    box.scrollToEnd = function () {
        if (!box.scrollArea) return;
        isFollowing = 1;
        goToEnd();
    };

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
        drawAgain();
    };
    // USAGE: view.setTheme("dark")

    // *** OBJECT VIEW:

    const createBlockGroup = function () {
        // GROUP: The blocks. WHY position: a relative group makes a box of height "auto" wrap it.
        box.blockGroup = VGroup({ width: "100%", height: "auto", align: "left top", position: "relative", clipContent: 0 });
        box.blockGroup.css.margin = "0 auto"; // WHY: In a wide window the text stands in the middle.
        box.blockGroup.css.boxSizing = "border-box";
            box.lblEmpty = Label({ width: "100%", textAlign: "center", visible: 0 });
        endGroup();
    };

    if (isAutoHeight) {
        createBlockGroup();
    } else {
        // BOX: The place that scrolls
        box.scrollArea = startBox({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });
        box.scrollArea.scrollY = 1;
        box.scrollArea.role = "document";
        box.scrollArea.aria = { label: box.ariaLabel };
        box.scrollArea.tabIndex = 0; // WHY: The keys of a focused box scroll it (arrows, Page Up, Home, End).
            createBlockGroup();
        endBox();
        if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
            box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollArea, neverHide: 0, showDots: 0 }, _s.scrollBar));
        }
    }

    // *** OBJECT INIT CODE:

    MarkdownView.addCss();
    applyLook();
    box.listenTo(box.blockGroup.elem, "click", onBlockClick);
    if (box.scrollArea) {
        box.scrollArea.on("scroll", onScroll);
        box.blockGroup.onResize(refreshScroll);
    }
    box.setMarkdownText(box.markdownText);

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS: THE LOOK OF THE PARTS OF A TEXT

MarkdownView.addCss = function () {
    basic.addCss("markdown-view",
        ".markdown-view-text { overflow-wrap: break-word; }" +
        ".markdown-view-text strong { font-family: opensans-bold; font-weight: normal; color: var(--markdown-view-strong); }" +
        '.markdown-view-text[role="heading"] strong { color: inherit; }' +
        ".markdown-view-text em { font-style: italic; }" +
        ".markdown-view-text del { opacity: 0.7; }" +
        ".markdown-view-text code { font-family: var(--markdown-view-mono); font-size: 0.87em; padding: 0.12em 0.36em; border-radius: 4px;" +
        " background: var(--markdown-view-inline-code); }" +
        ".markdown-view-text a { color: var(--markdown-view-link); text-decoration: none; border-bottom: 1px solid var(--markdown-view-link-line); }" +
        ".markdown-view-text a:hover { border-bottom-color: var(--markdown-view-link); }" +
        ".markdown-view-text a:focus-visible { outline: 2px solid var(--markdown-view-ring); outline-offset: 2px; border-radius: 2px; }" +
        ".markdown-view-text img { max-width: 100%; height: auto; border-radius: 6px; vertical-align: top; }" +
        ".markdown-view-text ul, .markdown-view-text ol { margin: 0; padding-left: 24px; }" +
        ".markdown-view-text li { margin: 4px 0; padding-left: 2px; }" +
        ".markdown-view-text li::marker { color: var(--markdown-view-soft); }" +
        ".markdown-view-text li.markdown-view-task { list-style: none; margin-left: -20px; }" +
        ".markdown-view-check { display: inline-block; box-sizing: border-box; width: 15px; height: 15px; margin-right: 8px; vertical-align: -2px;" +
        " border: 1.5px solid var(--markdown-view-check); border-radius: 4px; }" +
        ".markdown-view-check-on { background: var(--markdown-view-check-on); border-color: var(--markdown-view-check-on); position: relative; }" +
        // WHY a turned corner: a check mark with no icon file, in the color of the package.
        ".markdown-view-check-on::after { content: ''; position: absolute; left: 3.5px; top: 0.5px; width: 3px; height: 7px;" +
        " border: solid var(--markdown-view-check-mark); border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }" +
        ".markdown-view-table { overflow-x: auto; }" +
        ".markdown-view-table table { border-collapse: collapse; font-size: 0.93em; }" +
        ".markdown-view-table th, .markdown-view-table td { border: 1px solid var(--markdown-view-table-line); padding: 7px 10px; text-align: left; vertical-align: top; }" +
        ".markdown-view-table th { font-family: opensans-bold; font-weight: normal; background: var(--markdown-view-table-head); }" +
        ".markdown-view-copy-icon { display: block; flex-shrink: 0; width: var(--markdown-view-copy-icon); height: var(--markdown-view-copy-icon); pointer-events: none; }" +
        ".markdown-view-copy-icon svg { display: block; width: 100%; height: 100%; }" +
        MarkdownView.CODE_KINDS.map(function (kind) {
            return ".markdown-view-code .code-editor-" + kind + " { color: var(--markdown-view-kind-" + kind + "); }";
        }).join(""));
};

MarkdownView.CODE_KINDS = ["keyword", "string", "number", "comment", "builtin", "function", "property", "tag", "attribute", "variable"];

// The colors of the code as style variables. WHY from CodeEditor: one list of colors for the code of the kit.
MarkdownView.codeColors = function (styleName) {
    const variables = {};
    if (typeof CodeEditor === "undefined") return variables;
    const kinds = Object.assign({}, CodeEditor.styles.light.kinds, (CodeEditor.styles[styleName] || {}).kinds);
    MarkdownView.CODE_KINDS.forEach(function (kind) { variables["--markdown-view-kind-" + kind] = kinds[kind]; });
    return variables;
};

MarkdownView.ICONS = {
    copy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M5 13l4.5 4.5L19 7"/></svg>',
};

MarkdownView.copyButtonHtml = function (text, isCopied) {
    const icon = (isCopied) ? MarkdownView.ICONS.check : MarkdownView.ICONS.copy;
    return '<span class="markdown-view-copy-icon">' + icon + "</span><span>" + basic.escapeHtml(text) + "</span>";
};

// Returns a Promise.
MarkdownView.copyToClipboard = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    // WHY: A page opened from a file (the window of a program) has no navigator.clipboard.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position: fixed; left: -9999px; top: 0;";
    document.body.appendChild(area);
    area.select();
    const isCopied = document.execCommand("copy");
    area.remove();
    return (isCopied) ? Promise.resolve() : Promise.reject(new Error("The browser refused it."));
};

// *** THE COLORS OF THE CODE:

MarkdownView.LANGUAGE_NAMES = {
    py: "python", python3: "python",
    js: "javascript", jsx: "javascript", ts: "javascript", tsx: "javascript", typescript: "javascript", node: "javascript",
    sh: "bash", shell: "bash", zsh: "bash", console: "bash",
    htm: "html", xml: "html", svg: "html",
};
MarkdownView.MAX_COLORED_LETTERS = 200000; // WHY: A longer code stays plain: a stream must not wait for the colors.

// A code as HTML: colored when comp/code-editor.js is loaded and knows the language.
MarkdownView.codeHtml = function (code, language) {
    const name = MarkdownView.LANGUAGE_NAMES[language] || language;
    const definition = (typeof CodeEditor !== "undefined") ? CodeEditor.languages[name] : null;
    if (!definition || code.length > MarkdownView.MAX_COLORED_LETTERS) return basic.escapeHtml(code);
    let state = null;
    return code.split("\n").map(function (line) {
        const result = CodeEditor.tokenizeLine(line, state, definition);
        state = result.state;
        return result.parts.map(CodeEditor.partHtml).join("");
    }).join("\n");
};

// *** THE PARSER: a text -> blocks, with no view. Every text in a block is safe HTML.
// { type: "heading", level, html, text, id }, { type: "p", html }, { type: "list", html }, { type: "table", html },
// { type: "quote", blocks }, { type: "code", language, code }, { type: "line" }

// options: { remotePictures: 1 }. Returns { blocks, title }.
MarkdownView.parse = function (text, options = {}) {
    const context = { usedIds: Object.create(null), remotePictures: basic.isOn(options.remotePictures) }; // WHY null: a heading can be named "constructor".
    const lines = String((text === null || text === undefined) ? "" : text).replace(/\r\n?/g, "\n").split("\n");
    const blocks = MarkdownView.parseBlocks(lines, context);
    const firstHeading = MarkdownView.headingsOf(blocks).find(function (heading) { return heading.level === 1; });
    return { blocks: blocks, title: (firstHeading) ? firstHeading.text : "" };
};

MarkdownView.headingsOf = function (blocks) {
    const headings = [];
    blocks.forEach(function (block) {
        if (block.type === "heading") headings.push({ id: block.id, level: block.level, text: block.text });
        if (block.type === "quote") headings.push.apply(headings, MarkdownView.headingsOf(block.blocks));
    });
    return headings;
};

MarkdownView.RE = {
    fence: /^(\s*)(`{3,}|~{3,})\s*([^\s`]*)[^`]*$/,
    heading: /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/,
    underline: /^\s{0,3}(=+|-{2,})\s*$/,
    line: /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/,
    quote: /^\s*>/,
    listItem: /^(\s*)([-*+]|\d+[.)])\s+(.*)$/,
    listNextLine: /^\s{2,}\S/,
    task: /^\[( |x|X)\]\s+(.*)$/,
    tableDivider: /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/,
    hardBreak: / {2,}$|\\$/,
};

MarkdownView.parseBlocks = function (lines, context) {
    const reader = { lines: lines, at: 0, blocks: [], context: context };
    while (reader.at < lines.length) {
        if (lines[reader.at].trim()) {
            MarkdownView.BLOCK_READERS.find(function (read) { return read(reader); });
        } else {
            reader.at++;
        }
    }
    return reader.blocks;
};

MarkdownView.isTableStart = function (lines, at) {
    if (lines[at].indexOf("|") === -1 || at + 1 >= lines.length) return false;
    if (!MarkdownView.RE.tableDivider.test(lines[at + 1])) return false;
    return (MarkdownView.tableCells(lines[at]).length === MarkdownView.tableCells(lines[at + 1]).length);
};

// A line that ends a paragraph.
MarkdownView.isBlockStart = function (lines, at) {
    const RE = MarkdownView.RE;
    const line = lines[at];
    return (RE.fence.test(line) || RE.heading.test(line) || RE.line.test(line) || RE.quote.test(line) || RE.listItem.test(line) || MarkdownView.isTableStart(lines, at));
};

MarkdownView.uniqueId = function (text, usedIds) {
    const id = MarkdownView.slug(text) || "section";
    usedIds[id] = (usedIds[id] || 0) + 1;
    return (usedIds[id] > 1) ? id + "-" + usedIds[id] : id;
};

MarkdownView.headingBlock = function (level, raw, context) {
    const text = MarkdownView.plainText(raw);
    return { type: "heading", level: level, html: MarkdownView.inlineHtml(raw, context), text: text, id: MarkdownView.uniqueId(text, context.usedIds) };
};

// *** Each reader reads one block at reader.at and returns true, or leaves it and returns false.

MarkdownView.readCode = function (reader) {
    const open = MarkdownView.RE.fence.exec(reader.lines[reader.at]);
    if (!open) return false;
    const indentOfLine = new RegExp("^ {0," + open[1].length + "}"); // WHY: A code in a list is written further in.
    const closing = new RegExp("^\\s*" + open[2].charAt(0) + "{" + open[2].length + ",}\\s*$");
    const code = [];
    reader.at++;
    // WHY no error at the end of the text: a code without its last line is a code that is still coming.
    while (reader.at < reader.lines.length && !closing.test(reader.lines[reader.at])) {
        code.push(reader.lines[reader.at].replace(indentOfLine, ""));
        reader.at++;
    }
    reader.at++;
    reader.blocks.push({ type: "code", language: open[3].toLowerCase(), code: code.join("\n") });
    return true;
};

MarkdownView.readHeading = function (reader) {
    const match = MarkdownView.RE.heading.exec(reader.lines[reader.at]);
    if (!match) return false;
    reader.blocks.push(MarkdownView.headingBlock(match[1].length, match[2], reader.context));
    reader.at++;
    return true;
};

// A title, and a line of === or --- under it.
MarkdownView.readUnderlinedHeading = function (reader) {
    const next = reader.lines[reader.at + 1];
    const match = (next === undefined) ? null : MarkdownView.RE.underline.exec(next);
    if (!match || MarkdownView.isBlockStart(reader.lines, reader.at)) return false;
    const level = (match[1].charAt(0) === "=") ? 1 : 2;
    reader.blocks.push(MarkdownView.headingBlock(level, reader.lines[reader.at].trim(), reader.context));
    reader.at += 2;
    return true;
};

MarkdownView.readLine = function (reader) {
    if (!MarkdownView.RE.line.test(reader.lines[reader.at])) return false;
    reader.blocks.push({ type: "line" });
    reader.at++;
    return true;
};

MarkdownView.readQuote = function (reader) {
    const RE = MarkdownView.RE;
    if (!RE.quote.test(reader.lines[reader.at])) return false;
    const inner = [];
    while (reader.at < reader.lines.length && RE.quote.test(reader.lines[reader.at])) {
        inner.push(reader.lines[reader.at].replace(/^\s*>\s?/, ""));
        reader.at++;
    }
    reader.blocks.push({ type: "quote", blocks: MarkdownView.parseBlocks(inner, reader.context) });
    return true;
};

MarkdownView.isLineOfList = function (line) {
    const RE = MarkdownView.RE;
    if (!line.trim() || RE.fence.test(line) || RE.line.test(line)) return false;
    return (RE.listItem.test(line) || RE.listNextLine.test(line));
};

MarkdownView.readList = function (reader) {
    if (!MarkdownView.RE.listItem.test(reader.lines[reader.at])) return false;
    const lines = [];
    while (reader.at < reader.lines.length && MarkdownView.isLineOfList(reader.lines[reader.at])) {
        lines.push(reader.lines[reader.at]);
        reader.at++;
    }
    reader.blocks.push({ type: "list", html: MarkdownView.listHtml(lines, reader.context) });
    return true;
};

MarkdownView.readTable = function (reader) {
    if (!MarkdownView.isTableStart(reader.lines, reader.at)) return false;
    const head = reader.lines[reader.at];
    const divider = reader.lines[reader.at + 1];
    const rows = [];
    reader.at += 2;
    while (reader.at < reader.lines.length && reader.lines[reader.at].indexOf("|") > -1 && reader.lines[reader.at].trim()) {
        rows.push(reader.lines[reader.at]);
        reader.at++;
    }
    reader.blocks.push({ type: "table", html: MarkdownView.tableHtml(head, divider, rows, reader.context) });
    return true;
};

// WHY last: every other line is a paragraph. It always takes a line, so the parser always goes on.
MarkdownView.readParagraph = function (reader) {
    const lines = [];
    while (reader.at < reader.lines.length && reader.lines[reader.at].trim()) {
        if (lines.length && MarkdownView.isBlockStart(reader.lines, reader.at)) break;
        lines.push(reader.lines[reader.at]);
        reader.at++;
    }
    const html = lines.map(function (line, index) {
        const hasBreak = (MarkdownView.RE.hardBreak.test(line) && index < lines.length - 1);
        const text = line.trim().replace(/\\$/, "");
        return MarkdownView.inlineHtml(text, reader.context) + ((hasBreak) ? "<br>" : " ");
    }).join("");
    reader.blocks.push({ type: "p", html: html.trim() });
    return true;
};

MarkdownView.BLOCK_READERS = [
    MarkdownView.readCode,
    MarkdownView.readHeading,
    MarkdownView.readUnderlinedHeading,
    MarkdownView.readLine,
    MarkdownView.readQuote,
    MarkdownView.readList,
    MarkdownView.readTable,
    MarkdownView.readParagraph,
];

// *** A LIST:

MarkdownView.readListItems = function (lines) {
    const items = [];
    lines.forEach(function (line) {
        const match = MarkdownView.RE.listItem.exec(line);
        if (match) {
            const isOrdered = /\d/.test(match[2]);
            items.push({ indent: match[1].replace(/\t/g, "    ").length, isOrdered: isOrdered, start: parseInt(match[2], 10), text: match[3] });
        } else if (items.length) {
            items[items.length - 1].text += " " + line.trim();
        }
    });
    return items;
};

MarkdownView.listItemHtml = function (item, context) {
    const task = MarkdownView.RE.task.exec(item.text);
    if (!task) return "<li>" + MarkdownView.inlineHtml(item.text, context);
    const checkClass = (task[1] === " ") ? "markdown-view-check" : "markdown-view-check markdown-view-check-on";
    return '<li class="markdown-view-task"><span class="' + checkClass + '"></span>' + MarkdownView.inlineHtml(task[2], context);
};

// WHY start: a text between the items of a list makes two lists, and the numbers must go on.
MarkdownView.listStartHtml = function (item) {
    if (!item.isOrdered) return "<ul>";
    return (item.start === 1) ? "<ol>" : '<ol start="' + item.start + '">';
};

// By the spaces in front of the items: further in is a list in the item above.
MarkdownView.listHtml = function (lines, context) {
    const items = MarkdownView.readListItems(lines);
    let position = 0;
    const drawLevel = function (indent) {
        const first = items[position];
        let html = MarkdownView.listStartHtml(first);
        while (position < items.length && items[position].indent === indent) {
            html += MarkdownView.listItemHtml(items[position], context);
            position++;
            if (position < items.length && items[position].indent > indent) html += drawLevel(items[position].indent);
            html += "</li>";
        }
        return html + ((first.isOrdered) ? "</ol>" : "</ul>");
    };
    let html = "";
    while (position < items.length) html += drawLevel(items[position].indent);
    return html;
};

// *** A TABLE:

// WHY the mark: a "\|" is a letter of a cell, not its end.
MarkdownView.tableCells = function (row) {
    const PIPE_MARK = "\u0001";
    return row.trim().replace(/\\\|/g, PIPE_MARK).replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (cell) {
        return cell.split(PIPE_MARK).join("|").trim();
    });
};

// ":--" left, ":--:" center, "--:" right
MarkdownView.tableAlign = function (dividerCell) {
    const isLeft = dividerCell.startsWith(":");
    const isRight = dividerCell.endsWith(":");
    if (isLeft && isRight) return "center";
    return (isRight) ? "right" : "";
};

MarkdownView.tableRowHtml = function (cells, tag, aligns, context) {
    let html = "<tr>";
    aligns.forEach(function (align, index) {
        const style = (align) ? ' style="text-align: ' + align + '"' : "";
        const text = (index < cells.length) ? cells[index] : "";
        html += "<" + tag + style + ">" + MarkdownView.inlineHtml(text, context) + "</" + tag + ">";
    });
    return html + "</tr>";
};

// WHY the box around it: a wide table scrolls in itself, the text stays where it is.
MarkdownView.tableHtml = function (head, divider, rows, context) {
    const aligns = MarkdownView.tableCells(divider).map(MarkdownView.tableAlign);
    const bodyHtml = rows.map(function (row) {
        return MarkdownView.tableRowHtml(MarkdownView.tableCells(row), "td", aligns, context);
    }).join("");
    return '<div class="markdown-view-table"><table><thead>' + MarkdownView.tableRowHtml(MarkdownView.tableCells(head), "th", aligns, context) +
        "</thead><tbody>" + bodyHtml + "</tbody></table></div>";
};

// *** IN A LINE:

MarkdownView.KEEP_MARK = "\u0000"; // Around the number of a part that is ready

MarkdownView.INLINE_RE = {
    code: /(`+)\s?([^`]|[^`].*?[^`])\s?\1(?!`)/g,
    letter: /\\([!-/:-@[-`{-~])/g, // A "\" before any mark of ASCII
    picture: /!\[((?:\\.|[^\]\\])*)\]\(\s*<?((?:[^()\s<>]|\([^()\s]*\))+)>?(?:\s+"[^"]*")?\s*\)/g,
    link: /\[((?:\\.|[^[\]\\]|\[[^\]]*\])*)\]\(\s*<?((?:[^()\s<>]|\([^()\s]*\))+)>?(?:\s+"[^"]*")?\s*\)/g,
    bareAddress: /(^|[\s(*_~])(https?:\/\/[^\s<>]+[^\s<>.,;:)!?'"*_~])/g,
    lineBreak: /&lt;br\s*\/?&gt;/gi,
    strong: /\*\*([^\s*](?:.*?[^\s*])?)\*\*/g,
    strongLine: /(^|[^\w])__([^\s_](?:.*?[^\s_])?)__(?!\w)/g,
    emphasis: /(^|[^*\w])\*([^\s*](?:.*?[^\s*])?)\*(?!\*)/g,
    emphasisLine: /(^|[^\w])_([^\s_](?:.*?[^\s_])?)_(?!\w)/g,
    deleted: /~~([^\s~](?:.*?[^\s~])?)~~/g,
};

// A text of a line as safe HTML. WHY the kept parts: what is inside a code or an address is not read as Markdown again.
MarkdownView.inlineHtml = function (text, context) {
    const kept = [];
    const keep = function (html) {
        kept.push(html);
        return MarkdownView.KEEP_MARK + (kept.length - 1) + MarkdownView.KEEP_MARK;
    };
    const html = MarkdownView.formatLine(String(text).split(MarkdownView.KEEP_MARK).join(""), keep, context);
    return MarkdownView.putKeptParts(html, kept);
};

MarkdownView.putKeptParts = function (html, kept) {
    const keptPart = new RegExp(MarkdownView.KEEP_MARK + "(\\d+)" + MarkdownView.KEEP_MARK, "g");
    let result = html;
    // WHY again: the label of a link holds kept parts too.
    while (result.indexOf(MarkdownView.KEEP_MARK) > -1) {
        result = result.replace(keptPart, function (all, number) { return kept[Number(number)]; });
    }
    return result;
};

MarkdownView.formatLine = function (text, keep, context) {
    const RE = MarkdownView.INLINE_RE;
    let html = text.replace(RE.code, function (all, marks, code) {
        return keep("<code>" + basic.escapeHtml(code) + "</code>");
    });
    // WHY the addresses before the "\*" letters: a letter that is kept can not be checked, and "a\_b" is an address too.
    html = html.replace(RE.picture, function (all, description, address) {
        return keep(MarkdownView.pictureHtml(MarkdownView.removeEscapes(address), MarkdownView.removeEscapes(description), context));
    });
    html = html.replace(RE.link, function (all, label, address) {
        return keep(MarkdownView.linkHtml(MarkdownView.removeEscapes(address), MarkdownView.formatLine(label, keep, context)));
    });
    html = html.replace(RE.letter, function (all, letter) { return keep(basic.escapeHtml(letter)); });
    html = html.replace(RE.bareAddress, function (all, before, address) {
        return before + keep(MarkdownView.linkHtml(address, basic.escapeHtml(address)));
    });
    return MarkdownView.formatWords(basic.escapeHtml(html));
};

MarkdownView.removeEscapes = function (text) {
    return text.replace(MarkdownView.INLINE_RE.letter, "$1");
};

MarkdownView.formatWords = function (html) {
    const RE = MarkdownView.INLINE_RE;
    return html
        .replace(RE.lineBreak, "<br>")
        .replace(RE.strong, "<strong>$1</strong>")
        .replace(RE.strongLine, "$1<strong>$2</strong>")
        .replace(RE.emphasis, "$1<em>$2</em>")
        .replace(RE.emphasisLine, "$1<em>$2</em>")
        .replace(RE.deleted, "<del>$1</del>");
};

// *** ADDRESSES:

MarkdownView.LINK_SCHEMES = /^(https?|mailto|tel):/i;
MarkdownView.PICTURE_SCHEMES = /^(https?:|data:image\/)/i;
MarkdownView.REMOTE_ADDRESS = /^(https?:)?\/\//i;
MarkdownView.ANY_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

// WHY the clean text: a browser leaves out these letters in an address, so "java&#9;script:" and "java\tscript:" run as "javascript:".
MarkdownView.isSafeAddress = function (address, safeSchemes) {
    if (address.indexOf(MarkdownView.KEEP_MARK) > -1) return false; // WHY: A part that comes back later could hide its scheme.
    const clean = address.replace(/[\p{C}\p{Z}]/gu, "");
    return (!MarkdownView.ANY_SCHEME.test(clean) || safeSchemes.test(clean));
};

// A safe address is a link; any other one stays its text.
MarkdownView.linkHtml = function (address, labelHtml) {
    if (!MarkdownView.isSafeAddress(address, MarkdownView.LINK_SCHEMES)) return labelHtml;
    const newTab = (address.charAt(0) === "#") ? "" : ' target="_blank" rel="noopener noreferrer"';
    return '<a href="' + basic.escapeHtml(address) + '"' + newTab + ">" + labelHtml + "</a>";
};

MarkdownView.pictureHtml = function (address, description, context) {
    const text = basic.escapeHtml(description);
    if (!MarkdownView.isSafeAddress(address, MarkdownView.PICTURE_SCHEMES)) return text;
    if (!context.remotePictures && MarkdownView.REMOTE_ADDRESS.test(address)) return MarkdownView.linkHtml(address, text || basic.escapeHtml(address));
    return '<img src="' + basic.escapeHtml(address) + '" alt="' + text + '">';
};

// *** TEXTS:

// A text without the marks of Markdown (a heading in a list of headings).
MarkdownView.plainText = function (text) {
    return String(text)
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[`*~]/g, "")
        .replace(/(^|\s)_+|_+(\s|$)/g, "$1$2")
        .replace(/\s+/g, " ")
        .trim();
};

// "Çalışma Özeti" -> "calisma-ozeti". WHY ı apart: it has no accent to take off.
MarkdownView.slug = function (text) {
    return String(text)
        .replace(/[ıİ]/g, "i")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
};

// *** STYLE PACKAGES:
// USAGE: MarkdownView({ styleName: "dark" })
// USAGE: MarkdownView({ style: { text: { fontSize: 16 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: MarkdownView.styles.myStyle = { box: { color: "#FFFDF5" } };
MarkdownView.styles = {

    // A white page.
    light: MarkdownViewDefaults.style,

    // For a dark window; the code takes the dark colors of CodeEditor.
    dark: {
        box: { color: "#1C1C1B" },
        text: { textColor: White(0.8), softColor: White(0.5), strongColor: White(0.94) },
        heading: { textColor: White(0.94), lineColor: White(0.12) },
        link: { color: "#6FC6CD", lineColor: "rgba(111, 198, 205, 0.35)" },
        inlineCode: { color: White(0.1) },
        quote: { textColor: White(0.62), lineColor: White(0.2) },
        table: { lineColor: White(0.16), headColor: White(0.06) },
        line: { color: White(0.14) },
        check: { color: White(0.35), onColor: "#6FC6CD", markColor: "#1C1C1B" },
        code: {
            color: "#232322",
            borderColor: White(0.08),
            textColor: "#E6E6E3",
            bar: { textColor: White(0.5) },
            button: { textColor: White(0.65), hoverColor: White(0.09) },
        },
        codeStyleName: "dark",
        empty: { textColor: White(0.5) },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
    },

};
