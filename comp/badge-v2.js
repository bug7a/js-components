/* Bismillah */

/*

Badge - v25.07

UI COMPONENT TEMPLATE
- Advanced badge component with notification dot/counter functionality
- Supports different badge types: dot, number, custom

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const BadgeDefaults = {
    key: "0",
    value: 0,
    maxValue: 99,
    showPlus: 1,
    dotSize: 10,
    badgeStyle: {
        color: "indianred",
        border: 1,
        borderColor: "rgba(11, 8, 8, 0.4)",
        textColor: "rgba(0, 0, 0, 0.85)",
    },
};

const Badge = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BadgeDefaults);

    params.width = "100%";
    params.height = "100%";
    params.left = 0;
    params.top = 0;
    params.position = "absolute";
    params.border = 0;
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const DOT_OFFSET = 4; // px from the top right corner

    // *** PUBLIC VARIABLES:
    box.state = "hidden"; // "hidden", "dot", "number"

    // *** PRIVATE FUNCTIONS:

    // The text of a number: over maxValue -> "99+" (showPlus: 1)
    const getNumberText = function () {
        if (box.value > box.maxValue && box.showPlus) return box.maxValue + "+";
        return box.value.toString();
    };

    // 0 -> hidden, 1 -> a dot, more -> the number
    const updateBadgeDisplay = function () {

        if (box.value === 1) {
            box.dot.width = box.dotSize;
            box.dot.height = box.dotSize;
            box.dot.color = box.badgeStyle.color;
            box.setState("dot");
            return;
        }

        if (typeof box.value === "number" && box.value > 1) {
            box.label.color = box.badgeStyle.color;
            box.label.text = getNumberText();
            box.setState("number");
            return;
        }

        box.setState("hidden"); // 0, empty or not a number

    };

    const validateValue = function (value) {

        if (value === undefined || value === null) return 0;

        if (typeof value === "string") {
            const parsedNumber = parseInt(value);
            return isNaN(parsedNumber) ? 0 : parsedNumber;
        }

        if (typeof value === "number") {
            return Math.max(0, Math.floor(value));
        }

        return 0;

    };

    // *** PUBLIC FUNCTIONS:
    box.setValue = function (value) {
        box.value = validateValue(value);
        updateBadgeDisplay();
        return box;
    };

    box.getValue = function () {
        return box.value;
    };

    box.show = function () {
        if (box.value > 0) {
            box.visible = 1;
        }
        return box;
    };

    box.hide = function () {
        box.visible = 0;
        return box;
    };

    box.getState = function () {
        return box.state;
    };

    box.isVisible = function () {
        return box.visible === 1;
    };

    box.setState = function (state) {

        box.state = state;

        switch (state) {

            case "number":
                box.dot.opacity = 0;
                box.label.opacity = 1;
                break;

            case "dot":
                box.dot.opacity = 1;
                box.label.opacity = 0;
                break;

            case "hidden":
                box.dot.opacity = 0;
                box.label.opacity = 0;
                break;

            default: // An unknown state is hidden.
                box.state = "hidden";
                box.dot.opacity = 0;
                box.label.opacity = 0;
                break;

        }

    }

    // *** OBJECT VIEW:

    // BOX: Dot (value: 1)
    box.dot = Box({
        width: box.dotSize,
        height: box.dotSize,
        top: DOT_OFFSET,
        right: DOT_OFFSET,
        round: 100,
        opacity: 0,
    });
    box.dot.props(box.badgeStyle);
    box.dot.setMotion("opacity 0.2s");

    // LABEL: Number (value: 2 or more)
    box.label = Label({
        text: "0",
        fontSize: 12,
        round: 3,
        padding: [3, 0],
        opacity: 0,
        right: 0,
        top: 0,
    });
    box.label.props(box.badgeStyle);
    box.label.setMotion("opacity 0.2s");

    // *** OBJECT INIT CODE:

    box.value = validateValue(box.value);
    updateBadgeDisplay();

    return endObject(box);
};