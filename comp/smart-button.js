/* Bismillah */

/*

Smart Button - v26.10

THE DEFAULT BUTTON of new pages and projects (the user, 2026-10-30). It was ButtonWithIcon
(comp/button-with-icon.js) until 2026-10-30: renamed and moved to comp-m4.

THE MODEL PAGE (the user, 2026-11-03): 02-comp-examples/smart-button.htm. Its colors and packages are the defaults of
this file (the situations, the "icon" package, ozdenType1): new pages and projects take their buttons from it.
02-comp-examples/smart-button-alternatif.htm (pill, outlined, tones) is an alternative: not used unless asked.

- A button with an icon and a text (or only one of them); the icon on the left or on top (iconPosition).
- HEIGHT (2026-11-03, the user): 40 by default (ozdenType1 was 29 px with "auto"). "auto" (as high as the padding and
  the content) stays for classic (36), pill, pillSolid, outlined (52) and an icon on top. width: "auto" by default.
- STYLE PACKAGES (SmartButton.styles; sample 02-comp-examples/smart-button-3-ozden.htm; the draft
  _designs/smart-button.htm): "ozdenType1" (THE DEFAULT: SmartButtonDefaults.style): #E3E3E3, a thin dark edge and
  a darker line at the bottom; "ozdenType2": no bottom line; "ozdenType3": a faint edge; "ozdenType4": a ghost (no
  surface, no edge, only its hover is gray); "classic": the look of before 2026-10-30 (a white button, a bold 16 px
  text). A page gives its own color in style.box / hover / active.
  DARK (2026-10-31, the draft _designs/smart-button-dark.htm): "ozdenType1Dark" ... "ozdenType4Dark": the same shapes
  for a dark page (#2E2E2C, a light edge, a white text and icon, the dark waiting clock, yellow dots).
  SITUATIONS (2026-10-31, the draft _designs/smart-button-colors.htm): ozdenType1 in the color of a situation:
  "primary" #5BBAC1, "danger" #DE815B (2026-11-03, the user: the Upload of smart-button-3-ozden.htm; a dark text like
  the others, was #E8796D with a white text), "warning" #F1C74A, "success" #7BC362, "info" #52A8D0. The Dialog uses
  them for its button types.
  ICON (2026-11-03, the user: the trash of the Publish dialog, 02-comp-examples/dialog.htm): a white button of only an
  icon, a pink hover. styleName: "icon", width: 50, labelText: "", ariaLabel: "Delete".
  PILL AND OUTLINED (2026-11-02, the user; sample 02-comp-examples/smart-button-alternatif.htm): 52 px high with a 30 px icon.
  "pill": round, no edge, a bold text on a soft tint; "pillSolid": the full color with a white text; "outlined": a
  colored edge with a thicker line at the bottom. Without a tone they are gray.
- TONE (2026-11-02, the user): the shape comes from styleName, the color from tone: styleName: "outlined", tone: "blue".
  Any shape works with any name of SmartButton.TONES: gray, blue, green, purple, orange, red, yellow, teal, sky, navy,
  pink, primary, danger, warning, success, info. A new color is one new row there. The order: style > tone > package.
  ozdenType4 stays a ghost: its text and its hover take the color. setTone(name, styleName): after create (the look of
  the package again, then the tone; style given with params goes).
- KEYBOARD AND ACCESSIBILITY: role "button", Tab reaches it, Enter / Space press it (Space when it goes up), a focus
  ring only for the keyboard; ariaLabel for a button with only an icon (else labelText is read).
- setEnabled(0): no click, no hover, out of the Tab order (aria-disabled): a flat light gray button, a faint edge, no
  bottom line, the text and the icon faint gray (the same for every color; chosen on
  experimental/smart-button-bench.htm).
- ASK (two clicks): ask: "Click again to delete." -> the first click turns the button red (style.ask.button) and
  shows the text in a bubble over it (comp/tooltip.js, Tooltip.show(): it stays inside the screen; without
  tooltip.js only the red button); the second click runs onClick. It forgets after style.ask.time. One button asks
  at a time. setAsk(text), cancelAsk(), isAsking. onBeforeClick(self) returns false: no ask and no onClick (Ex: a
  form with an error must not ask "Sure?" first). press(): a press like a click (the ask too), Ex: Enter in a field.
- WAITING: setWaiting(1) while a job runs (a download, a save): the text and the icon fade and a small animation is
  in the middle; the button can not be clicked. waitingType: "clock" (the default: the clock of the waiting views
  with moving hands; waitingClock "ozden" or "ozdenDark") or "dots" (three dots one after the other).
  setWaiting(0) ends it (after delay ms, if given). Nothing turns with prefers-reduced-motion.
  (comp/loading-screen.js draws its clock and its dots with SmartButton.createClockSvg / createDots)
- MOTION: animated: 1 (default): pressed 0.94 and a little darker. ripple: 0 (default since 2026-11-03, the user;
  1 gives a wave from the pressed point, from the middle for the keyboard; its color fits the button). setAnimated(0/1), setRipple(0/1).
- setStyle(style): changes the look after create with only the keys it gets.

USAGE:
SmartButton({ labelText: "Send", iconFile: "../assets/icons/send.png", onClick: function (self) { } });
const btnDownload = SmartButton({ labelText: "Download", onClick: function (self) {
    self.setWaiting(1);
    download().then(function () { self.setWaiting(0); });
} });
SmartButton({ styleName: "ozdenType4", labelText: "Delete", ask: "Click again to delete.", onClick: deleteFile });
SmartButton({ styleName: "pill", tone: "green", labelText: "Accepted", iconFile: "check.svg" });
button.setTone("blue", "pillSolid"); // another color and shape after create
btnSave.setStyle({ box: { color: "#9DC7B5" }, hover: { color: "#91BCA9" }, active: { color: "#91BCA9" } });

Started Date: January 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SmartButtonDefaults = {
    key: "0",
    styleName: "ozdenType1", // SmartButton.styles: "ozdenType1" (the default), "ozdenType2", "ozdenType3", "ozdenType4", "classic", "icon", "pill", "pillSolid", "outlined"...
    tone: "", // the color: a name of SmartButton.TONES (Ex: "blue", "primary"). "": the colors of the package. setTone()
    width: "auto",
    height: 40, // (the user, 2026-11-03) "auto": as high as its padding and content. classic, pill, pillSolid, outlined and an icon on top are "auto"
    labelText: "Button",
    iconFile: "", // "": no icon (Ex: "../comp/smart-button/alert-black.png")
    iconPosition: "left", // "left", "top"
    enabled: 1, // 0: gray, can not be pressed (set later with setEnabled)
    ariaLabel: "", // "": labelText is read. A button with only an icon needs it (Ex: "Delete")
    waiting: 0, // 1: it waits (set later with setWaiting)
    waitingType: "clock", // "clock" (the default wait) or "dots"
    waitingClock: "ozden", // the look of the clock: "ozden" (a white face, dark lines) or "ozdenDark" (SmartButton.clocks)
    animated: 1, // 1: the press effect (smaller and darker while pressed). setAnimated()
    ripple: 0, // 1: a wave from the pressed point (it works with animated: 0 too). setRipple(). 0 since 2026-11-03 (the user)
    ask: "", // "Click again to delete.": two clicks (the first one asks with a red button and this text in a bubble). setAsk()
    onBeforeClick: null, // function (self): false stops the press, with no ask either
    onClick: function (self) { }, // Not called while waiting
    onWaitingEnd: function (self) { }, // The wait ended (setWaiting(0))
    style: { // ozdenType1 (the default package)
        layout: {
            gap: 8,
            padding: [16, 0],
            align: "center center",
            // px less space on the side of the icon (an icon left of a text): the empty edge in an icon file and its
            // thin lines made that side look wider (measured 1 - 3 px; the user, 2026-10-30). 0: the same on both sides
            iconSideTrim: 2,
        },
        icon: {
            width: 24,
            height: 24,
            opacity: 0.8,
            filter: "none", // a CSS filter: the dark packages turn the icon white ("brightness(0) invert(1)")
        },
        label: {
            fontSize: 20,
            textColor: Black(0.7),
            fontFamily: "opensans",
        },
        box: {
            color: "#E3E3E3",
            border: 1,
            borderColor: Black(0.35),
            round: 4,
            boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)",
        },
        hover: {
            color: "#D9D9D9",
        },
        active: {
            color: "#D9D9D9",
        },
        // ask: the red look of the button while it asks, and the bubble over it (Tooltip.BUBBLE_LOOK keys)
        ask: {
            button: {
                color: "#E8796D", // also under the mouse and pressed
                border: 1,
                borderColor: "#E8796D",
                boxShadow: "none",
                textColor: "white",
                iconFilter: "brightness(0) invert(1)", // the icon turns white, whatever color its file has
            },
            bubble: { color: "#E8796D", textColor: "white", fontSize: 13, bold: 1, round: 8, padding: [12, 7], border: 0, borderColor: "", shadow: "0 6px 16px rgba(0, 0, 0, 0.18)", arrow: 12, gap: 6, edge: 8, grow: 1 },
            time: 5000, // ms: it forgets the question
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.6)", // the ring of the keyboard focus
        },
        disabled: {
            color: "#EBEBEA",
            borderColor: "rgba(0, 0, 0, 0.1)",
            textColor: "rgba(0, 0, 0, 0.3)",
            iconOpacity: 0.25, // (and no color)
        },
        press: {
            scale: 0.94, // while pressed
            removeShadow: 0, // 1: while pressed the box shadow (Ex: the inset bottom line) goes away, as if pushed in
            brightness: 0.92, // while pressed
            time: 0.15, // s
        },
        ripple: {
            color: "", // "": light on a dark button, dark on a light one
            lightColor: White(0.45),
            darkColor: Black(0.12),
            time: 0.6, // s
        },
        waiting: {
            contentOpacity: 0.18, // the text and the icon while waiting
            clockSize: 30, // at most; a small button gets a smaller clock
            space: 14, // the room around the clock in a small button
            dots: { size: 6, gap: 4, color: "indianred" },
        },
    }
};

const SmartButton = function (params = {}) {

    // Merge params:
    SmartButton.applyTone(params);
    basic.applyStylePackage(params, SmartButton.styles, SmartButtonDefaults);
    // WHY: 40 is the height of a row; an icon above its text needs more (about 60)
    if (params.iconPosition === "top" && params.height === undefined) params.height = "auto";
    mergeIntoIfMissing(params, SmartButtonDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const WAITING_MOTION = "opacity 0.2s"; // the content fades while waiting
    const STILL_MOTION = "background-color 0.2s"; // the colors of hover / pressed (animated: 0 too)
    let cancelWaitingEnd = null;
    let cancelAskTimer = null;
    let askBubble = null;
    let isHover = 0;
    let isPressed = 0;
    let isSpaceDown = 0; // Space went down on this button (it presses when it goes up, like a real button)
    let wasAnimated = 0; // the press look was written (setAnimated(0) writes the still look back)

    // *** PRIVATE FUNCTIONS:

    const canPress = function () {
        return box.enabled == 1 && box.waiting != 1;
    };

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const isMotionOn = function () {
        return box.animated == 1 && !isReducedMotion();
    };

    // THE LOOK OF THE STATE: disabled > asking > pressed > under the mouse > normal
    const getBoxColor = function () {
        const _s = box.style;
        if (box.enabled != 1) return _s.disabled.color;
        if (box.isAsking == 1) return _s.ask.button.color;
        // WHY not while waiting: the button stays in its own color under the animation
        if (box.waiting == 1) return _s.box.color;
        if (isPressed) return _s.active.color;
        if (isHover) return _s.hover.color;
        return _s.box.color;
    };

    const getBorderColor = function () {
        if (box.enabled != 1) return box.style.disabled.borderColor;
        if (box.isAsking == 1) return box.style.ask.button.borderColor;
        return box.style.box.borderColor;
    };

    // WHY none when disabled: a flat button is not one that can be pressed in
    const getBoxShadow = function () {
        if (box.enabled != 1) return "none";
        if (box.isAsking == 1) return box.style.ask.button.boxShadow;
        if (isPressed && canPress() && box.style.press.removeShadow == 1) return "none";
        return box.style.box.boxShadow || "";
    };

    const getTextColor = function () {
        if (box.enabled != 1) return box.style.disabled.textColor;
        if (box.isAsking == 1) return box.style.ask.button.textColor;
        return box.style.label.textColor;
    };

    const getIconOpacity = function () {
        if (box.enabled != 1) return box.style.disabled.iconOpacity;
        return (box.style.icon.opacity === undefined) ? 1 : box.style.icon.opacity;
    };

    // The press: smaller and darker while pressed (only with animated: 1)
    const getPressCss = function () {
        const isPressedNow = isPressed && canPress() && isMotionOn();
        return {
            transform: isPressedNow ? "scale(" + box.style.press.scale + ")" : "none",
            filter: isPressedNow ? "brightness(" + box.style.press.brightness + ")" : "none",
        };
    };

    const getIconFilter = function () {
        if (box.isAsking == 1 && box.enabled == 1) return box.style.ask.button.iconFilter;
        return box.style.icon.filter || "none";
    };

    // Everything that changes with the state: the box, the content, the press, the keyboard and the screen reader
    const render = function () {
        const isEnabled = (box.enabled == 1);
        box.color = getBoxColor();
        box.border = (box.isAsking == 1) ? box.style.ask.button.border : box.style.box.border;
        box.borderColor = getBorderColor();
        box.css = Object.assign({ boxShadow: getBoxShadow() }, getPressCss());
        if (box.label) box.label.textColor = getTextColor();
        if (box.icon) {
            box.icon.opacity = getIconOpacity();
            box.icon.css = { filter: getIconFilter() };
        }
        box.layout.css = { filter: isEnabled ? "none" : "grayscale(1)" };
        box.layout.opacity = (box.waiting == 1) ? box.style.waiting.contentOpacity : 1;
        box.cursor = isEnabled ? "pointer" : "default";
        box.tabIndex = isEnabled ? 0 : -1;
        box.aria = { disabled: !isEnabled, label: box.ariaLabel || box.labelText || "" };
    };

    const press = function (event) {
        if (!canPress()) return;
        if (typeof box.onBeforeClick === "function" && box.onBeforeClick(box) === false) return;
        if (box.ask && box.isAsking != 1) {
            startAsk();
            return;
        }
        box.cancelAsk();
        if (box.onClick) box.onClick(box, event);
    };

    // *** ASK (two clicks): the red look (render) and the bubble (Tooltip.show)

    const startAsk = function () {
        // WHY one at a time: the bubble of another button would stay over this one
        const other = SmartButton.askingButton;
        if (other && other !== box) other.cancelAsk();
        SmartButton.askingButton = box;
        box.isAsking = 1;
        render();
        if (typeof Tooltip !== "undefined") askBubble = Tooltip.show(box, box.ask, box.style.ask.bubble);
        cancelAskTimer = box.after(box.style.ask.time, box.cancelAsk);
    };

    // *** THE RIPPLE (a wave from the pressed point)

    const getRippleColor = function () {
        const _r = box.style.ripple;
        if (_r.color) return _r.color;
        return SmartButton.isDarkColor(getComputedStyle(box.elem).backgroundColor) ? _r.lightColor : _r.darkColor;
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

    // A layer for a moment over the content; the mouse goes through it
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

    // *** WAITING

    // The press transitions, or the still look back (only when it was animated before)
    const applyAnimated = function () {
        if (!isMotionOn()) {
            if (!wasAnimated) return;
            wasAnimated = 0;
            render();
            box.setMotionNow(STILL_MOTION);
            return;
        }
        wasAnimated = 1;
        const time = box.style.press.time + "s";
        // WHY not setMotion(): it starts after a timer, and the press must answer the first click
        box.setMotionNow("transform " + time + ", filter " + time + ", box-shadow " + time + ", " + STILL_MOTION);
        render();
    };

    // The clock fits the button: at most its size, smaller in a small button (the dots keep their size)
    const fitWaitingIcon = function () {
        const icon = box.waitingCover.icon;
        if (box.waitingType == "clock") {
            const _w = box.style.waiting;
            const size = Math.max(0, Math.min(_w.clockSize, Math.min(box.width, box.height) - _w.space));
            icon.setSize(size, size);
        }
        icon.center();
    };

    const endWaiting = function () {
        box.waiting = 0;
        box.aria = { busy: false };
        box.waitingCover.visible = 0;
        render();
        box.onWaitingEnd(box);
    };

    // *** PUBLIC FUNCTIONS:

    box.isAsking = 0; // 1: the first click of ask was made, the button is red

    box.setText = function (text) {
        box.labelText = text;
        if (box.label) box.label.text = text;
        render(); // (the label read by a screen reader)
    };
    // USAGE: button.setText("Save")

    box.setIcon = function (file) {
        box.iconFile = file;
        if (box.icon) box.icon.load(file);
    };
    // USAGE: button.setIcon("../comp/smart-button/alert-black.png")

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
            box.cancelAsk();
            isHover = 0;
            isPressed = 0;
            isSpaceDown = 0;
        } else {
            isHover = box.elem.matches(":hover") ? 1 : 0; // WHY: the mouse may have stayed on it while it was off
        }
        render();
    };
    // USAGE: get: button.enabled, set: button.setEnabled(0)

    // Back to its own look, without onClick (the ask is forgotten)
    box.cancelAsk = function () {
        if (box.isAsking != 1) return;
        box.isAsking = 0;
        if (cancelAskTimer) cancelAskTimer();
        cancelAskTimer = null;
        if (askBubble) askBubble.remove();
        askBubble = null;
        if (SmartButton.askingButton === box) SmartButton.askingButton = null;
        render();
    };
    // USAGE: button.cancelAsk()

    box.setAsk = function (text) {
        box.ask = text || "";
        if (!box.ask) box.cancelAsk();
    };
    // USAGE: button.setAsk("Click again to delete."), button.setAsk("") (one click)

    // A press like a click: onBeforeClick, the ask, onClick (Ex: Enter in a field of a dialog)
    box.press = function () {
        press(null);
    };
    // USAGE: button.press()

    // WHY its own remove: the bubble is on the page and SmartButton.askingButton is static
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        box.cancelAsk();
        superRemove.call(box);
    };

    // Only the given keys change; the other keys of the style stay.
    // WHY a new object for each part: the old one can be shared with other buttons (the same style object of a page)
    box.setStyle = function (style) {
        Object.keys(style || {}).forEach(function (part) {
            box.style[part] = Object.assign({}, box.style[part], style[part]);
        });
        applyStyle();
    };
    // USAGE: button.setStyle({ box: { color: "tomato", borderColor: "red" }, hover: { color: "tomato" } })

    box.setTone = function (toneName, styleName) {
        box.styleName = styleName || box.styleName;
        box.setStyle(SmartButton.getPackageStyle(box.styleName));
        box.tone = toneName;
        if (toneName) box.setStyle(SmartButton.getToneStyle(toneName, box.styleName));
    };
    // USAGE: button.setTone("blue"), button.setTone("blue", "pillSolid"), button.setTone("", "pill") (only the package)

    // The style on the objects (box, layout, icon, label, focus ring); render() gives the colors of the state.
    // The side of the icon a little narrower (style.layout.iconSideTrim), only for an icon left of a text
    const paintIconSide = function () {
        const _l = box.style.layout;
        const isIconLeft = box.icon && box.label && box.iconPosition !== "top";
        const padding = Array.isArray(_l.padding) ? _l.padding[0] : _l.padding;
        const trim = isIconLeft ? (Number(_l.iconSideTrim) || 0) : 0;
        box.layout.css = { paddingLeft: Math.max(0, padding - trim) + "px" };
    };

    const applyStyle = function () {
        const _s = box.style;
        box.props(_s.box);
        box.layout.props(_s.layout);
        paintIconSide();
        if (box.icon) box.icon.props(_s.icon);
        if (box.label) box.label.props(_s.label);
        box.setFocusRing(_s.focus.ringColor);
        render();
    };

    // delay: ms before the wait ends (only for 0)
    box.setWaiting = function (value, delay = 0) {
        const isWaiting = basic.isOn(value) ? 1 : 0;
        if (cancelWaitingEnd) cancelWaitingEnd();
        cancelWaitingEnd = null;
        if (isWaiting) {
            box.cancelAsk();
            box.waiting = 1;
            box.aria = { busy: true };
            box.waitingCover.visible = 1;
            fitWaitingIcon();
            render();
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

    // *** OBJECT VIEW:

    // BOX: Container look
    box.props(box.style.box);
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
    box.layout.setMotionNow(WAITING_MOTION);
    paintIconSide();

    // BOX: Waiting cover (clear: the content fades under it; it holds the animation and takes the mouse)
    box.waitingCover = startBox(0, 0, "100%", "100%", {
        color: "transparent",
        clickable: 1, // WHY: the button under it gets no hover look while waiting
        cursor: "progress",
    });
        if (box.waitingType == "dots") {
            box.waitingCover.icon = SmartButton.createDots(box.style.waiting.dots);
        } else {
            const clock = Box(0, 0, 0, 0, { color: "transparent" });
            clock.elem.innerHTML = SmartButton.createClockSvg(SmartButton.clocks[box.waitingClock] || SmartButton.clocks.ozden);
            box.waitingCover.icon = clock;
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
            if (event.repeat) return; // WHY: a held Enter must not pass an ask (two clicks)
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

    // THE MOUSE: hover, pressed, back to normal (render)
    box.onHoverChange(function (self, isOver) {
        isHover = isOver;
        if (!isOver) isPressed = 0;
        render();
    });
    box.on("mousedown", function (self, event) {
        if (!canPress() || event.button !== 0) return; // WHY: a right click gives no click
        isPressed = 1;
        render();
        showRipple(event);
    });
    box.on("mouseup", function () {
        isPressed = 0;
        render();
    });

    applyAnimated();
    render();

    if (box.waiting == 1) {
        box.waiting = 0;
        box.setWaiting(1);
    }

    return endObject(box);

};

// *** STATIC FUNCTIONS:

SmartButton.askingButton = null; // the button that asks now (ask: one at a time)

// 1: a dark color (the ripple is light on it). A color of the browser: "rgb(r, g, b)" or "rgba(r, g, b, a)".
// A transparent color is not dark (the page under it shows).
SmartButton.DARK_LIMIT = 0.45; // the brightness (0 - 1) under it a color is dark
SmartButton.isDarkColor = function (cssColor) {
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
    return (brightness < SmartButton.DARK_LIMIT) ? 1 : 0;
};

// The turns of the clock and the dots (once for the page). Nothing moves with reduced motion.
SmartButton.injectCss = function () {
    basic.addCss("smart-button-css",
        "@keyframes smart-button-turn { to { transform: rotate(360deg); } }" +
        "@keyframes smart-button-dot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; } 40% { transform: scale(1); opacity: 1; } }" +
        // WHY view-box: a hand of the clock turns around the middle of the clock, not around its own box
        ".smart-button-hand { transform-box: view-box; transform-origin: 50% 50%; animation-name: smart-button-turn;" +
        " animation-timing-function: linear; animation-iteration-count: infinite; }" +
        "@media (prefers-reduced-motion: reduce) { .smart-button-hand, .smart-button-dot { animation: none !important; } }");
};

// *** THE STYLE PACKAGES (the user, 2026-10-30): the buttons of 02-comp-examples/smart-button-3-ozden.htm.
// A package needs only the keys that differ from the default (ozdenType1).
SmartButton.styles = {
    ozdenType1: SmartButtonDefaults.style, // an edge and a bottom line
    ozdenType2: { box: { boxShadow: "none" } }, // only the edge
    ozdenType3: { box: { borderColor: Black(0.1), boxShadow: "none" } }, // a faint edge
    ozdenType4: { box: { color: White(0), border: 0, borderColor: "transparent", boxShadow: "none" } }, // a ghost
    classic: { // the look of before 2026-10-30
        style: {
            layout: { gap: 8, padding: [12, 6] },
            icon: { opacity: 1 },
            label: { fontSize: 16, textColor: Black(0.8), fontFamily: "opensans-bold" },
            box: { color: White(1), border: 1, borderColor: Black(0.2), round: 6, boxShadow: "none" },
            hover: { color: "#f5f5f5" },
            active: { color: "#e0e0e0" },
        },
        height: "auto", // WHY: as before 2026-11-03 (36 px; the old pages have buttons of two lines too)
    },
};

// THE DARK PACKAGES (2026-10-31, the draft _designs/smart-button-dark.htm): the shapes of ozdenType1-4 with the
// colors of a dark page (the cards of Ozden Panel / Ozden Manager, #1A1A19). The icon turns white, the waiting clock
// is the dark one, the dots yellow; the ask stays red. Packages of params (a "style" key): waitingClock is a param.
SmartButton.createDarkPackage = function (box, hoverColor) {
    return {
        style: {
            box: box,
            hover: { color: hoverColor },
            active: { color: hoverColor },
            label: { textColor: White(0.85) },
            icon: { opacity: 0.85, filter: "brightness(0) invert(1)" },
            focus: { ringColor: "rgba(101, 162, 147, 0.75)" },
            disabled: { color: "#232322", borderColor: White(0.06), textColor: White(0.28), iconOpacity: 0.25 },
            press: { brightness: 0.88 },
            waiting: { dots: { color: "#F1C74A" } },
        },
        waitingClock: "ozdenDark",
    };
};
SmartButton.styles.ozdenType1Dark = SmartButton.createDarkPackage({ color: "#2E2E2C", borderColor: White(0.16), boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.45)" }, "#383835"); // an edge and a bottom line
SmartButton.styles.ozdenType2Dark = SmartButton.createDarkPackage({ color: "#2E2E2C", borderColor: White(0.16), boxShadow: "none" }, "#383835"); // only the edge
SmartButton.styles.ozdenType3Dark = SmartButton.createDarkPackage({ color: "#2E2E2C", borderColor: White(0.06), boxShadow: "none" }, "#383835"); // a faint edge
SmartButton.styles.ozdenType4Dark = SmartButton.createDarkPackage({ color: White(0), border: 0, borderColor: "transparent", boxShadow: "none" }, White(0.08)); // a ghost

// *** THE TONES AND THE SHAPES (2026-11-02, the user): the color of a button is apart from its shape.
// color: the strong color; solidHover: its hover; onColor: the text on it (default white); tint / hover: the soft
// surface; deep: the text of outlined; pillText: the text of pill (default color); light: the light part of a
// two-tone icon. A new color is one new row.
SmartButton.ON_COLOR_TEXT = Black(0.75); // the dark text on a light full color
SmartButton.TONES = {
    gray: { color: "#6E6F74", deep: "#3A3A3A", tint: "#F0F0F0", hover: "#E6E6E6", solidHover: "#5F6065", light: "#C4C5C9", pillText: "#3A3A3A" },
    blue: { color: "#2F6FED", deep: "#2563D8", tint: "#E4EDFD", hover: "#D8E5FC", solidHover: "#2563D8", light: "#93B7F7" },
    green: { color: "#3F9A6C", deep: "#2F8259", tint: "#E6F5EE", hover: "#D9EFE4", solidHover: "#358A5E", light: "#9FD6BC" },
    purple: { color: "#8B5CF0", deep: "#7C4FE0", tint: "#EFE9FD", hover: "#E6DDFC", solidHover: "#7C4FE0", light: "#C9B4F7" },
    orange: { color: "#F28C33", deep: "#B8651E", tint: "#FDF1E3", hover: "#FCE8D2", solidHover: "#E57E25", light: "#F7C393" },
    red: { color: "#E5564A", deep: "#C8443A", tint: "#FDECEA", hover: "#FBDFDC", solidHover: "#D84A3E", light: "#F4B1AB" },
    yellow: { color: "#D9A400", deep: "#8F6B00", tint: "#FFF7DB", hover: "#FFF0C2", solidHover: "#C99700", light: "#F5DC8A", pillText: "#B88A00" },
    teal: { color: "#0E9A9A", deep: "#0B7F7F", tint: "#E4F5F5", hover: "#D6EEEE", solidHover: "#0B8C8C", light: "#92D6D6" },
    sky: { color: "#4FB5D4", deep: "#2A7C93", tint: "#E3F7FB", hover: "#D5F2F8", solidHover: "#3FA6C6", light: "#A5DEEC", pillText: "#2E8BC0" },
    navy: { color: "#2A3A8C", deep: "#1C2A78", tint: "#DFE3EF", hover: "#D3D8E9", solidHover: "#1C2A78", light: "#8F9AC6" },
    pink: { color: "#E8457C", deep: "#C93668", tint: "#FDE8EF", hover: "#FBDBE6", solidHover: "#DC3A70", light: "#F5AFC7" },
    // The situations (2026-10-31, chosen by the user on the draft _designs/smart-button-colors.htm)
    primary: { color: "#5BBAC1", solidHover: "#50AEB5", onColor: SmartButton.ON_COLOR_TEXT, deep: "#2F8088", tint: "#E6F5F6", hover: "#D9EFF1", light: "#ADDDE0", pillText: "#2F8088" }, // the main action: Save, Send
    danger: { color: "#DE815B", solidHover: "#D4724B", onColor: SmartButton.ON_COLOR_TEXT, deep: "#C4574C", tint: "#FDECEA", hover: "#FBDFDC", light: "#F4BDB6", pillText: "#C4574C" }, // a delete, a reject
    warning: { color: "#F1C74A", solidHover: "#E6BB3C", onColor: SmartButton.ON_COLOR_TEXT, deep: "#8F6B00", tint: "#FFF7DB", hover: "#FFF0C2", light: "#F7E2A0", pillText: "#B88A00" }, // go on, but look first
    success: { color: "#7BC362", solidHover: "#70B756", onColor: SmartButton.ON_COLOR_TEXT, deep: "#4A8A35", tint: "#EDF7E8", hover: "#E1F1DA", light: "#BDE0AF", pillText: "#4F9A38" }, // after a good result: Done
    info: { color: "#52A8D0", solidHover: "#479CC4", onColor: SmartButton.ON_COLOR_TEXT, deep: "#2F7DA3", tint: "#E6F3F9", hover: "#D9ECF5", light: "#A6D2E7", pillText: "#2F7DA3" }, // Details, Help
};

// The colors of a tone on each shape; "filled" is the look of every other shape.
SmartButton.toneLooks = {
    filled: function (tone) {
        const textColor = tone.onColor || "white";
        const isWhiteText = (textColor == "white");
        return {
            box: { color: tone.color },
            hover: { color: tone.solidHover },
            active: { color: tone.solidHover },
            label: { textColor: textColor },
            icon: { opacity: isWhiteText ? 1 : 0.8, filter: isWhiteText ? "brightness(0) invert(1)" : "none" },
        };
    },
    ozdenType4: function (tone) {
        return {
            hover: { color: tone.tint },
            active: { color: tone.tint },
            label: { textColor: tone.deep },
        };
    },
    pill: function (tone) {
        return {
            box: { color: tone.tint },
            hover: { color: tone.hover },
            active: { color: tone.hover },
            label: { textColor: tone.pillText || tone.color },
        };
    },
    pillSolid: function (tone) {
        return {
            box: { color: tone.color },
            hover: { color: tone.solidHover },
            active: { color: tone.solidHover },
            label: { textColor: tone.onColor || "white" },
        };
    },
    outlined: function (tone) {
        return {
            box: { color: tone.tint, borderColor: tone.color, boxShadow: "inset 0 -" + SmartButton.EDGE_WIDTH + "px 0 " + tone.color },
            hover: { color: tone.hover },
            active: { color: tone.hover },
            label: { textColor: tone.deep },
        };
    },
};

SmartButton.getToneStyle = function (toneName, styleName) {
    const tone = SmartButton.TONES[toneName];
    if (!tone) {
        console.warn("SmartButton: tone not found: " + toneName);
        return {};
    }
    const createLook = SmartButton.toneLooks[styleName] || SmartButton.toneLooks.filled;
    return createLook(tone);
};

// The whole look of a package: its keys, then the defaults (a package has only the keys that differ).
SmartButton.getPackageStyle = function (styleName) {
    const stylePackage = SmartButton.styles[styleName] || {};
    const packageStyle = {};
    mergeIntoIfMissing(packageStyle, stylePackage.style || stylePackage);
    mergeIntoIfMissing(packageStyle, SmartButtonDefaults.style);
    return packageStyle;
};

// The tone goes under params.style, so a key the page gives still wins. WHY a new object: params.style can be a package.
SmartButton.applyTone = function (params) {
    if (!params.tone) return;
    const styleName = params.styleName || SmartButtonDefaults.styleName;
    const ownStyle = {};
    mergeIntoIfMissing(ownStyle, params.style || {});
    mergeIntoIfMissing(ownStyle, SmartButton.getToneStyle(params.tone, styleName));
    params.style = ownStyle;
};

// THE SITUATION PACKAGES: ozdenType1 (an edge and a bottom line) in the color of a situation.
["primary", "danger", "warning", "success", "info"].forEach(function (toneName) {
    SmartButton.styles[toneName] = SmartButton.toneLooks.filled(SmartButton.TONES[toneName]);
});

// THE ICON PACKAGE (2026-11-03, the user): the trash of the Publish dialog of 02-comp-examples/dialog.htm. A white
// ozdenType2 with no side room (WHY padding 0: with 16 px at each side the icon of a 50 px button was 18 px).
SmartButton.styles.icon = {
    layout: { gap: 0, padding: [0, 0] },
    box: { color: "white", boxShadow: "none" },
    hover: { color: "#FDF1EF" },
    active: { color: "#FDF1EF" },
    icon: { opacity: 1 },
};

// THE PILL AND OUTLINED SHAPES (the user: the buttons of 02-comp-examples/smart-button-alternatif.htm): gray without a tone.
SmartButton.PILL_ROUND = 100; // always round, at any height
SmartButton.EDGE_WIDTH = 2; // outlined: the edge and the bottom line on it

SmartButton.PILL_SHAPE = {
    layout: { gap: 12, padding: [22, 11] },
    icon: { width: 30, height: 30, opacity: 1 },
    label: { fontFamily: "opensans-bold" },
    box: { border: 0, borderColor: "transparent", round: SmartButton.PILL_ROUND, boxShadow: "none" },
};
SmartButton.OUTLINED_SHAPE = {
    layout: { gap: 8, padding: [16, 9] },
    icon: { width: 30, height: 30, opacity: 1 },
    label: { fontFamily: "opensans" },
    box: { border: SmartButton.EDGE_WIDTH, round: SmartButton.PILL_ROUND },
};
// WHY height "auto": a shape is as high as its padding and its 30 px icon (52 px), not the default 40
SmartButton.createShapePackage = function (shape, look) {
    const shapeStyle = {};
    mergeIntoIfMissing(shapeStyle, look);
    mergeIntoIfMissing(shapeStyle, shape);
    return { style: shapeStyle, height: "auto" };
};
SmartButton.styles.pill = SmartButton.createShapePackage(SmartButton.PILL_SHAPE, SmartButton.toneLooks.pill(SmartButton.TONES.gray));
SmartButton.styles.pillSolid = SmartButton.createShapePackage(SmartButton.PILL_SHAPE, SmartButton.toneLooks.pillSolid(SmartButton.TONES.gray));
SmartButton.styles.outlined = SmartButton.createShapePackage(SmartButton.OUTLINED_SHAPE, SmartButton.toneLooks.outlined(SmartButton.TONES.gray));

// *** THE WAITING DRAWINGS: the clock and the dots (comp/loading-screen.js uses them too)

// The clocks of the waiting views with moving hands (the user, 2026-10-29). The sizes are px on a 30 px clock.
SmartButton.clocks = {
    ozden: { // a white face, dark lines
        faceColor: "#FFFFFF",
        lineColor: "#141414", // the edge (and the hour hand, when there is no hourColor)
        edgeWidth: 2,
        hourWidth: 2, // the short hand
        hourLength: 7.5, // from the middle
        minuteWidth: 2, // the long hand
        minuteLength: 10,
        minuteColor: "indianred",
        centerColor: "indianred", // the dot in the middle: it hides where the hands meet
        centerSize: 4,
        minuteTurn: 1.6, // seconds for one turn of the minute hand
        hourTurn: 19.2, // seconds for one turn of the hour hand (12 x minuteTurn: a real clock)
    },
};
// a dark face, light lines; WHY yellow (the user, 2026-10-29): indianred was weak on the dark face (contrast 3.6,
// #F1C74A 8.9); the hour hand is dimmer, so the yellow minute hand leads (as the red one on the light clock)
SmartButton.clocks.ozdenDark = Object.assign({}, SmartButton.clocks.ozden, {
    faceColor: "#2A2A2A",
    lineColor: "rgba(255, 255, 255, 0.9)",
    hourColor: "rgba(255, 255, 255, 0.6)",
    minuteColor: "#F1C74A",
    centerColor: "#F1C74A",
});

// The clock as an SVG text (as wide as its box): a face with an edge, the minute hand up, the hour hand to the right.
SmartButton.CLOCK_SIZE = 30; // the px of the drawing
SmartButton.createClockSvg = function (clockStyle) {
    SmartButton.injectCss();
    const c = clockStyle;
    const size = SmartButton.CLOCK_SIZE;
    const middle = size / 2;
    const faceRadius = middle - c.edgeWidth / 2; // WHY: the edge is drawn on the circle line: it stays inside
    const hand = function (x2, y2, width, color, turnTime) {
        return '<line class="smart-button-hand" x1="' + middle + '" y1="' + middle + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color +
            '" stroke-width="' + width + '" stroke-linecap="round" style="animation-duration: ' + turnTime + 's"/>';
    };
    return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" height="100%" aria-hidden="true" style="display: block">' +
        '<circle cx="' + middle + '" cy="' + middle + '" r="' + faceRadius + '" fill="' + c.faceColor + '" stroke="' + c.lineColor + '" stroke-width="' + c.edgeWidth + '"/>' +
        hand(middle + c.hourLength, middle, c.hourWidth, c.hourColor || c.lineColor, c.hourTurn) + // the hour hand (under)
        hand(middle, middle - c.minuteLength, c.minuteWidth, c.minuteColor, c.minuteTurn) + // the minute hand
        '<circle cx="' + middle + '" cy="' + middle + '" r="' + (c.centerSize / 2) + '" fill="' + c.centerColor + '"/>' +
        "</svg>";
};

// GROUP: Three dots that grow one after the other. dots: { size, gap, color }
SmartButton.DOT_COUNT = 3;
SmartButton.DOT_TIME = 1.2; // seconds for one bounce of a dot
SmartButton.DOT_DELAY = 0.16; // seconds between two dots
SmartButton.createDots = function (dots) {
    SmartButton.injectCss();
    const group = HGroup({ hug: 1, align: "center center", gap: dots.gap });
        for (let i = 0; i < SmartButton.DOT_COUNT; i++) {
            const dot = Box({ width: dots.size, height: dots.size, color: dots.color, round: 100 });
            dot.elem.classList.add("smart-button-dot");
            dot.css = { animation: "smart-button-dot " + SmartButton.DOT_TIME + "s ease-in-out " + (i * SmartButton.DOT_DELAY) + "s infinite" };
        }
    endGroup();
    return group;
};
