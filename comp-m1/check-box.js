/* Bismillah */

/*

Check Box - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";
const CheckBox = function(params = {}) {

    // Default values
    const defaults = {
        id: "",
        checked: 0,
        label: "",
        onChange: function(checked) {},
        border: 0,
        color: "whitesmoke",
        fontSize: 20,
        width: "auto", // or "100%"
        height: 50,
        round: 4,
        box_uncheckedColor: "white",
        box_checkedColor: "#141414", // "indianred"
        box_checkedIconReverseColorFilter: 1, // 0
    };

    if (params == "get") return defaults; // CompName("get").border

    saveCurrentThat();

    // BOX: Component container
    const box = startFlexBox();

    // Values ready to use
    box.props(defaults, params);

    // *** Private variables:
    let privateVar = "";

    // *** Public variables:
    box.publicVar = "";

    // *** Private functions:
    const privateFunc = function() {};

    // *** Public functions:
    box.setChecked = function(checked) {
        if (checked == 1 && box.checked == 0) {
            box.toggle();
        } else if (checked == 0 && box.checked == 1) {
            box.toggle();
        }
    }

    box.toggle = function() {
        if (box.checked == 1) {
            box.checked = 0;
            box.icoCheck.visible = 0;
            box.checkBox.color = box.box_uncheckedColor;
        } else {
            box.checked = 1;
            box.icoCheck.visible = 1;
            box.checkBox.color = box.box_checkedColor;
        }
        box.onChange(box.checked);
    }

    box.setLabel = function(label) {
        box.label = label;
        box.lblLabel.text = box.label;
    }

    // Set a param after created.
    box.setColor = function(color) {
        box.color = color;
    };
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // OBJECT VIEW:
    box.elem.style.whiteSpace = "nowrap";
    box.elem.style.cursor = "pointer";
    box.clickable = 1;
    
    // BOX: Cover.
    box.checkBox = Box(0, 0, 26, 26, {
        color: (box.checked == 1) ? box.box_checkedColor : box.box_uncheckedColor,
        border: 1,
        round: 3,
    });
    that.elem.style.marginLeft = "12px";

    // LABEL: Label
    box.lblLabel = Label({
        text: box.label,
        fontSize: box.fontSize,
    });
    that.elem.style.marginLeft = "8px";
    that.elem.style.marginTop = "-2px";
    that.elem.style.marginRight = "12px";

    // ICON: Logo image.
    box.icoCheck = Icon({
        width: 24,
        height: 24,
        opacity: 1,
        visible: (box.checked == 1) ? 1 : 0,
    });
    that.load("../comp-m1/tiny-check/check.svg");
    box.checkBox.add(that);
    if (box.box_checkedIconReverseColorFilter == 1) {
        that.elem.style.filter = "invert(100%)";
    }

    endFlexBox();

    // OBJECT INIT CODE:
    box.on("click", function() {
        box.toggle();
    });

    restoreThatFromSaved();
    makeBasicObject(box);
    return box;

};