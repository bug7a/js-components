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
        round: 3,
        // NOTE: The colors come from selectStyle of InputB (its style packages); a color given here wins.
    },
};

const URLInputB = function(params = {}) {

    params.createInput = 0; // WHY: The input is made here, after the TinySelect of the protocol.

    // BOX: Component container
    const box = startExtendedObject(InputB, URLInputBDefaults, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // The params of the protocol select: the colors of selectStyle (InputB) and the text color of the field,
    // then the tinySelectParams of the page over them.
    const getTinySelectParams = function() {
        const selectStyle = box.selectStyle;
        const colorParams = {
            color: selectStyle.color,
            invertIconColor: selectStyle.invertIconColor,
            labelTextColor: box.inputTextColor, // WHY: not "#373836": dark on a dark package
            listBackgroundColor: selectStyle.listBackgroundColor,
            listTextColor: selectStyle.listTextColor,
            listOverTextColor: selectStyle.listOverTextColor,
            listBorderColor: selectStyle.listBorderColor,
        };
        return Object.assign(colorParams, box.tinySelectParams);
    };

    // *** PUBLIC FUNCTIONS:
    box.isValid = function() { // OVERRIDE

        const regex = new RegExp(
            "^" +
            "((([a-zA-Z0-9\-]+)\\.)+[a-zA-Z]{2,})" +  // domain.com veya sub.domain.com
            "(\:\\d{2,5})?" +                          // :3000 gibi opsiyonel port
            "(\/[^\s]*)?$"                              // /path?query=1 gibi opsiyonel path ve query
        );

        // WHY: box.getInputValue() verisi "http..." li olduğu için direk input (box.input.text) verisini kullanıyorum.
        return (regex.test(box.input.text)) ? 1 : 0;

    };

    box.getInputValue = function() { // *** OVERRIDE ***
        return box.tinySelect.list[box.tinySelect.selectedIndex].label + box.input.text;
    };

    // *** OBJECT VIEW:
        AutoLayout({
            color: "transparent",
        });
        box.inputBox.add(that);

            box.tinySelect = TinySelect(getTinySelectParams());
            box.tinySelect.lblLabel.css.fontFamily = "opensans";

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
            box.applyTextColors(that.inputElement);
            that.inputElement.maxLength = box.maxChar;
            that.inputElement.setAttribute("aria-label", box.titleText);

        endAutoLayout();

    // *** OBJECT INIT CODE:
    const inputElem = box.input.inputElement;

    // WHY: box.paintFocus() of InputB: this copy did not change the border on focus.
    box.focusFunc = function () {
        box.paintFocus(1);
        box.onFocus();
    }
    inputElem.addEventListener("focus", function(){ box.focusFunc() });

    box.blurFunc = function () {
        box.paintFocus(0);
        box.onBlur();
    }
    inputElem.addEventListener("blur", function(){ box.blurFunc() });

    box.inputFunc = function () { // A child component can override it.
        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
        box.onEdit();
    }
    inputElem.addEventListener("input", function(){ box.inputFunc() });

    box.checkIfInputIsRequiredAndEmpty();

    return endExtendedObject(box);
};
