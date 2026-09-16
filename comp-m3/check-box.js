/* Bismillah */

/*

Check Box - v26.09

UI COMPONENT TEMPLATE
- A customizable check box with a label.
- Checkmark is drawn with code (no image files needed).
- Supports: checked, enabled, label position (left/right), keyboard (Space/Enter).

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
    style: {
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

    // Merge params:
    mergeIntoIfMissing(params, CheckBoxDefaults);

    // Edit params, if needed:
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let isMouseOver = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.checked, box.enabled, box.labelText)

    // *** PRIVATE FUNCTIONS:

    // Update the view according to the current state.
    const updateView = function () {

        const _mark = box.style.mark;
        const _checked = box.style.checkedMark;

        if (box.checked == 1) {
            box.mark.color = _checked.color;
            box.mark.borderColor = _checked.borderColor;
            box.tick.elem.style.opacity = "1";
            box.tick.elem.style.transform = "rotate(45deg) scale(1)";
        } else {
            box.mark.color = _mark.color;
            box.mark.borderColor = (isMouseOver) ? box.style.hoverMark.borderColor : _mark.borderColor;
            box.tick.elem.style.opacity = "0";
            box.tick.elem.style.transform = "rotate(45deg) scale(0.4)";
        }

        box.opacity = (box.enabled == 1) ? 1 : box.style.disabled.opacity;
        box.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;

        box.elem.setAttribute("aria-checked", (box.checked == 1) ? "true" : "false");
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");

    };

    // *** PUBLIC FUNCTIONS:

    box.setChecked = function (checked, silent = 0) {

        checked = (checked == 1 || checked === true) ? 1 : 0;
        if (box.checked == checked) return;

        box.checked = checked;
        updateView();

        if (!silent) box.onChange(box);

    };
    // USAGE: get: checkBox.checked, set: checkBox.setChecked(1)
    // NOTE: setChecked(1, 1) changes the value without calling onChange.

    box.toggle = function () {
        if (box.enabled != 1) return;
        box.setChecked((box.checked == 1) ? 0 : 1);
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        updateView();
    };
    // USAGE: get: checkBox.enabled, set: checkBox.setEnabled(0)

    box.setLabelText = function (text) {
        box.labelText = text;
        box.label.text = text;
        box.label.visible = (text) ? 1 : 0;
    };
    // USAGE: get: checkBox.labelText, set: checkBox.setLabelText("Remember me")

    box.refresh = function () {
        updateView();
    };

    box.destroy = function () {
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;
    };

    // *** OBJECT VIEW:
    box.clickable = 1;
    box.elem.setAttribute("role", "checkbox");
    box.elem.style.outline = "none";
    box.elem.style.userSelect = "none";

    // GROUP: mark, label
    box.contentBox = HGroup({
        width: "auto",
        height: "auto",
        position: "relative",
        ...box.style.layout,
    });

    // LABEL: label (left)
    const createLabel = function () {
        box.label = Label(box.style.label);
        box.label.text = box.labelText;
        box.label.elem.style.whiteSpace = "nowrap";
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
    box.mark.setMotion("background-color 0.15s, border-color 0.15s");
    box.mark.elem.style.boxSizing = "border-box";

    // BOX: tick (drawn with right and bottom borders, rotated 45deg)
    const _innerW = box.style.mark.width - (box.style.mark.border * 2);
    const _innerH = box.style.mark.height - (box.style.mark.border * 2);
    const _tickW = Math.round(_innerW * 0.3);
    const _tickH = Math.round(_innerH * 0.58);

    box.tick = Box({
        left: Math.round((_innerW - _tickW) / 2),
        top: Math.round((_innerH - _tickH) / 2) - Math.round(_innerH * 0.06),
        width: _tickW,
        height: _tickH,
        color: "transparent",
    });
    box.tick.elem.style.boxSizing = "border-box";
    box.tick.elem.style.borderRight = box.style.tick.thickness + "px solid " + box.style.tick.color;
    box.tick.elem.style.borderBottom = box.style.tick.thickness + "px solid " + box.style.tick.color;
    box.tick.elem.style.transition = "transform 0.15s, opacity 0.15s";

    endBox();

    // LABEL: label (right)
    if (box.labelPosition !== "left") createLabel();

    endGroup();

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        box.toggle();
    });

    box.on("keydown", function (self, event) {
        if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            box.toggle();
        }
    });

    box.on("mouseover", function () {
        isMouseOver = 1;
        if (box.enabled == 1) updateView();
    });

    box.on("mouseout", function () {
        isMouseOver = 0;
        updateView();
    });

    box.checked = (box.checked == 1 || box.checked === true) ? 1 : 0;
    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    updateView();

    return endObject(box);

};
