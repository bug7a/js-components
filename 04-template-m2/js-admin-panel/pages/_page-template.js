AbcPageDefaults = {
    color: "transparent",
};

const AbcPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, AbcPageDefaults, mainView);

    AutoLayout();

        Label({
            text: "Abc Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

AbcPage.KEY = "AbcPage";