/* Bismillah */

/*
BEHAVIOR TESTS: NAVIGATION
The tests of test/behavior-test.htm for the ways through a page or an app (LeftMenu, BottomBar, AppBar, StepBar, SearchResults...).
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

// *** SEARCH RESULTS (comp/search-results.js)

test("SearchResults: the arrows choose a row and Escape keeps the list closed", async function () {
    const ITEMS = [{ text: "Dashboard" }, { text: "Orders" }, { text: "Reports" }];
    let selected = "";
    const input = document.createElement("input");
    page.elem.appendChild(input);
    input.style.cssText = "position: absolute; left: 10px; top: 10px; pointer-events: auto;";
    const results = SearchResults({ onSelect: function (self, item) { selected = item.text; } });
    results.attachTo(input);
    input.focus();
    // WHY setItems at every key: a SearchInput calls onSearch at every keyup, with the same text
    results.setItems(ITEMS, "a");
    key(input, "keydown", "ArrowDown");
    results.setItems(ITEMS, "a");
    key(input, "keydown", "ArrowDown");
    results.setItems(ITEMS, "a");
    key(input, "keydown", "Enter");
    check("SearchResults: the arrows choose a row (Enter opens the third one)", selected === "Reports", "opened: " + selected);
    results.setItems(ITEMS, "a");
    key(input, "keydown", "Escape");
    results.setItems(ITEMS, "a");
    check("SearchResults: Escape keeps the list closed for the same text", results.isOpened === 0);
    results.setItems(ITEMS, "ab");
    check("SearchResults: a new text opens it again", results.isOpened === 1);
    results.remove();
    input.remove();
});

// *** LEFT MENU (comp/left-menu.js)

test("LeftMenu: a tap opens it first; direct selects at once", async function () {
    const clicked = [];
    const items = [{ key: "a", type: "button", text: "A", iconFile: "" }];
    const tapMenu = LeftMenu({ items: items, openOnClick: 1, itemHeight: 70, onItemClick: (self, item) => clicked.push(item.key) });
    const row = tapMenu.elem.querySelector("[style*='height: 70px']");
    check("LeftMenu: itemHeight is the height of a row", !!row);
    row.click();
    check("LeftMenu: the first tap only opens it", tapMenu.state === "expanded" && clicked.length === 0, tapMenu.state);
    row.click();
    check("LeftMenu: the second tap selects", clicked.length === 1 && tapMenu.state === "collapsed", clicked.length);
    tapMenu.remove();

    clicked.length = 0;
    const directMenu = LeftMenu({ items: items, openOnClick: "direct", itemHeight: 71, onItemClick: (self, item) => clicked.push(item.key) });
    directMenu.elem.querySelector("[style*='height: 71px']").click();
    check("LeftMenu: direct selects at once and stays closed", clicked.length === 1 && directMenu.state === "collapsed", clicked.length);
    directMenu.remove();
});

// 2026-11-05 (the user): a light theme for a light page
test("LeftMenu: the light package colors the menu, its line, its shadow while open and its scroll bar; a param wins; dark stays", async function () {
    const light = LeftMenu({ styleName: "light", openOnClick: 0 });
    const own = LeftMenu({ styleName: "light", openOnClick: 0, selectedColor: "#DCEBEC" });
    const dark = LeftMenu({ openOnClick: 0 });
    const closedShadow = light.elem.style.boxShadow;
    light.expand();
    const openShadow = light.elem.style.boxShadow;
    light.collapse();
    const isLight = light.backgroundColor === LeftMenu.styles.light.backgroundColor && Boolean(light.line) &&
        closedShadow === "" && openShadow !== "" && light.scrollBar.bar_color === LeftMenu.styles.light.scrollBarColor;
    const isOwn = own.selectedColor === "#DCEBEC" && own.backgroundColor === LeftMenu.styles.light.backgroundColor;
    const isDark = dark.backgroundColor === "#141414" && !dark.line && dark.scrollBar.bar_color === "#FFFFFF";
    check("LeftMenu: the light package colors the menu, its line, its shadow while open and its scroll bar; a param wins; dark stays",
        isLight && isOwn && isDark, "light: " + isLight + " (shadow closed / open: " + closedShadow + " / " + openShadow + "), own: " + isOwn + ", dark: " + isDark);
    light.remove();
    own.remove();
    dark.remove();
});

// *** BOTTOM BAR (comp/bottom-bar.js) and BADGE (comp/badge.js)

const BOTTOM_BAR_ITEMS = [
    { iconFile: "../02-comp-examples/bottom-bar/icon1.png", text: "Home" },
    { iconFile: "../02-comp-examples/bottom-bar/icon2.png", text: "Basket" },
];

test("BottomBar: the selected box takes the color of the selected item", async function () {
    const ITEM_COLOR = "rgb(90, 187, 159)";
    const STYLE_COLOR = "rgb(20, 20, 20)";
    const items = [Object.assign({ color: ITEM_COLOR }, BOTTOM_BAR_ITEMS[0]), BOTTOM_BAR_ITEMS[1]];
    const bar = BottomBar({ bottom: 0, items: items, style: { selectedBox: { color: STYLE_COLOR } } });
    await wait(50);
    const firstColor = getComputedStyle(bar.selectedBox.elem).backgroundColor;
    bar.itemObjList[1].icon.elem.click();
    await wait(400);
    const secondColor = getComputedStyle(bar.selectedBox.elem).backgroundColor;
    check("BottomBar: the selected box takes the color of the selected item", firstColor === ITEM_COLOR && secondColor === STYLE_COLOR, "first: " + firstColor + ", second: " + secondColor);
    bar.remove();
});

test("BottomBar: without item colors, a color the page gives the selected box stays", async function () {
    const PAGE_COLOR = "rgb(205, 92, 92)";
    const bar = BottomBar({ bottom: 0, items: BOTTOM_BAR_ITEMS });
    await wait(50);
    bar.selectedBox.color = PAGE_COLOR; // the default mobile template paints the circle itself
    bar.selectByIndex(1);
    await wait(400);
    const color = getComputedStyle(bar.selectedBox.elem).backgroundColor;
    check("BottomBar: without item colors, a color the page gives the selected box stays", color === PAGE_COLOR, "color: " + color);
    bar.remove();
});

test("BottomBar: a name of two words stays on one line, also while the bar grows", async function () {
    const items = BOTTOM_BAR_ITEMS.concat([{ iconFile: BOTTOM_BAR_ITEMS[0].iconFile, text: "Two Words" }]);
    const bar = BottomBar({ bottom: 0, items: items });
    await wait(50);
    const oneLineHeight = bar.itemObjList[0].label.elem.getBoundingClientRect().height;
    const lastItem = bar.itemObjList[2];
    lastItem.icon.elem.click();
    let highest = lastItem.label.elem.getBoundingClientRect().height;
    for (let frame = 0; frame < 30; frame++) {
        await basic.nextFrame();
        highest = Math.max(highest, lastItem.label.elem.getBoundingClientRect().height);
    }
    check("BottomBar: a name of two words stays on one line, also while the bar grows", highest <= oneLineHeight, highest + " / " + oneLineHeight);
    bar.remove();
});

test("BottomBar: selectedIconFile is the icon of the selected item; an item without it shows its iconFile there", async function () {
    const bar = BottomBar({ bottom: 0, items: [
        { iconFile: "../02-comp-examples/bottom-bar/icon1.png", selectedIconFile: "../02-comp-examples/bottom-bar/icon1s.png", text: "Home" },
        { iconFile: "../02-comp-examples/bottom-bar/icon2.png", text: "Basket" },
    ] });
    const selectedIcons = bar.itemObjList.map((item) => item.icon.i2.elem.getAttribute("src"));
    bar.remove();
    check("BottomBar: selectedIconFile is the icon of the selected item; an item without it shows its iconFile there",
        selectedIcons[0].endsWith("icon1s.png") && selectedIcons[1].endsWith("icon2.png"), selectedIcons.join(" | "));
});

test("BottomBar: the selected box is as wide after the name as before an icon smaller than its box", async function () {
    const bar = BottomBar({ bottom: 0, items: BOTTOM_BAR_ITEMS,
        style: { layout: { iconBoxSize: 40, labelEndSpace: 0 }, icon: { width: 24, height: 24 } } });
    await wait(450);
    const item = bar.itemObjList[0];
    const selectedRect = bar.selectedBox.elem.getBoundingClientRect();
    const beforeIcon = item.icon.i1.elem.getBoundingClientRect().left - selectedRect.left;
    const afterName = selectedRect.right - item.label.elem.getBoundingClientRect().right;
    check("BottomBar: the selected box is as wide after the name as before an icon smaller than its box", Math.abs(beforeIcon - afterName) < 1, beforeIcon + " / " + afterName);
    bar.remove();
});

test("BottomBar: on a narrow screen the bar stays inside, its ends get smaller", async function () {
    const items = BOTTOM_BAR_ITEMS.concat(BOTTOM_BAR_ITEMS);
    const bar = BottomBar({ bottom: 0, width: 340, items: items });
    await wait(450);
    const barRect = bar.innerBox.elem.getBoundingClientRect();
    const boxRect = bar.elem.getBoundingClientRect();
    check("BottomBar: on a narrow screen the bar stays inside, its ends get smaller", barRect.left >= boxRect.left && barRect.right <= boxRect.right, barRect.width);
    bar.remove();
});

test("BottomBar: labelMode float shows the name over the selected item, then hides it", async function () {
    const bar = BottomBar({ bottom: 0, labelMode: "float", items: BOTTOM_BAR_ITEMS });
    await wait(50);
    const pill = bar.lblFloat;
    const isFirstShown = pill.text === "Home" && getComputedStyle(pill.elem).opacity === "1"; // no fade-in at the first view
    bar.itemObjList[1].icon.elem.click();
    await wait(450);
    const pillRect = pill.elem.getBoundingClientRect();
    const boxRect = bar.selectedBox.elem.getBoundingClientRect();
    const centerGap = Math.abs((pillRect.left + pillRect.width / 2) - (boxRect.left + boxRect.width / 2));
    const isNotCut = getComputedStyle(bar.elem).overflowY === "visible";
    const isOver = pill.text === "Basket" && getComputedStyle(pill.elem).opacity === "1" && pillRect.bottom <= boxRect.top && centerGap < 2;
    await wait(bar.floatLabelTime + 300);
    const isHidden = getComputedStyle(pill.elem).opacity === "0";
    check("BottomBar: labelMode float shows the name over the selected item, then hides it", isFirstShown && isOver && isNotCut && isHidden, "first: " + isFirstShown + ", over: " + isOver + " (center gap " + centerGap + "), not cut: " + isNotCut + ", hidden: " + isHidden);
    bar.remove();
});

test("BottomBar: the badge param goes to every item; a badge shows after setBadge", async function () {
    const bar = BottomBar({ bottom: 0, items: BOTTOM_BAR_ITEMS, badge: { showZero: 1, dotForOne: 0 } });
    await wait(30);
    const statesBefore = bar.itemObjList.map(function (item) { return item.badge.state; }).join(",");
    const badge = bar.itemObjList[1].badge;
    bar.setBadge(1, 0);
    const zero = badge.state + ":" + badge.label.text;
    bar.setBadge(1, 1);
    const one = badge.state + ":" + badge.label.text;
    bar.setBadge(1, "");
    const removed = badge.state;
    check("BottomBar: the badge param goes to every item; a badge shows after setBadge", statesBefore === "hidden,hidden" && zero === "number:0" && one === "number:1" && removed === "hidden", [statesBefore, zero, one, removed].join(" / "));
    bar.remove();
});

test("BottomBar: an item is a button; Enter chooses it like a click", async function () {
    let clickedIndex = -1;
    const bar = BottomBar({ bottom: 0, items: BOTTOM_BAR_ITEMS, onItemClick: function (self, item, index) { clickedIndex = index; } });
    await wait(30);
    const button = bar.itemObjList[1].icon.elem;
    const isButton = button.getAttribute("role") === "button" && button.getAttribute("aria-label") === "Basket" && button.tabIndex === 0;
    key(button, "keydown", "Enter");
    check("BottomBar: an item is a button; Enter chooses it like a click", isButton && clickedIndex === 1 && bar.selectedIndex === 1, "button: " + isButton + ", onItemClick: " + clickedIndex);
    bar.remove();
});

test("Badge: showZero shows 0, dotForOne: 0 shows 1 as a number; the defaults are as before", async function () {
    const holder = Box(0, 0, 60, 60);
    const badge = createIn(holder, function () { return Badge({ value: 0, showZero: 1, dotForOne: 0 }); });
    const plain = createIn(holder, function () { return Badge({ value: 1 }); });
    const zero = badge.state + ":" + badge.label.text;
    badge.setValue(1);
    const one = badge.state + ":" + badge.label.text;
    badge.setValue("");
    const empty = badge.state;
    const plainOne = plain.state;
    plain.setValue(0);
    const plainZero = plain.state;
    const isRight = zero === "number:0" && one === "number:1" && empty === "hidden" && plainOne === "dot" && plainZero === "hidden";
    check("Badge: showZero shows 0, dotForOne: 0 shows 1 as a number; the defaults are as before", isRight, [zero, one, empty, plainOne, plainZero].join(" / "));
    holder.remove();
});

// *** APP BAR, PAGE HEADER, SETTINGS ROW (comp/app-bar.js, comp/page-header.js, comp/settings-row.js)

test("AppBar: the title stands at the left (after the back button) or in the middle of the bar", async function () {
    const BAR_WIDTH = 600;
    const holder = Box(0, 0, BAR_WIDTH, 200, { color: "transparent" });
    const bar = createIn(holder, function () { return AppBar({ titleText: "Settings", titleAlign: "left" }); });
    const placeOfTitle = function () {
        const barRect = bar.elem.getBoundingClientRect();
        const rect = bar.lblTitle.elem.getBoundingClientRect();
        return { left: Math.round(rect.left - barRect.left), right: Math.round(barRect.right - rect.right) };
    };
    const atLeft = placeOfTitle();
    bar.setBackVisible(1);
    const afterBack = placeOfTitle();
    bar.setTitleAlign("center");
    const inMiddle = placeOfTitle();
    const isLeft = atLeft.left === 20 && afterBack.left === 70;
    const isMiddle = inMiddle.left === inMiddle.right && bar.lblTitle.elem.style.textAlign === "center";
    check("AppBar: the title stands at the left (after the back button) or in the middle of the bar", isLeft && isMiddle, JSON.stringify({ atLeft: atLeft, afterBack: afterBack, inMiddle: inMiddle }));
    holder.remove();
});

test("PageHeader: the back link calls onBack (a click, Enter, Space; a held key once)", async function () {
    let backs = 0;
    const header = PageHeader({ titleText: "Security", backText: "Settings", onBack: function () { backs++; } });
    header.btnBack.elem.click();
    key(header.btnBack.elem, "keydown", "Enter");
    key(header.btnBack.elem, "keydown", " ");
    key(header.btnBack.elem, "keydown", " ", { repeat: true });
    check("PageHeader: the back link calls onBack (a click, Enter, Space; a held key once)", backs === 3, "onBack: " + backs);
    header.remove();
});

test("SettingsRow: setDescriptionText moves the title up from the middle and back", async function () {
    const TEXT_SHIFT = 14; // style.layout.textShift
    const SLIDE_WAIT = 450; // ms: the slide is 0.3 s
    const row = SettingsRow({ width: 600, titleText: "Video Quality" });
    await wait(60); // WHY: setMotion() turns the slide on a moment after the creation (no motion at the first view)
    const middleOfTitle = function () {
        const rowRect = row.elem.getBoundingClientRect();
        const rect = row.lblTitle.elem.getBoundingClientRect();
        return Math.round(rect.top + rect.height / 2 - rowRect.top);
    };
    const inMiddle = middleOfTitle();
    row.setDescriptionText("Remaining disk space: 2.3GB");
    await wait(SLIDE_WAIT);
    const withText = middleOfTitle();
    const textOpacity = getComputedStyle(row.lblDesc.elem).opacity;
    row.setDescriptionText("");
    await wait(SLIDE_WAIT);
    const back = middleOfTitle();
    const isMoved = Math.abs(inMiddle - withText - TEXT_SHIFT) <= 1 && Math.abs(back - inMiddle) <= 1 && textOpacity === "1";
    check("SettingsRow: setDescriptionText moves the title up from the middle and back", isMoved, "middle: " + inMiddle + ", with a text: " + withText + ", again: " + back + ", text opacity: " + textOpacity);
    row.remove();
});

test("SettingsRow: a click on a control in the row is not a click of the row", async function () {
    let clicks = 0;
    const row = SettingsRow({
        titleText: "Theme",
        onClick: function () { clicks++; },
        control: function () { return Box({ width: 40, height: 40, clickable: 1 }); },
    });
    row.controlObject.elem.click();
    const afterControl = clicks;
    row.elem.click();
    check("SettingsRow: a click on a control in the row is not a click of the row", afterControl === 0 && clicks === 1, "after the control: " + afterControl + ", after the row: " + clicks);
    row.remove();
});

// *** ACTION TAB BAR (comp/action-tab-bar.js)

test("ActionTabBar: setValue moves the line under the tab, the + calls onAction", async function () {
    let changes = 0;
    let actions = 0;
    const bar = ActionTabBar({
        items: [{ key: "a", text: "A" }, { key: "b", text: "B" }, { key: "c", text: "C" }],
        onChange: function () { changes++; },
        onAction: function () { actions++; },
    });
    const lineLeft = function () { return new DOMMatrix(getComputedStyle(bar.indicator.elem).transform).m41; };
    const startLeft = lineLeft();
    bar.setValue("c");
    bar.indicator.elem.getAnimations().forEach(function (motion) { motion.finish(); }); // WHY: the end of the slide, without waiting
    const moved = lineLeft() - startLeft;
    const expected = 2 * (bar.style.item.width + bar.style.item.gap);
    const isSelected = bar.tabList.elem.children[2].getAttribute("aria-selected") === "true";
    bar.btnAction.elem.click();
    check("ActionTabBar: setValue moves the line under the tab, the + calls onAction", bar.value === "c" && changes === 1 && Math.abs(moved - expected) < 1 && isSelected && actions === 1, "value: " + bar.value + ", onChange: " + changes + ", moved: " + moved + " (" + expected + "), selected: " + isSelected + ", onAction: " + actions);
    bar.remove();
});

// *** STEP BAR (comp/step-bar.js)

test("StepBar: behind, now and not reached; the lines join the circles; setStep(), next(), previous() stay in range", async function () {
    const bar = StepBar({ left: 0, top: 0, width: 400, steps: ["Cart", { key: "a", text: "<b>Address</b>", description: "Street" }, "Pay", "Done"], currentStep: 1 });
    await wait(20);
    const columns = Array.from(bar.row.elem.children);
    const circleText = function (index) { return columns[index].querySelector("svg") ? "check" : columns[index].children[2].textContent; };
    const states = [0, 1, 2, 3].map(circleText).join();
    const current = columns.map(function (column) { return column.getAttribute("aria-current") || "-"; }).join();
    const plain = [bar.elem.querySelectorAll("b").length, bar.elem.textContent.includes("<b>Address</b>")].join();
    const circleRect = columns[1].children[2].getBoundingClientRect();
    const before = columns[1].children[0].getBoundingClientRect();
    const after = columns[0].children[1].getBoundingClientRect();
    const joined = (Math.abs((before.top + before.height / 2) - (circleRect.top + circleRect.height / 2)) <= 1 && before.right < circleRect.left && after.right >= before.left - 1);
    bar.next();
    bar.next();
    bar.next();
    bar.next();
    const allDone = [bar.getStep(), columns.every(function (column) { return !!column.querySelector("svg"); })].join();
    bar.previous();
    bar.setStep(-4);
    const atStart = bar.getStep();
    bar.setStep("2");
    const fromText = bar.getStep();
    check("StepBar: behind, now and not reached; the lines join the circles; setStep(), next(), previous() stay in range",
        states === "check,2,3,4" && current === "-,step,-,-" && plain === "0,true" && joined && allDone === "4,true" && atStart === 0 && fromText === 2,
        [states, current, plain, joined, allDone, atStart, fromText].join(" | "));
    bar.remove();
});

test("StepBar: a step that is behind can be clicked (and Enter), not the others; canGoBack: 0 none", async function () {
    const clicks = [];
    const bar = StepBar({ left: 0, top: 0, width: 400, steps: ["A", "B", "C"], currentStep: 1, onStepClick: function (self, index) { clicks.push(index); } });
    await wait(20);
    const columns = Array.from(bar.row.elem.children);
    columns.forEach(function (column) { column.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    key(columns[0], "keydown", "Enter");
    const tabs = columns.map(function (column) { return column.tabIndex; }).join();
    const roles = columns.map(function (column) { return column.getAttribute("role"); }).join();
    bar.remove();
    const closed = StepBar({ left: 0, top: 0, width: 400, steps: ["A", "B"], currentStep: 1, canGoBack: 0, onStepClick: function (self, index) { clicks.push("no " + index); } });
    closed.row.elem.children[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    closed.remove();
    check("StepBar: a step that is behind can be clicked (and Enter), not the others; canGoBack: 0 none",
        clicks.join() === "0,0" && tabs === "0,-1,-1" && roles === "button,listitem,listitem", [clicks.join(), tabs, roles].join(" | "));
});

test("StepBar: setSteps(), showTitles: 0, setTheme()", async function () {
    const bar = StepBar({ left: 0, top: 0, width: 400, steps: ["A", "B", "C"], currentStep: 2, style: { circle: { size: 36 } } });
    await wait(20);
    bar.setSteps(["X", "Y"]);
    const after = [bar.row.elem.children.length, bar.getStep()].join();
    const circle = bar.row.elem.children[0].children[2];
    const light = circle.style.backgroundColor;
    bar.setTheme("dark");
    const dark = [circle.style.backgroundColor !== light, circle.offsetWidth].join();
    bar.remove();
    const quiet = StepBar({ left: 0, top: 0, width: 400, steps: ["A", "B"], showTitles: 0 });
    const titles = Array.from(quiet.elem.querySelectorAll(".basic_label")).filter(function (label) { return label.textContent === "A" && label.getClientRects().length > 0; }).length;
    quiet.remove();
    check("StepBar: setSteps(), showTitles: 0, setTheme()", after === "2,2" && dark === "true,36" && titles === 0, [after, dark, titles].join(" | "));
});
