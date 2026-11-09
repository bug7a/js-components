/* Bismillah */

/*
BEHAVIOR TESTS: PAGES
The tests of test/behavior-test.htm for pages and parts of a page (Form, LoginPage, ImageView, Splitter, GridGroup, ScrollArea,
Accordion).
Every check is a bug that was found and fixed, written as its repro. A new test of a component goes into the
file of its group (the category of the component in index/catalog.js). The page loads every file, then runs
the tests in this order; its helpers (test, check, wait, key, pointer, findByText...) are there.

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0
*/

"use strict";

// *** FORM (comp/form.js)

test("Form: a press that is not a click does not send; a click sends once", async function () {
    let sends = 0;
    const form = Form({ onSendClick: function () { sends++; } });
    const input = TextField({ styleName: "modern", titleText: "Name", required: 1 });
    form.addInput(input);
    input.setValue("Ali");
    input.input.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(50);
    const button = form.btnSend.elem;
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 2 })); // a right click
    button.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 })); // a press dragged away
    const sendsBeforeClick = sends;
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 })); // the second click of a double click
    check("Form: a press that is not a click does not send; a click sends once", sendsBeforeClick === 0 && sends === 1, "before the click: " + sendsBeforeClick + ", after: " + sends);
    form.remove();
});

test("Form: the hint of the passive send button is as round as the list of the missing entries (and the hints of the fields)", async function () {
    const form = Form({});
    const input = TextField({ styleName: "modern", titleText: "Name", required: 1 });
    form.addInput(input);
    const password = PasswordField({ styleName: "modern", titleText: "Password" });
    await wait(50);
    form.btnSendCover.elem.dispatchEvent(new MouseEvent("mouseover"));
    const hintRadius = window.lblHint ? getComputedStyle(window.lblHint.elem).borderTopLeftRadius : "(no hint)";
    form.btnSendCover.elem.dispatchEvent(new MouseEvent("mouseout"));
    const listRadius = getComputedStyle(form.lblWarningDetail.elem).borderTopLeftRadius;
    const rounds = [input.warningBall.tooltip.lbl_round, password.btnShowPassword.tooltip.lbl_round];
    const isFieldRound = rounds.every(function (round) { return round === form.hintRound; });
    check("Form: the hint of the passive send button is as round as the list of the missing entries (and the hints of the fields)",
        hintRadius === listRadius && hintRadius === form.hintRound + "px" && isFieldRound, "hint: " + hintRadius + ", list: " + listRadius + ", fields: " + rounds.join(", "));
    form.remove();
    password.remove();
});

test("Form: onChange(self, input) on an edit", async function () {
    let changed = [];
    const form = Form({ onChange: function (self, input) { changed = [self, input]; } });
    const input = TextField({ styleName: "modern", titleText: "Name" });
    form.addInput(input);
    input.input.inputElement.value = "A";
    input.input.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    const isCalled = changed[0] === form && changed[1] === input;
    form.remove();
    check("Form: onChange(self, input) on an edit", isCalled, "the form: " + (changed[0] === form) + ", the input: " + (changed[1] === input));
});

// *** LOGIN PAGE (comp/login-page.js)

test("LoginPage: the hidden tab can not be clicked", async function () {
    let logins = 0;
    const login = LoginPage({ onLoginClick: function () { logins++; } });
    await wait(50);
    login.setActiveTab(1);
    await wait(400);
    const button = findByText("LOGIN", login.loginBox.elem);
    const rect = button.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    check("LoginPage: the hidden tab can not be clicked", !login.loginBox.elem.contains(hit) && login.loginBox.elem.inert === true);
    login.remove();
});

// *** IMAGE VIEW (comp/image-view.js)

const makeTestPicture = function (width, height) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '"><rect width="100%" height="100%" fill="red"/><\/svg>';
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
};

// The view after its picture is loaded. (Its element: 400 x 300 with a line of 1 px: its inside is 398 x 298.)
const makeLoadedView = async function (width, height, params) {
    let isLoaded = 0;
    const view = ImageView(Object.assign({
        left: 0, top: 0, width: 400, height: 300,
        imageFile: makeTestPicture(width, height),
        onLoad: function () { isLoaded = 1; },
    }, params || {}));
    for (let i = 0; i < 200 && !isLoaded; i++) await wait(10);
    return view;
};

const isNear = function (a, b) {
    return Math.abs(a - b) < 0.6;
};

test("ImageView: a picture opens fitted and in the middle, and it follows the size of the box", async function () {
    const view = await makeLoadedView(1000, 500);
    const isFitted = isNear(view.zoomLevel * 1000, 398) && isNear(view.image.width, 398) && isNear(view.image.left, 0);
    const isInMiddle = isNear(view.image.top, (298 - 199) / 2);
    view.width = 200;
    await wait(60);
    const followsBox = isNear(view.image.width, 198);
    check("ImageView: a picture opens fitted and in the middle, and it follows the size of the box", isFitted && isInMiddle && followsBox, [view.image.width, view.image.top].join(" "));
    view.remove();
});

test("ImageView: a small picture stays at 100% in the middle; enlargeToFit: 1 makes it grow", async function () {
    const small = await makeLoadedView(100, 100);
    const staysSmall = small.zoomLevel === 1 && isNear(small.image.left, 149) && isNear(small.image.top, 99);
    small.remove();
    const grown = await makeLoadedView(100, 100, { enlargeToFit: 1 });
    const growsUp = isNear(grown.zoomLevel, 2.98);
    grown.remove();
    check("ImageView: a small picture stays at 100% in the middle; enlargeToFit: 1 makes it grow", staysSmall && growsUp, staysSmall + " " + growsUp);
});

test("ImageView: the wheel zooms around the mouse, and the point under it stays there", async function () {
    let changes = 0;
    const view = await makeLoadedView(1000, 500, { onZoomChange: function () { changes++; } });
    changes = 0;
    const rect = view.elem.getBoundingClientRect();
    const point = { x: 100, y: 100 };
    const pictureX = (point.x - view.image.left) / view.zoomLevel;
    const pictureY = (point.y - view.image.top) / view.zoomLevel;
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -500, clientX: rect.left + 1 + point.x, clientY: rect.top + 1 + point.y });
    view.elem.dispatchEvent(wheel);
    const isBigger = view.zoomLevel > 1;
    const isSamePoint = isNear((point.x - view.image.left) / view.zoomLevel, pictureX) && isNear((point.y - view.image.top) / view.zoomLevel, pictureY);
    check("ImageView: the wheel zooms around the mouse, and the point under it stays there",
        isBigger && isSamePoint && wheel.defaultPrevented && changes === 1, [view.zoomLevel, isSamePoint, wheel.defaultPrevented, changes].join(" "));
    view.remove();
});

test("ImageView: wheelZoom: 0 leaves the wheel to the page around it", async function () {
    const view = await makeLoadedView(1000, 500, { wheelZoom: 0 });
    const zoom = view.zoomLevel;
    const wheel = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -500 });
    view.elem.dispatchEvent(wheel);
    check("ImageView: wheelZoom: 0 leaves the wheel to the page around it", view.zoomLevel === zoom && !wheel.defaultPrevented, view.zoomLevel);
    view.remove();
});

