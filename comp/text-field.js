/* Bismillah */

/*

TextField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: use the default styleName "light" on a light page and "dark" on a dark page (the
  look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one. The fields made from TextField
  (EmailField, PhoneField, PasswordField, UrlField, NumberField, CurrencyField, TextAreaField) take the same
  packages: give them the same styleName. The default is light; the pages made before name modern.
- comp/tooltip.js, loaded before this file, shows the hint of the warning ball in a bubble; without it the ball
  has no bubble.


Started Date: July 2025
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

/*

- .status 
-- 0: okay, 1: empty but required, 2: not valid

- input.applyFormattedValueToInput(value);
-- If you want to reformat the value override this func.

- input.isValid(value);

- input.setValue("Text");           // Set value programmatically

- input.getValue();                  // Get current value

- input.setPlaceholder("Text");          // Change placeholder

- input.setTitleText("Title");           // Set title text

- input.setDescriptionText("Description"); // Add description

- input.setRequired(1);                   // Mark as required

- input.setMaxLength(40);                 // The most letters of the value

- input.setWarningText("Warning text");  // Set invalid input warning

- input.setRequiredIcon("icons/required.svg"); // Icon for required state (warningBallType: "icon")

- input.setWarningIcon("icons/warning.svg");   // Icon for invalid state (warningBallType: "icon")

- onChange(self): the user changed the text (not at create time, not by setValue()). onFocus(self), onBlur(self).

- warningBallType: "color" | "icon"
-- "color": Top-right colored ball (requiredColor / warningColor).
-- "icon": Top-right icon (requiredIconFile / warningIconFile). Empty path uses the built-in icon.

- tooltipStyle: { color, hintColor, textColor, border, borderColor, round, fontSize }
-- hintColor: the bubble of a button of the field (the show password button of PasswordField) when color is "".
-- The tooltip of the warning ball. color "": requiredColor / warningColor.

- styleName: "light" (default) | "dark" | "modern" | "modernDark" | "ozden" | "ozdenDark" | "minimal" | "minimalDark"  (TextField.styles)
-- light / dark (_designs/text-field.htm): the light and dark look of the kit: the title over a 44 px field with one
   thin line and round 8, the accent while typing, the marks as icons, the hint in a white (dark: gray) bubble.
-- modern / modernDark: the first look, a line under the field ("classic": the old name of modern).
-- minimal / minimalDark (_designs/minimal-theme.htm): the title over a 28 px field of a line (titlePosition "above").
- The sizes: titleFontSize, inputFontSize, inputHeight, fieldPadding, descriptionFontSize (the defaults: 16, 20, 40, 14, 14).
- titlePosition: "inside" (default: the title in the field) | "above" (the title over the field, titleGap under it).
  "above" with titleText "": no title row, the field starts at the top (a title set later with setTitleText() is not shown).
- hoverBackBorderColor: the edge under the mouse ("": no change).
- warningBorderColor: the edge while a warning shows, not while typing ("": no change). warningBallSize, warningBallBorder:
  the colored ball (16, 2; minimal: an 8 px dot).
- The children (EmailField, PhoneField, UrlField, PasswordField, TextAreaField) apply the style package before their own
  defaults: a key the package sets (warningColor, unitStyle, rightPadding) wins over them.
-- The look of TextField is in flat params (backgroundColor, lineColor, titleTextColor...), not in one
   "style" object. So its packages are packages of params (basic.js v26.10.27: a package with a
   "style" key): any param can be in it, also an image (requiredIconFile, warningIconFile).
   Order: your params > the package > TextFieldDefaults.
-- TextField({ styleName: "dark" })
-- TextField({ styleName: "dark", focusBackBorderColor: "#588ABE" })   // one param of the package changed
-- TextField.styles.myStyle = { style: {}, backgroundColor: "#FFF8E8", requiredIconFile: "icons/star.svg" };
   (style: {} marks a package of params; without it the keys would go into params.style)

*/

"use strict";

