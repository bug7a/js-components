AbcPageDefaults = {
    color: "transparent",
};

const AbcPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, AbcPageDefaults, mainView); // (mainView, rightView, fullView)

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(AbcPage.KEY);

    // *** VARIABLES
    // *** FUNCTIONS

    // VIEW
    AutoLayout();

        Label({
            text: "Abc Page",
            textColor: White(0.65),
        });

    endAutoLayout();

    // INIT
    
    return box.endPage();

};

AbcPage.KEY = "AbcPage";