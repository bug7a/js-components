/* Bismillah */

/*

Component: BottomBar
Description: Mobile application bottom bar component that creates buttons from a JSON list.
Started Date: December 2025
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
WebPage: https://bug7a.github.io/

- Design idea from an Instagram post by shahinurstk02

NEEDS: comp-m2/badge-v2.js (Badge), loaded before the first item is created.
NOTE: Each item needs two icon files: "home.png" (normal) and "homes.png" (selected: the same name + "s").

USAGE:
const bar = BottomBar({
    top: page.height - 100,
    items: [{ icon: "home.png", text: "Home" }, { icon: "search.png", text: "Search" }],
    onItemClick: function (item, index) { println(item.data.text); },
});
bar.setBadge(1, 5);
bar.selectByIndex(0);

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
    hoverEffect: true, // For desktop usage
    style: {
        container: {
            color: "transparent",
            gradient: "linear-gradient(to bottom, transparent, whitesmoke)",
            border: 0,
        },
        background: {
            gradient: "linear-gradient(to right, #FFC8C1, #A5E5EB)",
            border: 0,
            round: 100,
        },
        // Layout configuration
        layout: {
            padding: 40,
            itemSpacing: 20,
            iconGap: 6,
            selectionPadding: 14,
        },
        icon: {
            width: 40,
            height: 40,
        },
        label: {
            textColor: "#FE5D49",
        },
        selectedBox: {
            color: "#EAEAE9",
            round: 100,
            border: 1,
            borderColor: "#FFFFFF",
        }
    }
};

const BottomBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BottomBarDefaults);

    // BOX: Component container
    const box = startObject(params);
    box.color = box.style.container.color;
    box.border = box.style.container.border;
    box.css.background = box.style.container.gradient;

    // *** PRIVATE VARIABLES:
    const BAR_WIDTH = 350; // The first width of the bar; refresh() gives it the width of its items.
    const BAR_HEIGHT = 76;
    const SELECTED_BOX_WIDTH = 142; // The first width; refresh() sets it around the selected item.
    const SELECTED_BOX_HEIGHT = 56;
    const ITEM_ICON_BOX_SIZE = 40;
    const LABEL_FIRST_LEFT = 12;
    const LABEL_RAISE = 2; // px above the center line: it looks centered next to the icon.
    const HOVER_ICON_OPACITY = 0.5;
    const REFRESH_DELAY = 3; // ms: many changes in a row make one refresh.

    // *** PUBLIC VARIABLES:
    box.itemObjList = [];
    // NOTE: An item object: { icon (box: icon.i1 normal, icon.i2 selected), label, badge, index, data }

    // *** PRIVATE FUNCTIONS:

    // WHY: The selected icon is a second file: "home.png" -> "homes.png".
    const getSelectedIconFile = function (iconFile) {
        return iconFile.replace(".png", "s.png");
    };

    // PAINT: the selected item shows its label and its selected icon.
    const paintItem = function (item, isSelected) {
        if (isSelected) {
            item.label.opacity = 1;
            item.icon.i1.opacity = 0;
            item.icon.i2.opacity = 1;
            item.icon.clickable = 0;
            return;
        }
        item.label.opacity = 0;
        item.icon.i1.opacity = 1;
        item.icon.i2.opacity = 0;
        item.icon.clickable = 1;
    };

    // The selected box is around the icon and the label of the selected item.
    const placeSelectedBox = function (item) {
        const _layout = box.style.layout;
        const contentWidth = item.icon.width + _layout.iconGap + item.label.width;
        box.selectedBox.opacity = 1;
        box.selectedBox.left = item.icon.left - _layout.selectionPadding;
        box.selectedBox.width = contentWidth + (_layout.selectionPadding * 2);
    };

    const createButtons = function (items) {
        items.forEach((itemData, index) => {
            createButton(itemData, index);
        });
    };

    // ICON BOX: the normal and the selected icon on each other, and the badge.
    const createItemIcon = function (itemView, itemData, index) {

        itemView.icon = startBox({
            width: ITEM_ICON_BOX_SIZE,
            height: ITEM_ICON_BOX_SIZE,
            color: "transparent",
            position: "absolute", // WHY: refresh() places the items itself (left), not a flex layout.
        });
        box.innerBox.add(itemView.icon);
        itemView.icon.center("top");
        itemView.icon.setMotion("left 0.3s, opacity 0.3s");
        itemView.icon.cursor = "pointer";
        itemView.icon.on("click", function () {
            box.selectedIndex = index;
            box.onItemClick(itemView, index);
            box.refresh();
        });

            // ICON: normal (black)
            itemView.icon.i1 = Icon(0, 0, {
                width: box.style.icon.width,
                height: box.style.icon.height,
                position: "absolute",
            });
            itemView.icon.i1.load(itemData.icon);
            itemView.icon.i1.setMotion("opacity 0.3s");

            // ICON: selected (orange)
            itemView.icon.i2 = Icon(0, 0, {
                width: box.style.icon.width,
                height: box.style.icon.height,
                position: "absolute",
                opacity: 0,
            });
            itemView.icon.i2.load(getSelectedIconFile(itemData.icon));
            itemView.icon.i2.setMotion("opacity 0.3s");

            // Hover effect for icons (for desktop usage)
            if (box.hoverEffect) {
                itemView.icon.on("mouseover", function () {
                    itemView.icon.i2.opacity = HOVER_ICON_OPACITY;
                });
                itemView.icon.on("mouseout", function () {
                    if (box.selectedIndex != index) itemView.icon.i2.opacity = 0;
                });
            }

            // Badge with number
            itemView.badge = Badge({
                value: 0,
                maxValue: 99,
                dotSize: 12,
                badgeStyle: {
                    color: "#FE5D49",
                }
            });

        endBox();
    };

    // LABEL: shown only when the item is selected.
    const createItemLabel = function (itemView, itemData) {
        itemView.label = Label({
            left: LABEL_FIRST_LEFT,
            width: "auto",
            height: "auto",
            color: "transparent",
            text: itemData.text,
            textColor: box.style.label.textColor,
            position: "absolute", // WHY: refresh() places the items itself (left), not a flex layout.
            opacity: 0,
        });
        box.innerBox.add(itemView.label);
        itemView.label.center("top");
        itemView.label.top -= LABEL_RAISE;
        itemView.label.setMotion("left 0.3s, opacity 0.3s");
        itemView.label.onResize(box.refreshOneTime); // WHY: The width of the label is known only after it is drawn.
    };

    const createButton = function (itemData, index) {
        const itemView = {};
        createItemIcon(itemView, itemData, index);
        createItemLabel(itemView, itemData);
        itemView.index = index;
        itemView.data = itemData;

        box.itemObjList.push(itemView);
        box.refreshOneTime();
    };

    // *** PUBLIC FUNCTIONS:

    // Many calls in a row make one refresh().
    // NOTE: box.after() is a timer of the box: it can not run after remove().
    box.refreshOneTime = function () {
        if (box.refreshTimeout) box.refreshTimeout();
        box.refreshTimeout = box.after(REFRESH_DELAY, function () { box.refresh(); });
    };

    box.setBadge = function (index, value) {
        box.itemObjList[index].badge.setValue(value);
    };
    // USAGE: bar.setBadge(1, 5)

    box.selectNone = function () {
        box.selectedIndex = -1;
        box.refreshOneTime();
    };

    box.selectByIndex = function (index) {
        box.selectedIndex = index;
        box.refreshOneTime();
    };
    // USAGE: get: bar.selectedIndex, set: bar.selectByIndex(2)

    // Places the items from the left: the selected one is wider (icon + label), then the bar takes their width.
    box.refresh = function () {

        const _layout = box.style.layout;
        let _currentLeft = _layout.padding;

        if (box.selectedIndex == -1) box.selectedBox.opacity = 0;

        box.itemObjList.forEach((item, index) => {

            item.icon.left = _currentLeft;

            if (index == box.selectedIndex) {
                _currentLeft += item.icon.width + _layout.iconGap;
                paintItem(item, true);
                item.label.left = _currentLeft;
                _currentLeft += item.label.width + _layout.itemSpacing;
                placeSelectedBox(item);
                return;
            }

            _currentLeft += item.icon.width + _layout.itemSpacing;
            item.label.left = item.icon.left;
            paintItem(item, false);

        });

        _currentLeft += _layout.padding - _layout.itemSpacing;
        box.innerBox.width = _currentLeft;
        box.innerBox.center();

    };

    // *** OBJECT VIEW:

    // BOX: The bar (the items are added into it by createButton)
    box.innerBox = startBox({
        round: box.style.background.round,
        width: BAR_WIDTH,
        height: BAR_HEIGHT,
        border: box.style.background.border,
    });
    box.innerBox.css.background = box.style.background.gradient;
    box.innerBox.setMotion("width 0.3s, left 0.3s");

        // BOX: Behind the selected item
        box.selectedBox = Box(0, 0, SELECTED_BOX_WIDTH, SELECTED_BOX_HEIGHT, box.style.selectedBox);
        box.selectedBox.opacity = 0;
        box.selectedBox.setMotion("left 0.3s, width 0.3s, opacity 0.3s");
        box.selectedBox.center("top");

    endBox();

    // *** OBJECT INIT CODE:
    createButtons(box.items);
    box.onResize(function () {
        box.innerBox.dontMotion();
        box.innerBox.center();
    });

    return endObject(box);

};
