/* Bismillah */

/*

Splitter - v26.11

UI COMPONENT
- Two areas with a line between them: a drag of the line changes their sizes (a list of files and the content).
- direction: "horizontal" (side by side, default), "vertical" (one under the other).
- firstSize: the size of the first area: px (240), or a part of the box ("30%"). A part stays a part when the box
  changes, px stay px. secondSize (px or a part) instead: the second area keeps its size (an output under the content).
- minFirst, minSecond: the areas do not get smaller than this (px), also when the box gets smaller.
- box.first and box.second are groups, one object under the other: objects go into them with createIn().
- Keyboard: Tab comes to the line; the arrows move it, Home and End go to its limits; Enter, or a double click, puts it
  back where it was at the start.
- setAreaVisible("first", 0) hides an area and the line; the other one takes the whole box.
- Style packages: "light" (default), "dark", "minimal", "minimalDark". Select with styleName (Splitter.styles), or later
  with setTheme().

USAGE:
const split = Splitter({ firstSize: 240, onChangeEnd: function (self) { println(self.getFirstSize()); } });
createIn(split.first, function () { TreeView({ width: "100%", height: "100%" }); });
createIn(split.second, function () { LogView({ width: "100%", height: "100%" }); });
split.setFirstSize(300);
split.setFirstSize("40%");
split.getFirstSize();                       // px
split.setAreaVisible("first", 0);
split.setTheme("dark");
Splitter({ direction: "vertical", secondSize: 160, minFirst: 100, minSecond: 60, styleName: "dark" });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SplitterDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    direction: "horizontal", // "horizontal": side by side, "vertical": one under the other
    firstSize: "30%", // px or a part of the box
    secondSize: null, // px or a part of the box: the second area keeps its size (firstSize is not used)
    minFirst: 60, // px
    minSecond: 60, // px
    keyStep: 16, // px: an arrow key moves the line this much
    ariaLabel: "Change the sizes of the areas",
    onChange: function (self) { }, // The line moves. (Not at create time, not with silent: 1)
    onChangeEnd: function (self) { }, // The line is let go.
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to Splitter.styles
    style: { // Light style package (default)
        line: { size: 1, color: Black(0.14) }, // The line that is seen
        grip: { size: 9 }, // The place around the line that takes the mouse
        lineHover: { size: 3, color: "#5BBAC1" },
        lineFocus: { size: 0, color: "" }, // The line while the keyboard is on it. "": the ring of focus.ringColor instead
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const Splitter = function (params = {}) {

    // Merge style package: params.style > Splitter.styles[styleName] > SplitterDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, Splitter.styles, SplitterDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SplitterDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const isVertical = (box.direction === "vertical");
    const POINT_KEY = (isVertical) ? "clientY" : "clientX";
    const FORWARD_KEY = (isVertical) ? "ArrowDown" : "ArrowRight";
    const BACK_KEY = (isVertical) ? "ArrowUp" : "ArrowLeft";
    const FIRST_SIZE_AT_START = box.firstSize;
    const SECOND_SIZE_AT_START = box.secondSize;
    let isFirstVisible = 1;
    let isSecondVisible = 1;
    let isOver = 0;
    let isKeyFocus = 0; // the keyboard is on the line (lineFocus)
    let dragPointerId = null;
    let dragStartPoint = 0;
    let dragStartSize = 0;
    let firstPixels = 0; // The size of the first area now

    // *** PUBLIC VARIABLES:
    // NOTE: box.first and box.second are the groups of the areas. Default values are also public variables.

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, Splitter.styles, SplitterDefaults);
        mergeIntoIfMissing(fresh, SplitterDefaults);
        return fresh.style;
    };

    const isPart = function (size) {
        return (typeof size === "string" && size.trim().endsWith("%"));
    };

    // px or "30%" of a length, in px
    const sizeInPixels = function (size, length) {
        return (isPart(size)) ? (parseFloat(size) / 100) * length : (parseFloat(size) || 0);
    };

    const boxLength = function () {
        return (isVertical) ? box.elem.clientHeight : box.elem.clientWidth;
    };

    // The room of the two areas
    const roomForAreas = function () {
        return Math.max(0, boxLength() - _s.line.size);
    };

    const keepsSecondSize = function () {
        return (box.secondSize !== null && box.secondSize !== undefined);
    };

    // The size of the first area from the params, inside its limits
    const wantedFirstPixels = function () {
        const room = roomForAreas();
        const wanted = (keepsSecondSize()) ? room - sizeInPixels(box.secondSize, room) : sizeInPixels(box.firstSize, room);
        return limitFirstPixels(wanted);
    };

    const limitFirstPixels = function (pixels) {
        const room = roomForAreas();
        const highest = Math.max(box.minFirst, room - box.minSecond);
        return Math.min(room, basic.clamp(pixels, box.minFirst, highest));
    };

    // WHY the same kind: a part stays a part when the box changes later, px stay px.
    const keepPixelsAsSize = function (pixels) {
        const room = roomForAreas();
        if (keepsSecondSize()) {
            const second = room - pixels;
            box.secondSize = (isPart(box.secondSize) && room > 0) ? ((second / room) * 100) + "%" : second;
            return;
        }
        box.firstSize = (isPart(box.firstSize) && room > 0) ? ((pixels / room) * 100) + "%" : pixels;
    };

    // One area: its place and its size on the line of the direction, the whole box on the other one.
    const placeArea = function (area, start, length) {
        if (isVertical) {
            area.props({ left: 0, top: start, width: "100%", height: length });
        } else {
            area.props({ left: start, top: 0, width: length, height: "100%" });
        }
    };

    const placeGrip = function () {
        const gripStart = firstPixels + (_s.line.size - _s.grip.size) / 2;
        if (isVertical) {
            box.grip.props({ left: 0, top: gripStart, width: "100%", height: _s.grip.size });
        } else {
            box.grip.props({ left: gripStart, top: 0, width: _s.grip.size, height: "100%" });
        }
    };

    // PAINT: the line: the mouse on it, or a drag
    const lineLookNow = function () {
        if (isOver || dragPointerId !== null) return _s.lineHover;
        if (isKeyFocus && _s.lineFocus.color) return _s.lineFocus;
        return _s.line;
    };

    const paintLine = function () {
        const look = lineLookNow();
        const size = look.size;
        const start = (_s.grip.size - size) / 2;
        box.line.color = look.color;
        if (isVertical) {
            box.line.props({ left: 0, top: start, width: "100%", height: size });
        } else {
            box.line.props({ left: start, top: 0, width: size, height: "100%" });
        }
    };

    // LAYOUT: what depends on the sizes
    const refreshLayout = function () {
        const isOneArea = (!isFirstVisible || !isSecondVisible);
        box.grip.visible = (isOneArea) ? 0 : 1;
        box.first.visible = (isFirstVisible) ? 1 : 0;
        box.second.visible = (isSecondVisible) ? 1 : 0;
        if (isOneArea) {
            placeArea((isFirstVisible) ? box.first : box.second, 0, boxLength());
            return;
        }
        const room = roomForAreas();
        firstPixels = wantedFirstPixels();
        placeArea(box.first, 0, firstPixels);
        placeArea(box.second, firstPixels + _s.line.size, room - firstPixels);
        placeGrip();
        const percent = (room > 0) ? Math.round((firstPixels / room) * 100) : 0;
        box.grip.aria = { valuenow: String(percent) };
    };

    // LOOK: everything that comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        // WHY no ring with lineFocus: the line itself shows the keyboard (and no outline of the browser either)
        const isLineFocus = !!_s.lineFocus.color;
        box.grip.setFocusRing((isLineFocus) ? "" : _s.focus.ringColor);
        box.grip.css.outline = (isLineFocus) ? "none" : "";
        paintLine();
        refreshLayout();
    };

    const movedTo = function (pixels) {
        keepPixelsAsSize(limitFirstPixels(pixels));
        refreshLayout();
        box.onChange(box);
    };

    // A point of an event. WHY the scale: on a page fitted with page.fit() a screen px is not a px of the box.
    const pointOf = function (event) {
        const width = box.elem.offsetWidth;
        const scale = (width > 0) ? box.elem.getBoundingClientRect().width / width : 1;
        return event[POINT_KEY] / scale;
    };

    const onPointerDown = function (self, event) {
        if (event.button !== 0) return;
        try {
            box.grip.elem.setPointerCapture(event.pointerId); // WHY: The drag goes on over the objects of the areas.
        } catch (error) {
            return; // WHY: A pointer that has just ended makes the browser throw.
        }
        dragPointerId = event.pointerId;
        dragStartPoint = pointOf(event);
        dragStartSize = firstPixels;
        paintLine();
    };

    const onPointerMove = function (self, event) {
        if (event.pointerId !== dragPointerId) return;
        movedTo(dragStartSize + pointOf(event) - dragStartPoint);
    };

    const onPointerEnd = function (self, event) {
        if (event.pointerId !== dragPointerId) return;
        dragPointerId = null;
        paintLine();
        box.onChangeEnd(box);
    };

    const backToStart = function () {
        box.firstSize = FIRST_SIZE_AT_START;
        box.secondSize = SECOND_SIZE_AT_START;
        refreshLayout();
        box.onChange(box);
        box.onChangeEnd(box);
    };

    const onKeyDown = function (self, event) {
        isKeyFocus = 1; // WHY: a key after a click shows where the keyboard is too
        paintLine();
        let target = null;
        if (event.key === FORWARD_KEY) target = firstPixels + box.keyStep;
        else if (event.key === BACK_KEY) target = firstPixels - box.keyStep;
        else if (event.key === "Home") target = 0;
        else if (event.key === "End") target = roomForAreas();

        if (event.key === "Enter") {
            event.preventDefault();
            backToStart();
            return;
        }
        if (target === null) return;
        event.preventDefault();
        movedTo(target);
        box.onChangeEnd(box);
    };

    // *** PUBLIC FUNCTIONS:

    // size: px or a part of the box ("40%"). silent: 1 -> onChange and onChangeEnd are not called.
    box.setFirstSize = function (size, silent = 0) {
        box.secondSize = null;
        box.firstSize = size;
        refreshLayout();
        if (silent) return;
        box.onChange(box);
        box.onChangeEnd(box);
    };
    // USAGE: split.setFirstSize(300) / split.setFirstSize("40%")

    // The size of the first area now, in px.
    box.getFirstSize = function () {
        return firstPixels;
    };
    // USAGE: split.getFirstSize()

    box.setAreaVisible = function (areaName, value) {
        const isVisible = basic.isOn(value) ? 1 : 0;
        if (areaName === "first") isFirstVisible = isVisible;
        else isSecondVisible = isVisible;
        refreshLayout();
    };
    // USAGE: split.setAreaVisible("first", 0)

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: split.setTheme("dark")

    // *** OBJECT VIEW:

    // GROUP: The areas
    box.first = VGroup({ left: 0, top: 0, align: "left top" });
    endGroup();

    box.second = VGroup({ left: 0, top: 0, align: "left top" });
    endGroup();

    // BOX: The place around the line that takes the mouse (over the edges of the areas)
    box.grip = startBox({ color: "transparent", zIndex: 1 });
    box.grip.cursor = (isVertical) ? "row-resize" : "col-resize";
    box.grip.css.touchAction = "none";
    box.grip.tabIndex = 0;
    box.grip.role = "separator";
    box.grip.aria = {
        label: box.ariaLabel,
        orientation: (isVertical) ? "horizontal" : "vertical", // WHY: The direction of the line, not of the areas.
        valuemin: "0",
        valuemax: "100",
    };

        // BOX: The line that is seen
        box.line = Box({ left: 0, top: 0 });

    endBox();

    // *** OBJECT INIT CODE:

    box.grip.onHoverChange(function (self, value) {
        isOver = value;
        paintLine();
    });
    box.grip.on("pointerdown", onPointerDown);
    box.grip.on("pointermove", onPointerMove);
    box.grip.on("pointerup", onPointerEnd);
    box.grip.on("pointercancel", onPointerEnd);
    box.grip.on("keydown", onKeyDown);
    box.grip.on("focus", function () {
        isKeyFocus = box.grip.elem.matches(":focus-visible") ? 1 : 0;
        paintLine();
    });
    box.grip.on("blur", function () {
        isKeyFocus = 0;
        paintLine();
    });
    box.grip.on("dblclick", backToStart);
    box.onResize(refreshLayout);

    applyLook();

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: Splitter({ styleName: "dark" })
// USAGE: Splitter({ style: { lineHover: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: Splitter.styles.myStyle = { line: { color: "tomato" } };
Splitter.styles = {

    // A soft line; in the color of the kit under the mouse.
    light: SplitterDefaults.style,

    // For a dark window.
    dark: {
        line: { color: White(0.12) },
        lineHover: { color: "#6FC6CD" },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): the soft line of the theme, a 2 px ink line under the mouse.
// minimalDark: the same on a dark window.
Splitter.createMinimalStyle = function (colors) {
    return {
        line: { size: 1, color: colors.line },
        lineHover: { size: 2, color: colors.ink },
        lineFocus: { size: 2, color: colors.focus },
        focus: { ringColor: colors.focus },
    };
};
Splitter.MINIMAL_COLORS = { line: Black(0.2), ink: "#1F1F1F", focus: "#3D8BD9" };
Splitter.styles.minimal = Splitter.createMinimalStyle(Splitter.MINIMAL_COLORS);
Splitter.MINIMAL_DARK_COLORS = { line: White(0.18), ink: "#EDEDEB", focus: "#7FB6DE" };
Splitter.styles.minimalDark = Splitter.createMinimalStyle(Splitter.MINIMAL_DARK_COLORS);
