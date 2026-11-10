/* Bismillah */

/*

ImageView - v26.11

UI COMPONENT
- A place to look at a picture: a photo, or a plot drawn by a program. It opens fitted to the box.
- Zoom: the mouse wheel and a trackpad pinch (around the mouse), two fingers on a touch screen (around the fingers),
  the buttons of its toolbar. A double click goes to 100% at the mouse, and back to the fitted size.
- Move: drag it. A picture bigger than the box can not leave a gap at its edges; a smaller one stays in the middle.
- Keyboard (when it has the focus): + - zoom, 0 fits, 1 is 100%, the arrows move.
- The fitted size follows the size of the box. (After a zoom the picture keeps its zoom.)
- A file, an address or a data: address (a picture in the memory, Ex: a plot of Python or a canvas).
- A plot that is drawn again does not blink: setImage() keeps the old picture until the new one is ready, and a new
  picture of the same size keeps the zoom and the place. (A picture of another size opens fitted.)
- The pixels stay sharp from 300% up (pixelatedZoom), to look at a picture pixel by pixel.
- Style packages: "light" (default), "dark". Select with styleName (ImageView.styles), or later with setTheme().

USAGE:
const view = ImageView({ width: 600, height: 400, imageFile: "photo.jpg", altText: "A cat" });
view.setImage("data:image/png;base64,...");
view.clearImage();
view.zoomIn();
view.zoomOut();
view.zoomToFit();
view.zoomToActualSize();         // 100%
view.setZoomLevel(2);            // 200%
println(view.zoomLevel);         // read it
view.setShowToolbar(0);
view.setTheme("dark");           // the picture and its zoom stay
ImageView({ styleName: "dark", enlargeToFit: 1, onZoomChange: function (self) { println(self.zoomLevel); } });
ImageView({ style: { image: { color: "white" } } }); // A ground behind a transparent picture

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ImageViewDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: "100%",
    height: 360,
    imageFile: "", // A file, an address or a data: address. "": empty
    altText: "", // What the picture shows, for a screen reader
    minZoom: 0.1, // 1 is 100%. (A big picture can always go down to its fitted size.)
    maxZoom: 8,
    zoomStep: 1.25, // A button or a key: multiplies the zoom
    enlargeToFit: 0, // 1: a picture smaller than the box also grows to fit (a vector drawing). 0: it stays at 100%
    wheelZoom: 1, // 0: the wheel is left to the page around it (a viewer in a long page)
    pixelatedZoom: 3, // From this zoom the pixels stay sharp. 0: never
    showToolbar: 1,
    emptyText: "No image",
    errorText: "This image can not be opened.",
    ariaLabel: "Image viewer",
    buttonTexts: { zoomOut: "Zoom out", actualSize: "Actual size", zoomIn: "Zoom in", fit: "Fit to the box" }, // For a screen reader
    onLoad: function (self) { }, // self.naturalWidth, self.naturalHeight
    onError: function (self) { },
    onZoomChange: function (self) { }, // self.zoomLevel
    styleName: "light", // "light", "dark" or a name added to ImageView.styles
    style: { // Light style package (default)
        box: { color: "#EFEFEC", border: 1, borderColor: Black(0.14), round: 8 },
        image: { color: "transparent" }, // The ground of the picture
        toolbar: { color: "white", border: 1, borderColor: Black(0.12), round: 9, padding: 3, gap: 1, bottom: 10, shadow: "0 2px 10px " + Black(0.16) },
        toolButton: { size: 30, iconSize: 16, round: 6, textColor: Black(0.72), hoverColor: Black(0.07), disabledOpacity: 0.32 },
        zoomText: { fontSize: 12, width: 48 },
        empty: { fontSize: 13, textColor: Black(0.5), iconSize: 34, lineColor: Black(0.2), space: 14, round: 6 },
        error: { textColor: "#B93226" },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const ImageView = function (params = {}) {

    // Merge style package: params.style > ImageView.styles[styleName] > ImageViewDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, ImageView.styles, ImageViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ImageViewDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const WHEEL_SPEED = 0.002; // How much a pixel of the wheel zooms
    const PINCH_SPEED = 0.01; // WHY: The pinch of a trackpad comes as a wheel with small numbers.
    const WHEEL_LINE_HEIGHT = 16; // px: a wheel that counts in lines
    const KEY_MOVE = 40; // px: an arrow key
    const SVG_DEFAULT_WIDTH = 300; // WHY: A picture without a size of its own (an SVG with only a viewBox) has none.
    const SVG_DEFAULT_HEIGHT = 150;
    const DOUBLE_CLICK_ZOOM = 2; // WHY: A small picture is already at 100% when it is fitted.
    const ICONS = {
        minus: '<path d="M4 8h8"/>',
        plus: '<path d="M4 8h8M8 4v8"/>',
        fit: '<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>',
        picture: '<rect x="1.5" y="2.5" width="13" height="11" rx="2"/><circle cx="5.5" cy="6" r="1.2"/><path d="M2 12l3.5-3.5 2.5 2.5 2.5-3 3.5 4"/>',
    };
    let imageLeft = 0;
    let imageTop = 0;
    let isFitted = 1; // 1: the picture follows the size of the box
    let hasImage = 0;
    let noteKind = "empty"; // "empty", "error", "": what the note says ("": no note)
    const pointers = new Map(); // The fingers (or the mouse) on the picture: pointerId -> { x, y }
    let lastPinch = null; // { distance, x, y }

    // *** PUBLIC VARIABLES:
    box.zoomLevel = 1; // Read only: 1 is 100%. Change it with setZoomLevel().
    box.naturalWidth = 0; // The size of the picture
    box.naturalHeight = 0;
    // NOTE: Default values are also public variables. (box.imageFile, box.minZoom, box.maxZoom...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, ImageView.styles, ImageViewDefaults);
        mergeIntoIfMissing(fresh, ImageViewDefaults);
        return fresh.style;
    };

    // A point of an event in the box. WHY the scale: on a page fitted with page.fit() a screen px is not a px of the box.
    const screenScale = function () {
        const width = box.elem.offsetWidth;
        return (width > 0) ? box.elem.getBoundingClientRect().width / width : 1;
    };

    const pointInBox = function (event) {
        const rect = box.elem.getBoundingClientRect();
        const scale = screenScale();
        return {
            x: (event.clientX - rect.left) / scale - box.elem.clientLeft,
            y: (event.clientY - rect.top) / scale - box.elem.clientTop,
        };
    };

    const middleOfBox = function () {
        return { x: box.elem.clientWidth / 2, y: box.elem.clientHeight / 2 };
    };

    const fittedZoom = function () {
        if (!hasImage || box.elem.clientWidth <= 0 || box.elem.clientHeight <= 0) return 1;
        const zoom = Math.min(box.elem.clientWidth / box.naturalWidth, box.elem.clientHeight / box.naturalHeight);
        return (box.enlargeToFit == 1) ? zoom : Math.min(zoom, 1);
    };

    const lowestZoom = function () {
        return Math.min(box.minZoom, fittedZoom());
    };

    const highestZoom = function () {
        return Math.max(box.maxZoom, fittedZoom());
    };

    // One axis: a picture smaller than the box stays in the middle; a bigger one leaves no gap at its edges.
    const limitPosition = function (position, imageSize, boxSize) {
        if (imageSize <= boxSize) return (boxSize - imageSize) / 2;
        return basic.clamp(position, boxSize - imageSize, 0);
    };

    // LAYOUT: the picture at its zoom and place
    // WHY its size and not a CSS scale: the browser draws it sharp at every zoom (a vector drawing too).
    const placeImage = function () {
        const width = box.naturalWidth * box.zoomLevel;
        const height = box.naturalHeight * box.zoomLevel;
        imageLeft = limitPosition(imageLeft, width, box.elem.clientWidth);
        imageTop = limitPosition(imageTop, height, box.elem.clientHeight);
        box.image.left = imageLeft;
        box.image.top = imageTop;
        box.image.width = width;
        box.image.height = height;
    };

    const canMove = function () {
        const isWider = (box.naturalWidth * box.zoomLevel > box.elem.clientWidth);
        const isTaller = (box.naturalHeight * box.zoomLevel > box.elem.clientHeight);
        return (hasImage && (isWider || isTaller));
    };

    // WHY not button.enabled: a disabled button loses the focus, and the keys of a keyboard user with it.
    //      At its limit a click does nothing anyway.
    const paintToolButton = function (button, isUsable) {
        button.isUsable = isUsable;
        button.opacity = (isUsable) ? 1 : _s.toolButton.disabledOpacity;
        button.cursor = (isUsable) ? "pointer" : "default";
        button.aria = { disabled: (isUsable) ? "false" : "true" };
        if (!isUsable) button.color = "transparent";
    };

    // PAINT: what depends on the zoom
    const paintZoom = function () {
        const isPixelated = (box.pixelatedZoom > 0 && box.zoomLevel >= box.pixelatedZoom);
        box.image.css.imageRendering = (isPixelated) ? "pixelated" : "auto";
        box.btnZoomText.plainText = Math.round(box.zoomLevel * 100) + "%";
        paintToolButton(box.btnZoomOut, box.zoomLevel > lowestZoom());
        paintToolButton(box.btnZoomIn, box.zoomLevel < highestZoom());
        box.cursor = canMove() ? "grab" : "default";
        // WHY: At the fitted size a finger still scrolls the page around the viewer; zoomed in, it moves the picture.
        box.css.touchAction = canMove() ? "none" : "pan-x pan-y";
    };

    // PAINT: what is shown: the picture, or a note (no note: a picture is loading, or it is there)
    const paintContent = function () {
        const isError = (noteKind === "error");
        const noteColor = (isError) ? _s.error.textColor : _s.empty.textColor;
        box.image.visible = (hasImage) ? 1 : 0;
        box.toolbar.visible = (hasImage && box.showToolbar == 1) ? 1 : 0;
        box.emptyGroup.visible = (noteKind) ? 1 : 0;
        box.lblEmpty.plainText = (isError) ? box.errorText : box.emptyText;
        box.lblEmpty.textColor = noteColor;
        box.icoEmpty.textColor = noteColor;
    };

    const applyToolButtonLook = function (button) {
        const look = _s.toolButton;
        button.props({ width: look.size, height: look.size, fontSize: _s.zoomText.fontSize, textColor: look.textColor, round: look.round });
        button.setFocusRing(_s.focus.ringColor);
    };

    // LOOK: everything that comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        const toolbarLook = _s.toolbar;
        const emptySpace = _s.empty.space + "px";
        box.props(_s.box);
        box.setFocusRing(_s.focus.ringColor);
        box.elem.style.setProperty("--image-view-icon", _s.toolButton.iconSize + "px");
        box.image.color = _s.image.color;
        box.emptyGroup.round = _s.empty.round;
        // WHY in css: the bottom and right props of basic.js clear top and left.
        box.emptyGroup.css = { left: emptySpace, top: emptySpace, right: emptySpace, bottom: emptySpace };
        box.emptyGroup.css.border = "1px dashed " + _s.empty.lineColor;
        box.icoEmpty.props({ width: _s.empty.iconSize, height: _s.empty.iconSize });
        box.lblEmpty.fontSize = _s.empty.fontSize;
        box.toolbar.props({
            gap: toolbarLook.gap,
            padding: toolbarLook.padding,
            color: toolbarLook.color,
            border: toolbarLook.border,
            borderColor: toolbarLook.borderColor,
            round: toolbarLook.round,
            boxShadow: toolbarLook.shadow,
        });
        box.toolbar.css.bottom = toolbarLook.bottom + "px";
        [box.btnZoomOut, box.btnZoomText, box.btnZoomIn, box.btnFit].forEach(applyToolButtonLook);
        box.btnZoomText.width = _s.zoomText.width;
        paintContent();
    };

    // Everything of a zoom change goes through here.
    const zoomAtPoint = function (zoom, point) {
        const oldZoom = box.zoomLevel;
        box.zoomLevel = basic.clamp(zoom, lowestZoom(), highestZoom());
        const ratio = box.zoomLevel / oldZoom;
        imageLeft = point.x - (point.x - imageLeft) * ratio;
        imageTop = point.y - (point.y - imageTop) * ratio;
        placeImage();
        paintZoom();
        if (box.zoomLevel != oldZoom) box.onZoomChange(box);
    };

    const moveImage = function (deltaX, deltaY) {
        imageLeft += deltaX;
        imageTop += deltaY;
        placeImage();
    };

    const showFitted = function () {
        isFitted = 1;
        zoomAtPoint(fittedZoom(), middleOfBox());
    };

    const zoomByUser = function (zoom, point) {
        if (!hasImage) return;
        isFitted = 0;
        zoomAtPoint(zoom, point);
    };

    const onImageLoad = function () {
        const width = box.image.elem.naturalWidth || SVG_DEFAULT_WIDTH;
        const height = box.image.elem.naturalHeight || SVG_DEFAULT_HEIGHT;
        const isSameSize = (hasImage && width == box.naturalWidth && height == box.naturalHeight);
        hasImage = 1;
        box.naturalWidth = width;
        box.naturalHeight = height;
        if (!isSameSize) {
            box.zoomLevel = fittedZoom(); // WHY: A new picture opens fitted; this is not a zoom of the user.
            isFitted = 1;
            placeImage();
            paintZoom();
            box.onZoomChange(box);
        }
        noteKind = "";
        paintContent();
        box.onLoad(box);
    };

    const onImageError = function () {
        hasImage = 0;
        noteKind = "error";
        paintContent();
        box.onError(box);
    };

    const onWheel = function (self, event) {
        if (box.wheelZoom != 1 || !hasImage) return;
        event.preventDefault(); // WHY: The wheel zooms here; the page around it must not scroll too.
        const speed = (event.ctrlKey) ? PINCH_SPEED : WHEEL_SPEED;
        const pixels = (event.deltaMode === 1) ? event.deltaY * WHEEL_LINE_HEIGHT : event.deltaY;
        zoomByUser(box.zoomLevel * Math.exp(-pixels * speed), pointInBox(event));
    };

    const pinchOfPointers = function () {
        const list = Array.from(pointers.values());
        return {
            distance: Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y),
            x: (list[0].x + list[1].x) / 2,
            y: (list[0].y + list[1].y) / 2,
        };
    };

    // WHY: The drag goes on when the mouse leaves the box. A pointer that has just ended makes the browser throw.
    const capturePointer = function (pointerId) {
        try {
            box.elem.setPointerCapture(pointerId);
        } catch (error) {
            pointers.delete(pointerId);
        }
    };

    const onPointerDown = function (self, event) {
        if (!hasImage || event.button !== 0 || box.toolbar.elem.contains(event.target)) return;
        pointers.set(event.pointerId, pointInBox(event));
        capturePointer(event.pointerId);
        if (pointers.size == 2) lastPinch = pinchOfPointers();
        if (canMove()) box.cursor = "grabbing";
    };

    const onPointerMove = function (self, event) {
        const last = pointers.get(event.pointerId);
        if (!last) return;
        const point = pointInBox(event);
        pointers.set(event.pointerId, point);

        if (pointers.size == 1) {
            if (!canMove()) return;
            isFitted = 0;
            moveImage(point.x - last.x, point.y - last.y);
        } else if (pointers.size == 2 && lastPinch) {
            const pinch = pinchOfPointers();
            moveImage(pinch.x - lastPinch.x, pinch.y - lastPinch.y);
            if (lastPinch.distance > 0) zoomByUser(box.zoomLevel * pinch.distance / lastPinch.distance, pinch);
            lastPinch = pinch;
        }
    };

    const onPointerEnd = function (self, event) {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) lastPinch = null;
        if (pointers.size == 0) box.cursor = canMove() ? "grab" : "default";
    };

    const onDoubleClick = function (self, event) {
        if (!hasImage || box.toolbar.elem.contains(event.target)) return;
        if (!isFitted) {
            box.zoomToFit();
            return;
        }
        const isAtActualSize = (Math.abs(box.zoomLevel - 1) < 0.01);
        zoomByUser((isAtActualSize) ? DOUBLE_CLICK_ZOOM : 1, pointInBox(event));
    };

    const onKeyDown = function (self, event) {
        if (!hasImage || box.toolbar.elem.contains(event.target)) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return; // WHY: Ctrl + 0 and the others belong to the browser.
        const moves = { ArrowLeft: [KEY_MOVE, 0], ArrowRight: [-KEY_MOVE, 0], ArrowUp: [0, KEY_MOVE], ArrowDown: [0, -KEY_MOVE] };
        const move = moves[event.key];
        if (move && canMove()) {
            isFitted = 0;
            moveImage(move[0], move[1]);
        } else if (event.key === "+" || event.key === "=") {
            box.zoomIn();
        } else if (event.key === "-") {
            box.zoomOut();
        } else if (event.key === "0") {
            box.zoomToFit();
        } else if (event.key === "1") {
            box.zoomToActualSize();
        } else {
            return;
        }
        event.preventDefault();
    };

    const onBoxResize = function () {
        if (!hasImage) return;
        if (isFitted) showFitted();
        else placeImage();
    };

    const svgIcon = function (paths) {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor"' +
            ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' + paths + "</svg>";
    };

    // BUTTON: of the toolbar
    const makeToolButton = function (ariaLabel, onClick) {
        const button = Button({
            color: "transparent",
            shrink: 0,
            css: { padding: "0", display: "flex", alignItems: "center", justifyContent: "center" },
        });
        button.minimal = 1;
        button.isUsable = 1;
        button.aria = { label: ariaLabel };
        button.onHoverChange(function (self, isOver) {
            self.color = (isOver && self.isUsable) ? _s.toolButton.hoverColor : "transparent";
        });
        button.on("click", onClick);
        return button;
    };

    const makeIconButton = function (iconName, ariaLabel, onClick) {
        const button = makeToolButton(ariaLabel, onClick);
        button.text = svgIcon(ICONS[iconName]);
        button.elem.classList.add("image-view-icon");
        return button;
    };

    // *** PUBLIC FUNCTIONS:

    // file: a file, an address or a data: address. "": no picture
    box.setImage = function (file, altText = box.altText) {
        box.imageFile = file;
        box.altText = altText;
        box.image.alt = altText;
        // WHY: The old picture stays until the new one is ready (a browser keeps it on the screen meanwhile).
        if (file) {
            noteKind = "";
            paintContent();
            box.image.load(file);
            return;
        }
        hasImage = 0;
        noteKind = "empty";
        pointers.clear();
        lastPinch = null;
        box.image.elem.removeAttribute("src");
        paintContent();
    };
    // USAGE: view.setImage("plot.png", "The sales of the year")

    box.clearImage = function () {
        box.setImage("");
    };
    // USAGE: view.clearImage()

    box.zoomIn = function () {
        zoomByUser(box.zoomLevel * box.zoomStep, middleOfBox());
    };

    box.zoomOut = function () {
        zoomByUser(box.zoomLevel / box.zoomStep, middleOfBox());
    };

    box.zoomToFit = function () {
        if (hasImage) showFitted();
    };

    box.zoomToActualSize = function () {
        zoomByUser(1, middleOfBox());
    };

    box.setZoomLevel = function (zoom) {
        zoomByUser(zoom, middleOfBox());
    };
    // USAGE: get: view.zoomLevel, set: view.setZoomLevel(2) // 200%

    box.setShowToolbar = function (value) {
        box.showToolbar = basic.isOn(value) ? 1 : 0;
        box.toolbar.visible = (hasImage && box.showToolbar == 1) ? 1 : 0;
    };
    // USAGE: view.setShowToolbar(0)

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: view.setTheme("dark")

    // *** OBJECT VIEW:

    // An SVG icon fills its place in a button.
    basic.addCss("image-view-icon", ".image-view-icon svg { display: block; width: var(--image-view-icon); height: var(--image-view-icon); }");

    // BOX: The frame
    box.clickable = 1;
    box.tabIndex = 0;
    box.role = "group";
    box.aria = { label: box.ariaLabel };

    // ICON: The picture
    box.image = Icon({ left: 0, top: 0, width: 1, height: 1, visible: 0 });
    // WHY: The size comes from zoomAtPoint; the picture is never stretched by its element.
    box.image.imageFit = "fill";

    // GROUP: The note of an empty view (or of a picture that can not be opened), in the middle at every size
    box.emptyGroup = VGroup({
        align: "center center",
        gap: 8,
        padding: 12,
        css: { position: "absolute", width: "auto", height: "auto" },
    });

        // LABEL: Its icon (the color of the text)
        box.icoEmpty = Label({});
        box.icoEmpty.text = svgIcon(ICONS.picture);
        box.icoEmpty.elem.classList.add("image-view-note-icon");

        // LABEL: Its text
        box.lblEmpty = Label({ textAlign: "center" });

    endGroup();
    basic.addCss("image-view-note-icon", ".image-view-note-icon svg { display: block; width: 100%; height: 100%; }");

    // GROUP: The toolbar
    box.toolbar = HGroup({
        width: "auto",
        height: "auto",
        align: "center center",
        // WHY: In the middle at every size of the box and of its text.
        css: { position: "absolute", left: "50%", top: "auto", transform: "translateX(-50%)" },
    });
    box.toolbar.clickable = 1; // WHY: A click between its buttons must not fall on the picture.

        box.btnZoomOut = makeIconButton("minus", box.buttonTexts.zoomOut, function () { box.zoomOut(); });

        // BUTTON: The zoom. A click goes to 100%.
        box.btnZoomText = makeToolButton(box.buttonTexts.actualSize, function () { box.zoomToActualSize(); });

        box.btnZoomIn = makeIconButton("plus", box.buttonTexts.zoomIn, function () { box.zoomIn(); });
        box.btnFit = makeIconButton("fit", box.buttonTexts.fit, function () { box.zoomToFit(); });

    endGroup();

    // *** OBJECT INIT CODE:

    box.listenTo(box.image.elem, "load", onImageLoad);
    box.listenTo(box.image.elem, "error", onImageError);
    // WHY passive: false: onWheel stops the page around the viewer from scrolling.
    box.on("wheel", onWheel, { passive: false });
    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerEnd);
    box.on("pointercancel", onPointerEnd);
    box.on("dblclick", onDoubleClick);
    box.on("keydown", onKeyDown);
    box.onResize(onBoxResize);

    applyLook();
    box.setImage(box.imageFile, box.altText);

    return endObject(box);

};

// *** STYLE PACKAGES:
// USAGE: ImageView({ styleName: "dark" })
// USAGE: ImageView({ styleName: "dark", style: { box: { round: 0, border: 0 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: ImageView.styles.myStyle = { box: { color: "#FFFDF5" } };
ImageView.styles = {

    // A light gray ground, a white toolbar.
    light: ImageViewDefaults.style,

    // For a dark window.
    dark: {
        box: { color: "#161615", borderColor: White(0.1) },
        toolbar: { color: "#2B2B2A", borderColor: White(0.12), shadow: "0 2px 12px " + Black(0.5) },
        toolButton: { textColor: White(0.85), hoverColor: White(0.1) },
        empty: { textColor: White(0.52), lineColor: White(0.2) },
        error: { textColor: "#FF9F93" },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};
