/* Bismillah */

/*

NumberInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const NumberInputBDefaults = {
    isRequired: 0,
    type: "number",
    titleText: "NUMERIC",
    maxChar: 35,
    placeholder: "(auto)",
    allowNegative: 0,
    allowDecimal: 1,
    decimalSeparator: ".", // ","
    maxDecimalDigits: 2,
};

const NumberInputB = function(params = {}) {

    // Marge params first
    mergeIntoIfMissing(params, NumberInputBDefaults);

    // Edit params:

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:
    const makeExamamplePlaceholder = function() {

        let value = "";
        if (box.allowNegative) {
            value = "-"
        }
        value = value + "100";
        // 3. Ondalık ayraç sadece bir kez geçmeli
        if (box.allowDecimal) {
            value = value + box.decimalSeparator + "0".repeat(box.maxDecimalDigits);
        }
        return value;

    };

    // *** PUBLIC FUNCTIONS:
    box.applyFormattedValueToInput = function() {

        let value = box.getInputValue();

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
            //console.table(parts)
            if (parts.length > 2) {
                value = parts.pop() + sep + parts.join("");
            }
            if (parts.length == 2 && box.maxDecimalDigits >= 0) {
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

        box.setInputValue(value); // Put back formatted value.

    }
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        box.setPlaceholder(makeExamamplePlaceholder());
    }

    return endExtendedObject(box);

};