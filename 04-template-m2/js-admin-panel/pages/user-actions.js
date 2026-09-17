/* Bismillah */

/*

User Actions Page (Right View Template) - v26.09

- Opens from the user button on the top bar. The menu of the signed in user.
- Profile: avatar, name, e-mail and role. Name and e-mail come from Settings > Account.
- Status: Online, Away, Do not disturb (saved to the browser).
- Session: sign in time, device, auto sign out time and two-factor authentication.
- Shortcuts: My Account (Settings > Account), Notifications (unread count), My Details (User List),
  Activity Log, Settings, Help & Support.
- Panel color: Changes the top bar color. (Same setting as Settings > Appearance)
- Sign out.
- Replace UserActionsPage.getCurrentUser(), getStatus() and setStatus() with your service.

COMPONENTS:
- ButtonWithIcon (comp-m3): Sign out
- UIEffects (comp-m2): Click effect of the menu items

*/

UserActionsPageDefaults = {
    color: "transparent",
};

const UserActionsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, UserActionsPageDefaults, rightView);

    rightView.setWidth(360);
    rightView.setKey(UserActionsPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const S = UserActionsPage.STYLE;
    const STATUSES = UserActionsPage.STATUSES;
    const escape = UserActionsPage.escapeHtml;

    const user = UserActionsPage.getCurrentUser();
    const settings = SettingsPage.load();

    // Components
    let avatarDot, statusButtons = {}, colorSwatches = [];
    let lblNotificationCount = null;

    // *** PRIVATE FUNCTIONS:

    // Closes this panel and opens a page in the main view.
    const openMainPage = function(pageKey, openPage) {
        rightView.hide();
        rightView.clean(); // Destroys this page
        leftMenu.setSelectedItem(pageKey);
        openPage();
    };

    const updateStatusView = function() {
        const statusId = UserActionsPage.getStatus();
        avatarDot.color = STATUSES[statusId].color;
        Object.keys(statusButtons).forEach(function(id) {
            const btn = statusButtons[id];
            const isSelected = (id == statusId);
            btn.color = (isSelected) ? UserActionsPage.alpha(STATUSES[id].color, 0.16) : "transparent";
            btn.borderColor = (isSelected) ? UserActionsPage.alpha(STATUSES[id].color, 0.5) : S.CARD_BORDER_COLOR;
        });
    };

    const updateColorView = function() {
        const color = SettingsPage.load().panelColor;
        colorSwatches.forEach(function(swatch) {
            swatch.borderColor = (swatch.panelColor == color) ? White(0.9) : "transparent";
        });
    };

    const updateNotificationCount = function() {
        if (!box || !lblNotificationCount) return;
        const count = NotificationsPage.getUnreadCount();
        lblNotificationCount.text = String(count);
        lblNotificationCount.visible = (count > 0) ? 1 : 0;
    };

    // *** VIEW HELPERS:

    const startSection = function(title) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8 });
        if (title) {
            Label({ text: title.toUpperCase(), fontSize: 11, textColor: White(0.45), padding: [4, 0] });
            that.elem.style.letterSpacing = "1px";
        }
        return group;
    };

    const createInfoLine = function(left, right, rightColor = White(0.85)) {
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });
        that.elem.style.justifyContent = "space-between";
            Label({ text: left, fontSize: 13, textColor: White(0.5) });
            that.elem.style.flexShrink = "0";
            Label({ text: right, fontSize: 13, textColor: rightColor, textAlign: "right" });
        endGroup();
    };

    // A menu line: icon, text, description and a right side label.
    const createMenuItem = function(text, desc, iconFile, onClick) {

        const item = HGroup({ width: "100%", height: "auto", align: "left center", gap: 12, padding: [12, 10], round: 8, color: "transparent" });
        item.elem.style.cursor = "pointer";
        item.setMotion("background-color 0.15s");
        item.on("mouseover", function() { item.color = S.FIELD_COLOR; });
        item.on("mouseout", function() { item.color = "transparent"; });
        item.on("click", onClick);
        UIEffects.button(item);

            Icon({ width: 20, height: 20 });
            that.load(iconFile);
            that.elem.style.filter = "invert(100%)";
            that.elem.style.flexShrink = "0";
            that.opacity = 0.75;

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
            that.elem.style.flex = "1 1 auto";
            that.elem.style.minWidth = "0";
                Label({ text: text, fontSize: 15, textColor: White(0.9) });
                if (desc) Label({ text: desc, fontSize: 12, textColor: White(0.45) });
            endGroup();

            item.lblRight = Label({ text: "", fontSize: 12, textColor: White(0.95), color: S.PRIMARY_COLOR, round: 100, padding: [7, 1], visible: 0 });

        endGroup();

        return item;

    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {
        NotificationsPage.removeListener(updateNotificationCount);
        box.remove();
        box = null;
    };

    // *** PAGE VIEW:

    // Left line
    Box(0, 0, 1, "100%", { color: White(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 72px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 18, padding: [16, 18] });

            // PROFILE
            VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, padding: 16, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });

                    // Avatar with the status dot
                    startBox({ width: 52, height: 52, color: "transparent" });
                    that.elem.style.flexShrink = "0";
                    that.clipContent = 0;

                        HGroup({ left: 0, top: 0, width: 52, height: 52, align: "center center", round: 100, color: user.avatarColor });
                            Label({ text: UserActionsPage.getInitials(user.name), fontSize: 18, textColor: White(0.95) });
                        endGroup();

                        avatarDot = Box({ left: 38, top: 38, width: 14, height: 14, round: 100, border: 2, borderColor: S.CARD_COLOR });

                    endBox();

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 1 });
                    that.elem.style.flex = "1 1 auto";
                    that.elem.style.minWidth = "0";

                        Label({ text: escape(user.name), fontSize: 17, textColor: White(0.95) });
                        that.elem.style.fontFamily = "opensans-bold";
                        that.elem.style.whiteSpace = "nowrap";
                        that.elem.style.overflow = "hidden";
                        that.elem.style.textOverflow = "ellipsis";
                        that.width = "100%";

                        Label({ text: escape(user.email), fontSize: 13, textColor: White(0.5) });
                        that.elem.style.whiteSpace = "nowrap";
                        that.elem.style.overflow = "hidden";
                        that.elem.style.textOverflow = "ellipsis";
                        that.width = "100%";

                        Label({ text: escape(user.roleName).toUpperCase(), fontSize: 10, textColor: S.ACCENT_COLOR, color: UserActionsPage.alpha(S.ACCENT_COLOR, 0.15), round: 6, padding: [7, 2] });
                        that.elem.style.letterSpacing = "1px";
                        that.elem.style.marginTop = "5px";

                    endGroup();

                endGroup();

                // Status
                HGroup({ width: "100%", height: "auto", align: "left center", gap: 6 });

                    Object.keys(STATUSES).forEach(function(id) {

                        const btn = HGroup({ width: "auto", height: 32, align: "center center", gap: 6, padding: [10, 0], round: 100, border: 1, borderColor: S.CARD_BORDER_COLOR, color: "transparent" });
                        btn.elem.style.flex = "1 1 auto";
                        btn.elem.style.cursor = "pointer";
                        btn.setMotion("background-color 0.15s, border-color 0.15s");
                        btn.on("click", function() {
                            UserActionsPage.setStatus(id);
                            updateStatusView();
                        });

                            Box({ width: 8, height: 8, round: 100, color: STATUSES[id].color });
                            Label({ text: STATUSES[id].label, fontSize: 12, textColor: White(0.85) });
                            that.elem.style.whiteSpace = "nowrap";

                        endGroup();

                        statusButtons[id] = btn;

                    });

                endGroup();

            endGroup();

            // SHORTCUTS
            startSection("");

                createMenuItem("My Account", "Name, e-mail, password and 2FA", ASSETS + "top-bar/user.png", function() {
                    openMainPage(SettingsPage.KEY, function() { SettingsPage({ sectionIndex: 1 }); });
                });

                const itemNotifications = createMenuItem("Notifications", "Orders, users and system messages", ASSETS + "top-bar/notification.png", function() {
                    rightView.hide();
                    rightView.clean(); // Destroys this page
                    openPageByKey(NotificationsPage.KEY);
                });
                lblNotificationCount = itemNotifications.lblRight;

                if (typeof UserListPage !== "undefined" && user.id !== null) {
                    createMenuItem("My Details", "Your role and permissions", ASSETS + "left-menu/data-table.png", function() {
                        openMainPage(UserListPage.KEY, function() { UserListPage({ openUserId: user.id }); });
                    });
                }

                createMenuItem("Activity Log", "What was done in the panel", ASSETS + "top-bar/filter.png", function() {
                    openMainPage(ActivityPage.KEY, function() { ActivityPage(); });
                });

                createMenuItem("Settings", "Panel, notifications and appearance", ASSETS + "left-menu/setting.png", function() {
                    openMainPage(SettingsPage.KEY, function() { SettingsPage(); });
                });

                createMenuItem("Help & Support", escape(settings.supportEmail), ASSETS + "top-bar/comment.png", function() {
                    window.location.href = "mailto:" + encodeURIComponent(settings.supportEmail) + "?subject=" + encodeURIComponent(settings.panelName + " help");
                });

            endGroup();

            // PANEL COLOR
            startSection("Panel color");

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 10, padding: [4, 0] });

                    SettingsPage.PANEL_COLORS.forEach(function(item) {

                        const swatch = Box({ width: 30, height: 30, round: 100, color: item.color, border: 2, borderColor: "transparent" });
                        swatch.panelColor = item.color;
                        swatch.elem.title = item.name;
                        swatch.elem.style.cursor = "pointer";
                        swatch.elem.style.boxShadow = "0 0 0 1px " + White(0.15) + " inset";
                        swatch.on("click", function() {
                            const saved = SettingsPage.load();
                            saved.panelColor = item.color;
                            SettingsPage.saveAndApply(saved); // WHY: Also updates the Settings page, if it is open.
                            updateColorView();
                        });
                        colorSwatches.push(swatch);

                    });

                endGroup();

            endGroup();

            // SESSION
            startSection("This session");

                VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: [14, 12], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });

                    const sessionStart = UserActionsPage.getSessionStart();
                    createInfoLine("Signed in", UserActionsPage.formatRelative(sessionStart));
                    createInfoLine("Device", escape(UserActionsPage.getDeviceName()));
                    createInfoLine("Auto sign out", "After " + settings.sessionTimeout + " min idle");
                    createInfoLine("Two-factor", (settings.twoFactor) ? "On" : "Off", (settings.twoFactor) ? S.ACCENT_COLOR : "#C98500");

                    if (!settings.twoFactor) {
                        Label({ text: "Turn on two-factor authentication in My Account to protect your account.", fontSize: 12, textColor: White(0.45), width: "100%" });
                    }

                endGroup();

            endGroup();

        endGroup();

    endBox();

    // GROUP: Bottom (sign out)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 72, align: "left center", gap: 10, padding: [18, 0] });
    that.elem.style.borderTop = "1px solid " + White(0.08);

        const btnSignOut = ButtonWithIcon({
            width: "auto",
            labelText: "Sign Out",
            iconFile: "",
            onClick: function() {
                UserActionsPage.clearSession();
                if (typeof waiting !== "undefined") waiting.show();
                logout();
            },
            style: {
                layout: { gap: 8, padding: [16, 8] },
                icon: { width: 18, height: 18 },
                label: { fontSize: 14, textColor: "#F08A8A" },
                box: { color: S.FIELD_COLOR, border: 1, borderColor: UserActionsPage.alpha(S.ERROR_COLOR, 0.35), round: 8 },
                hover: { color: UserActionsPage.alpha(S.ERROR_COLOR, 0.15) },
                active: { color: UserActionsPage.alpha(S.ERROR_COLOR, 0.25) },
            },
        });
        if (btnSignOut.icon) btnSignOut.icon.visible = 0;

        // Space
        HGroup({ width: "auto", height: 1 });
        that.elem.style.flex = "1 1 auto";
        endGroup();

        Label({ text: escape(settings.panelName), fontSize: 12, textColor: White(0.35) });

    endGroup();

    // *** PAGE INIT CODE:

    updateStatusView();
    updateColorView();
    updateNotificationCount();
    NotificationsPage.addListener(updateNotificationCount); // WHY: The test feed adds notifications while the panel is open.

    return box.endPage();

};

