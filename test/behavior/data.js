/* Bismillah */

/*
BEHAVIOR TESTS: DATA
The tests of test/behavior-test.htm for tables, charts and views of data (SmartTable, GraphBox, JsonView, JsonEditor, LogView, TimeLine...).
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

// *** MINI GRAPH BOX (comp/mini-graph-box.js)

test("MiniGraphBox: made in a hidden group, it keeps its values", async function () {
    const group = VGroup({ width: 300, height: 120, visible: 0 });
        const graph = MiniGraphBox({ values: [1, 2, 3, 4] });
    endGroup();
    group.visible = 1;
    await wait(100);
    check("MiniGraphBox: made in a hidden group, it keeps its values", graph.values.length === 4, "values: " + graph.values.length);
    group.remove();
});

// *** SMART TABLE (comp/smart-table.js)

test("SmartTable: a value is written as text, not as HTML", async function () {
    window.__injected = 0;
    const table = SmartTable({ width: 500, height: 200, itemDataList: [{ id: 1, name: "A <img src=x onerror=window.__injected=1>", email: "a@b.co", active: 1 }] });
    await wait(100);
    check("SmartTable: a value is written as text, not as HTML", window.__injected === 0 && table.elem.querySelectorAll("img[src='x']").length === 0);
    table.remove();
});

test("SmartTable: the numbers of the info line are in the language of the page, not always Turkish (locale)", async function () {
    const records = [];
    for (let i = 1; i <= 12499; i++) records.push({ id: i, name: "N", email: "", active: 1 });
    const table = SmartTable({ width: 500, itemLineCount: 3, itemDataList: records });
    await wait(200);
    const pageText = table.boxInfoLine.label.text;
    table.setLocale("tr-TR");
    const turkishText = table.boxInfoLine.label.text;
    const pageNumber = (12499).toLocaleString(document.documentElement.lang || "tr-TR");
    check("SmartTable: the numbers of the info line are in the language of the page, not always Turkish (locale)",
        pageText.endsWith("/ " + pageNumber) && turkishText.endsWith("/ 12.499"), pageText + " | " + turkishText);
    table.remove();
});

test("SmartTable: a cut text shows all of it in a bubble over its cell; the bubble goes with the mouse and with the table", async function () {
    const longName = "Muhammed Abdurrahman Karaosmanoğlu Yılmazoğulları";
    const table = SmartTable({ itemLineCount: 3, itemDataList: [{ id: 1, name: longName, email: "", active: 1 }, { id: 2, name: "Ali", email: "", active: 1 }], style: { width: 600, height: "auto" } });
    await wait(150);
    const findBubble = function (text) {
        return [...document.querySelectorAll("[role=status]")].find(function (elem) { return elem.textContent === text; });
    };
    const cutCell = table.itemLineList[0].itemCell1; // (the name column is 100 px wide)
    const shortCell = table.itemLineList[1].itemCell1;
    shortCell.elem.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(400);
    const hasShortBubble = Boolean(findBubble("Ali"));
    shortCell.elem.dispatchEvent(new MouseEvent("mouseleave"));
    cutCell.elem.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(400);
    const hasCutBubble = Boolean(findBubble(longName));
    cutCell.elem.dispatchEvent(new MouseEvent("mouseleave"));
    const isGoneWithMouse = !findBubble(longName);
    check("SmartTable: a cut text shows all of it in a bubble over its cell (a text that fits: no bubble)",
        hasCutBubble && !hasShortBubble, "cut: " + hasCutBubble + ", fits: " + hasShortBubble);
    cutCell.elem.dispatchEvent(new MouseEvent("mouseenter"));
    await wait(400);
    table.remove();
    check("SmartTable: the bubble goes when the mouse leaves the cell and when the table is removed",
        isGoneWithMouse && !findBubble(longName), "after the mouse: " + isGoneWithMouse);
});

test("SmartTable: a click on a row with no record does nothing: no onSelect(null), the selection stays", async function () {
    const selected = [];
    const record = { id: 1, name: "Ada", email: "", active: 1 };
    const table = SmartTable({ left: 0, top: 0, itemLineCount: 3, itemDataList: [record], onSelect: function (self, itemData) { selected.push(itemData); }, style: { width: 500, height: "auto" } });
    table.zIndex = 100000; // (over the results of the page, for elementFromPoint)
    await wait(150);
    table.itemLineList[0].itemCell1.elem.click();
    const emptyLine = table.itemLineList[2];
    const rect = emptyLine.elem.getBoundingClientRect();
    // (a person's click: the cell that is under the mouse there)
    const hit = document.elementFromPoint(rect.left + 120, rect.top + rect.height / 2);
    const isUnderMouse = Boolean(hit) && emptyLine.elem.contains(hit);
    if (hit) hit.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    emptyLine.itemCell0.elem.click();
    const result = selected.map(function (itemData) { return itemData ? itemData.name : String(itemData); }).join(",");
    const cursors = getComputedStyle(table.itemLineList[0].itemCell1.elem).cursor + " / " + getComputedStyle(emptyLine.itemCell1.elem).cursor;
    check("SmartTable: a click on a row with no record does nothing: no onSelect(null), the selection stays",
        isUnderMouse && result === "Ada" && table.selectedItemData === record,
        "under the mouse: " + isUnderMouse + ", onSelect: " + result + ", selected: " + (table.selectedItemData ? table.selectedItemData.name : "none"));
    check("SmartTable: the hand cursor is on the rows with a record, not on the empty part of the table",
        cursors === "pointer / auto", "with a record / empty: " + cursors);
    table.remove();
});

test("SmartTable: classic is the default; a page's own style over \"green\" keeps the other keys of that look", async function () {
    const classicTable = SmartTable({ itemLineCount: 2, style: { width: 400, height: "auto" } });
    const greenTable = SmartTable({ itemLineCount: 2, styleName: "green", style: { width: 400, height: "auto", line2Color: "#EEEEEE" } });
    const darkTable = SmartTable({ itemLineCount: 2, styleName: "dark", style: { width: 400, height: "auto" } });
    await wait(150);
    const isClassic = (classicTable.style.boxTitleLine.color === "whitesmoke" && classicTable.searchInputParams.styleName === "ozden");
    const isGreen = (greenTable.style.boxTitleLine.color === "#65A293" && greenTable.style.line2Color === "#EEEEEE" && greenTable.searchInputParams.styleName === "original");
    const isDark = (darkTable.style.line1Color === "#232428" && darkTable.searchInputParams.styleName === "ozdenDark" && darkTable.style.lblItemCell.fontSize === 15);
    const isPackageKept = (SmartTable.styles.green.style.line2Color === "whitesmoke");
    check("SmartTable: classic is the default; a page's own style over \"green\" keeps the other keys of that look",
        isClassic && isGreen && isDark && isPackageKept, "classic: " + isClassic + ", green: " + isGreen + ", dark: " + isDark + ", package kept: " + isPackageKept);
    classicTable.remove();
    greenTable.remove();
    darkTable.remove();
});

test("SmartTable: the column chip is at the right end of the filter box; the text and the clear icon stay at its left; a narrow box has no clear icon", async function () {
    const wideTable = SmartTable({ itemLineCount: 2, style: { width: 700, height: "auto" } });
    const narrowTable = SmartTable({ itemLineCount: 2, style: { width: 260, height: "auto" } });
    wideTable.searchInput.setValue("abc", 1);
    narrowTable.searchInput.setValue("abc", 1);
    await wait(150);
    const right = function (obj) { return obj.elem.getBoundingClientRect().right; };
    const left = function (obj) { return obj.elem.getBoundingClientRect().left; };
    const getLayout = function (table) {
        const search = table.searchInput;
        const chip = table.lblSelectedSortKey;
        return {
            isChipAtEnd: (right(search) - right(chip) <= 8),
            // (a cut text goes a little under the chip and fades out there: SearchInput.TEXT_UNDER_END)
            isTextBeforeChip: (right(search.txtSearch) <= left(chip) + SearchInput.TEXT_UNDER_END),
            isClearBeforeChip: (right(search.imgClearIcon) <= left(chip)),
            isClearShown: (search.imgClearIcon.opacity > 0),
        };
    };
    const wide = getLayout(wideTable);
    const narrow = getLayout(narrowTable);
    wideTable.setSearchTitleIndex(2); // (a column name: a wider chip)
    await wait(150);
    const wideColumn = getLayout(wideTable);
    const isWideRight = wide.isChipAtEnd && wide.isTextBeforeChip && wide.isClearBeforeChip && wide.isClearShown && wideColumn.isClearBeforeChip && wideColumn.isTextBeforeChip;
    const isNarrowRight = narrow.isChipAtEnd && narrow.isTextBeforeChip && !narrow.isClearShown;
    check("SmartTable: the column chip is at the right end of the filter box; the text and the clear icon stay at its left; a narrow box has no clear icon",
        isWideRight && isNarrowRight, "wide: " + JSON.stringify(wide) + ", a column: " + JSON.stringify(wideColumn) + ", narrow: " + JSON.stringify(narrow));
    wideTable.remove();
    narrowTable.remove();
});

// *** GRAPH BOX (comp/graph-box.js)

// The middle of the place of a value, on the screen. (The text of the axis has the same x.)
const graphBoxPlotPoint = function (chart, x, y) {
    const rect = chart.plot.elem.getBoundingClientRect();
    return { x: rect.left + x, y: rect.top + y };
};

const graphBoxMoveMouse = function (chart, x, y) {
    const point = graphBoxPlotPoint(chart, x, y);
    pointer(chart.plot.elem, "pointermove", point.x, point.y, "mouse");
};

test("GraphBox: the axis gets clean numbers", async function () {
    const cases = [
        [0, 94000, 4, "0,20000,40000,60000,80000,100000"],
        [-0.5, 6, 6, "-1,0,1,2,3,4,5,6"], // WHY: A step of 2 would leave a third of the chart empty.
        [0.1, 0.3, 4, "0.1,0.15,0.2,0.25,0.3"],
        [-5, 5, 4, "-5,-2.5,0,2.5,5"],
        [0, 0, 4, "0,0.25,0.5,0.75,1"],
        [7, 7, 4, "6,6.5,7,7.5,8"],
        [-3, -1, 2, "-3,-2,-1"],
    ];
    const wrong = cases.filter(function (item) {
        return GraphBox.niceScale(item[0], item[1], item[2]).ticks.join(",") !== item[3];
    }).map(function (item) {
        return item[0] + ".." + item[1] + ": " + GraphBox.niceScale(item[0], item[1], item[2]).ticks.join(",");
    });
    check("GraphBox: the axis gets clean numbers", wrong.length === 0, wrong.join(" | "));
});

test("GraphBox: addValue() and maxCount do not change the arrays of the page", async function () {
    const hours = ["10:00", "10:01", "10:02"];
    const values = [10, 20, 30];
    const cpu = GraphBox({ width: 300, height: 150, labels: hours, values: values, maxCount: 3 });
    const memory = GraphBox({ width: 300, height: 150, labels: hours, values: [50, 55, 60], maxCount: 3 });
    cpu.addValue("10:03", 40);
    memory.addValue("10:03", 65);
    const isPageSame = (hours.join(",") === "10:00,10:01,10:02" && values.join(",") === "10,20,30");
    const isChartRight = (cpu.data.labels.join(",") === "10:01,10:02,10:03" && cpu.data.datasets[0].data.join(",") === "20,30,40" && memory.data.labels.join(",") === "10:01,10:02,10:03");
    check("GraphBox: addValue() and maxCount do not change the arrays of the page", isPageSame && isChartRight, cpu.data.labels.join(",") + " / " + hours.join(","));
    cpu.remove();
    memory.remove();
});

test("GraphBox: empty data, holes and wrong values draw no NaN", async function () {
    const sets = [
        { labels: [], values: [] },
        { labels: ["A"], values: [null] },
        { labels: ["A"], values: [5] },
        { labels: ["A", "B", "C"], values: [0, 0, 0] },
        { labels: ["A", "B", "C"], values: [3, null, "abc"] },
        { labels: ["A", "B", "C", "D"], values: [-3, 2, undefined, "4"] },
        { labels: ["A", "B"], datasets: [] },
        { labels: ["A", "B"], datasets: [{ label: "Hidden", data: [1, 2], hidden: 1 }] },
    ];
    const wrong = [];
    ["line", "area", "bar"].forEach(function (type) {
        sets.forEach(function (set, setIndex) {
            const chart = GraphBox(Object.assign({ width: 300, height: 150, type: type, curve: "smooth" }, set));
            if (/NaN|Infinity|undefined/.test(chart.svg.innerHTML)) wrong.push(type + " " + setIndex);
            chart.remove();
        });
    });
    check("GraphBox: empty data, holes and wrong values draw no NaN", wrong.length === 0, wrong.join(", "));
});

test("GraphBox: a bar is as long as its value, a negative bar goes under the base line", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "bar", labels: ["A", "B", "C"], values: [50, 100, -50], maxValue: 100, minValue: -100 });
    const bars = Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getBBox(); });
    const isCount = (bars.length === 3);
    const isLengthRight = isCount && Math.abs(bars[1].height - bars[0].height * 2) < 1 && Math.abs(bars[2].height - bars[0].height) < 1;
    const base = isCount ? bars[0].y + bars[0].height : 0;
    const isSideRight = isCount && Math.abs(bars[2].y - base) < 1 && Math.abs(bars[1].y + bars[1].height - base) < 1;
    check("GraphBox: a bar is as long as its value, a negative bar goes under the base line", isLengthRight && isSideRight, JSON.stringify(bars.map(function (bar) { return [bar.y, bar.height]; })));
    chart.remove();
});

test("GraphBox: a line breaks at an empty value, a lone value keeps a point", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "line", showPoints: 0, labels: ["A", "B", "C", "D", "E"], values: [1, 2, null, 3, null] });
    const lines = chart.svg.querySelectorAll("path");
    const points = chart.svg.querySelectorAll("circle");
    check("GraphBox: a line breaks at an empty value, a lone value keeps a point", lines.length === 2 && points.length === 1, lines.length + " lines, " + points.length + " points");
    chart.remove();
});

test("GraphBox: a smooth line never goes over its values", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "line", curve: "smooth", showPoints: 0, labels: ["A", "B", "C", "D"], values: [10, 80, 10, 80], maxValue: 100 });
    const line = chart.svg.querySelector("path").getBBox();
    // The lines of the axis: from the tick of 0 to the tick of 100, then the base line.
    const axisLines = Array.from(chart.svg.querySelectorAll("line")).map(function (axisLine) { return Number(axisLine.getAttribute("y1")); });
    const scaleBase = axisLines[0];
    const scaleTop = axisLines[axisLines.length - 2];
    const topOfValues = scaleBase - (scaleBase - scaleTop) * 0.8;
    check("GraphBox: a smooth line never goes over its values", scaleTop < scaleBase && line.y >= topOfValues - 1, "top " + line.y + ", the highest value " + topOfValues);
    chart.remove();
});

test("GraphBox: the tooltip shows every dataset at that place, a name is plain text, the mouse leaves: it goes", async function () {
    const chart = GraphBox({
        width: 400, height: 240, type: "line",
        labels: ["Jan", "Feb", "<b>Mar</b>"],
        datasets: [{ label: "<i>One</i>", data: [1, 2, 3] }, { label: "Two", data: [4, 5, null] }],
    });
    await wait(30);
    const points = chart.svg.querySelectorAll("circle");
    graphBoxMoveMouse(chart, Number(points[1].getAttribute("cx")), 60);
    const isFebShown = (chart.tooltip.visible == 1 && chart.lblTooltipTitle.elem.textContent === "Feb");
    const rowsAtFeb = chart.tooltip.elem.innerText; // WHY innerText: A row with no value is hidden, it keeps its old text.
    graphBoxMoveMouse(chart, Number(points[2].getAttribute("cx")), 60);
    const rowsAtMar = chart.tooltip.elem.innerText;
    const isPlainText = (chart.tooltip.elem.querySelector("b") === null && chart.tooltip.elem.querySelector("i") === null);
    const isHoleSkipped = (rowsAtMar.includes("<b>Mar</b>") && rowsAtMar.includes("<i>One</i>") && !rowsAtMar.includes("Two"));
    pointer(chart.plot.elem, "pointerleave", 0, 0, "mouse");
    check("GraphBox: the tooltip shows every dataset at that place, a name is plain text, the mouse leaves: it goes",
        isFebShown && rowsAtFeb.includes("Two") && rowsAtFeb.includes("<i>One</i>") && isPlainText && isHoleSkipped && chart.tooltip.visible == 0,
        rowsAtFeb + " / " + rowsAtMar);
    chart.remove();
});

test("GraphBox: a hover does not make the marks again, the tooltip stays inside the box", async function () {
    const chart = GraphBox({ width: 300, height: 200, type: "bar", labels: ["A", "B", "C", "D"], datasets: [{ label: "A long name of a dataset", data: [1, 2, 3, 4] }] });
    await wait(30);
    const firstBar = chart.svg.querySelector("path");
    const plot = chart.plot.elem;
    const boxRect = chart.elem.getBoundingClientRect();
    let isInside = true;
    [[2, 2], [plot.clientWidth - 2, 2], [plot.clientWidth - 2, plot.clientHeight - 2], [40, plot.clientHeight - 2]].forEach(function (place) {
        graphBoxMoveMouse(chart, place[0], place[1]);
        const rect = chart.tooltip.elem.getBoundingClientRect();
        if (chart.tooltip.visible != 1) return;
        if (rect.left < boxRect.left || rect.top < boxRect.top || rect.right > boxRect.right || rect.bottom > boxRect.bottom) isInside = false;
    });
    check("GraphBox: a hover does not make the marks again, the tooltip stays inside the box", firstBar === chart.svg.querySelector("path") && isInside, "inside: " + isInside);
    chart.remove();
});

test("GraphBox: a click on the legend hides a dataset, and the others keep their colors", async function () {
    const chart = GraphBox({
        width: 400, height: 240, type: "bar", labels: ["A", "B"],
        datasets: [{ label: "One", data: [1, 2] }, { label: "Two", data: [3, 4] }, { label: "Three", data: [5, 6] }],
    });
    const getBarColors = function () {
        const colors = Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getAttribute("fill"); });
        return Array.from(new Set(colors)).join(",");
    };
    const colorsAtStart = getBarColors().split(",");
    chart.legendItems[0].elem.click();
    const colorsAfterHide = getBarColors().split(",");
    chart.removeDataset(0);
    const colorsAfterRemove = getBarColors().split(",");
    chart.addDataset({ label: "New", data: [7, 8] });
    const colorsAfterAdd = getBarColors().split(",");
    const isHidden = (colorsAfterHide.length === 2 && colorsAfterHide[0] === colorsAtStart[1] && colorsAfterHide[1] === colorsAtStart[2]);
    const isKept = (colorsAfterRemove[0] === colorsAtStart[1] && colorsAfterRemove[1] === colorsAtStart[2]);
    const isNewColorFree = (colorsAfterAdd.length === 3 && colorsAfterAdd[2] === colorsAtStart[0]);
    check("GraphBox: a click on the legend hides a dataset, and the others keep their colors", isHidden && isKept && isNewColorFree, [colorsAtStart, colorsAfterHide, colorsAfterRemove, colorsAfterAdd].join(" | "));
    chart.remove();
});

test("GraphBox: a click gives the bar under the mouse, Enter gives the one the arrows chose", async function () {
    const clicks = [];
    const chart = GraphBox({
        width: 400, height: 240, type: "bar", labels: ["A", "B"],
        datasets: [{ label: "One", data: [10, 20] }, { label: "Two", data: [30, 40] }],
        onClick: function (self, item) { clicks.push(item.label + " " + item.datasetLabel + " " + item.value); },
    });
    await wait(30);
    const bar = chart.svg.querySelectorAll("path")[3].getBBox(); // The second dataset at "B"
    graphBoxMoveMouse(chart, bar.x + bar.width / 2, bar.y + bar.height / 2);
    const point = graphBoxPlotPoint(chart, bar.x + bar.width / 2, bar.y + bar.height / 2);
    chart.plot.elem.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: point.x, clientY: point.y }));
    pointer(chart.plot.elem, "pointerleave", 0, 0, "mouse");
    key(chart.plot.elem, "keydown", "ArrowRight");
    key(chart.plot.elem, "keydown", "ArrowRight");
    const isTooltipShown = (chart.tooltip.visible == 1 && chart.lblTooltipTitle.elem.textContent === "B");
    key(chart.plot.elem, "keydown", "Enter");
    key(chart.plot.elem, "keydown", "Escape");
    check("GraphBox: a click gives the bar under the mouse, Enter gives the one the arrows chose",
        clicks[0] === "B Two 40" && clicks[1] === "B One 20" && isTooltipShown && chart.tooltip.visible == 0, clicks.join(" | "));
    chart.remove();
});

test("GraphBox: the chart follows the size of its box, and it comes when a hidden box is shown", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "line", labels: ["A", "B"], values: [1, 2] });
    await wait(30);
    const widthAtStart = Number(chart.svg.getAttribute("width"));
    chart.width = 600;
    await wait(60);
    const widthAfter = Number(chart.svg.getAttribute("width"));
    chart.remove();

    const holder = Box({ width: 400, height: 240, visible: 0 });
    const hiddenChart = createIn(holder, function () { return GraphBox({ labels: ["A", "B"], values: [1, 2] }); });
    const pathsWhileHidden = hiddenChart.svg.querySelectorAll("path").length;
    holder.visible = 1;
    await wait(60);
    const pathsWhenShown = hiddenChart.svg.querySelectorAll("path").length;
    holder.remove();

    check("GraphBox: the chart follows the size of its box, and it comes when a hidden box is shown", widthAfter === widthAtStart + 200 && pathsWhileHidden === 0 && pathsWhenShown > 0, widthAtStart + " -> " + widthAfter + ", paths " + pathsWhileHidden + " -> " + pathsWhenShown);
});

test("GraphBox: stacked: the values are one on the other, a negative one under the base line, the tooltip has the total", async function () {
    const chart = GraphBox({
        width: 400, height: 260, type: "bar", stacked: 1, legend: "none", maxValue: 100, minValue: -100,
        labels: ["A"],
        datasets: [{ label: "One", data: [30] }, { label: "Two", data: [20] }, { label: "Under", data: [-40] }],
    });
    await wait(30);
    const bars = Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getBBox(); });
    const unit = bars[0].height / 30; // px of one value
    const isSameSlot = (Math.abs(bars[0].x - bars[1].x) < 0.1 && Math.abs(bars[0].x - bars[2].x) < 0.1);
    const gapBetween = bars[0].y - (bars[1].y + bars[1].height); // "Two" is over "One", with the gap
    const isUnderBase = Math.abs(bars[2].y - (bars[0].y + bars[0].height)) < 1;
    graphBoxMoveMouse(chart, bars[0].x + 2, bars[0].y + 2);
    const readout = chart.tooltip.elem.innerText;
    check("GraphBox: stacked: the values are one on the other, a negative one under the base line, the tooltip has the total",
        isSameSlot && Math.abs(gapBetween - GraphBoxDefaults.style.bar.gap) < 0.5 && isUnderBase && Math.abs(bars[2].height - unit * 40) < 1.5 && readout.includes("Total") && readout.includes("10"),
        JSON.stringify(bars.map(function (bar) { return [bar.x, bar.y, bar.height]; })) + " " + readout);
    chart.remove();
});

test("GraphBox: stacked areas: each one is on the one before it, a tiny value of a stack still shows", async function () {
    const area = GraphBox({
        width: 400, height: 260, type: "area", stacked: 1, showPoints: 0, legend: "none", maxValue: 100,
        labels: ["A", "B"],
        datasets: [{ label: "One", data: [20, 20] }, { label: "Two", data: [30, 30] }],
    });
    const lines = Array.from(area.svg.querySelectorAll('path[fill="none"]')).map(function (path) { return path.getBBox().y; });
    const base = Number(Array.from(area.svg.querySelectorAll("line")).pop().getAttribute("y1"));
    const isOverFirst = lines.length === 2 && Math.abs((base - lines[1]) - (base - lines[0]) * 2.5) < 2;
    area.remove();

    const tiny = GraphBox({
        width: 400, height: 260, type: "bar", stacked: 1, legend: "none",
        labels: ["A"], datasets: [{ label: "Big", data: [10000] }, { label: "Tiny", data: [1] }],
    });
    const bars = Array.from(tiny.svg.querySelectorAll("path")).map(function (path) { return path.getBBox(); });
    const isTinyShown = (bars.length === 2 && bars[1].height >= GraphBoxDefaults.style.bar.minLength);
    tiny.remove();

    check("GraphBox: stacked areas: each one is on the one before it, a tiny value of a stack still shows", isOverFirst && isTinyShown, JSON.stringify(lines) + " base " + base + " " + JSON.stringify(bars));
});

test("GraphBox: horizontal: the bars grow to the right, the mouse finds the place from its height, setters work", async function () {
    const chart = GraphBox({ width: 500, height: 260, type: "bar", horizontal: 1, labels: ["A", "B"], values: [50, 100], maxValue: 100 });
    await wait(30);
    const bars = Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getBBox(); });
    const isLengthRight = Math.abs(bars[1].width - bars[0].width * 2) < 1 && Math.abs(bars[0].x - bars[1].x) < 0.1;
    const isOrderRight = bars[0].y < bars[1].y;
    graphBoxMoveMouse(chart, bars[1].x + 4, bars[1].y + 4);
    const titleAtSecond = chart.lblTooltipTitle.elem.textContent;
    graphBoxMoveMouse(chart, bars[0].x + 300, bars[0].y + 4); // Past the end of the bar, at its height
    const titleAtFirst = chart.lblTooltipTitle.elem.textContent;
    chart.setHorizontal(0);
    const upright = chart.svg.querySelector("path").getBBox();
    check("GraphBox: horizontal: the bars grow to the right, the mouse finds the place from its height, setters work",
        isLengthRight && isOrderRight && titleAtSecond === "B" && titleAtFirst === "A" && upright.height > upright.width,
        JSON.stringify(bars) + " " + titleAtSecond + titleAtFirst);
    chart.remove();
});

test("GraphBox: pie: the slices take the whole circle by their values, the mouse finds its slice", async function () {
    const chart = GraphBox({ width: 500, height: 300, type: "pie", legend: "none", labels: ["A", "B", "C", "D"], values: [50, 25, 25, 0] });
    await wait(30);
    const slices = chart.svg.querySelectorAll("path");
    const size = Math.min(chart.plot.elem.clientWidth, chart.plot.elem.clientHeight);
    const centerX = chart.plot.elem.clientWidth / 2;
    const centerY = chart.plot.elem.clientHeight / 2;
    const radius = size / 4;
    const titleAt = function (x, y) {
        graphBoxMoveMouse(chart, x, y);
        return (chart.tooltip.visible == 1) ? chart.lblTooltipTitle.elem.textContent : "";
    };
    // Clockwise from the top: A takes the right half, B the bottom left, C the top left.
    const titles = [titleAt(centerX + radius, centerY), titleAt(centerX - radius / 2, centerY + radius), titleAt(centerX - radius / 2, centerY - radius), titleAt(1, 1)].join(",");
    check("GraphBox: pie: the slices take the whole circle by their values, the mouse finds its slice", slices.length === 3 && titles === "A,B,C,", slices.length + " slices, " + titles);
    chart.remove();
});

test("GraphBox: a doughnut has a hole the mouse passes through, one slice is a whole ring, the share is in the tooltip", async function () {
    const chart = GraphBox({ width: 500, height: 300, type: "doughnut", legend: "none", labels: ["A", "B"], values: [30, 90], centerText: "120" });
    await wait(30);
    const centerX = chart.plot.elem.clientWidth / 2;
    const centerY = chart.plot.elem.clientHeight / 2;
    graphBoxMoveMouse(chart, centerX, centerY);
    const isHoleEmpty = (chart.tooltip.visible == 0);
    const box = chart.svg.querySelector("path").getBBox();
    graphBoxMoveMouse(chart, centerX + chart.plot.elem.clientHeight * 0.35, centerY - 40);
    const readout = chart.tooltip.elem.innerText;
    const isShareShown = (readout.includes("30") && readout.includes("25%"));
    const hasCenterText = Array.from(chart.svg.querySelectorAll("text")).some(function (text) { return text.textContent === "120"; });
    pointer(chart.plot.elem, "pointerleave", 0, 0, "mouse");
    chart.setValues([30, 0]);
    const ring = chart.svg.querySelector("path");
    const isWholeRing = (chart.svg.querySelectorAll("path").length === 1 && (ring.getAttribute("d").match(/M/g) || []).length === 2 && ring.getBBox().width > box.width);
    check("GraphBox: a doughnut has a hole the mouse passes through, one slice is a whole ring, the share is in the tooltip", isHoleEmpty && isShareShown && hasCenterText && isWholeRing, [isHoleEmpty, readout, hasCenterText, isWholeRing].join(" | "));
    chart.remove();
});

test("GraphBox: the legend hides a slice and it stays hidden when the values come again, the colors stay", async function () {
    const chart = GraphBox({ width: 500, height: 300, type: "pie", labels: ["A", "B", "C"], values: [1, 1, 1] });
    await wait(30);
    const getColors = function () {
        return Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getAttribute("fill"); }).join(",");
    };
    const colorsAtStart = getColors().split(",");
    chart.legendItems[0].elem.click();
    const afterHide = getColors();
    chart.setValues([2, 3, 4]);
    const afterValues = getColors();
    chart.legendItems[0].elem.click();
    const afterShow = getColors();
    const expectedHidden = colorsAtStart[1] + "," + colorsAtStart[2];
    check("GraphBox: the legend hides a slice and it stays hidden when the values come again, the colors stay", afterHide === expectedHidden && afterValues === expectedHidden && afterShow === colorsAtStart.join(","), [colorsAtStart, afterHide, afterValues, afterShow].join(" | "));
    chart.remove();
});

test("GraphBox: a pie with no values, or wrong values, draws no NaN, a very small slice is still there", async function () {
    const sets = [[], [0, 0], [null, null], [-5, -1], ["a", "b"], [5], [100, 0.001, 0.001]];
    const wrong = [];
    ["pie", "doughnut"].forEach(function (type) {
        sets.forEach(function (values, setIndex) {
            const chart = GraphBox({ width: 300, height: 200, type: type, labels: ["A", "B", "C"].slice(0, values.length), values: values });
            if (/NaN|Infinity|undefined/.test(chart.svg.innerHTML)) wrong.push(type + " " + setIndex);
            if (setIndex === 6 && chart.svg.querySelectorAll("path").length !== 3) wrong.push(type + " small slice");
            if (setIndex < 5 && chart.lblEmpty.visible != 1) wrong.push(type + " empty text " + setIndex);
            chart.remove();
        });
    });
    check("GraphBox: a pie with no values, or wrong values, draws no NaN, a very small slice is still there", wrong.length === 0, wrong.join(", "));
});

test("GraphBox: a pie moves its legend under it in a narrow box, with no error of the observer", async function () {
    const chart = GraphBox({ width: 600, height: 300, type: "pie", labels: ["A", "B"], values: [1, 1] });
    await wait(50);
    const isSideAtStart = chart.body.css.flexDirection === "row-reverse";
    chart.width = 300;
    await wait(80);
    const isUnderAfter = chart.body.css.flexDirection === "column-reverse";
    const plotSize = Number(chart.svg.getAttribute("width"));
    chart.remove();
    check("GraphBox: a pie moves its legend under it in a narrow box, with no error of the observer", isSideAtStart && isUnderAfter && plotSize <= 300 && uncaught.length === 0, [isSideAtStart, isUnderAfter, plotSize, uncaught.join("|")].join(" "));
});

test("GraphBox: radar: a point is as far from the center as its value, the mouse finds the spoke, stacked changes nothing", async function () {
    const chart = GraphBox({ width: 500, height: 320, type: "radar", stacked: 1, legend: "none", labels: ["A", "B", "C", "D"], maxValue: 100, datasets: [{ label: "One", data: [100, 50, 100, 50] }] });
    await wait(30);
    const points = Array.from(chart.svg.querySelectorAll("circle")).map(function (dot) { return { x: Number(dot.getAttribute("cx")), y: Number(dot.getAttribute("cy")) }; });
    const center = { x: chart.plot.elem.clientWidth / 2, y: chart.plot.elem.clientHeight / 2 };
    const distances = points.map(function (point) { return Math.hypot(point.x - center.x, point.y - center.y); });
    const isDistanceRight = points.length === 4 && Math.abs(distances[0] - distances[1] * 2) < 1 && Math.abs(distances[0] - distances[2]) < 1;
    const isTopFirst = points.length === 4 && Math.abs(points[0].x - center.x) < 1 && points[0].y < center.y;
    graphBoxMoveMouse(chart, center.x + 60, center.y - 2);
    const titleAtRight = chart.lblTooltipTitle.elem.textContent;
    check("GraphBox: radar: a point is as far from the center as its value, the mouse finds the spoke, stacked changes nothing", isDistanceRight && isTopFirst && titleAtRight === "B", JSON.stringify(distances) + " " + titleAtRight);
    chart.remove();
});

test("GraphBox: scatter: the mouse only has to be near a point, a name of a point is its title, wrong values are skipped", async function () {
    const chart = GraphBox({
        width: 500, height: 320, type: "scatter", legend: "none",
        datasets: [{ label: "Group", data: [{ x: 10, y: 10, label: "<b>First</b>" }, [20, 30], { x: "a", y: 1 }, null, [30, 20]] }],
    });
    await wait(30);
    const dots = Array.from(chart.svg.querySelectorAll("circle"));
    const first = { x: Number(dots[0].getAttribute("cx")), y: Number(dots[0].getAttribute("cy")) };
    graphBoxMoveMouse(chart, first.x + 8, first.y - 8);
    const isFound = (chart.tooltip.visible == 1 && chart.lblTooltipTitle.elem.textContent === "<b>First</b>");
    graphBoxMoveMouse(chart, first.x + 60, first.y - 90);
    const secondTitle = chart.lblTooltipTitle.elem.textContent;
    const isFar = (chart.tooltip.visible == 0 || secondTitle === "Group");
    check("GraphBox: scatter: the mouse only has to be near a point, a name of a point is its title, wrong values are skipped", dots.length === 3 && isFound && isFar, dots.length + " " + chart.lblTooltipTitle.elem.textContent);
    chart.remove();
});

test("GraphBox: bubble: the area of a bubble follows its value", async function () {
    const chart = GraphBox({ width: 500, height: 320, type: "bubble", legend: "none", datasets: [{ data: [[1, 1, 100], [2, 2, 25]] }] });
    const radiuses = Array.from(chart.svg.querySelectorAll("circle")).map(function (dot) { return Number(dot.getAttribute("r")); });
    check("GraphBox: bubble: the area of a bubble follows its value", radiuses.length === 2 && Math.abs(radiuses[0] / radiuses[1] - 2) < 0.01 && radiuses[0] === GraphBoxDefaults.style.scatter.maxBubble, radiuses.join(","));
    chart.remove();
});

test("GraphBox: radar, scatter and bubble with no data or wrong values draw no NaN", async function () {
    const sets = [
        { labels: [], datasets: [] },
        { labels: ["A"], values: [null] },
        { labels: ["A", "B"], values: [0, 0] },
        { labels: ["A", "B", "C"], values: [5, null, "x"] },
        { datasets: [{ data: [{ x: 1, y: 1 }] }] },
        { datasets: [{ data: [[1, 1, 0], [1, 1, 0]] }] },
        { datasets: [{ data: [null, "x", { x: "a" }] }] },
    ];
    const wrong = [];
    ["radar", "scatter", "bubble"].forEach(function (type) {
        sets.forEach(function (set, setIndex) {
            const chart = GraphBox(Object.assign({ width: 300, height: 200, type: type }, set));
            if (/NaN|Infinity|undefined/.test(chart.svg.innerHTML)) wrong.push(type + " " + setIndex);
            chart.remove();
        });
    });
    check("GraphBox: radar, scatter and bubble with no data or wrong values draw no NaN", wrong.length === 0, wrong.join(", "));
});

test("GraphBox: a value over a fixed limit stays in the plot, the titles of the axes take their own room", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "bar", labels: ["A", "B"], values: [50, 500], maxValue: 100 });
    const bars = Array.from(chart.svg.querySelectorAll("path")).map(function (path) { return path.getBBox(); });
    const axisLines = Array.from(chart.svg.querySelectorAll("line")).map(function (axisLine) { return Number(axisLine.getAttribute("y1")); });
    const plotTop = axisLines[axisLines.length - 2];
    const isCapped = (Math.abs(bars[1].y - plotTop) <= 1);

    const barLeftWithout = bars[0].x;
    chart.setAxisTexts("Under", "Side");
    const texts = Array.from(chart.svg.querySelectorAll("text")).map(function (label) { return label.textContent; });
    const movedBar = chart.svg.querySelector("path").getBBox();
    const isTitleShown = (texts.includes("Under") && texts.includes("Side") && movedBar.x > barLeftWithout - 8 && movedBar.height < bars[0].height);
    check("GraphBox: a value over a fixed limit stays in the plot, the titles of the axes take their own room", isCapped && isTitleShown, [bars[1].y, plotTop, movedBar.height, bars[0].height].join(" "));
    chart.remove();
});

test("GraphBox: showValues: a value only where it fits, nothing over the title, a text never in the data color", async function () {
    const wide = GraphBox({ width: 400, height: 240, type: "bar", showValues: 1, labels: ["A", "B"], values: [100, 200], maxValue: 200 });
    const wideTexts = Array.from(wide.svg.querySelectorAll("text")).filter(function (label) { return label.textContent === "100" || label.textContent === "200"; });
    const axisTop = Number(Array.from(wide.svg.querySelectorAll("line")).slice(-2)[0].getAttribute("y1"));
    const topValue = Array.from(wide.svg.lastChild.querySelectorAll("text")).find(function (label) { return label.textContent === "200"; });
    const isRoomKept = (topValue && Number(topValue.getAttribute("y")) > 0 && axisTop > 14);
    const isTextColor = (topValue && topValue.getAttribute("fill") === GraphBox.THEMES.light.textColor);
    wide.remove();

    const narrow = GraphBox({ width: 160, height: 240, type: "bar", showValues: 1, labels: ["A", "B", "C", "D", "E", "F"], values: [10000000, 2000000, 3000000, 4000000, 5000000, 6000000] });
    const narrowValues = narrow.svg.lastChild.querySelectorAll("text").length;
    narrow.remove();

    const stack = GraphBox({ width: 400, height: 300, type: "bar", stacked: 1, showValues: 1, legend: "none", labels: ["A"], datasets: [{ label: "Big", data: [90] }, { label: "Tiny", data: [1] }] });
    const stackValues = Array.from(stack.svg.lastChild.querySelectorAll("text")).map(function (label) { return label.textContent; }).join(",");
    stack.remove();

    const lines = GraphBox({ width: 400, height: 240, type: "line", showValues: 1, labels: ["A", "B"], datasets: [{ label: "One", data: [1, 50] }, { label: "Two", data: [1, 50] }, { label: "Three", data: [1, 10] }] });
    const lineValues = Array.from(lines.svg.lastChild.querySelectorAll("text")).map(function (label) { return label.textContent; }).join(",");
    lines.remove();

    check("GraphBox: showValues: a value only where it fits, nothing over the title, a text never in the data color",
        wideTexts.length >= 2 && isRoomKept && isTextColor && narrowValues === 0 && stackValues === "90" && lineValues === "50,10",
        [wideTexts.length, isRoomKept, isTextColor, narrowValues, stackValues, lineValues].join(" | "));
});

test("GraphBox: the text in a colored mark is white or ink, by its color", async function () {
    const pairs = [["#2A78D6", "#FFFFFF"], ["#008300", "#FFFFFF"], ["#EDA100", "#0B0B0B"], ["#1BAF7A", "#0B0B0B"], ["white", "#0B0B0B"], ["rgb(0, 0, 0)", "#FFFFFF"]];
    const wrong = pairs.filter(function (pair) { return GraphBox.getTextColorOn(pair[0]) !== pair[1]; });
    check("GraphBox: the text in a colored mark is white or ink, by its color", wrong.length === 0, wrong.join(" | "));
});

test("GraphBox: the table has every value, a name is plain text, and it follows the data", async function () {
    const chart = GraphBox({
        width: 400, height: 240, type: "bar", tableHeadText: "Quarter",
        labels: ["<b>Q1</b>", "Q2"],
        datasets: [{ label: "2025", data: [12, null] }, { label: "2026", data: [15, 22], hidden: 1 }],
    });
    const dataAtStart = chart.getTableData();
    const isDataRight = (JSON.stringify(dataAtStart) === JSON.stringify({ head: ["Quarter", "2025"], rows: [["<b>Q1</b>", "12"], ["Q2", ""]] }));
    chart.setTableView(1);
    await wait(30);
    const hasPlainName = (chart.tableBox.elem.querySelector("b") === null && chart.tableBox.elem.textContent.includes("<b>Q1</b>"));
    const isPlotHidden = (chart.plot.visible == 0 && chart.tableBox.elem.getBoundingClientRect().height > 0);
    chart.setValues([99, 98]);
    const isFollowing = chart.tableBox.elem.textContent.includes("99");
    chart.setTableView(0);
    await wait(30);
    const isBack = (chart.plot.visible == 1 && chart.tableBox === null && chart.svg.querySelectorAll("path").length === 2);
    check("GraphBox: the table has every value, a name is plain text, and it follows the data", isDataRight && hasPlainName && isPlotHidden && isFollowing && isBack, [JSON.stringify(dataAtStart), hasPlainName, isPlotHidden, isFollowing, isBack].join(" | "));
    chart.remove();
});

test("GraphBox: the table of a pie has the share, of a scatter its axes", async function () {
    const pie = GraphBox({ width: 400, height: 240, type: "pie", labels: ["A", "B"], values: [30, 90] });
    const pieRows = JSON.stringify(pie.getTableData().rows);
    pie.remove();
    const scatter = GraphBox({ width: 400, height: 240, type: "bubble", xAxisText: "X", yAxisText: "Y", sizeText: "S", datasets: [{ label: "G", data: [[1, 2, 3]] }] });
    const scatterData = JSON.stringify(scatter.getTableData());
    scatter.remove();
    check("GraphBox: the table of a pie has the share, of a scatter its axes", pieRows === JSON.stringify([["A", "30", "25%"], ["B", "90", "75%"]]) && scatterData === JSON.stringify({ head: ["", "X", "Y", "S"], rows: [["G", "1", "2", "3"]] }), pieRows + " " + scatterData);
});

test("GraphBox: getImage() paints the card, the marks, the legend and the title on a canvas", async function () {
    const chart = GraphBox({
        width: 400, height: 240, type: "bar", titleText: "Title", labels: ["A"], legend: "top",
        datasets: [{ label: "One", data: [100], color: "#FF0000" }],
    });
    await wait(30);
    const canvas = chart.getCanvas(1);
    const context = canvas.getContext("2d");
    const bar = chart.svg.querySelector("path").getBBox();
    const plotRect = chart.plot.elem.getBoundingClientRect();
    const boxRect = chart.elem.getBoundingClientRect();
    const barPixel = context.getImageData(plotRect.left - boxRect.left + bar.x + bar.width / 2, plotRect.top - boxRect.top + bar.y + bar.height / 2, 1, 1).data;
    const keyRect = chart.legendItems[0].key.elem.getBoundingClientRect();
    const keyPixel = context.getImageData(keyRect.left - boxRect.left + keyRect.width / 2, keyRect.top - boxRect.top + keyRect.height / 2, 1, 1).data;
    const titleRect = chart.lblTitle.elem.getBoundingClientRect();
    const titlePixels = context.getImageData(titleRect.left - boxRect.left, titleRect.top - boxRect.top, titleRect.width, titleRect.height).data;
    let darkPixels = 0;
    for (let i = 0; i < titlePixels.length; i += 4) { if (titlePixels[i] < 100) darkPixels++; }
    const url = chart.getImage();
    const isRed = function (pixel) { return pixel[0] > 200 && pixel[1] < 60 && pixel[2] < 60; };
    check("GraphBox: getImage() paints the card, the marks, the legend and the title on a canvas", isRed(barPixel) && isRed(keyPixel) && darkPixels > 5 && url.startsWith("data:image/png"), [Array.from(barPixel), Array.from(keyPixel), darkPixels].join(" | "));
    chart.remove();
});

test("GraphBox: animated: 0 writes no motion, animated: 1 moves a change but not the first view", async function () {
    const hasMotionStyle = function (chart) {
        return chart.svg.innerHTML.includes("transition") || chart.svg.innerHTML.includes("transform:");
    };
    const still = GraphBox({ width: 300, height: 200, type: "bar", labels: ["A", "B"], values: [1, 2] });
    still.setValues([3, 4]);
    still.addValue("C", 5);
    const isStill = !hasMotionStyle(still);
    still.remove();

    const moving = GraphBox({ width: 300, height: 200, type: "bar", animated: 1, labels: ["A", "B"], values: [1, 2] });
    const isFirstViewStill = !hasMotionStyle(moving);
    moving.setValues([3, 4]);
    const bar = moving.svg.querySelector("path");
    const isBarMoving = bar.getAnimations().length > 0;
    const barEnd = bar.getAnimations()[0];
    if (barEnd) barEnd.finish();
    const isEndRight = (getComputedStyle(bar).transform === "none");
    moving.remove();

    check("GraphBox: animated: 0 writes no motion, animated: 1 moves a change but not the first view", isStill && isFirstViewStill && isBarMoving && isEndRight, [isStill, isFirstViewStill, isBarMoving, isEndRight].join(" "));
});

test("GraphBox: animated: a new size does not move, a value of a full live chart slides in from the place of the last one", async function () {
    const chart = GraphBox({ width: 400, height: 200, type: "line", animated: 1, maxCount: 3, labels: ["A", "B", "C"], values: [1, 2, 3], maxValue: 3 });
    await wait(30);
    const markLayer = chart.svg.querySelector('g[clip-path] g');
    chart.width = 500;
    await wait(60);
    const isResizeStill = (chart.svg.getAnimations({ subtree: true }).length === 0);
    const spacing = Number(chart.svg.querySelectorAll("circle")[1].getAttribute("cx")) - Number(chart.svg.querySelectorAll("circle")[0].getAttribute("cx"));
    chart.addValue("D", 4);
    const layerMotion = markLayer.getAnimations()[0];
    let startX = null;
    if (layerMotion) {
        layerMotion.pause();
        layerMotion.currentTime = 0;
        startX = new DOMMatrix(getComputedStyle(markLayer).transform).m41;
        layerMotion.finish();
    }
    check("GraphBox: animated: a new size does not move, a value of a full live chart slides in from the place of the last one", isResizeStill && !!layerMotion && Math.abs(startX - spacing) < 1, [isResizeStill, !!layerMotion, startX, spacing].join(" "));
    chart.remove();
});

test("GraphBox: animated: the tooltip fades in where it must be, setAnimated(0) brings the still look back", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "bar", animated: 1, labels: ["A", "B"], values: [1, 2] });
    await wait(30);
    const plotWidth = chart.plot.elem.clientWidth;
    graphBoxMoveMouse(chart, plotWidth * 0.75, 60);
    const isTransformed = chart.tooltip.css.transform.includes("translate");
    const isLeftZero = (chart.tooltip.left == 0);
    pointer(chart.plot.elem, "pointerleave", 0, 0, "mouse");
    await wait(200);
    const isGone = (chart.tooltip.visible == 0);
    graphBoxMoveMouse(chart, plotWidth * 0.25, 60);
    chart.setAnimated(0);
    const isStillAgain = (chart.tooltip.css.transform === "" && chart.tooltip.css.transition === "" && Number(chart.tooltip.left) > 0);
    check("GraphBox: animated: the tooltip fades in where it must be, setAnimated(0) brings the still look back", isTransformed && isLeftZero && isGone && isStillAgain, [isTransformed, isLeftZero, isGone, isStillAgain].join(" "));
    chart.remove();
});

test("GraphBox: Enter on a legend item hides its dataset and the item keeps the focus, a dataset added by hand has no error", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "line", labels: ["A", "B"], datasets: [{ label: "One", data: [1, 2] }, { label: "Two", data: [3, 4] }] });
    const item = chart.legendItems[0];
    item.elem.focus();
    key(item.elem, "keydown", "Enter");
    const isSameObject = (chart.legendItems[0] === item && document.activeElement === item.elem);
    const isHidden = (chart.data.datasets[0].hidden == 1 && item.elem.getAttribute("aria-pressed") === "false");
    chart.data.datasets.push({ label: "By hand" });
    chart.update();
    const isItemAdded = (chart.legendItems.length === 3);
    check("GraphBox: Enter on a legend item hides its dataset and the item keeps the focus, a dataset added by hand has no error", isSameObject && isHidden && isItemAdded, [isSameObject, isHidden, isItemAdded].join(" "));
    chart.remove();
});

test("GraphBox: Enter on a place gives the first dataset on the screen, a long name stays in the tooltip", async function () {
    const clicks = [];
    const chart = GraphBox({
        width: 240, height: 200, type: "bar", legend: "none",
        labels: ["A label that is much longer than this small chart can show"],
        datasets: [{ label: "Hidden", data: [1], hidden: 1 }, { label: "A dataset with a long name, longer than the box", data: [2] }],
        onClick: function (self, item) { clicks.push(item.datasetIndex); },
    });
    await wait(30);
    key(chart.plot.elem, "keydown", "ArrowRight");
    key(chart.plot.elem, "keydown", "Enter");
    const boxRect = chart.elem.getBoundingClientRect();
    const tipRect = chart.tooltip.elem.getBoundingClientRect();
    const isInside = (tipRect.left >= boxRect.left && tipRect.right <= boxRect.right && chart.tooltip.visible == 1);
    check("GraphBox: Enter on a place gives the first dataset on the screen, a long name stays in the tooltip", clicks[0] === 1 && isInside, clicks.join(",") + " " + [tipRect.left, tipRect.right, boxRect.left, boxRect.right].join(" "));
    chart.remove();
});

test("GraphBox: the value of a negative bar does not touch the labels, a legend of many lines starts at its first line", async function () {
    const textBoxOf = function (chart, name) {
        const label = Array.from(chart.svg.querySelectorAll("text")).find(function (candidate) { return candidate.textContent === name; });
        return label.getBoundingClientRect();
    };
    const upright = GraphBox({ width: 400, height: 240, type: "bar", showValues: 1, legend: "none", labels: ["A", "B"], values: [10, -20], minValue: -20 });
    await wait(30);
    const isUnderFree = (textBoxOf(upright, "-20").bottom <= textBoxOf(upright, "B").top + 1);
    upright.remove();

    const sideways = GraphBox({ width: 400, height: 240, type: "bar", horizontal: 1, showValues: 1, legend: "none", labels: ["Name", "Other"], values: [10, -20], minValue: -20 });
    await wait(30);
    const isSideFree = (textBoxOf(sideways, "Other").right <= textBoxOf(sideways, "-20").left + 1);
    sideways.remove();

    const labels = [];
    for (let i = 0; i < 40; i++) labels.push("Slice number " + i);
    const pie = GraphBox({ width: 300, height: 260, type: "pie", labels: labels, values: labels.map(function () { return 1; }) });
    await wait(30);
    const groupTop = pie.legendGroup.elem.getBoundingClientRect().top;
    const firstTop = pie.legendItems[0].elem.getBoundingClientRect().top;
    const isFirstLineSeen = (firstTop >= groupTop - 1);
    pie.remove();

    check("GraphBox: the value of a negative bar does not touch the labels, a legend of many lines starts at its first line", isUnderFree && isSideFree && isFirstLineSeen, [isUnderFree, isSideFree, isFirstLineSeen].join(" "));
});

test("GraphBox: whenReady() runs at once, as a page of ChartBox expects it to run", async function () {
    const chart = GraphBox({ width: 300, height: 200, labels: ["A"], values: [1] });
    let readyChart = null;
    chart.whenReady(function (self) { readyChart = self; });
    check("GraphBox: whenReady() runs at once, as a page of ChartBox expects it to run", readyChart === chart);
    chart.remove();
});

test("GraphBox: a target line is on its value, the axis holds it, the tooltip shows it, no label: its value", async function () {
    const chart = GraphBox({ width: 400, height: 260, type: "bar", legend: "none", labels: ["A", "B"], values: [10, 20], targetLines: [{ value: 50, label: "Goal" }, { value: 25 }] });
    await wait(30);
    const texts = Array.from(chart.svg.querySelectorAll("text")).map(function (label) { return label.textContent; });
    const lines = Array.from(chart.svg.querySelectorAll("line"));
    const targets = lines.filter(function (line) { return line.getAttribute("stroke-dasharray"); });
    const axisLines = lines.filter(function (line) { return !line.getAttribute("stroke-dasharray"); }).map(function (line) { return Number(line.getAttribute("y1")); });
    const tickTop = axisLines[axisLines.length - 2];
    const base = axisLines[0];
    const expectedY = base - (base - tickTop); // 50 is the top tick
    const isOnValue = (targets.length === 2 && Math.abs(Number(targets[0].getAttribute("y1")) - expectedY) <= 1);
    const isSecondOnValue = (targets.length === 2 && Math.abs(Number(targets[1].getAttribute("y1")) - (base - (base - tickTop) / 2)) <= 1);
    const bar = chart.svg.querySelector("path").getBBox();
    graphBoxMoveMouse(chart, bar.x + 2, bar.y + 2);
    const readout = chart.tooltip.elem.innerText;
    check("GraphBox: a target line is on its value, the axis holds it, the tooltip shows it, no label: its value",
        isOnValue && isSecondOnValue && texts.includes("Goal") && texts.includes("25") && readout.includes("Goal") && readout.includes("50"),
        [isOnValue, isSecondOnValue, texts.join(","), readout].join(" | "));
    chart.remove();
});

test("GraphBox: a target line stands up on a sideways chart, one out of a fixed limit is not drawn, empty data draws none", async function () {
    const sideways = GraphBox({ width: 400, height: 260, type: "bar", horizontal: 1, legend: "none", labels: ["A"], values: [10], maxValue: 100, targetLines: [{ value: 50, label: "Goal" }, { value: 500, label: "Out" }] });
    const targets = Array.from(sideways.svg.querySelectorAll("line")).filter(function (line) { return line.getAttribute("stroke-dasharray"); });
    const isStanding = (targets.length === 1 && targets[0].getAttribute("x1") === targets[0].getAttribute("x2") && targets[0].getAttribute("y1") !== targets[0].getAttribute("y2"));
    sideways.remove();

    const empty = GraphBox({ width: 400, height: 260, type: "line", labels: [], values: [], targetLines: [{ value: 50, label: "Goal" }] });
    const isEmptyStill = (empty.svg.querySelectorAll("line").length === 0 && empty.lblEmpty.visible == 1);
    empty.remove();

    const scatter = GraphBox({ width: 400, height: 260, type: "scatter", legend: "none", datasets: [{ data: [[1, 2], [2, 3]] }], targetLines: [{ value: 9, label: "Goal" }] });
    const hasScatterLine = Array.from(scatter.svg.querySelectorAll("line")).some(function (line) { return line.getAttribute("stroke-dasharray"); });
    scatter.setTargetLines([]);
    const isRemoved = !Array.from(scatter.svg.querySelectorAll("line")).some(function (line) { return line.getAttribute("stroke-dasharray"); });
    scatter.remove();

    check("GraphBox: a target line stands up on a sideways chart, one out of a fixed limit is not drawn, empty data draws none", isStanding && isEmptyStill && hasScatterLine && isRemoved, [isStanding, isEmptyStill, hasScatterLine, isRemoved].join(" "));
});

test("GraphBox: too many slices: the smallest are Other, every color is free, the table keeps them all, maxSlices: 0 turns it off", async function () {
    const labels = [];
    const values = [];
    for (let i = 0; i < 14; i++) {
        labels.push("L" + i);
        values.push(i + 1); // The biggest are the last ones.
    }
    const chart = GraphBox({ width: 500, height: 320, type: "pie", labels: labels, values: values, otherText: "Rest" });
    await wait(30);
    const slices = Array.from(chart.svg.querySelectorAll("path"));
    const fills = slices.map(function (slice) { return slice.getAttribute("fill"); });
    const themeColors = GraphBox.THEMES.light.colors;
    const isEightSlices = (slices.length === 8);
    const areColorsFree = (new Set(fills).size === 8);
    const isOtherGray = (fills[fills.length - 1] === GraphBox.THEMES.light.otherColor);
    const areKeptInTheme = fills.slice(0, 7).every(function (fill) { return themeColors.includes(fill); });
    const legendTexts = chart.legendItems.map(function (item) { return item.label.elem.textContent; }).join(",");
    const isLegendRight = (legendTexts === "L7,L8,L9,L10,L11,L12,L13,Rest");
    const tableRows = chart.getTableData().rows.length;

    chart.setMaxSlices(0);
    const allSlices = chart.svg.querySelectorAll("path").length;
    check("GraphBox: too many slices: the smallest are Other, every color is free, the table keeps them all, maxSlices: 0 turns it off",
        isEightSlices && areColorsFree && isOtherGray && areKeptInTheme && isLegendRight && tableRows === 14 && allSlices === 14,
        [isEightSlices, areColorsFree, isOtherGray, areKeptInTheme, legendTexts, tableRows, allSlices].join(" | "));
    chart.remove();
});

test("GraphBox: Other: its tooltip names the small slices, the legend hides it, a click gives them, the other colors stay", async function () {
    const clicks = [];
    const chart = GraphBox({
        width: 500, height: 320, type: "pie", maxSlices: 3,
        labels: ["Big", "Small A", "Small B", "Small C", "Middle"],
        values: [50, 3, 2, 1, 40],
        onClick: function (self, item) { clicks.push(item); },
    });
    await wait(30);
    const keptColors = Array.from(chart.svg.querySelectorAll("path")).slice(0, 2).map(function (slice) { return slice.getAttribute("fill"); }).join(",");
    // The last slice ends at the top: "Other" is just left of the top of the pie.
    const centerX = chart.plot.elem.clientWidth / 2;
    const centerY = chart.plot.elem.clientHeight / 2;
    const radius = Math.min(chart.plot.elem.clientWidth, chart.plot.elem.clientHeight) / 2;
    const titleAtOther = (function () {
        for (let share = 0.005; share < 0.06; share += 0.005) {
            const angle = -Math.PI / 2 - share * Math.PI * 2;
            graphBoxMoveMouse(chart, centerX + Math.cos(angle) * radius * 0.7, centerY + Math.sin(angle) * radius * 0.7);
            if (chart.tooltip.visible == 1 && chart.lblTooltipTitle.elem.textContent === "Other") return "Other";
        }
        return chart.lblTooltipTitle.elem.textContent;
    })();
    const readout = chart.tooltip.elem.innerText;
    chart.plot.elem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const click = clicks[0] || {};
    pointer(chart.plot.elem, "pointerleave", 0, 0, "mouse");
    const isClickRight = (click.label === "Other" && click.value === 6 && click.index === GraphBox.OTHER_SLICE && click.otherItems.length === 3 && click.otherItems[0].label === "Small A");

    chart.setSliceVisible(GraphBox.OTHER_SLICE, 0);
    const afterHide = Array.from(chart.svg.querySelectorAll("path")).map(function (slice) { return slice.getAttribute("fill"); }).join(",");
    const tableAfterHide = chart.getTableData().rows.length;
    check("GraphBox: Other: its tooltip names the small slices, the legend hides it, a click gives them, the other colors stay",
        titleAtOther === "Other" && readout.includes("Small A") && readout.includes("Small C") && isClickRight && afterHide === keptColors && tableAfterHide === 2,
        [titleAtOther, readout, isClickRight, afterHide, keptColors, tableAfterHide].join(" | "));
    chart.remove();
});

test("GraphBox: a slice keeps its color when the values change which ones are Other", async function () {
    const chart = GraphBox({ width: 500, height: 320, type: "pie", maxSlices: 3, labels: ["A", "B", "C", "D"], values: [40, 30, 2, 1] });
    const colorOf = function (name) {
        const item = chart.legendItems.find(function (legendItem) { return legendItem.label.elem.textContent === name; });
        return (item) ? item.key.color : "";
    };
    const colorOfB = colorOf("B");
    chart.setValues([1, 30, 40, 2]); // A goes into Other, C comes out of it.
    const isKept = (colorOf("B") === colorOfB && colorOf("C") !== colorOfB && colorOf("C") !== "" && colorOf("A") === "");
    check("GraphBox: a slice keeps its color when the values change which ones are Other", isKept, [colorOfB, colorOf("B"), colorOf("C"), colorOf("A")].join(" | "));
    chart.remove();
});

test("GraphBox: maxLabels: at most so many labels on the index axis", async function () {
    const labels = [];
    for (let i = 0; i < 96; i++) labels.push("L" + i);
    const chart = GraphBox({ width: 700, height: 240, type: "line", legend: "none", maxLabels: 9, labels: labels, values: labels.map(function (label, i) { return i; }) });
    const shown = Array.from(chart.svg.querySelectorAll("text")).filter(function (label) { return /^L\d+$/.test(label.textContent); }).map(function (label) { return label.textContent; });
    check("GraphBox: maxLabels: at most so many labels on the index axis", shown.length <= 9 && shown.length >= 8 && shown[0] === "L0" && shown[1] === "L11", shown.join(","));
    chart.remove();
});

test("GraphBox: a long subtitle goes on the next line and stays whole, the picture writes it on its lines too", async function () {
    const sentence = "Every fifteen minutes the battery is plus when charging and minus when it is discharging in this chart";
    const chart = GraphBox({ width: 240, height: 300, type: "bar", titleText: "Title", subtitleText: sentence, labels: ["A"], values: [1] });
    await wait(30);
    const label = chart.lblSubtitle.elem;
    const isWhole = (label.scrollWidth <= label.clientWidth + 1 && label.getBoundingClientRect().height > 20);
    const context = document.createElement("canvas").getContext("2d");
    context.font = "12px opensans";
    const lines = GraphBox.wrapText(context, sentence, 200);
    const isWrapped = (lines.length > 1 && lines.join(" ") === sentence && lines.every(function (line) { return context.measureText(line).width <= 201; }));
    const plotHeight = chart.plot.elem.clientHeight;
    check("GraphBox: a long subtitle goes on the next line and stays whole, the picture writes it on its lines too", isWhole && isWrapped && plotHeight > 50, [isWhole, isWrapped, plotHeight].join(" "));
    chart.remove();
});

test("GraphBox: animated: where a line can not move, the line and its points fade together; a bar still moves", async function () {
    const realCheck = GraphBox.canMovePaths;
    GraphBox.canMovePaths = function () { return false; };
    const motionsOf = function (shape) {
        return shape.getAnimations().map(function (motion) { return motion.transitionProperty; }).join(",");
    };
    const chart = GraphBox({ width: 400, height: 240, type: "bar", animated: 1, labels: ["A", "B", "C"], datasets: [{ label: "Bars", data: [1, 2, 3] }, { label: "Line", type: "line", data: [3, 2, 1] }] });
    chart.data.datasets[0].data = [3, 1, 2];
    chart.data.datasets[1].data = [1, 3, 2];
    chart.update();
    const bar = chart.svg.querySelector('path[d*="Q"]');
    const line = chart.svg.querySelector('path[fill="none"]');
    const dot = chart.svg.querySelector("circle");
    const results = [motionsOf(bar), motionsOf(line), motionsOf(dot)].join(" | ");
    chart.remove();
    GraphBox.canMovePaths = realCheck;
    check("GraphBox: animated: where a line can not move, the line and its points fade together; a bar still moves", results === "transform | opacity | opacity", results);
});

test("GraphBox: valueStep: a line for every step, a step too small for the axis is not used, a soft limit widens the axis but a value can pass it", async function () {
    const stepTicks = GraphBox.niceScale(0, 4, 2, 1).ticks.join(",");
    const halfTicks = GraphBox.niceScale(0, 1, 2, 0.25).ticks.join(",");
    const hugeCount = GraphBox.niceScale(0, 1000000000, 4, 1).ticks.length;

    const tickTextsOf = function (chart) {
        return Array.from(chart.svg.querySelectorAll("text")).map(function (label) { return label.textContent; });
    };
    const floors = GraphBox({
        width: 400, height: 300, type: "line", legend: "none", labels: ["A", "B"], values: [1, 3],
        minValue: 0, maxValue: 4, valueStep: 1,
        formatValue: function (value) { return ["B1", "L", "2", "3", "4"][value]; },
    });
    const floorTexts = tickTextsOf(floors);
    floors.remove();

    const soft = GraphBox({ width: 400, height: 300, type: "line", legend: "none", labels: ["A", "B"], values: [10, 20], softMaxValue: 260 });
    const softTexts = tickTextsOf(soft);
    soft.setValues([10, 400]);
    const passedTexts = tickTextsOf(soft);
    soft.remove();

    const isSoftRight = (softTexts.includes("250") || softTexts.includes("300")) && (passedTexts.includes("400"));
    check("GraphBox: valueStep: a line for every step, a step too small for the axis is not used, a soft limit widens the axis but a value can pass it",
        stepTicks === "0,1,2,3,4" && halfTicks === "0,0.25,0.5,0.75,1" && hugeCount < 50 && floorTexts.includes("B1") && floorTexts.includes("L") && floorTexts.includes("4") && isSoftRight,
        [stepTicks, halfTicks, hugeCount, floorTexts.join(","), softTexts.join(","), passedTexts.join(",")].join(" | "));
});

test("GraphBox: fillTo: start: an area under 0 ends at the start of the axis, by default at 0", async function () {
    const areaBoxOf = function (params) {
        // WHY the limits: Values that touch both ends of the axis fill the whole height, with any area.
        const chart = GraphBox(Object.assign({ width: 400, height: 300, type: "line", legend: "none", beginAtZero: 0, showPoints: 0, minValue: -30, maxValue: 0, labels: ["A", "B"] }, params));
        const areaBox = chart.svg.querySelector("path").getBBox(); // The area is drawn first.
        const lineBox = chart.svg.querySelectorAll("path")[1].getBBox();
        chart.remove();
        return { areaTop: areaBox.y, areaBottom: areaBox.y + areaBox.height, lineTop: lineBox.y, lineBottom: lineBox.y + lineBox.height };
    };
    const toStart = areaBoxOf({ datasets: [{ data: [-18, -16], fill: 1, fillTo: "start" }] });
    const toBase = areaBoxOf({ datasets: [{ data: [-18, -16], fill: 1 }] });
    const isUnderLine = (Math.abs(toStart.areaTop - toStart.lineTop) < 1 && toStart.areaBottom > toStart.lineBottom);
    const isOverLine = (toBase.areaBottom <= toBase.lineBottom + 1 && toBase.areaTop < toBase.lineTop);
    check("GraphBox: fillTo: start: an area under 0 ends at the start of the axis, by default at 0", isUnderLine && isOverLine, JSON.stringify([toStart, toBase]));
});

test("GraphBox: showInLegend: 0 takes a dataset out of the legend, it is still drawn; the legend comes back with it", async function () {
    const chart = GraphBox({ width: 400, height: 300, type: "line", legend: "top", showPoints: 0, labels: ["A", "B"], datasets: [{ label: "One", data: [1, 2] }, { label: "Two", data: [3, 4], showInLegend: 0 }] });
    const itemsAtStart = chart.legendItems.length;
    const linesAtStart = chart.svg.querySelectorAll("path").length;
    chart.data.datasets[1].showInLegend = 1;
    chart.update();
    check("GraphBox: showInLegend: 0 takes a dataset out of the legend, it is still drawn; the legend comes back with it", itemsAtStart === 1 && linesAtStart === 2 && chart.legendItems.length === 2, [itemsAtStart, linesAtStart, chart.legendItems.length].join(" "));
    chart.remove();
});

test("GraphBox: maxLabels leaves room: the labels of the bars stay flat, the last number of a sideways axis stays in the box", async function () {
    const labels = [];
    for (let i = 0; i < 30; i++) labels.push(i + " Oct");
    const bars = GraphBox({ width: 620, height: 300, type: "bar", legend: "none", maxLabels: 12, labels: labels, values: labels.map(function (label, i) { return i + 1; }) });
    const isFlat = !bars.svg.querySelector("text[transform]");
    bars.remove();

    const sideways = GraphBox({ width: 500, height: 260, type: "bar", horizontal: 1, legend: "none", labels: ["A", "B"], values: [2100, 1200], formatValue: function (value) { return "₺" + value.toLocaleString("tr-TR") + ",00"; } });
    await wait(30);
    const texts = Array.from(sideways.svg.querySelectorAll("text"));
    const lastTick = texts.filter(function (label) { return label.textContent.indexOf(",00") > 0; }).pop();
    const isInBox = (lastTick.getBBox().x + lastTick.getBBox().width <= Number(sideways.svg.getAttribute("width")) + 0.5);
    sideways.remove();

    check("GraphBox: maxLabels leaves room: the labels of the bars stay flat, the last number of a sideways axis stays in the box", isFlat && isInBox, [isFlat, isInBox].join(" "));
});

test("GraphBox: setTheme() changes the look, setStyle() keeps the other keys", async function () {
    const chart = GraphBox({ width: 400, height: 240, type: "bar", titleText: "Title", labels: ["A"], values: [1] });
    const lightColor = chart.color;
    chart.setTheme("dark");
    const darkColor = chart.color;
    const barInDark = chart.svg.querySelector("path").getAttribute("fill");
    chart.setStyle({ box: { round: 3 }, colors: { colors: ["#123456"] } });
    const barAfterStyle = chart.svg.querySelector("path").getAttribute("fill");
    const isRight = (lightColor === GraphBox.THEMES.light.backgroundColor && darkColor === GraphBox.THEMES.dark.backgroundColor &&
        barInDark === GraphBox.THEMES.dark.colors[0] && barAfterStyle === "#123456" && chart.round == 3 && chart.style.box.padding === GraphBoxDefaults.style.box.padding);
    check("GraphBox: setTheme() changes the look, setStyle() keeps the other keys", isRight, [lightColor, darkColor, barInDark, barAfterStyle].join(" | "));
    chart.remove();
});

test("GraphBox: a styleName warns once and changes nothing, theme gives the colors", async function () {
    const warn = console.warn;
    let warnings = 0;
    console.warn = function () { warnings++; };
    const wrong = GraphBox({ width: 300, height: 150, labels: ["A", "B"], values: [1, 2], styleName: "dark" });
    const right = GraphBox({ width: 300, height: 150, labels: ["A", "B"], values: [1, 2], theme: "dark" });
    console.warn = warn;
    const isRight = warnings === 1 && wrong.theme === "light" && right.theme === "dark"
        && wrong.lblTitle.textColor !== right.lblTitle.textColor;
    check("GraphBox: a styleName warns once and changes nothing, theme gives the colors", isRight,
        [warnings, wrong.theme, right.theme, wrong.lblTitle.textColor, right.lblTitle.textColor].join(" | "));
    wrong.remove();
    right.remove();
});

test("SliderField and Stepper: a value typed in a field that is removed is not sent", async function () {
    const calls = [];
    const field = SliderField({ value: 3, onChange: function () { calls.push("slider field"); } });
    field.elem.focus();
    key(field.elem, "keydown", "7"); // starts typing a value
    field.remove();
    const stepper = Stepper({ value: 1, onChange: function () { calls.push("stepper"); } });
    stepper.valueBox.elem.click(); // starts typing a value
    stepper.input.inputElement.value = "9";
    stepper.remove();
    await wait(50);
    check("SliderField and Stepper: a value typed in a field that is removed is not sent", calls.length === 0, "onChange of: " + calls.join(", "));
});

test("PhoneField: setCountryCode() keeps the number, a number filled without its code keeps its digits", async function () {
    const phone = PhoneField({ styleName: "modern", width: 300, value: "+90 (555) 123-4567" });
    phone.setCountryCode("+1");
    const changed = phone.getValue();
    const filled = PhoneField({ styleName: "modern", width: 300 });
    const el = filled.input.inputElement;
    el.value = "5551234567"; // (autofill: the digits, with no code)
    el.dispatchEvent(new Event("input", { bubbles: true }));
    check("PhoneField: setCountryCode() keeps the number, a number filled without its code keeps its digits", changed === "+1 (555) 123-4567" && filled.getValue() === "+90 (555) 123-4567", changed + ", " + filled.getValue());
    phone.remove();
    filled.remove();
});

// *** LOG VIEW (comp/log-view.js)

const logRows = function (log) {
    return Array.from(log.lineGroup.elem.children);
};

const isLogAtEnd = function (log) {
    const elem = log.scrollArea.elem;
    return elem.scrollHeight - elem.scrollTop - elem.clientHeight <= 4;
};

// WHY the event by hand: a tab in the background does not send it on time.
const scrollLog = function (log, top) {
    log.scrollArea.elem.scrollTop = top;
    log.scrollArea.elem.dispatchEvent(new Event("scroll"));
};

test("LogView: a text is shown as a text, a text of many lines is many rows, its last end of line is no row", async function () {
    const log = LogView({ left: 0, top: 0, width: 500, height: 200, showTime: 0, showLevel: 0 });
    log.addLine("<b>bold</b>");
    log.addLine("one\ntwo\n");
    log.addLine("carriage\r\nreturn");
    log.addLine("   spaces stay");
    await wait(30);
    const rows = logRows(log);
    const texts = rows.map(function (row) { return row.textContent; }).join("|");
    const hasNoElement = !log.lineGroup.elem.querySelector("b");
    const keepsSpaces = getComputedStyle(rows[5].firstChild.parentElement).whiteSpace === "pre-wrap";
    check("LogView: a text is shown as a text, a text of many lines is many rows, its last end of line is no row",
        texts === "<b>bold</b>|one|two|carriage|return|   spaces stay" && hasNoElement && keepsSpaces, texts);
    log.remove();
});

test("LogView: its time, the name of its level and a long line that wraps under its own text", async function () {
    const log = LogView({ left: 0, top: 0, width: 300, height: 200, lines: [
        { text: "Old line", level: "warn", time: "01:02:03" },
        "A long line, long enough to wrap in this narrow view, and then to wrap again",
    ] });
    const rows = logRows(log);
    const first = rows[0].textContent;
    const hasTimeNow = /^\d\d:\d\d:\d\d INFO  A long/.test(rows[1].textContent);
    const wraps = rows[1].offsetHeight > rows[0].offsetHeight;
    const indentOfFirst = parseFloat(getComputedStyle(rows[1]).textIndent);
    const paddingOfLong = parseFloat(getComputedStyle(rows[1]).paddingLeft);
    const hangs = indentOfFirst < 0 && paddingOfLong > 40;
    log.setShowTime(0);
    log.setShowLevel(0);
    const noPrefix = rows[0].textContent === "Old line" && parseFloat(getComputedStyle(rows[0]).textIndent) === 0;
    check("LogView: its time, the name of its level and a long line that wraps under its own text",
        first === "01:02:03 WARN  Old line" && hasTimeNow && wraps && hangs && noPrefix, [first, hasTimeNow, wraps, hangs, noPrefix].join(" | "));
    log.remove();
});

test("LogView: it follows the last line; a scroll up holds the view and counts the new lines; its button goes back", async function () {
    const log = LogView({ left: 0, top: 0, width: 400, height: 120 });
    for (let i = 0; i < 50; i++) log.info("Line " + i);
    await wait(30);
    const followed = isLogAtEnd(log);
    scrollLog(log, 0);
    log.info("x");
    log.warn("y");
    await wait(30);
    const held = log.scrollArea.elem.scrollTop === 0;
    const buttonText = log.btnNewLines.elem.textContent;
    const buttonShown = log.btnNewLines.elem.getClientRects().length > 0;
    log.btnNewLines.elem.click();
    const wentBack = isLogAtEnd(log) && log.btnNewLines.elem.getClientRects().length === 0;
    log.info("z");
    await wait(30);
    const followsAgain = isLogAtEnd(log);
    scrollLog(log, 0);
    log.info("w");
    await wait(30);
    scrollLog(log, log.scrollArea.elem.scrollHeight); // the reader scrolls to the end
    const buttonGoes = log.btnNewLines.elem.getClientRects().length === 0;
    check("LogView: it follows the last line; a scroll up holds the view and counts the new lines; its button goes back",
        followed && held && buttonText === "↓ 2 new" && buttonShown && wentBack && followsAgain && buttonGoes,
        [followed, held, buttonText, buttonShown, wentBack, followsAgain, buttonGoes].join(" "));
    log.remove();
});

test("LogView: autoScroll: 0 stays where it is, with no button; setAutoScroll(1) goes to the end", async function () {
    const log = LogView({ left: 0, top: 0, width: 400, height: 120, autoScroll: 0 });
    for (let i = 0; i < 50; i++) log.info("Line " + i);
    await wait(30);
    const stays = log.scrollArea.elem.scrollTop === 0;
    scrollLog(log, 10);
    log.info("x");
    await wait(30);
    const hasNoButton = log.btnNewLines.elem.getClientRects().length === 0;
    log.setAutoScroll(1);
    const atEnd = isLogAtEnd(log);
    check("LogView: autoScroll: 0 stays where it is, with no button; setAutoScroll(1) goes to the end", stays && hasNoButton && atEnd, [stays, hasNoButton, atEnd].join(" "));
    log.remove();
});

test("LogView: maxLines drops the oldest lines, and the lines being read stay in place", async function () {
    const log = LogView({ left: 0, top: 0, width: 400, height: 120, maxLines: 40 });
    for (let i = 1; i <= 60; i++) log.info("Line " + i);
    await wait(30);
    const rows = logRows(log);
    const isCut = rows.length === 40 && log.lines.length === 40 && rows[0].textContent.includes("Line 21");
    scrollLog(log, 300);
    const row = logRows(log)[25];
    const topBefore = row.getBoundingClientRect().top;
    for (let i = 61; i <= 65; i++) log.info("Line " + i);
    await wait(30);
    const topAfter = row.getBoundingClientRect().top;
    const isInPlace = Math.abs(topAfter - topBefore) <= 1 && logRows(log)[0].textContent.includes("Line 26");
    log.setMaxLines(10);
    const isCutAgain = log.lines.length === 10 && logRows(log).length === 10;
    check("LogView: maxLines drops the oldest lines, and the lines being read stay in place", isCut && isInPlace && isCutAgain, [isCut, topBefore, topAfter, isCutAgain].join(" "));
    log.remove();
});

test("LogView: the lines that come at once are drawn together, and only the last maxLines of them", async function () {
    const log = LogView({ left: 0, top: 0, width: 400, height: 120, maxLines: 100 });
    for (let i = 1; i <= 20000; i++) log.info("Line " + i);
    const notDrawnYet = logRows(log).length === 0;
    await wait(30);
    const rows = logRows(log);
    const isDrawn = rows.length === 100 && rows[99].textContent.includes("Line 20000") && isLogAtEnd(log);
    check("LogView: the lines that come at once are drawn together, and only the last maxLines of them", notDrawnYet && isDrawn, notDrawnYet + " " + rows.length);
    log.remove();
});

test("LogView: a selected text holds the view; setLevels shows only those levels; clearLines shows the empty text", async function () {
    const log = LogView({ left: 0, top: 0, width: 400, height: 120 });
    const isEmptyAtFirst = log.lblEmpty.elem.getClientRects().length > 0;
    for (let i = 0; i < 30; i++) log.info("Line " + i);
    log.error("Bad");
    log.warn("Careful");
    await wait(30);
    const hidesEmpty = log.lblEmpty.elem.getClientRects().length === 0;
    const selection = window.getSelection();
    selection.selectAllChildren(logRows(log)[5]);
    scrollLog(log, 100);
    scrollLog(log, log.scrollArea.elem.scrollHeight);
    const topBefore = log.scrollArea.elem.scrollTop;
    log.info("New");
    await wait(30);
    const heldBySelection = log.scrollArea.elem.scrollTop === topBefore;
    selection.removeAllRanges();
    log.info("Newer");
    await wait(30);
    const freeAgain = isLogAtEnd(log) && log.scrollArea.elem.scrollTop > topBefore;
    log.setLevels(["warn", "error"]);
    const shown = logRows(log).filter(function (row) { return row.getClientRects().length > 0; }).length;
    const text = log.getText().replace(/\d\d:\d\d:\d\d /g, "");
    log.setLevels(["debug"]);
    const emptyWhenNoneShown = log.lblEmpty.elem.getClientRects().length > 0;
    log.setLevels([]);
    log.clearLines();
    const isCleared = log.lines.length === 0 && logRows(log).length === 0 && log.lblEmpty.elem.getClientRects().length > 0;
    check("LogView: a selected text holds the view; setLevels shows only those levels; clearLines shows the empty text",
        isEmptyAtFirst && hidesEmpty && heldBySelection && freeAgain && shown === 2 && text === "ERROR Bad\nWARN  Careful" && emptyWhenNoneShown && isCleared,
        [isEmptyAtFirst, hidesEmpty, heldBySelection, freeAgain, shown, text, emptyWhenNoneShown, isCleared].join(" | "));
    log.remove();
});

test("LogView: setWrapLines(0) keeps a long line on one row, and the view scrolls sideways", async function () {
    const log = LogView({ left: 0, top: 0, width: 200, height: 120, lines: ["A very long line that does not fit in this narrow view at all, not at all"] });
    const row = logRows(log)[0];
    const wrappedHeight = row.offsetHeight;
    const fromTheStart = LogView({ left: 0, top: 200, width: 200, height: 120, wrapLines: 0, lines: ["A very long line that does not fit in this narrow view at all, not at all"] });
    const isOneLineFromStart = logRows(fromTheStart)[0].offsetHeight < wrappedHeight && fromTheStart.scrollArea.elem.scrollWidth > fromTheStart.scrollArea.elem.clientWidth;
    fromTheStart.remove();
    log.setWrapLines(0);
    const oneLineHeight = row.offsetHeight;
    const elem = log.scrollArea.elem;
    const scrolls = elem.scrollWidth > elem.clientWidth && getComputedStyle(elem).overflowX === "auto";
    log.setWrapLines(1);
    const wrapsAgain = row.offsetHeight === wrappedHeight && getComputedStyle(elem).overflowX === "hidden";
    check("LogView: setWrapLines(0) keeps a long line on one row, and the view scrolls sideways",
        isOneLineFromStart && oneLineHeight < wrappedHeight && scrolls && wrapsAgain, [isOneLineFromStart, wrappedHeight, oneLineHeight, scrolls, wrapsAgain].join(" "));
    log.remove();
});

test("LogView: the first lines of the page are not changed, and a removed LogView draws nothing", async function () {
    const firstLines = ["One", { text: "Two", level: "warn" }];
    const log = LogView({ lines: firstLines });
    const isSame = firstLines.length === 2 && firstLines[0] === "One" && !firstLines[1].row && log.lines.length === 2;
    const uncaughtBefore = uncaught.length;
    log.info("Waits for its drawing");
    log.remove();
    await wait(30);
    check("LogView: the first lines of the page are not changed, and a removed LogView draws nothing", isSame && uncaught.length === uncaughtBefore, isSame);
});

// *** MARKDOWN VIEW (comp/markdown-view.js)

const markdownHtmlOf = function (view) {
    return view.blockGroup.elem.innerHTML;
};

test("MarkdownView: the blocks of a text: headings, lists, check marks, a quote, a line, a table, a code", async function () {
    const view = MarkdownView({
        left: 0,
        top: 0,
        width: 500,
        height: 400,
        markdownText: [
            "# One", "", "Text of a paragraph", "on two lines.", "", "## Two", "### Three", "",
            "1. First", "2. Second", "   - In it", "   - In it too", "", "A text between", "", "3. Third", "",
            "- [x] Done", "- [ ] Not done", "",
            "> A quote", ">", "> ## In a quote", "", "---", "",
            "| A | B |", "|---|---|", "| 1 | 2 |", "",
            "```python", "x = 1", "```",
        ].join("\n"),
    });
    await wait(30);
    const area = view.blockGroup.elem;
    const levels = Array.from(area.querySelectorAll('[role="heading"]')).map(function (heading) { return heading.getAttribute("aria-level"); }).join();
    const paragraph = Array.from(area.querySelectorAll(".markdown-view-text")).find(function (label) { return label.textContent.includes("paragraph"); }).textContent;
    const nested = area.querySelectorAll("ol > li > ul > li").length;
    const goesOn = area.querySelector('ol[start="3"] li').textContent;
    const checks = [area.querySelectorAll(".markdown-view-task").length, area.querySelectorAll(".markdown-view-check-on").length].join();
    const cells = area.querySelectorAll("table th, table td").length;
    const code = area.querySelector(".markdown-view-code").textContent;
    const headings = view.getHeadings().map(function (heading) { return heading.id; }).join();
    check("MarkdownView: the blocks of a text: headings, lists, check marks, a quote, a line, a table, a code",
        levels === "1,2,3,2" && paragraph === "Text of a paragraph on two lines." && nested === 2 && goesOn === "Third" && checks === "2,1" && cells === 4 &&
        code === "x = 1" && headings === "one,two,three,in-a-quote" && view.getMarkdownText().startsWith("# One"),
        [levels, paragraph, nested, goesOn, checks, cells, code, headings].join(" | "));
    view.remove();
});

test("MarkdownView: the words of a line; what is inside a code or an address is not read again", async function () {
    const inline = function (text) { return MarkdownView.inlineHtml(text, { remotePictures: true }); };
    const words = inline("**b** *i* __s__ _e_ ~~d~~ `c`");
    const plainWords = inline("a snake_case_name and 2*3*4");
    const escaped = inline("\\*not\\* \\_it\\_");
    const inCode = inline("`**a** <b>`");
    const address = inline("https://a.com/__x__/*y*/z.");
    const inBold = inline("**https://a.com**");
    const withCode = inline("[`a`](https://a.com)");
    const pictureLink = inline("[![alt](a.png)](https://a.com)");
    const round = inline("[x](https://a.com/Foo_(bar))");
    const titled = inline('[x](https://a.com "A title")');
    const lineBreak = inline("a<br>b<br/>c");
    const nul = inline("a\u00000\u0000b `c`");
    const escapedAddress = inline("[x](https://a.com/a\\_b)");
    const escapedLabel = inline("[a\\]b](https://a.com)");
    const results = [words, plainWords, escaped, inCode, address, inBold, withCode, pictureLink, round, titled, lineBreak, nul, escapedAddress, escapedLabel];
    const blank = ' target="_blank" rel="noopener noreferrer"';
    const expected = [
        "<strong>b</strong> <em>i</em> <strong>s</strong> <em>e</em> <del>d</del> <code>c</code>",
        "a snake_case_name and 2*3*4",
        "*not* _it_",
        "<code>**a** &lt;b&gt;</code>",
        '<a href="https://a.com/__x__/*y*/z"' + blank + ">https://a.com/__x__/*y*/z</a>.",
        '<strong><a href="https://a.com"' + blank + ">https://a.com</a></strong>",
        '<a href="https://a.com"' + blank + "><code>a</code></a>",
        '<a href="https://a.com"' + blank + '><img src="a.png" alt="alt"></a>',
        '<a href="https://a.com/Foo_(bar)"' + blank + ">x</a>",
        '<a href="https://a.com"' + blank + ">x</a>",
        "a<br>b<br>c",
        "a0b <code>c</code>",
        '<a href="https://a.com/a_b"' + blank + ">x</a>",
        '<a href="https://a.com"' + blank + ">a]b</a>",
    ];
    const wrong = results.map(function (result, index) { return (result === expected[index]) ? "" : result; }).filter(function (result) { return result; });
    check("MarkdownView: the words of a line; what is inside a code or an address is not read again", wrong.length === 0, wrong.join(" | "));
});

