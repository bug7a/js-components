/* Bismillah */

/*

Waiting - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: 7 July 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/javascript-mobile-app-template/


EXAMPLE: {javascript-mobile-app-template}/waiting.htm


*/

"use strict";
const Waiting = function(params = {}) {

    const defaults = {
        border: 0,
        label: "",
        color: "transparent",
        opacity: 0,
        visible: 0,
        width: "100%",
        height: "100%",
        waitingIcon: "../comp-m2/waiting/clock.png",
        coverBackgroundColor: "rgba(0, 0, 0, 0.4)",
        onHide: function() {},
    };

    if (params == "get") return defaults; // CompName("get").border

    // BOX: Component container
    const box = startObject();
    page.add(box);

    // Values ready to use
    box.props(defaults, params);

    box.show = function() {

        box.visible = 1;
        box.withMotion(function(self) {
            box.opacity = 1;
        });
        
    }
    
    // - timer: şu kadar süre sonra kapat.
    // - remove: eğer 1 ise görünmez yaptıktan sonra nesneyi siler.
    box.hide = function(timer = 0, $remove = 0) {
    
        // Hide layer
        setTimeout(function() {
            
            box.withMotion(function(self) {
                box.opacity = 0;
            });

            setTimeout(function() {
                box.visible = 0;
                box.onHide();
                if ($remove == 1) {
                    box.remove();
                }
            }, 250);

        }, timer);
    
    };

    box.setLabel = function(label) {
        box.lbl.text = label;
        box.lbl.visible = 1;
    }

    // *** OBJECT VIEW:
    box.setMotion("opacity 0.2s");
    
    // BOX: Cover.
    box.coverBox = startFlexBox({
        flexDirection: "column",
        color: box.coverBackgroundColor,
        clickable: 1,
    });
    box.add(that);

        // ICON: Logo icon.
        box.icon = Icon({
            width: 50,
            height: 50,
            opacity: 1,
        });
        that.load(box.waitingIcon);

        // LABEL: Some text.
        box.lbl = Label({
            textColor: "rgba(0, 0, 0, 0.8)",
            text: box.label,
            opacity: 1,
            visible: (box.label == "") ? 0 : 1,
        });
        box.lbl.elem.fontFamily = "opensans-bold";


    endFlexBox();

    // Show at:
    box.left = 0;
    box.top = 0;

    return endObject(box);

};