test("ImageView: a drag moves a big picture, and leaves no gap at its edges; a fitted picture does not move", async function () {
    const view = await makeLoadedView(1000, 500);
    view.elem.setPointerCapture = function () { }; // WHY: A synthetic pointer is not an active one.
    const rect = view.elem.getBoundingClientRect();
    const drag = function (fromX, fromY, toX, toY) {
        pointer(view.elem, "pointerdown", rect.left + fromX, rect.top + fromY);
        pointer(view.elem, "pointermove", rect.left + toX, rect.top + toY);
        pointer(view.elem, "pointerup", rect.left + toX, rect.top + toY);
    };
    const topAtFirst = view.image.top;
    drag(100, 100, 200, 180);
    const fittedStays = view.image.top === topAtFirst && view.image.left === 0;
    view.setZoomLevel(1);
    const leftBefore = view.image.left;
    drag(200, 100, 150, 100);
    const moved = isNear(view.image.left, leftBefore - 50);
    drag(10, 100, 390, 100); // far to the right
    drag(10, 100, 390, 100);
    const noGapAtLeft = view.image.left === 0;
    drag(390, 100, 10, 100);
    drag(390, 100, 10, 100);
    drag(390, 100, 10, 100);
    const noGapAtRight = isNear(view.image.left, 398 - 1000);
    const stopsAfterUp = (function () {
        const before = view.image.left;
        pointer(view.elem, "pointermove", rect.left + 200, rect.top + 100);
        return view.image.left === before;
    })();
    check("ImageView: a drag moves a big picture, and leaves no gap at its edges; a fitted picture does not move",
        fittedStays && moved && noGapAtLeft && noGapAtRight && stopsAfterUp, [fittedStays, moved, noGapAtLeft, noGapAtRight, stopsAfterUp].join(" "));
    view.remove();
});

test("ImageView: two fingers zoom", async function () {
    const view = await makeLoadedView(1000, 500);
    view.elem.setPointerCapture = function () { };
    const rect = view.elem.getBoundingClientRect();
    const finger = function (type, id, x, y) {
        view.elem.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: rect.left + x, clientY: rect.top + y, pointerId: id, pointerType: "touch" }));
    };
    const zoomAtFirst = view.zoomLevel;
    finger("pointerdown", 1, 150, 150);
    finger("pointerdown", 2, 250, 150);
    finger("pointermove", 1, 100, 150);
    finger("pointermove", 2, 300, 150);
    const isDouble = isNear(view.zoomLevel / zoomAtFirst, 2);
    finger("pointerup", 1, 100, 150);
    finger("pointerup", 2, 300, 150);
    check("ImageView: two fingers zoom", isDouble, view.zoomLevel / zoomAtFirst);
    view.remove();
});

test("ImageView: the limits of the zoom and of its buttons; the text of the zoom; sharp pixels from 300%", async function () {
    const view = await makeLoadedView(1000, 500);
    const fitted = view.zoomLevel;
    view.setZoomLevel(100);
    const isAtMost = view.zoomLevel === view.maxZoom && view.btnZoomText.elem.textContent === "800%";
    const plusOff = view.btnZoomIn.elem.getAttribute("aria-disabled") === "true" && view.btnZoomOut.elem.getAttribute("aria-disabled") === "false";
    const isSharp = view.image.elem.style.imageRendering === "pixelated";
    view.setZoomLevel(0.001);
    const isAtLeast = view.zoomLevel === view.minZoom;
    const minusOff = view.btnZoomOut.elem.getAttribute("aria-disabled") === "true";
    const isSoft = view.image.elem.style.imageRendering === "auto";
    view.btnFit.elem.click();
    const isFittedAgain = view.zoomLevel === fitted;
    view.btnZoomText.elem.click();
    const isActual = view.zoomLevel === 1;
    view.btnZoomIn.elem.click();
    const isStepUp = view.zoomLevel === 1.25;
    view.btnZoomOut.elem.click();
    const isStepDown = view.zoomLevel === 1;
    check("ImageView: the limits of the zoom and of its buttons; the text of the zoom; sharp pixels from 300%",
        isAtMost && plusOff && isSharp && isAtLeast && minusOff && isSoft && isFittedAgain && isActual && isStepUp && isStepDown,
        [isAtMost, plusOff, isSharp, isAtLeast, minusOff, isSoft, isFittedAgain, isActual, isStepUp, isStepDown].join(" "));
    view.remove();
});

test("ImageView: a very big picture can still go down to its fitted size", async function () {
    const view = await makeLoadedView(20000, 10000);
    const fitted = view.zoomLevel;
    const isUnderMin = fitted < view.minZoom && isNear(view.image.width, 398);
    view.setZoomLevel(1);
    view.zoomToFit();
    check("ImageView: a very big picture can still go down to its fitted size", isUnderMin && view.zoomLevel === fitted, fitted);
    view.remove();
});

test("ImageView: the keys zoom and move; Ctrl + 0 stays with the browser", async function () {
    const view = await makeLoadedView(1000, 500);
    const fitted = view.zoomLevel;
    key(view.elem, "keydown", "+");
    const zoomedIn = isNear(view.zoomLevel * 100, fitted * 125);
    key(view.elem, "keydown", "-");
    const zoomedOut = isNear(view.zoomLevel * 100, fitted * 100);
    key(view.elem, "keydown", "1");
    const isActual = view.zoomLevel === 1;
    const leftBefore = view.image.left;
    key(view.elem, "keydown", "ArrowRight");
    const moved = view.image.left !== leftBefore;
    const withCtrl = new KeyboardEvent("keydown", { key: "0", ctrlKey: true, bubbles: true, cancelable: true });
    view.elem.dispatchEvent(withCtrl);
    const keptByBrowser = !withCtrl.defaultPrevented && view.zoomLevel === 1;
    key(view.elem, "keydown", "0");
    const isFitted = view.zoomLevel === fitted;
    check("ImageView: the keys zoom and move; Ctrl + 0 stays with the browser",
        zoomedIn && zoomedOut && isActual && moved && keptByBrowser && isFitted, [zoomedIn, zoomedOut, isActual, moved, keptByBrowser, isFitted].join(" "));
    view.remove();
});

test("ImageView: a double click goes to 100% at the mouse and back; a small picture goes to 200%", async function () {
    const view = await makeLoadedView(1000, 500);
    const fitted = view.zoomLevel;
    view.elem.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 50, clientY: 50 }));
    const isActual = view.zoomLevel === 1;
    view.elem.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 50, clientY: 50 }));
    const isBack = view.zoomLevel === fitted;
    view.remove();
    const small = await makeLoadedView(100, 100);
    small.elem.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, clientX: 50, clientY: 50 }));
    const isDouble = small.zoomLevel === 2;
    small.remove();
    check("ImageView: a double click goes to 100% at the mouse and back; a small picture goes to 200%", isActual && isBack && isDouble, [isActual, isBack, isDouble].join(" "));
});

