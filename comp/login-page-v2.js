/* Bismillah */

/*

LoginPage - v26.10

UI COMPONENT
- A full page with two views: LOGIN and SIGN UP (a tab bar switches them). The page does the service work in
  onLoginClick / onSignupClick and calls box.waiting.show() / hide() and box.showAlert() around it.
- The tab bar is comp-m4 Tabs (the pill variant, colored by the tab_ params), the waiting cover is comp-m4
  LoadingScreen with the moving clock (box.waiting.show() / hide(); waitingCoverColor, waitingClock).
  tabWidth (2026-11-05, the user): "auto" (default) is as wide as its tabs; a width (Ex: the panelWidth) makes the
  tabs share it. tabStyle: more keys of the style of that Tabs (pillBar, tab, pillActive, pillIndicator...), over the
  look made from the tab_ params.
- LoginPageLightStyle: the params of a light page (...LoginPageLightStyle, or mergeIntoIfMissing). Its tab bar
  (2026-11-05, the user): one light gray (#EFEFEF), the edge of the Google / Apple buttons (Black(0.2)), a white
  selected tab with a soft shadow (its tabStyle). A page that gives its own tabStyle after it replaces that shadow.
- The LOGIN / SIGN UP buttons (2026-11-05, the user): buttonStyleName "" (default) keeps the flat buttons in
  primaryColor; a SmartButton template (Ex: "ozdenType3") makes them SmartButtons of the kit, in buttonTone (Ex:
  "blue"), with the text color of the tone. A passive one has the passive look of SmartButton.

LOAD FIRST (in this order):
    basic.js, comp/ui-effects.js, comp/tooltip.js, comp/input-b.js, comp/email-input-b.js,
    comp/password-input-b.js, comp/tabs.js, comp/smart-button.js, comp/loading-screen.js
    (LoadingScreen needs smart-button.js: the clock drawing)


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

- Tüm servis işlemleri dışarı alınmalı, böylece, kullanıcı istediği yapılar ile login işlemini tamamlar.
- Karanlık ve aydınlık sayfaları parametrelerden ayarlayabilsin.
- giriş için iki input da boş ise button pasif olsun.
- signup form için form hatasız ise button akfif olsun.
- login-page.js belki bir komponent gibi genel klasöre eklenebilir. Başka sistemlerle de aynı şekilde kullanılabilir.

*/

"use strict";

// Default values:
const LoginPageDefaults = {
    panelWidth: 420,
    //autoFit: 1, // add page.fit() function onResize
    primaryColor: "#2C5A38",
    tab_backgroundColorBottom: "#242424", // "#242424", "whitesmoke"
    tab_backgroundColorTop: "#242424", // "#242424", "#DBDDDC",
    tab_borderColor: White(0.1), // White(0.1), Black(0),
    tab_border: 1, // 1, 0
    tab_textColor: White(0.75), // White(0.75), "#373836",
    tab_selectedColor: "#000000", // "#000000", "white",
    tabWidth: "auto", // the LOGIN / SIGN UP bar: "auto" (as wide as its tabs) or a width the tabs share (Ex: the panelWidth)
    tabStyle: {}, // more keys of the style of its Tabs (pillBar, tab, pillActive, pillIndicator...), over the tab_ look
    inputStyleName: "", // "": the fields take the input_ colors below. An InputB package ("ozden", "ozdenDark"...): the fields take its look.
    buttonStyleName: "", // "": LOGIN / SIGN UP are flat buttons in primaryColor. A SmartButton template ("ozdenType3"...): SmartButtons
    buttonTone: "", // The tone of those SmartButtons (Ex: "blue"; "": the gray of the template)
    input_backgroundColor: "#141414",
    input_lineColor: "transparent",
    input_selectedBackgroundColor: "#202020",
    input_textColor: White(0.85), // Black(0.85), White(0.85)
    input_border: 1, // 1, 0
    input_borderColor: White(0.1), // White(0.1), Black(0.1)
    orTextColor: White(0.75), // White(0.75), Black(0.75)
    orLineColor: White(0.1), // White(0.1), Black(0.1)
    panelName: "MY PANEL v25.08.11",
    onLoginClick: function() {},
    onSignupClick: function() {},
    showPasswordIconInvert: 1,
    showPasswordIconFile: "../../comp/password-input-b/show-btn.png",
    hidePasswordIconFile: "../../comp/password-input-b/hide-btn.png",
    waitingCoverColor: "rgba(0, 0, 0, 0.6)", // The cover of box.waiting (LoadingScreen)
    waitingClock: "ozden", // The clock of box.waiting: "ozden" (a white face) or "ozdenDark" (LoadingScreen.clocks)
    signupPasswordParams: {
        minChar: 8,
        minCharWarningText: "Password must be at least 8 characters",
        mustUseNumber: 1,
        mustUseLetter: 1,
        mustUseUppercase: 0,
        mustUseLowercase: 0,
        mustUseSpecialChar: 0,
    },
    style: {
        customLoginButton: { height: 50, round: 4, color: "#141414", gap: 12, border: 1, borderColor: White(0.1), textColor: White(0.75), },
    }
};

