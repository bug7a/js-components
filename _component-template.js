/* Bismillah */

/*

Component Template - v25.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const CompNameDefaults = {
    key: 0,
    border: 1, // Standard box features are added automatically.
    width: 90,
    height: 50,
    round: 4,
    onClick: function(self) {},
    boxColor: "white", // I didn't use color because I didn't want to add it automatically.
    boxOverColor: "#8FC7B9",
    iconFile: "assets/close.svg",
    iconColor: "transparent",
    iconBorder: 0,
    badgetText: "",
};

const CompName = function(params = {}) {

    // BOX: Component container
    const box = startObject();

    // After box created; you can take values from containerBox
    //CompNameDefaults.round = box.containerBox.round;
    //CompNameDefaults.color = box.containerBox.color;

    // Values are ready to use
    box.props(CompNameDefaults, params);

    // *** PRIVATE VARIABLES:
    //let privateVar = "";
    const badgetColors = [
        { min: 0, max: 3, color: "whitesmoke" },
        { min: 4, max: 10, color: "gold" },
        { min: 11, max: 100, color: "#D96450" },
    ];
    let badgetCurrentColor = null;

    // *** PUBLIC VARIABLES:
    //box.publicVar = "";

    // NOTE: Default values are also public variables.

    // *** PRIVATE FUNCTIONS:
    //const privateFunc = function() {};

    // *** PUBLIC FUNCTIONS:
    // If you need to change a param after it is created. You can write a setter function for it.
    //box.publicFunc = function() {};

    box.setIconFile = function(iconFile) {
        box.iconFile = iconFile;
        box.icoLogo.load(iconFile);
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

    box.setBoxColor = function(color) {
        box.boxColor = color;
        box.color = color;
    };

    box.setBoxOverColor = function(color) {
        box.boxOverColor = color;
    };

    // *** OBJECT VIEW:
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    // Show outside of the box.
    box.elem.style.overflow = "visible";
    box.color = box.boxColor;
    //box.borderColor = "indianred";
    box.setMotion("background-color 0.3s");
    
        // BOX: Cover.
        box.coverBox = Box(0, 0, "100%", "100%", {
            opacity: 0.2,
        });
        that.elem.style.background = "linear-gradient(to bottom, white, black)";

        // ICON: Logo image.
        box.icoLogo = Icon({
            width: 32,
            height: 32,
            space: 10,
            opacity: 0.7,
            border: box.iconBorder,
            color: box.iconColor,
        });
        that.load(box.iconFile);
        that.center();

        // LABEL: Badget
        box.lblBadget = Label({
            text: "", // If you have complex functions just use box.setBadgetText(box.badgetText); after OBJECT INIT CODE.
            textColor: "rgba(0, 0, 0, 0.8)",
            border: 1,
            borderColor: "rgba(0, 0, 0, 0.6)",
            spaceX: 8,
            spaceY: 2,
            round: 8,
            fontSize: 12,
        });
        that.right = -6;
        that.top = -6;
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.fontFamily = "opensans-bold";
        that.setMotion("background-color 0.3s");

    // *** OBJECT INIT CODE:
    box.elem.addEventListener("click", function() {
        box.onClick(box);
    });
    box.elem.addEventListener("mouseover", function() {
        box.color = box.boxOverColor;
        box.lblBadget.color = "white";
    });
    box.elem.addEventListener("mouseout", function() {
        box.color = box.boxColor;
        box.lblBadget.color = badgetCurrentColor;
    });
    box.setBadgetText(box.badgetText);
    
    return endObject(box);

};