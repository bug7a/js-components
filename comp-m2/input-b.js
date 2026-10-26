/* Bismillah */

/*

InputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: 25.07
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
WebSite: https://bug7a.github.io/js-components

*/

/*

- .status 
-- 0: okay, 1: empty but required, 2: not valid

- input.applyFormattedValueToInput(value);
-- If you want to reformat the value override this func.

- input.isValid(value);

- input.setInputValue("Text");           // Set value programmatically

- input.getInputValue();                  // Get current value

- input.setPlaceholder("Text");          // Change placeholder

- input.setTitle("Title");               // Set title text

- input.setDescription("Description");   // Add description

- input.setRequired(1);                   // Mark as required

- input.setWarningText("Warning text");  // Set invalid input warning

- input.setRequiredIcon("icons/required.svg"); // Icon for required state (warningBallType: "icon")

- input.setWarningIcon("icons/warning.svg");   // Icon for invalid state (warningBallType: "icon")

- warningBallType: "color" | "icon"
-- "color": Top-right colored ball (requiredColor / warningColor).
-- "icon": Top-right icon (requiredIcon / warningIcon). Empty path uses the built-in icon.

- tooltipStyle: { color, textColor, border, borderColor, round, fontSize }
-- The tooltip of the warning ball. color "": requiredColor / warningColor (the old look).

- styleName: "classic" (default) | "dark"  (InputB.styles)
-- The look of InputB is in flat params (backgroundColor, lineColor, titleTextColor...), not in one
   "style" object. So a style package here is a package of params: any param can be in it, also
   an image (requiredIcon, warningIcon). Order: your params > the package > InputBDefaults.
-- InputB({ styleName: "dark" })
-- InputB({ styleName: "dark", selectedLineColor: "#588ABE" })   // one param of the package changed
-- InputB.styles.myStyle = { backgroundColor: "#FFF8E8", requiredIcon: "icons/star.svg" };

*/

"use strict";

// Default values
const InputBDefaults = {

    key: "0",
    styleName: "classic", // "classic", "dark" or a name added to InputB.styles
    type: "text",
    width: 350,
    height: "auto",
    leftPadding: 20,
    rightPadding: 60,
    titleText: "INPUT NAME",
    placeholder: "input value",
    inputValue: "",
    maxChar: 30,
    createDescription: 0,
    descriptionText: "",

    backgroundColor: "#F6F6F6",
    selectedBackgroundColor: "#F3F4E0", // "#F1E2C4", "#F4FAFF",
    lineColor: "#373836",
    selectedLineColor: "#65A293", // "#F1E2C4", "#588ABE",
    backBorderColor: Black(0),
    selectedBackBorderColor: Black(0),
    backBorderTopRound: 2,
    backBorderBottomRound: 0,

    titleTextColor: "#555555",
    inputTextColor: "#373836",
    placeholderColor: "", // "": the color of the browser
    descriptionTextColor: "#999999",
    warningBallBorderColor: "#373836",

    isRequired: 0,
    requiredText: "Required",
    requiredColor: "white",
    warningText: "Invalid value format",
    warningColor: "#E5885E", // "#F1BF3C"
    animatedWarningBall: 1,

    warningBallType: "color", // "color": colored ball, "icon": icon image
    warningIconSize: 20,
    requiredIcon: "", // image path or data URI. "": built-in icon
    warningIcon: "", // image path or data URI. "": built-in icon
    requiredIconColor: "#373836", // built-in required icon color (built-in warning icon uses warningColor)

    // The tooltip of the warning ball (required / warning text)
    tooltipStyle: {
        color: "", // "": requiredColor / warningColor
        textColor: "#141414",
        border: 1,
        borderColor: "#141414",
        round: 2,
        fontSize: 14,
    },

    createLeftBox: 0,
    createRightBox: 0,
    createUnit: 0,
    createInput: 1,
    unitText: "",
    unitStyle: {
        padding: [12, 4],
        color: "#373836",
        textColor: "white",
        round: 40,
        fontSize: 14,
    },

    onFocus: function() {},
    onBlur: function() {},
    onEdit: function() {},

};

