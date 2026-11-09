/* Bismillah */

/*
BEHAVIOR TESTS: INPUTS
The tests of test/behavior-test.htm for fields and inputs (TextField and its fields, Slider, Stepper, SearchInput, FilePicker, PropertyPanel...).
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

// *** SORTABLE LIST (comp/sortable-list.js)

test("SortableList: after a touch drag the next tap works", async function () {
    const clicks = [];
    const list = SortableList({ width: 300, height: 300, dragBy: "row", items: ["One", "Two", "Three"], onItemClick: function (self, item) { clicks.push(item); } });
    await wait(50);
    const label = findByText("One", list.elem);
    const rect = label.getBoundingClientRect();
    const x = rect.left + 5;
    const y = rect.top + rect.height / 2;
    pointer(label, "pointerdown", x, y, "touch");
    for (let i = 1; i <= 8; i++) {
        pointer(document, "pointermove", x, y + i * 10, "touch");
        await wait(16);
    }
    pointer(document, "pointerup", x, y + 80, "touch");
    await wait(400);
    findByText("Three", list.elem).click(); // the next real tap
    check("SortableList: after a touch drag the next tap works", clicks.length === 1, "clicks: " + clicks.length);
    list.remove();
});

test("SortableList: a drag puts a row at the very top and at the very bottom (also a taller row)", async function () {
    const list = SortableList({ width: 300, height: "auto", dragBy: "row", items: ["One", { key: "Two", text: "Two", description: "A taller row" }, "Three", "Four"] });
    await wait(50);
    // The pointer goes far past the edge of the list: the row stops at the edge.
    const dragRow = async function (text, distance) {
        const label = findByText(text, list.elem);
        const rect = label.getBoundingClientRect();
        const x = rect.left + 5;
        const y = rect.top + rect.height / 2;
        pointer(label, "pointerdown", x, y, "touch");
        for (let i = 1; i <= 10; i++) {
            pointer(document, "pointermove", x, y + distance * i / 10, "touch");
            await wait(16);
        }
        pointer(document, "pointerup", x, y + distance, "touch");
        await wait(400);
    };
    await dragRow("Three", -300);
    const afterUp = list.getKeys().join(",");
    await dragRow("Two", 300);
    const afterDown = list.getKeys().join(",");
    check("SortableList: a drag puts a row at the very top and at the very bottom (also a taller row)", afterUp === "Three,One,Two,Four" && afterDown === "Three,One,Four,Two", "after the drag up: " + afterUp + ", after the drag down: " + afterDown);
    list.remove();
});

// *** SELECT FILE (comp/file-picker.js)

test("FilePicker: a low zone hides what does not fit, first the icon, and no text is squeezed", async function () {
    const isShown = (object) => object.elem.offsetHeight > 0;
    const getShown = function (select) {
        return [select.icon, select.title, select.desc, select.hint].map((object) => (isShown(object) ? 1 : 0)).join("");
    };
    const params = { accept: "image/*" };
    const tall = FilePicker({ ...params, zoneHeight: 170 });
    const noIcon = FilePicker({ ...params, zoneHeight: 110 });
    const noHint = FilePicker({ ...params, zoneHeight: 70 });
    const onlyTitle = FilePicker({ ...params, zoneHeight: 40 });
    await wait(50);
    const results = [tall, noIcon, noHint, onlyTitle].map(getShown);
    const titleHeights = [tall, onlyTitle].map((select) => select.title.elem.offsetHeight);
    const titleRect = onlyTitle.title.elem.getBoundingClientRect();
    const zoneRect = onlyTitle.zone.elem.getBoundingClientRect();
    check("FilePicker: a low zone hides what does not fit, first the icon, and no text is squeezed",
        results.join() === "1111,0111,0110,0100" && titleHeights[0] === titleHeights[1]
            && titleRect.top >= zoneRect.top && titleRect.bottom <= zoneRect.bottom,
        results.join() + " | " + titleHeights.join());
    [tall, noIcon, noHint, onlyTitle].forEach((select) => select.remove());
});

test("FilePicker: iconSvg puts an icon of the page; animated: 1 lifts it while a file is dragged over, animated: 0 writes nothing", async function () {
    const ownIcon = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor"/></svg>';
    const own = FilePicker({ iconSvg: ownIcon, animated: 1 });
    const still = FilePicker({});
    const hasOwnIcon = own.icon.elem.querySelector("circle") != null;
    own.zone.elem.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: new DataTransfer() }));
    still.zone.elem.dispatchEvent(new DragEvent("dragenter", { bubbles: true, dataTransfer: new DataTransfer() }));
    await wait(80);
    const ownTransform = own.icon.elem.style.transform;
    const stillLook = still.icon.elem.style.transform + still.icon.elem.style.transition;
    own.setIconSvg("");
    const isUploadIconBack = own.icon.elem.querySelector("circle") == null && own.icon.elem.querySelectorAll("path").length === 2;
    check("FilePicker: iconSvg puts an icon of the page; animated: 1 lifts it while a file is dragged over, animated: 0 writes nothing",
        hasOwnIcon && ownTransform.indexOf("translateY(-") === 0 && stillLook === "" && isUploadIconBack,
        hasOwnIcon + " | " + ownTransform + " | " + stillLook + " | " + isUploadIconBack);
    [own, still].forEach((select) => select.remove());
});

test("FilePicker: iconFile puts a picture in the place of the icon; setIcon(\"\") brings the svg back", async function () {
    const picture = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" fill="red"/></svg>');
    const select = FilePicker({ iconFile: picture, iconSvg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/></svg>' });
    const image = select.icon.elem.querySelector("img");
    const hasPicture = (image != null && image.getAttribute("src") === picture && select.icon.elem.querySelector("svg") == null);
    select.setIcon("");
    const hasOwnSvgAgain = (select.icon.elem.querySelector("img") == null && select.icon.elem.querySelector("circle") != null);
    select.remove();
    check("FilePicker: iconFile puts a picture in the place of the icon; setIcon(\"\") brings the svg back", hasPicture && hasOwnSvgAgain,
        "picture: " + hasPicture + ", the svg of the page again: " + hasOwnSvgAgain);
});

test("FilePicker: the same file again does not call onChange", async function () {
    let changes = 0;
    const select = FilePicker({ multiple: 1, onChange: function () { changes++; } });
    const drop = function (names) {
        const transfer = new DataTransfer();
        names.forEach(function (name) { transfer.items.add(new File(["x"], name, { type: "text/plain", lastModified: 1 })); });
        select.zone.elem.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    };
    drop(["a.txt"]);
    drop(["a.txt"]);
    check("FilePicker: the same file again does not call onChange", changes === 1, "onChange: " + changes);
    select.remove();
});

test("FilePicker: a file of a program is a plain object with its path; the row shows its name", async function () {
    const path = "/Users/ada/photos/sea.png";
    const dot = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const select = FilePicker({ multiple: 1 });
    select.addFiles([
        { name: "sea.png", path: path, size: 2048, type: "image/png", lastModified: 5 },
        { name: "dot.gif", path: "/Users/ada/dot.gif", size: 40, type: "image/gif", lastModified: 5, previewAddress: dot },
    ]);
    const details = select.getFileDetails();
    const rows = select.list.elem.innerText;
    const pictures = select.list.elem.querySelectorAll("img");
    const isRight = details.length === 2 && details[0].path === path && !("file" in details[0])
        && rows.includes("sea.png") && !rows.includes("/Users/ada")
        && pictures.length === 1 && pictures[0].src === dot;
    check("FilePicker: a file of a program is a plain object with its path; the row shows its name", isRight,
        JSON.stringify(details[0]) + " | " + rows + " | pictures: " + pictures.length);
    select.remove();
});

test("FilePicker: onOpenDialog opens the dialog of a program in the place of the dialog of the page", async function () {
    let asked = 0;
    let pageDialogs = 0;
    const select = FilePicker({ onOpenDialog: function () { asked++; } });
    select.input.addEventListener("click", function (event) {
        pageDialogs++;
        event.preventDefault();
    });
    select.zone.elem.click();
    select.open();
    check("FilePicker: onOpenDialog opens the dialog of a program in the place of the dialog of the page",
        asked === 2 && pageDialogs === 0, "asked: " + asked + ", dialogs of the page: " + pageDialogs);
    select.remove();
});

test("FilePicker: removeFile(index, 1) does not call onChange", async function () {
    let changes = 0;
    const select = FilePicker({ multiple: 1, onChange: function () { changes++; } });
    select.addFiles([{ name: "a.txt", size: 1 }, { name: "b.txt", size: 2 }, { name: "c.txt", size: 3 }]);
    select.removeFile(0, 1);
    const afterSilent = changes;
    select.removeFile(0);
    check("FilePicker: removeFile(index, 1) does not call onChange",
        afterSilent === 1 && changes === 2 && select.files.length === 1, "onChange: " + afterSilent + ", " + changes);
    select.remove();
});

test("FilePicker: the dark package, and a style of the page over it", async function () {
    const groundOf = (select) => getComputedStyle(select.zone.elem).backgroundColor;
    const dark = FilePicker({ styleName: "dark" });
    const own = FilePicker({ styleName: "dark", style: { zone: { color: "rgb(1, 2, 3)" } } });
    const light = FilePicker();
    const grounds = [dark, own, light].map(groundOf);
    check("FilePicker: the dark package, and a style of the page over it",
        grounds.join() === "rgb(35, 35, 34),rgb(1, 2, 3),rgb(255, 255, 255)", grounds.join());
    [dark, own, light].forEach((select) => select.remove());
});

// *** PROPERTY PANEL (comp/property-panel.js)

test("PropertyPanel: leaving a number field without a change keeps the value", async function () {
    const changes = [];
    const panel = PropertyPanel({
        data: { sections: [{ key: "s", title: "S", items: [{ key: "x", type: "number", prefix: "X", value: 12.4 }] }] },
        onChange: function (self, change) { changes.push(change); },
    });
    await wait(30);
    const field = Array.from(panel.elem.querySelectorAll("input")).find(function (el) { return el.value === "12"; });
    field.focus();
    field.blur();
    key(field, "keydown", "Escape");
    check("PropertyPanel: leaving a number field without a change keeps the value", changes.length === 0 && panel.getValue("x") === 12.4, "changes: " + changes.length + ", value: " + panel.getValue("x"));
    panel.remove();
});

test("PropertyPanel: commaIsList reads 12,0 as a list (parseText), another field 0,5 as a decimal", async function () {
    const parsed = [];
    const listField = { key: "round", type: "number", prefix: "R", value: 8, commaIsList: 1, parseText: function (text) { parsed.push(text); return text.split(",").join(", "); } };
    const decimalField = { key: "opacity", type: "number", prefix: "O", value: 1, step: 0.1 };
    const panel = PropertyPanel({ data: { sections: [{ key: "s", title: "S", items: [[listField, decimalField]] }] } });
    await wait(30);
    const fields = Array.from(panel.elem.querySelectorAll("input"));
    const roundInput = fields.find(function (el) { return el.value === "8"; });
    const opacityInput = fields.find(function (el) { return el.value === "1.0"; });
    roundInput.focus();
    roundInput.value = "12,0";
    roundInput.blur();
    opacityInput.focus();
    opacityInput.value = "0,5";
    opacityInput.blur();
    const isList = (parsed[0] === "12,0" && panel.getValue("round") === "12, 0");
    const isDecimal = (panel.getValue("opacity") === 0.5);
    check("PropertyPanel: commaIsList reads 12,0 as a list (parseText), another field 0,5 as a decimal", isList && isDecimal,
        "round: " + JSON.stringify(panel.getValue("round")) + ", opacity: " + panel.getValue("opacity"));
    panel.remove();
});

test("PropertyPanel: a click on a prefix with prefixClick gives its value, a drag of it does not", async function () {
    const changes = [];
    const panel = PropertyPanel({
        data: { sections: [{ key: "s", title: "S", items: [{ key: "left", type: "number", prefix: "Left", prefixWidth: 56, prefixClick: "__side:right", value: 10 }] }] },
        onChange: function (self, change) { changes.push(change); },
    });
    panel.open();
    await wait(30);
    const prefix = Array.from(panel.elem.querySelectorAll("div")).find(function (el) { return el.textContent === "Left" && el.children.length === 0; });
    const rect = prefix.getBoundingClientRect();
    const press = function (type, x) {
        prefix.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 3, button: 0, clientX: x, clientY: rect.top + 5 }));
    };
    press("pointerdown", rect.left + 10);
    press("pointermove", rect.left + 30);
    press("pointerup", rect.left + 30);
    const afterDrag = changes.map(function (c) { return c.value; });
    const isDragOnlyNumbers = afterDrag.length > 0 && afterDrag.every(function (v) { return typeof v === "number"; });
    press("pointerdown", rect.left + 10);
    press("pointerup", rect.left + 11);
    const last = changes[changes.length - 1];
    check("PropertyPanel: a click on a prefix with prefixClick gives its value, a drag of it does not", isDragOnlyNumbers && last && last.value === "__side:right", "drag: " + afterDrag.join(",") + ", click: " + (last && last.value));
    panel.remove();
});

test("PropertyPanel: the button of a field sends its action with the field (a click, a click on the prefix, Alt+Down); a drag of the prefix changes the value", async function () {
    const changes = [];
    const panel = PropertyPanel({
        data: { sections: [{ key: "s", title: "S", items: [
            { key: "pad", type: "number", prefix: "P", value: 10, button: { icon: "sliders", hint: "Its four sides" } },
            { key: "shadow", type: "text", value: "", span: "full", button: { icon: "sliders", hint: "Shadow" } },
        ] }] },
        onChange: function (self, change) { changes.push(change); },
    });
    panel.open();
    await wait(30);
    panel.elem.querySelector("[role=button][aria-label='Its four sides']").click();
    const prefix = Array.from(panel.elem.querySelectorAll("div")).find(function (el) { return el.textContent === "P" && el.children.length === 0; });
    const rect = prefix.getBoundingClientRect();
    const press = function (type, x) {
        prefix.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 4, button: 0, clientX: x, clientY: rect.top + 5 }));
    };
    press("pointerdown", rect.left + 10);
    press("pointermove", rect.left + 30);
    press("pointerup", rect.left + 30);
    press("pointerdown", rect.left + 10);
    press("pointerup", rect.left + 11);
    const input = panel.elem.querySelector("input[aria-label='shadow']");
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true }));
    const actions = changes.filter(function (c) { return c.kind === "action"; });
    const values = changes.filter(function (c) { return c.kind === "value"; });
    const isActionWithField = actions.length === 3 && actions.every(function (a) { return a.value === "button" && a.field && a.field.elem.isConnected; });
    const isOrder = isActionWithField && actions[1].key === "pad" && actions[2].key === "shadow";
    const isDragNumbers = values.length > 0 && values.every(function (v) { return v.key === "pad" && typeof v.value === "number"; });
    check("PropertyPanel: the button of a field sends its action with the field (a click, a click on the prefix, Alt+Down); a drag of the prefix changes the value", isOrder && isDragNumbers,
        "actions: " + actions.map(function (a) { return a.key + ":" + a.value + (a.field ? "+field" : ""); }).join(", ") + "; values: " + values.length);
    panel.remove();
});

// A panel with one color field and an editable group (a static palette), its picker open.
const openColorPanel = async function (changes, colors = ["#111111", "#222222", "#333333"]) {
    const panel = PropertyPanel({
        data: { sections: [{ key: "s", title: "S", items: [{ key: "fill", type: "color", label: "Fill", value: "#222222" }] }] },
        palettes: [{ key: "mine", name: "Mine", canAdd: 1, colors: colors }, { key: "other", name: "Other", canAdd: 1, colors: [] }],
        onChange: function (self, change) { changes.push(change); },
    });
    panel.open();
    await wait(30);
    panel.elem.querySelector("[aria-haspopup=dialog]").click();
    await wait(30);
    const picker = Array.from(document.querySelectorAll("[role=dialog]")).pop();
    const swatchOf = function (value) { return picker.querySelector("[aria-label='" + value + "']"); };
    return { panel: panel, picker: picker, swatchOf: swatchOf };
};

test("PropertyPanel: the ring of a hovered selected color stays inside the scrolling colors of the picker", async function () {
    const ui = await openColorPanel([]);
    const square = ui.swatchOf("#222222");
    const style = PropertyPanelDefaults.style.colorPicker;
    const grid = square.parentNode;
    const padding = parseFloat(getComputedStyle(grid).paddingLeft);
    const ringAndGrowth = 3 + style.swatchSize * 0.05; // the ring (3) and half of the 1.1 growth
    check("PropertyPanel: the ring of a hovered selected color stays inside the scrolling colors of the picker", padding >= ringAndGrowth, "padding: " + padding + ", needs: " + ringAndGrowth);
    ui.panel.remove();
});

test("PropertyPanel: Delete in the menu of a color removes it from its editable group", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    ui.swatchOf("#111111").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    await wait(10);
    const row = ui.picker.querySelector("[aria-label='Delete #111111 from Mine']");
    if (row) row.click();
    await wait(10);
    const removed = changes.find(function (change) { return change.kind === "removeColor"; });
    const isGone = !ui.swatchOf("#111111");
    check("PropertyPanel: Delete in the menu of a color removes it from its editable group", !!row && !!removed && removed.value === "#111111" && isGone, "menu row: " + !!row + ", change: " + !!removed + ", gone: " + isGone);
    ui.panel.remove();
});

test("PropertyPanel: openColorPickerFor gives the same picker to a color outside of the panel", async function () {
    const sent = [];
    let closeCount = 0;
    const panel = PropertyPanel({ data: {}, palettes: [{ key: "mine", name: "Mine", colors: ["#111111"], canAdd: 1 }] });
    const opener = Box(0, 0, 10, 10);
    panel.openColorPickerFor({
        key: "outside",
        hint: "Outside",
        value: "#FF0000",
        opener: opener,
        rect: { left: 400, top: 60, right: 420, bottom: 80 },
        commit: function (value) { sent.push(value); },
        onClose: function () { closeCount++; },
    });
    await wait(10);
    const wasOpen = panel.isColorPickerOpen();
    const picker = document.querySelector("[role=dialog][aria-label='Outside color']");
    const swatch = (picker) ? picker.querySelector("[aria-label='#111111']") : null;
    if (swatch) swatch.click();
    const isSent = (sent[sent.length - 1] === "#111111");
    panel.closeColorPicker();
    await wait(10);
    check("PropertyPanel: openColorPickerFor gives the same picker to a color outside of the panel", wasOpen && !!swatch && isSent && closeCount === 1 && !panel.isColorPickerOpen(),
        "open " + wasOpen + ", swatch " + !!swatch + ", sent " + sent.join(",") + ", closed " + closeCount);
    opener.remove();
    panel.remove();
});

test("PropertyPanel: buildColorStrip gives the colors under a field to a color outside of the panel", async function () {
    const key = "behavior-test-strip";
    basic.storage.save(key + "-quick", { recent: 0, group: 1, paletteKey: "mine" });
    const picked = [];
    const panel = PropertyPanel({ data: {}, recentColorsKey: key, palettes: [{ key: "mine", name: "Mine", colors: ["#111111", "#222222"], canAdd: 1 }] });
    const holder = VGroup({ width: 200, height: "auto" });
        const strip = panel.buildColorStrip({ key: "outside", hint: "Outside", width: 120, onPick: function (value) { picked.push(value); } });
    endGroup();
    await wait(10);
    const swatch = strip.obj.elem.querySelector("[aria-label='#222222 (Mine)']");
    if (swatch) swatch.click();
    const isPicked = (picked[0] === "#222222");
    // WHY after setData: the panel draws its items again, this strip is not one of them.
    panel.setData({});
    panel.openColorPickerFor({ key: "outside", hint: "Outside", value: "", rect: { left: 400, top: 60, right: 420, bottom: 80 }, commit: function () { } });
    await wait(10);
    const tick = document.querySelector("[role=checkbox][title*='selected group']");
    if (tick) tick.click();
    await wait(10);
    const isHidden = (strip.obj.visible == 0);
    check("PropertyPanel: buildColorStrip gives the colors under a field to a color outside of the panel", !!swatch && isPicked && !!tick && isHidden,
        "swatch " + !!swatch + ", picked " + picked.join(",") + ", tick " + !!tick + ", hidden " + isHidden);
    panel.closeColorPicker();
    holder.remove();
    panel.remove();
    basic.storage.remove(key + "-quick");
});

test("PropertyPanel: the title of the color picker moves it, and it opens there again", async function () {
    const panel = PropertyPanel({ data: { sections: [{ key: "s", items: [{ key: "fill", type: "color", label: "Fill", value: "#FF0000" }] }] } });
    await wait(10);
    const pickerOf = function () { return document.querySelector("[role=dialog][aria-label='Fill color']"); };
    panel.elem.querySelector("[aria-label='Open the color picker of Fill']").click();
    await wait(10);
    const firstLeft = pickerOf().getBoundingClientRect().left;
    const title = pickerOf().querySelector("[title^='Drag to move']");
    const startX = title.getBoundingClientRect().left + 40;
    const startY = title.getBoundingClientRect().top + 5;
    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, clientX: startX, clientY: startY }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: startX - 30, clientY: startY }));
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: startX - 30, clientY: startY }));
    await wait(10);
    const movedLeft = pickerOf().getBoundingClientRect().left;
    panel.closeColorPicker();
    panel.elem.querySelector("[aria-label='Open the color picker of Fill']").click();
    await wait(10);
    const openedLeft = pickerOf().getBoundingClientRect().left;
    check("PropertyPanel: the title of the color picker moves it, and it opens there again", Math.abs(movedLeft - firstLeft + 30) <= 1 && openedLeft === movedLeft,
        "first " + firstLeft + ", moved " + movedLeft + ", opened " + openedLeft);
    panel.remove();
});

// WHY the moves go to window: the dragged color moves in the grid, and the browser stops sending it the pointer
test("PropertyPanel: Copy to in the menu of a color opens its groups at the side, a click copies", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    ui.swatchOf("#111111").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    await wait(10);
    const rowCopy = ui.picker.querySelector("[aria-label='Copy #111111 to a color group']");
    const hasListBefore = !!ui.picker.querySelector("[aria-label='Copy #111111 to Other']");
    if (rowCopy) rowCopy.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(10);
    const rowOther = ui.picker.querySelector("[aria-label='Copy #111111 to Other']");
    const isAtTheSide = !!rowOther && rowOther.getBoundingClientRect().left >= rowCopy.getBoundingClientRect().right - 10;
    if (rowOther) rowOther.click();
    await wait(10);
    const added = changes.find(function (change) { return change.kind === "addColor"; });
    check("PropertyPanel: Copy to in the menu of a color opens its groups at the side, a click copies", !!rowCopy && !hasListBefore && isAtTheSide && !!added && added.key === "other" && added.value === "#111111", "Copy to: " + !!rowCopy + ", list before hover: " + hasListBefore + ", at the side: " + isAtTheSide + ", added: " + (added && added.key));
    ui.panel.remove();
});

test("PropertyPanel: a color dragged in its editable group sends the new order", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    const square = ui.swatchOf("#333333");
    const first = ui.swatchOf("#111111").getBoundingClientRect();
    const start = square.getBoundingClientRect();
    const pointer = function (target, type, x, y) {
        target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, clientX: x, clientY: y }));
    };
    pointer(square, "pointerdown", start.left + 5, start.top + 5);
    pointer(window, "pointermove", start.left - 20, start.top + 5);
    pointer(window, "pointermove", first.left + 2, first.top + 5);
    pointer(window, "pointerup", first.left + 2, first.top + 5);
    await wait(10);
    const order = changes.find(function (change) { return change.kind === "orderColors"; });
    const text = (order) ? order.value.join(" ") : "none";
    check("PropertyPanel: a color dragged in its editable group sends the new order", text === "#333333 #111111 #222222", "order: " + text);
    ui.panel.remove();
});

// The tick of the group on: its colors go under the field (the picker stays open)
const showGroupUnderField = async function (ui) {
    const tick = ui.picker.querySelector("[aria-label^='Show the colors of the selected group']");
    if (tick.getAttribute("aria-checked") !== "true") tick.click();
    await wait(10);
};

test("PropertyPanel: the colors under a field are two rows, +N shows the others", async function () {
    const many = [];
    for (let i = 0; i < 40; i++) many.push("#" + (100000 + i * 1111));
    const ui = await openColorPanel([], many);
    await showGroupUnderField(ui);
    const shown = function () { return ui.panel.elem.querySelectorAll("[aria-label$='(Mine)']").length; };
    const before = shown();
    const more = ui.panel.elem.querySelector("[aria-label^='Show '][aria-label$=' more colors']");
    if (more) more.click();
    await wait(10);
    const after = shown();
    const rows = new Set(Array.from(ui.panel.elem.querySelectorAll("[aria-label$='(Mine)']")).slice(0, before).map(function (el) { return Math.round(el.getBoundingClientRect().top); }));
    check("PropertyPanel: the colors under a field are two rows, +N shows the others", !!more && before < 40 && rows.size <= 2 && after === 40, "before: " + before + " in " + rows.size + " rows, +N: " + !!more + ", after: " + after);
    ui.panel.remove();
});

test("PropertyPanel: Delete in the menu of a color under a field removes it from its group", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    await showGroupUnderField(ui);
    const square = ui.panel.elem.querySelector("[aria-label='#333333 (Mine)']");
    square.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    await wait(10);
    // (a ContextMenu: comp/context-menu.js is loaded in this test)
    const row = Array.from(document.querySelectorAll("[role=menuitem]")).find(function (el) { return el.textContent === "Delete" && el.offsetParent !== null; });
    if (row) row.click();
    await wait(10);
    const removed = changes.find(function (change) { return change.kind === "removeColor"; });
    const isGone = !ui.panel.elem.querySelector("[aria-label='#333333 (Mine)']");
    check("PropertyPanel: Delete in the menu of a color under a field removes it from its group", !!row && !!removed && removed.value === "#333333" && isGone, "menu row: " + !!row + ", change: " + !!removed + ", gone: " + isGone);
    ui.panel.remove();
});

test("PropertyPanel: Copy to › in the ContextMenu of a color under a field copies it to the group of its submenu", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    await showGroupUnderField(ui);
    const square = ui.panel.elem.querySelector("[aria-label='#333333 (Mine)']");
    const rect = square.getBoundingClientRect();
    square.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: rect.left, clientY: rect.bottom }));
    await wait(30);
    const visibleRow = function (text) {
        return Array.from(document.querySelectorAll("[role=menuitem]")).find(function (el) { return el.textContent === text && el.offsetParent !== null; });
    };
    const rowCopy = visibleRow("Copy to");
    if (rowCopy) rowCopy.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(30);
    const rowOther = visibleRow("Other");
    if (rowOther) rowOther.click();
    await wait(10);
    const added = changes.find(function (change) { return change.kind === "addColor"; });
    check("PropertyPanel: Copy to › in the ContextMenu of a color under a field copies it to the group of its submenu", !!rowCopy && !!rowOther && !!added && added.key === "other" && added.value === "#333333", "Copy to: " + !!rowCopy + ", Other: " + !!rowOther + ", added: " + (added && added.key));
    ui.panel.remove();
});

test("PropertyPanel: the tick of a group shows its colors under the color field, a click gives one", async function () {
    const changes = [];
    const ui = await openColorPanel(changes);
    const tick = ui.picker.querySelector("[role=checkbox]");
    const wasOn = (tick.getAttribute("aria-checked") === "true");
    if (!wasOn) tick.click();
    await wait(10);
    const quick = ui.panel.elem.querySelector("[aria-label='#333333 (Mine)']");
    if (quick) quick.click();
    await wait(10);
    check("PropertyPanel: the tick of a group shows its colors under the color field, a click gives one", !!quick && ui.panel.getValue("fill") === "#333333", "a color under the field: " + !!quick + ", value: " + ui.panel.getValue("fill"));
    ui.panel.remove();
});

// *** NUMERIC KEYBOARD (comp/numeric-keyboard.js)

test("NumericKeyboard: a held Enter calls onEnter once", async function () {
    let count = 0;
    const keyboard = NumericKeyboard({ onEnter: function () { count++; } });
    key(keyboard.elem, "keydown", "Enter");
    key(keyboard.elem, "keydown", "Enter", { repeat: true });
    check("NumericKeyboard: a held Enter calls onEnter once", count === 1, "onEnter: " + count);
    keyboard.remove();
});

// *** TEXT FIELD (comp/text-field.js)

test("EmailField: a fast typing that ends valid leaves no warning ball", async function () {
    const email = EmailField({ titleText: "Email", animatedWarningBall: 1 });
    const inputElement = email.input.inputElement;
    // WHY: the letters come faster than the delay of withMotion() (a paste or a fast typist)
    for (const letter of "a@b.co") {
        inputElement.value += letter;
        inputElement.dispatchEvent(new Event("input", { bubbles: true }));
    }
    await wait(300);
    const opacity = Number(email.warningBall.opacity);
    check("EmailField: a fast typing that ends valid leaves no warning ball", email.status === 0 && opacity === 0, "status: " + email.status + ", opacity: " + opacity);
    email.remove();
});

// *** PHONE FIELD (comp/phone-field.js)

test("PhoneField: a pasted number keeps all its digits", async function () {
    const phone = PhoneField({ titleText: "Phone" });
    const el = phone.input.inputElement;
    const results = [];
    ["555 123 45 67", "(555) 123-4567", "0555 123 45 67", "+90 555 123 45 67"].forEach(function (text) {
        el.focus();
        const transfer = new DataTransfer();
        transfer.setData("text", text);
        el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }));
        results.push(el.value);
        phone.setValue("");
    });
    const isAllRight = results.every(function (value) { return value === "+90 (555) 123-4567"; });
    check("PhoneField: a pasted number keeps all its digits", isAllRight, results.join(" | "));
    phone.remove();
});

// *** URL FIELD (comp/url-field.js)

test("UrlField: a path with an 's' is valid, an empty required field is not sent", async function () {
    const url = UrlField({ titleText: "Site", required: 1 });
    const results = [];
    ["example.com/news", "example.com/a b"].forEach(function (text) {
        url.input.text = text;
        results.push(url.isValid());
    });
    url.input.text = "";
    check("UrlField: a path with an 's' is valid and a path with a space is not", results[0] === 1 && results[1] === 0, results.join(", "));
    check("UrlField: an empty field gives an empty value (not the protocol alone)", url.getValue() === "", "\"" + url.getValue() + "\"");
    url.remove();
});

// *** TEXT AREA FIELD (comp/text-area-field.js)

test("TextAreaField: setPlaceholder and setMaxLength change its textarea", async function () {
    const area = TextAreaField({ titleText: "Note" });
    let error = "";
    try {
        area.setPlaceholder("Write a note");
        area.setMaxLength(500);
    } catch (e) {
        error = e.message; // WHY: they wrote to box.input, which a TextAreaField does not have
    }
    const el = area.textareaElem;
    const isChanged = el.placeholder === "Write a note" && el.maxLength === 500 && area.maxLength === 500;
    check("TextAreaField: setPlaceholder and setMaxLength change its textarea", !error && isChanged, error || ("placeholder: " + el.placeholder + ", maxLength: " + el.maxLength));
    area.remove();
});

// *** SLIDER FIELD (comp/slider-field.js)

test("SliderField: a click at 80 % gives the same value in a scaled box (a transform)", async function () {
    const clickAt = function (slider, ratio) {
        const r = slider.elem.getBoundingClientRect();
        const x = r.left + r.width * ratio;
        const y = r.top + r.height / 2;
        slider.elem.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 7, button: 0, clientX: x, clientY: y, bubbles: true }));
        slider.elem.dispatchEvent(new PointerEvent("pointerup", { pointerId: 7, button: 0, clientX: x, clientY: y, bubbles: true }));
        return slider.value;
    };
    const plain = SliderField({ left: 0, top: 0, width: 400, minValue: 0, maxValue: 10, value: 0, editable: 0 });
    const holder = Box(0, 0, 800, 100, { color: "transparent" });
    holder.css = { transform: "scale(0.5)", transformOrigin: "0 0" };
    const scaled = createIn(holder, function () {
        return SliderField({ left: 0, top: 0, width: 400, minValue: 0, maxValue: 10, value: 0, editable: 0 });
    });
    const plainValue = clickAt(plain, 0.8);
    const scaledValue = clickAt(scaled, 0.8);
    check("SliderField: a click at 80 % gives the same value in a scaled box (a transform)", plainValue === scaledValue && plainValue > 5, "plain: " + plainValue + ", scaled: " + scaledValue);
    plain.remove();
    holder.remove();
});

// *** SLIDER (comp/slider.js)

test("Slider: setValue(v) gives v back", async function () {
    const slider = Slider({ width: 250 });
    await wait(50);
    const wrong = [];
    for (let v = 0; v <= 100; v++) {
        slider.setValue(v);
        if (slider.getValue() !== v) wrong.push(v + "->" + slider.getValue());
    }
    check("Slider: setValue(v) gives v back", wrong.length === 0, wrong.slice(0, 6).join(", "));
    slider.remove();
});

test("Slider: a remove() during a drag takes the document events with it", async function () {
    let moveCount = 0;
    let isStarted = false;
    const slider = Slider({ width: 250, onChangeStart: function () { isStarted = true; }, onChange: function () { moveCount++; } });
    await wait(50);
    // WHY the thumb: a press on the track moves the thumb there first (one more onChange)
    getSliderThumb(slider).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 10 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 60 }));
    const movesBeforeRemove = moveCount;
    slider.remove();
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 120 }));
    check("Slider: a remove() during a drag takes the document events with it", isStarted && movesBeforeRemove === 1 && moveCount === 1, "started: " + isStarted + ", moves: " + movesBeforeRemove + " / " + moveCount);
});

// WHY: the thumb is private: it is the only part inside a Slider that takes the mouse (the cursor of the
//      slider is a pointer everywhere since a press on the track moves the thumb)
const getSliderThumb = function (slider) {
    return Array.from(slider.elem.querySelectorAll("*")).find(function (element) { return getComputedStyle(element).pointerEvents === "auto"; });
};

// WHY: an Event with touches, not a TouchEvent: desktop Chrome without a touch screen has no TouchEvent
const makeSliderTouch = function (type, clientX, clientY = 0) {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "touches", { value: [{ clientX: clientX, clientY: clientY }] });
    return event;
};

// The screen x of a value of a Slider: the middle of its thumb there (width 250, thumb 20: 230 px of travel)
const getSliderPointOf = function (slider, ratio) {
    const rect = slider.elem.getBoundingClientRect();
    const thumbWidth = getSliderThumb(slider).getBoundingClientRect().width;
    return rect.left + thumbWidth / 2 + ratio * (rect.width - thumbWidth);
};

test("Slider: a tap of a finger is one drag (the browser does not send its mousedown and mouseup too)", async function () {
    const slider = Slider({ width: 250 });
    await wait(50);
    const touchStart = makeSliderTouch("touchstart", 10);
    getSliderThumb(slider).dispatchEvent(touchStart);
    document.dispatchEvent(makeSliderTouch("touchend", 10));
    slider.remove();
    // WHY: after a touchstart that is not cancelled the browser sends mousedown and mouseup: a second drag
    check("Slider: a tap of a finger is one drag (the browser does not send its mousedown and mouseup too)", touchStart.defaultPrevented, "touchstart cancelled: " + touchStart.defaultPrevented);
});

test("Slider: a touch the system takes (touchcancel) ends the drag", async function () {
    let moveCount = 0;
    let endCount = 0;
    const slider = Slider({ width: 250, onChange: function () { moveCount++; }, onChangeEnd: function () { endCount++; } });
    await wait(50);
    getSliderThumb(slider).dispatchEvent(makeSliderTouch("touchstart", 10));
    document.dispatchEvent(makeSliderTouch("touchcancel", 10));
    const otherTouch = makeSliderTouch("touchmove", 120); // the next finger, somewhere else on the page
    document.dispatchEvent(otherTouch);
    const value = slider.getValue();
    slider.remove();
    check("Slider: a touch the system takes (touchcancel) ends the drag", endCount === 1 && moveCount === 0 && value === 0 && !otherTouch.defaultPrevented, "ends: " + endCount + ", moves: " + moveCount + ", value: " + value + ", the page could not scroll: " + otherTouch.defaultPrevented);
});

test("Slider: the right mouse button does not start a drag", async function () {
    let startCount = 0;
    const slider = Slider({ width: 250, onChangeStart: function () { startCount++; } });
    await wait(50);
    getSliderThumb(slider).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 2, clientX: 10 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 120 }));
    const value = slider.getValue();
    document.dispatchEvent(new MouseEvent("mouseup", { button: 2 }));
    slider.remove();
    check("Slider: the right mouse button does not start a drag", startCount === 0 && value === 0, "drag starts: " + startCount + ", value: " + value);
});

test("Slider: on a zoomed page (page.fit) the thumb goes as far as the mouse", async function () {
    const ZOOM = 2;
    const MOUSE_MOVE = 100; // screen px
    page.zoom = ZOOM;
    const slider = Slider({ width: 250 });
    await wait(50);
    const thumb = getSliderThumb(slider);
    const startX = thumb.getBoundingClientRect().left;
    thumb.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: startX + 5 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: startX + 5 + MOUSE_MOVE }));
    document.dispatchEvent(new MouseEvent("mouseup", {}));
    const thumbMove = thumb.getBoundingClientRect().left - startX;
    page.zoom = 1;
    slider.remove();
    check("Slider: on a zoomed page (page.fit) the thumb goes as far as the mouse", Math.abs(thumbMove - MOUSE_MOVE) < 2, "the mouse: " + MOUSE_MOVE + " px, the thumb: " + thumbMove + " px");
});

test("Slider: the round package gives a knob; the page keeps its params and the packages do not change", async function () {
    const round = Slider({ styleName: "round", style: { thumb: { width: 30, height: 30 } } });
    const tomato = Slider({ styleName: "round", trackColor: "tomato" });
    const classic = Slider({});
    const knob = getSliderThumb(round).firstElementChild.getBoundingClientRect();
    const line = getSliderThumb(classic).firstElementChild.getBoundingClientRect();
    const row = [knob.width, knob.height, line.width, line.height, round.trackHeight, tomato.trackColor, classic.trackHeight, Slider.styles.round.style.thumb.width, Slider.styles.classic.thumb.width];
    round.remove();
    tomato.remove();
    classic.remove();
    check("Slider: the round package gives a knob; the page keeps its params and the packages do not change", row.join(" ") === "30 30 4 44 6 tomato 16 24 4", row.join(" "));
});

test("Slider: minValue, maxValue and step: the value stays in the range and on a step (setValue, a drag, the setters)", async function () {
    const slider = Slider({ width: 250, minValue: 12, maxValue: 24, step: 0.5, value: 16 });
    await wait(50);
    const row = [slider.getValue()];
    slider.setValue(30);
    row.push(slider.getValue());
    slider.setValue(13.3);
    row.push(slider.getValue());
    slider.setValue("20");
    row.push(slider.getValue());
    getSliderThumb(slider).dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 10 }));
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 600 }));
    document.dispatchEvent(new MouseEvent("mouseup", {}));
    row.push(slider.getValue());
    slider.setMaxValue(20);
    row.push(slider.getValue());
    slider.setMinValue(0);
    slider.setStep(5);
    row.push(slider.getValue());
    const tenths = Slider({ minValue: 0, maxValue: 1, step: 0.1, value: 0.3 });
    row.push(tenths.getValue());
    slider.remove();
    tenths.remove();
    check("Slider: minValue, maxValue and step: the value stays in the range and on a step (setValue, a drag, the setters)", row.join(" ") === "16 24 13.5 20 24 20 20 0.3", row.join(" "));
});

test("Slider: roundDark gives the dark colors and never changes round", async function () {
    const dark = Slider({ styleName: "roundDark" });
    const round = Slider({ styleName: "round" });
    const row = [dark.trackBackgroundColor, dark.style.value.color, round.trackBackgroundColor, round.style.value.color, Slider.styles.round.style.value.color];
    dark.remove();
    round.remove();
    check("Slider: roundDark gives the dark colors and never changes round", row.join(" | ") === White(0.16) + " | #F2F2F2 | rgba(0, 0, 0, 0.12) | #232323 | #232323", row.join(" | "));
});

test("Slider: a click on the track moves the thumb there and drags from there; the thumb stands on its step", async function () {
    const calls = [];
    const slider = Slider({
        width: 250,
        maxValue: 10,
        onChangeStart: function () { calls.push("start"); },
        onChange: function (self) { calls.push(self.value); },
        onChangeEnd: function () { calls.push("end"); },
    });
    await wait(50);
    slider.elem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, clientX: getSliderPointOf(slider, 0.7) }));
    const afterClick = slider.getValue();
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: getSliderPointOf(slider, 0.84) }));
    document.dispatchEvent(new MouseEvent("mouseup", {}));
    const finalValue = slider.getValue();
    const thumbMiddle = getSliderThumb(slider).getBoundingClientRect().left + getSliderThumb(slider).getBoundingClientRect().width / 2;
    const stepMiddle = getSliderPointOf(slider, finalValue / 10);
    slider.remove();
    check("Slider: a click on the track moves the thumb there and drags from there; the thumb stands on its step", afterClick === 7 && finalValue === 8 && Math.abs(thumbMiddle - stepMiddle) < 0.5 && calls.join(" ") === "start 7 8 end", "click: " + afterClick + ", drag: " + finalValue + ", thumb off its step: " + (thumbMiddle - stepMiddle).toFixed(2) + " px, calls: " + calls.join(" "));
});

test("Slider: a finger on the track: up or down scrolls the page, to the side drags from there, a tap moves the thumb there", async function () {
    const calls = [];
    const slider = Slider({
        width: 250,
        onChangeStart: function () { calls.push("start"); },
        onChange: function (self) { calls.push(self.value); },
        onChangeEnd: function () { calls.push("end"); },
    });
    await wait(50);
    const middle = getSliderPointOf(slider, 0.5);
    slider.elem.dispatchEvent(makeSliderTouch("touchstart", middle, 100));
    const scrollMove = makeSliderTouch("touchmove", middle + 2, 130);
    document.dispatchEvent(scrollMove);
    document.dispatchEvent(makeSliderTouch("touchend", middle + 2, 130));
    const afterScroll = [slider.getValue(), calls.length, scrollMove.defaultPrevented].join(" ");
    slider.elem.dispatchEvent(makeSliderTouch("touchstart", middle, 100));
    const sideMove = makeSliderTouch("touchmove", getSliderPointOf(slider, 0.6), 101);
    document.dispatchEvent(sideMove);
    document.dispatchEvent(makeSliderTouch("touchend", 0, 0));
    const afterSide = [slider.getValue(), sideMove.defaultPrevented].join(" ");
    slider.elem.dispatchEvent(makeSliderTouch("touchstart", getSliderPointOf(slider, 0.25), 100));
    const tapEnd = makeSliderTouch("touchend", 0, 0);
    document.dispatchEvent(tapEnd);
    const afterTap = [slider.getValue(), tapEnd.defaultPrevented].join(" ");
    slider.remove();
    const row = [afterScroll, afterSide, afterTap, calls.join(" ")].join(" | ");
    check("Slider: a finger on the track: up or down scrolls the page, to the side drags from there, a tap moves the thumb there", row === "0 0 false | 60 true | 25 true | start 60 end start 25 end", row);
});

test("Slider: the keys change the value by its step (a key is a short drag); role slider, aria-valuenow; the ring only for the keyboard", async function () {
    let endCount = 0;
    const slider = Slider({ width: 250, maxValue: 10, step: 0.5, value: 5, onChangeEnd: function () { endCount++; } });
    await wait(50);
    const values = [];
    ["ArrowRight", "ArrowLeft", "ArrowLeft", "PageUp", "End", "ArrowUp", "Home", "ArrowDown"].forEach(function (keyName) {
        key(slider.elem, "keydown", keyName);
        values.push(slider.getValue());
    });
    const endsOfKeys = endCount;
    const line = getSliderThumb(slider).firstElementChild;
    const ringAfterKeys = line.style.outlineStyle;
    slider.elem.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0, clientX: getSliderPointOf(slider, 0.5) }));
    document.dispatchEvent(new MouseEvent("mouseup", {}));
    const ringAfterMouse = line.style.outlineStyle;
    const aria = [slider.elem.getAttribute("role"), slider.elem.tabIndex, slider.elem.getAttribute("aria-valuenow"), slider.elem.getAttribute("aria-valuemax")].join(" ");
    slider.remove();
    const row = [values.join(" "), endsOfKeys, ringAfterKeys, ringAfterMouse || "none", aria].join(" | ");
    check("Slider: the keys change the value by its step (a key is a short drag); role slider, aria-valuenow; the ring only for the keyboard", row === "5.5 5 4.5 9.5 10 10 0 0 | 6 | solid | none | slider 0 5 10", row);
});

// *** SEARCH INPUT (comp/search-input.js)

test("SearchInput: a pasted text is searched", async function () {
    const texts = [];
    const search = SearchInput({ onChange: function (self) { texts.push(self.getSearchText()); } });
    const el = search.txtSearch.inputElement;
    el.focus();
    document.execCommand("insertText", false, "abc"); // the same input event as a paste or an autofill
    check("SearchInput: a pasted text is searched", texts[texts.length - 1] === "abc", "onChange: " + texts.join(", "));
    search.remove();
});

test("SearchInput: a cut text fades out where it goes on; while typing only the far side of a caret at the end", async function () {
    const search = SearchInput({ width: 220, height: 40 });
    const input = search.txtSearch.inputElement;
    const getMask = function () { return search.txtSearch.elem.style.maskImage || search.txtSearch.elem.style.webkitMaskImage || ""; };
    const isRightFade = function (mask) { return mask.includes("transparent 100%") && !mask.includes("transparent 0px"); };
    const isLeftFade = function (mask) { return mask.includes("transparent 0px") && !mask.includes("transparent 100%"); };
    search.setValue("a text that is much longer than the box of the search", 1);
    await wait(50);
    const restMask = getMask();
    // (the events, not focus(): the window of the test may not be in focus)
    input.dispatchEvent(new FocusEvent("focus"));
    input.setSelectionRange(input.value.length, input.value.length);
    input.scrollLeft = input.scrollWidth; // (the browser shows the caret at the end)
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "End" }));
    const typingMask = getMask();
    input.setSelectionRange(2, 2);
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Home" }));
    const caretInTextMask = getMask();
    input.dispatchEvent(new FocusEvent("blur"));
    search.setValue("short", 1);
    const shortMask = getMask();
    check("SearchInput: a cut text fades out where it goes on; while typing only the far side of a caret at the end",
        isRightFade(restMask) && isLeftFade(typingMask) && caretInTextMask === "" && shortMask === "",
        "rest: " + restMask + " | typing: " + typingMask + " | caret in the text: " + caretInTextMask + " | short: " + shortMask);
    search.remove();
});

test("SearchInput: clearOnEscape: Escape clears the text and uses the key; an empty field leaves it to the page; off by default", async function () {
    const submitted = [];
    const search = SearchInput({ clearOnEscape: 1, onEnter: function (self) { submitted.push(self.getSearchText()); } });
    const plain = SearchInput({});
    const table = SmartTable({ itemLineCount: 2, style: { width: 500, height: "auto" } });
    // Returns 1 when the key was used (a Dialog around the field would not close)
    const pressEscape = function (input) {
        const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        input.dispatchEvent(event);
        return event.defaultPrevented ? 1 : 0;
    };
    search.setValue("abc", 1);
    const usedWithText = pressEscape(search.txtSearch.inputElement);
    const isCleared = (search.getValue() === "" && submitted[submitted.length - 1] === "");
    const usedWhenEmpty = pressEscape(search.txtSearch.inputElement);
    plain.setValue("abc", 1);
    const usedByPlain = pressEscape(plain.txtSearch.inputElement);
    table.searchInput.setValue("abc", 1);
    table.searchKeyword = "abc";
    pressEscape(table.searchInput.txtSearch.inputElement);
    const isTableCleared = (table.searchKeyword === "" && table.searchInput.getValue() === "");
    const dataTable = DataTable({ width: 500, height: 300, showSearch: 1, columns: [{ key: "name", title: "Name" }], rows: [["Paris"], ["London"], ["Berlin"]] });
    dataTable.searchInput.setValue("paris", 1);
    dataTable.search("paris");
    const foundCount = dataTable.shownRows.length;
    pressEscape(dataTable.searchInput.txtSearch.inputElement);
    const isDataTableCleared = (foundCount === 1 && dataTable.shownRows.length === 3 && dataTable.searchInput.getValue() === "");
    check("SearchInput: clearOnEscape: Escape clears the text and uses the key; an empty field leaves it to the page; off by default",
        usedWithText === 1 && isCleared && usedWhenEmpty === 0 && usedByPlain === 0 && plain.getValue() === "abc" && isTableCleared && isDataTableCleared,
        "used with a text: " + usedWithText + ", cleared: " + isCleared + ", used when empty: " + usedWhenEmpty + ", plain: " + usedByPlain + " / " + plain.getValue() + ", SmartTable: " + isTableCleared + ", DataTable: " + isDataTableCleared + " (" + foundCount + " found)");
    search.remove();
    plain.remove();
    table.remove();
    dataTable.remove();
});
test("SearchInput: value at create shows its clear icon; typing changes value; setValue() calls onChange, setValue(value, 1) does not", async function () {
    const changes = [];
    const search = SearchInput({ value: "boat", onChange: function (self) { changes.push(self.value); } });
    await wait(80);
    const input = search.txtSearch.inputElement;
    const atCreate = [search.value, input.value, search.getValue(), changes.length, search.imgClearIcon.opacity > 0].join("|");
    input.value = "boats";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    search.setValue("ship");
    search.setValue("ship"); // the same text: no onChange
    search.setValue("car", 1);
    check("SearchInput: value at create shows its clear icon; typing changes value; setValue() calls onChange, setValue(value, 1) does not",
        atCreate === "boat|boat|boat|0|true" && changes.join(",") === "boats,ship" && search.value === "car" && input.value === "car",
        "at create: " + atCreate + ", changes: " + changes.join(",") + ", value: " + search.value);
    search.remove();
});

test("SearchInput: right / bottom place it (the default left / top does not win)", async function () {
    const SPACE = 20;
    const box = Box(0, 0, 500, 300, { color: "transparent" });
    const fields = createIn(box, function () {
        return {
            placed: SearchInput({ width: 200, height: 40, right: SPACE, bottom: SPACE }),
            plain: SearchInput({ width: 200, height: 40 }),
        };
    });
    const boxRect = box.elem.getBoundingClientRect();
    const placedRect = fields.placed.elem.getBoundingClientRect();
    const plainRect = fields.plain.elem.getBoundingClientRect();
    const rightSpace = Math.round(boxRect.right - placedRect.right);
    const bottomSpace = Math.round(boxRect.bottom - placedRect.bottom);
    const isPlainAtLeftTop = Math.round(plainRect.left - boxRect.left) === 0 && Math.round(plainRect.top - boxRect.top) === 0;
    check("SearchInput: right / bottom place it (the default left / top does not win)", rightSpace === SPACE && bottomSpace === SPACE && isPlainAtLeftTop, "right: " + rightSpace + ", bottom: " + bottomSpace + ", without a place at the left top: " + isPlainAtLeftTop);
    box.remove();
});

test("SearchInput ozden: the clear icon in the middle of the face of the box (its 3 px bottom line), the text 2 px over it; original as before", async function () {
    // The middles of the clear icon and of the text box, from the top of the field
    const middlesOf = function (params) {
        const field = SearchInput(Object.assign({ left: 20, top: 100, width: 300 }, params));
        const fieldTop = field.elem.getBoundingClientRect().top;
        const clear = field.imgClearIcon.elem.getBoundingClientRect();
        const text = field.txtSearch.inputElement.getBoundingClientRect();
        field.remove();
        return { clear: clear.top + clear.height / 2 - fieldTop, text: text.top + text.height / 2 - fieldTop };
    };
    const isAt = (value, expected) => Math.abs(value - expected) < 0.6;
    const ozden = middlesOf({ styleName: "ozden" }); // 44 px: a 1 px edge and a 3 px bottom line: the face is 1-41 (middle 21)
    const original = middlesOf({ styleName: "original" }); // 50 px: no edge, a 2 px bottom line: the middle of the whole box, as before
    const isOk = isAt(ozden.clear, 21) && isAt(ozden.text, 20) && isAt(original.clear, 25) && isAt(original.text, 25);
    check("SearchInput ozden: the clear icon in the middle of the face of the box (its 3 px bottom line), the text 2 px over it; original as before", isOk, "ozden: " + JSON.stringify(ozden) + ", original: " + JSON.stringify(original));
});

// *** STEPPER (comp/stepper.js)

test("Stepper: style.button.border draws a line around the buttons (none by default)", async function () {
    const lined = Stepper({ style: { button: { border: 1, borderColor: "rgb(255, 0, 0)" } } });
    const plain = Stepper();
    const old = Stepper({ styleName: "ozden" });
    const linedLine = getComputedStyle(lined.btnPlus.elem);
    const plainLine = getComputedStyle(plain.btnPlus.elem);
    const oldLine = getComputedStyle(old.btnPlus.elem);
    const isLined = linedLine.borderTopWidth === "1px" && linedLine.borderTopColor === "rgb(255, 0, 0)";
    const isPlain = plainLine.borderTopWidth === "0px";
    const isOld = oldLine.borderTopWidth === "1px" && old.btnPlus.elem.offsetHeight === 42 && old.width === 150;
    check("Stepper: style.button.border draws a line around the buttons (none by default)", isLined && isPlain && isOld, "given: " + linedLine.borderTopWidth + " " + linedLine.borderTopColor + ", default: " + plainLine.borderTopWidth + ", ozden: " + oldLine.borderTopWidth + " / " + old.btnPlus.elem.offsetHeight + " px");
    lined.remove();
    plain.remove();
    old.remove();
});

// *** RANGE SLIDER (comp/range-slider.js)

// A slider where one value is 2 px: 224 px wide, a knob of 24 px, 0 - 100.
const makeRangeSlider = function (params) {
    return RangeSlider(Object.assign({ left: 40, top: 40, width: 224, lowValue: 20, highValue: 80 }, params));
};

const rangeXOf = function (slider, value) {
    return slider.elem.getBoundingClientRect().left + 12 + (value - slider.minValue) * 200 / (slider.maxValue - slider.minValue);
};

const rangePress = function (slider, type, value, pointerType, target) {
    const element = target || slider.elem;
    pointer(element, type, rangeXOf(slider, value), slider.elem.getBoundingClientRect().top + 22, pointerType || "mouse");
};

test("RangeSlider: the values stay on a step, inside the range and apart; setValues() and getValues()", async function () {
    const noValues = RangeSlider({ width: 224 });
    const atStart = noValues.getValues().join();
    noValues.remove();
    const slider = makeRangeSlider({ step: 5, minGap: 10 });
    await wait(20);
    const values = function () { return slider.getValues().join(); };
    const first = values();
    slider.setValues(23, 77);
    const onStep = values();
    slider.setValues(-50, 500);
    const inRange = values();
    slider.setValues(90, 10);
    const swapped = values();
    slider.setValues(50, 52);
    const apart = values();
    slider.setValues(100, 100);
    const atEnd = values();
    slider.setValues(0, 0);
    const atStartEnd = values();
    slider.setValues("20", "60");
    const texts = values();
    slider.setValues(null, 70);
    const onlyHigh = values();
    slider.setValues("not a number", 90);
    const wrong = values();
    slider.setStep(0.5);
    slider.setValues(10.3, 20.2);
    const half = values();
    slider.setMinValue(15);
    const newMin = values();
    slider.setMaxValue(18);
    const newMax = values();
    slider.setMinGap(0);
    slider.setValues(16, 16);
    const noGap = values();
    check("RangeSlider: the values stay on a step, inside the range and apart; setValues() and getValues()",
        atStart === "0,100" && first === "20,80" && onStep === "25,75" && inRange === "0,100" && swapped === "10,90" && apart === "50,60" && atEnd === "90,100" && atStartEnd === "0,10" &&
        texts === "20,60" && onlyHigh === "20,70" && wrong === "0,90" && half === "10.5,20.5" && newMin === "15,25" && newMax === "15,18" && noGap === "16,16",
        [atStart, first, onStep, inRange, swapped, apart, atEnd, atStartEnd, texts, onlyHigh, wrong, half, newMin, newMax, noGap].join(" | "));
    slider.remove();
});

test("RangeSlider: the knobs and the part between them stand at their values, also when the width changes", async function () {
    const slider = makeRangeSlider({ width: "100%" });
    const holder = Box({ left: 0, top: 0, width: 224, height: 44 });
    holder.elem.appendChild(slider.elem);
    slider.css.left = "0";
    slider.css.top = "0";
    await wait(20);
    const placesOf = function () {
        const around = slider.elem.getBoundingClientRect();
        const center = function (part) {
            const rect = part.elem.getBoundingClientRect();
            return Math.round(rect.left + rect.width / 2 - around.left);
        };
        const fill = slider.fill.elem.getBoundingClientRect();
        return [center(slider.lowKnob), center(slider.highKnob), Math.round(fill.left - around.left), Math.round(fill.right - around.left)].join();
    };
    const small = placesOf();
    holder.width = 424;
    await wait(20);
    const big = placesOf();
    slider.setValues(0, 100);
    const ends = placesOf();
    const barWidth = Math.round(slider.track.elem.getBoundingClientRect().width);
    check("RangeSlider: the knobs and the part between them stand at their values, also when the width changes",
        small === "52,172,52,172" && big === "92,332,92,332" && ends === "12,412,12,412" && barWidth === 424,
        [small, big, ends, barWidth].join(" | "));
    holder.remove();
});

test("RangeSlider: a drag moves a knob with no jump, stops at the other knob and at minGap; a press on the bar brings the nearest knob", async function () {
    const moves = [];
    let ends = 0;
    const slider = makeRangeSlider({ minGap: 10, onChange: function (self) { moves.push(self.getValues().join()); }, onChangeEnd: function () { ends++; } });
    await wait(20);
    const low = slider.lowKnob.elem;
    // Pressed 4 px beside its middle: it does not jump.
    pointer(low, "pointerdown", rangeXOf(slider, 20) + 4, 60, "mouse");
    const noJump = moves.length;
    pointer(low, "pointermove", rangeXOf(slider, 30) + 4, 60, "mouse");
    const moved = slider.lowValue;
    pointer(low, "pointermove", rangeXOf(slider, 95), 60, "mouse");
    const stoppedByGap = slider.lowValue;
    pointer(low, "pointerup", rangeXOf(slider, 95), 60, "mouse");
    const afterDrag = [ends, moves.length].join();
    moves.length = 0;
    ends = 0;
    rangePress(slider, "pointerdown", 10);
    const nearestLow = slider.lowValue;
    rangePress(slider, "pointerup", 10);
    rangePress(slider, "pointerdown", 95);
    const nearestHigh = slider.highValue;
    rangePress(slider, "pointermove", 85);
    const dragsOn = slider.highValue;
    rangePress(slider, "pointerup", 85);
    const barPresses = [moves.join("/"), ends].join(" ");
    ends = 0;
    moves.length = 0;
    pointer(slider.elem, "pointermove", rangeXOf(slider, 50), 60, "mouse");
    const noPress = moves.length;
    rangePress(slider, "pointerdown", 85, "mouse", slider.highKnob.elem);
    rangePress(slider, "pointerup", 85, "mouse", slider.highKnob.elem);
    const noMoveNoEnd = ends;
    slider.elem.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: rangeXOf(slider, 50), pointerId: 7, button: 2 }));
    const otherButton = slider.getValues().join();
    slider.setEnabled(0);
    rangePress(slider, "pointerdown", 50);
    rangePress(slider, "pointerup", 50);
    const notEnabled = slider.getValues().join();
    check("RangeSlider: a drag moves a knob with no jump, stops at the other knob and at minGap; a press on the bar brings the nearest knob",
        noJump === 0 && moved === 30 && stoppedByGap === 70 && afterDrag === "1,2" && nearestLow === 10 && nearestHigh === 95 && dragsOn === 85 && barPresses === "10,80/10,95/10,85 2" &&
        noPress === 0 && noMoveNoEnd === 0 && otherButton === "10,85" && notEnabled === "10,85",
        [noJump, moved, stoppedByGap, afterDrag, nearestLow, nearestHigh, dragsOn, barPresses, noPress, noMoveNoEnd, otherButton, notEnabled].join(" | "));
    slider.remove();
});

test("RangeSlider: from two knobs at one place the direction of the first move chooses; at an end the one that can move", async function () {
    const slider = makeRangeSlider({ lowValue: 50, highValue: 50 });
    await wait(20);
    const pressStack = function (at, to) {
        pointer(slider.highKnob.elem, "pointerdown", rangeXOf(slider, at), 60, "mouse");
        pointer(slider.highKnob.elem, "pointermove", rangeXOf(slider, to), 60, "mouse");
        pointer(slider.highKnob.elem, "pointerup", rangeXOf(slider, to), 60, "mouse");
        return slider.getValues().join();
    };
    const toRight = pressStack(50, 70);
    slider.setValues(50, 50);
    const toLeft = pressStack(50, 30);
    slider.setValues(100, 100);
    const atHighEnd = pressStack(100, 80);
    slider.setValues(0, 0);
    const atLowEnd = pressStack(0, 20);
    slider.setValues(50, 50);
    rangePress(slider, "pointerdown", 30);
    const barLeft = slider.getValues().join();
    rangePress(slider, "pointerup", 30);
    slider.setValues(50, 50);
    rangePress(slider, "pointerdown", 70);
    const barRight = slider.getValues().join();
    rangePress(slider, "pointerup", 70);
    check("RangeSlider: from two knobs at one place the direction of the first move chooses; at an end the one that can move",
        toRight === "50,70" && toLeft === "30,50" && atHighEnd === "80,100" && atLowEnd === "0,20" && barLeft === "30,50" && barRight === "50,70",
        [toRight, toLeft, atHighEnd, atLowEnd, barLeft, barRight].join(" | "));
    slider.remove();
});

test("RangeSlider: a finger on the bar: a tap moves a knob, a move to the side drags, the scroll of the page changes nothing; on a knob it drags at once", async function () {
    const moves = [];
    let ends = 0;
    const slider = makeRangeSlider({ onChange: function (self) { moves.push(self.getValues().join()); }, onChangeEnd: function () { ends++; } });
    await wait(20);
    rangePress(slider, "pointerdown", 40, "touch");
    const notYet = slider.lowValue;
    pointer(slider.elem, "pointermove", rangeXOf(slider, 40) + 2, 62, "touch");
    const smallMove = slider.lowValue;
    rangePress(slider, "pointerup", 40, "touch");
    const tap = [slider.lowValue, ends].join();
    slider.setValues(20, 80);
    ends = 0;
    rangePress(slider, "pointerdown", 40, "touch");
    rangePress(slider, "pointermove", 50, "touch");
    const dragged = slider.lowValue;
    rangePress(slider, "pointerup", 50, "touch");
    const afterDrag = ends;
    slider.setValues(20, 80);
    ends = 0;
    moves.length = 0;
    rangePress(slider, "pointerdown", 40, "touch");
    pointer(slider.elem, "pointercancel", rangeXOf(slider, 40), 200, "touch");
    const scrolled = [slider.getValues().join(), moves.length, ends].join();
    rangePress(slider, "pointermove", 70, "touch");
    const noPressAfter = slider.getValues().join();
    pointer(slider.highKnob.elem, "pointerdown", rangeXOf(slider, 80), 60, "touch");
    pointer(slider.highKnob.elem, "pointermove", rangeXOf(slider, 70), 60, "touch");
    pointer(slider.highKnob.elem, "pointerup", rangeXOf(slider, 70), 60, "touch");
    const onKnob = slider.highValue;
    const touchActions = [slider.elem.style.touchAction, slider.lowKnob.elem.style.touchAction].join();
    check("RangeSlider: a finger on the bar: a tap moves a knob, a move to the side drags, the scroll of the page changes nothing; on a knob it drags at once",
        notYet === 20 && smallMove === 20 && tap === "40,1" && dragged === 50 && afterDrag === 1 && scrolled === "20,80,0,0" && noPressAfter === "20,80" && onKnob === 70 && touchActions === "pan-y,none",
        [notYet, smallMove, tap, dragged, afterDrag, scrolled, noPressAfter, onKnob, touchActions].join(" | "));
    slider.remove();
});

test("RangeSlider: the keys of each knob, the other knob and minGap stop them; a screen reader hears the values", async function () {
    const moves = [];
    let ends = 0;
    const slider = makeRangeSlider({ step: 2, minGap: 4, formatValue: function (value) { return value + " TL"; }, onChange: function (self) { moves.push(self.getValues().join()); }, onChangeEnd: function () { ends++; } });
    await wait(20);
    const low = slider.lowKnob.elem;
    const high = slider.highKnob.elem;
    const results = [];
    const press = function (element, keyName) {
        const event = new KeyboardEvent("keydown", { key: keyName, bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        results.push(slider.getValues().join());
        return event;
    };
    press(low, "ArrowRight");
    press(low, "ArrowUp");
    press(low, "ArrowLeft");
    press(low, "ArrowDown");
    press(low, "PageUp");
    press(low, "PageDown");
    press(high, "End");
    press(high, "Home");
    press(low, "End");
    press(low, "Home");
    const before = moves.length;
    const atLimit = press(low, "Home");
    const noMove = (moves.length === before);
    const other = press(low, "a");
    const roles = [low.getAttribute("role"), low.tabIndex, high.tabIndex, low.getAttribute("aria-label"), high.getAttribute("aria-label")].join();
    slider.setValues(20, 60);
    const aria = [low.getAttribute("aria-valuenow"), low.getAttribute("aria-valuetext"), low.getAttribute("aria-valuemin"), low.getAttribute("aria-valuemax"),
        high.getAttribute("aria-valuenow"), high.getAttribute("aria-valuemin"), high.getAttribute("aria-valuemax")].join();
    ends = 0;
    moves.length = 0;
    slider.setEnabled(0);
    press(low, "ArrowRight");
    const offState = [slider.lowValue, low.tabIndex, low.getAttribute("aria-disabled"), moves.length].join();
    slider.setEnabled(1);
    const onState = [low.tabIndex, low.getAttribute("aria-disabled")].join();
    check("RangeSlider: the keys of each knob, the other knob and minGap stop them; a screen reader hears the values",
        results.slice(0, 10).join("/") === "22,80/24,80/22,80/20,80/40,80/20,80/20,100/20,24/20,24/0,24" && atLimit.defaultPrevented && noMove && !other.defaultPrevented &&
        roles === "slider,0,0,Minimum,Maximum" && aria === "20,20 TL,0,56,60,24,100" && offState === "20,-1,true,0" && onState === "0,false",
        [results.join("/"), atLimit.defaultPrevented, noMove, other.defaultPrevented, roles, aria, offState, onState].join(" | "));
    slider.remove();
});

test("RangeSlider: the bubble of a knob that moves, in plain text; only one at a time; it goes away", async function () {
    const slider = makeRangeSlider({ formatValue: function (value) { return "<b>" + value + "</b>"; } });
    await wait(20);
    const isShown = function (knob) { return knob.lblValue.elem.getClientRects().length > 0; };
    const atStart = [isShown(slider.lowKnob), isShown(slider.highKnob)].join();
    pointer(slider.lowKnob.elem, "pointerdown", rangeXOf(slider, 20), 60, "mouse");
    pointer(slider.lowKnob.elem, "pointermove", rangeXOf(slider, 30), 60, "mouse");
    const whileMoving = [isShown(slider.lowKnob), isShown(slider.highKnob), slider.lowKnob.lblValue.elem.textContent, slider.lowKnob.lblValue.elem.querySelectorAll("b").length].join();
    const above = (slider.lowKnob.lblValue.elem.getBoundingClientRect().bottom < slider.lowKnob.elem.getBoundingClientRect().top);
    pointer(slider.lowKnob.elem, "pointerup", rangeXOf(slider, 30), 60, "mouse");
    const afterUp = isShown(slider.lowKnob);
    slider.highKnob.elem.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
    const afterKey = isShown(slider.highKnob);
    await wait(1100);
    const later = isShown(slider.highKnob);
    slider.remove();
    const quiet = makeRangeSlider({ showValueOnMove: 0 });
    await wait(20);
    pointer(quiet.lowKnob.elem, "pointerdown", rangeXOf(quiet, 20), 60, "mouse");
    pointer(quiet.lowKnob.elem, "pointermove", rangeXOf(quiet, 30), 60, "mouse");
    const quietShown = isShown(quiet.lowKnob);
    pointer(quiet.lowKnob.elem, "pointerup", rangeXOf(quiet, 30), 60, "mouse");
    quiet.remove();
    check("RangeSlider: the bubble of a knob that moves, in plain text; only one at a time; it goes away",
        atStart === "false,false" && whileMoving === "true,false,<b>30</b>,0" && above && !afterUp && afterKey && !later && !quietShown,
        [atStart, whileMoving, above, afterUp, afterKey, later, quietShown].join(" | "));
});

test("RangeSlider: setTheme() paints a new package, the values and the style of the page stay; remove() in a press", async function () {
    const slider = makeRangeSlider({ style: { knob: { size: 30 } } });
    await wait(20);
    const looks = function () {
        return [slider.fill.elem.style.backgroundColor, slider.track.elem.style.backgroundColor, slider.lowKnob.elem.offsetWidth, slider.styleName].join("|");
    };
    const light = looks();
    slider.setTheme("roundDark");
    const dark = looks();
    const values = slider.getValues().join();
    slider.setTheme("round");
    const back = looks();
    pointer(slider.lowKnob.elem, "pointerdown", rangeXOf(slider, 20), 60, "mouse");
    pointer(slider.lowKnob.elem, "pointermove", rangeXOf(slider, 30), 60, "mouse");
    const lowKnob = slider.lowKnob;
    slider.remove();
    slider.remove();
    pointer(document.body, "pointermove", 10, 10, "mouse");
    pointer(document.body, "pointerup", 10, 10, "mouse");
    const removed = [slider.isRemoved, lowKnob.isRemoved].join();
    check("RangeSlider: setTheme() paints a new package, the values and the style of the page stay; remove() in a press",
        light.endsWith("|30|round") && dark.includes("|30|roundDark") && light !== dark.replace("roundDark", "round") && values === "20,80" && back === light && removed === "1,1",
        [light, dark, values, back, removed].join(" || "));
});

// *** CODE EDITOR (comp/code-editor.js)

const partsOf = function (language, text, state) {
    return CodeEditor.tokenizeLine(text, state || null, CodeEditor.languages[language]);
};

const kindsOf = function (language, text, state) {
    return partsOf(language, text, state).parts.filter(function (part) { return part[0]; }).map(function (part) { return part[0] + ":" + part[1]; }).join(" ");
};

const makeEditor = function (params) {
    return CodeEditor(Object.assign({ left: 0, top: 0, width: 500, height: 200, language: "python" }, params || {}));
};

const editorKey = function (editor, name, extra) {
    const event = new KeyboardEvent("keydown", Object.assign({ key: name, bubbles: true, cancelable: true }, extra || {}));
    editor.textareaElem.dispatchEvent(event);
    return event;
};

test("CodeEditor: the colors of a line by its language; a string or a comment of many lines goes on in the next line", async function () {
    const python = kindsOf("python", 'def add(a, b=1):  # sum "x"');
    const isPython = python === 'keyword:def function:add number:1 comment:# sum "x"';
    const words = kindsOf("python", "şif = print(self.if_x) if True else 'a\\'b'");
    const isUnicode = words === "builtin:print builtin:self keyword:if keyword:True keyword:else string:'a\\'b'";
    const opening = partsOf("python", 'x = """first');
    const middle = partsOf("python", "second", opening.state);
    const closing = partsOf("python", 'third""" + 1', middle.state);
    const isMultiLine = opening.state === '"""' && middle.state === '"""' && middle.parts[0][0] === "string" && closing.state === null && closing.parts[0][1] === 'third"""' && closing.parts[closing.parts.length - 1][0] === "number";
    const js = partsOf("javascript", "const a = `x /* y");
    const jsBlock = partsOf("javascript", "/* one", null);
    const jsBlockEnd = partsOf("javascript", "two */ let b", jsBlock.state);
    const isJs = js.state === "`" && jsBlock.state === "*/" && jsBlockEnd.state === null && jsBlockEnd.parts[0][1] === "two */" && kindsOf("javascript", "two */ let b", "*/").includes("keyword:let");
    const json = kindsOf("json", '{"name": "Ada", "age": 36, "ok": true}');
    const isJson = json === 'property:"name" string:"Ada" property:"age" number:36 property:"ok" keyword:true';
    const sql = kindsOf("sql", "SELECT name FROM t WHERE id = 1 -- x");
    const isSql = sql === "keyword:SELECT keyword:FROM keyword:WHERE number:1 comment:-- x";
    const css = kindsOf("css", 'color: #fff; /* c */');
    const isCss = css === "property:color variable:#fff comment:/* c */";
    const html = partsOf("html", '<a href="x">t</a> <!-- c');
    const htmlKinds = html.parts.filter(function (part) { return part[0]; }).map(function (part) { return part[0] + ":" + part[1]; }).join(" ");
    const isHtml = htmlKinds === 'tag:<a attribute:href string:"x" tag:> tag:</a tag:> comment:<!-- c' && html.state === "-->";
    const isText = kindsOf("text", "def if 1 'x' # y") === "";
    const bash = kindsOf("bash", 'echo "$HOME" $USER # c');
    const isBash = bash === 'builtin:echo string:"$HOME" variable:$USER comment:# c';
    check("CodeEditor: the colors of a line by its language; a string or a comment of many lines goes on in the next line",
        isPython && isUnicode && isMultiLine && isJs && isJson && isSql && isCss && isHtml && isText && isBash,
        [isPython, python, isUnicode, words, isMultiLine, isJs, isJson, json, isSql, sql, isCss, css, isHtml, htmlKinds, isText, isBash, bash].join(" | "));
});

