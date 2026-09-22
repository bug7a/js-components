/* Bismillah */

/*

Settings Page (Template) - v26.09

- A sample settings page for the admin panel. Sections: General, Account, Notifications, Appearance, Advanced.
- Changes are kept in a draft. A bar at the bottom shows "unsaved changes" with Discard and Save.
- Settings are saved to the browser (basic.storage). Replace SettingsPage.load() and SettingsPage.save()
  with your service (Supabase, API...) calls.
- Panel name, panel color and the start page are used by the panel (index.htm: SettingsPage.applyToPanel).

COMPONENTS:
- TextTabs (comp-m2): Sections
- InputB, EmailInputB, PasswordInputB (comp-m2): Text fields
- TinySelect (comp-m2): Language, time zone, start page, report day
- RadioButton (comp-m3): Date format, panel color
- CheckBox (comp-m3): Notification channels
- Toggle (comp-m2): Two-factor, quiet hours, maintenance mode
- SelectTime (comp-m4): Quiet hours
- Slider (comp-m2): Session timeout
- SelectFile (comp-m4): Logo, settings import
- TinyTable (comp-m2): Active sessions
- ButtonWithIcon, HoldToConfirmButton (comp-m3): Actions
- Dialog, Waiting (comp-m2): Confirm, save

*/

SettingsPageDefaults = {
    color: "transparent",
    sectionIndex: 0, // The first section. 0: General, 1: Account, 2: Notifications, 3: Appearance, 4: Advanced
};

