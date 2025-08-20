/* Bismillah */

/*

Tiny Select - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const TinySelectDefaults = {
    title: "",
    list: [], // [{ id: "1", label: "(none)" },]
    onSelect: function(index, id, label, title) {},
    selectedIndex: 0,
    fontSize: 20,
    border: 0,
    color: "transparent", // "whitesmoke"
    round: 3,
    width: "auto",
    height: 50,
    paddingX: 12,
    disabled: 0,
    arrowIcon: "../comp-m2/tiny-select/arrow.svg",
    arrowBorder: 0, // 1
    arrowBorderColor: "rgba(0, 0, 0, 0.2)",
    arrowBackgroundColor: "transparent", // "white"
    arrowRound: 3, // 30
    arrowSize: 24,
    listFontSize: 14,
    listTextColor: "rgba(0, 0, 0, 0.8)",
    listOverTextColor: "indianred",
    listBackgroundColor: "whitesmoke",
    listBorder: 1,
    listBorderColor: "rgba(0, 0, 0, 0.6)",
    emptyText: "Empty",
    invertIconColor: 0,
    labelBoldFont: 1,
    labelTextColor: "rgba(0,0,0,0.8)",
};

/*
const TinySelectDefaultsV2 = {
    listData: [], // [{ id: "1", label: "(none)" },]
    onSelect: function(index, id, label, title) {},
    selectedIndex: 0,
    width: "auto",
    height: 50,
    paddingX: 12,
    disabled: 0,
    backgroundStyle: {
        border: 0,
        color: White(0), // "whitesmoke"
        overColor: White(0),
        round: 3,
    },
    titleStyle: {
        text: "",
        fontSize: 20,
    },
    labelStyle: {
        fontSize: 20,
        useBoldFont: 1,
        textColor: Black(0.8),
    },
    iconStyle: {
        file: "../comp-m2/tiny-select/arrow.svg",
        border: 0,
        color: Black(0.2),
        borderColor: Black(0.2),
        width: 24,
        height: 24,
        round: 3,
        invertColor: 0,
    },
    listBackgroundStyle: {
        color: "whitesmoke",
        border: 1,
        borderColor: Black(0.6),
    },
    listLabelStyle: {
        fontSize: 14,
        textColor: Black(0.8),
        overTextColor: "indianred",
    },
    emptyText: "Empty",
    invertColor: 0,
};
*/

const TinySelect = function(params = {}) {

    saveCurrentThat();

    // BOX: Component container
    const box = startFlexBox();

    // Values ready to use
    box.props(TinySelectDefaults, params);

    // *** PRIVATE VARIABLES:

    // To close listBox if opened (when listBox created will also put a function in this)
    box.closeListBox = null;

    /*
        - listeyi güncelle ve index i verileni seç

        list: [{ id: "1", label: "(none)" },]
        selectedIndex: 0

        object.setList([{ id: "1", label: "(none)" },], 0);

    */
    box.setList = function(list, selectedIndex = 0) {

        box.list = list;
        box.setSelectedIndex(selectedIndex);

    };

    // Seçili olanı değiştir.
    box.setSelectedIndex = function(index) {

        box.selectedIndex = index;

        if (box.list.length > box.selectedIndex) {
            box.lblLabel.text = box.list[box.selectedIndex].label;
            box.onSelect(index, box.list[index].id, box.list[index].label, box.title);
        } else {
            box.lblLabel.text = box.emptyText;
        }

        if (box.closeListBox != null) box.closeListBox();

    };

    // Başlığı değiştir
    box.setTitle = function(title) {

        box.title = title;
        if (box.title) {
            box.lblTitle.text = box.title + ":";
        } else {
            box.lblTitle.text = "";
        }

    };

    // Nesneyi kullanılamaz yap.
    box.setDisabled = function(value) {

        box.disabled = value;
        if (value == 1) {
            box.clickable = 0;
            box.opacity = 0.6;
        } else {
            box.clickable = 1;
            box.opacity = 1;
        }

    };

    box.getIndexById = function(id) {
        return box.list.findIndex(item => item.id === id);
    };

    box.setColor = function(color) {
        box.color = color;
    };
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // *** OBJECT VIEW:
    box.elem.style.whiteSpace = "nowrap";
    box.elem.style.cursor = "pointer";
    box.clickable = 1;

    // LABEL: Title
    box.lblTitle = Label({
        fontSize: box.fontSize,
    });
    that.elem.style.marginLeft = box.paddingX + "px";

    // LABEL: Label
    box.lblLabel = Label({
        fontSize: box.fontSize,
        textColor: box.labelTextColor,
    });
    if (box.labelBoldFont == 1) that.elem.style.fontFamily = "opensans-bold";
    that.elem.style.marginLeft = "6px";
    that.elem.style.marginRight = "4px";

    // ICON: Arrow
    box.icoArrow = Icon({
        width: box.arrowSize,
        height: box.arrowSize,
        color: box.arrowBackgroundColor,
        border: box.arrowBorder,
        borderColor: box.arrowBorderColor,
        round: box.arrowRound,
        space: 0,
    });
    that.load(box.arrowIcon);
    that.setMotion("transform 0.3s");
    that.elem.style.marginTop = "2px";
    that.elem.style.marginRight = box.paddingX + "px";
    if (box.invertIconColor == 1) that.elem.style.filter = "invert(100%)";

    endFlexBox();

    // *** OBJECT INIT CODE:
    box.on("click", function() {
        TinySelect.createList(box);
    });
    box.setTitle(box.title);
    box.setSelectedIndex(box.selectedIndex);
    box.setDisabled(box.disabled);
    
    restoreThatFromSaved();
    makeBasicObject(box);
    return box;

};

