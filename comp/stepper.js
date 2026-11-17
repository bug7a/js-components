/* Bismillah */

/*

Stepper - v26.09

UI COMPONENT TEMPLATE
- A number stepper: [ − ] value [ + ].
- minValue, maxValue, step and precision (decimals). Ex: 0.5 kg steps, 0.25 hours.
- Unit text after the value ("kg", "%", "pcs") and a valueFormat() for your own text ("1,250").
- Editable: click the value and type a number. Enter or blur applies it, Escape cancels. (editable: 1)
- Press and hold a button: the value keeps changing, faster after a while.
- Keyboard: ArrowUp / ArrowDown one step, PageUp / PageDown ten steps, Home / End min / max.
- wrap: 1 -> After max comes min (Ex: hours 0-23). Otherwise the buttons are disabled at the limits.
- Layout: "horizontal" (buttons at the sides, default) or "compact" (both buttons at the right, stacked).
- Everything is drawn with code (no image files needed). Accessibility: role="spinbutton", aria-valuenow...
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- A line around the buttons: style.button.border and borderColor (0 and "transparent" by default: no line).
- style.button.opacity (1) / disabledOpacity: a button that can / can not be clicked (at min / max). fadeDuration:
  the time of the fade between them (s). 0: at once (the default).
- Style packages: "light" (default; the old name "classic" works too), "modern", "dark", "ozden", "ozdenDark". Select with styleName. (Stepper.styles)
-- "ozden": for a 600 px design. "ozdenDark": ozden on a dark page.
   It is a package of params (basic.js v26.10.27): it also gives the size, 150 x 50.

USAGE:
const qty = Stepper({ value: 1, minValue: 1, maxValue: 10, onChange: (self) => println(self.value) });
qty.setValue(5);                // onChange is called
qty.setValue(5, 1);             // silent
Stepper({ value: 2.5, minValue: 0, maxValue: 20, step: 0.5, precision: 1, unitText: " kg" });
Stepper({ value: 50, minValue: 0, maxValue: 100, step: 5, unitText: "%", editable: 0 });
Stepper({ value: 9, minValue: 0, maxValue: 23, wrap: 1, valueFormat: (value) => String(value).padStart(2, "0") + ":00" });
Stepper({ layout: "compact", width: 140 });
Stepper({ style: { button: { border: 1, borderColor: Black(0.3) } } }); // A line around the buttons
Stepper({ styleName: "ozden", value: 1, minValue: 1, maxValue: 10 });

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const StepperDefaults = {
    key: "0",
    width: 150,
    height: 44,
    value: 1,
    minValue: 0,
    maxValue: 10,
    step: 1,
    precision: 0, // Decimals shown and used for rounding. (step: 0.5 -> precision: 1)
    unitText: "", // After the value. Ex: " kg" (with the space)
    editable: 1, // 1: The value can be typed.
    wrap: 0, // 1: After max comes min, before min comes max.
    holdToRepeat: 1, // 1: Press and hold a button to change the value continuously.
    layout: "horizontal", // "horizontal": [-] value [+], "compact": value [-+] stacked at the right (Only at create time)
    enabled: 1,
    ariaLabel: "Value",
    valueFormat: function (value, self) { return self.formatNumber(value) + self.unitText; }, // Text of the value
    onChange: function (self) { }, // self.value
    onMinReached: function (self) { }, // Called when the value arrives at min
    onMaxReached: function (self) { }, // Called when the value arrives at max
    styleName: "light", // "light" ("classic": its old name), "modern", "dark", "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to Stepper.styles
    style: { // Light style package (default)
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 8,
            padding: 3, // Space between the border and the buttons
        },
        boxFocus: {
            borderColor: "#141414",
        },
        button: {
            width: 36, // horizontal layout (compact: the width of the stacked column)
            color: Black(0.05),
            hoverColor: Black(0.1),
            activeColor: Black(0.16),
            border: 0, // px: a line around the buttons. 0: no line
            borderColor: "transparent",
            round: 6,
            iconColor: "#141414",
            iconSize: 14,
            opacity: 1, // A button that can be clicked
            disabledOpacity: 0.3, // At min / max (wrap: 0) and when the stepper is disabled
            fadeDuration: 0, // s: the buttons fade between opacity and disabledOpacity in this time. 0: at once
        },
        value: {
            fontSize: 17,
            textColor: "#141414",
            fontFamily: "", // "": Default. Ex: "opensans-bold"
        },
        input: { // While editing
            color: Black(0.04),
            textColor: "#141414",
            round: 4,
        },
        disabled: {
            opacity: 0.5,
        },
    }
};

const Stepper = function (params = {}) {

    // Merge style package: params.style > Stepper.styles[styleName] > StepperDefaults.style (light)
    basic.applyStylePackage(params, Stepper.styles, StepperDefaults);

    // Merge params:
    mergeIntoIfMissing(params, StepperDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;
    const startValue = params.value;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const isCompact = (box.layout === "compact");
    let isEditing = 0;
    let cancelHold = null; // (box.after: stopped by remove())
    let holdCount = 0;
    let isFocused = 0;
    const PAGE_STEPS = 10; // PageUp / PageDown
    // Hold to repeat: the first repeat waits (a normal click does not repeat), then it gets faster.
    const HOLD_FIRST_DELAY = 400;
    const HOLD_SLOW_DELAY = 400;
    const HOLD_MEDIUM_DELAY = 120;
    const HOLD_FAST_DELAY = 50;
    const HOLD_SLOW_COUNT = 3; // Repeats before the medium speed
    const HOLD_MEDIUM_COUNT = 12; // Repeats before the fast speed
    const STACK_GAP = 2; // Between the stacked buttons (compact)
    const BUTTON_COLOR_MOTION = "background-color 0.15s"; // The hover / press color of the buttons

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.minValue, box.maxValue, box.step)

    // *** PRIVATE FUNCTIONS:

    const roundValue = function (value) {
        const factor = Math.pow(10, Math.max(0, box.precision));
        return Math.round(value * factor) / factor;
    };

    // Keeps the value in [min, max] (or wraps it).
    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = box.minValue;
        if (box.wrap == 1) {
            const range = box.maxValue - box.minValue + box.step;
            if (range > 0) {
                if (value > box.maxValue) value = box.minValue + ((value - box.maxValue - box.step) % range);
                if (value < box.minValue) value = box.maxValue - ((box.minValue - value - box.step) % range);
            }
        }
        return roundValue(Math.min(Math.max(value, box.minValue), box.maxValue));
    };

    const canDecrease = function () {
        return box.enabled == 1 && (box.wrap == 1 || box.value > box.minValue);
    };

    const canIncrease = function () {
        return box.enabled == 1 && (box.wrap == 1 || box.value < box.maxValue);
    };

    const paintButton = function (button, isEnabled) {
        button.css.opacity = String((isEnabled) ? _s.button.opacity : _s.button.disabledOpacity);
        button.cursor = (isEnabled) ? "pointer" : "default";
        button.aria = { disabled: (isEnabled) ? "false" : "true" };
        if (!isEnabled) button.color = _s.button.color;
    };

    const updateView = function () {
        const valueText = box.valueFormat(box.value, box);
        box.lblValue.plainText = valueText;
        paintButton(box.btnMinus, canDecrease());
        paintButton(box.btnPlus, canIncrease());
        box.aria = {
            valuenow: String(box.value),
            valuemin: String(box.minValue),
            valuemax: String(box.maxValue),
            valuetext: valueText,
        };
    };

    const updateBorder = function () {
        box.borderColor = (isFocused || isEditing) ? _s.boxFocus.borderColor : _s.box.borderColor;
    };

    // Changes the value by "steps" steps. Returns 1 when the value changed.
    const stepValue = function (steps, silent = 0) {
        if (box.enabled != 1) return 0;
        const next = clampValue(box.value + steps * box.step);
        if (next === box.value) return 0;
        box.setValue(next, silent);
        return 1;
    };

    // *** HOLD TO REPEAT:

    const getHoldDelay = function () {
        if (holdCount < HOLD_SLOW_COUNT) return HOLD_SLOW_DELAY;
        if (holdCount < HOLD_MEDIUM_COUNT) return HOLD_MEDIUM_DELAY;
        return HOLD_FAST_DELAY;
    };

    const startHold = function (direction) {
        stopHold();
        if (box.holdToRepeat != 1) return;
        holdCount = 0;
        const tick = function () {
            holdCount++;
            const delay = getHoldDelay();
            if (!stepValue(direction)) {
                stopHold();
                return;
            }
            cancelHold = box.after(delay, tick);
        };
        cancelHold = box.after(HOLD_FIRST_DELAY, tick);
    };

    const stopHold = function () {
        if (cancelHold) cancelHold();
        cancelHold = null;
    };

    // *** EDIT (type the value):

    const startEdit = function () {
        if (box.editable != 1 || box.enabled != 1 || isEditing) return;
        isEditing = 1;
        box.input.text = box.formatNumber(box.value);
        box.lblValue.visible = 0;
        box.input.visible = 1;
        box.input.inputElement.focus({ preventScroll: true });
        box.input.inputElement.select();
        updateBorder();
    };

    // apply: 1 -> The typed value is used. 0 -> Cancel.
    const endEdit = function (apply) {
        // WHY: Chrome fires blur when a focused field is removed: a half typed value went to onChange of a field that
        //      was removed (a panel built again while the user typed)
        if (!isEditing || box.isRemoved) return;
        isEditing = 0;
        box.input.visible = 0;
        box.lblValue.visible = 1;
        if (apply) {
            const text = String(box.input.text).trim().replace(",", ".");
            const value = parseFloat(text);
            if (!isNaN(value)) box.setValue(value);
        }
        updateBorder();
        updateView();
    };

    // While editing: Enter applies, Escape cancels, the arrows apply and step.
    const onEditKeyDown = function (event) {
        const key = event.key;
        if (key === "Enter" || key === "Escape") {
            event.preventDefault();
            endEdit((key === "Enter") ? 1 : 0);
            box.focus();
            return;
        }
        if (key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault();
            endEdit(1);
            stepValue((key === "ArrowUp") ? 1 : -1);
            startEdit();
        }
    };

    const isNumberKey = function (key) {
        return key.length === 1 && /[\d\-.,]/.test(key);
    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;
        const key = event.key;

        if (isEditing) {
            onEditKeyDown(event);
            return;
        }

        switch (key) {
            case "ArrowUp":
            case "ArrowRight":
                event.preventDefault();
                stepValue(1);
                break;
            case "ArrowDown":
            case "ArrowLeft":
                event.preventDefault();
                stepValue(-1);
                break;
            case "PageUp":
                event.preventDefault();
                stepValue(PAGE_STEPS);
                break;
            case "PageDown":
                event.preventDefault();
                stepValue(-PAGE_STEPS);
                break;
            case "Home":
                event.preventDefault();
                box.setValue(box.minValue);
                break;
            case "End":
                event.preventDefault();
                box.setValue(box.maxValue);
                break;
            case "Enter":
            case " ":
                if (box.editable != 1) break;
                event.preventDefault();
                startEdit();
                break;
            default:
                // Typing a digit starts the edit with that digit.
                if (box.editable != 1 || !isNumberKey(key)) break;
                event.preventDefault();
                startEdit();
                box.input.text = key;
        }

    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called.
    box.setValue = function (value, silent = 0) {
        const next = clampValue(value);
        const changed = (next !== box.value);
        box.value = next;
        updateView();
        if (changed && !silent) {
            box.onChange(box);
            if (box.value === box.minValue) box.onMinReached(box);
            if (box.value === box.maxValue) box.onMaxReached(box);
        }
        return box.value;
    };
    // USAGE: get: stepper.value, set: stepper.setValue(5) // Out of range values are clamped.

    box.getValue = function () {
        return box.value;
    };

    box.increase = function (steps = 1) {
        return stepValue(steps);
    };
    // USAGE: stepper.increase() or stepper.increase(5)

    box.decrease = function (steps = 1) {
        return stepValue(-steps);
    };

    box.setMinValue = function (value) {
        box.minValue = Number(value) || 0;
        if (box.maxValue < box.minValue) box.maxValue = box.minValue;
        box.setValue(box.value, 1);
    };

    box.setMaxValue = function (value) {
        box.maxValue = Number(value) || 0;
        if (box.minValue > box.maxValue) box.minValue = box.maxValue;
        box.setValue(box.value, 1);
    };

    box.setRange = function (minValue, maxValue) {
        box.minValue = Number(minValue) || 0;
        box.maxValue = Math.max(box.minValue, Number(maxValue) || 0);
        box.setValue(box.value, 1);
    };
    // USAGE: stepper.setRange(0, 100)

    box.setStep = function (step) {
        box.step = Math.abs(Number(step)) || 1;
        updateView();
    };

    box.setPrecision = function (precision) {
        box.precision = Math.max(0, Number(precision) || 0);
        box.setValue(box.value, 1);
    };

    box.setUnitText = function (text) {
        box.unitText = text || "";
        updateView();
    };
    // USAGE: stepper.setUnitText(" kg")

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        const isEnabled = (box.enabled == 1);
        if (!isEnabled) {
            endEdit(0);
            stopHold();
        }
        box.css.opacity = (isEnabled) ? "1" : String(_s.disabled.opacity);
        box.tabIndex = (isEnabled) ? 0 : -1;
        box.aria = { disabled: (isEnabled) ? "false" : "true" };
        updateView();
    };
    // USAGE: get: stepper.enabled, set: stepper.setEnabled(0)

    // Number text with the precision: 2.5 -> "2.5", 3 -> "3" (precision 0), 3 -> "3.0" (precision 1)
    box.formatNumber = function (value) {
        return Number(value).toFixed(Math.max(0, box.precision));
    };

    box.focus = function () {
        box.elem.focus({ preventScroll: true });
    };

    box.refresh = function () {
        updateView();
    };


    // *** OBJECT VIEW:

    box.role = "spinbutton";
    box.aria = { label: box.ariaLabel };
    box.css = {
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
    };
    box.clickable = 1;

    const getButtonSvg = function (icon) {
        if (icon === "plus") return Stepper.getPlusSvg(_s.button.iconColor, _s.button.iconSize);
        return Stepper.getMinusSvg(_s.button.iconColor, _s.button.iconSize);
    };

    // LABEL: Button (- or +), drawn with SVG
    const createStepButton = function (icon, ariaLabel, isStacked) {
        const btn = Label({
            text: getButtonSvg(icon),
            width: (isStacked) ? "100%" : _s.button.width,
            height: (isStacked) ? "auto" : "100%",
            color: _s.button.color,
            border: _s.button.border,
            borderColor: _s.button.borderColor,
            round: _s.button.round,
            clickable: 1,
        });
        btn.elem.style.display = "flex";
        btn.css = { alignItems: "center", justifyContent: "center" };
        btn.lineHeight = "0";
        btn.shrink = 0;
        btn.cursor = "pointer";
        btn.css = { userSelect: "none", transition: BUTTON_COLOR_MOTION };
        // WHY: setMotion() starts after the first paint: a button that starts at min / max does not fade at the first view.
        if (_s.button.fadeDuration > 0) btn.setMotion(BUTTON_COLOR_MOTION + ", opacity " + _s.button.fadeDuration + "s");
        if (isStacked) btn.css.flex = "1 1 0"; // WHY: After shrink (flex sets it again): the stacked buttons share the height.
        btn.role = "button";
        btn.aria = { label: ariaLabel };
        return btn;
    };

    // GROUP: Row (buttons and value)
    box.row = HGroup({
        width: "100%",
        height: "100%",
        align: "left center",
        gap: _s.box.padding,
        padding: _s.box.padding,
        position: "relative",
    });
    box.row.css.boxSizing = "border-box";

        if (!isCompact) box.btnMinus = createStepButton("minus", "Decrease", 0);

        // BOX: Value area (label, and the input while editing)
        box.valueBox = startBox({ width: "auto", height: "100%", color: "transparent" });
        box.valueBox.css = { flex: "1 1 0", minWidth: "0" };
        box.valueBox.cursor = (box.editable == 1) ? "text" : "default";
        box.valueBox.clickable = 1;

            // LABEL: Value text
            box.lblValue = Label({
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                fontSize: _s.value.fontSize,
                textColor: _s.value.textColor,
                textAlign: "center",
            });
            box.lblValue.elem.style.display = "flex";
            box.lblValue.css = { alignItems: "center", justifyContent: "center" };
            box.lblValue.ellipsis = 1;
            box.lblValue.css.userSelect = "none";
            if (_s.value.fontFamily) box.lblValue.css.fontFamily = _s.value.fontFamily;

            // INPUT: Typing the value (hidden until the edit starts)
            box.input = Input({
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                minimal: 1,
                color: _s.input.color,
                fontSize: _s.value.fontSize,
                textColor: _s.input.textColor,
                textAlign: "center",
                round: _s.input.round,
            });
            box.input.inputElement.style.padding = "0px 4px";
            box.input.inputElement.style.width = "100%";
            box.input.inputElement.style.height = "100%";
            box.input.inputElement.style.boxSizing = "border-box";
            box.input.inputElement.style.borderRadius = _s.input.round + "px";
            box.input.inputElement.style.backgroundColor = _s.input.color;
            box.input.inputElement.setAttribute("inputmode", "decimal");
            box.input.inputElement.setAttribute("aria-label", box.ariaLabel);
            if (_s.value.fontFamily) box.input.inputElement.style.fontFamily = _s.value.fontFamily;
            box.input.visible = 0;

        endBox();

        if (isCompact) {
            // GROUP: Stacked buttons (+ over -)
            box.stack = VGroup({ width: _s.button.width, height: "100%", align: "center top", gap: STACK_GAP });
            box.stack.shrink = 0;
            box.stack.css.alignItems = "stretch";
                box.btnPlus = createStepButton("plus", "Increase", 1);
                box.btnMinus = createStepButton("minus", "Decrease", 1);
            endGroup();
        } else {
            box.btnPlus = createStepButton("plus", "Increase", 0);
        }

    endGroup();

    // *** OBJECT INIT CODE:

    const bindButton = function (btn, direction) {
        const isEnabled = function () { return (direction > 0) ? canIncrease() : canDecrease(); };
        btn.on("mouseenter", function () { if (isEnabled()) btn.color = _s.button.hoverColor; });
        btn.on("mouseleave", function () {
            btn.color = _s.button.color;
            stopHold();
        });
        btn.on("mousedown", function (self, event) {
            if (event.button !== 0 || !isEnabled()) return;
            event.preventDefault(); // WHY: Keeps the focus on the stepper, no text selection.
            btn.color = _s.button.activeColor;
            endEdit(1);
            stepValue(direction);
            startHold(direction);
        });
        btn.on("mouseup", function () {
            btn.color = (isEnabled()) ? _s.button.hoverColor : _s.button.color;
            stopHold();
        });
        btn.on("touchstart", function (self, event) {
            if (!isEnabled()) return;
            event.preventDefault();
            endEdit(1);
            stepValue(direction);
            startHold(direction);
        });
        btn.on("touchend", stopHold);
        btn.on("touchcancel", stopHold);
        btn.on("click", function (self, event) {
            event.stopPropagation();
            box.focus();
        });
    };

    bindButton(box.btnMinus, -1);
    bindButton(box.btnPlus, 1);
    box.listenTo(document, "mouseup", stopHold); // (removed with the box)
    box.listenTo(document, "touchend", stopHold);

    box.valueBox.on("click", function () { startEdit(); });
    box.input.inputElement.addEventListener("blur", function () { endEdit(1); });
    box.input.inputElement.addEventListener("keydown", function (event) { onKeyDown(box, event); });

    box.on("keydown", function (self, event) {
        if (event.target === box.input.inputElement) return; // WHY: The input has its own keydown (above).
        onKeyDown(self, event);
    });
    box.on("focus", function () {
        isFocused = 1;
        updateBorder();
    });
    box.on("blur", function () {
        isFocused = 0;
        updateBorder();
    });
    // WHY: A click on the buttons must not open the edit. It is handled in bindButton with stopPropagation.

    box.minValue = Number(box.minValue) || 0;
    box.maxValue = Number(box.maxValue);
    if (isNaN(box.maxValue)) box.maxValue = box.minValue;
    if (box.maxValue < box.minValue) box.maxValue = box.minValue;
    box.step = Math.abs(Number(box.step)) || 1;
    box.precision = Math.max(0, Number(box.precision) || 0);
    box.value = clampValue(startValue);
    box.setEnabled(box.enabled);
    updateView();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Stepper.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

Stepper.getPlusSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
};

Stepper.getMinusSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: Stepper({ styleName: "modern" })
// USAGE: Stepper({ styleName: "dark", style: { button: { iconColor: "tomato" } } }) // Change only some keys.
// USAGE: Stepper({ style: Stepper.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: Stepper.styles.myStyle = { button: { color: "gold" } };
// NOTE: A package with its own "style" key is a package of params (basic.js v26.10.27): its other keys fill the
//       params you did not give (ozden: the size). Select it with styleName (style: Stepper.styles.ozden.style
//       gives only its look).
// USAGE: Stepper({ styleName: "ozden", width: 180 }) // A param you give wins over the package.
Stepper.styles = {

    // Gray buttons in a white box.
    light: StepperDefaults.style,

    // Round pill, cadetblue buttons. Same colors as the modern CheckBox, RadioButton, ProgressBar and Tabs.
    modern: {
        box: { color: White(1), border: 1, borderColor: "#D9DADB", round: 100, padding: 4 },
        boxFocus: { borderColor: "cadetblue" },
        button: { width: 36, color: "#DFECEC", hoverColor: "#CFE2E2", activeColor: "cadetblue", round: 100, iconColor: "#2F5F61", iconSize: 14, disabledOpacity: 0.3 },
        value: { fontSize: 17, textColor: "#2F5F61", fontFamily: "opensans-bold" },
        input: { color: "#EEF5F5", textColor: "#2F5F61", round: 100 },
        disabled: { opacity: 0.5 },
    },

    // Dark theme, same colors as SelectBox, TagInput and Tabs "dark".
    dark: {
        box: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: 3 },
        boxFocus: { borderColor: "#65A293" },
        button: { width: 36, color: "rgba(255, 255, 255, 0.08)", hoverColor: "rgba(255, 255, 255, 0.14)", activeColor: "#3D7A6B", round: 6, iconColor: "rgba(255, 255, 255, 0.85)", iconSize: 14, disabledOpacity: 0.3 },
        value: { fontSize: 17, textColor: "rgba(255, 255, 255, 0.90)", fontFamily: "" },
        input: { color: "rgba(255, 255, 255, 0.06)", textColor: "rgba(255, 255, 255, 0.90)", round: 4 },
        disabled: { opacity: 0.4 },
    },

    // For a 600 px design:
    // round white buttons with a dark line on a transparent box, the value between them; at min / max a button
    // fades to 0.4. (Its name is not "light": that is the default look, and LabelEditor asks for it by name.)
    ozden: {
        width: 150,
        height: 50, // WHY: 42 px buttons (50 - 2 x padding)
        style: {
            box: { color: "transparent", border: 0, round: 100, padding: 4 },
            button: {
                width: 42,
                color: "white",
                hoverColor: "#F4F4F4",
                activeColor: "#E8E8E8",
                border: 1,
                borderColor: "rgba(0, 0, 0, 0.8)",
                round: 21,
                iconColor: "rgba(0, 0, 0, 0.65)",
                iconSize: 24, // WHY: a + 16 px long, with a 2.7 px line
                opacity: 0.9, // the line and the icon are a little lighter
                disabledOpacity: 0.4,
                fadeDuration: 0.2,
            },
            value: { fontSize: 22, textColor: "rgba(0, 0, 0, 0.8)", fontFamily: "" },
            input: { textColor: "rgba(0, 0, 0, 0.8)" },
        },
    },

    // ozden on a dark page: the same shape; the buttons in the ground of a dark card with a light line (on such a
    // card they are rings, as the white buttons of ozden on white), a light value.
    ozdenDark: {
        width: 150,
        height: 50, // WHY: 42 px buttons (50 - 2 x padding)
        style: {
            box: { color: "transparent", border: 0, round: 100, padding: 4 },
            button: {
                width: 42,
                color: "#232322",
                hoverColor: "#2E2E2D",
                activeColor: "#393938",
                border: 1,
                borderColor: "rgba(255, 255, 255, 0.8)",
                round: 21,
                iconColor: "rgba(255, 255, 255, 0.7)",
                iconSize: 24, // WHY: a + 16 px long, with a 2.7 px line
                opacity: 0.9, // the line and the icon are a little softer
                disabledOpacity: 0.4,
                fadeDuration: 0.2,
            },
            value: { fontSize: 22, textColor: "rgba(255, 255, 255, 0.88)", fontFamily: "" },
            input: { color: "rgba(255, 255, 255, 0.06)", textColor: "rgba(255, 255, 255, 0.88)" },
        },
    },

};
Stepper.styles.classic = Stepper.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): 96 x 28, a line around it (ink while it is focused), no fill; the
// buttons have no fill either (a faint one under the mouse: a Stepper has no line of its own per button), a 12 px
// icon, a 13 px value. minimalDark: the same on a dark window.
Stepper.createMinimalStyle = function (colors) {
    return {
        width: 96,
        height: 28,
        style: {
            box: { color: "transparent", border: 1, borderColor: colors.line, round: 4, padding: 0 },
            boxFocus: { borderColor: colors.ink },
            button: { width: 26, color: "transparent", hoverColor: colors.hover, activeColor: colors.active, border: 0, borderColor: "transparent", round: 3, iconColor: colors.text, iconSize: 12, opacity: 1, disabledOpacity: 0.3, fadeDuration: 0 },
            value: { fontSize: 13, textColor: colors.text, fontFamily: "" },
            input: { color: "transparent", textColor: colors.text, round: 0 },
            disabled: { opacity: 0.4 },
        },
    };
};
// WHY a strong line: it shows the field of the stepper (3:1 at least, as WCAG asks of a control)
Stepper.MINIMAL_COLORS = { ink: "#1F1F1F", text: Black(0.85), line: Black(0.45), hover: Black(0.04), active: Black(0.08) };
Stepper.styles.minimal = Stepper.createMinimalStyle(Stepper.MINIMAL_COLORS);
Stepper.MINIMAL_DARK_COLORS = { ink: "#EDEDEB", text: White(0.88), line: White(0.42), hover: White(0.06), active: White(0.1) };
Stepper.styles.minimalDark = Stepper.createMinimalStyle(Stepper.MINIMAL_DARK_COLORS);
