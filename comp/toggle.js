/* Bismillah */

/*
Toggle - v25.08

UI COMPONENT TEMPLATE
- An on / off switch: a round knob (box.button) slides on a track (box.background). A click switches it.
- Style packages: "ozden" (default: the knob is smaller when off), "ozdenDark" (for a dark page), "light" and
  "dark" (the light and dark look of the kit), "classic" and more shapes (toggle-2.htm). Select with styleName.
  (Toggle.styles)
-- "ozden": a darker line around the colored track when on (selectedBorderColor: the light
   look had no clear edge when on). Its size: 70 x 40, a round knob.
   When on, a shadow to the left of the knob and a thin line around it, so the white knob stands
   out on the track (buttonStyle.selectedShadow). A page with its own selectedShadow keeps that.
-- "light" / "dark" (_designs/toggle.htm): a flat pill track of 52 x 30 that turns to the accent of the kit when on, a
   white (dark: light gray) knob of the same size on and off with a soft shadow, 12 px marks. A mark in the knob
   (markPlace "knob"): give it a dark color, markStyle: { color: Black(0.6), selectedColor: Black(0.6) }.
-- "classic": for a 600 px design: 60 x 40, a light
   gray track that turns blue, a white knob of the same size on and off, with a shadow.
-- A package is a package of params (basic.js v26.10.27): its keys fill the params you did not give, also the
   keys inside backgroundStyle and buttonStyle (Ex: the classic package with your own selectedColor).
-- "float", "round", "slim", "outline", "square": other shapes, with their sizes, in soft colors
   (the "Soft" palette of basic.js Designer). "float": a knob bigger than its track, "round": a big knob, "slim": a low
   track, "outline": a line around the track when off, "square": small corners.
-- "tick", "badge", "label": with marks. "tick": a check or a cross on the track, "badge": in the knob, on a green or
   red track, "label": ON / OFF on the track, small corners.
- onMark, offMark: what shows when on / off: "check", "cross" or a text ("ON"). "": nothing. setMarks() changes them.
  markPlace: "track" (on the free side of the track) or "knob" (in the knob). markStyle: its size and colors.
- animated: 1 (the default) gives a toggle with marks small motions (not at the first view): a drawn mark (check,
  cross) on the track grows in behind the knob, in the knob it turns in with a small spring, it grows a little under
  the mouse; the knob gets flatter while pressed. A text mark (ON / OFF) has no motion: it shows and goes at once. A
  toggle without marks does not change. Off with prefers-reduced-motion. setAnimated().
- offButtonScale: the size of the knob when off (1: the same size as on).
- focusRingColor: the ring of the keyboard focus ("": the ring of basic.js). The ring follows the round of the track.
- backgroundStyle.selectedBorderColor: the line of the track when on ("": the same as borderColor). A page that gives
  its own borderColor and no selectedBorderColor keeps that line when on too (the line of "ozden" when on is for
  its own colors).
- backgroundStyle.left, top, width, height: a track of another size than the box (Ex: "float").
- buttonStyle.shadow / buttonStyle.selectedShadow: the shadow of the knob when off / on.

USAGE:
const toggle = Toggle({ value: 1, onChange: (self) => println(self.value) });
toggle.switch();
toggle.setValue(0);                             // onChange is called
toggle.setValue(1, 1);                          // silent: onChange is not called
toggle.setBackgroundSelectedColor("tomato");
Toggle({ styleName: "classic" });
Toggle({ styleName: "classic", backgroundStyle: { selectedColor: "#6AC966" } }); // A green classic toggle
Toggle({ styleName: "outline" });
Toggle({ onMark: "check", offMark: "cross", markPlace: "knob" });
Toggle({ styleName: "label", onMark: "AÇIK", offMark: "KAPALI", width: 92 }); // A param you give wins.
Toggle({ styleName: "badge", animated: 0 });    // No motion

Started Date: August 2025
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ToggleDefaults = {
    key: "0",
    width: 70, // Standard box features are added automatically.
    height: 40,
    spacing: 3, // px: between the track and the knob
    value: 0,
    invertColor: 0,
    offButtonScale: 0.6, // The size of the knob when off. (1: the same size as on)
    onMark: "", // Shows when on: "check", "cross" or a text ("ON"). "": nothing
    offMark: "", // Shows when off
    markPlace: "track", // "track": on the free side of the track, "knob": in the knob (Only at create time)
    animated: 1, // 1: small motions of a toggle with marks. (box.setAnimated(0/1))
    focusRingColor: "", // the ring of the keyboard focus. "": the ring of basic.js
    markStyle: {
        size: 16, // px: a check or a cross
        lineWidth: 3.5, // of a check or a cross, on a 24 px grid
        fontSize: 12, // a text
        color: Black(0.5), // off
        selectedColor: White(0.95), // on
    },
    onChange: function(self) {}, // self.value changed (a click, a key, setValue()). Not at create time, not with setValue(value, 1)
    backgroundStyle: { // The track
        color: "whitesmoke", // off
        selectedColor: "#689BD2", // on
        border: 1,
        borderColor: Black(0.05),
        selectedBorderColor: "", // on. "": the same as borderColor
        round: 100,
    },
    buttonStyle: { // The knob
        color: Black(0.15), // off
        selectedColor: White(0.95), // on
        border: 0,
        round: 100,
        shadow: "none", // off
        selectedShadow: "-1px 0px 4px rgba(0, 0, 0, 0.15)", // on
    },
    styleName: "ozden", // "ozden", "ozdenDark", "light", "dark", "classic", "float", "round", "slim", "outline", "square", "tick", "badge", "label", "minimal", "minimalDark" or a name added to Toggle.styles
    style: {}, // WHY: the look is in the params above; the packages are packages of params (see Toggle.styles).
};

const Toggle = function(params = {}) {

    // WHY copies: a page gives the same styles to many toggles ({ ...DARK_TOGGLE }); the merges below and
    //      setBackgroundSelectedColor() wrote into them, so one toggle changed the others.
    ["backgroundStyle", "buttonStyle", "markStyle"].forEach(function(name) {
        if (params[name]) params[name] = Object.assign({}, params[name]);
    });
    // WHY: a page that gives its own line of the track (borderColor) keeps it when on too, as before: the line
    //      of a package when on (ozden: selectedBorderColor) is for the colors of that package.
    const ownStyle = params.backgroundStyle || {};
    const keepsOwnLine = (ownStyle.borderColor !== undefined && ownStyle.selectedBorderColor === undefined);

    // Merge style package: your params > Toggle.styles[styleName] (a package of params) > ToggleDefaults
    basic.applyStylePackage(params, Toggle.styles, ToggleDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ToggleDefaults);
    if (keepsOwnLine) params.backgroundStyle.selectedBorderColor = ""; // ("": the line of borderColor)

    // Edit params, if needed:
    // WHY: a switch keeps its size in a row: a narrow row made it narrower than its knob needs (the knob is placed
    //      for its width). A page can give shrink: 1.
    if (params.shrink === undefined) params.shrink = 0;
    params.color = "transparent";
    params.clickable = 1;
    params.clipContent = 0;

    // BOX: Component container
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    let buttonSize = 0; // Set by box.refresh() from the size of the box.
    let distance = 0; // How far the button moves when it is on.
    const HOVER_BRIGHTNESS = "103%";
    const DISABLED_BRIGHTNESS = "90%";
    const DISABLED_OPACITY = 0.75;

    const isMarkInKnob = (box.markPlace === "knob");
    let isPressed = false; // The knob gets flatter while it is pressed (animated)
    let wasAnimated = false;

    // animated: 1
    const MOTION_TIME = "0.2s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start and a soft stop
    const SPRING_TIME = "0.25s";
    const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // a small overshoot: a mark that turns in the knob
    const HIDDEN_MARK_SCALE = 0.6;
    const HIDDEN_MARK_TURN = 90; // deg: a mark in the knob
    const HIDDEN_MARK_SHIFT = 6; // px: a mark on the track stays behind the knob that leaves
    const HOVER_ICON_SCALE = 1.1;
    const PRESSED_KNOB_SCALE_X = 1.1;
    const PRESSED_KNOB_SCALE_Y = 0.92;

    // *** PRIVATE FUNCTIONS:

    const hasMarks = () => !!(box.onMark || box.offMark);

    // WHY only a drawn mark (check, cross) moves: a small motion of a text (ON / OFF) looked like a fault.
    const isMovingMark = (mark) => !!Toggle.MARK_PATHS[mark];

    const isMotionOn = function() {
        if (box.animated != 1 || !hasMarks()) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    // The knob: its size and its place. Flatter while it is pressed (animated).
    const getKnobTransform = function() {
        const isOn = (box.state === "selected");
        const moved = `translateX(${isOn ? distance : 0}px)`;
        if (isPressed && isMotionOn()) return `${moved} scale(${PRESSED_KNOB_SCALE_X}, ${PRESSED_KNOB_SCALE_Y})`;
        // WHY this order: with animated: 0 the transform text stays as it always was.
        return `scale(${isOn ? 1 : box.offButtonScale}) ${moved}`;
    };

    const getHiddenMarkTransform = function(isOnMark) {
        const direction = isOnMark ? 1 : -1;
        if (isMarkInKnob) return `rotate(${direction * HIDDEN_MARK_TURN}deg) scale(${HIDDEN_MARK_SCALE})`;
        return `translateX(${-direction * HIDDEN_MARK_SHIFT}px) scale(${HIDDEN_MARK_SCALE})`;
    };

    const getShownMarkTransform = function() {
        if (box.secondState !== "mouseover") return "none";
        return `scale(${HOVER_ICON_SCALE})`;
    };

    const getMarkTransform = function(mark, isShown, isOnMark) {
        if (!isMovingMark(mark)) return "none";
        return isShown ? getShownMarkTransform() : getHiddenMarkTransform(isOnMark);
    };

    // The look of the state of the marks. (Nothing when animated is off.)
    const paintMotion = function() {
        box.button.css.transform = getKnobTransform();
        if (!isMotionOn()) return;
        const isOn = (box.state === "selected");
        box.onMarkBox.css.transform = getMarkTransform(box.onMark, isOn, true);
        box.offMarkBox.css.transform = getMarkTransform(box.offMark, !isOn, false);
    };

    const setPressed = function(value) {
        isPressed = value;
        paintMotion();
    };

    // The transitions and the still look of animated: 0.
    const applyAnimated = function() {
        const isOn = isMotionOn();
        if (!isOn && !wasAnimated) return;
        const transformMotion = isMarkInKnob ? SPRING_TIME + " " + SPRING_EASE : MOTION_TIME + " " + MOTION_EASE;
        [[box.onMarkBox, box.onMark], [box.offMarkBox, box.offMark]].forEach(function([markBox, mark]) {
            const isMoving = isOn && isMovingMark(mark);
            markBox.setMotion(isMoving ? `opacity ${MOTION_TIME} ${MOTION_EASE}, transform ${transformMotion}` : "none");
            if (!isMoving) markBox.css.transform = "none";
        });
        wasAnimated = isOn;
        paintMotion();
    };

    // The picture of a mark: Toggle.MARK_PATHS, drawn in its color.
    const getMarkIcon = function(path, color) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}"`
            + ` stroke-width="${box.markStyle.lineWidth}" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
        return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    };

    const drawMark = function(markBox, mark, color) {
        const _m = box.markStyle;
        markBox.children.forEach((child) => child.remove());
        if (!mark) return;
        const path = Toggle.MARK_PATHS[mark];
        createIn(markBox, function() {
            if (path) {
                Icon({ width: _m.size, height: _m.size }).load(getMarkIcon(path, color));
                return;
            }
            Label({ plainText: mark, fontSize: _m.fontSize, bold: 1, textColor: color, css: { whiteSpace: "nowrap" } });
        });
    };

    const createMarkBox = function() {
        const markBox = HGroup({ left: 0, top: 0, width: "100%", height: "100%", align: "center center", opacity: 0 });
        endGroup();
        return markBox;
    };

    const createMarks = function() {
        box.onMarkBox = createMarkBox();
        box.offMarkBox = createMarkBox();
    };

    // WHY only on the track: a mark in the knob fills the knob and moves with it.
    const placeMarks = function() {
        if (isMarkInKnob) return;
        box.onMarkBox.props({ left: box.spacing, width: distance });
        box.offMarkBox.props({ left: box.spacing + buttonSize, width: distance });
    };

    // *** PUBLIC VARIABLES:
    box.state = ""; // "normal", "selected"
    box.secondState = ""; // "normal", "mouseover", "disabled"

    // *** PUBLIC FUNCTIONS:
    box.switch = function() {
        box.setValue((box.value === 1) ? 0 : 1);
    };
    
    // silent: 1 -> onChange is not called.
    box.setValue = function(value, silent = 0) {

        if (value === box.value) return; // the same value: nothing to draw, no onChange
        box.value = value;

        box.setState((value === 1) ? "selected" : "normal");
        if (!silent) box.onChange(box);

    };

    box.setBackgroundSelectedColor = function(color) {
        box.backgroundStyle.selectedColor = color;
        if (box.value === 1) box.background.color = color;
    };

    box.setState = function(state) {
        
        box.state = state;
        box.aria = { checked: state === "selected" };

        switch(state) {

            case "normal":

                box.button.color = box.buttonStyle.color;
                box.button.boxShadow = box.buttonStyle.shadow;
                box.background.color = box.backgroundStyle.color;
                box.background.borderColor = box.backgroundStyle.borderColor;
                box.onMarkBox.opacity = 0;
                box.offMarkBox.opacity = 1;

                break;

            case "selected":

                box.button.color = box.buttonStyle.selectedColor;
                box.button.boxShadow = box.buttonStyle.selectedShadow;
                box.background.color = box.backgroundStyle.selectedColor;
                box.background.borderColor = box.backgroundStyle.selectedBorderColor || box.backgroundStyle.borderColor;
                box.onMarkBox.opacity = 1;
                box.offMarkBox.opacity = 0;
                
                break;

        }

        paintMotion();
    };

    box.setMarks = function(onMark, offMark) {
        box.onMark = onMark;
        box.offMark = offMark;
        drawMark(box.onMarkBox, onMark, box.markStyle.selectedColor);
        drawMark(box.offMarkBox, offMark, box.markStyle.color);
        applyAnimated();
    };
    // USAGE: toggle.setMarks("ON", "OFF")

    box.setAnimated = function(value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: toggle.setAnimated(0)

    box.setSecondState = function(state) {
        
        box.secondState = state;
        if (state !== "disabled") {
            box.tabIndex = 0;
            box.aria = { disabled: null };
        }

        switch(state) {

            case "normal":

                box.background.css.filter = "brightness(100%)";
                box.opacity = 1;
                box.clickable = 1;
                paintMotion();

                break;

            case "mouseover":
                
                box.background.css.filter = `brightness(${HOVER_BRIGHTNESS})`;
                box.opacity = 1;
                box.clickable = 1;
                paintMotion();
            
                break;

            case "disabled":

                box.background.css.filter = `brightness(${DISABLED_BRIGHTNESS})`;
                box.opacity = DISABLED_OPACITY;
                box.clickable = 0;
                box.tabIndex = -1;
                box.aria = { disabled: true };

                break;

        }
    };

    box.refresh = function() {

        buttonSize = box.height - (box.spacing * 2);
        distance = box.width - (box.spacing * 2) - buttonSize;

        box.button.props({
            left: box.spacing,
            top: box.spacing,
            width: buttonSize,
            height: buttonSize,
        });
        placeMarks();

        box.setState((box.value === 1) ? "selected" : "normal");
        box.setSecondState(box.secondState || "normal");

    };

    // *** OBJECT VIEW:
    box.cursor = "pointer";
    box.role = "switch";
    box.setFocusRing(box.focusRingColor || undefined);
    box.round = box.backgroundStyle.round; // WHY: the ring of the focus follows the shape of the track
    if(box.invertColor === 1) box.css.filter = "invert(100%)";

        // BOX: background
        box.background = Box(0, 0, "100%", "100%", box.backgroundStyle);
        box.background.setMotion("background-color 0.2s, border-color 0.2s");

        // GROUPS: The marks on the track (under the knob)
        if (!isMarkInKnob) createMarks();

        // BOX: The round button (it slides to the right when on)
        box.button = Box(box.buttonStyle);
        that.setMotion("transform 0.2s");

        // GROUPS: The marks in the knob
        if (isMarkInKnob) createIn(box.button, createMarks);

    // *** OBJECT INIT CODE:
    box.setMarks(box.onMark, box.offMark);
    box.on("pointerdown", () => setPressed(true));
    ["pointerup", "pointerleave", "pointercancel"].forEach((name) => box.on(name, () => setPressed(false)));
    box.on("click", function(self, event) {
        if (box.secondState === "disabled") return; // WHY: as the keys: a click from code or assistive tools
        box.switch();
    });
    box.on("keydown", function(self, event) {
        const isPressKey = (event.key === " " || event.key === "Enter");
        if (!isPressKey || event.repeat || box.secondState === "disabled") return;
        event.preventDefault(); // WHY: Space would scroll the page.
        box.switch();
    });
    // WHY the disabled check: a toggle disabled under the mouse (in its own onChange, while saving) was enabled again
    //     by the next mouseout (clickable 0 itself fires one; on a phone: the next tap anywhere)
    box.on("mouseover", function(self, event) {
        if (box.secondState === "disabled") return;
        box.setSecondState("mouseover");
    });
    box.on("mouseout", function(self, event) {
        if (box.secondState === "disabled") return;
        box.setSecondState("normal");
    });
    box.onResize(function(self) {
        box.refresh();
    });

    box.refresh();
    applyAnimated(); // WHY after refresh(): the first paint has its place; the transitions do not move it.
    
    return endObject(box);

};

// *** STYLE PACKAGES:
// The marks that are drawn: Toggle({ onMark: "check" }). (24 x 24, a line)
Toggle.MARK_PATHS = {
    check: "M5 12.5l4.5 4.5L19 7.5",
    cross: "M6.5 6.5l11 11M17.5 6.5l-11 11",
};

// USAGE: Toggle({ styleName: "classic" })
// USAGE: Toggle({ styleName: "classic", backgroundStyle: { selectedColor: "#6AC966" } }) // A param you give wins.
// NOTE: Every package has "style: {}": that is the mark of a package of params (basic.js v26.10.27).
//       Without it the keys would go into params.style and change nothing.
// NOTE: A package needs only the params that differ from ToggleDefaults.
// USAGE: Toggle.styles.myStyle = { style: {}, backgroundStyle: { selectedColor: "tomato" } };
Toggle.styles = {

    // The look of ToggleDefaults: a whitesmoke track that turns blue, a small gray knob that grows when on.
    // A darker line around the colored track when on (the light look had no clear edge when on);
    // a page with its own line (borderColor) keeps it.
    // WHY the two shadows of the knob when on (the white knob did not stand out on its track):
    // the first falls only to the left, its negative spread keeps it inside the track. The second is the thin line
    // around the knob, in the strength of the line of the track. A real border would be gray over the white knob (no
    // sharper edge), and it would need a color for each state.
    ozden: {
        style: {},
        height: 36,
        width: 65,
        onMark: "ON", // Shows when on: "check", "cross" or a text ("ON"). "": nothing
        offMark: "OFF", // Shows when off
        backgroundStyle: { selectedBorderColor: Black(0.2) }, // over the color: a darker line of it
        buttonStyle: {
            selectedShadow: "-4px 0px 6px -1px rgba(0, 0, 0, 0.5), 0px 0px 0px 1px rgba(0, 0, 0, 0.2)",
        },
    },

    // For a dark page: a black track that turns green, a soft knob (the dark card of toggle.htm).
    ozdenDark: {
        style: {},
        height: 36,
        width: 65,
        onMark: "ON", // Shows when on: "check", "cross" or a text ("ON"). "": nothing
        offMark: "OFF", // Shows when off
        backgroundStyle: { color: "black", selectedColor: "#2C5A38", borderColor: White(0.25) },
        buttonStyle: { color: White(0.25), selectedColor: White(0.75) },
        markStyle: { color: White(0.6) }, // WHY: OFF on the black track; the black of the default was not seen
    },

    // The light look of the kit (_designs/toggle.htm): a flat gray pill that turns to the accent, a white knob of the
    // same size on and off with a soft shadow.
    light: {
        style: {},
        width: 52,
        height: 30,
        spacing: 3,
        offButtonScale: 1,
        focusRingColor: "rgba(61, 122, 107, 0.5)",
        markStyle: { size: 12, lineWidth: 3, fontSize: 11, color: Black(0.45), selectedColor: "#FFFFFF" },
        backgroundStyle: { color: "#D4D5D1", selectedColor: "#3D7A6B", border: 0, borderColor: "transparent", selectedBorderColor: "", round: 100 },
        buttonStyle: { color: "#FFFFFF", selectedColor: "#FFFFFF", round: 100, shadow: "0 1px 2px rgba(0, 0, 0, 0.25)", selectedShadow: "0 1px 2px rgba(0, 0, 0, 0.25)" },
    },

    // The dark look of the kit: the same shapes on a dark page, a dark gray pill and a light knob.
    dark: {
        style: {},
        width: 52,
        height: 30,
        spacing: 3,
        offButtonScale: 1,
        focusRingColor: "rgba(101, 162, 147, 0.55)",
        markStyle: { size: 12, lineWidth: 3, fontSize: 11, color: White(0.7), selectedColor: "#0F1F1B" },
        backgroundStyle: { color: "#3A3A38", selectedColor: "#65A293", border: 0, borderColor: "transparent", selectedBorderColor: "", round: 100 },
        buttonStyle: { color: "#CFCFCD", selectedColor: "#FFFFFF", round: 100, shadow: "0 1px 2px rgba(0, 0, 0, 0.5)", selectedShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" },
    },

    // For a 600 px design:
    // a light gray track that turns blue, a white knob of the same size on and off; its shadow falls to the
    // middle of the track.
    classic: {
        style: {},
        width: 60,
        height: 40,
        spacing: 4, // WHY: a 32 px knob (40 - 2 x spacing)
        offButtonScale: 1,
        backgroundStyle: {
            color: "lightgray",
            selectedColor: "#3871E0",
            border: 0,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            shadow: "1px 0px 6px rgba(0, 0, 0, 0.3)",
            selectedShadow: "-1px 0px 6px rgba(0, 0, 0, 0.6)",
        },
    },

    // WHY the track has its own place: the 30 px knob is bigger than the 26 px track.
    float: {
        style: {},
        width: 56,
        height: 30,
        spacing: 0,
        offButtonScale: 1,
        backgroundStyle: {
            left: 1,
            top: 2,
            width: 54,
            height: 26,
            color: "#F1F1F1",
            selectedColor: "#CFC3DD", // lavender
            border: 0,
            round: 20,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "#8E8EB3", // periwinkle
            round: 16,
            shadow: "0px 0px 6px rgba(0, 0, 0, 0.4)",
            selectedShadow: "0px 0px 6px rgba(0, 0, 0, 0.4)",
        },
    },

    round: {
        style: {},
        width: 60,
        height: 40,
        spacing: 2,
        offButtonScale: 1,
        backgroundStyle: {
            color: "lightgray",
            selectedColor: "#68AF8E", // jade
            border: 0,
            round: 20,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            round: 18,
            shadow: "2px 0px 4px rgba(0, 0, 0, 0.3)",
            selectedShadow: "-2px 0px 4px rgba(0, 0, 0, 0.5)",
        },
    },

    slim: {
        style: {},
        width: 56,
        height: 28,
        spacing: 2,
        offButtonScale: 1,
        backgroundStyle: {
            color: "lightgray",
            selectedColor: "#60AEAC", // teal
            border: 0,
            round: 28,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            round: 16,
            shadow: "none",
            selectedShadow: "0px 0px 8px rgba(0, 0, 0, 0.4)",
        },
    },

    // WHY selectedBorderColor: the line stays when on, in the color of the track: the knob does not move.
    outline: {
        style: {},
        width: 60,
        height: 30,
        spacing: 5,
        offButtonScale: 1,
        backgroundStyle: {
            color: "white",
            selectedColor: "#8FA6BE", // fog blue
            border: 3,
            borderColor: "#8FA6BE",
            selectedBorderColor: "#8FA6BE",
            round: 20,
        },
        buttonStyle: {
            color: "#8FA6BE",
            selectedColor: "white",
            round: 16,
            shadow: "none",
            selectedShadow: "none",
        },
    },

    square: {
        style: {},
        width: 56,
        height: 34,
        spacing: 1,
        offButtonScale: 1,
        backgroundStyle: {
            color: "lightgray",
            selectedColor: "#C08BBE", // orchid
            border: 0,
            round: 3,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            round: 3,
            shadow: "2px 0px 3px rgba(0, 0, 0, 0.2)",
            selectedShadow: "-2px 0px 3px rgba(0, 0, 0, 0.2)",
        },
    },

    // A check or a cross on the free side of the track.
    tick: {
        style: {},
        width: 72,
        height: 36,
        spacing: 3,
        offButtonScale: 1,
        onMark: "check",
        offMark: "cross",
        markStyle: { size: 18, lineWidth: 2.5, color: "#5F6577", selectedColor: "white" },
        backgroundStyle: {
            color: "#D9DCE3",
            selectedColor: "#7A60F0",
            border: 0,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            shadow: "0px 1px 4px rgba(0, 0, 0, 0.2)",
            selectedShadow: "0px 1px 4px rgba(0, 0, 0, 0.2)",
        },
    },

    // A check or a cross in the knob: the track tells the state too (green / red).
    badge: {
        style: {},
        width: 72,
        height: 36,
        spacing: 3,
        offButtonScale: 1,
        onMark: "check",
        offMark: "cross",
        markPlace: "knob",
        markStyle: { size: 18, color: "#B55449", selectedColor: "#3A7756" },
        backgroundStyle: {
            color: "#EBC9C4",
            selectedColor: "#C3DBCE",
            border: 0,
        },
        buttonStyle: {
            color: "#F4F4F2",
            selectedColor: "#F4F4F2",
            shadow: "0px 1px 3px rgba(0, 0, 0, 0.25)",
            selectedShadow: "0px 1px 3px rgba(0, 0, 0, 0.25)",
        },
    },

    // ON / OFF on the free side of the track, small corners.
    label: {
        style: {},
        width: 68,
        height: 30,
        spacing: 2,
        offButtonScale: 1,
        onMark: "ON",
        offMark: "OFF",
        markStyle: { fontSize: 11, color: "#5F6577", selectedColor: "white" },
        backgroundStyle: {
            color: "#D9DBE1",
            selectedColor: "#D46864",
            border: 0,
            round: 6,
        },
        buttonStyle: {
            color: "white",
            selectedColor: "white",
            round: 5,
            shadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
            selectedShadow: "0px 1px 2px rgba(0, 0, 0, 0.2)",
        },
    },

};

// The minimal theme (_designs/minimal-theme.htm): a 28 x 16 track of a line, no fill; the 10 px knob is at the left in
// the line color when off, at the right in ink with an ink line around the track when on.
Toggle.createMinimalStyle = function (colors) {
    return {
        style: {},
        width: 28,
        height: 16,
        spacing: 3, // WHY: a 10 px knob (16 - 2 x 3)
        offButtonScale: 1,
        focusRingColor: colors.focus,
        backgroundStyle: { color: "transparent", selectedColor: "transparent", border: 1, borderColor: colors.line, selectedBorderColor: colors.ink, round: 100 },
        buttonStyle: { color: colors.knob, selectedColor: colors.ink, border: 0, round: 100, shadow: "none", selectedShadow: "none" },
        markStyle: { color: colors.knob, selectedColor: colors.ink },
    };
};
// WHY a strong line: the line of the track shows the toggle (3:1 at least, as WCAG asks of a control)
Toggle.MINIMAL_COLORS = { line: Black(0.45), knob: Black(0.45), ink: "#1F1F1F", focus: "#3D8BD9" };
Toggle.styles.minimal = Toggle.createMinimalStyle(Toggle.MINIMAL_COLORS);
Toggle.MINIMAL_DARK_COLORS = { line: White(0.42), knob: White(0.42), ink: "#EDEDEB", focus: "#7FB6DE" };
Toggle.styles.minimalDark = Toggle.createMinimalStyle(Toggle.MINIMAL_DARK_COLORS);
