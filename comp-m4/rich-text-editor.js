/* Bismillah */

/*

RichTextEditor - v26.09

UI COMPONENT TEMPLATE
- A simple rich text editor: a toolbar and a writing area. (Basit editör nesnesi)
- Tools: bold, italic, underline, strike, heading (h2, h3), bullet / numbered list, quote, link,
  clear formatting, undo, redo. Choose them and their order with "tools" ("|" is a separator).
- The toolbar shows the format at the cursor (Ex: B is pressed inside bold text).
- Link: the link bar opens under the toolbar (no browser prompt). Ctrl / Cmd + K opens it too.
- Keyboard: Ctrl / Cmd + B, I, U (the browser), Ctrl / Cmd + Z undo. Tab leaves the editor (accessibility).
- Paste: "clean" (default) keeps only the allowed tags (the formats of the toolbar), "text" pastes plain text.
- getHtml() is always cleaned: only b, strong, i, em, u, s, strike, del, h2, h3, p, div, br, ul, ol, li,
  blockquote and a (href: http, https, mailto, tel or a relative address). No scripts, styles or events.
  setHtml() cleans its input the same way before it is shown.
- maxLength (characters of the text, 0: no limit) and a counter at the bottom right (showCounter: 1).
- placeholderText, readOnly, enabled. height: the whole editor. The writing area scrolls with
  basic/scroll-bar.js (if it is loaded).
- onChange(self) is called while the user writes. It is NOT called when the component is created or by setHtml().
- Everything is drawn with code (no image files needed).
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (RichTextEditor.styles)

USAGE:
const editor = RichTextEditor({
    width: 560,
    height: 300,
    placeholderText: "Write the product description...",
    onChange: function (self) { println(self.getHtml()); },
});
editor.setHtml("<p>Hello <b>world</b></p>");
editor.getHtml();       // "<p>Hello <b>world</b></p>"
editor.getText();       // "Hello world"
editor.isEmpty();       // 0
RichTextEditor({ tools: ["bold", "italic", "|", "ul", "ol"], maxLength: 500, showCounter: 1 });
RichTextEditor({ styleName: "dark", pasteAs: "text" });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const RichTextEditorDefaults = {
    key: "0",
    width: 560,
    height: 300,
    htmlText: "", // Start content (HTML, it is cleaned)
    placeholderText: "Write something...",
    tools: ["bold", "italic", "underline", "strike", "|", "h2", "h3", "|", "ul", "ol", "quote", "|", "link", "clear", "|", "undo", "redo"],
    pasteAs: "clean", // "clean": keeps the allowed formats, "text": plain text
    maxLength: 0, // Characters of the text. 0: no limit
    showCounter: 0, // 1: "120 / 500" (or "120 characters") at the bottom right
    readOnly: 0,
    enabled: 1,
    spellCheck: 1,
    useScrollBar: 1, // basic/scroll-bar.js for the writing area. 0: the scrollbar of the browser.
    ariaLabel: "Text editor",
    texts: {
        bold: "Bold",
        italic: "Italic",
        underline: "Underline",
        strike: "Strikethrough",
        h2: "Heading",
        h3: "Subheading",
        ul: "Bulleted list",
        ol: "Numbered list",
        quote: "Quote",
        link: "Link",
        clear: "Clear formatting",
        undo: "Undo",
        redo: "Redo",
        linkPlaceholder: "https://example.com",
        linkApply: "Apply",
        linkRemove: "Remove",
        counter: "{count} / {max}", // With maxLength
        counterNoLimit: "{count} characters", // Without maxLength
    },
    onChange: function (self) { }, // self.getHtml(), self.getText()
    onFocus: function (self) { },
    onBlur: function (self) { },
    styleName: "classic", // "classic", "modern", "dark" or a name added to RichTextEditor.styles
    style: { // Classic style package (default)
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 8,
        },
        boxFocus: {
            borderColor: "#141414",
        },
        toolbar: {
            color: "#F7F7F6",
            dividerColor: Black(0.1),
            padding: 6,
            gap: 2,
        },
        button: {
            size: 32,
            iconSize: 18,
            iconColor: "#4A4A48",
            hoverColor: Black(0.06),
            activeColor: Black(0.1),
            activeIconColor: "#141414",
            round: 6,
        },
        separator: {
            color: Black(0.12),
        },
        content: {
            fontSize: 15,
            lineHeight: 1.6,
            textColor: "#141414",
            fontFamily: "", // "": opensans
            padding: [16, 14], // [x, y]
            linkColor: "#2F6FB0",
            quoteColor: Black(0.6),
            quoteBorderColor: Black(0.2),
            placeholderColor: Black(0.35),
            selectionColor: "rgba(47, 111, 176, 0.2)",
        },
        linkBar: {
            color: "#F7F7F6",
            inputColor: White(1),
            inputBorderColor: Black(0.2),
            textColor: "#141414",
            buttonColor: "#141414",
            buttonTextColor: White(1),
            secondaryTextColor: Black(0.6),
        },
        counter: {
            fontSize: 12,
            textColor: Black(0.45),
            limitColor: "#C0392B", // At the limit
        },
        disabled: {
            opacity: 0.55,
        },
        scrollBar: {
            bar_color: "#9A9A98",
            bar_mouseOverColor: "#6A6A68",
            bar_width: 4,
            bar_round: 3,
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
        },
    }
};

const RichTextEditor = function (params = {}) {

    // Merge style package: params.style > RichTextEditor.styles[styleName] > RichTextEditorDefaults.style (classic)
    const _styleName = params.styleName || RichTextEditorDefaults.styleName;
    const _stylePackage = RichTextEditor.styles[_styleName];
    if (!_stylePackage) console.warn("RichTextEditor: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, RichTextEditorDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;

    RichTextEditor.injectCss();

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const buttons = {}; // tool name -> Label
    let savedRange = null; // The selection before the link bar took the focus
    let isFocused = 0;
    let lastHtml = "";

    // *** PUBLIC VARIABLES:
    // box.editor: the contenteditable element (a raw <div>, not a basic.js object)
    // NOTE: Default values are also public variables.

    // *** PRIVATE FUNCTIONS:

    const isEditable = function () {
        return box.enabled == 1 && box.readOnly != 1;
    };

    const textLength = function () {
        return box.editor.textContent.length;
    };

    const selectionIsInside = function () {
        const sel = window.getSelection();
        return sel && sel.rangeCount > 0 && box.editor.contains(sel.getRangeAt(0).commonAncestorContainer);
    };

    const saveSelection = function () {
        if (selectionIsInside()) savedRange = window.getSelection().getRangeAt(0).cloneRange();
    };

    const restoreSelection = function () {
        box.editor.focus({ preventScroll: true });
        if (!savedRange) return;
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
    };

    // The nearest block tag at the cursor: "h2", "h3", "blockquote", "p"...
    const currentBlock = function () {
        if (!selectionIsInside()) return "";
        let node = window.getSelection().getRangeAt(0).startContainer;
        while (node && node !== box.editor) {
            if (node.nodeType === 1 && /^(H2|H3|BLOCKQUOTE|P|DIV|LI)$/.test(node.nodeName)) {
                if (node.nodeName === "LI") { node = node.parentNode; continue; } // WHY: A list item inside a quote is still a quote.
                return node.nodeName.toLowerCase();
            }
            node = node.parentNode;
        }
        return "";
    };

    const currentLink = function () {
        if (!selectionIsInside()) return null;
        let node = window.getSelection().getRangeAt(0).startContainer;
        while (node && node !== box.editor) {
            if (node.nodeName === "A") return node;
            node = node.parentNode;
        }
        return null;
    };

    const exec = function (command, value = null) {
        document.execCommand(command, false, value);
    };

    // Toggles a block format: <h2> on a heading makes it a paragraph again.
    const toggleBlock = function (tag) {
        exec("formatBlock", (currentBlock() === tag) ? "<p>" : "<" + tag + ">");
    };

    const TOOLS = {
        bold: { run: function () { exec("bold"); }, state: function () { return document.queryCommandState("bold"); }, keys: "B" },
        italic: { run: function () { exec("italic"); }, state: function () { return document.queryCommandState("italic"); }, keys: "I" },
        underline: { run: function () { exec("underline"); }, state: function () { return document.queryCommandState("underline"); }, keys: "U" },
        strike: { run: function () { exec("strikeThrough"); }, state: function () { return document.queryCommandState("strikeThrough"); } },
        h2: { run: function () { toggleBlock("h2"); }, state: function () { return currentBlock() === "h2"; } },
        h3: { run: function () { toggleBlock("h3"); }, state: function () { return currentBlock() === "h3"; } },
        ul: { run: function () { exec("insertUnorderedList"); }, state: function () { return document.queryCommandState("insertUnorderedList"); } },
        ol: { run: function () { exec("insertOrderedList"); }, state: function () { return document.queryCommandState("insertOrderedList"); } },
        quote: { run: function () { toggleBlock("blockquote"); }, state: function () { return currentBlock() === "blockquote"; } },
        link: { run: function () { openLinkBar(); }, state: function () { return !!currentLink(); }, keys: "K" },
        clear: { run: function () { exec("removeFormat"); exec("unlink"); exec("formatBlock", "<p>"); }, state: function () { return false; } },
        undo: { run: function () { exec("undo"); }, state: function () { return false; }, keys: "Z" },
        redo: { run: function () { exec("redo"); }, state: function () { return false; } },
    };

    const updateToolbar = function () {
        if (!box) return;
        const inside = selectionIsInside();
        Object.keys(buttons).forEach(function (name) {
            const btn = buttons[name];
            const active = inside && isEditable() && TOOLS[name].state() ? 1 : 0;
            btn.isActive = active;
            btn.color = active ? _s.button.activeColor : "transparent";
            btn.textColor = active ? _s.button.activeIconColor : _s.button.iconColor;
            btn.elem.setAttribute("aria-pressed", active ? "true" : "false");
        });
    };

    const updatePlaceholder = function () {
        box.editor.classList.toggle("is-empty", box.isEmpty() == 1);
    };

    const updateCounter = function () {
        if (!box.lblCounter) return;
        const count = textLength();
        const template = (box.maxLength > 0) ? box.texts.counter : box.texts.counterNoLimit;
        box.lblCounter.plainText = template.replace("{count}", String(count)).replace("{max}", String(box.maxLength));
        box.lblCounter.textColor = (box.maxLength > 0 && count >= box.maxLength) ? _s.counter.limitColor : _s.counter.textColor;
    };

    const updateBorder = function () {
        box.borderColor = (isFocused && isEditable()) ? _s.boxFocus.borderColor : _s.box.borderColor;
    };

    // After every change of the content.
    const contentChanged = function (fireChange) {
        updatePlaceholder();
        updateCounter();
        updateToolbar();
        if (box.scrollBar) box.scrollBar.refreshScroll();
        if (!fireChange) { lastHtml = box.getHtml(); return; }
        const html = box.getHtml();
        if (html === lastHtml) return;
        lastHtml = html;
        box.onChange(box);
    };

    // Characters that can still be written (Infinity: no limit).
    const remaining = function () {
        if (!(box.maxLength > 0)) return Infinity;
        let selected = 0;
        if (selectionIsInside()) selected = window.getSelection().toString().length;
        return Math.max(0, box.maxLength - textLength() + selected);
    };

    const insertPlainText = function (text) {
        const room = remaining();
        if (text.length > room) text = text.slice(0, room);
        if (text) exec("insertText", text);
    };

    // *** LINK BAR:

    const openLinkBar = function () {
        if (!isEditable()) return;
        saveSelection();
        const link = currentLink();
        box.linkInput.text = link ? link.getAttribute("href") || "" : "";
        box.btnLinkRemove.visible = link ? 1 : 0;
        box.linkBar.visible = 1;
        box.linkInput.inputElement.focus({ preventScroll: true });
        box.linkInput.inputElement.select();
    };

    const closeLinkBar = function (focusEditor = 1) {
        if (box.linkBar.visible != 1) return;
        box.linkBar.visible = 0;
        if (focusEditor) restoreSelection();
        savedRange = null;
    };

    const applyLink = function () {
        let href = String(box.linkInput.text || "").trim();
        restoreSelection();
        if (!href) {
            exec("unlink");
        } else {
            // "example.com" -> "https://example.com", "name@site.com" -> "mailto:name@site.com"
            if (/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(href)) href = "mailto:" + href;
            else if (!/^([a-z][a-z0-9+.-]*:|\/|#|\.)/i.test(href)) href = "https://" + href;
            if (!RichTextEditor.isSafeHref(href)) { box.linkInput.inputElement.focus(); return; }
            const sel = window.getSelection();
            if (sel.isCollapsed && !currentLink()) {
                // No selected text: the address becomes the text of the link.
                const room = remaining();
                if (href.length > room) { closeLinkBar(1); return; }
                exec("insertHTML", '<a href="' + RichTextEditor.escapeHtml(href) + '">' + RichTextEditor.escapeHtml(href) + "</a>&nbsp;");
            } else {
                if (sel.isCollapsed) {
                    // Inside a link: change the whole link.
                    const range = document.createRange();
                    range.selectNodeContents(currentLink());
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                exec("createLink", href);
            }
        }
        box.linkBar.visible = 0;
        savedRange = null;
        contentChanged(1);
    };

    const removeLink = function () {
        restoreSelection();
        const link = currentLink();
        if (link) {
            const range = document.createRange();
            range.selectNodeContents(link);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
        exec("unlink");
        box.linkBar.visible = 0;
        savedRange = null;
        contentChanged(1);
    };

    // *** EDITOR EVENTS:

    const onBeforeInput = function (event) {
        if (!isEditable()) { event.preventDefault(); return; }
        if (!(box.maxLength > 0)) return;
        const type = event.inputType || "";
        // WHY: Typing, Enter and drop add characters. Paste is handled in onPaste.
        if ((type.indexOf("insert") === 0 && type !== "insertFromPaste" && type !== "insertLink") && remaining() <= 0) {
            if (type === "insertParagraph" || type === "insertLineBreak") return; // A new line adds no character to the text.
            event.preventDefault();
        }
    };

    const onPaste = function (event) {
        event.preventDefault();
        if (!isEditable()) return;
        const data = event.clipboardData;
        if (!data) return;
        const text = data.getData("text/plain") || "";
        const html = (box.pasteAs === "clean") ? data.getData("text/html") : "";
        if (html) {
            const clean = RichTextEditor.cleanHtml(html);
            const cleanText = RichTextEditor.htmlToText(clean);
            if (cleanText.length <= remaining()) { exec("insertHTML", clean); return; }
        }
        insertPlainText(text);
    };

    const onDrop = function (event) {
        // WHY: Files and images from outside are not part of this editor.
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) event.preventDefault();
    };

    const onKeyDown = function (event) {
        const mod = event.ctrlKey || event.metaKey;
        if (mod && !event.altKey && (event.key === "k" || event.key === "K")) {
            event.preventDefault();
            if (buttons.link) openLinkBar();
        }
    };

    const onSelectionChange = function () {
        if (selectionIsInside()) updateToolbar();
    };

    // *** PUBLIC FUNCTIONS:

    box.getHtml = function () {
        if (box.isEmpty()) return "";
        return RichTextEditor.cleanHtml(box.editor.innerHTML);
    };
    // USAGE: const html = editor.getHtml(); // "" when it is empty

    // The content is cleaned before it is shown. onChange is not called.
    box.setHtml = function (html) {
        box.htmlText = RichTextEditor.cleanHtml(html || "");
        box.editor.innerHTML = box.htmlText || "<p><br></p>"; // WHY: The first line is a paragraph too, not a loose text.
        contentChanged(0);
    };
    // USAGE: editor.setHtml("<p>Hello <b>world</b></p>")

    box.getText = function () {
        return RichTextEditor.htmlToText(box.editor.innerHTML);
    };
    // USAGE: editor.getText() // Plain text, lines separated by "\n"

    box.getLength = function () {
        return textLength();
    };

    box.isEmpty = function () {
        return (box.editor.textContent.trim() === "" && !box.editor.querySelector("li, a")) ? 1 : 0;
    };

    box.clear = function () {
        box.setHtml("");
    };

    // Inserts text at the cursor (at the end, when the editor does not have the focus). onChange is called.
    box.insertText = function (text) {
        if (!isEditable()) return;
        if (!selectionIsInside()) box.focusEnd();
        insertPlainText(String(text ?? ""));
    };

    box.insertHtml = function (html) {
        if (!isEditable()) return;
        if (!selectionIsInside()) box.focusEnd();
        const clean = RichTextEditor.cleanHtml(html || "");
        if (RichTextEditor.htmlToText(clean).length <= remaining()) exec("insertHTML", clean);
    };

    // Runs a tool like a click on its button: "bold", "h2", "ul", "link"...
    box.runTool = function (name) {
        if (!isEditable() || !TOOLS[name]) return;
        if (!selectionIsInside()) restoreSelection();
        TOOLS[name].run();
        if (name !== "link") contentChanged(1);
    };

    box.focus = function () {
        box.editor.focus({ preventScroll: true });
    };

    box.focusEnd = function () {
        box.editor.focus({ preventScroll: true });
        const range = document.createRange();
        range.selectNodeContents(box.editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    };

    box.setPlaceholderText = function (text) {
        box.placeholderText = String(text ?? "");
        box.editor.setAttribute("data-placeholder", box.placeholderText);
    };

    box.setMaxLength = function (maxLength) {
        box.maxLength = Math.max(0, Number(maxLength) || 0);
        updateCounter();
    };

    box.setReadOnly = function (readOnly) {
        box.readOnly = (readOnly == 1 || readOnly === true) ? 1 : 0;
        applyEditableState();
    };
    // USAGE: editor.setReadOnly(1) // The text can be selected and copied, not changed.

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        applyEditableState();
    };
    // USAGE: get: editor.enabled, set: editor.setEnabled(0)

    const applyEditableState = function () {
        const editable = isEditable();
        box.editor.contentEditable = editable ? "true" : "false";
        box.editor.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.editor.setAttribute("aria-readonly", (box.readOnly == 1) ? "true" : "false");
        box.editor.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
        box.editor.style.userSelect = (box.enabled == 1) ? "text" : "none";
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.toolbar.elem.style.opacity = editable ? "1" : "0.45";
        box.toolbar.elem.style.pointerEvents = editable ? "" : "none";
        if (!editable && box.linkBar.visible == 1) closeLinkBar(0);
        updateBorder();
        updateToolbar();
    };

    box.refresh = function () {
        contentChanged(0);
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        document.removeEventListener("selectionchange", onSelectionChange);
        if (box.scrollBar) { box.scrollBar.remove(); box.scrollBar = null; }
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.clipContent = 1;
    box.elem.style.transition = "border-color 0.15s";

    // LABEL: A toolbar button, the icon is an SVG with currentColor
    const createToolButton = function (name) {
        const shortcut = TOOLS[name].keys ? " (" + (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+") + TOOLS[name].keys + ")" : "";
        const btn = Label({
            text: RichTextEditor.getIconSvg(name, _s.button.iconSize),
            width: _s.button.size,
            height: _s.button.size,
            round: _s.button.round,
            color: "transparent",
            textColor: _s.button.iconColor,
            clickable: 1,
        });
        btn.elem.style.display = "flex";
        btn.elem.style.alignItems = "center";
        btn.elem.style.justifyContent = "center";
        btn.elem.style.lineHeight = "0";
        btn.elem.style.flexShrink = "0";
        btn.elem.style.cursor = "pointer";
        btn.elem.style.transition = "background-color 0.12s";
        btn.elem.setAttribute("role", "button");
        btn.elem.setAttribute("aria-label", box.texts[name] || name);
        btn.elem.setAttribute("title", (box.texts[name] || name) + shortcut);
        btn.isActive = 0;
        btn.on("mouseenter", function () { if (!btn.isActive) btn.color = _s.button.hoverColor; });
        btn.on("mouseleave", function () { btn.color = btn.isActive ? _s.button.activeColor : "transparent"; });
        // WHY: mousedown takes the focus and the selection from the editor. preventDefault keeps them.
        btn.on("mousedown", function (self, event) { event.preventDefault(); });
        btn.on("click", function () { box.runTool(name); });
        buttons[name] = btn;
        return btn;
    };

    // GROUP: Layout (toolbar, link bar, writing area, counter)
    box.layout = VGroup({ width: "100%", height: "100%", align: "left top", gap: 0 });
    box.layout.elem.style.alignItems = "stretch";

        // GROUP: Toolbar
        box.toolbar = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: _s.toolbar.gap,
            padding: _s.toolbar.padding,
            color: _s.toolbar.color,
            wrap: 1,
        });
        box.toolbar.elem.style.flexShrink = "0";
        box.toolbar.elem.style.borderBottom = "1px solid " + _s.toolbar.dividerColor;
        box.toolbar.elem.setAttribute("role", "toolbar");
        box.toolbar.elem.setAttribute("aria-label", box.ariaLabel);

            box.tools.forEach(function (name) {
                if (name === "|") {
                    // BOX: Separator
                    Box({ width: 1, height: Math.round(_s.button.size * 0.6), color: _s.separator.color });
                    that.elem.style.margin = "0px 4px";
                    that.elem.style.flexShrink = "0";
                } else if (TOOLS[name]) {
                    createToolButton(name);
                } else {
                    console.warn("RichTextEditor: Unknown tool: " + name);
                }
            });

        endGroup();

        // GROUP: Link bar (hidden until the link tool is used)
        box.linkBar = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 6,
            padding: [_s.toolbar.padding + 2, _s.toolbar.padding],
            color: _s.linkBar.color,
        });
        box.linkBar.elem.style.flexShrink = "0";
        box.linkBar.elem.style.borderBottom = "1px solid " + _s.toolbar.dividerColor;

            // INPUT: Address
            box.linkInput = Input({
                width: "auto",
                height: 32,
                minimal: 1,
                fontSize: 14,
                color: _s.linkBar.inputColor,
                textColor: _s.linkBar.textColor,
                round: 6,
                border: 1,
                borderColor: _s.linkBar.inputBorderColor,
            });
            box.linkInput.elem.style.flex = "1 1 0";
            box.linkInput.elem.style.minWidth = "0";
            box.linkInput.inputElement.style.padding = "0px 10px";
            box.linkInput.inputElement.style.width = "100%";
            box.linkInput.inputElement.style.height = "100%";
            box.linkInput.inputElement.style.boxSizing = "border-box";
            box.linkInput.inputElement.style.backgroundColor = "transparent";
            box.linkInput.inputElement.setAttribute("placeholder", box.texts.linkPlaceholder);
            box.linkInput.inputElement.setAttribute("aria-label", box.texts.link);
            box.linkInput.inputElement.setAttribute("inputmode", "url");

            // LABEL: Apply
            box.btnLinkApply = Label({
                plainText: box.texts.linkApply,
                height: 32,
                padding: [14, 0],
                fontSize: 13,
                round: 6,
                color: _s.linkBar.buttonColor,
                textColor: _s.linkBar.buttonTextColor,
                clickable: 1,
            });
            box.btnLinkApply.elem.style.display = "flex";
            box.btnLinkApply.elem.style.alignItems = "center";
            box.btnLinkApply.elem.style.flexShrink = "0";
            box.btnLinkApply.elem.style.cursor = "pointer";
            box.btnLinkApply.elem.setAttribute("role", "button");

            // LABEL: Remove the link
            box.btnLinkRemove = Label({
                plainText: box.texts.linkRemove,
                height: 32,
                padding: [8, 0],
                fontSize: 13,
                color: "transparent",
                textColor: _s.linkBar.secondaryTextColor,
                clickable: 1,
            });
            box.btnLinkRemove.elem.style.display = "flex";
            box.btnLinkRemove.elem.style.alignItems = "center";
            box.btnLinkRemove.elem.style.flexShrink = "0";
            box.btnLinkRemove.elem.style.cursor = "pointer";
            box.btnLinkRemove.elem.setAttribute("role", "button");

        endGroup();
        box.linkBar.visible = 0; // WHY: Hidden after its children are created (they stay flex items).

        // BOX: Holder of the writing area (and its ScrollBar)
        box.editHolder = startBox({ width: "100%", height: "auto", color: "transparent" });
        box.editHolder.elem.style.flex = "1 1 0";
        box.editHolder.elem.style.minHeight = "0";

            // BOX: Scrolling area
            box.editArea = Box(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
            box.editArea.elem.style.cursor = "text";
            box.editArea.clickable = 1;

            // The writing area: a raw contenteditable <div>
            box.editor = document.createElement("div");
            box.editor.className = "rich-text-editor-content";
            box.editor.setAttribute("role", "textbox");
            box.editor.setAttribute("aria-multiline", "true");
            box.editor.setAttribute("aria-label", box.ariaLabel);
            box.editor.spellcheck = (box.spellCheck == 1);
            const _cs = _s.content;
            const _ed = box.editor.style;
            _ed.minHeight = "100%";
            _ed.boxSizing = "border-box";
            _ed.padding = _cs.padding[1] + "px " + _cs.padding[0] + "px";
            _ed.fontSize = _cs.fontSize + "px";
            _ed.lineHeight = String(_cs.lineHeight);
            _ed.color = _cs.textColor;
            if (_cs.fontFamily) _ed.fontFamily = _cs.fontFamily;
            _ed.setProperty("--rte-link", _cs.linkColor);
            _ed.setProperty("--rte-quote", _cs.quoteColor);
            _ed.setProperty("--rte-quote-border", _cs.quoteBorderColor);
            _ed.setProperty("--rte-placeholder", _cs.placeholderColor);
            _ed.setProperty("--rte-selection", _cs.selectionColor);
            box.editArea.elem.appendChild(box.editor);

            if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
                box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.editArea, neverHide: 0, showDots: 0 }, _s.scrollBar));
            }

        endBox();

        // LABEL: Counter
        if (box.showCounter == 1) {
            box.lblCounter = Label({
                plainText: "",
                width: "100%",
                fontSize: _s.counter.fontSize,
                textColor: _s.counter.textColor,
                textAlign: "right",
                padding: [_s.content.padding[0], 6],
            });
            box.lblCounter.elem.style.flexShrink = "0";
            box.lblCounter.elem.style.fontVariantNumeric = "tabular-nums";
        }

    endGroup();

    // *** OBJECT INIT CODE:

    try { document.execCommand("styleWithCSS", false, false); } catch (e) { } // WHY: <b>, <i> instead of <span style>.
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { }

    box.editor.addEventListener("input", function () { contentChanged(1); });
    box.editor.addEventListener("beforeinput", onBeforeInput);
    box.editor.addEventListener("paste", onPaste);
    box.editor.addEventListener("drop", onDrop);
    box.editor.addEventListener("keydown", onKeyDown);
    box.editor.addEventListener("focus", function () { isFocused = 1; updateBorder(); updateToolbar(); box.onFocus(box); });
    box.editor.addEventListener("blur", function () { isFocused = 0; updateBorder(); box.onBlur(box); });
    // WHY: A click under the text (in the empty part of the area) puts the cursor at the end.
    box.editArea.on("mousedown", function (self, event) {
        if (event.target === box.editArea.elem && isEditable()) { event.preventDefault(); box.focusEnd(); }
    });
    document.addEventListener("selectionchange", onSelectionChange);

    box.linkInput.inputElement.addEventListener("keydown", function (event) {
        if (event.key === "Enter") { event.preventDefault(); applyLink(); }
        else if (event.key === "Escape") { event.preventDefault(); closeLinkBar(1); }
    });
    box.btnLinkApply.on("mousedown", function (self, event) { event.preventDefault(); });
    box.btnLinkApply.on("click", applyLink);
    box.btnLinkRemove.on("mousedown", function (self, event) { event.preventDefault(); });
    box.btnLinkRemove.on("click", removeLink);

    box.setPlaceholderText(box.placeholderText);
    box.setHtml(box.htmlText);
    box.setMaxLength(box.maxLength);
    applyEditableState();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

RichTextEditor.ALLOWED_TAGS = ["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "DEL", "H2", "H3", "P", "DIV", "BR", "UL", "OL", "LI", "BLOCKQUOTE", "A"];
RichTextEditor.DROPPED_TAGS = ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE", "HEAD", "TITLE", "META", "LINK", "SVG", "MATH", "IMG", "VIDEO", "AUDIO", "CANVAS", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "FORM"];

RichTextEditor.isSafeHref = function (href) {
    const value = String(href || "").trim();
    if (!value) return false;
    if (/^(https?:|mailto:|tel:)/i.test(value)) return true;
    return !/^[a-z][a-z0-9+.-]*:/i.test(value.replace(/[\s\u0000-\u001F]/g, "")); // Relative addresses (no other scheme like javascript:)
};

// Keeps only the allowed tags, without attributes (a: only a safe href). Unknown tags are unwrapped.
// WHY: DOMParser makes an inert document. Its scripts do not run and its images do not load.
RichTextEditor.cleanHtml = function (html) {
    const doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    const out = document.createElement("div");

    const copy = function (source, target) {
        source.childNodes.forEach(function (node) {
            if (node.nodeType === 3) {
                target.appendChild(document.createTextNode(node.nodeValue));
                return;
            }
            if (node.nodeType !== 1) return; // Comments...
            const tag = node.nodeName.toUpperCase();
            if (RichTextEditor.DROPPED_TAGS.indexOf(tag) > -1) return;
            if (RichTextEditor.ALLOWED_TAGS.indexOf(tag) === -1) {
                copy(node, target); // Unwrap: <span>text</span> -> text
                return;
            }
            const el = document.createElement(tag.toLowerCase());
            if (tag === "A") {
                const href = node.getAttribute("href");
                if (!RichTextEditor.isSafeHref(href)) { copy(node, target); return; }
                el.setAttribute("href", href.trim());
            }
            copy(node, el);
            target.appendChild(el);
        });
    };

    copy(doc.body, out);
    return out.innerHTML;
};
// USAGE: RichTextEditor.cleanHtml('<p onclick="x()">Hi <script>..</script><b>there</b></p>') // "<p>Hi <b>there</b></p>"

// Plain text with line breaks for the blocks and the list items.
RichTextEditor.htmlToText = function (html) {
    const doc = new DOMParser().parseFromString("<body>" + String(html || "") + "</body>", "text/html");
    const lines = [];
    let line = "";
    const walk = function (node) {
        node.childNodes.forEach(function (child) {
            if (child.nodeType === 3) { line += child.nodeValue.replace(/\s+/g, " "); return; }
            if (child.nodeType !== 1) return;
            const tag = child.nodeName;
            if (tag === "BR") { lines.push(line); line = ""; return; }
            const isBlock = /^(P|DIV|H[1-6]|LI|BLOCKQUOTE|UL|OL)$/.test(tag);
            if (isBlock && line.trim()) { lines.push(line); line = ""; }
            if (tag === "LI") line = "- ";
            walk(child);
            if (isBlock && line.trim()) { lines.push(line); line = ""; }
        });
    };
    walk(doc.body);
    if (line.trim()) lines.push(line);
    return lines.map(function (l) { return l.trim(); }).join("\n").trim();
};

RichTextEditor.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// Icons use currentColor: the color of the button label.
RichTextEditor.getIconSvg = function (name, size) {
    const open = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
    const letter = function (text, extra) {
        return '<text x="12" y="17.5" text-anchor="middle" font-size="16" fill="currentColor" stroke="none" font-family="Georgia, \'Times New Roman\', serif" ' + (extra || "") + ">" + text + "</text>";
    };
    const icons = {
        bold: letter("B", 'font-weight="700"'),
        italic: letter("I", 'font-style="italic"'),
        underline: letter("U", 'y="16"') + '<path d="M6 21h12"/>',
        strike: letter("S") + '<path d="M4 12h16"/>',
        h2: '<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">H2</text>',
        h3: '<text x="12" y="16.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" stroke="none" font-family="system-ui, sans-serif">H3</text>',
        ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
        ol: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4 5l1.5-1v5" stroke-width="1.6"/><path d="M3.5 14.5c0-1 2.5-1.2 2.5 0 0 1-2.5 2-2.5 3.5H6" stroke-width="1.6"/>',
        quote: '<path d="M7 7h3v4c0 3-1.5 5-4 6M15 7h3v4c0 3-1.5 5-4 6"/>',
        link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
        clear: letter("T", 'x="10"') + '<path d="M15 14l6 6M21 14l-6 6"/>',
        undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
        redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    };
    return open + (icons[name] || "") + "</svg>";
};

// Styles of the content (headings, lists, quotes, links, the placeholder) can not be set with inline styles.
RichTextEditor.injectCss = function () {
    if (document.getElementById("rich-text-editor-css")) return;
    const style = document.createElement("style");
    style.id = "rich-text-editor-css";
    const c = ".rich-text-editor-content";
    style.textContent =
        c + " { position: relative; outline: none; pointer-events: auto; user-select: text; -webkit-user-select: text; overflow-wrap: break-word; word-break: break-word; }" +
        c + " p, " + c + " div { margin: 0 0 0.6em 0; }" +
        c + " h2 { font-size: 1.45em; line-height: 1.3; margin: 0.4em 0 0.4em 0; font-weight: 700; }" +
        c + " h3 { font-size: 1.2em; line-height: 1.35; margin: 0.4em 0 0.35em 0; font-weight: 700; }" +
        // WHY: font-weight must stay bold: execCommand("bold") and queryCommandState("bold") read the computed weight.
        c + " b, " + c + " strong { font-weight: 700; }" +
        c + " ul, " + c + " ol { margin: 0 0 0.6em 0; padding-left: 1.6em; }" +
        c + " li { margin: 0.15em 0; }" +
        c + " blockquote { margin: 0 0 0.6em 0; padding: 0.1em 0 0.1em 1em; border-left: 3px solid var(--rte-quote-border); color: var(--rte-quote); }" +
        c + " a { color: var(--rte-link); text-decoration: underline; cursor: text; }" +
        c + " > :first-child { margin-top: 0; }" +
        c + " ::selection { background: var(--rte-selection); }" +
        c + ".is-empty::before { content: attr(data-placeholder); position: absolute; color: var(--rte-placeholder); pointer-events: none; }";
    document.head.appendChild(style);
};

// *** STYLE PACKAGES:
// USAGE: RichTextEditor({ styleName: "modern" })
// USAGE: RichTextEditor({ styleName: "dark", style: { content: { fontSize: 16 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: RichTextEditor.styles.myStyle = { toolbar: { color: "ivory" } };
RichTextEditor.styles = {

    // White area, light gray toolbar.
    classic: RichTextEditorDefaults.style,

    // Rounder, cadetblue. Same colors as the modern Stepper, SortableList, CheckBox and Tabs.
    modern: {
        box: { color: White(1), border: 1, borderColor: "#D9DADB", round: 14 },
        boxFocus: { borderColor: "cadetblue" },
        toolbar: { color: White(1), dividerColor: "#E3ECEC", padding: 8, gap: 2 },
        button: { size: 32, iconSize: 18, iconColor: "#4F7C7D", hoverColor: "#EEF5F5", activeColor: "#DFECEC", activeIconColor: "#2F5F61", round: 100 },
        separator: { color: "#E3ECEC" },
        content: { fontSize: 15, lineHeight: 1.6, textColor: "#2F5F61", fontFamily: "", padding: [18, 14], linkColor: "#2E8B8F", quoteColor: "#5C8A8B", quoteBorderColor: "cadetblue", placeholderColor: "#8FB5B6", selectionColor: "rgba(95, 158, 160, 0.22)" },
        linkBar: { color: "#F5F9F9", inputColor: White(1), inputBorderColor: "#CFE2E2", textColor: "#2F5F61", buttonColor: "cadetblue", buttonTextColor: White(1), secondaryTextColor: "#5C8A8B" },
        counter: { fontSize: 12, textColor: "#6E9A9B", limitColor: "#C0392B" },
        scrollBar: { bar_color: "#CFE2E2", bar_mouseOverColor: "cadetblue", bar_width: 4, bar_round: 3, bar_opacity: 0.6, bar_mouseOverOpacity: 1, bar_padding: 2 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE, TagInput, Tabs and Stepper "dark".
    dark: {
        box: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8 },
        boxFocus: { borderColor: "#65A293" },
        toolbar: { color: "#1C1C1B", dividerColor: "rgba(255, 255, 255, 0.08)", padding: 6, gap: 2 },
        button: { size: 32, iconSize: 18, iconColor: "rgba(255, 255, 255, 0.65)", hoverColor: "rgba(255, 255, 255, 0.08)", activeColor: "rgba(101, 162, 147, 0.25)", activeIconColor: "#8FD1BF", round: 6 },
        separator: { color: "rgba(255, 255, 255, 0.12)" },
        content: { fontSize: 15, lineHeight: 1.6, textColor: "rgba(255, 255, 255, 0.90)", fontFamily: "", padding: [16, 14], linkColor: "#7FC4B2", quoteColor: "rgba(255, 255, 255, 0.6)", quoteBorderColor: "#65A293", placeholderColor: "rgba(255, 255, 255, 0.35)", selectionColor: "rgba(101, 162, 147, 0.35)" },
        linkBar: { color: "#1C1C1B", inputColor: "#2A2A29", inputBorderColor: "rgba(255, 255, 255, 0.12)", textColor: "rgba(255, 255, 255, 0.9)", buttonColor: "#3D7A6B", buttonTextColor: White(1), secondaryTextColor: "rgba(255, 255, 255, 0.6)" },
        counter: { fontSize: 12, textColor: "rgba(255, 255, 255, 0.45)", limitColor: "#E57B6B" },
        disabled: { opacity: 0.45 },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

};
