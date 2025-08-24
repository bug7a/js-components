UserActionsPageDefaults = {
    color: "transparent",
};

const UserActionsPage = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, UserActionsPageDefaults);

    // Edit params, if needed:
    params.top = 0;
    params.left = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    const createButtonWithIcon = function(text, iconFile, onClick) {
    
        HGroup({
            width: "100%", 
            height: 50, 
            round: 4, 
            color: "#141414", 
            gap: 12, 
            border: 1, 
            borderColor: White(0.1),
            padding: [12, 0],
            align: "left center",
        });
        that.elem.style.cursor = "pointer";
        that.on("click", onClick);
        UIEffects.button(that);

            Icon(0, 0, 24, 24);
            that.load(iconFile);
            that.elem.style.filter = "invert(100%)";

            Label({
                text: text,
                textColor: White(0.75), 
                fontSize: 20, 
            });

        endBox();

    };

    // *** PAGE VIEW:
    rightView.clean();
    rightView.setKey(UserActionsPage.KEY);
    rightView.setWidth(350);
    rightView.add(box);

        VGroup({
            padding: [12, 12],
            align: "top left",
            gap: 6,
        });

            Label({
                text: "User Actions",
                padding: [12, 12],
                textColor: White(0.65),
            });

            createButtonWithIcon("Other", "assets/left-menu/extension.png", function() {});
            createButtonWithIcon("Logout", "assets/left-menu/extension.png", function() {
                waiting.show();
                logout();
            });

        endGroup();

    // *** PAGE INIT CODE:
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

UserActionsPage.KEY = "UserActions";