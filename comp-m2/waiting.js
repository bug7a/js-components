/* Bismillah */

/*

Waiting - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: 7 July 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/js-components/

*/

"use strict";
const WaitingDefaults = {
    label: "",
    textColor: "rgba(255, 255, 255, 0.9)",
    waitingIcon: "../comp-m2/waiting/clock.png",
    coverBackgroundColor: "rgba(0, 0, 0, 0.4)",
    onHide: function() {},
    animated: 0,
};

const Waiting = function(params = {}) {

    // Marge params first
    mergeIntoIfMissing(params, WaitingDefaults);

    params.opacity = 0;
    params.visible = 0;
    params.color = "transparent";
    params.border = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    const box = startObject(params);
    page.add(box); // Always create in page

    // *** PRIVATE VARIABLES:
    let animationFrame = 1;

    box.show = function() {

        box.visible = 1;
        box.withMotion(function(self) {
            box.opacity = 1;
        });
        if (box.animated == 1) box.startAnimation();
        
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
                if (box.animated == 1) box.stopAnimation();
            }, 250);

        }, timer);
    
    };

    box.setLabel = function(label) {
        box.lbl.text = label;
        box.lbl.visible = 1;
    }

    box.startAnimation = function() {
        if (box.animationTimer) clearTimeout(box.animationTimer);
        box.animationTimer = setTimeout(function() {
            if (animationFrame == 1) {
                box.icon.elem.style.transform = "scale(0.8)";
                animationFrame = 0;
            } else {
                box.icon.elem.style.transform = "scale(1)";
                animationFrame = 1;
            }
            box.startAnimation();
        }, 400);
    }

    box.stopAnimation = function() {
        if (box.animationTimer) clearTimeout(box.animationTimer);
        box.icon.elem.style.transform = "scale(1)";
        animationFrame = 1;
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
            if (box.animated) {
                box.icon.setMotion("transform 0.4s"); // opacity 0.2s, 
            }
            //box.warningBall.elem.style.transform = "scale(0.3)";

            // LABEL: Some text.
            box.lbl = Label({
                textColor: box.textColor,
                text: box.label,
                opacity: 1,
                textAlign: "center",
                visible: (box.label == "") ? 0 : 1,
            });
            box.lbl.elem.fontFamily = "opensans-bold";

        endFlexBox();

    // *** INIT
    box.left = 0;
    box.top = 0;

    return endObject(box);

};