// Create a tiny list to user selection
TinySelect.createList = function(connectedUI) {

    if (connectedUI.list.length <= 0) return null;

    connectedUI.icoArrow.rotate = 180;

    connectedUI.closeListBox = function() {
        connectedUI.icoArrow.rotate = 0;
        listBox.remove();
        connectedUI.closeListBox = null;
    };

    const listBox = startFlexBox();
    that.color = "transparent";
    that.elem.style.whiteSpace = "nowrap";
    page.add(that);

        listBox.grp = startFlexBox({
            flexDirection: "column",
            alignItems: "flex-start",
            color: connectedUI.listBackgroundColor,
            width: "auto",
            height: "auto",
            border: connectedUI.listBorder,
            borderColor: connectedUI.listBorderColor,
            round: 3,
        });
        that.elem.style.padding = "5px";
        that.elem.style.cursor = "pointer";
        that.position = "absolute";

            for (let i = 0; i < connectedUI.list.length; i++) {
                const lbl = Label({
                    fontSize: connectedUI.listFontSize,
                    text: connectedUI.list[i].label,
                    index: i,
                    spaceX: 6,
                    textColor: connectedUI.listTextColor,
                });

                if (connectedUI.selectedIndex != lbl.index) {

                    that.on("click", function() {
                        //connectedUI.selectedIndex = lbl.index;
                        //connectedUI.lblLabel.text = lbl.text;
                        //connectedUI.closeListBox();
                        connectedUI.setSelectedIndex(lbl.index);
                    });
                    that.on("mouseover", function() {
                        //lbl.color = "white";
                        lbl.textColor = connectedUI.listOverTextColor; //basic.ACTION_COLOR;
                    });
                    that.on("mouseout", function() {
                        //lbl.color = "whitesmoke";
                        lbl.textColor = connectedUI.listTextColor;
                    });

                } else {
                    lbl.opacity = 0.5;
                }
            }

        endFlexBox();

    listBox.on("click", function() {
        if (connectedUI.closeListBox != null) connectedUI.closeListBox();
    });

    listBox.grp.left = connectedUI.totalLeft + connectedUI.width - listBox.grp.width;
    listBox.grp.top = connectedUI.totalTop + connectedUI.height;

    endFlexBox();

    // Sayfa boyutu değiştiğinde; kutu açık ise otomatik kapat.
    let _resizeCount = 0;

    listBox.onResize(function() {
        if (_resizeCount > 1) {
            if (connectedUI.closeListBox != null) connectedUI.closeListBox();
        }
        _resizeCount++;
    });

    makeBasicObject(listBox);
    return listBox; 

};