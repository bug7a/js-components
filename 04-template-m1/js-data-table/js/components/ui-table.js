/* Bismillah */

/*

UI TABLE v1.3

A table made from a JSON list: the titles from a list of objects, the rows from a list of arrays.
- Sorting by a title (a click on the title, or sort()), searching (filterByText()), selection.
- updateItems() adds, changes and removes rows by their id and keeps the sorting, the search and the selection.
- Every part can be styled: setTitleRowStyle(), setTitleCellStyle(), setItemRowStyle(), setItemCellStyle().
  A cell can hold its own objects (createItemCellContentBox: 1, itemCell.box).
- The texts of the cells are plain text (a value can not inject HTML); a title can be HTML (an icon in it).
- The table can be moved into an HTML element of the page (moveIntoDiv()): it works in a normal web page too.

The options and the methods: guide.js

Started Date: 1 October 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Web Site: https://bugraozden.com/

*/

"use strict";
window.UITable = {};

// SHARED VARIABLES:
UITable.default = {};
UITable.resetDefault = function () {

    Object.assign(UITable.default, {

        // Table
        width: "100%", // "100%", "calc(100% - 20px)" or number.
        height: "100%", // "100%", "calc(100% - 20px)" or number.
        showWithMotion: 1, // 1 or 0
        borderString: "1px solid lightgray",
        borderRadius: "6px 6px 6px 6px",
        boxShadow: "0px 0px 6px 2px rgba(0, 0, 0, 0.1)", // "none"
        backgroundColor: "white",

        // Titles
        titleHeight: 50, // only number
        titleTopInnerSpace: "auto", // "auto" or number
        titleRowBackgroundColor: "whitesmoke",
        titleRowBottomBorderString: "1px solid rgba(0, 0, 0, 0.2)", // "none"
        titleCellBackgroundColor: "whitesmoke",
        titleCellRightBorderString: "1px solid rgba(0, 0, 0, 0.08)",
        titleCellBottomBorderString: "1px solid rgba(0, 0, 0, 0.2)",
        titleFontSize: 16,
        titleFontFamily: "opensans-bold",
        titleTextColor: "rgba(0, 0, 0, 0.8)",
        titleBoxShadow: "-2px 0px 8px 2px rgba(0, 0, 0, 0.15)",
        createTitleCellContentBox: 0, // for special cell content.
        createTitleCellBackground: 1, // for special cell background.

        // Items
        itemsCanSelectable: 1, // 1 or 0
        noItemAddedAlert: "There are no records.",
        noItemFoundAlert: "No records found.",
        itemHeight: "auto", // "auto" or number like 80
        itemRowBottomBorderString: "1px solid rgba(0, 0, 0, 0.1)",
        itemCellRightBorderString: "1px solid rgba(0, 0, 0, 0.03)",
        itemOddBackgroundColor: "white",
        itemEvenBackgroundColor: "whitesmoke",
        itemSelectedBackgroundColor: "rgba(254, 193, 8, 0.1)",
        itemFontSize: 16,
        itemFontFamily: "opensans",
        itemTextColor: "rgba(0, 0, 0, 0.7)",
        leftRightInnerSpace: 10,
        topBottomInnerSpace: 12,
        createItemCellContentBox: 0, // for special cell content.
        createItemCellBackground: 0, // for special cell background.
        itemIdValueIndex: 0, // the index of the id in the array of an item

        // Sorting arrow
        sortingWidth: 14,
        sortingHeight: 20,
        sortingBackgroundColor: "transparent",
        sortingBorderRadius: "2px 2px 2px 2px",
        sortingOuterPosition: "left", // "left" or "right"
        sortingOuterSpace: 4,
        sortingIconSize: 18,
        sortingIconFile: "js/components/ui-table/arrow.svg",
        sortingIconOpacity: 0.2,
        sortingIconSelectedOpacity: 1,

        // Bars
        topBarHeight: 0,
        topBarBackgroundColor: "whitesmoke",
        topBarBottomBorderString: "0px solid rgba(0, 0, 0, 0.2)",

        bottomBarHeight: 0,
        bottomBarBackgroundColor: "whitesmoke",
        bottomBarTopBorderString: "1px solid rgba(0, 0, 0, 0.2)",

    });

};
UITable.resetDefault();

