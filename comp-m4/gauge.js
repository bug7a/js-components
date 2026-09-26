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
    // WHY: Before the defaults. mergeIntoIfMissing() only fills what is missing, so the classic
    //      style of the defaults would win over the chosen package.
    const _styleName = params.styleName || GaugeDefaults.styleName;
    const _stylePackage = Gauge.styles[_styleName];
    if (!_stylePackage) console.warn("Gauge: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, GaugeDefaults);
    params.color = params.color || "transparent";

    // BOX: Component container
    let box = startObject(params);

    const _s = box.style;

    // *** PRIVATE VARIABLES:

    let svg = null;             // The <svg> element
    let elements = {};          // bar, marker, value, sub, title

    // *** PRIVATE FUNCTIONS:

    // A point on the arc. 0 is the top and the angles grow clockwise.
    const pointOf = function (cx, cy, r, angle) {
        const rad = (angle - 90) * Math.PI / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };

    // The path of the arc. A full circle can not be drawn with one A command, it takes two.
    const arcPath = function (cx, cy, r, start, sweep) {

        const isFull = Math.abs(sweep) >= 359.9;

        if (isFull) {
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

    // Writes the whole SVG again. (Only when a size or a style changed.)
    const build = function () {

        const r = box.radius;
        const strokeMax = Math.max(_s.track.width, _s.bar.width);
        const pad = strokeMax / 2 + ((box.markerValue === null) ? 0 : _s.marker.length / 2) + 2;

        const cx = 0, cy = 0;
        const bounds = arcBounds(cx, cy, r, box.startAngle, box.sweepAngle);

        const minX = bounds.minX - pad;
        const maxX = bounds.maxX + pad;
        const minY = bounds.minY - pad;
        let maxY = bounds.maxY + pad;

        // The texts live around the middle of the arc, they can be lower than the arc itself.
        const valueOffset = (_s.value.offsetY !== null) ? _s.value.offsetY
            : (Math.abs(box.sweepAngle) >= 359.9) ? _s.value.fontSize * 0.35 : -_s.value.fontSize * 0.25;
        const subOffset = (_s.sub.offsetY !== null) ? _s.sub.offsetY : valueOffset + _s.sub.fontSize + 8;

        if (box.subText) maxY = Math.max(maxY, cy + subOffset + 4);
        if (box.valueText !== "" || box.value !== null) maxY = Math.max(maxY, cy + valueOffset + 4);

        let titleY = 0;
        if (box.titleText) {
            titleY = maxY + _s.title.gap;
            maxY = titleY + _s.title.fontSize * 0.4;
        }

        const path = arcPath(cx, cy, r, box.startAngle, box.sweepAngle);
        const cap = (_s.bar.roundCap) ? "round" : "butt";
        const titleColor = _s.title.textColor || _s.bar.color;

        // The marker is drawn at the top and turned to its own angle.
        const markerHtml = (box.markerValue === null) ? "" :
            "<line class='gauge-marker' x1='" + cx + "' y1='" + (cy - r - _s.marker.length / 2) + "' x2='" + cx + "' y2='" + (cy - r + _s.marker.length / 2) + "'" +
            " stroke='" + _s.marker.color + "' stroke-width='" + _s.marker.width + "' stroke-linecap='round'" +
            " style='transition: transform " + (box.duration * 0.7) + "ms'/>";

        box.elem.innerHTML =
            "<svg viewBox='" + minX.toFixed(2) + " " + minY.toFixed(2) + " " + (maxX - minX).toFixed(2) + " " + (maxY - minY).toFixed(2) + "'" +
            " style='display:block; width:100%; height:100%; overflow:visible' role='img' aria-label='" + box.ariaLabel + "'>" +

                "<path d='" + path + "' fill='none' stroke='" + _s.track.color + "' stroke-width='" + _s.track.width + "' stroke-linecap='" + cap + "'/>" +

                "<path class='gauge-bar' d='" + path + "' fill='none' stroke='" + _s.bar.color + "' stroke-width='" + _s.bar.width + "'" +
                " stroke-linecap='" + cap + "' pathLength='100' stroke-dasharray='0 100'" +
                " style='transition: stroke-dasharray " + box.duration + "ms, stroke " + (box.duration * 0.6) + "ms'/>" +

                markerHtml +

                "<text class='gauge-value' x='" + cx + "' y='" + (cy + valueOffset) + "' text-anchor='middle'" +
                " style='fill:" + _s.value.textColor + "; font-size:" + _s.value.fontSize + "px;" + ((_s.value.bold) ? " font-weight:bold;" : "") + "'></text>" +

                "<text class='gauge-sub' x='" + cx + "' y='" + (cy + subOffset) + "' text-anchor='middle'" +
                " style='fill:" + _s.sub.textColor + "; font-size:" + _s.sub.fontSize + "px'></text>" +

                ((box.titleText) ?
                    "<text class='gauge-title' x='" + cx + "' y='" + titleY + "' text-anchor='middle'" +
                    " style='fill:" + titleColor + "; font-size:" + _s.title.fontSize + "px'></text>" : "") +

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
        if (wasOff !== (value === null)) { build(); return; } // The marker appeared or went away.
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
        if (wasEmpty !== !text) { build(); return; } // The drawing area changes with it.
        paint();
    };

    box.setTitleText = function (text) {
        const wasEmpty = !box.titleText;
        box.titleText = text;
        if (wasEmpty !== !text) { build(); return; }
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

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        box.elem.innerHTML = "";
        svg = null;
        elements = {};
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.position = box.position || "relative";

    // *** OBJECT INIT CODE:

    build();

    return endObject(box);

};

// *** STYLE PACKAGES:

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