test("MarkdownView: a text is never read as HTML; an address that is not safe stays a text", async function () {
    window.markdownViewRan = 0;
    const zeroWidth = String.fromCharCode(0x200B);
    const text = [
        "<script>window.markdownViewRan = 1<\/script>",
        '<img src=x onerror="window.markdownViewRan = 1">',
        "[a](javascript:window.markdownViewRan=1)",
        "[b](JaVaScRiPt:alert(1))",
        "[c](java" + zeroWidth + "script:alert(1))",
        "[d](&#106;avascript:alert(1))",
        "[e](data:text/html,x)",
        "[f](vbscript:x)",
        "[f2](javascript\\:alert(1))",
        "[f3](<javascript:alert(1)>)",
        "[f4](java`x`script:alert(1))",
        "![f5](javascript\\:alert(1))",
        "![g](javascript:alert(1))",
        "![h](data:text/html,x)",
        '[i"onmouseover="x](https://a.com)',
        '[j](https://a.com"onmouseover="x)',
        '![k"onerror="x](a.png)',
        "",
        "# <img src=x onerror=1>",
        "",
        "- <img src=x onerror=1>",
        "",
        "> <img src=x onerror=1>",
        "",
        "| <img src=x onerror=1> |",
        "|---|",
        "| <b>x</b> |",
        "",
        "```<img>",
        "<img src=x onerror=1>",
        "```",
        "",
        "```html",
        "<img src=x onerror=1>",
        "```",
    ].join("\n");
    const view = MarkdownView({ width: 500, height: 300, markdownText: text });
    await wait(60);
    const all = Array.from(view.blockGroup.elem.querySelectorAll("*"));
    const scripts = view.blockGroup.elem.querySelectorAll("script").length;
    const withOn = all.filter(function (element) {
        return Array.from(element.attributes).some(function (attribute) { return /^on/i.test(attribute.name); });
    }).length;
    const addresses = Array.from(view.blockGroup.elem.querySelectorAll("a")).map(function (link) { return link.getAttribute("href"); });
    const badLinks = addresses.filter(function (address) { return /^\s*(javascript|vbscript|data):/i.test(address.split(zeroWidth).join("")); });
    const pictures = Array.from(view.blockGroup.elem.querySelectorAll("img")).map(function (picture) { return picture.getAttribute("src"); });
    const bold = view.blockGroup.elem.querySelectorAll("b").length;
    const isShown = view.blockGroup.elem.textContent.includes("<script>window.markdownViewRan = 1<\/script>");
    check("MarkdownView: a text is never read as HTML; an address that is not safe stays a text",
        window.markdownViewRan === 0 && scripts === 0 && withOn === 0 && badLinks.length === 0 && pictures.join() === "a.png" && bold === 0 && isShown,
        [window.markdownViewRan, scripts, withOn, badLinks.join(), pictures.join(), bold, isShown].join(" | "));
    view.remove();
});

