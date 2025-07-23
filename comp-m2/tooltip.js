/* Bismillah */

/*

Tooltip - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";
const Tooltip = function(params = {}) {

    // Default values
    const defaults = {
        target: null,
        hintText: "",
        hintPosition: "top", // "top", "left", "bottom", "right"
        lbl_fontSize: 12,
        lbl_spaceX: 8,
        lbl_spaceY: 3,
        lbl_color: "rgba(255, 255, 255, 0.90)",
        lbl_textColor: "rgba(0, 0, 0, 0.85)",
        lbl_round: 3,
        lbl_border: 1,
        lbl_borderColor: "rgba(0, 0, 0, 0.9)",
        visible: 0,
    };

    // BOX: Component container
    const box = startObject();

    // Values ready to use
    box.props(defaults, params);

    // *** Private variables:
    let _removeMouseOver = null;
    let _removeMouseMove = null;
    let _removeMouseOut = null;

    // *** Public variables:
    //box.publicVar = "";

    // *** Private functions:

    const refreshPosition = function() {

        const e = window.event;
        const posX = e.clientX;
        const posY = e.clientY;

        box.mouseX = withPageZoom(posX);
        box.mouseY = withPageZoom(posY);

        switch (box.hintPosition) {

            case "top":
            window.lblHint.top = box.mouseY - window.lblHint.height - 12;
            window.lblHint.left = box.mouseX - (window.lblHint.width / 2);
            break;

            case "bottom":
            window.lblHint.top = box.mouseY + window.lblHint.height + 8;
            window.lblHint.left = box.mouseX - (window.lblHint.width / 2);
            break;

            case "left":
            window.lblHint.top = box.mouseY - (window.lblHint.height / 2);
            window.lblHint.left = box.mouseX - window.lblHint.width - 25;
            break;
             
            case "right":
            window.lblHint.top = box.mouseY - (window.lblHint.height / 2);
            window.lblHint.left = box.mouseX + 25;
            break;

        }

    };

    // *** Public functions:
    //box.publicFunc = () => {};

    box.remove = function() {
        _removeMouseOver();
        _removeMouseMove();
        if (window.lblHint) {
            window.lblHint.remove();
            window.lblHint = null;
        };
        _removeMouseOut();
        box.elem.remove();
    }

    box.setHintText = function(text) {
        box.hintText = text;
        if (window.lblHint) {
            window.lblHint.text = text;   
        }
    }

    box.setLbl_color = function(color) {
        box.lbl_color = color;
        if (window.lblHint) {
            window.lblHint.color = box.lbl_color;
        }
    }

    // Set a param after created.
    //box.setColor = function(color) {
    //    box.color = color;
    //};
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // *** OBJECT TEMPLATE:

    _removeMouseOver = box.target.on("mouseover", function() {
        if (!window.lblHint) {
            window.lblHint = Label({
                fontSize: box.lbl_fontSize,
                spaceX: box.lbl_spaceX,
                spaceY: box.lbl_spaceY,
                color: box.lbl_color,
                textColor: box.lbl_textColor,
                round: box.lbl_round,
                border: box.lbl_border,
                borderColor: box.lbl_borderColor,
            });
            page.add(that);
            that.text = box.hintText;
        }
    });

    _removeMouseMove = box.target.on("mousemove", function() {
        if (window.lblHint) {
            
            // WHY: Eğer mouse tooltip tetikleyen bir object üzerinde bırakılırsa ve
            // başka bir olay, tooltip in text ve rengini değiştirirse; objeye giriş yapmadan hareket ettirilen mouse,
            // diğer olayın metnini gösterebilir. O yüzden, metin kontrol ediliyor.
            if (window.lblHint.text != box.hintText) {
                window.lblHint.text = box.hintText;
            }
            if (window.lblHint.color != box.lbl_color) {
                window.lblHint.color = box.lbl_color;
            }

            refreshPosition(box.hintPosition);
        }
    });

    _removeMouseOut = box.target.on("mouseout", function() {
        if (window.lblHint) {
            window.lblHint.remove();
            window.lblHint = null;
        }
    });

    // *** OBJECT INIT CODE:
    box.target.clickable = 1;
    //box.target.elem.style.cursor = "pointer";
    
    return endObject(box);

};