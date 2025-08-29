/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

- Karanlık ve aydınlık sayfaları parametrelerden ayarlayabilsin.
- giriş için iki input da boş ise button pasif olsun.
- signup form için form hatasız ise button akfif olsun.
- login-page.js belki bir komponent gibi genel klasöre eklenebilir. Başka sistemlerle de aynı şekilde kullanılabilir.

*/

"use strict";

// Default values:
const LoginPageDefaults = {
    supabase: null,
    panelWidth: 420,
    //autoFit: 1, // add page.fit() function onResize
    primaryColor: "#2C5A38", // "#2C5A38", "#65A293"
    tab_backgroundColorBottom: "#242424", // "#242424", "whitesmoke"
    tab_backgroundColorTop: "#242424", // "#242424", "#DBDDDC",
    tab_borderColor: White(0.1), // White(0.1), Black(0.2),
    tab_textColor: White(0.75), // White(0.75), "#373836",
    tab_selectedColor: "#000000", // "#000000", "white",
    input_backgroundColor: "#141414", // "#141414", "#F6F6F6",
    input_lineColor: "transparent",
    input_selectedBackgroundColor: "#202020", // "#202020", "#F3F4E0",
    // waiting_invertIconColor: 1,
    panelName: "MY PANEL v25.08.11",
    googleLogo: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
    appleLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRsP-EH-Fc-gjQMFgxj4g1pkFGVCK8Y2deHA&s",
    onSuccess: function() {},
};

