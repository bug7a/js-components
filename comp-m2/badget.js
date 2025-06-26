/* Bismillah */

/*

Component Template - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Web: https://bug7a.github.io/basic.js-ui-components/

*/

"use strict";
const Badget = function(params = {}) {

    // Default values
    const defaults = {
        target: null,
        type: "number", // "number", "color"
        border: 0,
        color: "transparent",
        width: "auto", // or "100%"
        height: "auto",
    };

    if (params == "get") return defaults; // CompName("get").border

    // BOX: Component container
    const box = startObject();

    // after box created
    //defaults.width = box.containerBox.width;
    //defaults.height = box.containerBox.height;

    // Values ready to use
    box.props(defaults, params);

    // *** Private variables:
    //let privateVar = "";

    // *** Public variables:
    //box.publicVar = "";

    // *** Private functions:
    //const privateFunc = function() {};

    // *** Public functions:
    //box.publicFunc = function() {};

    // Set a param after created.
    //box.setColor = function(color) {
    //    box.color = color;
    //};
    // USAGE: get: componentName.color, set: componentName.setColor("red")
    box.setIconFile = function(iconFile) {
        box.iconFile = iconFile;
        box.icoLogo.load(iconFile);
    }

    // OBJECT VIEW:
    box.setMotion("opacity 0.2s");
    box.target.containerBox.add(box);
    box.elem.style.overflow = "visible";

    // BOX: Cover.
    box.circleBox = startFlexBox(0, 0, 40, 40, {
        color: "gold",
        position: "relative",
        border: 3,
        borderColor: "rgba(0, 0, 0, 0.9)",
    });
    that.round = that.width;
    that.elem.style.overflow = "visible";

        box.lblText = Label({
            text: "42",
            fontSize: 12,
            textColor: "rgba(0, 0, 0, 0.9)",
        });

    endFlexBox();
    
    // BOX: Cover.
    /*
    box.coverBox = Box(0, 0, "100%", "100%", {
        color: "transparent",
    });
    */

    /*
    // ICON: Logo image.
    box.icoLogo = Icon({
        width: 50,
        height: 50,
        opacity: 1,
    });
    //that.load(box.waitingIconFile);
    that.center();
    */

    // OBJECT INIT CODE:
    box.on("click", function() {
        console.log("clicked")
    });
    //box.setIconFile(box.iconFile);
    box.top = box.target.top - 12; //(box.circleBox.height / 3);
    box.left = box.target.left + box.target.width - box.circleBox.width + 12; //(box.circleBox.width / 1.5);
    
    return endObject(box);

};