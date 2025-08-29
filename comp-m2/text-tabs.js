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
    box.destroy = function() {

        box.remove(); // NOTE: It will clean all events like box.on("click"
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

        that.index = box.tabItemList.length;
        box.tabItemList.push(that);
        box.tabGroup.add(that);

        that.on("click", (self, event) => {
            box.selectByIndex(self.index);
            box.onClick(self);
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