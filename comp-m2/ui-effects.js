/*
NOT FOR NEW PROJECTS (the user, 2026-10-29): use comp-m4/ui-effects.js (UIEffects). Both define UIEffects: never load the two on one page.
This file stays only for the pages that still use it.
*/

const UIEffects = function() {};

UIEffects.button = function(btn, type = "default") {

    switch(type) {

        case "default":

            btn.elem.style.cursor = "pointer";
            btn.setMotion("filter 0.2s, transform 0.2s, color 0.2s");

            btn.on("mouseover", function() {
                btn.elem.style.filter = "brightness(120%)";
            });

            btn.on("mouseout", function() {
                btn.elem.style.filter = "brightness(100%)";
            });

            btn.on("mousedown", function() {
                btn.elem.style.transform = "scale(0.95)";
                btn.elem.style.filter = "brightness(80%)";
                
                setTimeout(function(){
                    btn.elem.style.transform = "scale(1)";
                    btn.elem.style.filter = "brightness(120%)";
                }, 200);
            });
            break;

    }

};

