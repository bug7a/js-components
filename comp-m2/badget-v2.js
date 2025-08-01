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

const Badge = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BadgeDefaults);

    // 
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

    // *** PUBLIC VARIABLES:

    // "hidden", "dot", "number" [var]
    box.state = "hidden"; 

    // *** PRIVATE FUNCTIONS:
    const updateBadgeDisplay = function() {

        if (box.value === undefined || box.value === null || box.value === 0) {

            // Hide badge
            box.setState("hidden");

        } else if (box.value === 1) {

            // Show as dot
            box.dot.width = box.dotSize;
            box.dot.height = box.dotSize;
            box.dot.color = box.badgeStyle.color;
            box.setState("dot");

        } else if (typeof box.value === "number" && box.value > 1) {

            // Show as number
            box.label.color = box.badgeStyle.color;

            // Format number display
            let displayText = box.value.toString();
            if (box.value > box.maxValue && box.showPlus) {
                displayText = box.maxValue + "+";
            }
            box.label.text = displayText;
            
            box.setState("number");

        } else {

            // Hide for any other case
            box.setState("hidden");

        }

    };

    const validateValue = function(value) {

        if (value === undefined || value === null) return 0;

        if (typeof value === "string") {
            const num = parseInt(value);
            return isNaN(num) ? 0 : num;
        }

        if (typeof value === "number") {
            return Math.max(0, Math.floor(value));
        }

        return 0;

    };

    // *** PUBLIC FUNCTIONS:
    box.setValue = function(value) {
        box.value = validateValue(value);
        updateBadgeDisplay();
        return box;
    };

    box.getValue = function() {
        return box.value;
    };

    box.show = function() {
        if (box.value > 0) {
            box.visible = 1;
        }
        return box;
    };

    box.hide = function() {
        box.visible = 0;
        return box;
    };

    box.getState = function() {
        return box.state;
    };

    box.isVisible = function() {
        return box.visible === 1;
    };

    box.setState = function(state) {

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

            default:
                box.state = "hidden";
                box.dot.opacity = 0;
                box.label.opacity = 0;
                break;

        }

    }

    // *** OBJECT VIEW:

        box.dot = Box({
            width: box.dotSize,
            height: box.dotSize,
            top: 4,
            right: 4,
            round: 100,
            opacity: 0,
        });
        box.dot.props(box.badgeStyle);
        box.dot.setMotion("opacity 0.2s");

        // Badge label for number display
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

    // Initialize badge display
    box.value = validateValue(box.value);
    updateBadgeDisplay();
    
    return endObject(box);
};