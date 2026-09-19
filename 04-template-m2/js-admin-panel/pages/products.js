/* Bismillah */

/*

Products Page (Template) - v26.09

- Product catalog and inventory: summary, low stock alert, filters, a product table with
  thumbnails and stock states, and a product editor (right view).
- Editor: name, SKU (unique), category, status, short description, price, compare-at price, cost
  (discount and margin preview), stock with quick restock, low stock limit, images.
- New product, duplicate (as a draft) and delete (hold to confirm).
- Test data: About 60 products, created one time with a fixed seed. Thumbnails are drawn with SVG.
  Changes are kept while the panel is open. Replace the "PRODUCT SERVICE" functions with your service.

COMPONENTS:
- MiniGraphBox (comp-m4): Summary (bars: one value per category, not a time series)
- TextTabs, SearchInput, TinySelect (comp-m2): Filters
- SmartTable (comp-m3): Product list (custom thumbnail cell)
- InputB, NumberInputB (comp-m2): Editor fields
- RadioButton, CheckBox (comp-m3): Status, stock settings
- SelectFile (comp-m4): Images
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- Waiting (comp-m2): Saving

*/

ProductsPageDefaults = {
    color: "transparent",
    openProductId: null, // Opens the editor of this product. "new": New product (Ex: from the top bar)
};

const ProductsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ProductsPageDefaults, mainView);

    mainView.setKey(ProductsPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = ProductsPage.STYLE;

    const STATUS_TABS = ["", "active", "draft", "archived"]; // "": All

    const STOCK_FILTERS = [
        { id: "", label: "All stock" },
        { id: "in", label: "In stock" },
        { id: "low", label: "Low stock" },
        { id: "out", label: "Out of stock" },
    ];

    const filter = {
        status: "",
        search: "",
        category: "",
        stock: "",
    };

    let searchTimer = null;

    // Components
    let statusTabs, stockSelect;
    let kpiBoxList = [];
    let alertBox, lblAlert;
    let lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    const getProducts = function() {
        return ProductsPage.getProducts();
    };

    // All filters except the status (used for the tab counts too)
    const matchesFilters = function(product) {
        if (filter.category && product.category != filter.category) return false;
        if (filter.stock && ProductsPage.getStockState(product) != filter.stock) return false;
        const search = filter.search.trim().toLowerCase();
        if (search && !(product.name + " " + product.sku).toLowerCase().includes(search)) return false;
        return true;
    };

    const render = function() {

        const list = getProducts().filter(matchesFilters);

        STATUS_TABS.forEach(function(status, index) {
            const count = (status) ? list.filter(function(product) { return product.status == status; }).length : list.length;
            const label = (status) ? ProductsPage.STATUSES[status].label : "All";
            statusTabs.tabItemList[index].text = label + " <span style='opacity:0.55'>" + count + "</span>";
        });

        const shown = (filter.status) ? list.filter(function(product) { return product.status == filter.status; }) : list;

        smartTable.setItemDataList(shown.map(function(product) {
            return {
                id: product.id,
                image: product.images[0] || "",
                name: product.name,
                sku: product.sku,
                category: product.category,
                price: product.price,
                stock: product.stock,
                lowStockLimit: product.lowStockLimit, // Not a column. Used for the stock state.
                status: ProductsPage.STATUSES[product.status].label,
            };
        }));

        lblResultCount.text = shown.length + " products";

        renderSummary();

    };

    const renderSummary = function() {

        const products = getProducts().filter(function(product) { return product.status != "archived"; });
        const low = products.filter(function(product) { return ProductsPage.getStockState(product) == "low"; });
        const out = products.filter(function(product) { return ProductsPage.getStockState(product) == "out"; });
        const value = products.reduce(function(sum, product) { return sum + product.stock * product.cost; }, 0);

        // Bars: one for each category
        const byCategory = function(getValue) {
            return ProductsPage.CATEGORIES.map(function(category) {
                return products.filter(function(product) { return product.category == category.name; }).reduce(function(sum, product) { return sum + getValue(product); }, 0);
            });
        };

        const values = [
            { text: String(products.length), bars: byCategory(function() { return 1; }) },
            { text: ProductsPage.formatMoney(value, 0), bars: byCategory(function(product) { return product.stock * product.cost; }).map(Math.round) },
            { text: String(low.length), bars: byCategory(function(product) { return (ProductsPage.getStockState(product) == "low") ? 1 : 0; }) },
            { text: String(out.length), bars: byCategory(function(product) { return (ProductsPage.getStockState(product) == "out") ? 1 : 0; }) },
        ];

        kpiBoxList.forEach(function(kpiBox, index) {
            kpiBox.setValueText(values[index].text);
            kpiBox.setValues(values[index].bars);
        });

        // Alert
        const needAction = low.length + out.length;
        alertBox.visible = (needAction > 0) ? 1 : 0;
        lblAlert.text = "<b>" + needAction + " products need stock:</b> " + out.length + " out of stock, " + low.length + " low. " +
            "<span style='color:" + White(0.55) + "'>Customers can not buy products that are out of stock.</span>";

    };

    const setStockFilter = function(id) {
        const index = stockSelect.getIndexById(id);
        if (index >= 0) stockSelect.setSelectedIndex(index); // onSelect renders
    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList;
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["sku,name,category,price,stock,status"].concat(rows.map(function(row) {
            return [row.sku, row.name, row.category, row.price, row.stock, row.status].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "products.csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const openEditor = function(product) {
        ProductEditor({
            product: product, // null: New product
            onChange: function() {
                if (box) render();
            },
        });
    };

    const closeEditor = function() {
        if (rightView.isShown(ProductEditor.KEY)) {
            rightView.hide();
            rightView.clean();
        }
    };

    // *** VIEW HELPERS:

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearTimeout(searchTimer);
        closeEditor();

        // WHY: SmartTable has window events and a menu on the page. box.remove() does not remove them.
        if (smartTable) smartTable.destroy();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: "Products", fontSize: 26, textColor: White(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Manage your catalog, prices and stock", fontSize: 14, textColor: White(0.5) });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "right center", gap: 10 });

                ProductsPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV);

                ProductsPage.createButton("Add Product", ASSETS + "top-bar/add.png", function() {
                    openEditor(null);
                }, { primary: 1 });

            endGroup();

        endGroup();

    };

    const initSummary = function() {

        const KPI_LIST = [
            { title: "Products (not archived)", barColor: S.ACCENT_COLOR },
            { title: "Inventory value (cost)", barColor: "#3987E5" },
            { title: "Low stock", barColor: "#C98500" },
            { title: "Out of stock", barColor: S.ERROR_COLOR },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            KPI_LIST.forEach(function(kpi) {

                // WHY: MiniGraphBox (bars), not SparkLineBox: every bar is a category, not a point in time.
                const kpiBox = MiniGraphBox({
                    height: 96,
                    title: kpi.title,
                    valueText: "",
                    iconFile: "",
                    barColor: kpi.barColor,
                    style: {
                        box: { color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 },
                        text: { padding: 14 },
                        title: { fontSize: 13, textColor: White(0.5) },
                        valueText: { fontSize: 24, textColor: White(0.95) },
                        bars: { height: 30, barWidth: 10, gap: 4, padding: 14, round: 2 },
                    },
                });
                kpiBox.elem.title = "Bars: " + ProductsPage.CATEGORIES.map(function(category) { return category.name; }).join(", ");
                setFlex(kpiBox, "1 1 220px");
                kpiBoxList.push(kpiBox);

            });

        endGroup();

        // WHY: Bar count was calculated with the default width (before flex).
        kpiBoxList.forEach(function(kpiBox) { kpiBox.refresh(); });

    };

    const initAlert = function() {

        alertBox = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 12,
            padding: [16, 12],
            color: "rgba(201, 133, 0, 0.10)",
            border: 1,
            borderColor: "rgba(201, 133, 0, 0.45)",
            round: 12,
        });
        that.elem.style.flexWrap = "wrap";

            lblAlert = Label({ text: "", fontSize: 14, textColor: White(0.9) });
            setFlex(lblAlert, "1 1 300px");

            ProductsPage.createButton("Show Low Stock", "", function() { setStockFilter("low"); });
            ProductsPage.createButton("Show Out of Stock", "", function() { setStockFilter("out"); });

        endGroup();

    };

    const initToolbar = function() {

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: 16, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                statusTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: STATUS_TABS.map(function(status) { return (status) ? ProductsPage.STATUSES[status].label : "All"; }),
                    onClick: function(self) {
                        filter.status = STATUS_TABS[self.index];
                        render();
                    },
                    backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    tabPadding: [3, 3],
                    labelStyle: { fontSize: 14, textColor: White(0.85), padding: [12, 6] },
                    selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
                });

                SearchInput({
                    width: 240,
                    height: 40,
                    border: 1,
                    borderColor: S.CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
                    round: 8,
                    color: S.FIELD_COLOR,
                    textColor: White(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Name or SKU",
                    invertIconColor: 1,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, render, 150);
                    },
                });
                that.position = "relative";

                ProductsPage.createTinySelect(
                    [{ id: "", label: "All categories" }].concat(ProductsPage.CATEGORIES.map(function(category) { return { id: category.name, label: category.name }; })),
                    function(id) { filter.category = id; render(); }
                );

                stockSelect = ProductsPage.createTinySelect(STOCK_FILTERS, function(id) { filter.stock = id; render(); });

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                lblResultCount = Label({ text: "", fontSize: 13, textColor: White(0.55) });

            endGroup();

        endGroup();

    };

    const initTable = function() {

        HGroup({ width: "100%", height: 660, align: "left top" });

            smartTable = SmartTable({
                titleDataList: [
                    { name: "", dataTitle: "image", dataType: "string", width: 64, shortable: 0 },
                    { name: "PRODUCT", dataTitle: "name", dataType: "string", width: 280, shortable: 1 },
                    { name: "SKU", dataTitle: "sku", dataType: "string", width: 140, shortable: 1 },
                    { name: "CATEGORY", dataTitle: "category", dataType: "string", width: 140, shortable: 1 },
                    { name: "PRICE", dataTitle: "price", dataType: "float", width: 120, shortable: 1 },
                    { name: "STOCK", dataTitle: "stock", dataType: "integer", width: 150, shortable: 1 },
                    { name: "STATUS", dataTitle: "status", dataType: "string", width: 120, shortable: 1 },
                ],
                itemDataList: [],
                titleHeight: 44,
                itemHeight: 52,
                infoHeight: 56,
                itemLineCount: 10,
                sortByTitleIndex: 1,
                sortDirection: "A-Z",
                onSelect: function(itemData) {
                    const product = getProducts().find(function(p) { return p.id == itemData.id; });
                    if (product) openEditor(product);
                },
                // Thumbnail cell (created one time for each visible row)
                createCustomItemCell: function(cell, titleDataIndex) {
                    if (titleDataIndex != 0) return cell;
                    cell.label.visible = 0;
                    // WHY: The group is created in the current container and moved into the cell (like pages/users.js).
                    cell.thumbGroup = HGroup({ width: "100%", height: "100%", align: "center center" });
                    cell.add(cell.thumbGroup);
                        cell.thumb = Icon({ width: 36, height: 36, round: 6 });
                        cell.thumb.elem.style.objectFit = "cover";
                        cell.thumb.elem.alt = "";
                    endGroup();
                    return cell;
                },
                // WHY: SmartTable writes the raw value (numbers sort right). Texts and colors are written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 0) {
                        cell.label.text = "";
                        if (cell.thumbUrl != data) {
                            cell.thumbUrl = data;
                            if (data) cell.thumb.load(data);
                        }
                        cell.thumb.visible = (data) ? 1 : 0;
                    }
                    if (titleDataIndex == 4 && data !== "") {
                        cell.label.text = ProductsPage.formatMoney(data);
                    }
                    if (titleDataIndex == 5 && data !== "") {
                        // WHY: The cell gets only its own value. The row data (itemData of the line) has the low stock limit.
                        const itemData = cell.containerBox.itemData;
                        const state = ProductsPage.getStockState(itemData);
                        const info = ProductsPage.STOCK_STATES[state];
                        cell.label.text = (state == "out") ? "Out of stock" : data + " · " + info.label;
                        cell.label.textColor = info.color;
                    }
                    if (titleDataIndex == 6) {
                        const status = ProductsPage.getStatusByLabel(data);
                        cell.label.textColor = (status) ? status.color : White(0.75);
                    }
                },
                ...ProductsPage.getSmartTableStyle(LIB_PATH),
            });

        endGroup();

    };

    // *** PAGE INIT CODE:

    // BOX: Scrollable container
    // WHY: page does not scroll. Scrollable content must be inside a Box with scrollY: 1.
    startBox(0, 0, "100%", "100%", {
        color: "transparent",
        scrollY: 1,
    });

        VGroup({
            width: "100%",
            height: "auto", // Grows with content, so the Box can scroll.
            align: "left top",
            gap: 16,
            padding: 24,
        });

            initHeader();
            initSummary();
            initAlert();
            initToolbar();
            initTable();

        endGroup();

    endBox();

    render();

    box.endPage();

    if (box.openProductId === "new") {
        openEditor(null);
    } else if (box.openProductId !== null) {
        const product = ProductsPage.getProducts().find(function(p) { return p.id == box.openProductId; });
        if (product) openEditor(product);
    }

    return box;

};

