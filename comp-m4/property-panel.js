/* Bismillah */

/*

PropertyPanel - v26.09

UI COMPONENT TEMPLATE
- A property inspector at the right side of the screen, like the "Design" panel of design tools.
  Full height, 240 px wide (width), one dark style.
- Built from a JSON (data): header tabs, a title with action icons, and sections of items.
  footer: one more section, fixed at the bottom (out of the scrolling part). Ex: a note field.
  Each item has a type, a key, a value and its own settings. Every item type is a small object
  built by its own function (see *** ITEM TYPES):
    number     -> [X  396]  prefix text or icon (drag the prefix to change the value), unit, min, max, step, autoText
    text       -> [ name ]  a text field
    select     -> [ Left ⌄]  a menu of options, optional icon, look: "plain" (no background)
    combo      -> [16  | ⌄]  a number field and a menu of preset values
    segmented  -> [≡|≡|≡]  icon or text buttons. With a value: one is selected. Without: action buttons.
    iconButton -> [◎]  an action, or a toggle (toggle: 1, value true/false)
    constraints-> Horizontal and vertical selects and the constraints diagram. value: { horizontal, vertical }
    alignGrid  -> a 3x3 grid of the places of the content (the align of a group). value: "left top", "center"...
    color      -> [■ #3871E0]  a swatch and the color text. A click on the swatch opens the color picker.
                  presets: ["#FFFFFF", { value: "var(--color-primary)", color: "#3871E0", hint: "Primary" }, "|", ...]
                  -> small squares under the field, a click gives that value ("|" starts a new row).
- Items of a row: put them in an array. span: 1 (one column), 2 (two columns). An iconButton takes the
  small last column. label: the caption above the item.
- Listen to every change from outside: onChange(change, panel) or panel.listen(fn) (returns a remover).
  change = { kind: "value" | "action" | "tab", key, value, oldValue, item, sectionKey }
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
    data: {}, // tabs, activeTab, headerItem, title, titleActions, sections (See the USAGE above)
    opened: 1, // 1: Open at create time.
    onChange: function (change, self) { }, // Every change: { kind, key, value, oldValue, item, sectionKey }
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
        menu.obj.remove();
        menu = null;
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

    const onDocumentKeyDown = function (self, event) {
        if (menu && event.key === "Escape") closeMenu();
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
            return Number(v).toFixed(precision) + (item.unit || "");
        };

        const clamp = function (v) {
            const factor = Math.pow(10, precision);
            return Math.round(basic.clamp(v, min, max) * factor) / factor;
        };

        // Text -> value. undefined: not a number (the old value comes back).
        const parse = function (text) {
            text = String(text).trim();
            if (item.autoText && (text === "" || text.toLowerCase() === String(item.autoText).toLowerCase())) return null;
            const match = text.replace(",", ".").match(/-?\d*\.?\d+/);
            if (!match) return undefined;
            return clamp(parseFloat(match[0]));
        };

        const commit = function (next) {
            if (next !== undefined) value = next;
            input.text = format(value);
            if (next !== undefined) changeValue(ctrl, value);
        };

        el.addEventListener("focus", function () { input.select(); });
        el.addEventListener("blur", function () { commit(parse(input.text)); });
        const stepFactorOf = function (event) {
            return (event.shiftKey) ? SHIFT_STEP_FACTOR : 1;
        };

        const stepByArrow = function (event) {
            const base = parse(input.text);
            const start = (base === null || base === undefined) ? (Number(value) || 0) : base;
            const direction = (event.key === "ArrowUp") ? 1 : -1;
            commit(clamp(start + direction * step * stepFactorOf(event)));
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
                scrub = { id: event.pointerId, x: event.clientX, start: Number(value) || 0 };
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

    // COLOR: a swatch and the color text. The picker of the browser is over the swatch (an <input type="color">).
    // A canvas reads any CSS color: "tomato", "rgba(...)" -> "#rrggbb" (the picker takes only that form).
    const toHexColor = function (color) {
        if (!toHexColor.context) toHexColor.context = document.createElement("canvas").getContext("2d");
        const context = toHexColor.context;
        context.fillStyle = "#000000";
        context.fillStyle = String(color || "");
        const read = context.fillStyle;
        if (read.charAt(0) === "#") return read;
        const parts = read.match(/[\d.]+/g) || [0, 0, 0];
        return "#" + parts.slice(0, 3).map(function (n) { return ("0" + Math.round(Number(n)).toString(16)).slice(-2); }).join("");
    };

    // PRESETS: rows of small squares under a color field. preset: "#FFF" or { value, color (to paint), hint }.
    const PRESET_SIZE = 14;
    const PRESET_GAP = 4;

    const buildPresetRows = function (presets, width, onPick) {
        const rows = [[]];
        presets.forEach(function (preset) {
            if (preset === "|") rows.push([]);
            else rows[rows.length - 1].push((typeof preset === "object") ? preset : { value: preset, color: preset, hint: preset });
        });
        rows.filter(function (row) { return row.length; }).forEach(function (row) {
            // GROUP: A row of presets
            HGroup({ width: width, height: "auto", align: "left center", gap: PRESET_GAP, wrap: 1, color: "transparent" });
                row.forEach(function (preset) {
                    // BOX: A preset
                    const square = Box({ width: PRESET_SIZE, height: PRESET_SIZE, round: 3, color: preset.color || preset.value });
                    square.shrink = 0;
                    square.clickable = 1;
                    square.cursor = "pointer";
                    square.role = "button";
                    square.tabIndex = 0;
                    square.aria = { label: preset.hint || preset.value };
                    square.elem.title = preset.hint || preset.value;
                    setBorder(square, _s.swatch.borderColor);
                    square.on("click", function () { onPick(preset.value); });
                    onActivateKey(square, function () { onPick(preset.value); });
                });
            endGroup();
        });
    };

    const buildColorField = function (ctrl) {

        const item = ctrl.item;
        const sw = _s.swatch;
        const width = getSpanWidth(item.span);
        const hasPresets = Array.isArray(item.presets) && item.presets.length > 0;
        // GROUP: The field and its presets (only when there are presets)
        const holder = (hasPresets) ? VGroup({ width: width, height: "auto", align: "left top", gap: 6, color: "transparent" }) : null;
        if (holder) holder.shrink = 0;
        const { field, input, el, setEnabled } = buildInputField(item, width);
        if (item.placeholder) input.placeholder = item.placeholder;
        el.style.paddingLeft = "4px";

        // BOX: Swatch (a checkerboard under the color: a transparent color shows it)
        const swatchArea = createIn(field, function () {
            const area = startBox({ width: sw.size + 12, height: _g.itemHeight, color: "transparent" });
            area.shrink = 0;
                const chess = Box({ width: sw.size, height: sw.size, round: 3, color: "#FFFFFF" });
                chess.center();
                chess.css = { backgroundImage: "linear-gradient(45deg, #BBBBBB 25%, transparent 25%, transparent 75%, #BBBBBB 75%), linear-gradient(45deg, #BBBBBB 25%, transparent 25%, transparent 75%, #BBBBBB 75%)", backgroundSize: "6px 6px", backgroundPosition: "0 0, 3px 3px" };
                area.fill = Box({ width: sw.size, height: sw.size, round: 3, color: "transparent" });
                area.fill.center();
            endBox();
            return area;
        });
        field.elem.insertBefore(swatchArea.elem, field.elem.firstChild);

        // The picker: an invisible <input type="color"> over the swatch, so a click opens it.
        const picker = document.createElement("input");
        picker.type = "color";
        picker.setAttribute("aria-label", (item.hint || item.label || item.key) + " picker");
        Object.assign(picker.style, { position: "absolute", left: "0px", top: "0px", width: "100%", height: "100%", opacity: "0", cursor: "pointer", pointerEvents: "auto", border: "0px", padding: "0px" });
        swatchArea.elem.appendChild(picker);

        // A token (var(--color-primary)) is painted with the color of its preset: this page does not know the token.
        const colorOfValue = function (value) {
            const preset = (item.presets || []).find(function (p) { return p && typeof p === "object" && p.value === value; });
            return (preset && preset.color) ? preset.color : value;
        };

        const paintSwatch = function (color) {
            const isEmpty = !color || color === "transparent";
            swatchArea.fill.color = (isEmpty) ? "transparent" : colorOfValue(color);
            setBorder(swatchArea.fill, (isEmpty) ? sw.emptyColor : sw.borderColor);
            picker.value = toHexColor(color);
        };
        const setValue = function (v) {
            input.text = (v === undefined || v === null) ? "" : String(v);
            paintSwatch(input.text);
        };

        picker.addEventListener("input", function () {
            input.text = picker.value;
            paintSwatch(picker.value);
            changeValue(ctrl, picker.value);
        });
        el.addEventListener("blur", function () {
            paintSwatch(input.text);
            changeValue(ctrl, String(input.text));
        });
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

        if (holder) {
            buildPresetRows(item.presets, width, function (value) {
                setValue(value);
                changeValue(ctrl, value);
            });
            endGroup();
        }

        setValue(item.value);
        return {
            field: holder || field,
            setValue: setValue,
            setEnabled: function (enabled) {
                setEnabled(enabled);
                picker.disabled = !enabled;
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

            const lbl = buildTitleRow(section.title, section.actions, section.key, isTitleBlock);
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

                // BOX: Space
                const space = Box({ width: 10, height: 1, color: "transparent" });
                space.grow = 1;

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

    // FOOTER: data.footer, a section fixed at the bottom. The scrolling part ends above it.
    const buildFooter = function () {
        if (box.footerContent) box.footerContent.remove();
        box.footerContent = null;
        const footer = box.data.footer;
        box.footerBox.visible = (footer) ? 1 : 0;
        if (footer) {
            box.footerContent = createIn(box.footerBox, function () {
                const group = buildSection(Object.assign({ key: "footer" }, footer), 0);
                group.css.borderBottom = "none";
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
