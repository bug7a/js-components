/* Bismillah */

/*

ItemList - v26.11

UI COMPONENT TEMPLATE
- NEW PROJECTS: use styleName "ozden" on a light page (the default: rows that are white with a thin line above
  and under them under the mouse; its search box the ozden SearchInput in white) and "ozdenDark" on a dark page (02-comp-examples/item-list.htm), unless the user asks for
  another look.
- A list of items: an icon, a title and a description on every row, or your own row (createItemView).
- Layouts: "vertical" (a list), "horizontal" (one row of tiles: categories, cards) and "grid" (tiles that
  wrap: files, icons, pictures). setLayout() changes it later.
- Selection: "single", "multiple" or "none". The selected keys: getSelectedKeys(), the items: getSelected().
  style.selected.canSelectAgain: 0 (ozden, ozdenDark; light and dark: 1): in a single list the selected row can not
  be chosen again: a click, Enter or Space does nothing (no onItemClick), no look under the mouse, no hand cursor.
  The keys can still go to it (its focus ring; a screen reader reads it as selected).
  onChange(self, selectedItems) is NOT called at create time, by setItems() or with silent: 1.
- Search box: showSearch: 1 puts a SearchInput (comp/search-input.js, load it first) over the list;
  its look is style.search, more params in searchParams (Ex: the icon paths for your page). box.searchInput.
- Search: search(text) shows only the matching items (text, description and searchText; Turkish letters are
  matched without their marks: "isik" finds "Işık"). It returns the count of the shown items.
- Keyboard (a listbox): the arrow keys move the focus (Up / Down in a list, Left / Right in a row, all four in a
  grid), Home / End, PageUp / PageDown (a page of rows), letters (type-ahead: the next item whose text starts with
  them). Enter or Space is a click (onItemClick and the selection). Only one row is in the Tab order: the focused
  one, or the first selected one, or the first one. multiple: Shift + a move, Shift + Space and Shift + click select
  the rows from the last clicked one; Ctrl / Cmd + A selects all the shown items (again: none). With a search box:
  the arrow down goes from it into the list, the arrow up from the first line back to it, Escape clears it.
- A combobox whose keyboard stays in its field (SelectBox) shows its active row with setActiveKey(key): the look of
  the mouse (style.hover), also on a selected row, and only on that row. null: none.
- Items: strings or objects { key, text, description, iconFile, searchText, enabled }. Any other keys stay on the
  item for your createItemView. An item without a key gets its index as its key. style.title and style.desc are the
  look of its text and its description.
- Sections: an item { type: "section", text: "VIEWS" } is a title row between the items (style.section). It is
  never selected, focused, hovered or clicked, the arrow keys skip it, and getSelected(), search() and the empty
  text count only the items. It is shown while at least one item under it (until the next section) is shown: in
  a search, only the sections with a match (a section without items is hidden too).
  ItemList draws it, also with createItemView: createItemView gets only the items (a function written for your
  items does not break on a title). Your own section row: createSectionView(item, row, self).
  getItems() and forEach() give the sections too (item.type === "section").
- Pressed: style.pressed.color (null: none). A click, Enter or Space paints the row in this color at once, then
  the row fades back to its look with the row motion (style.row.motion).
- animated: 1 -> addItem() and removeItem() move the other rows to their new places (FLIP: transform), a new row
  fades in from a little higher, a removed row fades out and then leaves (its data and the counts change at once).
  Nothing moves at create time, with setItems() or with a search. Off when the system asks for reduced motion.
  setAnimated(0/1).
- height: "auto" -> The list grows with its rows (no scrolling). Otherwise it scrolls with basic/scroll-bar.js
  (if it is loaded).
- Style packages: "ozden" (default; the name "classic" still works), "ozdenDark" (the same on a dark page), "gallery" and
  "galleryDark" (pictures: layout "grid", a big photo on every tile with its title under it),
  "light" and "dark" (the light and dark look of the kit: a white box with one thin line, flat 56 px rows, the
  selected one in a tint of the accent with a full mark: _designs/item-list.htm), "minimal" and "minimalDark"
  (lines, 28 px rows: _designs/minimal-theme.htm).
  Select with styleName. (ItemList.styles)

USAGE:
const list = ItemList({
    width: 360,
    height: 400,
    items: [
        { key: "broccoli", text: "Broccoli", description: "Vegetable", iconFile: "assets/fruids/brokoli.png" },
        { key: "strawberry", text: "Strawberry", description: "Fruit", iconFile: "assets/fruids/cilek.png" },
    ],
    onChange: function (self, selectedItems) { println(self.getSelectedKeys()); },
});
list.search("fruit");                       // 1 (the count of the shown items)
list.setSelected(["broccoli"], 1);          // silent: onChange is not called
list.addItem({ key: "tomato", text: "Tomato", description: "Vegetable" });
list.updateItem("tomato", { description: "Fruit, really" });
list.setLayout("grid");
ItemList({ selection: "multiple", styleName: "light" });
ItemList({ layout: "horizontal", height: 200, styleName: "dark" });
ItemList({ showSearch: 1, searchParams: { placeholder: "Ara" } });
ItemList({
    style: { row: { height: "auto" } },
    createItemView: function (item, row, self) {     // Objects created here go into the row.
        Label({ plainText: item.text, fontSize: 18 });
    },
});
ItemList({ items: [{ type: "section", text: "FRUITS" }, "Apple", "Banana", { type: "section", text: "VEGETABLES" }, "Carrot"] });
ItemList({ style: { hover: {} } }); // No look under the mouse
ItemList({ selection: "none", style: { pressed: { color: Black(0.2) }, row: { motion: "background-color 0.3s" } } });
const animatedList = ItemList({ animated: 1, items: ["A", "B", "C"] });
animatedList.removeItem("0");               // "A" fades out, then "B" and "C" move up

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ItemListDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 600,
    height: 400, // "auto": grows with the rows (no scrolling)
    items: [], // Strings or { key, text, description, iconFile, searchText, enabled }. A title row: { type: "section", text: "VIEWS" }
    layout: "vertical", // "vertical", "horizontal", "grid"
    selection: "single", // "single", "multiple", "none"
    selectedKeys: [], // The keys selected at create time
    scrollToSelected: 1, // 1: the list scrolls to the selected item at create time and after setSelected() / select()
    createItemView: null, // function (item, row, self) { ... } Objects created here go into the row (instead of the icon and texts). Not called for a section.
    createSectionView: null, // function (item, row, self) { ... } Your own section row (instead of its title)
    animated: 0, // 1: addItem / removeItem move the rows (a new row fades in, a removed one fades out). setAnimated(0/1)
    showSearch: 0, // 1: a search box over the list (comp/search-input.js SearchInput must be loaded)
    searchParams: {}, // More params of the SearchInput. Ex: { placeholder: "Ara", searchIconFile: "../comp/search-input/search.svg" }
    emptyText: "No items",
    noResultText: "No results",
    enabled: 1,
    useScrollBar: 1, // basic/scroll-bar.js. 0: the scrollbar of the browser.
    ariaLabel: "List",
    onItemClick: function (self, item, index, event) { },
    onChange: function (self, selectedItems) { }, // Not at create time, not by setItems(), not with silent: 1
    styleName: "ozden", // "ozden", "ozdenDark", "light", "dark", "gallery", "galleryDark", "minimal", "minimalDark" or a name added to ItemList.styles
    style: { // The ozden style package (default)
        box: {
            color: "whitesmoke", // WHY: A row is white under the mouse: on a white page a list with no color of its own shows nothing.
            border: 1,
            borderColor: "rgba(20, 20, 20, 0.45)",
            round: 6,
            padding: 0, // Around the rows of the vertical layout
        },
        list: {
            gap: 0, // Between the rows of the vertical layout
        },
        // A row of the vertical layout:
        // as wide as the list, white under the mouse with a thin line above and under it, the selected one half transparent.
        row: {
            height: 80, // "auto": as high as its content (a createItemView)
            padding: [20, 12],
            gap: 15,
            color: "transparent",
            border: 0,
            borderColor: "transparent",
            round: 0,
            opacity: 1,
            boxShadow: "",
            lineColor: "", // A line at the top and at the bottom of the row (1 px, inside it: no row moves). "": none
            motion: "background-color 0.2s, box-shadow 0.2s", // WHY: box-shadow: the lines come and go with the color.
        },
        // An item of the horizontal and grid layouts: the icon on top, the texts under it
        // (the category items of the home page of the template)
        tile: {
            width: 125,
            height: 190, // "auto": as high as its content
            padding: [4, 30],
            gap: 15,
            spacing: 4, // Between the tiles
            listPadding: [12, 5], // Around the tiles
            iconSize: 70,
            frameSize: 90, // A circle behind the icon. 0: no circle
            frameColor: White(0.3),
            frameRound: 100,
            iconFilter: "grayscale(100%)", // "": none
            iconFit: "", // How a picture fills its square: "cover" (a photo), "contain". "": as the Icon does
            iconMotion: "transform 0.3s",
            hover: {}, // The look under the mouse (the rows use style.hover)
            selectedColor: "white", // "": the color of style.selected (the rows)
            selectedFrameColor: "transparent",
            selectedIconScale: 1.5,
            selectedIconFilter: "grayscale(30%)",
            selectedFontFamily: "opensans-bold", // "": the font does not change
        },
        // A section: an item { type: "section", text: "VIEWS" }, a title between the items
        section: {
            height: "auto",
            padding: [20, 8],
            fontSize: 16,
            fontFamily: "opensans-bold",
            textColor: Black(0.4),
        },
        // A state: only the keys that change
        hover: { color: "white", lineColor: Black(0.2) }, // style: { hover: {} }: no look under the mouse.
        pressed: { color: null }, // A click, Enter or Space: this color at once, then it fades back (style.row.motion). null: none
        // WHY: a selected row does not get the white and its lines under the mouse.
        // canSelectAgain 0 (single, as SelectBox ozden): it can not be
        // chosen again: a click, Enter or Space does nothing (no onItemClick), no look under the mouse, no hand.
        selected: { color: "transparent", lineColor: "", opacity: 0.5, canSelectAgain: 0 },
        disabled: { opacity: 0.4 },
        focus: { ringColor: "rgba(55, 56, 54, 0.5)" }, // The ring of the keyboard focus
        icon: { size: 50, round: 4, color: "transparent" },
        title: { fontSize: 20, textColor: "rgba(0, 0, 0, 0.8)", fontFamily: "", selectedTextColor: "" },
        desc: { fontSize: 14, textColor: "gray", marginTop: -4 }, // WHY -4: the title and the description overlap a little.
        check: { visible: 0, size: 22, color: "#373836", iconColor: "white", borderColor: Black(0.25) }, // A mark on the selected rows
        empty: { fontSize: 16, textColor: Black(0.4) },
        // The search box (showSearch: 1): the params of SearchInput: its ozden package (its font and icon sizes, its
        // icons, its bottom line), white, nearly square and without a border, 44 px high (ozdenDark takes it too).
        search: {
            styleName: "ozden", // A package of SearchInput.styles
            height: 44,
            padding: [0, 0, 0, 0], // left, top, right, bottom: 0, as wide as the list
            color: "white",
            border: 0, // WHY: the list has its own border: only the bottom line of the package
            round: 2,
        },
        scrollBar: {
            bar_border: 0,
            bar_round: 3,
            bar_borderColor: "rgba(0, 0, 0, 1)",
            bar_width: 4,
            bar_mouseOverWidth: 4,
            bar_mouseOverColor: "#373836",
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
            bar_color: "#373836",
            neverHide: 1,
            showDots: 1,
        },
    },
};

const ItemList = function (params = {}) {

    // WHY read first: the merges below would fill an empty hover with the color of the package.
    const givenHover = params.style && params.style.hover;
    const isHoverOff = !!givenHover && Object.keys(givenHover).length === 0;

    // Merge style package: params.style > ItemList.styles[styleName] > ItemListDefaults.style (ozden)
    basic.applyStylePackage(params, ItemList.styles, ItemListDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ItemListDefaults);
    if (isHoverOff) params.style.hover = {};

    // Edit params, if needed:
    const startItems = Array.isArray(params.items) ? params.items.slice() : []; // WHY: A copy: the array of the caller does not change.
    const startKeys = Array.isArray(params.selectedKeys) ? params.selectedKeys.slice() : [];
    const isAutoHeight = (params.height === "auto"); // WHY: Read before startObject: box.height gives the measured height.

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let entries = []; // { key, item, data, row, isShown, isHover, isSection, isPressed, isLeaving }
    let removedEntries = []; // animated: the removed items whose rows still fade out (they leave after the motion)
    let selectedKeys = []; // Strings, in the order they were selected
    let focusedKey = null;
    let activeKey = null; // The active row of a combobox (setActiveKey)
    let anchorKey = null; // multiple: a Shift range starts at this row (the last click, Enter or Space without Shift)
    let rangeBaseKeys = []; // multiple: the selection at that time (a Shift range is added to it)
    let typedText = ""; // Type-ahead: the letters typed one after the other
    let cancelTypedText = null;
    let searchText = "";
    let wasAnimated = 0;
    const EMPTY_TEXT_TOP = 24; // The "No results" text under the top of the list
    const PRESS_HOLD_TIME = 50; // ms: the pressed color stays this long, then it fades back with the row motion
    const TYPE_AHEAD_TIME = 600; // ms: the letters typed in this time make one word

    // animated: 1
    const MOTION_TIME = 0.25; // s
    const MOTION_MS = MOTION_TIME * 1000;
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start and a soft stop
    const FADE_MOTION = "opacity " + MOTION_TIME + "s " + MOTION_EASE;
    const MOVE_MOTION = "transform " + MOTION_TIME + "s " + MOTION_EASE;
    const COMING_ROW_SHIFT = 6; // px: a new row comes from a little higher

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.layout, box.selection, box.enabled...)

    // *** PRIVATE FUNCTIONS:

    const LAYOUTS = ["vertical", "horizontal", "grid"];

    // WHY: An unknown layout was drawn as a list but the arrow keys moved like in a grid.
    const normalizeLayout = function (layout) {
        if (LAYOUTS.includes(layout)) return layout;
        console.warn("ItemList: unknown layout \"" + layout + "\", \"vertical\" is used.");
        return "vertical";
    };

    const isTileLayout = function () {
        return box.layout === "horizontal" || box.layout === "grid";
    };

    const toItemObject = function (item) {
        if (typeof item === "string") return { text: item };
        return item || {};
    };

    // An item { type: "section" } is a title row between the items.
    const isSectionData = function (data) {
        return (data.type === "section") ? 1 : 0;
    };

    const toEntry = function (item, index) {
        const object = toItemObject(item);
        const key = (object.key !== undefined && object.key !== null) ? String(object.key) : String(index);
        return { key: key, item: item, data: object, row: null, isShown: 1, isHover: 0, isSection: isSectionData(object) };
    };

    const findEntry = function (key) {
        return entries.find(function (e) { return e.key === String(key); }) || null;
    };

    const indexOf = function (entry) {
        return entries.indexOf(entry);
    };

    const isSelected = function (entry) {
        return selectedKeys.includes(entry.key);
    };

    const isEntryEnabled = function (entry) {
        return box.enabled == 1 && (entry.data.enabled === undefined || basic.isOn(entry.data.enabled));
    };

    // single, style.selected.canSelectAgain: 0 (ozden): the selected row can not be chosen again.
    const isLockedEntry = function (entry) {
        return box.selection === "single" && _s.selected.canSelectAgain == 0 && isSelected(entry);
    };

    // A row a click, Enter or Space chooses: enabled, not the locked selected one.
    const isEntryChoosable = function (entry) {
        return isEntryEnabled(entry) && !isLockedEntry(entry);
    };

    const getSelectedItems = function () {
        return selectedKeys.map(findEntry).filter(Boolean).map(function (e) { return e.item; });
    };

    // The items (not the sections)
    const getItemEntries = function () {
        return entries.filter(function (e) { return !e.isSection; });
    };

    // *** SEARCH

    // "Işık" and "isik" are the same for the search.
    const normalizeText = function (text) {
        return String(text || "")
            .toLocaleLowerCase("tr")
            .replace(/i̇/g, "i")
            .replace(/ı/g, "i")
            .replace(/ç/g, "c")
            .replace(/ğ/g, "g")
            .replace(/ş/g, "s")
            .replace(/ü/g, "u")
            .replace(/ö/g, "o");
    };

    const getSearchableText = function (entry) {
        const data = entry.data;
        return normalizeText([data.text, data.description, data.searchText].join(" "));
    };

    const isMatch = function (entry) {
        if (!searchText) return 1;
        return getSearchableText(entry).includes(searchText) ? 1 : 0;
    };

    // Which rows are shown: the items that match the search, and a section while an item under it is shown.
    const computeShown = function () {
        let section = null;
        entries.forEach(function (e) {
            if (e.isSection) {
                section = e;
                e.isShown = 0;
                return;
            }
            e.isShown = isMatch(e);
            if (e.isShown && section) section.isShown = 1;
        });
    };

    // *** DRAWING

    // The colors of a row in its state. A tile has its own hover and selected color (style.tile).
    const getLook = function (entry, isOn) {
        const isTile = entry.row.isTile;
        const hoverLook = isTile ? _s.tile.hover : _s.hover;
        const selectedLook = isTile ? { color: _s.tile.selectedColor || _s.selected.color, borderColor: _s.selected.borderColor } : _s.selected;
        // WHY: The active row takes the look of the mouse after the selection: the keyboard sees it on a selected row too.
        // WHY: The locked selected row gets no look of the mouse (canSelectAgain: 0).
        const isLocked = isLockedEntry(entry);
        const activeLook = (entry.key === activeKey && !isLocked) ? hoverLook : {};
        const mouseLook = (entry.isHover && !isLocked) ? hoverLook : {};
        const look = Object.assign({}, _s.row, mouseLook, isOn ? selectedLook : {}, activeLook);
        if (look.opacity === undefined) look.opacity = 1;
        // WHY: In the look, not only in the click: a paint of the selection or of the mouse keeps the pressed color.
        if (entry.isPressed && _s.pressed.color) look.color = _s.pressed.color;
        return look;
    };

    // The look of the state of one row: normal, hover, pressed, selected, disabled.
    const paintRow = function (entry) {
        const row = entry.row;
        // WHY: A section has no state; a row that fades out keeps fading.
        if (!row || entry.isSection || entry.isLeaving) return;
        const isOn = isSelected(entry);
        const look = getLook(entry, isOn);

        row.color = look.color;
        row.borderColor = look.borderColor;
        paintLines(row, look.lineColor || "");
        row.cursor = isEntryChoosable(entry) ? "pointer" : "default";
        row.css.opacity = String(isEntryEnabled(entry) ? look.opacity : _s.disabled.opacity);
        row.aria = { selected: isOn ? "true" : "false", disabled: isEntryEnabled(entry) ? "false" : "true" };

        if (row.lblTitle) row.lblTitle.textColor = (isOn && _s.title.selectedTextColor) ? _s.title.selectedTextColor : _s.title.textColor;
        if (row.check) paintCheck(row.check, isOn);
        if (row.isTile) paintTile(row, isOn);
    };

    // The lines at the top and at the bottom of a row (look.lineColor): inset shadows, so no row moves.
    // WHY: Only when the lines change: the own shadow of a row (style.row.boxShadow, or one set by createItemView)
    //      stays under them, and a package without lines never touches it.
    const paintLines = function (row, lineColor) {
        const shownLineColor = row.shownLineColor || "";
        if (lineColor === shownLineColor) return;
        if (!shownLineColor) row.ownShadow = row.boxShadow;
        row.shownLineColor = lineColor;
        const shadows = [];
        if (lineColor) shadows.push("inset 0 1px 0 " + lineColor, "inset 0 -1px 0 " + lineColor);
        if (row.ownShadow) shadows.push(row.ownShadow);
        row.boxShadow = shadows.join(", ");
    };

    // The effects of a selected tile: the circle goes, the icon grows and gets its colors, the title is bold.
    const paintTile = function (row, isOn) {
        const tile = _s.tile;
        if (row.iconFrame) row.iconFrame.color = isOn ? tile.selectedFrameColor : tile.frameColor;
        if (row.icon) {
            row.icon.css.filter = (isOn ? tile.selectedIconFilter : tile.iconFilter) || "none";
            row.icon.css.transform = "scale(" + (isOn ? tile.selectedIconScale : 1) + ")";
        }
        if (row.lblTitle && tile.selectedFontFamily) {
            row.lblTitle.fontFamily = isOn ? tile.selectedFontFamily : (_s.title.fontFamily || "opensans");
        }
    };

    const paintCheck = function (check, isOn) {
        check.color = isOn ? _s.check.color : "transparent";
        check.borderColor = isOn ? _s.check.color : _s.check.borderColor;
        check.text = isOn ? ItemList.getCheckSvg(_s.check.iconColor, _s.check.size * 0.6) : "";
    };

    const paintAll = function () {
        entries.forEach(paintRow);
    };

    // The row of the Tab order: the focused one, or else the first selected shown one, or else the first shown one.
    // WHY: A listbox is entered at its selection, not always at its top.
    const getTabEntry = function () {
        const focused = findEntry(focusedKey);
        if (focused && focused.isShown) return focused;
        const shown = getShownEntries();
        return shown.find(isSelected) || shown[0] || null;
    };

    // Only one row is in the Tab order (getTabEntry).
    const refreshTabOrder = function () {
        const tabEntry = getTabEntry();
        entries.forEach(function (e) {
            // WHY: A section gets no tabIndex: even a click does not focus it.
            if (!e.row || e.isSection) return;
            e.row.tabIndex = (box.enabled == 1 && e === tabEntry) ? 0 : -1;
        });
    };

    const createIcon = function (entry, size) {
        if (!entry.data.iconFile) return null;
        const icon = Icon({ width: size, height: size, color: _s.icon.color, round: _s.icon.round, position: "relative" });
        icon.shrink = 0;
        icon.load(entry.data.iconFile);
        return icon;
    };

    const fitTileIcon = function (row) {
        if (row.icon && _s.tile.iconFit) row.icon.imageFit = _s.tile.iconFit;
    };

    // A tile icon may sit in a circle (style.tile.frameSize).
    const createTileIcon = function (row, entry) {
        const tile = _s.tile;
        if (!entry.data.iconFile) return;
        if (!(tile.frameSize > 0)) {
            row.icon = createIcon(entry, tile.iconSize);
            fitTileIcon(row);
            return;
        }
        // GROUP: The circle behind the icon
        row.iconFrame = HGroup({ width: tile.frameSize, height: tile.frameSize, align: "center center", round: tile.frameRound, color: tile.frameColor });
        row.iconFrame.position = "relative";
        row.iconFrame.shrink = 0;
        row.iconFrame.clipContent = 0; // WHY: The selected icon grows out of the circle.
        row.iconFrame.setMotion("background-color 0.3s");
            row.icon = createIcon(entry, tile.iconSize);
            fitTileIcon(row);
        endGroup();
    };

    const createTexts = function (row, entry, isTile) {
        // GROUP: Title and description
        row.texts = VGroup({ width: isTile ? "100%" : "auto", height: "auto", align: isTile ? "center top" : "left center", gap: 0 });
        row.texts.css = { flex: isTile ? "" : "1 1 0", minWidth: "0", alignItems: "stretch" };

            row.lblTitle = Label({ plainText: entry.data.text || "", width: "100%", fontSize: _s.title.fontSize, ellipsis: 1 });
            if (_s.title.fontFamily) row.lblTitle.fontFamily = _s.title.fontFamily;

            if (entry.data.description) {
                row.lblDesc = Label({ plainText: entry.data.description, width: "100%", fontSize: _s.desc.fontSize, textColor: _s.desc.textColor, ellipsis: 1 });
                row.lblDesc.css.marginTop = (_s.desc.marginTop || 0) + "px";
            }

            if (isTile) {
                row.lblTitle.css.textAlign = "center";
                if (row.lblDesc) row.lblDesc.css.textAlign = "center";
            }

        endGroup();
    };

    const createCheck = function (row, isTile) {
        if (!basic.isOn(_s.check.visible) || box.selection === "none") return;
        const size = _s.check.size;
        row.check = Label({ width: size, height: size, round: 100, border: 2, text: "" });
        row.check.shrink = 0;
        row.check.css = { display: "flex", alignItems: "center", justifyContent: "center" };
        row.check.aria = { hidden: "true" };
        if (isTile) {
            // WHY: A tile has no room at its side: the mark sits on its top right corner.
            row.check.position = "absolute";
            row.check.top = 6;
            row.check.right = 6;
        }
    };

    const createRowContent = function (row, entry, isTile) {
        if (typeof box.createItemView === "function") {
            box.createItemView(entry.item, row, box);
            return;
        }
        if (isTile) createTileIcon(row, entry);
        else row.icon = createIcon(entry, _s.icon.size);
        createTexts(row, entry, isTile);
    };

    const createRowBox = function (isTile) {
        if (isTile) {
            return VGroup({ width: _s.tile.width, height: _s.tile.height, align: "center top", gap: _s.tile.gap, padding: _s.tile.padding });
        }
        return HGroup({ width: "100%", height: _s.row.height, align: "left center", gap: _s.row.gap, padding: _s.row.padding });
    };

    // The row of an item: an icon and its texts, or your own objects (createItemView).
    const createItemRow = function (entry) {
        const isTile = isTileLayout();

        // GROUP: Row
        const row = createRowBox(isTile);
        row.isTile = isTile ? 1 : 0;
        row.position = "relative";
        row.shrink = 0;
        row.round = _s.row.round;
        row.border = _s.row.border;
        row.clickable = 1;
        row.clipContent = 0; // WHY: The focus ring is drawn on the edge of the row.
        if (_s.row.boxShadow) row.boxShadow = _s.row.boxShadow;
        setStartMotion(row, entry);
        row.role = "option";
        row.aria = { label: entry.data.text || entry.key };
        row.setFocusRing(_s.focus.ringColor);

            createRowContent(row, entry, isTile);
            createCheck(row, isTile);

        endGroup();
        return row;
    };

    // A section: its title (style.section) or your own objects (createSectionView). It has no events: it is never
    // selected, hovered or clicked.
    const createSectionRow = function (entry) {
        const section = _s.section;
        // WHY: A whole line in a list and in a grid; in one row of tiles (horizontal), a title before its tiles.
        const width = (box.layout === "horizontal") ? "auto" : "100%";

        // GROUP: Section
        const row = HGroup({ width: width, height: section.height, align: "left center", padding: section.padding });
        row.position = "relative";
        row.shrink = 0;
        row.role = "presentation";
        setStartMotion(row, entry);

            if (typeof box.createSectionView === "function") {
                box.createSectionView(entry.item, row, box);
            } else {
                row.lblTitle = Label({ plainText: entry.data.text || "", width: width, fontSize: section.fontSize, textColor: section.textColor, ellipsis: 1 });
                if (section.fontFamily) row.lblTitle.fontFamily = section.fontFamily;
            }

        endGroup();
        return row;
    };

    // WHY: setMotion() waits a moment: the first paint (a row selected at create time) does not move.
    //      Before createItemView, so a row motion set there wins.
    const setStartMotion = function (row, entry) {
        const motion = getRowMotion(entry, "rest");
        if (motion) row.setMotion(motion);
    };

    const createRow = function (entry) {
        entry.isHover = 0; // WHY: A new row is not under the mouse yet (its mouseleave would never come).
        if (entry.isSection) {
            entry.row = createSectionRow(entry);
            return entry.row;
        }
        const row = createItemRow(entry);
        entry.row = row;
        bindRowEvents(entry);
        paintRow(entry);
        // WHY: The motion is set after the first paint: a tile selected at create time does not grow in front of the user.
        if (row.isTile && row.icon && _s.tile.iconMotion) row.icon.setMotion(_s.tile.iconMotion);
        return row;
    };

    const bindRowEvents = function (entry) {
        const row = entry.row;
        row.on("click", function (self, event) {
            // WHY: A removed row that still fades out is not clicked (a button made in it by createItemView).
            if (entry.isLeaving) return;
            activateEntry(entry, event);
        });
        row.onHoverChange(function (self, isOver) {
            entry.isHover = (isOver && isEntryEnabled(entry)) ? 1 : 0;
            paintRow(entry);
        });
        row.on("keydown", function (self, event) {
            onRowKeyDown(entry, event);
        });
    };

    const createListGroup = function () {
        if (box.layout === "horizontal") {
            const group = HGroup({ width: "auto", height: "auto", align: "left top", gap: _s.tile.spacing, padding: _s.tile.listPadding });
            group.css.width = "max-content"; // WHY: A flex group with width "auto" in a scrolling Box does not grow with its children.
            return group;
        }
        if (box.layout === "grid") {
            return HGroup({ width: "100%", height: "auto", align: "left top", gap: _s.tile.spacing, padding: _s.tile.listPadding, wrap: 1 });
        }
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.list.gap, padding: _s.box.padding });
        group.css.alignItems = "stretch";
        return group;
    };

    const refreshScrollBar = function () {
        if (box.scrollBar) box.scrollBar.refreshScroll();
    };

    // Shows "No items" / "No results" when no item is shown. (The sections are not counted.)
    const refreshEmptyText = function () {
        const shownCount = getShownEntries().length;
        box.lblEmpty.visible = (shownCount === 0) ? 1 : 0;
        box.lblEmpty.plainText = (getItemEntries().length === 0) ? box.emptyText : box.noResultText;
        refreshScrollBar();
    };

    // Shows or hides a row by its isShown. withMotion (an animated addItem / removeItem): a row that goes (a section
    // without a shown item) fades out first; a row that comes is faded in by playRowMoves().
    const showRow = function (entry, withMotion) {
        if (entry.isShown) {
            if (entry.isLeaving) stopLeave(entry);
            entry.row.visible = 1;
            return;
        }
        if (withMotion && entry.row.visible == 1) {
            if (!entry.isLeaving) fadeOutRow(entry, hideFadedRow);
            return;
        }
        if (entry.isLeaving) stopLeave(entry);
        entry.row.visible = 0;
    };

    const applySearch = function (withMotion = false) {
        computeShown();
        entries.forEach(function (e) {
            if (e.row) showRow(e, withMotion);
        });
        refreshTabOrder();
        refreshEmptyText();
    };

    // Draws all the rows again (setItems, setLayout).
    const createRows = function () {
        if (box.wrapper) box.wrapper.remove();
        removedEntries = []; // WHY: Their rows go with the old group (their timers find them removed).
        const host = isAutoHeight ? box : box.scrollBox;
        createIn(host, function () {
            // GROUP: Rows
            box.wrapper = createListGroup();
            box.wrapper.position = "relative"; // WHY: The scroll box (or the auto height box) grows with it.
            box.wrapper.css.boxSizing = "border-box";
            box.wrapper.clipContent = 0;
            box.wrapper.role = "listbox";
            box.wrapper.aria = {
                label: box.ariaLabel,
                multiselectable: (box.selection === "multiple") ? "true" : "false",
                orientation: (box.layout === "horizontal") ? "horizontal" : null, // (the default of a listbox: vertical)
            };
                entries.forEach(createRow);
            endGroup();
        });
        applySearch();
    };

    const refreshScrollAxes = function () {
        if (isAutoHeight) return;
        const isHorizontal = (box.layout === "horizontal");
        box.scrollBox.scrollX = isHorizontal ? 1 : 0;
        box.scrollBox.scrollY = isHorizontal ? 0 : 1;
    };

    // *** PRESSED (style.pressed.color)

    // A click, Enter or Space: the row gets the pressed color at once, then it fades back to its look (the row motion).
    const flashRow = function (entry) {
        if (!_s.pressed.color) return;
        if (entry.cancelFlash) entry.cancelFlash();
        entry.isPressed = 1;
        setRowMotion(entry, "rest");
        paintRow(entry);
        entry.cancelFlash = box.after(PRESS_HOLD_TIME, function () {
            entry.cancelFlash = null;
            entry.isPressed = 0;
            if (entry.row.isRemoved) return;
            setRowMotion(entry, "rest");
            paintRow(entry);
        });
    };

    // *** MOTION (animated: 1)

    // WHY: A user who asked the system for less motion gets still rows.
    const isMotionOn = function () {
        if (box.animated != 1) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    // The transition of a row: the motion of its look (style.row.motion) and, when animated, its fade and its move.
    // mode: "rest" (all of them), "placing" (no move: the row jumps to its start place), "still" (no fade, no move).
    // WHY: A pressed row has no motion of its look: the pressed color comes at once.
    const getRowMotion = function (entry, mode) {
        const parts = [];
        if (_s.row.motion && !entry.isSection && !entry.isPressed) parts.push(_s.row.motion);
        if (isMotionOn() && mode !== "still") parts.push(FADE_MOTION);
        if (isMotionOn() && mode === "rest") parts.push(MOVE_MOTION);
        return parts.join(", ");
    };

    const setRowMotion = function (entry, mode) {
        entry.row.setMotionNow(getRowMotion(entry, mode));
    };

    // How far the list is scrolled. (An "auto" height list does not scroll in itself.)
    const getScroll = function () {
        if (!box.scrollBox) return { left: 0, top: 0 };
        return { left: box.scrollBox.elem.scrollLeft, top: box.scrollBox.elem.scrollTop };
    };

    // The place of a row in the list without its move: its place in the layout, minus the scroll.
    // WHY: Not getBoundingClientRect(): a page zoomed by page.fit() is scaled, the moves would be too short or long.
    const getLayoutPlace = function (entry) {
        const scroll = getScroll();
        return { left: entry.row.elem.offsetLeft - scroll.left, top: entry.row.elem.offsetTop - scroll.top };
    };

    // Where a row is seen now: its layout place and the part of its move that has not ended yet (transform).
    const getSeenPlace = function (entry) {
        const place = getLayoutPlace(entry);
        const move = new DOMMatrixReadOnly(getComputedStyle(entry.row.elem).transform);
        return { left: place.left + move.m41, top: place.top + move.m42 };
    };

    // The transform that puts a row back where it was seen. "": it has not moved.
    const getMoveBack = function (first, last) {
        const x = first.left - last.left;
        const y = first.top - last.top;
        if (x === 0 && y === 0) return "";
        return "translate(" + x + "px, " + y + "px)";
    };

    // The rows on the screen: the shown ones and the ones that still fade out.
    const getDisplayedEntries = function () {
        return entries.concat(removedEntries).filter(function (e) {
            return e.row && !e.row.isRemoved && e.row.visible == 1;
        });
    };

    // FLIP, first: where every row on the screen is seen before a change. null: no motion.
    const measureRows = function () {
        if (!isMotionOn() || !box.wrapper) return null;
        const places = new Map();
        getDisplayedEntries().forEach(function (e) { places.set(e, getSeenPlace(e)); });
        return places;
    };

    // The rest look of a row: the opacity of its state (an item) or 1 (a section).
    const showRowLook = function (entry) {
        entry.row.css.opacity = "";
        paintRow(entry);
    };

    // FLIP, after a change: every row jumps back to where it was seen (no motion), then moves to its new place.
    // A row that was not on the screen comes: it fades in from a little higher.
    const playRowMoves = function (firstPlaces) {
        if (!firstPlaces) return;
        const displayed = getDisplayedEntries();
        const moving = displayed.filter(function (e) { return firstPlaces.has(e); });
        const coming = displayed.filter(function (e) { return !firstPlaces.has(e); });
        const lastPlaces = moving.map(getLayoutPlace); // WHY: All the places are read before the writes: one layout.

        moving.forEach(function (e, i) {
            setRowMotion(e, "placing");
            e.row.css.transform = getMoveBack(firstPlaces.get(e), lastPlaces[i]);
        });
        coming.forEach(function (e) {
            setRowMotion(e, "still");
            e.row.css.opacity = "0";
            e.row.css.transform = "translateY(" + (-COMING_ROW_SHIFT) + "px)";
        });

        void box.wrapper.elem.offsetWidth; // WHY: The start places are drawn first, so the moves start from them.

        displayed.forEach(function (e) {
            setRowMotion(e, "rest");
            e.row.css.transform = "";
        });
        coming.forEach(showRowLook);
    };

    // FLIP: change() moves rows in the layout; the rows on the screen move there from where they were seen.
    const moveRowsAfter = function (change) {
        const firstPlaces = measureRows();
        change();
        playRowMoves(firstPlaces);
    };

    // A row that goes: it fades out in its place (the rows around it stay), then gone(entry) takes it away (removed or
    // hidden) and the rows under it move up (FLIP).
    const fadeOutRow = function (entry, gone) {
        if (entry.cancelLeave) entry.cancelLeave();
        entry.isLeaving = 1;
        entry.row.clickable = 0;
        entry.row.aria = { hidden: "true" };
        setRowMotion(entry, "rest");
        entry.row.css.opacity = "0";
        entry.cancelLeave = box.after(MOTION_MS, function () {
            entry.cancelLeave = null;
            if (entry.row.isRemoved) return; // WHY: setItems() or setLayout() made the rows again in the meantime.
            moveRowsAfter(function () { gone(entry); });
            refreshScrollBar();
        });
    };

    // A row that faded out (or stopped fading) gets its look back.
    const endLeaveLook = function (entry) {
        entry.isLeaving = 0;
        entry.row.aria = { hidden: null };
        if (!entry.isSection) entry.row.clickable = 1;
        showRowLook(entry);
    };

    // A row that was fading out stays after all: it is shown again, or hidden at once (a search, animated: 0).
    const stopLeave = function (entry) {
        if (entry.cancelLeave) entry.cancelLeave();
        entry.cancelLeave = null;
        endLeaveLook(entry);
    };

    // The end of the fade of a hidden row (a section without a shown item): hidden, with its look back for later.
    const hideFadedRow = function (entry) {
        entry.row.visible = 0;
        endLeaveLook(entry);
    };

    const removeFadedRow = function (entry) {
        removedEntries = removedEntries.filter(function (e) { return e !== entry; });
        entry.row.remove();
    };

    // The row of a removed item: it fades out, then it leaves and the rows under it move up (animated: 1).
    // Otherwise (or a hidden row) it is removed at once.
    const takeOutRow = function (entry) {
        if (!isMotionOn() || entry.row.visible != 1) {
            entry.row.remove();
            return;
        }
        removedEntries.push(entry);
        if (!entry.isSection) entry.row.tabIndex = -1;
        fadeOutRow(entry, removeFadedRow);
    };

    // The removed rows that still fade out are removed at once.
    const removeFadingRows = function () {
        removedEntries.forEach(function (e) {
            if (e.cancelLeave) e.cancelLeave();
            e.row.remove();
        });
        removedEntries = [];
    };

    // The transitions of the rows (setAnimated). Off: the rows that fade out go at once, the moves end.
    const applyAnimated = function () {
        const isOn = isMotionOn();
        if (!isOn && !wasAnimated) return; // WHY: animated: 0 writes nothing.
        wasAnimated = isOn ? 1 : 0;
        if (!isOn) removeFadingRows();
        entries.forEach(function (e) {
            if (!e.row) return;
            setRowMotion(e, "rest");
            if (!isOn) e.row.css.transform = "";
        });
        if (!isOn) applySearch(); // WHY: A section that was fading out is hidden at once.
    };

    // *** SELECTION

    const setSelectedKeys = function (keys, silent) {
        const before = selectedKeys.join("\n");
        selectedKeys = keys;
        paintAll();
        refreshTabOrder(); // WHY: The Tab order goes to the selection while no row was focused.
        if (silent || before === selectedKeys.join("\n")) return;
        box.onChange(box, getSelectedItems());
    };

    // A click, Enter or Space on a row: the pressed flash, onItemClick and the selection. With Shift in a multiple
    // list: the rows from the anchor to this one (selectRange).
    // WHY: Enter and Space did not call onItemClick: a list without selection (a menu) could not be used with keys.
    const activateEntry = function (entry, event) {
        if (!isEntryChoosable(entry)) return;
        flashRow(entry);
        focusedKey = entry.key;
        refreshTabOrder();
        box.onItemClick(box, entry.item, indexOf(entry), event);
        if (isRangeEvent(event)) {
            selectRange(entry, entry);
            return;
        }
        toggleEntry(entry, 0);
        setAnchor(entry);
    };

    const isRangeEvent = function (event) {
        return box.selection === "multiple" && !!event && event.shiftKey;
    };

    // multiple: a Shift range starts at this row and is added to the selection of this time.
    const setAnchor = function (entry) {
        anchorKey = entry.key;
        rangeBaseKeys = selectedKeys.slice();
    };

    // WHY: A selection changed by code: the next Shift range must not bring its old keys back.
    const forgetAnchor = function () {
        anchorKey = null;
        rangeBaseKeys = [];
    };

    // multiple: the enabled shown rows from the anchor to this one are selected, over the selection of the anchor
    // time. A Shift move back makes the range shorter (the rows it leaves are not selected any more).
    // startEntry: the anchor when there is none yet (the row the Shift move started from).
    const selectRange = function (entry, startEntry) {
        const shown = getShownEntries();
        const anchor = findEntry(anchorKey);
        if (!anchor || !anchor.isShown) setAnchor(startEntry);
        const from = shown.indexOf(findEntry(anchorKey));
        const to = shown.indexOf(entry);
        const rangeKeys = shown.slice(Math.min(from, to), Math.max(from, to) + 1)
            .filter(isEntryEnabled)
            .map(function (e) { return e.key; });
        const newKeys = rangeKeys.filter(function (key) { return !rangeBaseKeys.includes(key); });
        setSelectedKeys(rangeBaseKeys.concat(newKeys), 0);
    };

    // multiple: Ctrl / Cmd + A selects every shown enabled item; when they are all selected, none of them.
    // The hidden ones (a search) keep their selection.
    const toggleAllShown = function (shown) {
        const keys = shown.filter(isEntryEnabled).map(function (e) { return e.key; });
        const isAllSelected = keys.every(function (key) { return selectedKeys.includes(key); });
        const otherKeys = selectedKeys.filter(function (key) { return !keys.includes(key); });
        const newKeys = keys.filter(function (key) { return !selectedKeys.includes(key); });
        setSelectedKeys(isAllSelected ? otherKeys : selectedKeys.concat(newKeys), 0);
        forgetAnchor();
    };

    // A click, Enter or Space on a row.
    const toggleEntry = function (entry, silent) {
        if (box.selection === "none" || entry.isSection) return;
        if (box.selection === "single") {
            setSelectedKeys([entry.key], silent);
            return;
        }
        const keys = isSelected(entry)
            ? selectedKeys.filter(function (key) { return key !== entry.key; })
            : selectedKeys.concat([entry.key]);
        setSelectedKeys(keys, silent);
    };

    // A key of an item of the list. WHY: A section is never selected.
    const isSelectableKey = function (key) {
        const entry = findEntry(key);
        return !!entry && !entry.isSection;
    };

    // Only the keys of the list; single selection keeps the last one.
    const cleanKeys = function (keys) {
        const known = (Array.isArray(keys) ? keys : [keys])
            .map(String)
            .filter(function (key, index, list) { return isSelectableKey(key) && list.indexOf(key) === index; });
        if (box.selection === "none") return [];
        if (box.selection === "single") return known.slice(-1);
        return known;
    };

    // *** KEYBOARD

    // The shown items (not the sections): the keyboard, the Tab order and the counts use them.
    const getShownEntries = function () {
        return entries.filter(function (e) { return e.isShown && !e.isSection; });
    };

    // The shown section right before an item (null: none).
    const getSectionBefore = function (entry) {
        const before = entries[indexOf(entry) - 1];
        return (before && before.isSection && before.isShown) ? before : null;
    };

    // Scrolls only the list (not the page around it) to show a row.
    // WHY: scrollIntoView() also scrolled the boxes around the list: the whole page jumped.
    const scrollRowIntoView = function (entry) {
        if (isAutoHeight || !entry || !entry.row || !entry.isShown) return;
        const area = box.scrollBox.elem;
        const row = entry.row.elem;
        // WHY: The first item of a section is shown with its title (Home, the arrow up).
        const firstRow = (getSectionBefore(entry) || entry).row.elem;
        const isHorizontal = (box.layout === "horizontal");
        const wrapperStart = isHorizontal ? box.wrapper.elem.offsetLeft : box.wrapper.elem.offsetTop;
        const start = (isHorizontal ? firstRow.offsetLeft : firstRow.offsetTop) + wrapperStart;
        const end = (isHorizontal ? row.offsetLeft + row.offsetWidth : row.offsetTop + row.offsetHeight) + wrapperStart;
        const position = isHorizontal ? area.scrollLeft : area.scrollTop;
        const visibleSize = isHorizontal ? area.clientWidth : area.clientHeight;
        let target = position;
        if (start < position) target = start;
        else if (end > position + visibleSize) target = end - visibleSize;
        if (isHorizontal) area.scrollLeft = target;
        else area.scrollTop = target;
    };

    const scrollToFirstSelected = function () {
        if (box.scrollToSelected != 1 || selectedKeys.length === 0) return;
        scrollRowIntoView(findEntry(selectedKeys[0]));
    };

    const focusEntry = function (entry) {
        if (!entry || !entry.row || entry.isSection) return;
        focusedKey = entry.key;
        refreshTabOrder();
        entry.row.elem.focus({ preventScroll: true });
        scrollRowIntoView(entry);
    };

    // The nearest tile of a line of the grid to a side (left, in px).
    const getNearestInLine = function (line, left) {
        const distanceOf = function (e) { return Math.abs(e.row.elem.offsetLeft - left); };
        return line.reduce(function (nearest, e) {
            return (distanceOf(e) < distanceOf(nearest)) ? e : nearest;
        });
    };

    // The tile on the next line of the grid (direction 1: down, -1: up), the nearest one to the side of this tile.
    // No line there: the last (or the first) tile.
    // WHY: Not a count of columns: a section starts a new line, so the lines of a grid are not all full.
    const getGridNeighbor = function (entry, shown, direction) {
        const top = entry.row.elem.offsetTop;
        const lineTops = shown
            .map(function (e) { return e.row.elem.offsetTop; })
            .filter(function (lineTop) { return (direction > 0) ? lineTop > top : lineTop < top; });
        if (lineTops.length === 0) return (direction > 0) ? shown[shown.length - 1] : shown[0];
        const nextTop = (direction > 0) ? Math.min(...lineTops) : Math.max(...lineTops);
        const line = shown.filter(function (e) { return e.row.elem.offsetTop === nextTop; });
        return getNearestInLine(line, entry.row.elem.offsetLeft);
    };

    // How an arrow key moves the focus in this layout: 1 (next), -1 (previous), 0 (the key does nothing here).
    const getArrowStep = function (key) {
        const isVertical = (box.layout === "vertical");
        const isHorizontal = (box.layout === "horizontal");
        if (key === "ArrowDown") return isHorizontal ? 0 : 1;
        if (key === "ArrowUp") return isHorizontal ? 0 : -1;
        if (key === "ArrowRight") return isVertical ? 0 : 1;
        if (key === "ArrowLeft") return isVertical ? 0 : -1;
        return 0;
    };

    // The row an arrow key moves the focus to. null: the key does nothing in this layout.
    const getArrowTarget = function (entry, key, shown) {
        const step = getArrowStep(key);
        if (step === 0) return null;
        const isLineMove = (key === "ArrowDown" || key === "ArrowUp");
        if (box.layout === "grid" && isLineMove) return getGridNeighbor(entry, shown, step);
        const position = shown.indexOf(entry);
        return shown[Math.max(0, Math.min(shown.length - 1, position + step))];
    };

    // PageDown / PageUp: as many rows (in a grid: lines) as the list shows, less one. null: an "auto" height list
    // (it does not scroll in itself: the key scrolls the page).
    const getPageTarget = function (entry, shown, direction) {
        if (isAutoHeight) return null;
        const isHorizontal = (box.layout === "horizontal");
        const visibleSize = isHorizontal ? box.scrollBox.elem.clientWidth : box.scrollBox.elem.clientHeight;
        const rowSize = isHorizontal ? entry.row.elem.offsetWidth : entry.row.elem.offsetHeight;
        const count = Math.max(1, Math.floor(visibleSize / Math.max(1, rowSize)) - 1);
        if (box.layout === "grid") {
            let target = entry;
            for (let i = 0; i < count; i++) target = getGridNeighbor(target, shown, direction);
            return target;
        }
        const position = shown.indexOf(entry) + direction * count;
        return shown[Math.max(0, Math.min(shown.length - 1, position))];
    };

    // The row a key moves the focus to: an arrow, Home / End, PageUp / PageDown. null: the key does not move it.
    const getMoveTarget = function (entry, key, shown) {
        if (key === "Home") return shown[0];
        if (key === "End") return shown[shown.length - 1];
        if (key === "PageDown") return getPageTarget(entry, shown, 1);
        if (key === "PageUp") return getPageTarget(entry, shown, -1);
        return getArrowTarget(entry, key, shown);
    };

    // WHY: The arrow up from the first line of the list goes back to the search box over it.
    const isOnFirstLine = function (entry, shown) {
        if (box.layout === "horizontal") return true;
        return entry.row.elem.offsetTop === shown[0].row.elem.offsetTop;
    };

    const isSelectAllKey = function (event) {
        const isCommand = event.ctrlKey || event.metaKey;
        return box.selection === "multiple" && isCommand && event.key.toLowerCase() === "a";
    };

    // A letter of a word (type-ahead): not a key with Ctrl, Cmd or Alt.
    const isTypedLetter = function (event) {
        return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
    };

    // Type-ahead: the letters typed one after the other move the focus to the next item whose text starts with them
    // (Turkish letters without their marks). The same letter again goes on to the next item with that letter.
    const typeAhead = function (entry, letter, shown) {
        if (cancelTypedText) cancelTypedText();
        typedText += normalizeText(letter);
        cancelTypedText = box.after(TYPE_AHEAD_TIME, function () {
            typedText = "";
            cancelTypedText = null;
        });
        const isOneLetter = typedText.split("").every(function (c) { return c === typedText[0]; });
        const word = isOneLetter ? typedText[0] : typedText;
        // WHY: One letter starts after the focused row (the same letter goes on); a word may stay on it.
        const start = shown.indexOf(entry) + (isOneLetter ? 1 : 0);
        const ordered = shown.slice(start).concat(shown.slice(0, start));
        const target = ordered.find(function (e) { return normalizeText(e.data.text).startsWith(word); });
        if (target) focusEntry(target);
    };

    const onRowKeyDown = function (entry, event) {
        // WHY: the keys of a field inside the row (createItemView) are its own: a space could not be typed in it
        if (event.target !== entry.row.elem) return;
        if (box.enabled != 1 || entry.isLeaving) return;
        const shown = getShownEntries();

        if (isSelectAllKey(event)) {
            event.preventDefault();
            toggleAllShown(shown);
            return;
        }
        // WHY: A space while a word is typed is a letter of the word (type-ahead).
        const isSpace = (event.key === " " && typedText === "");
        if (event.key === "Enter" || isSpace) {
            event.preventDefault();
            // WHY: A key held down repeats: it would open an item again and again, or turn its selection on and off.
            if (event.repeat) return;
            activateEntry(entry, event);
            return;
        }
        if (event.key === "ArrowUp" && box.searchInput && isOnFirstLine(entry, shown)) {
            event.preventDefault();
            box.searchInput.focus();
            return;
        }
        const target = getMoveTarget(entry, event.key, shown);
        if (target) {
            event.preventDefault();
            focusEntry(target);
            if (isRangeEvent(event)) selectRange(target, entry);
            return;
        }
        if (isTypedLetter(event)) {
            event.preventDefault();
            typeAhead(entry, event.key, shown);
        }
    };

    // The arrow down in the search box goes into the list: to its row of the Tab order (getTabEntry).
    const onSearchKeyDown = function (self, event) {
        if (event.key !== "ArrowDown") return;
        const tabEntry = getTabEntry();
        if (!tabEntry) return;
        event.preventDefault();
        focusEntry(tabEntry);
    };

    // The search box over the list (showSearch: 1). Returns its height with its padding (0: no search box).
    const createSearch = function () {
        if (box.showSearch != 1) return 0;
        if (typeof SearchInput === "undefined") {
            console.warn("ItemList: showSearch needs comp/search-input.js (SearchInput).");
            return 0;
        }
        const search = _s.search;
        const padding = search.padding; // [left, top, right, bottom]

        // GROUP: Search area
        box.searchArea = HGroup({ width: "100%", height: search.height + padding[1] + padding[3], align: "left top", padding: padding });
        if (isAutoHeight) box.searchArea.position = "relative";
            // WHY clearOnEscape: Escape clears the search (as the clear icon); searchParams can turn it off.
            const searchParams = Object.assign({ clearOnEscape: 1 }, search, box.searchParams);
            delete searchParams.padding;
            searchParams.width = "100%";
            searchParams.position = "relative";
            searchParams.onChange = function (self) { box.search(self.getSearchText()); };
            box.searchInput = SearchInput(searchParams);
            box.searchInput.txtSearch.on("keydown", onSearchKeyDown);
        endGroup();

        return search.height + padding[1] + padding[3];
    };

    // A search() from code shows its text in the search box too.
    // WHY: Only when it is another text: the box gives a lower case text to search(); it must not change what is typed.
    const syncSearchInput = function (text) {
        if (!box.searchInput) return;
        if (normalizeText(box.searchInput.value).trim() === normalizeText(text).trim()) return;
        box.searchInput.setValue(String(text || ""), 1);
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        entries = (Array.isArray(items) ? items : []).map(toEntry);
        selectedKeys = selectedKeys.filter(isSelectableKey);
        if (!findEntry(focusedKey)) focusedKey = null;
        forgetAnchor();
        createRows();
    };
    // USAGE: list.setItems([{ key: "a", text: "A" }, "B"]) // onChange is not called. Selected keys that are still there stay selected.

    box.getItems = function () {
        return entries.map(function (e) { return e.item; });
    };
    // USAGE: list.getItems() // The same strings / objects you gave (the sections too)

    box.getItem = function (key) {
        const entry = findEntry(key);
        return entry ? entry.item : null;
    };

    // The row object of an item (for your own changes on a createItemView row).
    box.getRow = function (key) {
        const entry = findEntry(key);
        return entry ? entry.row : null;
    };

    // An item without a key gets the first free number as its key ("0", "1"...).
    // WHY: Not just the count of the items: after a removeItem() that number can already be a key.
    const getFreeIndexKey = function () {
        let number = entries.length;
        while (findEntry(number)) number++;
        return number;
    };

    // index: the place in getItems() (the sections are counted). -1 or empty -> at the end.
    // animated: 1 -> the rows under it move down and it fades in.
    box.addItem = function (item, index = -1) {
        const entry = toEntry(item, getFreeIndexKey());
        if (findEntry(entry.key)) {
            console.warn("ItemList: the key is already in the list: " + entry.key);
            return;
        }
        const at = (index < 0 || index > entries.length) ? entries.length : index;
        moveRowsAfter(function () {
            entries.splice(at, 0, entry);
            createIn(box.wrapper, function () { createRow(entry); });
            const next = entries[at + 1];
            if (next && next.row) box.wrapper.elem.insertBefore(entry.row.elem, next.row.elem);
            applySearch(isMotionOn());
        });
    };
    // USAGE: list.addItem({ key: "x", text: "X" }) or list.addItem({ key: "y", text: "Y" }, 0)

    // silent: 1 -> onChange is not called (when the removed item was selected). Returns the removed item.
    // animated: 1 -> its row fades out, then it leaves and the rows under it move up. (The data changes at once.)
    box.removeItem = function (key, silent = 0) {
        const entry = findEntry(key);
        if (!entry) return null;
        moveRowsAfter(function () {
            entries.splice(indexOf(entry), 1);
            takeOutRow(entry);
            if (focusedKey === entry.key) focusedKey = null;
            if (isSelected(entry)) {
                setSelectedKeys(selectedKeys.filter(function (k) { return k !== entry.key; }), silent);
            }
            applySearch(isMotionOn());
        });
        return entry.item;
    };
    // USAGE: list.removeItem("tomato")

    // Changes the keys of an item object and draws its row again (the key itself does not change).
    box.updateItem = function (key, changes = {}) {
        const entry = findEntry(key);
        if (!entry || typeof entry.item !== "object") return;
        Object.assign(entry.item, changes, { key: entry.item.key });
        entry.data = entry.item;
        entry.isSection = isSectionData(entry.data);
        selectedKeys = selectedKeys.filter(isSelectableKey); // WHY: An item that became a section is not selected any more.
        const oldRow = entry.row;
        createIn(box.wrapper, function () { createRow(entry); });
        box.wrapper.elem.insertBefore(entry.row.elem, oldRow.elem);
        oldRow.remove();
        applySearch();
    };
    // USAGE: list.updateItem("tomato", { description: "Fruit", iconFile: "tomato.png" })

    box.getSelectedKeys = function () {
        return selectedKeys.slice();
    };

    box.getSelected = function () {
        return getSelectedItems();
    };
    // USAGE: list.getSelected() // [item, item] (the same objects / strings you gave)

    // silent: 1 -> onChange is not called.
    box.setSelected = function (keys, silent = 0) {
        setSelectedKeys(cleanKeys(keys), silent);
        forgetAnchor();
        scrollToFirstSelected();
    };
    // USAGE: list.setSelected("broccoli") or list.setSelected(["a", "b"], 1)

    box.select = function (key, silent = 0) {
        const entry = findEntry(key);
        if (!entry || entry.isSection || isSelected(entry)) return;
        toggleEntry(entry, silent);
        forgetAnchor();
        if (box.scrollToSelected == 1) scrollRowIntoView(entry);
    };

    box.unselect = function (key, silent = 0) {
        setSelectedKeys(selectedKeys.filter(function (k) { return k !== String(key); }), silent);
        forgetAnchor();
    };

    box.clearSelection = function (silent = 0) {
        setSelectedKeys([], silent);
        forgetAnchor();
    };

    // Shows only the matching items (and the sections over them). Returns the count of the shown items. "": all of them.
    box.search = function (text) {
        searchText = normalizeText(text).trim();
        syncSearchInput(text);
        applySearch();
        return getShownEntries().length;
    };
    // USAGE: searchInput.onChange = function (self) { list.search(self.getSearchText()); };

    box.setLayout = function (layout) {
        box.layout = normalizeLayout(layout);
        refreshScrollAxes();
        createRows();
    };
    // USAGE: list.setLayout("grid") // "vertical", "horizontal", "grid"

    box.setSelection = function (selection) {
        box.selection = selection;
        selectedKeys = cleanKeys(selectedKeys);
        forgetAnchor();
        createRows(); // WHY: The check marks are made (or not) with the rows.
    };
    // USAGE: list.setSelection("multiple")

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        box.aria = { disabled: (box.enabled == 1) ? "false" : "true" };
        refreshTabOrder();
        paintAll();
    };
    // USAGE: get: list.enabled, set: list.setEnabled(0)

    box.setAnimated = function (value) {
        box.animated = basic.isOn(value) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: get: list.animated, set: list.setAnimated(1)

    box.scrollToItem = function (key) {
        scrollRowIntoView(findEntry(key));
    };

    box.focusItem = function (key) {
        focusEntry(key === undefined ? getShownEntries()[0] : findEntry(key));
    };

    // func(item, row, index) for every item (shown or not), the sections too (item.type === "section")
    box.forEach = function (func) {
        entries.forEach(function (e, index) { func(e.item, e.row, index); });
    };

    box.refresh = function () {
        paintAll();
        refreshEmptyText();
    };

    // The active row of a combobox (SelectBox: the row of its arrow keys) gets the look of the mouse (style.hover),
    // also when it is selected. It is then the only row with that look. null: none.
    // WHY: The keyboard stays in the field of the combobox: the list does not get the focus, it only shows the row.
    //      The mouse makes its row active itself (SelectBox: mousemove), so the row under the mouse loses its look
    //      when the arrow keys move the active row: two rows were white.
    box.setActiveKey = function (key) {
        const oldEntries = entries.filter(function (e) { return e.isHover || e.key === activeKey; });
        activeKey = (key === null || key === undefined) ? null : String(key);
        oldEntries.forEach(function (e) {
            e.isHover = 0;
            paintRow(e);
        });
        const entry = findEntry(activeKey);
        if (entry) paintRow(entry);
    };

    // *** OBJECT VIEW:

    box.color = _s.box.color;
    box.border = _s.box.border;
    box.borderColor = _s.box.borderColor;
    box.round = _s.box.round;
    box.css.boxSizing = "border-box";

    const searchHeight = createSearch();

    if (!isAutoHeight) {
        // BOX: Scrolling area (under the search box)
        box.scrollBox = Box(0, searchHeight, "100%", "calc(100% - " + searchHeight + "px)", { color: "transparent" });
    }

    // LABEL: Empty / no result text
    box.lblEmpty = Label({
        plainText: box.emptyText,
        left: 0, // WHY: only top was set, so the text stayed at the left of basic.js (-1000), out of the list
        width: "100%",
        fontSize: _s.empty.fontSize,
        textColor: _s.empty.textColor,
        textAlign: "center",
        padding: [0, 20],
        visible: 0,
    });
    if (isAutoHeight) box.lblEmpty.position = "relative";
    else box.lblEmpty.top = searchHeight + EMPTY_TEXT_TOP;

    if (!isAutoHeight && box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.scrollBox }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.layout = normalizeLayout(box.layout);
    refreshScrollAxes();
    entries = startItems.map(toEntry);
    selectedKeys = cleanKeys(startKeys);
    createRows();
    box.setEnabled(box.enabled);
    wasAnimated = isMotionOn() ? 1 : 0; // WHY: The rows were made with the transitions of the motion.
    // WHY: After the page has placed the list: the sizes are not known while it is created.
    box.after(0, scrollToFirstSelected);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

ItemList.getCheckSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: ItemList({ styleName: "light" })
// USAGE: ItemList({ styleName: "dark", style: { row: { round: 4 } } }) // Change only some keys.
// USAGE: ItemList({ style: ItemList.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (ozden) style.
// USAGE: ItemList.styles.myStyle = { row: { color: "ivory" } };
ItemList.styles = {

    // The rows: white under the mouse, the selected one half transparent. The tiles: a grey icon in a circle that
    // grows when it is selected.
    ozden: ItemListDefaults.style,

    // WHY: The old name of ozden: a page written with styleName: "classic" gets the same look without a warning.
    classic: ItemListDefaults.style,

    // The dark theme of ozden: the same shapes on a dark page (#1A1A19). A row gets a lighter
    // gray with a thin light line above and under it under the mouse, the selected one is half transparent, the
    // search box is the ozdenDark SearchInput in the gray of the mouse.
    ozdenDark: {
        box: { color: "#1A1A19", borderColor: White(0.22) },
        hover: { color: "#262624", lineColor: White(0.14) },
        focus: { ringColor: White(0.5) },
        title: { textColor: White(0.88) },
        desc: { textColor: White(0.45) },
        section: { textColor: White(0.4) },
        check: { color: "#E6E6E4", iconColor: "#1A1A19", borderColor: White(0.3) },
        empty: { textColor: White(0.4) },
        tile: { frameColor: White(0.06), selectedColor: "#262624" },
        search: { styleName: "ozdenDark", color: "#262624" },
        scrollBar: { bar_color: "#CFCFCD", bar_mouseOverColor: "#CFCFCD" },
    },

    // The light look of the kit (_designs/item-list.htm): a white box with one thin line and round 10 corners, flat
    // rows of 56 px; the row under the mouse in a soft gray, the selected one in a tint of the accent with a full
    // mark (an empty circle on the other rows).
    light: {
        box: { color: "#FFFFFF", border: 1, borderColor: Black(0.12), round: 10, padding: 6 },
        list: { gap: 2 }, // WHY: the colors of two rows never meet
        row: { height: 56, padding: [12, 10], gap: 12, color: "transparent", round: 8 },
        // WHY: The effects of the ozden tiles (a grey icon in a circle that grows) are turned off.
        tile: {
            width: 132,
            height: "auto",
            padding: [12, 14],
            gap: 8,
            spacing: 8,
            listPadding: 6, // as box.padding
            iconSize: 56,
            frameSize: 0,
            iconFilter: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: "#F2F3F0" },
        },
        section: { padding: [12, 6], fontSize: 13, textColor: Black(0.55) }, // WHY 12: over the icons of the rows
        hover: { color: "#F2F3F0", lineColor: "" }, // WHY: "": the lines of ozden are not filled in.
        selected: { color: "#E4EFEB", opacity: 1, canSelectAgain: 1 }, // WHY 1: a click on it is an onItemClick again (the rule of ozden is its own)
        focus: { ringColor: "rgba(61, 122, 107, 0.5)" },
        icon: { size: 36, round: 8, color: "#F2F3F0" },
        title: { fontSize: 15, textColor: Black(0.88), fontFamily: "opensans" },
        desc: { fontSize: 13, textColor: Black(0.55), marginTop: 0 },
        check: { visible: 1, size: 20, color: "#3D7A6B", iconColor: "#FFFFFF", borderColor: Black(0.25) },
        empty: { fontSize: 14, textColor: Black(0.55) },
        // The search field of the light look (_designs/search-input.htm): SearchInput light in its colors and sizes,
        // round 8 as the rows.
        search: {
            styleName: "light", // A package of SearchInput.styles
            height: 44,
            padding: [6, 6, 6, 0], // left, top, right, bottom: as box.padding (the rows have their own 6 under it)
            fontSize: 15,
            textOffsetY: -1, // WHY: the small letters of Open Sans sit low in their line
            color: "#FFFFFF",
            textColor: Black(0.88),
            placeholderColor: Black(0.38),
            border: 1,
            borderColor: Black(0.12),
            borderBottomStyle: "1px solid " + Black(0.12),
            focusBorderColor: "#3D7A6B", // the accent while typing (2 px)
            focusRingColor: "rgba(61, 122, 107, 0.5)",
            round: 8,
            searchIconSize: 18,
            searchIconLeft: 14,
            clearIconRight: 12,
        },
        scrollBar: { bar_color: "#A0A0A0", bar_mouseOverColor: "#6E6E6C", neverHide: 0, showDots: 0 },
    },

    // The dark look of the kit: the same shapes on the dark surface (#232322, on a #1A1A19 page).
    dark: {
        box: { color: "#232322", border: 1, borderColor: White(0.12), round: 10, padding: 6 },
        list: { gap: 2 },
        row: { height: 56, padding: [12, 10], gap: 12, color: "transparent", round: 8 },
        // WHY: The effects of the ozden tiles (a grey icon in a circle that grows) are turned off.
        tile: {
            width: 132,
            height: "auto",
            padding: [12, 14],
            gap: 8,
            spacing: 8,
            listPadding: 6, // as box.padding
            iconSize: 56,
            frameSize: 0,
            iconFilter: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: White(0.07) },
        },
        section: { padding: [12, 6], fontSize: 13, textColor: White(0.55) }, // WHY 12: over the icons of the rows
        hover: { color: White(0.07), lineColor: "" }, // WHY: "": the lines of ozden are not filled in.
        selected: { color: "rgba(101, 162, 147, 0.2)", opacity: 1, canSelectAgain: 1 }, // WHY 1: as light
        focus: { ringColor: "rgba(101, 162, 147, 0.55)" },
        icon: { size: 36, round: 8, color: White(0.07) },
        title: { fontSize: 15, textColor: White(0.9), fontFamily: "opensans" },
        desc: { fontSize: 13, textColor: White(0.55), marginTop: 0 },
        check: { visible: 1, size: 20, color: "#65A293", iconColor: "#0F1F1B", borderColor: White(0.3) },
        empty: { fontSize: 14, textColor: White(0.55) },
        // The search field of the dark look. WHY light: SearchInput has no dark package yet: its light one in the dark
        // colors, its icons inverted (a white search icon, a gray clear button with a dark cross).
        search: {
            styleName: "light", // A package of SearchInput.styles
            height: 44,
            padding: [6, 6, 6, 0], // left, top, right, bottom: as box.padding (the rows have their own 6 under it)
            fontSize: 15,
            textOffsetY: -1, // WHY: the small letters of Open Sans sit low in their line
            color: "#232322",
            textColor: White(0.9),
            placeholderColor: White(0.38),
            border: 1,
            borderColor: White(0.12),
            borderBottomStyle: "1px solid " + White(0.12),
            focusBorderColor: "#65A293", // the accent while typing (2 px)
            hoverRingColor: White(0.08),
            focusRingColor: "rgba(101, 162, 147, 0.55)",
            round: 8,
            searchIconSize: 18,
            searchIconLeft: 14,
            clearIconRight: 12,
            invertIconColor: 1,
        },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", neverHide: 0, showDots: 0 },
    },

    // Pictures (layout "grid"): a big photo in its square with no filter, its title and description under it, a ring
    // around the selected one. A picture of any shape fills its square (cover).
    gallery: {
        box: { color: "transparent", border: 0, padding: 0 },
        tile: {
            width: 132, // WHY: two in a row on a phone too
            height: "auto",
            padding: [8, 8],
            gap: 6,
            spacing: 8,
            listPadding: 6,
            iconSize: 116,
            frameSize: 0,
            iconFilter: "",
            iconFit: "cover",
            iconMotion: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: Black(0.05) },
        },
        row: { round: 10, border: 1, borderColor: "transparent", motion: "background-color 0.2s, border-color 0.2s" },
        hover: { color: Black(0.05), lineColor: "" }, // WHY: "": the lines of ozden are not filled in.
        selected: { color: "rgba(63, 141, 148, 0.1)", borderColor: "#3F8D94", opacity: 1, canSelectAgain: 1 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
        icon: { round: 6, color: Black(0.05) },
        title: { fontSize: 14, textColor: Black(0.82), fontFamily: "" },
        desc: { fontSize: 12, textColor: Black(0.5), marginTop: 0 },
        empty: { fontSize: 14, textColor: Black(0.45) },
    },

    // The pictures on a dark page.
    galleryDark: {
        box: { color: "transparent", border: 0, padding: 0 },
        tile: {
            width: 132, // WHY: two in a row on a phone too
            height: "auto",
            padding: [8, 8],
            gap: 6,
            spacing: 8,
            listPadding: 6,
            iconSize: 116,
            frameSize: 0,
            iconFilter: "",
            iconFit: "cover",
            iconMotion: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: White(0.06) },
        },
        row: { round: 10, border: 1, borderColor: "transparent", motion: "background-color 0.2s, border-color 0.2s" },
        hover: { color: White(0.06), lineColor: "" },
        selected: { color: "rgba(91, 186, 193, 0.14)", borderColor: "#5BBAC1", opacity: 1, canSelectAgain: 1 },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
        icon: { round: 6, color: White(0.06) },
        title: { fontSize: 14, textColor: White(0.88), fontFamily: "" },
        desc: { fontSize: 12, textColor: White(0.5), marginTop: 0 },
        empty: { fontSize: 14, textColor: White(0.45) },
        check: { color: "#E6E6E4", iconColor: "#1A1A19", borderColor: White(0.3) },
        search: { styleName: "ozdenDark", color: "#262624" },
        scrollBar: { bar_color: "#CFCFCD", bar_mouseOverColor: "#CFCFCD" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): no fill (the window shows through: its states are lines, so it
// reads on any ground), a line around the list; 28 px rows with a 13 px title and a 14 px icon; a line around the
// row under the mouse, an ink line, an ink title and a tick on the selected one; 2 px between the rows, so the lines
// of two rows never meet. The search box is the head of the list, a line under it. A row with a description needs
// more room: style: { row: { height: 44 } }. minimalDark: the same on a dark window.
ItemList.createMinimalStyle = function (colors) {
    return {
        box: { color: "transparent", border: 1, borderColor: colors.line, round: 4, padding: 4 },
        list: { gap: 2 },
        row: { height: 28, padding: [8, 0], gap: 8, color: "transparent", border: 1, borderColor: "transparent", round: 3, lineColor: "" },
        section: { padding: [8, 6], fontSize: 11, fontFamily: "opensans-bold", textColor: colors.faintText },
        hover: { color: "transparent", lineColor: "", borderColor: colors.lineHover },
        selected: { color: "transparent", lineColor: "", borderColor: colors.ink, opacity: 1, canSelectAgain: 0 },
        disabled: { opacity: 0.4 },
        focus: { ringColor: colors.focus },
        icon: { size: 14, round: 0, color: "transparent" },
        title: { fontSize: 13, textColor: colors.text, selectedTextColor: colors.ink },
        desc: { fontSize: 12, textColor: colors.softText, marginTop: 0 },
        check: { visible: 1, size: 14, color: "transparent", iconColor: colors.ink, borderColor: "transparent" },
        empty: { fontSize: 12, textColor: colors.softText },
        search: { styleName: colors.searchStyleName, height: 30, padding: [0, 0, 0, 0], color: "transparent", border: 0, round: 0, borderBottomStyle: "1px solid " + colors.line, searchIconLeft: 13 },
        scrollBar: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_mouseOverWidth: 4, showDots: 0 },
    };
};
ItemList.MINIMAL_COLORS = {
    text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2), lineHover: Black(0.45),
    ink: "#1F1F1F", focus: "#3D8BD9", searchStyleName: "minimal", scrollBar: "#373836",
};
ItemList.styles.minimal = ItemList.createMinimalStyle(ItemList.MINIMAL_COLORS);
ItemList.MINIMAL_DARK_COLORS = {
    text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18), lineHover: White(0.42),
    ink: "#EDEDEB", focus: "#7FB6DE", searchStyleName: "minimalDark", scrollBar: "#CFCFCD",
};
ItemList.styles.minimalDark = ItemList.createMinimalStyle(ItemList.MINIMAL_DARK_COLORS);