ProductsPage.KEY = "Products";

// *** PRODUCT EDITOR (RIGHT VIEW):

const ProductEditorDefaults = {
    product: null, // null: New product
    onChange: function() {},
};

const ProductEditor = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ProductEditorDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "#141414";

    // WHY: product is a live object of the list. startObject() would copy it.
    const product = params.product;
    delete params.product;

    // BOX: Component container
    let box = startObject(params);

    const S = ProductsPage.STYLE;
    const isNew = !product;
    const draft = (isNew) ? ProductsPage.createEmptyProduct() : JSON.parse(JSON.stringify(product));
    const radioList = [];
    let saveTimer = null;

    // Components
    let inputName, inputSku, inputDescription, categorySelect;
    let inputPrice, inputCompare, inputCost, lblPriceInfo;
    let inputStock, inputLowLimit, chkContinueSelling, lblStockInfo;
    let imageFile, lblError, btnSave;

    // *** PRODUCT SERVICE (TEST):

    const saveProduct = function() {

        const error = validate();
        lblError.text = error;
        if (error) return;

        btnSave.elem.inert = true;
        if (typeof waiting !== "undefined") waiting.show();

        saveTimer = setTimeout(function() {

            // TODO: Save with your service. Upload the new image files (imageFile.getFiles()) first.
            const newImages = imageFile.getFiles().filter(function(info) { return info.type.startsWith("image/"); }).map(function(info) {
                return URL.createObjectURL(info.file); // TEST: Local address of the file
            });
            draft.images = newImages.concat(draft.images);
            draft.updatedAt = Date.now();

            if (isNew) {
                draft.id = ProductsPage.nextId++;
                ProductsPage.getProducts().push(draft);
            } else {
                Object.assign(product, draft);
            }

            if (typeof waiting !== "undefined") waiting.hide();

            box.onChange();
            rightView.hide();
            rightView.clean();

        }, 400);

    };

    const deleteProduct = function() {
        // TODO: Delete with your service.
        const list = ProductsPage.getProducts();
        const index = list.indexOf(product);
        if (index >= 0) list.splice(index, 1);
        box.onChange();
        rightView.hide();
        rightView.clean();
    };

    const duplicateProduct = function() {
        // TODO: Create with your service.
        const copy = JSON.parse(JSON.stringify(product));
        copy.id = ProductsPage.nextId++;
        copy.name = product.name + " (copy)";
        copy.sku = ProductsPage.getUniqueSku(product.sku + "-COPY");
        copy.status = "draft";
        copy.updatedAt = Date.now();
        ProductsPage.getProducts().push(copy);
        box.onChange();
        ProductEditor({ product: copy, onChange: box.onChange }); // Open the copy
    };

    // *** PRIVATE FUNCTIONS:

    const toNumber = function(input) {
        const text = input.getInputValue().trim();
        return (text === "") ? null : Number(text);
    };

    // Returns an error text, or "".
    const validate = function() {
        const sku = draft.sku;
        if (!draft.name.trim()) return "Product name is required.";
        if (!/^[A-Z0-9-]{3,30}$/.test(sku)) return "SKU: 3-30 capital letters, numbers or \"-\".";
        if (ProductsPage.getProducts().some(function(p) { return p !== product && p.sku == sku; })) return "SKU " + sku + " is used by another product.";
        if (!(draft.price > 0)) return "Price must be more than 0.";
        if (draft.compareAtPrice !== null && draft.compareAtPrice <= draft.price) return "Compare-at price must be more than the price.";
        if (!Number.isInteger(draft.stock) || draft.stock < 0) return "Stock must be a whole number (0 or more).";
        return "";
    };

    const updatePriceInfo = function() {
        const parts = [];
        if (draft.compareAtPrice && draft.price > 0 && draft.compareAtPrice > draft.price) {
            parts.push("<span style='color:" + S.ACCENT_COLOR + "'>" + Math.round((1 - draft.price / draft.compareAtPrice) * 100) + "% discount</span>");
        }
        if (draft.cost !== null && draft.price > 0) {
            const profit = draft.price - draft.cost;
            const color = (profit >= 0) ? White(0.8) : S.ERROR_COLOR;
            parts.push("<span style='color:" + color + "'>Margin " + Math.round(profit / draft.price * 100) + "% (" + ProductsPage.formatMoney(profit) + " profit)</span>");
        }
        lblPriceInfo.text = parts.join(" · ") || "Add a cost to see the margin.";
    };

    const updateStockInfo = function() {
        const state = ProductsPage.getStockState(draft);
        const info = ProductsPage.STOCK_STATES[state];
        lblStockInfo.text = "<span style='color:" + info.color + "'>● " + ((state == "out") ? "Out of stock" : info.label) + "</span>" +
            ((state == "out" && draft.continueSelling) ? " · Customers can still order (backorder)" : "");
    };

    const setStock = function(value) {
        inputStock.setInputValue(String(Math.max(0, value)));
        draft.stock = Math.max(0, value);
        updateStockInfo();
    };

    // *** VIEW HELPERS:

    const startSection = function(title) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10, padding: [16, 14], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });
        Label({ text: title.toUpperCase(), fontSize: 11, textColor: White(0.45) });
        that.elem.style.letterSpacing = "1px";
        return group;
    };

    // Dark style for InputB and NumberInputB
    const createInput = function(Component, params) {
        const input = Component({
            width: "100%",
            leftPadding: 14,
            rightPadding: 36,
            backgroundColor: S.FIELD_COLOR,
            selectedBackgroundColor: "#262625",
            lineColor: "transparent",
            selectedLineColor: "transparent",
            backBorderColor: S.CARD_BORDER_COLOR,
            selectedBackBorderColor: S.ACCENT_COLOR,
            backBorderTopRound: 8,
            backBorderBottomRound: 8,
            requiredColor: S.ERROR_COLOR,
            warningColor: S.ERROR_COLOR,
            isRequired: 0,
            ...params,
        });
        // WHY: InputB has fixed text colors for light backgrounds.
        input.title.textColor = White(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = White(0.9);
        input.input.fontSize = 15;
        input.input.height = 32;
        input.warningBall.borderColor = S.CARD_COLOR;
        return input;
    };

    const startRow = function() {
        HGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });
    };

    const flex = function(obj) {
        obj.elem.style.flex = "1 1 0";
        obj.elem.style.minWidth = "0";
    };

    box.destroy = function() {
        clearTimeout(saveTimer);
        radioList.forEach(function(radio) { radio.destroy(); }); // WHY: Radio groups are static lists.
        if (imageFile) imageFile.destroy();
        box.remove();
        box = null;
    };

    // *** VIEW:

    // Left line
    Box(0, 0, 1, "100%", { color: White(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, padding: 20 });

            // TITLE
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.justifyContent = "space-between";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                    Label({ text: (isNew) ? "New Product" : "Edit Product", fontSize: 20, textColor: White(0.95) });
                    that.elem.style.fontFamily = "opensans-bold";
                    if (!isNew) {
                        Label({ text: "Last change: " + new Date(product.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }), fontSize: 12, textColor: White(0.45) });
                    }
                endGroup();

                Icon({ width: 28, height: 28, clickable: 1 });
                that.load("assets/close.png");
                that.elem.style.filter = "invert(100%)";
                that.elem.style.cursor = "pointer";
                that.opacity = 0.6;
                that.on("click", function() {
                    rightView.hide();
                    rightView.clean();
                });

            endGroup();

            // PRODUCT
            startSection("Product");

                inputName = createInput(InputB, {
                    titleText: "NAME",
                    inputValue: draft.name, // WHY: Created with the value, so a required warning ball is not left on the screen.
                    placeholder: "Ex: Wireless Headphones",
                    maxChar: 80,
                    onEdit: function() { draft.name = inputName.getInputValue(); },
                });

                startRow();

                    inputSku = createInput(InputB, {
                        titleText: "SKU",
                        inputValue: draft.sku,
                        placeholder: "HP-BLK-01",
                        maxChar: 30,
                        onEdit: function() {
                            // Capital letters, numbers and "-"
                            const value = inputSku.getInputValue().toUpperCase().replace(/[^A-Z0-9-]/g, "");
                            if (value != inputSku.getInputValue()) inputSku.setInputValue(value);
                            draft.sku = value;
                        },
                    });
                    flex(inputSku);

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                    flex(that);
                        Label({ text: "CATEGORY", fontSize: 11, textColor: White(0.45) });
                        that.elem.style.letterSpacing = "1px";
                        that.elem.style.marginTop = "4px";
                        categorySelect = ProductsPage.createTinySelect(
                            ProductsPage.CATEGORIES.map(function(category) { return { id: category.name, label: category.name }; }),
                            function(id) { draft.category = id; },
                            Math.max(0, ProductsPage.CATEGORIES.findIndex(function(category) { return category.name == draft.category; }))
                        );
                    endGroup();

                endGroup();

                inputDescription = createInput(InputB, {
                    titleText: "SHORT DESCRIPTION",
                    inputValue: draft.description,
                    placeholder: "One line for the product list (optional)",
                    maxChar: 120,
                    onEdit: function() { draft.description = inputDescription.getInputValue(); },
                });

                Label({ text: "STATUS", fontSize: 11, textColor: White(0.45) });
                that.elem.style.letterSpacing = "1px";

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 20 });
                that.elem.style.flexWrap = "wrap";

                    Object.keys(ProductsPage.STATUSES).forEach(function(status) {
                        const radio = RadioButton({
                            group: "productStatus",
                            value: status,
                            checked: (draft.status == status) ? 1 : 0,
                            labelText: ProductsPage.STATUSES[status].label + " <span style='font-size:12px; color:" + White(0.4) + "'>" + ProductsPage.STATUSES[status].desc + "</span>",
                            style: {
                                mark: { width: 20, height: 20, color: "transparent", borderColor: White(0.35) },
                                checkedMark: { color: "transparent", borderColor: S.ACCENT_COLOR },
                                hoverMark: { borderColor: White(0.7) },
                                dot: { color: S.ACCENT_COLOR },
                                label: { fontSize: 14, textColor: White(0.9) },
                            },
                            onChange: function(self) { draft.status = self.value; },
                        });
                        radioList.push(radio);
                    });

                endGroup();

            endGroup();

            // PRICING
            startSection("Pricing");

                startRow();

                    inputPrice = createInput(NumberInputB, {
                        titleText: "PRICE ($)",
                        inputValue: (draft.price) ? String(draft.price) : "",
                        placeholder: "0.00",
                        allowNegative: 0,
                        onEdit: function() { draft.price = toNumber(inputPrice) || 0; updatePriceInfo(); },
                    });
                    flex(inputPrice);

                    inputCompare = createInput(NumberInputB, {
                        titleText: "COMPARE-AT ($)",
                        inputValue: (draft.compareAtPrice !== null) ? String(draft.compareAtPrice) : "",
                        placeholder: "Old price",
                        allowNegative: 0,
                        onEdit: function() { draft.compareAtPrice = toNumber(inputCompare); updatePriceInfo(); },
                    });
                    flex(inputCompare);

                    inputCost = createInput(NumberInputB, {
                        titleText: "COST ($)",
                        inputValue: (draft.cost !== null) ? String(draft.cost) : "",
                        placeholder: "Not shown",
                        allowNegative: 0,
                        onEdit: function() { draft.cost = toNumber(inputCost); updatePriceInfo(); },
                    });
                    flex(inputCost);

                endGroup();

                lblPriceInfo = Label({ text: "", fontSize: 13, textColor: White(0.6), width: "100%" });

            endGroup();

            // INVENTORY
            startSection("Inventory");

                startRow();

                    inputStock = createInput(NumberInputB, {
                        titleText: "IN STOCK",
                        inputValue: String(draft.stock),
                        placeholder: "0",
                        allowNegative: 0,
                        allowDecimal: 0,
                        onEdit: function() { draft.stock = toNumber(inputStock) || 0; updateStockInfo(); },
                    });
                    flex(inputStock);

                    inputLowLimit = createInput(NumberInputB, {
                        titleText: "LOW STOCK AT",
                        inputValue: String(draft.lowStockLimit),
                        placeholder: "5",
                        allowNegative: 0,
                        allowDecimal: 0,
                        onEdit: function() { draft.lowStockLimit = toNumber(inputLowLimit) || 0; updateStockInfo(); },
                    });
                    flex(inputLowLimit);

                endGroup();

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                that.elem.style.flexWrap = "wrap";

                    Label({ text: "Restock:", fontSize: 13, textColor: White(0.55) });
                    [10, 25, 50].forEach(function(amount) {
                        ProductsPage.createButton("+" + amount, "", function() { setStock(draft.stock + amount); });
                    });
                    ProductsPage.createButton("Set to 0", "", function() { setStock(0); });

                endGroup();

                chkContinueSelling = CheckBox({
                    labelText: "Continue selling when out of stock",
                    checked: (draft.continueSelling) ? 1 : 0,
                    style: {
                        layout: { padding: [0, 2] },
                        mark: { width: 20, height: 20, color: "transparent", borderColor: White(0.35) },
                        checkedMark: { color: S.PRIMARY_COLOR, borderColor: S.PRIMARY_COLOR },
                        hoverMark: { borderColor: White(0.7) },
                        tick: { color: White(1) },
                        label: { fontSize: 14, textColor: White(0.9) },
                    },
                    onChange: function(self) { draft.continueSelling = self.checked; updateStockInfo(); },
                });

                lblStockInfo = Label({ text: "", fontSize: 13, textColor: White(0.6), width: "100%" });

            endGroup();

            // IMAGES
            startSection("Images");

                if (draft.images.length) {
                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                    that.elem.style.flexWrap = "wrap";
                        draft.images.forEach(function(url, index) {
                            Icon({ width: 72, height: 72, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR });
                            that.load(url);
                            that.elem.style.objectFit = "cover";
                            that.elem.alt = "Image " + (index + 1);
                        });
                    endGroup();
                }

                imageFile = SelectFile({
                    width: "100%",
                    multiple: 1,
                    maxFiles: 6,
                    accept: "image/*",
                    maxSize: 5 * 1024 * 1024,
                    zoneHeight: 100,
                    showIcon: 0,
                    titleText: "Drop new images here",
                    descText: "or click to select (the first image is the main image)",
                    style: {
                        zone: { color: S.FIELD_COLOR, border: 2, borderColor: White(0.12), round: 10 },
                        zoneHover: { color: "#262625", borderColor: White(0.3) },
                        zoneDragOver: { color: "#1F2B28", borderColor: S.ACCENT_COLOR },
                        title: { fontSize: 14, textColor: White(0.9) },
                        desc: { fontSize: 13, textColor: White(0.5) },
                        hint: { textColor: White(0.4) },
                        item: { color: S.FIELD_COLOR, borderColor: White(0.1) },
                        itemName: { textColor: White(0.85) },
                        itemSize: { textColor: White(0.45) },
                        badge: { color: White(0.08), textColor: White(0.6) },
                        removeButton: { textColor: White(0.45), hoverColor: S.ERROR_COLOR },
                    },
                });

            endGroup();

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        if (!isNew) {

            const btnDelete = HoldToConfirmButton({
                height: 40,
                labelText: "Hold to Delete",
                completedText: "DELETED",
                iconFile: "../../comp-m3/hold-to-confirm-button/trash.png",
                holdingIconFile: "../../comp-m3/hold-to-confirm-button/trash-red.png",
                holdDuration: 1200,
                resetDelay: 600,
                style: {
                    layout: { gap: 6, padding: [14, 0] },
                    icon: { width: 20, height: 20 },
                    label: { fontSize: 14, textColor: White(0.9) },
                    holdingLabel: { fontSize: 14, textColor: "#B03A2E" },
                    completedLabel: { fontSize: 14, textColor: "#2C5A38" },
                    box: { color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
                    holdingBox: { color: "#FFD1CB", borderColor: S.ERROR_COLOR, round: 8 },
                    completedBox: { color: "#DFEFE6", borderColor: S.ACCENT_COLOR, round: 8 },
                },
                onConfirm: deleteProduct,
            });
            btnDelete.icon.elem.style.filter = "invert(100%)"; // WHY: Only the normal icon is on a dark background.

            ProductsPage.createButton("Duplicate", "", duplicateProduct);

        }

        lblError = Label({ text: "", fontSize: 13, textColor: S.ERROR_COLOR, textAlign: "right" });
        lblError.elem.style.flex = "1 1 auto";
        lblError.elem.style.minWidth = "0";

        btnSave = ProductsPage.createButton((isNew) ? "Create Product" : "Save", "", saveProduct, { primary: 1 });

    endGroup();

    // *** INIT CODE:

    updatePriceInfo();
    updateStockInfo();

    rightView.clean();
    rightView.setKey(ProductEditor.KEY);
    rightView.setWidth(580);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    if (isNew) inputName.input.inputElement.focus();

    return endObject(box);

};