test("CodeEditor: the text stays text; the drawn text lies exactly under the text of the textarea", async function () {
    const editor = makeEditor({ value: "<b>not bold</b>\n\tx = 'şğü'  # " + "long ".repeat(60) });
    await wait(30);
    const layer = editor.codeLayer.elem;
    const hasNoHtml = !layer.querySelector("b") && layer.textContent.includes("<b>not bold</b>");
    const area = editor.textareaElem;
    const style = editor.style.text;
    // WHY both: a browser may or may not count the padding at the right of a textarea in its scrollWidth.
    const widthWithOnePadding = area.scrollWidth - style.paddingX;
    const widthWithTwoPaddings = area.scrollWidth - 2 * style.paddingX;
    const isSameWidth = Math.min(Math.abs(layer.scrollWidth - widthWithOnePadding), Math.abs(layer.scrollWidth - widthWithTwoPaddings)) <= 1;
    const isSameFont = getComputedStyle(layer).fontFamily === getComputedStyle(area).fontFamily && getComputedStyle(layer).fontSize === getComputedStyle(area).fontSize && getComputedStyle(layer).lineHeight === getComputedStyle(area).lineHeight && getComputedStyle(layer).tabSize === getComputedStyle(area).tabSize;
    area.scrollLeft = 120;
    area.dispatchEvent(new Event("scroll"));
    const followsX = new DOMMatrix(getComputedStyle(layer).transform).m41 === style.paddingX - area.scrollLeft;
    check("CodeEditor: the text stays text; the drawn text lies exactly under the text of the textarea", hasNoHtml && isSameWidth && isSameFont && followsX,
        [hasNoHtml, layer.scrollWidth, area.scrollWidth, isSameFont, followsX].join(" "));
    editor.remove();
});

