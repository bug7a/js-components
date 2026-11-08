/* Bismillah */

/*

Dialog - v26.10

A dialog window over the page: a title, a message, your fields (inputs) or any content, and buttons. The page under
it waits (a modal dialog: a dark cover, the keyboard stays in the dialog).
NOTE: still in development: more style packages come; their buttons may be animated.

- Buttons (SmartButton, load it first): [{ text, type, key, iconFile, align, ask, ariaLabel, onClick }]
  - type: "primary" (the main action), "secondary" (Cancel), "danger" (a delete), "warning", "success", "info"
    (the tones of SmartButton: cyan, orange, yellow, green, blue), "icon" (only an icon: a white square).
  - align: "left": at the left side of the footer (Ex: the trash); the others stay at the right side.
  - ask: "Click again to delete." -> two clicks: the first one turns the button orange and shows the text in a bubble
    over it; the second one runs onClick. It forgets after 5 s. (The ask of SmartButton.)
  - onClick(dialog, button) returns false: the dialog stays open. A Promise: the button waits (its clock), the
    others are disabled, and the dialog closes when it ends (a rejected one keeps it open).
- Fields: fields: [{ key, titleText, placeholder, value, required, validate(value) -> error text }] make TextField
  fields (comp/text-field.js, load it with comp/tooltip.js; without it a plain Input). A "primary" button checks
  them first: an error is written under the message and the field gets the focus. getValues() -> { key: value }.
- content(dialog): any objects in the body (under the message).
- setStatus(text, type): a line under the content: "error" (red), "success" (green) or "info" (gray).
- Closes with a button, Escape, a click on the cover (closeOnCover) or close(). onClose(self, reason, buttonKey).
- Keyboard: Tab stays in the dialog; the first field (else the primary button) gets the focus; the focus goes back to
  the opener when it closes. More than one dialog: Escape closes the top one.
- Dialog.confirm(), Dialog.alert(), Dialog.prompt(): Promises.
- variant: "centered": the title and the message in the middle, the buttons one under the other
  (as wide as the card; the primary / danger one first, on the gray band of the footer) and an icon at the top
  (topIconFile: a file or an "<svg" text: dark in a light gray circle). The look: style.centered.
  topIconTone: "cyan", "orange", "yellow", "green" or "blue" (the tones of SmartButton) puts
  the icon in three tones of it (Dialog.ICON_TONES): a light circle, and in an "<svg" text the words LIGHT and STRONG
  are filled in with a light and a strong tone (a two-tone icon; currentColor is the strong tone). "": gray.
  CIRCLE in it is the color of the circle: a ring that cuts a part out (Ex: around the dot of a new mail).
- Motion: the cover comes from nothing and the card rises 50 px while it comes (0.2 s); it goes at once; none with reduced motion.
- Style packages: "ozden" (default), "ozdenDark" (for a dark page; Dialog.confirm / alert / prompt take styleName too),
  "minimal", "minimalDark" (_designs/minimal-theme.htm: a card with a line, no shadow, the minimal buttons and fields).
  (Dialog.styles)
- The buttons: style.buttons[type] = { styleName, tone, style }: a template of SmartButton
  ("ozden"; Cancel and icon: "ozden3", a faint edge), a tone of it
  (primary: "cyan", danger: "orange"...; icon: "white") and only the keys that differ.
- Scale: scale multiplies every size of the dialog (its style, width, motion, its buttons and the bubble
  of their ask). null (default): basic.uiScale (1; a page fitted with page.fit() sets 1 / page.zoom: the dialog keeps
  its size on the screen). Dialog.confirm / alert / prompt take it too. The objects of content(dialog) are made by
  the page: dialog.scale is their scale. (The TextField fields keep their own px: TextField has no scale param yet.)

USAGE:
Dialog({
    titleText: "Publish the article?",
    messageText: "Your article will be seen by everyone on the blog.",
    fields: [{ key: "title", titleText: "ARTICLE TITLE", placeholder: "How I started to garden", required: 1 }],
    buttons: [
        { key: "delete", type: "icon", align: "left", iconFile: TRASH_ICON, ariaLabel: "Delete the draft", ask: "Click again to delete the draft.", onClick: deleteDraft },
        { key: "cancel", text: "Cancel", type: "secondary" },
        { key: "publish", text: "Publish", type: "primary", iconFile: PEN_ICON, onClick: function (dialog) { return publish(dialog.getValues()); } },
    ],
    onClose: function (self, reason, buttonKey) { },
});
if (await Dialog.confirm({ titleText: "Delete the file?", messageText: "It can not be undone.", confirmText: "Delete", danger: 1 })) { }
const name = await Dialog.prompt({ titleText: "Rename", value: "report.pdf", validate: (text) => (text.trim()) ? "" : "A name is needed." });
Dialog.alert({ titleText: "Saved", scale: 1.5 }); // every size x 1.5 (default: basic.uiScale)

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const DialogDefaults = {
    key: "0",
    width: 460, // the card (a number); a small screen: as wide as the screen
    titleText: "",
    messageText: "",
    allowHtml: 0, // 1: the title and the message are HTML (only for your own texts)
    fields: [], // [{ key, titleText, placeholder, value, required, validate }]
    content: null, // function (dialog) {}: objects in the body
    buttons: [], // [{ text, type, key, iconFile, align, ask, ariaLabel, onClick }]
    closeOnCover: 1, // a click on the cover closes it
    closeOnEscape: 1,
    autoOpen: 1,
    removeOnClose: 1, // 0: close() only hides it; open() shows it again
    ariaLabel: "", // when there is no title
    variant: "", // "": the buttons in a row at the bottom; "centered": the texts in the middle, the buttons one under the other
    topIconFile: "", // "centered": the icon at the top (a file, or an "<svg" text drawn with currentColor or LIGHT / STRONG)
    topIconTone: "", // "centered": "cyan", "orange", "yellow", "green", "blue": the circle and the icon in its tones; "": gray
    scale: null, // every size multiplied (Ex: 1.5). null: basic.uiScale (1 / page.zoom on a page fitted with page.fit())
    onOpen: function (self) { },
    onClose: function (self, reason, buttonKey) { }, // reason: "button", "escape", "cover", "api"
    styleName: "ozden", // "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to Dialog.styles
    style: { // The ozden style package (default): the first dialog of smart-button-3-ozden.htm
        cover: { color: Black(0.8), zIndex: 4000 },
        card: {
            color: "white",
            round: 8,
            border: 2,
            borderColor: "#232323",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), inset 0 -3px 0 rgba(0, 0, 0, 0.06)",
            padding: [24, 22], // the body: [left / right, top / bottom]
            gap: 8,
            margin: 20, // to the edges of a small screen
        },
        title: { fontSize: 20, textColor: "#1B1F23", fontFamily: "opensans-bold" },
        message: { fontSize: 16, textColor: Black(0.55), lineHeight: 1.5 },
        // successColor ("it is saved" under the content): the green of SmartButton (#7BC362), deeper.
        // WHY deeper: #7BC362 is 2.2:1 on white; #498335 is 4.6:1, enough for a small text
        // errorColor: #E8796D deeper and calmer (the same hue). WHY: #E8796D is 2.8:1 on white; #C74B3D is 4.7:1
        status: { fontSize: 13, errorColor: "#C74B3D", infoColor: Black(0.55), successColor: "#498335" },
        footer: { color: "#FAFAF9", lineColor: Black(0.1), padding: [16, 14], gap: 10, buttonHeight: 40, iconButtonWidth: 50 },
        fieldStyleName: "ozden", // the styleName of the TextField fields
        // variant: "centered" (the colors of ozden)
        centered: {
            // A light gray circle on white, a dark icon
            iconArea: { height: 116, color: "white", round: 6 }, // the area at the top
            iconCircle: { size: 100, color: "#EEEEEE" },
            icon: { size: 56, color: "#232323", lightColor: "#D2D2D0" }, // lightColor: LIGHT of a two-tone icon (no tone)
            buttonHeight: 48,
            buttonGap: 10,
            // The buttons are on the band of the footer (its color and line), one under the other
            footerPadding: [22, 18],
        },
        // The looks of the buttons: a template of SmartButton, a tone of it and only what differs from them. The colors
        // of the situations are the tones of SmartButton (the draft _designs/smart-button-colors.htm)
        buttons: {
            primary: { styleName: "ozden", tone: "cyan", style: {} },
            // the gray of the template, a faint edge (as the Cancel of 02-comp-examples/smart-button.htm)
            secondary: { styleName: "ozden3", tone: "", style: {} },
            danger: { styleName: "ozden", tone: "orange", style: {} },
            warning: { styleName: "ozden", tone: "yellow", style: {} },
            success: { styleName: "ozden", tone: "green", style: {} },
            info: { styleName: "ozden", tone: "blue", style: {} },
            // white, whitesmoke under the mouse (as the trash of the SmartButton samples). An icon button has no room at
            // its sides by itself. A faint edge as Cancel (ozden3)
            icon: {
                styleName: "ozden3",
                tone: "white",
                style: {
                    icon: { opacity: 1 },
                },
            },
        },
        // A button that asks again (ask): its red look and its bubble (comp/tooltip.js) are the style.ask of
        // SmartButton (its default). A page or a package may give its own here:
        // ask: { button: { color, border, borderColor, boxShadow, textColor, iconFilter }, bubble, time }
    },
};

const Dialog = function (params = {}) {

    // Merge style package: params.style > Dialog.styles[styleName] > DialogDefaults.style (ozden)
    basic.applyStylePackage(params, Dialog.styles, DialogDefaults);

    // Merge params:
    mergeIntoIfMissing(params, DialogDefaults);

    // Scale: every size of the dialog multiplied
    params.scale = params.scale ?? basic.uiScale;
    params.style = Dialog.scaleStyle(params.style, params.scale);

    // WHY: startObject() copies params: the functions and the lists are kept as they are (copies of the lists)
    const contentFunc = params.content;
    const buttonList = (params.buttons || []).map(function (button, index) {
        return Object.assign({ type: "secondary", key: "button" + index, text: "" }, button);
    });
    const fieldList = (params.fields || []).map(function (field, index) {
        return Object.assign({ key: "field" + index, titleText: "", placeholder: "", value: "", required: 0 }, field);
    });
    delete params.content;
    delete params.buttons;
    delete params.fields;

    // (width is the width of the card; the box itself covers the page)
    const cardWidth = (typeof params.width === "number") ? params.width : DialogDefaults.width;
    const cardWidthPx = cardWidth * params.scale;
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";

    // WHY: the dialog covers the page: it is made on page, even when Dialog() is called inside a group
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: Component container (the cover)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "dialog-" + (Dialog.counter++);
    const OPEN_TIME = "0.2s";
    const OPEN_CURVE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // fast at first, soft at its place
    const OPEN_MOVE = 50 * box.scale; // px: the card comes up from here
    // The px of the view that are not in the style (multiplied by scale, like the style)
    const LINE_WIDTH = 1 * box.scale; // the line over the footer
    const SECTION_SPACE = 8 * box.scale; // over the fields, under the icon at the top
    const FIELD_GAP = 10 * box.scale; // between the fields (and the objects of content)
    const STATUS_MIN_HEIGHT = 18 * box.scale;
    const INPUT_HEIGHT = 44 * box.scale; // a plain Input (without TextField)
    const isCentered = (params.variant == "centered");
    let isOpen = 0;
    let isBusy = 0;
    let busyRun = 0; // WHY: a Promise of a closed dialog must not close it after it is opened again
    let isCoverPressed = 0; // the mouse went down on the cover (not in the card)
    let openerElement = null; // the focus goes back here

    // *** PUBLIC VARIABLES:
    box.buttonList = []; // { data, button } (button: the SmartButton)
    box.fieldList = []; // { data, input } (input: TextField or Input)

    // *** PRIVATE FUNCTIONS:

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    // *** FIELDS

    const createField = function (field) {
        let input;
        if (typeof TextField !== "undefined") {
            input = TextField({
                styleName: _s.fieldStyleName,
                scale: box.scale, // (taken when TextField has a scale param; its sizes are fixed px today)
                width: "100%",
                titleText: field.titleText,
                placeholder: field.placeholder,
                value: field.value,
                required: field.required ? 1 : 0,
            });
        } else {
            input = Input({ width: "100%", height: INPUT_HEIGHT, placeholder: field.placeholder || field.titleText, value: field.value });
        }
        input.css = { maxWidth: "100%" };
        box.fieldList.push({ data: field, input: input });
    };

    const getFieldValue = function (item) {
        if (item.input.getValue) return item.input.getValue();
        return item.input.value;
    };

    const getFieldElement = function (item) {
        return item.input.elem.querySelector("input, textarea") || item.input.elem;
    };

    // The first field with an error: its text (else "")
    const checkFields = function () {
        for (const item of box.fieldList) {
            const value = getFieldValue(item);
            let error = "";
            if (item.data.required && String(value).trim() === "") error = (item.data.titleText || "This field") + " is needed.";
            else if (typeof item.data.validate === "function") error = item.data.validate(value) || "";
            if (item.input.showWarningIfNotValid) item.input.showWarningIfNotValid(!error);
            if (error) {
                getFieldElement(item).focus();
                return error;
            }
        }
        return "";
    };

    // *** BUTTONS

    const isLeftButton = function (data) {
        return data.align == "left";
    };

    const getButtonWidth = function (isIcon) {
        if (isCentered) return "100%";
        if (isIcon) return _s.footer.iconButtonWidth;
        return "auto";
    };

    // The order of the buttons: in a row, the left ones first (their margin pushes the others to the right side);
    // one under the other, the main action first
    const isMainButton = function (data) {
        return Dialog.MAIN_TYPES.includes(data.type);
    };

    const getButtonOrder = function (list) {
        const firstOnes = list.filter(isCentered ? isMainButton : isLeftButton);
        const otherOnes = list.filter(function (data) { return !firstOnes.includes(data); });
        return firstOnes.concat(otherOnes);
    };

    // The style of a button: its look, and the ask of the dialog when it has one (else the default of SmartButton)
    const getButtonStyle = function (look) {
        const style = JSON.parse(JSON.stringify(look.style));
        if (_s.ask) style.ask = _s.ask;
        if (box.scale === 1) return style;
        return scaleButtonStyle(style, look);
    };

    // WHY: SmartButton has no scale param: its whole style (the look over its template and tone) is multiplied here,
    //      and the button gets scale 1 (a SmartButton that has one must not multiply it again).
    //      The whole style has the colors of the tone: a style given in full wins over a tone.
    const scaleButtonStyle = function (style, look) {
        const fullStyle = SmartButton.applyLook({ styleName: look.styleName, tone: look.tone, style: style }).style;
        const scaled = basic.scaleStyle(fullStyle, box.scale);
        // (the sizes that are not named like one)
        scaled.layout.iconSideTrim = fullStyle.layout.iconSideTrim * box.scale;
        scaled.box.boxShadow = basic.scaleCssText(fullStyle.box.boxShadow, box.scale);
        scaled.ask.button.boxShadow = basic.scaleCssText(fullStyle.ask.button.boxShadow, box.scale);
        // the bubble of the ask: Tooltip.show() multiplies its look itself
        scaled.ask.bubble = Object.assign({}, fullStyle.ask.bubble, { scale: box.scale });
        return scaled;
    };

    const createButton = function (data) {

        const isIcon = (data.type == "icon");
        const look = _s.buttons[data.type] || _s.buttons.secondary;

        const button = SmartButton({
            styleName: look.styleName,
            tone: look.tone || "",
            scale: 1, // WHY: its style is in the px of the dialog already (getButtonStyle)
            width: getButtonWidth(isIcon),
            height: isCentered ? _s.centered.buttonHeight : _s.footer.buttonHeight,
            labelText: isIcon ? "" : data.text,
            ariaLabel: data.ariaLabel || data.text,
            iconFile: data.iconFile || "",
            style: getButtonStyle(look),
            ask: data.ask || "",
            onBeforeClick: function () { return canPressButton(item); },
            onClick: function () { runButton(item); },
        });
        // WHY margin auto: the free room goes after the buttons of the left side, the others stay at the right side
        if (data.align == "left" && !isCentered) button.css = { marginRight: "auto" };

        const item = { data: data, button: button };
        box.buttonList.push(item);
        return item;

    };

    // Before the press of a button (and before its ask: the button asks "Sure?" itself, SmartButton ask)
    const canPressButton = function (item) {
        if (!box || isBusy) return false;
        // WHY the fields first: a form with an error must not ask "Sure?" first
        if (item.data.type == "primary" && box.fieldList.length) {
            const error = checkFields();
            box.setStatus(error, "error");
            if (error) return false;
        }
        return true;
    };

    // The press went through (its ask too)
    const runButton = function (item) {

        let result;
        if (typeof item.data.onClick === "function") result = item.data.onClick(box, item.data);
        // WHY: onClick may close (or remove) the dialog itself
        if (!box || !isOpen) return;

        // A Promise: the button waits until it ends
        if (result && typeof result.then === "function") {
            box.setBusy(1, item.data.key);
            const run = busyRun;
            result.then(function (value) {
                if (!box || run !== busyRun) return;
                box.setBusy(0);
                if (value !== false) box.close("button", item.data.key);
            }, function (error) {
                if (!box || run !== busyRun) return;
                box.setBusy(0);
                console.error(error); // WHY: the page shows the error (Ex: setStatus); the dialog stays open
            });
            return;
        }

        if (result !== false) box.close("button", item.data.key);

    };

    // *** KEYBOARD AND SIZE

    const getFocusableElements = function () {
        const selector = "input, textarea, select, button, a[href], [tabindex]:not([tabindex='-1'])";
        return Array.from(box.card.elem.querySelectorAll(selector)).filter(function (elem) {
            return !elem.disabled && !elem.closest("[inert]") && elem.offsetParent !== null;
        });
    };

    // The first field, else the primary button, else the card
    const focusFirst = function () {
        const field = box.fieldList[0];
        const primary = box.buttonList.find(function (item) { return item.data.type == "primary"; });
        const target = field ? getFieldElement(field) : (primary ? primary.button.elem : box.card.elem);
        target.focus({ preventScroll: true });
    };

    // Tab stays in the dialog
    const onKeyDown = function (self, event) {
        if (!box || !isOpen || Dialog.getTop() !== box || event.key != "Tab") return;
        const list = getFocusableElements();
        if (list.length == 0) {
            event.preventDefault();
            box.card.elem.focus();
            return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        const isFocusOutside = !box.card.elem.contains(document.activeElement);
        if (event.shiftKey && (document.activeElement === first || isFocusOutside)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || isFocusOutside)) {
            event.preventDefault();
            first.focus();
        }
    };

    // The card is as wide as width, or as the screen (with a margin) on a small one
    const layout = function () {
        if (!box) return;
        box.card.css = { width: cardWidthPx + "px", maxWidth: "calc(100% - " + (_s.card.margin * 2) + "px)" };
    };

    // *** PUBLIC FUNCTIONS:

    box.open = function () {

        if (!box || isOpen) return box;
        isOpen = 1;

        openerElement = document.activeElement;
        Dialog.stack.push(box);
        box.zIndex = _s.cover.zIndex + (Dialog.zCounter++) * 2; // WHY not stack.length: a dialog opened again went under an open one
        layout();
        box.visible = 1;

        // The cover comes from nothing, the card rises 50 px while it comes (both in 0.2 s)
        // WHY the cover color, not the opacity of the box: the card is in the box, it has its own fade.
        if (!isReducedMotion()) {
            box.setMotionNow("none");
            box.card.setMotionNow("none");
            box.color = "transparent";
            box.card.opacity = 0;
            box.card.css = { transform: "translateY(" + OPEN_MOVE + "px)" };
            // WHY: the start look must be drawn before the motion is turned on
            void box.elem.offsetHeight;
            box.setMotionNow("background-color " + OPEN_TIME);
            box.card.setMotionNow("opacity " + OPEN_TIME + " " + OPEN_CURVE + ", transform " + OPEN_TIME + " " + OPEN_CURVE);
            box.color = _s.cover.color;
            box.card.opacity = 1;
            box.card.css = { transform: "none" };
        }

        focusFirst();
        box.onOpen(box);
        return box;

    };

    // It goes at once. reason: "button", "escape", "cover", "api"; buttonKey: the pressed button
    box.close = function (reason = "api", buttonKey = "") {

        if (!box || !isOpen) return;
        isOpen = 0;
        Dialog.stack = Dialog.stack.filter(function (dialog) { return dialog !== box; });
        busyRun++;
        if (isBusy) box.setBusy(0);
        // WHY: an asking button must not stay red (and need one click) when the dialog is opened again
        box.buttonList.forEach(function (item) {
            item.button.cancelAsk();
        });
        const hadFocus = box.elem.contains(document.activeElement) || document.activeElement === document.body;
        box.visible = 0;

        // WHY: the focus goes back to the object that opened the dialog (keyboard users do not lose their place)
        // WHY hadFocus: a dialog under another one must not take the focus out of the top one
        if (hadFocus && openerElement && openerElement.isConnected && typeof openerElement.focus === "function") {
            openerElement.focus({ preventScroll: true });
        }

        const self = box;
        self.onClose(self, reason, buttonKey);
        if (basic.isOn(self.removeOnClose)) self.remove();

    };

    box.isOpen = function () {
        return isOpen;
    };

    // Busy: the button of buttonKey waits (its clock), the others are disabled
    box.setBusy = function (busy, buttonKey = "") {
        if (!box) return;
        const wasBusy = isBusy;
        isBusy = busy ? 1 : 0;
        box.buttonList.forEach(function (item) {
            const isTarget = isBusy && item.data.key == buttonKey;
            // WHY: a button the page turned off (getButton(key).setEnabled(0)) stays off after the wait
            if (isBusy && !wasBusy) item.enabledBeforeBusy = item.button.enabled;
            item.button.setWaiting(isTarget ? 1 : 0);
            if (isBusy) item.button.setEnabled(isTarget ? item.enabledBeforeBusy : 0);
            else if (wasBusy) item.button.setEnabled(item.enabledBeforeBusy);
        });
        box.card.aria = { busy: isBusy ? "true" : "false" };
    };
    // USAGE: dialog.setBusy(1, "save") ... dialog.setBusy(0)

    box.isBusy = function () {
        return isBusy;
    };

    // A line under the message (and the fields, the content): type "error" (red), "success" (green) or "info"; "" hides it
    box.setStatus = function (text, type = "info") {
        const colors = { error: _s.status.errorColor, success: _s.status.successColor, info: _s.status.infoColor };
        box.lblStatus.plainText = text || "";
        box.lblStatus.textColor = colors[type] || _s.status.infoColor;
        box.lblStatus.visible = text ? 1 : 0;
    };
    // USAGE: dialog.setStatus("Could not save.", "error") / dialog.setStatus("The title is saved.", "success")

    box.setTitleText = function (text) {
        box.titleText = text;
        setText(box.lblTitle, text);
        box.lblTitle.visible = text ? 1 : 0;
        box.card.aria = { labelledby: text ? box.lblTitle.elem.id : null, label: text ? null : (box.ariaLabel || null) };
    };

    box.setMessageText = function (text) {
        box.messageText = text;
        setText(box.lblMessage, text);
        box.lblMessage.visible = text ? 1 : 0;
        box.card.aria = { describedby: text ? box.lblMessage.elem.id : null };
    };

    // { key: value } of the fields
    box.getValues = function () {
        const values = {};
        box.fieldList.forEach(function (item) { values[item.data.key] = getFieldValue(item); });
        return values;
    };

    box.getButton = function (key) {
        const item = box.buttonList.find(function (b) { return b.data.key == key; });
        return item ? item.button : null;
    };

    // REMOVE: the static Dialog.stack must not keep a removed dialog (the objects go with basic.js remove())
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return;
        if (isOpen) {
            const keepRemoveOnClose = box.removeOnClose;
            box.removeOnClose = 0; // WHY: close() must not call remove() again
            box.close("api");
            if (!box) return; // (onClose removed it)
            box.removeOnClose = keepRemoveOnClose;
        }
        Dialog.stack = Dialog.stack.filter(function (dialog) { return dialog !== box; });
        superRemove.call(box);
        box = null;
    };

    // *** OBJECT VIEW:

    const textAlign = isCentered ? "center" : "left";

    // A row at the bottom, on a band with a line over it
    const createFooter = function () {
        box.footer = HGroup({ width: "100%", height: "auto", align: "right center", gap: _s.footer.gap, padding: _s.footer.padding, color: _s.footer.color, clipContent: 0 });
        box.footer.css = { borderTop: LINE_WIDTH + "px solid " + _s.footer.lineColor, borderRadius: "0 0 " + _s.card.round + "px " + _s.card.round + "px", flexShrink: "0" };
    };

    // One under the other, as wide as the card, on the band of the footer (a line over it)
    const createCenteredFooter = function () {
        box.footer = VGroup({ width: "100%", height: "auto", align: "center top", gap: _s.centered.buttonGap, padding: _s.centered.footerPadding, color: _s.footer.color, clipContent: 0 });
        box.footer.css = { alignItems: "stretch", borderTop: LINE_WIDTH + "px solid " + _s.footer.lineColor, borderRadius: "0 0 " + _s.card.round + "px " + _s.card.round + "px", flexShrink: "0" };
    };

    // The colors of the icon at the top: three tones of topIconTone, else the gray of the style
    const getTopIconLook = function () {
        const tone = Dialog.ICON_TONES[box.topIconTone];
        if (tone) return tone;
        const _c = _s.centered;
        return { circle: _c.iconCircle.color, light: _c.icon.lightColor, strong: _c.icon.color };
    };

    // WHY: the words LIGHT and STRONG in an "<svg" text are the places of the two colors of a two-tone icon; CIRCLE
    //      is the color of the circle behind it (a ring around a part looks cut out of the icon)
    const fillIconColors = function (file, look) {
        const text = String(file);
        if (!text.trim().startsWith("<svg")) return file;
        return text.split("LIGHT").join(look.light).split("STRONG").join(look.strong).split("CIRCLE").join(look.circle);
    };

    // The icon at the top: in a light circle (gray: a dark icon; topIconTone: the tones of SmartButton)
    const createTopIcon = function () {
        const _c = _s.centered;
        const look = getTopIconLook();
        box.iconArea = HGroup({ width: "100%", height: _c.iconArea.height, align: "center center", color: _c.iconArea.color, round: _c.iconArea.round });
        box.iconArea.css = { flexShrink: "0", marginBottom: SECTION_SPACE + "px" };
            HGroup({ width: _c.iconCircle.size, height: _c.iconCircle.size, align: "center center", color: look.circle, round: _c.iconCircle.size / 2 });
                box.topIcon = createIconView(fillIconColors(box.topIconFile, look), { size: _c.icon.size, color: look.strong });
            endGroup();
        endGroup();
    };

    // WHY two ways: an "<svg" text takes the color of the style (currentColor); a file keeps its own colors
    const createIconView = function (file, look) {
        if (String(file).trim().startsWith("<svg")) {
            // WHY clipContent 0 and overflow visible: a part that moves (the lid of a bin that lifts) goes out of the
            //     drawing for a moment; it was cut at the top
            const label = Label({ width: look.size, height: look.size, text: file, textColor: look.color, clipContent: 0, css: { lineHeight: "0" } });
            const svg = label.elem.querySelector("svg");
            if (svg) {
                svg.setAttribute("width", "100%");
                svg.setAttribute("height", "100%");
                svg.style.overflow = "visible";
            }
            return label;
        }
        const icon = Icon({ width: look.size, height: look.size });
        icon.load(file);
        return icon;
    };

    box.color = _s.cover.color;
    // WHY: "absolute", not "fixed": the cover is on page, as big as page (page never scrolls). page.fit() / page.zoom give
    //      <body> a transform, and a fixed box inside a transformed one is measured on it (a 0 px high body: the
    //      dialog is not seen).
    box.css = { position: "absolute" };
    box.elem.style.display = "block"; // WHY: visible keeps the display type: without it, visible: 1 does not show it again
    box.clickable = 1;

    // GROUP: The card in the middle
    box.layoutGroup = HGroup({ width: "100%", height: "100%", align: "center center", clipContent: 0 });

        // GROUP: Card
        box.card = VGroup({
            width: cardWidthPx,
            height: "auto",
            align: "left top",
            gap: 0,
            color: _s.card.color,
            round: _s.card.round,
            border: _s.card.border,
            borderColor: _s.card.borderColor,
            boxShadow: _s.card.boxShadow,
            clipContent: 0,
            clickable: 1,
            role: "dialog",
            tabIndex: -1,
        });
        box.card.css = { alignItems: "stretch", maxHeight: "calc(100% - " + (_s.card.margin * 2) + "px)", outline: "none" };
        box.card.aria = { modal: "true" };

            // GROUP: Body (the title, the message, the fields, the content, the status); it scrolls when it is long
            box.body = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.card.gap, padding: _s.card.padding, clipContent: 0 });
            box.body.css = { alignItems: "stretch", flex: "1 1 auto", minHeight: "0px", overflowX: "hidden" };
            box.body.scrollY = 1;

                if (isCentered && box.topIconFile) createTopIcon();

                // LABEL: Title
                box.lblTitle = Label({ ..._s.title, width: "100%", textAlign: textAlign, css: { overflowWrap: "anywhere" } });
                box.lblTitle.elem.id = id + "-title";

                // LABEL: Message
                box.lblMessage = Label({ fontSize: _s.message.fontSize, textColor: _s.message.textColor, width: "100%", textAlign: textAlign, css: { whiteSpace: "normal", lineHeight: String(_s.message.lineHeight), textWrap: "balance", overflowWrap: "anywhere" } });
                box.lblMessage.elem.id = id + "-message";

                // GROUP: Fields and content
                if (fieldList.length || typeof contentFunc === "function") {
                    box.content = VGroup({ width: "100%", height: "auto", align: "left top", gap: FIELD_GAP, clipContent: 0 });
                    box.content.css = { alignItems: "stretch", marginTop: SECTION_SPACE + "px", flexShrink: "0" };
                        fieldList.forEach(createField);
                        if (typeof contentFunc === "function") contentFunc(box);
                    endGroup();
                }

                // LABEL: Status (an error of a field, a message of the page)
                box.lblStatus = Label({ fontSize: _s.status.fontSize, bold: 1, width: "100%", textAlign: textAlign, css: { whiteSpace: "normal", minHeight: STATUS_MIN_HEIGHT + "px" } });
                box.lblStatus.role = "status";

            endGroup();

            // GROUP: Footer (the buttons)
            if (isCentered) createCenteredFooter();
            else createFooter();

                if (typeof SmartButton === "undefined") console.warn("Dialog: its buttons need comp/smart-button.js (SmartButton).");
                else getButtonOrder(buttonList).forEach(createButton);

            endGroup();

        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    box.setTitleText(box.titleText);
    box.setMessageText(box.messageText);
    box.setStatus("");
    box.footer.visible = buttonList.length ? 1 : 0;

    // A click on the cover (not on the card)
    box.layoutGroup.clickable = 1;
    // WHY mousedown too: a text selection that starts in a field and ends on the cover gives a click on the cover
    box.layoutGroup.on("mousedown", function (self, event) {
        isCoverPressed = (event.target === box.layoutGroup.elem) ? 1 : 0;
    });
    box.layoutGroup.on("click", function (self, event) {
        if (event.target !== box.layoutGroup.elem || !isCoverPressed) return;
        if (basic.isOn(box.closeOnCover) && !isBusy) box.close("cover");
    });

    // Enter in a field presses the primary button
    box.card.on("keydown", function (self, event) {
        if (event.key != "Enter" || !/INPUT/.test(event.target.tagName)) return;
        // WHY: a held Enter must not pass the ask; an IME Enter or one a component of content() used is not for us
        if (event.repeat || event.isComposing || event.defaultPrevented) return;
        const primary = box.buttonList.find(function (item) { return item.data.type == "primary"; });
        if (!primary) return;
        event.preventDefault();
        primary.button.press(); // WHY the press of the button: its ask and its enabled state count too
    });

    // WHY on document: after a click on the cover the focus is on body, the box gets no keys
    box.listenTo(document, "keydown", onKeyDown);
    box.onPageResize(layout);
    box.visible = 0;

    endObject(box);
    setDefaultContainerBox(previousContainer);

    if (basic.isOn(box.autoOpen)) box.open();

    return box;

};

// *** STATIC VARIABLES AND FUNCTIONS:

Dialog.stack = []; // The open dialogs (the last one is on top)
Dialog.counter = 1;
Dialog.zCounter = 1; // only grows

Dialog.getTop = function () {
    return Dialog.stack[Dialog.stack.length - 1] || null;
};

Dialog.closeAll = function () {
    Dialog.stack.slice().reverse().forEach(function (dialog) { dialog.close("api"); });
};

// WHY: one listener for every dialog: Escape closes only the top one, wherever the focus is
// WHY the bubble phase: a menu inside the dialog (a select, a context menu) closes first with its own Escape
document.addEventListener("keydown", function (event) {
    if (event.key != "Escape" || event.defaultPrevented) return;
    const top = Dialog.getTop();
    if (!top) return;
    // WHY: the focus in an object made on page over the dialog (Ex: the list of a FullScreenSelect): its Escape
    const target = event.target;
    const isFocusFree = (target === document.body || target === document.documentElement);
    if (!isFocusFree && !top.elem.contains(target)) return;
    // WHY: a modal keeps its Escape even when it does not close (closeOnEscape 0, busy): a SidePanel under it closed
    if (!basic.isOn(top.closeOnEscape) || top.isBusy()) {
        event.preventDefault();
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    top.close("escape");
});

// The buttons of an action (not Cancel): placed first in the centered variant
Dialog.MAIN_TYPES = ["primary", "danger", "warning", "success", "info"];

// The style of a dialog with its sizes multiplied (scale 1: the same style).
// WHY not buttons and ask: they are styles of SmartButton, multiplied with its package when a button is made
Dialog.scaleStyle = function (style, scale) {
    if (scale === 1) return style;
    const scaled = basic.scaleStyle(style, scale);
    scaled.buttons = style.buttons;
    if (style.ask) scaled.ask = style.ask;
    scaled.card.boxShadow = basic.scaleCssText(style.card.boxShadow, scale);
    return scaled;
};

// Returns a Promise<boolean>. onConfirm (optional) may return false (it stays) or a Promise (the button waits).
Dialog.confirm = function (params = {}) {
    return new Promise(function (resolve) {
        let result = false;
        Dialog({
            titleText: params.titleText || "Are you sure?",
            messageText: params.messageText || "",
            styleName: params.styleName,
            style: params.style || {},
            variant: params.variant || "",
            topIconFile: params.topIconFile || "",
            topIconTone: params.topIconTone || "",
            scale: params.scale,
            buttons: [
                { key: "cancel", text: params.cancelText || "Cancel", type: "secondary" },
                {
                    key: "confirm",
                    text: params.confirmText || "Confirm",
                    type: params.danger ? "danger" : (params.confirmType || "primary"),
                    iconFile: params.iconFile || "",
                    ask: params.ask || "",
                    onClick: function (dialog) {
                        if (typeof params.onConfirm !== "function") {
                            result = true;
                            return;
                        }
                        // WHY true after the call: an onConfirm that throws leaves the dialog open, Cancel gives false
                        const value = params.onConfirm(dialog);
                        result = (value !== false);
                        if (value && typeof value.then === "function") {
                            // WHY: a Promise of false keeps the dialog open; a later Cancel must give false
                            return value.then(function (done) {
                                if (done === false) result = false;
                                return done;
                            }, function (error) { result = false; throw error; });
                        }
                        return value;
                    },
                },
            ],
            onClose: function () { resolve(result); },
        });
    });
};
// USAGE: if (await Dialog.confirm({ titleText: "Delete?", messageText: "It can not be undone.", confirmText: "Delete", danger: 1 })) { }
// ask: "Click again to delete." (two clicks on the confirm button), style: the style of the Dialog (Ex: the color of
// its button: { buttons: { danger: { style: { box: { color: "#F8E57A" } } } } })
// confirmType: "warning" | "success" | "info" (the confirm button in the color of a situation; danger: 1 = "danger")

// Returns a Promise (it ends when the dialog closes).
// USAGE: await Dialog.alert({ titleText: "Done", messageText: "All the files are uploaded.", buttonType: "success" })
Dialog.alert = function (params = {}) {
    return new Promise(function (resolve) {
        Dialog({
            titleText: params.titleText || "",
            messageText: params.messageText || "",
            styleName: params.styleName,
            style: params.style || {},
            variant: params.variant || "",
            topIconFile: params.topIconFile || "",
            topIconTone: params.topIconTone || "",
            scale: params.scale,
            buttons: [{ key: "ok", text: params.buttonText || "OK", type: params.buttonType || "primary" }],
            onClose: function () { resolve(); },
        });
    });
};

// Returns a Promise<string | null> (null: canceled). validate(text) returns an error text ("" when it is valid).
Dialog.prompt = function (params = {}) {
    return new Promise(function (resolve) {
        let result = null;
        Dialog({
            titleText: params.titleText || "",
            messageText: params.messageText || "",
            styleName: params.styleName,
            style: params.style || {},
            variant: params.variant || "",
            topIconFile: params.topIconFile || "",
            topIconTone: params.topIconTone || "",
            scale: params.scale,
            fields: [{ key: "value", titleText: params.fieldText || "", placeholder: params.placeholder || "", value: params.value || "", required: params.required ? 1 : 0, validate: params.validate }],
            buttons: [
                { key: "cancel", text: params.cancelText || "Cancel", type: "secondary" },
                { key: "ok", text: params.confirmText || "OK", type: "primary", onClick: function (dialog) { result = dialog.getValues().value; } },
            ],
            onClose: function () { resolve(result); },
        });
    });
};
// USAGE: const name = await Dialog.prompt({ titleText: "Rename", value: "a.pdf", validate: (t) => (t.trim()) ? "" : "A name is needed." })

// The tones of an icon at the top (topIconTone): the circle behind it, the LIGHT shape and the STRONG details, made
// from the tones of SmartButton (the icons of 02-comp-examples/dialog-centered.htm).
// WHY STRONG this deep: the details read on the light shape (2.6:1) and on the circle (3.6:1), a white mark on it (3.9:1)
Dialog.ICON_TONES = {
    cyan: { circle: "#EAF6F7", light: "#A5D9DD", strong: "#36898F" },
    orange: { circle: "#FBEFEA", light: "#EDBAA5", strong: "#C4532A" },
    yellow: { circle: "#FDF8E7", light: "#F5D77D", strong: "#9A7409" },
    green: { circle: "#EEF7EB", light: "#B6DEA9", strong: "#4A8F33" },
    blue: { circle: "#E9F4F9", light: "#A0CFE5", strong: "#2E81A8" },
};
// USAGE: Dialog({ variant: "centered", topIconTone: "green", topIconFile: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="STRONG"/>...</svg>' })

// *** STYLE PACKAGES:
// USAGE: Dialog({ style: { card: { round: 12 } } }) // Change only some keys. (The width of the card is the param width.)
// NOTE: more packages come; a new one needs only the keys that differ from ozden.
Dialog.styles = {
    ozden: DialogDefaults.style,

    // For a dark page: the black tones of the kit; the fields and the buttons take their dark looks.
    ozdenDark: {
        cover: { color: Black(0.65) },
        card: {
            color: "#232322",
            border: 1,
            borderColor: White(0.16),
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.45)",
        },
        title: { textColor: White(0.92) },
        message: { textColor: White(0.62) },
        // WHY these colors: the errorColor and successColor of ozden are deepened for white; on this card they are too dark.
        status: { errorColor: "#FF9F93", infoColor: White(0.6), successColor: "#7FE3B5" },
        footer: { color: "#1C1C1B", lineColor: White(0.1) },
        fieldStyleName: "ozdenDark",
        centered: {
            iconArea: { color: "#232322" },
            iconCircle: { color: "#32322F" },
            icon: { color: White(0.88), lightColor: White(0.35) },
        },
        buttons: {
            primary: { styleName: "ozdenDark", tone: "cyanDark", style: {} },
            secondary: { styleName: "ozden3Dark", tone: "", style: {} },
            danger: { styleName: "ozdenDark", tone: "orangeDark", style: {} },
            warning: { styleName: "ozdenDark", tone: "yellowDark", style: {} },
            success: { styleName: "ozdenDark", tone: "greenDark", style: {} },
            info: { styleName: "ozdenDark", tone: "blueDark", style: {} },
            icon: {
                styleName: "ozden3Dark",
                tone: "",
                style: {
                    icon: { opacity: 1 },
                },
            },
        },
    },
};

// The minimal theme (_designs/minimal-theme.htm): a card on the ground of the window with a line and no shadow, a
// 14 px title, a 13 px message, the buttons at the right with no band under them: the minimal SmartButtons (the main
// one "ink", a delete "minimalDanger"), the minimal fields. minimalDark: the same on a dark window.
Dialog.createMinimalStyle = function (colors) {
    const button = function (tone) {
        return { styleName: colors.buttonName, tone: tone, style: {} };
    };
    return {
        cover: { color: colors.cover },
        card: { color: colors.ground, round: 6, border: 1, borderColor: colors.lineHover, boxShadow: "none", padding: [16, 16], gap: 6, margin: 16 },
        title: { fontSize: 14, textColor: colors.text, fontFamily: "opensans-bold" },
        message: { fontSize: 13, textColor: colors.softText, lineHeight: 1.45 },
        status: { fontSize: 12, errorColor: colors.danger, infoColor: colors.softText, successColor: colors.success },
        footer: { color: "transparent", lineColor: "transparent", padding: [16, 14], gap: 8, buttonHeight: 28, iconButtonWidth: 28 },
        fieldStyleName: colors.fieldName,
        centered: {
            iconArea: { height: 76, color: colors.ground, round: 4 },
            iconCircle: { size: 56, color: colors.iconCircle },
            icon: { size: 28, color: colors.text, lightColor: colors.faintText },
            buttonHeight: 28,
            buttonGap: 8,
            footerPadding: [16, 14],
        },
        buttons: {
            primary: button(colors.inkTone),
            secondary: button(""),
            danger: { styleName: colors.dangerName, tone: "", style: {} },
            warning: button(""),
            success: button(""),
            info: button(""),
            icon: { styleName: colors.buttonName, tone: "", style: { icon: { opacity: 1 } } },
        },
    };
};
Dialog.MINIMAL_COLORS = {
    cover: Black(0.3), ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), lineHover: Black(0.45),
    danger: "#C24A36", success: "#2E9E74", iconCircle: Black(0.05),
    buttonName: "minimal", dangerName: "minimalDanger", inkTone: "ink", fieldName: "minimal",
};
Dialog.styles.minimal = Dialog.createMinimalStyle(Dialog.MINIMAL_COLORS);
Dialog.MINIMAL_DARK_COLORS = {
    cover: Black(0.6), ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), lineHover: White(0.42),
    danger: "#FF9F93", success: "#7FE3B5", iconCircle: White(0.06),
    buttonName: "minimalDark", dangerName: "minimalDangerDark", inkTone: "inkDark", fieldName: "minimalDark",
};
Dialog.styles.minimalDark = Dialog.createMinimalStyle(Dialog.MINIMAL_DARK_COLORS);
