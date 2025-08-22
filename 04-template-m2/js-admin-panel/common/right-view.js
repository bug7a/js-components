const RightView = function() {
    
    let box = Box({
        top: 40,
        right: 0,
        width: 500,
        height: "calc(100% - 40px)",
        color: "#141414",
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