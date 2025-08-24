HomePageDefaults = {
    color: "transparent",
};

const HomePage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, HomePageDefaults, mainView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(HomePage.KEY);

    AutoLayout();

        Label({
            text: "Home Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

HomePage.KEY = "Home";