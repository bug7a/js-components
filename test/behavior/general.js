/* Bismillah */

/*
BEHAVIOR TESTS: GENERAL
The tests of test/behavior-test.htm for the reviews of comp/, the scale of a zoomed page, the dark packages of a window, TapEffect,
the texts of the components (as they are written; allowHtml).
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

// *** SCALE ON A ZOOMED PAGE (basic.uiScale and the scale param of Tabs, SelectBox, DatePicker, Dialog, Toast, Tooltip)

// The size of an element on the screen. Two sizes are the same within 1 px.
const screenSize = function (elem) {
    const rect = elem.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
};
const isSameScreenSize = function (a, b) {
    return Math.abs(a.width - b.width) <= 1 && Math.abs(a.height - b.height) <= 1;
};
const sizeText = function (size) {
    return size.width.toFixed(1) + " x " + size.height.toFixed(1);
};

// measure() on a page zoomed like page.fit() does it, with basic.uiScale = 1 / zoom. Both are put back after it.
const measureOnZoomedPage = function (zoom, measure) {
    page.zoom = zoom;
    basic.uiScale = 1 / zoom;
    try {
        return measure();
    } finally {
        page.zoom = 1;
        basic.uiScale = 1;
    }
};

// 2026-11-05 (the user): the tab of the login pages grew with a motion when the page opened
test("Tabs: the indicator has no motion before the first change of the tab (a late size is drawn at once); a change moves it", async function () {
    const tabs = Tabs({ variant: "pill", tabs: [{ key: "a", text: "A" }, { key: "b", text: "B" }], value: "a" });
    await wait(80); // (after the first view)
    const motionAtStart = tabs.indicator.elem.style.transition;
    tabs.setValue("b");
    const motionAfterChange = tabs.indicator.elem.style.transition;
    check("Tabs: the indicator has no motion before the first change of the tab (a late size is drawn at once); a change moves it",
        !/left/.test(motionAtStart) && /left/.test(motionAfterChange), "at the start: " + motionAtStart + " | after a change: " + motionAfterChange);
    tabs.remove();
});

test("Tabs: on a zoomed page (zoom 0.5, basic.uiScale 2) the bar keeps its size on the screen", async function () {
    await document.fonts.ready;
    const measureTabs = function () {
        const tabs = Tabs({ width: 300, tabs: ["All", { key: "open", text: "Open", count: 12 }, "Done"], value: "open" });
        const sizes = { bar: screenSize(tabs.elem), tabs: screenSize(tabs.stripInner.elem) };
        tabs.remove();
        return sizes;
    };
    const normal = measureTabs();
    const zoomed = measureOnZoomedPage(0.5, measureTabs);
    const isSame = isSameScreenSize(normal.bar, zoomed.bar) && isSameScreenSize(normal.tabs, zoomed.tabs);
    check("Tabs: on a zoomed page (zoom 0.5, basic.uiScale 2) the bar keeps its size on the screen", isSame,
        "bar " + sizeText(normal.bar) + " / " + sizeText(zoomed.bar) + ", tabs " + sizeText(normal.tabs) + " / " + sizeText(zoomed.tabs));
});

test("SelectBox: on a zoomed page (zoom 0.5, basic.uiScale 2) the field and its list keep their size on the screen", async function () {
    await document.fonts.ready;
    const options = ["Apple", "Banana", "Cherry", "Grape", "Kiwi", "Lemon", "Mango", "Melon", "Orange", "Peach"];
    const measureSelect = function () {
        const select = SelectBox({ width: 240, options: options, value: "Banana" });
        select.open();
        const sizes = { field: screenSize(select.elem), list: screenSize(select.panel.elem) };
        select.close();
        select.remove();
        return sizes;
    };
    const normal = measureSelect();
    const zoomed = measureOnZoomedPage(0.5, measureSelect);
    const isSame = isSameScreenSize(normal.field, zoomed.field) && isSameScreenSize(normal.list, zoomed.list);
    check("SelectBox: on a zoomed page (zoom 0.5, basic.uiScale 2) the field and its list keep their size on the screen", isSame,
        "field " + sizeText(normal.field) + " / " + sizeText(zoomed.field) + ", list " + sizeText(normal.list) + " / " + sizeText(zoomed.list));
});

test("DatePicker: on a zoomed page (zoom 0.5, basic.uiScale 2) the calendar keeps its size on the screen", async function () {
    await document.fonts.ready;
    const measureDate = function () {
        const picker = DatePicker({ width: 220, date: "2026-11-12" });
        picker.open();
        const sizes = { field: screenSize(picker.elem), calendar: screenSize(picker.panel.elem) };
        picker.close();
        picker.remove();
        return sizes;
    };
    const normal = measureDate();
    const zoomed = measureOnZoomedPage(0.5, measureDate);
    const isSame = isSameScreenSize(normal.field, zoomed.field) && isSameScreenSize(normal.calendar, zoomed.calendar);
    check("DatePicker: on a zoomed page (zoom 0.5, basic.uiScale 2) the calendar keeps its size on the screen", isSame,
        "field " + sizeText(normal.field) + " / " + sizeText(zoomed.field) + ", calendar " + sizeText(normal.calendar) + " / " + sizeText(zoomed.calendar));
});

test("DatePicker: on a zoomed page the cover of the calendar covers the screen (a click outside closes it)", async function () {
    page.zoom = 0.5;
    const picker = DatePicker({ width: 220 });
    picker.open();
    const coverHeight = picker.overlay.elem.getBoundingClientRect().height;
    picker.close();
    picker.remove();
    page.zoom = 1;
    check("DatePicker: on a zoomed page the cover of the calendar covers the screen (a click outside closes it)", coverHeight >= window.innerHeight, "cover height: " + coverHeight);
});

test("Dialog: on a zoomed page (zoom 0.5, basic.uiScale 2) the card keeps its size on the screen", async function () {
    await document.fonts.ready;
    const measureDialog = function () {
        const dialog = Dialog({ titleText: "Delete the file?", messageText: "It can not be undone.", buttons: [{ key: "cancel", text: "Cancel" }, { key: "delete", text: "Delete", type: "danger" }] });
        const sizes = { card: screenSize(dialog.card.elem) };
        dialog.remove();
        return sizes;
    };
    const normal = measureDialog();
    const zoomed = measureOnZoomedPage(0.5, measureDialog);
    check("Dialog: on a zoomed page (zoom 0.5, basic.uiScale 2) the card keeps its size on the screen", isSameScreenSize(normal.card, zoomed.card),
        "card " + sizeText(normal.card) + " / " + sizeText(zoomed.card));
});

test("Toast: on a zoomed page (zoom 0.5, basic.uiScale 2) a toast keeps its size and its place on the screen", async function () {
    await document.fonts.ready;
    // WHY the slot of the toast (toast.elem), not its card: the card slides in with a transform
    const measureToast = function () {
        const toast = Toast.info("Saved", { titleText: "File", duration: 0 });
        const place = toast.elem.parentElement.getBoundingClientRect();
        const sizes = { toast: screenSize(toast.elem), top: place.top, right: place.right };
        toast.remove();
        return sizes;
    };
    const normal = measureToast();
    const zoomed = measureOnZoomedPage(0.5, measureToast);
    Toast.layoutContainers(); // (the places of the toasts back to scale 1)
    const isSamePlace = Math.abs(normal.top - zoomed.top) <= 1 && Math.abs(normal.right - zoomed.right) <= 1;
    check("Toast: on a zoomed page (zoom 0.5, basic.uiScale 2) a toast keeps its size and its place on the screen", isSameScreenSize(normal.toast, zoomed.toast) && isSamePlace,
        "toast " + sizeText(normal.toast) + " / " + sizeText(zoomed.toast) + ", top right " + normal.top + ", " + normal.right + " / " + zoomed.top + ", " + zoomed.right);
});

test("Tooltip: on a zoomed page (zoom 0.5, basic.uiScale 2) a bubble keeps its size and its gap to the target", async function () {
    await document.fonts.ready;
    const measureBubble = function () {
        const scale = basic.uiScale;
        const target = Box(100 * scale, 300 * scale, 120 * scale, 40 * scale); // (the same place on the screen)
        const bubble = Tooltip.show(target, "Click again to delete.", { arrow: 12, border: 1 }, "top");
        const gap = target.elem.getBoundingClientRect().top - bubble.elem.getBoundingClientRect().bottom;
        const sizes = { bubble: screenSize(bubble.elem), gap: gap };
        bubble.remove();
        target.remove();
        return sizes;
    };
    const normal = measureBubble();
    const zoomed = measureOnZoomedPage(0.5, measureBubble);
    const isSameGap = Math.abs(normal.gap - zoomed.gap) <= 1;
    check("Tooltip: on a zoomed page (zoom 0.5, basic.uiScale 2) a bubble keeps its size and its gap to the target", isSameScreenSize(normal.bubble, zoomed.bubble) && isSameGap,
        "bubble " + sizeText(normal.bubble) + " / " + sizeText(zoomed.bubble) + ", gap " + normal.gap.toFixed(1) + " / " + zoomed.gap.toFixed(1));
});

// *** TAP EFFECT (comp/tap-effect.js)

test("TapEffect.show: one circle in the middle of the place, removed after its time", async function () {
    const X = 200;
    const Y = 150;
    const FADE_START_TIME = 50; // ms: the circle fades 50 ms after the tap
    const removeTime = FADE_START_TIME + TapEffect.options.duration * 1000;
    const circle = TapEffect.show(X, Y);
    if (TapEffect.isReducedMotion()) {
        check("TapEffect.show: no circle with reduced motion", circle === null);
        return;
    }
    const second = TapEffect.show(X + 40, Y); // one at a time
    const rect = circle.elem.getBoundingClientRect();
    const isInMiddle = Math.abs(rect.left + rect.width / 2 - X) < 1 && Math.abs(rect.top + rect.height / 2 - Y) < 1;
    const circleCount = Array.from(page.elem.children).filter(function (el) { return el.style.zIndex === circle.elem.style.zIndex; }).length;
    await wait(removeTime + 60);
    const isGone = !circle.elem.isConnected && TapEffect.current === null;
    check("TapEffect.show: one circle in the middle of the place, removed after its time", second === null && circleCount === 1 && isInMiddle && isGone, "second: " + second + ", circles: " + circleCount + ", in the middle: " + isInMiddle + ", gone: " + isGone);
});

test("TapEffect.start: a real tap makes a circle at its place, a code click and a tap after stop() do not", async function () {
    const X = 120;
    const Y = 90;
    const click = function (detail) {
        document.body.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, clientX: X, clientY: Y, detail: detail }));
    };
    const circleCount = function () {
        return Array.from(page.elem.children).filter(function (el) { return el.style.zIndex === String(TapEffectDefaults.zIndex); }).length;
    };
    TapEffect.start();
    click(0); // the keyboard or the code
    const afterCodeClick = circleCount();
    click(1);
    const circle = TapEffect.current;
    const isAtTap = !!circle && Math.abs(circle.left + circle.width / 2 - X) < 1 && Math.abs(circle.top + circle.height / 2 - Y) < 1;
    TapEffect.stop();
    await wait(400);
    click(1);
    const afterStop = circleCount();
    check("TapEffect.start: a real tap makes a circle at its place, a code click and a tap after stop() do not", TapEffect.isReducedMotion() || (afterCodeClick === 0 && isAtTap && afterStop === 0 && TapEffect.isOn === 0), "code click: " + afterCodeClick + ", at the tap: " + isAtTap + ", after stop: " + afterStop);
});

// *** THE REVIEW OF comp/ (2026-11-05, context/comp-bugs.md) - A: what broke the page, lost data or leaked

test("LineProgressBar: made in a hidden group it does not throw, and draws its lines when shown", async function () {
    const group = VGroup({ width: 400, height: 60, visible: 0 });
        const bar = LineProgressBar({ width: "100%", height: 20 });
    endGroup();
    const label = Label({ text: "after the bar" });
    const isLabelOutside = !group.elem.contains(label.elem); // WHY: the throw left the group open
    group.visible = 1;
    await wait(200);
    const lineCount = bar.elem.querySelectorAll(".basic_box").length - 1; // (- the line container)
    check("LineProgressBar: made in a hidden group it does not throw, and draws its lines when shown", isLabelOutside && lineCount === 100, "lines: " + lineCount + ", the next label outside the group: " + isLabelOutside);
    label.remove();
    group.remove();
});

// 2026-11-05: at 0% one line was full (the head was the first line)
test("LineProgressBar: 0% has no full line, 100% has them all", async function () {
    const FULL = "rgb(1, 2, 3)";
    const bar = LineProgressBar({ width: 100, height: 20, primaryColor: FULL, headGrow: 0 });
    const countFull = function () {
        return Array.from(bar.elem.querySelectorAll(".basic_box")).filter(function (el) { return el.style.backgroundColor === FULL; }).length;
    };
    const atZero = countFull();
    bar.setProgress(100);
    const atHundred = countFull();
    check("LineProgressBar: 0% has no full line, 100% has them all", atZero === 0 && atHundred === 25, "0%: " + atZero + ", 100%: " + atHundred + " (of 25)");
    bar.remove();
});

test("LineProgressBar: animated 1 slides its bubble to a new value (a transform), animated 0 writes no motion", async function () {
    // WHY left / top: an object of this page is made out of the screen, and the bubble of a bar that is not seen hides
    const moving = LineProgressBar({ left: 20, top: 80, width: 200, height: 20, valueBubble: 1, animated: 1, progress: 10 });
    const still = LineProgressBar({ left: 20, top: 160, width: 200, height: 20, valueBubble: 1, progress: 10 });
    await wait(50);
    moving.setProgress(90);
    still.setProgress(80);
    const bubbleOf = function (text) {
        return Array.from(document.querySelectorAll("[role=status]")).find(function (el) { return el.textContent === text; });
    };
    // WHY computed: the transform of the style is "none" at once (the end of the motion); the motion is in the computed one
    const slideStart = getComputedStyle(bubbleOf("90%")).transform;
    await wait(400);
    const slideEnd = getComputedStyle(bubbleOf("90%")).transform;
    const stillTransform = bubbleOf("80%").style.transform;
    const isRight = slideStart.startsWith("matrix(") && slideEnd === "none" && stillTransform === "";
    check("LineProgressBar: animated 1 slides its bubble to a new value (a transform), animated 0 writes no motion", isRight, [slideStart, slideEnd, stillTransform].join(" / "));
    [moving, still].forEach(function (bar) { bar.remove(); });
});

test("TimePicker in a removed container: its lists leave no window listener (basic.js v26.11.05)", async function () {
    const countResize = function () { return page._box._eventFuncList.filter(function (e) { return e.eventName === "resize"; }).length; };
    const before = countResize();
    for (let i = 0; i < 3; i++) {
        const view = startBox(0, 0, 300, 300);
            TimePicker({ left: 10, top: 10 });
        endBox();
        view.remove(); // a page change
    }
    check("TimePicker in a removed container: its lists leave no window listener (basic.js v26.11.05)", countResize() === before, "window resize listeners: " + before + " -> " + countResize());
});

test("A SelectBox and a ContextMenu in a Dialog open over it; a Toast is over the Dialog", async function () {
    let select = null;
    let row = null;
    const dialog = Dialog({
        titleText: "Order",
        content: function () {
            select = SelectBox({ width: 200, options: ["Small", "Large"] });
            row = Label({ text: "row", width: 100, height: 30 });
        },
        buttons: [{ key: "ok", text: "OK", type: "primary" }],
    });
    const menu = ContextMenu({ target: row, items: [{ text: "Open", key: "open" }] });
    await wait(50);
    const zOf = function (elem) { return Number(getComputedStyle(elem).zIndex); };
    select.open();
    const selectZ = zOf(select.panel.elem);
    select.close();
    menu.openWithEvent({ clientX: 20, clientY: 20 }, row);
    const menuZ = zOf(menu.elem);
    menu.close();
    const toast = Toast.info("Saved.");
    const toastZ = zOf(toast.elem.parentElement);
    const dialogZ = zOf(dialog.elem);
    toast.remove();
    menu.remove();
    dialog.remove();
    check("A SelectBox and a ContextMenu in a Dialog open over it; a Toast is over the Dialog", selectZ > dialogZ && menuZ > dialogZ && toastZ > dialogZ, "dialog " + dialogZ + ", select " + selectZ + ", menu " + menuZ + ", toast " + toastZ);
});

test("SortableList and ItemList: the keys of a field in a row stay in the field", async function () {
    const removed = [];
    const fields = [];
    const sortable = SortableList({
        width: 300, height: 200, removable: 1,
        items: [{ key: "q1", text: "Name" }, { key: "q2", text: "City" }],
        createItemView: function (item) { fields.push(Input({ width: "100%", height: 32, text: item.text, position: "relative" })); },
        onRemove: function (self, item) { removed.push(item.key); },
    });
    const list = ItemList({
        width: 300, height: 200, style: { row: { height: "auto" } },
        items: [{ key: "a", text: "Apple" }],
        createItemView: function (item) { fields.push(Input({ width: 200, height: 32, text: item.text, position: "relative" })); },
    });
    await wait(50);
    key(fields[0].inputElement, "keydown", "Backspace");
    const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    fields[2].inputElement.dispatchEvent(space);
    check("SortableList and ItemList: the keys of a field in a row stay in the field", removed.length === 0 && sortable.getKeys().length === 2 && !space.defaultPrevented && list.getSelectedKeys().length === 0, "removed: " + removed.join(",") + ", space taken: " + space.defaultPrevented + ", selected: " + list.getSelectedKeys().join(","));
    sortable.remove();
    list.remove();
});

test("SidePanel: an Escape that closes a list in it, or that a Dialog over it keeps, does not close the panel", async function () {
    const panel = SidePanel({ side: "right", titleText: "Filters", opened: 1 });
    let select = null;
    panel.startBody();
        select = SelectBox({ width: 200, options: ["A", "B"] });
    panel.endBody();
    await wait(50);
    select.open();
    key(document.activeElement || document.body, "keydown", "Escape", { code: "Escape" });
    await wait(30);
    const afterList = panel.isOpened;
    const dialog = Dialog({ titleText: "Saving", closeOnEscape: 0, buttons: [{ key: "ok", text: "OK", type: "primary" }] });
    await wait(30);
    key(document.activeElement || document.body, "keydown", "Escape", { code: "Escape" });
    await wait(30);
    const afterDialog = panel.isOpened;
    dialog.remove();
    key(document.body, "keydown", "Escape", { code: "Escape" });
    await wait(30);
    check("SidePanel: an Escape that closes a list in it, or that a Dialog over it keeps, does not close the panel", afterList === 1 && afterDialog === 1 && panel.isOpened === 0, "after the list: " + afterList + ", after the dialog: " + afterDialog + ", then: " + panel.isOpened);
    panel.remove();
});

// *** THE REVIEW OF comp/ (2026-11-05) - B: guards that were passed, wrong data that was sent

test("SmartButton: the second click of a double click does not answer the ask; a later click does", async function () {
    let clicks = 0;
    const button = SmartButton({ labelText: "Delete", ask: "Sure?", onClick: function () { clicks++; } });
    button.elem.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    button.elem.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }));
    const afterDouble = clicks;
    await wait(450);
    button.elem.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    check("SmartButton: the second click of a double click does not answer the ask; a later click does", afterDouble === 0 && clicks === 1, "after the double click: " + afterDouble + ", after a later click: " + clicks);
    button.remove();
});

test("EmailField: setRequired() and the start value keep the warning of an invalid e-mail", async function () {
    const typed = EmailField({ width: 300 });
    typed.setValue("abc");
    const beforeRequired = typed.status;
    typed.setRequired(1);
    const started = EmailField({ width: 300, value: "not-an-email" });
    check("EmailField: setRequired() and the start value keep the warning of an invalid e-mail", beforeRequired === 2 && typed.status === 2 && started.status === 2, "typed: " + beforeRequired + " -> " + typed.status + ", start value: " + started.status);
    typed.remove();
    started.remove();
});

test("LoginPageV2: a passive LOGIN button does not log in (a click that Enter makes)", async function () {
    let logins = 0;
    const login = LoginPage({ onLoginClick: function () { logins++; } });
    const isPassive = (login.loginBtn.clickable != 1);
    login.loginBtn.elem.click(); // WHY elem.click(): the click of Tab + Enter (pointer-events do not stop it)
    check("LoginPageV2: a passive LOGIN button does not log in (a click that Enter makes)", isPassive && logins === 0, "passive: " + isPassive + ", logins: " + logins);
    login.remove();
});

// 2026-11-05 (the user): LOGIN of login-page.htm is a blue ozden3 SmartButton
test("LoginPageV2: buttonStyleName makes LOGIN a SmartButton; passive it does not log in (a click, Enter), active it does", async function () {
    let logins = 0;
    const login = LoginPage({ buttonStyleName: "ozden3", buttonTone: "blue", onLoginClick: function () { logins++; } });
    const button = login.loginBtn;
    const isSmartButton = (typeof button.setEnabled === "function" && button.tone === "blue" && button.enabled != 1);
    button.elem.click();
    key(button.elem, "keydown", "Enter");
    const passiveLogins = logins;
    login.loginEmail.setValue("a@b.co");
    login.loginPassword.setValue("123456");
    login.loginEmail.onChange();
    button.elem.click();
    check("LoginPageV2: buttonStyleName makes LOGIN a SmartButton; passive it does not log in (a click, Enter), active it does",
        isSmartButton && passiveLogins === 0 && logins === 1 && button.enabled == 1, "SmartButton (passive at first): " + isSmartButton + ", logins while passive: " + passiveLogins + ", after: " + logins);
    login.remove();
});

// 2026-11-05 (the user): the show password hint was white on the dark login page
test("PasswordField: the eye is white on a dark field", async function () {
    const filterOf = function (styleName) {
        const password = PasswordField({ titleText: "Password", styleName: styleName });
        const filter = password.btnShowPassword.elem.style.filter;
        password.remove();
        return filter;
    };
    const filters = ["classic", "ozden", "dark", "ozdenDark"].map(filterOf);
    check("PasswordField: the eye is white on a dark field", filters.join() === ",,invert(100%),invert(100%)", filters.join());
});

test("PasswordField: the show password hint takes the hint look of the field (white on classic, dark on ozdenDark and dark)", async function () {
    const fields = ["classic", "ozdenDark", "dark"].map(function (styleName) {
        return PasswordField({ titleText: "Password", styleName: styleName });
    });
    const colors = fields.map(function (field) { return field.btnShowPassword.tooltip.lbl_color; });
    const textColors = fields.map(function (field) { return field.btnShowPassword.tooltip.lbl_textColor; });
    check("PasswordField: the show password hint takes the hint look of the field (white on classic, dark on ozdenDark and dark)",
        colors[0] === "white" && textColors[0] === "#141414" && colors[1] === "#262624" && colors[2] === "#262624",
        "bubbles: " + colors.join(", ") + " | texts: " + textColors.join(", "));
    fields.forEach(function (field) { field.remove(); });
});

test("Toggle: disabled under the mouse, it stays disabled when the mouse leaves", async function () {
    const toggle = Toggle({ value: 1 });
    toggle.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    toggle.setSecondState("disabled");
    toggle.elem.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    toggle.elem.click();
    check("Toggle: disabled under the mouse, it stays disabled when the mouse leaves", toggle.secondState === "disabled" && toggle.clickable != 1 && toggle.value == 1, "state: " + toggle.secondState + ", clickable: " + toggle.clickable + ", value: " + toggle.value);
    toggle.remove();
});

test("PageControl: a disabled control does not change the page from its dots", async function () {
    const pages = PageControl({ width: 300, height: 200, pages: ["a", "b", "c"], dots: 1, transition: "none" });
    pages.setEnabled(0);
    const dots = pages.dotsBox.elem.querySelectorAll("[role=button]");
    dots[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    check("PageControl: a disabled control does not change the page from its dots", dots.length === 3 && pages.value === "a", "dots: " + dots.length + ", value: " + pages.value);
    pages.remove();
});

test("UrlField: the value it gives can be put back, also as the start value", async function () {
    const url = UrlField({ width: 360 });
    url.setValue("https://www.example.com/news");
    url.setValue(url.getValue());
    const started = UrlField({ width: 360, value: "https://www.example.com" });
    check("UrlField: the value it gives can be put back, also as the start value", url.getValue() === "https://www.example.com/news" && url.status === 0 && started.getValue() === "https://www.example.com" && started.status === 0, url.getValue() + " (" + url.status + "), " + started.getValue() + " (" + started.status + ")");
    url.remove();
    started.remove();
});

// *** THE REVIEW OF comp/ (2026-11-05) - C: made in a hidden container, made in an open group

test("Slider: made in a hidden group it keeps its value, also one set while hidden", async function () {
    const group = VGroup({ width: 400, height: 80, visible: 0 });
        const slider = Slider({ width: "100%", value: 60 });
    endGroup();
    const hiddenValue = slider.getValue();
    slider.setValue(80);
    const setWhileHidden = slider.getValue();
    group.visible = 1;
    await wait(200);
    check("Slider: made in a hidden group it keeps its value, also one set while hidden", hiddenValue === 60 && setWhileHidden === 80 && slider.getValue() === 80, "hidden: " + hiddenValue + ", set while hidden: " + setWhileHidden + ", shown: " + slider.getValue());
    group.remove();
});

test("TextAreaField: filled while hidden, it is as tall as its field when shown", async function () {
    const group = VGroup({ width: 400, height: 200, visible: 0 });
        const note = TextAreaField({ width: 360, height: 140, titleText: "Note" });
    endGroup();
    note.setValue("A saved note.");
    group.visible = 1;
    await wait(200);
    const textHeight = note.textareaElem.getBoundingClientRect().height;
    const fieldHeight = note.inputBox.elem.getBoundingClientRect().height;
    check("TextAreaField: filled while hidden, it is as tall as its field when shown", textHeight > 0 && textHeight >= fieldHeight - 6, "textarea: " + textHeight + ", field: " + fieldHeight);
    group.remove();
});

test("SidePanel: made in an open group of the page, startBody() keeps every object in the panel", async function () {
    const group = VGroup({ width: 300, height: 200 });
        const panel = SidePanel({ side: "right", titleText: "Notes", opened: 1 });
        panel.startBody();
            const first = SmartButton({ labelText: "One" });
            const second = SmartButton({ labelText: "Two" });
            const note = Label({ text: "Notes" });
        panel.endBody();
        const afterPanel = Label({ text: "in the group" });
    endGroup();
    const isInBody = [first, second, note].every(function (obj) { return panel.body.elem.contains(obj.elem); });
    const isAfterInGroup = group.elem.contains(afterPanel.elem);
    check("SidePanel: made in an open group of the page, startBody() keeps every object in the panel", isInBody && isAfterInGroup, "in the body: " + isInBody + ", the next label in the group: " + isAfterInGroup);
    panel.remove();
    group.remove();
});

// *** THE REVIEW OF comp/ (2026-11-05) - D: wrong results, content lost off the screen

test("TreeView: a node added into an open empty folder is drawn and can be selected", async function () {
    const tree = TreeView({ width: 300, height: 200, items: [{ key: "docs", text: "docs", children: [], expanded: 1 }, { key: "readme", text: "readme.md" }] });
    await wait(30);
    tree.addNode("docs", { key: "docs/a.txt", text: "a.txt" });
    tree.setValue("docs/a.txt");
    const row = tree.getRowElem("docs/a.txt");
    check("TreeView: a node added into an open empty folder is drawn and can be selected", Boolean(row) && row.offsetParent !== null && tree.value === "docs/a.txt", "row: " + Boolean(row) + ", value: " + tree.value);
    tree.remove();
});

test("SmartTable: the filter finds a Turkish capital İ from a lowercase keyword", async function () {
    const table = SmartTable({ itemLineCount: 4, itemDataList: [{ id: 1, name: "İbrahim" }, { id: 2, name: "İstanbul" }, { id: 3, name: "Ali" }], style: { width: 500, height: "auto" } }); // (the filter is on one column: the name)
    await wait(100);
    const counts = [];
    for (const word of ["istanbul", "ibrahim", "ali"]) {
        table.searchKeyword = word;
        table.filterAndSortData();
        await wait(120);
        counts.push(table.visibleItemDataList.length);
    }
    check("SmartTable: the filter finds a Turkish capital İ from a lowercase keyword", counts.join(",") === "1,1,1", "istanbul, ibrahim, ali: " + counts.join(", "));
    table.remove();
});

test("FilePicker: directory: 1 keeps every file of the chosen folder", async function () {
    let errors = null;
    const folder = FilePicker({ directory: 1, showPreview: 0, onError: function (self, list) { errors = list; } });
    const files = new DataTransfer();
    ["a.txt", "b.txt", "c.txt"].forEach(function (name) { files.items.add(new File(["x"], name, { type: "text/plain" })); });
    folder.input.files = files.files;
    folder.input.dispatchEvent(new Event("change"));
    check("FilePicker: directory: 1 keeps every file of the chosen folder", folder.files.length === 3 && errors === null, "files: " + folder.files.length + ", errors: " + JSON.stringify(errors));
    folder.remove();
});

test("SearchResults: under a field low on the screen the list stays on the screen", async function () {
    const field = SearchInput({ left: 20, top: page.height - 90, width: 360 });
    const items = [];
    for (let i = 1; i <= 8; i++) items.push({ text: "Result " + i, description: "description " + i });
    const results = SearchResults({ anchor: field, anchorAlign: "left" });
    results.setItems(items, "res");
    results.open();
    await wait(100);
    const rect = results.elem.getBoundingClientRect();
    check("SearchResults: under a field low on the screen the list stays on the screen", rect.top >= 0 && rect.bottom <= window.innerHeight + 1, "top: " + Math.round(rect.top) + ", bottom: " + Math.round(rect.bottom) + ", window: " + window.innerHeight);
    results.remove();
    field.remove();
});

test("SearchResults: matchAnchorWidth: 1 opens the list as wide as its field", async function () {
    const field = SearchInput({ left: 40, top: 100, width: 300 });
    const results = SearchResults({ anchor: field, maxWidth: 200, matchAnchorWidth: 1 });
    results.setItems([{ text: "Result 1" }, { text: "Result 2" }], "res");
    await wait(50);
    const fieldRect = field.elem.getBoundingClientRect();
    const listRect = results.elem.getBoundingClientRect();
    const bothEdgesMeet = Math.abs(listRect.left - fieldRect.left) < 1 && Math.abs(listRect.right - fieldRect.right) < 1;
    check("SearchResults: matchAnchorWidth: 1 opens the list as wide as its field (both edges meet)", bothEdgesMeet, "field: " + Math.round(fieldRect.left) + "-" + Math.round(fieldRect.right) + ", list: " + Math.round(listRect.left) + "-" + Math.round(listRect.right));
    results.setMatchAnchorWidth(0);
    const width = results.elem.getBoundingClientRect().width;
    check("SearchResults: setMatchAnchorWidth(0) gives the list the width of maxWidth again", Math.abs(width - 200) < 1, "width: " + Math.round(width));
    results.remove();
    field.remove();
});

test("TinySelect: the list of a field near the bottom of the page is on the page", async function () {
    const select = TinySelect({ left: 100, top: page.height - 50, list: [1, 2, 3, 4, 5].map(function (n) { return { value: String(n), label: "Item " + n }; }) });
    TinySelect.createList(select);
    const last = Array.from(document.querySelectorAll("div")).find(function (el) { return el.childElementCount === 0 && el.textContent === "Item 5"; });
    const bottom = last.getBoundingClientRect().bottom;
    if (select.closeListBox) select.closeListBox();
    check("TinySelect: the list of a field near the bottom of the page is on the page", bottom <= page.height, "the last item ends at " + Math.round(bottom) + " (page " + page.height + ")");
    select.remove();
});

test("PageControl: a mouse press released outside does not make a later mouse move swipe the pages", async function () {
    const pages = PageControl({ width: 300, height: 200, pages: ["a", "b", "c"], value: "b" });
    await wait(30);
    const trackBefore = pages.track.elem.style.transform;
    const rect = pages.elem.getBoundingClientRect();
    pointer(pages.elem, "pointerdown", rect.left + 150, rect.top + 100, "mouse");
    // (released outside the box: no pointerup here; the next moves come with no button pressed)
    pointer(pages.elem, "pointermove", rect.left + 60, rect.top + 100, "mouse");
    pointer(pages.elem, "pointermove", rect.left + 20, rect.top + 100, "mouse");
    check("PageControl: a mouse press released outside does not make a later mouse move swipe the pages", pages.track.elem.style.transform === trackBefore && pages.value === "b", "before: " + trackBefore + ", after: " + pages.track.elem.style.transform);
    pages.remove();
});

test("WebView: an existing page of the same site calls onLoad, a removed box calls nothing after the answer", async function () {
    const calls = [];
    const view = WebView({ width: 300, height: 200, url: "components-test.htm", onLoad: function () { calls.push("onLoad"); }, onError: function () { calls.push("onError"); } });
    await wait(900);
    view.remove();
    const late = [];
    const removed = WebView({ width: 300, height: 200, url: "missing-page-of-the-test.htm", onLoad: function () { late.push("onLoad"); }, onError: function () { late.push("onError"); } });
    removed.remove();
    await wait(400);
    check("WebView: an existing page of the same site calls onLoad, a removed box calls nothing after the answer", calls.join(",") === "onLoad" && late.length === 0, calls.join(",") + " / " + late.join(","));
});

test("WebView: a missing page of the same site calls onError (also a 404 page of a server)", async function () {
    const calls = [];
    const view = WebView({ width: 300, height: 200, url: "missing-page-of-the-test.htm", onLoad: function () { calls.push("onLoad"); }, onError: function () { calls.push("onError"); } });
    await wait(800);
    check("WebView: a missing page of the same site calls onError (also a 404 page of a server)", calls.join(",") === "onError", "callbacks: " + calls.join(","));
    view.remove();
});

// *** THE REVIEW OF comp/ (2026-11-05) - E: PropertyPanel (basic-designer) and UIEffects

test("PropertyPanel: a color typo in the RGB format of the picker does not throw, and a color can be typed again", async function () {
    const panel = PropertyPanel({ data: { sections: [{ key: "s", title: "S", items: [{ key: "fill", type: "color", label: "Fill", value: "#3871E0" }] }] } });
    await wait(50);
    panel.elem.querySelector("[aria-haspopup=dialog]").click();
    const picker = Array.from(document.querySelectorAll("[role=dialog]")).pop();
    picker.querySelector("[aria-label='Color format (HEX, RGB, HSL)']").click(); // HEX -> RGB
    const typeColor = function (text) {
        const field = picker.querySelector("input[aria-label='Fill']");
        field.focus();
        field.value = text;
        field.dispatchEvent(new InputEvent("input", { bubbles: true }));
        key(field, "keydown", "Enter");
        // WHY: Enter calls blur() and the field saves on its blur; a window that is not in focus (behind
        //      another app, on another screen) gets no blur event, so the test sends it (a second save is skipped)
        if (!document.hasFocus()) field.dispatchEvent(new FocusEvent("blur"));
    };
    const errorsBefore = uncaught.length;
    typeColor("#12345");
    await wait(30);
    typeColor("255, 0, 0");
    await wait(30);
    check("PropertyPanel: a color typo in the RGB format of the picker does not throw, and a color can be typed again", uncaught.length === errorsBefore && panel.getValue("fill") === "#FF0000", "errors: " + (uncaught.length - errorsBefore) + ", value: " + panel.getValue("fill"));
    uncaught.length = errorsBefore; // WHY: a failure here is this test's, not "no uncaught errors" of the end
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    panel.remove();
});

test("PropertyPanel: leaving the % field of a color with no edit (or with Escape) changes nothing", async function () {
    const changes = [];
    const panel = PropertyPanel({
        data: { sections: [{ key: "s", title: "S", items: [
            { key: "a", type: "color", label: "A", value: "transparent" },
            { key: "b", type: "color", label: "B", value: "rgb(55, 56, 54)" },
            { key: "c", type: "color", label: "C", value: "rgba(0, 0, 0, 0.125)" },
        ] }] },
        onChange: function (self, change) { changes.push(change.key); },
    });
    await wait(50);
    ["A", "B", "C"].forEach(function (name) {
        const percent = panel.elem.querySelector("input[aria-label='" + name + " opacity (%)']");
        percent.focus();
        percent.blur();
    });
    const percentC = panel.elem.querySelector("input[aria-label='C opacity (%)']");
    percentC.focus();
    key(percentC, "keydown", "Escape");
    check("PropertyPanel: leaving the % field of a color with no edit (or with Escape) changes nothing", changes.length === 0 && panel.getValue("a") === "transparent" && panel.getValue("c") === "rgba(0, 0, 0, 0.125)", "changes: " + changes.join(",") + ", a: " + panel.getValue("a"));
    panel.remove();
});

test("UIEffects spotlight: quick passes of the mouse leave no light in the object", async function () {
    const button = Button(20, 20, 160, 40, { text: "Save" });
    UIEffects.hover(button, "spotlight");
    const pass = function () {
        button.elem.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse", clientX: 40, clientY: 30 }));
        button.elem.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, pointerType: "mouse", clientX: 60, clientY: 30 }));
        button.elem.dispatchEvent(new PointerEvent("pointerleave", { pointerType: "mouse", clientX: 200, clientY: 30 }));
    };
    for (let i = 0; i < 4; i++) {
        pass();
        await wait(100); // back within the 300 ms fade
    }
    await wait(500);
    check("UIEffects spotlight: quick passes of the mouse leave no light in the object", button.elem.querySelectorAll("span").length === 0 && button.text === "Save", "spans: " + button.elem.querySelectorAll("span").length + ", text: " + button.text.slice(0, 40));
    button.remove();
});

// *** THE REVIEW OF comp/ (2026-11-05) - the lower ones that were cheap to fix

test("DataTable: updateRows() with rows of the same id leaves no row on the screen that is not in the data", async function () {
    const drawnRows = function (table) { return Array.from(table.rowsGroup.elem.children).filter(function (el) { return el.style.display != "none"; }).length; };
    const table = DataTable({ columns: [{ key: "name", title: "Name" }, { key: "city", title: "City" }], rows: [{ name: "Ann", city: "Paris" }, { name: "Bob", city: "Rome" }, { name: "Cem", city: "Oslo" }] });
    await wait(30);
    table.updateRows([{ name: "Dan", city: "Bern" }]); // (object rows with no id: all have the same id)
    const afterUpdate = drawnRows(table);
    table.clearRows();
    check("DataTable: updateRows() with rows of the same id leaves no row on the screen that is not in the data", afterUpdate === 1 && drawnRows(table) === 0, "after updateRows: " + afterUpdate + ", after clearRows: " + drawnRows(table));
    table.remove();
});

test("NumberField and CurrencyField: a second decimal separator typed in the number keeps every digit", async function () {
    const insertAt = function (field, position, letter) {
        const el = field.input.inputElement;
        el.focus();
        el.value = el.value.slice(0, position) + letter + el.value.slice(position);
        el.setSelectionRange(position + 1, position + 1);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        return el.value;
    };
    const typeText = function (field, text) {
        for (const letter of text) insertAt(field, field.input.inputElement.value.length, letter);
    };
    const number = NumberField({ titleText: "Number" });
    const currency = CurrencyField({ titleText: "Price" });
    typeText(number, "12.5");
    typeText(currency, "12.5");
    const numberValue = insertAt(number, 1, "."); // the point moved: "1.25"
    const currencyValue = insertAt(currency, 1, ".");
    check("NumberField and CurrencyField: a second decimal separator typed in the number keeps every digit", numberValue === "1.25" && currencyValue === "1.25", "number: " + numberValue + ", currency: " + currencyValue);
    number.remove();
    currency.remove();
});

// *** THE DARK PACKAGES OF A WHOLE WINDOW (the Python package: App(theme="dark"))

// NOTE: ProgressBar ozdenDark is not here: this page loads LineProgressBar under that name.
test("Dark packages: Toggle dark and Dialog ozdenDark take the dark tones", async function () {
    const isDark = function (color) {
        const parts = color.match(/\d+(\.\d+)?/g).map(Number);
        return parts[0] + parts[1] + parts[2] < 3 * 128;
    };
    const isLight = function (color) { return !isDark(color); };
    const ground = function (element) { return getComputedStyle(element).backgroundColor; };

    const toggle = Toggle({ left: 0, top: 0, styleName: "dark" });
    const plainToggle = Toggle({ left: 100, top: 0 });
    const toggleLooks = toggle.backgroundStyle.color === "black" && plainToggle.backgroundStyle.color === "whitesmoke"
        && toggle.width === 70 && Toggle.styles.modern.backgroundStyle.color === undefined;
    toggle.remove();
    plainToggle.remove();

    const dialog = Dialog({
        styleName: "ozdenDark", titleText: "Name", removeOnClose: 1,
        fields: [{ key: "n", titleText: "N" }],
        buttons: [{ key: "ok", text: "OK", type: "primary" }, { key: "no", text: "No", type: "secondary" }],
    });
    await wait(30);
    const cardIsDark = isDark(ground(dialog.card.elem));
    const titleIsLight = isLight(getComputedStyle(findByText("Name", dialog.card.elem)).color);
    const fieldIsDark = isDark(ground(dialog.elem.querySelector("input")));
    const button = dialog.getButton("ok");
    const buttonIsDarkTone = ground(button.elem) === "rgb(55, 98, 101)"; // cyanDark
    const keepsSizes = dialog.style.footer.buttonHeight === 40;
    dialog.close("api");
    await wait(10);

    const promise = Dialog.confirm({ styleName: "ozdenDark", titleText: "Sure?", danger: 1 });
    await wait(30);
    const top = Dialog.getTop();
    const confirmIsDark = isDark(ground(top.card.elem)) && ground(top.getButton("confirm").elem) === "rgb(114, 72, 55)"; // orangeDark
    top.getButton("cancel").elem.click();
    await promise;
    const packageStays = Dialog.styles.ozden.card.color === "white";

    check("Dark packages: Toggle dark and Dialog ozdenDark take the dark tones",
        toggleLooks && cardIsDark && titleIsLight && fieldIsDark && buttonIsDarkTone && keepsSizes && confirmIsDark && packageStays,
        [toggleLooks, cardIsDark, titleIsLight, fieldIsDark, buttonIsDarkTone, keepsSizes, confirmIsDark, packageStays].join(" "));
});

// *** THE TEXTS OF THE COMPONENTS: shown as they are written; allowHtml: 1 makes them HTML

test("Texts: a component shows its texts as they are written, also after its setters; allowHtml: 1 makes them HTML", async function () {
    const TYPED = "<b>Ada</b> & Can";
    // WHY: a name a user typed or a file name ran as HTML: a "<b>" was bold, an "<img onerror=...>" ran
    const isPlain = function (box) { return box.elem.querySelector("b") === null && box.elem.textContent.includes(TYPED); };
    const isHtml = function (box) { return box.elem.querySelector("b") !== null; };

    const made = {
        SmartButton: SmartButton({ labelText: TYPED }),
        CheckBox: CheckBox({ labelText: TYPED }),
        RadioButton: RadioButton({ labelText: TYPED, group: "texts-test", value: "a" }),
        TextField: TextField({ titleText: TYPED, showDescription: 1, descriptionText: TYPED, showRightBox: 1, showUnit: 1, unitText: TYPED }),
        ProgressBar: ProgressBar({ titleText: TYPED }),
        FilePicker: FilePicker({ titleText: TYPED, descriptionText: TYPED }),
        SmartTable: SmartTable({ titleDataList: [{ name: TYPED, dataTitle: "a", width: 200 }], itemDataList: [{ a: TYPED }] }),
        MiniGraphBox: MiniGraphBox({ titleText: TYPED, valueText: TYPED }),
        SparkLineBox: SparkLineBox({ titleText: TYPED, valueText: TYPED, trendText: TYPED }),
        TinySelect: TinySelect({ titleText: TYPED, list: [{ value: "1", label: TYPED }] }),
        SidePanel: SidePanel({ side: "right", titleText: TYPED }),
    };
    await wait(30);
    const madeProblems = Object.keys(made).filter(function (name) { return !isPlain(made[name]); });

    made.SmartButton.setLabelText(TYPED + "!");
    made.CheckBox.setLabelText(TYPED + "!");
    made.RadioButton.setLabelText(TYPED + "!");
    made.TextField.setTitleText(TYPED + "!");
    made.TextField.setDescriptionText(TYPED + "!");
    made.TextField.setUnitText(TYPED + "!");
    made.ProgressBar.setTitleText(TYPED + "!");
    made.FilePicker.setDescriptionText(TYPED + "!");
    made.MiniGraphBox.setValueText(TYPED + "!");
    made.SparkLineBox.setTitleText(TYPED + "!");
    made.TinySelect.setTitleText(TYPED + "!");
    made.SidePanel.setTitleText(TYPED + "!");
    await wait(30);
    const setterProblems = Object.keys(made).filter(function (name) { return !isPlain(made[name]); });
    Object.keys(made).forEach(function (name) { made[name].remove(); });

    const loading = LoadingScreen({ titleText: TYPED, messageText: TYPED });
    loading.setMessageText(TYPED + "!");
    const loadingIsPlain = isPlain(loading);
    loading.remove();

    const htmlButton = SmartButton({ labelText: TYPED, allowHtml: 1 });
    const htmlField = TextField({ titleText: TYPED, allowHtml: 1 });
    const htmlLoading = LoadingScreen({ messageText: "Wait.<br><b>Now</b>", allowHtml: 1 });
    await wait(30);
    const htmlWorks = isHtml(htmlButton) && isHtml(htmlField) && isHtml(htmlLoading);
    [htmlButton, htmlField, htmlLoading].forEach(function (box) { box.remove(); });

    check("Texts: a component shows its texts as they are written, also after its setters; allowHtml: 1 makes them HTML",
        madeProblems.length === 0 && setterProblems.length === 0 && loadingIsPlain && htmlWorks,
        "HTML at create: " + madeProblems.join(", ") + " | after a setter: " + setterProblems.join(", ") + " | LoadingScreen plain: " + loadingIsPlain + " | allowHtml: " + htmlWorks);
});