test("MarkdownView: a picture with a remote address stays a link, until remotePictures: 1; a picture of the page is drawn", async function () {
    const text = "![Far](https://a.com/p.png) ![Far too](//a.com/q.png) ![](https://a.com/r.png) ![Near](near.png) ![Data](data:image/png;base64,AAAA)";
    const view = MarkdownView({ width: 500, height: 200, markdownText: text });
    await wait(30);
    const pictures = Array.from(view.blockGroup.elem.querySelectorAll("img")).map(function (picture) { return picture.getAttribute("alt"); }).join();
    const links = Array.from(view.blockGroup.elem.querySelectorAll("a")).map(function (link) { return link.textContent; }).join();
    const closed = MarkdownView.parse("![Far](https://a.com/p.png)").blocks[0].html.startsWith("<a ");
    const open = MarkdownView.parse("![Far](https://a.com/p.png)", { remotePictures: 1 }).blocks[0].html.startsWith("<img");
    const allowed = MarkdownView({ width: 500, height: 200, markdownText: text, remotePictures: 1 });
    const allPictures = allowed.blockGroup.elem.querySelectorAll("img").length;
    allowed.remove();
    check("MarkdownView: a picture with a remote address stays a link, until remotePictures: 1; a picture of the page is drawn",
        pictures === "Near,Data" && links === "Far,Far too,https://a.com/r.png" && closed && open && allPictures === 5, [pictures, links, closed, open, allPictures].join(" | "));
    view.remove();
});

