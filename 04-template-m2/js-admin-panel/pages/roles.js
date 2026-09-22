/* Bismillah */

/*

Roles & Permissions Page (Template) - v26.09

- Roles of the panel users and what each role can do.
- A permission matrix (module x action), role members, new / duplicate / delete role.
- Changes are kept in a draft. A bar at the bottom shows "unsaved changes" with Discard and Save.
- Rules:
  - "Create", "Edit" and "Delete" need "View". (Checking them checks "View"; unchecking "View" unchecks them.)
  - System roles can not be deleted. The permissions of "Admin" can not be changed.
  - "Admin" must have at least one member. Removed members get the default role ("Viewer").
- Test data is saved to the browser (basic.storage). Replace RolesPage.load() and RolesPage.save()
  with your service calls. NOTE: Always check the permissions on the server too.

COMPONENTS:
- ButtonWithIcon (comp-m3): Role list, actions
- InputB (comp-m2): Role name and description
- TextTabs (comp-m2): Permissions / Members
- CheckBox (comp-m3): Permission matrix
- TinySelect (comp-m2): Add a member
- SearchInput (comp-m2): Filter members
- ContextMenu (comp-m4): Role actions
- Dialog, Waiting (comp-m2): Confirm, save

*/

RolesPageDefaults = {
    color: "transparent",
};

const RolesPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, RolesPageDefaults, mainView);

    mainView.setKey(RolesPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";

    const CARD_COLOR = T.surface;
    const CARD_BORDER_COLOR = Ink(0.1);
    const FIELD_COLOR = T.surface2;
    const PRIMARY_COLOR = T.primary;
    const ACCENT_COLOR = T.accent;
    const SELECTED_COLOR = "rgba(101, 162, 147, 0.18)";
    const ERROR_COLOR = T.danger;

    const MODULES = RolesPage.MODULES;
    const ACTIONS = RolesPage.ACTIONS;

    let data = RolesPage.load(); // { roles, users }
    let selectedRoleId = data.roles[0].id;
    let draft = null; // Selected role + memberIds, changed by the user
    let saved = null; // Same shape, as it is saved (to find changes)

    let memberSearch = "";
    let saveTimer = null;
    let isRendering = 0; // WHY: Component setters call onChange. Values written by code are not user changes.

    // Components
    let grpRoleList, lblRoleCount;
    let inputName, inputDescription, lblSystemInfo, btnRoleMenu, roleMenu;
    let tabs, grpPermissionsCard, grpMatrixHost, lblPermissionCount;
    let grpMembersCard, grpMembersHost, addMemberSelect;
    let matrixChecks = {}; // "users.edit" -> CheckBox
    let rowChecks = {}; // "users" -> CheckBox
    let columnChecks = {}; // "edit" -> CheckBox
    let footer, lblFooter, btnDiscard, btnSave;

    // *** PRIVATE FUNCTIONS:

    const clone = function(value) {
        return JSON.parse(JSON.stringify(value));
    };

    const getRole = function(id) {
        return data.roles.find(function(role) { return role.id == id; });
    };

    const getMemberIds = function(roleId) {
        return data.users.filter(function(user) { return user.roleId == roleId; }).map(function(user) { return user.id; });
    };

    const createDraft = function(roleId) {
        const role = clone(getRole(roleId));
        role.memberIds = getMemberIds(roleId);
        return role;
    };

    const isDirty = function() {
        return JSON.stringify(draft) != JSON.stringify(saved);
    };

    const isPermissionLocked = function() {
        return draft.isLocked == 1;
    };

    const hasPermission = function(key) {
        return draft.permissions.includes(key);
    };

    // Sets one permission with the "View" rule.
    const setPermission = function(moduleId, action, value) {

        const module = MODULES.find(function(m) { return m.id == moduleId; });
        const set = new Set(draft.permissions);
        const key = moduleId + "." + action;

        if (value) {
            set.add(key);
            if (action != "view") set.add(moduleId + ".view"); // WHY: Create, edit and delete need view.
        } else {
            set.delete(key);
            if (action == "view") {
                module.actions.forEach(function(a) { set.delete(moduleId + "." + a); });
            }
        }

        // WHY: Keep the order of the matrix, so the JSON compare (isDirty) does not see a change by order.
        draft.permissions = RolesPage.getAllPermissionKeys().filter(function(k) { return set.has(k); });

    };

    const uniqueRoleName = function(name) {
        let result = name;
        let index = 2;
        while (data.roles.some(function(role) { return role.name.toLowerCase() == result.toLowerCase(); })) {
            result = name + " " + index++;
        }
        return result;
    };

    // Asks before losing unsaved changes.
    const confirmDiscard = function(onConfirm) {
        if (!isDirty()) return onConfirm();
        Dialog({
            icon: ASSETS + "warning.png",
            title: "Discard Changes?",
            desc: "You have unsaved changes in <b>" + escapeHtml(saved.name) + "</b>.",
            confirmButtonText: "Discard",
            confirmButtonColor: ERROR_COLOR,
            callback: function(isConfirmed) {
                if (isConfirmed && box) onConfirm();
            },
        });
    };

    const selectRole = function(roleId) {
        selectedRoleId = roleId;
        saved = createDraft(roleId);
        draft = clone(saved);
        memberSearch = "";
        renderAll();
    };

    // *** ROLE ACTIONS:

    const createRole = function(copyFrom) {

        const role = {
            id: "role-" + Date.now(),
            name: uniqueRoleName((copyFrom) ? copyFrom.name + " (copy)" : "New Role"),
            description: (copyFrom) ? copyFrom.description : "",
            isSystem: 0,
            isLocked: 0,
            permissions: (copyFrom) ? copyFrom.permissions.slice() : ["dashboard.view"],
        };

        // TODO: Create the role with your service.
        data.roles.push(role);
        RolesPage.save(data);

        selectRole(role.id);

        // Ready to rename
        inputName.input.inputElement.focus();
        inputName.input.inputElement.select();

    };

    const deleteRole = function(role) {

        const memberCount = getMemberIds(role.id).length;

        Dialog({
            icon: ASSETS + "warning.png",
            title: "Delete Role",
            desc: "<b>" + escapeHtml(role.name) + "</b> will be deleted." + ((memberCount) ? " Its " + memberCount + " member" + ((memberCount > 1) ? "s" : "") + " will get the <b>Viewer</b> role." : ""),
            confirmButtonText: "Delete",
            confirmButtonColor: ERROR_COLOR,
            callback: function(isConfirmed) {
                if (!isConfirmed || !box) return;
                // TODO: Delete the role with your service.
                data.users.forEach(function(user) { if (user.roleId == role.id) user.roleId = RolesPage.DEFAULT_ROLE_ID; });
                data.roles = data.roles.filter(function(r) { return r.id != role.id; });
                RolesPage.save(data);
                selectRole(data.roles[0].id);
            },
        });

    };

    // Returns an error text, or "".
    const validate = function() {
        const name = draft.name.trim();
        if (!name) return "Role name is required.";
        if (data.roles.some(function(role) { return role.id != draft.id && role.name.toLowerCase() == name.toLowerCase(); })) return "Another role has the name \"" + escapeHtml(name) + "\".";
        if (draft.id == "admin" && draft.memberIds.length == 0) return "Admin must have at least one member.";
        return "";
    };

    const saveRole = function() {

        const error = validate();
        if (error) return showFooterMessage(error, ERROR_COLOR);

        btnSave.elem.inert = true;
        if (typeof waiting !== "undefined") waiting.show();

        // TEST: Like a server request
        saveTimer = setTimeout(function() {

            if (!box) return;

            // TODO: Save the role and the members with your service.
            const role = getRole(draft.id);
            role.name = draft.name.trim();
            role.description = draft.description.trim();
            role.permissions = draft.permissions.slice();

            data.users.forEach(function(user) {
                const isMember = draft.memberIds.includes(user.id);
                if (isMember) user.roleId = role.id;
                else if (user.roleId == role.id) user.roleId = RolesPage.DEFAULT_ROLE_ID; // Removed members
            });

            RolesPage.save(data);

            if (typeof waiting !== "undefined") waiting.hide();
            btnSave.elem.inert = false;

            selectRole(role.id);
            showFooterMessage("Changes are saved.", ACCENT_COLOR, 1);

        }, 500);

    };

    // *** RENDER:

    // Creates the content of a container again. (One group is started and ended in it.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. After more than one
    // top-level object, the next objects were created in another container. One wrapper group is safe.
    const renderInto = function(container, buildContent, gap = 0) {
        if (container.wrapper) container.wrapper.remove();
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: gap });
                buildContent();
            endGroup();
        setDefaultContainerBox(previous);
    };

    const renderAll = function() {
        renderRoleList();
        renderRoleHeader();
        renderMatrix();
        renderMembers();
        updateFooter();
    };

    const renderRoleList = function() {

        lblRoleCount.text = data.roles.length + " roles";

        renderInto(grpRoleList, function() {

            data.roles.forEach(function(role) {

                const isSelected = role.id == selectedRoleId;
                const memberCount = getMemberIds(role.id).length;
                const tag = (role.isSystem) ? " <span style='font-size:11px; padding:1px 6px; border-radius:6px; background:" + Ink(0.08) + "; color:" + Ink(0.55) + "'>SYSTEM</span>" : "";

                ButtonWithIcon({
                    width: "100%",
                    labelText: escapeHtml(role.name) + tag + "<br><span style='font-size:12px; color:" + Ink(0.45) + "'>" + memberCount + " member" + ((memberCount == 1) ? "" : "s") + " · " + role.permissions.length + " permissions</span>",
                    iconFile: "",
                    onClick: function() {
                        if (role.id == selectedRoleId) return;
                        confirmDiscard(function() { selectRole(role.id); });
                    },
                    style: {
                        layout: { gap: 8, padding: [12, 8], align: "left center" },
                        label: { fontSize: 15, textColor: Ink(0.92) },
                        box: { color: (isSelected) ? SELECTED_COLOR : "transparent", border: 0, round: 8 },
                        hover: { color: (isSelected) ? SELECTED_COLOR : Ink(0.06) },
                        active: { color: Ink(0.1) },
                    },
                });
                that.label.elem.style.whiteSpace = "normal";
                that.label.elem.style.lineHeight = "20px";
                that.elem.setAttribute("aria-current", (isSelected) ? "true" : "false");

            });

        }, 4);

    };

    const renderRoleHeader = function() {

        isRendering = 1;
        inputName.setInputValue(draft.name);
        inputDescription.setInputValue(draft.description);
        isRendering = 0;

        const canDelete = !draft.isSystem;
        roleMenu.setItemEnabled("delete", canDelete);

        lblSystemInfo.visible = (draft.isSystem) ? 1 : 0;
        lblSystemInfo.text = (draft.isLocked)
            ? "🔒 System role. It has all permissions and can not be changed or deleted."
            : "System role. It can be changed, but not deleted. New users get this role.";

        // Admin name is also locked.
        setInteractive(inputName, !draft.isLocked);

    };

    const renderMatrix = function() {

        matrixChecks = {};
        rowChecks = {};
        columnChecks = {};

        const COLUMN_WIDTH = 96;

        renderInto(grpMatrixHost, function() {

            // Header
            HGroup({ width: "100%", height: 44, align: "left center", color: FIELD_COLOR, round: 8, padding: [14, 0] });

                Label({ text: "MODULE", fontSize: 12, textColor: Ink(0.5) });
                that.elem.style.flex = "1 1 auto";
                that.elem.style.letterSpacing = "1px";

                ACTIONS.forEach(function(action) {
                    HGroup({ width: COLUMN_WIDTH, height: "auto", align: "center center" });
                        columnChecks[action.id] = createCheckBox(action.name, function(self) {
                            // Toggle the column
                            MODULES.forEach(function(module) {
                                if (module.actions.includes(action.id)) setPermission(module.id, action.id, self.checked);
                            });
                            afterPermissionChange();
                        }, 12);
                        columnChecks[action.id].label.textColor = Ink(0.5);
                    endGroup();
                });

            endGroup();

            // Rows
            MODULES.forEach(function(module, index) {

                HGroup({ width: "100%", height: "auto", align: "left center", padding: [14, 12] });
                that.elem.style.borderBottom = (index < MODULES.length - 1) ? "1px solid " + Ink(0.06) : "none";

                    HGroup({ width: "auto", height: "auto", align: "left center", gap: 12 });
                    that.elem.style.flex = "1 1 auto";
                    that.elem.style.minWidth = "0";

                        // Toggle the row
                        rowChecks[module.id] = createCheckBox("", function(self) {
                            module.actions.forEach(function(action) { setPermission(module.id, action, self.checked); });
                            afterPermissionChange();
                        });

                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                            Label({ text: module.name, fontSize: 15, textColor: Ink(0.92) });
                            Label({ text: module.desc, fontSize: 12, textColor: Ink(0.45) });
                        endGroup();

                    endGroup();

                    ACTIONS.forEach(function(action) {
                        HGroup({ width: COLUMN_WIDTH, height: "auto", align: "center center" });
                            if (module.actions.includes(action.id)) {
                                const key = module.id + "." + action.id;
                                matrixChecks[key] = createCheckBox("", function(self) {
                                    setPermission(module.id, action.id, self.checked);
                                    afterPermissionChange();
                                });
                                matrixChecks[key].elem.setAttribute("aria-label", module.name + ": " + action.name);
                            } else {
                                Label({ text: "—", fontSize: 14, textColor: Ink(0.2) });
                                that.elem.title = "Not used for this module";
                            }
                        endGroup();
                    });

                endGroup();

            });

        });

        const locked = isPermissionLocked();
        setInteractive(grpMatrixHost, !locked, 0.55);

        updateMatrixChecks();

    };

    // Writes the draft permissions to the check boxes (row and column checks too).
    const updateMatrixChecks = function() {

        Object.keys(matrixChecks).forEach(function(key) {
            matrixChecks[key].setChecked(hasPermission(key) ? 1 : 0, 1);
        });

        MODULES.forEach(function(module) {
            const all = module.actions.every(function(action) { return hasPermission(module.id + "." + action); });
            rowChecks[module.id].setChecked(all ? 1 : 0, 1);
        });

        ACTIONS.forEach(function(action) {
            const modules = MODULES.filter(function(module) { return module.actions.includes(action.id); });
            const all = modules.every(function(module) { return hasPermission(module.id + "." + action.id); });
            columnChecks[action.id].setChecked(all ? 1 : 0, 1);
        });

        const total = RolesPage.getAllPermissionKeys().length;
        lblPermissionCount.text = draft.permissions.length + " of " + total + " permissions";

    };

    const afterPermissionChange = function() {
        updateMatrixChecks();
        updateFooter();
    };

    const renderMembers = function() {

        const members = draft.memberIds.map(function(id) { return data.users.find(function(user) { return user.id == id; }); }).filter(Boolean);
        const search = memberSearch.trim().toLowerCase();
        const shown = members.filter(function(user) {
            return !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
        });

        tabs.tabItemList[1].text = "Members (" + members.length + ")";

        // Add member: users that are not in the draft
        const others = data.users.filter(function(user) { return !draft.memberIds.includes(user.id); });
        isRendering = 1;
        addMemberSelect.setList([{ id: "", label: "Add a member..." }].concat(others.map(function(user) {
            const role = getRole(user.roleId);
            return { id: String(user.id), label: escapeHtml(user.name + " (" + ((role) ? role.name : "—") + ")") };
        })), 0);
        isRendering = 0;

        const isDefaultRole = draft.id == RolesPage.DEFAULT_ROLE_ID;

        renderInto(grpMembersHost, function() {

            if (shown.length == 0) {
                Label({
                    text: (members.length) ? "No member matches the search." : "This role has no members yet.",
                    width: "100%",
                    fontSize: 14,
                    textColor: Ink(0.5),
                    textAlign: "center",
                    padding: [16, 30],
                });
                return;
            }

            shown.forEach(function(user, index) {

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 12, padding: [4, 10] });
                if (index < shown.length - 1) that.elem.style.borderBottom = "1px solid " + Ink(0.06);

                    // Avatar (initials)
                    Label({
                        text: user.name.split(" ").map(function(part) { return part[0]; }).join("").slice(0, 2).toUpperCase(),
                        width: 38,
                        height: 38,
                        fontSize: 14,
                        textAlign: "center",
                        textColor: Ink(0.95),
                        color: RolesPage.getAvatarColor(user.id),
                        round: 100,
                    });
                    that.elem.style.lineHeight = "38px";
                    that.elem.style.flexShrink = "0";

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                    that.elem.style.flex = "1 1 auto";
                    that.elem.style.minWidth = "0";
                        Label({ text: escapeHtml(user.name), fontSize: 15, textColor: Ink(0.92) });
                        Label({ text: escapeHtml(user.email), fontSize: 12, textColor: Ink(0.45) });
                    endGroup();

                    // WHY: Everybody must have a role. Members of the default role can only move to another role.
                    if (!isDefaultRole) {
                        const isLastAdmin = draft.id == "admin" && draft.memberIds.length == 1;
                        const btn = createButton("Remove", "", function() {
                            draft.memberIds = draft.memberIds.filter(function(id) { return id != user.id; });
                            renderMembers();
                            updateFooter();
                        });
                        if (isLastAdmin) setInteractive(btn, false);
                        btn.elem.title = (isLastAdmin) ? "Admin must have at least one member" : "The user gets the Viewer role";
                    }

                endGroup();

            });

        });

    };

    // *** FOOTER:

    const updateFooter = function() {

        if (!footer) return;

        if (isDirty()) {
            lblFooter.text = "You have unsaved changes in <b>" + escapeHtml(saved.name) + "</b>.";
            lblFooter.textColor = Ink(0.85);
            btnDiscard.visible = 1;
            btnSave.visible = 1;
            showFooter(1);
        } else if (!footer.messageTimer) {
            showFooter(0);
        }

    };

    const showFooterMessage = function(text, color, autoHide = 0) {

        clearTimeout(footer.messageTimer);
        footer.messageTimer = null;

        lblFooter.text = text;
        lblFooter.textColor = color;
        btnDiscard.visible = (isDirty()) ? 1 : 0;
        btnSave.visible = (isDirty()) ? 1 : 0;
        showFooter(1);

        if (autoHide) {
            footer.messageTimer = setTimeout(function() {
                if (!box) return;
                footer.messageTimer = null;
                updateFooter();
            }, 2000);
        }

    };

    const showFooter = function(show) {
        footer.visible = (show) ? 1 : 0;
    };

    // *** VIEW HELPERS:

    // WHY: Some components have no enabled setting. "inert" blocks the mouse and keyboard for all the children.
    const setInteractive = function(obj, enabled, disabledOpacity = 0.4) {
        obj.elem.inert = !enabled;
        obj.opacity = (enabled) ? 1 : disabledOpacity;
    };

    const escapeHtml = function(text) {
        return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
    };

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    const startCard = function(params = {}) {
        return VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 14,
            padding: 16,
            color: CARD_COLOR,
            border: 1,
            borderColor: CARD_BORDER_COLOR,
            round: 12,
            ...params,
        });
    };

    const createCheckBox = function(labelText, onChange, fontSize = 14) {
        return CheckBox({
            labelText: labelText,
            labelPosition: "right",
            style: {
                layout: { gap: 8, padding: [0, 0] },
                mark: { width: 20, height: 20, color: "transparent", borderColor: Ink(0.35) },
                checkedMark: { color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
                hoverMark: { borderColor: Ink(0.7) },
                tick: { color: Ink(1) },
                label: { fontSize: fontSize, textColor: Ink(0.9) },
            },
            onChange: function(self) {
                if (isRendering) return;
                onChange(self);
            },
        });
    };

    const createButton = function(text, iconFile, onClick, params = {}) {
        const btn = ButtonWithIcon({
            width: params.width || "auto",
            labelText: text,
            iconFile: (iconFile) ? ASSETS + iconFile : "",
            onClick: onClick,
            style: {
                layout: { gap: 8, padding: [14, 8] },
                icon: { width: 18, height: 18 },
                label: { fontSize: 14, textColor: Ink(0.92) },
                box: { color: (params.primary) ? PRIMARY_COLOR : FIELD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                hover: { color: (params.primary) ? T.primaryHover : T.surface3 },
                active: { color: (params.primary) ? T.primaryActive : T.surface4 },
            },
        });
        if (btn.icon) btn.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.
        return btn;
    };

    // Dark style for InputB
    const createInput = function(params) {
        const input = InputB({
            width: "100%",
            leftPadding: 14,
            rightPadding: 36,
            backgroundColor: FIELD_COLOR,
            selectedBackgroundColor: T.surface3,
            lineColor: "transparent",
            selectedLineColor: "transparent",
            backBorderColor: CARD_BORDER_COLOR,
            selectedBackBorderColor: ACCENT_COLOR,
            backBorderTopRound: 8,
            backBorderBottomRound: 8,
            requiredColor: ERROR_COLOR,
            warningColor: ERROR_COLOR,
            ...params,
        });
        // WHY: InputB has fixed text colors for light backgrounds.
        input.title.textColor = Ink(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = Ink(0.9);
        input.input.fontSize = 16;
        input.input.height = 34;
        input.warningBall.borderColor = CARD_COLOR;
        return input;
    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearTimeout(saveTimer);
        if (footer) clearTimeout(footer.messageTimer);
        if (saveTimer && typeof waiting !== "undefined") waiting.hide();

        // WHY: The menu is created on the page. box.remove() does not remove it.
        if (roleMenu) roleMenu.remove();

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    const initHeader = function() {

        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.flexWrap = "wrap";
        that.elem.style.justifyContent = "space-between";

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: "Roles & Permissions", fontSize: 26, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                Label({ text: "Control what each role can see and do in the panel", fontSize: 14, textColor: Ink(0.5) });

            endGroup();

            createButton("New Role", "top-bar/add.png", function() {
                confirmDiscard(function() { createRole(null); });
            }, { primary: 1 });

        endGroup();

    };

    const initSidebar = function() {

        const sidebar = startCard({ gap: 8, padding: 8 });
        setFlex(sidebar, "0 0 280px");

            HGroup({ width: "100%", height: "auto", align: "left center", padding: [8, 6] });
            that.elem.style.justifyContent = "space-between";
                Label({ text: "ROLES", fontSize: 11, textColor: Ink(0.45) });
                that.elem.style.letterSpacing = "1px";
                lblRoleCount = Label({ text: "", fontSize: 12, textColor: Ink(0.45) });
            endGroup();

            grpRoleList = VGroup({ width: "100%", height: "auto", align: "left top" });
            endGroup();

        endGroup();

    };

    const initRoleHeader = function() {

        startCard();

            HGroup({ width: "100%", height: "auto", align: "left top", gap: 12 });

                inputName = createInput({
                    titleText: "ROLE NAME",
                    placeholder: "Ex: Editor",
                    maxChar: 40,
                    onEdit: function() {
                        if (isRendering) return;
                        draft.name = inputName.getInputValue();
                        updateFooter();
                    },
                });
                setFlex(inputName, "1 1 auto");

                // BUTTON: Role actions
                btnRoleMenu = createButton("•••", "", function() { });
                btnRoleMenu.elem.setAttribute("aria-label", "Role actions");
                btnRoleMenu.elem.style.marginTop = "12px";

            endGroup();

            inputDescription = createInput({
                titleText: "DESCRIPTION",
                placeholder: "What is this role for? (Optional)",
                maxChar: 120,
                onEdit: function() {
                    if (isRendering) return;
                    draft.description = inputDescription.getInputValue();
                    updateFooter();
                },
            });

            lblSystemInfo = Label({ text: "", fontSize: 13, textColor: Ink(0.6), color: Ink(0.05), round: 8, padding: [12, 8], width: "100%" });

        endGroup();

        // MENU: Role actions
        roleMenu = ContextMenu({
            items: [
                { text: "Duplicate role", key: "duplicate" },
                "-",
                { text: "Delete role...", key: "delete" },
            ],
            onClick: function(self, item) {
                const role = getRole(selectedRoleId);
                if (item.key == "duplicate") confirmDiscard(function() { createRole(role); });
                if (item.key == "delete") deleteRole(role);
            },
            style: {
                menu: { color: FIELD_COLOR, borderColor: Ink(0.12), shadow: "0px 8px 24px " + Black(0.5) },
                item: { textColor: Ink(0.85) },
                itemHover: { textColor: Ink(1), color: Ink(0.08) },
                disabled: { textColor: Ink(0.3) },
                separator: { color: Ink(0.1) },
            },
        });
        roleMenu.attachTo(btnRoleMenu, "click");

    };

    const initTabs = function() {

        tabs = TextTabs({
            tabList: ["Permissions", "Members (0)"],
            onClick: function(self) {
                grpPermissionsCard.visible = (self.index == 0) ? 1 : 0;
                grpMembersCard.visible = (self.index == 1) ? 1 : 0;
            },
            backgroundStyle: { colorBottom: CARD_COLOR, colorTop: CARD_COLOR, round: 10, border: 1, borderColor: CARD_BORDER_COLOR },
            tabPadding: [4, 4],
            labelStyle: { fontSize: 14, textColor: Ink(0.85), padding: [16, 7] },
            selectedStyle: { color: PRIMARY_COLOR, round: 7 },
        });

    };

    const initPermissionsCard = function() {

        grpPermissionsCard = startCard({ gap: 12 });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 12 });
            that.elem.style.justifyContent = "space-between";
            that.elem.style.flexWrap = "wrap";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                    Label({ text: "Permissions", fontSize: 16, textColor: Ink(0.95) });
                    that.elem.style.fontFamily = "opensans-bold";
                    Label({ text: "Create, edit and delete need view. Use the row and column boxes to select many.", fontSize: 12, textColor: Ink(0.45) });
                endGroup();

                lblPermissionCount = Label({ text: "", fontSize: 13, textColor: ACCENT_COLOR });

            endGroup();

            // GROUP: Matrix (horizontal scroll on small widths)
            HGroup({ width: "100%", height: "auto", align: "left top" });
            that.elem.style.overflowX = "auto";

                grpMatrixHost = VGroup({ width: "100%", height: "auto", align: "left top" });
                grpMatrixHost.elem.style.minWidth = "620px";
                endGroup();

            endGroup();

        endGroup();

    };

    const initMembersCard = function() {

        grpMembersCard = startCard({ gap: 12 });

            HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
            that.elem.style.flexWrap = "wrap";

                SearchInput({
                    width: 260,
                    height: 40,
                    border: 1,
                    borderColor: CARD_BORDER_COLOR,
                    borderBottomStyle: "1px solid " + CARD_BORDER_COLOR,
                    round: 8,
                    color: FIELD_COLOR,
                    textColor: Ink(0.9),
                    fontSize: 14,
                    searchIconSize: 16,
                    placeholderText: "Search members",
                    invertIconColor: T.invertIcon,
                    searchIconFile: LIB_PATH + "comp-m2/search-input-v2/search.svg",
                    clearIconFile: LIB_PATH + "comp-m2/search-input-v2/clear.svg",
                    onSearch: function(text) {
                        memberSearch = text;
                        renderMembers();
                    },
                });
                that.position = "relative";

                // Space
                HGroup({ width: "auto", height: 1 });
                that.elem.style.flex = "1 1 auto";
                endGroup();

                addMemberSelect = TinySelect({
                    list: [{ id: "", label: "Add a member..." }],
                    height: 40,
                    fontSize: 14,
                    color: FIELD_COLOR,
                    border: 1,
                    borderColor: CARD_BORDER_COLOR,
                    round: 8,
                    labelBoldFont: 0,
                    labelTextColor: Ink(0.9),
                    arrowIcon: LIB_PATH + "comp-m2/tiny-select/arrow.svg",
                    arrowSize: 18,
                    invertIconColor: T.invertIcon,
                    listFontSize: 14,
                    listTextColor: Ink(0.85),
                    listOverTextColor: ACCENT_COLOR,
                    listBackgroundColor: FIELD_COLOR,
                    listBorderColor: Ink(0.15),
                    onSelect: function(index, id) {
                        if (isRendering || !id || !draft) return;
                        draft.memberIds.push(Number(id));
                        renderMembers();
                        updateFooter();
                    },
                });

            endGroup();

            Label({ text: "A user has one role. Adding a user here moves them from their current role. Removed members get the Viewer role.", fontSize: 12, textColor: Ink(0.45), width: "100%" });

            grpMembersHost = VGroup({ width: "100%", height: "auto", align: "left top" });
            endGroup();

        endGroup();

    };

    const initFooter = function() {

        footer = HGroup({
            width: "100%",
            height: "auto",
            align: "center center",
            padding: [24, 20],
        });
        footer.bottom = 0;

            HGroup({
                width: "100%",
                height: "auto",
                align: "left center",
                gap: 10,
                padding: [20, 12],
                color: T.surface3,
                border: 1,
                borderColor: Ink(0.15),
                round: 12,
                clickable: 1,
            });
            that.elem.style.maxWidth = "960px";
            that.elem.style.boxShadow = "0 8px 24px " + Black(0.5);

                lblFooter = Label({ text: "", fontSize: 14, textColor: Ink(0.85) });
                setFlex(lblFooter, "1 1 auto");

                btnDiscard = createButton("Discard", "", function() {
                    draft = clone(saved);
                    renderAll();
                });

                btnSave = createButton("Save Changes", "", saveRole, { primary: 1 });

            endGroup();

        endGroup();

        // WHY: Hidden after the content is created. Objects created in a hidden (display: none) group are not flex items.
        footer.visible = 0;

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
            padding: [24, 24, 24, 110], // Bottom: space for the footer
        });

            initHeader();

            HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
            that.elem.style.flexWrap = "wrap";

                initSidebar();

                const main = VGroup({ width: "auto", height: "auto", align: "left top", gap: 14 });
                setFlex(main, "1 1 560px");

                    initRoleHeader();
                    initTabs();
                    initPermissionsCard();
                    initMembersCard();

                endGroup();

            endGroup();

        endGroup();

    endBox();

    initFooter();

    // WHY: Hidden after the content is created.
    grpMembersCard.visible = 0;

    selectRole(selectedRoleId);

    return box.endPage();

};

