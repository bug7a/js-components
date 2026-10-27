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
    onSelect: function(index, id, label, title) {}, // Not called at create time. setSelectedIndex(index) calls it, setSelectedIndex(index, 1) does not.
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

const TinySelect = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, TinySelectDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const DISABLED_OPACITY = 0.6;

    // *** PUBLIC VARIABLES:

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

    // Seçili olanı değiştir. silent: 1 -> onSelect is not called.
    box.setSelectedIndex = function(index, silent = 0) {

        box.selectedIndex = index;

        if (box.list.length > box.selectedIndex) {
            box.lblLabel.text = box.list[box.selectedIndex].label;
            if (!silent) box.onSelect(index, box.list[index].id, box.list[index].label, box.title);
        } else {
            box.lblLabel.text = box.emptyText;
        }

        if (box.closeListBox != null) box.closeListBox();

    };

    // Başlığı değiştir
    box.setTitle = function(title) {

        box.title = title;
        box.lblTitle.text = (box.title) ? box.title + ":" : "";

    };

    // Nesneyi kullanılamaz yap.
    box.setDisabled = function(value) {

        box.disabled = value;
        const isDisabled = (value == 1);
        box.clickable = (isDisabled) ? 0 : 1;
        box.opacity = (isDisabled) ? DISABLED_OPACITY : 1;

    };

    box.getIndexById = function(id) {
        return box.list.findIndex(item => item.id === id);
    };

    box.setColor = function(color) {
        box.color = color;
    };
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // *** OBJECT VIEW:
    box.css.whiteSpace = "nowrap";
    box.cursor = "pointer";
    box.clickable = 1;

    // GROUP: title, label, arrow
    // WHY: A box with width "auto" does not grow with its children; a relative group inside it does (as CheckBox).
    box.contentBox = HGroup({
        width: "auto",
        height: "100%",
        position: "relative",
    });

    // LABEL: Title
    box.lblTitle = Label({
        fontSize: box.fontSize,
    });
    that.css.marginLeft = box.paddingX + "px";

    // LABEL: Label
    box.lblLabel = Label({
        fontSize: box.fontSize,
        textColor: box.labelTextColor,
    });
    if (box.labelBoldFont == 1) that.css.fontFamily = "opensans-bold";
    that.css = { marginLeft: "6px", marginRight: "4px" };

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
    that.css = { marginTop: "2px", marginRight: box.paddingX + "px" };
    if (box.invertIconColor == 1) that.css.filter = "invert(100%)";

    endGroup();

    // WHY: The open list is on the page (TinySelect.createList). A remove() while it was open left it there.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    let isRemoved = 0;
    box.remove = function() {
        if (isRemoved) return;
        isRemoved = 1;
        if (box.closeListBox) box.closeListBox();
        superRemove.call(box);
    };

    // *** OBJECT INIT CODE:
    box.on("click", function() {
        TinySelect.createList(box);
    });
    box.setTitle(box.title);
    // WHY: Silent: onSelect is a choice of the user, not the start value (2026-10-26; the pages that use it
    //      guarded against this first call with isReady / isRendering).
    box.setSelectedIndex(box.selectedIndex, 1);
    box.setDisabled(box.disabled);

    return endObject(box);

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
    that.css.whiteSpace = "nowrap";
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
        that.css.padding = "5px";
        that.cursor = "pointer";
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
                        connectedUI.setSelectedIndex(lbl.index);
                    });
                    that.on("mouseover", function() {
                        lbl.textColor = connectedUI.listOverTextColor;
                    });
                    that.on("mouseout", function() {
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

    // WHY: totalLeft/totalTop do not count the scroll of parent boxes. In a scrolled page, the list was opened at a wrong place.
    const rect = connectedUI.elem.getBoundingClientRect();
    listBox.grp.left = withPageZoom(rect.right) - listBox.grp.width;
    listBox.grp.top = withPageZoom(rect.bottom);

    endFlexBox();

    // Sayfa boyutu değiştiğinde; kutu açık ise otomatik kapat.
    // NOTE: The first two calls are not a page resize: they come from opening the list.
    let resizeCount = 0;

    listBox.onResize(function() {
        if (resizeCount > 1 && connectedUI.closeListBox != null) connectedUI.closeListBox();
        resizeCount++;
    });

    makeBasicObject(listBox);
    return listBox; 

};