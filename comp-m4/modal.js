/* Bismillah */

/*

Modal - v26.09

UI COMPONENT TEMPLATE
- A dialog window over the page: title, description, any content (forms, lists...) and buttons.
- Sizes: "small" (400), "medium" (560), "large" (820), "full" or a number. Small screens: full width.
- Buttons: "primary", "secondary", "danger". onClick can return false (stay open) or a Promise:
  the buttons are busy (spinner) until it ends. A rejected promise keeps the modal open.
- Closes with the close button, a click outside, Escape or a button. (Each can be turned off.)
- Keyboard: The focus stays in the modal (Tab / Shift+Tab). The focus goes back to the opener on close.
- More than one modal: A modal can open another one. Escape closes the top one.
- Themes: "light", "dark", "auto" (follows the system setting).
- Helpers that return a Promise: Modal.confirm(), Modal.alert(), Modal.prompt().
- Accessibility: role="dialog", aria-modal, aria-labelledby, aria-describedby.

USAGE:
Modal({
    title: "Edit profile",
    size: "medium",
    content: function (modal) {
        modal.nameInput = Input({ width: "100%", height: 40 }); // Objects are created in the modal body.
    },
    buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "Save", type: "primary", onClick: function (modal) { return saveProfile(modal.nameInput.text); } }, // Promise: busy
    ],
});

if (await Modal.confirm({ title: "Delete file?", message: "report.pdf will be deleted.", confirmText: "Delete", danger: 1 })) { ... }
const name = await Modal.prompt({ title: "Rename", value: "report.pdf", validate: (text) => (text.trim()) ? "" : "Name is required" });
await Modal.alert({ title: "Done", message: "All files are uploaded." });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ModalDefaults = {
    key: "0",
    title: "",
    description: "",
    allowHtml: 0, // 0: title and description are shown as text.
    size: "medium", // "small", "medium", "large", "full" or a number (px)
    content: null, // function (modal) {} Objects created here are put in modal.body.
    buttons: [], // [{ text, type: "primary" | "secondary" | "danger", key, onClick: function (modal, button) {} }]
    showCloseButton: 1,
    closeOnOverlay: 1, // Click outside the panel
    closeOnEscape: 1,
    autoOpen: 1,
    destroyOnClose: 1, // 0: close() only hides it. open() shows it again.
    theme: null, // null: Modal.options.theme
    ariaLabel: "", // Used when there is no title
    onOpen: function (modal) { },
    onClose: function (modal, reason) { }, // reason: "close", "overlay", "escape", "button", "api"
    style: {
        panel: {
            round: 14,
            padding: 24,
        },
        title: {
            fontSize: 19,
        },
        description: {
            fontSize: 14,
        },
        button: {
            fontSize: 14,
            height: 40,
            round: 8,
            padding: 18, // Left and right
        },
    }
};

const Modal = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ModalDefaults);

    // WHY: startObject() copies params. Functions and the button list are kept as they are.
    const contentFunc = params.content;
    const buttonList = (params.buttons || []).map(function (button, index) {
        return Object.assign({ type: "secondary", key: "button" + index }, button);
    });
    delete params.content;
    delete params.buttons;

    const options = Modal.options;
    const id = "modal-" + (Modal._counter++);

    // Edit params, if needed:
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = "100%";
    params.color = "transparent";

    // WHY: A modal must be over everything. It is created on the page, even if Modal() is called inside a group.
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: Component container (full screen overlay)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let isOpen = 0;
    let isBusy = 0;
    let openerElement = null; // Focus goes back here on close.
    let buttonObjects = []; // [{ data, label }]

    // *** PUBLIC VARIABLES:
    // [var] Buttons: [{ text, type, key, onClick }]
    box.buttons = buttonList;

    // *** PRIVATE FUNCTIONS:

    const getTheme = function () {
        let theme = box.theme || options.theme;
        if (theme == "auto") {
            theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
        }
        return Modal.THEMES[theme] || Modal.THEMES.light;
    };

    const text = function (value) {
        return (box.allowHtml == 1) ? String(value) : Modal.escapeHtml(value);
    };

    const getPanelWidth = function () {
        if (typeof box.size === "number") return box.size;
        return Modal.SIZES[box.size] || Modal.SIZES.medium;
    };

    // Size of the panel for the page width.
    const layout = function () {
        if (!box) return;
        const margin = (page.width < 520) ? 12 : options.margin;
        box.layoutGroup.elem.style.padding = margin + "px";
        if (box.size == "full") {
            box.panel.elem.style.width = "100%";
            box.panel.elem.style.height = "100%";
        } else {
            box.panel.elem.style.width = getPanelWidth() + "px";
            box.panel.elem.style.height = "auto";
        }
    };

    const applyTheme = function () {

        const t = getTheme();

        box.color = t.overlay;
        box.panel.color = t.background;
        box.panel.borderColor = t.border;
        box.panel.elem.style.boxShadow = t.shadow;
        box.lblTitle.textColor = t.title;
        box.lblDescription.textColor = t.description;
        box.btnClose.text = Modal.getCloseSvg(t.description);
        box.footer.elem.style.borderTop = "1px solid " + t.divider;

        buttonObjects.forEach(function (item) { styleButton(item); });

    };

    const styleButton = function (item) {
        const t = getTheme();
        const colors = t.buttons[item.data.type] || t.buttons.secondary;
        item.label.color = colors.background;
        item.label.textColor = colors.text;
        item.label.borderColor = colors.border;
    };

    // All objects that can take the keyboard focus in the panel
    const getFocusableElements = function () {
        const selector = "input, textarea, select, button, a[href], [tabindex]:not([tabindex='-1'])";
        return Array.from(box.panel.elem.querySelectorAll(selector)).filter(function (elem) {
            return !elem.disabled && !elem.closest("[inert]") && elem.offsetParent !== null;
        });
    };

    const focusFirst = function () {
        // The first input in the body, then the primary button, then the panel.
        const inBody = getFocusableElements().find(function (elem) { return box.body.elem.contains(elem) && /INPUT|TEXTAREA|SELECT/.test(elem.tagName); });
        const primary = buttonObjects.find(function (item) { return item.data.type != "secondary"; });
        const target = inBody || (primary && primary.label.elem) || box.panel.elem;
        target.focus({ preventScroll: true });
    };

    const createButton = function (data) {

        const label = Label({
            text: Modal.escapeHtml(data.text),
            height: _s.button.height,
            fontSize: _s.button.fontSize,
            round: _s.button.round,
            border: 1,
            clickable: 1,
        });
        label.elem.style.padding = "0px " + _s.button.padding + "px";
        label.elem.style.lineHeight = (_s.button.height - 2) + "px";
        label.elem.style.whiteSpace = "nowrap";
        label.elem.style.cursor = "pointer";
        label.elem.style.fontFamily = (data.type == "secondary") ? "opensans" : "opensans-bold";
        label.elem.style.display = "flex";
        label.elem.style.alignItems = "center";
        label.elem.style.gap = "8px";
        label.elem.style.transition = "filter 0.15s, transform 0.1s, opacity 0.15s";
        label.elem.tabIndex = 0;
        label.elem.setAttribute("role", "button");

        const item = { data: data, label: label };

        label.on("mouseover", function () { label.elem.style.filter = "brightness(1.08)"; });
        label.on("mouseout", function () { label.elem.style.filter = "none"; });
        label.on("mousedown", function () { label.elem.style.transform = "scale(0.97)"; });
        label.on("mouseup", function () { label.elem.style.transform = "scale(1)"; });
        label.on("click", function () { pressButton(item); });
        label.on("keydown", function (self, event) {
            if (event.key == "Enter" || event.key == " ") {
                event.preventDefault();
                pressButton(item);
            }
        });

        buttonObjects.push(item);
        return item;

    };

    const pressButton = function (item) {

        if (!box || isBusy) return;

        const result = (typeof item.data.onClick === "function") ? item.data.onClick(box, item.data) : undefined;

        // Promise: busy until it ends
        if (result && typeof result.then === "function") {
            box.setBusy(1, item.data.key);
            result.then(function (value) {
                if (!box) return;
                box.setBusy(0);
                if (value !== false) box.close("button", item.data.key);
            }, function (error) {
                if (!box) return;
                box.setBusy(0);
                console.error(error); // WHY: The caller shows the error (Ex: with a Toast). The modal stays open.
            });
            return;
        }

        if (result !== false) box.close("button", item.data.key);

    };

    const onKeyDown = function (self, event) {

        if (!box || !isOpen || Modal.getTop() !== box) return;

        if (event.key == "Tab") {
            // Keep the focus in the modal.
            const list = getFocusableElements();
            if (list.length == 0) {
                event.preventDefault();
                box.panel.elem.focus();
                return;
            }
            const first = list[0];
            const last = list[list.length - 1];
            if (event.shiftKey && (document.activeElement === first || !box.panel.elem.contains(document.activeElement))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !box.panel.elem.contains(document.activeElement))) {
                event.preventDefault();
                first.focus();
            }
        }

    };

    // *** PUBLIC FUNCTIONS:

    box.open = function () {

        if (!box || isOpen) return box;
        isOpen = 1;

        openerElement = document.activeElement;
        Modal.stack.push(box);
        box.elem.style.zIndex = String(options.zIndex + Modal.stack.length * 2);

        applyTheme();
        layout();
        box.visible = 1;

        // Enter animation
        const panel = box.panel.elem.style;
        box.elem.style.transition = "none";
        box.elem.style.opacity = "0";
        panel.transition = "none";
        panel.transform = "translateY(12px) scale(0.97)";
        void box.elem.offsetWidth;
        box.elem.style.transition = "opacity 0.18s";
        box.elem.style.opacity = "1";
        panel.transition = "transform 0.2s";
        panel.transform = "translateY(0px) scale(1)";

        focusFirst();
        box.onOpen(box);
        return box;

    };

    // reason: "close", "overlay", "escape", "button", "api". buttonKey: the pressed button
    box.close = function (reason = "api", buttonKey = "") {

        if (!box || !isOpen) return;
        isOpen = 0;

        Modal.stack = Modal.stack.filter(function (modal) { return modal !== box; });

        const self = box;
        self.elem.style.transition = "opacity 0.15s";
        self.elem.style.opacity = "0";
        self.panel.elem.style.transform = "translateY(8px) scale(0.98)";

        // WHY: The focus goes back to the object that opened the modal (keyboard users do not lose their place).
        if (openerElement && openerElement.isConnected && typeof openerElement.focus === "function") {
            openerElement.focus({ preventScroll: true });
        }

        setTimeout(function () {
            if (box !== self || isOpen) return; // Opened again
            self.visible = 0;
            self.onClose(self, reason, buttonKey);
            if (self.destroyOnClose == 1) self.destroy();
        }, 160);

    };

    box.isOpen = function () {
        return isOpen;
    };

    // Busy: buttons are disabled. The button with buttonKey shows a spinner.
    box.setBusy = function (busy, buttonKey = "") {
        if (!box) return;
        isBusy = (busy) ? 1 : 0;
        buttonObjects.forEach(function (item) {
            const isTarget = isBusy && item.data.key == buttonKey;
            item.label.elem.inert = !!isBusy;
            item.label.opacity = (isBusy && !isTarget) ? 0.5 : 1;
            item.label.text = ((isTarget) ? Modal.getSpinnerSvg(item.label.textColor) : "") + Modal.escapeHtml(item.data.text);
        });
        box.btnClose.elem.inert = !!isBusy;
        box.panel.elem.setAttribute("aria-busy", (isBusy) ? "true" : "false");
    };
    // USAGE: modal.setBusy(1, "save") ... modal.setBusy(0)

    box.isBusy = function () {
        return isBusy;
    };

    box.setTitle = function (title) {
        box.title = title;
        box.lblTitle.text = text(title);
        box.lblTitle.visible = (title) ? 1 : 0;
    };

    box.setDescription = function (description) {
        box.description = description;
        box.lblDescription.text = text(description);
        box.lblDescription.visible = (description) ? 1 : 0;
    };

    box.setButtonText = function (buttonKey, buttonText) {
        const item = buttonObjects.find(function (b) { return b.data.key == buttonKey; });
        if (!item) return;
        item.data.text = buttonText;
        item.label.text = Modal.escapeHtml(buttonText);
    };

    // Creates the body content again. (One group is started and ended in the body.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. With one top-level group, all objects stay in the body.
    box.setContent = function (func) {
        // Remove the old content (created by "content" or by an older setContent)
        Array.from(box.body.elem.children).forEach(function (elem) { elem.remove(); });
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(box.body);
            box.body.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 14, position: "relative" });
            box.body.wrapper.elem.style.alignItems = "stretch";
                func(box);
            endGroup();
        setDefaultContainerBox(previous);
    };

    box.setTheme = function (theme) {
        box.theme = theme;
        applyTheme();
    };

    box.destroy = function () {
        if (!box) return;
        Modal.stack = Modal.stack.filter(function (modal) { return modal !== box; });
        page.remove_onResize(layout);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.style.position = "fixed";
    box.elem.style.display = "block"; // WHY: "visible" keeps the display type when it hides. Without it, visible: 1 does not show the box again.
    box.clickable = 1;

    // GROUP: Center the panel
    box.layoutGroup = HGroup({
        width: "100%",
        height: "100%",
        align: "center center",
    });
    box.layoutGroup.elem.style.boxSizing = "border-box";

        // GROUP: Panel
        box.panel = VGroup({
            width: getPanelWidth(),
            height: "auto",
            align: "left top",
            gap: 0,
            round: _s.panel.round,
            border: 1,
            clickable: 1,
        });
        box.panel.elem.style.alignItems = "stretch";
        box.panel.elem.style.maxWidth = "100%";
        box.panel.elem.style.maxHeight = "100%";
        box.panel.elem.style.outline = "none";
        box.panel.elem.style.boxSizing = "border-box";
        box.panel.elem.tabIndex = -1;
        box.panel.elem.setAttribute("role", "dialog");
        box.panel.elem.setAttribute("aria-modal", "true");

            // GROUP: Header
            box.header = HGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: [_s.panel.padding, _s.panel.padding, _s.panel.padding, 6] });
            box.header.elem.style.flexShrink = "0";

                VGroup({ width: "auto", height: "auto", align: "left top", gap: 4 });
                that.elem.style.flex = "1 1 auto";
                that.elem.style.minWidth = "0";

                    box.lblTitle = Label({ text: "", width: "100%", fontSize: _s.title.fontSize });
                    box.lblTitle.elem.id = id + "-title";
                    box.lblTitle.elem.style.fontFamily = "opensans-bold";
                    box.lblTitle.elem.style.overflowWrap = "anywhere";

                    box.lblDescription = Label({ text: "", width: "100%", fontSize: _s.description.fontSize });
                    box.lblDescription.elem.id = id + "-description";
                    box.lblDescription.elem.style.lineHeight = "1.5";
                    box.lblDescription.elem.style.overflowWrap = "anywhere";

                endGroup();

                // LABEL: Close button (SVG)
                box.btnClose = Label({ text: "", width: 32, height: 32, round: 8, clickable: 1 });
                box.btnClose.elem.style.flexShrink = "0";
                box.btnClose.elem.style.display = "flex";
                box.btnClose.elem.style.alignItems = "center";
                box.btnClose.elem.style.justifyContent = "center";
                box.btnClose.elem.style.cursor = "pointer";
                box.btnClose.elem.style.margin = "-4px -8px 0 0";
                box.btnClose.elem.tabIndex = 0;
                box.btnClose.elem.setAttribute("role", "button");
                box.btnClose.elem.setAttribute("aria-label", "Close");

            endGroup();

            // GROUP: Body (scrolls when the content is long)
            box.scrollArea = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, padding: [_s.panel.padding, 10, _s.panel.padding, _s.panel.padding] });
            box.scrollArea.elem.style.alignItems = "stretch";
            box.scrollArea.elem.style.flex = "1 1 auto";
            box.scrollArea.elem.style.minHeight = "0";
            box.scrollArea.elem.style.overflowY = "auto";
            box.scrollArea.elem.style.overscrollBehavior = "contain";

                // WHY: In a flex column, items get smaller to fit. The content group does not shrink, so the area scrolls.
                box.body = VGroup({ width: "100%", height: "auto", align: "left top", gap: 14 });
                box.body.elem.style.alignItems = "stretch";
                box.body.elem.style.flexShrink = "0";

                    if (typeof contentFunc === "function") contentFunc(box);

                endGroup();

            endGroup();

            // GROUP: Footer (buttons)
            box.footer = HGroup({ width: "100%", height: "auto", align: "right center", gap: 8, padding: [_s.panel.padding, 16] });
            box.footer.elem.style.flexShrink = "0";
            box.footer.elem.style.flexWrap = "wrap";

                buttonList.forEach(createButton);

            endGroup();

        endGroup();

    endGroup();

    // *** OBJECT INIT CODE:

    box.setTitle(box.title);
    box.setDescription(box.description);
    box.footer.visible = (buttonList.length) ? 1 : 0;
    box.btnClose.visible = (box.showCloseButton == 1) ? 1 : 0;

    if (box.title) box.panel.elem.setAttribute("aria-labelledby", box.lblTitle.elem.id);
    else if (box.ariaLabel) box.panel.elem.setAttribute("aria-label", box.ariaLabel);
    if (box.description) box.panel.elem.setAttribute("aria-describedby", box.lblDescription.elem.id);

    box.btnClose.on("click", function () { box.close("close"); });
    box.btnClose.on("keydown", function (self, event) {
        if (event.key == "Enter" || event.key == " ") {
            event.preventDefault();
            box.close("close");
        }
    });
    box.btnClose.on("mouseover", function () { box.btnClose.color = getTheme().closeHover; });
    box.btnClose.on("mouseout", function () { box.btnClose.color = "transparent"; });

    // Click outside the panel
    box.layoutGroup.on("click", function (self, event) {
        if (event.target === box.layoutGroup.elem && box.closeOnOverlay == 1 && !isBusy) box.close("overlay");
    });
    box.layoutGroup.clickable = 1;

    box.on("keydown", onKeyDown);
    page.onResize(layout);

    box.visible = 0;

    endObject(box);
    setDefaultContainerBox(previousContainer);

    if (box.autoOpen == 1) box.open();

    return box;

};

// *** STATIC VARIABLES:

Modal.options = {
    theme: "auto", // "light", "dark", "auto"
    zIndex: 4000,
    margin: 24, // Space to the screen edges
};

Modal.SIZES = { small: 400, medium: 560, large: 820 };

Modal.THEMES = {
    light: {
        overlay: "rgba(15, 15, 14, 0.45)",
        background: "#FFFFFF",
        border: "rgba(11, 11, 11, 0.08)",
        shadow: "0 20px 60px rgba(0, 0, 0, 0.25)",
        title: "#1B1B1A",
        description: "#6B6A65",
        text: "#2B2B29",
        divider: "rgba(11, 11, 11, 0.08)",
        closeHover: "rgba(11, 11, 11, 0.06)",
        input: { background: "#FFFFFF", border: "rgba(11, 11, 11, 0.2)", focus: "#3D7A6B", text: "#1B1B1A" },
        error: "#D93F3E",
        buttons: {
            primary: { background: "#3D7A6B", text: "#FFFFFF", border: "#3D7A6B" },
            secondary: { background: "#FFFFFF", text: "#2B2B29", border: "rgba(11, 11, 11, 0.18)" },
            danger: { background: "#D93F3E", text: "#FFFFFF", border: "#D93F3E" },
        },
    },
    dark: {
        overlay: "rgba(0, 0, 0, 0.6)",
        background: "#1F1F1E",
        border: "rgba(255, 255, 255, 0.10)",
        shadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
        title: "rgba(255, 255, 255, 0.95)",
        description: "rgba(255, 255, 255, 0.60)",
        text: "rgba(255, 255, 255, 0.85)",
        divider: "rgba(255, 255, 255, 0.08)",
        closeHover: "rgba(255, 255, 255, 0.08)",
        input: { background: "#232322", border: "rgba(255, 255, 255, 0.15)", focus: "#65A293", text: "rgba(255, 255, 255, 0.9)" },
        error: "#EF6B6A",
        buttons: {
            primary: { background: "#3D7A6B", text: "#FFFFFF", border: "#3D7A6B" },
            secondary: { background: "#2A2A29", text: "rgba(255, 255, 255, 0.9)", border: "rgba(255, 255, 255, 0.12)" },
            danger: { background: "#C84544", text: "#FFFFFF", border: "#C84544" },
        },
    },
};

// [modal] Open modals (the last one is on top)
Modal.stack = [];
Modal._counter = 1;

// *** STATIC FUNCTIONS:

Modal.getTop = function () {
    return Modal.stack[Modal.stack.length - 1] || null;
};

Modal.closeAll = function () {
    Modal.stack.slice().reverse().forEach(function (modal) { modal.close("api"); });
};

// Current theme colors (for content created by the helpers)
Modal.getThemeColors = function (theme) {
    let name = theme || Modal.options.theme;
    if (name == "auto") name = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    return Modal.THEMES[name] || Modal.THEMES.light;
};

// WHY: One listener for all modals. Escape closes only the top modal, wherever the focus is.
document.addEventListener("keydown", function (event) {
    if (event.key != "Escape") return;
    const top = Modal.getTop();
    if (top && top.closeOnEscape == 1 && !top.isBusy()) {
        event.preventDefault();
        event.stopPropagation();
        top.close("escape");
    }
}, true);

// LABEL: Message text for the helpers
Modal.createMessage = function (message, params) {
    if (!message) return null;
    const colors = Modal.getThemeColors(params.theme);
    const label = Label({
        text: (params.allowHtml == 1) ? String(message) : Modal.escapeHtml(message).replace(/\n/g, "<br>"),
        width: "100%",
        fontSize: 15,
        textColor: colors.text,
    });
    label.elem.style.lineHeight = "1.55";
    label.elem.style.overflowWrap = "anywhere";
    return label;
};

// Returns a Promise<boolean>. onConfirm (optional) can return a Promise: the button is busy until it ends.
Modal.confirm = function (params = {}) {
    return new Promise(function (resolve) {
        let result = false;
        Modal({
            size: params.size || "small",
            title: params.title || "Are you sure?",
            description: params.description || "",
            theme: params.theme,
            closeOnOverlay: (params.closeOnOverlay === undefined) ? 1 : params.closeOnOverlay,
            content: function () { Modal.createMessage(params.message, params); },
            buttons: [
                { text: params.cancelText || "Cancel", type: "secondary", key: "cancel" },
                {
                    text: params.confirmText || "Confirm",
                    type: (params.danger) ? "danger" : "primary",
                    key: "confirm",
                    onClick: function (modal) {
                        result = true;
                        if (typeof params.onConfirm === "function") {
                            const value = params.onConfirm(modal);
                            if (value && typeof value.then === "function") {
                                return value.catch(function (error) { result = false; throw error; });
                            }
                            if (value === false) { result = false; return false; }
                        }
                    },
                },
            ],
            onClose: function () { resolve(result); },
        });
    });
};
// USAGE: if (await Modal.confirm({ title: "Delete?", message: "It can not be undone.", confirmText: "Delete", danger: 1 })) { ... }

// Returns a Promise (resolved on close).
Modal.alert = function (params = {}) {
    return new Promise(function (resolve) {
        Modal({
            size: params.size || "small",
            title: params.title || "",
            theme: params.theme,
            content: function () { Modal.createMessage(params.message, params); },
            buttons: [{ text: params.buttonText || "OK", type: "primary", key: "ok" }],
            onClose: function () { resolve(); },
        });
    });
};

// Returns a Promise<string | null>. validate(text) returns an error text ("" when valid).
Modal.prompt = function (params = {}) {
    return new Promise(function (resolve) {

        let result = null;
        let input, lblError;
        const colors = Modal.getThemeColors(params.theme);

        const submit = function (modal) {
            const value = input.text;
            const error = (typeof params.validate === "function") ? (params.validate(value) || "") : "";
            lblError.text = Modal.escapeHtml(error);
            lblError.visible = (error) ? 1 : 0;
            input.elem.style.borderColor = (error) ? colors.error : colors.input.border;
            if (error) {
                input.inputElement.focus();
                return false;
            }
            result = value;
        };

        Modal({
            size: params.size || "small",
            title: params.title || "",
            description: params.description || "",
            theme: params.theme,
            content: function (modal) {

                Modal.createMessage(params.message, params);

                input = Input({ width: "100%", height: 42, minimal: 1, fontSize: 15, text: params.value || "", color: colors.input.background, textColor: colors.input.text });
                input.elem.style.border = "1px solid " + colors.input.border;
                input.elem.style.borderRadius = "8px";
                input.elem.style.boxSizing = "border-box";
                input.inputElement.style.padding = "0px 12px";
                input.inputElement.placeholder = params.placeholder || "";
                input.inputElement.setAttribute("aria-label", params.title || params.placeholder || "Value");
                input.inputElement.addEventListener("focus", function () { input.elem.style.borderColor = colors.input.focus; });
                input.inputElement.addEventListener("blur", function () { input.elem.style.borderColor = colors.input.border; });
                input.inputElement.addEventListener("keydown", function (event) {
                    if (event.key == "Enter") {
                        event.preventDefault();
                        if (submit(modal) !== false) modal.close("button", "ok");
                    }
                });
                if (params.maxLength) input.inputElement.maxLength = params.maxLength;

                lblError = Label({ text: "", width: "100%", fontSize: 13, textColor: colors.error, visible: 0 });
                lblError.elem.setAttribute("role", "alert");
                lblError.elem.style.marginTop = "-6px";

                // Select the text (easy to change)
                setTimeout(function () { input.inputElement.select(); }, 0);

            },
            buttons: [
                { text: params.cancelText || "Cancel", type: "secondary", key: "cancel" },
                { text: params.confirmText || "OK", type: "primary", key: "ok", onClick: submit },
            ],
            onClose: function () { resolve(result); },
        });

    });
};
// USAGE: const name = await Modal.prompt({ title: "Rename", value: "a.pdf", validate: (t) => (t.trim()) ? "" : "Required" });

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Modal.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

Modal.getCloseSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

// WHY: SVG animation (SMIL): a turning icon without a CSS file.
Modal.getSpinnerSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round">' +
        '<circle cx="12" cy="12" r="9" opacity="0.3"/><path d="M21 12a9 9 0 0 0-9-9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path></svg>';
};