test("MarkdownView: a link: onLinkClick gets its address; without it the browser opens a new tab; \"#\" goes to the heading", async function () {
    const addresses = [];
    const text = "[out](https://a.com/x) [in](#calisma-ozeti) [in too](#çalışma-özeti) [none](#nothing)\n\n" + "A line\n\n".repeat(60) + "# Çalışma Özeti\n\n" + "A line\n\n".repeat(60);
    const view = MarkdownView({ width: 400, height: 200, markdownText: text, onLinkClick: function (self, address) { addresses.push((self === view) + " " + address); } });
    await wait(30);
    const links = view.blockGroup.elem.querySelectorAll("a");
    const area = view.scrollArea.elem;
    const heading = view.blockGroup.elem.querySelector('[role="heading"]');
    const click = function (link) {
        const event = new MouseEvent("click", { bubbles: true, cancelable: true });
        link.dispatchEvent(event);
        return event.defaultPrevented;
    };
    const outStopped = click(links[0]);
    const inStopped = click(links[1]);
    const top = Math.round(heading.getBoundingClientRect().top - area.getBoundingClientRect().top);
    area.scrollTop = 0;
    click(links[2]);
    const topToo = Math.round(heading.getBoundingClientRect().top - area.getBoundingClientRect().top);
    area.scrollTop = 0;
    click(links[3]);
    const stays = area.scrollTop;
    const called = addresses.join();
    const hash = location.hash;
    const attributes = [links[0].getAttribute("target"), links[0].getAttribute("rel"), links[1].getAttribute("target")].join();
    view.onLinkClick = null;
    let leftToBrowser = null;
    document.addEventListener("click", function (event) {
        leftToBrowser = !event.defaultPrevented;
        event.preventDefault(); // WHY: The test must not open a tab.
    }, { once: true });
    links[0].dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    check("MarkdownView: a link: onLinkClick gets its address; without it the browser opens a new tab; \"#\" goes to the heading",
        outStopped && inStopped && called === "true https://a.com/x" && top === 12 && topToo === 12 && stays === 0 && hash === "" &&
        attributes === "_blank,noopener noreferrer," && leftToBrowser === true,
        [outStopped, inStopped, called, top, topToo, stays, hash, attributes, leftToBrowser].join(" | "));
    view.remove();
});

