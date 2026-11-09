/* Bismillah */

/*

NumberField - v26.11

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

"use strict";

// Default values
const NumberFieldDefaults = {
    required: 0,
    type: "number",
    titleText: "NUMERIC",
    maxLength: 35,
    placeholder: "(auto)",
    allowNegative: 0,
    allowDecimal: 1,
    decimalSeparator: ".", // ","
    maxDecimalDigits: 2,
};

const NumberField = function(params = {}) {

    // Merge params first
    mergeIntoIfMissing(params, NumberFieldDefaults);

    // BOX: Component container
    const box = startExtendedObject(TextField, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:
    const makeExamplePlaceholder = function() {

        let value = "";
        if (box.allowNegative) {
            value = "-";
        }
        value = value + "100";
        if (box.allowDecimal) {
            value = value + box.decimalSeparator + "0".repeat(box.maxDecimalDigits);
        }
        return value;

    };

    // *** PUBLIC FUNCTIONS:
    box.applyFormattedValueToInput = function() { // OVERRIDE

        let value = box.getValue();

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
            if (parts.length == 2 && box.maxDecimalDigits >= 0) {
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

        box.setValue(value); // Put back formatted value.

    }
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.setPlaceholder(makeExamplePlaceholder());
    }

    return endExtendedObject(box);

};
