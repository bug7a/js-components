/* Bismillah */

/*

Slider - v26.11

UI COMPONENT TEMPLATE
- NEW PROJECTS (the user, 2026-11-06): a page or a project that needs a slider uses this component with styleName
  "round" (02-comp-examples/slider-round.htm), unless the user asks for another look. "classic" stays the default
  of the file, for the pages made before. No dark package yet: on a dark page give trackBackgroundColor a light
  color (Ex: White(0.15)). The value is 0 - 100: a page maps its own range. SliderField (comp/slider-field.js, a
  slider in the shape of a field) is a parallel design: only when a page asks for that shape.
- A value from 0 to 100, chosen by dragging the thumb. The value bubble over the thumb shows the value while it is
  dragged (showValueOnDrag) and for a while after setValue() (showValueOnSet).
- Style packages (2026-11-06): "classic" (the default: inspired by Google Material 3: a thick track in two parts,
  a thin line for the thumb, a dot at the end) and "round" (a thin track and a round white knob: the look of most
  web and phone sliders; a ring in the track color while it is dragged). Select with styleName. (Slider.styles)
  The colors and the height of the track stay params (trackColor, trackHeight...): a package fills the ones the
  page does not give, so Slider({ styleName: "round", trackColor: "tomato" }) is a tomato round slider.
- Needs basic.js v26.10.27 (a package of params).

USAGE:
const volume = Slider({ width: 280, currentValue: 70, onDragMove: function (value) { println(value); } });
volume.setValue(40);
Slider({ styleName: "round", width: "100%", currentValue: 30 });

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const SliderDefaults = {
    key: 0,
    width: 250,

    currentValue: 0, // Current selected value
    
    minThumbHeight: 44,
    thumbColor: "rgba(0,0,0,0.7)", // Color of the draggable button
    
    trackHeight: 16, // Ex: 16, 50
    trackColor: "cadetblue", // Color of the filled part
    trackBackgroundColor: "rgba(0,0,0,0.05)", // Color of the unfilled part

    onDragStart: function() {}, // Triggered when dragging starts
    onDragMove: function(val) {}, // Triggered while dragging
    onDragEnd: function() {}, // Triggered when dragging ends

    showValueAtStart: 0,
    showValueOnSet: 1,
    showValueOnDrag: 1,

    styleName: "classic", // "classic", "round" or a name added to Slider.styles
    style: { // Classic style package (default): inspired by Material 3
        thumb: { // The part that is dragged: a line (classic) or a knob (round)
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
    },

};

const Slider = function(params = {}) {

    // Merge style package: params.style > Slider.styles[styleName] > SliderDefaults.style (classic)
    basic.applyStylePackage(params, Slider.styles, SliderDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SliderDefaults);

    // BOX: Component container
    const box = startObject(params);

    const _s = box.style;
    const thumbHeight = (box.minThumbHeight > box.trackHeight) ? box.minThumbHeight : box.trackHeight;
    box.height = thumbHeight;
    box.clipContent = 0;

    // *** PRIVATE VARIABLES:
    let isDragging = false;

    const minValue = 0; // Minimum slider value
    const maxValue = 100; // Maximum slider value
    const valueRange = maxValue - minValue;

    let startX = 0;
    let startLeft = 0;
    let dragScale = 1; // Screen px of one px of the slider, measured when a drag starts (getScreenScale)
    let cancelHideValue = null; // the timer of showValue() (box.after)

    const VALUE_SHOW_DURATION = 1200; // ms: the value bubble is hidden after it (showValue)

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

    // How many screen px is one px of the slider? (page.fit() zooms the page, a parent can have a scale)
    // WHY: The mouse moves in screen px: on a page zoomed to 2 the thumb went twice as far as the mouse.
    const getScreenScale = function() {
        if (box.elem.offsetWidth <= 0) return 1;
        return (box.elem.getBoundingClientRect().width / box.elem.offsetWidth) || 1;
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
        if (animated == 0) thumbBox.dontMotion();
        thumbBox.left = newLeft;
        updateTrack(animated);
        // WHY round: parseInt cut the fraction of the position, so setValue(50) gave 49 (46 of 101 values were one less)
        // WHY only with a width: a slider not drawn yet (a closed tab, a hidden group: width 0) has no position to read;
        //     its value became the minimum, and a settings page saved 0 (2026-11-05)
        if (maxLeft > 0) box.currentValue = Math.round(((newLeft / maxLeft) * valueRange) + minValue);
        if (animated == 0) valueBox.dontMotion();
        valueBox.text = box.currentValue;
        placeValueBubble();
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

    // While dragging: the look of style.dragging (classic: a thinner thumb line, closer tracks) and the value bubble (showValueOnDrag).
    const setIsDragging = function($isDragging) {
        isDragging = $isDragging;
        trackSpace = getTrackSpace(isDragging);
        // NOTE: withMotion() runs later: the callback reads the value of this call ($isDragging).
        thumbLineBox.withMotion(function(){
            thumbLineBox.width = getThumbWidth($isDragging);
            thumbLineBox.boxShadow = getThumbShadow($isDragging);
            thumbLineBox.center("left");
            updateTrack(1);
            box.showValueClean();
            if (!$isDragging) {
                hideValueBubble();
                return;
            }
            if (box.showValueOnDrag) showValueBubble();
        });
    };

    const showHideTracks = function($currentLeft, animated) {
        if (animated == 0) {
            trackBox.dontMotion();
            emptyTrackBox.dontMotion();
        }
        trackBox.opacity = ($currentLeft == minValue) ? 0 : 1;
        emptyTrackBox.opacity = ($currentLeft == maxValue) ? 0 : 1;
    }

    // *** PUBLIC FUNCTIONS:
    box.setValue = function(val) {

        if (val < minValue) val = minValue;
        if (val > maxValue) val = maxValue;

        const pixelsPerValue = getMaxLeft() / valueRange;
        const newLeft = (val - minValue) * pixelsPerValue;
        showHideTracks(val, 1);
        updateThumbPosition(newLeft, 1);
        box.currentValue = Math.round(val); // WHY: the value is the truth, not the position (width 0 while hidden)
        valueBox.text = box.currentValue;

        if (isFirstRun) {
            isFirstRun = 0;
            if (box.showValueAtStart && box.showValueOnSet) box.showValue();
            return;
        }
        if (box.showValueOnSet) box.showValue();

    };
    // Sets the current slider value and updates UI

    box.getValue = function() {
        return box.currentValue;
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

    // NOT DONE YET: the range is always 0 - 100 (a page maps its own range, Ex: ozden-panel createSlider).
    box.setMinValue = function(val) {
    };

    // NOT DONE YET: the range is always 0 - 100.
    box.setMaxValue = function(val) {
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

            // BOX: Thumb line (classic) or knob (round)
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

    // The removers of the document events of a drag (box.listenTo: remove() cleans them too)
    let dragEventRemovers = [];

    const removeDragEvents = () => {
        dragEventRemovers.forEach((removeEvent) => removeEvent());
        dragEventRemovers = [];
    };

    const onMouseDown = (self, e) => {
        // WHY: Only the main button: the right one (its menu) started a drag too.
        const isOtherButton = (e.type === "mousedown" && e.button !== 0);
        if (isOtherButton) return;
        // WHY: After a touch the browser sends mousedown and mouseup too: a tap gave two onDragStart and two onDragEnd.
        if (e.type === "touchstart") e.preventDefault();
        setIsDragging(true);
        startX = getClientX(e);
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
        box.onDragStart();
    };

    const onMouseMove = (self, e) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = getClientX(e);
        const maxLeft = getMaxLeft();
        let dx = (clientX - startX) / dragScale;
        let newLeft = startLeft + dx;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;

        updateThumbPosition(newLeft);
        showHideTracks(box.currentValue, 0);
        box.onDragMove(box.currentValue);
    };

    const onMouseUp = () => {
        removeDragEvents();
        setIsDragging(false);
        box.onDragEnd();
    };

    thumbBox.on("mousedown", onMouseDown);
    thumbBox.on("touchstart", onMouseDown, { passive: false });

    // WHY: With width: "100%" the slider gets its real width after the layout, and it changes with
    //      the page. The thumb must stay on its value. (No animation and no value bubble here.)
    box.onResize(function() {
        if (isDragging) return;
        const value = box.currentValue;
        updateThumbPosition((value - minValue) * (getMaxLeft() / valueRange));
        box.currentValue = value; // WHY: updateThumbPosition() reads the value back from the position.
        valueBox.text = value;
        showHideTracks(value, 0);
    });

    box.setValue(box.currentValue);

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: Slider({ styleName: "round" })
// USAGE: Slider({ styleName: "round", trackColor: "tomato" }) // The colors and the height of the track are params.
// USAGE: Slider({ styleName: "round", style: { value: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: Slider.styles.myStyle = { trackColor: "tomato", style: { trackDot: { size: 0 } } };
Slider.styles = {

    // Inspired by Google Material 3: a thick track in two parts with a space at the thumb, a thin line for the
    // thumb (thinner while it is dragged), a dot at the end of the empty track.
    classic: SliderDefaults.style,

    // The look of most web and phone sliders (2026-11-06): a thin round track, a round white knob with a soft
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

};