test("ImageView: empty, a file that can not be opened, a new picture that opens fitted again", async function () {
    let errors = 0;
    let loads = 0;
    const view = ImageView({ left: 0, top: 0, width: 400, height: 300, onError: function () { errors++; }, onLoad: function () { loads++; } });
    const isShown = function (obj) { return obj.elem.getClientRects().length > 0; };
    const isEmpty = isShown(view.lblEmpty) && view.lblEmpty.elem.textContent === view.emptyText && !isShown(view.toolbar) && !isShown(view.image);
    view.setImage("data:image/png;base64,AAAA");
    const noNoteWhileLoading = !isShown(view.lblEmpty);
    for (let i = 0; i < 200 && !errors; i++) await wait(10);
    const isError = isShown(view.lblEmpty) && view.lblEmpty.elem.textContent === view.errorText && !isShown(view.toolbar) && errors === 1;
    view.setImage(makeTestPicture(1000, 500), "A red box");
    for (let i = 0; i < 200 && !loads; i++) await wait(10);
    const isLoaded = isShown(view.image) && isShown(view.toolbar) && !isShown(view.lblEmpty) && view.image.elem.alt === "A red box";
    const fitted = view.zoomLevel;
    view.setZoomLevel(4);
    loads = 0;
    view.setImage(makeTestPicture(500, 500));
    for (let i = 0; i < 200 && !loads; i++) await wait(10);
    const isFittedAgain = isNear(view.zoomLevel * 500, 298) && view.naturalWidth === 500;
    view.clearImage();
    const isClear = isShown(view.lblEmpty) && !isShown(view.image) && !isShown(view.toolbar) && !view.image.elem.getAttribute("src");
    view.setZoomLevel(3); // no picture: nothing happens
    check("ImageView: empty, a file that can not be opened, a new picture that opens fitted again",
        isEmpty && noNoteWhileLoading && isError && isLoaded && isFittedAgain && isClear && fitted > 0, [isEmpty, noNoteWhileLoading, isError, isLoaded, isFittedAgain, isClear].join(" "));
    view.remove();
});

test("ImageView: a plot that is drawn again does not blink, and it keeps its zoom and its place", async function () {
    let loads = 0;
    let zoomChanges = 0;
    const view = await makeLoadedView(1000, 500, { onZoomChange: function () { zoomChanges++; } });
    view.onLoad = function () { loads++; };
    view.setZoomLevel(2);
    view.elem.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    const zoom = view.zoomLevel;
    const left = view.image.left;
    const top = view.image.top;
    zoomChanges = 0;
    view.setImage(makeTestPicture(1000, 500) + "%20"); // the same size, another address
    const isShownWhileLoading = view.image.elem.getClientRects().length > 0 && view.toolbar.elem.getClientRects().length > 0;
    for (let i = 0; i < 200 && !loads; i++) await wait(10);
    const keepsAll = view.zoomLevel === zoom && view.image.left === left && view.image.top === top && zoomChanges === 0;
    loads = 0;
    view.setImage(makeTestPicture(800, 800));
    for (let i = 0; i < 200 && !loads; i++) await wait(10);
    const otherSizeFits = isNear(view.zoomLevel * 800, 298) && zoomChanges === 1;
    check("ImageView: a plot that is drawn again does not blink, and it keeps its zoom and its place",
        isShownWhileLoading && keepsAll && otherSizeFits, [isShownWhileLoading, keepsAll, otherSizeFits, view.zoomLevel].join(" "));
    view.remove();
});

test("ImageView: setShowToolbar hides its toolbar, a press on the toolbar does not drag", async function () {
    const view = await makeLoadedView(1000, 500);
    const isShown = function (obj) { return obj.elem.getClientRects().length > 0; };
    view.setShowToolbar(0);
    const isHidden = !isShown(view.toolbar);
    view.setShowToolbar(1);
    const isBack = isShown(view.toolbar);
    view.setZoomLevel(1);
    const leftBefore = view.image.left;
    view.elem.setPointerCapture = function () { };
    pointer(view.btnZoomIn.elem, "pointerdown", 100, 100);
    pointer(view.elem, "pointermove", 50, 100);
    pointer(view.elem, "pointerup", 50, 100);
    check("ImageView: setShowToolbar hides its toolbar, a press on the toolbar does not drag", isHidden && isBack && view.image.left === leftBefore, [isHidden, isBack, view.image.left, leftBefore].join(" "));
    view.remove();
});

// *** SPLITTER (comp/splitter.js)

const dragOf = function (element, fromX, fromY, toX, toY) {
    element.setPointerCapture = function () { }; // WHY: A synthetic pointer is not an active one.
    pointer(element, "pointerdown", fromX, fromY);
    pointer(element, "pointermove", toX, toY);
    pointer(element, "pointerup", toX, toY);
};

// *** GRID GROUP (comp/grid-group.js)

test("GridGroup: a number makes equal columns; the objects go left to right, then under; they are in its flow", async function () {
    const before = getDefaultContainerBox();
    const grid = GridGroup({ left: 0, top: 0, width: 300, columns: 3 });
        const cells = ["a", "b", "c", "d"].map(function (text) { return Label({ text: text }); });
    endGroup();
    const isClosed = (getDefaultContainerBox() === before);
    const corner = grid.elem.getBoundingClientRect();
    const placeOf = function (cell) {
        const rect = cell.elem.getBoundingClientRect();
        return Math.round(rect.left - corner.left) + "," + Math.round(rect.top - corner.top > 0 ? 1 : 0) + "," + Math.round(rect.width);
    };
    const places = cells.map(placeOf).join(" ");
    const isInFlow = (getComputedStyle(cells[0].elem).position === "relative");
    const isGrid = (getComputedStyle(grid.elem).display === "grid");
    check("GridGroup: a number makes equal columns; the objects go left to right, then under; they are in its flow",
        places === "0,0,100 100,0,100 200,0,100 0,1,100" && isInFlow && isGrid && isClosed && grid.columns === 3,
        [places, isInFlow, isGrid, isClosed].join(" | "));
    grid.remove();
});

test("GridGroup: a list is px, a part of the room and the width of the content; a text is CSS; a long text does not widen an equal column", async function () {
    const widthsOf = function (columns, longText) {
        const grid = GridGroup({ left: 0, top: 0, width: 400, columns: columns });
            Label({ text: longText || "a" });
            Label({ text: "b" });
            const last = Label({ text: "content" });
            last.ellipsis = 0;
        endGroup();
        const widths = Array.from(grid.elem.children).map(function (cell) { return Math.round(cell.getBoundingClientRect().width); });
        grid.remove();
        return widths;
    };
    const mixed = widthsOf([120, "1fr", "auto"]);
    const asCss = widthsOf("100px 200px 100px");
    const long = "A very long text with no place to break: ".repeat(5).replace(/ /g, "_");
    const equal = widthsOf(3, long);
    const twice = widthsOf(["1fr", "2fr", 100], long);
    const grid = GridGroup({ left: 0, top: 0, width: 400, columns: 2 });
        Label({ text: "a" });
    endGroup();
    grid.setColumns(4);
    const afterSet = getComputedStyle(grid.elem).gridTemplateColumns.split(" ").length;
    const isRight = mixed[0] === 120 && mixed[2] < 120 && Math.abs(mixed[1] - (400 - 120 - mixed[2])) <= 1
        && asCss.join() === "100,200,100" && equal.every(function (width) { return Math.abs(width - 133) <= 1; })
        && twice[0] === 100 && twice[1] === 200 && afterSet === 4 && grid.columns === 4;
    check("GridGroup: a list is px, a part of the room and the width of the content; a text is CSS; a long text does not widen an equal column", isRight,
        [mixed, asCss, equal, twice, afterSet].join(" | "));
    grid.remove();
});

