/* Bismillah */

/*

EmailInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const EmailInputBDefaults = {
    isRequired: 1,
    type: "email",
    titleText: "EMAIL",
    placeholder: "example@site.com",
    warningText: "Invalid email format",
    warningColor: "#E5885E", // "#F1BF3C"
    maxChar: 40,
};

const EmailInputB = function(params = {}) {

    // Marge params first
    mergeIntoIfMissing(params, EmailInputBDefaults);

    // Edit params:
    // params.width = getDefaultContainerBox().width;

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:
    box.isValid = function() { //OVERRIDE
        // Check email format
        return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(box.getInputValue())) ? 1 : 0;
    };

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:
    
    // Event bindings
    // OVERRIDE:
    /*
    box.inputFunc = function () {

        box.inputValue = box.input.text;
        box.checkIfInputIsRequiredAndEmpty();
        
        // E-posta doğrulaması için doğru regex
        const isValid = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(box.inputValue)) ? 1 : 0;

        if (box.inputValue.length != 0) {

            if (isValid) {
                box.hideWarning();
            } else {
                if(window.lblHint) {
                    window.lblHint.top = -1000;
                }
                box.showWarning();
            }

        }

        box.onEdit();

    };
    */

    return endExtendedObject(box);

};