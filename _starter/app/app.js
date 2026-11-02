"use strict";

// basic.js calls start() when the page is ready. Replace this page with your own app.

let clickCount = 0;

const start = function () {

    page.color = "whitesmoke";

    VGroup({ align: "center", gap: 16 });

        Label({ text: "Hello from basic.js", fontSize: 28, fontFamily: "opensans-bold" });

        const lblCount = Label({ text: "Clicked: 0", fontSize: 18, textColor: Black(0.6) });

        SmartButton({
            styleName: "pill",
            tone: "blue",
            labelText: "Click me",
            onClick: function () {
                clickCount++;
                lblCount.text = "Clicked: " + clickCount;
            },
        });

    endGroup();

};
