/* Bismillah */

/*

SmartTable - v26.11 - "Optimized for big data"

WHEN TO USE IT (the user, 2026-11-04): to show very big data well, in both directions: very many rows (only the rows
that are seen are made) and very many columns (it scrolls sideways). A table that looks better for data that is not so
big: comp/data-table.js (DataTable). A few rows inside a text: comp/tiny-table.js (TinyTable).

STYLE PACKAGES (2026-11-05, the user): "classic" (default) and "dark" are the looks of DataTable (comp/data-table.js);
new pages use "classic" on a light page and "dark" on a dark page. "green" is the look of SmartTable before them (the
green title line, the dark edge). A package is a package of params: it also gives searchInputParams (the filter box is
a SearchInput package: "ozden" / "ozdenDark"), scrollBarParams and searchTitleMenuParams. (SmartTable.styles)
Sample: 02-comp-examples/smart-table.htm (the model page of SmartTable).
- SmartTable({ styleName: "dark" }), SmartTable({ styleName: "dark", style: { lblItemCell: { fontSize: 14 } } })
- A page with its own colors over the old look names it: SmartTable({ styleName: "green", style: {...} }) (the keys it
  does not give come from that package, not from classic).
- A cut text (2026-11-05, the user): a cell whose text does not fit (its end is "...") shows all of it in a bubble over
  the cell when the mouse rests on it (style.cellTooltip: the look; showCellTooltip: 0 turns it off). The bubble is
  comp/tooltip.js (Tooltip.show); without that file the browser's own hint (the title of the cell) shows the text.

- SmartTable is a JavaScript table component designed to run smoothly even with millions of records. Thanks to its virtual scroll architecture, it only writes the visible rows to the DOM, eliminating memory and performance issues with large datasets. It makes data exploration easy with real-time filtering, multi-column sorting, and both horizontal and vertical scroll support. Custom cell designs can be created for each column via createCustomItemCell, allowing flexible visual content per column. Since column widths, heights, and colors are all configurable through parameters, it can be quickly adapted to different projects.


Started Date: Mar 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/


- Arama sütunu: Arama kutusunun sağ ucundaki etikete (ALL) basınca sütun listesi açılır. Arama sadece seçilen sütunda yapılır.
-- (2026-11-05, the user) The chip is in the filter box at its right end; the clear icon shows at its left while
   there is a text, and a narrow box shows no clear icon (searchInputParams.clearIconMinTextWidth: 80 px of text).
   A narrow table gives the filter box the room up to the count (up to 240 px).
-- searchTitleIndex: -1 (ALL: tüm sütunlar), showSearchTitleSelect: 0 ise kutu gizlenir.
-- Liste için comp/context-menu.js yüklenmelidir. Yüklenmemiş ise, kutuya her basışta sıradaki sütuna geçer.
- fitLineCount: 1 (2026-11-04): the rows are about itemHeight px high and their count follows the height of the table
  (style.height "100%" in a window that grows or shrinks). 0 (default): itemLineCount rows share the height of the table.
  setItemLineCount(count) makes another count of rows.
- The keys (2026-11-04, canSelect: 1 by default): a click selects a row and gives the table the focus. The selected
  row: style.selectedItemCellColor (null: the color of the row under the mouse) and the line style.selectedBar at its
  left. Then ↑ ↓ move one row, Page Up / Page Down one page, Home / End to the first / the last record, Enter runs
  onSelect like a click. The selected row stays seen after a sort or a filter. The edge of the table shows the focus
  of the keyboard (style.focusRingColor). selectItem(itemData), clearSelection(), getSelectedIndex(),
  box.selectedItemData. canSelect: 0: no selection and no keys (a click only runs onSelect).
- locale (2026-11-04): the language of the numbers of the info line. "": the language of the page (<html lang>); a page
  with no language keeps "tr-TR". Ex: "en-US" -> 12,499, "tr-TR" -> 12.499. setLocale(locale).
- wheelScroll: 1 ise fare tekerleği tablonun satırlarını kaydırır (sayfa kaymaz). Varsayılan 0: tekerlek sayfayı kaydırır, satırlar scroll çubuğu ve butonlar ile kaydırılır.
-- smartTable.setWheelScroll(1) ile sonradan açılabilir.
- allowHtml (2026-10-29): 0 (varsayılan): hücre değerleri düz metin yazılır (kullanıcının yazdığı bir ad veya başlık
  HTML olarak çalışmaz). 1: değerler HTML olarak yazılır (Ex: "<b>12</b>"). createCustomItemCell / updateCustomItemCell
  içinde cell.label.text ile yazılan kendi değerleriniz etkilenmez.


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
    allowHtml: 0, // 1: The cell values are written as HTML. 0: As plain text (safe for the text of the users)
    showCellTooltip: 1, // 1: a cell whose text does not fit shows all of it in a bubble (comp/tooltip.js). 0: no bubble
    allTitlesText: "ALL",
    canSelect: 1, // 1: a click or a key selects a row; Enter runs onSelect. 0: no selection, no keys
    fitLineCount: 0, // 1: rows of about itemHeight px, as many as the height of the table holds
    locale: "", // the numbers of the info line ("": the language of the page). Ex: "en-US", "tr-TR"
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
    // The filter box (a SearchInput): its colors and edges come from the SearchInput package of styleName.
    searchInputParams: {
        styleName: "ozden", // a SearchInput package: "ozden" (a light page), "ozdenDark"
        width: "50%",
        height: 36,
        fontSize: 15,
        searchIconSize: 16,
        searchIconOpacity: 0.5,
        placeholderText: "Filter",
        searchIconFile: "../comp/search-input-v2/filter.png",
        clearIconMinTextWidth: 80, // (the user, 2026-11-05: a narrow filter box has no clear icon; its text keeps that place)
    },
    styleName: "classic", // "classic", "dark", "green" or a name added to SmartTable.styles
    style: { // Classic style package (default): the look of DataTable "classic" (2026-11-05, the user)

        width: "auto",
        height: "auto",
        round: 6,
        line1Color: "white",
        line2Color: "#F7F7F7",
        // WHY solid colors: the cells are painted over the stripes of the rows; DataTable's soft yellow
        //     (rgba(254, 193, 8, 0.08) / 0.18) is mixed with white here, so a row looks the same on every stripe.
        highlightItemCellColor: "#FFFAEB",
        selectedItemCellColor: "#FFF4D3", // null: highlightItemCellColor (the row under the mouse)
        selectedBar: { width: 0, color: "rgba(95, 158, 160, 0.9)" }, // the line at the left of the selected row (width 0: none)
        focusRingColor: "rgba(95, 158, 160, 0.6)", // the edge of the table when the keys move its rows
        highlightTitleCellColor: "white",
        titleUppercase: 1, // 1: the titles in capital letters (0: as titleDataList writes them)
        verticalScrollWidth: 20,
        verticalScrollMargin: 2,
        btnScrollDownIconFile: "../comp/smart-table/down.png",
        btnScrollUpIconFile: "../comp/smart-table/up.png",
        btnScrollCenterIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 50" fill="none" stroke="#000000" stroke-opacity="0.4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5v15M6.5 21 10 17.5 13.5 21M6.5 29 10 32.5 13.5 29"/></svg>'),
        sortIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.71,9.88l-4.3-4.29a2,2,0,0,0-2.82,0L6.29,9.88a1,1,0,0,0,0,1.41,1,1,0,0,0,1.42,0L11,8V19a1,1,0,0,0,2,0V8l3.29,3.29a1,1,0,1,0,1.42-1.41Z"/></svg>'),
        loadingIconFile: "../comp/smart-table/clock.png",
        searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#373836" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
        invertIconColor: 0, // 1: the sort and the scroll arrows are drawn light (a dark page)
        sortIcon: { size: 16, opacity: 0.25, activeOpacity: 1 }, // the arrow of a title: not sorted / sorted
        // The bubble of a cut text: the keys of Tooltip.BUBBLE_LOOK (comp/tooltip.js) and maxWidth (px: a longer
        // text goes on more lines)
        cellTooltip: { fontSize: 14, color: "white", textColor: Black(0.8), round: 6, border: 1, borderColor: Black(0.15), shadow: "0 6px 16px " + Black(0.12), arrow: 10, padding: [12, 8], maxWidth: 360 },

        box: { color: "white" },
        boxBorder: { border: 1, borderColor: Black(0.15) },
        boxTitleLine: { color: "whitesmoke" },
        boxTitleCell: { padding: [10, 0], borderRight: "1px solid " + Black(0.08), borderBottom: "1px solid " + Black(0.2) },
        lblTitleCell: { fontSize: 15, fontFamily: "opensans-bold", textColor: Black(0.8) },
        boxItemCell: { borderBottom: "1px solid " + Black(0.08), borderRight: "none", padding: [10, 0] },
        lblItemCell: { fontSize: 15, textColor: Black(0.7), fontFamily: "opensans" },
        boxInfoLine: { color: "white", borderTop: "1px solid " + Black(0.2) },
        lblBoxInfoLine: { fontSize: 14, textColor: Black(0.5) },
        lblNoDataFound: { color: "transparent", textColor: Black(0.45), padding: [8, 2], fontSize: 15, round: 8, border: 0, borderColor: "transparent" },
        // Filtre kutusundaki sütun seçim etiketi (ALL), lblNoDataFound stilinin üstüne.
        lblSearchTitle: { color: "white", textColor: Black(0.6), padding: [8, 2], fontSize: 12, round: 50, border: 1, borderColor: Black(0.12) },
        btnScrollCenter: { color: "white", round: 100, border: 1, borderColor: Black(0.2) },
        btnScrollUp: { color: "whitesmoke", round: 100, border: 1, borderColor: Black(0.15) },
        btnScrollDown: { color: "whitesmoke", round: 100, border: 1, borderColor: Black(0.15) },
        boxSort: { color: "transparent" },

    },
};

const SmartTable = function (params = {}) {

    // Merge style package: params.style > SmartTable.styles[styleName] (a package of params) > SmartTableDefaults (classic)
    basic.applyStylePackage(params, SmartTable.styles, SmartTableDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SmartTableDefaults);

    // BOX: Component container
    let box = startObject(params);

    // WHY: mergeIntoIfMissing dizileri referansla kopyalıyor. Kopyalanmaz ise setTitleCellWidth, SmartTableDefaults (ve diğer tabloları) değiştirir.
    box.titleDataList = box.titleDataList.map(titleData => ({ ...titleData }));
    box.itemDataList = [...box.itemDataList];

    // *** PRIVATE VARIABLES:
    const DEFAULT_CELL_WIDTH = 100;
    const SCROLL_CENTER_HEIGHT = 50;
    const CELL_TOOLTIP_DELAY = 300; // ms: the mouse rests on a cell before its bubble shows (no bubbles while it moves)
    const LOADING_ICON_SIZE = 32;
    const SEARCH_TITLE_MAX_WIDTH = "160px";
    const SEARCH_TITLE_RIGHT = 6; // px: the chip (ALL) from the right side of the filter box
    const SEARCH_TITLE_GAP = 6; // px: between the clear icon of the filter box and the chip
    const SEARCH_MIN_WIDTH = 240; // px: a narrow table gives the filter box more than its share of the line, up to this
    const TOOLBAR_PADDING = 8; // px: the filter box from the left side of the info line
    const TOOLBAR_GAP = 12; // px: between the filter box and the count
    const COUNT_RIGHT = 14; // px: the count from the right side of the info line
    const FILTER_DELAY = 50; // ms
    const RESIZE_DELAY = 3; // ms
    const LOADING_MIN_ITEM_COUNT = 1000; // WHY: Küçük listelerde loading bir an yanıp sönmesin.
    const TEST_DATA_REPEAT_COUNT = 100000;
    const DEFAULT_LOCALE = "tr-TR"; // WHY: the numbers were always Turkish before (2026-11-04); a page with no language keeps them
    const targetItemHeight = box.itemHeight; // fitLineCount: the height of a row, before the rows share the height
    let searchClearIconRight = 0; // the place of the clear icon of the filter box with no chip (its own)
    let hoveredCell = null; // the cell under the mouse (the bubble of a cut text: showCellTooltip)
    let cellTooltip = null; // the bubble of a cut text (Tooltip.show), null: none
    let cancelCellTooltipTimer = null;

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
    // The SearchInput of the filter, made in createToolbar [var]. USAGE: table.searchInput.setText("") (a new list)
    box.searchInput = null;
    // The selected record (canSelect: 1), null: none [var]. USAGE: table.selectItem(data), table.getSelectedIndex()
    box.selectedItemData = null;
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
        closeCellTooltip(); // WHY: the bubble is on the page too

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events (listenTo too) and the objects inside.
        box = null;

    };

    // A row without data stays in its place, empty and not clickable.
    const hideItemLine = function (itemLine) {
        itemLine.opacity = 0;
        itemLine.clickable = 0;
        itemLine.itemData = null;
        paintItemLine(itemLine);
    };

    const fillItemLine = function (itemLine, rowData) {

        itemLine.opacity = 1;
        itemLine.clickable = 1;
        itemLine.itemData = rowData; // WHY: Line a basıldığında bu bilgi kullanılacak.
        paintItemLine(itemLine);

        for (let j = 0; j < box.titleCellCount; j++) {

            const titleData = box.titleDataList[j];
            const cell = itemLine["itemCell" + j];
            const newValue = rowData[titleData.dataTitle] ?? "";

            // Sadece değer değişmişse DOM'a dokun
            // WHY: label.text innerHTML (string) döndürüyor; sayı veya "&" içeren değerlerle karşılaştırma hep farklı çıkıyordu. Son yazılan değer hücrede tutuluyor.
            if (!("lastValue" in cell) || cell.lastValue !== newValue) { // WHY: eğer !== olmaz ise, 0 ile "" aynı sayılıyor.
                cell.lastValue = newValue;
                // WHY plainText: a value from a user (a name, a title) ran as HTML in the cell
                if (box.allowHtml == 1) cell.label.text = newValue;
                else cell.label.plainText = newValue;
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
        refreshCellTooltip();

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

        const iconSize = box.style.sortIcon.size;

        startBox({
            align: "right center",
            color: box.style.boxSort.color,
            round: 100,
            border: 0,
            borderColor: "rgba(0,0,0,0.1)",
            width: iconSize,
            height: iconSize,
            right: 2,
            padding: [4, 0],
            position: "absolute",
        });
        if (titleCell.shortable == 0) that.opacity = 0;
        titleCell.add(that);
        that.center("top");

        titleCell.icon = Icon({
            width: iconSize,
            height: iconSize,
            left: 0,
            top: 0,
            opacity: box.style.sortIcon.opacity,
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
                titleCell.icon.opacity = box.style.sortIcon.opacity;
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
        if (box.style.titleUppercase == 1) that.css.textTransform = "uppercase";

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

        titleCell.icon.opacity = box.style.sortIcon.activeOpacity;

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
        box.itemLineList.forEach(paintItemLine); // WHY: the selected row gets its color back
    };

    box.applyColumnHighlight = function (titleCell) {
        if (!box.highlightTitle) return;
        paintColumn(titleCell, box.style.highlightTitleCellColor, box.style.highlightItemCellColor);
    };

    // Tüm bilgi satırlarını oluştur.
    box.createItemLines = function () {

        setHoveredCell(null); // WHY: the cell under the mouse is removed with its row
        // WHY remove(): the objects of the old rows (and of the cells of the page) are cleaned, not only taken off the page
        box.itemLineList.forEach(function (itemLine) { itemLine.remove(); });
        box.itemLineList = [];

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
            if (box.canSelect == 1) {
                box.selectItem(self.itemData);
                box.elem.focus({ preventScroll: true }); // WHY preventScroll: the page must not move to the table
            }
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

    // The color of the cells of a row: the selected record, else the row under the mouse (highlightLine), else none
    const paintItemLine = function (itemLine) {

        const isSelected = Boolean(itemLine.itemData) && itemLine.itemData === box.selectedItemData;
        let color = "transparent";
        if (itemLine.isHover && box.highlightLine) color = box.style.highlightItemCellColor;
        if (isSelected) color = getSelectedColor();
        paintItemLineCells(itemLine, color);

        // WHY the bar: by default the selected row has the color of the row under the mouse; the bar tells them apart
        const firstCell = itemLine["itemCell0"];
        if (firstCell) firstCell.boxShadow = isSelected ? getSelectedBarShadow() : "none";

    };

    const getSelectedBarShadow = function () {
        if (!box.style.selectedBar.width) return "none";
        // WHY + the border: the edge of the table (style.boxBorder) is drawn over the first px of the row
        const width = (basic.num(box.style.boxBorder.border) || 0) + box.style.selectedBar.width;
        return "inset " + width + "px 0 0 " + box.style.selectedBar.color;
    };

    const getSelectedColor = function () {
        return box.style.selectedItemCellColor || box.style.highlightItemCellColor;
    };

    // *** THE BUBBLE OF A CUT TEXT (showCellTooltip: 1):

    const onCellHoverChange = function (cell, isOver) {
        if (isOver) {
            setHoveredCell(cell);
            return;
        }
        if (hoveredCell === cell) setHoveredCell(null);
    };

    const setHoveredCell = function (cell) {
        hoveredCell = cell;
        planCellTooltip();
    };

    // The bubble waits until the mouse rests on the cell
    const planCellTooltip = function () {
        closeCellTooltip();
        if (!hoveredCell || box.showCellTooltip != 1) return;
        cancelCellTooltipTimer = box.after(CELL_TOOLTIP_DELAY, openCellTooltip);
    };

    const openCellTooltip = function () {

        cancelCellTooltipTimer = null;
        const text = getCutText(hoveredCell);

        // WHY: without comp/tooltip.js the browser's own hint (the title of the cell) shows the text
        if (typeof Tooltip === "undefined") {
            hoveredCell.elem.title = text;
            return;
        }

        if (!text) return;
        cellTooltip = Tooltip.show(hoveredCell, text, box.style.cellTooltip, "top", function (bubble) {
            createTooltipText(text, bubble.look);
        });
        cellTooltip.cellText = text;

    };

    // The whole text of a cell whose text does not fit (its end is "..."). "": it fits, or the row has no record.
    const getCutText = function (cell) {
        // WHY itemData: a row with no record keeps the text of its last record, unseen
        if (!cell.itemLine.itemData) return "";
        const label = cell.label.elem;
        // (a hidden label, Ex: a cell of createCustomItemCell, is 0 px wide: it fits)
        if (label.scrollWidth <= label.clientWidth) return "";
        return label.textContent;
    };

    // LABEL: The whole text in the bubble (a long text goes on more lines: look.maxWidth)
    const createTooltipText = function (text, look) {
        Label({
            plainText: text,
            fontSize: look.fontSize,
            textColor: look.textColor,
            css: { whiteSpace: "normal", overflowWrap: "anywhere", width: "max-content", maxWidth: look.maxWidth + "px" },
        });
    };

    const closeCellTooltip = function () {
        if (cancelCellTooltipTimer) cancelCellTooltipTimer();
        cancelCellTooltipTimer = null;
        if (cellTooltip) cellTooltip.remove();
        cellTooltip = null;
    };

    // The rows were filled again (a scroll, a filter, a click): a bubble with an old text is made again
    const refreshCellTooltip = function () {
        if (!hoveredCell) return;
        if (cellTooltip && cellTooltip.cellText === hoveredCell.label.elem.textContent) return;
        planCellTooltip();
    };

    box.setShowCellTooltip = function (value) {
        box.showCellTooltip = basic.isOn(value) ? 1 : 0;
        planCellTooltip();
    };
    // USAGE: smartTable.setShowCellTooltip(0)

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
            itemLine.isHover = 1;
            paintItemLine(itemLine);
        });

        itemCell.on("mouseout", function (self, event) {
            itemLine.isHover = 0;
            paintItemLine(itemLine);
        });

        itemCell.itemLine = itemLine; // (a row with no record shows no bubble)
        itemCell.onHoverChange(function (self, isOver) {
            onCellHoverChange(itemCell, isOver);
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

    // *** SELECTION AND KEYS (canSelect: 1):

    // The index of the selected record in the records that are seen (filtered and sorted), -1: none
    box.getSelectedIndex = function () {
        if (!box.selectedItemData) return -1;
        return box.visibleItemDataList.indexOf(box.selectedItemData);
    };

    // Selects a record (one of itemDataList, null: none) and scrolls the rows to it
    box.selectItem = function (itemData) {
        if (box.canSelect != 1) return;
        box.selectedItemData = itemData || null;
        scrollToSelected();
        box.refreshData();
    };
    // USAGE: smartTable.selectItem(smartTable.visibleItemDataList[0])

    box.clearSelection = function () {
        box.selectItem(null);
    };

    box.setCanSelect = function (value) {
        box.canSelect = basic.isOn(value) ? 1 : 0;
        if (box.canSelect != 1) box.selectedItemData = null;
        applyCanSelect();
        box.refreshData();
    };
    // USAGE: smartTable.setCanSelect(0)

    // The table takes the focus (Tab, a click on a row) only when it can select
    const applyCanSelect = function () {
        box.tabIndex = (box.canSelect == 1) ? 0 : null;
        if (box.canSelect != 1) box.elem.blur();
    };

    // The edge of the table shows the focus of the keyboard (:focus-visible), not of the mouse.
    // WHY on boxBorder (not setFocusRing): the rows cover an outline that is drawn inside the table itself
    const paintFocus = function () {
        const hasKeyboardFocus = box.elem.matches(":focus-visible");
        box.boxBorder.css.outline = hasKeyboardFocus ? "2px solid " + box.style.focusRingColor : "none";
        box.boxBorder.css.outlineOffset = "-2px";
    };

    // The rows move as little as they can to show the selected record
    const scrollToSelected = function () {
        const index = box.getSelectedIndex();
        if (index == -1) return;
        let topIndex = box.startedItemIndexForScrolling;
        if (index < topIndex) topIndex = index;
        if (index >= topIndex + box.itemLineCount) topIndex = index - box.itemLineCount + 1;
        box.startedItemIndexForScrolling = clampScrollIndex(topIndex);
        box.syncScrollPosition();
    };

    // A step of rows from the selected record. Nothing selected: a step down starts before the first record, up after the last.
    const moveSelection = function (step) {
        const count = box.visibleItemDataList.length;
        if (count == 0) return;
        let index = box.getSelectedIndex();
        if (index == -1) index = (step > 0) ? -1 : count;
        box.selectItem(box.visibleItemDataList[basic.clamp(index + step, 0, count - 1)]);
    };

    // ↑ ↓ one row, Page Up / Page Down one page, Home / End to the first / the last record (0: not a key of the rows)
    const getKeyStep = function (key) {
        const pageStep = box.itemLineCount;
        const count = box.visibleItemDataList.length;
        const steps = { ArrowDown: 1, ArrowUp: -1, PageDown: pageStep, PageUp: -pageStep, Home: -count, End: count };
        return steps[key] || 0;
    };

    const onKeyDown = function (self, event) {

        // WHY: only the table itself takes the keys (not its filter box); a key with Cmd / Ctrl / Alt is left to the page
        if (box.canSelect != 1 || event.target != box.elem) return;
        if (event.metaKey || event.ctrlKey || event.altKey) return;

        if (event.key == "Enter") {
            if (box.selectedItemData) box.onSelect(box.selectedItemData);
            return;
        }

        const step = getKeyStep(event.key);
        if (step == 0) return;
        event.preventDefault(); // WHY: the arrows and the page keys must not scroll the page
        moveSelection(step);
        paintFocus(); // WHY: a table that got the focus with a click shows it once the keys are used

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

        box.boxInfoLine.label.text = `${formatNumber(start)} - ${formatNumber(end)} / ${formatNumber(totalData)}`;

    };

    // A number in the language of the numbers (locale): 12499 -> "12,499" (en) or "12.499" (tr)
    const formatNumber = function (number) {
        try {
            return number.toLocaleString(box.locale || document.documentElement.lang || DEFAULT_LOCALE);
        } catch (error) {
            // WHY: a wrong language tag (Ex: "en_US") throws a RangeError
            return number.toLocaleString(DEFAULT_LOCALE);
        }
    };

    box.setLocale = function (locale) {
        box.locale = locale;
        box.updateInfoLabel();
    };
    // USAGE: smartTable.setLocale("en-US")

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
        return SmartTable.toSearchText(value).includes(searchKeyword);
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
            const searchKeyword = SmartTable.toSearchText(box.searchKeyword ?? "").trim();

            // WHY: A copy; sort() must not change the order of box.itemDataList.
            const filteredList = filterItems([...box.itemDataList], searchKeyword);
            sortItems(filteredList, box.sortByTitleIndex, box.sortDirection);

            box.visibleItemDataList = filteredList;

            box.setScrollToTop();
            // WHY: the selected record stays selected and seen after a sort or a filter; a record that is gone is not
            if (box.getSelectedIndex() == -1) box.selectedItemData = null;
            scrollToSelected();
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

    // A narrow table: the filter box is wider than its share of the line (searchInputParams.width, Ex: "50%"), up to
    // SEARCH_MIN_WIDTH and up to the count. A width in px stays as it is.
    const applySearchWidth = function () {
        const width = String(box.searchInputParams.width);
        box.searchInput.css.minWidth = "0px"; // WHY: a long count makes it narrower
        if (!width.endsWith("%")) return;
        box.searchInput.css.flexGrow = "1";
        box.searchInput.css.maxWidth = "max(" + width + ", " + SEARCH_MIN_WIDTH + "px)";
    };

    // The chip keeps the right end of the filter box: the clear icon and the text of SearchInput are at its left.
    const fitSearchToTitle = function () {
        const titleWidth = box.lblSelectedSortKey.elem.offsetWidth;
        const hasTitle = (titleWidth > 0);
        box.searchInput.setClearIconRight(hasTitle ? SEARCH_TITLE_RIGHT + titleWidth + SEARCH_TITLE_GAP : searchClearIconRight);
    };

    box.createToolbar = function () {

        // GROUP: The filter box and the count, in one line
        // WHY one line (flex): a narrow table gives the filter box the room up to the count, and a long count makes
        //     it narrower (it never covers the count). (2026-11-05, the user)
        HGroup({
            align: "left center",
            gap: TOOLBAR_GAP,
            padding: [TOOLBAR_PADDING, 0],
        });
        box.boxInfoLine.add(that);

        box.searchInput = SearchInput(box.searchInputParams);
        that.setText(box.searchKeyword);
        that.onSubmit = function (searchedText, self) {
            box.searchKeyword = searchedText;
            box.filterAndSortData();
        }
        searchClearIconRight = that.clearIconRight;
        applySearchWidth();

        box.boxInfoLine.label = Label({
            text: "0 - 0 / 0",
            ...box.style.lblBoxInfoLine,
        });
        that.css = { marginLeft: "auto", marginRight: (COUNT_RIGHT - TOOLBAR_PADDING) + "px", flexShrink: "0" };

        endGroup();

        // LABEL: Arama sütunu seçimi (ALL): in the filter box, at its right end (2026-11-05, the user)
        box.lblSelectedSortKey = createIn(box.searchInput, function () {
            return Label({
                text: box.allTitlesText,
                right: SEARCH_TITLE_RIGHT,
                opacity: 1,
                clickable: 1,
                ...box.style.lblNoDataFound,
                ...box.style.lblSearchTitle, // WHY: Etiket filtre kutusunun içinde duruyor; "no data" etiketinden ayrı stil verilebilsin.
            });
        });
        that.cursor = "pointer";
        that.ellipsis = 1;
        that.css.maxWidth = SEARCH_TITLE_MAX_WIDTH;
        // WHY CSS: the chip stays in the middle of the box when its text or its font changes
        that.css.top = "50%";
        that.css.transform = "translateY(-50%)";
        that.setMotion("opacity 0.2s");
        // WHY onResize: a column name is wider than ALL; a hidden chip is 0 px (showSearchTitleSelect: 0)
        that.onResize(fitSearchToTitle);

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

    // The height the rows share: the table without its title line and its info line
    const getRowsHeight = function () {
        return box.height - box.titleHeight - box.infoHeight;
    };

    // The parts that depend on the size of the table (onResize)
    const refreshLayout = function () {

        if (box.recalcItemHeight && box.fitLineCount == 1) {

            fitItemLines();

        } else if (box.recalcItemHeight) {

            const itemHeight = getRowsHeight() / box.itemLineCount;

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

    // fitLineCount: 1 -> as many rows of about targetItemHeight as the table holds; they share its height exactly
    const fitItemLines = function () {
        const rowsHeight = getRowsHeight();
        if (rowsHeight <= 0) return; // WHY: the table is not drawn yet
        const lineCount = Math.max(1, Math.round(rowsHeight / targetItemHeight));
        if (lineCount != box.itemLineList.length) {
            box.setItemLineCount(lineCount);
            return;
        }
        box.setItemHeight(rowsHeight / lineCount);
    };

    // Makes count rows: only these rows exist, they show the records from startedItemIndexForScrolling.
    // (fitLineCount: 1 makes the count again when the size of the table changes.)
    box.setItemLineCount = function (count) {

        box.itemLineCount = Math.max(1, Math.round(count));
        box.createItemLines();

        const rowsHeight = getRowsHeight();
        const hasRowsHeight = box.recalcItemHeight && rowsHeight > 0;
        box.setItemHeight(hasRowsHeight ? rowsHeight / box.itemLineCount : box.itemHeight);

        box.stretchLastCell(box.calcLastCellWidth());
        box.startedItemIndexForScrolling = clampScrollIndex(box.startedItemIndexForScrolling);
        scrollToSelected();
        box.initScrollMetrics();
        box.syncScrollPosition();
        box.refreshData();

    };
    // USAGE: smartTable.setItemLineCount(20)

    box.setFitLineCount = function (value) {
        box.fitLineCount = basic.isOn(value) ? 1 : 0;
        refreshLayout();
    };
    // USAGE: smartTable.setFitLineCount(1)

    box.createResizeEvent = function () {

        box.onResize(function (self) {
            box.resizeTimer = waitAndRun(box.resizeTimer, refreshLayout, RESIZE_DELAY);
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
    box.on("keydown", onKeyDown);
    box.on("focus", paintFocus);
    box.on("blur", paintFocus);
    applyCanSelect();
    box.stretchLastCell(box.calcLastCellWidth());
    box.updateSortIcon();
    box.updateSearchTitleSelect();
    // Add test data WHY: filterAndSortData dan önce olmalı; böylece kayıtlar düz yüklenmeden sıralanır ve büyük veri için loading gösterilir.
    if (box.fillTestData) box.generateTestData();
    box.filterAndSortData();

    return endObject(box);

};

// The text of a cell (and of the keyword) for the filter: lowercase in Turkish ("İ" -> "i", not "i" + a dot), without
// the marks of the letters, "ı" as "i" (as DataTable.toSearchText).
// WHY: toLowerCase() made "İstanbul" "i̇stanbul": the keyword "istanbul" found nothing (2026-11-05).
// WHY the fast way: most texts have no letter outside ASCII after the lowercase, and a table can have 100 000 rows.
SmartTable.toSearchText = function (value) {
    const text = String(value).toLocaleLowerCase("tr");
    if (!SmartTable.NOT_ASCII.test(text)) return text;
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i");
};
SmartTable.NOT_ASCII = /[^\u0000-\u007f]/;

// *** STYLE PACKAGES:
// USAGE: SmartTable({ styleName: "dark" })
// USAGE: SmartTable({ styleName: "dark", style: { lblItemCell: { fontSize: 14 } } }) // Change only some keys.
// NOTE: A package is a package of params (it has a "style" key): its other keys (searchInputParams, scrollBarParams,
//       searchTitleMenuParams) fill the params you did not give. A new package needs only the keys that differ from
//       the classic look (SmartTableDefaults).
SmartTable.styles = {

    // The look of DataTable "classic": a light gray title line, striped rows, a soft yellow row under the mouse and
    // a stronger one for the selected row; the filter box is the SearchInput "ozden". (SmartTableDefaults)
    classic: { style: {} },

    // The look of DataTable "dark", for a dark page; the filter box is the SearchInput "ozdenDark", the column list
    // is the ContextMenu "dark".
    dark: {
        style: {
            line1Color: "#232428",
            line2Color: "#27292D",
            highlightItemCellColor: "#2E3035",
            selectedItemCellColor: "#24383A",
            focusRingColor: "rgba(95, 179, 181, 0.7)",
            highlightTitleCellColor: "#33353A",
            // WHY its own icon: invertIconColor turns only the sort and the up / down arrows
            btnScrollCenterIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 50" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17.5v15M6.5 21 10 17.5 13.5 21M6.5 29 10 32.5 13.5 29"/></svg>'),
            searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#E6E6E6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
            invertIconColor: 1,
            sortIcon: { size: 16, opacity: 0.3, activeOpacity: 1 },
            cellTooltip: { color: "#2B2D31", textColor: "rgba(255, 255, 255, 0.88)", borderColor: "rgba(255, 255, 255, 0.14)", shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
            box: { color: "#232428" },
            boxBorder: { border: 1, borderColor: "rgba(255, 255, 255, 0.12)" },
            boxTitleLine: { color: "#2B2D31" },
            boxTitleCell: { borderRight: "1px solid rgba(255, 255, 255, 0.08)", borderBottom: "1px solid rgba(255, 255, 255, 0.14)" },
            lblTitleCell: { textColor: "rgba(255, 255, 255, 0.85)" },
            boxItemCell: { borderBottom: "1px solid rgba(255, 255, 255, 0.06)" },
            lblItemCell: { textColor: "rgba(255, 255, 255, 0.75)" },
            boxInfoLine: { color: "#232428", borderTop: "1px solid rgba(255, 255, 255, 0.14)" },
            lblBoxInfoLine: { textColor: "rgba(255, 255, 255, 0.5)" },
            lblNoDataFound: { textColor: "rgba(255, 255, 255, 0.45)" },
            lblSearchTitle: { color: "#33353A", textColor: "rgba(255, 255, 255, 0.7)", borderColor: "rgba(255, 255, 255, 0.14)" },
            btnScrollCenter: { color: "#2B2D31", borderColor: "rgba(255, 255, 255, 0.2)" },
            btnScrollUp: { color: "#2B2D31", borderColor: "rgba(255, 255, 255, 0.14)" },
            btnScrollDown: { color: "#2B2D31", borderColor: "rgba(255, 255, 255, 0.14)" },
        },
        searchInputParams: { styleName: "ozdenDark" },
        scrollBarParams: { bar_color: "#A0A0A0", bar_mouseOverColor: "#D0D0D0" },
        searchTitleMenuParams: { styleName: "dark" },
    },

    // The look of SmartTable before the packages (2026-11-05): the green title line, a dark edge, big texts. Every
    // key is here: a page that changes some of them over this look (styleName: "green") gets the rest from it.
    green: {
        style: {
            width: "auto",
            height: "auto",
            round: 6,
            line1Color: "white",
            line2Color: "whitesmoke",
            highlightItemCellColor: "#F3E7C2",
            selectedItemCellColor: null, // null: highlightItemCellColor (the row under the mouse)
            selectedBar: { width: 3, color: "rgba(95, 158, 160, 0.9)" },
            focusRingColor: "rgba(95, 158, 160, 0.6)",
            highlightTitleCellColor: White(0.2),
            titleUppercase: 0,
            verticalScrollWidth: 20,
            verticalScrollMargin: 2,
            btnScrollDownIconFile: "../comp/smart-table/down.png",
            btnScrollUpIconFile: "../comp/smart-table/up.png",
            btnScrollCenterIconFile: "../comp/smart-table/scroll.png",
            sortIconFile: "../comp/smart-table/sort.png",
            loadingIconFile: "../comp/smart-table/clock.png",
            searchTitleCheckIconFile: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#373836" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5 10 17.5 19 7"/></svg>'),
            invertIconColor: 0,
            sortIcon: { size: 22, opacity: 0.5, activeOpacity: 1 },
            box: { color: "white" },
            boxBorder: { border: 2, borderColor: Black(0.8) },
            boxTitleLine: { color: "#65A293" },
            boxTitleCell: { padding: [8, 0], borderRight: "1px solid rgba(0, 0, 0, 0.5)", borderBottom: "2px solid #141414" },
            lblTitleCell: { fontSize: 20, fontFamily: "opensans", textColor: Black(0.8) },
            boxItemCell: { borderBottom: "1px solid darkgray", borderRight: "1px solid rgba(0, 0, 0, 0.05)", padding: [8, 0] },
            lblItemCell: { fontSize: 20, textColor: Black(0.75), fontFamily: "opensans" },
            boxInfoLine: { color: "#E4E4E4", borderTop: "1px solid rgba(0, 0, 0, 0)" },
            lblBoxInfoLine: { fontSize: 16, textColor: Black(0.85) },
            lblNoDataFound: { color: "lightgray", textColor: Black(0.8), padding: [8, 2], fontSize: 14, round: 8, border: 1, borderColor: Black(0.4) },
            // (the user, 2026-11-05: whitesmoke, as the pale lines of the table; the edge of the filter box)
            lblSearchTitle: { color: "whitesmoke", textColor: Black(0.8), padding: [8, 2], fontSize: 14, round: 8, border: 1, borderColor: Black(0.15) },
            btnScrollCenter: { color: "white", round: 100, border: 1, borderColor: "rgba(0,0,0,0.4)" },
            btnScrollUp: { color: "lightgray", round: 100, border: 1, borderColor: "rgba(0, 0, 0, 0.6)" },
            btnScrollDown: { color: "lightgray", round: 100, border: 1, borderColor: "rgba(0, 0, 0, 0.6)" },
            boxSort: { color: "#65A293" },
        },
        searchInputParams: {
            styleName: "classic",
            width: "50%",
            height: 36,
            border: 1,
            round: 8,
            color: "white",
            searchIconSize: 16,
            placeholderText: "Filter",
            fontSize: 16,
            borderColor: Black(0.15), // (the user, 2026-11-05: light edges in the filter)
            borderBottomStyle: "1px solid " + Black(0.15),
            searchIconFile: "../comp/search-input-v2/filter.png",
            searchIconOpacity: 0.8, // (the user, 2026-11-05: a softer filter icon, in tune with the edges)
        },
    },

};
