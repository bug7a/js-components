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

"use strict";

// Default values
const InputBDefaults = {

    key: "0",
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

    isRequired: 0,
    requiredText: "Required",
    requiredColor: "white",
    warningText: "Invalid value format",
    warningColor: "#E5885E", // "#F1BF3C"

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
        //color: "white",
        //border: 1,
        //borderColor: "#999999",
        //round: 2,
        fontSize: 14,
    },

    onFocus: function() {},
    onBlur: function() {},
    onEdit: function() {},

};

const InputB = function(params = {}) {

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
    /* */

    // *** PUBLIC VARIABLES:
    /* */

    // *** PRIVATE FUNCTIONS:

    const showWarningBall = function() {
        box.warningBall.withMotion(function() {
            box.warningBall.opacity = 1;
            box.warningBall.clickable = 1;
            box.warningBall.elem.style.transform = "scale(1)";
        });
    }

    const hideWarningBall = function() {
        box.warningBall.opacity = 0;
        box.warningBall.clickable = 0;
        box.warningBall.elem.style.transform = "scale(0.3)";
    }

    // *** PUBLIC FUNCTIONS:

    box.checkIfInputIsRequiredAndEmpty = function() {
        if (box.isRequired) {
            if (box.getInputValue().length === 0) {
                box.showWarning();
                /*
                hideWarningBall();
                box.warningBall.tooltip.setHintText(box.requiredText);
                box.warningBall.tooltip.setLbl_color(box.requiredColor);
                box.warningBall.color = box.requiredColor;
                showWarningBall();
                */
            } else {
                box.hideWarning();
                //hideWarningBall();
            }
        } else {
            box.hideWarning();
            //hideWarningBall();
        }
    };

    /*
    box.isNotEmpty = function() {
        return (box.getInputValue() == "") ? 0 : 1;
    }
    */

    // Sets the title text for the input component
    box.setTitle = function(titleText) {
        box.titleText = titleText;
        if (box.title && typeof box.title.text !== "undefined") {
            box.title.text = titleText;
            if (box.input) {
                box.input.inputElement.setAttribute("aria-label", box.titleText);
            }
        }
    };
    
    // Sets the description below or next to the input field
    box.setDescription = function(descriptionText) {
        box.descriptionText = descriptionText;
        if (box.description && typeof box.description.text !== "undefined") {
            box.description.text = descriptionText;
        }
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
        box.inputValue = value;
        box.input.text = value;
    };

    // Returns the current value inside the input field
    box.getInputValue = function() {
        return box.inputValue;
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

    // Sets the unit label (e.g., KG) displayed near the input field
    box.setUnitText = function(text) {
        box.unitText = text;
        
        if (box.unit && typeof box.unit.text !== "undefined") {
            box.unit.text = text;
        }
    };

    // Shows a warning manually (used externally)
    box.showWarning = function() {
        if (box.isRequired && box.getInputValue().length === 0) {
            // If required and empty, show required tooltip
            hideWarningBall();
            box.warningBall.color = box.requiredColor;
            box.warningBall.tooltip.setHintText(box.requiredText);
            box.warningBall.tooltip.setLbl_color(box.requiredColor);
            showWarningBall();
        } else {
            // Otherwise, show warning
            box.warningBall.color = box.warningColor;
            box.warningBall.tooltip.setHintText(box.warningText);
            box.warningBall.tooltip.setLbl_color(box.warningColor);
            showWarningBall();
        }
    };

    // Hides the warning icon and tooltip manually
    box.hideWarning = function() {
        hideWarningBall();
    };

    // *** OBJECT VIEW:

        // BOX: Background
        box.background = Box(0, 0, "100%", "100%", {
            color: box.backgroundColor,
        });
        // Corner Radius
        that.elem.style.borderTopRightRadius = "2px";
        that.elem.style.borderTopLeftRadius = "2px";

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
                textColor: "#555555",
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
                });
                that.inputElement.style.padding = "0px 0px";
                that.inputElement.placeholder = box.placeholder;
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
                    textColor: "#999999",
                });
                that.elem.style.fontStyle = "italic";
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
            /*
            box.unit = Label({
                text: box.unitText,
                padding: [6, 0],
                color: "white",
                border: 1,
                borderColor: "#999999",
                round: 2,
                fontSize: 16,
            });
            */
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
        box.warningBall = Box({
            right: 5,
            top: 5,
            width: 16,
            height: 16,
            border: 2,
            color: box.requiredColor,
            borderColor: "#373836",
            round: 100,
            opacity: 0,
        });
        box.warningBall.elem.style.transform = "scale(0.3)";
        box.warningBall.setMotion("opacity 0.2s, transform 0.2s");

        // TOOLTIP: warningBall
        box.warningBall.tooltip = Tooltip({
            target: box.warningBall,
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
    
    // Event bindings
    if(box.createInput == 1) {

        const inputElem = box.input.inputElement;

        inputElem.addEventListener("focus", function () {
            box.background.color = box.selectedBackgroundColor;
            box.line.color = box.selectedLineColor;
            box.onFocus();
        });
        inputElem.addEventListener("blur", function () {
            box.background.color = box.backgroundColor;
            box.line.color = box.lineColor;
            box.onBlur();
        });
        inputElem.addEventListener("input", function () {
            box.inputValue = box.input.text;
            box.checkIfInputIsRequiredAndEmpty();
            box.onEdit();
        });
    }

    box.checkIfInputIsRequiredAndEmpty();

    return endObject(box);

};
