/* Bismillah */

/*
BEHAVIOR TESTS: ACTIONS
The tests of test/behavior-test.htm for buttons, menus and bars of actions (SmartButton, ActionButton, ContextMenu, MenuBar, ToolBar...).
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

// *** ACTION BUTTON (comp/action-button.js)

test("ActionButton: a double click on an action calls onAction once", async function () {
    const calls = [];
    const button = ActionButton({ items: ["New file", "New folder"], onAction: function (self, k) { calls.push(k); } });
    button.openMenu();
    await wait(30);
    button.itemButtons[0].elem.click();
    button.itemButtons[0].elem.click();
    check("ActionButton: a double click on an action calls onAction once", calls.length === 1, "onAction: " + calls.join(", "));
    await wait(300);
    button.remove();
});

// *** CONTEXT MENU (comp/context-menu.js)

const MENU_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path d="M3 3h10v10H3z"/><\/svg>';

// A menu: [Open] [Copy to › (Mine, Other)], open at 100, 100
const openSubmenuTestMenu = async function (clicks) {
    const menu = ContextMenu({
        items: [
            { text: "Open", key: "open" },
            { text: "Copy to", key: "copyTo", icon: MENU_SVG, items: [{ text: "Mine", key: "mine" }, { text: "Other", key: "other" }] },
        ],
        onClick: function (self, item) { clicks.push(item.key); },
    });
    menu.openAt(100, 100);
    await wait(30);
    const rowOf = function (text) {
        return Array.from(document.querySelectorAll("[role=menuitem]")).find(function (el) { return el.textContent === text && el.offsetParent !== null; });
    };
    return { menu: menu, rowOf: rowOf };
};

test("ContextMenu: hovering an item with items opens its submenu at its side, a click there calls onClick and closes both", async function () {
    const clicks = [];
    const ui = await openSubmenuTestMenu(clicks);
    const rowCopy = ui.rowOf("Copy to");
    const hadSubmenu = !!ui.rowOf("Mine");
    rowCopy.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(30);
    const rowMine = ui.rowOf("Mine");
    const isAtTheSide = !!rowMine && rowMine.getBoundingClientRect().left >= rowCopy.getBoundingClientRect().right - 10;
    if (rowMine) rowMine.click();
    await wait(10);
    const isClosed = !ui.menu.isOpen() && !ui.rowOf("Mine");
    check("ContextMenu: hovering an item with items opens its submenu at its side, a click there calls onClick and closes both", !hadSubmenu && isAtTheSide && clicks.join() === "mine" && isClosed, "before: " + hadSubmenu + ", at the side: " + isAtTheSide + ", clicks: " + clicks.join() + ", closed: " + isClosed);
    ui.menu.remove();
});

test("ContextMenu: ArrowRight opens a submenu with its first item active, ArrowLeft closes only the submenu", async function () {
    const clicks = [];
    const ui = await openSubmenuTestMenu(clicks);
    key(document, "keydown", "ArrowDown");
    key(document, "keydown", "ArrowDown");
    key(document, "keydown", "ArrowRight");
    await wait(30);
    const isOpen = !!ui.rowOf("Mine");
    key(document, "keydown", "ArrowDown");
    key(document, "keydown", "ArrowLeft");
    await wait(10);
    const isSubmenuClosed = !ui.rowOf("Mine") && ui.menu.isOpen();
    key(document, "keydown", "Enter");
    await wait(30);
    key(document, "keydown", "ArrowDown");
    key(document, "keydown", "Enter");
    await wait(10);
    check("ContextMenu: ArrowRight opens a submenu with its first item active, ArrowLeft closes only the submenu", isOpen && isSubmenuClosed && clicks.join() === "other" && !ui.menu.isOpen(), "open: " + isOpen + ", only the submenu closed: " + isSubmenuClosed + ", clicks: " + clicks.join());
    ui.menu.remove();
});

test("ContextMenu: Escape closes only the menu (a listener of the page after it does not get it)", async function () {
    const ui = await openSubmenuTestMenu([]);
    let pageGotIt = 0;
    const onPageKey = function (event) { if (event.key === "Escape") pageGotIt = 1; };
    document.addEventListener("keydown", onPageKey);
    key(document.body, "keydown", "Escape");
    document.removeEventListener("keydown", onPageKey);
    check("ContextMenu: Escape closes only the menu (a listener of the page after it does not get it)", !ui.menu.isOpen() && !pageGotIt, "open: " + ui.menu.isOpen() + ", the page got it: " + pageGotIt);
    ui.menu.remove();
});

test("ContextMenu: an SVG icon takes the color of the text of its item", async function () {
    const ui = await openSubmenuTestMenu([]);
    const row = ui.rowOf("Copy to");
    const svg = row.querySelector(".context-menu-svg svg");
    const text = Array.from(row.children).find(function (el) { return el.textContent === "Copy to"; });
    const sameColor = function () { return getComputedStyle(svg).color === getComputedStyle(text).color; };
    const isSame = !!svg && sameColor();
    row.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(10);
    const isSameOnHover = !!svg && sameColor();
    const size = (svg) ? Math.round(svg.getBoundingClientRect().width) : 0;
    check("ContextMenu: an SVG icon takes the color of the text of its item", isSame && isSameOnHover && size === ContextMenuDefaults.style.icon.width, "svg: " + !!svg + ", same color: " + isSame + ", on hover: " + isSameOnHover + ", size: " + size);
    ui.menu.remove();
});

// *** SMART BUTTON (comp/smart-button.js)

test("SmartButton: a held Enter presses once", async function () {
    let count = 0;
    const button = SmartButton({ labelText: "Go", onClick: function () { count++; } });
    key(button.elem, "keydown", "Enter");
    key(button.elem, "keydown", "Enter", { repeat: true });
    key(button.elem, "keydown", "Enter", { repeat: true });
    check("SmartButton: a held Enter presses once", count === 1, "onClick: " + count);
    button.remove();
});

// 2026-11-11 (the user): a key of a calculator clicked with the mouse kept the focus, and Enter ("=") pressed it again
test("SmartButton: a click of the mouse does not take the focus, enabled or not", async function () {
    const buttons = [SmartButton({ labelText: "Go" }), SmartButton({ labelText: "Off", enabled: 0 })];
    buttons.forEach(function (button) {
        const press = new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0 });
        button.elem.dispatchEvent(press);
        check("SmartButton: the mousedown of " + button.labelText + " is stopped (the browser gives it no focus)", press.defaultPrevented === true, press.defaultPrevented);
        button.remove();
    });
});

// 2026-11-05 (the user): the Save button of a dialog turned from blue to gray when the dialog opened
test("SmartButton: a state set while it is made is drawn at once (no move from its first look); a later change moves", async function () {
    const button = SmartButton({ labelText: "Save", tone: "cyan" });
    const enabledColor = getComputedStyle(button.elem).backgroundColor; // (a read: as a Dialog that measures its content)
    button.setEnabled(0);
    const disabledColor = getComputedStyle(button.elem).backgroundColor;
    await wait(100); // (after the first view: the transitions are on)
    button.setEnabled(1);
    const startOfMove = getComputedStyle(button.elem).backgroundColor;
    check("SmartButton: a state set while it is made is drawn at once (no move from its first look); a later change moves",
        disabledColor !== enabledColor && startOfMove === disabledColor,
        "enabled: " + enabledColor + ", disabled at once: " + disabledColor + ", a later change starts at: " + startOfMove);
    button.remove();
});

// 2026-11-04 (the user): a tone is three colors (the button, under the mouse, the text) on any template
test("SmartButton: a tone colors any template, and style wins over it", async function () {
    const templateBefore = JSON.stringify(SmartButton.styles.ozden2);
    const cyan = SmartButton.tones.cyan;
    const outlined = SmartButton({ styleName: "outlined", tone: "cyan", labelText: "Go" });
    check("SmartButton: outlined takes the colors of the tone", outlined.style.box.color === cyan.color && outlined.style.hover.color === cyan.hover && outlined.style.label.textColor === cyan.text, outlined.style.box.color);
    const own = SmartButton({ styleName: "pill", tone: "blue", style: { box: { color: "tomato" } }, labelText: "Go" });
    check("SmartButton: style wins over tone", own.style.box.color === "tomato" && own.style.hover.color === SmartButton.tones.blue.hover, own.style.box.color + " / " + own.style.hover.color);
    const shared = SmartButton({ tone: "green", style: SmartButton.styles.ozden2, labelText: "Go" });
    check("SmartButton: a template given as style is not changed", JSON.stringify(SmartButton.styles.ozden2) === templateBefore);
    const dark = SmartButton({ styleName: "ozdenDark", tone: "cyanDark", labelText: "Go" });
    check("SmartButton: the light text of a dark tone turns the icon white", dark.style.label.textColor === SmartButton.LIGHT_TEXT && dark.style.icon.filter === SmartButton.WHITE_ICON, dark.style.icon.filter);
    outlined.setTone("");
    const gray = SmartButton.getTemplateColors("outlined");
    check("SmartButton: setTone(\"\") gives the colors of the template back", outlined.style.box.color === gray.box.color && outlined.style.label.textColor === gray.label.textColor, outlined.style.box.color);
    [outlined, own, shared, dark].forEach(function (button) { button.remove(); });
});

// 2026-11-04: setStyle replaced a part's objects whole: { ask: { button: { color } } } lost the white text of the ask
test("SmartButton: setStyle keeps the other keys inside a part", async function () {
    const button = SmartButton({ labelText: "Delete", ask: "Sure?" });
    const askBefore = Object.assign({}, button.style.ask.button);
    button.setStyle({ ask: { button: { color: "tomato" } }, waiting: { dots: { color: "teal" } } });
    const ask = button.style.ask.button;
    check("SmartButton: setStyle changes the given key", ask.color === "tomato", ask.color);
    check("SmartButton: setStyle keeps the other keys of ask.button", ask.textColor === askBefore.textColor && ask.iconFilter === askBefore.iconFilter && ask.border === askBefore.border, JSON.stringify(ask));
    check("SmartButton: setStyle keeps the other keys of waiting.dots", button.style.waiting.dots.color === "teal" && button.style.waiting.dots.size === SmartButtonDefaults.style.waiting.dots.size, JSON.stringify(button.style.waiting.dots));
    check("SmartButton: setStyle does not change the defaults", SmartButtonDefaults.style.ask.button.color !== "tomato" && SmartButtonDefaults.style.waiting.dots.color !== "teal");
    button.press();
    const textColor = getComputedStyle(button.label.elem).color;
    check("SmartButton: it asks in the color of setStyle with its white text", getComputedStyle(button.elem).backgroundColor === "rgb(255, 99, 71)" && textColor === "rgb(255, 255, 255)", textColor);
    button.remove();
});

// 2026-11-04 (the user): 44 by default and on every template (pill and outlined were 52; classic 36: gone)
test("SmartButton: 44 high on every template, an icon button is a square", async function () {
    const ICON = "../comp/smart-button/alert-black.png";
    const plain = SmartButton({ labelText: "Go" });
    const pill = SmartButton({ styleName: "pill", tone: "blue", labelText: "Go", iconFile: ICON });
    const outlined = SmartButton({ styleName: "outlined", labelText: "Go", iconFile: ICON });
    const iconButton = SmartButton({ labelText: "", ariaLabel: "Alert", iconFile: ICON });
    const iconOnTop = SmartButton({ labelText: "Go", iconFile: ICON, iconPosition: "top" });
    await basic.nextFrame();
    check("SmartButton: the default is 44 high", plain.elem.offsetHeight === 44, plain.elem.offsetHeight);
    check("SmartButton: pill and outlined are 44 high too", pill.elem.offsetHeight === 44 && outlined.elem.offsetHeight === 44, pill.elem.offsetHeight + " / " + outlined.elem.offsetHeight);
    check("SmartButton: an icon button is a 44 x 44 square", iconButton.elem.offsetWidth === 44 && iconButton.elem.offsetHeight === 44, iconButton.elem.offsetWidth + " x " + iconButton.elem.offsetHeight);
    check("SmartButton: an icon on top is not cut at 44", iconOnTop.elem.offsetHeight > 44, iconOnTop.elem.offsetHeight);
    [plain, pill, outlined, iconButton, iconOnTop].forEach(function (button) { button.remove(); });
});

test("SmartButton minimal: 28 high, an icon button a 28 square, its edge darker under the mouse", async function () {
    const ICON = "../comp/smart-button/alert-black.png";
    const minimal = SmartButton({ styleName: "minimal", labelText: "Go" });
    const iconButton = SmartButton({ styleName: "minimal", labelText: "", ariaLabel: "Alert", iconFile: ICON });
    const plain = SmartButton({ labelText: "Go" });
    await basic.nextFrame();
    const edgeBefore = minimal.elem.style.borderColor;
    const plainEdgeBefore = plain.elem.style.borderColor;
    minimal.elem.dispatchEvent(new MouseEvent("mouseenter"));
    plain.elem.dispatchEvent(new MouseEvent("mouseenter"));
    await basic.nextFrame();
    const edgeOver = minimal.elem.style.borderColor;
    const plainEdgeOver = plain.elem.style.borderColor;
    check("SmartButton minimal: 28 high", minimal.elem.offsetHeight === 28, minimal.elem.offsetHeight);
    check("SmartButton minimal: an icon button is a 28 x 28 square", iconButton.elem.offsetWidth === 28 && iconButton.elem.offsetHeight === 28, iconButton.elem.offsetWidth + " x " + iconButton.elem.offsetHeight);
    check("SmartButton minimal: the edge is darker under the mouse, the default template keeps its edge", edgeOver !== edgeBefore && plainEdgeOver === plainEdgeBefore, edgeBefore + " -> " + edgeOver + " / default: " + plainEdgeBefore + " -> " + plainEdgeOver);
    [minimal, iconButton, plain].forEach(function (button) { button.remove(); });
});

test("CheckBox, RadioButton, Toggle minimal: a 14 px mark, a 28 x 16 toggle", async function () {
    const checkBox = CheckBox({ styleName: "minimalDark", labelText: "A", checked: 1 });
    const radio = RadioButton({ styleName: "minimal", group: "minimalTest", labelText: "B", checked: 1 });
    const toggle = Toggle({ styleName: "minimal", value: 1 });
    await basic.nextFrame();
    check("CheckBox minimalDark: a 14 px square", checkBox.mark.elem.offsetWidth === 14, checkBox.mark.elem.offsetWidth);
    check("RadioButton minimal: a 14 px circle", radio.mark.elem.offsetWidth === 14, radio.mark.elem.offsetWidth);
    check("Toggle minimal: 28 x 16", toggle.elem.offsetWidth === 28 && toggle.elem.offsetHeight === 16, toggle.elem.offsetWidth + " x " + toggle.elem.offsetHeight);
    [checkBox, radio, toggle].forEach(function (object) { object.remove(); });
});

test("TextField minimal: the title over a 28 px field, its edge darker under the mouse; the default field is as before", async function () {
    const minimal = TextField({ styleName: "minimal", titleText: "E-mail" });
    const plain = TextField({ styleName: "modern", titleText: "E-mail" });
    await basic.nextFrame();
    const fieldHeight = minimal.background.elem.offsetHeight;
    const isFieldUnderTitle = (minimal.background.elem.offsetTop >= minimal.title.elem.offsetHeight);
    const edgeBefore = minimal.background.elem.style.borderColor;
    minimal.elem.dispatchEvent(new MouseEvent("mouseenter"));
    await basic.nextFrame();
    const edgeOver = minimal.background.elem.style.borderColor;
    check("TextField minimal: the field is 28 high, under its title", fieldHeight === 28 && isFieldUnderTitle, fieldHeight + " / top " + minimal.background.elem.offsetTop);
    check("TextField minimal: the edge is darker under the mouse", edgeOver !== edgeBefore, edgeBefore + " -> " + edgeOver);
    check("TextField: the default field keeps its sizes (a 40 px text row, the title inside)", plain.input.elem.offsetHeight === 40 && plain.background.elem.offsetTop === 0, plain.input.elem.offsetHeight + " / " + plain.background.elem.offsetTop);
    [minimal, plain].forEach(function (field) { field.remove(); });
});

test("ItemList, SelectBox, SmartButton minimalDanger: 28 px rows and fields", async function () {
    const list = ItemList({ styleName: "minimal", width: 200, height: "auto", items: ["A", "B"] });
    const select = SelectBox({ styleName: "minimalDark", options: ["A", "B"] });
    const danger = SmartButton({ styleName: "minimalDanger", labelText: "Delete" });
    await basic.nextFrame();
    const row = list.elem.querySelector("[role=option]");
    check("ItemList minimal: a row is 28 high", !!row && row.offsetHeight === 28, row && row.offsetHeight);
    check("SelectBox minimalDark: the field is 28 high", select.elem.offsetHeight === 28, select.elem.offsetHeight);
    check("SmartButton minimalDanger: 28 high, the text in the danger color", danger.elem.offsetHeight === 28 && danger.style.label.textColor === "#C24A36", danger.elem.offsetHeight + " / " + danger.style.label.textColor);
    [list, select, danger].forEach(function (object) { object.remove(); });
});

test("TextField minimal: a warning colors the edge of the field; a package wins over the defaults of TextAreaField; ink colors the edge", async function () {
    const field = EmailField({ styleName: "minimal", titleText: "E-mail", value: "bugra@" });
    const plain = EmailField({ styleName: "modern", titleText: "E-mail", value: "bugra@" });
    const note = TextAreaField({ styleName: "minimal", titleText: "Note" });
    const send = SmartButton({ styleName: "minimal", tone: "ink", labelText: "Send" });
    await basic.nextFrame();
    const plainEdgeBefore = plain.background.elem.style.borderColor;
    field.checkInputValue();
    plain.checkInputValue();
    await basic.nextFrame();
    const fieldEdge = field.background.elem.style.borderColor;
    check("TextField minimal: an invalid value colors the edge (warningBorderColor)", field.status == 2 && fieldEdge === "rgb(194, 74, 54)", field.status + " / " + fieldEdge);
    check("TextField: without warningBorderColor the edge stays", plain.status == 2 && plain.background.elem.style.borderColor === plainEdgeBefore, plainEdgeBefore + " -> " + plain.background.elem.style.borderColor);
    check("TextAreaField minimal: the count takes the unitStyle of the package (not the dark pill of TextAreaField)", note.unit && note.unit.elem.style.backgroundColor === "transparent", note.unit && note.unit.elem.style.backgroundColor);
    check("SmartButton ink: the edge is the color of the button", send.style.box.borderColor === send.style.box.color && send.style.hover.borderColor === send.style.hover.color, send.style.box.borderColor + " / " + send.style.hover.borderColor);
    [field, plain, note, send].forEach(function (object) { object.remove(); });
});

test("Minimal: ContextMenu and TreeView rows get a line, Toast takes the shapes of its theme; the defaults are as before", async function () {
    const menu = ContextMenu({ styleName: "minimal", items: [{ text: "Minimal open", key: "open" }] });
    menu.openAt(100, 100);
    await wait(30);
    const menuRow = Array.from(document.querySelectorAll("[role=menuitem]")).find(function (el) { return el.textContent === "Minimal open"; });
    const edgeBefore = menuRow.style.borderColor;
    menuRow.dispatchEvent(new MouseEvent("mouseenter"));
    menuRow.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    await wait(30);
    check("ContextMenu minimal: the item under the mouse gets a line", menuRow.style.borderWidth === "1px" && menuRow.style.borderColor !== edgeBefore, edgeBefore + " -> " + menuRow.style.borderColor);
    menu.close();
    const tree = TreeView({ styleName: "minimal", width: 200, height: "auto", items: ["Alpha", "Beta"], value: "Alpha" });
    const plainTree = TreeView({ width: 200, height: "auto", items: ["Gamma"], value: "Gamma" });
    await basic.nextFrame();
    const treeRow = tree.elem.querySelector("[role=treeitem]");
    const plainRow = plainTree.elem.querySelector("[role=treeitem]");
    check("TreeView minimal: the selected row has an ink line", treeRow.style.borderColor === "rgb(31, 31, 31)", treeRow.style.borderColor);
    check("TreeView: the default rows have no edge", !plainRow.style.borderWidth || plainRow.style.borderWidth === "0px", plainRow.style.borderWidth);
    const minimalToast = Toast.show({ theme: "minimal", messageText: "Minimal", duration: 0 });
    const plainToast = Toast.show({ theme: "light", messageText: "Plain", duration: 0 });
    await basic.nextFrame();
    check("Toast minimal: the shapes of its theme (round 4, no shadow)", minimalToast.card.elem.style.borderRadius === "4px" && minimalToast.card.elem.style.boxShadow === "none", minimalToast.card.elem.style.borderRadius + " / " + minimalToast.card.elem.style.boxShadow);
    check("Toast: the default shapes stay (round 10)", plainToast.card.elem.style.borderRadius === "10px", plainToast.card.elem.style.borderRadius);
    check("Tooltip: the looks of the minimal theme have no arrow and no shadow", Tooltip.looks.minimal.arrow === 0 && !Tooltip.looks.minimalDark.shadow, JSON.stringify(Tooltip.looks.minimal));
    minimalToast.close();
    plainToast.close();
    [tree, plainTree].forEach(function (object) { object.remove(); });
});

test("SmartButton minimal waits with a ring, the other templates with a clock", async function () {
    const minimal = SmartButton({ styleName: "minimal", labelText: "Wait", waiting: 1 });
    const plain = SmartButton({ labelText: "Wait", waiting: 1 });
    await basic.nextFrame();
    const minimalSvg = minimal.waitingCover.icon.elem.innerHTML;
    const plainSvg = plain.waitingCover.icon.elem.innerHTML;
    check("SmartButton minimal: the wait is a ring (an arc, no hands)", minimalSvg.indexOf("<path") >= 0 && minimalSvg.indexOf("<line") < 0, minimalSvg.slice(0, 80));
    check("SmartButton: the other templates keep the clock (its hands)", plainSvg.indexOf("<line") >= 0, plainSvg.slice(0, 80));
    [minimal, plain].forEach(function (button) { button.remove(); });
});

test("TreeView: the ring of the selected row shows for the keyboard, not after a click", async function () {
    const tree = TreeView({ styleName: "minimal", width: 200, height: "auto", items: ["Alpha", "Beta"], value: "Alpha" });
    await basic.nextFrame();
    const area = tree.listArea.elem;
    const ringOf = function () { return tree.elem.querySelector("[role=treeitem][aria-selected=true]").style.boxShadow; };
    area.focus();
    area.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    await basic.nextFrame();
    const afterClick = ringOf();
    area.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await basic.nextFrame();
    const afterKey = ringOf();
    check("TreeView: no ring after a click", !afterClick || afterClick === "none", afterClick);
    check("TreeView: the ring after a key", afterKey.indexOf("inset") >= 0, afterKey);
    tree.remove();
});

test("SliderField: a click on a disabled field does not take the focus", async function () {
    const field = SliderField({ labelText: "Off", value: 40, enabled: 0 });
    await basic.nextFrame();
    const press = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, pointerId: 1 });
    field.elem.dispatchEvent(press);
    check("SliderField: the press on a disabled field is stopped (the browser gives it no focus)", press.defaultPrevented === true, press.defaultPrevented);
    field.remove();
});

test("Minimal: the pickers, FilePicker, Accordion, SliderField, StepBar, TagInput, Splitter, SidePanel and LoadingScreen have both packages; the fields are 28 high", async function () {
    const components = { DatePicker, TimePicker, ColorPicker, FilePicker, Accordion, SliderField, StepBar, TagInput, Splitter, SidePanel, LoadingScreen };
    const missing = Object.keys(components).filter(function (name) {
        const styles = components[name].styles;
        return !(styles.minimal && styles.minimalDark);
    });
    check("Minimal: minimal and minimalDark in every one of them", missing.length === 0, missing.join(", "));
    const fields = [
        DatePicker({ styleName: "minimal" }),
        TimePicker({ styleName: "minimalDark" }),
        ColorPicker({ styleName: "minimal" }),
        SliderField({ styleName: "minimalDark", labelText: "Size", value: 4 }),
    ];
    await basic.nextFrame();
    const heights = fields.map(function (field) { return field.elem.offsetHeight; });
    check("Minimal: DatePicker, TimePicker, ColorPicker, SliderField are 28 high", heights.every(function (height) { return height === 28; }), heights.join(", "));
    fields.forEach(function (field) { field.remove(); });
});

test("StatusBar minimalDark: the texts of a tone read on the dark window; minimal keeps its dark texts", async function () {
    const dark = StatusBar({ styleName: "minimalDark", messageText: "Not saved", messageTone: "error" });
    const light = StatusBar({ styleName: "minimal", messageText: "Not saved", messageTone: "error" });
    await basic.nextFrame();
    const brightnessOf = function (bar) {
        const channels = getComputedStyle(bar.lblMessage.elem).color.match(/\d+/g).map(Number);
        return channels[0] + channels[1] + channels[2];
    };
    const LIGHT_TEXT = 450; // the sum of the three channels of a light color
    check("StatusBar minimalDark: an error is a light text", brightnessOf(dark) > LIGHT_TEXT, brightnessOf(dark));
    check("StatusBar minimal: an error is a dark text", brightnessOf(light) < LIGHT_TEXT, brightnessOf(light));
    [dark, light].forEach(function (bar) { bar.remove(); });
});

test("TextField minimal with no title: the field starts at the top and the box is as high as the field (the field of Dialog.prompt)", async function () {
    const untitled = TextField({ styleName: "minimal", titleText: "", value: "report.pdf" });
    const titled = TextField({ styleName: "minimal", titleText: "Name" });
    await basic.nextFrame();
    const untitledTop = untitled.background.elem.offsetTop;
    check("TextField minimal, no title: the field at the top, the box 28 high", untitledTop === 0 && untitled.elem.offsetHeight === 28, untitledTop + " / " + untitled.elem.offsetHeight);
    check("TextField minimal with a title: the field under the title", titled.background.elem.offsetTop > 0, titled.background.elem.offsetTop);
    [untitled, titled].forEach(function (field) { field.remove(); });
});

test("TimePicker minimal: the columns have room for their scroll bar (it does not cross the chosen hour); the light package as before", async function () {
    const minimal = TimePicker({ styleName: "minimal", inline: 1, time: "14:30" });
    const plain = TimePicker({ inline: 1, time: "14:30" });
    await basic.nextFrame();
    const roomOf = function (picker) { return picker.hoursColumn.scrollArea.elem.offsetWidth - picker.style.cell.width; };
    check("TimePicker minimal: 14 px of room in a column", roomOf(minimal) === 14, roomOf(minimal));
    check("TimePicker light: a column as wide as its cells", roomOf(plain) === 0, roomOf(plain));
    [minimal, plain].forEach(function (picker) { picker.remove(); });
});

test("GraphBox minimal: the theme gives its shapes, a style of the page wins over them, light keeps its shapes", async function () {
    const minimal = GraphBox({ theme: "minimal", labels: ["a", "b"], values: [1, 2] });
    const ownRound = GraphBox({ theme: "minimalDark", labels: ["a", "b"], values: [1, 2], style: { box: { round: 9 } } });
    const plain = GraphBox({ labels: ["a", "b"], values: [1, 2] });
    await basic.nextFrame();
    check("GraphBox minimal: round 4, a 13 px title", minimal.style.box.round === 4 && minimal.style.title.fontSize === 13, minimal.style.box.round + " / " + minimal.style.title.fontSize);
    check("GraphBox minimalDark: the round of the page wins", ownRound.style.box.round === 9, ownRound.style.box.round);
    check("GraphBox light: round 12 as before", plain.style.box.round === 12, plain.style.box.round);
    check("GraphBox: a chart does not fill the shapes of the theme with the defaults", !("border" in GraphBox.MINIMAL_SHAPES.box), Object.keys(GraphBox.MINIMAL_SHAPES.box).join(", "));
    [minimal, ownRound, plain].forEach(function (chart) { chart.remove(); });
});

test("TagInput minimal: the typed part of a suggestion is bold with no fill", async function () {
    const tags = TagInput({ styleName: "minimal", suggestions: ["fitness", "film"] });
    await basic.nextFrame();
    tags.input.inputElement.value = "fi";
    tags.input.inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    await basic.nextFrame();
    const mark = tags.panel.elem.querySelector("mark");
    const style = (mark) ? mark.style : null;
    check("TagInput minimal: the typed part is bold, with no fill", !!style && style.fontFamily.indexOf("opensans-bold") >= 0 && style.backgroundColor === "transparent", (mark) ? mark.getAttribute("style") : "no mark");
    tags.remove();
});

test("StepBar: the ring of a step under the mouse is 6 px, 4 px in minimal (circle.hoverRing)", async function () {
    const ringOf = async function (styleName) {
        const bar = StepBar({ styleName: styleName, steps: ["A", "B", "C"], currentStep: 2 });
        await basic.nextFrame();
        const column = bar.elem.querySelector("[role=button]");
        column.dispatchEvent(new MouseEvent("mouseenter"));
        const ringed = [...column.querySelectorAll("*")].find(function (el) { return el.style.boxShadow && el.style.boxShadow !== "none"; });
        const ring = (ringed) ? ringed.style.boxShadow : "";
        bar.remove();
        return ring;
    };
    const lightRing = await ringOf("light");
    const minimalRing = await ringOf("minimal");
    check("StepBar light: a 6 px ring", lightRing.indexOf("6px") >= 0, lightRing);
    check("StepBar minimal: a 4 px ring", minimalRing.indexOf("4px") >= 0, minimalRing);
});

test("DatePicker, TimePicker minimal: a 14 px line icon (an SVG); the light package keeps its drawn icon", async function () {
    const date = DatePicker({ styleName: "minimal" });
    const time = TimePicker({ styleName: "minimalDark" });
    const plain = DatePicker({});
    await basic.nextFrame();
    const isLineIcon = function (picker) { return !!picker.icon.elem.querySelector("svg") && picker.icon.elem.offsetWidth === 14; };
    check("DatePicker minimal: a 14 px SVG calendar", isLineIcon(date), date.icon.elem.offsetWidth);
    check("TimePicker minimalDark: a 14 px SVG clock", isLineIcon(time), time.icon.elem.offsetWidth);
    check("DatePicker light: the drawn calendar of 18 px", !plain.icon.elem.querySelector("svg") && plain.icon.elem.offsetWidth === 18, plain.icon.elem.offsetWidth);
    [date, time, plain].forEach(function (picker) { picker.remove(); });
});

test("SearchInput minimal: the text in the middle of the field (it sat 1 px high)", async function () {
    const search = SearchInput({ styleName: "minimal", width: 200 });
    await basic.nextFrame();
    const field = search.elem.getBoundingClientRect();
    const text = search.txtSearch.elem.getBoundingClientRect();
    const offset = (text.top + text.height / 2) - (field.top + field.height / 2);
    check("SearchInput minimal: the middle of the text is the middle of the field", Math.abs(offset) <= 0.5, offset);
    search.remove();
});

test("JsonEditor minimal: the chosen part of Table | JSON stays inside the line of the group; light fills its group", async function () {
    const chosenInset = async function (styleName) {
        const editor = JsonEditor({ styleName: styleName, width: 600, height: 200, value: [{ name: "A" }] });
        await basic.nextFrame();
        const group = editor.elem.querySelector("[role=radiogroup]").getBoundingClientRect();
        const chosen = editor.elem.querySelector("[role=radio][aria-checked=true]").getBoundingClientRect();
        editor.remove();
        return chosen.top - group.top;
    };
    const minimalInset = await chosenInset("minimal");
    const lightInset = await chosenInset("light");
    check("JsonEditor minimal: 3 px from the top of the group (its line and 2 px of room)", minimalInset === 3, minimalInset);
    check("JsonEditor light: the chosen part fills the group as before", lightInset === 0, lightInset);
});

test("StepBar minimal: the ring of the keyboard is around the circle of a step; light keeps the ring around the step", async function () {
    const minimal = StepBar({ styleName: "minimal", steps: ["A", "B", "C"], currentStep: 2 });
    const plain = StepBar({ steps: ["A", "B", "C"], currentStep: 2 });
    await basic.nextFrame();
    const minimalStep = minimal.elem.querySelector("[role=button]");
    const plainStep = plain.elem.querySelector("[role=button]");
    check("StepBar minimal: a ring around the circle, not around the step", minimalStep.classList.contains("step-bar-circle-ring") && !minimalStep.classList.contains("basic-focus-ring"), minimalStep.className);
    check("StepBar light: the ring of basic.js around the step", plainStep.classList.contains("basic-focus-ring") && !plainStep.classList.contains("step-bar-circle-ring"), plainStep.className);
    [minimal, plain].forEach(function (bar) { bar.remove(); });
});

test("Splitter minimal: the keyboard turns the line to the focus color (no ring); light keeps its ring", async function () {
    const minimal = Splitter({ styleName: "minimal", width: 300, height: 100 });
    const plain = Splitter({ width: 300, height: 100 });
    await basic.nextFrame();
    minimal.grip.elem.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", bubbles: true }));
    await basic.nextFrame();
    const lineColor = getComputedStyle(minimal.line.elem).backgroundColor;
    check("Splitter minimal: a key paints the line in the focus color", lineColor === "rgb(61, 139, 217)", lineColor);
    check("Splitter minimal: no ring of basic.js on its line", !minimal.grip.elem.classList.contains("basic-focus-ring"), minimal.grip.elem.className);
    check("Splitter light: the ring of basic.js as before", plain.grip.elem.classList.contains("basic-focus-ring"), plain.grip.elem.className);
    [minimal, plain].forEach(function (split) { split.remove(); });
});

test("MinimalAccent: the minimal packages in a color of the page; minimal stays as it is", async function () {
    const BLUE = "#2A78D6";
    const look = MinimalAccent.addPackages("minimalTestBlue", BLUE);
    MinimalAccent.addPackages("minimalTestYellow", "#F5C400");
    check("MinimalAccent: it returns the names of the two packages", look.light === "minimalTestBlue" && look.dark === "minimalTestBlueDark", JSON.stringify(look));
    check("MinimalAccent: the ink of a toggle is the color; minimal keeps its ink", Toggle.styles.minimalTestBlue.buttonStyle.selectedColor === BLUE && Toggle.styles.minimal.buttonStyle.selectedColor === "#1F1F1F", Toggle.styles.minimalTestBlue.buttonStyle.selectedColor);
    const darkInk = Toggle.styles.minimalTestBlueDark.buttonStyle.selectedColor;
    const darkContrast = MinimalAccent.contrast(MinimalAccent.toRgb(darkInk), MinimalAccent.toRgb("#1A1A19"));
    check("MinimalAccent: the color of a dark window reads on the dark ground (4.5:1)", darkContrast >= 4.5 && darkInk !== BLUE, darkInk + " " + darkContrast.toFixed(2));
    const textOnBlue = DatePicker.styles.minimalTestBlue.style.selectedDay.textColor;
    const textOnYellow = DatePicker.styles.minimalTestYellow.style.selectedDay.textColor;
    check("MinimalAccent: the text on the color is white or dark, the one that reads", textOnBlue === "#FFFFFF" && textOnYellow === "#1A1A19", textOnBlue + " / " + textOnYellow);
    const dialogLook = Dialog.styles.minimalTestBlue;
    const darkDialogLook = Dialog.styles.minimalTestBlueDark;
    check("MinimalAccent: a Dialog takes the new fields and main button; a delete stays minimalDanger", dialogLook.fieldStyleName === "minimalTestBlue" && dialogLook.buttons.primary.tone === "minimalTestBlue" && dialogLook.buttons.danger.styleName === "minimalDanger" && darkDialogLook.buttons.primary.tone === "minimalTestBlueDark" && darkDialogLook.buttons.danger.styleName === "minimalDangerDark", JSON.stringify(dialogLook.buttons.primary));
    const toggle = Toggle({ styleName: "minimalTestBlue", value: 1 });
    const button = SmartButton({ styleName: "minimalTestBlue", tone: "minimalTestBlue", labelText: "Save" });
    const yellowButton = SmartButton({ styleName: "minimalTestYellow", tone: "minimalTestYellow", labelText: "Save" });
    await basic.nextFrame();
    const knob = getComputedStyle(toggle.button.elem).backgroundColor;
    const fill = getComputedStyle(button.elem).backgroundColor;
    check("MinimalAccent: an on toggle and the main button are in the color", knob === "rgb(42, 120, 214)" && fill === "rgb(42, 120, 214)", knob + " / " + fill);
    check("MinimalAccent: a light color gets a dark text on the button", SmartButton.tones.minimalTestBlue.text === SmartButton.LIGHT_TEXT && SmartButton.tones.minimalTestYellow.text === "#1A1A19", SmartButton.tones.minimalTestYellow.text);
    check("MinimalAccent: Toast and Tooltip have the looks too", Toast.THEMES.minimalTestBlue.actionText === BLUE && Tooltip.looks.minimalTestBlue === Tooltip.looks.minimal, Toast.THEMES.minimalTestBlue.actionText);
    [toggle, button, yellowButton].forEach(function (object) { object.remove(); });
});

// *** HOLD TO CONFIRM (comp/hold-to-confirm-button.js)

test("HoldToConfirmButton: a right click or a cancelled touch does not confirm", async function () {
    let confirms = 0;
    const button = HoldToConfirmButton({ holdDuration: 300, onConfirm: function () { confirms++; } });
    button.elem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 2 }));
    await wait(450);
    const afterRightClick = confirms;
    button.elem.dispatchEvent(new Event("touchstart", { bubbles: true }));
    await wait(50);
    button.elem.dispatchEvent(new Event("touchcancel", { bubbles: true }));
    await wait(450);
    check("HoldToConfirmButton: a right click or a cancelled touch does not confirm", afterRightClick === 0 && confirms === 0, "right click: " + afterRightClick + ", touch: " + (confirms - afterRightClick));
    button.remove();
});

// *** CONTEXT MENU for a program (comp/context-menu.js)

const openMenuRows = function (menu) {
    return Array.from(menu.elem.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]'));
};

test("ContextMenu: a shortcut stands at the end of its row, a check mark follows setItemChecked", async function () {
    const menu = ContextMenu({ items: [
        { text: "Save", key: "save", shortcut: "Ctrl+S" },
        { text: "Wrap", key: "wrap", checked: 1 },
        { text: "Open", key: "open" },
    ] });
    menu.openAt(40, 40);
    await wait(30);
    const shortcut = findByText("Ctrl+S", menu.elem);
    const name = findByText("Save", menu.elem);
    const rows = openMenuRows(menu);
    const isAtEnd = !!shortcut && shortcut.getBoundingClientRect().left > name.getBoundingClientRect().right;
    const wrapRow = rows[1];
    const isCheckedAtFirst = wrapRow.getAttribute("aria-checked") === "true" && !!wrapRow.querySelector("svg");
    menu.setItemChecked("wrap", 0);
    const isOffNow = wrapRow.getAttribute("aria-checked") === "false" && !wrapRow.querySelector("svg");
    const textLeft = function (text) { return findByText(text, menu.elem).getBoundingClientRect().left; };
    const isSameStart = textLeft("Wrap") === textLeft("Open");
    menu.setItemChecked("open", 1); // not a check item: nothing changes
    const isPlainStill = !rows[2].querySelector("svg");
    check("ContextMenu: a shortcut stands at the end of its row, a check mark follows setItemChecked",
        isAtEnd && isCheckedAtFirst && isOffNow && isSameStart && isPlainStill, [isAtEnd, isCheckedAtFirst, isOffNow, isSameStart, isPlainStill].join(" "));
    menu.remove();
});

test("ContextMenu: openBelow puts the menu under the object, and over it when there is no room", async function () {
    const opener = Box({ left: 40, top: 40, width: 100, height: 30 });
    const menu = ContextMenu({ items: ["One", "Two"] });
    menu.openBelow(opener);
    const isUnder = menu.elem.offsetTop === 70 && menu.elem.offsetLeft === 40 && menu.source === opener;
    menu.close();
    opener.top = page.height - 40;
    menu.openBelow(opener);
    const rect = menu.elem.getBoundingClientRect();
    const isOver = rect.bottom <= opener.elem.getBoundingClientRect().top + 1;
    check("ContextMenu: openBelow puts the menu under the object, and over it when there is no room", isUnder && isOver, isUnder + " " + isOver);
    menu.remove();
    opener.remove();
});

test("ContextMenu: the side keys go to onSideKey only when no submenu takes them", async function () {
    const sides = [];
    const menu = ContextMenu({
        items: [{ text: "Plain", key: "plain" }, { text: "More", items: [{ text: "Inner", key: "inner" }] }],
        onSideKey: function (self, direction) { sides.push(direction); },
    });
    menu.openAt(40, 40);
    await wait(30);
    key(document.body, "keydown", "ArrowDown"); // Plain
    key(document.body, "keydown", "ArrowRight");
    key(document.body, "keydown", "ArrowLeft");
    const fromPlain = sides.join(",");
    key(document.body, "keydown", "ArrowDown"); // More
    key(document.body, "keydown", "ArrowRight"); // opens the submenu
    const countAfterOpen = sides.length;
    key(document.body, "keydown", "ArrowRight"); // Inner has no submenu: to the first menu
    const fromInner = sides[sides.length - 1];
    key(document.body, "keydown", "ArrowLeft"); // closes only the submenu
    const countAfterClose = sides.length;
    check("ContextMenu: the side keys go to onSideKey only when no submenu takes them",
        fromPlain === "1,-1" && countAfterOpen === 2 && fromInner === 1 && countAfterClose === 3 && menu.isOpen() == 1,
        [fromPlain, countAfterOpen, fromInner, countAfterClose, menu.isOpen()].join(" "));
    menu.remove();
});

// *** MENU BAR (comp/menu-bar.js)

const mouseClick = function (element) {
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0, pointerId: 1 }));
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
};

const makeTestMenus = function () {
    return [
        { text: "File", key: "file", items: [
            { text: "Save", key: "save", shortcut: "Ctrl+S" },
            { text: "Quit", key: "quit", shortcut: "Ctrl+Q", enabled: 0 },
            { text: "Recent", key: "recent", items: [{ text: "a.txt", key: "a", shortcut: "Ctrl+Shift+A" }, { text: "b.txt", key: "b" }] },
        ] },
        { text: "Off", key: "off", enabled: 0, items: ["Nothing"] },
        { text: "Edit", key: "edit", items: [{ text: "Copy", key: "copy", shortcut: "Ctrl+C" }, { text: "Reload", key: "reload", shortcut: "F5" }] },
        { text: "View", key: "view", items: [{ text: "Wrap", key: "wrap", checked: 1 }, { text: "Deep", items: [{ text: "Inner", key: "inner", checked: 0 }] }] },
    ];
};

test("MenuBar: a click opens a menu under its title, a second click closes it, a third opens it again", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const entry = bar.menuList[0];
    mouseClick(entry.title.elem);
    const opened = entry.contextMenu.isOpen() == 1;
    const isUnder = entry.contextMenu.elem.getBoundingClientRect().top >= entry.title.elem.getBoundingClientRect().bottom - 1;
    const isExpanded = entry.title.elem.getAttribute("aria-expanded") === "true";
    mouseClick(entry.title.elem);
    const closed = entry.contextMenu.isOpen() == 0;
    mouseClick(entry.title.elem);
    const openedAgain = entry.contextMenu.isOpen() == 1;
    check("MenuBar: a click opens a menu under its title, a second click closes it, a third opens it again",
        opened && isUnder && isExpanded && closed && openedAgain, [opened, isUnder, isExpanded, closed, openedAgain].join(" "));
    bar.remove();
});

test("MenuBar: the mouse on another title opens that one only while a menu is open", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const file = bar.menuList[0];
    const edit = bar.menuList[2];
    edit.title.elem.dispatchEvent(new MouseEvent("mouseenter"));
    const staysClosed = edit.contextMenu.isOpen() == 0;
    mouseClick(file.title.elem);
    edit.title.elem.dispatchEvent(new MouseEvent("mouseenter"));
    const switched = edit.contextMenu.isOpen() == 1 && file.contextMenu.isOpen() == 0;
    bar.menuList[1].title.elem.dispatchEvent(new MouseEvent("mouseenter")); // disabled
    const stillEdit = edit.contextMenu.isOpen() == 1 && bar.menuList[1].contextMenu.isOpen() == 0;
    check("MenuBar: the mouse on another title opens that one only while a menu is open", staysClosed && switched && stillEdit, [staysClosed, switched, stillEdit].join(" "));
    bar.remove();
});

test("MenuBar: the arrow keys go between the menus (a disabled one is passed), Escape gives the focus back", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const file = bar.menuList[0];
    const edit = bar.menuList[2];
    const view = bar.menuList[3];
    file.title.elem.focus();
    key(file.title.elem, "keydown", "ArrowDown");
    const opened = file.contextMenu.isOpen() == 1 && file.contextMenu.hasActive() == 1;
    key(document.body, "keydown", "ArrowRight");
    const passedDisabled = edit.contextMenu.isOpen() == 1 && file.contextMenu.isOpen() == 0 && edit.contextMenu.hasActive() == 1;
    key(document.body, "keydown", "ArrowRight");
    const onView = view.contextMenu.isOpen() == 1;
    key(document.body, "keydown", "ArrowRight");
    const wrapped = file.contextMenu.isOpen() == 1;
    key(document.body, "keydown", "Escape");
    const closed = file.contextMenu.isOpen() == 0;
    const hasFocus = document.activeElement === file.title.elem;
    key(file.title.elem, "keydown", "ArrowRight");
    const movedFocus = document.activeElement === edit.title.elem && edit.title.elem.tabIndex === 0 && file.title.elem.tabIndex === -1;
    check("MenuBar: the arrow keys go between the menus (a disabled one is passed), Escape gives the focus back",
        opened && passedDisabled && onView && wrapped && closed && hasFocus && movedFocus,
        [opened, passedDisabled, onView, wrapped, closed, hasFocus, movedFocus].join(" "));
    bar.remove();
});

test("MenuBar: the mouse leaves the focus alone when a menu closes (the ring of the keyboard does not show)", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const file = bar.menuList[0];
    const other = Input({ left: 10, top: 60, width: 100, height: 30 });
    other.inputElement.focus();
    mouseClick(file.title.elem);
    file.contextMenu.elem.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1 }));
    file.contextMenu.clickItem(0);
    const staysOff = document.activeElement !== file.title.elem;
    mouseClick(file.title.elem);
    key(document.body, "keydown", "Escape");
    const backWithKey = document.activeElement === file.title.elem;
    check("MenuBar: the mouse leaves the focus alone when a menu closes (the ring of the keyboard does not show)", staysOff && backWithKey, staysOff + " " + backWithKey);
    other.remove();
    bar.remove();
});

test("MenuBar: Enter on a title opens it (also after a mouse click on an item of it)", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const file = bar.menuList[0];
    mouseClick(file.title.elem);
    // The press on an item is inside the menu: the menu stays open until its click.
    file.contextMenu.elem.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1 }));
    file.contextMenu.clickItem(0);
    const closed = file.contextMenu.isOpen() == 0;
    file.title.elem.click(); // WHY: Enter and Space make a click with detail 0.
    const opened = file.contextMenu.isOpen() == 1 && file.contextMenu.hasActive() == 1;
    check("MenuBar: Enter on a title opens it (also after a mouse click on an item of it)", closed && opened, closed + " " + opened);
    bar.remove();
});

test("MenuBar: an item gives onClick its item and its menu; a disabled one does not run; the list of the page does not change", async function () {
    const clicks = [];
    let itemClicks = 0;
    const menus = makeTestMenus();
    menus[0].items[0].onClick = function (self, item, menu) { itemClicks += (self === bar && item.key === "save" && menu.key === "file") ? 1 : 0; };
    const bar = MenuBar({ menus: menus, onClick: function (self, item, menu) { clicks.push(menu.key + ">" + item.key); } });
    await wait(30);
    const file = bar.menuList[0];
    file.title.elem.click();
    file.contextMenu.clickItem(0); // Save
    file.title.elem.click();
    file.contextMenu.clickItem(1); // Quit: disabled
    const isOpenAfterDisabled = file.contextMenu.isOpen() == 1;
    file.contextMenu.clickItem(2); // Recent: opens its submenu
    await wait(10);
    const innerRow = findByText("a.txt");
    innerRow.parentElement.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    bar.setItemEnabled("quit", 1);
    bar.setItemChecked("wrap", 0);
    const isListSame = menus[0].items[1].enabled === 0 && menus[3].items[0].checked === 1;
    check("MenuBar: an item gives onClick its item and its menu; a disabled one does not run; the list of the page does not change",
        clicks.join(" ") === "file>save file>a" && itemClicks === 1 && isOpenAfterDisabled && file.contextMenu.isOpen() == 0 && isListSame,
        [clicks.join(" "), itemClicks, isOpenAfterDisabled, file.contextMenu.isOpen(), isListSame].join(" | "));
    bar.remove();
});

test("MenuBar: a shortcut runs its item (Ctrl and Cmd, a submenu too), not when it is disabled", async function () {
    const clicks = [];
    const bar = MenuBar({ menus: makeTestMenus(), onClick: function (self, item) { clicks.push(item.key); } });
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    key(document.body, "keydown", "s", { metaKey: true });
    key(document.body, "keydown", "S", { ctrlKey: true, shiftKey: true }); // not Save: it has no shift
    key(document.body, "keydown", "A", { ctrlKey: true, shiftKey: true }); // in a submenu
    key(document.body, "keydown", "q", { ctrlKey: true }); // disabled
    key(document.body, "keydown", "F5");
    key(document.body, "keydown", "s"); // no Ctrl
    check("MenuBar: a shortcut runs its item (Ctrl and Cmd, a submenu too), not when it is disabled",
        clicks.join(" ") === "save save a reload", clicks.join(" "));
    bar.remove();
});

test("MenuBar: in a text field Ctrl+C stays with the field and a key without Ctrl too, Ctrl+S runs; a selected text is copied by the browser; nothing runs under a Dialog", async function () {
    const clicks = [];
    const bar = MenuBar({ menus: makeTestMenus(), onClick: function (self, item) { clicks.push(item.key); } });
    const field = Input({ left: 10, top: 60, width: 100, height: 30 });
    await wait(30);
    field.elem.focus();
    key(field.inputElement, "keydown", "c", { ctrlKey: true });
    key(field.inputElement, "keydown", "F5");
    key(field.inputElement, "keydown", "s", { ctrlKey: true });
    const inField = clicks.join(" ");
    clicks.length = 0;
    field.elem.blur();
    key(document.body, "keydown", "c", { ctrlKey: true });
    const copyRuns = clicks.join(" ");
    clicks.length = 0;
    const selected = Label({ left: 10, top: 100, text: "A text", selectable: 1 });
    window.getSelection().selectAllChildren(selected.elem);
    const copyEvent = new KeyboardEvent("keydown", { key: "c", ctrlKey: true, bubbles: true, cancelable: true });
    document.body.dispatchEvent(copyEvent);
    const leftToBrowser = clicks.length === 0 && !copyEvent.defaultPrevented;
    window.getSelection().removeAllRanges();
    selected.remove();
    const dialog = Dialog({ removeOnClose: 1, buttons: [] });
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    const underDialog = clicks.length;
    dialog.remove();
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    const afterDialog = clicks.join(" ");
    check("MenuBar: in a text field Ctrl+C stays with the field and a key without Ctrl too, Ctrl+S runs; a selected text is copied by the browser; nothing runs under a Dialog",
        inField === "save" && copyRuns === "copy" && leftToBrowser && underDialog === 0 && afterDialog === "save",
        [inField, copyRuns, leftToBrowser, underDialog, afterDialog].join(" | "));
    field.remove();
    bar.remove();
});

test("MenuBar: setItemChecked and setItemEnabled reach the items of a menu and of a submenu", async function () {
    const clicks = [];
    const bar = MenuBar({ menus: makeTestMenus(), onClick: function (self, item) { clicks.push(item.key); } });
    await wait(30);
    const view = bar.menuList[3];
    const file = bar.menuList[0];
    bar.setItemChecked("wrap", 0);
    view.title.elem.click();
    const wrapRow = openMenuRows(view.contextMenu)[0];
    const isOff = wrapRow.getAttribute("aria-checked") === "false";
    view.contextMenu.close();
    bar.setItemChecked("inner", 1);
    view.title.elem.click();
    view.contextMenu.clickItem(1); // Deep: its submenu
    await wait(10);
    const isInnerOn = !!findByText("Inner") && findByText("Inner").parentElement.getAttribute("aria-checked") === "true";
    view.contextMenu.close();
    bar.setItemEnabled("quit", 1);
    key(document.body, "keydown", "q", { ctrlKey: true });
    const ranWhenEnabled = clicks.join(" ");
    bar.setItemEnabled("save", 0);
    file.title.elem.click();
    const isSaveOff = openMenuRows(file.contextMenu)[0].getAttribute("aria-disabled") === "true";
    file.contextMenu.close();
    key(document.body, "keydown", "s", { ctrlKey: true });
    check("MenuBar: setItemChecked and setItemEnabled reach the items of a menu and of a submenu",
        isOff && isInnerOn && ranWhenEnabled === "quit" && isSaveOff && clicks.length === 1,
        [isOff, isInnerOn, ranWhenEnabled, isSaveOff, clicks.length].join(" "));
    bar.remove();
});

test("MenuBar: an item can remove the bar in its onClick (a click and a shortcut); a held key runs a shortcut once", async function () {
    let bar = null;
    let runs = 0;
    let removals = 0;
    const uncaughtBefore = uncaught.length;
    const makeBar = function () {
        bar = MenuBar({
            menus: [{ text: "View", items: [{ text: "Dark", key: "dark", shortcut: "Ctrl+D", onClick: function () { removals++; bar.remove(); } }] }],
            onClick: function () { runs++; },
        });
    };
    makeBar();
    await wait(10);
    bar.menuList[0].title.elem.click();
    let errorText = "";
    try { bar.menuList[0].contextMenu.clickItem(0); } catch (error) { errorText = error.message; }
    const afterClick = removals === 1 && bar.isRemoved && !document.body.contains(bar.elem);
    makeBar();
    await wait(10);
    key(document.body, "keydown", "d", { ctrlKey: true });
    const afterShortcut = removals === 2 && bar.isRemoved;
    await wait(10);
    bar = MenuBar({ menus: [{ text: "Tools", items: [{ text: "Job", key: "job", shortcut: "F5" }] }], onClick: function () { runs++; } });
    await wait(10);
    const held = new KeyboardEvent("keydown", { key: "F5", repeat: true, bubbles: true, cancelable: true });
    document.body.dispatchEvent(held);
    const isHeldStopped = runs === 0 && held.defaultPrevented;
    key(document.body, "keydown", "F5");
    const isRunOnce = runs === 1;
    check("MenuBar: an item can remove the bar in its onClick (a click and a shortcut); a held key runs a shortcut once",
        !errorText && afterClick && afterShortcut && isHeldStopped && isRunOnce && uncaught.length === uncaughtBefore,
        [errorText, afterClick, afterShortcut, isHeldStopped, isRunOnce, runs].join(" | "));
    bar.remove();
});

test("MenuBar: remove() with an open menu takes its menus from the page; setMenus() makes new ones", async function () {
    const bar = MenuBar({ menus: makeTestMenus() });
    await wait(30);
    const oldMenu = bar.menuList[0].contextMenu;
    bar.setMenus([{ text: "One", items: ["A"] }]);
    const oldIsGone = !document.body.contains(oldMenu.elem);
    const newCount = bar.menuList.length;
    const titleText = bar.menuList[0].title.elem.textContent;
    const newMenu = bar.menuList[0].contextMenu;
    bar.menuList[0].title.elem.click();
    bar.remove();
    const isGone = !document.body.contains(newMenu.elem) && !document.body.contains(bar.elem);
    let isSafeTwice = true;
    try { bar.remove(); } catch (error) { isSafeTwice = false; }
    check("MenuBar: remove() with an open menu takes its menus from the page; setMenus() makes new ones",
        oldIsGone && newCount === 1 && titleText === "One" && isGone && isSafeTwice, [oldIsGone, newCount, titleText, isGone, isSafeTwice].join(" "));
});

test("MenuBar: the text of a shortcut, and how it is read", async function () {
    const shown = MenuBar.shortcutText("Ctrl+Shift+S");
    const isShownRight = (MenuBar.isMac()) ? (shown === "⇧⌘S") : (shown === "Ctrl+Shift+S");
    const parsed = MenuBar.parseShortcut("Ctrl+Shift+S");
    const isParsed = parsed.ctrl && parsed.shift && !parsed.alt && parsed.key === "s";
    const space = MenuBar.isShortcutEvent(MenuBar.parseShortcut("Ctrl+Space"), new KeyboardEvent("keydown", { key: " ", ctrlKey: true }));
    check("MenuBar: the text of a shortcut, and how it is read", isShownRight && isParsed && space, [shown, isParsed, space].join(" "));
});

// *** TOOL BAR (comp/tool-bar.js)

const toolButton = function (bar, name) {
    return bar.elem.querySelector('button[aria-label="' + name + '"]');
};

const isOnScreen = function (element) {
    return element.getClientRects().length > 0;
};

test("ToolBar: an item calls its onClick, then the one of the bar; a line, an empty place, a text; a text is never HTML", async function () {
    const clicks = [];
    const bar = ToolBar({
        width: 500,
        items: [
            { key: "save", icon: "save", hint: "Save", onClick: function (self, item) { clicks.push("item " + item.key + " " + (self === bar)); } },
            "-",
            "Plain",
            " ",
            { key: "html", text: "<b>Bold</b>" },
        ],
        onClick: function (self, item) { clicks.push("bar " + (item.key || item.text)); },
    });
    await wait(30);
    mouseClick(toolButton(bar, "Save"));
    mouseClick(toolButton(bar, "Plain"));
    const html = toolButton(bar, "<b>Bold</b>");
    const barRect = bar.elem.getBoundingClientRect();
    const saveRect = toolButton(bar, "Save").getBoundingClientRect();
    const atTheEnd = Math.round(barRect.right - html.getBoundingClientRect().right);
    const isPlain = (html.querySelector("b") === null && html.textContent === "<b>Bold</b>");
    const isToolbar = (bar.elem.getAttribute("role") === "toolbar");
    check("ToolBar: an item calls its onClick, then the one of the bar; a line, an empty place, a text; a text is never HTML",
        clicks.join(",") === "item save true,bar save,bar Plain" && atTheEnd === 6 && isPlain && isToolbar && saveRect.width === 30 && saveRect.height === 30,
        [clicks.join(","), atTheEnd, isPlain, isToolbar, saveRect.width, saveRect.height].join(" | "));
    bar.remove();
});

test("ToolBar: a disabled item and a disabled bar run nothing; setItemEnabled and setEnabled bring them back", async function () {
    const clicks = [];
    const bar = ToolBar({
        items: [{ key: "off", icon: "save", hint: "Off", enabled: 0 }, { key: "on", icon: "undo", hint: "On" }],
        onClick: function (self, item) { clicks.push(item.key); },
    });
    await wait(30);
    const off = toolButton(bar, "Off");
    const on = toolButton(bar, "On");
    off.dispatchEvent(new MouseEvent("mouseenter"));
    const hoverColor = off.style.backgroundColor;
    mouseClick(off);
    bar.clickItem("off");
    const whileOff = clicks.join(",");
    const look = [off.getAttribute("aria-disabled"), off.style.opacity].join(" ");
    bar.setItemEnabled("off", 1);
    mouseClick(off);
    const afterOn = clicks.join(",");
    clicks.length = 0;
    bar.setEnabled(0);
    mouseClick(on);
    bar.clickItem("on");
    key(document.body, "keydown", "s", { ctrlKey: true });
    const barOff = clicks.length;
    bar.setEnabled(1);
    mouseClick(on);
    check("ToolBar: a disabled item and a disabled bar run nothing; setItemEnabled and setEnabled bring them back",
        whileOff === "" && hoverColor === "transparent" && look === "true 0.35" && afterOn === "off" && barOff === 0 && clicks.join() === "on",
        [whileOff, hoverColor, look, afterOn, barOff, clicks.join()].join(" | "));
    bar.remove();
});

test("ToolBar: a toggle stays pressed; one of a group stays pressed, also in a menu; checked alone belongs to the page; the list of the page does not change", async function () {
    const clicks = [];
    const list = [
        { key: "bold", icon: "bold", hint: "Bold", toggle: 1 },
        { key: "left", icon: "alignLeft", hint: "Left", group: "align", checked: 1 },
        { key: "right", icon: "alignRight", hint: "Right", group: "align" },
        { key: "playing", icon: "play", hint: "Playing", checked: 0 },
        { key: "view", text: "View", items: [{ key: "a", text: "A", group: "view", checked: 1 }, { key: "b", text: "B", group: "view" }] },
    ];
    const bar = ToolBar({ items: list, onClick: function (self, item) { clicks.push(item.key); } });
    await wait(30);
    const bold = toolButton(bar, "Bold");
    const left = toolButton(bar, "Left");
    const right = toolButton(bar, "Right");
    const playing = toolButton(bar, "Playing");
    const offColor = bold.style.backgroundColor;
    mouseClick(bold);
    const boldOn = [bold.getAttribute("aria-pressed"), bold.style.backgroundColor !== offColor, bar.isItemChecked("bold")].join();
    mouseClick(bold);
    const boldOff = [bold.getAttribute("aria-pressed"), bold.style.backgroundColor === offColor, bar.isItemChecked("bold")].join();
    mouseClick(right);
    mouseClick(right);
    const group = [left.getAttribute("aria-pressed"), right.getAttribute("aria-pressed")].join();
    clicks.length = 0;
    bar.setItemChecked("left", 1);
    const silent = clicks.length;
    const groupBack = bar.getCheckedKeys().join();
    mouseClick(playing);
    const playingAfterClick = playing.getAttribute("aria-pressed");
    bar.setItemChecked("playing", 1);
    const playingByPage = [playing.getAttribute("aria-pressed"), playing.style.backgroundColor !== offColor].join();
    bar.setItemChecked("playing", 0);
    bar.clickItem("b");
    const inMenu = bar.getCheckedKeys().join();
    const isListSame = (list[0].checked === undefined && list[2].checked === undefined && list[4].items[0].checked === 1 && list[4].items[1].checked === undefined);
    check("ToolBar: a toggle stays pressed; one of a group stays pressed, also in a menu; checked alone belongs to the page; the list of the page does not change",
        boldOn === "true,true,true" && boldOff === "false,true,false" && group === "false,true" && silent === 0 && groupBack === "left,a" &&
        playingAfterClick === "false" && playingByPage === "true,true" && inMenu === "left,b" && isListSame,
        [boldOn, boldOff, group, silent, groupBack, playingAfterClick, playingByPage, inMenu, isListSame].join(" | "));
    bar.remove();
});

test("ToolBar: the buttons that do not fit go into the \"...\" menu and run from there; they come back; no line stays at the end", async function () {
    const clicks = [];
    const names = ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"];
    const items = names.map(function (name) { return { key: name, icon: "save", hint: name }; });
    items.splice(2, 0, "-");
    items[7].toggle = 1; // Seven
    const bar = ToolBar({ width: 800, items: items, onClick: function (self, item) { clicks.push(item.key); } });
    await wait(30);
    const more = toolButton(bar, "More");
    const seven = toolButton(bar, "Seven");
    const wideFits = names.every(function (name) { return isOnScreen(toolButton(bar, name)); }) && !isOnScreen(more);
    bar.width = 180;
    await wait(60);
    const row = bar.layout.elem;
    const narrowFits = (row.scrollWidth <= row.clientWidth && isOnScreen(more));
    const shownNames = names.filter(function (name) { return isOnScreen(toolButton(bar, name)); });
    const isLastTheMore = (more.getBoundingClientRect().left > toolButton(bar, shownNames[shownNames.length - 1]).getBoundingClientRect().left);
    mouseClick(more);
    const isOpen = bar.menu.isOpen() == 1;
    const menuTexts = bar.menu.items.map(function (item) { return item.text; });
    const expected = names.slice(shownNames.length);
    bar.menu.clickItem(menuTexts.indexOf("Seven"));
    const ran = clicks.join();
    const checkedFromMenu = bar.isItemChecked("Seven");
    mouseClick(more);
    const isCheckedInMenu = bar.menu.items[menuTexts.indexOf("Seven")].checked === 1;
    bar.closeMenu();
    bar.width = 143; // WHY: Room for two buttons, the line and "...", not for a third button.
    await wait(60);
    const line = Array.from(row.children).filter(function (child) { return child.tagName !== "BUTTON" && isOnScreen(child); });
    const lastShown = Array.from(row.children).filter(isOnScreen).pop();
    bar.width = 800;
    await wait(60);
    const backFits = names.every(function (name) { return isOnScreen(toolButton(bar, name)); }) && !isOnScreen(more);
    const display = getComputedStyle(seven).display;
    check("ToolBar: the buttons that do not fit go into the \"...\" menu and run from there; they come back; no line stays at the end",
        wideFits && narrowFits && isLastTheMore && isOpen && menuTexts.join() === expected.join() && ran === "Seven" && checkedFromMenu && isCheckedInMenu &&
        line.length === 0 && lastShown === more && backFits && display === "flex",
        [wideFits, narrowFits, isLastTheMore, isOpen, menuTexts.join(), expected.join(), ran, checkedFromMenu, isCheckedInMenu, line.length, lastShown === more, backFits, display].join(" | "));
    bar.remove();
});

test("ToolBar: a button with items opens a menu under it, a second click closes it, a third opens it; its items run; an empty list does not stay open", async function () {
    const clicks = [];
    const bar = ToolBar({
        items: [
            { key: "menu", text: "Menu", onClick: function () { clicks.push("never: it opens the menu"); }, items: [
                { key: "one", text: "One", onClick: function (self, item) { clicks.push("item " + item.key + " " + (self === bar)); } },
                "-",
                "Two",
            ] },
            { key: "empty", text: "Empty", items: [] },
        ],
        onClick: function (self, item) { clicks.push("bar " + (item.key || item.text)); },
    });
    await wait(30);
    const button = toolButton(bar, "Menu");
    mouseClick(button);
    const opened = bar.menu.isOpen() == 1;
    const isUnder = bar.menu.elem.getBoundingClientRect().top >= button.getBoundingClientRect().bottom - 1;
    const isExpanded = [button.getAttribute("aria-expanded"), button.getAttribute("aria-haspopup")].join();
    const openColor = button.style.backgroundColor;
    mouseClick(button);
    const closed = bar.menu.isOpen() == 0;
    const closedColor = button.style.backgroundColor;
    mouseClick(button);
    const openedAgain = bar.menu.isOpen() == 1;
    bar.menu.clickItem(0);
    const afterItem = [bar.menu.isOpen(), button.getAttribute("aria-expanded")].join();
    mouseClick(button);
    bar.menu.clickItem(2);
    const empty = toolButton(bar, "Empty");
    mouseClick(empty);
    const emptyState = [bar.menu.isOpen(), empty.getAttribute("aria-expanded")].join();
    check("ToolBar: a button with items opens a menu under it, a second click closes it, a third opens it; its items run; an empty list does not stay open",
        opened && isUnder && isExpanded === "true,menu" && openColor !== closedColor && closed && openedAgain && afterItem === "0,false" &&
        clicks.join() === "item one true,bar one,bar Two" && emptyState === "0,false",
        [opened, isUnder, isExpanded, openColor, closedColor, closed, openedAgain, afterItem, clicks.join(), emptyState].join(" | "));
    bar.remove();
});

test("ToolBar: the keys: one Tab stop; the arrows, Home and End skip a disabled button and go round; ArrowDown and Enter open a menu; Escape comes back", async function () {
    const bar = ToolBar({
        items: [
            { key: "a", icon: "save", hint: "A" },
            { key: "b", icon: "undo", hint: "B", enabled: 0 },
            "-",
            { key: "c", icon: "redo", hint: "C" },
            { key: "m", text: "M", items: ["One", "Two"] },
        ],
    });
    await wait(30);
    const button = function (name) { return toolButton(bar, name); };
    const tabStops = function () {
        return ["A", "B", "C", "M"].filter(function (name) { return button(name).tabIndex === 0; }).join();
    };
    const focused = function () { return document.activeElement.getAttribute("aria-label"); };
    const firstStop = tabStops();
    button("A").focus();
    key(button("A"), "keydown", "ArrowRight");
    const toC = focused();
    const stopFollows = tabStops();
    key(button("C"), "keydown", "ArrowLeft");
    const backToA = focused();
    key(button("A"), "keydown", "ArrowLeft");
    const roundToM = focused();
    key(button("M"), "keydown", "ArrowRight");
    const roundToA = focused();
    key(button("A"), "keydown", "End");
    const end = focused();
    key(button("M"), "keydown", "Home");
    const home = focused();
    key(button("M"), "keydown", "End");
    key(button("M"), "keydown", "ArrowDown");
    const openedDown = bar.menu.isOpen() == 1;
    const focusInMenu = bar.menu.elem.contains(document.activeElement);
    key(document.activeElement, "keydown", "Escape");
    const closedByEscape = bar.menu.isOpen() == 0;
    const focusBack = focused();
    button("M").click(); // WHY: Enter and Space make a click with detail 0.
    const openedByEnter = bar.menu.isOpen() == 1 && bar.menu.elem.contains(document.activeElement);
    key(document.activeElement, "keydown", "Escape");
    key(button("C"), "keydown", "ArrowDown"); // No menu: nothing
    const noMenu = bar.menu.isOpen() == 0;
    check("ToolBar: the keys: one Tab stop; the arrows, Home and End skip a disabled button and go round; ArrowDown and Enter open a menu; Escape comes back",
        firstStop === "A" && toC === "C" && stopFollows === "C" && backToA === "A" && roundToM === "M" && roundToA === "A" && end === "M" && home === "A" &&
        openedDown && focusInMenu && closedByEscape && focusBack === "M" && openedByEnter && noMenu,
        [firstStop, toC, stopFollows, backToA, roundToM, roundToA, end, home, openedDown, focusInMenu, closedByEscape, focusBack, openedByEnter, noMenu].join(" | "));
    bar.remove();
});

test("ToolBar: a shortcut runs its item (a menu of it too), also when it is in the \"...\" menu; a held key once; not when disabled, hidden, under a Dialog; in a field only with Ctrl", async function () {
    const clicks = [];
    const bar = ToolBar({
        width: 90,
        items: [
            { key: "first", icon: "undo", hint: "First" },
            { key: "save", icon: "save", hint: "Save", shortcut: "Ctrl+S" },
            { key: "off", icon: "redo", hint: "Off", shortcut: "Ctrl+Q", enabled: 0 },
            { key: "more", text: "More items", items: [{ key: "deep", text: "Deep", shortcut: "F9" }] },
        ],
        onClick: function (self, item) { clicks.push(item.key); },
    });
    const field = Input({ left: 10, top: 60, width: 100, height: 30 });
    await wait(60);
    const isHiddenOne = !isOnScreen(toolButton(bar, "Save"));
    key(document.body, "keydown", "s", { ctrlKey: true });
    key(document.body, "keydown", "s", { metaKey: true });
    key(document.body, "keydown", "F9");
    key(document.body, "keydown", "q", { ctrlKey: true });
    const normal = clicks.join();
    clicks.length = 0;
    const held = new KeyboardEvent("keydown", { key: "s", ctrlKey: true, repeat: true, bubbles: true, cancelable: true });
    document.body.dispatchEvent(held);
    const heldKey = [clicks.length, held.defaultPrevented].join();
    field.elem.focus();
    key(field.inputElement, "keydown", "F9");
    key(field.inputElement, "keydown", "s", { ctrlKey: true });
    const inField = clicks.join();
    field.elem.blur();
    clicks.length = 0;
    const dialog = Dialog({ removeOnClose: 1, buttons: [] });
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    const underDialog = clicks.length;
    dialog.remove();
    await wait(30);
    bar.visible = 0;
    key(document.body, "keydown", "s", { ctrlKey: true });
    const whenHidden = clicks.length;
    bar.visible = 1;
    key(document.body, "keydown", "s", { ctrlKey: true });
    const whenBack = clicks.join();
    check("ToolBar: a shortcut runs its item (a menu of it too), also when it is in the \"...\" menu; a held key once; not when disabled, hidden, under a Dialog; in a field only with Ctrl",
        isHiddenOne && normal === "save,save,deep" && heldKey === "0,true" && inField === "save" && underDialog === 0 && whenHidden === 0 && whenBack === "save",
        [isHiddenOne, normal, heldKey, inField, underDialog, whenHidden, whenBack].join(" | "));
    field.remove();
    bar.remove();
});

test("ToolBar: a key that is also in a MenuBar runs once, in the bar made first", async function () {
    const clicks = [];
    const makeMenuBar = function () {
        return MenuBar({ menus: [{ text: "File", items: [{ text: "Save", key: "save", shortcut: "Ctrl+S" }] }], onClick: function () { clicks.push("menu"); } });
    };
    const makeToolBar = function () {
        return ToolBar({ items: [{ key: "save", icon: "save", hint: "Save", shortcut: "Ctrl+S" }], onClick: function () { clicks.push("tool"); } });
    };
    const firstMenu = makeMenuBar();
    const secondTool = makeToolBar();
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    const menuFirst = clicks.join();
    firstMenu.remove();
    secondTool.remove();
    clicks.length = 0;
    const firstTool = makeToolBar();
    const secondMenu = makeMenuBar();
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    const toolFirst = clicks.join();
    firstTool.remove();
    secondMenu.remove();
    check("ToolBar: a key that is also in a MenuBar runs once, in the bar made first", menuFirst === "menu" && toolFirst === "tool", [menuFirst, toolFirst].join(" | "));
});

test("ToolBar: the bubble of a button: its name and shortcut, none for a plain text button; a click hides it until the mouse comes back; setItemHint, setItemText", async function () {
    const bar = ToolBar({
        items: [
            { key: "save", icon: "save", hint: "Save", shortcut: "Ctrl+S" },
            { key: "plain", text: "Plain" },
        ],
    });
    await wait(30);
    const hover = function (button) { button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 40, clientY: 40 })); };
    const leave = function (button) { button.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })); };
    const bubbleText = function () { return (window.lblHint) ? window.lblHint.label.text : ""; };
    const save = toolButton(bar, "Save");
    const plain = toolButton(bar, "Plain");
    const shortcutText = MenuBar.shortcutText("Ctrl+S");
    hover(save);
    const shown = bubbleText();
    save.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: 41, clientY: 41 }));
    mouseClick(save);
    const afterClick = bubbleText();
    leave(save);
    hover(save);
    const shownAgain = bubbleText();
    leave(save);
    hover(plain);
    const onPlain = bubbleText();
    leave(plain);
    bar.setItemHint("plain", "With a name");
    hover(plain);
    const hintAdded = [bubbleText(), plain.getAttribute("aria-label")].join();
    leave(plain);
    bar.setItemHint("plain", "");
    hover(plain);
    const hintRemoved = [bubbleText(), plain.getAttribute("aria-label")].join();
    leave(plain);
    bar.setItemText("plain", "<i>New</i>");
    const newText = [plain.textContent, plain.querySelector("i") === null, plain.getAttribute("aria-label")].join();
    hover(save);
    const bubble = window.lblHint;
    bar.remove();
    const isBubbleGone = (window.lblHint === null && bubble.isRemoved == 1);
    const texts = [
        ToolBar.getHintText({ hint: "Save" }),
        ToolBar.getHintText({ text: "Run" }),
        ToolBar.getHintText({ text: "Run", shortcut: "F9" }),
        ToolBar.getHintText({ shortcut: "F9" }),
    ].join();
    check("ToolBar: the bubble of a button: its name and shortcut, none for a plain text button; a click hides it until the mouse comes back; setItemHint, setItemText",
        shown === "Save (" + shortcutText + ")" && afterClick === "" && shownAgain === shown && onPlain === "" && hintAdded === "With a name,With a name" &&
        hintRemoved === ",Plain" && newText === "<i>New</i>,true,<i>New</i>" && isBubbleGone && texts === "Save,,Run (F9),F9",
        [shown, afterClick, shownAgain, onPlain, hintAdded, hintRemoved, newText, isBubbleGone, texts].join(" | "));
});

test("Tooltip: hideHint() removes only its own bubble", async function () {
    const first = Tooltip({ target: Button({ left: 0, top: 0, width: 50, height: 30 }), hintText: "First" });
    const firstTarget = first.target;
    const second = Tooltip({ target: Button({ left: 60, top: 0, width: 50, height: 30 }), hintText: "Second" });
    const secondTarget = second.target;
    secondTarget.elem.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 70, clientY: 10 }));
    first.hideHint();
    const stays = !!window.lblHint;
    second.hideHint();
    const gone = (window.lblHint === null);
    second.hideHint();
    check("Tooltip: hideHint() removes only its own bubble", stays && gone, [stays, gone].join(" | "));
    first.remove();
    second.remove();
    firstTarget.remove();
    secondTarget.remove();
});

test("ToolBar: setTheme() paints a new package, the style of the page stays on it, its menu follows; setItems() makes new buttons", async function () {
    const bar = ToolBar({
        style: { button: { iconSize: 22 } },
        items: [{ key: "bold", icon: "bold", hint: "Bold", toggle: 1, checked: 1 }, { key: "menu", text: "Menu", items: ["One"] }],
    });
    await wait(30);
    const bold = toolButton(bar, "Bold");
    const lightPressed = bold.style.backgroundColor;
    const lightMenu = bar.menu;
    const lightBar = bar.elem.style.backgroundColor;
    mouseClick(toolButton(bar, "Menu"));
    bar.setTheme("dark");
    const closedByTheme = lightMenu.isRemoved == 1;
    const dark = [bar.styleName, bar.menu.styleName, bar.style.button.iconSize, getComputedStyle(bar.elem).getPropertyValue("--tool-bar-icon").trim()].join();
    const isPainted = (bar.elem.style.backgroundColor !== lightBar && bold.style.backgroundColor !== lightPressed);
    mouseClick(toolButton(bar, "Menu"));
    const menuOpens = bar.menu.isOpen() == 1;
    bar.closeMenu();
    bar.setTheme("light");
    const lightBack = (bold.style.backgroundColor === lightPressed && bar.elem.style.backgroundColor === lightBar && bar.style.button.iconSize === 22);
    const clicks = [];
    bar.onClick = function (self, item) { clicks.push(item.key); };
    bar.setItems([{ key: "new", icon: "new", hint: "New" }]);
    const newOnes = [toolButton(bar, "Bold") === null, bar.getCheckedKeys().length].join();
    mouseClick(toolButton(bar, "New"));
    check("ToolBar: setTheme() paints a new package, the style of the page stays on it, its menu follows; setItems() makes new buttons",
        closedByTheme && dark === "dark,dark,22,22px" && isPainted && menuOpens && lightBack && newOnes === "true,0" && clicks.join() === "new",
        [closedByTheme, dark, isPainted, menuOpens, lightBack, newOnes, clicks.join()].join(" | "));
    bar.remove();
});

test("ToolBar: an item can remove the bar (a click, a menu, a shortcut); remove() takes its menu and its keys", async function () {
    const clicks = [];
    const makeBar = function () {
        const bar = ToolBar({
            items: [
                { key: "gone", icon: "save", hint: "Gone", shortcut: "Ctrl+S", onClick: function () { bar.remove(); } },
                { key: "menu", text: "Menu", items: [{ key: "inner", text: "Inner", onClick: function () { bar.remove(); } }] },
            ],
            onClick: function () { clicks.push("the bar was removed"); },
        });
        return bar;
    };
    const byClick = makeBar();
    await wait(30);
    mouseClick(toolButton(byClick, "Gone"));
    const byMenu = makeBar();
    await wait(30);
    const menuOfBar = byMenu.menu;
    mouseClick(toolButton(byMenu, "Menu"));
    menuOfBar.clickItem(0);
    const byKey = makeBar();
    await wait(30);
    key(document.body, "keydown", "s", { ctrlKey: true });
    key(document.body, "keydown", "s", { ctrlKey: true });
    const removed = [byClick.isRemoved, byMenu.isRemoved, menuOfBar.isRemoved, byKey.isRemoved].join();
    const open = makeBar();
    await wait(30);
    const openMenu = open.menu;
    mouseClick(toolButton(open, "Menu"));
    open.remove();
    open.remove();
    check("ToolBar: an item can remove the bar (a click, a menu, a shortcut); remove() takes its menu and its keys",
        removed === "1,1,1,1" && clicks.length === 0 && openMenu.isRemoved == 1,
        [removed, clicks.length, openMenu.isRemoved].join(" | "));
});

test("ToolBar: every icon of ToolBar.ICONS is drawn at its size; its own SVG and an image file; an unknown name draws nothing", async function () {
    const names = Object.keys(ToolBar.ICONS);
    const items = names.map(function (name) { return { key: name, icon: name, hint: name }; });
    items.push({ key: "own", icon: "<svg id='own-icon' viewBox='0 0 24 24'></svg>", hint: "Own" });
    items.push({ key: "file", iconFile: 'a"b.png', hint: "File" });
    const bar = ToolBar({ width: 1500, items: items });
    await wait(30);
    const badNames = names.filter(function (name) {
        const icon = toolButton(bar, name).querySelector(".tool-bar-icon");
        const rect = icon.getBoundingClientRect();
        const drawing = icon.querySelector("svg path, svg circle, svg rect");
        return !(drawing && rect.width === 18 && rect.height === 18);
    });
    const own = toolButton(bar, "Own").querySelector("#own-icon") !== null;
    const image = toolButton(bar, "File").querySelector("img");
    const warn = console.warn;
    console.warn = function () {};
    const unknown = ToolBar.getIconSvg("no such icon");
    console.warn = warn;
    check("ToolBar: every icon of ToolBar.ICONS is drawn at its size; its own SVG and an image file; an unknown name draws nothing",
        badNames.length === 0 && own && image.getAttribute("src") === 'a"b.png' && unknown === "",
        [badNames.join(), own, image.getAttribute("src"), unknown].join(" | "));
    bar.remove();
});

test("ToolBar: a button with no name has an empty text in the \"...\" menu", async function () {
    const bar = ToolBar({ width: 60, items: [{ icon: "save" }, { icon: "undo" }, { icon: "redo" }] });
    await wait(60);
    mouseClick(toolButton(bar, "More"));
    const texts = bar.menu.items.map(function (item) { return item.text; });
    check("ToolBar: a button with no name has an empty text in the \"...\" menu", texts.length > 0 && texts.every(function (text) { return text === ""; }), texts.join());
    bar.remove();
});

test("ToolBar: its bubble has no edge, and it follows the theme", async function () {
    const bar = ToolBar({ items: [{ key: "save", icon: "save", hint: "Save" }] });
    await wait(30);
    const save = toolButton(bar, "Save");
    const bubbleLook = function () {
        save.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: 40, clientY: 40 }));
        const bubble = window.lblHint.elem;
        const look = [getComputedStyle(bubble).borderTopWidth, bubble.style.backgroundColor].join(" ");
        save.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
        return look;
    };
    const light = bubbleLook();
    bar.setTheme("dark");
    const dark = bubbleLook();
    bar.setTheme("light");
    const back = bubbleLook();
    check("ToolBar: its bubble has no edge, and it follows the theme",
        light === "0px rgb(43, 43, 42)" && dark === "0px rgb(74, 74, 72)" && back === light,
        [light, dark, back].join(" | "));
    bar.remove();
});