UserActionsPage.KEY = "UserActions";

// *** STATIC: STYLE AND HELPERS

UserActionsPage.STYLE = {
    CARD_COLOR: "#1A1A19",
    CARD_BORDER_COLOR: White(0.1),
    FIELD_COLOR: "#232322",
    PRIMARY_COLOR: "#3D7A6B",
    ACCENT_COLOR: "#65A293",
    ERROR_COLOR: "#E66767",
};

UserActionsPage.STATUSES = {
    online: { label: "Online", color: "#65A293" },
    away: { label: "Away", color: "#C98500" },
    busy: { label: "Do not disturb", color: "#E66767" },
};

UserActionsPage.STATUS_STORAGE_KEY = "adminPanel.userStatus";
UserActionsPage.SESSION_STORAGE_KEY = "adminPanel.sessionStart";

UserActionsPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// "#65A293", 0.2 -> "rgba(101, 162, 147, 0.2)"
UserActionsPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

UserActionsPage.getInitials = function(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0).toUpperCase(); }).join("") || "?";
};

// "5 minutes ago"
UserActionsPage.formatRelative = function(time) {
    const seconds = Math.round((Date.now() - time) / 1000);
    const units = [["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const unit of units) {
        const value = Math.floor(seconds / unit[1]);
        if (value >= 1) return value + " " + unit[0] + ((value > 1) ? "s" : "") + " ago";
    }
    return "Just now";
};

// "Chrome on macOS"
UserActionsPage.getDeviceName = function() {
    const ua = navigator.userAgent;
    const browser = (/Edg\//.test(ua)) ? "Edge" : (/OPR\//.test(ua)) ? "Opera" : (/Firefox\//.test(ua)) ? "Firefox"
        : (/Chrome\//.test(ua)) ? "Chrome" : (/Safari\//.test(ua)) ? "Safari" : "Browser";
    const os = (/iPhone|iPad/.test(ua)) ? "iOS" : (/Android/.test(ua)) ? "Android" : (/Mac OS X/.test(ua)) ? "macOS"
        : (/Windows/.test(ua)) ? "Windows" : (/Linux/.test(ua)) ? "Linux" : "";
    return (os) ? browser + " on " + os : browser;
};

// *** STATIC: USER DATA (TEST)

// The signed in user. Name and e-mail come from Settings > Account. Role comes from the User List.
// TODO: Get the user from your auth service.
UserActionsPage.getCurrentUser = function() {

    const settings = SettingsPage.load();
    const result = { id: null, name: settings.fullName, email: settings.email, roleName: "Admin", avatarColor: UserActionsPage.STYLE.PRIMARY_COLOR };

    if (typeof UserListPage !== "undefined") {
        const data = UserListPage.load();
        const user = data.users.find(function(u) { return u.email.toLowerCase() == String(settings.email).toLowerCase(); });
        if (user) {
            result.id = user.id;
            result.roleName = UserListPage.getRoleName(data, user.roleId);
            result.avatarColor = RolesPage.getAvatarColor(user.id);
        }
    }

    return result;

};

// TODO: Save the status with your service, so the other users can see it.
UserActionsPage.getStatus = function() {
    const status = basic.storage.load(UserActionsPage.STATUS_STORAGE_KEY);
    return (UserActionsPage.STATUSES[status]) ? status : "online";
};

UserActionsPage.setStatus = function(status) {
    basic.storage.save(UserActionsPage.STATUS_STORAGE_KEY, status);
    if (window.topBar && topBar.refreshUser) topBar.refreshUser(); // Status dot on the top bar
};

// Sign in time. (Test: saved when it is asked the first time, cleared on sign out.)
UserActionsPage.getSessionStart = function() {
    let time = basic.storage.load(UserActionsPage.SESSION_STORAGE_KEY);
    if (!time) {
        time = Date.now();
        basic.storage.save(UserActionsPage.SESSION_STORAGE_KEY, time);
    }
    return time;
};

UserActionsPage.clearSession = function() {
    basic.storage.save(UserActionsPage.SESSION_STORAGE_KEY, 0);
};