test("MarkdownView: a text piece by piece: drawn together, what is above stays on the page, a code still coming is a code", async function () {
    const view = MarkdownView({ width: 400, height: 200, markdownText: "# Title\n\nFirst " });
    await wait(30);
    const area = view.blockGroup.elem;
    const heading = area.querySelector('[role="heading"]');
    view.appendText("words ");
    view.appendText("and ");
    const notYet = area.textContent.includes("words");
    view.appendText("more");
    view.appendText(null);
    const text = view.getMarkdownText();
    await wait(70);
    const drawn = area.textContent.includes("First words and more");
    const isSameObject = (area.querySelector('[role="heading"]') === heading);
    view.appendText("\n\n```python\nx = 1");
    await wait(70);
    const coming = area.querySelector(".markdown-view-code").textContent;
    view.appendText("\ny = 2\n```\n\nThe end");
    await wait(70);
    const ended = [area.querySelector(".markdown-view-code").textContent, area.textContent.endsWith("The end")].join();
    check("MarkdownView: a text piece by piece: drawn together, what is above stays on the page, a code still coming is a code",
        !notYet && text === "# Title\n\nFirst words and more" && drawn && isSameObject && coming === "x = 1" && ended === "x = 1\ny = 2,true",
        [notYet, text, drawn, isSameObject, coming, ended].join(" | "));
    view.remove();
});

test("MarkdownView: appendText() follows the end until the reader scrolls up; scrollToEnd() follows again; setMarkdownText() keeps the place", async function () {
    const view = MarkdownView({ width: 300, height: 120, markdownText: "" });
    await wait(30);
    const area = view.scrollArea.elem;
    const isAtEnd = function () { return (area.scrollHeight - area.scrollTop - area.clientHeight <= 1); };
    view.appendText("Line one\n\nLine two\n\nLine three\n\nLine four\n\nLine five\n\nLine six\n\n");
    await wait(70);
    const followed = (area.scrollTop > 0 && isAtEnd());
    view.appendText("Line seven\n\nLine eight\n\n");
    await wait(70);
    const followedAgain = isAtEnd();
    area.scrollTop = 0;
    await wait(50);
    view.appendText("Line nine\n\nLine ten\n\n");
    await wait(70);
    const stays = (area.scrollTop === 0);
    view.scrollToEnd();
    view.appendText("Line eleven\n\nLine twelve\n\n");
    await wait(70);
    const followsAgain = isAtEnd();
    view.setAutoScroll(0);
    view.appendText("Line thirteen\n\nLine fourteen\n\n");
    await wait(70);
    const off = !isAtEnd();
    view.setAutoScroll(1);
    area.scrollTop = 30;
    await wait(50);
    view.setMarkdownText(view.getMarkdownText() + "Changed");
    const keeps = (area.scrollTop === 30);
    view.scrollToTop();
    check("MarkdownView: appendText() follows the end until the reader scrolls up; scrollToEnd() follows again; setMarkdownText() keeps the place",
        followed && followedAgain && stays && followsAgain && off && keeps && area.scrollTop === 0,
        [followed, followedAgain, stays, followsAgain, off, keeps, area.scrollTop].join(" | "));
    view.remove();
});

test("MarkdownView: a selection above the end stays while the text comes, and the view does not jump", async function () {
    const view = MarkdownView({ width: 300, height: 100, markdownText: "First line\n\nSecond line\n\nThird line\n\nFourth line\n\nFifth line\n\nSixth line" });
    await wait(30);
    view.scrollToEnd();
    const area = view.scrollArea.elem;
    const first = view.blockGroup.elem.querySelector(".markdown-view-text");
    window.getSelection().selectAllChildren(first);
    const topBefore = area.scrollTop;
    view.appendText("\n\nSeventh line");
    await wait(70);
    const selected = window.getSelection().toString().trim();
    const stays = (area.scrollTop === topBefore);
    window.getSelection().removeAllRanges();
    check("MarkdownView: a selection above the end stays while the text comes, and the view does not jump",
        selected === "First line" && stays, [selected, stays].join(" | "));
    view.remove();
});

test("MarkdownView: setMarkdownText(), clear() and the text of an empty view", async function () {
    const view = MarkdownView({ width: 300, height: 120, emptyText: "<b>Nothing</b>" });
    await wait(30);
    const isShown = function () { return view.lblEmpty.elem.getClientRects().length > 0; };
    const atStart = [isShown(), view.lblEmpty.elem.textContent].join();
    view.setMarkdownText("# Hi");
    const withText = isShown();
    const blocksWithText = view.blockGroup.elem.querySelectorAll('[role="heading"]').length;
    view.clear();
    const afterClear = [isShown(), view.getMarkdownText(), view.blockGroup.elem.querySelectorAll('[role="heading"]').length].join();
    view.setEmptyText("");
    const noText = isShown();
    view.setMarkdownText(null);
    const nothing = view.getMarkdownText();
    view.setMarkdownText(123);
    const number = view.getMarkdownText();
    check("MarkdownView: setMarkdownText(), clear() and the text of an empty view",
        atStart === "true,<b>Nothing</b>" && !withText && blocksWithText === 1 && afterClear === "true,,0" && !noText && nothing === "" && number === "123",
        [atStart, withText, blocksWithText, afterClear, noText, nothing, number].join(" | "));
    view.remove();
});

test("MarkdownView: a code: its colors, other names of a language, a long line scrolls in the code, the view stays", async function () {
    const longLine = "x = " + "1234567890".repeat(30);
    const text = ["```python", "for a in b:  # <c>", "    print('d')", "```", "", "```py", "pass", "```", "", "```nothing", "<b>e</b>", "```", "", "```", "plain", "```", "", "```js", "let f = `g", "h`;", "```", "", "```python", longLine, "```"].join("\n");
    const view = MarkdownView({ width: 400, height: 300, markdownText: text });
    await wait(30);
    const codes = view.blockGroup.elem.querySelectorAll(".markdown-view-code");
    const keyword = codes[0].querySelector(".code-editor-keyword");
    const color = (keyword) ? getComputedStyle(keyword).color : "";
    const comment = codes[0].querySelector(".code-editor-comment").textContent;
    const alias = codes[1].querySelectorAll(".code-editor-keyword").length;
    const unknown = [codes[2].textContent, codes[2].querySelectorAll("b").length, codes[2].querySelectorAll("span").length].join();
    const noLanguage = codes[3].textContent;
    const longScroller = codes[5].parentElement;
    const scrollsInside = longScroller.scrollWidth > longScroller.clientWidth;
    const area = view.scrollArea.elem;
    const viewStays = (area.scrollWidth <= area.clientWidth);
    check("MarkdownView: a code: its colors, other names of a language, a long line scrolls in the code, the view stays",
        color === "rgb(138, 47, 142)" && comment === "# <c>" && alias === 1 && unknown === "<b>e</b>,0,0" && noLanguage === "plain" && scrollsInside && viewStays,
        [color, comment, alias, unknown, noLanguage, scrollsInside, viewStays].join(" | "));
    view.remove();
});

test("MarkdownView: the button of a code copies it, says so and comes back", async function () {
    const copied = [];
    const realCopy = MarkdownView.copyToClipboard;
    MarkdownView.copyToClipboard = function (text) {
        copied.push(text);
        return Promise.resolve();
    };
    const view = MarkdownView({ width: 400, height: 200, markdownText: "```python\nx = 1\ny = 2\n```", copyText: "Kopyala", copiedText: "Kopyalandı" });
    await wait(30);
    const button = view.blockGroup.elem.querySelector("button");
    const before = [button.textContent, button.getAttribute("aria-label")].join();
    mouseClick(button);
    await wait(30);
    const after = button.textContent;
    await wait(1550);
    const back = button.textContent;
    MarkdownView.copyToClipboard = realCopy;
    check("MarkdownView: the button of a code copies it, says so and comes back",
        copied.join() === "x = 1\ny = 2" && before === "Kopyala,Kopyala" && after === "Kopyalandı" && back === "Kopyala",
        [copied.join(), before, after, back].join(" | "));
    view.remove();
});

test("MarkdownView: a table: alignment, a letter |, a row with too few cells; a wide table scrolls in itself", async function () {
    const wideCell = "word".repeat(60);
    const text = ["| Left | Middle | Right |", "|:---|:--:|---:|", "| a\\|b | `c` |", "", "| One |", "|---|", "| " + wideCell + " |"].join("\n");
    const view = MarkdownView({ width: 300, height: 300, markdownText: text });
    await wait(30);
    const tables = view.blockGroup.elem.querySelectorAll("table");
    const aligns = Array.from(tables[0].querySelectorAll("th")).map(function (cell) { return cell.style.textAlign; }).join();
    const cells = Array.from(tables[0].querySelectorAll("td")).map(function (cell) { return cell.textContent; }).join("/");
    const inlineCode = tables[0].querySelectorAll("td code").length;
    const scroller = tables[1].parentElement;
    const scrollsInside = scroller.scrollWidth > scroller.clientWidth;
    const area = view.scrollArea.elem;
    const viewStays = (area.scrollWidth <= area.clientWidth);
    check("MarkdownView: a table: alignment, a letter |, a row with too few cells; a wide table scrolls in itself",
        aligns === ",center,right" && cells === "a|b/c/" && inlineCode === 1 && scrollsInside && viewStays,
        [aligns, cells, inlineCode, scrollsInside, viewStays].join(" | "));
    view.remove();
});

test("MarkdownView: setTheme() paints a new package, the style of the page stays, the text and the place stay", async function () {
    const text = "# Hi\n\n" + "A line\n\n".repeat(40) + "```python\nfor a in b: pass\n```";
    const view = MarkdownView({ width: 400, height: 200, markdownText: text, style: { text: { fontSize: 17 } } });
    await wait(30);
    const area = view.scrollArea.elem;
    area.scrollTop = 150;
    const groundOf = function () { return view.elem.style.backgroundColor; };
    const linkOf = function () { return view.elem.style.getPropertyValue("--markdown-view-link"); };
    const keywordOf = function () { return getComputedStyle(view.blockGroup.elem.querySelector(".code-editor-keyword")).color; };
    const sizeOf = function () { return view.blockGroup.elem.querySelector(".markdown-view-text:not([role])").style.fontSize; };
    const light = [groundOf(), linkOf(), keywordOf(), sizeOf()].join();
    view.setTheme("dark");
    const dark = [groundOf(), linkOf(), keywordOf(), sizeOf(), view.styleName].join();
    const keepsPlace = (area.scrollTop === 150);
    const keepsText = view.blockGroup.elem.querySelector('[role="heading"]').textContent;
    view.setTheme("light");
    const back = [groundOf(), linkOf(), keywordOf(), sizeOf()].join();
    check("MarkdownView: setTheme() paints a new package, the style of the page stays, the text and the place stay",
        light === "white,#1F7A83,rgb(138, 47, 142),17px" && dark === "rgb(28, 28, 27),#6FC6CD,rgb(215, 162, 232),17px,dark" && keepsPlace && keepsText === "Hi" && back === light,
        [light, dark, keepsPlace, keepsText, back].join(" | "));
    view.remove();
});

