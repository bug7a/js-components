const MainView = function() {
    
    let box = Box(40, 40, "calc(100% - 40px)", "calc(100% - 40px)", {
        color: "black",
        clickable: 1,
    });

    // [var] page name
    box.page = null;

    box.show = function() {
        box.visible = 1;
    };

    box.hide = function() {
        box.visible = 0;

        if (typeof box.onClose === "function") box.onClose();
        box.onClose = null;
    };

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

    return box;

};