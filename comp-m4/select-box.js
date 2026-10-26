/* Bismillah */

/*

Select Box - v26.09

UI COMPONENT TEMPLATE
- A dropdown select: a field that opens a list (popup) under or above it.
- Single or multiple selection (multiple: 1). "Select all" and "Clear" for multiple.
- Search in the list (searchable: "auto" -> when there are more than 8 options). Matches are highlighted.
- Options can have a description, an icon, a group title and can be disabled.
- Clear button in the field (clearable: 1).
- Keyboard: Enter / Space / ArrowDown opens. ArrowUp / ArrowDown / Home / End move, Enter selects,
  Escape closes, Tab closes. Typing on the closed field opens the search with the typed letter.
- Accessibility: combobox + listbox roles, aria-expanded, aria-selected, aria-activedescendant.
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- Big lists: Only the first "maxRenderCount" matches are drawn. (Search shows the others.)
- The list scrolls with basic/scroll-bar.js (useScrollBar: 1, style.scrollBar) when it is loaded before.
- Style packages: "classic" (default), "dark", "legacy" (the look of comp-m1 SelectItem / SelectText).
  Select with styleName. (SelectBox.styles)

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

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

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
    ariaLabel: "",
    onChange: function (self) { }, // self.value, self.getSelectedOptions()
    onOpen: function (self) { },
    onClose: function (self) { },
    styleName: "classic", // "classic", "dark", "legacy" or a name added to SelectBox.styles
    style: { // Classic style package (default)
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
        },
        optionActive: {
            color: Black(0.06),
            showAtOpen: 1, // 0: no row is marked when the list opens (only under the mouse / the keyboard)
        },
        optionSelected: {
            textColor: "#141414",
            checkColor: "#141414",
            checkTickColor: White(1),
            fontFamily: "opensans-bold", // Single selection. "": the font does not change
            showTick: 1, // Single selection: a tick on the right
            opacity: 1,
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
        scrollBar: { // The params of ScrollBar (basic/scroll-bar.js)
            bar_color: "#9A9A98",
            bar_mouseOverColor: "#6A6A68",
            bar_width: 4,
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

    // Merge style package: params.style > SelectBox.styles[styleName] > SelectBoxDefaults.style (classic)
    basic.applyStylePackage(params, SelectBox.styles, SelectBoxDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SelectBoxDefaults);

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
    const PANEL_GAP = 6; // px between the field and the panel
    const SCREEN_MARGIN = 8; // px: the panel stays this far from the edges of the page
    const MIN_LIST_HEIGHT = 80; // px: the list is not made shorter than this when the space is small
    const OVERLAY_Z_INDEX = 1000;
    const PANEL_Z_INDEX = 1001;

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
        const markStyle = "background:" + _s.highlight.color + "; color: inherit; border-radius: 3px";
        return before + "<mark style='" + markStyle + "'>" + match + "</mark>" + after;
    };

    // Creates the objects of a container again, in one group (container.wrapper).
    const renderInto = function (container, buildContent) {
        if (container.wrapper) container.wrapper.remove();
        createIn(container, function () {
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
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

        const list = getFilteredOptions();
        const shown = list.slice(0, box.maxRenderCount);
        rows = [];

        renderInto(box.list, function () {

            if (list.length == 0) {
                Label({ text: SelectBox.escapeHtml(box.emptyText), width: "100%", textAlign: "center", padding: [8, 14], ..._s.empty });
                return;
            }

            let lastGroup = "";

            shown.forEach(function (option) {

                if (option.group && option.group != lastGroup) {
                    lastGroup = option.group;
                    Label({ text: SelectBox.escapeHtml(option.group.toUpperCase()), padding: [8, 4], ..._s.group });
                    that.css = {
                        letterSpacing: "1px",
                        marginTop: (rows.length) ? "6px" : "0px",
                    };
                }

                rows.push({ row: createOptionRow(option, rows.length), option: option });

            });

            if (list.length > shown.length) {
                const moreText = "Showing " + shown.length + " of " + list.length + ". Type to search.";
                Label({ text: moreText, width: "100%", textAlign: "center", padding: [8, 8], ..._s.empty });
            }

        });

        setActive(getStartActiveIndex(), 0);

        box.list.aria = { multiselectable: (isMultiple()) ? "true" : "false" };
        refreshScrollBar();

    };

    const refreshScrollBar = function () {
        if (box.scrollBar) box.scrollBar.refreshScroll();
    };

    // Active row after the list is drawn: the first selected one, or the first enabled one
    const getStartActiveIndex = function () {
        if (_s.optionActive.showAtOpen == 0) return -1;
        const selectedIndex = rows.findIndex(function (item) { return isSelected(item.option) && !item.option.disabled; });
        if (selectedIndex >= 0) return selectedIndex;
        return rows.findIndex(function (item) { return !item.option.disabled; });
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
        if (selected && _s.optionSelected.opacity != 1) row.opacity = _s.optionSelected.opacity;
        row.elem.id = id + "-option-" + index;
        row.role = "option";
        row.aria = { selected: (selected) ? "true" : "false" };
        row.cursor = (option.disabled) ? "default" : "pointer";
        if (option.disabled) {
            row.aria = { disabled: "true" };
            row.opacity = _s.optionDisabled.opacity;
        }

            // Multiple: check box
            if (isMultiple()) {
                createSvgLabel(SelectBox.getCheckSvg(selected, _s), 18);
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
                createSvgLabel(SelectBox.getTickSvg(_s.optionSelected.checkColor), 16);
            }

        endGroup();

        row.on("mousemove", function () {
            if (activeIndex != index && !option.disabled) setActive(index, 0);
        });

        row.on("click", function () {
            if (!option.disabled) selectOption(option);
        });

        return row;

    };

    // scroll: 1 -> Move the list to show the active row.
    const setActive = function (index, scroll = 1) {

        if (rows[activeIndex]) rows[activeIndex].row.color = "transparent";
        activeIndex = index;

        const item = rows[activeIndex];
        if (!item) {
            box.panel.aria = { activedescendant: null };
            box.aria = { activedescendant: null };
            return;
        }

        item.row.color = _s.optionActive.color;
        box.aria = { activedescendant: item.row.elem.id };
        if (box.searchInput) box.searchInput.inputElement.setAttribute("aria-activedescendant", item.row.elem.id);
        if (scroll) item.row.elem.scrollIntoView({ block: "nearest" });

    };

    // step: +1 or -1. Skips disabled options.
    const moveActive = function (step) {
        if (rows.length == 0) return;
        // WHY: With no active row (-1), ArrowUp starts from the end: (-1 - 1) % length was the row before the last one.
        let index = (activeIndex < 0 && step < 0) ? rows.length : activeIndex;
        for (let i = 0; i < rows.length; i++) {
            index = (index + step + rows.length) % rows.length;
            if (!rows[index].option.disabled) return setActive(index);
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

        const oldValue = JSON.stringify(box.value);
        if (isMultiple()) {
            toggleInValue(option);
        } else {
            box.value = option.value;
        }
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
            setActive(keepActive, 0);
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
        if (item && !item.option.disabled) selectOption(item.option);
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

    const onPageResize = function () {
        if (isOpen) box.close();
    };

    // *** PUBLIC FUNCTIONS:

    // startText: The first letters of the search (typed on the closed field)
    box.open = function (startText = "") {

        if (isOpen || box.enabled != 1) return;
        isOpen = 1;

        searchText = (isSearchable()) ? startText : "";
        box.searchGroup.visible = (isSearchable()) ? 1 : 0;
        if (box.searchInput) box.searchInput.text = searchText;
        box.footer.visible = (isMultiple() && box.showSelectAll == 1) ? 1 : 0;

        box.overlay.visible = 1;
        box.panel.visible = 1;
        renderList();
        positionPanel();
        refreshScrollBar(); // WHY: positionPanel may make the list shorter.
        showPanelWithMotion();
        if (rows[activeIndex]) rows[activeIndex].row.elem.scrollIntoView({ block: "nearest" });

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
        box.value = normalizeValue(value);
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
        box.clearButton = Label({ text: SelectBox.getClearSvg(_s.arrow.color), width: 20, height: 20, round: 4, clickable: 1 });
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

        // GROUP: Search
        box.searchGroup = HGroup({
            width: "100%",
            height: _s.search.height,
            align: "left center",
            gap: 8,
            padding: _s.search.padding,
            color: _s.search.color,
            border: _s.search.border,
            borderColor: _s.search.borderColor,
            round: _s.search.round,
        });
        box.searchGroup.shrink = 0;
        if (_s.search.borderBottom) box.searchGroup.css.borderBottom = _s.search.borderBottom;

            createSvgLabel(SelectBox.getSearchSvg(_s.arrow.color, _s.search.iconSize), _s.search.iconSize);

            box.searchInput = Input({ width: "100%", height: _s.search.height - 4, minimal: 1, color: "transparent", fontSize: _s.search.fontSize, textColor: _s.search.textColor });
            box.searchInput.inputElement.style.padding = "0px";
            box.searchInput.inputElement.placeholder = box.searchPlaceholder;
            box.searchInput.inputElement.setAttribute("aria-label", box.searchPlaceholder);
            box.searchInput.inputElement.setAttribute("aria-controls", id + "-list");
            box.searchInput.inputElement.setAttribute("autocomplete", "off");
            box.searchInput.css = { flex: "1 1 auto", minWidth: "0" };

        endGroup();

        // BOX: List
        box.list = Box({ width: "100%", height: "auto", color: "transparent", scrollY: 1, position: "relative" });
        box.list.elem.id = id + "-list";
        box.list.role = "listbox";
        box.list.css.overscrollBehavior = "contain";

        // GROUP: Footer (multiple)
        box.footer = HGroup({ width: "100%", height: "auto", align: "left center", padding: [4, 6] });
        box.footer.css = {
            justifyContent: "space-between",
            borderTop: "1px solid " + _s.divider.color,
        };
        box.footer.shrink = 0;

            box.selectAllButton = Label({ text: SelectBox.escapeHtml(box.selectAllText), padding: [6, 2], round: 4, clickable: 1, ..._s.footerButton });
            box.selectAllButton.cursor = "pointer";

            box.clearAllButton = Label({ text: SelectBox.escapeHtml(box.clearText), padding: [6, 2], round: 4, clickable: 1, ..._s.footerButton });
            box.clearAllButton.cursor = "pointer";

        endGroup();

    endGroup();

    box.overlay.visible = 0;
    box.panel.visible = 0;

    // SCROLL BAR: on the list. It moves itself into the panel (the parent of the list) and sits over the list.
    // WHY: Created here, not in the panel: an object created in the panel (a group) would be a part of its layout.
    if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
        box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.list }, _s.scrollBar));
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

    box.searchInput.inputElement.addEventListener("input", function () {
        searchText = box.searchInput.text;
        renderList();
        box.list.elem.scrollTop = 0;
    });

    box.selectAllButton.on("click", function () {
        // Only the options in the search result
        const enabledOptions = getFilteredOptions().filter(function (option) { return !option.disabled; });
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

// Up and down arrows (the "unfold more" icon of the comp-m1 SelectItem)
SelectBox.getUnfoldSvg = function (color, size = 20) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 -960 960 960" fill="' + color + '"><path d="M480-80 240-320l57-57 183 183 183-183 57 57L480-80ZM298-584l-58-56 240-240 240 240-58 56-182-182-182 182Z"/></svg>';
};

SelectBox.getClearSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

SelectBox.getSearchSvg = function (color, size = 16) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
};

SelectBox.getTickSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
};

// Check box of the multiple mode
SelectBox.getCheckSvg = function (checked, style) {
    const s = style.optionSelected;
    if (!checked) {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="16" height="16" rx="4" fill="none" stroke="' + style.arrow.color + '" stroke-width="1.5"/></svg>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect x="0.5" y="0.5" width="17" height="17" rx="4" fill="' + s.checkColor + '"/>' +
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
    classic: SelectBoxDefaults.style,

    // Dark theme. (The other dark packages of comp-m4 use these colors.)
    dark: {
        field: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 8, padding: [12, 0] },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldText: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)" },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        arrow: { color: "rgba(255, 255, 255, 0.55)" },
        panel: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.12)", round: 10, padding: 6, shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
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
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
    },

};

// The look of the comp-m1 SelectItem and SelectText (02-comp-m1-samples/select-item.htm, select-text.htm):
// a whitesmoke box with a thin border, the list opens over the field with a fade, a yellow search box,
// rows that get white under the mouse, the selected one half transparent. Big rows with an icon and a
// description (height: 94) or text rows (height: 50).
SelectBox.styles.legacy = {
    // WHY: padding 19 (not 20): the border is inside the box. The old border was drawn over the content.
    field: { color: "whitesmoke", border: 1, borderColor: "rgba(0, 0, 0, 0.3)", round: 4, padding: [19, 0] },
    fieldHover: { borderColor: "rgba(0, 0, 0, 0.3)" },
    fieldFocus: { borderColor: "rgba(0, 0, 0, 0.3)" },
    fieldText: { fontSize: 20, textColor: "rgba(0, 0, 0, 0.8)" },
    fieldOption: { iconSize: 70, iconRound: 4, iconMarginLeft: 10, gap: 20, showDescription: 1, emptyIconColor: Black(0.06) },
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
    search: {
        color: "#FFFCD6",
        border: 0,
        borderColor: "transparent",
        round: 2,
        fontSize: 18,
        textColor: "rgba(0, 0, 0, 0.8)",
        height: 40,
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
        iconSize: 70,
        iconRound: 4,
        iconMargin: [10, 12],
    },
    optionActive: { color: "white", showAtOpen: 0 },
    optionSelected: { textColor: "rgba(0, 0, 0, 0.8)", checkColor: "#373836", checkTickColor: "white", fontFamily: "", showTick: 0, opacity: 0.5 },
    description: { fontSize: 14, textColor: "gray", marginTop: -4 }, // WHY: -4: the old title (top 25) and description (top 49) overlap a little.
    highlight: { color: "transparent" },
    empty: { fontSize: 16, textColor: Black(0.45) },
    // The scroll bar of the comp-m1 ItemList: always shown, with the dots at its ends.
    scrollBar: { bar_color: "#373836", bar_mouseOverColor: "#373836", bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, neverHide: 1, showDots: 1 },
};

// The old name of the dark package. (Kept: pages may use it.)
SelectBox.DARK_STYLE = SelectBox.styles.dark;
