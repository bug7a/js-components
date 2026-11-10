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
- Scale: scale multiplies every size of a toast (its style, its shadow, its motion); the scale of
  Toast.options multiplies the places of the toasts (width, offsets, gap, smallScreenWidth). null (default):
  Toast.options.scale, else basic.uiScale (1; a page fitted with page.fit() sets 1 / page.zoom: the toasts keep
  their size on the screen).

USAGE:
Toast.success("Changes are saved.");
Toast.error("Could not save the file.", { titleText: "Upload failed", duration: 0 });
Toast.show({ type: "info", titleText: "Item deleted", messageText: "report.pdf", action: { text: "Undo", onClick: undoDelete } });
Toast.show({ key: "copy", type: "success", messageText: "Link is copied." }); // Same key: updates the visible toast
Toast.promise(saveData(), { loading: "Saving...", success: "Saved.", error: (err) => "Failed: " + err.message });
Toast.setOptions({ position: "bottom-right", theme: "dark" });
Toast.setOptions({ scale: 1.5 }); // every toast and its place x 1.5 (default: basic.uiScale)

const toast = Toast.show({ type: "loading", messageText: "Uploading 0%" });
toast.update({ messageText: "Uploading 60%" });
toast.update({ type: "success", messageText: "Uploaded." }); // Starts its timer (loading has no timer)
toast.close();

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ToastDefaults = {
    key: "", // Same key: updates the visible toast.
    type: "info", // "success", "error", "warning", "info", "loading"
    titleText: "",
    messageText: "",
    allowHtml: 0, // 0: titleText and messageText are shown as text. 1: As HTML (use only your own texts).
    duration: null, // ms. null: Toast.options.durations[type]. 0: Stays until it is closed.
    closable: 1, // 1: Close button
    showProgress: 1, // 1: Time bar
    pauseOnHover: 1,
    action: null, // { text: "Undo", onClick: function (toast) {} } onClick returns false: the toast stays open.
    position: null, // null: Toast.options.position
    theme: null, // null: Toast.options.theme
    scale: null, // every size multiplied (Ex: 1.5). null: Toast.options.scale
    onClick: null, // function (toast) {} Click on the toast (not on the buttons)
    onClose: function (self, reason) { }, // reason: "timeout", "close", "action", "limit", "api"
    style: { // (its sizes are px, multiplied by scale)
        card: {
            round: 10,
            padding: [14, 12],
            gap: 12,
            border: 1,
        },
        icon: {
            size: 20,
            marginTop: 1, // in the line of the title
        },
        texts: {
            gap: 2, // between the title, the message and the action
        },
        title: {
            fontSize: 14,
        },
        message: {
            fontSize: 13,
        },
        action: { // the action button (Ex: "Undo")
            fontSize: 13,
            padding: [10, 4],
            round: 6,
            marginTop: 6,
        },
        close: { // the close button
            size: 24,
            iconSize: 16,
            round: 6,
            marginTop: -2, // a little up and right: its icon in the line of the title, near the corner
            marginRight: -4,
        },
        progress: {
            height: 3,
            opacity: 0.45,
        },
    }
};

