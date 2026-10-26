/* Bismillah */

/*

SmartTable- v25.07 - "Optimized for big data"

- SmartTable is a JavaScript table component designed to run smoothly even with millions of records. Thanks to its virtual scroll architecture, it only writes the visible rows to the DOM, eliminating memory and performance issues with large datasets. It makes data exploration easy with real-time filtering, multi-column sorting, and both horizontal and vertical scroll support. Custom cell designs can be created for each column via createCustomItemCell, allowing flexible visual content per column. Since column widths, heights, and colors are all configurable through parameters, it can be quickly adapted to different projects.


Started Date: Mar 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/


- Arama sütunu: Arama kutusunun sağındaki kutuya (ALL) basınca sütun listesi açılır. Arama sadece seçilen sütunda yapılır.
-- searchTitleIndex: -1 (ALL: tüm sütunlar), showSearchTitleSelect: 0 ise kutu gizlenir.
-- Liste için comp-m4/context-menu.js yüklenmelidir. Yüklenmemiş ise, kutuya her basışta sıradaki sütuna geçer.
- Eğer itemHeight 20px den küçük ise otomatik itemLineCount düşür ve eğer itemHeight büyükse 100px den itemLineCount arttır.
- wheelScroll: 1 ise fare tekerleği tablonun satırlarını kaydırır (sayfa kaymaz). Varsayılan 0: tekerlek sayfayı kaydırır, satırlar scroll çubuğu ve butonlar ile kaydırılır.
-- smartTable.setWheelScroll(1) ile sonradan açılabilir.


*/

"use strict";

// Default values:
const SmartTableDefaults = {

    key: "0",
    titleHeight: 50,
    itemHeight: 40,
    infoHeight: 50,
    itemLineCount: 16,
    highlightTitle: true,
    highlightLine: true,
    invertColor: 0,
    noDataFoundAlert: "No data found!",
    searchKeyword: "",
    searchTitleIndex: -1, // -1: Search in all columns (ALL). 0, 1...: Search only in this column.
    showSearchTitleSelect: 1, // 0: Hide the column select box (ALL) next to the search input.
    wheelScroll: 0, // 1: The mouse wheel scrolls the rows (and the page does not scroll). 0: The wheel is left to the page.
    allTitlesText: "ALL",
    sortByTitleIndex: 0,
    sortDirection: "A-Z", // "A-Z" or "Z-A"
    fillTestData: 0,
    onSelect: function (itemData) { },
    createCustomItemCell: function (cell, titleDataIndex) { return cell },
    updateCustomItemCell: function (cell, titleDataIndex, data) { },
    titleDataList: [
        { name: "ID", dataTitle: "id", dataType: "integer", width: 100, shortable: 1 },
        { name: "NAME", dataTitle: "name", dataType: "string", width: 100, shortable: 1 },
        { name: "EMAIL", dataTitle: "email", dataType: "string", width: 290, shortable: 0 },
        { name: "", dataTitle: "active", dataType: "boolean", width: 40, shortable: 0 },
    ],
    itemDataList: [
        { id: 1, name: "Bugra", desc: "about", email: "emainil", active: 1 },
        { id: 2, name: "Alper", desc: "about", email: "emainil", active: 1 },
        { id: 3, name: "Murat", desc: "about", email: "emainil-3", active: 1 },
        { id: 4, name: "Deniz", desc: "about", email: "emainil", active: 1 },
        { id: 5, name: "Nilüfer", desc: "about", email: "emainil-7", active: 1 },
        { id: 6, name: "Frank", desc: "about", email: "emainil", active: 1 },
        { id: 7, name: "Dany", desc: "about", email: "emainil-45", active: 1 },
        { id: 8, name: "Duygu", desc: "about", email: "emainil", active: 1 },
        { id: 9, name: "Filiz", desc: "about", email: "emainil-356", active: 1 },
        { id: 10, name: "Anka", desc: "about", email: "emainil", active: 1 },
    ],
    scrollBarParams: {
        bar_border: 0,
        bar_round: 3,
        bar_borderColor: "rgba(0, 0, 0, 1)",
        bar_width: 4,
        bar_mouseOverWidth: 4, //8
        bar_mouseOverColor: "#373836",
        bar_opacity: 0.4,
        bar_mouseOverOpacity: 0.9,
        bar_padding: 2,
        bar_color: "#373836",
        neverHide: 0,
        showDots: 0,
    },
    // Filtredeki sütun listesinin (ContextMenu) parametreleri. (Sadece stil için; onClick bileşen tarafından verilir.)
    searchTitleMenuParams: {},
    searchInputParams: {
        width: "50%",
        height: 36,
        border: 1,
        round: 8,
        color: "white",
        searchIconSize: 16,
        placeholderText: "Filter",
        fontSize: 16,
        borderColor: "rgba(0, 0, 0, 0.4)",
        borderBottomStyle: "1px solid rgba(0, 0, 0, 0.4)",
        searchIconFile: "../comp-m2/search-input-v2/filter.png",
    },
    style: {

        width: "auto",
        height: "auto",
        round: 6,
        line1Color: "white",
        line2Color: "whitesmoke",
        highlightItemCellColor: "#F3E7C2",
        highlightTitleCellColor: White(0.2),
        verticalScrollWidth: 20,
        verticalScrollMargin: 2,
        btnScrollDownIconFile: "../comp-m3/smart-table/down.png",
        btnScrollUpIconFile: "../comp-m3/smart-table/up.png",
        btnScrollCenterIconFile: "../comp-m3/smart-table/scroll.png",
        sortIconFile: "../comp-m3/smart-table/sort.png",
        loadingIconFile: "../comp-m3/smart-table/clock.png",
        searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#373836" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
        invertIconColor: 0,

        box: { color: "white" },
        boxBorder: { border: 2, borderColor: Black(0.8) },
        boxTitleLine: { color: "#65A293", },
        boxTitleCell: { padding: [8, 0], borderRight: "1px solid rgba(0, 0, 0, 0.5)", borderBottom: "2px solid #141414", },
        lblTitleCell: { fontSize: 20, fontFamily: "opensans", textColor: Black(0.8), },
        boxItemCell: { borderBottom: "1px solid darkgray", borderRight: "1px solid rgba(0, 0, 0, 0.05)", padding: [8, 0], },
        lblItemCell: { fontSize: 20, textColor: Black(0.75), fontFamily: "opensans", },
        boxInfoLine: { color: "#E4E4E4", borderTop: "1px solid rgba(0, 0, 0, 0)" },
        lblBoxInfoLine: { fontSize: 16, textColor: Black(0.85), },
        lblNoDataFound: { color: "lightgray", padding: [8, 2], fontSize: 14, round: 8, border: 1, borderColor: Black(0.4), },
        // Filtre kutusundaki sütun seçim etiketi (ALL). Boş ise lblNoDataFound stili kullanılır.
        lblSearchTitle: {},
        btnScrollCenter: { color: "white", round: 100, borderColor: "rgba(0,0,0,0.4)", border: 1, },
        btnScrollUp: { color: "lightgray", round: 100, border: 1, },
        btnScrollDown: { color: "lightgray", round: 100, border: 1, },
        boxSort: { color: "#65A293" },

    },
};

