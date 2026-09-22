/* Bismillah */

/*

Progress Bar - v26.09

UI COMPONENT TEMPLATE
- A horizontal progress bar with a title and a value text.
- Determinate: value / max (smooth animation when the value changes).
- Indeterminate: a moving bar, when the progress is not known. (Ex: "Connecting...")
- Status colors: "normal", "success", "error".
- Value text position: "top" (right of the title), "right" (right of the bar), "none".
- Style packages: "classic" (default), "modern". Select with styleName. (ProgressBar.styles)
- Everything is drawn with code (no image files needed).

NOTE: comp-m3/progress-bar.js (vertical lines style) is named LineProgressBar, so both can be loaded on the same page.

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
    max: 100,
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
        track: { // Background of the bar
            height: 8,
            color: Black(0.1),
            round: 4,
        },
        bar: {
            color: "#141414",
            motion: 0.3, // Seconds. 0: No animation
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
    const _styleName = params.styleName || ProgressBarDefaults.styleName;
    const _stylePackage = ProgressBar.styles[_styleName];
    if (!_stylePackage) console.warn("ProgressBar: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, ProgressBarDefaults);

    // Edit params, if needed:
    params.color = "transparent";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let moveAnimation = null; // Indeterminate animation (Web Animations API)

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.value, box.max, box.status)

    // *** PRIVATE FUNCTIONS:

    const clampValue = function (value) {
        value = Number(value);
        if (isNaN(value)) value = 0;
        return Math.min(Math.max(value, 0), box.max);
    };

    const getBarMotion = function () {
        return "width " + box.style.bar.motion + "s, background-color 0.2s";
    };

    // Change the bar size without animation. (Ex: from the moving bar to the value)
    const updateViewWithoutMotion = function () {
        box.bar.setMotionNow("none");
        updateView();
        box.bar.elem.offsetWidth; // WHY: Apply the new width before the motion is turned on again.
        box.bar.setMotionNow(getBarMotion());
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

        box.bar.color = getBarColor();

        if (box.indeterminate == 1) {
            box.bar.width = box.style.indeterminate.barWidth + "%";
            startMoveAnimation();
            box.elem.removeAttribute("aria-valuenow");
        } else {
            stopMoveAnimation();
            box.bar.width = box.getPercent() + "%";
            box.elem.setAttribute("aria-valuenow", String(box.value));
        }

        if (box.valueLabel) {
            box.valueLabel.text = (box.indeterminate == 1) ? "" : box.valueFormat(box);
        }

        box.elem.setAttribute("aria-valuemax", String(box.max));

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

    box.addValue = function (step = 1) {
        box.setValue(box.value + step);
    };
    // USAGE: progressBar.addValue(10)

    box.setMax = function (max) {
        max = Number(max);
        box.max = (isNaN(max) || max < 0) ? 0 : max;
        box.value = clampValue(box.value);
        updateView();
    };
    // USAGE: get: progressBar.max, set: progressBar.setMax(20) // Ex: 20 files

    box.setIndeterminate = function (indeterminate) {
        box.indeterminate = (indeterminate == 1 || indeterminate === true) ? 1 : 0;
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
        updateViewWithoutMotion();
    };
    // USAGE: progressBar.reset() // value: 0, status: "normal"

    box.refresh = function () {
        updateView();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        stopMoveAnimation();
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:
    box.elem.setAttribute("role", "progressbar");
    box.elem.setAttribute("aria-valuemin", "0");

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
            gap: 10,
        });

            // LABEL: Title
            box.titleLabel = Label(box.style.title);
            box.titleLabel.text = box.titleText;
            box.titleLabel.elem.style.flex = "1 1 auto";
            box.titleLabel.elem.style.minWidth = "0";
            box.titleLabel.elem.style.overflow = "hidden";
            box.titleLabel.elem.style.textOverflow = "ellipsis";
            box.titleLabel.elem.style.whiteSpace = "nowrap";
            if (!box.titleText) box.titleLabel.visible = 0;

            // LABEL: Value text (top)
            if (box.valuePosition === "top") {
                box.valueLabel = Label(box.style.valueText);
                box.valueLabel.elem.style.marginLeft = "auto"; // Right side, also without a title.
                box.valueLabel.elem.style.whiteSpace = "nowrap";
            }

        endGroup();

        // GROUP: Bar row (track, value text)
        box.barRow = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 10,
        });

            // BOX: Track
            box.track = startBox({
                width: "auto",
                height: box.style.track.height,
                color: box.style.track.color,
                round: box.style.track.round,
            });
            box.track.clipContent = 1;
            box.track.elem.style.flex = "1 1 0";
            box.track.elem.style.minWidth = "0";

                // BOX: Bar
                box.bar = Box({
                    left: 0,
                    top: 0,
                    width: "0%",
                    height: "100%",
                    color: getBarColor(),
                    round: box.style.track.round,
                });

            endBox();

            // LABEL: Value text (right)
            if (box.valuePosition === "right") {
                box.valueLabel = Label(box.style.valueText);
                box.valueLabel.elem.style.whiteSpace = "nowrap";
                box.valueLabel.elem.style.minWidth = "3em"; // WHY: The bar width does not jump when the text changes. (9% -> 10%)
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
    box.indeterminate = (box.indeterminate == 1 || box.indeterminate === true) ? 1 : 0;
    box.status = (box.status === "success" || box.status === "error") ? box.status : "normal";

    updateTopRow();
    updateView();

    // NOTE: setMotion() waits a short time, so the bar does not grow from 0 when it is created.
    box.bar.setMotion(getBarMotion());

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: ProgressBar({ styleName: "modern" })
// USAGE: ProgressBar({ styleName: "modern", style: { bar: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: ProgressBar.styles.myStyle = { bar: { color: "red" } };
ProgressBar.styles = {

    // Thin dark bar on a light gray track.
    classic: ProgressBarDefaults.style,

    // Thicker round bar, same colors as the modern CheckBox and RadioButton.
    modern: {
        layout: {
            gap: 8,
        },
        track: {
            height: 10,
            color: "#DFECEC", // 20% of bar color on white
            round: 100,
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
