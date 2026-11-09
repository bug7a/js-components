/* Bismillah */

/*

SliderField - v26.11

UI COMPONENT TEMPLATE
- A slider in the shape of a field: [ Width  |  ·  ·  ·  ·  ·     3 ]
  The label is at the left, the value at the right, the filled part ends with a small handle,
  and the dots in the empty part show the steps. (Like the property sliders of design tools.)
- Drag anywhere on the field, or click a point to jump there. A click on the value opens the typing (editable: 1).
- minValue, maxValue, step and precision (decimals, "auto": from the step). Unit text after the value ("px", "%")
  and a valueFormat() for your own text.
- Keyboard: ArrowRight / ArrowUp one step, ArrowLeft / ArrowDown one step back, PageUp / PageDown ten steps,
  Home / End min / max, Enter (or a digit) starts the typing, Escape cancels it.
- Step dots: one dot for each step, up to maxTicks and as many as there is room for (tick.minSpace; then fewer dots
  that divide the range evenly). Dots under the fill, the label or the value are hidden. showTicks: 0 hides them all.
- Width can be a percent ("100%"): the view is updated with box.onResize (basic.js removes it with the box).
- onChange is called while dragging (every new value), onChangeEnd when the change is finished
  (the drag is released, a key step, a typed value). Neither is called at create time or with silent: 1.
- Everything is drawn with code (no image files needed). Accessibility: role="slider", aria-valuenow...
- Style packages: "light" (default; the old name "classic" works too) and "dark" (the light and dark look of the kit:
  a quiet gray field, a fill in a tint of the accent, the handle and the focus in the accent: _designs/slider-field.htm),
  "modern", "ozden", "minimal", "minimalDark".
  Select with styleName. (SliderField.styles)
  "ozden" (a more usable look for general use), in the colors of SmartButton: a cyan fill with
  an edge and a white knob, a focus ring. Its sample: 02-comp-examples/slider-field-ozden.htm.
- The handle never crosses a text (style.fill.aroundLabel and beforeValue, 1 by default): at min the fill holds the
  label (and the handle stands 6 px after it), at max it ends before the value; the handle is always seen. 0: the
  handle can go under them (it hides there).
- Not the same as comp/slider.js (Slider: a track with a round thumb). THE SLIDER OF NEW PAGES is Slider "round";
  SliderField is the parallel design, for a page that asks for its shape.

USAGE:
const sfWidth = SliderField({ labelText: "Width", value: 3, minValue: 0, maxValue: 10, onChange: (self) => println(self.value) });
sfWidth.setValue(5);                // onChange and onChangeEnd are called
sfWidth.setValue(5, 1);             // silent
SliderField({ labelText: "Opacity", value: 80, minValue: 0, maxValue: 100, step: 5, unitText: "%" });
SliderField({ labelText: "Scale", value: 1.5, minValue: 0.5, maxValue: 3, step: 0.1 }); // precision "auto" -> 1 decimal
SliderField({ labelText: "Blur", width: "100%", valueFormat: (value) => (value === 0) ? "Off" : value + " px" });
SliderField({ styleName: "ozden", labelText: "Volume", value: 60, minValue: 0, maxValue: 100, unitText: "%" });
SliderField({ styleName: "ozden", labelText: "Speed", style: { fill: { color: "#7BC362", hoverColor: "#70B756", activeColor: "#67AD4D" } } }); // the green of SmartButton

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SliderFieldDefaults = {
    key: "0",
    width: 320,
    height: 44,
    labelText: "", // Text at the left. Ex: "Width"
    value: 0,
    minValue: 0,
    maxValue: 10,
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
    styleName: "light", // "light" ("classic": its old name), "dark", "modern", "ozden", "minimal", "minimalDark" or a name added to SliderField.styles
    style: { // The base of every package (a light gray field with a gray fill): a package changes only some keys
        box: {
            color: "#F2F2F4",
            hoverColor: "", // Under the mouse. "": the same color
            border: 1,
            borderColor: "#E8E8EB",
            round: 12,
            boxShadow: "none",
        },
        boxFocus: { // Keyboard focus
            borderColor: "#9A9AA0",
            ringColor: "", // A ring inside the edge, over the fill. "": no ring
            ringWidth: 2,
        },
        fill: {
            color: "#E1E1E4",
            hoverColor: "#DCDCE0",
            activeColor: "#D5D5DA", // While dragging
            minWidth: 26, // Fill width at min (the handle stays visible)
            round: 11,
            innerRound: "", // The right corners while the fill ends inside the field. "": the same as round, 0: straight
            aroundLabel: 1, // 1: at min the fill holds the label (labelSpace after it): the handle never crosses the label. 0: it can go under it
            labelSpace: 16,
            beforeValue: 1, // 1: at max the fill ends before the value (valueSpace before it): the handle never crosses the value. 0: it can go under it
            valueSpace: 16,
            border: 0,
            borderColor: "transparent",
            boxShadow: "none", // Ex: a line at its bottom: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)"
        },
        handle: {
            width: 3,
            height: 16,
            inset: 11, // Space between the handle and the right side of the fill
            color: "#A9A9AE",
            hoverColor: "#86868C",
            activeColor: "#5E5E64",
            round: 2,
            border: 0,
            borderColor: "transparent",
            boxShadow: "none",
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
            filter: "none", // Ex: "grayscale(1)": a colored fill turns gray
        },
    }
};

const SliderField = function (params = {}) {

    // Merge style package: params.style > SliderField.styles[styleName] > SliderFieldDefaults.style (the base)
    basic.applyStylePackage(params, SliderField.styles, SliderFieldDefaults);

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
    let drag = null; // { pointerId, startX, isMoving, startValue }
    const SLIDE_TIME = "0.12s"; // The fill and the handle move to a new value (0s while dragging)
    const FADE_TIME = "0.15s"; // Colors, the border, the dots
    const DRAG_START_DISTANCE = 4; // px: a smaller move is still a click
    const PAGE_STEPS = 10; // PageUp / PageDown
    const LABEL_DOT_SPACE = 8; // px: no dots this close to the label
    const VALUE_DOT_SPACE = 10; // px: no dots this close to the value text
    const TEXT_OVERLAP = 4; // px: the handle may touch a text this much before it is hidden (aroundLabel / beforeValue 0)
    const HANDLE_LABEL_SPACE = 6; // px between the label and the handle at min (aroundLabel)
    const FILL_DOT_SPACE = 4; // px: no dots this close to the end of the fill
    const HANDLE_DOT_SPACE = 8; // px: no dots this close to the right side of the handle
    const VALUE_CLICK_SPACE = 6; // px: a click this close to the value text starts the typing
    const INPUT_MIN_WIDTH = 64;
    const INPUT_EXTRA_WIDTH = 28; // The input is wider than the value text
    const INPUT_SPACE = 6; // px: between the input and the sides of the box

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.minValue, box.maxValue, box.step)

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
        if (isNaN(value)) value = box.minValue;
        value = Math.min(Math.max(value, box.minValue), box.maxValue);
        value = box.minValue + Math.round((value - box.minValue) / box.step) * box.step;
        return roundValue(Math.min(Math.max(value, box.minValue), box.maxValue));
    };

    const getRatio = function () {
        const range = box.maxValue - box.minValue;
        return (range > 0) ? (box.value - box.minValue) / range : 0;
    };

    // Inner width (without the border)
    const getWidth = function () {
        const w = box.elem.clientWidth;
        return (w > 0) ? w : (Number(box.width) || 0);
    };

    // The widest value text of min, max and the value: the end of the track does not move while the text changes.
    const getWidestValueWidth = function () {
        const texts = [box.valueFormat(box.minValue, box), box.valueFormat(box.maxValue, box), box.valueFormat(box.value, box)];
        const widths = texts.map(function (text) { return SliderField.measureText(text, box.lblValue.elem); });
        return Math.max.apply(null, widths);
    };

    // Where the end of the fill moves: { start, end } (the fill width at min and at max).
    // fill.aroundLabel: at min the fill holds the label, so the label is always on the fill.
    // fill.beforeValue: at max the fill ends before the value, so the value is never on the fill.
    // WHY: the end of a colored fill that crossed a text cut its letters in two colors.
    const getTrack = function () {
        const width = getWidth();
        let start = _s.fill.minWidth;
        let end = width;
        if (_s.fill.aroundLabel == 1 && box.labelText) {
            // WHY the room of the handle: a thin handle inside the end of the fill stood on the label at min (hidden)
            const handleRoom = _s.handle.inset + _s.handle.width + HANDLE_LABEL_SPACE;
            start = Math.max(start, _s.label.padding + box.lblLabel.elem.offsetWidth + Math.max(_s.fill.labelSpace, handleRoom));
        }
        if (_s.fill.beforeValue == 1) {
            end = width - _s.value.padding - getWidestValueWidth() - _s.fill.valueSpace;
        }
        return { start: start, end: Math.max(start, end) };
    };

    // Fill width for a ratio (0-1)
    const getFillWidth = function (ratio, track) {
        return track.start + ratio * (track.end - track.start);
    };

    // Value for an x position inside the box (the handle follows the pointer).
    const getValueAt = function (x) {
        const track = getTrack();
        const space = Math.max(1, track.end - track.start);
        const fillWidth = x + _s.handle.inset + _s.handle.width / 2; // the fill that puts the middle of the handle at x
        const ratio = Math.min(1, Math.max(0, (fillWidth - track.start) / space));
        return clampValue(box.minValue + ratio * (box.maxValue - box.minValue));
    };

    // WHY: with fill.aroundLabel a click on the label is not a click on the track (it gave min).
    const isOnLabelOfFill = function (x) {
        return (_s.fill.aroundLabel == 1 && box.labelText && x < getTrack().start);
    };

    // The x of the pointer in the px of the box. WHY the scale: in a scaled parent (page.fit, a transform,
    // the layer of a game UI) the rect is in screen px and the width in the own px of the box: a drag to 80 % gave
    // 60 % (the game Fishing Company Tycoon fixed it in its copy).
    const getPointerX = function (event) {
        const rect = box.elem.getBoundingClientRect();
        const scale = (box.elem.offsetWidth > 0) ? rect.width / box.elem.offsetWidth : 1;
        return (event.clientX - rect.left) / (scale || 1) - box.elem.clientLeft;
    };

    // Number of dot spaces: every step, or a divisor of the steps, up to maxTicks and as many as the track has room for
    // (tick.minSpace). WHY the room: dots that were too close were all hidden, a short track showed none.
    const getTickCount = function (trackLength) {
        if (box.showTicks != 1) return 0;
        const steps = Math.round((box.maxValue - box.minValue) / box.step);
        if (steps < 1) return 0;
        const maxCount = Math.min(box.maxTicks, Math.floor(trackLength / _s.tick.minSpace));
        if (steps <= maxCount) return steps;
        for (let count = maxCount; count >= 2; count--) {
            if (steps % count === 0) return count;
        }
        return 0;
    };

    // Creates the dots again when the count changes.
    const buildTicks = function (trackLength) {
        const count = getTickCount(trackLength);
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
                tick.css = {
                    top: "calc(50% - " + (_s.tick.size / 2) + "px)",
                    transition: "opacity " + FADE_TIME,
                    opacity: "0", // WHY: a new dot under the label faded out from 1 (the dots are made again when the field is resized)
                };
                ticks.push(tick);
            }
        });
    };

    // WHY: at the right end of the field the fill is as round as the field, or the round corner cuts its edge
    const setFillCorners = function (fillWidth, width) {
        const round = _s.fill.round;
        const isInside = (fillWidth < width - 0.5);
        const endRound = (isInside && _s.fill.innerRound !== "") ? _s.fill.innerRound : round;
        box.fill.css.borderRadius = round + "px " + endRound + "px " + endRound + "px " + round + "px";
    };

    // Positions: fill, handle, value text, dots.
    const refreshLayout = function () {

        const width = getWidth();
        const track = getTrack();
        const fillWidth = getFillWidth(getRatio(), track);
        const handleLeft = fillWidth - _s.handle.inset - _s.handle.width;

        box.fill.width = fillWidth;
        setFillCorners(fillWidth, width);
        box.handle.left = handleLeft;
        buildTicks(track.end - track.start);

        // Areas that hide the dots
        const labelRight = (box.labelText) ? _s.label.padding + box.lblLabel.elem.offsetWidth + LABEL_DOT_SPACE : 0;
        const valueLeft = width - _s.value.padding - box.lblValue.elem.offsetWidth - VALUE_DOT_SPACE;

        // WHY: At the ends the handle would be drawn on the label or the value text. Only without aroundLabel /
        //      beforeValue: with them the handle stays beside the texts and is always seen.
        const handleRight = handleLeft + _s.handle.width;
        const isOnLabel = (_s.fill.aroundLabel != 1 && box.labelText && handleRight > _s.label.padding - TEXT_OVERLAP && handleLeft < labelRight - TEXT_OVERLAP);
        const isOnValue = (_s.fill.beforeValue != 1 && handleRight > valueLeft + TEXT_OVERLAP);
        box.handle.css.opacity = (isOnLabel || isOnValue) ? "0" : "1";

        if (tickCount > 0) {
            // WHY the handle: a knob is wider than the end of the fill (ozden)
            const dotsLeft = Math.max(fillWidth + FILL_DOT_SPACE, handleRight + HANDLE_DOT_SPACE);
            for (let i = 0; i <= tickCount; i++) {
                const x = getFillWidth(i / tickCount, track) - _s.handle.inset - _s.handle.width / 2;
                const tick = ticks[i];
                tick.left = x - _s.tick.size / 2;
                const isVisible = x > dotsLeft && x > labelRight && x < valueLeft;
                tick.css.opacity = (isVisible) ? "1" : "0";
            }
        }

    };

    // partStyle: _s.fill or _s.handle (color, hoverColor, activeColor)
    const getStateColor = function (partStyle) {
        if (drag && drag.isMoving) return partStyle.activeColor;
        if (isHover && box.enabled == 1) return partStyle.hoverColor;
        return partStyle.color;
    };

    const paintState = function () {
        const isHoverColor = (isHover && box.enabled == 1 && _s.box.hoverColor);
        box.color = (isHoverColor) ? _s.box.hoverColor : _s.box.color;
        box.fill.color = getStateColor(_s.fill);
        box.handle.color = getStateColor(_s.handle);
        const isFocusLook = ((isFocused && isKeyboardFocus) || isEditing);
        box.borderColor = (isFocusLook) ? _s.boxFocus.borderColor : _s.box.borderColor;
        box.focusRing.visible = (isFocusLook && _s.boxFocus.ringColor) ? 1 : 0;
    };

    const updateView = function () {
        const text = box.valueFormat(box.value, box);
        box.lblValue.plainText = text;
        box.aria = {
            valuenow: String(box.value),
            valuemin: String(box.minValue),
            valuemax: String(box.maxValue),
            valuetext: text,
        };
        refreshLayout();
    };

    // Motion is off while dragging, so the fill follows the pointer.
    const setSlideMotion = function (isOn) {
        const slideTime = (isOn) ? SLIDE_TIME : "0s";
        box.fill.css.transition = "width " + slideTime + ", background-color " + FADE_TIME;
        box.handle.css.transition = "left " + slideTime + ", background-color " + FADE_TIME + ", opacity " + FADE_TIME;
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
        const inputWidth = Math.max(INPUT_MIN_WIDTH, box.lblValue.elem.offsetWidth + INPUT_EXTRA_WIDTH);
        box.input.width = inputWidth;
        box.input.left = getWidth() - inputWidth - INPUT_SPACE;
        box.input.text = (firstText !== undefined) ? firstText : box.formatNumber(box.value);
        box.lblValue.visible = 0;
        box.input.visible = 1;
        box.input.inputElement.focus({ preventScroll: true });
        if (firstText === undefined) box.input.inputElement.select();
        paintState();
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
            if (!isNaN(value)) changeValue(value, 1);
        }
        paintState();
        updateView();
    };

    // While typing: Enter applies, Escape cancels.
    const onEditKeyDown = function (event) {
        const isEnter = (event.key === "Enter");
        if (!isEnter && event.key !== "Escape") return;
        event.preventDefault();
        endEdit(isEnter ? 1 : 0);
        box.focus();
    };

    // The keys that change the value.
    const valueKeyActions = {
        ArrowUp: function () { stepValue(1); },
        ArrowRight: function () { stepValue(1); },
        ArrowDown: function () { stepValue(-1); },
        ArrowLeft: function () { stepValue(-1); },
        PageUp: function () { stepValue(PAGE_STEPS); },
        PageDown: function () { stepValue(-PAGE_STEPS); },
        Home: function () { changeValue(box.minValue, 1); },
        End: function () { changeValue(box.maxValue, 1); },
    };

    const isTypingKey = function (key) {
        return key.length === 1 && /[\d\-.,]/.test(key);
    };

    const onKeyDown = function (event) {

        if (box.enabled != 1) return;

        if (isEditing) {
            onEditKeyDown(event);
            return;
        }

        isKeyboardFocus = 1;
        paintState();

        const key = event.key;
        if (Object.prototype.hasOwnProperty.call(valueKeyActions, key)) {
            event.preventDefault();
            valueKeyActions[key]();
            return;
        }

        if (box.editable != 1) return;

        if (key === "Enter") {
            event.preventDefault();
            startEdit();
            return;
        }

        // A digit starts the typing with that digit.
        if (isTypingKey(key)) {
            event.preventDefault();
            startEdit(key);
        }

    };

    // *** POINTER (drag or click):

    const onPointerDown = function (self, event) {
        // WHY: a click on a disabled field took the focus (and drew the focus of the keyboard on it)
        if (box.enabled != 1) {
            event.preventDefault();
            return;
        }
        if (isEditing || event.button !== 0) return;
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
            if (Math.abs(x - drag.startX) < DRAG_START_DISTANCE) return; // WHY: A small move is still a click.
            drag.isMoving = 1;
            drag.startValue = box.value;
            setSlideMotion(0);
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
        setSlideMotion(1);
        paintState();
        if (wasMoving) {
            if (box.value !== startValueOfDrag) box.onChangeEnd(box);
            return;
        }
        // A click: on the value text -> typing, on the label of a fill around it -> only the focus, anywhere else -> jump there.
        const valueLeft = getWidth() - _s.value.padding - box.lblValue.elem.offsetWidth - VALUE_CLICK_SPACE;
        if (box.editable == 1 && x >= valueLeft) {
            startEdit();
            return;
        }
        if (isOnLabelOfFill(x)) return;
        changeValue(getValueAt(x), 1);
    };

    const onPointerCancel = function (self, event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const wasMoving = drag.isMoving;
        const startValueOfDrag = drag.startValue;
        drag = null;
        setSlideMotion(1);
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
        box.minValue = Number(min) || 0;
        box.maxValue = Math.max(box.minValue, Number(max) || 0);
        box.setValue(box.value, 1); // (the dots are made again in refreshLayout)
    };
    // USAGE: slider.setRange(0, 100)

    box.setMinValue = function (min) {
        box.setRange(min, Math.max(Number(min) || 0, box.maxValue));
    };

    box.setMaxValue = function (max) {
        box.setRange(Math.min(box.minValue, Number(max) || 0), max);
    };

    box.setStep = function (step) {
        box.step = Math.abs(Number(step)) || 1;
        box.setValue(box.value, 1);
    };

    box.setPrecision = function (precision) {
        box.precision = (precision === "auto") ? "auto" : Math.max(0, Number(precision) || 0);
        box.setValue(box.value, 1);
    };

    box.setLabelText = function (text) {
        box.labelText = text || "";
        box.lblLabel.plainText = box.labelText;
        box.aria = { label: box.labelText || box.ariaLabel };
        refreshLayout();
    };
    // USAGE: slider.setLabelText("Height")

    box.setUnitText = function (text) {
        box.unitText = text || "";
        updateView();
    };
    // USAGE: slider.setUnitText("px")

    box.setShowTicks = function (showTicks) {
        box.showTicks = basic.isOn(showTicks) ? 1 : 0;
        refreshLayout();
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        const isEnabled = (box.enabled == 1);
        if (!isEnabled) {
            endEdit(0);
            drag = null;
            setSlideMotion(1);
        }
        box.css.opacity = (isEnabled) ? "1" : String(_s.disabled.opacity);
        box.css.filter = (isEnabled) ? "none" : _s.disabled.filter;
        box.cursor = (isEnabled) ? "pointer" : "default";
        box.tabIndex = (isEnabled) ? 0 : -1;
        box.aria = { disabled: (isEnabled) ? "false" : "true" };
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


    // *** OBJECT VIEW:

    box.role = "slider";
    box.aria = { label: box.labelText || box.ariaLabel };
    box.css = {
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color " + FADE_TIME + ", background-color " + FADE_TIME,
        touchAction: "pan-y", // WHY: A horizontal drag moves the slider, a vertical one still scrolls the page.
        userSelect: "none",
    };
    box.boxShadow = _bs.boxShadow;
    box.clipContent = 1;

    // BOX: Filled part
    box.fill = Box({
        left: 0,
        top: 0,
        width: _s.fill.minWidth,
        height: "100%",
        color: _s.fill.color,
        round: _s.fill.round,
        border: _s.fill.border,
        borderColor: _s.fill.borderColor,
        boxShadow: _s.fill.boxShadow,
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
        border: _s.handle.border,
        borderColor: _s.handle.borderColor,
        boxShadow: _s.handle.boxShadow,
    });
    box.handle.css.top = "calc(50% - " + (_s.handle.height / 2) + "px)";

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
    box.lblValue.css = { left: "auto", right: _s.value.padding + "px" };

    // One line, centered vertically. (fontFamily with css: the fontFamily setter of basic.js also sets fontWeight)
    const styleTextLabel = function (lbl, textStyle) {
        lbl.clickable = 0;
        lbl.elem.style.display = "flex";
        lbl.css = { alignItems: "center", whiteSpace: "nowrap" };
        if (textStyle.fontFamily) lbl.css.fontFamily = textStyle.fontFamily;
    };
    styleTextLabel(box.lblLabel, _s.label);
    styleTextLabel(box.lblValue, _s.value);

    // BOX: Ring of the keyboard focus (boxFocus.ringColor). WHY a box: an outline of the field is drawn under the fill
    box.focusRing = Box({
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        color: "transparent",
        border: _s.boxFocus.ringWidth,
        borderColor: _s.boxFocus.ringColor,
        round: Math.max(0, _s.box.round - _s.box.border),
    });
    box.focusRing.visible = 0;

    // INPUT: Typing the value (hidden until the edit starts)
    box.input = Input({
        left: 0,
        top: INPUT_SPACE,
        width: INPUT_MIN_WIDTH,
        height: "calc(100% - " + (INPUT_SPACE * 2) + "px)",
        minimal: 1,
        color: _s.input.color,
        fontSize: _s.value.fontSize,
        textColor: _s.input.textColor,
        textAlign: "right",
        round: _s.input.round,
    });
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
    [box.fill, box.tickLayer, box.handle, box.focusRing].forEach(function (obj) { obj.clickable = 0; });

    // *** OBJECT INIT CODE:

    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerUp);
    box.on("pointercancel", onPointerCancel);
    box.on("lostpointercapture", onPointerCancel);
    box.on("mouseenter", function () {
        isHover = 1;
        paintState();
    });
    box.on("mouseleave", function () {
        isHover = 0;
        paintState();
    });
    box.on("keydown", function (self, event) {
        if (event.target === box.input.inputElement) return; // WHY: The input has its own keydown (below).
        onKeyDown(event);
    });
    box.on("focus", function () {
        isFocused = 1;
        if (!isPointerFocusing) isKeyboardFocus = 1;
        paintState();
    });
    box.on("blur", function () {
        isFocused = 0;
        isKeyboardFocus = 0;
        paintState();
    });
    box.input.inputElement.addEventListener("blur", function () { endEdit(1); });
    box.input.inputElement.addEventListener("keydown", onKeyDown);

    box.onResize(function () { refreshLayout(); });
    // WHY: the label and the value are measured; a font that is loaded later changes their widths.
    if (document.fonts) document.fonts.ready.then(function () { if (!box.isRemoved) refreshLayout(); });

    box.minValue = Number(box.minValue) || 0;
    box.maxValue = Number(box.maxValue);
    if (isNaN(box.maxValue)) box.maxValue = box.minValue;
    if (box.maxValue < box.minValue) box.maxValue = box.minValue;
    box.step = Math.abs(Number(box.step)) || 1;
    box.maxTicks = Math.max(2, Number(box.maxTicks) || SliderFieldDefaults.maxTicks);
    box.value = clampValue(startValue);
    setSlideMotion(1);
    box.setEnabled(box.enabled);
    updateView();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
SliderField.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

// The width of a text in the font of an element, measured on a canvas (nothing changes in the page).
SliderField.measureText = function (text, elem) {
    if (!SliderField.textCanvas) SliderField.textCanvas = document.createElement("canvas").getContext("2d");
    const css = getComputedStyle(elem);
    SliderField.textCanvas.font = css.fontStyle + " " + css.fontWeight + " " + css.fontSize + " " + css.fontFamily;
    return SliderField.textCanvas.measureText(String(text)).width;
};

// *** STYLE PACKAGES:
// USAGE: SliderField({ styleName: "modern" })
// USAGE: SliderField({ styleName: "dark", style: { fill: { color: "#3D7A6B" } } }) // Change only some keys.
// USAGE: SliderField({ style: SliderField.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from SliderFieldDefaults.style (the base of every package).
// USAGE: SliderField.styles.myStyle = { fill: { color: "gold" } };
SliderField.styles = {

    // The light look of the kit (_designs/slider-field.htm), the default: a quiet gray field with round 6 corners, a
    // fill in a tint of the accent that ends with a handle in the accent, a bold value, dots for the steps; the keyboard
    // focus is the accent edge with a soft ring inside.
    light: {
        box: { color: "#F2F3F0", hoverColor: "", border: 1, borderColor: Black(0.08), round: 6, boxShadow: "none" },
        boxFocus: { borderColor: "#3D7A6B", ringColor: "rgba(61, 122, 107, 0.5)", ringWidth: 2 },
        fill: { color: "#D8E8E2", hoverColor: "#CCE1DA", activeColor: "#BFD9D0", minWidth: 26, round: 6 }, // the accent on the field at 22 %, 30 %, 38 %
        handle: { width: 4, height: 18, inset: 11, color: "#3D7A6B", hoverColor: "#356C5E", activeColor: "#2E5F53", round: 2 },
        tick: { size: 3, color: Black(0.15), minSpace: 9 },
        label: { fontSize: 15, textColor: Black(0.55), fontFamily: "", padding: 14 },
        value: { fontSize: 15, textColor: Black(0.88), fontFamily: "opensans-bold", padding: 14 },
        input: { color: "#FFFFFF", textColor: Black(0.88), round: 6 },
        disabled: { opacity: 0.45, filter: "none" },
    },

    // The dark look of the kit: the same shapes on the dark surface.
    dark: {
        box: { color: "#232322", hoverColor: "", border: 1, borderColor: White(0.08), round: 6, boxShadow: "none" },
        boxFocus: { borderColor: "#65A293", ringColor: "rgba(101, 162, 147, 0.55)", ringWidth: 2 },
        fill: { color: "rgba(101, 162, 147, 0.22)", hoverColor: "rgba(101, 162, 147, 0.28)", activeColor: "rgba(101, 162, 147, 0.34)", minWidth: 26, round: 6 },
        handle: { width: 4, height: 18, inset: 11, color: "#65A293", hoverColor: "#74B0A2", activeColor: "#8CC2B5", round: 2 },
        tick: { size: 3, color: White(0.2), minSpace: 9 },
        label: { fontSize: 15, textColor: White(0.55), fontFamily: "", padding: 14 },
        value: { fontSize: 15, textColor: White(0.9), fontFamily: "opensans-bold", padding: 14 },
        input: { color: White(0.08), textColor: White(0.9), round: 6 },
        disabled: { opacity: 0.4, filter: "none" },
    },

    // For general use: the colors of SmartButton and of ProgressBar
    // ozden. The fill is a cyan SmartButton ozden (an edge and a line at its bottom) that ends with a white knob,
    // straight inside the field. The label is always on the fill (aroundLabel) and the value never (beforeValue): the
    // end of the fill cuts no text. A ring for the keyboard focus, a gray fill when it is off.
    // Another tone: style: { fill: { color, hoverColor, activeColor } }.
    // handle.inset -6: the middle of the knob is at the end of the fill. WHY a dark focus ring: the focus color of the
    // kit (cadetblue) did not show on the cyan fill; black 50 % has a contrast of 3 on the fill and on the field.
    ozden: {
        box: { color: "#F2F2F2", hoverColor: "#EDEDED", border: 1, borderColor: "rgba(0, 0, 0, 0.12)", round: 8, boxShadow: "none" },
        boxFocus: { borderColor: "rgba(0, 0, 0, 0.5)", ringColor: "rgba(0, 0, 0, 0.5)", ringWidth: 2 },
        fill: { color: "#5BBAC1", hoverColor: "#50AEB5", activeColor: "#4AA5AC", minWidth: 28, round: 7, innerRound: 0, aroundLabel: 1, labelSpace: 16, beforeValue: 1, valueSpace: 16, border: 1, borderColor: "rgba(0, 0, 0, 0.35)", boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)" },
        handle: { width: 12, height: 30, inset: -6, color: "#FFFFFF", hoverColor: "#FFFFFF", activeColor: "#F2F2F2", round: 4, border: 1, borderColor: "rgba(0, 0, 0, 0.35)", boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)" },
        tick: { size: 4, color: "rgba(0, 0, 0, 0.2)", minSpace: 10 },
        label: { fontSize: 16, textColor: "rgba(0, 0, 0, 0.7)", fontFamily: "", padding: 14 },
        value: { fontSize: 16, textColor: "rgba(0, 0, 0, 0.8)", fontFamily: "opensans-bold", padding: 14 },
        input: { color: "#FFFFFF", textColor: "rgba(0, 0, 0, 0.8)", round: 6 },
        disabled: { opacity: 0.55, filter: "grayscale(1)" },
    },

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

};
SliderField.styles.classic = SliderField.styles.light; // the old name of light

// The minimal theme (_designs/minimal-theme.htm): a 28 px field with no fill and an edge of 3:1 at least (it is a
// control), a faint gray fill for the value, a thin handle that darkens under the mouse and is ink while it is dragged,
// a 12 px label and a 13 px value. WHY aroundLabel and beforeValue: the thin handle never crosses a text. The keyboard focus: a blue edge of 2 px. minimalDark: the same on a dark window.
SliderField.createMinimalStyle = function (colors) {
    return {
        height: 28,
        style: {
            box: { color: "transparent", hoverColor: "", border: 1, borderColor: colors.edge, round: 4, boxShadow: "none" },
            boxFocus: { borderColor: colors.focus, ringColor: colors.focus, ringWidth: 1 },
            fill: { color: colors.fill, hoverColor: colors.fillHover, activeColor: colors.fillActive, minWidth: 20, round: 3, innerRound: 0, aroundLabel: 1, labelSpace: 16, beforeValue: 1, valueSpace: 6, border: 0, borderColor: "transparent", boxShadow: "none" },
            handle: { width: 2, height: 12, inset: 6, color: colors.edge, hoverColor: colors.edgeHover, activeColor: colors.ink, round: 1, border: 0, borderColor: "transparent", boxShadow: "none" },
            tick: { size: 2, color: colors.line, minSpace: 8 },
            label: { fontSize: 12, textColor: colors.softText, fontFamily: "", padding: 10 },
            value: { fontSize: 13, textColor: colors.text, fontFamily: "", padding: 10 },
            input: { color: colors.ground, textColor: colors.text, round: 3 },
            disabled: { opacity: 0.4, filter: "none" },
        },
    };
};
SliderField.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), line: Black(0.2), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", fill: Black(0.06), fillHover: Black(0.08), fillActive: Black(0.11), focus: "#3D8BD9" };
SliderField.styles.minimal = SliderField.createMinimalStyle(SliderField.MINIMAL_COLORS);
SliderField.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), line: White(0.18), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", fill: White(0.08), fillHover: White(0.11), fillActive: White(0.14), focus: "#7FB6DE" };
SliderField.styles.minimalDark = SliderField.createMinimalStyle(SliderField.MINIMAL_DARK_COLORS);
