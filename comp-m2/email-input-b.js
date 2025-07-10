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
    placeholder: "example@sitename.com",
    warningText: "Invalid email format",
    warningColor: "#E5885E", // "#F1BF3C"
    maxChar: 35,
};

const EmailInputB = function(params = {}) {

    // BOX: Component container
    const box = startExtendedObject(InputB, EmailInputBDefaults, params);

    // *** PRIVATE VARIABLES:
    const inputElem = box.input.inputElement;

    // *** PUBLIC VARIABLES:
    box.isValid = 0;

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:
    
    // Event bindings
    inputElem.addEventListener("input", function () {

        const value = inputElem.value;

        // E-posta doğrulaması için doğru regex
        box.isValid = (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ? 1 : 0;

        if (value.length != 0) {

            if (box.isValid) {
                box.hideWarning();
            } else {
                if(window.lblHint) {
                    window.lblHint.top = -1000;
                }
                box.showWarning();
            }

        }

    });

    return endExtendedObject(box);

};