/* Bismillah */

/*

Gauge - v26.09

UI COMPONENT
- A value drawn on an arc: a full ring (sweepAngle: 360) or a half arc (sweepAngle: 180).
  Both are the same drawing, only the swept angle is different.
- Parts: the track behind, the bar of the value, an optional marker line (a target, a reserve,
  a limit), the value in the middle, a line under it and a title under the whole gauge.
- Everything is one SVG, so it stays sharp at every size and the value moves with a CSS
  transition. No image file and no other library is needed.
- Angles: 0 is the top (12 o'clock) and they grow clockwise. A half arc that opens upwards is
  startAngle: -90, sweepAngle: 180.
- The drawing area is measured from the arc itself, so a half arc does not leave an empty half.

USAGE:
const battery = Gauge({ width: 180, height: 180, value: 46, subText: "Charging", styleName: "dark" });
battery.setValue(72);
battery.setBarColor("#F2B24C");

const nozzle = Gauge({
    width: 200, height: 130,
    startAngle: -90, sweepAngle: 180,      // half arc
    maxValue: 300, value: 215,
    valueSuffix: "°", titleText: "Nozzle",
    markerValue: 220,                      // the target line
});
nozzle.setMarkerValue(240);

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const GaugeDefaults = {
    key: "0",
    width: 180,
    height: 180,
    value: 0,
    minValue: 0,
    maxValue: 100,
    startAngle: 0, // 0: the top (12 o'clock). They grow clockwise.
    sweepAngle: 360, // 360: a full ring. 180: a half arc.
    radius: 74,
    markerValue: null, // null: no marker line. (A target, a reserve, a limit...)
    valueText: "", // "": the value itself, with decimals and valueSuffix.
    valueSuffix: "%",
    decimals: 0,
    subText: "", // The small line under the value.
    titleText: "", // Under the whole gauge.
    duration: 600, // Length of the animation, in milliseconds.
    ariaLabel: "Gauge",
    onValueChange: function (self) { },
    styleName: "classic", // "classic", "dark", "modern" or a name added to Gauge.styles
    style: { // Classic style package (default)
        track: {
            color: Black(0.08),
            width: 12,
        },
        bar: {
            color: "cadetblue",
            width: 12,
            roundCap: 1,
        },
        marker: {
            color: Black(0.65),
            width: 3,
            length: 18, // It goes this long across the arc.
        },
        value: {
            fontSize: 38,
            textColor: Black(0.85),
            bold: 1,
            offsetY: null, // null: by itself. (Middle of a ring, over the chord of an arc.)
        },
        sub: {
            fontSize: 13,
            textColor: Black(0.5),
            offsetY: null, // null: right under the value.
        },
        title: {
            fontSize: 13,
            textColor: "", // "": the color of the bar.
            gap: 12, // Space between the gauge and the title.
        },
    },
};

const Gauge = function (params = {}) {

    // Merge style package: params.style > Gauge.styles[styleName] > GaugeDefaults.style (classic)
    basic.applyStylePackage(params, Gauge.styles, GaugeDefaults);

    // Merge params:
    mergeIntoIfMissing(params, GaugeDefaults);
    params.color = params.color || "transparent";

    // BOX: Component container
    let box = startObject(params);

    const _s = box.style;

    // *** PRIVATE VARIABLES:

    let svg = null;             // The <svg> element
    let elements = {};          // bar, marker, value, sub, title
    const FULL_RING_SWEEP = 359.9; // WHY: A sweep this big is drawn as a full ring (rounding of the angles).
    const VIEW_PADDING = 2; // Extra room around the arc in the viewBox.
    const TEXT_BOTTOM_ROOM = 4; // Room under the baseline of a text.
    const SUB_GAP = 8; // Space between the value and the line under it.
    const RING_VALUE_SHIFT = 0.35; // x the font size: down, to the middle of a ring.
    const ARC_VALUE_SHIFT = 0.25; // x the font size: up, over the chord of an arc.
    const TITLE_BOTTOM_ROOM = 0.4; // x the font size of the title.
    const MARKER_DURATION_RATIO = 0.7; // x duration: the marker turns a bit faster than the bar.
    const COLOR_DURATION_RATIO = 0.6; // x duration: the color change of the bar.

    // *** PRIVATE FUNCTIONS:

    // A point on the arc. 0 is the top and the angles grow clockwise.
    const pointOf = function (cx, cy, r, angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    const isFullRing = function (sweep) {
        return Math.abs(sweep) >= FULL_RING_SWEEP;
    };

    // The path of the arc. A full circle can not be drawn with one A command, it takes two.
    const arcPath = function (cx, cy, r, start, sweep) {

        if (isFullRing(sweep)) {
            const a = pointOf(cx, cy, r, start);
            const b = pointOf(cx, cy, r, start + 180);
            return "M" + a.x.toFixed(2) + " " + a.y.toFixed(2) +
                " A" + r + " " + r + " 0 1 1 " + b.x.toFixed(2) + " " + b.y.toFixed(2) +
                " A" + r + " " + r + " 0 1 1 " + a.x.toFixed(2) + " " + a.y.toFixed(2);
        }

        const a = pointOf(cx, cy, r, start);
        const b = pointOf(cx, cy, r, start + sweep);
        const largeArc = (Math.abs(sweep) > 180) ? 1 : 0;
        const sweepFlag = (sweep > 0) ? 1 : 0;

        return "M" + a.x.toFixed(2) + " " + a.y.toFixed(2) +
            " A" + r + " " + r + " 0 " + largeArc + " " + sweepFlag + " " + b.x.toFixed(2) + " " + b.y.toFixed(2);

    };

    // What the arc really covers. WHY: A half arc in a square box leaves an empty half.
    const arcBounds = function (cx, cy, r, start, sweep) {

        const from = Math.min(start, start + sweep);
        const to = Math.max(start, start + sweep);
        const points = [pointOf(cx, cy, r, start), pointOf(cx, cy, r, start + sweep)];

        // The top, right, bottom and left of the circle, when they are inside the sweep.
        for (let angle = -720; angle <= 720; angle += 90) {
            if (angle >= from && angle <= to) points.push(pointOf(cx, cy, r, angle));
        }

        return {
            minX: Math.min.apply(null, points.map(function (p) { return p.x; })),
            maxX: Math.max.apply(null, points.map(function (p) { return p.x; })),
            minY: Math.min.apply(null, points.map(function (p) { return p.y; })),
            maxY: Math.max.apply(null, points.map(function (p) { return p.y; })),
        };

    };

    // 0..1: where the value is between minValue and maxValue.
    const ratioOf = function (value) {
        const span = box.maxValue - box.minValue;
        if (!span) return 0;
        return Math.max(0, Math.min(1, (value - box.minValue) / span));
    };

    const angleOf = function (value) {
        return box.startAngle + box.sweepAngle * ratioOf(value);
    };

    const textOfValue = function () {
        if (box.valueText !== "") return box.valueText;
        return Number(box.value).toFixed(box.decimals) + box.valueSuffix;
    };

    // The y of the value text, from the middle of the arc.
    const valueOffsetOf = function () {
        if (_s.value.offsetY !== null) return _s.value.offsetY;
        if (isFullRing(box.sweepAngle)) return _s.value.fontSize * RING_VALUE_SHIFT;
        return -_s.value.fontSize * ARC_VALUE_SHIFT;
    };

    const subOffsetOf = function (valueOffset) {
        if (_s.sub.offsetY !== null) return _s.sub.offsetY;
        return valueOffset + _s.sub.fontSize + SUB_GAP;
    };

    // The viewBox and the places of the texts.
    const measureView = function (cx, cy) {

        const r = box.radius;
        const strokeMax = Math.max(_s.track.width, _s.bar.width);
        const markerRoom = (box.markerValue === null) ? 0 : _s.marker.length / 2;
        const pad = strokeMax / 2 + markerRoom + VIEW_PADDING;

        const bounds = arcBounds(cx, cy, r, box.startAngle, box.sweepAngle);

        const view = {
            minX: bounds.minX - pad,
            maxX: bounds.maxX + pad,
            minY: bounds.minY - pad,
            maxY: bounds.maxY + pad,
            valueOffset: valueOffsetOf(),
            subOffset: 0,
            titleY: 0,
        };
        view.subOffset = subOffsetOf(view.valueOffset);

        // The texts live around the middle of the arc, they can be lower than the arc itself.
        if (box.subText) view.maxY = Math.max(view.maxY, cy + view.subOffset + TEXT_BOTTOM_ROOM);
        if (box.valueText !== "" || box.value !== null) view.maxY = Math.max(view.maxY, cy + view.valueOffset + TEXT_BOTTOM_ROOM);

        if (box.titleText) {
            view.titleY = view.maxY + _s.title.gap;
            view.maxY = view.titleY + _s.title.fontSize * TITLE_BOTTOM_ROOM;
        }

        return view;

    };

    // The marker is drawn at the top and turned to its own angle.
    const markerHtmlOf = function (cx, cy) {

        if (box.markerValue === null) return "";

        const r = box.radius;
        return "<line class='gauge-marker' x1='" + cx + "' y1='" + (cy - r - _s.marker.length / 2) + "' x2='" + cx + "' y2='" + (cy - r + _s.marker.length / 2) + "'" +
            " stroke='" + _s.marker.color + "' stroke-width='" + _s.marker.width + "' stroke-linecap='round'" +
            " style='transition: transform " + (box.duration * MARKER_DURATION_RATIO) + "ms'/>";

    };

    const titleHtmlOf = function (cx, titleY) {

        if (!box.titleText) return "";

        const titleColor = _s.title.textColor || _s.bar.color;
        return "<text class='gauge-title' x='" + cx + "' y='" + titleY + "' text-anchor='middle'" +
            " style='fill:" + titleColor + "; font-size:" + _s.title.fontSize + "px'></text>";

    };

    // Writes the whole SVG again. (Only when a size or a style changed.)
    const build = function () {

        const cx = 0, cy = 0;
        const view = measureView(cx, cy);

        const path = arcPath(cx, cy, box.radius, box.startAngle, box.sweepAngle);
        const cap = (_s.bar.roundCap) ? "round" : "butt";

        box.elem.innerHTML =
            "<svg viewBox='" + view.minX.toFixed(2) + " " + view.minY.toFixed(2) + " " + (view.maxX - view.minX).toFixed(2) + " " + (view.maxY - view.minY).toFixed(2) + "'" +
            " style='display:block; width:100%; height:100%; overflow:visible' role='img' aria-label='" + box.ariaLabel + "'>" +

                "<path d='" + path + "' fill='none' stroke='" + _s.track.color + "' stroke-width='" + _s.track.width + "' stroke-linecap='" + cap + "'/>" +

                "<path class='gauge-bar' d='" + path + "' fill='none' stroke='" + _s.bar.color + "' stroke-width='" + _s.bar.width + "'" +
                " stroke-linecap='" + cap + "' pathLength='100' stroke-dasharray='0 100'" +
                " style='transition: stroke-dasharray " + box.duration + "ms, stroke " + (box.duration * COLOR_DURATION_RATIO) + "ms'/>" +

                markerHtmlOf(cx, cy) +

                "<text class='gauge-value' x='" + cx + "' y='" + (cy + view.valueOffset) + "' text-anchor='middle'" +
                " style='fill:" + _s.value.textColor + "; font-size:" + _s.value.fontSize + "px;" + ((_s.value.bold) ? " font-weight:bold;" : "") + "'></text>" +

                "<text class='gauge-sub' x='" + cx + "' y='" + (cy + view.subOffset) + "' text-anchor='middle'" +
                " style='fill:" + _s.sub.textColor + "; font-size:" + _s.sub.fontSize + "px'></text>" +

                titleHtmlOf(cx, view.titleY) +

            "</svg>";

        svg = box.elem.querySelector("svg");
        elements = {
            bar: svg.querySelector(".gauge-bar"),
            marker: svg.querySelector(".gauge-marker"),
            value: svg.querySelector(".gauge-value"),
            sub: svg.querySelector(".gauge-sub"),
            title: svg.querySelector(".gauge-title"),
        };

        paint();

    };

    // Writes the values into the SVG that is already there.
    const paint = function () {

        if (!elements.bar) return;

        elements.bar.setAttribute("stroke-dasharray", (ratioOf(box.value) * 100).toFixed(2) + " 100");
        elements.value.textContent = textOfValue();
        elements.sub.textContent = box.subText;
        if (elements.title) elements.title.textContent = box.titleText;

        if (elements.marker) {
            const angle = angleOf(box.markerValue);
            elements.marker.setAttribute("transform", "rotate(" + angle.toFixed(2) + " 0 0)");
        }

    };

    // *** PUBLIC FUNCTIONS:

    box.setValue = function (value, silent = 0) {
        box.value = value;
        paint();
        if (!silent) box.onValueChange(box);
    };
    // USAGE: get: gauge.value, set: gauge.setValue(72)

    box.setMarkerValue = function (value) {
        const wasOff = (box.markerValue === null);
        box.markerValue = value;
        const isOff = (value === null);
        if (wasOff !== isOff) {
            build(); // The marker appeared or went away.
            return;
        }
        paint();
    };

    box.setBarColor = function (color) {
        _s.bar.color = color;
        if (elements.bar) elements.bar.setAttribute("stroke", color);
        if (elements.title && !_s.title.textColor) elements.title.style.fill = color;
    };

    box.setValueText = function (text) {
        box.valueText = text;
        paint();
    };

    box.setValueSuffix = function (text) {
        box.valueSuffix = text;
        paint();
    };

    box.setSubText = function (text) {
        const wasEmpty = !box.subText;
        box.subText = text;
        if (wasEmpty !== !text) {
            build(); // The drawing area changes with it.
            return;
        }
        paint();
    };

    box.setTitleText = function (text) {
        const wasEmpty = !box.titleText;
        box.titleText = text;
        if (wasEmpty !== !text) {
            build();
            return;
        }
        paint();
    };

    box.setRange = function (minValue, maxValue) {
        box.minValue = minValue;
        box.maxValue = maxValue;
        paint();
    };

    // Draws the whole gauge again. (After a style was changed by hand.)
    box.refresh = function () {
        build();
    };


    // *** OBJECT VIEW:

    box.position = box.position || "relative";

    // *** OBJECT INIT CODE:

    build();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: Gauge({ styleName: "dark" })
// USAGE: Gauge({ styleName: "dark", style: { track: { color: "tomato" } } }) // Change only some keys.
// USAGE: Gauge({ style: Gauge.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: Gauge.styles.myStyle = { track: { color: "red" } };

Gauge.styles = {

    // On a light card.
    classic: GaugeDefaults.style,

    // On a dark card. The same colors as the "dark" Tabs, Stepper and SidePanel.
    dark: {
        track: { color: "rgba(255, 255, 255, 0.07)", width: 12 },
        bar: { color: "#65A293", width: 12, roundCap: 1 },
        marker: { color: "rgba(255, 255, 255, 0.85)", width: 3, length: 18 },
        value: { fontSize: 38, textColor: "rgba(255, 255, 255, 0.95)", bold: 1, offsetY: null },
        sub: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.5)", offsetY: null },
        title: { fontSize: 13, textColor: "", gap: 12 },
    },

    // Thinner, round, cadetblue. The same colors as the modern Tabs and Stepper.
    modern: {
        track: { color: "#DFECEC", width: 10 },
        bar: { color: "cadetblue", width: 10, roundCap: 1 },
        marker: { color: "#2F5F61", width: 3, length: 16 },
        value: { fontSize: 36, textColor: "#2F5F61", bold: 1, offsetY: null },
        sub: { fontSize: 13, textColor: "#6E9A9B", offsetY: null },
        title: { fontSize: 13, textColor: "", gap: 12 },
    },

};
