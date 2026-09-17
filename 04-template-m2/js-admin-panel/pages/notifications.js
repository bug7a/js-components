/* Bismillah */

/*

Notifications Page (Right View Template) - v26.09

- Opens from the bell on the top bar. The badge on the bell shows the unread count.
- Tabs (All, Unread, Orders, Users, System), groups by day (Today, Yesterday, Earlier), load more.
- Click a notification: it is marked as read and its page is opened (Ex: a low stock alert opens Products).
- Menu of a notification: mark as read / unread, delete. "Mark all as read" in the header.
- Test feed: A new notification comes every 45 seconds (NotificationsPage.startTestFeed in index.htm).
  The badge is updated, and the list is updated if the panel is open.
- Replace NotificationsPage.getItems(), markAsRead(), delete() and the test feed with your service
  (polling, SSE, WebSocket or push notifications).

COMPONENTS:
- TextTabs (comp-m2): Filters
- ButtonWithIcon (comp-m3): Actions
- ContextMenu (comp-m4): Actions of a notification

*/

NotificationsPageDefaults = {
    color: "transparent",
};

const NotificationsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, NotificationsPageDefaults, rightView);

    rightView.setWidth(440);
    rightView.setKey(NotificationsPage.KEY);

    // *** PRIVATE VARIABLES:

    const S = NotificationsPage.STYLE;
    const PAGE_SIZE = 15;

    const TABS = [
        { id: "all", text: "All" },
        { id: "unread", text: "Unread" },
        { id: "orders", text: "Orders" },
        { id: "users", text: "Users" },
        { id: "system", text: "System" },
    ];

    let tabId = "all";
    let shownCount = PAGE_SIZE;

    // Components
    let lblTitle, btnMarkAll, tabs, grpListHost, itemMenu;

    // *** PRIVATE FUNCTIONS:

    const getFilteredItems = function() {
        return NotificationsPage.getItems().filter(function(item) {
            if (tabId == "unread") return !item.isRead;
            if (tabId == "all") return true;
            return NotificationsPage.TYPES[item.type].group == tabId;
        });
    };

    // Opens the page of the notification and closes the panel.
    const openItem = function(item) {
        NotificationsPage.markAsRead([item.id], true);
        if (!item.pageKey) return render();
        rightView.hide();
        rightView.clean(); // Destroys this page
        leftMenu.setSelectedItem(item.pageKey);
        openPageByKey(item.pageKey);
    };

    // Creates the content of a container again. (One group is started and ended in it.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. After more than one
    // top-level object, the next objects were created in another container. One wrapper group is safe.
    const renderInto = function(container, buildContent) {
        if (container.wrapper) container.wrapper.remove();
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });
                buildContent();
            endGroup();
        setDefaultContainerBox(previous);
    };

    const render = function() {

        if (!box) return;

        const unread = NotificationsPage.getUnreadCount();
        lblTitle.text = "Notifications" + ((unread) ? " <span style='font-size:14px; color:" + S.ACCENT_COLOR + "'>" + unread + " new</span>" : "");
        btnMarkAll.elem.inert = (unread == 0);
        btnMarkAll.opacity = (unread) ? 1 : 0.4;
        tabs.tabItemList[1].text = "Unread" + ((unread) ? " " + unread : "");

        const list = getFilteredItems();

        renderInto(grpListHost, function() {

            if (list.length == 0) {
                createEmptyState();
                return;
            }

            let lastGroup = "";

            list.slice(0, shownCount).forEach(function(item) {

                const group = NotificationsPage.getDayGroup(item.time);
                if (group != lastGroup) {
                    lastGroup = group;
                    Label({ text: group.toUpperCase(), fontSize: 11, textColor: White(0.45), padding: [20, 8] });
                    that.elem.style.letterSpacing = "1px";
                    that.elem.style.marginTop = "8px";
                }

                createItem(item);

            });

            if (list.length > shownCount) {
                HGroup({ width: "100%", height: "auto", align: "center center", padding: [0, 14] });
                    NotificationsPage.createButton("Load more (" + (list.length - shownCount) + ")", function() {
                        shownCount += PAGE_SIZE;
                        render();
                    });
                endGroup();
            }

        });

    };

    const createEmptyState = function() {

        VGroup({ width: "100%", height: "auto", align: "center top", gap: 6, padding: [30, 60] });

            Label({ text: "✓", fontSize: 30, textColor: S.ACCENT_COLOR, width: 60, height: 60, textAlign: "center", round: 100, color: NotificationsPage.alpha(S.ACCENT_COLOR, 0.12) });
            that.elem.style.lineHeight = "60px";

            Label({ text: (tabId == "unread") ? "You are all caught up" : "No notifications here", fontSize: 16, textColor: White(0.9) });
            that.elem.style.fontFamily = "opensans-bold";

            Label({ text: "New notifications will be shown here.", fontSize: 13, textColor: White(0.5) });

        endGroup();

    };

    const createItem = function(item) {

        const type = NotificationsPage.TYPES[item.type];

        const row = HGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: [20, 12], clickable: 1 });
        row.elem.style.cursor = "pointer";
        row.elem.tabIndex = 0;
        row.elem.setAttribute("role", "button");
        row.elem.setAttribute("aria-label", ((item.isRead) ? "" : "Unread: ") + item.title);
        row.color = (item.isRead) ? "transparent" : NotificationsPage.alpha(S.ACCENT_COLOR, 0.06);
        row.setMotion("background-color 0.15s");
        row.item = item;

            // Icon
            HGroup({ width: 38, height: 38, align: "center center", round: 100, color: NotificationsPage.alpha(type.color, 0.16) });
            that.elem.style.flexShrink = "0";
                Icon({ width: 18, height: 18 });
                that.load(type.icon);
                that.elem.style.filter = "invert(100%)"; // WHY: Panel icons are black. A white icon on the colored circle.
                that.opacity = 0.85;
            endGroup();

            // Texts
            VGroup({ width: "auto", height: "auto", align: "left top", gap: 2 });
            that.elem.style.flex = "1 1 auto";
            that.elem.style.minWidth = "0";

                Label({ text: NotificationsPage.escapeHtml(item.title), fontSize: 14, textColor: (item.isRead) ? White(0.75) : White(0.95), width: "100%" });
                if (!item.isRead) that.elem.style.fontFamily = "opensans-bold";

                if (item.text) {
                    Label({ text: NotificationsPage.escapeHtml(item.text), fontSize: 13, textColor: White(0.5), width: "100%" });
                }

                Label({ text: NotificationsPage.formatRelative(item.time) + " · " + type.label, fontSize: 12, textColor: White(0.38) });
                that.elem.title = new Date(item.time).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

            endGroup();

            // Unread dot and menu
            VGroup({ width: 28, height: "auto", align: "center top", gap: 8 });
            that.elem.style.flexShrink = "0";

                row.btnMore = Label({ text: "•••", fontSize: 11, textColor: White(0.5), padding: [6, 2], round: 6, clickable: 1 });
                row.btnMore.elem.style.cursor = "pointer";
                row.btnMore.elem.setAttribute("aria-label", "Notification actions");
                row.btnMore.on("mouseover", function(self) { self.color = White(0.1); });
                row.btnMore.on("mouseout", function(self) { self.color = "transparent"; });

                if (!item.isRead) {
                    Box({ width: 8, height: 8, round: 100, color: S.ACCENT_COLOR });
                }

            endGroup();

        endGroup();

        row.on("mouseover", function() { row.color = White(0.05); });
        row.on("mouseout", function() { row.color = (item.isRead) ? "transparent" : NotificationsPage.alpha(S.ACCENT_COLOR, 0.06); });

        row.on("click", function(self, event) {
            if (row.btnMore.elem.contains(event.target)) return;
            openItem(item);
        });

        row.on("keydown", function(self, event) {
            if (event.key == "Enter") openItem(item);
        });

        const openMenu = function(event) {
            // WHY: The text depends on the notification. Items are set before opening (setItems() closes an open menu).
            itemMenu.setItems([
                { text: (item.isRead) ? "Mark as unread" : "Mark as read", key: "toggleRead" },
                { text: "Open", key: "open", enabled: (item.pageKey) ? 1 : 0 },
                "-",
                { text: "Delete", key: "delete" },
            ]);
            itemMenu.openWithEvent(event, row);
        };

        row.btnMore.on("click", function(self, event) { openMenu(event); });
        row.on("contextmenu", function(self, event) {
            event.preventDefault(); // WHY: Do not show the browser menu.
            openMenu(event);
        });

    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        NotificationsPage.removeListener(render);

        // WHY: The menu is created on the page. box.remove() does not remove it.
        if (itemMenu) itemMenu.destroy();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    // Left line
    Box(0, 0, 1, "100%", { color: White(0.12) });

    // GROUP: Header
    VGroup({ left: 0, top: 0, width: "100%", height: 112, align: "left top", gap: 12, padding: [20, 14] });
    that.elem.style.borderBottom = "1px solid " + White(0.08);

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });

            lblTitle = Label({ text: "Notifications", fontSize: 20, textColor: White(0.95) });
            that.elem.style.fontFamily = "opensans-bold";
            that.elem.style.flex = "1 1 auto";

            btnMarkAll = NotificationsPage.createButton("Mark all as read", function() {
                NotificationsPage.markAsRead(NotificationsPage.getItems().map(function(item) { return item.id; }), true);
            });

            Icon({ width: 28, height: 28, clickable: 1 });
            that.load("assets/close.png");
            that.elem.style.filter = "invert(100%)";
            that.elem.style.cursor = "pointer";
            that.elem.setAttribute("aria-label", "Close");
            that.opacity = 0.6;
            that.on("click", function() {
                rightView.hide();
                rightView.clean();
            });

        endGroup();

        tabs = TextTabs({
            tabList: TABS.map(function(tab) { return tab.text; }),
            onClick: function(self) {
                tabId = TABS[self.index].id;
                shownCount = PAGE_SIZE;
                grpListHost.containerBox.elem.scrollTop = 0;
                render();
            },
            backgroundStyle: { colorBottom: S.FIELD_COLOR, colorTop: S.FIELD_COLOR, round: 8, border: 1, borderColor: S.CARD_BORDER_COLOR },
            tabPadding: [3, 3],
            labelStyle: { fontSize: 13, textColor: White(0.85), padding: [10, 5] },
            selectedStyle: { color: S.PRIMARY_COLOR, round: 6 },
        });

    endGroup();

    // BOX: Scrollable list
    startBox(0, 112, "100%", "calc(100% - 112px - 52px)", { color: "transparent", scrollY: 1 });

        grpListHost = VGroup({ width: "100%", height: "auto", align: "left top" });
        endGroup();

    endBox();

    // GROUP: Footer
    HGroup({ left: 0, bottom: 0, width: "100%", height: 52, align: "center center" });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        Label({ text: "Notification settings", fontSize: 13, textColor: S.ACCENT_COLOR, clickable: 1 });
        that.elem.style.cursor = "pointer";
        that.on("click", function() {
            rightView.hide();
            rightView.clean();
            leftMenu.setSelectedItem(SettingsPage.KEY);
            openPageByKey(SettingsPage.KEY);
        });

    endGroup();

    // MENU: Actions of a notification (items: openMenu)
    itemMenu = ContextMenu({
        onClick: function(self, menuItem) {
            const item = self.source.item;
            switch (menuItem.key) {
                case "toggleRead": NotificationsPage.markAsRead([item.id], !item.isRead); break;
                case "open": openItem(item); break;
                case "delete": NotificationsPage.delete([item.id]); break;
            }
        },
        style: NotificationsPage.CONTEXT_MENU_STYLE,
    });

    // *** PAGE INIT CODE:

    NotificationsPage.addListener(render); // Updates when a notification comes or changes.
    render();

    return box.endPage();

};

