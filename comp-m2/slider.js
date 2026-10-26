/* Bismillah */

/*

Component Template - v25.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


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

};

const Slider = function(params = {}) {

    // BOX: Component container
    const box = startObject();

    // Values are ready to use
    box.props(SliderDefaults, params);

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

    const TRACK_SPACE = 6; // Between the thumb line and the tracks
    const DRAG_TRACK_SPACE = 3; // The same while dragging (the line is thinner)
    const THUMB_LINE_WIDTH = 4;
    const DRAG_THUMB_LINE_WIDTH = 2;
    const VALUE_BUBBLE_SPACE = 6; // Between the value bubble and the thumb
    const VALUE_SHOW_DURATION = 1200; // ms: the value bubble is hidden after it (showValue)

    let trackSpace = TRACK_SPACE;
    let isFirstRun = 1;

    // *** PRIVATE FUNCTIONS:

    // Maximum left position of the thumb (px).
    // WHY: Read every time: with width: "100%" the real width comes after the layout and changes with the page.
    //      (A value read at create time let the thumb be dragged out of the slider.)
    const getMaxLeft = function() {
        const max = box.width - thumbBox.width;
        return (max > 0) ? max : 0;
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

    const updateThumbPosition = function(newLeft, animated = 0) {
        const maxLeft = getMaxLeft();
        if (newLeft < 0 || !isFinite(newLeft)) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (animated == 0) thumbBox.dontMotion();
        thumbBox.left = newLeft;
        updateTrack(animated);
        box.currentValue = (maxLeft > 0) ? parseInt(((newLeft / maxLeft) * valueRange) + minValue) : minValue;
        if (animated == 0) valueBox.dontMotion();
        valueBox.text = box.currentValue;
        valueBox.aline(thumbBox, "top", VALUE_BUBBLE_SPACE, "center");
    };

    // While dragging: a thinner thumb line, closer tracks and the value bubble (showValueOnDrag).
    const setIsDragging = function($isDragging) {
        isDragging = $isDragging;
        trackSpace = (isDragging) ? DRAG_TRACK_SPACE : TRACK_SPACE;
        // NOTE: withMotion() runs later: the callback reads the value of this call ($isDragging).
        thumbLineBox.withMotion(function(){
            thumbLineBox.width = ($isDragging) ? DRAG_THUMB_LINE_WIDTH : THUMB_LINE_WIDTH;
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
        if (box.showValueTimer) clearTimeout(box.showValueTimer);
        showValueBubble();
        box.showValueTimer = setTimeout(hideValueBubble, VALUE_SHOW_DURATION);
    };

    // Stops the timer of showValue() (the bubble is not hidden by it).
    box.showValueClean = function() {
        if (box.showValueTimer) clearTimeout(box.showValueTimer);
    }

    // Sets the minimum selectable value
    box.setMinValue = function(val) {
    };

    // Sets the maximum selectable value
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
            borderTopRightRadius: "4px",
            borderTopLeftRadius: "16px",
            borderBottomRightRadius: "4px",
            borderBottomLeftRadius: "16px",
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
            borderTopRightRadius: "16px",
            borderTopLeftRadius: "4px",
            borderBottomRightRadius: "16px",
            borderBottomLeftRadius: "4px",
        };
        that.setMotion("width 0.2s, opacity 0.2s");
        that.center("top");

        // BOX: Track dot
        const trackDot = Box({
            color: box.trackColor,
            width: 4,
            height: 4,
            round: 4,
        });
        emptyTrackBox.add(that);
        that.center("top");
        that.right = 4;

        // BOX: Thumb (the draggable part)
        const thumbBox = startBox({
            width: 20,
            height: thumbHeight,
            top: 0,
            left: 0,
            color: "transparent",
            clickable: 1,
        });
        that.cursor = "pointer";
        that.setMotion("left 0.2s");

            // BOX: Thumb line
            const thumbLineBox = Box({
                top: 0,
                width: THUMB_LINE_WIDTH,
                height: thumbHeight,
                color: box.thumbColor,
                round: 2,
                borderColor: "rgba(0, 0, 0, 0.4)",
            });
            that.setMotion("width 0.2s, left 0.2s");
            that.center("left");

        endBox();

        // LABEL: Value
        const valueBox = Label({
            text: "67",
            color: "rgba(0,0,0,0.9)",
            textColor: "white",
            fontSize: 14,
            padding: [11, 9],
            round: 16,
        });
        valueBox.aline(thumbBox, "top", VALUE_BUBBLE_SPACE, "center");
        hideValueBubble();
        valueBox.setMotion("transform 0.2s, opacity 0.2s, left 0.2s");

    // *** OBJECT INIT CODE:

    // Mouse Events
    // WHY: "e.clientX || e.touches[0]" threw at the left edge of the screen: clientX 0 is falsy, a mouse event has no touches.
    const getClientX = (e) => (e.touches && e.touches.length) ? e.touches[0].clientX : e.clientX;

    const removeDragEvents = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("touchmove", onMouseMove);
        document.removeEventListener("touchend", onMouseUp);
    };

    const onMouseDown = (self, e) => {
        setIsDragging(true);
        startX = getClientX(e);
        startLeft = parseInt(thumbBox.left, 10) || 0;
        
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("touchmove", onMouseMove, { passive: false });
        document.addEventListener("touchend", onMouseUp);
        box.onDragStart();
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = getClientX(e);
        const maxLeft = getMaxLeft();
        let dx = clientX - startX;
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

    // WHY: The document events of a drag stay after a remove() during the drag. (basic.js does not know them.)
    const superRemove = box.remove;
    box.superRemove = superRemove;
    let isRemoved = 0;
    box.remove = function () {
        if (isRemoved) return;
        isRemoved = 1;
        removeDragEvents();
        superRemove.call(box);
    };

    box.setValue(box.currentValue);

    return endObject(box);

};