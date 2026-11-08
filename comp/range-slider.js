/* Bismillah */

/*

RangeSlider - v26.11

UI COMPONENT
- A range of values on a thin bar: two knobs, a part of the bar between them: a price from 100 to 500, the hours of a day.
  One value: comp/slider.js. The look of its "round" package.
- A value is minValue + n * step (0 - 100 and 1 by default). minGap: the smallest distance between the two values.
- The mouse: a knob is dragged; a press on the bar brings the nearest knob there and drags from there. Two knobs at one place: the
  direction of the first move chooses one of them.
- A finger: as the mouse on a knob. On the bar a move to the side drags, a tap moves the nearest knob, a move up or down scrolls
  the page.
- The keyboard: each knob is one Tab stop: ArrowRight / ArrowUp one step, ArrowLeft / ArrowDown one step back, PageUp / PageDown ten
  steps, Home / End as far as it can go. role "slider" with aria-valuenow / valuemin / valuemax.
- A bubble over a knob shows its value while it moves. formatValue: function (value) { return value + " TL"; }.
- onChange(self) runs while it moves, onChangeEnd(self) when it is let go. A key and a tap are short moves: they call both.
  Read self.lowValue and self.highValue. Not at create time, not with setValues().
- Style packages: "round" (default), "roundDark", "minimal", "minimalDark" (packages of params: the height too). Select
  with styleName (RangeSlider.styles), or later with setTheme().

USAGE:
const price = RangeSlider({
    width: 280,
    minValue: 0,
    maxValue: 1000,
    step: 50,
    lowValue: 200,
    highValue: 800,
    minGap: 100,
    formatValue: function (value) { return value + " TL"; },
    onChangeEnd: function (self) { println(self.lowValue + " - " + self.highValue); },
});
price.setValues(100, 500);
price.getValues();                      // [100, 500]
price.setEnabled(0);
price.setTheme("roundDark");

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const RangeSliderDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: 250,
    height: 44, // WHY: The place a finger can take; the bar stands in its middle.
    minValue: 0, // The value at the left end
    maxValue: 100, // The value at the right end
    step: 1, // The values are min + n * step (Ex: 0.5)
    lowValue: null, // The left knob. null: minValue
    highValue: null, // The right knob. null: maxValue
    minGap: 0, // The smallest distance between the two values
    showValueOnMove: 1, // 1: the bubble of the value over a knob that moves
    formatValue: null, // function (value) { return text; }: the text of its bubble
    enabled: 1,
    lowAriaLabel: "Minimum", // The names a screen reader says
    highAriaLabel: "Maximum",
    onChange: function (self) { }, // It moves: self.lowValue, self.highValue
    onChangeEnd: function (self) { }, // It was let go
    styleName: "round", // "round", "roundDark", "minimal", "minimalDark" or a name added to RangeSlider.styles
    style: { // The round style package (default)
        track: { height: 6, round: 3, color: Black(0.12), fillColor: "cadetblue" },
        knob: { size: 24, round: 12, color: "white", shadow: "0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.04)" },
        dragging: { ringSize: 6, ringOpacity: 0.2 }, // A ring in the fill color around a knob that is dragged
        value: { color: "#232323", textColor: "white", fontSize: 13, padding: [9, 5], round: 8, space: 10 }, // Its bubble
        disabled: { opacity: 0.4 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const RangeSlider = function (params = {}) {

    // Merge style package: params.style > RangeSlider.styles[styleName] > RangeSliderDefaults.style (round)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, RangeSlider.styles, RangeSliderDefaults);

    // Merge params:
    mergeIntoIfMissing(params, RangeSliderDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let press = null; // { knob, pointerId, startX, isFromFinger, isOnTrack, isChosen, hasMoved, grabSpace }: a press that goes on
    let lowKnob = null;
    let highKnob = null;
    let cancelHideValue = null;
    const TOUCH_SLOP = 6; // px: a smaller move of a finger is still a tap
    const PAGE_STEPS = 10; // PageUp / PageDown
    const VALUE_SHOW_TIME = 1000; // ms: the bubble stays this long after a key
    const FRONT_Z_INDEX = 2;
    const BACK_Z_INDEX = 1;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.lowValue, box.highValue, box.step...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, RangeSlider.styles, RangeSliderDefaults);
        mergeIntoIfMissing(fresh, RangeSliderDefaults);
        return fresh.style;
    };

    const getStep = function () {
        return (box.step > 0) ? box.step : 1;
    };

    // WHY: setMinValue() and setMaxValue() change it, and a range of 0 would divide by 0.
    const getRange = function () {
        const range = box.maxValue - box.minValue;
        return (range > 0) ? range : 1;
    };

    // A value on a step.
    const toStepValue = function (value) {
        const number = Number(value);
        const known = isFinite(number) ? number : box.minValue;
        const steps = Math.round((known - box.minValue) / getStep());
        return Number((box.minValue + steps * getStep()).toFixed(RangeSlider.decimalsOf(getStep())));
    };

    const inside = function (value, lowest, highest) {
        return Math.min(Math.max(value, lowest), highest);
    };

    // The value a knob can have, with the other one where it is.
    const lowestOf = function (knob) {
        return (knob === lowKnob) ? box.minValue : Math.min(box.lowValue + box.minGap, box.maxValue);
    };

    const highestOf = function (knob) {
        return (knob === lowKnob) ? Math.max(box.highValue - box.minGap, box.minValue) : box.maxValue;
    };

    const valueOf = function (knob) {
        return (knob === lowKnob) ? box.lowValue : box.highValue;
    };

    const textOf = function (value) {
        return (typeof box.formatValue === "function") ? String(box.formatValue(value)) : String(value);
    };

    const ratioOf = function (value) {
        return inside((value - box.minValue) / getRange(), 0, 1);
    };

    // PAINT: the places of the knobs and of the part between them.
    // WHY calc: a width of "100%" comes after the layout and changes with the page; this stays right with no measure.
    const paintPlaces = function () {
        const knobSize = _s.knob.size;
        const lowRatio = ratioOf(box.lowValue);
        const highRatio = ratioOf(box.highValue);
        lowKnob.css.left = "calc((100% - " + knobSize + "px) * " + lowRatio + ")";
        highKnob.css.left = "calc((100% - " + knobSize + "px) * " + highRatio + ")";
        box.fill.css.left = "calc(" + (knobSize / 2) + "px + (100% - " + knobSize + "px) * " + lowRatio + ")";
        box.fill.css.width = "calc((100% - " + knobSize + "px) * " + (highRatio - lowRatio) + ")";
    };

    // What a screen reader says, and the text of a bubble.
    const paintKnobValue = function (knob) {
        const value = valueOf(knob);
        knob.lblValue.plainText = textOf(value);
        knob.aria = {
            valuenow: String(value),
            valuetext: textOf(value),
            valuemin: String(lowestOf(knob)),
            valuemax: String(highestOf(knob)),
        };
    };

    const paintValues = function () {
        paintPlaces();
        paintKnobValue(lowKnob);
        paintKnobValue(highKnob);
    };

    const paintKnobLook = function (knob, isDragged) {
        const ring = (isDragged) ? ", 0 0 0 " + _s.dragging.ringSize + "px " + Alpha(_s.track.fillColor, _s.dragging.ringOpacity) : "";
        knob.boxShadow = _s.knob.shadow + ring;
    };

    const bringToFront = function (knob) {
        lowKnob.zIndex = (knob === lowKnob) ? FRONT_Z_INDEX : BACK_Z_INDEX;
        highKnob.zIndex = (knob === highKnob) ? FRONT_Z_INDEX : BACK_Z_INDEX;
    };

    const showValue = function (knob) {
        if (box.showValueOnMove != 1) return;
        if (cancelHideValue) cancelHideValue();
        cancelHideValue = null;
        lowKnob.lblValue.visible = (knob === lowKnob) ? 1 : 0;
        highKnob.lblValue.visible = (knob === highKnob) ? 1 : 0;
    };

    const hideValues = function () {
        lowKnob.lblValue.visible = 0;
        highKnob.lblValue.visible = 0;
    };

    const setKnobValue = function (knob, value) {
        const next = inside(toStepValue(value), lowestOf(knob), highestOf(knob));
        if (next === valueOf(knob)) return false;
        if (knob === lowKnob) box.lowValue = next;
        else box.highValue = next;
        paintValues();
        return true;
    };

    // The value under a point of the screen. WHY the sizes of the screen: a page can be fitted or scaled.
    const valueAtX = function (clientX) {
        const rect = box.elem.getBoundingClientRect();
        const knobWidth = lowKnob.elem.getBoundingClientRect().width;
        const usableWidth = rect.width - knobWidth;
        if (usableWidth <= 0) return box.lowValue;
        const ratio = (clientX - rect.left - knobWidth / 2) / usableWidth;
        return box.minValue + inside(ratio, 0, 1) * getRange();
    };

    const centerOf = function (knob) {
        const rect = knob.elem.getBoundingClientRect();
        return rect.left + rect.width / 2;
    };

    // The knob of a press on the bar. Two knobs at one place: the side of the press.
    const nearestKnob = function (clientX) {
        const toLow = Math.abs(clientX - centerOf(lowKnob));
        const toHigh = Math.abs(clientX - centerOf(highKnob));
        if (toLow !== toHigh) return (toLow < toHigh) ? lowKnob : highKnob;
        return (clientX < centerOf(lowKnob)) ? lowKnob : highKnob;
    };

    const knobOfTarget = function (target) {
        if (lowKnob.elem.contains(target)) return lowKnob;
        return highKnob.elem.contains(target) ? highKnob : null;
    };

    // A press holds a knob from here on.
    const holdKnob = function (knob) {
        press.knob = knob;
        press.isChosen = 1;
        bringToFront(knob);
        paintKnobLook(knob, 1);
        showValue(knob);
    };

    const moveHeldKnob = function (clientX) {
        const isChanged = setKnobValue(press.knob, valueAtX(clientX - press.grabSpace));
        if (!isChanged) return;
        press.hasMoved = 1;
        box.onChange(box);
    };

    // WHY: From two knobs at one place only the right one can go right: the first move tells which one is meant.
    const chooseKnobOfSamePlace = function (clientX) {
        const distance = clientX - press.startX;
        if (distance === 0) return;
        holdKnob((distance > 0) ? highKnob : lowKnob);
    };

    // The moves of a press come here also when the mouse leaves the box.
    // WHY try: the browser refuses a pointer that has just ended.
    const capturePointer = function (pointerId) {
        try {
            box.elem.setPointerCapture(pointerId);
        } catch (error) {
            console.warn("RangeSlider: " + error.message);
        }
    };

    const onPointerDown = function (self, event) {
        if (box.enabled != 1 || event.button !== 0 || press) return;
        const knob = knobOfTarget(event.target);
        const isFromFinger = (event.pointerType === "touch");
        press = { knob: knob, pointerId: event.pointerId, startX: event.clientX, isFromFinger: isFromFinger, isOnTrack: !knob, isChosen: 0, hasMoved: 0, grabSpace: 0 };
        capturePointer(event.pointerId);
        if (knob) {
            onPressOnKnob(knob, event);
            return;
        }
        // WHY: A finger on the bar may be the scroll of a page: nothing moves until its way is known.
        if (isFromFinger) return;
        holdKnob(nearestKnob(event.clientX));
        moveHeldKnob(event.clientX);
    };

    const onPressOnKnob = function (knob, event) {
        press.grabSpace = event.clientX - centerOf(knob); // WHY: A press beside its middle does not make it jump.
        const isSamePlace = (box.lowValue === box.highValue);
        if (!isSamePlace) holdKnob(knob);
    };

    const onPointerMove = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        if (press.isFromFinger && press.isOnTrack && !press.isChosen) {
            if (Math.abs(event.clientX - press.startX) < TOUCH_SLOP) return;
            holdKnob(nearestKnob(press.startX)); // WHY the start: the finger may be nearer to the other knob by now.
        }
        if (!press.isChosen) chooseKnobOfSamePlace(event.clientX);
        if (press.isChosen) moveHeldKnob(event.clientX);
    };

    const endPress = function () {
        const heldKnob = press.isChosen ? press.knob : null;
        press = null;
        hideValues();
        if (heldKnob) paintKnobLook(heldKnob, 0);
    };

    const onPointerUp = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        const isTap = (press.isFromFinger && press.isOnTrack && !press.isChosen);
        if (isTap) {
            holdKnob(nearestKnob(press.startX));
            moveHeldKnob(press.startX);
        }
        const hasMoved = press.hasMoved;
        endPress();
        if (hasMoved) box.onChangeEnd(box);
    };

    // WHY: The browser took the finger for the scroll of the page, or the system took it.
    const onPointerCancel = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        const hasMoved = press.hasMoved;
        endPress();
        if (hasMoved) box.onChangeEnd(box);
    };

    // The value a key asks for.
    const valueOfKey = function (knob, key) {
        const value = valueOf(knob);
        const keys = {
            ArrowRight: value + getStep(),
            ArrowUp: value + getStep(),
            ArrowLeft: value - getStep(),
            ArrowDown: value - getStep(),
            PageUp: value + getStep() * PAGE_STEPS,
            PageDown: value - getStep() * PAGE_STEPS,
            Home: lowestOf(knob),
            End: highestOf(knob),
        };
        return keys[key];
    };

    const onKnobKeyDown = function (knob, event) {
        if (box.enabled != 1) return;
        const value = valueOfKey(knob, event.key);
        if (value === undefined) return;
        event.preventDefault(); // WHY: The arrows and PageUp / PageDown would scroll the page too.
        if (!setKnobValue(knob, value)) return;
        bringToFront(knob);
        showValue(knob);
        cancelHideValue = box.after(VALUE_SHOW_TIME, hideValues);
        box.onChange(box);
        box.onChangeEnd(box);
    };

    const createKnob = function (ariaLabel) {
        // BOX: A knob. WHY a Box: it holds the bubble of its value.
        const knob = Box({ top: 0, shrink: 0, clipContent: 0, role: "slider", tabIndex: 0, cursor: "grab", clickable: 1 });
        knob.aria = { label: ariaLabel };
        knob.css.touchAction = "none"; // WHY: A finger on a knob always moves the knob.
            knob.lblValue = createIn(knob, function () {
                return Label({ visible: 0, css: { whiteSpace: "nowrap", left: "50%", transform: "translateX(-50%)", top: "auto", width: "max-content" } });
            });
        knob.on("keydown", function (self, event) { onKnobKeyDown(knob, event); });
        return knob;
    };

    const applyKnobLook = function (knob) {
        knob.props({ width: _s.knob.size, height: _s.knob.size, round: _s.knob.round, color: _s.knob.color });
        knob.css.top = "calc(50% - " + (_s.knob.size / 2) + "px)";
        knob.setFocusRing(_s.focus.ringColor);
        const value = _s.value;
        knob.lblValue.props({ fontSize: value.fontSize, color: value.color, textColor: value.textColor, round: value.round });
        knob.lblValue.css.padding = value.padding[1] + "px " + value.padding[0] + "px";
        knob.lblValue.css.bottom = (_s.knob.size + value.space) + "px";
        paintKnobLook(knob, 0);
    };

    const applyLook = function () {
        const track = _s.track;
        box.track.props({ height: track.height, round: track.round, color: track.color });
        box.track.css.top = "calc(50% - " + (track.height / 2) + "px)";
        box.track.css.left = "0";
        box.track.css.width = "100%";
        box.fill.props({ height: track.height, round: track.round, color: track.fillColor });
        box.fill.css.top = box.track.css.top;
        applyKnobLook(lowKnob);
        applyKnobLook(highKnob);
    };

    const paintEnabled = function () {
        const isEnabled = (box.enabled == 1);
        box.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        box.cursor = (isEnabled) ? "pointer" : "default";
        lowKnob.tabIndex = (isEnabled) ? 0 : -1;
        highKnob.tabIndex = (isEnabled) ? 0 : -1;
        lowKnob.aria = { disabled: (isEnabled) ? "false" : "true" };
        highKnob.aria = { disabled: (isEnabled) ? "false" : "true" };
    };

    // The values stay on a step, inside the range and apart.
    const keepValuesRight = function () {
        const low = inside(toStepValue(box.lowValue), box.minValue, box.maxValue);
        const high = inside(toStepValue(box.highValue), box.minValue, box.maxValue);
        box.lowValue = Math.min(low, high);
        box.highValue = Math.max(low, high);
        if (box.highValue - box.lowValue >= box.minGap) return;
        box.highValue = Math.min(box.lowValue + box.minGap, box.maxValue);
        box.lowValue = Math.max(box.highValue - box.minGap, box.minValue);
    };

    // *** PUBLIC FUNCTIONS:

    // onChange is not called.
    box.setValues = function (low, high) {
        box.lowValue = (low === null || low === undefined) ? box.lowValue : Number(low);
        box.highValue = (high === null || high === undefined) ? box.highValue : Number(high);
        keepValuesRight();
        paintValues();
    };
    // USAGE: slider.setValues(100, 500)

    box.getValues = function () {
        return [box.lowValue, box.highValue];
    };

    box.setMinValue = function (value) {
        box.minValue = Number(value);
        keepValuesRight();
        paintValues();
    };

    box.setMaxValue = function (value) {
        box.maxValue = Number(value);
        keepValuesRight();
        paintValues();
    };

    box.setStep = function (value) {
        box.step = Number(value);
        keepValuesRight();
        paintValues();
    };

    box.setMinGap = function (value) {
        box.minGap = Number(value);
        keepValuesRight();
        paintValues();
    };

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        paintEnabled();
    };
    // USAGE: get: slider.enabled, set: slider.setEnabled(0)

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
        paintEnabled();
    };
    // USAGE: slider.setTheme("roundDark")

    // *** OBJECT VIEW:

    box.clipContent = 0; // WHY: A bubble stands over the box.
    box.minValue = Number(box.minValue);
    box.maxValue = Number(box.maxValue);
    box.step = Number(box.step);
    box.minGap = Number(box.minGap);
    box.lowValue = (box.lowValue === null) ? box.minValue : Number(box.lowValue);
    box.highValue = (box.highValue === null) ? box.maxValue : Number(box.highValue);

    // BOX: The bar
    box.track = Box({ top: 0, left: 0 });
    // BOX: The part between the knobs
    box.fill = Box({ top: 0, left: 0 });
    lowKnob = createKnob(box.lowAriaLabel);
    highKnob = createKnob(box.highAriaLabel);
    box.lowKnob = lowKnob;
    box.highKnob = highKnob;

    // *** OBJECT INIT CODE:

    box.clickable = 1;
    box.css.touchAction = "pan-y"; // WHY: A finger that moves up or down on the bar scrolls the page; a move to the side is ours.
    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerUp);
    box.on("pointercancel", onPointerCancel);

    applyLook();
    keepValuesRight();
    paintValues();
    bringToFront(highKnob);
    paintEnabled();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The decimals of a step (0.5 -> 1), so 0.1 + 0.2 is written 0.3, not 0.30000000000000004.
RangeSlider.decimalsOf = function (step) {
    const text = String(step);
    const dot = text.indexOf(".");
    return (dot < 0) ? 0 : text.length - dot - 1;
};

// *** STYLE PACKAGES:
// USAGE: RangeSlider({ styleName: "roundDark" })
// USAGE: RangeSlider({ style: { track: { fillColor: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (round) style.
// USAGE: RangeSlider.styles.myStyle = { track: { fillColor: "tomato" } };
RangeSlider.styles = {

    // A thin bar and round white knobs, as Slider "round".
    round: RangeSliderDefaults.style,

    // For a dark page, as Slider "roundDark": the main cyan of the kit, a light bubble.
    roundDark: {
        track: { color: White(0.16), fillColor: "#5BBAC1" },
        knob: { shadow: "0 1px 3px rgba(0, 0, 0, 0.5)" },
        dragging: { ringOpacity: 0.3 },
        value: { color: "#F2F2F2", textColor: "#232323" },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};

// The minimal theme (_designs/minimal-theme.htm), as Slider "minimal": a 2 px track, the chosen part in ink, 12 px
// knobs in the ground of the window with a thin ink line, a small ink value bubble. minimalDark: on a dark window.
RangeSlider.createMinimalStyle = function (colors) {
    return {
        height: 24,
        style: {
            track: { height: 2, round: 1, color: colors.track, fillColor: colors.ink },
            knob: { size: 12, round: 6, color: colors.ground, shadow: "0 0 0 1px " + colors.ink },
            dragging: { ringSize: 0, ringOpacity: 0 },
            value: { color: colors.ink, textColor: colors.onInk, fontSize: 11, padding: [6, 2], round: 3, space: 6 },
            focus: { ringColor: colors.focus },
        },
    };
};
RangeSlider.MINIMAL_COLORS = { ground: "#FFFFFF", ink: "#1F1F1F", onInk: "#FFFFFF", track: Black(0.12), focus: "#3D8BD9" };
RangeSlider.styles.minimal = RangeSlider.createMinimalStyle(RangeSlider.MINIMAL_COLORS);
RangeSlider.MINIMAL_DARK_COLORS = { ground: "#1A1A19", ink: "#EDEDEB", onInk: "#1A1A19", track: White(0.14), focus: "#7FB6DE" };
RangeSlider.styles.minimalDark = RangeSlider.createMinimalStyle(RangeSlider.MINIMAL_DARK_COLORS);
