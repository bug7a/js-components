/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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

    // Marge params:
    mergeIntoIfMissing(params, PhoneInputBDefaults);

    // Edit params, if needed:
    if (params.createInput == 0) {
        params.createInput = 1;
    }
    // params.width = getDefaultContainerBox().width;

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    const inputElem = box.input.inputElement;

    // *** PRIVATE FUNCTIONS:

    // NOTE: Default values are also public variables.



    // *** PRIVATE FUNCTIONS:

    // Input'a focus olduğunda countryCode + phoneMask göster ve cursor'u ayarla
    const setCursorToFirstUnderscore = function() {
        if (!inputElem) return;
        const firstUnderscore = inputElem.value.indexOf("_");
        if (inputElem.selectionStart !== firstUnderscore) {
            let cursorPos = firstUnderscore !== -1 ? firstUnderscore : inputElem.value.length;
            inputElem.setSelectionRange(cursorPos, cursorPos); // WHY: Cursorda önce sona gitmesin.
            setTimeout(() => {
                inputElem.setSelectionRange(cursorPos, cursorPos); // WHY: Asıl cursoru taşıma kodu.
            }, 0);
        }
    };

    const randomPhone = function() {
        const mask = box.phoneMask;
        return mask.replace(/_/g, () => Math.floor(Math.random() * 10));
    };

    // *** PUBLIC FUNCTIONS:

    // Girilen numarayı box.phoneMask a uygun hale getir.
    box.applyFormattedValueToInput = function() { // OVERRIDE

        let value = box.getInputValue();

        // 1. Başından countryCode uzunluğu kadar karakteri sil
        if (typeof box.countryCode === "string" && box.countryCode.length > 0) {
            value = value.substring(box.countryCode.length);
        }

        // 2. phoneMask içindeki tüm karakterleri value'dan temizle
        let maskChars = box.phoneMask.replace(/[_\d]/g, ""); // mask içindeki rakam ve _ hariç karakterler
        let uniqueMaskChars = Array.from(new Set(maskChars.split("").filter(c => c !== " "))).join("");
        let regex = new RegExp("[" + uniqueMaskChars.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + "]", "g");
        let cleanNumber = value.replace(regex, "").replace(/\s/g, "").replace(/[^0-9]/g, "");

        // 3. Şimdi countryCode + phoneMask formatına uygun şekilde doldur
        let formatted = box.countryCode + box.phoneMask;
        let digitIndex = 0;
        let result = "";
        for (let i = 0; i < formatted.length; i++) {
            if (formatted[i] === "_") {
                if (digitIndex < cleanNumber.length) {
                    result += cleanNumber[digitIndex];
                    digitIndex++;
                } else {
                    result += "_";
                }
            } else {
                result += formatted[i];
            }
        }
        
        // Eğer tüm _ alanları dolduysa, fazlasını alma
        let maxDigits = (box.phoneMask.match(/_/g) || []).length;
        if (cleanNumber.length > maxDigits) {
            // Fazla girilen rakamları yoksay
            let trimmedNumber = cleanNumber.substring(0, maxDigits);
            digitIndex = 0;
            result = "";
            for (let i = 0; i < formatted.length; i++) {
                if (formatted[i] === "_") {
                    result += trimmedNumber[digitIndex];
                    digitIndex++;
                } else {
                    result += formatted[i];
                }
            }
        }

        // Sonucu input'a geri yaz
        box.setInputValue(result);
        
        // Cursor'ı ilk _ karakterinin başına konumla
        setCursorToFirstUnderscore();
        /*
        const inputElem = box.input.inputElement;
        if (inputElem && typeof inputElem.setSelectionRange === "function") {
            const firstUnderscore = result.indexOf("_");
            let cursorPos = firstUnderscore !== -1 ? firstUnderscore : result.length;
            // setTimeout ile, değer güncellendikten sonra cursor'u ayarla
            inputElem.setSelectionRange(cursorPos, cursorPos);
            setTimeout(() => {
                inputElem.setSelectionRange(cursorPos, cursorPos);
            }, 0);
        }
        */

    };

    box.setPhoneMask = function(mask) {
        box.phoneMask = mask;
        box.refreshInput();
    };

    box.setCountryCode = function(code) {
        box.countryCode = code;
        box.refreshInput();
    };

    box.isValid = function() {
        const val = box.getInputValue();
        if (!val || val.indexOf("_") !== -1) {
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
        box.placeholder = box.countryCode + randomPhone();
        box.setPlaceholder(box.placeholder);
        
    }

    // *** OBJECT VIEW:
    // 



    // *** OBJECT INIT CODE:

    // Show example placeholder
    if (box.placeholder == "(auto)") {
        // Rasgele telefon numarası üret
        box.fillAutoPlaceholder();
    }

    if(box.createInput == 1) { // Always will be 1
        
        box.focusFunc = function () {
            box.background.color = box.selectedBackgroundColor;
            box.line.color = box.selectedLineColor;
            let val = inputElem.value;
            // Eğer input boşsa countryCode + phoneMask yaz
            console.log(val);
            if (!val || val.trim() === "") {
                let formatted = box.countryCode + box.phoneMask;
                inputElem.value = formatted;
            }
            setCursorToFirstUnderscore();
            // WHY: İlk seçimde güncellesin, çünkü maske gösteriyor. ve artık input boş olmuyor.
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            box.onFocus();
        };

        box.blurFunc = function() {
            box.background.color = box.backgroundColor;
            box.line.color = box.lineColor;

            let formatted = box.countryCode + box.phoneMask;
            if (box.getInputValue() == formatted) {
                box.setInputValue("");
            } else {
                //box.checkIfInputIsRequiredAndEmpty();
                //box.showWarningIfNotValid(box.isValid());
            }

            box.onBlur();
        };

        // Kullanıcı input içinde herhangi bir yere tıklasa veya seçim yapsa da cursor'u ilk _'a al
        const eventNameList = ["mousedown", "mouseup", "click", "select"];
        eventNameList.forEach(function(eventName) {
            inputElem.addEventListener(eventName, function(e) {
                setCursorToFirstUnderscore();
            });
        });

        // Backspace ile sadece rakam silinsin, countryCode ve sabit karakterler silinmesin
        inputElem.addEventListener("keydown", function(e) {
            if (e.key === "Backspace") {
                const cursorPos = inputElem.selectionStart;
                const value = inputElem.value;
                // countryCode ve maskenin sabit karakterleri
                const mask = box.countryCode + box.phoneMask;
                // İlk rakamın index'ini bul (ilk _ karakterinin index'i)
                const firstDigitIndex = mask.indexOf("_");
                // Eğer cursor countryCode veya sabit karakterlerin başındaysa silmeye izin verme
                if (cursorPos <= firstDigitIndex) {
                    e.preventDefault();
                    setCursorToFirstUnderscore();
                    return;
                }
                // Cursor bir rakamın üzerindeyse, o rakamı sil
                // Önceki rakamı bul
                let left = value.slice(0, cursorPos);
                let right = value.slice(cursorPos);
                // Sola doğru ilk rakamı bul
                let i = left.length - 1;
                while (i >= 0 && mask[i] !== "_") i--;
                if (i >= 0) {
                    // O rakamı sil
                    let newLeft = left.substring(0, i) + "_" + left.substring(i + 1);
                    let newValue = newLeft + right;
                    inputElem.value = newValue;
                    // Cursor'u yine ilk _'a al
                    setCursorToFirstUnderscore();
                    e.preventDefault();
                } else {
                    // Silinecek rakam yoksa engelle
                    e.preventDefault();
                    setCursorToFirstUnderscore();
                }
                // WHY: Backspace e bastığında da, güncellesin.
                box.checkIfInputIsRequiredAndEmpty();
                box.showWarningIfNotValid(box.isValid());
                box.onEdit(); // WHY: Silme işleminde edit tetiklenmeli.
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