NotificationsPage.KEY = "Notifications";

// *** STATIC: STYLE AND HELPERS

NotificationsPage.STYLE = {
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
};

// group: The tab of the type
NotificationsPage.TYPES = {
    order: { label: "Order", group: "orders", color: "#65A293", icon: "assets/top-bar/bookmark.png" },
    refund: { label: "Refund", group: "orders", color: "#E66767", icon: "assets/top-bar/bookmark.png" },
    stock: { label: "Stock", group: "system", color: "#C98500", icon: "assets/warning.png" },
    user: { label: "User", group: "users", color: "#3987E5", icon: "assets/top-bar/user.png" },
    comment: { label: "Comment", group: "users", color: "#9085E9", icon: "assets/top-bar/comment.png" },
    security: { label: "Security", group: "system", color: "#E66767", icon: "assets/maybe.png" },
    report: { label: "Report", group: "system", color: "#3987E5", icon: "assets/left-menu/reports.png" },
};

NotificationsPage.CONTEXT_MENU_STYLE = {
    menu: { color: "#232322", borderColor: White(0.12), shadow: "0px 8px 24px rgba(0, 0, 0, 0.5)" },
    item: { textColor: White(0.85) },
    itemHover: { textColor: White(1), color: White(0.08) },
    disabled: { textColor: White(0.3) },
    separator: { color: White(0.1) },
};