ProductEditor.KEY = "ProductEditor";

// *** STATIC: STYLE AND HELPERS

ProductsPage.STYLE = {
    CARD_COLOR: "#1A1A19",
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
    ERROR_COLOR: "#E66767",
};

ProductsPage.STATUSES = {
    active: { label: "Active", desc: "On sale", color: "#65A293" },
    draft: { label: "Draft", desc: "Not visible", color: "#C98500" },
    archived: { label: "Archived", desc: "Old product", color: "#A9A79F" },
};

ProductsPage.STOCK_STATES = {
    in: { label: "In stock", color: "rgba(255, 255, 255, 0.8)" },
    low: { label: "Low", color: "#E0A03C" },
    out: { label: "Out of stock", color: "#E66767" },
};

ProductsPage.CATEGORIES = [
    { name: "Audio", color: "#3987E5" },
    { name: "Wearables", color: "#9085E9" },
    { name: "Shoes", color: "#D55181" },
    { name: "Home", color: "#C98500" },
    { name: "Bags", color: "#65A293" },
    { name: "Books", color: "#E66767" },
    { name: "Accessories", color: "#199E70" },
];

// "in", "low" or "out"
ProductsPage.getStockState = function(product) {
    if (product.stock <= 0) return "out";
    if (product.stock <= product.lowStockLimit) return "low";
    return "in";
};

