/* Bismillah */

/*

Select Item - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: April 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/

EXAMPLE: {javascript-mobile-app-template}/comp-name.htm

*/

"use strict";
const SelectItem = function(params = {}) {

    // BOX: Component container
    const box = startBox();

    const defaults = {
        box: "container",
        width: 350, //350
        height: 94,
        mainBorder: 1,
        mainBorderColor: "rgba(0, 0, 0, 0.3)", // "rgba(0, 0, 0, 0.4)"
        round: 4,
        color: "whitesmoke", //whitesmoke
        selectedIndex: -1,
        itemDataList: [],
        onSelect: function() {},
        Item: function() {},
        darkMode: 0, // Dont use it is not ready yet.
        buttonIconFile: "../comp-m1/select-item/expand.svg",
        selection_Item: null,
        selection_fullScreen: 0, // 0: Aşağıya doğru, 1: Yukarıdan aşağıya tam ekran
        selection_backgroundColor: "whitesmoke",
        selection_showMain: 0, // Seçme bölümü açıldığında, ana bölüm hala görünmeye devam eder.
        selection_cancelButtonVisible: 0,
        selection_cancelButtonColor: "#FFFCD6",
        selection_cancelButtonText: "CANCEL",
        selection_cancelButtonHeight: 50,
        search_visible: 1,
        search_autoFocus: 1, // Mobil de kapatılmaz ise, otomatik klavye çıkar.
        search_placeHolder: "Search",
        search_backgroundColor: "#FFFCD6", // "#FFFCD6", "#D3CFC1"
        search_searchIconFile: "../comp-m1/search-input/search.svg",
        search_clearIconFile: "../comp-m1/search-input/clear.svg",
    };

    box.props(defaults, params);
    //const box = startObject(defaults, params);

    // *** Private variables:
    let privateVar = "";

    // *** Public variables:
    box.publicVar = "";
    box.realTop = 0; // En üste olan uzaklık
    box.realLeft = 0; // En sola olan uzaklık

    // *** Private functions:
    const privateFunc = () => {};

    // Nesnenin ekran sınırlarına göre left ini hesaplar.
    const updateRealLeft = function() {

        const _firstDiv = box.elem;

        let _left = 0;
        let _currentDiv = _firstDiv;

        while (_currentDiv.offsetParent) {
            _left += _currentDiv.offsetLeft;
            _currentDiv = _currentDiv.offsetParent;
        }

        box.realLeft = _left;
        return _left;

    };

    // Nesnenin ekran sınırına göre top unu hesaplar.
    const updateRealTop = function() {

        const firstDiv = box.elem;

        let top = 0;
        let currentDiv = firstDiv;

        while (currentDiv.offsetParent) {
            top += currentDiv.offsetTop;
            currentDiv = currentDiv.offsetParent;
        }

        box.realTop = top;
        return top;
        
    };

    const resized = function() {
        //console.log("resized trigged");
        if (box.itemSelectList) {
            //box.itemSelectList.refreshSizeAndPosition();
            box.itemSelectList.visible = 0; // WHY: Ekran boyutu değişiyor ise animasyonsun hemen gizle.
            box.itemSelectList.close();
        }
    };

    // *** Public functions:
    box.publicFunc = () => {};

    box.setSelectedIndex = function(index) {

        // Seçimi kaldır.
        if (index == -1) {

        // Eğer dataList te seçimin karşılığı var ise.
        } else if (index < box.itemDataList.length) {

            box.selectedIndex = index;
            
            box.boxItem.html = "";
            box.Item(box.itemDataList[box.selectedIndex]);
            box.boxItem.add(that);
            box.setHeight(that.height);
            that.left = 0;
            that.top = 0;

            box.onSelect(index);

        }
    };

    box.openSelectItemList = function() {

        if (box.itemSelectList) {
            box.itemSelectList.close();
        }

        updateRealTop();
        updateRealLeft();

        box.itemSelectList = SelectItem.SelectItemList(box);
        
    };

    box.setItem = function(Item) {
        box.Item = Item;
        //box.setHeight();
    };

    box.setHeight = function(value) {
        box.height = value;
        box.icoDown.center("top");
    };

    box.setMainBorder = function(value) {
        box.mainBorder = value;
        box.boxBorder.border = value;
    };

    box.setMainBorderColor = function(value) {
        box.mainBorderColor = value;
        box.boxBorder.borderColor = value;
    };

    box.setRound = function(value) {
        box.round = value;
        box.boxBorder.round = value;
    };

    box.setDarkMode = function(value) {
        box.darkMode = value;
        if (box.darkMode == 1) {
            box.elem.style.filter = "invert(100%)";
        }
    };

    // Nesneyi, eventleri ile birlikte siler.
    box.removeAll = function() {
        page.remove_onResize(resized);
        box.remove();
    };

    // Set a param after created.
    box.setColor = function(color) {
        box.color = color;
    };
    // USAGE: get: componentName.color, set: componentName.setColor("red")

        // *** OBJECT TEMPLATE:
        box.setMotion("opacity 0.2s");

        // BOX: Item container.
        box.boxItem = Box(0, 0, "100%", "100%", {
            color: "transparent",
        });

        // BOX: Border
        box.boxBorder = Box(0, 0, "100%", "100%", {
            color: "transparent",
        });

        // ICON: Down button
        box.icoDown = Icon({
            right: 4,
            bottom: 0,
            width: 20,
            height: 20,
            opacity: 0.8,
        });
        that.load(box.buttonIconFile);

    endBox();

    // *** OBJECT INIT CODE:
    updateRealTop();
    updateRealLeft();
    box.onClick(box.openSelectItemList);
    box.setItem(box.Item);
    box.setMainBorder(box.mainBorder);
    box.setMainBorderColor(box.mainBorderColor);
    box.setRound(box.round);
    box.setHeight(box.height);
    box.setDarkMode(box.darkMode);
    box.setSelectedIndex(box.selectedIndex);

    // TODO: Bu nesne silindiğinde onResize çalışmaya devam eder. Buna bir çözüm bulunmalı.
    page.onResize(resized);
    
    //endObject(box);
    makeBasicObject(box);
    return box;

};

