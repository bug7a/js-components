/* Bismillah */

/*

Select Text - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: 22 February 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/


EXAMPLE: {javascript-mobile-app-template}/comp-name.htm

*/

"use strict";
const SelectTextItem = function(params = {}) {

    // BOX: SelectTextItem container
    const box = startBox();

    // Default values
    const defaults = {
        width: "100%",
        height: 50,
    };

    box.props(defaults, params);

    // *** Private variables:
    //let privateVar = "";

    // *** Public variables:
    //box.publicVar = "";

    // *** Private functions:
    //const privateFunc = () => {};

    // *** Public functions:
    box.publicFunc = () => {};
    
    box.setWidth = function(value) {
        box.width = value;
        //const SPACE_X = 20;
        //box.boxBackground.left = SPACE_X;
        //box.boxBackground.width = box.width - (SPACE_X*2);
    }

    box.setHeight = function(value) {
        box.height = value;
        //const SPACE_Y = 2;
        //box.boxBackground.top = SPACE_Y;
        //box.boxBackground.height = box.height - (SPACE_Y*2);
    }

        // *** OBJECT TEMPLATE:
        box.color = "transparent";
        box.elem.style.cursor = "pointer";
        box.clickable = 1;
        box.setMotion("background-color 0.2s");

        // LABEL: SelectTextItem title text.
        box.lblTitle = Label(0, 0, "100%", "auto", {
            text: box.title,
            spaceX: 20,
        });
        box.lblTitle.center("top");
        box.lblTitle.onResize(function(self) {
            self.center("top");
        });

    endBox();

    // *** OBJECT INIT CODE:
    //box.setWidth(box.width);
    //box.setHeight(box.height);

    box.elem.addEventListener("mouseover", function() {
        box.color = "white";
    });

    box.elem.addEventListener("mouseout", function() {
        box.color = "transparent";
    });

    makeBasicObject(box);
    return box;

};

const SelectText = function(params = {}) {

    const box = SelectItem(params);
    box.setItem(SelectTextItem);

    makeBasicObject(box);
    return box;

};