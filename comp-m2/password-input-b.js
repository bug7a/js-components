/* Bismillah */

/*

PasswordInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const PasswordInputBDefaults = {
    isRequired: 1,
    type: "password",
    titleText: "PASSWORD",
    placeholder: "Enter your password",
    warningText: "Password must be at least 6 characters",
    warningColor: "#E5885E", // "#F1BF3C"
    mustUseBigNumber: 1,
    mustUseBigNumberWarningText: "some",
    mustLongThen: 1,
    maxChar: 40,
    showPassword: 1,
    showShowPasswordButton: 1, // enable show/hide icon by default
    createLeftBox: 1,
    showPasswordIconFile: "../assets/icons/lamp.png",
    hidePasswordIconFile: "../assets/icons/lamp-on.png",
    showTooltipMessage: "Show Password",
    hideTooltipMessage: "Hide Password",
    minChar: 6,
    minCharWarningText: "Password must be at least 6 characters",
    mustUseNumber: 0,
    mustUseNumberWarningText: "Password must contain at least one number",
    mustUseLetter: 0,
    mustUseLetterWarningText: "Password must contain at least one letter",
    mustUseUppercase: 0,
    mustUseUppercaseWarningText: "Password must contain at least one uppercase letter",
    mustUseLowercase: 0,
    mustUseLowercaseWarningText: "Password must contain at least one lowercase letter",
    mustUseSpecialChar: 0,
    mustUseSpecialCharWarningText: "Password must contain at least one special character",
};

const PasswordInputB = function(params = {}) {

    // Merge params first
    mergeIntoIfMissing(params, PasswordInputBDefaults);

    // BOX: Component container
    const box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:
    let isPasswordVisible = false;

    // *** PUBLIC VARIABLES:
    box.isValid = function() { // OVERRIDE
        // Check password length
        return (box.getInputValue().length >= box.minChar) ? 1 : 0;
    };

    box.repositionObjects = function() {
        box.btnShowPassword.center("top");
    };

    // *** PRIVATE FUNCTIONS:


    // *** PUBLIC FUNCTIONS:
    box.setShowPassword = function(show) {
        if (show == 1) {
            box.showPassword = 1;
            box.input.inputElement.type = "password";
            box.btnShowPassword.load(box.showPasswordIconFile);
        } else {
            box.showPassword = 0;
            box.input.inputElement.type = "text";
            box.btnShowPassword.load(box.hidePasswordIconFile);
        }
    };
    

    // *** OBJECT VIEW:
    box.input.inputElement.type = "password";

    box.btnShowPassword = Icon({
        width: 32,
        height: 32,
        visible: box.showShowPasswordButton,
    });
    //that.load(box.showPasswordIconFile);
    that.position = "absolute";
    that.clickable = 1;
    that.elem.style.cursor = "pointer";
    box.leftBox.add(box.btnShowPassword);
    that.right = 30;
    that.center("top");

    // *** OBJECT INIT CODE:
    box.btnShowPassword.on("click", function() {
        box.setShowPassword((box.showPassword == 1) ? 0 : 1);
    });

    box.onResize(function() {
        box.repositionObjects();
    })

    box.setShowPassword(box.showPassword);

    return endExtendedObject(box);

};
