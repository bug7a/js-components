/* Bismillah */

/*

LoadingScreen - v26.09

UI COMPONENT
- A full cover that is shown while an app or a page is getting ready (a splash / loading screen).
  It covers its container (the page by default) and fades out when close() is called.
- Parts (all optional): an icon (an image file or an SVG text), a title, a message, a spinner
  ("ring", "dots" or "clock") and a progress bar (setProgress(0 - 1)).
- spinnerType "clock": the clock of the waiting views
  (a white face, a dark edge and dark hands) with moving hands: the minute hand turns fast, the hour hand 12 times
  slower. Always 30 px: the hour hand 2 px, the minute hand (the long one) 2 px in indianred, and an
  indianred dot (4 px) in the middle over the place where the hands meet. Drawn as SVG in px (no file);
  style.clock. The hands stand still with prefers-reduced-motion.
  THE DEFAULT WAIT: spinnerType is "clock" by default. Its two looks are LoadingScreen.clocks
  "ozden" (a white face, dark lines: the default) and "ozdenDark" (a dark face, light lines, a yellow minute hand); the style packages
  "ozden" and "ozdenDark" are the screens made for them.
- NEEDS comp/smart-button.js, loaded first: the clock and the dots are the drawings of SmartButton
  (SmartButton.clocks, createClockSvg, createDots): one drawing for the whole suite.
- minDuration: the screen stays at least this long, so a fast load does not show a short flash.
- The cover takes the clicks, so nothing under it can be clicked while it is open.
- Style packages: "light" (default), "dark", "ozden", "ozdenDark", "minimal", "minimalDark". Select with styleName.
  (LoadingScreen.styles) The minimal packages wait with the ring of the minimal SmartButton.
- NOTE: The methods are open() / close(), not show() / hide(): those are basic.js methods of every
  object (they only change "visible").

USAGE:
const loading = LoadingScreen({ styleName: "dark", iconFile: "icon/icon-192.png", titleText: "My App" });
loading.close();                                   // Fades out (after minDuration).
loading.open();                                    // Shows it again.
loading.setMessageText("Loading the data...");
loading.setProgress(0.4);                          // A progress bar under the spinner. -1 hides it.
LoadingScreen({ spinnerType: "dots", removeOnClose: 1, onClose: (self) => println("ready") });
LoadingScreen({ spinnerType: "clock", messageText: "Saving..." });   // The moving clock

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const LoadingScreenDefaults = {
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    styleName: "light", // "light", "dark", "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to LoadingScreen.styles
    iconFile: "", // An image file (Ex: the app icon)
    iconSvg: "", // Or an SVG text (works with no file, also offline)
    titleText: "",
    allowHtml: 0, // 1: titleText and messageText are HTML, only for your own texts (Ex: "Please wait.<br>It takes a few seconds.")
    messageText: "",
    spinnerType: "clock", // "clock" (the default wait, the user), "ring", "dots", "none"
    progress: -1, // 0 - 1: a progress bar is shown. -1: no progress bar
    opened: 1, // 0: created closed, open() shows it
    minDuration: 600, // ms. A close() before this time waits. (No short flash on a fast load)
    fadeDuration: 0.35, // seconds
    removeOnClose: 0, // 1: The object is removed after it is closed (a splash screen that is used once)
    onClose: function (self) { }, // After the fade out
    style: {
        box: {
            color: "#FFFFFF",
        },
        layout: {
            gap: 14,
            padding: 30,
        },
        icon: {
            size: 72,
            round: 16,
            marginBottom: 6,
        },
        title: {
            fontSize: 20,
            textColor: Black(0.85),
            bold: 1,
        },
        message: {
            width: 300,
            fontSize: 15,
            textColor: Black(0.5),
        },
        spinner: {
            size: 30,
            thickness: 3,
            color: "#3D7A6B",
            trackColor: Black(0.1),
            speed: 0.8, // seconds for one turn
            marginTop: 8,
        },
        dots: {
            size: 9,
            gap: 7,
            color: "#3D7A6B",
        },
        clock: SmartButton.clocks.ozden, // the ozden clock of SmartButton (LoadingScreen.clocks)
        progress: {
            width: 180,
            height: 4,
            color: "#3D7A6B",
            trackColor: Black(0.08),
            round: 100,
        },
    },
};

const LoadingScreen = function (params = {}) {

    // Merge style package: params.style > LoadingScreen.styles[styleName] > LoadingScreenDefaults.style (light)
    basic.applyStylePackage(params, LoadingScreen.styles, LoadingScreenDefaults);

    // Merge params:
    mergeIntoIfMissing(params, LoadingScreenDefaults);

    // Edit params, if needed:
    params.color = params.style.box.color;

    LoadingScreen.injectCss();

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let openedTime = 0;
    let cancelClose = null; // (box.after: the timers are stopped by remove())
    let cancelFade = null;
    const PROGRESS_MOTION = "width 0.25s";

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.opened, box.progress, box.titleText)

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const clearTimers = function () {
        if (cancelClose) cancelClose();
        if (cancelFade) cancelFade();
        cancelClose = null;
        cancelFade = null;
    };

    const updateProgressView = function () {
        const hasProgress = (box.progress >= 0);
        box.progressTrack.visible = hasProgress ? 1 : 0;
        if (hasProgress) box.progressBar.css.width = (box.progress * 100) + "%";
    };

    const fadeOut = function () {
        cancelClose = null;
        box.opacity = 0;
        cancelFade = box.after(box.fadeDuration * 1000, function () {
            cancelFade = null;
            box.visible = 0;
            box.css.pointerEvents = "none";
            box.onClose(box);
            if (box.removeOnClose) box.remove();
        });
    };

    // *** PUBLIC FUNCTIONS:

    // Shows the screen again. (It is shown at create time, unless opened: 0)
    box.open = function () {
        clearTimers();
        box.opened = 1;
        openedTime = Date.now();
        box.setMotionNow("none");
        box.opacity = 1;
        box.visible = 1;
        box.css.pointerEvents = "auto"; // WHY: The cover takes the clicks. (basic.css: none)
        box.bringToFront();
    };

    // Fades out. Before minDuration it waits, so a fast load does not show a short flash.
    box.close = function () {
        if (!box.opened) return;
        box.opened = 0;
        clearTimers();
        box.setMotionNow("opacity " + box.fadeDuration + "s");
        const wait = Math.max(0, box.minDuration - (Date.now() - openedTime));
        cancelClose = box.after(wait, fadeOut);
    };

    box.setTitleText = function (text) {
        box.titleText = text || "";
        setText(box.titleLabel, box.titleText);
        box.titleLabel.visible = box.titleText ? 1 : 0;
    };

    box.setMessageText = function (text) {
        box.messageText = text || "";
        setText(box.messageLabel, box.messageText);
        box.messageLabel.visible = box.messageText ? 1 : 0;
    };

    // 0 - 1. -1 hides the progress bar.
    box.setProgress = function (value) {
        value = Number(value);
        box.progress = (isNaN(value) || value < 0) ? -1 : Math.min(value, 1);
        updateProgressView();
    };


    // *** OBJECT VIEW:

    // GROUP: Centered content
    box.content = VGroup({
        align: "center center",
        gap: _s.layout.gap,
        padding: _s.layout.padding,
    });

        // ICON: An image file or an SVG text
        if (box.iconFile) {
            box.icon = Icon({ width: _s.icon.size, height: _s.icon.size, round: _s.icon.round });
            box.icon.load(box.iconFile);
        } else if (box.iconSvg) {
            box.icon = Box({ width: _s.icon.size, height: _s.icon.size, color: "transparent" });
            box.icon.elem.innerHTML = box.iconSvg;
        }
        if (box.icon) {
            box.icon.css.marginBottom = _s.icon.marginBottom + "px";
            box.icon.shrink = 0;
        }

        // LABEL: Title
        box.titleLabel = Label({
            fontSize: _s.title.fontSize,
            textColor: _s.title.textColor,
        });
        setText(box.titleLabel, box.titleText);
        if (_s.title.bold) box.titleLabel.css.fontFamily = "opensans-bold";
        box.titleLabel.css.textAlign = "center";

        // LABEL: Message
        box.messageLabel = Label({
            width: _s.message.width,
            fontSize: _s.message.fontSize,
            textColor: _s.message.textColor,
        });
        setText(box.messageLabel, box.messageText);
        box.messageLabel.css = {
            textAlign: "center",
            lineHeight: "1.45",
        };

        // BOX: Spinner (ring)
        box.spinner = Box({
            width: _s.spinner.size,
            height: _s.spinner.size,
            color: "transparent",
            round: 100,
        });
        box.spinner.css = {
            border: _s.spinner.thickness + "px solid " + _s.spinner.trackColor,
            borderTopColor: _s.spinner.color,
            boxSizing: "border-box",
            animation: "loadingScreenSpin " + _s.spinner.speed + "s linear infinite",
            marginTop: _s.spinner.marginTop + "px",
        };
        box.spinner.shrink = 0;

        // GROUP: Spinner (dots: the drawing of SmartButton)
        box.dots = SmartButton.createDots(_s.dots);
        box.dots.css.marginTop = _s.spinner.marginTop + "px";

        // BOX: Spinner (clock: the drawing of SmartButton)
        box.clock = Box({ width: SmartButton.CLOCK_SIZE, height: SmartButton.CLOCK_SIZE, color: "transparent" });
        box.clock.elem.innerHTML = SmartButton.createClockSvg(_s.clock);
        box.clock.css.marginTop = _s.spinner.marginTop + "px";
        box.clock.shrink = 0;

        // BOX: Progress bar
        box.progressTrack = startBox({
            width: _s.progress.width,
            height: _s.progress.height,
            color: _s.progress.trackColor,
            round: _s.progress.round,
        });
        box.progressTrack.css.overflow = "hidden";
        box.progressTrack.shrink = 0;

            box.progressBar = Box(0, 0, 0, "100%", {
                color: _s.progress.color,
                round: _s.progress.round,
            });
            box.progressBar.setMotion(PROGRESS_MOTION);

        endBox();

    endGroup();

    // *** OBJECT INIT CODE:

    // WHY: A hidden object inside a group is not a flex item, so the parts are hidden after they are created.
    box.titleLabel.visible = box.titleText ? 1 : 0;
    box.messageLabel.visible = box.messageText ? 1 : 0;
    box.spinner.visible = (box.spinnerType === "ring") ? 1 : 0;
    box.dots.visible = (box.spinnerType === "dots") ? 1 : 0;
    box.clock.visible = (box.spinnerType === "clock") ? 1 : 0;
    box.setProgress(box.progress);

    if (box.opened) {
        box.opened = 0; // WHY: open() sets it.
        box.open();
    } else {
        box.visible = 0;
        box.css.pointerEvents = "none";
    }

    return endObject(box);

};

// *** THE CLOCKS: the two looks of the waiting clock: the clocks of SmartButton
LoadingScreen.clocks = SmartButton.clocks;

// *** STYLE PACKAGES:
// USAGE: LoadingScreen({ styleName: "dark" })
// USAGE: LoadingScreen({ styleName: "dark", style: { spinner: { color: "tomato" } } }) // Change only some keys.
// USAGE: LoadingScreen({ style: LoadingScreen.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: LoadingScreen.styles.myStyle = { box: { color: "#0B2239" } };
LoadingScreen.styles = {

    light: LoadingScreenDefaults.style,

    // The screens of the ozden clock: the colors of the ozden pages (#F0F1EE, #232323) and indianred
    ozden: {
        box: { color: "#F0F1EE" },
        title: { textColor: "#232323" },
        message: { textColor: "rgba(35, 35, 35, 0.6)" },
        spinner: { color: "indianred" },
        dots: { color: "indianred" },
        progress: { color: "indianred", trackColor: Black(0.08) },
        clock: LoadingScreen.clocks.ozden,
    },

    ozdenDark: { // (its accent is the yellow of the dark clock)
        box: { color: "#1B1B1B" },
        title: { textColor: White(0.9) },
        message: { textColor: White(0.55) },
        spinner: { color: "#F1C74A", trackColor: White(0.12) },
        dots: { color: "#F1C74A" },
        progress: { color: "#F1C74A", trackColor: White(0.12) },
        clock: LoadingScreen.clocks.ozdenDark,
    },

    dark: {
        box: {
            color: "#141414",
        },
        title: {
            textColor: White(0.9),
        },
        message: {
            textColor: White(0.55),
        },
        spinner: {
            color: "#5FB39F",
            trackColor: White(0.12),
        },
        dots: {
            color: "#5FB39F",
        },
        progress: {
            color: "#5FB39F",
            trackColor: White(0.12),
        },
    },

};

// The minimal theme (_designs/minimal-theme.htm): the ground of the window, small texts (15 px title, 13 px message),
// the waiting ring of the minimal SmartButton, 2 px ink lines for the ring, the other spinners and the progress bar.
// minimalDark: the same on a dark window.
LoadingScreen.createMinimalStyle = function (colors) {
    return {
        box: { color: colors.ground },
        layout: { gap: 10, padding: 24 },
        icon: { size: 48, round: 8, marginBottom: 4 },
        title: { fontSize: 15, textColor: colors.text, bold: 1 },
        message: { width: 260, fontSize: 13, textColor: colors.softText },
        spinner: { size: 24, thickness: 2, color: colors.ink, trackColor: colors.track, speed: 0.8, marginTop: 6 },
        dots: { size: 6, gap: 5, color: colors.ink },
        clock: Object.assign({}, colors.ring, { edgeWidth: 2 }), // WHY 2: the line of the progress bar under it (the button ring is drawn smaller)
        progress: { width: 160, height: 2, color: colors.ink, trackColor: colors.track, round: 1 },
    };
};
LoadingScreen.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), ink: "#1F1F1F", track: Black(0.12), ring: LoadingScreen.clocks.minimal };
LoadingScreen.styles.minimal = LoadingScreen.createMinimalStyle(LoadingScreen.MINIMAL_COLORS);
LoadingScreen.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), ink: "#EDEDEB", track: White(0.14), ring: LoadingScreen.clocks.minimalDark };
LoadingScreen.styles.minimalDark = LoadingScreen.createMinimalStyle(LoadingScreen.MINIMAL_DARK_COLORS);

// The animations can not be set with inline styles. (the clock and the dots: SmartButton.injectCss)
LoadingScreen.injectCss = function () {
    basic.addCss("loading-screen-css",
        "@keyframes loadingScreenSpin { to { transform: rotate(360deg); } }");
};
