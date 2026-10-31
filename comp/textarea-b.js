/* Bismillah */

/*

TextareaB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const TextareaBDefaults = {
    type: "textarea",
    titleText: "MESSAGE",
    placeholder: "How can we help you?",
    isRequired: 1,
    minCharCount: 80, // 0, 80
    showCount: 1, // 0, 1
    lengthText: "length: ",
    warningText: "The entered text must be longer than 80",
    warningColor: "#E5885E", // "#F1BF3C"
    maxChar: 255,
    height: 170, // 170 (4line)
    rightPadding: 5,
    unitStyle: {
        padding: [12, 4],
        color: "#373836EE",
        textColor: "white",
    },
};

const TextareaB = function(params = {}) {

    // Merge params first
    mergeIntoIfMissing(params, TextareaBDefaults);

    // Control params
    params.createInput = 0; // WHY: A <textarea> is made here instead of the Input of InputB.
    params.createDescription = 0;
    params.descriptionText = "";

    if (params.showCount != 0) {
        params.createUnit = 1;
    }

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:
    const textareaElem = document.createElement("textarea");

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:
    // The count is hidden when the text is long enough.
    const refreshCount = function() {
        if (!box.showCount) return;

        const currentLength = box.getInputValue().length;
        box.setUnitText(`${box.lengthText}${currentLength}`);
        box.unit.opacity = (currentLength > box.minCharCount) ? 0 : 1;
    }

    // The textarea grows with its text (the inputBox scrolls).
    const autoGrow = function(elem) {
        elem.style.height = "auto"; // WHY: First reset, so scrollHeight is the height of the text (also when it got shorter).
        elem.style.height = elem.scrollHeight + "px";
        elem.style.minHeight = "";
        // WHY: After the browser drew the new height.
        setTimeout(() => box.inputBox.scrollBar.refreshScroll(), 0);
    };

    // *** PUBLIC FUNCTIONS:
    box.setInputValue = function(value) { // OVERRIDE
        if (value != textareaElem.value) {
            box.inputValue = value;
            textareaElem.value = value;
            // WHY: Same as InputB.setInputValue. Without it, a required textarea cleared by code (after a form is sent) showed no required icon.
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            refreshCount();
            autoGrow(textareaElem);
        }
    };

    box.getInputValue = function() { // OVERRIDE
        return textareaElem.value;
    };

    box.isValid = function() { // OVERRIDE
        return (box.getInputValue().length > box.minCharCount) ? 1 : 0;
    };
    
    // *** OBJECT VIEW:
        box.inputGroup.gap = 8;
        box.inputGroup.height = "100%";
        box.inputBox.color = "transparent";
        box.inputBox.height = "calc(100% - 20px)";
        
        // WHY: A raw <textarea> (not a basic.js object): its style is written directly.
        textareaElem.classList.add("basic_textbox");
        textareaElem.classList.add("minimal");
        textareaElem.style.cssText = "background-color:transparent;font-size:20px;resize:none;width:100%;padding:0px 0px;box-sizing:border-box";
        textareaElem.style.overflow = "hidden";
        textareaElem.style.minHeight = box.inputBox.height + "px";
        textareaElem.style.height = "auto";
        
        textareaElem.placeholder = box.placeholder;
        // WHY: The <textarea> is made here, not by InputB, so the text colors of InputB were never given to it:
        //      on a dark package (dark, ozdenDark) the typed text was dark on a dark field.
        box.applyTextColors(textareaElem);
        textareaElem.maxLength = box.maxChar;
        box.inputBox.elem.appendChild(textareaElem);
        box.inputBox.clickable = 1;
        textareaElem.value = box.inputValue;
        box.inputBox.scrollY = 1;

        // SCROLL BAR:
        box.inputBox.scrollBar = ScrollBar({
            scrollableBox: box.inputBox,
            bar_border: 0,
            bar_round: 2,
            bar_borderColor: "rgba(0, 0, 0, 1)",
            bar_width: 4,
            bar_mouseOverWidth: 4,
            bar_mouseOverColor: "#373836",
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 3,
            bar_color: "#373836",
            neverHide: 1,
            showDots: 1,
        });
        

    // *** OBJECT INIT CODE:
    
    // Event bindings
    box.focusFunc = function () {
        box.paintFocus(1);
        box.onFocus();
    }
    textareaElem.addEventListener("focus", function(){ box.focusFunc() });
    
    box.blurFunc = function () {
        box.paintFocus(0);
        box.onBlur();
    }
    textareaElem.addEventListener("blur", function(){ box.blurFunc() });

    box.inputFunc = function () {

        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());

        // Refresh count on unit
        refreshCount();
        autoGrow(textareaElem);

        box.onEdit();

    }
    textareaElem.addEventListener("input", function(){ box.inputFunc() });

    box.checkIfInputIsRequiredAndEmpty();

    refreshCount();
    
    textareaElem.style.minHeight = (box.inputBox.height - 4) + "px";

    return endExtendedObject(box);

};