const Toast = function (params = {}) {

    // WHY: The other components take styleName; a toast takes theme (the colors, also "auto") and style (the shapes).
    //      Without this line a styleName is kept quietly and the toast keeps the theme of the page.
    if (params.styleName) console.warn("Toast: styleName is not used. The colors come with theme (\"light\", \"dark\", \"auto\", \"minimal\", \"minimalDark\"), the shapes with style.");

    // Merge params: the shapes of its theme (Toast.THEMES[name].style: minimal), then the defaults
    // WHY before the defaults: the shapes of a theme win over the default shapes, a style of the page over both
    const themeOfParams = Toast.THEMES[params.theme || Toast.options.theme];
    if (themeOfParams && themeOfParams.style) {
        const ownStyle = {};
        mergeIntoIfMissing(ownStyle, params.style || {});
        mergeIntoIfMissing(ownStyle, themeOfParams.style);
        params.style = ownStyle;
    }
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
    params.scale = Toast.getScale(params.scale);
    params.style = basic.scaleStyle(params.style, params.scale);
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
    let timer = null; // The cancel function of box.after (stopped by remove())
    let removeVisibilityEvent = null;
    let remaining = 0; // ms
    let startedAt = 0;
    let isHovered = 0;
    let isFocused = 0;
    const SLIDE_X = 16 * box.scale; // px: a toast at the left or right side comes from (and goes to) that side
    const SLIDE_Y = 12 * box.scale; // px: a centered toast comes from the top or the bottom
    const ENTER_TIME = "0.2s";
    const LEAVE_TIME = "0.16s"; // The fade out, then the closing of the space in the stack
    const LEAVE_WAIT = 150; // ms: the space starts to close a little before the fade ends
    const COLLAPSE_WAIT = 170; // ms: a little after the space is closed
    const BUMP_TIME = 120; // ms

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
        return basic.resolveTheme(Toast.THEMES, box.theme || options.theme);
    };

    const getDuration = function () {
        if (box.duration !== null && box.duration !== undefined) return box.duration;
        return options.durations[box.type] ?? 4000;
    };

    const getViewText = function (value) {
        return (box.allowHtml == 1) ? String(value) : Toast.escapeHtml(value);
    };

    // The move of the enter and the close animations: { x, y } in px
    const getSlideOffset = function () {
        if (box.toastPosition.endsWith("left")) return { x: -SLIDE_X, y: 0 };
        if (box.toastPosition.endsWith("right")) return { x: SLIDE_X, y: 0 };
        return { x: 0, y: (isBottom) ? SLIDE_Y : -SLIDE_Y };
    };

    // Writes the values to the view. (On create and update)
    const render = function () {

        const theme = getTheme();
        const color = theme.colors[box.type] || theme.colors.info;
        const isError = (box.type == "error");

        box.card.color = theme.background;
        box.card.borderColor = theme.border;
        box.card.boxShadow = basic.scaleCssText(theme.shadow, box.scale);
        box.card.role = (isError) ? "alert" : "status";
        box.card.aria = { live: (isError) ? "assertive" : "polite" };
        box.card.cursor = (box.onClick) ? "pointer" : "default";

        box.icon.text = Toast.getIconSvg(box.type, color, _s.icon.size);

        box.lblTitle.visible = (box.titleText) ? 1 : 0;
        box.lblTitle.text = getViewText(box.titleText);
        box.lblTitle.textColor = theme.title;

        box.lblMessage.visible = (box.messageText) ? 1 : 0;
        box.lblMessage.text = getViewText(box.messageText);
        box.lblMessage.textColor = (box.titleText) ? theme.message : theme.title; // WHY: Without a title, the message is the main text.

        const hasAction = !!(box.action && box.action.text);
        box.btnAction.visible = (hasAction) ? 1 : 0;
        if (hasAction) {
            box.btnAction.plainText = box.action.text;
            box.btnAction.textColor = theme.actionText || color;
            box.btnAction.color = theme.actionFill || Toast.alpha(color, 0.12);
        }

        box.btnClose.visible = (box.closable == 1) ? 1 : 0;
        box.btnClose.text = Toast.getCloseSvg(theme.close, _s.close.iconSize);

        box.progress.color = color;

    };

    // Time bar: from full to empty in ms.
    const animateProgress = function (ms, fromFull) {
        const style = box.progress.css;
        if (fromFull) {
            style.transition = "none";
            style.width = "100%";
            void box.progress.elem.offsetWidth; // WHY: Apply 100% before the transition starts.
        }
        style.transition = "width " + ms + "ms linear";
        style.width = "0%";
    };

    const freezeProgress = function () {
        const style = box.progress.css;
        const width = window.getComputedStyle(box.progress.elem).width;
        style.transition = "none";
        style.width = width;
    };

    // Closes the toast after the remaining time.
    const waitAndClose = function () {
        startedAt = Date.now();
        timer = box.after(remaining, function () {
            timer = null;
            box.close("timeout");
        });
    };

    const stopTimer = function () {
        if (timer) timer();
        timer = null;
    };

    const startTimer = function () {

        stopTimer();
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
            box.progress.css = { transition: "none", width: "100%" };
            return;
        }

        waitAndClose();
        if (showProgress) animateProgress(remaining, true);

    };

    const isPaused = function () {
        return (box.pauseOnHover == 1 && (isHovered || isFocused)) || document.hidden;
    };

    const pause = function () {
        if (!timer) return;
        stopTimer();
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
        freezeProgress();
    };

    const resume = function () {
        if (timer || !(remaining > 0) || isPaused() || box.isClosing) return;
        waitAndClose();
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
        ["type", "titleText", "messageText", "allowHtml", "duration", "closable", "showProgress", "pauseOnHover", "theme", "onClick", "action"].forEach(function (key) {
            if (key in values) box[key] = values[key];
        });
        if (!("duration" in values)) box.duration = null; // WHY: A new type (loading -> success) uses its own duration.
        render();
        startTimer();
        return box;
    };
    // USAGE: toast.update({ type: "success", messageText: "Uploaded." })

    // A small move to show that the toast is updated.
    box.bump = function () {
        if (!box) return;
        const cardStyle = box.card.css;
        cardStyle.transition = "transform " + (BUMP_TIME / 1000) + "s";
        cardStyle.transform = "scale(1.03)";
        box.after(BUMP_TIME, function () {
            cardStyle.transform = "scale(1)";
        });
    };

    box.close = function (reason = "api") {

        if (!box || box.isClosing) return;
        box.isClosing = 1;

        stopTimer();
        if (removeVisibilityEvent) removeVisibilityEvent();
        Toast.list = Toast.list.filter(function (toast) { return toast !== box; });

        const self = box;
        const cardStyle = self.card.css;
        const move = getSlideOffset();

        // 1. Fade and move out
        cardStyle.transition = "opacity " + LEAVE_TIME + ", transform " + LEAVE_TIME;
        cardStyle.opacity = "0";
        cardStyle.transform = "translate(" + move.x + "px, " + move.y + "px) scale(0.98)";

        setTimeout(function () {

            // 2. Close the space in the stack
            const slotStyle = self.css;
            slotStyle.height = self.elem.offsetHeight + "px";
            void self.elem.offsetHeight; // WHY: Apply the fixed height before the transition starts.
            slotStyle.transition = "height " + LEAVE_TIME + ", padding " + LEAVE_TIME;
            slotStyle.height = "0px";
            slotStyle.paddingTop = "0px";
            slotStyle.paddingBottom = "0px";

            setTimeout(function () {
                self.onClose(self, reason);
                self.remove();
                if (box === self) box = null;
            }, COLLAPSE_WAIT);

        }, LEAVE_WAIT);

    };
    // reason: "timeout", "close", "action", "limit", "api"

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        Toast.list = Toast.list.filter(function (toast) { return toast !== box; });
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.css = { overflow: "visible", boxSizing: "border-box" };
    // (the gap between the toasts is a place: the scale of Toast.options, like the offsets)
    box.css[(isBottom) ? "paddingTop" : "paddingBottom"] = (options.gap * Toast.getScale()) + "px";

    // GROUP: Card
    box.card = HGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: _s.card.gap,
        padding: _s.card.padding,
        border: _s.card.border,
        round: _s.card.round,
        clickable: 1,
        position: "relative",
    });
    box.card.css = { overflow: "hidden", boxSizing: "border-box", outline: "none" };
    box.card.tabIndex = -1;

        // LABEL: Icon (SVG)
        box.icon = Label({
            text: "",
            width: _s.icon.size,
            height: _s.icon.size,
        });
        box.icon.shrink = 0;
        box.icon.lineHeight = "0";
        box.icon.css.marginTop = _s.icon.marginTop + "px";
        box.icon.aria = { hidden: "true" };

        // GROUP: Texts and action
        box.textGroup = VGroup({
            width: "auto",
            height: "auto",
            align: "left top",
            gap: _s.texts.gap,
        });
        box.textGroup.css = { flex: "1 1 auto", minWidth: "0" };

            box.lblTitle = Label({ text: "", width: "100%", fontSize: _s.title.fontSize });
            box.lblTitle.css = { fontFamily: "opensans-bold", overflowWrap: "anywhere" };

            box.lblMessage = Label({ text: "", width: "100%", fontSize: _s.message.fontSize });
            box.lblMessage.css.overflowWrap = "anywhere";
            box.lblMessage.lineHeight = "1.45";

            // LABEL: Action button
            box.btnAction = Label({
                text: "",
                fontSize: _s.action.fontSize,
                padding: _s.action.padding,
                round: _s.action.round,
                clickable: 1,
            });
            box.btnAction.css = { fontFamily: "opensans-bold", marginTop: _s.action.marginTop + "px" };
            box.btnAction.cursor = "pointer";
            box.btnAction.tabIndex = 0;
            box.btnAction.role = "button";

        endGroup();

        // LABEL: Close button (SVG)
        box.btnClose = Label({
            text: "",
            width: _s.close.size,
            height: _s.close.size,
            round: _s.close.round,
            clickable: 1,
        });
        box.btnClose.shrink = 0;
        box.btnClose.lineHeight = "0";
        box.btnClose.cursor = "pointer";
        box.btnClose.elem.style.display = "flex";
        const closeMargin = _s.close.marginTop + "px " + _s.close.marginRight + "px 0 0";
        box.btnClose.css = { alignItems: "center", justifyContent: "center", margin: closeMargin };
        box.btnClose.tabIndex = 0;
        box.btnClose.role = "button";
        box.btnClose.aria = { label: "Close" };

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
        // WHY isClosing: the card fades for a moment after close(); a double click ran the action (Undo) twice
        if (!box || !box.action || box.isClosing) return;
        const result = (typeof box.action.onClick === "function") ? box.action.onClick(box) : undefined;
        if (result !== false) box.close("action");
    };

    box.btnAction.on("click", runAction);
    box.btnAction.on("keydown", function (self, event) {
        pressKey(event, runAction);
    });

    const closeByButton = function () {
        box.close("close");
    };

    box.btnClose.on("click", closeByButton);
    box.btnClose.on("keydown", function (self, event) {
        pressKey(event, closeByButton);
    });
    box.btnClose.on("mouseover", function () {
        box.btnClose.color = getTheme().closeHover;
    });
    box.btnClose.on("mouseout", function () {
        box.btnClose.color = "transparent";
    });

    box.card.on("click", function (self, event) {
        if (!box || !box.onClick) return;
        if (box.btnAction.elem.contains(event.target) || box.btnClose.elem.contains(event.target)) return;
        box.onClick(box);
    });

    box.card.on("keydown", function (self, event) {
        if (event.key == "Escape" && box && box.closable == 1) box.close("close");
    });

    // Pause the time
    box.card.on("mouseenter", function () {
        isHovered = 1;
        updatePause();
    });
    box.card.on("mouseleave", function () {
        isHovered = 0;
        updatePause();
    });
    box.card.on("focusin", function () {
        isFocused = 1;
        updatePause();
    });
    box.card.on("focusout", function () {
        isFocused = 0;
        updatePause();
    });
    removeVisibilityEvent = box.listenTo(document, "visibilitychange", onVisibilityChange);

    render();

    // Enter animation
    const cardStyle = box.card.css;
    const enterMove = getSlideOffset();
    cardStyle.opacity = "0";
    cardStyle.transform = "translate(" + enterMove.x + "px, " + enterMove.y + "px) scale(0.98)";
    void box.card.elem.offsetWidth; // WHY: Apply the start position before the transition starts.
    cardStyle.transition = "opacity " + ENTER_TIME + ", transform " + ENTER_TIME;
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
    theme: "auto", // "light", "dark", "auto", "minimal", "minimalDark"
    width: 360,
    offset: 16, // Space to the screen edges
    offsetTop: null, // Space to the top edge (Ex: under the header of an app). null: offset
    offsetBottom: null, // Space to the bottom edge (Ex: over a tab bar). null: offset
    gap: 10, // Space between toasts
    maxVisible: 5, // In one position
    zIndex: 45000, // WHY: over the Dialogs (4000 and up: a toast under the cover of a dialog could not be clicked, its
                   //      Undo closed the dialog), under Notice (50000) and Tooltip (100000)
    smallScreenWidth: 520, // Page width: toasts use the full width below this.
    durations: { success: 3000, info: 4000, warning: 5000, error: 7000, loading: 0 },
    // The px above (width, offsets, gap, smallScreenWidth) multiplied, and the scale of a toast without its own.
    // null: basic.uiScale (1 / page.zoom on a page fitted with page.fit())
    scale: null,
};

