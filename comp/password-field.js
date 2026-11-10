/* Bismillah */

/*

PasswordField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "light" (the default) on a light page, "dark" on a dark page (the packages
  of TextField, comp/text-field.js; the look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one.
- comp/tooltip.js, loaded before this file, shows the hint of the eye button in a bubble; without it there is no bubble.

Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const PasswordFieldDefaults = {
    required: 1,
    requiredText: "Password must be entered",
    type: "password",
    titleText: "PASSWORD",
    placeholder: "Enter your password",
    warningText: "",
    warningColor: "#E5885E",
    maxLength: 25,
    showPassword: 0,
    showShowPasswordButton: 1, // enable show/hide icon by default
    showPasswordIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" preserveAspectRatio="none" fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 23C9 13 15.5 9.5 24 9.5S39 13 44.5 23C39 33 32.5 36.5 24 36.5S9 33 3.5 23Z"/><circle cx="24" cy="23" r="6.5"/></svg>'), // an eye (a page can give its own picture)
    hidePasswordIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" preserveAspectRatio="none" fill="none" stroke="#141414" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 23C9 13 15.5 9.5 24 9.5S39 13 44.5 23C39 33 32.5 36.5 24 36.5S9 33 3.5 23Z"/><circle cx="24" cy="23" r="6.5"/><path d="M6 6.5L41 42"/></svg>'), // a crossed eye
    eyeIconSize: "", // px: the size of the eye (both icons). "": by the height of the field (32; a small field less)
    showPasswordHintText: "Show Password",
    hidePasswordHintText: "Hide Password",
    minLength: 6,
    minLengthWarningText: "Password must be at least 6 characters",
    mustUseNumber: 1,
    mustUseNumberWarningText: "Password must contain at least one number",
    mustUseLetter: 1,
    mustUseLetterWarningText: "Password must contain at least one letter",
    mustUseUppercase: 0,
    mustUseUppercaseWarningText: "Password must contain at least one uppercase letter",
    mustUseLowercase: 0,
    mustUseLowercaseWarningText: "Password must contain at least one lowercase letter",
    mustUseSpecialChar: 0,
    mustUseSpecialCharWarningText: "Password must contain at least one special character",
    invertIconColor: 0, 
};

const PasswordField = function(params = {}) {

    // Merge params:
    // WHY the style package of TextField first: a key it sets (warningColor) wins over the defaults here, as over the
    //     defaults of TextField
    basic.applyStylePackage(params, TextField.styles, TextFieldDefaults);
    mergeIntoIfMissing(params, PasswordFieldDefaults);

    // Edit params:
    params.showLeftBox = 1; // WHY: to add show/hide password button

    // BOX: Component container
    let box = startExtendedObject(TextField, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    box.isValid = function() { // OVERRIDE
        const value = box.getValue();
        // 1. The minimum length
        if (value.length < box.minLength) {
            box.setWarningText(box.minLengthWarningText);
            return 0;
        }
        // 2. A digit
        if (box.mustUseNumber == 1 && !(/[0-9]/.test(value))) {
            box.setWarningText(box.mustUseNumberWarningText);
            return 0;
        }
        // 3. A letter
        if (box.mustUseLetter == 1 && !(/[a-zA-Z]/.test(value))) {
            box.setWarningText(box.mustUseLetterWarningText);
            return 0;
        }
        // 4. A capital letter
        if (box.mustUseUppercase == 1 && !(/[A-Z]/.test(value))) {
            box.setWarningText(box.mustUseUppercaseWarningText);
            return 0;
        }
        // 5. A small letter
        if (box.mustUseLowercase == 1 && !(/[a-z]/.test(value))) {
            box.setWarningText(box.mustUseLowercaseWarningText);
            return 0;
        }
        // 6. A special character
        if (box.mustUseSpecialChar == 1 && !(/[^a-zA-Z0-9]/.test(value))) {
            box.setWarningText(box.mustUseSpecialCharWarningText);
            return 0;
        }
        // Passed: no warning
        return 1;
    };

    box.setShowPassword = function(show) {
        const isShown = (show != 0);
        box.showPassword = isShown ? 1 : 0;
        box.input.inputElement.type = isShown ? "text" : "password";
        // The button shows what a click does:
        if (box.btnShowPassword.tooltip) {
            box.btnShowPassword.tooltip.setHintText(isShown ? box.hidePasswordHintText : box.showPasswordHintText);
        }
        box.btnShowPassword.load(isShown ? box.hidePasswordIconFile : box.showPasswordIconFile);
    };
    
    box.refresh = function() {
        
    }

    // *** OBJECT VIEW:
    box.input.inputElement.type = "password";

    // GROUP: btnShowPassword (in the left box of TextField)
    // WHY: over a field under its title an icon mark stands in the middle of the right padding (TextField light, dark):
    //      the eye stands left of that padding, so the mark does not cover it.
    const isMarkInRightPadding = (box.titlePosition === "above" && box.warningBallType === "icon");
    const LEFT_BOX_PADDING = 20; // (the padding of the left box of TextField)
    AutoLayout({
        align: "right center",
        padding: isMarkInRightPadding ? [0, 0, box.rightPadding - LEFT_BOX_PADDING, 0] : [10, 0],
    });
    box.leftBox.add(that);

        // ICON: Show / hide password button
        // WHY: a small field (minimal: 28 px) takes a smaller eye; the usual fields (40 px) keep 32
        const EYE_RATIO = 0.6;
        const fieldEyeSize = (box.inputHeight >= 40) ? 32 : Math.round(box.inputHeight * EYE_RATIO);
        const eyeSize = box.eyeIconSize || fieldEyeSize;
        box.btnShowPassword = Icon({
            width: eyeSize,
            height: eyeSize,
            visible: box.showShowPasswordButton,
        });
        that.clickable = 1;
        that.cursor = "pointer";
        // WHY selectStyle too: a dark package has white icons there, and the black eye could not be seen on its field.
        if (box.invertIconColor == 1 || box.selectStyle.invertIconColor == 1) {
            box.btnShowPassword.css.filter = "invert(100%)";
        }

    endAutoLayout();

    // The hint of the show password button has the look of the hints of the field (tooltipStyle of the package).
    // WHY: a white hint with a dark text does not suit a dark field (ozdenDark, dark).
    //     Its bubble: tooltipStyle.color, or hintColor when that is "" (the warning hint takes the color of its ball).
    const hintStyle = box.tooltipStyle;
    // WHY the check: a page without comp/tooltip.js gets the eye button with no bubble, not an error.
    if (typeof Tooltip !== "undefined") {
        box.btnShowPassword.tooltip = Tooltip({
            target: box.btnShowPassword,
            hintText: "",
            hintPosition: "left",
            lbl_border: hintStyle.border,
            lbl_color: hintStyle.color || hintStyle.hintColor,
            lbl_textColor: hintStyle.textColor,
            lbl_borderColor: hintStyle.borderColor,
            lbl_fontSize: hintStyle.fontSize,
            lbl_round: hintStyle.round,
        });
        // WHY: The tooltip may be made outside the box (after TextField is closed); box.own() removes it with the box.
        box.own(box.btnShowPassword.tooltip);
    }

    // *** OBJECT INIT CODE:
    box.btnShowPassword.on("click", function() {
        box.setShowPassword((box.showPassword == 1) ? 0 : 1);
    });

    box.setShowPassword(box.showPassword);
    box.checkInputValue(); // WHY: TextField checked the start value before this isValid()

    return endExtendedObject(box);

};
