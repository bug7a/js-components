ContentsPageDefaults = {
    color: "transparent",
};

const ContentsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ContentsPageDefaults, mainView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(ContentsPage.KEY);

    AutoLayout();

        Label({
            text: "Contents Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

ContentsPage.KEY = "Contents";