// *** THEMES: the colors. (The style param has the shapes and the sizes.)
// USAGE: Toast.success("Saved", { theme: "dark" })
// USAGE: Toast.setOptions({ theme: "auto" }) // Every toast: "light", "dark", "auto" (the system setting)
// NOTE: A new theme needs only the keys that differ from the light theme. actionText / actionFill: the colors of the
// action button ("": the color of the type, and a pale fill of it).
// USAGE: Toast.THEMES.ocean = { background: "#0B2239", title: "#FFFFFF" };
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

// The minimal theme (_designs/minimal-theme.htm): on the ground of the window with a line and no shadow; style: its
// shapes too (a theme with a style gives the shapes, under the style of the page): smaller and less round.
Toast.MINIMAL_SHAPES = {
    card: { round: 4, padding: [12, 10], gap: 10, border: 1 },
    icon: { size: 16, marginTop: 1 },
    title: { fontSize: 13 },
    message: { fontSize: 12 },
    action: { fontSize: 12, padding: [0, 2], round: 4, marginTop: 4 }, // WHY no side room: a text with no fill, in the line of the message
    close: { size: 20, iconSize: 14, round: 4, marginTop: -2, marginRight: -4 },
    progress: { height: 2, opacity: 0.45 },
};
Toast.THEMES.minimal = {
    background: "#FFFFFF",
    border: Black(0.2),
    shadow: "none",
    title: Black(0.85),
    message: Black(0.55),
    close: Black(0.45),
    closeHover: Black(0.05),
    actionText: "#1F1F1F",
    actionFill: "transparent",
    colors: { success: "#2E9E74", error: "#C24A36", warning: "#B77A00", info: "#3D8BD9", loading: Black(0.55) },
    style: Toast.MINIMAL_SHAPES,
};
Toast.THEMES.minimalDark = {
    background: "#1A1A19",
    border: White(0.18),
    shadow: "none",
    title: White(0.88),
    message: White(0.55),
    close: White(0.5),
    closeHover: White(0.06),
    actionText: "#EDEDEB",
    actionFill: "transparent",
    colors: { success: "#7FE3B5", error: "#FF9F93", warning: "#E8B23A", info: "#7FB6DE", loading: White(0.55) },
    style: Toast.MINIMAL_SHAPES,
};

