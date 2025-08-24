SettingsPageDefaults = {
    color: "transparent",
};

const SettingsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, SettingsPageDefaults, mainView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(SettingsPage.KEY);

    AutoLayout();

        Label({
            text: "Settings Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

SettingsPage.KEY = "Settings";