test("MarkdownView: height \"auto\" grows with its text, a number scrolls inside it; a wide view keeps its text narrow", async function () {
    const text = "A line\n\n".repeat(20);
    const auto = MarkdownView({ width: 300, height: "auto", markdownText: "A line" });
    await wait(30);
    const small = auto.elem.offsetHeight;
    auto.setMarkdownText(text);
    await wait(30);
    const big = auto.elem.offsetHeight;
    const noArea = (auto.scrollArea === undefined);
    auto.scrollToEnd();
    auto.scrollToTop();
    auto.remove();
    const fixed = MarkdownView({ width: 300, height: 100, markdownText: text });
    await wait(30);
    const fixedHeight = fixed.elem.offsetHeight;
    const scrolls = (fixed.scrollArea.elem.scrollHeight > fixed.scrollArea.elem.clientHeight);
    fixed.remove();
    const wide = MarkdownView({ width: 1000, height: 200, markdownText: "A line" });
    await wait(30);
    const pageRect = wide.blockGroup.elem.getBoundingClientRect();
    const leftSpace = Math.round(pageRect.left - wide.elem.getBoundingClientRect().left);
    const pageWidth = Math.round(pageRect.width);
    wide.remove();
    check("MarkdownView: height \"auto\" grows with its text, a number scrolls inside it; a wide view keeps its text narrow",
        big > small * 5 && small > 30 && noArea && fixedHeight === 100 && scrolls && leftSpace === 90 && pageWidth === 820,
        [small, big, noArea, fixedHeight, scrolls, leftSpace, pageWidth].join(" | "));
});

test("MarkdownView.parse(): alone: the title, heading names, the kinds of a code, titles with a line under them", async function () {
    const parse = MarkdownView.parse;
    const kinds = function (text) { return parse(text).blocks.map(function (block) { return block.type; }).join(); };
    const empty = [parse(null).blocks.length, parse("").title, parse(undefined).blocks.length].join();
    const title = parse("## Small\n\n# The **big** one\n\n# Second").title;
    const ids = MarkdownView.headingsOf(parse("# Same\n\n# Same\n\n# Çözüm Şimdi\n\n# ...\n\n# ???\n\n# Constructor\n\n# Constructor").blocks).map(function (heading) { return heading.id; }).join();
    const lines = parse("a\r\nb\rc").blocks[0].html;
    const tilde = parse("~~~\n```\n~~~").blocks[0].code;
    const longFence = parse("````md\n```\nin it\n```\n````\n\nafter");
    const info = parse("```python title=\"a.py\"\nx\n```").blocks[0].language;
    const notFence = kinds("``` a ``` b");
    const inList = parse("1. Run it:\n\n   ```bash\n   ls\n     a\n   ```\n\n2. Then");
    const unclosed = parse("```js\nlet a;").blocks[0].code;
    const underlined = parse("Big\n===\n\nSmall\n---\n\nText\n\n---").blocks.map(function (block) { return block.type + (block.level || ""); }).join();
    const notLine = kinds("- - -\n\n***\n\n___");
    const listHr = kinds("- a\n---\n- b");
    const hard = parse("a  \nb\\\nc\nd").blocks[0].html;
    const hashtag = kinds("#tag and #more");
    const tableInText = kinds("Text\n| a | b |\n|---|---|\n| 1 | 2 |");
    const notTable = kinds("a | b\nc | d");
    const results = [empty, title, ids, lines, tilde, longFence.blocks[0].code, longFence.blocks[1].html, info, notFence,
        inList.blocks.map(function (block) { return block.type; }).join(), inList.blocks[1].code, inList.blocks[2].html.startsWith('<ol start="2">'),
        unclosed, underlined, notLine, listHr, hard, hashtag, tableInText, notTable];
    const expected = ["0,,0", "The big one", "same,same-2,cozum-simdi,section,section-2,constructor,constructor-2", "a b c", "```", "```\nin it\n```", "after", "python", "p",
        "list,code,list", "ls\n  a", true,
        "let a;", "heading1,heading2,p,line", "line,line,line", "list,line,list", "a<br>b<br>c d", "p", "p,table", "p"];
    const wrong = results.map(function (result, index) { return (result === expected[index]) ? "" : index + ": " + result; }).filter(function (result) { return result; });
    check("MarkdownView.parse(): alone: the title, heading names, the kinds of a code, titles with a line under them", wrong.length === 0, wrong.join(" | "));
});

test("MarkdownView: remove(): a text that was still coming draws nothing; a heading of an old text is not found", async function () {
    const view = MarkdownView({ width: 300, height: 100, markdownText: "# Old\n\n# New" });
    await wait(30);
    view.setMarkdownText("# New");
    view.scrollToHeading("old");
    const stays = view.scrollArea.elem.scrollTop;
    const group = view.blockGroup;
    view.appendText("\n\nMore");
    view.remove();
    view.remove();
    await wait(70);
    check("MarkdownView: remove(): a text that was still coming draws nothing; a heading of an old text is not found",
        view.isRemoved == 1 && group.isRemoved == 1 && stays === 0 && !group.elem.textContent.includes("More"),
        [view.isRemoved, group.isRemoved, stays].join(" | "));
});

// *** CHAT VIEW (comp/chat-view.js)

const typeInChat = function (chat, text, keyLook) {
    const field = chat.textareaElem;
    field.focus();
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new KeyboardEvent("keydown", Object.assign({ key: "Enter", bubbles: true, cancelable: true }, keyLook)));
};

test("ChatView: Enter sends the text as a message of the user and calls onSend; Shift+Enter is a new line", async function () {
    const sent = [];
    const keys = [];
    const chat = ChatView({ width: 400, height: 300, onSend: function (self, text, key) {
        sent.push(self === chat ? text : "not self");
        keys.push(key);
    } });
    typeInChat(chat, "  Hi\nthere  ", { shiftKey: true });
    const afterShift = chat.getMessages().length;
    typeInChat(chat, "  Hi\nthere  ");
    const messages = chat.getMessages();
    const isRight = afterShift === 0 && sent.join() === "Hi\nthere" && messages.length === 1 && messages[0].role === "user" &&
        messages[0].text === "Hi\nthere" && keys.join() === messages[0].key && chat.getInputText() === "";
    check("ChatView: Enter sends the text as a message of the user and calls onSend; Shift+Enter is a new line", isRight,
        JSON.stringify([afterShift, sent, messages, chat.getInputText()]));
    chat.remove();
});

test("ChatView: an answer that comes piece by piece: the dots until its first words, then Markdown", async function () {
    const chat = ChatView({ width: 400, height: 300, messages: [{ role: "user", text: "Hi" }] });
    const key = chat.addMessage({ role: "assistant" });
    chat.setBusy(1);
    const dotsBefore = chat.dotsRow.visible;
    chat.appendText(key, "**Hel");
    chat.appendText(key, "lo**");
    await wait(80);
    const html = chat.messageGroup.elem.innerHTML;
    const isRight = dotsBefore == 1 && chat.dotsRow.visible == 0 && html.includes("<strong>Hello</strong>") && chat.getMessageText(key) === "**Hello**" &&
        chat.getMessages()[1].role === "assistant";
    check("ChatView: an answer that comes piece by piece: the dots until its first words, then Markdown", isRight,
        [dotsBefore, chat.dotsRow.visible, chat.getMessageText(key)].join(" | "));
    chat.remove();
});

test("ChatView: Stop ends busy and calls onStop; a text is never read as HTML", async function () {
    const stops = [];
    const chat = ChatView({ width: 400, height: 300, onStop: function (self) { stops.push(self.busy); } });
    chat.addMessage({ role: "user", text: "<b>not bold</b>" });
    chat.setBusy(1);
    chat.btnSend.elem.click();
    const bubble = chat.messageGroup.elem.textContent;
    check("ChatView: Stop ends busy and calls onStop; a text is never read as HTML",
        chat.busy === 0 && stops.join() === "0" && bubble.includes("<b>not bold</b>") && !chat.messageGroup.elem.querySelector("b, strong"),
        [chat.busy, stops.join(), bubble].join(" | "));
    chat.remove();
});

test("ChatView: the view follows a new answer until the reader scrolls up", async function () {
    const chat = ChatView({ width: 400, height: 200 });
    for (let index = 0; index < 8; index++) chat.addMessage({ role: "user", text: "Message " + index });
    chat.scrollToEnd();
    await wait(50);
    const scrollBox = chat.messageArea.scrollBox.elem;
    const key = chat.addMessage({ role: "assistant" });
    chat.appendText(key, "An answer\n\nwith two paragraphs");
    await wait(100);
    const followed = scrollBox.scrollHeight - scrollBox.scrollTop - scrollBox.clientHeight;
    scrollBox.scrollTop = 0;
    scrollBox.dispatchEvent(new Event("scroll"));
    await wait(30);
    chat.appendText(key, "\n\nand a third one");
    await wait(100);
    check("ChatView: the view follows a new answer until the reader scrolls up", followed <= 1 && scrollBox.scrollTop === 0,
        "the distance to the end: " + followed + ", after a scroll up: " + scrollBox.scrollTop);
    chat.remove();
});

test("ChatView: minimal: small and made of lines; setTheme() draws the answers again in the sizes of a package", async function () {
    const chat = ChatView({ width: 400, height: 300, styleName: "minimal", messages: [{ role: "user", text: "Hi" }, { role: "assistant", text: "An answer" }] });
    await wait(50);
    const answerSize = function () {
        return getComputedStyle(chat.messageGroup.elem.querySelector(".markdown-view-text")).fontSize;
    };
    const minimalLook = [answerSize(), chat.btnSend.height, chat.fieldGroup.color].join(" | ");
    chat.setTheme("light");
    await wait(50);
    const lightLook = [answerSize(), chat.btnSend.height].join(" | ");
    check("ChatView: minimal: small and made of lines; setTheme() draws the answers again in the sizes of a package",
        minimalLook === "13px | 28 | transparent" && lightLook === "15px | 34" && chat.getMessages().length === 2,
        minimalLook + " / light: " + lightLook);
    chat.remove();
});

// *** JSON VIEW (comp/json-view.js)

const jsonRowText = function (view, key) {
    const row = view.tree.getRowElem(key);
    return (row) ? row.textContent : null;
};

const jsonRowCount = function (view) {
    return Array.from(view.tree.elem.querySelectorAll('[role="treeitem"]')).filter(function (row) { return row.getClientRects().length > 0; }).length;
};

test("JsonView: a row has a key and a value in the color of its kind; a branch is made when it opens", async function () {
    const value = { name: "Ada", age: 36, ok: true, none: null, list: [1, "b"], empty: {}, emptyList: [], sub: { deep: { deeper: 1 } }, "odd key": 1 };
    const view = JsonView({ width: 400, height: 400, value: value });
    await wait(30);
    const texts = ["name", "age", "ok", "none", "list", "list[0]", "list[1]", "empty", "emptyList", "sub", "sub.deep", '["odd key"]'].map(function (key) { return jsonRowText(view, key); }).join("|");
    const expected = 'name"Ada"|age36|oktrue|nonenull|list[2]|01|1"b"|empty{0}|emptyList[0]|sub{1}|deep{1}|odd key1';
    const colorOf = function (key) { return view.tree.getNode(key).descriptionColor; };
    const colors = [colorOf("name"), colorOf("age"), colorOf("ok"), colorOf("none")].join();
    const style = view.style.kinds;
    const isLazy = (view.tree.getNode("sub.deep.deeper") === null);
    const hasArrow = (view.tree.getRowElem("sub.deep").querySelector("[data-tv-arrow] svg") !== null);
    const emptyHasNoArrow = (view.tree.getRowElem("empty").querySelector("[data-tv-arrow] svg") === null);
    mouseClick(view.tree.getRowElem("sub.deep").querySelector("[data-tv-arrow]"));
    const opened = jsonRowText(view, "sub.deep.deeper");
    const mono = getComputedStyle(view.tree.getRowElem("name")).fontFamily.includes("monospace");
    check("JsonView: a row has a key and a value in the color of its kind; a branch is made when it opens",
        texts === expected && colors === [style.string, style.number, style.boolean, style.null].join() && isLazy && hasArrow && emptyHasNoArrow && opened === "deeper1" && mono,
        [texts, colors, isLazy, hasArrow, emptyHasNoArrow, opened, mono].join(" | "));
    view.remove();
});

test("JsonView: a value that is not an object; nothing shows its empty text; expandLevel", async function () {
    const scalar = JsonView({ width: 300, height: 100, value: 5 });
    await wait(20);
    const number = [jsonRowCount(scalar), jsonRowText(scalar, "$")].join();
    scalar.setValue("A text");
    const text = jsonRowText(scalar, "$");
    scalar.setValue([]);
    const emptyList = jsonRowText(scalar, "$");
    scalar.setValue(null);
    const none = [jsonRowCount(scalar), scalar.tree.lblEmpty.elem.getClientRects().length > 0, scalar.tree.lblEmpty.elem.textContent].join();
    scalar.setEmptyTextProbe = null;
    scalar.remove();
    const closed = JsonView({ width: 300, height: 200, value: { a: { b: { c: 1 } } }, expandLevel: 0 });
    const two = JsonView({ width: 300, height: 200, value: { a: { b: { c: 1 } } }, expandLevel: 2 });
    await wait(20);
    const counts = [jsonRowCount(closed), jsonRowCount(two)].join();
    closed.remove();
    two.remove();
    const list = JsonView({ width: 300, height: 200, value: [10, [20]] });
    await wait(20);
    const inList = [jsonRowText(list, "[0]"), jsonRowText(list, "[1]"), jsonRowText(list, "[1][0]")].join();
    list.remove();
    check("JsonView: a value that is not an object; nothing shows its empty text; expandLevel",
        number === "1,5" && text === '"A text"' && emptyList === "[0]" && none === "0,true,No value" && counts === "1,3" && inList === "010,1[1],020",
        [number, text, emptyList, none, counts, inList].join(" | "));
});

test("JsonView: a click gives the path, the kind and the value of a row; not at create time, not with selectPath()", async function () {
    const entries = [];
    const value = { users: [{ "a b": "x", "0": 1 }], total: 3, sub: { in: true } };
    const view = JsonView({ width: 400, height: 400, value: value, expandLevel: 3, onSelect: function (self, entry) { entries.push(entry); } });
    await wait(30);
    const atStart = [entries.length, view.getSelectedPath(), view.getSelectedPathText(), view.getSelectedValue()].join();
    mouseClick(view.tree.getRowElem('users[0]["a b"]'));
    const leaf = entries[0];
    const leafText = [leaf.key, leaf.label, leaf.kind, leaf.pathText, leaf.value, JSON.stringify(leaf.path)].join("|");
    const selected = [view.getSelectedPathText(), view.getSelectedValue(), JSON.stringify(view.getSelectedPath())].join("|");
    mouseClick(view.tree.getRowElem("users[0]"));
    const branch = entries[1];
    const branchText = [branch.kind, branch.value, branch.label, JSON.stringify(view.getSelectedValue())].join("|");
    mouseClick(view.tree.getRowElem('users[0]["0"]'));
    const numberKey = [entries[2].pathText, JSON.stringify(entries[2].path)].join("|");
    const before = entries.length;
    view.selectPath(["sub", "in"]);
    const silent = [entries.length === before, view.getSelectedPathText(), view.getSelectedValue()].join();
    view.selectPath(["no", "such"]);
    const stays = view.getSelectedPathText();
    view.setValue({ other: 1 });
    const cleared = [view.getSelectedPath(), view.getSelectedPathText(), view.getValue().other].join();
    check("JsonView: a click gives the path, the kind and the value of a row; not at create time, not with selectPath()",
        atStart === "0,,," && leafText === 'users[0]["a b"]|a b|string|users[0]["a b"]|x|["users",0,"a b"]' && selected === 'users[0]["a b"]|x|["users",0,"a b"]' &&
        branchText === 'object||0|{"0":1,"a b":"x"}' && numberKey === 'users[0]["0"]|["users",0,"0"]' && silent === "true,sub.in,true" && stays === "sub.in" && cleared === ",,1",
        [atStart, leafText, selected, branchText, numberKey, silent, stays, cleared].join(" || "));
    view.remove();
});

test("JsonView: a key and a value are never read as HTML; a long text is cut on its row", async function () {
    window.jsonViewRan = 0;
    const long = "x".repeat(1000);
    const value = { "<b>key</b>": "<img src=x onerror=\"window.jsonViewRan = 1\">", long: long };
    const view = JsonView({ width: 300, height: 200, value: value });
    await wait(50);
    const rows = view.tree.elem;
    const safe = [rows.querySelectorAll("b").length, rows.querySelectorAll("img").length, window.jsonViewRan].join();
    const shown = jsonRowText(view, '["<b>key</b>"]');
    const longRow = jsonRowText(view, "long");
    const area = view.tree.listArea.elem;
    const stays = (area.scrollWidth <= area.clientWidth);
    mouseClick(view.tree.getRowElem("long"));
    const whole = view.getSelectedValue().length;
    check("JsonView: a key and a value are never read as HTML; a long text is cut on its row",
        safe === "0,0,0" && shown === '<b>key</b>"<img src=x onerror=\\"window.jsonViewRan = 1\\">"' && longRow.length < 320 && longRow.endsWith("…") && stays && whole === 1000,
        [safe, shown, longRow.length, stays, whole].join(" | "));
    view.remove();
});

test("JsonView: a long list comes in pages: a million items open at once, and selectPath() goes through them", async function () {
    const items = [];
    for (let index = 0; index < 1000000; index++) items.push(index);
    const started = Date.now();
    const view = JsonView({ width: 300, height: 200, value: { items: items } });
    await wait(20);
    const pages = jsonRowCount(view);
    const firstPage = [jsonRowText(view, "items<0-10000>"), jsonRowText(view, "items<990000-1000000>")].join();
    view.selectPath(["items", 765432]);
    const selected = [view.getSelectedPathText(), view.getSelectedValue(), jsonRowText(view, "items[765432]")].join();
    const rowsAfter = view.tree.elem.querySelectorAll('[role="treeitem"]').length;
    const time = Date.now() - started;
    view.remove();
    const names = {};
    for (let index = 0; index < 25; index++) names["k" + index] = index;
    const small = JsonView({ width: 300, height: 200, value: names, pageSize: 10 });
    await wait(20);
    const objectPages = jsonRowCount(small);
    small.selectPath(["k17"]);
    const inObject = [small.getSelectedPathText(), small.getSelectedValue()].join();
    mouseClick(small.tree.getRowElem("$<10-20>"));
    const page = [small.getSelectedPathText(), Object.keys(small.getSelectedValue()).length, Object.keys(small.getSelectedValue())[0]].join();
    small.remove();
    const exact = [JsonView.pageStep(100, 100), JsonView.pageStep(101, 100), JsonView.pageStep(10000, 100), JsonView.pageStep(10001, 100), JsonView.pageStep(1000000, 100)].join();
    check("JsonView: a long list comes in pages: a million items open at once, and selectPath() goes through them",
        pages === 101 && firstPage === "[0 … 9999],[990000 … 999999]" && selected === "items[765432],765432,765432765432" && rowsAfter < 500 && time < 3000 &&
        objectPages === 3 && inObject === "k17,17" && page === "$,10,k10" && exact === "1,100,100,10000,10000",
        [pages, firstPage, selected, rowsAfter, time, objectPages, inObject, page, exact].join(" | "));
});

test("JsonView: setJsonText(): a good text is drawn, a text that is not JSON shows its error", async function () {
    const view = JsonView({ width: 300, height: 200 });
    await wait(20);
    const good = [view.setJsonText('{"a": [1]}'), jsonRowText(view, "a"), view.errorText].join("|");
    const empty = view.tree.lblEmpty;
    const normalColor = view.style.tree.empty.textColor;
    const bad = view.setJsonText('{"a": }');
    const badState = [bad, jsonRowCount(view), view.errorText.length > 0, empty.elem.textContent === view.errorText, view.getValue(), view.tree.lblEmpty.textColor === view.style.error.textColor].join();
    view.setTheme("dark");
    const afterTheme = [view.tree.lblEmpty.elem.textContent === view.errorText, view.tree.lblEmpty.textColor === view.style.error.textColor].join();
    view.setTheme("light");
    view.setValue(null);
    const clean = [view.errorText, view.tree.lblEmpty.elem.textContent, view.tree.lblEmpty.textColor === normalColor].join();
    check("JsonView: setJsonText(): a good text is drawn, a text that is not JSON shows its error",
        good === "1|a[1]|" && badState === "0,0,true,true,,true" && afterTheme === "true,true" && clean === ",No value,true",
        [good, badState, afterTheme, clean].join(" | "));
    view.remove();
});

