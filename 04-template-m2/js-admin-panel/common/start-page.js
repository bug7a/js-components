
const startPage = function(params, defaults, view) {

    // Marge params:
    mergeIntoIfMissing(params, defaults);

    // Edit params, if needed:
    params.top = 0;
    params.left = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    view.clean();
    view.add(box);
    view.page = box; // You can control created page with this variable

    box.endPage = function() {

        view.destroyPage = box.destroy;
        view.show();
        
        return endObject(box);

    };

    return box;

};