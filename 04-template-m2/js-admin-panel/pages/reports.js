ReportsPageDefaults = {
    color: "transparent",
};

const ReportsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ReportsPageDefaults, mainView);

    box.destroy = function() {
        box.remove();
        box = null;
    };

    mainView.setKey(ReportsPage.KEY);

    AutoLayout();

        Label({
            text: "Reports Page",
            textColor: White(0.65),
        });

    endAutoLayout();
    
    return box.endPage();

};

ReportsPage.KEY = "Reports";