test("JsonView: Ctrl+C and the right click copy a value or a path; a right click selects its row", async function () {
    const copied = [];
    const told = [];
    const realCopy = JsonView.copyToClipboard;
    JsonView.copyToClipboard = function (text) {
        copied.push(text);
        return Promise.resolve();
    };
    const value = { name: "Ada", sub: { a: 1 }, number: 5 };
    const view = JsonView({ width: 300, height: 300, value: value, onCopy: function (self, text) { told.push(text); } });
    await wait(30);
    const area = view.tree.listArea.elem;
    key(area, "keydown", "c", { ctrlKey: true }); // Nothing is selected
    const nothing = copied.length;
    mouseClick(view.tree.getRowElem("name"));
    const event = new KeyboardEvent("keydown", { key: "c", metaKey: true, bubbles: true, cancelable: true });
    area.dispatchEvent(event);
    mouseClick(view.tree.getRowElem("sub"));
    key(area, "keydown", "C", { ctrlKey: true });
    mouseClick(view.tree.getRowElem("number"));
    key(area, "keydown", "c", { ctrlKey: true });
    key(area, "keydown", "c");
    await wait(10);
    const byKeys = copied.join("|");
    copied.length = 0;
    const rightClick = function (element) {
        element.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 40, button: 2 }));
    };
    rightClick(view.tree.getRowElem("sub.a"));
    const menu = view.menu;
    const opened = [menu.isOpen(), view.getSelectedPathText()].join();
    menu.clickItem(1);
    rightClick(view.tree.getRowElem("name"));
    menu.clickItem(0);
    await wait(10);
    const byMenu = copied.join("|");
    rightClick(area);
    const onEmptyPlace = menu.isOpen();
    rightClick(view.tree.getRowElem("name"));
    const backOnRow = menu.isOpen();
    menu.close();
    JsonView.copyToClipboard = realCopy;
    check("JsonView: Ctrl+C and the right click copy a value or a path; a right click selects its row",
        nothing === 0 && event.defaultPrevented && byKeys === 'Ada|{\n  "a": 1\n}|5' && opened === "1,sub.a" && byMenu === "sub.a|Ada" && onEmptyPlace == 0 && backOnRow == 1 && told.length === 5,
        [nothing, event.defaultPrevented, byKeys, opened, byMenu, onEmptyPlace, backOnRow, told.length].join(" | "));
    view.remove();
});

test("JsonView: setTheme(): a new package; the open rows, the selection, the scroll and the style of the page stay", async function () {
    const value = { a: { b: 1 }, c: { d: 2 } };
    for (let index = 0; index < 40; index++) value["k" + index] = index;
    const view = JsonView({ width: 300, height: 120, value: value, expandLevel: 0, style: { kinds: { number: "tomato" } } });
    await wait(30);
    view.tree.expand("a");
    view.tree.expand("c");
    view.tree.collapse("a");
    mouseClick(view.tree.getRowElem("c.d"));
    view.tree.listArea.elem.scrollTop = 60;
    const oldTree = view.tree;
    const oldMenu = view.menu;
    const lightGround = view.elem.style.backgroundColor;
    view.setTheme("dark");
    const replaced = [oldTree.isRemoved, oldMenu.isRemoved, view.menu.styleName].join();
    const stays = [view.tree.getRowElem("a.b") === null || view.tree.getRowElem("a.b").getClientRects().length === 0, jsonRowText(view, "c.d"), view.getSelectedPathText(), view.tree.listArea.elem.scrollTop].join();
    const colors = [view.elem.style.backgroundColor !== lightGround, view.tree.getNode("c").textColor === JsonView.styles.dark.kinds.key, view.tree.getNode("c.d").descriptionColor].join();
    const font = getComputedStyle(view.tree.getRowElem("c")).fontFamily.includes("monospace");
    mouseClick(view.tree.getRowElem("c"));
    const stillWorks = view.getSelectedPathText();
    view.setTheme("light");
    const back = [view.elem.style.backgroundColor === lightGround, view.styleName].join();
    check("JsonView: setTheme(): a new package; the open rows, the selection, the scroll and the style of the page stay",
        replaced === "1,1,dark" && stays === "true,d2,c.d,60" && colors === "true,true,tomato" && font && stillWorks === "c" && back === "true,light",
        [replaced, stays, colors, font, stillWorks, back].join(" | "));
    view.remove();
});

test("JsonView: expandAll() stops at its limit, collapseAll() closes; setValue() starts the open rows again", async function () {
    const value = { a: { b: { c: { d: 1 } } }, e: [1, [2, [3]]] };
    const view = JsonView({ width: 300, height: 300, value: value, expandLevel: 0 });
    await wait(30);
    view.expandAll();
    const all = jsonRowCount(view);
    view.collapseAll();
    const closed = jsonRowCount(view);
    view.tree.expand("a");
    view.setValue(value);
    const again = jsonRowCount(view);
    const items = [];
    for (let index = 0; index < 90; index++) items.push(["a", "b", "c", "d"]);
    const limit = JsonView.MAX_ROWS_OF_EXPAND_ALL;
    JsonView.MAX_ROWS_OF_EXPAND_ALL = 40;
    view.setValue(items);
    view.expandAll();
    const stopped = view.tree.elem.querySelectorAll('[role="treeitem"]').length;
    JsonView.MAX_ROWS_OF_EXPAND_ALL = limit;
    check("JsonView: expandAll() stops at its limit, collapseAll() closes; setValue() starts the open rows again",
        all === 10 && closed === 2 && again === 2 && stopped < 160, [all, closed, again, stopped].join(" | "));
    view.remove();
});

test("JsonView: height \"auto\" grows with its rows, a number scrolls; remove() takes its menu", async function () {
    const value = {};
    for (let index = 0; index < 30; index++) value["k" + index] = index;
    const auto = JsonView({ width: 300, height: "auto", value: { a: 1 } });
    await wait(30);
    const small = auto.elem.offsetHeight;
    auto.setValue(value);
    await wait(30);
    const big = auto.elem.offsetHeight;
    auto.remove();
    const fixed = JsonView({ width: 300, height: 100, value: value });
    await wait(30);
    const fixedHeight = fixed.elem.offsetHeight;
    const scrolls = (fixed.tree.listArea.elem.scrollHeight > fixed.tree.listArea.elem.clientHeight);
    const menu = fixed.menu;
    fixed.remove();
    fixed.remove();
    check("JsonView: height \"auto\" grows with its rows, a number scrolls; remove() takes its menu",
        big > small * 10 && small > 20 && fixedHeight === 100 && scrolls && menu.isRemoved == 1 && fixed.isRemoved == 1,
        [small, big, fixedHeight, scrolls, menu.isRemoved, fixed.isRemoved].join(" | "));
});

test("JsonView: the kinds and the texts of unusual values; the text of a path", async function () {
    const date = new Date(Date.UTC(2026, 10, 7));
    const kinds = [null, undefined, 1, "a", true, [], {}, date, BigInt(5), function () {}].map(JsonView.kindOf).join();
    const texts = [JsonView.valueText(date, "string"), JsonView.valueText(BigInt(5), "number"), JsonView.valueText(undefined, "null"), JsonView.valueText("a\nb", "string")].join("|");
    const paths = [JsonView.pathText([]), JsonView.pathText(["a"]), JsonView.pathText(["a", "b"]), JsonView.pathText([0, 1]), JsonView.pathText(["a b", "c.d", "e"]), JsonView.pathText(["$x", "_y"])].join("|");
    const copies = [JsonView.textToCopy("a"), JsonView.textToCopy(1), JsonView.textToCopy(null), JsonView.textToCopy([1])].join("|");
    const round = { a: 1 };
    round.self = round;
    const roundCopy = JsonView.textToCopy(round);
    const view = JsonView({ width: 300, height: 200, value: round });
    await wait(20);
    const began = Date.now();
    view.expandAll();
    const withItself = (jsonRowCount(view) > 2 && jsonRowCount(view) < 100 && Date.now() - began < 1000);
    view.remove();
    check("JsonView: the kinds and the texts of unusual values; the text of a path",
        kinds === "null,null,number,string,boolean,array,object,string,number,null" &&
        texts === '"2026-11-07T00:00:00.000Z"|5|undefined|"a\\nb"' &&
        paths === '$|a|a.b|[0][1]|["a b"]["c.d"].e|$x._y' && copies === "a|1|null|[\n  1\n]" && roundCopy === "[object Object]" && withItself,
        [kinds, texts, paths, copies, roundCopy, withItself].join(" | "));
});

test("TreeView: the text of an empty tree stands inside the tree, also the error of a JsonView", async function () {
    const isInside = function (label, owner) {
        const rect = label.elem.getBoundingClientRect();
        const around = owner.elem.getBoundingClientRect();
        return (rect.left >= around.left && rect.right <= around.right && rect.top >= around.top && rect.bottom <= around.bottom && rect.height > 0);
    };
    const tree = TreeView({ left: 30, top: 30, width: 300, height: 200 });
    await wait(20);
    const empty = isInside(tree.lblEmpty, tree);
    tree.remove();
    const view = JsonView({ left: 30, top: 30, width: 300, height: 200 });
    view.setJsonText("{ not json");
    await wait(20);
    const error = isInside(view.tree.lblEmpty, view);
    view.remove();
    check("TreeView: the text of an empty tree stands inside the tree, also the error of a JsonView", empty && error, [empty, error].join(" | "));
});

test("TreeView: descriptionColor paints a description, getNodeOfEvent() finds the row of an event", async function () {
    const tree = TreeView({ left: 0, top: 0, width: 300, height: 200, items: [{ key: "a", text: "A", description: "n", descriptionColor: "red" }, { key: "b", text: "B", description: "m" }] });
    await wait(20);
    const noteOf = function (key) { return tree.getRowElem(key).lastElementChild; };
    const colored = noteOf("a").style.color;
    const plainColor = noteOf("b").style.color;
    tree.updateNode("b", { descriptionColor: "blue" });
    const updated = noteOf("b").style.color;
    let found = null;
    tree.listArea.on("mousemove", function (self, event) { found = tree.getNodeOfEvent(event); });
    noteOf("b").dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    const onRow = (found) ? found.key : "";
    tree.listArea.elem.dispatchEvent(new MouseEvent("mousemove", { bubbles: true }));
    const onEmpty = found;
    check("TreeView: descriptionColor paints a description, getNodeOfEvent() finds the row of an event",
        colored === "red" && plainColor !== "red" && updated === "blue" && onRow === "b" && onEmpty === null,
        [colored, plainColor, updated, onRow, onEmpty].join(" | "));
    tree.remove();
});

// *** JSON EDITOR (comp/json-editor.js)

const jsonContentOf = function (editor) {
    return editor.elem.querySelector("div.json-editor-scroll").firstElementChild;
};

// The field of a cell (the first textarea of the editor; the second is the JSON view)
const jsonFieldOf = function (editor) {
    return editor.elem.querySelector("textarea");
};

// A click on a cell: its row (from 0) and the title of its column. x: from the left of the cell.
const clickJsonCell = function (editor, rowIndex, title, x) {
    const titleLabel = Array.from(editor.elem.querySelectorAll("*")).find(function (el) {
        const isTitle = (el.childElementCount === 0 && el.textContent.trim().replace(/ [↑↓]$/, "") === title);
        return isTitle && !el.closest("div.json-editor-scroll") && !editor.titleBar.elem.contains(el);
    });
    const cellRect = titleLabel.parentElement.getBoundingClientRect();
    const contentRect = jsonContentOf(editor).getBoundingClientRect();
    const point = { clientX: cellRect.left + (x || 20), clientY: contentRect.top + rowIndex * 30 + 15, bubbles: true, cancelable: true };
    jsonContentOf(editor).dispatchEvent(new MouseEvent("click", point));
};

const writeJsonCell = function (editor, text, keyName) {
    const field = jsonFieldOf(editor);
    field.value = text;
    key(field, "keydown", keyName || "Enter");
};

test("JsonEditor: every shape of a list and an object comes back as it was; the value of the page is not changed", async function () {
    const values = [
        [{ a: 1, b: "x" }, { a: 2, c: true }],
        ["A", "B"],
        [[1, 2], [3, 4, 5]],
        ["A", { text: "B", key: "b" }, "-"],
        { name: "Ada", age: 36, tags: ["a", "b"], address: { city: "İzmir" }, phone: null },
        [],
    ];
    const texts = values.map(function (value) { return JSON.stringify(value); });
    const results = values.map(function (value, index) {
        const editor = JsonEditor({ width: 500, height: 200, value: value });
        const isSame = JSON.stringify(editor.getValue()) === texts[index];
        editor.remove();
        return isSame;
    });
    const isUntouched = values.every(function (value, index) { return JSON.stringify(value) === texts[index]; });
    check("JsonEditor: every shape of a list and an object comes back as it was; the value of the page is not changed", results.every(Boolean) && isUntouched, results.join() + " | untouched: " + isUntouched);
});

test("JsonEditor: a cell is written with a click and Enter; a number stays a number, a text that is not a number stays a text; onChange gives the value", async function () {
    const changes = [];
    const editor = JsonEditor({ width: 600, height: 260, value: [{ name: "Apple", price: 1.2 }, { name: "Pear", price: 2 }], onChange: function (self, value) { changes.push(value); } });
    await wait(20);
    clickJsonCell(editor, 0, "name");
    writeJsonCell(editor, "Green apple"); // WHY Escape after it: Enter opens the cell of the next row
    key(jsonFieldOf(editor), "keydown", "Escape");
    clickJsonCell(editor, 1, "price");
    writeJsonCell(editor, "2.5", "Tab");
    key(jsonFieldOf(editor), "keydown", "Escape");
    clickJsonCell(editor, 0, "price");
    writeJsonCell(editor, "free");
    key(jsonFieldOf(editor), "keydown", "Escape");
    const value = editor.getValue();
    const isLastChange = (JSON.stringify(changes[changes.length - 1]) === JSON.stringify(value));
    const row = [value[0].name, value[1].price, typeof value[1].price, value[0].price, changes.length, isLastChange].join(" | ");
    check("JsonEditor: a cell is written with a click and Enter; a number stays a number, a text that is not a number stays a text; onChange gives the value", row === "Green apple | 2.5 | number | free | 3 | true", row);
    editor.remove();
});

test("JsonEditor: a switch turns with a click (true -> false, 1 -> 0); a color has its swatch; a choice opens its list, and its menu goes with remove()", async function () {
    const editor = JsonEditor({ width: 700, height: 260, value: [{ name: "A", inStock: true, active: 1, color: "#D64545", unit: "kg" }], columns: [{ key: "unit", options: ["kg", "box"] }] });
    await wait(20);
    clickJsonCell(editor, 0, "inStock");
    clickJsonCell(editor, 0, "active");
    const hasSwatch = Array.from(editor.elem.querySelectorAll("div")).some(function (el) { return el.style.background.indexOf("rgb(214, 69, 69)") !== -1; });
    const unitTitle = findByText("unit", editor.elem);
    clickJsonCell(editor, 0, "unit", unitTitle.parentElement.offsetWidth - 10);
    await wait(30);
    const menu = Array.from(document.querySelectorAll("[role=menu]")).find(function (el) { return el.getClientRects().length > 0; }); // WHY not offsetParent: the menu is fixed
    const item = (menu) ? findByText("box", menu) : null;
    if (item) item.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await wait(30);
    const value = editor.getValue()[0];
    editor.remove();
    const isMenuGone = (!!menu && !menu.isConnected);
    const row = [value.inStock, value.active, hasSwatch, !!item, value.unit, isMenuGone].join(" | ");
    check("JsonEditor: a switch turns with a click (true -> false, 1 -> 0); a color has its swatch; a choice opens its list, and its menu goes with remove()", row === "false | 0 | true | true | box | true", row);
});

test("JsonEditor: a list in a cell opens as a table of its own; getValue() has it while it is open; the path goes back; one undo brings the cell back", async function () {
    const editor = JsonEditor({ width: 600, height: 300, titleText: "Items", value: [{ name: "A", tags: ["x", "y"] }] });
    await wait(20);
    clickJsonCell(editor, 0, "tags");
    const pathText = editor.titleRow.elem.textContent;
    clickJsonCell(editor, 0, "value");
    writeJsonCell(editor, "z");
    key(jsonFieldOf(editor), "keydown", "Escape");
    const whileOpen = editor.getValue()[0].tags.join();
    findByText("Items", editor.titleRow.elem).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const afterBack = editor.getValue()[0].tags.join();
    const pathAfter = editor.titleRow.elem.textContent;
    editor.undo();
    const afterUndo = editor.getValue()[0].tags.join();
    const row = [pathText.indexOf("row 1 · tags") !== -1, whileOpen, afterBack, pathAfter, afterUndo].join(" | ");
    check("JsonEditor: a list in a cell opens as a table of its own; getValue() has it while it is open; the path goes back; one undo brings the cell back", row === "true | z,y | z,y | Items | x,y", row);
    editor.remove();
});

test("JsonEditor: an object: a name used twice makes no value (getValue() null, errorText) and no onChange, until the name is right", async function () {
    const changes = [];
    const editor = JsonEditor({ width: 600, height: 260, value: { a: 1, b: "x" }, onChange: function (self, value) { changes.push(value); } });
    await wait(20);
    clickJsonCell(editor, 1, "name");
    writeJsonCell(editor, "a");
    key(jsonFieldOf(editor), "keydown", "Escape");
    const twice = [editor.getValue(), editor.errorText, changes.length].join(" | ");
    clickJsonCell(editor, 1, "name");
    writeJsonCell(editor, "c");
    key(jsonFieldOf(editor), "keydown", "Escape");
    const fixed = [JSON.stringify(editor.getValue()), editor.errorText, changes.length].join(" | ");
    const row = twice + " / " + fixed;
    check("JsonEditor: an object: a name used twice makes no value (getValue() null, errorText) and no onChange, until the name is right", row === " | The name \"a\" is used twice. | 0 / {\"a\":1,\"c\":\"x\"} |  | 1", row);
    editor.remove();
});

test("JsonEditor: the JSON view: a broken text stays and says why; a good one goes into the table (one undo step); the functions of the rows stay", async function () {
    const onClick = function () { };
    const editor = JsonEditor({ width: 600, height: 260, value: [{ key: "a", text: "A", onClick: onClick }] });
    await wait(20);
    editor.setView("json");
    const area = editor.elem.querySelectorAll("textarea")[1];
    const hasFunctionText = (area.value.indexOf("onClick") !== -1);
    area.value = "[1, ";
    const isBrokenKept = (!editor.setView("table") && editor.getView() === "json" && /^Not JSON/.test(editor.errorText));
    area.value = '[{"key": "a", "text": "Hello"}, {"key": "b", "text": "B"}]';
    const isGood = editor.setView("table");
    const value = editor.getValue();
    const isKept = (value[0].onClick === onClick && value[1].onClick === undefined);
    editor.undo();
    const afterUndo = editor.getValue();
    const row = [hasFunctionText, isBrokenKept, isGood, value[0].text, isKept, afterUndo.length, afterUndo[0].text, afterUndo[0].onClick === onClick].join(" | ");
    check("JsonEditor: the JSON view: a broken text stays and says why; a good one goes into the table (one undo step); the functions of the rows stay", row === "false | true | true | Hello | true | 1 | A | true", row);
    editor.remove();
});

test("JsonEditor: paste: lines of a spreadsheet go into the cells from the chosen one; a JSON list adds its rows and its new columns", async function () {
    const editor = JsonEditor({ width: 600, height: 260, value: [{ name: "A", price: 1 }, { name: "B", price: 2 }] });
    await wait(20);
    const paste = function (text) {
        const data = new DataTransfer();
        data.setData("text/plain", text);
        jsonContentOf(editor).dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    };
    clickJsonCell(editor, 1, "name");
    key(jsonFieldOf(editor), "keydown", "Escape"); // WHY: the cell stays chosen, its field closes
    paste("Pear\t3.5\nPlum\t4");
    const afterGrid = editor.getValue().map(function (item) { return item.name + " " + item.price; }).join(", ");
    paste('[{"name": "Lime", "origin": "Mexico"}]');
    const afterJson = editor.getValue();
    const row = [afterGrid, afterJson.length, afterJson[3].origin].join(" | ");
    check("JsonEditor: paste: lines of a spreadsheet go into the cells from the chosen one; a JSON list adds its rows and its new columns", row === "A 1, Pear 3.5, Plum 4 | 4 | Mexico", row);
    editor.remove();
});

test("JsonEditor: the keys it uses do not go on to the page; a letter writes in the chosen cell, Delete empties it; Tab leaves the table at its last cell", async function () {
    let pageKeys = 0;
    const countKey = function () { pageKeys++; };
    document.addEventListener("keydown", countKey);
    const editor = JsonEditor({ width: 600, height: 260, value: [{ name: "A", price: 1 }] });
    await wait(20);
    const content = jsonContentOf(editor);
    content.focus();
    key(content, "keydown", "ArrowDown");
    key(content, "keydown", "Q");
    const field = jsonFieldOf(editor);
    const isWritingQ = (field.value === "Q" && document.activeElement === field);
    key(field, "keydown", "Enter");
    const afterLetter = editor.getValue()[0].name;
    key(content, "keydown", "ArrowRight");
    key(content, "keydown", "Delete");
    const afterDelete = JSON.stringify(editor.getValue());
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    content.dispatchEvent(tab);
    document.removeEventListener("keydown", countKey);
    const row = [isWritingQ, afterLetter, afterDelete, !tab.defaultPrevented, pageKeys].join(" | ");
    check("JsonEditor: the keys it uses do not go on to the page; a letter writes in the chosen cell, Delete empties it; Tab leaves the table at its last cell", row === "true | Q | [{\"name\":\"Q\"}] | true | 1", row);
    editor.remove();
});