ProductsPage.getStatusByLabel = function(label) {
    const id = Object.keys(ProductsPage.STATUSES).find(function(key) { return ProductsPage.STATUSES[key].label == label; });
    return (id) ? ProductsPage.STATUSES[id] : null;
};

ProductsPage.formatMoney = function(value, digits = 2) {
    return ((value < 0) ? "-$" : "$") + Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

ProductsPage.getUniqueSku = function(sku) {
    let result = sku;
    let index = 2;
    while (ProductsPage.getProducts().some(function(p) { return p.sku == result; })) result = sku + "-" + index++;
    return result;
};

ProductsPage.createEmptyProduct = function() {
    return {
        id: null,
        name: "",
        sku: "",
        category: ProductsPage.CATEGORIES[0].name,
        description: "",
        status: "draft",
        price: 0,
        compareAtPrice: null,
        cost: null,
        stock: 0,
        lowStockLimit: 5,
        continueSelling: 0,
        images: [],
        updatedAt: Date.now(),
    };
};

// params: { primary: 1, width }
ProductsPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = ProductsPage.STYLE;
    const btn = ButtonWithIcon({
        width: params.width || "auto",
        labelText: text,
        iconFile: iconFile || "",
        onClick: onClick,
        style: {
            layout: { gap: 8, padding: [14, 8] },
            icon: { width: 18, height: 18 },
            label: { fontSize: 14, textColor: White(0.92) },
            box: { color: (params.primary) ? S.PRIMARY_COLOR : S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
            hover: { color: (params.primary) ? "#468A79" : "#2C2C2A" },
            active: { color: (params.primary) ? "#2C5A38" : "#383835" },
        },
    });
    if (btn.icon) btn.icon.elem.style.filter = "invert(100%)"; // WHY: Panel icons are black.
    return btn;
};

// selectedIndex: The first selected item
ProductsPage.createTinySelect = function(list, onSelect, selectedIndex = 0) {
    const S = ProductsPage.STYLE;
    let isReady = 0; // WHY: TinySelect calls onSelect when it is created.
    const select = TinySelect({
        list: list,
        selectedIndex: selectedIndex,
        height: 40,
        fontSize: 14,
        color: S.FIELD_COLOR,
        border: 1,
        borderColor: S.CARD_BORDER_COLOR,
        round: 8,
        labelBoldFont: 0,
        labelTextColor: White(0.9),
        arrowIcon: "../../comp-m2/tiny-select/arrow.svg",
        arrowSize: 18,
        invertIconColor: 1,
        listFontSize: 14,
        listTextColor: White(0.85),
        listOverTextColor: S.ACCENT_COLOR,
        listBackgroundColor: S.FIELD_COLOR,
        listBorderColor: White(0.15),
        onSelect: function(index, id) {
            if (isReady) onSelect(id);
        },
    });
    isReady = 1;
    return select;
};

ProductsPage.getSmartTableStyle = function(libPath) {
    const S = ProductsPage.STYLE;
    return {
        scrollBarParams: {
            bar_border: 0, bar_round: 3, bar_borderColor: "rgba(255, 255, 255, 0.15)", bar_width: 4, bar_mouseOverWidth: 4,
            bar_mouseOverColor: "#A0A0A0", bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2, bar_color: "#A0A0A0",
            neverHide: 0, showDots: 0,
        },
        // WHY: Filtre kutusu ile alt bar aynı renkti, kutu görünmüyordu. Bar kart rengine, kutu ise alan rengine (FIELD_COLOR) alındı.
        searchInputParams: {
            width: "50%", height: 34, border: 1, round: 8, color: S.FIELD_COLOR, borderColor: S.CARD_BORDER_COLOR,
            borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
            textColor: White(0.9), placeholderColor: White(0.4), fontSize: 14,
            placeholderText: "Filter the table",
            searchIconSize: 15, searchIconOpacity: 0.55, invertIconColor: 1,
            searchIconFile: libPath + "comp-m2/search-input-v2/filter.png",
            clearIconFile: libPath + "comp-m2/search-input-v2/clear.svg",
        },
        // Filtre kutusundaki sütun seçim listesi (ALL) de koyu tema ile açılsın.
        searchTitleMenuParams: {
            minWidth: 170,
            style: {
                menu: { color: S.FIELD_COLOR, border: 1, borderColor: White(0.12), round: 8, padding: 4, shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
                item: { height: 30, fontSize: 13, textColor: White(0.75), color: "transparent", round: 6, padding: 10, gap: 10 },
                itemHover: { textColor: "white", color: White(0.08) },
                disabled: { textColor: White(0.3), opacity: 0.4 },
                icon: { width: 14, height: 14 },
                separator: { color: White(0.1), space: 4 },
            },
        },
        style: {
            width: "100%",
            height: "100%",
            round: 8,
            line1Color: S.CARD_COLOR,
            line2Color: "#202020",
            highlightItemCellColor: "#2A3A36",
            highlightTitleCellColor: White(0.08),
            verticalScrollWidth: 20,
            verticalScrollMargin: 2,
            btnScrollDownIconFile: libPath + "comp-m3/smart-table/down.png",
            btnScrollUpIconFile: libPath + "comp-m3/smart-table/up.png",
            btnScrollCenterIconFile: libPath + "comp-m3/smart-table/scroll.png",
            sortIconFile: libPath + "comp-m3/smart-table/sort.png",
            // WHY: Varsayılan tik ikonu koyu renkli; koyu menüde görünmüyordu.
            searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + S.ACCENT_COLOR + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
            loadingIconFile: libPath + "comp-m3/smart-table/clock.png",
            invertIconColor: 1,
            box: { color: S.CARD_COLOR },
            boxBorder: { border: 1, borderColor: S.CARD_BORDER_COLOR },
            boxTitleLine: { color: S.FIELD_COLOR },
            boxTitleCell: { padding: [10, 0], borderRight: "1px solid rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.12)" },
            lblTitleCell: { fontSize: 13, fontFamily: "opensans", textColor: White(0.6) },
            boxItemCell: { borderBottom: "1px solid rgba(255, 255, 255, 0.05)", borderRight: "1px solid rgba(255, 255, 255, 0.03)", padding: [10, 0] },
            lblItemCell: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.75)", fontFamily: "opensans" },
            boxInfoLine: { color: S.CARD_COLOR, borderTop: "1px solid rgba(255, 255, 255, 0.08)" },
            lblBoxInfoLine: { fontSize: 13, textColor: White(0.55) },
            lblNoDataFound: { color: "#2C2C2A", textColor: White(0.6), padding: [8, 2], fontSize: 13, round: 8, border: 1, borderColor: White(0.15) },
            // Filtre kutusunun içindeki sütun etiketi: Kutunun içinde durduğu için daha hafif bir chip.
            lblSearchTitle: { color: White(0.08), textColor: White(0.6), padding: [8, 1], fontSize: 12, round: 6, border: 1, borderColor: White(0.14) },
            btnScrollCenter: { color: "#2C2C2A", round: 100, borderColor: White(0.2), border: 1 },
            btnScrollUp: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
            btnScrollDown: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
            boxSort: { color: S.PRIMARY_COLOR },
        },
    };
};

// *** STATIC: TEST DATA

ProductsPage._products = null;
ProductsPage.nextId = 1;

// Product thumbnail: category color and the first letters (SVG data URL)
ProductsPage.createThumbnail = function(name, color) {
    const letters = name.split(" ").map(function(word) { return word[0]; }).join("").slice(0, 2).toUpperCase();
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72'>" +
        "<rect width='72' height='72' fill='" + color + "'/>" +
        "<circle cx='58' cy='14' r='22' fill='rgba(255,255,255,0.15)'/>" +
        "<text x='36' y='45' font-family='sans-serif' font-size='26' font-weight='bold' fill='white' text-anchor='middle'>" + letters + "</text>" +
        "</svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
};

// Products. Created one time and kept while the panel is open.
// TODO: Load the products from your service.
ProductsPage.getProducts = function() {

    if (ProductsPage._products) return ProductsPage._products;

    // Random numbers with a seed: the same test data every time. (mulberry32)
    let seed = 7031;
    const rnd = function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // [category, base names, price range]
    const CATALOG = [
        ["Audio", ["Wireless Headphones", "Bluetooth Speaker", "Earbuds Pro", "Studio Monitor", "Soundbar Mini"], [39, 249]],
        ["Wearables", ["Smart Watch Fit", "Fitness Band", "Sport Watch GPS", "Smart Ring"], [49, 299]],
        ["Shoes", ["Running Shoes", "Trail Shoes", "Canvas Sneakers", "Walking Shoes"], [45, 140]],
        ["Home", ["Ceramic Coffee Mug", "Desk Lamp", "Wall Clock", "Plant Pot", "Throw Blanket"], [9, 79]],
        ["Bags", ["Backpack 20L", "Laptop Sleeve", "Travel Duffel", "Tote Bag"], [19, 129]],
        ["Books", ["Modern JavaScript", "Clean Design", "The Web Book", "Learning SQL"], [15, 45]],
        ["Accessories", ["USB-C Cable", "Phone Stand", "Wireless Charger", "Screen Cleaner", "Cable Organizer"], [6, 49]],
    ];

    const VARIANTS = ["Black", "White", "Grey", "Blue", "Green"];
    const list = [];

    CATALOG.forEach(function(entry) {

        const category = ProductsPage.CATEGORIES.find(function(c) { return c.name == entry[0]; });

        entry[1].forEach(function(baseName, baseIndex) {

            const variantCount = 1 + Math.floor(rnd() * 3);

            for (let v = 0; v < variantCount; v++) {

                const variant = VARIANTS[(baseIndex + v) % VARIANTS.length];
                const name = baseName + " (" + variant + ")";
                const price = Math.round((entry[2][0] + rnd() * (entry[2][1] - entry[2][0]))) - 0.01;
                const stockRoll = rnd();
                const stock = (stockRoll < 0.1) ? 0 : (stockRoll < 0.25) ? 1 + Math.floor(rnd() * 5) : 6 + Math.floor(rnd() * 180);
                const statusRoll = rnd();

                // WHY: Short SKUs of different names can be the same ("Smart Watch", "Smart Ring").
                let sku = (entry[0].slice(0, 2) + "-" + baseName.replace(/[^A-Za-z]/g, "").slice(0, 3) + "-" + variant.slice(0, 3)).toUpperCase();
                const baseSku = sku;
                for (let n = 2; list.some(function(p) { return p.sku == sku; }); n++) sku = baseSku + "-" + n;

                list.push({
                    id: ProductsPage.nextId++,
                    name: name,
                    sku: sku,
                    category: entry[0],
                    description: "",
                    status: (statusRoll < 0.8) ? "active" : (statusRoll < 0.92) ? "draft" : "archived",
                    price: price,
                    compareAtPrice: (rnd() < 0.2) ? Math.round(price * 1.25) - 0.01 : null,
                    cost: Math.round(price * (0.4 + rnd() * 0.25) * 100) / 100,
                    stock: stock,
                    lowStockLimit: 5,
                    continueSelling: 0,
                    images: [ProductsPage.createThumbnail(baseName, category.color)],
                    updatedAt: Date.now() - Math.floor(rnd() * 60) * 86400000,
                });

            }

        });

    });

    ProductsPage._products = list;
    return list;

};
