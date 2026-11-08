/* Bismillah */

/*

ScrollArea - v26.11

UI COMPONENT
- A box whose content scrolls: the page of a window, a list between a bar at the top and a bar at the bottom. Start it
  like VGroup and close it with endGroup(): the objects go into its content (a VGroup: align, gap, padding), one under
  the other, and they scroll when they are taller than the area.
- On a box (the page): it fills it (0, 0, 100%, 100%). In a group: it takes the room the other objects leave (the height
  left in a VGroup, the width left in an HGroup), so a column of a MenuBar, a ScrollArea and a StatusBar needs no css.
  A size of its own (height: 300) wins. (A group with height: "auto" leaves no room: give the area a height there.)
- scrollY: 1 (default) scrolls down. scrollX: 1 scrolls to the side too: what can wrap (a text, a group with wrap: 1)
  wraps at the width of the area, what can not (a wide table, a row of tiles) scrolls.
- The scroll bar of the kit (basic/scroll-bar.js), when it is loaded. Without it the area scrolls with the wheel and the
  finger, with no bar (basic.css hides the bar of the browser).
- Objects added later: createIn(area.content, function () { ... }). The place: scrollToTop(), scrollToEnd(),
  scrollToObject(obj), getScrollTop() / setScrollTop(), onScroll.
- The look of the area is the one of a Box (color, border, round): give it in the params. Its padding is the one of the
  content: it scrolls with it.
- Style packages (the scroll bar): "light" (default), "dark" (a light bar), "minimal", "minimalDark" (a thin bar
  without the dots). Select with styleName. (ScrollArea.styles)

USAGE:
ScrollArea({ align: "center top", gap: 20, padding: 40 }); // the whole window
    Label({ text: "A long page" });
endGroup();

VGroup({ gap: 0 });
    MenuBar({ menus: [{ text: "File", items: ["Open", "Save"] }] });
    ScrollArea({ gap: 8, padding: 16 }); // the height between the two bars
        Label({ text: "A row" });
    endGroup();
    StatusBar({ messageText: "Ready" });
endGroup();

const list = ScrollArea({ height: 300, styleName: "dark", onScroll: function (self) { println(self.getScrollTop()); } });
endGroup();
createIn(list.content, function () { Label({ text: "Added later" }); });
list.scrollToEnd();

ScrollArea({ height: 120, scrollX: 1, scrollY: 0 }); // only to the side
    HGroup({ hug: 1, gap: 8 });
        Label({ text: "A wide row" });
    endGroup();
endGroup();

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ScrollAreaDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0, // The place on a box (the page). In a group, the group places it.
    top: 0,
    width: "100%", // "100%" in an HGroup: the width the other objects leave.
    height: "100%", // "100%" in a VGroup: the height the other objects leave.
    align: "left top", // The content, as in a VGroup: "center top", "center center" (in the middle while it fits)...
    gap: 0, // px between the objects of the content
    padding: 0, // Around the content, it scrolls with it: 40, [x, y] or [left, top, right, bottom]
    scrollY: 1, // 1: it scrolls down.
    scrollX: 0, // 1: it scrolls to the side too.
    useScrollBar: 1, // 1: the ScrollBar of the kit, when basic/scroll-bar.js is loaded. (Only at create time)
    onScroll: function (self) { }, // The content moved. (self.getScrollTop())
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to ScrollArea.styles
    style: { // Light style package (default)
        scrollBar: {}, // The params of ScrollBar (basic/scroll-bar.js). {}: its own look, the bar of the pages of the kit.
    },
};

const ScrollArea = function (params = {}) {

    // Merge style package: params.style > ScrollArea.styles[styleName] > ScrollAreaDefaults.style (light)
    basic.applyStylePackage(params, ScrollArea.styles, ScrollAreaDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ScrollAreaDefaults);

    // Edit params, if needed:
    // WHY here: after startObject() the open container is the area, and box.width / box.height are measured numbers.
    const flow = ScrollArea.flowOf(getDefaultContainerBox());
    const isFillingHeight = (flow === "column" && String(params.height) === "100%");
    const isFillingWidth = (flow === "row" && String(params.width) === "100%");

    // BOX: Component container (the frame of the area: its place and its look)
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    const _s = box.style;

    // *** PUBLIC VARIABLES:
    box.scrollBox = null; // The Box that scrolls
    box.content = null; // The VGroup of the objects: createIn(area.content, fn)
    box.scrollBar = null; // The ScrollBar, or null (useScrollBar: 0, or no basic/scroll-bar.js)
    // NOTE: Default values are also public variables. (box.align, box.gap, box.scrollY...)

    // *** PRIVATE FUNCTIONS:

    // LAYOUT: in a group the area takes the room the other objects leave.
    // WHY flex-basis 0 and the minimum 0: otherwise a flex item is as large as its content; the content must scroll in
    //     the room, not make it larger.
    const fillTheRoom = function () {
        box.grow = 1;
        if (isFillingHeight) {
            box.height = "auto";
            box.css = { flexBasis: "0px", minHeight: "0px" };
        }
        if (isFillingWidth) {
            box.width = "auto";
            box.css = { flexBasis: "0px", minWidth: "0px" };
        }
    };

    // The content goes into the box that scrolls and stays started: the objects until endGroup() go into it.
    // WHY made in the container of the area, then moved: endGroup() goes back to the box that was open when the group
    //     was started (the start stack of basic.js), so the next objects of the page go there, not into the area.
    // WHY saveCurrentThat: "that" stays the area, as after any component.
    // WHY clipContent 0: the box that scrolls cuts at the edges of the area; the content does not cut a second time.
    const startContent = function () {
        saveCurrentThat();
        box.content = VGroup({ width: "100%", height: "auto", align: box.align, gap: box.gap, color: "transparent", clipContent: 0 });
        box.scrollBox.add(box.content);
        box.content.position = "absolute";
        box.content.left = 0;
        box.content.top = 0;
        // WHY the minimum: an align "... center" puts a short content in the middle; a tall one grows and scrolls.
        box.content.css.minHeight = "100%";
        restoreThatFromSaved();
    };

    // PADDING: the one of the content, which scrolls with it.
    // WHY not on the area too: a padding keeps a box at least as large as it. (area.padding keeps the value of the page.)
    const applyPadding = function () {
        box.css.padding = "0px";
        box.content.padding = box.padding;
    };

    // SCROLL: the box that scrolls takes the axes of the area. (The area keeps them too, so area.scrollY reads them; it
    //     has nothing to scroll itself.) An axis that is turned off goes back to its start.
    // WHY "fit-content" to the side: what can wrap (a text, a group with wrap: 1) still wraps at the width of the area,
    //     what can not (a wide table, a row of tiles) makes the content wider, so it scrolls and nothing in the middle
    //     is cut on the left. ("max-content" would put every wrap on one line.)
    // WHY not clickable: scrollY / scrollX make the area clickable (basic.js); the box that scrolls over it takes the
    //     mouse, the area is only its frame.
    const applyScrollAxes = function () {
        box.clickable = 0;
        box.scrollBox.scrollY = box.scrollY;
        box.scrollBox.scrollX = box.scrollX;
        if (box.scrollY != 1) box.scrollBox.elem.scrollTop = 0;
        if (box.scrollX != 1) box.scrollBox.elem.scrollLeft = 0;
        box.content.width = (box.scrollX == 1) ? "fit-content" : "100%";
        box.content.css.minWidth = (box.scrollX == 1) ? "100%" : "";
        if (box.scrollBar) box.scrollBar.refreshScroll();
    };

    // *** PUBLIC FUNCTIONS:

    box.setAlign = function (value) {
        box.align = value;
        box.content.align = value;
    };
    // USAGE: area.setAlign("center center") // a short content in the middle

    box.setGap = function (value) {
        box.gap = value;
        box.content.gap = value;
    };
    // USAGE: area.setGap(12)

    box.setPadding = function (value) {
        box.padding = value;
        applyPadding();
    };
    // USAGE: area.setPadding([16, 24]) // [x, y]

    box.setScrollY = function (value) {
        box.scrollY = basic.isOn(value) ? 1 : 0;
        applyScrollAxes();
    };
    // USAGE: area.setScrollY(0) // it does not scroll down any more

    box.setScrollX = function (value) {
        box.scrollX = basic.isOn(value) ? 1 : 0;
        applyScrollAxes();
    };
    // USAGE: area.setScrollX(1) // to the side too

    box.getScrollTop = function () {
        return box.scrollBox.elem.scrollTop;
    };

    box.setScrollTop = function (value) {
        box.scrollBox.elem.scrollTop = value;
    };
    // USAGE: const top = area.getScrollTop(); ... area.setScrollTop(top) // back to the same place

    box.scrollToTop = function () {
        box.scrollBox.elem.scrollTop = 0;
        box.scrollBox.elem.scrollLeft = 0;
    };

    // The end of the content: its bottom (an area that scrolls only to the side: its right end).
    box.scrollToEnd = function () {
        const elem = box.scrollBox.elem;
        if (box.scrollY == 1) {
            elem.scrollTop = elem.scrollHeight;
            return;
        }
        elem.scrollLeft = elem.scrollWidth;
    };
    // USAGE: chat.scrollToEnd() // the last message

    // An object of the content comes into view, and the area moves as little as it can.
    // WHY not elem.scrollIntoView(): it moves the page and every box that scrolls around the area too.
    box.scrollToObject = function (obj) {
        const elem = box.scrollBox.elem;
        if (!obj || !obj.elem || !elem.contains(obj.elem)) return;
        const view = elem.getBoundingClientRect();
        const place = obj.elem.getBoundingClientRect();
        elem.scrollTop += ScrollArea.distanceToShow(place.top - view.top, place.bottom - view.top, elem.clientHeight);
        elem.scrollLeft += ScrollArea.distanceToShow(place.left - view.left, place.right - view.left, elem.clientWidth);
    };
    // USAGE: form.scrollToObject(nameField) // the first field to fill

    // *** OBJECT VIEW:

    if (isFillingHeight || isFillingWidth) fillTheRoom();

    // BOX: The box that scrolls (the content is moved into it by startContent)
    box.scrollBox = Box(0, 0, "100%", "100%", { color: "transparent" });

    // SCROLL BAR: the one of the kit, over the box that scrolls. (It is made in the area, so remove() takes it.)
    if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollBox }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.scrollBox.on("scroll", function () {
        box.onScroll(box);
    });

    endObject(box);

    // GROUP: The content, left started for the objects of the page (endGroup() closes it)
    startContent();
    applyPadding();
    applyScrollAxes();

    return box;

};

// *** STATIC VARIABLES AND FUNCTIONS:

// The flow of the container an object is made in: "column" (a VGroup), "row" (an HGroup) or "" (a box, the page).
ScrollArea.flowOf = function (container) {
    const direction = (container && container.elem) ? container.elem.style.flexDirection : "";
    if (direction.indexOf("column") === 0) return "column";
    if (direction.indexOf("row") === 0) return "row";
    return "";
};

// How far an area moves so that a part (from start to end: px from its top or its left) is seen in its size.
// A part larger than the area shows its start.
ScrollArea.distanceToShow = function (start, end, size) {
    if (start < 0) return start;
    if (end > size) return Math.min(end - size, start);
    return 0;
};

// *** STYLE PACKAGES:
// USAGE: ScrollArea({ styleName: "dark" })
// USAGE: ScrollArea({ style: { scrollBar: { neverHide: 0 } } }) // any param of ScrollBar
ScrollArea.styles = {

    // The bar of the pages of the kit: dark gray, a dot at each end.
    light: ScrollAreaDefaults.style,

    // For a dark page: a light bar.
    dark: {
        scrollBar: { bar_color: "#CFCFCD", bar_mouseOverColor: "#CFCFCD" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): a thin bar without the dots. MinimalAccent makes the packages of a
// color of the page with the same function (the bar stays gray).
ScrollArea.createMinimalStyle = function (colors) {
    return {
        scrollBar: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_mouseOverWidth: 4, showDots: 0 },
    };
};
ScrollArea.MINIMAL_COLORS = { scrollBar: "#373836" };
ScrollArea.styles.minimal = ScrollArea.createMinimalStyle(ScrollArea.MINIMAL_COLORS);
ScrollArea.MINIMAL_DARK_COLORS = { scrollBar: "#CFCFCD" };
ScrollArea.styles.minimalDark = ScrollArea.createMinimalStyle(ScrollArea.MINIMAL_DARK_COLORS);
