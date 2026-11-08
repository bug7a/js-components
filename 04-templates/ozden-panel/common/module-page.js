const ModelePageDefaults = {
    pageKey: null,
    moduleURL: "module1/empty-main.htm",
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

        // BOX: The page of the module in an iframe (WebView)
        // WHY no surface, edge, round and loading cover: the module fills the view; a white cover flashed on the
        //     dark themes (UIWebView had none of them)
        box.htmPage = WebView({
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            url: box.moduleURL,
            ariaLabel: box.pageKey || "Module",
            showLoading: 0,
            style: { box: { color: "transparent", border: 0, round: 0 } },
        });

        box.container.show();

    return endObject(box);

};