// The layout waits for the last of many resize events.
UITable.RESIZE_DELAY = 5;

UITable.create = function (params = {}) {

    // BOX: UI Table container
    const box = Box({ left: 0, top: 0 });

    // Default values (the params of this table over UITable.default)
    box.default = {};
    Object.keys(UITable.default).forEach(function (name) {
        box.default[name] = (params[name] !== undefined) ? params[name] : UITable.default[name];
    });
    const settings = box.default;

    // *** PRIVATE VARIABLES:
    let sortedTitleIndex = -1; // -1: the rows are in the order of the data
    let sortType = ""; // "asc" or "desc"
    let defaultSortTitleId = "";
    let defaultSortType = "";
    let shownItemCount = 0;
    let filter = { text: "", titleId: undefined };
    let cancelLayout = null;

    let titleRowStyle = function () {};
    let titleCellStyle = function () {};
    let itemRowStyle = function () {};
    let itemCellStyle = function () {};

    // *** PUBLIC VARIABLES:
    box.titleCellDataList = [];
    box.itemDataList = [];
    box.titleCellList = [];
    box.itemList = [];
    box.selectedItem = null;
    box.selectedItemIndex = -1;
    box.sortedItemIndexList = []; // the indexes of box.itemList in the shown order
    box.onClickFunc = function () {};
    box.onEditFunc = function () {};
    box.calculatedAutoTitleCellWidth = 0;

    // *** PRIVATE FUNCTIONS:

    const getItemId = function (itemData) {
        return itemData[settings.itemIdValueIndex];
    };

    // The text of a value in a cell (undefined: empty)
    const toCellText = function (value) {
        if (value === undefined || value === null) return "";
        return String(value);
    };

    const getTitleCellWidth = function (width) {
        if (width == "auto") return box.calculatedAutoTitleCellWidth;
        return width;
    };

    // The "auto" titles share the width that the fixed titles leave.
    const calcTitleCellWidths = function () {

        let autoWidthCount = 0;
        let fixedWidth = 0;

        box.titleCellDataList.forEach(function (titleCellData) {
            if (titleCellData.width == "auto") autoWidthCount++;
            else fixedWidth += titleCellData.width;
        });

        if (autoWidthCount == 0) return;
        box.calculatedAutoTitleCellWidth = Math.max(0, (box.width - fixedWidth) / autoWidthCount);

    };

    // Every cell gets the width of its title (the "auto" ones change with the table).
    const applyColumnWidths = function () {

        calcTitleCellWidths();

        box.titleCellDataList.forEach(function (titleCellData, i) {
            const width = getTitleCellWidth(titleCellData.width);
            box.titleCellList[i].width = width;
            box.itemList.forEach(function (itemRow) {
                itemRow.cellList[i].width = width;
            });
        });

    };

    const layoutTable = function () {

        box.boxItems.top = settings.topBarHeight + settings.titleHeight;
        box.boxItems.height = box.height - settings.titleHeight - settings.bottomBarHeight - settings.topBarHeight;
        box.bottomBar.top = box.boxItems.top + box.boxItems.height;

        applyColumnWidths();
        box.alert.center();

    };

    const resizeTable = function () {
        if (cancelLayout) cancelLayout();
        cancelLayout = box.after(UITable.RESIZE_DELAY, layoutTable);
    };

    const checkAlert = function () {

        if (shownItemCount > 0) {
            box.alert.visible = 0;
            box.alert.text = "";
            return;
        }

        box.alert.visible = 1;
        box.alert.text = (box.itemDataList.length > 0) ? settings.noItemFoundAlert : settings.noItemAddedAlert;

    };

    // The rows in the shown order get their odd / even colors; the selected one its own.
    const refreshItemBackgrounds = function () {

        let isOdd = 1;

        box.sortedItemIndexList.forEach(function (itemIndex) {
            const itemRow = box.itemList[itemIndex];
            if (itemRow.visible != 1) return;
            itemRow.background.originalColor = isOdd ? settings.itemOddBackgroundColor : settings.itemEvenBackgroundColor;
            itemRow.background.color = itemRow.background.originalColor;
            isOdd = isOdd ? 0 : 1;
        });

        if (box.selectedItem) {
            box.selectedItem.background.color = settings.itemSelectedBackgroundColor;
        }

    };

    const paintSelection = function (itemRow, isSelected) {
        itemRow.background.color = isSelected ? settings.itemSelectedBackgroundColor : itemRow.background.originalColor;
        // (a class for the CSS of the page: .table-item-row.selected)
        itemRow.background.elem.classList.toggle("selected", !!isSelected);
    };

    // *** SORTING:

    const showSortingAtTitle = function (titleCell) {
        if (!titleCell.boxArrows) return;
        titleCell.boxArrows.imgArrow.opacity = settings.sortingIconSelectedOpacity;
        titleCell.boxArrows.imgArrow.rotate = (sortType == "desc") ? 180 : 0;
    };

    const clearSortingAtAllTitles = function () {
        box.titleCellList.forEach(function (titleCell) {
            if (!titleCell.boxArrows) return;
            titleCell.boxArrows.imgArrow.opacity = settings.sortingIconOpacity;
            titleCell.boxArrows.imgArrow.rotate = 0;
        });
    };

    const compareValues = function (a, b, itemDataType) {
        if (itemDataType == "integer" || itemDataType == "float") {
            return (parseFloat(a) || 0) - (parseFloat(b) || 0);
        }
        // WHY numeric: "10" comes after "9"; sensitivity base: "a" and "A" are sorted together
        return toCellText(a).localeCompare(toCellText(b), undefined, { numeric: true, sensitivity: "base" });
    };

    // The rows are ordered with the CSS order of the flex box: no row is created again.
    const showRowsInOrder = function (orderedRows) {

        box.sortedItemIndexList = [];

        orderedRows.forEach(function (itemRow, i) {
            itemRow.elem.style.order = i;
            box.sortedItemIndexList.push(itemRow.index);
        });

        refreshItemBackgrounds();

    };

    const sortItems = function () {

        if (sortedTitleIndex == -1) {
            showRowsInOrder(box.itemList);
            return;
        }

        const titleCellData = box.titleCellDataList[sortedTitleIndex];
        const direction = (sortType == "desc") ? -1 : 1;
        const orderedRows = [...box.itemList].sort(function (rowA, rowB) {
            const a = rowA.data[titleCellData.itemDataIndex];
            const b = rowB.data[titleCellData.itemDataIndex];
            return compareValues(a, b, titleCellData.itemDataType) * direction;
        });

        showRowsInOrder(orderedRows);

    };

    // *** SEARCH:

    const isRowMatching = function (itemRow) {

        if (filter.text == "") return 1;
        const searchText = filter.text.toLowerCase();

        return box.titleCellDataList.some(function (titleCellData) {
            if (filter.titleId !== undefined && filter.titleId != titleCellData.id) return false;
            const cellText = toCellText(itemRow.data[titleCellData.itemDataIndex]).toLowerCase();
            return cellText.includes(searchText);
        });

    };

    const applyFilter = function () {

        shownItemCount = 0;

        box.itemList.forEach(function (itemRow) {
            const isShown = isRowMatching(itemRow);
            itemRow.visible = isShown ? 1 : 0;
            if (isShown) shownItemCount++;
        });

        checkAlert();
        refreshItemBackgrounds();

    };

    // *** TITLES:

    const createTitleCell = function (titleCellData, titleCellIndex) {

        // BOX: Title cell container
        const titleCell = Box({
            width: getTitleCellWidth(titleCellData.width),
            height: settings.titleHeight,
            color: "transparent",
            position: "relative",
            css: { display: "inline-block" },
        });
        titleCell.data = titleCellData;
        titleCell.index = titleCellIndex;

        createIn(titleCell, function () {

            if (settings.createTitleCellBackground == 1) {

                // BOX: Title cell background
                titleCell.background = Box(0, 0, "100%", "100%", {
                    color: settings.titleCellBackgroundColor,
                    round: 0,
                    clickable: 1,
                    css: {
                        borderRight: settings.titleCellRightBorderString,
                        borderBottom: settings.titleCellBottomBorderString,
                    },
                });

            }

            // LABEL: Title text (HTML: a title can have an icon)
            titleCell.label = Label({
                left: settings.leftRightInnerSpace,
                width: "auto",
                height: "auto",
                text: titleCellData.name,
                color: "transparent",
                textColor: settings.titleTextColor,
                fontSize: settings.titleFontSize,
                fontFamily: settings.titleFontFamily,
                ellipsis: 1,
            });

            if (titleCellData.enableSorting == 1) {
                createSortingArrow(titleCell);
            }

            if (settings.createTitleCellContentBox == 1) {
                // BOX: Title content container
                titleCell.box = Box(0, 0, "100%", "100%", { color: "transparent", round: 0, border: 0 });
            }

        });

        // The default sorting of the table (titleCellData.sortBy)
        if (titleCellData.enableSorting == 1 && titleCellData.sortBy) {
            defaultSortTitleId = titleCellData.id;
            defaultSortType = titleCellData.sortBy;
        }

        titleCell.label.onResize(function (self) {
            placeTitleLabel(titleCell, self);
        });

        titleCell.onResize(function () {
            titleCell.label.width = "auto";
            fitTitleLabel(titleCell);
        });

        // (no background: the cell itself takes the click)
        const clickTarget = titleCell.background || titleCell;
        if (titleCellData.enableSorting == 1) clickTarget.clickable = 1;
        clickTarget.on("click", function () {
            toggleSorting(titleCell);
        });

        titleCellStyle(titleCell, titleCellData, titleCellIndex);

        return titleCell;

    };

    const createSortingArrow = function (titleCell) {

        // BOX: Sorting arrow container
        titleCell.boxArrows = startBox({
            width: settings.sortingWidth,
            height: settings.sortingHeight,
            color: settings.sortingBackgroundColor,
            border: 0,
            clickable: 0,
            clipContent: 0,
            css: { borderRadius: settings.sortingBorderRadius },
        });
        if (settings.sortingOuterPosition == "right") {
            titleCell.boxArrows.right = settings.sortingOuterSpace;
        }

            // ICON: ASC / DESC arrow
            titleCell.boxArrows.imgArrow = Icon({
                width: settings.sortingIconSize,
                height: settings.sortingIconSize,
                opacity: settings.sortingIconOpacity,
            });
            that.load(settings.sortingIconFile);
            that.center();
            that.setMotion("opacity 0.3s, transform 0.3s");

        endBox();

    };

    // The label in the middle (or at titleTopInnerSpace), the arrow next to it.
    const placeTitleLabel = function (titleCell, label) {

        if (settings.titleTopInnerSpace == "auto") {
            label.center("top");
        } else {
            label.top = settings.titleTopInnerSpace;
        }

        if (titleCell.boxArrows) {
            titleCell.boxArrows.top = label.top - ((settings.sortingHeight - label.height) / 2);
        }

        fitTitleLabel(titleCell);

    };

    // A long title is cut ("...") so the arrow stays in the cell.
    const fitTitleLabel = function (titleCell) {

        const label = titleCell.label;
        let maxLabelWidth = titleCell.width - (settings.leftRightInnerSpace * 2);
        if (titleCell.boxArrows) {
            maxLabelWidth -= settings.sortingWidth + settings.sortingOuterSpace;
        }
        maxLabelWidth = Math.max(0, maxLabelWidth);

        if (label.width > maxLabelWidth) {
            label.width = maxLabelWidth;
        }

        if (titleCell.boxArrows && settings.sortingOuterPosition == "left") {
            titleCell.boxArrows.left = label.left + label.width + settings.sortingOuterSpace;
        }

    };

    // The same title again changes the direction; another title starts with "asc".
    const toggleSorting = function (titleCell) {

        if (titleCell.data.enableSorting != 1) return;

        const isSameTitle = (sortedTitleIndex == titleCell.index);
        const nextType = (isSameTitle && sortType == "asc") ? "desc" : "asc";
        box.sort(titleCell.data.id, nextType);

    };

    // *** ITEMS:

    const createItemRow = function (itemData, itemIndex) {

        // BOX: Item row container
        const itemRow = Box({
            width: "100%",
            height: settings.itemHeight,
            color: "transparent",
            position: "relative",
            css: { order: String(itemIndex), whiteSpace: "nowrap" },
        });
        itemRow.data = itemData;
        itemRow.index = itemIndex;
        itemRow.cellList = [];

        createIn(itemRow, function () {

            // BOX: Item row background (it takes the click of the row)
            itemRow.background = Box(0, 0, "100%", "100%", {
                color: "transparent",
                round: 0,
                clickable: 1,
                css: { borderBottom: settings.itemRowBottomBorderString },
            });
            itemRow.background.on("click", function () {
                clickRow(itemRow);
            });

            box.titleCellDataList.forEach(function (titleCellData, i) {
                const itemCell = createItemCell(itemData[titleCellData.itemDataIndex], titleCellData, itemRow, i);
                itemRow.cellList.push(itemCell);
            });

        });

        itemRowStyle(itemRow, itemData, itemIndex);
        itemRow.cellList.forEach(function (itemCell, i) {
            itemCellStyle(itemCell, itemData[box.titleCellDataList[i].itemDataIndex], box.titleCellDataList[i], itemRow, i);
        });

        return itemRow;

    };

    const createItemCell = function (itemCellData, titleCellData, itemRow, itemCellIndex) {

        const cellWidth = box.titleCellList[itemCellIndex].width;
        const isOneLine = (settings.itemHeight != "auto");

        // BOX: Item cell container
        const itemCell = startBox({
            width: cellWidth,
            height: "100%",
            color: "transparent",
            clickable: 0,
            position: "relative",
            css: { display: "inline-block", verticalAlign: "top" },
        });

            if (settings.createItemCellBackground) {
                // BOX: Item cell background
                itemCell.background = Box(0, 0, "100%", "100%", {
                    color: "transparent",
                    round: 0,
                    border: 0,
                    css: { borderRight: settings.itemCellRightBorderString },
                });
            }

            // LABEL: Text
            itemCell.label = Label({
                left: settings.leftRightInnerSpace,
                width: cellWidth - (settings.leftRightInnerSpace * 2),
                plainText: toCellText(itemCellData),
                color: "transparent",
                textColor: settings.itemTextColor,
                textAlign: titleCellData.itemTextAlign,
                fontSize: settings.itemFontSize,
                fontFamily: settings.itemFontFamily,
                ellipsis: isOneLine ? 1 : 0,
                css: isOneLine ? {} : { whiteSpace: "normal" },
            });

            if (settings.createItemCellContentBox == 1) {
                // BOX: Item content container
                itemCell.box = Box(0, 0, "100%", "100%", { color: "transparent", round: 0, border: 0 });
            }

        endBox();

        itemCell.label.onResize(function () {
            fitRowHeight(itemRow);
        });

        // (itemCell.on("resize_override", fn): a function of the page that runs after the cell is fitted)
        itemCell.onResizeCallback = function () {};
        itemCell.onResize(function (self) {
            itemCell.label.width = itemCell.width - (settings.leftRightInnerSpace * 2);
            itemCell.label.top = (itemCell.elem.offsetHeight - itemCell.label.height) / 2;
            itemCell.onResizeCallback(self);
        });

        const superOn = itemCell.on;
        itemCell.on = function (eventName, func) {
            if (eventName == "resize_override") {
                itemCell.onResizeCallback = func;
                return;
            }
            return superOn.apply(itemCell, arguments);
        };

        return itemCell;

    };

    // "auto": the row is as high as its highest text; a number: every row is that high.
    const fitRowHeight = function (itemRow) {

        if (settings.itemHeight != "auto") {
            itemRow.height = settings.itemHeight;
            return;
        }

        let highestLabelHeight = 0;
        itemRow.cellList.forEach(function (itemCell) {
            highestLabelHeight = Math.max(highestLabelHeight, itemCell.label.height);
        });
        itemRow.height = highestLabelHeight + (settings.topBottomInnerSpace * 2);

    };

    // A row that exists already gets its new data (its objects stay).
    const refreshItemRow = function (itemRow, itemData, itemIndex) {

        itemRow.index = itemIndex;
        itemRow.data = itemData;

        box.titleCellDataList.forEach(function (titleCellData, i) {
            const itemCellData = itemData[titleCellData.itemDataIndex];
            itemRow.cellList[i].label.plainText = toCellText(itemCellData);
            itemCellStyle(itemRow.cellList[i], itemCellData, titleCellData, itemRow, i);
        });

    };

    const addItemRow = function (itemData, itemIndex) {
        return createIn(box.boxItems, function () {
            return createItemRow(itemData, itemIndex);
        });
    };

    const clickRow = function (itemRow) {
        box.selectItemById(getItemId(itemRow.data));
        box.onClickFunc(itemRow);
    };

    // *** PUBLIC FUNCTIONS:

    box.setTitleRowStyle = function (func) {
        titleRowStyle = func;
        titleRowStyle(box.boxTitles);
    };

    box.setTitleCellStyle = function (func) {
        titleCellStyle = func;
    };

    box.setItemRowStyle = function (func) {
        itemRowStyle = func;
    };

    box.setItemCellStyle = function (func) {
        itemCellStyle = func;
    };

    // titleDataList: [{ id, name, itemDataIndex, itemDataType, width, itemTextAlign, enableSorting, sortBy }]
    box.createTitles = function (titleDataList) {

        box.clearTitles();

        box.titleCellDataList = titleDataList.map(function (titleData, i) {
            const titleCellData = Object.assign({}, titleData);
            if (!titleCellData.width) titleCellData.width = "auto";
            if (!titleCellData.itemDataType) titleCellData.itemDataType = "string";
            if (!titleCellData.itemTextAlign) titleCellData.itemTextAlign = "left";
            if (titleCellData.itemDataIndex === undefined) titleCellData.itemDataIndex = i;
            return titleCellData;
        });

        calcTitleCellWidths();

        createIn(box.boxTitles, function () {
            box.titleCellDataList.forEach(function (titleCellData, i) {
                box.titleCellList.push(createTitleCell(titleCellData, i));
            });
        });

        makeBasicObject(box);

    };

    box.clearTitles = function () {

        box.clearItems();

        box.titleCellList.forEach(function (titleCell) {
            titleCell.remove();
        });
        box.titleCellDataList = [];
        box.titleCellList = [];
        sortedTitleIndex = -1;
        defaultSortTitleId = "";
        defaultSortType = "";

    };

    // itemDataList: [[id, value, value...], ...]
    box.createItems = function (itemDataList) {

        box.clearItems();

        box.itemDataList = [...itemDataList];
        box.itemDataList.forEach(function (itemData, i) {
            box.itemList.push(addItemRow(itemData, i));
        });

        if (defaultSortTitleId) {
            box.sort(defaultSortTitleId, defaultSortType);
        } else {
            sortItems();
        }
        applyFilter();

        makeBasicObject(box);

    };

    box.clearItems = function () {

        box.itemList.forEach(function (itemRow) {
            itemRow.remove();
        });

        box.itemDataList = [];
        box.itemList = [];
        box.sortedItemIndexList = [];
        box.clearSelection();
        shownItemCount = 0;
        checkAlert();

    };

    // Adds, changes and removes rows by their id. The sorting, the search and the selection stay.
    box.updateItems = function (itemDataList) {

        const oldRowsById = new Map();
        box.itemList.forEach(function (itemRow) {
            oldRowsById.set(getItemId(itemRow.data), itemRow);
        });

        box.itemDataList = [...itemDataList];
        box.itemList = box.itemDataList.map(function (itemData, i) {
            const itemRow = oldRowsById.get(getItemId(itemData));
            if (!itemRow) return addItemRow(itemData, i);
            oldRowsById.delete(getItemId(itemData));
            refreshItemRow(itemRow, itemData, i);
            return itemRow;
        });

        // The rows that are not in the new list
        oldRowsById.forEach(function (itemRow) {
            if (itemRow == box.selectedItem) box.clearSelection();
            itemRow.remove();
        });
        box.selectedItemIndex = box.itemList.indexOf(box.selectedItem);

        sortItems();
        applyFilter();

        makeBasicObject(box);

    };

    box.getEditedItemDataList = function () {
        return [...box.itemDataList];
    };

    // Shows only the rows with the text (in the title titleId, or in every title). An empty text shows all.
    box.filterByText = function (filterText, titleId) {
        filter = { text: toCellText(filterText), titleId: titleId };
        applyFilter();
    };

    // titleId: the id of a title (the first one when it is not given); sortingType: "asc" or "desc"
    box.sort = function (titleId, sortingType = "asc") {

        if (box.titleCellList.length == 0) return;
        const titleCell = (titleId === undefined) ? box.titleCellList[0] : box.getTitleCellById(titleId);
        if (!titleCell) return;

        box.boxItems.elem.scrollTo({ top: 0, left: 0 });

        sortedTitleIndex = titleCell.index;
        sortType = (sortingType == "desc") ? "desc" : "asc";

        clearSortingAtAllTitles();
        showSortingAtTitle(titleCell);
        sortItems();

    };

    // The rows go back to the order of the data.
    box.clearSorting = function () {
        sortedTitleIndex = -1;
        sortType = "";
        clearSortingAtAllTitles();
        sortItems();
    };

    box.getTitleCellById = function (titleId) {
        return box.titleCellList.find(function (titleCell) { return titleCell.data.id == titleId; }) || null;
    };

    box.getTitleIndexById = function (titleId) {
        return box.titleCellDataList.findIndex(function (titleCellData) { return titleCellData.id == titleId; });
    };

    box.getTitleCellWidthById = function (titleId) {
        const titleIndex = box.getTitleIndexById(titleId);
        if (titleIndex == -1) return 0;
        return getTitleCellWidth(box.titleCellDataList[titleIndex].width);
    };

    // width: a number or "auto"
    box.setTitleCellWidthById = function (titleId, width) {
        const titleIndex = box.getTitleIndexById(titleId);
        if (titleIndex == -1) return;
        box.titleCellDataList[titleIndex].width = width;
        applyColumnWidths();
    };

    box.getBiggestId = function (itemDataList = box.itemDataList) {
        let biggestId = 0;
        itemDataList.forEach(function (itemData) {
            biggestId = Math.max(biggestId, basic.num(getItemId(itemData)));
        });
        return biggestId;
    };

    // Returns 1 when the row was selected.
    box.selectItemById = function (itemId) {

        if (!settings.itemsCanSelectable) return 0;

        const itemIndex = box.getItemIndexById(itemId);
        if (itemIndex == -1) return 0;

        box.clearSelection();
        box.selectedItem = box.itemList[itemIndex];
        box.selectedItemIndex = itemIndex;
        paintSelection(box.selectedItem, 1);

        return 1;

    };

    box.clearSelection = function () {
        if (box.selectedItem) paintSelection(box.selectedItem, 0);
        box.selectedItem = null;
        box.selectedItemIndex = -1;
    };

    box.getItemIndexById = function (itemId) {
        return box.itemDataList.findIndex(function (itemData) { return getItemId(itemData) == itemId; });
    };

    box.getSelectedItemIndex = function () {
        return box.selectedItemIndex;
    };

    // The selected row (itemRow.data, itemRow.cellList), or null
    box.getSelectedItem = function () {
        return box.selectedItem;
    };
    box.getSelectedItemRow = box.getSelectedItem;

    box.getSelectedItemData = function () {
        return box.selectedItem ? box.selectedItem.data : null;
    };

    box.getSelectedItemId = function () {
        return box.selectedItem ? getItemId(box.selectedItem.data) : null;
    };

    // USAGE: myTable.on("click", function (itemRow) {}). Other events go to the box (basic.js on()).
    const superOn = box.on;
    box.on = function (eventName, func) {
        if (eventName == "click") {
            box.onClickFunc = func;
            return;
        }
        if (eventName == "edit") {
            box.onEditFunc = func; // (no editing in the table yet)
            return;
        }
        return superOn.apply(box, arguments);
    };

    box.moveIntoDiv = function (divElementId) {
        const div = document.getElementById(divElementId);
        if (!div) return;
        div.append(box.elem);
    };

    box.addScrollBarCssClass = function (cssClass) {
        box.boxItems.elem.classList.add(cssClass);
    };

    // *** OBJECT VIEW:
    box.props({
        width: settings.width,
        height: settings.height,
        color: settings.backgroundColor,
        border: 0,
        boxShadow: settings.boxShadow,
        css: { borderRadius: settings.borderRadius },
    });

    createIn(box, function () {

        // LABEL: No item / no item found
        box.alert = Label({ width: "auto", height: "auto", padding: [16, 8], round: 6, fontSize: 16, text: "" });
        box.alert.onResize(function (self) {
            self.center();
        });

        // BOX: Items container (the rows are flex items: sorted with their CSS order)
        box.boxItems = Box({
            left: 0,
            width: "100%",
            color: "transparent",
            border: 0,
            css: { display: "flex", flexDirection: "row", flexWrap: "wrap", alignContent: "flex-start" },
            scrollY: 1,
        });

        // BOX: Titles container
        box.boxTitles = startBox({
            left: 0,
            top: settings.topBarHeight,
            width: "100%",
            height: settings.titleHeight,
            color: "transparent",
            border: 0,
            boxShadow: settings.titleBoxShadow,
            css: { whiteSpace: "nowrap" },
        });

            // BOX: Titles background
            box.boxTitles.background = Box(0, 0, "100%", "100%", {
                color: settings.titleRowBackgroundColor,
                round: 0,
                css: { borderBottom: settings.titleRowBottomBorderString },
            });
            that.elem.classList.add("table-titles-background");

        endBox();

        // BOX: Top bar
        box.topBar = Box(0, 0, "100%", settings.topBarHeight, {
            color: settings.topBarBackgroundColor,
            css: { borderBottom: settings.topBarBottomBorderString },
        });
        box.topBar.visible = (settings.topBarHeight > 0) ? 1 : 0;

        // BOX: Bottom bar
        box.bottomBar = Box({
            left: 0,
            width: "100%",
            height: settings.bottomBarHeight,
            color: settings.bottomBarBackgroundColor,
            css: { borderTop: settings.bottomBarTopBorderString },
        });
        box.bottomBar.visible = (settings.bottomBarHeight > 0) ? 1 : 0;

        // BOX: Table border (over everything, the mouse goes through it)
        box.boxBorder = Box(0, 0, "100%", "100%", {
            color: "transparent",
            css: { border: settings.borderString, borderRadius: "inherit" },
        });

    });

    // *** OBJECT INIT CODE:
    checkAlert();
    box.onResize(resizeTable);

    if (settings.showWithMotion) {
        box.opacity = 0;
        box.setMotion("opacity 0.3s");
        box.withMotion(function (self) {
            self.opacity = 1;
        });
    }

    makeBasicObject(box);
    return box;

};
