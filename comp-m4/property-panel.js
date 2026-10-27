/* Bismillah */

/*

PropertyPanel - v26.09

UI COMPONENT TEMPLATE
- A property inspector at the right side of the screen, like the "Design" panel of design tools.
  Full height, 240 px wide (width), one dark style.
- Built from a JSON (data): header tabs, a title with action icons, and sections of items.
  footer: one more section, fixed at the bottom (out of the scrolling part). Ex: a note field.
  headerTitle: a name at the left of the header; the tabs and the headerItem come next to it.
  empty: { icon, title, text, hints: [{ keys, text }] } -> a page in the middle in place of the sections
  (Ex: nothing is selected).
  Each item has a type, a key, a value and its own settings. Every item type is a small object
  built by its own function (see *** ITEM TYPES):
    number     -> [X  396]  prefix text or icon (drag the prefix to change the value), unit, min, max, step, autoText
                  parseText(text): a text that is not a plain number goes to it; it returns the value ("100%", "auto")
                  or undefined (the old value comes back). A text value is shown as it is.
                  textToNumber(value): the number of a text value, to drag or step it (Ex: "100%" -> its width in px).
    text       -> [ name ]  a text field
    textarea   -> a text of more lines (rows: 2). caption: the first line of the placeholder (it goes while writing). Saved on blur or Cmd/Ctrl+Enter.
    select     -> [ Left ⌄]  a menu of options, optional icon, look: "plain" (no background)
    combo      -> [16  | ⌄]  a number field and a menu of preset values
    segmented  -> [≡|≡|≡]  icon or text buttons. With a value: one is selected. Without: action buttons.
    iconButton -> [◎]  an action, or a toggle (toggle: 1, value true/false)
    constraints-> Horizontal and vertical selects and the constraints diagram. value: { horizontal, vertical }
    alignGrid  -> a 3x3 grid of the places of the content (the align of a group). value: "left top", "center"...
    color      -> [■ #3871E0 | 100%]  a swatch, the color text and its opacity. A click on the swatch opens the
                  color picker (at the left of the panel): saturation / brightness, hue, opacity, the eyedropper
                  (Chrome), the color text, and the color groups (palettes) under them.
                  palettes (a param of the panel): [{ key, name, colors, canAdd, emptyText }] or function (panel) -> that.
                  colors: ["#FFFFFF", { value: "var(--color-primary)", color: "#3871E0", hint: "Primary" }, ...]
                  canAdd: 1 -> a + button adds the current color: change { kind: "addColor", key: palette key, value }.
                  presets (of the item, old): shown as the first palette, "Presets".
                  Also: the color before / now (a click on "before" goes back), HEX / RGB / HSL text, and the
                  recent colors (recentColorsKey: kept in basic.storage).
- Items of a row: put them in an array. span: 1 (one column), 2 (two columns). An iconButton takes the
  small last column. label: the caption above the item.
- Listen to every change from outside: onChange(change, panel) or panel.listen(fn) (returns a remover).
  change = { kind: "value" | "action" | "tab" | "addColor", key, value, oldValue, item, sectionKey }
  The panel keeps the values: getValues(), getValue(key), getData() (the JSON with the current values).
- setValue(key, value, silent) changes an item from outside (Ex: another object was selected).
- It is always created on the page (whatever container is open) and opened at the right side.
  open() / close() / toggle() slide it. (Not show / hide: those are basic.js methods.)
- The menus (select, combo) are created on the page and removed with the panel.

USAGE:
const panel = PropertyPanel({
    data: {
        tabs: [{ key: "design", text: "Design" }, { key: "prototype", text: "Prototype" }],
        activeTab: "design",
        title: "Text",
        sections: [
            { key: "position", title: "Position", items: [
                [{ key: "x", type: "number", label: "Position", prefix: "X", value: 396 },
                 { key: "y", type: "number", prefix: "Y", value: 668 }],
                { key: "rotation", type: "number", label: "Rotation", icon: "angle", value: 0, unit: "°" },
            ] },
        ],
    },
    onChange: function (change, self) { println(change.key + " = " + change.value); },
});
panel.setValue("x", 400, 1);        // silent
panel.getValues();                  // { x: 400, y: 668, rotation: 0 }

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const PropertyPanelDefaults = {
    key: "0",
    width: 240,
    data: {}, // tabs, activeTab, headerTitle, headerItem, title, titleActions, sections, footer, empty (See the USAGE above)
    opened: 1, // 1: Open at create time.
    onChange: function (change, self) { }, // Every change: { kind, key, value, oldValue, item, sectionKey }
    palettes: null, // The color groups of the color picker: [{ key, name, colors, canAdd, emptyText }] or function (panel) -> that
    recentColorsKey: "", // The recent colors of the color picker are kept in basic.storage with this key. "": only until the page closes.
    style: {
        panel: {
            color: "#2C2C2C",
            dividerColor: "#444444",
            headerHeight: 48,
            paddingLeft: 16,
            paddingRight: 8,
            motion: "0.25s",
        },
        grid: {
            columnWidth: 88, // span: 1 (span: 2 = two columns + gap)
            iconColumnWidth: 24,
            gap: 8,
            rowGap: 8,
            itemHeight: 24,
        },
        text: {
            color: "#FFFFFF",
            softColor: "#A5A5A5", // Captions, inactive tabs, prefixes
            disabledColor: "#6E6E6E",
            fontSize: 12,
            captionSize: 11,
            titleSize: 13,
            sectionTitleSize: 12,
        },
        field: {
            color: "#383838",
            hoverBorderColor: "#4D4D4D",
            focusBorderColor: "#0C8CE9",
            round: 5,
        },
        segmented: {
            selectedColor: "#2C2C2C",
            selectedBorderColor: "#5C5C5C",
            hoverColor: "#434343",
        },
        button: {
            hoverColor: "#383838",
            activeColor: "#34435A", // toggle on
            activeIconColor: "#7CC4F8",
            iconColor: "#E6E6E6",
        },
        accent: {
            color: "#0C8CE9", // Constraints lines, menu hover
        },
        menu: {
            color: "#1E1E1E",
            borderColor: "#3A3A3A",
            hoverColor: "#0C8CE9",
            textColor: "#FFFFFF",
            round: 8,
            rowHeight: 26,
            maxHeight: 320,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        },
        constraints: {
            frameColor: "#555555", // The inner frame of the constraints picture
        },
        alignGrid: {
            cellColor: "#6E6E6E", // The empty square of a place
            hoverColor: "#A5A5A5",
            selectedColor: "#0C8CE9", // The filled square of the chosen place (the accent)
        },
        textarea: {
            lineHeight: 17,
            fontFamily: "opensans, sans-serif",
        },
        colorPicker: {
            width: 240,
            padding: 12,
            areaHeight: 150, // Saturation / brightness area
            handleSize: 12,
            sliderHeight: 12,
            swatchSize: 18,
            swatchGap: 6,
            swatchesMaxHeight: 126, // More colors scroll
        },
        empty: { // data.empty: the page in the middle (Ex: nothing is selected)
            iconSize: 26,
            iconColor: "#A5A5A5",
            iconBoxColor: "#383838",
            iconBoxRound: 16,
        },
        swatch: {
            size: 14,
            borderColor: "rgba(255, 255, 255, 0.25)",
            emptyColor: "#555555", // The line of an empty (transparent) color
        },
        scrollBar: { // basic/scroll-bar.js (ScrollBar) parameters of the panel
            bar_color: "#FFFFFF",
            bar_mouseOverColor: "#FFFFFF",
            bar_opacity: 0.25,
            bar_mouseOverOpacity: 0.5,
            neverHide: 0,
            showDots: 0,
        },
    }
};

const PropertyPanel = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PropertyPanelDefaults);

    // Edit params, if needed:
    const _ps = params.style.panel;
    params.left = "calc(100% - " + params.width + "px)";
    params.top = 0;
    params.height = "100%";
    params.color = _ps.color;
    const startData = params.data;
    params.data = {}; // WHY: The working copy is made in setData().

    // WHY: A side panel covers the page. Wherever it is called from, it is created on the page.
    // NOTE: The container is put back by hand after endObject(), at the end of this function. (Like SidePanel)
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const _t = _s.text;
    const _g = _s.grid;
    const panelWidth = Number(box.width) || PropertyPanelDefaults.width;
    let controllers = {}; // key -> { item, sectionKey, field, cell, setValue(), setEnabled() }
    let listeners = [];
    let tabLabels = {};
    let titleLabel = null;
    let menu = null; // { obj, opener }
    const MENU_MIN_WIDTH = 140;
    const MENU_Z_INDEX = 2147482000; // WHY: Over everything of the page (the panel, modals).
    const MENU_OFFSET = 4; // Space between the field and its menu.
    const SCREEN_MARGIN = 8; // The menu stays this far from the window edges.
    const SHIFT_STEP_FACTOR = 10; // Shift + arrow / scrub: 10 steps.

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.data: the JSON with the current values)

    // *** PRIVATE FUNCTIONS:

    // SVG of an icon name (PropertyPanel.icons) or a raw "<svg" string.
    const getIcon = function (name, size = 16) {
        if (!name) return "";
        if (String(name).trim().indexOf("<svg") === 0) return name;
        const path = PropertyPanel.icons[name];
        if (!path) return basic.escapeHtml(name); // Not an icon: shown as text (Ex: "X")
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' + path + '"/></svg>';
    };

    const getSpanWidth = function (span) {
        if (span === "full") return panelWidth - _ps.paddingLeft - _ps.paddingRight;
        if (span == 2) return _g.columnWidth * 2 + _g.gap;
        return _g.columnWidth;
    };

    // Color of a text or an icon: its own color, or the disabled color.
    const ink = function (enabled, color) {
        return (enabled) ? color : _t.disabledColor;
    };

    // A one line label. html: an icon or a short text. props.plainText: a user text (never read as HTML).
    // props.flex: takes the free space of its row and ends with "...". It never takes the pointer, its field does.
    const textLabel = function (html, props = {}) {
        const lbl = Label({
            text: html,
            fontSize: props.fontSize || _t.fontSize,
            textColor: props.textColor || _t.color,
        });
        lbl.clickable = 0;
        lbl.shrink = 0;
        if (props.bold) lbl.bold = 1;
        if (props.height !== undefined) lbl.height = props.height;
        if (props.flex) {
            lbl.grow = 1;
            lbl.shrink = 1;
            lbl.ellipsis = 1;
            lbl.lineHeight = props.height || _g.itemHeight;
            lbl.css = { flexBasis: "0px", minWidth: "0px" };
        } else {
            lbl.css = { display: "flex", alignItems: "center", whiteSpace: "nowrap" };
            if (props.width !== undefined) {
                lbl.width = props.width;
                lbl.css.justifyContent = "center";
            }
        }
        if (props.plainText !== undefined) lbl.plainText = props.plainText;
        return lbl;
    };

    // Inner border that does not change the size.
    const setBorder = function (obj, color) {
        obj.boxShadow = (color) ? "inset 0 0 0 1px " + color : "none";
    };

    // fn(1) on mouseenter, fn(0) on mouseleave.
    const onHover = function (obj, fn) {
        obj.on("mouseenter", function () { fn(1); });
        obj.on("mouseleave", function () { fn(0); });
    };

    // Enter and Space (and extraKeys) run fn, like a click.
    const onActivateKey = function (obj, fn, extraKeys = []) {
        obj.on("keydown", function (self, event) {
            const isActivateKey = (event.key === "Enter" || event.key === " " || extraKeys.indexOf(event.key) > -1);
            if (!isActivateKey) return;
            event.preventDefault();
            fn();
        });
    };

    // Border of a field: focus, hover (when enabled) or none.
    const paintField = function (field, state) {
        if (state.isFocus) setBorder(field, _s.field.focusBorderColor);
        else if (state.isHover && state.enabled) setBorder(field, _s.field.hoverBorderColor);
        else setBorder(field, "");
    };

    const precisionOf = function (item) {
        const hasPrecision = (item.precision !== undefined && item.precision !== "auto");
        if (hasPrecision) return Math.max(0, Number(item.precision) || 0);
        const text = String(item.step || 1);
        return (text.indexOf(".") > -1) ? text.split(".")[1].length : 0;
    };

    const normalizeOptions = function (options) {
        return (options || []).map(function (option) {
            const isObject = (option !== null && typeof option === "object");
            if (!isObject) return { value: option, text: String(option) };
            return {
                value: option.value,
                text: (option.text !== undefined) ? option.text : String(option.value),
                icon: option.icon,
                hint: option.hint,
            };
        });
    };

    const findOption = function (options, value) {
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === value) return options[i];
        }
        return null;
    };

    // *** CHANGES:

    // Sends a change to the item, the onChange of the panel and the listeners.
    const dispatch = function (change) {
        if (change.item && typeof change.item.onChange === "function") change.item.onChange(change, box);
        box.onChange(change, box);
        listeners.slice().forEach(function (fn) { fn(change, box); });
    };

    // Some item types fill the missing parts of a value. (Ex: constraints)
    const normalizeValue = function (item, value) {
        const builder = ITEM_TYPES[item.type];
        return (builder && builder.normalize) ? builder.normalize(value) : value;
    };

    // Keeps a new value of an item and sends the change (not when silent). Returns 1 when the value changed.
    const changeValue = function (ctrl, value, silent = 0) {
        value = normalizeValue(ctrl.item, value);
        const oldValue = ctrl.item.value;
        if (PropertyPanel.isSameValue(oldValue, value)) return 0;
        ctrl.item.value = value;
        if (silent) return 1;
        dispatch({
            kind: "value",
            key: ctrl.item.key,
            value: PropertyPanel.copyValue(value),
            oldValue: oldValue,
            item: ctrl.item,
            sectionKey: ctrl.sectionKey,
        });
        return 1;
    };

    // A button without a value was clicked.
    const sendAction = function (ctrl, value) {
        dispatch({ kind: "action", key: ctrl.item.key, value: value, oldValue: undefined, item: ctrl.item, sectionKey: ctrl.sectionKey });
    };

    // *** MENU (select, combo):

    const closeMenu = function () {
        if (!menu) return;
        const closed = menu;
        menu = null;
        closed.obj.remove();
        if (closed.onClose) closed.onClose();
    };

    // Under the field; above it when there is no space below.
    const placeMenu = function (obj, rect, width) {
        const height = obj.elem.offsetHeight;
        let top = rect.bottom + MENU_OFFSET;
        if (top + height > window.innerHeight - SCREEN_MARGIN) top = Math.max(SCREEN_MARGIN, rect.top - height - MENU_OFFSET);
        obj.left = Math.max(SCREEN_MARGIN, Math.min(rect.left, window.innerWidth - width - SCREEN_MARGIN));
        obj.top = top;
    };

    // anchor: the menu is placed under it. opener: the object that opens it; a click on it again closes the menu.
    const openMenu = function (anchor, opener, options, currentValue, onPick) {
        const isOpenByThisOpener = (menu && menu.opener === opener);
        closeMenu();
        if (isOpenByThisOpener) return;
        if (!options.length) return;
        const rect = anchor.elem.getBoundingClientRect();
        const width = Math.max(rect.width, MENU_MIN_WIDTH);
        const ms = _s.menu;

        createIn(page, function () {

            // GROUP: Menu
            const obj = VGroup({ left: 0, top: 0, width: width, height: "auto", align: "left top", gap: 0, color: ms.color, round: ms.round });
            obj.boxShadow = "0 0 0 1px " + ms.borderColor + ", " + ms.shadow;
            obj.zIndex = MENU_Z_INDEX;
            obj.css = {
                padding: "6px 0px",
                boxSizing: "border-box",
                maxHeight: ms.maxHeight + "px",
                overflowY: "auto",
                alignItems: "stretch",
            };
            obj.role = "listbox";
            obj.clickable = 1;

                options.forEach(function (option) {

                    const isSelected = PropertyPanel.isSameValue(option.value, currentValue);

                    // GROUP: Menu row
                    const row = HGroup({ width: "100%", height: ms.rowHeight, align: "left center", gap: 0, color: "transparent" });
                    row.shrink = 0;
                    row.cursor = "pointer";
                    row.role = "option";
                    row.aria = { selected: (isSelected) ? "true" : "false" };
                    row.clickable = 1;

                        textLabel((isSelected) ? getIcon("check", 14) : "", { width: 28, height: ms.rowHeight, textColor: ms.textColor });
                        if (option.icon) textLabel(getIcon(option.icon, 16), { width: 22, height: ms.rowHeight, textColor: ms.textColor });
                        textLabel("", { flex: 1, height: ms.rowHeight, textColor: ms.textColor, plainText: option.text });

                    endGroup();

                    onHover(row, function (isHover) { row.color = (isHover) ? ms.hoverColor : "transparent"; });
                    row.on("click", function () {
                        closeMenu();
                        onPick(option.value);
                    });

                });

            endGroup();

            placeMenu(obj, rect, width);

            menu = { obj: obj, opener: opener };

        });
    };

    // WHY: A pointerdown on the opener is left to its click, which closes the menu (a toggle).
    const onDocumentPointerDown = function (self, event) {
        if (!menu) return;
        if (menu.obj.elem.contains(event.target)) return;
        if (menu.opener.elem.contains(event.target)) return;
        closeMenu();
    };

    // WHY: stopImmediatePropagation: this Escape closes the menu only (a page listener after it would also
    //      clear its selection). The focus goes back to the opener when it was in the menu.
    const onDocumentKeyDown = function (self, event) {
        if (!menu || event.key !== "Escape") return;
        event.stopImmediatePropagation();
        const opener = menu.opener;
        const hadFocus = menu.obj.elem.contains(document.activeElement);
        closeMenu();
        if (hadFocus && opener.elem.tabIndex >= 0) opener.elem.focus();
    };

    // *** SMALL OBJECTS USED BY THE ITEM TYPES:

    // FIELD: A text input in a field, with an optional prefix (a text or an icon). Used by "number" and "text".
    // Returns { field, input, el, prefix, setEnabled() }. The caller adds its own commit code.
    const buildInputField = function (item, width, prefixValue) {

        const state = { isHover: 0, isFocus: 0, enabled: item.enabled != 0 };
        const paint = function () { paintField(field, state); };

        // GROUP: Field
        const field = HGroup({ width: width, height: _g.itemHeight, align: "left center", gap: 0, color: _s.field.color, round: _s.field.round });
        field.shrink = 0;
        field.css = { boxSizing: "border-box", transition: "box-shadow 0.12s" };

            // LABEL: Prefix ("X" or an icon)
            const prefix = (prefixValue) ? textLabel(getIcon(prefixValue, 16), { width: 26, height: _g.itemHeight, textColor: _t.softColor }) : null;
            if (prefix) prefix.css.paddingLeft = "2px";

            // INPUT: Value
            const input = Input({ width: 10, height: _g.itemHeight, minimal: 1, fontSize: _t.fontSize, textColor: _t.color });
            input.grow = 1;
            input.shrink = 1;
            input.css.minWidth = "0px";
            const el = input.inputElement;
            Object.assign(el.style, {
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: (prefix) ? "0px 4px 0px 2px" : "0px 8px",
                backgroundColor: "transparent",
                border: "0px",
                color: _t.color,
                fontSize: _t.fontSize + "px",
            });
            el.setAttribute("spellcheck", "false");
            el.setAttribute("aria-label", item.hint || item.label || item.prefix || item.key);

        endGroup();

        onHover(field, function (isHover) {
            state.isHover = isHover;
            paint();
        });
        el.addEventListener("focus", function () {
            state.isFocus = 1;
            paint();
        });
        el.addEventListener("blur", function () {
            state.isFocus = 0;
            paint();
        });

        const setEnabled = function (enabled) {
            state.enabled = !!enabled;
            el.disabled = !state.enabled;
            el.style.color = ink(state.enabled, _t.color);
            if (prefix) prefix.textColor = ink(state.enabled, _t.softColor);
            paint();
        };

        setEnabled(state.enabled);

        return { field: field, input: input, el: el, prefix: prefix, state: state, setEnabled: setEnabled };

    };

    // FIELD: number input. Used by "number" and "combo". A new value goes to changeValue(ctrl).
    const buildNumberInput = function (ctrl, width) {

        const item = ctrl.item;
        const precision = precisionOf(item);
        const step = Math.abs(Number(item.step)) || 1;
        const min = (item.min !== undefined) ? Number(item.min) : -Infinity;
        const max = (item.max !== undefined) ? Number(item.max) : Infinity;
        let value = item.value;
        let scrub = null;

        const { field, input, el, prefix, state, setEnabled: setFieldEnabled } = buildInputField(item, width, item.icon || item.prefix);

        const format = function (v) {
            if (v === null || v === undefined || v === "") return item.autoText || "";
            if (typeof v === "string") return v; // A text value of parseText ("100%", "auto")
            return Number(v).toFixed(precision) + (item.unit || "");
        };

        // The number of a value: a number, or the number of a text value from textToNumber ("100%" -> 412 px).
        // null: no number (a text value without textToNumber is not scrubbed or stepped).
        const numberOf = function (v) {
            if (typeof v === "number") return v;
            if (typeof v !== "string" || !item.textToNumber) return null;
            const n = Number(item.textToNumber(v));
            return (isNaN(n)) ? null : n;
        };

        const clamp = function (v) {
            const factor = Math.pow(10, precision);
            return Math.round(basic.clamp(v, min, max) * factor) / factor;
        };

        // Text -> value. undefined: not a number (the old value comes back).
        // parseText (item): a text that is not a plain number goes to it, and its answer is the value ("100%").
        const parse = function (text) {
            text = String(text).trim();
            if (item.autoText && (text === "" || text.toLowerCase() === String(item.autoText).toLowerCase())) return null;
            const isPlainNumber = /^-?\d*[.,]?\d+(px)?$/i.test(text);
            if (item.parseText && !isPlainNumber) return item.parseText(text);
            const match = text.replace(",", ".").match(/-?\d*\.?\d+/);
            if (!match) return undefined;
            return clamp(parseFloat(match[0]));
        };

        const commit = function (next) {
            if (next !== undefined) value = next;
            input.text = format(value);
            el.title = (typeof value === "string") ? value : "";
            if (next !== undefined) changeValue(ctrl, value);
        };

        el.addEventListener("focus", function () { input.select(); });
        el.addEventListener("blur", function () { commit(parse(input.text)); });
        const stepFactorOf = function (event) {
            return (event.shiftKey) ? SHIFT_STEP_FACTOR : 1;
        };

        const stepByArrow = function (event) {
            const base = numberOf(parse(input.text));
            const start = (base === null) ? numberOf(value) : base;
            if (start === null && typeof value === "string") return; // WHY: A text value with no number: nothing to step.
            const direction = (event.key === "ArrowUp") ? 1 : -1;
            commit(clamp((start || 0) + direction * step * stepFactorOf(event)));
            input.select();
        };

        el.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                el.blur();
            } else if (event.key === "Escape") {
                event.preventDefault();
                input.text = format(value);
                el.blur();
            } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                stepByArrow(event);
            }
        });

        // Scrub: drag the prefix left / right. 1 px = 1 step (Shift: 10 steps)
        if (prefix) {
            prefix.clickable = 1;
            prefix.css.touchAction = "none";
            prefix.on("pointerdown", function (self, event) {
                if (!state.enabled || event.button !== 0) return;
                event.preventDefault();
                if (document.activeElement === el) el.blur();
                const start = numberOf(value);
                if (start === null && typeof value === "string") return; // WHY: A text value with no number: no scrub.
                scrub = { id: event.pointerId, x: event.clientX, start: start || 0 };
                try {
                    prefix.elem.setPointerCapture(event.pointerId);
                } catch (e) { } // WHY: It throws when the pointer is not active any more; the scrub still works without it.
            });
            prefix.on("pointermove", function (self, event) {
                if (!scrub || event.pointerId !== scrub.id) return;
                const movedPixels = Math.round(event.clientX - scrub.x);
                const next = clamp(scrub.start + movedPixels * step * stepFactorOf(event));
                if (next !== value) commit(next);
            });
            const endScrub = function () { scrub = null; };
            prefix.on("pointerup", endScrub);
            prefix.on("pointercancel", endScrub);
        }

        const setValue = function (v) {
            value = v;
            input.text = format(v);
            el.title = (typeof v === "string") ? v : ""; // WHY: A long text value ("calc(100% - 40px)") is cut in the field.
        };

        const setEnabled = function (enabled) {
            setFieldEnabled(enabled);
            if (prefix) prefix.cursor = (state.enabled) ? "ew-resize" : "default";
        };

        setValue(value);
        setEnabled(state.enabled);

        return { field: field, setValue: setValue, setEnabled: setEnabled };

    };

    // FIELD: select (a menu of options). Used by "select" and "constraints".
    // look: "field" (default) or "plain" (no background, width hugs the text)
    const buildSelect = function (config, width, onPick) {

        const options = normalizeOptions(config.options);
        const isPlain = (config.look === "plain");
        const state = { isHover: 0, isFocus: 0, enabled: config.enabled != 0 };
        let value = config.value;

        // GROUP: Field
        const field = HGroup({
            width: (isPlain) ? "auto" : width,
            height: _g.itemHeight,
            align: "left center",
            gap: 0,
            color: (isPlain) ? "transparent" : _s.field.color,
            round: _s.field.round,
        });
        field.shrink = 0;
        field.cursor = "pointer";
        field.css = { boxSizing: "border-box", outline: "none", paddingLeft: (config.icon) ? "0px" : "8px" };
        field.tabIndex = 0;
        field.role = "button";
        field.aria = { haspopup: "listbox", label: config.hint || config.label || config.key || "Select" };
        field.clickable = 1;

            if (config.icon) textLabel(getIcon(config.icon, 16), { width: 28, height: _g.itemHeight, textColor: _t.softColor });
            const lblText = textLabel("", { flex: !isPlain, height: _g.itemHeight });
            const lblArrow = textLabel(getIcon("chevronDown", 12), { width: 22, height: _g.itemHeight, textColor: _t.softColor });

        endGroup();

        // Plain: a hover background, no border.
        const paint = function () {
            if (isPlain) field.color = (state.isHover && state.enabled) ? _s.button.hoverColor : "transparent";
            else paintField(field, state);
        };

        const open = function () {
            if (!state.enabled) return;
            openMenu(field, field, options, value, function (picked) {
                setValue(picked);
                onPick(picked);
            });
        };
        field.on("click", open);
        onActivateKey(field, open, ["ArrowDown"]);
        onHover(field, function (isHover) {
            state.isHover = isHover;
            paint();
        });
        field.on("focus", function () {
            state.isFocus = !isPlain;
            paint();
        });
        field.on("blur", function () {
            state.isFocus = 0;
            paint();
        });

        // The text of the option, or the value itself when it is not an option.
        const textOfValue = function (v) {
            const option = findOption(options, v);
            if (option) return option.text;
            if (v === undefined || v === null) return "";
            return String(v);
        };

        const setValue = function (v) {
            value = v;
            lblText.plainText = textOfValue(v);
        };

        const setEnabled = function (enabled) {
            state.enabled = !!enabled;
            lblText.textColor = ink(state.enabled, _t.color);
            lblArrow.textColor = ink(state.enabled, _t.softColor);
            field.cursor = (state.enabled) ? "pointer" : "default";
            field.tabIndex = (state.enabled) ? 0 : -1;
            paint();
        };

        setValue(value);
        setEnabled(state.enabled);

        return { field: field, setValue: setValue, setEnabled: setEnabled };

    };

    // BUTTON: A small icon button. Used by "iconButton", the title actions and the section actions.
    // toggle: 1 -> value true / false (active look). Otherwise an action.
    const buildIconButton = function (ctrl) {

        const item = ctrl.item;
        const isToggle = basic.isOn(item.toggle);
        const useAccent = (item.accent !== 0);
        const state = { value: !!item.value, enabled: item.enabled != 0, isHover: 0 };

        // LABEL: Button
        const btn = textLabel("", { width: _g.iconColumnWidth, height: _g.itemHeight, textColor: _s.button.iconColor });
        btn.round = _s.field.round;
        btn.clickable = 1;
        btn.cursor = "pointer";
        btn.css = { outline: "none", transition: "background-color 0.12s" };
        btn.tabIndex = 0;
        btn.role = "button";
        btn.aria = { label: item.hint || item.key };
        if (item.hint) btn.elem.title = item.hint;

        // WHY: The icon (innerHTML) is only written when the value changes, not on every hover.
        const paintIcon = function () {
            btn.text = getIcon((isToggle && state.value && item.iconActive) ? item.iconActive : item.icon, 16);
            if (isToggle) btn.aria = { pressed: (state.value) ? "true" : "false" };
        };

        const paintColors = function () {
            const isActive = isToggle && state.value && useAccent;
            if (isActive) btn.color = _s.button.activeColor;
            else if (state.isHover && state.enabled) btn.color = _s.button.hoverColor;
            else btn.color = "transparent";
            btn.textColor = ink(state.enabled, (isActive) ? _s.button.activeIconColor : _s.button.iconColor);
        };

        const press = function () {
            if (!state.enabled) return;
            if (!isToggle) {
                sendAction(ctrl, item.value);
                return;
            }
            state.value = !state.value;
            paintIcon();
            paintColors();
            changeValue(ctrl, state.value);
        };

        const setValue = function (v) {
            state.value = !!v;
            paintIcon();
            paintColors();
        };

        const setEnabled = function (enabled) {
            state.enabled = !!enabled;
            btn.cursor = (state.enabled) ? "pointer" : "default";
            paintColors();
        };

        onHover(btn, function (isHover) {
            state.isHover = isHover;
            paintColors();
        });
        btn.on("click", press);
        onActivateKey(btn, press);

        paintIcon();
        paintColors();

        return { field: btn, setValue: setValue, setEnabled: setEnabled };

    };

    // ALIGN GRID: 3 x 3 places of the content. The chosen one is a filled square, the others empty squares.
    const ALIGN_COLUMNS = ["left", "center", "right"];
    const ALIGN_ROWS = ["top", "center", "bottom"];

    // "center" -> "center center", "top left" -> "left top" (basic.js takes both orders).
    const normalizeAlign = function (value) {
        const words = String(value || "").trim().split(/\s+/);
        if (words.length === 1) words.push("center");
        // WHY: "center" is in both lists: only top / bottom and left / right tell the order.
        const isVerticalFirst = /^(top|bottom)$/.test(words[0]) || /^(left|right)$/.test(words[1]);
        return (isVerticalFirst) ? words[1] + " " + words[0] : words[0] + " " + words[1];
    };

    const buildAlignGrid = function (ctrl) {

        const item = ctrl.item;
        const ga = _s.alignGrid;
        const SIZE = _g.itemHeight * 2 + _g.rowGap; // As high as two rows
        const CELL = Math.floor(SIZE / 3); // The click area of one place
        const MARK = 8; // The square in it
        let value = normalizeAlign(item.value);
        let enabled = item.enabled != 0;
        const cells = []; // { area, mark, align, isHover }

        const paintCell = function (cell) {
            const isSelected = (cell.align === value);
            const lineColor = (cell.isHover && enabled) ? ga.hoverColor : ga.cellColor;
            cell.mark.color = (isSelected) ? ink(enabled, ga.selectedColor) : "transparent";
            setBorder(cell.mark, (isSelected) ? "" : lineColor);
            cell.area.aria = { checked: (isSelected) ? "true" : "false" };
        };
        const paint = function () { cells.forEach(paintCell); };

        // BOX: Grid
        const grid = startBox({ width: SIZE, height: SIZE, color: _s.field.color, round: _s.field.round });
        grid.shrink = 0;
        grid.role = "radiogroup";
        grid.aria = { label: item.hint || item.label || item.key };
        const offset = Math.floor((SIZE - CELL * 3) / 2);

            ALIGN_ROWS.forEach(function (vertical, row) {
                ALIGN_COLUMNS.forEach(function (horizontal, column) {
                    const align = horizontal + " " + vertical;

                    // BOX: The click area of a place
                    const area = startBox({ left: offset + column * CELL, top: offset + row * CELL, width: CELL, height: CELL, color: "transparent" });
                    area.clickable = 1;
                    area.cursor = "pointer";
                    area.tabIndex = 0;
                    area.role = "radio";
                    area.aria = { label: align };
                    area.css = { outline: "none" };
                    area.elem.title = align;

                        // BOX: The square
                        const mark = Box({ width: MARK, height: MARK, color: "transparent", round: 2 });
                        mark.center();
                        mark.css = { transition: "background-color 0.12s" };

                    endBox();

                    const cell = { area: area, mark: mark, align: align, isHover: 0 };
                    cells.push(cell);

                    const press = function () {
                        if (!enabled) return;
                        value = align;
                        paint();
                        changeValue(ctrl, value);
                    };
                    onHover(area, function (isHover) {
                        cell.isHover = isHover;
                        paintCell(cell);
                    });
                    area.on("click", press);
                    onActivateKey(area, press);
                });
            });

        endBox();

        paint();

        return {
            field: grid,
            setValue: function (v) { value = normalizeAlign(v); paint(); },
            setEnabled: function (e) { enabled = !!e; paint(); },
        };

    };

    // *** COLOR (the color item and its picker):
    // A value is a CSS color text: "#3871E0", "rgba(56, 113, 224, 0.5)", "transparent", "var(--color-primary)".
    // The field shows it as a base (the color without its opacity) and an opacity: [■ #3871E0 | 50%].

    const HEX_TEXT = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
    const WRITTEN_AS_NUMBERS = /^(#|rgb|hsl)/i;
    const ALPHA_MIX = /^color-mix\(in srgb,\s*(.+)\s+([\d.]+)%,\s*transparent\)$/i; // What Alpha() makes of a token
    const CHECKER = "repeating-conic-gradient(#BBBBBB 0% 25%, #FFFFFF 0% 50%) 0 0 / 6px 6px";
    const ALPHA_INPUT_WIDTH = 46;
    const PICKER_SPACE = 8; // Between the panel and the color picker

    // A CSS color -> { r, g, b, a }, read by a canvas. null: this page can not read it (Ex: an unknown token).
    const readColor = function (color) {
        if (!readColor.context) readColor.context = document.createElement("canvas").getContext("2d");
        const context = readColor.context;
        // WHY: A wrong color leaves the old fillStyle: two different starts tell a wrong color apart.
        context.fillStyle = "#000000";
        context.fillStyle = String(color || "");
        const read = context.fillStyle;
        context.fillStyle = "#FFFFFF";
        context.fillStyle = String(color || "");
        if (read !== context.fillStyle) return null;
        if (read.charAt(0) === "#") {
            return { r: parseInt(read.slice(1, 3), 16), g: parseInt(read.slice(3, 5), 16), b: parseInt(read.slice(5, 7), 16), a: 1 };
        }
        const parts = read.match(/[\d.]+/g);
        return { r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]), a: (parts[3] !== undefined) ? Number(parts[3]) : 1 };
    };

    const toHex = function (rgb) {
        const digits = [rgb.r, rgb.g, rgb.b].map(function (n) {
            return ("0" + Math.round(n).toString(16)).slice(-2);
        });
        return "#" + digits.join("").toUpperCase();
    };

    const roundAlpha = function (alpha) {
        return Math.round(basic.clamp(alpha, 0, 1) * 100) / 100;
    };

    // A value -> { base, alpha }. "rgba(0, 0, 0, 0.5)" -> "#000000", 0.5. Alpha("var(--x)", 0.5) -> "var(--x)", 0.5
    const splitAlpha = function (value) {
        const text = String((value === undefined || value === null) ? "" : value).trim();
        if (!text) return { base: "", alpha: 1 };
        const mix = text.match(ALPHA_MIX);
        if (mix) return { base: mix[1].trim(), alpha: Number(mix[2]) / 100 };
        const rgb = readColor(text);
        if (rgb && WRITTEN_AS_NUMBERS.test(text)) return { base: toHex(rgb), alpha: rgb.a };
        return { base: text, alpha: (rgb) ? rgb.a : 1 };
    };

    // The opposite of splitAlpha: a base and an opacity -> one value.
    const joinAlpha = function (base, alpha) {
        alpha = roundAlpha(alpha);
        if (alpha >= 1) return base;
        const rgb = readColor(base);
        if (!rgb) return Alpha(base, alpha); // A token: color-mix() keeps it a token
        return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + ")";
    };

    // A typed text -> a value. Hex digits keep the opacity of the color ("3871e0" -> "#3871E0"); any other text is used as it is.
    const colorOfText = function (typed, alpha) {
        if (!HEX_TEXT.test(typed)) return typed;
        return joinAlpha("#" + typed.replace("#", "").toUpperCase(), alpha);
    };

    const rgbToHsv = function (rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        const max = Math.max(r, g, b);
        const range = max - Math.min(r, g, b);
        let hue = 0;
        if (range && max === r) hue = ((g - b) / range) % 6;
        else if (range && max === g) hue = (b - r) / range + 2;
        else if (range) hue = (r - g) / range + 4;
        return { h: (hue * 60 + 360) % 360, s: (max) ? range / max : 0, v: max };
    };

    const hsvToRgb = function (hsv) {
        const part = function (n) {
            const k = (n + hsv.h / 60) % 6;
            return Math.round((hsv.v - hsv.v * hsv.s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
        };
        return { r: part(5), g: part(3), b: part(1) };
    };

    // *** COLOR PALETTES: the color groups of the picker (the palettes param, and the presets of an item).

    let paletteCache = null; // WHY: palettes may be a function (the colors of a page): read once per setData / picker.
    let lastPaletteKey = "";
    let colorFormat = "hex"; // The text of the color picker: "hex", "rgb", "hsl"
    const COLOR_FORMATS = ["hex", "rgb", "hsl"];
    const RECENT_COLOR_COUNT = 9; // One row of the picker

    const loadRecentColors = function () {
        if (!box.recentColorsKey) return [];
        const saved = basic.storage.load(box.recentColorsKey);
        return (Array.isArray(saved)) ? saved : [];
    };
    let recentColors = loadRecentColors();

    const rememberColor = function (value) {
        if (!value) return;
        recentColors = [value].concat(recentColors.filter(function (v) { return v !== value; })).slice(0, RECENT_COLOR_COUNT);
        if (box.recentColorsKey) basic.storage.save(box.recentColorsKey, recentColors);
    };

    const toPreset = function (preset) {
        if (preset && typeof preset === "object") return preset;
        return { value: preset, color: preset, hint: preset };
    };

    const readPalettes = function () {
        const source = (typeof box.palettes === "function") ? box.palettes(box) : box.palettes;
        paletteCache = (Array.isArray(source)) ? source : [];
        return paletteCache;
    };

    // The palettes of an item: its presets (old item setting) first, then the palettes of the panel.
    const palettesOf = function (item, isFresh) {
        const shared = (isFresh || !paletteCache) ? readPalettes() : paletteCache;
        const list = shared.map(function (palette) {
            return Object.assign({}, palette, { colors: (palette.colors || []).map(toPreset) });
        });
        const presets = (Array.isArray(item.presets)) ? item.presets.filter(function (p) { return p !== "|"; }) : [];
        if (presets.length) list.unshift({ key: "__presets", name: "Presets", colors: presets.map(toPreset) });
        return list;
    };

    // The color to paint for a base: a token (var(--color-primary)) is painted with the color of its preset.
    const paintColorOf = function (item, value) {
        const parts = splitAlpha(value);
        if (!parts.base) return "transparent";
        let color = parts.base;
        palettesOf(item).forEach(function (palette) {
            palette.colors.forEach(function (preset) {
                if (preset.value === parts.base && preset.color) color = preset.color;
            });
        });
        return joinAlpha(color, parts.alpha);
    };

    // A square that shows a color over a checkerboard (a transparent color shows the checkerboard).
    const paintChecker = function (obj, color) {
        obj.css.background = "linear-gradient(" + color + ", " + color + "), " + CHECKER;
    };

    // *** COLOR INPUTS: the color text and its opacity (%). Used by the color field and by the picker.

    // INPUT: Opacity (%), at the end of a field made by buildInputField.
    const addAlphaInput = function (field, state, hint) {
        return createIn(field, function () {
            // BOX: Line between the color and its opacity
            const line = Box({ width: 1, height: 14, color: _ps.dividerColor });
            line.shrink = 0;
            line.clickable = 0;
            const alphaInput = Input({ width: ALPHA_INPUT_WIDTH, height: _g.itemHeight, minimal: 1, fontSize: _t.fontSize, textColor: _t.color });
            alphaInput.shrink = 0;
            const alphaEl = alphaInput.inputElement;
            Object.assign(alphaEl.style, {
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                padding: "0px 8px 0px 6px",
                backgroundColor: "transparent",
                border: "0px",
                color: _t.color,
                fontSize: _t.fontSize + "px",
            });
            alphaEl.setAttribute("spellcheck", "false");
            alphaEl.setAttribute("aria-label", hint + " opacity (%)");
            alphaEl.addEventListener("focus", function () {
                state.isFocus = 1;
                paintField(field, state);
                alphaInput.select();
            });
            alphaEl.addEventListener("blur", function () {
                state.isFocus = 0;
                paintField(field, state);
            });
            return alphaInput;
        });
    };

    const rgbToHsl = function (rgb) {
        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;
        const range = max - min;
        const saturation = (range) ? range / (1 - Math.abs(2 * lightness - 1)) : 0;
        return { h: Math.round(rgbToHsv(rgb).h), s: Math.round(saturation * 100), l: Math.round(lightness * 100) };
    };

    // The text of a base in a format: "#3871E0" -> "56, 113, 224" (rgb) or "220, 74%, 55%" (hsl). A token stays as it is.
    const formatBase = function (base, format) {
        if (format === "hex" || base.charAt(0) !== "#") return base;
        const rgb = readColor(base);
        if (format === "rgb") return rgb.r + ", " + rgb.g + ", " + rgb.b;
        const hsl = rgbToHsl(rgb);
        return hsl.h + ", " + hsl.s + "%, " + hsl.l + "%";
    };

    const NUMBERS_OF_THREE = /^\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*[, ]\s*([\d.]+)%?\s*$/;

    // "56, 113, 224" (rgb) or "220, 74, 55" (hsl) -> "#3871E0". null: it is not three numbers.
    const hexOfNumbers = function (typed, format) {
        const match = typed.match(NUMBERS_OF_THREE);
        if (!match || format === "hex") return null;
        const text = (format === "rgb") ? "rgb(" + match[1] + ", " + match[2] + ", " + match[3] + ")" : "hsl(" + match[1] + ", " + match[2] + "%, " + match[3] + "%)";
        const rgb = readColor(text);
        return (rgb) ? toHex(rgb) : null;
    };

    const showColorInputs = function (input, alphaInput, value, format = "hex") {
        const parts = splitAlpha(value);
        input.text = formatBase(parts.base, format);
        alphaInput.text = (parts.base) ? Math.round(parts.alpha * 100) + "%" : "";
    };

    // api: { getValue(), commit(value), refresh(), getFormat() (optional, "hex" when not given) }
    // (refresh: show the current value again)
    const connectColorInputs = function (input, alphaInput, api) {

        const el = input.inputElement;
        const alphaEl = alphaInput.inputElement;
        const formatOf = function () {
            return (api.getFormat) ? api.getFormat() : "hex";
        };

        const commitText = function () {
            const parts = splitAlpha(api.getValue());
            const typed = String(input.text).trim();
            if (typed === formatBase(parts.base, formatOf())) return;
            const hex = hexOfNumbers(typed, formatOf());
            api.commit((hex) ? joinAlpha(hex, parts.alpha) : colorOfText(typed, parts.alpha));
        };

        const commitAlpha = function (percent) {
            const parts = splitAlpha(api.getValue());
            if (!parts.base || isNaN(percent)) {
                api.refresh();
                return;
            }
            api.commit(joinAlpha(parts.base, basic.clamp(percent, 0, 100) / 100));
        };

        const percentOfInput = function () {
            return parseFloat(String(alphaInput.text).replace(",", "."));
        };

        el.addEventListener("blur", commitText);
        el.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                el.blur();
            } else if (event.key === "Escape") {
                event.preventDefault();
                api.refresh();
                el.blur();
            }
        });

        alphaEl.addEventListener("blur", function () { commitAlpha(percentOfInput()); });
        alphaEl.addEventListener("keydown", function (event) {
            const isArrow = (event.key === "ArrowUp" || event.key === "ArrowDown");
            if (isArrow) {
                event.preventDefault();
                const direction = (event.key === "ArrowUp") ? 1 : -1;
                const step = (event.shiftKey) ? SHIFT_STEP_FACTOR : 1;
                commitAlpha(Math.round(Math.round(splitAlpha(api.getValue()).alpha * 100) + direction * step));
                alphaInput.select();
            } else if (event.key === "Enter") {
                event.preventDefault();
                alphaEl.blur();
            } else if (event.key === "Escape") {
                event.preventDefault();
                api.refresh();
                alphaEl.blur();
            }
        });

    };

    // *** COLOR PICKER: a popup at the left of the panel (it uses the menu slot: one popup at a time).
    // [ saturation / brightness area ]
    // [eyedropper] [hue      ]
    //              [opacity  ]
    // [ #3871E0          | 100% ]
    // [ Used on this page ⌄    + ]  the palette list, then its colors

    const openColorPicker = function (ctrl, colorField) {

        const isOpenByThisOpener = (menu && menu.opener === colorField.opener);
        closeMenu();
        if (isOpenByThisOpener) return;

        const cp = _s.colorPicker;
        const ms = _s.menu;
        const item = ctrl.item;
        const hint = item.hint || item.label || item.key;
        const contentWidth = cp.width - cp.padding * 2;
        const hasEyeDropper = (typeof window.EyeDropper === "function");
        const sliderWidth = contentWidth - ((hasEyeDropper) ? _g.itemHeight + _g.gap : 0);
        let palettes = palettesOf(item, 1);
        let isPaletteListOpen = 0;
        let paletteArea = null;
        let swatchViews = [];
        let hsv = { h: 0, s: 0, v: 0 };
        let alpha = 1;
        let obj = null;
        let area = null;
        let areaHandle = null;
        let hueSlider = null;
        let alphaSlider = null;
        let hexInput = null;
        let alphaInput = null;
        let formatButton = null;
        let previewNow = null;
        let recentViews = [];
        const valueAtOpen = colorField.getValue();

        // STATE <-> VALUE

        const rgbOfState = function () {
            return hsvToRgb(hsv);
        };

        const valueOfState = function () {
            return joinAlpha(toHex(rgbOfState()), alpha);
        };

        // WHY: The hue of a gray (or black) can not be read from its color: the old hue stays.
        const readState = function () {
            const parts = splitAlpha(colorField.getValue());
            const rgb = readColor(paintColorOf(item, parts.base)) || { r: 0, g: 0, b: 0 };
            const next = rgbToHsv(rgb);
            if (next.s === 0 || next.v === 0) next.h = hsv.h;
            hsv = next;
            alpha = (parts.base) ? parts.alpha : 1;
        };

        const commitState = function () {
            colorField.commit(valueOfState());
            paintPicker();
        };

        const commitValue = function (value) {
            colorField.commit(value);
            readState();
            paintPicker();
        };

        // PAINT

        const placeThumb = function (slider, ratio) {
            slider.thumb.css.left = Math.round(ratio * (slider.width - cp.sliderHeight)) + "px";
        };

        const paintPicker = function () {
            const rgb = rgbOfState();
            const solid = "rgb(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ")";
            area.color = "hsl(" + Math.round(hsv.h) + ", 100%, 50%)";
            areaHandle.css.left = Math.round(hsv.s * contentWidth - cp.handleSize / 2) + "px";
            areaHandle.css.top = Math.round((1 - hsv.v) * cp.areaHeight - cp.handleSize / 2) + "px";
            areaHandle.color = solid;
            placeThumb(hueSlider, hsv.h / 360);
            hueSlider.thumb.color = "hsl(" + Math.round(hsv.h) + ", 100%, 50%)";
            alphaSlider.css.background = "linear-gradient(to right, rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", 0), " + solid + "), " + CHECKER;
            placeThumb(alphaSlider, alpha);
            paintChecker(alphaSlider.thumb, "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + ")");
            hueSlider.aria = { valuenow: Math.round(hsv.h) };
            alphaSlider.aria = { valuenow: Math.round(alpha * 100) };
            area.aria = { valuetext: "Saturation " + Math.round(hsv.s * 100) + "%, brightness " + Math.round(hsv.v * 100) + "%" };
            showColorInputs(hexInput, alphaInput, colorField.getValue(), colorFormat);
            formatButton.text = colorFormat.toUpperCase();
            paintChecker(previewNow, paintColorOf(item, colorField.getValue()));
            paintSelectedSwatch();
        };

        const paintSelectedSwatch = function () {
            const value = colorField.getValue();
            swatchViews.concat(recentViews).forEach(function (view) {
                const isSelected = PropertyPanel.isSameValue(view.value, value);
                view.obj.boxShadow = (isSelected) ? "0 0 0 2px " + ms.color + ", 0 0 0 3px " + _s.accent.color : "inset 0 0 0 1px " + _s.swatch.borderColor;
            });
        };

        // DRAG: pointer down on a target, then moves until it is up. fn(ratioX, ratioY)
        const dragOn = function (target, fn) {
            const moveTo = function (event) {
                const rect = target.elem.getBoundingClientRect();
                fn(basic.clamp((event.clientX - rect.left) / rect.width, 0, 1), basic.clamp((event.clientY - rect.top) / rect.height, 0, 1));
            };
            target.elem.addEventListener("pointerdown", function (event) {
                event.preventDefault();
                target.elem.focus();
                target.elem.setPointerCapture(event.pointerId);
                moveTo(event);
                const onMove = function (moveEvent) { moveTo(moveEvent); };
                const onUp = function () {
                    target.elem.removeEventListener("pointermove", onMove);
                    target.elem.removeEventListener("pointerup", onUp);
                    target.elem.removeEventListener("pointercancel", onUp);
                };
                target.elem.addEventListener("pointermove", onMove);
                target.elem.addEventListener("pointerup", onUp);
                target.elem.addEventListener("pointercancel", onUp);
            });
        };

        // keys: { ArrowLeft: fn(step), ... } step is 1, or 10 with Shift.
        const onArrowKeys = function (target, keys) {
            target.on("keydown", function (self, event) {
                const fn = keys[event.key];
                if (!fn) return;
                event.preventDefault();
                fn((event.shiftKey) ? SHIFT_STEP_FACTOR : 1);
                commitState();
            });
        };

        // VIEW

        // BOX: A slider (hue or opacity) with a round thumb. ariaMax: the range a screen reader reads.
        const buildSlider = function (label, ariaMax) {
            const slider = startBox({ width: sliderWidth, height: cp.sliderHeight, round: cp.sliderHeight / 2, color: "transparent" });
            slider.css = { position: "relative", left: "0px", top: "0px" };
            slider.clipContent = 0;
            slider.clickable = 1;
            slider.cursor = "pointer";
            slider.tabIndex = 0;
            slider.role = "slider";
            slider.aria = { label: hint + " " + label, valuemin: 0, valuemax: ariaMax };
            slider.setFocusRing(_s.accent.color);
                slider.thumb = Box({ left: 0, top: 0, width: cp.sliderHeight, height: cp.sliderHeight, round: cp.sliderHeight / 2, color: "transparent" });
                slider.thumb.boxShadow = "0 0 0 2px #FFFFFF, 0 0 0 3px rgba(0, 0, 0, 0.35)";
                slider.thumb.clickable = 0;
            endBox();
            slider.shrink = 0;
            return slider;
        };

        const buildPaletteHeader = function (palette) {
            // GROUP: The name of the palette (opens the list of palettes) and the add button
            HGroup({ width: contentWidth, height: _g.itemHeight, align: "left center", gap: 4, color: "transparent" });
                const btnList = HGroup({ width: 10, height: _g.itemHeight, align: "left center", gap: 2, padding: [6, 0], round: _s.field.round, color: "transparent" });
                btnList.grow = 1;
                btnList.css = { minWidth: "0px" };
                btnList.clickable = 1;
                btnList.cursor = "pointer";
                btnList.tabIndex = 0;
                btnList.role = "button";
                btnList.aria = { label: "Color group: " + ((palette) ? palette.name : "none"), expanded: (isPaletteListOpen) ? "true" : "false" };
                btnList.elem.title = "Choose a color group";
                    textLabel("", { flex: 1, height: _g.itemHeight, bold: 1, plainText: (palette) ? palette.name : "No colors" });
                    textLabel(getIcon((isPaletteListOpen) ? "chevronUp" : "chevronDown", 14), { width: 16, height: _g.itemHeight, textColor: _t.softColor });
                endGroup();
                onHover(btnList, function (isHover) { btnList.color = (isHover) ? _s.button.hoverColor : "transparent"; });
                const togglePaletteList = function () {
                    isPaletteListOpen = (isPaletteListOpen) ? 0 : 1;
                    drawPaletteArea();
                };
                btnList.on("click", togglePaletteList);
                onActivateKey(btnList, togglePaletteList);

                if (palette && palette.canAdd && !isPaletteListOpen) {
                    const btnAdd = textLabel(getIcon("plus", 14), { width: _g.itemHeight, height: _g.itemHeight, textColor: _s.button.iconColor });
                    btnAdd.round = _s.field.round;
                    btnAdd.clickable = 1;
                    btnAdd.cursor = "pointer";
                    btnAdd.tabIndex = 0;
                    btnAdd.role = "button";
                    btnAdd.aria = { label: "Add this color to " + palette.name };
                    btnAdd.elem.title = "Add this color to " + palette.name;
                    onHover(btnAdd, function (isHover) { btnAdd.color = (isHover) ? _s.button.hoverColor : "transparent"; });
                    btnAdd.on("click", function () { addColorTo(palette); });
                    onActivateKey(btnAdd, function () { addColorTo(palette); });
                }
            endGroup();
        };

        const buildPaletteList = function (current) {
            palettes.forEach(function (palette) {
                const isSelected = (palette === current);
                // GROUP: A palette in the list
                const row = HGroup({ width: contentWidth, height: ms.rowHeight, align: "left center", gap: 0, round: _s.field.round, color: "transparent" });
                row.shrink = 0;
                row.clickable = 1;
                row.cursor = "pointer";
                row.tabIndex = 0;
                row.role = "option";
                row.aria = { selected: (isSelected) ? "true" : "false" };
                    textLabel((isSelected) ? getIcon("check", 14) : "", { width: 24, height: ms.rowHeight });
                    textLabel("", { flex: 1, height: ms.rowHeight, plainText: palette.name });
                    textLabel("", { height: ms.rowHeight, textColor: _t.softColor, plainText: String(palette.colors.length) });
                endGroup();
                row.css.paddingRight = "6px";
                const choose = function () {
                    lastPaletteKey = palette.key;
                    isPaletteListOpen = 0;
                    drawPaletteArea();
                };
                onHover(row, function (isHover) { row.color = (isHover) ? _s.button.hoverColor : "transparent"; });
                row.on("click", choose);
                onActivateKey(row, choose);
            });
        };

        // BOX: A color of a palette. A click gives its value. Returns { obj, value } (for the selected ring).
        const buildSwatch = function (preset) {
            const square = Box({ width: cp.swatchSize, height: cp.swatchSize, round: 4, color: "transparent" });
            square.shrink = 0;
            paintChecker(square, preset.color || preset.value);
            square.clickable = 1;
            square.cursor = "pointer";
            square.role = "button";
            square.tabIndex = 0;
            square.aria = { label: preset.hint || preset.value };
            square.elem.title = preset.hint || preset.value;
            square.css.transition = "transform 0.1s";
            onHover(square, function (isHover) { square.css.transform = (isHover) ? "scale(1.12)" : ""; });
            square.on("click", function () { commitValue(preset.value); });
            onActivateKey(square, function () { commitValue(preset.value); });
            return { obj: square, value: preset.value };
        };

        // GROUP: The recent colors (only when there are some)
        const buildRecentColors = function () {
            if (!recentColors.length) return;
            const caption = textLabel("", { fontSize: _t.captionSize, textColor: _t.softColor, plainText: "Recent" });
            caption.css.paddingLeft = "6px";
            const row = HGroup({ width: contentWidth, height: "auto", align: "left center", gap: cp.swatchGap, color: "transparent" });
            row.css = { padding: "3px", boxSizing: "border-box" };
            row.clipContent = 0;
                recentViews = recentColors.map(function (value) {
                    return buildSwatch({ value: value, color: paintColorOf(item, value), hint: value });
                });
            endGroup();
        };

        const buildSwatches = function (palette) {
            swatchViews = [];
            if (!palette.colors.length) {
                const lblEmpty = textLabel("", { textColor: _t.softColor, plainText: palette.emptyText || "No colors yet." });
                lblEmpty.css = { whiteSpace: "normal", lineHeight: "16px", padding: "2px 6px" };
                return;
            }
            // GROUP: The colors of the palette (scrolls when there are many)
            const grid = HGroup({ width: contentWidth, height: "auto", align: "left top", gap: cp.swatchGap, wrap: 1, color: "transparent" });
            grid.css = { maxHeight: cp.swatchesMaxHeight + "px", overflowY: "auto", padding: "3px", boxSizing: "border-box" };
            grid.clickable = 1;
                palette.colors.forEach(function (preset) {
                    swatchViews.push(buildSwatch(preset));
                });
            endGroup();
        };

        // The palette part is drawn again when an other palette is chosen or a color is added.
        const drawPaletteArea = function () {
            if (paletteArea) paletteArea.remove();
            const current = palettes.find(function (p) { return p.key === lastPaletteKey; }) || palettes[0];
            paletteArea = createIn(obj, function () {
                // GROUP: Palettes
                const group = VGroup({ width: contentWidth, height: "auto", align: "left top", gap: 6, color: "transparent" });
                group.shrink = 0;
                    buildPaletteHeader(current);
                    if (isPaletteListOpen) buildPaletteList(current);
                    else if (current) buildSwatches(current);
                endGroup();
                return group;
            });
            paintSelectedSwatch();
            placePicker();
        };

        const addColorTo = function (palette) {
            const value = colorField.getValue();
            if (!value) return;
            const isThere = palette.colors.some(function (preset) { return PropertyPanel.isSameValue(preset.value, value); });
            if (!isThere) {
                dispatch({ kind: "addColor", key: palette.key, value: value, oldValue: undefined, item: item, sectionKey: ctrl.sectionKey });
            }
            palettes = palettesOf(item, 1);
            const fresh = palettes.find(function (p) { return p.key === palette.key; });
            // WHY: A static palette (not a function) is not changed by the listener: the panel adds it.
            if (fresh && !fresh.colors.some(function (preset) { return PropertyPanel.isSameValue(preset.value, value); })) {
                const shared = (paletteCache || []).find(function (p) { return p.key === palette.key; });
                if (shared) {
                    shared.colors = (shared.colors || []).concat([value]);
                    palettes = palettesOf(item);
                }
            }
            drawPaletteArea();
        };

        // GROUP: The color before the picker opened (a click goes back to it) and the color now.
        const PREVIEW_WIDTH = 32;
        const buildPreview = function () {
            const preview = HGroup({ width: PREVIEW_WIDTH, height: _g.itemHeight, align: "left top", gap: 0, round: _s.field.round, color: "transparent" });
            preview.shrink = 0;
            preview.boxShadow = "inset 0 0 0 1px " + _s.swatch.borderColor;
                const before = Box({ width: PREVIEW_WIDTH / 2, height: _g.itemHeight, color: "transparent" });
                paintChecker(before, paintColorOf(item, valueAtOpen));
                before.clickable = 1;
                before.cursor = "pointer";
                before.role = "button";
                before.tabIndex = 0;
                before.aria = { label: "Back to the color before: " + (valueAtOpen || "none") };
                before.elem.title = "Before: " + (valueAtOpen || "none") + " (click to go back)";
                before.on("click", function () { commitValue(valueAtOpen); });
                onActivateKey(before, function () { commitValue(valueAtOpen); });
                previewNow = Box({ width: PREVIEW_WIDTH / 2, height: _g.itemHeight, color: "transparent" });
                previewNow.clickable = 0;
            endGroup();
        };

        // LABEL: The format of the color text (a click: HEX -> RGB -> HSL)
        const buildFormatButton = function () {
            const btn = textLabel("HEX", { width: 34, height: _g.itemHeight, fontSize: 10, textColor: _t.softColor });
            btn.clickable = 1;
            btn.cursor = "pointer";
            btn.tabIndex = 0;
            btn.role = "button";
            btn.aria = { label: "Color format (HEX, RGB, HSL)" };
            btn.elem.title = "Change the format: HEX, RGB, HSL";
            const nextFormat = function () {
                colorFormat = COLOR_FORMATS[(COLOR_FORMATS.indexOf(colorFormat) + 1) % COLOR_FORMATS.length];
                paintPicker();
            };
            onHover(btn, function (isHover) { btn.textColor = (isHover) ? _t.color : _t.softColor; });
            btn.on("click", nextFormat);
            onActivateKey(btn, nextFormat);
            return btn;
        };

        // At the left of the panel, at the height of the field. Under the field when there is no space at the left.
        const placePicker = function () {
            const fieldRect = colorField.anchor.elem.getBoundingClientRect();
            const panelRect = box.elem.getBoundingClientRect();
            const height = obj.elem.offsetHeight;
            let left = panelRect.left - cp.width - PICKER_SPACE;
            let top = fieldRect.top;
            if (left < SCREEN_MARGIN) {
                left = Math.min(fieldRect.left, window.innerWidth - cp.width - SCREEN_MARGIN);
                top = fieldRect.bottom + MENU_OFFSET;
            }
            obj.left = Math.max(SCREEN_MARGIN, left);
            obj.top = Math.max(SCREEN_MARGIN, Math.min(top, window.innerHeight - height - SCREEN_MARGIN));
        };

        createIn(page, function () {

            // GROUP: Color picker
            obj = VGroup({ left: 0, top: 0, width: cp.width, height: "auto", align: "left top", gap: 10, padding: cp.padding, color: ms.color, round: ms.round });
            obj.boxShadow = "0 0 0 1px " + ms.borderColor + ", " + ms.shadow;
            obj.zIndex = MENU_Z_INDEX;
            obj.css = { boxSizing: "border-box" };
            obj.clipContent = 0;
            obj.clickable = 1;
            obj.role = "dialog";
            obj.aria = { label: hint + " color" };

                // GROUP: Title and close
                HGroup({ width: contentWidth, height: _g.itemHeight, align: "left center", gap: 4, color: "transparent" });
                    textLabel("", { flex: 1, bold: 1, plainText: hint });
                    const btnClose = textLabel(getIcon("close", 14), { width: _g.itemHeight, height: _g.itemHeight, textColor: _t.softColor });
                    btnClose.round = _s.field.round;
                    btnClose.clickable = 1;
                    btnClose.cursor = "pointer";
                    btnClose.tabIndex = 0;
                    btnClose.role = "button";
                    btnClose.aria = { label: "Close (Escape)" };
                    btnClose.elem.title = "Close (Escape)";
                    onHover(btnClose, function (isHover) { btnClose.color = (isHover) ? _s.button.hoverColor : "transparent"; });
                    btnClose.on("click", closeMenu);
                    onActivateKey(btnClose, closeMenu);
                endGroup();

                // BOX: Saturation (left to right) and brightness (bottom to top) of the hue
                area = startBox({ width: contentWidth, height: cp.areaHeight, round: 4, color: "transparent" });
                area.css = { position: "relative", left: "0px", top: "0px", backgroundImage: "linear-gradient(to top, #000000, transparent), linear-gradient(to right, #FFFFFF, transparent)" };
                area.shrink = 0;
                area.clipContent = 0;
                area.clickable = 1;
                area.cursor = "crosshair";
                area.tabIndex = 0;
                area.role = "slider";
                area.aria = { label: hint + " saturation and brightness" };
                area.setFocusRing(_s.accent.color);
                    areaHandle = Box({ left: 0, top: 0, width: cp.handleSize, height: cp.handleSize, round: cp.handleSize / 2, color: "transparent" });
                    areaHandle.boxShadow = "0 0 0 2px #FFFFFF, 0 0 0 3px rgba(0, 0, 0, 0.35)";
                    areaHandle.clickable = 0;
                endBox();

                // GROUP: The eyedropper and the hue and opacity sliders
                // WHY: clipContent 0: the rings of the thumbs are bigger than the sliders.
                const sliderRow = HGroup({ width: contentWidth, height: "auto", align: "left center", gap: _g.gap, color: "transparent" });
                sliderRow.clipContent = 0;
                    if (hasEyeDropper) {
                        const btnDropper = textLabel(getIcon("eyedropper", 16), { width: _g.itemHeight, height: _g.itemHeight, textColor: _s.button.iconColor });
                        btnDropper.round = _s.field.round;
                        btnDropper.clickable = 1;
                        btnDropper.cursor = "pointer";
                        btnDropper.tabIndex = 0;
                        btnDropper.role = "button";
                        btnDropper.aria = { label: "Pick a color from the screen" };
                        btnDropper.elem.title = "Pick a color from the screen";
                        onHover(btnDropper, function (isHover) { btnDropper.color = (isHover) ? _s.button.hoverColor : "transparent"; });
                        const pickFromScreen = function () {
                            new window.EyeDropper().open().then(function (result) {
                                if (!obj || obj._isRemoved) return;
                                commitValue(joinAlpha(result.sRGBHex.toUpperCase(), alpha));
                            }).catch(function () { }); // Escape: nothing was picked
                        };
                        btnDropper.on("click", pickFromScreen);
                        onActivateKey(btnDropper, pickFromScreen);
                    }
                    // GROUP: Sliders
                    const sliders = VGroup({ width: sliderWidth, height: "auto", align: "left top", gap: 10, color: "transparent" });
                    sliders.clipContent = 0;
                        hueSlider = buildSlider("hue", 360);
                        hueSlider.css.background = "linear-gradient(to right, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FF0000)";
                        alphaSlider = buildSlider("opacity", 100);
                    endGroup();
                endGroup();

                // GROUP: Before / now, the format, the color text and its opacity
                HGroup({ width: contentWidth, height: _g.itemHeight, align: "left center", gap: 6, color: "transparent" });
                    buildPreview();
                    const inputs = buildInputField({ key: "hex", hint: hint }, contentWidth - PREVIEW_WIDTH - 6);
                    inputs.el.style.paddingLeft = "4px";
                    hexInput = inputs.input;
                    alphaInput = addAlphaInput(inputs.field, inputs.state, hint);
                    formatButton = createIn(inputs.field, buildFormatButton);
                    inputs.field.elem.insertBefore(formatButton.elem, inputs.field.elem.firstChild);
                endGroup();

                buildRecentColors();

                // BOX: Line
                const line = Box({ width: contentWidth, height: 1, color: ms.borderColor });
                line.shrink = 0;

            endGroup();

        });

        menu = {
            obj: obj,
            opener: colorField.opener,
            ctrl: ctrl,
            sync: function () {
                readState();
                paintPicker();
            },
            onClose: function () {
                const value = colorField.getValue();
                if (value !== valueAtOpen) rememberColor(value);
            },
        };

        dragOn(area, function (x, y) {
            hsv.s = x;
            hsv.v = 1 - y;
            commitState();
        });
        dragOn(hueSlider, function (x) {
            hsv.h = Math.min(x * 360, 359.9);
            commitState();
        });
        dragOn(alphaSlider, function (x) {
            alpha = roundAlpha(x);
            commitState();
        });
        onArrowKeys(area, {
            ArrowLeft: function (step) { hsv.s = basic.clamp(hsv.s - step / 100, 0, 1); },
            ArrowRight: function (step) { hsv.s = basic.clamp(hsv.s + step / 100, 0, 1); },
            ArrowUp: function (step) { hsv.v = basic.clamp(hsv.v + step / 100, 0, 1); },
            ArrowDown: function (step) { hsv.v = basic.clamp(hsv.v - step / 100, 0, 1); },
        });
        onArrowKeys(hueSlider, {
            ArrowLeft: function (step) { hsv.h = basic.clamp(hsv.h - step, 0, 359.9); },
            ArrowRight: function (step) { hsv.h = basic.clamp(hsv.h + step, 0, 359.9); },
        });
        onArrowKeys(alphaSlider, {
            ArrowLeft: function (step) { alpha = roundAlpha(alpha - step / 100); },
            ArrowRight: function (step) { alpha = roundAlpha(alpha + step / 100); },
        });
        connectColorInputs(hexInput, alphaInput, {
            getValue: colorField.getValue,
            commit: commitValue,
            refresh: paintPicker,
            getFormat: function () { return colorFormat; },
        });

        readState();
        paintPicker();
        drawPaletteArea();
        area.elem.focus({ preventScroll: true });

    };

    // FIELD: color. [■ #3871E0 | 100%] A click on the swatch opens the color picker.
    const buildColorField = function (ctrl) {

        const item = ctrl.item;
        const sw = _s.swatch;
        const hint = item.hint || item.label || item.key;
        const { field, input, el, state, setEnabled } = buildInputField(item, getSpanWidth(item.span));
        if (item.placeholder) input.placeholder = item.placeholder;
        el.style.paddingLeft = "4px";
        let value = "";

        // BOX: Swatch (a checkerboard under the color: a transparent color shows it). A button: it opens the picker.
        const swatchArea = createIn(field, function () {
            const area = startBox({ width: sw.size + 12, height: _g.itemHeight, color: "transparent" });
            area.shrink = 0;
            area.clickable = 1;
            area.cursor = "pointer";
            area.role = "button";
            area.tabIndex = 0;
            area.aria = { label: "Open the color picker of " + hint, haspopup: "dialog" };
            area.elem.title = "Open the color picker";
                area.fill = Box({ width: sw.size, height: sw.size, round: 3, color: "transparent" });
                area.fill.center();
                area.fill.clickable = 0;
            endBox();
            return area;
        });
        field.elem.insertBefore(swatchArea.elem, field.elem.firstChild);
        const alphaInput = addAlphaInput(field, state, hint);

        const paint = function () {
            const isEmpty = (splitAlpha(value).base === "");
            paintChecker(swatchArea.fill, paintColorOf(item, value));
            setBorder(swatchArea.fill, (isEmpty) ? sw.emptyColor : sw.borderColor);
            showColorInputs(input, alphaInput, value);
        };

        const setValue = function (v) {
            value = (v === undefined || v === null) ? "" : String(v);
            paint();
            if (menu && menu.ctrl === ctrl) menu.sync();
        };

        const commit = function (next) {
            value = String(next);
            paint();
            changeValue(ctrl, value);
        };

        const colorField = {
            anchor: field,
            opener: swatchArea,
            getValue: function () { return value; },
            commit: commit,
        };
        const openPicker = function () {
            if (!state.enabled) return;
            openColorPicker(ctrl, colorField);
        };
        swatchArea.on("click", openPicker);
        onActivateKey(swatchArea, openPicker);

        connectColorInputs(input, alphaInput, {
            getValue: colorField.getValue,
            commit: commit,
            refresh: paint,
        });

        setValue(item.value);
        return {
            field: field,
            setValue: setValue,
            setEnabled: function (enabled) {
                setEnabled(enabled);
                alphaInput.inputElement.disabled = !enabled;
                alphaInput.inputElement.style.color = ink(enabled, _t.color);
                swatchArea.opacity = (enabled) ? 1 : 0.5;
            },
        };

    };

    // *** ITEM TYPES:
    // Each one creates its object in the current container and returns { field, setValue(v), setEnabled(e) }.
    // ctrl.item is the working copy of the JSON item. changeValue(ctrl, v) keeps the value and sends the change.
    // An optional .normalize(value) fills the missing parts of a value (used before the value is kept).

    const ITEM_TYPES = {

        // [X  396]  prefix / icon, unit, min, max, step, precision, autoText ("Auto" when the value is null)
        number: function (ctrl) {
            return buildNumberInput(ctrl, getSpanWidth(ctrl.item.span));
        },

        // [ text ]  placeholder
        // A text of more lines. caption: the first line of the placeholder, so it goes away while writing. rows: the lines (2).
        textarea: function (ctrl) {
            const item = ctrl.item;
            const ta = _s.textarea;
            const rows = item.rows || 2;
            const state = { isHover: 0, isFocus: 0, enabled: item.enabled != 0 };

            // GROUP: Field (the caption, the text)
            const field = VGroup({ width: getSpanWidth(item.span || "full"), height: "auto", align: "left top", gap: 2, padding: [8, 6], color: _s.field.color, round: _s.field.round });
            field.shrink = 0;
            field.css = { boxSizing: "border-box", transition: "box-shadow 0.12s", alignItems: "stretch" };
            const paint = function () { paintField(field, state); };

            endGroup();

            // TEXTAREA: a raw element (a basic.js Input is one line)
            const area = document.createElement("textarea");
            area.rows = rows;
            area.spellcheck = false;
            const placeholderLines = [item.caption, item.placeholder].filter(Boolean);
            area.placeholder = placeholderLines.join("\n");
            area.setAttribute("aria-label", item.caption || item.hint || item.label || item.key);
            Object.assign(area.style, {
                width: "100%",
                boxSizing: "border-box",
                padding: "0px",
                border: "0px",
                outline: "none",
                resize: "none",
                background: "transparent",
                color: _t.color,
                font: _t.fontSize + "px " + ta.fontFamily,
                lineHeight: ta.lineHeight + "px",
                pointerEvents: "auto",
                userSelect: "text",
            });
            field.elem.appendChild(area);

            const setValue = function (v) { area.value = (v === undefined || v === null) ? "" : String(v); };
            const save = function () { changeValue(ctrl, area.value); };
            onHover(field, function (isHover) {
                state.isHover = isHover;
                paint();
            });
            area.addEventListener("focus", function () {
                state.isFocus = 1;
                paint();
            });
            area.addEventListener("blur", function () {
                state.isFocus = 0;
                paint();
                save();
            });
            area.addEventListener("keydown", function (event) {
                event.stopPropagation(); // WHY: The keys of a text are not shortcuts of the page.
                const isSave = event.key === "Enter" && (event.metaKey || event.ctrlKey);
                if (isSave) {
                    event.preventDefault();
                    area.blur();
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    setValue(ctrl.item.value);
                    area.blur();
                }
            });

            setValue(item.value);
            paint();
            return {
                field: field,
                setValue: setValue,
                setEnabled: function (enabled) {
                    state.enabled = !!enabled;
                    area.disabled = !state.enabled;
                    paint();
                },
            };
        },

        text: function (ctrl) {
            const item = ctrl.item;
            const { field, input, el, setEnabled } = buildInputField(item, getSpanWidth(item.span));
            if (item.placeholder) input.placeholder = item.placeholder;
            const setValue = function (v) { input.text = (v === undefined || v === null) ? "" : String(v); };
            el.addEventListener("blur", function () { changeValue(ctrl, String(input.text)); });
            el.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    el.blur();
                } else if (event.key === "Escape") {
                    event.preventDefault();
                    setValue(ctrl.item.value);
                    el.blur();
                }
            });
            setValue(item.value);
            return { field: field, setValue: setValue, setEnabled: setEnabled };
        },

        // [ Left ⌄]  options: ["A", "B"] or [{ value, text, icon }], icon, look: "plain"
        select: function (ctrl) {
            return buildSelect(ctrl.item, getSpanWidth(ctrl.item.span), function (v) { changeValue(ctrl, v); });
        },

        // [16 | ⌄]  a number field and preset values (options)
        combo: function (ctrl) {
            const item = ctrl.item;
            const width = getSpanWidth(item.span);
            const arrowWidth = 22;
            const r = _s.field.round + "px";
            let enabled = item.enabled != 0;

            // GROUP: Number field + menu button
            const group = HGroup({ width: width, height: _g.itemHeight, align: "left center", gap: 1, color: "transparent" });
            group.shrink = 0;

                const numberInput = buildNumberInput(ctrl, width - arrowWidth - 1);
                numberInput.field.css.borderRadius = r + " 0px 0px " + r;

                // LABEL: Menu button
                const btnArrow = textLabel(getIcon("chevronDown", 12), { width: arrowWidth, height: _g.itemHeight, textColor: _t.softColor });
                btnArrow.color = _s.field.color;
                btnArrow.clickable = 1;
                btnArrow.cursor = "pointer";
                btnArrow.css.borderRadius = "0px " + r + " " + r + " 0px";

            endGroup();

            const options = normalizeOptions(item.options);
            onHover(btnArrow, function (isHover) {
                btnArrow.color = (isHover && enabled) ? _s.segmented.hoverColor : _s.field.color;
            });
            btnArrow.on("click", function () {
                if (!enabled) return;
                openMenu(group, btnArrow, options, ctrl.item.value, function (picked) {
                    numberInput.setValue(picked);
                    changeValue(ctrl, picked);
                });
            });

            const setEnabled = function (e) {
                enabled = !!e;
                numberInput.setEnabled(e);
                btnArrow.textColor = ink(enabled, _t.softColor);
            };

            return { field: group, setValue: numberInput.setValue, setEnabled: setEnabled };
        },

        // [≡|≡|≡]  options: [{ value, icon, text, hint }]. value !== undefined -> one is selected.
        segmented: function (ctrl) {
            const item = ctrl.item;
            const options = normalizeOptions(item.options);
            const isSelect = (item.mode) ? (item.mode === "select") : (item.value !== undefined);
            const r = _s.field.round + "px";
            let value = item.value;
            let enabled = item.enabled != 0;
            const parts = []; // { seg, option, isHover }

            // One segment: background, border, icon color.
            const paintPart = function (part) {
                const isSelected = isSelect && PropertyPanel.isSameValue(part.option.value, value);
                const seg = part.seg;
                if (isSelected) seg.color = _s.segmented.selectedColor;
                else if (part.isHover && enabled) seg.color = _s.segmented.hoverColor;
                else seg.color = (isSelect) ? "transparent" : _s.field.color;
                setBorder(seg, (isSelected) ? _s.segmented.selectedBorderColor : "");
                seg.textColor = ink(enabled, (isSelect && !isSelected) ? _t.softColor : _s.button.iconColor);
                if (isSelect) seg.aria = { checked: (isSelected) ? "true" : "false" };
            };
            const paint = function () { parts.forEach(paintPart); };

            // Select: every segment is round. Actions: only the outer corners of the row.
            const radiusOf = function (index) {
                if (isSelect) return r;
                if (index === 0) return r + " 0 0 " + r;
                if (index === options.length - 1) return "0 " + r + " " + r + " 0";
                return "0";
            };

            // GROUP: Segments
            const group = HGroup({
                width: getSpanWidth(item.span),
                height: _g.itemHeight,
                align: "left center",
                gap: (isSelect) ? 0 : 1,
                color: (isSelect) ? _s.field.color : "transparent",
                round: _s.field.round,
            });
            group.shrink = 0;
            group.role = (isSelect) ? "radiogroup" : "group";
            group.aria = { label: item.hint || item.label || item.key };

                options.forEach(function (option, index) {
                    // LABEL: Segment
                    const segHtml = (option.icon) ? getIcon(option.icon, 16) : basic.escapeHtml(option.text);
                    const seg = textLabel(segHtml, { width: 10, height: _g.itemHeight, textColor: _s.button.iconColor });
                    seg.grow = 1;
                    seg.shrink = 1;
                    seg.cursor = "pointer";
                    seg.clickable = 1;
                    seg.css = {
                        flexBasis: "0px",
                        outline: "none",
                        transition: "background-color 0.12s",
                        borderRadius: radiusOf(index),
                    };
                    seg.tabIndex = 0;
                    seg.role = (isSelect) ? "radio" : "button";
                    seg.aria = { label: option.hint || option.text };
                    if (option.hint) seg.elem.title = option.hint;

                    const part = { seg: seg, option: option, isHover: 0 };
                    parts.push(part);

                    const press = function () {
                        if (!enabled) return;
                        if (!isSelect) {
                            sendAction(ctrl, option.value);
                            return;
                        }
                        value = option.value;
                        paint();
                        changeValue(ctrl, value);
                    };
                    onHover(seg, function (isHover) {
                        part.isHover = isHover;
                        paintPart(part);
                    });
                    seg.on("click", press);
                    onActivateKey(seg, press);
                });

            endGroup();

            paint();

            return {
                field: group,
                setValue: function (v) { value = v; paint(); },
                setEnabled: function (e) { enabled = !!e; paint(); },
            };
        },

        // [◎]  icon, iconActive, toggle: 1 (value true / false), accent: 0 (no blue look when on)
        iconButton: buildIconButton,

        alignGrid: buildAlignGrid,

        color: buildColorField,

        // Horizontal / vertical selects at the left and the constraints diagram at the right.
        // value: { horizontal: "left" | "right" | "leftRight" | "center" | "scale", vertical: "top" | "bottom" | "topBottom" | "center" | "scale" }
        constraints: function (ctrl) {
            const item = ctrl.item;
            let value = item.value; // Normalized: always has horizontal and vertical.
            let enabled = item.enabled != 0;
            const H_OPTIONS = [
                { value: "left", text: "Left" },
                { value: "right", text: "Right" },
                { value: "leftRight", text: "Left and right" },
                { value: "center", text: "Center" },
                { value: "scale", text: "Scale" },
            ];
            const V_OPTIONS = [
                { value: "top", text: "Top" },
                { value: "bottom", text: "Bottom" },
                { value: "topBottom", text: "Top and bottom" },
                { value: "center", text: "Center" },
                { value: "scale", text: "Scale" },
            ];
            const W = _g.columnWidth;
            const H = _g.itemHeight * 2 + _g.rowGap;

            const change = function (next) {
                value = Object.assign({}, value, next);
                paint();
                changeValue(ctrl, value);
            };

            // GROUP: Selects + diagram
            const group = HGroup({ width: getSpanWidth(2), height: H, align: "left top", gap: _g.gap, color: "transparent" });
            group.shrink = 0;

                // GROUP: Selects
                VGroup({ width: W, height: H, align: "left top", gap: _g.rowGap, color: "transparent" });
                that.shrink = 0;
                    const selH = buildSelect(
                        { key: item.key + "-h", hint: "Horizontal constraint", icon: "constraintH", options: H_OPTIONS, value: value.horizontal },
                        W, function (v) { change({ horizontal: v }); });
                    const selV = buildSelect(
                        { key: item.key + "-v", hint: "Vertical constraint", icon: "constraintV", options: V_OPTIONS, value: value.vertical },
                        W, function (v) { change({ vertical: v }); });
                endGroup();

                // BOX: Diagram
                const diagram = startBox({ width: W, height: H, color: _s.field.color, round: _s.field.round });
                diagram.shrink = 0;

                    const cx = Math.round(W / 2);
                    const cy = Math.round(H / 2);
                    // Inner frame
                    const iw = 34;
                    const ih = 22;
                    const ix = cx - iw / 2;
                    const iy = cy - ih / 2;

                    // BOX: Inner frame
                    const frame = Box({ left: ix, top: iy, width: iw, height: ih, color: "transparent", round: 3 });
                    setBorder(frame, _s.constraints.frameColor);

                    const line = function (left, top, width, height) {
                        const obj = Box({ left: left, top: top, width: width, height: height, color: _t.disabledColor, round: 1 });
                        obj.clickable = 0;
                        return obj;
                    };
                    const lines = {
                        top: line(cx - 1, iy - 13, 2, 9),
                        bottom: line(cx - 1, iy + ih + 4, 2, 9),
                        left: line(ix - 17, cy - 1, 13, 2),
                        right: line(ix + iw + 4, cy - 1, 13, 2),
                        centerH: line(cx - 6, cy, 12, 1),
                        centerV: line(cx, cy - 6, 1, 12),
                    };

                    // Click areas (bigger than the lines). Shift + click: both sides.
                    const hitArea = function (left, top, width, height, onClick) {
                        const obj = Box({ left: left, top: top, width: width, height: height, color: "transparent" });
                        obj.clickable = 1;
                        obj.cursor = "pointer";
                        obj.on("click", function (self, event) {
                            if (enabled) onClick(event.shiftKey);
                        });
                        return obj;
                    };
                    hitArea(cx - 10, 0, 20, iy - 2, function (shift) { change({ vertical: (shift && value.vertical === "bottom") ? "topBottom" : "top" }); });
                    hitArea(cx - 10, iy + ih + 2, 20, H - iy - ih - 2, function (shift) { change({ vertical: (shift && value.vertical === "top") ? "topBottom" : "bottom" }); });
                    hitArea(0, cy - 8, ix - 2, 16, function (shift) { change({ horizontal: (shift && value.horizontal === "right") ? "leftRight" : "left" }); });
                    hitArea(ix + iw + 2, cy - 8, W - ix - iw - 2, 16, function (shift) { change({ horizontal: (shift && value.horizontal === "left") ? "leftRight" : "right" }); });
                    hitArea(ix + 2, iy + 2, iw - 4, ih - 4, function () { change({ horizontal: "center", vertical: "center" }); });

                endBox();

            endGroup();

            const paint = function () {
                const h = value.horizontal;
                const v = value.vertical;
                // Side lines: accent when on, gray when off. Center lines: accent when on, soft when off.
                const side = function (obj, isOn) { obj.color = (isOn) ? ink(enabled, _s.accent.color) : _t.disabledColor; };
                side(lines.top, v === "top" || v === "topBottom");
                side(lines.bottom, v === "bottom" || v === "topBottom");
                side(lines.left, h === "left" || h === "leftRight");
                side(lines.right, h === "right" || h === "leftRight");
                lines.centerH.color = (h === "center" && enabled) ? _s.accent.color : _t.softColor;
                lines.centerV.color = (v === "center" && enabled) ? _s.accent.color : _t.softColor;
                selH.setValue(h);
                selV.setValue(v);
            };

            paint();

            return {
                field: group,
                setValue: function (v) { value = v; paint(); },
                setEnabled: function (e) {
                    enabled = !!e;
                    selH.setEnabled(e);
                    selV.setEnabled(e);
                    paint();
                },
            };
        },

    };

    ITEM_TYPES.constraints.normalize = function (value) {
        return Object.assign({ horizontal: "left", vertical: "top" }, value || {});
    };

    // *** VIEW BUILDERS:

    // Builds an item with its type and registers it by its key. Returns its controller (or null).
    const registerItem = function (item, sectionKey) {
        const builder = ITEM_TYPES[item.type];
        if (!builder) {
            console.warn("PropertyPanel: Unknown item type: " + item.type);
            return null;
        }
        item.value = normalizeValue(item, item.value);
        const ctrl = { item: item, sectionKey: sectionKey };
        Object.assign(ctrl, builder(ctrl));
        if (item.key !== undefined) {
            if (controllers[item.key]) console.warn("PropertyPanel: Same key twice: " + item.key);
            controllers[item.key] = ctrl;
        }
        return ctrl;
    };

    // item.visible: 0 hides the cell of the item (or the object itself when it has no cell).
    const applyVisible = function (ctrl) {
        if (!ctrl) return;
        const isHidden = (ctrl.item.visible === 0 || ctrl.item.visible === false);
        const obj = ctrl.cell || ctrl.field;
        obj.visible = (isHidden) ? 0 : 1;
    };

    // One item of a row: the caption (if the row has one) and its object.
    const buildItem = function (item, sectionKey, hasCaption) {

        // GROUP: Cell (as wide as its object)
        const cell = VGroup({ hug: 1, align: "left top", gap: 6, color: "transparent" });
        cell.shrink = 0;

            if (hasCaption) {
                const caption = textLabel("", { fontSize: _t.captionSize, textColor: _t.softColor, height: 16, plainText: item.label || "" });
                // WHY: A long caption must not make the cell wider than its object: it takes the width of the cell.
                caption.css = { width: "0px", minWidth: "100%" };
            }

            const ctrl = registerItem(item, sectionKey);

        endGroup();

        if (ctrl) {
            ctrl.cell = cell;
            applyVisible(ctrl);
        }

    };

    // Title + actions row (the panel title or a section title). Returns the title label.
    const buildTitleRow = function (text, actions, sectionKey, isMainTitle) {
        let lbl = null;
        HGroup({ width: "100%", height: (isMainTitle) ? 32 : 24, align: "left center", gap: 2, color: "transparent" });
            lbl = textLabel("", { fontSize: (isMainTitle) ? _t.titleSize : _t.sectionTitleSize, bold: 1, flex: 1, height: 24, plainText: text || "" });
            (actions || []).forEach(function (action) {
                applyVisible(registerItem(Object.assign({ type: "iconButton", accent: 0 }, action), sectionKey));
            });
        endGroup();
        return lbl;
    };

    const buildSection = function (section, isTitleBlock) {

        // GROUP: Section
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _g.rowGap, color: "transparent" });
        group.shrink = 0;
        group.css = {
            padding: (isTitleBlock ? "8px " : "12px ") + _ps.paddingRight + "px " + (isTitleBlock ? "8px " : "16px ") + _ps.paddingLeft + "px",
            boxSizing: "border-box",
            borderBottom: "1px solid " + _ps.dividerColor,
        };

            // WHY: A section without a title and actions (Ex: a footer with a note) gets no empty title row.
            const hasTitleRow = isTitleBlock || !!section.title || (section.actions && section.actions.length > 0);
            const lbl = (hasTitleRow) ? buildTitleRow(section.title, section.actions, section.key, isTitleBlock) : null;
            if (isTitleBlock) titleLabel = lbl;

            (section.items || []).forEach(function (row) {
                const items = (Array.isArray(row)) ? row : [row];
                const hasCaption = items.some(function (item) { return !!item.label; });
                // GROUP: Row
                HGroup({ width: "100%", height: "auto", align: "left bottom", gap: _g.gap, color: "transparent" });
                    items.forEach(function (item) { buildItem(item, section.key, hasCaption); });
                endGroup();
            });

        endGroup();

        if (section.visible === 0 || section.visible === false) group.visible = 0;
        return group;

    };

    const paintTab = function (key) {
        const isActive = (key === box.data.activeTab);
        const lbl = tabLabels[key];
        lbl.color = (isActive) ? _s.field.color : "transparent";
        lbl.textColor = (isActive) ? _t.color : _t.softColor;
        lbl.bold = isActive;
        lbl.aria = { selected: (isActive) ? "true" : "false" };
    };

    const paintTabs = function () {
        Object.keys(tabLabels).forEach(paintTab);
    };

    // Tabs and the item at the right of the header (Ex: zoom).
    const buildHeader = function () {

        const data = box.data;
        if (box.headerRow) box.headerRow.remove();
        tabLabels = {};

        createIn(box.header, function () {

            // GROUP: Tabs row (created again by setData)
            box.headerRow = HGroup({ width: "100%", height: "100%", align: "left center", gap: 2, color: "transparent" });

                // LABEL: The name (headerTitle). It takes the free room and ends with "..." when it is long.
                if (data.headerTitle !== undefined) {
                    box.lblHeaderTitle = textLabel("", { flex: 1, bold: 1, fontSize: _t.titleSize, plainText: data.headerTitle });
                    box.lblHeaderTitle.css.paddingLeft = "6px";
                }

                (data.tabs || []).forEach(function (tab) {
                    // LABEL: Tab
                    const lbl = textLabel("", { height: 28, plainText: tab.text || tab.key });
                    lbl.round = _s.field.round;
                    lbl.clickable = 1;
                    lbl.cursor = "pointer";
                    lbl.css = { padding: "0px 10px", outline: "none" };
                    lbl.tabIndex = 0;
                    lbl.role = "tab";
                    tabLabels[tab.key] = lbl;
                    const select = function () { box.setActiveTab(tab.key); };
                    lbl.on("click", select);
                    onActivateKey(lbl, select);
                    onHover(lbl, function (isHover) {
                        if (isHover && data.activeTab !== tab.key) lbl.textColor = _t.color;
                        else paintTab(tab.key);
                    });
                });

                // BOX: Space (the name takes the free room when there is one)
                if (data.headerTitle === undefined) {
                    const space = Box({ width: 10, height: 1, color: "transparent" });
                    space.grow = 1;
                }

                if (data.headerItem) {
                    data.headerItem = Object.assign({ type: "select", look: "plain" }, data.headerItem);
                    applyVisible(registerItem(data.headerItem, "header"));
                }

            endGroup();

        });

        paintTabs();

    };

    // Title block and sections (in the scrolling box).
    const buildContent = function () {

        if (box.content) box.content.remove();
        titleLabel = null;
        const data = box.data;

        if (data.empty) {
            box.content = createIn(box.scrollBox, function () { return buildEmptyPage(data.empty); });
            return;
        }

        createIn(box.scrollBox, function () {
            // GROUP: Content
            box.content = VGroup({ left: 0, top: 0, width: "100%", height: "auto", align: "left top", gap: 0, color: "transparent" });
                if (data.title !== undefined || (data.titleActions && data.titleActions.length)) {
                    buildSection({ key: "title", title: data.title, actions: data.titleActions }, 1);
                }
                (data.sections || []).forEach(function (section) { buildSection(section, 0); });
            endGroup();
        });

    };

    // EMPTY PAGE: data.empty = { icon, title, text, hints: [{ keys, text }] }, in the middle of the panel.
    // (Ex: nothing is selected.) It takes the place of the sections.
    const EMPTY_TEXT_WIDTH = 184;
    const EMPTY_ICON_BOX = 56;
    const EMPTY_LIFT = 48; // WHY: A little above the middle looks centered (the optical middle).

    const buildEmptyPage = function (empty) {
        const es = _s.empty;
        // GROUP: Empty page
        const emptyPage = VGroup({ left: 0, top: 0, width: "100%", height: "100%", align: "center center", gap: 0, color: "transparent" });
        emptyPage.css = { padding: "24px " + _ps.paddingRight + "px " + (24 + EMPTY_LIFT) + "px " + _ps.paddingLeft + "px", boxSizing: "border-box" };

            if (empty.icon) {
                // LABEL: Icon in a soft square
                const icon = textLabel(getIcon(empty.icon, es.iconSize), { width: EMPTY_ICON_BOX, height: EMPTY_ICON_BOX, textColor: es.iconColor });
                icon.color = es.iconBoxColor;
                icon.round = es.iconBoxRound;
                icon.css.marginBottom = "16px";
            }

            if (empty.title) {
                const lblTitle = textLabel("", { bold: 1, fontSize: _t.titleSize + 1, plainText: empty.title });
                lblTitle.role = "heading";
                lblTitle.aria = { level: 2 };
                lblTitle.css.marginBottom = "6px";
            }

            if (empty.text) {
                const lblText = textLabel("", { textColor: _t.softColor, plainText: empty.text });
                lblText.width = EMPTY_TEXT_WIDTH;
                lblText.css = { display: "block", whiteSpace: "normal", textAlign: "center", lineHeight: "18px" };
            }

            if (empty.hints && empty.hints.length) {
                // GROUP: Hints (what it does at the left, its key at the right: like the shortcuts of a menu)
                const hints = VGroup({ width: getSpanWidth("full"), height: "auto", align: "left top", gap: 8, color: "transparent" });
                hints.css = { marginTop: "20px", paddingTop: "16px", borderTop: "1px solid " + _ps.dividerColor };
                    empty.hints.forEach(function (hint) {
                        // GROUP: A hint
                        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
                            textLabel("", { flex: 1, height: 20, fontSize: _t.captionSize, textColor: _t.softColor, plainText: hint.text });
                            const keys = textLabel("", { height: 20, fontSize: _t.captionSize, plainText: hint.keys });
                            keys.color = _s.field.color;
                            keys.round = 4;
                            keys.css = { padding: "0px 6px", minWidth: "20px", justifyContent: "center", boxSizing: "border-box" };
                        endGroup();
                    });
                endGroup();
            }

        endGroup();
        return emptyPage;
    };

    // FOOTER: data.footer, a section fixed at the bottom. The scrolling part ends above it.
    const FOOTER_SPACE = 10; // the space above and under the footer (the same: it fits its content)
    const buildFooter = function () {
        if (box.footerContent) box.footerContent.remove();
        box.footerContent = null;
        const footer = box.data.footer;
        box.footerBox.visible = (footer) ? 1 : 0;
        if (footer) {
            box.footerContent = createIn(box.footerBox, function () {
                const group = buildSection(Object.assign({ key: "footer" }, footer), 0);
                group.css.borderBottom = "none";
                group.css.padding = FOOTER_SPACE + "px " + _ps.paddingRight + "px " + FOOTER_SPACE + "px " + _ps.paddingLeft + "px";
                return group;
            });
        }
        placeScrollBox();
    };

    const placeScrollBox = function () {
        const footerHeight = (box.footerContent) ? box.footerBox.elem.offsetHeight : 0;
        box.scrollBox.height = "calc(100% - " + (_ps.headerHeight + footerHeight) + "px)";
    };

    // *** PUBLIC FUNCTIONS:

    // Builds the panel again from a JSON. (The JSON is copied: getData() returns the copy with the current values.)
    box.setData = function (data) {
        closeMenu();
        paletteCache = null;
        controllers = {};
        box.data = PropertyPanel.copyData(data || {});
        buildHeader();
        buildContent();
        buildFooter();
    };
    // USAGE: panel.setData({ title: "Rectangle", sections: [...] })

    // The JSON with the current values.
    box.getData = function () {
        return PropertyPanel.copyData(box.data);
    };

    // { key: value } of every item with a key and a value.
    box.getValues = function () {
        const values = {};
        Object.keys(controllers).forEach(function (key) {
            const value = controllers[key].item.value;
            if (value !== undefined) values[key] = PropertyPanel.copyValue(value);
        });
        return values;
    };

    box.getValue = function (key) {
        const ctrl = controllers[key];
        return (ctrl) ? PropertyPanel.copyValue(ctrl.item.value) : undefined;
    };

    // silent: 1 -> no change event. Returns 1 when the key was found.
    box.setValue = function (key, value, silent = 0) {
        const ctrl = controllers[key];
        if (!ctrl) {
            console.warn("PropertyPanel: No item with the key: " + key);
            return 0;
        }
        const next = normalizeValue(ctrl.item, PropertyPanel.copyValue(value));
        if (PropertyPanel.isSameValue(ctrl.item.value, next)) return 1; // WHY: No DOM write for the same value.
        ctrl.setValue(PropertyPanel.copyValue(next));
        changeValue(ctrl, next, silent);
        return 1;
    };
    // USAGE: panel.setValue("x", 120, 1)

    // Many values at once: { x: 10, y: 20 }
    box.setValues = function (values, silent = 0) {
        Object.keys(values || {}).forEach(function (key) { box.setValue(key, values[key], silent); });
    };

    box.setEnabled = function (key, enabled) {
        const ctrl = controllers[key];
        if (!ctrl) return 0;
        ctrl.item.enabled = basic.isOn(enabled) ? 1 : 0;
        ctrl.setEnabled(ctrl.item.enabled);
        return 1;
    };
    // USAGE: panel.setEnabled("w", 0)

    box.setItemVisible = function (key, visible) {
        const ctrl = controllers[key];
        if (!ctrl) return 0;
        ctrl.item.visible = basic.isOn(visible) ? 1 : 0;
        applyVisible(ctrl);
        return 1;
    };

    box.getItem = function (key) {
        const ctrl = controllers[key];
        return (ctrl) ? ctrl.item : null;
    };

    box.setTitle = function (text) {
        box.data.title = text;
        if (titleLabel) titleLabel.plainText = text || "";
        else buildContent(); // The title block did not exist.
    };

    // silent: 1 -> no change event.
    box.setActiveTab = function (key, silent = 0) {
        const oldValue = box.data.activeTab;
        box.data.activeTab = key;
        paintTabs();
        if (silent || oldValue === key) return;
        dispatch({ kind: "tab", key: key, value: key, oldValue: oldValue, item: null, sectionKey: "header" });
    };

    // Listens to every change. Returns a function that removes the listener.
    box.listen = function (fn) {
        listeners.push(fn);
        return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    };
    // USAGE: const stop = panel.listen(function (change) { println(change.key); }); stop();

    box.open = function () {
        box.opened = 1;
        box.css.transform = "translateX(0px)";
        box.aria = { hidden: "false" };
    };

    box.close = function () {
        closeMenu();
        box.opened = 0;
        box.css.transform = "translateX(100%)";
        box.aria = { hidden: "true" };
    };

    box.toggle = function () {
        if (basic.isOn(box.opened)) {
            box.close();
            return;
        }
        box.open();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        closeMenu();
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.boxShadow = "inset 1px 0 0 " + _ps.dividerColor;
    box.css.transition = "transform " + _ps.motion + " ease";
    box.role = "complementary";
    box.aria = { label: "Properties" };
    box.clickable = 1;

    // GROUP: Header (tabs)
    box.header = HGroup({ left: 0, top: 0, width: "100%", height: _ps.headerHeight, align: "left center", gap: 2, color: "transparent" });
    box.header.css = { padding: "0px " + _ps.paddingRight + "px 0px 10px", boxSizing: "border-box", borderBottom: "1px solid " + _ps.dividerColor };
    box.header.role = "tablist";
    endGroup();

    // BOX: Scrolling content
    box.scrollBox = Box({ left: 0, top: _ps.headerHeight, width: "100%", height: "calc(100% - " + _ps.headerHeight + "px)", color: "transparent", scrollY: 1 });

    // GROUP: Footer (data.footer, at the bottom)
    box.footerBox = VGroup({ left: 0, width: "100%", height: "auto", align: "left top", gap: 0, color: _ps.color });
    box.footerBox.css = { top: "auto", bottom: "0px", borderTop: "1px solid " + _ps.dividerColor, boxSizing: "border-box" };
    endGroup();
    box.footerBox.visible = 0;

    // *** OBJECT INIT CODE:

    // (listenTo / onPageResize: removed with the box)
    box.listenTo(document, "pointerdown", onDocumentPointerDown, true);
    box.listenTo(document, "keydown", onDocumentKeyDown);
    box.onPageResize(closeMenu);
    box.scrollBox.elem.addEventListener("scroll", closeMenu);
    box.footerBox.onResize(placeScrollBox); // WHY: The footer grows with its items (and with the fonts when they load).

    box.setData(startData);

    if (typeof ScrollBar !== "undefined") {
        ScrollBar({ scrollableBox: box.scrollBox, ..._s.scrollBar });
    }

    if (basic.isOn(box.opened)) box.open();
    else box.close();

    const panel = endObject(box);

    // WHY: The container was moved to the page above. The caller goes on with its own container.
    setDefaultContainerBox(previousContainer);

    return panel;

};

// *** STATIC FUNCTIONS:

// Values are numbers, texts, booleans or plain objects (constraints).
PropertyPanel.copyValue = function (value) {
    if (value !== null && typeof value === "object") return JSON.parse(JSON.stringify(value));
    return value;
};

PropertyPanel.isSameValue = function (a, b) {
    if (a === b) return true;
    if (a !== null && b !== null && typeof a === "object" && typeof b === "object") return JSON.stringify(a) === JSON.stringify(b);
    return false;
};

// Copies the JSON. Functions (Ex: item.onChange) are kept as they are.
PropertyPanel.copyData = function (data) {
    if (Array.isArray(data)) return data.map(PropertyPanel.copyData);
    if (data !== null && typeof data === "object") {
        const copy = {};
        Object.keys(data).forEach(function (key) { copy[key] = PropertyPanel.copyData(data[key]); });
        return copy;
    }
    return data;
};

// *** ICONS: 16 x 16 SVG paths (stroke). Use the name as "icon", or give a raw "<svg ...>" string.
// USAGE: PropertyPanel.icons.star = "M8 2l1.8 3.8 4.2.5-3.1 2.9.8 4.1L8 11.3 4.3 13.3l.8-4.1L2 6.3l4.2-.5z";
PropertyPanel.icons = {
    alignLeft: "M2.5 2.5v11M5 5.5h8M5 10.5h5",
    alignCenterH: "M8 2v12M4 5.5h8M5.5 10.5h5",
    alignRight: "M13.5 2.5v11M3 5.5h8M6 10.5h5",
    alignTop: "M2.5 2.5h11M5.5 5v8M10.5 5v5",
    alignCenterV: "M2 8h12M5.5 4v8M10.5 5.5v5",
    alignBottom: "M2.5 13.5h11M5.5 3v8M10.5 6v5",
    frame: "M3 4.5h10v7H3zM6 8h4M8 6v4",
    component: "M5 2.5l1.5 1.5L5 5.5 3.5 4zM11 2.5l1.5 1.5L11 5.5 9.5 4zM5 10.5l1.5 1.5L5 13.5 3.5 12zM11 10.5l1.5 1.5-1.5 1.5L9.5 12z",
    link: "M7 9l2-2M6.5 5.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M9.5 10.5l-1 1a2.5 2.5 0 01-3.5-3.5l1-1",
    target: "M8 2.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2.5 8h3M10.5 8h3M8 6.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z",
    more: "M3.5 7.2a.8.8 0 100 1.6.8.8 0 000-1.6zM8 7.2a.8.8 0 100 1.6.8.8 0 000-1.6zM12.5 7.2a.8.8 0 100 1.6.8.8 0 000-1.6z",
    constraintH: "M2.5 5v6M13.5 5v6M2.5 8h11",
    constraintV: "M5.5 2.5h5M5.5 13.5h5M8 2.5v11",
    angle: "M3 13h10M3 13V3M3 8.5A4.5 4.5 0 017.5 13",
    rotate: "M9.5 6.5l3 3-3 3-3-3zM3.5 9A5.5 5.5 0 0111 3.8M11 1.8v2.5H8.5",
    flipH: "M8 2v12M6 4.5L2.5 11.5H6zM10 4.5l3.5 7H10z",
    flipV: "M2 8h12M4.5 6l7-3.5V6zM4.5 10l7 3.5V10z",
    hugWidth: "M3 3v10M6 8h7M10.5 5.5L13 8l-2.5 2.5",
    fixedWidth: "M2.5 3v10M13.5 3v10M5.5 5.5h5M5.5 8h5M5.5 10.5h3",
    autoHeight: "M3.5 2.5h9a1 1 0 011 1v9a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1zM5.5 5.5h5M5.5 8h5M5.5 10.5h3",
    clip: "M3.5 2.5h9a1 1 0 011 1v9a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1zM9 13.5V9h4.5",
    eye: "M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8zM8 6a2 2 0 100 4 2 2 0 000-4z",
    eyeOff: "M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8zM8 6a2 2 0 100 4 2 2 0 000-4zM2.5 13.5l11-11",
    drop: "M8 2.5S4 7 4 9.5a4 4 0 008 0C12 7 8 2.5 8 2.5z",
    styles: "M5 3a2 2 0 100 4 2 2 0 000-4zM11 3a2 2 0 100 4 2 2 0 000-4zM5 9a2 2 0 100 4 2 2 0 000-4zM11 9a2 2 0 100 4 2 2 0 000-4z",
    opacity: "M3.5 2.5h9a1 1 0 011 1v9a1 1 0 01-1 1h-9a1 1 0 01-1-1v-9a1 1 0 011-1zM2.5 8h11M8 2.5v11",
    radius: "M2.5 6V4.5a2 2 0 012-2H6M10 2.5h1.5a2 2 0 012 2V6M13.5 10v1.5a2 2 0 01-2 2H10M6 13.5H4.5a2 2 0 01-2-2V10",
    textLeft: "M2.5 4h11M2.5 8h7M2.5 12h9",
    textCenter: "M2.5 4h11M4.5 8h7M3.5 12h9",
    textRight: "M2.5 4h11M6.5 8h7M4.5 12h9",
    textTop: "M3 2.5h10M8 13V6M5.5 8.5L8 6l2.5 2.5",
    textMiddle: "M3 8h10M8 2v3.5M6 3.5l2 2 2-2M8 14v-3.5M6 12.5l2-2 2 2",
    textBottom: "M3 13.5h10M8 3v7M5.5 7.5L8 10l2.5-2.5",
    lineHeight: "M3 2.5h10M3 13.5h10M5.5 11L8 5l2.5 6M6.4 9h3.2",
    letterSpacing: "M2.5 3v10M13.5 3v10M5.5 11L8 5l2.5 6M6.4 9h3.2",
    sliders: "M4 2.5v11M12 2.5v11M8 2.5v11M2.5 5.5h3M6.5 10.5h3M10.5 7h3",
    chevronDown: "M4.5 6.5L8 10l3.5-3.5",
    chevronUp: "M4.5 9.5L8 6l3.5 3.5",
    close: "M4 4l8 8M12 4l-8 8",
    pointer: "M4 2.5l8.5 5.2-3.7 1 2.1 3.9-1.7.9-2.1-3.9L4.3 12.2zM12 1.5v2M14.5 4h-2M13.8 2.2l-1.3 1.3",
    eyedropper: "M10.2 2.8a1.7 1.7 0 012.4 2.4l-1.4 1.4.7.7-1.1 1.1-3.3-3.3 1.1-1.1.7.7zM7.4 5.9L3 10.3V13h2.7l4.4-4.4",
    check: "M3.5 8.5l3 3 6-7",
    plus: "M8 3v10M3 8h10",
    minus: "M3 8h10",
    bold: "M5 3h3.8a2.4 2.4 0 0 1 0 4.8H5zM5 7.8h4.4a2.6 2.6 0 0 1 0 5.2H5z",
    italic: "M7 3h5M4 13h5M9.5 3l-3 10",
    flowHorizontal: "M2.5 8h11M10 4.5L13.5 8 10 11.5",
    flowVertical: "M8 2.5v11M4.5 10L8 13.5 11.5 10",
    wrap: "M2.5 4h11M2.5 8h9a2 2 0 0 1 0 4H8M9.5 10.5L8 12l1.5 1.5M2.5 12h3",
    ellipsis: "M2.5 8h.01M6 8h.01M9.5 8h.01M2.5 4.5h11M2.5 11.5h7",
};