test("CodeEditor: only the lines that are seen are drawn; a big text stays fast; goToLine shows its line", async function () {
    const manyLines = [];
    for (let i = 1; i <= 100000; i++) manyLines.push("value_" + i + " = " + i + "  # line");
    const startedAt = performance.now();
    const editor = makeEditor({ value: manyLines.join("\n") });
    const createTime = performance.now() - startedAt;
    await wait(30);
    const drawnLines = editor.codeLayer.elem.textContent.split("\n").length;
    const isFew = drawnLines < 80 && editor.gutterLayer.elem.textContent.startsWith("1\n");
    editor.goToLine(50000);
    const area = editor.textareaElem;
    const lineTop = 49999 * editor.style.text.lineHeight;
    const isSeen = lineTop >= area.scrollTop && lineTop < area.scrollTop + area.clientHeight;
    const isCursorThere = editor.cursorLine === 50000 && editor.cursorColumn === 1;
    const hasItsText = editor.codeLayer.elem.textContent.includes("value_50000 = 50000");
    const isNumbered = editor.gutterLayer.elem.textContent.split("\n").includes("50000");
    const isMarked = editor.gutterLayer.elem.querySelector(".code-editor-active-number").textContent === "50000";
    const typeStart = performance.now();
    editor.insertText("x");
    const typeTime = performance.now() - typeStart;
    check("CodeEditor: only the lines that are seen are drawn; a big text stays fast; goToLine shows its line",
        isFew && isSeen && isCursorThere && hasItsText && isNumbered && isMarked && createTime < 2000 && typeTime < 1000,
        [isFew, drawnLines, isSeen, isCursorThere, hasItsText, isNumbered, isMarked, Math.round(createTime), Math.round(typeTime)].join(" "));
    editor.remove();
});

