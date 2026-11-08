/* Bismillah */

/*

Numeric Keyboard - v26.10

Number keys on the screen (a PIN, an amount, a kiosk, a touch screen): a title, the typed value, the keys.
The look: white keys with a thin
dark line and round corners, a big bold value, a small gray title.
- keyLayout "wide": two rows (1 2 3 4 5 ⌫ / 6 7 8 9 0). "phone": 1-9 in three rows, then ⌫ 0 ✓ (onEnter).
- maxLength: the most digits; mask: 1 shows • for each digit (a PIN).
- The keyboard of the computer works too while the component has the focus: the digits, Backspace, Enter.
- The backspace key is drawn with SVG (no image file).
- onChange(self) at every change of self.value; onEnter(self): the ✓ key or Enter.

USAGE:
const pin = NumericKeyboard({ titleText: "PIN", maxLength: 4, mask: 1, onChange: function (self) { println(self.value); } });
NumericKeyboard({ keyLayout: "phone", titleText: "AMOUNT", maxLength: 8, onEnter: function (self) { pay(self.value); } });
pin.setValue("12");
pin.clear();

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const NumericKeyboardDefaults = {
    width: "auto", // As wide as the keys
    height: "auto",
    keyLayout: "wide", // "wide": two rows; "phone": a 3 x 4 grid with an enter key
    titleText: "PIN", // "": no title
    value: "",
    maxLength: 4,
    mask: 0, // 1: a • for each digit (a PIN)
    showValue: 1, // 0: only the keys (the value is shown somewhere else)
    onChange: function (self) {},
    onEnter: function (self) {},
    styleName: "light", // "light" ("classic": its old name), "dark" or a name added to NumericKeyboard.styles
    style: { // Classic style package
        box: { color: "transparent" },
        layout: { gap: 10, padding: [35, 20] },
        title: { fontSize: 18, textColor: "rgba(20, 20, 20, 0.5)" },
        value: { fontSize: 35, textColor: "rgba(20, 20, 20, 0.9)", fontFamily: "opensans-bold", height: 50 },
        key: { size: 80, gap: 10, round: 14, color: "white", border: 1, borderColor: "rgba(0, 0, 0, 0.7)", fontSize: 35, textColor: "#141414" },
        keyHover: { color: "#F7F7F7" },
        keyPressed: { color: "#E9E9E9" },
        enterKey: { color: "#141414", textColor: "white" },
        focus: { ringColor: "rgba(95, 158, 160, 0.6)" },
    },
};

const NumericKeyboard = function (params = {}) {

    // Merge style package: params.style > NumericKeyboard.styles[styleName] > NumericKeyboardDefaults.style
    basic.applyStylePackage(params, NumericKeyboard.styles, NumericKeyboardDefaults);

    // Merge params:
    mergeIntoIfMissing(params, NumericKeyboardDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const BACKSPACE = "back";
    const ENTER = "enter";
    const ROWS = {
        wide: [["1", "2", "3", "4", "5", BACKSPACE], ["6", "7", "8", "9", "0"]],
        phone: [["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], [BACKSPACE, "0", ENTER]],
    };
    const ICONS = {
        back: '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" style="display: block"><path d="M9 5h11v14H9l-6-7z"/><path d="M12 9.5l5 5M17 9.5l-5 5"/></svg>',
        enter: '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="display: block"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    };

    // *** PUBLIC VARIABLES:
    box.keyList = []; // The key boxes (key.keyValue: "0".."9", "back", "enter")
    // NOTE: Default values are also public variables. (box.value, box.maxLength...)

    // *** PRIVATE FUNCTIONS:

    const showValue = function () {
        if (!box.lblValue) return;
        box.lblValue.plainText = box.mask ? "•".repeat(box.value.length) : box.value;
    };

    // The only way the value changes: it is shown and onChange runs (not with silent: 1).
    const changeValue = function (value, silent) {
        value = String(value === undefined || value === null ? "" : value).replace(/\D/g, "").slice(0, box.maxLength);
        if (value === box.value) return;
        box.value = value;
        showValue();
        if (!silent) box.onChange(box);
    };

    const pressKey = function (keyValue) {
        if (keyValue == ENTER) {
            box.onEnter(box);
            return;
        }
        if (keyValue == BACKSPACE) {
            changeValue(box.value.slice(0, -1));
            return;
        }
        if (box.value.length >= box.maxLength) return;
        changeValue(box.value + keyValue);
    };

    const ENTER_PRESSED_OPACITY = 0.8;

    const paintKey = function (key) {
        const isEnter = (key.keyValue == ENTER);
        let color = isEnter ? _s.enterKey.color : _s.key.color;
        if (key.isPressed && !isEnter) color = _s.keyPressed.color;
        else if (key.isHover && !isEnter) color = _s.keyHover.color;
        key.color = color;
        // WHY: the pressed color of the keys hid the text of the Enter key (white on light gray); it fades instead
        if (isEnter) key.opacity = key.isPressed ? ENTER_PRESSED_OPACITY : 1;
    };

    // BOX: One key. Its container must be set.
    const createKey = function (keyValue, width) {

        const isEnter = (keyValue == ENTER);
        const key = Label({
            width: width,
            height: _s.key.size,
            round: _s.key.round,
            border: _s.key.border,
            borderColor: _s.key.borderColor,
            fontSize: _s.key.fontSize,
            textColor: isEnter ? _s.enterKey.textColor : _s.key.textColor,
            clickable: 1,
            cursor: "pointer",
            role: "button",
            aria: { label: (keyValue == BACKSPACE) ? "Delete" : (isEnter ? "Enter" : keyValue) },
            css: { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: "0" },
        });
        key.text = ICONS[keyValue] || keyValue;
        key.keyValue = keyValue;
        key.isHover = 0;
        key.isPressed = 0;

        key.onHoverChange(function (self, isOver) {
            key.isHover = isOver;
            if (!isOver) key.isPressed = 0;
            paintKey(key);
        });
        key.on("pointerdown", function () {
            key.isPressed = 1;
            paintKey(key);
        });
        // WHY pointercancel: a touch that turns into a scroll gives no pointerup
        const release = function () {
            key.isPressed = 0;
            paintKey(key);
        };
        key.on("pointerup", release);
        key.on("pointercancel", release);
        key.on("click", function () {
            pressKey(keyValue);
        });

        paintKey(key);
        return key;

    };

    // The keys of the computer while the component has the focus
    const onKeyDown = function (self, event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return; // WHY: the shortcuts of the browser (Cmd+1...)
        if (/^[0-9]$/.test(event.key)) {
            pressKey(event.key);
            event.preventDefault();
            return;
        }
        if (event.key == "Backspace" || event.key == "Delete") {
            pressKey(BACKSPACE);
            event.preventDefault();
            return;
        }
        if (event.key == "Enter") {
            event.preventDefault();
            if (!event.repeat) pressKey(ENTER); // WHY: a held Enter must not call onEnter (Ex: pay) again and again
        }
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called.
    box.setValue = function (value, silent = 0) {
        changeValue(value, silent);
    };
    // USAGE: get: keyboard.value, set: keyboard.setValue("12")

    box.getValue = function () {
        return box.value;
    };

    box.clear = function (silent = 0) {
        changeValue("", silent);
    };

    box.setTitleText = function (text) {
        box.titleText = text;
        box.aria = { label: text || "Numeric keyboard" };
        if (!box.lblTitle) return;
        box.lblTitle.plainText = text;
        box.lblTitle.visible = text ? 1 : 0;
    };

    // *** OBJECT VIEW:

    box.props(_s.box);
    box.tabIndex = 0;
    box.role = "group";
    box.aria = { label: box.titleText || "Numeric keyboard" };
    box.setFocusRing(_s.focus.ringColor);

    const rows = ROWS[box.keyLayout] || ROWS.wide;
    const columnCount = Math.max.apply(null, rows.map(function (row) { return row.length; }));

    // GROUP: Layout (the title, the value, the keys)
    box.layout = VGroup({ hug: 1, align: "center top", gap: 0, padding: _s.layout.padding, position: "relative", clipContent: 0 });

        if (box.showValue == 1) {

            // LABEL: Title
            box.lblTitle = Label({ ..._s.title, textAlign: "center" });
            box.setTitleText(box.titleText);

            // LABEL: Value
            // WHY a fixed height: the keys must not move when the first digit comes (an empty label is lower)
            box.lblValue = Label({ ..._s.value, textAlign: "center", css: { lineHeight: _s.value.height + "px", minHeight: _s.value.height + "px", whiteSpace: "nowrap" } });
            box.lblValue.css = { marginBottom: _s.layout.gap + "px" };

        }

        // GROUP: Keys (a row group for each row of keys)
        VGroup({ hug: 1, align: "left top", gap: _s.key.gap, clipContent: 0 });

            rows.forEach(function (row) {

                HGroup({ hug: 1, align: "left top", gap: _s.key.gap, clipContent: 0 });
                    row.forEach(function (keyValue, i) {
                        // WHY: the last key of a shorter row ("0" of "wide") takes the room of the missing keys
                        const isLastOfShortRow = (i == row.length - 1) && (row.length < columnCount);
                        const span = isLastOfShortRow ? columnCount - row.length + 1 : 1;
                        const width = span * _s.key.size + (span - 1) * _s.key.gap;
                        box.keyList.push(createKey(keyValue, width));
                    });
                endGroup();

            });

        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    box.on("keydown", onKeyDown);
    const startValue = box.value;
    box.value = "";
    changeValue(startValue, 1);
    showValue();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: NumericKeyboard({ styleName: "dark" })
// NOTE: A new package needs only the keys that differ from the light style.
NumericKeyboard.styles = {

    light: NumericKeyboardDefaults.style,

    // For a dark page.
    dark: {
        title: { fontSize: 18, textColor: "rgba(255, 255, 255, 0.5)" },
        value: { fontSize: 35, textColor: "rgba(255, 255, 255, 0.92)", fontFamily: "opensans-bold", height: 50 },
        key: { size: 80, gap: 10, round: 14, color: "#2B2D31", border: 1, borderColor: "rgba(255, 255, 255, 0.18)", fontSize: 35, textColor: "rgba(255, 255, 255, 0.9)" },
        keyHover: { color: "#33353A" },
        keyPressed: { color: "#3C3E44" },
        enterKey: { color: "#F2C14E", textColor: "#1B2632" },
        focus: { ringColor: "rgba(95, 179, 181, 0.7)" },
    },

};
NumericKeyboard.styles.classic = NumericKeyboard.styles.light; // the old name of light: the pages made with it keep their look
