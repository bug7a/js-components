/* Bismillah */

/*

Activity Log Page (Template) - v26.09

- Who did what and when in the panel (audit log): filters, security alert, summary graphs,
  a big table (virtual scroll) and a details panel with the changes (before / after).
- Live mode: New events are collected and shown with a "new events" button,
  so the table does not jump while the user reads it.
- Test data: About 5000 events of the last 90 days, created one time with a fixed seed.
  Users come from the Roles page (RolesPage.load), if it is loaded.
- Replace ActivityPage.getEvents() with your service (API with paging and filters for big logs).

COMPONENTS:
- TextTabs (comp-m2): Time range
- SearchInput (comp-m2): Search
- TinySelect (comp-m2): User, action and module filters
- Toggle (comp-m2): Live updates
- SparkLineBox (comp-m4): Summary graphs
- SmartTable (comp-m3): Event list
- TinyTable (comp-m2): Changes (details panel)
- ButtonWithIcon (comp-m3): Actions

*/

ActivityPageDefaults = {
    color: "transparent",
};

const ActivityPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ActivityPageDefaults, mainView);

    mainView.setKey(ActivityPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = ActivityPage.STYLE;

    const HOUR = 60 * 60 * 1000;
    const DAY = 24 * HOUR;
    const LIVE_INTERVAL = 4000; // ms (test: a new event every 4 seconds)
    const FAILED_SIGN_IN_LIMIT = 3; // In the last hour: show the security alert

    const RANGES = [
        { text: "24 hours", ms: DAY },
        { text: "7 days", ms: 7 * DAY },
        { text: "30 days", ms: 30 * DAY },
        { text: "90 days", ms: 90 * DAY },
    ];

    const filter = {
        rangeIndex: 1,
        search: "",
        userId: "",
        action: "",
        module: "",
    };

    let liveTimer = null;
    let searchTimer = null;
    let pendingCount = 0; // Live events that are not in the table yet
    let isRendering = 0;

    // Components
    let lblSubtitle, liveToggle, lblLive;
    let alertBox, lblAlert;
    let rangeTabs, searchInput, userSelect, actionSelect, moduleSelect;
    let kpiBoxList = [];
    let btnNewEvents, lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    const getEvents = function() {
        return ActivityPage.getEvents();
    };

    const getFilteredEvents = function() {

        const since = Date.now() - RANGES[filter.rangeIndex].ms;
        const search = filter.search.trim().toLowerCase();

        return getEvents().filter(function(event) {
            if (event.time < since) return false;
            if (filter.userId && String(event.userId) != filter.userId) return false;
            if (filter.action && event.action != filter.action) return false;
            if (filter.module && event.module != filter.module) return false;
            if (search) {
                const text = (event.userName + " " + event.target + " " + event.ip + " " + ActivityPage.ACTIONS[event.action].label).toLowerCase();
                if (!text.includes(search)) return false;
            }
            return true;
        });

    };

    const renderTable = function() {

        const list = getFilteredEvents();

        smartTable.setItemDataList(list.map(function(event) {
            return {
                id: event.id,
                time: ActivityPage.formatDateTime(event.time), // Sortable text
                user: event.userName,
                action: ActivityPage.ACTIONS[event.action].label,
                module: event.module,
                target: event.target,
                ip: event.ip,
            };
        }));

        lblResultCount.text = list.length.toLocaleString("en-US") + " events in the last " + RANGES[filter.rangeIndex].text;

        pendingCount = 0;
        updateNewEventsButton();

    };

    const renderSummary = function() {

        const events = getEvents();
        const now = Date.now();

        // Last 24 hours, one bar for each hour
        const hourly = function(test) {
            const bars = new Array(24).fill(0);
            events.forEach(function(event) {
                const age = now - event.time;
                if (age < 0 || age >= DAY || !test(event)) return;
                bars[23 - Math.floor(age / HOUR)]++;
            });
            return bars;
        };

        // Last 7 days, one bar for each day
        const daily = function(test, countUsers) {
            const bars = new Array(7).fill(0).map(function() { return (countUsers) ? new Set() : 0; });
            events.forEach(function(event) {
                const age = now - event.time;
                if (age < 0 || age >= 7 * DAY || !test(event)) return;
                const index = 6 - Math.floor(age / DAY);
                if (countUsers) bars[index].add(event.userId);
                else bars[index]++;
            });
            return (countUsers) ? bars.map(function(set) { return set.size; }) : bars;
        };

        const all = hourly(function() { return true; });
        const failed = hourly(function(event) { return event.action == "login_failed"; });
        const activeUsers = daily(function() { return true; }, 1);
        const deletions = daily(function(event) { return event.action == "delete"; });

        const users7d = new Set(events.filter(function(event) { return now - event.time < 7 * DAY; }).map(function(event) { return event.userId; }));

        const values = [
            { text: sum(all).toLocaleString("en-US"), bars: all },
            { text: String(sum(failed)), bars: failed.map(function(value) { return { value: value, color: (value >= FAILED_SIGN_IN_LIMIT) ? S.ERROR_COLOR : "" }; }) },
            { text: String(users7d.size), bars: activeUsers },
            { text: String(sum(deletions)), bars: deletions },
        ];

        kpiBoxList.forEach(function(kpiBox, index) {
            kpiBox.setValueText(values[index].text);
            kpiBox.setValues(values[index].bars);
        });

        renderSecurityAlert();

    };

    const sum = function(list) {
        return list.reduce(function(total, value) { return total + value; }, 0);
    };

    // Failed sign-ins of the last hour, grouped by the user.
    const renderSecurityAlert = function() {

        const since = Date.now() - HOUR;
        const counts = {};

        getEvents().forEach(function(event) {
            if (event.action != "login_failed" || event.time < since) return;
            counts[event.userId] = (counts[event.userId] || 0) + 1;
        });

        const userId = Object.keys(counts).sort(function(a, b) { return counts[b] - counts[a]; })[0];
        const isShown = userId && counts[userId] >= FAILED_SIGN_IN_LIMIT;

        alertBox.visible = (isShown) ? 1 : 0;
        if (!isShown) return;

        const user = ActivityPage.getUsers().find(function(u) { return String(u.id) == userId; });
        alertBox.userId = userId;
        lblAlert.text = "<b>" + counts[userId] + " failed sign-ins</b> for " + ActivityPage.escapeHtml((user) ? user.name : "a user") + " in the last hour. Check the IP addresses and lock the account if needed.";

    };

    const updateNewEventsButton = function() {
        btnNewEvents.visible = (pendingCount > 0) ? 1 : 0;
        btnNewEvents.setText("↑ " + pendingCount + " new event" + ((pendingCount > 1) ? "s" : "") + " · Show");
    };

    const setLive = function(isOn) {
        clearInterval(liveTimer);
        liveTimer = null;
        lblLive.text = (isOn) ? "<span style='color:" + S.ACCENT_COLOR + "'>●</span> Live" : "Live updates";
        if (!isOn) return;
        liveTimer = setInterval(function() {
            if (!box) return;
            // TODO: Get new events from your service (polling, SSE or WebSocket).
            getEvents().unshift(ActivityPage.createLiveEvent());
            pendingCount++;
            updateNewEventsButton();
            renderSummary();
        }, LIVE_INTERVAL);
    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList; // WHY: Also uses the search of the table.
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["time,user,action,module,target,ip"].concat(rows.map(function(row) {
            return [row.time, row.user, row.action, row.module, row.target, row.ip].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "activity-log-" + ActivityPage.formatDateTime(Date.now()).slice(0, 10) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const setUserFilter = function(userId) {
        const index = userSelect.getIndexById(String(userId));
        if (index >= 0) userSelect.setSelectedIndex(index); // onSelect renders the table
    };

    const openDetails = function(eventId) {
        const event = getEvents().find(function(e) { return e.id == eventId; });
        if (!event) return;
        ActivityDetails({
            event: event,
            onShowUser: function(userId) {
                closeDetails();
                setUserFilter(userId);
            },
        });
    };

    const closeDetails = function() {
        if (rightView.isShown(ActivityDetails.KEY)) {
            rightView.hide();
            rightView.clean();
        }
    };

    // *** VIEW HELPERS:

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    const startCard = function(params = {}) {
        return VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 12,
            padding: 16,
            color: S.CARD_COLOR,
            border: 1,
            borderColor: S.CARD_BORDER_COLOR,
            round: 12,
            ...params,
        });
    };

    const createTinySelect = function(list, onSelect) {
        return TinySelect({
            list: list,
            height: 40,
            fontSize: 14,
            color: S.FIELD_COLOR,
            border: 1,
            borderColor: S.CARD_BORDER_COLOR,
            round: 8,
            labelBoldFont: 0,
            labelTextColor: White(0.9),
            arrowIcon: LIB_PATH + "comp-m2/tiny-select/arrow.svg",
            arrowSize: 18,
            invertIconColor: 1,
            listFontSize: 14,
            listTextColor: White(0.85),
            listOverTextColor: S.ACCENT_COLOR,
            listBackgroundColor: S.FIELD_COLOR,
            listBorderColor: White(0.15),
            onSelect: function(index, id) {
                if (isRendering || !smartTable) return; // Called on create
                onSelect(id);
            },
        });
    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearInterval(liveTimer);
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

                Label({ text: "Activity Log", fontSize: 26, textColor: White(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                lblSubtitle = Label({ text: "Who did what, and when. Events are kept for 90 days.", fontSize: 14, textColor: White(0.5) });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "right center", gap: 12 });

                lblLive = Label({ text: "", fontSize: 14, textColor: White(0.75) });

                liveToggle = Toggle({
                    width: 52,
                    height: 30,
                    spacing: 3,
                    backgroundStyle: { color: "#2C2C2A", selectedColor: S.PRIMARY_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    buttonStyle: { color: White(0.35), selectedColor: White(0.95) },
                    onChange: function(self) {
                        setLive(self.value === 1);
                    },
                });
                liveToggle.elem.setAttribute("aria-label", "Live updates");

                ActivityPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV, { primary: 1 });

            endGroup();

        endGroup();

    };

    const initSecurityAlert = function() {

        alertBox = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 12,
            padding: [16, 12],
            color: "rgba(230, 103, 103, 0.10)",
            border: 1,
            borderColor: "rgba(230, 103, 103, 0.45)",
            round: 12,
        });
        alertBox.elem.setAttribute("role", "alert");

            Icon({ width: 22, height: 22 });
            that.load(ASSETS + "warning.png");
            that.elem.style.filter = "invert(62%) sepia(40%) saturate(900%) hue-rotate(310deg)"; // Red-ish icon
            that.elem.style.flexShrink = "0";

            lblAlert = Label({ text: "", fontSize: 14, textColor: White(0.9) });
            setFlex(lblAlert, "1 1 auto");

            ActivityPage.createButton("Show Events", "", function() {
                setUserFilter(alertBox.userId);
                const index = actionSelect.getIndexById("login_failed");
                if (index >= 0) actionSelect.setSelectedIndex(index);
            });

        endGroup();

    };

    const initFilters = function() {

        startCard();

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                rangeTabs = TextTabs({
                    tabHeight: 40, // The same height as the buttons / inputs next to it
                    tabList: RANGES.map(function(range) { return range.text; }),
                    onClick: function(self) {
                        filter.rangeIndex = self.index;
                        renderTable();
                    },
                    backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
                    tabPadding: [3, 3],
                    labelStyle: { fontSize: 14, textColor: White(0.85), padding: [12, 6] },
                    selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
                });

                searchInput = SearchInput({
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
                    placeholderText: "Search user, target, IP",
                    invertIconColor: 1,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, renderTable, 200); // WHY: Filtering thousands of rows on every key is slow.
                    },
                });
                that.position = "relative";

                userSelect = createTinySelect(
                    [{ id: "", label: "All users" }].concat(ActivityPage.getUsers().map(function(user) {
                        return { id: String(user.id), label: ActivityPage.escapeHtml(user.name) };
                    })),
                    function(id) { filter.userId = id; renderTable(); }
                );

                actionSelect = createTinySelect(
                    [{ id: "", label: "All actions" }].concat(Object.keys(ActivityPage.ACTIONS).map(function(id) {
                        return { id: id, label: ActivityPage.ACTIONS[id].label };
                    })),
                    function(id) { filter.action = id; renderTable(); }
                );

                moduleSelect = createTinySelect(
                    [{ id: "", label: "All modules" }].concat(ActivityPage.MODULES.map(function(name) {
                        return { id: name, label: name };
                    })),
                    function(id) { filter.module = id; renderTable(); }
                );

            endGroup();

        endGroup();

    };

    const initSummary = function() {

        const KPI_LIST = [
            { title: "Events · 24 hours", lineColor: S.ACCENT_COLOR },
            { title: "Failed sign-ins · 24 hours", lineColor: "#E0A03C" },
            { title: "Active users · 7 days", lineColor: "#3987E5" },
            { title: "Deletions · 7 days", lineColor: S.ERROR_COLOR },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            KPI_LIST.forEach(function(kpi) {

                const kpiBox = SparkLineBox({
                    height: 96,
                    title: kpi.title,
                    valueText: "",
                    iconFile: "",
                    lineColor: kpi.lineColor,
                    style: {
                        box: { color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 },
                        text: { padding: 14 },
                        title: { fontSize: 13, textColor: White(0.5) },
                        valueText: { fontSize: 24, textColor: White(0.95) },
                        graph: { height: 30, padding: 14 },
                    },
                });
                setFlex(kpiBox, "1 1 220px");
                kpiBoxList.push(kpiBox);

            });

        endGroup();

        // WHY: Bar count was calculated with the default width (before flex).
        kpiBoxList.forEach(function(kpiBox) { kpiBox.refresh(); });

    };

    const initTable = function() {

        startCard({ gap: 10 });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.justifyContent = "space-between";

                lblResultCount = Label({ text: "", fontSize: 14, textColor: White(0.6) });

                // WHY: ButtonWithIcon does not create its label when the text is empty. setText() needs the label.
                btnNewEvents = ActivityPage.createButton("New events", "", renderTable, { primary: 1 });

            endGroup();

            HGroup({ width: "100%", height: 620, align: "left top" });

                smartTable = SmartTable({
                    titleDataList: [
                        { name: "TIME", dataTitle: "time", dataType: "string", width: 180, shortable: 1 },
                        { name: "USER", dataTitle: "user", dataType: "string", width: 170, shortable: 1 },
                        { name: "ACTION", dataTitle: "action", dataType: "string", width: 180, shortable: 1 },
                        { name: "MODULE", dataTitle: "module", dataType: "string", width: 130, shortable: 1 },
                        { name: "TARGET", dataTitle: "target", dataType: "string", width: 300, shortable: 1 },
                        { name: "IP ADDRESS", dataTitle: "ip", dataType: "string", width: 140, shortable: 1 },
                    ],
                    itemDataList: [],
                    titleHeight: 44,
                    itemHeight: 40,
                    infoHeight: 56,
                    itemLineCount: 13,
                    sortByTitleIndex: 0,
                    sortDirection: "Z-A", // Newest first
                    onSelect: function(itemData) {
                        openDetails(itemData.id);
                    },
                    // Colored action texts
                    updateCustomItemCell: function(cell, titleDataIndex, data) {
                        if (titleDataIndex != 2) return;
                        const action = ActivityPage.getActionByLabel(data);
                        cell.label.textColor = (action) ? action.color : White(0.75);
                    },
                    ...ActivityPage.getSmartTableStyle(LIB_PATH),
                });

            endGroup();

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
            initSecurityAlert();
            initSummary();
            initFilters();
            initTable();

        endGroup();

    endBox();

    rangeTabs.selectByIndex(filter.rangeIndex);
    setLive(0);
    renderSummary();
    renderTable();

    return box.endPage();

};

ActivityPage.KEY = "Activity";

// *** DETAILS PANEL (RIGHT VIEW):

const ActivityDetailsDefaults = {
    event: null,
    onShowUser: function(userId) {},
};

const ActivityDetails = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ActivityDetailsDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "#141414";

    // WHY: event is a live object of the list. startObject() would copy it.
    const event = params.event;

    // BOX: Component container
    let box = startObject(params);

    const S = ActivityPage.STYLE;
    const action = ActivityPage.ACTIONS[event.action];
    const escape = ActivityPage.escapeHtml;

    box.destroy = function() {
        box.remove();
        box = null;
    };

    // Left line
    Box(0, 0, 1, "100%", { color: White(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 16, padding: 20 });

            // Title
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
            that.elem.style.justifyContent = "space-between";

                Label({ text: "Event Details", fontSize: 18, textColor: White(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

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

            // Summary sentence
            VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: [16, 14], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });

                Label({
                    text: action.label.toUpperCase(),
                    fontSize: 11,
                    textColor: action.color,
                    color: ActivityPage.alpha(action.color, 0.14),
                    round: 6,
                    padding: [8, 3],
                });
                that.elem.style.letterSpacing = "1px";

                Label({
                    text: "<b>" + escape(event.userName) + "</b> " + action.label.toLowerCase() + " <b>" + escape(event.target) + "</b>",
                    fontSize: 16,
                    textColor: White(0.9),
                    width: "100%",
                });

                Label({
                    text: ActivityPage.formatRelative(event.time) + " · " + new Date(event.time).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "medium" }),
                    fontSize: 13,
                    textColor: White(0.5),
                    width: "100%",
                });

            endGroup();

            // Information
            const INFO = [
                ["Module", event.module],
                ["User", event.userName + " (" + event.userEmail + ")"],
                ["IP address", event.ip],
                ["Location", event.location],
                ["Device", event.device],
                ["Request ID", event.requestId],
            ];

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });

                INFO.forEach(function(info, index) {
                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 16, padding: [0, 9] });
                    that.elem.style.justifyContent = "space-between";
                    if (index > 0) that.elem.style.borderTop = "1px solid " + White(0.06);
                        Label({ text: info[0], fontSize: 13, textColor: White(0.5) });
                        that.elem.style.flexShrink = "0";
                        Label({ text: escape(info[1]), fontSize: 13, textColor: White(0.9), textAlign: "right" });
                    endGroup();
                });

            endGroup();

            // Changes
            if (event.changes && event.changes.length) {

                Label({ text: "CHANGES", fontSize: 11, textColor: White(0.45) });
                that.elem.style.letterSpacing = "1px";

                const table = TinyTable({
                    columnHeaders: ["FIELD", "BEFORE", "AFTER"],
                    columnWidths: ["28%", "35%", "36%"], // 99%: 1px gaps between cells
                    dataRows: event.changes.map(function(change) {
                        return [escape(change.field), escape(change.before), escape(change.after)];
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
                    cellTextColor: White(0.8),
                    rowHoverBackgroundColor: White(0.05),
                    rowHoverBorderColor: White(0.1),
                    onCellRender: function(cell) {
                        if (cell.index == 1) {
                            cell.textColor = "#E6A0A0";
                            cell.elem.style.textDecoration = "line-through";
                        }
                        if (cell.index == 2) cell.textColor = "#9FD3C4";
                    },
                });
                table.width = "100%";

            }

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "right center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        const btnCopy = ActivityPage.createButton("Copy JSON", "", function() {
            navigator.clipboard.writeText(JSON.stringify(event, null, 2)).then(function() {
                btnCopy.setText("Copied ✓");
                setTimeout(function() { if (box) btnCopy.setText("Copy JSON"); }, 1500);
            });
        });

        ActivityPage.createButton("All Events of This User", "", function() {
            box.onShowUser(event.userId);
        }, { primary: 1 });

    endGroup();

    // *** INIT CODE:

    rightView.clean();
    rightView.setKey(ActivityDetails.KEY);
    rightView.setWidth(460);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