test("CodeEditor: Tab, Shift + Tab, Enter, Backspace and Ctrl + / edit the lines, and undo takes them back", async function () {
    const changes = [];
    const editor = makeEditor({ value: "def f():\n    a\n    b\nc", onChange: function (self) { changes.push(self.value.length); } });
    const area = editor.textareaElem;
    area.focus();

    area.setSelectionRange(0, 0);
    editorKey(editor, "Tab");
    const tabAtStart = area.value.startsWith("    def f");
    document.execCommand("undo");
    const undone = area.value.startsWith("def f") && editor.value === area.value;

    area.setSelectionRange(1, 1); // in "def": to the next stop
    editorKey(editor, "Tab");
    const tabToStop = area.value.startsWith("d   ef f");
    document.execCommand("undo");

    area.setSelectionRange(8, 8); // the end of "def f():"
    const enterEvent = editorKey(editor, "Enter");
    const opensLevel = area.value.startsWith("def f():\n    \n    a") && enterEvent.defaultPrevented;
    document.execCommand("undo");

    const lineB = area.value.indexOf("    b") + 5;
    area.setSelectionRange(lineB, lineB);
    editorKey(editor, "Enter");
    const keepsIndent = area.value.includes("    b\n    \nc");
    editorKey(editor, "Backspace");
    const backOneLevel = area.value.includes("    b\n\nc");
    document.execCommand("undo");
    document.execCommand("undo");

    const allStart = area.value.indexOf("    a");
    area.setSelectionRange(allStart, area.value.indexOf("c"));
    editorKey(editor, "Tab");
    const manyIndented = area.value === "def f():\n        a\n        b\nc" && area.selectionEnd - area.selectionStart === "        a\n        b".length;
    editorKey(editor, "Tab", { shiftKey: true });
    const manyBack = area.value === "def f():\n    a\n    b\nc";

    area.setSelectionRange(allStart, allStart);
    editorKey(editor, "/", { ctrlKey: true });
    const commented = area.value.includes("    # a\n");
    editorKey(editor, "/", { metaKey: true });
    const uncommented = area.value.includes("    a\n");

    editorKey(editor, "Escape");
    const tabLeaves = !editorKey(editor, "Tab").defaultPrevented;
    const tabStaysAfter = editorKey(editor, "Tab").defaultPrevented;

    const hasChanges = changes.length > 5 && editor.value === area.value;
    check("CodeEditor: Tab, Shift + Tab, Enter, Backspace and Ctrl + / edit the lines, and undo takes them back",
        tabAtStart && undone && tabToStop && opensLevel && keepsIndent && backOneLevel && manyIndented && manyBack && commented && uncommented && tabLeaves && tabStaysAfter && hasChanges,
        [tabAtStart, undone, tabToStop, opensLevel, keepsIndent, backOneLevel, manyIndented, manyBack, commented, uncommented, tabLeaves, tabStaysAfter, hasChanges, JSON.stringify(area.value)].join(" "));
    editor.remove();
});