// Default values
const TextFieldDefaults = {

    key: "0",
    styleName: "light", // "light", "dark", "modern" ("classic": its old name), "modernDark", "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to TextField.styles
    type: "text",
    width: 350,
    height: "auto",
    leftPadding: 20,
    rightPadding: 60,
    // THE SIZES (the minimal packages make them small)
    titleFontSize: 16,
    inputFontSize: 20,
    inputHeight: 40, // px: the row of the text
    fieldPadding: 14, // px: over and under the title and the text (titlePosition "inside")
    descriptionFontSize: 14,
    titlePosition: "inside", // "inside": the title in the field, over the text. "above": the title over the field (the field is only the row of the text). (Only at create time)
    titleGap: 4, // px between the title and the field (titlePosition "above")
    titleText: "INPUT NAME",
    placeholder: "input value",
    value: "",
    maxLength: 30,
    showDescription: 0,
    descriptionText: "",
    allowHtml: 0, // 1: titleText, descriptionText and unitText are HTML (only for your own texts)

    backgroundColor: "#F6F6F6",
    focusBackgroundColor: "#F3F4E0",
    hoverBackgroundColor: "", // the field under the mouse (not while it is selected). "": no change
    lineColor: "#373836",
    focusLineColor: "#65A293",
    backBorderColor: Black(0),
    focusBackBorderColor: Black(0),
    hoverBackBorderColor: "", // the edge under the mouse (not while it is selected). "": no change
    backBorderTopRound: 2,
    backBorderBottomRound: 0,

    titleTextColor: "#555555",
    titleBold: 0, // 1: the title in bold (opensans-bold)
    titleLetterSpacing: "", // "": normal. Ex: "0.06em"
    inputTextColor: "#373836",
    inputColorScheme: "", // "": the page's. "dark": the autofill colors of the browser stay dark (on a dark field)
    placeholderColor: "", // "": the color of the browser
    descriptionTextColor: "#999999",
    warningBallBorderColor: "#373836",

    required: 0,
    requiredText: "Required",
    requiredColor: "white",
    warningText: "Invalid value format",
    warningColor: "#E5885E",
    animatedWarningBall: 1,

    warningBallType: "color", // "color": colored ball, "icon": icon image
    warningBallSize: 16, // px: the colored ball (warningBallType "color")
    warningBallBorder: 2, // px: the edge of the colored ball (warningBallBorderColor)
    warningBorderColor: "", // the edge of the field while it shows a warning (not while typing). "": no change
    warningIconSize: 20,
    requiredIconFile: "", // image path or data URI. "": built-in icon
    warningIconFile: "", // image path or data URI. "": built-in icon
    requiredIconColor: "#373836", // built-in required icon color (built-in warning icon uses warningColor)

    // The tooltip of the warning ball (required / warning text), and of the buttons of the field (the show password
    // button of PasswordField)
    tooltipStyle: {
        color: "", // "": requiredColor / warningColor
        hintColor: "white", // a button of the field has no ball: its bubble when color is ""
        textColor: "#141414",
        border: 1,
        borderColor: "#141414",
        round: 4, // the round of the hints of Form (hintRound)
        fontSize: 14,
    },

    // The select inside the field (the protocol of UrlField, a TinySelect) and its open list
    // WHY a ground a little darker than the field (in every package but minimal): it shows that there is something to
    //     choose, and the space at the start of the select sits right on it (with no ground it looked pushed in).
    selectStyle: {
        color: "rgba(0,0,0,0.05)",
        round: 3,
        spacing: 0, // px: between the select and the top and the bottom of the field (0: it fills the height of the field)
        invertIconColor: 0, // 1: a white arrow (on a dark field)
        listBackgroundColor: "whitesmoke",
        listTextColor: "rgba(0, 0, 0, 0.8)",
        listOverTextColor: "#65A293",
        listBorderColor: "rgba(0, 0, 0, 0.6)",
    },

    showLeftBox: 0,
    showRightBox: 0,
    showUnit: 0,
    createInput: 1,
    unitText: "",
    unitStyle: {
        padding: [12, 4],
        color: "#373836",
        textColor: "white",
        round: 40,
        fontSize: 14,
    },

    onFocus: function(self) {},
    onBlur: function(self) {},
    onChange: function(self) {}, // the user changed the text (not at create time, not by setValue())

};

