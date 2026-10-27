/* Bismillah */

/*

PhoneInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

/*

- input.getInputValue();
-- Returns "" while no digit is written. (The field holds only its mask: "+90 (___) ___-____")
-- So an optional field with no number is not wrong, a required one shows "Required",
   and a form does not send the mask.

*/

"use strict";

// Default values:
const PhoneInputBDefaults = {
    isRequired: 1,
    titleText: "PHONE NUMBER",
    placeholder: "(auto)",
    warningText: "Invalid phone number format",
    warningColor: "#E5885E", // "#F1BF3C"
    countryCode: "+90",
    phoneMask: " (___) ___-____",
    //phoneMask: " (___) ___ __ __",
    //phoneMask: " ___ ___ __ __",
    //phoneMask: " ___ ___-__-__",
    unitText: "TR",
};

const PhoneInputB = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PhoneInputBDefaults);

    // Edit params, if needed:
    if (params.createInput == 0) {
        params.createInput = 1;
    }

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    const inputElem = box.input.inputElement;

    // *** PRIVATE FUNCTIONS:

    const getFullMask = function() {
        return box.countryCode + box.phoneMask;
    };

    // The cursor goes to the first empty digit (the first "_"), or to the end when the number is full.
    const setCursorToFirstUnderscore = function() {
        if (!inputElem) return;
        const firstUnderscore = inputElem.value.indexOf("_");
        if (inputElem.selectionStart === firstUnderscore) return;

        const cursorPos = (firstUnderscore !== -1) ? firstUnderscore : inputElem.value.length;
        inputElem.setSelectionRange(cursorPos, cursorPos); // WHY: Cursorda önce sona gitmesin.
        setTimeout(() => {
            inputElem.setSelectionRange(cursorPos, cursorPos); // WHY: Asıl cursoru taşıma kodu (after the browser moved it).
        }, 0);
    };

    const makeRandomPhoneNumber = function() {
        return box.phoneMask.replace(/_/g, () => Math.floor(Math.random() * 10));
    };

    // Every "_" of the mask gets the next digit; a "_" stays when there is no digit left.
    const fillMaskWithDigits = function(mask, digits) {
        let digitIndex = 0;
        let result = "";
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] !== "_") {
                result += mask[i];
                continue;
            }
            if (digitIndex < digits.length) {
                result += digits[digitIndex];
                digitIndex++;
            } else {
                result += "_";
            }
        }
        return result;
    };

    // Backspace ile sadece rakam silinsin, countryCode ve sabit karakterler silinmesin
    const deleteDigitBeforeCursor = function(event) {
        const cursorPos = inputElem.selectionStart;
        const value = inputElem.value;
        const mask = getFullMask();
        const firstDigitIndex = mask.indexOf("_");

        // Eğer cursor countryCode veya sabit karakterlerin başındaysa silmeye izin verme
        if (cursorPos <= firstDigitIndex) {
            event.preventDefault();
            setCursorToFirstUnderscore();
            return;
        }

        // Sola doğru ilk rakamı bul
        const left = value.slice(0, cursorPos);
        const right = value.slice(cursorPos);
        let i = left.length - 1;
        while (i >= 0 && mask[i] !== "_") i--;

        if (i >= 0) {
            inputElem.value = left.substring(0, i) + "_" + left.substring(i + 1) + right;
        }
        // WHY: The browser does not delete: the digit became "_" above (or there was no digit to delete).
        event.preventDefault();
        setCursorToFirstUnderscore();

        // WHY: Backspace e bastığında da, güncellesin.
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
        box.onEdit(); // WHY: Silme işleminde edit tetiklenmeli.
    };

    // *** PUBLIC FUNCTIONS:

    // Girilen numarayı box.phoneMask a uygun hale getir.
    box.applyFormattedValueToInput = function() { // OVERRIDE

        let value = inputElem.value; // WHY: The field itself, also when it holds only the mask. (getInputValue() is "" then.)

        // 1. Başından countryCode uzunluğu kadar karakteri sil
        if (typeof box.countryCode === "string" && box.countryCode.length > 0) {
            value = value.substring(box.countryCode.length);
        }

        // 2. Yalnızca rakamlar kalsın (the characters of the mask go too)
        let digits = value.replace(/[^0-9]/g, "");

        // Fazla girilen rakamları yoksay
        const maxDigits = (box.phoneMask.match(/_/g) || []).length;
        digits = digits.substring(0, maxDigits);

        // 3. Şimdi countryCode + phoneMask formatına uygun şekilde doldur
        box.setInputValue(fillMaskWithDigits(getFullMask(), digits));
        setCursorToFirstUnderscore();

    };

    box.setPhoneMask = function(mask) {
        box.phoneMask = mask;
        box.refreshInput();
    };

    box.setCountryCode = function(code) {
        box.countryCode = code;
        box.refreshInput();
    };

    // WHY: The mask is written into the field on focus, and it is not a value. Before, an empty field with
    //      the mask was "not valid": a form counted an optional phone as a missing entry while the cursor
    //      was in it, a required one showed "Invalid" instead of "Required", and the mask could be sent.
    box.getInputValue = function() { // OVERRIDE
        const value = box.input.text;
        return (value === getFullMask()) ? "" : value;
    };

    box.isValid = function() { // OVERRIDE
        const value = box.getInputValue();
        if (!value || value.indexOf("_") !== -1) {
            return 0;
        }
        return 1;
    };

    // Re make input value and show warning if needed 
    box.refreshInput = function() {

        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
        setCursorToFirstUnderscore();
        box.inputValue = inputElem.value;

    };

    box.fillAutoPlaceholder = function() {
        box.setPlaceholder(box.countryCode + makeRandomPhoneNumber());
    }

    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        // Rasgele telefon numarası üret
        box.fillAutoPlaceholder();
    }

    if(box.createInput == 1) { // Always will be 1
        
        // WHY: box.paintFocus() of InputB: this copy painted only the background and the line, so the
        //      border of a package (ozden, ozdenDark, dark) did not change on focus.
        box.focusFunc = function () {
            box.paintFocus(1);
            // Eğer input boşsa countryCode + phoneMask yaz
            if (inputElem.value.trim() === "") {
                inputElem.value = getFullMask();
            }
            setCursorToFirstUnderscore();
            // WHY: İlk seçimde güncellesin, çünkü maske gösteriyor. ve artık input boş olmuyor.
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            box.onFocus();
        };

        box.blurFunc = function() {
            box.paintFocus(0);

            if (inputElem.value == getFullMask()) { // WHY: The field itself. (getInputValue() is "" for the mask.)
                box.setInputValue("");
            }

            box.onBlur();
        };

        // Kullanıcı input içinde herhangi bir yere tıklasa veya seçim yapsa da cursor'u ilk _'a al
        const eventNameList = ["mousedown", "mouseup", "click", "select"];
        eventNameList.forEach(function(eventName) {
            inputElem.addEventListener(eventName, function() {
                setCursorToFirstUnderscore();
            });
        });

        inputElem.addEventListener("keydown", function(event) {
            if (event.key === "Backspace") {
                deleteDigitBeforeCursor(event);
            }
        });

        // input event'inde, cursor yanlış yerdeyse düzelt
        box.inputFunc = function () { // If needed, you can override function on ExtendedObject.
            box.refreshInput();
            box.onEdit();
        };

    }

    return endExtendedObject(box);

};