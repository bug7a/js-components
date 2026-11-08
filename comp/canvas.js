/* Bismillah */

/*

Canvas - v26.11

UI COMPONENT
- A place to draw on: lines, rectangles, circles, ellipses, lines of many points, polygons, texts and pictures.
  For a teacher, a small game, a sketch, a plan. A Box can not draw a slanted line or a curve.
- Every shape has a key and stays in a list: it can be changed (updateShape), moved, removed, and a click finds it.
  The list is drawn on a <canvas> in one go after a change (WHY <canvas>, not SVG: measured in Chrome, 10000 shapes
  that all move: SVG 15 ms a frame, <canvas> 4 ms; 50000: 74 ms and 16 ms).
- drawing: 1: the mouse or a finger draws free lines with the pen (setPen). Each finished line is a shape too
  (onDrawEnd). draggable: 1 on a shape: it is moved with the mouse (onShapeMove at the end).
  WHY on the page: a move of the mouse sent to a program (Python) at every step stutters; only the end is sent.
- The places are in px from the left top of the box. The picture is sharp on every screen (devicePixelRatio).
- Style packages: "light" (default), "dark". Select with styleName (Canvas.styles), or later with setTheme().

A SHAPE: { key, type, ...its places, ...its look }
  line:      x1, y1, x2, y2
  rect:      x, y, width, height, round
  circle:    x, y (the middle), radius
  ellipse:   x, y (the middle), radiusX, radiusY
  polyline:  points: [[x, y], ...] (open)        polygon: points (closed)
  text:      x, y (the left top; align "center": the top middle), text, fontSize, bold, align, fontFamily
  image:     x, y, width, height, imageFile
  The look: color (the line), fill, lineWidth, dash ([6, 4]), opacity, draggable.
  A shape with no color and no fill: a line takes the pen color, a closed shape the fill of the style, a text the text color.

USAGE:
const board = Canvas({
    width: 600,
    height: 400,
    onClick: function (self, x, y, shape) { println(shape ? shape.key : x + ", " + y); },
});
board.addLine(20, 20, 200, 120, { color: "tomato", lineWidth: 4 });
const sun = board.addCircle(300, 100, 40, { fill: "orange", draggable: 1 });
board.addText(20, 300, "Hello", { fontSize: 24, bold: 1 });
board.addRect(20, 160, 120, 60, { fill: "gold", round: 8 });
board.updateShape(sun, { radius: 60 });
board.setDrawing(1);
board.setPen("#3F8D94", 4);
board.getImage(); // "data:image/png;base64,..."
board.clear();

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const CanvasDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: 400,
    height: 300,
    shapes: [], // [SHAPE]: the first shapes. Later: addShape(), setShapes()
    drawing: 0, // 1: the mouse draws free lines with the pen
    penColor: "", // "": the pen color of the style
    penWidth: 3,
    ariaLabel: "A drawing",
    onClick: function (self, x, y, shape) { }, // shape: the shape at that place (the top one), or null
    onShapeMove: function (self, shape) { }, // A draggable shape was put down at its new place.
    onDrawEnd: function (self, shape) { }, // A free line is finished: it is in the list (shape.key).
    styleName: "light", // "light", "dark" or a name added to Canvas.styles
    style: { // Light style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.12), round: 8 },
        pen: { color: "#373836" }, // The free lines, and the lines of a shape with no color
        shape: { fill: "#5BBAC1", lineWidth: 2 }, // A closed shape with no color and no fill
        text: { color: Black(0.85), fontSize: 16 },
        image: { color: Black(0.06) }, // The place of a picture that is not loaded yet
    },
};

const Canvas = function (params = {}) {

    // Merge style package: params.style > Canvas.styles[styleName] > CanvasDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, Canvas.styles, CanvasDefaults);

    // Merge params:
    mergeIntoIfMissing(params, CanvasDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let shapeList = []; // The shapes, the first one at the bottom
    const shapeOfKey = new Map(); // WHY: a change by key stays fast with many shapes
    let nextKeyNumber = 1;
    let isDrawWaiting = 0;
    let press = null; // { pointerId, kind: "draw" | "drag" | "click", shape, startX, startY, lastX, lastY, hasMoved }
    const images = {}; // imageFile -> HTMLImageElement (one for every file)
    const canvasElem = document.createElement("canvas");
    const context = canvasElem.getContext("2d");
    const SHAPE_TYPES = ["line", "rect", "circle", "ellipse", "polyline", "polygon", "text", "image"];
    const OPEN_TYPES = ["line", "polyline"];
    const MIN_HIT_WIDTH = 10; // WHY: A thin line is hard to hit with the mouse; a finger needs even more.
    const MIN_POINT_DISTANCE = 2; // A free line takes a new point only this far from the last one.
    const MOVE_THRESHOLD = 3; // A press that moves less than this is a click.

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, Canvas.styles, CanvasDefaults);
        mergeIntoIfMissing(fresh, CanvasDefaults);
        return fresh.style;
    };

    const freeKey = function () {
        while (findShape("s" + nextKeyNumber)) nextKeyNumber++;
        return "s" + nextKeyNumber;
    };

    const findShape = function (key) {
        return shapeOfKey.get(String(key)) || null;
    };

    const putShape = function (shape) {
        shapeList.push(shape);
        shapeOfKey.set(shape.key, shape);
    };

    // A copy of a shape given by the page, with a key. WHY a copy: the object of the caller does not change.
    const toShape = function (shape) {
        if (!shape || SHAPE_TYPES.indexOf(shape.type) === -1) {
            console.warn("Canvas: a shape needs a type: " + SHAPE_TYPES.join(", "));
            return null;
        }
        const copy = Object.assign({}, shape);
        if (Array.isArray(shape.points)) copy.points = shape.points.map(function (point) { return [Number(point[0]), Number(point[1])]; });
        copy.key = (shape.key === undefined || shape.key === null) ? freeKey() : String(shape.key);
        return copy;
    };

    const publicCopy = function (shape) {
        const copy = Object.assign({}, shape);
        if (shape.points) copy.points = shape.points.map(function (point) { return point.slice(); });
        return copy;
    };

    // SIZE: the pixels of the canvas follow the size of the box and the screen.
    const fitCanvasToBox = function () {
        const ratio = window.devicePixelRatio || 1;
        const width = Math.max(0, Math.round(box.elem.clientWidth));
        const height = Math.max(0, Math.round(box.elem.clientHeight));
        canvasElem.width = Math.round(width * ratio);
        canvasElem.height = Math.round(height * ratio);
        canvasElem.style.width = width + "px";
        canvasElem.style.height = height + "px";
    };

    // WHY a microtask: many changes of one moment are drawn once. Not requestAnimationFrame: a window in the back
    //      gets no frames, and a picture (getImage) must be drawn at once.
    const drawSoon = function () {
        if (isDrawWaiting) return;
        isDrawWaiting = 1;
        queueMicrotask(drawNow);
    };

    const drawNow = function () {
        isDrawWaiting = 0;
        const ratio = window.devicePixelRatio || 1;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvasElem.width, canvasElem.height);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        shapeList.forEach(drawShape);
    };

    // THE LOOK of a shape: what it has, or what its type takes from the style.
    const lineColorOf = function (shape) {
        if (shape.color) return shape.color;
        if (OPEN_TYPES.indexOf(shape.type) !== -1) return _s.pen.color;
        return "";
    };

    const fillOf = function (shape) {
        if (shape.fill) return shape.fill;
        if (OPEN_TYPES.indexOf(shape.type) !== -1 || shape.color) return "";
        return _s.shape.fill;
    };

    // WHY as Label.bold: the bold of the font of the kit is its own family (opensans-bold).
    const fontOf = function (shape) {
        const size = Number(shape.fontSize) || _s.text.fontSize;
        const family = shape.fontFamily || getComputedStyle(box.elem).fontFamily;
        const isBold = basic.isOn(shape.bold);
        if (family.indexOf("opensans") === 0) return size + "px " + ((isBold) ? "opensans-bold" : family);
        return ((isBold) ? "bold " : "") + size + "px " + family;
    };

    // The outline of a shape as a Path2D (drawing and a click use the same one). A text and a picture: null.
    const pathOf = function (shape) {
        const path = new Path2D();
        const type = shape.type;
        if (type === "line") {
            path.moveTo(Number(shape.x1), Number(shape.y1));
            path.lineTo(Number(shape.x2), Number(shape.y2));
        } else if (type === "rect") {
            addRectPath(path, shape);
        } else if (type === "circle") {
            path.arc(Number(shape.x), Number(shape.y), Math.max(0, Number(shape.radius) || 0), 0, Math.PI * 2);
        } else if (type === "ellipse") {
            path.ellipse(Number(shape.x), Number(shape.y), Math.max(0, Number(shape.radiusX) || 0), Math.max(0, Number(shape.radiusY) || 0), 0, 0, Math.PI * 2);
        } else if (type === "polyline" || type === "polygon") {
            addPointsPath(path, shape.points || [], type === "polygon");
        } else {
            return null;
        }
        return path;
    };

    const addRectPath = function (path, shape) {
        const round = Number(shape.round) || 0;
        const args = [Number(shape.x), Number(shape.y), Number(shape.width) || 0, Number(shape.height) || 0];
        if (round > 0 && path.roundRect) {
            path.roundRect(args[0], args[1], args[2], args[3], round);
            return;
        }
        path.rect(args[0], args[1], args[2], args[3]);
    };

    const addPointsPath = function (path, points, isClosed) {
        points.forEach(function (point, index) {
            if (index === 0) path.moveTo(point[0], point[1]);
            else path.lineTo(point[0], point[1]);
        });
        if (points.length === 1) path.lineTo(points[0][0] + 0.01, points[0][1]); // WHY: one point of a tap is a dot.
        if (isClosed) path.closePath();
    };

    const drawShape = function (shape) {
        context.save();
        context.globalAlpha = (shape.opacity === undefined) ? 1 : Number(shape.opacity);
        if (shape.type === "text") drawText(shape);
        else if (shape.type === "image") drawImage(shape);
        else drawPath(shape);
        context.restore();
    };

    const drawPath = function (shape) {
        const path = pathOf(shape);
        const fill = fillOf(shape);
        const lineColor = lineColorOf(shape);
        if (fill) {
            context.fillStyle = fill;
            context.fill(path);
        }
        if (!lineColor) return;
        context.strokeStyle = lineColor;
        context.lineWidth = lineWidthOf(shape);
        context.lineCap = "round";
        context.lineJoin = "round";
        if (Array.isArray(shape.dash)) context.setLineDash(shape.dash);
        context.stroke(path);
    };

    const lineWidthOf = function (shape) {
        if (shape.lineWidth !== undefined) return Number(shape.lineWidth);
        if (OPEN_TYPES.indexOf(shape.type) !== -1) return box.penWidth;
        return _s.shape.lineWidth;
    };

    const drawText = function (shape) {
        context.font = fontOf(shape);
        context.textBaseline = "top";
        context.textAlign = shape.align || "left";
        context.fillStyle = shape.color || shape.fill || _s.text.color;
        context.fillText(String(shape.text === undefined ? "" : shape.text), Number(shape.x), Number(shape.y));
    };

    const drawImage = function (shape) {
        const image = imageOf(shape.imageFile);
        const place = [Number(shape.x), Number(shape.y), Number(shape.width) || 0, Number(shape.height) || 0];
        if (image && image.complete && image.naturalWidth > 0) {
            context.drawImage(image, place[0], place[1], place[2], place[3]);
            return;
        }
        context.fillStyle = _s.image.color;
        context.fillRect(place[0], place[1], place[2], place[3]);
    };

    // A picture is loaded once; the canvas is drawn again when it comes.
    const imageOf = function (file) {
        if (!file) return null;
        if (images[file]) return images[file];
        const image = new Image();
        image.onload = drawSoon;
        image.onerror = function () { console.warn("Canvas: the picture can not be loaded: " + String(file).slice(0, 80)); };
        image.src = file;
        images[file] = image;
        return image;
    };

    // A CLICK: the top shape at a place.
    const shapeAt = function (x, y) {
        for (let index = shapeList.length - 1; index >= 0; index--) {
            if (isShapeAt(shapeList[index], x, y)) return shapeList[index];
        }
        return null;
    };

    const isShapeAt = function (shape, x, y) {
        if (shape.type === "image") return isInRect(x, y, Number(shape.x), Number(shape.y), Number(shape.width) || 0, Number(shape.height) || 0);
        if (shape.type === "text") return isOnText(shape, x, y);
        const path = pathOf(shape);
        const ratio = window.devicePixelRatio || 1;
        // WHY the transform: isPointInPath measures in the pixels of the canvas.
        context.save();
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        context.lineWidth = Math.max(lineWidthOf(shape), MIN_HIT_WIDTH);
        const isHit = (fillOf(shape) && context.isPointInPath(path, x * ratio, y * ratio)) || context.isPointInStroke(path, x * ratio, y * ratio);
        context.restore();
        return isHit;
    };

    const isOnText = function (shape, x, y) {
        context.save();
        context.font = fontOf(shape);
        const width = context.measureText(String(shape.text === undefined ? "" : shape.text)).width;
        context.restore();
        const height = Number(shape.fontSize) || _s.text.fontSize;
        let left = Number(shape.x);
        if (shape.align === "center") left -= width / 2;
        if (shape.align === "right") left -= width;
        return isInRect(x, y, left, Number(shape.y), width, height * 1.2);
    };

    const isInRect = function (x, y, left, top, width, height) {
        return (x >= left && x <= left + width && y >= top && y <= top + height);
    };

    // A MOVE of a shape by dx, dy (every type keeps its places in its own keys).
    const moveShapeBy = function (shape, dx, dy) {
        if (shape.type === "line") {
            shape.x1 = Number(shape.x1) + dx;
            shape.y1 = Number(shape.y1) + dy;
            shape.x2 = Number(shape.x2) + dx;
            shape.y2 = Number(shape.y2) + dy;
            return;
        }
        if (shape.points) {
            shape.points = shape.points.map(function (point) { return [point[0] + dx, point[1] + dy]; });
            return;
        }
        shape.x = Number(shape.x) + dx;
        shape.y = Number(shape.y) + dy;
    };

    // THE POINTER: a free line, a drag, or a click.
    const placeOf = function (event) {
        const rect = canvasElem.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    // The moves of a press come here also when the pointer leaves the box.
    // WHY no warning: the browser refuses a pointer that has just ended (or one made by a test); then only the moves
    //      outside the box are lost, and the press still works.
    const capturePointer = function (pointerId) {
        try {
            canvasElem.setPointerCapture(pointerId);
        } catch (error) {
            return;
        }
    };

    const onPointerDown = function (self, event) {
        if (event.button !== 0 || press) return;
        const place = placeOf(event);
        const shape = (box.drawing == 1) ? null : shapeAt(place.x, place.y);
        press = { pointerId: event.pointerId, kind: "click", shape: shape, startX: place.x, startY: place.y, lastX: place.x, lastY: place.y, hasMoved: 0 };
        if (box.drawing == 1) startFreeLine(place);
        else if (shape && basic.isOn(shape.draggable)) press.kind = "drag";
        capturePointer(event.pointerId);
        event.preventDefault(); // WHY: no text selection and no drag of the canvas picture while drawing
    };

    const startFreeLine = function (place) {
        press.kind = "draw";
        press.shape = { key: freeKey(), type: "polyline", points: [[place.x, place.y]], color: box.penColor || _s.pen.color, lineWidth: box.penWidth };
        putShape(press.shape);
        drawSoon();
    };

    const onPointerMove = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        const place = placeOf(event);
        if (Math.abs(place.x - press.startX) > MOVE_THRESHOLD || Math.abs(place.y - press.startY) > MOVE_THRESHOLD) press.hasMoved = 1;
        if (press.kind === "draw") addFreePoint(place);
        if (press.kind === "drag") dragTo(place);
    };

    const addFreePoint = function (place) {
        const points = press.shape.points;
        const last = points[points.length - 1];
        if (Math.hypot(place.x - last[0], place.y - last[1]) < MIN_POINT_DISTANCE) return;
        points.push([place.x, place.y]);
        drawSoon();
    };

    const dragTo = function (place) {
        moveShapeBy(press.shape, place.x - press.lastX, place.y - press.lastY);
        press.lastX = place.x;
        press.lastY = place.y;
        drawSoon();
    };

    const onPointerUp = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        const ended = press;
        press = null;
        if (ended.kind === "draw") {
            box.onDrawEnd(box, publicCopy(ended.shape));
            return;
        }
        if (ended.kind === "drag" && ended.hasMoved) {
            box.onShapeMove(box, publicCopy(ended.shape));
            return;
        }
        if (ended.hasMoved) return;
        box.onClick(box, Math.round(ended.startX), Math.round(ended.startY), ended.shape ? publicCopy(ended.shape) : null);
    };

    const onPointerCancel = function (self, event) {
        if (!press || event.pointerId !== press.pointerId) return;
        press = null;
    };

    // WHY: a finger on a canvas that draws, or on a shape that moves, must not scroll the page.
    const paintTouchAction = function () {
        const hasDraggable = shapeList.some(function (shape) { return basic.isOn(shape.draggable); });
        canvasElem.style.touchAction = (box.drawing == 1 || hasDraggable) ? "none" : "auto";
        canvasElem.style.cursor = (box.drawing == 1) ? "crosshair" : "default";
    };

    const applyBoxLook = function () {
        box.props(_s.box);
    };

    // *** PUBLIC FUNCTIONS:

    // A shape at the top. Returns its key.
    box.addShape = function (shape) {
        const copy = toShape(shape);
        if (!copy) return null;
        if (findShape(copy.key)) {
            console.warn("Canvas: there is a shape with the key " + copy.key + " already");
            return null;
        }
        putShape(copy);
        paintTouchAction();
        drawSoon();
        return copy.key;
    };
    // USAGE: board.addShape({ type: "rect", x: 10, y: 10, width: 80, height: 40, fill: "gold" })

    box.addLine = function (x1, y1, x2, y2, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "line", x1: x1, y1: y1, x2: x2, y2: y2 }));
    };

    box.addRect = function (x, y, width, height, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "rect", x: x, y: y, width: width, height: height }));
    };

    box.addCircle = function (x, y, radius, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "circle", x: x, y: y, radius: radius }));
    };

    box.addEllipse = function (x, y, radiusX, radiusY, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "ellipse", x: x, y: y, radiusX: radiusX, radiusY: radiusY }));
    };

    box.addPolyline = function (points, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "polyline", points: points }));
    };

    box.addPolygon = function (points, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "polygon", points: points }));
    };

    box.addText = function (x, y, text, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "text", x: x, y: y, text: text }));
    };

    box.addImage = function (x, y, width, height, imageFile, look = {}) {
        return box.addShape(Object.assign({}, look, { type: "image", x: x, y: y, width: width, height: height, imageFile: imageFile }));
    };

    // Changes some keys of a shape (its places, its look). Returns 0 when there is no such shape.
    box.updateShape = function (key, changes = {}) {
        const shape = findShape(key);
        if (!shape) return 0;
        const fresh = toShape(Object.assign({}, shape, changes, { key: shape.key, type: changes.type || shape.type }));
        if (!fresh) return 0;
        shapeList[shapeList.indexOf(shape)] = fresh;
        shapeOfKey.set(fresh.key, fresh);
        paintTouchAction();
        drawSoon();
        return 1;
    };
    // USAGE: board.updateShape(sun, { x: 200, fill: "tomato" })

    box.moveShape = function (key, dx, dy) {
        const shape = findShape(key);
        if (!shape) return 0;
        moveShapeBy(shape, Number(dx) || 0, Number(dy) || 0);
        drawSoon();
        return 1;
    };

    box.removeShape = function (key) {
        const shape = findShape(key);
        if (!shape) return 0;
        shapeList.splice(shapeList.indexOf(shape), 1);
        shapeOfKey.delete(shape.key);
        paintTouchAction();
        drawSoon();
        return 1;
    };

    // The shape goes to the top (drawn last, found first by a click).
    box.bringToFront = function (key) {
        const shape = findShape(key);
        if (!shape) return 0;
        shapeList.splice(shapeList.indexOf(shape), 1);
        shapeList.push(shape);
        drawSoon();
        return 1;
    };

    box.getShape = function (key) {
        const shape = findShape(key);
        return shape ? publicCopy(shape) : null;
    };

    box.getShapes = function () {
        return shapeList.map(publicCopy);
    };

    box.setShapes = function (shapes) {
        shapeList = [];
        shapeOfKey.clear();
        (Array.isArray(shapes) ? shapes : []).forEach(box.addShape);
        paintTouchAction();
        drawSoon();
    };

    box.clear = function () {
        box.setShapes([]);
    };

    box.setDrawing = function (isOn) {
        box.drawing = basic.isOn(isOn) ? 1 : 0;
        paintTouchAction();
    };

    // The pen of the free lines. color "": the pen color of the style.
    box.setPen = function (color, width) {
        if (color !== undefined && color !== null) box.penColor = color;
        if (width !== undefined && width !== null) box.penWidth = Number(width);
    };
    // USAGE: board.setPen("tomato", 6)

    // The drawing on its ground as a picture (a data URL). A picture from another site can not be read: then "".
    box.getImage = function (imageType = "image/png") {
        drawNow();
        const picture = document.createElement("canvas");
        picture.width = canvasElem.width;
        picture.height = canvasElem.height;
        const pictureContext = picture.getContext("2d");
        pictureContext.fillStyle = _s.box.color || "transparent";
        pictureContext.fillRect(0, 0, picture.width, picture.height);
        pictureContext.drawImage(canvasElem, 0, 0);
        try {
            return picture.toDataURL(imageType);
        } catch (error) {
            console.warn("Canvas: " + error.message);
            return "";
        }
    };

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyBoxLook();
        drawSoon();
    };
    // USAGE: board.setTheme("dark")

    // *** OBJECT VIEW:

    applyBoxLook();
    box.role = "img";
    box.aria = { label: box.ariaLabel };
    // WHY: a raw element: basic.css gives the boxes pointer-events: none.
    canvasElem.style.position = "absolute";
    canvasElem.style.left = "0px";
    canvasElem.style.top = "0px";
    canvasElem.style.pointerEvents = "auto";
    canvasElem.style.display = "block";
    box.elem.appendChild(canvasElem);

    // *** OBJECT INIT CODE:

    box.listenTo(canvasElem, "pointerdown", onPointerDown);
    box.listenTo(canvasElem, "pointermove", onPointerMove);
    box.listenTo(canvasElem, "pointerup", onPointerUp);
    box.listenTo(canvasElem, "pointercancel", onPointerCancel);
    // WHY: a text drawn before its font is loaded is drawn in another font; it is drawn again when the font comes.
    if (document.fonts) box.listenTo(document.fonts, "loadingdone", drawSoon);
    box.onResize(function () {
        fitCanvasToBox();
        drawNow();
    });
    fitCanvasToBox();
    box.setShapes(box.shapes);

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: Canvas({ styleName: "dark" })
// USAGE: Canvas({ style: { box: { color: "#FFFBEA" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
Canvas.styles = {

    // A white sheet with a thin line around it.
    light: CanvasDefaults.style,

    // For a dark page.
    dark: {
        box: { color: "#1A1A19", borderColor: White(0.12) },
        pen: { color: "#E6E6E4" },
        shape: { fill: "#5BBAC1" },
        text: { color: White(0.88) },
        image: { color: White(0.06) },
    },

};
