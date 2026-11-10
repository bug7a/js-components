/* Bismillah */

/*

LoginPage - v26.10

UI COMPONENT
- A full page with two views: LOGIN and SIGN UP (a tab bar switches them). The page does the service work in
  onLoginClick / onSignupClick and calls box.waiting.show() / hide() and box.showAlert() around it.
- The tab bar is Tabs (the pill variant, colored by the tab_ params), the waiting cover is
  LoadingScreen with the moving clock (box.waiting.show() / hide(); waitingCoverColor, waitingClock).
  tabWidth: "auto" (default) is as wide as its tabs; a width (Ex: the panelWidth) makes the
  tabs share it. tabStyle: more keys of the style of that Tabs (pillBar, tab, pillActive, pillIndicator...), over the
  look made from the tab_ params.
- LoginPageLightStyle: the params of a light page (...LoginPageLightStyle, or mergeIntoIfMissing). Its tab bar
: one light gray (#EFEFEF), the edge of the Google / Apple buttons (Black(0.2)), a white
  selected tab with a soft shadow (its tabStyle). A page that gives its own tabStyle after it replaces that shadow.
- The LOGIN / SIGN UP buttons: buttonStyleName "" (default) keeps the flat buttons in
  primaryColor; a SmartButton template (Ex: "ozden3") makes them SmartButtons of the kit, in buttonTone (Ex:
  "blue"), with the text color of the tone. A passive one has the passive look of SmartButton.
- The logos of createButtonWithIcon, drawn in the page (no links to other sites):
  LoginPage.GOOGLE_LOGO (the colored G) and LoginPage.getAppleLogo(color) (the apple in one color on a transparent
  ground: give it the text color of its button, loginPage.style.customLoginButton.textColor).

LOAD FIRST (in this order):
    basic.js, comp/ui-effects.js, comp/tooltip.js, comp/text-field.js, comp/email-field.js,
    comp/password-field.js, comp/tabs.js, comp/smart-button.js, comp/loading-screen.js
    (LoadingScreen needs smart-button.js: the clock drawing)


Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

- Every call to a service is outside the component: a page finishes the login with its own service (onLoginClick, onSignupClick).
- The dark and the light page are set with the params.
- The login button is passive while both fields are empty.
- The sign up button is active only when the form has no error.

*/

"use strict";