const LoginPage = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, LoginPageDefaults);

    // Edit params, if needed:
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";

    // BOX: Component container
    let box = startObject(params);
    //box.elem.style.filter = "invert(100%)";
    //page.color = "white";

    const createView = function() {

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
            //that.elem.style.fontFamily = "opensans-bold";

            // Tab Bar
            box.tabBar = TextTabs({
                key: "0",
                selectedIndex: 0,
                tabList: ["LOGIN", "SIGN UP"],
                invertColor: 0,
                backgroundStyle: {
                    colorBottom: box.tab_backgroundColorBottom, // "whitesmoke",
                    colorTop: box.tab_backgroundColorTop, // "#DBDDDC",
                    round: 8,
                    border: 1,
                    borderColor: box.tab_borderColor,
                },
                labelStyle: {
                    fontSize: 14, 
                    textColor: box.tab_textColor, //"#373836",
                    padding: [12, 4],
                    round: 0,
                    color: "transparent",
                },
                selectedStyle: {
                    color: box.tab_selectedColor, // "#000000", "white"
                    round: 6,
                    border: 0,
                    borderColor: Black(0.2),
                },
            });
            that.onClick = function(self) {
                box.setActiveTab(self.index);
                //println(`Clicked Tab ${self.index}`);
            };

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
                    //position: "relative",
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

                        const common = { 
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
                            inputValue: ""
                        });
                        styleInput(that);
                        that.onEdit = function() {
                            checkLoginForm();
                        }

                        box.loginPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Enter your password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            isRequired: 0,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn.png",
                            inputValue: "",
                            minChar: 0,
                            mustUseNumber: 0,
                            mustUseLetter: 0,
                            mustUseUppercase: 0,
                            mustUseLowercase: 0,
                            mustUseSpecialChar: 0,

                        });
                        styleInput(that);
                        that.btnShowPassword.elem.style.filter = "invert(100%)";
                        that.onEdit = function() {
                            checkLoginForm();
                        }

                        // Login button
                        box.loginBtn = Button({ 
                            text: "LOGIN", 
                            textColor: White(0.75), 
                            fontSize: 20, 
                            width: "100%", 
                            height: 50, 
                            round: 4, 
                            color: box.primaryColor, 
                            minimal: 1  
                        });
                        box.loginBtn.clickable = 1;
                        box.loginBtn.elem.style.cursor = "pointer";
                        UIEffects.button(that);

                        // or group
                        startBox({
                            width: "100%",
                            height: 60,
                            color: "transparent",
                        });

                            // line
                            Box(0,0,"100%",1, {
                                color: White(0.1),
                            });
                            that.center("top");
                            that.top += 2;

                            // or
                            Label({
                                text: "or",
                                textColor: White(0.75),
                                color: "#000000",
                                padding: [12,6],
                            });
                            that.center();

                        endBox();

                        box.createButtonWithIcon("Sign in with Google", box.googleLogo, onLoginWithGoogle);
                        box.createButtonWithIcon("Sign in with Apple", box.appleLogo, onLoginWithApple);

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
                        }

                        box.signupPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Create a password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn.png",
                            minChar: 8,
                            minCharWarningText: "Password must be at least 8 characters",
                            mustUseNumber: 1,
                            mustUseLetter: 1,
                            mustUseUppercase: 0,
                            mustUseLowercase: 0,
                            mustUseSpecialChar: 0,
                        });
                        styleInput(that);
                        that.btnShowPassword.elem.style.filter = "invert(100%)";
                        that.onEdit = function() {
                            checkSignupForm();
                        }

                        box.signupPassword2 = PasswordInputB({
                            ...common,
                            titleText: "CONFIRM PASSWORD",
                            placeholder: "Re-enter password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn.png",
                            minChar: 8,
                            minCharWarningText: "Password must be at least 8 characters",
                            mustUseNumber: 1,
                            mustUseLetter: 1,
                            mustUseUppercase: 0,
                            mustUseLowercase: 0,
                            mustUseSpecialChar: 0,
                        });
                        styleInput(that);
                        that.btnShowPassword.elem.style.filter = "invert(100%)";
                        that.onEdit = function() {
                            checkSignupForm();
                        }

                        box.signupBtn =  Button({ 
                            text: "SIGN UP", 
                            textColor: White(0.75), 
                            fontSize: 20, 
                            width: "100%", 
                            height: 50, 
                            round: 4, 
                            color: box.primaryColor, 
                            minimal: 1
                        });
                        UIEffects.button(that);
                        box.signupBtn.clickable = 1;
                        box.signupBtn.elem.style.cursor = "pointer";
                        //box.signupBtn = box.signupBtn;

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

            //AutoLayout();

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

            //endAutoLayout();

        endBox();

        box.showAlert = function(text = "Error", color = "indianred") {

            box.lblAlert.text = text;
            box.lblAlert.textColor = color;
            box.alertBox.opacity = 1;
            box.alertBox.clickable = 1;

            if (box.alertBox.timer) clearTimeout(box.alertBox.timer);
            box.alertBox.timer = setTimeout(function() {
                // close alert
                box.alertBox.opacity = 0;
                box.alertBox.clickable = 0;
            }, 1000);

        };

        // Waiting
        box.waiting = Waiting({
            animated: 1, 
            coverBackgroundColor: "rgba(0,0,0,0.6)",
            waitingIcon: "../../comp-m2/waiting/clock3.png",
        });         
        box.waiting.icon.elem.style.filter = "invert(100%)";

        // events:
        box.loginBtn.on("click", onLoginClick);
        box.signupBtn.on("click", onSignupClick);

        // First check
        checkLoginForm();
        checkSignupForm();

        // Default tab
        box.setActiveTab(0);

    };        

    // Helpers
    box.setActiveTab = function(index) {

        if (index === 0) {
            box.viewGroup.left = 0;
            box.loginBox.opacity = 1;
            box.signupBox.opacity = 0;

        } else {
            box.viewGroup.left = box.panelWidth * -1;
            box.loginBox.opacity = 0;
            box.signupBox.opacity = 1;
        }

    };

    box.createButtonWithIcon = function(text, iconFile, onClick) {
    
        HGroup({
            width: "100%", height: 50, round: 4, color: "#141414", gap: 12, border: 1, borderColor: White(0.1),
        });
        that.elem.style.cursor = "pointer";
        that.on("click", onClick);
        UIEffects.button(that);

            Icon(0, 0, 24, 24);
            that.load(iconFile);

            Label({
                text: text,
                textColor: White(0.75), 
                fontSize: 20, 
            });

        endBox();

    };

    // Style
    const styleInput = function(obj) {

        obj.background.round = 4;
        obj.background.border = 1;
        obj.background.borderColor = White(0.1);
        obj.warningBall.borderColor = Black(1);
        
        //obj.background.setMotion("background-color 0.2s");
        if (obj.type === "textarea") {
            // Onlt for textarea
        } else {
            //obj.inputGroup.gap = 4;
            obj.input.textColor = White(0.85);
            
            //obj.input.color = "whitesmoke";
            //obj.input.border = 1;
            //obj.input.borderColor = "lightgray";
            //obj.input.inputElement.style.padding = "0px 6px";
            //obj.input.inputElement.style.marginLeft = "-6px";
        }
        

    };

    const checkLoginForm = function() {

        const _count1 = box.loginEmail.getInputValue().length;
        const _count2 = box.loginPassword.getInputValue().length;

        if (_count1 > 0 && _count2 > 0 && box.loginEmail.status === 0) {
            box.loginBtn.clickable = 1;
            box.loginBtn.elem.style.filter = "grayscale(0%)";
            //box.loginBtn.color = box.primaryColor;
        } else {
            box.loginBtn.clickable = 0;
            box.loginBtn.elem.style.filter = "grayscale(100%)";
            //box.loginBtn.color = "gray";
        }

    };

    const checkSignupForm = function() {

        const _status1 = box.signupEmail.status;
        const _status2 = box.signupPassword.status;
        const _status3 = box.signupPassword2.status;

        if (_status1 === 0 && _status2 === 0 && _status3 === 0) {
            box.signupBtn.clickable = 1;
            box.signupBtn.elem.style.filter = "grayscale(0%)";
        } else {
            box.signupBtn.clickable = 0;
            box.signupBtn.elem.style.filter = "grayscale(100%)";
        }

    };

    const onLoginWithGoogle = async function() {

        const { data, error } = await box.supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `http://example.com/auth/callback`,
            },
        });

    };

    const onLoginWithApple = async function() {

        const { data, error } = await box.supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `http://example.com/auth/callback`,
            },
        });

    };

    // Actions
    const onLoginClick = async function() {

        const email = box.loginEmail.getInputValue();
        const password = box.loginPassword.getInputValue();

        if (!email || !password) { box.showAlert("Please enter email and password"); return; }

        box.waiting.show();

        try {
            const { data, error } = await box.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                box.showAlert("Login failed: " + error.message);
            } else {
                
                // Login successful
                //console.table(data);
                box.onSuccess();
                //window.location.reload();

            }
        } catch (e) {
            box.showAlert("Login error");
        } finally {
            box.waiting.hide();
        }

    };

    const onSignupClick = async function() {

        const email = box.signupEmail.getInputValue();
        const p1 = box.signupPassword.getInputValue();
        const p2 = box.signupPassword2.getInputValue();

        if (!email || !p1 || !p2) { box.showAlert("Please fill all fields"); return; }
        if (p1 !== p2) { box.showAlert("Passwords do not match"); return; }

        box.waiting.show();

        try {
            const { error } = await box.supabase.auth.signUp({ email, password: p1 });
            if (error) {
                box.showAlert("Sign up failed: " + error.message);
            } else {
                box.showAlert("Sign up successful. Check your email to confirm.", "#5DB182");
                box.signupPassword.setInputValue("");
                box.signupPassword2.setInputValue("");
                box.loginEmail.setInputValue(box.signupEmail.getInputValue());
                box.setActiveTab(0);
            }
        } catch (e) {
            box.showAlert("Sign up error");
        } finally {
            box.waiting.hide();
        }

    };

    createView();
    
    return endObject(box);

};