const TextField = function(params = {}) {

    // Merge style package: your params > TextField.styles[styleName] (a package of params) > TextFieldDefaults
    basic.applyStylePackage(params, TextField.styles, TextFieldDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TextFieldDefaults);
    // WHY read here: box.height never reads "auto" (it gives the measured size)
    const isAutoHeight = (String(params.height) === "auto");

    // BOX: Component container
    const box = startObject(params);

    // *** DATA CONTROL:
    if (box.descriptionText != "") {
        box.showDescription = 1;
    }

    if (box.showUnit == 1 || box.unitText != "") {
        box.showUnit = 1;
        box.showRightBox = 1;
    }

    // *** PRIVATE VARIABLES:
    const SHOWN_BALL_SCALE = "scale(1)";
    const HIDDEN_BALL_SCALE = "scale(0.3)"; // WHY: The ball grows from small when it is shown.
    const WARNING_BALL_MOTION = "opacity 0.2s, transform 0.2s";
    const OUT_OF_SCREEN_TOP = -1000;
    const TITLE_LINE_HEIGHT = 1.35; // of the title font size (titlePosition "above": the place of the field is known)
    const isTitleAbove = (box.titlePosition === "above");
    // WHY: an empty title kept its row (and the gap under it) over the field; the field slid out of an "auto" box
    const hasTitleRow = isTitleAbove && String(box.titleText) !== "";
    const titleLineHeight = Math.round(box.titleFontSize * TITLE_LINE_HEIGHT);
    const fieldTop = hasTitleRow ? titleLineHeight + box.titleGap : 0; // px: where the field starts

    // *** PUBLIC VARIABLES:
    
    // [var] 0: okay, 1: empty but required, 2: not valid
    box.status = 0;
    // [var] px: where the field starts under the title (titlePosition "above"; 0 "inside"). TextAreaField reads it.
    box.fieldTop = fieldTop;

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const makeWarningBallVisible = function() {
        // WHY: withMotion() shows the ball a moment later; a fast typing or a paste may make the value valid before it
        if (box.status == 0) return;
        box.warningBall.opacity = 1;
        box.warningBall.clickable = 1;
        box.warningBall.css.transform = SHOWN_BALL_SCALE;
    };

    // WHY: Only the showing is animated (hideWarningBall() turns the motion off).
    const showWarningBall = function() {
        if (box.animatedWarningBall == 1) {
            box.warningBall.withMotion(makeWarningBallVisible);
            return;
        }
        makeWarningBallVisible();
    };

    const hideWarningBall = function() {
        if (box.animatedWarningBall == 1) box.warningBall.dontMotion();
        box.warningBall.opacity = 0;
        box.warningBall.clickable = 0;
        box.warningBall.css.transform = HIDDEN_BALL_SCALE;
    };

    // Built-in icons (SVG data URI): "required" (asterisk), "warning" (exclamation)
    const createBuiltInIcon = function(kind, color) {
        const glyph = (kind == "required")
            ? '<path d="M12 6.5v11M7.2 9.25l9.6 5.5M7.2 14.75l9.6-5.5" stroke="white" stroke-width="2.2" stroke-linecap="round"/>'
            : '<path d="M12 6.5v7" stroke="white" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.5" fill="white"/>';
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="' + color + '"/>' + glyph + '</svg>';
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    };

    const getWarningIconFile = function(kind) {
        if (kind == "required") {
            return box.requiredIconFile || createBuiltInIcon("required", box.requiredIconColor);
        }
        return box.warningIconFile || createBuiltInIcon("warning", box.warningColor);
    };

    // kind: "required" or "warning"
    const applyWarningBallStyle = function(kind) {
        if (box.warningBallType != "icon") {
            box.warningBall.color = (kind == "required") ? box.requiredColor : box.warningColor;
            return;
        }
        const iconFile = getWarningIconFile(kind);
        // WHY: Loaded again only when it changed, so the icon does not flicker.
        if (box.warningBall.icon.imageElement.getAttribute("src") != iconFile) {
            box.warningBall.icon.load(iconFile);
        }
    };

    // kind: "required" or "warning"
    const showWarningBallOf = function(kind, hintText, ballColor) {
        hideWarningBall();
        applyWarningBallStyle(kind);
        if (box.warningBall.tooltip) {
            box.warningBall.tooltip.setHintText(hintText);
            box.warningBall.tooltip.setLbl_color(box.tooltipStyle.color || ballColor);
        }
        showWarningBall();
    };

    const showWarning = function() {
        // (the status first: the ball is shown only while there is a warning)
        if (box.required && box.getValue().length === 0) {
            box.status = 1;
            showWarningBallOf("required", box.requiredText, box.requiredColor);
            return;
        }
        box.status = 2;
        showWarningBallOf("warning", box.warningText, box.warningColor);
        if (box.warningBorderColor) paintBackBorder();
    };

    const hideWarning = function() {
        hideWarningBall();
        box.status = 0;
        if (box.warningBorderColor) paintBackBorder();
    };

    // *** PUBLIC FUNCTIONS:

    // A child component formats the value here: it reads getValue() and puts it back with setValue().
    box.applyFormattedValueToInput = function(value) {
    }

    box.checkIfInputIsRequiredAndEmpty = function() {
        if (box.required && box.getValue().length === 0) {
            showWarning();
            return;
        }
        hideWarning();
    };

    box.isValid = function() {
        return 1;
    };

    // Both checks of a value (required, valid). WHY both: the required check hides the warning of any value that is
    // not empty: an invalid e-mail got status 0 and a Form sent it.
    // A child that overrides isValid() calls it at the end of its own init code too.
    box.checkInputValue = function() {
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
    };

    box.showWarningIfNotValid = function(isValid) {
        if (box.getValue().length === 0) return;

        if (isValid) {
            hideWarning();
            return;
        }
        // WHY: The open hint (window.lblHint of Tooltip) goes out of the screen; the next mousemove places it again.
        if (window.lblHint) {
            window.lblHint.top = OUT_OF_SCREEN_TOP;
        }
        showWarning();
    };

    // Sets the title text for the input component
    box.setTitleText = function(titleText) {
        box.titleText = titleText;
        if (!box.title || typeof box.title.text === "undefined") return;

        setText(box.title, titleText);
        if (box.input) {
            box.input.inputElement.setAttribute("aria-label", box.titleText);
        }
    };
    
    // Sets the description below or next to the input field
    box.setDescriptionText = function(descriptionText) {
        box.descriptionText = descriptionText;
        if (!box.description || typeof box.description.text === "undefined") return;

        setText(box.description, descriptionText);
    };
    
    // Sets the maximum number of characters allowed in the input
    box.setMaxLength = function(count) {
        box.maxLength = count;
        box.input.inputElement.maxLength = count;
    };

    // Sets the placeholder text for the input field
    box.setPlaceholder = function(text) {
        box.placeholder = text;
        box.input.inputElement.placeholder = text;
    };

    // Sets the input's current value programmatically
    box.setValue = function(value) {
        if (value != box.input.text) {
            box.value = value;
            box.input.text = value;
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
        }
    };

    // Returns the current value inside the input field
    box.getValue = function() {
        return box.input.text;
    };

    let isFieldFocused = 0;
    let isFieldHover = 0;

    // A selected field keeps its own color; under the mouse it takes hoverBackgroundColor
    const getBackgroundColor = function() {
        if (isFieldFocused) return box.focusBackgroundColor;
        if (isFieldHover && box.hoverBackgroundColor) return box.hoverBackgroundColor;
        return box.backgroundColor;
    };

    // titlePosition "above": a box of the whole component (the left / right box) covers only the field
    const placeOverField = function(object) {
        if (!isTitleAbove) return;
        object.top = fieldTop;
        object.height = isAutoHeight ? box.inputHeight : "calc(100% - " + fieldTop + "px)";
    };

    // The edge: selected, with a warning (warningBorderColor), under the mouse (hoverBackBorderColor), or its own
    const getBackBorderColor = function() {
        if (isFieldFocused) return box.focusBackBorderColor;
        if (box.status == 2 && box.warningBorderColor) return box.warningBorderColor;
        if (isFieldHover && box.hoverBackBorderColor) return box.hoverBackBorderColor;
        return box.backBorderColor;
    };

    const paintBackBorder = function() {
        if (box.background) box.background.borderColor = getBackBorderColor();
    };

    // The colors of the field while it is focused (1) or not (0): background, border and line.
    // NOTE: A component made from TextField (PhoneField, UrlField, TextAreaField) calls this in its own focusFunc / blurFunc.
    box.paintFocus = function(isFocused) {
        isFieldFocused = isFocused ? 1 : 0;
        box.background.color = getBackgroundColor();
        paintBackBorder();
        box.line.color = (isFocused) ? box.focusLineColor : box.lineColor;
    };

    // The text colors of a field element (<input> or <textarea>): inputTextColor, placeholderColor, inputColorScheme.
    // NOTE: A component that makes its own field element (UrlField, TextAreaField) calls this for it.
    box.applyTextColors = function(fieldElement) {
        fieldElement.style.color = box.inputTextColor;
        if (box.placeholderColor) TextField.setPlaceholderColor(fieldElement, box.placeholderColor);
        if (box.inputColorScheme) fieldElement.style.colorScheme = box.inputColorScheme;
    };

    // Sets the background color of the input element itself
    box.setBackgroundColor = function(color) {
        box.backgroundColor = color;
        box.background.color = getBackgroundColor();
    };

    // Sets the background color of the input when selected/focused
    box.setFocusBackgroundColor = function(color) {
        box.focusBackgroundColor = color;
    };

    // Sets the line color displayed under the input by default
    box.setLineColor = function(color) {
        box.lineColor = color;
        box.line.color = color;
    };

    // Sets the underline color when input is selected/focused
    box.setFocusLineColor = function(color) {
        box.focusLineColor = color;
    };

    // Enables required field validation and sets the custom message
    box.setRequired = function(isRequired) {
        box.required = isRequired ? 1 : 0;
        box.checkInputValue();
    };

    box.setRequiredText = function(text) {
        box.requiredText = text;
    };

    // Updates the external warning text shown to the user
    box.setWarningText = function(text) {
        box.warningText = text;
    };

    // Sets the color used for displaying warning tooltips or icons
    box.setWarningColor = function(color) {
        box.warningColor = color;
    };

    // Sets the icon shown when input is required and empty (warningBallType: "icon")
    box.setRequiredIcon = function(path) {
        box.requiredIconFile = path;
        if (box.warningBallType == "icon" && box.status == 1) applyWarningBallStyle("required");
    };

    // Sets the icon shown when input value is not valid (warningBallType: "icon")
    box.setWarningIcon = function(path) {
        box.warningIconFile = path;
        if (box.warningBallType == "icon" && box.status == 2) applyWarningBallStyle("warning");
    };

    // Sets the unit label (e.g., KG) displayed near the input field
    box.setUnitText = function(text) {
        box.unitText = text;
        if (!box.unit || typeof box.unit.text === "undefined") return;

        setText(box.unit, text);
    };

    // *** OBJECT VIEW:

        // BOX: Background
        box.background = Box(0, 0, "100%", "100%", {
            color: box.backgroundColor,
            border: 1,
            borderColor: box.backBorderColor,
        });
        box.background.css = {
            borderTopRightRadius: box.backBorderTopRound + "px",
            borderTopLeftRadius: box.backBorderTopRound + "px",
            borderBottomRightRadius: box.backBorderBottomRound + "px",
            borderBottomLeftRadius: box.backBorderBottomRound + "px",
        };
        // titlePosition "above": the background is only the field, under the title
        if (isTitleAbove) {
            box.background.top = fieldTop;
            box.background.height = isAutoHeight ? box.inputHeight : "calc(100% - " + fieldTop + "px)";
        }

        // BOX: Bottom Line
        box.line = Box({
            left: 0,
            bottom: 0,
            width: "100%",
            height: 2,
            color: box.lineColor,
        });
        if (isTitleAbove && isAutoHeight) box.line.css = { bottom: "auto", top: (fieldTop + box.inputHeight - 2) + "px" };

        // GROUP: Title, input, description
        box.inputGroup = AutoLayout({
            flow: "vertical",
            align: "left top",
            height: "auto",
            padding: isTitleAbove ? [box.leftPadding, 0, box.rightPadding, 0] : [box.leftPadding, box.fieldPadding, box.rightPadding, box.fieldPadding],
            gap: isTitleAbove ? box.titleGap : 0,
        });
        that.position = "relative";

            // LABEL: Title 
            box.title = Label({
                fontSize: box.titleFontSize,
                textColor: box.titleTextColor,
                bold: box.titleBold,
            });
            setText(box.title, box.titleText);
            if (box.titleLetterSpacing) that.css.letterSpacing = box.titleLetterSpacing;
            // WHY: over the field the title starts at its edge, not at the text inside it
            if (isTitleAbove) that.css = { lineHeight: titleLineHeight + "px", marginLeft: -box.leftPadding + "px", whiteSpace: "nowrap" };
            if (isTitleAbove && !hasTitleRow) that.visible = 0;

            // INPUT: Main object
            if(box.createInput == 1) {
                box.input = Input({
                    text: box.value,
                    minimal: 1,
                    fontSize: box.inputFontSize,
                    height: box.inputHeight,
                    color: "transparent",
                    width: "100%",
                    textColor: box.inputTextColor,
                });
                that.inputElement.style.padding = "0px 0px";
                that.inputElement.placeholder = box.placeholder;
                box.applyTextColors(that.inputElement);
                that.inputElement.maxLength = box.maxLength;
                that.inputElement.setAttribute("aria-label", box.titleText);
            } else {
                box.inputBox = Box({
                    color: "transparent",
                    height: box.inputHeight,
                    width: "100%",
                });
            }

            // LABEL: Description
            if (box.showDescription == 1) {
                box.description = Label({
                    fontSize: box.descriptionFontSize,
                    textColor: box.descriptionTextColor,
                });
                setText(box.description, box.descriptionText);
                box.description.css.fontStyle = "italic";
                if (isTitleAbove) box.description.css = { marginLeft: -box.leftPadding + "px" };
            }
            
        endAutoLayout();

        // GROUP: right box
        if (box.showRightBox == 1) {
        box.rightBox = AutoLayout({
            flow: "horizontal",
            align: "right bottom",
            padding: [5, 7],
            gap: 0,
        });

            // LABEL: Unit
            if (box.showUnit == 1) {
            box.unit = Label(box.unitStyle);
            setText(box.unit, box.unitText);
            }

        endAutoLayout();
        placeOverField(box.rightBox);
        }

        // GROUP: left box
        if (box.showLeftBox == 1) {
        box.leftBox = AutoLayout({
            flow: "horizontal",
            align: "left center",
            padding: [20, isTitleAbove ? 0 : 14],
            gap: 6,
        });

        endAutoLayout();
        placeOverField(box.leftBox);
        }

        // BOX: Warning Ball:
        const isIconBall = (box.warningBallType == "icon");
        const ballSize = isIconBall ? box.warningIconSize : box.warningBallSize;
        // WHY in the middle of the right padding over a field under its title: the ball belongs to the row of the text
        const ballRight = isTitleAbove ? Math.round((box.rightPadding - ballSize) / 2) : 5;
        box.warningBall = Box({
            right: ballRight,
            top: isTitleAbove ? fieldTop + Math.round((box.inputHeight - ballSize) / 2) : 5,
            width: ballSize,
            height: ballSize,
            border: isIconBall ? 0 : box.warningBallBorder,
            color: isIconBall ? "transparent" : box.requiredColor,
            borderColor: box.warningBallBorderColor,
            round: 100,
            opacity: 0,
        });

        // ICON: Warning icon (only in icon mode)
        if (isIconBall) {
            box.warningBall.icon = Icon({
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
            });
            box.warningBall.add(that);
        }
        box.warningBall.css.transform = HIDDEN_BALL_SCALE;
        if (box.animatedWarningBall == 1) {
            box.warningBall.setMotion(WARNING_BALL_MOTION);
        }

        // TOOLTIP: warningBall
        // WHY the check: a page without comp/tooltip.js gets the ball with no bubble, not an error.
        if (typeof Tooltip !== "undefined") {
            box.warningBall.tooltip = Tooltip({
                target: box.warningBall,
                hintText: "",
                hintPosition: "left",
                lbl_border: box.tooltipStyle.border,
                lbl_color: box.tooltipStyle.color || "white",
                lbl_textColor: box.tooltipStyle.textColor,
                lbl_borderColor: box.tooltipStyle.borderColor,
                lbl_fontSize: box.tooltipStyle.fontSize,
                lbl_round: box.tooltipStyle.round,
            });
        }

    // *** OBJECT INIT CODE:
    
    // Event bindings
    if(box.createInput == 1) {

        const inputElem = box.input.inputElement;

        box.focusFunc = function () {
            box.paintFocus(1);
            box.onFocus(box);
        }
        inputElem.addEventListener("focus", function(){ box.focusFunc() });

        box.blurFunc = function () {
            box.paintFocus(0);
            box.onBlur(box);
        }
        inputElem.addEventListener("blur", function(){ box.blurFunc() });

        box.inputFunc = function () { // A child component can override it.
            box.applyFormattedValueToInput();
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            box.value = inputElem.value;
            box.onChange(box);
        }
        inputElem.addEventListener("input", function(){ box.inputFunc() });

        box.checkInputValue();
    }

    // WHY on box: the field and the warning ball are one field for the user (the title gets no mouse: pointer-events none)
    box.onHoverChange(function(self, isHover) {
        isFieldHover = isHover ? 1 : 0;
        box.background.color = getBackgroundColor();
        // WHY only with hoverBackBorderColor: a page that colors the edge itself (background.borderColor) keeps it
        if (box.hoverBackBorderColor) paintBackBorder();
    });

    return endObject(box);

};

