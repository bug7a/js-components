/* Bismillah */

/*

Search Results - v26.09

UI COMPONENT
- The result list that opens under a search input. (Command palette / autocomplete.)
- The items are plain objects: { text, description, group }. Anything else you put in them comes back
  to you in onSelect, so the page decides what "opening a result" means.
- Group headers: the items are shown in the order they are given, and a new "group" value starts
  a new header. (Ex: "Pages", "Users", "Orders")
- It is always created on the page and placed with fixed position, so it is never clipped by the
  bar or the group it is called from, and it stays on the screen on a small screen.
- The width: maxWidth (default 380) whatever the width of the anchor; matchAnchorWidth: 1
  makes the list as wide as the anchor, so both edges meet on a phone and on a wide screen (maxWidth is not used
  then). Never wider than the screen. setMatchAnchorWidth(). Sample: 02-comp-examples/search-results.htm
- The list scrolls with basic/scroll-bar.js (ScrollBar), not with the scrollbar of the browser.
- attachTo(inputElement) does the whole keyboard work: ArrowUp / ArrowDown move, Enter opens,
  Escape closes, focus reopens the last results and blur closes them.
- The texts are written with plainText (textContent), so a name with < or & is shown as it is.
- Style packages: "light" (default; the old name "classic" works too), "dark", "modern". Select with styleName. (SearchResults.styles)

USAGE:
const results = SearchResults({
    anchor: searchInput,                  // The object the list opens under
    styleName: "dark",
    onSelect: function (self, item) { item.open(); },
});
searchInput.onChange = function (self) { results.setItems(findResults(self.getSearchText()), self.getSearchText()); };
results.attachTo(searchInput.txtSearch.inputElement);
results.remove();                         // Also removes its window events and its ScrollBar.

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SearchResultsDefaults = {
    key: "0",
    anchor: null, // The basic.js object the list opens under. (Ex: a SearchInput)
    anchorAlign: "right", // "right": the right edges meet, "left": the left edges meet.
    matchAnchorWidth: 0, // 1: the list is as wide as the anchor (both edges meet; maxWidth is not used). setMatchAnchorWidth()
    maxWidth: 380,
    maxHeightRatio: 0.7, // Of the screen height.
    offsetY: 6, // Space between the anchor and the list.
    screenMargin: 8, // The list never comes closer than this to the edge of the screen.
    emptyText: "No results for \"{query}\"", // {query} is replaced by the text that was searched.
    showEmpty: 1, // 0: The list is not opened at all when there is no result.
    hintText: "↑ ↓ to move · Enter to open · Esc to close",
    showHint: 1,
    showGroups: 1,
    openOnFocus: 1, // Focus on the input opens the last results again.
    closeOnBlur: 1,
    useScrollBar: 1, // basic/scroll-bar.js. 0: the scrollbar of the browser.
    zIndexValue: 1000, // WHY: "zIndex" is a basic.js property of every box, the name is taken.
    ariaLabel: "Search results",
    createItemView: null, // function (item, index, self) {} -> Your own row. (Optional)
    onSelect: function (self, item, index) { },
    onOpen: function (self) { },
    onClose: function (self) { },
    onActiveChange: function (self, item, index) { },
    styleName: "light", // "light" ("classic": its old name), "dark", "modern" or a name added to SearchResults.styles
    style: { // Light style package (default)
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 10,
            padding: 6,
            boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.18)",
        },
        group: {
            fontSize: 10,
            textColor: Black(0.4),
            padding: [12, 6],
            letterSpacing: "1px",
        },
        item: {
            padding: [12, 6],
            round: 6,
            color: "transparent",
            activeColor: Black(0.06),
        },
        itemText: {
            fontSize: 14,
            textColor: Black(0.85),
        },
        itemDesc: {
            fontSize: 12,
            textColor: Black(0.45),
        },
        empty: {
            fontSize: 13,
            textColor: Black(0.5),
            padding: [14, 12],
        },
        hint: {
            fontSize: 11,
            textColor: Black(0.35),
            padding: [12, 8],
            dividerColor: Black(0.08),
        },
        scrollBar: {
            bar_color: "#9A9A98",
            bar_mouseOverColor: "#6A6A68",
            bar_width: 4,
            bar_round: 3,
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
        },
    },
};

const SearchResults = function (params = {}) {

    // Merge style package: params.style > SearchResults.styles[styleName] > SearchResultsDefaults.style (light)
    basic.applyStylePackage(params, SearchResults.styles, SearchResultsDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SearchResultsDefaults);

    // WHY: A dropdown has to be over everything and must not be clipped by the bar or the group it
    //      is called from, so it is created on the page. createIn() can NOT be used here: it puts
    //      the container back when its function ends, and startObject() would be inside it while
    //      endObject() is outside. The container is put back by hand after endObject().
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: Component container
    let box = startObject(params);

    const _s = box.style;

    // *** PRIVATE VARIABLES:

    let items = [];                 // The items that are shown now.
    let query = "";                 // The text they were found with.
    let activeIndex = -1;
    let isClosedByUser = 0;         // 1: Escape closed the list (it stays closed for the same text)
    let rows = [];                  // The row objects, in the order of items.
    let inputElem = null;           // attachTo()
    let inputRemovers = [];         // The removers of the events of that input.
    const SECTION_SPACE = "4px";    // Above a group header and the hint
    const MIN_LIST_HEIGHT = 60;     // px: the list is not made shorter than this to fit the screen (it scrolls)

    // *** PRIVATE FUNCTIONS:

    // Creates the content of the list again.
    const render = function () {

        rows = [];

        if (box.wrapper) box.wrapper.remove();

        createIn(box.scrollBox, function () {

            box.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });
            box.wrapper.css.alignItems = "stretch";
            // WHY: A box grows with its content only when the content is in the flow.
            box.wrapper.position = "relative";

                if (items.length == 0) {
                    Label({
                        plainText: box.emptyText.replace("{query}", query.trim()),
                        fontSize: _s.empty.fontSize,
                        textColor: _s.empty.textColor,
                        padding: _s.empty.padding,
                    });
                } else {
                    renderItems();
                    renderHint();
                }

            endGroup();

        });

    };

    const renderItems = function () {

        let lastGroup = "";

        items.forEach(function (item, index) {

            // LABEL: Group header
            if (box.showGroups == 1 && item.group && item.group != lastGroup) {
                lastGroup = item.group;
                Label({
                    plainText: String(item.group).toUpperCase(),
                    fontSize: _s.group.fontSize,
                    textColor: _s.group.textColor,
                    padding: _s.group.padding,
                });
                that.css = {
                    letterSpacing: _s.group.letterSpacing,
                    marginTop: (index > 0) ? SECTION_SPACE : "0px",
                };
            }

            // GROUP: One row
            const row = VGroup({
                width: "100%",
                height: "auto",
                align: "left top",
                gap: 0,
                padding: _s.item.padding,
                round: _s.item.round,
                color: _s.item.color,
            });
            row.cursor = "pointer";

            // WHY: mousedown, not click. The input loses the focus on mousedown and the list would
            //      already be closed before the click arrives.
            row.elem.addEventListener("mousedown", function (event) {
                event.preventDefault();
                box.selectIndex(index);
            });
            row.on("mouseover", function () { box.setActiveIndex(index); });

                if (typeof box.createItemView === "function") {
                    box.createItemView(item, index, box);
                } else {

                    Label({
                        plainText: item.text,
                        fontSize: _s.itemText.fontSize,
                        textColor: _s.itemText.textColor,
                        ellipsis: 1,
                    });

                    if (item.description) {
                        Label({
                            plainText: item.description,
                            fontSize: _s.itemDesc.fontSize,
                            textColor: _s.itemDesc.textColor,
                            ellipsis: 1,
                        });
                    }

                }

            endGroup();

            rows.push(row);

        });

    };

    const renderHint = function () {

        if (box.showHint != 1 || !box.hintText) return;

        Label({
            plainText: box.hintText,
            width: "100%",
            fontSize: _s.hint.fontSize,
            textColor: _s.hint.textColor,
            padding: _s.hint.padding,
        });
        that.css = {
            borderTop: "1px solid " + _s.hint.dividerColor,
            marginTop: SECTION_SPACE,
        };

    };

    // The width of the list: maxWidth, or the width of the anchor (matchAnchorWidth). Never wider than the screen.
    const getListWidth = function () {
        const screenWidth = page.width - (box.screenMargin * 2);
        const hasAnchor = (box.anchor && box.anchor.elem);
        if (box.matchAnchorWidth != 1 || !hasAnchor) return Math.min(box.maxWidth, screenWidth);
        const anchorWidth = withPageZoom(box.anchor.elem.getBoundingClientRect().width);
        return Math.min(anchorWidth, screenWidth);
    };

    // Under the anchor (over it when there is more room there), on the screen, as tall as its content up to the
    // maximum and to the room on the screen.
    const layout = function () {

        const padding = _s.box.padding || 0;
        const width = getListWidth(); // (as wide as the anchor: both values of anchorAlign give its left edge)
        box.width = width;

        // WHY: The height has to be a number, not "auto": the content is in a scrolling box and a
        //      box does not grow with it. It is also what the ScrollBar needs.
        // WHY: The border is in the height too. A basic.js box is border-box, so the scrolling box
        //      inside it was 2 px shorter than its content and the bar was shown for those 2 px,
        //      even when there was nothing to scroll.
        const border = _s.box.border || 0;
        const contentHeight = (box.wrapper) ? box.wrapper.elem.offsetHeight : 0;
        const fullHeight = contentHeight + (padding * 2) + (border * 2);
        const maxHeight = Math.round(window.innerHeight * box.maxHeightRatio);
        let height = Math.min(fullHeight, maxHeight);

        if (box.anchor && box.anchor.elem) {
            const rect = box.anchor.elem.getBoundingClientRect();
            const left = (box.anchorAlign === "left") ? withPageZoom(rect.left) : withPageZoom(rect.right) - width;
            box.left = Math.max(box.screenMargin, Math.min(left, page.width - width - box.screenMargin));
            // WHY the room: the list was always under the anchor, so under a field low on the screen its rows were
            //     below the window (the box itself out of the screen: they could not be scrolled up)
            const anchorTop = withPageZoom(rect.top);
            const anchorBottom = withPageZoom(rect.bottom);
            const roomBelow = page.height - anchorBottom - box.offsetY - box.screenMargin;
            const roomAbove = anchorTop - box.offsetY - box.screenMargin;
            const isAbove = (height > roomBelow && roomAbove > roomBelow);
            height = Math.min(height, Math.max(MIN_LIST_HEIGHT, isAbove ? roomAbove : roomBelow));
            box.top = isAbove ? anchorTop - box.offsetY - height : anchorBottom + box.offsetY;
        }

        box.height = height;

        if (box.scrollBar) box.scrollBar.refreshScroll();

    };

    // *** PUBLIC VARIABLES:

    // 1 while the list is open. [var]
    box.isOpened = 0;

    // *** PUBLIC FUNCTIONS:

    // items: [{ text, description, group, ... }]. The list opens by itself when there is something to show.
    box.setItems = function (newItems, searchedText = "") {

        // WHY: the same text again keeps the active row (it went back to the first one), and a list closed with Escape
        //      stays closed (it opened again)
        const isSameQuery = (String(searchedText) === String(query));
        const keptIndex = (isSameQuery && box.isOpened === 1) ? activeIndex : 0;
        if (!isSameQuery) isClosedByUser = 0;

        items = newItems || [];
        query = searchedText;

        const hasNothingToShow = (items.length == 0 && box.showEmpty != 1);
        if (!String(query).trim() || hasNothingToShow) {
            box.close();
            return;
        }

        if (isClosedByUser) return; // (Escape closed it: the same text keeps it closed, the focus opens it again)

        render();
        box.open();
        box.setActiveIndex((items.length) ? Math.min(Math.max(keptIndex, 0), items.length - 1) : -1);

    };

    box.getItems = function () {
        return items;
    };

    box.open = function () {

        if (!box.wrapper) render();

        box.zIndex = basic.zIndexAbove(box.anchor, box.zIndexValue); // WHY: a search field in a Dialog or a SidePanel opens its list over them
        box.visible = 1;
        layout();

        if (box.isOpened === 1) return;
        box.isOpened = 1;
        box.onOpen(box);

    };

    box.close = function () {
        box.visible = 0;
        activeIndex = -1;
        if (box.isOpened === 0) return;
        box.isOpened = 0;
        box.onClose(box);
    };

    box.setActiveIndex = function (index) {

        activeIndex = index;

        rows.forEach(function (row, i) {
            row.color = (i == index) ? _s.item.activeColor : _s.item.color;
        });

        const row = rows[index];
        if (row) row.elem.scrollIntoView({ block: "nearest" });

        box.onActiveChange(box, items[index] || null, index);

    };

    box.getActiveIndex = function () {
        return activeIndex;
    };

    // Moves the selection. It does not go around the ends.
    box.moveActive = function (delta) {
        if (items.length == 0) return;
        const index = Math.max(0, Math.min(activeIndex + delta, items.length - 1));
        box.setActiveIndex(index);
    };

    box.selectIndex = function (index) {
        const item = items[index];
        if (!item) return;
        box.close();
        box.onSelect(box, item, index);
    };

    box.selectActive = function () {
        box.selectIndex(Math.max(activeIndex, 0));
    };

    // Does the whole keyboard work of a search input. Returns the function that undoes it.
    box.attachTo = function (element) {

        if (!element) {
            console.error("SearchResults: attachTo() needs the input element.");
            return function () { };
        }

        box.detach();
        inputElem = element;

        const onKeyDown = function (event) {

            if (box.isOpened === 0) {
                if (event.key === "Escape") element.blur();
                return;
            }

            if (event.key === "ArrowDown") {
                event.preventDefault();
                box.moveActive(1);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                box.moveActive(-1);
            } else if (event.key === "Enter") {
                event.preventDefault();
                box.selectActive();
            } else if (event.key === "Escape") {
                event.preventDefault();
                box.close();
                isClosedByUser = 1;
            }

        };

        const onFocus = function () {
            isClosedByUser = 0;
            if (box.openOnFocus == 1 && String(query).trim() && items.length) box.open();
        };

        const onBlur = function () {
            if (box.closeOnBlur == 1) box.close();
        };

        element.addEventListener("keydown", onKeyDown);
        element.addEventListener("focus", onFocus);
        element.addEventListener("blur", onBlur);

        inputRemovers = [
            function () { element.removeEventListener("keydown", onKeyDown); },
            function () { element.removeEventListener("focus", onFocus); },
            function () { element.removeEventListener("blur", onBlur); },
        ];

        return box.detach;

    };

    box.detach = function () {
        inputRemovers.forEach(function (remove) { remove(); });
        inputRemovers = [];
        inputElem = null;
    };

    // Place it again. (After the anchor moved, ex: the bar got narrower.)
    box.refresh = function () {
        if (box.isOpened === 1) layout();
    };

    // 1: the list is as wide as the anchor, 0: as wide as maxWidth.
    box.setMatchAnchorWidth = function (value) {
        box.matchAnchorWidth = value;
        box.refresh();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        box.detach();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    box.props({
        left: 0,
        top: 0,
        width: box.maxWidth,
        height: 0,
        color: _s.box.color,
        border: _s.box.border,
        borderColor: _s.box.borderColor,
        round: _s.box.round,
        boxShadow: _s.box.boxShadow,
        clipContent: 1,
        visible: 0,
    });
    box.css.position = "fixed";
    box.zIndex = box.zIndexValue;
    box.role = "listbox";
    box.aria = { label: box.ariaLabel };

    // BOX: The part that scrolls. The content is created in it.
    box.scrollBox = Box(_s.box.padding, _s.box.padding, "100%", "100%", {
        color: "transparent",
        scrollY: 1,
    });
    box.scrollBox.css = {
        width: "calc(100% - " + (_s.box.padding * 2) + "px)",
        height: "calc(100% - " + (_s.box.padding * 2) + "px)",
    };

    // SCROLL BAR: basic/scroll-bar.js instead of the scrollbar of the browser.
    if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollBox, neverHide: 0, showDots: 0 }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.onPageResize(function () { box.refresh(); }); // (removed with the box)

    const results = endObject(box);

    // WHY: The container was moved to the page above. The caller goes on with its own container.
    setDefaultContainerBox(previousContainer);

    return results;

};

// *** STYLE PACKAGES:
// USAGE: SearchResults({ styleName: "dark" })
// USAGE: SearchResults({ styleName: "dark", style: { box: { color: "tomato" } } }) // Change only some keys.
// USAGE: SearchResults({ style: SearchResults.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SearchResults.styles.myStyle = { box: { color: "red" } };

SearchResults.styles = {

    // White list, gray text.
    light: SearchResultsDefaults.style,

    // Dark list. The same colors as the "dark" Tabs, Stepper and SidePanel.
    dark: {
        box: { color: "#1A1A19", border: 1, borderColor: "rgba(255, 255, 255, 0.14)", round: 10, padding: 6, boxShadow: "0px 12px 32px rgba(0, 0, 0, 0.5)" },
        group: { fontSize: 10, textColor: "rgba(255, 255, 255, 0.4)", padding: [12, 6], letterSpacing: "1px" },
        item: { padding: [12, 6], round: 6, color: "transparent", activeColor: "rgba(255, 255, 255, 0.08)" },
        itemText: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.92)" },
        itemDesc: { fontSize: 12, textColor: "rgba(255, 255, 255, 0.45)" },
        empty: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.5)", padding: [14, 12] },
        hint: { fontSize: 11, textColor: "rgba(255, 255, 255, 0.35)", padding: [12, 8], dividerColor: "rgba(255, 255, 255, 0.08)" },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

    // Round corners, cadetblue. The same colors as the modern Tabs and Stepper.
    modern: {
        box: { color: White(1), border: 0, borderColor: "transparent", round: 14, padding: 8, boxShadow: "0px 14px 40px rgba(47, 95, 97, 0.22)" },
        group: { fontSize: 10, textColor: "#6E9A9B", padding: [12, 6], letterSpacing: "1px" },
        item: { padding: [12, 8], round: 10, color: "transparent", activeColor: "#EEF5F5" },
        itemText: { fontSize: 14, textColor: "#2F5F61" },
        itemDesc: { fontSize: 12, textColor: "#6E9A9B" },
        empty: { fontSize: 13, textColor: "#6E9A9B", padding: [14, 12] },
        hint: { fontSize: 11, textColor: "#6E9A9B", padding: [12, 8], dividerColor: "#E3ECEC" },
        scrollBar: { bar_color: "#CFE2E2", bar_mouseOverColor: "cadetblue", bar_width: 4, bar_round: 3, bar_opacity: 0.6, bar_mouseOverOpacity: 1, bar_padding: 2 },
    },

};
SearchResults.styles.classic = SearchResults.styles.light; // the old name of light: the pages made with it keep their look
