/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: January 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/


Design inspired by a layout seen on Pinterest
Source: https://tr.pinterest.com/pin/528187862570909645/

*/

"use strict";

// Default values:
const HoldToConfirmButtonDefaults = {
    key: "0",
    width: "auto",
    height: 50,
    labelText: "Hold to Delete", // Hold to Vanish, Hold to Delete
    completedText: "DELETED", // Poof! And it's gone.  // DELETED // REMOVED
    iconFile: "../comp-m3/hold-to-confirm-button/trash.png",
    holdingIconFile: "../comp-m3/hold-to-confirm-button/trash-red.png",
    onConfirm: function (self) { },
    onReset: function (self) {},
    holdDuration: 3000,
    resetDelay: 3000,
    style: { // Test
        layout: {
            gap: 4,
            padding: [18, 5],
        },
        icon: {
            width: 32,
            height: 32,
        },
        label: { //normalLabel
            fontSize: 20,
            textColor: Black(0.7),
        },
        holdingLabel: {
            fontSize: 20,
            textColor: "#FE5D49",
        },
        completedLabel: {
            fontSize: 20,
            textColor: "#5DB182",
        },
        box: { // normalBox, box
            color: Black(0.05),
            border: 1,
            borderColor: Black(0.3),
            round: 8,
        },
        holdingBox: { // holdingBox
            color: "#FFD1CB",
            border: 1,
            borderColor: "#FE5D49",
            rightBorderColor: "#FE5D4944", // "transparent", "#FE5D4944", Black(0.2),
            round: 8,
        },
        completedBox: {
            color: "#DFEFE6",
            opacity: 0,
            border: 1,
            borderColor: "#5DB182",
            round: 8,
        },
    }
};

const HoldToConfirmButton = function (params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, HoldToConfirmButtonDefaults);

    // Edit params, if needed:
    // params.width = getDefaultContainerBox().width;
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);
    //box.setMotion("opacity 2s");

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    
    // *** PUBLIC VARIABLES:
    // [var]
    box.holdDurationString = (box.holdDuration / 1000) + "s";
    // [var] key for show this public var in navigator.
    box.publicVar = 1;

    // *** PRIVATE FUNCTIONS:
    const privateFunc = function () { };
    /*
    const boxResized = function(self) {
        box.iconBackground.left = box.icon.left;
        box.iconBackground.top = box.icon.top;
    };
    */

    // *** PUBLIC FUNCTIONS:

    box.startHold = function () {
        if (box.holdTimer) return;

        box.maskBox.setMotion("background-color 0.2s, width " + box.holdDurationString);

        box.maskBox.withMotion(function () {
            box.maskBox.width = box.contentBox.width;
        });
        

        //if (box.onHolding) box.onHolding(box);

        box.holdTimer = setTimeout(function () {
            box.onHoldComplete();
        }, box.holdDuration);
    };

    box.cancelHold = function () {
        if (box.holdTimer) {
            clearTimeout(box.holdTimer);
            box.holdTimer = null;
        }

        //box.maskBox.dontMotion();
        //box.maskBox.setMotion("background-color 0.2s, width 0.5s");
        box.maskBox.setMotion("background-color 0.2s, width 0.3s");
        box.maskBox.withMotion(function () {
            box.maskBox.width = 0;
        });
        //box.maskBox.opacity = 0;
    };

    box.onHoldComplete = function () {
        box.holdTimer = null;
        box.maskBox.dontMotion();
        box.maskBox.width = 0;
        //box.maskBox.opacity = 0;
        //box.opacity = 0.3;
        //box.elem.style.filter = "grayscale(100%)";
        box.clickable = 0;
        //box.label.text = box.completedText;
        //box.labelRed.text = box.completedText;

        box.completedBox.dontMotion();
        box.completedBox.opacity = 1;

        setTimeout(function () {
            //box.elem.style.filter = "none";
            //box.opacity = 1;
            box.clickable = 1;
            box.completedBox.opacity = 0;
            box.onReset(box);
        }, box.resetDelay);

        if (box.onConfirm) box.onConfirm(box);
    };

    box.refresh = function () {

        // NOTE: Check the child objects and make sure their states are appropriate.

    };

    // box.superRemove = box.remove;
    box.destroy = function () {

        //page.remove_onResize(functionName); // on page resized.

        // Remove basic objects
        //box.background.remove(); // NOTE: If you add event (box.background.on("click") to other objects.
        //box.icon.remove();

        // box.superRemove.call(box);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;

    };

    // *** OBJECT VIEW:
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    //if (box.invertColor == 1) box.elem.style.filter = "invert(100%)";

    // BOX: background
    //box.background = Box(0, 0, "100%", "100%", box.style.background);
    //box.background.setMotion("background-color 0.2s");
    // WHY: Different background boxes are more useful in components.

    box.contentBox = HGroup({
        width: "auto",
        height: "100%",
        gap: box.style.layout.gap,
        position: "relative",
        padding: box.style.layout.padding,
        ...box.style.box,
    });

    // BOX: icon
    box.icon = Icon(0, 0, box.style.icon);
    box.icon.setMotion("opacity 0.2s");
    box.icon.load(box.iconFile);

    // BOX: label
    box.label = Label(0, 0, box.style.label);
    box.label.setMotion("opacity 0.2s");
    box.label.text = box.labelText;

    endGroup();

    // effectBox
    box.maskBox = startBox(0, 0, 0, "100%", {
        color: "transparent",
        //border: 1,
    });
    //box.maskBox.elem.style.borderRadius = "0 100px 100px 0";

    // BOX: holding box
    box.holdingBox = startBox(0, 0, 0, "100%", box.style.holdingBox);
    //box.holdingBox.setMotion("background-color 0.2s, width 3s, opacity 3s");

    // BOX: icon
    box.iconRed = Icon(0, 0, box.style.icon);
    box.iconRed.load(box.holdingIconFile);

    // BOX: label
    box.labelRed = Label(0, 0, box.style.holdingLabel);
    box.labelRed.text = box.labelText;
    box.labelRed.elem.style.whiteSpace = "nowrap";

    box.redBorder = Box({
        left: 0,
        top: 0,
        width: 1,
        height: "100%",
        color: box.style.holdingBox.rightBorderColor,
    });

    endBox();

    endBox();

    box.maskBox.onResize(function (self) {
        // Because, we cant use box.maskBox.width for an animated object.
        const stil = window.getComputedStyle(box.maskBox.elem);
        const genislik = stil.getPropertyValue('width');
        box.redBorder.left = num(genislik) - 2;
    });

    const _syncLayout = function (self = box.contentBox) {
        box.iconRed.aline(box.icon);
        box.labelRed.aline(box.label);
        box.holdingBox.width = box.contentBox.width;
    };

    _syncLayout();
    box.contentBox.onResize(_syncLayout);

    box.completedBox = startBox(0, 0, "100%", "100%", box.style.completedBox);
    box.completedBox.setMotion("opacity 0.3s");

    HGroup();

    Label(box.style.completedLabel);
    that.text = box.completedText;
    //that.elem.style.textTransform = "uppercase";

    endGroup();

    endBox();

    //endBox();

    // *** OBJECT INIT CODE:

    ["mousedown", "touchstart"].forEach(evt => box.on(evt, box.startHold));
    ["mouseup", "touchend", "mouseleave"].forEach(evt => box.on(evt, box.cancelHold));

    return endObject(box);

};