// [toast] Visible toasts (oldest first)
Toast.list = [];

Toast._containers = {};
Toast._isResizeListening = 0;
Toast._layoutScale = 1; // the scale of the last layoutContainers()

// *** STATIC FUNCTIONS:

Toast.show = function (params = {}) {
    return Toast(params);
};

Toast.success = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "success", messageText: message }));
};

Toast.error = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "error", messageText: message }));
};

Toast.warning = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "warning", messageText: message }));
};

Toast.info = function (message, params = {}) {
    return Toast(Object.assign({}, params, { type: "info", messageText: message }));
};

// A "loading" toast that becomes "success" or "error". Returns the promise.
// texts: { loading, success, error } success and error can be functions: (value) => text
Toast.promise = function (promise, texts = {}, params = {}) {

    const toast = Toast(Object.assign({}, params, {
        type: "loading",
        messageText: texts.loading || "Loading...",
        duration: 0,
        closable: 0,
    }));

    const getText = function (value, data) {
        return (typeof value === "function") ? value(data) : value;
    };

    promise.then(function (data) {
        toast.update({ type: "success", messageText: getText(texts.success, data) || "Done.", closable: 1 });
    }, function (error) {
        toast.update({ type: "error", messageText: getText(texts.error, error) || "Something went wrong.", closable: 1 });
    });

    return promise;

};
// USAGE: Toast.promise(fetch(url), { loading: "Sending...", success: "Sent.", error: (e) => e.message })

