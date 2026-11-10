/* Bismillah */

/*

Full Screen Select - v26.11

A select field that opens its list on the whole screen: a search box at the top, a close button, the items under it
(a phone app, a long list).
- The field: the text of the selected item, two small arrows at the right side. A click (or Enter, Space, the down
  arrow) opens the list. autoWidth: 1 -> the field is as wide as its text.
- The list: it comes in from below with a fade. The search box (comp/search-input.js SearchInput, load it
  first; without it there is no search box) shows only the items with the typed text (Turkish letters are found
  without their marks); Enter selects the first one. The selected item has a soft yellow color.
  searchIconFile / clearIconFile: the icons of the search box ("": the default files of SearchInput, which are
  found from a page one folder under the repository: a page in another place gives its own paths).
- Keyboard in the list: Escape closes, the arrow keys move over the items, Enter selects. The focus goes back to
  the field when the list closes.
- Only one list is open at a time (FullScreenSelect.openedSelect). The list is made on page when it first opens,
  hidden when it closes and removed with the field (box.own); setItems() makes it again at the next open.
- Motion: the list comes in from below with a fade in 0.2 s (transform and opacity) and goes out at once
; no motion when the system asks for reduced motion.
- Style packages: "light" (default; the old name "classic" works too), "dark". (FullScreenSelect.styles)

USAGE:
const fruits = FullScreenSelect({
    width: 320,
    items: [{ key: "banana", text: "Banana" }, { key: "peach", text: "Peach" }, "Kiwi"],
    selectedKey: "banana",
    onChange: function (self) { println(self.selectedKey); },
});
fruits.setSelectedKey("peach");      // onChange runs (silent: fruits.setSelectedKey("peach", 1))
fruits.setItems(otherItems);
fruits.getSelectedItem();            // { key, text } or null
fruits.open(); fruits.close();
FullScreenSelect({ styleName: "dark", ... });

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const FullScreenSelectDefaults = {
    width: 200,
    height: 50,
    items: [], // [{ key, text }] or ["Text"] (the text is its key)
    selectedKey: null, // null: the first item
    placeholder: "Search",
    emptyText: "No results",
    autoWidth: 0, // 1: the field is as wide as the text of the selected item
    showSearch: 1, // 0: no search box (a short list)
    arrowIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" id="Outline" viewBox="0 0 24 24" width="512" height="512"><path d="M18.71,8.21a1,1,0,0,0-1.42,0l-4.58,4.58a1,1,0,0,1-1.42,0L6.71,8.21a1,1,0,0,0-1.42,0,1,1,0,0,0,0,1.41l4.59,4.59a3,3,0,0,0,4.24,0l4.59-4.59A1,1,0,0,0,18.71,8.21Z"/></svg>'),
    closeIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<?xml version="1.0" encoding="UTF-8"?> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><g id="_01_align_center" data-name="01 align center"><polygon points="24 1.414 22.586 0 12 10.586 1.414 0 0 1.414 10.586 12 0 22.586 1.414 24 12 13.414 22.586 24 24 22.586 13.414 12 24 1.414"/></g></svg>'),
    searchIconFile: "", // The icons of the search box. "": the files of SearchInput (or of its style package)
    clearIconFile: "",
    ariaLabel: "", // "": the text of the selected item is read
    onChange: function (self) {}, // self.selectedKey changed (not at create time, not with silent: 1)
    onOpen: function (self) {},
    onClose: function (self) {},
    styleName: "light", // "light" ("classic": its old name), "dark" or a name added to FullScreenSelect.styles
    style: { // Light style package (default)
        box: { color: "whitesmoke", round: 4, border: 0 },
        focus: { ringColor: "rgba(95, 158, 160, 0.6)" },
        label: { left: 10, fontSize: 20, textColor: Black(0.8) },
        arrow: { size: 16, right: 8, gap: 7, opacity: 0.7, invert: 0 }, // gap: from the middle to each arrow
        panel: { color: "white", zIndex: 3000, slide: 150 }, // slide: px, from below when it opens
        search: { left: 20, top: 40, height: 50, closeGap: 10, color: "whitesmoke", textColor: "gray", round: 25, fontSize: 20, iconOpacity: 0.4 }, // closeGap: to the close button
        searchStyleName: "original", // the first look of SearchInput
        closeButton: { size: 30, right: 20, top: 50, color: "#D8D8D8", iconSize: 14, iconOpacity: 0.5, invert: 0 },
        list: { left: 10, top: 110, gap: 0 },
        item: { height: 60, sideSpace: 20, round: 4, color: "white", fontSize: 20, textColor: "#4A4A4A", textLeft: 30 },
        itemHover: { color: "#F7F7F7" },
        itemFocus: { color: "#F2F2F2" },
        itemSelected: { color: "#FFF0C2" },
        empty: { fontSize: 16, textColor: Black(0.4), top: 30 },
        scrollBar: { neverHide: 0, showDots: 0 },
    },
};

const FullScreenSelect = function (params = {}) {

    // Merge style package: params.style > FullScreenSelect.styles[styleName] > FullScreenSelectDefaults.style (light)
    basic.applyStylePackage(params, FullScreenSelect.styles, FullScreenSelectDefaults);

    // Merge params:
    mergeIntoIfMissing(params, FullScreenSelectDefaults);

    // Edit params: a copy, the caller's list does not change
    params.items = FullScreenSelect.toItems(params.items);

    // BOX: Component container (the field)
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const PANEL_MOTION = "transform 0.2s, opacity 0.2s"; // the list comes in (it goes out at once)
    const ARROW_UP = 180; // deg
    const ARROWS_ROOM = 30; // the text ends before the arrows (it fades out there)
    const TEXT_FADE = 40; // px
    const AUTO_WIDTH_SPACE = 50; // autoWidth: 1 -> the field is the text + this (the left space and the arrows)
    let focusedKey = null; // the item of the arrow keys in the open list
    let searchText = null; // the search of the open list (null: not filtered yet)

    // *** PUBLIC VARIABLES:
    box.isOpen = 0;
    box.panel = null; // The full screen list while it is open
    // NOTE: Default values are also public variables. (box.items, box.selectedKey...)

    // *** PRIVATE FUNCTIONS:

    const findItem = function (key) {
        return box.items.find(function (item) { return item.key == key; }) || null;
    };

    // The rows that are seen (the search), in their order
    const getShownRows = function () {
        if (!box.panel) return [];
        return box.panel.rows.filter(function (row) { return row.visible == 1; });
    };

    // *** THE FIELD:

    const applyContent = function () {
        const item = findItem(box.selectedKey);
        box.lblText.plainText = item ? item.text : "";
        box.aria = { label: box.ariaLabel || (item ? item.text : ""), expanded: !!box.isOpen };
    };

    const fitAutoWidth = function () {
        if (box.autoWidth != 1) return;
        box.width = box.lblText.width + AUTO_WIDTH_SPACE;
    };

    const createArrow = function (isUp) {
        const arrow = Icon({ right: _s.arrow.right, width: _s.arrow.size, height: _s.arrow.size, opacity: _s.arrow.opacity });
        arrow.load(box.arrowIconFile);
        if (isUp) arrow.rotate = ARROW_UP;
        if (_s.arrow.invert) arrow.css = { filter: "invert(1)" };
        arrow.css = { top: "calc(50% - " + (_s.arrow.size / 2) + "px " + (isUp ? "- " : "+ ") + _s.arrow.gap + "px)" };
        return arrow;
    };

    // *** THE LIST (made on page when it first opens; made again by setItems):

    const isReducedMotion = function () {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };

    // The list comes in from below with a fade (0.2 s, at once: no timer of basic.js); it goes out at once.
    const showPanel = function (isShown) {

        const panel = box.panel;
        panel.setMotionNow("");

        if (!isShown) {
            panel.visible = 0;
            return;
        }

        panel.opacity = 0;
        panel.css = { transform: "translateY(" + _s.panel.slide + "px)" };
        panel.visible = 1;
        if (isReducedMotion()) {
            panel.opacity = 1;
            panel.css = { transform: "none" };
            return;
        }

        // WHY: the start look must be drawn before the motion is turned on, or the browser shows the end at once
        void panel.elem.offsetHeight;
        panel.setMotionNow(PANEL_MOTION);
        panel.opacity = 1;
        panel.css = { transform: "none" };

    };

    // Only the list scrolls to the row: "center" (in the middle) or "nearest" (just into sight).
    // WHY not elem.scrollIntoView(): it scrolls every box around the row too. While the list was still 150 px
    //     down (the slide), it scrolled the main box of the page: the page behind jumped and the list did not slide.
    const scrollToRow = function (row, place) {
        const listElem = box.panel.listBox.elem;
        const rowTop = row.elem.offsetTop;
        const rowBottom = rowTop + row.elem.offsetHeight;
        if (place == "center") {
            listElem.scrollTop = rowTop - (listElem.clientHeight - row.elem.offsetHeight) / 2;
            return;
        }
        if (rowTop < listElem.scrollTop) listElem.scrollTop = rowTop;
        else if (rowBottom > listElem.scrollTop + listElem.clientHeight) listElem.scrollTop = rowBottom - listElem.clientHeight;
    };

    // Every open starts with an empty search and the selected item in sight.
    const resetPanel = function () {
        if (box.panel.searchInput) box.panel.searchInput.setValue("", 1);
        searchText = null;
        filterRows("");
        box.panel.listBox.elem.scrollTop = 0;
        const selectedRow = box.panel.rows.find(function (row) { return row.item.key == box.selectedKey; });
        if (selectedRow) scrollToRow(selectedRow, "center");
    };

    const removePanel = function () {
        if (!box.panel) return;
        box.panel.remove();
        box.panel = null;
    };

    const createPanel = function () {

        box.panel = createIn(page, function () {

            // BOX: Full screen list
            const panel = startBox(0, 0, "100%", "100%", { color: _s.panel.color, zIndex: _s.panel.zIndex, role: "dialog", aria: { modal: true, label: box.ariaLabel || box.placeholder } });
            panel.rows = [];

                createSearch(panel);
                createCloseButton(panel);

                // BOX: Scrolling list
                panel.listBox = startBox(_s.list.left, _s.list.top, "calc(100% - " + _s.list.left + "px)", "calc(100% - " + _s.list.top + "px)", { color: "transparent", scrollY: 1, role: "listbox" });

                    // GROUP: Items
                    panel.listGroup = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.list.gap });
                        box.items.forEach(function (item) {
                            panel.rows.push(createRow(item));
                        });
                    endGroup();

                    // LABEL: Nothing found
                    panel.lblEmpty = Label({ left: 0, top: _s.empty.top, width: "100%", plainText: box.emptyText, textAlign: "center", fontSize: _s.empty.fontSize, textColor: _s.empty.textColor, visible: 0 });

                endBox();

                if (typeof ScrollBar !== "undefined") {
                    panel.scrollBar = ScrollBar(Object.assign({ scrollableBox: panel.listBox }, _s.scrollBar));
                }

            endBox();

            return panel;

        });

        box.own(box.panel);
        box.panel.visible = 0;
        box.panel.listenTo(window, "keydown", onPanelKeyDown);

    };

    const createSearch = function (panel) {

        if (box.showSearch != 1 || typeof SearchInput === "undefined") return;

        const search = _s.search;
        const searchParams = {
            styleName: _s.searchStyleName,
            left: search.left,
            top: search.top,
            width: "calc(100% - " + (search.left + search.closeGap + _s.closeButton.size + _s.closeButton.right) + "px)",
            height: search.height,
            color: search.color,
            textColor: search.textColor,
            round: search.round,
            fontSize: search.fontSize,
            searchIconOpacity: search.iconOpacity,
            border: 0,
            borderBottomStyle: "none",
            placeholder: box.placeholder,
            onChange: function (self) { filterRows(self.getSearchText()); },
        };
        // WHY only when given: a file given here would win over the icon of the style package of SearchInput
        if (box.searchIconFile) searchParams.searchIconFile = box.searchIconFile;
        if (box.clearIconFile) searchParams.clearIconFile = box.clearIconFile;
        panel.searchInput = SearchInput(searchParams);

    };

    const createCloseButton = function (panel) {

        const button = _s.closeButton;

        // BOX: Close button
        panel.btnClose = startBox({
            right: button.right,
            top: button.top,
            width: button.size,
            height: button.size,
            round: button.size / 2,
            color: button.color,
            clickable: 1,
            cursor: "pointer",
            role: "button",
            tabIndex: 0,
            aria: { label: "Close" },
        });
        panel.btnClose.setFocusRing(_s.focus.ringColor);

            // ICON: Close
            Icon({ width: button.iconSize, height: button.iconSize, opacity: button.iconOpacity });
            that.load(box.closeIconFile);
            if (button.invert) that.css = { filter: "invert(1)" };
            that.center();

        endBox();

        panel.btnClose.on("click", function () { box.close(); });

    };

    // One item of the list. Its container must be set (createIn).
    const createRow = function (item) {

        const itemStyle = _s.item;

        // BOX: Item
        const row = startBox({
            width: "calc(100% - " + (itemStyle.sideSpace * 1.5) + "px)",
            height: itemStyle.height,
            round: itemStyle.round,
            color: itemStyle.color,
            clickable: 1,
            cursor: "pointer",
            role: "option",
            css: { marginLeft: (itemStyle.sideSpace / 2) + "px", flex: "0 0 auto" },
        });
        row.item = item;
        row.isHover = 0;

            // LABEL: Item text
            row.lblText = Label({
                left: itemStyle.textLeft,
                width: "calc(100% - " + (itemStyle.textLeft * 2) + "px)",
                plainText: item.text,
                fontSize: itemStyle.fontSize,
                textColor: itemStyle.textColor,
                ellipsis: 1,
            });
            row.lblText.css = { top: "50%", transform: "translateY(-50%)" };

        endBox();

        row.onHoverChange(function (self, isOver) {
            row.isHover = isOver;
            paintRow(row);
        });
        row.on("click", function () {
            selectFromList(item.key);
        });

        paintRow(row);
        return row;

    };

    // The color of an item: selected > the arrow keys > under the mouse
    const paintRow = function (row) {
        const isSelected = (row.item.key == box.selectedKey);
        row.aria = { selected: isSelected };
        if (isSelected) {
            row.color = _s.itemSelected.color;
        } else if (row.item.key == focusedKey) {
            row.color = _s.itemFocus.color;
        } else if (row.isHover) {
            row.color = _s.itemHover.color;
        } else {
            row.color = _s.item.color;
        }
    };

    const paintRows = function () {
        if (!box.panel) return;
        box.panel.rows.forEach(paintRow);
    };

    const filterRows = function (text) {
        const newSearchText = FullScreenSelect.toSearchText(text).trim();
        // WHY: the same text again (a search that is asked again) must not reset the focused item
        if (newSearchText === searchText) return;
        searchText = newSearchText;
        box.panel.rows.forEach(function (row) {
            const isShown = (searchText == "") || FullScreenSelect.toSearchText(row.item.text).includes(searchText);
            row.visible = isShown ? 1 : 0;
        });
        box.panel.lblEmpty.visible = (getShownRows().length == 0) ? 1 : 0;
        focusedKey = null;
        paintRows();
    };

    // The arrow keys move a soft color over the items that are seen.
    const moveFocus = function (step) {
        const rows = getShownRows();
        if (rows.length == 0) return;
        let index = rows.findIndex(function (row) { return row.item.key == focusedKey; });
        if (index == -1) index = rows.findIndex(function (row) { return row.item.key == box.selectedKey; });
        index = (index == -1) ? 0 : Math.max(0, Math.min(rows.length - 1, index + step));
        focusedKey = rows[index].item.key;
        paintRows();
        scrollToRow(rows[index], "nearest");
    };

    const onPanelKeyDown = function (self, event) {

        if (!box.isOpen) return;
        // WHY: the Enter that opened the list from the field comes here too (window), it must not select at once
        if (event.target == box.elem) return;

        if (event.key == "Escape") {
            event.preventDefault();
            box.close();
            return;
        }
        if (event.key == "ArrowDown" || event.key == "ArrowUp") {
            event.preventDefault();
            moveFocus(event.key == "ArrowDown" ? 1 : -1);
            return;
        }
        if (event.key != "Enter") return;
        if (event.target == box.panel.btnClose.elem) return; // (its own click)

        // Enter: the item of the arrow keys, or the first item that is seen (after a search)
        const rows = getShownRows();
        const row = rows.find(function (r) { return r.item.key == focusedKey; }) || rows[0];
        if (!row) return;
        event.preventDefault();
        selectFromList(row.item.key);

    };

    const selectFromList = function (key) {
        box.setSelectedKey(key);
        box.close();
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called.
    box.setSelectedKey = function (key, silent = 0) {
        if (!findItem(key)) return;
        if (box.selectedKey == key) return;
        box.selectedKey = key;
        applyContent();
        paintRows();
        if (!silent) box.onChange(box);
    };
    // USAGE: get: select.selectedKey, set: select.setSelectedKey("peach")

    box.setSelectedIndex = function (index, silent = 0) {
        const item = box.items[index];
        if (item) box.setSelectedKey(item.key, silent);
    };

    box.getSelectedIndex = function () {
        return box.items.indexOf(findItem(box.selectedKey));
    };

    box.getSelectedItem = function () {
        return findItem(box.selectedKey);
    };

    // A new list. The selected key stays when it is in the new list; else the first item. (onChange is not called)
    box.setItems = function (items) {
        box.close();
        removePanel(); // (made again with the new items at the next open)
        box.items = FullScreenSelect.toItems(items);
        if (!findItem(box.selectedKey)) box.selectedKey = box.items.length ? box.items[0].key : null;
        applyContent();
    };
    // USAGE: select.setItems(["On", "Off", "Automatic"])

    box.open = function () {

        if (box.isOpen || box.items.length == 0) return;
        if (FullScreenSelect.openedSelect) FullScreenSelect.openedSelect.close();

        box.isOpen = 1;
        FullScreenSelect.openedSelect = box;
        if (!box.panel) createPanel();
        box.panel.zIndex = basic.zIndexAbove(box, _s.panel.zIndex); // WHY at open: a field in a Dialog (4000 and up) opens its list over it
        applyContent();
        showPanel(1);
        resetPanel(); // (after showPanel: a hidden list can not scroll to the selected item)

        if (box.panel.searchInput) box.panel.searchInput.focus();
        else box.panel.btnClose.elem.focus();
        box.onOpen(box);

    };

    box.close = function () {

        if (!box || !box.isOpen) return;

        box.isOpen = 0;
        if (FullScreenSelect.openedSelect == box) FullScreenSelect.openedSelect = null;
        applyContent();
        showPanel(0);

        box.elem.focus();
        box.onClose(box);

    };

    // REMOVE: the static openedSelect must not keep a removed select. (The list goes with box.own.)
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return;
        if (FullScreenSelect.openedSelect == box) FullScreenSelect.openedSelect = null;
        superRemove.call(box);
        box = null;
    };

    // *** OBJECT VIEW:

    box.props(_s.box);
    box.clickable = 1;
    box.cursor = "pointer";
    box.role = "combobox";
    box.tabIndex = 0;
    box.aria = { haspopup: "listbox" };
    box.setFocusRing(_s.focus.ringColor);

    // LABEL: The text of the selected item (it fades out at the right side, before the arrows)
    box.lblText = Label({
        left: _s.label.left,
        width: (box.autoWidth == 1) ? "auto" : "calc(100% - " + (_s.label.left + ARROWS_ROOM) + "px)",
        fontSize: _s.label.fontSize,
        textColor: _s.label.textColor,
        css: { top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap", overflow: "hidden" },
    });
    if (box.autoWidth != 1) {
        // WHY a mask: a long text fades out before the arrows on any color of the field
        const fade = "linear-gradient(to right, black calc(100% - " + TEXT_FADE + "px), transparent)";
        box.lblText.css = { maskImage: fade, webkitMaskImage: fade };
    }

    // ICON: Up and down arrows
    box.imgArrowUp = createArrow(1);
    box.imgArrowDown = createArrow(0);

    // *** OBJECT INIT CODE:

    if (box.selectedKey === null || !findItem(box.selectedKey)) {
        box.selectedKey = box.items.length ? box.items[0].key : null;
    }
    applyContent();
    box.lblText.onResize(fitAutoWidth);

    box.on("click", function () { box.open(); });
    box.on("keydown", function (self, event) {
        if (event.key != "Enter" && event.key != " " && event.key != "ArrowDown") return;
        event.preventDefault();
        box.open();
    });

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

FullScreenSelect.openedSelect = null; // The select whose list is open

// [{ key, text }] from items: objects { key, text } or texts
FullScreenSelect.toItems = function (items) {
    if (!Array.isArray(items)) return [];
    return items.map(function (item) {
        if (item === null || typeof item !== "object") return { key: String(item), text: String(item) };
        const text = (item.text === undefined || item.text === null) ? String(item.key) : String(item.text);
        return { key: item.key, text: text };
    });
};

// Lower case, the Turkish letters without their marks: "İstanbul" is found with "istanbul".
FullScreenSelect.toSearchText = function (value) {
    const text = (value === undefined || value === null) ? "" : String(value);
    return text.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i");
};

// *** STYLE PACKAGES:
// USAGE: FullScreenSelect({ styleName: "dark" })
// USAGE: FullScreenSelect({ style: { itemSelected: { color: "#BFDBC9" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the light style.
FullScreenSelect.styles = {

    // A whitesmoke field, a white list, a soft yellow selected item.
    light: FullScreenSelectDefaults.style,

    // For a dark page.
    dark: {
        box: { color: "#2B2D31", round: 4, border: 0 },
        focus: { ringColor: "rgba(95, 179, 181, 0.7)" },
        label: { left: 10, fontSize: 20, textColor: "rgba(255, 255, 255, 0.88)" },
        arrow: { size: 16, right: 8, gap: 7, opacity: 0.7, invert: 1 },
        panel: { color: "#1E1F22", zIndex: 3000, slide: 150 },
        search: { left: 20, top: 40, height: 50, closeGap: 10, color: "#2B2D31", textColor: "rgba(255, 255, 255, 0.85)", round: 25, fontSize: 20, iconOpacity: 0.5 },
        searchStyleName: "ozdenDark",
        closeButton: { size: 30, right: 20, top: 50, color: "#3A3C41", iconSize: 14, iconOpacity: 0.7, invert: 1 },
        item: { height: 60, sideSpace: 20, round: 4, color: "#1E1F22", fontSize: 20, textColor: "rgba(255, 255, 255, 0.8)", textLeft: 30 },
        itemHover: { color: "#26282C" },
        itemFocus: { color: "#2B2D31" },
        itemSelected: { color: "#4A4128" },
        empty: { fontSize: 16, textColor: "rgba(255, 255, 255, 0.45)", top: 30 },
        scrollBar: { neverHide: 0, showDots: 0, bar_color: "#A0A0A0", bar_mouseOverColor: "#D0D0D0" },
    },

};
FullScreenSelect.styles.classic = FullScreenSelect.styles.light; // the old name of light: the pages made with it keep their look