test("GridGroup: gap is one number or [column, row]; rows fill a height; without rows they are as high as their objects", async function () {
    const grid = GridGroup({ left: 0, top: 0, width: 210, columns: 2, gap: [10, 20] });
        const first = Box({ width: "100%", height: 30 });
        Box({ width: "100%", height: 30 });
        const third = Box({ width: "100%", height: 30 });
    endGroup();
    const firstRect = first.elem.getBoundingClientRect();
    const thirdRect = third.elem.getBoundingClientRect();
    const rowGap = Math.round(thirdRect.top - firstRect.bottom);
    const columnWidth = Math.round(firstRect.width);
    const autoHeight = grid.elem.offsetHeight;
    grid.setGap(4);
    const newGap = Math.round(third.elem.getBoundingClientRect().top - first.elem.getBoundingClientRect().bottom);
    grid.remove();

    const filled = GridGroup({ left: 0, top: 0, width: 200, height: 300, columns: 1, rows: 3 });
        const cell = Label({ text: "a" });
    endGroup();
    const cellHeight = Math.round(cell.elem.getBoundingClientRect().height);
    filled.setRows(2);
    const afterSet = Math.round(cell.elem.getBoundingClientRect().height);
    filled.remove();
    check("GridGroup: gap is one number or [column, row]; rows fill a height; without rows they are as high as their objects",
        rowGap === 20 && columnWidth === 100 && autoHeight === 80 && newGap === 4 && cellHeight === 100 && afterSet === 150,
        [rowGap, columnWidth, autoHeight, newGap, cellHeight, afterSet].join(" | "));
});

test("GridGroup: place() puts an object in a cell of its own and over more than one cell", async function () {
    const grid = GridGroup({ left: 0, top: 0, width: 300, columns: 3, rows: [40, 40, 40] });
        const wide = Label({ text: "Wide" });
        const next = Label({ text: "Next" });
        const inCorner = Label({ text: "Corner" });
        const tall = Label({ text: "Tall" });
    endGroup();
    grid.place(wide, { columnSpan: 2 });
    grid.place(inCorner, { column: 2, row: 2 });
    grid.place(tall, { column: 0, row: 1, rowSpan: 2 });
    const corner = grid.elem.getBoundingClientRect();
    const rectOf = function (obj) {
        const rect = obj.elem.getBoundingClientRect();
        return [rect.left - corner.left, rect.top - corner.top, rect.width, rect.height].map(Math.round).join(",");
    };
    const places = [wide, next, inCorner, tall].map(rectOf).join(" ");
    check("GridGroup: place() puts an object in a cell of its own and over more than one cell",
        places === "0,0,200,40 200,0,100,40 200,80,100,40 0,40,100,80", places);
    grid.remove();
});

test("GridGroup: without align an object fills its cell; align puts it in its cell; an object can have its own; a width stays", async function () {
    const grid = GridGroup({ left: 0, top: 0, width: 200, columns: 1, rows: [100] });
        const label = Label({ text: "a" });
    endGroup();
    const rectOf = () => label.elem.getBoundingClientRect();
    const fills = (Math.round(rectOf().width) === 200 && Math.round(rectOf().height) === 100);
    grid.setAlign("left center");
    const isLeftCenter = rectOf().width < 100 && rectOf().left === grid.elem.getBoundingClientRect().left && Math.round(rectOf().top + rectOf().height / 2 - grid.elem.getBoundingClientRect().top) === 50;
    grid.setAlign("center");
    const isCenter = Math.round(rectOf().left + rectOf().width / 2 - grid.elem.getBoundingClientRect().left) === 100;
    grid.setAlign("");
    grid.place(label, { align: "right bottom" });
    const ownPlace = Math.round(rectOf().right - grid.elem.getBoundingClientRect().left) === 200 && rectOf().height < 50;
    grid.remove();

    const second = GridGroup({ left: 0, top: 0, width: 200, columns: 1 });
        const fixed = Box({ width: 50, height: 20 });
    endGroup();
    const keepsWidth = (fixed.elem.offsetWidth === 50);
    second.remove();
    check("GridGroup: without align an object fills its cell; align puts it in its cell; an object can have its own; a width stays",
        fills && isLeftCenter && isCenter && ownPlace && keepsWidth, [fills, isLeftCenter, isCenter, ownPlace, keepsWidth].join(" | "));
});

test("GridGroup: visible: 0 stays hidden and comes back as a grid; its objects stay in its flow; a group in it closes", async function () {
    const grid = GridGroup({ left: 0, top: 0, width: 200, columns: 2, visible: 0 });
        HGroup({ hug: 1 });
            const inner = Label({ text: "In" });
        endGroup();
        const after = Label({ text: "After" });
    endGroup();
    const isHidden = (getComputedStyle(grid.elem).display === "none");
    const isInFlow = (getComputedStyle(after.elem).position === "relative" && inner.elem.parentElement !== after.elem.parentElement && after.elem.parentElement === grid.elem);
    grid.visible = 1;
    const isGrid = (getComputedStyle(grid.elem).display === "grid");
    const doesNotClip = (getComputedStyle(grid.elem).overflow === "visible");
    check("GridGroup: visible: 0 stays hidden and comes back as a grid; its objects stay in its flow; a group in it closes",
        isHidden && isInFlow && isGrid && doesNotClip, [isHidden, isInFlow, isGrid, doesNotClip].join(" | "));
    grid.remove();
});

// *** SCROLL AREA (comp/scroll-area.js)

// The place of an object in a box: "left,top,width,height" (px, rounded).
const scrollAreaPlaceIn = function (obj, frame) {
    const rect = obj.elem.getBoundingClientRect();
    const corner = (frame) ? frame.elem.getBoundingClientRect() : { left: 0, top: 0 };
    return [rect.left - corner.left, rect.top - corner.top, rect.width, rect.height].map(Math.round).join(",");
};

test("ScrollArea: on the page it fills the window; endGroup() goes back to the page; that is the area; a ScrollBar on it", async function () {
    const before = getDefaultContainerBox();
    const objectBefore = Label({ left: -500, top: 0, text: "Before" });
    const area = ScrollArea({ gap: 4, padding: 10 });
    const isThat = (that === area && prevThat === objectBefore);
        const rows = [];
        for (let i = 0; i < 60; i++) rows.push(Label({ text: "Row " + i }));
    endGroup();
    const isClosed = (getDefaultContainerBox() === before);
    const place = scrollAreaPlaceIn(area);
    const isWindow = (place === "0,0," + window.innerWidth + "," + window.innerHeight);
    const isInContent = (rows[0].containerBox === area.content && area.content.containerBox === area.scrollBox);
    const scrolls = (area.scrollBox.elem.scrollHeight > area.scrollBox.elem.clientHeight);
    const hasBar = (area.scrollBar !== null && area.scrollBar.containerBox === area);
    check("ScrollArea: on the page it fills the window; endGroup() goes back to the page; that is the area; a ScrollBar on it",
        isThat && isClosed && isWindow && isInContent && scrolls && hasBar && area.scrollY === 1 && area.scrollX === 0,
        [isThat, isClosed, place, isInContent, scrolls, hasBar, area.scrollY, area.scrollX].join(" | "));
    area.remove();
    objectBefore.remove();
});

