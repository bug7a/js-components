/* Bismillah */

/*

Progress Bar - v26.09

UI COMPONENT TEMPLATE
- A horizontal progress bar with a title and a value text.
- Determinate: value / maxValue (smooth animation when the value changes).
- Indeterminate: a moving bar, when the progress is not known. (Ex: "Connecting...")
- Status colors: "normal", "success", "error".
- Value text position: "top" (right of the title), "right" (right of the bar), "none".
- TWO PARTS: secondValue is a second part after the value (Ex: 70 done + 5 on the way);
  its own color (style.secondBar). The value text and onComplete are of the value only. It is drawn from 0 under the
  bar: a second part that is not transparent ("ozden") looks like a second bar next to it; bar.joinEdge: 0 leaves
  out the edge of the bar between them, the two colors meet ("ozden").
- STRIPES: stripes: 1 (the value) and secondStripes: 1 (the second part) draw light diagonal stripes that move
  slowly (a job is running); setStripes() / setSecondStripes(). Still with prefers-reduced-motion. (style.stripes)
- LIMITS: limits: [80] or [{ value: 30, color: "#7BA7D9" }, { value: 80, text: "80" }]: marks at these values (in
  the units of value / maxValue), a text under a mark (style.limit); setLimits(). limit.shape "line": a line over the
  bar, a little longer than it; "dot" ("ozden"): a dot inside the track that has the color of
  the part under it (limit.barColor on the bar, secondBarColor on the second part, color on the track; on a dark
  track darkTrack.limitColor), half and half while the end of the bar goes over it. The own color of a limit is
  its color on the track. limit.dotOpacity: every dot ("ozden": 0.85).
- Style packages: "light" (default; the old name "classic" works too) and "dark" (the light and dark look of the kit: a
  thin round track of 10 px with no edge, the bar in the accent: _designs/progress-bar.htm), "modern", "ozden" (the bar is a cyan SmartButton
  ozden, with its edge and its line at the bottom; a round track, the second part a light bar next to it; a dark
  limit line with a text). "ozdenDark" (for a dark page). Select with styleName.
  (ProgressBar.styles)
- THE ENDS: an end of a bar at an end of the track is as round as the track; an end in the middle of the track has
  style.bar.innerRound ("": as round as the track; "ozden": 0, straight).
- A DARK TRACK: darkTrack: 1 gives the track the colors of style.darkTrack (#242424 with a faint white edge;
  "ozden": Black(0.85) with no edge); the bars keep theirs. setDarkTrack().
- THE TRACK of the base (ProgressBarDefaults.style): 16 px, #F2F2F2, a 2 px light gray edge, round 4 ("light",
  "dark" and "modern" have their own: 10 px, no edge, round ends; "ozden" has round ends).
- Everything is drawn with code (no image files needed).

NOTE: comp/line-progress-bar.js (vertical lines style) is named LineProgressBar, so both can be loaded on the same page.

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ProgressBarDefaults = {
    key: "0",
    width: 320,
    height: "auto",
    value: 0, // 0 - maxValue
    secondValue: 0, // A second part after the value (value + secondValue <= maxValue). 0: none
    maxValue: 100,
    stripes: 0, // 1: moving stripes on the value part
    secondStripes: 0, // 1: moving stripes on the second part
    limits: [], // Lines at these values: [80] or [{ value: 80, color: "indianred" }]
    darkTrack: 0, // 1: the track in the colors of style.darkTrack (the bars keep theirs)
    indeterminate: 0, // 1: Progress is not known, show a moving bar.
    status: "normal", // "normal", "success", "error"
    titleText: "",
    allowHtml: 0, // 1: titleText and the text of valueFormat are HTML (only for your own texts)
    valuePosition: "top", // "top", "right", "none" (Only at create time)
    valueFormat: function (self) { // Returns the value text.
        return Math.round(self.getPercent()) + "%";
    },
    onChange: function (self) { }, // self.value
    onComplete: function (self) { }, // Called once when the value reaches maxValue.
    styleName: "light", // "light" ("classic": its old name), "dark", "modern", "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to ProgressBar.styles
    style: { // The base of every package (a thin dark bar on a light gray track): a package changes only some keys
        layout: {
            gap: 6, // Space between the title row and the bar
        },
        track: { // Background of the bar
            height: 16,
            color: "#F2F2F2",
            round: 4,
            border: 2,
            borderColor: "rgba(0, 0, 0, 0.1)",
            css: {}, // Ex: { backgroundImage: "linear-gradient(#EEE, #D0D0D0)" }
        },
        darkTrack: { // The track with darkTrack: 1 (its size and its round are of track)
            color: "#242424",
            borderColor: White(0.4),
            limitColor: White(0.7), // a limit dot on it (limit.shape "dot")
        },
        bar: {
            color: "#141414", // the main color (also of the edge, when borderColor is "")
            fillOpacity: 1, // the inside of the bar: the main color at this opacity (Ex: 0.5 with an edge of 1)
            border: 0,
            borderColor: "", // "": the main color (of the status too)
            boxShadow: "none", // of both parts (Ex: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)": a line at the bottom)
            innerRound: "", // px: an end in the middle of the track (0: straight). "": as round as the track
            joinEdge: 1, // 0: no edge of the bar where the second part starts (the two colors meet)
            motion: 0.3, // Seconds. 0: No animation
        },
        secondBar: { // The second part (secondValue)
            color: Black(0.35), // "": the main color, lighter (it follows the main color: fillOpacity or lighten)
            fillOpacity: 0.2, // (color "") the main color at this opacity
            lighten: 0, // 0 - 1 (color ""): the main color mixed with this much white, not transparent; 0: fillOpacity
            borderOpacity: 0.45, // its edge (when the bar has one): the main color at this opacity
        },
        stripes: {
            color: "rgba(255, 255, 255, 0.35)",
            size: 14, // px: one stripe and its gap
            speed: 0.8, // seconds for one step of the stripes
        },
        limit: {
            shape: "line", // "line": over the track, a little longer; "dot": inside the track, in the color of the part under it
            color: "indianred", // (a limit can have its own color) a dot: on the track
            width: 1, // px (a line)
            round: 0,
            overhang: 6, // px over and under the track (a line)
            dotSize: 6, // px (a dot)
            dotOpacity: 1, // a dot, on every part (Ex: 0.85: a little softer)
            barColor: "white", // a dot on the bar
            secondBarColor: "", // a dot on the second part ("": the main color)
            textSize: 13, // the text of a limit ({ value, text }) under it
            textColor: Black(0.7),
            textSpace: 6, // px between the line (or the track) and its text
        },
        successBar: {
            color: "#2E9E5B",
        },
        errorBar: {
            color: "#D64545",
        },
        title: {
            fontSize: 14,
            textColor: Black(0.8),
        },
        valueText: {
            fontSize: 14,
            textColor: Black(0.55),
        },
        indeterminate: {
            barWidth: 35, // Percent of the track width
            duration: 1.4, // Seconds for one move
        },
    }
};

const ProgressBar = function (params = {}) {

    // Merge style package: params.style > ProgressBar.styles[styleName] > ProgressBarDefaults.style (the base)
    basic.applyStylePackage(params, ProgressBar.styles, ProgressBarDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ProgressBarDefaults);

    // Edit params, if needed:
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let moveAnimation = null; // Indeterminate animation (Web Animations API)
    const ROW_GAP = 10; // Space between the title and the value text, the track and the value text
    const COLOR_MOTION = "background-color 0.2s";

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.maxValue, box.status)

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = 0;
        return Math.min(Math.max(value, 0), box.maxValue);
    };

    const getBarMotion = function () {
        return "width " + box.style.bar.motion + "s, " + COLOR_MOTION;
    };

    // Change the bar size without animation. (Ex: from the moving bar to the value)
    const updateViewWithoutMotion = function () {
        box.bar.setMotionNow("none");
        box.secondBar.setMotionNow("none");
        updateView();
        box.bar.elem.offsetWidth; // WHY: Apply the new width before the motion is turned on again.
        box.bar.setMotionNow(getBarMotion());
        box.secondBar.setMotionNow(getBarMotion());
    };

    // The second part fits in what the value leaves (value + secondValue <= maxValue)
    const clampSecondValue = function (value) {
        value = Number(value);
        if (isNaN(value) || value < 0) value = 0;
        return Math.min(value, Math.max(0, box.maxValue - box.value));
    };

    const toPercent = function (value) {
        return (box.maxValue > 0) ? (value / box.maxValue) * 100 : 0;
    };

    // The inside and the edge of a part from its main color (a status changes the main color)
    const paintPart = function (bar, mainColor, fillOpacity, edgeColor) {
        bar.color = (fillOpacity < 1) ? Alpha(mainColor, fillOpacity) : mainColor;
        if (box.style.bar.border) bar.borderColor = edgeColor;
    };

    const paintBars = function () {
        const _b = box.style.bar;
        const mainColor = getBarColor();
        paintPart(box.bar, mainColor, Number(_b.fillOpacity), _b.borderColor || mainColor);
        paintSecondBar(mainColor);
        box.bar.boxShadow = _b.boxShadow;
        box.secondBar.boxShadow = _b.boxShadow;
    };

    // WHY color "": the second part follows the main color (one color to change for a new look)
    const paintSecondBar = function (mainColor) {
        const _b = box.style.bar;
        const _sb = box.style.secondBar;
        if (_sb.color) {
            paintPart(box.secondBar, _sb.color, 1, _b.borderColor || mainColor);
            return;
        }
        if (Number(_sb.lighten) > 0) {
            paintPart(box.secondBar, mixWithWhite(mainColor, Number(_sb.lighten)), 1, _b.borderColor || mainColor);
            return;
        }
        paintPart(box.secondBar, mainColor, Number(_sb.fillOpacity), _b.borderColor || Alpha(mainColor, Number(_sb.borderOpacity)));
    };

    // A lighter color that is not transparent: the track does not show through it (Ex: a dark track)
    const mixWithWhite = function (color, whiteShare) {
        const colorPercent = Math.round((1 - whiteShare) * 100);
        return "color-mix(in srgb, " + color + " " + colorPercent + "%, white)";
    };

    // The track: its own colors, or the dark ones (darkTrack: 1)
    const paintTrack = function () {
        const colors = (box.darkTrack == 1) ? box.style.darkTrack : box.style.track;
        box.track.color = colors.color;
        box.track.borderColor = colors.borderColor;
    };

    // THE ENDS: an end at an end of the track is as round as the track (its edge follows the round of the track);
    // an end in the middle of the track has bar.innerRound. The moving bar of indeterminate is round at both ends.
    const paintEnds = function () {
        const isBarAtRightEnd = (box.indeterminate == 1) || (box.value >= box.maxValue);
        const isSecondAtRightEnd = (box.value + box.secondValue >= box.maxValue);
        setEnds(box.bar, 1, isBarAtRightEnd);
        setEnds(box.secondBar, 1, isSecondAtRightEnd);
        paintJoin();
    };

    // bar.joinEdge 0: where the second part starts, the bar has no edge: the two colors meet
    const paintJoin = function () {
        const hasSecondAfter = (box.indeterminate != 1) && (box.value > 0) && (box.secondValue > 0);
        const isSeamless = hasSecondAfter && (box.style.bar.joinEdge == 0);
        box.bar.css = { borderRightWidth: (isSeamless ? 0 : box.style.bar.border) + "px" };
    };

    const setEnds = function (bar, isLeftAtEnd, isRightAtEnd) {
        const left = (isLeftAtEnd ? box.style.track.round : getInnerRound()) + "px";
        const right = (isRightAtEnd ? box.style.track.round : getInnerRound()) + "px";
        bar.css = { borderRadius: left + " " + right + " " + right + " " + left };
    };

    const getInnerRound = function () {
        const innerRound = box.style.bar.innerRound;
        if (innerRound === "" || innerRound === undefined || innerRound === null) return box.style.track.round;
        return Number(innerRound);
    };

    // The moving stripes: a CSS class with the colors of style.stripes (css variables)
    const paintStripes = function (bar, isOn) {
        ProgressBar.injectCss();
        const _st = box.style.stripes;
        bar.elem.classList.toggle("progress-bar-stripes", !!isOn);
        bar.elem.style.setProperty("--progress-stripe-color", _st.color);
        bar.elem.style.setProperty("--progress-stripe-size", _st.size + "px");
        bar.elem.style.setProperty("--progress-stripe-speed", _st.speed + "s");
    };

    // LIMITS: lines over the track (limit.shape "line") or dots inside it ("dot"), and their texts
    const drawLimits = function () {
        box.limitLines.forEach(function (line) { line.remove(); });
        box.limitDots.forEach(function (item) { item.dot.remove(); });
        box.limitLines = [];
        box.limitDots = [];
        if (isDotLimit()) drawLimitDots();
        else drawLimitLines();
        drawLimitTexts();
        layoutTrackArea();
    };

    const drawLimitLines = function () {
        const _l = box.style.limit;
        const lineHeight = box.style.track.height + _l.overhang * 2;
        createIn(box.trackArea, function () {
            getLimitList().forEach(function (limit) {
                const line = Box({ top: 0, width: _l.width, height: lineHeight, color: limit.color || _l.color, round: _l.round });
                line.css = { left: "calc(" + getLimitLeft(limit) + " - " + (_l.width / 2) + "px)" };
                box.limitLines.push(line);
            });
        });
    };

    // A dot for each limit in each holder of dots: the holder of the track is under the bars, the others are inside
    // the bars. So a bar shows its own dots where it is (also half a dot at its end) and covers the dots of the track.
    const drawLimitDots = function () {
        const holders = { track: box.trackDots, second: box.secondDots, bar: box.barDots };
        Object.keys(holders).forEach(function (part) {
            const edge = (part === "track") ? 0 : box.style.bar.border; // (a holder in a bar starts inside its edge)
            createIn(holders[part], function () {
                getLimitList().forEach(function (limit) {
                    box.limitDots.push({ dot: createLimitDot(limit, edge), part: part, limit: limit });
                });
            });
        });
        paintLimitDots();
    };

    // BOX: A dot in the middle of the track, at the place of its limit.
    // WHY cqw: the bar layer is a size container, so a dot inside a bar is placed on the width of the track
    const createLimitDot = function (limit, edge) {
        const size = box.style.limit.dotSize;
        const dot = Box({ top: (box.style.track.height - size) / 2 - edge, width: size, height: size, round: size / 2, opacity: box.style.limit.dotOpacity });
        dot.css = { left: "calc(" + getLimitPercent(limit) + "cqw - " + (edge + size / 2) + "px)" };
        return dot;
    };

    // LABEL: the text of a limit, under its line (or under the track)
    const drawLimitTexts = function () {
        const _l = box.style.limit;
        const top = box.style.track.height + getOverhang() * 2 + _l.textSpace;
        createIn(box.trackArea, function () {
            getLimitList().forEach(function (limit) {
                if (limit.text === undefined || limit.text === "") return;
                const text = Label({ top: top, fontSize: _l.textSize, textColor: limit.color || _l.textColor });
                text.plainText = limit.text;
                text.css = { left: getLimitLeft(limit), transform: "translateX(-50%)", whiteSpace: "nowrap" };
                box.limitLines.push(text);
            });
        });
    };

    const isDotLimit = function () {
        return box.style.limit.shape === "dot";
    };

    // A limit is a number or { value, color, text }; one without a number value is left out
    const getLimitList = function () {
        const list = box.limits.map(function (limit) {
            return (typeof limit === "object" && limit !== null) ? limit : { value: limit };
        });
        return list.filter(function (limit) { return !isNaN(Number(limit.value)); });
    };

    const getLimitPercent = function (limit) {
        return toPercent(Math.min(Math.max(Number(limit.value), 0), box.maxValue));
    };

    const getLimitLeft = function (limit) {
        return getLimitPercent(limit) + "%";
    };

    // px of a limit line over and under the track (a dot is inside it)
    const getOverhang = function () {
        const hasLines = (box.limits.length > 0) && !isDotLimit();
        return hasLines ? box.style.limit.overhang : 0;
    };

    // The color of a dot is of the part under it; the own color of a limit is its color on the track
    const paintLimitDots = function () {
        box.limitDots.forEach(function (item) {
            item.dot.color = getDotColor(item.part, item.limit);
        });
    };

    const getDotColor = function (part, limit) {
        const _l = box.style.limit;
        if (part === "bar") return _l.barColor;
        if (part === "second") return _l.secondBarColor || getBarColor();
        if (limit.color) return limit.color;
        return (box.darkTrack == 1) ? box.style.darkTrack.limitColor : _l.color;
    };

    // BOX: A holder of the limit dots, as big as the bar (or the track) it is in
    const createDotHolder = function () {
        return Box({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });
    };

    // The track (and the bars over it) are in the middle of the area; the area is taller with limit lines, and
    // with room for their texts
    const layoutTrackArea = function () {
        const _t = box.style.track;
        const _l = box.style.limit;
        const hasText = box.limits.some(function (limit) { return limit && typeof limit === "object" && limit.text !== undefined && limit.text !== ""; });
        const overhang = getOverhang();
        box.trackArea.height = _t.height + overhang * 2 + (hasText ? _l.textSpace + Math.ceil(_l.textSize * 1.4) : 0);
        box.track.top = overhang;
        box.barLayer.top = overhang;
        alignRightValue(overhang, hasText);
    };

    // WHY: the room of the limit texts is under the track; a value text at the right stays in line with the track
    const alignRightValue = function (overhang, hasText) {
        if (!box.valueLabel || box.valuePosition !== "right") return;
        if (!hasText) {
            box.valueLabel.css = { alignSelf: "", marginTop: "" };
            return;
        }
        const LINE_HEIGHT = 1.36; // of the font size (Open Sans)
        const textHeight = box.style.valueText.fontSize * LINE_HEIGHT;
        box.valueLabel.css = { alignSelf: "flex-start", marginTop: Math.round(overhang + (box.style.track.height - textHeight) / 2) + "px" };
    };

    const getBarColor = function () {
        if (box.status === "success") return box.style.successBar.color;
        if (box.status === "error") return box.style.errorBar.color;
        return box.style.bar.color;
    };

    const startMoveAnimation = function () {
        if (moveAnimation || !box.bar.elem.animate) return;
        // WHY: translateX(%) is relative to the bar width. The bar starts outside on the left and ends outside on the right.
        const _endPercent = Math.ceil(100 / box.style.indeterminate.barWidth * 100);
        moveAnimation = box.bar.elem.animate([
            { transform: "translateX(-100%)" },
            { transform: "translateX(" + _endPercent + "%)" },
        ], {
            duration: box.style.indeterminate.duration * 1000,
            iterations: Infinity,
            easing: "ease-in-out",
        });
    };

    const stopMoveAnimation = function () {
        if (!moveAnimation) return;
        moveAnimation.cancel();
        moveAnimation = null;
    };

    // Update the view according to the current state.
    const updateView = function () {

        paintBars();

        if (box.indeterminate == 1) {
            box.bar.visible = 1;
            box.bar.width = box.style.indeterminate.barWidth + "%";
            box.secondBar.visible = 0;
            box.barDots.visible = 0; // WHY: the moving bar would carry the dots of the limits with it
            startMoveAnimation();
            box.aria = { valuenow: null };
        } else {
            stopMoveAnimation();
            box.bar.width = box.getPercent() + "%";
            box.bar.visible = (box.value > 0) ? 1 : 0; // WHY: a bar with an edge was a thin line at 0
            box.barDots.visible = 1;
            // WHY from 0: the second bar is under the first one, so their round ends meet as one bar
            box.secondValue = clampSecondValue(box.secondValue);
            box.secondBar.width = toPercent(box.value + box.secondValue) + "%";
            box.secondBar.visible = (box.secondValue > 0) ? 1 : 0;
            box.aria = { valuenow: String(box.value) };
        }

        paintEnds();
        paintLimitDots();

        if (box.valueLabel) {
            setText(box.valueLabel, (box.indeterminate == 1) ? "" : box.valueFormat(box));
        }

        box.aria = { valuemax: String(box.maxValue) };

    };

    // *** PUBLIC FUNCTIONS:

    box.getPercent = function () {
        return (box.maxValue > 0) ? (box.value / box.maxValue) * 100 : 0;
    };
    // USAGE: progressBar.getPercent() // 0 - 100

    box.setValue = function (value, silent = 0) {

        value = clampValue(value);
        if (box.value == value && box.indeterminate != 1) return;

        const _wasComplete = (box.value >= box.maxValue);
        box.value = value;

        if (box.indeterminate == 1) {
            box.indeterminate = 0; // A known value ends the indeterminate mode.
            updateViewWithoutMotion();
        } else {
            updateView();
        }

        if (!silent) {
            box.onChange(box);
            if (!_wasComplete && box.value >= box.maxValue) box.onComplete(box);
        }

    };
    // USAGE: get: progressBar.value, set: progressBar.setValue(40)
    // NOTE: setValue(40, 1) changes the value without calling onChange and onComplete.

    box.setSecondValue = function (value) {
        box.secondValue = clampSecondValue(value);
        updateView();
    };
    // USAGE: get: progressBar.secondValue, set: progressBar.setSecondValue(5) // Ex: 70 + 5

    // Both parts at once (Ex: setValues(70, 5))
    box.setValues = function (value, secondValue, silent = 0) {
        box.secondValue = 0; // WHY: the value is set first, the second part fits in what it leaves
        box.setValue(value, silent);
        box.setSecondValue(secondValue);
    };

    box.setStripes = function (value) {
        box.stripes = basic.isOn(value) ? 1 : 0;
        paintStripes(box.bar, box.stripes);
    };
    // USAGE: get: progressBar.stripes, set: progressBar.setStripes(1)

    box.setSecondStripes = function (value) {
        box.secondStripes = basic.isOn(value) ? 1 : 0;
        paintStripes(box.secondBar, box.secondStripes);
    };

    box.setDarkTrack = function (value) {
        box.darkTrack = basic.isOn(value) ? 1 : 0;
        paintTrack();
        paintLimitDots();
    };
    // USAGE: get: progressBar.darkTrack, set: progressBar.setDarkTrack(1) // the colors of style.darkTrack

    box.setLimits = function (limits) {
        box.limits = Array.isArray(limits) ? limits.slice() : [];
        drawLimits();
    };
    // USAGE: progressBar.setLimits([{ value: 30, color: "#7BA7D9" }, 80])

    box.addValue = function (step = 1) {
        box.setValue(box.value + step);
    };
    // USAGE: progressBar.addValue(10)

    box.setMaxValue = function (value) {
        value = Number(value);
        box.maxValue = (isNaN(value) || value < 0) ? 0 : value;
        box.value = clampValue(box.value);
        updateView();
        drawLimits(); // (the places of the limits are relative to maxValue)
    };
    // USAGE: get: progressBar.maxValue, set: progressBar.setMaxValue(20) // Ex: 20 files

    box.setIndeterminate = function (indeterminate) {
        box.indeterminate = basic.isOn(indeterminate) ? 1 : 0;
        updateViewWithoutMotion(); // WHY: No width animation between the moving bar size and the value.
    };
    // USAGE: get: progressBar.indeterminate, set: progressBar.setIndeterminate(1)

    box.setStatus = function (status) {
        box.status = (status === "success" || status === "error") ? status : "normal";
        updateView();
    };
    // USAGE: get: progressBar.status, set: progressBar.setStatus("success")

    box.setTitleText = function (text) {
        box.titleText = text;
        setText(box.titleLabel, text);
        box.titleLabel.visible = (text) ? 1 : 0;
        updateTopRow();
    };
    // USAGE: get: progressBar.titleText, set: progressBar.setTitleText("Uploading...")

    box.reset = function () {
        box.indeterminate = 0;
        box.status = "normal";
        box.value = 0;
        box.secondValue = 0;
        updateViewWithoutMotion();
    };
    // USAGE: progressBar.reset() // value: 0, status: "normal"

    box.refresh = function () {
        paintTrack();
        updateView();
    };


    // *** OBJECT VIEW:
    box.role = "progressbar";
    box.aria = { valuemin: "0" };

    // GROUP: Top row, bar row
    box.contentBox = VGroup({
        width: "100%",
        height: "auto",
        align: "left top",
        gap: box.style.layout.gap,
        position: "relative",
    });

        // GROUP: Top row (title, value text)
        box.topRow = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: ROW_GAP,
        });

            // LABEL: Title
            box.titleLabel = Label(box.style.title);
            setText(box.titleLabel, box.titleText);
            box.titleLabel.css = { flex: "1 1 auto", minWidth: "0" };
            box.titleLabel.ellipsis = 1;
            if (!box.titleText) box.titleLabel.visible = 0;

            // LABEL: Value text (top)
            if (box.valuePosition === "top") {
                box.valueLabel = Label(box.style.valueText);
                box.valueLabel.css = {
                    marginLeft: "auto", // WHY: At the right side, also without a title.
                    whiteSpace: "nowrap",
                };
            }

        endGroup();

        // GROUP: Bar row (track, value text)
        box.barRow = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: ROW_GAP,
        });

            // BOX: Track area (the track and the limit lines over it; the lines are longer than the track)
            box.trackArea = startBox({ width: "auto", height: box.style.track.height, color: "transparent" });
            box.trackArea.clipContent = 0;
            box.trackArea.css = { flex: "1 1 0", minWidth: "0", position: "relative" };

                // BOX: Track
                box.track = startBox({
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: box.style.track.height,
                    color: box.style.track.color,
                    round: box.style.track.round,
                    border: box.style.track.border,
                    borderColor: box.style.track.borderColor,
                });
                box.track.css = box.style.track.css || {};

                endBox();

                // BOX: Bar layer (over the track, as big as it: a bar covers the edge of the track; it clips the
                //      moving bar of indeterminate)
                box.barLayer = startBox({
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: box.style.track.height,
                    color: "transparent",
                    round: box.style.track.round,
                });
                box.barLayer.clipContent = 1;
                box.barLayer.css = { containerType: "inline-size" }; // WHY: the dots of the limits are placed in cqw

                    // BOX: The dots of the limits on the track (limit.shape "dot"), under the bars
                    box.trackDots = createDotHolder();

                    // BOX: Second part (under the bar, from 0 to value + secondValue)
                    box.secondBar = startBox({
                        left: 0,
                        top: 0,
                        width: "0%",
                        height: "100%",
                        color: box.style.secondBar.color,
                        round: box.style.track.round,
                        border: box.style.bar.border,
                        borderColor: box.style.bar.borderColor,
                    });
                        box.secondDots = createDotHolder();
                    endBox();

                    // BOX: Bar
                    box.bar = startBox({
                        left: 0,
                        top: 0,
                        width: "0%",
                        height: "100%",
                        color: getBarColor(),
                        round: box.style.track.round,
                        border: box.style.bar.border,
                        borderColor: box.style.bar.borderColor,
                    });
                        box.barDots = createDotHolder();
                    endBox();

                endBox();

            endBox();

            // LABEL: Value text (right)
            if (box.valuePosition === "right") {
                box.valueLabel = Label(box.style.valueText);
                box.valueLabel.css = {
                    whiteSpace: "nowrap",
                    minWidth: "3em", // WHY: The bar width does not jump when the text changes. (9% -> 10%)
                };
                box.valueLabel.textAlign = "right";
            }

        endGroup();

    endGroup();

    // Hide the top row when it is empty.
    const updateTopRow = function () {
        box.topRow.visible = (box.titleText || box.valuePosition === "top") ? 1 : 0;
    };

    // *** OBJECT INIT CODE:

    box.maxValue = (Number(box.maxValue) >= 0) ? Number(box.maxValue) : 100;
    box.value = clampValue(box.value);
    box.indeterminate = basic.isOn(box.indeterminate) ? 1 : 0;
    box.status = (box.status === "success" || box.status === "error") ? box.status : "normal";

    box.limits = Array.isArray(box.limits) ? box.limits.slice() : [];
    box.limitLines = [];
    box.limitDots = [];

    box.darkTrack = basic.isOn(box.darkTrack) ? 1 : 0;

    updateTopRow();
    paintTrack();
    updateView();
    drawLimits();
    paintStripes(box.bar, box.stripes == 1);
    paintStripes(box.secondBar, box.secondStripes == 1);

    // NOTE: setMotion() waits a short time, so the bar does not grow from 0 when it is created.
    box.bar.setMotion(getBarMotion());
    box.secondBar.setMotion(getBarMotion());

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: ProgressBar({ styleName: "modern" })
// USAGE: ProgressBar({ styleName: "modern", style: { bar: { color: "tomato" } } }) // Change only some keys.
// USAGE: ProgressBar({ style: ProgressBar.styles.modern }) // The same as styleName: "modern". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from ProgressBarDefaults.style (the base of every package).
// USAGE: ProgressBar.styles.myStyle = { bar: { color: "red" } };
ProgressBar.styles = {

    // The light look of the kit (_designs/progress-bar.htm), the default: a thin round track of 10 px with no edge, the
    // bar in the accent, the second part the accent at 35 %, a limit a 2 px soft gray line with its text under it, a
    // 14 px title and a 13 px value.
    light: {
        layout: { gap: 6 },
        track: { height: 10, color: "#E6E7E3", round: 100, border: 0, borderColor: "transparent" },
        darkTrack: { color: "#2E2E2D", borderColor: "transparent", limitColor: White(0.7) },
        bar: { color: "#3D7A6B", fillOpacity: 1, border: 0, borderColor: "", boxShadow: "none", innerRound: "", joinEdge: 1, motion: 0.3 },
        secondBar: { color: "", fillOpacity: 0.35, lighten: 0, borderOpacity: 0.45 }, // the main color at 35 %
        stripes: { color: "rgba(255, 255, 255, 0.35)", size: 14, speed: 0.8 },
        limit: { shape: "line", color: Black(0.45), width: 2, round: 1, overhang: 4, dotSize: 6, dotOpacity: 1, barColor: "white", secondBarColor: "", textSize: 12, textColor: Black(0.55), textSpace: 6 },
        successBar: { color: "#5DB36B" },
        errorBar: { color: "#D9534F" },
        title: { fontSize: 14, textColor: Black(0.88) },
        valueText: { fontSize: 13, textColor: Black(0.55) },
    },

    // The dark look of the kit: the same shapes on a dark page.
    dark: {
        layout: { gap: 6 },
        track: { height: 10, color: "#363635", round: 100, border: 0, borderColor: "transparent" },
        darkTrack: { color: "#111110", borderColor: White(0.2), limitColor: White(0.7) },
        bar: { color: "#65A293", fillOpacity: 1, border: 0, borderColor: "", boxShadow: "none", innerRound: "", joinEdge: 1, motion: 0.3 },
        secondBar: { color: "", fillOpacity: 0.35, lighten: 0, borderOpacity: 0.45 },
        stripes: { color: "rgba(255, 255, 255, 0.25)", size: 14, speed: 0.8 },
        limit: { shape: "line", color: White(0.5), width: 2, round: 1, overhang: 4, dotSize: 6, dotOpacity: 1, barColor: "#141414", secondBarColor: "", textSize: 12, textColor: White(0.55), textSpace: 6 },
        successBar: { color: "#7FCB8F" },
        errorBar: { color: "#FF7B72" },
        title: { fontSize: 14, textColor: White(0.9) },
        valueText: { fontSize: 13, textColor: White(0.55) },
    },

    // The ozden bar: the colors of
    // SmartButton. The bar is a cyan SmartButton ozden (its edge and its line at the bottom: it looks raised);
    // the track keeps the colors of the default (#F2F2F2, a 2 px light gray edge) and its two ends are round; an end
    // in the middle of the track is straight. darkTrack: 1 is a soft black with no edge. The second part is a second
    // bar next to the bar, the main color mixed with white (not transparent). A limit is a dot, a little soft.
    // The main color can change (style.bar.color: the second part follows it); the tones of SmartButton fit.
    ozden: {
        layout: {
            gap: 8,
        },
        track: {
            round: 100, // the two ends are half circles
        },
        darkTrack: {
            color: Black(0.85),
            borderColor: "transparent", // no edge: the color of the track fills its place (the same size)
            limitColor: White(0.7),
        },
        bar: {
            color: "#5BBAC1", // cyan (SmartButton.tones.cyan)
            fillOpacity: 1,
            border: 1, // the edge and the bottom line of SmartButton ozden
            borderColor: "rgba(0, 0, 0, 0.35)",
            boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.25)",
            innerRound: 0, // straight in the middle of the track
            joinEdge: 0, // no edge between the bar and the second part
            motion: 0.3,
        },
        secondBar: {
            color: "", // the main color, lighter
            lighten: 0.5, // half white: not transparent, so it looks like a second bar next to the bar
        },
        stripes: {
            color: "rgba(255, 255, 255, 0.55)",
            size: 14,
            speed: 0.8,
        },
        successBar: {
            color: "#7BC362", // green (SmartButton.tones.green)
        },
        errorBar: {
            color: "#DE815B", // orange (SmartButton.tones.orange)
        },
        limit: {
            shape: "dot", // a dot inside the track, in the color of the part under it
            color: "rgba(0, 0, 0, 0.7)", // on the track
            dotSize: 6,
            dotOpacity: 0.85, // every dot
            barColor: "white", // on the bar
            secondBarColor: "", // on the second part: the main color
            width: 4, // shape "line"
            round: 2,
            overhang: 4,
            textSize: 14,
            textColor: "rgba(0, 0, 0, 0.7)",
            textSpace: 8,
        },
        title: {
            fontSize: 15,
            textColor: "#232323",
        },
        valueText: {
            fontSize: 14,
            textColor: "rgba(35, 35, 35, 0.6)",
        },
    },

    // The ozden bar for a dark page: a dark track with a soft edge, the bar in the main color of the kit.
    ozdenDark: {
        layout: {
            gap: 8,
        },
        track: {
            color: "#2A2A29",
            borderColor: White(0.18),
        },
        bar: {
            color: "#5BBAC1",
            fillOpacity: 0.5,
            border: 2,
            borderColor: "", // the main color
            motion: 0.3,
        },
        secondBar: {
            color: "", // the main color, lighter
            fillOpacity: 0.2,
            borderOpacity: 0.45,
        },
        stripes: {
            color: White(0.25),
            size: 14,
            speed: 0.8,
        },
        successBar: {
            color: "#40A5AF",
        },
        errorBar: {
            color: "#FE5D49",
        },
        limit: {
            color: White(0.75),
            width: 4,
            round: 2,
            overhang: 4,
            textSize: 14,
            textColor: White(0.75),
            textSpace: 8,
        },
        title: {
            fontSize: 15,
            textColor: White(0.88),
        },
        valueText: {
            fontSize: 14,
            textColor: White(0.6),
        },
    },

    // Thicker round bar, same colors as the modern CheckBox and RadioButton.
    modern: {
        layout: {
            gap: 8,
        },
        track: {
            height: 10,
            color: "#DFECEC", // 20% of bar color on white
            round: 100,
            border: 0, // WHY: no edge (the default has one)
            borderColor: "transparent",
        },
        bar: {
            color: "cadetblue", // #5F9EA0
            motion: 0.3,
        },
        successBar: {
            color: "#6FCF97",
        },
        errorBar: {
            color: "tomato",
        },
        title: {
            fontSize: 16,
            textColor: Black(0.85),
        },
        valueText: {
            fontSize: 14,
            textColor: "cadetblue",
        },
        indeterminate: {
            barWidth: 35,
            duration: 1.4,
        },
    },

};
ProgressBar.styles.classic = ProgressBar.styles.light; // the old name of light

// The moving stripes (a class can have an animation; its colors are css variables of the bar)
ProgressBar.injectCss = function () {
    basic.addCss("progress-bar-css",
        // WHY this gradient in a square tile: its stripes meet at the edges of the tile (no seam while it moves)
        ".progress-bar-stripes { background-image: linear-gradient(45deg, var(--progress-stripe-color) 25%, transparent 25%, transparent 50%," +
        " var(--progress-stripe-color) 50%, var(--progress-stripe-color) 75%, transparent 75%, transparent);" +
        " background-size: var(--progress-stripe-size) var(--progress-stripe-size);" +
        " animation: progress-bar-stripes var(--progress-stripe-speed) linear infinite; }" +
        "@keyframes progress-bar-stripes { to { background-position: var(--progress-stripe-size) 0; } }" +
        "@media (prefers-reduced-motion: reduce) { .progress-bar-stripes { animation: none; } }");
};

// The minimal theme (_designs/minimal-theme.htm): a 2 px track with no edge, the bar in ink, a 12 px title and value;
// an error in the danger color. minimalDark: the same on a dark window.
ProgressBar.createMinimalStyle = function (colors) {
    return {
        layout: { gap: 6 },
        track: { height: 2, color: colors.track, round: 1, border: 0, borderColor: "transparent" },
        darkTrack: { color: colors.track, borderColor: "transparent", limitColor: colors.ink },
        bar: { color: colors.ink, fillOpacity: 1, border: 0, borderColor: "", boxShadow: "none", innerRound: "", joinEdge: 0, motion: 0.3 },
        secondBar: { color: colors.softText, fillOpacity: 1, lighten: 0, borderOpacity: 0 },
        limit: { shape: "line", color: colors.danger, width: 1, overhang: 4, textSize: 11, textColor: colors.softText },
        successBar: { color: colors.ink },
        errorBar: { color: colors.danger },
        title: { fontSize: 12, textColor: colors.text },
        valueText: { fontSize: 12, textColor: colors.softText },
    };
};
ProgressBar.MINIMAL_COLORS = { ink: "#1F1F1F", track: Black(0.12), text: Black(0.85), softText: Black(0.55), danger: "#C24A36" };
ProgressBar.styles.minimal = ProgressBar.createMinimalStyle(ProgressBar.MINIMAL_COLORS);
ProgressBar.MINIMAL_DARK_COLORS = { ink: "#EDEDEB", track: White(0.14), text: White(0.88), softText: White(0.55), danger: "#FF9F93" };
ProgressBar.styles.minimalDark = ProgressBar.createMinimalStyle(ProgressBar.MINIMAL_DARK_COLORS);
