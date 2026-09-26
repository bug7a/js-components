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