test("ScrollArea: in a VGroup it takes the height the other objects leave, in an HGroup the width; a size of its own wins", async function () {
    const frame = startBox(0, 0, 400, 300, { color: "white" });
        const column = VGroup({ gap: 0, align: "left top" });
            Box({ width: "100%", height: 50 });
            const middle = ScrollArea();
                for (let i = 0; i < 30; i++) Label({ text: "Row " + i });
            endGroup();
            const footer = Box({ width: "100%", height: 40 });
        endGroup();
    endBox();
    const rowFrame = startBox(0, 0, 400, 200, { color: "white" });
        HGroup({ gap: 0 });
            Box({ width: 100, height: "100%" });
            const side = ScrollArea();
            endGroup();
        endGroup();
    endBox();
    const ownFrame = startBox(0, 0, 400, 300, { color: "white" });
        VGroup({ gap: 0, align: "left top" });
            const own = ScrollArea({ height: 120 });
            endGroup();
            const under = Box({ width: "100%", height: 30 });
        endGroup();
    endBox();
    const places = [
        scrollAreaPlaceIn(middle, frame), scrollAreaPlaceIn(footer, frame),
        scrollAreaPlaceIn(side, rowFrame),
        scrollAreaPlaceIn(own, ownFrame), scrollAreaPlaceIn(under, ownFrame),
    ];
    const isFooterInColumn = (footer.containerBox === column);
    check("ScrollArea: in a VGroup it takes the height the other objects leave, in an HGroup the width; a size of its own wins",
        places.join(" ") === "0,50,400,210 0,260,400,40 100,0,300,200 0,0,400,120 0,120,400,30" && isFooterInColumn,
        places.join(" ") + " | " + isFooterInColumn);
    frame.remove();
    rowFrame.remove();
    ownFrame.remove();
});

test("ScrollArea: endGroup() goes back to the box that was open: in createIn(), in another ScrollArea, in a component", async function () {
    const before = getDefaultContainerBox();
    const holder = Box({ left: -900, top: 0, width: 300, height: 300 });
    const afterInHolder = createIn(holder, function () {
        ScrollArea();
            Label({ text: "In the area" });
        endGroup();
        return Label({ text: "After the area" });
    });
    const outer = ScrollArea({ left: -900, width: 300, height: 300 });
        const inner = ScrollArea({ height: 100 });
            Label({ text: "In the inner one" });
        endGroup();
        const afterInner = Label({ text: "After the inner one" });
    endGroup();
    const panel = SidePanel({ titleText: "Panel" });
    panel.startBody();
        const inPanel = ScrollArea({ height: 100 });
        endGroup();
        const afterInPanel = Label({ text: "After it" });
    panel.endBody();
    const isClosed = (getDefaultContainerBox() === before);
    check("ScrollArea: endGroup() goes back to the box that was open: in createIn(), in another ScrollArea, in a component",
        afterInHolder.containerBox === holder && afterInner.containerBox === outer.content && inner.containerBox === outer.content &&
        afterInPanel.containerBox === inPanel.containerBox && inPanel.containerBox !== page && isClosed,
        [afterInHolder.containerBox === holder, afterInner.containerBox === outer.content, afterInPanel.containerBox === inPanel.containerBox, isClosed].join(" | "));
    holder.remove();
    outer.remove();
    panel.remove();
});

test("ScrollArea: scrollX: 1 makes the content as wide as its objects; scrollY: 0 does not scroll down; setScrollX(), setScrollY()", async function () {
    const area = ScrollArea({ left: 0, top: 0, width: 200, height: 100, scrollX: 1, scrollY: 0 });
        HGroup({ hug: 1, gap: 8 });
            for (let i = 0; i < 10; i++) Box({ width: 60, height: 60 });
        endGroup();
    endGroup();
    const elem = area.scrollBox.elem;
    const sideways = [elem.scrollWidth, getComputedStyle(elem).overflowX, getComputedStyle(elem).overflowY, area.scrollX, area.scrollY].join(",");
    elem.scrollLeft = 50;
    area.setScrollY(1);
    const down = [getComputedStyle(elem).overflowY, area.scrollY].join(",");
    area.setScrollX(0);
    const contentWidth = Math.round(area.content.elem.getBoundingClientRect().width);
    const notSideways = [getComputedStyle(elem).overflowX, elem.scrollLeft, contentWidth, area.scrollX].join(",");
    check("ScrollArea: scrollX: 1 makes the content as wide as its objects; scrollY: 0 does not scroll down; setScrollX(), setScrollY()",
        sideways === "672,auto,hidden,1,0" && down === "auto,1" && notSideways === "hidden,0,200,0", [sideways, down, notSideways].join(" | "));
    area.remove();
});

test("ScrollArea: with scrollX: 1 a wrap still wraps at the width of the area, and a wide object in the middle is not cut on the left", async function () {
    const wrapping = ScrollArea({ left: 0, top: 0, width: 300, height: 200, scrollX: 1, padding: 10 });
        const row = HGroup({ hug: 1, gap: 10, wrap: 1 });
            for (let i = 0; i < 6; i++) Box({ width: 80, height: 30 });
        endGroup();
    endGroup();
    const rowHeight = Math.round(row.elem.getBoundingClientRect().height);
    const wrapElem = wrapping.scrollBox.elem;
    const hasNoSideScroll = (wrapElem.scrollWidth === wrapElem.clientWidth);
    const centered = ScrollArea({ left: 0, top: 0, width: 300, height: 200, scrollX: 1, align: "center top", padding: 10 });
        const wide = Box({ width: 500, height: 40 });
    endGroup();
    const wideLeft = scrollAreaPlaceIn(wide, centered).split(",")[0];
    const sideWidth = centered.scrollBox.elem.scrollWidth;
    const pointers = [getComputedStyle(centered.elem).pointerEvents, getComputedStyle(centered.scrollBox.elem).pointerEvents].join(",");
    check("ScrollArea: with scrollX: 1 a wrap still wraps at the width of the area, and a wide object in the middle is not cut on the left",
        rowHeight === 70 && hasNoSideScroll && wideLeft === "10" && sideWidth === 520 && pointers === "none,auto",
        [rowHeight, hasNoSideScroll, wideLeft, sideWidth, pointers].join(" | "));
    wrapping.remove();
    centered.remove();
});

test("ScrollArea: scrollToEnd(), scrollToTop(), scrollToObject(), getScrollTop() / setScrollTop(), onScroll(self)", async function () {
    let scrolledBy = null;
    const area = ScrollArea({ left: 0, top: 0, width: 200, height: 100, onScroll: function (self) { scrolledBy = self; } });
        const rows = [];
        for (let i = 0; i < 30; i++) rows.push(Label({ text: "Row " + i, height: 20 }));
    endGroup();
    const elem = area.scrollBox.elem;
    const end = elem.scrollHeight - elem.clientHeight;
    area.scrollToEnd();
    const isAtEnd = (area.getScrollTop() === end);
    await wait(100); // WHY: the browser sends the scroll event with the next frame
    const isEventSelf = (scrolledBy === area);
    area.scrollToTop();
    const isAtTop = (area.getScrollTop() === 0);
    area.scrollToObject(rows[10]);
    const bottomOfRow = Math.round(rows[10].elem.getBoundingClientRect().bottom - elem.getBoundingClientRect().top);
    area.scrollToObject(rows[2]);
    const topOfRow = Math.round(rows[2].elem.getBoundingClientRect().top - elem.getBoundingClientRect().top);
    area.setScrollTop(37);
    check("ScrollArea: scrollToEnd(), scrollToTop(), scrollToObject(), getScrollTop() / setScrollTop(), onScroll(self)",
        isAtEnd && isEventSelf && isAtTop && bottomOfRow === 100 && topOfRow === 0 && area.getScrollTop() === 37,
        [isAtEnd, isEventSelf, isAtTop, bottomOfRow, topOfRow, area.getScrollTop()].join(" | "));
    area.remove();
});

