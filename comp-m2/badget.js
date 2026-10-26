/* Bismillah */

/*

Component Template - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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

    // Values ready to use
    box.props(defaults, params);

    // *** PRIVATE VARIABLES:
    const CORNER_OFFSET = 12; // px out of the target's top right corner

    // *** PUBLIC FUNCTIONS:

    // NOTE: box.icoLogo is not made yet (the logo icon is not part of the view): do not call it.
    box.setIconFile = function(iconFile) {
        box.iconFile = iconFile;
        box.icoLogo.load(iconFile);
    }

    // OBJECT VIEW:
    box.setMotion("opacity 0.2s");
    box.target.containerBox.add(box);
    box.css.overflow = "visible"; // WHY: The circle stands out of the target's corner.

    // BOX: Circle (with the number)
    box.circleBox = startFlexBox(0, 0, 40, 40, {
        color: "gold",
        position: "relative",
        border: 3,
        borderColor: "rgba(0, 0, 0, 0.9)",
    });
    that.round = that.width;
    that.css.overflow = "visible";

        box.lblText = Label({
            text: "42",
            fontSize: 12,
            textColor: "rgba(0, 0, 0, 0.9)",
        });

    endFlexBox();

    // OBJECT INIT CODE:
    box.on("click", function() {
        console.log("clicked")
    });
    // The circle sits on the top right corner of the target, a little out of it.
    box.top = box.target.top - CORNER_OFFSET;
    box.left = box.target.left + box.target.width - box.circleBox.width + CORNER_OFFSET;
    
    return endObject(box);

};