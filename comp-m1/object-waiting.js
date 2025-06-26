/* Bismillah */

/*

ObjectWaiting - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: 7 July 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/javascript-mobile-app-template/


EXAMPLE: {javascript-mobile-app-template}/waiting.htm


*/

"use strict";
const ObjectWaiting = function(params = {}) {

    const defaults = {
        target: null,
        waitingIcon: "../comp-m1/ui-waiting-view/clock.png",
        coverBackgroundColor: "rgba(0, 0, 0, 0.4)",
        onHide: function() {},
        opacity: 0,
    };

    if (params == "get") return defaults; // CompName("get").border

    // BOX: Component container
    const box = startObject();

    // Values ready to use
    box.props(defaults, params);
    box.target.containerBox.add(box);
    
    // - timer: şu kadar süre sonra kapat.
    box.hide = function(timer = 0) {
    
        // Hide layer
        setTimeout(function() {
            
            box.withMotion(function(self) {
                box.opacity = 0;
            });

            setTimeout(function() {
                box.visible = 0;
                box.onHide();
                box.remove();
            }, 250);

        }, timer);
    
    };

    box.reposition = function() {
        box.left = box.target.left;
        box.top = box.target.top;
    }

    // *** OBJECT VIEW:
    box.color = box.coverBackgroundColor;
    box.width = box.target.width;
    box.height = box.target.height;
    box.left = box.target.left;
    box.top = box.target.top;
    box.round = box.target.round;
    box.clickable = 1;
    box.setMotion("opacity 0.3s");
    box.withMotion(function() {
        box.opacity = 1;
    });

    let iconSize = 50;

    if (box.width < box.height) {
        if (box.width < 80) {
            iconSize = box.width - 14;
        }
    } else {
        if (box.height < 80) {
            iconSize = box.height - 14;
        }
    }

    // ICON: Logo icon.
    box.icon = Icon({
        width: iconSize,
        height: iconSize,
    });
    that.load(box.waitingIcon);

    // INIT:
    box.icon.center();

    return endObject(box);

};