/* Bismillah */

/*

Component Template - v25.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const DialogDefaults = {
    icon: "dialog/key.png",
    title: "?",
    desc: "?",
    confirmButtonText: "Send",
    callback: function(id) {},
    cancelButtonText: "Cancel",
    confirmButtonColor: basic.ACTION_COLOR,
    color: Black(0.7),
};

const Dialog = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, DialogDefaults);

    // You can't set these values over params.
    params.opacity = 0;
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    // Add smooth animation for the main container.
    that.setMotion("opacity 0.2s");
    that.withMotion(function(self) {
        self.opacity = 1;
    });

        // Close it when the background is pressed.
        Box(0, 0, "100%", "100%", {
            color: "transparent",
        });
        that.on("click", function() {
            box.remove();
            box.callback(0);
        });

        // GROUP: Cover background
        HGroup({
            align: "center",
        });

            // BOX: Alert box
            startBox({
                width: 500,
                height: "auto",
                round: 6,
                color: "white",
            });
            that.elem.style.minWidth = "500px";
            that.opacity = 0;
            that.elem.style.transform = "translateY(50px)";
            // Add smooth animation
            that.setMotion("transform 0.2s, opacity 0.2s");
            that.withMotion(function(self) {
                self.opacity = 1;
                self.elem.style.transform = "translateY(0px)";
            });
            that.elem.style.boxShadow = "0px 0px 8px rgba(0, 0, 0, 0.2)";
            that.clickable = 1;

                // Buttons background ()
                Box({
                    color: "whitesmoke",
                    width: "100%",
                    height: 64,
                    left: 0,
                    bottom: 0,
                });
                that.elem.style.borderTop = "1px solid rgba(0,0,0,0.3)";

                // GROUP: Title
                HGroup({
                    align: "top left",
                    gap: 6,
                    padding: 12,
                    height: 56,
                });

                    // ICON: Title
                    Icon({
                        width: 32,
                        height: 32,
                    });
                    that.load(box.icon);

                    // LABEL: Title
                    Label({
                        text: box.title,
                    });
                    that.elem.style.fontFamily = "opensans-bold";

                endGroup(); // TITLE GROUP

                // GROUP: Description
                HGroup({
                    align: "left top",
                    padding: [12, 50, 12, 80],
                });
                that.position = "relative";

                    Label({
                        text: box.desc,
                        fontSize: 16,
                        textColor: "#4A4A4A",
                    });

                endGroup(); // DESC GROUP

                // GROUP: Buttons
                HGroup({
                    align: "right bottom",
                    gap: 6,
                    padding: 12,
                });

                    // BUTTON: Cancel
                    Button({
                        text: box.cancelButtonText,
                        color: "lightgrey",
                        minimal: 1,
                        height: 40,
                        width: "auto",
                        padding: [18, 0],
                    });
                    that.on("click", function() {
                        box.remove();
                        box.callback(0);
                    });

                    // BUTTON: Confirm
                    const btnConfirm = Button({
                        text: box.confirmButtonText,
                        color: box.confirmButtonColor,
                        height: 40,
                        width: "auto",
                        padding: [18, 0],
                    });
                    that.on("mouseover", function() {
                        btnConfirm.elem.style.filter = "brightness(120%)";
                    });
                    that.on("mouseout", function() {
                        btnConfirm.elem.style.filter = "brightness(100%)";
                    });
                    that.on("click", function() {
                        box.remove();
                        box.callback(1);
                    });

                endGroup(); // BUTTONS GROUP

            endBox(); // Alert box

        endGroup(); // Cover black background

    return endObject(box);
    
};