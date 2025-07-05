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
    key: 0,
    width: 350,
    height: "auto",
    leftPadding: 20,
    rightPadding: 30,
    maxChar: 30,
    placeholder: "value",
    titleText: "INPUT NAME",
    createDescription: 1,
    descriptionText: "",
    inputValue: "",

    backgroundColor: "",
    selectedBackgroundColor: "",
    lineColor: "",
    selectedLineColor: "",

    isRequired: 1,
    requiredText: "Required",
    requiredColor: "white",
    warningText: "Invalid value format",
    warningColor: "#F1BF3C",

    createLeftBox: 1,
    createRightBox: 1,
    createUnit: 1,
    unitText: "KG",

    onFocus: function() {},
    onBlur: function() {},
    onEdit: function() {},

};

const InputB = function(params = {}) {

    // BOX: Component container
    const box = startObject();

    // Apply default and custom parameters
    box.props(InputBDefaults, params);

    // *** PRIVATE VARIABLES:
    let inputElement = null;

    // *** PUBLIC VARIABLES:
    //box.someVariable = "";

    // *** PRIVATE FUNCTIONS:
    const validateInput = function() {};
    const updateWarningDisplay = function() {};
    const limitCharacterCount = function() {};

    // *** PUBLIC FUNCTIONS:
    box.setTitle = function(titleText) {
        // Update the internal property
        box.titleText = titleText;

        // Update the visual label if it exists
        if (box.title && typeof box.title.text !== "undefined") {
            box.title.text = titleText;
        }
    };
    // Sets the title text for the input component

    box.setDescription = function(descriptionText) {
        // Update the internal property
        box.descriptionText = descriptionText;

        // Update the visual label if it exists
        if (box.description && typeof box.description.text !== "undefined") {
            box.description.text = descriptionText;
        }
    };
    // Sets the description below or next to the input field

    box.setMaxChar = function(count) {};
    // Sets the maximum allowed characters for input

    box.setRequired = function(isActive, message) {};
    // Enables or disables the required check and sets a message

    box.setWarningText = function(text) {};
    // Sets an external warning message for the input field

    box.setInputValue = function(value) {};
    // Sets the current value of the input field

    box.getInputValue = function() {};
    // Returns the current value of the input field

    box.focus = function() {};
    // Focuses the input field

    box.blur = function() {};
    // Removes focus from the input field

    box.setBoxColor = function(color) {};
    // Sets the background color of the component

    box.setBoxOverColor = function(color) {};
    // Sets the background color when hovered

    // *** OBJECT VIEW:

        if (box.descriptionText.length > 0) {
            box.createDescription = 1;
        }

        // BOX: Background
        Box(0, 0, "100%", "100%", {
            color: "#F6F6F6",
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
            color: "#141414",
        });

        // GROUP: Title, input, description
        AutoLayout({
            flow: "vertical",
            align: "left top",
            height: "auto",
            padding: [box.leftPadding, 14, 60, 14],
            gap: 0,
        });
        that.position = "relative";

            // LABEL: Title 
            box.title = Label({
                text: "INPUT TITLE",
                fontSize: 16,
                textColor: "#555555",
            });

            // INPUT: Main object
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
        box.rightBox = AutoLayout({
            flow: "horizontal",
            align: "right bottom",
            padding: [5, 7],
            gap: 0,
        });

            Label({
                text: "KG",
                padding: [6, 0],
                color: "white",
                border: 1,
                borderColor: "#999999",
                round: 2,
                fontSize: 16,
            });

        endAutoLayout();

        // GROUP: left box
        box.leftBox = AutoLayout({
            flow: "horizontal",
            align: "left center",
            padding: [20, 14],
            gap: 0,
        });

        endAutoLayout();

        // BOX: Warning Ball:
        box.warningBall = Box({
            right: 5,
            top: 5,
            width: 16,
            height: 16,
            border: 2,
            color: "white",
            borderColor: "#141414",
            round: 100,
        });

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
    const iel = box.input.inputElement;
    iel.addEventListener("focus", function () {
        box.onFocus();
    });
    iel.addEventListener("blur", function () {
        box.onBlur();
    });
    iel.addEventListener("input", function () {
        box.onEdit();
    });

    // To change tooltip text and color:
    box.warningBall.tooltip.setHintText(box.requiredText);
    box.warningBall.tooltip.setLbl_color(box.requiredColor);

    return endObject(box);

};
