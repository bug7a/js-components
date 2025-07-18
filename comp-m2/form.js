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
const FormDefaults = {
    key: "1",
};

const Form = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, FormDefaults);

    // Edit params, if needed:
    // params.width = getDefaultContainerBox().width;

    // BOX: Component container
    const box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    //let privateVar = "";

    // *** PUBLIC VARIABLES:
    // Input Objects list [var]
    box.inputList = [];

    // NOTE: Default values are also public variables.


    // *** PRIVATE FUNCTIONS:
    const privateFunc = function() {};

    // *** PUBLIC FUNCTIONS:
    // If you need to change a param after it is created. You can write a setter function for it.
    box.addInput = function(input) {};



    // *** OBJECT VIEW:
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    // Show outside of the box.
    box.elem.style.overflow = "visible";
    box.color = box.boxColor;
    //box.borderColor = "indianred";
    box.setMotion("background-color 0.3s");



        //box.background = Box();
        //box.topBox = Box();
        //box.content = Box();
        //box.bottomBox();
    
        // BOX: Cover.
        box.coverBox = Box(0, 0, "100%", "100%", {
            opacity: 0.2,
        });
        that.elem.style.background = "linear-gradient(to bottom, white, black)";    


    // *** OBJECT INIT CODE:
    // 
    
    return endObject(box);

};