Toast.closeAll = function () {
    Toast.list.slice().forEach(function (toast) { toast.close("api"); });
};

// USAGE: Toast.setOptions({ position: "bottom-center", theme: "dark", maxVisible: 3 })
// USAGE: Toast.setOptions({ position: "top-center", offsetTop: 64 }) // under a 56 px header
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
    if (container && container.elem.isConnected) {
        // WHY: a page changes basic.uiScale with page.zoom, often without a resize of the window
        if (Toast.getScale() !== Toast._layoutScale) Toast.layoutContainers();
        return container;
    }

    const getAlign = function () {
        if (position.endsWith("left")) return "left top";
        if (position.endsWith("right")) return "right top";
        return "center top";
    };

    const previous = getDefaultContainerBox();
    setDefaultContainerBox(page);

        container = VGroup({
            width: Toast.options.width,
            height: "auto",
            align: getAlign(),
            gap: 0,
        });
        container.css = {
            alignItems: "stretch",
            overflow: "visible", // WHY: Groups hide overflow. The card shadows were cut at the edges.
        };
        container.role = "region";
        container.aria = { label: "Notifications" };

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

// The scale of a toast: its own, else Toast.options.scale, else basic.uiScale. Toast.getScale(): of the containers
Toast.getScale = function (ownScale = null) {
    return ownScale ?? Toast.options.scale ?? basic.uiScale;
};

