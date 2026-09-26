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
const FormDefaults = {
    minWidth: 500,
    maxWidth: 700,
    buttonColor:  "#65A293",
    buttonText: "SEND",
    showDetailWarning: 1,
    missingEntryText: "{{count}} missing entry",
    missingEntriesText: "{{count}} missing entries",
    warningText: "<b>{{name}}</b> can't be empty",
    errorText: "<b>{{name}}</b> is not valid",
    minimalButton: 0,
    doubleInputAlwaysHorizontal: 0,
    showPassiveButtonHint: 1, // 1: A hint is shown when the mouse is over the passive send button.
    passiveButtonHintText: "Please fill in the missing fields to send the form.",
    onEdit: function(input) {},
    onSendClick: function(json) {},
};

const Form = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, FormDefaults);

    // Edit params, if needed:
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    //let privateVar = "";

    // *** PUBLIC VARIABLES:
    // Input Objects list [var]
    box.inputList = [];
    // DoubleInput group list [var]
    box.groupList = [];

    // NOTE: Default values are also public variables.


    // *** PRIVATE FUNCTIONS:
    const privateFunc = function() {};

    // Give effects to a button
    const actionButtonEffect = function(btn) {

        btn.setMotion("filter 0.2s, transform 0.2s");

        btn.on("mouseover", function() {
            btn.elem.style.filter = "brightness(120%)";
        });

        btn.on("mouseout", function() {
            btn.elem.style.filter = "brightness(100%)";
        });

        btn.on("mousedown", function() {
            btn.elem.style.transform = "scale(0.95)";
            btn.elem.style.filter = "brightness(80%)";
            
            setTimeout(function(){
                btn.elem.style.transform = "scale(1)";
                btn.elem.style.filter = "brightness(120%)";
            }, 200);
        });

    };

    // pageKey: "success", "error"
    box.showMessage = function(messageData) {

        if (!messageData) messageData = {
            iconColor: "#3C8553",
            iconFile: "assets/success.png",
            messageText: "Data sent successfully.",
            buttonText: "OKAY",
            backgroundColor: "rgba(255,255,255,0.85)",
            onClose: function() {},
        };

        // GROUP: Sent Message
        const messageBox = VGroup({
            color: messageData.backgroundColor,
            gap: 10,
            clickable: 1, // WHY: Dont scroll the main page
        });

        // Animated message
        that.opacity = 0;
        that.elem.style.transform = "scale(0.8) translateY(40px)";
        that.setMotion("transform 0.2s, opacity 0.2s");
        that.withMotion((self) => {
            self.elem.style.transform = "scale(1) translateY(0px)";
            self.opacity = 1;
        });

            VGroup({
                width: "auto",
                height: "auto",
                color: messageData.iconColor,
                round: 100,
            });

                Icon({
                    width: 32,
                    height: 32,
                });
                that.load(messageData.iconFile);
                that.elem.style.filter = "invert(100%)";

            endGroup();

            // message
            Label({
                text: messageData.messageText,
            });

            // button
            Label({
                text: messageData.buttonText,
                padding: [12, 4],
                round: 12,
                color: "#373836",
                textColor: "#EBEBEB",
                fontSize: 14,
                clickable: 1,
            });
            that.elem.style.cursor = "pointer";
            that.on("click", function(self) {
                messageData.onClose();
                self.clickable = 0;
                messageBox.opacity = 0;
                messageBox.elem.style.transform = "scale(0.8) translateY(0px)";
                setTimeout(() => {
                    messageBox.remove();
                }, 200);
            });

        endGroup();

    };

    // Puts the cover exactly over the send button. (The button width is 100%.)
    const layoutSendCover = function() {
        if (!box.btnSendCover) return;
        box.btnSendCover.left = box.btnSend.left;
        box.btnSendCover.top = box.btnSend.top;
        box.btnSendCover.width = box.btnSend.elem.offsetWidth || box.btnSend.width;
        box.btnSendCover.height = box.btnSend.elem.offsetHeight || box.btnSend.height;
    };

    // The cover works only while the send button is passive.
    // WHY: With the form ready the cover would be over the button and would eat the click.
    const setPassiveButtonCover = function(isOn) {
        if (!box.btnSendCover) return;
        box.btnSendCover.clickable = isOn;
        if (!isOn && box.btnSendCover.tooltip) box.btnSendCover.tooltip.visible = 0;
    };

    // Check the form and create warnings, active the send button
    const checkForm = function() {

        let warningCount = 0;
        let warningDetailMessage = "";

        box.inputList.forEach((item) => {
            //console.log(item.status);
            if (item.status !== 0) {
                if (item.status == 1) {
                    warningDetailMessage += box.warningText.replace("{{name}}", item.titleText) + "<br>";
                } else if (item.status == 2) {
                    warningDetailMessage += box.errorText.replace("{{name}}", item.titleText) + "<br>";
                }
                warningCount++;
            }
        });

        box.lblWarningDetail.text = warningDetailMessage;

        if (warningCount > 0) {
            box.btnSend.clickable = 0;
            box.btnSend.elem.style.filter = "grayscale(100%)";
            setPassiveButtonCover(1);
            if (warningCount == 1) {
                box.lblWarning.text = box.missingEntryText.replace("{{count}}", warningCount);
            } else {
                box.lblWarning.text = box.missingEntriesText.replace("{{count}}", warningCount);
            }
            box.lblWarning.opacity = 1;
            box.lblWarning.clickable = 1;

        } else {
            box.lblWarning.opacity = 0;
            box.lblWarning.clickable = 0;
            box.btnSend.clickable = 1;
            box.btnSend.elem.style.filter = "grayscale(0%)";
            setPassiveButtonCover(0);
        }

    };

    /*
    const sendData = function(formJSON, success, fail) {

        postJSON(SERVICE_URL, formJSON, function (err, response) {
            if (err) {
                fail(err);
            } else {
                success(response);
            }
        });

    };
    */

    const createJSON = function() {

        const result = [];

        box.inputList.forEach((item) => {
            const itemData = {};
            itemData.key = item.key;
            itemData.type = item.type;
            itemData.titleText = item.titleText;
            itemData.inputValue = item.getInputValue();

            result.push(itemData);

        });

        return result;

    };

    const postJSON = function(url, data, callback) {

        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        callback(null, result); // Başarılı cevap
                    } catch (e) {
                        callback(new Error("Geçersiz JSON cevabı"));
                    }
                } else {
                    callback(new Error(`HTTP Hatası: ${xhr.status}`));
                }
            }
        };

        xhr.onerror = function () {
            callback(new Error("İstek gönderilirken bir hata oluştu."));
        };

        xhr.send(JSON.stringify(data));
        
    };

    // On page resized call
    const pageResized = function() {

        page.fit(box.minWidth);
        // NOTE: Page width will not be smaller than box.minWidth but page.zoom (1) will start get smaller

        // (page.width < 550), (page.zoom < 1)
        const _flow = (page.width < (box.minWidth + 50) && box.doubleInputAlwaysHorizontal != 1 ) ? "vertical" : "horizontal"; 

        box.groupList.forEach(group => {
            group.flow = _flow;
        });

        // Center form onResize
        box.formContainer.center("left");

    };

    // *** PUBLIC FUNCTIONS:

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        // WHY: page events are not cleaned by box.remove().
        page.remove_onResize(pageResized);
        // WHY: The form itself scrolls, so its scroll bar is on the parent (page), not in the box.
        if (box.scrollBar) box.scrollBar.remove();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    box.setPassiveButtonHintText = function(text) {
        box.passiveButtonHintText = text;
        if (box.btnSendCover && box.btnSendCover.tooltip) box.btnSendCover.tooltip.setHintText(text);
    };
    // USAGE: get: form.passiveButtonHintText, set: form.setPassiveButtonHintText("...")

    // If you need to change a param after it is created. You can write a setter function for it.
    box.addInput = function(input) {

        box.inputGroup.add(input);
        input.width = "100%";
        input.position = "relative";

        box.inputList.push(input);

        checkFormOnEdit(input);
        box.refresh();

    };

    box.addTitle = function(obj) {

        box.titleGroup.add(obj);
        //obj.width = "100%";
        obj.position = "relative";

    }

    box.addDoubleInput = function(input, input2) {

        // GROUP: First Name, Last Name
        const nameGroup = AutoLayout({
            flow: "horizontal",
            gap: 20,
            width: "100%",
            height: "auto",
        });

            // input1

            // input2

        endAutoLayout(); // GROUP: First Name, Last Name

        nameGroup.add(input);
        input.width = "100%";
        input.position = "relative";
        
        nameGroup.add(input2);
        input2.width = "100%";
        input2.position = "relative";

        box.inputGroup.add(nameGroup);
        nameGroup.position = "relative";

        box.groupList.push(nameGroup);

        box.inputList.push(input);
        box.inputList.push(input2);

        checkFormOnEdit(input);
        checkFormOnEdit(input2);
        box.refresh();

    };
    
    box.refresh = function() {

        checkForm();

    };

    const checkFormOnEdit = function(input) {

        input.onEdit = function() {
            checkForm();
            box.onEdit(input);
        }
        
        input.onFocus = function() {
            checkForm();
        }
        input.onBlur = function() {
            checkForm();
        }

    };

    // *** OBJECT VIEW:
    box.scrollY = 1;

        // Form container 
        box.formContainer = startBox(0, 0, {
            height: "auto",
            width: "100%",
            color: "transparent",
        });
        that.elem.style.minWidth = box.minWidth + "px";
        that.elem.style.maxWidth = box.maxWidth + "px";

            // GROUP: Form Items
            AutoLayout({
                flow: "vertical",
                align: "top center",
                gap: 20,
                padding: [40, 40],
                height: "auto",
                position: "relative", // Because box.formContainer.height = "auto"
            });

                // GROUP: Title, Description
                box.titleGroup = AutoLayout({
                    flow: "vertical",
                    align: "left top",
                    gap: 0,
                    width: "100%",
                    height: "auto",
                });

                /*
                    // LABEL: Title
                    Label({
                        text: FORM_TITLE,
                        textColor: "#373836",
                        fontSize: 26,
                    });
                    that.elem.style.fontFamily = "opensans-bold";

                    // LABEL: Description
                    Label({
                        text: FORM_DESCRIPTION,
                        fontSize: 16,
                        textColor: "#999999",
                    });
                    that.elem.style.fontStyle = "italic";
                    */

                endAutoLayout(); // GROUP: Title, Description
                box.titleGroup.elem.style.marginBottom = "20px";

                // GROUP: Input Items
                box.inputGroup = AutoLayout({
                    flow: "vertical",
                    align: "top center",
                    gap: 20,
                    padding: [0, 0],
                    width: "100%",
                    height: "auto",
                    position: "relative", // Because box.formContainer.height = "auto"
                });

                    // input items
                
                endAutoLayout();
                
                // GROUP: Form send button
                AutoLayout({
                    width: "100%",
                    height: "auto",
                    clipContent: 0,
                });
                that.elem.style.marginTop = "20px";

                    // BUTTON: Send Button
                    box.btnSend = Button({
                        width: "100%",
                        text: box.buttonText,
                        color: box.buttonColor,
                        minimal: box.minimalButton,
                    });
                    actionButtonEffect(that);
                    that.on("mousedown", function() {
                        
                        // FORM CHECKED AND READY:

                        // create json
                        const formJSON = createJSON();
                        //console.table(formJSON);
                        box.onSendClick(formJSON);

                    });
                    box.btnSend.clickable = 0; // that.on("mousedown" set box.btnSend.clickable = 1
                    box.btnSend.elem.style.filter = "grayscale(100%)";

                    // BOX: Catches the mouse while the send button is passive.
                    // WHY: clickable: 0 puts "pointer-events: none" on the button, so the button
                    //      itself can not see the mouse and can not show a hint.
                    // NOTE: A Button can NOT hold other objects, only a Box can. So the cover is a
                    //       brother of the button in the same group and is put over it, the same way
                    //       box.lblWarning is. (A box created inside the button would also send its
                    //       mouse events up to the button and colour it on hover.)
                    //       It is turned off as soon as the form is ready, so it never eats a click.
                    if (box.showPassiveButtonHint == 1 && typeof Tooltip !== "undefined") {

                        box.btnSendCover = Box({
                            position: "absolute",
                            color: "transparent",
                            clickable: 1,
                        });
                        //box.btnSendCover.elem.style.cursor = "not-allowed";

                        box.btnSendCover.tooltip = Tooltip({
                            target: box.btnSendCover,
                            hintText: box.passiveButtonHintText,
                            hintPosition: "top",
                            lbl_color: "white",
                            lbl_textColor: "#141414",
                            lbl_borderColor: "#141414",
                            lbl_border: 1,
                            lbl_fontSize: 14,
                            lbl_round: 2,
                        });

                        layoutSendCover();
                        box.btnSend.onResize(layoutSendCover); // The button is 100% wide.

                    }

                    // LABEL: box.lblWarning
                    box.lblWarning = Label({
                        text: "2 Warnings",
                        textColor: "#373836",
                        color: "#F1C74A",
                        padding: [8, 2],
                        position: "absolute",
                        fontSize: 14,
                        round: 4,
                        border: 1,
                        opacity: 0,
                    });
                    that.setMotion("opacity 0.2s");
                    box.lblWarning.left = box.btnSend.left + 5;
                    box.lblWarning.top = box.btnSend.top + 5;

                    // LABEL: box.lblWarningDetail
                    box.lblWarningDetail = Label({
                        text: "",
                        textColor: "#373836",
                        color: "whitesmoke",
                        padding: [8, 2],
                        position: "absolute",
                        fontSize: 12,
                        round: 4,
                        border: 1,
                        opacity: 0,
                    });
                    that.elem.style.transform = "scale(0.7)";
                    that.setMotion("opacity 0.2s, transform 0.2s");

                    // Show box.lblWarningDetail
                    box.lblWarning.on("mouseover", function() {
                        if(box.showDetailWarning == 1) {
                            box.lblWarningDetail.opacity = 1;
                            box.lblWarningDetail.aline(box.lblWarning, "top", 8, "left");
                            box.lblWarningDetail.elem.style.transform = "scale(1)";
                        }
                    });

                    // Hide box.lblWarningDetail
                    box.lblWarning.on("mouseout", function() {
                        box.lblWarningDetail.opacity = 0;
                        box.lblWarningDetail.elem.style.transform = "scale(0.7)";
                    });

                endAutoLayout(); // GROUP: Form send button

            endAutoLayout(); // GROUP: Form Items

        endBox(); // Form container 

        // SCROLL BAR: Scrollable page container (only if basic/scroll-bar.js is loaded)
        if (typeof ScrollBar === "function") box.scrollBar = ScrollBar({
            scrollableBox: box,
            bar_border: 0,
            bar_round: 2,
            bar_borderColor: "rgba(0, 0, 0, 1)",
            bar_width: 4,
            bar_mouseOverWidth: 4, //8
            bar_mouseOverColor: "#373836",
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
            bar_color: "#373836",
            neverHide: 0,
            showDots: 1,
        });

    // *** OBJECT INIT CODE:
    box.refresh();

    pageResized();
    page.onResize(pageResized);
    
    return endObject(box);

};