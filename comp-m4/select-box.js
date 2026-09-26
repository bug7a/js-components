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
- Dark theme: style: SelectBox.DARK_STYLE

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
    ariaLabel: "",
    onChange: function (self) { }, // self.value, self.getSelectedOptions()
    onOpen: function (self) { },
    onClose: function (self) { },
    style: {
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
        placeholder: {
            textColor: Black(0.4),
        },
        arrow: {
            color: Black(0.55),
        },
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 10,
            padding: 6,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        },
        search: {
            color: Black(0.04),
            border: 1,
            borderColor: Black(0.1),
            round: 6,
            fontSize: 14,
            textColor: Black(0.85),
        },
        option: {
            fontSize: 15,
            textColor: Black(0.85),
            round: 6,
            padding: [10, 8],
        },
        optionActive: {
            color: Black(0.06),
        },
        optionSelected: {
            textColor: "#141414",
            checkColor: "#141414",
            checkTickColor: White(1),
        },
        optionDisabled: {
            opacity: 0.4,
        },
        description: {
            fontSize: 12,
            textColor: Black(0.5),
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
    }
};

const SelectBox = function (params = {}) {

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

    const normalizeValue = function (value) {
        if (isMultiple()) {
            const list = (Array.isArray(value)) ? value : (value === null || value === undefined || value === "") ? [] : [value];
            // WHY: Only values that are in the options. The order of the options is used.
            return box.options.filter(function (option) { return list.some(function (v) { return sameValue(v, option.value); }); }).map(function (option) { return option.value; });
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
        return SelectBox.escapeHtml(label.slice(0, index)) +
            "<mark style='background:" + _s.highlight.color + "; color: inherit; border-radius: 3px'>" + SelectBox.escapeHtml(label.slice(index, index + text.length)) + "</mark>" +
            SelectBox.escapeHtml(label.slice(index + text.length));
    };

    // Creates objects in a container again. (One group is started and ended in it.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. With one top-level group, all objects stay in the container.
    const renderInto = function (container, buildContent) {
        if (container.wrapper) container.wrapper.remove();
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
            container.wrapper.elem.style.alignItems = "stretch";
                buildContent();
            endGroup();
        setDefaultContainerBox(previous);
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

        box.clearButton.visible = (box.clearable == 1 && selected.length > 0 && box.enabled == 1) ? 1 : 0;

        box.field.borderColor = (isOpen || isFocused) ? _s.fieldFocus.borderColor : (isMouseOver ? _s.fieldHover.borderColor : _s.field.borderColor);
        box.arrow.elem.style.transform = (isOpen) ? "rotate(180deg)" : "rotate(0deg)";

        box.elem.setAttribute("aria-expanded", (isOpen) ? "true" : "false");
        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");

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
                    that.elem.style.letterSpacing = "1px";
                    that.elem.style.marginTop = (rows.length) ? "6px" : "0px";
                }

                rows.push({ row: createOptionRow(option, rows.length), option: option });

            });

            if (list.length > shown.length) {
                Label({ text: "Showing " + shown.length + " of " + list.length + ". Type to search.", width: "100%", textAlign: "center", padding: [8, 8], ..._s.empty });
            }

        });

        // Active row: the first selected one, or the first enabled one
        const selectedIndex = rows.findIndex(function (item) { return isSelected(item.option) && !item.option.disabled; });
        setActive((selectedIndex >= 0) ? selectedIndex : rows.findIndex(function (item) { return !item.option.disabled; }), 0);

        box.list.elem.setAttribute("aria-multiselectable", (isMultiple()) ? "true" : "false");

    };

    const createOptionRow = function (option, index) {

        const selected = isSelected(option);

        const row = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 10,
            padding: _s.option.padding,
            round: _s.option.round,
            color: "transparent",
            clickable: 1,
        });
        row.elem.id = id + "-option-" + index;
        row.elem.setAttribute("role", "option");
        row.elem.setAttribute("aria-selected", (selected) ? "true" : "false");
        row.elem.style.cursor = (option.disabled) ? "default" : "pointer";
        if (option.disabled) {
            row.elem.setAttribute("aria-disabled", "true");
            row.opacity = _s.optionDisabled.opacity;
        }

            // Multiple: check box
            if (isMultiple()) {
                Label({ text: SelectBox.getCheckSvg(selected, _s), width: 18, height: 18 });
                that.elem.style.flexShrink = "0";
                that.elem.style.lineHeight = "0";
            }

            if (option.iconFile) {
                Icon({ width: 22, height: 22 });
                that.load(option.iconFile);
                that.elem.style.flexShrink = "0";
                that.elem.alt = "";
            }

            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });
            that.elem.style.flex = "1 1 auto";
            that.elem.style.minWidth = "0";

                Label({ text: highlight(option.label), fontSize: _s.option.fontSize, textColor: (selected) ? _s.optionSelected.textColor : _s.option.textColor, width: "100%" });
                if (selected && !isMultiple()) that.elem.style.fontFamily = "opensans-bold";
                that.elem.style.overflowWrap = "anywhere";

                if (option.description) {
                    Label({ text: highlight(option.description), width: "100%", ..._s.description });
                }

            endGroup();

            // Single: tick on the right
            if (!isMultiple() && selected) {
                Label({ text: SelectBox.getTickSvg(_s.optionSelected.checkColor), width: 16, height: 16 });
                that.elem.style.flexShrink = "0";
                that.elem.style.lineHeight = "0";
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
            box.panel.elem.removeAttribute("aria-activedescendant");
            box.elem.removeAttribute("aria-activedescendant");
            return;
        }

        item.row.color = _s.optionActive.color;
        box.elem.setAttribute("aria-activedescendant", item.row.elem.id);
        if (box.searchInput) box.searchInput.inputElement.setAttribute("aria-activedescendant", item.row.elem.id);
        if (scroll) item.row.elem.scrollIntoView({ block: "nearest" });

    };

    // step: +1 or -1. Skips disabled options.
    const moveActive = function (step) {
        if (rows.length == 0) return;
        let index = activeIndex;
        for (let i = 0; i < rows.length; i++) {
            index = (index + step + rows.length) % rows.length;
            if (!rows[index].option.disabled) return setActive(index);
        }
    };

    const selectOption = function (option) {

        if (isMultiple()) {
            if (isSelected(option)) box.value = box.value.filter(function (v) { return !sameValue(v, option.value); });
            else box.value = normalizeValue(box.value.concat([option.value]));
        } else {
            box.value = option.value;
        }

        const keepActive = activeIndex;
        updateField();

        const closeOnSelect = (box.closeOnSelect === null) ? !isMultiple() : box.closeOnSelect == 1;
        if (closeOnSelect) {
            box.close();
            box.elem.focus();
        } else {
            const scrollTop = box.list.elem.scrollTop;
            renderList();
            box.list.elem.scrollTop = scrollTop; // WHY: The list must not jump after a click.
            setActive(keepActive, 0);
        }

        box.onChange(box);

    };

    // Position the popup panel under (or above) the field.
    const positionPanel = function () {

        const rect = box.elem.getBoundingClientRect();
        const space = 6;
        const width = Math.max(withPageZoom(rect.width), box.panelMinWidth);

        box.panel.width = width;
        box.list.elem.style.maxHeight = box.panelMaxHeight + "px";

        const panelHeight = box.panel.elem.offsetHeight;
        const below = page.height - withPageZoom(rect.bottom) - space - 8;
        const above = withPageZoom(rect.top) - space - 8;

        let top = withPageZoom(rect.bottom) + space;
        if (panelHeight > below && above > below) {
            // Open above. Make the list shorter if there is not enough space.
            const extra = panelHeight - above;
            if (extra > 0) box.list.elem.style.maxHeight = Math.max(80, box.panelMaxHeight - extra) + "px";
            top = withPageZoom(rect.top) - box.panel.elem.offsetHeight - space;
        } else if (panelHeight > below) {
            const extra = panelHeight - below;
            box.list.elem.style.maxHeight = Math.max(80, box.panelMaxHeight - extra) + "px";
        }

        let left = withPageZoom(rect.left);
        left = Math.max(8, Math.min(left, page.width - width - 8));

        box.panel.left = left;
        box.panel.top = Math.max(8, top);

    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;
        const key = event.key;
        const inSearch = box.searchInput && event.target === box.searchInput.inputElement;

        if (!isOpen) {
            if (key == "Enter" || key == " " || key == "ArrowDown" || key == "ArrowUp") {
                event.preventDefault();
                box.open();
            } else if (key.length == 1 && !event.ctrlKey && !event.metaKey && !event.altKey && isSearchable()) {
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
                if (rows[activeIndex] && !rows[activeIndex].option.disabled) selectOption(rows[activeIndex].option);
                break;
            case " ":
                if (inSearch) return; // WHY: Space is a letter in the search.
                event.preventDefault();
                if (rows[activeIndex] && !rows[activeIndex].option.disabled) selectOption(rows[activeIndex].option);
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
        box.panel.visible = 0;

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
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
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

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        page.remove_onResize(onPageResize);

        // Remove objects that were created on the page.
        box.overlay.remove();
        box.panel.remove();

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    box.color = "transparent";
    box.clickable = 1;
    box.elem.style.outline = "none";
    box.elem.style.userSelect = "none";
    box.elem.setAttribute("role", "combobox");
    box.elem.setAttribute("aria-haspopup", "listbox");
    box.elem.setAttribute("aria-controls", id + "-list");
    if (box.ariaLabel) box.elem.setAttribute("aria-label", box.ariaLabel);

    // GROUP: Field
    box.field = HGroup({
        width: "100%",
        height: "100%",
        align: "left center",
        gap: 8,
        ..._s.field,
    });
    box.field.setMotion("border-color 0.15s");

        // LABEL: Selected text
        box.fieldText = Label({
            text: "",
            fontSize: _s.fieldText.fontSize,
            textColor: _s.fieldText.textColor,
        });
        box.fieldText.elem.style.whiteSpace = "nowrap";
        box.fieldText.elem.style.overflow = "hidden";
        box.fieldText.elem.style.textOverflow = "ellipsis";
        box.fieldText.elem.style.flex = "1 1 auto";
        box.fieldText.elem.style.minWidth = "0";

        // LABEL: Clear button
        box.clearButton = Label({ text: SelectBox.getClearSvg(_s.arrow.color), width: 20, height: 20, round: 4, clickable: 1 });
        box.clearButton.elem.style.flexShrink = "0";
        box.clearButton.elem.style.lineHeight = "0";
        box.clearButton.elem.style.display = "flex";
        box.clearButton.elem.style.alignItems = "center";
        box.clearButton.elem.style.justifyContent = "center";
        box.clearButton.elem.style.cursor = "pointer";
        box.clearButton.elem.setAttribute("aria-label", "Clear");

        // LABEL: Arrow
        box.arrow = Label({ text: SelectBox.getArrowSvg(_s.arrow.color), width: 16, height: 16 });
        box.arrow.elem.style.flexShrink = "0";
        box.arrow.elem.style.lineHeight = "0";
        box.arrow.elem.style.transition = "transform 0.15s";

    endGroup();

    // POPUP: Create the overlay and the panel on the page, over everything.
    setDefaultContainerBox(page);
    // NOTE: endGroup() of the panel below returns the default container to the component box.

    // BOX: Transparent overlay (click outside: close)
    box.overlay = Box(0, 0, "100%", "100%", { color: "transparent", clickable: 1 });
    box.overlay.elem.style.position = "fixed";
    box.overlay.elem.style.zIndex = "1000";

    // GROUP: Panel
    box.panel = VGroup({
        width: box.panelMinWidth,
        height: "auto",
        align: "left top",
        gap: 6,
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        round: _s.panel.round,
        padding: _s.panel.padding,
        clickable: 1,
    });
    box.panel.elem.style.alignItems = "stretch";
    box.panel.elem.style.boxShadow = _s.panel.shadow;
    box.panel.elem.style.outline = "none";
    box.panel.elem.style.zIndex = "1001";
    box.panel.elem.tabIndex = -1;

        // GROUP: Search
        box.searchGroup = HGroup({ width: "100%", height: 38, align: "left center", gap: 8, padding: [10, 0], color: _s.search.color, border: _s.search.border, borderColor: _s.search.borderColor, round: _s.search.round });
        box.searchGroup.elem.style.flexShrink = "0";

            Label({ text: SelectBox.getSearchSvg(_s.arrow.color), width: 16, height: 16 });
            that.elem.style.flexShrink = "0";
            that.elem.style.lineHeight = "0";

            box.searchInput = Input({ width: "100%", height: 34, minimal: 1, color: "transparent", fontSize: _s.search.fontSize, textColor: _s.search.textColor });
            box.searchInput.inputElement.style.padding = "0px";
            box.searchInput.inputElement.placeholder = box.searchPlaceholder;
            box.searchInput.inputElement.setAttribute("aria-label", box.searchPlaceholder);
            box.searchInput.inputElement.setAttribute("aria-controls", id + "-list");
            box.searchInput.inputElement.setAttribute("autocomplete", "off");
            box.searchInput.elem.style.flex = "1 1 auto";
            box.searchInput.elem.style.minWidth = "0";

        endGroup();

        // BOX: List
        box.list = Box({ width: "100%", height: "auto", color: "transparent", scrollY: 1, position: "relative" });
        box.list.elem.id = id + "-list";
        box.list.elem.setAttribute("role", "listbox");
        box.list.elem.style.overscrollBehavior = "contain";

        // GROUP: Footer (multiple)
        box.footer = HGroup({ width: "100%", height: "auto", align: "left center", padding: [4, 6] });
        box.footer.elem.style.justifyContent = "space-between";
        box.footer.elem.style.borderTop = "1px solid " + _s.divider.color;
        box.footer.elem.style.flexShrink = "0";

            box.selectAllButton = Label({ text: SelectBox.escapeHtml(box.selectAllText), padding: [6, 2], round: 4, clickable: 1, ..._s.footerButton });
            box.selectAllButton.elem.style.cursor = "pointer";

            box.clearAllButton = Label({ text: SelectBox.escapeHtml(box.clearText), padding: [6, 2], round: 4, clickable: 1, ..._s.footerButton });
            box.clearAllButton.elem.style.cursor = "pointer";

        endGroup();

    endGroup();

    box.overlay.visible = 0;
    box.panel.visible = 0;

    // *** OBJECT INIT CODE:

    box.on("click", function (self, event) {
        if (box.enabled != 1) return;
        if (box.clearButton.elem.contains(event.target)) return;
        box.toggle();
    });
    box.on("keydown", onKeyDown);
    box.on("focus", function () { isFocused = 1; updateField(); });
    box.on("blur", function () { isFocused = 0; updateField(); });
    box.on("mouseover", function () { isMouseOver = 1; updateField(); });
    box.on("mouseout", function () { isMouseOver = 0; updateField(); });

    box.clearButton.on("click", function () {
        box.clear();
        box.elem.focus();
    });

    box.overlay.on("click", function () { box.close(); });

    box.panel.on("keydown", onKeyDown);
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
        const add = getFilteredOptions().filter(function (option) { return !option.disabled; }).map(function (option) { return option.value; });
        box.setValue(box.value.concat(add));
    });

    box.clearAllButton.on("click", function () {
        box.clear();
    });

    page.onResize(onPageResize);

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
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
            disabled: (option.disabled == 1 || option.disabled === true) ? 1 : 0,
        };
    });
};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
SelectBox.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

SelectBox.getArrowSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
};

SelectBox.getClearSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

SelectBox.getSearchSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
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

// Dark theme. USAGE: SelectBox({ ..., style: SelectBox.DARK_STYLE })
SelectBox.DARK_STYLE = {
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
};
