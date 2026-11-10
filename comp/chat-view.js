/* Bismillah */

/*

ChatView - v26.11

UI COMPONENT
- A conversation with an AI (or with a person): the messages one under the other, an answer that comes piece by piece,
  and a field at the bottom for the next message.
- A message: { key, role, text }. role "user": a bubble on the right, its text as it is written. "assistant" (an answer):
  the whole width, its text is Markdown, drawn by comp/markdown-view.js (headings, lists, tables, code with a button that
  copies it). "system": a small soft line in the middle. A text is never read as HTML.
- An answer that comes: addMessage({ role: "assistant" }) gives its key, appendText(key, piece) adds every piece. Only the
  end of the answer is drawn again, and the view follows it until the reader scrolls up.
- The field: Enter sends, Shift+Enter makes a new line (sendOnEnter: 0: Enter makes a new line, Ctrl / Cmd + Enter sends).
  The message of the user is added, the field is emptied and onSend(self, text, key) is called (key: the key of that
  message): the page asks for the answer.
  setBusy(1) while it comes: three dots until its first words, and Stop in the place of Send (Stop: setBusy(0), then
  onStop(self)).
- showInput: 0 -> only the messages: the page has a field of its own and adds every message.
- height: a number or "100%" (the messages scroll above the field).
- Needs comp/markdown-view.js and comp/scroll-area.js (basic/scroll-bar.js for the bar; comp/code-editor.js colors the code).
- Style packages: "light" (default), "dark", "minimal", "minimalDark" (_designs/minimal-theme.htm: small and made of
  lines; MinimalAccent makes them in a color of the page). Select with styleName (ChatView.styles), or later with setTheme().

USAGE:
const chat = ChatView({
    width: "100%",
    height: 560,
    emptyText: "Ask something",
    onSend: function (self, text) {
        const key = self.addMessage({ role: "assistant" });
        self.setBusy(1);
        askTheAi(text, function (piece) { self.appendText(key, piece); }, function () { self.setBusy(0); });
    },
});
chat.addMessage({ role: "user", text: "Hello" });
chat.addMessage({ role: "assistant", text: "**Hello!** How can I help?" });
chat.setMessages([{ role: "system", text: "A new conversation" }]);
chat.getMessages();                  // [{ key, role, text }]
chat.setTheme("dark");

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ChatViewDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 480,
    height: 560, // A number or "100%". (Not "auto": the messages scroll above the field.)
    messages: [], // [{ key, role: "user" | "assistant" | "system", text }]: the messages at the start (a text: an answer)
    placeholder: "Write a message",
    emptyText: "", // Shown while there is no message (Ex: "Ask something")
    sendText: "Send", // The name of the button: a screen reader says it, the mouse shows it
    stopText: "Stop",
    showInput: 1, // 0: only the messages (the page has a field of its own)
    sendOnEnter: 1, // 1: Enter sends, Shift+Enter makes a new line. 0: Enter makes a new line, Ctrl / Cmd + Enter sends.
    maxInputLines: 6, // The field grows up to this many lines, then it scrolls
    busy: 0, // 1: an answer is coming: the dots, and Stop in the place of Send. setBusy()
    autoScroll: 1, // 1: the view follows a new message and an answer that comes, until the reader scrolls up
    remotePictures: 0, // 1: a picture of an answer with an http address is drawn (See the note of MarkdownView)
    ariaLabel: "Conversation",
    copyText: "Copy", // The button of a code in an answer
    copiedText: "Copied",
    onSend: function (self, text, key) { }, // The user sent a text: its message (key) is on the view, the field is empty again
    onStop: function (self) { }, // Stop was pressed (busy is 0 already)
    onLinkClick: null, // function (self, address) {}: a link of an answer comes to you. null: it opens in a new tab.
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to ChatView.styles
    style: { // Light style package (default)
        box: { color: "white" },
        page: { padding: [18, 20], gap: 20, maxWidth: 760 }, // The column of the messages. WHY maxWidth: a wide line is hard to read.
        user: { color: "#EFEFEC", textColor: Black(0.88), fontSize: 15, lineRatio: 1.55, round: 18, padding: [16, 10], maxWidth: "82%", border: 0, borderColor: "transparent" },
        system: { fontSize: 13, textColor: Black(0.45) },
        answerStyleName: "light", // The package of MarkdownView an answer is drawn with
        answer: {}, // Keys of the style of that MarkdownView over its package (Ex: { text: { fontSize: 13 } })
        dots: { color: Black(0.35), size: 7, gap: 5 }, // While the first words of an answer are waited for
        field: { // The place of the field and its button, under the messages
            margin: [16, 12], // Around it
            padding: [12, 8],
            gap: 8,
            color: White(1),
            border: 1,
            borderColor: Black(0.14),
            hoverBorderColor: Black(0.3),
            focusBorderColor: "#3D7A6B", // the accent of the kit
            round: 16,
            fontSize: 15,
            lineHeight: 22,
            lineSpace: 6, // px above and under the lines: one line is as high as the button
            textColor: Black(0.88),
            placeholderColor: Black(0.4),
        },
        button: {
            size: 34,
            iconSize: 18,
            round: null, // null: a circle
            color: "#3D7A6B",
            iconColor: White(1),
            disabledColor: Black(0.1), // Send while the field is empty
            disabledIconColor: White(1),
            stopColor: Black(0.85),
            stopIconColor: White(1),
        },
        empty: { fontSize: 15, textColor: Black(0.45) },
        focus: { ringColor: "rgba(61, 122, 107, 0.6)" },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3, showDots: 0 },
    },
};

const ChatView = function (params = {}) {

    // Merge style package: params.style > ChatView.styles[styleName] > ChatViewDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, ChatView.styles, ChatViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ChatViewDefaults);

    // Edit params, if needed:
    const startMessages = (Array.isArray(params.messages)) ? params.messages.slice() : [];
    params.messages = []; // WHY: The array of the page does not change; getMessages() gives the messages.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let entries = []; // { key, role, text, row, view (an answer: its MarkdownView), label (a bubble, a system line) }
    let keyNumber = 0;
    let isFollowing = 1; // 1: the reader is at the end, and the view follows it
    let lastScrollTop = 0;
    let isFieldFocused = 0;
    let isFieldHover = 0;
    const ROLES = ["user", "assistant", "system"];
    const BOTTOM_SPACE = 30; // px: this near to the end is at the end

    // *** PUBLIC VARIABLES:
    box.textareaElem = null; // The raw <textarea> of the field: a page can listen to its paste / drop
    // NOTE: Default values are also public variables. (box.busy, box.placeholder, box.emptyText...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, ChatView.styles, ChatViewDefaults);
        mergeIntoIfMissing(fresh, ChatViewDefaults);
        return fresh.style;
    };

    const textOf = function (value) {
        return (value === null || value === undefined) ? "" : String(value);
    };

    const findEntry = function (key) {
        const text = String(key);
        return entries.find(function (entry) { return entry.key === text; }) || null;
    };

    const newKey = function () {
        let key = "";
        do {
            keyNumber += 1;
            key = "m" + keyNumber;
        } while (findEntry(key));
        return key;
    };

    // A message of the page as the view keeps it. A text is an answer.
    const toEntry = function (message) {
        const isObject = (message !== null && typeof message === "object");
        const hasKey = (isObject && message.key !== undefined && message.key !== null);
        const role = (isObject) ? message.role : "assistant";
        return {
            key: (hasKey) ? String(message.key) : newKey(),
            role: (ROLES.indexOf(role) > -1) ? role : "assistant",
            text: textOf((isObject) ? message.text : message),
            row: null,
            view: null,
            label: null,
        };
    };

    const lastEntry = function () {
        return entries[entries.length - 1] || null;
    };

    // ROWS: each kind of message as objects

    const createUserRow = function (entry) {
        // GROUP: The bubble on the right
        entry.row = HGroup({ width: "100%", height: "auto", align: "right top", clipContent: 0 });
            entry.label = Label({ width: "auto", plainText: entry.text, selectable: 1 });
            entry.label.css = { whiteSpace: "pre-wrap", overflowWrap: "anywhere", boxSizing: "border-box" };
        endGroup();
    };

    const createSystemRow = function (entry) {
        // GROUP: A soft line in the middle
        entry.row = HGroup({ width: "100%", height: "auto", align: "center top" });
            entry.label = Label({ width: "auto", plainText: entry.text, textAlign: "center", selectable: 1 });
            entry.label.css = { whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: "100%" };
        endGroup();
    };

    const onAnswerLinkClick = function (view, address) {
        box.onLinkClick(box, address);
    };

    const createAnswerView = function (entry) {
        entry.view = MarkdownView({
            width: "100%",
            height: "auto",
            markdownText: entry.text,
            autoScroll: 0, // WHY: The view of the conversation follows the end, not the answer.
            remotePictures: box.remotePictures,
            copyText: box.copyText,
            copiedText: box.copiedText,
            onLinkClick: (typeof box.onLinkClick === "function") ? onAnswerLinkClick : null,
            styleName: _s.answerStyleName,
            style: ChatView.answerLookOf(_s),
        });
    };

    const createAnswerRow = function (entry) {
        // GROUP: The whole width; its MarkdownView grows with its text
        entry.row = VGroup({ width: "100%", height: "auto", align: "left top", clipContent: 0 });
            createAnswerView(entry);
        endGroup();
    };

    // WHY made again (setTheme): the sizes of a package (minimal) are a style of the MarkdownView, given when it is made.
    const drawAnswerAgain = function (entry) {
        entry.view.remove();
        createIn(entry.row, function () { createAnswerView(entry); });
    };

    const createRow = function (entry) {
        if (entry.role === "user") createUserRow(entry);
        else if (entry.role === "system") createSystemRow(entry);
        else createAnswerRow(entry);
        paintEntry(entry);
    };

    // The look of a message, and the room of an answer with no text yet (the dots stand in its place).
    const paintEntry = function (entry) {
        if (entry.role === "assistant") {
            entry.row.visible = (entry.text === "") ? 0 : 1;
            return;
        }
        if (entry.role === "system") {
            entry.label.props({ fontSize: _s.system.fontSize, textColor: _s.system.textColor });
            return;
        }
        const look = _s.user;
        entry.label.props({
            color: look.color,
            textColor: look.textColor,
            fontSize: look.fontSize,
            lineHeight: Math.round(look.fontSize * look.lineRatio),
            round: look.round,
            padding: look.padding,
            border: look.border,
            borderColor: look.borderColor,
        });
        entry.label.css.maxWidth = look.maxWidth;
    };

    // The text of a message on the view. piece: the end that was added (appendText): an answer draws only the end again.
    const writeText = function (entry, text, piece) {
        entry.text = text;
        if (entry.view && piece !== undefined) entry.view.appendText(piece);
        else if (entry.view) entry.view.setMarkdownText(text);
        else entry.label.plainText = text;
        paintEntry(entry);
        paintDots();
    };

    const paintEmpty = function () {
        const isEmpty = (entries.length === 0 && box.emptyText !== "");
        box.lblEmpty.plainText = box.emptyText;
        box.lblEmpty.visible = (isEmpty) ? 1 : 0;
    };

    // The dots: busy, and the answer has no words yet (or it was not added yet).
    const paintDots = function () {
        const last = lastEntry();
        const isWaiting = (box.busy == 1) && (!last || last.role !== "assistant" || last.text === "");
        box.dotsRow.visible = (isWaiting) ? 1 : 0;
    };

    // FOLLOWING THE END

    const isSelectingText = function () {
        const selection = window.getSelection();
        return !!(selection && !selection.isCollapsed && box.elem.contains(selection.anchorNode));
    };

    const isAtEnd = function () {
        const elem = box.messageArea.scrollBox.elem;
        return (elem.scrollHeight - elem.scrollTop - elem.clientHeight <= BOTTOM_SPACE);
    };

    const goToEnd = function () {
        const elem = box.messageArea.scrollBox.elem;
        elem.scrollTop = elem.scrollHeight;
        lastScrollTop = elem.scrollTop; // WHY: Its scroll event comes a frame late, when more text may have come: not a scroll up.
    };

    // WHY on a resize of the column: an answer is drawn a little after its piece came (MarkdownView), and it grows then.
    const followEnd = function () {
        if (box.autoScroll != 1 || !isFollowing || isSelectingText()) return;
        goToEnd();
    };

    // The reader moved: at the end the view follows again, above it the view stays.
    const onScroll = function () {
        const scrollTop = box.messageArea.getScrollTop();
        if (scrollTop === lastScrollTop) return;
        lastScrollTop = scrollTop;
        isFollowing = isAtEnd() ? 1 : 0;
    };

    // THE FIELD

    const hasText = function () {
        return !!box.textareaElem && box.textareaElem.value.trim() !== "";
    };

    // The field grows with its lines up to maxInputLines, then it scrolls.
    const growField = function () {
        const elem = box.textareaElem;
        const most = _s.field.lineHeight * box.maxInputLines + _s.field.lineSpace * 2;
        elem.style.height = "auto"; // WHY: First reset, so scrollHeight is the height of the text (also when it got shorter).
        // WHY: Not drawn yet (a closed tab): scrollHeight is 0, and the field keeps the height of its CSS.
        if (elem.scrollHeight === 0) return;
        elem.style.height = Math.min(elem.scrollHeight, most) + "px";
        elem.style.overflowY = (elem.scrollHeight > most) ? "auto" : "hidden";
    };

    const paintField = function () {
        const look = _s.field;
        let borderColor = look.borderColor;
        if (isFieldHover) borderColor = look.hoverBorderColor;
        if (isFieldFocused) borderColor = look.focusBorderColor;
        box.fieldGroup.borderColor = borderColor;
    };

    const paintButton = function () {
        const look = _s.button;
        const isBusy = (box.busy == 1);
        const isEnabled = isBusy || hasText();
        let color = look.color;
        let iconColor = look.iconColor;
        if (!isEnabled) {
            color = look.disabledColor;
            iconColor = look.disabledIconColor;
        }
        if (isBusy) {
            color = look.stopColor;
            iconColor = look.stopIconColor;
        }
        const name = (isBusy) ? box.stopText : box.sendText;
        const svg = (isBusy) ? ChatView.getStopSvg(iconColor, look.iconSize) : ChatView.getSendSvg(iconColor, look.iconSize);
        const round = (look.round === null || look.round === undefined) ? look.size / 2 : look.round;
        box.btnSend.props({ color: color, text: svg, width: look.size, height: look.size, round: round });
        box.btnSend.cursor = (isEnabled) ? "pointer" : "default";
        box.btnSend.aria = { label: name, disabled: (isEnabled) ? "false" : "true" };
        box.btnSend.elem.title = name;
    };

    const onFieldInput = function () {
        growField();
        paintButton();
    };

    const onFieldKeyDown = function (self, event) {
        // WHY isComposing: the Enter of an input method (Japanese, Chinese) chooses a word; it does not send.
        if (event.key !== "Enter" || event.isComposing) return;
        const isSendKey = (box.sendOnEnter == 1) ? !event.shiftKey : (event.ctrlKey || event.metaKey);
        if (!isSendKey) return;
        event.preventDefault();
        box.send();
    };

    const pressButton = function () {
        if (box.busy == 1) {
            box.stop();
            return;
        }
        box.send();
    };

    const onButtonKeyDown = function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        pressButton();
    };

    // WHY variables: the placeholder of a raw <textarea> is reached only by a style sheet.
    const applyFieldLook = function () {
        const look = _s.field;
        const elem = box.textareaElem;
        box.fieldGroup.props({ color: look.color, border: look.border, round: look.round, padding: look.padding, gap: look.gap });
        box.fieldGroup.css.maxWidth = _s.page.maxWidth + "px";
        box.inputRow.padding = look.margin;
        elem.style.fontSize = look.fontSize + "px";
        elem.style.lineHeight = look.lineHeight + "px";
        elem.style.padding = look.lineSpace + "px 4px";
        elem.style.color = look.textColor;
        elem.style.setProperty("--chat-view-placeholder", look.placeholderColor);
        growField();
        paintField();
        paintButton();
    };

    const applyScrollBarLook = function () {
        const scrollBar = box.messageArea.scrollBar;
        if (!scrollBar) return;
        Object.assign(scrollBar, _s.scrollBar);
        scrollBar.boxScrollBarTop.color = _s.scrollBar.bar_color;
        scrollBar.boxScrollBarLeft.color = _s.scrollBar.bar_color;
    };

    const applyLook = function () {
        box.color = _s.box.color;
        box.messageArea.setPadding(_s.page.padding);
        box.column.gap = _s.page.gap;
        box.messageGroup.gap = _s.page.gap;
        box.column.css.maxWidth = _s.page.maxWidth + "px";
        box.lblEmpty.props({ fontSize: _s.empty.fontSize, textColor: _s.empty.textColor });
        box.dotsRow.gap = _s.dots.gap;
        box.dots.forEach(function (dot) {
            dot.props({ width: _s.dots.size, height: _s.dots.size, round: _s.dots.size / 2, color: _s.dots.color });
        });
        box.messageArea.scrollBox.setFocusRing(_s.focus.ringColor);
        box.btnSend.setFocusRing(_s.focus.ringColor);
        applyFieldLook();
        applyScrollBarLook();
        entries.forEach(paintEntry);
    };

    // *** PUBLIC FUNCTIONS:

    // A message at the end: { key, role, text } (a text: an answer). Returns its key ("m1"... when it has none).
    box.addMessage = function (message) {
        const entry = toEntry(message);
        entries.push(entry);
        createIn(box.messageGroup, function () { createRow(entry); });
        paintEmpty();
        paintDots();
        return entry.key;
    };
    // USAGE: const key = chat.addMessage({ role: "assistant" }) // an answer that will come: appendText(key, piece)

    // The next piece of a message (an answer as it comes). MarkdownView draws the pieces that come fast together.
    box.appendText = function (key, text) {
        const entry = findEntry(key);
        if (!entry || text === null || text === undefined) return;
        writeText(entry, entry.text + String(text), String(text));
    };
    // USAGE: chat.appendText(key, " and the next words")

    box.setMessageText = function (key, text) {
        const entry = findEntry(key);
        if (!entry) return;
        writeText(entry, textOf(text));
    };
    // USAGE: chat.setMessageText(key, "The whole answer")

    box.getMessageText = function (key) {
        const entry = findEntry(key);
        return (entry) ? entry.text : "";
    };

    box.removeMessage = function (key) {
        const entry = findEntry(key);
        if (!entry) return;
        entries.splice(entries.indexOf(entry), 1);
        entry.row.remove();
        paintEmpty();
        paintDots();
    };

    // Every message goes (the field keeps its text).
    box.clear = function () {
        entries.forEach(function (entry) { entry.row.remove(); });
        entries = [];
        paintEmpty();
        paintDots();
    };

    // Another conversation: its end is shown.
    box.setMessages = function (messages) {
        box.clear();
        (Array.isArray(messages) ? messages : []).forEach(box.addMessage);
        box.scrollToEnd();
    };
    // USAGE: chat.setMessages([{ role: "user", text: "Hi" }, { role: "assistant", text: "Hello!" }])

    // [{ key, role, text }]: copies, in order.
    box.getMessages = function () {
        return entries.map(function (entry) { return { key: entry.key, role: entry.role, text: entry.text }; });
    };

    // An answer is coming: the dots (until its first words) and Stop.
    box.setBusy = function (value) {
        box.busy = basic.isOn(value) ? 1 : 0;
        box.messageArea.scrollBox.aria = { busy: (box.busy == 1) ? "true" : "false" };
        paintDots();
        paintButton();
    };
    // USAGE: get: chat.busy, set: chat.setBusy(1)

    // The text of the field is sent, as the button does: its message, an empty field, onSend(self, text, key).
    // WHY the key: a page that keeps the conversation (or a program in another language) knows the message by it.
    box.send = function () {
        if (box.busy == 1 || !hasText()) return;
        const text = box.textareaElem.value.trim();
        box.setInputText("");
        const key = box.addMessage({ role: "user", text: text });
        box.scrollToEnd();
        box.onSend(box, text, key);
    };

    // As the Stop button: busy goes to 0, then onStop(self).
    box.stop = function () {
        if (box.busy != 1) return;
        box.setBusy(0);
        box.onStop(box);
    };

    box.setInputText = function (text) {
        box.textareaElem.value = textOf(text);
        growField();
        paintButton();
    };

    box.getInputText = function () {
        return box.textareaElem.value;
    };

    box.focus = function () {
        box.textareaElem.focus();
    };

    box.setPlaceholder = function (text) {
        box.placeholder = textOf(text);
        box.textareaElem.placeholder = box.placeholder;
        box.textareaElem.setAttribute("aria-label", box.placeholder);
    };

    box.setEmptyText = function (text) {
        box.emptyText = textOf(text);
        paintEmpty();
    };

    box.setShowInput = function (value) {
        box.showInput = basic.isOn(value) ? 1 : 0;
        box.inputRow.visible = box.showInput;
    };

    // It goes to the end, and follows again.
    box.scrollToEnd = function () {
        isFollowing = 1;
        goToEnd();
    };

    box.scrollToTop = function () {
        box.messageArea.scrollToTop();
        lastScrollTop = 0;
        isFollowing = isAtEnd() ? 1 : 0;
    };

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
        entries.forEach(function (entry) {
            if (entry.view) drawAnswerAgain(entry);
        });
    };
    // USAGE: chat.setTheme("dark")

    // *** OBJECT VIEW:

    // GROUP: The messages above, the field under them
    box.layout = VGroup({ width: "100%", height: "100%", align: "center top", gap: 0, clipContent: 0 });

        // SCROLL AREA: The messages (the room the field leaves)
        box.messageArea = ScrollArea({ align: "center top", onScroll: onScroll, style: { scrollBar: _s.scrollBar } });

            // GROUP: The column of the messages (in the middle of a wide window)
            box.column = VGroup({ width: "100%", height: "auto", align: "left top", clipContent: 0 });

                box.messageGroup = VGroup({ width: "100%", height: "auto", align: "left top", clipContent: 0 });
                endGroup();

                // GROUP: The dots of an answer that is waited for
                box.dotsRow = HGroup({ hug: 1, align: "left center", padding: [2, 8] });
                    box.dots = [Box(), Box(), Box()];
                endGroup();

            endGroup();

            // LABEL: Shown while there is no message (in the middle of the area)
            box.lblEmpty = Label({ width: "100%", textAlign: "center", visible: 0 });
            box.lblEmpty.css = { margin: "auto 0", whiteSpace: "pre-wrap", padding: "0 20px", boxSizing: "border-box" };

        endGroup();

        // GROUP: The field and its button
        box.inputRow = HGroup({ width: "100%", height: "auto", align: "center top", clipContent: 0 });
            box.fieldGroup = HGroup({ width: "100%", height: "auto", align: "left bottom", clipContent: 0 });
                // BOX: The place of the raw <textarea>
                box.fieldBox = Box({ width: "auto", height: "auto", color: "transparent" });
                box.fieldBox.grow = 1;
                box.fieldBox.css.minWidth = "0px";
                box.btnSend = Label({ clickable: 1 });
                box.btnSend.shrink = 0;
                box.btnSend.lineHeight = "0";
                box.btnSend.role = "button";
                box.btnSend.tabIndex = 0;
                box.btnSend.elem.style.display = "flex";
                box.btnSend.css = { alignItems: "center", justifyContent: "center" };
            endGroup();
        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    ChatView.addCss();

    const textareaElem = document.createElement("textarea");
    textareaElem.rows = 1;
    textareaElem.className = "chat-view-field";
    box.fieldBox.elem.appendChild(textareaElem);
    box.textareaElem = textareaElem;

    box.messageArea.scrollBox.role = "log";
    box.messageArea.scrollBox.aria = { label: box.ariaLabel, busy: "false" };
    box.messageArea.scrollBox.tabIndex = 0; // WHY: The keys of a focused area scroll it (arrows, Page Up, Home, End).
    box.dots.forEach(function (dot, index) {
        dot.elem.classList.add("chat-view-dot");
        dot.elem.style.animationDelay = (index * ChatView.DOT_DELAY) + "s";
    });

    box.listenTo(textareaElem, "input", onFieldInput);
    box.listenTo(textareaElem, "keydown", onFieldKeyDown);
    box.listenTo(textareaElem, "focus", function () {
        isFieldFocused = 1;
        paintField();
    });
    box.listenTo(textareaElem, "blur", function () {
        isFieldFocused = 0;
        paintField();
    });
    box.fieldGroup.onHoverChange(function (self, isOver) {
        isFieldHover = isOver ? 1 : 0;
        paintField();
    });
    // WHY: A click on the padding of the field, around the text, writes in it too.
    box.fieldGroup.on("click", function (self, event) {
        if (event.target === textareaElem || box.btnSend.elem.contains(event.target)) return;
        textareaElem.focus();
    });
    box.btnSend.on("click", pressButton);
    box.btnSend.on("keydown", onButtonKeyDown);
    box.column.onResize(followEnd);

    box.setPlaceholder(box.placeholder);
    applyLook();
    box.setShowInput(box.showInput);
    startMessages.forEach(box.addMessage);
    paintEmpty();
    box.setBusy(box.busy);
    // WHY the motion after the first color: the field reads its height before the button gets its color, so the first
    //     color came with a motion from transparent, and a window that was not drawn (behind the others) kept it
    //     transparent. Reading the style now draws the first color without a motion.
    getComputedStyle(box.btnSend.elem).backgroundColor;
    box.btnSend.css.transition = "background-color 0.15s";
    box.after(0, box.scrollToEnd); // WHY later: the messages of the start are drawn first.

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

ChatView.DOT_DELAY = 0.16; // s: between the dots

// The look of the MarkdownView of an answer over its package: no ground, no room around it (the column has it).
ChatView.ANSWER_LOOK = { box: { color: "transparent" }, page: { padding: [0, 0] } };

// The style of the MarkdownView of an answer: ANSWER_LOOK and the answer keys of a package (the sizes of minimal).
ChatView.answerLookOf = function (style) {
    return Object.assign({}, ChatView.ANSWER_LOOK, style.answer);
};

ChatView.getSendSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M5.5 11.5 12 5l6.5 6.5"/></svg>';
};

ChatView.getStopSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" fill="' + color + '"/></svg>';
};

// The field (a raw <textarea>) and the dots: only a style sheet reaches them.
ChatView.addCss = function () {
    basic.addCss("chat-view-css",
        ".chat-view-field { display: block; width: 100%; box-sizing: border-box; margin: 0; border: 0; outline: none; resize: none;" +
        " background: transparent; font-family: inherit; overflow-y: hidden; pointer-events: auto; user-select: text; -webkit-user-select: text; }" +
        ".chat-view-field::placeholder { color: var(--chat-view-placeholder); opacity: 1; }" +
        "@keyframes chat-view-dot { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }" +
        ".chat-view-dot { animation: chat-view-dot 1.2s infinite ease-in-out; }" +
        "@media (prefers-reduced-motion: reduce) { .chat-view-dot { animation: none; opacity: 0.6; } }");
};

// *** STYLE PACKAGES:
// USAGE: ChatView({ styleName: "dark" })
// USAGE: ChatView({ styleName: "dark", style: { user: { round: 12 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
ChatView.styles = {

    // A white page.
    light: ChatViewDefaults.style,

    // For a dark window: the colors of MarkdownView "dark" and of the fields of the kit.
    dark: {
        box: { color: "#1C1C1B" },
        user: { color: "#2E2E2D", textColor: White(0.9) },
        system: { textColor: White(0.5) },
        answerStyleName: "dark",
        dots: { color: White(0.45) },
        field: {
            color: "#232322",
            borderColor: White(0.12),
            hoverBorderColor: White(0.32),
            focusBorderColor: "#65A293", // the accent of the kit on a dark page
            textColor: White(0.9),
            placeholderColor: White(0.4),
        },
        button: {
            color: "#65A293",
            iconColor: "#141414", // WHY not white: white on the green is too soft to read
            disabledColor: White(0.1),
            disabledIconColor: White(0.4),
            stopColor: White(0.88),
            stopIconColor: "#141414",
        },
        empty: { textColor: White(0.5) },
        focus: { ringColor: "rgba(101, 162, 147, 0.7)" },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): small (a 13 px text, a 28 px button) and made of lines: the bubble of
// the user and the field are lines on the ground of the window; the ink fills only Send. MinimalAccent makes the
// packages of a color of the page from these colors.
ChatView.createMinimalStyle = function (colors) {
    return {
        box: { color: colors.ground },
        page: { padding: [14, 12], gap: 14, maxWidth: 760 },
        user: { color: "transparent", textColor: colors.text, fontSize: 13, lineRatio: 1.55, round: 10, padding: [12, 7], maxWidth: "82%", border: 1, borderColor: colors.line },
        system: { fontSize: 12, textColor: colors.softText },
        answerStyleName: colors.answerStyleName,
        // WHY the sizes of an answer here: MarkdownView has no minimal package; its text takes the 13 px of the theme.
        answer: {
            text: { fontSize: 13, lineRatio: 1.55 },
            heading: { fontSizes: [20, 17, 15, 14, 13, 13] },
            code: { color: "transparent", borderColor: colors.line, round: 4, fontSize: 12, lineHeight: 18 }, // a code is lines too
        },
        dots: { color: colors.softText, size: 5, gap: 4 },
        field: {
            margin: [12, 10],
            padding: [8, 2],
            gap: 6,
            color: "transparent",
            border: 1,
            borderColor: colors.edge,
            hoverBorderColor: colors.edgeHover,
            focusBorderColor: colors.ink,
            round: 4,
            fontSize: 13,
            lineHeight: 20,
            lineSpace: 4,
            textColor: colors.text,
            placeholderColor: colors.faintText,
        },
        button: {
            size: 28,
            iconSize: 14,
            round: 4,
            color: colors.ink,
            iconColor: colors.onInk,
            disabledColor: "transparent",
            disabledIconColor: colors.faintText,
            stopColor: colors.ink,
            stopIconColor: colors.onInk,
        },
        empty: { fontSize: 13, textColor: colors.softText },
        focus: { ringColor: colors.focus },
        scrollBar: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_mouseOverWidth: 4, bar_round: 3, showDots: 0 },
    };
};
ChatView.MINIMAL_COLORS = {
    ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2), edge: Black(0.45),
    edgeHover: Black(0.65), ink: "#1F1F1F", onInk: "#FFFFFF", focus: "#3D8BD9", scrollBar: "#373836", answerStyleName: "light",
};
ChatView.styles.minimal = ChatView.createMinimalStyle(ChatView.MINIMAL_COLORS);
ChatView.MINIMAL_DARK_COLORS = {
    ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18), edge: White(0.42),
    edgeHover: White(0.62), ink: "#EDEDEB", onInk: "#1A1A19", focus: "#7FB6DE", scrollBar: "#CFCFCD", answerStyleName: "dark",
};
ChatView.styles.minimalDark = ChatView.createMinimalStyle(ChatView.MINIMAL_DARK_COLORS);