test("JsonEditor.open: Apply gives the value only after a change; Escape asks first when something was changed; Cmd/Ctrl+Enter applies", async function () {
    const applied = [];
    let canceled = 0;
    const callbacks = {
        onApply: function (value) { applied.push(value); },
        onCancel: function () { canceled++; },
    };
    const changeFirstCell = function (win, text) {
        clickJsonCell(win.editor, 0, "value");
        writeJsonCell(win.editor, text);
        key(jsonFieldOf(win.editor), "keydown", "Escape");
    };
    const quiet = JsonEditor.open(Object.assign({ value: ["A", "B"] }, callbacks));
    await wait(20);
    const isOver = (Number(getComputedStyle(quiet.elem).zIndex) >= 3900);
    findByText("Apply", quiet.elem).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const isQuietClosed = (quiet._isRemoved && applied.length === 0);
    const asking = JsonEditor.open(Object.assign({ value: ["A", "B"] }, callbacks));
    await wait(20);
    changeFirstCell(asking, "Z");
    key(jsonContentOf(asking.editor), "keydown", "Escape");
    const isAsked = (!asking._isRemoved && !!findByText("Discard the changes?", asking.elem));
    key(jsonContentOf(asking.editor), "keydown", "Escape");
    const isCanceled = (asking._isRemoved && canceled === 1);
    const applying = JsonEditor.open(Object.assign({ value: ["A"] }, callbacks));
    await wait(20);
    changeFirstCell(applying, "Y");
    key(jsonContentOf(applying.editor), "keydown", "Enter", { metaKey: true });
    const row = [isOver, isQuietClosed, isAsked, isCanceled, applying._isRemoved, JSON.stringify(applied)].join(" | ");
    check("JsonEditor.open: Apply gives the value only after a change; Escape asks first when something was changed; Cmd/Ctrl+Enter applies", row === "true | true | true | true | 1 | [[\"Y\"]]", row);
    [quiet, asking, applying].forEach(function (win) { win.close(); });
});

test("JsonEditor: onPickColor and onPickPicture get the cell; its setValue() writes it (the writes of one pick are one undo step); pictureBase reads a relative picture", async function () {
    const picks = [];
    const editor = JsonEditor({
        width: 600,
        height: 260,
        value: [{ name: "A", color: "#FF0000", picture: "a.png" }],
        pictureBase: "https://pictures.invalid/shop/",
        onPickColor: function (self, cell) { picks.push(cell); },
        onPickPicture: function (self, cell) { picks.push(cell); },
    });
    await wait(20);
    clickJsonCell(editor, 0, "color", 12);
    clickJsonCell(editor, 0, "picture", 12);
    const colorCell = picks[0];
    const pictureCell = picks[1];
    colorCell.setValue("#00FF00");
    colorCell.setValue("#0000FF"); // WHY two: a picker writes while it is dragged
    pictureCell.setValue("b.png");
    const picked = editor.getValue()[0];
    editor.undo();
    editor.undo();
    const back = editor.getValue()[0];
    const hasThumb = Array.from(editor.elem.querySelectorAll("div")).some(function (el) { return el.style.backgroundImage.indexOf("https://pictures.invalid/shop/a.png") !== -1; });
    const row = [picks.length, colorCell.key, colorCell.value, pictureCell.key, colorCell.rect.width > 0, picked.color, picked.picture, back.color, back.picture, hasThumb].join(" | ");
    check("JsonEditor: onPickColor and onPickPicture get the cell; its setValue() writes it (the writes of one pick are one undo step); pictureBase reads a relative picture", row === "2 | color | #FF0000 | picture | true | #0000FF | b.png | #FF0000 | a.png | true", row);
    editor.remove();
});

test("JsonEditor: columns of a column give the columns of the empty list in its cells; JsonEditor.open calls onClose once", async function () {
    const editor = JsonEditor({
        width: 600,
        height: 260,
        value: [{ name: "A", items: [] }],
        columns: [{ key: "items", columns: [{ key: "sku" }, { key: "count", kind: "number" }] }],
    });
    await wait(20);
    clickJsonCell(editor, 0, "items");
    const hasColumns = (!!findByText("sku", editor.elem) && !!findByText("count", editor.elem));
    clickJsonCell(editor, 0, "sku"); // WHY: under the rows of an empty list: + Add a row
    writeJsonCell(editor, "X1", "Tab");
    writeJsonCell(editor, "4", "Tab");
    const value = JSON.stringify(editor.getValue());
    editor.remove();
    let closes = 0;
    const win = JsonEditor.open({ value: ["A"], onClose: function () { closes++; } });
    await wait(20);
    win.close();
    win.close();
    const row = [hasColumns, value, closes].join(" | ");
    check("JsonEditor: columns of a column give the columns of the empty list in its cells; JsonEditor.open calls onClose once", row === "true | [{\"name\":\"A\",\"items\":[{\"sku\":\"X1\",\"count\":4}]}] | 1", row);
});

test("JsonEditor minimal and minimalDark: 28 px rows, a 13 px text, no line between the columns, the knob of a switch that is on shows; light and dark do not change", async function () {
    const light = JsonEditor({ width: 500, height: 200, styleName: "minimal", value: [{ name: "A", on: true }] });
    const dark = JsonEditor({ width: 500, height: 200, styleName: "minimalDark", value: [{ name: "A", on: true }] });
    await wait(20);
    const looks = [light, dark].map(function (editor) {
        const firstRow = jsonContentOf(editor).lastElementChild.firstElementChild;
        const nameCell = firstRow.children[1];
        const switchCell = firstRow.children[2];
        const knob = switchCell.firstElementChild.firstElementChild;
        return [firstRow.offsetHeight, nameCell.lastElementChild.style.fontSize, nameCell.style.borderRightColor, knob.style.backgroundColor].join(" ");
    });
    light.remove();
    dark.remove();
    const isKept = (JsonEditor.styles.light.rowHeight === 30 && JsonEditor.styles.light.colors.columnLine === "#EBEBEA" && JsonEditor.styles.dark.colors.text === "#FFFFFF");
    const row = looks.join(" / ") + " | " + isKept;
    check("JsonEditor minimal and minimalDark: 28 px rows, a 13 px text, no line between the columns, the knob of a switch that is on shows; light and dark do not change", row === "28 13px transparent rgb(255, 255, 255) / 28 13px transparent rgb(26, 26, 25) | true", row);
});

test("JsonEditor: colorOf paints a color only the page can read; optionsOf gives the choices of a text (a column, a row of an object), never of a number or of a name of the table", async function () {
    const asked = [];
    const optionsOf = function (key) {
        asked.push(key);
        return (key === "tone") ? ["cyan", "orange"] : null;
    };
    // A choice: a click at the end of the cell opens its list, the item is clicked
    const pickAtEnd = async function (editor, title, text) {
        const titleLabel = findByText(title, editor.elem);
        clickJsonCell(editor, 0, title, titleLabel.parentElement.offsetWidth - 10);
        await wait(30);
        const menu = Array.from(document.querySelectorAll("[role=menu]")).find(function (el) { return el.getClientRects().length > 0; }); // WHY not offsetParent: the menu is fixed
        const item = (menu) ? findByText(text, menu) : null;
        if (item) item.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await wait(30);
    };
    const list = JsonEditor({
        width: 600,
        height: 260,
        value: [{ name: "A", color: "var(--a-token-of-the-page)", tone: "cyan", size: 3 }],
        colorOf: function (value) { return (value === "var(--a-token-of-the-page)") ? "#123456" : value; },
        optionsOf: optionsOf,
    });
    await wait(20);
    const hasSwatch = Array.from(list.elem.querySelectorAll("div")).some(function (el) { return el.style.background.indexOf("rgb(18, 52, 86)") !== -1; });
    await pickAtEnd(list, "tone", "orange");
    const listTone = list.getValue()[0].tone;
    list.remove();
    const object = JsonEditor({ width: 600, height: 260, value: { tone: "cyan", count: 2 }, optionsOf: optionsOf });
    await wait(20);
    await pickAtEnd(object, "value", "orange");
    const objectTone = object.getValue().tone;
    object.remove();
    const isNumberAsked = (asked.indexOf("size") !== -1 || asked.indexOf("count") !== -1);
    const isOwnKeyAsked = asked.some(function (key) { return JsonEditor.isOwnKey(key); });
    const row = [hasSwatch, listTone, objectTone, isNumberAsked, isOwnKeyAsked].join(" | ");
    check("JsonEditor: colorOf paints a color only the page can read; optionsOf gives the choices of a text (a column, a row of an object), never of a number or of a name of the table", row === "true | orange | orange | false | false", row);
});

test("JsonEditor: the bar under the rows only when the columns do not fit: none in a narrower table that fits and in the window of open() (in WebKit a bar of a moment was a ResizeObserver loop), one when a column is dragged wider", async function () {
    const sideScrollOf = function (editor) {
        return getComputedStyle(editor.elem.querySelector("div.json-editor-scroll")).overflowX;
    };
    const editor = JsonEditor({ width: 700, height: 200, value: [{ name: "Apple", price: 1.2 }] });
    await wait(30);
    const atStart = sideScrollOf(editor);
    editor.width = 500;
    await wait(60);
    const narrower = sideScrollOf(editor);
    const edge = Array.from(editor.elem.querySelectorAll("div")).find(function (el) { return el.style.cursor === "col-resize"; });
    const edgeX = edge.getBoundingClientRect().left + 2;
    edge.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: edgeX, bubbles: true, cancelable: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: edgeX + 400, bubbles: true }));
    window.dispatchEvent(new PointerEvent("pointerup", { clientX: edgeX + 400, bubbles: true }));
    await wait(30);
    const dragged = sideScrollOf(editor);
    const longText = "a long text in a cell ".repeat(3);
    editor.setValue([{ a: longText, b: longText, c: longText }]);
    await wait(30);
    const wider = sideScrollOf(editor);
    editor.remove();
    const win = JsonEditor.open({ value: [{ name: "Apple" }] });
    await wait(60);
    const inWindow = sideScrollOf(win.editor);
    win.close();
    const row = [atStart, narrower, dragged, wider, inWindow].join(" | ");
    check("JsonEditor: the bar under the rows only when the columns do not fit: none in a narrower table that fits and in the window of open() (in WebKit a bar of a moment was a ResizeObserver loop), one when a column is dragged wider", row === "hidden | hidden | auto | auto | hidden", row);
});

// *** TIME LINE (comp/time-line.js)

test("TimeLine: the style packages; what the page gave stays over them, after setTheme() too; the default look is as before", async function () {
    const firstRowOf = function (line) { return line.content.elem.firstElementChild; };
    const lookOf = function (line) {
        const rail = firstRowOf(line).children[0];
        const title = firstRowOf(line).children[1].firstElementChild;
        return [rail.children[0].style.width, rail.children[0].style.backgroundColor, rail.children[1].style.width, title.style.fontSize].join(" ");
    };
    const plain = TimeLine({ width: 300, items: ["A", "B"] });
    const minimal = TimeLine({ styleName: "minimal", width: 300, items: ["A", "B"] });
    const own = TimeLine({ styleName: "minimal", dotSize: 11, width: 300, items: ["A", "B"], style: { title: { fontSize: 17 } } });
    await basic.nextFrame();
    const plainLook = lookOf(plain);
    const minimalLook = lookOf(minimal);
    const ownLook = lookOf(own);
    own.setTheme("dark");
    const ownDarkLook = lookOf(own);
    minimal.setTheme("light");
    const backToLight = lookOf(minimal);
    check("TimeLine: the default look is as before (a 12 px blue dot, a 2 px line, a 15 px title)", plainLook === "12px rgb(56, 113, 224) 2px 15px", plainLook);
    check("TimeLine minimal: a 7 px ink dot, a 1 px line, a 13 px title", minimalLook === "7px rgb(31, 31, 31) 1px 13px", minimalLook);
    check("TimeLine minimal: the dotSize and the style of the page stay over the package", ownLook === "11px rgb(31, 31, 31) 1px 17px", ownLook);
    check("TimeLine setTheme(\"dark\"): the colors of dark, the sizes of the page, the other sizes of the defaults", ownDarkLook === "11px rgb(108, 152, 239) 2px 17px", ownDarkLook);
    check("TimeLine setTheme(\"light\"): the sizes of the minimal package are gone", backToLight === plainLook, backToLight);
    check("TimeLine: the packages are not changed", TimeLine.styles.minimal.dotSize === 7 && TimeLine.styles.minimal.style.title.fontSize === 13, JSON.stringify(TimeLine.styles.minimal));
    [plain, minimal, own].forEach(function (line) { line.remove(); });
});

test("TimeLine: a text item has only its text, at the top as in an object item (an empty time label and its gap moved it 2 px down)", async function () {
    const line = TimeLine({ width: 300, items: ["A text item", { text: "An object item" }] });
    await basic.nextFrame();
    const textsOf = function (index) { return line.content.elem.children[index].children[1]; };
    const titleTopOf = function (index) { return textsOf(index).firstElementChild.getBoundingClientRect().top - textsOf(index).getBoundingClientRect().top; };
    const labelCounts = [textsOf(0).children.length, textsOf(1).children.length].join();
    const titleTops = [titleTopOf(0), titleTopOf(1)].join();
    check("TimeLine: a text item has only its text, at the top as in an object item", labelCounts === "1,1" && titleTops === "0,0", labelCounts + " | " + titleTops);
    line.remove();
});

// *** CANVAS (comp/canvas.js)

const canvasPointer = function (board, type, x, y) {
    const rect = board.elem.querySelector("canvas").getBoundingClientRect();
    board.elem.querySelector("canvas").dispatchEvent(new PointerEvent(type, { clientX: rect.left + x, clientY: rect.top + y, button: 0, pointerId: 7, bubbles: true }));
};

const canvasPixel = function (board, x, y) {
    const elem = board.elem.querySelector("canvas");
    const ratio = elem.width / elem.clientWidth;
    return Array.from(elem.getContext("2d").getImageData(Math.round(x * ratio), Math.round(y * ratio), 1, 1).data).join();
};

test("Canvas: shapes have keys; update, move, remove and bring to front change only that shape; a copy goes out", async function () {
    const board = Canvas({ left: 0, top: 0, width: 200, height: 120 });
    const line = board.addLine(0, 0, 50, 50);
    const own = board.addRect(10, 10, 20, 20, { key: "box" });
    const twice = board.addRect(0, 0, 5, 5, { key: "box" });
    const noType = board.addShape({ x: 1 });
    board.updateShape("box", { width: 40, fill: "gold" });
    board.moveShape(line, 5, 10);
    const copy = board.getShape("box");
    copy.width = 999;
    const kept = board.getShape("box").width;
    board.addCircle(50, 50, 10, { key: "ball" });
    board.bringToFront("box");
    const order = board.getShapes().map(function (shape) { return shape.key; }).join();
    board.removeShape(line);
    const afterRemove = board.getShapes().length;
    board.clear();
    const afterClear = board.getShapes().length;
    board.remove();
    check("Canvas: shapes have keys; update, move, remove and bring to front change only that shape; a copy goes out",
        line === "s1" && own === "box" && twice === null && noType === null && kept === 40 && copy.fill === "gold" &&
        order === "s1,ball,box" && afterRemove === 2 && afterClear === 0,
        [line, own, twice, noType, kept, order, afterRemove, afterClear].join(" | "));
});

test("Canvas: a click finds the top shape (a thin line too), an empty place gives null", async function () {
    const clicks = [];
    const board = Canvas({ left: 0, top: 0, width: 200, height: 120, onClick: function (self, x, y, shape) { clicks.push(shape ? shape.key : "null@" + x + "," + y); } });
    board.addRect(10, 10, 80, 80, { key: "under" });
    board.addCircle(50, 50, 20, { key: "over" });
    board.addLine(120, 20, 190, 20, { lineWidth: 1, key: "thin" });
    [[50, 50], [15, 15], [150, 23], [150, 100]].forEach(function (place) {
        canvasPointer(board, "pointerdown", place[0], place[1]);
        canvasPointer(board, "pointerup", place[0], place[1]);
    });
    board.remove();
    check("Canvas: a click finds the top shape (a thin line too), an empty place gives null", clicks.join() === "over,under,thin,null@150,100", clicks.join());
});

test("Canvas: a free line becomes a shape (onDrawEnd); a draggable shape moves (onShapeMove), not a click", async function () {
    const events = [];
    const board = Canvas({
        left: 0, top: 0, width: 200, height: 120, drawing: 1, penColor: "tomato", penWidth: 5,
        onDrawEnd: function (self, shape) { events.push("draw " + shape.type + " " + shape.points.length + " " + shape.color + " " + shape.lineWidth); },
        onShapeMove: function (self, shape) { events.push("move " + shape.x + "," + shape.y); },
        onClick: function () { events.push("click"); },
    });
    const touch = board.elem.querySelector("canvas").style.touchAction;
    canvasPointer(board, "pointerdown", 10, 10);
    canvasPointer(board, "pointermove", 40, 20);
    canvasPointer(board, "pointermove", 41, 20); // WHY: nearer than 2 px: no new point
    canvasPointer(board, "pointermove", 80, 60);
    canvasPointer(board, "pointerup", 80, 60);
    board.setDrawing(0);
    board.addCircle(150, 60, 15, { draggable: 1, key: "ball" });
    canvasPointer(board, "pointerdown", 150, 60);
    canvasPointer(board, "pointermove", 160, 70);
    canvasPointer(board, "pointerup", 170, 80);
    const count = board.getShapes().length;
    board.remove();
    check("Canvas: a free line becomes a shape (onDrawEnd); a draggable shape moves (onShapeMove), not a click",
        events.join() === "draw polyline 3 tomato 5,move 160,70" && count === 2 && touch === "none", events.join() + " | " + count + " | " + touch);
});

test("Canvas: the shapes are drawn at once after a change, sharp on the screen; getImage gives a PNG on its ground", async function () {
    const board = Canvas({ left: 0, top: 0, width: 100, height: 60 });
    board.addRect(0, 0, 50, 60, { fill: "rgb(255, 0, 0)" });
    await Promise.resolve();
    const red = canvasPixel(board, 25, 30);
    const ground = canvasPixel(board, 75, 30);
    board.updateShape("s1", { fill: "rgb(0, 0, 255)" });
    const image = board.getImage();
    const blue = canvasPixel(board, 25, 30);
    const elem = board.elem.querySelector("canvas");
    const isSharp = (elem.width === Math.round(elem.clientWidth * (window.devicePixelRatio || 1)));
    board.remove();
    const picture = new Image();
    await new Promise(function (resolve) { picture.onload = resolve; picture.src = image; });
    const reader = document.createElement("canvas");
    reader.width = picture.width;
    reader.height = picture.height;
    reader.getContext("2d").drawImage(picture, 0, 0);
    const pictureGround = Array.from(reader.getContext("2d").getImageData(picture.width - 2, 2, 1, 1).data).join();
    check("Canvas: the shapes are drawn at once after a change, sharp on the screen; getImage gives a PNG on its ground",
        red === "255,0,0,255" && ground === "0,0,0,0" && blue === "0,0,255,255" && image.indexOf("data:image/png;base64,") === 0 && isSharp && pictureGround === "255,255,255,255",
        [red, ground, blue, image.slice(0, 22), isSharp, pictureGround].join(" | "));
});

test("Canvas: setTheme(\"dark\") changes the ground and the pen of a line with no color; a color of the page stays", async function () {
    const board = Canvas({ left: 0, top: 0, width: 100, height: 60, style: { box: { round: 2 } } });
    board.addLine(0, 30, 100, 30, { lineWidth: 6 });
    board.setTheme("dark");
    await Promise.resolve();
    const ground = getComputedStyle(board.elem).backgroundColor;
    const pen = canvasPixel(board, 50, 30);
    const round = getComputedStyle(board.elem).borderTopLeftRadius;
    board.remove();
    check("Canvas: setTheme(\"dark\") changes the ground and the pen of a line with no color; a color of the page stays",
        ground === "rgb(26, 26, 25)" && pen === "230,230,228,255" && round === "2px", [ground, pen, round].join(" | "));
});

test("DataTable: in a table narrower than its columns an \"auto\" column keeps its minWidth; the rows scroll to the side and the titles go with them", async function () {
    const columns = [
        { key: "id", title: "#", width: 60 },
        { key: "name", title: "Name" },
        { key: "city", title: "City", width: 120 },
        { key: "amount", title: "Amount", width: 130 },
    ];
    const table = DataTable({ left: 0, top: 0, width: 300, height: 200, columns: columns, rows: [[1, "Sofia Rodriguez", "Tokyo", 205]] });
    await wait(30);
    const nameCell = table.rowList[0].cells[1];
    const nameWidth = Math.round(nameCell.elem.getBoundingClientRect().width);
    const rowHeight = Math.round(table.rowList[0].elem.getBoundingClientRect().height);
    const isWider = (table.scrollBox.elem.scrollWidth > table.scrollBox.elem.clientWidth);
    table.scrollBox.elem.scrollLeft = 80;
    table.scrollBox.elem.dispatchEvent(new Event("scroll"));
    const titleLeft = table.titleRow.elem.scrollLeft;
    table.remove();
    check("DataTable: in a table narrower than its columns an \"auto\" column keeps its minWidth; the rows scroll to the side and the titles go with them",
        nameWidth === 100 && rowHeight < 100 && isWider && titleLeft === 80, // (the bug: a letter in a line, 300 px)
        "name " + nameWidth + " px, row " + rowHeight + " px, wider: " + isWider + ", titles at " + titleLeft);
});