ActivityDetails.KEY = "ActivityDetails";

// *** STATIC: STYLE AND HELPERS

ActivityPage.STYLE = {
    CARD_COLOR: "#1A1A19",
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
    ERROR_COLOR: "#E66767",
};

// security: 1 -> Important for security
ActivityPage.ACTIONS = {
    create: { label: "Created", color: "#65A293" },
    update: { label: "Updated", color: "#3987E5" },
    delete: { label: "Deleted", color: "#E66767" },
    login: { label: "Signed in", color: "#A9A79F" },
    login_failed: { label: "Failed sign-in", color: "#E0A03C", security: 1 },
    permission: { label: "Changed permissions", color: "#9085E9", security: 1 },
    export: { label: "Exported", color: "#C98500" },
};

ActivityPage.MODULES = ["Auth", "Users", "Contents", "Media Library", "Roles", "Settings", "Reports"];

ActivityPage.getActionByLabel = function(label) {
    const id = Object.keys(ActivityPage.ACTIONS).find(function(key) { return ActivityPage.ACTIONS[key].label == label; });
    return (id) ? ActivityPage.ACTIONS[id] : null;
};

ActivityPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// "#65A293", 0.2 -> "rgba(101, 162, 147, 0.2)"
ActivityPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

// Local time: "2026-09-16 14:05:09" (sortable text)
ActivityPage.formatDateTime = function(time) {
    const d = new Date(time);
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
};

