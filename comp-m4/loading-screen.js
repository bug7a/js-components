/* Bismillah */

/*

LoadingScreen - v26.09

UI COMPONENT
- A full cover that is shown while an app or a page is getting ready (a splash / loading screen).
  It covers its container (the page by default) and fades out when close() is called.
- Parts (all optional): an icon (an image file or an SVG text), a title, a message, a spinner
  ("ring" or "dots") and a progress bar (setProgress(0 - 1)).
- minDuration: the screen stays at least this long, so a fast load does not show a short flash.
- The cover takes the clicks, so nothing under it can be clicked while it is open.
- Style packages: "light" (default), "dark". Select with styleName. (LoadingScreen.styles)
- NOTE: The methods are open() / close(), not show() / hide(): those are basic.js methods of every
  object (they only change "visible").

USAGE:
const loading = LoadingScreen({ styleName: "dark", iconFile: "icon/icon-192.png", titleText: "My App" });
loading.close();                                   // Fades out (after minDuration).
loading.open();                                    // Shows it again.
loading.setMessage("Loading the data...");
loading.setProgress(0.4);                          // A progress bar under the spinner. -1 hides it.
LoadingScreen({ spinnerType: "dots", removeOnClose: 1, onClose: (self) => println("ready") });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const LoadingScreenDefaults = {
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    styleName: "light", // "light", "dark" or a name added to LoadingScreen.styles
    iconFile: "", // An image file (Ex: the app icon)
    iconSvg: "", // Or an SVG text (works with no file, also offline)
    titleText: "",
    messageText: "", // HTML can be used (Ex: "Please wait.<br>It takes a few seconds.")
    spinnerType: "ring", // "ring", "dots", "none"
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
    const _styleName = params.styleName || LoadingScreenDefaults.styleName;
    const _stylePackage = LoadingScreen.styles[_styleName];
    if (!_stylePackage) console.warn("LoadingScreen: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

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
    let closeTimer = null;
    let fadeTimer = null;

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.opened, box.progress, box.titleText)

    // *** PRIVATE FUNCTIONS:

    const clearTimers = function () {
        clearTimeout(closeTimer);
        clearTimeout(fadeTimer);
        closeTimer = null;
        fadeTimer = null;
    };

    const updateProgressView = function () {
        const hasProgress = (box.progress >= 0);
        box.progressTrack.visible = hasProgress ? 1 : 0;
        if (hasProgress) box.progressBar.elem.style.width = (box.progress * 100) + "%";
    };

    const fadeOut = function () {
        closeTimer = null;
        box.opacity = 0;
        fadeTimer = setTimeout(function () {
            fadeTimer = null;
            box.visible = 0;
            box.elem.style.pointerEvents = "none";
            box.onClose(box);
            if (box && box.removeOnClose) box.remove();
        }, box.fadeDuration * 1000);
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
        box.elem.style.pointerEvents = "auto"; // WHY: The cover takes the clicks. (basic.css: none)
        box.bringToFront();
    };

    // Fades out. Before minDuration it waits, so a fast load does not show a short flash.
    box.close = function () {
        if (!box.opened) return;
        box.opened = 0;
        clearTimers();
        box.setMotionNow("opacity " + box.fadeDuration + "s");
        const wait = Math.max(0, box.minDuration - (Date.now() - openedTime));
        closeTimer = setTimeout(fadeOut, wait);
    };

    box.setTitle = function (text) {
        box.titleText = text || "";
        box.titleLabel.text = box.titleText;
        box.titleLabel.visible = box.titleText ? 1 : 0;
    };

    box.setMessage = function (text) {
        box.messageText = text || "";
        box.messageLabel.text = box.messageText;
        box.messageLabel.visible = box.messageText ? 1 : 0;
    };

    // 0 - 1. -1 hides the progress bar.
    box.setProgress = function (value) {
        value = Number(value);
        box.progress = (isNaN(value) || value < 0) ? -1 : Math.min(value, 1);
        updateProgressView();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        clearTimers();
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
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
            box.icon.elem.style.marginBottom = _s.icon.marginBottom + "px";
            box.icon.elem.style.flexShrink = "0";
        }

        // LABEL: Title
        box.titleLabel = Label({
            text: box.titleText,
            fontSize: _s.title.fontSize,
            textColor: _s.title.textColor,
        });
        if (_s.title.bold) box.titleLabel.elem.style.fontFamily = "opensans-bold";
        box.titleLabel.elem.style.textAlign = "center";

        // LABEL: Message
        box.messageLabel = Label({
            text: box.messageText,
            width: _s.message.width,
            fontSize: _s.message.fontSize,
            textColor: _s.message.textColor,
        });
        box.messageLabel.elem.style.textAlign = "center";
        box.messageLabel.elem.style.lineHeight = "1.45";

        // BOX: Spinner (ring)
        box.spinner = Box({
            width: _s.spinner.size,
            height: _s.spinner.size,
            color: "transparent",
            round: 100,
        });
        box.spinner.elem.style.border = _s.spinner.thickness + "px solid " + _s.spinner.trackColor;
        box.spinner.elem.style.borderTopColor = _s.spinner.color;
        box.spinner.elem.style.boxSizing = "border-box";
        box.spinner.elem.style.animation = "loadingScreenSpin " + _s.spinner.speed + "s linear infinite";
        box.spinner.elem.style.marginTop = _s.spinner.marginTop + "px";
        box.spinner.elem.style.flexShrink = "0";

        // GROUP: Spinner (dots)
        box.dots = HGroup({ hug: 1, gap: _s.dots.gap });
        box.dots.elem.style.marginTop = _s.spinner.marginTop + "px";
            for (let i = 0; i < 3; i++) {
                Box({ width: _s.dots.size, height: _s.dots.size, color: _s.dots.color, round: 100 });
                that.elem.style.animation = "loadingScreenDot 1.2s ease-in-out " + (i * 0.16) + "s infinite";
            }
        endGroup();

        // BOX: Progress bar
        box.progressTrack = startBox({
            width: _s.progress.width,
            height: _s.progress.height,
            color: _s.progress.trackColor,
            round: _s.progress.round,
        });
        box.progressTrack.elem.style.overflow = "hidden";
        box.progressTrack.elem.style.flexShrink = "0";

            box.progressBar = Box(0, 0, 0, "100%", {
                color: _s.progress.color,
                round: _s.progress.round,
            });
            box.progressBar.setMotion("width 0.25s");

        endBox();

    endGroup();

    // *** OBJECT INIT CODE:

    // WHY: A hidden object inside a group is not a flex item, so the parts are hidden after they are created.
    box.titleLabel.visible = box.titleText ? 1 : 0;
    box.messageLabel.visible = box.messageText ? 1 : 0;
    box.spinner.visible = (box.spinnerType === "ring") ? 1 : 0;
    box.dots.visible = (box.spinnerType === "dots") ? 1 : 0;
    box.setProgress(box.progress);

    if (box.opened) {
        box.opened = 0; // WHY: open() sets it.
        box.open();
    } else {
        box.visible = 0;
        box.elem.style.pointerEvents = "none";
    }

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: LoadingScreen({ styleName: "dark" })
// USAGE: LoadingScreen({ styleName: "dark", style: { spinner: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: LoadingScreen.styles.myStyle = { box: { color: "#0B2239" } };
LoadingScreen.styles = {

    light: LoadingScreenDefaults.style,

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

// The animations can not be set with inline styles.
LoadingScreen.injectCss = function () {
    if (document.getElementById("loading-screen-css")) return;
    const style = document.createElement("style");
    style.id = "loading-screen-css";
    style.textContent =
        "@keyframes loadingScreenSpin { to { transform: rotate(360deg); } }" +
        "@keyframes loadingScreenDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; } 40% { transform: scale(1); opacity: 1; } }";
    document.head.appendChild(style);
};
