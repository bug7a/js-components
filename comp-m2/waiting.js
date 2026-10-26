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

    // Merge params first
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
    let isIconFull = 1; // The pulse animation: the icon is at its full size (1) or smaller (0).
    const FADE_OUT_TIME = 250; // ms: a little longer than the opacity motion (0.2s), then it is hidden.
    const PULSE_STEP_TIME = 400; // ms: the same as the transform motion of the icon.
    const ICON_FULL_SCALE = "scale(1)";
    const ICON_SMALL_SCALE = "scale(0.8)";

    // *** PUBLIC FUNCTIONS:
    // NOTE: show() and hide() replace the show() / hide() of basic.js: they fade the cover in and out.

    box.show = function() {

        box.visible = 1;
        box.withMotion(function(self) {
            box.opacity = 1;
        });
        if (box.animated == 1) box.startAnimation();

    };

    // - timer: şu kadar süre sonra kapat.
    // - remove: eğer 1 ise görünmez yaptıktan sonra nesneyi siler.
    box.hide = function(timer = 0, $remove = 0) {

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
            }, FADE_OUT_TIME);

        }, timer);

    };

    box.setLabel = function(label) {
        box.lbl.text = label;
        box.lbl.visible = 1;
    };

    box.startAnimation = function() {
        if (box.animationTimer) clearTimeout(box.animationTimer);
        box.animationTimer = setTimeout(function() {
            isIconFull = isIconFull ? 0 : 1;
            box.icon.css.transform = isIconFull ? ICON_FULL_SCALE : ICON_SMALL_SCALE;
            box.startAnimation();
        }, PULSE_STEP_TIME);
    };

    box.stopAnimation = function() {
        if (box.animationTimer) clearTimeout(box.animationTimer);
        box.icon.css.transform = ICON_FULL_SCALE;
        isIconFull = 1;
    };

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
                box.icon.setMotion("transform 0.4s");
            }

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