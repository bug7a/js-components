/* Bismillah */

/*

Button With Icon - v26.01

- A customizable button with an icon and text.
- Supports icon positioning (left/top).
- WAITING (2026-10-28, from comp-m1/object-waiting.js ObjectWaiting): setWaiting(1) puts a dark cover with a clock
  over the button while a job runs (a download, a save); the button can not be clicked then. setWaiting(0) takes it
  away (after delay ms, if given). The cover is inside the button: it moves and grows with it (ObjectWaiting was a
  sibling and needed reposition() after a resize).

USAGE:
ButtonWithIcon({
    labelText: "Alert",
    iconFile: "../comp-m3/button-with-icon/alert-black.png",
    iconPosition: "top",
    onClick: function (self) { self.setText("Clicked"); },
});
const btnDownload = ButtonWithIcon({ labelText: "Download", onClick: function (self) {
    self.setWaiting(1);
    download().then(function () { self.setWaiting(0); });
} });
btnDownload.setWaiting(0, 1000); // takes the cover away after 1 s

Started Date: January 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

Developed by AI (AntiGravity Gemini 3 Pro)

*/

"use strict";

// Default values:
const ButtonWithIconDefaults = {
    key: "0",
    width: "auto",
    height: "auto",
    labelText: "Button",
    iconFile: "../comp-m3/button-with-icon/alert-black.png", // Default icon
    iconPosition: "left", // "left", "top"
    waiting: 0, // 1: the waiting cover is over the button (set later with setWaiting)
    waitingIconFile: "../comp-m3/button-with-icon/clock.png",
    onClick: function (self) { }, // Not called while waiting
    onWaitingEnd: function (self) { }, // The waiting cover went away (setWaiting(0))
    style: {
        layout: {
            gap: 8,
            padding: [12, 6],
            align: "center center",
        },
        icon: {
            width: 24,
            height: 24,
            color: White(0), // Default no tint
        },
        label: {
            fontSize: 16,
            textColor: Black(0.8),
            fontFamily: "opensans-bold",
        },
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
        },
        hover: {
            color: "#f5f5f5",
        },
        active: {
            color: "#e0e0e0",
        },
        waiting: {
            color: "rgba(0, 0, 0, 0.4)",
            iconSize: 50, // at most; a small button gets a smaller icon
            iconSpace: 14, // the room around the icon in a small button
            invertIcon: 0, // 1: the clock is drawn light (on a light cover)
        },
    }
};

const ButtonWithIcon = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ButtonWithIconDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const WAITING_MOTION = "opacity 0.2s"; // short and soft (the cover goes away at once)
    let cancelWaitingEnd = null;

    // *** PRIVATE FUNCTIONS:

    // The clock fits the button: at most style.waiting.iconSize, smaller in a small button.
    const fitWaitingIcon = function () {
        const shortSide = Math.min(box.width, box.height);
        const size = Math.max(0, Math.min(box.style.waiting.iconSize, shortSide - box.style.waiting.iconSpace));
        box.waitingCover.icon.setSize(size, size);
        box.waitingCover.icon.center();
    };

    const showWaitingCover = function () {
        const cover = box.waitingCover;
        cover.setMotionNow("");
        cover.opacity = 0;
        cover.visible = 1;
        fitWaitingIcon();
        // WHY: the start look must be drawn before the motion is turned on, or the cover is seen at once
        void cover.elem.offsetHeight;
        cover.setMotionNow(WAITING_MOTION);
        cover.opacity = 1;
    };

    const endWaiting = function () {
        box.waiting = 0;
        box.aria = { busy: false };
        box.waitingCover.visible = 0;
        box.onWaitingEnd(box);
    };

    // *** PUBLIC FUNCTIONS:

    box.setText = function (text) {
        box.labelText = text;
        if (box.label) box.label.text = text;
    };
    // USAGE: button.setText("Save")

    box.setIcon = function (file) {
        box.iconFile = file;
        if (box.icon) box.icon.load(file);
    };
    // USAGE: button.setIcon("../comp-m3/button-with-icon/alert-black.png")

    // delay: ms before the cover goes away (only for 0)
    box.setWaiting = function (value, delay = 0) {
        const isWaiting = basic.isOn(value) ? 1 : 0;
        if (cancelWaitingEnd) cancelWaitingEnd();
        cancelWaitingEnd = null;
        if (isWaiting) {
            if (box.waiting != 1) showWaitingCover();
            box.waiting = 1;
            box.aria = { busy: true };
            return;
        }
        if (box.waiting != 1) return;
        if (delay <= 0) {
            endWaiting();
            return;
        }
        cancelWaitingEnd = box.after(delay, function () {
            cancelWaitingEnd = null;
            endWaiting();
        });
    };
    // USAGE: get: button.waiting, set: button.setWaiting(1) / button.setWaiting(0, 1000)

    box.refresh = function () {
        // NOTE: Nothing to draw again: setText() and setIcon() change the view at once.
    };

    // NOTE: No remove() of its own: basic.js remove() cleans the events and the objects inside.

    // *** OBJECT VIEW:

    // BOX: Container look
    box.props(box.style.box);
    box.cursor = "pointer";
    box.clickable = 1;
    box.setMotion("background-color 0.2s");

    // GROUP: Layout (icon, label). iconPosition "top" puts the icon above the label.
    AutoLayout({
        flow: (box.iconPosition === "top") ? "vertical" : "horizontal",
        width: params.width,
        height: params.height,
        position: "relative", // WHY: The box (width / height "auto") grows with it.
        ...box.style.layout,
    });

        // ICON: only when there is an icon file
        if (box.iconFile) {
            box.icon = Icon(0, 0, box.style.icon);
            box.icon.load(box.iconFile);
        }

        // LABEL: only when there is a text
        if (box.labelText) {
            box.label = Label(0, 0, box.style.label);
            box.label.text = box.labelText;
            box.label.css.whiteSpace = "nowrap";
        }

    endAutoLayout();

    // BOX: Waiting cover (over the content; hidden until setWaiting(1))
    box.waitingCover = startBox(0, 0, "100%", "100%", {
        color: box.style.waiting.color,
        clickable: 1, // WHY: it takes the mouse: the button under it gets no hover look while waiting
        cursor: "progress",
        css: { borderRadius: "inherit" },
    });
        box.waitingCover.icon = Icon(0, 0, 0, 0);
        box.waitingCover.icon.load(box.waitingIconFile);
        if (box.style.waiting.invertIcon) box.waitingCover.icon.css = { filter: "invert(1)" };
    endBox();
    box.waitingCover.visible = 0;

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.waiting == 1) return;
        if (box.onClick) box.onClick(box, event);
    });

    box.onResize(function () {
        if (box.waiting == 1) fitWaitingIcon();
    });

    // THE LOOK OF THE MOUSE: hover, pressed, back to normal.
    box.on("mouseover", function () {
        box.color = box.style.hover.color;
    });
    box.on("mouseout", function () {
        box.color = box.style.box.color;
    });
    box.on("mousedown", function () {
        if (box.waiting == 1) return;
        box.color = box.style.active.color;
    });
    box.on("mouseup", function () {
        box.color = box.style.hover.color; // WHY: The mouse is still on the button.
    });

    if (box.waiting == 1) {
        box.waiting = 0;
        box.setWaiting(1);
    }

    return endObject(box);

};
