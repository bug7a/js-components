/* Bismillah */

/*
Toggle - v25.08

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: August 2025
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ToggleDefaults = {
    key: "0",
    width: 70, // Standard box features are added automatically.
    height: 40,
    spacing: 3,
    value: 0,
    invertColor: 0,
    onChange: function(ui) {},
    backgroundStyle: {
        color: "whitesmoke",
        selectedColor: "#689BD2",
        border: 1,
        borderColor: Black(0.05),
        round: 100,
    },
    buttonStyle: {
        color: Black(0.15),
        selectedColor: White(0.95),
        border: 0,
        round: 100,
    }
};

const Toggle = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ToggleDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.clickable = 1;
    params.clipContent = 0;

    // BOX: Component container
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    let buttonSize = 0; // Set by box.refresh() from the size of the box.
    let distance = 0; // How far the button moves when it is on.
    const OFF_BUTTON_SCALE = 0.6; // The button is smaller when the toggle is off.
    const ON_BUTTON_SHADOW = "-1px 0px 4px rgba(0, 0, 0, 0.15)";
    const HOVER_BRIGHTNESS = "103%";
    const DISABLED_BRIGHTNESS = "90%";
    const DISABLED_OPACITY = 0.75;

    // *** PUBLIC VARIABLES:
    box.state = ""; // "normal", "selected"
    box.secondState = ""; // "normal", "mouseover", "disabled"

    // *** PUBLIC FUNCTIONS:
    box.switch = function() {
        box.setValue((box.value === 1) ? 0 : 1);
    };
    
    box.setValue = function(value) {

        box.value = value;

        box.setState((value === 1) ? "selected" : "normal");
        box.onChange(box);

    };

    box.setBackgroundSelectedColor = function(color) {
        box.backgroundStyle.selectedColor = color;
        if (box.value === 1) box.background.color = color;
    };

    box.setState = function(state) {
        
        box.state = state;

        switch(state) {

            case "normal":

                box.button.css.transform = `scale(${OFF_BUTTON_SCALE}) translateX(0px)`;
                box.button.color = box.buttonStyle.color;
                box.button.boxShadow = "none";
                box.background.color = box.backgroundStyle.color;

                break;

            case "selected":

                box.button.css.transform = `scale(1) translateX(${distance}px)`;
                box.button.color = box.buttonStyle.selectedColor;
                box.button.boxShadow = ON_BUTTON_SHADOW;
                box.background.color = box.backgroundStyle.selectedColor;
                
                break;

        }
    };

    box.setSecondState = function(state) {
        
        box.secondState = state;

        switch(state) {

            case "normal":

                box.background.css.filter = "brightness(100%)";
                box.opacity = 1;
                box.clickable = 1;

                break;

            case "mouseover":
                
                box.background.css.filter = `brightness(${HOVER_BRIGHTNESS})`;
                box.opacity = 1;
                box.clickable = 1;
            
                break;

            case "disabled":

                box.background.css.filter = `brightness(${DISABLED_BRIGHTNESS})`;
                box.opacity = DISABLED_OPACITY;
                box.clickable = 0;

                break;

        }
    };

    box.refresh = function() {

        buttonSize = box.height - (box.spacing * 2);
        distance = box.width - (box.spacing * 2) - buttonSize;

        box.button.props({
            left: box.spacing,
            top: box.spacing,
            width: buttonSize,
            height: buttonSize,
        });

        box.setState((box.value === 1) ? "selected" : "normal");
        box.setSecondState(box.secondState || "normal");

    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:
    box.cursor = "pointer";
    if(box.invertColor === 1) box.css.filter = "invert(100%)";

        // BOX: background
        box.background = Box(0, 0, "100%", "100%", box.backgroundStyle);
        box.background.setMotion("background-color 0.2s");

        // BOX: The round button (it slides to the right when on)
        box.button = Box(box.buttonStyle);
        that.setMotion("transform 0.2s");

    // *** OBJECT INIT CODE:
    box.on("click", function(self, event) {
        box.switch();
    });
    box.on("mouseover", function(self, event) {
        box.setSecondState("mouseover");
    });
    box.on("mouseout", function(self, event) {
        box.setSecondState("normal");
    });
    box.onResize(function(self) {
        box.refresh();
    });

    box.refresh();
    
    return endObject(box);

};