/* Bismillah */

/*

Progress Bar - v26.09

UI COMPONENT TEMPLATE
- A horizontal progress bar with a title and a value text.
- Determinate: value / max (smooth animation when the value changes).
- Indeterminate: a moving bar, when the progress is not known. (Ex: "Connecting...")
- Status colors: "normal", "success", "error".
- Value text position: "top" (right of the title), "right" (right of the bar), "none".
- TWO PARTS (2026-10-29, the user): secondValue is a second part after the value (Ex: 70 done + 5 on the way);
  its own color (style.secondBar). The value text and onComplete are of the value only.
- STRIPES: stripes: 1 (the value) and secondStripes: 1 (the second part) draw light diagonal stripes that move
  slowly (a job is running); setStripes() / setSecondStripes(). Still with prefers-reduced-motion. (style.stripes)
- LIMITS: limits: [80] or [{ value: 30, color: "#7BA7D9" }, { value: 80, text: "80" }]: vertical lines over the bar
  at these values (in the units of value / max), a little longer than the bar, a text under a line (style.limit);
  setLimits().
- Style packages: "classic" (default), "modern", "ozden" (the lines of comp-m1 UIProgressBar: the track of the
  default, the bar its main color at 50% with an edge of it, a dark limit line with a text; the user 2026-10-29).
  "ozdenDark" (the same bar for a dark page). Select with styleName. (ProgressBar.styles)
- THE TRACK of every bar (basic-designer, 2026-10-30): 16 px, #F2F2F2, a 2 px light gray edge, round 4 (the default;
  "modern" keeps its own: 10 px, no edge, round ends).
- Everything is drawn with code (no image files needed).

NOTE: comp/line-progress-bar.js (vertical lines style) is named LineProgressBar, so both can be loaded on the same page.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ProgressBarDefaults = {
    key: "0",
    width: 320,
    height: "auto",
    value: 0, // 0 - max
    secondValue: 0, // A second part after the value (value + secondValue <= max). 0: none
    max: 100,
    stripes: 0, // 1: moving stripes on the value part
    secondStripes: 0, // 1: moving stripes on the second part
    limits: [], // Lines at these values: [80] or [{ value: 80, color: "indianred" }]
    indeterminate: 0, // 1: Progress is not known, show a moving bar.
    status: "normal", // "normal", "success", "error"
    titleText: "",
    valuePosition: "top", // "top", "right", "none" (Only at create time)
    valueFormat: function (self) { // Returns the value text.
        return Math.round(self.getPercent()) + "%";
    },
    onChange: function (self) { }, // self.value
    onComplete: function (self) { }, // Called once when the value reaches max.
    styleName: "classic", // "classic", "modern" or a name added to ProgressBar.styles
    style: { // Classic style package (default)
        layout: {
            gap: 6, // Space between the title row and the bar
        },
        track: { // Background of the bar (basic-designer, 2026-10-30: the default of every bar; was 8 px, Black(0.1), no edge)
            height: 16,
            color: "#F2F2F2",
            round: 4,
            border: 2,
            borderColor: "rgba(0, 0, 0, 0.1)",
            css: {}, // Ex: { backgroundImage: "linear-gradient(#EEE, #D0D0D0)" }
        },
        bar: {
            color: "#141414", // the main color (also of the edge, when borderColor is "")
            fillOpacity: 1, // the inside of the bar: the main color at this opacity (Ex: 0.5 with an edge of 1)
            border: 0,
            borderColor: "", // "": the main color (of the status too)
            motion: 0.3, // Seconds. 0: No animation
        },
        secondBar: { // The second part (secondValue)
            color: Black(0.35), // "": the main color at fillOpacity (it follows the main color)
            fillOpacity: 0.2,
            borderOpacity: 0.45, // its edge (when the bar has one): the main color at this opacity
        },
        stripes: {
            color: "rgba(255, 255, 255, 0.35)",
            size: 14, // px: one stripe and its gap
            speed: 0.8, // seconds for one step of the stripes
        },
        limit: {
            color: "indianred", // (a limit can have its own color)
            width: 1, // px
            round: 0,
            overhang: 6, // px over and under the track
            textSize: 13, // the text of a limit ({ value, text }) under its line
            textColor: Black(0.7),
            textSpace: 6, // px between the line and its text
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

    // Merge style package: params.style > ProgressBar.styles[styleName] > ProgressBarDefaults.style (classic)
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
    // NOTE: Default values are also public variables. (box.value, box.max, box.status)

    // *** PRIVATE FUNCTIONS:

    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = 0;
        return Math.min(Math.max(value, 0), box.max);
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

    // The second part fits in what the value leaves (value + secondValue <= max)
    const clampSecondValue = function (value) {
        value = Number(value);
        if (isNaN(value) || value < 0) value = 0;
        return Math.min(value, Math.max(0, box.max - box.value));
    };

    const toPercent = function (value) {
        return (box.max > 0) ? (value / box.max) * 100 : 0;
    };

    // The inside and the edge of a part from its main color (a status changes the main color)
    const paintPart = function (bar, mainColor, fillOpacity, edgeColor) {
        bar.color = (fillOpacity < 1) ? Alpha(mainColor, fillOpacity) : mainColor;
        if (box.style.bar.border) bar.borderColor = edgeColor;
    };

    const paintBars = function () {
        const _b = box.style.bar;
        const _sb = box.style.secondBar;
        const mainColor = getBarColor();
        paintPart(box.bar, mainColor, Number(_b.fillOpacity), _b.borderColor || mainColor);
        // WHY "": the second part follows the main color (one color to change for a new look)
        if (_sb.color) paintPart(box.secondBar, _sb.color, 1, _b.borderColor || mainColor);
        else paintPart(box.secondBar, mainColor, Number(_sb.fillOpacity), _b.borderColor || Alpha(mainColor, Number(_sb.borderOpacity)));
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

    // LIMITS: thin vertical lines over the track; a number or { value, color }
    const drawLimits = function () {
        box.limitLines.forEach(function (line) { line.remove(); });
        box.limitLines = [];
        const _l = box.style.limit;
        const lineHeight = box.style.track.height + _l.overhang * 2;
        createIn(box.trackArea, function () {
            box.limits.forEach(function (limit) {
                const data = (typeof limit === "object" && limit !== null) ? limit : { value: limit };
                const value = Number(data.value);
                if (isNaN(value)) return;
                const left = toPercent(Math.min(Math.max(value, 0), box.max)) + "%";
                const line = Box({ top: 0, width: _l.width, height: lineHeight, color: data.color || _l.color, round: _l.round });
                line.css = { left: "calc(" + left + " - " + (_l.width / 2) + "px)" };
                box.limitLines.push(line);
                // LABEL: the text of the limit, under its line
                if (data.text === undefined || data.text === "") return;
                const text = Label({ top: lineHeight + _l.textSpace, fontSize: _l.textSize, textColor: data.color || _l.textColor });
                text.plainText = data.text;
                text.css = { left: left, transform: "translateX(-50%)", whiteSpace: "nowrap" };
                box.limitLines.push(text);
            });
        });
        layoutTrackArea();
    };

    // The track (and the bars over it) are in the middle of the area; the area is taller with limit lines, and
    // with room for their texts
    const layoutTrackArea = function () {
        const _t = box.style.track;
        const _l = box.style.limit;
        const hasLimits = box.limits.length > 0;
        const hasText = box.limits.some(function (limit) { return limit && typeof limit === "object" && limit.text !== undefined && limit.text !== ""; });
        const overhang = hasLimits ? _l.overhang : 0;
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
            startMoveAnimation();
            box.aria = { valuenow: null };
        } else {
            stopMoveAnimation();
            box.bar.width = box.getPercent() + "%";
            box.bar.visible = (box.value > 0) ? 1 : 0; // WHY: a bar with an edge was a thin line at 0
            // WHY from 0: the second bar is under the first one, so their round ends meet as one bar
            box.secondValue = clampSecondValue(box.secondValue);
            box.secondBar.width = toPercent(box.value + box.secondValue) + "%";
            box.secondBar.visible = (box.secondValue > 0) ? 1 : 0;
            box.aria = { valuenow: String(box.value) };
        }

        if (box.valueLabel) {
            box.valueLabel.text = (box.indeterminate == 1) ? "" : box.valueFormat(box);
        }

        box.aria = { valuemax: String(box.max) };

    };

    // *** PUBLIC FUNCTIONS:

    box.getPercent = function () {
        return (box.max > 0) ? (box.value / box.max) * 100 : 0;
    };
    // USAGE: progressBar.getPercent() // 0 - 100

    box.setValue = function (value, silent = 0) {

        value = clampValue(value);
        if (box.value == value && box.indeterminate != 1) return;

        const _wasComplete = (box.value >= box.max);
        box.value = value;

        if (box.indeterminate == 1) {
            box.indeterminate = 0; // A known value ends the indeterminate mode.
            updateViewWithoutMotion();
        } else {
            updateView();
        }

        if (!silent) {
            box.onChange(box);
            if (!_wasComplete && box.value >= box.max) box.onComplete(box);
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

    box.setLimits = function (limits) {
        box.limits = Array.isArray(limits) ? limits.slice() : [];
        drawLimits();
    };
    // USAGE: progressBar.setLimits([{ value: 30, color: "#7BA7D9" }, 80])

    box.addValue = function (step = 1) {
        box.setValue(box.value + step);
    };
    // USAGE: progressBar.addValue(10)

    box.setMax = function (max) {
        max = Number(max);
        box.max = (isNaN(max) || max < 0) ? 0 : max;
        box.value = clampValue(box.value);
        updateView();
        drawLimits(); // (the places of the limits are relative to max)
    };
    // USAGE: get: progressBar.max, set: progressBar.setMax(20) // Ex: 20 files

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
        box.titleLabel.text = text;
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
            box.titleLabel.text = box.titleText;
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

                    // BOX: Second part (under the bar, from 0 to value + secondValue)
                    box.secondBar = Box({
                        left: 0,
                        top: 0,
                        width: "0%",
                        height: "100%",
                        color: box.style.secondBar.color,
                        round: box.style.track.round,
                        border: box.style.bar.border,
                        borderColor: box.style.bar.borderColor,
                    });

                    // BOX: Bar
                    box.bar = Box({
                        left: 0,
                        top: 0,
                        width: "0%",
                        height: "100%",
                        color: getBarColor(),
                        round: box.style.track.round,
                        border: box.style.bar.border,
                        borderColor: box.style.bar.borderColor,
                    });

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

    box.max = (Number(box.max) >= 0) ? Number(box.max) : 100;
    box.value = clampValue(box.value);
    box.indeterminate = basic.isOn(box.indeterminate) ? 1 : 0;
    box.status = (box.status === "success" || box.status === "error") ? box.status : "normal";

    box.limits = Array.isArray(box.limits) ? box.limits.slice() : [];
    box.limitLines = [];

    updateTopRow();
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
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: ProgressBar.styles.myStyle = { bar: { color: "red" } };
ProgressBar.styles = {

    // Thin dark bar on a light gray track.
    classic: ProgressBarDefaults.style,

    // The ozden bar (the user, 2026-10-29): the lines of comp-m1/ui-progress-bar.js (UIProgressBar): the track of the
    // default (16 px, a 2 px light gray edge, round 4; 2026-10-30, was 20 px, white, a 3 px edge, round ends); the
    // bar is its main color at 50% with a 2 px edge of the main color, over the edge of the track; a 4 px dark limit
    // line with its text under it. The main color can change (style.bar.color: the inside, the edge and the second
    // part follow it); yellow for now (UIProgressBar "yellow").
    ozden: {
        layout: {
            gap: 8,
        },
        bar: {
            color: "#F1C74A",
            fillOpacity: 0.5,
            border: 2, // (as wide as the edge of the track: the bar covers it)
            borderColor: "", // the main color
            motion: 0.3,
        },
        secondBar: {
            color: "", // the main color, lighter
            fillOpacity: 0.2,
            borderOpacity: 0.45,
        },
        stripes: {
            color: "rgba(255, 255, 255, 0.55)",
            size: 14,
            speed: 0.8,
        },
        successBar: {
            color: "#40A5AF", // the colors of UIProgressBar
        },
        errorBar: {
            color: "#FE5D49",
        },
        limit: {
            color: "rgba(0, 0, 0, 0.7)",
            width: 4,
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

    // The ozden bar for a dark page (2026-11-06): a dark track with a soft edge, the bar in the main color of the kit.
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
            border: 0, // WHY: no edge (the default has one since 2026-10-30)
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
