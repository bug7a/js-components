/* Bismillah */

/*

URLInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: July 2025
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const URLInputBDefaults = {
    width: 400,
    isRequired: 1,
    titleText: "URL",
    placeholder: "example.com",
    warningText: "Invalid URL format",
    warningColor: "#E5885E",
    maxChar: 255,
    rightPadding: 20,
    tinySelectParams: {
        title: "",
        list: [
            { id: "1", label: "http://" },
            { id: "2", label: "https://" },
            { id: "3", label: "http://www." },
            { id: "4", label: "https://www." },
        ],
        selectedIndex: 3,
        paddingX: 0,
        arrowSize: 20,
        fontSize: 20,
        color: "rgba(0,0,0,0.05)", // "whitesmoke"
        round: 3,
        listOverTextColor: "#65A293",
    },
};

const URLInputB = function(params = {}) {

    params.createInput = 0;

    // BOX: Component container
    const box = startExtendedObject(InputB, URLInputBDefaults, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:
    box.isValid = function() {

        const regex = new RegExp(
            "^" +
            "((([a-zA-Z0-9\-]+)\\.)+[a-zA-Z]{2,})" +  // domain.com veya sub.domain.com
            "(\:\\d{2,5})?" +                          // :3000 gibi opsiyonel port
            "(\/[^\s]*)?$"                              // /path?query=1 gibi opsiyonel path ve query
        );

        return (regex.test(box.input.text)) ? 1 : 0;
        // WHY: box.getInputValue() verisi "http..." li olduğu için direk input (box.input.text) verisini kullanıyorum.

    };

    // *** PUBLIC FUNCTIONS:
    box.getInputValue = function() { // *** OVERRIDE ***
        return box.tinySelect.list[box.tinySelect.selectedIndex].label + box.input.text;
    };

    // *** OBJECT VIEW:
        AutoLayout({
            color: "transparent",
        });
        box.inputBox.add(that);

            box.tinySelect = TinySelect(box.tinySelectParams);
            that.lblLabel.elem.style.fontFamily = "opensans";
            that.lblLabel.textColor = "#373836";

            box.input = Input({
                text: box.inputValue,
                minimal: 1,
                fontSize: 20,
                height: 40,
                color: "transparent",
                width: "100%",
            });
            that.inputElement.style.padding = "0px 4px";
            that.inputElement.placeholder = box.placeholder;
            that.inputElement.maxLength = box.maxChar;
            that.inputElement.setAttribute("aria-label", box.titleText);    

        endAutoLayout();

    // *** INIT CODE:
    const inputElem = box.input.inputElement;

    box.focusFunc = function () {
        box.background.color = box.selectedBackgroundColor;
        box.line.color = box.selectedLineColor;
        box.onFocus();
    }
    inputElem.addEventListener("focus", function(){ box.focusFunc() });

    box.blurFunc = function () {
        box.background.color = box.backgroundColor;
        box.line.color = box.lineColor;
        box.onBlur();
    }
    inputElem.addEventListener("blur", function(){ box.blurFunc() });

    box.inputFunc = function () { // If needed, you can override function on ExtendedObject.
        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
        box.onEdit();
    }
    inputElem.addEventListener("input", function(){ box.inputFunc() });

    box.checkIfInputIsRequiredAndEmpty();

    return endExtendedObject(box);
};
