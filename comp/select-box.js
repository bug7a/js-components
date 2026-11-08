/* Bismillah */

/*

Select Box - v26.09

UI COMPONENT TEMPLATE
- A dropdown select: a field that opens a list (popup) under or above it.
- Single or multiple selection (multiple: 1). "Select all" and "Clear" for multiple.
- Search in the list (searchable: "auto" -> when there are more than 8 options). Matches are highlighted.
- The search box is a SearchInput (comp/search-input.js, with its clear button) when that file is loaded
  before this one (useSearchInput: 1). Its look: style.searchInput (the params of SearchInput). Without it the
  search box is an own input (its look: style.search).
- The list at the full height of the page (fullHeightList: 1): as wide as the field, at its left, from the top
  of the page to its bottom, and it stays that high when a search leaves a few rows.
  A resize of the page places it again (the normal list closes).
- Options can have a description, an icon, a group title and can be disabled.
- style.optionSelected.canSelectAgain: 0 (ozden, ozdenDark): the selected row (single) can not be chosen again:
  no look under the mouse or the keys, the keys skip it, a click on it does nothing.
- An edge around the rows (style.option.border, borderColor; optionActive.borderColor, optionSelected.borderColor) and
  space between them (style.option.space): the minimal packages frame the row under the mouse and the selected one.
  optionSelected.tickSize: the tick of the selected row (16).
- Clear button in the field (clearable: 1).
- Keyboard: Enter / Space / ArrowDown opens. ArrowUp / ArrowDown / Home / End move, Enter selects,
  Escape closes, Tab closes. Typing on the closed field opens the search with the typed letter.
- Accessibility: combobox + listbox roles, aria-expanded, aria-selected, aria-activedescendant.
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- Big lists: Only the first "maxRenderCount" matches are drawn. (Search shows the others.)
- The list scrolls with basic/scroll-bar.js (useScrollBar: 1, style.scrollBar) when it is loaded before.
- Your own rows: createItemView(option, row, self) draws an option with your objects. The list is then a
  ItemList (load comp/item-list.js before this file; without it: a warning and the normal rows).
  The search box, the keyboard, single / multiple, disabled options and onChange work the same.
  (Not in this mode: the group titles, the highlight of the search and maxRenderCount.) The list: box.itemList.
  The search finds the label, the description, the group and option.searchText (Turkish letters without marks).
- Your own field: createValueView(option, field, self) draws the selected option in the field with your
  objects (single selection; the placeholder and the multiple text stay as they are).
- Style packages: "light" (default; the old name "classic" works too), "dark", "ozden" (a package of params: 350 x 50, a search box, the list goes down to the bottom of the page),
  "ozdenDark" (the same on a dark page). Select with styleName. (SelectBox.styles)
  NEW PROJECTS: use "light" (the default) on a light page and "dark" on a dark page, the
  looks of 02-comp-examples/select-box.htm, unless the user asks for another look ("ozden" / "ozdenDark" only when
  asked).
- scale: multiplies every size (the style, width / height / panelMinWidth / panelMaxHeight, the spaces in the
  code, the search box, the rows, the checks). Its default is basic.uiScale: on a page fitted with page.fit()
  (basic.uiScale = 1 / page.zoom) the field and its list keep their size on the screen. The objects of
  createItemView / createValueView are yours: multiply their sizes with self.scale (Ex: fontSize: 16 * self.scale).
  (Needs basic.js v26.11.01 for a scale other than 1.)

OPTION: { value, label, description, iconFile, group, disabled }
- A string or a number is also accepted: "Apple" -> { value: "Apple", label: "Apple" }

USAGE:
const fruit = SelectBox({
    width: 260,
    options: ["Apple", "Banana", { value: "cherry", label: "Cherry", description: "Red and sweet" }],
    value: "Banana",
    clearable: 1,
    onChange: (self) => println(self.value),
});
fruit.setValue("cherry");               // onChange is called
fruit.setValue("Apple", 1);             // silent: onChange is not called
const skills = SelectBox({ multiple: 1, options: ["JS", "CSS", "SQL"], value: ["JS"] });
skills.getSelectedOptions();            // [{ value: "JS", label: "JS", ... }]

// Your own rows and field (load comp/item-list.js first). The other keys of an option stay on it.
const country = SelectBox({
    styleName: "ozden",
    options: [{ value: "TR", label: "Türkiye", code: "+90", searchText: "Turkey" }, { value: "DE", label: "Germany", code: "+49" }],
    value: "TR",
    createItemView: function (option, row, self) {    // Objects created here go into the row (an HGroup).
        Label({ plainText: option.code, fontSize: 16 });
        Label({ plainText: option.label, fontSize: 20 });
    },
    createValueView: function (option, field, self) { // Objects created here go into the field (an HGroup).
        Label({ plainText: option.code + " " + option.label, fontSize: 20 });
    },
});

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SelectBoxDefaults = {
    key: "0",
    width: 240,
    height: 44,
    options: [], // [{ value, label, description, iconFile, group, disabled }] or ["A", "B"]
    value: null, // Single: a value or null. Multiple: [values]
    multiple: 0,
    searchable: "auto", // 1, 0, "auto" (more than autoSearchCount options)
    autoSearchCount: 8,
    clearable: 0, // 1: Clear button in the field
    closeOnSelect: null, // null: 1 for single, 0 for multiple
    showSelectAll: 1, // Multiple: "Select all" and "Clear" buttons
    placeholder: "Select...",
    searchPlaceholder: "Search...",
    emptyText: "No results",
    selectAllText: "Select all",
    clearText: "Clear",
    moreText: "+{count}", // Multiple: field text when many are selected. Ex: "Apple, Banana +3"
    fieldLabelCount: 2, // Multiple: how many labels are written in the field
    panelMinWidth: 220,
    panelMaxHeight: 320,
    maxRenderCount: 300,
    enabled: 1,
    useScrollBar: 1, // basic/scroll-bar.js on the list (load it first). 0: the scrollbar of the browser (hidden by basic.css in Chrome).
    useSearchInput: 1, // 1: the search box is a SearchInput when comp/search-input.js is loaded first (style.searchInput). 0: the own input (style.search)
    fullHeightList: 0, // 1: the list opens from the top of the page to its bottom, as wide as the field, at its left. (box.setFullHeightList())
    scale: null, // Multiplies every size. null: basic.uiScale (1, or 1 / page.zoom on a fitted page). (Only at create time)
    ariaLabel: "",
    createItemView: null, // function (option, row, self) { ... } Your own rows: the list is an ItemList (load comp/item-list.js first). Its look: style.itemList
    createValueView: null, // function (option, field, self) { ... } Your own view of the selected option in the field (single selection)
    onChange: function (self) { }, // self.value, self.getSelectedOptions()
    onOpen: function (self) { },
    onClose: function (self) { },
    styleName: "light", // "light" ("classic": its old name), "dark", "ozden", "ozdenDark", "minimal", "minimalDark" or a name added to SelectBox.styles
    style: { // Light style package (default)
        field: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
            padding: [12, 0],
        },
        fieldHover: {
            borderColor: Black(0.5),
        },
        fieldFocus: {
            borderColor: "#141414",
        },
        fieldText: {
            fontSize: 16,
            textColor: Black(0.85),
        },
        // The icon and the description of the selected option in the field (single selection)
        fieldOption: {
            iconSize: 0, // 0: no icon in the field
            iconRound: 0,
            iconMarginLeft: 0,
            gap: 8,
            showDescription: 0,
            emptyIconColor: "", // A box in the place of the icon when nothing is selected. "": no box
        },
        placeholder: {
            textColor: Black(0.4),
        },
        arrow: {
            color: Black(0.55),
            icon: "chevron", // "chevron" (rotates when open), "unfold" (up and down)
            size: 16,
            opacity: 1,
            marginRight: 0, // A negative value moves it into the padding of the field
        },
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 10,
            padding: 6,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            gap: 6,
            coverField: 0, // 1: the panel opens over the field (at its top, as wide as it)
            motion: "", // Ex: "opacity 0.2s, transform 0.2s": the panel fades and grows in (and out)
            motionDuration: 200, // ms of the motion (the close waits for it)
            startScale: 0.9,
        },
        // The search box when it is a SearchInput: its params (a styleName of SearchInput.styles and its look params).
        // Its icons are the ones of SearchInput (searchIconFile, clearIconFile: your own pictures).
        searchInput: {
            styleName: "original", // the first look of SearchInput
            height: 38,
            searchIconLeft: 10, // WHY: the icon and the text at the place of the own search input (icon 18, text 42)
            color: Black(0.04),
            border: 1,
            borderColor: Black(0.1),
            borderBottomStyle: "1px solid rgba(0, 0, 0, 0.1)", // WHY: the bottom line of SearchInput takes the place of the border there.
            round: 6,
            fontSize: 14,
            textColor: Black(0.85),
            placeholderColor: "",
            searchIconSize: 16,
            searchIconGap: 8, // Between the icon and the text (the default of SearchInput: here, so that scale changes it)
            searchIconOpacity: 0.55,
            clearIconOpacity: 0.45,
            invertIconColor: 0,
        },
        // The own search box (when SearchInput is not loaded)
        search: {
            color: Black(0.04),
            border: 1,
            borderColor: Black(0.1),
            round: 6,
            fontSize: 14,
            textColor: Black(0.85),
            height: 38,
            padding: [10, 0],
            iconSize: 16,
            borderBottom: "", // Ex: "2px solid rgba(0, 0, 0, 0.06)"
        },
        option: {
            fontSize: 15,
            textColor: Black(0.85),
            round: 6,
            padding: [10, 8],
            gap: 10,
            minHeight: 0,
            iconSize: 22,
            iconRound: 0,
            iconMargin: [0, 0], // [left, top and bottom]
            border: 0, // px: an edge around every row (its color: borderColor, optionActive / optionSelected.borderColor)
            borderColor: "transparent",
            space: 0, // px between two rows (Ex: 2: the edges of two rows do not meet)
        },
        optionActive: {
            color: Black(0.06),
            lineColor: "", // A line above and under the active row (1 px, inside it: no row moves). "": none
            borderColor: "", // The edge of the active row (option.border). "": the edge of the row
            showAtOpen: 1, // 0: no row is marked when the list opens (only under the mouse / the keyboard)
        },
        optionSelected: {
            textColor: "#141414",
            checkColor: "#141414",
            checkTickColor: White(1),
            fontFamily: "opensans-bold", // Single selection. "": the font does not change
            showTick: 1, // Single selection: a tick on the right
            tickSize: 16, // px of the tick
            borderColor: "", // The edge of the selected row (option.border). "": the edge of the row
            opacity: 1,
            canSelectAgain: 1, // 0 (single): the selected row can not be chosen again: no look under the mouse or the keys, the keys skip it, a click on it does nothing
        },
        optionDisabled: {
            opacity: 0.4,
        },
        description: {
            fontSize: 12,
            textColor: Black(0.5),
            marginTop: 0,
        },
        group: {
            fontSize: 11,
            textColor: Black(0.45),
        },
        highlight: {
            color: "rgba(255, 196, 0, 0.35)",
        },
        empty: {
            fontSize: 14,
            textColor: Black(0.45),
        },
        footerButton: {
            fontSize: 13,
            textColor: "#3871E0",
        },
        divider: {
            color: Black(0.08),
        },
        disabled: {
            opacity: 0.4,
        },
        // The package of the ItemList of createItemView (ItemList.styles)
        itemListStyleName: "ozden",
        // The style of the ItemList of createItemView (the keys of ItemList.styles.ozden: row, hover, selected,
        // disabled, check...). Its empty text takes style.empty. The check mark is shown only for multiple.
        itemList: {
            box: { color: "transparent", border: 0, round: 0, padding: 0 },
            list: { gap: 0 },
            row: { height: "auto", padding: [8, 8], gap: 10, color: "transparent", round: 6, motion: "" },
            hover: { color: Black(0.06), lineColor: "" }, // WHY: "": no lines above and under the row (ItemList ozden has them).
            selected: { color: Black(0.04), opacity: 1 },
            disabled: { opacity: 0.4 },
            focus: { ringColor: "transparent" }, // WHY: The keyboard stays in the field / search box (the active row is painted).
            check: { size: 18, color: "#141414", iconColor: White(1), borderColor: Black(0.3) },
        },
        scrollBar: { // The params of ScrollBar (basic/scroll-bar.js)
            bar_color: "#9A9A98",
            bar_mouseOverColor: "#6A6A68",
            bar_width: 4,
            bar_mouseOverWidth: 4, // (the default of ScrollBar: here, so that scale changes it)
            bar_round: 3,
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
            neverHide: 0,
            showDots: 0,
        },
    }
};

const SelectBox = function (params = {}) {

    // Merge style package: params.style > SelectBox.styles[styleName] > SelectBoxDefaults.style (light)
    basic.applyStylePackage(params, SelectBox.styles, SelectBoxDefaults);
    SelectBox.fillSearchInputPackage(params.style);

    // Merge params:
    mergeIntoIfMissing(params, SelectBoxDefaults);

    // Scale: the sizes of the style and of the params are multiplied. (A page fitted with page.fit() sets basic.uiScale.)
    SelectBox.applyScale(params);

    // WHY: startObject() copies params (only 4 levels) and keeps arrays by reference. Options and value are kept out of it.
    const startOptions = params.options;
    const startValue = params.value;
    delete params.options;
    delete params.value;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "selectbox-" + (SelectBox._counter++);
    let isOpen = 0;
    let isMouseOver = 0;
    let isFocused = 0;
    let searchText = "";
    let rows = []; // Drawn option rows: [{ row, option }]
    let activeIndex = -1; // Index in rows
    const scale = box.scale; // The px of the code below are multiplied by it, like the style.
    const PANEL_GAP = 6 * scale; // px between the field and the panel
    const SCREEN_MARGIN = 8 * scale; // px: the panel stays this far from the edges of the page
    const MIN_LIST_HEIGHT = 80 * scale; // px: the list is not made shorter than this when the space is small
    const CHECK_SIZE = 18 * scale; // The check box of a row (multiple)
    const TICK_SIZE = _s.optionSelected.tickSize; // The tick of the selected row (single; the style is scaled already)
    const CLEAR_BUTTON_SIZE = 20 * scale; // The clear button of the field
    const CLEAR_ICON_SIZE = 14 * scale;
    const BUTTON_ROUND = 4 * scale; // The clear button and the footer buttons
    const MARK_ROUND = 3 * scale; // The highlight of the search
    const MESSAGE_PADDING = [8 * scale, 14 * scale]; // [x, y] "No results"
    const MORE_MESSAGE_PADDING = [8 * scale, 8 * scale]; // "Showing 300 of 900. Type to search."
    const GROUP_PADDING = [8 * scale, 4 * scale]; // The title of a group of options
    const GROUP_LETTER_SPACING = 1 * scale;
    const GROUP_SPACE_TOP = 6 * scale; // Above a group title that is not the first row
    const SEARCH_GAP = 8 * scale; // The own search box: between its icon and its input
    const SEARCH_INPUT_SPACE = 4 * scale; // The own search box: its input is this much shorter than the box
    const FOOTER_PADDING = [4 * scale, 6 * scale];
    const FOOTER_BUTTON_PADDING = [6 * scale, 2 * scale];
    const DIVIDER_WIDTH = 1 * scale; // The line above the footer
    const OVERLAY_Z_INDEX = 1000;
    const PANEL_Z_INDEX = 1001;
    // createItemView: the list is an ItemList (box.itemList), made at the first open.
    const usesItemList = (typeof box.createItemView === "function") && SelectBox.canUseItemList();
    let fieldViewOption = null; // The option that createValueView has drawn in the field
    // The search box is a SearchInput (box.searchGroup) when comp/search-input.js is loaded. box.searchInput: its input.
    const usesSearchInput = (box.useSearchInput == 1) && SelectBox.canUseSearchInput();

    // *** PUBLIC VARIABLES:
    // [var] Normalized options
    box.options = [];
    // [var] Single: value or null. Multiple: array
    box.value = null;

    // *** PRIVATE FUNCTIONS:

    const isMultiple = function () {
        return box.multiple == 1;
    };

    const isSearchable = function () {
        if (box.searchable === "auto") return box.options.length > box.autoSearchCount;
        return box.searchable == 1;
    };

    const sameValue = function (a, b) {
        return a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b);
    };

    const isSelected = function (option) {
        if (isMultiple()) return box.value.some(function (v) { return sameValue(v, option.value); });
        return sameValue(box.value, option.value);
    };

    // single, style.optionSelected.canSelectAgain: 0 (ozden): the selected row can not be chosen again.
    const isLockedOption = function (option) {
        return _s.optionSelected.canSelectAgain == 0 && !isMultiple() && isSelected(option);
    };

    // A row the mouse and the keys can make active (and choose): not disabled, not the locked selected one.
    const isActivatable = function (option) {
        return !option.disabled && !isLockedOption(option);
    };

    const findOption = function (value) {
        return box.options.find(function (option) { return sameValue(option.value, value); });
    };

    // Multiple: a value, an array or nothing -> an array
    const toValueList = function (value) {
        if (Array.isArray(value)) return value;
        if (value === null || value === undefined || value === "") return [];
        return [value];
    };

    const normalizeValue = function (value) {
        if (isMultiple()) {
            const list = toValueList(value);
            // WHY: Only values that are in the options. The order of the options is used.
            const selectedOptions = box.options.filter(function (option) {
                return list.some(function (v) { return sameValue(v, option.value); });
            });
            return selectedOptions.map(function (option) { return option.value; });
        }
        const option = findOption(value);
        return (option) ? option.value : null;
    };

    const getFilteredOptions = function () {
        const text = searchText.trim().toLocaleLowerCase();
        if (!text) return box.options;
        return box.options.filter(function (option) {
            return (option.label + " " + option.description + " " + option.group).toLocaleLowerCase().includes(text);
        });
    };

    // Label with the search match highlighted (safe HTML)
    const highlight = function (label) {
        const text = searchText.trim();
        const escaped = SelectBox.escapeHtml(label);
        if (!text) return escaped;
        const index = label.toLocaleLowerCase().indexOf(text.toLocaleLowerCase());
        if (index < 0) return escaped;
        const before = SelectBox.escapeHtml(label.slice(0, index));
        const match = SelectBox.escapeHtml(label.slice(index, index + text.length));
        const after = SelectBox.escapeHtml(label.slice(index + text.length));
        const markStyle = "background:" + _s.highlight.color + "; color: inherit; border-radius: " + MARK_ROUND + "px";
        return before + "<mark style='" + markStyle + "'>" + match + "</mark>" + after;
    };

    // Creates the objects of a container again, in one group (container.wrapper).
    const renderInto = function (container, buildContent, gap = 0) {
        if (container.wrapper) container.wrapper.remove();
        createIn(container, function () {
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: gap, position: "relative" });
            container.wrapper.css.alignItems = "stretch";
                buildContent();
            endGroup();
        });
    };

    const getFieldBorderColor = function () {
        if (isOpen || isFocused) return _s.fieldFocus.borderColor;
        if (isMouseOver) return _s.fieldHover.borderColor;
        return _s.field.borderColor;
    };

    // A small SVG picture in a Label that does not shrink in a group.
    const createSvgLabel = function (svg, size) {
        const label = Label({ text: svg, width: size, height: size });
        label.shrink = 0;
        label.lineHeight = "0";
        return label;
    };

    // The icon and the description of the selected option in the field (style.fieldOption).
    const updateFieldOption = function (option) {
        const hasIcon = _s.fieldOption.iconSize > 0 && option && option.iconFile;
        // WHY: An empty box keeps the place of the icon: the placeholder text starts where a selected label starts.
        const hasIconOptions = box.options.some(function (o) { return o.iconFile; }); // WHY: Text options have no icon place.
        const hasEmptyIcon = _s.fieldOption.iconSize > 0 && !option && _s.fieldOption.emptyIconColor && hasIconOptions;
        box.fieldIcon.visible = (hasIcon || hasEmptyIcon) ? 1 : 0;
        box.fieldIcon.color = hasEmptyIcon ? _s.fieldOption.emptyIconColor : "transparent";
        box.fieldIcon.imageElement.style.visibility = hasEmptyIcon ? "hidden" : "visible";
        // WHY: Loaded again only when it changed, so the icon does not flicker.
        if (hasIcon && box.fieldIcon.imageElement.getAttribute("src") != option.iconFile) box.fieldIcon.load(option.iconFile);

        const hasDescription = basic.isOn(_s.fieldOption.showDescription) && option && option.description;
        box.fieldDescription.visible = hasDescription ? 1 : 0;
        box.fieldDescription.text = hasDescription ? SelectBox.escapeHtml(option.description) : "";
    };

    // createValueView: the selected option drawn by the page in the field, in the place of the text.
    const updateFieldView = function (option) {
        if (typeof box.createValueView !== "function") return;
        const isShown = !!option;
        box.fieldTexts.visible = isShown ? 0 : 1; // WHY: The placeholder is still the text of the field.
        if (isShown) box.fieldIcon.visible = 0;
        if (!isShown) {
            removeFieldView();
            return;
        }
        // WHY: Drawn again only when the option changed (setOptions() makes new option objects).
        if (option !== fieldViewOption) drawFieldView(option);
    };

    const removeFieldView = function () {
        if (box.fieldView) box.fieldView.remove();
        box.fieldView = null;
        fieldViewOption = null;
    };

    const drawFieldView = function (option) {
        removeFieldView();
        createIn(box.field, function () {
            // GROUP: The view of the page
            box.fieldView = HGroup({ width: "auto", height: "100%", align: "left center", gap: _s.fieldOption.gap });
            box.fieldView.css = { flex: "1 1 auto", minWidth: "0" };
                box.createValueView(option, box.fieldView, box);
            endGroup();
        });
        // WHY: In the place of the text: before the clear button and the arrow.
        box.field.elem.insertBefore(box.fieldView.elem, box.clearButton.elem);
        fieldViewOption = option;
    };

    const updateField = function () {

        const selected = box.getSelectedOptions();
        let text = "";

        if (isMultiple()) {
            const names = selected.slice(0, box.fieldLabelCount).map(function (option) { return SelectBox.escapeHtml(option.label); });
            text = names.join(", ");
            if (selected.length > box.fieldLabelCount) text += " " + box.moreText.replace("{count}", selected.length - box.fieldLabelCount);
        } else if (selected[0]) {
            text = SelectBox.escapeHtml(selected[0].label);
        }

        box.fieldText.text = text || SelectBox.escapeHtml(box.placeholder);
        box.fieldText.textColor = (text) ? _s.fieldText.textColor : _s.placeholder.textColor;
        updateFieldOption(isMultiple() ? null : selected[0]);
        updateFieldView(isMultiple() ? null : selected[0]);

        box.clearButton.visible = (box.clearable == 1 && selected.length > 0 && box.enabled == 1) ? 1 : 0;

        box.field.borderColor = getFieldBorderColor();
        if (_s.arrow.icon === "chevron") box.arrow.css.transform = (isOpen) ? "rotate(180deg)" : "rotate(0deg)";

        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.aria = {
            expanded: (isOpen) ? "true" : "false",
            disabled: (box.enabled == 1) ? "false" : "true",
        };

    };

    // Draws the option rows. (Filtered by the search)
    const renderList = function () {

        if (usesItemList) {
            renderItemList();
            return;
        }

        const list = getFilteredOptions();
        const shown = list.slice(0, box.maxRenderCount);
        rows = [];

        renderInto(box.list, function () {

            if (list.length == 0) {
                Label({ text: SelectBox.escapeHtml(box.emptyText), width: "100%", textAlign: "center", padding: MESSAGE_PADDING, ..._s.empty });
                return;
            }

            let lastGroup = "";

            shown.forEach(function (option) {

                if (option.group && option.group != lastGroup) {
                    lastGroup = option.group;
                    Label({ text: SelectBox.escapeHtml(option.group.toUpperCase()), padding: GROUP_PADDING, ..._s.group });
                    that.css = {
                        letterSpacing: GROUP_LETTER_SPACING + "px",
                        marginTop: (rows.length) ? GROUP_SPACE_TOP + "px" : "0px",
                    };
                }

                rows.push({ row: createOptionRow(option, rows.length), option: option });

            });

            if (list.length > shown.length) {
                const moreText = "Showing " + shown.length + " of " + list.length + ". Type to search.";
                Label({ text: moreText, width: "100%", textAlign: "center", padding: MORE_MESSAGE_PADDING, ..._s.empty });
            }

        }, _s.option.space);

        setActive(getStartActiveIndex(), 0);

        box.list.aria = { multiselectable: (isMultiple()) ? "true" : "false" };
        refreshScrollBar();

    };

    const refreshScrollBar = function () {
        if (box.scrollBar) box.scrollBar.refreshScroll();
    };

    // *** THE ITEMLIST OF createItemView
    // WHY: The keyboard of the ItemList moves the focus into the rows; here the focus stays in the field or
    //      the search box (a combobox), so the active row is painted by SelectBox (aria-activedescendant).

    // An option as an item of the ItemList. The key is its index in box.options.
    const toListItem = function (option, index) {
        return {
            key: String(index),
            text: option.label,
            description: option.description,
            searchText: [option.group, option.searchText || ""].join(" "),
            enabled: basic.isOn(option.disabled) ? 0 : 1,
            option: option,
        };
    };

    const getListKey = function (option) {
        return String(box.options.indexOf(option));
    };

    const getItemListStyle = function () {
        const check = Object.assign({}, _s.itemList.check, { visible: isMultiple() ? 1 : 0 });
        // WHY: The rows of the ItemList follow optionSelected.canSelectAgain: one setting for both kinds of rows (the
        //      ozden package of ItemList has 0, so a classic SelectBox must give its 1).
        const selected = Object.assign({}, _s.itemList.selected, { canSelectAgain: _s.optionSelected.canSelectAgain });
        return Object.assign({}, _s.itemList, { empty: _s.itemList.empty || _s.empty, check: check, selected: selected });
    };

    const createListItemView = function (item, row) {
        if (_s.option.minHeight) row.css.minHeight = _s.option.minHeight + "px";
        box.createItemView(item.option, row, box);
    };

    const createItemList = function () {
        createIn(box.list, function () {
            box.itemList = ItemList({
                width: "100%",
                height: "auto",
                position: "relative",
                items: [],
                selection: isMultiple() ? "multiple" : "single",
                scrollToSelected: 0,
                useScrollBar: 0,
                createItemView: createListItemView,
                emptyText: box.emptyText,
                noResultText: box.emptyText,
                ariaLabel: box.ariaLabel || "List",
                onItemClick: onListItemClick,
                onChange: onListChange,
                styleName: _s.itemListStyleName,
                style: getItemListStyle(),
                scale: 1, // WHY: style.itemList is scaled already (with the style of SelectBox).
            });
        });
        fillItemList();
    };

    // The rows of the options, made again (at the first open and by setOptions).
    const fillItemList = function () {
        box.itemList.setItems(box.options.map(toListItem));
        // WHY: box.list is the listbox of the combobox: the group of the ItemList is not one more listbox.
        box.itemList.wrapper.role = "none";
        box.itemList.wrapper.aria = { label: null, multiselectable: null };
        box.itemList.forEach(prepareListRow);
    };

    const prepareListRow = function (item, row, index) {
        row.elem.id = id + "-option-" + index;
        row.on("mousemove", function () {
            const rowIndex = rows.findIndex(function (shown) { return shown.row === row; });
            onRowMouseMove(rowIndex, item.option);
        });
    };

    // The mouse on a row makes it active. WHY: On the locked selected row no row is active (the last one is not
    // left white): the row under the mouse can not be chosen.
    const onRowMouseMove = function (index, option) {
        if (index < 0 || index == activeIndex || option.disabled) return;
        setActive(isLockedOption(option) ? -1 : index, 0);
    };


    // The search, the selection and the active row of the ItemList (its rows are made only once).
    const renderItemList = function () {
        if (!box.itemList) createItemList();
        syncListSelection(); // WHY: Also the cursors: the ItemList gives a hand only to a row that can be chosen.
        box.itemList.search(searchText);
        rows = [];
        box.itemList.forEach(function (item, row) {
            if (row.visible == 1) rows.push({ row: row, option: item.option });
        });
        setActive(getStartActiveIndex(), 0);
        box.list.aria = { multiselectable: (isMultiple()) ? "true" : "false" };
        refreshScrollBar();
    };

    const syncListSelection = function () {
        if (!box.itemList) return;
        const keys = box.getSelectedOptions().map(getListKey);
        box.itemList.setSelected(keys, 1);
    };

    // A click on a row: the ItemList changes its selection (onListChange). The selected row clicked again
    // (single) is not a change, but the list closes like the normal rows (not the locked one: nothing happens).
    const onListItemClick = function (list, item) {
        if (isLockedOption(item.option)) return;
        if (!isMultiple() && isSelected(item.option)) afterSelect(JSON.stringify(box.value));
    };

    const onListChange = function () {
        const oldValue = JSON.stringify(box.value);
        const values = box.itemList.getSelected().map(function (item) { return item.option.value; });
        box.value = (isMultiple()) ? normalizeValue(values) : normalizeValue(values[0]);
        afterSelect(oldValue);
    };

    // Enter / Space on the active row: through the ItemList, like a click.
    const selectInItemList = function (option) {
        const key = getListKey(option);
        if (isMultiple() && isSelected(option)) {
            box.itemList.unselect(key);
            return;
        }
        if (isSelected(option)) {
            afterSelect(JSON.stringify(box.value));
            return;
        }
        box.itemList.select(key);
    };

    // The options of the rows that are shown now (the search)
    const getShownOptions = function () {
        if (usesItemList) return rows.map(function (item) { return item.option; });
        return getFilteredOptions();
    };

    // The edge of an own row (option.border): selected, active, or its own
    const getOptionBorderColor = function (row, isActive) {
        if (row.isSelectedOption && _s.optionSelected.borderColor) return _s.optionSelected.borderColor;
        if (isActive && _s.optionActive.borderColor) return _s.optionActive.borderColor;
        return _s.option.borderColor;
    };

    // The look of an own row (not of an ItemList), active (under the mouse or the arrow keys) or not: style.optionActive.
    const paintOptionRow = function (row, isActive) {
        row.color = isActive ? _s.optionActive.color : "transparent";
        if (_s.option.border) row.borderColor = getOptionBorderColor(row, isActive);
        const lineColor = _s.optionActive.lineColor;
        // WHY: Only with lines: a package without them never touches the shadow of a row.
        if (lineColor) row.boxShadow = isActive ? "inset 0 1px 0 " + lineColor + ", inset 0 -1px 0 " + lineColor : "";
    };

    // Scrolls the list to show a row.
    const scrollToRow = function (row) {
        if (!usesItemList) {
            row.elem.scrollIntoView({ block: "nearest" });
            return;
        }
        // WHY: Only the list, by its own scrollTop: scrollIntoView() also scrolled the boxes around it.
        const area = box.list.elem;
        let top = 0;
        for (let elem = row.elem; elem && elem !== area; elem = elem.offsetParent) top += elem.offsetTop;
        const bottom = top + row.elem.offsetHeight;
        if (top < area.scrollTop) area.scrollTop = top;
        else if (bottom > area.scrollTop + area.clientHeight) area.scrollTop = bottom - area.clientHeight;
    };

    // Active row after the list is drawn: the first selected one, or the first one that can be chosen
    const getStartActiveIndex = function () {
        if (_s.optionActive.showAtOpen == 0) return -1;
        const selectedIndex = rows.findIndex(function (item) { return isSelected(item.option) && isActivatable(item.option); });
        if (selectedIndex >= 0) return selectedIndex;
        return rows.findIndex(function (item) { return isActivatable(item.option); });
    };

    const createDescription = function (html) {
        const label = Label({ text: html, width: "100%", fontSize: _s.description.fontSize, textColor: _s.description.textColor });
        if (_s.description.marginTop) label.css.marginTop = _s.description.marginTop + "px";
        return label;
    };

    const createOptionRow = function (option, index) {

        const selected = isSelected(option);

        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: _s.option.gap,
            padding: _s.option.padding,
            round: _s.option.round,
            color: "transparent",
            clickable: 1,
        });
        if (_s.option.minHeight) row.css.minHeight = _s.option.minHeight + "px";
        row.isSelectedOption = selected;
        if (_s.option.border) row.props({ border: _s.option.border, borderColor: getOptionBorderColor(row, 0) });
        if (selected && _s.optionSelected.opacity != 1) row.opacity = _s.optionSelected.opacity;
        row.elem.id = id + "-option-" + index;
        row.role = "option";
        row.aria = { selected: (selected) ? "true" : "false" };
        row.cursor = isActivatable(option) ? "pointer" : "default";
        if (option.disabled) {
            row.aria = { disabled: "true" };
            row.opacity = _s.optionDisabled.opacity;
        }

            // Multiple: check box
            if (isMultiple()) {
                createSvgLabel(SelectBox.getCheckSvg(selected, _s, CHECK_SIZE), CHECK_SIZE);
            }

            if (option.iconFile) {
                const iconMargin = _s.option.iconMargin;
                Icon({ width: _s.option.iconSize, height: _s.option.iconSize, round: _s.option.iconRound });
                that.load(option.iconFile);
                that.shrink = 0;
                that.elem.alt = "";
                that.css.margin = iconMargin[1] + "px 0px " + iconMargin[1] + "px " + iconMargin[0] + "px";
            }

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
            that.css = { flex: "1 1 auto", minWidth: "0" };

                const labelColor = (selected) ? _s.optionSelected.textColor : _s.option.textColor;
                Label({ text: highlight(option.label), fontSize: _s.option.fontSize, textColor: labelColor, width: "100%" });
                if (selected && !isMultiple() && _s.optionSelected.fontFamily) that.css.fontFamily = _s.optionSelected.fontFamily;
                that.css.overflowWrap = "anywhere";

                if (option.description) {
                    createDescription(highlight(option.description));
                }

            endGroup();

            // Single: tick on the right
            if (!isMultiple() && selected && _s.optionSelected.showTick == 1) {
                createSvgLabel(SelectBox.getTickSvg(_s.optionSelected.checkColor, TICK_SIZE), TICK_SIZE);
            }

        endGroup();

        row.on("mousemove", function () {
            onRowMouseMove(index, option);
        });

        row.on("click", function () {
            if (isActivatable(option)) selectOption(option);
        });

        return row;

    };

    // scroll: 1 -> Move the list to show the active row.
    const setActive = function (index, scroll = 1) {

        if (rows[activeIndex] && !usesItemList) paintOptionRow(rows[activeIndex].row, 0);
        activeIndex = index;

        const item = rows[activeIndex];
        // WHY: The ItemList paints its own rows: it knows their look (selected, under the mouse).
        if (usesItemList && box.itemList) box.itemList.setActiveKey(item ? getListKey(item.option) : null);
        if (!item) {
            box.panel.aria = { activedescendant: null };
            box.aria = { activedescendant: null };
            return;
        }

        if (!usesItemList) paintOptionRow(item.row, 1);
        box.aria = { activedescendant: item.row.elem.id };
        if (box.searchInput) box.searchInput.inputElement.setAttribute("aria-activedescendant", item.row.elem.id);
        if (scroll) scrollToRow(item.row);

    };

    // step: +1 or -1. Skips the rows that can not be chosen (disabled, the locked selected one).
    const moveActive = function (step) {
        if (rows.length == 0) return;
        // WHY: With no active row (-1), ArrowUp starts from the end: (-1 - 1) % length was the row before the last one.
        let index = (activeIndex < 0 && step < 0) ? rows.length : activeIndex;
        for (let i = 0; i < rows.length; i++) {
            index = (index + step + rows.length) % rows.length;
            if (isActivatable(rows[index].option)) return setActive(index);
        }
    };

    // closeOnSelect: null -> close for single, stay open for multiple
    const shouldCloseOnSelect = function () {
        if (box.closeOnSelect === null) return !isMultiple();
        return box.closeOnSelect == 1;
    };

    const toggleInValue = function (option) {
        if (isSelected(option)) {
            box.value = box.value.filter(function (v) { return !sameValue(v, option.value); });
            return;
        }
        box.value = normalizeValue(box.value.concat([option.value]));
    };

    const selectOption = function (option) {

        if (usesItemList) {
            selectInItemList(option);
            return;
        }

        const oldValue = JSON.stringify(box.value);
        if (isMultiple()) {
            toggleInValue(option);
        } else {
            box.value = option.value;
        }
        afterSelect(oldValue);

    };

    // After a choice: the field, the list (closed or drawn again) and onChange.
    const afterSelect = function (oldValue) {

        const isChanged = (JSON.stringify(box.value) !== oldValue);

        const keepActive = activeIndex;
        updateField();

        if (shouldCloseOnSelect()) {
            box.close();
            box.elem.focus();
        } else {
            const scrollTop = box.list.elem.scrollTop;
            renderList();
            box.list.elem.scrollTop = scrollTop; // WHY: The list must not jump after a click.
            // WHY: The row just chosen may be the locked selected one now (canSelectAgain: 0): no active row then.
            const keptRow = rows[keepActive];
            setActive((keptRow && isActivatable(keptRow.option)) ? keepActive : -1, 0);
        }

        // WHY: The selected option clicked again is not a change.
        if (isChanged) box.onChange(box);

    };

    // Position the popup panel under (or above) the field.
    // Makes the list shorter by "extra" px. (Not shorter than MIN_LIST_HEIGHT.)
    // WHY: From the height of the list now, not from panelMaxHeight: a list shorter than panelMaxHeight was not made shorter.
    const shortenList = function (extra) {
        box.list.css.maxHeight = Math.max(MIN_LIST_HEIGHT, box.list.elem.offsetHeight - extra) + "px";
    };

    const positionPanel = function () {

        const rect = box.elem.getBoundingClientRect();
        const width = Math.max(withPageZoom(rect.width), box.panelMinWidth);

        box.panel.width = width;

        if (box.fullHeightList == 1) {
            placePanelFullHeight(rect, width);
            return;
        }

        box.list.css.maxHeight = box.panelMaxHeight + "px";

        if (_s.panel.coverField == 1) {
            placePanelOverField(rect, width);
            return;
        }

        const panelHeight = box.panel.elem.offsetHeight;
        const below = page.height - withPageZoom(rect.bottom) - PANEL_GAP - SCREEN_MARGIN;
        const above = withPageZoom(rect.top) - PANEL_GAP - SCREEN_MARGIN;

        let top = withPageZoom(rect.bottom) + PANEL_GAP;
        if (panelHeight > below && above > below) {
            // Open above. Make the list shorter if there is not enough space.
            const extra = panelHeight - above;
            if (extra > 0) shortenList(extra);
            top = withPageZoom(rect.top) - box.panel.elem.offsetHeight - PANEL_GAP;
        } else if (panelHeight > below) {
            shortenList(panelHeight - below);
        }

        let left = withPageZoom(rect.left);
        left = Math.max(SCREEN_MARGIN, Math.min(left, page.width - width - SCREEN_MARGIN));

        box.panel.left = left;
        box.panel.top = Math.max(SCREEN_MARGIN, top);

    };

    // style.panel.coverField: the panel opens over the field: from its top down to the bottom of the page, or
    // (when there is more space above) from its bottom up to the top of the page.
    const placePanelOverField = function (rect, width) {
        // WHY: A panel shorter than the field (a search with few results) showed the bottom of the field under it.
        box.panel.css.minHeight = withPageZoom(rect.height) + "px";
        const fieldTop = withPageZoom(rect.top);
        const fieldBottom = withPageZoom(rect.bottom);
        const spaceDown = page.height - fieldTop - SCREEN_MARGIN;
        const spaceUp = fieldBottom - SCREEN_MARGIN;
        const panelHeight = box.panel.elem.offsetHeight;
        const isUp = (panelHeight > spaceDown && spaceUp > spaceDown);
        const space = isUp ? spaceUp : spaceDown;
        if (panelHeight > space) shortenList(panelHeight - space);

        let left = withPageZoom(rect.left);
        left = Math.max(SCREEN_MARGIN, Math.min(left, page.width - width - SCREEN_MARGIN));
        box.panel.left = left;
        box.panel.top = isUp ? fieldBottom - box.panel.elem.offsetHeight : fieldTop;
    };

    // fullHeightList: the panel from the top of the page to its bottom, at the left of the field. The list fills
    // the panel, so the panel stays that high after a search that leaves a few rows.
    const placePanelFullHeight = function (rect, width) {
        let left = withPageZoom(rect.left);
        left = Math.max(0, Math.min(left, page.width - width));
        box.panel.left = left;
        box.panel.top = 0;
        box.panel.height = page.height;
    };

    // The height of the panel and the list for fullHeightList (1) or the normal list (0).
    const applyListHeightMode = function () {
        const isFullHeight = (box.fullHeightList == 1);
        // WHY: a full height list touches the top and the bottom of the page: square corners.
        box.panel.round = isFullHeight ? 0 : _s.panel.round;
        box.panel.height = "auto";
        box.panel.css.minHeight = "";
        box.list.css = {
            flex: isFullHeight ? "1 1 auto" : "",
            minHeight: isFullHeight ? "0px" : "",
            maxHeight: isFullHeight ? "none" : box.panelMaxHeight + "px",
        };
    };

    // style.panel.motion: the panel fades and grows in.
    const showPanelWithMotion = function () {
        if (!_s.panel.motion) return;
        box.panel.clickable = 1;
        box.panel.css.transition = "none";
        box.panel.css.opacity = "0";
        box.panel.css.transform = "scale(" + _s.panel.startScale + ")";
        // WHY: Read a size, so the browser draws the start state before the transition is turned on.
        void box.panel.elem.offsetHeight;
        box.panel.css.transition = _s.panel.motion;
        box.panel.css.opacity = "1";
        box.panel.css.transform = "scale(1)";
    };

    // Returns 1 when the panel is hidden later (after its motion).
    const hidePanelWithMotion = function () {
        if (!_s.panel.motion) return 0;
        box.panel.clickable = 0; // WHY: A fading panel must not take a click.
        box.panel.css.opacity = "0";
        box.panel.css.transform = "scale(" + _s.panel.startScale + ")";
        box.after(_s.panel.motionDuration, function () {
            if (!isOpen) box.panel.visible = 0;
        });
        return 1;
    };

    const selectActiveRow = function () {
        const item = rows[activeIndex];
        if (item && isActivatable(item.option)) selectOption(item.option);
    };

    // A letter typed without Ctrl / Cmd / Alt
    const isTypedLetter = function (event) {
        if (event.key.length != 1) return false;
        return !event.ctrlKey && !event.metaKey && !event.altKey;
    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;
        const key = event.key;
        const inSearch = box.searchInput && event.target === box.searchInput.inputElement;

        if (!isOpen) {
            if (key == "Enter" || key == " " || key == "ArrowDown" || key == "ArrowUp") {
                event.preventDefault();
                box.open();
            } else if (isTypedLetter(event) && isSearchable()) {
                // Typing on the field starts a search.
                event.preventDefault();
                box.open(key);
            }
            return;
        }

        switch (key) {
            case "ArrowDown":
                event.preventDefault();
                moveActive(1);
                break;
            case "ArrowUp":
                event.preventDefault();
                moveActive(-1);
                break;
            case "Home":
                if (inSearch) return;
                event.preventDefault();
                setActive(-1, 0);
                moveActive(1);
                break;
            case "End":
                if (inSearch) return;
                event.preventDefault();
                setActive(rows.length, 0);
                moveActive(-1);
                break;
            case "Enter":
                event.preventDefault();
                selectActiveRow();
                break;
            case " ":
                if (inSearch) return; // WHY: Space is a letter in the search.
                event.preventDefault();
                selectActiveRow();
                break;
            case "Escape":
                event.preventDefault();
                box.close();
                box.elem.focus();
                break;
            case "Tab":
                box.close();
                break;
        }

    };

    // WHY: The full height list is placed again (on a phone the keyboard of the search box resizes the page).
    const onPageResize = function () {
        if (!isOpen) return;
        if (box.fullHeightList != 1) {
            box.close();
            return;
        }
        positionPanel();
        refreshScrollBar();
    };

    // *** THE SEARCH BOX

    const createSearchBox = function () {
        if (usesSearchInput) createSearchInput();
        else createOwnSearch();
        box.searchGroup.shrink = 0;
        const input = box.searchInput.inputElement;
        input.setAttribute("aria-label", box.searchPlaceholder);
        input.setAttribute("aria-controls", id + "-list");
        input.setAttribute("autocomplete", "off");
    };

    // A SearchInput of comp/search-input.js (style.searchInput), with its clear button.
    const createSearchInput = function () {
        const params = Object.assign({}, _s.searchInput);
        params.width = "100%";
        params.scale = 1; // WHY: style.searchInput is scaled already (with the style of SelectBox).
        params.placeholder = box.searchPlaceholder;
        params.onChange = onSearchTextChange; // WHY: also after its clear button (that is not an "input" event).
        box.searchGroup = SearchInput(params);
        box.searchInput = box.searchGroup.txtSearch;
    };

    // The own search box: an icon and an input in a group (style.search).
    const createOwnSearch = function () {
        // GROUP: Search
        box.searchGroup = HGroup({
            width: "100%",
            height: _s.search.height,
            align: "left center",
            gap: SEARCH_GAP,
            padding: _s.search.padding,
            color: _s.search.color,
            border: _s.search.border,
            borderColor: _s.search.borderColor,
            round: _s.search.round,
        });
        if (_s.search.borderBottom) box.searchGroup.css.borderBottom = _s.search.borderBottom;

            createSvgLabel(SelectBox.getSearchSvg(_s.arrow.color, _s.search.iconSize), _s.search.iconSize);

            box.searchInput = Input({ width: "100%", height: _s.search.height - SEARCH_INPUT_SPACE, minimal: 1, color: "transparent", fontSize: _s.search.fontSize, textColor: _s.search.textColor });
            box.searchInput.inputElement.style.padding = "0px";
            box.searchInput.inputElement.placeholder = box.searchPlaceholder;
            box.searchInput.css = { flex: "1 1 auto", minWidth: "0" };

        endGroup();
    };

    const setSearchBoxText = function (text) {
        if (usesSearchInput) box.searchGroup.setValue(text, 1);
        else box.searchInput.text = text;
    };

    // The list of the typed text. (Only when the text changed: SearchInput and the input event both call it.)
    const onSearchTextChange = function () {
        if (box.searchInput.text === searchText) return;
        searchText = box.searchInput.text;
        renderList();
        box.list.elem.scrollTop = 0;
    };

    // *** PUBLIC FUNCTIONS:

    // startText: The first letters of the search (typed on the closed field)
    box.open = function (startText = "") {

        if (isOpen || box.enabled != 1) return;
        isOpen = 1;

        searchText = (isSearchable()) ? startText : "";
        box.searchGroup.visible = (isSearchable()) ? 1 : 0;
        setSearchBoxText(searchText);
        box.footer.visible = (isMultiple() && box.showSelectAll == 1) ? 1 : 0;

        // WHY at open: a field in a Dialog or a SidePanel (their layer is over 1001) opens its list over them
        const layerZIndex = basic.zIndexAbove(box, OVERLAY_Z_INDEX);
        box.overlay.zIndex = layerZIndex;
        box.panel.zIndex = layerZIndex + 1;
        box.overlay.visible = 1;
        box.panel.visible = 1;
        applyListHeightMode();
        renderList();
        positionPanel();
        refreshScrollBar(); // WHY: positionPanel may make the list shorter.
        showPanelWithMotion();
        if (rows[activeIndex]) scrollToRow(rows[activeIndex].row);

        if (isSearchable()) {
            box.searchInput.inputElement.focus({ preventScroll: true });
            const length = searchText.length;
            box.searchInput.inputElement.setSelectionRange(length, length);
        } else {
            box.panel.elem.focus({ preventScroll: true });
        }

        updateField();
        box.onOpen(box);

    };

    box.close = function () {

        if (!isOpen) return;
        isOpen = 0;

        box.overlay.visible = 0;
        if (!hidePanelWithMotion()) box.panel.visible = 0;

        updateField();
        box.onClose(box);

    };

    box.toggle = function () {
        (isOpen) ? box.close() : box.open();
    };

    box.isOpen = function () {
        return isOpen;
    };

    // silent: 1 -> onChange is not called.
    box.setValue = function (value, silent = 0) {
        const next = normalizeValue(value);
        // WHY JSON: a multiple selection is a list (setOptions compares the same way)
        if (JSON.stringify(next) === JSON.stringify(box.value)) return;
        box.value = next;
        updateField();
        if (isOpen) renderList();
        if (!silent) box.onChange(box);
    };
    // USAGE: select.setValue("apple") or select.setValue(["a", "b"]) (multiple)

    box.getValue = function () {
        return (isMultiple()) ? box.value.slice() : box.value;
    };

    box.getSelectedOptions = function () {
        return box.options.filter(isSelected);
    };

    // Changes the options. The value is kept if it is still in the options.
    box.setOptions = function (options, silent = 1) {
        box.options = SelectBox.normalizeOptions(options);
        const oldValue = JSON.stringify(box.value);
        box.value = normalizeValue(box.value);
        if (box.itemList) fillItemList();
        updateField();
        if (isOpen) renderList();
        if (!silent && JSON.stringify(box.value) != oldValue) box.onChange(box);
    };

    box.clear = function (silent = 0) {
        box.setValue((isMultiple()) ? [] : null, silent);
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        if (box.enabled != 1) box.close();
        updateField();
    };

    box.setPlaceholder = function (text) {
        box.placeholder = text;
        updateField();
    };

    box.focus = function () {
        box.elem.focus();
    };

    // 1: the list from the top of the page to its bottom. 0: under (or above) the field.
    box.setFullHeightList = function (value) {
        box.fullHeightList = basic.isOn(value) ? 1 : 0;
        if (!isOpen) return;
        applyListHeightMode();
        positionPanel();
        refreshScrollBar();
    };
    // USAGE: select.setFullHeightList(1)


    // *** OBJECT VIEW:

    box.color = "transparent";
    box.clickable = 1;
    box.css = { outline: "none", userSelect: "none" };
    box.role = "combobox";
    box.aria = { haspopup: "listbox", controls: id + "-list" };
    if (box.ariaLabel) box.aria = { label: box.ariaLabel };

    // GROUP: Field
    box.field = HGroup({
        width: "100%",
        height: "100%",
        align: "left center",
        gap: _s.fieldOption.gap,
        ..._s.field,
    });
    box.field.setMotion("border-color 0.15s");

        // ICON: The icon of the selected option (style.fieldOption.iconSize)
        box.fieldIcon = Icon({ width: _s.fieldOption.iconSize, height: _s.fieldOption.iconSize, round: _s.fieldOption.iconRound });
        box.fieldIcon.shrink = 0;
        box.fieldIcon.elem.alt = "";
        box.fieldIcon.css.marginLeft = _s.fieldOption.iconMarginLeft + "px";

        // GROUP: Selected text and its description
        box.fieldTexts = VGroup({ width: "auto", height: "auto", align: "left center", gap: 0 });
        box.fieldTexts.css = { flex: "1 1 auto", minWidth: "0", alignItems: "stretch" };

            // LABEL: Selected text
            box.fieldText = Label({
                text: "",
                width: "100%",
                fontSize: _s.fieldText.fontSize,
                textColor: _s.fieldText.textColor,
            });
            box.fieldText.ellipsis = 1;

            // LABEL: Description of the selected option
            box.fieldDescription = createDescription("");
            box.fieldDescription.ellipsis = 1;

        endGroup();
        // WHY: Hidden after they are created: children created in a hidden group are not flex items.
        box.fieldIcon.visible = 0;
        box.fieldDescription.visible = 0;

        // LABEL: Clear button
        box.clearButton = Label({
            text: SelectBox.getClearSvg(_s.arrow.color, CLEAR_ICON_SIZE),
            width: CLEAR_BUTTON_SIZE,
            height: CLEAR_BUTTON_SIZE,
            round: BUTTON_ROUND,
            clickable: 1,
        });
        box.clearButton.shrink = 0;
        box.clearButton.lineHeight = "0";
        box.clearButton.elem.style.display = "flex";
        box.clearButton.css = { alignItems: "center", justifyContent: "center" };
        box.clearButton.cursor = "pointer";
        box.clearButton.aria = { label: "Clear" };

        // LABEL: Arrow
        const arrowSvg = (_s.arrow.icon === "unfold") ? SelectBox.getUnfoldSvg(_s.arrow.color, _s.arrow.size) : SelectBox.getArrowSvg(_s.arrow.color, _s.arrow.size);
        box.arrow = createSvgLabel(arrowSvg, _s.arrow.size);
        box.arrow.css.transition = "transform 0.15s";
        box.arrow.opacity = _s.arrow.opacity;
        if (_s.arrow.marginRight) box.arrow.css.marginRight = _s.arrow.marginRight + "px";

    endGroup();

    // POPUP: Create the overlay and the panel on the page, over everything.
    setDefaultContainerBox(page);
    // NOTE: endGroup() of the panel below returns the default container to the component box.

    // BOX: Transparent overlay (click outside: close)
    // WHY a very big box and not 100% x 100%: with position "fixed" the "100%" is taken from the nearest parent that
    // has a zoom or a transform (page.autoFit, a scaled preview); there the overlay had no height (0 px) and a click
    // outside the list did not close it. A box that starts far before the screen and ends far after it covers the
    // screen in every case.
    const OVERLAY_SIZE = 20000; // px
    box.overlay = Box(-OVERLAY_SIZE, -OVERLAY_SIZE, OVERLAY_SIZE * 2, OVERLAY_SIZE * 2, { color: "transparent", clickable: 1 });
    box.overlay.css.position = "fixed";
    box.overlay.zIndex = OVERLAY_Z_INDEX;

    // GROUP: Panel
    box.panel = VGroup({
        width: box.panelMinWidth,
        height: "auto",
        align: "left top",
        gap: _s.panel.gap,
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        round: _s.panel.round,
        padding: _s.panel.padding,
        clickable: 1,
    });
    box.panel.css = { alignItems: "stretch", outline: "none" };
    box.panel.boxShadow = _s.panel.shadow;
    box.panel.zIndex = PANEL_Z_INDEX;
    box.panel.tabIndex = -1;

        // SEARCH: a SearchInput, or the own search box
        createSearchBox();

        // BOX: List
        box.list = Box({ width: "100%", height: "auto", color: "transparent", scrollY: 1, position: "relative" });
        box.list.elem.id = id + "-list";
        box.list.role = "listbox";
        box.list.css.overscrollBehavior = "contain";

        // GROUP: Footer (multiple)
        box.footer = HGroup({ width: "100%", height: "auto", align: "left center", padding: FOOTER_PADDING });
        box.footer.css = {
            justifyContent: "space-between",
            borderTop: DIVIDER_WIDTH + "px solid " + _s.divider.color,
        };
        box.footer.shrink = 0;

            box.selectAllButton = Label({ text: SelectBox.escapeHtml(box.selectAllText), padding: FOOTER_BUTTON_PADDING, round: BUTTON_ROUND, clickable: 1, ..._s.footerButton });
            box.selectAllButton.cursor = "pointer";

            box.clearAllButton = Label({ text: SelectBox.escapeHtml(box.clearText), padding: FOOTER_BUTTON_PADDING, round: BUTTON_ROUND, clickable: 1, ..._s.footerButton });
            box.clearAllButton.cursor = "pointer";

        endGroup();

    endGroup();

    box.overlay.visible = 0;
    box.panel.visible = 0;

    // SCROLL BAR: on the list. It moves itself into the panel (the parent of the list) and sits over the list.
    // WHY: Created here, not in the panel: an object created in the panel (a group) would be a part of its layout.
    if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        // WHY scale 1: style.scrollBar is scaled already (with the style of SelectBox).
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.list, scale: 1 }, _s.scrollBar));
    }

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.enabled != 1) return;
        if (box.clearButton.elem.contains(event.target)) return;
        box.toggle();
    });
    box.on("keydown", onKeyDown);
    box.on("focus", function () {
        isFocused = 1;
        updateField();
    });
    box.on("blur", function () {
        isFocused = 0;
        updateField();
    });
    box.on("mouseover", function () {
        isMouseOver = 1;
        updateField();
    });
    box.on("mouseout", function () {
        isMouseOver = 0;
        updateField();
    });

    box.clearButton.on("click", function () {
        box.clear();
        box.elem.focus();
    });

    box.overlay.on("click", function () { box.close(); });

    box.panel.on("keydown", onKeyDown);
    // style.optionActive.showAtOpen: 0 -> the active row is only the row under the mouse (or of the keyboard).
    box.list.on("mouseleave", function () {
        if (_s.optionActive.showAtOpen == 0) setActive(-1, 0);
    });
    // WHY: Keep the keyboard focus (field or search) when a row is pressed.
    box.panel.on("mousedown", function (self, event) {
        if (event.target !== box.searchInput.inputElement) event.preventDefault();
    });

    box.searchInput.inputElement.addEventListener("input", onSearchTextChange);

    box.selectAllButton.on("click", function () {
        // Only the options in the search result
        const enabledOptions = getShownOptions().filter(function (option) { return !option.disabled; });
        const valuesToAdd = enabledOptions.map(function (option) { return option.value; });
        box.setValue(box.value.concat(valuesToAdd));
    });

    box.clearAllButton.on("click", function () {
        box.clear();
    });

    // (onPageResize / own: the overlay and the panel are on the page, they are removed with the box)
    box.onPageResize(onPageResize);
    box.own(box.overlay);
    box.own(box.panel);

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    box.options = SelectBox.normalizeOptions(startOptions);
    box.value = normalizeValue(startValue);

    updateField();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

SelectBox._counter = 1;

// scale: every size of the style and of the size params is multiplied (params is changed). Scale 1 changes nothing.
// WHY: The default (null) is read when a select box is made, not when this file is loaded: the page sets
//      basic.uiScale later (page.fit(600, 800); basic.uiScale = 1 / page.zoom).
SelectBox.applyScale = function (params) {
    const givenScale = Number(params.scale);
    params.scale = (givenScale > 0) ? givenScale : (basic.uiScale || 1);
    if (params.scale === 1) return;
    const scale = params.scale;
    const style = basic.scaleStyle(params.style, scale);
    // WHY: Texts with px in them: basic.scaleStyle changes only the numbers.
    style.panel.shadow = basic.scaleCssText(style.panel.shadow, scale);
    style.search.borderBottom = basic.scaleCssText(style.search.borderBottom, scale);
    style.searchInput.borderBottomStyle = basic.scaleCssText(style.searchInput.borderBottomStyle, scale);
    params.style = style;
    ["width", "height", "panelMinWidth", "panelMaxHeight"].forEach(function (name) {
        params[name] = basic.scaleSize(params[name], scale);
    });
};

// createItemView needs comp/item-list.js. Without it: one warning, and the normal rows.
SelectBox.canUseItemList = function () {
    if (typeof ItemList !== "undefined") return true;
    if (!SelectBox._hasWarnedItemList) {
        console.warn("SelectBox: createItemView needs comp/item-list.js (ItemList), loaded before select-box.js. The normal rows are used.");
        SelectBox._hasWarnedItemList = 1;
    }
    return false;
};

// The search box is a SearchInput when comp/search-input.js is loaded (no warning without it: the own box).
// WHY SearchInput.styles: an older SearchInput had the same global name and not the same params.
SelectBox.canUseSearchInput = function () {
    return (typeof SearchInput === "function") && !!SearchInput.styles;
};

// A search box in a package of SearchInput (style.searchInput.styleName): the params of that package fill
// style.searchInput before SelectBoxDefaults does. The keys of the SelectBox package still win.
// WHY: The look keys of the classic search box of SelectBoxDefaults filled every missing key, so a search box with
//      styleName "ozden" kept the classic icons, sizes and colors (the search box of SelectBox ozden looked old).
SelectBox.fillSearchInputPackage = function (style) {
    const searchInput = style.searchInput;
    if (!searchInput || !SelectBox.canUseSearchInput()) return;
    const searchPackage = SearchInput.styles[searchInput.styleName];
    if (!searchPackage) return;
    const packageParams = Object.assign({}, searchPackage);
    delete packageParams.style;
    mergeIntoIfMissing(searchInput, packageParams);
};

// "Apple" -> { value: "Apple", label: "Apple", description: "", iconFile: "", group: "", disabled: 0 }
SelectBox.normalizeOptions = function (options) {
    return (options || []).map(function (option) {
        if (option === null || typeof option !== "object") {
            return { value: option, label: String(option), description: "", iconFile: "", group: "", disabled: 0 };
        }
        return {
            ...option,
            value: option.value,
            label: String(option.label ?? option.value),
            description: option.description || "",
            iconFile: option.iconFile || "",
            group: option.group || "",
            disabled: basic.isOn(option.disabled) ? 1 : 0,
        };
    });
};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
SelectBox.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

SelectBox.getArrowSvg = function (color, size = 16) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
};

// Up and down arrows (the "unfold more" icon)
SelectBox.getUnfoldSvg = function (color, size = 20) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 -960 960 960" fill="' + color + '"><path d="M480-80 240-320l57-57 183 183 183-183 57 57L480-80ZM298-584l-58-56 240-240 240 240-58 56-182-182-182 182Z"/></svg>';
};

SelectBox.getClearSvg = function (color, size = 14) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

SelectBox.getSearchSvg = function (color, size = 16) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
};

SelectBox.getTickSvg = function (color, size = 16) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
};

// Check box of the multiple mode
SelectBox.getCheckSvg = function (checked, style, size = 18) {
    const s = style.optionSelected;
    const svgStart = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 18 18">';
    if (!checked) {
        return svgStart + '<rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="' + style.arrow.color + '" stroke-width="1.5"/></svg>';
    }
    return svgStart + '<rect x="0.5" y="0.5" width="17" height="17" rx="4" fill="' + s.checkColor + '"/>' +
        '<path d="m4.5 9.3 3 3 6-6.3" fill="none" stroke="' + s.checkTickColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: SelectBox({ styleName: "dark" })
// USAGE: SelectBox({ styleName: "dark", style: { field: { round: 4 } } }) // Change only some keys.
// USAGE: SelectBox({ style: SelectBox.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SelectBox.styles.myStyle = { field: { color: "ivory" } };
SelectBox.styles = {

    // White field, dark text, a soft line.
    light: SelectBoxDefaults.style,

    // Dark theme. (The other dark packages use these colors.)
    dark: {
        field: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: [12, 0] },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldText: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)" },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        arrow: { color: "rgba(255, 255, 255, 0.55)" },
        panel: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.12)", round: 10, padding: 6, shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
        searchInput: {
            styleName: "original", // the first look of SearchInput
            height: 38,
            searchIconLeft: 10, // WHY: the icon and the text at the place of the own search input (icon 18, text 42)
            color: "rgba(255, 255, 255, 0.05)",
            border: 1,
            borderColor: "rgba(255, 255, 255, 0.10)",
            borderBottomStyle: "1px solid rgba(255, 255, 255, 0.10)",
            round: 6,
            fontSize: 14,
            textColor: "rgba(255, 255, 255, 0.90)",
            placeholderColor: "",
            searchIconSize: 16,
            searchIconOpacity: 0.55,
            clearIconOpacity: 0.45,
            invertIconColor: 1, // WHY: the icon files are black.
        },
        search: { color: "rgba(255, 255, 255, 0.05)", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 6, fontSize: 14, textColor: "rgba(255, 255, 255, 0.90)" },
        option: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.85)", round: 6, padding: [10, 8] },
        optionActive: { color: "rgba(255, 255, 255, 0.08)" },
        optionSelected: { textColor: "#FFFFFF", checkColor: "#3D7A6B", checkTickColor: "#FFFFFF" },
        optionDisabled: { opacity: 0.4 },
        description: { fontSize: 12, textColor: "rgba(255, 255, 255, 0.45)" },
        group: { fontSize: 11, textColor: "rgba(255, 255, 255, 0.45)" },
        highlight: { color: "rgba(101, 162, 147, 0.45)" },
        empty: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.45)" },
        footerButton: { fontSize: 13, textColor: "#65A293" },
        divider: { color: "rgba(255, 255, 255, 0.08)" },
        disabled: { opacity: 0.4 },
        itemList: {
            hover: { color: "rgba(255, 255, 255, 0.08)" },
            selected: { color: "rgba(255, 255, 255, 0.05)", opacity: 1 },
            check: { color: "#3D7A6B", iconColor: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.3)" },
        },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
    },

};
SelectBox.styles.classic = SelectBox.styles.light; // the old name of light: the pages made with it keep their look


// A whitesmoke box with a thin border, the list opens over the field with a fade, a white search box (SearchInput),
// rows that get white with a thin line above and under them under the mouse, the selected one half transparent.
// A package of params: a 350 x 50 field, a search box, the list down to the
// bottom of the page. Text rows; your own rows and field: createItemView / createValueView
// (02-comp-examples/select-box-ozden-item.htm). The params of the package are used when the page does not give them.
SelectBox.styles.ozden = {
    width: 350,
    height: 50,
    searchable: 1,
    searchPlaceholder: "Search",
    panelMaxHeight: 2000, // WHY: The old list went down to the bottom of the page (the panel stays on the page).
    style: {
        // WHY: padding 19 (not 20): the border is inside the box. The old border was drawn over the content.
        field: { color: "whitesmoke", border: 1, borderColor: "rgba(0, 0, 0, 0.3)", round: 4, padding: [19, 0] },
        fieldHover: { borderColor: "rgba(0, 0, 0, 0.3)" },
        fieldFocus: { borderColor: "rgba(0, 0, 0, 0.3)" },
        fieldText: { fontSize: 20, textColor: "rgba(0, 0, 0, 0.8)" },
        fieldOption: { iconSize: 0, iconRound: 0, iconMarginLeft: 0, gap: 12, showDescription: 0, emptyIconColor: "" }, // text in the field: your own field with createValueView
        placeholder: { textColor: Black(0.4) },
        arrow: { color: "black", icon: "unfold", size: 20, opacity: 0.8, marginRight: -16 },
        panel: {
            color: "whitesmoke",
            border: 1,
            borderColor: "rgba(0, 0, 0, 0.3)",
            round: 4,
            padding: 0,
            shadow: "none",
            gap: 0,
            coverField: 1,
            motion: "opacity 0.2s, transform 0.2s",
            motionDuration: 200,
            startScale: 0.9,
        },
        // The search bar: the ozden SearchInput (its icons, its font and icon sizes, its bottom line) in white, nearly
        // square and without a border: the search box of ItemList ozden.
        searchInput: {
            styleName: "ozden",
            height: 44, // as ItemList ozden; ozdenDark takes it too
            searchIconLeft: 16, // WHY: the default of SearchInput, as ItemList ozden (SelectBoxDefaults has 10)
            color: "white",
            border: 0,
            round: 2,
        },
        search: {
            color: "white", // (as searchInput)
            border: 0,
            borderColor: "transparent",
            round: 2,
            fontSize: 18,
            textColor: "rgba(0, 0, 0, 0.8)",
            height: 44, // as searchInput (this own search box: a page without comp/search-input.js)
            padding: [16, 0],
            iconSize: 22,
            borderBottom: "2px solid rgba(0, 0, 0, 0.06)",
        },
        option: {
            fontSize: 20,
            textColor: "rgba(0, 0, 0, 0.8)",
            round: 0,
            padding: [19, 0], // WHY: 19: the border of the panel is inside it (see field)
            gap: 20,
            minHeight: 50,
            iconSize: 30,
            iconRound: 4,
            iconMargin: [0, 0],
        },
        optionActive: { color: "white", lineColor: Black(0.2), showAtOpen: 0 }, // as ItemList ozden
        // WHY canSelectAgain 0: the selected item is half transparent and not clickable: it does not get the white under
        //     the mouse and a click on it does nothing.
        optionSelected: { textColor: "rgba(0, 0, 0, 0.8)", checkColor: "#373836", checkTickColor: "white", fontFamily: "", showTick: 0, opacity: 0.5, canSelectAgain: 0 },
        description: { fontSize: 14, textColor: "gray", marginTop: -4 }, // WHY -4: the title and the description overlap a little.
        highlight: { color: "transparent" },
        empty: { fontSize: 16, textColor: Black(0.45) },
        // createItemView: rows that are white with a thin line above and under them under the mouse, the selected one
        // half transparent, as ItemList ozden.
        itemList: {
            row: { padding: [19, 0], gap: 20, round: 0, motion: "background-color 0.2s, box-shadow 0.2s" }, // WHY: 19: see option.padding
            hover: { color: "white", lineColor: Black(0.2) },
            selected: { color: "transparent", opacity: 0.5 }, // WHY: transparent: no look of its own (it can not be chosen again).
            check: { size: 22, color: "#373836", iconColor: "white", borderColor: Black(0.25) },
        },
        // The scroll bar: always shown, with the dots at its ends.
        scrollBar: { bar_color: "#373836", bar_mouseOverColor: "#373836", bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, neverHide: 1, showDots: 1 },
    },
};

// The dark theme of ozden: the shapes of ozden in the dark tones of the kit, as ItemList
// ozdenDark: a field and a list of #1A1A19 (on a darker page, Ex: #141414), the active row #262624 with a thin light
// line above and under it, the selected one half transparent, the ozdenDark search box (02-comp-examples/
// select-box-ozden-dark-text.htm). Only the colors are here: the sizes and the params come from ozden (below).
SelectBox.styles.ozdenDark = {
    style: {
        field: { color: "#1A1A19", borderColor: White(0.22) },
        fieldHover: { borderColor: White(0.22) },
        fieldFocus: { borderColor: White(0.22) },
        fieldText: { textColor: White(0.88) },
        placeholder: { textColor: White(0.4) },
        arrow: { color: "white" },
        panel: { color: "#1A1A19", borderColor: White(0.22) },
        searchInput: { styleName: "ozdenDark", color: "#262624" },
        search: { color: "#262624", textColor: White(0.88), borderBottom: "2px solid " + White(0.06) },
        option: { textColor: White(0.88) },
        optionActive: { color: "#262624", lineColor: White(0.14) },
        optionSelected: { textColor: White(0.88), checkColor: "#E6E6E4", checkTickColor: "#1A1A19" },
        description: { textColor: White(0.45) },
        group: { textColor: White(0.45) },
        empty: { textColor: White(0.45) },
        footerButton: { textColor: White(0.8) },
        divider: { color: White(0.08) },
        itemListStyleName: "ozdenDark",
        itemList: {
            hover: { color: "#262624", lineColor: White(0.14) },
            check: { color: "#E6E6E4", iconColor: "#1A1A19", borderColor: White(0.3) },
        },
        scrollBar: { bar_color: "#CFCFCD", bar_mouseOverColor: "#CFCFCD" },
    },
};
// WHY: The shapes, the sizes and the params of ozden (350 x 50, the search box, the list to the bottom of the page).
mergeIntoIfMissing(SelectBox.styles.ozdenDark, SelectBox.styles.ozden);

// The old name of the dark package. (Kept: pages may use it.)
SelectBox.DARK_STYLE = SelectBox.styles.dark;

// The minimal theme (_designs/minimal-theme.htm): a 28 px field of a line (darker under the mouse, ink while open),
// a 13 px text, a 14 px chevron; the list on the ground of the window with a line and no shadow, a line around the row
// under the mouse, the selected row in ink with a check. minimalDark: the same on a dark window.
SelectBox.createMinimalStyle = function (colors) {
    return {
        height: 28,
        style: {
            field: { color: "transparent", border: 1, borderColor: colors.edge, round: 4, padding: [10, 0] }, // WHY edge: 3:1 at least (a control)
            fieldHover: { borderColor: colors.edgeHover },
            fieldFocus: { borderColor: colors.ink },
            fieldText: { fontSize: 13, textColor: colors.text },
            placeholder: { textColor: colors.faintText },
            arrow: { color: colors.softText, icon: "chevron", size: 14, opacity: 1, marginRight: 0 },
            panel: { color: colors.ground, border: 1, borderColor: colors.line, round: 4, padding: 4, shadow: "none", gap: 4 },
            searchInput: { styleName: colors.searchStyleName, height: 28, fontSize: 13, searchIconSize: 14, searchIconLeft: 10, searchIconGap: 6, round: 14 },
            search: { color: "transparent", border: 1, borderColor: colors.edge, round: 4, fontSize: 13, textColor: colors.text, height: 28, padding: [10, 0], iconSize: 14 },
            option: { fontSize: 13, textColor: colors.text, round: 3, padding: [8, 4], gap: 8, iconSize: 14, border: 1, borderColor: "transparent", space: 2 },
            optionActive: { color: "transparent", lineColor: "", borderColor: colors.lineHover },
            optionSelected: { textColor: colors.ink, checkColor: colors.ink, checkTickColor: colors.onInk, fontFamily: "", showTick: 1, tickSize: 12, borderColor: colors.ink },
            description: { fontSize: 12, textColor: colors.softText },
            group: { fontSize: 11, textColor: colors.faintText },
            empty: { fontSize: 12, textColor: colors.softText },
            footerButton: { fontSize: 12, textColor: colors.ink },
            divider: { color: colors.line },
            itemListStyleName: colors.itemListStyleName,
        },
    };
};
SelectBox.MINIMAL_COLORS = {
    ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54),
    line: Black(0.2), lineHover: Black(0.45), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", onInk: "#FFFFFF", searchStyleName: "minimal", itemListStyleName: "minimal",
};
SelectBox.styles.minimal = SelectBox.createMinimalStyle(SelectBox.MINIMAL_COLORS);
SelectBox.MINIMAL_DARK_COLORS = {
    ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48),
    line: White(0.18), lineHover: White(0.42), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", onInk: "#1A1A19", searchStyleName: "minimalDark", itemListStyleName: "minimalDark",
};
SelectBox.styles.minimalDark = SelectBox.createMinimalStyle(SelectBox.MINIMAL_DARK_COLORS);
