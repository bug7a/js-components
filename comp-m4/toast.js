/* Bismillah */

/*

Toast - v26.09

UI COMPONENT TEMPLATE
- Short messages that come and go: "Saved", "Copied", "Could not connect"...
- Types: "success", "error", "warning", "info", "loading". Icons are drawn with SVG (no image files).
- Title, message, an action button (Ex: "Undo") and a close button.
- A time bar shows when it closes. The time stops while the mouse (or the keyboard focus)
  is on the toast, and while the browser tab is hidden.
- key: A toast with the same key is updated, not added again. (Ex: pressing "Copy" many times)
- Toast.promise(): "loading" toast that becomes "success" or "error".
- Positions: "top-right", "top-center", "top-left", "bottom-right", "bottom-center", "bottom-left".
- Themes: "light", "dark", "auto" (follows the system setting).
- maxVisible: Old toasts are closed when there are too many.
- Small screens: Toasts use the full width.
- Accessibility: Errors use role="alert", others role="status". Escape closes the focused toast.

USAGE:
Toast.success("Changes are saved.");
Toast.error("Could not save the file.", { title: "Upload failed", duration: 0 });
Toast.show({ type: "info", title: "Item deleted", message: "report.pdf", action: { text: "Undo", onClick: undoDelete } });
Toast.show({ key: "copy", type: "success", message: "Link is copied." }); // Same key: updates the visible toast
Toast.promise(saveData(), { loading: "Saving...", success: "Saved.", error: (err) => "Failed: " + err.message });
Toast.setOptions({ position: "bottom-right", theme: "dark" });

const toast = Toast.show({ type: "loading", message: "Uploading 0%" });
toast.update({ message: "Uploading 60%" });
toast.update({ type: "success", message: "Uploaded." }); // Starts its timer (loading has no timer)
toast.close();

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ToastDefaults = {
    key: "", // Same key: updates the visible toast.
    type: "info", // "success", "error", "warning", "info", "loading"
    title: "",
    message: "",
    allowHtml: 0, // 0: title and message are shown as text. 1: As HTML (use only your own texts).
    duration: null, // ms. null: Toast.options.durations[type]. 0: Stays until it is closed.
    closable: 1, // 1: Close button
    showProgress: 1, // 1: Time bar
    pauseOnHover: 1,
    action: null, // { text: "Undo", onClick: function (toast) {} } onClick returns false: the toast stays open.
    position: null, // null: Toast.options.position
    theme: null, // null: Toast.options.theme
    onClick: null, // function (toast) {} Click on the toast (not on the buttons)
    onClose: function (toast, reason) { }, // reason: "timeout", "close", "action", "limit", "api"
    style: {
        card: {
            round: 10,
            padding: [14, 12],
            gap: 12,
        },
        icon: {
            size: 20,
        },
        title: {
            fontSize: 14,
        },
        message: {
            fontSize: 13,
        },
        progress: {
            height: 3,
            opacity: 0.45,
        },
    }
};

const Toast = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ToastDefaults);

    const options = Toast.options;
    const position = Toast.POSITIONS.includes(params.position) ? params.position : options.position;

    // Same key: update the visible toast.
    if (params.key) {
        const old = Toast.list.find(function (toast) { return toast.key == params.key && !toast.isClosing; });
        if (old) {
            old.update(params);
            old.bump();
            return old;
        }
    }

    // WHY: Only the listed values are changed later with update(). Functions and objects are kept as they are.
    const action = params.action;
    const onClick = params.onClick;

    // Edit params, if needed:
    params.width = "100%";
    params.height = "auto";
    params.color = "transparent";
    params.position = "relative"; // WHY: "position" is a basic.js property too. The toast position is kept below.

    const container = Toast.getContainer(position);
    const isBottom = position.startsWith("bottom");

    // WHY: Toasts must be over everything. They are created in their container on the page.
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(container);

    // BOX: Component container (a slot in the stack; its height is animated on close)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let timer = null;
    let remaining = 0; // ms
    let startedAt = 0;
    let isHovered = 0;
    let isFocused = 0;

    // *** PUBLIC VARIABLES:
    // [var] "top-right", ...
    box.toastPosition = position;
    // [var]
    box.action = action;
    // [var]
    box.onClick = onClick;
    // [var] 1: Close animation started.
    box.isClosing = 0;

    // *** PRIVATE FUNCTIONS:

    const getTheme = function () {
        let theme = box.theme || options.theme;
        if (theme == "auto") {
            theme = (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
        }
        return Toast.THEMES[theme] || Toast.THEMES.light;
    };

    const getDuration = function () {
        if (box.duration !== null && box.duration !== undefined) return box.duration;
        return options.durations[box.type] ?? 4000;
    };

    const text = function (value) {
        return (box.allowHtml == 1) ? String(value) : Toast.escapeHtml(value);
    };

    // Writes the values to the view. (On create and update)
    const render = function () {

        const t = getTheme();
        const color = t.colors[box.type] || t.colors.info;

        box.card.color = t.background;
        box.card.borderColor = t.border;
        box.card.elem.style.boxShadow = t.shadow;
        box.card.elem.setAttribute("role", (box.type == "error") ? "alert" : "status");
        box.card.elem.setAttribute("aria-live", (box.type == "error") ? "assertive" : "polite");
        box.card.elem.style.cursor = (box.onClick) ? "pointer" : "default";

        box.icon.text = Toast.getIconSvg(box.type, color, _s.icon.size);

        box.lblTitle.visible = (box.title) ? 1 : 0;
        box.lblTitle.text = text(box.title);
        box.lblTitle.textColor = t.title;

        box.lblMessage.visible = (box.message) ? 1 : 0;
        box.lblMessage.text = text(box.message);
        box.lblMessage.textColor = (box.title) ? t.message : t.title; // WHY: Without a title, the message is the main text.

        const hasAction = !!(box.action && box.action.text);
        box.btnAction.visible = (hasAction) ? 1 : 0;
        if (hasAction) {
            box.btnAction.text = Toast.escapeHtml(box.action.text);
            box.btnAction.textColor = color;
            box.btnAction.color = Toast.alpha(color, 0.12);
        }

        box.btnClose.visible = (box.closable == 1) ? 1 : 0;
        box.btnClose.text = Toast.getCloseSvg(t.close);

        box.progress.color = color;

    };

    // Time bar: from full to empty in ms.
    const animateProgress = function (ms, fromFull) {
        const style = box.progress.elem.style;
        if (fromFull) {
            style.transition = "none";
            style.width = "100%";
            void box.progress.elem.offsetWidth; // Apply 100% before the transition starts.
        }
        style.transition = "width " + ms + "ms linear";
        style.width = "0%";
    };

    const freezeProgress = function () {
        const style = box.progress.elem.style;
        const width = window.getComputedStyle(box.progress.elem).width;
        style.transition = "none";
        style.width = width;
    };

    const startTimer = function () {

        clearTimeout(timer);
        const duration = getDuration();

        const showProgress = duration > 0 && box.showProgress == 1;
        box.progress.visible = (showProgress) ? 1 : 0;

        if (!(duration > 0)) {
            remaining = 0;
            return;
        }

        remaining = duration;
        if (isPaused()) {
            // Starts when the pause ends.
            box.progress.elem.style.transition = "none";
            box.progress.elem.style.width = "100%";
            return;
        }

        startedAt = Date.now();
        timer = setTimeout(function () { box.close("timeout"); }, remaining);
        if (showProgress) animateProgress(remaining, true);

    };

    const isPaused = function () {
        return (box.pauseOnHover == 1 && (isHovered || isFocused)) || document.hidden;
    };

    const pause = function () {
        if (!timer) return;
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        freezeProgress();
    };

    const resume = function () {
        if (timer || !(remaining > 0) || isPaused() || box.isClosing) return;
        startedAt = Date.now();
        timer = setTimeout(function () { box.close("timeout"); }, remaining);
        if (box.progress.visible) animateProgress(remaining, false);
    };

    const updatePause = function () {
        if (!box) return;
        if (isPaused()) pause();
        else resume();
    };

    const onVisibilityChange = function () {
        updatePause();
    };

    // *** PUBLIC FUNCTIONS:

    // Changes the toast and starts its timer again.
    box.update = function (values = {}) {
        if (!box || box.isClosing) return box;
        ["type", "title", "message", "allowHtml", "duration", "closable", "showProgress", "pauseOnHover", "theme", "onClick", "action"].forEach(function (key) {
            if (key in values) box[key] = values[key];
        });
        if (!("duration" in values)) box.duration = null; // WHY: A new type (loading -> success) uses its own duration.
        render();
        startTimer();
        return box;
    };
    // USAGE: toast.update({ type: "success", message: "Uploaded." })

    // A small move to show that the toast is updated.
    box.bump = function () {
        if (!box) return;
        const style = box.card.elem.style;
        style.transition = "transform 0.12s";
        style.transform = "scale(1.03)";
        setTimeout(function () { if (box) style.transform = "scale(1)"; }, 120);
    };

    box.close = function (reason = "api") {

        if (!box || box.isClosing) return;
        box.isClosing = 1;

        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        Toast.list = Toast.list.filter(function (toast) { return toast !== box; });

        const self = box;
        const card = self.card.elem.style;
        const moveX = (self.toastPosition.endsWith("left")) ? -16 : (self.toastPosition.endsWith("right")) ? 16 : 0;
        const moveY = (moveX) ? 0 : (isBottom ? 12 : -12);

        // 1. Fade and move out
        card.transition = "opacity 0.16s, transform 0.16s";
        card.opacity = "0";
        card.transform = "translate(" + moveX + "px, " + moveY + "px) scale(0.98)";

        setTimeout(function () {

            // 2. Close the space in the stack
            const slot = self.elem.style;
            slot.height = self.elem.offsetHeight + "px";
            void self.elem.offsetHeight;
            slot.transition = "height 0.16s, padding 0.16s";
            slot.height = "0px";
            slot.paddingTop = "0px";
            slot.paddingBottom = "0px";

            setTimeout(function () {
                self.onClose(self, reason);
                self.remove(); // NOTE: It will clean all events like box.on("click"
                if (box === self) box = null;
            }, 170);

        }, 150);

    };
    // reason: "timeout", "close", "action", "limit", "api"

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        Toast.list = Toast.list.filter(function (toast) { return toast !== box; });
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.style.overflow = "visible";
    box.elem.style.boxSizing = "border-box";
    box.elem.style[(isBottom) ? "paddingTop" : "paddingBottom"] = options.gap + "px";

    // GROUP: Card
    box.card = HGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: _s.card.gap,
        padding: _s.card.padding,
        border: 1,
        round: _s.card.round,
        clickable: 1,
        position: "relative",
    });
    box.card.elem.style.overflow = "hidden";
    box.card.elem.style.boxSizing = "border-box";
    box.card.elem.style.outline = "none";
    box.card.elem.tabIndex = -1;

        // LABEL: Icon (SVG)
        box.icon = Label({
            text: "",
            width: _s.icon.size,
            height: _s.icon.size,
        });
        box.icon.elem.style.flexShrink = "0";
        box.icon.elem.style.lineHeight = "0";
        box.icon.elem.style.marginTop = "1px";
        box.icon.elem.setAttribute("aria-hidden", "true");

        // GROUP: Texts and action
        box.textGroup = VGroup({
            width: "auto",
            height: "auto",
            align: "left top",
            gap: 2,
        });
        box.textGroup.elem.style.flex = "1 1 auto";
        box.textGroup.elem.style.minWidth = "0";

            box.lblTitle = Label({ text: "", width: "100%", fontSize: _s.title.fontSize });
            box.lblTitle.elem.style.fontFamily = "opensans-bold";
            box.lblTitle.elem.style.overflowWrap = "anywhere";

            box.lblMessage = Label({ text: "", width: "100%", fontSize: _s.message.fontSize });
            box.lblMessage.elem.style.overflowWrap = "anywhere";
            box.lblMessage.elem.style.lineHeight = "1.45";

            // LABEL: Action button
            box.btnAction = Label({
                text: "",
                fontSize: 13,
                padding: [10, 4],
                round: 6,
                clickable: 1,
            });
            box.btnAction.elem.style.fontFamily = "opensans-bold";
            box.btnAction.elem.style.cursor = "pointer";
            box.btnAction.elem.style.marginTop = "6px";
            box.btnAction.elem.tabIndex = 0;
            box.btnAction.elem.setAttribute("role", "button");

        endGroup();

        // LABEL: Close button (SVG)
        box.btnClose = Label({
            text: "",
            width: 24,
            height: 24,
            round: 6,
            clickable: 1,
        });
        box.btnClose.elem.style.flexShrink = "0";
        box.btnClose.elem.style.lineHeight = "0";
        box.btnClose.elem.style.cursor = "pointer";
        box.btnClose.elem.style.display = "flex";
        box.btnClose.elem.style.alignItems = "center";
        box.btnClose.elem.style.justifyContent = "center";
        box.btnClose.elem.style.margin = "-2px -4px 0 0";
        box.btnClose.elem.tabIndex = 0;
        box.btnClose.elem.setAttribute("role", "button");
        box.btnClose.elem.setAttribute("aria-label", "Close");

        // BOX: Time bar
        box.progress = Box({
            width: "100%",
            height: _s.progress.height,
            opacity: _s.progress.opacity,
        });

    endGroup();

    // WHY: The card is a flex group. The bar must be out of the flow, at the bottom.
    box.progress.position = "absolute";
    box.progress.left = 0;
    box.progress.bottom = 0;

    // *** OBJECT INIT CODE:

    // Newest toast is next to the screen edge.
    if (!isBottom && container.elem.firstChild !== box.elem) {
        container.elem.insertBefore(box.elem, container.elem.firstChild);
    }

    // Buttons (mouse and keyboard)
    const pressKey = function (event, func) {
        if (event.key == "Enter" || event.key == " ") {
            event.preventDefault();
            func();
        }
    };

    const runAction = function () {
        if (!box || !box.action) return;
        const result = (typeof box.action.onClick === "function") ? box.action.onClick(box) : undefined;
        if (result !== false) box.close("action");
    };

    box.btnAction.on("click", runAction);
    box.btnAction.on("keydown", function (self, event) { pressKey(event, runAction); });

    box.btnClose.on("click", function () { box.close("close"); });
    box.btnClose.on("keydown", function (self, event) { pressKey(event, function () { box.close("close"); }); });
    box.btnClose.on("mouseover", function () { box.btnClose.color = getTheme().closeHover; });
    box.btnClose.on("mouseout", function () { box.btnClose.color = "transparent"; });

    box.card.on("click", function (self, event) {
        if (!box || !box.onClick) return;
        if (box.btnAction.elem.contains(event.target) || box.btnClose.elem.contains(event.target)) return;
        box.onClick(box);
    });

    box.card.on("keydown", function (self, event) {
        if (event.key == "Escape" && box && box.closable == 1) box.close("close");
    });

    // Pause the time
    box.card.on("mouseenter", function () { isHovered = 1; updatePause(); });
    box.card.on("mouseleave", function () { isHovered = 0; updatePause(); });
    box.card.on("focusin", function () { isFocused = 1; updatePause(); });
    box.card.on("focusout", function () { isFocused = 0; updatePause(); });
    document.addEventListener("visibilitychange", onVisibilityChange);

    render();

    // Enter animation
    const cardStyle = box.card.elem.style;
    const enterX = (position.endsWith("left")) ? -16 : (position.endsWith("right")) ? 16 : 0;
    const enterY = (enterX) ? 0 : (isBottom ? 12 : -12);
    cardStyle.opacity = "0";
    cardStyle.transform = "translate(" + enterX + "px, " + enterY + "px) scale(0.98)";
    void box.card.elem.offsetWidth;
    cardStyle.transition = "opacity 0.2s, transform 0.2s";
    cardStyle.opacity = "1";
    cardStyle.transform = "translate(0px, 0px) scale(1)";

    Toast.list.push(box);

    endObject(box);
    setDefaultContainerBox(previousContainer);

    startTimer();

    // Too many toasts in this position: close the oldest.
    const sameList = Toast.list.filter(function (toast) { return toast.toastPosition == position; });
    if (sameList.length > options.maxVisible) {
        sameList.slice(0, sameList.length - options.maxVisible).forEach(function (toast) { toast.close("limit"); });
    }

    return box;

};

// *** STATIC VARIABLES:

Toast.POSITIONS = ["top-right", "top-center", "top-left", "bottom-right", "bottom-center", "bottom-left"];

// Global options. Change with Toast.setOptions().
Toast.options = {
    position: "top-right",
    theme: "auto", // "light", "dark", "auto"
    width: 360,
    offset: 16, // Space to the screen edges
    gap: 10, // Space between toasts
    maxVisible: 5, // In one position
    zIndex: 3000,
    smallScreenWidth: 520, // Page width: toasts use the full width below this.
    durations: { success: 3000, info: 4000, warning: 5000, error: 7000, loading: 0 },
};

Toast.THEMES = {
    light: {
        background: "#FFFFFF",
        border: "rgba(11, 11, 11, 0.08)",
        shadow: "0 8px 28px rgba(0, 0, 0, 0.14)",
        title: "#1B1B1A",
        message: "#5F5E5A",
        close: "rgba(11, 11, 11, 0.45)",
        closeHover: "rgba(11, 11, 11, 0.06)",
        colors: { success: "#15935F", error: "#D93F3E", warning: "#B77A00", info: "#2A78D6", loading: "#6B6A65" },
    },
    dark: {
        background: "#262625",
        border: "rgba(255, 255, 255, 0.10)",
        shadow: "0 8px 28px rgba(0, 0, 0, 0.5)",
        title: "rgba(255, 255, 255, 0.95)",
        message: "rgba(255, 255, 255, 0.65)",
        close: "rgba(255, 255, 255, 0.5)",
        closeHover: "rgba(255, 255, 255, 0.08)",
        colors: { success: "#3CC08A", error: "#EF6B6A", warning: "#E8B23A", info: "#5A9CF0", loading: "rgba(255, 255, 255, 0.7)" },
    },
};

// [toast] Visible toasts (oldest first)
Toast.list = [];

Toast._containers = {};
Toast._isResizeListening = 0;

// *** STATIC FUNCTIONS:

Toast.show = function (params = {}) {
    return Toast(params);
};

Toast.success = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "success", message: message }));
};

Toast.error = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "error", message: message }));
};

Toast.warning = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "warning", message: message }));
};

Toast.info = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "info", message: message }));
};

// A "loading" toast that becomes "success" or "error". Returns the promise.
// texts: { loading, success, error } success and error can be functions: (value) => text
Toast.promise = function (promise, texts = {}, params = {}) {

    const toast = Toast(Object.assign({}, params, { type: "loading", message: texts.loading || "Loading...", duration: 0, closable: 0 }));

    const getText = function (value, data) {
        return (typeof value === "function") ? value(data) : value;
    };

    promise.then(function (data) {
        toast.update({ type: "success", message: getText(texts.success, data) || "Done.", closable: 1 });
    }, function (error) {
        toast.update({ type: "error", message: getText(texts.error, error) || "Something went wrong.", closable: 1 });
    });

    return promise;

};
// USAGE: Toast.promise(fetch(url), { loading: "Sending...", success: "Sent.", error: (e) => e.message })

Toast.closeAll = function () {
    Toast.list.slice().forEach(function (toast) { toast.close("api"); });
};

// USAGE: Toast.setOptions({ position: "bottom-center", theme: "dark", maxVisible: 3 })
Toast.setOptions = function (values = {}) {
    Object.keys(values).forEach(function (key) {
        if (key == "durations") Object.assign(Toast.options.durations, values.durations);
        else Toast.options[key] = values[key];
    });
    Toast.layoutContainers();
};

// GROUP: The stack of one position (created one time, on the page)
Toast.getContainer = function (position) {

    let container = Toast._containers[position];
    if (container && container.elem.isConnected) return container;

    const previous = getDefaultContainerBox();
    setDefaultContainerBox(page);

        container = VGroup({
            width: Toast.options.width,
            height: "auto",
            align: (position.endsWith("left")) ? "left top" : (position.endsWith("right")) ? "right top" : "center top",
            gap: 0,
        });
        container.elem.style.alignItems = "stretch";
        container.elem.style.overflow = "visible"; // WHY: Groups hide overflow. The card shadows were cut at the edges.
        container.elem.setAttribute("role", "region");
        container.elem.setAttribute("aria-label", "Notifications");

    endGroup();
    setDefaultContainerBox(previous);

    container.toastPosition = position;
    Toast._containers[position] = container;

    if (!Toast._isResizeListening) {
        Toast._isResizeListening = 1;
        page.onResize(function () { Toast.layoutContainers(); });
    }

    Toast.layoutContainers();
    return container;

};

// Places the containers. (Full width on small screens)
Toast.layoutContainers = function () {

    const options = Toast.options;
    const isSmall = page.width < options.smallScreenWidth;

    Object.keys(Toast._containers).forEach(function (position) {

        const container = Toast._containers[position];
        const style = container.elem.style;

        style.position = "fixed";
        style.zIndex = String(options.zIndex);
        style.top = style.bottom = style.left = style.right = "";
        style.transform = "none";
        style.maxWidth = "calc(100% - " + (options.offset * 2) + "px)";

        if (position.startsWith("top")) style.top = options.offset + "px";
        else style.bottom = options.offset + "px";

        if (isSmall) {
            style.left = options.offset + "px";
            style.width = "calc(100% - " + (options.offset * 2) + "px)";
            return;
        }

        style.width = options.width + "px";
        if (position.endsWith("left")) style.left = options.offset + "px";
        else if (position.endsWith("right")) style.right = options.offset + "px";
        else {
            style.left = "50%";
            style.transform = "translateX(-50%)";
        }

    });

};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Toast.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// "#2A78D6", 0.2 -> "rgba(42, 120, 214, 0.2)" (rgba texts are used as they are)
Toast.alpha = function (color, alpha) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return color.replace(/[\d.]+\)$/, alpha + ")");
    const n = parseInt(color.slice(1), 16);
    return "rgba(" + (n >> 16) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
};

Toast.ICON_PATHS = {
    success: '<circle cx="12" cy="12" r="10"/><path d="m7.5 12.5 3 3 6-6.5"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>',
    warning: '<path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v5.5M12 7.5h.01"/>',
    // WHY: SVG animation (SMIL): a turning icon without a CSS file.
    loading: '<circle cx="12" cy="12" r="9" opacity="0.25"/><path d="M21 12a9 9 0 0 0-9-9"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/></path>',
};

Toast.getIconSvg = function (type, color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (Toast.ICON_PATHS[type] || Toast.ICON_PATHS.info) + '</svg>';
};

Toast.getCloseSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};
