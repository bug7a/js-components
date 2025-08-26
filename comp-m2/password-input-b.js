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
    requiredText: "Password must be entered",
    type: "password",
    titleText: "PASSWORD",
    placeholder: "Enter your password",
    warningText: "",
    warningColor: "#E5885E", // "#F1BF3C"
    maxChar: 25,
    showPassword: 0,
    showShowPasswordButton: 1, // enable show/hide icon by default
    showPasswordIconFile: "../comp-m2/password-input-b/show-btn.png",
    hidePasswordIconFile: "../comp-m2/password-input-b/hide-btn.png",
    showTooltipMessage: "Show Password",
    hideTooltipMessage: "Hide Password",
    minChar: 6,
    minCharWarningText: "Password must be at least 6 characters",
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
};

const PasswordInputB = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PasswordInputBDefaults);

    // Edit params:
    params.createLeftBox = 1; // WHY: to add show/hide password button

    // BOX: Component container
    let box = startExtendedObject(InputB, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    box.isValid = function() { // OVERRIDE
        const value = box.getInputValue();
        // 1. Minimum karakter kontrolü
        if (value.length < box.minChar) {
            box.setWarningText(box.minCharWarningText);
            return 0;
        }
        // 2. Rakam kontrolü
        if (box.mustUseNumber == 1 && !(/[0-9]/.test(value))) {
            box.setWarningText(box.mustUseNumberWarningText);
            return 0;
        }
        // 3. Harf kontrolü
        if (box.mustUseLetter == 1 && !(/[a-zA-Z]/.test(value))) {
            box.setWarningText(box.mustUseLetterWarningText);
            return 0;
        }
        // 4. Büyük harf kontrolü
        if (box.mustUseUppercase == 1 && !(/[A-Z]/.test(value))) {
            box.setWarningText(box.mustUseUppercaseWarningText);
            return 0;
        }
        // 5. Küçük harf kontrolü
        if (box.mustUseLowercase == 1 && !(/[a-z]/.test(value))) {
            box.setWarningText(box.mustUseLowercaseWarningText);
            return 0;
        }
        // 6. Özel karakter kontrolü
        if (box.mustUseSpecialChar == 1 && !(/[^a-zA-Z0-9]/.test(value))) {
            box.setWarningText(box.mustUseSpecialCharWarningText);
            return 0;
        }
        // Geçtiyse uyarı yok
        return 1;
    };

    box.setShowPassword = function(show) {
        if (show == 0) {
            box.showPassword = 0;
            box.input.inputElement.type = "password";
            box.btnShowPassword.tooltip.setHintText(box.showTooltipMessage);
            box.btnShowPassword.load(box.showPasswordIconFile);
        } else {
            box.showPassword = 1;
            box.input.inputElement.type = "text";
            box.btnShowPassword.tooltip.setHintText(box.hideTooltipMessage);
            box.btnShowPassword.load(box.hidePasswordIconFile);
        }
    };
    
    box.destroy = function() {
        box.btnShowPassword.remove();
        box.remove();
        box = null;
    };

    box.refresh = function() {
        
    }

    // *** OBJECT VIEW:
    box.input.inputElement.type = "password";

    // btnShowPassword
    AutoLayout({
        align: "right center",
        padding: [10, 0],
    });
    box.leftBox.add(that);

        box.btnShowPassword = Icon({
            width: 32,
            height: 32,
            visible: box.showShowPasswordButton,
        });
        //that.position = "absolute";
        that.clickable = 1;
        that.elem.style.cursor = "pointer";
        //that.right = 30;
        //that.center("top");

    endAutoLayout();

    box.btnShowPassword.tooltip = Tooltip({
        target: box.btnShowPassword,
        hintText: "",
        hintPosition: "left",
        lbl_border: 1,
        lbl_color: "white",
        lbl_textColor: "#141414",
        lbl_borderColor: "#141414",
        lbl_fontSize: 14,
        lbl_round: 2,
    });

    // *** OBJECT INIT CODE:
    box.btnShowPassword.on("click", function() {
        box.setShowPassword((box.showPassword == 1) ? 0 : 1);
    });

    box.setShowPassword(box.showPassword);

    return endExtendedObject(box);

};
