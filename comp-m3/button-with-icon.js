/* Bismillah */

/*

Button With Icon - v26.01

UI COMPONENT TEMPLATE
- A customizable button with an icon and text.
- Supports icon positioning (left/top).

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
    iconFile: "assets/icons/alert-black.png", // Default icon
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
    let box = startObject(params);

    // *** PUBLIC VARIABLES:

    // *** PUBLIC FUNCTIONS:

    box.setText = function (text) {
        box.labelText = text;
        if (box.label) box.label.text = text;
    };

    box.setIcon = function (file) {
        box.iconFile = file;
        if (box.icon) box.icon.load(file);
    };

    box.refresh = function () {
        // Refresh logic if needed
    };

    // box.superRemove = box.remove;
    box.destroy = function () {
        box.remove();
        box = null;
    };

    // *** OBJECT VIEW:

    // Apply container styles
    box.props(box.style.box);
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    box.setMotion("background-color 0.2s");

    // Layout Container
    AutoLayout({
        flow: (box.iconPosition === "top") ? "vertical" : "horizontal",
        width: params.width,
        height: params.height,
        position: "relative",
        ...box.style.layout,
    });

    // ICON
    if (box.iconFile) {
        box.icon = Icon(0, 0, box.style.icon);
        box.icon.load(box.iconFile);
    }

    // LABEL
    if (box.labelText) {
        box.label = Label(0, 0, box.style.label);
        box.label.text = box.labelText;
        box.label.elem.style.whiteSpace = "nowrap";
    }

    endAutoLayout(); // End HGroup or VGroup

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.onClick) box.onClick(box, event);
    });

    box.on("mouseover", function (self, event) {
        box.color = box.style.hover.color;
    });

    box.on("mouseout", function (self, event) {
        box.color = box.style.box.color;
    });

    box.on("mousedown", function (self, event) {
        box.color = box.style.active.color;
    });

    box.on("mouseup", function (self, event) {
        box.color = box.style.hover.color;
    });

    return endObject(box);

};
