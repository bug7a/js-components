/* Bismillah */

/*

GraphBox - v26.11

UI COMPONENT
- Charts with no library: this one file draws the whole chart as one SVG. No Chart.js, no other file, no internet.
  (comp/chart-box.js is the bridge to Chart.js. Its params and functions are the model here, so a page can move over.)
- Chart types: "line", "area", "bar" (more than one dataset: bars side by side; stacked: 1 one on the other;
  horizontal: 1 bars that grow to the right).
- Light and dark themes ("light", "dark", "auto"). A dataset gets its color from the theme and keeps it, also when
  another dataset is hidden or removed.
- The axis finds clean numbers by itself (0, 20K, 40K...). A label that has no room is skipped (a line chart: time)
  or it turns (a bar chart: every bar needs its name).
- Mouse, touch and keyboard: a tooltip with every dataset at that place. (Left / right arrows, Escape, Enter.)
- The legend hides and shows a dataset with a click.

USAGE:
const sales = GraphBox({
    width: 500, height: 300,
    type: "bar",
    titleText: "Sales",
    labels: ["Jan", "Feb", "Mar"],
    values: [12, 19, 7], // Shortcut for one dataset. Or: datasets: [{ label: "2026", data: [12, 19, 7] }]
    formatValue: (value) => value + " ₺",
    onClick: (self, item) => println(item.label + ": " + item.value),
});
sales.addValue("Apr", 15);
sales.setTheme("dark");

A DATASET: { label: "2026", data: [12, null, 7], color: "#2A78D6", type: "line" }
- null in data: no value at that place (a line breaks there).
- color: its own color. colors: [...]: a color for each bar.
- type: "line", "area", "bar" (only this dataset; the others keep the type of the chart: a mixed chart).
- fill: 1 (a soft area under the line), "gradient" (it fades towards the base line).
- curve: "linear", "smooth". dashed: 1 (Ex: a target). showPoints: 1, 0, "auto". hidden: 1.

Started Date: November 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const GraphBoxDefaults = {
    key: "0",
    width: 500,
    height: 300,
    type: "line", // "line", "area", "bar"
    theme: "light", // "light", "dark", "auto" (follows the system setting)
    titleText: "",
    subtitleText: "",
    labels: null, // ["Jan", "Feb", "Mar"]
    values: null, // [12, 19, 7] Shortcut: creates one dataset.
    datasets: null, // [{ label: "2026", data: [12, 19, 7], ...see A DATASET above }]
    data: null, // { labels, datasets } (Used instead of labels, values and datasets.)
    legend: "auto", // "auto" (2+ datasets), "top", "bottom", "left", "right", "none"
    stacked: 0, // 1: Bars one on the other, lines and areas over each other. The tooltip adds totalText.
    horizontal: 0, // 1: The values grow to the right. (Long names read better so.)
    totalText: "Total", // The last row of the tooltip of a stacked chart. "": No total
    beginAtZero: 1, // 1: The value axis holds 0. (A bar chart always holds it: the length of a bar is its value.)
    minValue: null, // null: From the values.
    maxValue: null, // null: From the values. Ex: 100
    curve: "linear", // "linear", "smooth" (never goes over a value)
    showPoints: "auto", // "auto": When there is room for them. 1, 0
    formatValue: null, // function (value) { return value + " ₺"; } For the tooltip and the value axis.
    locale: "", // "": The language of the browser. Ex: "tr-TR"
    maxCount: 0, // addValue(): 0: No limit. Ex: 20 (the first value is removed, for live data)
    emptyText: "No data", // In the middle of a chart with no values. "": Nothing
    onClick: function (self, item, event) { }, // item: { datasetIndex, index, label, value, datasetLabel, dataset }
    style: {
        box: {
            color: "", // "": The backgroundColor of the theme
            border: 1,
            borderColor: "", // "": The borderColor of the theme
            round: 12,
            padding: 16,
            gap: 12, // Between the texts, the legend and the chart
        },
        colors: {
            // Changes some colors of the theme. Ex: { gridColor: "#334155", colors: ["#38BDF8", "#8B5CF6"] }
        },
        title: { fontSize: 16, fontFamily: "opensans-bold" },
        subtitle: { fontSize: 12 },
        legend: { fontSize: 12, gap: 14, lineGap: 6, keyGap: 6, hiddenOpacity: 0.4 },
        axis: {
            fontSize: 12,
            fontFamily: "opensans, system-ui, -apple-system, 'Segoe UI', sans-serif",
            labelGap: 8, // Between a text of the axis and the chart
            tickSpace: 40, // About this many px between two lines of the value axis
            labelSpace: 10, // At least this many px between two labels
            labelAngle: 35, // Degrees. The labels of the bars turn when they have no room. 0: A label is skipped instead.
            maxLabelShare: 0.3, // A turned label is cut with "..." at this much of the height of the chart.
            maxSideLabelShare: 0.35, // horizontal: 1: a label is cut with "..." at this much of the width of the chart.
        },
        bar: {
            maxThickness: 24,
            round: 4, // Only at the end of the value. The base stays square.
            gap: 2, // Between two bars side by side, and between two values of a stack
            minLength: 1, // A very small value is still this long.
            bandShare: 0.72, // How much of its place a group of bars can fill
        },
        line: {
            width: 2,
            pointRadius: 4,
            pointRing: 2, // The ring in the color of the box, so a point stays clear where lines cross
            pointSpace: 18, // showPoints "auto": points only when two values are this many px apart
            fillOpacity: 0.1,
            gradientOpacity: 0.3, // At the top of a "gradient" fill
            dash: "5 5",
        },
        tooltip: {
            fontSize: 12,
            round: 6,
            padding: [10, 8],
            gap: 4,
            keyWidth: 12,
            keyHeight: 3,
            distance: 14, // Between the mouse and the tooltip
            edge: 4, // It stays this many px inside the box.
            maxNameWidth: 180,
            shadow: "0 4px 14px rgba(0, 0, 0, 0.18)",
        },
    },
};

const GraphBox = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, GraphBoxDefaults);

    // WHY: startObject() keeps the arrays of the page by reference. The data is kept out of it: box.data is a copy.
    const dataParams = { labels: params.labels, values: params.values, datasets: params.datasets, data: params.data };
    const boxParams = Object.assign({}, params);
    Object.keys(dataParams).forEach(function (key) { delete boxParams[key]; });

    // BOX: Component container
    const box = startObject(boxParams);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const SVG_NS = "http://www.w3.org/2000/svg";
    const LEGEND_FLOWS = { top: "column", bottom: "column-reverse", left: "row", right: "row-reverse" };
    const STEP_KEYS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const hasClickEvent = (box.onClick !== GraphBoxDefaults.onClick);
    const colorIndexes = new Map(); // The key of a series -> its place in the colors of the theme
    const tooltipRows = [];
    let colors = null; // The colors of the theme + style.colors
    let svg, definitions, gridLayer, washLayer, markLayer, overlayLayer;
    let view = null; // What the last drawing knows about its marks. null: nothing is drawn.
    let activeItem = null; // { index, datasetIndex }: under the mouse, or chosen with the keyboard.
    let pointer = null; // { x, y } in the plot. null: the keyboard chose the item.
    let legendSignature = "";
    let drawnSize = "";

    // *** PUBLIC VARIABLES:
    // [var] { labels, datasets } A copy of the data of the page. After a change: box.update()
    box.data = null;
    // [var] The SVG element of the chart
    box.svg = null;
    // [var] The objects of the legend
    box.legendItems = [];

    // *** PRIVATE FUNCTIONS:

    // DRAWING: each function does one job, and a change calls only the one it needs:
    // applyLook()       -> the colors of the card and the texts      (setTheme, setStyle)
    // applyContent()    -> the title and the subtitle                (setTitle, setSubtitle)
    // createLegend()    -> the items of the legend, from the data    (the data changed)
    // drawPlot()        -> the SVG: the axes and the marks           (the data or the size changed)
    // paintActiveItem() -> the mark under the mouse and the tooltip  (the mouse or the keyboard moved)
    // refreshLayout()   -> the place of the legend and drawPlot()    (resize)
    // drawData()        -> what comes from the data                  (box.update)
    // drawAll()         -> all of them                               (the first drawing)
    // WHY: The mouse only moves the things in overlayLayer and the tooltip; the marks are not made again for it.

    // DATA:

    // WHY copies: addValue() and maxCount must not change the arrays of the page.
    const copyDataset = function (dataset) {
        return Object.assign({}, dataset, { data: (dataset.data || []).slice() });
    };

    const copyData = function (data) {
        return {
            labels: (data.labels || []).slice(),
            datasets: (data.datasets || []).map(copyDataset),
        };
    };

    const createData = function () {
        if (dataParams.data) return copyData(dataParams.data);
        let datasets = dataParams.datasets;
        if (!datasets && dataParams.values) datasets = [{ data: dataParams.values }];
        return copyData({ labels: dataParams.labels, datasets: datasets });
    };

    // A number, or null. (A number in a text is a number; an empty place, a wrong text: null.)
    const toNumber = function (value) {
        if (value === null || value === undefined || value === "") return null;
        const number = Number(value);
        return (isFinite(number)) ? number : null;
    };

    const getValue = function (dataset, index) {
        return toNumber(dataset.data[index]);
    };

    const getLabelText = function (index) {
        const label = box.data.labels[index];
        return (label === undefined || label === null) ? "" : String(label);
    };

    // TEXTS OF THE NUMBERS:

    const formatValueText = function (value) {
        if (box.formatValue) return String(box.formatValue(value));
        return GraphBox.formatNumber(value, box.locale);
    };

    const formatTickText = function (value, decimals) {
        if (box.formatValue) return String(box.formatValue(value));
        return GraphBox.formatCompactNumber(value, box.locale, decimals);
    };

    // COLORS:

    const getSeriesKey = function (dataset, position) {
        return dataset.label || ("#" + position);
    };

    // WHY: A color follows its series, not its place in the list: a reader who learned "Target is orange" must not
    //      be misled when another series is removed. So a new series takes the first free color.
    const assignColors = function () {

        const datasets = box.data.datasets;
        const takenIndexes = new Set();

        datasets.forEach(function (dataset, position) {
            const index = colorIndexes.get(getSeriesKey(dataset, position));
            if (index !== undefined) takenIndexes.add(index);
        });

        datasets.forEach(function (dataset, position) {
            const key = getSeriesKey(dataset, position);
            if (colorIndexes.has(key)) return;
            let freeIndex = 0;
            while (takenIndexes.has(freeIndex)) freeIndex++;
            takenIndexes.add(freeIndex);
            colorIndexes.set(key, freeIndex);
        });

    };

    // WHY otherColor: Past the eighth color a new hue can not be told from the others. So it is a quiet gray.
    const getSeriesColor = function (dataset, position) {
        if (dataset.color) return dataset.color;
        return colors.colors[colorIndexes.get(getSeriesKey(dataset, position))] || colors.otherColor;
    };

    const getMarkColor = function (seriesItem, index) {
        const ownColors = seriesItem.dataset.colors;
        return (ownColors && ownColors[index]) || seriesItem.color;
    };

    const getSurfaceColor = function () {
        return _s.box.color || colors.backgroundColor;
    };

    // SVG:

    const createSvgElement = function (name, attributes) {
        const element = document.createElementNS(SVG_NS, name);
        for (const key in attributes) element.setAttribute(key, attributes[key]);
        return element;
    };

    const addShape = function (layer, name, attributes) {
        const shape = createSvgElement(name, attributes);
        layer.appendChild(shape);
        return shape;
    };

    const addLine = function (layer, x1, y1, x2, y2, color) {
        return addShape(layer, "line", { x1: x1, y1: y1, x2: x2, y2: y2, stroke: color, "stroke-width": 1 });
    };

    const addText = function (layer, text, x, y, anchor = "middle", color = colors.mutedTextColor) {
        const shape = addShape(layer, "text", {
            x: x,
            y: y,
            fill: color,
            "text-anchor": anchor,
            "dominant-baseline": "central",
        });
        shape.textContent = text; // WHY: A label is a text of the user, never HTML.
        return shape;
    };

    const clearLayers = function () {
        [definitions, gridLayer, washLayer, markLayer, overlayLayer].forEach(function (layer) {
            layer.replaceChildren();
        });
    };

    // A line of 1 px is sharp only in the middle of a pixel.
    const toPixelCenter = function (position) {
        return Math.round(position) + 0.5;
    };

    const measureAxisText = function (text) {
        return GraphBox.measureText(text, _s.axis.fontSize, _s.axis.fontFamily);
    };

    // WHY more than the font size: A letter like "J" or "y" goes under it, and the plot box cuts what is out of it.
    const getAxisTextHeight = function () {
        return Math.ceil(_s.axis.fontSize * 1.4);
    };

    const measureWidestText = function (texts) {
        return texts.reduce(function (widest, text) {
            return Math.max(widest, measureAxisText(text));
        }, 0);
    };

    // THE SERIES ON THE SCREEN:

    const getDatasetType = function (dataset) {
        return dataset.type || box.type;
    };

    const isBarSeries = function (seriesItem) {
        return getDatasetType(seriesItem.dataset) === "bar";
    };

    const isLineSeries = function (seriesItem) {
        return !isBarSeries(seriesItem);
    };

    const getVisibleSeries = function () {
        const series = [];
        box.data.datasets.forEach(function (dataset, position) {
            if (basic.isOn(dataset.hidden)) return;
            series.push({ dataset: dataset, datasetIndex: position, color: getSeriesColor(dataset, position) });
        });
        return series;
    };

    // How many places the index axis has. (A series can be longer than the labels.)
    const getIndexCount = function (series) {
        return series.reduce(function (count, seriesItem) {
            return Math.max(count, seriesItem.dataset.data.length);
        }, box.data.labels.length);
    };

    const getStackName = function (seriesItem, value) {
        if (!isBarSeries(seriesItem)) return "lines";
        return (value < 0) ? "barsUnderBase" : "barsOverBase"; // WHY: A bar under the base line grows on its own side.
    };

    // Where a value starts and ends on the value axis. A stacked value starts where the one before it ended.
    const createValueRange = function (seriesItem, index, stackTotals) {
        const value = getValue(seriesItem.dataset, index);
        if (value === null) return null;
        if (box.stacked != 1) return { from: 0, to: value };
        const totals = stackTotals[getStackName(seriesItem, value)];
        const from = totals[index] || 0;
        totals[index] = from + value;
        return { from: from, to: from + value };
    };

    const addValueRanges = function (series, indexCount) {
        const stackTotals = { lines: [], barsOverBase: [], barsUnderBase: [] };
        series.forEach(function (seriesItem) {
            seriesItem.ranges = [];
            for (let index = 0; index < indexCount; index++) {
                seriesItem.ranges.push(createValueRange(seriesItem, index, stackTotals));
            }
        });
    };

    const getValueLimits = function (series) {

        let low = Infinity;
        let high = -Infinity;

        series.forEach(function (seriesItem) {
            seriesItem.ranges.forEach(function (range) {
                if (!range) return;
                low = Math.min(low, range.to);
                high = Math.max(high, range.to);
            });
        });

        if (low === Infinity) return null; // No values

        if (box.beginAtZero == 1 || series.some(isBarSeries)) {
            low = Math.min(low, 0);
            high = Math.max(high, 0);
        }

        const minValue = toNumber(box.minValue);
        const maxValue = toNumber(box.maxValue);
        return {
            low: (minValue === null) ? low : minValue,
            high: (maxValue === null) ? high : maxValue,
            hasFixedLow: (minValue !== null),
            hasFixedHigh: (maxValue !== null),
        };

    };

    const createValueScale = function (limits, length, tickSpace = _s.axis.tickSpace) {
        const tickCount = Math.max(2, Math.floor(length / tickSpace));
        const scale = GraphBox.niceScale(limits.low, limits.high, tickCount);
        if (limits.hasFixedLow) scale.min = limits.low;
        if (limits.hasFixedHigh) scale.max = limits.high;
        scale.ticks = scale.ticks.filter(function (tick) {
            return (tick >= scale.min && tick <= scale.max);
        });
        scale.tickTexts = scale.ticks.map(function (tick) {
            return formatTickText(tick, scale.decimals);
        });
        return scale;
    };

    // THE AXES OF A LINE OR BAR CHART:

    const getPointRoom = function () {
        return _s.line.pointRadius + _s.line.pointRing + 1;
    };

    // The room of the texts around the plot, and the scale that fits it.
    const measurePlot = function (limits, hasBands, indexCount, width, height, labelRoom) {

        const labelGap = _s.axis.labelGap;
        const pointRoom = getPointRoom();
        const top = Math.max(pointRoom, Math.ceil(_s.axis.fontSize / 2));
        const bottom = height - (labelRoom + labelGap);
        const scale = createValueScale(limits, bottom - top);

        let left = Math.ceil(measureWidestText(scale.tickTexts)) + labelGap;
        let right = width - pointRoom;

        // WHY: Without bands the first and the last value are on the edges, so half of their labels is out of the plot.
        if (!hasBands && indexCount > 0) {
            left = Math.max(left, Math.ceil(measureAxisText(getLabelText(0)) / 2));
            right = width - Math.max(pointRoom, Math.ceil(measureAxisText(getLabelText(indexCount - 1)) / 2));
        }

        return { left: left, top: top, right: Math.max(left + 1, right), bottom: Math.max(top + 1, bottom), scale: scale };

    };

    // Px between two places of the index axis
    const measureSpacing = function (plot, hasBands, indexCount, isHorizontal) {
        const indexLength = (isHorizontal) ? plot.bottom - plot.top : plot.right - plot.left;
        return (hasBands) ? indexLength / indexCount : indexLength / Math.max(1, indexCount - 1);
    };

    const getLabelTexts = function (indexCount) {
        const labelTexts = [];
        for (let index = 0; index < indexCount; index++) labelTexts.push(getLabelText(index));
        return labelTexts;
    };

    // How the labels of the index axis are written: { texts, step, angle, room }
    // WHY: A label that has no room is skipped on a line chart: it is time, the reader can follow it. A bar chart needs
    //      the name of every bar, so its labels turn, while each one still has a line of its own.
    const planIndexLabels = function (hasBands, indexCount, spacing, height) {

        const texts = getLabelTexts(indexCount);
        const textHeight = getAxisTextHeight();
        const needed = measureWidestText(texts) + _s.axis.labelSpace;
        const angle = _s.axis.labelAngle;

        if (needed <= spacing) return { texts: texts, step: 1, angle: 0, room: textHeight };

        if (!hasBands || !angle || spacing < textHeight) {
            return { texts: texts, step: Math.ceil(needed / Math.max(1, spacing)), angle: 0, room: textHeight };
        }

        const radians = angle * Math.PI / 180;
        const maxWidth = height * _s.axis.maxLabelShare / Math.sin(radians);
        const shortTexts = texts.map(function (text) {
            return GraphBox.fitText(text, maxWidth, _s.axis.fontSize, _s.axis.fontFamily);
        });
        const room = Math.ceil(measureWidestText(shortTexts) * Math.sin(radians) + textHeight * Math.cos(radians));
        return { texts: shortTexts, step: 1, angle: angle, room: room };

    };

    // horizontal: 1: the labels are at the left, and the texts of the values under the plot.
    const measureSidewaysPlot = function (limits, hasBands, indexCount, width, height) {

        const labelGap = _s.axis.labelGap;
        const textHeight = getAxisTextHeight();
        const pointRoom = getPointRoom();
        const maxLabelWidth = width * _s.axis.maxSideLabelShare;
        const labelWidth = Math.min(maxLabelWidth, measureWidestText(getLabelTexts(indexCount)));
        const tickWidth = measureWidestText([formatTickText(limits.low, 0), formatTickText(limits.high, 0)]);

        const left = Math.ceil(labelWidth) + labelGap;
        const right = Math.max(left + 1, width - Math.max(pointRoom, Math.ceil(tickWidth / 2)));
        const top = (hasBands) ? 0 : Math.max(pointRoom, Math.ceil(textHeight / 2));
        const bottom = Math.max(top + 1, height - (textHeight + labelGap));
        const tickSpace = Math.max(_s.axis.tickSpace, tickWidth + _s.axis.labelSpace);

        return { left: left, top: top, right: right, bottom: bottom, maxLabelWidth: maxLabelWidth, scale: createValueScale(limits, right - left, tickSpace) };

    };

    // The labels at the left of the plot: { texts, step, angle, room }. Only a step: a text can not be high.
    const planSideLabels = function (indexCount, spacing, maxLabelWidth) {
        const texts = getLabelTexts(indexCount).map(function (text) {
            return GraphBox.fitText(text, maxLabelWidth, _s.axis.fontSize, _s.axis.fontFamily);
        });
        const step = Math.max(1, Math.ceil(getAxisTextHeight() / Math.max(1, spacing)));
        return { texts: texts, step: step, angle: 0, room: 0 };
    };

    const planUprightPlot = function (limits, hasBands, indexCount, width, height) {

        const flatRoom = getAxisTextHeight();
        const firstPlot = measurePlot(limits, hasBands, indexCount, width, height, flatRoom);
        const labelPlan = planIndexLabels(hasBands, indexCount, measureSpacing(firstPlot, hasBands, indexCount, 0), height);

        // WHY again: Turned labels need more room under the plot, so the plot and its scale change.
        const hasMoreRoom = (labelPlan.room !== flatRoom);
        const plot = (hasMoreRoom) ? measurePlot(limits, hasBands, indexCount, width, height, labelPlan.room) : firstPlot;
        return { plot: plot, labelPlan: labelPlan };

    };

    const planSidewaysPlot = function (limits, hasBands, indexCount, width, height) {
        const plot = measureSidewaysPlot(limits, hasBands, indexCount, width, height);
        const spacing = measureSpacing(plot, hasBands, indexCount, 1);
        return { plot: plot, labelPlan: planSideLabels(indexCount, spacing, plot.maxLabelWidth) };
    };

    const createAxes = function (series, limits, indexCount, width, height) {

        const hasBands = series.some(isBarSeries);
        const isHorizontal = (box.horizontal == 1);
        const planner = (isHorizontal) ? planSidewaysPlot : planUprightPlot;
        const plan = planner(limits, hasBands, indexCount, width, height);
        const plot = plan.plot;
        const scale = plot.scale;
        const spacing = measureSpacing(plot, hasBands, indexCount, isHorizontal);
        const indexStart = (isHorizontal) ? plot.top : plot.left;
        const indexLength = (isHorizontal) ? plot.bottom - plot.top : plot.right - plot.left;
        const scaleSpan = (scale.max - scale.min) || 1;

        const axes = {
            isHorizontal: isHorizontal,
            hasBands: hasBands,
            indexCount: indexCount,
            spacing: spacing,
            plot: plot,
            scale: scale,
            labelPlan: plan.labelPlan,
        };

        axes.toIndexPosition = function (index) {
            if (hasBands) return indexStart + spacing * (index + 0.5);
            if (indexCount === 1) return indexStart + indexLength / 2;
            return indexStart + spacing * index;
        };

        axes.toValuePosition = function (value) {
            const share = (value - scale.min) / scaleSpan;
            if (isHorizontal) return plot.left + share * (plot.right - plot.left);
            return plot.bottom - share * (plot.bottom - plot.top);
        };

        // A point from its places on the two axes.
        axes.joinPositions = function (indexPosition, valuePosition) {
            if (isHorizontal) return { x: valuePosition, y: indexPosition };
            return { x: indexPosition, y: valuePosition };
        };

        axes.toPoint = function (index, value) {
            return axes.joinPositions(axes.toIndexPosition(index), axes.toValuePosition(value));
        };

        axes.toIndex = function (x, y) {
            const position = (isHorizontal) ? y : x;
            const place = (position - indexStart) / spacing;
            const index = (hasBands) ? Math.floor(place) : Math.round(place);
            return Math.min(indexCount - 1, Math.max(0, index));
        };

        // The base of the bars and the areas: 0, or the nearest edge when the axis does not hold 0.
        axes.baseValue = Math.min(scale.max, Math.max(scale.min, 0));

        axes.isInsidePlot = function (x, y) {
            const room = _s.axis.labelGap;
            return (x >= plot.left - room && x <= plot.right + room && y >= plot.top - room && y <= plot.bottom + room);
        };

        return axes;

    };

    // A line of the value axis: across the plot.
    const addValueLine = function (axes, position, color) {
        const plot = axes.plot;
        if (axes.isHorizontal) return addLine(gridLayer, position, plot.top, position, plot.bottom, color);
        return addLine(gridLayer, plot.left, position, plot.right, position, color);
    };

    const addTickText = function (axes, text, position) {
        if (axes.isHorizontal) {
            addText(gridLayer, text, position, axes.plot.bottom + _s.axis.labelGap + getAxisTextHeight() / 2);
            return;
        }
        addText(gridLayer, text, axes.plot.left - _s.axis.labelGap, position, "end");
    };

    const drawValueAxis = function (axes) {

        axes.scale.ticks.forEach(function (tick, tickIndex) {
            const position = toPixelCenter(axes.toValuePosition(tick));
            addValueLine(axes, position, colors.gridColor);
            addTickText(axes, axes.scale.tickTexts[tickIndex], position);
        });

        addValueLine(axes, toPixelCenter(axes.toValuePosition(axes.baseValue)), colors.axisColor);

    };

    const drawSideLabels = function (axes) {
        const plan = axes.labelPlan;
        const x = axes.plot.left - _s.axis.labelGap;
        for (let index = 0; index < axes.indexCount; index += plan.step) {
            addText(gridLayer, plan.texts[index], x, axes.toIndexPosition(index), "end");
        }
    };

    const drawIndexLabels = function (axes) {

        if (axes.isHorizontal) {
            drawSideLabels(axes);
            return;
        }

        const plan = axes.labelPlan;
        const flatY = axes.plot.bottom + _s.axis.labelGap + getAxisTextHeight() / 2;
        const turnedY = axes.plot.bottom + _s.axis.labelGap;

        for (let index = 0; index < axes.indexCount; index += plan.step) {
            const x = axes.toIndexPosition(index);
            if (!plan.angle) {
                addText(gridLayer, plan.texts[index], x, flatY);
                continue;
            }
            // A turned label ends under its bar.
            const label = addText(gridLayer, plan.texts[index], x, turnedY, "end");
            label.setAttribute("transform", "rotate(" + (-plan.angle) + " " + x + " " + turnedY + ")");
        }

    };

    // THE BARS:

    const getBarThickness = function (axes, slotCount) {
        const free = axes.spacing * _s.bar.bandShare - _s.bar.gap * (slotCount - 1);
        return Math.max(1, Math.min(_s.bar.maxThickness, free / slotCount));
    };

    // The base and the end of a bar on the value axis.
    const getBarEnds = function (range, axes) {

        const endPosition = axes.toValuePosition(range.to);
        let basePosition = axes.toValuePosition(range.from);
        const direction = Math.sign(endPosition - basePosition);

        // WHY: The gap is in the geometry, not a line in the color of the box, so a box with no color has it too.
        if (range.from !== 0) basePosition += direction * _s.bar.gap;

        // WHY: A very small value is still there: it does not vanish, or turn over after the gap.
        const isTooShort = (Math.abs(endPosition - basePosition) < _s.bar.minLength || Math.sign(endPosition - basePosition) !== direction);
        if (isTooShort) basePosition = endPosition - direction * _s.bar.minLength;

        return { basePosition: basePosition, endPosition: endPosition };

    };

    const createBarRect = function (range, slotStart, thickness, axes) {
        const ends = getBarEnds(range, axes);
        const start = Math.min(ends.basePosition, ends.endPosition);
        const barLength = Math.abs(ends.endPosition - ends.basePosition);
        if (axes.isHorizontal) return { left: start, top: slotStart, width: barLength, height: thickness };
        return { left: slotStart, top: start, width: thickness, height: barLength };
    };

    const getRoundSide = function (range, axes) {
        const isGoingUp = (range.to >= range.from);
        if (axes.isHorizontal) return (isGoingUp) ? "right" : "left";
        return (isGoingUp) ? "top" : "bottom";
    };

    // Is it the last value of its stack on its side of the base line? Only that one has round corners.
    const isOuterValue = function (barSeries, seriesPlace, index, range) {
        const isOverBase = (range.to >= range.from);
        for (let place = seriesPlace + 1; place < barSeries.length; place++) {
            const laterRange = barSeries[place].ranges[index];
            if (!laterRange || laterRange.from === laterRange.to) continue;
            if ((laterRange.to >= laterRange.from) === isOverBase) return false;
        }
        return true;
    };

    // A bar: its round corners are at the end of its value, its base is square.
    const drawBar = function (seriesItem, index, range, roundSide, slotStart, thickness, axes) {
        const rect = createBarRect(range, slotStart, thickness, axes);
        addShape(markLayer, "path", {
            d: GraphBox.barPath(rect, _s.bar.round, roundSide),
            fill: getMarkColor(seriesItem, index),
        });
        seriesItem.barRects[index] = rect;
    };

    const drawBars = function (series, axes) {

        const barSeries = series.filter(isBarSeries);
        if (!barSeries.length) return;

        const isStacked = (box.stacked == 1);
        const slotCount = (isStacked) ? 1 : barSeries.length;
        const thickness = getBarThickness(axes, slotCount);
        const groupLength = thickness * slotCount + _s.bar.gap * (slotCount - 1);

        barSeries.forEach(function (seriesItem, seriesPlace) {
            const slot = (isStacked) ? 0 : seriesPlace;
            const slotOffset = slot * (thickness + _s.bar.gap) - groupLength / 2;
            seriesItem.barRects = [];
            seriesItem.ranges.forEach(function (range, index) {
                if (!range || range.from === range.to) return;
                const isRound = (!isStacked || isOuterValue(barSeries, seriesPlace, index, range));
                const roundSide = (isRound) ? getRoundSide(range, axes) : "";
                drawBar(seriesItem, index, range, roundSide, axes.toIndexPosition(index) + slotOffset, thickness, axes);
            });
        });

    };

    // THE LINES:

    // The places with a value that follow each other: [[0, 1, 2], [5, 6]] (a line breaks at an empty place)
    const getSegments = function (seriesItem) {
        const segments = [];
        let segment = null;
        seriesItem.ranges.forEach(function (range, index) {
            if (!range) {
                segment = null;
                return;
            }
            if (!segment) {
                segment = [];
                segments.push(segment);
            }
            segment.push(index);
        });
        return segments;
    };

    const getDatasetCurve = function (dataset) {
        return dataset.curve || box.curve;
    };

    const getFillType = function (dataset) {
        if (dataset.fill !== undefined) return dataset.fill;
        return (getDatasetType(dataset) === "area") ? 1 : 0;
    };

    const addGradient = function (color) {
        GraphBox._gradientCounter += 1;
        const id = "graph-box-gradient-" + GraphBox._gradientCounter;
        const gradient = addShape(definitions, "linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 });
        addShape(gradient, "stop", { offset: 0, "stop-color": color, "stop-opacity": _s.line.gradientOpacity });
        addShape(gradient, "stop", { offset: 1, "stop-color": color, "stop-opacity": 0 });
        return "url(#" + id + ")";
    };

    const drawArea = function (seriesItem, segment, axes) {

        if (segment.length < 2) return;

        const isSmooth = (getDatasetCurve(seriesItem.dataset) === "smooth");
        const fillType = getFillType(seriesItem.dataset);
        const isGradient = (fillType === "gradient");
        const upperPoints = segment.map(function (index) {
            return axes.toPoint(index, seriesItem.ranges[index].to);
        });
        const lowerPoints = segment.slice().reverse().map(function (index) {
            return axes.toPoint(index, Math.min(axes.scale.max, Math.max(axes.scale.min, seriesItem.ranges[index].from)));
        });

        addShape(markLayer, "path", {
            d: "M" + GraphBox.pointText(upperPoints[0]) + GraphBox.curveCommands(upperPoints, isSmooth, axes.isHorizontal) +
                "L" + GraphBox.pointText(lowerPoints[0]) + GraphBox.curveCommands(lowerPoints, isSmooth, axes.isHorizontal) + "Z",
            fill: (isGradient) ? addGradient(seriesItem.color) : seriesItem.color,
            "fill-opacity": (isGradient) ? 1 : _s.line.fillOpacity,
        });

    };

    const drawAreas = function (series, axes) {
        series.filter(isLineSeries).forEach(function (seriesItem) {
            if (!getFillType(seriesItem.dataset)) return;
            getSegments(seriesItem).forEach(function (segment) {
                drawArea(seriesItem, segment, axes);
            });
        });
    };

    const isPointsShown = function (seriesItem, axes) {
        const showPoints = (seriesItem.dataset.showPoints !== undefined) ? seriesItem.dataset.showPoints : box.showPoints;
        if (showPoints !== "auto") return basic.isOn(showPoints);
        return (axes.spacing >= _s.line.pointSpace && !seriesItem.dataset.dashed);
    };

    const addPoint = function (layer, point, color, radius) {
        addShape(layer, "circle", {
            cx: point.x,
            cy: point.y,
            r: radius,
            fill: color,
            stroke: getSurfaceColor(),
            "stroke-width": _s.line.pointRing,
        });
    };

    const drawLineSeries = function (seriesItem, axes) {

        const isSmooth = (getDatasetCurve(seriesItem.dataset) === "smooth");
        const hasPoints = isPointsShown(seriesItem, axes);

        seriesItem.points = [];

        getSegments(seriesItem).forEach(function (segment) {

            const points = segment.map(function (index) {
                const point = axes.toPoint(index, seriesItem.ranges[index].to);
                seriesItem.points[index] = point;
                return point;
            });

            addShape(markLayer, "path", {
                d: "M" + GraphBox.pointText(points[0]) + GraphBox.curveCommands(points, isSmooth, axes.isHorizontal),
                fill: "none",
                stroke: seriesItem.color,
                "stroke-width": _s.line.width,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
                "stroke-dasharray": (seriesItem.dataset.dashed) ? _s.line.dash : "none",
            });

            // WHY the lone value: It has no line, so without a point it would not be seen.
            if (hasPoints || points.length === 1) {
                points.forEach(function (point) {
                    addPoint(markLayer, point, seriesItem.color, _s.line.pointRadius);
                });
            }

        });

    };

    const drawLines = function (series, axes) {
        series.filter(isLineSeries).forEach(function (seriesItem) {
            drawLineSeries(seriesItem, axes);
        });
    };

    // THE ACTIVE ITEM OF A LINE OR BAR CHART:

    const getDistanceToRect = function (rect, x, y) {
        const distanceX = Math.max(rect.left - x, 0, x - rect.left - rect.width);
        const distanceY = Math.max(rect.top - y, 0, y - rect.top - rect.height);
        return Math.hypot(distanceX, distanceY);
    };

    const getDistanceToMark = function (seriesItem, index, x, y) {
        if (isBarSeries(seriesItem)) {
            const rect = seriesItem.barRects && seriesItem.barRects[index];
            return (rect) ? getDistanceToRect(rect, x, y) : Infinity;
        }
        const point = seriesItem.points && seriesItem.points[index];
        return (point) ? Math.hypot(point.x - x, point.y - y) : Infinity;
    };

    const findNearestDataset = function (series, index, x, y) {
        let nearestDistance = Infinity;
        let datasetIndex = null;
        series.forEach(function (seriesItem) {
            const distance = getDistanceToMark(seriesItem, index, x, y);
            if (distance >= nearestDistance) return;
            nearestDistance = distance;
            datasetIndex = seriesItem.datasetIndex;
        });
        return datasetIndex;
    };

    const paintBandWash = function (axes, index) {
        const plot = axes.plot;
        const bandStart = axes.toIndexPosition(index) - axes.spacing / 2;
        const shape = (axes.isHorizontal)
            ? { x: plot.left, y: bandStart, width: plot.right - plot.left, height: axes.spacing }
            : { x: bandStart, y: plot.top, width: axes.spacing, height: plot.bottom - plot.top };
        shape.fill = colors.hoverColor;
        addShape(washLayer, "rect", shape);
    };

    const paintCrosshair = function (axes, index) {
        const plot = axes.plot;
        const position = toPixelCenter(axes.toIndexPosition(index));
        if (axes.isHorizontal) {
            addLine(washLayer, plot.left, position, plot.right, position, colors.axisColor);
            return;
        }
        addLine(washLayer, position, plot.top, position, plot.bottom, colors.axisColor);
    };

    const paintActivePoints = function (series, index) {
        series.filter(isLineSeries).forEach(function (seriesItem) {
            const point = seriesItem.points[index];
            if (point) addPoint(overlayLayer, point, seriesItem.color, _s.line.pointRadius + 1);
        });
    };

    const getCartesianReadout = function (series, index) {
        const rows = [];
        let total = 0;
        series.forEach(function (seriesItem) {
            const value = getValue(seriesItem.dataset, index);
            if (value === null) return;
            total += value;
            rows.push({
                color: getMarkColor(seriesItem, index),
                valueText: formatValueText(value),
                nameText: seriesItem.dataset.label || "",
            });
        });
        if (box.stacked == 1 && box.totalText && rows.length > 1) {
            rows.push({ color: "transparent", valueText: formatValueText(total), nameText: box.totalText });
        }
        return { titleText: getLabelText(index), rows: rows };
    };

    // For the keyboard: at the end of the longest value at that place.
    const getCartesianAnchor = function (series, axes, index) {
        const nearestEnd = (axes.isHorizontal) ? Math.max : Math.min;
        let valuePosition = axes.toValuePosition(axes.baseValue);
        series.forEach(function (seriesItem) {
            const range = seriesItem.ranges[index];
            if (range) valuePosition = nearestEnd(valuePosition, axes.toValuePosition(range.to));
        });
        return axes.joinPositions(axes.toIndexPosition(index), valuePosition);
    };

    const createCartesianView = function (series, axes) {
        return {
            findItem: function (x, y) {
                if (!axes.isInsidePlot(x, y)) return null;
                const index = axes.toIndex(x, y);
                return { index: index, datasetIndex: findNearestDataset(series, index, x, y) };
            },
            stepItem: function (item, step) {
                if (!item) return { index: 0, datasetIndex: null };
                const index = Math.min(axes.indexCount - 1, Math.max(0, item.index + step));
                return { index: index, datasetIndex: null };
            },
            hasItem: function (item) {
                return (item.index < axes.indexCount);
            },
            paintItem: function (item) {
                if (axes.hasBands) paintBandWash(axes, item.index);
                else paintCrosshair(axes, item.index);
                paintActivePoints(series, item.index);
            },
            getReadout: function (item) {
                return getCartesianReadout(series, item.index);
            },
            getAnchor: function (item) {
                return getCartesianAnchor(series, axes, item.index);
            },
        };
    };

    const drawCartesian = function (width, height) {

        const series = getVisibleSeries();
        const indexCount = getIndexCount(series);
        addValueRanges(series, indexCount);

        const limits = getValueLimits(series);
        if (!limits) return null;

        const axes = createAxes(series, limits, indexCount, width, height);

        drawValueAxis(axes);
        drawIndexLabels(axes);
        drawAreas(series, axes);
        drawBars(series, axes);
        drawLines(series, axes);

        return createCartesianView(series, axes);

    };

    // THE PLOT:

    const drawPlot = function () {

        const width = box.plot.elem.clientWidth;
        const height = box.plot.elem.clientHeight;
        if (width <= 0 || height <= 0) return; // WHY: Not on the screen yet. onResize draws it when it comes.

        drawnSize = width + "x" + height;
        clearLayers();

        svg.setAttribute("width", width);
        svg.setAttribute("height", height);
        svg.setAttribute("font-family", _s.axis.fontFamily);
        svg.setAttribute("font-size", _s.axis.fontSize);

        view = drawCartesian(width, height);

        box.lblEmpty.plainText = box.emptyText;
        box.lblEmpty.visible = (view) ? 0 : 1;
        box.plot.aria = { label: getSummaryText() };

        if (activeItem && (!view || !view.hasItem(activeItem))) activeItem = null;
        paintActiveItem();

    };

    // WHY: A screen reader can not read an SVG drawing: the title and every value are read from this text.
    const getSummaryText = function () {
        const parts = [box.titleText || box.type + " chart"];
        if (box.subtitleText) parts.push(box.subtitleText);
        getVisibleSeries().forEach(function (seriesItem) {
            const values = seriesItem.dataset.data.map(function (value, index) {
                const number = toNumber(value);
                if (number === null) return "";
                return getLabelText(index) + " " + formatValueText(number);
            });
            parts.push((seriesItem.dataset.label || "") + " " + values.filter(Boolean).join(", "));
        });
        return parts.join(". ");
    };

    // THE TOOLTIP:

    const createTooltipRow = function () {

        const row = createIn(box.tooltip, function () {
            const group = HGroup({ hug: 1, gap: 6, align: "left center" });
                group.key = Box({ width: _s.tooltip.keyWidth, height: _s.tooltip.keyHeight, round: _s.tooltip.keyHeight / 2 });
                group.key.shrink = 0;
                group.lblValue = Label({ fontSize: _s.tooltip.fontSize, fontFamily: "opensans-bold", css: { whiteSpace: "nowrap" } });
                group.lblName = Label({ fontSize: _s.tooltip.fontSize, ellipsis: 1, css: { maxWidth: _s.tooltip.maxNameWidth + "px" } });
            endGroup();
            return group;
        });

        tooltipRows.push(row);

    };

    const paintTooltipRow = function (row, rowData) {
        row.visible = (rowData) ? 1 : 0;
        if (!rowData) return;
        row.key.color = rowData.color;
        row.lblValue.plainText = rowData.valueText;
        row.lblValue.textColor = colors.tooltipTextColor;
        row.lblName.plainText = rowData.nameText;
        row.lblName.textColor = colors.tooltipMutedColor;
        row.lblName.visible = (rowData.nameText) ? 1 : 0;
    };

    const fillTooltip = function (readout) {
        box.lblTooltipTitle.plainText = readout.titleText;
        box.lblTooltipTitle.visible = (readout.titleText) ? 1 : 0;
        while (tooltipRows.length < readout.rows.length) createTooltipRow();
        tooltipRows.forEach(function (row, rowIndex) {
            paintTooltipRow(row, readout.rows[rowIndex]);
        });
    };

    // How many screen px is one px of this object? (page.fit() or a parent with a scale)
    const getZoom = function (element, rect) {
        return (rect.width / element.offsetWidth) || 1;
    };

    const placeTooltip = function () {

        const anchor = pointer || view.getAnchor(activeItem);
        const boxRect = box.elem.getBoundingClientRect();
        const plotRect = box.plot.elem.getBoundingClientRect();
        const zoom = getZoom(box.elem, boxRect);
        const distance = _s.tooltip.distance;
        const edge = _s.tooltip.edge;
        const tooltipWidth = box.tooltip.elem.offsetWidth;
        const tooltipHeight = box.tooltip.elem.offsetHeight;
        const anchorX = (plotRect.left - boxRect.left) / zoom + anchor.x - box.elem.clientLeft;
        const anchorY = (plotRect.top - boxRect.top) / zoom + anchor.y - box.elem.clientTop;

        // It stays at the right of the mouse, or goes to its left when there is no room.
        let left = anchorX + distance;
        if (left + tooltipWidth > box.elem.clientWidth - edge) left = anchorX - distance - tooltipWidth;

        box.tooltip.left = Math.max(edge, left);
        box.tooltip.top = Math.max(edge, Math.min(box.elem.clientHeight - tooltipHeight - edge, anchorY - tooltipHeight / 2));

    };

    // THE ACTIVE ITEM:

    const paintActiveItem = function () {

        washLayer.replaceChildren();
        overlayLayer.replaceChildren();

        const readout = (view && activeItem) ? view.getReadout(activeItem) : null;
        const isShown = (readout && readout.rows.length > 0);
        box.tooltip.visible = (isShown) ? 1 : 0;

        if (!view || !activeItem) return;

        view.paintItem(activeItem);
        if (!isShown) return;
        fillTooltip(readout);
        placeTooltip();

    };

    const isSameItem = function (first, second) {
        if (!first || !second) return first === second;
        return (first.index === second.index && first.datasetIndex === second.datasetIndex);
    };

    const setActiveItem = function (item) {
        const hasChanged = !isSameItem(activeItem, item);
        activeItem = item;
        if (hasChanged) {
            paintActiveItem();
            return;
        }
        if (item && box.tooltip.visible == 1) placeTooltip();
    };

    const clearActiveItem = function () {
        pointer = null;
        setActiveItem(null);
    };

    const getPointerPosition = function (event) {
        const rect = box.plot.elem.getBoundingClientRect();
        const zoom = getZoom(box.plot.elem, rect);
        return { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom };
    };

    // The item of a click: { datasetIndex, index, label, value, datasetLabel, dataset }
    const createClickItem = function (item) {
        const datasetIndex = (item.datasetIndex === null) ? 0 : item.datasetIndex;
        const dataset = box.data.datasets[datasetIndex];
        if (!dataset) return null;
        return {
            datasetIndex: datasetIndex,
            index: item.index,
            label: box.data.labels[item.index],
            value: dataset.data[item.index],
            datasetLabel: dataset.label || "",
            dataset: dataset,
        };
    };

    const runClickEvent = function (event) {
        const clickItem = (activeItem) ? createClickItem(activeItem) : null;
        if (clickItem) box.onClick(box, clickItem, event);
    };

    const onPlotPointerMove = function (self, event) {
        if (!view) return;
        pointer = getPointerPosition(event);
        setActiveItem(view.findItem(pointer.x, pointer.y));
        if (hasClickEvent) box.plot.cursor = (activeItem) ? "pointer" : "default";
    };

    // WHY not touch: A finger leaves the screen after every touch. The tooltip stays until a touch outside the chart.
    const onPlotPointerLeave = function (self, event) {
        if (event.pointerType !== "touch") clearActiveItem();
    };

    const onDocumentPointerDown = function (self, event) {
        if (!activeItem || box.plot.elem.contains(event.target)) return;
        clearActiveItem();
    };

    const onPlotKeyDown = function (self, event) {

        if (!view) return;

        if (event.key === "Escape") {
            clearActiveItem();
            return;
        }

        if (event.key === "Enter") {
            runClickEvent(event);
            return;
        }

        const step = STEP_KEYS[event.key];
        if (!step) return;
        event.preventDefault();
        pointer = null;
        setActiveItem(view.stepItem(activeItem, step));

    };

    // WHY focus-visible: The tooltip opens only for the keyboard. A click also gives the focus, and the mouse has its own.
    const onPlotFocus = function () {
        if (!view || activeItem || !box.plot.elem.matches(":focus-visible")) return;
        pointer = null;
        setActiveItem(view.stepItem(null, 0));
    };

    // THE LEGEND:

    const getLegendEntries = function () {
        return box.data.datasets.map(function (dataset, position) {
            return {
                text: dataset.label || "",
                color: getSeriesColor(dataset, position),
                isLine: (getDatasetType(dataset) !== "bar"),
                isHidden: basic.isOn(dataset.hidden),
                position: position,
            };
        }).filter(function (entry) {
            return entry.text !== "";
        });
    };

    const getLegendPosition = function () {
        if (box.legend === 0 || box.legend === false || box.legend === "none") return "none";
        if (box.legend !== "auto") return box.legend;
        return (box.data.datasets.length >= 2) ? "top" : "none";
    };

    const applyLegendPosition = function () {

        const position = getLegendPosition();
        box.legendGroup.visible = (position === "none") ? 0 : 1;
        if (position === "none") return;

        const isSide = (position === "left" || position === "right");
        box.body.css = { flexDirection: LEGEND_FLOWS[position] };
        box.legendGroup.width = (isSide) ? "auto" : "100%";
        box.legendGroup.css = {
            flexDirection: (isSide) ? "column" : "row",
            flexWrap: (isSide) ? "nowrap" : "wrap",
            alignItems: (isSide) ? "flex-start" : "center",
        };

    };

    const toggleLegendEntry = function (entry) {
        box.setDatasetVisible(entry.position, entry.isHidden ? 1 : 0);
    };

    const createLegendItem = function (entry) {

        const keyHeight = (entry.isLine) ? 2 : 10;

        // GROUP: One item: its key looks like its mark (a line or a box), its text is never in the data color.
        const item = HGroup({ hug: 1, gap: _s.legend.keyGap, align: "left center" });

            item.key = Box({ width: (entry.isLine) ? 14 : 10, height: keyHeight, round: 2, color: entry.color });
            item.key.shrink = 0;

            item.label = Label({ plainText: entry.text, fontSize: _s.legend.fontSize, textColor: colors.textColor, ellipsis: 1 });

        endGroup();

        item.opacity = (entry.isHidden) ? _s.legend.hiddenOpacity : 1;
        item.cursor = "pointer";
        item.role = "button";
        item.tabIndex = 0;
        item.aria = { pressed: !entry.isHidden };
        item.setFocusRing(colors.focusColor);
        item.on("click", function () { toggleLegendEntry(entry); });
        item.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            toggleLegendEntry(entry);
        });

        return item;

    };

    const createLegend = function () {

        const entries = getLegendEntries();
        const signature = JSON.stringify(entries) + colors.textColor;
        if (signature === legendSignature) return; // WHY: Live data: the same legend is not made every second.
        legendSignature = signature;

        box.legendItems.forEach(function (item) { item.remove(); });
        box.legendItems = entries.map(function (entry) {
            return createIn(box.legendGroup, function () { return createLegendItem(entry); });
        });

    };

    // THE LOOK AND THE TEXTS:

    const applyLook = function () {
        colors = Object.assign(basic.resolveTheme(GraphBox.THEMES, box.theme), _s.colors);
        box.color = getSurfaceColor();
        box.border = _s.box.border;
        box.borderColor = _s.box.borderColor || colors.borderColor;
        box.round = _s.box.round;
        box.lblTitle.textColor = colors.titleColor;
        box.lblSubtitle.textColor = colors.textColor;
        box.lblEmpty.textColor = colors.mutedTextColor;
        box.tooltip.color = colors.tooltipColor;
        box.lblTooltipTitle.textColor = colors.tooltipMutedColor;
        box.plot.setFocusRing(colors.focusColor);
    };

    const applyContent = function () {
        box.lblTitle.plainText = box.titleText;
        box.lblTitle.visible = (box.titleText) ? 1 : 0;
        box.lblSubtitle.plainText = box.subtitleText;
        box.lblSubtitle.visible = (box.subtitleText) ? 1 : 0;
        box.texts.visible = (box.titleText || box.subtitleText) ? 1 : 0;
    };

    const refreshLayout = function () {
        applyLegendPosition();
        drawPlot();
    };

    const drawData = function () {
        assignColors();
        createLegend();
        refreshLayout();
    };

    const drawAll = function () {
        applyLook();
        applyContent();
        drawData();
    };

    const onPlotResize = function () {
        const size = box.plot.elem.clientWidth + "x" + box.plot.elem.clientHeight;
        if (size !== drawnSize) drawPlot(); // WHY: The observer also runs once when it starts.
    };

    const onSystemThemeChange = function () {
        if (box.theme === "auto") drawAll();
    };

    // WHY: The first measures can be made before the font of the kit is loaded, then the axis has the wrong room.
    const redrawWhenFontIsLoaded = function () {
        const font = _s.axis.fontSize + "px opensans";
        if (!document.fonts || document.fonts.check(font)) return;
        const redraw = function () {
            if (!box._isRemoved) drawPlot();
        };
        document.fonts.load(font).then(redraw, redraw);
    };

    // *** PUBLIC FUNCTIONS:

    // Redraw after the data changed. Ex: box.data.datasets[0].data[2] = 50; box.update();
    box.update = function () {
        drawData();
    };

    box.setData = function (data) {
        box.data = copyData(data);
        drawData();
    };
    // USAGE: graph.setData({ labels: ["A", "B"], datasets: [{ label: "X", data: [1, 2] }] })

    box.setLabels = function (labels) {
        box.data.labels = (labels || []).slice();
        drawData();
    };

    box.setDatasets = function (datasets) {
        box.data.datasets = (datasets || []).map(copyDataset);
        drawData();
    };

    // Change the values of one dataset. The dataset is created, if it is not there.
    box.setValues = function (values, datasetIndex = 0) {
        const dataset = box.data.datasets[datasetIndex];
        if (!dataset) {
            box.addDataset({ data: values });
            return;
        }
        dataset.data = (values || []).slice();
        drawData();
    };

    // Add a new label and values to the end. (For live data, use maxCount.)
    box.addValue = function (label, values) {

        const list = (Array.isArray(values)) ? values : [values];
        const datasets = box.data.datasets;

        if (box.maxCount > 0) {
            while (box.data.labels.length >= box.maxCount) {
                box.data.labels.shift();
                datasets.forEach(function (dataset) { dataset.data.shift(); });
            }
        }

        box.data.labels.push(label);
        datasets.forEach(function (dataset, position) {
            dataset.data.push((list[position] !== undefined) ? list[position] : null);
        });

        drawData();

    };
    // USAGE: graph.addValue("May", 42) or graph.addValue("May", [42, 30]) (one value for each dataset)

    box.addDataset = function (dataset) {
        box.data.datasets.push(copyDataset(dataset));
        drawData();
    };

    box.removeDataset = function (position) {
        if (position < 0 || position >= box.data.datasets.length) return;
        box.data.datasets.splice(position, 1);
        drawData();
    };

    box.setDatasetVisible = function (position, visible) {
        const dataset = box.data.datasets[position];
        if (!dataset) return;
        dataset.hidden = (basic.isOn(visible)) ? 0 : 1;
        drawData();
    };

    box.setType = function (type) {
        box.type = type;
        drawData();
    };
    // USAGE: "line", "area", "bar"

    box.setTitle = function (text) {
        box.titleText = text;
        applyContent();
    };

    box.setSubtitle = function (text) {
        box.subtitleText = text;
        applyContent();
    };

    box.setLegend = function (legend) {
        box.legend = legend;
        refreshLayout();
    };
    // USAGE: "auto", "top", "bottom", "left", "right", "none"

    box.setStacked = function (stacked) {
        box.stacked = (basic.isOn(stacked)) ? 1 : 0;
        drawPlot();
    };

    box.setHorizontal = function (horizontal) {
        box.horizontal = (basic.isOn(horizontal)) ? 1 : 0;
        drawPlot();
    };

    box.setCurve = function (curve) {
        box.curve = curve;
        drawPlot();
    };

    // The limits of the value axis. null: from the values.
    box.setValueLimits = function (minValue, maxValue) {
        box.minValue = minValue;
        box.maxValue = maxValue;
        drawPlot();
    };

    box.setFormatValue = function (func) {
        box.formatValue = func;
        drawPlot();
    };

    box.setTheme = function (theme) {
        box.theme = theme;
        drawAll();
    };
    // USAGE: "light", "dark", "auto"

    // Change some values of the style. Ex: setStyle({ colors: { gridColor: "#334155" }, box: { round: 0 } })
    box.setStyle = function (style) {
        const merged = {};
        mergeIntoIfMissing(merged, style);
        mergeIntoIfMissing(merged, _s);
        box.style = merged;
        _s = merged;
        legendSignature = ""; // WHY: The sizes of the legend are in the style too.
        drawAll();
    };

    // *** OBJECT VIEW:

    // GROUP: Layout (the texts, then the legend and the chart)
    box.layout = VGroup({ align: "left top", gap: _s.box.gap, padding: _s.box.padding });

        // GROUP: Texts
        box.texts = VGroup({ width: "100%", height: "auto", align: "left top", gap: 2 });
        box.texts.shrink = 0;

            box.lblTitle = Label({ ..._s.title, ellipsis: 1, css: { maxWidth: "100%" } });
            box.lblSubtitle = Label({ ..._s.subtitle, ellipsis: 1, css: { maxWidth: "100%" } });

        endGroup();

        // GROUP: The legend and the chart. (Their order comes from the place of the legend.)
        box.body = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.box.gap });
        box.body.css = { flex: "1 1 0", minHeight: "0px" };

            box.legendGroup = HGroup({ width: "100%", height: "auto", align: "left center", wrap: 1 });
            box.legendGroup.shrink = 0;
            box.legendGroup.css = { rowGap: _s.legend.lineGap + "px", columnGap: _s.legend.gap + "px", maxWidth: "100%" };
            endGroup();

            // BOX: The plot. (The SVG is out of the flow: its size must not hold the box open when the box gets smaller.)
            box.plot = startBox({ width: "100%", height: "auto", color: "transparent" });
            box.plot.css = { flex: "1 1 0", minWidth: "0px", minHeight: "0px", alignSelf: "stretch", touchAction: "pan-y" };

                // LABEL: No values
                box.lblEmpty = Label({ left: 0, width: "100%", textAlign: "center", fontSize: _s.axis.fontSize, visible: 0 });
                box.lblEmpty.css = { top: "calc(50% - 10px)" };

            endBox();

        endGroup();

    endGroup();

    // SVG: The chart
    svg = createSvgElement("svg", { "aria-hidden": "true" });
    box.svg = svg;
    svg.style.cssText = "position: absolute; left: 0; top: 0; display: block;";
    definitions = addShape(svg, "defs", {});
    gridLayer = addShape(svg, "g", {});
    washLayer = addShape(svg, "g", {}); // The band under the mouse: behind the marks
    markLayer = addShape(svg, "g", {});
    overlayLayer = addShape(svg, "g", {}); // The points under the mouse: over the marks
    box.plot.elem.appendChild(svg);

    // GROUP: Tooltip (out of the layout, it never catches the mouse)
    box.tooltip = VGroup({ left: 0, top: 0, hug: 1, align: "left top", gap: _s.tooltip.gap, padding: _s.tooltip.padding, round: _s.tooltip.round });

        box.lblTooltipTitle = Label({ fontSize: _s.tooltip.fontSize, css: { whiteSpace: "nowrap" } });

        // NOTE: The rows are made by fillTooltip().

    endGroup();
    box.tooltip.boxShadow = _s.tooltip.shadow;
    box.tooltip.visible = 0;

    // *** OBJECT INIT CODE:

    box.data = createData();

    box.plot.role = "img";
    box.plot.tabIndex = 0;
    box.plot.on("pointermove", onPlotPointerMove);
    box.plot.on("pointerdown", onPlotPointerMove);
    box.plot.on("pointerleave", onPlotPointerLeave);
    box.plot.on("click", function (self, event) { runClickEvent(event); });
    box.plot.on("keydown", onPlotKeyDown);
    box.plot.on("focus", onPlotFocus);
    box.plot.on("blur", clearActiveItem);
    box.plot.onResize(onPlotResize);
    box.listenTo(document, "pointerdown", onDocumentPointerDown);

    if (window.matchMedia) {
        box.listenTo(window.matchMedia("(prefers-color-scheme: dark)"), "change", onSystemThemeChange);
    }

    drawAll();
    redrawWhenFontIsLoaded();

    return endObject(box);

};

// *** STATIC VARIABLES:

GraphBox._gradientCounter = 0; // WHY: The id of a gradient must be alone on the whole page.

// *** THEMES: the colors. (The style param has the shapes; style.colors changes some colors of one chart.)
// USAGE: GraphBox({ theme: "dark", ... }) // "light", "dark", "auto" (the system setting)
// NOTE: A new theme needs only the keys that differ from the light theme.
// USAGE: GraphBox.THEMES.ocean = { backgroundColor: "#0B2239", textColor: "#C9D6E3" };
// NOTE: The order of the colors is not free: it was checked for color blindness. (First 3 are the safest.)
GraphBox.THEMES = {
    light: {
        backgroundColor: "#FCFCFB",
        borderColor: "rgba(11, 11, 11, 0.10)",
        titleColor: "#0B0B0B",
        textColor: "#52514E",
        mutedTextColor: "#898781",
        gridColor: "#E1E0D9",
        axisColor: "#C3C2B7",
        hoverColor: "rgba(11, 11, 11, 0.05)",
        focusColor: "rgba(42, 120, 214, 0.7)",
        otherColor: "#A9A8A0",
        tooltipColor: "#0B0B0B",
        tooltipTextColor: "#FFFFFF",
        tooltipMutedColor: "rgba(255, 255, 255, 0.65)",
        colors: ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100", "#E87BA4", "#008300", "#6250D6", "#E34948"],
    },
    dark: {
        backgroundColor: "#1A1A19",
        borderColor: "rgba(255, 255, 255, 0.10)",
        titleColor: "#F0EFEC",
        textColor: "#C3C2B7",
        mutedTextColor: "#898781",
        gridColor: "#2C2C2A",
        axisColor: "#383835",
        hoverColor: "rgba(255, 255, 255, 0.06)",
        focusColor: "rgba(57, 135, 229, 0.8)",
        otherColor: "#6F6E69",
        tooltipColor: "#2C2C2A",
        tooltipTextColor: "#FFFFFF",
        tooltipMutedColor: "rgba(255, 255, 255, 0.65)",
        colors: ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300", "#9085E9", "#E66767"],
    },
};

// *** STATIC FUNCTIONS: the math of a chart. They need no box.

// Clean numbers for an axis: { min, max, ticks, decimals }. tickCount: about how many spaces between the ticks.
GraphBox.niceScale = function (low, high, tickCount = 5) {

    if (!(high > low)) {
        // WHY: One value (or all the same): the scale needs some height, or every place divides by 0.
        const room = Math.abs(low) * 0.1 || 1;
        low = (low === 0) ? 0 : low - room;
        high = high + room;
    }

    const roughStep = (high - low) / Math.max(1, tickCount);
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const fraction = [1, 2, 2.5, 5, 10].find(function (candidate) {
        return (roughStep / power <= candidate);
    });
    const step = fraction * power;
    const decimals = Math.max(0, -Math.floor(Math.log10(power))) + ((fraction === 2.5) ? 1 : 0);

    // WHY the small number: 0.3 / 0.1 is 2.9999999999999996, and its floor would add a tick under the values.
    const CALCULATION_ERROR = 1e-9;
    const firstPlace = Math.floor(low / step + CALCULATION_ERROR);
    const lastPlace = Math.ceil(high / step - CALCULATION_ERROR);

    const ticks = [];
    for (let place = firstPlace; place <= lastPlace; place++) {
        ticks.push(Number((place * step).toFixed(decimals)));
    }

    return { min: ticks[0], max: ticks[ticks.length - 1], ticks: ticks, decimals: decimals };

};

// 42000 -> "42,000" (in the language of the browser, or locale)
GraphBox.formatNumber = function (value, locale) {
    return value.toLocaleString(locale || undefined, { maximumFractionDigits: 6 });
};

// 42000 -> "42K" (A text of an axis: short)
GraphBox.formatCompactNumber = function (value, locale, decimals = 0) {
    const options = { notation: "compact", maximumFractionDigits: Math.max(2, decimals) };
    return value.toLocaleString(locale || undefined, options);
};

GraphBox.measureText = function (text, fontSize, fontFamily) {
    if (!GraphBox._measureContext) GraphBox._measureContext = document.createElement("canvas").getContext("2d");
    GraphBox._measureContext.font = fontSize + "px " + fontFamily;
    return GraphBox._measureContext.measureText(String(text)).width;
};

// The text, cut with "..." when it is wider than maxWidth.
GraphBox.fitText = function (text, maxWidth, fontSize, fontFamily) {
    const isFitting = function (candidate) {
        return (GraphBox.measureText(candidate, fontSize, fontFamily) <= maxWidth);
    };
    if (isFitting(text)) return text;
    let length = text.length - 1;
    while (length > 0 && !isFitting(text.slice(0, length) + "…")) length--;
    return text.slice(0, length) + "…";
};

GraphBox.pointText = function (point) {
    return GraphBox.roundNumber(point.x) + " " + GraphBox.roundNumber(point.y) + " ";
};

// WHY: A long number in every path only makes the page bigger; a hundredth of a px can not be seen.
GraphBox.roundNumber = function (value) {
    return Math.round(value * 100) / 100;
};

// A rectangle with round corners only at one side (the end of the value). side: "top", "bottom", "left", "right", ""
GraphBox.barPath = function (rect, round, side) {

    const left = rect.left;
    const right = rect.left + rect.width;
    const top = rect.top;
    const bottom = rect.top + rect.height;
    const isUpright = (side === "top" || side === "bottom");
    const radius = (isUpright) ? Math.min(round, rect.width / 2, rect.height) : Math.min(round, rect.height / 2, rect.width);

    const topLeft = (side === "top" || side === "left") ? radius : 0;
    const topRight = (side === "top" || side === "right") ? radius : 0;
    const bottomRight = (side === "bottom" || side === "right") ? radius : 0;
    const bottomLeft = (side === "bottom" || side === "left") ? radius : 0;

    const point = function (x, y) { return GraphBox.pointText({ x: x, y: y }); };

    return "M" + point(left + topLeft, top) +
        "L" + point(right - topRight, top) + "Q" + point(right, top) + point(right, top + topRight) +
        "L" + point(right, bottom - bottomRight) + "Q" + point(right, bottom) + point(right - bottomRight, bottom) +
        "L" + point(left + bottomLeft, bottom) + "Q" + point(left, bottom) + point(left, bottom - bottomLeft) +
        "L" + point(left, top + topLeft) + "Q" + point(left, top) + point(left + topLeft, top) + "Z";

};

// The commands of a line that starts at the first point (its "M" is written by the caller).
GraphBox.curveCommands = function (points, isSmooth, isHorizontal) {

    if (isSmooth && points.length > 2) return GraphBox.smoothCommands(points, isHorizontal);

    let commands = "";
    for (let i = 1; i < points.length; i++) commands += "L" + GraphBox.pointText(points[i]);
    return commands;

};

// A smooth line that never goes over or under a value (monotone cubic).
// WHY monotone: A plain curve makes a hill higher than the real value; a chart must not show a value that is not there.
// NOTE: The line moves forward on the index axis: on x, or on y on a horizontal chart.
GraphBox.smoothCommands = function (points, isHorizontal) {

    const indexKey = (isHorizontal) ? "y" : "x";
    const valueKey = (isHorizontal) ? "x" : "y";
    const count = points.length;
    const widths = [];
    const slopes = [];

    for (let i = 0; i < count - 1; i++) {
        widths[i] = points[i + 1][indexKey] - points[i][indexKey];
        slopes[i] = (points[i + 1][valueKey] - points[i][valueKey]) / widths[i];
    }

    const tangents = [slopes[0]];
    for (let i = 1; i < count - 1; i++) {
        if (slopes[i - 1] * slopes[i] <= 0) {
            tangents[i] = 0; // A hill or a valley: the curve is flat at its value.
            continue;
        }
        const firstWeight = 2 * widths[i] + widths[i - 1];
        const secondWeight = widths[i] + 2 * widths[i - 1];
        tangents[i] = (firstWeight + secondWeight) / (firstWeight / slopes[i - 1] + secondWeight / slopes[i]);
    }
    tangents[count - 1] = slopes[count - 2];

    const createControl = function (indexPosition, valuePosition) {
        const control = {};
        control[indexKey] = indexPosition;
        control[valueKey] = valuePosition;
        return control;
    };

    let commands = "";
    for (let i = 0; i < count - 1; i++) {
        const third = widths[i] / 3;
        const firstControl = createControl(points[i][indexKey] + third, points[i][valueKey] + tangents[i] * third);
        const secondControl = createControl(points[i + 1][indexKey] - third, points[i + 1][valueKey] - tangents[i + 1] * third);
        commands += "C" + GraphBox.pointText(firstControl) + GraphBox.pointText(secondControl) + GraphBox.pointText(points[i + 1]);
    }
    return commands;

};
