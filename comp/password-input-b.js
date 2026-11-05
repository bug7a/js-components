/* Bismillah */

/*

PasswordInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS (the user, 2026-11-05): styleName "ozden" on a light page, "ozdenDark" on a dark page (the packages
  of InputB, comp/input-b.js; the look of 02-comp-examples/input-b-ex7-ozden.htm), unless the user asks for another one.

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
    showPasswordIconFile: "../comp/password-input-b/show-btn.png",
    hidePasswordIconFile: "../comp/password-input-b/hide-btn.png",
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
    showPasswordIconInvert: 0, 
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
        const isShown = (show != 0);
        box.showPassword = isShown ? 1 : 0;
        box.input.inputElement.type = isShown ? "text" : "password";
        // The button shows what a click does:
        box.btnShowPassword.tooltip.setHintText(isShown ? box.hideTooltipMessage : box.showTooltipMessage);
        box.btnShowPassword.load(isShown ? box.hidePasswordIconFile : box.showPasswordIconFile);
    };
    
    box.refresh = function() {
        
    }

    // *** OBJECT VIEW:
    box.input.inputElement.type = "password";

    // GROUP: btnShowPassword (in the left box of InputB)
    AutoLayout({
        align: "right center",
        padding: [10, 0],
    });
    box.leftBox.add(that);

        // ICON: Show / hide password button
        box.btnShowPassword = Icon({
            width: 32,
            height: 32,
            visible: box.showShowPasswordButton,
        });
        that.clickable = 1;
        that.cursor = "pointer";
        if (box.showPasswordIconInvert == 1) {
            box.btnShowPassword.css.filter = "invert(100%)";
        }

    endAutoLayout();

    // The hint of the show password button has the look of the hints of the field (tooltipStyle of the package).
    // WHY (the user, 2026-11-05): it was always white with a dark text, also on a dark field (ozdenDark, dark).
    //     Its bubble: tooltipStyle.color, or hintColor when that is "" (the warning hint takes the color of its ball).
    const hintStyle = box.tooltipStyle;
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
    // WHY: The tooltip may be made outside the box (after InputB is closed); box.own() removes it with the box.
    box.own(box.btnShowPassword.tooltip);

    // *** OBJECT INIT CODE:
    box.btnShowPassword.on("click", function() {
        box.setShowPassword((box.showPassword == 1) ? 0 : 1);
    });

    box.setShowPassword(box.showPassword);
    box.checkInputValue(); // WHY: InputB checked the start value before this isValid()

    return endExtendedObject(box);

};
