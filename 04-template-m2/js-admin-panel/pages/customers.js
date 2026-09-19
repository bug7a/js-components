/* Bismillah */

/*

Customers Page (Template) - v26.09

- The customers of the store (CRM): summary cards, segment tabs with counts, search, sort and a customer table.
- Customer panel (right view): lifetime stats, contact details (edit), tags, marketing consent, notes with a
  timeline, order history (opens the order on the Orders page), e-mail, block / unblock, delete (hold to confirm).
- Segments (automatic): Lead (registered, no order yet), At risk (last order more than 45 days ago), New (first
  order in the last 30 days), VIP (top 30% of the spending), Regular (the rest).
- Data: The customers with orders come from the Orders page (OrdersPage.getOrders()), so the totals match the
  orders. Some registered customers without orders are added as test data. CRM fields (tags, notes, consent,
  blocked) are kept while the panel is open. Replace CustomersPage.getCustomers() and the "CUSTOMER SERVICE"
  functions with your service.

COMPONENTS:
- TextTabs, SearchInput, TinySelect (comp-m2): Filters
- SmartTable (comp-m3): Customer list
- InputB (comp-m2): Contact details, tag and note inputs
- Toggle (comp-m2): Marketing consent
- TinyTable (comp-m2): Order history
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- Dialog, Waiting (comp-m2): Confirm, saving

*/

CustomersPageDefaults = {
    color: "transparent",
    openCustomerId: null, // Opens the panel of this customer. (Ex: from the search on the top bar)
};

const CustomersPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, CustomersPageDefaults, mainView);

    mainView.setKey(CustomersPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = CustomersPage.STYLE;
    const SEGMENTS = CustomersPage.SEGMENTS;

    const TABS = ["", "vip", "regular", "new", "risk", "lead"]; // "": All

    const SORTS = [
        { id: "spent", label: "Highest spending" },
        { id: "recent", label: "Most recent order" },
        { id: "orders", label: "Most orders" },
        { id: "name", label: "Name A-Z" },
    ];

    const filter = {
        segment: "",
        search: "",
        consent: "",
        sortId: "spent",
    };

    let searchTimer = null;

    // Components
    let segmentTabs;
    let statCards = [];
    let lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    // All filters except the segment (used for the tab counts too)
    const matchesFilters = function(customer) {
        if (filter.consent == "yes" && !customer.consent) return false;
        if (filter.consent == "no" && customer.consent) return false;
        if (filter.consent == "blocked" && !customer.blocked) return false;
        const search = filter.search.trim().toLowerCase();
        if (search) {
            const text = (customer.name + " " + customer.email + " " + customer.city + " " + customer.tags.join(" ")).toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    };

    const sortList = function(list) {
        const sorted = list.slice();
        if (filter.sortId == "spent") sorted.sort(function(a, b) { return b.totalSpent - a.totalSpent; });
        if (filter.sortId == "recent") sorted.sort(function(a, b) { return b.lastOrderAt - a.lastOrderAt; });
        if (filter.sortId == "orders") sorted.sort(function(a, b) { return b.orderCount - a.orderCount; });
        if (filter.sortId == "name") sorted.sort(function(a, b) { return a.name.localeCompare(b.name); });
        return sorted;
    };

    const render = function() {

        const all = CustomersPage.getCustomers();
        all.forEach(function(c) { c.segment = CustomersPage.getSegment(c); });
        const list = all.filter(matchesFilters);

        TABS.forEach(function(segment, index) {
            const count = (segment) ? list.filter(function(c) { return c.segment == segment; }).length : list.length;
            const label = (segment) ? SEGMENTS[segment].label : "All";
            segmentTabs.tabItemList[index].text = label + " <span style='opacity:0.55'>" + count + "</span>";
        });

        const shown = sortList((filter.segment) ? list.filter(function(c) { return c.segment == filter.segment; }) : list);

        // WHY: SmartTable sorts by the column, so the toolbar sort is applied by the "order" number.
        smartTable.setItemDataList(shown.map(function(c, index) {
            return {
                order: index + 1,
                id: c.id,
                name: c.name + ((c.blocked) ? " (blocked)" : ""),
                email: c.email,
                city: c.city,
                orders: c.orderCount,
                spent: c.totalSpent,
                lastOrder: (c.lastOrderAt) ? OrdersPage.formatDateTime(c.lastOrderAt).slice(0, 10) : "—",
                segment: SEGMENTS[c.segment].label,
            };
        }));

        lblResultCount.text = shown.length + " of " + all.length + " customers";

        renderSummary(all);

    };

    const renderSummary = function(all) {

        const withOrders = all.filter(function(c) { return c.orderCount > 0; });
        const revenue = withOrders.reduce(function(sum, c) { return sum + c.totalSpent; }, 0);
        const count = function(segment) { return all.filter(function(c) { return c.segment == segment; }).length; };
        const monthAgo = Date.now() - 30 * CustomersPage.DAY;

        const values = [
            { value: all.length, desc: all.filter(function(c) { return c.registeredAt > monthAgo; }).length + " registered this month" },
            { value: count("vip"), desc: count("new") + " new · " + count("lead") + " leads" },
            { value: count("risk"), desc: "No order in the last 45 days" },
            { value: (withOrders.length) ? OrdersPage.formatMoney(revenue / withOrders.length) : "—", desc: "Average lifetime value" },
        ];

        statCards.forEach(function(card, index) {
            card.lblValue.text = String(values[index].value);
            card.lblDesc.text = values[index].desc;
        });

    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList;
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["id,name,email,city,orders,spent,last_order,segment"].concat(rows.map(function(row) {
            return [row.id, row.name, row.email, row.city, row.orders, row.spent, row.lastOrder, row.segment].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "customers-" + OrdersPage.formatDateTime(Date.now()).slice(0, 10) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const openDetails = function(customerId) {
        CustomerDetails({
            customerId: customerId,
            onChange: function() {
                if (box) render();
            },
        });
    };

    const closeDetails = function() {
        if (rightView.isShown(CustomerDetails.KEY)) {
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

                Label({ text: "Customers", fontSize: 26, textColor: White(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Who buys from your store, what they spend and how to reach them", fontSize: 14, textColor: White(0.5) });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "left center", gap: 8 });
                CustomersPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV);
                CustomersPage.createButton("E-mail Segment", ASSETS + "top-bar/comment.png", function() {
                    const emails = smartTable.visibleItemDataList.map(function(row) { return row.email; });
                    if (!emails.length) return;
                    // WHY: BCC, so the customers do not see each other. Long lists must go through your e-mail service.
                    window.location.href = "mailto:?bcc=" + encodeURIComponent(emails.slice(0, 50).join(","));
                });
            endGroup();

        endGroup();

    };

    const initSummary = function() {

        const CARD_LIST = [
            { title: "Customers", color: White(0.95) },
            { title: "VIP customers", color: CustomersPage.SEGMENTS.vip.color },
            { title: "At risk", color: CustomersPage.SEGMENTS.risk.color },
            { title: "Lifetime value", color: S.ACCENT_COLOR },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            CARD_LIST.forEach(function(item) {

                const card = VGroup({ width: "auto", height: "auto", align: "left top", gap: 2, padding: 14, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });
                setFlex(card, "1 1 200px");

                    Label({ text: item.title, fontSize: 13, textColor: White(0.5) });
                    card.lblValue = Label({ text: "", fontSize: 26, textColor: item.color });
                    card.lblDesc = Label({ text: "", fontSize: 12, textColor: White(0.45) });

                endGroup();

                statCards.push(card);

            });

        endGroup();

    };

    const initToolbar = function() {

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: 16, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });

            HGroup({ width: "100%", height: "auto", align: "left top" });
            that.elem.style.overflowX = "auto";

                segmentTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: TABS.map(function(segment) { return (segment) ? SEGMENTS[segment].label : "All"; }),
                    onClick: function(self) {
                        filter.segment = TABS[self.index];
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

                SearchInput({
                    width: 260,
                    height: 40,
                    border: 1,
                    borderColor: S.CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
                    round: 8,
                    color: S.FIELD_COLOR,
                    textColor: White(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Name, e-mail, city or tag",
                    invertIconColor: 1,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, render, 200);
                    },
                });
                that.position = "relative";

                CustomersPage.createTinySelect(SORTS, function(id) { filter.sortId = id; render(); });

                CustomersPage.createTinySelect(
                    [{ id: "", label: "Everyone" }, { id: "yes", label: "Marketing: opted in" }, { id: "no", label: "Marketing: opted out" }, { id: "blocked", label: "Blocked" }],
                    function(id) { filter.consent = id; render(); }
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
                    { name: "#", dataTitle: "order", dataType: "integer", width: 60, shortable: 1 },
                    { name: "CUSTOMER", dataTitle: "name", dataType: "string", width: 200, shortable: 1 },
                    { name: "E-MAIL", dataTitle: "email", dataType: "string", width: 230, shortable: 1 },
                    { name: "CITY", dataTitle: "city", dataType: "string", width: 120, shortable: 1 },
                    { name: "ORDERS", dataTitle: "orders", dataType: "integer", width: 90, shortable: 1 },
                    { name: "SPENT", dataTitle: "spent", dataType: "float", width: 120, shortable: 1 },
                    { name: "LAST ORDER", dataTitle: "lastOrder", dataType: "string", width: 120, shortable: 1 },
                    { name: "SEGMENT", dataTitle: "segment", dataType: "string", width: 110, shortable: 1 },
                ],
                itemDataList: [],
                titleHeight: 44,
                itemHeight: 40,
                infoHeight: 56,
                itemLineCount: 13,
                sortByTitleIndex: 0,
                sortDirection: "A-Z",
                onSelect: function(itemData) {
                    openDetails(itemData.id);
                },
                // WHY: SmartTable writes the raw value (money sorts as a number). Texts and colors are written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 5 && data !== "") cell.label.text = OrdersPage.formatMoney(data);
                    if (titleDataIndex == 7) {
                        const segment = CustomersPage.getSegmentByLabel(data);
                        cell.label.textColor = (segment) ? segment.color : White(0.75);
                    }
                },
                ...CustomersPage.getSmartTableStyle(LIB_PATH),
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

    if (box.openCustomerId !== null) openDetails(box.openCustomerId);

    return box;

};

CustomersPage.KEY = "Customers";

// *** DETAILS PANEL (RIGHT VIEW):

const CustomerDetailsDefaults = {
    customerId: null,
    notice: "", // A message on the top. (Ex: "Note added")
    onChange: function() {},
};

const CustomerDetails = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, CustomerDetailsDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "#141414";

    // BOX: Component container
    let box = startObject(params);

    const S = CustomersPage.STYLE;
    const escape = OrdersPage.escapeHtml;

    const customer = CustomersPage.getCustomers().find(function(c) { return c.id == box.customerId; });
    if (!customer) { box.remove(); return box; }
    customer.segment = CustomersPage.getSegment(customer);
    const segment = CustomersPage.SEGMENTS[customer.segment];

    let saveTimer = null;

    // *** CUSTOMER SERVICE (TEST):

    // Changes the customer like a server request, then opens the panel again with the new data.
    const saveChange = function(change, notice, closeAfter) {

        if (typeof waiting !== "undefined") waiting.show();

        saveTimer = setTimeout(function() {

            // TODO: Send the change to your service.
            const error = change(customer);

            if (typeof waiting !== "undefined") waiting.hide();

            if (error) { showNotice(error, true); return; }

            box.onChange();

            if (closeAfter) {
                rightView.hide();
                rightView.clean();
            } else {
                CustomerDetails({ customerId: customer.id, notice: notice, onChange: box.onChange }); // Render again
            }

        }, 300);

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

    // WHY: Some components have no enabled setting. "inert" blocks the mouse and keyboard for all the children.
    const setInteractive = function(obj, enabled) {
        obj.elem.inert = !enabled;
        obj.opacity = (enabled) ? 1 : 0.4;
    };

    let grpNotice, lblNotice;
    const showNotice = function(text, isError = false) {
        const color = (isError) ? S.ERROR_COLOR : S.ACCENT_COLOR;
        lblNotice.text = escape(text);
        lblNotice.textColor = color;
        grpNotice.color = OrdersPage.alpha(color, 0.12);
        grpNotice.borderColor = OrdersPage.alpha(color, 0.35);
        grpNotice.visible = (text) ? 1 : 0;
    };

    box.destroy = function() {
        clearTimeout(saveTimer);
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
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });

                HGroup({ width: 48, height: 48, align: "center center", round: 100, color: CustomersPage.getAvatarColor(customer.id) });
                that.elem.style.flexShrink = "0";
                    Label({ text: CustomersPage.getInitials(customer.name), fontSize: 17, textColor: White(0.95) });
                endGroup();

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 2 });
                that.elem.style.flex = "1 1 auto";
                that.elem.style.minWidth = "0";
                    HGroup({ width: "auto", height: "auto", align: "left center", gap: 10 });
                        Label({ text: escape(customer.name), fontSize: 20, textColor: White(0.95) });
                        that.elem.style.fontFamily = "opensans-bold";
                        Label({ text: segment.label.toUpperCase(), fontSize: 11, textColor: segment.color, color: OrdersPage.alpha(segment.color, 0.15), round: 6, padding: [8, 3] });
                        that.elem.style.letterSpacing = "1px";
                        if (customer.blocked) {
                            Label({ text: "BLOCKED", fontSize: 11, textColor: S.ERROR_COLOR, color: OrdersPage.alpha(S.ERROR_COLOR, 0.15), round: 6, padding: [8, 3] });
                            that.elem.style.letterSpacing = "1px";
                        }
                    endGroup();
                    Label({ text: "Customer since " + new Date(customer.registeredAt).toLocaleDateString("en-GB", { dateStyle: "medium" }) + " · " + escape(customer.city), fontSize: 13, textColor: White(0.5) });
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

            // NOTICE
            grpNotice = HGroup({ width: "100%", height: "auto", align: "left center", padding: [12, 10], round: 8, border: 1 });
                lblNotice = Label({ text: "", fontSize: 14, width: "100%" });
            endGroup();
            showNotice(box.notice);

            // STATS
            HGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });
            that.elem.style.flexWrap = "wrap";
                [
                    ["Spent", OrdersPage.formatMoney(customer.totalSpent)],
                    ["Orders", String(customer.orderCount)],
                    ["Avg. order", (customer.orderCount) ? OrdersPage.formatMoney(customer.totalSpent / customer.orderCount) : "—"],
                    ["Last order", (customer.lastOrderAt) ? CustomersPage.formatRelative(customer.lastOrderAt) : "Never"],
                ].forEach(function(item) {
                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 2, padding: [12, 10], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });
                    that.elem.style.flex = "1 1 100px";
                    that.elem.style.minWidth = "0";
                        Label({ text: item[0], fontSize: 12, textColor: White(0.5) });
                        Label({ text: item[1], fontSize: 17, textColor: White(0.95) });
                        that.elem.style.whiteSpace = "nowrap";
                    endGroup();
                });
            endGroup();

            // CONTACT
            startSection("Contact");

                let updateContactButton = function() {};

                const inputName = createDarkInput({ titleText: "NAME", inputValue: customer.name, maxChar: 60, onEdit: function() { updateContactButton(); } });
                const inputEmail = createDarkInput({ titleText: "E-MAIL", inputValue: customer.email, maxChar: 120, warningText: "E-mail is not valid", onEdit: function() { updateContactButton(); } });

                HGroup({ width: "100%", height: "auto", align: "left top", gap: 10 });
                    const inputPhone = createDarkInput({ titleText: "PHONE", inputValue: customer.phone, maxChar: 30, onEdit: function() { updateContactButton(); } });
                    inputPhone.elem.style.flex = "1 1 0";
                    const inputCity = createDarkInput({ titleText: "CITY", inputValue: customer.city, maxChar: 40, onEdit: function() { updateContactButton(); } });
                    inputCity.elem.style.flex = "1 1 0";
                endGroup();

                const inputAddress = createDarkInput({ titleText: "ADDRESS", inputValue: customer.address, maxChar: 160, onEdit: function() { updateContactButton(); } });

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                that.elem.style.flexWrap = "wrap";

                    const btnSave = CustomersPage.createButton("Save Changes", "", function() {
                        const name = inputName.getInputValue().trim(), email = inputEmail.getInputValue().trim();
                        if (name.length < 2) { showNotice("Name must be at least 2 letters.", true); return; }
                        if (!CustomersPage.isEmail(email)) { showNotice("E-mail is not valid.", true); return; }
                        const used = CustomersPage.getCustomers().some(function(c) { return c.id != customer.id && c.email.toLowerCase() == email.toLowerCase(); });
                        if (used) { showNotice("This e-mail belongs to another customer.", true); return; }
                        saveChange(function(c) {
                            c.name = name; c.email = email; c.phone = inputPhone.getInputValue().trim();
                            c.city = inputCity.getInputValue().trim(); c.address = inputAddress.getInputValue().trim();
                            return "";
                        }, "Contact details are saved.");
                    }, { primary: 1 });

                    CustomersPage.createButton("E-mail Customer", "", function() {
                        window.location.href = "mailto:" + encodeURIComponent(customer.email);
                    });

                endGroup();

                updateContactButton = function() {
                    const changed = inputName.getInputValue().trim() != customer.name || inputEmail.getInputValue().trim() != customer.email ||
                        inputPhone.getInputValue().trim() != customer.phone || inputCity.getInputValue().trim() != customer.city || inputAddress.getInputValue().trim() != customer.address;
                    inputEmail.showWarningIfNotValid(CustomersPage.isEmail(inputEmail.getInputValue().trim()));
                    setInteractive(btnSave, changed);
                };
                updateContactButton();

            endGroup();

            // TAGS & MARKETING
            startSection("Tags & marketing");

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 6 });
                that.elem.style.flexWrap = "wrap";

                    customer.tags.forEach(function(tag) {
                        HGroup({ width: "auto", height: 28, align: "left center", gap: 6, padding: [10, 0], round: 100, color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR });
                            Label({ text: escape(tag), fontSize: 13, textColor: White(0.85) });
                            const btnRemove = Label({ text: "✕", fontSize: 12, textColor: White(0.45), clickable: 1 });
                            btnRemove.elem.style.cursor = "pointer";
                            btnRemove.elem.title = "Remove the tag";
                            btnRemove.on("click", function() {
                                saveChange(function(c) { c.tags = c.tags.filter(function(t) { return t != tag; }); return ""; }, "Tag removed.");
                            });
                        endGroup();
                    });

                    if (!customer.tags.length) Label({ text: "No tags yet.", fontSize: 13, textColor: White(0.45) });

                endGroup();

                HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 8 });
                    const inputTag = createDarkInput({ titleText: "ADD A TAG", placeholder: "wholesale, newsletter, complaint...", maxChar: 24 });
                    inputTag.elem.style.flex = "1 1 0";
                    inputTag.elem.style.minWidth = "0";
                    CustomersPage.createButton("Add", "", function() {
                        const tag = inputTag.getInputValue().trim().toLowerCase();
                        if (!tag) return;
                        if (customer.tags.includes(tag)) { showNotice("This tag is already on the customer.", true); return; }
                        saveChange(function(c) { c.tags.push(tag); return ""; }, "Tag \"" + tag + "\" added.");
                    });
                    that.elem.style.flexShrink = "0"; // WHY: The input takes the rest, the button keeps its width.
                endGroup();

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });
                that.elem.style.justifyContent = "space-between";
                that.elem.style.marginTop = "6px";
                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                        Label({ text: "Marketing e-mails", fontSize: 14, textColor: White(0.9) });
                        Label({ text: (customer.consent) ? "Opted in on " + new Date(customer.consentAt).toLocaleDateString("en-GB", { dateStyle: "medium" }) : "Not opted in. Do not send campaigns.", fontSize: 12, textColor: White(0.45) });
                    endGroup();
                    Toggle({
                        width: 52, height: 30, spacing: 3, value: (customer.consent) ? 1 : 0,
                        backgroundStyle: { color: "#2C2C2A", selectedColor: S.PRIMARY_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR },
                        buttonStyle: { color: White(0.35), selectedColor: White(0.95) },
                        onChange: function(self) {
                            if (self.value == ((customer.consent) ? 1 : 0)) return;
                            saveChange(function(c) { c.consent = self.value; c.consentAt = Date.now(); return ""; }, (self.value) ? "Marketing consent is on." : "Marketing consent is off.");
                        },
                    });
                endGroup();

            endGroup();

            // ORDERS
            const orders = customer.orders.slice(0, 8);
            startSection("Orders" + ((customer.orderCount > orders.length) ? " · last " + orders.length + " of " + customer.orderCount : ""));

                if (!orders.length) {
                    Label({ text: "No orders yet. This customer registered but did not buy anything.", fontSize: 13, textColor: White(0.5), width: "100%" });
                } else {
                    const table = TinyTable({
                        columnHeaders: ["ORDER", "DATE", "TOTAL", "STATUS"],
                        columnWidths: ["30%", "30%", "18%", "20%"], // 98%: 1px gaps between cells
                        dataRows: orders.map(function(order) {
                            return [escape(order.id), OrdersPage.formatDateTime(order.time).slice(0, 10), OrdersPage.formatMoney(order.total), OrdersPage.STATUSES[order.status].label];
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
                        // WHY: TinyTable has no row click. cell.lineCount is the row, so every cell opens its order.
                        onCellRender: function(cell) {
                            const order = orders[cell.lineCount];
                            if (cell.index == 2) cell.textAlign = "right";
                            if (cell.index == 3) cell.textColor = OrdersPage.STATUSES[order.status].color;
                            if (cell.index == 0) cell.textColor = S.ACCENT_COLOR;
                            cell.clickable = 1;
                            cell.on("click", function() {
                                // Open the order on the Orders page
                                rightView.hide();
                                rightView.clean();
                                leftMenu.setSelectedItem(OrdersPage.KEY);
                                OrdersPage({ openOrderId: order.id });
                            });
                        },
                    });
                    table.width = "100%";
                    Label({ text: "Click an order to open it on the Orders page.", fontSize: 12, textColor: White(0.4) });
                }

            endGroup();

            // NOTES
            startSection("Notes");

                customer.notes.slice().reverse().forEach(function(note, index, list) {
                    HGroup({ width: "100%", height: "auto", align: "left top", gap: 12 });
                        VGroup({ width: 12, height: "auto", align: "center top", gap: 0 });
                        that.elem.style.alignSelf = "stretch";
                            Box({ width: 10, height: 10, round: 100, color: S.ACCENT_COLOR });
                            that.elem.style.marginTop = "5px";
                            if (index < list.length - 1) {
                                Box({ width: 2, height: "auto", color: White(0.1) });
                                that.elem.style.flex = "1 1 auto";
                                that.elem.style.minHeight = "16px";
                            }
                        endGroup();
                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                        that.elem.style.flex = "1 1 auto";
                        that.elem.style.minWidth = "0";
                        that.elem.style.paddingBottom = "10px";
                            Label({ text: escape(note.text), fontSize: 14, textColor: White(0.9), width: "100%" });
                            Label({ text: new Date(note.time).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) + " · " + escape(note.by), fontSize: 12, textColor: White(0.45) });
                        endGroup();
                    endGroup();
                });

                if (!customer.notes.length) Label({ text: "No notes yet.", fontSize: 13, textColor: White(0.45) });

                HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 8 });
                    const inputNote = createDarkInput({ titleText: "ADD A NOTE", placeholder: "Only the team can see it", maxChar: 200 });
                    inputNote.elem.style.flex = "1 1 0";
                    inputNote.elem.style.minWidth = "0";
                    CustomersPage.createButton("Add", "", function() {
                        const text = inputNote.getInputValue().trim();
                        if (!text) return;
                        saveChange(function(c) { c.notes.push({ time: Date.now(), text: text, by: CustomersPage.getCurrentUserName() }); return ""; }, "Note added.");
                    });
                    that.elem.style.flexShrink = "0";
                endGroup();

            endGroup();

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        CustomersPage.createButton((customer.blocked) ? "Unblock" : "Block Customer", "", function() {
            if (customer.blocked) {
                saveChange(function(c) { c.blocked = 0; return ""; }, "Customer is unblocked.");
                return;
            }
            Dialog({
                icon: "assets/warning.png",
                title: "Block Customer",
                desc: "<b>" + escape(customer.name) + "</b> will not be able to sign in or place orders. Open orders are not changed.",
                confirmButtonText: "Block",
                confirmButtonColor: S.ERROR_COLOR,
                cancelButtonText: "Cancel",
                callback: function(isConfirmed) {
                    if (isConfirmed && box) saveChange(function(c) { c.blocked = 1; return ""; }, "Customer is blocked.");
                },
            });
        });

        // WHY: Hold to confirm, so a customer is not deleted by mistake.
        const btnDelete = HoldToConfirmButton({
            height: 40,
            labelText: "Hold to Delete",
            completedText: "DELETED",
            iconFile: "../../comp-m3/hold-to-confirm-button/trash.png",
            holdingIconFile: "../../comp-m3/hold-to-confirm-button/trash-red.png",
            holdDuration: 1500,
            resetDelay: 600,
            style: {
                layout: { gap: 6, padding: [14, 0] },
                icon: { width: 18, height: 18 },
                label: { fontSize: 14, textColor: White(0.9) },
                holdingLabel: { fontSize: 14, textColor: "#B03A2E" },
                completedLabel: { fontSize: 14, textColor: "#2C5A38" },
                box: { color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
                holdingBox: { color: "#FFD1CB", borderColor: S.ERROR_COLOR, round: 8 },
                completedBox: { color: "#DFEFE6", borderColor: S.ACCENT_COLOR, round: 8 },
            },
            onConfirm: function() {
                saveChange(function(c) {
                    if (c.orderCount > 0) return "A customer with orders can not be deleted. Block the customer instead.";
                    const list = CustomersPage.getCustomers();
                    list.splice(list.indexOf(c), 1);
                    return "";
                }, "", 1);
            },
        });
        btnDelete.icon.elem.style.filter = "invert(100%)"; // WHY: Only the normal icon is on a dark background.
        if (customer.orderCount > 0) btnDelete.elem.title = "Customers with orders can not be deleted";

        Label({ text: (customer.orderCount > 0) ? "Has orders: can be blocked, not deleted." : "", fontSize: 12, textColor: White(0.4) });

    endGroup();

    // *** INIT CODE:

    rightView.clean();
    rightView.setKey(CustomerDetails.KEY);
    rightView.setWidth(560);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

CustomerDetails.KEY = "CustomerDetails";

// *** STATIC: STYLE AND HELPERS

CustomersPage.DAY = 24 * 60 * 60 * 1000;

CustomersPage.STYLE = {
    CARD_COLOR: "#1A1A19",
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
    ERROR_COLOR: "#E66767",
};

CustomersPage.SEGMENTS = {
    vip: { label: "VIP", color: "#E8B04A" },
    regular: { label: "Regular", color: "#65A293" },
    new: { label: "New", color: "#3987E5" },
    risk: { label: "At risk", color: "#E66767" },
    lead: { label: "Lead", color: "#A9A79F" },
};

// The order matters: a customer that stopped buying is "At risk" even if the spending is high.
CustomersPage.getSegment = function(c) {
    const now = Date.now();
    if (!c.orderCount) return "lead";
    if (now - c.lastOrderAt > 45 * CustomersPage.DAY) return "risk";
    if (now - c.firstOrderAt < 30 * CustomersPage.DAY) return "new";
    if (c.totalSpent >= CustomersPage.vipThreshold) return "vip";
    return "regular";
};

// VIP: top 30% of the customers with orders. (Set by getCustomers(), from the data.)
CustomersPage.vipThreshold = Infinity;

CustomersPage.getSegmentByLabel = function(label) {
    const id = Object.keys(CustomersPage.SEGMENTS).find(function(key) { return CustomersPage.SEGMENTS[key].label == label; });
    return (id) ? CustomersPage.SEGMENTS[id] : null;
};

CustomersPage.getInitials = function(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0).toUpperCase(); }).join("");
};

