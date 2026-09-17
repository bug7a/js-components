/* Bismillah */

/*

Reports Page (Sales Report Template) - v26.09

- A sample report page for the admin panel: filters, summary, charts and a detail table.
- Test data: 2 years of daily sales (5 categories x 4 regions). It is created one time with a fixed seed,
  so the numbers are the same every time.
- Replace ReportsPage.getTestData() and buildReport() with your service (Supabase, SQL view, API...) calls.

COMPONENTS:
- TextTabs (comp-m2): Quick date ranges
- SelectDate (comp-m4): Date range
- TinySelect (comp-m2): Region and group by
- CheckBox (comp-m3): Compare with the previous period
- ButtonWithIcon (comp-m3) + ContextMenu (comp-m4): Export menu
- MiniGraphBox (comp-m4): Summary boxes
- ChartBox (comp-m4): Revenue, regions, orders by category, refund rates
- SmartTable (comp-m3): Report details (sort, filter)
- Waiting (comp-m2): Report query (window.waiting of the panel)

*/

ReportsPageDefaults = {
    color: "transparent",
};

const ReportsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, ReportsPageDefaults, mainView);

    mainView.setKey(ReportsPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";

    const CARD_COLOR = "#1A1A19"; // Same with ChartBox dark theme background
    const CARD_BORDER_COLOR = White(0.1);
    const FIELD_COLOR = "#232322";
    const PRIMARY_COLOR = "#3D7A6B";
    const ACCENT_COLOR = "#65A293";
    const PREVIOUS_COLOR = "#898781";
    const GOOD_COLOR = ACCENT_COLOR;
    const BAD_COLOR = "#E66767";
    // One color for each category (same order with CATEGORIES)
    const CATEGORY_COLORS = [ACCENT_COLOR, "#3987E5", "#C98500", "#D55181", "#9085E9"];

    const CATEGORIES = ReportsPage.CATEGORIES;
    const REGIONS = ReportsPage.REGIONS;
    const HIGH_REFUND_RATE = 8; // %: Shown in red in the table

    const GROUPS = [
        { id: "day", label: "Day" },
        { id: "week", label: "Week" },
        { id: "month", label: "Month" },
    ];

    const QUICK_RANGES = [
        { text: "7 Days", days: 7, group: "day" },
        { text: "30 Days", days: 30, group: "day" },
        { text: "90 Days", days: 90, group: "week" },
        { text: "This Year", days: 0, group: "month" }, // 0: From January 1
    ];

    const DEFAULT_RANGE_INDEX = 1;

    const today = ReportsPage.startOfDay(new Date());
    // WHY: The previous period of the oldest selectable date must have data too.
    const minSelectableDate = ReportsPage.addDays(today, -365);

    // Current filter
    const filter = {
        from: null,
        to: null,
        regionIndex: -1, // -1: All regions
        group: "day",
        compare: 1,
    };

    let isReady = 0;
    let reportTimer = null;
    let queryTimer = null;

    // Components
    let quickTabs, fromDate, toDate, regionSelect, groupSelect, compareCheckBox;
    let exportMenu;
    let lblSubtitle, lblTableInfo;
    let kpiBoxList = [];
    let chartRevenue, chartRegion, chartCategory, chartRefund;
    let smartTable;

    // *** PRIVATE FUNCTIONS:

    const compactNumber = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

    const formatMoneyShort = function(value) {
        return "$" + compactNumber.format(value);
    };

    const formatMoney = function(value, digits = 0) {
        return "$" + value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
    };

    const formatDate = function(date) {
        return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); // 16 Sep 2026
    };

    // "Revenue ▲ 12.4%" (higherIsBetter: 0 for refund rate)
    const getChangeText = function(current, previous, higherIsBetter = 1) {
        if (!previous) return "";
        const change = (current - previous) / previous * 100;
        const isUp = change >= 0;
        const color = (isUp == (higherIsBetter == 1)) ? GOOD_COLOR : BAD_COLOR;
        return " <span style='color:" + color + "'>" + ((isUp) ? "▲ " : "▼ ") + Math.abs(change).toFixed(1) + "%</span>";
    };

    // *** REPORT (DATA):

    // Period of a day: { key, label }. Keys are sortable texts.
    const getPeriod = function(date, group) {

        if (group == "week") {
            // WHY: Weeks start on Monday.
            const monday = ReportsPage.addDays(date, -((date.getDay() + 6) % 7));
            return { key: ReportsPage.toISODate(monday), label: monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
        }

        if (group == "month") {
            return { key: ReportsPage.toISODate(date).slice(0, 7), label: date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }) };
        }

        return { key: ReportsPage.toISODate(date), label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };

    };

    // Sums the records of a date range. (Region filter is used, except byRegion.)
    const buildReport = function(from, to, regionIndex, group) {

        const report = {
            periods: [], // [{ key, label }]
            total: { orders: 0, revenue: 0, refunds: 0 },
            series: { orders: [], revenue: [], refunds: [] }, // One value for each period
            categories: CATEGORIES.map(function() { return { orders: [], total: { orders: 0, revenue: 0, refunds: 0 } }; }),
            byRegion: REGIONS.map(function() { return 0; }), // Revenue of each region (all regions)
            rows: [], // Table rows: one for each period and category
        };

        // Periods of the range (also the periods without data)
        const periodIndexByTime = new Map();
        for (let date = new Date(from); date <= to; date = ReportsPage.addDays(date, 1)) {
            const period = getPeriod(date, group);
            const last = report.periods[report.periods.length - 1];
            if (!last || last.key != period.key) report.periods.push(period);
            periodIndexByTime.set(date.getTime(), report.periods.length - 1);
        }

        const periodCount = report.periods.length;
        ["orders", "revenue", "refunds"].forEach(function(key) {
            report.series[key] = new Array(periodCount).fill(0);
        });

        // [periodIndex][categoryIndex] -> { orders, revenue, refunds }
        const cells = report.periods.map(function() {
            return CATEGORIES.map(function() { return { orders: 0, revenue: 0, refunds: 0 }; });
        });

        ReportsPage.getTestData().forEach(function(record) {

            const periodIndex = periodIndexByTime.get(record.time);
            if (periodIndex === undefined) return; // Out of the range

            report.byRegion[record.region] += record.revenue;
            if (regionIndex >= 0 && record.region != regionIndex) return;

            const cell = cells[periodIndex][record.category];
            const category = report.categories[record.category];

            ["orders", "revenue", "refunds"].forEach(function(key) {
                cell[key] += record[key];
                category.total[key] += record[key];
                report.total[key] += record[key];
                report.series[key][periodIndex] += record[key];
            });

        });

        report.categories.forEach(function(category, categoryIndex) {
            category.orders = cells.map(function(periodCells) { return periodCells[categoryIndex].orders; });
        });

        cells.forEach(function(periodCells, periodIndex) {
            periodCells.forEach(function(cell, categoryIndex) {
                report.rows.push({
                    period: report.periods[periodIndex].key,
                    category: CATEGORIES[categoryIndex].name,
                    orders: cell.orders,
                    revenue: Math.round(cell.revenue * 100) / 100,
                    avgOrder: (cell.orders) ? Math.round(cell.revenue / cell.orders * 100) / 100 : 0,
                    refunds: cell.refunds,
                    refundRate: (cell.orders) ? Math.round(cell.refunds / cell.orders * 1000) / 10 : 0,
                });
            });
        });

        return report;

    };

    // Current and previous period reports
    const runReport = function() {

        const days = Math.round((filter.to - filter.from) / 86400000) + 1;
        const previousTo = ReportsPage.addDays(filter.from, -1);
        const previousFrom = ReportsPage.addDays(filter.from, -days);

        const current = buildReport(filter.from, filter.to, filter.regionIndex, filter.group);
        const previous = buildReport(previousFrom, previousTo, filter.regionIndex, filter.group);

        renderReport(current, previous, previousFrom, previousTo);

    };

    // Waits for more filter changes, then runs the report. (Test: shows the waiting like a server query.)
    const scheduleReport = function() {

        if (!isReady) return;

        reportTimer = waitAndRun(reportTimer, function() {

            if (!box) return;

            if (typeof waiting !== "undefined") waiting.show();

            clearTimeout(queryTimer);
            queryTimer = setTimeout(function() {
                if (!box) return;
                runReport();
                if (typeof waiting !== "undefined") waiting.hide();
            }, 300);

        }, 50);

    };

    // *** RENDER:

    const renderReport = function(report, previous, previousFrom, previousTo) {

        const regionText = (filter.regionIndex < 0) ? "All regions" : REGIONS[filter.regionIndex].name;
        const groupText = GROUPS.find(function(g) { return g.id == filter.group; }).label;
        lblSubtitle.text = formatDate(filter.from) + " – " + formatDate(filter.to) + " · " + regionText + " · by " + groupText.toLowerCase();

        // SUMMARY
        const t = report.total;
        const p = previous.total;
        const aov = (t.orders) ? t.revenue / t.orders : 0;
        const previousAov = (p.orders) ? p.revenue / p.orders : 0;
        const refundRate = (t.orders) ? t.refunds / t.orders * 100 : 0;
        const previousRefundRate = (p.orders) ? p.refunds / p.orders * 100 : 0;

        const kpiTexts = [
            { title: "Revenue" + getChangeText(t.revenue, p.revenue), value: formatMoneyShort(t.revenue) },
            { title: "Orders" + getChangeText(t.orders, p.orders), value: t.orders.toLocaleString("en-US") },
            { title: "Avg. Order Value" + getChangeText(aov, previousAov), value: formatMoney(aov, 2) },
            { title: "Refund Rate" + getChangeText(refundRate, previousRefundRate, 0), value: refundRate.toFixed(1) + "%" },
        ];

        const kpiSeries = [
            report.series.revenue,
            report.series.orders,
            report.series.revenue.map(function(revenue, i) { return (report.series.orders[i]) ? revenue / report.series.orders[i] : 0; }),
            report.series.refunds.map(function(refunds, i) { return (report.series.orders[i]) ? refunds / report.series.orders[i] * 100 : 0; }),
        ];

        kpiBoxList.forEach(function(kpiBox, i) {
            kpiBox.setTitle(kpiTexts[i].title);
            kpiBox.setValueText(kpiTexts[i].value);
            kpiBox.setValues(kpiSeries[i]);
        });

        // REVENUE: Current and previous period
        // WHY: Datasets are not created again. So they keep their colors and options.
        const labels = report.periods.map(function(period) { return period.label; });
        const previousRevenue = labels.map(function(label, i) { return previous.series.revenue[i] ?? null; });

        chartRevenue.data.labels = labels;
        chartRevenue.data.datasets[0].data = report.series.revenue.map(Math.round);
        chartRevenue.data.datasets[1].data = previousRevenue.map(function(value) { return (value === null) ? null : Math.round(value); });
        chartRevenue.data.datasets[1].label = "Previous (" + formatDate(previousFrom) + " – " + formatDate(previousTo) + ")";
        chartRevenue.data.datasets[1].hidden = !filter.compare;
        if (chartRevenue.chart) chartRevenue.chart.setDatasetVisibility(1, filter.compare == 1); // WHY: After a legend click, Chart.js does not read dataset.hidden.
        chartRevenue.update();

        // REGIONS
        chartRegion.data.datasets[0].data = report.byRegion.map(Math.round);
        chartRegion.update();

        // ORDERS BY CATEGORY
        chartCategory.data.labels = labels;
        report.categories.forEach(function(category, i) {
            chartCategory.data.datasets[i].data = category.orders;
        });
        chartCategory.update();

        // REFUND RATES
        chartRefund.data.datasets[0].data = report.categories.map(function(category) {
            const c = category.total;
            return (c.orders) ? Math.round(c.refunds / c.orders * 1000) / 10 : 0;
        });
        chartRefund.update();

        // TABLE
        smartTable.setItemDataList(report.rows);
        lblTableInfo.text = report.rows.length.toLocaleString("en-US") + " rows (" + report.periods.length + " periods x " + CATEGORIES.length + " categories). Click a column title to sort.";

    };

    const setDateRange = function(from, to) {

        filter.from = from;
        filter.to = to;

        // WHY: setDate() does not accept a date out of min/max. Open the limits first.
        fromDate.setMaxDate(today);
        toDate.setMinDate(minSelectableDate);
        fromDate.setDate(from, 1);
        toDate.setDate(to, 1);
        fromDate.setMaxDate(to);
        toDate.setMinDate(from);

    };

    const selectQuickRange = function(index) {

        const range = QUICK_RANGES[index];
        const from = (range.days) ? ReportsPage.addDays(today, -(range.days - 1)) : new Date(today.getFullYear(), 0, 1);

        setDateRange(from, today);

        // Group select calls scheduleReport() with onSelect.
        filter.group = range.group;
        groupSelect.setSelectedIndex(GROUPS.findIndex(function(g) { return g.id == range.group; }));

        scheduleReport();

    };

    // Dates are changed by hand: no quick range is selected.
    const clearQuickRange = function() {
        const index = quickTabs.selectedIndex;
        if (index < 0) return;
        quickTabs.tabItemList[index].clickable = 1;
        quickTabs.selectedIndex = -1;
        quickTabs.selectedLabelBack.opacity = 0;
    };

    const downloadTableAsCSV = function() {

        const lines = ["period,category,orders,revenue,avg_order,refunds,refund_rate"];
        smartTable.visibleItemDataList.forEach(function(row) {
            lines.push([row.period, row.category, row.orders, row.revenue, row.avgOrder, row.refunds, row.refundRate].join(","));
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "sales-report-" + ReportsPage.toISODate(filter.from) + "_" + ReportsPage.toISODate(filter.to) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    // *** VIEW HELPERS:

    // GROUP: Cards side by side (wraps on small screens)
    const startRow = function() {
        HGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 16,
        });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.alignItems = "stretch"; // WHY: Cards in the same row have the same height.
    };

    // flex: "1 1 320px" (grow, shrink, min width before wrap)
    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    const startCard = function(title, subtitle, flex) {

        const card = VGroup({
            height: "auto",
            align: "left top",
            gap: 14,
            padding: 16,
            color: CARD_COLOR,
            border: 1,
            borderColor: CARD_BORDER_COLOR,
            round: 12,
        });
        setFlex(card, flex);

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });

                Label({
                    text: title,
                    fontSize: 16,
                    textColor: White(0.95),
                });
                that.elem.style.fontFamily = "opensans-bold";

                card.lblSubtitle = Label({
                    text: subtitle,
                    fontSize: 12,
                    textColor: White(0.45),
                });

            endGroup();

        return card;

    };

    const endCard = function() {
        endGroup();
    };

    const createChartBox = function(flex, params) {

        const chart = ChartBox({
            theme: "dark",
            style: {
                box: { color: CARD_COLOR, borderColor: CARD_BORDER_COLOR, round: 12, padding: 16 },
                chart: { colors: CATEGORY_COLORS },
            },
            ...params,
        });
        setFlex(chart, flex);
        // WHY: The chart gets the row height, if a card in the same row is taller.
        chart.elem.style.height = "auto";
        chart.elem.style.minHeight = params.height + "px";

        return chart;

    };

    // GROUP: Small title and a field
    const startField = function(title) {
        VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
        Label({ text: title.toUpperCase(), fontSize: 11, textColor: White(0.45) });
        that.elem.style.letterSpacing = "1px";
    };

    const endField = function() {
        endGroup();
    };

    // Dark style for SelectDate
    const DATE_STYLE = {
        field: { color: FIELD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
        fieldHover: { borderColor: White(0.3) },
        fieldFocus: { borderColor: ACCENT_COLOR },
        fieldText: { fontSize: 14, textColor: White(0.9) },
        placeholder: { textColor: White(0.4) },
        icon: { color: White(0.55) },
        panel: { color: FIELD_COLOR, borderColor: White(0.12), shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
        title: { textColor: White(0.9) },
        arrow: { color: White(0.6), hoverColor: White(0.08) },
        weekDay: { textColor: White(0.45) },
        day: { textColor: White(0.85), hoverColor: White(0.08) },
        today: { borderColor: White(0.35) },
        selectedDay: { color: PRIMARY_COLOR, textColor: White(1) },
        disabledDay: { textColor: White(0.2) },
        footerButton: { textColor: ACCENT_COLOR },
    };

    const createTinySelect = function(list, onSelect) {

        const select = TinySelect({
            list: list,
            height: 40,
            fontSize: 14,
            color: FIELD_COLOR,
            border: 1,
            borderColor: CARD_BORDER_COLOR,
            round: 8,
            labelBoldFont: 0,
            labelTextColor: White(0.9),
            arrowIcon: LIB_PATH + "comp-m2/tiny-select/arrow.svg",
            arrowSize: 18,
            invertIconColor: 1,
            listFontSize: 14,
            listTextColor: White(0.85),
            listOverTextColor: ACCENT_COLOR,
            listBackgroundColor: FIELD_COLOR,
            listBorderColor: White(0.15),
            onSelect: onSelect,
        });

        return select;

    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearTimeout(reportTimer);
        clearTimeout(queryTimer);
        if (typeof waiting !== "undefined") waiting.hide();

        // WHY: Chart.js instances keep resize listeners. They must be destroyed.
        [chartRevenue, chartRegion, chartCategory, chartRefund].forEach(function(chart) {
            if (chart) chart.destroy();
        });

        // WHY: These components have objects or events on the page. box.remove() does not remove them.
        if (smartTable) smartTable.destroy();
        if (exportMenu) exportMenu.destroy();
        if (fromDate) fromDate.destroy();
        if (toDate) toDate.destroy();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({
                    text: "Sales Report",
                    fontSize: 26,
                    textColor: White(0.95),
                });
                that.elem.style.fontFamily = "opensans-bold";

                lblSubtitle = Label({
                    text: "",
                    fontSize: 14,
                    textColor: White(0.5),
                });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "right center", gap: 10 });

                const btnExport = ButtonWithIcon({
                    labelText: "Export",
                    iconFile: ASSETS + "arrow_down.png",
                    style: {
                        layout: { gap: 10, padding: [14, 8] },
                        icon: { width: 20, height: 20 },
                        label: { fontSize: 14, textColor: White(0.95) },
                        box: { color: PRIMARY_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                        hover: { color: "#468A79" },
                        active: { color: "#2C5A38" },
                    },
                });
                btnExport.icon.elem.style.filter = "invert(100%)"; // WHY: Panel icons are black.

                // MENU: Export
                exportMenu = ContextMenu({
                    items: [
                        { text: "Table as CSV", key: "csv" },
                        "-",
                        { text: "Revenue chart (PNG)", key: "revenue" },
                        { text: "Orders chart (PNG)", key: "orders" },
                        { text: "Refund chart (PNG)", key: "refund" },
                    ],
                    onClick: function(self, item) {
                        const dates = ReportsPage.toISODate(filter.from) + "_" + ReportsPage.toISODate(filter.to);
                        switch (item.key) {
                            case "csv": downloadTableAsCSV(); break;
                            case "revenue": chartRevenue.download("revenue-" + dates + ".png"); break;
                            case "orders": chartCategory.download("orders-by-category-" + dates + ".png"); break;
                            case "refund": chartRefund.download("refund-rates-" + dates + ".png"); break;
                        }
                    },
                    style: {
                        menu: { color: FIELD_COLOR, borderColor: White(0.12), shadow: "0px 8px 24px rgba(0, 0, 0, 0.5)" },
                        item: { textColor: White(0.85) },
                        itemHover: { textColor: White(1), color: White(0.08) },
                        separator: { color: White(0.1) },
                    },
                });
                exportMenu.attachTo(btnExport, "click");

            endGroup();

        endGroup();

    };

    const initFilterBar = function() {

        const card = VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            padding: 16,
            color: CARD_COLOR,
            border: 1,
            borderColor: CARD_BORDER_COLOR,
            round: 12,
        });

            HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 16 });
            that.elem.style.flexWrap = "wrap";

                startField("Range");

                    quickTabs = TextTabs({
                        tabHeight: 40, // The same height as the buttons / inputs next to it
                        tabList: QUICK_RANGES.map(function(range) { return range.text; }),
                        onClick: function(self) {
                            selectQuickRange(self.index);
                        },
                        backgroundStyle: {
                            colorBottom: FIELD_COLOR,
                            colorTop: FIELD_COLOR,
                            round: 8,
                            border: 1,
                            borderColor: CARD_BORDER_COLOR,
                        },
                        tabPadding: [3, 3],
                        labelStyle: {
                            fontSize: 14,
                            textColor: White(0.85),
                            padding: [12, 6],
                        },
                        selectedStyle: {
                            color: PRIMARY_COLOR,
                            round: 6,
                        },
                    });

                endField();

                startField("From");

                    fromDate = SelectDate({
                        width: 150,
                        height: 40,
                        format: "DD MMM YYYY",
                        minDate: minSelectableDate,
                        maxDate: today,
                        showClearButton: 0,
                        style: DATE_STYLE,
                        onChange: function(self) {
                            if (!self.date) return;
                            filter.from = self.date;
                            toDate.setMinDate(self.date);
                            clearQuickRange();
                            scheduleReport();
                        },
                    });

                endField();

                startField("To");

                    toDate = SelectDate({
                        width: 150,
                        height: 40,
                        format: "DD MMM YYYY",
                        minDate: minSelectableDate,
                        maxDate: today,
                        showClearButton: 0,
                        style: DATE_STYLE,
                        onChange: function(self) {
                            if (!self.date) return;
                            filter.to = self.date;
                            fromDate.setMaxDate(self.date);
                            clearQuickRange();
                            scheduleReport();
                        },
                    });

                endField();

                startField("Region");

                    regionSelect = createTinySelect(
                        [{ id: "-1", label: "All regions" }].concat(REGIONS.map(function(region, i) { return { id: String(i), label: region.name }; })),
                        function(index, id) {
                            filter.regionIndex = Number(id);
                            scheduleReport();
                        }
                    );

                endField();

                startField("Group by");

                    groupSelect = createTinySelect(
                        GROUPS.map(function(group) { return { id: group.id, label: group.label }; }),
                        function(index, id) {
                            filter.group = id;
                            scheduleReport();
                        }
                    );

                endField();

                // Compare
                HGroup({ width: "auto", height: 40, align: "left center" });

                    compareCheckBox = CheckBox({
                        labelText: "Compare with the previous period",
                        checked: filter.compare,
                        style: {
                            mark: { width: 20, height: 20, color: "transparent", borderColor: White(0.35) },
                            checkedMark: { color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
                            hoverMark: { borderColor: White(0.7) },
                            tick: { color: White(1) },
                            label: { fontSize: 14, textColor: White(0.9) },
                        },
                        onChange: function(self) {
                            filter.compare = self.checked;
                            scheduleReport();
                        },
                    });

                endGroup();

            endGroup();

        endGroup();

        return card;

    };

    const initKpiRow = function() {

        const KPI_LIST = [
            { title: "Revenue", barColor: ACCENT_COLOR },
            { title: "Orders", barColor: "#3987E5" },
            { title: "Avg. Order Value", barColor: "#C98500" },
            { title: "Refund Rate", barColor: "#D55181" },
        ];

        startRow();

            KPI_LIST.forEach(function(kpi) {

                const kpiBox = MiniGraphBox({
                    height: 100,
                    title: kpi.title,
                    valueText: "",
                    iconFile: "",
                    barColor: kpi.barColor,
                    style: {
                        box: { color: CARD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 12 },
                        text: { padding: 14 },
                        title: { fontSize: 13, textColor: White(0.5) },
                        valueText: { fontSize: 24, textColor: White(0.95) },
                        bars: { height: 34, barWidth: 4, gap: 2, padding: 14, round: 2 },
                    },
                });
                setFlex(kpiBox, "1 1 220px");

                kpiBoxList.push(kpiBox);

            });

        endGroup();

        // WHY: Bar count was calculated with the default width (before flex). setValues() keeps only the values that fit.
        kpiBoxList.forEach(function(kpiBox) { kpiBox.refresh(); });

    };

    const initChartRows = function() {

        startRow();

            // LINE: Revenue (current and previous period)
            chartRevenue = createChartBox("2 1 520px", {
                height: 340,
                type: "line",
                title: "Revenue",
                subtitle: "Selected period compared with the previous period of the same length",
                labels: [],
                datasets: [
                    {
                        label: "Revenue",
                        data: [],
                        fill: true,
                        tension: 0.3,
                        backgroundColor: ChartBox.gradient("rgba(101, 162, 147, 0.3)", "rgba(101, 162, 147, 0)"),
                    },
                    {
                        label: "Previous",
                        data: [],
                        tension: 0.3,
                        borderDash: [5, 5],
                        borderColor: PREVIOUS_COLOR,
                        pointBackgroundColor: PREVIOUS_COLOR,
                    },
                ],
                legend: "top",
                formatValue: formatMoneyShort,
                options: {
                    elements: { point: { radius: 0 } },
                    scales: { x: { ticks: { maxTicksLimit: 10 } } },
                    // WHY: "Previous" is not shown in the legend when compare is off. (Other items can still be hidden with a click.)
                    plugins: { legend: { labels: { filter: function(item) { return !(item.datasetIndex == 1 && !filter.compare); } } } },
                },
            });

            // DOUGHNUT: Regions
            chartRegion = createChartBox("1 1 320px", {
                height: 340,
                type: "doughnut",
                title: "Revenue by Region",
                subtitle: "All regions in the date range",
                legend: "bottom",
                labels: REGIONS.map(function(region) { return region.name; }),
                values: REGIONS.map(function() { return 0; }),
                formatValue: formatMoneyShort,
                options: {
                    cutout: "68%",
                },
                onClick: function(self, item) {
                    // Filter the report by the clicked region.
                    regionSelect.setSelectedIndex(item.index + 1);
                },
            });

        endGroup();

        startRow();

            // BAR: Orders by category (stacked)
            chartCategory = createChartBox("2 1 520px", {
                height: 340,
                type: "bar",
                stacked: 1,
                title: "Orders by Category",
                subtitle: "Number of orders in each period",
                legend: "top",
                labels: [],
                datasets: CATEGORIES.map(function(category) { return { label: category.name, data: [] }; }),
                options: {
                    datasets: { bar: { maxBarThickness: 36 } },
                    scales: { x: { ticks: { maxTicksLimit: 12 } } },
                },
            });

            // BAR: Refund rate by category (horizontal)
            chartRefund = createChartBox("1 1 320px", {
                height: 340,
                type: "bar",
                horizontal: 1,
                title: "Refund Rate",
                subtitle: "Refunds / orders, by category",
                labels: CATEGORIES.map(function(category) { return category.name; }),
                datasets: [{
                    label: "Refund rate",
                    data: [],
                    backgroundColor: CATEGORY_COLORS, // Same colors with "Orders by Category"
                    hoverBackgroundColor: CATEGORY_COLORS,
                }],
                formatValue: function(value) { return value + "%"; },
            });

        endGroup();

    };

    const initTable = function() {

        const titleDataList = [
            { name: "PERIOD", dataTitle: "period", dataType: "string", width: 130, shortable: 1 },
            { name: "CATEGORY", dataTitle: "category", dataType: "string", width: 150, shortable: 1 },
            { name: "ORDERS", dataTitle: "orders", dataType: "integer", width: 110, shortable: 1 },
            { name: "REVENUE", dataTitle: "revenue", dataType: "float", width: 140, shortable: 1 },
            { name: "AVG. ORDER", dataTitle: "avgOrder", dataType: "float", width: 130, shortable: 1 },
            { name: "REFUNDS", dataTitle: "refunds", dataType: "integer", width: 110, shortable: 1 },
            { name: "REFUND RATE", dataTitle: "refundRate", dataType: "float", width: 140, shortable: 1 },
        ];

        const card = startCard("Report Details", "", "1 1 100%");
        lblTableInfo = card.lblSubtitle;

            HGroup({ width: "100%", height: 520, align: "left top" });

                smartTable = SmartTable({
                    titleDataList: titleDataList,
                    itemDataList: [],
                    titleHeight: 44,
                    itemHeight: 40,
                    infoHeight: 56,
                    itemLineCount: 10,
                    sortByTitleIndex: 0,
                    sortDirection: "Z-A", // Newest period first
                    // WHY: SmartTable writes the raw value (numbers sort right). Money and percent texts are written here.
                    updateCustomItemCell: function(cell, titleDataIndex, data) {
                        switch (titleDataList[titleDataIndex].dataTitle) {
                            case "orders":
                            case "refunds":
                                cell.label.text = (data === "") ? "" : data.toLocaleString("en-US");
                                break;
                            case "revenue":
                            case "avgOrder":
                                cell.label.text = (data === "") ? "" : formatMoney(data, 2);
                                break;
                            case "refundRate":
                                cell.label.text = (data === "") ? "" : data.toFixed(1) + "%";
                                cell.label.textColor = (data > HIGH_REFUND_RATE) ? BAD_COLOR : "rgba(255, 255, 255, 0.75)";
                                break;
                        }
                    },
                    scrollBarParams: {
                        bar_border: 0,
                        bar_round: 3,
                        bar_borderColor: "rgba(255, 255, 255, 0.15)",
                        bar_width: 4,
                        bar_mouseOverWidth: 4,
                        bar_mouseOverColor: "#A0A0A0",
                        bar_opacity: 0.4,
                        bar_mouseOverOpacity: 0.9,
                        bar_padding: 2,
                        bar_color: "#A0A0A0",
                        neverHide: 0,
                        showDots: 0,
                    },
                    searchInputParams: {
                        width: "50%",
                        height: 36,
                        border: 0,
                        round: 8,
                        color: FIELD_COLOR,
                        textColor: "#EBEBEB",
                        searchIconSize: 16,
                        placeholderText: "Filter (Ex: Books, 2026-09)",
                        fontSize: 14,
                        invertIconColor: 1,
                        searchIconFile: LIB_PATH + "comp-m2/search-input-v2/filter.png",
                        clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    },
                    style: {
                        width: "100%",
                        height: "100%",
                        round: 8,
                        line1Color: CARD_COLOR,
                        line2Color: "#202020",
                        highlightItemCellColor: "#2A3A36",
                        highlightTitleCellColor: White(0.08),
                        verticalScrollWidth: 20,
                        verticalScrollMargin: 2,
                        btnScrollDownIconFile: LIB_PATH + "comp-m3/smart-table/down.png",
                        btnScrollUpIconFile: LIB_PATH + "comp-m3/smart-table/up.png",
                        btnScrollCenterIconFile: LIB_PATH + "comp-m3/smart-table/scroll.png",
                        sortIconFile: LIB_PATH + "comp-m3/smart-table/sort.png",
                        loadingIconFile: LIB_PATH + "comp-m3/smart-table/clock.png",
                        invertIconColor: 1,

                        box: { color: CARD_COLOR },
                        boxBorder: { border: 1, borderColor: CARD_BORDER_COLOR },
                        boxTitleLine: { color: FIELD_COLOR },
                        boxTitleCell: { padding: [10, 0], borderRight: "1px solid rgba(255, 255, 255, 0.06)", borderBottom: "1px solid rgba(255, 255, 255, 0.12)" },
                        lblTitleCell: { fontSize: 13, fontFamily: "opensans", textColor: White(0.6) },
                        boxItemCell: { borderBottom: "1px solid rgba(255, 255, 255, 0.05)", borderRight: "1px solid rgba(255, 255, 255, 0.03)", padding: [10, 0] },
                        lblItemCell: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.75)", fontFamily: "opensans" },
                        boxInfoLine: { color: FIELD_COLOR, borderTop: "1px solid rgba(255, 255, 255, 0.08)" },
                        lblBoxInfoLine: { fontSize: 14, textColor: White(0.7) },
                        lblNoDataFound: { color: "#2C2C2A", textColor: White(0.6), padding: [8, 2], fontSize: 13, round: 8, border: 1, borderColor: White(0.15) },
                        btnScrollCenter: { color: "#2C2C2A", round: 100, borderColor: White(0.2), border: 1 },
                        btnScrollUp: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
                        btnScrollDown: { color: "#3A3A38", round: 100, border: 1, borderColor: White(0.3) },
                        boxSort: { color: PRIMARY_COLOR },
                    },
                });

            endGroup();

        endCard();

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
            initFilterBar();
            initKpiRow();
            initChartRows();

            startRow();
                initTable();
            endGroup();

        endGroup();

    endBox();

    isReady = 1;

    quickTabs.selectByIndex(DEFAULT_RANGE_INDEX);
    selectQuickRange(DEFAULT_RANGE_INDEX);

    return box.endPage();

};

