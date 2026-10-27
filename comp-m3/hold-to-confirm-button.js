/* Bismillah */

/*

Hold To Confirm Button - v26.01

- A button that runs its action only after it is held down (holdDuration ms): a red layer fills it from the left.
- Released early: the layer goes back. Done: the completed text is shown, resetDelay ms later the button is ready again.

USAGE:
HoldToConfirmButton({
    labelText: "Hold to Delete",
    completedText: "DELETED",
    onConfirm: function (self) { println("deleted"); },
    onReset: function (self) { println("ready again"); },
});

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
    holdDuration: 3000, // ms
    resetDelay: 3000, // ms: the completed text stays this long
    style: {
        layout: {
            gap: 4,
            padding: [18, 5],
        },
        icon: {
            width: 32,
            height: 32,
        },
        label: {
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
        box: {
            color: Black(0.05),
            border: 1,
            borderColor: Black(0.3),
            round: 8,
        },
        holdingBox: {
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

    // Merge params:
    mergeIntoIfMissing(params, HoldToConfirmButtonDefaults);

    // Edit params, if needed:
    params.color = "transparent"; // WHY: The look is on box.contentBox (style.box), the box only holds the layers.

    // BOX: Component container
    const box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    const COLOR_MOTION = "background-color 0.2s";
    const CANCEL_MOTION_DURATION = "0.3s"; // The red layer goes back faster than it fills.
    const RED_BORDER_INSET = 2; // px: the red line stands this much inside the right end of the red layer.
    const CONTENT_ALIGN = "left center"; // The normal button and the red layer place their icon and label the same way.

    // *** PUBLIC VARIABLES:
    box.holdDurationString = (box.holdDuration / 1000) + "s";
    box.publicVar = 1;
    box.holdTimer = null; // The cancel function of the waiting hold (box.after), null: not holding.
    box.resetTimer = null; // The cancel function of the waiting reset (box.after)

    // *** PRIVATE FUNCTIONS:

    // The red layer is as wide as the normal button. Its icon and label are placed by the same group layout.
    // WHY: aline() copied whole pixels (offsetTop), but the flex layout puts the label at 10.25 px:
    //      the red label stood 0.25 px higher and the text moved a little under the moving edge of the mask.
    // WHY: box.contentBox.width is rounded; the computed style keeps the part after the point (208.047px).
    const syncHoldingLayer = function () {
        const widthNow = window.getComputedStyle(box.contentBox.elem).getPropertyValue("width");
        box.holdingBox.width = basic.num(widthNow);
    };

    const moveRedBorderToMaskEnd = function () {
        // WHY: box.maskBox.width is the end value of its motion; the computed style is the width on the screen now.
        const widthNow = window.getComputedStyle(box.maskBox.elem).getPropertyValue("width");
        box.redBorder.left = basic.num(widthNow) - RED_BORDER_INSET;
    };

    // *** PUBLIC FUNCTIONS:

    box.startHold = function () {
        if (box.holdTimer) return;

        box.maskBox.setMotion(COLOR_MOTION + ", width " + box.holdDurationString);
        box.maskBox.withMotion(function () {
            box.maskBox.width = box.contentBox.width;
        });

        // NOTE: box.after() is a timer of the box: it can not run after remove().
        box.holdTimer = box.after(box.holdDuration, function () {
            box.onHoldComplete();
        });
    };

    box.cancelHold = function () {
        if (box.holdTimer) {
            box.holdTimer();
            box.holdTimer = null;
        }

        box.maskBox.setMotion(COLOR_MOTION + ", width " + CANCEL_MOTION_DURATION);
        box.maskBox.withMotion(function () {
            box.maskBox.width = 0;
        });
    };

    box.onHoldComplete = function () {
        box.holdTimer = null;
        box.maskBox.dontMotion();
        box.maskBox.width = 0;
        box.clickable = 0;

        box.completedBox.dontMotion();
        box.completedBox.opacity = 1;

        box.resetTimer = box.after(box.resetDelay, function () {
            box.resetTimer = null;
            box.clickable = 1;
            box.completedBox.opacity = 0;
            box.onReset(box);
        });

        if (box.onConfirm) box.onConfirm(box);
    };

    box.refresh = function () {
        // NOTE: Nothing to draw again: the view follows the hold by itself.
    };

    // NOTE: No remove() of its own: the timers are box.after() timers, remove() stops them.

    // *** OBJECT VIEW:
    box.cursor = "pointer";
    box.clickable = 1;

    // GROUP: The normal button (icon, label). Its size is the size of the component.
    box.contentBox = HGroup({
        width: "auto",
        height: "100%",
        gap: box.style.layout.gap,
        position: "relative",
        padding: box.style.layout.padding,
        align: CONTENT_ALIGN,
        ...box.style.box,
    });

        // ICON
        box.icon = Icon(0, 0, box.style.icon);
        box.icon.setMotion("opacity 0.2s");
        box.icon.load(box.iconFile);

        // LABEL
        box.label = Label(0, 0, box.style.label);
        box.label.setMotion("opacity 0.2s");
        box.label.text = box.labelText;
        box.label.css.whiteSpace = "nowrap";

    endGroup();

    // BOX: The mask grows from the left while the button is held. It shows that much of the red layer.
    box.maskBox = startBox(0, 0, 0, "100%", {
        color: "transparent",
    });

        // GROUP: The red layer (as wide as the normal button, with the same layout)
        box.holdingBox = HGroup({
            width: 0,
            height: "100%",
            gap: box.style.layout.gap,
            padding: box.style.layout.padding,
            align: CONTENT_ALIGN,
            ...box.style.holdingBox,
        });

            // ICON: red
            box.iconRed = Icon(0, 0, box.style.icon);
            box.iconRed.load(box.holdingIconFile);

            // LABEL: red
            box.labelRed = Label(0, 0, box.style.holdingLabel);
            box.labelRed.text = box.labelText;
            box.labelRed.css.whiteSpace = "nowrap";

            // BOX: The line at the moving end of the red layer (not a part of the layout)
            box.redBorder = Box({
                position: "absolute",
                left: 0,
                top: 0,
                width: 1,
                height: "100%",
                color: box.style.holdingBox.rightBorderColor,
            });

        endGroup();

    endBox();

    box.maskBox.onResize(moveRedBorderToMaskEnd);

    syncHoldingLayer();
    box.contentBox.onResize(syncHoldingLayer);

    // BOX: The completed layer (shown after a full hold)
    box.completedBox = startBox(0, 0, "100%", "100%", box.style.completedBox);
    box.completedBox.setMotion("opacity 0.3s");

        HGroup();

            // LABEL: Completed text
            Label(box.style.completedLabel);
            that.text = box.completedText;
            that.css.whiteSpace = "nowrap";

        endGroup();

    endBox();

    // *** OBJECT INIT CODE:

    ["mousedown", "touchstart"].forEach(eventName => box.on(eventName, box.startHold));
    ["mouseup", "touchend", "mouseleave"].forEach(eventName => box.on(eventName, box.cancelHold));

    return endObject(box);

};