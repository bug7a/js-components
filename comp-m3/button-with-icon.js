/* Bismillah */

/*

Button With Icon - v26.01

- A customizable button with an icon and text.
- Supports icon positioning (left/top). No iconFile: a button with only its text.
- KEYBOARD AND ACCESSIBILITY (2026-10-29): role "button", Tab reaches it, Enter / Space press it, a focus ring only
  for the keyboard (setFocusRing); ariaLabel for a button with only an icon (else labelText is read).
- setEnabled(0): gray (style.disabled), no click, no hover, out of the Tab order (aria-disabled).
- setStyle(style) (2026-10-29): changes the look after create with only the keys it gets (Ex: a red "Sure?" state).
- MOTION (2026-10-29, the press and ripple of comp-m4/ui-effects.js inside the component, no file to load):
  animated: 1 (default): under the mouse a little brighter, pressed 0.94 and a little darker (UIEffects.press).
  ripple: 1 (default 1 for now): a wave from the pressed point (from the middle for the keyboard); its color fits the
  button (light on a dark button). No motion while disabled or waiting, and none with prefers-reduced-motion.
  setAnimated(0/1), setRipple(0/1).
- WAITING (2026-10-28, from comp-m1/object-waiting.js ObjectWaiting): setWaiting(1) puts a dark cover with a slowly
  turning ring (or the icon of waitingIconFile, Ex: the clock of ObjectWaiting) over the button while a job runs (a download, a save); the button can not be clicked then. setWaiting(0) takes it
  away (after delay ms, if given). The cover is inside the button: it moves and grows with it (ObjectWaiting was a
  sibling and needed reposition() after a resize).

USAGE:
ButtonWithIcon({
    labelText: "Alert",
    iconFile: "../comp-m3/button-with-icon/alert-black.png",
    iconPosition: "top",
    onClick: function (self) { self.setText("Clicked"); },
});
const btnDownload = ButtonWithIcon({ labelText: "Download", onClick: function (self) {
    self.setWaiting(1);
    download().then(function () { self.setWaiting(0); });
} });
btnDownload.setWaiting(0, 1000); // takes the cover away after 1 s
btnDelete.setStyle({ box: { color: "#E8796D" }, hover: { color: "#E8796D" }, label: { textColor: "white" } });

Started Date: January 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

Developed by AI (AntiGravity Gemini 3 Pro)

*/

"use strict";

// Default values:
const ButtonWithIconDefaults = {
    key: "0",
    width: "auto",
    height: "auto",
    labelText: "Button",
    iconFile: "", // "": no icon (Ex: "../comp-m3/button-with-icon/alert-black.png")
    iconPosition: "left", // "left", "top"
    enabled: 1, // 0: gray, can not be pressed (set later with setEnabled)
    ariaLabel: "", // "": labelText is read. A button with only an icon needs it (Ex: "Delete")
    waiting: 0, // 1: the waiting cover is over the button (set later with setWaiting)
    // (a TRIAL, the user, 2026-10-29: both on for now; later animated 0 by default and 1 in the new style packages)
    animated: 1, // 1: the press effect (brighter under the mouse, smaller and darker while pressed). setAnimated()
    ripple: 1, // 1: a wave from the pressed point (it works with animated: 0 too). setRipple()
    waitingIconFile: "", // "": a turning ring (it shows the wait better and covers less of the text). The clock: "../comp-m3/button-with-icon/clock.png"
    onClick: function (self) { }, // Not called while waiting
    onWaitingEnd: function (self) { }, // The waiting cover went away (setWaiting(0))
    style: {
        layout: {
            gap: 8,
            padding: [12, 6],
            align: "center center",
        },
        icon: {
            width: 24,
            height: 24,
            color: White(0), // Default no tint
        },
        label: {
            fontSize: 16,
            textColor: Black(0.8),
            fontFamily: "opensans-bold",
        },
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
        },
        hover: {
            color: "#f5f5f5",
        },
        active: {
            color: "#e0e0e0",
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.6)", // the ring of the keyboard focus
        },
        disabled: {
            opacity: 0.45,
        },
        press: {
            scale: 0.94, // while pressed
            removeShadow: 0, // 1: while pressed the box shadow (Ex: the inset bottom line) goes away, as if pushed in
            hoverBrightness: 1.12, // (1.15 made some faint colors vanish, 2026-10-29)
            pressedBrightness: 0.92,
            time: 0.15, // s
        },
        ripple: {
            color: "", // "": light on a dark button, dark on a light one
            lightColor: White(0.45),
            darkColor: Black(0.12),
            time: 0.6, // s
        },
        waiting: {
            color: "rgba(0, 0, 0, 0.4)", // the cover of a light button
            // A dark button (Ex: a blue "Save"): its own color covers it, so the light ring is seen clearly
            // (a dark cover on it made the ring melt into the white text). 0: always "color".
            fitDarkButton: 1,
            darkCoverOpacity: 0.85,
            ringSize: 22, // at most; a small button gets a smaller ring
            ringWidth: 3,
            ringColor: White(0.95),
            ringTrackColor: White(0.3), // the rest of the circle
            ringTurnTime: 0.9, // s: one turn (slow and even)
            iconSize: 50, // waitingIconFile: at most; a small button gets a smaller icon
            iconSpace: 14, // the room around the ring / icon in a small button
            invertIcon: 0, // 1: the icon is drawn light (on a light cover)
        },
    }
};