const SettingsPage = function(params = {}) {

    // BOX: Page container
    let box = startPage(params, SettingsPageDefaults, mainView);

    mainView.setKey(SettingsPage.KEY);

    // *** PRIVATE VARIABLES:

    const ASSETS = "assets/";
    const LIB_PATH = "../../";

    const CARD_COLOR = T.surface;
    const CARD_BORDER_COLOR = Ink(0.1);
    const FIELD_COLOR = T.surface2;
    const PRIMARY_COLOR = T.primary;
    const ACCENT_COLOR = T.accent;
    const ERROR_COLOR = T.danger;

    const SECTIONS = ["General", "Account", "Notifications", "Appearance", "Advanced"];

    const currentThemeName = Theme.load(); // The theme of the panel now (Settings > Appearance)

    const LANGUAGES = [
        { id: "en", label: "English" },
        { id: "tr", label: "Türkçe" },
        { id: "de", label: "Deutsch" },
    ];

    const TIME_ZONES = [
        { id: "Europe/Istanbul", label: "(GMT+03:00) Istanbul" },
        { id: "Europe/London", label: "(GMT+00:00) London" },
        { id: "Europe/Berlin", label: "(GMT+01:00) Berlin" },
        { id: "America/New_York", label: "(GMT-05:00) New York" },
        { id: "Asia/Tokyo", label: "(GMT+09:00) Tokyo" },
    ];

    const DATE_FORMATS = ["DD.MM.YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];

    const START_PAGES = [
        { id: HomePage.KEY, label: "Home" },
        { id: ReportsPage.KEY, label: "Reports" },
        { id: OrdersPage.KEY, label: "Orders" },
        { id: ProductsPage.KEY, label: "Products" },
        { id: UsersPage.KEY, label: "Users" },
        { id: UserListPage.KEY, label: "User List" },
        { id: CustomersPage.KEY, label: "Customers" },
        { id: ContentsPage.KEY, label: "Contents" },
        { id: MediaPage.KEY, label: "Media Library" },
        { id: RolesPage.KEY, label: "Roles & Permissions" },
        { id: ActivityPage.KEY, label: "Activity Log" },
    ];

    const WEEK_DAYS = [
        { id: "mon", label: "Monday" },
        { id: "fri", label: "Friday" },
        { id: "sun", label: "Sunday" },
    ];

    const NOTIFY_EVENTS = [
        { key: "signup", title: "New user sign up", desc: "When a new user creates an account" },
        { key: "order", title: "New order", desc: "When an order is paid" },
        { key: "report", title: "Weekly report", desc: "Summary of the last 7 days" },
        { key: "security", title: "Security alerts", desc: "New sign in, password change" },
    ];

    const SESSION_TIMEOUT_MIN = 5; // Minutes (Slider: 0)
    const SESSION_TIMEOUT_MAX = 120; // Minutes (Slider: 100)

    // Settings
    let saved = SettingsPage.load();
    let draft = SettingsPage.clone(saved);

    let isRendering = 0; // WHY: Component setters call onChange. Values written by code are not user changes.
    let saveTimer = null;
    let messageTimer = null;

    // Components
    let sectionTabs;
    let sectionList = [];
    let fields = {}; // InputB family
    let selects = {}; // TinySelect
    let toggles = {};
    let notifyCheckBoxes = {}; // [event][channel]
    let radioList = []; // WHY: RadioButton groups are static. Radio buttons must be removed from the group on destroy.
    let selectTimes = [];
    let selectFiles = [];
    let sliderTimeout, lblTimeout, lblDatePreview, lblLogo, lblApiKey, lblAccountMessage;
    let grpSessionTable, sessionTable = null;
    let footer, lblFooter, btnDiscard, btnSave;

    let isApiKeyVisible = 0;
    let sessionList = [
        ["MacBook Pro · Chrome", "Istanbul, TR", "Active now"],
        ["iPhone 15 · Safari", "Istanbul, TR", "2 hours ago"],
        ["Windows · Edge", "Berlin, DE", "3 days ago"],
    ];

    // *** PRIVATE FUNCTIONS:

    const isDirty = function() {
        return JSON.stringify(draft) != JSON.stringify(saved);
    };

    // Changes a draft value by a user action.
    const setDraft = function(key, value) {
        if (isRendering) return;
        draft[key] = value;
        updateFooter();
    };

    const formatDateBy = function(format, date) {
        const pad = function(n) { return String(n).padStart(2, "0"); };
        return format.replace("YYYY", date.getFullYear()).replace("MM", pad(date.getMonth() + 1)).replace("DD", pad(date.getDate()));
    };

    const timeoutToSlider = function(minutes) {
        return Math.round((minutes - SESSION_TIMEOUT_MIN) / (SESSION_TIMEOUT_MAX - SESSION_TIMEOUT_MIN) * 100);
    };

    // 5 minute steps
    const sliderToTimeout = function(value) {
        const minutes = SESSION_TIMEOUT_MIN + value / 100 * (SESSION_TIMEOUT_MAX - SESSION_TIMEOUT_MIN);
        return Math.round(minutes / 5) * 5;
    };

    const maskApiKey = function(key) {
        return key.slice(0, 8) + "•".repeat(16) + key.slice(-4);
    };

    const createApiKey = function() {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let key = "sk_live_";
        for (let i = 0; i < 32; i++) key += chars[random(0, chars.length - 1)];
        return key;
    };

    const selectById = function(select, id) {
        const index = select.getIndexById(id);
        if (index >= 0 && index != select.selectedIndex) select.setSelectedIndex(index);
    };

    const showSection = function(index) {
        sectionList.forEach(function(section, i) {
            section.visible = (i == index) ? 1 : 0;
        });
        if (sectionTabs.selectedIndex != index) sectionTabs.selectByIndex(index);
    };

    // Writes the values to the components. (Used on start, Discard, Import and Reset.)
    const fillForm = function(values) {

        isRendering = 1;

        fields.panelName.setInputValue(values.panelName);
        fields.supportEmail.setInputValue(values.supportEmail);
        fields.fullName.setInputValue(values.fullName);
        fields.email.setInputValue(values.email);

        selectById(selects.language, values.language);
        selectById(selects.timeZone, values.timeZone);
        selectById(selects.startPage, values.startPage);
        selectById(selects.reportDay, values.reportDay);

        RadioButton.setValue("settingsDateFormat", values.dateFormat, 1);
        RadioButton.setValue("settingsPanelColor", values.panelColor, 1);
        lblDatePreview.text = "Preview: " + formatDateBy(values.dateFormat, new Date());

        lblLogo.text = (values.logoName) ? "Current logo: <b>" + values.logoName + "</b>" : "No logo. The default panel icon is used.";
        selectFiles.forEach(function(selectFile) { selectFile.clear(1); });

        NOTIFY_EVENTS.forEach(function(event) {
            ["email", "push"].forEach(function(channel) {
                notifyCheckBoxes[event.key][channel].setChecked(values.notify[event.key][channel], 1);
            });
        });

        ["twoFactor", "quietHours", "maintenance"].forEach(function(key) {
            if (toggles[key].value !== values[key]) toggles[key].setValue(values[key]);
        });

        selectTimes[0].setTime(values.quietFrom, 1);
        selectTimes[1].setTime(values.quietTo, 1);
        selectTimes.forEach(function(selectTime) { selectTime.setEnabled(values.quietHours); });

        sliderTimeout.setValue(timeoutToSlider(values.sessionTimeout));
        lblTimeout.text = values.sessionTimeout + " min";

        lblApiKey.text = (isApiKeyVisible) ? values.apiKey : maskApiKey(values.apiKey);

        isRendering = 0;

        SettingsPage.applyToPanel(values); // Preview
        updateFooter();

    };

    // Returns the section index of the first error, or -1.
    const validate = function() {

        const checks = [
            { field: fields.panelName, section: 0, isValid: draft.panelName.trim() != "", message: "Panel name is required." },
            { field: fields.supportEmail, section: 0, isValid: fields.supportEmail.isValid() == 1, message: "Support e-mail is not valid." },
            { field: fields.fullName, section: 1, isValid: draft.fullName.trim() != "", message: "Full name is required." },
            { field: fields.email, section: 1, isValid: fields.email.isValid() == 1, message: "E-mail is not valid." },
        ];

        const error = checks.find(function(check) { return !check.isValid; });
        if (!error) return -1;

        error.field.checkIfInputIsRequiredAndEmpty();
        error.field.showWarningIfNotValid(0);
        showSection(error.section);
        showFooterMessage(error.message, ERROR_COLOR);

        return error.section;

    };

    const saveSettings = function() {

        if (validate() >= 0) return;

        btnSave.elem.inert = true;
        if (typeof waiting !== "undefined") waiting.show();

        // TEST: Like a server request
        saveTimer = setTimeout(function() {

            if (!box) return;

            SettingsPage.save(draft);
            saved = SettingsPage.clone(draft);
            SettingsPage.applyToPanel(saved);

            if (typeof waiting !== "undefined") waiting.hide();
            btnSave.elem.inert = false;
            showFooterMessage("All changes are saved.", ACCENT_COLOR, 1);

        }, 500);

    };

    const discardChanges = function() {
        draft = SettingsPage.clone(saved);
        fillForm(draft);
    };

    // Settings were saved from outside while this page is open. (Ex: Maintenance mode on the top bar)
    // The changed values are written to the form. Other unsaved changes of the user are kept.
    // WHY: The form was showing the old values, and "Save" was writing them back.
    SettingsPage.refreshOpenPage = function(settings) {
        if (!box) return;
        Object.keys(settings).forEach(function(key) {
            if (JSON.stringify(settings[key]) != JSON.stringify(saved[key])) draft[key] = SettingsPage.clone(settings[key]);
        });
        saved = SettingsPage.clone(settings);
        fillForm(draft);
    };

    // *** FOOTER:

    const updateFooter = function() {

        if (!footer) return;

        const dirty = isDirty();

        if (dirty) {
            clearTimeout(messageTimer);
            lblFooter.text = "You have unsaved changes.";
            lblFooter.textColor = Ink(0.85);
            btnDiscard.visible = 1;
            btnSave.visible = 1;
            showFooter(1);
        } else if (!messageTimer) {
            showFooter(0);
        }

    };

    // autoHide: 1 -> Hides after 2 seconds (if there is no change).
    const showFooterMessage = function(text, color, autoHide = 0) {

        clearTimeout(messageTimer);
        messageTimer = null;

        lblFooter.text = text;
        lblFooter.textColor = color;
        btnDiscard.visible = (isDirty()) ? 1 : 0;
        btnSave.visible = (isDirty()) ? 1 : 0;
        showFooter(1);

        if (autoHide) {
            messageTimer = setTimeout(function() {
                messageTimer = null;
                if (box) updateFooter();
            }, 2000);
        }

    };

    const showFooter = function(show) {
        if (show) {
            footer.visible = 1;
            footer.withMotion(function(self) {
                self.opacity = 1;
                self.elem.style.transform = "translateY(0px)";
            });
        } else {
            footer.opacity = 0;
            footer.elem.style.transform = "translateY(20px)";
            footer.visible = 0;
        }
    };

    // *** VIEW HELPERS:

    const setFlex = function(obj, flex) {
        obj.elem.style.flex = flex;
        obj.elem.style.minWidth = "0";
    };

    const startCard = function(title, subtitle) {

        const card = VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 16,
            padding: 20,
            color: CARD_COLOR,
            border: 1,
            borderColor: CARD_BORDER_COLOR,
            round: 12,
        });

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });

                Label({ text: title, fontSize: 16, textColor: Ink(0.95) });
                that.elem.style.fontFamily = "opensans-bold";

                if (subtitle) {
                    Label({ text: subtitle, fontSize: 13, textColor: Ink(0.45), width: "100%" });
                }

            endGroup();

        return card;

    };

    const endCard = function() {
        endGroup();
    };

    // GROUP: Fields side by side (wraps on small screens)
    const startFieldRow = function() {
        HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        that.elem.style.flexWrap = "wrap";
    };

    // GROUP: Small title and a component
    // flex: For a field in a row. null: Full width (in a card).
    const startField = function(title, flex = "1 1 260px") {
        const group = VGroup({ width: (flex) ? "auto" : "100%", height: "auto", align: "left top", gap: 8 });
        if (flex) setFlex(group, flex);
        Label({ text: title.toUpperCase(), fontSize: 11, textColor: Ink(0.45) });
        that.elem.style.letterSpacing = "1px";
        return group;
    };

    const endField = function() {
        endGroup();
    };

    // GROUP: Title, description and a component on the right
    const startSettingLine = function(title, desc) {
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });
        that.elem.style.justifyContent = "space-between";
            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
            setFlex(that, "1 1 auto");
                Label({ text: title, fontSize: 15, textColor: Ink(0.9) });
                if (desc) Label({ text: desc, fontSize: 12, textColor: Ink(0.45), width: "100%" });
            endGroup();
    };

    const endSettingLine = function() {
        endGroup();
    };

    const createDivider = function() {
        Box({ width: "100%", height: 1, color: Ink(0.06) });
    };

    // Dark style for the InputB family
    const INPUT_PARAMS = {
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
    };

    // WHY: InputB has fixed text colors for light backgrounds.
    const styleInput = function(input) {
        input.title.textColor = Ink(0.45);
        input.title.fontSize = 11;
        input.title.elem.style.letterSpacing = "1px";
        input.input.textColor = Ink(0.9);
        input.input.fontSize = 16;
        input.input.height = 34;
        input.warningBall.borderColor = CARD_COLOR;
        return input;
    };

    const createTinySelect = function(list, onSelect) {
        return TinySelect({
            list: list,
            height: 44,
            fontSize: 15,
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
            onSelect: onSelect,
        });
    };

    const createRadioButton = function(group, value, labelText, onChange) {
        const radio = RadioButton({
            group: group,
            value: value,
            labelText: labelText,
            style: {
                mark: { width: 20, height: 20, color: "transparent", borderColor: Ink(0.35) },
                checkedMark: { color: "transparent", borderColor: ACCENT_COLOR },
                hoverMark: { borderColor: Ink(0.7) },
                dot: { color: ACCENT_COLOR },
                label: { fontSize: 14, textColor: Ink(0.9) },
            },
            onChange: onChange,
        });
        radioList.push(radio);
        return radio;
    };

    const createCheckBox = function(labelText, onChange) {
        return CheckBox({
            labelText: labelText,
            style: {
                layout: { padding: [0, 0] },
                mark: { width: 20, height: 20, color: "transparent", borderColor: Ink(0.35) },
                checkedMark: { color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
                hoverMark: { borderColor: Ink(0.7) },
                tick: { color: Ink(1) },
                label: { fontSize: 14, textColor: Ink(0.9) },
            },
            onChange: onChange,
        });
    };

    const createToggle = function(onChange) {
        return Toggle({
            width: 52,
            height: 30,
            spacing: 3,
            backgroundStyle: { color: T.surface3, selectedColor: PRIMARY_COLOR, border: 1, borderColor: CARD_BORDER_COLOR },
            buttonStyle: { color: Ink(0.35), selectedColor: Ink(0.95) },
            onChange: onChange,
        });
    };

    const createButton = function(text, iconFile, onClick, params = {}) {
        const btn = ButtonWithIcon({
            labelText: text,
            iconFile: (iconFile) ? ASSETS + iconFile : "",
            onClick: onClick,
            style: {
                layout: { gap: 8, padding: [14, 8] },
                icon: { width: 18, height: 18 },
                label: { fontSize: 14, textColor: Ink(0.9) },
                box: { color: params.color || FIELD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                hover: { color: params.hoverColor || T.surface3 },
                active: { color: params.activeColor || T.surface4 },
            },
        });
        if (btn.icon) btn.icon.elem.style.filter = T.iconFilter; // WHY: Panel icons are black.
        return btn;
    };

    const SELECT_FILE_STYLE = {
        zone: { color: FIELD_COLOR, border: 2, borderColor: Ink(0.12), round: 10 },
        zoneHover: { color: T.surface3, borderColor: Ink(0.3) },
        zoneDragOver: { color: T.tableHighlight, borderColor: ACCENT_COLOR },
        icon: { color: Ink(0.45), dragOverColor: ACCENT_COLOR },
        title: { fontSize: 14, textColor: Ink(0.9) },
        desc: { fontSize: 13, textColor: Ink(0.5) },
        hint: { textColor: Ink(0.4) },
        item: { color: FIELD_COLOR, borderColor: Ink(0.1) },
        itemName: { textColor: Ink(0.85) },
        itemSize: { textColor: Ink(0.45) },
        badge: { color: Ink(0.08), textColor: Ink(0.6) },
        removeButton: { textColor: Ink(0.45), hoverColor: ERROR_COLOR },
    };

    // *** SECTIONS:

    const startSection = function() {
        const section = VGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
        sectionList.push(section);
        return section;
    };

    const endSection = function() {
        endGroup();
    };

    const initGeneral = function() {

        startSection();

            startCard("Panel", "Name and contact information of this panel");

                startFieldRow();

                    fields.panelName = styleInput(InputB({
                        ...INPUT_PARAMS,
                        titleText: "PANEL NAME",
                        inputValue: draft.panelName, // WHY: An empty required field shows a warning ball with a delayed motion; filling it later does not hide it.
                        placeholder: "My Panel",
                        isRequired: 1,
                        requiredText: "Panel name is required",
                        maxChar: 24,
                        onEdit: function() {
                            setDraft("panelName", fields.panelName.getInputValue());
                            topBar.setPanelName(draft.panelName); // Preview
                        },
                    }));
                    setFlex(fields.panelName, "1 1 260px");

                    fields.supportEmail = styleInput(EmailInputB({
                        ...INPUT_PARAMS,
                        titleText: "SUPPORT E-MAIL",
                        inputValue: draft.supportEmail,
                        onEdit: function() {
                            setDraft("supportEmail", fields.supportEmail.getInputValue());
                        },
                    }));
                    setFlex(fields.supportEmail, "1 1 260px");

                endGroup();

                startField("Logo", null);

                    const logoFile = SelectFile({
                        width: "100%",
                        zoneHeight: 150,
                        accept: "image/png,image/svg+xml",
                        maxSize: 512 * 1024,
                        titleText: "Drop the panel logo here",
                        descText: "or click to select (PNG or SVG, square)",
                        style: SELECT_FILE_STYLE,
                        onChange: function(self) {
                            // NOTE: Only the name is kept in this template. Upload self.files[0].file to your storage.
                            if (self.files.length) setDraft("logoName", self.files[0].name);
                        },
                    });
                    selectFiles.push(logoFile);

                    lblLogo = Label({ text: "", fontSize: 13, textColor: Ink(0.5) });

                endField();

            endCard();

            startCard("Localization", "Language, time zone and date format of the panel");

                startFieldRow();

                    startField("Language");
                        selects.language = createTinySelect(LANGUAGES, function(index, id) { setDraft("language", id); });
                    endField();

                    startField("Time zone");
                        selects.timeZone = createTinySelect(TIME_ZONES, function(index, id) { setDraft("timeZone", id); });
                    endField();

                endGroup();

                startField("Date format", null);

                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 24 });
                    that.elem.style.flexWrap = "wrap";

                        DATE_FORMATS.forEach(function(format) {
                            createRadioButton("settingsDateFormat", format, format, function(self) {
                                lblDatePreview.text = "Preview: " + formatDateBy(self.value, new Date());
                                setDraft("dateFormat", self.value);
                            });
                        });

                    endGroup();

                    lblDatePreview = Label({ text: "", fontSize: 13, textColor: Ink(0.5) });

                endField();

            endCard();

        endSection();

    };

    const initAccount = function() {

        startSection();

            startCard("Profile", "");

                startFieldRow();

                    fields.fullName = styleInput(InputB({
                        ...INPUT_PARAMS,
                        titleText: "FULL NAME",
                        inputValue: draft.fullName,
                        placeholder: "Your name",
                        isRequired: 1,
                        requiredText: "Full name is required",
                        maxChar: 40,
                        onEdit: function() {
                            setDraft("fullName", fields.fullName.getInputValue());
                        },
                    }));
                    setFlex(fields.fullName, "1 1 260px");

                    fields.email = styleInput(EmailInputB({
                        ...INPUT_PARAMS,
                        titleText: "E-MAIL",
                        inputValue: draft.email,
                        onEdit: function() {
                            setDraft("email", fields.email.getInputValue());
                        },
                    }));
                    setFlex(fields.email, "1 1 260px");

                endGroup();

            endCard();

            // PASSWORD: An action, not a setting. (Not in the draft)
            startCard("Change Password", "At least 8 characters, with a letter and a number");

                const passwordParams = {
                    ...INPUT_PARAMS,
                    isRequired: 0, // WHY: Required balls are shown on empty fields at start. Checked on the button click.
                    minChar: 8,
                    minCharWarningText: "At least 8 characters",
                    showPasswordIconFile: LIB_PATH + "comp-m2/password-input-b/show-btn.png",
                    hidePasswordIconFile: LIB_PATH + "comp-m2/password-input-b/hide-btn.png",
                    showPasswordIconInvert: 1,
                    rightPadding: 50,
                };

                startFieldRow();

                    const inputCurrent = styleInput(PasswordInputB({ ...passwordParams, titleText: "CURRENT PASSWORD", placeholder: "" }));
                    setFlex(inputCurrent, "1 1 200px");

                    const inputNew = styleInput(PasswordInputB({ ...passwordParams, titleText: "NEW PASSWORD", placeholder: "" }));
                    setFlex(inputNew, "1 1 200px");

                    const inputConfirm = styleInput(PasswordInputB({ ...passwordParams, titleText: "CONFIRM PASSWORD", placeholder: "" }));
                    setFlex(inputConfirm, "1 1 200px");

                endGroup();

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 16 });

                    createButton("Update Password", "", function() {

                        const showMessage = function(text, color) {
                            lblAccountMessage.text = text;
                            lblAccountMessage.textColor = color;
                        };

                        if (!inputCurrent.getInputValue()) return showMessage("Enter your current password.", ERROR_COLOR);
                        if (!inputNew.isValid()) return showMessage("New password: " + inputNew.warningText, ERROR_COLOR);
                        if (inputNew.getInputValue() != inputConfirm.getInputValue()) return showMessage("New passwords do not match.", ERROR_COLOR);

                        // TODO: Change the password with your service.
                        [inputCurrent, inputNew, inputConfirm].forEach(function(input) { input.setInputValue(""); });
                        showMessage("Password is updated.", ACCENT_COLOR);

                    });

                    lblAccountMessage = Label({ text: "", fontSize: 13 });

                endGroup();

            endCard();

            startCard("Security", "");

                startSettingLine("Two-factor authentication", "Ask for a code from an authenticator app when signing in");
                    toggles.twoFactor = createToggle(function(self) { setDraft("twoFactor", self.value); });
                endSettingLine();

                createDivider();

                startSettingLine("Session timeout", "Sign out automatically when the panel is not used");

                    HGroup({ width: "auto", height: "auto", align: "right center", gap: 16 });

                        sliderTimeout = Slider({
                            width: 200,
                            trackHeight: 10,
                            minThumbHeight: 28,
                            trackColor: ACCENT_COLOR,
                            trackBackgroundColor: Ink(0.1),
                            thumbColor: Ink(0.9),
                            showValueOnSet: 0,
                            showValueOnDrag: 0, // WHY: Slider shows 0-100. Minutes are shown in lblTimeout.
                            onDragMove: function(value) {
                                lblTimeout.text = sliderToTimeout(value) + " min";
                            },
                            onDragEnd: function() {
                                setDraft("sessionTimeout", sliderToTimeout(sliderTimeout.getValue()));
                            },
                        });

                        lblTimeout = Label({ text: "", fontSize: 15, textColor: Ink(0.9), width: 70 });
                        that.elem.style.fontFamily = "opensans-bold";

                    endGroup();

                endSettingLine();

                createDivider();

                VGroup({ width: "100%", height: "auto", align: "left top", gap: 12 });

                    startSettingLine("Active sessions", "Devices that are signed in to this account");
                        createButton("Sign Out Other Sessions", "", function() {
                            if (sessionList.length < 2) return;
                            Dialog({
                                icon: ASSETS + "warning.png",
                                title: "Sign Out Other Sessions",
                                desc: "All devices except this one will be signed out.",
                                confirmButtonText: "Sign Out",
                                confirmButtonColor: PRIMARY_COLOR,
                                callback: function(isConfirmed) {
                                    if (!isConfirmed || !box) return;
                                    // TODO: Sign out other sessions with your service.
                                    sessionList = sessionList.slice(0, 1);
                                    renderSessions();
                                },
                            });
                        });
                    endSettingLine();

                    grpSessionTable = HGroup({ width: "100%", height: "auto", align: "left top" });
                    that.elem.style.overflowX = "auto";
                    endGroup();

                endGroup();

            endCard();

        endSection();

    };

    const renderSessions = function() {

        if (sessionTable) sessionTable.remove();

        const previous = getDefaultContainerBox();
        setDefaultContainerBox(grpSessionTable);

            sessionTable = TinyTable({
                columnHeaders: ["DEVICE", "LOCATION", "LAST ACTIVE"],
                columnWidths: ["44%", "30%", "25%"], // 99%: 1px gaps between cells
                dataRows: sessionList,
                headerBackgroundColor: FIELD_COLOR,
                headerTextColor: Ink(0.6),
                headerBorderColor: FIELD_COLOR,
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
                    if (cell.index == 2 && cell.text == "Active now") cell.textColor = ACCENT_COLOR;
                },
            });
            sessionTable.width = "100%";
            sessionTable.elem.style.minWidth = "480px";

        setDefaultContainerBox(previous);

    };

    const initNotifications = function() {

        startSection();

            startCard("Notifications", "Choose how you get informed");

                // Header
                HGroup({ width: "100%", height: "auto", align: "left center", gap: 0 });
                    Label({ text: "EVENT", fontSize: 11, textColor: Ink(0.45) });
                    setFlex(that, "1 1 auto");
                    ["E-MAIL", "PUSH"].forEach(function(text) {
                        Label({ text: text, fontSize: 11, textColor: Ink(0.45), width: 80, textAlign: "center" });
                    });
                endGroup();

                NOTIFY_EVENTS.forEach(function(event) {

                    createDivider();

                    HGroup({ width: "100%", height: "auto", align: "left center", gap: 0 });

                        VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
                        setFlex(that, "1 1 auto");
                            Label({ text: event.title, fontSize: 15, textColor: Ink(0.9) });
                            Label({ text: event.desc, fontSize: 12, textColor: Ink(0.45) });
                        endGroup();

                        notifyCheckBoxes[event.key] = {};

                        ["email", "push"].forEach(function(channel) {
                            HGroup({ width: 80, height: "auto", align: "center center" });
                                notifyCheckBoxes[event.key][channel] = createCheckBox("", function(self) {
                                    if (isRendering) return;
                                    draft.notify[event.key][channel] = self.checked;
                                    updateFooter();
                                });
                            endGroup();
                        });

                    endGroup();

                });

            endCard();

            startCard("Schedule", "");

                startSettingLine("Quiet hours", "Push notifications are not sent in these hours (security alerts are always sent)");
                    toggles.quietHours = createToggle(function(self) {
                        selectTimes.forEach(function(selectTime) { selectTime.setEnabled(self.value); });
                        setDraft("quietHours", self.value);
                    });
                endSettingLine();

                HGroup({ width: "100%", height: "auto", align: "left bottom", gap: 16 });
                that.elem.style.flexWrap = "wrap";

                    [["From", "quietFrom"], ["To", "quietTo"]].forEach(function(item) {
                        startField(item[0], "0 0 auto");
                            const selectTime = SelectTime({
                                width: 130,
                                height: 44,
                                minuteStep: 30,
                                showClearButton: 0,
                                style: {
                                    field: { color: FIELD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                                    fieldHover: { borderColor: Ink(0.3) },
                                    fieldFocus: { borderColor: ACCENT_COLOR },
                                    fieldText: { fontSize: 15, textColor: Ink(0.9) },
                                    icon: { color: Ink(0.55) },
                                    panel: { color: FIELD_COLOR, borderColor: Ink(0.12), shadow: "0 8px 24px " + Black(0.5) },
                                    columnTitle: { textColor: Ink(0.45), activeTextColor: Ink(0.9) },
                                    cell: { textColor: Ink(0.85), hoverColor: Ink(0.08) },
                                    selectedCell: { color: PRIMARY_COLOR, textColor: Ink(1) },
                                    disabledCell: { textColor: Ink(0.2) },
                                    footerButton: { textColor: ACCENT_COLOR },
                                },
                                onChange: function(self) {
                                    if (self.value) setDraft(item[1], self.value);
                                },
                            });
                            selectTimes.push(selectTime);
                        endField();
                    });

                endGroup();

                createDivider();

                startSettingLine("Weekly report day", "The weekly report is sent on this day at 09:00");
                    selects.reportDay = createTinySelect(WEEK_DAYS, function(index, id) { setDraft("reportDay", id); });
                endSettingLine();

            endCard();

        endSection();

    };

    // One theme of the panel: a small preview (page, card, action color) and its name.
    const createThemeItem = function(item) {

        const isSelected = (item.name == currentThemeName);

        const itemBox = VGroup({
            width: 190, height: "auto", align: "left top", gap: 0,
            color: FIELD_COLOR, border: 2, borderColor: (isSelected) ? ACCENT_COLOR : Ink(0.12),
            round: 10, clickable: 1,
        });
        itemBox.elem.style.cursor = "pointer";
        itemBox.clipContent = 1;

            // PREVIEW: The page of that theme with a card and two buttons on it.
            const preview = Box({ width: "100%", height: 74, color: item.page });
            createIn(preview, function() {
                Box(12, 12, 100, 30, { color: item.surface, border: 1, borderColor: (item.isDark) ? White(0.12) : Black(0.12), round: 6 });
                Box(12, 50, 46, 12, { color: item.primary, round: 4 });
                Box(64, 50, 46, 12, { color: item.surface2, border: 1, borderColor: (item.isDark) ? White(0.12) : Black(0.12), round: 4 });
                Box(124, 12, 54, 50, { color: item.surface, border: 1, borderColor: (item.isDark) ? White(0.12) : Black(0.12), round: 6 });
            });

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [12, 10] });

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                that.elem.style.justifyContent = "space-between";
                    Label({ text: item.label, fontSize: 14, textColor: Ink(0.9) });
                    that.elem.style.fontFamily = "opensans-bold";
                    if (isSelected) {
                        Label({ text: "Selected", fontSize: 11, textColor: Theme.textOn(ACCENT_COLOR), color: ACCENT_COLOR, padding: [8, 2], round: 100 });
                        that.elem.style.whiteSpace = "nowrap";
                    }
                endGroup();

                Label({ text: item.desc, fontSize: 12, textColor: Ink(0.45), width: "100%" });

            endGroup();

        endGroup();

        itemBox.on("click", function() { selectTheme(item.name); });

        return itemBox;

    };

    // The panel is created again with the new colors (index.htm builds the top bar and the menu once).
    const selectTheme = function(name) {

        if (name == currentThemeName) return;

        // WHY: The page is loaded again, so the draft of this page is lost.
        if (isDirty()) {
            Dialog({
                icon: ASSETS + "warning.png",
                title: "Change Theme",
                desc: "The panel opens again with the new colors. The changes you did not save are lost.",
                confirmButtonText: "Change Theme",
                confirmButtonColor: PRIMARY_COLOR,
                callback: function(isConfirmed) { if (isConfirmed) applyTheme(name); },
            });
            return;
        }

        applyTheme(name);

    };

    const applyTheme = function(name) {
        basic.storage.save(SettingsPage.SECTION_KEY, 3); // WHY: This page opens again on Appearance.
        Theme.select(name, SettingsPage.KEY); // Saves the theme and loads the panel again.
    };

    const initAppearance = function() {

        startSection();

            startCard("Theme", "The colors of the panel. The panel opens again when the theme changes.");

                HGroup({ width: "100%", height: "auto", align: "left top", gap: 14 });
                that.elem.style.flexWrap = "wrap";

                    Theme.getList().forEach(function(item) { createThemeItem(item); });

                endGroup();

            endCard();

            startCard("Panel Color", "Color of the top bar. You see it now; it is kept after Save.");

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 24 });
                that.elem.style.flexWrap = "wrap";

                    SettingsPage.PANEL_COLORS.forEach(function(item) {
                        const swatch = "<span style='display:inline-block; width:14px; height:14px; border-radius:4px; vertical-align:-2px; margin-right:6px; background:" + item.color + "; border:1px solid " + Ink(0.2) + "'></span>";
                        createRadioButton("settingsPanelColor", item.color, swatch + item.name, function(self) {
                            topBar.setBackgroundColor(self.value); // Preview
                            setDraft("panelColor", self.value);
                        });
                    });

                endGroup();

            endCard();

            startCard("Start Page", "");

                startSettingLine("Page after sign in", "This page is opened when the panel starts");
                    selects.startPage = createTinySelect(START_PAGES, function(index, id) { setDraft("startPage", id); });
                endSettingLine();

            endCard();

        endSection();

    };

    const initAdvanced = function() {

        startSection();

            startCard("API Key", "Use this key to connect your apps. Keep it secret.");

                HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });
                that.elem.style.flexWrap = "wrap";

                    lblApiKey = Label({
                        text: "",
                        fontSize: 14,
                        textColor: Ink(0.85),
                        color: FIELD_COLOR,
                        border: 1,
                        borderColor: CARD_BORDER_COLOR,
                        round: 8,
                        padding: [14, 10],
                    });
                    lblApiKey.elem.style.fontFamily = "monospace";
                    setFlex(lblApiKey, "1 1 320px");

                    const btnShowKey = createButton("Show", "", function() {
                        isApiKeyVisible = (isApiKeyVisible) ? 0 : 1;
                        btnShowKey.setText((isApiKeyVisible) ? "Hide" : "Show");
                        lblApiKey.text = (isApiKeyVisible) ? draft.apiKey : maskApiKey(draft.apiKey);
                    });

                    const btnCopyKey = createButton("Copy", "", function() {
                        navigator.clipboard.writeText(draft.apiKey).then(function() {
                            btnCopyKey.setText("Copied");
                            setTimeout(function() { if (box) btnCopyKey.setText("Copy"); }, 1500);
                        });
                    });

                    createButton("Regenerate", "", function() {
                        Dialog({
                            icon: ASSETS + "warning.png",
                            title: "Regenerate API Key",
                            desc: "The current key stops working now. Apps that use it must be updated.",
                            confirmButtonText: "Regenerate",
                            confirmButtonColor: ERROR_COLOR,
                            callback: function(isConfirmed) {
                                if (!isConfirmed || !box) return;
                                // WHY: A new key is an action on the server. It is saved now, not with the Save button.
                                const key = createApiKey();
                                saved.apiKey = key;
                                draft.apiKey = key;
                                SettingsPage.save(saved);
                                lblApiKey.text = (isApiKeyVisible) ? key : maskApiKey(key);
                                showFooterMessage("A new API key is created.", ACCENT_COLOR, 1);
                            },
                        });
                    });

                endGroup();

            endCard();

            startCard("Maintenance", "");

                startSettingLine("Maintenance mode", "Users see a maintenance page. Admins can still use the panel.");
                    toggles.maintenance = createToggle(function(self) {
                        if (isRendering) return;
                        if (self.value !== 1) return setDraft("maintenance", 0);
                        // Ask before turning on.
                        Dialog({
                            icon: ASSETS + "warning.png",
                            title: "Maintenance Mode",
                            desc: "Your users will not be able to use the app until it is turned off. (After Save)",
                            confirmButtonText: "Turn On",
                            confirmButtonColor: ERROR_COLOR,
                            callback: function(isConfirmed) {
                                if (!box) return;
                                if (isConfirmed) {
                                    setDraft("maintenance", 1);
                                } else {
                                    isRendering = 1;
                                    toggles.maintenance.setValue(0);
                                    isRendering = 0;
                                }
                            },
                        });
                    });
                endSettingLine();

            endCard();

            startCard("Backup", "Export the settings to a file, or import them from a file");

                HGroup({ width: "100%", height: "auto", align: "left top", gap: 16 });
                that.elem.style.flexWrap = "wrap";

                    VGroup({ width: "auto", height: "auto", align: "left top", gap: 8 });
                    setFlex(that, "0 0 auto");

                        createButton("Export Settings", "arrow_down.png", function() {
                            const data = SettingsPage.clone(saved);
                            delete data.apiKey; // WHY: A secret must not be in a file.
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
                            link.download = "panel-settings.json";
                            link.click();
                            URL.revokeObjectURL(link.href);
                        });
                        Label({ text: "Saved settings (without the API key)", fontSize: 12, textColor: Ink(0.45) });

                    endGroup();

                    const importFile = SelectFile({
                        width: "auto",
                        zoneHeight: 100,
                        accept: ".json,application/json",
                        maxSize: 100 * 1024,
                        showIcon: 0,
                        showList: 0,
                        titleText: "Drop a settings file here",
                        descText: "or click to select (.json)",
                        style: SELECT_FILE_STYLE,
                        onChange: function(self) {
                            if (!self.files.length) return;
                            self.files[0].file.text().then(function(text) {
                                if (!box) return;
                                try {
                                    const imported = JSON.parse(text);
                                    if (!imported || typeof imported !== "object" || Array.isArray(imported)) throw new Error();
                                    delete imported.apiKey;
                                    // Missing keys come from the current draft.
                                    mergeIntoIfMissing(imported, SettingsPage.clone(draft)); // NOTE: Changes "imported", returns nothing.
                                    draft = imported;
                                    fillForm(draft);
                                    showFooterMessage("Settings are imported. Check them and press Save.", ACCENT_COLOR);
                                } catch (e) {
                                    showFooterMessage("The file is not a valid settings file.", ERROR_COLOR, 1);
                                }
                                self.clear(1);
                            });
                        },
                        onError: function(self, errors) {
                            showFooterMessage(errors[0].message, ERROR_COLOR, 1);
                        },
                    });
                    setFlex(importFile, "1 1 280px");
                    selectFiles.push(importFile);

                endGroup();

            endCard();

            startCard("Reset", "");

                startSettingLine("Reset to defaults", "All settings (except the API key) get their default values. Press Save to keep them.");

                    HoldToConfirmButton({
                        height: 40,
                        labelText: "Hold to Reset",
                        completedText: "RESET",
                        iconFile: LIB_PATH + "comp-m3/hold-to-confirm-button/trash.png",
                        holdingIconFile: LIB_PATH + "comp-m3/hold-to-confirm-button/trash-red.png",
                        holdDuration: 1500,
                        resetDelay: 1500,
                        style: {
                            layout: { gap: 6, padding: [14, 0] },
                            icon: { width: 20, height: 20 },
                            label: { fontSize: 14, textColor: Ink(0.9) },
                            holdingLabel: { fontSize: 14, textColor: "#B03A2E" },
                            completedLabel: { fontSize: 14, textColor: T.primaryActive },
                            box: { color: FIELD_COLOR, border: 1, borderColor: CARD_BORDER_COLOR, round: 8 },
                            holdingBox: { color: "#FFD1CB", borderColor: ERROR_COLOR, round: 8 },
                            completedBox: { color: "#DFEFE6", borderColor: ACCENT_COLOR, round: 8 },
                        },
                        onConfirm: function() {
                            const apiKey = draft.apiKey;
                            draft = SettingsPage.clone(SettingsPage.DEFAULTS);
                            draft.apiKey = apiKey;
                            fillForm(draft);
                        },
                    });
                    that.icon.elem.style.filter = T.iconFilter; // WHY: Only the normal icon is on a dark background.

                endSettingLine();

            endCard();

        endSection();

    };

    // *** PUBLIC FUNCTIONS:

    box.destroy = function() {

        clearTimeout(saveTimer);
        clearTimeout(messageTimer);
        if (saveTimer && typeof waiting !== "undefined") waiting.hide();

        // WHY: Unsaved preview (panel name, color) must not stay after leaving the page.
        SettingsPage.applyToPanel(saved);

        // WHY: These components have objects, events or static lists on the page. box.remove() does not remove them.
        radioList.forEach(function(radio) { radio.remove(); });
        selectTimes.forEach(function(selectTime) { selectTime.remove(); });
        selectFiles.forEach(function(selectFile) { selectFile.remove(); });

        SettingsPage.refreshOpenPage = null;

        box.remove();
        box = null;

    };

    // *** PAGE VIEW:

    // BOX: Scrollable container
    // WHY: page does not scroll. Scrollable content must be inside a Box with scrollY: 1.
    startBox(0, 0, "100%", "100%", {
        color: "transparent",
        scrollY: 1,
    });

        VGroup({
            width: "100%",
            height: "auto", // Grows with content, so the Box can scroll.
            align: "center top",
            padding: [24, 24, 24, 110], // Bottom: space for the footer
        });

            // GROUP: Content (max width for easy reading)
            VGroup({ width: "100%", height: "auto", align: "left top", gap: 20 });
            that.elem.style.maxWidth = "960px";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                    Label({ text: "Settings", fontSize: 26, textColor: Ink(0.95) });
                    that.elem.style.fontFamily = "opensans-bold";

                    Label({ text: "Manage the panel and your account", fontSize: 14, textColor: Ink(0.5) });

                endGroup();

                sectionTabs = TextTabs({
                    tabList: SECTIONS,
                    onClick: function(self) {
                        showSection(self.index);
                    },
                    backgroundStyle: {
                        colorBottom: CARD_COLOR,
                        colorTop: CARD_COLOR,
                        round: 10,
                        border: 1,
                        borderColor: CARD_BORDER_COLOR,
                    },
                    tabPadding: [4, 4],
                    labelStyle: {
                        fontSize: 14,
                        textColor: Ink(0.85),
                        padding: [16, 7],
                    },
                    selectedStyle: {
                        color: PRIMARY_COLOR,
                        round: 7,
                    },
                });

                initGeneral();
                initAccount();
                initNotifications();
                initAppearance();
                initAdvanced();

            endGroup();

        endGroup();

    endBox();

    // FOOTER: Unsaved changes
    footer = HGroup({
        width: "100%",
        height: "auto",
        align: "center center",
        padding: [24, 20],
        opacity: 0,
    });
    footer.bottom = 0;
    footer.setMotion("opacity 0.2s, transform 0.2s");
    footer.elem.style.transform = "translateY(20px)";

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

            btnDiscard = createButton("Discard", "", discardChanges);

            btnSave = createButton("Save Changes", "", saveSettings, { color: PRIMARY_COLOR, hoverColor: T.primaryHover, activeColor: T.primaryActive });

        endGroup();

    endGroup();

    // WHY: Hidden after the content is created. Objects created in a hidden (display: none) group are not flex items.
    footer.visible = 0;

    // *** PAGE INIT CODE:

    // WHY: After a theme change the panel is loaded again. The user comes back to Appearance.
    const savedSection = basic.storage.load(SettingsPage.SECTION_KEY);
    if (savedSection !== null && savedSection !== undefined) {
        basic.storage.remove(SettingsPage.SECTION_KEY);
        box.sectionIndex = savedSection;
    }

    showSection(box.sectionIndex);
    renderSessions();
    fillForm(draft);

    return box.endPage();

};

