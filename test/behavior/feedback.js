/* Bismillah */

/*
BEHAVIOR TESTS: FEEDBACK
The tests of test/behavior-test.htm for what speaks to the user (Dialog, Tooltip, Toast, Notice, SidePanel, LoadingScreen, StatusBar).
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

// *** DIALOG (comp/dialog.js)

test("Dialog: onClick that closes the dialog does not crash", async function () {
    const dialog = Dialog({ removeOnClose: 1, buttons: [{ key: "a", text: "A", type: "primary", onClick: function (d) { d.close(); } }] });
    dialog.getButton("a").elem.click();
    await wait(30);
    check("Dialog: onClick that closes the dialog does not crash", Dialog.stack.length == 0);
});

test("Dialog.confirm: Promise(false), then Cancel gives false", async function () {
    const promise = Dialog.confirm({ onConfirm: function () { return Promise.resolve(false); } });
    await wait(30);
    Dialog.getTop().getButton("confirm").elem.click();
    await wait(30);
    Dialog.getTop().getButton("cancel").elem.click();
    check("Dialog.confirm: Promise(false), then Cancel gives false", (await promise) === false);
});

test("Dialog: topIconTone fills LIGHT and STRONG of the icon and colors its circle", async function () {
    const icon = '<svg viewBox="0 0 24 24"><rect width="20" height="20" fill="LIGHT"/><circle r="3" fill="STRONG"/><circle r="1" fill="CIRCLE"/><\/svg>';
    const dialog = Dialog({ variant: "centered", topIconTone: "green", topIconFile: icon, titleText: "Saved" });
    await wait(30);
    const html = dialog.iconArea.elem.innerHTML;
    const tone = Dialog.ICON_TONES.green;
    const isFilled = html.includes(tone.light) && html.includes(tone.strong) && html.includes(tone.circle) && !/LIGHT|STRONG|CIRCLE/.test(html);
    const circleColor = dialog.iconArea.elem.firstElementChild.style.backgroundColor;
    check("Dialog: topIconTone fills LIGHT and STRONG of the icon and colors its circle", isFilled && circleColor === "rgb(238, 247, 235)", "filled: " + isFilled + ", circle: " + circleColor);
    dialog.close("api");
});

test("Dialog: a held Enter in a field does not pass the ask", async function () {
    let deleted = 0;
    const dialog = Dialog({ fields: [{ key: "n", titleText: "N" }], buttons: [{ key: "del", text: "Delete", type: "primary", ask: "Sure?", onClick: function () { deleted = 1; } }] });
    const input = dialog.elem.querySelector("input");
    input.focus();
    key(input, "keydown", "Enter");
    key(input, "keydown", "Enter", { repeat: true });
    check("Dialog: a held Enter in a field does not pass the ask", deleted === 0);
    dialog.remove();
});

test("Dialog: the ask is forgotten when the dialog closes", async function () {
    let deleted = 0;
    const dialog = Dialog({ removeOnClose: 0, buttons: [{ key: "del", text: "Delete", type: "danger", ask: "Sure?", onClick: function () { deleted = 1; } }] });
    dialog.getButton("del").elem.click(); // asks
    dialog.close();
    dialog.open();
    dialog.getButton("del").elem.click(); // must ask again
    check("Dialog: the ask is forgotten when the dialog closes", deleted === 0);
    dialog.remove();
});

test("Dialog.prompt and Dialog.alert use the style they are given", async function () {
    const CARD_COLOR = "rgb(35, 35, 34)";
    const style = { card: { color: CARD_COLOR } };
    const promptPromise = Dialog.prompt({ titleText: "Name", style: style });
    await wait(30);
    const promptCard = Dialog.stack[Dialog.stack.length - 1].card;
    const promptOk = getComputedStyle(promptCard.elem).backgroundColor === CARD_COLOR;
    findByText("Cancel").click();
    await promptPromise;
    await wait(300);
    const alertPromise = Dialog.alert({ titleText: "Done", style: style });
    await wait(30);
    const alertCard = Dialog.stack[Dialog.stack.length - 1].card;
    const alertOk = getComputedStyle(alertCard.elem).backgroundColor === CARD_COLOR;
    findByText("OK").click();
    await alertPromise;
    await wait(300);
    check("Dialog.prompt and Dialog.alert use the style they are given", promptOk && alertOk, "prompt " + promptOk + ", alert " + alertOk);
});

// *** TOOLTIP (comp/tooltip.js)

test("Tooltip: Escape closes the popover once, and its window events go with it", async function () {
    const target = Button({ text: "Open" });
    let closeCount = 0;
    const bubble = Tooltip.openPopover(target, function () { Label({ text: "A" }); }, {}, "bottom", "", { onClose: function () { closeCount++; } });
    await wait(30);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    const isClosed = bubble._isRemoved && Tooltip.openedPopover === null;
    check("Tooltip: Escape closes the popover once, and its window events go with it", isClosed && closeCount === 1, "closed: " + isClosed + ", onClose: " + closeCount);
    target.remove();
});

test("Tooltip: the color of look stays while the mouse moves", async function () {
    // WHY: a hint left by an earlier test would be the one moved here
    if (window.lblHint) window.lblHint.remove();
    window.lblHint = null;
    const target = Button({ text: "Hint" });
    const tip = Tooltip({ target: target, look: { color: "rgb(35, 35, 35)" }, content: function () { Label({ text: "A", textColor: "white" }); } });
    target.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 10, clientY: 10 }));
    target.elem.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 12, clientY: 12 }));
    const color = window.lblHint ? window.lblHint.elem.style.backgroundColor : "";
    check("Tooltip: the color of look stays while the mouse moves", color == "rgb(35, 35, 35)", "color: " + color);
    tip.remove();
    target.remove();
});

test("Tooltip.show: the bubble goes with its target when a box scrolls, and hides out of sight", async function () {
    const scrollBox = startBox(0, 0, 200, 200, { scrollY: 1 });
        const target = Button(20, 150, 80, 30, { text: "Ask" });
        Box(0, 0, 10, 1000);
    endBox();
    const bubble = Tooltip.show(target, "Click again");
    const topBefore = bubble.top;
    scrollBox.elem.scrollTop = 40;
    await wait(60);
    const moved = Math.round(topBefore - bubble.top);
    scrollBox.elem.scrollTop = 400;
    await wait(60);
    const isHidden = !bubble.visible;
    check("Tooltip.show: the bubble goes with its target when a box scrolls, and hides out of sight", moved === 40 && isHidden, "moved: " + moved + ", hidden: " + isHidden);
    bubble.remove();
    scrollBox.remove();
});

// *** NOTICE (comp/notice.js)

test("Notice over a Dialog: it is on top, Escape closes only the notice", async function () {
    const dialog = Dialog({ titleText: "D", removeOnClose: 0 });
    Notice.show({ messageText: "Saved", displayTime: 0 });
    await wait(30);
    const rect = Notice.current.elem.getBoundingClientRect();
    const isOnTop = Notice.current.elem.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2));
    key(document.activeElement || document.body, "keydown", "Escape");
    check("Notice over a Dialog: it is on top, Escape closes only the notice", isOnTop && !Notice.current && dialog.isOpen());
    dialog.remove();
});

// *** TOAST (comp/toast.js)

test("Toast: a double click on the action runs it once", async function () {
    let count = 0;
    const toast = Toast.info("File deleted", { action: { text: "Undo", onClick: function () { count++; } } });
    await wait(30);
    toast.btnAction.elem.click();
    toast.btnAction.elem.click();
    await wait(400);
    check("Toast: a double click on the action runs it once", count === 1, "the action ran " + count + " times");
});

test("Toast: offsetTop moves the toasts down, the sides keep offset", async function () {
    const toast = Toast.info("Saved");
    await wait(30);
    Toast.setOptions({ offsetTop: 80 });
    const style = Toast.getContainer(Toast.options.position).elem.style;
    const isRight = style.top === "80px" && style.maxWidth === "calc(100% - " + (Toast.options.offset * 2) + "px)";
    Toast.setOptions({ offsetTop: null });
    check("Toast: offsetTop moves the toasts down, the sides keep offset", isRight, "top: " + style.top + ", maxWidth: " + style.maxWidth);
    toast.close();
});

test("Toast: a styleName warns once and changes nothing, theme gives the colors", async function () {
    const themeOfPage = Toast.options.theme;
    Toast.setOptions({ theme: "light" }); // WHY: "auto" would follow the system of the test machine
    const warn = console.warn;
    let warnings = 0;
    console.warn = function () { warnings++; };
    const wrong = Toast.show({ messageText: "Saved", duration: 0, styleName: "dark" });
    const right = Toast.show({ messageText: "Saved", duration: 0, theme: "dark" });
    console.warn = warn;
    await wait(30);
    const isRight = warnings === 1 && wrong.theme === null && right.theme === "dark"
        && wrong.card.color !== right.card.color;
    check("Toast: a styleName warns once and changes nothing, theme gives the colors", isRight,
        [warnings, wrong.theme, right.theme, wrong.card.color, right.card.color].join(" | "));
    wrong.close();
    right.close();
    Toast.setOptions({ theme: themeOfPage });
});

// *** TOOLTIP (comp/tooltip.js)

test("Tooltip: a new text keeps the arrow at the mouse", async function () {
    const target = Box(100, 100, 120, 40);
    const other = Box(300, 100, 120, 40);
    const tooltip = Tooltip({ target: target, hintText: "A long text for a wide bubble", lbl_arrow: 10 });
    const otherTooltip = Tooltip({ target: other, hintText: "Other" });
    const mouseX = 160;
    const mouse = (object, name) => object.elem.dispatchEvent(new MouseEvent(name, { bubbles: true, clientX: mouseX, clientY: 120 }));

    tooltip.setHintText("Before the mouse moves");
    mouse(target, "mouseover");
    tooltip.setHintText("No move yet");
    mouse(target, "mousemove");
    tooltip.setHintText("Saved");
    const bubble = window.lblHint.elem.getBoundingClientRect();
    const arrow = window.lblHint.arrow.elem.getBoundingClientRect();
    const arrowMiddle = arrow.left + arrow.width / 2;
    check("Tooltip: the bubble goes to the mouse with its new text", Math.abs(bubble.left + bubble.width / 2 - mouseX) < 2, bubble.left);
    check("Tooltip: the arrow stays in the bubble", arrowMiddle > bubble.left && arrowMiddle < bubble.right, arrowMiddle);

    otherTooltip.setHintText("Late");
    check("Tooltip: a late call does not write on another bubble", window.lblHint.label.text === "Saved", window.lblHint.label.text);

    mouse(target, "mouseout");
    [tooltip, otherTooltip, target, other].forEach((object) => object.remove());
});

// *** LOADING SCREEN (comp/loading-screen.js; it took the place of comp/waiting.js, 2026-10-31)

test("LoadingScreen: open() right after close() stays", async function () {
    const loading = LoadingScreen({ opened: 0, minDuration: 0, fadeDuration: 0.2 });
    loading.open();
    await wait(50);
    loading.close();
    loading.open();
    await wait(600);
    check("LoadingScreen: open() right after close() stays", loading.visible == 1 && loading.opacity == 1);
    loading.remove();
});

// *** SIDE PANEL (comp/side-panel.js)

test("SidePanel: with a zoomed page (page.fit) it is sized in the px of the page", async function () {
    const ZOOM = 2.5;
    page.zoom = ZOOM;
    const panel = SidePanel({ side: "right", panelSize: 450, screenMargin: 60 });
    const expectedWidth = Math.min(450, page.width - 60);
    const width = panel.width;
    page.zoom = 1;
    panel.remove();
    check("SidePanel: with a zoomed page (page.fit) it is sized in the px of the page", Math.abs(width - expectedWidth) < 1, "width: " + width + ", expected: " + expectedWidth);
});

test("SidePanel: a panel opened right after it is made still slides in", async function () {
    const SLIDE_WAIT = 600; // ms: the duration of the panel and some room
    const panel = SidePanel({ side: "right", panelSize: 300, duration: 400 });
    // WHY the event, not the place after two frames: a slow page reads the place before the slide has moved
    //     it (300), though it slides; a panel that shows at once has no transition at all
    let isSliding = false;
    panel.elem.addEventListener("transitionrun", function (event) {
        if (event.propertyName === "transform") isSliding = true;
    });
    panel.open(); // WHY: in the same moment as its making (a sheet made by a click)
    const start = performance.now();
    while (!isSliding && performance.now() - start < SLIDE_WAIT) await basic.nextFrame();
    const movedPart = new DOMMatrix(getComputedStyle(panel.elem).transform).m41; // translateX: 300 closed, 0 open
    panel.remove();
    check("SidePanel: a panel opened right after it is made still slides in", isSliding, "a transition of transform: " + isSliding + ", translateX then: " + movedPart);
});

test("SidePanel: container: it is made in the box, covers only the box and follows its size", async function () {
    const column = Box(0, 0, 400, 300, { color: "white" });
    const panel = SidePanel({ container: column, side: "right", panelSize: 300, screenMargin: 60 });
    panel.open();
    await wait(50);
    const backdrop = panel.elem.previousElementSibling;
    const isInBox = panel.elem.parentElement === column.elem && backdrop.parentElement === column.elem;
    const backdropRect = backdrop.getBoundingClientRect();
    const isOverBox = backdropRect.width === 400 && backdropRect.height === 300;
    const widthBefore = panel.width;
    column.width = 200; // WHY: not a resize of the window: the panel follows the box itself (300 -> 200 - 60)
    await wait(100);
    const widthAfter = panel.width;
    panel.remove();
    const isCleaned = column.elem.children.length === 0 && SidePanel.openedPanel === null;
    column.remove();
    check("SidePanel: container: it is made in the box, covers only the box and follows its size", isInBox && isOverBox && widthBefore === 300 && widthAfter === 140 && isCleaned, "in the box: " + isInBox + ", backdrop: " + backdropRect.width + " x " + backdropRect.height + ", width: " + widthBefore + " -> " + widthAfter + ", cleaned: " + isCleaned);
});

test("SidePanel: style.panel.round rounds only the corners that face the page", async function () {
    const corners = {};
    ["right", "left", "bottom", "top"].forEach(function (side) {
        const panel = SidePanel({ side: side, style: { panel: { round: 13 } } });
        corners[side] = getComputedStyle(panel.elem).borderRadius;
        panel.remove();
    });
    const plainPanel = SidePanel({ side: "right" });
    const plainCorners = getComputedStyle(plainPanel.elem).borderRadius;
    plainPanel.remove();
    const isRight = corners.right === "13px 0px 0px 13px" && corners.left === "0px 13px 13px 0px" && corners.bottom === "13px 13px 0px 0px" && corners.top === "0px 0px 13px 13px" && plainCorners === "0px";
    check("SidePanel: style.panel.round rounds only the corners that face the page", isRight, JSON.stringify(corners) + ", round 0: " + plainCorners);
});

test("SidePanel: fade 0 only slides (its opacity stays 1 while it opens)", async function () {
    const panel = SidePanel({ side: "right", fade: 0 });
    const fadingPanel = SidePanel({ side: "left", exclusive: 0 }); // the default: fade 1
    await wait(60); // WHY: setMotion() puts the transition on after a moment
    panel.open();
    fadingPanel.open();
    const opacities = [getComputedStyle(panel.elem).opacity];
    const fadingStart = getComputedStyle(fadingPanel.elem).opacity;
    await basic.nextFrame();
    await basic.nextFrame();
    opacities.push(getComputedStyle(panel.elem).opacity);
    const fadingMiddle = getComputedStyle(fadingPanel.elem).opacity;
    await wait(100);
    opacities.push(getComputedStyle(panel.elem).opacity);
    const transition = getComputedStyle(panel.elem).transitionProperty;
    panel.remove();
    fadingPanel.remove();
    const isSlideOnly = opacities.every(function (opacity) { return opacity === "1"; }) && transition.indexOf("opacity") === -1;
    check("SidePanel: fade 0 only slides (its opacity stays 1 while it opens)", isSlideOnly && fadingStart === "0" && Number(fadingMiddle) < 1, "fade 0: " + opacities.join(" / ") + " (" + transition + "), fade 1: " + fadingStart + " / " + fadingMiddle);
});

// *** STATUS BAR (comp/status-bar.js)

test("StatusBar: a message with a time goes back to the lasting one, a new message stops the old time", async function () {
    const bar = StatusBar({ messageText: "Ready" });
    bar.setMessageText("Saved", "success", 40);
    const during = bar.lblMessage.plainText + (bar.dot.elem.style.display !== "none" ? " dot" : "");
    await wait(90);
    const after = bar.lblMessage.plainText + " " + bar.messageTone + (bar.dot.elem.style.display === "none" ? "no dot" : "");
    bar.setMessageText("A", "", 40);
    bar.setMessageText("B");
    await wait(90);
    const lasting = bar.lblMessage.plainText;
    bar.setMessageText("C", "", 40);
    bar.setMessageText("D", "", 400);
    await wait(90);
    const newer = bar.lblMessage.plainText;
    check("StatusBar: a message with a time goes back to the lasting one, a new message stops the old time",
        during === "Saved dot" && after === "Ready no dot" && lasting === "B" && newer === "D", [during, after, lasting, newer].join(" | "));
    bar.remove();
});

test("StatusBar: a part with onClick is a button, the others are texts; a text is never HTML", async function () {
    let clicks = 0;
    const bar = StatusBar({
        items: [
            "UTF-8",
            { key: "zoom", text: "100%", onClick: function (self, part) { clicks += (self === bar && part.key === "zoom") ? 1 : 0; } },
            { key: "plain", text: "<b>x</b>" },
            { key: "icon", text: "<b>y</b>", icon: "<svg></svg>" },
        ],
    });
    await wait(30);
    const parts = bar.partList;
    const isRightKind = parts[0].obj.elem.tagName === "DIV" && parts[1].obj.elem.tagName === "BUTTON";
    parts[1].obj.elem.click();
    parts[0].obj.elem.click();
    bar.setItemText("zoom", "125%");
    const isChanged = parts[1].obj.elem.textContent === "125%" && bar.getItem("zoom").text === "125%";
    const isPlain = !parts[2].obj.elem.querySelector("b") && parts[2].obj.elem.textContent === "<b>x</b>";
    const isPlainWithIcon = !parts[3].obj.elem.querySelector("b") && !!parts[3].obj.elem.querySelector("svg");
    bar.setItemVisible("zoom", 0);
    const isHidden = parts[1].obj.elem.getClientRects().length === 0;
    bar.setItemVisible("zoom", 1);
    const isBack = getComputedStyle(parts[1].obj.elem).display.includes("flex");
    check("StatusBar: a part with onClick is a button, the others are texts; a text is never HTML",
        isRightKind && clicks === 1 && isChanged && isPlain && isPlainWithIcon && isHidden && isBack,
        [isRightKind, clicks, isChanged, isPlain, isPlainWithIcon, isHidden, isBack].join(" "));
    bar.remove();
});

test("StatusBar: setBusy shows the circle instead of the dot of the tone", async function () {
    const bar = StatusBar({ messageText: "Saved", messageTone: "success" });
    const isShown = function (obj) { return obj.elem.getClientRects().length > 0; };
    const atFirst = !isShown(bar.spinner) && isShown(bar.dot);
    bar.setBusy(1);
    const whenBusy = isShown(bar.spinner) && !isShown(bar.dot) && bar.busy === 1;
    bar.setBusy(0);
    const afterBusy = !isShown(bar.spinner) && isShown(bar.dot);
    check("StatusBar: setBusy shows the circle instead of the dot of the tone", atFirst && whenBusy && afterBusy, [atFirst, whenBusy, afterBusy].join(" "));
    bar.remove();
});

test("StatusBar: it stands at the bottom of a Box and in the column of a VGroup; a long message ends with ... and the parts stay", async function () {
    const holder = startBox({ left: 0, top: 0, width: 300, height: 200 });
        const bar = StatusBar({ messageText: "A very long message that does not fit in this narrow bar at all", items: ["3 files", "UTF-8"] });
    endBox();
    await wait(30);
    const isAtBottom = bar.elem.getBoundingClientRect().bottom === holder.elem.getBoundingClientRect().bottom;
    const message = bar.lblMessage.elem;
    const isCut = message.scrollWidth > message.clientWidth;
    const lastPart = bar.partList[1].obj.elem.getBoundingClientRect();
    const isPartIn = lastPart.right <= holder.elem.getBoundingClientRect().right && lastPart.width > 10;
    holder.remove();
    const column = VGroup({ left: 0, top: 0, width: 300, height: 200, gap: 0 });
        const first = Box({ width: "100%", height: 50 });
        const columnBar = StatusBar({ messageText: "x" });
    endGroup();
    await wait(30);
    const isInColumn = columnBar.elem.getBoundingClientRect().top === first.elem.getBoundingClientRect().bottom;
    column.remove();
    const givenTop = StatusBar({ top: 10, messageText: "x" });
    const keepsTop = givenTop.elem.getBoundingClientRect().top === page.elem.getBoundingClientRect().top + 10;
    givenTop.remove();
    check("StatusBar: it stands at the bottom of a Box and in the column of a VGroup; a long message ends with ... and the parts stay",
        isAtBottom && isCut && isPartIn && isInColumn && keepsTop, [isAtBottom, isCut, isPartIn, isInColumn, keepsTop].join(" "));
});
