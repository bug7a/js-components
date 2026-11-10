/* Bismillah */

/*

Check Box - v26.11

UI COMPONENT TEMPLATE
- A customizable check box with a label.
- Checkmark is drawn with code (no image files needed).
- Supports: checked, enabled, label position (left/right), keyboard (Space/Enter).
- wrapLabel: 1 -> a long label wraps to more lines (give the check box a width, or grow: 1 in an HGroup).
  The label is HTML: a text of the user goes in with basic.escapeHtml(text).
- Whole object background can change on hover and checked states (style.hoverBox, style.checkedBox).
- The empty square under the mouse: style.hoverMark (its borderColor, and its color when given; v26.11).
- animated: 1 (context/basic-js-animated-rules.md): the square grows a little under the mouse
  (1.05) and the tick draws in from 0.6 with a fade, in 0.25 s with a soft stop. Nothing moves at the first view; off
  when the system asks for reduced motion. animated: 0 (default) keeps the short tick motion it always had.
  setAnimated(0/1).
- style.focus.ringColor: the keyboard focus shows on the mark (its edge in this color, 2 px). "": none (the old
  packages); "minimal" / "minimalDark" have it.
- Style packages: "light" (default; the old name "classic" works too), "modern", "dark", "minimal", "minimalDark". Select with styleName. (CheckBox.styles)
  NEW PROJECTS: use "light" on a light page and "dark" on a dark page, unless the user
  asks for another one ("modern" only when asked).

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const CheckBoxDefaults = { 
    key: "0",
    width: "auto",
    height: "auto",
    checked: 0, // 0, 1
    enabled: 1, // 0, 1
    labelText: "",
    allowHtml: 0, // 1: labelText is HTML (only for your own texts)
    labelPosition: "right", // "right", "left"
    wrapLabel: 0, // 1: a long label wraps (the check box needs a width); 0: one line
    animated: 0, // 1: the square grows a little under the mouse, the tick draws in (box.setAnimated(0/1))
    onChange: function (self) { }, // self.checked
    styleName: "light", // "light" ("classic": its old name), "modern", "dark", "minimal", "minimalDark" or a name added to CheckBox.styles
    style: { // Light style package (default)
        box: { // Whole object background
            color: "transparent",
            round: 0,
        },
        hoverBox: { // Mouse over (whole object background)
            color: null, // null: uses box.color
        },
        checkedBox: { // Checked (whole object background)
            color: null, // null: uses box.color
        },
        hoverCheckedBox: { // Checked and mouse over (whole object background)
            color: null, // null: uses checkedBox.color
        },
        layout: {
            gap: 10,
            padding: [0, 4],
            align: "left center",
        },
        mark: { // Unchecked square
            width: 22,
            height: 22,
            color: White(1),
            border: 2,
            borderColor: Black(0.35),
            round: 5,
        },
        checkedMark: { // Checked square
            // #242424: a soft black
            color: "#242424",
            borderColor: "#242424",
        },
        hoverMark: { // Mouse over (the empty square)
            color: null, // null: uses mark.color, so a package can change it
            borderColor: Black(0.7),
        },
        tick: {
            color: White(1),
            thickness: 2,
        },
        label: {
            fontSize: 16,
            textColor: Black(0.8),
        },
        disabled: {
            opacity: 0.4,
        },
        focus: { // The keyboard focus: the edge of the mark in this color, 2 px. "": no ring
            ringColor: "",
        },
    }
};

const CheckBox = function (params = {}) {

    // Merge style package: params.style > CheckBox.styles[styleName] > CheckBoxDefaults.style (light)
    basic.applyStylePackage(params, CheckBox.styles, CheckBoxDefaults);

    // Merge params:
    mergeIntoIfMissing(params, CheckBoxDefaults);

    // Edit params, if needed:
    params.color = params.style.box.color;
    params.round = params.style.box.round;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let isMouseOver = 0;
    const MOTION_DURATION = "0.15s";
    // The tick is a rotated corner (right and bottom borders), sized as a part of the inner square.
    const TICK_WIDTH_RATIO = 0.3;
    const TICK_HEIGHT_RATIO = 0.58;
    const TICK_RAISE_RATIO = 0.06; // The tick is lifted a little above the center.
    const TICK_HIDDEN_SCALE = 0.4; // The tick grows from this size when checked.
    // MOTION (animated: 1)
    const MOTION_TIME = "0.25s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start, a soft stop
    const HOVER_GROW = 1.05; // the square under the mouse
    const TICK_COME_SCALE = 0.6; // the tick draws in from this size
    let wasAnimated = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.checked, box.enabled, box.labelText)

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    // The keyboard focus (style.focus.ringColor) on the mark: its edge in that color and 1 px more inside it.
    // WHY on the mark, inside it: a ring around the whole object hid its text, and an outer ring was cut by the groups.
    // WHY a CSS rule: only :focus-visible knows a focus of the keyboard (not of a click).
    const showFocusOnMark = function () {
        const ringColor = box.style.focus.ringColor;
        if (!ringColor) return;
        CheckBox.addFocusCss();
        box.elem.classList.add("check-box-focus");
        box.mark.elem.classList.add("check-box-mark");
        box.elem.style.setProperty("--check-box-focus", ringColor);
    };

    // The whole object background. A null color uses the color of the state below it.
    const getBoxColor = function (isHover) {
        const boxColor = box.style.box.color;
        const checkedBoxColor = box.style.checkedBox.color || boxColor;
        if (box.checked == 1) {
            if (isHover) return box.style.hoverCheckedBox.color || checkedBoxColor;
            return checkedBoxColor;
        }
        if (isHover) return box.style.hoverBox.color || boxColor;
        return boxColor;
    };

    const paintMark = function (isHover) {
        if (box.checked == 1) {
            box.mark.color = box.style.checkedMark.color;
            box.mark.borderColor = box.style.checkedMark.borderColor;
            box.tick.css = { opacity: "1", transform: "rotate(45deg) scale(1)" };
            return;
        }
        const hoverColor = box.style.hoverMark.color;
        box.mark.color = (isHover && hoverColor) ? hoverColor : box.style.mark.color;
        box.mark.borderColor = (isHover) ? box.style.hoverMark.borderColor : box.style.mark.borderColor;
        const hiddenScale = (isMotionOn()) ? TICK_COME_SCALE : TICK_HIDDEN_SCALE;
        box.tick.css = { opacity: "0", transform: "rotate(45deg) scale(" + hiddenScale + ")" };
    };

    const paintEnabled = function () {
        const isEnabled = (box.enabled == 1);
        box.opacity = (isEnabled) ? 1 : box.style.disabled.opacity;
        box.cursor = (isEnabled) ? "pointer" : "default";
        box.tabIndex = (isEnabled) ? 0 : -1;
    };

    // *** MOTION (animated: 1)

    const isMotionOn = function () {
        if (box.animated != 1) return false;
        return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    const getMarkTransform = function () {
        if (isMouseOver && box.enabled == 1) return "scale(" + HOVER_GROW + ")";
        return "none";
    };

    const paintMotion = function () {
        if (!isMotionOn()) return;
        box.mark.css = { transform: getMarkTransform() };
    };

    // The transitions of the motion, or the still look again (only when it was animated)
    const applyAnimated = function () {
        const tickTime = (isMotionOn()) ? MOTION_TIME + " " + MOTION_EASE : MOTION_DURATION;
        if (isMotionOn()) {
            // WHY the origin at the side of the edge: the grown square does not go out of the box at that edge
            box.mark.css = { transformOrigin: (box.labelPosition === "left") ? "right center" : "left center" };
            box.mark.setMotion("background-color " + MOTION_DURATION + ", border-color " + MOTION_DURATION + ", transform " + MOTION_TIME + " " + MOTION_EASE);
            box.tick.css = { transition: "transform " + tickTime + ", opacity " + tickTime };
            wasAnimated = 1;
        } else if (wasAnimated) {
            // WHY Now: the still look comes back at once (setMotion waits a moment: it is for the first view)
            box.mark.setMotionNow("background-color " + MOTION_DURATION + ", border-color " + MOTION_DURATION);
            box.mark.css = { transform: "none" };
            box.tick.css = { transition: "transform " + tickTime + ", opacity " + tickTime };
            wasAnimated = 0;
        }
        paint();
    };

    // The look of the current state (checked, mouse over, enabled).
    const paint = function () {
        const isHover = (isMouseOver && box.enabled == 1);
        box.color = getBoxColor(isHover);
        paintMark(isHover);
        paintEnabled();
        paintMotion();
        box.aria = { checked: (box.checked == 1), disabled: (box.enabled != 1) };
    };

    // *** PUBLIC FUNCTIONS:

    box.setChecked = function (checked, silent = 0) {

        checked = basic.isOn(checked) ? 1 : 0;
        if (box.checked == checked) return;

        box.checked = checked;
        paint();

        if (!silent) box.onChange(box);

    };
    // USAGE: get: checkBox.checked, set: checkBox.setChecked(1)
    // NOTE: setChecked(1, 1) changes the value without calling onChange.

    box.toggle = function () {
        if (box.enabled != 1) return;
        box.setChecked((box.checked == 1) ? 0 : 1);
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        paint();
    };
    // USAGE: get: checkBox.enabled, set: checkBox.setEnabled(0)

    box.setLabelText = function (text) {
        box.labelText = text;
        setText(box.label, text);
        box.label.visible = (text) ? 1 : 0;
    };
    // USAGE: get: checkBox.labelText, set: checkBox.setLabelText("Remember me")

    box.refresh = function () {
        paint();
    };

    box.setAnimated = function (value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: checkBox.setAnimated(1)

    // *** OBJECT VIEW:
    box.clickable = 1;
    box.role = "checkbox";
    box.css = { outline: "none", userSelect: "none" };
    box.setMotion("background-color " + MOTION_DURATION);

    const isWrapLabel = basic.isOn(box.wrapLabel);
    // WHY: a flex item does not get narrower than its content without minWidth 0 (the long label pushed the row out)
    if (isWrapLabel) box.css = { minWidth: "0px" };

    // GROUP: mark, label
    box.contentBox = HGroup({
        width: isWrapLabel ? "100%" : "auto",
        height: "auto",
        position: "relative",
        ...box.style.layout,
    });

    // LABEL: label (left or right of the mark)
    const createLabel = function () {
        box.label = Label(box.style.label);
        setText(box.label, box.labelText);
        if (!box.labelText) box.label.visible = 0;
        if (!isWrapLabel) {
            box.label.css.whiteSpace = "nowrap";
            return;
        }
        box.label.grow = 1;
        box.label.css = { minWidth: "0px", whiteSpace: "normal", overflowWrap: "anywhere" };
    };

    if (box.labelPosition === "left") createLabel();

    // BOX: mark (square)
    box.mark = startBox({
        width: box.style.mark.width,
        height: box.style.mark.height,
        color: box.style.mark.color,
        border: box.style.mark.border,
        borderColor: box.style.mark.borderColor,
        round: box.style.mark.round,
    });
    box.mark.setMotion("background-color " + MOTION_DURATION + ", border-color " + MOTION_DURATION);
    box.mark.css.boxSizing = "border-box";
    showFocusOnMark();
    box.mark.shrink = 0; // (a wrapping label must not squeeze the mark)

    // BOX: tick (drawn with right and bottom borders, rotated 45deg)
    const innerWidth = box.style.mark.width - (box.style.mark.border * 2);
    const innerHeight = box.style.mark.height - (box.style.mark.border * 2);
    const tickWidth = Math.round(innerWidth * TICK_WIDTH_RATIO);
    const tickHeight = Math.round(innerHeight * TICK_HEIGHT_RATIO);
    const tickBorder = box.style.tick.thickness + "px solid " + box.style.tick.color;

    box.tick = Box({
        left: Math.round((innerWidth - tickWidth) / 2),
        top: Math.round((innerHeight - tickHeight) / 2) - Math.round(innerHeight * TICK_RAISE_RATIO),
        width: tickWidth,
        height: tickHeight,
        color: "transparent",
    });
    box.tick.css = {
        boxSizing: "border-box",
        borderRight: tickBorder,
        borderBottom: tickBorder,
        transition: "transform " + MOTION_DURATION + ", opacity " + MOTION_DURATION,
    };

    endBox();

    if (box.labelPosition !== "left") createLabel();

    endGroup();

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        box.toggle();
    });

    box.on("keydown", function (self, event) {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (event.repeat) return; // WHY: a held key flipped it again and again (its end state was a matter of luck)
        box.toggle();
    });

    box.on("mouseover", function () {
        isMouseOver = 1;
        if (box.enabled == 1) paint();
    });

    box.on("mouseout", function () {
        isMouseOver = 0;
        paint();
    });

    box.checked = basic.isOn(box.checked) ? 1 : 0;
    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    applyAnimated(); // (it paints)

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: CheckBox({ styleName: "modern" })
// USAGE: CheckBox({ styleName: "modern", style: { tick: { color: "tomato" } } }) // Change only some keys.
// USAGE: CheckBox({ style: CheckBox.styles.modern }) // The same as styleName: "modern". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: CheckBox.styles.myStyle = { tick: { color: "red" } };
CheckBox.styles = {

    // White box with a border. When checked, dark filled box with a white tick. No background.
    light: CheckBoxDefaults.style,

    // Light box, thin border. When checked, the tick on a white square with an edge.
    modern: {
        box: { // Whole object background
            color: "transparent",
            round: 8,
        },
        hoverBox: { // Mouse over (whole object background)
            color: "whitesmoke", // null: uses box.color
        },
        checkedBox: { // Checked (whole object background)
            color: "#EFF5F6", // 10% of tick color on white. null: uses box.color
        },
        hoverCheckedBox: { // Checked and mouse over (whole object background)
            color: "#DFECEC", // 20% of tick color on white. null: uses checkedBox.color
        },
        layout: {
            gap: 12,
            padding: [12, 10],
            align: "left center",
        },
        mark: { // Unchecked square
            width: 22,
            height: 22,
            color: "whitesmoke",
            border: 1,
            borderColor: Black(0.7),
            round: 4,
        },
        checkedMark: { // Checked square: white with an edge, behind the tick
            color: "white",
            borderColor: Black(0.7),
        },
        hoverMark: { // Mouse over: the empty square turns white
            color: "white",
            borderColor: Black(0.7),
        },
        tick: {
            color: "cadetblue", // #5F9EA0
            thickness: 3,
        },
        label: {
            fontSize: 16,
            textColor: Black(0.85),
        },
        disabled: {
            opacity: 0.4,
        },
    },

    // Dark theme (the Ozden Panel colors, same as SidePanel, Stepper and Tabs "dark"): the classic shape on a dark page.
    // NOTE: Only the keys that differ from classic.
    dark: {
        mark: { // Unchecked square
            color: "#2A2A29",
            borderColor: White(0.3),
        },
        checkedMark: { // Checked square
            color: "#3D7A6B",
            borderColor: "#3D7A6B",
        },
        hoverMark: { // Mouse over (only border)
            borderColor: White(0.6),
        },
        label: {
            textColor: White(0.85),
        },
    },

};
CheckBox.styles.classic = CheckBox.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): a 14 px square of a line, darker under the mouse; when checked an ink
// line and an ink tick inside it, no fill; a 13 px text.
// WHY a strong line: the line is the only thing that shows an empty mark (3:1 at least, as WCAG asks of a control)
CheckBox.createMinimalStyle = function (colors) {
    return {
        layout: { gap: 8, padding: [0, 2], align: "left center" },
        mark: { width: 14, height: 14, color: "transparent", border: 1, borderColor: colors.line, round: 3 },
        checkedMark: { color: "transparent", borderColor: colors.ink },
        hoverMark: { color: null, borderColor: colors.lineHover },
        tick: { color: colors.ink, thickness: 1.5 },
        label: { fontSize: 13, textColor: colors.text },
        disabled: { opacity: 0.4 },
        focus: { ringColor: colors.focus },
    };
};
CheckBox.MINIMAL_COLORS = { line: Black(0.45), lineHover: Black(0.65), ink: "#1F1F1F", text: Black(0.85), focus: "#3D8BD9" };
CheckBox.styles.minimal = CheckBox.createMinimalStyle(CheckBox.MINIMAL_COLORS);
CheckBox.MINIMAL_DARK_COLORS = { line: White(0.42), lineHover: White(0.62), ink: "#EDEDEB", text: White(0.88), focus: "#7FB6DE" };
CheckBox.styles.minimalDark = CheckBox.createMinimalStyle(CheckBox.MINIMAL_DARK_COLORS);

// The rule of the keyboard focus (style.focus.ringColor). WHY !important: the edge of the mark is an inline style.
CheckBox.addFocusCss = function () {
    basic.addCss("check-box-focus", ".check-box-focus:focus { outline: none; }" +
        ".check-box-focus:focus-visible .check-box-mark { border-color: var(--check-box-focus) !important; box-shadow: inset 0 0 0 1px var(--check-box-focus); }");
};