// *** SELECT ITEM LIST
SelectItem.SelectItemList = function(box) {

    const cover = startBox(0, 0, "100%", "100%", {
        clickable: 1,
        color: "transparent",
        //color: "rgba(0, 0, 0, 0.2)",
    });
    if (box.darkMode == 1) {
        cover.elem.style.filter = "invert(100%)";
    }
    cover.itemHeight = box.height;

    cover.closeButton = Box(0, 0, "100%", "100%", {
        color: "transparent",
    });
    cover.add(that);
    that.onClick(function() {
        cover.close();
    });

    cover.close = function() {
        container.dontMotion();
        container.opacity = 1;
        container.elem.style.transform = "scale(1)";
        container.withMotion(function(self) {
            self.opacity = 0;
            self.elem.style.transform = "scale(0.9)";
        });
        setTimeout(function() {
            cover.remove();
        }, 250);
    };

    cover.refreshSizeAndPosition = function(shownItemCount) {

        let _height = "100%";
        let _top = 0;

        let _availableHeight = page.height - box.realTop; // - cover.itemHeight;
        if (box.selection_showMain == 1) {
            _availableHeight -= cover.itemHeight;
        }
        let _neededHeight = cover.itemHeight * box.itemDataList.length;
        // Eğer arama ile görünen item azalmış ise; o sayıya göre listenin yuksekliğini ayarla.
        if (shownItemCount > 0) {
            _neededHeight = cover.itemHeight * shownItemCount;
        } else if (shownItemCount == 0) {
            _neededHeight = 0;
        }
        _neededHeight += (box.search_visible == 1) ? container.searchInput.height : 0;
        _neededHeight += (box.selection_cancelButtonVisible == 1) ? box.selection_cancelButtonHeight : 0;

        // Liste yüksekliği, ana nesnenin yüksekliğinden az olamaz. Yoksa arkada ana nesne görünür.
        if (_neededHeight < cover.itemHeight) {
            _neededHeight = cover.itemHeight;
        }
        // TODO: Eğer searchBox var ise;  _neededHeight e onun yüksekliğini ekle.

        if (box.selection_fullScreen == 0) {
            _top = box.realTop; // + cover.itemHeight;
            if (box.selection_showMain == 1) {
                _top += cover.itemHeight;
            }
            if (_availableHeight > _neededHeight) {
                _height = _neededHeight;
            } else {
                _height = _availableHeight;
            }
        }

        container.left = box.realLeft;
        container.top = _top;
        container.height = _height;
        container.width = box.width;

    }

        const container = startBox({
            color: "whitesmoke",
            border: 0,
            round: 4,
        });
        container.setMotion("opacity 0.2s, transform 0.2s");
        cover.add(container);
        container.opacity = 0;
        container.elem.style.transform = "scale(0.9)";
        container.clickable = 1;
        container.onClick(function() {

        });

            if(box.search_visible == 1) {
                container.searchInput = SearchInput({
                    width: "100%",
                    height: 40,
                    color: box.search_backgroundColor,
                    round: 2,
                    fontSize: 18,
                    searchIconSize: 22,
                    placeholderText: box.search_placeHolder,
                    darkMode: box.darkMode,
                    searchIconFile: box.search_searchIconFile,
                    clearIconFile: box.search_clearIconFile,
                });
                if (box.search_autoFocus == 1) {
                    container.searchInput.focus();
                }
            }

            let moreHeight = 0;

            if (box.search_visible == 1) moreHeight += container.searchInput.height;
            if (box.selection_cancelButtonVisible == 1) moreHeight += 40;

            const uiItemListHeight = "calc(100% - " + moreHeight + "px)";

            // ITEM LIST:  
            container.uiItemList = ItemList({ 
                width: "100%", 
                height: uiItemListHeight, 
                darkMode: box.darkMode, 
            });
            container.uiItemList.top = (box.search_visible == 1) ? container.searchInput.height : 0;
            container.uiItemList.left = 0;
            container.uiItemList.setItemAlignment(ItemList.alignType.VERTICAL);
            container.uiItemList.setItemCreationFunction((box.selection_Item) ? box.selection_Item : box.Item);
            container.uiItemList.createItemsByDataList(box.itemDataList);

            //container.uiItemList.scrollX = 1;
            //container.uiItemList.scrollY = 1;

            /*
            ScrollBar({
                scrollableBox: container.uiItemList,
                //bar_border: 1,
                //bar_color: "indianred",
            });
            */
            
            // WHY: selection_Item farklı yükseklikte olabilir. Kullanılan yüksekliği güncelle.
            if (box.itemDataList.length > 0) {
                cover.itemHeight = container.uiItemList.getItemList()[0].height;
            }

            container.uiItemList.onSelectionChange(function(ui, self, lastSelectedItem, event) {

                if (lastSelectedItem) {
                    lastSelectedItem.opacity = 1;
                    lastSelectedItem.clickable = 1;
                    ui.removeItemFromSelectedList(lastSelectedItem);
                }
                
                if (self) {
                    self.opacity = 0.5;
                    self.clickable = 0;
                    ui.addItemToSelectedList(self);
                }
                
                if (event) {
                    box.setSelectedIndex(self.getIndex());
                    cover.close();
                }

            });
            container.uiItemList.selectItemByIndex(box.selectedIndex);

            if (box.search_visible == 1) {
                container.searchInput.onSearch = function(searchedText) {
                    const shownItemCount = container.uiItemList.searchItemByText(searchedText);
                    cover.refreshSizeAndPosition(shownItemCount);
                }
            }

            // LABEL: Cancel button
            if(box.selection_cancelButtonVisible) {
                container.btnCancel = Button({
                    color: box.selection_cancelButtonColor,
                    text: box.selection_cancelButtonText,
                    left: 0,
                    bottom: 0,
                    height: 40,
                    width: "100%",
                    minimal: 1,
                    border: 1,
                    borderColor: box.mainBorderColor,
                    fontSize: 16,
                    round: box.round,
                });
                that.onClick(function() {
                    cover.close();
                });
            }

            // BOX: Border
            container.boxBorder = Box(0, 0, "100%", "100%", {
                color: "transparent",
                round: container.round,
            });
            container.boxBorder.elem.style.borderLeft = "1px solid " + box.mainBorderColor;
            container.boxBorder.elem.style.borderRight = "1px solid " + box.mainBorderColor;
            if (box.selection_fullScreen == 0) {
                container.boxBorder.elem.style.borderTop = "1px solid " + box.mainBorderColor;
                container.boxBorder.elem.style.borderBottom = "1px solid " + box.mainBorderColor;
            }

        endBox();

    endBox();

    cover.refreshSizeAndPosition();
    container.withMotion(function(self) {
        self.opacity = 1;
        self.elem.style.transform = "scale(1)";
    });

    makeBasicObject(cover)
    return cover;

};