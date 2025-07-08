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
    isRequired: 1,
    titleText: "URL",
    placeholder: "https://example.com",
    warningText: "Invalid URL format",
    warningColor: "#E5885E",
    maxChar: 255,
};

const URLInputB = function(params = {}) {

    // BOX: Component container
    const box = startExtendedObject(InputB, URLInputBDefaults, params);

    // *** PRIVATE VARIABLES:
    const inputElem = box.input.inputElement;

    // *** PUBLIC VARIABLES:
    box.isValid = 0;

    // *** PRIVATE FUNCTIONS:
    const validateURL = function(url) {
        const regex = new RegExp(
            "^(https?:\\/\\/)?" +                        // http:// veya https:// (opsiyonel)
            "((([a-zA-Z0-9\\-]+)\\.)+[a-zA-Z]{2,})" +     // domain.com veya sub.domain.com
            "(\\:\\d{2,5})?" +                            // :3000 gibi opsiyonel port
            "(\\/[^\\s]*)?$"                              // /path?query=1 gibi opsiyonel path ve query
        );
        return regex.test(url);
    };

    // *** INIT CODE:
    inputElem.addEventListener("input", function () {
        const value = inputElem.value;

        box.isValid = validateURL(value);

        if (box.isValid) {
            box.hideWarning();
        } else {
            if (window.lblHint) {
                window.lblHint.top = -1000;
            }
            box.showWarning();
        }
    });

    return endExtendedObject(box);
};
