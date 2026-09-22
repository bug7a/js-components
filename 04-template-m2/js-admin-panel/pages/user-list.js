/* Bismillah */

/*

User List Page (Template) - v26.09

- Panel users: summary cards, status tabs with counts, search, role filter and a user table.
- User details panel (right view): edit name and e-mail, change the role (with its permissions),
  security info, reset password, suspend / reactivate, resend or cancel an invite, remove the user.
- Invite a new user: name, e-mail and role. The user is "Invited" until the first login.
- Rules:
  - At least one active "Admin" must stay. (The last active admin can not be suspended, removed or get another role.)
  - An e-mail can be used by only one user.
- Uses the same users as the Roles & Permissions page (RolesPage.load() / RolesPage.save()),
  so a role change is seen on both pages. Extra fields (status, last login, 2FA) are added to the users.
- NOTE: The old "Users" page (pages/users.js) is kept.

COMPONENTS:
- TextTabs (comp-m2): Status tabs
- SearchInput, TinySelect (comp-m2): Filters, role select
- SmartTable (comp-m3): User list
- InputB (comp-m2): Name, e-mail
- ButtonWithIcon (comp-m3): Actions
- Dialog, Waiting (comp-m2): Confirm, saving

*/

UserListPageDefaults = {
    color: "transparent",
    openUserId: null, // Opens the details of this user. "invite": Invite a new user (Ex: from the top bar)
};

const UserListPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, UserListPageDefaults, mainView);

    mainView.setKey(UserListPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";
    const S = UserListPage.STYLE;
    const STATUSES = UserListPage.STATUSES;

    // Tabs: "" -> All
    const TABS = ["", "active", "invited", "suspended"];

    const filter = {
        status: "",
        search: "",
        roleId: "",
    };

    let searchTimer = null;

    // Components
    let statusTabs, searchInput, roleSelect;
    let statCards = [];
    let lblResultCount, smartTable;

    // *** PRIVATE FUNCTIONS:

    // All filters except the status (used for the tab counts too)
    const matchesFilters = function(user) {
        if (filter.roleId && user.roleId != filter.roleId) return false;
        const search = filter.search.trim().toLowerCase();
        if (search) {
            const text = (user.name + " " + user.email).toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    };

    const render = function() {

        const data = UserListPage.load();
        const list = data.users.filter(matchesFilters);

        // Tab counts
        TABS.forEach(function(status, index) {
            const count = (status) ? list.filter(function(user) { return user.status == status; }).length : list.length;
            const label = (status) ? STATUSES[status].label : "All";
            statusTabs.tabItemList[index].text = label + " <span style='opacity:0.55'>" + count + "</span>";
        });

        const shown = (filter.status) ? list.filter(function(user) { return user.status == filter.status; }) : list;

        smartTable.setItemDataList(shown.map(function(user) {
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: UserListPage.getRoleName(data, user.roleId),
                status: STATUSES[user.status].label,
                lastLogin: (user.lastLogin) ? UserListPage.formatDateTime(user.lastLogin) : "Never", // Sortable text
                twoFactor: (user.twoFactor) ? "On" : "Off",
            };
        }));

        lblResultCount.text = shown.length + " of " + data.users.length + " users";

        renderSummary(data);

    };

    const renderSummary = function(data) {

        const users = data.users;
        const count = function(status) { return users.filter(function(user) { return user.status == status; }).length; };
        const active = users.filter(function(user) { return user.status == "active"; });
        const twoFactorPercent = (active.length) ? Math.round(active.filter(function(user) { return user.twoFactor; }).length / active.length * 100) : 0;
        const weekAgo = Date.now() - 7 * UserListPage.DAY;
        const recent = active.filter(function(user) { return user.lastLogin && user.lastLogin > weekAgo; }).length;
        const pendingOld = users.filter(function(user) { return user.status == "invited" && user.invitedAt < Date.now() - 3 * UserListPage.DAY; }).length;

        const values = [
            { value: users.length, desc: data.roles.length + " roles" },
            { value: active.length, desc: recent + " logged in this week" },
            { value: count("invited"), desc: (pendingOld) ? pendingOld + " waiting more than 3 days" : "No old invites" },
            { value: count("suspended"), desc: "2FA on for " + twoFactorPercent + "% of active users" },
        ];

        statCards.forEach(function(card, index) {
            card.lblValue.text = String(values[index].value);
            card.lblDesc.text = values[index].desc;
        });

    };

    const exportCSV = function() {

        const rows = smartTable.visibleItemDataList; // WHY: Also uses the sort and the search of the table.
        const quote = function(value) { return "\"" + String(value).replace(/"/g, "\"\"") + "\""; };
        const lines = ["id,name,email,role,status,last_login,two_factor"].concat(rows.map(function(row) {
            return [row.id, row.name, row.email, row.role, row.status, row.lastLogin, row.twoFactor].map(quote).join(",");
        }));

        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
        link.download = "users-" + UserListPage.formatDateTime(Date.now()).slice(0, 10) + ".csv";
        link.click();
        URL.revokeObjectURL(link.href);

    };

    const openDetails = function(userId) {
        UserListDetails({
            userId: userId,
            onChange: function() {
                if (box) render();
            },
        });
    };

    const closeDetails = function() {
        if (rightView.isShown(UserListDetails.KEY)) {
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
        if (smartTable) smartTable.remove();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: "User List", fontSize: 26, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Invite panel users, give them a role and manage their access", fontSize: 14, textColor: Ink(0.5) });

            endGroup();

            HGroup({ width: "auto", height: "auto", align: "left center", gap: 8 });
                UserListPage.createButton("Export CSV", ASSETS + "arrow_down.png", exportCSV);
                UserListPage.createButton("Invite User", ASSETS + "top-bar/add.png", function() { openDetails(null); }, { primary: 1 });
            endGroup();

        endGroup();

    };

    const initSummary = function() {

        const CARD_LIST = [
            { title: "Total users", color: Ink(0.95) },
            { title: "Active", color: STATUSES.active.color },
            { title: "Invited", color: STATUSES.invited.color },
            { title: "Suspended", color: STATUSES.suspended.color },
        ];

        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";

            CARD_LIST.forEach(function(item) {

                const card = VGroup({ width: "auto", height: "auto", align: "left top", gap: 2, padding: 14, color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 12 });
                setFlex(card, "1 1 200px");

                    Label({ text: item.title, fontSize: 13, textColor: Ink(0.5) });
                    card.lblValue = Label({ text: "", fontSize: 26, textColor: item.color });
                    card.lblDesc = Label({ text: "", fontSize: 12, textColor: Ink(0.45) });

                endGroup();

                statCards.push(card);

            });

        endGroup();

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
                    labelStyle: { fontSize: 14, textColor: Ink(0.85), padding: [12, 6] },
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
                    textColor: Ink(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Search by name or e-mail",
                    invertIconColor: T.invertIcon,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        filter.search = text;
                        searchTimer = waitAndRun(searchTimer, render, 200); // WHY: Do not filter on every key.
                    },
                });
                that.position = "relative";

                const roles = UserListPage.load().roles;
                roleSelect = UserListPage.createTinySelect(
                    [{ id: "", label: "All roles" }].concat(roles.map(function(role) { return { id: role.id, label: role.name }; })),
                    function(id) { filter.roleId = id; render(); }
                );

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                lblResultCount = Label({ text: "", fontSize: 13, textColor: Ink(0.55) });

            endGroup();

        endGroup();

    };

    const initTable = function() {

        HGroup({ width: "100%", height: 640, align: "left top" });

            smartTable = SmartTable({
                titleDataList: [
                    { name: "NAME", dataTitle: "name", dataType: "string", width: 210, shortable: 1 },
                    { name: "E-MAIL", dataTitle: "email", dataType: "string", width: 260, shortable: 1 },
                    { name: "ROLE", dataTitle: "role", dataType: "string", width: 150, shortable: 1 },
                    { name: "STATUS", dataTitle: "status", dataType: "string", width: 130, shortable: 1 },
                    { name: "LAST LOGIN", dataTitle: "lastLogin", dataType: "string", width: 180, shortable: 1 },
                    { name: "2FA", dataTitle: "twoFactor", dataType: "string", width: 90, shortable: 1 },
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
                // WHY: SmartTable writes the raw value. Status and 2FA colors are written here.
                updateCustomItemCell: function(cell, titleDataIndex, data) {
                    if (titleDataIndex == 3) {
                        const status = UserListPage.getStatusByLabel(data);
                        cell.label.textColor = (status) ? status.color : Ink(0.75);
                    }
                    if (titleDataIndex == 4) {
                        cell.label.textColor = (data == "Never") ? Ink(0.4) : Ink(0.75);
                    }
                    if (titleDataIndex == 5) {
                        cell.label.textColor = (data == "On") ? S.ACCENT_COLOR : Ink(0.4);
                    }
                },
                ...UserListPage.getSmartTableStyle(LIB_PATH),
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

    if (box.openUserId !== null) openDetails((box.openUserId === "invite") ? null : box.openUserId);

    return box;

};

UserListPage.KEY = "UserList";

// *** DETAILS PANEL (RIGHT VIEW):

const UserListDetailsDefaults = {
    userId: null, // null: Invite a new user
    notice: "", // A message on the top. (Ex: "Invite is sent")
    onChange: function() {},
};

const UserListDetails = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, UserListDetailsDefaults);

    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = T.surfaceDeep;

    // BOX: Component container
    let box = startObject(params);

    const S = UserListPage.STYLE;
    const STATUSES = UserListPage.STATUSES;
    const escape = UserListPage.escapeHtml;

    const data = UserListPage.load();
    const user = (box.userId === null) ? null : data.users.find(function(u) { return u.id == box.userId; });
    const isInvite = (user === null);

    let saveTimer = null;

    // *** USER SERVICE (TEST):

    // Changes the users like a server request, then opens the panel again with the new data.
    // change: function(data, user) - returns an error text, or "" when it is OK.
    const saveChange = function(change, notice, openUserId) {

        if (typeof waiting !== "undefined") waiting.show();

        saveTimer = setTimeout(function() {

            // TODO: Send the change to your service.
            const fresh = UserListPage.load();
            const freshUser = (user) ? fresh.users.find(function(u) { return u.id == user.id; }) : null;
            const error = change(fresh, freshUser);

            if (typeof waiting !== "undefined") waiting.hide();

            if (error) {
                showNotice(error, true);
                return;
            }

            UserListPage.save(fresh);
            box.onChange();

            if (openUserId === -1) {
                // Removed: close the panel
                rightView.hide();
                rightView.clean();
            } else {
                UserListDetails({ userId: (openUserId !== undefined) ? openUserId : user.id, notice: notice, onChange: box.onChange }); // Render again
            }

        }, 400);

    };

    // *** VIEW HELPERS:

    const startSection = function(title) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: [16, 14], color: S.CARD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 10 });
        if (title) {
            Label({ text: title.toUpperCase(), fontSize: 11, textColor: Ink(0.45) });
            that.elem.style.letterSpacing = "1px";
        }
        return group;
    };

    const createInfoLine = function(left, right, rightStyle = {}) {
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.justifyContent = "space-between";
            Label({ text: left, fontSize: 14, textColor: Ink(0.55) });
            that.elem.style.flexShrink = "0";
            Label({ text: right, fontSize: 14, textColor: Ink(0.9), textAlign: "right", ...rightStyle });
        endGroup();
    };

    const createDarkInput = function(params) {
        const input = InputB({
            width: "100%",
            leftPadding: 14,
            rightPadding: 36,
            backgroundColor: S.FIELD_COLOR,
            selectedBackgroundColor: T.surface3,
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
        input.title.textColor = Ink(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = Ink(0.9);
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

    // GROUP: Notice line (success or error)
    let grpNotice, lblNotice;
    const showNotice = function(text, isError = false) {
        const color = (isError) ? S.ERROR_COLOR : S.ACCENT_COLOR;
        lblNotice.text = escape(text);
        lblNotice.textColor = color;
        grpNotice.color = UserListPage.alpha(color, 0.12);
        grpNotice.borderColor = UserListPage.alpha(color, 0.35);
        grpNotice.visible = (text) ? 1 : 0;
    };

    // Returns the error text of the name and e-mail, or "".
    const validateAccount = function(name, email, ignoreUserId) {
        if (name.length < 2) return "Name must be at least 2 letters.";
        if (!UserListPage.isEmail(email)) return "E-mail is not valid.";
        const used = UserListPage.load().users.some(function(u) { return u.id != ignoreUserId && u.email.toLowerCase() == email.toLowerCase(); });
        if (used) return "This e-mail is used by another user.";
        return "";
    };

    // Last active admin rule
    const isLastActiveAdmin = function(targetData, targetUser) {
        if (!targetUser || targetUser.roleId != "admin" || targetUser.status != "active") return false;
        return targetData.users.filter(function(u) { return u.roleId == "admin" && u.status == "active"; }).length <= 1;
    };

    box.destroy = function() {
        clearTimeout(saveTimer);
        box.remove();
        box = null;
    };

    // *** VIEW:

    // Left line
    Box(0, 0, 1, "100%", { color: Ink(0.12) });

    // GROUP: Scrollable content
    startBox(0, 0, "100%", "calc(100% - 76px)", { color: "transparent", scrollY: 1 });

        VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, padding: 20 });

            // TITLE
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });

                // Avatar
                HGroup({ width: 48, height: 48, align: "center center", round: 100, color: (isInvite) ? S.FIELD_COLOR : RolesPage.getAvatarColor(user.id) });
                that.elem.style.flexShrink = "0";
                    Label({ text: (isInvite) ? "+" : UserListPage.getInitials(user.name), fontSize: 17, textColor: Ink(0.95) });
                endGroup();

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 2 });
                that.elem.style.flex = "1 1 auto";
                that.elem.style.minWidth = "0";

                    if (isInvite) {
                        Label({ text: "Invite User", fontSize: 20, textColor: Ink(0.95) });
                        that.elem.style.fontFamily = "opensans-bold";
                        Label({ text: "The user gets an e-mail to set a password.", fontSize: 13, textColor: Ink(0.5) });
                    } else {
                        const status = STATUSES[user.status];
                        HGroup({ width: "auto", height: "auto", align: "left center", gap: 10 });
                            Label({ text: escape(user.name), fontSize: 20, textColor: Ink(0.95) });
                            that.elem.style.fontFamily = "opensans-bold";
                            Label({ text: status.label.toUpperCase(), fontSize: 11, textColor: status.color, color: UserListPage.alpha(status.color, 0.15), round: 6, padding: [8, 3] });
                            that.elem.style.letterSpacing = "1px";
                        endGroup();
                        Label({ text: escape(user.email) + " · " + escape(UserListPage.getRoleName(data, user.roleId)), fontSize: 13, textColor: Ink(0.5) });
                    }

                endGroup();

                Icon({ width: 28, height: 28, clickable: 1 });
                that.load("assets/close.png");
                that.elem.style.filter = T.iconFilter;
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

            // ACCOUNT (name, e-mail)
            startSection((isInvite) ? "New user" : "Account");

                // WHY: Inputs can call onEdit while they are created. The function is set after the button is created.
                let updateAccountButton = function() {};

                const inputName = createDarkInput({
                    titleText: "NAME",
                    placeholder: "Name and surname",
                    maxChar: 60,
                    onEdit: function() { updateAccountButton(); },
                });

                const inputEmail = createDarkInput({
                    titleText: "E-MAIL",
                    placeholder: "name@company.com",
                    maxChar: 120,
                    warningText: "E-mail is not valid",
                    onEdit: function() { updateAccountButton(); },
                });

                let roleId = (isInvite) ? RolesPage.DEFAULT_ROLE_ID : user.roleId;

                if (isInvite) {

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 6 });
                        Label({ text: "ROLE", fontSize: 11, textColor: Ink(0.45) });
                        that.elem.style.letterSpacing = "1px";
                        UserListPage.createTinySelect(
                            data.roles.map(function(role) { return { id: role.id, label: role.name }; }),
                            function(id) { roleId = id; },
                            Math.max(0, data.roles.findIndex(function(role) { return role.id == roleId; }))
                        );
                    endGroup();

                }

                const btnAccount = UserListPage.createButton((isInvite) ? "Send Invite" : "Save Changes", "", function() {

                    const name = inputName.getInputValue().trim();
                    const email = inputEmail.getInputValue().trim();
                    const error = validateAccount(name, email, (user) ? user.id : null);
                    if (error) { showNotice(error, true); return; }

                    if (isInvite) {
                        const newId = UserListPage.getNextId(data);
                        saveChange(function(fresh) {
                            fresh.users.push(UserListPage.createInvitedUser(newId, name, email, roleId));
                            return "";
                        }, "Invite is sent to " + email + ".", newId);
                    } else {
                        saveChange(function(fresh, freshUser) {
                            if (!freshUser) return "User is not found.";
                            freshUser.name = name;
                            freshUser.email = email;
                            return "";
                        }, "Changes are saved.");
                    }

                }, { primary: 1 });

                updateAccountButton = function() {
                    const name = inputName.getInputValue().trim();
                    const email = inputEmail.getInputValue().trim();
                    const isChanged = isInvite || name != user.name || email != user.email;
                    inputEmail.showWarningIfNotValid(UserListPage.isEmail(email));
                    setInteractive(btnAccount, isChanged && name.length >= 2 && UserListPage.isEmail(email));
                };

                if (!isInvite) {
                    inputName.setInputValue(user.name);
                    inputEmail.setInputValue(user.email);
                }
                updateAccountButton();

            endGroup();

            if (!isInvite) {

                const role = data.roles.find(function(r) { return r.id == user.roleId; });

                // ROLE AND PERMISSIONS
                startSection("Role");

                    const lastAdmin = isLastActiveAdmin(data, user);

                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });

                        const selRole = UserListPage.createTinySelect(
                            data.roles.map(function(r) { return { id: r.id, label: r.name }; }),
                            function(id) {
                                if (id == user.roleId) return;
                                saveChange(function(fresh, freshUser) {
                                    if (!freshUser) return "User is not found.";
                                    if (isLastActiveAdmin(fresh, freshUser)) return "At least one active admin must stay.";
                                    freshUser.roleId = id;
                                    return "";
                                }, "Role is changed to " + UserListPage.getRoleName(data, id) + ".");
                            },
                            Math.max(0, data.roles.findIndex(function(r) { return r.id == user.roleId; }))
                        );
                        if (lastAdmin) selRole.setDisabled(1);

                        Label({ text: (role) ? escape(role.description) : "", fontSize: 13, textColor: Ink(0.5) });
                        that.elem.style.flex = "1 1 auto";
                        that.elem.style.minWidth = "0";

                    endGroup();

                    if (lastAdmin) {
                        Label({ text: "This is the last active admin. The role can not be changed.", fontSize: 13, textColor: T.warning, width: "100%" });
                    }

                    // Permissions of the role (read only)
                    VGroup({ width: "100%", height: "auto", align: "left top", gap: 4 });
                    that.elem.style.marginTop = "6px";

                        RolesPage.MODULES.forEach(function(module) {
                            const actions = module.actions.filter(function(action) {
                                return role && role.permissions.includes(module.id + "." + action);
                            }).map(function(action) {
                                return RolesPage.ACTIONS.find(function(a) { return a.id == action; }).name;
                            });
                            createInfoLine(module.name, (actions.length) ? actions.join(", ") : "No access", { textColor: (actions.length) ? Ink(0.9) : Ink(0.35) });
                        });

                    endGroup();

                    Label({ text: "Permissions are changed on the Roles & Permissions page.", fontSize: 12, textColor: Ink(0.4), width: "100%" });

                endGroup();

                // SECURITY
                startSection("Security");

                    createInfoLine("Last login", (user.lastLogin) ? UserListPage.formatDateTime(user.lastLogin) + " <span style='color:" + Ink(0.45) + "'>(" + UserListPage.formatRelative(user.lastLogin) + ")</span>" : "Never");
                    createInfoLine("Two-factor authentication", (user.twoFactor) ? "On" : "Off", { textColor: (user.twoFactor) ? S.ACCENT_COLOR : Ink(0.5) });
                    createInfoLine((user.status == "invited") ? "Invited" : "Member since", UserListPage.formatDate((user.status == "invited") ? user.invitedAt : user.createdAt));
                    if (user.passwordResetAt) createInfoLine("Password reset sent", UserListPage.formatRelative(user.passwordResetAt));

                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                    that.elem.style.marginTop = "6px";
                    that.elem.style.flexWrap = "wrap";

                        if (user.status == "invited") {
                            UserListPage.createButton("Resend Invite", "", function() {
                                saveChange(function(fresh, freshUser) {
                                    if (!freshUser) return "User is not found.";
                                    freshUser.invitedAt = Date.now();
                                    return "";
                                }, "Invite is sent again to " + user.email + ".");
                            });
                        } else {
                            const btnReset = UserListPage.createButton("Send Password Reset", "", function() {
                                saveChange(function(fresh, freshUser) {
                                    if (!freshUser) return "User is not found.";
                                    freshUser.passwordResetAt = Date.now();
                                    return "";
                                }, "Password reset e-mail is sent to " + user.email + ".");
                            });
                            setInteractive(btnReset, user.status == "active");
                        }

                        UserListPage.createButton("E-mail User", "", function() {
                            window.location.href = "mailto:" + encodeURIComponent(user.email);
                        });

                    endGroup();

                endGroup();

            }

        endGroup();

    endBox();

    // GROUP: Buttons (bottom)
    HGroup({ left: 0, bottom: 0, width: "100%", height: 76, align: "left center", gap: 8, padding: [20, 0] });
    that.elem.style.borderTop = "1px solid " + Ink(0.08);

        if (isInvite) {

            Label({ text: "New users get the role you select. It can be changed later.", fontSize: 13, textColor: Ink(0.45) });

        } else {

            const lastAdmin = isLastActiveAdmin(data, user);

            if (user.status == "active") {
                const btnSuspend = UserListPage.createButton("Suspend User", "", function() {
                    Dialog({
                        icon: "assets/warning.png",
                        title: "Suspend User",
                        desc: "<b>" + escape(user.name) + "</b> will be logged out and can not use the panel until you reactivate the account.",
                        confirmButtonText: "Suspend",
                        confirmButtonColor: S.ERROR_COLOR,
                        cancelButtonText: "Cancel",
                        callback: function(isConfirmed) {
                            if (!isConfirmed || !box) return;
                            saveChange(function(fresh, freshUser) {
                                if (!freshUser) return "User is not found.";
                                if (isLastActiveAdmin(fresh, freshUser)) return "At least one active admin must stay.";
                                freshUser.status = "suspended";
                                return "";
                            }, "User is suspended.");
                        },
                    });
                });
                setInteractive(btnSuspend, !lastAdmin);
            }

            if (user.status == "suspended") {
                UserListPage.createButton("Reactivate User", "", function() {
                    saveChange(function(fresh, freshUser) {
                        if (!freshUser) return "User is not found.";
                        freshUser.status = "active";
                        return "";
                    }, "User is active again.");
                }, { primary: 1 });
            }

            const btnRemove = UserListPage.createButton((user.status == "invited") ? "Cancel Invite" : "Remove User", "", function() {
                Dialog({
                    icon: "assets/warning.png",
                    title: (user.status == "invited") ? "Cancel Invite" : "Remove User",
                    desc: (user.status == "invited")
                        ? "The invite link sent to <b>" + escape(user.email) + "</b> will not work anymore."
                        : "<b>" + escape(user.name) + "</b> will be removed from the panel. This can not be undone.",
                    confirmButtonText: (user.status == "invited") ? "Cancel Invite" : "Remove",
                    confirmButtonColor: S.ERROR_COLOR,
                    cancelButtonText: "Keep",
                    callback: function(isConfirmed) {
                        if (!isConfirmed || !box) return;
                        saveChange(function(fresh, freshUser) {
                            if (!freshUser) return "User is not found.";
                            if (isLastActiveAdmin(fresh, freshUser)) return "At least one active admin must stay.";
                            fresh.users.splice(fresh.users.indexOf(freshUser), 1);
                            return "";
                        }, "", -1);
                    },
                });
            });
            setInteractive(btnRemove, !lastAdmin);

            if (lastAdmin) {
                Label({ text: "Last active admin", fontSize: 13, textColor: Ink(0.45) });
            }

        }

    endGroup();

    // *** INIT CODE:

    rightView.clean();
    rightView.setKey(UserListDetails.KEY);
    rightView.setWidth(520);
    rightView.add(box);
    rightView.show();
    rightView.destroyPage = box.destroy;

    return endObject(box);

};

