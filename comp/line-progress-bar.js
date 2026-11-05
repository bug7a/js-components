/* Bismillah */

/*

Component: LineProgressBar
Version: 1.2 (2026-11-05: the lines follow the width; a bar made in a hidden container works)
Created: November 2025
Description: A progress bar component composed of vertical lines.

USAGE:
const bar = LineProgressBar({ width: 300, height: 40, showValueLabel: true });
bar.setProgress(45); // 0 to 100

NOTE (September 2026): Renamed from "ProgressBar" to "LineProgressBar".
WHY: comp/progress-bar.js is the standard "ProgressBar". Two "const ProgressBar" on the same page
     is an error. "ProgressBar()" still works on pages that load only this file (see the end of the file).

Created by AI (Antigravity Gemini)

*/

"use strict";

const LineProgressBarDefaults = {
    width: 300,
    height: 50,
    progress: 0, // 0 to 100
    primaryColor: "indianred",
    secondaryColor: "lightgray",
    showValueLabel: false,
    backgroundColor: "transparent",
};

const LineProgressBar = function (params = {}) {

    // Merge params
    mergeIntoIfMissing(params, LineProgressBarDefaults);

    // BOX: Component container
    const box = startObject(params);
    box.clipContent = 0; // WHY: The head of the progress and the value label stand out of the box.

    // *** PRIVATE VARIABLES:
    const LINE_WIDTH = 1;
    const LINE_GAP = 3;
    const UNIT_WIDTH = LINE_WIDTH + LINE_GAP;
    const LINE_ROUND = 3;
    // The line at the progress (the head) and its two neighbors are wider and longer (overhang: px at the top and the bottom).
    const HEAD_LOOK = { width: 3, overhang: 2, zIndex: 10, color: "black" };
    const NEIGHBOR_LOOK = { width: 2, overhang: 1, zIndex: 5 };
    const VALUE_LABEL_TOP = -25; // Above the lines
    const VALUE_LABEL_SHOW_TIME = 1000; // ms after the last change

    let totalLines = 0; // follows the width of the box (0 while it is not drawn: a closed tab, a hidden group)
    const lines = [];
    let lineContainer = null;

    let valueLabel = null;
    let cancelValueLabelHide = null; // The cancel function of the waiting hide (box.after)

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
    };

    // WHY again on a resize: the lines were made once from the width at create time. A bar made in a closed tab or
    //     a hidden group ("100%": width 0) had no lines, and lineContainer.add(...[]) threw: the start() of the page
    //     stopped there, with its started boxes left open (2026-11-05).
    const buildLines = function () {
        lines.forEach(function (line) { line.remove(); });
        lines.length = 0;
        totalLines = countLines();
        createIn(lineContainer, function () {
            for (let i = 0; i < totalLines; i++) {
                lines.push(Box({
                    width: LINE_WIDTH,
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

    // The index of the head line. (100% would be one past the last line.)
    const getHeadIndex = function () {
        const headIndex = Math.floor((box.currentProgress / 100) * totalLines);
        if (headIndex >= totalLines) return totalLines - 1;
        return headIndex;
    };

    // A wider line keeps the center of a normal line: it moves left by half of the extra width.
    const getLineLook = function (index, headIndex) {
        const normalLeft = index * UNIT_WIDTH;
        const look = {
            color: (index <= headIndex) ? box.primaryColor : box.secondaryColor,
            width: LINE_WIDTH,
            overhang: 0,
            zIndex: 0,
        };
        if (index === headIndex) Object.assign(look, HEAD_LOOK);
        if (index === headIndex - 1 || index === headIndex + 1) Object.assign(look, NEIGHBOR_LOOK);
        look.left = normalLeft - (look.width - LINE_WIDTH) / 2;
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

    // The center of the head line. No head line (a negative progress, no lines): 0.
    const getHeadCenter = function (headIndex) {
        if (headIndex < 0) return 0;
        const headLeft = getLineLook(headIndex, headIndex).left;
        return headLeft + (HEAD_LOOK.width / 2);
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

    const updateVisuals = function () {
        const headIndex = getHeadIndex();
        paintLines(headIndex);
        if (box.showValueLabel && valueLabel) showValueLabel(headIndex);
    };

    // *** PUBLIC FUNCTIONS:
    box.setProgress = function (val) {
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        box.currentProgress = val;
        updateVisuals();
    };
    // USAGE: get: bar.currentProgress, set: bar.setProgress(60)

    // *** OBJECT INIT CODE:
    createLines();
    updateVisuals();
    box.onResize(function () {
        if (countLines() !== totalLines) buildLines();
        paintLines(getHeadIndex()); // (not updateVisuals: the value label shows only when the value changes)
    });

    return endObject(box);
};

// Old name. WHY: Pages made before the rename call ProgressBar().
// NOTE: A property of window, not a "const". If comp/progress-bar.js is loaded too, its ProgressBar is used.
if (typeof window.ProgressBar === "undefined") window.ProgressBar = LineProgressBar;