// The color of the placeholder text: a CSS variable on the <input>, read by one CSS rule.
TextField.setPlaceholderColor = function(inputElement, color) {
    basic.addCss("text-field-placeholder", ".text-field-placeholder::placeholder { color: var(--text-field-placeholder); opacity: 1; }");
    inputElement.classList.add("text-field-placeholder");
    inputElement.style.setProperty("--text-field-placeholder", color);
};

// *** STYLE PACKAGES:
// WHY style: {} in every package: TextField has no "style" object, its look is in flat params. A package with
//      a "style" key is a package of params (basic.applyStylePackage, v26.10.27): its keys fill the params
//      that were not given. Without the key they would go into params.style and change nothing.
TextField.styles = {

    // The light look of the kit (_designs/text-field.htm), the default: the title over a 44 px white field with one
    // thin line and round 8, no line under it; a stronger edge under the mouse, the accent while typing; the marks
    // are icons (required: a small gray one), the hint in a white bubble.
    light: {
        style: {},
        leftPadding: 15, // WHY 15 and 45: the draft has 14 and 44 inside the 1 px line of the field
        rightPadding: 45, // the room of the mark
        titleFontSize: 13,
        inputFontSize: 15,
        inputHeight: 44,
        descriptionFontSize: 13,
        titlePosition: "above",
        titleGap: 6,
        backgroundColor: "#FFFFFF",
        focusBackgroundColor: "#FFFFFF",
        hoverBackgroundColor: "",
        lineColor: "transparent",
        focusLineColor: "transparent",
        backBorderColor: Black(0.12),
        focusBackBorderColor: "#3D7A6B", // the accent of the kit
        hoverBackBorderColor: Black(0.3),
        backBorderTopRound: 8,
        backBorderBottomRound: 8,
        titleTextColor: Black(0.65),
        titleBold: 1,
        inputTextColor: Black(0.88),
        placeholderColor: Black(0.38),
        descriptionTextColor: Black(0.55),
        warningBallType: "icon",
        warningIconSize: 20,
        eyeIconSize: 24, // PasswordField: the eye as wide as the marks (its picture is 20 px wide at 24)
        warningColor: "#E5885E",
        warningBorderColor: "#E5885E",
        requiredIconColor: Black(0.35),
        tooltipStyle: { color: "#FFFFFF", hintColor: "#FFFFFF", textColor: Black(0.88), border: 1, borderColor: Black(0.15), round: 6, fontSize: 13 },
        unitStyle: { padding: [10, 3], color: "#F2F3F0", textColor: Black(0.7), round: 6, fontSize: 13 },
        // WHY spacing: the select is a chip on the field; the white of the field shows over and under it
        selectStyle: { color: Black(0.04), round: 6, spacing: 6, invertIconColor: 0, listBackgroundColor: "#FFFFFF", listTextColor: Black(0.88), listOverTextColor: "#3D7A6B", listBorderColor: Black(0.12) },
    },

    // The dark look of the kit: the same shapes on the dark surface.
    dark: {
        style: {},
        leftPadding: 15, // WHY 15 and 45: the draft has 14 and 44 inside the 1 px line of the field
        rightPadding: 45, // the room of the mark
        titleFontSize: 13,
        inputFontSize: 15,
        inputHeight: 44,
        descriptionFontSize: 13,
        titlePosition: "above",
        titleGap: 6,
        backgroundColor: "#232322",
        focusBackgroundColor: "#232322",
        hoverBackgroundColor: "",
        lineColor: "transparent",
        focusLineColor: "transparent",
        backBorderColor: White(0.12),
        focusBackBorderColor: "#65A293", // the accent of the kit on a dark page
        hoverBackBorderColor: White(0.32),
        backBorderTopRound: 8,
        backBorderBottomRound: 8,
        titleTextColor: White(0.65),
        titleBold: 1,
        inputTextColor: White(0.9),
        inputColorScheme: "dark",
        placeholderColor: White(0.35),
        descriptionTextColor: White(0.5),
        warningBallType: "icon",
        warningIconSize: 20,
        eyeIconSize: 24, // PasswordField: the eye as wide as the marks (its picture is 20 px wide at 24)
        warningColor: "#F0A07A",
        warningBorderColor: "#F0A07A",
        requiredIconColor: White(0.35),
        tooltipStyle: { color: "#2C2C2B", hintColor: "#2C2C2B", textColor: White(0.9), border: 1, borderColor: White(0.2), round: 6, fontSize: 13 },
        unitStyle: { padding: [10, 3], color: White(0.1), textColor: White(0.85), round: 6, fontSize: 13 },
        selectStyle: { color: White(0.06), round: 6, spacing: 6, invertIconColor: 1, listBackgroundColor: "#2C2C2B", listTextColor: White(0.9), listOverTextColor: "#65A293", listBorderColor: White(0.12) },
    },

    // The first look (TextFieldDefaults): a light field with a line under it.
    modern: { style: {} },

    // The dark theme of modern: the same shape (a line under the field, no border, the warning as a colored
    // ball), each color of modern turned to its dark side. (The rounded, bordered dark fields are ozdenDark.)
    modernDark: {
        style: {},
        backgroundColor: "#232322", // modern #F6F6F6
        focusBackgroundColor: "#2A2C27", // modern #F3F4E0: the same soft green tint, on dark
        lineColor: White(0.75), // modern #373836: the strong line under the field
        focusLineColor: "#65A293", // the same accent
        backBorderColor: Black(0),
        focusBackBorderColor: Black(0),

        titleTextColor: White(0.6), // modern #555555
        inputTextColor: White(0.9), // modern #373836
        placeholderColor: White(0.3),
        descriptionTextColor: White(0.4), // modern #999999
        warningBallBorderColor: White(0.75), // modern #373836: the color of the line

        requiredColor: "#141414", // modern white: the ball takes the color of the page under it
        requiredIconColor: White(0.75), // modern #373836
        warningColor: "indianred", // modern #E5885E

        tooltipStyle: {
            hintColor: "#262624", // the show password button: a dark bubble
            textColor: White(0.9), // modern #141414 on a white ball
            borderColor: White(0.75), // modern #141414
        },

        unitStyle: {
            color: White(0.85), // modern #373836: a light pill on the dark field
            textColor: "#1A1A19", // modern white
        },

        selectStyle: {
            color: White(0.06), // modern rgba(0,0,0,0.05)
            invertIconColor: 1,
            listBackgroundColor: "#232322",
            listTextColor: White(0.85),
            listBorderColor: White(0.12),
        },
    },

    // A gray rounded field,
    // no line, a soft dark border on focus, the warning shown as an icon.
    ozden: {
        style: {},
        backgroundColor: "#F6F6F6",
        focusBackgroundColor: "#FFFFFF", // F6F6F6
        hoverBackgroundColor: "#F6F6F6", // a little darker under the mouse EFEFEF
        lineColor: Black(0),
        focusLineColor: Black(0),
        backBorderColor: Black(0.05), // a faint edge
        focusBackBorderColor: Black(0.4),
        backBorderTopRound: 8,
        backBorderBottomRound: 8,
        titleBold: 1, // as ozdenDark
        warningBallType: "icon",
        warningColor: "#E5885E", // E5885E, F1C74A

        tooltipStyle: {
            round: 6, // as ozdenDark
        },

        unitStyle: {
            color: "#373836EE", // the count of the message (TextAreaField)
            textColor: "white",
        },
    },

    // A see-through field. The popups and the edge of the warning ball are the black of the kit (the dark cards
    // #1A1A19); the focus line is white.
    ozdenDark: {
        style: {},
        backgroundColor: "rgba(255, 255, 255, 0.04)", // FIELD_BG
        focusBackgroundColor: "rgba(255, 255, 255, 0.07)", // FIELD_BG_SELECTED
        hoverBackgroundColor: "rgba(255, 255, 255, 0.04)", // a little lighter under the mouse
        lineColor: Black(0),
        focusLineColor: Black(0),
        backBorderColor: "rgba(255, 255, 255, 0.10)", // FIELD_LINE
        focusBackBorderColor: White(0.45), // the focus line: a white one
        backBorderTopRound: 10,
        backBorderBottomRound: 10,

        titleTextColor: "rgba(255, 255, 255, 0.62)", // SITE.ON_DARK_SOFT
        titleBold: 1, // SITE.BOLD
        titleLetterSpacing: "0.06em",
        inputTextColor: "rgba(255, 255, 255, 0.94)", // SITE.ON_DARK
        inputColorScheme: "dark",
        placeholderColor: "rgba(255, 255, 255, 0.35)", // SITE.ON_DARK_FAINT (the site leaves it to the browser)
        descriptionTextColor: "rgba(255, 255, 255, 0.35)", // SITE.ON_DARK_FAINT
        warningBallBorderColor: "#1A1A19", // the page under the field: a dark card of the kit

        warningBallType: "icon",
        warningColor: "#E5885E", // SITE.ACCENT
        requiredIconColor: "rgba(255, 255, 255, 0.28)",

        tooltipStyle: {
            color: "#262624", // a popup: a little lighter than the dark card #1A1A19
            textColor: "rgba(255, 255, 255, 0.94)", // SITE.ON_DARK
            borderColor: "rgba(255, 255, 255, 0.22)", // FIELD_LINE_HOVER
            round: 6,
        },

        unitStyle: {
            color: "rgba(255, 255, 255, 0.07)", // FIELD_BG_SELECTED
            textColor: "rgba(255, 255, 255, 0.94)", // SITE.ON_DARK
        },

        selectStyle: {
            color: "rgba(255, 255, 255, 0.07)", // FIELD_BG_SELECTED
            invertIconColor: 1,
            listBackgroundColor: "#262624", // as the tooltip
            listTextColor: "rgba(255, 255, 255, 0.94)", // SITE.ON_DARK
            listBorderColor: "rgba(255, 255, 255, 0.22)", // FIELD_LINE_HOVER
        },
    },

};
TextField.styles.classic = TextField.styles.modern; // the old name of modern: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): the title (12 px) over the field, a 28 px field of a line with a
// 13 px text, no fill; the line gets darker under the mouse and turns ink while typing. minimalDark: the same on a
// dark window. (EmailField, PasswordField, TextAreaField... take them too.)
TextField.createMinimalStyle = function (colors) {
    return {
        style: {},
        leftPadding: 10,
        rightPadding: 26, // WHY: the room of the warning dot
        titleFontSize: 12,
        inputFontSize: 13,
        inputHeight: 28,
        fieldPadding: 0,
        descriptionFontSize: 12,
        titlePosition: "above",
        titleGap: 4,
        backgroundColor: "transparent",
        focusBackgroundColor: "transparent",
        hoverBackgroundColor: "",
        lineColor: "transparent",
        focusLineColor: "transparent",
        backBorderColor: colors.edge, // WHY edge: the line that shows the field (3:1 at least, as WCAG asks of a control)
        focusBackBorderColor: colors.ink,
        hoverBackBorderColor: colors.edgeHover,
        backBorderTopRound: 4,
        backBorderBottomRound: 4,
        titleTextColor: colors.softText,
        titleBold: 0,
        inputTextColor: colors.text,
        inputColorScheme: colors.colorScheme,
        placeholderColor: colors.faintText,
        descriptionTextColor: colors.softText,
        requiredColor: colors.faintText, // a small gray dot: the field is required
        warningBallBorderColor: "transparent",
        warningColor: colors.danger, // a small dot in the danger color, and the edge of the field in it
        warningBorderColor: colors.danger,
        warningBallType: "color",
        warningBallSize: 8,
        warningBallBorder: 0,
        requiredIconColor: colors.softText,
        tooltipStyle: { color: colors.ground, hintColor: colors.ground, textColor: colors.text, border: 1, borderColor: colors.line, round: 4, fontSize: 12 },
        selectStyle: { color: "transparent", invertIconColor: colors.invertIcons, listBackgroundColor: colors.ground, listTextColor: colors.text, listOverTextColor: colors.ink, listBorderColor: colors.line },
        invertIconColor: colors.invertIcons,
        unitStyle: { padding: [6, 1], color: "transparent", textColor: colors.softText, round: 4, fontSize: 11 },
        // TextAreaField: a thin scroll bar in the color of the text, with no dots
        scrollBarStyle: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_mouseOverWidth: 4, bar_opacity: 0.45, bar_mouseOverOpacity: 0.9, bar_padding: 2, showDots: 0 },
    };
};
TextField.MINIMAL_COLORS = {
    ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2),
    lineHover: Black(0.45), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", danger: "#C24A36", colorScheme: "", invertIcons: 0, scrollBar: "#373836",
};
TextField.styles.minimal = TextField.createMinimalStyle(TextField.MINIMAL_COLORS);
TextField.MINIMAL_DARK_COLORS = {
    ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18),
    lineHover: White(0.42), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", danger: "#FF9F93", colorScheme: "dark", invertIcons: 1, scrollBar: "#CFCFCD",
};
TextField.styles.minimalDark = TextField.createMinimalStyle(TextField.MINIMAL_DARK_COLORS);
