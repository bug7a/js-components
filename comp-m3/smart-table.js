/* Bismillah */

/*

SmartTable- v25.07 - "Optimized for big data"

- SmartTable is a JavaScript table component designed to run smoothly even with millions of records. Thanks to its virtual scroll architecture, it only writes the visible rows to the DOM, eliminating memory and performance issues with large datasets. It makes data exploration easy with real-time filtering, multi-column sorting, and both horizontal and vertical scroll support. Custom cell designs can be created for each column via createCustomItemCell, allowing flexible visual content per column. Since column widths, heights, and colors are all configurable through parameters, it can be quickly adapted to different projects.


Started Date: Mar 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/


- filter da bir title seçilebilmeli, default: ALL olsun.
- Eğer itemHeight 20px den küçük ise otomatik itemLineCount düşür ve eğer itemHeight büyükse 100px den itemLineCount arttır.


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
        btnScrollCenter: { color: "white", round: 100, borderColor: "rgba(0,0,0,0.4)", border: 1, },
        btnScrollUp: { color: "lightgray", round: 100, border: 1, },
        btnScrollDown: { color: "lightgray", round: 100, border: 1, },
        boxSort: { color: "#65A293" },

    },
};

const SmartTable = function (params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, SmartTableDefaults);

    // BOX: Component container
    let box = startObject(params);

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

    // *** PUBLIC FUNCTIONS:

    // setView
    box.setState = function (state) {

        box.state = state;

        switch (state) {

            case "normal":
                //box.background.color = box.backgroundStyle.color;
                //box.lblBadget.color = badgetCurrentColor;
                //box.background.border = 1;
                break;

            case "mouseover":
                //box.background.color = box.backgroundStyle.overColor;
                //box.lblBadget.color = "white";
                //box.background.border = 3;
                break;

            case "selected":

                break;

            case "disabled":

                break;

        }
    };

    const refresh = function () {
        // refresh code
    };

    box.refresh = function (time = 3) {

        // NOTE: Check the child objects and make sure their states are appropriate.
        box.refreshTimer = waitAndRun(box.refreshTimer, refresh, 3);

    };

    // box.superRemove = box.remove;
    box.destroy = function () {

        //page.remove_onResize(functionName); // on page resized.

        // Remove basic objects
        //box.background.remove(); // NOTE: If you add event (box.background.on("click") to other objects.
        //box.icon.remove();

        // box.superRemove.call(box);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;

    };

    box.refreshData = function () { // [GOOD]

        const _startIndex = box.startedItemIndexForScrolling;
        const _dataList = box.visibleItemDataList;
        const _titleDataList = box.titleDataList;
        const _titleCount = box.titleCellCount;
        const _lineCount = box.itemLineCount;

        // Sadece ekranda görünen satır sayısı kadar dönüyoruz
        for (let i = 0; i < _lineCount; i++) {

            const _itemLine = box.itemLineList[i];
            const _dataIndex = _startIndex + i;
            const _rowData = _dataList[_dataIndex];

            // Eğer veri varsa satırı güncelle, yoksa temizle/gizle
            if (_rowData) {

                _itemLine.opacity = 1; // Veya opacity: 1
                _itemLine.clickable = 1;

                // DATA IN OBJECT (itemLine)
                _itemLine.itemData = _rowData; // WHY: Line a basıldığında bu bilgi kullanılacak.

                // TODO: If selected itemData == this item data then make colored.

                // Her bir itemCell için;
                for (let j = 0; j < _titleCount; j++) {

                    const titleData = _titleDataList[j];
                    const cell = _itemLine["itemCell" + j];
                    const newValue = _rowData[titleData.dataTitle] ?? "";

                    // Sadece değer değişmişse DOM'a dokun
                    if (cell.label.text !== newValue) { // WHY: eğer !== olmaz ise, ilk yüklenmede 0 değeri yazılmayabiliyor. 0 ile "" aynı sayılıyor.
                        cell.label.text = newValue;
                    }

                    // Özel cell tasarımını güncelle.
                    box.updateCustomItemCell(cell, j, newValue); 

                }

            } else {

                // Veri bitmişse satırı boş göster veya gizle
                _itemLine.opacity = 0;
                _itemLine.clickable = 0;
                
            }
        }

        // Scroll buttonlarını göster/gizle.
        box.setVerticalScrollEnabled((_dataList.length > _lineCount) ? true : false);
        box.updateInfoLabel();

    };

    box.setVerticalScrollEnabled = function (enabled) { // [GOOD]

        // Sadece kullanılabilir durumda ise enabled yapılabilir.
        if (enabled && box.visibleItemDataList.length > box.itemLineCount) {
            // Scroll buttonlarını göster.
            box.btnScrollCenter.opacity = 1;
            box.btnScrollCenter.clickable = 1;
            box.btnScrollUp.opacity = 1;
            box.btnScrollUp.clickable = 1;
            box.btnScrollDown.opacity = 1;
            box.btnScrollDown.clickable = 1;

        } else {
            // Scroll butonlarını gizle.
            box.btnScrollCenter.opacity = 0;
            box.btnScrollCenter.clickable = 0;
            box.btnScrollUp.opacity = 0.5;
            box.btnScrollUp.clickable = 0;
            box.btnScrollDown.opacity = 0.5;
            box.btnScrollDown.clickable = 0;
        }

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

    box.setTitleDataList = function(titleDataList) { // [NOT READY]

        box.titleDataList = [...titleDataList];
        box.createTitleLine();
        // - clean box.itemDataList

    }

    box.createSortIcon = function (titleCell) { // [NOT BAD]

        startBox({
            align: "right center",
            color: box.style.boxSort.color, // "#65A293",
            round: 100,
            border: 0, // 1
            borderColor: "rgba(0,0,0,0.1)",
            width: 22,
            height: 22,
            right: 2,
            padding: [4, 0],
            position: "absolute",
            //top: 15,
        });
        if (titleCell.shortable == 0) that.opacity = 0;
        titleCell.add(that);
        that.center("top");

        titleCell.icon = Icon({
            width: 22,
            height: 22,
            left: 0,
            top: 0,
            opacity: 0.5,
        });
        that.setMotion("opacity 0.3s, transform 0.3s");
        that.load(box.style.sortIconFile);
        if (box.style.invertIconColor == 1) that.elem.style.filter = "invert(100%)";
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
            width: titleData.width || 100,
            padding: box.style.boxTitleCell.padding,
            height: box.titleHeight,
            color: "transparent",
            border: 0,
            position: "relative",
        });
        that.elem.style.borderRight = box.style.boxTitleCell.borderRight;
        that.elem.style.borderBottom = box.style.boxTitleCell.borderBottom;
        that.elem.style.cursor = "pointer";

        // DATA IN OBJECT (titleCell)
        that.titleCellIndex = titleCellIndex;
        that.titleDataTitle = titleData.dataTitle;
        that.shortable = titleData.shortable;

        titleCell.label = Label({
            text: titleData.name,
            ...box.style.lblTitleCell,
        });
        that.elem.style.fontFamily = box.style.lblTitleCell.fontFamily;

        endAutoLayout();

        box.createSortIcon(titleCell);

        titleCell.on("click", function (self, event) {

            if (self.shortable == 1) {

                // Clear All
                box.resetSortIcons(self);
                /*
                box.titleCellList.forEach(function (titleCell, titleCellIndex) {
                    if (titleCellIndex != self.titleCellIndex) {
                        titleCell.icon.rotate = 0;
                        titleCell.icon.opacity = 0.5;
                        titleCell.sortDirection = "";
                    }
                });
                */

                box.sortByTitleIndex = self.titleCellIndex;

                if (self.sortDirection != "A-Z") {
                    box.sortDirection = "A-Z";
                    //titleCell.icon.rotate = 0;

                } else {
                    box.sortDirection = "Z-A";
                    //titleCell.icon.rotate = 180;

                }
                //titleCell.icon.opacity = 1;
                //self.sortDirection = box.sortDirection;
                box.updateSortIcon();
                box.filterAndSortData();

            }

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
        
        if (box.sortDirection == "A-Z") {
            titleCell.sortDirection = "A-Z";
            titleCell.icon.rotate = 0;
        } else {
            titleCell.sortDirection = "Z-A";
            titleCell.icon.rotate = 180;
        }

        titleCell.icon.opacity = 1;

    };

    box.clearColumnHighlight = function (titleCell) {

        if (box.highlightTitle) {
            titleCell.color = "transparent";
            box.itemLineList.forEach(function (itemLine, itemLineIndex) {
                itemLine["itemCell" + titleCell.titleCellIndex].color = "transparent";
            });
        }

    };

    box.applyColumnHighlight = function (titleCell) {

        if (box.highlightTitle) {
            titleCell.color = box.style.highlightTitleCellColor;
            box.itemLineList.forEach(function (itemLine, itemLineIndex) {
                itemLine["itemCell" + titleCell.titleCellIndex].color = box.style.highlightItemCellColor;
            });
        }

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

        // ItemLine
        const itemLine = HGroup({
            height: box.itemHeight || 100,
            width: "auto",
            align: "top left",
            padding: [0, 0],
            gap: 0,
            color: (itemLineIndex % 2) ? box.style.line2Color : box.style.line1Color,
            position: "relative",
            //opacity: 0.5,
            // NOTE: this width, height: "100%" as default.
        });
        //that.itemData = itemData;
        //that.itemLineIndex = itemLineIndex;

        box.titleDataList.forEach(function (titleData, titleDataIndex) {
            // Item Cell
            itemLine["itemCell" + titleDataIndex] = box.createItemCell(titleData.width, titleDataIndex, itemLine);
        });

        endGroup();

        itemLine.on("click", function (self) {
            box.onSelect(self.itemData);
        });

        if (box.style.height != "auto") itemLine.visible = 0; // WHY: Yüksekli yeniden hesaplanması gerekirse, ekranda kırpma yapması için gizli oluşturuluyor.
        return itemLine;

    };

    // Hücre oluştur.
    box.createItemCell = function (cellWidth, titleDataIndex, itemLine) {

        // ItemCell
        let itemCell = AutoLayout({
            align: "center left",
            width: cellWidth || 100,
            padding: box.style.boxItemCell.padding,
            height: "100%",
            color: "transparent",
            border: 0,
        });
        that.elem.style.borderBottom = box.style.boxItemCell.borderBottom;
        that.elem.style.borderRight = box.style.boxItemCell.borderRight;
        that.elem.style.cursor = "pointer";

        itemCell.label = Label({
            text: "",
            ...box.style.lblItemCell,
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.textOverflow = "ellipsis";
        that.elem.style.fontFamily = box.style.lblItemCell.fontFamily;

        endAutoLayout();

        // Highlight vertical
        itemCell.on("mouseover", function (self, event) {
            if (box.highlightLine) {
                for (let i = 0; i < box.titleCellCount; i++) {
                    itemLine["itemCell" + i].color = box.style.highlightItemCellColor;
                }
            }
        });

        // Clean highlight vertical
        itemCell.on("mouseout", function (self, event) {
            if (box.highlightLine) {
                for (let i = 0; i < box.titleCellCount; i++) {
                    itemLine["itemCell" + i].color = "transparent";
                }
            }
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

        const dataLength = box.visibleItemDataList.length;
        const maxScrollIndex = Math.max(0, dataLength - box.itemLineCount);

        if (maxScrollIndex === 0) return;

        const percent = box.startedItemIndexForScrolling / maxScrollIndex;
        box.btnScrollCenter.top = box.scrollVars.minY + (percent * box.scrollVars.totalPath);

    };

    box.createScrollEvents = function () {

        // Sürükleme ayarları
        box.btnScrollCenter.clickable = 1;
        box.btnScrollCenter.elem.setAttribute("draggable", "false");
        box.btnScrollCenter.elem.style.cursor = "grab";

        // Değişkenler
        box.initScrollMetrics();

        // 1. MOUSE WHEEL DESTEĞİ (Her kaydı görmeyi sağlar)
        box.on("wheel", function (self, event) {

            // ÖNEMLİ: Eğer yatayda bir hareket varsa (deltaX), 
            // dikey scroll kodunu çalıştırma ve tarayıcının yatay kaydırmasına izin ver.
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
                return; // Fonksiyondan çık, preventDefault çalışma-sın.
            }

            // Sadece dikey hareket baskınsa dikey scrollu yönet ve sayfa kaymasını engelle
            event.preventDefault();

            const dataLength = box.visibleItemDataList.length;
            const maxScrollIndex = Math.max(0, dataLength - box.itemLineCount);

            // Tekerlek yönüne göre 1'er 1'er veya 3'er 3'er kaydır
            const step = event.deltaY > 0 ? 1 : -1;
            let newIndex = box.startedItemIndexForScrolling + step;

            if (newIndex < 0) newIndex = 0;
            if (newIndex > maxScrollIndex) newIndex = maxScrollIndex;

            if (newIndex !== box.startedItemIndexForScrolling) {
                box.startedItemIndexForScrolling = newIndex;
                box.syncScrollPosition(); // İkonu yeni indekse taşı
                box.refreshData();

            }
        }, { passive: false });

        // 2. MOUSE DRAG (Sürükleme)
        box.btnScrollCenter.on("mousedown", function (self, event) {

            box.scrollVars.isDragging = true;
            box.scrollVars.startY = event.clientY;
            box.scrollVars.startTop = box.btnScrollCenter.top;
            box.btnScrollCenter.elem.style.cursor = "grabbing";
            document.body.style.userSelect = "none";

        });

        window.addEventListener("mousemove", function (event) {

            if (!box.scrollVars.isDragging) return;

            const diffY = event.clientY - box.scrollVars.startY;
            let newTop = box.scrollVars.startTop + diffY;

            if (newTop < box.scrollVars.minY) newTop = box.scrollVars.minY;
            if (newTop > box.scrollVars.maxY) newTop = box.scrollVars.maxY;

            box.btnScrollCenter.top = newTop;

            const currentProgress = (newTop - box.scrollVars.minY) / box.scrollVars.totalPath;
            const dataLength = box.visibleItemDataList.length;
            const maxScrollIndex = Math.max(0, dataLength - box.itemLineCount);

            const newIndex = Math.round(currentProgress * maxScrollIndex);

            if (newIndex !== box.startedItemIndexForScrolling) {
                box.startedItemIndexForScrolling = newIndex;
                box.refreshData();
            }

        });

        window.addEventListener("mouseup", function () {

            if (box.scrollVars.isDragging) {
                box.scrollVars.isDragging = false;
                box.btnScrollCenter.elem.style.cursor = "grab";
                document.body.style.userSelect = "auto";
            }

        });

    };

    box.scrollPage = function (direction) { // +1 ise aşağı (bir sayfa boyu), -1 ise yukarı

        const dataLength = box.visibleItemDataList.length;
        const maxScrollIndex = Math.max(0, dataLength - box.itemLineCount);

        // Yön +1 ise aşağı (bir sayfa boyu), -1 ise yukarı
        let newIndex = box.startedItemIndexForScrolling + (direction * box.itemLineCount);

        // Sınırları kontrol et
        if (newIndex < 0) newIndex = 0;
        if (newIndex > maxScrollIndex) newIndex = maxScrollIndex;

        // Eğer indeks değiştiyse güncelle
        if (newIndex !== box.startedItemIndexForScrolling) {
            box.startedItemIndexForScrolling = newIndex;

            // 1. Veriyi tazele
            box.refreshData();
            // 2. Scroll ikonunun yerini güncelle (Görsel senkronizasyon)
            box.syncScrollPosition();
        }
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
        const format = (num) => num.toLocaleString('tr-TR');

        box.boxInfoLine.label.text = `${format(start)} - ${format(end)} / ${format(totalData)}`;

    };

    box.setScrollToTop = function () {
        box.startedItemIndexForScrolling = 0;
        box.btnScrollCenter.top = box.scrollVars.minY;
    };

    box.setItemDataList = function (itemDataList) {
        box.itemDataList = [...itemDataList];
        box.filterAndSortData();
    };

    box.filterAndSortData = function () {

        if (box.itemDataList.length > 1000) box.showLoading(1);

        setTimeout(function () {

            const searchKeyword = box.searchKeyword.toLowerCase().trim();
            const sortByTitleIndex = box.sortByTitleIndex;
            const sortDirection = box.sortDirection; // "A-Z" or "Z-A"

            // 1. ADIM: FİLTRELEME (SEARCH)
            let filteredList = [...box.itemDataList];

            if (searchKeyword !== "") {
                filteredList = filteredList.filter(item => {
                    // Satırdaki tüm sütunlarda ara (veya sadece belirli başlıklarda)
                    return box.titleDataList.some(title => {
                        const val = item[title.dataTitle];
                        return val ? String(val).toLowerCase().includes(searchKeyword) : false;
                    });
                });
            }

            // 2. ADIM: SIRALAMA (SORTING)
            const titleData = box.titleDataList[sortByTitleIndex];
            if (titleData && titleData.shortable !== 0) {
                const key = titleData.dataTitle;

                filteredList.sort((a, b) => {
                    let valA = a[key] ?? "";
                    let valB = b[key] ?? "";

                    // Eğer sayısal veriyse ona göre karşılaştır
                    const isNumeric = !isNaN(valA) && !isNaN(valB) && typeof valA !== "boolean";

                    let comparison = 0;
                    if (isNumeric) {
                        comparison = parseFloat(valA) - parseFloat(valB);
                    } else {
                        comparison = String(valA).localeCompare(String(valB), 'tr');
                    }

                    return sortDirection === "A-Z" ? comparison : -comparison;
                });
            }

            // 3. ADIM: SONUCU YAZ VE RESETLE
            box.visibleItemDataList = filteredList;

            box.setScrollToTop();
            box.refreshData();
            //box.updateInfoLabel(); // Toplam sayı değiştiği için bilgiyi tazele

            box.showLoading(0);

        }, 50);

    };

    box.generateTestData = function () {

        // Test için veriyi 1000 katına çıkaralım:
        const repeatCount = 100000;
        let bigData = [];

        for (let i = 0; i < repeatCount; i++) {
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

        box.btnScrollCenter = startBox(0, 0, scrollWidth, 50, {
            right: scrollRight,
            top: box.titleHeight,
            opacity: 0,
            clickable: 0,
            ...box.style.btnScrollCenter,
        });

        Icon(0, 0, "100%", "100%");
        that.load(box.style.btnScrollCenterIconFile);
        //if (box.style.invertIconColor == 1) that.elem.style.filter = "invert(100%)";

        endBox();

        box.btnScrollUp = Box(0, 0, scrollWidth, box.titleHeight, {
            right: scrollRight,
            ...box.style.btnScrollUp,
        });
        that.elem.style.cursor = "pointer";
        that.on("click", function (self, event) {
            box.scrollPage(-1);
        });

        Icon(0, 0, "100%", "100%");
        box.btnScrollUp.add(that);
        that.load(box.style.btnScrollUpIconFile);
        if (box.style.invertIconColor == 1) that.elem.style.filter = "invert(100%)";

        box.btnScrollDown = Box(0, 0, scrollWidth, box.infoHeight, {
            right: scrollRight,
            bottom: 0,
            ...box.style.btnScrollDown,
        });
        that.elem.style.cursor = "pointer";
        that.on("click", function (self, event) {
            box.scrollPage(1);
        });

        Icon(0, 0, "100%", "100%");
        box.btnScrollDown.add(that);
        that.load(box.style.btnScrollDownIconFile);
        if (box.style.invertIconColor == 1) that.elem.style.filter = "invert(100%)";

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
        })

        endGroup();

        // Center the label
        HGroup({
            align: "right center",
            width: "50%",
            padding: [40, 0],
        });
        box.boxInfoLine.add(that);

        box.lblSelectedSortKey = Label({
            text: "ALL",
            opacity: 1,
            clickable: 1,
            ...box.style.lblNoDataFound,
        });
        that.elem.style.cursor = "pointer";
        that.setMotion("opacity 0.2s")

        endGroup();

    };

    box.stretchLastCell = function (width) {

        if (width > 0) {
            const _itemCellIndex = box.titleCellCount - 1;

            box.itemLineList.forEach(function (itemLine, itemLineIndex) {
                itemLine["itemCell" + _itemCellIndex].width = width;
            });

            box.titleCellList[_itemCellIndex].width = width;
        }

    };

    box.calcLastCellWidth = function () {

        let totalWidth = 0;
        let newLastCellWidth = 0;

        const titleDataList = box.titleDataList;
        const originalWidth = box.width;

        titleDataList.forEach(function (titleData, titleDataIndex) {
            totalWidth += num(titleData.width);
        });

        if (originalWidth > totalWidth) {
            newLastCellWidth = originalWidth - totalWidth + num(titleDataList[titleDataList.length - 1].width);
        }

        return newLastCellWidth;

    };

    box.setItemHeight = function (itemHeight) {

        box.itemHeight = itemHeight;

        box.itemLineList.forEach(function (itemLine, itemLineIndex) {
            itemLine.height = box.itemHeight;
            itemLine.visible = 1; // WHY: Yükseklik hesaplandıktan sonra göster.
        });

    };

    box.setHeight = function (height) {

        // Yükseklik otomatik değil ise, ItemCell yüksekliğini otomatik hesapla.
        if (height != "auto") {
            box.recalcItemHeight = 1;
        } else {
            box.recalcItemHeight = 0;
        }

        // Item yüksekliği otomatik hesaplanacak.
        if (box.recalcItemHeight) {
            //box.itemHeight = (box.height - box.titleHeight - box.infoHeight) / box.itemLineCount;
        }

        box.height = height;

    };

    box.setWidth = function (width) {

        // Eğer genişlik tam olacak ise, scroll için boş alan ekle.
        //if (width == "100%") {
        if (width.includes("%")) {
            box.width = "calc(" + width + " - " + (box.style.verticalScrollWidth + box.style.verticalScrollMargin) + "px)";
        } else {
            box.width = width;
        }

    };

    box.getTotalWidth = function () {
        return box.width + box.style.verticalScrollWidth + box.style.verticalScrollMargin;
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
            width: 32,
            height: 32,
        });
        that.load("../comp-m3/smart-table/clock.png");

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
        that.setMotion("opacity 0.2s")

        endGroup();

    };

    box.selectKeyForSearch = function() {



    };

    box.createResizeEvent = function () {

        const _resizeUI = function () {

            // Item yüksekliği otomatik hesaplanacak.
            if (box.recalcItemHeight) {

                const itemHeight = (box.height - box.titleHeight - box.infoHeight) / box.itemLineCount;

                if (box.itemHeight != itemHeight) {
                    box.setItemHeight(itemHeight);
                }

            }

            box.stretchLastCell(box.calcLastCellWidth());
            box.initScrollMetrics();
            box.syncScrollPosition();
            box.scrollBar.refreshScroll(); // Ekranı daraltırken, scroll gereksiz görünmesin diye.

            box.refreshData();
            //box.showScrollTimer = waitAndRun(box.showScrollTimer,  box.showScrollX, 300);

        };

        /*
        box.showScrollTimer = null;
        box.showScrollX = function() {
            box.scrollBar.opacity = 1;
        }
        */

        box.onResize(function (self) {

            //box.scrollBar.opacity = 0;

            // Item yüksekliği otomatik hesaplanacak.
            box.resizeTimer = waitAndRun(box.resizeTimer, _resizeUI, 3);

        });

    };

    // *** OBJECT VIEW:
    box.init = function () {

        box.clickable = 1;
        // Show outside of the box.
        box.clipContent = 0;
        box.color = box.style.box.color;
        box.round = box.style.round;
        if (box.invertColor == 1) box.elem.style.filter = "invert(100%)";
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
        that.elem.style.borderTopLeftRadius = box.style.round + "px";     // Üst Sol Köşe
        that.elem.style.borderTopRightRadius = box.style.round + "px";    // Üst Sağ Köşe
        that.elem.style.borderBottomRightRadius = "0px"; // Alt Sağ Köşe
        that.elem.style.borderBottomLeftRadius = "0px";   // Alt Sol Köşe
        that.elem.style.marginBottom = box.infoHeight + "px";

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
        }); endGroup();
        that.elem.style.borderTopLeftRadius = "0px";     // Üst Sol Köşe
        that.elem.style.borderTopRightRadius = "0px";    // Üst Sağ Köşe
        that.elem.style.borderBottomRightRadius = box.style.round + "px"; // Alt Sağ Köşe
        that.elem.style.borderBottomLeftRadius = box.style.round + "px";   // Alt Sol Köşe
        that.elem.style.borderTop = box.style.boxInfoLine.borderTop;
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
    box.filterAndSortData();

    if (box.fillTestData) box.generateTestData(); // Add test data WHY: En sonda olmazsa, kayıtlar önce düz yükleniyor, sonra sort a göre yeniden sıralanıyor.

    return endObject(box);

};