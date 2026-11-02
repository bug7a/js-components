/* Bismillah */

/*

Filters - v26.11

UI COMPONENT
- A filter menu: a "Filters" button, and under it a panel with a search field, groups of options with check
  boxes and a footer with the number of the selected options and "Clear all".
- Made in basic-designer from a picture, then turned into this component.
- The groups (sections) open and close; the search shows the options with the text; every change of the
  selection goes to onChange (not at create time, not with silent: 1).
- Style packages: "light" (default). Select with styleName. (Filters.styles)

USAGE:
const filters = Filters({
    sections: [
        { key: "type", titleText: "Type", opened: 1, options: [
            { key: "car", labelText: "Car" },
            { key: "truck", labelText: "Truck", checked: 1 },
        ] },
        { key: "status", titleText: "Status", opened: 0, options: ["Online", "Offline"] }, // a text: its key is the text
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

Started Date: October 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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
    // [{ key, titleText, opened, options: [{ key, labelText, checked }] or ["text"] }]
    sections: [],
    onChange: function (self) { }, // The selection changed: self.getSelected(). (Not at create time, not with silent: 1)
    onPanelToggle: function (self) { }, // The panel opened / closed: self.panelOpened
    styleName: "light", // "light" or a name added to Filters.styles
    style: { // Light style package (default)
        accentColor: "#2F5BD3", // a checked box, "Clear all"
        textColor: "#1F1F1E",
        softTextColor: "#8C8B88", // the titles of the sections, "Selected", the search icon
        fontSize: 18,
        button: { color: "#E2E1DD", height: 50, round: 12, padding: [16, 0], gap: 8 },
        panel: { color: "#F7F6F3", border: 1, borderColor: "#E4E3DF", round: 18, padding: 8, gap: 6, shadow: "0 10px 30px rgba(0, 0, 0, 0.08)" },
        field: { color: "#EDECE8", height: 50, round: 12, padding: [14, 0], gap: 10 },
        header: { height: 44, padding: [12, 0], gap: 8 },
        row: { color: "white", height: 48, round: 12, padding: [12, 0], gap: 14, hoverColor: "#FBFBFA" },
        check: { size: 22, round: 6, color: "#EDECE8", markColor: "white" },
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
    let searchText = "";

    // *** PUBLIC VARIABLES:
    box.sectionViews = []; // [{ section, header, lblCount, lblArrow, rows: [{ option, row, check, mark }] }]
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
        return option.labelText.toLocaleLowerCase().indexOf(searchText) !== -1;
    };

    // GROUP: one option of a section: a check box and its text
    const createRow = function (view, option) {
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
            Label({ plainText: option.labelText, fontSize: _s.fontSize, textColor: _s.textColor });
        endGroup();
        const rowView = { option: option, row: row, check: check, mark: mark };
        row.onHoverChange(function (self, isOver) { row.color = (isOver) ? _s.row.hoverColor : _s.row.color; });
        row.on("click", function () { toggleOption(view, rowView); });
        row.on("keydown", function (self, event) {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            toggleOption(view, rowView);
        });
        return rowView;
    };

    // GROUP: the title of a section: its name, the number of the checked options, open / closed
    const createSection = function (section) {
        const view = { section: section, rows: [] };
        view.header = HGroup({ width: "100%", height: _s.header.height, align: "left center", gap: _s.header.gap, padding: _s.header.padding });
        view.header.shrink = 0;
        view.header.clickable = 1;
        view.header.cursor = "pointer";
        view.header.role = "button";
            Label({ plainText: section.titleText, fontSize: _s.fontSize, textColor: _s.softTextColor });
            view.lblCount = createBadge();
            createSpace();
            view.lblArrow = createIcon("", _s.textColor);
        endGroup();
        view.header.on("click", function () { box.setSectionOpened(section.key, !section.opened); });
        view.rows = section.options.map(function (option) { return createRow(view, option); });
        return view;
    };

    // DATA: the sections and their options (made again in the list)
    const createSections = function () {
        if (box.listGroup) box.listGroup.remove();
        box.listGroup = createIn(box.listBox, function () {
            const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.listGap, position: "relative" });
                box.sectionViews = box.sections.map(createSection);
                box.lblNoResult = Label({ plainText: box.noResultText, fontSize: _s.fontSize, textColor: _s.softTextColor, padding: [12, 12] });
            endGroup();
            return group;
        });
    };

    // PAINT: the checks, the counts, the arrows, what the search and the closed sections hide
    const paint = function () {
        let shownCount = 0;
        box.sectionViews.forEach(function (view) {
            const checkedCount = countChecked(view.section);
            view.lblCount.plainText = String(checkedCount);
            view.lblCount.visible = (checkedCount) ? 1 : 0;
            view.lblArrow.text = Filters.icon((view.section.opened) ? "up" : "down", ICON_SIZE);
            view.header.aria = { expanded: view.section.opened ? "true" : "false" };
            let sectionMatches = 0;
            view.rows.forEach(function (rowView) {
                const isChecked = !!rowView.option.checked;
                rowView.check.color = (isChecked) ? _s.accentColor : _s.check.color;
                rowView.mark.visible = (isChecked) ? 1 : 0;
                rowView.row.aria = { checked: isChecked ? "true" : "false" };
                const isMatch = matchesSearch(rowView.option);
                if (isMatch) sectionMatches++;
                // WHY: While searching, the matches are shown also in a closed section.
                rowView.row.visible = (isMatch && (view.section.opened || searchText)) ? 1 : 0;
            });
            view.header.visible = (!searchText || sectionMatches) ? 1 : 0;
            shownCount += sectionMatches;
        });
        box.lblNoResult.visible = (searchText && !shownCount) ? 1 : 0;
        const total = box.getSelectedCount();
        box.lblSelectedCount.plainText = String(total);
        box.lblSelectedCount.visible = (total) ? 1 : 0;
        box.lblClear.opacity = (total) ? 1 : 0.4;
    };

    const toggleOption = function (view, rowView) {
        rowView.option.checked = rowView.option.checked ? 0 : 1;
        paint();
        box.onChange(box);
    };

    const findSection = function (sectionKey) {
        return box.sections.find(function (section) { return section.key === sectionKey; }) || null;
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

            // GROUP: Search field
            box.searchField = HGroup({ width: "100%", height: _s.field.height, align: "left center", gap: _s.field.gap, padding: _s.field.padding, color: _s.field.color, round: _s.field.round });
                createIcon(Filters.icon("search", ICON_SIZE), _s.softTextColor);
                box.inpSearch = Input({ height: _s.field.height - 10, fontSize: _s.fontSize, textColor: _s.textColor, minimal: 1, color: "transparent", placeholder: box.searchPlaceholder });
                box.inpSearch.grow = 1;
            endGroup();

            // BOX: The sections (they scroll)
            const listHeight = box.panelHeight - _s.field.height - _s.footer.height - _s.panel.padding * 2 - LIST_GAPS;
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
        const section = findSection(sectionKey);
        if (!section) return;
        section.opened = (isOpened) ? 1 : 0;
        paint();
    };

    box.setSections = function (sections) {
        box.sections = Filters.normalizeSections(sections);
        createSections();
        paint();
    };

    box.search = function (text) {
        searchText = String(text || "").trim().toLocaleLowerCase();
        if (box.inpSearch.text !== text) box.inpSearch.text = String(text || "");
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
        box.panel.visible = value;
        box.btnFilters.aria = { expanded: value ? "true" : "false" };
        if (value) placePanel();
        if (!silent) box.onPanelToggle(box);
    };

    box.setButtonText = function (text) {
        box.buttonText = text;
        box.lblButton.plainText = text;
    };

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
            createIcon(Filters.icon("filter", ICON_SIZE), _s.textColor);
            box.lblButton = Label({ plainText: box.buttonText, fontSize: _s.fontSize, textColor: _s.textColor });
            createIcon(Filters.icon("down", ICON_SIZE), _s.textColor);
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
    box.listenTo(box.inpSearch.inputElement, "input", function () { box.search(box.inpSearch.text); });

    if (isPopup) {
        box.listenTo(document, "pointerdown", closeOnOutsideClick, true);
        box.listenTo(document, "keydown", closeOnEscape);
        box.listenTo(document, "scroll", placeOnScroll, true); // WHY: capture: the scroll of a box does not bubble.
        box.onPageResize(placePanel);
    }

    createSections();
    paint();
    box.panelOpened = 0;
    box.panel.visible = 0; // WHY: Hidden after its children are made.
    box.setPanelOpened(params.panelOpened, 1);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The sections with every value filled: keys as texts, opened / checked as 1 / 0, a text option -> { key, labelText }.
Filters.normalizeSections = function (sections) {
    return (Array.isArray(sections) ? sections : []).map(function (section, index) {
        const options = (Array.isArray(section.options) ? section.options : []).map(function (option) {
            if (typeof option !== "object") return { key: String(option), labelText: String(option), checked: 0 };
            return { key: String(option.key !== undefined ? option.key : option.labelText), labelText: String(option.labelText || ""), checked: option.checked ? 1 : 0 };
        });
        return { key: String(section.key !== undefined ? section.key : index), titleText: String(section.titleText || ""), opened: section.opened ? 1 : 0, options: options };
    });
};

// An icon: lines in the color of its label (currentColor). name: "filter", "search", "down", "up", "check"
Filters.ICON_PATHS = {
    filter: '<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
    down: '<path d="M6 9l6 6 6-6"/>',
    up: '<path d="M6 15l6-6 6 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};

Filters.icon = function (name, size, strokeWidth = 2) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' + Filters.ICON_PATHS[name] + '</svg>';
};

// *** STYLE PACKAGES:
// USAGE: Filters({ styleName: "light" })
// USAGE: Filters({ style: { accentColor: "#2E7D5B" } }) // Change only some keys.
// USAGE: Filters.styles.myStyle = { accentColor: "tomato", panel: { color: "white" } };
Filters.styles = {

    // The look of the picture: warm grays, white rows, a blue accent.
    light: FiltersDefaults.style,

};