UserListDetails.KEY = "UserListDetails";

// *** STATIC: STYLE AND HELPERS

UserListPage.DAY = 24 * 60 * 60 * 1000;

UserListPage.STYLE = {
    CARD_COLOR: T.surface,
    CARD_BORDER_COLOR: Ink(0.1),
    FIELD_COLOR: T.surface2,
    PRIMARY_COLOR: T.primary,
    ACCENT_COLOR: T.accent,
    ERROR_COLOR: T.danger,
};

UserListPage.STATUSES = {
    active: { label: "Active", color: T.accent },
    invited: { label: "Invited", color: T.warning },
    suspended: { label: "Suspended", color: T.danger },
};

UserListPage.getStatusByLabel = function(label) {
    const id = Object.keys(UserListPage.STATUSES).find(function(key) { return UserListPage.STATUSES[key].label == label; });
    return (id) ? UserListPage.STATUSES[id] : null;
};

UserListPage.getRoleName = function(data, roleId) {
    const role = data.roles.find(function(r) { return r.id == roleId; });
    return (role) ? role.name : "No role";
};

UserListPage.getInitials = function(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(function(part) { return part.charAt(0).toUpperCase(); }).join("");
};

UserListPage.isEmail = function(text) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text);
};

// Local time: "2026-09-16 14:05" (sortable text)
UserListPage.formatDateTime = function(time) {
    const d = new Date(time);
    const pad = function(n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
};

UserListPage.formatDate = function(time) {
    return new Date(time).toLocaleDateString("en-GB", { dateStyle: "medium" });
};

// "5 minutes ago"
UserListPage.formatRelative = function(time) {
    const seconds = Math.round((Date.now() - time) / 1000);
    const units = [["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const unit of units) {
        const value = Math.floor(seconds / unit[1]);
        if (value >= 1) return value + " " + unit[0] + ((value > 1) ? "s" : "") + " ago";
    }
    return "Just now";
};

UserListPage.escapeHtml = function(text) {
    return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
};

// T.accent, 0.2 -> "rgba(101, 162, 147, 0.2)"
UserListPage.alpha = function(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

// params: { primary: 1, width }
UserListPage.createButton = function(text, iconFile, onClick, params = {}) {
    const S = UserListPage.STYLE;
    const btn = ButtonWithIcon({
        width: params.width || "auto",
        labelText: text,
        iconFile: iconFile || "",
        onClick: onClick,
        style: {
            layout: { gap: 8, padding: [14, 8] },
            icon: { width: 18, height: 18 },
            label: { fontSize: 14, textColor: Ink(0.92) },
            box: { color: (params.primary) ? S.PRIMARY_COLOR : S.FIELD_COLOR, border: 1, borderColor: S.CARD_BORDER_COLOR, round: 8 },
            hover: { color: (params.primary) ? T.primaryHover : T.surface3 },
            active: { color: (params.primary) ? T.primaryActive : T.surface4 },
        },
    });
    if (btn.icon) btn.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.
    return btn;
};

// selectedIndex: The first selected item
UserListPage.createTinySelect = function(list, onSelect, selectedIndex = 0) {
    const S = UserListPage.STYLE;
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
        labelTextColor: Ink(0.9),
        arrowIcon: "../../comp-m2/tiny-select/arrow.svg",
        arrowSize: 18,
        invertIconColor: T.invertIcon,
        listFontSize: 14,
        listTextColor: Ink(0.85),
        listOverTextColor: S.ACCENT_COLOR,
        listBackgroundColor: S.FIELD_COLOR,
        listBorderColor: Ink(0.15),
        onSelect: function(index, id) {
            if (isReady) onSelect(id);
        },
    });
    isReady = 1;
    return select;
};

UserListPage.getSmartTableStyle = function(libPath) {
    const S = UserListPage.STYLE;
    return {
        scrollBarParams: {
            bar_border: 0, bar_round: 3, bar_borderColor: Ink(0.15), bar_width: 4, bar_mouseOverWidth: 4,
            bar_mouseOverColor: T.scrollBar, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2, bar_color: T.scrollBar,
            neverHide: 0, showDots: 0,
        },
        // WHY: Filtre kutusu ile alt bar aynı renkti, kutu görünmüyordu. Bar kart rengine, kutu ise alan rengine (FIELD_COLOR) alındı.
        searchInputParams: {
            width: "50%", height: 34, border: 1, round: 8, color: S.FIELD_COLOR, borderColor: S.CARD_BORDER_COLOR,
            borderBottomStyle: "1px solid " + S.CARD_BORDER_COLOR,
            textColor: Ink(0.9), placeholderColor: Ink(0.4), fontSize: 14,
            placeholderText: "Filter the table",
            searchIconSize: 15, searchIconOpacity: 0.55, invertIconColor: T.invertIcon,
            searchIconFile: libPath + "comp-m2/search-input-v2/filter.png",
            clearIconFile: libPath + "comp-m2/search-input-v2/clear.svg",
        },
        // Filtre kutusundaki sütun seçim listesi (ALL) de koyu tema ile açılsın.
        searchTitleMenuParams: {
            minWidth: 170,
            style: {
                menu: { color: S.FIELD_COLOR, border: 1, borderColor: Ink(0.12), round: 8, padding: 4, shadow: "0 8px 24px " + Black(0.5) },
                item: { height: 30, fontSize: 13, textColor: Ink(0.75), color: "transparent", round: 6, padding: 10, gap: 10 },
                itemHover: { textColor: "white", color: Ink(0.08) },
                disabled: { textColor: Ink(0.3), opacity: 0.4 },
                icon: { width: 14, height: 14 },
                separator: { color: Ink(0.1), space: 4 },
            },
        },
        style: {
            width: "100%",
            height: "100%",
            round: 8,
            line1Color: S.CARD_COLOR,
            line2Color: T.tableRow2,
            highlightItemCellColor: T.tableHighlight,
            highlightTitleCellColor: Ink(0.08),
            verticalScrollWidth: 20,
            verticalScrollMargin: 2,
            btnScrollDownIconFile: libPath + "comp-m3/smart-table/down.png",
            btnScrollUpIconFile: libPath + "comp-m3/smart-table/up.png",
            btnScrollCenterIconFile: libPath + "comp-m3/smart-table/scroll.png",
            sortIconFile: libPath + "comp-m3/smart-table/sort.png",
            // WHY: Varsayılan tik ikonu koyu renkli; koyu menüde görünmüyordu.
            searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + S.ACCENT_COLOR + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
            loadingIconFile: libPath + "comp-m3/smart-table/clock.png",
            invertIconColor: T.invertIcon,
            box: { color: S.CARD_COLOR },
            boxBorder: { border: 1, borderColor: S.CARD_BORDER_COLOR },
            boxTitleLine: { color: S.FIELD_COLOR },
            boxTitleCell: { padding: [10, 0], borderRight: "1px solid " + Ink(0.06), borderBottom: "1px solid " + Ink(0.12) },
            lblTitleCell: { fontSize: 13, fontFamily: "opensans", textColor: Ink(0.6) },
            boxItemCell: { borderBottom: "1px solid " + Ink(0.05), borderRight: "1px solid " + Ink(0.03), padding: [10, 0] },
            lblItemCell: { fontSize: 14, textColor: Ink(0.75), fontFamily: "opensans" },
            boxInfoLine: { color: S.CARD_COLOR, borderTop: "1px solid " + Ink(0.08) },
            lblBoxInfoLine: { fontSize: 13, textColor: Ink(0.55) },
            lblNoDataFound: { color: T.surface3, textColor: Ink(0.6), padding: [8, 2], fontSize: 13, round: 8, border: 1, borderColor: Ink(0.15) },
            // Filtre kutusunun içindeki sütun etiketi: Kutunun içinde durduğu için daha hafif bir chip.
            lblSearchTitle: { color: Ink(0.08), textColor: Ink(0.6), padding: [8, 1], fontSize: 12, round: 6, border: 1, borderColor: Ink(0.14) },
            btnScrollCenter: { color: T.surface3, round: 100, borderColor: Ink(0.2), border: 1 },
            btnScrollUp: { color: T.surface4, round: 100, border: 1, borderColor: Ink(0.3) },
            btnScrollDown: { color: T.surface4, round: 100, border: 1, borderColor: Ink(0.3) },
            boxSort: { color: S.PRIMARY_COLOR },
        },
    };
};

// *** STATIC: USER DATA

// Users and roles of the Roles & Permissions page, with the extra fields of this page.
// TODO: Load the users from your service.
UserListPage.load = function() {
    const data = RolesPage.load();
    data.users.forEach(UserListPage.addMissingFields);
    // The signed in user: two-factor authentication comes from Settings > Account.
    // WHY: The user menu (pages/user-actions.js) reads it from Settings. The same value must not have two sources.
    if (typeof SettingsPage !== "undefined") {
        const settings = SettingsPage.load();
        const me = data.users.find(function(user) { return user.email.toLowerCase() == String(settings.email).toLowerCase(); });
        if (me) me.twoFactor = (settings.twoFactor) ? 1 : 0;
    }
    return data;
};

// TODO: Save with your service.
UserListPage.save = function(data) {
    RolesPage.save(data);
};

UserListPage.getNextId = function(data) {
    return data.users.reduce(function(max, user) { return Math.max(max, user.id); }, 0) + 1;
};

UserListPage.createInvitedUser = function(id, name, email, roleId) {
    return { id: id, name: name, email: email, roleId: roleId, status: "invited", invitedAt: Date.now(), createdAt: Date.now(), lastLogin: 0, twoFactor: 0 };
};

// Test values for the users of the Roles page (they have only id, name, email and roleId).
// WHY: Values come from the user id, so they are the same every time.
UserListPage.addMissingFields = function(user) {

    if (user.status) return user;

    const DAY = UserListPage.DAY;
    const now = Date.now();
    const rnd = function(n) {
        const x = Math.sin(user.id * 9301 + n * 49297) * 233280;
        return x - Math.floor(x);
    };

    // A few invited and suspended users (not the first two admins)
    const statusByUser = { 5: "invited", 11: "suspended", 12: "invited" };
    user.status = statusByUser[user.id] || "active";

    user.createdAt = now - Math.round((30 + rnd(1) * 600) * DAY);
    user.invitedAt = (user.status == "invited") ? now - Math.round((1 + rnd(2) * 6) * DAY) : user.createdAt;
    user.lastLogin = (user.status == "invited") ? 0 : now - Math.round(rnd(3) * ((user.status == "suspended") ? 60 : 12) * DAY + rnd(4) * DAY);
    user.twoFactor = (user.status != "invited" && (user.roleId == "admin" || rnd(5) > 0.5)) ? 1 : 0; // WHY: Invited users did not log in yet.
    user.passwordResetAt = 0;

    return user;

};
