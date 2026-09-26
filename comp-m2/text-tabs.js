/* Bismillah */

/*

Component Template - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TextTabsDefaults = {
    key: "0",
    selectedIndex: 0,
    tabList: ["Tab1", "Tab2", "Tab3"],
    invertColor: 0,
    onClick: function(self) {},
    tabHeight: 0, // 0: The label padding decides the height. Ex: 40 -> every tab is 40px high and the text is centered. (Same height as the buttons and inputs next to it.)
    tabPadding: [2, 2],
    backgroundStyle: {
        colorBottom: "whitesmoke",
        colorTop: "#DBDDDC",
        round: 8,
        border: 0,
        borderColor: Black(0.2),
    },
    labelStyle: {
        fontSize: 14, 
        textColor: "#373836",
        padding: [12, 4],
        round: 0,
        color: "transparent",
    },
    selectedStyle: {
        color: "white",
        round: 6,
        border: 0,
        borderColor: Black(0.2),
    },
};

const TextTabs = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, TextTabsDefaults);

    // Edit params, if needed:
    params.width = "auto";
    params.height = "auto";
    params.round = 0;

    // BOX: Component container
    let box = startObject(params);

    // [var]
    box.tabItemList = [];

    // box.superRemove = box.remove;
    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    box.makeTab = function(text) {

        Label({
            text: text, 
            clickable: 1,
            position: "relative",
            ...box.labelStyle,
        });
        that.elem.style.cursor = "pointer";

        // Fixed height: the tab is as high as the objects next to it (buttons, inputs) and the text stays centered.
        if (num(box.tabHeight) > 0) {
            const _tabPaddingY = (Array.isArray(box.tabPadding)) ? num(box.tabPadding[1] ?? box.tabPadding[0]) : num(box.tabPadding);
            const _labelPaddingY = (Array.isArray(box.labelStyle.padding)) ? num(box.labelStyle.padding[1] ?? box.labelStyle.padding[0]) : num(box.labelStyle.padding);
            that.height = num(box.tabHeight) - _tabPaddingY * 2;
            // WHY: Label is border-box; its height holds the padding. One line of text is centered with the line height.
            that.elem.style.lineHeight = (that.height - _labelPaddingY * 2) + "px";
        }

        that.index = box.tabItemList.length;
        box.tabItemList.push(that);
        box.tabGroup.add(that);

        that.on("click", (self, event) => {
            box.selectByIndex(self.index);
            box.onClick(self);
        });

        // Eğer metin uzunluğu değişirse, seçili nesnenin boyutunu güncelle.
        that.onResize(function(self) {
            if (self.index == box.selectedIndex) {

                    const _back = box.selectedLabelBack;

                    _back.left = self.left;
                    _back.top = self.top;
                    _back.width = self.width;
                    _back.height = self.height;
                    _back.opacity = 1;

            }
        });
        
    };

    box.selectByIndex = function(index) {

        // Unselect
        if (box.selectedIndex !== index && box.selectedIndex >= 0) box.tabItemList[box.selectedIndex].clickable = 1;

        // Select
        const _item = box.tabItemList[index];
        const _back = box.selectedLabelBack;

        _item.clickable = 0;
        _back.left = _item.left;
        _back.top = _item.top;
        _back.width = _item.width;
        _back.height = _item.height;
        _back.opacity = 1;

        box.selectedIndex = index;

    };

    box.hideByIndex = function(index) {
        box.tabItemList[index].visible = 0;
        if (index === box.selectedIndex) {
            box.selectedLabelBack.opacity = 0;
        } else {
            box.selectedLabelBack.left = box.tabItemList[box.selectedIndex].left;
        }
    };

    // *** OBJECT VIEW:

    if(box.invertColor) box.elem.style.filter = "invert(100%)";

    box.background = Box(0, 0, "100%", "100%", box.backgroundStyle);
    that.elem.style.background = `linear-gradient(to bottom,  ${box.backgroundStyle.colorBottom},  ${box.backgroundStyle.colorTop})`;

    // Tab Bar
    box.tabGroup = HGroup({
        flow: "horizontal", 
        align: "center top", 
        gap: 3, 
        height: "auto",
        width: "auto",
        padding: box.tabPadding,
        round: 8,
        position: "relative",
    });

        box.selectedLabelBack = Box({
            position: "absolute",
            opacity: 1,
            ...box.selectedStyle,
        });
        that.setMotion("left 0.2s, opacity 0.2s, width 0.2s");

    endGroup();

    // *** OBJECT INIT CODE:
    box.tabList.forEach(text => {
        box.makeTab(text);
    });

    if (box.tabList.length > 0) box.selectByIndex(0);
    
    return endObject(box);


};