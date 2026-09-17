/* Bismillah */

/*

SparkLineBox - v26.09

UI COMPONENT TEMPLATE
- An alternative to MiniGraphBox: a small KPI box with a title, a value text, an icon and a line graph (sparkline)
  instead of bars. Same API: addValue, setValues, setTitle, setValueText, setIcon...
- The line is drawn with SVG (one path for the line, one for the area under it). Objects are created one time,
  only the path data changes. (Fast for live data)
- Trend badge: "▲ 12%" or "▼ 3%", the last value compared with the first visible value. (showTrend, or your own trendText)
- Last value dot, optional min / max dots, and marked values: addValue(95, "red") draws a dot in that color.
- Mouse over: a tooltip shows the value of the nearest point. (hover: 1)
- maxPoints: How many values are kept. New values are added to the right, the first value is removed when it is full.
- minValue / maxValue: 0 or null means auto (the smallest / biggest visible value). minValue: 0 keeps the base line at zero.
- curve: "smooth" or "linear".

VALUE: A number, or { value, color }

USAGE:
const graph = SparkLineBox({ title: "Sold Items", valueText: "1.3K", iconFile: "carrot.png", lineColor: "tomato" });
graph.addValue(24);
graph.addValue(95, "red"); // Marked value: a red dot on the line
graph.setValues([10, 20, 15]);
SparkLineBox({ title: "CPU", maxValue: 100, minValue: 0, valueFormat: (value) => value + "%" });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SparkLineBoxDefaults = {
    key: "0",
    width: 200,
    height: 80,
    title: "Sold Items",
    valueText: "1.3K",
    iconFile: "", // "": No icon
    lineColor: "tomato",
    values: [], // [10, 20, { value: 15, color: "orange" }]
    maxPoints: 30, // How many values are shown
    minValue: null, // null: Auto. 0: The base line is always zero.
    maxValue: 0, // 0: Auto (the biggest visible value is the top of the graph)
    curve: "smooth", // "smooth", "linear"
    showArea: 1, // 1: Light fill under the line
    showLastDot: 1, // 1: A dot on the last value
    showMinMax: 0, // 1: Dots on the smallest and the biggest value
    showTrend: 1, // 1: Trend badge (last value compared with the first visible value)
    trendText: "", // Your own badge text. "": Calculated. (Ex: "▲ 12%")
    hover: 1, // 1: Tooltip with the value on mouse over
    animated: 1, // 1: The line moves with a short motion when a value is added.
    valueFormat: function (value) { return String(value); }, // Tooltip text
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
        trend: {
            fontSize: 11,
            upColor: "#2E9E5B",
            downColor: "#D64545",
            flatColor: Black(0.45),
            round: 4,
            padding: [5, 1],
            backgroundOpacity: 0.12,
        },
        graph: {
            height: 30, // Height of the graph area at the bottom
            padding: 4, // Left and right space
            lineWidth: 2,
            areaOpacity: 0.15,
            dotRadius: 3,
            minMaxDotRadius: 2.5,
            minMaxColor: Black(0.45),
            motion: 0.2, // Seconds. 0: No animation
        },
        tooltip: {
            color: "#373836",
            textColor: White(1),
            fontSize: 11,
            round: 4,
            padding: [6, 2],
            lineColor: Black(0.25),
        },
    }
};

const SparkLineBox = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SparkLineBoxDefaults);

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
    const SVG_NS = "http://www.w3.org/2000/svg";
    let svg, areaPath, linePath, lastDot, minDot, maxDot, hoverLine, hoverDot;
    let markDots = []; // Dots of the marked values (with a color)
    let points = []; // [{ x, y, item }] of the last draw
    let resizeTimer = null;
    let graphWidth = 0;
    let hoverIndex = -1;

    // *** PUBLIC VARIABLES:
    // [var] Visible values, from left to right: [{ value, color }]
    box.values = [];

    // *** PRIVATE FUNCTIONS:

    const normalizeValue = function (item) {
        if (item !== null && typeof item == "object") {
            return { value: num(item.value) || 0, color: item.color || "" };
        }
        return { value: num(item) || 0, color: "" };
    };

    // Keep only the last values that fit in the graph.
    const trimValues = function () {
        const max = Math.max(2, num(box.maxPoints) || 2);
        if (box.values.length > max) {
            box.values = box.values.slice(box.values.length - max);
        }
    };

    // { min, max } of the graph scale
    const getRange = function () {
        let min = Infinity;
        let max = -Infinity;
        box.values.forEach(function (item) {
            if (item.value < min) min = item.value;
            if (item.value > max) max = item.value;
        });
        if (box.values.length == 0) { min = 0; max = 0; }
        if (box.minValue !== null && box.minValue !== undefined && box.minValue !== "") min = Math.min(num(box.minValue) || 0, min);
        if (box.maxValue > 0) max = Math.max(box.maxValue, min);
        return { min: min, max: max };
    };

    const createSvgElement = function (name, attributes) {
        const el = document.createElementNS(SVG_NS, name);
        Object.keys(attributes).forEach(function (key) { el.setAttribute(key, attributes[key]); });
        return el;
    };

    // Path data of the line: "M x y C ..." (smooth) or "M x y L x y ..." (linear)
    const getLinePathData = function (list) {

        if (list.length == 0) return "";
        if (list.length == 1) return "M " + list[0].x + " " + list[0].y;

        let d = "M " + list[0].x + " " + list[0].y;

        if (box.curve === "linear") {
            for (let i = 1; i < list.length; i++) d += " L " + list[i].x + " " + list[i].y;
            return d;
        }

        // Smooth: Catmull-Rom to cubic bezier
        for (let i = 0; i < list.length - 1; i++) {
            const p0 = list[Math.max(i - 1, 0)];
            const p1 = list[i];
            const p2 = list[i + 1];
            const p3 = list[Math.min(i + 2, list.length - 1)];
            const c1x = p1.x + (p2.x - p0.x) / 6;
            const c1y = p1.y + (p2.y - p0.y) / 6;
            const c2x = p2.x - (p3.x - p1.x) / 6;
            const c2y = p2.y - (p3.y - p1.y) / 6;
            d += " C " + r1(c1x) + " " + r1(c1y) + " " + r1(c2x) + " " + r1(c2y) + " " + p2.x + " " + p2.y;
        }
        return d;

    };

    const r1 = function (value) {
        return Math.round(value * 10) / 10;
    };

    // WHY: The "d" transition only works on the CSS property (Chrome). The attribute is set for the other browsers.
    const setPathData = function (path, data) {
        path.setAttribute("d", data);
        if (SparkLineBox.supportsCssPath) path.style.d = (data) ? 'path("' + data + '")' : "";
    };

    const setMotion = function (enabled) {
        const seconds = (enabled && box.animated == 1) ? _s.graph.motion : 0;
        const motion = (seconds > 0) ? "d " + seconds + "s" : "none";
        const dotMotion = (seconds > 0) ? "cx " + seconds + "s, cy " + seconds + "s" : "none";
        linePath.style.transition = motion;
        areaPath.style.transition = motion;
        lastDot.style.transition = dotMotion; // Only the last dot moves. The min / max and marked dots belong to old points, they jump.
    };

    // Path data of the line and the area for a point list
    const getPathDataSet = function (list) {
        const lineData = getLinePathData(list);
        let areaData = "";
        if (box.showArea == 1 && list.length > 1) {
            const first = list[0];
            const last = list[list.length - 1];
            areaData = lineData + " L " + last.x + " " + _s.graph.height + " L " + first.x + " " + _s.graph.height + " Z";
        }
        return { line: lineData, area: areaData };
    };

    // Draw the line for the current values.
    // animated: 1 -> Only the new (last) point moves: it starts at the previous point and moves to its place.
    //          0 -> The line jumps to the new shape. (setValues, resize)
    // WHY: When the graph is full, every point gets its right neighbour's value. If the whole path is animated, the
    //      old points move up and down like a wave. The old points must jump, only the new point is animated.
    const draw = function (animated = 1) {

        if (!box || !svg) return;

        const height = _s.graph.height;
        const padding = _s.graph.padding;
        const lineWidth = _s.graph.lineWidth;
        const innerWidth = Math.max(0, graphWidth - padding * 2);
        const top = lineWidth + _s.graph.dotRadius; // Space for the line width and the dots
        const bottom = height - lineWidth - _s.graph.dotRadius;
        const count = box.values.length;
        const range = getRange();
        const span = range.max - range.min;

        // WHY: The x positions come from maxPoints, not from the value count. So the line grows from the left and does not stretch.
        const slots = Math.max(2, num(box.maxPoints) || 2);
        const step = (slots > 1) ? innerWidth / (slots - 1) : 0;

        points = box.values.map(function (item, index) {
            const x = r1(padding + index * step);
            const y = (span > 0) ? r1(bottom - (item.value - range.min) / span * (bottom - top)) : r1((top + bottom) / 2);
            return { x: x, y: y, item: item };
        });

        const last = points[points.length - 1];
        const canAnimate = (animated && box.animated == 1 && _s.graph.motion > 0 && points.length > 1);

        if (canAnimate) {
            // START SHAPE: The old points at their new places (no motion) and the new point on the previous point.
            // Same number of segments as the final shape, so the "d" transition moves only the last segment.
            const previous = points[points.length - 2];
            const startPoints = points.slice(0, -1).concat([{ x: previous.x, y: previous.y, item: last.item }]);
            const startData = getPathDataSet(startPoints);
            setMotion(0);
            setPathData(linePath, startData.line);
            if (startData.area) setPathData(areaPath, startData.area);
            lastDot.setAttribute("cx", previous.x);
            lastDot.setAttribute("cy", previous.y);
            void svg.getBoundingClientRect(); // WHY: Apply the start shape now, before the motion is turned on.
            setMotion(1);
        } else {
            setMotion(0);
        }

        // FINAL SHAPE:
        const data = getPathDataSet(points);
        setPathData(linePath, data.line);

        if (data.area) {
            setPathData(areaPath, data.area);
            areaPath.style.display = "";
        } else {
            areaPath.style.display = "none";
        }

        // Last dot
        if (box.showLastDot == 1 && last) {
            lastDot.setAttribute("cx", last.x);
            lastDot.setAttribute("cy", last.y);
            lastDot.style.display = "";
        } else {
            lastDot.style.display = "none";
        }

        // Min / max dots
        if (box.showMinMax == 1 && points.length > 1 && span > 0) {
            let minPoint = points[0];
            let maxPoint = points[0];
            points.forEach(function (p) {
                if (p.item.value < minPoint.item.value) minPoint = p;
                if (p.item.value > maxPoint.item.value) maxPoint = p;
            });
            minDot.setAttribute("cx", minPoint.x); minDot.setAttribute("cy", minPoint.y); minDot.style.display = "";
            maxDot.setAttribute("cx", maxPoint.x); maxDot.setAttribute("cy", maxPoint.y); maxDot.style.display = "";
        } else {
            minDot.style.display = "none";
            maxDot.style.display = "none";
        }

        // Marked values (own color)
        const marked = points.filter(function (p) { return p.item.color; });
        while (markDots.length < marked.length) {
            const dot = createSvgElement("circle", { r: _s.graph.dotRadius, stroke: "white", "stroke-width": 1 });
            svg.appendChild(dot);
            markDots.push(dot);
        }
        markDots.forEach(function (dot, index) {
            const p = marked[index];
            if (!p) { dot.style.display = "none"; return; }
            dot.setAttribute("cx", p.x);
            dot.setAttribute("cy", p.y);
            dot.setAttribute("fill", p.item.color);
            dot.style.display = "";
        });

        updateTrend();
        if (hoverIndex >= 0) showHover(hoverIndex);

    };

    // Trend badge: last value compared with the first visible value
    const updateTrend = function () {

        if (box.trendText) {
            box.lblTrend.text = box.trendText;
            paintTrend(0);
            box.lblTrend.visible = 1;
            return;
        }

        if (box.showTrend != 1 || box.values.length < 2) {
            box.lblTrend.visible = 0;
            return;
        }

        const first = box.values[0].value;
        const last = box.values[box.values.length - 1].value;
        const diff = last - first;
        let text;

        if (first == 0) {
            text = (diff > 0 ? "+" : "") + r1(diff);
        } else {
            const percent = Math.round(Math.abs(diff) / Math.abs(first) * 100);
            text = ((diff > 0) ? "▲ " : (diff < 0) ? "▼ " : "") + percent + "%";
        }

        box.lblTrend.text = text;
        paintTrend((diff > 0) ? 1 : (diff < 0) ? -1 : 0);
        box.lblTrend.visible = 1;

    };

    const paintTrend = function (direction) {
        const color = (direction > 0) ? _s.trend.upColor : (direction < 0) ? _s.trend.downColor : _s.trend.flatColor;
        box.lblTrend.textColor = color;
        box.lblTrend.elem.style.backgroundColor = SparkLineBox.withAlpha(color, _s.trend.backgroundOpacity);
    };

    // *** HOVER (tooltip):

    const showHover = function (index) {

        const p = points[index];
        if (!p) return hideHover();
        hoverIndex = index;

        hoverLine.setAttribute("x1", p.x); hoverLine.setAttribute("x2", p.x);
        hoverLine.setAttribute("y1", 0); hoverLine.setAttribute("y2", _s.graph.height);
        hoverLine.style.display = "";
        hoverDot.setAttribute("cx", p.x); hoverDot.setAttribute("cy", p.y);
        hoverDot.setAttribute("fill", p.item.color || box.lineColor);
        hoverDot.style.display = "";

        box.lblTooltip.text = box.valueFormat(p.item.value, p.item);
        box.lblTooltip.visible = 1;
        // Above the point, inside the box
        const tipWidth = box.lblTooltip.elem.offsetWidth;
        const graphTop = box.elem.clientHeight - _s.graph.height;
        let left = p.x - tipWidth / 2;
        left = Math.max(2, Math.min(left, box.elem.clientWidth - tipWidth - 2));
        box.lblTooltip.left = Math.round(left);
        box.lblTooltip.top = Math.max(2, Math.round(graphTop + p.y - box.lblTooltip.elem.offsetHeight - 8));

    };

    const hideHover = function () {
        hoverIndex = -1;
        hoverLine.style.display = "none";
        hoverDot.style.display = "none";
        box.lblTooltip.visible = 0;
    };

    const onMouseMove = function (self, event) {
        if (box.hover != 1 || points.length == 0) return;
        const rect = box.elem.getBoundingClientRect();
        const x = withPageZoom(event.clientX - rect.left) - _s.graph.padding;
        const slots = Math.max(2, num(box.maxPoints) || 2);
        const step = Math.max(1, (graphWidth - _s.graph.padding * 2) / (slots - 1));
        const index = Math.max(0, Math.min(points.length - 1, Math.round(x / step)));
        if (index !== hoverIndex) showHover(index);
    };

    // The box size can change: width "100%"
    const refreshSize = function () {
        if (!box) return;
        graphWidth = box.elem.clientWidth;
        svg.setAttribute("viewBox", "0 0 " + Math.max(1, graphWidth) + " " + _s.graph.height);
        draw(0);
    };

    // *** PUBLIC FUNCTIONS:

    // Add a value to the right. If the graph is full, the first value is removed.
    box.addValue = function (value, color) {
        const item = normalizeValue(value);
        if (color) item.color = color;
        box.values.push(item);
        trimValues();
        draw(1);
    };
    // USAGE: graph.addValue(24) or graph.addValue(95, "red") (marked value: a red dot)

    box.setValues = function (values) {
        box.values = (values || []).map(normalizeValue);
        trimValues();
        hideHover();
        draw(0);
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
        hideHover();
        draw(0);
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

    box.setLineColor = function (color) {
        box.lineColor = color;
        linePath.setAttribute("stroke", color);
        areaPath.setAttribute("fill", color);
        lastDot.setAttribute("fill", color);
        hoverDot.setAttribute("fill", color);
    };

    // 0: Auto
    box.setMaxValue = function (maxValue) {
        box.maxValue = num(maxValue) || 0;
        draw(0);
    };

    // null: Auto
    box.setMinValue = function (minValue) {
        box.minValue = (minValue === null || minValue === undefined || minValue === "") ? null : num(minValue) || 0;
        draw(0);
    };

    // "": Calculated from the values
    box.setTrendText = function (text) {
        box.trendText = text || "";
        updateTrend();
    };

    box.setMaxPoints = function (maxPoints) {
        box.maxPoints = Math.max(2, num(maxPoints) || 2);
        trimValues();
        draw(0);
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

    // BOX: Graph (at the bottom)
    box.graphBox = Box({
        left: 0,
        top: 0,
        width: "100%",
        height: _s.graph.height,
        color: "transparent",
    });
    box.graphBox.elem.style.top = "auto";
    box.graphBox.elem.style.bottom = "0px";
    box.graphBox.elem.style.lineHeight = "0";

    // SVG: line, area, dots
    svg = createSvgElement("svg", { width: "100%", height: _s.graph.height, viewBox: "0 0 200 " + _s.graph.height, preserveAspectRatio: "none" });
    svg.style.display = "block";
    svg.style.overflow = "visible";
    svg.setAttribute("aria-hidden", "true");

    areaPath = createSvgElement("path", { fill: box.lineColor, "fill-opacity": _s.graph.areaOpacity, stroke: "none" });
    linePath = createSvgElement("path", { fill: "none", stroke: box.lineColor, "stroke-width": _s.graph.lineWidth, "stroke-linecap": "round", "stroke-linejoin": "round" });
    linePath.setAttribute("vector-effect", "non-scaling-stroke");
    hoverLine = createSvgElement("line", { stroke: _s.tooltip.lineColor, "stroke-width": 1, "stroke-dasharray": "2 2" });
    hoverLine.style.display = "none";
    minDot = createSvgElement("circle", { r: _s.graph.minMaxDotRadius, fill: _s.graph.minMaxColor, stroke: "white", "stroke-width": 1 });
    maxDot = createSvgElement("circle", { r: _s.graph.minMaxDotRadius, fill: _s.graph.minMaxColor, stroke: "white", "stroke-width": 1 });
    lastDot = createSvgElement("circle", { r: _s.graph.dotRadius, fill: box.lineColor, stroke: "white", "stroke-width": 1.5 });
    hoverDot = createSvgElement("circle", { r: _s.graph.dotRadius + 1, fill: box.lineColor, stroke: "white", "stroke-width": 1.5 });
    hoverDot.style.display = "none";

    [areaPath, linePath, hoverLine, minDot, maxDot, lastDot, hoverDot].forEach(function (el) { svg.appendChild(el); });
    box.graphBox.elem.appendChild(svg);

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

        // GROUP: Value text and trend badge
        HGroup({ width: "auto", height: "auto", align: "left center", gap: 6 });

            box.lblValueText = Label({
                text: box.valueText,
                fontSize: _s.valueText.fontSize,
                textColor: _s.valueText.textColor,
            });
            box.lblValueText.elem.style.whiteSpace = "nowrap";

            box.lblTrend = Label({
                text: "",
                fontSize: _s.trend.fontSize,
                textColor: _s.trend.flatColor,
                round: _s.trend.round,
                padding: _s.trend.padding,
            });
            box.lblTrend.elem.style.whiteSpace = "nowrap";
            box.lblTrend.elem.style.lineHeight = "1.5";
            box.lblTrend.elem.style.marginTop = "4px"; // WHY: Lines up with the middle of the big value text.

        endGroup();

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

    // LABEL: Tooltip (over the graph)
    box.lblTooltip = Label({
        text: "",
        fontSize: _s.tooltip.fontSize,
        textColor: _s.tooltip.textColor,
        color: _s.tooltip.color,
        round: _s.tooltip.round,
        padding: _s.tooltip.padding,
    });
    box.lblTooltip.elem.style.whiteSpace = "nowrap";
    box.lblTooltip.elem.style.lineHeight = "1.4";
    box.lblTooltip.elem.style.pointerEvents = "none";
    box.lblTooltip.visible = 0;

    // *** OBJECT INIT CODE:

    box.on("click", function () { box.onClick(box); });
    box.on("mousemove", onMouseMove);
    box.on("mouseleave", function () { hideHover(); });
    box.elem.style.cursor = "default";
    box.clickable = 1; // WHY: mousemove needs pointer events.

    box.setIcon(box.iconFile);

    box.values = (params.values || []).map(normalizeValue); // WHY: Copy. The default [] must not be shared between components.
    trimValues();
    refreshSize();

    box.onResize(function () {
        resizeTimer = waitAndRun(resizeTimer, refreshSize, 30);
    });

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// "#2E9E5B" or "rgb(…)" with an alpha. (For the trend badge background)
SparkLineBox._alphaCache = {};
SparkLineBox.withAlpha = function (color, alpha) {
    const key = color + "|" + alpha;
    if (SparkLineBox._alphaCache[key]) return SparkLineBox._alphaCache[key];
    const el = document.createElement("div");
    el.style.color = color;
    document.body.appendChild(el);
    const rgb = getComputedStyle(el).color; // "rgb(r, g, b)" or "rgba(r, g, b, a)"
    el.remove();
    const parts = rgb.match(/[\d.]+/g) || [0, 0, 0];
    SparkLineBox._alphaCache[key] = "rgba(" + parts[0] + ", " + parts[1] + ", " + parts[2] + ", " + alpha + ")";
    return SparkLineBox._alphaCache[key];
};

// Chrome and Edge can animate the path with the CSS "d" property.
SparkLineBox.supportsCssPath = (typeof CSS !== "undefined" && CSS.supports && CSS.supports("d", 'path("M 0 0 L 1 1")'));