test("CodeEditor: read only; setValue silent; changeDelay waits; the line and the column; the width of the numbers", async function () {
    let changes = 0;
    let cursors = 0;
    const editor = makeEditor({ value: "a\nb", changeDelay: 40, onChange: function () { changes++; }, onCursorChange: function () { cursors++; } });
    const area = editor.textareaElem;
    area.focus();
    editor.insertText("x");
    editor.insertText("y");
    const waits = changes === 0;
    await wait(120);
    const toldOnce = changes === 1;
    editor.setValue("one\ntwo\nthree", 1);
    await wait(80);
    const silent = changes === 1 && editor.value === "one\ntwo\nthree" && editor.getValue() === "one\ntwo\nthree";
    area.setSelectionRange(9, 9);
    area.dispatchEvent(new Event("keyup"));
    const isPlace = editor.cursorLine === 3 && editor.cursorColumn === 2 && cursors > 0;
    const activeTop = editor.activeLine.top;
    const isActivePlaced = activeTop === editor.style.text.paddingY + 2 * editor.style.text.lineHeight - area.scrollTop;
    area.setSelectionRange(0, 3);
    const isSelected = editor.getSelectedText() === "one";
    const narrow = editor.gutter.elem.offsetWidth;
    editor.setValue(new Array(1200).fill("x").join("\n"), 1);
    const wider = editor.gutter.elem.offsetWidth > narrow && editor.codeArea.elem.offsetLeft === editor.gutter.elem.offsetWidth;
    editor.setShowLineNumbers(0);
    const noNumbers = editor.gutter.elem.getClientRects().length === 0 && editor.codeArea.elem.offsetLeft === 0;
    editor.setShowLineNumbers(1);
    editor.setValue("abc", 1);
    editor.setReadOnly(1);
    area.setSelectionRange(0, 0);
    const tabEvent = editorKey(editor, "Tab");
    const readOnly = area.value === "abc" && area.readOnly && !tabEvent.defaultPrevented;
    editor.setReadOnly(0);
    area.focus();
    area.setSelectionRange(0, 0);
    editorKey(editor, "Tab");
    const editable = area.value === "    abc";
    check("CodeEditor: read only; setValue silent; changeDelay waits; the line and the column; the width of the numbers",
        waits && toldOnce && silent && isPlace && isActivePlaced && isSelected && wider && noNumbers && readOnly && editable,
        [waits, toldOnce, silent, isPlace, isActivePlaced, isSelected, wider, noNumbers, readOnly, editable].join(" "));
    editor.remove();
});

