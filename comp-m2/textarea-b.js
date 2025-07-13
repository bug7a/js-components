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

    // Marge params first
    mergeIntoIfMissing(params, TextareaBDefaults);

    // Control params
    params.createInput = 0; // dont create input
    params.createDescription = 0;
    params.descriptionText = ""; // dont create desc

    if (params.showCount != 0) {
        params.createUnit = 1;
    }

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:
    const textareaElem = document.createElement("textarea");

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:
    const refreshCount = function() {
        if (box.showCount) {
            const currentLength = box.getInputValue().length;
            box.setUnitText(`${box.lengthText}${currentLength}`); // /${box.minCharCount}
            if (currentLength > box.minCharCount) {
                box.unit.opacity = 0;
            } else {
                box.unit.opacity = 1;
            }
        }
    }

    // Auto height
    const autoGrow = function(elem) {
        elem.style.height = "auto";                // önce sıfırla
        //elem.style.height = (num(elem.scrollHeight) - 4) + "px"; // sonra içeriğe göre ayarla
        elem.style.height = elem.scrollHeight + "px";
        elem.style.minHeight = "";
        //box.inputBox.scrollBar.refreshScroll();
        setTimeout(() => box.inputBox.scrollBar.refreshScroll(), 0);
    };

    // *** PUBLIC FUNCTIONS:
    box.setInputValue = function(value) { // OVERRIDE
        if (value != textareaElem.value) {
            box.inputValue = value;
            textareaElem.value = value;
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
        box.inputBox.color = "transparent"; //transparent
        box.inputBox.height = "calc(100% - 20px)";
        //box.inputBox.elem.style.margin = "10px 0px 10px 0px";
        
        textareaElem.classList.add("basic_textbox");
        textareaElem.classList.add("minimal");
        //element.setAttribute("type", "text");
        textareaElem.style.cssText = "background-color:transparent;font-size:20px;resize:none;width:100%;padding:0px 0px;box-sizing:border-box";
        textareaElem.style.overflow = "hidden";
        textareaElem.style.minHeight = box.inputBox.height + "px";
        textareaElem.style.height = "auto";
        //textareaElem.style.boxSizing = "border-box";
        
        textareaElem.placeholder = box.placeholder;
        textareaElem.maxLength = box.maxChar;
        box.inputBox.elem.appendChild(textareaElem);
        box.inputBox.clickable = 1;
        //box.inputBox.color = "yellow";
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
        box.background.color = box.selectedBackgroundColor;
        box.line.color = box.selectedLineColor;
        box.onFocus();
    }
    textareaElem.addEventListener("focus", function(){ box.focusFunc() });
    
    box.blurFunc = function () {
        box.background.color = box.backgroundColor;
        box.line.color = box.lineColor;
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

    /*
    textareaElem.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            setTimeout(() => box.inputBox.scrollBar.refreshScroll(), 0);
        }
    });
    */
    
    refreshCount();
    //autoGrow(textareaElem);
    
    textareaElem.style.minHeight = (box.inputBox.height - 4) + "px";

    return endExtendedObject(box);

};