/* Bismillah */

/*

Scrolling Text - v26.10

A one line text that slides to show its end when it does not fit in its box (a long name, a title, a cell).
The text waits at its start, slides to its end, waits, and goes back.
- mode "always": it slides again and again (the faded edges show that there is more text).
- The edges: the left one is clear while the text is at its start, the right one fades where the text goes on; at
  the end the text slides a little more (fade.width), so its last letters are clear too.
- mode "hover": "..." at the end while it waits. The mouse comes: the right edge fades over the "..." (0.3 s), then
  the whole text slides at once; the mouse leaves: it goes back in 0.3 s and "..." comes again
  (Ex: the cells of comp/tiny-table.js).
- A text that fits never moves. The speed is in px per second, so a long text takes longer, not faster.
- The texts are plain text; allowHtml: 1 lets them be HTML (only for texts of your own code).
- No motion when the system asks for reduced motion: the text ends with "...".

USAGE:
ScrollingText({ width: 200, labelText: "Start. Vegetables are healthy. End." });
ScrollingText({ width: 120, labelText: "A long name of a file.pdf", mode: "hover" });
ScrollingText({ width: 200, labelText: "A long title", waitTime: 2, minWaitTime: 0.8, fullWaitDistance: 200 });
text.setLabelText("Another text");

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ScrollingTextDefaults = {
    width: 200,
    height: "auto", // As high as the text (with the padding)
    labelText: "",
    allowHtml: 0, // 1: the text is HTML (only for your own texts)
    mode: "always", // "always": it slides again and again; "hover": only while the mouse is over it
    speed: 40, // px in a second
    waitTime: 1.2, // s: at the start and at the end (the longest wait: a short slide waits less)
    minWaitTime: 0.5, // s: the wait of a very short slide (a few hidden letters are read quickly, but not in a blink)
    fullWaitDistance: 120, // px: a slide this long (or longer) waits the whole waitTime; a shorter one waits less
    styleName: "classic", // "classic" or a name added to ScrollingText.styles
    style: {
        box: { color: "transparent", padding: [0, 0] }, // padding: [x, y] around the text
        label: { fontSize: 16, textColor: Black(0.8) },
        fade: { width: 10 }, // px: the faded edges while the text is longer than the box
    },
};

const ScrollingText = function (params = {}) {

    // Merge style package: params.style > ScrollingText.styles[styleName] > ScrollingTextDefaults.style
    basic.applyStylePackage(params, ScrollingText.styles, ScrollingTextDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ScrollingTextDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const EDGE_TIME = 300; // ms: the faded edges come and go, and the text goes back (soft, not slow)
    let motion = null; // The Web Animation of the label (its slide)
    let edgeMotion = null; // The Web Animation of the left edge (it fades while the text is away from its start)
    let isHover = 0;
    let isOpen = 0; // 1: the whole text is shown (it slides); 0: it ends with "..."
    let cancelOpen = null; // "hover": the text opens when the right edge has faded

    // *** PUBLIC VARIABLES:
    box.isLonger = 0; // 1: the text does not fit (it can slide)

    // *** PRIVATE FUNCTIONS:

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    const canSlide = function () {
        return box.isLonger && !isReducedMotion();
    };

    // How many px the text is longer than its place
    const getOverflow = function () {
        return Math.max(0, box.label.elem.scrollWidth - box.viewport.elem.clientWidth);
    };

    // The edges of the mask (1: clear, 0: faded); a CSS variable of the viewport
    const setEdge = function (side, value) {
        box.viewport.elem.style.setProperty("--scrolling-text-" + side, String(value));
    };

    const getEdge = function (side) {
        return parseFloat(getComputedStyle(box.viewport.elem).getPropertyValue("--scrolling-text-" + side)) || 0;
    };

    const stopMotion = function () {
        if (motion) motion.cancel();
        if (edgeMotion) edgeMotion.cancel();
        motion = null;
        edgeMotion = null;
    };

    // A short slide shows only a few letters, so it waits less at its ends (a long round for 3 letters was tiring)
    const getWaitTime = function (distance) {
        const part = (box.fullWaitDistance > 0) ? Math.min(1, distance / box.fullWaitDistance) : 1;
        return Math.min(box.waitTime, Math.max(box.minWaitTime, box.waitTime * part));
    };

    // Wait, slide to the end, wait, slide back: one round (it repeats). The waits are in the keyframe offsets.
    // skipFirstWait: "hover" starts at once (its wait was the fading of the right edge).
    const startMotion = function (skipFirstWait) {

        stopMotion();
        if (!canSlide()) return;

        // WHY + fade: at the end the last letters come out of the faded right edge, so they are read clearly
        const fade = _s.fade.width;
        const distance = getOverflow() + fade;
        const slideTime = distance / box.speed;
        const waitTime = getWaitTime(distance);
        const roundTime = 2 * slideTime + 2 * waitTime;
        const waitPart = waitTime / roundTime;
        const slidePart = slideTime / roundTime;
        const end = "translateX(-" + distance + "px)";
        const timing = {
            duration: roundTime * 1000,
            iterations: Infinity,
            easing: "linear",
            // WHY a negative delay: the round starts at the end of its first wait
            delay: skipFirstWait ? -waitTime * 1000 : 0,
        };

        motion = box.label.elem.animate([
            { transform: "translateX(0)", offset: 0 },
            { transform: "translateX(0)", offset: waitPart },
            { transform: end, offset: waitPart + slidePart },
            { transform: end, offset: 2 * waitPart + slidePart },
            { transform: "translateX(0)", offset: 1 },
        ], timing);

        // The left edge is clear while the text is at its start (its first letters are read), and fades in the
        // first fade px of the slide: the same timing, so it moves with the text
        const edgePart = slidePart * Math.min(1, fade / distance);
        edgeMotion = box.viewport.elem.animate([
            { "--scrolling-text-left": 1, offset: 0 },
            { "--scrolling-text-left": 1, offset: waitPart },
            { "--scrolling-text-left": 0, offset: waitPart + edgePart },
            { "--scrolling-text-left": 0, offset: 1 - edgePart },
            { "--scrolling-text-left": 1, offset: 1 },
        ], timing);

    };

    // The text: the whole text (it slides) or "..." at the end
    const setOpen = function (value) {
        isOpen = value ? 1 : 0;
        box.label.width = isOpen ? "auto" : "100%";
        box.label.css = { textOverflow: isOpen ? "clip" : "ellipsis" };
    };

    // The mask and the text for the state (no motion here)
    const paint = function () {
        const fade = _s.fade.width + "px";
        const left = "rgba(0, 0, 0, var(--scrolling-text-left))";
        const right = "rgba(0, 0, 0, var(--scrolling-text-right))";
        const mask = canSlide() ? "linear-gradient(to right, " + left + ", black " + fade + ", black calc(100% - " + fade + "), " + right + ")" : "none";
        box.viewport.css = { maskImage: mask, webkitMaskImage: mask };
        setEdge("left", 1);
        setEdge("right", (canSlide() && (box.mode == "always" || isHover)) ? 0 : 1);
        setOpen(canSlide() && (box.mode == "always" || isOpen));
    };

    // "hover": the right edge fades over the "..." first (EDGE_TIME), then the whole text comes and slides at once
    const openOnHover = function () {
        paint();
        if (!canSlide()) return;
        cancelOpen = box.after(EDGE_TIME, function () {
            cancelOpen = null;
            setOpen(1);
            startMotion(1);
        });
    };

    // "hover": the text and its left edge go back from where they are, then "..." comes under the clear right edge
    const closeOnHover = function () {
        if (cancelOpen) cancelOpen();
        cancelOpen = null;
        if (!motion) {
            paint();
            return;
        }
        const transform = getComputedStyle(box.label.elem).transform;
        const leftEdge = getEdge("left");
        stopMotion();
        const back = { duration: EDGE_TIME, easing: "ease-out" };
        box.viewport.elem.animate([{ "--scrolling-text-left": leftEdge }, { "--scrolling-text-left": 1 }], back);
        box.label.elem.animate([{ transform: transform }, { transform: "translateX(0)" }], back).onfinish = function () {
            if (!box || isHover) return;
            setOpen(0);
            paint();
        };
    };

    // Measures again: does the text fit? (a new text, a new size)
    const refreshLayout = function () {
        if (!box) return;
        box.label.width = "auto";
        box.isLonger = (getOverflow() > 0) ? 1 : 0;
        paint();
        // WHY: a new text under the mouse (a short one before it closed the slide) opens like a new hover
        if (box.mode == "hover" && isHover && !isOpen) {
            if (!cancelOpen) openOnHover();
            return;
        }
        if (box.mode == "always" || isOpen) startMotion(isOpen && box.mode == "hover");
        else stopMotion();
    };

    // *** PUBLIC FUNCTIONS:

    box.setLabelText = function (text) {
        if (!box) return;
        box.labelText = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) box.label.text = box.labelText;
        else box.label.plainText = box.labelText;
        refreshLayout();
    };
 // USAGE: get: text.labelText, set: text.setLabelText("A long text")

    box.refresh = function () {
        refreshLayout();
    };

    // REMOVE: the endless Web Animations ("always") are cancelled (basic.js remove() does not know them)
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return;
        stopMotion();
        superRemove.call(box);
        box = null;
    };

    // *** OBJECT VIEW:

    // WHY @property: only a registered variable is a number that can change softly (a plain one jumps)
    basic.addCss("scrolling-text-edge",
        "@property --scrolling-text-left { syntax: '<number>'; inherits: false; initial-value: 1; }" +
        "@property --scrolling-text-right { syntax: '<number>'; inherits: false; initial-value: 1; }");

    box.props({ color: _s.box.color, padding: _s.box.padding });

    // BOX: The place of the text (it cuts the sliding text; the padding of the box stays empty)
    box.viewport = startBox({ width: "100%", height: "auto", color: "transparent", position: "relative", clipContent: 1 });
    box.viewport.css = { transition: "--scrolling-text-right " + EDGE_TIME + "ms" };

        // LABEL: Text
        box.label = Label({
            ..._s.label,
            position: "relative",
            // WHY inline-block: a block label is as wide as its place even with width "auto": the sliding text was cut at that width
            css: { whiteSpace: "nowrap", overflow: "hidden", display: "inline-block", verticalAlign: "top", maxWidth: "none", willChange: "transform" },
        });

    endBox();

    // *** OBJECT INIT CODE:

    box.onHoverChange(function (self, isOver) {
        if (box.mode != "hover") return;
        isHover = isOver ? 1 : 0;
        if (isHover) openOnHover();
        else closeOnHover();
    });
    if (box.mode == "hover") box.clickable = 1; // WHY: a basic.js box gets no mouse events by default

    box.onResize(refreshLayout);
    box.setLabelText(box.labelText);
    // WHY: the text is measured again when the font is loaded (a fixed width box gets no resize then)
    if (document.fonts) document.fonts.ready.then(function () { if (box) refreshLayout(); });

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: ScrollingText({ style: { label: { fontSize: 14 } } })
// NOTE: A new package needs only the keys that differ from the classic style.
ScrollingText.styles = {
    classic: ScrollingTextDefaults.style,
};