test("ScrollArea: align, gap and padding are the ones of the content (not of the area); a short content in the middle, a tall one not cut", async function () {
    const area = ScrollArea({ left: 0, top: 0, width: 200, height: 150, align: "center center", gap: 6, padding: [10, 8] });
        const first = Label({ text: "First", height: 20 });
    endGroup();
    const content = getComputedStyle(area.content.elem);
    const ownPadding = getComputedStyle(area.elem).paddingLeft;
    const look = [content.alignItems, content.justifyContent, content.rowGap, content.paddingLeft, content.paddingTop, ownPadding].join(",");
    const middle = scrollAreaPlaceIn(first, area);
    createIn(area.content, function () {
        for (let i = 0; i < 20; i++) Label({ text: "Row " + i, height: 20 });
    });
    const tallTop = scrollAreaPlaceIn(first, area);
    area.setGap(10);
    area.setPadding(4);
    area.setAlign("left top");
    const changed = [content.rowGap, content.paddingTop, getComputedStyle(area.elem).paddingTop, area.padding, content.alignItems].join(",");
    check("ScrollArea: align, gap and padding are the ones of the content (not of the area); a short content in the middle, a tall one not cut",
        look === "center,center,6px,10px,8px,0px" && middle.split(",")[1] === "65" && tallTop.split(",")[1] === "8" && changed === "10px,4px,0px,4,flex-start",
        [look, middle, tallTop, changed].join(" | "));
    area.remove();
});

test("ScrollArea: remove() takes its ScrollBar; useScrollBar: 0 makes none; the bar of dark and minimal; MinimalAccent gives it a color's packages", async function () {
    const area = ScrollArea({ left: 0, top: 0, width: 100, height: 100 });
    endGroup();
    const barElem = area.scrollBar.elem;
    area.remove();
    const isBarGone = (!barElem.isConnected);
    const plain = ScrollArea({ left: 0, top: 0, width: 100, height: 100, useScrollBar: 0 });
    endGroup();
    const isNoBar = (plain.scrollBar === null);
    plain.remove();
    const dark = ScrollArea({ left: 0, top: 0, width: 100, height: 100, styleName: "dark" });
    endGroup();
    const minimal = ScrollArea({ left: 0, top: 0, width: 100, height: 100, styleName: "minimal" });
    endGroup();
    const bars = [dark.scrollBar.bar_color, minimal.scrollBar.bar_width, minimal.scrollBar.showDots].join(",");
    dark.remove();
    minimal.remove();
    MinimalAccent.addPackages("minimalTestArea", "#2A78D6");
    const accent = ScrollArea.styles.minimalTestArea;
    const hasAccent = (!!accent && accent.scrollBar.bar_width === 3 && !!ScrollArea.styles.minimalTestAreaDark);
    check("ScrollArea: remove() takes its ScrollBar; useScrollBar: 0 makes none; the bar of dark and minimal; MinimalAccent gives it a color's packages",
        isBarGone && isNoBar && bars === "#CFCFCD,3,0" && hasAccent, [isBarGone, isNoBar, bars, hasAccent].join(" | "));
});

// *** ACCORDION (comp/accordion.js)

test("Accordion: a click and the keys open and close, onToggle says which; a disabled section does not; silent", async function () {
    const toggled = [];
    const one = Accordion({
        left: 0, top: 0, width: 300,
        sections: [{ key: "a", text: "A" }, { key: "b", text: "B", opened: 1 }, { key: "c", text: "C", enabled: 0 }],
        onToggle: function (self, section) { toggled.push(section.key + section.opened); },
    });
    const rows = one.elem.querySelectorAll('[role="button"]');
    const startKeys = one.getOpenKeys().join();
    rows[0].click();
    const afterClick = one.isOpen("a");
    key(rows[0], "keydown", "Enter");
    const afterEnter = one.isOpen("a");
    key(rows[0], "keydown", " ");
    const expanded = rows[0].getAttribute("aria-expanded");
    rows[2].click();
    key(rows[2], "keydown", "Enter");
    const disabledStays = one.isOpen("c") === 0 && rows[2].tabIndex === -1;
    rows[0].focus();
    key(rows[0], "keydown", "ArrowDown");
    const afterDown = (document.activeElement === rows[1]);
    key(rows[1], "keydown", "ArrowDown"); // the disabled row is passed over: it stays on the last one that can
    const stays = (document.activeElement === rows[1]);
    key(rows[1], "keydown", "Home");
    const afterHome = (document.activeElement === rows[0]);
    const toggledByUser = toggled.join();
    one.close("b", 1);
    one.open("c", 1); // code can open a disabled section
    const isRight = startKeys === "b" && afterClick === 1 && afterEnter === 0 && expanded === "true" && disabledStays
        && afterDown && stays && afterHome && toggledByUser === "a1,a0,a1" && toggled.length === 3 && one.getOpenKeys().join() === "a,c";
    check("Accordion: a click and the keys open and close, onToggle says which; a disabled section does not; silent", isRight,
        [startKeys, afterClick, afterEnter, expanded, disabledStays, afterDown, stays, afterHome, toggled.join(), one.getOpenKeys().join()].join(" | "));
    one.remove();
});

test("Accordion: multiple: 0: a section that opens closes the others, and only one is open at the start", async function () {
    const toggled = [];
    const one = Accordion({
        left: 0, top: 0, width: 300, multiple: 0,
        sections: [{ key: "a", text: "A", opened: 1 }, { key: "b", text: "B", opened: 1 }, "C"],
        onToggle: function (self, section) { toggled.push(section.key + section.opened); },
    });
    const atStart = one.getOpenKeys().join();
    one.open("C");
    const afterOpen = one.getOpenKeys().join();
    one.openAll();
    check("Accordion: multiple: 0: a section that opens closes the others, and only one is open at the start",
        atStart === "a" && afterOpen === "C" && toggled.join() === "a0,C1" && one.getOpenKeys().join() === "C",
        atStart + " | " + afterOpen + " | " + toggled.join());
    one.remove();
});

