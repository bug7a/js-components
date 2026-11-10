/* Bismillah */

/*

StatusBar - v26.11

UI COMPONENT
- The thin bar at the bottom of a window of a program: a short message at the left ("Saved"), small parts at the
  right ("3 files", "UTF-8", "100%").
- A message can have a tone (a colored dot: success, warn, error, info) and a time: after it the bar goes back to
  its lasting message.
- setBusy(1): a small turning circle in front of the message, while a job runs. (Still when the system asks for
  reduced motion.)
- A part with onClick is a real button (Tab, Enter, Space); a part without it is only a text.
- Stands at the bottom of its Box by itself; in a VGroup it takes its place in the column.
- Style packages: "light" (default), "dark", "minimal", "minimalDark" (a package of params: its height too; setTheme()
  changes only the colors and the shapes). Select with styleName (StatusBar.styles), or later with setTheme().

PART: { key, text, icon, tone, ariaLabel, onClick }
- A string is also accepted: "UTF-8" -> { key: "UTF-8", text: "UTF-8" }
- icon: an SVG text ("<svg ...>", your own code, not a user text), drawn with the color of the text of the part.
- tone: "", "success", "warn", "error", "info": the color of its text.
- onClick: function (self, part) {}: self is the StatusBar.

USAGE:
const bar = StatusBar({
    messageText: "Ready",
    items: [
        { key: "files", text: "3 files" },
        "UTF-8",
        { key: "zoom", text: "100%", onClick: function (self, part) { println(part.text); } },
    ],
});
bar.setMessageText("Ready");                 // the lasting message
bar.setMessageText("Saved", "success", 3000); // for 3 seconds, then "Ready" again
bar.setMessageText("The disk is full", "error"); // stays
bar.setBusy(1);
bar.setItemText("files", "4 files");
bar.setItemVisible("zoom", 0);
bar.setItems(["One", "Two"]);
bar.setTheme("dark");
StatusBar({ styleName: "dark" });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const StatusBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    width: "100%",
    height: 28,
    messageText: "",
    messageTone: "", // "", "success", "warn", "error", "info"
    items: [], // [{ key, text, icon, tone, ariaLabel, onClick }, "Text"]
    busy: 0,
    ariaLabel: "Status bar",
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to StatusBar.styles
    style: { // Light style package (default)
        box: { color: "#F4F4F2", lineColor: Black(0.12) },
        layout: { padding: 10, gap: 8 },
        message: { fontSize: 12, textColor: Black(0.68) },
        dot: { size: 8 },
        busy: { size: 12, lineWidth: 2, color: "#3F8D94", trackColor: Black(0.12) },
        part: { fontSize: 12, textColor: Black(0.68), padding: 8, iconSize: 14, iconGap: 5, lineColor: Black(0.12) },
        partHover: { color: Black(0.07), textColor: Black(0.88) },
        tones: { // text: on a text, dot: the dot of a message
            success: { text: "#1F7A5C", dot: "#2E9E74" },
            warn: { text: "#8A5A00", dot: "#E0A92B" },
            error: { text: "#C0362C", dot: "#E2604F" },
            info: { text: "#2467B8", dot: "#4A96D8" },
        },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const StatusBar = function (params = {}) {

    // Merge style package: params.style > StatusBar.styles[styleName] > StatusBarDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, StatusBar.styles, StatusBarDefaults);

    // Merge params:
    mergeIntoIfMissing(params, StatusBarDefaults);

    // Edit params, if needed:
    params.items = (Array.isArray(params.items)) ? params.items : [];
    // WHY not a default: a default bottom would clear a top given by the page. (In a VGroup it has no effect.)
    if (params.top === undefined && params.bottom === undefined) params.bottom = 0;

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let lastingText = box.messageText; // The message a message with a time goes back to
    let lastingTone = box.messageTone;
    let cancelMessageEnd = null; // The cancel function of the waiting end of a message with a time

    // *** PUBLIC VARIABLES:
    box.partList = []; // [{ item, obj }]: the parts and their objects
    // NOTE: Default values are also public variables. (box.messageText, box.messageTone, box.busy...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, StatusBar.styles, StatusBarDefaults);
        mergeIntoIfMissing(fresh, StatusBarDefaults);
        return fresh.style;
    };

    const normalizeItem = function (item) {
        if (typeof item == "string" || typeof item == "number") return { key: String(item), text: String(item) };
        return Object.assign({ key: item.text, text: "" }, item);
    };

    const toneColor = function (tone, partName, fallback) {
        const look = _s.tones[tone];
        return (look) ? look[partName] : fallback;
    };

    // PAINT: a part with the mouse on it
    const paintPart = function (part, isOver) {
        const hasHover = (isOver && part.item.onClick);
        part.obj.color = (hasHover) ? _s.partHover.color : "transparent";
        part.obj.textColor = (hasHover) ? _s.partHover.textColor : toneColor(part.item.tone, "text", _s.part.textColor);
    };

    // CONTENT: the icon and the text of a part
    // WHY: An SVG icon and the text are in one object: a button can not hold other objects.
    const applyPartContent = function (part) {
        if (part.item.icon) {
            part.obj.text = part.item.icon + "<span>" + basic.escapeHtml(part.item.text) + "</span>";
        } else {
            part.obj.plainText = part.item.text;
        }
    };

    const createPartObject = function (item) {
        const isButton = (typeof item.onClick == "function");
        const look = {
            fontSize: _s.part.fontSize,
            height: "100%",
            shrink: 0,
            // WHY display here and not in the class: the visible prop writes back only an inline display.
            css: { display: "inline-flex", padding: "0 " + _s.part.padding + "px" },
        };
        if (!isButton) return Label(look);

        // BUTTON: A part that can be clicked
        const button = Button(look);
        button.minimal = 1;
        button.width = "auto";
        button.round = 0;
        button.setFocusRing(_s.focus.ringColor);
        if (item.ariaLabel) button.aria = { label: item.ariaLabel };
        return button;
    };

    const createPart = function (item, index) {
        const obj = createPartObject(item);
        const part = { item: item, obj: obj };
        obj.elem.classList.add("status-bar-part");
        obj.elem.style.setProperty("--status-bar-icon", _s.part.iconSize + "px");
        obj.elem.style.setProperty("--status-bar-icon-gap", _s.part.iconGap + "px");
        // WHY: A thin line between the parts, not at the left of the first one: the message is not a part of them.
        obj.css.borderLeft = (index > 0) ? ("1px solid " + _s.part.lineColor) : "0";
        applyPartContent(part);
        paintPart(part, 0);
        if (item.onClick) {
            obj.onHoverChange(function (self, isOver) { paintPart(part, isOver); });
            obj.on("click", function () { item.onClick(box, item); });
        }
        return part;
    };

    const createItems = function () {
        box.partList.forEach(function (part) { part.obj.remove(); });
        box.partList = box.items.map(function (item, index) {
            return createIn(box.partGroup, function () { return createPart(item, index); });
        });
    };

    // PAINT: the mark in front of the message: the turning circle or the dot of a tone
    const paintMark = function () {
        const dotColor = toneColor(box.messageTone, "dot", "");
        box.spinner.visible = (box.busy == 1) ? 1 : 0;
        box.dot.visible = (box.busy != 1 && dotColor) ? 1 : 0;
        if (dotColor) box.dot.color = dotColor;
    };

    // CONTENT: the message
    const applyMessage = function () {
        box.lblMessage.plainText = box.messageText;
        box.lblMessage.textColor = toneColor(box.messageTone, "text", _s.message.textColor);
        paintMark();
    };

    // LOOK: everything that comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        box.color = _s.box.color;
        box.css.borderTop = "1px solid " + _s.box.lineColor;
        box.layout.gap = _s.layout.gap;
        box.layout.padding = [_s.layout.padding, 0];
        box.spinner.props({ width: _s.busy.size, height: _s.busy.size, round: _s.busy.size / 2 });
        box.spinner.css.border = _s.busy.lineWidth + "px solid " + _s.busy.trackColor;
        box.spinner.css.borderTopColor = _s.busy.color;
        box.dot.props({ width: _s.dot.size, height: _s.dot.size, round: _s.dot.size / 2 });
        box.lblMessage.fontSize = _s.message.fontSize;
        createItems();
        applyMessage();
    };

    const showMessage = function (text, tone) {
        box.messageText = text;
        box.messageTone = tone;
        applyMessage();
    };

    const stopMessageTimer = function () {
        if (cancelMessageEnd) cancelMessageEnd();
        cancelMessageEnd = null;
    };

    // *** PUBLIC FUNCTIONS:

    // showTime (ms): after it the bar goes back to the lasting message. 0: this one is the lasting message.
    box.setMessageText = function (text, tone = "", showTime = 0) {
        stopMessageTimer();
        showMessage(text, tone);
        if (showTime > 0) {
            cancelMessageEnd = box.after(showTime, function () {
                cancelMessageEnd = null;
                showMessage(lastingText, lastingTone);
            });
            return;
        }
        lastingText = text;
        lastingTone = tone;
    };
 // USAGE: bar.setMessageText("Saved", "success", 3000)

    box.setBusy = function (value) {
        box.busy = basic.isOn(value) ? 1 : 0;
        paintMark();
    };
    // USAGE: bar.setBusy(1)

    box.setItems = function (items) {
        box.items = (Array.isArray(items)) ? items.map(normalizeItem) : [];
        createItems();
    };
    // USAGE: bar.setItems(["3 files", { key: "zoom", text: "100%", onClick: openZoomMenu }])

    box.getItem = function (key) {
        return box.items.find(function (item) { return item.key == key; }) || null;
    };

    const getPart = function (key) {
        return box.partList.find(function (part) { return part.item.key == key; }) || null;
    };

    box.setItemText = function (key, text) {
        const part = getPart(key);
        if (!part) return;
        part.item.text = String(text);
        applyPartContent(part);
    };
    // USAGE: bar.setItemText("files", "4 files")

    box.setItemVisible = function (key, value) {
        const part = getPart(key);
        if (part) part.obj.visible = basic.isOn(value) ? 1 : 0;
    };
    // USAGE: bar.setItemVisible("zoom", 0)

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: bar.setTheme("dark")

    // *** OBJECT VIEW:

    // An SVG icon in a part stands next to its text.
    // WHY: A status bar is one line, so the parts are never wrapped.
    basic.addCss("status-bar-part",
        ".status-bar-part { align-items: center; gap: var(--status-bar-icon-gap); white-space: nowrap; }" +
        ".status-bar-part svg { display: block; width: var(--status-bar-icon); height: var(--status-bar-icon); flex: none; }");
    basic.addCss("status-bar-spin",
        "@keyframes status-bar-spin { to { transform: rotate(360deg); } }" +
        ".status-bar-spinner { animation: status-bar-spin 0.9s linear infinite; }" +
        "@media (prefers-reduced-motion: reduce) { .status-bar-spinner { animation: none; } }");

    // BOX: The bar
    box.css.boxSizing = "border-box";
    box.role = "group";
    box.aria = { label: box.ariaLabel };

    // GROUP: The message at the left, the parts at the right
    box.layout = HGroup({ width: "100%", height: "100%", align: "left center" });

        // BOX: The turning circle
        box.spinner = Box({ color: "transparent", shrink: 0 });
        box.spinner.elem.classList.add("status-bar-spinner");

        // BOX: The dot of a tone
        box.dot = Box({ shrink: 0 });

        // LABEL: The message
        box.lblMessage = Label({ ellipsis: 1, grow: 1, shrink: 1, css: { minWidth: "0", flexBasis: "0" } });
        box.lblMessage.role = "status";

        // GROUP: The parts
        box.partGroup = HGroup({ width: "auto", height: "100%", align: "right center", gap: 0, shrink: 0 });
        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    box.items = (Array.isArray(params.items)) ? params.items.map(normalizeItem) : [];
    applyLook();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: StatusBar({ styleName: "dark" })
// USAGE: StatusBar({ styleName: "dark", style: { box: { color: "#101010" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: StatusBar.styles.myStyle = { box: { color: "tomato" } };
StatusBar.styles = {

    // A light gray bar, dark text, a soft line over it.
    light: StatusBarDefaults.style,

    // For a dark window.
    dark: {
        box: { color: "#232322", lineColor: White(0.1) },
        message: { textColor: White(0.72) },
        busy: { color: "#6FC6CD", trackColor: White(0.16) },
        part: { textColor: White(0.72), lineColor: White(0.1) },
        partHover: { color: White(0.09), textColor: White(0.95) },
        tones: {
            success: { text: "#7FE3B5", dot: "#2E9E74" },
            warn: { text: "#F1C74A", dot: "#F1C74A" },
            error: { text: "#FF9F93", dot: "#E8796D" },
            info: { text: "#8CC4EE", dot: "#5AA9E6" },
        },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): no fill (the ground of the window), one line over it, 12 px soft
// texts; a part that can be clicked gets darker under the mouse (no fill). minimalDark: the same on a dark window.
StatusBar.createMinimalStyle = function (colors) {
    return {
        height: 24,
        style: {
            box: { color: "transparent", lineColor: colors.line },
            layout: { padding: 10, gap: 8 },
            message: { fontSize: 12, textColor: colors.softText },
            dot: { size: 6 },
            busy: { size: 12, lineWidth: 1.5, color: colors.ink, trackColor: colors.track },
            part: { fontSize: 12, textColor: colors.softText, padding: 8, iconSize: 12, iconGap: 5, lineColor: colors.line },
            partHover: { color: "transparent", textColor: colors.text },
            tones: colors.tones,
            focus: { ringColor: colors.focus },
        },
    };
};
// WHY own tones: the texts of a tone must read on the ground of the window (4.5:1); the light tones were about 3:1 on dark.
StatusBar.MINIMAL_COLORS = {
    text: Black(0.85), softText: Black(0.55), line: Black(0.2), track: Black(0.12), ink: "#1F1F1F", focus: "#3D8BD9",
    tones: {
        success: { text: "#1F7A5C", dot: "#2E9E74" },
        warn: { text: "#8A5A00", dot: "#B77A00" },
        error: { text: "#C24A36", dot: "#C24A36" },
        info: { text: "#2467B8", dot: "#3D8BD9" },
    },
};
StatusBar.styles.minimal = StatusBar.createMinimalStyle(StatusBar.MINIMAL_COLORS);
StatusBar.MINIMAL_DARK_COLORS = {
    text: White(0.88), softText: White(0.55), line: White(0.18), track: White(0.14), ink: "#EDEDEB", focus: "#7FB6DE",
    tones: {
        success: { text: "#7FE3B5", dot: "#7FE3B5" },
        warn: { text: "#E8B23A", dot: "#E8B23A" },
        error: { text: "#FF9F93", dot: "#FF9F93" },
        info: { text: "#7FB6DE", dot: "#7FB6DE" },
    },
};
StatusBar.styles.minimalDark = StatusBar.createMinimalStyle(StatusBar.MINIMAL_DARK_COLORS);
