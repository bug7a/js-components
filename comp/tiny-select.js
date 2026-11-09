/* Bismillah */

/*

Tiny Select - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const TinySelectDefaults = {
    titleText: "",
    list: [], // [{ value: "1", label: "(none)" },]
    onChange: function(self) {}, // Another item is chosen: self.selectedIndex, self.getSelectedItem() ({ value, label }). Not at create time; setSelectedIndex(index) calls it, setSelectedIndex(index, 1) does not.
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
    allowHtml: 0, // 1: titleText, emptyText and the labels of the list are HTML (only for your own texts)
    invertIconColor: 0,
    labelBold: 1,
    labelTextColor: "rgba(0,0,0,0.8)",
};

const TinySelect = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, TinySelectDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const DISABLED_OPACITY = 0.6;

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    // *** PUBLIC VARIABLES:

    // To close listBox if opened (when listBox created will also put a function in this)
    box.closeListBox = null;

    /*
        - the list again, and the item of the given index selected

        list: [{ value: "1", label: "(none)" },]
        selectedIndex: 0

        object.setList([{ value: "1", label: "(none)" },], 0);

    */
    box.setList = function(list, selectedIndex = 0) {

        box.list = list;
        box.setSelectedIndex(selectedIndex);

    };

    // Chooses the item at index; an index that is not in the list shows emptyText. silent: 1 -> onChange is not called.
    box.setSelectedIndex = function(index, silent = 0) {

        box.selectedIndex = index;

        // WHY not list.length > index: -1 (getIndexByValue of a value not in the list) passed it and threw.
        const item = box.getSelectedItem();
        if (item) {
            setText(box.lblLabel, item.label);
            if (!silent) box.onChange(box);
        } else {
            setText(box.lblLabel, box.emptyText);
        }

        if (box.closeListBox != null) box.closeListBox();

    };

    // Change the title
    box.setTitleText = function(titleText) {

        box.titleText = titleText;
        setText(box.lblTitle, (box.titleText) ? box.titleText + ":" : "");

    };

    // 0: it can not be opened (a little transparent)
    box.setEnabled = function(value) {

        box.enabled = basic.isOn(value) ? 1 : 0;
        box.clickable = box.enabled;
        box.opacity = (box.enabled) ? 1 : DISABLED_OPACITY;

    };
    // USAGE: tinySelect.setEnabled(0)

    // The chosen item ({ value, label }), or null
    box.getSelectedItem = function() {
        return box.list[box.selectedIndex] || null;
    };
    // USAGE: const item = tinySelect.getSelectedItem();

    box.getIndexByValue = function(value) {
        return box.list.findIndex(item => item.value === value);
    };
    // USAGE: tinySelect.setSelectedIndex(tinySelect.getIndexByValue("tr"))

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
    box.setTitleText(box.titleText);
    // WHY: Silent: onChange is a choice of the user, not the start value (the pages that use it
    //      guarded against this first call with isReady / isRendering).
    box.setSelectedIndex(box.selectedIndex, 1);
    box.setEnabled(box.enabled);

    return endObject(box);

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
                    index: i,
                    spaceX: 6,
                    textColor: connectedUI.listTextColor,
                });
                if (connectedUI.allowHtml == 1) lbl.text = connectedUI.list[i].label;
                else lbl.plainText = connectedUI.list[i].label;
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

    // When the size of the page changes, an open list closes.
    // NOTE: The first two calls are not a page resize: they come from opening the list.
    let resizeCount = 0;

    listBox.onResize(function() {
        if (resizeCount > 1 && connectedUI.closeListBox != null) connectedUI.closeListBox();
        resizeCount++;
    });

    makeBasicObject(listBox);
    return listBox; 

};
