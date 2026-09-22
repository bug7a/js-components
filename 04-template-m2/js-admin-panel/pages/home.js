/* Bismillah */

/*

Home Page (Dashboard Template) - v26.09

- A sample dashboard page for the admin panel. All data is test data.
- Replace the DATA functions with your service (Supabase, etc.) calls.

COMPONENTS:
- TextTabs (comp-m2): Period select
- ButtonWithIcon (comp-m3): Header and quick action buttons
- MiniGraphBox / SparkLineBox (comp-m4): KPI boxes (bars for counts, a line for money and live values)
- ChartBox (comp-m4): Line, doughnut and bar charts (Chart.js is loaded from comp-m4/chart-box)
- TinyTable (comp-m2): Recent orders
- LineProgressBar (comp-m3): Monthly goals
- Badge (comp-m2): Notification count

*/

HomePageDefaults = {
    color: "transparent",
};

const HomePage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, HomePageDefaults, mainView);

    mainView.setKey(HomePage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";

    const CARD_COLOR = T.surface; // Same with ChartBox dark theme background
    const CARD_BORDER_COLOR = Ink(0.1);
    const BUTTON_COLOR = T.surface2;
    const PRIMARY_COLOR = T.primary;
    const ACCENT_COLOR = T.accent;
    // WHY: The first chart color follows the panel color. Others are from ChartBox dark theme.
    const CHART_COLORS = [ACCENT_COLOR, T.info, T.warning, "#D55181", "#9085E9", T.danger];

    const STATUS_COLORS = {
        "Paid": ACCENT_COLOR,
        "Pending": T.warning,
        "Refunded": T.danger,
    };

    let liveTimer = null;
    let selectedPeriodIndex = 0;

    // KPI boxes, charts
    let kpiBoxList = [];
    let chartRevenue, chartTraffic, chartCategory;

    // *** TEST DATA:

    const PERIODS = [
        {
            name: "Week",
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            revenue: [5200, 6100, 5800, 7400, 8900, 9600, 7300],
            target: [6000, 6000, 6500, 6500, 7000, 7500, 7500],
            kpiTexts: ["$50.3K", "326", "248", "57"],
        },
        {
            name: "Month",
            labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
            revenue: [42000, 51000, 48500, 61000],
            target: [45000, 47500, 50000, 52500],
            kpiTexts: ["$202.5K", "1,384", "1,120", "231"],
        },
        {
            name: "Year",
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            revenue: [142000, 158000, 151000, 169000, 183000, 194000, 188000, 205000, 212000, 0, 0, 0],
            target: [140000, 150000, 160000, 170000, 180000, 190000, 200000, 210000, 220000, 230000, 240000, 250000],
            kpiTexts: ["$1.6M", "15,920", "4,812", "2,640"],
        },
    ];

    // graphType: "bar" -> MiniGraphBox, "line" -> SparkLineBox.
    // WHY: Bars for things you can count, a line for money and for live values.
    const KPI_LIST = [
        { title: "Revenue", iconFile: "left-menu/reports.png", color: ACCENT_COLOR, graphType: "line", min: 20, max: 60 },
        { title: "Orders", iconFile: "top-bar/bookmark.png", color: T.info, graphType: "bar", min: 10, max: 40 },
        { title: "Active Users", iconFile: "top-bar/user.png", color: T.warning, graphType: "line", min: 180, max: 260 }, // Live
        { title: "New Comments", iconFile: "top-bar/comment.png", color: "#D55181", graphType: "bar", min: 2, max: 20 },
    ];

    const RECENT_ORDERS = [
        ["#10482", "Deniz Arslan", "16 Sep", "$1,240", "Paid"],
        ["#10481", "Frank Weber", "16 Sep", "$89", "Pending"],
        ["#10480", "Nilüfer Çelik", "15 Sep", "$432", "Paid"],
        ["#10479", "Dany Moreau", "15 Sep", "$2,150", "Refunded"],
        ["#10478", "Selin Koç", "14 Sep", "$318", "Paid"],
        ["#10477", "Tarık Yılmaz", "14 Sep", "$76", "Pending"],
    ];

    const GOALS = [
        { title: "Monthly revenue", valueText: "$202.5K / $260K", progress: 78 },
        { title: "New users", valueText: "1,120 / 1,350", progress: 83 },
        { title: "Closed tickets", valueText: "96 / 150", progress: 64 },
    ];

    // *** PRIVATE FUNCTIONS:

    const randomList = function(count, min, max) {
        const list = [];
        for (let i = 0; i < count; i++) list.push(random(min, max));
        return list;
    };

    // T.accent -> "#9A5D6C"
    const invertColor = function(hex) {
        return "#" + (0xFFFFFF ^ parseInt(hex.slice(1), 16)).toString(16).padStart(6, "0");
    };

    const formatMoney = function(value) {
        return "$" + value.toLocaleString("en-US");
    };

    // Opens a page like a left menu click.
    const openPage = function(key, selectMenu = 1) {
        if (selectMenu) leftMenu.setSelectedItem(key);
        openPageByKey(key);
    };

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
        return that;
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
                    textColor: Ink(0.95),
                });
                that.elem.style.fontFamily = "opensans-bold";

                if (subtitle) {
                    Label({
                        text: subtitle,
                        fontSize: 12,
                        textColor: Ink(0.45),
                    });
                }

            endGroup();

        return card;

    };

    const endCard = function() {
        endGroup();
    };

    const createChartBox = function(params) {

        const flex = params.flex;
        delete params.flex; // Not a ChartBox param

        const chart = ChartBox({
            theme: T.chartTheme,
            style: {
                box: { color: CARD_COLOR, borderColor: CARD_BORDER_COLOR, round: 12, padding: 16 },
                chart: { colors: CHART_COLORS },
            },
            ...params,
        });
        setFlex(chart, flex);
        // WHY: The chart gets the row height, if a card in the same row is taller.
        chart.elem.style.height = "auto";
        chart.elem.style.minHeight = params.height + "px";

        return chart;

    };

    // Button style for ButtonWithIcon
    const createButton = function(text, iconFile, onClick, params = {}) {

        const color = params.color || BUTTON_COLOR;

        const btn = ButtonWithIcon({
            width: params.width || "auto",
            labelText: text,
            iconFile: ASSETS + iconFile,
            onClick: onClick,
            style: {
                layout: { gap: 10, padding: [14, 8], align: params.align || "center center" },
                icon: { width: 20, height: 20 },
                label: { fontSize: 14, textColor: Ink(0.9) },
                box: { color: color, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                hover: { color: params.hoverColor || T.surface3 },
                active: { color: params.activeColor || T.surface4 },
            },
        });
        btn.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.

        return btn;

    };

    // *** PUBLIC FUNCTIONS:

    // index: 0 Week, 1 Month, 2 Year
    box.setPeriod = function(index) {

        selectedPeriodIndex = index;
        const period = PERIODS[index];

        // KPI boxes
        kpiBoxList.forEach(function(kpiBox, i) {
            const kpi = KPI_LIST[i];
            kpiBox.setValueText(period.kpiTexts[i]);
            kpiBox.setValues(randomList(60, kpi.min, kpi.max));
        });

        // Revenue chart
        // WHY: Datasets are not created again. So they keep their colors and options.
        chartRevenue.data.labels = period.labels;
        chartRevenue.data.datasets[0].data = period.revenue.map(function(value) { return value || null; }); // null: No data yet
        chartRevenue.data.datasets[1].data = period.target;
        chartRevenue.update();

        chartRevenue.setSubtitle("Actual vs. target, this " + period.name.toLowerCase());

    };

    box.destroy = function() {

        clearInterval(liveTimer);

        // WHY: ChartBox keeps a Chart.js instance with resize listeners. remove() cleans it.
        [chartRevenue, chartTraffic, chartCategory].forEach(function(chart) {
            if (chart) chart.remove();
        });

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 16,
        });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            // Title
            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({
                    text: "Dashboard",
                    fontSize: 26,
                    textColor: Ink(0.95),
                });
                that.elem.style.fontFamily = "opensans-bold";

                Label({
                    text: new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
                    fontSize: 14,
                    textColor: Ink(0.5),
                });

            endGroup();

            // Period and buttons
            HGroup({ width: "auto", height: "auto", align: "right center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                box.periodTabs = TextTabs({
                    tabHeight: 38, // The same height as the buttons / inputs next to it
                    tabList: PERIODS.map(function(period) { return period.name; }),
                    onClick: function(self) {
                        box.setPeriod(self.index);
                    },
                    backgroundStyle: {
                        colorBottom: CARD_COLOR,
                        colorTop: CARD_COLOR,
                        round: 8,
                        border: 1,
                        borderColor: CARD_BORDER_COLOR,
                    },
                    labelStyle: {
                        fontSize: 14,
                        textColor: Ink(0.85),
                        padding: [14, 5],
                    },
                    selectedStyle: {
                        color: PRIMARY_COLOR,
                        round: 6,
                    },
                });

                box.btnExport = createButton("Export Chart", "top-bar/bookmark.png", function() {
                    chartRevenue.download("revenue-" + PERIODS[selectedPeriodIndex].name.toLowerCase() + ".png");
                });

                box.btnInviteUser = createButton("Invite User", "top-bar/add.png", function() {
                    // WHY: The same action as the "Invite User" item of the top bar: the user list
                    //      is opened with the invite panel, not just the page.
                    if (rightView.isShown()) {
                        rightView.hide();
                        rightView.clean();
                    }
                    leftMenu.setSelectedItem(UserListPage.KEY);
                    UserListPage({ openUserId: "invite" });
                }, { color: PRIMARY_COLOR, hoverColor: T.primaryHover, activeColor: T.primaryActive });

            endGroup();

        endGroup();

    };

    // Creates the KPI box of one item: bars (MiniGraphBox) or a line (SparkLineBox).
    // NOTE: Both components have the same API (setValues, setValueText, setTitle, refresh, .icon).
    const createKpiBox = function(kpi) {

        const params = {
            height: 100,
            title: kpi.title,
            valueText: "",
            iconFile: ASSETS + kpi.iconFile,
            style: {
                box: { color: CARD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 12 },
                text: { padding: 14 },
                title: { fontSize: 13, textColor: Ink(0.5) },
                valueText: { fontSize: 24, textColor: Ink(0.95) },
                icon: { width: 20, height: 20 },
                trend: { flatColor: Ink(0.45) }, // WHY: The default flat color is made for light cards.
            },
        };

        if (kpi.graphType == "bar") {
            params.barColor = kpi.color;
            params.style.bars = { height: 34, barWidth: 4, gap: 2, padding: 14, round: 2 };
            return MiniGraphBox(params);
        }

        params.lineColor = kpi.color;
        params.style.graph = { height: 34, padding: 14 };
        return SparkLineBox(params);

    };

    const initKpiRow = function() {

        startRow();

            KPI_LIST.forEach(function(kpi) {

                const kpiBox = createKpiBox(kpi);
                setFlex(kpiBox, "1 1 220px");
                kpiBox.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.
                kpiBox.icon.opacity = 0.5;

                kpiBoxList.push(kpiBox);

            });

        endGroup();

        // WHY: Bar count was calculated with the default width (before flex). setValues() keeps only the values that fit.
        kpiBoxList.forEach(function(kpiBox) { kpiBox.refresh(); });

    };

    const initChartRow = function() {

        startRow();

            // LINE: Revenue (data comes from setPeriod)
            chartRevenue = createChartBox({
                flex: "2 1 520px",
                height: 340,
                type: "line",
                title: "Revenue",
                subtitle: " ",
                labels: [],
                datasets: [
                    {
                        label: "Actual",
                        data: [],
                        fill: true,
                        tension: 0.4,
                        spanGaps: false,
                        backgroundColor: ChartBox.gradient("rgba(101, 162, 147, 0.35)", "rgba(101, 162, 147, 0)"),
                    },
                    {
                        label: "Target",
                        data: [],
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.4,
                    },
                ],
                formatValue: formatMoney,
            });

            // DOUGHNUT: Traffic sources
            chartTraffic = createChartBox({
                flex: "1 1 320px",
                height: 340,
                type: "doughnut",
                title: "Traffic Sources",
                subtitle: "How users come to the site",
                legend: "bottom",
                labels: ["Organic Search", "Social Media", "Direct", "E-Mail", "Referral"],
                values: [42, 28, 15, 10, 5],
                formatValue: function(value) { return value + "%"; },
                options: {
                    cutout: "70%",
                },
            });

        endGroup();

    };

    const initTableRow = function() {

        startRow();

            // TABLE: Recent orders
            startCard("Recent Orders", "Last 6 orders", "2 1 520px");

                // GROUP: Horizontal scroll for small widths
                HGroup({ width: "100%", height: "auto", align: "left top" });
                that.elem.style.overflowX = "auto";

                    const table = TinyTable({
                        columnHeaders: ["ORDER", "CUSTOMER", "DATE", "AMOUNT", "STATUS"],
                        columnWidths: ["16%", "29%", "18%", "18%", "18%"], // 99%: 1px gaps between cells
                        dataRows: RECENT_ORDERS,
                        headerBackgroundColor: T.surface2,
                        headerTextColor: Ink(0.6),
                        headerBorderColor: T.surface2,
                        headerFontSize: 12,
                        borderWidth: 1,
                        borderRadius: 8,
                        borderColor: CARD_BORDER_COLOR,
                        bodyBackgroundColor: CARD_COLOR,
                        cellFontSize: 14,
                        cellTextColor: Ink(0.8),
                        rowHoverBackgroundColor: Ink(0.05),
                        rowHoverBorderColor: Ink(0.1),
                        onCellRender: function(cell) {

                            // AMOUNT
                            if (cell.index == 3) {
                                cell.elem.style.fontFamily = "opensans-bold";
                            }

                            // STATUS
                            if (cell.index == 4) {
                                cell.textColor = STATUS_COLORS[cell.text] || Ink(0.8);
                            }

                        },
                    });
                    // Fill the card. (Scrolls under the min width.)
                    table.width = "100%";
                    table.elem.style.minWidth = "560px";

                endGroup();

            endCard();

            // PROGRESS: Monthly goals
            startCard("Monthly Goals", "September 2026", "1 1 320px");

                GOALS.forEach(function(goal) {

                    VGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });

                        HGroup({ width: "100%", height: "auto", align: "left center" });
                        that.elem.style.justifyContent = "space-between";

                            Label({
                                text: goal.title,
                                fontSize: 14,
                                textColor: Ink(0.85),
                            });

                            Label({
                                text: goal.valueText + " <b>(" + goal.progress + "%)</b>",
                                fontSize: 12,
                                textColor: Ink(0.5),
                            });

                        endGroup();

                        const progressBar = LineProgressBar({
                            width: 280,
                            height: 18,
                            progress: goal.progress,
                            // WHY: LineProgressBar is made for light backgrounds (the current line is black).
                            // On the dark themes the whole bar is inverted, so the colors are given inverted too.
                            primaryColor: (T.isDark) ? invertColor(ACCENT_COLOR) : ACCENT_COLOR,
                            secondaryColor: (T.isDark) ? invertColor(T.surface4) : T.surface4,
                        });
                        progressBar.elem.style.filter = T.iconFilter;
                        progressBar.elem.style.margin = "4px 0px 8px 0px"; // WHY: The current line is taller than the bar.

                    endGroup();

                });

            endCard();

        endGroup();

    };

    const initBottomRow = function() {

        startRow();

            // BAR: Sales by category
            chartCategory = createChartBox({
                flex: "1 1 420px",
                height: 320,
                type: "bar",
                horizontal: 1,
                title: "Sales by Category",
                subtitle: "Units sold this month",
                labels: ["Electronics", "Clothing", "Home", "Cosmetics", "Books"],
                values: [1250, 2100, 840, 1600, 920],
                onClick: function(self, item) {
                    println("Category: " + item.label + " = " + item.value);
                },
            });

            // BUTTONS: Quick actions
            startCard("Quick Actions", "Go to a page", "1 1 320px");

                const buttonParams = { width: "100%", align: "left center" };

                createButton("Manage Users", "left-menu/data-table.png", function() {
                    openPage(UsersPage.KEY);
                }, buttonParams);

                createButton("Edit Contents", "left-menu/data-table.png", function() {
                    openPage(ContentsPage.KEY);
                }, buttonParams);

                createButton("View Reports", "left-menu/reports.png", function() {
                    openPage(ReportsPage.KEY);
                }, buttonParams);

                const btnNotifications = createButton("Notifications", "top-bar/notification.png", function() {
                    openPage(NotificationsPage.KEY, 0); // Opens in the right view. (Not in the left menu)
                }, buttonParams);

                // BADGE: Notification count
                const badge = Badge({
                    value: 12,
                    badgeStyle: {
                        color: T.danger,
                        border: 0,
                        textColor: Ink(0.95),
                    },
                });
                btnNotifications.add(badge);
                badge.label.right = 14;
                badge.label.elem.style.top = "calc(50% - 9px)";

                createButton("Settings", "left-menu/setting.png", function() {
                    openPage(SettingsPage.KEY);
                }, buttonParams);

            endCard();

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
            initKpiRow();
            initChartRow();
            initTableRow();
            initBottomRow();

        endGroup();

    endBox();

    box.setPeriod(0);

    // LIVE: Active users (test data)
    liveTimer = setInterval(function() {
        const kpi = KPI_LIST[2];
        const value = random(kpi.min, kpi.max);
        kpiBoxList[2].addValue(value);
        if (selectedPeriodIndex == 0) kpiBoxList[2].setValueText(String(value));
    }, 2000);

    return box.endPage();

};

HomePage.KEY = "Home";
