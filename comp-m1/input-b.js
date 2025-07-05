"use strict";

// Default values
const InputBDefaults = {
    key: 0,
    width: 500,
    height: 80,

    onClick: function(self) {},

    titleProps: {
        
    },
    inputProps: {

    },
    descriptionProps: {

    },
    backgroundProps: {
        color: "white",
    },
    createLeftFrame: 1,
    createRightFrame: 1,
    createUnit: 1,
    unitProps: {

    },
    title: "INPUT NAME:",
    description: "Some description",
    maxChar: 100,
    required: {
        isActive: false,
        message: "This field is required.",
    },
    warningText: "",
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

    box.setTitle = function(title) {};
    // Sets the title text for the input component

    box.setDescription = function(description) {};
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
        box.color = "red";

    // *** OBJECT INIT CODE:
    // Initialization logic here

    return endObject(box);

};