test("Accordion: a closed section keeps its objects in its flow, out of sight and out of the reach of the keyboard", async function () {
    const one = Accordion({ left: 0, top: 0, width: 300, sections: ["A", "B"] });
    const closedHeight = one.elem.offsetHeight;
    const field = createIn(one.getContent("A"), function () { return Input({ width: 120, height: 30 }); });
    const frame = one.getContent("A").elem.parentElement;
    const isOutOfReach = frame.hasAttribute("inert") && frame.offsetHeight === 0 && one.elem.offsetHeight === closedHeight;
    const keepsItsSize = (field.elem.offsetWidth === 120 && one.getContent("A").elem.offsetHeight > 30);
    const isInFlow = (getComputedStyle(field.elem).position === "relative");
    one.open("A");
    const isOpenNow = !frame.hasAttribute("inert") && frame.offsetHeight > 30 && one.elem.offsetHeight > closedHeight + 30;
    one.close("A");
    const isBack = frame.offsetHeight === 0 && one.elem.offsetHeight === closedHeight;
    check("Accordion: a closed section keeps its objects in its flow, out of sight and out of the reach of the keyboard",
        isOutOfReach && keepsItsSize && isInFlow && isOpenNow && isBack,
        [isOutOfReach, keepsItsSize, isInFlow, isOpenNow, isBack].join(" | "));
    one.remove();
});

test("Accordion: startSection / endSection: a group in it goes back to the section, and the page goes on where it was", async function () {
    const holder = startBox(0, 0, 300, 300, { color: "transparent" });
        const one = Accordion({ width: 300, sections: ["A"] });
        one.startSection("A");
            HGroup({ hug: 1 });
                const inGroup = Label({ text: "In a group" });
            endGroup();
            const afterGroup = Label({ text: "After the group" });
        one.endSection();
        const outside = Label({ text: "Outside" });
    endBox();
    const content = one.getContent("A").elem;
    const made = one.startSection("New");
    one.endSection();
    const isRight = content.contains(inGroup.elem) && content.contains(afterGroup.elem)
        && inGroup.elem.parentElement !== afterGroup.elem.parentElement
        && !one.elem.contains(outside.elem) && outside.elem.parentElement === holder.elem
        && one.getSection("New").text === "New" && one.getContent("New").elem.contains(made.elem);
    check("Accordion: startSection / endSection: a group in it goes back to the section, and the page goes on where it was", isRight, String(isRight));
    holder.remove();
});

test("Accordion: a section is added, changed and removed; its text is never HTML; a line only between the sections", async function () {
    const warn = console.warn;
    let warnings = 0;
    console.warn = function () { warnings++; };
    const one = Accordion({ left: 0, top: 0, width: 300, sections: ["A", "B"] });
    const lineShown = function () {
        return Array.from(one.list.elem.children).map(function (group) { return (group.children[0].offsetHeight > 0) ? 1 : 0; }).join("");
    };
    const atStart = lineShown();
    const twin = one.addSection("B");
    console.warn = warn;
    one.addSection({ key: "c", text: "C <b>bold</b>", description: "5 <i>files</i>" });
    const text = one.list.elem.innerText;
    const isPlain = text.includes("C <b>bold</b>") && text.includes("5 <i>files</i>");
    one.setSectionText("c", "New title");
    one.setSectionDescription("c", "");
    const changed = one.list.elem.innerText.includes("New title") && !one.list.elem.innerText.includes("files");
    one.removeSection("A");
    const afterRemove = lineShown();
    one.setSections([{ key: "x", text: "X", opened: 1 }]);
    const isRight = atStart === "01" && twin === null && warnings === 1 && isPlain && changed && afterRemove === "01"
        && one.getOpenKeys().join() === "x" && one.sections.length === 1;
    check("Accordion: a section is added, changed and removed; its text is never HTML; a line only between the sections", isRight,
        [atStart, twin, warnings, isPlain, changed, afterRemove, one.getOpenKeys().join()].join(" | "));
    one.remove();
});

test("Accordion: setTheme changes the look, and the open sections, their objects and a style of the page stay", async function () {
    const groundOf = (obj) => getComputedStyle(obj.elem).backgroundColor;
    const one = Accordion({ left: 0, top: 0, width: 300, sections: [{ key: "a", text: "A", opened: 1 }] });
    const own = Accordion({ left: 0, top: 0, width: 300, sections: ["A"], style: { box: { color: "rgb(1, 2, 3)" } } });
    const field = createIn(one.getContent("a"), function () { return Label({ text: "Stays" }); });
    const light = groundOf(one);
    one.setTheme("dark");
    own.setTheme("dark");
    const isRight = light === "rgb(255, 255, 255)" && groundOf(one) === "rgb(35, 35, 34)" && groundOf(own) === "rgb(1, 2, 3)"
        && one.isOpen("a") === 1 && field.elem.isConnected;
    check("Accordion: setTheme changes the look, and the open sections, their objects and a style of the page stay", isRight,
        [light, groundOf(one), groundOf(own), one.isOpen("a")].join(" | "));
    one.remove();
    own.remove();
});

test("Accordion: animated: the arrow turns and the objects fade; animated: 0 writes nothing; setAnimated(0) writes the still look back", async function () {
    const still = Accordion({ left: 0, top: 0, width: 300, sections: ["A"] });
    const moving = Accordion({ left: 0, top: 0, width: 300, sections: ["A"], animated: 1 });
    await wait(300);
    const contentOf = (one) => one.getContent("A");
    const frameOf = (one) => contentOf(one).elem.parentElement;
    const arrowOf = (one) => one.list.elem.querySelector('[role="button"]').lastElementChild;
    const stillOpacity = getComputedStyle(contentOf(still).elem).opacity;
    const movingOpacity = getComputedStyle(contentOf(moving).elem).opacity;
    const hasMotion = arrowOf(moving).style.transition.includes("transform") && contentOf(moving).elem.style.transition.includes("opacity");
    const stillHasNone = (arrowOf(still).style.transition === "" && contentOf(still).elem.style.transition === "");
    moving.open("A");
    const openNow = (frameOf(moving).style.height === "auto");
    moving.close("A");
    const waitsToClose = (frameOf(moving).offsetHeight > 0);
    for (let i = 0; i < 40 && frameOf(moving).offsetHeight > 0; i++) await wait(25); // WHY: a busy page runs its timers late
    const closedNow = (frameOf(moving).offsetHeight === 0);
    moving.setAnimated(0);
    const isStillAgain = contentOf(moving).elem.style.opacity === "1" && contentOf(moving).elem.style.transform === "";
    const isRight = stillOpacity === "1" && movingOpacity === "0" && hasMotion && stillHasNone && openNow && waitsToClose && closedNow && isStillAgain;
    check("Accordion: animated: the arrow turns and the objects fade; animated: 0 writes nothing; setAnimated(0) writes the still look back", isRight,
        [stillOpacity, movingOpacity, hasMotion, stillHasNone, openNow, waitsToClose, closedNow, isStillAgain].join(" | "));
    still.remove();
    moving.remove();
});

test("Accordion: height \"auto\" grows with its sections; a fixed height scrolls them inside", async function () {
    const sections = ["A", "B", "C", "D", "E", "F"];
    const auto = Accordion({ left: 0, top: 0, width: 300, sections: sections });
    const fixed = Accordion({ left: 0, top: 0, width: 300, height: 120, sections: sections });
    await wait(50);
    const autoHeight = auto.elem.offsetHeight;
    const isRight = autoHeight > 240 && !auto.scrollBar && fixed.elem.offsetHeight === 120
        && fixed.listArea.elem.scrollHeight > fixed.listArea.elem.clientHeight && !!fixed.scrollBar;
    check("Accordion: height \"auto\" grows with its sections; a fixed height scrolls them inside", isRight,
        [autoHeight, fixed.elem.offsetHeight, fixed.listArea ? fixed.listArea.elem.scrollHeight : "no area"].join(" | "));
    auto.remove();
    fixed.remove();
});

