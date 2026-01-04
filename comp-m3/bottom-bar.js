/* Bismillah */

/*

Component: BottomBar
Description: Mobile application bottom bar component that creates buttons from a JSON list.
Started Date: December 2025
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
WebPage: https://bug7a.github.io/

- Design idea from an Instagram post by shahinurstk02

*/

"use strict";

// Default values:
const BottomBarDefaults = {
    selectedIndex: 0,
    left: 0,
    width: "100%",
    height: 100,
    items: [], // JSON list for buttons: [{ icon: "file.png", text: "Home" }]
    onItemClick: function (item, index) { },
    style: {
        background: {
            color: "transparent",
            gradient: "linear-gradient(to bottom, transparent, whitesmoke)",
            border: 0,
        },
        icon: {
            // Default style for items
        },
        label: {
            // Default style for items
        }
    }
};

const BottomBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BottomBarDefaults);

    // BOX: Component container
    let box = startObject(params);
    box.color = box.style.background.color;
    box.border = box.style.background.border;
    box.elem.style.background = box.style.background.gradient;

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:
    box.itemObjList = [];

    // *** PRIVATE FUNCTIONS:
    const createButtons = function (items) {
        items.forEach((item, index) => {
            createButton(item, index);
        });
    };

    const createButton = function (item, index) {

        const _item = {};

        // ICON GROUP
        _item.icon = startBox({
            width: 40,
            height: 40,
            color: "transparent",
            position: "absolute" // Essential for manual layout
        });
        box.innerBox.add(that);
        that.center("top");
        that.setMotion("left 0.3s, opacity 0.3s");
        that.elem.style.cursor = "pointer";
        that.on("click", function () {
            box.selectedIndex = index;
            box.onItemClick(item, index);
            box.refresh();
        });

        // ICON #NORMAL (BLACK)
        _item.icon.i1 = Icon(0, 0, {
            width: 40,
            height: 40,
            position: "absolute" // Essential for manual layout
        }); // Add to innerBox
        that.load(item.icon);
        that.setMotion("opacity 0.3s");

        // ICON #SELECTED (ORANGE)
        _item.icon.i2 = Icon(0, 0, {
            width: 40,
            height: 40,
            position: "absolute", // Essential for manual layout
            opacity: 0,
        }); // Add to innerBox
        that.load(item.icon.replace(".png", "s.png"));
        that.setMotion("opacity 0.3s");

        // Badge with number
        _item.badge = Badge({
            value: 0,
            maxValue: 99,
            dotSize: 12,
            badgeStyle: {
                color: "#FE5D49",
            }
        });

        endBox();

        // LABEL
        _item.label = Label({
            left: 12,
            width: "auto",
            height: "auto",
            color: "transparent",
            text: item.text,
            textColor: "#FE5D49",
            position: "absolute" // Essential for manual layout
        }); // Add to innerBox
        box.innerBox.add(that);
        that.center("top");
        that.top -= 2;
        that.setMotion("left 0.3s, opacity 0.3s");

        _item.index = index;
        _item.data = item;

        box.itemObjList.push(_item);
        setTimeout(function () { box.refresh(); }, 20);

    };

    // *** PUBLIC FUNCTIONS:

    box.setBadge = function (index, value) {
        box.itemObjList[index].badge.setValue(value);
    };

    box.selectNone = function () {
        box.selectedIndex = -1;
        box.refresh();
    };

    box.selectByIndex = function (index) {
        box.selectedIndex = index;
        box.refresh();
    };

    box.refresh = function () {

        const _padding = 40;
        const _space = 20;
        let _width = _padding;

        box.itemObjList.forEach((item, index) => {

            item.icon.left = _width;

            if (box.selectedIndex == -1) {
                box.selectedBox.opacity = 0;
            }

            if (index == box.selectedIndex) {

                _width += item.icon.width + 6;

                item.label.left = _width;
                _width += item.label.width + _space;

                item.label.opacity = 1;
                item.icon.i1.opacity = 0;
                item.icon.i2.opacity = 1;

                box.selectedBox.opacity = 1;
                box.selectedBox.left = item.icon.left - 14;
                box.selectedBox.width = item.icon.width + 6 + item.label.width + 28;

                item.icon.clickable = 0;

                //item.icon.color = "red";
                //item.label.color = "red";

            }
            else {
                _width += item.icon.width + _space;

                item.label.left = item.icon.left;
                item.label.opacity = 0;
                item.icon.i1.opacity = 1;
                item.icon.i2.opacity = 0;

                item.icon.clickable = 1;
                //item.icon.color = "black";
                //item.label.color = "black";
            }

        });

        _width += _padding - _space;
        box.innerBox.width = _width;

        box.innerBox.center();

    };

    // *** OBJECT VIEW:
    // Basic setup
    /*
    HGroup({
        align: "center"
    });
    */

    box.innerBox = startBox({
        round: 100,
        width: 350,
        height: 76,
    });
    that.elem.style.background = "linear-gradient(to right, #FFC8C1, #A5E5EB)";
    //that.elem.style.shadow = box.style.innerBox.shadow;
    that.setMotion("width 0.3s, left 0.3s");

    box.selectedBox = Box(0, 0, 142, 56, {
        color: "#EAEAE9",
        round: 100,
        border: 1,
        borderColor: "#FFFFFF",
    });
    that.setMotion("left 0.3s, width 0.3s, opacity 0.3s");
    that.center("top");

    endBox();

    //endGroup();

    // INIT:
    createButtons(box.items);
    box.onResize(function () {
        box.innerBox.dontMotion();
        box.innerBox.center();
    });

    return endObject(box);

};
