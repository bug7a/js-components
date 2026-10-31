/* Bismillah */

/*

CurrencyInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/


/*

- input.getInputValueAsNumber();
-- To get number with out groupSeparators

*/

"use strict";

// Default values
const CurrencyInputBDefaults = {
    isRequired: 0,
    titleText: "CURRENCY",
    placeholder: "(auto)",
    maxChar: 35,
    allowNegative: 1,
    allowDecimal: 1,
    decimalSeparator: ".", // or ","
    maxDecimalDigits: 2,
    groupSeparator: ",", // for thousands grouping
    unitText: "TL",
};

const CurrencyInputB = function(params = {}) {

    const box = startExtendedObject(InputB, CurrencyInputBDefaults, params);

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
        // Eğer küsüratsız bir sayı ise, direk gruplamaya başla.
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
            
            // Eğer küsürat kısmı geçmiş ise, gruplamaya başla.
            if (!isGrouping && value[i] == box.decimalSeparator) {
                isGrouping = true;
            }

        }

        return newValue;

    }

    // *** PUBLIC FUNCTIONS:
    box.getInputValueAsNumber = function() {
        return clearGroupFormat(box.getInputValue());
    }

    box.applyFormattedValueToInput = function() { // OVERRIDE

        rememberCursorPosition();

        let value = clearGroupFormat(box.getInputValue());

        // 1. Geçerli karakter kümesini oluştur
        let allowedChars = "0-9";
        if (box.allowNegative) allowedChars += "-";
        if (box.allowDecimal) allowedChars += "\\" + box.decimalSeparator;

        const regex = new RegExp(`[^${allowedChars}]`, "g");
        value = value.replace(regex, "");

        // 2. "-" sadece başta olacaksa diğerlerini sil
        if (box.allowNegative) {
            value = value.replace(/(?!^)-/g, "");
        }

        // 3. Ondalık ayraç sadece bir kez geçmeli
        if (box.allowDecimal) {
            const separator = box.decimalSeparator;
            const parts = value.split(separator);
            if (parts.length > 2) {
                value = parts.pop() + separator + parts.join("");
            }
            if (parts.length === 2 && box.maxDecimalDigits >= 0) {
                parts[1] = parts[1].substring(0, box.maxDecimalDigits);
                value = parts[0] + separator + parts[1];
            }
        }

        // Eğer birden fazla "0" girilir ise "00*" -> "0"
        if (parseFloat(value) == 0 && !value.includes(box.decimalSeparator) && !value.includes("-")) {
            value = "0";
        }

        // Eğer "." ile başlarsa "0." ya çevir
        if (value == box.decimalSeparator) {
            value = "0" + box.decimalSeparator;
        }

        // Eğer "-." ile başlarsa "0." ya çevir
        if (value == ("-"+box.decimalSeparator)) {
            value = "-0" + box.decimalSeparator;
        }

        value = formatWithGrouping(value);
        box.setInputValue(value); // Put back formatted value.
        restoreCursorPosition();

    };

    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.setPlaceholder(makeExamplePlaceholder());
    }

    return endExtendedObject(box);
};
