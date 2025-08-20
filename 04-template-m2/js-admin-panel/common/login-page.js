/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const LoginPageDefaults = {
    supabase: null,
    panelWidth: 420,
    autoFit: 1,
    primaryColor: "#2C5A38",
    panelName: "MY PANEL v25.08.11",
    googleLogo: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
    appleLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRsP-EH-Fc-gjQMFgxj4g1pkFGVCK8Y2deHA&s",
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
                    colorBottom: "#242424", // "whitesmoke",
                    colorTop: "#242424", // "#DBDDDC",
                    round: 8,
                    border: 1,
                    borderColor: White(0.1),
                },
                labelStyle: {
                    fontSize: 14, 
                    textColor: White(0.75), //"#373836",
                    padding: [12, 4],
                    round: 0,
                    color: "transparent",
                },
                selectedStyle: {
                    color: "#000000", // "#2C5A38", // "white"
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
                            backgroundColor: "#141414",
                            lineColor: "transparent",
                            selectedBackgroundColor: "#202020",
                            selectedLineColor: box.primaryColor,
                        };
                        
                        box.loginEmail = EmailInputB({
                            ...common,
                            titleText: "EMAIL",
                            placeholder: "example@site.com",
                            isRequired: 0,
                            maxChar: 60,
                            inputValue: "bugra.ozden@gmail.com"
                        });
                        styleInput(that);

                        box.loginPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Enter your password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            isRequired: 0,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn2.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn2.png",
                            inputValue: "123456",
                        });
                        styleInput(that);
                        that.btnShowPassword.elem.style.filter = "invert(100%)";

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

                        /*
                        HGroup({
                            width: "100%", height: 50, round: 4, color: "#141414", gap: 12, border: 1, borderColor: White(0.1),
                        });
                        that.elem.style.cursor = "pointer";
                        that.on("click", onLoginWithGoogle);
                        UIEffects.button(that);

                            Icon(0, 0, 24, 24);
                            that.load("https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg");

                            Label({
                                text: "Sign in with Google",
                                textColor: White(0.75), 
                                fontSize: 20, 
                            });

                        endBox();
                        */

                        box.createButtonWithIcon("Sign in with Apple", box.appleLogo, onLoginWithApple);

                        /*
                        HGroup({
                            width: "100%", height: 50, round: 4, color: "#141414", gap: 12, border: 1, borderColor: White(0.1),
                        });
                        that.elem.style.cursor = "pointer";
                        that.on("click", onLoginWithApple);
                        UIEffects.button(that);

                            Icon(0, 0, 24, 24);
                            that.load("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRsP-EH-Fc-gjQMFgxj4g1pkFGVCK8Y2deHA&s");

                            Label({
                                text: "Sign in with Apple",
                                textColor: White(0.75), 
                                fontSize: 20, 
                            });

                        endBox();
                        */

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

                        box.signupPassword = PasswordInputB({
                            ...common,
                            titleText: "PASSWORD",
                            placeholder: "Create a password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn.png",
                        });
                        styleInput(that);

                        box.signupPassword2 = PasswordInputB({
                            ...common,
                            titleText: "CONFIRM PASSWORD",
                            placeholder: "Re-enter password",
                            maxChar: 60,
                            showShowPasswordButton: 1,
                            showPasswordIconFile: "../../comp-m2/password-input-b/show-btn.png",
                            hidePasswordIconFile: "../../comp-m2/password-input-b/hide-btn.png",
                        });
                        styleInput(that);

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

        // Waiting
        box.waiting = Waiting({
            animated: 1, 
            coverBackgroundColor: "rgba(0,0,0,0.6)",
            waitingIcon: "../../comp-m2/waiting/clock2.png",
        });         
        box.waiting.icon.elem.style.filter = "invert(100%)";

        // events:
        box.loginBtn.on("click", onLoginClick);
        box.signupBtn.on("click", onSignupClick);

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
        if (!email || !password) { alert("Please enter email and password"); return; }

        box.waiting.show();

        try {
            //const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
            //const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
            const { data, error } = await box.supabase.auth.signInWithPassword({ email, password });
            if (error) {
                //alert("Login failed: " + error.message);
            } else {
                //alert("Login successful");
                //box.visible = 0;
                //contentBox.visible = 1;
                //console.table(data);
                window.location.reload();
            }
        } catch (e) {
            //alert("Login error");
        } finally {
            box.waiting.hide();
        }

    };

    const onSignupClick = async function() {

        const email = box.signupEmail.getInputValue();
        const p1 = box.signupPassword.getInputValue();
        const p2 = box.signupPassword2.getInputValue();

        if (!email || !p1 || !p2) { alert("Please fill all fields"); return; }
        if (p1 !== p2) { alert("Passwords do not match"); return; }

        box.waiting.show();

        try {
            //const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
            //const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY);
            const { error } = await box.supabase.auth.signUp({ email, password: p1 });
            if (error) {
                alert("Sign up failed: " + error.message);
            } else {
                alert("Sign up successful. Check your email to confirm.");
                box.signupPassword.setInputValue("");
                box.signupPassword2.setInputValue("");
            }
        } catch (e) {
            alert("Sign up error");
        } finally {
            box.waiting.hide();
        }

    };

    createView();
    
    return endObject(box);

};