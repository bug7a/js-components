UsersPageDefaults = {
    color: "transparent",
};

const UsersPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, UsersPageDefaults, mainView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(UsersPage.KEY);

    AutoLayout();

        Label({
            text: "Users Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

UsersPage.KEY = "Users";