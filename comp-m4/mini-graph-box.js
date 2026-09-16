/* Bismillah */

/*

MiniGraphBox - v26.09

UI COMPONENT TEMPLATE
- A small box with a title, a value text, an icon and a bar graph.
- The title, value text and icon can be changed. (setTitle, setValueText, setIcon)
- The bar color can be changed. (setBarColor) A value can have its own color too. (addValue(12, "red"))
- New values are added to the right. When the graph is full, the first value is removed
  and all the bars move one step to the left.
- WHY: Bar objects are created one time. Only their heights and colors change. (Fast for live data)
- Bar count: As many bars as fit in the width. It is calculated again when the size changes.

VALUE: A number, or { value, color }

USAGE:
const graph = MiniGraphBox({ title: "Sold Items", valueText: "1.3K", iconFile: "carrot.png", barColor: "tomato" });
graph.addValue(24);
graph.addValue(30, "orange");
graph.setValues([10, 20, 15]);

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const MiniGraphBoxDefaults = {
    key: "0",
    width: 200,
    height: 80,
    title: "Sold Items",
    valueText: "1.3K",
    iconFile: "", // "": No icon
    barColor: "tomato",
    values: [], // [10, 20, { value: 15, color: "orange" }]
    maxValue: 0, // 0: Auto (the biggest visible value is the top of the graph)
    animated: 1, // 1: Bar heights change with a short motion.
    onClick: function (self) { },
    style: {
        box: {
            color: "whitesmoke",
            border: 1,
            borderColor: Black(0.6),
            round: 4,
        },
        text: {
            padding: 8,
        },
        title: {
            fontSize: 12,
            textColor: Black(0.5),
        },
        valueText: {
            fontSize: 20,
            textColor: Black(0.75),
        },
        icon: {
            width: 24,
            height: 24,
        },
        bars: {
            height: 30, // The tallest bar height
            minHeight: 2, // Height for small values (bigger than 0)
            barWidth: 3,
            gap: 1,
            padding: 2, // Left and right space
            round: 1,
        },
    }
};

const MiniGraphBox = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, MiniGraphBoxDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let barList = []; // Bar objects (created one time for the bar count)
    let resizeTimer = null;
    const BAR_MOTION = "height 0.2s, background-color 0.2s";

    // *** PUBLIC VARIABLES:
    // [var] Visible values, from left to right: [{ value, color }]
    box.values = [];
    // [var] How many bars fit in the width.
    box.barCount = 0;

    // *** PRIVATE FUNCTIONS:

    const normalizeValue = function (item) {
        if (item !== null && typeof item == "object") {
            return { value: num(item.value) || 0, color: item.color || "" };
        }
        return { value: num(item) || 0, color: "" };
    };

    // How many bars fit in the inner width of the box.
    const calcBarCount = function () {
        const innerWidth = box.elem.clientWidth - (_s.bars.padding * 2);
        const step = _s.bars.barWidth + _s.bars.gap;
        // WHY: The last bar does not need a gap after it.
        return Math.max(0, Math.floor((innerWidth + _s.bars.gap) / step));
    };

    // Keep only the last values that fit in the graph.
    const trimValues = function () {
        if (box.values.length > box.barCount) {
            box.values = box.values.slice(box.values.length - box.barCount);
        }
    };

    const getMaxValue = function () {
        if (box.maxValue > 0) return box.maxValue;
        let max = 0;
        box.values.forEach(function (item) {
            if (item.value > max) max = item.value;
        });
        return max;
    };

    // Create the bar objects. (Only when the bar count changes.)
    const createBars = function () {

        barList.forEach(function (bar) { bar.remove(); });
        barList = [];

        const previous = getDefaultContainerBox();
        setDefaultContainerBox(box.barGroup);

        for (let i = 0; i < box.barCount; i++) {

            // BOX: Bar
            const bar = Box({
                width: _s.bars.barWidth,
                height: 0,
                color: box.barColor,
                round: _s.bars.round,
            });
            bar.elem.style.flexShrink = "0";
            bar.motion = "";
            barList.push(bar);

        }

        setDefaultContainerBox(previous);

    };

    // Change the motion only if it is different. (Fewer style changes on every update)
    const setBarMotion = function (bar, motion) {
        if (bar.motion === motion) return;
        bar.motion = motion;
        bar.setMotionNow(motion); // WHY: setMotion() waits a little (timeout); the motion must change before the height.
    };

    // Write the values to the bars. (Bars are not moved; only their height and color change.)
    // newBarIndex: The bar of the new value (addValue). Only this bar is animated.
    // WHY: When the graph is full, every bar gets its right neighbour's value. If all of them are animated, the graph looks like a wave, not like moving to the left.
    const updateBars = function (newBarIndex = -1) {

        const max = getMaxValue();
        const graphHeight = _s.bars.height;

        barList.forEach(function (bar, index) {

            const item = box.values[index];
            const isNewBar = (index == newBarIndex);

            if (box.animated != 1 || (newBarIndex >= 0 && !isNewBar)) {
                setBarMotion(bar, "none");
            } else if (!isNewBar) {
                setBarMotion(bar, BAR_MOTION);
            }

            if (!item) {
                bar.height = 0;
                bar.elem.title = "";
                return;
            }

            let height = 0;
            if (item.value > 0 && max > 0) {
                height = Math.round(Math.min(item.value, max) / max * graphHeight);
                height = Math.max(_s.bars.minHeight, height);
            }

            if (isNewBar && box.animated == 1) {
                // WHY: This bar showed another value before (graph is full). Start from 0, so it rises like a new bar.
                setBarMotion(bar, "none");
                bar.height = 0;
                bar.color = item.color || box.barColor;
                void bar.elem.offsetHeight; // Apply height 0 now, before the motion starts.
                setBarMotion(bar, "height 0.2s");
            }

            bar.height = height;
            bar.color = item.color || box.barColor;
            bar.elem.title = String(item.value); // Value on mouse over

        });

    };

    // Check the bar count again. (The box size can change: width "100%")
    const refreshSize = function () {

        if (!box) return;

        const barCount = calcBarCount();

        if (barCount != box.barCount) {
            box.barCount = barCount;
            createBars();
            trimValues();
        }

        updateBars();

    };

    // *** PUBLIC FUNCTIONS:

    // Add a value to the right. If the graph is full, the first value is removed.
    box.addValue = function (value, color) {

        const item = normalizeValue(value);
        if (color) item.color = color;

        box.values.push(item);
        trimValues();
        updateBars(box.values.length - 1);

    };
    // USAGE: graph.addValue(24) or graph.addValue(24, "orange")

    box.setValues = function (values) {
        box.values = (values || []).map(normalizeValue);
        trimValues();
        updateBars();
    };
    // USAGE: graph.setValues([10, 20, { value: 15, color: "orange" }])

    box.getValues = function () {
        return box.values.map(function (item) { return item.value; });
    };

    box.getLastValue = function () {
        const item = box.values[box.values.length - 1];
        return (item) ? item.value : null;
    };

    box.clear = function () {
        box.values = [];
        updateBars();
    };

    box.setTitle = function (text) {
        box.title = text;
        box.lblTitle.text = text;
    };

    box.setValueText = function (text) {
        box.valueText = text;
        box.lblValueText.text = text;
    };

    box.setIcon = function (iconFile) {
        box.iconFile = iconFile || "";
        box.icon.visible = (box.iconFile) ? 1 : 0;
        if (box.iconFile) box.icon.load(box.iconFile);
    };
    // USAGE: graph.setIcon("assets/carrot.png") or graph.setIcon("") to hide it

    // Color of all the bars. (Values with their own color keep it.)
    box.setBarColor = function (color) {
        box.barColor = color;
        updateBars();
    };

    // 0: Auto
    box.setMaxValue = function (maxValue) {
        box.maxValue = num(maxValue) || 0;
        updateBars();
    };

    box.refresh = function () {
        refreshSize();
    };

    box.destroy = function () {
        clearTimeout(resizeTimer);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;
    };

    // *** OBJECT VIEW:

    // GROUP: Bars (at the bottom)
    box.barGroup = HGroup({
        align: "left bottom",
        gap: _s.bars.gap,
        padding: [_s.bars.padding, 0],
    });

    endGroup();

    // GROUP: Title and value text (left top)
    VGroup({
        align: "left top",
        padding: _s.text.padding,
        gap: 0,
    });

        box.lblTitle = Label({
            text: box.title,
            fontSize: _s.title.fontSize,
            textColor: _s.title.textColor,
        });
        box.lblTitle.elem.style.whiteSpace = "nowrap";
        box.lblTitle.elem.style.marginBottom = "-6px"; // WHY: Line heights of the two texts leave a big space between them.

        box.lblValueText = Label({
            text: box.valueText,
            fontSize: _s.valueText.fontSize,
            textColor: _s.valueText.textColor,
        });
        box.lblValueText.elem.style.whiteSpace = "nowrap";

    endGroup();

    // GROUP: Icon (right top)
    HGroup({
        align: "right top",
        padding: _s.text.padding,
        gap: 0,
    });

        box.icon = Icon({
            width: _s.icon.width,
            height: _s.icon.height,
        });
        box.icon.elem.alt = "";

    endGroup();

    // *** OBJECT INIT CODE:

    box.on("click", function () { box.onClick(box); });
    box.elem.style.cursor = "default";

    box.setIcon(box.iconFile);

    box.values = (params.values || []).map(normalizeValue); // WHY: Copy. The default [] must not be shared between components.
    box.barCount = calcBarCount();
    createBars();
    trimValues();
    updateBars();

    box.onResize(function () {
        resizeTimer = waitAndRun(resizeTimer, refreshSize, 30);
    });

    return endObject(box);

};
