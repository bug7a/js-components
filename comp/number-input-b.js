/* Bismillah */

/*

NumberField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "ozden" on a light page, "ozdenDark" on a dark page (the packages
  of TextField, comp/input-b.js; the look of 02-comp-examples/input-b-ex7-ozden.htm), unless the user asks for another one.


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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

// THE OLD NAME of the component, for a while: the pages made with NumberInputB keep working (the same object).
// Delete it when no page uses it any more (context/repo-map.md, "Parameter names").
const NumberInputB = NumberField;
