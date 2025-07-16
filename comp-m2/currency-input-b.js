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
    let previousCursorPos = 0;

    // *** PRIVATE FUNCTIONS:
    const rememberCursorPosition = function() {
        const totalLength = inputElem.value.length;
        const cursorPos = inputElem.selectionStart;
        previousCursorPos = totalLength - cursorPos;
    }

    // 2. Call after formatting to restore adjusted position
    const restoreCursorPosition = function() {
        const totalLength = inputElem.value.length;
        const cursorPos = totalLength - previousCursorPos;
        // input'a uygula
        inputElem.setSelectionRange(cursorPos, cursorPos);
    }

    const makeExamamplePlaceholder = function() {
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

    const regexEscape = function(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const clearGroupFormat = function(value) {
        let escaped = regexEscape(box.groupSeparator);
        let cleanValue = value.replace(new RegExp(escaped, "g"), "");
        return cleanValue;
    }

    const formatWithGrouping = function(value) {

        value = value.toString();

        let newValue = "";
        let numberCount = 0;
        let readyToCount = 0; // to group

        // Eğer küsüratsız bir sayı ise, direk gruplamaya başla.
        if (!value.includes(box.decimalSeparator)) {
            readyToCount = 1;
        }

        let finishBeforeEnd = 1;

        if (value[0] == "-") {
            finishBeforeEnd = 2;
        }

        for (let i = (value.length - 1); i >= 0; i--) {

            newValue = value[i] + newValue;

            if (readyToCount == 1 && i >= finishBeforeEnd) {

                if (!isNaN(value[i])) {
                    numberCount++;
                }

                if (numberCount == 3) {
                    numberCount = 0;
                    newValue = box.groupSeparator + newValue;
                }

            }
            
            // Eğer küsürat kısmı geçmiş ise, gruplamaya başla.
            if (readyToCount == 0 && value[i] == box.decimalSeparator) {
                readyToCount = 1;
            }

        }

        return newValue;

    }

    // *** PUBLIC FONCTIONS:
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
            const sep = box.decimalSeparator;
            const parts = value.split(sep);
            if (parts.length > 2) {
                value = parts.pop() + sep + parts.join("");
            }
            if (parts.length === 2 && box.maxDecimalDigits >= 0) {
                parts[1] = parts[1].substring(0, box.maxDecimalDigits);
                value = parts[0] + sep + parts[1];
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
    const inputElem = box.input.inputElement;

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.placeholder = makeExamamplePlaceholder();
        box.setPlaceholder(box.placeholder);
    }

    return endExtendedObject(box);
};
