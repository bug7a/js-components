const FullView = function() {
    
    let box = Box(0, 0, "100%", "100%", {
        color: "black",
        visible: 0,
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