const LoginPageLightStyle = {
    panelName: "MY PANEL v25.08.11",
    primaryColor: "#65A293", // "#2C5A38", "#65A293"
    // THE TAB BAR (the user, 2026-11-05): one light gray (the ozden fields under the mouse; it was a gradient from
    // whitesmoke to #DBDDDC), the edge of the Google / Apple buttons (customLoginButton), a white selected tab
    tab_backgroundColorBottom: "#EFEFEF", // "#242424", "#EFEFEF"
    tab_backgroundColorTop: "#EFEFEF", // "#242424", "#EFEFEF",
    tab_border: 1, // 1, 1
    tab_borderColor: Black(0.2), // White(0.1), Black(0.2),
    tab_textColor: "#373836", // White(0.75), "#373836",
    tab_selectedColor: "white", // "#000000", "white",
    tabStyle: {
        pillIndicator: { shadow: "0 1px 2px rgba(0, 0, 0, 0.12)" }, // WHY: a white tab on the light gray is lost without it
    },
    input_backgroundColor: "#F6F6F6", // "#141414", "#F6F6F6",
    input_lineColor: "transparent",
    input_selectedBackgroundColor: "#F3F4E0", // "#202020", "#F3F4E0",
    input_textColor: Black(0.85), // Black(0.85), White(0.85)
    input_border: 1, // 1, 0
    input_borderColor: Black(0.1), // White(0.1), Black(0.1)
    orTextColor: Black(0.75), // White(0.75), Black(0.75)
    orLineColor: Black(0.1), // White(0.1), Black(0.1)
    showPasswordIconInvert: 0,
    style: {
        customLoginButton: { height: 50, round: 4, color: "whitesmoke", gap: 12, border: 1, borderColor: Black(0.2), textColor: Black(0.75), },
    },
};

