/* Bismillah */

/*

PropertyPanel - v26.09

UI COMPONENT TEMPLATE
- A property inspector at the right side of the screen, like the "Design" panel of design tools.
  Full height, 240 px wide (width), one dark style.
- Built from a JSON (data): header tabs, a title with action icons, and sections of items.
  Each item has a type, a key, a value and its own settings. Every item type is a small object
  built by its own function (see *** ITEM TYPES):
    number     -> [X  396]  prefix text or icon (drag the prefix to change the value), unit, min, max, step, autoText
    text       -> [ name ]  a text field
    select     -> [ Left ⌄]  a menu of options, optional icon, look: "plain" (no background)
    combo      -> [16  | ⌄]  a number field and a menu of preset values
    segmented  -> [≡|≡|≡]  icon or text buttons. With a value: one is selected. Without: action buttons.
    iconButton -> [◎]  an action, or a toggle (toggle: 1, value true/false)
    constraints-> Horizontal and vertical selects and the constraints diagram. value: { horizontal, vertical }
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
            boldFontFamily: "opensans-bold",
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
    let controllers = {}; // key -> { item, sectionKey, setValue(), setEnabled() }
    let listeners = [];
    let tabLabels = {};
    let menu = null; // { obj, anchor }
    let lastClosedMenu = { anchor: null, time: 0 };

    // *** PUBLIC VARIABLES:
    // NOTE: Default values are also public variables. (box.data: the JSON with the current values)

    // *** PRIVATE FUNCTIONS:

    // SVG of an icon name (PropertyPanel.icons) or a raw "<svg" string.
    const getIcon = function (name, size = 16) {
        if (!name) return "";
        if (String(name).trim().indexOf("<svg") === 0) return name;
        const path = PropertyPanel.icons[name];
        if (!path) return PropertyPanel.escapeHtml(name); // Not an icon: shown as text (Ex: "X")
        return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' + path + '"/></svg>';
    };

    const getSpanWidth = function (span) {
        if (span === "full") return panelWidth - _ps.paddingLeft - _ps.paddingRight;
        if (span == 2) return _g.columnWidth * 2 + _g.gap;
        return _g.columnWidth;
    };

    // A one line text (or icon) label. It never takes the pointer, its field does.
    const textLabel = function (text, props = {}) {
        const lbl = Label({
            text: text,
            fontSize: props.fontSize || _t.fontSize,
            textColor: props.textColor || _t.color,
        });
        lbl.clickable = 0;
        lbl.elem.style.display = "flex";
        lbl.elem.style.alignItems = "center";
        lbl.elem.style.whiteSpace = "nowrap";
        lbl.elem.style.flexShrink = "0";
        if (props.bold) lbl.elem.style.fontFamily = _t.boldFontFamily;
        if (props.width !== undefined) {
            lbl.width = props.width;
            lbl.elem.style.justifyContent = "center";
        }
        if (props.height !== undefined) lbl.height = props.height;
        if (props.flex) {
            lbl.elem.style.flex = "1 1 0";
            lbl.elem.style.minWidth = "0";
            lbl.elem.style.overflow = "hidden";
            lbl.elem.style.textOverflow = "ellipsis";
            lbl.elem.style.display = "block";
            lbl.elem.style.lineHeight = (props.height || _g.itemHeight) + "px";
        }
        return lbl;
    };

    // Inner border that does not change the size.
    const setBorder = function (obj, color) {
        obj.elem.style.boxShadow = (color) ? "inset 0 0 0 1px " + color : "none";
    };

    // Hover border of a field (not while it has the focus or is disabled).
    const bindFieldHover = function (field, state) {
        field.on("mouseenter", function () { state.isHover = 1; paintField(field, state); });
        field.on("mouseleave", function () { state.isHover = 0; paintField(field, state); });
    };

    const paintField = function (field, state) {
        if (state.isFocus) setBorder(field, _s.field.focusBorderColor);
        else if (state.isHover && state.enabled) setBorder(field, _s.field.hoverBorderColor);
        else setBorder(field, "");
    };

    const precisionOf = function (item) {
        if (item.precision !== undefined && item.precision !== "auto") return Math.max(0, Number(item.precision) || 0);
        const text = String(item.step || 1);
        return (text.indexOf(".") > -1) ? text.split(".")[1].length : 0;
    };

    const normalizeOptions = function (options) {
        return (options || []).map(function (option) {
            if (option !== null && typeof option === "object") return { value: option.value, text: (option.text !== undefined) ? option.text : String(option.value), icon: option.icon, hint: option.hint };
            return { value: option, text: String(option) };
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

    // A value item changed by the user.
    const changeValue = function (ctrl, value) {
        const oldValue = ctrl.item.value;
        if (PropertyPanel.isSameValue(oldValue, value)) return;
        ctrl.item.value = PropertyPanel.copyValue(value);
        dispatch({ kind: "value", key: ctrl.item.key, value: PropertyPanel.copyValue(value), oldValue: oldValue, item: ctrl.item, sectionKey: ctrl.sectionKey });
    };

    // A button without a value was clicked.
    const sendAction = function (item, sectionKey, value) {
        dispatch({ kind: "action", key: item.key, value: value, oldValue: undefined, item: item, sectionKey: sectionKey });
    };

    // *** MENU (select, combo):

    const closeMenu = function () {
        if (!menu) return;
        lastClosedMenu = { anchor: menu.anchor, time: Date.now() };
        menu.obj.remove();
        menu = null;
    };

    // WHY: The pointerdown that closes a menu is followed by a click on its field. That click must not open it again.
    const wasJustClosed = function (anchor) {
        return lastClosedMenu.anchor === anchor && (Date.now() - lastClosedMenu.time) < 400;
    };

    const openMenu = function (anchor, options, currentValue, onPick) {
        closeMenu();
        if (!options.length) return;
        const rect = anchor.elem.getBoundingClientRect();
        const width = Math.max(rect.width, 140);
        const ms = _s.menu;

        createIn(page, function () {

            // GROUP: Menu
            const obj = VGroup({ left: 0, top: 0, width: width, height: "auto", align: "left top", gap: 0, color: ms.color, round: ms.round });
            obj.elem.style.padding = "6px 0px";
            obj.elem.style.boxSizing = "border-box";
            obj.elem.style.boxShadow = "0 0 0 1px " + ms.borderColor + ", 0 8px 24px rgba(0, 0, 0, 0.45)";
            obj.elem.style.zIndex = "2147482000";
            obj.elem.style.maxHeight = ms.maxHeight + "px";
            obj.elem.style.overflowY = "auto";
            obj.elem.style.alignItems = "stretch";
            obj.elem.setAttribute("role", "listbox");
            obj.clickable = 1;

                options.forEach(function (option) {

                    const isSelected = PropertyPanel.isSameValue(option.value, currentValue);

                    // GROUP: Menu row
                    const row = HGroup({ width: "100%", height: ms.rowHeight, align: "left center", gap: 0, color: "transparent" });
                    row.elem.style.flexShrink = "0";
                    row.elem.style.cursor = "pointer";
                    row.elem.setAttribute("role", "option");
                    row.elem.setAttribute("aria-selected", (isSelected) ? "true" : "false");
                    row.clickable = 1;

                        textLabel((isSelected) ? getIcon("check", 14) : "", { width: 28, height: ms.rowHeight, textColor: ms.textColor });
                        if (option.icon) textLabel(getIcon(option.icon, 16), { width: 22, height: ms.rowHeight, textColor: ms.textColor });
                        textLabel(PropertyPanel.escapeHtml(option.text), { flex: 1, height: ms.rowHeight, textColor: ms.textColor });

                    endGroup();

                    row.on("mouseenter", function () { row.color = ms.hoverColor; });
                    row.on("mouseleave", function () { row.color = "transparent"; });
                    row.on("click", function () { closeMenu(); onPick(option.value); });

                });

            endGroup();

            // Under the field; above it when there is no space below.
            const height = obj.elem.offsetHeight;
            let top = rect.bottom + 4;
            if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 4);
            obj.left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
            obj.top = top;

            menu = { obj: obj, anchor: anchor };

        });
    };

    const onDocumentPointerDown = function (event) {
        if (menu && !menu.obj.elem.contains(event.target)) closeMenu();
    };

    const onDocumentKeyDown = function (event) {
        if (menu && event.key === "Escape") closeMenu();
    };

    // *** SMALL OBJECTS USED BY THE ITEM TYPES:

    // FIELD: number input. Used by "number" and "combo".
    // Returns { field, setValue(), setEnabled() }. onCommit(value) is called with a new value.
    const buildNumberInput = function (item, width, onCommit, props = {}) {

        const state = { isHover: 0, isFocus: 0, enabled: item.enabled != 0 };
        const precision = precisionOf(item);
        const step = Math.abs(Number(item.step)) || 1;
        let value = item.value;
        let scrub = null;

        const format = function (v) {
            if (v === null || v === undefined || v === "") return item.autoText || "";
            return Number(v).toFixed(precision) + (item.unit || "");
        };

        const clamp = function (v) {
            if (item.min !== undefined) v = Math.max(Number(item.min), v);
            if (item.max !== undefined) v = Math.min(Number(item.max), v);
            const factor = Math.pow(10, precision);
            return Math.round(v * factor) / factor;
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
            if (next === undefined) { input.text = format(value); return; }
            value = next;
            input.text = format(value);
            onCommit(value);
        };

        // GROUP: Field
        const field = HGroup({ width: width, height: _g.itemHeight, align: "left center", gap: 0, color: _s.field.color, round: _s.field.round });
        field.elem.style.flexShrink = "0";
        field.elem.style.boxSizing = "border-box";
        field.elem.style.transition = "box-shadow 0.12s";
        if (props.roundRight === 0) field.elem.style.borderRadius = _s.field.round + "px 0px 0px " + _s.field.round + "px";

            // LABEL: Prefix ("X" or an icon). Drag it to change the value.
            let prefix = null;
            const prefixValue = item.icon || item.prefix;
            if (prefixValue) {
                prefix = textLabel(getIcon(prefixValue, 16), { width: 26, height: _g.itemHeight, textColor: _t.softColor, fontSize: _t.fontSize });
                prefix.clickable = 1;
                prefix.elem.style.cursor = "ew-resize";
                prefix.elem.style.touchAction = "none";
                prefix.elem.style.paddingLeft = "2px";
            }

            // INPUT: Value
            const input = Input({ width: 10, height: _g.itemHeight, minimal: 1, fontSize: _t.fontSize, textColor: _t.color });
            input.elem.style.flex = "1 1 0";
            input.elem.style.minWidth = "0";
            const el = input.inputElement;
            el.style.width = "100%";
            el.style.height = "100%";
            el.style.boxSizing = "border-box";
            el.style.padding = (prefix) ? "0px 4px 0px 2px" : "0px 8px";
            el.style.backgroundColor = "transparent";
            el.style.border = "0px";
            el.style.color = _t.color;
            el.style.fontSize = _t.fontSize + "px";
            el.setAttribute("spellcheck", "false");
            el.setAttribute("aria-label", item.hint || item.label || item.prefix || item.key);

        endGroup();

        bindFieldHover(field, state);

        el.addEventListener("focus", function () {
            state.isFocus = 1;
            paintField(field, state);
            el.select();
        });
        el.addEventListener("blur", function () {
            state.isFocus = 0;
            paintField(field, state);
            commit(parse(input.text));
        });
        el.addEventListener("keydown", function (event) {
            if (event.key === "Enter") { event.preventDefault(); el.blur(); }
            else if (event.key === "Escape") { event.preventDefault(); input.text = format(value); el.blur(); }
            else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                const base = parse(input.text);
                const start = (base === null || base === undefined) ? (Number(value) || 0) : base;
                const direction = (event.key === "ArrowUp") ? 1 : -1;
                commit(clamp(start + direction * step * (event.shiftKey ? 10 : 1)));
                el.select();
            }
        });

        // Scrub: drag the prefix left / right. 1 px = 1 step (Shift: 10 steps)
        if (prefix) {
            prefix.on("pointerdown", function (self, event) {
                if (!state.enabled || event.button !== 0) return;
                event.preventDefault();
                if (document.activeElement === el) el.blur();
                scrub = { id: event.pointerId, x: event.clientX, start: Number(value) || 0 };
                try { prefix.elem.setPointerCapture(event.pointerId); } catch (e) { }
            });
            prefix.on("pointermove", function (self, event) {
                if (!scrub || event.pointerId !== scrub.id) return;
                const next = clamp(scrub.start + Math.round(event.clientX - scrub.x) * step * (event.shiftKey ? 10 : 1));
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
            state.enabled = !!enabled;
            el.disabled = !state.enabled;
            el.style.color = (state.enabled) ? _t.color : _t.disabledColor;
            if (prefix) {
                prefix.textColor = (state.enabled) ? _t.softColor : _t.disabledColor;
                prefix.elem.style.cursor = (state.enabled) ? "ew-resize" : "default";
            }
            paintField(field, state);
        };

        setValue(value);
        setEnabled(state.enabled);

        return { field: field, setValue: setValue, setEnabled: setEnabled };

    };

    // FIELD: select (a menu of options). Used by "select" and "constraints".
    // look: "field" (default) or "plain" (no background, width hugs the text)
    const buildSelect = function (config, onPick) {

        const options = normalizeOptions(config.options);
        const isPlain = (config.look === "plain");
        const state = { isHover: 0, isFocus: 0, enabled: config.enabled != 0 };
        let value = config.value;

        // GROUP: Field
        const field = HGroup({ width: (isPlain) ? "auto" : config.width, height: _g.itemHeight, align: "left center", gap: 0, color: (isPlain) ? "transparent" : _s.field.color, round: _s.field.round });
        field.elem.style.flexShrink = "0";
        field.elem.style.boxSizing = "border-box";
        field.elem.style.cursor = "pointer";
        field.elem.style.outline = "none";
        field.elem.style.paddingLeft = (config.icon) ? "0px" : "8px";
        field.elem.tabIndex = 0;
        field.elem.setAttribute("role", "button");
        field.elem.setAttribute("aria-haspopup", "listbox");
        field.elem.setAttribute("aria-label", config.hint || config.label || config.key || "Select");
        field.clickable = 1;

            if (config.icon) textLabel(getIcon(config.icon, 16), { width: 28, height: _g.itemHeight, textColor: _t.softColor });
            const lblText = textLabel("", { flex: (isPlain) ? 0 : 1, height: _g.itemHeight });
            const lblArrow = textLabel(getIcon("chevronDown", 12), { width: 22, height: _g.itemHeight, textColor: _t.softColor });

        endGroup();

        if (!isPlain) bindFieldHover(field, state);
        else {
            field.on("mouseenter", function () { if (state.enabled) field.color = _s.button.hoverColor; });
            field.on("mouseleave", function () { field.color = "transparent"; });
        }

        const open = function () {
            if (!state.enabled || wasJustClosed(field)) return;
            openMenu(field, options, value, function (picked) {
                setValue(picked);
                onPick(picked);
            });
        };
        field.on("click", open);
        field.on("keydown", function (self, event) {
            if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") { event.preventDefault(); open(); }
        });
        field.on("focus", function () { state.isFocus = 1; if (!isPlain) paintField(field, state); });
        field.on("blur", function () { state.isFocus = 0; if (!isPlain) paintField(field, state); });

        const setValue = function (v) {
            value = v;
            const option = findOption(options, v);
            lblText.text = PropertyPanel.escapeHtml((option) ? option.text : (v === undefined || v === null) ? "" : String(v));
        };

        const setEnabled = function (enabled) {
            state.enabled = !!enabled;
            lblText.textColor = (state.enabled) ? _t.color : _t.disabledColor;
            lblArrow.textColor = (state.enabled) ? _t.softColor : _t.disabledColor;
            field.elem.style.cursor = (state.enabled) ? "pointer" : "default";
            field.elem.tabIndex = (state.enabled) ? 0 : -1;
            if (!isPlain) paintField(field, state);
        };

        setValue(value);
        setEnabled(state.enabled);

        return { field: field, setValue: setValue, setEnabled: setEnabled };

    };

    // BUTTON: A small icon button. Used by "iconButton" and the actions of the title and the sections.
    // toggle: 1 -> value true / false (active look). Otherwise an action.
    const buildIconButton = function (item, sectionKey, onToggle) {

        const isToggle = (item.toggle == 1);
        const useAccent = (item.accent !== 0);
        let value = !!item.value;
        let enabled = item.enabled != 0;
        let isHover = 0;

        // LABEL: Button
        const btn = textLabel("", { width: _g.iconColumnWidth, height: _g.itemHeight, textColor: _s.button.iconColor });
        btn.round = _s.field.round;
        btn.clickable = 1;
        btn.elem.style.cursor = "pointer";
        btn.elem.style.outline = "none";
        btn.elem.style.transition = "background-color 0.12s";
        btn.elem.tabIndex = 0;
        btn.elem.setAttribute("role", "button");
        btn.elem.setAttribute("aria-label", item.hint || item.key);
        if (item.hint) btn.elem.title = item.hint;

        const paint = function () {
            const isActive = isToggle && value && useAccent;
            btn.text = getIcon((isToggle && value && item.iconActive) ? item.iconActive : item.icon, 16);
            btn.color = (isActive) ? _s.button.activeColor : (isHover && enabled) ? _s.button.hoverColor : "transparent";
            btn.textColor = (!enabled) ? _t.disabledColor : (isActive) ? _s.button.activeIconColor : _s.button.iconColor;
            if (isToggle) btn.elem.setAttribute("aria-pressed", (value) ? "true" : "false");
        };

        const press = function () {
            if (!enabled) return;
            if (isToggle) { value = !value; paint(); onToggle(value); }
            else sendAction(item, sectionKey, item.value);
        };

        btn.on("mouseenter", function () { isHover = 1; paint(); });
        btn.on("mouseleave", function () { isHover = 0; paint(); });
        btn.on("click", press);
        btn.on("keydown", function (self, event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); press(); } });

        paint();

        return {
            field: btn,
            setValue: function (v) { value = !!v; paint(); },
            setEnabled: function (e) { enabled = !!e; btn.elem.style.cursor = (enabled) ? "pointer" : "default"; paint(); },
        };

    };

    // *** ITEM TYPES:
    // Each one creates its object in the current container and returns { setValue(v), setEnabled(e) }.
    // ctrl.item is the working copy of the JSON item. changeValue(ctrl, v) sends the change.

    const ITEM_TYPES = {

        // [X  396]  prefix / icon, unit, min, max, step, precision, autoText ("Auto" when the value is null)
        number: function (ctrl) {
            return buildNumberInput(ctrl.item, getSpanWidth(ctrl.item.span), function (v) { changeValue(ctrl, v); });
        },

        // [ text ]  placeholder
        text: function (ctrl) {
            const item = ctrl.item;
            const state = { isHover: 0, isFocus: 0, enabled: item.enabled != 0 };
            const field = HGroup({ width: getSpanWidth(item.span), height: _g.itemHeight, align: "left center", gap: 0, color: _s.field.color, round: _s.field.round });
            field.elem.style.flexShrink = "0";
            field.elem.style.transition = "box-shadow 0.12s";
                const input = Input({ width: 10, height: _g.itemHeight, minimal: 1, fontSize: _t.fontSize, textColor: _t.color });
                input.elem.style.flex = "1 1 0";
                input.elem.style.minWidth = "0";
                const el = input.inputElement;
                el.style.width = "100%";
                el.style.height = "100%";
                el.style.boxSizing = "border-box";
                el.style.padding = "0px 8px";
                el.style.backgroundColor = "transparent";
                el.style.border = "0px";
                el.style.color = _t.color;
                el.style.fontSize = _t.fontSize + "px";
                el.setAttribute("spellcheck", "false");
                el.setAttribute("aria-label", item.hint || item.label || item.key);
                if (item.placeholder) el.placeholder = item.placeholder;
            endGroup();
            bindFieldHover(field, state);
            el.addEventListener("focus", function () { state.isFocus = 1; paintField(field, state); });
            el.addEventListener("blur", function () { state.isFocus = 0; paintField(field, state); changeValue(ctrl, String(input.text)); });
            el.addEventListener("keydown", function (event) {
                if (event.key === "Enter") { event.preventDefault(); el.blur(); }
                else if (event.key === "Escape") { event.preventDefault(); input.text = ctrl.item.value || ""; el.blur(); }
            });
            return {
                setValue: function (v) { input.text = (v === undefined || v === null) ? "" : String(v); },
                setEnabled: function (e) { state.enabled = !!e; el.disabled = !state.enabled; el.style.color = (state.enabled) ? _t.color : _t.disabledColor; },
            };
        },

        // [ Left ⌄]  options: ["A", "B"] or [{ value, text, icon }], icon, look: "plain"
        select: function (ctrl) {
            const item = ctrl.item;
            const config = Object.assign({}, item, { width: getSpanWidth(item.span) });
            return buildSelect(config, function (v) { changeValue(ctrl, v); });
        },

        // [16 | ⌄]  a number field and preset values (options)
        combo: function (ctrl) {
            const item = ctrl.item;
            const width = getSpanWidth(item.span);
            const arrowWidth = 22;
            let enabled = item.enabled != 0;

            // GROUP: Number field + menu button
            const group = HGroup({ width: width, height: _g.itemHeight, align: "left center", gap: 1, color: "transparent" });
            group.elem.style.flexShrink = "0";

                const numberInput = buildNumberInput(item, width - arrowWidth - 1, function (v) { changeValue(ctrl, v); }, { roundRight: 0 });

                // LABEL: Menu button
                const btnArrow = textLabel(getIcon("chevronDown", 12), { width: arrowWidth, height: _g.itemHeight, textColor: _t.softColor });
                btnArrow.color = _s.field.color;
                btnArrow.clickable = 1;
                btnArrow.elem.style.cursor = "pointer";
                btnArrow.elem.style.borderRadius = "0px " + _s.field.round + "px " + _s.field.round + "px 0px";

            endGroup();

            const options = normalizeOptions(item.options);
            btnArrow.on("mouseenter", function () { if (enabled) btnArrow.color = _s.segmented.hoverColor; });
            btnArrow.on("mouseleave", function () { btnArrow.color = _s.field.color; });
            btnArrow.on("click", function () {
                if (!enabled || wasJustClosed(group)) return;
                openMenu(group, options, ctrl.item.value, function (picked) {
                    numberInput.setValue(picked);
                    changeValue(ctrl, picked);
                });
            });

            return {
                setValue: numberInput.setValue,
                setEnabled: function (e) { enabled = !!e; numberInput.setEnabled(e); btnArrow.textColor = (enabled) ? _t.softColor : _t.disabledColor; },
            };
        },

        // [≡|≡|≡]  options: [{ value, icon, text, hint }]. value !== undefined -> one is selected.
        segmented: function (ctrl) {
            const item = ctrl.item;
            const options = normalizeOptions(item.options);
            const isSelect = (item.mode) ? (item.mode === "select") : (item.value !== undefined);
            let value = item.value;
            let enabled = item.enabled != 0;
            const segments = [];

            // GROUP: Segments
            const group = HGroup({ width: getSpanWidth(item.span), height: _g.itemHeight, align: "left center", gap: (isSelect) ? 0 : 1, color: (isSelect) ? _s.field.color : "transparent", round: _s.field.round });
            group.elem.style.flexShrink = "0";
            group.elem.setAttribute("role", (isSelect) ? "radiogroup" : "group");
            group.elem.setAttribute("aria-label", item.hint || item.label || item.key);

                options.forEach(function (option, index) {
                    // LABEL: Segment
                    const seg = textLabel((option.icon) ? getIcon(option.icon, 16) : PropertyPanel.escapeHtml(option.text), { width: 10, height: _g.itemHeight, textColor: _s.button.iconColor });
                    seg.elem.style.flex = "1 1 0";
                    seg.elem.style.cursor = "pointer";
                    seg.elem.style.outline = "none";
                    seg.elem.style.transition = "background-color 0.12s";
                    seg.elem.tabIndex = 0;
                    seg.elem.setAttribute("role", (isSelect) ? "radio" : "button");
                    seg.elem.setAttribute("aria-label", option.hint || option.text);
                    if (option.hint) seg.elem.title = option.hint;
                    seg.clickable = 1;
                    const r = _s.field.round + "px";
                    seg.elem.style.borderRadius = (isSelect) ? r : ((index === 0) ? r + " 0 0 " + r : (index === options.length - 1) ? "0 " + r + " " + r + " 0" : "0");
                    seg.option = option;
                    seg.isHover = 0;
                    segments.push(seg);

                    const press = function () {
                        if (!enabled) return;
                        if (isSelect) { value = option.value; paint(); changeValue(ctrl, value); }
                        else sendAction(item, ctrl.sectionKey, option.value);
                    };
                    seg.on("mouseenter", function () { seg.isHover = 1; paint(); });
                    seg.on("mouseleave", function () { seg.isHover = 0; paint(); });
                    seg.on("click", press);
                    seg.on("keydown", function (self, event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); press(); } });
                });

            endGroup();

            const paint = function () {
                segments.forEach(function (seg) {
                    const isSelected = isSelect && PropertyPanel.isSameValue(seg.option.value, value);
                    if (isSelected) seg.color = _s.segmented.selectedColor;
                    else if (seg.isHover && enabled) seg.color = _s.segmented.hoverColor;
                    else seg.color = (isSelect) ? "transparent" : _s.field.color;
                    setBorder(seg, (isSelected) ? _s.segmented.selectedBorderColor : "");
                    seg.textColor = (!enabled) ? _t.disabledColor : (isSelect && !isSelected) ? _t.softColor : _s.button.iconColor;
                    if (isSelect) seg.elem.setAttribute("aria-checked", (isSelected) ? "true" : "false");
                });
            };

            paint();

            return {
                setValue: function (v) { value = v; paint(); },
                setEnabled: function (e) { enabled = !!e; paint(); },
            };
        },

        // [◎]  icon, iconActive, toggle: 1 (value true / false), accent: 0 (no blue look when on)
        iconButton: function (ctrl) {
            return buildIconButton(ctrl.item, ctrl.sectionKey, function (v) { changeValue(ctrl, v); });
        },

        // Horizontal / vertical selects at the left and the constraints diagram at the right.
        // value: { horizontal: "left" | "right" | "leftRight" | "center" | "scale", vertical: "top" | "bottom" | "topBottom" | "center" | "scale" }
        constraints: function (ctrl) {
            const item = ctrl.item;
            let value = Object.assign({ horizontal: "left", vertical: "top" }, item.value || {});
            let enabled = item.enabled != 0;
            const H_OPTIONS = [{ value: "left", text: "Left" }, { value: "right", text: "Right" }, { value: "leftRight", text: "Left and right" }, { value: "center", text: "Center" }, { value: "scale", text: "Scale" }];
            const V_OPTIONS = [{ value: "top", text: "Top" }, { value: "bottom", text: "Bottom" }, { value: "topBottom", text: "Top and bottom" }, { value: "center", text: "Center" }, { value: "scale", text: "Scale" }];
            const W = _g.columnWidth;
            const H = _g.itemHeight * 2 + _g.rowGap;

            const change = function (next) {
                value = Object.assign({}, value, next);
                paint();
                changeValue(ctrl, value);
            };

            // GROUP: Selects + diagram
            HGroup({ width: getSpanWidth(2), height: H, align: "left top", gap: _g.gap, color: "transparent" });
            that.elem.style.flexShrink = "0";

                // GROUP: Selects
                VGroup({ width: W, height: H, align: "left top", gap: _g.rowGap, color: "transparent" });
                that.elem.style.flexShrink = "0";
                    const selH = buildSelect({ key: item.key + "-h", hint: "Horizontal constraint", icon: "constraintH", width: W, options: H_OPTIONS, value: value.horizontal }, function (v) { change({ horizontal: v }); });
                    const selV = buildSelect({ key: item.key + "-v", hint: "Vertical constraint", icon: "constraintV", width: W, options: V_OPTIONS, value: value.vertical }, function (v) { change({ vertical: v }); });
                endGroup();

                // BOX: Diagram
                const diagram = startBox({ width: W, height: H, color: _s.field.color, round: _s.field.round });
                diagram.elem.style.flexShrink = "0";

                    const cx = Math.round(W / 2);
                    const cy = Math.round(H / 2);
                    const iw = 34, ih = 22; // Inner frame
                    const ix = cx - iw / 2, iy = cy - ih / 2;

                    // BOX: Inner frame
                    const frame = Box({ left: ix, top: iy, width: iw, height: ih, color: "transparent", round: 3 });
                    setBorder(frame, "#555555");

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
                        obj.elem.style.cursor = "pointer";
                        obj.on("click", function (self, event) { if (enabled) onClick(event.shiftKey); });
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
                const h = value.horizontal, v = value.vertical;
                const on = function (obj, isOn) { obj.color = (isOn && enabled) ? _s.accent.color : (isOn) ? _t.softColor : _t.disabledColor; };
                on(lines.top, v === "top" || v === "topBottom");
                on(lines.bottom, v === "bottom" || v === "topBottom");
                on(lines.left, h === "left" || h === "leftRight");
                on(lines.right, h === "right" || h === "leftRight");
                on(lines.centerH, h === "center");
                on(lines.centerV, v === "center");
                lines.centerH.color = (h === "center" && enabled) ? _s.accent.color : _t.softColor;
                lines.centerV.color = (v === "center" && enabled) ? _s.accent.color : _t.softColor;
                selH.setValue(h);
                selV.setValue(v);
            };

            paint();

            return {
                setValue: function (v) { value = Object.assign({ horizontal: "left", vertical: "top" }, v || {}); paint(); },
                setEnabled: function (e) { enabled = !!e; selH.setEnabled(e); selV.setEnabled(e); paint(); },
            };
        },

    };

    // Width of an item in its row.
    const getItemWidth = function (item) {
        if (item.type === "iconButton") return _g.iconColumnWidth;
        if (item.type === "constraints") return getSpanWidth(2);
        return getSpanWidth(item.span);
    };

    // *** VIEW BUILDERS:

    // One item: the caption (if the row has one) and its object.
    const buildItem = function (item, sectionKey, hasCaption) {

        const builder = ITEM_TYPES[item.type];
        if (!builder) { console.warn("PropertyPanel: Unknown item type: " + item.type); return; }

        // GROUP: Cell
        const cell = VGroup({ width: getItemWidth(item), height: "auto", align: "left top", gap: 6, color: "transparent" });
        cell.elem.style.flexShrink = "0";

            if (hasCaption) textLabel(PropertyPanel.escapeHtml(item.label || ""), { fontSize: _t.captionSize, textColor: _t.softColor, height: 16 });

            const ctrl = { item: item, sectionKey: sectionKey };
            const api = builder(ctrl);
            ctrl.setValue = api.setValue;
            ctrl.setEnabled = api.setEnabled;
            ctrl.cell = cell;
            if (item.key !== undefined) {
                if (controllers[item.key]) console.warn("PropertyPanel: Same key twice: " + item.key);
                controllers[item.key] = ctrl;
            }

        endGroup();

        if (item.visible === 0 || item.visible === false) cell.visible = 0;

    };

    // Title + actions row (the panel title or a section title).
    const buildTitleRow = function (text, actions, sectionKey, isMainTitle) {
        HGroup({ width: "100%", height: (isMainTitle) ? 32 : 24, align: "left center", gap: 2, color: "transparent" });
            textLabel(PropertyPanel.escapeHtml(text || ""), { fontSize: (isMainTitle) ? _t.titleSize : _t.sectionTitleSize, bold: 1, flex: 1, height: 24 });
            (actions || []).forEach(function (action) {
                const item = Object.assign({ type: "iconButton", accent: 0 }, action);
                const ctrl = { item: item, sectionKey: sectionKey };
                const api = buildIconButton(item, sectionKey, function (v) { changeValue(ctrl, v); });
                ctrl.setValue = api.setValue;
                ctrl.setEnabled = api.setEnabled;
                if (item.key !== undefined) controllers[item.key] = ctrl;
                return action;
            });
        endGroup();
    };

    const buildSection = function (section, isTitleBlock) {

        // GROUP: Section
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: _g.rowGap, color: "transparent" });
        group.elem.style.padding = (isTitleBlock ? "8px " : "12px ") + _ps.paddingRight + "px " + (isTitleBlock ? "8px " : "16px ") + _ps.paddingLeft + "px";
        group.elem.style.boxSizing = "border-box";
        group.elem.style.borderBottom = "1px solid " + _ps.dividerColor;
        group.elem.style.flexShrink = "0";

            buildTitleRow(section.title, section.actions, section.key, isTitleBlock);

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
                const lbl = textLabel(PropertyPanel.escapeHtml(tab.text || tab.key), { height: 28, bold: 1 });
                lbl.round = _s.field.round;
                lbl.clickable = 1;
                lbl.elem.style.padding = "0px 10px";
                lbl.elem.style.cursor = "pointer";
                lbl.elem.style.outline = "none";
                lbl.elem.tabIndex = 0;
                lbl.elem.setAttribute("role", "tab");
                tabLabels[tab.key] = lbl;
                const select = function () { box.setActiveTab(tab.key); };
                lbl.on("click", select);
                lbl.on("keydown", function (self, event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
                lbl.on("mouseenter", function () { if (data.activeTab !== tab.key) lbl.textColor = _t.color; });
                lbl.on("mouseleave", function () { paintTabs(); });
            });

            // BOX: Space
            const space = Box({ width: 10, height: 1, color: "transparent" });
            space.elem.style.flex = "1 1 0";

            if (data.headerItem) {
                const item = Object.assign({ type: "select", look: "plain" }, data.headerItem);
                data.headerItem = item;
                const ctrl = { item: item, sectionKey: "header" };
                const api = (item.type === "select") ? buildSelect(item, function (v) { changeValue(ctrl, v); }) : buildIconButton(item, "header", function (v) { changeValue(ctrl, v); });
                ctrl.setValue = api.setValue;
                ctrl.setEnabled = api.setEnabled;
                if (item.key !== undefined) controllers[item.key] = ctrl;
            }

            endGroup();

        });

        paintTabs();

    };

    const paintTabs = function () {
        Object.keys(tabLabels).forEach(function (key) {
            const isActive = (key === box.data.activeTab);
            tabLabels[key].color = (isActive) ? _s.field.color : "transparent";
            tabLabels[key].textColor = (isActive) ? _t.color : _t.softColor;
            tabLabels[key].elem.style.fontFamily = (isActive) ? _t.boldFontFamily : "";
            tabLabels[key].elem.setAttribute("aria-selected", (isActive) ? "true" : "false");
        });
    };

    // Title block and sections (in the scrolling box).
    const buildContent = function () {

        if (box.content) box.content.remove();
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

    // *** PUBLIC FUNCTIONS:

    // Builds the panel again from a JSON. (The JSON is copied: getData() returns the copy with the current values.)
    box.setData = function (data) {
        closeMenu();
        controllers = {};
        box.data = PropertyPanel.copyData(data || {});
        buildHeader();
        buildContent();
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
        if (!ctrl) { console.warn("PropertyPanel: No item with the key: " + key); return 0; }
        const oldValue = ctrl.item.value;
        ctrl.item.value = PropertyPanel.copyValue(value);
        ctrl.setValue(PropertyPanel.copyValue(value));
        if (!silent && !PropertyPanel.isSameValue(oldValue, value)) {
            dispatch({ kind: "value", key: key, value: PropertyPanel.copyValue(value), oldValue: oldValue, item: ctrl.item, sectionKey: ctrl.sectionKey });
        }
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
        ctrl.item.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        ctrl.setEnabled(ctrl.item.enabled);
        return 1;
    };
    // USAGE: panel.setEnabled("w", 0)

    box.setItemVisible = function (key, visible) {
        const ctrl = controllers[key];
        if (!ctrl || !ctrl.cell) return 0;
        ctrl.item.visible = (visible == 1 || visible === true) ? 1 : 0;
        ctrl.cell.visible = ctrl.item.visible;
        return 1;
    };

    box.getItem = function (key) {
        const ctrl = controllers[key];
        return (ctrl) ? ctrl.item : null;
    };

    box.setTitle = function (text) {
        box.data.title = text;
        buildContent();
    };

    // silent: 1 -> no change event.
    box.setActiveTab = function (key, silent = 0) {
        const oldValue = box.data.activeTab;
        box.data.activeTab = key;
        paintTabs();
        if (!silent && oldValue !== key) dispatch({ kind: "tab", key: key, value: key, oldValue: oldValue, item: null, sectionKey: "header" });
    };

    // Listens to every change. Returns a function that removes the listener.
    box.listen = function (fn) {
        listeners.push(fn);
        return function () { listeners = listeners.filter(function (f) { return f !== fn; }); };
    };
    // USAGE: const stop = panel.listen(function (change) { println(change.key); }); stop();

    box.open = function () {
        box.opened = 1;
        box.elem.style.transform = "translateX(0px)";
        box.elem.setAttribute("aria-hidden", "false");
    };

    box.close = function () {
        closeMenu();
        box.opened = 0;
        box.elem.style.transform = "translateX(100%)";
        box.elem.setAttribute("aria-hidden", "true");
    };

    box.toggle = function () {
        if (box.opened == 1) box.close(); else box.open();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        closeMenu();
        document.removeEventListener("pointerdown", onDocumentPointerDown, true);
        document.removeEventListener("keydown", onDocumentKeyDown);
        window.removeEventListener("resize", closeMenu);
        listeners = [];
        controllers = {};
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.style.boxShadow = "inset 1px 0 0 " + _ps.dividerColor;
    box.elem.style.transition = "transform " + _ps.motion + " ease";
    box.elem.setAttribute("role", "complementary");
    box.elem.setAttribute("aria-label", "Properties");
    box.clickable = 1;

    // GROUP: Header (tabs)
    box.header = HGroup({ left: 0, top: 0, width: "100%", height: _ps.headerHeight, align: "left center", gap: 2, color: "transparent" });
    box.header.elem.style.padding = "0px " + _ps.paddingRight + "px 0px 10px";
    box.header.elem.style.boxSizing = "border-box";
    box.header.elem.style.borderBottom = "1px solid " + _ps.dividerColor;
    box.header.elem.setAttribute("role", "tablist");
    endGroup();

    // BOX: Scrolling content
    box.scrollBox = Box({ left: 0, top: _ps.headerHeight, width: "100%", height: "calc(100% - " + _ps.headerHeight + "px)", color: "transparent", scrollY: 1 });

    // *** OBJECT INIT CODE:

    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    document.addEventListener("keydown", onDocumentKeyDown);
    window.addEventListener("resize", closeMenu);
    box.scrollBox.elem.addEventListener("scroll", closeMenu);

    box.setData(startData);

    if (typeof ScrollBar !== "undefined") {
        ScrollBar({ scrollableBox: box.scrollBox, bar_color: "#FFFFFF", bar_mouseOverColor: "#FFFFFF", bar_opacity: 0.25, bar_mouseOverOpacity: 0.5, neverHide: 0, showDots: 0 });
    }

    if (box.opened == 1) box.open(); else box.close();

    const panel = endObject(box);

    // WHY: The container was moved to the page above. The caller goes on with its own container.
    setDefaultContainerBox(previousContainer);

    return panel;

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
PropertyPanel.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

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
};
