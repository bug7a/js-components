/* Bismillah */

/*

Check Box - v26.09

UI COMPONENT TEMPLATE
- A customizable check box with a label.
- Checkmark is drawn with code (no image files needed).
- Supports: checked, enabled, label position (left/right), keyboard (Space/Enter).
- Whole object background can change on hover and checked states (style.hoverBox, style.checkedBox).
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (CheckBox.styles)

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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
    labelPosition: "right", // "right", "left"
    onChange: function (self) { }, // self.checked
    styleName: "classic", // "classic", "modern", "dark" or a name added to CheckBox.styles
    style: { // Classic style package (default)
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
            color: "#141414",
            borderColor: "#141414",
        },
        hoverMark: { // Mouse over (only border)
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
    }
};

const CheckBox = function (params = {}) {

    // Merge style package: params.style > CheckBox.styles[styleName] > CheckBoxDefaults.style (classic)
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

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.checked, box.enabled, box.labelText)

    // *** PRIVATE FUNCTIONS:

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
        box.mark.color = box.style.mark.color;
        box.mark.borderColor = (isHover) ? box.style.hoverMark.borderColor : box.style.mark.borderColor;
        box.tick.css = { opacity: "0", transform: "rotate(45deg) scale(" + TICK_HIDDEN_SCALE + ")" };
    };

    const paintEnabled = function () {
        const isEnabled = (box.enabled == 1);
        box.opacity = (isEnabled) ? 1 : box.style.disabled.opacity;
        box.cursor = (isEnabled) ? "pointer" : "default";
        box.tabIndex = (isEnabled) ? 0 : -1;
    };

    // The look of the current state (checked, mouse over, enabled).
    const paint = function () {
        const isHover = (isMouseOver && box.enabled == 1);
        box.color = getBoxColor(isHover);
        paintMark(isHover);
        paintEnabled();
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
        box.label.text = text;
        box.label.visible = (text) ? 1 : 0;
    };
    // USAGE: get: checkBox.labelText, set: checkBox.setLabelText("Remember me")

    box.refresh = function () {
        paint();
    };

    // *** OBJECT VIEW:
    box.clickable = 1;
    box.role = "checkbox";
    box.css = { outline: "none", userSelect: "none" };
    box.setMotion("background-color " + MOTION_DURATION);

    // GROUP: mark, label
    box.contentBox = HGroup({
        width: "auto",
        height: "auto",
        position: "relative",
        ...box.style.layout,
    });

    // LABEL: label (left or right of the mark)
    const createLabel = function () {
        box.label = Label(box.style.label);
        box.label.text = box.labelText;
        box.label.css.whiteSpace = "nowrap";
        if (!box.labelText) box.label.visible = 0;
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
    paint();

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
    classic: CheckBoxDefaults.style,

    // Light box, thin border. When checked, only the tick is visible on a light background.
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
        checkedMark: { // Checked square (stays without border, behind the tick)
            color: "#DFECEC", // Same as hoverCheckedBox.color, so the square is not visible on mouse over.
            borderColor: "transparent",
        },
        hoverMark: { // Mouse over (only border)
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
