/* Bismillah */

/*

Component: LineProgressBar
Version: 1.3
Created: November 2025
Description: A progress bar component composed of vertical lines.

- The lines: lineWidth, lineGap and lineRound ("full": the top and the bottom are half
  circles). headGrow: 1 (default) makes the line at the progress and its two neighbors wider and longer; 0: every
  line is the same. primaryColor: the full lines; secondaryColor: the empty ones.
- valueBubble: 1 shows the value all the time in a bubble of comp/tooltip.js (load it first) over the last full
  line, its arrow pointing at it (valueBubbleLook: the keys of Tooltip.BUBBLE_LOOK; its color is primaryColor).
  showValueLabel: the small label that shows for a moment when the value changes.
- animated: 1 (context/basic-js-animated-rules.md): the bubble slides to a new value in 0.25 s
  (a transform from where it is seen, so a quick row of values is one smooth way); it does not slide at the first
  view, with a scroll or a resize, nor when the system asks for reduced motion. setAnimated(0/1).
- 0% has no full line (one line was full at 0%).

USAGE:
const bar = LineProgressBar({ width: 300, height: 40, showValueLabel: true });
bar.setProgress(45); // 0 to 100
const upload = LineProgressBar({ width: 360, height: 36, lineWidth: 6, lineGap: 4, lineRound: "full", headGrow: 0,
    primaryColor: "#7BC362", secondaryColor: "#E2E1DD", valueBubble: 1 }); // thick round lines, a bubble
upload.setPrimaryColor("#52A8D0");

WHY the name: comp/progress-bar.js is the standard "ProgressBar"; this one draws lines.

Created by AI (Antigravity Gemini)

Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

const LineProgressBarDefaults = {
    width: 300,
    height: 50,
    progress: 0, // 0 to 100
    primaryColor: "indianred", // the full lines
    secondaryColor: "lightgray", // the empty lines
    lineWidth: 1, // px
    lineGap: 3, // px between two lines
    lineRound: 3, // px, or "full": the top and the bottom of a line are half circles
    headGrow: 1, // 1: the line at the progress and its two neighbors are wider and longer; 0: every line the same
    showValueLabel: false, // the value in a small label for a moment when it changes
    valueBubble: 0, // 1: the value all the time in a bubble with an arrow over the last full line (comp/tooltip.js)
    valueBubbleLook: {}, // the keys of Tooltip.BUBBLE_LOOK (its color: primaryColor)
    animated: 0, // 1: the bubble of the value slides to a new value (box.setAnimated(0/1))
    backgroundColor: "transparent",
};

const LineProgressBar = function (params = {}) {

    // Merge params
    mergeIntoIfMissing(params, LineProgressBarDefaults);

    // BOX: Component container
    const box = startObject(params);
    box.clipContent = 0; // WHY: The head of the progress and the value label stand out of the box.

    // *** PRIVATE VARIABLES:
    const UNIT_WIDTH = box.lineWidth + box.lineGap;
    const LINE_ROUND = (box.lineRound === "full") ? box.lineWidth / 2 : box.lineRound;
    // The line at the progress (the head) and its two neighbors are wider and longer (overhang: px at the top and the bottom).
    const HEAD_LOOK = { width: box.lineWidth * 3, overhang: 2, zIndex: 10, color: "black" };
    const NEIGHBOR_LOOK = { width: box.lineWidth * 2, overhang: 1, zIndex: 5 };
    const VALUE_LABEL_TOP = -25; // Above the lines
    const VALUE_LABEL_SHOW_TIME = 1000; // ms after the last change
    const VALUE_BUBBLE_Z_INDEX = 2; // over the content of the page (and over a Dialog that holds the bar: zIndexAbove)
    // MOTION (animated: 1)
    const MOTION_TIME = "0.25s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start, a soft stop

    let totalLines = 0; // follows the width of the box (0 while it is not drawn: a closed tab, a hidden group)
    const lines = [];
    let lineContainer = null;

    let valueLabel = null;
    let cancelValueLabelHide = null; // The cancel function of the waiting hide (box.after)
    let valueBubble = null;
    let isBubblePlaceWaiting = 0;
    let isCreated = 0; // WHY: nothing moves at the first view

    // *** PUBLIC VARIABLES:
    box.currentProgress = box.progress;

    // *** PRIVATE FUNCTIONS:
    const countLines = function () {
        return Math.max(0, Math.floor(box.width / UNIT_WIDTH));
    };

    const createLines = function () {

        lineContainer = Box({
            width: "100%",
            height: "100%",
            color: "transparent",
            position: "absolute",
            left: 0,
            top: 0,
        });

        buildLines();

        if (box.showValueLabel) createValueLabel();
        if (box.valueBubble == 1) createValueBubble();
    };

    // WHY again on a resize: the lines were made once from the width at create time. A bar made in a closed tab or
    //     a hidden group ("100%": width 0) had no lines, and lineContainer.add(...[]) threw: the start() of the page
    //     stopped there, with its started boxes left open.
    const buildLines = function () {
        lines.forEach(function (line) { line.remove(); });
        lines.length = 0;
        totalLines = countLines();
        createIn(lineContainer, function () {
            for (let i = 0; i < totalLines; i++) {
                lines.push(Box({
                    width: box.lineWidth,
                    height: box.height,
                    left: i * UNIT_WIDTH,
                    top: 0,
                    color: box.secondaryColor,
                    position: "absolute",
                }));
            }
        });
    };

    const createValueLabel = function () {
        valueLabel = Label({
            text: "0%",
            fontSize: 12,
            color: box.primaryColor,
            textColor: "white",
            position: "absolute",
            opacity: 0, // Shown only while the progress changes
            width: "auto",
            height: "auto",
            padding: [6, 2],
            round: 100,
        });
        box.add(valueLabel); // WHY: In the box, not in the line container: it stays over the lines.
        valueLabel.setMotion("opacity 0.3s");
    };

    // How many lines are full (0%: none, 100%: all)
    const getFullCount = function () {
        return Math.round((box.currentProgress / 100) * totalLines);
    };

    // The index of the head line: the last full one (-1: no full line)
    const getHeadIndex = function () {
        return getFullCount() - 1;
    };

    // A wider line keeps the center of a normal line: it moves left by half of the extra width.
    const getLineLook = function (index, headIndex) {
        const normalLeft = index * UNIT_WIDTH;
        const look = {
            color: (index <= headIndex) ? box.primaryColor : box.secondaryColor,
            width: box.lineWidth,
            overhang: 0,
            zIndex: 0,
        };
        if (box.headGrow == 1) {
            if (index === headIndex) Object.assign(look, HEAD_LOOK);
            if (index === headIndex - 1 || index === headIndex + 1) Object.assign(look, NEIGHBOR_LOOK);
        }
        look.left = normalLeft - (look.width - box.lineWidth) / 2;
        return look;
    };

    const paintLines = function (headIndex) {
        for (let i = 0; i < totalLines; i++) {
            const look = getLineLook(i, headIndex);
            const line = lines[i];
            line.color = look.color;
            line.width = look.width;
            line.height = box.height + (look.overhang * 2);
            line.top = -look.overhang;
            line.left = look.left;
            line.round = LINE_ROUND;
            line.opacity = 1;
            line.zIndex = look.zIndex;
        }
    };

    // The center of the head line. No head line (no full line, no lines): 0.
    const getHeadCenter = function (headIndex) {
        if (headIndex < 0) return 0;
        const look = getLineLook(headIndex, headIndex);
        return look.left + (look.width / 2);
    };

    // The label shows the value over the head line for a short time.
    const showValueLabel = function (headIndex) {
        valueLabel.text = Math.round(box.currentProgress) + "%";
        valueLabel.top = VALUE_LABEL_TOP;
        valueLabel.left = getHeadCenter(headIndex);
        valueLabel.css.transform = "translateX(-50%)"; // WHY: Its center (not its left side) is over the head line.
        valueLabel.opacity = 1;
        valueLabel.color = box.primaryColor;

        if (cancelValueLabelHide) cancelValueLabelHide();
        cancelValueLabelHide = box.after(VALUE_LABEL_SHOW_TIME, function () {
            valueLabel.opacity = 0;
        });
    };

    // *** THE VALUE BUBBLE (valueBubble: 1): a bubble of comp/tooltip.js on page, over the last full line

    const createValueBubble = function () {
        if (typeof Tooltip === "undefined") {
            console.warn("LineProgressBar: valueBubble needs comp/tooltip.js (Tooltip).");
            return;
        }
        const look = Object.assign({ color: box.primaryColor }, box.valueBubbleLook);
        look.zIndex = basic.zIndexAbove(box, VALUE_BUBBLE_Z_INDEX);
        valueBubble = Tooltip.createBubble("", look);
        box.own(valueBubble); // (it is on page: it goes with the bar)
        box.listenTo(window, "scroll", queueBubblePlace, true); // WHY capture: the scroll of a box does not bubble up
        box.onPageResize(placeValueBubble);
        // WHY: a text measured before its font came is narrower; the bubble is placed again when the fonts are ready
        if (document.fonts && document.fonts.status != "loaded") document.fonts.ready.then(placeValueBubble);
    };

    // The point of the arrow: the top of the last full line (no full line: the left end of the bar)
    const getBubbleTarget = function () {
        const headIndex = getHeadIndex();
        if (headIndex >= 0) return Tooltip.toPageRect(lines[headIndex]);
        const rect = Tooltip.toPageRect(box);
        return { left: rect.left, top: rect.top, width: 0, height: rect.height };
    };

    const isMotionOn = function () {
        if (box.animated != 1) return false;
        return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    // The middle of the top of the bubble as it is seen now, in the px of the page (its transform too)
    const getBubblePoint = function () {
        const rect = valueBubble.elem.getBoundingClientRect();
        return Tooltip.toPagePoint(rect.left + rect.width / 2, rect.top);
    };

    // The bubble is seen only while the bar is (a closed tab, a box scrolled away).
    // isSliding: a new value: the bubble slides from where it is seen to its new place (animated)
    const placeValueBubble = function (isSliding = false) {
        if (!valueBubble || valueBubble._isRemoved) return;
        const isShown = (totalLines > 0 && Tooltip.isInSight(box));
        const canSlide = (isSliding === true && isCreated && isMotionOn() && valueBubble.visible == 1);
        const from = (canSlide) ? getBubblePoint() : null;
        valueBubble.visible = isShown ? 1 : 0;
        if (!isShown) return;
        if (box.animated == 1) {
            valueBubble.setMotionNow("none");
            valueBubble.css = { transform: "none" };
        }
        valueBubble.label.plainText = Math.round(box.currentProgress) + "%";
        Tooltip.place(valueBubble, getBubbleTarget(), "top");
        if (from) slideBubbleFrom(from);
    };

    // WHY a transform (not left / top): only transform and opacity move (the rules); the bubble is put at its new
    //     place at once, moved back to where it was seen, and then it goes to its place
    const slideBubbleFrom = function (from) {
        const to = getBubblePoint();
        valueBubble.css = { transform: "translate(" + (from.x - to.x) + "px, " + (from.y - to.y) + "px)" };
        void valueBubble.elem.offsetHeight; // WHY: the start look must be drawn before the motion is turned on
        valueBubble.setMotionNow("transform " + MOTION_TIME + " " + MOTION_EASE);
        valueBubble.css = { transform: "none" };
    };

    // Once a frame while a box scrolls
    const queueBubblePlace = function () {
        if (isBubblePlaceWaiting) return;
        isBubblePlaceWaiting = 1;
        requestAnimationFrame(function () {
            isBubblePlaceWaiting = 0;
            placeValueBubble();
        });
    };

    const updateVisuals = function () {
        const headIndex = getHeadIndex();
        paintLines(headIndex);
        if (box.showValueLabel && valueLabel) showValueLabel(headIndex);
        placeValueBubble(true);
    };

    // *** PUBLIC FUNCTIONS:
    box.setProgress = function (val) {
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        box.currentProgress = val;
        updateVisuals();
    };
    // USAGE: get: bar.currentProgress, set: bar.setProgress(60)

    // The color of the full lines (and of the bubble, when its look has no color of its own)
    box.setPrimaryColor = function (color) {
        box.primaryColor = color;
        if (valueBubble && !box.valueBubbleLook.color) Tooltip.paintBubble(valueBubble, color);
        if (valueLabel) valueLabel.color = color;
        paintLines(getHeadIndex());
    };
    // USAGE: bar.setPrimaryColor("#52A8D0")

    // The color of the empty lines
    box.setSecondaryColor = function (color) {
        box.secondaryColor = color;
        paintLines(getHeadIndex());
    };

    box.setAnimated = function (value) {
        box.animated = (value == 1) ? 1 : 0;
        if (box.animated != 1 && valueBubble) {
            valueBubble.setMotionNow("none");
            valueBubble.css = { transform: "none" };
        }
    };
    // USAGE: bar.setAnimated(1)

    // *** OBJECT INIT CODE:
    createLines();
    updateVisuals();
    box.onResize(function () {
        if (countLines() !== totalLines) buildLines();
        paintLines(getHeadIndex()); // (not updateVisuals: the value label shows only when the value changes)
        placeValueBubble();
    });
    isCreated = 1;

    return endObject(box);
};
