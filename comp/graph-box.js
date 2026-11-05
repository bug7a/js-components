/* Bismillah */

/*

GraphBox - v26.11

UI COMPONENT
- Charts with no library: this one file draws the whole chart as one SVG. No Chart.js, no other file, no internet.
  (comp/chart-box.js is the bridge to Chart.js. Its params and functions are the model here, so a page can move over.)
- Chart types: "line", "area", "bar" (more than one dataset: bars side by side; stacked: 1 one on the other;
  horizontal: 1 bars that grow to the right), "pie", "doughnut" (the first dataset: a part of the whole), "radar",
  "scatter" and "bubble" (two number axes: data: [{ x: 1, y: 2 }]).
- Light and dark themes ("light", "dark", "auto"). A dataset gets its color from the theme and keeps it, also when
  another dataset is hidden or removed.
- The axis finds clean numbers by itself (0, 20K, 40K...). A label that has no room is skipped (a line chart: time)
  or it turns (a bar chart: every bar needs its name).
- Mouse, touch and keyboard: a tooltip with every dataset at that place. (Left / right arrows, Escape, Enter.)
- The legend hides and shows a dataset (or a slice of a pie) with a click.

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

A SCATTER DATASET: { label: "Group A", data: [{ x: 170, y: 65, label: "Ayşe" }, [182, 80]] }
- A bubble has a size too: { x: 170, y: 65, r: 12 } or [170, 65, 12]. (Its area follows the value.)
- graph.addPoint({ x: 1, y: 2 }, 0) adds a point to a dataset.

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
    type: "line", // "line", "area", "bar", "pie", "doughnut", "radar", "scatter", "bubble"
    theme: "light", // "light", "dark", "auto" (follows the system setting)
    titleText: "",
    subtitleText: "",
    labels: null, // ["Jan", "Feb", "Mar"]
    values: null, // [12, 19, 7] Shortcut: creates one dataset.
    datasets: null, // [{ label: "2026", data: [12, 19, 7], ...see A DATASET above }]
    data: null, // { labels, datasets } (Used instead of labels, values and datasets.)
    legend: "auto", // "auto" (2+ datasets; a pie: at the right, or at the bottom of a narrow box), "top", "bottom", "left", "right", "none"
    stacked: 0, // 1: Bars one on the other, lines and areas over each other. The tooltip adds totalText.
    horizontal: 0, // 1: The values grow to the right. (Long names read better so.)
    totalText: "Total", // The last row of the tooltip of a stacked chart. "": No total
    centerText: "", // The big text in the middle of a doughnut. Ex: "1,284"
    centerSubText: "", // The small text under it. Ex: "Users"
    beginAtZero: 1, // 1: The value axis holds 0. (A bar chart always holds it: the length of a bar is its value.)
    minValue: null, // null: From the values.
    maxValue: null, // null: From the values. Ex: 100
    minX: null, // scatter, bubble: the limits of the x axis. null: From the values. (They do not hold 0 by themselves.)
    maxX: null,
    sizeText: "Size", // bubble: the name of its size in the tooltip
    xAxisText: "", // A small title under the chart. Ex: "Height (cm)"
    yAxisText: "", // A small title at the left of the chart, turned. Ex: "Weight (kg)"
    curve: "linear", // "linear", "smooth" (never goes over a value)
    showPoints: "auto", // "auto": When there is room for them. 1, 0
    formatValue: null, // function (value) { return value + " ₺"; } For the tooltip and the value axis.
    formatX: null, // scatter, bubble: the same for the x axis.
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
        legend: {
            keys: {
                line: { width: 14, height: 2, round: 1 },
                box: { width: 10, height: 10, round: 2 },
                dot: { width: 8, height: 8, round: 4 },
            },
            fontSize: 12,
            gap: 14,
            lineGap: 6,
            keyGap: 6,
            hiddenOpacity: 0.4,
            sideMinWidth: 400, // A pie: the legend is at its side only in a box as wide as this.
        },
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
        pie: {
            gap: 2, // Between two slices
            hole: 0.62, // A doughnut: the hole, as a part of the radius
            hoverGrow: 4, // Px: the slice under the mouse
            centerFontSize: 26,
        },
        radar: {
            ringSpace: 28, // About this many px between two rings
            fillOpacity: 0.15,
            maxLabelShare: 0.28, // A label is cut with "..." at this much of the width of the chart.
            showTicks: 1, // 1: The numbers of the rings
        },
        scatter: {
            maxBubble: 22, // Px: the radius of the biggest bubble
            bubbleOpacity: 0.65,
            hitRadius: 14, // Px: the mouse finds a point this far from it. (A point of 8 px is too small to aim at.)
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
    const FULL_CIRCLE = Math.PI * 2;
    const TOP_ANGLE = -Math.PI / 2; // The first slice starts at the top.
    const colorIndexes = new Map(); // The key of a series -> its place in the colors of the theme
    const hiddenSliceKeys = new Set(); // WHY keys, not places: A slice stays hidden when the values come again.
    const tooltipRows = [];
    let colors = null; // The colors of the theme + style.colors
    let svg, definitions, gridLayer, washLayer, markLayer, overlayLayer;
    let view = null; // What the last drawing knows about its marks. null: nothing is drawn.
    let activeItem = null; // { index, datasetIndex }: under the mouse, or chosen with the keyboard.
    let pointer = null; // { x, y } in the plot. null: the keyboard chose the item.
    let legendSignature = "";
    let drawnSize = "";
    let legendPlace = "";

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
        markLayer.removeAttribute("clip-path");
        overlayLayer.removeAttribute("clip-path");
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

    const isStacked = function () {
        return (box.stacked == 1 && box.type !== "radar");
    };

    const getStackName = function (seriesItem, value) {
        if (!isBarSeries(seriesItem)) return "lines";
        return (value < 0) ? "barsUnderBase" : "barsOverBase"; // WHY: A bar under the base line grows on its own side.
    };

    // Where a value starts and ends on the value axis. A stacked value starts where the one before it ended.
    const createValueRange = function (seriesItem, index, stackTotals) {
        const value = getValue(seriesItem.dataset, index);
        if (value === null) return null;
        if (!isStacked()) return { from: 0, to: value };
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

        return applyFixedLimits(low, high, box.minValue, box.maxValue);

    };

    const applyFixedLimits = function (low, high, fixedLow, fixedHigh) {
        const minValue = toNumber(fixedLow);
        const maxValue = toNumber(fixedHigh);
        return {
            low: (minValue === null) ? low : minValue,
            high: (maxValue === null) ? high : maxValue,
            hasFixedLow: (minValue !== null),
            hasFixedHigh: (maxValue !== null),
        };
    };

    const createValueScale = function (limits, length, tickSpace = _s.axis.tickSpace, formatTick = formatTickText) {
        const tickCount = Math.max(2, Math.floor(length / tickSpace));
        const scale = GraphBox.niceScale(limits.low, limits.high, tickCount);
        if (limits.hasFixedLow) scale.min = limits.low;
        if (limits.hasFixedHigh) scale.max = limits.high;
        scale.ticks = scale.ticks.filter(function (tick) {
            return (tick >= scale.min && tick <= scale.max);
        });
        scale.tickTexts = scale.ticks.map(function (tick) {
            return formatTick(tick, scale.decimals);
        });
        return scale;
    };

    // The base of the bars and the areas: 0, or the nearest edge when the axis does not hold 0.
    const getBaseValue = function (scale) {
        return Math.min(scale.max, Math.max(scale.min, 0));
    };

    const getAxisTitleRooms = function () {
        const room = getAxisTextHeight() + 2;
        return { left: (box.yAxisText) ? room : 0, bottom: (box.xAxisText) ? room : 0 };
    };

    // WHY: A value over a fixed limit (maxValue: 100) must not draw over the title. A little room is left for the points.
    const clipMarks = function (plot) {
        const room = getPointRoom();
        GraphBox._idCounter += 1;
        const id = "graph-box-clip-" + GraphBox._idCounter;
        const clip = addShape(definitions, "clipPath", { id: id });
        addShape(clip, "rect", {
            x: plot.left - room,
            y: plot.top - room,
            width: plot.right - plot.left + room * 2,
            height: plot.bottom - plot.top + room * 2,
        });
        markLayer.setAttribute("clip-path", "url(#" + id + ")");
        overlayLayer.setAttribute("clip-path", "url(#" + id + ")");
    };

    // The small titles of the axes: at the edges of the chart.
    const drawAxisTitles = function (plot, height) {
        const textHeight = getAxisTextHeight();
        if (box.xAxisText) {
            addText(gridLayer, box.xAxisText, (plot.left + plot.right) / 2, height - textHeight / 2, "middle", colors.textColor);
        }
        if (box.yAxisText) {
            const x = textHeight / 2;
            const y = (plot.top + plot.bottom) / 2;
            const title = addText(gridLayer, box.yAxisText, x, y, "middle", colors.textColor);
            title.setAttribute("transform", "rotate(-90 " + x + " " + y + ")");
        }
    };

    // THE AXES OF A LINE OR BAR CHART:

    const getPointRoom = function () {
        return _s.line.pointRadius + _s.line.pointRing + 1;
    };

    // The room of the texts around the plot, and the scale that fits it.
    const measurePlot = function (limits, hasBands, indexCount, width, height, labelRoom) {

        const labelGap = _s.axis.labelGap;
        const pointRoom = getPointRoom();
        const titleRooms = getAxisTitleRooms();
        const top = Math.max(pointRoom, Math.ceil(_s.axis.fontSize / 2));
        const bottom = height - (labelRoom + labelGap + titleRooms.bottom);
        const scale = createValueScale(limits, bottom - top);

        let left = titleRooms.left + Math.ceil(measureWidestText(scale.tickTexts)) + labelGap;
        let right = width - pointRoom;

        // WHY: Without bands the first and the last value are on the edges, so half of their labels is out of the plot.
        if (!hasBands && indexCount > 0) {
            left = Math.max(left, titleRooms.left + Math.ceil(measureAxisText(getLabelText(0)) / 2));
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
        const titleRooms = getAxisTitleRooms();

        const left = titleRooms.left + Math.ceil(labelWidth) + labelGap;
        const right = Math.max(left + 1, width - Math.max(pointRoom, Math.ceil(tickWidth / 2)));
        const top = (hasBands) ? 0 : Math.max(pointRoom, Math.ceil(textHeight / 2));
        const bottom = Math.max(top + 1, height - (textHeight + labelGap + titleRooms.bottom));
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

        axes.baseValue = getBaseValue(scale);

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

        const scale = axes.scale;
        const endPosition = axes.toValuePosition(Math.min(scale.max, Math.max(scale.min, range.to)));
        let basePosition = axes.toValuePosition(Math.min(scale.max, Math.max(scale.min, range.from)));
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

        const isBarStacked = isStacked();
        const slotCount = (isBarStacked) ? 1 : barSeries.length;
        const thickness = getBarThickness(axes, slotCount);
        const groupLength = thickness * slotCount + _s.bar.gap * (slotCount - 1);

        barSeries.forEach(function (seriesItem, seriesPlace) {
            const slot = (isBarStacked) ? 0 : seriesPlace;
            const slotOffset = slot * (thickness + _s.bar.gap) - groupLength / 2;
            seriesItem.barRects = [];
            seriesItem.ranges.forEach(function (range, index) {
                if (!range || range.from === range.to) return;
                const isRound = (!isBarStacked || isOuterValue(barSeries, seriesPlace, index, range));
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
        GraphBox._idCounter += 1;
        const id = "graph-box-gradient-" + GraphBox._idCounter;
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

    // WHY twice the ring, under the fill: A line of a circle is half inside it. So the point keeps its size, and the
    //     ring is out of it.
    const addPoint = function (layer, point, color, radius) {
        return addShape(layer, "circle", {
            cx: point.x,
            cy: point.y,
            r: radius,
            fill: color,
            stroke: getSurfaceColor(),
            "stroke-width": _s.line.pointRing * 2,
            "paint-order": "stroke",
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

    // The tooltip of one place: every series at that place.
    const getPlaceReadout = function (series, index) {
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
        if (isStacked() && box.totalText && rows.length > 1) {
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
                return getPlaceReadout(series, item.index);
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

        clipMarks(axes.plot);
        drawValueAxis(axes);
        drawIndexLabels(axes);
        drawAxisTitles(axes.plot, height);
        drawAreas(series, axes);
        drawBars(series, axes);
        drawLines(series, axes);

        return createCartesianView(series, axes);

    };

    // THE PIE AND THE DOUGHNUT:

    const isPieType = function () {
        return (box.type === "pie" || box.type === "doughnut");
    };

    const getSliceKey = function (index) {
        return getLabelText(index) || ("#" + index);
    };

    const getSliceColor = function (dataset, index) {
        return (dataset.colors && dataset.colors[index]) || colors.colors[index] || colors.otherColor;
    };

    const getSliceCount = function (dataset) {
        return Math.max(box.data.labels.length, dataset.data.length);
    };

    // The slices on the screen: only the ones with a value. (A slice can not be less than nothing.)
    const createSlices = function () {
        const dataset = box.data.datasets[0];
        const slices = [];
        if (!dataset) return slices;
        for (let index = 0; index < getSliceCount(dataset); index++) {
            const value = getValue(dataset, index);
            if (hiddenSliceKeys.has(getSliceKey(index)) || !(value > 0)) continue;
            slices.push({ index: index, value: value, color: getSliceColor(dataset, index) });
        }
        return slices;
    };

    const addSliceAngles = function (slices, total) {
        let angle = TOP_ANGLE;
        slices.forEach(function (slice) {
            slice.startAngle = angle;
            angle += slice.value / total * FULL_CIRCLE;
            slice.endAngle = angle;
        });
    };

    const getTotal = function (slices) {
        return slices.reduce(function (sum, slice) { return sum + slice.value; }, 0);
    };

    const addSlice = function (layer, slice, shape, outerRadius) {
        addShape(layer, "path", {
            d: GraphBox.slicePath(shape.center, shape.innerRadius, outerRadius, slice.startAngle, slice.endAngle, _s.pie.gap),
            fill: slice.color,
        });
    };

    // The text in the hole: it gets smaller when it has no room.
    const drawPieCenter = function (shape) {

        if (!shape.innerRadius || !box.centerText) return;

        const roomWidth = shape.innerRadius * 1.6;
        const family = "opensans-bold";
        const fullWidth = GraphBox.measureText(box.centerText, _s.pie.centerFontSize, family);
        const fontSize = Math.min(_s.pie.centerFontSize, _s.pie.centerFontSize * roomWidth / fullWidth);
        const subHeight = (box.centerSubText) ? getAxisTextHeight() : 0;
        const center = shape.center;

        const label = addText(markLayer, box.centerText, center.x, center.y - subHeight / 2, "middle", colors.titleColor);
        label.setAttribute("font-size", fontSize);
        label.setAttribute("font-family", family);

        if (!subHeight) return;
        const subText = GraphBox.fitText(box.centerSubText, roomWidth, _s.axis.fontSize, _s.axis.fontFamily);
        addText(markLayer, subText, center.x, center.y + fontSize / 2 + subHeight / 2 - 2, "middle", colors.textColor);

    };

    // WHY: When the values already are percents (they add up to 100), a second percent says nothing.
    const getShareText = function (value, total) {
        if (Math.round(total) === 100) return "";
        return GraphBox.formatPercent(value / total, box.locale);
    };

    const createPieView = function (slices, shape, total) {

        const findSlice = function (item) {
            return slices.find(function (slice) { return slice.index === item.index; });
        };

        return {
            findItem: function (x, y) {
                const distance = Math.hypot(x - shape.center.x, y - shape.center.y);
                if (distance > shape.outerRadius + _s.pie.hoverGrow || distance < shape.innerRadius) return null;
                let angle = Math.atan2(y - shape.center.y, x - shape.center.x);
                if (angle < TOP_ANGLE) angle += FULL_CIRCLE;
                const slice = slices.find(function (candidate) { return angle < candidate.endAngle; });
                return (slice) ? { index: slice.index, datasetIndex: 0 } : null;
            },
            stepItem: function (item, step) {
                const place = (item) ? slices.indexOf(findSlice(item)) + step : 0;
                const slice = slices[Math.min(slices.length - 1, Math.max(0, place))];
                return { index: slice.index, datasetIndex: 0 };
            },
            hasItem: function (item) {
                return !!findSlice(item);
            },
            paintItem: function (item) {
                // WHY a copy over it: The slice itself is not made again; the copy goes with the next move.
                addSlice(overlayLayer, findSlice(item), shape, shape.outerRadius + _s.pie.hoverGrow);
            },
            getReadout: function (item) {
                const slice = findSlice(item);
                return {
                    titleText: getLabelText(slice.index),
                    rows: [{ color: slice.color, valueText: formatValueText(slice.value), nameText: getShareText(slice.value, total) }],
                };
            },
            // For the keyboard: on the middle of the slice.
            getAnchor: function (item) {
                const slice = findSlice(item);
                const angle = (slice.startAngle + slice.endAngle) / 2;
                const radius = (shape.outerRadius + shape.innerRadius) / 2;
                return { x: shape.center.x + radius * Math.cos(angle), y: shape.center.y + radius * Math.sin(angle) };
            },
        };

    };

    const drawPie = function (width, height) {

        const slices = createSlices();
        const total = getTotal(slices);
        if (!(total > 0)) return null;

        const outerRadius = Math.max(1, Math.min(width, height) / 2 - _s.pie.hoverGrow);
        const shape = {
            center: { x: width / 2, y: height / 2 },
            outerRadius: outerRadius,
            innerRadius: (box.type === "doughnut") ? outerRadius * _s.pie.hole : 0,
        };

        addSliceAngles(slices, total);
        slices.forEach(function (slice) {
            addSlice(markLayer, slice, shape, outerRadius);
        });
        drawPieCenter(shape);

        return createPieView(slices, shape, total);

    };

    // THE RADAR:

    // The place of the chart: its center, its radius and the labels that fit at its sides.
    const measureRadar = function (indexCount, width, height) {
        const maxLabelWidth = width * _s.radar.maxLabelShare;
        const texts = getLabelTexts(indexCount).map(function (text) {
            return GraphBox.fitText(text, maxLabelWidth, _s.axis.fontSize, _s.axis.fontFamily);
        });
        const sideRoom = measureWidestText(texts) + _s.axis.labelGap;
        const upRoom = getAxisTextHeight() + _s.axis.labelGap;
        return {
            center: { x: width / 2, y: height / 2 },
            radius: Math.max(1, Math.min(width / 2 - sideRoom, height / 2 - upRoom)),
            texts: texts,
            indexCount: indexCount,
        };
    };

    const getSpokeAngle = function (shape, index) {
        return TOP_ANGLE + index / shape.indexCount * FULL_CIRCLE;
    };

    const toRadarPoint = function (shape, index, value) {
        const scale = shape.scale;
        const share = (value - scale.min) / ((scale.max - scale.min) || 1);
        const angle = getSpokeAngle(shape, index);
        return {
            x: shape.center.x + share * shape.radius * Math.cos(angle),
            y: shape.center.y + share * shape.radius * Math.sin(angle),
        };
    };

    const drawRadarGrid = function (shape) {

        const indexes = [];
        for (let index = 0; index < shape.indexCount; index++) indexes.push(index);

        shape.scale.ticks.forEach(function (tick) {
            const points = indexes.map(function (index) { return toRadarPoint(shape, index, tick); });
            addShape(gridLayer, "path", { d: GraphBox.polygonPath(points), fill: "none", stroke: colors.gridColor, "stroke-width": 1 });
        });

        indexes.forEach(function (index) {
            const end = toRadarPoint(shape, index, shape.scale.max);
            addLine(gridLayer, shape.center.x, shape.center.y, end.x, end.y, colors.gridColor);
        });

    };

    const drawRadarLabels = function (shape) {
        const distance = shape.radius + _s.axis.labelGap;
        shape.texts.forEach(function (text, index) {
            const angle = getSpokeAngle(shape, index);
            const cosine = Math.cos(angle);
            const SIDE_LIMIT = 0.2; // A label near the top or the bottom stays in the middle of its spoke.
            let anchor = "middle";
            if (cosine > SIDE_LIMIT) anchor = "start";
            if (cosine < -SIDE_LIMIT) anchor = "end";
            const x = shape.center.x + distance * cosine;
            const y = shape.center.y + distance * Math.sin(angle) + Math.sin(angle) * getAxisTextHeight() / 2;
            addText(gridLayer, text, x, y, anchor, colors.textColor);
        });
    };

    // The numbers of the rings: on the first spoke, with a ring in the color of the box, so a line does not cut them.
    const drawRadarTicks = function (shape) {
        if (!basic.isOn(_s.radar.showTicks)) return;
        shape.scale.ticks.forEach(function (tick, tickIndex) {
            if (tick === shape.scale.min) return;
            const point = toRadarPoint(shape, 0, tick);
            const label = addText(gridLayer, shape.scale.tickTexts[tickIndex], point.x + 4, point.y, "start");
            label.setAttribute("stroke", getSurfaceColor());
            label.setAttribute("stroke-width", 3);
            label.setAttribute("paint-order", "stroke");
        });
    };

    const drawRadarSeries = function (seriesItem, shape) {

        seriesItem.points = [];
        seriesItem.ranges.forEach(function (range, index) {
            if (range) seriesItem.points[index] = toRadarPoint(shape, index, range.to);
        });

        const points = seriesItem.points.filter(Boolean);
        addShape(markLayer, "path", {
            d: GraphBox.polygonPath(points),
            fill: seriesItem.color,
            "fill-opacity": _s.radar.fillOpacity,
            stroke: seriesItem.color,
            "stroke-width": _s.line.width,
            "stroke-linejoin": "round",
        });

        if (shape.indexCount * _s.line.pointSpace > shape.radius * FULL_CIRCLE) return; // No room for the points
        points.forEach(function (point) {
            addPoint(markLayer, point, seriesItem.color, _s.line.pointRadius - 1);
        });

    };

    const createRadarView = function (series, shape) {

        const count = shape.indexCount;

        return {
            findItem: function (x, y) {
                const distanceX = x - shape.center.x;
                const distanceY = y - shape.center.y;
                if (Math.hypot(distanceX, distanceY) > shape.radius + _s.axis.labelGap) return null;
                const angle = Math.atan2(distanceY, distanceX) - TOP_ANGLE;
                const index = (Math.round(angle / FULL_CIRCLE * count) + count) % count;
                return { index: index, datasetIndex: findNearestDataset(series, index, x, y) };
            },
            stepItem: function (item, step) {
                if (!item) return { index: 0, datasetIndex: null };
                return { index: (item.index + step + count) % count, datasetIndex: null };
            },
            hasItem: function (item) {
                return (item.index < count);
            },
            paintItem: function (item) {
                const end = toRadarPoint(shape, item.index, shape.scale.max);
                addLine(washLayer, shape.center.x, shape.center.y, end.x, end.y, colors.axisColor);
                paintActivePoints(series, item.index);
            },
            getReadout: function (item) {
                return getPlaceReadout(series, item.index);
            },
            getAnchor: function (item) {
                return toRadarPoint(shape, item.index, shape.scale.max);
            },
        };

    };

    const drawRadar = function (width, height) {

        const series = getVisibleSeries();
        const indexCount = getIndexCount(series);
        addValueRanges(series, indexCount);

        const limits = getValueLimits(series);
        if (!limits) return null;

        const shape = measureRadar(indexCount, width, height);
        shape.scale = createValueScale(limits, shape.radius, _s.radar.ringSpace);

        drawRadarGrid(shape);
        drawRadarLabels(shape);
        drawRadarTicks(shape);
        series.forEach(function (seriesItem) {
            drawRadarSeries(seriesItem, shape);
        });

        return createRadarView(series, shape);

    };

    // THE SCATTER AND THE BUBBLE:

    const isScatterType = function () {
        return (box.type === "scatter" || box.type === "bubble");
    };

    // A value of a dataset: { x, y }, [x, y], { x, y, r }, [x, y, r]. null: it can not be drawn.
    const toScatterValue = function (item) {
        if (item === null || item === undefined) return null;
        const source = (Array.isArray(item)) ? { x: item[0], y: item[1], r: item[2] } : item;
        const x = toNumber(source.x);
        const y = toNumber(source.y);
        if (x === null || y === null) return null;
        return { x: x, y: y, size: toNumber(source.r), label: source.label };
    };

    const createScatterPoints = function (series) {
        const points = [];
        series.forEach(function (seriesItem) {
            seriesItem.dataset.data.forEach(function (item, index) {
                const value = toScatterValue(item);
                if (!value) return;
                points.push(Object.assign(value, {
                    index: index,
                    datasetIndex: seriesItem.datasetIndex,
                    color: getMarkColor(seriesItem, index),
                    seriesName: seriesItem.dataset.label || "",
                }));
            });
        });
        return points;
    };

    const getLimitsOf = function (numbers, fixedLow, fixedHigh) {
        return applyFixedLimits(Math.min.apply(null, numbers), Math.max.apply(null, numbers), fixedLow, fixedHigh);
    };

    const formatXText = function (value) {
        if (box.formatX) return String(box.formatX(value));
        return GraphBox.formatNumber(value, box.locale);
    };

    const formatXTickText = function (value, decimals) {
        if (box.formatX) return String(box.formatX(value));
        return GraphBox.formatCompactNumber(value, box.locale, decimals);
    };

    // The radius of every point. (The area of a bubble follows its value, not its width: the eye reads the area.)
    const addPointRadiuses = function (points) {
        if (box.type !== "bubble") {
            points.forEach(function (point) { point.radius = _s.line.pointRadius; });
            return;
        }
        const biggest = points.reduce(function (size, point) { return Math.max(size, point.size || 0); }, 0);
        points.forEach(function (point) {
            const share = (biggest > 0) ? Math.sqrt(Math.max(0, point.size || 0) / biggest) : 1;
            point.radius = Math.max(_s.line.pointRing, share * _s.scatter.maxBubble);
        });
    };

    const measureScatterPlot = function (points, width, height) {

        const yLimits = getLimitsOf(points.map(function (point) { return point.y; }), box.minValue, box.maxValue);
        const xLimits = getLimitsOf(points.map(function (point) { return point.x; }), box.minX, box.maxX);
        const titleRooms = getAxisTitleRooms();
        const textHeight = getAxisTextHeight();
        const labelGap = _s.axis.labelGap;
        const edgeRoom = getPointRoom();

        const top = edgeRoom;
        const bottom = Math.max(top + 1, height - (textHeight + labelGap + titleRooms.bottom));
        const yScale = createValueScale(yLimits, bottom - top);
        const left = titleRooms.left + Math.ceil(measureWidestText(yScale.tickTexts)) + labelGap;

        const xTickWidth = measureWidestText([formatXTickText(xLimits.low, 0), formatXTickText(xLimits.high, 0)]);
        const right = Math.max(left + 1, width - Math.max(edgeRoom, Math.ceil(xTickWidth / 2)));
        const xTickSpace = Math.max(_s.axis.tickSpace, xTickWidth + _s.axis.labelSpace);
        const xScale = createValueScale(xLimits, right - left, xTickSpace, formatXTickText);

        return { left: left, top: top, right: right, bottom: bottom, xScale: xScale, yScale: yScale };

    };

    const createScatterAxes = function (plot) {

        // WHY the inset: A bubble is big, so the smallest and the biggest values must not be drawn on the edges.
        const inset = (box.type === "bubble") ? _s.scatter.maxBubble : 0;
        const xScale = plot.xScale;
        const yScale = plot.yScale;
        const xLength = plot.right - plot.left - inset * 2;
        const yLength = plot.bottom - plot.top - inset * 2;

        return {
            plot: plot,
            toX: function (value) {
                return plot.left + inset + (value - xScale.min) / ((xScale.max - xScale.min) || 1) * xLength;
            },
            toY: function (value) {
                return plot.bottom - inset - (value - yScale.min) / ((yScale.max - yScale.min) || 1) * yLength;
            },
        };

    };

    const drawScatterGrid = function (axes) {

        const plot = axes.plot;
        const textHeight = getAxisTextHeight();

        plot.yScale.ticks.forEach(function (tick, tickIndex) {
            const y = toPixelCenter(axes.toY(tick));
            addLine(gridLayer, plot.left, y, plot.right, y, colors.gridColor);
            addText(gridLayer, plot.yScale.tickTexts[tickIndex], plot.left - _s.axis.labelGap, y, "end");
        });

        plot.xScale.ticks.forEach(function (tick, tickIndex) {
            const x = toPixelCenter(axes.toX(tick));
            addLine(gridLayer, x, plot.top, x, plot.bottom, colors.gridColor);
            addText(gridLayer, plot.xScale.tickTexts[tickIndex], x, plot.bottom + _s.axis.labelGap + textHeight / 2);
        });

        const baseY = toPixelCenter((plot.yScale.min < 0 && plot.yScale.max > 0) ? axes.toY(0) : plot.bottom);
        const baseX = toPixelCenter((plot.xScale.min < 0 && plot.xScale.max > 0) ? axes.toX(0) : plot.left);
        addLine(gridLayer, plot.left, baseY, plot.right, baseY, colors.axisColor);
        addLine(gridLayer, baseX, plot.top, baseX, plot.bottom, colors.axisColor);

    };

    const drawScatterPoint = function (point) {
        const dot = addPoint(markLayer, { x: point.px, y: point.py }, point.color, point.radius);
        if (box.type === "bubble") dot.setAttribute("fill-opacity", _s.scatter.bubbleOpacity);
    };

    const findNearestPoint = function (points, x, y) {
        let nearest = null;
        let nearestDistance = Infinity;
        points.forEach(function (point) {
            const distance = Math.hypot(point.px - x, point.py - y);
            const reach = Math.max(_s.scatter.hitRadius, point.radius);
            if (distance > reach || distance >= nearestDistance) return;
            nearest = point;
            nearestDistance = distance;
        });
        return nearest;
    };

    const getScatterReadout = function (point) {
        const rows = [
            { color: point.color, valueText: formatValueText(point.y), nameText: box.yAxisText || "y" },
            { color: "transparent", valueText: formatXText(point.x), nameText: box.xAxisText || "x" },
        ];
        if (box.type === "bubble" && point.size !== null) {
            rows.push({ color: "transparent", valueText: GraphBox.formatNumber(point.size, box.locale), nameText: box.sizeText });
        }
        return { titleText: (point.label === undefined) ? point.seriesName : String(point.label), rows: rows };
    };

    const createScatterView = function (points) {

        const findPoint = function (item) {
            return points.find(function (point) {
                return (point.datasetIndex === item.datasetIndex && point.index === item.index);
            });
        };

        return {
            findItem: function (x, y) {
                const point = findNearestPoint(points, x, y);
                return (point) ? { index: point.index, datasetIndex: point.datasetIndex } : null;
            },
            stepItem: function (item, step) {
                const place = (item) ? points.indexOf(findPoint(item)) + step : 0;
                const point = points[Math.min(points.length - 1, Math.max(0, place))];
                return { index: point.index, datasetIndex: point.datasetIndex };
            },
            hasItem: function (item) {
                return !!findPoint(item);
            },
            paintItem: function (item) {
                const point = findPoint(item);
                addPoint(overlayLayer, { x: point.px, y: point.py }, point.color, point.radius + 1);
            },
            getReadout: function (item) {
                return getScatterReadout(findPoint(item));
            },
            getAnchor: function (item) {
                const point = findPoint(item);
                return { x: point.px, y: point.py };
            },
        };

    };

    const drawScatter = function (width, height) {

        const points = createScatterPoints(getVisibleSeries());
        if (!points.length) return null;

        const axes = createScatterAxes(measureScatterPlot(points, width, height));

        clipMarks(axes.plot);
        drawScatterGrid(axes);
        drawAxisTitles(axes.plot, height);
        addPointRadiuses(points);

        points.forEach(function (point) {
            point.px = axes.toX(point.x);
            point.py = axes.toY(point.y);
            drawScatterPoint(point);
        });

        return createScatterView(points);

    };

    // THE PLOT:

    const drawChart = function (width, height) {
        if (isPieType()) return drawPie(width, height);
        if (isScatterType()) return drawScatter(width, height);
        if (box.type === "radar") return drawRadar(width, height);
        return drawCartesian(width, height);
    };

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

        view = drawChart(width, height);

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
                if (isScatterType()) {
                    const point = toScatterValue(value);
                    return (point) ? formatXText(point.x) + " " + formatValueText(point.y) : "";
                }
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

    // A key looks like its mark.
    const getKeyShape = function (dataset) {
        const type = getDatasetType(dataset);
        if (type === "bar") return "box";
        return (type === "scatter" || type === "bubble") ? "dot" : "line";
    };

    const getSeriesEntries = function () {
        return box.data.datasets.map(function (dataset, position) {
            return {
                text: dataset.label || "",
                color: getSeriesColor(dataset, position),
                keyShape: getKeyShape(dataset),
                isHidden: basic.isOn(dataset.hidden),
                position: position,
            };
        });
    };

    const getSliceEntries = function () {
        const dataset = box.data.datasets[0];
        const entries = [];
        if (!dataset) return entries;
        for (let index = 0; index < getSliceCount(dataset); index++) {
            entries.push({
                text: getLabelText(index),
                color: getSliceColor(dataset, index),
                keyShape: "box",
                isHidden: hiddenSliceKeys.has(getSliceKey(index)),
                position: index,
            });
        }
        return entries;
    };

    const getLegendEntries = function () {
        const entries = (isPieType()) ? getSliceEntries() : getSeriesEntries();
        return entries.filter(function (entry) { return entry.text !== ""; });
    };

    const getLegendPosition = function () {
        if (box.legend === 0 || box.legend === false || box.legend === "none") return "none";
        if (box.legend !== "auto") return box.legend;
        if (isPieType()) return (box.elem.clientWidth >= _s.legend.sideMinWidth) ? "right" : "bottom";
        return (box.data.datasets.length >= 2) ? "top" : "none";
    };

    const applyLegendPosition = function () {

        const position = getLegendPosition();
        legendPlace = position;
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
        const setVisible = (isPieType()) ? box.setSliceVisible : box.setDatasetVisible;
        setVisible(entry.position, entry.isHidden ? 1 : 0);
    };

    const createLegendItem = function (entry) {

        // GROUP: One item: its key looks like its mark, its text is never in the data color.
        const item = HGroup({ hug: 1, gap: _s.legend.keyGap, align: "left center" });

            item.key = Box({ ..._s.legend.keys[entry.keyShape], color: entry.color });
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
        // WHY later: Moving the legend changes the size of the plot, and an observer must not change what it watches
        //     while it runs (the browser reports it as an error of the page).
        if (getLegendPosition() !== legendPlace) box.after(0, refreshLayout);
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

    // scatter, bubble: Add a point to a dataset.
    box.addPoint = function (point, datasetIndex = 0) {
        const dataset = box.data.datasets[datasetIndex];
        if (!dataset) return;
        if (box.maxCount > 0 && dataset.data.length >= box.maxCount) dataset.data.shift();
        dataset.data.push(point);
        drawData();
    };
    // USAGE: graph.addPoint({ x: 170, y: 65 }, 0)

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

    // Hide or show a slice of a pie or a doughnut.
    box.setSliceVisible = function (index, visible) {
        const key = getSliceKey(index);
        if (basic.isOn(visible)) hiddenSliceKeys.delete(key);
        else hiddenSliceKeys.add(key);
        drawData();
    };

    box.setType = function (type) {
        box.type = type;
        drawData();
    };
    // USAGE: "line", "area", "bar", "pie", "doughnut", "radar", "scatter", "bubble"

    // The texts in the middle of a doughnut.
    box.setCenterText = function (text, subText = box.centerSubText) {
        box.centerText = text;
        box.centerSubText = subText;
        drawPlot();
    };

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

    // scatter, bubble: The limits of the x axis. null: from the values.
    box.setXLimits = function (minX, maxX) {
        box.minX = minX;
        box.maxX = maxX;
        drawPlot();
    };

    box.setAxisTexts = function (xAxisText, yAxisText) {
        box.xAxisText = xAxisText;
        box.yAxisText = yAxisText;
        drawPlot();
    };

    box.setFormatValue = function (func) {
        box.formatValue = func;
        drawPlot();
    };

    box.setFormatX = function (func) {
        box.formatX = func;
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

GraphBox._idCounter = 0; // WHY: The id of a gradient or a clip must be alone on the whole page.

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

// 0.423 -> "42.3%"
GraphBox.formatPercent = function (share, locale) {
    return share.toLocaleString(locale || undefined, { style: "percent", maximumFractionDigits: 1 });
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

// A closed shape through the points.
GraphBox.polygonPath = function (points) {
    if (!points.length) return "";
    return "M" + points.map(function (point) { return GraphBox.pointText(point); }).join("L") + "Z";
};

// A whole circle or ring. WHY two arcs: One arc from a point to the same point draws nothing.
GraphBox.ringPath = function (center, innerRadius, outerRadius) {
    const circle = function (radius, direction) {
        const first = GraphBox.pointText({ x: center.x - radius, y: center.y });
        const second = GraphBox.pointText({ x: center.x + radius, y: center.y });
        const arc = "A" + radius + " " + radius + " 0 1 " + direction + " ";
        return "M" + first + arc + second + arc + first + "Z";
    };
    // WHY the other direction: A path that turns the other way makes a hole.
    return circle(outerRadius, 1) + ((innerRadius > 0) ? circle(innerRadius, 0) : "");
};

// A slice of a pie or a ring. Angles in radians, growing clockwise.
// WHY the gap is in the geometry: A line in the color of the box would not be seen on a box with no color. Half of the
//     gap is the same px at every radius, so the sides of a slice stay parallel to the sides of the next one.
GraphBox.slicePath = function (center, innerRadius, outerRadius, startAngle, endAngle, gap) {

    const sweep = endAngle - startAngle;
    if (sweep >= Math.PI * 2 - 0.0001) return GraphBox.ringPath(center, innerRadius, outerRadius);

    const pointAt = function (radius, angle) {
        return GraphBox.pointText({ x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) });
    };
    const arcTo = function (radius, angle, isLarge, direction) {
        return "A" + radius + " " + radius + " 0 " + (isLarge ? 1 : 0) + " " + direction + " " + pointAt(radius, angle);
    };

    // A slice thinner than the gap keeps no gap: it must still be seen.
    const halfGap = (sweep > gap / outerRadius) ? gap / 2 : 0;
    const outerPad = halfGap / outerRadius;
    const innerPad = (innerRadius > 0) ? halfGap / innerRadius : Infinity;

    const outerSweep = sweep - outerPad * 2;
    let path = "M" + pointAt(outerRadius, startAngle + outerPad) + arcTo(outerRadius, endAngle - outerPad, outerSweep > Math.PI, 1);

    if (sweep > innerPad * 2) {
        const innerSweep = sweep - innerPad * 2;
        path += "L" + pointAt(innerRadius, endAngle - innerPad) + arcTo(innerRadius, startAngle + innerPad, innerSweep > Math.PI, 0);
        return path + "Z";
    }

    // The two sides meet before the hole, on the middle line of the slice.
    // WHY the limit: The sides of a very big slice meet far away; near the center nobody can see the small difference.
    const meetDistance = halfGap / Math.sin(sweep / 2);
    const meetRadius = (sweep > Math.PI) ? Math.min(meetDistance, gap) : meetDistance;
    path += "L" + pointAt(Math.max(innerRadius, meetRadius), startAngle + sweep / 2);
    return path + "Z";

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
