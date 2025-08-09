/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const CompNameDefaults = {
    key: "0",
    width: 240, // Standard box features are added automatically.
    height: 70,
    labelText: "",
    descText: "",
    badgetText: "",
    invertColor: 0,
    onClick: function(self) {},
    backgroundStyle: {
        color: White(1),
        overColor: "#EFE3C5",
        round: 4,
        border: 1,
        borderColor: Black(0.8),
    },
    iconFile: "assets/icons/alert-black.png", // WHY: Not in the iconStyle, because this is a frequently used parameter.
    iconStyle: {
        color: White(0),
        border: 0,
        invertColor: 0,
    },
};

const CompName = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, CompNameDefaults);

    // Edit params, if needed:
    // params.width = getDefaultContainerBox().width;
    // params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    //let privateVar = "";
    const badgetColors = [
        { min: 0, max: 3, color: "whitesmoke" },
        { min: 4, max: 10, color: "gold" },
        { min: 11, max: 100, color: "#D96450" },
    ];
    let badgetCurrentColor;

    // *** PUBLIC VARIABLES:
    // [var] key for show this public var in navigator.
    box.publicVar = 1;
    // State of component [var]
    box.state = "normal";

    // NOTE: Default values are also public variables.


    // *** PRIVATE FUNCTIONS:
    const privateFunc = function() {};
    /*
    const boxResized = function(self) {
        box.iconBackground.left = box.icon.left;
        box.iconBackground.top = box.icon.top;
    };
    */

    // *** PUBLIC FUNCTIONS:
    // If you need to change a param after it is created. You can write a setter function for it.
    box.publicFunc = function() {};

    box.setIconFile = function(file) {
        box.iconFile = file;
        box.icon.load(file);
    }
    // USAGE: get: componentName.iconFile, set: componentName.setIconFile("8")

    box.setBadgetText = function(text) {

        box.badgetText = text;
        box.lblBadget.text = text;

        const _num = parseInt(text);

        badgetColors.forEach(function(data, index) {
            if (_num >= data.min && _num <= data.max) {
                box.lblBadget.color = data.color;
                badgetCurrentColor = data.color;
            }
        });

    };
    // USAGE: get: componentName.badgetText, set: componentName.setBadgetText("8")

    box.setBackgroundColor = function(color) {
        box.backgroundStyle.color = color;
        box.background.color = color;
    };

    box.setBackgroundOverColor = function(color) {
        box.backgroundStyle.overColor = color;
    };

    box.setState = function(state) {
        
        box.state = state;

        switch(state) {

            case "normal":
                box.background.color = box.backgroundStyle.color;
                //box.lblBadget.color = badgetCurrentColor;
                //box.background.border = 1;
                break;

            case "mouseover":
                box.background.color = box.backgroundStyle.overColor;
                //box.lblBadget.color = "white";
                //box.background.border = 3;
                break;

            case "selected":
                
                break;

            case "disabled":

                break;

        }
    };

    box.refresh = function() {
        
        // NOTE: Check the child objects and make sure their states are appropriate.

    };

    // box.superRemove = box.remove;
    box.destroy = function() {

        //page.remove_onResize(functionName); // on page resized.
                
        // Remove basic objects
        box.background.remove(); // NOTE: If you add event (box.background.on("click") to other objects.
        box.icon.remove();

        // box.superRemove.call(box);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;

    };

    // *** OBJECT VIEW:
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    // Show outside of the box. box.lblBadget will be shown at out of container.
    box.clipContent = 0;
    if(box.invertColor == 1) box.elem.style.filter = "invert(100%)";

        // BOX: background
        box.background = Box(0, 0, "100%", "100%", box.backgroundStyle);
        box.background.setMotion("background-color 0.2s");
        // WHY: Different background boxes are more useful in components.

        // BOX: Background effect
        box.backgroundEffect = Box(0, 0, "100%", "100%", {
            opacity: 0.15,
            round: box.backgroundStyle.round, // clipContent: 0 so,
        });
        that.elem.style.background = "linear-gradient(to bottom, white, black)";

        // BOX: icon back
        /*
        box.iconBackground = Box(0, 0, 48, 48, {
            border: 2,
            borderColor: Black(0.2),
            position: "absolute",
            round: 100,
            color: White(0.8),
        });
        */

        // GROUP: icon, group (title, label)
        HGroup({
            align: "left center",
            padding: [10, 0],
            gap: 10,
            // NOTE: this width, height: "100%" as default.
        });

            // ICON: image
            box.icon = Icon({
                width: 48,
                height: 48,
                space: 10,
                border: box.iconStyle.border,
                color: box.iconStyle.color,
            });
            that.load(box.iconFile);
            if(box.iconStyle.invertColor == 1) that.elem.style.filter = "invert(100%)";

            // GROUP: label, description
            VGroup({
                width: "auto", // Wrap group content
                height: "auto", // Wrap group content
                align: "left top",
            });

                // LABEL: label
                box.label = Label({
                    text: box.labelText,
                });

                // LABEL: description
                box.lblDesc = Label({
                    text: box.descText,
                    textColor: Black(0.4),
                    fontSize: 16,
                });
                that.elem.style.marginTop = "-6px";

            endGroup();

        endGroup();

        // LABEL: Badget
        box.lblBadget = Label({
            text: "", // NOTE: If you have complex functions just use box.setBadgetText(box.badgetText); after OBJECT INIT CODE.
            textColor: Black(0.8),
            border: 1,
            borderColor: Black(0.6),
            padding: [8, 2],
            round: 2,
            fontSize: 12,
            right: -3,
            top: -3,
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.fontFamily = "opensans-bold";
        that.setMotion("background-color 0.2s");


    // *** OBJECT INIT CODE:
    box.on("click", function(self, event) {
        box.onClick(box, event);
    });
    box.on("mouseover", function(self, event) {
        box.setState("mouseover");
    });
    box.on("mouseout", function(self, event) {
        box.setState("normal");
    });

    /*
    box.onResize(boxResized);
    boxResized();
    */
    
    //page.onResize(functionName); // on page resized.
    
    box.setBadgetText(box.badgetText);
    
    return endObject(box);

};