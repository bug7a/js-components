const ModelePageDefaults = {
    pageKey: null,
    moduleURL: "module1/index.htm",
    container: "(default)",
    color: "transparent",
};

const ModulePage = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, ModelePageDefaults);

    // Edit params, if needed:
    params.top = 0;
    params.left = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    if (box.container === "(default)") { box.container = mainView }
    box.container.clean();
    box.container.setKey(box.pageKey);
    box.container.add(box);
    box.container.page = box;

        box.htmPage = UIWebView.create(0, 0);
        that.width = "100%";
        that.height = "100%";
        that.loadHTMLFile(box.moduleURL);

        box.container.show();

    return endObject(box);

};