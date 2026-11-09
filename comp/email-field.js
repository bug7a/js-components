/* Bismillah */

/*

EmailField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "light" (the default) on a light page, "dark" on a dark page (the packages
  of TextField, comp/text-field.js; the look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one.


Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const EmailFieldDefaults = {
    required: 1,
    type: "email",
    titleText: "EMAIL",
    placeholder: "example@site.com",
    warningText: "Invalid email format",
    warningColor: "#E5885E",
    maxLength: 40,
};

const EmailField = function(params = {}) {

    // Merge params first
    // WHY the style package of TextField first: a key it sets (warningColor) wins over the defaults here, as over the
    //     defaults of TextField
    basic.applyStylePackage(params, TextField.styles, TextFieldDefaults);
    mergeIntoIfMissing(params, EmailFieldDefaults);

    // BOX: Component container
    const box = startExtendedObject(TextField, params);

    // *** PRIVATE VARIABLES:
    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // name@domain.ext

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    box.isValid = function() { // OVERRIDE
        return EMAIL_PATTERN.test(box.getValue()) ? 1 : 0;
    };
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:
    box.checkInputValue(); // WHY: TextField checked the start value before this isValid(): "not-an-email" got status 0

    return endExtendedObject(box);

};
