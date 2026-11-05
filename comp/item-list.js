/* Bismillah */

/*

ItemList - v26.11

UI COMPONENT TEMPLATE
- NEW PROJECTS (the user, 2026-11-05): use styleName "ozden" (the default: the rows of the old comp-m1 SelectItem,
  white with a thin line above and under them under the mouse; its search box the ozden SearchInput in white),
  unless the user asks for another look.
- A list of items: an icon, a title and a description on every row, or your own row (createItemView).
  The new version of comp-m1/item-list.js (ItemList.create / setItemCreationFunction).
- Layouts: "vertical" (a list), "horizontal" (one row of tiles: categories, cards) and "grid" (tiles that
  wrap: files, icons, pictures). setLayout() changes it later.
- Selection: "single", "multiple" or "none". The selected keys: getSelectedKeys(), the items: getSelected().
  onChange(self, selectedItems) is NOT called at create time, by setItems() or with silent: 1.
- Search box: showSearch: 1 puts a SearchInput (comp/search-input-v2.js, load it first) over the list;
  its look is style.search, more params in searchParams (Ex: the icon paths for your page). box.searchInput.
- Search: search(text) shows only the matching items (title, desc and searchText; Turkish letters are
  matched without their marks: "isik" finds "Işık"). It returns the count of the shown items.
- Keyboard: the arrow keys move the focus (Up / Down in a list, Left / Right in a row, all four in a grid),
  Home / End, Enter or Space selects. Only one row is in the Tab order.
- Items: strings or objects { key, title, desc, iconFile, searchText, disabled }. Any other keys stay on the
  item for your createItemView. An item without a key gets its index as its key.
- Sections: an item { type: "section", title: "VIEWS" } is a title row between the items (style.section). It is
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
- Style packages: "ozden" (default: the rows of the comp-m1 SelectItem list, 02-comp-m1-samples/select-item.htm,
  and the tiles of javascript-mobile-app-template; it was "classic", the old name still works), "modern", "dark".
  Select with styleName. (ItemList.styles)

USAGE:
const list = ItemList({
    width: 360,
    height: 400,
    items: [
        { key: "broccoli", title: "Broccoli", desc: "Vegetable", iconFile: "assets/fruids/brokoli.png" },
        { key: "strawberry", title: "Strawberry", desc: "Fruit", iconFile: "assets/fruids/cilek.png" },
    ],
    onChange: function (self, selectedItems) { println(self.getSelectedKeys()); },
});
list.search("fruit");                       // 1 (the count of the shown items)
list.setSelected(["broccoli"], 1);          // silent: onChange is not called
list.addItem({ key: "tomato", title: "Tomato", desc: "Vegetable" });
list.updateItem("tomato", { desc: "Fruit, really" });
list.setLayout("grid");
ItemList({ selection: "multiple", styleName: "modern" });
ItemList({ layout: "horizontal", height: 200, styleName: "dark" });
ItemList({ showSearch: 1, searchParams: { placeholderText: "Ara" } });
ItemList({
    style: { row: { height: "auto" } },
    createItemView: function (item, row, self) {     // Objects created here go into the row.
        Label({ plainText: item.title, fontSize: 18 });
    },
});
ItemList({ items: [{ type: "section", title: "FRUITS" }, "Apple", "Banana", { type: "section", title: "VEGETABLES" }, "Carrot"] });
ItemList({ style: { hover: {} } }); // No look under the mouse
ItemList({ selection: "none", style: { pressed: { color: Black(0.2) }, row: { motion: "background-color 0.3s" } } });
const animatedList = ItemList({ animated: 1, items: ["A", "B", "C"] });
animatedList.removeItem("0");               // "A" fades out, then "B" and "C" move up

Started Date: 14 March 2022 (comp-m1), October 2026 (comp-m4)
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ItemListDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 600,
    height: 400, // "auto": grows with the rows (no scrolling)
    items: [], // Strings or { key, title, desc, iconFile, searchText, disabled }. A title row: { type: "section", title: "VIEWS" }
    layout: "vertical", // "vertical", "horizontal", "grid"
    selection: "single", // "single", "multiple", "none"
    selectedKeys: [], // The keys selected at create time
    scrollToSelected: 1, // 1: the list scrolls to the selected item at create time and after setSelected() / select()
    createItemView: null, // function (item, row, self) { ... } Objects created here go into the row (instead of the icon and texts). Not called for a section.
    createSectionView: null, // function (item, row, self) { ... } Your own section row (instead of its title)
    animated: 0, // 1: addItem / removeItem move the rows (a new row fades in, a removed one fades out). setAnimated(0/1)
    showSearch: 0, // 1: a search box over the list (comp/search-input-v2.js SearchInput must be loaded)
    searchParams: {}, // More params of the SearchInput. Ex: { placeholderText: "Ara", searchIconFile: "../comp/search-input-v2/search.svg" }
    emptyText: "No items",
    noResultText: "No results",
    enabled: 1,
    useScrollBar: 1, // basic/scroll-bar.js. 0: the scrollbar of the browser.
    ariaLabel: "List",
    onItemClick: function (self, item, index, event) { },
    onChange: function (self, selectedItems) { }, // Not at create time, not by setItems(), not with silent: 1
    styleName: "ozden", // "ozden", "modern", "dark" or a name added to ItemList.styles
    style: { // The ozden style package (default): the rows of the comp-m1 SelectItem list, the tiles of javascript-mobile-app-template
        box: {
            color: "transparent",
            border: 1,
            borderColor: "rgba(20, 20, 20, 0.45)",
            round: 8,
            padding: 0, // Around the rows of the vertical layout
        },
        list: {
            gap: 0, // Between the rows of the vertical layout
        },
        // A row of the vertical layout (the list of comp-m1 SelectItem, 02-comp-m1-samples/select-item.htm):
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
            iconMotion: "transform 0.3s",
            hover: {}, // The look under the mouse (the rows use style.hover)
            selectedColor: "white", // "": the color of style.selected (the rows)
            selectedFrameColor: "transparent",
            selectedIconScale: 1.5,
            selectedIconFilter: "grayscale(30%)",
            selectedFontFamily: "opensans-bold", // "": the font does not change
        },
        // A section: an item { type: "section", title: "VIEWS" }, a title between the items
        section: {
            height: "auto",
            padding: [20, 8],
            fontSize: 16,
            fontFamily: "opensans-bold",
            textColor: Black(0.4),
        },
        // A state: only the keys that change
        hover: { color: "white", lineColor: Black(0.2) }, // style: { hover: {} }: no look under the mouse. (The lines: the user, 2026-11-05)
        pressed: { color: null }, // A click, Enter or Space: this color at once, then it fades back (style.row.motion). null: none
        selected: { color: "transparent", lineColor: "", opacity: 0.5 }, // WHY: a selected row does not get the white and its lines under the mouse.
        disabled: { opacity: 0.4 },
        focus: { ringColor: "rgba(55, 56, 54, 0.5)" }, // The ring of the keyboard focus
        icon: { size: 50, round: 4, color: "transparent" },
        title: { fontSize: 20, textColor: "rgba(0, 0, 0, 0.8)", fontFamily: "", selectedTextColor: "" },
        desc: { fontSize: 14, textColor: "gray", marginTop: -4 }, // WHY: -4: the old title (top 25) and description (top 49) overlap a little.
        check: { visible: 0, size: 22, color: "#373836", iconColor: "white", borderColor: Black(0.25) }, // A mark on the selected rows
        empty: { fontSize: 16, textColor: Black(0.4) },
        // The search box (showSearch: 1): the params of SearchInput: its ozden package, white and nearly square
        // (the user, 2026-11-05), as high as the old UISearchBox of the template.
        search: {
            styleName: "ozden", // A package of SearchInput.styles: its border, its bottom line, its icons
            height: 40,
            padding: [0, 0, 0, 0], // left, top, right, bottom: 0, as wide as the list
            fontSize: 18,
            color: "white",
            round: 2,
            searchIconSize: 20,
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
    let searchText = "";
    let wasAnimated = 0;
    const EMPTY_TEXT_TOP = 24; // The "No results" text under the top of the list
    const PRESS_HOLD_TIME = 50; // ms: the pressed color stays this long, then it fades back with the row motion

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
        if (typeof item === "string") return { title: item };
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
        return box.enabled == 1 && !basic.isOn(entry.data.disabled);
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
        return normalizeText([data.title, data.desc, data.searchText].join(" "));
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
        const look = Object.assign({}, _s.row, entry.isHover ? hoverLook : {}, isOn ? selectedLook : {});
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

    // Only one row is in the Tab order: the focused one (or the first shown one).
    const refreshTabOrder = function () {
        const shown = getShownEntries();
        const focused = findEntry(focusedKey);
        const tabEntry = (focused && focused.isShown) ? focused : shown[0];
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

    // A tile icon may sit in a circle (style.tile.frameSize).
    const createTileIcon = function (row, entry) {
        const tile = _s.tile;
        if (!entry.data.iconFile) return;
        if (!(tile.frameSize > 0)) {
            row.icon = createIcon(entry, tile.iconSize);
            return;
        }
        // GROUP: The circle behind the icon
        row.iconFrame = HGroup({ width: tile.frameSize, height: tile.frameSize, align: "center center", round: tile.frameRound, color: tile.frameColor });
        row.iconFrame.position = "relative";
        row.iconFrame.shrink = 0;
        row.iconFrame.clipContent = 0; // WHY: The selected icon grows out of the circle.
        row.iconFrame.setMotion("background-color 0.3s");
            row.icon = createIcon(entry, tile.iconSize);
        endGroup();
    };

    const createTexts = function (row, entry, isTile) {
        // GROUP: Title and description
        row.texts = VGroup({ width: isTile ? "100%" : "auto", height: "auto", align: isTile ? "center top" : "left center", gap: 0 });
        row.texts.css = { flex: isTile ? "" : "1 1 0", minWidth: "0", alignItems: "stretch" };

            row.lblTitle = Label({ plainText: entry.data.title || "", width: "100%", fontSize: _s.title.fontSize, ellipsis: 1 });
            if (_s.title.fontFamily) row.lblTitle.fontFamily = _s.title.fontFamily;

            if (entry.data.desc) {
                row.lblDesc = Label({ plainText: entry.data.desc, width: "100%", fontSize: _s.desc.fontSize, textColor: _s.desc.textColor, ellipsis: 1 });
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
        row.cursor = "pointer";
        row.clickable = 1;
        row.clipContent = 0; // WHY: The focus ring is drawn on the edge of the row.
        if (_s.row.boxShadow) row.boxShadow = _s.row.boxShadow;
        setStartMotion(row, entry);
        row.role = "option";
        row.aria = { label: entry.data.title || entry.key };
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
                row.lblTitle = Label({ plainText: entry.data.title || "", width: width, fontSize: section.fontSize, textColor: section.textColor, ellipsis: 1 });
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
            if (entry.isLeaving || !isEntryEnabled(entry)) return;
            flashRow(entry);
            focusedKey = entry.key;
            refreshTabOrder();
            box.onItemClick(box, entry.item, indexOf(entry), event);
            toggleEntry(entry, 0);
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
            box.wrapper.aria = { label: box.ariaLabel, multiselectable: (box.selection === "multiple") ? "true" : "false" };
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
        if (silent || before === selectedKeys.join("\n")) return;
        box.onChange(box, getSelectedItems());
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

    const onRowKeyDown = function (entry, event) {
        // WHY: the keys of a field inside the row (createItemView) are its own: a space could not be typed in it
        if (event.target !== entry.row.elem) return;
        if (box.enabled != 1 || entry.isLeaving) return;
        const shown = getShownEntries();

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!isEntryEnabled(entry)) return;
            flashRow(entry);
            toggleEntry(entry, 0);
            return;
        }
        if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            focusEntry(event.key === "Home" ? shown[0] : shown[shown.length - 1]);
            return;
        }

        const target = getArrowTarget(entry, event.key, shown);
        if (!target) return;
        event.preventDefault();
        focusEntry(target);
    };

    // The search box over the list (showSearch: 1). Returns its height with its padding (0: no search box).
    const createSearch = function () {
        if (box.showSearch != 1) return 0;
        if (typeof SearchInput === "undefined") {
            console.warn("ItemList: showSearch needs comp/search-input-v2.js (SearchInput).");
            return 0;
        }
        const search = _s.search;
        const padding = search.padding; // [left, top, right, bottom]

        // GROUP: Search area
        box.searchArea = HGroup({ width: "100%", height: search.height + padding[1] + padding[3], align: "left top", padding: padding });
        if (isAutoHeight) box.searchArea.position = "relative";
            const searchParams = Object.assign({}, search, box.searchParams);
            delete searchParams.padding;
            searchParams.width = "100%";
            searchParams.position = "relative";
            searchParams.onSearch = function (text) { box.search(text); };
            box.searchInput = SearchInput(searchParams);
        endGroup();

        return search.height + padding[1] + padding[3];
    };

    // A search() from code shows its text in the search box too.
    // WHY: Only when it is another text: the box gives a lower case text to search(); it must not change what is typed.
    const syncSearchInput = function (text) {
        if (!box.searchInput) return;
        if (normalizeText(box.searchInput.getText()).trim() === normalizeText(text).trim()) return;
        box.searchInput.setText(String(text || ""));
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items) {
        entries = (Array.isArray(items) ? items : []).map(toEntry);
        selectedKeys = selectedKeys.filter(isSelectableKey);
        if (!findEntry(focusedKey)) focusedKey = null;
        createRows();
    };
    // USAGE: list.setItems([{ key: "a", title: "A" }, "B"]) // onChange is not called. Selected keys that are still there stay selected.

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
    // USAGE: list.addItem({ key: "x", title: "X" }) or list.addItem({ key: "y", title: "Y" }, 0)

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
    // USAGE: list.updateItem("tomato", { desc: "Fruit", iconFile: "tomato.png" })

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
        scrollToFirstSelected();
    };
    // USAGE: list.setSelected("broccoli") or list.setSelected(["a", "b"], 1)

    box.select = function (key, silent = 0) {
        const entry = findEntry(key);
        if (!entry || entry.isSection || isSelected(entry)) return;
        toggleEntry(entry, silent);
        if (box.scrollToSelected == 1) scrollRowIntoView(entry);
    };

    box.unselect = function (key, silent = 0) {
        setSelectedKeys(selectedKeys.filter(function (k) { return k !== String(key); }), silent);
    };

    box.clearSelection = function (silent = 0) {
        setSelectedKeys([], silent);
    };

    // Shows only the matching items (and the sections over them). Returns the count of the shown items. "": all of them.
    box.search = function (text) {
        searchText = normalizeText(text).trim();
        syncSearchInput(text);
        applySearch();
        return getShownEntries().length;
    };
    // USAGE: searchInput.onSearch = function (text) { list.search(text); };

    box.setLayout = function (layout) {
        box.layout = normalizeLayout(layout);
        refreshScrollAxes();
        createRows();
    };
    // USAGE: list.setLayout("grid") // "vertical", "horizontal", "grid"

    box.setSelection = function (selection) {
        box.selection = selection;
        selectedKeys = cleanKeys(selectedKeys);
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
// USAGE: ItemList({ styleName: "modern" })
// USAGE: ItemList({ styleName: "dark", style: { row: { round: 4 } } }) // Change only some keys.
// USAGE: ItemList({ style: ItemList.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (ozden) style.
// USAGE: ItemList.styles.myStyle = { row: { color: "ivory" } };
ItemList.styles = {

    // The rows of the comp-m1 SelectItem list (white under the mouse, the selected one half transparent) and the
    // tiles of javascript-mobile-app-template (a grey icon in a circle that grows when it is selected).
    ozden: ItemListDefaults.style,

    // WHY: The old name of ozden: a page written with styleName: "classic" gets the same look without a warning.
    classic: ItemListDefaults.style,

    // Light cards with a thin border and a check mark on the selected rows.
    modern: {
        box: { padding: 8 },
        list: { gap: 8 },
        row: {
            height: 64,
            padding: [14, 10],
            gap: 14,
            color: "white",
            border: 1,
            borderColor: Black(0.08),
            round: 12,
            boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.04)",
            motion: "background-color 0.2s, border-color 0.2s",
        },
        // WHY: The effects of the ozden tiles (a grey icon in a circle that grows) are turned off.
        tile: {
            width: 132,
            height: "auto",
            padding: [12, 14],
            gap: 8,
            spacing: 8,
            listPadding: 8,
            iconSize: 56,
            frameSize: 0,
            iconFilter: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: "#F7F8F6", borderColor: Black(0.14) },
        },
        section: { padding: [14, 6], fontSize: 13, textColor: Black(0.45) }, // WHY: 14: over the texts of the cards
        hover: { color: "#F7F8F6", borderColor: Black(0.14), lineColor: "" }, // WHY: "": the lines of ozden are not filled in.
        selected: { color: "#EEF6F3", borderColor: "#3D7A6B", opacity: 1 },
        focus: { ringColor: "rgba(61, 122, 107, 0.6)" },
        icon: { size: 40, round: 10, color: "#F1F2EF" },
        title: { fontSize: 15, textColor: Black(0.85), fontFamily: "opensans-bold" },
        desc: { fontSize: 13, textColor: Black(0.5), marginTop: 0 },
        check: { visible: 1, size: 20, color: "#3D7A6B", iconColor: "white", borderColor: Black(0.2) },
        empty: { fontSize: 14, textColor: Black(0.45) },
        search: {
            styleName: "classic", // WHY: not the ozden package of the default search box
            height: 40,
            padding: [8, 8, 8, 4],
            fontSize: 15,
            color: "white",
            border: 1,
            borderColor: Black(0.1),
            borderBottomStyle: "1px solid " + Black(0.1),
            round: 10,
            searchIconSize: 18,
        },
        scrollBar: { bar_color: "#A0A0A0", bar_mouseOverColor: "#6E6E6C", neverHide: 0, showDots: 0 },
    },

    // The dark cards of the Ozden Panel (webpage-ozden-panel, theme "dark").
    dark: {
        box: { padding: 8 },
        list: { gap: 8 },
        row: {
            height: 64,
            padding: [14, 10],
            gap: 14,
            color: "#1A1A19", // surface: a card
            border: 1,
            borderColor: White(0.08),
            round: 10,
            motion: "background-color 0.2s, border-color 0.2s",
        },
        // WHY: The effects of the ozden tiles (a grey icon in a circle that grows) are turned off.
        tile: {
            width: 132,
            height: "auto",
            padding: [12, 14],
            gap: 8,
            spacing: 8,
            listPadding: 8,
            iconSize: 56,
            frameSize: 0,
            iconFilter: "",
            selectedIconScale: 1,
            selectedIconFilter: "",
            selectedFontFamily: "",
            selectedColor: "",
            hover: { color: "#232322" },
        },
        section: { padding: [14, 6], fontSize: 13, textColor: White(0.45) }, // WHY: 14: over the texts of the cards
        hover: { color: "#232322", lineColor: "" }, // surface2. WHY: "": the lines of ozden are not filled in.
        selected: { color: "#2C2C2A", borderColor: "#65A293", opacity: 1 }, // surface3, accent
        focus: { ringColor: "#65A293" },
        icon: { size: 40, round: 8, color: "#232322" },
        title: { fontSize: 15, textColor: White(0.9), fontFamily: "opensans-bold" },
        desc: { fontSize: 13, textColor: White(0.45), marginTop: 0 },
        check: { visible: 1, size: 20, color: "#65A293", iconColor: "#141414", borderColor: White(0.25) },
        empty: { fontSize: 14, textColor: White(0.45) },
        search: {
            styleName: "classic", // WHY: not the ozden package of the default search box
            height: 40,
            padding: [8, 8, 8, 4],
            fontSize: 15,
            color: "#232322", // surface2: a field
            textColor: White(0.9),
            placeholderColor: White(0.35),
            border: 1,
            borderColor: White(0.1),
            borderBottomStyle: "1px solid " + White(0.1),
            round: 8,
            searchIconSize: 18,
            invertIconColor: 1,
        },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", neverHide: 0, showDots: 0 },
    },

};