const LoginPage = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, LoginPageDefaults);

    // Edit params, if needed:
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const ALERT_TIME = 1000; // ms: the alert closes itself after this.
    const TAB_KEYS = ["login", "signup"]; // The keys of the tabs, by the index of setActiveTab()
    const TAB_MOTION = 0.2; // seconds: the selected tab slides
    const TAB_BAR_PADDING = 2; // px around the tabs, in the bar
    const WAITING_FADE_TIME = 0.2; // seconds
    const ACTION_BUTTON_HEIGHT = 50; // px: LOGIN / SIGN UP (the height of the buttons of the page under them)

    box.customButtonCount = 0;

    const initView = function() {

        // Page container
        box.container = AutoLayout({
            flow: "vertical",
            align: "center top",
            width: "100%",
            height: "100%",
            padding: [30, 50],
            gap: 40,
        });

            // Title
            box.title = Label({
                text: box.panelName,
                right: 30,
                bottom: 30,
                fontSize: 20,
                textColor: White(0.4),
                position: "absolute",
            });

            // Tab Bar
            createTabBar();

            // Views wrapper
            box.contentContainer = startBox({
                width: box.panelWidth,
                height: "auto",
                color: "transparent",
                clipContent: 0,
            });

                box.viewGroup = HGroup({
                    align: "left top",
                    height: "auto",
                    color: "transparent",
                    width: box.panelWidth * 2,
                });
                box.viewGroup.setMotion("left 0.2s");

                    // LOGIN VIEW
                    box.loginBox = AutoLayout({
                        flow: "vertical",
                        align: "left top",
                        gap: 10,
                        height: "auto",
                        width: box.panelWidth,
                        color:"transparent",
                        opacity: 0,
                    });
                    that.setMotion("opacity 0.2s");

                        // The params of every field: an InputB package (inputStyleName), or the input_ colors.
                        const common = (box.inputStyleName) ? {
                            width: "100%",
                            leftPadding: 16,
                            rightPadding: 16,
                            styleName: box.inputStyleName,
                        } : {
                            width: "100%",
                            leftPadding: 16,
                            rightPadding: 16,
                            backgroundColor: box.input_backgroundColor,
                            lineColor: box.input_lineColor,
                            selectedBackgroundColor: box.input_selectedBackgroundColor,
                            selectedLineColor: box.primaryColor,
                        };

                        box.loginEmail = EmailInputB({
                            ...common,
                            titleText: "EMAIL",
                            placeholder: "example@site.com",
                            isRequired: 0,
                            maxChar: 60,
                            inputValue: "",
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkLoginForm();
                        };

                        box.loginPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Enter your password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            isRequired: 0,
                            showPasswordIconFile: box.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile,
                            inputValue: "",
                            minChar: 0,
                            mustUseNumber: 0,
                            mustUseLetter: 0,
                            mustUseUppercase: 0,
                            mustUseLowercase: 0,
                            mustUseSpecialChar: 0,
                            showPasswordIconInvert: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkLoginForm();
                        };

                        // Login button
                        box.loginBtn = createActionButton("LOGIN", function(self, event) {
                            box.onLoginClick(self, event);
                        });

                        // or group
                        box.boxOR = startBox({
                            width: "100%",
                            height: 60,
                            color: "transparent",
                        });
                        that.opacity = 0;

                            // BOX: Line
                            Box(0,0,"100%",1, {
                                color: box.orLineColor,
                            });
                            that.center("top");
                            that.top += 2;

                            // LABEL: or
                            Label({
                                text: "or",
                                textColor: box.orTextColor,
                                color: box.parentBox.color, // WHY: It covers the line behind it.
                                padding: [12,6],
                            });
                            that.center();

                        endBox();

                        // NOTE: The page adds its own login buttons with box.createButtonWithIcon().

                    endAutoLayout(); // end login view

                    // SIGN UP VIEW
                    box.signupBox = AutoLayout({
                        flow: "vertical",
                        align: "left top",
                        gap: 10,
                        height: "auto",
                        width: box.panelWidth,
                        color: "transparent",
                    });
                    that.opacity = 0;
                    that.setMotion("opacity 0.2s");

                        box.signupEmail = EmailInputB({
                            ...common,
                            titleText: "EMAIL",
                            placeholder: "example@site.com",
                            isRequired: 1,
                            maxChar: 60,
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkSignupForm();
                        };

                        box.signupPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Create a password",
                            maxChar: 60,
                            showPasswordIconFile: box.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile,
                            showShowPasswordButton: 1,
                            ...box.signupPasswordParams,
                            showPasswordIconInvert: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkSignupForm();
                        };

                        box.signupPassword2 = PasswordInputB({
                            ...common,
                            titleText: "CONFIRM PASSWORD",
                            placeholder: "Re-enter password",
                            maxChar: 60,
                            showPasswordIconFile: box.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile,
                            showShowPasswordButton: 1,
                            ...box.signupPasswordParams,
                            showPasswordIconInvert: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkSignupForm();
                        };

                        box.signupBtn = createActionButton("SIGN UP", function(self, event) {
                            box.onSignupClick(self, event);
                        });

                    endAutoLayout(); // END SIGN UP VIEW

                endGroup(); // box.viewGroup

            endBox(); // box.contentContainer

        endAutoLayout(); // box.container

        box.alertBox = startBox(0, 0, "100%", "100%", {
            color: Black(0.8),
            opacity: 0,
            clickable: 0,
        });
        box.alertBox.setMotion("opacity 0.2s");

            box.lblAlert = Label({
                left: 40,
                top: 40,
                text: "",
                textColor: "indianred",
                padding: [12, 4],
                round: 4,
                border: 1,
                borderColor: White(0.2),
            });

        endBox();

        box.showAlert = function(text = "Error", color = "indianred") {

            box.lblAlert.text = text;
            box.lblAlert.textColor = color;
            box.alertBox.opacity = 1;
            box.alertBox.clickable = 1;

            if (box.alertBox.timer) clearTimeout(box.alertBox.timer);
            box.alertBox.timer = setTimeout(function() {
                box.alertBox.opacity = 0;
                box.alertBox.clickable = 0;
            }, ALERT_TIME);

        };

        // Waiting
        createWaiting();

        // First check
        checkLoginForm();
        checkSignupForm();

        // Default tab
        box.setActiveTab(0);

    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        // NOTE: box is not set to null. WHY: The page's login code (onLoginClick) may remove it when the login
        //       is done, and still call box.waiting.hide() after that (box.waiting checks box._isRemoved).
        if (box._isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).
        clearTimeout(box.alertBox.timer);
        // NOTE: The LoadingScreen of box.waiting is inside the box: basic.js removes it with the box.

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.

    };

    // Helpers
    // Shows the LOGIN (0) or the SIGN UP (1) view. The tab bar follows it.
    box.setActiveTab = function(index) {

        box.tabBar.setValue(TAB_KEYS[index], 1); // silent: a click on the bar is already here

        if (index === 0) {
            box.viewGroup.left = 0;
            box.loginBox.opacity = 1;
            box.signupBox.opacity = 0;

        } else {
            box.viewGroup.left = box.panelWidth * -1;
            box.loginBox.opacity = 0;
            box.signupBox.opacity = 1;
        }

        // WHY inert: the hidden view is only transparent and not clipped; its LOGIN button (or its fields) next
        //     to the panel took clicks and the focus (a click on the empty side signed in)
        box.loginBox.elem.inert = (index !== 0);
        box.signupBox.elem.inert = (index === 0);

    };

    box.createButtonWithIcon = function(text, iconFile, onClick) {

        // WHY: The "or" line is shown only when there is a button under it.
        box.customButtonCount++;
        box.boxOR.opacity = 1;

        // GROUP: Button (icon, text)
        HGroup({
            width: "100%",
            position: "relative",
            ...box.style.customLoginButton,
        });
        box.loginBox.add(that);
        that.cursor = "pointer";
        that.on("click", onClick);
        UIEffects.press(that);

            Icon(0, 0, 24, 24);
            that.load(iconFile);

            Label({
                text: text,
                textColor: box.style.customLoginButton.textColor,
                fontSize: 20,
            });

        endBox();

    };

    // The look of the LOGIN / SIGN UP bar from the tab_ params (the style of a pill Tabs)
    const getTabBarStyle = function(barPadding) {
        return {
            pillBar: {
                color: box.tab_backgroundColorBottom,
                padding: [barPadding, barPadding],
                gap: 3,
                round: 8,
                border: box.tab_border,
                borderColor: box.tab_borderColor,
            },
            tab: { fontSize: 14, textColor: box.tab_textColor, padding: [12, 4], round: 6, minHeight: 0 },
            tabHover: { color: "transparent", textColor: box.tab_textColor },
            pillActive: { textColor: box.tab_textColor },
            pillIndicator: { color: box.tab_selectedColor, round: 6, shadow: "none", motion: TAB_MOTION },
        };
    };

    // The LOGIN / SIGN UP bar: a pill Tabs in the colors of the tab_ params.
    const createTabBar = function() {

        // WHY: the edge of the bar is drawn inside its padding (as the old bar did), so the bar is not bigger with it.
        const barPadding = Math.max(0, TAB_BAR_PADDING - basic.num(box.tab_border));

        // (the keys of tabStyle win over the look made from the tab_ params)
        const tabStyle = JSON.parse(JSON.stringify(box.tabStyle || {}));
        mergeIntoIfMissing(tabStyle, getTabBarStyle(barPadding));

        box.tabBar = Tabs({
            scale: 1, // WHY: the rest of this component is not scaled (basic.uiScale): its tab bar must not be either
            variant: "pill",
            width: box.tabWidth,
            fullWidth: (box.tabWidth === "auto") ? 0 : 1, // a width: the tabs share it
            tabs: [
                { key: TAB_KEYS[0], text: "LOGIN" },
                { key: TAB_KEYS[1], text: "SIGN UP" },
            ],
            value: TAB_KEYS[0],
            showArrows: 0,
            ariaLabel: "Login or sign up",
            style: tabStyle,
            onChange: function(self) {
                box.setActiveTab(self.getIndex());
            },
        });

        // WHY: Tabs has one bar color; this bar is a gradient from the bottom color (at the top) to the top color.
        const gradient = `linear-gradient(to bottom, ${box.tab_backgroundColorBottom}, ${box.tab_backgroundColorTop})`;
        box.tabBar.strip.css.background = gradient;

    };

    // The waiting cover of the login and sign up jobs: a LoadingScreen with the moving clock.
    // WHY a wrapper: the pages call box.waiting.show() / hide(); LoadingScreen opens with open() / close()
    //     (its show() / hide() are the basic.js ones, they only change "visible").
    const createWaiting = function() {

        const loadingScreen = LoadingScreen({
            opened: 0,
            minDuration: 0,
            fadeDuration: WAITING_FADE_TIME,
            style: {
                box: { color: box.waitingCoverColor },
                clock: LoadingScreen.clocks[box.waitingClock] || LoadingScreen.clocks.ozden,
            },
        });

        box.waiting = {
            screen: loadingScreen,
            show: function() {
                if (box._isRemoved) return;
                loadingScreen.open();
            },
            hide: function() {
                if (box._isRemoved) return;
                loadingScreen.close();
            },
        };

    };

    // Style
    const styleInput = function(obj) {

        // WHY: an InputB package gives the whole look of the field (its round, border and text color).
        if (box.inputStyleName) return;

        obj.background.round = 4;
        obj.background.border = box.input_border;
        obj.background.borderColor = box.input_borderColor;
        obj.warningBall.borderColor = Black(1);

        // NOTE: Only for a text input (a textarea keeps its own text color).
        if (obj.type !== "textarea") obj.input.textColor = box.input_textColor;

    };

    // An action button of a view (LOGIN, SIGN UP): a SmartButton of the kit (buttonStyleName, buttonTone), or the
    // flat button in primaryColor. action(self, event) runs while the button is active.
    // WHY box.onLoginClick read at the click (in the action of the caller): a function given after creation
    //     (loginPage.onLoginClick = fn) was never called.
    const createActionButton = function(text, action) {

        // (a passive SmartButton runs no onClick, also on a key)
        if (box.buttonStyleName) {
            return SmartButton({
                styleName: box.buttonStyleName,
                tone: box.buttonTone,
                labelText: text,
                width: "100%",
                height: ACTION_BUTTON_HEIGHT,
                onClick: action,
            });
        }

        const button = Button({
            text: text,
            textColor: White(0.75),
            fontSize: 20,
            width: "100%",
            height: ACTION_BUTTON_HEIGHT,
            round: 4,
            color: box.primaryColor,
            minimal: 1,
        });
        button.clickable = 1;
        button.cursor = "pointer";
        UIEffects.press(button);
        // WHY the check: a passive button is only clickable 0 (no mouse), a <button> still clicks on Tab + Enter: an
        //     invalid e-mail logged in, a 1-letter password signed up (2026-11-05)
        button.on("click", function(self, event) {
            if (button.clickable != 1) return;
            action(self, event);
        });
        return button;

    };

    // The send buttons are passive (gray, not clickable) until their form is ready.
    const setButtonActive = function(btn, isActive) {
        if (box.buttonStyleName) {
            btn.setEnabled(isActive ? 1 : 0); // (a SmartButton: its own passive look)
            return;
        }
        btn.clickable = isActive ? 1 : 0;
        btn.css.filter = isActive ? "grayscale(0%)" : "grayscale(100%)";
    };

    const checkLoginForm = function() {

        const hasEmail = box.loginEmail.getInputValue().length > 0;
        const hasPassword = box.loginPassword.getInputValue().length > 0;
        const isEmailValid = (box.loginEmail.status === 0);

        setButtonActive(box.loginBtn, hasEmail && hasPassword && isEmailValid);

    };

    const checkSignupForm = function() {

        const isEmailValid = (box.signupEmail.status === 0);
        const isPasswordValid = (box.signupPassword.status === 0);
        const isPassword2Valid = (box.signupPassword2.status === 0);

        setButtonActive(box.signupBtn, isEmailValid && isPasswordValid && isPassword2Valid);

    };

    initView();

    return endObject(box);

};