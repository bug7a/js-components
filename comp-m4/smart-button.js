/* Bismillah */

/*

Smart Button - v26.10 (SmartButton; named ButtonWithIcon, comp-m3/button-with-icon.js, until 2026-10-30: renamed and
moved to comp-m4)

THE DEFAULT BUTTON of new pages and projects (the user, 2026-10-30).
- A customizable button with an icon and text.
- Supports icon positioning (left/top). No iconFile: a button with only its text.
- KEYBOARD AND ACCESSIBILITY (2026-10-29): role "button", Tab reaches it, Enter / Space press it, a focus ring only
  for the keyboard (setFocusRing); ariaLabel for a button with only an icon (else labelText is read).
- setEnabled(0): no click, no hover, out of the Tab order (aria-disabled). THE LOOK (the user, 2026-10-29, chosen
  on experimental/smart-button-bench.htm, "D2"): a flat light gray button, a faint edge, no bottom line, the text
  and the icon faint gray, the same for every color; style.disabled.look "faint" gives the old look (its own colors
  at opacity 0.45).
- ASK (two clicks, the user, 2026-10-30; it was in comp-m4/dialog.js and the ozden sample): ask: "Click again to
  delete." -> the first click turns the button red (style.ask.button) and shows the text in a red bubble over it; the
  second one runs onClick. It forgets after style.ask.time. The bubble stays inside askIn (Ex: the card of a dialog;
  null: the page). One button asks at a time. setAsk(text), cancelAsk(), isAsking. asking: 1 starts in the ask
  state and keeps it (no timer, not one at a time) until a click: for a design page of the ask look.
  onBeforeClick(self) returns false: no ask and no onClick (Ex: a form with an error must not ask "Sure?" first).
  press(): a press like a click (the ask too), Ex: Enter in a field.
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
- THE WAITING CLOCK (the user, 2026-10-29: the default wait): the cover shows the clock of the waiting views with
  moving hands (a white face, dark lines, an indianred minute hand and dot; at most 30 px, smaller in a small
  button). waitingClock: "ozden" (default) or "ozdenDark" (a dark face, light lines, a yellow minute hand). waitingType: "ring" gives the
  turning ring of before; waitingIconFile an image. No turn with prefers-reduced-motion.
  THE COVER OF THE CLOCK (the user, 2026-10-29, bench "W3"): no cover; the text and the icon fade (18%) and the
  clock is clear in the middle of the button, in its own color. style.waiting.cover "color" gives the cover of before
  (dark, or the button's own color on a dark button); the ring and an image always use that cover (light on dark).
  (comp-m4/loading-screen.js has the same clocks, LoadingScreen.clocks: keep them alike)
- STYLE PACKAGES (the user, 2026-10-30, SmartButton.styles; sample 02-comp-m4-samples/smart-button-3-ozden.htm):
  the ozden buttons, #E3E3E3 (give your own color in style.box / hover / active; the sample page has colors to
  choose from): "ozdenType1" (THE DEFAULT): a thin dark edge and a darker line at the bottom (Primary / Secondary),
  "ozdenType2": the same edge, no bottom line, "ozdenType3": a faint edge, "ozdenType4": a ghost button, no surface
  and no edge (only its hover is gray). "classic": the look of before 2026-10-30 (a white button, a bold 16 px text);
  the pages made before keep it with styleName: "classic".

USAGE:
SmartButton({
    labelText: "Alert",
    iconFile: "../comp-m4/smart-button/alert-black.png",
    iconPosition: "top",
    onClick: function (self) { self.setText("Clicked"); },
});
const btnDownload = SmartButton({ labelText: "Download", onClick: function (self) {
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
const SmartButtonDefaults = {
    key: "0",
    styleName: "ozdenType1", // SmartButton.styles: "ozdenType1" (the default since 2026-10-30), "ozdenType2", "ozdenType3", "ozdenType4", "classic"
    width: "auto",
    height: "auto",
    labelText: "Button",
    iconFile: "", // "": no icon (Ex: "../comp-m4/smart-button/alert-black.png")
    iconPosition: "left", // "left", "top"
    enabled: 1, // 0: gray, can not be pressed (set later with setEnabled)
    ariaLabel: "", // "": labelText is read. A button with only an icon needs it (Ex: "Delete")
    waiting: 0, // 1: the waiting cover is over the button (set later with setWaiting)
    // (a TRIAL, the user, 2026-10-29: both on for now; later animated 0 by default and 1 in the new style packages)
    animated: 1, // 1: the press effect (brighter under the mouse, smaller and darker while pressed). setAnimated()
    ripple: 1, // 1: a wave from the pressed point (it works with animated: 0 too). setRipple()
    waitingType: "clock", // "clock": the waiting clock (the default wait, the user 2026-10-29), "ring": a turning ring
    waitingClock: "ozden", // the look of the clock: "ozden" (a white face, dark lines) or "ozdenDark" (SmartButton.clocks)
    waitingIconFile: "", // an image in place of the clock / ring (Ex: "../comp-m4/smart-button/clock.png")
    ask: "", // "Click again to delete.": two clicks (the first one asks with a red button and this text in a bubble). setAsk()
    asking: 0, // 1: it starts asking (with ask: red, the bubble) and stays so until a click (Ex: a design page of the look)
    askIn: null, // the box the bubble of ask stays inside (Ex: the card of a dialog); null: the page
    onBeforeClick: null, // function (self): false stops the press, with no ask either
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
        // ask: the red look of the button while it asks, and the bubble over it
        ask: {
            // (the icon turns white on the red button, whatever color its file has)
            button: {
                box: { color: "#E8796D", border: 1, borderColor: "#E8796D", boxShadow: "none" },
                hover: { color: "#E8796D" },
                active: { color: "#E8796D" },
                icon: { css: { filter: "brightness(0) invert(1)" } },
                label: { textColor: "white" },
            },
            bubble: { color: "#E8796D", textColor: "white", fontSize: 13, round: 8, padding: [12, 7], arrow: 12, gap: 6, edge: 8, zIndex: 5000 },
            time: 5000, // ms: it forgets the question
        },
        focus: {
            ringColor: "rgba(95, 158, 160, 0.6)", // the ring of the keyboard focus
        },
        disabled: {
            look: "flat", // "flat": a light gray button (the user, 2026-10-29); "faint": its own colors at "opacity"
            color: "#EBEBEA",
            borderColor: "rgba(0, 0, 0, 0.1)",
            textColor: "rgba(0, 0, 0, 0.3)",
            iconOpacity: 0.25, // (and no color)
            opacity: 0.45, // look "faint"
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
            cover: "none", // the clock: "none": no cover, the content fades (the user, 2026-10-29); "color": a cover
            contentOpacity: 0.18, // cover "none": the text and the icon while waiting
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
            clockSize: 30, // at most; a small button gets a smaller clock
            iconSize: 50, // waitingIconFile: at most; a small button gets a smaller icon
            iconSpace: 14, // the room around the ring / icon in a small button
            invertIcon: 0, // 1: the icon is drawn light (on a light cover)
        },
    }
};

const SmartButton = function (params = {}) {

    // Merge params:
    basic.applyStylePackage(params, SmartButton.styles, SmartButtonDefaults);
    mergeIntoIfMissing(params, SmartButtonDefaults);

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
    // A disabled button in the flat gray look (style.disabled.look)
    const isFlatDisabled = function () {
        return box.enabled != 1 && box.style.disabled.look != "faint";
    };

    // The clock with no cover: the content fades (style.waiting.cover). The ring and an image keep the cover.
    const isCoverless = function () {
        return box.style.waiting.cover == "none" && box.waitingType != "ring" && !box.waitingIconFile;
    };

    // The text and the icon: faint gray when flat disabled, faded while waiting with no cover
    const paintContent = function () {
        const _s = box.style;
        const isFlat = isFlatDisabled();
        if (box.label) box.label.textColor = isFlat ? _s.disabled.textColor : _s.label.textColor;
        if (box.icon) box.icon.opacity = isFlat ? _s.disabled.iconOpacity : ((_s.icon.opacity === undefined) ? 1 : _s.icon.opacity);
        box.layout.css.filter = isFlat ? "grayscale(1)" : "none";
        box.layout.opacity = (box.waiting == 1 && isCoverless()) ? _s.waiting.contentOpacity : 1;
    };

    const paint = function () {
        const isEnabled = (box.enabled == 1);
        const isFlat = isFlatDisabled();
        let color = box.style.box.color;
        // WHY not while waiting: the cover takes its color from the button (fitDarkButton), it must stay the same
        const canShowState = isEnabled && box.waiting != 1;
        if (canShowState && isPressed) color = box.style.active.color;
        else if (canShowState && isHover) color = box.style.hover.color;
        box.color = isFlat ? box.style.disabled.color : color;
        box.borderColor = isFlat ? box.style.disabled.borderColor : box.style.box.borderColor;
        // WHY no bottom line: a flat button is not one that can be pressed in (paintMotion writes it while animated)
        box.css.boxShadow = isFlat ? "none" : (box.style.box.boxShadow || "");
        box.opacity = (isEnabled || isFlat) ? 1 : box.style.disabled.opacity;
        paintContent();
        box.cursor = isEnabled ? "pointer" : "default";
        box.tabIndex = isEnabled ? 0 : -1;
        box.aria = { disabled: !isEnabled, label: box.ariaLabel || box.labelText || "" };
    };

    const press = function (event) {
        if (!canPress()) return;
        if (typeof box.onBeforeClick === "function" && box.onBeforeClick(box) === false) return;
        if (box.ask && !box.isAsking) {
            startAsk();
            return;
        }
        box.cancelAsk();
        if (box.onClick) box.onClick(box, event);
    };

    // *** ASK (two clicks): the red look and the bubble

    let lookBeforeAsk = null; // the parts of the style that the ask look changes
    let cancelAskTimer = null;
    let askBubble = null;

    // isStill: it stays (asking: 1): no timer, and the other asking buttons stay too
    const startAsk = function (isStill = 0) {
        // WHY one at a time: the bubble of another button would stay over this one
        const other = SmartButton.askingButton;
        if (!isStill && other && other !== box) other.cancelAsk();
        if (!isStill) SmartButton.askingButton = box;
        box.isAsking = 1;
        lookBeforeAsk = {};
        Object.keys(box.style.ask.button).forEach(function (part) {
            lookBeforeAsk[part] = box.style[part];
        });
        box.setStyle(box.style.ask.button);
        showAskBubble();
        if (!isStill) cancelAskTimer = box.after(box.style.ask.time, box.cancelAsk);
    };

    // GROUP: A red bubble with a triangle under it that points at the button; it grows out of the point of the
    // triangle. It stays inside askIn (else the page); the triangle stays over the button.
    const showAskBubble = function () {
        const _b = box.style.ask.bubble;
        const holder = box.askIn || page;
        hideAskBubble();
        askBubble = createIn(holder, function () {
            const bubble = VGroup({ hug: 1, align: "center top", gap: 0, position: "absolute", clipContent: 0, zIndex: _b.zIndex, role: "status" });
                Label({ plainText: box.ask, fontSize: _b.fontSize, bold: 1, textColor: _b.textColor, color: _b.color, round: _b.round, padding: _b.padding, boxShadow: "0 6px 16px rgba(0, 0, 0, 0.18)", css: { whiteSpace: "nowrap" } });
                // BOX: Triangle (a turned square under the label)
                bubble.arrow = Box({ width: _b.arrow, height: _b.arrow, color: _b.color });
            endGroup();
            return bubble;
        });
        placeAskBubble(holder);
        growAskBubble();
    };

    // WHY the scale: page.fit() zooms the page with a transform; getBoundingClientRect() is in screen pixels.
    // WHY clientLeft / clientTop: an absolute object starts inside the border of its box.
    const placeAskBubble = function (holder) {
        const _b = box.style.ask.bubble;
        const holderElem = holder.elem;
        const holderRect = holderElem.getBoundingClientRect();
        const buttonRect = box.elem.getBoundingClientRect();
        const scale = holderRect.width / holderElem.offsetWidth || 1;
        const buttonCenter = (buttonRect.left + buttonRect.width / 2 - holderRect.left) / scale - holderElem.clientLeft;
        const buttonTop = (buttonRect.top - holderRect.top) / scale - holderElem.clientTop;
        const width = askBubble.elem.offsetWidth;
        // (rounded first: the triangle is shifted from the place the bubble really gets)
        const left = Math.round(Math.max(_b.edge, Math.min(holderElem.clientWidth - width - _b.edge, buttonCenter - width / 2)));
        const arrowShift = buttonCenter - (left + width / 2);
        askBubble.left = left;
        askBubble.top = Math.round(buttonTop - askBubble.elem.offsetHeight + _b.arrow / 2 - _b.gap);
        askBubble.arrow.css = { transform: "translate(" + arrowShift + "px, -" + (_b.arrow / 2) + "px) rotate(45deg)" };
        askBubble.css = { transformOrigin: (width / 2 + arrowShift) + "px 100%" };
    };

    const growAskBubble = function () {
        if (isReducedMotion()) return;
        askBubble.opacity = 0;
        askBubble.css = { transform: "scale(0.6)" };
        // WHY: the start look must be drawn before the motion is turned on, or it is seen at once
        void askBubble.elem.offsetHeight;
        askBubble.setMotionNow("transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s"); // a little spring at the end
        askBubble.opacity = 1;
        askBubble.css = { transform: "none" };
    };

    // It goes at once
    const hideAskBubble = function () {
        if (!askBubble) return;
        askBubble.remove();
        askBubble = null;
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
        if (isFlatDisabled()) return "none";
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
        let maxSize = _w.clockSize;
        if (box.waitingIconFile) maxSize = _w.iconSize;
        else if (box.waitingType == "ring") maxSize = _w.ringSize;
        const size = Math.max(0, Math.min(maxSize, shortSide - _w.iconSpace));
        box.waitingCover.icon.setSize(size, size);
        box.waitingCover.icon.center();
    };

    // BOX: The turning ring (CSS: a circle line with one light part)
    const createWaitingRing = function () {
        const _w = box.style.waiting;
        SmartButton.injectCss();
        const ring = Box(0, 0, 0, 0, {
            color: "transparent",
            css: {
                border: _w.ringWidth + "px solid " + _w.ringTrackColor,
                borderTopColor: _w.ringColor,
                borderRadius: "50%",
                boxSizing: "border-box",
                animation: "smart-button-turn " + _w.ringTurnTime + "s linear infinite",
            },
        });
        ring.elem.classList.add("smart-button-ring");
        return ring;
    };

    // BOX: The waiting clock (an SVG: its hands turn with CSS)
    const createWaitingClock = function () {
        SmartButton.injectCss();
        const clock = Box(0, 0, 0, 0, { color: "transparent" });
        const clockStyle = SmartButton.clocks[box.waitingClock] || SmartButton.clocks.ozden;
        clock.elem.innerHTML = SmartButton.createClockSvg(clockStyle);
        return clock;
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
        const isDark = (_w.fitDarkButton == 1) && SmartButton.isDarkColor(buttonColor);
        if (isCoverless()) {
            box.waitingCover.color = "transparent"; // (the content fades in paint)
            return;
        }
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
    // USAGE: button.setIcon("../comp-m4/smart-button/alert-black.png")

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
        paint();
        paintMotion();
    };
    // USAGE: get: button.enabled, set: button.setEnabled(0)

    box.isAsking = 0; // 1: the first click of ask was made, the button is red

    // Back to the look of before, without onClick (the ask is forgotten)
    box.cancelAsk = function () {
        if (box.isAsking != 1) return;
        box.isAsking = 0;
        if (cancelAskTimer) cancelAskTimer();
        cancelAskTimer = null;
        // WHY filter none: the white icon of the ask must go, also when the look had no css of its own
        if (lookBeforeAsk.icon) lookBeforeAsk.icon = Object.assign({ css: { filter: "none" } }, lookBeforeAsk.icon);
        Object.assign(box.style, lookBeforeAsk);
        applyStyle();
        hideAskBubble();
        if (SmartButton.askingButton === box) SmartButton.askingButton = null;
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

    // WHY its own remove: the bubble is in another box (askIn / the page) and SmartButton.askingButton is static
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
            box.cancelAsk();
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
    box.layout.setMotionNow(WAITING_MOTION); // (the content fades while waiting with no cover)

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
        } else if (box.waitingType == "ring") {
            box.waitingCover.icon = createWaitingRing();
        } else {
            box.waitingCover.icon = createWaitingClock();
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

    // WHY after: the bubble is placed over the button, so the button must be in its place first (endGroup)
    if (box.asking == 1 && box.ask) box.after(0, function () { startAsk(1); });

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// 1: a dark color (the light ring is seen on it). A color of the browser: "rgb(r, g, b)" or "rgba(r, g, b, a)".
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

// The turn of the waiting ring (once for the page). No turn when the system asks for reduced motion: the ring stays.
SmartButton.injectCss = function () {
    basic.addCss("smart-button-css",
        "@keyframes smart-button-turn { to { transform: rotate(360deg); } }" +
        // WHY view-box: a hand of the clock turns around the middle of the clock, not around its own box
        ".smart-button-hand { transform-box: view-box; transform-origin: 50% 50%; animation-name: smart-button-turn;" +
        " animation-timing-function: linear; animation-iteration-count: infinite; }" +
        "@media (prefers-reduced-motion: reduce) { .smart-button-ring, .smart-button-hand { animation: none !important; } }");
};

SmartButton.askingButton = null; // the button that asks now (ask: one at a time)

// *** THE STYLE PACKAGES (the user, 2026-10-30): the buttons of 02-comp-m4-samples/smart-button-3-ozden.htm.
// Every ozden type is #E3E3E3, but the ghost (a page gives its own color in style.box / hover / active).
SmartButton.OZDEN_COLOR = "#E3E3E3";
SmartButton.OZDEN_HOVER = "#D9D9D9";
SmartButton.ozdenStyle = function (borderColor, boxShadow, color = SmartButton.OZDEN_COLOR) {
    return {
        layout: { gap: 8, padding: [16, 0], align: "center center" },
        icon: { width: 24, height: 24, opacity: 0.8 },
        label: { fontSize: 20, textColor: Black(0.7), fontFamily: "opensans" },
        box: { color: color, border: borderColor ? 1 : 0, borderColor: borderColor || "transparent", round: 4, boxShadow: boxShadow },
        hover: { color: SmartButton.OZDEN_HOVER },
        active: { color: SmartButton.OZDEN_HOVER },
    };
};
SmartButton.styles = {
    ozdenType1: SmartButton.ozdenStyle(Black(0.35), "inset 0 -2px 0 rgba(0, 0, 0, 0.25)"), // an edge and a bottom line
    ozdenType2: SmartButton.ozdenStyle(Black(0.35), "none"), // only the edge
    ozdenType3: SmartButton.ozdenStyle(Black(0.1), "none"), // a faint edge
    // WHY White(0), not "transparent": the waiting cover reads the color (fitDarkButton), a black clear one looks dark
    ozdenType4: SmartButton.ozdenStyle("", "none", White(0)), // a ghost: no surface, no edge
    classic: {}, // the defaults (the look of before)
};

// *** THE WAITING CLOCKS (the user, 2026-10-29): the clock of the waiting views with moving hands.
// The sizes are px on a 30 px clock (a smaller button draws it smaller).
// NOTE: comp-m4/loading-screen.js has the same clocks (LoadingScreen.clocks): keep them alike.
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
