/* Bismillah */

/*

Button With Icon - v26.01

- A customizable button with an icon and text.
- Supports icon positioning (left/top).

USAGE:
ButtonWithIcon({
    labelText: "Alert",
    iconFile: "../comp-m3/button-with-icon/alert-black.png",
    iconPosition: "top",
    onClick: function (self) { self.setText("Clicked"); },
});

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
    onClick: function (self) { },
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
        }
    }
};

const ButtonWithIcon = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ButtonWithIconDefaults);

    // BOX: Component container
    const box = startObject(params);

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

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.onClick) box.onClick(box, event);
    });

    // THE LOOK OF THE MOUSE: hover, pressed, back to normal.
    box.on("mouseover", function () {
        box.color = box.style.hover.color;
    });
    box.on("mouseout", function () {
        box.color = box.style.box.color;
    });
    box.on("mousedown", function () {
        box.color = box.style.active.color;
    });
    box.on("mouseup", function () {
        box.color = box.style.hover.color; // WHY: The mouse is still on the button.
    });

    return endObject(box);

};
