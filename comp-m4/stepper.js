/* Bismillah */

/*

Stepper - v26.09

UI COMPONENT TEMPLATE
- A number stepper: [ − ] value [ + ]. The new version of comp-m1/ui-stepper.js.
- min, max, step and precision (decimals). Ex: 0.5 kg steps, 0.25 hours.
- Unit text after the value ("kg", "%", "pcs") and a valueFormat() for your own text ("1,250").
- Editable: click the value and type a number. Enter or blur applies it, Escape cancels. (editable: 1)
- Press and hold a button: the value keeps changing, faster after a while.
- Keyboard: ArrowUp / ArrowDown one step, PageUp / PageDown ten steps, Home / End min / max.
- wrap: 1 -> After max comes min (Ex: hours 0-23). Otherwise the buttons are disabled at the limits.
- Layout: "horizontal" (buttons at the sides, default) or "compact" (both buttons at the right, stacked).
- Everything is drawn with code (no image files needed). Accessibility: role="spinbutton", aria-valuenow...
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (Stepper.styles)

USAGE:
const qty = Stepper({ value: 1, min: 1, max: 10, onChange: (self) => println(self.value) });
qty.setValue(5);                // onChange is called
qty.setValue(5, 1);             // silent
Stepper({ value: 2.5, min: 0, max: 20, step: 0.5, precision: 1, unitText: " kg" });
Stepper({ value: 50, min: 0, max: 100, step: 5, unitText: "%", editable: 0 });
Stepper({ value: 9, min: 0, max: 23, wrap: 1, valueFormat: (value) => String(value).padStart(2, "0") + ":00" });
Stepper({ layout: "compact", width: 140 });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const StepperDefaults = {
    key: "0",
    width: 150,
    height: 44,
    value: 1,
    min: 0,
    max: 10,
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
    styleName: "classic", // "classic", "modern", "dark" or a name added to Stepper.styles
    style: { // Classic style package (default)
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
            round: 6,
            iconColor: "#141414",
            iconSize: 14,
            disabledOpacity: 0.3,
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

    // Merge style package: params.style > Stepper.styles[styleName] > StepperDefaults.style (classic)
    const _styleName = params.styleName || StepperDefaults.styleName;
    const _stylePackage = Stepper.styles[_styleName];
    if (!_stylePackage) console.warn("Stepper: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

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
    let holdTimer = null;
    let holdCount = 0;
    let isFocused = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.min, box.max, box.step)

    // *** PRIVATE FUNCTIONS:

    const roundValue = function (value) {
        const factor = Math.pow(10, Math.max(0, box.precision));
        return Math.round(value * factor) / factor;
    };

    // Keeps the value in [min, max] (or wraps it).
    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = box.min;
        if (box.wrap == 1) {
            const range = box.max - box.min + box.step;
            if (range > 0) {
                if (value > box.max) value = box.min + ((value - box.max - box.step) % range);
                if (value < box.min) value = box.max - ((box.min - value - box.step) % range);
            }
        }
        return roundValue(Math.min(Math.max(value, box.min), box.max));
    };

    const canDecrease = function () {
        return box.enabled == 1 && (box.wrap == 1 || box.value > box.min);
    };

    const canIncrease = function () {
        return box.enabled == 1 && (box.wrap == 1 || box.value < box.max);
    };

    const paintButton = function (button, isEnabled) {
        button.elem.style.opacity = (isEnabled) ? "1" : String(_s.button.disabledOpacity);
        button.elem.style.cursor = (isEnabled) ? "pointer" : "default";
        button.elem.setAttribute("aria-disabled", (isEnabled) ? "false" : "true");
        if (!isEnabled) button.color = _s.button.color;
    };

    const updateView = function () {
        box.lblValue.text = Stepper.escapeHtml(box.valueFormat(box.value, box));
        paintButton(box.btnMinus, canDecrease());
        paintButton(box.btnPlus, canIncrease());
        box.elem.setAttribute("aria-valuenow", String(box.value));
        box.elem.setAttribute("aria-valuemin", String(box.min));
        box.elem.setAttribute("aria-valuemax", String(box.max));
        box.elem.setAttribute("aria-valuetext", box.valueFormat(box.value, box));
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

    const startHold = function (direction) {
        stopHold();
        if (box.holdToRepeat != 1) return;
        holdCount = 0;
        const tick = function () {
            holdCount++;
            // Faster after a while: 400 ms, then 120 ms, then 50 ms
            const delay = (holdCount < 3) ? 400 : (holdCount < 12) ? 120 : 50;
            if (!stepValue(direction)) { stopHold(); return; }
            holdTimer = setTimeout(tick, delay);
        };
        holdTimer = setTimeout(tick, 400); // First repeat after a short wait (a normal click does not repeat)
    };

    const stopHold = function () {
        clearTimeout(holdTimer);
        holdTimer = null;
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
        if (!isEditing) return;
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

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;
        const key = event.key;

        if (isEditing) {
            if (key === "Enter") { event.preventDefault(); endEdit(1); box.elem.focus({ preventScroll: true }); }
            else if (key === "Escape") { event.preventDefault(); endEdit(0); box.elem.focus({ preventScroll: true }); }
            else if (key === "ArrowUp") { event.preventDefault(); endEdit(1); stepValue(1); startEdit(); }
            else if (key === "ArrowDown") { event.preventDefault(); endEdit(1); stepValue(-1); startEdit(); }
            return;
        }

        switch (key) {
            case "ArrowUp": case "ArrowRight": event.preventDefault(); stepValue(1); break;
            case "ArrowDown": case "ArrowLeft": event.preventDefault(); stepValue(-1); break;
            case "PageUp": event.preventDefault(); stepValue(10); break;
            case "PageDown": event.preventDefault(); stepValue(-10); break;
            case "Home": event.preventDefault(); box.setValue(box.min); break;
            case "End": event.preventDefault(); box.setValue(box.max); break;
            case "Enter": case " ": if (box.editable == 1) { event.preventDefault(); startEdit(); } break;
            default:
                // Typing a digit starts the edit with that digit.
                if (box.editable == 1 && key.length === 1 && /[\d\-.,]/.test(key)) { event.preventDefault(); startEdit(); box.input.text = key; }
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
            if (box.value === box.min) box.onMinReached(box);
            if (box.value === box.max) box.onMaxReached(box);
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

    box.setMin = function (min) {
        box.min = Number(min) || 0;
        if (box.max < box.min) box.max = box.min;
        box.setValue(box.value, 1);
    };

    box.setMax = function (max) {
        box.max = Number(max) || 0;
        if (box.min > box.max) box.min = box.max;
        box.setValue(box.value, 1);
    };

    box.setRange = function (min, max) {
        box.min = Number(min) || 0;
        box.max = Math.max(box.min, Number(max) || 0);
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
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1) { endEdit(0); stopHold(); }
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
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

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        stopHold();
        document.removeEventListener("mouseup", stopHold);
        document.removeEventListener("touchend", stopHold);
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.setAttribute("role", "spinbutton");
    box.elem.setAttribute("aria-label", box.ariaLabel);
    box.elem.style.outline = "none";
    box.elem.style.boxSizing = "border-box";
    box.elem.style.transition = "border-color 0.15s";
    box.clickable = 1;

    // LABEL: Button (- or +), drawn with SVG
    const createButton = function (icon, ariaLabel, isStacked) {
        const btn = Label({
            text: (icon === "plus") ? Stepper.getPlusSvg(_s.button.iconColor, _s.button.iconSize) : Stepper.getMinusSvg(_s.button.iconColor, _s.button.iconSize),
            width: (isStacked) ? "100%" : _s.button.width,
            height: (isStacked) ? "auto" : "100%",
            color: _s.button.color,
            round: _s.button.round,
            clickable: 1,
        });
        btn.elem.style.display = "flex";
        btn.elem.style.alignItems = "center";
        btn.elem.style.justifyContent = "center";
        btn.elem.style.lineHeight = "0";
        btn.elem.style.flexShrink = "0";
        btn.elem.style.cursor = "pointer";
        btn.elem.style.userSelect = "none";
        btn.elem.style.transition = "background-color 0.15s";
        if (isStacked) btn.elem.style.flex = "1 1 0";
        btn.elem.setAttribute("role", "button");
        btn.elem.setAttribute("aria-label", ariaLabel);
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
    box.row.elem.style.boxSizing = "border-box";

        if (!isCompact) box.btnMinus = createButton("minus", "Decrease", 0);

        // BOX: Value area (label, and the input while editing)
        box.valueBox = startBox({ width: "auto", height: "100%", color: "transparent" });
        box.valueBox.elem.style.flex = "1 1 0";
        box.valueBox.elem.style.minWidth = "0";
        box.valueBox.elem.style.cursor = (box.editable == 1) ? "text" : "default";
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
            box.lblValue.elem.style.alignItems = "center";
            box.lblValue.elem.style.justifyContent = "center";
            box.lblValue.elem.style.whiteSpace = "nowrap";
            box.lblValue.elem.style.overflow = "hidden";
            box.lblValue.elem.style.textOverflow = "ellipsis";
            box.lblValue.elem.style.userSelect = "none";
            if (_s.value.fontFamily) box.lblValue.elem.style.fontFamily = _s.value.fontFamily;

            // INPUT: Typing the value (hidden until the edit starts)
            box.input = Input({ left: 0, top: 0, width: "100%", height: "100%", minimal: 1, color: _s.input.color, fontSize: _s.value.fontSize, textColor: _s.input.textColor, textAlign: "center", round: _s.input.round });
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
            box.stack = VGroup({ width: _s.button.width, height: "100%", align: "center top", gap: 2 });
            box.stack.elem.style.flexShrink = "0";
            box.stack.elem.style.alignItems = "stretch";
                box.btnPlus = createButton("plus", "Increase", 1);
                box.btnMinus = createButton("minus", "Decrease", 1);
            endGroup();
        } else {
            box.btnPlus = createButton("plus", "Increase", 0);
        }

    endGroup();

    // *** OBJECT INIT CODE:

    const bindButton = function (btn, direction) {
        const isEnabled = function () { return (direction > 0) ? canIncrease() : canDecrease(); };
        btn.on("mouseenter", function () { if (isEnabled()) btn.color = _s.button.hoverColor; });
        btn.on("mouseleave", function () { btn.color = _s.button.color; stopHold(); });
        btn.on("mousedown", function (self, event) {
            if (event.button !== 0 || !isEnabled()) return;
            event.preventDefault(); // WHY: Keeps the focus on the stepper, no text selection.
            btn.color = _s.button.activeColor;
            endEdit(1);
            stepValue(direction);
            startHold(direction);
        });
        btn.on("mouseup", function () { btn.color = (isEnabled()) ? _s.button.hoverColor : _s.button.color; stopHold(); });
        btn.on("touchstart", function (self, event) {
            if (!isEnabled()) return;
            event.preventDefault();
            endEdit(1);
            stepValue(direction);
            startHold(direction);
        });
        btn.on("touchend", stopHold);
        btn.on("touchcancel", stopHold);
        btn.on("click", function (self, event) { event.stopPropagation(); box.elem.focus({ preventScroll: true }); });
    };

    bindButton(box.btnMinus, -1);
    bindButton(box.btnPlus, 1);
    document.addEventListener("mouseup", stopHold);
    document.addEventListener("touchend", stopHold);

    box.valueBox.on("click", function () { startEdit(); });
    box.input.inputElement.addEventListener("blur", function () { endEdit(1); });
    box.input.inputElement.addEventListener("keydown", function (event) { onKeyDown(box, event); });

    box.on("keydown", function (self, event) { if (event.target !== box.input.inputElement) onKeyDown(self, event); });
    box.on("focus", function () { isFocused = 1; updateBorder(); });
    box.on("blur", function () { isFocused = 0; updateBorder(); });
    // WHY: A click on the buttons must not open the edit. It is handled in bindButton with stopPropagation.

    box.min = Number(box.min) || 0;
    box.max = Number(box.max);
    if (isNaN(box.max)) box.max = box.min;
    if (box.max < box.min) box.max = box.min;
    box.step = Math.abs(Number(box.step)) || 1;
    box.precision = Math.max(0, Number(box.precision) || 0);
    box.value = clampValue(startValue);
    box.setEnabled(box.enabled);
    updateView();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Stepper.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

Stepper.getPlusSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
};

Stepper.getMinusSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.6" stroke-linecap="round"><path d="M5 12h14"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: Stepper({ styleName: "modern" })
// USAGE: Stepper({ styleName: "dark", style: { button: { iconColor: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: Stepper.styles.myStyle = { button: { color: "gold" } };
Stepper.styles = {

    // Gray buttons in a white box.
    classic: StepperDefaults.style,

    // Round pill, cadetblue buttons. Same colors as the modern CheckBox, RadioButton, ProgressBar and Tabs.
    modern: {
        box: { color: White(1), border: 1, borderColor: "#D9DADB", round: 100, padding: 4 },
        boxFocus: { borderColor: "cadetblue" },
        button: { width: 36, color: "#DFECEC", hoverColor: "#CFE2E2", activeColor: "cadetblue", round: 100, iconColor: "#2F5F61", iconSize: 14, disabledOpacity: 0.3 },
        value: { fontSize: 17, textColor: "#2F5F61", fontFamily: "opensans-bold" },
        input: { color: "#EEF5F5", textColor: "#2F5F61", round: 100 },
        disabled: { opacity: 0.5 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE, TagInput and Tabs "dark".
    dark: {
        box: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: 3 },
        boxFocus: { borderColor: "#65A293" },
        button: { width: 36, color: "rgba(255, 255, 255, 0.08)", hoverColor: "rgba(255, 255, 255, 0.14)", activeColor: "#3D7A6B", round: 6, iconColor: "rgba(255, 255, 255, 0.85)", iconSize: 14, disabledOpacity: 0.3 },
        value: { fontSize: 17, textColor: "rgba(255, 255, 255, 0.90)", fontFamily: "" },
        input: { color: "rgba(255, 255, 255, 0.06)", textColor: "rgba(255, 255, 255, 0.90)", round: 4 },
        disabled: { opacity: 0.4 },
    },

};