const InputB = function(params = {}) {

    InputB.applyStylePackage(params);

    // BOX: Component container
    const box = startObject(InputBDefaults, params);

    // *** DATA CONTROL:
    if (box.descriptionText != "") {
        box.createDescription = 1;
    }

    if (box.createUnit == 1 || box.unitText != "") {
        box.createUnit = 1;
        box.createRightBox = 1;
    }

    // *** PRIVATE VARIABLES:
    const WARNING_BALL_SIZE = 16; // The size of the colored ball (warningBallType: "color")
    const SHOWN_BALL_SCALE = "scale(1)";
    const HIDDEN_BALL_SCALE = "scale(0.3)"; // WHY: The ball grows from small when it is shown.
    const WARNING_BALL_MOTION = "opacity 0.2s, transform 0.2s";
    const OUT_OF_SCREEN_TOP = -1000;

    // *** PUBLIC VARIABLES:
    
    // [var] 0: okay, 1: empty but required, 2: not valid
    box.status = 0;

    // *** PRIVATE FUNCTIONS:

    const makeWarningBallVisible = function() {
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
            return box.requiredIcon || createBuiltInIcon("required", box.requiredIconColor);
        }
        return box.warningIcon || createBuiltInIcon("warning", box.warningColor);
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
        box.warningBall.tooltip.setHintText(hintText);
        box.warningBall.tooltip.setLbl_color(box.tooltipStyle.color || ballColor);
        showWarningBall();
    };

    const showWarning = function() {
        if (box.isRequired && box.getInputValue().length === 0) {
            showWarningBallOf("required", box.requiredText, box.requiredColor);
            box.status = 1;
            return;
        }
        showWarningBallOf("warning", box.warningText, box.warningColor);
        box.status = 2;
    };

    const hideWarning = function() {
        hideWarningBall();
        box.status = 0;
    };

    // *** PUBLIC FUNCTIONS:

    // A child component formats the value here: it reads getInputValue() and puts it back with setInputValue().
    box.applyFormattedValueToInput = function(value) {
    }

    box.checkIfInputIsRequiredAndEmpty = function() {
        if (box.isRequired && box.getInputValue().length === 0) {
            showWarning();
            return;
        }
        hideWarning();
    };

    box.isValid = function() {
        return 1;
    };

    box.showWarningIfNotValid = function(isValid) {
        if (box.getInputValue().length === 0) return;

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
    box.setTitle = function(titleText) {
        box.titleText = titleText;
        if (!box.title || typeof box.title.text === "undefined") return;

        box.title.text = titleText;
        if (box.input) {
            box.input.inputElement.setAttribute("aria-label", box.titleText);
        }
    };
    
    // Sets the description below or next to the input field
    box.setDescription = function(descriptionText) {
        box.descriptionText = descriptionText;
        if (!box.description || typeof box.description.text === "undefined") return;

        box.description.text = descriptionText;
    };
    
    // Sets the maximum number of characters allowed in the input
    box.setMaxChar = function(count) {
        box.maxChar = count;
        box.input.inputElement.maxLength = count;
    };

    // Sets the placeholder text for the input field
    box.setPlaceholder = function(text) {
        box.placeholder = text;
        box.input.inputElement.placeholder = text;
    };

    // Sets the input's current value programmatically
    box.setInputValue = function(value) {
        if (value != box.input.text) {
            box.inputValue = value;
            box.input.text = value;
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
        }
    };

    // Returns the current value inside the input field
    box.getInputValue = function() {
        return box.input.text;
    };

    // Sets the background color of the input element itself
    box.setBackgroundColor = function(color) {
        box.backgroundColor = color;
        box.background.color = color;
    };

    // Sets the background color of the input when selected/focused
    box.setSelectedBackgroundColor = function(color) {
        box.selectedBackgroundColor = color;
    };

    // Sets the line color displayed under the input by default
    box.setLineColor = function(color) {
        box.lineColor = color;
        box.line.color = color;
    };

    // Sets the underline color when input is selected/focused
    box.setSelectedLineColor = function(color) {
        box.selectedLineColor = color;
    };

    // Enables required field validation and sets the custom message
    box.setRequired = function(isRequired) {
        box.isRequired = isRequired ? 1 : 0;
        box.checkIfInputIsRequiredAndEmpty();
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
        box.requiredIcon = path;
        if (box.warningBallType == "icon" && box.status == 1) applyWarningBallStyle("required");
    };

    // Sets the icon shown when input value is not valid (warningBallType: "icon")
    box.setWarningIcon = function(path) {
        box.warningIcon = path;
        if (box.warningBallType == "icon" && box.status == 2) applyWarningBallStyle("warning");
    };

    // Sets the unit label (e.g., KG) displayed near the input field
    box.setUnitText = function(text) {
        box.unitText = text;
        if (!box.unit || typeof box.unit.text === "undefined") return;

        box.unit.text = text;
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

        // BOX: Bottom Line
        box.line = Box({
            left: 0,
            bottom: 0,
            width: "100%",
            height: 2,
            color: box.lineColor,
        });

        // GROUP: Title, input, description
        box.inputGroup = AutoLayout({
            flow: "vertical",
            align: "left top",
            height: "auto",
            padding: [box.leftPadding, 14, box.rightPadding, 14],
            gap: 0,
        });
        that.position = "relative";

            // LABEL: Title 
            box.title = Label({
                text: box.titleText,
                fontSize: 16,
                textColor: box.titleTextColor,
            });

            // INPUT: Main object
            if(box.createInput == 1) {
                box.input = Input({
                    text: box.inputValue,
                    minimal: 1,
                    fontSize: 20,
                    height: 40,
                    color: "transparent",
                    width: "100%",
                    textColor: box.inputTextColor,
                });
                that.inputElement.style.padding = "0px 0px";
                that.inputElement.placeholder = box.placeholder;
                if (box.placeholderColor) InputB.setPlaceholderColor(that.inputElement, box.placeholderColor);
                that.inputElement.maxLength = box.maxChar;
                that.inputElement.setAttribute("aria-label", box.titleText);
            } else {
                box.inputBox = Box({
                    color: "transparent",
                    height: 40,
                    width: "100%",
                });
            }

            // LABEL: Description
            if (box.createDescription == 1) {
                box.description = Label({
                    text: box.descriptionText,
                    fontSize: 14,
                    textColor: box.descriptionTextColor,
                });
                box.description.css.fontStyle = "italic";
            }
            
        endAutoLayout();

        // GROUP: right box
        if (box.createRightBox == 1) {
        box.rightBox = AutoLayout({
            flow: "horizontal",
            align: "right bottom",
            padding: [5, 7],
            gap: 0,
        });

            // LABEL: Unit
            if (box.createUnit == 1) {
            box.unit = Label(box.unitStyle);
            box.unit.text = box.unitText;
            }

        endAutoLayout();
        }

        // GROUP: left box
        if (box.createLeftBox == 1) {
        box.leftBox = AutoLayout({
            flow: "horizontal",
            align: "left center",
            padding: [20, 14],
            gap: 6,
        });

        endAutoLayout();
        }

        // BOX: Warning Ball:
        const isIconBall = (box.warningBallType == "icon");
        const ballSize = isIconBall ? box.warningIconSize : WARNING_BALL_SIZE;
        box.warningBall = Box({
            right: 5,
            top: 5,
            width: ballSize,
            height: ballSize,
            border: isIconBall ? 0 : 2,
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

    // *** OBJECT INIT CODE:
    
    // Event bindings
    if(box.createInput == 1) {

        const inputElem = box.input.inputElement;

        box.focusFunc = function () {
            box.background.color = box.selectedBackgroundColor;
            box.background.borderColor = box.selectedBackBorderColor;
            box.line.color = box.selectedLineColor;
            box.onFocus();
        }
        inputElem.addEventListener("focus", function(){ box.focusFunc() });

        box.blurFunc = function () {
            box.background.color = box.backgroundColor;
            box.background.borderColor = box.backBorderColor;
            box.line.color = box.lineColor;
            box.onBlur();
        }
        inputElem.addEventListener("blur", function(){ box.blurFunc() });

        box.inputFunc = function () { // A child component can override it.
            box.applyFormattedValueToInput();
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            box.inputValue = inputElem.value;
            box.onEdit();
        }
        inputElem.addEventListener("input", function(){ box.inputFunc() });

        box.checkIfInputIsRequiredAndEmpty();
    }

    return endObject(box);

};

// *** STYLE PACKAGES:

// WHY: The packages are packages of params (not of a "style" object, see the notes at the top), so
//      basic.applyStylePackage (it fills params.style) is not used. The package fills only the params
//      that were not given; mergeIntoIfMissing copies its objects, so the package itself never changes.
// USAGE: InputB.applyStylePackage(params) // the first line of InputB (and of a component that extends it)
InputB.applyStylePackage = function(params) {
    const name = params.styleName || InputBDefaults.styleName;
    const stylePackage = InputB.styles[name];
    if (!stylePackage) console.warn("InputB style package not found: " + name);
    mergeIntoIfMissing(params, stylePackage || {});
    return params;
};

// The color of the placeholder text: a CSS variable on the <input>, read by one CSS rule.
InputB.setPlaceholderColor = function(inputElement, color) {
    basic.addCss("input-b-placeholder", ".input-b-placeholder::placeholder { color: var(--input-b-placeholder); opacity: 1; }");
    inputElement.classList.add("input-b-placeholder");
    inputElement.style.setProperty("--input-b-placeholder", color);
};

InputB.styles = {

    // The default look (InputBDefaults): a light field with a line under it.
    classic: {},

    // The dark fields of the Ozden Panel (webpage-admin-panel, theme "dark"): a rounded field on a
    // dark card, a thin border, the accent color on focus, no line.
    dark: {
        backgroundColor: "#232322", // surface2: a field
        selectedBackgroundColor: "#2C2C2A", // surface3
        lineColor: "transparent",
        selectedLineColor: "transparent",
        backBorderColor: White(0.1), // the border of a card
        selectedBackBorderColor: "#65A293", // accent
        backBorderTopRound: 8,
        backBorderBottomRound: 8,

        titleTextColor: White(0.45),
        inputTextColor: White(0.9),
        placeholderColor: White(0.3),
        descriptionTextColor: White(0.4),
        warningBallBorderColor: "#1A1A19", // surface: the card under the field

        requiredColor: "#E66767", // danger
        warningColor: "#E66767",
        requiredIconColor: White(0.45),

        tooltipStyle: {
            textColor: "#141414",
            borderColor: "#141414",
        },

        unitStyle: {
            color: "#2C2C2A", // surface3
            textColor: White(0.85),
        },
    },

};