test("CodeEditor: setLanguage and setTheme change the colors; the text, the undo and a style of the page stay", async function () {
    const editor = makeEditor({ value: "def f(): pass", language: "text", style: { kinds: { string: "rgb(1, 2, 3)" } } });
    const area = editor.textareaElem;
    const spanCount = function () { return editor.codeLayer.elem.querySelectorAll("span").length; };
    const noColors = spanCount() === 0;
    editor.setLanguage("python");
    const hasColors = spanCount() >= 2;
    const keyword = editor.codeLayer.elem.querySelector(".code-editor-keyword");
    const lightColor = getComputedStyle(keyword).color;
    const lightGround = getComputedStyle(editor.elem).backgroundColor;
    area.focus();
    area.setSelectionRange(0, 0);
    editor.insertText("# x\n");
    editor.setTheme("dark");
    const darkKeyword = editor.codeLayer.elem.querySelector(".code-editor-keyword");
    const isDarker = getComputedStyle(darkKeyword).color !== lightColor && getComputedStyle(editor.elem).backgroundColor !== lightGround && editor.styleName === "dark";
    const keepsText = area.value === "# x\ndef f(): pass" && editor.value === area.value;
    const keepsPageStyle = editor.elem.style.getPropertyValue("--code-editor-string") === "rgb(1, 2, 3)";
    document.execCommand("undo");
    const undoWorks = area.value === "def f(): pass";
    editor.setTheme("light");
    const isBack = getComputedStyle(editor.elem).backgroundColor === lightGround;
    check("CodeEditor: setLanguage and setTheme change the colors; the text, the undo and a style of the page stay",
        noColors && hasColors && isDarker && keepsText && keepsPageStyle && undoWorks && isBack, [noColors, hasColors, isDarker, keepsText, keepsPageStyle, undoWorks, isBack].join(" "));
    editor.remove();
});