// Places the containers. (Full width on small screens)
Toast.layoutContainers = function () {

    const options = Toast.options;
    const scale = Toast.getScale();
    const offset = options.offset * scale;
    const offsetTop = (options.offsetTop ?? options.offset) * scale;
    const offsetBottom = (options.offsetBottom ?? options.offset) * scale;
    // WHY smallScreenWidth x scale: page.width is in the px of the page, a fitted page has more of them
    const isSmall = page.width < options.smallScreenWidth * scale;
    Toast._layoutScale = scale;

    Object.keys(Toast._containers).forEach(function (position) {

        const container = Toast._containers[position];
        const style = container.css;

        // WHY: "absolute", not "fixed": the container is on page (page never scrolls). page.fit() / page.zoom give
        //      <body> a transform, and a fixed box is placed on the scaled <body> (a toast in the middle of a phone screen).
        style.position = "absolute";
        style.zIndex = String(options.zIndex);
        style.top = "";
        style.bottom = "";
        style.left = "";
        style.right = "";
        style.transform = "none";
        style.maxWidth = "calc(100% - " + (offset * 2) + "px)";

        // WHY own top / bottom spaces: a bigger offset for a header also narrowed the toasts at the sides
        if (position.startsWith("top")) style.top = offsetTop + "px";
        else style.bottom = offsetBottom + "px";

        if (isSmall) {
            style.left = offset + "px";
            style.width = "calc(100% - " + (offset * 2) + "px)";
            return;
        }

        style.width = (options.width * scale) + "px";
        if (position.endsWith("left")) style.left = offset + "px";
        else if (position.endsWith("right")) style.right = offset + "px";
        else {
            style.left = "50%";
            style.transform = "translateX(-50%)";
        }

    });

};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Toast.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

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

Toast.getCloseSvg = function (color, size = 16) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color +
        '" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};
