const RightView = function() {

    let btnClose = Box(40, 40, "calc(100% - 40px)", "calc(100% - 40px)", {
        color: Black(0.01),
        clickable: 1,
        visible: 0,
    });
    
    let box = Box({
        top: 40,
        right: 0,
        width: 500,
        height: "calc(100% - 40px)",
        color: "#141414",
        visible: 0,
    });

    box.btnClose = btnClose;

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

    box.setWidth = function(width) {
        box.width = width;
    };

    box.isShown = function(key = null) {
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
        box.key = "";
        box.html = "";
    };

    btnClose.on("click", function() {
        box.hide();
        box.clean();
    });
    
    box.hide();

    return box;

};