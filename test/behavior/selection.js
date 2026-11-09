/* Bismillah */

/*
BEHAVIOR TESTS: SELECTION
The tests of test/behavior-test.htm for choices and lists (ItemList, CheckBox, Toggle, FullScreenSelect, PeriodBar...).
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

// *** TOGGLE (comp/toggle.js)

test("Toggle: the keyboard and screen readers can use it", async function () {
    const toggle = Toggle({ value: 0 });
    check("Toggle: it is a switch", toggle.elem.getAttribute("role") === "switch", toggle.elem.getAttribute("role"));
    check("Toggle: Tab reaches it", toggle.elem.tabIndex === 0, toggle.elem.tabIndex);
    check("Toggle: off is read", toggle.elem.getAttribute("aria-checked") === "false", toggle.elem.getAttribute("aria-checked"));
    key(toggle.elem, "keydown", " ");
    check("Toggle: Space turns it on", toggle.value === 1 && toggle.elem.getAttribute("aria-checked") === "true", toggle.value);
    key(toggle.elem, "keydown", " ", { repeat: true });
    check("Toggle: a held key turns it once", toggle.value === 1, toggle.value);
    toggle.setSecondState("disabled");
    key(toggle.elem, "keydown", "Enter");
    check("Toggle: a disabled one does not change", toggle.value === 1 && toggle.elem.tabIndex === -1, toggle.value);
    toggle.remove();
});

test("Toggle: setValue() calls onChange, setValue(value, 1) does not; nothing at create time", async function () {
    const changes = [];
    const toggle = Toggle({ value: 0, onChange: function (self) { changes.push(self.value); } });
    const atCreate = changes.length;
    toggle.setValue(1);
    toggle.setValue(0, 1);
    check("Toggle: setValue() calls onChange, setValue(value, 1) does not; nothing at create time",
        atCreate === 0 && changes.join(",") === "1" && toggle.value === 0 && toggle.state === "normal",
        "at create: " + atCreate + ", changes: " + changes.join(",") + ", value: " + toggle.value + ", state: " + toggle.state);
    toggle.remove();
});

// *** ITEM LIST (comp/item-list.js)

test("ItemList: style.hover {} means no look under the mouse, the default stays without it", async function () {
    const listWithoutHover = ItemList({ width: 200, height: 100, items: ["A"], style: { hover: {} } });
    const lightWithoutHover = ItemList({ width: 200, height: 100, items: ["A"], styleName: "light", style: { hover: {} } });
    const defaultList = ItemList({ width: 200, height: 100, items: ["A"] });
    const colors = [listWithoutHover.style.hover.color, lightWithoutHover.style.hover.color, defaultList.style.hover.color];
    check("ItemList: style.hover {} means no look under the mouse, the default stays without it",
        colors[0] === undefined && colors[1] === undefined && colors[2] === "white", colors.join(" / "));
    listWithoutHover.remove();
    lightWithoutHover.remove();
    defaultList.remove();
});

test("ItemList: ozden draws a line above and under the row under the mouse, the own shadow of a row stays", async function () {
    // WHY: The browser writes a shadow in its own words: the expected ones are read back the same way.
    const asWritten = function (shadow) {
        const probe = document.createElement("div");
        probe.style.boxShadow = shadow;
        return probe.style.boxShadow;
    };
    const OWN_SHADOW = asWritten("inset 0 -1px 0 " + Black(0.05));
    const hover = (row, isOver) => row.elem.dispatchEvent(new MouseEvent(isOver ? "mouseenter" : "mouseleave"));
    const shadowsUnderMouse = function (row) {
        hover(row, 1);
        const over = row.elem.style.boxShadow;
        hover(row, 0);
        return [over, row.elem.style.boxShadow];
    };
    const ozdenList = ItemList({ width: 300, height: 300, items: ["Apple", "Banana"], selectedKeys: ["1"] });
    const shadowList = ItemList({ width: 300, height: 300, items: ["Apple"], style: { row: { boxShadow: OWN_SHADOW } } });
    // WHY an own shadow: light has no lines and no shadow of its own; a package without lines never touches it.
    const lightList = ItemList({ width: 300, height: 300, items: ["Apple"], styleName: "light", style: { row: { boxShadow: OWN_SHADOW } } });
    const ozden = shadowsUnderMouse(ozdenList.getRow("0"));
    const selected = shadowsUnderMouse(ozdenList.getRow("1"));
    const own = shadowsUnderMouse(shadowList.getRow("0"));
    const lightBefore = lightList.getRow("0").elem.style.boxShadow;
    const light = shadowsUnderMouse(lightList.getRow("0"));
    const LINES = "inset 0 1px 0 " + Black(0.2) + ", inset 0 -1px 0 " + Black(0.2);
    const isOzdenOk = ozden[0] === asWritten(LINES) && ozden[1] === "";
    const isSelectedOk = selected[0] === "" && selected[1] === "";
    const isOwnOk = own[0] === asWritten(LINES + ", " + OWN_SHADOW) && own[1] === OWN_SHADOW;
    const isLightOk = lightBefore === OWN_SHADOW && light[0] === OWN_SHADOW && light[1] === OWN_SHADOW;
    check("ItemList: ozden draws a line above and under the row under the mouse, the own shadow of a row stays",
        isOzdenOk && isSelectedOk && isOwnOk && isLightOk,
        "ozden: " + ozden.join(" -> ") + " | selected: " + selected.join(" -> ") + " | own: " + own.join(" -> ") + " | light: " + light.join(" -> "));
    ozdenList.remove();
    shadowList.remove();
    lightList.remove();
});

test("ItemList: setActiveKey gives a row the look of the mouse, also a selected one that can be chosen again; null takes it back", async function () {
    // WHY canSelectAgain 1: the selected row of ozden can not be chosen again (no look at all: its own test).
    const list = ItemList({ width: 300, height: 300, items: ["Apple", "Banana"], selectedKeys: ["1"], style: { selected: { canSelectAgain: 1 } } });
    const lookOf = (key) => list.getRow(key).elem.style.backgroundColor + " / " + (list.getRow(key).elem.style.boxShadow ? "lines" : "none");
    list.setActiveKey("0");
    const apple = lookOf("0");
    list.setActiveKey("1");
    const appleAfter = lookOf("0");
    const banana = lookOf("1");
    list.setActiveKey(null);
    const bananaAfter = lookOf("1");
    list.remove();
    const isOk = apple === "white / lines" && appleAfter === "transparent / none" && banana === "white / lines" && bananaAfter === "transparent / none";
    check("ItemList: setActiveKey gives a row the look of the mouse, also a selected one that can be chosen again; null takes it back", isOk,
        "Apple: " + apple + " -> " + appleAfter + ", Banana (selected): " + banana + " -> " + bananaAfter);
});

test("SelectBox ozden: the active row gets a line above and under it (its own rows and the rows of an ItemList), classic none", async function () {
    // WHY: The browser writes a shadow in its own words: the expected one is read back the same way.
    const probe = document.createElement("div");
    probe.style.boxShadow = "inset 0 1px 0 " + Black(0.2) + ", inset 0 -1px 0 " + Black(0.2);
    const LINES = probe.style.boxShadow;
    const createRowView = function (option) { Label({ text: option.label }); };
    // The shadows of the first row, of the third row and of the first row again, while the mouse moves on them.
    // (The selected one can not be chosen again in ozden: its own test, canSelectAgain.)
    const activeShadows = function (params) {
        const select = SelectBox(Object.assign({ width: 240, options: ["Apple", "Banana", "Cherry"], value: "Banana" }, params));
        select.open();
        const rows = [...select.panel.elem.querySelectorAll('[role="option"]')];
        rows[0].dispatchEvent(new MouseEvent("mousemove"));
        const first = rows[0].style.boxShadow;
        rows[2].dispatchEvent(new MouseEvent("mousemove"));
        const third = rows[2].style.boxShadow;
        const firstAfter = rows[0].style.boxShadow;
        select.close();
        select.remove();
        return [first, third, firstAfter];
    };
    const ownRows = activeShadows({ styleName: "ozden" });
    const listRows = activeShadows({ styleName: "ozden", createItemView: createRowView });
    const classicRows = activeShadows({ createItemView: createRowView });
    const hasLines = (shadows) => shadows[0] === LINES && shadows[1] === LINES && shadows[2] === "";
    const isOk = hasLines(ownRows) && hasLines(listRows) && classicRows.join("") === "";
    check("SelectBox ozden: the active row gets a line above and under it (its own rows and the rows of an ItemList), classic none", isOk,
        "own rows: " + ownRows.join(" | ") + " ;; ItemList rows: " + listRows.join(" | ") + " ;; classic: " + classicRows.join(" | "));
});

test("SelectBox: a search box in a package of SearchInput (ozden) has its look, not the classic keys of SelectBox", async function () {
    const lookOf = function (params) {
        const select = SelectBox(Object.assign({ width: 240, options: ["Apple", "Banana"], searchable: 1 }, params));
        const search = select.searchGroup;
        const look = [search.fontSize, search.searchIconSize, search.searchIconOpacity, (search.clearIconFile === SearchInput.styles.ozden.clearIconFile) ? "ozden icon" : "classic icon"].join(" / ");
        select.remove();
        return look;
    };
    const ozden = lookOf({ styleName: "ozden" });
    const classic = lookOf({});
    check("SelectBox: a search box in a package of SearchInput (ozden) has its look, not the classic keys of SelectBox",
        ozden === "20 / 24 / 0.4 / ozden icon" && classic === "14 / 16 / 0.55 / classic icon", "ozden: " + ozden + ", classic: " + classic);
});

test("SelectBox ozden: the selected row can not be chosen again (no look, the keys skip it, a click does nothing), classic can", async function () {
    const createRowView = function (option) { Label({ text: option.label }); };
    // The mouse on Apple, then on the selected Banana; the arrow down from Apple; a click on Banana.
    const tryAgain = function (params) {
        const select = SelectBox(Object.assign({ width: 240, options: ["Apple", "Banana", "Cherry"], value: "Banana", searchable: 1 }, params));
        select.open();
        const rowsOf = function () { return [...select.panel.elem.querySelectorAll('[role="option"]')]; };
        const lookOf = function (row) { return (row.style.backgroundColor === "transparent" || row.style.backgroundColor === "") ? "-" : "lit"; };
        rowsOf()[0].dispatchEvent(new MouseEvent("mousemove"));
        rowsOf()[1].dispatchEvent(new MouseEvent("mousemove"));
        const onSelected = rowsOf().map(lookOf).join("");
        const cursor = rowsOf()[1].style.cursor;
        rowsOf()[0].dispatchEvent(new MouseEvent("mousemove"));
        key(select.searchInput.inputElement, "keydown", "ArrowDown");
        const afterKey = rowsOf().map(lookOf).join("");
        rowsOf()[1].click();
        const result = [onSelected, cursor, afterKey, select.isOpen() ? "open" : "closed", select.value].join(" / ");
        select.close();
        select.remove();
        return result;
    };
    const ozdenRows = tryAgain({ styleName: "ozden" });
    const ozdenListRows = tryAgain({ styleName: "ozden", createItemView: createRowView });
    const classicRows = tryAgain({});
    const classicListRows = tryAgain({ createItemView: createRowView }); // WHY: its ItemList gets the 1 of SelectBox
    const LOCKED = "--- / default / --lit / open / Banana";
    const FREE = "-lit- / pointer / -lit- / closed / Banana";
    const isOk = ozdenRows === LOCKED && ozdenListRows === LOCKED && classicRows === FREE && classicListRows === FREE;
    check("SelectBox ozden: the selected row can not be chosen again (no look, the keys skip it, a click does nothing), classic can", isOk,
        "ozden: " + ozdenRows + " ;; ozden ItemList rows: " + ozdenListRows + " ;; classic: " + classicRows + " ;; classic ItemList rows: " + classicListRows);
});

test("ItemList ozden: the selected row (single) can not be chosen again (a click, Enter, Space do nothing; no hand), light can", async function () {
    // The mouse on the selected Banana, then a click, Enter and Space on it.
    const tryAgain = function (params) {
        const clicked = [];
        const list = ItemList(Object.assign({ width: 300, height: 300, items: ["Apple", "Banana"], selectedKeys: ["1"], onItemClick: function (self, item) { clicked.push(item); } }, params));
        const banana = list.getRow("1").elem;
        banana.dispatchEvent(new MouseEvent("mouseenter"));
        const look = banana.style.backgroundColor;
        banana.click();
        key(banana, "keydown", "Enter");
        key(banana, "keydown", " ");
        const result = [clicked.length, banana.style.cursor, look].join(" / ");
        list.remove();
        return result;
    };
    const ozden = tryAgain({});
    const light = tryAgain({ styleName: "light" });
    check("ItemList ozden: the selected row (single) can not be chosen again (a click, Enter, Space do nothing; no hand), light can",
        ozden === "0 / default / transparent" && light.startsWith("3 / pointer"), "ozden: " + ozden + " ;; light: " + light);
});

test("ItemList in a combobox: setActiveKey leaves the look of the mouse only on the active row", async function () {
    const list = ItemList({ width: 300, height: 300, items: ["Apple", "Banana", "Cherry"] });
    list.getRow("0").elem.dispatchEvent(new MouseEvent("mouseenter"));
    const mouseRow = list.getRow("0").elem.style.backgroundColor;
    list.setActiveKey("2");
    const looks = ["0", "1", "2"].map(function (k) { return list.getRow(k).elem.style.backgroundColor; }).join(",");
    list.remove();
    check("ItemList in a combobox: setActiveKey leaves the look of the mouse only on the active row",
        mouseRow === "white" && looks === "transparent,transparent,white", "the mouse row: " + mouseRow + ", after the keys: " + looks);
});

test("ItemList: Enter and Space are a click (onItemClick), the Tab order starts at the selection", async function () {
    const clicked = [];
    const menu = ItemList({ width: 300, height: 300, items: ["Home", "Settings"], selection: "none", onItemClick: function (self, item) { clicked.push(item); } });
    key(menu.getRow("0").elem, "keydown", "Enter");
    key(menu.getRow("1").elem, "keydown", " ");
    const list = ItemList({ width: 300, height: 300, items: ["Apple", "Banana", "Cherry"], selectedKeys: ["2"] });
    const tabRows = ["0", "1", "2"].filter(function (k) { return list.getRow(k).elem.tabIndex === 0; }).join(",");
    menu.remove();
    list.remove();
    check("ItemList: Enter and Space are a click (onItemClick), the Tab order starts at the selection",
        clicked.join(",") === "Home,Settings" && tabRows === "2", "clicked: " + clicked.join(",") + ", the row of the Tab order: " + tabRows);
});

test("ItemList: letters (type-ahead) and PageDown / PageUp move the focus", async function () {
    const titles = ["Apple", "Banana", "Blueberry", "Cherry", "Çilek", "Date", "Elderberry", "Fig", "Grape", "Kiwi", "Lemon", "Mango"];
    const list = ItemList({ width: 300, height: 400, items: titles });
    const focusedTitle = function () {
        const index = titles.findIndex(function (title, i) { return list.getRow(String(i)).elem === document.activeElement; });
        return titles[index] || "-";
    };
    const type = function (letter) { key(document.activeElement, "keydown", letter); };
    list.focusItem("0");
    const steps = [];
    type("b");
    steps.push(focusedTitle()); // Banana
    type("b");
    steps.push(focusedTitle()); // the same letter again: Blueberry
    await wait(700); // WHY: a new word after TYPE_AHEAD_TIME
    type("c");
    steps.push(focusedTitle()); // Cherry
    type("c");
    steps.push(focusedTitle()); // Çilek (without its mark)
    await wait(700);
    type("f");
    type("i");
    steps.push(focusedTitle()); // a word: Fig
    const pageCount = Math.max(1, Math.floor(list.scrollBox.elem.clientHeight / list.getRow("0").elem.offsetHeight) - 1);
    key(document.activeElement, "keydown", "PageDown");
    const afterPageDown = focusedTitle();
    key(document.activeElement, "keydown", "PageUp");
    const afterPageUp = focusedTitle();
    list.remove();
    const expectedDown = titles[Math.min(titles.length - 1, 7 + pageCount)];
    const isOk = steps.join(",") === "Banana,Blueberry,Cherry,Çilek,Fig" && afterPageDown === expectedDown && afterPageUp === "Fig";
    check("ItemList: letters (type-ahead) and PageDown / PageUp move the focus", isOk,
        steps.join(" > ") + ", PageDown: " + afterPageDown + " (" + expectedDown + "), PageUp: " + afterPageUp);
});

test("ItemList multiple: Shift + arrows and Shift + click select a range, Ctrl / Cmd + A all the shown items", async function () {
    const list = ItemList({ width: 300, height: 400, selection: "multiple", items: ["A", "B", "C", "D", "E", "F"] });
    const selected = function () { return list.getSelectedKeys().slice().sort().join(""); };
    list.getRow("1").elem.click(); // B: the start of a range
    list.focusItem("1");
    key(list.getRow("1").elem, "keydown", "ArrowDown", { shiftKey: true });
    key(list.getRow("2").elem, "keydown", "ArrowDown", { shiftKey: true });
    const down = selected();
    key(list.getRow("3").elem, "keydown", "ArrowUp", { shiftKey: true }); // back: D leaves the range
    const back = selected();
    list.getRow("5").elem.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    const shiftClick = selected();
    key(list.getRow("5").elem, "keydown", "a", { ctrlKey: true });
    const all = selected();
    key(list.getRow("5").elem, "keydown", "a", { metaKey: true }); // all are selected: none
    const none = selected();
    list.remove();
    const isOk = down === "123" && back === "12" && shiftClick === "12345" && all === "012345" && none === "";
    check("ItemList multiple: Shift + arrows and Shift + click select a range, Ctrl / Cmd + A all the shown items", isOk,
        "Shift + down: " + down + ", back: " + back + ", Shift + click: " + shiftClick + ", Ctrl + A: " + all + ", again: " + (none || "-"));
});

test("ItemList search box: the arrow down goes into the list, the arrow up from its first row back, Escape clears it", async function () {
    const list = ItemList({ width: 300, height: 400, showSearch: 1, items: ["Apple", "Banana", "Cherry"], selectedKeys: ["1"] });
    const input = list.searchInput.txtSearch.inputElement;
    input.focus();
    key(input, "keydown", "ArrowDown");
    const intoList = (document.activeElement === list.getRow("1").elem); // the selected row (the Tab order)
    list.focusItem("0");
    key(list.getRow("0").elem, "keydown", "ArrowUp");
    const backToSearch = (document.activeElement === input);
    list.search("ban");
    key(input, "keydown", "Escape");
    const shownAfterEscape = ["0", "1", "2"].filter(function (k) { return list.getRow(k).visible == 1; }).length;
    const textAfterEscape = input.value;
    list.remove();
    check("ItemList search box: the arrow down goes into the list, the arrow up from its first row back, Escape clears it",
        intoList && backToSearch && shownAfterEscape === 3 && textAfterEscape === "",
        "into the list: " + intoList + ", back: " + backToSearch + ", rows after Escape: " + shownAfterEscape + ", text: \"" + textAfterEscape + "\"");
});

test("ItemList: a search with no result shows its text in the list", async function () {
    const list = ItemList({ width: 300, height: 300, items: ["Apple", "Banana"] });
    await wait(30);
    list.search("zzz");
    const listRect = list.elem.getBoundingClientRect();
    const textRect = list.lblEmpty.elem.getBoundingClientRect();
    const isInList = list.lblEmpty.visible == 1 && textRect.left >= listRect.left && textRect.right <= listRect.right + 1;
    check("ItemList: a search with no result shows its text in the list", isInList, "list left: " + listRect.left + ", text left: " + textRect.left);
    list.remove();
});

test("ItemList: a section is shown while one of its items matches", async function () {
    const list = ItemList({ width: 300, height: 400, items: [
        { type: "section", key: "fruits", text: "FRUITS" }, "Apple", "Banana",
        { type: "section", key: "vegetables", text: "VEGETABLES" }, "Carrot",
    ] });
    const count = list.search("carr"); // the count of the items (the sections are not counted)
    const fruits = list.getRow("fruits").visible;
    const vegetables = list.getRow("vegetables").visible;
    list.search("");
    list.setSelected(["fruits", "2"], 1); // a section is never selected
    const selected = list.getSelectedKeys().join(",");
    list.focusItem("2"); // Banana
    key(list.getRow("2").elem, "keydown", "ArrowDown"); // the section is skipped: Carrot
    const isCarrotFocused = (document.activeElement === list.getRow("4").elem);
    check("ItemList: a section is shown while one of its items matches", count === 1 && fruits == 0 && vegetables == 1 && selected === "2" && isCarrotFocused, "count: " + count + ", FRUITS: " + fruits + ", VEGETABLES: " + vegetables + ", selected: " + selected + ", Carrot focused: " + isCarrotFocused);
    list.remove();
});

test("ItemList: a click paints style.pressed.color at once, then the row fades back", async function () {
    const PRESSED = "rgba(0, 0, 0, 0.2)";
    const list = ItemList({ width: 300, height: 300, items: ["Apple", "Banana"], style: { pressed: { color: PRESSED }, row: { motion: "background-color 0.1s" } } });
    await wait(60); // WHY: setMotion() sets the row motion a moment after create
    const row = list.getRow("0");
    row.elem.click(); // single selection: the selection paints the row too, the pressed color must stay
    const atClick = getComputedStyle(row.elem).backgroundColor;
    await wait(400);
    const afterMotion = getComputedStyle(row.elem).backgroundColor;
    check("ItemList: a click paints style.pressed.color at once, then the row fades back", atClick === PRESSED && afterMotion === "rgba(0, 0, 0, 0)", "at the click: " + atClick + ", after the motion: " + afterMotion);
    list.remove();
});

test("ItemList: animated removeItem: the count changes at once, the row leaves after its motion", async function () {
    const hasMotion = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const list = ItemList({ width: 300, height: 300, animated: 1, items: ["Apple", "Banana", "Cherry"], selectedKeys: ["0"] });
    await wait(60);
    const row = list.getRow("0");
    list.removeItem("0", 1);
    const countAtOnce = list.getItems().length;
    const selectedAtOnce = list.getSelectedKeys().length;
    const isFading = document.body.contains(row.elem);
    await wait(700); // the fade (0.25 s), then the move of the rows under it (0.25 s)
    const isGone = !document.body.contains(row.elem);
    const bananaMove = getComputedStyle(list.getRow("1").elem).transform;
    check("ItemList: animated removeItem: the count changes at once, the row leaves after its motion", countAtOnce === 2 && selectedAtOnce === 0 && isFading === hasMotion && isGone && bananaMove === "none", "count: " + countAtOnce + ", selected: " + selectedAtOnce + ", fading: " + isFading + " (motion: " + hasMotion + "), gone: " + isGone + ", Banana: " + bananaMove);
    list.remove();
});

// *** FULL SCREEN SELECT (comp/full-screen-select.js)

test("FullScreenSelect: searchIconFile / clearIconFile go to the search box of the list (none given: SearchInput's own)", async function () {
    const SEARCH_FILE = "../comp/search-input/search.svg?given";
    const CLEAR_FILE = "../comp/search-input/clear.svg?given";
    const given = FullScreenSelect({ items: ["A", "B"], searchIconFile: SEARCH_FILE, clearIconFile: CLEAR_FILE });
    given.open();
    const search = given.panel.searchInput;
    const isGiven = search.searchIconFile === SEARCH_FILE && search.clearIconFile === CLEAR_FILE;
    given.close();
    const plain = FullScreenSelect({ items: ["A", "B"] });
    plain.open();
    const isDefault = plain.panel.searchInput.searchIconFile === SearchInputDefaults.searchIconFile;
    plain.close();
    check("FullScreenSelect: searchIconFile / clearIconFile go to the search box of the list (none given: SearchInput's own)", isGiven && isDefault, "given: " + isGiven + ", default: " + isDefault);
    given.remove();
    plain.remove();
});

// *** CHECK BOX (comp/check-box.js)

test("CheckBox: a held Space changes it once", async function () {
    let changes = 0;
    const checkBox = CheckBox({ labelText: "I agree", onChange: function () { changes++; } });
    key(checkBox.elem, "keydown", " ");
    key(checkBox.elem, "keydown", " ", { repeat: true });
    key(checkBox.elem, "keydown", " ", { repeat: true });
    key(checkBox.elem, "keydown", " ", { repeat: true });
    check("CheckBox: a held Space changes it once", changes === 1 && checkBox.checked == 1, "onChange: " + changes + ", checked: " + checkBox.checked);
    checkBox.remove();
});

test("CheckBox: wrapLabel wraps a long label and keeps the row in its width", async function () {
    const ROW_WIDTH = 300;
    const row = HGroup({ width: ROW_WIDTH, height: "auto", gap: 8 });
        const checkBox = CheckBox({ labelText: "A very long label that can not stay on one line in this narrow row", wrapLabel: 1, grow: 1 });
        const after = Box({ width: 40, height: 40 });
    endGroup();
    await wait(50);
    const rowRight = row.elem.getBoundingClientRect().right;
    const afterRight = after.elem.getBoundingClientRect().right;
    const labelHeight = checkBox.label.elem.offsetHeight;
    const markWidth = checkBox.mark.elem.offsetWidth;
    const isRight = afterRight <= rowRight + 1 && labelHeight > 30 && markWidth === checkBox.style.mark.width;
    check("CheckBox: wrapLabel wraps a long label and keeps the row in its width", isRight, "row right: " + rowRight + ", box right: " + afterRight + ", label height: " + labelHeight + ", mark: " + markWidth);
    row.remove();
});

// 2026-11-04: style.hoverMark gave only a border; its color (the "modern" package: white) was not read
test("CheckBox: hoverMark.color colors the empty square under the mouse", async function () {
    const checkBox = CheckBox({ labelText: "Hover", style: { mark: { color: "rgb(245, 245, 245)" }, hoverMark: { color: "rgb(255, 255, 255)" } } });
    const plain = CheckBox({ labelText: "Plain" }); // no hoverMark.color: the square keeps its color
    const colorOf = function (item) { return item.mark.elem.style.backgroundColor; };
    const plainBefore = colorOf(plain);
    checkBox.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    plain.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const hoverColor = colorOf(checkBox);
    const plainHover = colorOf(plain);
    checkBox.elem.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    const outColor = colorOf(checkBox);
    check("CheckBox: hoverMark.color colors the empty square under the mouse", hoverColor === "rgb(255, 255, 255)" && outColor === "rgb(245, 245, 245)" && plainHover === plainBefore, hoverColor + " / " + outColor + " / plain: " + plainBefore + " -> " + plainHover);
    [checkBox, plain].forEach(function (item) { item.remove(); });
});

test("CheckBox: animated 0 writes no motion; animated 1 grows the square under the mouse and back to still", async function () {
    const still = CheckBox({ labelText: "Still" });
    const moving = CheckBox({ labelText: "Moving", animated: 1 });
    [still, moving].forEach(function (item) { item.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); });
    const stillTransform = still.mark.elem.style.transform;
    const movingTransform = moving.mark.elem.style.transform;
    moving.setAnimated(0);
    const backToStill = moving.mark.elem.style.transform;
    const isRight = stillTransform === "" && movingTransform === "scale(1.05)" && backToStill === "none";
    check("CheckBox: animated 0 writes no motion; animated 1 grows the square under the mouse and back to still", isRight, [stillTransform, movingTransform, backToStill].join(" / "));
    [still, moving].forEach(function (item) { item.remove(); });
});

test("RadioButton: hoverMark.color colors the empty circle under the mouse", async function () {
    const radio = RadioButton({ group: "hoverMarkTest", labelText: "Hover", style: { mark: { color: "rgb(245, 245, 245)" }, hoverMark: { color: "rgb(255, 255, 255)" } } });
    const plain = RadioButton({ group: "hoverMarkTest", labelText: "Plain" }); // no hoverMark.color: the circle keeps its color
    const colorOf = function (item) { return item.mark.elem.style.backgroundColor; };
    const plainBefore = colorOf(plain);
    radio.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    plain.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    const hoverColor = colorOf(radio);
    const plainHover = colorOf(plain);
    radio.elem.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    const outColor = colorOf(radio);
    check("RadioButton: hoverMark.color colors the empty circle under the mouse", hoverColor === "rgb(255, 255, 255)" && outColor === "rgb(245, 245, 245)" && plainHover === plainBefore, hoverColor + " / " + outColor + " / plain: " + plainBefore + " -> " + plainHover);
    [radio, plain].forEach(function (item) { item.remove(); });
});

// *** TOGGLE (comp/toggle.js)

const FILTER_SECTIONS = [
    { key: "type", text: "Type", opened: 1, options: [{ key: "car", text: "Car" }, { key: "bus", text: "Bus", checked: 1 }] },
    { key: "fleet", text: "Fleet", opened: 0, options: ["North", "South"] },
];

test("Filters: the selection, onChange, silent and Clear all", async function () {
    let changes = 0;
    const filters = Filters({ sections: FILTER_SECTIONS, onChange: function () { changes++; } });
    await wait(30);
    const first = JSON.stringify(filters.getSelected());
    filters.setSelected("fleet", ["North"]);
    filters.setSelected("type", ["car"], 1);
    const second = JSON.stringify(filters.getSelected());
    filters.clearAll();
    check("Filters: the selection, onChange, silent and Clear all",
        first === '{"type":["bus"],"fleet":[]}' && second === '{"type":["car"],"fleet":["North"]}'
            && filters.getSelectedCount() === 0 && changes === 2 && FILTER_SECTIONS[0].options[1].checked === 1,
        [first, second, changes].join(" | "));
    filters.remove();
});

test("Filters: the search shows the matches of a closed section, and says when nothing matches", async function () {
    const filters = Filters({ sections: FILTER_SECTIONS });
    await wait(30);
    const closedRow = filters.sectionViews[1].rows[0].row;
    const hiddenAtFirst = closedRow.elem.offsetHeight === 0;
    filters.search("nor");
    const shownBySearch = closedRow.elem.offsetHeight > 0;
    filters.search("zzz");
    const noResult = filters.lblNoResult.elem.offsetHeight > 0;
    check("Filters: the search shows the matches of a closed section, and says when nothing matches",
        hiddenAtFirst && shownBySearch && noResult, [hiddenAtFirst, shownBySearch, noResult].join(" "));
    filters.remove();
});

test("Filters: a popup is closed by a click outside, and it goes with the component", async function () {
    const filters = Filters({ panelMode: "popup", panelOpened: 0, sections: FILTER_SECTIONS });
    await wait(30);
    filters.openPanel();
    const opened = filters.panelOpened;
    const panel = filters.panel;
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    const closed = filters.panelOpened;
    filters.remove();
    check("Filters: a popup is closed by a click outside, and it goes with the component",
        opened === 1 && closed === 0 && !document.body.contains(panel.elem), opened + " " + closed);
});

test("Toggle: selectedBorderColor is the line of the track when on, and it goes back when off", async function () {
    const toggle = Toggle({ value: 1, backgroundStyle: { borderColor: "gray", selectedBorderColor: "tomato" } });
    const onColor = toggle.background.borderColor;
    toggle.setValue(0);
    check("Toggle: selectedBorderColor is the line of the track when on, and it goes back when off",
        onColor === "tomato" && toggle.background.borderColor === "gray", onColor + " / " + toggle.background.borderColor);
    toggle.remove();
});

test("Toggle ozden: a darker line around the track when on (70 x 40, a round knob, as before)", async function () {
    const toggle = Toggle({ left: 20, top: 100, value: 1 });
    const on = { width: toggle.button.width, height: toggle.button.height, line: toggle.background.borderColor };
    toggle.setValue(0);
    const off = { width: toggle.button.width, height: toggle.button.height, line: toggle.background.borderColor };
    const isSize = toggle.width === 70 && toggle.height === 40 && on.width === 34 && on.height === 34 && off.width === 34;
    const isLine = on.line === Black(0.2) && off.line === Black(0.05);
    check("Toggle ozden: a darker line around the track when on (70 x 40, a round knob, as before)", isSize && isLine,
        "box: " + toggle.width + " x " + toggle.height + ", on: " + JSON.stringify(on) + ", off: " + JSON.stringify(off));
    toggle.remove();
});

test("Toggle ozden: when on, a shadow to the left of the knob and a thin line around it; none when off; a page's own shadow wins", async function () {
    const readShadow = (toggle) => getComputedStyle(toggle.button.elem).boxShadow;
    const toggle = Toggle({ left: 20, top: 100, value: 1 });
    const ownColors = Toggle({ left: 120, top: 100, value: 1, buttonStyle: { selectedColor: "gold" } });
    const ownShadow = Toggle({ left: 220, top: 100, value: 1, buttonStyle: { selectedShadow: "none" } });
    const classic = Toggle({ left: 320, top: 100, value: 1, styleName: "classic" });
    const on = readShadow(toggle);
    toggle.setValue(0);
    const off = readShadow(toggle);
    const hasBoth = on.includes("-4px 0px 6px -1px") && on.includes("0px 0px 0px 1px");
    const isClassicKept = readShadow(classic).includes("-1px 0px 6px 0px");
    check("Toggle ozden: when on, a shadow to the left of the knob and a thin line around it; none when off; a page's own shadow wins",
        hasBoth && off === "none" && readShadow(ownColors) === on && readShadow(ownShadow) === "none" && isClassicKept,
        [on, off, readShadow(ownColors), readShadow(ownShadow), readShadow(classic)].join(" / "));
    [toggle, ownColors, ownShadow, classic].forEach((item) => item.remove());
});

test("Toggle: a page's own line (borderColor) stays when on; one style object given to two toggles is not shared", async function () {
    const OWN = { backgroundStyle: { color: "black", selectedColor: "green", borderColor: "gray" } };
    const first = Toggle({ left: 20, top: 100, value: 1, ...OWN });
    const second = Toggle({ left: 120, top: 100, value: 1, ...OWN });
    first.setBackgroundSelectedColor("tomato");
    const isOwnLine = first.background.borderColor === "gray" && second.background.borderColor === "gray";
    const isNotShared = second.backgroundStyle.selectedColor === "green" && OWN.backgroundStyle.selectedColor === "green" && OWN.backgroundStyle.selectedBorderColor === undefined;
    check("Toggle: a page's own line (borderColor) stays when on; one style object given to two toggles is not shared", isOwnLine && isNotShared,
        "lines: " + first.background.borderColor + " / " + second.background.borderColor + ", second: " + second.backgroundStyle.selectedColor + ", the page's object: " + JSON.stringify(OWN.backgroundStyle));
    first.remove();
    second.remove();
});

test("Toggle: a mark shows in its state, setMarks changes it, a toggle without marks has empty marks", async function () {
    const toggle = Toggle({ styleName: "label", value: 0 });
    const plainToggle = Toggle({ value: 1 });
    await wait(30);
    const offState = toggle.onMarkBox.opacity + "/" + toggle.offMarkBox.opacity;
    const offText = toggle.offMarkBox.children[0].text;
    toggle.switch();
    const onState = toggle.onMarkBox.opacity + "/" + toggle.offMarkBox.opacity;
    toggle.setMarks("A", "B");
    const onText = toggle.onMarkBox.children[0].text;
    const emptyCount = plainToggle.onMarkBox.children.length + plainToggle.offMarkBox.children.length;
    check("Toggle: a mark shows in its state, setMarks changes it, a toggle without marks has empty marks",
        offState === "0/1" && onState === "1/0" && offText === "OFF" && onText === "A" && emptyCount === 0,
        [offState, onState, offText, onText, emptyCount].join(" "));
    toggle.remove();
    plainToggle.remove();
});

test("Toggle: a mark in the knob is inside the knob, a mark on the track is on the free side", async function () {
    const inKnob = Toggle({ styleName: "badge", value: 1 });
    const onTrack = Toggle({ styleName: "tick", value: 1 });
    await wait(250);
    const knobRect = inKnob.button.elem.getBoundingClientRect();
    const markRect = inKnob.onMarkBox.children[0].elem.getBoundingClientRect();
    const isInKnob = markRect.left >= knobRect.left && markRect.right <= knobRect.right;
    const trackKnobLeft = onTrack.button.elem.getBoundingClientRect().left;
    const trackMarkRight = onTrack.onMarkBox.children[0].elem.getBoundingClientRect().right;
    check("Toggle: a mark in the knob is inside the knob, a mark on the track is on the free side",
        isInKnob && trackMarkRight <= trackKnobLeft, [isInKnob, trackMarkRight, trackKnobLeft].join(" "));
    inKnob.remove();
    onTrack.remove();
});

test("Toggle: animated moves the marks, animated: 0 and a toggle without marks stay still", async function () {
    const moving = Toggle({ styleName: "badge", value: 1 });
    const still = Toggle({ styleName: "badge", value: 1, animated: 0 });
    const plain = Toggle({ value: 1 });
    await wait(30);
    const hiddenTransform = moving.offMarkBox.elem.style.transform;
    const shownTransform = moving.onMarkBox.elem.style.transform;
    moving.switch();
    const afterSwitch = moving.onMarkBox.elem.style.transform;
    still.switch();
    const stillTransform = still.onMarkBox.elem.style.transform + still.offMarkBox.elem.style.transform;
    const plainKnob = plain.button.elem.style.transform;
    moving.setAnimated(0);
    const afterOff = moving.onMarkBox.elem.style.transform + "/" + moving.offMarkBox.elem.style.transform;
    check("Toggle: animated moves the marks, animated: 0 and a toggle without marks stay still",
        hiddenTransform.includes("rotate") && shownTransform === "none" && afterSwitch.includes("rotate")
            && stillTransform === "" && plainKnob.startsWith("scale(1)") && afterOff === "none/none",
        [hiddenTransform, shownTransform, afterSwitch, stillTransform, plainKnob, afterOff].join(" | "));
    moving.remove();
    still.remove();
    plain.remove();
});

test("Toggle: a pressed knob gets flatter, and it comes back", async function () {
    const toggle = Toggle({ styleName: "tick", value: 1 });
    await wait(30);
    pointer(toggle.elem, "pointerdown", 10, 10, "mouse");
    const pressed = toggle.button.elem.style.transform;
    pointer(toggle.elem, "pointerup", 10, 10, "mouse");
    const released = toggle.button.elem.style.transform;
    check("Toggle: a pressed knob gets flatter, and it comes back",
        pressed.includes("scale(1.1, 0.92)") && !released.includes("0.92"), pressed + " | " + released);
    toggle.remove();
});

test("Toggle: float has a knob bigger than its track, a param still wins over the package", async function () {
    const toggle = Toggle({ styleName: "float", value: 1, backgroundStyle: { selectedColor: "tomato" } });
    await wait(30);
    const knobHeight = toggle.button.elem.getBoundingClientRect().height;
    const trackHeight = toggle.background.elem.getBoundingClientRect().height;
    check("Toggle: float has a knob bigger than its track, a param still wins over the package",
        knobHeight === 30 && trackHeight === 26 && toggle.backgroundStyle.selectedColor === "tomato", knobHeight + " / " + trackHeight);
    toggle.remove();
});

test("Toggle: the classic knob has the same size on and off (the ozden one is smaller when off)", async function () {
    const MOTION_WAIT = 300; // (the knob moves in 0.2 s)
    const knobWidth = function (toggle) { return toggle.button.elem.getBoundingClientRect().width; };
    const classicToggle = Toggle({ styleName: "classic", value: 0 });
    const ozdenToggle = Toggle({ value: 0 });
    await wait(MOTION_WAIT);
    const classicOff = knobWidth(classicToggle);
    const ozdenOff = knobWidth(ozdenToggle);
    classicToggle.setValue(1);
    ozdenToggle.setValue(1);
    await wait(MOTION_WAIT);
    const classicOn = knobWidth(classicToggle);
    const ozdenOn = knobWidth(ozdenToggle);
    const isClassicSame = Math.abs(classicOff - classicOn) < 0.5 && Math.round(classicOn) === 32;
    const isOzdenSmaller = ozdenOff < ozdenOn * 0.7;
    check("Toggle: the classic knob has the same size on and off (the ozden one is smaller when off)", isClassicSame && isOzdenSmaller, "classic: " + classicOff + " / " + classicOn + ", ozden: " + ozdenOff + " / " + ozdenOn);
    classicToggle.remove();
    ozdenToggle.remove();
});

// *** PERIOD BAR (comp/period-bar.js)

test("PeriodBar: selectPrevious shows the month before and calls onChange", async function () {
    let changes = 0;
    const bar = PeriodBar({ monthCount: 12, onChange: function () { changes++; } });
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1); // WHY: day 1, so the 31st does not jump over a short month
    const isMoved = bar.selectPrevious();
    const date = bar.getSelectedDate();
    const isLastMonth = date.year === lastMonth.getFullYear() && date.month === lastMonth.getMonth() + 1;
    bar.setValue(11, 1); // silent: no onChange
    const isStopped = bar.selectNext() === 0; // this month is the last one
    check("PeriodBar: selectPrevious shows the month before and calls onChange", isMoved === 1 && isLastMonth && changes === 1 && isStopped, "moved: " + isMoved + ", date: " + date.year + "/" + date.month + ", onChange: " + changes + ", stopped at the end: " + isStopped);
    bar.remove();
});

// *** ITEM LIST: its ground (comp/item-list.js)

test("ItemList: the ozden list has a gray ground of its own, so the white of a row under the mouse is seen on a white page", async function () {
    const lookOf = function (styleName) {
        const list = ItemList({ left: 0, top: 0, width: 200, height: 100, styleName: styleName, items: ["A"] });
        const look = { ground: getComputedStyle(list.elem).backgroundColor, hover: list.style.hover.color };
        list.remove();
        return look;
    };
    const ozden = lookOf("ozden");
    const dark = lookOf("ozdenDark");
    const old = lookOf("classic");
    const others = [lookOf("light").ground, lookOf("dark").ground].join(); // their own surfaces
    const own = ItemList({ left: 0, top: 0, width: 200, height: 100, items: ["A"], style: { box: { color: "transparent" } } });
    const pageCanChange = getComputedStyle(own.elem).backgroundColor;
    own.remove();
    check("ItemList: the ozden list has a gray ground of its own, so the white of a row under the mouse is seen on a white page",
        ozden.ground === "rgb(245, 245, 245)" && ozden.hover === "white" && dark.ground === "rgb(26, 26, 25)" && dark.hover === "#262624" && old.ground === ozden.ground &&
        others === "rgb(255, 255, 255),rgb(35, 35, 34)" && pageCanChange === "rgba(0, 0, 0, 0)",
        [ozden.ground, ozden.hover, dark.ground, dark.hover, old.ground, others, pageCanChange].join(" | "));
});

// *** ITEM LIST: the gallery packages (comp/item-list.js)

test("ItemList gallery: a photo fills its square with no filter, the selected one does not grow, two tiles in a row on a phone", async function () {
    const ITEMS = [{ key: "a", text: "A", iconFile: "../assets/cards/olives.png" }, { key: "b", text: "B", iconFile: "../assets/cards/dill.png" }];
    const lookOf = function (styleName) {
        const list = ItemList({ left: 0, top: 0, width: 300, height: 300, layout: "grid", styleName: styleName, items: ITEMS, selectedKeys: ["b"] });
        const pictures = [...list.elem.querySelectorAll("img")];
        const tops = pictures.map(function (img) { return Math.round(img.getBoundingClientRect().top); });
        const look = {
            fit: pictures.map(function (img) { return getComputedStyle(img).objectFit; }).join(),
            filter: pictures.map(function (img) { return getComputedStyle(img).filter; }).join(),
            grows: pictures.some(function (img) { return ["none", "matrix(1, 0, 0, 1, 0, 0)"].indexOf(getComputedStyle(img).transform) === -1; }),
            oneRow: pictures.length === 2 && tops[0] === tops[1],
        };
        list.remove();
        return look;
    };
    const light = lookOf("gallery");
    const dark = lookOf("galleryDark");
    const ozden = lookOf("ozden");
    check("ItemList gallery: a photo fills its square with no filter, the selected one does not grow, two tiles in a row on a phone",
        light.fit === "cover,cover" && light.filter === "none,none" && !light.grows && light.oneRow &&
        dark.fit === "cover,cover" && dark.filter === "none,none" && !dark.grows && dark.oneRow &&
        ozden.fit !== "cover,cover" && ozden.filter !== "none,none" && ozden.grows,
        JSON.stringify({ light: light, dark: dark, ozden: ozden }));
});

// *** TINY SELECT (comp/tiny-select.js)

test("TinySelect: an index that is not in the list shows emptyText (no error, no onChange), getSelectedItem() is null", async function () {
    const changes = [];
    const select = TinySelect({
        list: [{ value: "a", label: "A" }, { value: "b", label: "B" }],
        emptyText: "None",
        onChange: function (self) { changes.push(self.selectedIndex); },
    });
    const shown = [];
    let errorText = "";
    [select.getIndexByValue("missing"), 2, 0.5, null].forEach(function (index) {
        try {
            select.setSelectedIndex(index);
            shown.push(select.lblLabel.elem.textContent + ":" + select.getSelectedItem());
        } catch (error) { errorText = error.message; }
    });
    select.setSelectedIndex(select.getIndexByValue("b"));
    const chosen = select.lblLabel.elem.textContent;
    select.remove();
    check("TinySelect: an index that is not in the list shows emptyText (no error, no onChange), getSelectedItem() is null",
        errorText === "" && shown.join() === "None:null,None:null,None:null,None:null" && chosen === "B" && changes.join() === "1",
        "error: " + errorText + " | shown: " + shown.join() + " | then b: " + chosen + " | onChange: " + changes.join());
});
