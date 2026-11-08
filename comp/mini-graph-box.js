/* Bismillah */

/*

MiniGraphBox - v26.09

UI COMPONENT TEMPLATE
- A small box with a title, a value text, an icon and a bar graph.
- The title, value text and icon can be changed. (setTitleText, setValueText, setIcon)
- The bar color can be changed. (setBarColor) A value can have its own color too. (addValue(12, "red"))
- New values are added to the right. When the graph is full, the first value is removed
  and all the bars move one step to the left.
- WHY: Bar objects are created one time. Only their heights and colors change. (Fast for live data)
- Bar count: As many bars as fit in the width. It is calculated again when the size changes.
- TOOLTIP ("at once, no delay"): the mouse over the bars shows the value of the bar under it in a
  small box over the bar. The bar is found from the mouse x (the bars are thin), the box follows live values.
  valueFormat(value, index, self) makes its text; showTooltip: 0 turns it off.

VALUE: A number, or { value, color }

USAGE:
const graph = MiniGraphBox({ title: "Sold Items", valueText: "1.3K", iconFile: "carrot.png", barColor: "tomato" });
graph.addValue(24);
graph.addValue(30, "orange");
graph.setValues([10, 20, 15]);
MiniGraphBox({ valueFormat: function (value) { return value + " items"; } });

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const MiniGraphBoxDefaults = {
    key: "0",
    width: 200,
    height: 80,
    titleText: "Sold Items",
    valueText: "1.3K",
    allowHtml: 0, // 1: titleText and valueText are HTML (only for your own texts)
    iconFile: "", // "": No icon
    barColor: "tomato",
    values: [], // [10, 20, { value: 15, color: "orange" }]
    maxValue: 0, // 0: Auto (the biggest visible value is the top of the graph)
    animated: 1, // 1: Bar heights change with a short motion.
    showTooltip: 1, // 1: the value of the bar under the mouse, in a small box (at once)
    valueFormat: function (value, index, self) { return String(value); }, // The text of the tooltip
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
        tooltip: {
            color: Black(0.8),
            textColor: "white",
            fontSize: 11,
            padding: [6, 2],
            round: 4,
            gap: 3, // between the tooltip and the top of the bar
            barOpacity: 0.55, // the other bars while one is under the mouse
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
    let cancelResize = null; // (box.after: stopped by remove())
    const BAR_MOTION = "height 0.2s, background-color 0.2s";
    const NEW_BAR_MOTION = "height 0.2s";
    const RESIZE_WAIT = 30; // ms
    let hoverIndex = -1; // The bar under the mouse (-1: none)

    // *** PUBLIC VARIABLES:
    // [var] Visible values, from left to right: [{ value, color }]
    box.values = [];
    // [var] How many bars fit in the width.
    box.barCount = 0;

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const normalizeValue = function (item) {
        if (item !== null && typeof item == "object") {
            return { value: basic.num(item.value) || 0, color: item.color || "" };
        }
        return { value: basic.num(item) || 0, color: "" };
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
        if (box.barCount <= 0) return; // WHY: made at width 0 (in a hidden group): the values wait for the bars
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

        createIn(box.barGroup, function () {

            for (let i = 0; i < box.barCount; i++) {

                // BOX: Bar
                const bar = Box({
                    width: _s.bars.barWidth,
                    height: 0,
                    color: box.barColor,
                    round: _s.bars.round,
                });
                bar.shrink = 0;
                bar.motion = "";
                barList.push(bar);

            }

        });

    };

    // Change the motion only if it is different. (Fewer style changes on every update)
    const setBarMotion = function (bar, motion) {
        if (bar.motion === motion) return;
        bar.motion = motion;
        bar.setMotionNow(motion); // WHY: setMotion() waits a little (timeout); the motion must change before the height.
    };

    const getBarHeight = function (item, max) {
        if (item.value <= 0 || max <= 0) return 0;
        const height = Math.round(Math.min(item.value, max) / max * _s.bars.height);
        return Math.max(_s.bars.minHeight, height);
    };

    // Write the values to the bars. (Bars are not moved; only their height and color change.)
    // newBarIndex: The bar of the new value (addValue). Only this bar is animated.
    // WHY: When the graph is full, every bar gets its right neighbour's value. If all of them are animated, the graph looks like a wave, not like moving to the left.
    const updateBars = function (newBarIndex = -1) {

        const max = getMaxValue();

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

            const height = getBarHeight(item, max);

            if (isNewBar && box.animated == 1) {
                // WHY: This bar showed another value before (graph is full). Start from 0, so it rises like a new bar.
                setBarMotion(bar, "none");
                bar.height = 0;
                bar.color = item.color || box.barColor;
                void bar.elem.offsetHeight; // WHY: Apply height 0 now, before the motion starts.
                setBarMotion(bar, NEW_BAR_MOTION);
            }

            bar.height = height;
            bar.color = item.color || box.barColor;

        });

        showTooltip(); // WHY: a live value under the mouse changes its text and its place too

    };

    // *** TOOLTIP:

    // The bar under the mouse: from its x over the bar group (the bars are too thin to point at).
    // WHY the scale: page.fit() zooms the page with a transform; clientX is in screen pixels.
    const findBarIndex = function (event) {
        const rect = box.barGroup.elem.getBoundingClientRect();
        const scale = rect.width / (box.barGroup.elem.offsetWidth || 1);
        const x = (event.clientX - rect.left) / scale - _s.bars.padding;
        const step = _s.bars.barWidth + _s.bars.gap;
        const index = Math.floor((x + _s.bars.gap / 2) / step);
        if (index < 0 || index >= box.values.length) return -1;
        return index;
    };

    // The other bars are fainter while one is under the mouse.
    const paintBars = function () {
        barList.forEach(function (bar, index) {
            const isFaint = (hoverIndex >= 0 && index != hoverIndex);
            bar.opacity = isFaint ? _s.tooltip.barOpacity : 1;
        });
    };

    // The box over the bar of hoverIndex, inside the graph (it is not cut at the sides).
    const showTooltip = function () {

        const item = box.values[hoverIndex];
        const bar = barList[hoverIndex];
        if (!item || !bar || box.showTooltip != 1) {
            // WHY: fewer values under a still mouse: the other bars must not stay faint
            if (hoverIndex >= 0 && (!item || !bar)) {
                hoverIndex = -1;
                paintBars();
            }
            box.lblTooltip.visible = 0;
            return;
        }

        box.lblTooltip.plainText = box.valueFormat(item.value, hoverIndex, box);
        box.lblTooltip.visible = 1;

        const barCenter = box.barGroup.elem.offsetLeft + bar.elem.offsetLeft + bar.elem.offsetWidth / 2;
        const tipWidth = box.lblTooltip.elem.offsetWidth;
        const tipHeight = box.lblTooltip.elem.offsetHeight;
        const maxLeft = box.elem.clientWidth - tipWidth;
        const barTop = box.barGroup.elem.offsetTop + box.barGroup.elem.offsetHeight - getBarHeight(item, getMaxValue());
        box.lblTooltip.left = Math.round(Math.max(0, Math.min(maxLeft, barCenter - tipWidth / 2)));
        box.lblTooltip.top = Math.round(Math.max(0, barTop - tipHeight - _s.tooltip.gap));

    };

    const setHoverIndex = function (index) {
        if (index == hoverIndex) return;
        hoverIndex = index;
        paintBars();
        showTooltip();
    };

    // Check the bar count again. (The box size can change: width "100%")
    const refreshSize = function () {

        if (!box) return;

        const barCount = calcBarCount();

        if (barCount != box.barCount) {
            box.barCount = barCount;
            createBars();
            trimValues();
            hoverIndex = -1;
            paintBars();
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

    box.setTitleText = function (text) {
        box.titleText = text;
        setText(box.lblTitle, text);
    };

    box.setValueText = function (text) {
        box.valueText = text;
        setText(box.lblValueText, text);
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
        box.maxValue = basic.num(maxValue) || 0;
        updateBars();
    };

    box.refresh = function () {
        refreshSize();
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
            fontSize: _s.title.fontSize,
            textColor: _s.title.textColor,
        });
        setText(box.lblTitle, box.titleText);
        // WHY: marginBottom: Line heights of the two texts leave a big space between them.
        box.lblTitle.css = { whiteSpace: "nowrap", marginBottom: "-6px" };

        box.lblValueText = Label({
            fontSize: _s.valueText.fontSize,
            textColor: _s.valueText.textColor,
        });
        setText(box.lblValueText, box.valueText);
        box.lblValueText.css.whiteSpace = "nowrap";

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

    // LABEL: Tooltip (the value of the bar under the mouse; no motion: it is seen at once)
    box.lblTooltip = Label({
        left: 0,
        top: 0,
        width: "auto",
        height: "auto",
        color: _s.tooltip.color,
        textColor: _s.tooltip.textColor,
        fontSize: _s.tooltip.fontSize,
        padding: _s.tooltip.padding,
        round: _s.tooltip.round,
        visible: 0,
        css: { whiteSpace: "nowrap", pointerEvents: "none" },
    });

    // *** OBJECT INIT CODE:

    box.on("click", function () { box.onClick(box); });
    box.cursor = "default";
    box.clickable = 1; // WHY: the mouse events of the tooltip (a basic.js box gets none by default)
    box.on("mousemove", function (self, event) {
        setHoverIndex(findBarIndex(event));
    });
    box.on("mouseleave", function () {
        setHoverIndex(-1);
    });

    box.setIcon(box.iconFile);

    box.values = (params.values || []).map(normalizeValue); // WHY: Copy. The default [] must not be shared between components.
    box.barCount = calcBarCount();
    createBars();
    trimValues();
    updateBars();

    box.onResize(function () {
        if (cancelResize) cancelResize();
        cancelResize = box.after(RESIZE_WAIT, function () {
            cancelResize = null;
            refreshSize();
        });
    });

    return endObject(box);

};