test("Splitter: px stay px and a part stays a part when the box changes; the limits hold", async function () {
    const fixed = Splitter({ left: 0, top: 0, width: 601, height: 200, firstSize: 200, minFirst: 50, minSecond: 100 });
    const isFixedRight = fixed.first.elem.offsetWidth === 200 && fixed.second.elem.offsetLeft === 201 && fixed.second.elem.offsetWidth === 400;
    fixed.width = 401;
    await wait(40);
    const keepsPixels = fixed.getFirstSize() === 200 && fixed.second.elem.offsetWidth === 200;
    fixed.width = 251;
    await wait(40);
    const keepsSecondMin = fixed.second.elem.offsetWidth === 100 && fixed.getFirstSize() === 150;
    fixed.remove();
    const part = Splitter({ left: 0, top: 0, width: 501, height: 200, firstSize: "40%" });
    const isPartRight = part.getFirstSize() === 200;
    part.width = 1001;
    await wait(40);
    const keepsPart = part.getFirstSize() === 400;
    part.remove();
    const second = Splitter({ left: 0, top: 0, width: 300, height: 501, direction: "vertical", secondSize: 100 });
    const isSecondRight = second.second.elem.offsetHeight === 100 && second.first.elem.offsetHeight === 400 && second.second.elem.offsetTop === 401;
    second.height = 701;
    await wait(40);
    const keepsSecond = second.second.elem.offsetHeight === 100 && second.first.elem.offsetHeight === 600;
    second.remove();
    check("Splitter: px stay px and a part stays a part when the box changes; the limits hold",
        isFixedRight && keepsPixels && keepsSecondMin && isPartRight && keepsPart && isSecondRight && keepsSecond,
        [isFixedRight, keepsPixels, keepsSecondMin, isPartRight, keepsPart, isSecondRight, keepsSecond].join(" "));
});

test("Splitter: a drag moves the line inside its limits and tells onChange and onChangeEnd; a part stays a part", async function () {
    let changes = 0;
    let ends = 0;
    const split = Splitter({
        left: 0, top: 0, width: 501, height: 200, firstSize: "50%", minFirst: 100, minSecond: 100,
        onChange: function () { changes++; }, onChangeEnd: function () { ends++; },
    });
    const atFirst = split.getFirstSize();
    dragOf(split.grip.elem, 250, 50, 300, 50);
    const moved = split.getFirstSize() === atFirst + 50 && split.first.elem.offsetWidth === 300;
    const told = changes === 1 && ends === 1;
    dragOf(split.grip.elem, 300, 50, 900, 50);
    const stopsAtMax = split.getFirstSize() === 400;
    dragOf(split.grip.elem, 400, 50, -900, 50);
    const stopsAtMin = split.getFirstSize() === 100;
    pointer(split.grip.elem, "pointermove", 400, 50);
    const stopsAfterUp = split.getFirstSize() === 100;
    split.width = 1001;
    await wait(40);
    const isStillPart = split.getFirstSize() === 200; // 100 of 500 is 20%, of 1000 it is 200
    const lineStaysOn = split.grip.elem.offsetLeft < 200 && split.grip.elem.offsetLeft + split.grip.elem.offsetWidth > 200;
    check("Splitter: a drag moves the line inside its limits and tells onChange and onChangeEnd; a part stays a part",
        moved && told && stopsAtMax && stopsAtMin && stopsAfterUp && isStillPart && lineStaysOn,
        [moved, told, stopsAtMax, stopsAtMin, stopsAfterUp, isStillPart, lineStaysOn, split.getFirstSize()].join(" "));
    split.remove();
});

test("Splitter: the keys and a double click; setFirstSize silent; a hidden area gives its place; objects go into the areas", async function () {
    let changes = 0;
    const split = Splitter({ left: 0, top: 0, width: 501, height: 200, firstSize: 200, keyStep: 10, onChange: function () { changes++; } });
    key(split.grip.elem, "keydown", "ArrowRight");
    const forward = split.getFirstSize() === 210;
    key(split.grip.elem, "keydown", "ArrowLeft");
    key(split.grip.elem, "keydown", "ArrowLeft");
    const back = split.getFirstSize() === 190;
    key(split.grip.elem, "keydown", "ArrowUp"); // not the direction of this one
    const otherKey = split.getFirstSize() === 190;
    key(split.grip.elem, "keydown", "End");
    const toEnd = split.getFirstSize() === 500 - split.minSecond;
    key(split.grip.elem, "keydown", "Home");
    const toHome = split.getFirstSize() === split.minFirst;
    key(split.grip.elem, "keydown", "Enter");
    const backToStart = split.getFirstSize() === 200;
    split.grip.elem.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    changes = 0;
    split.setFirstSize(300, 1);
    const silent = split.getFirstSize() === 300 && changes === 0;
    split.setFirstSize("20%");
    const notSilent = split.getFirstSize() === 100 && changes === 1;
    const isValueShown = split.grip.elem.getAttribute("aria-valuenow") === "20";
    split.setAreaVisible("first", 0);
    const hidden = split.first.elem.getClientRects().length === 0 && split.grip.elem.getClientRects().length === 0 && split.second.elem.offsetWidth === 501 && split.second.elem.offsetLeft === 0;
    split.setAreaVisible("first", 1);
    const shown = split.first.elem.offsetWidth === 100 && split.second.elem.offsetLeft === 101;
    const inside = createIn(split.second, function () { return Label({ text: "Inside" }); });
    const isInside = split.second.elem.contains(inside.elem) && inside.elem.offsetLeft === 0 && inside.elem.offsetTop === 0;
    check("Splitter: the keys and a double click; setFirstSize silent; a hidden area gives its place; objects go into the areas",
        forward && back && otherKey && toEnd && toHome && backToStart && silent && notSilent && isValueShown && hidden && shown && isInside,
        [forward, back, otherKey, toEnd, toHome, backToStart, silent, notSilent, isValueShown, hidden, shown, isInside].join(" "));
    split.remove();
});

test("Splitter: setTheme changes the line, and the sizes and a style of the page stay", async function () {
    const split = Splitter({ left: 0, top: 0, width: 501, height: 200, firstSize: 200, style: { lineHover: { color: "rgb(1, 2, 3)" } } });
    const lineColor = function () { return getComputedStyle(split.line.elem).backgroundColor; };
    const atFirst = lineColor();
    split.setTheme("dark");
    const changed = lineColor() !== atFirst && split.styleName === "dark" && split.getFirstSize() === 200;
    split.grip.elem.dispatchEvent(new MouseEvent("mouseenter"));
    const pageStyleStays = lineColor() === "rgb(1, 2, 3)";
    split.grip.elem.dispatchEvent(new MouseEvent("mouseleave"));
    split.setTheme("light");
    check("Splitter: setTheme changes the line, and the sizes and a style of the page stay", changed && pageStyleStays && lineColor() === atFirst, [changed, pageStyleStays, lineColor()].join(" "));
    split.remove();
});
