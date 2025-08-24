NotificationsPageDefaults = {
    color: "transparent",
};

const NotificationsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, NotificationsPageDefaults, rightView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    rightView.setWidth(400);
    rightView.setKey(NotificationsPage.KEY);

    AutoLayout();

        Label({
            text: "Notifications Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

NotificationsPage.KEY = "Notifications";