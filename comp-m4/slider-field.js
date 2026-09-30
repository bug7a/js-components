/* Bismillah */

/*

SliderField - v26.09

UI COMPONENT TEMPLATE
- A slider in the shape of a field: [ Width  |  ·  ·  ·  ·  ·     3 ]
  The label is at the left, the value at the right, the filled part ends with a small handle,
  and the dots in the empty part show the steps. (Like the property sliders of design tools.)
- Drag anywhere on the field, or click a point to jump there. A click on the value opens the typing (editable: 1).
- min, max, step and precision (decimals, "auto": from the step). Unit text after the value ("px", "%")
  and a valueFormat() for your own text.
- Keyboard: ArrowRight / ArrowUp one step, ArrowLeft / ArrowDown one step back, PageUp / PageDown ten steps,
  Home / End min / max, Enter (or a digit) starts the typing, Escape cancels it.
- Step dots: one dot for each step, up to maxTicks (then fewer dots that divide the range evenly).
  Dots under the fill, the label or the value are hidden. showTicks: 0 hides them all.
- Width can be a percent ("100%"): the view is updated with a ResizeObserver (disconnected in remove()).
- onChange is called while dragging (every new value), onChangeEnd when the change is finished
  (the drag is released, a key step, a typed value). Neither is called at create time or with silent: 1.
- Everything is drawn with code (no image files needed). Accessibility: role="slider", aria-valuenow...
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (SliderField.styles)
- Not the same as comp-m2/slider.js (Slider: a Material style track with a round thumb).

USAGE:
const sfWidth = SliderField({ labelText: "Width", value: 3, min: 0, max: 10, onChange: (self) => println(self.value) });
sfWidth.setValue(5);                // onChange and onChangeEnd are called
sfWidth.setValue(5, 1);             // silent
SliderField({ labelText: "Opacity", value: 80, min: 0, max: 100, step: 5, unitText: "%" });
SliderField({ labelText: "Scale", value: 1.5, min: 0.5, max: 3, step: 0.1 }); // precision "auto" -> 1 decimal
SliderField({ labelText: "Blur", width: "100%", valueFormat: (value) => (value === 0) ? "Off" : value + " px" });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SliderFieldDefaults = {
    key: "0",
    width: 320,
    height: 44,
    labelText: "", // Text at the left. Ex: "Width"
    value: 0,
    min: 0,
    max: 10,
    step: 1,
    precision: "auto", // Decimals shown and used for rounding. "auto": the decimals of the step (0.25 -> 2)
    unitText: "", // After the value. Ex: "px", " kg" (with the space)
    editable: 1, // 1: A click on the value opens the typing.
    showTicks: 1, // 1: Dots for the steps in the empty part.
    maxTicks: 30, // More steps than this -> fewer dots
    enabled: 1,
    ariaLabel: "Value", // Used when labelText is empty
    valueFormat: function (value, self) { return self.formatNumber(value) + self.unitText; }, // Text of the value
    onChange: function (self) { }, // self.value (also while dragging)
    onChangeEnd: function (self) { }, // After a drag, a key step or a typed value
    styleName: "classic", // "classic", "modern", "dark" or a name added to SliderField.styles
    style: { // Classic style package (default)
        box: {
            color: "#F2F2F4",
            border: 1,
            borderColor: "#E8E8EB",
            round: 12,
        },
        boxFocus: { // Keyboard focus
            borderColor: "#9A9AA0",
        },
        fill: {
            color: "#E1E1E4",
            hoverColor: "#DCDCE0",
            activeColor: "#D5D5DA", // While dragging
            minWidth: 26, // Fill width at min (the handle stays visible)
            round: 11,
        },
        handle: {
            width: 3,
            height: 16,
            inset: 11, // Space between the handle and the right side of the fill
            color: "#A9A9AE",
            hoverColor: "#86868C",
            activeColor: "#5E5E64",
            round: 2,
        },
        tick: {
            size: 3,
            color: "#BDBDC2",
            minSpace: 9, // Dots closer than this are not shown
        },
        label: {
            fontSize: 15,
            textColor: "#8A8A8F",
            fontFamily: "", // "": Default. Ex: "opensans-bold"
            padding: 14, // Space at the left
        },
        value: {
            fontSize: 15,
            textColor: "#2C2C2E",
            fontFamily: "",
            padding: 16, // Space at the right
        },
        input: { // While typing
            color: White(1),
            textColor: "#2C2C2E",
            round: 6,
        },
        disabled: {
            opacity: 0.5,
        },
    }
};

const SliderField = function (params = {}) {

    // Merge style package: params.style > SliderField.styles[styleName] > SliderFieldDefaults.style (classic)
    const _styleName = params.styleName || SliderFieldDefaults.styleName;
    const _stylePackage = SliderField.styles[_styleName];
    if (!_stylePackage) console.warn("SliderField: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, SliderFieldDefaults);

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
    let ticks = []; // Dot boxes
    let tickCount = 0; // Number of spaces between the dots (dots = tickCount + 1)
    let isEditing = 0;
    let isHover = 0;
    let isFocused = 0;
    let isKeyboardFocus = 0; // WHY: The focus border is only for the keyboard, not after a click.
    let isPointerFocusing = 0;
    let drag = null; // { pointerId, startX, isMoving, onValue }
    let resizeObserver = null;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.min, box.max, box.step)

    // *** PRIVATE FUNCTIONS:

    const getPrecision = function () {
        if (box.precision !== "auto") return Math.max(0, Number(box.precision) || 0);
        const text = String(box.step);
        return (text.indexOf(".") > -1) ? text.split(".")[1].length : 0;
    };

    const roundValue = function (value) {
        const factor = Math.pow(10, getPrecision());
        return Math.round(value * factor) / factor;
    };

    // Snaps to the steps (from min) and keeps the value in [min, max].
    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = box.min;
        value = Math.min(Math.max(value, box.min), box.max);
        value = box.min + Math.round((value - box.min) / box.step) * box.step;
        return roundValue(Math.min(Math.max(value, box.min), box.max));
    };

    const getRatio = function () {
        const range = box.max - box.min;
        return (range > 0) ? (box.value - box.min) / range : 0;
    };

    // Inner width (without the border)
    const getWidth = function () {
        const w = box.elem.clientWidth;
        return (w > 0) ? w : (Number(box.width) || 0);
    };

    // Fill width for a ratio (0-1)
    const getFillWidth = function (ratio) {
        const minWidth = _s.fill.minWidth;
        return minWidth + ratio * Math.max(0, getWidth() - minWidth);
    };

    // Value for an x position inside the box (the handle follows the pointer).
    const getValueAt = function (x) {
        const minWidth = _s.fill.minWidth;
        const space = Math.max(1, getWidth() - minWidth);
        const ratio = Math.min(1, Math.max(0, (x + _s.handle.inset + _s.handle.width / 2 - minWidth) / space));
        return clampValue(box.min + ratio * (box.max - box.min));
    };

    const getPointerX = function (event) {
        const rect = box.elem.getBoundingClientRect();
        return event.clientX - rect.left - box.elem.clientLeft;
    };

    // Number of dot spaces: every step, or a divisor of the steps up to maxTicks.
    const getTickCount = function () {
        if (box.showTicks != 1) return 0;
        const steps = Math.round((box.max - box.min) / box.step);
        if (steps < 1) return 0;
        if (steps <= box.maxTicks) return steps;
        for (let count = box.maxTicks; count >= 2; count--) {
            if (steps % count === 0) return count;
        }
        return 0;
    };

    // Creates the dots again when the count changes.
    const buildTicks = function () {
        const count = getTickCount();
        if (count === tickCount && ticks.length === ((count > 0) ? count + 1 : 0)) return;
        ticks.forEach(function (tick) { tick.remove(); });
        ticks = [];
        tickCount = count;
        if (count === 0) return;
        createIn(box.tickLayer, function () {
            for (let i = 0; i <= count; i++) {
                const tick = Box({
                    left: 0,
                    top: 0,
                    width: _s.tick.size,
                    height: _s.tick.size,
                    color: _s.tick.color,
                    round: _s.tick.size,
                });
                tick.elem.style.top = "calc(50% - " + (_s.tick.size / 2) + "px)";
                tick.elem.style.transition = "opacity 0.15s";
                ticks.push(tick);
            }
        });
    };

    // Positions: fill, handle, value text, dots.
    const layout = function () {

        const width = getWidth();
        const fillWidth = getFillWidth(getRatio());
        const handleLeft = fillWidth - _s.handle.inset - _s.handle.width;

        box.fill.width = fillWidth;
        box.handle.left = handleLeft;

        // Areas that hide the dots
        const labelRight = (box.labelText) ? _s.label.padding + box.lblLabel.elem.offsetWidth + 8 : 0;
        const valueLeft = width - _s.value.padding - box.lblValue.elem.offsetWidth - 10;

        // WHY: At the ends the handle would be drawn on the label or the value text.
        const handleRight = handleLeft + _s.handle.width;
        const isOnLabel = (box.labelText && handleRight > _s.label.padding - 4 && handleLeft < labelRight - 4);
        const isOnValue = (handleRight > valueLeft + 4);
        box.handle.elem.style.opacity = (isOnLabel || isOnValue) ? "0" : "1";

        if (tickCount > 0) {
            const space = (width - _s.fill.minWidth) / tickCount;
            const isTooClose = (space < _s.tick.minSpace);
            for (let i = 0; i <= tickCount; i++) {
                const x = getFillWidth(i / tickCount) - _s.handle.inset - _s.handle.width / 2;
                const tick = ticks[i];
                tick.left = x - _s.tick.size / 2;
                const isVisible = !isTooClose && x > fillWidth + 4 && x > labelRight && x < valueLeft;
                tick.elem.style.opacity = (isVisible) ? "1" : "0";
            }
        }

    };

    const paintState = function () {
        const isDragging = (drag && drag.isMoving);
        box.fill.color = (isDragging) ? _s.fill.activeColor : (isHover && box.enabled == 1) ? _s.fill.hoverColor : _s.fill.color;
        box.handle.color = (isDragging) ? _s.handle.activeColor : (isHover && box.enabled == 1) ? _s.handle.hoverColor : _s.handle.color;
        box.borderColor = ((isFocused && isKeyboardFocus) || isEditing) ? _s.boxFocus.borderColor : _s.box.borderColor;
    };

    const updateView = function () {
        const text = box.valueFormat(box.value, box);
        box.lblValue.text = SliderField.escapeHtml(text);
        box.elem.setAttribute("aria-valuenow", String(box.value));
        box.elem.setAttribute("aria-valuemin", String(box.min));
        box.elem.setAttribute("aria-valuemax", String(box.max));
        box.elem.setAttribute("aria-valuetext", text);
        layout();
    };

    // Motion is off while dragging, so the fill follows the pointer.
    const setMotion = function (isOn) {
        const motion = (isOn) ? "0.12s" : "0s";
        box.fill.elem.style.transition = "width " + motion + ", background-color 0.15s";
        box.handle.elem.style.transition = "left " + motion + ", background-color 0.15s, opacity 0.15s";
    };

    // Changes the value; onChange if it changed. Returns 1 when the value changed.
    const changeValue = function (value, isEnd) {
        const oldValue = box.value;
        box.setValue(value, 1);
        const changed = (box.value !== oldValue);
        if (changed) box.onChange(box);
        if (changed && isEnd) box.onChangeEnd(box);
        return changed ? 1 : 0;
    };

    const stepValue = function (steps) {
        if (box.enabled != 1) return 0;
        return changeValue(box.value + steps * box.step, 1);
    };

    // *** EDIT (type the value):

    const startEdit = function (firstText) {
        if (box.editable != 1 || box.enabled != 1 || isEditing) return;
        isEditing = 1;
        const inputWidth = Math.max(64, box.lblValue.elem.offsetWidth + 28);
        box.input.width = inputWidth;
        box.input.left = getWidth() - inputWidth - 6;
        box.input.text = (firstText !== undefined) ? firstText : box.formatNumber(box.value);
        box.lblValue.visible = 0;
        box.input.visible = 1;
        box.input.inputElement.focus({ preventScroll: true });
        if (firstText === undefined) box.input.inputElement.select();
        paintState();
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
            if (!isNaN(value)) changeValue(value, 1);
        }
        paintState();
        updateView();
    };

    const onKeyDown = function (event) {

        if (box.enabled != 1) return;
        const key = event.key;

        if (isEditing) {
            if (key === "Enter") { event.preventDefault(); endEdit(1); box.focus(); }
            else if (key === "Escape") { event.preventDefault(); endEdit(0); box.focus(); }
            return;
        }

        isKeyboardFocus = 1;
        paintState();

        switch (key) {
            case "ArrowUp": case "ArrowRight": event.preventDefault(); stepValue(1); break;
            case "ArrowDown": case "ArrowLeft": event.preventDefault(); stepValue(-1); break;
            case "PageUp": event.preventDefault(); stepValue(10); break;
            case "PageDown": event.preventDefault(); stepValue(-10); break;
            case "Home": event.preventDefault(); changeValue(box.min, 1); break;
            case "End": event.preventDefault(); changeValue(box.max, 1); break;
            case "Enter": if (box.editable == 1) { event.preventDefault(); startEdit(); } break;
            default:
                // Typing a digit starts the edit with that digit.
                if (box.editable == 1 && key.length === 1 && /[\d\-.,]/.test(key)) { event.preventDefault(); startEdit(key); }
        }

    };

    // *** POINTER (drag or click):

    const onPointerDown = function (self, event) {
        if (box.enabled != 1 || isEditing || event.button !== 0) return;
        if (event.target === box.input.inputElement) return;
        event.preventDefault(); // WHY: No text selection, the focus is given below.
        isKeyboardFocus = 0;
        isPointerFocusing = 1;
        box.focus();
        isPointerFocusing = 0;
        drag = { pointerId: event.pointerId, startX: getPointerX(event), isMoving: 0 };
        try { box.elem.setPointerCapture(event.pointerId); } catch (e) { }
    };

    const onPointerMove = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const x = getPointerX(event);
        if (!drag.isMoving) {
            if (Math.abs(x - drag.startX) < 4) return; // WHY: A small move is still a click.
            drag.isMoving = 1;
            drag.startValue = box.value;
            setMotion(0);
            paintState();
        }
        changeValue(getValueAt(x), 0);
    };

    const onPointerUp = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const wasMoving = drag.isMoving;
        const startValueOfDrag = drag.startValue;
        const x = getPointerX(event);
        drag = null;
        try { box.elem.releasePointerCapture(event.pointerId); } catch (e) { }
        setMotion(1);
        paintState();
        if (wasMoving) {
            if (box.value !== startValueOfDrag) box.onChangeEnd(box);
            return;
        }
        // A click: on the value text -> typing, anywhere else -> jump there.
        const valueLeft = getWidth() - _s.value.padding - box.lblValue.elem.offsetWidth - 6;
        if (box.editable == 1 && x >= valueLeft) startEdit();
        else changeValue(getValueAt(x), 1);
    };

    const onPointerCancel = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const wasMoving = drag.isMoving;
        const startValueOfDrag = drag.startValue;
        drag = null;
        setMotion(1);
        paintState();
        if (wasMoving && box.value !== startValueOfDrag) box.onChangeEnd(box);
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange and onChangeEnd are not called.
    box.setValue = function (value, silent = 0) {
        const next = clampValue(value);
        const changed = (next !== box.value);
        box.value = next;
        updateView();
        if (changed && !silent) {
            box.onChange(box);
            box.onChangeEnd(box);
        }
        return box.value;
    };
    // USAGE: get: slider.value, set: slider.setValue(5) // Snapped to the steps and clamped.

    box.getValue = function () {
        return box.value;
    };

    box.increase = function (steps = 1) {
        return stepValue(steps);
    };
    // USAGE: slider.increase() or slider.increase(5)

    box.decrease = function (steps = 1) {
        return stepValue(-steps);
    };

    box.setRange = function (min, max) {
        box.min = Number(min) || 0;
        box.max = Math.max(box.min, Number(max) || 0);
        buildTicks();
        box.setValue(box.value, 1);
    };
    // USAGE: slider.setRange(0, 100)

    box.setMin = function (min) {
        box.setRange(min, Math.max(Number(min) || 0, box.max));
    };

    box.setMax = function (max) {
        box.setRange(Math.min(box.min, Number(max) || 0), max);
    };

    box.setStep = function (step) {
        box.step = Math.abs(Number(step)) || 1;
        buildTicks();
        box.setValue(box.value, 1);
    };

    box.setPrecision = function (precision) {
        box.precision = (precision === "auto") ? "auto" : Math.max(0, Number(precision) || 0);
        box.setValue(box.value, 1);
    };

    box.setLabelText = function (text) {
        box.labelText = text || "";
        box.lblLabel.text = SliderField.escapeHtml(box.labelText);
        box.elem.setAttribute("aria-label", box.labelText || box.ariaLabel);
        layout();
    };
    // USAGE: slider.setLabelText("Height")

    box.setUnitText = function (text) {
        box.unitText = text || "";
        updateView();
    };
    // USAGE: slider.setUnitText("px")

    box.setShowTicks = function (showTicks) {
        box.showTicks = (showTicks == 1 || showTicks === true) ? 1 : 0;
        buildTicks();
        layout();
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1) { endEdit(0); drag = null; setMotion(1); }
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
        paintState();
    };
    // USAGE: get: slider.enabled, set: slider.setEnabled(0)

    // Number text with the precision: 2.5 -> "2.5", 3 -> "3" (precision 0), 3 -> "3.0" (precision 1)
    box.formatNumber = function (value) {
        return Number(value).toFixed(getPrecision());
    };

    box.focus = function () {
        box.elem.focus({ preventScroll: true });
    };

    // Call it when the size changed in a way the ResizeObserver can not see (Ex: a font loaded later).
    box.refresh = function () {
        updateView();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        if (resizeObserver) resizeObserver.disconnect();
        resizeObserver = null;
        ticks = [];
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.setAttribute("role", "slider");
    box.elem.setAttribute("aria-label", box.labelText || box.ariaLabel);
    box.elem.style.outline = "none";
    box.elem.style.boxSizing = "border-box";
    box.elem.style.transition = "border-color 0.15s";
    box.elem.style.touchAction = "pan-y"; // WHY: A horizontal drag moves the slider, a vertical one still scrolls the page.
    box.elem.style.userSelect = "none";
    box.clipContent = 1;

    // BOX: Filled part
    box.fill = Box({
        left: 0,
        top: 0,
        width: _s.fill.minWidth,
        height: "100%",
        color: _s.fill.color,
        round: _s.fill.round,
    });

    // BOX: Layer of the step dots
    box.tickLayer = Box({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });

    // BOX: Handle (the small line at the end of the fill)
    box.handle = Box({
        left: 0,
        top: 0,
        width: _s.handle.width,
        height: _s.handle.height,
        color: _s.handle.color,
        round: _s.handle.round,
    });
    box.handle.elem.style.top = "calc(50% - " + (_s.handle.height / 2) + "px)";

    // LABEL: Name at the left
    box.lblLabel = Label({
        left: _s.label.padding,
        top: 0,
        height: "100%",
        text: SliderField.escapeHtml(box.labelText),
        fontSize: _s.label.fontSize,
        textColor: _s.label.textColor,
    });

    // LABEL: Value at the right
    box.lblValue = Label({
        top: 0,
        height: "100%",
        fontSize: _s.value.fontSize,
        textColor: _s.value.textColor,
    });
    box.lblValue.elem.style.left = "auto";
    box.lblValue.elem.style.right = _s.value.padding + "px";

    [box.lblLabel, box.lblValue].forEach(function (lbl, i) {
        const textStyle = (i === 0) ? _s.label : _s.value;
        lbl.clickable = 0;
        lbl.elem.style.display = "flex";
        lbl.elem.style.alignItems = "center";
        lbl.elem.style.whiteSpace = "nowrap";
        if (textStyle.fontFamily) lbl.elem.style.fontFamily = textStyle.fontFamily;
    });

    // INPUT: Typing the value (hidden until the edit starts)
    box.input = Input({ left: 0, top: 6, width: 64, height: "calc(100% - 12px)", minimal: 1, color: _s.input.color, fontSize: _s.value.fontSize, textColor: _s.input.textColor, textAlign: "right", round: _s.input.round });
    box.input.inputElement.style.padding = "0px 10px";
    box.input.inputElement.style.width = "100%";
    box.input.inputElement.style.height = "100%";
    box.input.inputElement.style.boxSizing = "border-box";
    box.input.inputElement.style.borderRadius = _s.input.round + "px";
    box.input.inputElement.style.backgroundColor = _s.input.color;
    box.input.inputElement.setAttribute("inputmode", "decimal");
    box.input.inputElement.setAttribute("aria-label", box.labelText || box.ariaLabel);
    if (_s.value.fontFamily) box.input.inputElement.style.fontFamily = _s.value.fontFamily;
    box.input.visible = 0;

    // WHY: Only the box gets the pointer events, so event.target is always the box (or the input).
    [box.fill, box.tickLayer, box.handle].forEach(function (obj) { obj.clickable = 0; });

    // *** OBJECT INIT CODE:

    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerUp);
    box.on("pointercancel", onPointerCancel);
    box.on("lostpointercapture", onPointerCancel);
    box.on("mouseenter", function () { isHover = 1; paintState(); });
    box.on("mouseleave", function () { isHover = 0; paintState(); });
    box.on("keydown", function (self, event) { if (event.target !== box.input.inputElement) onKeyDown(event); });
    box.on("focus", function () { isFocused = 1; if (!isPointerFocusing) isKeyboardFocus = 1; paintState(); });
    box.on("blur", function () { isFocused = 0; isKeyboardFocus = 0; paintState(); });
    box.input.inputElement.addEventListener("blur", function () { endEdit(1); });
    box.input.inputElement.addEventListener("keydown", onKeyDown);

    if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(function () { if (box) layout(); });
        resizeObserver.observe(box.elem);
    }

    box.min = Number(box.min) || 0;
    box.max = Number(box.max);
    if (isNaN(box.max)) box.max = box.min;
    if (box.max < box.min) box.max = box.min;
    box.step = Math.abs(Number(box.step)) || 1;
    box.maxTicks = Math.max(2, Number(box.maxTicks) || 30);
    box.value = clampValue(startValue);
    buildTicks();
    setMotion(1);
    box.setEnabled(box.enabled);
    updateView();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
SliderField.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// *** STYLE PACKAGES:
// USAGE: SliderField({ styleName: "modern" })
// USAGE: SliderField({ styleName: "dark", style: { fill: { color: "#3D7A6B" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SliderField.styles.myStyle = { fill: { color: "gold" } };
SliderField.styles = {

    // Light gray field, gray fill. (Like the property sliders of design tools)
    classic: SliderFieldDefaults.style,

    // Cadetblue fill. Same colors as the modern CheckBox, RadioButton, ProgressBar, Tabs and Stepper.
    modern: {
        box: { color: "#F1F6F6", border: 1, borderColor: "#DCE8E8", round: 100 },
        boxFocus: { borderColor: "cadetblue" },
        fill: { color: "#CFE2E2", hoverColor: "#C4DCDC", activeColor: "#B5D3D3", minWidth: 30, round: 100 },
        handle: { width: 3, height: 16, inset: 13, color: "#6FA3A5", hoverColor: "#4F8A8C", activeColor: "#2F5F61", round: 2 },
        tick: { size: 4, color: "#B9D2D3", minSpace: 10 },
        label: { fontSize: 15, textColor: "#5E8F91", fontFamily: "", padding: 18 },
        value: { fontSize: 15, textColor: "#2F5F61", fontFamily: "opensans-bold", padding: 18 },
        input: { color: White(1), textColor: "#2F5F61", round: 100 },
        disabled: { opacity: 0.5 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE, TagInput, Tabs and Stepper "dark".
    dark: {
        box: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.08)", round: 12 },
        boxFocus: { borderColor: "#65A293" },
        fill: { color: "rgba(255, 255, 255, 0.09)", hoverColor: "rgba(255, 255, 255, 0.12)", activeColor: "rgba(255, 255, 255, 0.16)", minWidth: 26, round: 11 },
        handle: { width: 3, height: 16, inset: 11, color: "rgba(255, 255, 255, 0.35)", hoverColor: "rgba(255, 255, 255, 0.55)", activeColor: "#65A293", round: 2 },
        tick: { size: 3, color: "rgba(255, 255, 255, 0.22)", minSpace: 9 },
        label: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.50)", fontFamily: "", padding: 14 },
        value: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)", fontFamily: "", padding: 16 },
        input: { color: "rgba(255, 255, 255, 0.08)", textColor: "rgba(255, 255, 255, 0.90)", round: 6 },
        disabled: { opacity: 0.4 },
    },

};