ReportsPage.KEY = "Reports";

// *** TEST DATA:

ReportsPage.CATEGORIES = [
    { name: "Electronics", price: 240, orders: 9, refundRate: 0.06 },
    { name: "Clothing", price: 55, orders: 22, refundRate: 0.11 },
    { name: "Home", price: 85, orders: 11, refundRate: 0.04 },
    { name: "Cosmetics", price: 32, orders: 17, refundRate: 0.03 },
    { name: "Books", price: 18, orders: 13, refundRate: 0.02 },
];

ReportsPage.REGIONS = [
    { name: "Europe", factor: 1 },
    { name: "North America", factor: 1.3 },
    { name: "Asia", factor: 0.9 },
    { name: "Middle East", factor: 0.45 },
];

ReportsPage._testData = null;

// Daily sales of the last 2 years: [{ time, category, region, orders, revenue, refunds }]
// WHY: Created one time and kept. The page is created again every time it is opened.
ReportsPage.getTestData = function() {

    if (ReportsPage._testData) return ReportsPage._testData;

    // Random numbers with a seed: the same data every time. (mulberry32)
    let seed = 20260916;
    const rnd = function() {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const DAY_COUNT = 730;
    const today = ReportsPage.startOfDay(new Date());
    const list = [];

    for (let i = DAY_COUNT; i >= 0; i--) {

        const date = ReportsPage.addDays(today, -i);
        const growth = 1 + (DAY_COUNT - i) / DAY_COUNT * 0.35; // Sales grow in 2 years
        const season = 1 + 0.25 * Math.sin((date.getMonth() + 1) / 12 * Math.PI * 2 - 1.2); // Busy months
        const weekend = (date.getDay() == 0 || date.getDay() == 6) ? 1.3 : 1;

        ReportsPage.CATEGORIES.forEach(function(category, categoryIndex) {
            ReportsPage.REGIONS.forEach(function(region, regionIndex) {

                const orders = Math.round(category.orders * region.factor * growth * season * weekend * (0.6 + rnd() * 0.8));
                const revenue = Math.round(orders * category.price * (0.85 + rnd() * 0.3) * 100) / 100;
                const refunds = Math.floor(orders * category.refundRate * (0.4 + rnd() * 1.2) + rnd());

                list.push({ time: date.getTime(), category: categoryIndex, region: regionIndex, orders: orders, revenue: revenue, refunds: refunds });

            });
        });

    }

    ReportsPage._testData = list;
    return list;

};

// *** DATE HELPERS:

ReportsPage.startOfDay = function(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// WHY: new Date(y, m, d + days) is safe on daylight saving days. (Adding 24 hours is not.)
ReportsPage.addDays = function(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
};

// Local date: "2026-09-16"
ReportsPage.toISODate = function(date) {
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
};