test("setTheme: LogView, ImageView, MenuBar and StatusBar change their package in place; the style of the page and the content stay", async function () {
    const groundOf = function (obj) { return getComputedStyle(obj.elem).backgroundColor; };
    const isDark = function (color) {
        const parts = color.match(/\d+/g).map(Number);
        return parts[0] + parts[1] + parts[2] < 3 * 128;
    };

    const log = LogView({ left: 0, top: 0, width: 400, height: 120, lines: [{ text: "Bad", level: "error", time: "01:02:03" }] });
    const logRow = logRows(log)[0];
    const logAtFirst = groundOf(log);
    const logTextAtFirst = getComputedStyle(logRow).color;
    log.setTheme("dark");
    const logIsDark = isDark(groundOf(log)) && log.styleName === "dark" && logRows(log)[0] === logRow;
    const logTextChanged = getComputedStyle(logRow).color !== logTextAtFirst && logRow.textContent === "01:02:03 ERROR Bad";
    log.setTheme("light");
    const logIsBack = groundOf(log) === logAtFirst && getComputedStyle(logRow).color === logTextAtFirst;
    log.remove();

    const view = await makeLoadedView(1000, 500, { style: { image: { color: "rgb(1, 2, 3)" } } });
    view.setZoomLevel(2);
    view.setTheme("dark");
    const viewIsDark = isDark(groundOf(view)) && isDark(groundOf(view.toolbar));
    const viewKeeps = view.zoomLevel === 2 && getComputedStyle(view.image.elem).backgroundColor === "rgb(1, 2, 3)" && view.image.elem.getClientRects().length > 0;
    view.clearImage();
    const noteAtDark = getComputedStyle(view.lblEmpty.elem).color;
    view.setTheme("light");
    const noteChanged = getComputedStyle(view.lblEmpty.elem).color !== noteAtDark;
    view.remove();

    const bar = StatusBar({ messageText: "Saved", messageTone: "success", items: ["UTF-8", { key: "z", text: "100%", onClick: function () { } }] });
    bar.setItemText("z", "125%");
    bar.setTheme("dark");
    const barIsDark = isDark(groundOf(bar)) && bar.lblMessage.plainText === "Saved" && bar.partList[1].obj.elem.textContent === "125%" && bar.partList[1].obj.elem.tagName === "BUTTON";
    bar.remove();

    const clicks = [];
    const menuBar = MenuBar({ menus: makeTestMenus(), onClick: function (self, item) { clicks.push(item.key); } });
    await wait(10);
    menuBar.setItemChecked("wrap", 0);
    const view3 = menuBar.menuList[3];
    const oldMenu = view3.contextMenu;
    view3.title.elem.focus();
    menuBar.setTheme("dark");
    const titleKeepsFocus = document.activeElement === view3.title.elem;
    const oldMenuGone = !document.body.contains(oldMenu.elem) && document.body.contains(menuBar.menuList[3].contextMenu.elem);
    const barDark = isDark(groundOf(menuBar)) && isDark(groundOf(menuBar.menuList[3].contextMenu));
    menuBar.menuList[3].title.elem.click();
    const keepsChecked = openMenuRows(menuBar.menuList[3].contextMenu)[0].getAttribute("aria-checked") === "false";
    menuBar.menuList[3].contextMenu.close();
    key(document.body, "keydown", "s", { ctrlKey: true });
    const shortcutRuns = clicks.join(" ") === "save";
    // setTheme in the onClick of an item: its menu is made again while its click runs.
    const selfBar = MenuBar({ menus: [{ text: "View", items: [{ text: "Dark", key: "d", onClick: function (self) { self.setTheme("dark"); } }] }] });
    await wait(10);
    selfBar.menuList[0].title.elem.click();
    let errorText = "";
    try { selfBar.menuList[0].contextMenu.clickItem(0); } catch (error) { errorText = error.message; }
    const selfIsDark = isDark(groundOf(selfBar)) && !errorText;
    selfBar.remove();
    menuBar.remove();

    check("setTheme: LogView, ImageView, MenuBar and StatusBar change their package in place; the style of the page and the content stay",
        logIsDark && logTextChanged && logIsBack && viewIsDark && viewKeeps && noteChanged && barIsDark && titleKeepsFocus && oldMenuGone && barDark && keepsChecked && shortcutRuns && selfIsDark,
        [logIsDark, logTextChanged, logIsBack, viewIsDark, viewKeeps, noteChanged, barIsDark, titleKeepsFocus, oldMenuGone, barDark, keepsChecked, shortcutRuns, selfIsDark, errorText].join(" "));
});

test("LogView, ImageView, MenuBar and StatusBar: the dark package changes their colors, and never the light one", async function () {
    const colorOf = function (obj) { return getComputedStyle(obj.elem).backgroundColor; };
    const pairs = [LogView, ImageView, MenuBar, StatusBar].map(function (Comp) {
        const light = Comp({});
        const dark = Comp({ styleName: "dark" });
        const lightAgain = Comp({ style: { box: { color: "rgb(1, 2, 3)" } } });
        const fresh = Comp({});
        const row = [colorOf(light), colorOf(dark), colorOf(lightAgain), colorOf(fresh)];
        light.remove();
        dark.remove();
        lightAgain.remove();
        fresh.remove();
        return row;
    });
    const isRight = pairs.every(function (row) { return row[0] !== row[1] && row[2] === "rgb(1, 2, 3)" && row[3] === row[0]; });
    check("LogView, ImageView, MenuBar and StatusBar: the dark package changes their colors, and never the light one", isRight, JSON.stringify(pairs));
});
