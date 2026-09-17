/* Bismillah */

/*

Orders Page (Template) - v26.09

- Order management: status tabs with counts, summary graphs, filters, an order table and
  an order details panel (right view) with items, totals, address, timeline and actions.
- Status flow: Pending -> Processing -> Shipped (carrier and tracking number) -> Delivered.
  Pending and processing orders can be cancelled. Shipped and delivered orders can be refunded.
- Internal notes are added to the timeline. The invoice can be printed.
- Test data: About 600 orders of the last 60 days, created one time with a fixed seed.
  Changes are kept while the panel is open. Replace the "ORDER SERVICE" functions with your service.

COMPONENTS:
- TextTabs (comp-m2): Status tabs
- MiniGraphBox (comp-m4): Summary graphs
- SearchInput, TinySelect (comp-m2): Filters
- SmartTable (comp-m3): Order list
- TinyTable (comp-m2): Order items
- InputB (comp-m2): Tracking number, note
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- Dialog, Waiting (comp-m2): Cancel confirm, saving

*/

OrdersPageDefaults = {
    color: "transparent",
    openOrderId: null, // Opens the details of this order. (Ex: from the search on the top bar)
};

const OrdersPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, OrdersPageDefaults, mainView);

    mainView.setKey(OrdersPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = OrdersPage.STYLE;
    const STATUSES = OrdersPage.STATUSES;

    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;

    // Tabs: "" -> All
    const TABS = ["", "pending", "processing", "shipped", "delivered", "cancelled", "refunded"];

    const RANGES = [
        { id: "7", label: "Last 7 days", ms: 7 * DAY },
        { id: "30", label: "Last 30 days", ms: 30 * DAY },
        { id: "60", label: "Last 60 days", ms: 60 * DAY },
    ];

    const filter = {
        status: "",
        search: "",
        payment: "",
        rangeId: "30",
    };

    let searchTimer = null;

    // Components
    let statusTabs, searchInput, paymentSelect, rangeSelect;
    let kpiBoxList = [];
    let lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    const getOrders = function() {
        return OrdersPage.getOrders();
    };

    const getRangeStart = function() {
        return Date.now() - RANGES.find(function(range) { return range.id == filter.rangeId; }).ms;
    };

    // All filters except the status (used for the tab counts too)
    const matchesFilters = function(order) {
        if (order.time < getRangeStart()) return false;
        if (filter.payment && order.payment != filter.payment) return false;
        const search = filter.search.trim().toLowerCase();
        if (search) {
            const text = (order.id + " " + order.customer.name + " " + order.customer.email).toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    };

    const render = function() {

        const list = getOrders().filter(matchesFilters);

        // Tab counts
        TABS.forEach(function(status, index) {
            const count = (status) ? list.filter(function(order) { return order.status == status; }).length : list.length;
            const label = (status) ? STATUSES[status].label : "All";
            statusTabs.tabItemList[index].text = label + " <span style='opacity:0.55'>" + count + "</span>";
        });

        const shown = (filter.status) ? list.filter(function(order) { return order.status == filter.status; }) : list;

        smartTable.setItemDataList(shown.map(function(order) {
            return {
                id: order.id,
                date: OrdersPage.formatDateTime(order.time), // Sortable text
                customer: order.customer.name,
                items: order.items.reduce(function(sum, item) { return sum + item.qty; }, 0),
                total: order.total,
                payment: order.payment,
                status: STATUSES[order.status].label,
            };
        }));

        const revenue = shown.filter(function(order) { return !["cancelled", "refunded"].includes(order.status); })
            .reduce(function(sum, order) { return sum + order.total; }, 0);
        lblResultCount.text = shown.length.toLocaleString("en-US") + " orders · " + OrdersPage.formatMoney(revenue) + " revenue (without cancelled and refunded)";

        renderSummary();

    };

    const renderSummary = function() {

        const orders = getOrders();
        const now = Date.now();
        const isValid = function(order) { return !["cancelled", "refunded"].includes(order.status); };

        // Buckets: count bars from the newest to the oldest
        const buckets = function(count, size, getValue) {
            const bars = new Array(count).fill(0);
            orders.forEach(function(order) {
                const age = now - order.time;
                if (age < 0 || age >= count * size) return;
                bars[count - 1 - Math.floor(age / size)] += getValue(order);
            });
            return bars;
        };

        const ordersToday = buckets(24, HOUR, function(order) { return 1; });
        const revenueToday = buckets(24, HOUR, function(order) { return (isValid(order)) ? order.total : 0; });
        const toShip = orders.filter(function(order) { return order.status == "processing"; });
        const refunds = buckets(30, DAY, function(order) { return (order.status == "refunded") ? 1 : 0; });

        const values = [
            { text: String(sum(ordersToday)), bars: ordersToday },
            { text: OrdersPage.formatMoney(sum(revenueToday)), bars: revenueToday.map(Math.round) },
            { text: String(toShip.length), bars: buckets(7, DAY, function(order) { return (order.status == "processing") ? 1 : 0; }) },
            { text: String(sum(refunds)), bars: refunds },
        ];

        kpiBoxList.forEach(function(kpiBox, index) {
            kpiBox.setValueText(values[index].text);
            kpiBox.setValues(values[index].bars);
        });

    };

    const sum = function(list) {
        return list.reduce(function(total, value) { return total + value; }, 0);
    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList; // WHY: Also uses the sort and the search of the table.
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["order,date,customer,items,total,payment,status"].concat(rows.map(function(row) {
            return [row.id, row.date, row.customer, row.items, row.total, row.payment, row.status].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "orders-" + OrdersPage.formatDateTime(Date.now()).slice(0, 10) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const openDetails = function(orderId) {
        const order = getOrders().find(function(o) { return o.id == orderId; });
        if (!order) return;
        OrderDetails({
            order: order,
            onChange: function() {
                if (box) render();
            },
        });
    };

    const closeDetails = function() {
        if (rightView.isShown(OrderDetails.KEY)) {
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
        closeDetails();

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

                Label({ text: "Orders", fontSize: 26, textColor: White(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Process, ship and refund the orders of your store", fontSize: 14, textColor: White(0.5) });

            endGroup();

            OrdersPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV, { primary: 1 });

        endGroup();

    };

    const initSummary = function() {

        const KPI_LIST = [
            { title: "Orders · 24 hours", barColor: S.ACCENT_COLOR },
            { title: "Revenue · 24 hours", barColor: "#3987E5" },
            { title: "Waiting to ship", barColor: "#C98500" },
            { title: "Refunds · 30 days", barColor: S.ERROR_COLOR },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            KPI_LIST.forEach(function(kpi) {

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
                        bars: { height: 30, barWidth: 5, gap: 2, padding: 14, round: 2 },
                    },
                });
                setFlex(kpiBox, "1 1 220px");
                kpiBoxList.push(kpiBox);

            });

        endGroup();

        // WHY: Bar count was calculated with the default width (before flex).
        kpiBoxList.forEach(function(kpiBox) { kpiBox.refresh(); });

    };

    const initToolbar = function() {

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: 16, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });

            // TABS: Status (horizontal scroll on small widths)
            HGroup({ width: "100%", height: "auto", align: "left top" });
            that.elem.style.overflowX = "auto";

                statusTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: TABS.map(function(status) { return (status) ? STATUSES[status].label : "All"; }),
                    onClick: function(self) {
                        filter.status = TABS[self.index];
                        render();
                    },
                    backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    tabPadding: [3, 3],
                    labelStyle: { fontSize: 14, textColor: White(0.85), padding: [12, 6] },
                    selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
                });

            endGroup();

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                searchInput = SearchInput({
                    width: 280,
                    height: 40,
                    border: 1,
                    borderColor: S.CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
                    round: 8,
                    color: S.FIELD_COLOR,
                    textColor: White(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Search orders",
                    invertIconColor: 1,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, render, 200); // WHY: Do not filter on every key.
                    },
                });
                that.position = "relative";

                rangeSelect = OrdersPage.createTinySelect(
                    RANGES.map(function(range) { return { id: range.id, label: range.label }; }),
                    function(id) { filter.rangeId = id; render(); },
                    1 // Selected: "Last 30 days"
                );

                paymentSelect = OrdersPage.createTinySelect(
                    [{ id: "", label: "All payments" }].concat(OrdersPage.PAYMENTS.map(function(name) { return { id: name, label: name }; })),
                    function(id) { filter.payment = id; render(); }
                );

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                lblResultCount = Label({ text: "", fontSize: 13, textColor: White(0.55) });

            endGroup();

        endGroup();

    };

    const initTable = function() {

        HGroup({ width: "100%", height: 640, align: "left top" });

            smartTable = SmartTable({
                titleDataList: [
                    { name: "ORDER", dataTitle: "id", dataType: "string", width: 130, shortable: 1 },
                    { name: "DATE", dataTitle: "date", dataType: "string", width: 180, shortable: 1 },
                    { name: "CUSTOMER", dataTitle: "customer", dataType: "string", width: 200, shortable: 1 },
                    { name: "ITEMS", dataTitle: "items", dataType: "integer", width: 90, shortable: 1 },
                    { name: "TOTAL", dataTitle: "total", dataType: "float", width: 130, shortable: 1 },
                    { name: "PAYMENT", dataTitle: "payment", dataType: "string", width: 160, shortable: 1 },
                    { name: "STATUS", dataTitle: "status", dataType: "string", width: 140, shortable: 1 },
                ],
                itemDataList: [],
                titleHeight: 44,
                itemHeight: 40,
                infoHeight: 56,
                itemLineCount: 13,
                sortByTitleIndex: 1,
                sortDirection: "Z-A", // Newest first
                onSelect: function(itemData) {
                    openDetails(itemData.id);
                },
                // WHY: SmartTable writes the raw value (totals sort as numbers). Money and status colors are written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 4 && data !== "") cell.label.text = OrdersPage.formatMoney(data);
                    if (titleDataIndex == 6) {
                        const status = OrdersPage.getStatusByLabel(data);
                        cell.label.textColor = (status) ? status.color : White(0.75);
                    }
                },
                ...OrdersPage.getSmartTableStyle(LIB_PATH),
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
            initToolbar();
            initTable();

        endGroup();

    endBox();

    render();

    box.endPage();

    if (box.openOrderId !== null) openDetails(box.openOrderId);

    return box;

};

OrdersPage.KEY = "Orders";

// *** DETAILS PANEL (RIGHT VIEW):

const OrderDetailsDefaults = {
    order: null,
    onChange: function(order) {},
};

const OrderDetails = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, OrderDetailsDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "#141414";

    // WHY: order is a live object of the list. startObject() would copy it.
    const order = params.order;

    // BOX: Component container
    let box = startObject(params);

    const S = OrdersPage.STYLE;
    const escape = OrdersPage.escapeHtml;
    let saveTimer = null;

    // *** ORDER SERVICE (TEST):

    // Changes the order like a server request, then opens the panel again with the new data.
    const updateOrder = function(change, historyText, historyType) {

        if (typeof waiting !== "undefined") waiting.show();

        saveTimer = setTimeout(function() {

            // TODO: Send the change to your service. (Also e-mail the customer for status changes.)
            Object.assign(order, change);
            order.history.push({ time: Date.now(), text: historyText, type: historyType, by: "You" });

            if (typeof waiting !== "undefined") waiting.hide();

            box.onChange(order);
            OrderDetails({ order: order, onChange: box.onChange }); // Render again

        }, 400);

    };

    // *** VIEW HELPERS:

    const startSection = function(title) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: [16, 14], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });
        if (title) {
            Label({ text: title.toUpperCase(), fontSize: 11, textColor: White(0.45) });
            that.elem.style.letterSpacing = "1px";
        }
        return group;
    };

    const createInfoLine = function(left, right, rightStyle = {}) {
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.justifyContent = "space-between";
            Label({ text: left, fontSize: 14, textColor: White(0.55) });
            that.elem.style.flexShrink = "0";
            Label({ text: right, fontSize: 14, textColor: White(0.9), textAlign: "right", ...rightStyle });
        endGroup();
    };

    const createDarkInput = function(params) {
        const input = InputB({
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

    // WHY: Some components have no enabled setting. "inert" blocks the mouse and keyboard for all the children.
    const setInteractive = function(obj, enabled) {
        obj.elem.inert = !enabled;
        obj.opacity = (enabled) ? 1 : 0.4;
    };

    box.destroy = function() {
        clearTimeout(saveTimer);
        box.remove();
        box = null;
    };

    // *** VIEW:

    const status = OrdersPage.STATUSES[order.status];

    // Left line
    Box(0, 0, 1, "100%", { color: White(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, padding: 20 });

            // TITLE
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 2 });
                that.elem.style.flex = "1 1 auto";

                    HGroup({ width: "auto", height: "auto", align: "left center", gap: 10 });
                        Label({ text: order.id, fontSize: 20, textColor: White(0.95) });
                        that.elem.style.fontFamily = "opensans-bold";
                        Label({ text: status.label.toUpperCase(), fontSize: 11, textColor: status.color, color: OrdersPage.alpha(status.color, 0.15), round: 6, padding: [8, 3] });
                        that.elem.style.letterSpacing = "1px";
                    endGroup();

                    Label({ text: new Date(order.time).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" }) + " · " + escape(order.payment), fontSize: 13, textColor: White(0.5) });

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

            // NEXT STEP
            const initNextStep = function() {

                if (order.status == "pending") {
                    startSection("Next step");
                        Label({ text: "A new order. Check the payment and start preparing it.", fontSize: 14, textColor: White(0.8), width: "100%" });
                        OrdersPage.createButton("Start Processing", "", function() {
                            updateOrder({ status: "processing" }, "Order is being prepared", "processing");
                        }, { primary: 1 });
                    endGroup();
                }

                if (order.status == "processing") {

                    startSection("Ship the order");

                        let carrierId = OrdersPage.CARRIERS[0];

                        HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 10 });

                            VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                                Label({ text: "CARRIER", fontSize: 11, textColor: White(0.45) });
                                that.elem.style.letterSpacing = "1px";
                                OrdersPage.createTinySelect(OrdersPage.CARRIERS.map(function(name) { return { id: name, label: name }; }), function(id) { carrierId = id; });
                            endGroup();

                            const trackingInput = createDarkInput({
                                titleText: "TRACKING NUMBER",
                                placeholder: "At least 8 letters or numbers",
                                maxChar: 30,
                                warningText: "At least 8 letters or numbers",
                                onEdit: function() {
                                    setInteractive(btnShip, trackingInput.isValid() == 1);
                                },
                            });
                            trackingInput.isValid = function() {
                                return /^[A-Za-z0-9-]{8,}$/.test(trackingInput.getInputValue().trim()) ? 1 : 0;
                            };
                            trackingInput.elem.style.flex = "1 1 auto";

                        endGroup();

                        const btnShip = OrdersPage.createButton("Mark as Shipped", "", function() {
                            const tracking = trackingInput.getInputValue().trim().toUpperCase();
                            updateOrder({ status: "shipped", carrier: carrierId, tracking: tracking }, "Shipped with " + carrierId + " (" + tracking + ")", "shipped");
                        }, { primary: 1 });
                        setInteractive(btnShip, false);

                    endGroup();

                }

                if (order.status == "shipped") {
                    startSection("Next step");
                        Label({ text: "Shipped with " + escape(order.carrier) + ". Tracking number: <b>" + escape(order.tracking) + "</b>", fontSize: 14, textColor: White(0.8), width: "100%" });
                        OrdersPage.createButton("Mark as Delivered", "", function() {
                            updateOrder({ status: "delivered" }, "Delivered to the customer", "delivered");
                        }, { primary: 1 });
                    endGroup();
                }

            };

            initNextStep();

            // ITEMS AND TOTALS
            startSection("Items");

                const table = TinyTable({
                    columnHeaders: ["PRODUCT", "QTY", "PRICE", "TOTAL"],
                    columnWidths: ["46%", "12%", "20%", "20%"], // 98%: 1px gaps between cells
                    dataRows: order.items.map(function(item) {
                        return [escape(item.name) + "<br><span style='font-size:12px; color:" + White(0.4) + "'>" + escape(item.sku) + "</span>", String(item.qty), OrdersPage.formatMoney(item.price), OrdersPage.formatMoney(item.qty * item.price)];
                    }),
                    headerBackgroundColor: S.FIELD_COLOR,
                    headerTextColor: White(0.6),
                    headerBorderColor: S.FIELD_COLOR,
                    headerFontSize: 12,
                    borderWidth: 1,
                    borderRadius: 8,
                    borderColor: S.CARD_BORDER_COLOR,
                    bodyBackgroundColor: S.CARD_COLOR,
                    cellFontSize: 14,
                    cellTextColor: White(0.85),
                    rowHoverBackgroundColor: White(0.05),
                    rowHoverBorderColor: White(0.1),
                    onCellRender: function(cell) {
                        if (cell.index == 0) cell.elem.style.whiteSpace = "normal";
                        if (cell.index > 0) cell.textAlign = "right";
                    },
                });
                table.width = "100%";
                // WHY: TinyTable has no setting for the header cells. Number columns are right aligned like their cells.
                [...table.titleBox.elem.children].forEach(function(cell, index) {
                    if (index > 0) cell.style.textAlign = "right";
                });

                VGroup({ width: "100%", height: "auto", align: "left top", gap: 4 });
                that.elem.style.marginTop = "6px";
                    createInfoLine("Subtotal", OrdersPage.formatMoney(order.subtotal));
                    createInfoLine("Shipping", (order.shipping) ? OrdersPage.formatMoney(order.shipping) : "Free");
                    if (order.discount) createInfoLine("Discount", "−" + OrdersPage.formatMoney(order.discount), { textColor: S.ACCENT_COLOR });
                    createInfoLine("<b>Total</b>", "<b>" + OrdersPage.formatMoney(order.total) + "</b>", { fontSize: 16 });
                endGroup();

            endGroup();

            // CUSTOMER
            startSection("Customer");

                Label({ text: escape(order.customer.name), fontSize: 16, textColor: White(0.95) });
                Label({ text: escape(order.customer.email) + " · " + escape(order.customer.phone), fontSize: 13, textColor: White(0.55), width: "100%" });

                Label({ text: "SHIPPING ADDRESS", fontSize: 11, textColor: White(0.45) });
                that.elem.style.letterSpacing = "1px";
                that.elem.style.marginTop = "6px";
                Label({ text: escape(order.address), fontSize: 14, textColor: White(0.85), width: "100%" });

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                that.elem.style.marginTop = "4px";
                    OrdersPage.createButton("E-mail Customer", "", function() {
                        window.location.href = "mailto:" + encodeURIComponent(order.customer.email) + "?subject=" + encodeURIComponent("Your order " + order.id);
                    });
                    OrdersPage.createButton("Print Invoice", "", function() {
                        OrdersPage.printInvoice(order);
                    });
                endGroup();

            endGroup();

            // TIMELINE
            startSection("Timeline");

                // Newest first
                order.history.slice().reverse().forEach(function(entry, index, list) {

                    const color = (OrdersPage.STATUSES[entry.type]) ? OrdersPage.STATUSES[entry.type].color : White(0.5);

                    HGroup({ width: "100%", height: "auto", align: "left top", gap: 12 });

                        // Dot and line
                        VGroup({ width: 12, height: "auto", align: "center top", gap: 0 });
                        that.elem.style.alignSelf = "stretch";
                            Box({ width: 10, height: 10, round: 100, color: color });
                            that.elem.style.marginTop = "5px";
                            if (index < list.length - 1) {
                                Box({ width: 2, height: "auto", color: White(0.1) });
                                that.elem.style.flex = "1 1 auto";
                                that.elem.style.minHeight = "20px";
                            }
                        endGroup();

                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                        that.elem.style.flex = "1 1 auto";
                        that.elem.style.minWidth = "0";
                        that.elem.style.paddingBottom = "12px";
                            Label({ text: escape(entry.text), fontSize: 14, textColor: (entry.type == "note") ? "#E8D9A8" : White(0.9), width: "100%" });
                            Label({ text: new Date(entry.time).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + " · " + escape(entry.by), fontSize: 12, textColor: White(0.45) });
                        endGroup();

                    endGroup();

                });

                // Internal note
                HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 8 });

                    const noteInput = createDarkInput({
                        titleText: "INTERNAL NOTE",
                        placeholder: "Only the team can see it",
                        maxChar: 200,
                    });
                    noteInput.elem.style.flex = "1 1 auto";

                    OrdersPage.createButton("Add", "", function() {
                        const text = noteInput.getInputValue().trim();
                        if (!text) return;
                        updateOrder({}, "Note: " + text, "note");
                    });

                endGroup();

            endGroup();

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        const canCancel = ["pending", "processing"].includes(order.status);
        const canRefund = ["shipped", "delivered"].includes(order.status);

        if (canCancel) {
            OrdersPage.createButton("Cancel Order", "", function() {
                Dialog({
                    icon: "assets/warning.png",
                    title: "Cancel Order",
                    desc: "<b>" + order.id + "</b> will be cancelled and the payment of <b>" + OrdersPage.formatMoney(order.total) + "</b> will be returned to the customer.",
                    confirmButtonText: "Cancel Order",
                    confirmButtonColor: S.ERROR_COLOR,
                    cancelButtonText: "Keep",
                    callback: function(isConfirmed) {
                        if (isConfirmed && box) updateOrder({ status: "cancelled" }, "Order is cancelled, payment is returned", "cancelled");
                    },
                });
            });
        }

        if (canRefund) {
            // WHY: Hold to confirm, so money is not refunded by mistake.
            const btnRefund = HoldToConfirmButton({
                height: 40,
                labelText: "Hold to Refund " + OrdersPage.formatMoney(order.total),
                completedText: "REFUNDED",
                iconFile: "../../comp-m3/hold-to-confirm-button/trash.png",
                holdingIconFile: "../../comp-m3/hold-to-confirm-button/trash-red.png",
                holdDuration: 1500,
                resetDelay: 600,
                style: {
                    layout: { gap: 6, padding: [14, 0] },
                    icon: { width: 0, height: 0 },
                    label: { fontSize: 14, textColor: White(0.9) },
                    holdingLabel: { fontSize: 14, textColor: "#B03A2E" },
                    completedLabel: { fontSize: 14, textColor: "#2C5A38" },
                    box: { color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
                    holdingBox: { color: "#FFD1CB", borderColor: S.ERROR_COLOR, round: 8 },
                    completedBox: { color: "#DFEFE6", borderColor: S.ACCENT_COLOR, round: 8 },
                },
                onConfirm: function() {
                    updateOrder({ status: "refunded" }, "Refunded " + OrdersPage.formatMoney(order.total), "refunded");
                },
            });
            // WHY: No icon. (Icon size 0 still keeps the gap.)
            btnRefund.icon.visible = 0;
            btnRefund.iconRed.visible = 0;
        }

        if (!canCancel && !canRefund) {
            Label({ text: "No more actions for a " + status.label.toLowerCase() + " order.", fontSize: 13, textColor: White(0.45) });
        }

    endGroup();

    // *** INIT CODE:

    rightView.clean();
    rightView.setKey(OrderDetails.KEY);
    rightView.setWidth(520);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

OrderDetails.KEY = "OrderDetails";

// *** STATIC: STYLE AND HELPERS

OrdersPage.STYLE = {
    CARD_COLOR: "#1A1A19",
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
    ERROR_COLOR: "#E66767",
};

OrdersPage.STATUSES = {
    pending: { label: "Pending", color: "#C98500" },
    processing: { label: "Processing", color: "#3987E5" },
    shipped: { label: "Shipped", color: "#9085E9" },
    delivered: { label: "Delivered", color: "#65A293" },
    cancelled: { label: "Cancelled", color: "#A9A79F" },
    refunded: { label: "Refunded", color: "#E66767" },
};

OrdersPage.PAYMENTS = ["Credit card", "PayPal", "Bank transfer", "Cash on delivery"];
OrdersPage.CARRIERS = ["Yurtici Kargo", "Aras Kargo", "MNG Kargo", "UPS", "DHL"];

OrdersPage.getStatusByLabel = function(label) {
    const id = Object.keys(OrdersPage.STATUSES).find(function(key) { return OrdersPage.STATUSES[key].label == label; });
    return (id) ? OrdersPage.STATUSES[id] : null;
};

OrdersPage.formatMoney = function(value) {
    return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Local time: "2026-09-16 14:05" (sortable text)
OrdersPage.formatDateTime = function(time) {
    const d = new Date(time);
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
};

OrdersPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// "#65A293", 0.2 -> "rgba(101, 162, 147, 0.2)"
OrdersPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

// params: { primary: 1, width }
OrdersPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = OrdersPage.STYLE;
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
OrdersPage.createTinySelect = function(list, onSelect, selectedIndex = 0) {
    const S = OrdersPage.STYLE;
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

OrdersPage.getSmartTableStyle = function(libPath) {
    const S = OrdersPage.STYLE;
    return {
        scrollBarParams: {
            bar_border: 0, bar_round: 3, bar_borderColor: "rgba(255, 255, 255, 0.15)", bar_width: 4, bar_mouseOverWidth: 4,
            bar_mouseOverColor: "#A0A0A0", bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2, bar_color: "#A0A0A0",
            neverHide: 0, showDots: 0,
        },
        searchInputParams: {
            width: "50%", height: 36, border: 0, round: 8, color: S.FIELD_COLOR, textColor: "#EBEBEB", searchIconSize: 16,
            placeholderText: "Filter the table", fontSize: 14, invertIconColor: 1,
            searchIconFile: libPath + "comp-m2/search-input-v2/filter.png",
            clearIconFile: libPath + "comp-m2/search-input-v2/clear.svg",
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
            loadingIconFile: libPath + "comp-m3/smart-table/clock.png",
            invertIconColor: 1,
            box: { color: S.CARD_COLOR },
            boxBorder: { border: 1, borderColor: S.CARD_BORDER_COLOR },
            boxTitleLine: { color: S.FIELD_COLOR },
            boxTitleCell: { padding: [10, 0], borderRight: "1px solid rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.12)" },
            lblTitleCell: { fontSize: 13, fontFamily: "opensans", textColor: White(0.6) },
            boxItemCell: { borderBottom: "1px solid rgba(255, 255, 255, 0.05)", borderRight: "1px solid rgba(255, 255, 255, 0.03)", padding: [10, 0] },
            lblItemCell: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.75)", fontFamily: "opensans" },
            boxInfoLine: { color: S.FIELD_COLOR, borderTop: "1px solid rgba(255, 255, 255, 0.08)" },
            lblBoxInfoLine: { fontSize: 14, textColor: White(0.7) },
            lblNoDataFound: { color: "#2C2C2A", textColor: White(0.6), padding: [8, 2], fontSize: 13, round: 8, border: 1, borderColor: White(0.15) },
            btnScrollCenter: { color: "#2C2C2A", round: 100, borderColor: White(0.2), border: 1 },
            btnScrollUp: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
            btnScrollDown: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
            boxSort: { color: S.PRIMARY_COLOR },
        },
    };
};

// Opens a simple invoice in a new window and prints it.
OrdersPage.printInvoice = function(order) {

    const escape = OrdersPage.escapeHtml;
    const money = OrdersPage.formatMoney;

    const rows = order.items.map(function(item) {
        return "<tr><td>" + escape(item.name) + "<br><small>" + escape(item.sku) + "</small></td><td class='r'>" + item.qty + "</td><td class='r'>" + money(item.price) + "</td><td class='r'>" + money(item.qty * item.price) + "</td></tr>";
    }).join("");

    const html = "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Invoice " + escape(order.id) + "</title>" +
        "<style>body{font-family:system-ui,sans-serif;color:#222;margin:40px}table{width:100%;border-collapse:collapse;margin-top:24px}" +
        "th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}.r{text-align:right}small{color:#888}h1{margin:0}</style></head><body>" +
        "<h1>Invoice</h1><p>" + escape(order.id) + " · " + new Date(order.time).toLocaleDateString("en-GB", { dateStyle: "long" }) + "</p>" +
        "<p><b>" + escape(order.customer.name) + "</b><br>" + escape(order.address) + "<br>" + escape(order.customer.email) + "</p>" +
        "<table><tr><th>Product</th><th class='r'>Qty</th><th class='r'>Price</th><th class='r'>Total</th></tr>" + rows +
        "<tr><td colspan='3' class='r'>Subtotal</td><td class='r'>" + money(order.subtotal) + "</td></tr>" +
        "<tr><td colspan='3' class='r'>Shipping</td><td class='r'>" + money(order.shipping) + "</td></tr>" +
        ((order.discount) ? "<tr><td colspan='3' class='r'>Discount</td><td class='r'>−" + money(order.discount) + "</td></tr>" : "") +
        "<tr><th colspan='3' class='r'>Total</th><th class='r'>" + money(order.total) + "</th></tr></table>" +
        "<p><small>Payment: " + escape(order.payment) + "</small></p></body></html>";

    const win = window.open("", "_blank");
    if (!win) return; // Pop-up blocked
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();

};

// *** STATIC: TEST DATA

OrdersPage._orders = null;

// Orders of the last 60 days, newest first. Created one time and kept while the panel is open.
// TODO: Load the orders from your service (with paging and filters).
OrdersPage.getOrders = function() {

    if (OrdersPage._orders) return OrdersPage._orders;

    // Random numbers with a seed: the same test data every time. (mulberry32)
    let seed = 104582;
    const rnd = function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = function(list) { return list[Math.floor(rnd() * list.length)]; };

    const CUSTOMERS = [
        ["Selin Koc", "selin.koc@mail.com", "Moda Cad. 24, Kadikoy, Istanbul"],
        ["Emre Gunes", "emre.gunes@mail.com", "Ataturk Bulvari 118, Cankaya, Ankara"],
        ["Yasemin Dogan", "yasemin.d@mail.com", "Kordon Boyu 7, Alsancak, Izmir"],
        ["Tarik Yilmaz", "tarik.yilmaz@mail.com", "Bagdat Cad. 310, Maltepe, Istanbul"],
        ["Hakan Bulut", "hakan.bulut@mail.com", "Nilufer Sok. 3, Nilufer, Bursa"],
        ["Deniz Arslan", "deniz.arslan@mail.com", "Liman Cad. 12, Muratpasa, Antalya"],
        ["Anna Schmidt", "anna.schmidt@mail.de", "Hauptstrasse 5, 10115 Berlin"],
        ["Mert Aksoy", "mert.aksoy@mail.com", "Istiklal Cad. 88, Beyoglu, Istanbul"],
        ["Ece Yurt", "ece.yurt@mail.com", "Cumhuriyet Mah. 41, Eskisehir"],
        ["Can Ozturk", "can.ozturk@mail.com", "Sahil Yolu 19, Mezitli, Mersin"],
    ];

    const PRODUCTS = [
        ["HP-BLK-01", "Wireless Headphones (Black)", 129],
        ["SW-FIT-02", "Smart Watch Fit 2", 189],
        ["SH-RUN-42", "Running Shoes (42)", 95],
        ["MG-CER-01", "Ceramic Coffee Mug", 14.9],
        ["BP-GRY-20", "Backpack 20L (Grey)", 59],
        ["LM-DSK-01", "Desk Lamp (Warm)", 42.5],
        ["BK-JS-101", "Book: Modern JavaScript", 29],
        ["CB-USB-C2", "USB-C Cable (2 m)", 9.9],
    ];

    const now = Date.now();
    const list = [];

    for (let i = 0; i < 600; i++) {

        // More orders in the recent days
        const time = now - Math.pow(rnd(), 1.3) * 60 * 86400000;
        const age = (now - time) / 86400000; // days
        const customer = pick(CUSTOMERS);

        const items = [];
        const itemCount = 1 + Math.floor(Math.pow(rnd(), 2) * 3);
        for (let j = 0; j < itemCount; j++) {
            const product = pick(PRODUCTS);
            if (items.some(function(item) { return item.sku == product[0]; })) continue;
            items.push({ sku: product[0], name: product[1], price: product[2], qty: 1 + Math.floor(Math.pow(rnd(), 3) * 3) });
        }

        const subtotal = Math.round(items.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0) * 100) / 100;
        const shipping = (subtotal >= 100) ? 0 : 9.9;
        const discount = (rnd() < 0.15) ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
        const total = Math.round((subtotal + shipping - discount) * 100) / 100;

        // Status by age
        const r = rnd();
        let status;
        if (age < 0.5) status = (r < 0.6) ? "pending" : "processing";
        else if (age < 2) status = (r < 0.15) ? "pending" : (r < 0.7) ? "processing" : "shipped";
        else if (age < 6) status = (r < 0.1) ? "processing" : (r < 0.6) ? "shipped" : "delivered";
        else status = "delivered";
        if (rnd() < 0.04) status = "cancelled";
        else if (age > 3 && rnd() < 0.035) status = "refunded";

        const carrier = pick(OrdersPage.CARRIERS);
        const tracking = carrier.slice(0, 2).toUpperCase() + String(Math.floor(rnd() * 1e10)).padStart(10, "0");

        // History
        const history = [{ time: time, text: "Order is placed (" + OrdersPage.formatMoney(total) + ")", type: "pending", by: "Customer" }];
        const step = function(hours, text, type) {
            history.push({ time: Math.min(now, time + hours * 3600000), text: text, type: type, by: pick(["Deniz Arslan", "Ceren Aktas", "System"]) });
        };
        if (["processing", "shipped", "delivered", "refunded"].includes(status)) step(3 + rnd() * 5, "Order is being prepared", "processing");
        if (["shipped", "delivered", "refunded"].includes(status)) step(20 + rnd() * 20, "Shipped with " + carrier + " (" + tracking + ")", "shipped");
        if (["delivered", "refunded"].includes(status)) step(60 + rnd() * 50, "Delivered to the customer", "delivered");
        if (status == "cancelled") step(2 + rnd() * 10, "Order is cancelled, payment is returned", "cancelled");
        if (status == "refunded") step(140 + rnd() * 30, "Refunded " + OrdersPage.formatMoney(total), "refunded");

        list.push({
            id: "ORD-" + String(100000 + i * 7 + Math.floor(rnd() * 7)),
            time: time,
            customer: { name: customer[0], email: customer[1], phone: "+90 5" + String(Math.floor(rnd() * 1e9)).padStart(9, "0") },
            address: customer[2],
            items: items,
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            total: total,
            payment: pick(OrdersPage.PAYMENTS),
            status: status,
            carrier: (["shipped", "delivered", "refunded"].includes(status)) ? carrier : "",
            tracking: (["shipped", "delivered", "refunded"].includes(status)) ? tracking : "",
            history: history,
        });

    }

    list.sort(function(a, b) { return b.time - a.time; });
    OrdersPage._orders = list;
    return list;

};