const SmartTable = function (params = {}) {

    mergeIntoIfMissing(params, SmartTableDefaults);

    // BOX: Component container
    let box = startObject(params);

    // WHY: mergeIntoIfMissing dizileri referansla kopyalıyor. Kopyalanmaz ise setTitleCellWidth, SmartTableDefaults (ve diğer tabloları) değiştirir.
    box.titleDataList = box.titleDataList.map(titleData => ({ ...titleData }));
    box.itemDataList = [...box.itemDataList];

    // *** PRIVATE VARIABLES:
    const DEFAULT_CELL_WIDTH = 100;
    const SORT_ICON_SIZE = 22;
    const SCROLL_CENTER_HEIGHT = 50;
    const LOADING_ICON_SIZE = 32;
    const SEARCH_TITLE_MAX_WIDTH = "160px";
    const FILTER_DELAY = 50; // ms
    const RESIZE_DELAY = 3; // ms
    const LOADING_MIN_ITEM_COUNT = 1000; // WHY: Küçük listelerde loading bir an yanıp sönmesin.
    const TEST_DATA_REPEAT_COUNT = 100000;

    // *** PRIVATE FUNCTIONS:

    // The last top index: the last page of rows ends with the last record.
    const getMaxScrollIndex = function () {
        return Math.max(0, box.visibleItemDataList.length - box.itemLineCount);
    };

    const clampScrollIndex = function (index) {
        if (index < 0) return 0;
        return Math.min(index, getMaxScrollIndex());
    };

    // WHY: isNaN("") false döndüğü için boş değerler sayı sanılıyor, parseFloat("") NaN verip sıralamayı bozuyordu.
    const toSortNumber = function (value) {
        if (typeof value === "number") return value;
        if (typeof value === "string" && value.trim() !== "") return Number(value);
        return NaN;
    };

    // *** PUBLIC VARIABLES:
    // State of component [var]
    box.state = "normal";
    // Created items by data [var]
    box.visibleItemDataList = [...box.itemDataList];
    // [var]
    box.titleCellList = [];
    // [var]
    box.titleCellCount = 0;
    // [var]
    box.itemLineList = [];
    // [var] en üstteki kaydın index i
    box.startedItemIndexForScrolling = 0;
    // Scroll haraketi için gerekli değişkenler [var]
    box.scrollVars = {};
    // [var] if height not auto will recallItemHeight
    box.recalcItemHeight = 0;
    // [var]
    box.resizeTimer = null;
    box.refreshTimer = null;
    box.filterTimer = null;

    // *** PUBLIC FUNCTIONS:

    // The states have no look yet; the value is kept for the page.
    box.setState = function (state) {
        box.state = state;
    };

    const refresh = function () {
        // refresh code
    };

    box.refresh = function (time = 3) {

        // NOTE: Check the child objects and make sure their states are appropriate.
        box.refreshTimer = waitAndRun(box.refreshTimer, refresh, time);

    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).

        // WHY: waitAndRun timers are not box.after() timers; remove() does not know them.
        clearTimeout(box.resizeTimer);
        clearTimeout(box.refreshTimer);
        clearTimeout(box.filterTimer);

        // WHY: Menü page üzerinde oluşturuluyor; box.remove() onu silmez. (Before the cascade: it detaches from its target label.)
        if (box.searchTitleMenu) box.searchTitleMenu.remove();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events (listenTo too) and the objects inside.
        box = null;

    };

    // A row without data stays in its place, empty and not clickable.
    const hideItemLine = function (itemLine) {
        itemLine.opacity = 0;
        itemLine.clickable = 0;
    };

    const fillItemLine = function (itemLine, rowData) {

        itemLine.opacity = 1;
        itemLine.clickable = 1;
        itemLine.itemData = rowData; // WHY: Line a basıldığında bu bilgi kullanılacak.

        // TODO: If selected itemData == this item data then make colored.

        for (let j = 0; j < box.titleCellCount; j++) {

            const titleData = box.titleDataList[j];
            const cell = itemLine["itemCell" + j];
            const newValue = rowData[titleData.dataTitle] ?? "";

            // Sadece değer değişmişse DOM'a dokun
            // WHY: label.text innerHTML (string) döndürüyor; sayı veya "&" içeren değerlerle karşılaştırma hep farklı çıkıyordu. Son yazılan değer hücrede tutuluyor.
            if (!("lastValue" in cell) || cell.lastValue !== newValue) { // WHY: eğer !== olmaz ise, 0 ile "" aynı sayılıyor.
                cell.lastValue = newValue;
                cell.label.text = newValue;
            }

            box.updateCustomItemCell(cell, j, newValue);

        }

    };

    box.refreshData = function () {

        const startIndex = box.startedItemIndexForScrolling;
        const dataList = box.visibleItemDataList;
        const lineCount = box.itemLineCount;

        // WHY: Virtual scroll; only the rows on the screen exist, they show the records from startIndex.
        for (let i = 0; i < lineCount; i++) {

            const itemLine = box.itemLineList[i];
            const rowData = dataList[startIndex + i];

            if (rowData) {
                fillItemLine(itemLine, rowData);
            } else {
                hideItemLine(itemLine);
            }

        }

        box.setVerticalScrollEnabled(dataList.length > lineCount);
        box.updateInfoLabel();

    };

    const setScrollButtonState = function (button, opacity, clickable) {
        button.opacity = opacity;
        button.clickable = clickable;
    };

    box.setVerticalScrollEnabled = function (enabled) {

        // Sadece kullanılabilir durumda ise enabled yapılabilir.
        if (enabled && box.visibleItemDataList.length > box.itemLineCount) {
            setScrollButtonState(box.btnScrollCenter, 1, 1);
            setScrollButtonState(box.btnScrollUp, 1, 1);
            setScrollButtonState(box.btnScrollDown, 1, 1);
            return;
        }

        setScrollButtonState(box.btnScrollCenter, 0, 0);
        setScrollButtonState(box.btnScrollUp, 0.5, 0);
        setScrollButtonState(box.btnScrollDown, 0.5, 0);

    }

    box.setTitleCellWidth = function (titleCellIndex, width) { // [GOOD]

        if (titleCellIndex < 0 || titleCellIndex >= box.titleCellCount) return;

        box.titleCellList[titleCellIndex].width = width;
        box.titleDataList[titleCellIndex].width = width;

        box.itemLineList.forEach(function (itemLine) {
            itemLine["itemCell" + titleCellIndex].width = width;
        });

    }

    // Başlık listesini oluştur
    box.createTitleLine = function () { // [GOOD]

        box.titleCellList = [];
        box.boxTitleLine.html = "";

        // titleDataList
        box.titleDataList.forEach(function (titleData, titleCellIndex) {
            const titleCell = box.createTitleCell(titleData, titleCellIndex);

            box.titleCellList.push(titleCell);
            box.boxTitleLine.add(titleCell);
        });

        box.titleCellCount = box.titleCellList.length;

    };

    box.setTitleDataList = function(titleDataList) {

        box.titleDataList = titleDataList.map(titleData => ({ ...titleData }));
        box.createTitleLine();
        // WHY: Satırlardaki hücre sayısı başlık sayısı ile aynı olmalı. Yoksa refreshData olmayan hücreye erişir.
        box.createItemLines();
        if (box.recalcItemHeight) box.setItemHeight(box.itemHeight);
        box.stretchLastCell(box.calcLastCellWidth());
        if (!box.titleDataList[box.sortByTitleIndex]) box.sortByTitleIndex = 0;
        box.updateSortIcon();
        box.updateSearchTitleSelect(); // WHY: Sütunlar değişti; liste yenilensin, olmayan sütun seçili ise ALL olsun.
        box.filterAndSortData();

    }

    box.createSortIcon = function (titleCell) {

        startBox({
            align: "right center",
            color: box.style.boxSort.color,
            round: 100,
            border: 0,
            borderColor: "rgba(0,0,0,0.1)",
            width: SORT_ICON_SIZE,
            height: SORT_ICON_SIZE,
            right: 2,
            padding: [4, 0],
            position: "absolute",
        });
        if (titleCell.shortable == 0) that.opacity = 0;
        titleCell.add(that);
        that.center("top");

        titleCell.icon = Icon({
            width: SORT_ICON_SIZE,
            height: SORT_ICON_SIZE,
            left: 0,
            top: 0,
            opacity: 0.5,
        });
        that.setMotion("opacity 0.3s, transform 0.3s");
        that.load(box.style.sortIconFile);
        if (box.style.invertIconColor == 1) that.css.filter = "invert(100%)";
        that.center();

        endBox();

    };

    box.resetSortIcons = function (currentTitleCell) {

        box.titleCellList.forEach(function (titleCell, titleCellIndex) {
            if (titleCellIndex != currentTitleCell.titleCellIndex) {
                titleCell.icon.rotate = 0;
                titleCell.icon.opacity = 0.5;
                titleCell.sortDirection = "";
            }
        });

    };

    // Başlık hücresi oluştur
    box.createTitleCell = function (titleData, titleCellIndex) {

        // TitleCell
        const titleCell = AutoLayout({
            flow: "horizontal",
            align: "center left",
            width: titleData.width || DEFAULT_CELL_WIDTH,
            padding: box.style.boxTitleCell.padding,
            height: box.titleHeight,
            color: "transparent",
            border: 0,
            position: "relative",
        });
        that.css = {
            borderRight: box.style.boxTitleCell.borderRight,
            borderBottom: box.style.boxTitleCell.borderBottom,
        };
        that.cursor = "pointer";

        // DATA IN OBJECT (titleCell)
        that.titleCellIndex = titleCellIndex;
        that.titleDataTitle = titleData.dataTitle;
        that.shortable = titleData.shortable;

        titleCell.label = Label({
            text: titleData.name,
            ...box.style.lblTitleCell,
        });
        that.css.fontFamily = box.style.lblTitleCell.fontFamily;

        endAutoLayout();

        box.createSortIcon(titleCell);

        titleCell.on("click", function (self, event) {

            if (self.shortable != 1) return;

            box.resetSortIcons(self);
            box.sortByTitleIndex = self.titleCellIndex;
            // WHY: The first click sorts A-Z; a click on the column that is already A-Z turns it.
            box.sortDirection = (self.sortDirection != "A-Z") ? "A-Z" : "Z-A";
            box.updateSortIcon();
            box.filterAndSortData();

        });

        titleCell.on("mouseover", function (self, event) {
            box.applyColumnHighlight(self);
        });

        titleCell.on("mouseout", function (self, event) {
            box.clearColumnHighlight(self);
        });

        return titleCell;

    };

    box.updateSortIcon = function() {

        const titleCell = box.titleCellList[box.sortByTitleIndex];
        if (!titleCell) return; // WHY: Geçersiz sortByTitleIndex verilirse hata vermesin.

        if (box.sortDirection == "A-Z") {
            titleCell.sortDirection = "A-Z";
            titleCell.icon.rotate = 0;
        } else {
            titleCell.sortDirection = "Z-A";
            titleCell.icon.rotate = 180;
        }

        titleCell.icon.opacity = 1;

    };

    const paintColumn = function (titleCell, titleColor, cellColor) {
        titleCell.color = titleColor;
        box.itemLineList.forEach(function (itemLine) {
            itemLine["itemCell" + titleCell.titleCellIndex].color = cellColor;
        });
    };

    box.clearColumnHighlight = function (titleCell) {
        if (!box.highlightTitle) return;
        paintColumn(titleCell, "transparent", "transparent");
    };

    box.applyColumnHighlight = function (titleCell) {
        if (!box.highlightTitle) return;
        paintColumn(titleCell, box.style.highlightTitleCellColor, box.style.highlightItemCellColor);
    };

    // Tüm bilgi satırlarını oluştur.
    box.createItemLines = function () {

        box.itemLineList = [];
        box.boxItemLineGroup.html = "";

        for (let i = 0; i < box.itemLineCount; i++) {
            const itemLineIndex = i;
            const itemLine = box.createItemLine(box.itemDataList[i], itemLineIndex);

            box.itemLineList.push(itemLine);
            box.boxItemLineGroup.add(itemLine);
        }

    }

    // Bir bilgi satırı oluştur
    box.createItemLine = function (itemData, itemLineIndex) {

        // GROUP: ItemLine
        const itemLine = HGroup({
            height: box.itemHeight || 100,
            width: "auto",
            align: "top left",
            padding: [0, 0],
            gap: 0,
            color: (itemLineIndex % 2) ? box.style.line2Color : box.style.line1Color,
            position: "relative",
        });

        box.titleDataList.forEach(function (titleData, titleDataIndex) {
            itemLine["itemCell" + titleDataIndex] = box.createItemCell(titleData.width, titleDataIndex, itemLine);
        });

        endGroup();

        itemLine.on("click", function (self) {
            box.onSelect(self.itemData);
        });

        if (box.style.height != "auto") itemLine.visible = 0; // WHY: Yüksekli yeniden hesaplanması gerekirse, ekranda kırpma yapması için gizli oluşturuluyor.
        return itemLine;

    };

    const paintItemLineCells = function (itemLine, color) {
        for (let i = 0; i < box.titleCellCount; i++) {
            itemLine["itemCell" + i].color = color;
        }
    };

    // Hücre oluştur.
    box.createItemCell = function (cellWidth, titleDataIndex, itemLine) {

        // GROUP: ItemCell
        let itemCell = AutoLayout({
            align: "center left",
            width: cellWidth || DEFAULT_CELL_WIDTH,
            padding: box.style.boxItemCell.padding,
            height: "100%",
            color: "transparent",
            border: 0,
        });
        that.css = {
            borderBottom: box.style.boxItemCell.borderBottom,
            borderRight: box.style.boxItemCell.borderRight,
        };
        that.cursor = "pointer";

        itemCell.label = Label({
            text: "",
            ...box.style.lblItemCell,
        });
        that.css = {
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontFamily: box.style.lblItemCell.fontFamily,
        };

        endAutoLayout();

        itemCell.on("mouseover", function (self, event) {
            if (!box.highlightLine) return;
            paintItemLineCells(itemLine, box.style.highlightItemCellColor);
        });

        itemCell.on("mouseout", function (self, event) {
            if (!box.highlightLine) return;
            paintItemLineCells(itemLine, "transparent");
        });

        itemCell = box.createCustomItemCell(itemCell, titleDataIndex);

        return itemCell;

    };

    // RIGHT Scroll
    box.initScrollMetrics = function () {

        // Değişkenler
        box.scrollVars.minY = box.titleHeight;
        box.scrollVars.scrollAreaHeight = box.height - box.titleHeight - box.infoHeight;
        box.scrollVars.scrollIconHeight = box.btnScrollCenter.height;
        box.scrollVars.maxY = box.scrollVars.minY + box.scrollVars.scrollAreaHeight - box.scrollVars.scrollIconHeight;
        box.scrollVars.totalPath = box.scrollVars.maxY - box.scrollVars.minY;

        box.scrollVars.isDragging = false;
        box.scrollVars.startY = 0;
        box.scrollVars.startTop = 0;

    };

    box.syncScrollPosition = function () {

        const maxScrollIndex = getMaxScrollIndex();
        if (maxScrollIndex === 0) return;

        const percent = box.startedItemIndexForScrolling / maxScrollIndex;
        box.btnScrollCenter.top = box.scrollVars.minY + (percent * box.scrollVars.totalPath);

    };

    box.createScrollEvents = function () {

        box.btnScrollCenter.clickable = 1;
        box.btnScrollCenter.elem.setAttribute("draggable", "false");
        box.btnScrollCenter.cursor = "grab";

        box.initScrollMetrics();

        // WHEEL: one row for each wheel step.
        box.on("wheel", function (self, event) {

            // WHY: Varsayılan olarak tekerlek sayfaya bırakılır; tablo sayfanın kaymasını engellemesin. (wheelScroll: 1 ile açılır)
            if (box.wheelScroll != 1) return;

            // WHY: A mostly horizontal move is left to the browser (the horizontal scroll of the columns).
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

            event.preventDefault();

            const step = event.deltaY > 0 ? 1 : -1;
            const newIndex = clampScrollIndex(box.startedItemIndexForScrolling + step);
            if (newIndex === box.startedItemIndexForScrolling) return;

            box.startedItemIndexForScrolling = newIndex;
            box.syncScrollPosition();
            box.refreshData();

        }, { passive: false });

        // DRAG: the center button of the vertical scroll.
        box.btnScrollCenter.on("mousedown", function (self, event) {

            box.scrollVars.isDragging = true;
            box.scrollVars.startY = event.clientY;
            box.scrollVars.startTop = box.btnScrollCenter.top;
            box.btnScrollCenter.cursor = "grabbing";
            document.body.style.userSelect = "none";

        });

        box.listenTo(window, "mousemove", function (self, event) {
            dragScrollButton(event);
        });
        box.listenTo(window, "mouseup", function () {
            stopScrollButtonDrag();
        });

    };

    const dragScrollButton = function (event) {

        if (!box || !box.scrollVars.isDragging) return;

        const diffY = event.clientY - box.scrollVars.startY;
        let newTop = box.scrollVars.startTop + diffY;

        if (newTop < box.scrollVars.minY) newTop = box.scrollVars.minY;
        if (newTop > box.scrollVars.maxY) newTop = box.scrollVars.maxY;

        box.btnScrollCenter.top = newTop;

        // WHY: Tablo çok kısa ise totalPath 0 olabilir; 0'a bölme NaN index üretir.
        if (box.scrollVars.totalPath <= 0) return;

        const currentProgress = (newTop - box.scrollVars.minY) / box.scrollVars.totalPath;
        const newIndex = Math.round(currentProgress * getMaxScrollIndex());
        if (newIndex === box.startedItemIndexForScrolling) return;

        box.startedItemIndexForScrolling = newIndex;
        box.refreshData();

    };

    const stopScrollButtonDrag = function () {

        if (!box || !box.scrollVars.isDragging) return;

        box.scrollVars.isDragging = false;
        box.btnScrollCenter.cursor = "grab";
        document.body.style.userSelect = "auto";

    };

    box.scrollPage = function (direction) { // +1 ise aşağı (bir sayfa boyu), -1 ise yukarı

        const newIndex = clampScrollIndex(box.startedItemIndexForScrolling + (direction * box.itemLineCount));
        if (newIndex === box.startedItemIndexForScrolling) return;

        box.startedItemIndexForScrolling = newIndex;
        box.refreshData();
        box.syncScrollPosition();

    };

    box.updateInfoLabel = function () {

        const totalData = box.visibleItemDataList.length;

        if (totalData == 0) {
            box.boxInfoLine.label.text = "0 - 0 / 0";
            box.lblNoDataFound.opacity = 1;
            // TODO: Show a alert text at center (No data!)
            return;
        }

        box.lblNoDataFound.opacity = 0;

        // Başlangıç indeksi (İnsanların okuması için +1 ekliyoruz, 0 yerine 1'den başlasın)
        const start = box.startedItemIndexForScrolling + 1;

        // Bitiş indeksi (Ya sayfa sonu ya da toplam veri miktarı)
        let end = box.startedItemIndexForScrolling + box.itemLineCount;
        if (end > totalData) end = totalData;

        // Sayıları binlik ayırıcı ile formatlamak (12499 -> 12.499)
        const formatNumber = (number) => number.toLocaleString('tr-TR');

        box.boxInfoLine.label.text = `${formatNumber(start)} - ${formatNumber(end)} / ${formatNumber(totalData)}`;

    };

    box.setScrollToTop = function () {
        box.startedItemIndexForScrolling = 0;
        box.btnScrollCenter.top = box.scrollVars.minY;
    };

    box.setItemDataList = function (itemDataList) {
        box.itemDataList = [...itemDataList];
        box.filterAndSortData();
    };

    // WHY: "value ?" kontrolü 0 ve false değerlerini aranamaz yapıyordu.
    const hasKeyword = function (value, searchKeyword) {
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(searchKeyword);
    };

    const filterItems = function (itemList, searchKeyword) {

        if (searchKeyword === "") return itemList;

        // Sütun seçili ise sadece o sütunda, değil ise (ALL) tüm sütunlarda ara.
        const searchTitleData = box.titleDataList[box.searchTitleIndex];
        const searchTitleList = (searchTitleData) ? [searchTitleData] : box.titleDataList;

        return itemList.filter(item => {
            return searchTitleList.some(title => hasKeyword(item[title.dataTitle], searchKeyword));
        });

    };

    const compareValues = function (valueA, valueB) {

        const numberA = toSortNumber(valueA);
        const numberB = toSortNumber(valueB);

        if (Number.isFinite(numberA) && Number.isFinite(numberB)) return numberA - numberB;
        return String(valueA).localeCompare(String(valueB), 'tr');

    };

    // Sorts the list in place.
    const sortItems = function (itemList, sortByTitleIndex, sortDirection) {

        const titleData = box.titleDataList[sortByTitleIndex];
        if (!titleData || titleData.shortable === 0) return;

        const key = titleData.dataTitle;

        itemList.sort((a, b) => {
            const comparison = compareValues(a[key] ?? "", b[key] ?? "");
            return sortDirection === "A-Z" ? comparison : -comparison;
        });

    };

    box.filterAndSortData = function () {

        if (box.itemDataList.length > LOADING_MIN_ITEM_COUNT) box.showLoading(1);

        // WHY: Arka arkaya çağrılırsa (ör. hızlı arama) sadece son çağrı çalışsın; eski sonuç yenisinin üzerine yazılmasın.
        box.filterTimer = waitAndRun(box.filterTimer, function () {

            box.filterTimer = null;
            const searchKeyword = String(box.searchKeyword ?? "").toLowerCase().trim();

            // WHY: A copy; sort() must not change the order of box.itemDataList.
            const filteredList = filterItems([...box.itemDataList], searchKeyword);
            sortItems(filteredList, box.sortByTitleIndex, box.sortDirection);

            box.visibleItemDataList = filteredList;

            box.setScrollToTop();
            box.refreshData();

            box.showLoading(0);

        }, FILTER_DELAY);

    };

    box.generateTestData = function () {

        let bigData = [];

        for (let i = 0; i < TEST_DATA_REPEAT_COUNT; i++) {
            // Nesneleri klonlayarak ekliyoruz ki ID'leri çakışmasın veya referans karışmasın
            const clonedBatch = box.itemDataList.map(item => ({
                ...item,
                id: bigData.length + item.id // Benzersiz ID oluşturmak için
            }));

            bigData.push(...clonedBatch);
        }

        box.itemDataList = bigData;
        box.visibleItemDataList = bigData;

        console.log("Yeni veri sayısı:", box.visibleItemDataList.length);

    };

    box.createVerticalScroll = function () {

        const scrollWidth = box.style.verticalScrollWidth;
        const leftMargin = box.style.verticalScrollMargin;
        const scrollRight = (scrollWidth + leftMargin) * -1;

        box.btnScrollCenter = startBox(0, 0, scrollWidth, SCROLL_CENTER_HEIGHT, {
            right: scrollRight,
            top: box.titleHeight,
            opacity: 0,
            clickable: 0,
            ...box.style.btnScrollCenter,
        });

        Icon(0, 0, "100%", "100%");
        that.load(box.style.btnScrollCenterIconFile);

        endBox();

        box.btnScrollUp = Box(0, 0, scrollWidth, box.titleHeight, {
            right: scrollRight,
            ...box.style.btnScrollUp,
        });
        that.cursor = "pointer";
        that.on("click", function (self, event) {
            box.scrollPage(-1);
        });

        Icon(0, 0, "100%", "100%");
        box.btnScrollUp.add(that);
        that.load(box.style.btnScrollUpIconFile);
        if (box.style.invertIconColor == 1) that.css.filter = "invert(100%)";

        box.btnScrollDown = Box(0, 0, scrollWidth, box.infoHeight, {
            right: scrollRight,
            bottom: 0,
            ...box.style.btnScrollDown,
        });
        that.cursor = "pointer";
        that.on("click", function (self, event) {
            box.scrollPage(1);
        });

        Icon(0, 0, "100%", "100%");
        box.btnScrollDown.add(that);
        that.load(box.style.btnScrollDownIconFile);
        if (box.style.invertIconColor == 1) that.css.filter = "invert(100%)";

    };

    box.createToolbar = function () {

        HGroup({
            align: "left center",
            padding: [8, 0],
        });
        box.boxInfoLine.add(that);

        SearchInput(box.searchInputParams);
        that.setText(box.searchKeyword);
        that.onSubmit = function (searchedText, self) {
            box.searchKeyword = searchedText;
            box.filterAndSortData();
        }

        endGroup();

        HGroup({
            align: "right center",
            padding: [14, 0],
        });
        box.boxInfoLine.add(that);

        box.boxInfoLine.label = Label({
            text: "0 - 0 / 0",
            ...box.style.lblBoxInfoLine,
        });

        endGroup();

        // Center the label
        HGroup({
            align: "right center",
            width: "50%",
            padding: [40, 0],
        });
        box.boxInfoLine.add(that);

        // LABEL: Arama sütunu seçimi (ALL)
        box.lblSelectedSortKey = Label({
            text: box.allTitlesText,
            opacity: 1,
            clickable: 1,
            ...box.style.lblNoDataFound,
            ...box.style.lblSearchTitle, // WHY: Etiket filtre kutusunun içinde duruyor; "no data" etiketinden ayrı stil verilebilsin.
        });
        that.cursor = "pointer";
        that.ellipsis = 1;
        that.css.maxWidth = SEARCH_TITLE_MAX_WIDTH;
        that.setMotion("opacity 0.2s");

        endGroup();

        if (typeof ContextMenu === "function") {

            // MENU: Sütun listesi (Items: box.updateSearchTitleSelect)
            box.searchTitleMenu = ContextMenu({
                minWidth: 160,
                ...box.searchTitleMenuParams,
                onClick: function (self, item) {
                    box.setSearchTitleIndex(item.data);
                },
            });
            box.searchTitleMenu.attachTo(box.lblSelectedSortKey, "click");

        } else {

            // WHY: context-menu.js yüklenmemiş ise özellik yine çalışsın; her basışta sıradaki sütuna geç.
            box.lblSelectedSortKey.on("click", function () {
                box.selectNextSearchTitle();
            });

        }

    };

    box.stretchLastCell = function (width) {

        const hasWidth = width > 0; // WHY: Not "width <= 0": a NaN width must also stop here.
        if (!hasWidth || box.titleCellCount == 0) return;

        const lastCellIndex = box.titleCellCount - 1;

        box.itemLineList.forEach(function (itemLine) {
            itemLine["itemCell" + lastCellIndex].width = width;
        });

        box.titleCellList[lastCellIndex].width = width;

    };

    box.calcLastCellWidth = function () {

        const titleDataList = box.titleDataList;
        const tableWidth = box.width;

        if (titleDataList.length == 0) return 0;

        // WHY: createTitleCell/createItemCell width yoksa DEFAULT_CELL_WIDTH kullanıyor; burada da aynısı olmalı, yoksa basic.num(undefined) NaN olur.
        let totalWidth = 0;
        titleDataList.forEach(function (titleData) {
            totalWidth += basic.num(titleData.width || DEFAULT_CELL_WIDTH);
        });

        const lastCellWidth = basic.num(titleDataList[titleDataList.length - 1].width || DEFAULT_CELL_WIDTH);

        if (tableWidth > totalWidth) return tableWidth - totalWidth + lastCellWidth;

        // WHY: Tablo daraldığında son hücre, önceki genişletilmiş boyutunda kalıyordu. Orijinal genişliğe dön.
        return lastCellWidth;

    };

    box.setItemHeight = function (itemHeight) {

        box.itemHeight = itemHeight;

        box.itemLineList.forEach(function (itemLine) {
            itemLine.height = box.itemHeight;
            itemLine.visible = 1; // WHY: Yükseklik hesaplandıktan sonra göster.
        });

    };

    box.setHeight = function (height) {

        // Yükseklik otomatik değil ise, ItemCell yüksekliği resize sırasında hesaplanır.
        box.recalcItemHeight = (height != "auto") ? 1 : 0;
        box.height = height;

    };

    box.setWidth = function (width) {

        // WHY: Sayı verilirse (width: 800) .includes hata veriyordu.
        const isPercent = typeof width === "string" && width.includes("%");

        if (!isPercent) {
            box.width = width;
            return;
        }

        // A percent width leaves room for the vertical scroll at the right side.
        box.width = "calc(" + width + " - " + box.getVerticalScrollWidth() + "px)";

    };

    box.getTotalWidth = function () {
        return box.width + box.getVerticalScrollWidth();
    }

    box.getVerticalScrollWidth = function () {
        return box.style.verticalScrollWidth + box.style.verticalScrollMargin;
    };

    box.createLoading = function () {

        box.boxLoading = VGroup({
            color: Black(0.3),
            clickable: 1,
            round: box.style.round,
        });
        box.add(box.boxLoading);

        Icon({
            width: LOADING_ICON_SIZE,
            height: LOADING_ICON_SIZE,
        });
        that.load(box.style.loadingIconFile);

        endGroup();

    };

    box.showLoading = function (show) {
        if (show) {
            box.boxLoading.visible = 1;
            box.setVerticalScrollEnabled(false);

        } else {
            box.boxLoading.visible = 0;
            box.setVerticalScrollEnabled(true);
        }
    };

    box.createNoDataFoundLabel = function () {

        // Centered
        HGroup();

        box.lblNoDataFound = Label({
            text: box.noDataFoundAlert,
            opacity: 0,
            ...box.style.lblNoDataFound,
        });
        that.setMotion("opacity 0.2s");

        endGroup();

    };

    // Sütunun listede görünen adı. (HTML etiketleri olmadan; adı boş ise dataTitle)
    const getTitleText = function (titleData) {
        const name = String(titleData.name ?? "").replace(/<[^>]*>/g, "").trim();
        return name || String(titleData.dataTitle ?? "");
    };

    // Arama sütunu kutusunu ve listesini, seçime göre yenile.
    box.updateSearchTitleSelect = function () {

        if (!box.titleDataList[box.searchTitleIndex]) box.searchTitleIndex = -1;

        const selectedTitleData = box.titleDataList[box.searchTitleIndex];
        box.lblSelectedSortKey.text = (selectedTitleData) ? getTitleText(selectedTitleData) : box.allTitlesText;
        box.lblSelectedSortKey.visible = (box.showSearchTitleSelect == 1) ? 1 : 0;

        if (!box.searchTitleMenu) return;

        // WHY: Sadece seçili olanda ikon var; ContextMenu diğerlerine boş ikon alanı verir, metinler aynı hizada durur.
        const getCheckIcon = function (titleIndex) {
            return (box.searchTitleIndex == titleIndex) ? box.style.searchTitleCheckIconFile : "";
        };

        const items = [
            { text: box.allTitlesText, data: -1, iconFile: getCheckIcon(-1) },
            "-",
        ];

        box.titleDataList.forEach(function (titleData, titleIndex) {
            items.push({ text: getTitleText(titleData), data: titleIndex, iconFile: getCheckIcon(titleIndex) });
        });

        box.searchTitleMenu.setItems(items);
        if (box.showSearchTitleSelect != 1) box.searchTitleMenu.close();

    };

    // Arama sütununu seç. -1: ALL (tüm sütunlar)
    box.setSearchTitleIndex = function (titleIndex) {

        box.searchTitleIndex = (box.titleDataList[titleIndex]) ? titleIndex : -1;
        box.updateSearchTitleSelect();

        // WHY: Arama kutusu boş ise sonuç değişmez; scroll boşuna başa dönmesin.
        if (String(box.searchKeyword ?? "").trim() !== "") box.filterAndSortData();

    };
    // USAGE: smartTable.setSearchTitleIndex(1) or smartTable.setSearchTitleIndex(-1)

    // Sıradaki sütuna geç: ALL -> 0 -> 1 -> ... -> ALL
    box.selectNextSearchTitle = function () {
        const nextIndex = box.searchTitleIndex + 1;
        box.setSearchTitleIndex((nextIndex < box.titleDataList.length) ? nextIndex : -1);
    };

    box.setShowSearchTitleSelect = function (show) {
        box.showSearchTitleSelect = basic.isOn(show) ? 1 : 0;
        box.updateSearchTitleSelect();
    };
    // USAGE: smartTable.setShowSearchTitleSelect(0)

    // Fare tekerleği ile satır kaydırma. 0: Tekerlek sayfaya bırakılır.
    box.setWheelScroll = function (enabled) {
        box.wheelScroll = basic.isOn(enabled) ? 1 : 0;
    };
    // USAGE: smartTable.setWheelScroll(1)

    box.createResizeEvent = function () {

        const resizeUI = function () {

            if (box.recalcItemHeight) {

                const itemHeight = (box.height - box.titleHeight - box.infoHeight) / box.itemLineCount;

                // WHY: Hesaplanan yükseklik mevcut itemHeight ile aynı ise satırlar hiç görünür yapılmıyordu.
                if (box.itemHeight != itemHeight || (box.itemLineList[0] && !box.itemLineList[0].visible)) {
                    box.setItemHeight(itemHeight);
                }

            }

            box.stretchLastCell(box.calcLastCellWidth());
            box.initScrollMetrics();
            box.syncScrollPosition();
            box.scrollBar.refreshScroll(); // Ekranı daraltırken, scroll gereksiz görünmesin diye.

            box.refreshData();

        };

        box.onResize(function (self) {
            box.resizeTimer = waitAndRun(box.resizeTimer, resizeUI, RESIZE_DELAY);
        });

    };

    // *** OBJECT VIEW:
    box.init = function () {

        box.clickable = 1;
        // Show outside of the box.
        box.clipContent = 0;
        box.color = box.style.box.color;
        box.round = box.style.round;
        if (box.invertColor == 1) box.css.filter = "invert(100%)";
        box.setWidth(box.style.width);
        box.setHeight(box.style.height);


        // CREATE the structure:

        // Tıtle and Item Lıne Group Container
        box.boxHorizontalScrollable = VGroup({
            align: "top left",
            width: "auto",
            height: "auto",
            padding: [0, 0],
            gap: 0,
            position: "relative",
            clipContent: 0,
            scrollX: 1,
        });
        // WHY: Only the top corners are round; the info line under it has the bottom ones.
        that.css = {
            borderTopLeftRadius: box.style.round + "px",
            borderTopRightRadius: box.style.round + "px",
            borderBottomRightRadius: "0px",
            borderBottomLeftRadius: "0px",
            marginBottom: box.infoHeight + "px",
        };

        // Title Line
        box.boxTitleLine = HGroup({
            height: "auto",
            width: "auto",
            align: "top left",
            padding: [0, 0],
            gap: 0,
            color: box.style.boxTitleLine.color,
            // NOTE: this width, height: "100%" as default.
        });

        // TITLE CELLS WILL BE HERE

        endGroup();

        // Item Lıne Group
        box.boxItemLineGroup = VGroup({
            align: "top left",
            width: "auto",
            height: "auto",
            padding: [0, 0],
            gap: 0,
        });

        // ITEM LINES WILL BE HERE

        endGroup();

        endGroup(); // Tıtle and Item Lıne Group Container

        box.boxInfoLine = HGroup({
            bottom: 0,
            left: 0,
            height: box.infoHeight,
            width: "100%",
            align: "top left",
            padding: [0, 0],
            gap: 0,
            ...box.style.boxInfoLine,
        });
        endGroup();
        that.css = {
            borderTopLeftRadius: "0px",
            borderTopRightRadius: "0px",
            borderBottomRightRadius: box.style.round + "px",
            borderBottomLeftRadius: box.style.round + "px",
            borderTop: box.style.boxInfoLine.borderTop,
        };
        that.clickable = 0;

        box.createToolbar();
        box.createNoDataFoundLabel();

        // boxBorder
        box.boxBorder = Box(0, 0, "100%", "100%", box.style.boxBorder);
        that.round = box.style.round;
        that.color = "transparent";

        box.createVerticalScroll();

        // SCROLL BAR: Horizontal Scroll
        box.scrollBar = ScrollBar({
            scrollableBox: box.boxHorizontalScrollable,
            ...box.scrollBarParams,
        });

        box.createResizeEvent();
        box.createLoading();

    };

    // *** OBJECT INIT CODE:
    box.init(); // Create UI
    box.createTitleLine();
    box.createItemLines();
    box.createScrollEvents();
    box.stretchLastCell(box.calcLastCellWidth());
    box.updateSortIcon();
    box.updateSearchTitleSelect();
    // Add test data WHY: filterAndSortData dan önce olmalı; böylece kayıtlar düz yüklenmeden sıralanır ve büyük veri için loading gösterilir.
    if (box.fillTestData) box.generateTestData();
    box.filterAndSortData();

    return endObject(box);

};