SettingsPage.KEY = "Settings";

// The section of the page after a reload. (Used by the theme change.)
SettingsPage.SECTION_KEY = "appid_settings_section";

// *** STATIC:

SettingsPage.STORAGE_KEY = "adminPanel.settings";

SettingsPage.PANEL_COLORS = [
    { name: "Forest", color: "#2C5A38" },
    { name: "Teal", color: "#3D7A6B" },
    { name: "Ocean", color: "#344F6C" },
    { name: "Wine", color: "#583432" },
    { name: "Graphite", color: "#2C2C2A" },
];

SettingsPage.DEFAULTS = {
    // General
    panelName: "MY PANEL",
    supportEmail: "support@mypanel.com",
    logoName: "",
    language: "en",
    timeZone: "Europe/Istanbul",
    dateFormat: "DD.MM.YYYY",
    // Account
    fullName: "Bugra Ozden",
    email: "bugra.ozden@gmail.com",
    twoFactor: 0,
    sessionTimeout: 30, // Minutes
    // Notifications
    notify: {
        signup: { email: 1, push: 0 },
        order: { email: 1, push: 1 },
        report: { email: 1, push: 0 },
        security: { email: 1, push: 1 },
    },
    quietHours: 1,
    quietFrom: "22:00",
    quietTo: "08:00",
    reportDay: "mon",
    // Appearance
    panelColor: "#2C5A38",
    startPage: "Home",
    // Advanced
    maintenance: 0,
    apiKey: "sk_live_7f3a9c2e1b8d4f6a0e5c3b9d2a7f1e4c",
};

