/* Bismillah */

/*

Radio Button - v26.09

UI COMPONENT TEMPLATE
- A customizable radio button with a label.
- Radio buttons with the same "group" name work together: only one can be selected.
- Mark is drawn with code (no image files needed).
- Supports: checked, enabled, value, label position (left/right),
  keyboard (Space/Enter to select, Arrow keys to move in the group).
- Whole object background can change on hover and checked states (style.hoverBox, style.checkedBox).
- Style packages: "classic" (default), "modern". Select with styleName. (RadioButton.styles)

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const RadioButtonDefaults = {
    key: "0",
    width: "auto",
    height: "auto",
    group: "default", // Radio buttons with the same group name work together.
    value: "", // Returned by RadioButton.getValue(group)
    checked: 0, // 0, 1
    enabled: 1, // 0, 1
    labelText: "",
    labelPosition: "right", // "right", "left"
    onChange: function (self) { }, // Called when this radio button is selected.
    styleName: "classic", // "classic", "modern" or a name added to RadioButton.styles
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
        mark: { // Unchecked circle
            width: 22,
            height: 22,
            color: White(1),
            border: 2,
            borderColor: Black(0.35),
            round: 100,
        },
        checkedMark: { // Checked circle
            color: White(1),
            borderColor: "#141414",
        },
        hoverMark: { // Mouse over (only border)
            borderColor: Black(0.7),
        },
        dot: {
            color: "#141414",
            size: 0.5, // Ratio of the inner circle size (0 - 1)
            round: 100,
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

const RadioButton = function (params = {}) {

    // Merge style package: params.style > RadioButton.styles[styleName] > RadioButtonDefaults.style (classic)
    const _styleName = params.styleName || RadioButtonDefaults.styleName;
    const _stylePackage = RadioButton.styles[_styleName];
    if (!_stylePackage) console.warn("RadioButton: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, RadioButtonDefaults);

    // Edit params, if needed:
    params.color = params.style.box.color;
    params.round = params.style.box.round;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let isMouseOver = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.checked, box.value, box.group)

    // *** PRIVATE FUNCTIONS:

    const getGroupList = function () {
        return RadioButton.getGroup(box.group);
    };

    // Update the view according to the current state.
    const updateView = function () {

        const _mark = box.style.mark;
        const _checked = box.style.checkedMark;
        const _hover = (isMouseOver && box.enabled == 1);

        // Whole object background colors:
        const _boxColor = box.style.box.color;
        const _hoverBoxColor = box.style.hoverBox.color || _boxColor;
        const _checkedBoxColor = box.style.checkedBox.color || _boxColor;
        const _hoverCheckedBoxColor = box.style.hoverCheckedBox.color || _checkedBoxColor;

        if (box.checked == 1) {
            box.color = (_hover) ? _hoverCheckedBoxColor : _checkedBoxColor;
            box.mark.color = _checked.color;
            box.mark.borderColor = _checked.borderColor;
            box.dot.elem.style.opacity = "1";
            box.dot.elem.style.transform = "scale(1)";
        } else {
            box.color = (_hover) ? _hoverBoxColor : _boxColor;
            box.mark.color = _mark.color;
            box.mark.borderColor = (_hover) ? box.style.hoverMark.borderColor : _mark.borderColor;
            box.dot.elem.style.opacity = "0";
            box.dot.elem.style.transform = "scale(0.3)";
        }

        box.opacity = (box.enabled == 1) ? 1 : box.style.disabled.opacity;
        box.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;

        box.elem.setAttribute("aria-checked", (box.checked == 1) ? "true" : "false");
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");

    };

    // Move selection to the next/previous enabled radio button in the group.
    const moveSelection = function (direction) {

        const list = getGroupList().filter(function (radio) { return radio.enabled == 1; });
        if (list.length == 0) return;

        let index = list.indexOf(box) + direction;
        if (index < 0) index = list.length - 1;
        if (index >= list.length) index = 0;

        list[index].select();
        list[index].elem.focus();

    };

    // *** PUBLIC FUNCTIONS:

    // Select this radio button and unselect the others in the same group.
    box.select = function (silent = 0) {
        box.setChecked(1, silent);
    };
    // USAGE: radio.select()

    box.setChecked = function (checked, silent = 0) {

        checked = (checked == 1 || checked === true) ? 1 : 0;
        if (box.checked == checked) return;

        if (checked == 1) {
            // Unselect the others in the group.
            getGroupList().forEach(function (radio) {
                if (radio !== box && radio.checked == 1) radio._uncheck();
            });
        }

        box.checked = checked;
        updateView();

        if (checked == 1 && !silent) box.onChange(box);

    };
    // USAGE: get: radio.checked, set: radio.setChecked(1)
    // NOTE: setChecked(1, 1) changes the value without calling onChange.
    // NOTE: setChecked(0) leaves the group with no selection.

    // Used by the group. (No event)
    box._uncheck = function () {
        box.checked = 0;
        updateView();
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        updateView();
    };
    // USAGE: get: radio.enabled, set: radio.setEnabled(0)

    box.setLabelText = function (text) {
        box.labelText = text;
        box.label.text = text;
        box.label.visible = (text) ? 1 : 0;
    };
    // USAGE: get: radio.labelText, set: radio.setLabelText("Option A")

    box.refresh = function () {
        updateView();
    };

    box.destroy = function () {

        // Remove from the group.
        const list = getGroupList();
        const index = list.indexOf(box);
        if (index > -1) list.splice(index, 1);

        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;

    };

    // *** OBJECT VIEW:
    box.clickable = 1;
    box.elem.setAttribute("role", "radio");
    box.elem.style.outline = "none";
    box.elem.style.userSelect = "none";
    box.setMotion("background-color 0.15s");

    // GROUP: mark, label
    box.contentBox = HGroup({
        width: "auto",
        height: "auto",
        position: "relative",
        ...box.style.layout,
    });

    // LABEL: label
    const createLabel = function () {
        box.label = Label(box.style.label);
        box.label.text = box.labelText;
        box.label.elem.style.whiteSpace = "nowrap";
        if (!box.labelText) box.label.visible = 0;
    };

    if (box.labelPosition === "left") createLabel();

    // BOX: mark (circle)
    box.mark = startBox({
        width: box.style.mark.width,
        height: box.style.mark.height,
        color: box.style.mark.color,
        border: box.style.mark.border,
        borderColor: box.style.mark.borderColor,
        round: box.style.mark.round,
    });
    box.mark.setMotion("background-color 0.15s, border-color 0.15s");
    box.mark.elem.style.boxSizing = "border-box";

    // BOX: dot (inner circle)
    const _innerW = box.style.mark.width - (box.style.mark.border * 2);
    const _innerH = box.style.mark.height - (box.style.mark.border * 2);
    // NOTE: Round the space first, then calculate the dot size from it.
    // So the space is the same on both sides and the dot stays in the exact center.
    const _spaceX = Math.round((_innerW - (_innerW * box.style.dot.size)) / 2);
    const _spaceY = Math.round((_innerH - (_innerH * box.style.dot.size)) / 2);
    const _dotW = _innerW - (_spaceX * 2);
    const _dotH = _innerH - (_spaceY * 2);

    box.dot = Box({
        left: _spaceX,
        top: _spaceY,
        width: _dotW,
        height: _dotH,
        color: box.style.dot.color,
        round: box.style.dot.round,
    });
    box.dot.elem.style.transition = "transform 0.15s, opacity 0.15s";

    endBox();

    if (box.labelPosition !== "left") createLabel();

    endGroup();

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.enabled == 1) box.select();
    });

    box.on("keydown", function (self, event) {
        if (box.enabled != 1) return;
        switch (event.key) {
            case " ":
            case "Enter":
                event.preventDefault();
                box.select();
                break;
            case "ArrowDown":
            case "ArrowRight":
                event.preventDefault();
                moveSelection(1);
                break;
            case "ArrowUp":
            case "ArrowLeft":
                event.preventDefault();
                moveSelection(-1);
                break;
        }
    });

    box.on("mouseover", function () {
        isMouseOver = 1;
        updateView();
    });

    box.on("mouseout", function () {
        isMouseOver = 0;
        updateView();
    });

    // Add to the group.
    getGroupList().push(box);

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    const _startChecked = (box.checked == 1 || box.checked === true) ? 1 : 0;
    box.checked = 0;
    updateView();
    if (_startChecked) box.setChecked(1, 1); // The last checked one in the group wins.

    return endObject(box);

};

// *** STATIC FUNCTIONS (GROUP):

// Shared group list: { groupName: [radioButton, ...] }
RadioButton.groups = {};

// Returns the radio button list of a group.
RadioButton.getGroup = function (group = "default") {
    if (!RadioButton.groups[group]) RadioButton.groups[group] = [];
    return RadioButton.groups[group];
};

// Returns the selected radio button of a group. (or null)
RadioButton.getSelected = function (group = "default") {
    return RadioButton.getGroup(group).find(function (radio) { return radio.checked == 1; }) || null;
};

// Returns the value of the selected radio button. (or "")
RadioButton.getValue = function (group = "default") {
    const selected = RadioButton.getSelected(group);
    return (selected) ? selected.value : "";
};
// USAGE: RadioButton.getValue("size")

// Selects the radio button that has this value.
RadioButton.setValue = function (group = "default", value, silent = 0) {
    const radio = RadioButton.getGroup(group).find(function (r) { return r.value === value; });
    if (radio) radio.setChecked(1, silent);
};
// USAGE: RadioButton.setValue("size", "M")

// Unselects all radio buttons of a group.
RadioButton.clear = function (group = "default") {
    RadioButton.getGroup(group).forEach(function (radio) { radio._uncheck(); });
};

// *** STYLE PACKAGES:
// USAGE: RadioButton({ styleName: "modern" })
// USAGE: RadioButton({ styleName: "modern", style: { dot: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: RadioButton.styles.myStyle = { dot: { color: "red" } };
RadioButton.styles = {

    // White circle with a border. When checked, dark border and dark dot. No background.
    classic: RadioButtonDefaults.style,

    // Light circle, thin border. When checked, the circle stays without border behind the dot, on a light background.
    modern: {
        box: { // Whole object background
            color: "transparent",
            round: 8,
        },
        hoverBox: { // Mouse over (whole object background)
            color: "whitesmoke", // null: uses box.color
        },
        checkedBox: { // Checked (whole object background)
            color: "#EFF5F6", // 10% of dot color on white. null: uses box.color
        },
        hoverCheckedBox: { // Checked and mouse over (whole object background)
            color: "#DFECEC", // 20% of dot color on white. null: uses checkedBox.color
        },
        layout: {
            gap: 12,
            padding: [12, 10],
            align: "left center",
        },
        mark: { // Unchecked circle
            width: 22,
            height: 22,
            color: "whitesmoke",
            border: 1,
            borderColor: Black(0.7),
            round: 100,
        },
        checkedMark: { // Checked circle (stays without border, behind the dot)
            color: "#DFECEC", // Same as hoverCheckedBox.color, so the circle is not visible on mouse over.
            borderColor: "transparent",
        },
        hoverMark: { // Mouse over (only border)
            borderColor: Black(0.7),
        },
        dot: {
            color: "cadetblue", // #5F9EA0
            size: 0.5, // Ratio of the inner circle size (0 - 1)
            round: 100,
        },
        label: {
            fontSize: 16,
            textColor: Black(0.85),
        },
        disabled: {
            opacity: 0.4,
        },
    },

};
