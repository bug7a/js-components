/* Bismillah */

/*

Chart Box - v26.09

UI COMPONENT TEMPLATE
- A bridge between basic.js and Chart.js (https://www.chartjs.org). Use Chart.js charts like a basic.js object.
- Chart.js v4.5.1 is in the chart-box folder. It is loaded automatically (ChartBox.libraryUrl), if the page did not load it.
  No internet is needed, and a new Chart.js version can not change the charts.
- Chart types: "line", "bar", "pie", "doughnut", "radar", "polarArea", "scatter", "bubble" (and mixed charts).
- Light and dark themes ("light", "dark", "auto"). Colors are given to datasets automatically.
- Shortcuts for the most used settings: title, subtitle, legend, stacked, horizontal, formatValue.
- Full Chart.js power is still there: data, options, plugins and box.chart (the Chart instance).

USAGE:
const sales = ChartBox({
    width: 500, height: 300,
    type: "bar",
    title: "Sales",
    labels: ["Jan", "Feb", "Mar"],
    values: [12, 19, 7], // Shortcut for one dataset. Or: datasets: [{ label: "2026", data: [12, 19, 7] }]
    formatValue: (v) => v + " ₺",
    onClick: (self, item) => println(item.label + ": " + item.value),
});
sales.addValue("Apr", 15);
sales.setTheme("dark");

NOTE: Chart.js options can be very deep (options.scales.r.pointLabels.font.size).
WHY: startObject() copies params only 4 levels deep. So data, options and plugins are kept outside of it.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ChartBoxDefaults = {
    key: "0",
    width: 500,
    height: 300,
    type: "line", // "line", "bar", "pie", "doughnut", "radar", "polarArea", "scatter", "bubble"
    theme: "light", // "light", "dark", "auto" (follows the system setting)
    title: "", // Chart title (inside the chart)
    subtitle: "",
    labels: null, // ["Jan", "Feb", "Mar"]
    values: null, // [12, 19, 7] Shortcut: creates one dataset.
    datasets: null, // [{ label: "2026", data: [12, 19, 7], ...Chart.js dataset options }]
    data: null, // Chart.js data: { labels, datasets } (Used instead of labels, values and datasets.)
    options: null, // Chart.js options. Merged over the options of the component.
    plugins: null, // Chart.js inline plugins: [{ id: "myPlugin", afterDraw: function (chart) { } }]
    legend: "auto", // "auto" (2+ datasets or pie types), "top", "bottom", "left", "right", "none"
    stacked: 0, // 1: Stacked bars / lines
    horizontal: 0, // 1: Horizontal bars (indexAxis: "y")
    beginAtZero: 1, // 1: The value axis starts from 0.
    formatValue: null, // function (value) { return value + " ₺"; } For tooltips and value axis.
    maxCount: 0, // addValue(): 0: No limit. Ex: 20 (the first value is removed, for live data)
    autoColor: 1, // 1: Datasets without colors get colors from the theme.
    animated: 1,
    onReady: function (self) { }, // Chart is created. (Chart.js may be loaded later from the chart-box folder.)
    onClick: function (self, item, event) { }, // item: { datasetIndex, index, label, value, datasetLabel, dataset }
    onError: function (self, message) { }, // Chart.js could not be loaded.
    style: {
        box: {
            color: "", // "": Theme backgroundColor
            border: 1,
            borderColor: "", // "": Theme borderColor
            round: 12,
            padding: 16,
        },
        chart: {
            // Overrides the theme colors. Ex: { gridColor: "#334155", colors: ["#38bdf8", "#8b5cf6"] }
        },
    }
};

const ChartBox = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, ChartBoxDefaults);

    // WHY: startObject() copies params only 4 levels deep and keeps arrays by reference.
    // Chart.js settings are kept out of it, so deep options are not lost.
    const chartParams = {};
    const boxParams = Object.assign({}, params);
    ["labels", "values", "datasets", "data", "options", "plugins", "formatValue"].forEach(function (key) {
        chartParams[key] = params[key];
        delete boxParams[key];
    });

    // BOX: Component container
    let box = startObject(boxParams);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let colorCounter = 0; // WHY: A dataset keeps its color, even if other datasets are removed.
    let mediaQuery = null;
    let readyFunctions = [];

    // *** PUBLIC VARIABLES:
    // [var] Chart.js instance (null until Chart.js is loaded)
    box.chart = null;
    // [var] Canvas element of the chart
    box.canvas = null;
    // [var] Chart.js data: { labels, datasets } (Same object with box.chart.data)
    box.data = null;
    // [var] Chart.js options given by the user
    box.options = chartParams.options || {};
    // [var]
    box.plugins = chartParams.plugins || [];
    // [var]
    box.formatValue = chartParams.formatValue || null;
    // [var] 1: Chart is created.
    box.isReady = 0;

    // *** PRIVATE FUNCTIONS:

    const PIE_TYPES = ["pie", "doughnut", "polarArea"];
    const RADIAL_TYPES = ["radar", "polarArea"];

    const isPieType = function (type) {
        return PIE_TYPES.includes(type);
    };

    // Active theme name: "light" or "dark"
    const getThemeName = function () {
        if (box.theme == "auto") {
            return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
        }
        return (box.theme == "dark") ? "dark" : "light";
    };

    // Theme colors + style.chart overrides
    const getTokens = function () {
        const base = ChartBox.THEMES[getThemeName()] || ChartBox.THEMES.light;
        return Object.assign({}, base, _s.chart);
    };

    const createData = function () {

        let data = chartParams.data;

        if (!data) {
            let datasets = chartParams.datasets;
            if (!datasets) {
                datasets = [];
                if (chartParams.values) {
                    datasets.push({ label: box.title || "", data: chartParams.values });
                }
            }
            data = { labels: chartParams.labels || [], datasets: datasets };
        }

        if (!data.labels) data.labels = [];
        if (!data.datasets) data.datasets = [];

        return data;

    };

    // Gives a color only for the missing keys. Colors given by the component are remembered,
    // so they can change with the theme. A color given by the user is never changed.
    const setAutoValue = function (dataset, key, value) {
        const auto = dataset._chartBoxAuto;
        if (key in dataset && dataset[key] !== auto.values[key]) return; // User value
        dataset[key] = value;
        auto.values[key] = value;
    };

    const prepareData = function () {

        const t = getTokens();
        const colors = t.colors;

        box.data.datasets.forEach(function (dataset) {

            if (!dataset.data) dataset.data = [];
            if (box.autoColor != 1) return;

            if (!dataset._chartBoxAuto) {
                // WHY: Not enumerable, so Chart.js and JSON.stringify do not see it.
                Object.defineProperty(dataset, "_chartBoxAuto", {
                    value: { colorIndex: colorCounter++, values: {} },
                    enumerable: false,
                    writable: true,
                });
            }

            const type = dataset.type || box.type;
            const color = colors[dataset._chartBoxAuto.colorIndex % colors.length];

            if (isPieType(type)) {
                // One color for each item
                const itemColors = box.data.labels.map(function (label, index) {
                    const c = colors[index % colors.length];
                    return (type == "polarArea") ? ChartBox.alpha(c, 0.75) : c;
                });
                setAutoValue(dataset, "backgroundColor", itemColors);
                setAutoValue(dataset, "hoverBackgroundColor", itemColors);
                setAutoValue(dataset, "borderColor", t.backgroundColor); // Surface gap between slices
                return;
            }

            setAutoValue(dataset, "borderColor", color);
            setAutoValue(dataset, "pointBackgroundColor", color);
            setAutoValue(dataset, "pointBorderColor", t.backgroundColor); // Surface ring around points

            if (type == "bar") {
                setAutoValue(dataset, "backgroundColor", color);
                setAutoValue(dataset, "hoverBackgroundColor", color);
            } else if (type == "radar") {
                setAutoValue(dataset, "backgroundColor", ChartBox.alpha(color, 0.15));
            } else if (type == "bubble" || type == "scatter") {
                setAutoValue(dataset, "backgroundColor", ChartBox.alpha(color, (type == "bubble") ? 0.6 : 1));
            } else {
                setAutoValue(dataset, "backgroundColor", ChartBox.alpha(color, 0.1)); // Area fill (fill: true)
            }

        });

    };

    // Value from a tooltip context
    const getContextValue = function (context) {
        const parsed = context.parsed;
        if (typeof parsed === "number") return parsed;
        if (parsed.r !== undefined) return parsed.r;
        return (context.chart.options.indexAxis == "y") ? parsed.x : parsed.y;
    };

    const isLegendVisible = function () {
        if (box.legend == "none" || box.legend === 0 || box.legend === false) return false;
        if (box.legend != "auto") return true;
        // NOTE: One dataset does not need a legend. The title tells what it is.
        return isPieType(box.type) || box.data.datasets.length >= 2;
    };

    const createOptions = function () {

        const t = getTokens();
        const font = { family: t.fontFamily, size: t.fontSize };
        const type = box.type;

        // The axis of the "index" interaction mode.
        // WHY: Chart.js uses "x" for that mode, whatever indexAxis is. With horizontal bars the index
        //      runs on the y axis, so the tooltip showed the bar that was nearest on the x axis
        //      (the one with a similar length), not the one under the pointer.
        const hoverAxis = (box.horizontal == 1 && !isPieType(type) && !RADIAL_TYPES.includes(type)
            && type != "scatter" && type != "bubble") ? "y" : "x";

        const options = {
            responsive: true,
            maintainAspectRatio: false, // WHY: The chart fills the box. The box size is set by basic.js.
            color: t.textColor,
            font: font,
            animation: (box.animated == 1) ? {} : false,
            interaction: (isPieType(type) || type == "scatter" || type == "bubble")
                ? { mode: "nearest", intersect: true }
                : { mode: "index", intersect: false, axis: hoverAxis },
            elements: {
                line: { borderWidth: 2, borderCapStyle: "round", borderJoinStyle: "round" },
                point: { radius: 4, hoverRadius: 6, borderWidth: 2, hitRadius: 8 },
                bar: { borderRadius: 4, borderSkipped: "start" }, // Rounded data end, square at the baseline
                arc: { borderWidth: 2 },
            },
            datasets: {
                bar: { maxBarThickness: 28 },
            },
            plugins: {
                title: {
                    display: !!box.title,
                    text: box.title,
                    align: "start",
                    color: t.titleColor,
                    font: { family: t.fontFamily, size: t.fontSize + 4, weight: "600" },
                    padding: { top: 0, bottom: (box.subtitle) ? 2 : 12 },
                },
                subtitle: {
                    display: !!box.subtitle,
                    text: box.subtitle,
                    align: "start",
                    color: t.mutedTextColor,
                    font: font,
                    padding: { bottom: 12 },
                },
                legend: {
                    display: isLegendVisible(),
                    position: (["top", "bottom", "left", "right"].includes(box.legend)) ? box.legend : (isPieType(type) ? "right" : "top"),
                    align: (isPieType(type)) ? "center" : "start",
                    labels: {
                        color: t.textColor,
                        font: font,
                        usePointStyle: true,
                        boxWidth: 8,
                        boxHeight: 8,
                        padding: 14,
                    },
                },
                tooltip: {
                    backgroundColor: t.tooltipColor,
                    titleColor: t.tooltipTextColor,
                    bodyColor: t.tooltipTextColor,
                    borderColor: t.borderColor,
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 6,
                    boxPadding: 4,
                    usePointStyle: true,
                    titleFont: { family: t.fontFamily, size: t.fontSize, weight: "600" },
                    bodyFont: font,
                },
            },
        };

        if (box.formatValue) {
            options.plugins.tooltip.callbacks = {
                label: function (context) {
                    const name = (isPieType(context.dataset.type || type)) ? context.label : context.dataset.label;
                    const text = box.formatValue(getContextValue(context));
                    return (name) ? name + ": " + text : text;
                },
            };
        }

        const createAxis = function (showGrid) {
            return {
                grid: { display: showGrid, color: t.gridColor, drawTicks: false },
                border: { display: true, color: t.axisColor },
                ticks: { color: t.mutedTextColor, font: font, padding: 8 },
            };
        };

        if (RADIAL_TYPES.includes(type)) {

            options.scales = {
                r: {
                    beginAtZero: box.beginAtZero == 1,
                    angleLines: { color: t.gridColor },
                    grid: { color: t.gridColor },
                    pointLabels: { color: t.textColor, font: font },
                    ticks: { color: t.mutedTextColor, font: font, backdropColor: "transparent", showLabelBackdrop: false },
                },
            };
            if (box.formatValue) options.scales.r.ticks.callback = function (value) { return box.formatValue(value); };

        } else if (!isPieType(type)) {

            const isHorizontal = (box.horizontal == 1 && type != "scatter" && type != "bubble");
            const isXY = (type == "scatter" || type == "bubble");
            const valueAxis = (isHorizontal) ? "x" : "y";
            const indexAxis = (isHorizontal) ? "y" : "x";

            options.indexAxis = indexAxis;
            options.scales = {};
            // NOTE: Only the value axis has grid lines. (Both, for scatter and bubble)
            options.scales[indexAxis] = createAxis(isXY);
            options.scales[valueAxis] = createAxis(true);
            options.scales[valueAxis].beginAtZero = box.beginAtZero == 1;
            options.scales[valueAxis].border.display = false;

            if (box.stacked == 1) {
                options.scales.x.stacked = true;
                options.scales.y.stacked = true;
            }

            if (box.formatValue) {
                options.scales[valueAxis].ticks.callback = function (value) { return box.formatValue(value); };
            }

        }

        // User options are stronger.
        return ChartBox.merge({}, options, box.options);

    };

    const applyBoxStyle = function () {
        const t = getTokens();
        box.color = _s.box.color || t.backgroundColor;
        box.border = _s.box.border;
        box.borderColor = _s.box.borderColor || t.borderColor;
        box.round = _s.box.round;
        box.chartArea.elem.style.inset = (_s.box.padding || 0) + "px";
    };

    // Clicked item: { datasetIndex, index, label, value, datasetLabel, dataset }
    const getItemAtEvent = function (event) {
        if (!box.chart) return null;
        const points = box.chart.getElementsAtEventForMode(event, "nearest", { intersect: true }, true);
        if (!points.length) return null;
        const point = points[0];
        const dataset = box.data.datasets[point.datasetIndex];
        return {
            datasetIndex: point.datasetIndex,
            index: point.index,
            label: box.data.labels[point.index],
            value: dataset.data[point.index],
            datasetLabel: dataset.label || "",
            dataset: dataset,
        };
    };

    const createChart = function () {

        if (!box) return; // Destroyed before Chart.js was loaded.

        prepareData();

        box.chart = new window.Chart(box.canvas, {
            type: box.type,
            data: box.data,
            options: createOptions(),
            plugins: box.plugins,
        });

        box.canvas.setAttribute("role", "img");
        box.canvas.setAttribute("aria-label", box.title || box.type + " chart");

        if (!box.isReady) {
            box.isReady = 1;
            box.onReady(box);
            readyFunctions.forEach(function (func) { func(box); });
            readyFunctions = [];
        }

    };

    const onSystemThemeChange = function () {
        if (box && box.theme == "auto") box.refreshTheme();
    };

    // *** PUBLIC FUNCTIONS:

    // Run a function when the chart is ready. (Runs now, if it is ready.)
    box.whenReady = function (func) {
        if (box.isReady) func(box);
        else readyFunctions.push(func);
    };
    // USAGE: chartBox.whenReady(function (self) { self.chart.... });

    // Redraw after data changes. Ex: box.data.datasets[0].data[2] = 50; box.update();
    box.update = function (mode) {
        prepareData();
        if (box.chart) box.chart.update(mode);
    };
    // mode: "none" (no animation), "active", "resize", "reset", ...

    // Recreate Chart.js options (after a setting change).
    box.refreshOptions = function (mode) {
        prepareData();
        if (!box.chart) return;
        box.chart.options = createOptions();
        box.chart.update(mode);
    };

    box.setData = function (data) {
        box.data.labels = data.labels || [];
        box.data.datasets = data.datasets || [];
        box.refreshOptions(); // WHY: Legend "auto" depends on the dataset count.
    };
    // USAGE: chartBox.setData({ labels: ["A", "B"], datasets: [{ label: "X", data: [1, 2] }] })

    box.setLabels = function (labels) {
        box.data.labels = labels;
        box.update();
    };

    box.setDatasets = function (datasets) {
        box.data.datasets = datasets;
        box.refreshOptions();
    };

    // Change the values of one dataset. The dataset is created, if it is not there.
    box.setValues = function (values, datasetIndex = 0) {
        const dataset = box.data.datasets[datasetIndex];
        if (dataset) {
            dataset.data = values;
            box.update();
        } else {
            box.addDataset({ label: box.title || "", data: values });
        }
    };

    // Add a new label and values to the end. (For live data, use maxCount.)
    box.addValue = function (label, values) {

        const list = (Array.isArray(values)) ? values : [values];

        box.data.datasets.forEach(function (dataset) {
            if (!dataset.data) dataset.data = [];
        });

        // WHY: Remove first, then add. Chart.js applies array changes in order.
        // push() then shift() gives the new point an index out of the array (x: NaN),
        // and with frequent updates the animation never ends, so the new lines are not visible.
        if (box.maxCount > 0) {
            while (box.data.labels.length >= box.maxCount) {
                box.data.labels.shift();
                box.data.datasets.forEach(function (dataset) { dataset.data.shift(); });
            }
        }

        box.data.labels.push(label);
        box.data.datasets.forEach(function (dataset, index) {
            dataset.data.push((list[index] !== undefined) ? list[index] : null);
        });

        box.update();

    };
    // USAGE: chartBox.addValue("May", 42) or chartBox.addValue("May", [42, 30]) (one value for each dataset)

    box.addDataset = function (dataset) {
        box.data.datasets.push(dataset);
        box.refreshOptions();
    };

    box.removeDataset = function (index) {
        if (index < 0 || index >= box.data.datasets.length) return;
        box.data.datasets.splice(index, 1);
        box.refreshOptions();
    };

    box.setDatasetVisible = function (index, visible) {
        if (!box.chart) return;
        box.chart.setDatasetVisibility(index, visible == 1 || visible === true);
        box.chart.update();
    };

    // Merge (or replace) Chart.js options.
    box.setOptions = function (options, replace = 0) {
        box.options = (replace) ? options : ChartBox.merge(box.options, options);
        box.refreshOptions();
    };
    // USAGE: chartBox.setOptions({ scales: { y: { max: 100 } } })

    box.setType = function (type) {
        box.type = type;
        // WHY: Axes are different for each type. Creating the chart again is safer.
        if (box.chart) {
            box.chart.destroy();
            box.chart = null;
            createChart();
        }
    };

    box.setTitle = function (text) {
        box.title = text;
        if (box.canvas) box.canvas.setAttribute("aria-label", text || box.type + " chart");
        box.refreshOptions();
    };

    box.setSubtitle = function (text) {
        box.subtitle = text;
        box.refreshOptions();
    };

    box.setLegend = function (legend) {
        box.legend = legend;
        box.refreshOptions();
    };
    // USAGE: "auto", "top", "bottom", "left", "right", "none"

    box.setStacked = function (stacked) {
        box.stacked = (stacked == 1 || stacked === true) ? 1 : 0;
        box.refreshOptions();
    };

    box.setHorizontal = function (horizontal) {
        box.horizontal = (horizontal == 1 || horizontal === true) ? 1 : 0;
        box.refreshOptions();
    };

    box.setFormatValue = function (func) {
        box.formatValue = func;
        box.refreshOptions();
    };

    box.setTheme = function (theme) {
        box.theme = theme;
        box.refreshTheme();
    };
    // USAGE: "light", "dark", "auto"

    // Change the theme colors. Ex: setStyle({ chart: { gridColor: "#334155" }, box: { round: 0 } })
    box.setStyle = function (style) {
        ChartBox.merge(_s, style);
        box.refreshTheme();
    };

    box.refreshTheme = function () {
        applyBoxStyle();
        box.refreshOptions("none");
    };

    // Chart image with the background color. (Data URL)
    box.getImage = function (imageType = "image/png") {
        if (!box.chart) return "";
        const image = document.createElement("canvas");
        image.width = box.canvas.width;
        image.height = box.canvas.height;
        const context = image.getContext("2d");
        context.fillStyle = _s.box.color || getTokens().backgroundColor;
        context.fillRect(0, 0, image.width, image.height);
        context.drawImage(box.canvas, 0, 0);
        return image.toDataURL(imageType);
    };

    box.download = function (fileName = "chart.png") {
        const url = box.getImage((fileName.toLowerCase().endsWith(".jpg")) ? "image/jpeg" : "image/png");
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        if (mediaQuery) mediaQuery.removeEventListener("change", onSystemThemeChange);
        if (box.chart) box.chart.destroy();
        box.chart = null;

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    // BOX: Chart area (Chart.js wants a parent element only for the canvas.)
    box.chartArea = Box({
        color: "transparent",
    });
    // WHY: inset (set in applyBoxStyle) sizes the area with the padding. width/height must be auto.
    box.chartArea.elem.style.width = "auto";
    box.chartArea.elem.style.height = "auto";

    // CANVAS: Chart.js draws here.
    box.canvas = document.createElement("canvas");
    box.chartArea.elem.appendChild(box.canvas);

    // LABEL: Error message (Chart.js could not be loaded)
    box.lblError = Label({
        left: 0,
        top: 0,
        text: "",
        width: "100%",
        textAlign: "center",
        fontSize: 13,
        textColor: "#E34948",
        visible: 0,
    });
    box.lblError.elem.style.top = "calc(50% - 10px)";

    // *** OBJECT INIT CODE:

    box.data = createData();
    applyBoxStyle();

    box.chartArea.on("click", function (self, event) {
        const item = getItemAtEvent(event);
        if (item) box.onClick(box, item, event);
    });

    // Pointer cursor over items, only if onClick is used.
    if (box.onClick !== ChartBoxDefaults.onClick) {
        box.chartArea.on("mousemove", function (self, event) {
            box.canvas.style.cursor = (getItemAtEvent(event)) ? "pointer" : "default";
        });
    }

    if (box.theme == "auto" && window.matchMedia) {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", onSystemThemeChange);
    }

    ChartBox.load(function (isLoaded) {
        if (!box) return;
        if (isLoaded) {
            createChart();
        } else {
            const message = "Chart.js could not be loaded.";
            box.lblError.text = message;
            box.lblError.visible = 1;
            box.onError(box, message);
        }
    });

    return endObject(box);

};

// *** STATIC VARIABLES:

// Chart.js version in the chart-box folder
ChartBox.CHART_JS_VERSION = "4.5.1";

// Chart.js file. Used only if window.Chart is not there.
// WHY: A relative path works from the page folder, not from this file. Samples and templates are in different folders.
// So the path is found from the address of this script. (document.currentScript is only ready while this file runs.)
// NOTE: If this code is copied into another file (Ex: components.js), the chart-box folder must be next to that file.
ChartBox.libraryUrl = (function () {
    const file = "chart-box/chart-" + ChartBox.CHART_JS_VERSION + ".umd.min.js";
    const script = document.currentScript;
    return (script && script.src) ? new URL(file, script.src).href : file;
})();

// Theme colors. Categorical colors are in a fixed order, tested for color blindness. (First 3 are the safest.)
ChartBox.THEMES = {
    light: {
        backgroundColor: "#FCFCFB",
        borderColor: "rgba(11, 11, 11, 0.10)",
        titleColor: "#0B0B0B",
        textColor: "#52514E",
        mutedTextColor: "#898781",
        gridColor: "#E1E0D9",
        axisColor: "#C3C2B7",
        tooltipColor: "#0B0B0B",
        tooltipTextColor: "#FFFFFF",
        fontFamily: "opensans, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 12,
        colors: ["#2A78D6", "#EB6834", "#1BAF7A", "#EDA100", "#E87BA4", "#008300", "#4A3AA7", "#E34948"],
    },
    dark: {
        backgroundColor: "#1A1A19",
        borderColor: "rgba(255, 255, 255, 0.10)",
        titleColor: "#FFFFFF",
        textColor: "#C3C2B7",
        mutedTextColor: "#898781",
        gridColor: "#2C2C2A",
        axisColor: "#383835",
        tooltipColor: "#2C2C2A",
        tooltipTextColor: "#FFFFFF",
        fontFamily: "opensans, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 12,
        colors: ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300", "#9085E9", "#E66767"],
    },
};

// *** STATIC FUNCTIONS:

ChartBox._loadState = ""; // "", "loading", "loaded"
ChartBox._loadCallbacks = [];

// Loads Chart.js one time. callback(isLoaded)
ChartBox.load = function (callback) {

    if (typeof window.Chart === "function") {
        ChartBox._loadState = "loaded";
        if (callback) callback(true);
        return;
    }

    if (callback) ChartBox._loadCallbacks.push(callback);
    if (ChartBox._loadState == "loading") return;
    ChartBox._loadState = "loading";

    const runCallbacks = function (isLoaded) {
        const list = ChartBox._loadCallbacks;
        ChartBox._loadCallbacks = [];
        list.forEach(function (func) { func(isLoaded); });
    };

    const script = document.createElement("script");
    script.src = ChartBox.libraryUrl;
    script.async = true;
    script.onload = function () {
        ChartBox._loadState = (typeof window.Chart === "function") ? "loaded" : "";
        runCallbacks(ChartBox._loadState == "loaded");
    };
    script.onerror = function () {
        ChartBox._loadState = ""; // WHY: The next ChartBox can try again.
        script.remove();
        console.error("ChartBox: Chart.js could not be loaded from " + ChartBox.libraryUrl);
        runCallbacks(false);
    };
    document.head.appendChild(script);

};

// Deep merge without a depth limit. Arrays, functions and class objects (CanvasGradient) are copied by reference.
ChartBox.merge = function (target, ...sources) {

    const isPlainObject = function (value) {
        if (!value || typeof value !== "object") return false;
        const proto = Object.getPrototypeOf(value);
        return proto === Object.prototype || proto === null;
    };

    sources.forEach(function (source) {
        if (!isPlainObject(source)) return;
        for (const key in source) {
            const value = source[key];
            if (isPlainObject(value)) {
                if (!isPlainObject(target[key])) target[key] = {};
                ChartBox.merge(target[key], value);
            } else if (value !== undefined) {
                target[key] = value;
            }
        }
    });

    return target;

};

// "#2A78D6", 0.2 -> "rgba(42, 120, 214, 0.2)"
ChartBox.alpha = function (color, alpha) {

    const hex = String(color).trim();

    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) {
        let value = hex.slice(1);
        if (value.length == 3) value = value.split("").map(function (c) { return c + c; }).join("");
        const r = parseInt(value.slice(0, 2), 16);
        const g = parseInt(value.slice(2, 4), 16);
        const b = parseInt(value.slice(4, 6), 16);
        return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
    }

    const match = hex.match(/^rgba?\(([^)]+)\)$/i);
    if (match) {
        const parts = match[1].split(",").slice(0, 3).map(function (p) { return p.trim(); });
        return "rgba(" + parts.join(", ") + ", " + alpha + ")";
    }

    return color; // Unknown format (Ex: "red")

};

// Vertical gradient for backgroundColor. Size follows the chart area.
ChartBox.gradient = function (topColor, bottomColor, horizontal = 0) {
    return function (context) {
        const chart = context.chart;
        const area = chart.chartArea;
        if (!area) return topColor; // WHY: The chart area is not ready in the first layout.
        const g = (horizontal == 1)
            ? chart.ctx.createLinearGradient(area.left, 0, area.right, 0)
            : chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
        g.addColorStop(0, topColor);
        g.addColorStop(1, bottomColor);
        return g;
    };
};
// USAGE: datasets: [{ data: [...], fill: true, backgroundColor: ChartBox.gradient("rgba(56,189,248,0.4)", "rgba(56,189,248,0)") }]
