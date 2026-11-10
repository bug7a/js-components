/* Bismillah */

/*

Filters - v26.11

UI COMPONENT
- A filter menu: a "Filters" button, and under it a panel with a search field, groups of options with check
  boxes and a footer with the number of the selected options and "Clear all".
- The groups (sections) open and close (a click, or Enter / Space on the title); the search shows the options with
  the text; every change of the selection goes to onChange (not at create time, not with silent: 1).
- The fields of the kit: the search field is a SearchInput (comp/search-input.js, its
  params: searchInputParams, "ozden" by default) and every option is a CheckBox (comp/check-box.js, its params:
  checkBoxParams, "light" by default; the row is the check box, its checked mark takes the accent). Load them
  before this file; without them a plain field and a plain check are drawn.
- animated: 1: the panel and an opened section come with a fade and a short slide (they go faster),
  the arrows turn with a small spring, and the search field and the check boxes get their own motions (SearchInput,
  CheckBox). Nothing moves at the first view; off when the system asks for reduced motion. setAnimated(0/1).
- The icon of the button is two-tone: sliders on a light box, in the accent (style.buttonIcon).
- Style packages: "light" (default). Select with styleName. (Filters.styles)

USAGE:
const filters = Filters({
    sections: [
        { key: "type", text: "Type", opened: 1, options: [
            { key: "car", text: "Car" },
            { key: "truck", text: "Truck", checked: 1 },
        ] },
        { key: "status", text: "Status", opened: 0, options: ["Online", "Offline"] }, // a text: its key is the text
    ],
    onChange: function (self) { println(JSON.stringify(self.getSelected())); }, // { type: ["truck"], status: [] }
});
filters.setSelected("status", ["Online"]);  // onChange is called; setSelected("status", ["Online"], 1): silent
filters.clearAll();
filters.setSectionOpened("status", 1);
filters.openPanel(); filters.closePanel(); filters.togglePanel();
filters.search("tru");                       // the search field does it too
filters.setSections([...]);                  // new data (the selection comes from the data)
Filters({ panelOpened: 0 });                 // only the button: a click opens the panel
Filters({ panelMode: "popup", panelOpened: 0 }); // the panel opens over the page; a click outside / Escape closes it
Filters({ style: { accentColor: "#2E7D5B" } }); // change only some keys of the style
Filters({ animated: 1 });                    // the motions (filters.setAnimated(0) stops them)
Filters({ checkBoxParams: { styleName: "modern" }, searchInputParams: { styleName: "light" } });

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const FiltersDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 380, // The width of the panel (the button stands at its right)
    height: "auto", // The button and the panel
    panelHeight: 620,
    panelOpened: 1, // 0: only the button; a click opens the panel
    // "inline": the panel is under the button, in the layout of the page (it moves the objects under it).
    // "popup": the panel opens over the page, under the right edge of the button (above it, when there is no
    // space below); a click outside it or Escape closes it.
    panelMode: "inline",
    buttonText: "Filters",
    searchPlaceholder: "Search",
    selectedText: "Selected",
    clearText: "Clear all",
    noResultText: "No results",
    // [{ key, text, opened, options: [{ key, text, checked }] or ["text"] }]
    sections: [],
    animated: 0, // 1: the panel and an opened section come in, the arrows turn (box.setAnimated(0/1))
    // The search field: the params of its SearchInput (comp/search-input.js). Its
    // placeholder is searchPlaceholder; its animated is the animated of Filters (unless it is given here).
    searchInputParams: { styleName: "ozden", width: "100%", height: 50, fontSize: 18, searchIconSize: 20 },
    // The check boxes: the params of every CheckBox (comp/check-box.js). The row look is
    // style.row and the checked mark is the accent; a style given here wins. Their animated is the animated of
    // Filters (unless it is given here).
    checkBoxParams: { styleName: "light", style: {} },
    onChange: function (self) { }, // The selection changed: self.getSelected(). (Not at create time, not with silent: 1)
    onPanelToggle: function (self) { }, // The panel opened / closed: self.panelOpened
    styleName: "light", // "light" or a name added to Filters.styles
    style: { // Light style package (default)
        accentColor: "#2F5BD3", // a checked box, "Clear all", the icon of the button
        textColor: "#1F1F1E",
        softTextColor: "#8C8B88", // the titles of the sections, "Selected", the search icon
        fontSize: 18,
        button: { color: "#E2E1DD", height: 50, round: 12, padding: [16, 0], gap: 8 },
        // The two-tone icon of the button: sliders on a light box. "": the accent, and a light tone of it.
        buttonIcon: { strongColor: "", lightColor: "" },
        panel: { color: "#F7F6F3", border: 1, borderColor: "#E4E3DF", round: 18, padding: 8, gap: 6, shadow: "0 10px 30px rgba(0, 0, 0, 0.08)" },
        field: { color: "#EDECE8", height: 50, round: 12, padding: [14, 0], gap: 10 }, // the plain field (no SearchInput)
        header: { height: 44, padding: [12, 0], gap: 8 },
        row: { color: "white", height: 48, round: 12, padding: [12, 0], gap: 14, hoverColor: "#FBFBFA" },
        check: { size: 22, round: 6, color: "#EDECE8", markColor: "white" }, // the plain check (no CheckBox)
        badge: { color: "#E6E5E1", fontSize: 14, round: 11, padding: [8, 2] },
        footer: { height: 56, padding: [12, 0], gap: 8 },
        listGap: 6,
        scrollBar: { bar_color: "#8C8B88", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9 },
    },
};

const Filters = function (params = {}) {

    // Merge style package: params.style > Filters.styles[styleName] > FiltersDefaults.style (light)
    basic.applyStylePackage(params, Filters.styles, FiltersDefaults);

    // Merge params:
    mergeIntoIfMissing(params, FiltersDefaults);

    // Edit params, if needed:
    params.sections = Filters.normalizeSections(params.sections); // WHY: A copy: the data of the caller does not change.
    const isPopup = (params.panelMode === "popup");
    const panelWidth = params.width;
    if (isPopup) params.width = "auto"; // WHY: Only the button is in the box; the panel is on the page.

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const ICON_SIZE = 20;
    const MARK_SIZE = 16;
    const LIST_GAPS = 12; // the gaps between the field, the list and the footer in the panel
    const PANEL_GAP = 10; // between the button and the panel
    const PANEL_Z_INDEX = 1001; // a popup panel over the page (like the list of SelectBox)
    const SCREEN_MARGIN = 8; // a popup panel stays this far from the edges of the screen
    // MOTION (animated: 1; context/basic-js-animated-rules.md)
    const MOTION_TIME = "0.25s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start, a soft stop
    const SPRING_TIME = "0.35s"; // WHY: an arrow that turns to show a new state ends with a small overshoot
    const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
    const ARROW_MOTION = "transform " + SPRING_TIME + " " + SPRING_EASE;
    const CLOSE_TIME = 150; // ms: a panel goes faster than it comes
    const OPEN_MOVE = 6; // px: a panel and the options of an opened section come from here
    const hasSearchInput = (typeof SearchInput !== "undefined");
    const hasCheckBox = (typeof CheckBox !== "undefined");
    let searchText = "";
    let isCreated = 0; // WHY: nothing moves at the first view
    let wasAnimated = 0;
    let cancelPanelHide = null;

    // *** PUBLIC VARIABLES:
    box.sectionViews = []; // [{ section, header, lblCount, lblArrow, body, rows: [{ option, row, checkBox | check, mark }] }]
    // NOTE: Default values are also public variables. (box.sections, box.panelOpened, box.buttonText...)

    // *** PRIVATE FUNCTIONS:

    // LABEL: an icon (an SVG in the color of the label)
    const createIcon = function (svg, color) {
        const icon = Label({ text: svg, textColor: color, lineHeight: "0" });
        icon.shrink = 0;
        return icon;
    };

    // BOX: a space that takes the rest of a row
    const createSpace = function () {
        const space = Box({ width: 1, height: 1, color: "transparent" });
        space.grow = 1;
        return space;
    };

    // LABEL: a number in a small round badge
    const createBadge = function () {
        const badge = Label({ text: "", fontSize: _s.badge.fontSize, textColor: _s.softTextColor, color: _s.badge.color, round: _s.badge.round, padding: _s.badge.padding });
        badge.shrink = 0;
        return badge;
    };

    const countChecked = function (section) {
        return section.options.filter(function (option) { return option.checked; }).length;
    };

    const matchesSearch = function (option) {
        if (!searchText) return true;
        return option.text.toLocaleLowerCase().indexOf(searchText) !== -1;
    };

    // *** MOTION

    const isMotionOn = function () {
        if (box.animated != 1) return false;
        return !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    };

    // An object comes: from a fade and a short slide (move px) to its place
    const comeIn = function (obj, move) {
        obj.setMotionNow("none");
        obj.opacity = 0;
        obj.css = { transform: "translateY(" + move + "px)" };
        void obj.elem.offsetHeight; // WHY: the start look must be drawn before the motion is turned on
        obj.setMotionNow("opacity " + MOTION_TIME + " " + MOTION_EASE + ", transform " + MOTION_TIME + " " + MOTION_EASE);
        obj.opacity = 1;
        obj.css = { transform: "none" };
    };

    // An object goes, faster: it fades and slides away (the caller hides it after CLOSE_TIME)
    const goOut = function (obj, move) {
        obj.setMotionNow("opacity " + CLOSE_TIME + "ms " + MOTION_EASE + ", transform " + CLOSE_TIME + "ms " + MOTION_EASE);
        obj.opacity = 0;
        obj.css = { transform: "translateY(" + move + "px)" };
    };

    // The still look (a hidden object comes in again from it)
    const stopMotion = function (obj) {
        obj.setMotionNow("none");
        obj.opacity = 1;
        obj.css = { transform: "none" };
    };

    // The arrows turn with a spring. (setMotion waits a moment: the first paint does not move.)
    const setArrowMotions = function () {
        if (!isMotionOn()) return;
        box.sectionViews.forEach(function (view) { view.lblArrow.setMotion(ARROW_MOTION); });
        box.lblButtonArrow.setMotion(ARROW_MOTION);
    };

    // The arrow of a section: animated, one down arrow that turns; still, an up or a down icon (as before)
    const paintArrow = function (arrow, isOpened) {
        if (isMotionOn()) {
            if (!arrow.isTurningArrow) arrow.text = Filters.icon("down", ICON_SIZE);
            arrow.isTurningArrow = 1;
            arrow.css = { transform: (isOpened) ? "rotate(180deg)" : "none" };
            return;
        }
        if (arrow.isTurningArrow) arrow.css = { transform: "none" };
        arrow.isTurningArrow = 0;
        arrow.text = Filters.icon((isOpened) ? "up" : "down", ICON_SIZE);
    };

    // The arrow of the button turns while the panel is open (only animated: a still arrow always looks down)
    const paintButtonArrow = function () {
        if (isMotionOn()) {
            box.lblButtonArrow.css = { transform: (box.panelOpened) ? "rotate(180deg)" : "none" };
            return;
        }
        if (wasAnimated) box.lblButtonArrow.css = { transform: "none" };
    };

    const applyAnimated = function () {
        if (box.searchInput) box.searchInput.setAnimated(box.animated);
        box.sectionViews.forEach(function (view) {
            view.rows.forEach(function (rowView) {
                if (rowView.checkBox) rowView.checkBox.setAnimated(box.animated);
            });
        });
        if (isMotionOn()) {
            setArrowMotions();
            wasAnimated = 1;
        } else if (wasAnimated) {
            box.sectionViews.forEach(function (view) {
                stopMotion(view.lblArrow);
                stopMotion(view.body);
            });
            stopMotion(box.lblButtonArrow);
            stopMotion(box.panel);
            wasAnimated = 0;
        }
        paintButtonArrow();
        paint();
    };

    // *** ROWS AND SECTIONS

    // The look of an option row over the check box params of the page (a style given there wins)
    const getCheckBoxStyle = function () {
        const style = JSON.parse(JSON.stringify(box.checkBoxParams.style || {}));
        mergeIntoIfMissing(style, {
            box: { color: _s.row.color, round: _s.row.round },
            hoverBox: { color: _s.row.hoverColor },
            hoverCheckedBox: { color: _s.row.hoverColor },
            layout: { gap: _s.row.gap, padding: _s.row.padding, align: "left center" },
            checkedMark: { color: _s.accentColor, borderColor: _s.accentColor },
            label: { fontSize: _s.fontSize, textColor: _s.textColor },
        });
        return style;
    };

    // CHECK BOX: one option of a section; the check box is the row
    const createCheckBoxRow = function (option, checkBoxStyle) {
        const checkBox = CheckBox(Object.assign({}, box.checkBoxParams, {
            width: "100%",
            height: _s.row.height,
            labelText: basic.escapeHtml(option.text), // WHY: the label of a CheckBox is HTML
            checked: option.checked ? 1 : 0,
            animated: (box.checkBoxParams.animated !== undefined) ? box.checkBoxParams.animated : box.animated,
            style: checkBoxStyle,
            onChange: function (self) {
                option.checked = self.checked ? 1 : 0;
                paint();
                box.onChange(box);
            },
        }));
        checkBox.shrink = 0;
        // WHY: the content of a CheckBox stands at its top; it fills the height of the row (its align centers it)
        checkBox.contentBox.height = "100%";
        return { option: option, row: checkBox, checkBox: checkBox };
    };

    // GROUP: one option of a section without CheckBox: a plain check and its text
    const createPlainRow = function (option) {
        const row = HGroup({ width: "100%", height: _s.row.height, align: "left center", gap: _s.row.gap, padding: _s.row.padding, color: _s.row.color, round: _s.row.round });
        row.shrink = 0;
        row.clickable = 1;
        row.cursor = "pointer";
        row.role = "checkbox";
        row.tabIndex = 0;
            // GROUP: Check box (a mark on the accent when it is checked)
            const check = HGroup({ width: _s.check.size, height: _s.check.size, round: _s.check.round });
            check.shrink = 0;
                const mark = createIcon(Filters.icon("check", MARK_SIZE, 3), _s.check.markColor);
            endGroup();
            Label({ plainText: option.text, fontSize: _s.fontSize, textColor: _s.textColor });
        endGroup();
        const rowView = { option: option, row: row, check: check, mark: mark };
        row.onHoverChange(function (self, isOver) { row.color = (isOver) ? _s.row.hoverColor : _s.row.color; });
        row.on("click", function () { toggleOption(rowView); });
        row.on("keydown", function (self, event) {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            toggleOption(rowView);
        });
        return rowView;
    };

    const toggleSection = function (section) {
        box.setSectionOpened(section.key, !section.opened);
    };

    // GROUP: the title of a section (its name, the number of the checked options, open / closed) and its options
    const createSection = function (section, checkBoxStyle) {
        const view = { section: section, rows: [], isClosing: 0, cancelClose: null };
        view.header = HGroup({ width: "100%", height: _s.header.height, align: "left center", gap: _s.header.gap, padding: _s.header.padding });
        view.header.shrink = 0;
        view.header.clickable = 1;
        view.header.cursor = "pointer";
        view.header.role = "button";
        view.header.tabIndex = 0;
            Label({ plainText: section.text, fontSize: _s.fontSize, textColor: _s.softTextColor });
            view.lblCount = createBadge();
            createSpace();
            view.lblArrow = createIcon("", _s.textColor);
        endGroup();
        view.header.on("click", function () { toggleSection(section); });
        view.header.on("keydown", function (self, event) {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            toggleSection(section);
        });
        // GROUP: the options (one group: it comes and goes as one)
        view.body = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.listGap });
        view.body.shrink = 0;
            view.rows = section.options.map(function (option) {
                return (hasCheckBox) ? createCheckBoxRow(option, checkBoxStyle) : createPlainRow(option);
            });
        endGroup();
        return view;
    };

    // DATA: the sections and their options (made again in the list)
    const createSections = function () {
        if (box.listGroup) box.listGroup.remove();
        const checkBoxStyle = (hasCheckBox) ? getCheckBoxStyle() : null;
        box.listGroup = createIn(box.listBox, function () {
            const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.listGap, position: "relative" });
                box.sectionViews = box.sections.map(function (section) { return createSection(section, checkBoxStyle); });
                box.lblNoResult = Label({ plainText: box.noResultText, fontSize: _s.fontSize, textColor: _s.softTextColor, padding: [12, 12] });
            endGroup();
            return group;
        });
        if (box.lblButtonArrow) setArrowMotions();
    };

    const paintCheck = function (rowView) {
        const isChecked = rowView.option.checked ? 1 : 0;
        if (rowView.checkBox) {
            if (rowView.checkBox.checked != isChecked) rowView.checkBox.setChecked(isChecked, 1);
            return;
        }
        rowView.check.color = (isChecked) ? _s.accentColor : _s.check.color;
        rowView.mark.visible = isChecked;
        rowView.row.aria = { checked: isChecked ? "true" : "false" };
    };

    // PAINT: the checks, the counts, the arrows, what the search and the closed sections hide
    const paint = function () {
        let shownCount = 0;
        box.sectionViews.forEach(function (view) {
            const checkedCount = countChecked(view.section);
            view.lblCount.plainText = String(checkedCount);
            view.lblCount.visible = (checkedCount) ? 1 : 0;
            paintArrow(view.lblArrow, view.section.opened);
            view.header.aria = { expanded: view.section.opened ? "true" : "false" };
            let sectionMatches = 0;
            view.rows.forEach(function (rowView) {
                paintCheck(rowView);
                const isMatch = matchesSearch(rowView.option);
                if (isMatch) sectionMatches++;
                rowView.row.visible = (isMatch) ? 1 : 0;
            });
            // WHY: While searching, the matches are shown also in a closed section; a closing one stays until its
            //      options are gone.
            const isBodyShown = (view.section.opened || searchText || view.isClosing);
            view.body.visible = (isBodyShown && sectionMatches) ? 1 : 0;
            view.header.visible = (!searchText || sectionMatches) ? 1 : 0;
            shownCount += sectionMatches;
        });
        box.lblNoResult.visible = (searchText && !shownCount) ? 1 : 0;
        const total = box.getSelectedCount();
        box.lblSelectedCount.plainText = String(total);
        box.lblSelectedCount.visible = (total) ? 1 : 0;
        box.lblClear.opacity = (total) ? 1 : 0.4;
    };

    const toggleOption = function (rowView) {
        rowView.option.checked = rowView.option.checked ? 0 : 1;
        paint();
        box.onChange(box);
    };

    const findSection = function (sectionKey) {
        return box.sections.find(function (section) { return section.key === sectionKey; }) || null;
    };

    const findView = function (sectionKey) {
        return box.sectionViews.find(function (view) { return view.section.key === String(sectionKey); }) || null;
    };

    // The options of a section come (a fade and a short slide)
    const openSection = function (view) {
        if (view.cancelClose) view.cancelClose();
        view.cancelClose = null;
        view.isClosing = 0;
        paint();
        comeIn(view.body, -OPEN_MOVE);
    };

    // The options of a section go (faster); the section is drawn closed when they are gone. (Its arrow turns at once.)
    const closeSection = function (view) {
        view.isClosing = 1;
        paint();
        goOut(view.body, -OPEN_MOVE);
        view.cancelClose = view.body.after(CLOSE_TIME, function () {
            view.cancelClose = null;
            view.isClosing = 0;
            stopMotion(view.body);
            paint();
        });
    };

    // *** THE SEARCH FIELD

    // A SearchInput (comp/search-input.js); without it, a plain field
    const createSearchField = function () {
        if (!hasSearchInput) {
            createPlainSearchField();
            return;
        }
        const searchParams = Object.assign({}, box.searchInputParams);
        searchParams.placeholder = box.searchPlaceholder;
        if (searchParams.animated === undefined) searchParams.animated = box.animated;
        // WHY value, not getSearchText(): that one is in lower case, and the field must keep what is typed
        searchParams.onChange = function () { box.search(box.searchInput.value); };
        box.searchInput = SearchInput(searchParams);
        box.searchInput.shrink = 0;
    };

    // GROUP: the plain field (without SearchInput): a search icon and an input on a rounded box
    const createPlainSearchField = function () {
        box.searchField = HGroup({ width: "100%", height: _s.field.height, align: "left center", gap: _s.field.gap, padding: _s.field.padding, color: _s.field.color, round: _s.field.round });
            createIcon(Filters.icon("search", ICON_SIZE), _s.softTextColor);
            box.inpSearch = Input({ height: _s.field.height - 10, fontSize: _s.fontSize, textColor: _s.textColor, minimal: 1, color: "transparent", placeholder: box.searchPlaceholder });
            box.inpSearch.grow = 1;
        endGroup();
        box.listenTo(box.inpSearch.inputElement, "input", function () { box.search(box.inpSearch.text); });
    };

    const getSearchFieldHeight = function () {
        if (box.searchInput) return box.searchInput.height;
        return _s.field.height;
    };

    // GROUP: the panel: search field, the sections (they scroll), footer
    const createPanel = function () {

        box.panel = VGroup({
            width: panelWidth,
            height: box.panelHeight,
            align: "left top",
            gap: _s.panel.gap,
            padding: _s.panel.padding,
            color: _s.panel.color,
            round: _s.panel.round,
            border: _s.panel.border,
            borderColor: _s.panel.borderColor,
            boxShadow: _s.panel.shadow,
        });

            // Search field
            createSearchField();

            // BOX: The sections (they scroll)
            const listHeight = box.panelHeight - getSearchFieldHeight() - _s.footer.height - _s.panel.padding * 2 - LIST_GAPS;
            box.listBox = startBox(0, 0, "100%", listHeight, { color: "transparent", scrollY: 1 });
            box.listBox.position = "relative";
            endBox();

            // GROUP: Footer
            box.footer = HGroup({ width: "100%", height: _s.footer.height, align: "left center", gap: _s.footer.gap, padding: _s.footer.padding });
                Label({ plainText: box.selectedText, fontSize: _s.fontSize, textColor: _s.softTextColor });
                box.lblSelectedCount = createBadge();
                createSpace();
                box.lblClear = Label({ plainText: box.clearText, fontSize: _s.fontSize, textColor: _s.accentColor });
                box.lblClear.clickable = 1;
                box.lblClear.cursor = "pointer";
                box.lblClear.role = "button";
            endGroup();

        endGroup();

        // WHY: Out of the groups: a ScrollBar made in a group would be a part of its layout. It moves itself over the list.
        if (typeof ScrollBar !== "undefined") box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.listBox }, _s.scrollBar));

    };

    // POPUP: the panel under the button, its right edge at the right edge of the button.
    // Above the button when there is no space below and more space above.
    const placePanel = function () {
        if (!isPopup || !box.panelOpened) return;
        const rect = box.btnFilters.elem.getBoundingClientRect();
        const buttonTop = withPageZoom(rect.top);
        const buttonBottom = withPageZoom(rect.bottom);
        const spaceBelow = page.height - buttonBottom - PANEL_GAP - SCREEN_MARGIN;
        const spaceAbove = buttonTop - PANEL_GAP - SCREEN_MARGIN;
        let top = buttonBottom + PANEL_GAP;
        if (box.panelHeight > spaceBelow && spaceAbove > spaceBelow) top = buttonTop - PANEL_GAP - box.panelHeight;
        const left = withPageZoom(rect.right) - panelWidth;
        box.panel.left = Math.max(SCREEN_MARGIN, Math.min(left, page.width - panelWidth - SCREEN_MARGIN));
        box.panel.top = Math.max(SCREEN_MARGIN, top);
    };

    // The panel comes from its button: down from it, or up when a popup opens above the button
    const getPanelMove = function () {
        if (!isPopup) return -OPEN_MOVE;
        const buttonTop = withPageZoom(box.btnFilters.elem.getBoundingClientRect().top);
        return (box.panel.top < buttonTop) ? OPEN_MOVE : -OPEN_MOVE;
    };

    const showPanel = function () {
        if (cancelPanelHide) cancelPanelHide();
        cancelPanelHide = null;
        box.panel.visible = 1;
        placePanel();
        if (isCreated && isMotionOn()) comeIn(box.panel, getPanelMove());
    };

    const hidePanel = function () {
        if (!isCreated || !isMotionOn()) {
            box.panel.visible = 0;
            return;
        }
        goOut(box.panel, getPanelMove());
        cancelPanelHide = box.panel.after(CLOSE_TIME, function () {
            cancelPanelHide = null;
            box.panel.visible = 0;
            stopMotion(box.panel);
        });
    };

    const isInside = function (obj, target) {
        return obj.elem.contains(target);
    };

    const closeOnOutsideClick = function (self, event) {
        if (!box.panelOpened) return;
        if (isInside(box.panel, event.target)) return;
        if (isInside(box.btnFilters, event.target)) return; // WHY: The click of the button toggles it.
        box.closePanel();
    };

    const closeOnEscape = function (self, event) {
        if (event.key !== "Escape" || !box.panelOpened) return;
        box.closePanel();
        box.btnFilters.elem.focus();
    };

    // WHY: The page under the panel scrolls (a scrolling box of the page): the panel goes with the button.
    const placeOnScroll = function (self, event) {
        if (isInside(box.panel, event.target)) return;
        placePanel();
    };

    // The two-tone icon of the button (style.buttonIcon; "": from the accent)
    const getButtonIcon = function () {
        const strongColor = _s.buttonIcon.strongColor || _s.accentColor;
        const lightColor = _s.buttonIcon.lightColor || Filters.lightTone(strongColor);
        return Filters.twoToneIcon("filter", ICON_SIZE, strongColor, lightColor);
    };

    // *** PUBLIC FUNCTIONS:

    // { sectionKey: [optionKeys] } of the checked options
    box.getSelected = function () {
        const selected = {};
        box.sections.forEach(function (section) {
            selected[section.key] = section.options.filter(function (option) { return option.checked; }).map(function (option) { return option.key; });
        });
        return selected;
    };

    box.getSelectedCount = function () {
        return box.sections.reduce(function (sum, section) { return sum + countChecked(section); }, 0);
    };

    // The checked options of a section (the others are unchecked). silent: 1 -> onChange is not called.
    box.setSelected = function (sectionKey, optionKeys, silent = 0) {
        const section = findSection(sectionKey);
        if (!section) return;
        const keys = (optionKeys || []).map(String);
        section.options.forEach(function (option) { option.checked = (keys.indexOf(option.key) !== -1) ? 1 : 0; });
        paint();
        if (!silent) box.onChange(box);
    };
    // USAGE: filters.setSelected("status", ["online"])

    box.clearAll = function (silent = 0) {
        if (!box.getSelectedCount()) return;
        box.sections.forEach(function (section) { section.options.forEach(function (option) { option.checked = 0; }); });
        paint();
        if (!silent) box.onChange(box);
    };

    box.setSectionOpened = function (sectionKey, isOpened) {
        const view = findView(sectionKey);
        if (!view) return;
        const value = (isOpened) ? 1 : 0;
        const isChange = (value !== view.section.opened);
        view.section.opened = value;
        // WHY not while searching: the options of a closed section are shown then too (nothing comes or goes)
        if (!isChange || !isCreated || !isMotionOn() || searchText) {
            paint();
            return;
        }
        if (value) openSection(view);
        else closeSection(view);
    };

    box.setSections = function (sections) {
        box.sections = Filters.normalizeSections(sections);
        createSections();
        paint();
    };

    box.search = function (text) {
        const value = String(text || "");
        searchText = value.trim().toLocaleLowerCase();
        if (box.searchInput && box.searchInput.value !== value) box.searchInput.setValue(value, 1);
        if (box.inpSearch && box.inpSearch.text !== value) box.inpSearch.text = value;
        paint();
    };

    box.openPanel = function () { box.setPanelOpened(1); };
    box.closePanel = function () { box.setPanelOpened(0); };
    box.togglePanel = function () { box.setPanelOpened(!box.panelOpened); };

    // silent: 1 -> onPanelToggle is not called.
    box.setPanelOpened = function (isOpened, silent = 0) {
        const value = (isOpened) ? 1 : 0;
        if (value === box.panelOpened) return;
        box.panelOpened = value;
        if (value && isPopup) box.panel.zIndex = basic.zIndexAbove(box, PANEL_Z_INDEX); // WHY: over a Dialog that holds the filters
        if (value) showPanel();
        else hidePanel();
        box.btnFilters.aria = { expanded: value ? "true" : "false" };
        paintButtonArrow();
        if (!silent) box.onPanelToggle(box);
    };

    box.setButtonText = function (text) {
        box.buttonText = text;
        box.lblButton.plainText = text;
    };

    box.setAnimated = function (value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: filters.setAnimated(1)

    // *** OBJECT VIEW:

    // GROUP: Layout (the button at the right; the panel under it in the "inline" mode)
    box.layout = VGroup({ width: (isPopup) ? "auto" : panelWidth, height: "auto", align: "right top", gap: PANEL_GAP, position: "relative" });
    box.clipContent = 0; // WHY: The shadow of the panel stands out of the box and of the layout.
    box.layout.clipContent = 0;

        // GROUP: Filters button
        box.btnFilters = HGroup({ width: "auto", height: _s.button.height, gap: _s.button.gap, padding: _s.button.padding, color: _s.button.color, round: _s.button.round });
        box.btnFilters.clickable = 1;
        box.btnFilters.cursor = "pointer";
        box.btnFilters.role = "button";
        box.btnFilters.tabIndex = 0;
            createIcon(getButtonIcon(), _s.textColor);
            box.lblButton = Label({ plainText: box.buttonText, fontSize: _s.fontSize, textColor: _s.textColor });
            box.lblButtonArrow = createIcon(Filters.icon("down", ICON_SIZE), _s.textColor);
        endGroup();

        if (!isPopup) createPanel();

    endGroup();

    // POPUP: the panel on the page, over everything (removed with the box: own)
    if (isPopup) {
        createIn(page, createPanel);
        box.panel.zIndex = PANEL_Z_INDEX;
        box.own(box.panel);
    }

    // *** OBJECT INIT CODE:

    box.btnFilters.on("click", box.togglePanel);
    box.btnFilters.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        box.togglePanel();
    });
    box.lblClear.on("click", function () { box.clearAll(); });

    if (isPopup) {
        box.listenTo(document, "pointerdown", closeOnOutsideClick, true);
        box.listenTo(document, "keydown", closeOnEscape);
        box.listenTo(document, "scroll", placeOnScroll, true); // WHY: capture: the scroll of a box does not bubble.
        box.onPageResize(placePanel);
    }

    createSections();
    box.panelOpened = 0;
    box.panel.visible = 0; // WHY: Hidden after its children are made.
    box.setPanelOpened(params.panelOpened, 1);
    applyAnimated(); // (it paints)
    isCreated = 1;

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The sections with every value filled: keys as texts, opened / checked as 1 / 0, a text option -> { key, text }.
Filters.normalizeSections = function (sections) {
    return (Array.isArray(sections) ? sections : []).map(function (section, index) {
        const options = (Array.isArray(section.options) ? section.options : []).map(function (option) {
            if (typeof option !== "object") return { key: String(option), text: String(option), checked: 0 };
            return { key: String(option.key !== undefined ? option.key : option.text), text: String(option.text || ""), checked: option.checked ? 1 : 0 };
        });
        return { key: String(section.key !== undefined ? section.key : index), text: String(section.text || ""), opened: section.opened ? 1 : 0, options: options };
    });
};

// An icon: lines in the color of its label (currentColor). name: "search", "down", "up", "check"
Filters.ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

Filters.icon = function (name, size, strokeWidth = 2) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' + Filters.ICON_PATHS[name] + '</svg>';
};

// A two-tone icon (the style of 02-comp-examples/smart-button-alternatif.htm): a big LIGHT shape
// with STRONG details; the two colors are filled in. name: "filter" (sliders on a light box)
Filters.TWO_TONE_PATHS = {
    filter: '<rect x="2.5" y="2.5" width="19" height="19" rx="3" fill="LIGHT"/>' +
        '<path d="M7 8.5h10M7 15.5h10" fill="none" stroke="STRONG" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="10" cy="8.5" r="2.2" fill="STRONG"/><circle cx="14.5" cy="15.5" r="2.2" fill="STRONG"/>',
};

Filters.twoToneIcon = function (name, size, strongColor, lightColor) {
    const body = Filters.TWO_TONE_PATHS[name].split("STRONG").join(strongColor).split("LIGHT").join(lightColor);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24">' + body + '</svg>';
};

// The light tone of a color for a two-tone icon: a hex color mixed with white; another color made transparent
Filters.LIGHT_TONE = 0.32; // the part of the color in its light tone

Filters.lightTone = function (color) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(color).trim());
    if (!match) return Alpha(color, Filters.LIGHT_TONE);
    const channels = [0, 2, 4].map(function (start) { return parseInt(match[1].substr(start, 2), 16); });
    const mixed = channels.map(function (channel) { return Math.round(channel * Filters.LIGHT_TONE + 255 * (1 - Filters.LIGHT_TONE)); });
    return "#" + mixed.map(function (channel) { return channel.toString(16).padStart(2, "0"); }).join("");
};

// *** STYLE PACKAGES:
// USAGE: Filters({ styleName: "light" })
// USAGE: Filters({ style: { accentColor: "#2E7D5B" } }) // Change only some keys.
// USAGE: Filters.styles.myStyle = { accentColor: "tomato", panel: { color: "white" } };
Filters.styles = {

    // The look of the picture: warm grays, white rows, a blue accent.
    light: FiltersDefaults.style,

};