RolesPage.KEY = "Roles";

// *** STATIC:

RolesPage.STORAGE_KEY = "adminPanel.roles";
RolesPage.DEFAULT_ROLE_ID = "viewer";

RolesPage.ACTIONS = [
    { id: "view", name: "View" },
    { id: "create", name: "Create" },
    { id: "edit", name: "Edit" },
    { id: "delete", name: "Delete" },
];

// actions: The actions that are used for the module.
RolesPage.MODULES = [
    { id: "dashboard", name: "Dashboard", desc: "Home page and summary", actions: ["view"] },
    { id: "reports", name: "Reports", desc: "Sales reports and exports", actions: ["view"] },
    { id: "users", name: "Users", desc: "Customer accounts", actions: ["view", "create", "edit", "delete"] },
    { id: "contents", name: "Contents", desc: "Pages, posts and products", actions: ["view", "create", "edit", "delete"] },
    { id: "media", name: "Media Library", desc: "Images and files", actions: ["view", "create", "edit", "delete"] },
    { id: "roles", name: "Roles & Permissions", desc: "This page", actions: ["view", "edit"] },
    { id: "settings", name: "Settings", desc: "Panel and account settings", actions: ["view", "edit"] },
];

// "dashboard.view", "users.view", "users.create", ...
RolesPage.getAllPermissionKeys = function() {
    const keys = [];
    RolesPage.MODULES.forEach(function(module) {
        module.actions.forEach(function(action) { keys.push(module.id + "." + action); });
    });
    return keys;
};

