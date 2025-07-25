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
    //valueFormat: "{value}",
    
    minThumbHeight: 44,
    thumbColor: "rgba(0,0,0,0.7)", // Color of the draggable button
    
    trackHeight: 16, //16, 50
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
    //let trackLength = 0;
    //let thumbPosition = 0;

    const minValue = 0; // Minimum slider value
    const maxValue = 100; // Maximum slider value
    
    let startX = 0;
    let startLeft = 0;
    const maxLeft = box.width - 20; // Maximum left position (px)
    let diff = maxValue - minValue;


    let normalSpace = 6;
    let isFirstRun = 1;
    //const draggingSpace = 2;

    // *** PUBLIC VARIABLES:
    //box.value = box.currentValue;

    // *** PRIVATE FUNCTIONS:
    const updateTrack = function(animated = 0) {
        if (animated == 0) trackBox.dontMotion();
        trackBox.width = thumbBox.left + thumbLineBox.left - normalSpace;
        if (animated == 0) emptyTrackBox.dontMotion();
        emptyTrackBox.width = box.width - (thumbBox.left + thumbBox.width) + thumbLineBox.left - normalSpace;
    };
    const updateThumbPosition = function(newLeft, animated = 0) {
        if (animated == 0) thumbBox.dontMotion();
        thumbBox.left = newLeft;
        updateTrack(animated);
        //box.currentValue = parseInt((newLeft/maxLeft)*100);
        box.currentValue = parseInt(((newLeft/maxLeft)*diff) + minValue);
        if (animated == 0) valueBox.dontMotion();
        valueBox.text = box.currentValue;
        valueBox.aline(thumbBox, "top", 6, "center");
    };
    const clampValue = function(val) {};

    const setIsDragging = function($isDragging) {
        isDragging = $isDragging;
        if (isDragging) {
            normalSpace = 3;
            thumbLineBox.withMotion(function(){
                thumbLineBox.width = 2;
                thumbLineBox.center("left");
                updateTrack(1);
                box.showValueClean();
                if (box.showValueOnDrag) {
                    valueBox.elem.style.transform = "translateY(0px) scale(1)";
                    valueBox.opacity = 1;
                }
            });
            
        } else {
            normalSpace = 6;
            thumbLineBox.withMotion(function(){
                thumbLineBox.width = 4;
                thumbLineBox.center("left");
                updateTrack(1);
                box.showValueClean();
                valueBox.elem.style.transform = "translateY(25px) scale(0.1)";
                valueBox.opacity = 0;
            });
        }
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

        //const sabit = maxLeft / 100;
        const sabit = maxLeft / diff;
        const newLeft = (val - minValue) * sabit;
        showHideTracks(val, 1);
        updateThumbPosition(newLeft, 1);

        if(isFirstRun == 0) {
            if(box.showValueOnSet) box.showValue();
        } else {
            isFirstRun = 0;
            if(box.showValueAtStart && box.showValueOnSet) box.showValue();
        }

    };
    // Sets the current slider value and updates UI

    box.getValue = function() {
        return box.currentValue;
    };
    // Returns the current slider value

    box.showValue = function() {
        //if (box.showValueTimer1) clearTimeout(box.showValueTimer1);
        if (box.showValueTimer) clearTimeout(box.showValueTimer);
        //box.showValueTimer1 = setTimeout(function() {
            valueBox.elem.style.transform = "translateY(0px) scale(1)";
            valueBox.opacity = 1;
            box.showValueTimer = setTimeout(function() {
                valueBox.elem.style.transform = "translateY(25px) scale(0.1)";
                valueBox.opacity = 0;
            }, 1200);
        //}, 1);
    };

    box.showValueClean = function() {
        //if (box.showValueTimer1) clearTimeout(box.showValueTimer1);
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
    // view code here
        
        // BOX: Track
        const trackBox = Box({
            height: box.trackHeight,
            width: 0,
            left: 0,
            top: 0,
            color: box.trackColor,
            //border: 1,
            borderColor: "rgba(0, 0, 0, 0.4)",
        });
        that.elem.style.borderTopRightRadius = "4px";
        that.elem.style.borderTopLeftRadius = "16px";
        that.elem.style.borderBottomRightRadius = "4px";
        that.elem.style.borderBottomLeftRadius = "16px";
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
        that.elem.style.borderTopRightRadius = "16px";
        that.elem.style.borderTopLeftRadius = "4px";
        that.elem.style.borderBottomRightRadius = "16px";
        that.elem.style.borderBottomLeftRadius = "4px";
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

        const thumbBox = startBox({
            width: 20,
            height: thumbHeight,
            top: 0,
            left: 0,
            color: "transparent",
            clickable: 1,
            //border: 1,
        });
        that.elem.style.cursor = "pointer";
        that.setMotion("left 0.2s");

            const thumbLineBox = Box({
                top: 0,
                width: 4,
                height: thumbHeight,
                color: box.thumbColor,
                round: 2,
                //border: 1,
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
        valueBox.aline(thumbBox, "top", 6, "center");
        valueBox.elem.style.transform = "translateY(25px) scale(0.1)";
        valueBox.opacity = 0;
        valueBox.setMotion("transform 0.2s, opacity 0.2s, left 0.2s");

    // *** OBJECT INIT CODE:

    // Mouse Events
    const onMouseDown = (self, e) => {
        //isDragging = true;
        setIsDragging(true);
        startX = e.clientX || e.touches[0].clientX;
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
        const clientX = e.clientX || e.touches[0].clientX;
        let dx = clientX - startX;
        let newLeft = startLeft + dx;

        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxLeft) newLeft = maxLeft;

        //trackBox.opacity = (newLeft == 0) ? 0 : 1;
        //emptyTrackBox.opacity = (newLeft == maxLeft) ? 0 : 1;
        updateThumbPosition(newLeft);
        showHideTracks(box.currentValue, 0);
        box.onDragMove(box.currentValue);
        //updateTrack();
    };

    const onMouseUp = () => {
        
        //isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("touchmove", onMouseMove);
        document.removeEventListener("touchend", onMouseUp);
        setIsDragging(false);
        box.onDragEnd();
    };

    thumbBox.on("mousedown", onMouseDown);
    thumbBox.on("touchstart", onMouseDown, { passive: false });

    box.setValue(box.currentValue);
    //updateThumbPosition(0);
    //showHideTracks(box.currentValue, 1);

    return endObject(box);

};