// "5 minutes ago"
ActivityPage.formatRelative = function(time) {
    const seconds = Math.round((Date.now() - time) / 1000);
    const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const unit of units) {
        const value = Math.floor(seconds / unit[1]);
        if (value >= 1) return value + " " + unit[0] + ((value > 1) ? "s" : "") + " ago";
    }
    return "Just now";
};

// params: { primary: 1, width }
ActivityPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = ActivityPage.STYLE;
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

ActivityPage.getSmartTableStyle = function(libPath) {
    const S = ActivityPage.STYLE;
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

// *** STATIC: TEST DATA

// Panel users (from the Roles page, if it is loaded)
ActivityPage.getUsers = function() {
    if (typeof RolesPage !== "undefined") return RolesPage.load().users;
    return [
        { id: 1, name: "Bugra Ozden", email: "bugra.ozden@gmail.com" },
        { id: 2, name: "Alper Kaya", email: "a.kaya@company.net" },
        { id: 3, name: "Deniz Arslan", email: "deniz_arslan@studio.com" },
    ];
};

ActivityPage._events = null;
ActivityPage._nextId = 1;
ActivityPage._random = null;

// Random numbers with a seed: the same test data every time. (mulberry32)
ActivityPage.random = function() {
    if (!ActivityPage._random) {
        let seed = 20260916;
        ActivityPage._random = function() {
            seed = (seed + 0x6D2B79F5) | 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    return ActivityPage._random();
};

ActivityPage.pick = function(list) {
    return list[Math.floor(ActivityPage.random() * list.length)];
};

// One test event. { id, time, userId, userName, userEmail, action, module, target, ip, location, device, requestId, changes }
ActivityPage.createEvent = function(time, user) {

    const pick = ActivityPage.pick;
    const rnd = ActivityPage.random;

    // Weighted action
    const r = rnd();
    const action = (r < 0.22) ? "login" : (r < 0.46) ? "update" : (r < 0.64) ? "create" : (r < 0.74) ? "delete" : (r < 0.86) ? "export" : (r < 0.93) ? "login_failed" : "permission";

    const CONTENT_TITLES = ["About us", "Summer sale", "Shipping policy", "How to choose headphones", "Careers", "Contact"];
    const MEDIA_FILES = ["summer-sale-hero.jpg", "product-catalog.pdf", "team-photo-2026.jpg", "promo-video.mp4", "price-list-2026.pdf"];
    const ROLE_NAMES = ["Editor", "Support", "Marketing", "Viewer"];
    const CUSTOMERS = ["Selin Koc", "Emre Gunes", "Yasemin Dogan", "Tarik Yilmaz", "Hakan Bulut"];

    let module, target, changes = [];

    switch (action) {

        case "login":
        case "login_failed":
            module = "Auth";
            target = (action == "login") ? "Panel" : "Password sign-in";
            break;

        case "permission": {
            module = "Roles";
            target = "Role \"" + pick(ROLE_NAMES) + "\"";
            changes = [{ field: pick(["users.edit", "contents.delete", "media.create", "settings.view"]), before: "Off", after: "On" }];
            break;
        }

        case "export":
            module = pick(["Reports", "Users"]);
            target = (module == "Reports") ? "Sales report (" + pick(["7 days", "30 days", "This year"]) + ")" : "Users list (CSV)";
            break;

        default:
            module = pick(["Users", "Contents", "Contents", "Media Library", "Settings"]);
            if (module == "Settings" && action != "update") module = "Contents"; // Settings are only updated
            if (module == "Users") target = "Customer \"" + pick(CUSTOMERS) + "\"";
            if (module == "Contents") target = "Page \"" + pick(CONTENT_TITLES) + "\"";
            if (module == "Media Library") target = pick(MEDIA_FILES);
            if (module == "Settings") target = pick(["Panel name", "Panel color", "Session timeout"]);
            if (action == "update") {
                const UPDATES = {
                    "Users": [{ field: "email", before: "old@mail.com", after: "new@mail.com" }, { field: "status", before: "Active", after: "Blocked" }],
                    "Contents": [{ field: "title", before: "Summer Sale", after: "Summer Sale 2026" }, { field: "status", before: "Draft", after: "Published" }],
                    "Media Library": [{ field: "folder", before: "Products", after: "Banners" }, { field: "alt text", before: "", after: "Summer sale banner" }],
                    "Settings": [{ field: "value", before: "30 min", after: "60 min" }],
                };
                changes = UPDATES[module].slice(0, 1 + Math.floor(rnd() * UPDATES[module].length));
            }
            break;

    }

    const isStrange = action == "login_failed" && rnd() < 0.5;

    return {
        id: ActivityPage._nextId++,
        time: time,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: action,
        module: module,
        target: target,
        ip: (isStrange) ? "185." + Math.floor(rnd() * 255) + "." + Math.floor(rnd() * 255) + "." + Math.floor(rnd() * 255) : "85.105.12." + (10 + user.id),
        location: (isStrange) ? pick(["Unknown (VPN)", "Frankfurt, DE", "Singapore, SG"]) : pick(["Istanbul, TR", "Istanbul, TR", "Ankara, TR"]),
        device: pick(["Chrome · macOS", "Safari · iOS", "Edge · Windows", "Firefox · Linux"]),
        requestId: "req_" + Math.floor(rnd() * 1e12).toString(36),
        changes: changes,
    };

};

// Events of the last 90 days, newest first. Created one time and kept while the panel is open.
ActivityPage.getEvents = function() {

    if (ActivityPage._events) return ActivityPage._events;

    const users = ActivityPage.getUsers();
    const now = Date.now();
    const list = [];

    for (let day = 89; day >= 0; day--) {
        const count = 40 + Math.floor(ActivityPage.random() * 35);
        for (let i = 0; i < count; i++) {
            // Work hours are busier
            const hour = (ActivityPage.random() < 0.8) ? 8 + Math.floor(ActivityPage.random() * 11) : Math.floor(ActivityPage.random() * 24);
            const time = now - day * 86400000 - (now % 86400000) + hour * 3600000 + Math.floor(ActivityPage.random() * 3600000);
            if (time > now) continue;
            list.push(ActivityPage.createEvent(time, ActivityPage.pick(users)));
        }
    }

    // TEST: A few failed sign-ins in the last hour, so the security alert can be seen.
    const target = users[users.length - 1];
    for (let i = 0; i < 4; i++) {
        const event = ActivityPage.createEvent(now - (i * 11 + 3) * 60000, target);
        event.action = "login_failed";
        event.module = "Auth";
        event.target = "Password sign-in";
        event.changes = [];
        event.ip = "185.220.101." + (40 + i);
        event.location = "Unknown (VPN)";
        list.push(event);
    }

    list.sort(function(a, b) { return b.time - a.time; });
    ActivityPage._events = list;
    return list;

};

// TEST: A new event for the live mode.
ActivityPage.createLiveEvent = function() {
    return ActivityPage.createEvent(Date.now(), ActivityPage.pick(ActivityPage.getUsers()));
};