RolesPage.getDefaultData = function() {

    const all = RolesPage.getAllPermissionKeys();
    const viewOnly = all.filter(function(key) { return key.endsWith(".view") && !key.startsWith("roles.") && !key.startsWith("settings."); });

    return {
        roles: [
            { id: "admin", name: "Admin", description: "Full access to everything.", isSystem: 1, isLocked: 1, permissions: all },
            { id: "editor", name: "Editor", description: "Manages contents and media.", isSystem: 0, isLocked: 0,
                permissions: ["dashboard.view", "reports.view", "users.view", "contents.view", "contents.create", "contents.edit", "contents.delete", "media.view", "media.create", "media.edit", "media.delete"] },
            { id: "support", name: "Support", description: "Helps customers with their accounts.", isSystem: 0, isLocked: 0,
                permissions: ["dashboard.view", "users.view", "users.edit", "contents.view"] },
            { id: "marketing", name: "Marketing", description: "Campaigns, banners and reports.", isSystem: 0, isLocked: 0,
                permissions: ["dashboard.view", "reports.view", "contents.view", "contents.edit", "media.view", "media.create", "media.edit"] },
            { id: "viewer", name: "Viewer", description: "Can see, but can not change anything.", isSystem: 1, isLocked: 0, permissions: viewOnly },
        ],
        users: [
            { id: 1, name: "Bugra Ozden", email: "bugra.ozden@gmail.com", roleId: "admin" },
            { id: 2, name: "Alper Kaya", email: "a.kaya@company.net", roleId: "admin" },
            { id: 3, name: "Deniz Arslan", email: "deniz_arslan@studio.com", roleId: "editor" },
            { id: 4, name: "Ceren Aktas", email: "ceren.aktas@webco.com", roleId: "editor" },
            { id: 5, name: "Zeynep Karaca", email: "zkaraca@brandworks.com", roleId: "marketing" },
            { id: 6, name: "Selin Koc", email: "selin.koc@analytics.io", roleId: "marketing" },
            { id: 7, name: "Duygu Sahin", email: "duygu.sahin@testlab.com", roleId: "support" },
            { id: 8, name: "Kemal Aydin", email: "kemal_aydin@securelab.com", roleId: "support" },
            { id: 9, name: "Pinar Erdogan", email: "p.erdogan@people.io", roleId: "support" },
            { id: 10, name: "Nilufer Celik", email: "n.celik@datahouse.org", roleId: "viewer" },
            { id: 11, name: "Frank Weber", email: "frank.weber@infrateam.de", roleId: "viewer" },
            { id: 12, name: "Baran Cetin", email: "baran.cetin@devstack.net", roleId: "viewer" },
        ],
    };

};

// TODO: Load the roles and users from your service.
RolesPage.load = function() {
    const stored = basic.storage.load(RolesPage.STORAGE_KEY);
    if (stored && Array.isArray(stored.roles) && Array.isArray(stored.users) && stored.roles.length) return stored;
    return RolesPage.getDefaultData();
};

// TODO: Save with your service.
RolesPage.save = function(data) {
    basic.storage.save(RolesPage.STORAGE_KEY, data);
};

RolesPage.AVATAR_COLORS = ["#3D7A6B", "#344F6C", "#583432", "#6B5B2E", "#4A3F6B", "#2E5E6B"];

RolesPage.getAvatarColor = function(userId) {
    return RolesPage.AVATAR_COLORS[userId % RolesPage.AVATAR_COLORS.length];
};