SettingsPage.clone = function(value) {
    return JSON.parse(JSON.stringify(value));
};

// Saved settings. Missing keys (new settings in a new version) get the default values.
SettingsPage.load = function() {
    // TODO: Load the settings from your service.
    const stored = basic.storage.load(SettingsPage.STORAGE_KEY);
    const settings = (stored && typeof stored === "object") ? stored : {};
    mergeIntoIfMissing(settings, SettingsPage.clone(SettingsPage.DEFAULTS)); // NOTE: Changes "settings", returns nothing.
    return settings;
};

SettingsPage.save = function(settings) {
    // TODO: Save the settings to your service.
    basic.storage.save(SettingsPage.STORAGE_KEY, settings);
};

// Set by the Settings page while it is open. (null: the page is closed)
SettingsPage.refreshOpenPage = null;

// Saves the settings from outside of the Settings page (top bar, user menu), uses them in the panel
// and updates the Settings page if it is open.
SettingsPage.saveAndApply = function(settings) {
    SettingsPage.save(settings);
    SettingsPage.applyToPanel(settings);
    if (SettingsPage.refreshOpenPage) SettingsPage.refreshOpenPage(settings);
};

// Uses the settings in the panel. (Called by index.htm on start, and by the page for preview and after save.)
SettingsPage.applyToPanel = function(settings) {
    if (!window.topBar) return;
    topBar.setBackgroundColor(settings.panelColor);
    topBar.setPanelName(settings.panelName);
    if (topBar.applySettings) topBar.applySettings(settings); // Language, maintenance mode, user name
};