// Default values:
const LoginPageDefaults = {
    panelWidth: 420,
    //autoFit: 1, // add page.fit() function onResize
    primaryColor: "#2C5A38",
    tab_backgroundColorBottom: "#242424", // "#242424", "whitesmoke"
    tab_backgroundColorTop: "#242424",
    tab_borderColor: White(0.1), // White(0.1), Black(0),
    tab_border: 1, // 1, 0
    tab_textColor: White(0.75), // White(0.75), "#373836",
    tab_selectedColor: "#000000", // "#000000", "white",
    tabWidth: "auto", // the LOGIN / SIGN UP bar: "auto" (as wide as its tabs) or a width the tabs share (Ex: the panelWidth)
    tabStyle: {}, // more keys of the style of its Tabs (pillBar, tab, pillActive, pillIndicator...), over the tab_ look
    inputStyleName: "", // "": the fields take the input_ colors below. A TextField package ("ozden", "ozdenDark"...): the fields take its look.
    buttonStyleName: "", // "": LOGIN / SIGN UP are flat buttons in primaryColor. A SmartButton template ("ozden3"...): SmartButtons
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
    allowHtml: 0, // 1: panelName, the alerts and the texts of the buttons are HTML (only for your own texts)
    onLoginClick: function() {},
    onSignupClick: function() {},
    showPasswordIconInvert: 1,
    showPasswordIconFile: "", // "": the eye of PasswordField
    hidePasswordIconFile: "", // "": the crossed eye of PasswordField
    waitingCoverColor: "rgba(0, 0, 0, 0.6)", // The cover of box.waiting (LoadingScreen)
    waitingClock: "ozden", // The clock of box.waiting: "ozden" (a white face) or "ozdenDark" (LoadingScreen.clocks)
    signupPasswordParams: {
        minLength: 8,
        minLengthWarningText: "Password must be at least 8 characters",
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
    primaryColor: "#65A293",
    // THE TAB BAR: one light gray (the ozden fields under the mouse), the edge of the Google / Apple buttons (customLoginButton), a white selected tab
    tab_backgroundColorBottom: "#EFEFEF",
    tab_backgroundColorTop: "#EFEFEF",
    tab_border: 1, // 1, 1
    tab_borderColor: Black(0.2), // White(0.1), Black(0.2),
    tab_textColor: "#373836", // White(0.75), "#373836",
    tab_selectedColor: "white", // "#000000", "white",
    tabStyle: {
        pillIndicator: { shadow: "0 1px 2px rgba(0, 0, 0, 0.12)" }, // WHY: a white tab on the light gray is lost without it
    },
    input_backgroundColor: "#F6F6F6",
    input_lineColor: "transparent",
    input_selectedBackgroundColor: "#F3F4E0",
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

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

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
                right: 30,
                bottom: 30,
                fontSize: 20,
                textColor: White(0.4),
                position: "absolute",
            });
            setText(box.title, box.panelName);

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

                        // The params of every field: a TextField package (inputStyleName), or the input_ colors.
                        const common = (box.inputStyleName) ? {
                            width: "100%",
                            leftPadding: 16,
                            rightPadding: 16,
                            styleName: box.inputStyleName,
                        } : {
                            styleName: "modern", // the first look of TextField: the input_ colors are for it
                            width: "100%",
                            leftPadding: 16,
                            rightPadding: 16,
                            backgroundColor: box.input_backgroundColor,
                            lineColor: box.input_lineColor,
                            focusBackgroundColor: box.input_selectedBackgroundColor,
                            focusLineColor: box.primaryColor,
                        };

                        box.loginEmail = EmailField({
                            ...common,
                            titleText: "EMAIL",
                            placeholder: "example@site.com",
                            required: 0,
                            maxLength: 60,
                            value: "",
                        });
                        styleInput(that);
                        that.onChange = function() {
                            checkLoginForm();
                        };

                        box.loginPassword = PasswordField({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Enter your password",
                            maxLength: 60,
                            showShowPasswordButton: 1,
                            required: 0,
                            showPasswordIconFile: box.showPasswordIconFile || PasswordFieldDefaults.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile || PasswordFieldDefaults.hidePasswordIconFile,
                            value: "",
                            minLength: 0,
                            mustUseNumber: 0,
                            mustUseLetter: 0,
                            mustUseUppercase: 0,
                            mustUseLowercase: 0,
                            mustUseSpecialChar: 0,
                            invertIconColor: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onChange = function() {
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

                        box.signupEmail = EmailField({
                            ...common,
                            titleText: "EMAIL",
                            placeholder: "example@site.com",
                            required: 1,
                            maxLength: 60,
                        });
                        styleInput(that);
                        that.onChange = function() {
                            checkSignupForm();
                        };

                        box.signupPassword = PasswordField({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Create a password",
                            maxLength: 60,
                            showPasswordIconFile: box.showPasswordIconFile || PasswordFieldDefaults.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile || PasswordFieldDefaults.hidePasswordIconFile,
                            showShowPasswordButton: 1,
                            ...box.signupPasswordParams,
                            invertIconColor: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onChange = function() {
                            checkSignupForm();
                        };

                        box.signupPassword2 = PasswordField({
                            ...common,
                            titleText: "CONFIRM PASSWORD",
                            placeholder: "Re-enter password",
                            maxLength: 60,
                            showPasswordIconFile: box.showPasswordIconFile || PasswordFieldDefaults.showPasswordIconFile,
                            hidePasswordIconFile: box.hidePasswordIconFile || PasswordFieldDefaults.hidePasswordIconFile,
                            showShowPasswordButton: 1,
                            ...box.signupPasswordParams,
                            invertIconColor: box.showPasswordIconInvert,
                        });
                        styleInput(that);
                        that.onChange = function() {
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

            setText(box.lblAlert, text);
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
                textColor: box.style.customLoginButton.textColor,
                fontSize: 20,
            });
            setText(that, text);

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

        // WHY: the edge of the bar is drawn inside its padding, so the bar is not bigger with it.
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

        // WHY: a TextField package gives the whole look of the field (its round, border and text color).
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
                allowHtml: box.allowHtml,
                width: "100%",
                height: ACTION_BUTTON_HEIGHT,
                onClick: action,
            });
        }

        const button = Button({
            textColor: White(0.75),
            fontSize: 20,
            width: "100%",
            height: ACTION_BUTTON_HEIGHT,
            round: 4,
            color: box.primaryColor,
            minimal: 1,
        });
        setText(button, text);
        button.clickable = 1;
        button.cursor = "pointer";
        UIEffects.press(button);
        // WHY the check: a passive button is only clickable 0 (no mouse), a <button> still clicks on Tab + Enter: an
        //     invalid e-mail logged in, a 1-letter password signed up
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

        const hasEmail = box.loginEmail.getValue().length > 0;
        const hasPassword = box.loginPassword.getValue().length > 0;
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

// *** THE LOGOS OF THE SIGN-IN BUTTONS (createButtonWithIcon)
// WHY drawn here: no link to another site, no picture file.

// An SVG text as a picture file (Icon.load).
LoginPage.toSvgFile = function(svg) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

// The colored G of Google: the 4 shapes of its sign-in logo (www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg).
LoginPage.GOOGLE_LOGO_SHAPES = [
    { color: "#4285F4", path: "M117.6,61.3636364 C117.6,57.1090909 117.218182,53.0181818 116.509091,49.0909091 L60,49.0909091 L60,72.3 L92.2909091,72.3 C90.9,79.8 86.6727273,86.1545455 80.3181818,90.4090909 L80.3181818,105.463636 L99.7090909,105.463636 C111.054545,95.0181818 117.6,79.6363636 117.6,61.3636364 L117.6,61.3636364 Z" },
    { color: "#34A853", path: "M60,120 C76.2,120 89.7818182,114.627273 99.7090909,105.463636 L80.3181818,90.4090909 C74.9454545,94.0090909 68.0727273,96.1363636 60,96.1363636 C44.3727273,96.1363636 31.1454545,85.5818182 26.4272727,71.4 L6.38181818,71.4 L6.38181818,86.9454545 C16.2545455,106.554545 36.5454545,120 60,120 L60,120 Z" },
    { color: "#FBBC05", path: "M26.4272727,71.4 C25.2272727,67.8 24.5454545,63.9545455 24.5454545,60 C24.5454545,56.0454545 25.2272727,52.2 26.4272727,48.6 L26.4272727,33.0545455 L6.38181818,33.0545455 C2.31818182,41.1545455 0,50.3181818 0,60 C0,69.6818182 2.31818182,78.8454545 6.38181818,86.9454545 L26.4272727,71.4 L26.4272727,71.4 Z" },
    { color: "#EA4335", path: "M60,23.8636364 C68.8090909,23.8636364 76.7181818,26.8909091 82.9363636,32.8363636 L100.145455,15.6272727 C89.7545455,5.94545455 76.1727273,0 60,0 C36.5454545,0 16.2545455,13.4454545 6.38181818,33.0545455 L26.4272727,48.6 C31.1454545,34.4181818 44.3727273,23.8636364 60,23.8636364 L60,23.8636364 Z" }
];

LoginPage.GOOGLE_LOGO = (function() {
    const paths = LoginPage.GOOGLE_LOGO_SHAPES.map(function(shape) {
        return '<path fill="' + shape.color + '" d="' + shape.path + '"/>';
    });
    return LoginPage.toSvgFile('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 118 120">' + paths.join("") + '</svg>');
})();
// USAGE: loginPage.createButtonWithIcon("Sign in with Google", LoginPage.GOOGLE_LOGO, onLoginWithGoogle);

LoginPage.APPLE_LOGO_PATH = "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

// The apple of Apple in one color on a transparent ground: the text color of its button (dark on a light button,
// light on a dark one).
LoginPage.getAppleLogo = function(color) {
    const path = '<path fill="' + color + '" d="' + LoginPage.APPLE_LOGO_PATH + '"/>';
    return LoginPage.toSvgFile('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' + path + '</svg>');
};
// USAGE: loginPage.createButtonWithIcon("Sign in with Apple", LoginPage.getAppleLogo(loginPage.style.customLoginButton.textColor), onLoginWithApple);