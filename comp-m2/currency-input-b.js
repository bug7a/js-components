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
"use strict";

// Default values
const CurrencyInputBDefaults = {
    isRequired: 1,
    titleText: "CURRENCY",
    placeholder: "1,000.00",
    maxChar: 35,
    allowNegative: 1,
    allowDecimal: 1,
    decimalSeparator: ".", // or ","
    maxDecimalDigits: 2,
    groupSeparator: "," // for thousands grouping
};

const CurrencyInputB = function(params = {}) {

    const box = startExtendedObject(InputB, CurrencyInputBDefaults, params);

    // *** PRIVATE FUNCTIONS:
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

    const formatWithGrouping = function(numberString) {
        const sep = box.groupSeparator;
        const decSep = box.decimalSeparator;

        let isNegative = numberString.startsWith("-");
        if (isNegative) {
            numberString = numberString.substring(1);
        }

        let parts = numberString.split(decSep);
        let integerPart = parts[0];
        let decimalPart = parts[1] || "";

        integerPart = integerPart.replace(/^0+(?!$)/, "");
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

        if (box.allowDecimal && box.maxDecimalDigits >= 0) {
            decimalPart = decimalPart.substring(0, box.maxDecimalDigits);
            if (decimalPart.length > 0) {
                return (isNegative ? "-" : "") + integerPart + decSep + decimalPart;
            }
        }

        return (isNegative ? "-" : "") + integerPart;
    }

    // *** INIT:
    const inputElem = box.input.inputElement;

    if (!params.placeholder) {
        box.setPlaceholder(makeExamamplePlaceholder());
    }

    inputElem.addEventListener("input", function () {
        let value = inputElem.value;

        let allowedChars = "0-9";
        if (box.allowNegative) allowedChars += "-";
        if (box.allowDecimal) allowedChars += "\\" + box.decimalSeparator;

        const regex = new RegExp(`[^${allowedChars}]`, "g");
        value = value.replace(regex, "");

        if (box.allowNegative) {
            value = value.replace(/(?!^)-/g, "");
        }

        const parts = value.split(box.decimalSeparator);
        if (parts.length > 2) {
            value = parts.shift() + box.decimalSeparator + parts.join("");
        }

        let integerPart = parts[0];
        let decimalPart = parts[1] || "";
        decimalPart = decimalPart.substring(0, box.maxDecimalDigits);

        value = integerPart;
        if (decimalPart.length > 0 && box.allowDecimal) {
            value += box.decimalSeparator + decimalPart;
        }

        inputElem.value = formatWithGrouping(value);
    });

    return endExtendedObject(box);
};
*/

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
        /*

        parameter: numberString

        const sep = box.groupSeparator;
        const decSep = box.decimalSeparator;

        let isNegative = numberString.startsWith("-");
        if (isNegative) {
            numberString = numberString.substring(1);
        }

        let parts = numberString.split(decSep);
        let integerPart = parts[0];
        let decimalPart = parts[1] || "";

        integerPart = integerPart.replace(/^0+(?!$)/, "");
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);

        if (box.allowDecimal && box.maxDecimalDigits >= 0) {
            decimalPart = decimalPart.substring(0, box.maxDecimalDigits);
            if (decimalPart.length > 0) {
                return (isNegative ? "-" : "") + integerPart + decSep + decimalPart;
            }
        }

        return (isNegative ? "-" : "") + integerPart;
        */
    }

    // *** INIT:
    const inputElem = box.input.inputElement;

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.placeholder = makeExamamplePlaceholder();
        box.setPlaceholder(box.placeholder);
    }

    // OVERRIDE:
    box.inputFunc = function () {

        box.inputValue = box.input.text;
        box.checkIfInputIsRequiredAndEmpty();

        rememberCursorPosition();
        let value = clearGroupFormat(inputElem.value);

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
                value = parts.shift() + sep + parts.join("");
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

        inputElem.value = formatWithGrouping(value);
        restoreCursorPosition();

        box.inputValue = inputElem.value;
        box.onEdit();

    };

    return endExtendedObject(box);
};
