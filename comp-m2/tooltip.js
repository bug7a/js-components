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
    let removeMouseOver = null;
    let removeMouseMove = null;
    let removeMouseOut = null;
    const SPACE_ABOVE_MOUSE = 12;
    const SPACE_BELOW_MOUSE = 8;
    const SPACE_BESIDE_MOUSE = 25;

    // *** Private functions:

    // WHY: One hint label (window.lblHint) is shared by every Tooltip: only the one under the mouse is open.
    const removeHintLabel = function() {
        if (!window.lblHint) return;
        window.lblHint.remove();
        window.lblHint = null;
    };

    const refreshPosition = function(event) {

        box.mouseX = withPageZoom(event.clientX);
        box.mouseY = withPageZoom(event.clientY);

        const hint = window.lblHint;

        switch (box.hintPosition) {

            case "top":
            hint.top = box.mouseY - hint.height - SPACE_ABOVE_MOUSE;
            hint.left = box.mouseX - (hint.width / 2);
            break;

            case "bottom":
            hint.top = box.mouseY + hint.height + SPACE_BELOW_MOUSE;
            hint.left = box.mouseX - (hint.width / 2);
            break;

            case "left":
            hint.top = box.mouseY - (hint.height / 2);
            hint.left = box.mouseX - hint.width - SPACE_BESIDE_MOUSE;
            break;
             
            case "right":
            hint.top = box.mouseY - (hint.height / 2);
            hint.left = box.mouseX + SPACE_BESIDE_MOUSE;
            break;

        }

    };

    // *** Public functions:

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function() {

        if (box._isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).

        // WHY: The mouse events are on the target object, box.remove() does not clean them.
        removeMouseOver();
        removeMouseMove();
        removeMouseOut();

        removeHintLabel();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.

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

    // *** OBJECT TEMPLATE:

    removeMouseOver = box.target.on("mouseover", function() {
        if (window.lblHint) return;

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
    });

    removeMouseMove = box.target.on("mousemove", function(self, event) {
        if (!window.lblHint) return;

        // WHY: Eğer mouse tooltip tetikleyen bir object üzerinde bırakılırsa ve
        // başka bir olay, tooltip in text ve rengini değiştirirse; objeye giriş yapmadan hareket ettirilen mouse,
        // diğer olayın metnini gösterebilir. O yüzden, metin kontrol ediliyor.
        if (window.lblHint.text != box.hintText) {
            window.lblHint.text = box.hintText;
        }
        if (window.lblHint.color != box.lbl_color) {
            window.lblHint.color = box.lbl_color;
        }

        refreshPosition(event);
    });

    removeMouseOut = box.target.on("mouseout", function() {
        removeHintLabel();
    });

    // *** OBJECT INIT CODE:
    box.target.clickable = 1;
    
    return endObject(box);

};