const ButtonWithIcon = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ButtonWithIconDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const WAITING_MOTION = "opacity 0.2s"; // short and soft (the cover goes away at once)
    const STILL_MOTION = "background-color 0.2s"; // the colors of hover / pressed (animated: 0 too)
    let cancelWaitingEnd = null;
    let isHover = 0;
    let isPressed = 0;
    let isSpaceDown = 0; // Space went down on this button (it presses when it goes up, like a real button)
    let wasAnimated = 0; // the press look was written (setAnimated(0) writes the still look back)

    // *** PRIVATE FUNCTIONS:

    const canPress = function () {
        return box.enabled == 1 && box.waiting != 1;
    };

    // The look of the state: pressed > under the mouse > normal; a disabled button is gray and still.
    const paint = function () {
        const isEnabled = (box.enabled == 1);
        let color = box.style.box.color;
        // WHY not while waiting: the cover takes its color from the button (fitDarkButton), it must stay the same
        const canShowState = isEnabled && box.waiting != 1;
        if (canShowState && isPressed) color = box.style.active.color;
        else if (canShowState && isHover) color = box.style.hover.color;
        box.color = color;
        box.opacity = isEnabled ? 1 : box.style.disabled.opacity;
        box.cursor = isEnabled ? "pointer" : "default";
        box.tabIndex = isEnabled ? 0 : -1;
        box.aria = { disabled: !isEnabled, label: box.ariaLabel || box.labelText || "" };
    };

    const press = function (event) {
        if (!canPress()) return;
        if (box.onClick) box.onClick(box, event);
    };

    // *** MOTION (the press and the ripple of UIEffects)

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const isMotionOn = function () {
        return box.animated == 1 && !isReducedMotion();
    };

    const getPressTransform = function () {
        if (isPressed && canPress()) return "scale(" + box.style.press.scale + ")";
        return "none";
    };

    // WHY "": the box shadow of the style comes back (it is set by the style, not by the press)
    const getPressShadow = function () {
        if (isPressed && canPress() && box.style.press.removeShadow == 1) return "none";
        return box.style.box.boxShadow || "";
    };

    const getPressFilter = function () {
        if (!canPress()) return "none";
        if (isPressed) return "brightness(" + box.style.press.pressedBrightness + ")";
        if (isHover) return "brightness(" + box.style.press.hoverBrightness + ")";
        return "none";
    };

    // The press look from the state (the colors of the state: paint)
    const paintMotion = function () {
        if (!isMotionOn()) return;
        box.css = { transform: getPressTransform(), filter: getPressFilter(), boxShadow: getPressShadow() };
    };

    // The transitions of the press, or the still look back (only when it was animated before)
    const applyAnimated = function () {
        if (!isMotionOn()) {
            if (!wasAnimated) return;
            wasAnimated = 0;
            box.css = { transform: "", filter: "", boxShadow: box.style.box.boxShadow || "" };
            box.setMotionNow(STILL_MOTION);
            return;
        }
        wasAnimated = 1;
        const time = box.style.press.time + "s";
        // WHY not setMotion(): it starts after a timer, and the press must answer the first click
        box.setMotionNow("transform " + time + ", filter " + time + ", box-shadow " + time + ", " + STILL_MOTION);
        paintMotion();
    };

    const getRippleColor = function () {
        const _r = box.style.ripple;
        if (_r.color) return _r.color;
        return ButtonWithIcon.isDarkColor(getComputedStyle(box.elem).backgroundColor) ? _r.lightColor : _r.darkColor;
    };

    // The pressed point in the button (px), also when the page is zoomed (page.fit) or the button is pressed (scale)
    const getLocalPoint = function (event) {
        const elem = box.elem;
        if (!event || event.clientX === undefined) return { x: elem.clientWidth / 2, y: elem.clientHeight / 2 };
        const rect = elem.getBoundingClientRect();
        const scaleX = rect.width ? elem.offsetWidth / rect.width : 1;
        const scaleY = rect.height ? elem.offsetHeight / rect.height : 1;
        return { x: (event.clientX - rect.left) * scaleX - elem.clientLeft, y: (event.clientY - rect.top) * scaleY - elem.clientTop };
    };

    // A wave from the point (a layer for a moment over the content; the mouse goes through it)
    const showRipple = function (event) {
        if (box.ripple != 1 || !canPress() || isReducedMotion()) return;
        const elem = box.elem;
        const point = getLocalPoint(event);
        // WHY: the radius reaches the farthest corner, so the wave covers the whole button
        const radius = Math.hypot(Math.max(point.x, elem.clientWidth - point.x), Math.max(point.y, elem.clientHeight - point.y));
        const layer = document.createElement("span");
        layer.style.cssText = "position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; border-radius: inherit; pointer-events: none;";
        const dot = document.createElement("span");
        dot.style.cssText = "position: absolute; border-radius: 50%; pointer-events: none; background: " + getRippleColor() + ";" +
            " left: " + (point.x - radius) + "px; top: " + (point.y - radius) + "px; width: " + (radius * 2) + "px; height: " + (radius * 2) + "px;";
        layer.appendChild(dot);
        elem.insertBefore(layer, box.waitingCover.elem); // WHY: under the waiting cover (onClick often starts it)
        const wave = dot.animate([
            { transform: "scale(0)", opacity: 1 },
            { transform: "scale(1)", opacity: 0.7, offset: 0.6 },
            { transform: "scale(1)", opacity: 0 },
        ], { duration: box.style.ripple.time * 1000, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" });
        wave.onfinish = function () { layer.remove(); };
    };

    // The ring (or the icon) fits the button: at most its size, smaller in a small button.
    const fitWaitingIcon = function () {
        const _w = box.style.waiting;
        const shortSide = Math.min(box.width, box.height);
        const maxSize = box.waitingIconFile ? _w.iconSize : _w.ringSize;
        const size = Math.max(0, Math.min(maxSize, shortSide - _w.iconSpace));
        box.waitingCover.icon.setSize(size, size);
        box.waitingCover.icon.center();
    };

    // BOX: The turning ring (CSS: a circle line with one light part)
    const createWaitingRing = function () {
        const _w = box.style.waiting;
        ButtonWithIcon.injectCss();
        const ring = Box(0, 0, 0, 0, {
            color: "transparent",
            css: {
                border: _w.ringWidth + "px solid " + _w.ringTrackColor,
                borderTopColor: _w.ringColor,
                borderRadius: "50%",
                boxSizing: "border-box",
                animation: "button-with-icon-turn " + _w.ringTurnTime + "s linear infinite",
            },
        });
        ring.elem.classList.add("button-with-icon-ring");
        return ring;
    };

    // The color of the style as the browser computes it ("white", "#9DC7B5", a var() -> rgb())
    // WHY not the color of the box: its background-color motion (0.2 s) is between two colors after a press
    const getStyleColor = function () {
        const probe = document.createElement("span");
        probe.style.cssText = "position: absolute; width: 0; height: 0; background-color: " + box.style.box.color + ";";
        box.elem.appendChild(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
    };

    // The cover fits the color of the button (it is read at every wait: the color can change)
    const paintWaitingCover = function () {
        const _w = box.style.waiting;
        const buttonColor = getStyleColor();
        const isDark = (_w.fitDarkButton == 1) && ButtonWithIcon.isDarkColor(buttonColor);
        box.waitingCover.color = isDark ? Alpha(buttonColor, _w.darkCoverOpacity) : _w.color;
    };

    const showWaitingCover = function () {
        const cover = box.waitingCover;
        paintWaitingCover();
        cover.setMotionNow("");
        cover.opacity = 0;
        cover.visible = 1;
        fitWaitingIcon();
        // WHY: the start look must be drawn before the motion is turned on, or the cover is seen at once
        void cover.elem.offsetHeight;
        cover.setMotionNow(WAITING_MOTION);
        cover.opacity = 1;
    };

    const endWaiting = function () {
        box.waiting = 0;
        box.aria = { busy: false };
        box.waitingCover.visible = 0;
        paint();
        paintMotion();
        box.onWaitingEnd(box);
    };

    // *** PUBLIC FUNCTIONS:

    box.setText = function (text) {
        box.labelText = text;
        if (box.label) box.label.text = text;
        paint(); // (the label read by a screen reader)
    };
    // USAGE: button.setText("Save")

    box.setIcon = function (file) {
        box.iconFile = file;
        if (box.icon) box.icon.load(file);
    };
    // USAGE: button.setIcon("../comp-m3/button-with-icon/alert-black.png")

    box.setAnimated = function (value) {
        box.animated = basic.isOn(value) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: get: button.animated, set: button.setAnimated(0)

    box.setRipple = function (value) {
        box.ripple = basic.isOn(value) ? 1 : 0;
    };
    // USAGE: get: button.ripple, set: button.setRipple(1)

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        if (box.enabled != 1) {
            isHover = 0;
            isPressed = 0;
            isSpaceDown = 0;
        } else {
            isHover = box.elem.matches(":hover") ? 1 : 0; // WHY: the mouse may have stayed on it while it was off
        }
        paint();
        paintMotion();
    };
    // USAGE: get: button.enabled, set: button.setEnabled(0)

    // Only the given keys change; the other keys of the style stay.
    // WHY a new object for each part: the old one can be shared with other buttons (the same style object of a page)
    box.setStyle = function (style) {
        Object.keys(style || {}).forEach(function (part) {
            box.style[part] = Object.assign({}, box.style[part], style[part]);
        });
        applyStyle();
    };
    // USAGE: button.setStyle({ box: { color: "tomato", borderColor: "red" }, hover: { color: "tomato" } })

    // The style on the objects (box, layout, icon, label, focus ring); paint() gives the colors of the state.
    // NOTE: the waiting ring keeps the look it was made with.
    const applyStyle = function () {
        const _s = box.style;
        box.props(_s.box);
        box.layout.props(_s.layout);
        if (box.icon) box.icon.props(_s.icon);
        if (box.label) box.label.props(_s.label);
        box.setFocusRing(_s.focus.ringColor);
        paint();
    };

    // delay: ms before the cover goes away (only for 0)
    box.setWaiting = function (value, delay = 0) {
        const isWaiting = basic.isOn(value) ? 1 : 0;
        if (cancelWaitingEnd) cancelWaitingEnd();
        cancelWaitingEnd = null;
        if (isWaiting) {
            const wasWaiting = (box.waiting == 1);
            box.waiting = 1;
            box.aria = { busy: true };
            paint(); // (the color of the style, not the hover one, under the cover)
            paintMotion(); // (no press look while waiting)
            if (!wasWaiting) showWaitingCover();
            return;
        }
        if (box.waiting != 1) return;
        if (delay <= 0) {
            endWaiting();
            return;
        }
        cancelWaitingEnd = box.after(delay, function () {
            cancelWaitingEnd = null;
            endWaiting();
        });
    };
    // USAGE: get: button.waiting, set: button.setWaiting(1) / button.setWaiting(0, 1000)

    box.refresh = function () {
        // NOTE: Nothing to draw again: setText() and setIcon() change the view at once.
    };

    // NOTE: No remove() of its own: basic.js remove() cleans the events and the objects inside.

    // *** OBJECT VIEW:

    // BOX: Container look
    box.props(box.style.box);
    box.cursor = "pointer";
    box.clickable = 1;
    box.role = "button";
    box.setFocusRing(box.style.focus.ringColor);
    // (the transitions: applyAnimated(); WHY not setMotion() here: its timer came after them and wrote over them)
    box.setMotionNow(STILL_MOTION);

    // GROUP: Layout (icon, label). iconPosition "top" puts the icon above the label.
    // WHY "100%" for a fixed size: the group fills the inside of the border; with the size of the box itself it was
    //     as big as the border box and its content sat 1 px too low (a border of 1 px)
    box.layout = AutoLayout({
        flow: (box.iconPosition === "top") ? "vertical" : "horizontal",
        width: (params.width === "auto") ? "auto" : "100%",
        height: (params.height === "auto") ? "auto" : "100%",
        position: "relative", // WHY: The box (width / height "auto") grows with it.
        ...box.style.layout,
    });

        // ICON: only when there is an icon file
        if (box.iconFile) {
            box.icon = Icon(0, 0, box.style.icon);
            box.icon.load(box.iconFile);
        }

        // LABEL: only when there is a text
        if (box.labelText) {
            box.label = Label(0, 0, box.style.label);
            box.label.text = box.labelText;
            box.label.css.whiteSpace = "nowrap";
        }

    endAutoLayout();

    // BOX: Waiting cover (over the content; hidden until setWaiting(1))
    box.waitingCover = startBox(0, 0, "100%", "100%", {
        color: box.style.waiting.color,
        clickable: 1, // WHY: it takes the mouse: the button under it gets no hover look while waiting
        cursor: "progress",
        css: { borderRadius: "inherit" },
    });
        if (box.waitingIconFile) {
            box.waitingCover.icon = Icon(0, 0, 0, 0);
            box.waitingCover.icon.load(box.waitingIconFile);
            if (box.style.waiting.invertIcon) box.waitingCover.icon.css = { filter: "invert(1)" };
        } else {
            box.waitingCover.icon = createWaitingRing();
        }
    endBox();
    box.waitingCover.visible = 0;

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        press(event);
    });

    // KEYBOARD: Enter / Space press it (Space: when the key goes up, like a real button)
    box.on("keydown", function (self, event) {
        if (event.key == "Enter") {
            event.preventDefault();
            if (event.repeat) return; // WHY: a held Enter must not pass an ask (two clicks) of a Dialog
            showRipple(null);
            press(event);
        }
        if (event.key == " ") {
            event.preventDefault(); // WHY: no page scroll
            isSpaceDown = 1;
        }
    });
    box.on("keyup", function (self, event) {
        if (event.key != " " || !isSpaceDown) return;
        isSpaceDown = 0;
        showRipple(null);
        press(event);
    });
    box.on("blur", function () {
        isSpaceDown = 0;
    });

    box.onResize(function () {
        if (box.waiting == 1) fitWaitingIcon();
    });

    // THE LOOK OF THE MOUSE: hover, pressed, back to normal (paint).
    box.onHoverChange(function (self, isOver) {
        isHover = isOver;
        if (!isOver) isPressed = 0;
        paint();
        paintMotion();
    });
    box.on("mousedown", function (self, event) {
        if (!canPress() || event.button !== 0) return; // WHY: a right click gives no click
        isPressed = 1;
        paint();
        paintMotion();
        showRipple(event);
    });
    box.on("mouseup", function () {
        isPressed = 0;
        paint();
        paintMotion();
    });

    paint();
    applyAnimated();

    if (box.waiting == 1) {
        box.waiting = 0;
        box.setWaiting(1);
    }

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// 1: a dark color (the light ring is seen on it). A color of the browser: "rgb(r, g, b)" or "rgba(r, g, b, a)".
// A transparent color is not dark (the page under it shows).
ButtonWithIcon.DARK_LIMIT = 0.45; // the brightness (0 - 1) under it a color is dark
ButtonWithIcon.isDarkColor = function (cssColor) {
    const text = String(cssColor).trim();
    const isSrgb = /^color\(srgb\s/.test(text);
    if (!isSrgb && !/^rgba?\(/.test(text)) return 0; // WHY: oklch(), lab()... are not read (0: not dark)
    // WHY the scale: color-mix() (Alpha(), UI.alpha) is computed as color(srgb 0.95 0.95 0.95 / 0.9), channels 0 - 1
    const channelScale = isSrgb ? 255 : 1;
    const parts = (isSrgb ? text.slice(11) : text).match(/[\d.]+/g);
    if (!parts || parts.length < 3) return 0;
    const alpha = (parts.length > 3) ? parseFloat(parts[3]) : 1;
    if (alpha < 0.5) return 0;
    for (let i = 0; i < 3; i++) parts[i] = parseFloat(parts[i]) * channelScale;
    // WHY these weights: the eye sees green brighter than red, and red brighter than blue
    const brightness = (0.299 * parts[0] + 0.587 * parts[1] + 0.114 * parts[2]) / 255;
    return (brightness < ButtonWithIcon.DARK_LIMIT) ? 1 : 0;
};

// The turn of the waiting ring (once for the page). No turn when the system asks for reduced motion: the ring stays.
ButtonWithIcon.injectCss = function () {
    basic.addCss("button-with-icon-css",
        "@keyframes button-with-icon-turn { to { transform: rotate(360deg); } }" +
        "@media (prefers-reduced-motion: reduce) { .button-with-icon-ring { animation: none !important; } }");
};
