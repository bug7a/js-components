/* Bismillah */

/*

Slider - v26.11

UI COMPONENT TEMPLATE
- NEW PROJECTS: a page or a project that needs a slider uses this component with styleName
  "round" (02-comp-examples/slider.htm), unless the user asks for another look. "split" stays the default
  of the file, for the pages made before. On a dark page: "roundDark". SliderField (comp/slider-field.js, a
  slider in the shape of a field) is a parallel design: only when a page asks for that shape.
- A value from minValue to maxValue (0 - 100 by default) on a step (1), chosen by dragging the thumb. The value
  bubble over the thumb shows the value while it is dragged (showValueOnDrag) and for a while after setValue()
  (showValueOnSet). (minValue, maxValue, step, setMinValue(), setMaxValue(), setStep().)
- A press on the track: the mouse moves the thumb there and drags from there. A finger: a move to the
  side drags from there, a tap moves the thumb there, a move up or down scrolls the page (touch-action: pan-y).
- The keyboard: ArrowRight / ArrowUp one step, ArrowLeft / ArrowDown one step back, PageUp / PageDown
  ten steps, Home / End the ends. role "slider" with aria-valuenow / valuemin / valuemax (ariaLabel: its name);
  a ring around the thumb only for the keyboard (style.focus).
- A key, a tap and a click on the track are short drags for the page: onChangeStart(self), onChange(self),
  onChangeEnd(self), so a page that saves in onChangeEnd saves them too.
- Style packages: "split" (the default: inspired by Google Material 3: a thick track split in two at the
  thumb, a thin line for the thumb, a dot at the end), "splitDark" (split for a dark page), "round" (a thin track and
  a round white knob: the look of most web and phone sliders; a ring in the track color while it is dragged) and
  "roundDark" (round for a dark page).
  Select with styleName. (Slider.styles)
  The colors and the height of the track stay params (trackColor, trackHeight...): a package fills the ones the
  page does not give, so Slider({ styleName: "round", trackColor: "tomato" }) is a tomato round slider.
- Needs basic.js v26.10.27 (a package of params).

USAGE:
const volume = Slider({ width: 280, value: 70, onChange: function (self) { println(self.value); } });
volume.setValue(40);
Slider({ styleName: "round", width: "100%", value: 30 });
Slider({ styleName: "round", minValue: 12, maxValue: 24, step: 0.5, value: 16 }); // 12, 12.5 ... 24

Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const SliderDefaults = {
    key: 0,
    width: 250,

    value: 0, // Current selected value
    minValue: 0, // The value at the left end (setMinValue)
    maxValue: 100, // The value at the right end (setMaxValue)
    step: 1, // The values are min + n * step (Ex: 0.5). setStep()
    
    minThumbHeight: 44,
    thumbColor: "rgba(0,0,0,0.7)", // Color of the draggable button
    
    trackHeight: 16, // Ex: 16, 50
    trackColor: "cadetblue", // Color of the filled part
    trackBackgroundColor: "rgba(0,0,0,0.05)", // Color of the unfilled part

    onChangeStart: function(self) {}, // A drag starts (a tap and a key are short drags)
    onChange: function(self) {}, // self.value changed: while dragging, a tap, a key. Not at create time, not by setValue()
    onChangeEnd: function(self) {}, // The drag ends: a page that saves, saves here

    showValueAtStart: 0,
    showValueOnSet: 1,
    showValueOnDrag: 1,

    ariaLabel: "", // The name a screen reader says (Ex: "Volume"). "": none

    styleName: "split", // "split", "splitDark", "round", "roundDark", "minimal", "minimalDark" or a name added to Slider.styles
    style: { // The split style package (default): inspired by Material 3
        thumb: { // The part that is dragged: a line (split) or a knob (round)
            areaWidth: 20, // px: the part that takes the mouse and the finger (the thumb is in its middle)
            width: 4,
            height: 0, // 0: as high as the slider
            round: 2,
            boxShadow: "", // "": none
        },
        dragging: { // The thumb while it is dragged ("": as it is)
            width: 2, // the line gets thinner
            trackSpace: 3, // the tracks come closer
            ringSize: 0, // px: a ring in the track color around the thumb (0: none)
            ringOpacity: 0.2,
        },
        track: {
            space: 6, // px between the thumb and the tracks (negative: the tracks go under the thumb)
            outerRound: 16, // the ends of the slider
            innerRound: 4, // the ends at the thumb
        },
        trackDot: { // The dot at the end of the empty track (size 0: none)
            size: 4,
            right: 4,
        },
        value: { // The bubble of the value over the thumb
            color: "rgba(0,0,0,0.9)",
            textColor: "white",
            fontSize: 14,
            padding: [11, 9],
            round: 16,
            space: 6, // px between the bubble and the thumb
        },
        focus: { // The ring around the thumb when the slider has the focus of the keyboard
            ringColor: "", // "": the track color
            ringWidth: 2,
            ringSpace: 2, // px between the thumb and the ring
        },
    },

};

const Slider = function(params = {}) {

    // Merge style package: params.style > Slider.styles[styleName] > SliderDefaults.style (split)
    basic.applyStylePackage(params, Slider.styles, SliderDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SliderDefaults);

    // BOX: Component container
    const box = startObject(params);

    const _s = box.style;
    // WHY: A value from a page can be a text ("12"): "12" + 1 * 0.5 would be "120.5".
    box.minValue = Number(box.minValue);
    box.maxValue = Number(box.maxValue);
    box.step = Number(box.step);
    const thumbHeight = (box.minThumbHeight > box.trackHeight) ? box.minThumbHeight : box.trackHeight;
    box.height = thumbHeight;
    box.clipContent = 0;

    // *** PRIVATE VARIABLES:
    let isDragging = false;
    let isKeyboardFocus = 0; // The ring of the focus shows only for the keyboard
    let isTrackClick = false; // A mouse press on the track that has not moved yet (its value stays shown after it)
    let pendingTouch = null; // { x, y } of a finger on the track, until its direction is known

    let startX = 0;
    let startLeft = 0;
    let dragScale = 1; // Screen px of one px of the slider, measured when a drag starts (getScreenScale)
    let cancelHideValue = null; // the timer of showValue() (box.after)

    const VALUE_SHOW_DURATION = 1200; // ms: the value bubble is hidden after it (showValue)
    const TOUCH_SLOP = 6; // px: a smaller move of a finger is still a tap
    const PAGE_STEPS = 10; // PageUp / PageDown
    const FOCUS_RING_OPACITY = 0.8; // of the track color (style.focus.ringColor "")

    let trackSpace = _s.track.space;
    let isFirstRun = 1;

    // *** PRIVATE FUNCTIONS:

    // Maximum left position of the thumb (px).
    // WHY: Read every time: with width: "100%" the real width comes after the layout and changes with the page.
    //      (A value read at create time let the thumb be dragged out of the slider.)
    const getMaxLeft = function() {
        const max = box.width - thumbBox.width;
        return (max > 0) ? max : 0;
    };

    // WHY: Read every time: setMinValue() / setMaxValue() change the range. (A range of 0 would divide by 0.)
    const getValueRange = function() {
        const range = box.maxValue - box.minValue;
        return (range > 0) ? range : 1;
    };

    // The number of decimals of the step (0.5 -> 1), so 0.1 + 0.2 is written 0.3, not 0.30000000000000004
    const getStepDecimals = function() {
        const text = String(box.step);
        const dot = text.indexOf(".");
        return (dot < 0) ? 0 : text.length - dot - 1;
    };

    const getStep = function() {
        return (box.step > 0) ? box.step : 1;
    };

    // A value inside the range, on a step.
    const toStepValue = function(value) {
        value = Number(value);
        if (!isFinite(value)) value = box.minValue;
        const step = getStep();
        const steps = Math.round((value - box.minValue) / step);
        let stepValue = Number((box.minValue + steps * step).toFixed(getStepDecimals()));
        if (stepValue < box.minValue) stepValue = box.minValue;
        if (stepValue > box.maxValue) stepValue = box.maxValue;
        return stepValue;
    };

    const getLeftOfValue = function(value) {
        return (value - box.minValue) * (getMaxLeft() / getValueRange());
    };

    // How many screen px is one px of the slider? (page.fit() zooms the page, a parent can have a scale)
    // WHY: The mouse moves in screen px: on a page zoomed to 2 the thumb went twice as far as the mouse.
    const getScreenScale = function() {
        if (box.elem.offsetWidth <= 0) return 1;
        return (box.elem.getBoundingClientRect().width / box.elem.offsetWidth) || 1;
    };

    // The value under a point of the screen: the middle of the thumb goes there.
    const getValueAtClientX = function(clientX) {
        const maxLeft = getMaxLeft();
        if (maxLeft <= 0) return box.value;
        const pointLeft = (clientX - box.elem.getBoundingClientRect().left) / getScreenScale();
        const thumbLeft = Math.min(Math.max(pointLeft - thumbBox.width / 2, 0), maxLeft);
        return toStepValue((thumbLeft / maxLeft) * getValueRange() + box.minValue);
    };

    // The value, its text in the bubble and for a screen reader. (Only this function writes them.)
    const writeValue = function(value) {
        box.value = value;
        valueBox.text = value;
        box.aria = {
            valuenow: String(value),
            valuemin: String(box.minValue),
            valuemax: String(box.maxValue),
        };
    };

    const updateTrack = function(animated = 0) {
        if (animated == 0) trackBox.dontMotion();
        trackBox.width = thumbBox.left + thumbLineBox.left - trackSpace;
        if (animated == 0) emptyTrackBox.dontMotion();
        emptyTrackBox.width = box.width - (thumbBox.left + thumbBox.width) + thumbLineBox.left - trackSpace;
    };

    // The value bubble over the thumb: it grows out of the thumb and shrinks back into it.
    const showValueBubble = function() {
        valueBox.css.transform = "translateY(0px) scale(1)";
        valueBox.opacity = 1;
    };

    const hideValueBubble = function() {
        valueBox.css.transform = "translateY(25px) scale(0.1)";
        valueBox.opacity = 0;
    };

    // WHY "- thumbLineBox.top": the space is over the thumb you see (a knob is lower than the top of its area).
    const placeValueBubble = function() {
        valueBox.aline(thumbBox, "top", _s.value.space - thumbLineBox.top, "center");
    };

    const updateThumbPosition = function(newLeft, animated = 0) {
        const maxLeft = getMaxLeft();
        if (newLeft < 0 || !isFinite(newLeft)) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        // WHY round: parseInt cut the fraction of the position, so setValue(50) gave 49 (46 of 101 values were one less)
        // WHY only with a width: a slider not drawn yet (a closed tab, a hidden group: width 0) has no position to read;
        //     its value became the minimum, and a settings page saved 0
        let value = box.value;
        if (maxLeft > 0) {
            value = toStepValue(((newLeft / maxLeft) * getValueRange()) + box.minValue);
            newLeft = getLeftOfValue(value); // WHY: the thumb stands on its step (a step of 1 on 0 - 10 is 30 px)
        }
        if (animated == 0) thumbBox.dontMotion();
        thumbBox.left = newLeft;
        updateTrack(animated);
        if (animated == 0) valueBox.dontMotion();
        writeValue(value);
        placeValueBubble();
    };

    // The thumb on a value (setValue, a key, a press on the track, a resize, a new range).
    // WHY writeValue after: updateThumbPosition() reads the value back from the position (0 while it is hidden).
    const moveThumbToValue = function(value, animated) {
        showHideTracks(value, animated);
        updateThumbPosition(getLeftOfValue(value), animated);
        writeValue(value);
    };

    // The look of the thumb and of the tracks: style.thumb and style.track, or style.dragging while it is dragged.
    const getThumbWidth = function($isDragging) {
        if ($isDragging && _s.dragging.width !== "") return _s.dragging.width;
        return _s.thumb.width;
    };

    const getTrackSpace = function($isDragging) {
        if ($isDragging && _s.dragging.trackSpace !== "") return _s.dragging.trackSpace;
        return _s.track.space;
    };

    // Its own shadow, and the ring in the track color while it is dragged ("": no shadow)
    const getThumbShadow = function($isDragging) {
        const shadows = [];
        if (_s.thumb.boxShadow) shadows.push(_s.thumb.boxShadow);
        if ($isDragging && _s.dragging.ringSize) {
            const ringColor = Alpha(box.trackColor, _s.dragging.ringOpacity);
            shadows.push("0 0 0 " + _s.dragging.ringSize + "px " + ringColor);
        }
        return shadows.join(", ");
    };

    // While dragging: the look of style.dragging (split: a thinner thumb line, closer tracks) and the value bubble (showValueOnDrag).
    // $isValueKept: at the end, the bubble stays for a while (a click on the track: it was there only for a moment).
    const setIsDragging = function($isDragging, $isValueKept = false) {
        isDragging = $isDragging;
        trackSpace = getTrackSpace(isDragging);
        // NOTE: withMotion() runs later: the callback reads the values of this call ($isDragging, $isValueKept).
        thumbLineBox.withMotion(function(){
            thumbLineBox.width = getThumbWidth($isDragging);
            thumbLineBox.boxShadow = getThumbShadow($isDragging);
            thumbLineBox.center("left");
            updateTrack(1);
            box.showValueClean();
            if (!$isDragging && $isValueKept) {
                box.showValue();
                return;
            }
            if (!$isDragging) {
                hideValueBubble();
                return;
            }
            if (box.showValueOnDrag) showValueBubble();
        });
    };

    // The ring around the thumb, only for the keyboard (style.focus).
    const paintFocus = function() {
        const ringColor = _s.focus.ringColor || Alpha(box.trackColor, FOCUS_RING_OPACITY);
        thumbLineBox.css.outline = (isKeyboardFocus) ? _s.focus.ringWidth + "px solid " + ringColor : "";
        thumbLineBox.css.outlineOffset = _s.focus.ringSpace + "px";
    };

    // WHY try: matches() throws in an old browser that does not know :focus-visible.
    const isFocusOfKeyboard = function() {
        try {
            return box.elem.matches(":focus-visible") ? 1 : 0;
        } catch (error) {
            return 0;
        }
    };

    const showHideTracks = function($currentLeft, animated) {
        if (animated == 0) {
            trackBox.dontMotion();
            emptyTrackBox.dontMotion();
        }
        trackBox.opacity = ($currentLeft <= box.minValue) ? 0 : 1;
        emptyTrackBox.opacity = ($currentLeft >= box.maxValue) ? 0 : 1;
    }

    // *** PUBLIC FUNCTIONS:
    box.setValue = function(val) {

        moveThumbToValue(toStepValue(val), 1); // WHY: the value is the truth, not the position (width 0 while hidden)

        if (isFirstRun) {
            isFirstRun = 0;
            if (box.showValueAtStart && box.showValueOnSet) box.showValue();
            return;
        }
        if (box.showValueOnSet) box.showValue();

    };
    // Sets the current slider value and updates UI

    box.getValue = function() {
        return box.value;
    };
    // Returns the current slider value

    // Shows the value bubble for a while.
    box.showValue = function() {
        box.showValueClean();
        showValueBubble();
        cancelHideValue = box.after(VALUE_SHOW_DURATION, hideValueBubble);
    };

    // Stops the timer of showValue() (the bubble is not hidden by it).
    box.showValueClean = function() {
        if (cancelHideValue) cancelHideValue();
        cancelHideValue = null;
    }

    // The value is put inside the new range and on a step; the thumb moves to it without the bubble.
    const applyRange = function() {
        moveThumbToValue(toStepValue(box.value), 0);
    };

    // The value at the left end. USAGE: slider.setMinValue(12)
    box.setMinValue = function(val) {
        box.minValue = Number(val);
        applyRange();
    };

    // The value at the right end. USAGE: slider.setMaxValue(24)
    box.setMaxValue = function(val) {
        box.maxValue = Number(val);
        applyRange();
    };

    // The values are min + n * step. USAGE: slider.setStep(0.5)
    box.setStep = function(val) {
        box.step = Number(val);
        applyRange();
    };

    // Sets the color of the filled portion of the slider
    box.setTrackColor = function(color) {
        box.trackColor = color;
        trackBox.color = color;
        trackDot.color = color;
    };

    // Sets the color of the unfilled portion of the slider
    box.setTrackBackgroundColor = function(color) {
        box.trackBackgroundColor = color;
        emptyTrackBox.color = color;
    };

    // Sets the color of the draggable thumb
    box.setThumbColor = function(color) {
        box.thumbColor = color;
        thumbLineBox.color = color;
    };

    // *** OBJECT VIEW:

        // BOX: Track
        const trackBox = Box({
            height: box.trackHeight,
            width: 0,
            left: 0,
            top: 0,
            color: box.trackColor,
            borderColor: "rgba(0, 0, 0, 0.4)",
        });
        that.css = {
            borderTopRightRadius: _s.track.innerRound + "px",
            borderTopLeftRadius: _s.track.outerRound + "px",
            borderBottomRightRadius: _s.track.innerRound + "px",
            borderBottomLeftRadius: _s.track.outerRound + "px",
        };
        that.setMotion("width 0.2s, opacity 0.2s");
        that.center("top");

        // BOX: Empty track
        const emptyTrackBox = Box({
            height: box.trackHeight,
            width: 0,
            right: 0,
            top: 0,
            color: box.trackBackgroundColor,
        });
        that.css = {
            borderTopRightRadius: _s.track.outerRound + "px",
            borderTopLeftRadius: _s.track.innerRound + "px",
            borderBottomRightRadius: _s.track.outerRound + "px",
            borderBottomLeftRadius: _s.track.innerRound + "px",
        };
        that.setMotion("width 0.2s, opacity 0.2s");
        that.center("top");

        // BOX: Track dot
        const trackDot = Box({
            color: box.trackColor,
            width: _s.trackDot.size,
            height: _s.trackDot.size,
            round: _s.trackDot.size,
        });
        emptyTrackBox.add(that);
        that.center("top");
        that.right = _s.trackDot.right;

        // BOX: Thumb (the draggable part)
        const thumbBox = startBox({
            width: _s.thumb.areaWidth,
            height: thumbHeight,
            top: 0,
            left: 0,
            color: "transparent",
            clickable: 1,
            clipContent: 0, // WHY: the ring of a dragged knob (style.dragging.ringSize) is wider than the thumb
        });
        that.cursor = "pointer";
        that.setMotion("left 0.2s");

            // BOX: Thumb line (split) or knob (round)
            const thumbLineBox = Box({
                top: 0,
                width: _s.thumb.width,
                height: _s.thumb.height || thumbHeight,
                color: box.thumbColor,
                round: _s.thumb.round,
                borderColor: "rgba(0, 0, 0, 0.4)",
                boxShadow: getThumbShadow(false),
            });
            that.setMotion("width 0.2s, left 0.2s, box-shadow 0.2s");
            that.center("left");
            that.center("top");

        endBox();

        // LABEL: Value
        const valueBox = Label({
            text: "67",
            color: _s.value.color,
            textColor: _s.value.textColor,
            fontSize: _s.value.fontSize,
            padding: _s.value.padding,
            round: _s.value.round,
        });
        placeValueBubble();
        hideValueBubble();
        valueBox.setMotion("transform 0.2s, opacity 0.2s, left 0.2s");

    // *** OBJECT INIT CODE:

    // Mouse Events
    // WHY: "e.clientX || e.touches[0]" threw at the left edge of the screen: clientX 0 is falsy, a mouse event has no touches.
    const getClientX = (e) => (e.touches && e.touches.length) ? e.touches[0].clientX : e.clientX;
    const getClientY = (e) => (e.touches && e.touches.length) ? e.touches[0].clientY : e.clientY;

    // The removers of the document events of a drag (box.listenTo: remove() cleans them too)
    let dragEventRemovers = [];

    const removeDragEvents = () => {
        dragEventRemovers.forEach((removeEvent) => removeEvent());
        dragEventRemovers = [];
    };

    const startDrag = (clientX) => {
        setIsDragging(true);
        startX = clientX;
        startLeft = parseFloat(thumbBox.left) || 0; // (not parseInt: a click on the thumb moved it a part of a pixel)
        dragScale = getScreenScale();

        removeDragEvents(); // WHY: a second touch before the end of a drag must not add the events twice
        dragEventRemovers = [
            box.listenTo(document, "mousemove", onMouseMove),
            box.listenTo(document, "mouseup", onMouseUp),
            box.listenTo(document, "touchmove", onMouseMove, { passive: false }),
            box.listenTo(document, "touchend", onMouseUp),
            // WHY: The system can take a touch (a call, a gesture of the screen): its touchend never comes, and the
            //      next touch anywhere on the page moved the thumb and could not scroll the page.
            box.listenTo(document, "touchcancel", onMouseUp),
        ];
        box.onChangeStart(box);
    };

    // The thumb goes to a point of the track; the page hears it when the value changes (onChange).
    const moveThumbToPoint = (clientX, animated) => {
        const value = getValueAtClientX(clientX);
        if (value === box.value) return;
        moveThumbToValue(value, animated);
        box.onChange(box);
    };

    // A press on the thumb starts a drag. A press of the mouse on the track moves the thumb there and drags from there.
    const onPress = (self, e) => {
        // WHY: Only the main button: the right one (its menu) started a drag too.
        const isOtherButton = (e.type === "mousedown" && e.button !== 0);
        if (isOtherButton) return;
        isKeyboardFocus = 0;
        paintFocus();
        const isOnThumb = thumbBox.elem.contains(e.target);
        if (!isOnThumb && e.type === "touchstart") {
            waitForTouchDirection(e);
            return;
        }
        // WHY: After a touch the browser sends mousedown and mouseup too: a tap gave two onChangeStart and two onChangeEnd.
        if (e.type === "touchstart") e.preventDefault();
        if (isOnThumb) {
            startDrag(getClientX(e));
            return;
        }
        isTrackClick = true;
        startDrag(getClientX(e));
        moveThumbToPoint(getClientX(e), 1);
        startLeft = parseFloat(thumbBox.left) || 0; // the drag goes on from the new place
    };

    // A finger on the track: a move to the side drags from there, a lift is a tap there, a move up or down is the
    // scroll of the page. WHY: a finger that scrolls a page of sliders must not change their values.
    const waitForTouchDirection = (e) => {
        pendingTouch = { x: getClientX(e), y: getClientY(e) };
        removeDragEvents();
        dragEventRemovers = [
            box.listenTo(document, "touchmove", onPendingTouchMove, { passive: false }),
            box.listenTo(document, "touchend", onPendingTouchEnd),
            box.listenTo(document, "touchcancel", cancelPendingTouch),
        ];
    };

    const cancelPendingTouch = () => {
        pendingTouch = null;
        removeDragEvents();
    };

    const onPendingTouchMove = (self, e) => {
        const dx = getClientX(e) - pendingTouch.x;
        const dy = getClientY(e) - pendingTouch.y;
        const isSmallMove = (Math.abs(dx) < TOUCH_SLOP && Math.abs(dy) < TOUCH_SLOP);
        if (isSmallMove) return;
        if (Math.abs(dy) >= Math.abs(dx)) {
            cancelPendingTouch(); // the page scrolls
            return;
        }
        e.preventDefault();
        pendingTouch = null;
        startDrag(getClientX(e));
        moveThumbToPoint(getClientX(e), 0);
        startLeft = parseFloat(thumbBox.left) || 0;
    };

    // A tap on the track: a short drag for the page (onChangeStart, onChange, onChangeEnd).
    const onPendingTouchEnd = (self, e) => {
        e.preventDefault(); // WHY: the mousedown and mouseup of the browser after a tap would be a second press
        const tapX = pendingTouch.x;
        cancelPendingTouch();
        box.onChangeStart(box);
        moveThumbToPoint(tapX, 1);
        box.onChangeEnd(box);
        if (box.showValueOnDrag) box.showValue();
    };

    const onMouseMove = (self, e) => {
        if (!isDragging) return;
        e.preventDefault();
        isTrackClick = false;
        const clientX = getClientX(e);
        const maxLeft = getMaxLeft();
        let dx = (clientX - startX) / dragScale;
        let newLeft = startLeft + dx;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;

        updateThumbPosition(newLeft);
        showHideTracks(box.value, 0);
        box.onChange(box);
    };

    const onMouseUp = () => {
        removeDragEvents();
        setIsDragging(false, isTrackClick && box.showValueOnDrag);
        isTrackClick = false;
        box.onChangeEnd(box);
    };

    // The keys that change the value (a key is a short drag for the page: onChangeStart, onChange, onChangeEnd).
    const keyValues = {
        ArrowRight: () => box.value + getStep(),
        ArrowUp: () => box.value + getStep(),
        ArrowLeft: () => box.value - getStep(),
        ArrowDown: () => box.value - getStep(),
        PageUp: () => box.value + getStep() * PAGE_STEPS,
        PageDown: () => box.value - getStep() * PAGE_STEPS,
        Home: () => box.minValue,
        End: () => box.maxValue,
    };

    const onKeyDown = (self, e) => {
        if (!Object.prototype.hasOwnProperty.call(keyValues, e.key)) return;
        e.preventDefault(); // WHY: the arrows and PageUp / PageDown scrolled the page too
        isKeyboardFocus = 1;
        paintFocus();
        const value = toStepValue(keyValues[e.key]());
        if (value === box.value) return;
        box.onChangeStart(box);
        moveThumbToValue(value, 1);
        if (box.showValueOnDrag) box.showValue();
        box.onChange(box);
        box.onChangeEnd(box);
    };

    const onFocus = () => {
        isKeyboardFocus = isFocusOfKeyboard();
        paintFocus();
    };

    const onBlur = () => {
        isKeyboardFocus = 0;
        paintFocus();
    };

    box.role = "slider";
    box.tabIndex = 0;
    box.aria = { label: box.ariaLabel };
    box.cursor = "pointer";
    // WHY pan-y: a finger that moves up or down on the slider scrolls the page; a move to the side is ours.
    // WHY outline none: the ring of the focus is around the thumb (paintFocus), not around the whole slider.
    box.css = { touchAction: "pan-y", outline: "none" };

    box.on("mousedown", onPress);
    box.on("touchstart", onPress, { passive: false });
    box.on("keydown", onKeyDown);
    box.on("focus", onFocus);
    box.on("blur", onBlur);

    // WHY: With width: "100%" the slider gets its real width after the layout, and it changes with
    //      the page. The thumb must stay on its value. (No animation and no value bubble here.)
    box.onResize(function() {
        if (isDragging) return;
        moveThumbToValue(box.value, 0);
    });

    box.setValue(box.value);

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: Slider({ styleName: "round" })
// USAGE: Slider({ styleName: "round", trackColor: "tomato" }) // The colors and the height of the track are params.
// USAGE: Slider({ styleName: "round", style: { value: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (split) style.
// USAGE: Slider.styles.myStyle = { trackColor: "tomato", style: { trackDot: { size: 0 } } };
Slider.styles = {

    // Inspired by Google Material 3: a thick track in two parts with a space at the thumb, a thin line for the
    // thumb (thinner while it is dragged), a dot at the end of the empty track.
    split: SliderDefaults.style,

    // The split look for a dark page: a light empty track, the main cyan of the kit, a light thumb line and a light
    // value bubble with a dark text (a dark bubble was lost on the page).
    splitDark: {
        trackColor: "#5BBAC1",
        trackBackgroundColor: White(0.12),
        thumbColor: White(0.85),
        style: {
            value: {
                color: "#F2F2F2",
                textColor: "#232323",
            },
        },
    },

    // The look of most web and phone sliders: a thin round track, a round white knob with a soft
    // shadow, a ring in the track color while it is dragged, a small value bubble. A package of params: the colors
    // and the height of the track are params, a page can give its own.
    round: {
        trackHeight: 6,
        trackBackgroundColor: "rgba(0, 0, 0, 0.12)",
        thumbColor: "white",
        style: {
            thumb: {
                areaWidth: 24, // as wide as the knob: the knob goes to the ends of the track
                width: 24,
                height: 24,
                round: 12,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            },
            dragging: {
                width: "",
                trackSpace: "",
                ringSize: 6,
                ringOpacity: 0.2,
            },
            track: {
                space: -12, // the tracks meet under the middle of the knob
                outerRound: 3,
                innerRound: 3,
            },
            trackDot: {
                size: 0,
            },
            value: {
                color: "#232323",
                fontSize: 13,
                padding: [9, 5],
                round: 8,
                space: 10, // (over the ring of the drag)
            },
        },
    },

    // The round look for a dark page: a light empty track, the main cyan of the kit, a stronger ring
    // and a light value bubble with a dark text (a dark bubble was lost on the page).
    roundDark: {
        trackHeight: 6,
        trackColor: "#5BBAC1",
        trackBackgroundColor: White(0.16),
        thumbColor: "white",
        style: {
            thumb: {
                areaWidth: 24,
                width: 24,
                height: 24,
                round: 12,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
            },
            dragging: {
                width: "",
                trackSpace: "",
                ringSize: 6,
                ringOpacity: 0.3,
            },
            track: {
                space: -12,
                outerRound: 3,
                innerRound: 3,
            },
            trackDot: {
                size: 0,
            },
            value: {
                color: "#F2F2F2",
                textColor: "#232323",
                fontSize: 13,
                padding: [9, 5],
                round: 8,
                space: 10,
            },
        },
    },

};

// The minimal theme (_designs/minimal-theme.htm): a 2 px track, the chosen part in ink, a 12 px knob in the ground of
// the window with a thin ink line around it (a line, not a shadow), a small ink value bubble, a blue focus ring.
Slider.createMinimalStyle = function (colors) {
    return {
        minThumbHeight: 20,
        trackHeight: 2,
        trackColor: colors.ink,
        trackBackgroundColor: colors.track,
        thumbColor: colors.ground,
        style: {
            thumb: { areaWidth: 12, width: 12, height: 12, round: 6, boxShadow: "0 0 0 1px " + colors.ink },
            dragging: { width: "", trackSpace: "", ringSize: 0, ringOpacity: 0 },
            track: { space: -6, outerRound: 1, innerRound: 1 },
            trackDot: { size: 0 },
            value: { color: colors.ink, textColor: colors.onInk, fontSize: 11, padding: [6, 2], round: 3, space: 6 },
            focus: { ringColor: colors.focus, ringWidth: 2, ringSpace: 2 },
        },
    };
};
Slider.MINIMAL_COLORS = { ground: "#FFFFFF", ink: "#1F1F1F", onInk: "#FFFFFF", track: Black(0.12), focus: "#3D8BD9" };
Slider.styles.minimal = Slider.createMinimalStyle(Slider.MINIMAL_COLORS);
Slider.MINIMAL_DARK_COLORS = { ground: "#1A1A19", ink: "#EDEDEB", onInk: "#1A1A19", track: White(0.14), focus: "#7FB6DE" };
Slider.styles.minimalDark = Slider.createMinimalStyle(Slider.MINIMAL_DARK_COLORS);
