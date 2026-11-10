/* Bismillah */

/*

CurrencyField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "light" (the default) on a light page, "dark" on a dark page (the packages
  of TextField, comp/text-field.js; the look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one.

Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/


/*

- input.getValueAsNumber();
-- To get number with out groupSeparators

*/

"use strict";

// Default values
const CurrencyFieldDefaults = {
    required: 0,
    titleText: "CURRENCY",
    placeholder: "(auto)",
    maxLength: 35,
    allowNegative: 1,
    allowDecimal: 1,
    decimalSeparator: ".", // or ","
    maxDecimalDigits: 2,
    groupSeparator: ",", // for thousands grouping
    unitText: "TL",
};

const CurrencyField = function(params = {}) {

    const box = startExtendedObject(TextField, CurrencyFieldDefaults, params);

    // *** PRIVATE VARIABLES:
    const inputElem = box.input.inputElement;
    let charsAfterCursor = 0; // WHY: Counted from the end, because the separators added by the format are before the cursor.

    // *** PRIVATE FUNCTIONS:
    const rememberCursorPosition = function() {
        charsAfterCursor = inputElem.value.length - inputElem.selectionStart;
    }

    // Call after formatting
    const restoreCursorPosition = function() {
        const cursorPos = inputElem.value.length - charsAfterCursor;
        inputElem.setSelectionRange(cursorPos, cursorPos);
    }

    const makeExamplePlaceholder = function() {
        let value = "";

        if (box.allowNegative) {
            value = "-";
        }

        value += "1" + box.groupSeparator + "000" + box.groupSeparator + "000";

        if (box.allowDecimal) {
            value += box.decimalSeparator + "0".repeat(box.maxDecimalDigits);
        }

        return value;
    }

    const escapeForRegex = function(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const clearGroupFormat = function(value) {
        const escapedSeparator = escapeForRegex(box.groupSeparator);
        return value.replace(new RegExp(escapedSeparator, "g"), "");
    }

    const formatWithGrouping = function(value) {

        value = value.toString();

        let newValue = "";
        let digitCount = 0;
        // A number with no fraction: the grouping starts at once.
        let isGrouping = !value.includes(box.decimalSeparator);
        // WHY: No separator before the first digit (index 0, or 1 after a "-").
        const firstDigitIndex = (value[0] == "-") ? 1 : 0;

        for (let i = (value.length - 1); i >= 0; i--) {

            newValue = value[i] + newValue;

            if (isGrouping && i > firstDigitIndex) {

                if (!isNaN(value[i])) {
                    digitCount++;
                }

                if (digitCount == 3) {
                    digitCount = 0;
                    newValue = box.groupSeparator + newValue;
                }

            }
            
            // Past the fraction: the grouping starts.
            if (!isGrouping && value[i] == box.decimalSeparator) {
                isGrouping = true;
            }

        }

        return newValue;

    }

    // The text of a number as this field writes it: only the characters it allows, the groups of three.
    const formatText = function(text) {

        let value = clearGroupFormat(text);

        // 1. The characters that may be typed
        let allowedChars = "0-9";
        if (box.allowNegative) allowedChars += "-";
        if (box.allowDecimal) allowedChars += "\\" + box.decimalSeparator;

        const regex = new RegExp(`[^${allowedChars}]`, "g");
        value = value.replace(regex, "");

        // 2. "-" only at the start: the others go
        if (box.allowNegative) {
            value = value.replace(/(?!^)-/g, "");
        }

        // 3. The decimal mark only once
        if (box.allowDecimal) {
            const separator = box.decimalSeparator;
            const parts = value.split(separator);
            // WHY the first one stays and no digit goes: the value was built again from two parts, so "12.5" with a
            //     "." typed after the 1 became "1.2", and a pasted "1.234.567" "1.23"
            if (parts.length > 2) {
                parts.splice(1, parts.length - 1, parts.slice(1).join(""));
                value = parts[0] + separator + parts[1];
            }
            if (parts.length === 2 && box.maxDecimalDigits >= 0) {
                parts[1] = parts[1].substring(0, box.maxDecimalDigits);
                value = parts[0] + separator + parts[1];
            }
        }

        // More than one "0": "00*" -> "0"
        if (parseFloat(value) == 0 && !value.includes(box.decimalSeparator) && !value.includes("-")) {
            value = "0";
        }

        // It starts with ".": "0."
        if (value == box.decimalSeparator) {
            value = "0" + box.decimalSeparator;
        }

        // It starts with "-.": "-0."
        if (value == ("-"+box.decimalSeparator)) {
            value = "-0" + box.decimalSeparator;
        }

        return formatWithGrouping(value);

    };

    // *** PUBLIC FUNCTIONS:
    box.getValueAsNumber = function() {
        return clearGroupFormat(box.getValue());
    }

    const superSetValue = box.setValue; // TextField: the text as it is

    box.applyFormattedValueToInput = function() { // OVERRIDE
        rememberCursorPosition();
        superSetValue(formatText(box.getValue()));
        restoreCursorPosition();
    };

    // WHY: a number given in code (or as the start value) was written as it is: "1234567.5", not "1,234,567.5"
    box.setValue = function(value) { // OVERRIDE
        superSetValue(formatText(String(value ?? "")));
    };

    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.setPlaceholder(makeExamplePlaceholder());
    }

    if (inputElem.value !== "") box.setValue(inputElem.value); // WHY: a start value is written in groups too (setValue)

    return endExtendedObject(box);
};
