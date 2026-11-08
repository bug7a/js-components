/* Bismillah */

/*

Badge - v26.11

UI COMPONENT
- A notification badge on an object: it covers its container (100%) and shows a dot or a number at its top
  right corner.
- 0: hidden (showZero: 1 -> "0"), 1: a dot (dotForOne: 0 -> "1"), more: the number (over maxValue: "99+").
- "", null or undefined: no value, hidden (also with showZero: 1). getValue() gives 0 for it.
- badgeStyle is the look of the dot and the number; numberStyle changes only the number (over badgeStyle).

USAGE:
const badge = Badge({ value: 5 }); // In the object that gets the badge (or: box.add(badge))
badge.setValue(0); // hidden
badge.setValue(1); // a dot
badge.setValue(12); // the number

// A number with a white ring, also for 0 and 1:
Badge({
    value: 0,
    showZero: 1,
    dotForOne: 0,
    badgeStyle: { color: "indianred", border: 3, borderColor: "white", textColor: "white" },
    numberStyle: { fontSize: 14, bold: 1, padding: [8, 3], round: 20, top: -10, right: -14 },
});
// NOTE: A number that stands out of the corner (top / right < 0) needs a container with clipContent: 0.

Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const BadgeDefaults = {
    key: "0",
    value: 0,
    maxValue: 99,
    showPlus: 1, // 1: over maxValue -> "99+"
    showZero: 0, // 1: 0 is shown as "0" (0: hidden)
    dotForOne: 1, // 1: a dot for 1, 0: the number "1"
    dotSize: 10,
    badgeStyle: { // The dot and the number (Ex: a white ring: border: 3, borderColor: "white")
        color: "indianred",
        border: 1,
        borderColor: "rgba(11, 8, 8, 0.4)",
        textColor: "rgba(0, 0, 0, 0.85)",
    },
    numberStyle: {}, // Only the number, over badgeStyle: fontSize, bold, padding, round, top, right...
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
    params.clipContent = 0; // WHY: A number can stand out of the corner (numberStyle top / right < 0).

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const DOT_OFFSET = 4; // px from the top right corner
    const NUMBER_FONT_SIZE = 12;
    const NUMBER_ROUND = 3;
    const NUMBER_PADDING = [3, 0];
    let isEmpty = 0; // 1: no value ("", null, undefined): hidden, also with showZero

    // *** PUBLIC VARIABLES:
    box.state = "hidden"; // "hidden", "dot", "number"

    // *** PRIVATE FUNCTIONS:

    // The text of a number: over maxValue -> "99+" (showPlus: 1)
    const getNumberText = function () {
        if (box.value > box.maxValue && box.showPlus) return box.maxValue + "+";
        return box.value.toString();
    };

    const isEmptyValue = function (value) {
        return value === undefined || value === null || value === "";
    };

    // 1 is a dot (dotForOne: 1).
    const isDotValue = function () {
        return box.value === 1 && basic.isOn(box.dotForOne);
    };

    // A number: 1 or more (1 without its dot), or 0 with showZero.
    const isNumberValue = function () {
        if (typeof box.value !== "number" || isEmpty) return false;
        if (box.value === 0) return basic.isOn(box.showZero);
        return box.value >= 1;
    };

    // 0 -> hidden (showZero: "0"), 1 -> a dot (dotForOne: 0 -> "1"), more -> the number
    const updateBadgeDisplay = function () {

        if (isDotValue()) {
            box.dot.width = box.dotSize;
            box.dot.height = box.dotSize;
            box.dot.color = box.badgeStyle.color;
            box.setState("dot");
            return;
        }

        if (isNumberValue()) {
            box.label.color = box.numberStyle.color || box.badgeStyle.color;
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

    // value: a number; "" (or null) removes the badge.
    box.setValue = function (value) {
        isEmpty = isEmptyValue(value) ? 1 : 0;
        box.value = validateValue(value);
        updateBadgeDisplay();
        return box;
    };
    // USAGE: badge.setValue(3) / badge.setValue("") // no badge

    box.getValue = function () {
        return box.value;
    };

    box.show = function () {
        if (isDotValue() || isNumberValue()) {
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

    };

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

    // LABEL: Number (value: 2 or more; 1 with dotForOne: 0; 0 with showZero: 1)
    box.label = Label({
        text: "0",
        fontSize: NUMBER_FONT_SIZE,
        round: NUMBER_ROUND,
        padding: NUMBER_PADDING,
        opacity: 0,
        right: 0,
        top: 0,
    });
    box.label.props(box.badgeStyle);
    box.label.props(box.numberStyle); // WHY: After badgeStyle: only the number (Ex: a bigger, bold text in a pill).
    box.label.setMotion("opacity 0.2s");

    // *** OBJECT INIT CODE:

    box.setValue(box.value);

    return endObject(box);
};