CustomersPage.AVATAR_COLORS = ["#3D7A6B", "#344F6C", "#583432", "#6B5B2E", "#4A3F6B", "#2E5E6B"];
CustomersPage.getAvatarColor = function(id) {
    return CustomersPage.AVATAR_COLORS[id % CustomersPage.AVATAR_COLORS.length];
};

CustomersPage.isEmail = function(text) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text);
};

// "5 days ago"
CustomersPage.formatRelative = function(time) {
    const seconds = Math.round((Date.now() - time) / 1000);
    const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const unit of units) {
        const value = Math.floor(seconds / unit[1]);
        if (value >= 1) return value + " " + unit[0] + ((value > 1) ? "s" : "") + " ago";
    }
    return "Just now";
};

CustomersPage.getCurrentUserName = function() {
    return (typeof UserActionsPage !== "undefined") ? UserActionsPage.getCurrentUser().name : "You";
};

// params: { primary: 1, width }
CustomersPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = CustomersPage.STYLE;
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
CustomersPage.createTinySelect = function(list, onSelect, selectedIndex = 0) {
    const S = CustomersPage.STYLE;
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

CustomersPage.getSmartTableStyle = function(libPath) {
    const S = CustomersPage.STYLE;
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

// *** STATIC: CUSTOMER DATA (TEST)

CustomersPage._customers = null;

// Customers of the store. The ones with orders are built from the Orders page, so the totals match the orders.
// Created one time and kept while the panel is open.
// TODO: Load the customers from your service (with paging and filters).
CustomersPage.getCustomers = function() {

    if (CustomersPage._customers) return CustomersPage._customers;

    const DAY = CustomersPage.DAY;
    const now = Date.now();
    let seed = 90211;
    const rnd = function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pick = function(list) { return list[Math.floor(rnd() * list.length)]; };
    const cityOf = function(address) { const parts = address.split(",").map(function(p) { return p.trim(); }); return parts[parts.length - 1].replace(/^\d+\s*/, ""); };

    const list = [];
    let nextId = 1;

    // 1. From the orders
    const byEmail = {};
    OrdersPage.getOrders().forEach(function(order) {
        const key = order.customer.email.toLowerCase();
        if (!byEmail[key]) {
            byEmail[key] = {
                id: nextId++, name: order.customer.name, email: order.customer.email, phone: order.customer.phone,
                address: order.address, city: cityOf(order.address),
                orders: [], orderCount: 0, totalSpent: 0, firstOrderAt: order.time, lastOrderAt: order.time,
                tags: [], notes: [], consent: (rnd() < 0.7) ? 1 : 0, consentAt: 0, blocked: 0, registeredAt: 0,
            };
            list.push(byEmail[key]);
        }
        const c = byEmail[key];
        c.orders.push(order);
        c.orderCount++;
        if (!["cancelled", "refunded"].includes(order.status)) c.totalSpent += order.total;
        if (order.time < c.firstOrderAt) c.firstOrderAt = order.time;
        if (order.time > c.lastOrderAt) c.lastOrderAt = order.time;
    });
    const recompute = function(c) {
        c.orders.sort(function(a, b) { return b.time - a.time; }); // Newest first
        c.orderCount = c.orders.length;
        c.totalSpent = Math.round(c.orders.filter(function(o) { return !["cancelled", "refunded"].includes(o.status); }).reduce(function(sum, o) { return sum + o.total; }, 0) * 100) / 100;
        c.firstOrderAt = (c.orders.length) ? c.orders[c.orders.length - 1].time : 0;
        c.lastOrderAt = (c.orders.length) ? c.orders[0].time : 0;
    };
    list.forEach(recompute);

    // WHY: The test orders are only from the last 60 days and every customer has many. For the segments to be
    //      visible, two customers keep only their old orders ("At risk") and two only their recent ones ("New").
    list.slice(0, 2).forEach(function(c) { c.orders = c.orders.filter(function(o) { return o.time < now - 50 * DAY; }); recompute(c); });
    list.slice(2, 4).forEach(function(c) { c.orders = c.orders.filter(function(o) { return o.time > now - 12 * DAY; }); recompute(c); });

    list.forEach(function(c) {
        c.registeredAt = c.firstOrderAt - Math.round(rnd() * 10) * DAY;
        c.consentAt = c.registeredAt;
        if (rnd() < 0.3) c.tags.push("newsletter");
    });

    // VIP threshold: top 30% of the spending
    const spends = list.map(function(c) { return c.totalSpent; }).sort(function(a, b) { return a - b; });
    CustomersPage.vipThreshold = spends[Math.floor(spends.length * 0.7)] || Infinity;
    list.forEach(function(c) { if (c.totalSpent >= CustomersPage.vipThreshold) c.tags.push("vip"); });

    // 2. Registered customers without an order (leads)
    const LEADS = [
        ["Burak Sahin", "burak.sahin@mail.com", "Istanbul"], ["Elif Kaya", "elif.kaya@mail.com", "Ankara"], ["Lukas Meyer", "lukas.meyer@mail.de", "Munich"],
        ["Zeynep Acar", "zeynep.acar@mail.com", "Izmir"], ["Omer Tas", "omer.tas@mail.com", "Bursa"], ["Sofia Rossi", "sofia.rossi@mail.it", "Milan"],
        ["Kerem Ulu", "kerem.ulu@mail.com", "Antalya"], ["Nil Aydin", "nil.aydin@mail.com", "Istanbul"], ["Jan de Vries", "jan.devries@mail.nl", "Utrecht"],
        ["Melis Er", "melis.er@mail.com", "Eskisehir"], ["Cem Polat", "cem.polat@mail.com", "Mersin"], ["Ayse Demir", "ayse.demir@mail.com", "Konya"],
        ["Marta Nowak", "marta.nowak@mail.pl", "Krakow"], ["Baris Koc", "baris.koc@mail.com", "Samsun"], ["Ipek Yildiz", "ipek.yildiz@mail.com", "Istanbul"],
        ["Tom Becker", "tom.becker@mail.de", "Hamburg"], ["Gizem Ak", "gizem.ak@mail.com", "Adana"], ["Ahmet Kilic", "ahmet.kilic@mail.com", "Gaziantep"],
        ["Laura Bianchi", "laura.bianchi@mail.it", "Rome"], ["Emir Cetin", "emir.cetin@mail.com", "Trabzon"], ["Derya Sen", "derya.sen@mail.com", "Ankara"],
        ["Pieter Bakker", "pieter.bakker@mail.nl", "Rotterdam"], ["Sude Arslan", "sude.arslan@mail.com", "Izmir"], ["Yusuf Kara", "yusuf.kara@mail.com", "Kayseri"],
    ];
    LEADS.forEach(function(item) {
        const registeredAt = now - Math.round(rnd() * 90) * DAY - Math.round(rnd() * 20) * 3600000;
        list.push({
            id: nextId++, name: item[0], email: item[1], phone: "+90 5" + String(Math.floor(rnd() * 1e9)).padStart(9, "0"),
            address: "", city: item[2],
            orders: [], orderCount: 0, totalSpent: 0, firstOrderAt: 0, lastOrderAt: 0,
            tags: (rnd() < 0.25) ? ["newsletter"] : [], notes: [], consent: (rnd() < 0.5) ? 1 : 0, consentAt: registeredAt, blocked: (rnd() < 0.08) ? 1 : 0, registeredAt: registeredAt,
        });
    });

    // A few notes, so the panel is not empty
    list[0].notes.push({ time: now - 12 * DAY, text: "Asked for an invoice with the company name. Sent by e-mail.", by: "Deniz Arslan" });
    list[0].notes.push({ time: now - 3 * DAY, text: "Called about the late delivery of ORD-100012. Coupon given.", by: "Ceren Aktas" });
    list[3].notes.push({ time: now - 20 * DAY, text: "Wholesale customer candidate. Wants a price list.", by: "Zeynep Karaca" });
    list[3].tags.push("wholesale");

    CustomersPage._customers = list;
    return list;

};
