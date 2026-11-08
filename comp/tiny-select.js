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
    titleText: "",
    list: [], // [{ id: "1", label: "(none)" },]
    onChange: function(self) {}, // Another item is chosen: self.selectedIndex, self.getSelectedItem() ({ id, label }). Not at create time; setSelectedIndex(index) calls it, setSelectedIndex(index, 1) does not.
    selectedIndex: 0,
    fontSize: 20,
    border: 0,
    color: "transparent", // "whitesmoke"
    round: 3,
    width: "auto",
    height: 50,
    paddingX: 12,
    enabled: 1, // 0: it can not be opened, a little transparent (setEnabled)
    arrowIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#141414"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>'),
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
    labelBold: 1,
    labelTextColor: "rgba(0,0,0,0.8)",
};

const TinySelect = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, TinySelectDefaults);

    // BOX: Component container
    const box = startObject(params);
    basic.keepOldNames(box, TinySelect.OLD_NAMES, "TinySelect"); // the pages made with the old names, for a while

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

    // Chooses the item at index. silent: 1 -> onChange is not called.
    box.setSelectedIndex = function(index, silent = 0) {

        box.selectedIndex = index;

        if (box.list.length > box.selectedIndex) {
            box.lblLabel.text = box.list[box.selectedIndex].label;
            if (!silent) box.onChange(box);
        } else {
            box.lblLabel.text = box.emptyText;
        }

        if (box.closeListBox != null) box.closeListBox();

    };

    // Başlığı değiştir
    box.setTitle = function(titleText) {

        box.titleText = titleText;
        box.lblTitle.text = (box.titleText) ? box.titleText + ":" : "";

    };

    // 0: it can not be opened (a little transparent)
    box.setEnabled = function(value) {

        box.enabled = basic.isOn(value) ? 1 : 0;
        box.clickable = box.enabled;
        box.opacity = (box.enabled) ? 1 : DISABLED_OPACITY;

    };
    // USAGE: tinySelect.setEnabled(0)

    // THE OLD NAME, for a while: setDisabled(1) is setEnabled(0)
    box.setDisabled = function(value) {
        box.setEnabled(basic.isOn(value) ? 0 : 1);
    };

    // The chosen item ({ id, label }), or null
    box.getSelectedItem = function() {
        return box.list[box.selectedIndex] || null;
    };
    // USAGE: const item = tinySelect.getSelectedItem();

    box.getIndexById = function(id) {
        return box.list.findIndex(item => item.id === id);
    };

    box.setColor = function(color) {
        box.color = color;
    };
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // *** OBJECT VIEW:
    // WHY: In a row (the protocol of UrlField), a box shrinks for its "100%" neighbour and cut "https://www.".
    //      A flex group does not shrink (flexShrink 0): the same here.
    box.shrink = 0;
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
    if (box.labelBold == 1) that.css.fontFamily = "opensans-bold";
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
    that.load(box.arrowIconFile);
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
    box.setTitle(box.titleText);
    // WHY: Silent: onChange is a choice of the user, not the start value (the pages that use it
    //      guarded against this first call with isReady / isRendering).
    box.setSelectedIndex(box.selectedIndex, 1);
    box.setEnabled(box.enabled);

    return endObject(box);

};

// THE OLD NAMES of the params, the properties and the methods (basic.keepOldNames): the pages made with them keep
// working until they move to the new names. Delete a name when no page uses it any more.
TinySelect.OLD_NAMES = {
    title: "titleText",
    arrowIcon: "arrowIconFile",
    labelBoldFont: "labelBold",
    // WHY wrap: disabled is the reverse of enabled
    disabled: { name: "enabled", wrap: (disabled) => basic.isOn(disabled) ? 0 : 1 },
    // WHY wrap: onSelect got the index, the id, the label and the title; onChange gets self
    onSelect: { name: "onChange", wrap: (onSelect) => (self) => {
        const item = self.getSelectedItem() || {};
        if (onSelect) onSelect(self.selectedIndex, item.id, item.label, self.titleText);
    } },
};
// The old method it keeps by itself (the reverse of setEnabled): for test/old-names.js and the reader
TinySelect.OLD_NAMES_BY_HAND = {
    setDisabled: "setEnabled",
};

TinySelect.Z_INDEX = 1000; // the list on page; over a Dialog or a SidePanel that holds the field (basic.zIndexAbove)
TinySelect.PAGE_MARGIN = 8; // px: the list stays this far from the top and the bottom of the page
TinySelect.MIN_LIST_HEIGHT = 80; // px: the list is not made shorter than this to fit the page (it scrolls)

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
    listBox.zIndex = basic.zIndexAbove(connectedUI, TinySelect.Z_INDEX); // WHY: it had none: under a Dialog or a SidePanel

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
                lbl.elem.style.flexShrink = "0"; // WHY: in a list made shorter to fit the page, the items scroll, not shrink

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
    const fieldTop = withPageZoom(rect.top);
    const fieldBottom = withPageZoom(rect.bottom);
    // WHY the room: the list was always under the field, with no limit: near the bottom of the page (it never scrolls)
    //     its items were below the page and could not be chosen
    const listHeight = listBox.grp.height;
    const roomBelow = page.height - fieldBottom - TinySelect.PAGE_MARGIN;
    const roomAbove = fieldTop - TinySelect.PAGE_MARGIN;
    const isAbove = (listHeight > roomBelow && roomAbove > roomBelow);
    const room = Math.max(TinySelect.MIN_LIST_HEIGHT, isAbove ? roomAbove : roomBelow);
    if (listHeight > room) {
        listBox.grp.height = room;
        listBox.grp.scrollY = 1;
    }
    listBox.grp.left = withPageZoom(rect.right) - listBox.grp.width;
    listBox.grp.top = isAbove ? fieldTop - Math.min(listHeight, room) : fieldBottom;

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