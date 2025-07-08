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
        if (box.allowDecimal) allowedChars += box.decimalSeparator === "." ? "\\." : box.decimalSeparator;

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
