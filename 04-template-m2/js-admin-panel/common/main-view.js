const MainView = function() {
    
    let box = Box(40, 40, "calc(100% - 40px)", "calc(100% - 40px)", {
        color: "black",
    });

    box.show = function() {
        box.visible = 1;
    };

    box.hide = function() {
        box.visible = 0;
    };

    box.clean = function() {
        box.html = "";
    };

    return box;

};