NotificationsPage.createButton = function(text, onClick) {
    const S = NotificationsPage.STYLE;
    return ButtonWithIcon({
        labelText: text,
        iconFile: "",
        onClick: onClick,
        style: {
            layout: { gap: 6, padding: [12, 6] },
            label: { fontSize: 13, textColor: White(0.9) },
            box: { color: S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
            hover: { color: "#2C2C2A" },
            active: { color: "#383835" },
        },
    });
};

NotificationsPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// "#65A293", 0.2 -> "rgba(101, 162, 147, 0.2)"
NotificationsPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

// "Just now", "5 min ago", "3 h ago", "2 days ago"
NotificationsPage.formatRelative = function(time) {
    const minutes = Math.floor((Date.now() - time) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return minutes + " min ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + " h ago";
    const days = Math.floor(hours / 24);
    return days + " day" + ((days > 1) ? "s" : "") + " ago";
};

// "Today", "Yesterday", "Earlier"
NotificationsPage.getDayGroup = function(time) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (time >= today.getTime()) return "Today";
    if (time >= today.getTime() - 86400000) return "Yesterday";
    return "Earlier";
};

// *** STATIC: STORE (TEST)
// WHY: Notifications live outside of the page. The bell badge and an open panel must see the same data.

NotificationsPage._items = null;
NotificationsPage._nextId = 1;
NotificationsPage._listeners = [];
NotificationsPage._feedTimer = null;

// Called after every change: updates the badge and the open panel.
NotificationsPage.notify = function() {
    if (window.topBar && topBar.setNotificationCount) topBar.setNotificationCount(NotificationsPage.getUnreadCount());
    NotificationsPage._listeners.slice().forEach(function(listener) { listener(); });
};

NotificationsPage.addListener = function(func) {
    NotificationsPage._listeners.push(func);
};

NotificationsPage.removeListener = function(func) {
    NotificationsPage._listeners = NotificationsPage._listeners.filter(function(f) { return f !== func; });
};

NotificationsPage.getUnreadCount = function() {
    return NotificationsPage.getItems().filter(function(item) { return !item.isRead; }).length;
};

// TODO: Send to your service.
NotificationsPage.markAsRead = function(ids, isRead) {
    NotificationsPage.getItems().forEach(function(item) {
        if (ids.includes(item.id)) item.isRead = isRead;
    });
    NotificationsPage.notify();
};

// TODO: Send to your service.
NotificationsPage.delete = function(ids) {
    NotificationsPage._items = NotificationsPage.getItems().filter(function(item) { return !ids.includes(item.id); });
    NotificationsPage.notify();
};

// A new notification (from your service). Newest first.
NotificationsPage.add = function(data) {
    const item = {
        id: NotificationsPage._nextId++,
        type: data.type,
        title: data.title,
        text: data.text || "",
        pageKey: data.pageKey || "",
        time: data.time || Date.now(),
        isRead: data.isRead || false,
    };
    NotificationsPage.getItems().unshift(item);
    NotificationsPage.getItems().sort(function(a, b) { return b.time - a.time; });
    return item;
};

// TODO: Load from your service.
NotificationsPage.getItems = function() {

    if (NotificationsPage._items) return NotificationsPage._items;
    NotificationsPage._items = [];

    const MIN = 60000;
    const HOUR = 60 * MIN;
    const DAY = 24 * HOUR;
    const now = Date.now();

    // [type, title, text, page, age (ms), isRead]
    const DATA = [
        ["security", "4 failed sign-ins", "Baran Cetin, from 185.220.101.40 (Unknown VPN)", "Activity", 6 * MIN, false],
        ["order", "New order ORD-103757", "Ece Yurt · 3 items · $54.60", "Orders", 14 * MIN, false],
        ["stock", "Low stock: Cable Organizer (Green)", "Only 1 left. Low stock limit is 5.", "Products", 38 * MIN, false],
        ["comment", "New comment on \"Summer sale\"", "Selin Koc: \"Is free shipping included?\"", "Contents", 1.5 * HOUR, false],
        ["order", "New order ORD-103545", "Tarik Yilmaz · 6 items · $860.00", "Orders", 3 * HOUR, false],
        ["user", "New user signed up", "Mert Aksoy (mert.aksoy@mail.com)", "Users", 5 * HOUR, true],
        ["refund", "Refund requested for ORD-102871", "Reason: The product arrived broken.", "Orders", 7 * HOUR, true],
        ["stock", "Out of stock: Smart Ring (Blue)", "Customers can not buy it now.", "Products", 20 * HOUR, true],
        ["report", "Weekly sales report is ready", "Revenue $48,210 · 12% more than last week", "Reports", 1.2 * DAY, true],
        ["user", "Role changed", "Frank Weber is now in the Support role.", "Roles", 1.4 * DAY, true],
        ["order", "Order ORD-102200 delivered", "Yasemin Dogan · Yurtici Kargo", "Orders", 1.6 * DAY, true],
        ["comment", "New comment on \"Careers\"", "Can Ozturk: \"Do you hire remote developers?\"", "Contents", 2.5 * DAY, true],
        ["security", "New sign-in from a new device", "Bugra Ozden · Safari · iOS · Istanbul", "Activity", 3 * DAY, true],
        ["report", "Monthly report is ready", "August 2026", "Reports", 16 * DAY, true],
    ];

    // More old items (to show "Load more")
    for (let i = 0; i < 12; i++) {
        DATA.push(["order", "Order ORD-10" + (1900 + i * 7) + " delivered", "Delivered with Aras Kargo", "Orders", (4 + i * 1.5) * DAY, true]);
    }

    DATA.forEach(function(row) {
        NotificationsPage.add({ type: row[0], title: row[1], text: row[2], pageKey: row[3], time: now - row[4], isRead: row[5] });
    });

    return NotificationsPage._items;

};

// TEST: A new notification every "interval" ms. (Your service: polling, SSE or WebSocket)
NotificationsPage.startTestFeed = function(interval = 45000) {

    clearInterval(NotificationsPage._feedTimer);

    const SAMPLES = [
        { type: "order", title: "New order ORD-10{n}", text: "Deniz Arslan · 2 items · $142.40", pageKey: "Orders" },
        { type: "stock", title: "Low stock: Wireless Headphones (Black)", text: "Only 3 left. Low stock limit is 5.", pageKey: "Products" },
        { type: "user", title: "New user signed up", text: "Ece Yurt (ece.yurt@mail.com)", pageKey: "Users" },
        { type: "comment", title: "New comment on \"About us\"", text: "Anna Schmidt: \"Where is your office?\"", pageKey: "Contents" },
    ];

    let index = 0;

    NotificationsPage._feedTimer = setInterval(function() {
        const sample = SAMPLES[index++ % SAMPLES.length];
        NotificationsPage.add({ ...sample, title: sample.title.replace("{n}", String(4000 + index)) });
        NotificationsPage.notify();
    }, interval);

    NotificationsPage.notify(); // First badge count

};
