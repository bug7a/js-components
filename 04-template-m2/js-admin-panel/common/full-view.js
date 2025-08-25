const FullView = function() {
    
    let box = Box(0, 0, "100%", "100%", {
        color: "black",
        visible: 0,
    });

    // Close button:
    let btnClose = AutoLayout({
        right: 20,
        top: 20,
        width: 40,
        height: 40,
        color: White(0.75),
        round: 100,
        border: 1,
        borderColor: Black(0.2),
    });
    that.elem.style.cursor = "pointer";
    that.tooltip = Tooltip({
        target: that,
        hintText: "Close",
        hintPosition: "left",
        lbl_color: "#141414",
        lbl_border: 1,
        lbl_textColor: White(0.75),
        lbl_borderColor: White(0.2),
        lbl_fontSize: 12,
        lbl_round: 4,
    });
    
        Icon({
            width: 30,
            height: 30,
        });
        that.load("assets/close.png");

    endAutoLayout();
    
    /*
    Label({
        right: 20,
        top: 20,
        text: "CLOSE",
        padding: [12, 4],
        round: 3,
        color: Black(0.8),
        textColor: White(0.65),
        clickable: 1,
        visible: 0,
    });
    that.elem.style.cursor = "pointer";
    */

    box.show = function() {
        box.visible = 1;
        btnClose.visible = 1;
    };

    box.hide = function() {
        box.visible = 0;
        btnClose.visible = 0;

        if (typeof box.onClose === "function") box.onClose();
        box.onClose = null;
    };

    // - Eğer key i verilen sayfa açık ise,
    box.isShown = function(key) {
        if (!key) {
            return box.visible;
        } else {
            if (box.key === key) {
                return box.visible;
            } else {
                return 0;
            }
        }
    };

    box.setKey = function(key) {
        box.key = key;
    };

    box.destroyPage = null;

    box.clean = function() {
        if (typeof box.onClose === "function") box.onClose();
        box.onClose = null;

        if (typeof box.destroyPage === "function") {
            box.destroyPage();
            box.destroyPage = null;
        }
        box.html = "";
    };

    btnClose.on("click", function() {
        box.hide();
        box.clean();
    });

    box.hide();

    return box;

};