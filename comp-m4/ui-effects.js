/* Bismillah */

/*

UIEffects - v26.09

Button, hover and attention effects for basic.js objects (Button, Box, groups, Label, Input, Icon).
- No CSS file. The effects set the styles of the object and use the Web Animations API.
- press(obj, type): hover + press effects and a pointer cursor. For a Button, a Box (a card that is a button),
  a Label...
- hover(obj, type): a hover effect only, to show that the pointer is over the object.
- Several effects can be used together: press(btn, ["lift", "ripple"]). Their transform, filter and
  box-shadow values are combined, so they do not overwrite each other.
- play(obj, name) plays an animation one time, loop(obj, name) repeats it until stop().
- press(), hover(), focusGroup() and loop() return a function that removes the effect: off() / stop().
- button() is the same function as press() and attention() is the same as loop(). They stay for the old code
  (comp-m2/ui-effects.js had only UIEffects.button(btn)).
- Hover effects do not run for touch (no sticky hover on phones). Press effects do.
- A disabled button (btn.enabled = 0) has no effects.
- play() and loop() do nothing when the user prefers reduced motion (UIEffects.reduceMotion).

PRESS TYPES (press and hover):
default, press, lift, glow, ripple, shine, push, fill, ring, jelly, pop
HOVER TYPES (hover and press):
brighten, darken, grow, fade, color, border, underline, tilt, spotlight (and lift, glow, ring, shine)
ANIMATIONS (play and loop):
shake, jelly, pop, bounce, tada, heartbeat, wiggle, flash, pulse, breathe, glow

USAGE:
UIEffects.press(btn);                                       // The first effect of UIEffects: brightness + press.
UIEffects.press(btn, "ripple", { color: White(0.5) });
UIEffects.press(btn, ["lift", "ripple"]);
UIEffects.press(card, "lift");                              // A Box as a button.
UIEffects.hover(card, "ring", { color: "#4A90E2" });
UIEffects.hover(lblLink, "underline", { color: "#4A90E2" });
UIEffects.hover(card, "tilt", { angle: 10 });
const off = UIEffects.hover(box, "grow"); off();            // Removes the effect.
UIEffects.focusGroup([card1, card2, card3]);                // Dims the others while one is hovered.
UIEffects.play(txtPassword, "shake");                       // One time. Returns the Animation (or null).
const stop = UIEffects.loop(btnNew, "pulse"); stop();       // Repeats until stop().

NOTES:
- Call the effect after setMotion(): setMotion() replaces the transition of the object. (The effect adds its
  transition again at the next hover.)
- Set elem.style.boxShadow / transform / filter before the effect is added. The effect keeps those values
  and adds its own to them.
- A shadow, lift or ring outside the object is clipped by a parent box that clips its content (the default
  of a Box). Give the parent some padding or clipContent: 0.
- ripple, shine and spotlight add a <span> into the object for a short time (not on Icon and Input).
- Add your own type: UIEffects.types.myType = function (obj, o, fx) { return { motion: [...], render: function (st) {} }; };

Started Date: 2025 (v26.09: rewritten with more effects)
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

const UIEffects = function () {};

// *** SETTINGS:
UIEffects.duration = 0.2; // Default transition time (seconds).
UIEffects.easing = "cubic-bezier(0.25, 0.8, 0.25, 1)";
UIEffects.reduceMotion = (window.matchMedia) ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;

// *** PUBLIC FUNCTIONS:

// Hover + press effect. The object gets a pointer cursor.
UIEffects.press = function (obj, type = "default", options = {}) {
    obj.elem.style.cursor = "pointer";
    return UIEffects._add(obj, type, options, 1);
};

// The old name of press() (comp-m2/ui-effects.js). The old code keeps working.
UIEffects.button = UIEffects.press;

// Hover effect only (no press state).
UIEffects.hover = function (obj, type = "brighten", options = {}) {
    return UIEffects._add(obj, type, options, 0);
};

// While an object of the list is hovered, the others are dimmed.
// options: dim (opacity of the others, 0.45), scale (of the hovered one, 1), blur (px, 0), grayscale (0-1, 0), duration
UIEffects.focusGroup = function (list, options = {}) {

    const id = UIEffects._newId();
    const removers = [];
    const dim = options.dim ?? 0.45;
    const scale = options.scale ?? 1;
    const blur = options.blur ?? 0;
    const grayscale = options.grayscale ?? 0;
    let leaveTimer = null;

    const filterOf = function (isDim) {
        let value = "opacity(" + (isDim ? dim : 1) + ")";
        if (blur) value += " blur(" + (isDim ? blur : 0) + "px)";
        if (grayscale) value += " grayscale(" + (isDim ? grayscale : 0) + ")";
        return value;
    };

    const apply = function (active) {
        list.forEach(function (item) {
            UIEffects._addMotion(item, ["filter", "transform"], options.duration ?? 0.3);
            UIEffects._setPart(item, "filter", id, filterOf(active && item !== active));
            UIEffects._setPart(item, "transform", id, "scale(" + ((active && item === active) ? scale : 1) + ")");
        });
    };

    list.forEach(function (item) {
        removers.push(item.on("pointerenter", function (self, event) {
            if (event.pointerType === "touch") return;
            clearTimeout(leaveTimer);
            apply(item);
        }));
        removers.push(item.on("pointerleave", function () {
            clearTimeout(leaveTimer);
            // WHY: Moving to the next item fires leave and then enter. Without the wait, all items flash.
            leaveTimer = setTimeout(function () { apply(null); }, 80);
        }));
    });

    return function off() {
        clearTimeout(leaveTimer);
        removers.forEach(function (remove) { remove(); });
        removers.length = 0;
        list.forEach(function (item) { UIEffects._clearParts(item, id); });
    };

};

// Plays an animation one time. Returns the Animation (animation.finished is a Promise) or null.
// options: duration (seconds), color, size (for pulse and glow)
UIEffects.play = function (obj, name = "pop", options = {}) {

    if (UIEffects.reduceMotion) return null;
    const def = UIEffects._getAnimation(obj, name, options);
    if (!def) return null;

    return obj.elem.animate(def.keyframes, {
        duration: (options.duration ?? def.duration) * 1000,
        easing: def.easing || "ease",
        composite: def.composite || "add",
    });

};

// Repeats an animation to take attention (a new message, the next step). Returns stop().
// options: pause (seconds between two plays), duration, color, size
UIEffects.loop = function (obj, name = "pulse", options = {}) {

    if (UIEffects.reduceMotion) return function stop() {};
    const def = UIEffects._getAnimation(obj, name, options);
    if (!def) return function stop() {};

    const duration = options.duration ?? def.duration;
    const pause = options.pause ?? def.pause ?? 1;
    const keyframes = (pause > 0) ? UIEffects._withPause(def.keyframes, duration, pause, def.easing || "ease") : def.keyframes;

    const animation = obj.elem.animate(keyframes, {
        duration: (duration + Math.max(0, pause)) * 1000,
        easing: (pause > 0) ? "linear" : (def.easing || "ease"),
        composite: def.composite || "add",
        iterations: Infinity,
    });

    return function stop() {
        animation.cancel();
    };

};

// The first name of loop().
UIEffects.attention = UIEffects.loop;

// *** EFFECT TYPES:
// Each type returns: motion (transitioned CSS properties), render(st, event) (st.over, st.down),
// and optionally: duration, pressTime (min press time, ms), move(event), off().
// fx.set(prop, value): sets this effect's part of "transform", "filter" or "boxShadow".

UIEffects.types = {};

// The first effect of UIEffects: brightness on hover, a short press.
UIEffects.types.default = function (obj, o, fx) {
    return {
        motion: ["filter", "transform"],
        pressTime: 200,
        render: function (st) {
            fx.set("filter", "brightness(" + (st.down ? 0.8 : (st.over ? 1.2 : 1)) + ")");
            fx.set("transform", "scale(" + (st.down ? (o.scale ?? 0.95) : 1) + ")");
        },
    };
};

// Pressed in, a little brighter on hover.
UIEffects.types.press = function (obj, o, fx) {
    return {
        motion: ["filter", "transform"],
        duration: 0.15,
        render: function (st) {
            fx.set("filter", "brightness(" + (st.down ? 0.92 : (st.over ? 1.08 : 1)) + ")");
            fx.set("transform", "scale(" + (st.down ? (o.scale ?? 0.94) : 1) + ")");
        },
    };
};

// Rises with a shadow. options: distance (px, 4), shadowColor
UIEffects.types.lift = function (obj, o, fx) {
    const distance = o.distance ?? 4;
    const shadowColor = o.shadowColor || Black(0.22);
    return {
        motion: ["transform", "box-shadow"],
        duration: 0.25,
        render: function (st) {
            const y = st.down ? -1 : (st.over ? -distance : 0);
            fx.set("transform", "translateY(" + y + "px)");
            if (st.down) fx.set("boxShadow", "0px 2px 6px 0px " + shadowColor);
            else if (st.over) fx.set("boxShadow", "0px " + (distance * 2 + 2) + "px " + (distance * 4 + 6) + "px 0px " + shadowColor);
            else fx.set("boxShadow", "0px 0px 0px 0px transparent");
        },
    };
};

// A soft light around it. options: color (the background color of the object), size (px, 16)
UIEffects.types.glow = function (obj, o, fx) {
    const color = o.color || UIEffects._backgroundColor(obj, "rgba(66, 133, 244, 0.8)");
    const size = o.size ?? 16;
    return {
        motion: ["transform", "box-shadow", "filter"],
        duration: 0.3,
        render: function (st) {
            const isOn = st.over || st.down;
            fx.set("boxShadow", isOn ? "0px 0px " + size + "px 2px " + color : "0px 0px 0px 0px transparent");
            fx.set("filter", "brightness(" + (st.over ? 1.05 : 1) + ")");
            fx.set("transform", "scale(" + (st.down ? 0.97 : 1) + ")");
        },
    };
};

// A wave from the pressed point (Material style). options: color (White(0.45)), time (seconds, 0.6)
UIEffects.types.ripple = function (obj, o, fx) {
    const color = o.color || White(0.45);
    return {
        motion: ["filter"],
        render: function (st, event) {
            fx.set("filter", "brightness(" + (st.over ? 1.06 : 1) + ")");
            if (st.down && event && event.type === "pointerdown") UIEffects._ripple(obj, event, color, o.time ?? 0.6);
        },
    };
};

// A light passes over it on hover. options: color (White(0.5)), time (seconds, 0.7)
UIEffects.types.shine = function (obj, o, fx) {
    const color = o.color || White(0.5);
    let wasOver = 0;
    return {
        motion: ["filter", "transform"],
        render: function (st) {
            if (st.over && !wasOver) UIEffects._shine(obj, color, o.time ?? 0.7);
            wasOver = st.over;
            fx.set("filter", "brightness(" + (st.over ? 1.05 : 1) + ")");
            fx.set("transform", "scale(" + (st.down ? 0.97 : 1) + ")");
        },
    };
};

// A 3D key: it has a hard shadow below and goes down when it is pressed. options: depth (px, 5), shadowColor
UIEffects.types.push = function (obj, o, fx) {
    const depth = o.depth ?? 5;
    const shadowColor = o.shadowColor || Black(0.3);
    return {
        motion: ["transform", "box-shadow", "filter"],
        duration: 0.08,
        render: function (st) {
            const y = st.down ? depth - 1 : (st.over ? -1 : 0);
            const shadowY = st.down ? 1 : (st.over ? depth + 1 : depth);
            fx.set("transform", "translateY(" + y + "px)");
            fx.set("boxShadow", "0px " + shadowY + "px 0px 0px " + shadowColor);
            fx.set("filter", "brightness(" + (st.over ? 1.04 : 1) + ")");
        },
    };
};

// The background fills with a color from one side. Good for outline buttons.
// options: color (Black(0.15)), textColor (text color while filled), direction ("left", "right", "up", "down")
UIEffects.types.fill = function (obj, o, fx) {
    const color = o.color || Black(0.15);
    const direction = o.direction || "left";
    let savedTextColor = null;
    return {
        motion: ["box-shadow", "color", "transform"],
        duration: 0.35,
        render: function (st) {
            const isOn = st.over || st.down;
            const w = obj.elem.offsetWidth;
            const h = obj.elem.offsetHeight;
            let x = 0, y = 0;
            if (isOn) {
                if (direction === "right") x = -w;
                else if (direction === "up") y = -h;
                else if (direction === "down") y = h;
                else x = w;
            }
            fx.set("boxShadow", "inset " + x + "px " + y + "px 0px 0px " + color);
            fx.set("transform", "scale(" + (st.down ? 0.97 : 1) + ")");
            if (o.textColor) {
                if (isOn && savedTextColor === null) {
                    savedTextColor = obj.elem.style.color;
                    obj.elem.style.color = o.textColor;
                } else if (!isOn && savedTextColor !== null) {
                    obj.elem.style.color = savedTextColor;
                    savedTextColor = null;
                }
            }
        },
        off: function () {
            if (savedTextColor !== null) obj.elem.style.color = savedTextColor;
        },
    };
};

// A focus ring around it. options: color ("#4A90E2"), width (px, 2), offset (px, 3)
UIEffects.types.ring = function (obj, o, fx) {
    const elem = obj.elem;
    const color = o.color || "#4A90E2";
    const offset = o.offset ?? 3;
    const savedOutline = elem.style.outline;
    const savedOutlineOffset = elem.style.outlineOffset;
    elem.style.outline = (o.width ?? 2) + "px solid transparent";
    elem.style.outlineOffset = "0px";
    return {
        motion: ["outline-color", "outline-offset", "transform"],
        render: function (st) {
            const isOn = st.over || st.down;
            elem.style.outlineColor = isOn ? color : "transparent";
            elem.style.outlineOffset = (isOn ? (st.down ? 1 : offset) : 0) + "px";
            fx.set("transform", "scale(" + (st.down ? 0.98 : 1) + ")");
        },
        off: function () {
            elem.style.outline = savedOutline;
            elem.style.outlineOffset = savedOutlineOffset;
        },
    };
};

// Shakes like a jelly when it is released.
UIEffects.types.jelly = function (obj, o, fx) {
    let wasDown = 0;
    return {
        motion: ["filter"],
        pressTime: 0,
        render: function (st) {
            if (wasDown && !st.down) UIEffects.play(obj, "jelly");
            wasDown = st.down;
            fx.set("filter", "brightness(" + (st.down ? 0.95 : (st.over ? 1.06 : 1)) + ")");
        },
    };
};

// Pops when it is released.
UIEffects.types.pop = function (obj, o, fx) {
    let wasDown = 0;
    return {
        motion: ["filter", "transform"],
        pressTime: 0,
        render: function (st) {
            if (wasDown && !st.down) UIEffects.play(obj, "pop");
            wasDown = st.down;
            fx.set("filter", "brightness(" + (st.over ? 1.06 : 1) + ")");
            fx.set("transform", "scale(" + (st.down ? 0.94 : 1) + ")");
        },
    };
};

// HOVER TYPES:

// options: amount (1.1)
UIEffects.types.brighten = function (obj, o, fx) {
    return {
        motion: ["filter", "transform"],
        render: function (st) {
            fx.set("filter", "brightness(" + (st.over ? (o.amount ?? 1.1) : 1) + ")");
            fx.set("transform", "scale(" + (st.down ? 0.97 : 1) + ")");
        },
    };
};

// options: amount (0.9)
UIEffects.types.darken = function (obj, o, fx) {
    return {
        motion: ["filter", "transform"],
        render: function (st) {
            fx.set("filter", "brightness(" + ((st.over || st.down) ? (o.amount ?? 0.9) : 1) + ")");
            fx.set("transform", "scale(" + (st.down ? 0.97 : 1) + ")");
        },
    };
};

// options: scale (1.05)
UIEffects.types.grow = function (obj, o, fx) {
    return {
        motion: ["transform"],
        duration: 0.25,
        render: function (st) {
            fx.set("transform", "scale(" + (st.down ? 0.98 : (st.over ? (o.scale ?? 1.05) : 1)) + ")");
        },
    };
};

// Becomes transparent. options: amount (0.7)
UIEffects.types.fade = function (obj, o, fx) {
    return {
        motion: ["filter"],
        render: function (st) {
            fx.set("filter", "opacity(" + ((st.over || st.down) ? (o.amount ?? 0.7) : 1) + ")");
        },
    };
};

// The background color changes. options: color (Black(0.06) over the current color), textColor
UIEffects.types.color = function (obj, o, fx) {
    const elem = obj.elem;
    let saved = null;
    return {
        motion: ["background-color", "color", "box-shadow"],
        render: function (st) {
            const isOn = st.over || st.down;
            if (o.color) {
                if (isOn && saved === null) {
                    saved = { background: elem.style.backgroundColor, text: elem.style.color };
                    elem.style.backgroundColor = o.color;
                    if (o.textColor) elem.style.color = o.textColor;
                } else if (!isOn && saved !== null) {
                    elem.style.backgroundColor = saved.background;
                    elem.style.color = saved.text;
                    saved = null;
                }
            } else {
                // WHY: Without a color, a thin dark layer (inset shadow) works on every background color.
                fx.set("boxShadow", "inset 0px 0px 0px 2000px " + (isOn ? Black(st.down ? 0.1 : 0.06) : "transparent"));
            }
        },
        off: function () {
            if (saved !== null) {
                elem.style.backgroundColor = saved.background;
                elem.style.color = saved.text;
            }
        },
    };
};

// The border color changes. The object needs a border. options: color ("#4A90E2")
UIEffects.types.border = function (obj, o, fx) {
    const elem = obj.elem;
    let saved = null;
    return {
        motion: ["border-color"],
        render: function (st) {
            const isOn = st.over || st.down;
            if (isOn && saved === null) {
                saved = elem.style.borderColor;
                elem.style.borderColor = o.color || "#4A90E2";
            } else if (!isOn && saved !== null) {
                elem.style.borderColor = saved;
                saved = null;
            }
        },
        off: function () {
            if (saved !== null) elem.style.borderColor = saved;
        },
    };
};

// A line grows from the left under the text (for a Label used as a link). options: color, width (px, 2)
UIEffects.types.underline = function (obj, o, fx) {
    const elem = obj.elem;
    const color = o.color || "currentColor";
    const saved = {
        image: elem.style.backgroundImage,
        repeat: elem.style.backgroundRepeat,
        position: elem.style.backgroundPosition,
        size: elem.style.backgroundSize,
    };
    const lineWidth = o.width ?? 2;
    elem.style.backgroundImage = "linear-gradient(" + color + ", " + color + ")";
    elem.style.backgroundRepeat = "no-repeat";
    elem.style.backgroundPosition = "0% 100%";
    elem.style.backgroundSize = "0% " + lineWidth + "px";
    return {
        motion: ["background-size"],
        duration: 0.3,
        render: function (st) {
            elem.style.backgroundSize = ((st.over || st.down) ? 100 : 0) + "% " + lineWidth + "px";
        },
        off: function () {
            elem.style.backgroundImage = saved.image;
            elem.style.backgroundRepeat = saved.repeat;
            elem.style.backgroundPosition = saved.position;
            elem.style.backgroundSize = saved.size;
        },
    };
};

// Turns in 3D to the pointer. options: angle (degrees, 8), scale (1.03), perspective (px, 700), glare (1)
UIEffects.types.tilt = function (obj, o, fx) {
    const angle = o.angle ?? 8;
    const scale = o.scale ?? 1.03;
    const perspective = o.perspective ?? 700;
    const useGlare = (o.glare ?? 1) && !UIEffects.reduceMotion;
    let glare = null;
    const setTilt = function (rx, ry, s) {
        fx.set("transform", "perspective(" + perspective + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) scale(" + s + ")");
    };
    return {
        motion: ["transform"],
        duration: 0.15,
        render: function (st) {
            if (!st.over) setTilt(0, 0, st.down ? 0.98 : 1);
            if (glare && !st.over) {
                const oldGlare = glare;
                glare = null;
                oldGlare.style.opacity = 0;
                setTimeout(function () { oldGlare.remove(); }, 300);
            }
        },
        move: function (event) {
            if (UIEffects.reduceMotion) return;
            const rect = obj.elem.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const px = (event.clientX - rect.left) / rect.width - 0.5;
            const py = (event.clientY - rect.top) / rect.height - 0.5;
            setTilt((-py * 2 * angle).toFixed(2), (px * 2 * angle).toFixed(2), scale);
            if (useGlare) {
                if (!glare || glare.parentNode !== obj.elem) {
                    glare = UIEffects._overlay(obj);
                    if (glare) glare.style.transition = "opacity 0.3s";
                }
                if (glare) {
                    glare.style.opacity = 1;
                    glare.style.background = "radial-gradient(circle at " + ((px + 0.5) * 100) + "% " + ((py + 0.5) * 100) + "%, " + White(0.25) + ", transparent 60%)";
                }
            }
        },
        off: function () {
            if (glare) glare.remove();
        },
    };
};

// A light follows the pointer. options: color (White(0.25)), size (px, 180)
UIEffects.types.spotlight = function (obj, o, fx) {
    const color = o.color || White(0.25);
    const size = o.size ?? 180;
    let light = null;
    let removeTimer = null;
    return {
        motion: [],
        render: function (st) {
            if (!light) return;
            light.style.opacity = st.over ? 1 : 0;
            // WHY: The light is removed after it fades out. It is a child of the object (button.text reads it too).
            clearTimeout(removeTimer);
            if (!st.over) {
                const oldLight = light;
                light = null;
                removeTimer = setTimeout(function () { oldLight.remove(); }, 300);
            }
        },
        move: function (event) {
            clearTimeout(removeTimer);
            // WHY: button.text = "..." clears the button's HTML, so the light is created again when it is lost.
            if (!light || light.parentNode !== obj.elem) {
                light = UIEffects._overlay(obj);
                if (!light) return;
                light.style.transition = "opacity 0.3s";
            }
            const p = UIEffects._localPoint(obj, event);
            light.style.opacity = 1;
            light.style.background = "radial-gradient(circle " + size + "px at " + p.x + "px " + p.y + "px, " + color + ", transparent)";
        },
        off: function () {
            clearTimeout(removeTimer);
            if (light) light.remove();
        },
    };
};

// *** ANIMATIONS (play and loop):
// Each one returns: keyframes, duration (seconds), easing, composite ("add": added to the current transform),
// pause (seconds between two plays in loop()).

UIEffects.animations = {};

UIEffects.animations.shake = function () {
    return {
        keyframes: ["0", "-8", "8", "-6", "6", "-3", "3", "0"].map(function (x) { return { transform: "translateX(" + x + "px)" }; }),
        duration: 0.5,
        pause: 2,
    };
};

UIEffects.animations.wiggle = function () {
    return {
        keyframes: ["0", "-8", "8", "-6", "6", "-3", "0"].map(function (r) { return { transform: "rotate(" + r + "deg)" }; }),
        duration: 0.6,
        pause: 2,
    };
};

UIEffects.animations.jelly = function () {
    return {
        keyframes: [
            { transform: "scale(1, 1)" },
            { transform: "scale(1.15, 0.85)", offset: 0.3 },
            { transform: "scale(0.9, 1.1)", offset: 0.5 },
            { transform: "scale(1.05, 0.95)", offset: 0.7 },
            { transform: "scale(1, 1)" },
        ],
        duration: 0.5,
        pause: 1.5,
    };
};

UIEffects.animations.pop = function () {
    return {
        keyframes: [
            { transform: "scale(1)" },
            { transform: "scale(1.12)", offset: 0.4 },
            { transform: "scale(0.96)", offset: 0.7 },
            { transform: "scale(1)" },
        ],
        duration: 0.35,
        easing: "ease-out",
        pause: 1.5,
    };
};

UIEffects.animations.bounce = function () {
    return {
        keyframes: [
            { transform: "translateY(0px)", easing: "ease-out" },
            { transform: "translateY(-12px)", offset: 0.3, easing: "ease-in" },
            { transform: "translateY(0px)", offset: 0.55, easing: "ease-out" },
            { transform: "translateY(-5px)", offset: 0.75, easing: "ease-in" },
            { transform: "translateY(0px)" },
        ],
        duration: 0.6,
        easing: "linear",
        pause: 1.2,
    };
};

UIEffects.animations.tada = function () {
    return {
        keyframes: [
            { transform: "scale(1) rotate(0deg)" },
            { transform: "scale(0.9) rotate(-3deg)", offset: 0.1 },
            { transform: "scale(0.9) rotate(-3deg)", offset: 0.2 },
            { transform: "scale(1.1) rotate(3deg)", offset: 0.3 },
            { transform: "scale(1.1) rotate(-3deg)", offset: 0.45 },
            { transform: "scale(1.1) rotate(3deg)", offset: 0.6 },
            { transform: "scale(1.1) rotate(-3deg)", offset: 0.75 },
            { transform: "scale(1) rotate(0deg)" },
        ],
        duration: 0.9,
        pause: 2,
    };
};

UIEffects.animations.heartbeat = function () {
    return {
        keyframes: [
            { transform: "scale(1)" },
            { transform: "scale(1.15)", offset: 0.15 },
            { transform: "scale(1)", offset: 0.3 },
            { transform: "scale(1.15)", offset: 0.45 },
            { transform: "scale(1)", offset: 0.7 },
            { transform: "scale(1)" },
        ],
        duration: 1,
        easing: "ease-in-out",
        pause: 0.3,
    };
};

UIEffects.animations.flash = function () {
    return {
        keyframes: [{ opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }],
        duration: 0.8,
        composite: "replace",
        pause: 2,
    };
};

// A ring grows out of it and fades. options: color, size (px, 14)
UIEffects.animations.pulse = function (obj, o) {
    const color = o.color || UIEffects._backgroundColor(obj, "rgba(66, 133, 244, 1)");
    const size = o.size ?? 14;
    return {
        keyframes: [
            { boxShadow: "0px 0px 0px 0px " + UIEffects._alpha(color, 0.6) },
            { boxShadow: "0px 0px 0px " + size + "px " + UIEffects._alpha(color, 0) },
        ],
        duration: 1.5,
        easing: "ease-out",
        pause: 0,
    };
};

// Slowly grows and shrinks. options: scale (1.05)
UIEffects.animations.breathe = function (obj, o) {
    return {
        keyframes: [
            { transform: "scale(1)" },
            { transform: "scale(" + (o.scale ?? 1.05) + ")" },
            { transform: "scale(1)" },
        ],
        duration: 2,
        easing: "ease-in-out",
        pause: 0,
    };
};

// A light around it comes and goes. options: color, size (px, 18)
UIEffects.animations.glow = function (obj, o) {
    const color = o.color || UIEffects._backgroundColor(obj, "rgba(66, 133, 244, 1)");
    const size = o.size ?? 18;
    return {
        keyframes: [
            { boxShadow: "0px 0px 0px 0px " + UIEffects._alpha(color, 0) },
            { boxShadow: "0px 0px " + size + "px 3px " + UIEffects._alpha(color, 0.8) },
            { boxShadow: "0px 0px 0px 0px " + UIEffects._alpha(color, 0) },
        ],
        duration: 2,
        easing: "ease-in-out",
        pause: 0,
    };
};

// *** PRIVATE FUNCTIONS:

UIEffects._idCounter = 0;

UIEffects._newId = function () {
    UIEffects._idCounter++;
    return "fx" + UIEffects._idCounter + "_";
};

UIEffects._add = function (obj, type, options, usePress) {

    // Several types: press(btn, ["lift", "ripple"])
    if (Array.isArray(type)) {
        const offList = type.map(function (item) { return UIEffects._add(obj, item, options, usePress); });
        return function off() {
            offList.forEach(function (offItem) { offItem(); });
        };
    }

    const typeFunc = UIEffects.types[type];
    if (!typeFunc) {
        println("UIEffects: Unknown effect type: " + type, "error");
        return function off() {};
    }

    const id = UIEffects._newId();
    const fx = {
        id: id,
        set: function (prop, value) { UIEffects._setPart(obj, prop, id, value); },
    };
    const effect = typeFunc(obj, options, fx);
    const duration = options.duration ?? effect.duration ?? UIEffects.duration;
    const st = { over: 0, down: 0 };
    const removers = [];
    let pressTimer = null;

    // WHY: The transition is added before every change, because setMotion() can replace it at any time.
    const update = function (event) {
        UIEffects._addMotion(obj, effect.motion || [], duration);
        effect.render(st, event);
    };

    // The first state, without motion.
    effect.render(st, null);

    // HOVER:
    removers.push(obj.on("pointerenter", function (self, event) {
        if (event.pointerType === "touch" || UIEffects._isDisabled(obj)) return;
        st.over = 1;
        update(event);
    }));

    removers.push(obj.on("pointerleave", function (self, event) {
        if (!st.over) return;
        st.over = 0;
        update(event);
    }));

    if (effect.move) {
        removers.push(obj.on("pointermove", function (self, event) {
            if (st.over) effect.move(event);
        }));
    }

    // PRESS:
    if (usePress) {

        const pressTime = options.pressTime ?? effect.pressTime ?? 120;
        let downTime = 0;

        removers.push(obj.on("pointerdown", function (self, event) {
            if (event.button > 0 || UIEffects._isDisabled(obj)) return;
            clearTimeout(pressTimer);
            st.down = 1;
            downTime = Date.now();
            update(event);
        }));

        const release = function (self, event) {
            if (!st.down) return;
            // WHY: A quick tap is shorter than the transition. The pressed state is kept for a short time, so it is seen.
            const wait = Math.max(0, pressTime - (Date.now() - downTime));
            clearTimeout(pressTimer);
            pressTimer = setTimeout(function () {
                st.down = 0;
                update(event);
            }, wait);
        };

        removers.push(obj.on("pointerup", release));
        removers.push(obj.on("pointerleave", release));
        removers.push(obj.on("pointercancel", release));

    }

    return function off() {
        clearTimeout(pressTimer);
        removers.forEach(function (remove) { remove(); });
        removers.length = 0;
        if (effect.off) effect.off();
        UIEffects._clearParts(obj, id);
    };

};

UIEffects._isDisabled = function (obj) {
    return obj.elem.disabled === true || obj.enabled === 0;
};

// The transform, filter and box-shadow values of all effects on an object are kept in parts and combined.
UIEffects._state = function (obj) {
    if (!obj._uiEffects) {
        const elem = obj.elem;
        const computedShadow = getComputedStyle(elem).boxShadow;
        obj._uiEffects = {
            base: {
                transform: elem.style.transform || "",
                filter: elem.style.filter || "",
                // WHY: A Button has an inset shadow in basic.css. The effects must keep it.
                boxShadow: elem.style.boxShadow || ((computedShadow && computedShadow !== "none") ? computedShadow : ""),
            },
            parts: { transform: {}, filter: {}, boxShadow: {} },
        };
    }
    return obj._uiEffects;
};

UIEffects._setPart = function (obj, prop, key, value) {
    const state = UIEffects._state(obj);
    // WHY: A transform or filter (even scale(1)) makes the object the container of its position: fixed children
    //      (popups, menus). So a value that changes nothing is not written.
    if (value && (prop === "boxShadow" || !UIEffects._isNeutral(value))) state.parts[prop][key] = value;
    else delete state.parts[prop][key];
    const list = [];
    if (state.base[prop]) list.push(state.base[prop]);
    for (const partKey in state.parts[prop]) list.push(state.parts[prop][partKey]);
    obj.elem.style[prop] = list.join((prop === "boxShadow") ? ", " : " ");
};

// scale(1), translateY(0px), brightness(1), blur(0px)... -> true
UIEffects._isNeutral = function (value) {
    const funcs = value.match(/[a-zA-Z]+\([^)]*\)/g);
    if (!funcs) return false;
    return funcs.every(function (func) {
        const name = func.substr(0, func.indexOf("("));
        const args = func.slice(name.length + 1, -1).split(",").map(function (arg) { return parseFloat(arg); });
        if (name === "perspective") return true;
        if (/^(scale|brightness|opacity|contrast|saturate)/.test(name)) return args.every(function (arg) { return arg === 1; });
        return args.every(function (arg) { return arg === 0; }); // translate, rotate, skew, blur, grayscale...
    });
};

UIEffects._clearParts = function (obj, id) {
    const state = obj._uiEffects;
    if (!state) return;
    ["transform", "filter", "boxShadow"].forEach(function (prop) {
        let isChanged = 0;
        for (const partKey in state.parts[prop]) {
            if (partKey.indexOf(id) === 0) {
                delete state.parts[prop][partKey];
                isChanged = 1;
            }
        }
        if (isChanged) UIEffects._setPart(obj, prop, "", "");
    });
};

// Adds the missing properties to the transition of the object. It keeps the existing ones (setMotion).
UIEffects._addMotion = function (obj, props, duration) {
    if (!props.length) return;
    const elem = obj.elem;
    const current = elem.style.transition || "";
    if (/(^|,)\s*all(\s|,|$)/.test(current)) return;
    // WHY: Split by the commas that are not in parentheses: cubic-bezier(0.25, 0.8, 0.25, 1)
    const items = current ? current.split(/,(?![^(]*\))/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
    const names = items.map(function (s) { return s.split(/\s+/)[0]; });
    let isChanged = 0;
    props.forEach(function (prop) {
        if (names.indexOf(prop) === -1) {
            items.push(prop + " " + duration + "s " + UIEffects.easing);
            names.push(prop);
            isChanged = 1;
        }
    });
    if (isChanged) elem.style.transition = items.join(", ");
};

// A layer on the object for ripple, shine, spotlight and the tilt glare. (Not possible in <img> and <input>.)
UIEffects._overlay = function (obj) {
    const elem = obj.elem;
    if (elem.tagName === "IMG" || elem.tagName === "INPUT" || obj._type === "textbox") return null;
    const layer = document.createElement("span");
    layer.style.cssText = "position: absolute; left: 0px; top: 0px; right: 0px; bottom: 0px; overflow: hidden; border-radius: inherit; pointer-events: none;";
    elem.appendChild(layer);
    return layer;
};

// The pointer position in the object (px), also when the page is zoomed (page.fit) or the object is scaled.
UIEffects._localPoint = function (obj, event) {
    const elem = obj.elem;
    const rect = elem.getBoundingClientRect();
    const scaleX = rect.width ? elem.offsetWidth / rect.width : 1;
    const scaleY = rect.height ? elem.offsetHeight / rect.height : 1;
    if (event.clientX === undefined) return { x: elem.offsetWidth / 2, y: elem.offsetHeight / 2 };
    return {
        x: (event.clientX - rect.left) * scaleX - elem.clientLeft,
        y: (event.clientY - rect.top) * scaleY - elem.clientTop,
    };
};

UIEffects._ripple = function (obj, event, color, time) {
    if (UIEffects.reduceMotion) return;
    const layer = UIEffects._overlay(obj);
    if (!layer) return;
    const elem = obj.elem;
    const p = UIEffects._localPoint(obj, event);
    const w = elem.clientWidth;
    const h = elem.clientHeight;
    const radius = Math.sqrt(Math.pow(Math.max(p.x, w - p.x), 2) + Math.pow(Math.max(p.y, h - p.y), 2));

    const dot = document.createElement("span");
    dot.style.cssText = "position: absolute; border-radius: 50%; pointer-events: none;"
        + "left: " + (p.x - radius) + "px; top: " + (p.y - radius) + "px; width: " + (radius * 2) + "px; height: " + (radius * 2) + "px; background: " + color + ";";
    layer.appendChild(dot);

    const animation = dot.animate([
        { transform: "scale(0)", opacity: 1 },
        { transform: "scale(1)", opacity: 0.7, offset: 0.6 },
        { transform: "scale(1)", opacity: 0 },
    ], { duration: time * 1000, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" });
    UIEffects._removeAfter(layer, animation, time);
};

UIEffects._shine = function (obj, color, time) {
    if (UIEffects.reduceMotion) return;
    const layer = UIEffects._overlay(obj);
    if (!layer) return;
    const w = obj.elem.offsetWidth;
    const streakWidth = Math.max(30, w * 0.4);

    const streak = document.createElement("span");
    streak.style.cssText = "position: absolute; top: -20%; bottom: -20%; left: 0px; pointer-events: none;"
        + "width: " + streakWidth + "px; background: linear-gradient(90deg, transparent, " + color + ", transparent);";
    layer.appendChild(streak);

    const animation = streak.animate([
        { transform: "translateX(" + (-streakWidth * 1.5) + "px) skewX(-20deg)" },
        { transform: "translateX(" + (w + streakWidth * 0.5) + "px) skewX(-20deg)" },
    ], { duration: time * 1000, easing: "ease-in-out" });
    UIEffects._removeAfter(layer, animation, time);
};

// WHY: A hidden tab does not play animations (no finish event), so a timer removes the layer too.
UIEffects._removeAfter = function (layer, animation, time) {
    const remove = function () { layer.remove(); };
    animation.onfinish = remove;
    animation.oncancel = remove;
    setTimeout(remove, time * 1000 + 100);
};

UIEffects._getAnimation = function (obj, name, options) {
    const func = UIEffects.animations[name];
    if (!func) {
        println("UIEffects: Unknown animation: " + name, "error");
        return null;
    }
    return func(obj, options);
};

// Puts the keyframes in the first part of the time, and waits in the rest.
UIEffects._withPause = function (keyframes, duration, pause, easing) {
    const ratio = duration / (duration + pause);
    const count = keyframes.length;
    const result = keyframes.map(function (frame, index) {
        const copy = Object.assign({}, frame);
        if (!copy.easing) copy.easing = easing;
        const offset = (frame.offset !== undefined) ? frame.offset : ((count > 1) ? index / (count - 1) : 0);
        copy.offset = offset * ratio;
        return copy;
    });
    const last = Object.assign({}, keyframes[count - 1]);
    delete last.easing;
    last.offset = 1;
    result.push(last);
    return result;
};

// The background color of the object, if it is not transparent.
UIEffects._backgroundColor = function (obj, fallback) {
    const color = getComputedStyle(obj.elem).backgroundColor;
    if (!color || color === "transparent" || /rgba\(.*,\s*0\)$/.test(color)) return fallback;
    return color;
};

// Any CSS color with a new alpha: _alpha("#4A90E2", 0.5) -> "rgba(74, 144, 226, 0.5)"
UIEffects._alpha = function (color, alpha) {
    if (!UIEffects._colorContext) UIEffects._colorContext = document.createElement("canvas").getContext("2d");
    const ctx = UIEffects._colorContext;
    ctx.fillStyle = "#000000";
    ctx.fillStyle = color;
    const value = ctx.fillStyle; // "#rrggbb" or "rgba(r, g, b, a)"
    let r = 0, g = 0, b = 0;
    if (value.charAt(0) === "#") {
        r = parseInt(value.substr(1, 2), 16);
        g = parseInt(value.substr(3, 2), 16);
        b = parseInt(value.substr(5, 2), 16);
    } else {
        const numbers = value.match(/[\d.]+/g) || [0, 0, 0];
        r = numbers[0]; g = numbers[1]; b = numbers[2];
    }
    return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
