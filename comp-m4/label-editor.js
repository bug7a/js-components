/* Bismillah */

/*

LabelEditor - v26.09

UI COMPONENT TEMPLATE
- An object based editor for labels. (Nesne tabanlı editör nesnesi)
- "Add label" adds a label to the list. The labels are stacked one under the other.
- Click a label: the properties panel opens at the right side of the screen (full height, SidePanel).
  Text, font size, bold, italic, alignment, width (auto / full), text color, background, padding,
  corner radius and border are changed there. The panel has no backdrop: another label can be
  clicked while it is open.
- The panel is made of components: SidePanel, Stepper, SelectColor, Tabs (pill), CheckBox and the
  Input / Button of basic.js.
- Saved styles: give the properties of a label a name and save them. Click a saved style to apply it
  to the selected label. The chips show a preview of each style.
- A style is linked: saving a style again with the same name updates every label that uses it.
  A label that was changed after its style was applied shows "(changed)" in the panel.
- storageKey: "..." -> The saved styles are kept in basic.storage (localStorage) and loaded next time.
- Keyboard: Tab to a label, Enter / Space selects it, Delete removes it, Escape closes the panel.
- getLabels() / setLabels() give and take plain objects, to save the work or to draw it somewhere else.
- The label texts are shown as plain text (not HTML).
- Style packages: "classic" (default), "dark". Select with styleName. (LabelEditor.styles)

NEEDS (load them before this file):
comp-m4/side-panel.js, comp-m4/stepper.js, comp-m4/select-color.js, comp-m4/tabs.js, comp-m3/check-box.js

USAGE:
const editor = LabelEditor({
    width: 860,
    height: 540,
    storageKey: "my-label-styles",
    onChange: function (self) { println(self.getLabels()); },
});
editor.addLabel({ text: "Monthly report", fontSize: 26, bold: 1 });
editor.saveStyle("Title", 0);            // The style of label 0 is saved as "Title"
editor.addLabel({ text: "Sales" });
editor.applyStyle("Title", 1);           // Label 1 gets the "Title" style
editor.getLabels();                      // [{ text, fontSize, textColor, color, bold, italic, textAlign, fullWidth, padding, round, border, borderColor, styleName }, ...]
editor.remove();                         // Also removes its panel from the page.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const LabelEditorDefaults = {
    key: "0",
    width: 860,
    height: 540,
    labels: [], // Start labels: [{ text, fontSize, ... , styleName }]
    savedStyles: [], // Start styles: [{ name, props: { fontSize, textColor, ... } }] (storageKey wins when it has data)
    storageKey: "", // "": the saved styles are not kept. Ex: "label-editor-styles"
    newLabel: { // Properties of a new label
        text: "Label {n}", // {n}: the number of the label
        fontSize: 16,
        textColor: "#1F2328",
        color: "", // "": transparent
        bold: 0,
        italic: 0,
        textAlign: "left", // "left", "center", "right"
        fullWidth: 0, // 1: the label is as wide as the list
        padding: 0,
        round: 0,
        border: 0,
        borderColor: "#1F2328",
    },
    colorPalette: [ // The colors of the color pickers in the panel
        "#1F2328", "#5A5A5A", "#9A9A9A", "#D0D0D0", "#FFFFFF",
        "#C0392B", "#E0A038", "#8A5A00", "#3E8E62", "#1F6F6B",
        "#2F6FB0", "#5AA9E6", "#7B61D9", "#B45FC0", "#E06AA0",
        "#FFE0E0", "#FFF3C4", "#E3F4E8", "#E1EEFB", "#EFE7FB",
    ],
    panelWidth: 340,
    useScrollBar: 1,
    texts: {
        title: "Labels",
        addButton: "+ Add label",
        empty: "No labels yet. Click \"Add label\" to create one.",
        panelTitle: "Properties",
        text: "Text",
        fontSize: "Font size",
        fontStyle: "Font style",
        bold: "Bold",
        italic: "Italic",
        align: "Alignment",
        left: "Left",
        center: "Center",
        right: "Right",
        width: "Width",
        widthAuto: "Auto",
        widthFull: "Full",
        textColor: "Text color",
        background: "Background",
        none: "None",
        colorOn: "Color",
        backgroundColor: "Background color",
        padding: "Padding",
        round: "Corner radius",
        border: "Border",
        borderColor: "Border color",
        savedStyles: "Saved styles",
        styleNamePlaceholder: "Style name",
        save: "Save",
        noStyles: "No saved styles yet. Style a label, write a name and save it.",
        applyHint: "Click a style to apply it to the selected label.",
        currentStyle: "Style: {name}",
        changed: "(changed)",
        noStyle: "No style",
        duplicate: "Duplicate",
        remove: "Delete",
        removeStyle: "Delete style",
    },
    onChange: function (self) { }, // The labels changed. self.getLabels()
    onSelect: function (self, index) { }, // index: -1 when nothing is selected
    onStylesChange: function (self) { }, // The saved styles changed. self.getSavedStyles()
    styleName: "classic", // "classic", "dark" or a name added to LabelEditor.styles
    style: { // Classic style package (default)
        box: { color: "#F4F5F2", border: 1, borderColor: Black(0.12), round: 10 },
        header: { color: White(1), dividerColor: Black(0.08), titleColor: "#1F2328", titleSize: 15 },
        list: { color: "#F4F5F2", padding: 24, gap: 12, emptyColor: Black(0.4) },
        selection: { color: "#2F6FB0", hoverColor: "rgba(47, 111, 176, 0.35)" },
        button: { color: "#1F2328", textColor: White(1), hoverColor: "#3A3F45", round: 6, fontSize: 13, height: 36 },
        secondaryButton: { color: Black(0.06), textColor: "#1F2328", hoverColor: Black(0.1), dangerTextColor: "#C0392B" },
        panel: { dividerColor: Black(0.08), gap: 18, captionColor: Black(0.5), textColor: "#1F2328", hintColor: Black(0.4) },
        input: { color: White(1), borderColor: Black(0.2), focusColor: "#141414", textColor: "#1F2328", round: 6, height: 38 },
        chip: { color: White(1), borderColor: Black(0.14), activeBorderColor: "#2F6FB0", round: 16, closeColor: Black(0.4) },
        // The components in the panel: their style package names and their style changes.
        // WHY: Not nested deeper (Ex: parts.checkBox.style.label): mergeIntoIfMissing stops at 4 levels.
        sidePanelStyleName: "classic",
        stepperStyleName: "classic",
        tabsStyleName: "classic",
        checkBoxStyleName: "classic",
        sidePanelStyle: {},
        stepperStyle: {},
        tabsStyle: {},
        checkBoxStyle: { label: { fontSize: 14 } },
        selectColorStyle: { fieldText: { fontSize: 13 } },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    }
};

const LabelEditor = function (params = {}) {

    // WHY: The panel is made of these components. Without them it can not be drawn.
    const _missing = [
        ["SidePanel", typeof SidePanel], ["Stepper", typeof Stepper], ["SelectColor", typeof SelectColor],
        ["Tabs", typeof Tabs], ["CheckBox", typeof CheckBox],
    ].filter(function (pair) { return pair[1] === "undefined"; }).map(function (pair) { return pair[0]; });
    if (_missing.length) console.error("LabelEditor: Load these components before label-editor.js: " + _missing.join(", "));

    // Merge style package: params.style > LabelEditor.styles[styleName] > LabelEditorDefaults.style (classic)
    basic.applyStylePackage(params, LabelEditor.styles, LabelEditorDefaults);

    // Merge params:
    mergeIntoIfMissing(params, LabelEditorDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;
    const startLabels = params.labels;
    const startStyles = params.savedStyles;
    params.labels = []; // WHY: The default arrays must not be shared by the instances.
    params.savedStyles = [];

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    // Every component gets its own copy.
    const copyStyle = function (style) {
        return JSON.parse(JSON.stringify(style || {}));
    };
    const PROP_KEYS = ["text", "fontSize", "textColor", "color", "bold", "italic", "textAlign", "fullWidth", "padding", "round", "border", "borderColor"];
    const STYLE_KEYS = PROP_KEYS.filter(function (k) { return k !== "text"; }); // A style has everything but the text.
    let items = []; // { props, styleName, styleChanged, label }
    let styles = []; // { name, props }
    let selected = null; // The selected item
    let labelCount = 0; // For "Label {n}"
    let isClosingPanel = 0; // WHY: selectItem(null) closes the panel, and the panel's onClose calls selectItem(null).
    const controls = {}; // Panel controls
    const LIMITS = {
        fontSize: { min: 8, max: 120 },
        padding: { min: 0, max: 80 },
        round: { min: 0, max: 100 },
        border: { min: 0, max: 20 },
    };
    const DEFAULT_BACKGROUND = "#FFF3C4"; // The first background color, when "Color" is chosen
    const CHIP_FONT_MIN = 11; // The name in a chip is drawn with the style, between these sizes
    const CHIP_FONT_MAX = 15;
    const BUTTON_MOTION = "background-color 0.12s";

    // *** PRIVATE FUNCTIONS:

    const toNumber = function (value, min, max, fallback) {
        const n = Number(value);
        if (isNaN(n)) return fallback;
        return Math.max(min, Math.min(max, Math.round(n)));
    };

    // Any object -> full, valid label properties.
    const normalizeProps = function (source, base) {
        const p = Object.assign({}, base || box.newLabel, source || {});
        return {
            text: String(p.text ?? ""),
            fontSize: toNumber(p.fontSize, LIMITS.fontSize.min, LIMITS.fontSize.max, 16),
            textColor: String(p.textColor || "#1F2328"),
            color: String(p.color || ""),
            bold: p.bold ? 1 : 0,
            italic: p.italic ? 1 : 0,
            textAlign: (["left", "center", "right"].indexOf(p.textAlign) > -1) ? p.textAlign : "left",
            fullWidth: p.fullWidth ? 1 : 0,
            padding: toNumber(p.padding, LIMITS.padding.min, LIMITS.padding.max, 0),
            round: toNumber(p.round, LIMITS.round.min, LIMITS.round.max, 0),
            border: toNumber(p.border, LIMITS.border.min, LIMITS.border.max, 0),
            borderColor: String(p.borderColor || "#1F2328"),
        };
    };

    const pickStyleProps = function (props) {
        const out = {};
        STYLE_KEYS.forEach(function (k) { out[k] = props[k]; });
        return out;
    };

    const findStyle = function (name) {
        return styles.find(function (st) { return st.name === name; }) || null;
    };

    const indexOfItem = function (item) {
        return items.indexOf(item);
    };

    const saveStylesToStorage = function () {
        if (!box.storageKey) return;
        try {
            basic.storage.save(box.storageKey, styles);
        } catch (e) {
            console.warn("LabelEditor: The styles could not be saved.");
        }
    };

    const stylesChanged = function () {
        box.savedStyles = box.getSavedStyles();
        saveStylesToStorage();
        renderChips();
        updatePanelStyleInfo();
        box.onStylesChange(box);
    };

    const labelsChanged = function () {
        box.labels = box.getLabels();
        box.onChange(box);
    };

    // *** LIST:

    // Properties -> the view of the label.
    const applyProps = function (item) {
        const lbl = item.label;
        const props = item.props;
        lbl.plainText = props.text;
        lbl.fontSize = props.fontSize;
        lbl.textColor = props.textColor;
        lbl.color = props.color || "transparent";
        lbl.bold = props.bold;
        lbl.italic = props.italic;
        lbl.textAlign = props.textAlign;
        lbl.width = props.fullWidth ? "100%" : "auto";
        lbl.padding = props.padding;
        lbl.round = props.round;
        lbl.border = props.border;
        lbl.borderColor = props.borderColor;
        lbl.css.borderStyle = "solid";
        lbl.aria = { label: props.text || "Label" };
        lbl.elem.title = item.styleName ? box.texts.currentStyle.replace("{name}", item.styleName) : "";
    };

    const getOutline = function (item, isSelected) {
        if (isSelected) return "2px solid " + _s.selection.color;
        if (item.isHover) return "1px dashed " + _s.selection.hoverColor;
        return "none";
    };

    const paintSelection = function (item) {
        const isSelected = (item === selected);
        item.label.css = {
            outline: getOutline(item, isSelected),
            outlineOffset: isSelected ? "3px" : "2px",
        };
        item.label.aria = { selected: isSelected ? "true" : "false" };
    };

    const focusNextItem = function (item, step) {
        const next = items[indexOfItem(item) + step];
        if (next) next.label.elem.focus();
    };

    const onItemKeyDown = function (item, event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectItem(item);
            return;
        }
        if ((event.key === "Delete" || event.key === "Backspace") && item === selected) {
            event.preventDefault();
            box.removeLabel(indexOfItem(item));
            return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusNextItem(item, (event.key === "ArrowDown") ? 1 : -1);
        }
    };

    const createItemView = function (item) {
        createIn(box.listWrapper, function () {
            // LABEL: The label that is edited
            item.label = Label({ plainText: "", clickable: 1 });
            item.label.css = {
                maxWidth: "100%",
                boxSizing: "border-box",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                minHeight: "1em",
            };
            item.label.cursor = "pointer";
            item.label.shrink = 0;
            item.label.tabIndex = 0;
            item.label.role = "option";
        });
        applyProps(item);
        paintSelection(item);
        item.label.on("click", function (self, event) {
            event.stopPropagation();
            selectItem(item);
        });
        item.label.on("mouseenter", function () {
            item.isHover = 1;
            paintSelection(item);
        });
        item.label.on("mouseleave", function () {
            item.isHover = 0;
            paintSelection(item);
        });
        item.label.on("keydown", function (self, event) {
            onItemKeyDown(item, event);
        });
    };

    const updateEmpty = function () {
        box.lblEmpty.visible = (items.length == 0) ? 1 : 0;
        if (box.listScrollBar) box.listScrollBar.refreshScroll();
    };

    const renderList = function () {
        if (box.listWrapper) box.listWrapper.remove();
        createIn(box.listArea, function () {
            // GROUP: Labels, one under the other
            box.listWrapper = VGroup({
                width: "100%",
                height: "auto",
                align: "left top",
                gap: _s.list.gap,
                padding: _s.list.padding,
            });
            box.listWrapper.position = "relative"; // WHY: The scroll box grows with it.
            box.listWrapper.role = "listbox";
            box.listWrapper.aria = { label: box.texts.title };
            endGroup();
        });
        items.forEach(createItemView);
        updateEmpty();
    };

    const selectItem = function (item) {
        const previous = selected;
        selected = item || null;
        if (previous && previous.label) paintSelection(previous);
        if (selected) {
            paintSelection(selected);
            selected.label.elem.scrollIntoView({ block: "nearest" });
            loadPanel();
            box.sidePanel.open();
        } else if (box.sidePanel.isOpened === 1) {
            isClosingPanel = 1;
            box.sidePanel.close();
            isClosingPanel = 0;
        }
        if (previous !== selected) box.onSelect(box, indexOfItem(selected));
    };

    // A property was changed in the panel.
    const setProp = function (key, value) {
        if (!selected) return;
        const next = normalizeProps(Object.assign({}, selected.props, { [key]: value }), selected.props);
        if (next[key] === selected.props[key]) return;
        selected.props = next;
        if (key !== "text" && selected.styleName) selected.styleChanged = 1;
        applyProps(selected);
        updatePanelStyleInfo();
        labelsChanged();
    };

    // *** PANEL:

    // The values of the selected label -> the controls. (silent: the controls do not call onChange)
    const loadPanel = function () {
        if (!selected) return;
        const p = selected.props;
        controls.text.text = p.text;
        controls.fontSize.setValue(p.fontSize, 1);
        controls.bold.setChecked(p.bold, 1);
        controls.italic.setChecked(p.italic, 1);
        controls.align.setValue(p.textAlign, 1);
        controls.width.setValue(p.fullWidth ? "full" : "auto", 1);
        controls.textColor.setColor(p.textColor, 1);
        controls.background.setValue(p.color ? "color" : "none", 1);
        controls.bgColor.setColor(p.color || DEFAULT_BACKGROUND, 1);
        controls.bgField.visible = p.color ? 1 : 0;
        controls.padding.setValue(p.padding, 1);
        controls.round.setValue(p.round, 1);
        controls.border.setValue(p.border, 1);
        controls.borderColor.setColor(p.borderColor, 1);
        controls.styleName.text = selected.styleName || "";
        updatePanelStyleInfo();
    };

    const updatePanelStyleInfo = function () {
        if (!box.lblStyleInfo) return;
        if (selected && selected.styleName) {
            const changedText = (selected.styleChanged) ? " " + box.texts.changed : "";
            box.lblStyleInfo.plainText = box.texts.currentStyle.replace("{name}", selected.styleName) + changedText;
        } else {
            box.lblStyleInfo.plainText = box.texts.noStyle;
        }
        renderChips();
    };

    const applyStyleToSelected = function (name) {
        if (!selected) return;
        box.applyStyle(name, indexOfItem(selected));
    };

    // GROUP: Chip of a saved style (name drawn with the style, delete button)
    const createChip = function (st) {

        const isCurrent = (selected && selected.styleName === st.name);
        const chip = HGroup({
            width: "auto",
            height: "auto",
            align: "left center",
            gap: 4,
            padding: [10, 4],
            color: _s.chip.color,
            round: _s.chip.round,
            border: isCurrent ? 2 : 1,
            borderColor: isCurrent ? _s.chip.activeBorderColor : _s.chip.borderColor,
        });
        chip.cursor = "pointer";
        chip.css.maxWidth = "100%";
        chip.role = "button";
        chip.elem.setAttribute("title", box.texts.applyHint);
        chip.tabIndex = 0;
        chip.clickable = 1;

            // LABEL: Name, drawn with the style (preview)
            const props = st.props;
            const lblPreview = Label({
                plainText: st.name,
                fontSize: Math.min(CHIP_FONT_MAX, Math.max(CHIP_FONT_MIN, props.fontSize)),
                textColor: props.textColor,
                color: props.color || "transparent",
                bold: props.bold,
                italic: props.italic,
                padding: props.color ? [6, 1] : 0,
                round: 4,
                ellipsis: 1,
            });
            lblPreview.css.maxWidth = "160px";

            // LABEL: Delete the style
            const btnX = Label({ text: LabelEditor.getCloseSvg(_s.chip.closeColor, 12), width: 18, height: 18, round: 9, clickable: 1 });
            btnX.elem.style.display = "flex";
            btnX.css = { alignItems: "center", justifyContent: "center" };
            btnX.lineHeight = "0";
            btnX.role = "button";
            btnX.aria = { label: box.texts.removeStyle + ": " + st.name };
            btnX.on("click", function (self, event) {
                event.stopPropagation();
                box.removeStyle(st.name);
            });

        endGroup();

        chip.on("click", function () {
            applyStyleToSelected(st.name);
        });
        chip.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            applyStyleToSelected(st.name);
        });

    };

    // Chips of the saved styles (with a small preview of each style).
    const renderChips = function () {
        if (!box.chipHolder) return;
        if (box.chipWrapper) box.chipWrapper.remove();
        createIn(box.chipHolder, function () {
            box.chipWrapper = HGroup({ width: "100%", height: "auto", align: "left top", gap: 6, wrap: 1 });
            box.chipWrapper.position = "relative";
            if (styles.length == 0) {
                Label({ plainText: box.texts.noStyles, width: "100%", fontSize: 12, textColor: _s.panel.hintColor });
            }
            styles.forEach(createChip);
            endGroup();
        });
    };

    // *** PANEL CONTROLS (views):

    // GROUP: A caption and its control(s). Close it with endGroup().
    const startField = function (caption) {
        const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 6 });
        group.css.alignItems = "stretch";
        Label({ plainText: caption, fontSize: 12, textColor: _s.panel.captionColor });
        return group;
    };

    // GROUP: Two fields side by side
    const startRow = function () {
        const row = HGroup({ width: "100%", height: "auto", align: "left top", gap: 12 });
        row.css.alignItems = "flex-start";
        return row;
    };

    // GROUP: A field in a row (half of it)
    const startHalfField = function (caption) {
        const group = startField(caption);
        group.width = "auto";
        group.css = { flex: "1 1 0", minWidth: "0" };
        return group;
    };

    // INPUT: basic.js Input
    const createTextInput = function (onInput) {
        const input = Input({
            width: "100%",
            height: _s.input.height,
            minimal: 1,
            fontSize: 14,
            color: _s.input.color,
            textColor: _s.input.textColor,
            round: _s.input.round,
            border: 1,
            borderColor: _s.input.borderColor,
        });
        const el = input.inputElement;
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.boxSizing = "border-box";
        el.style.padding = "0px 10px";
        el.style.backgroundColor = "transparent";
        el.style.color = _s.input.textColor;
        input.shrink = 0;
        el.addEventListener("focus", function () {
            input.borderColor = _s.input.focusColor;
        });
        el.addEventListener("blur", function () {
            input.borderColor = _s.input.borderColor;
        });
        el.addEventListener("input", function () {
            onInput(input.text);
        });
        return input;
    };

    // STEPPER: A number
    const createStepper = function (min, max, ariaLabel, key) {
        return Stepper({
            width: "100%", height: _s.input.height, value: min, min: min, max: max, ariaLabel: ariaLabel,
            styleName: _s.stepperStyleName, style: copyStyle(_s.stepperStyle),
            onChange: function (self) { setProp(key, self.value); },
        });
    };

    // SELECT COLOR: A color from the palette
    const createColor = function (key, onPick) {
        const picker = SelectColor({
            width: "100%", height: _s.input.height, colors: box.colorPalette.slice(),
            style: copyStyle(_s.selectColorStyle),
            onChange: function (self) {
                if (!self.value) return;
                if (onPick) {
                    onPick(self.value);
                    return;
                }
                setProp(key, self.value);
            },
        });
        return picker;
    };

    // TABS: Pill tabs, one is on (like a segmented control)
    const createPills = function (tabs, onPick) {
        return Tabs({
            width: "100%", variant: "pill", fullWidth: 1, tabs: tabs, value: tabs[0].key,
            styleName: _s.tabsStyleName, style: copyStyle(_s.tabsStyle),
            onChange: function (self) { onPick(self.value); },
        });
    };

    // CHECKBOX: On / off
    const createCheck = function (text, key) {
        return CheckBox({
            labelText: text, styleName: _s.checkBoxStyleName, style: copyStyle(_s.checkBoxStyle),
            onChange: function (self) { setProp(key, self.checked); },
        });
    };

    // BUTTON: basic.js Button in the colors of the editor
    const createEditorButton = function (text, isPrimary, onClick) {
        const colors = isPrimary ? _s.button : _s.secondaryButton;
        const btn = Button({
            text: text,
            width: "auto",
            height: _s.button.height,
            fontSize: _s.button.fontSize,
            color: colors.color,
            textColor: colors.textColor,
            round: _s.button.round,
        });
        // WHY: basic.css gives a Button an image and an inner shadow.
        btn.css = {
            backgroundImage: "none",
            boxShadow: "none",
            border: "0",
            padding: "0px 16px",
            whiteSpace: "nowrap",
            transition: BUTTON_MOTION,
        };
        btn.shrink = 0;
        btn.on("mouseenter", function () {
            btn.color = colors.hoverColor;
        });
        btn.on("mouseleave", function () {
            btn.color = colors.color;
        });
        btn.on("click", onClick);
        return btn;
    };

    // *** PUBLIC FUNCTIONS:

    // Adds a label at the end. select: 1 -> it is selected (the panel opens). Returns its index.
    box.addLabel = function (props = {}, select = 0) {
        labelCount++;
        const p = normalizeProps(props);
        if (!props || props.text === undefined) p.text = String(box.newLabel.text || "").replace("{n}", String(labelCount));
        const item = { props: p, styleName: "", styleChanged: 0, label: null };
        const styleName = props && props.styleName;
        if (styleName && findStyle(styleName)) item.styleName = styleName;
        items.push(item);
        createItemView(item);
        updateEmpty();
        if (select) {
            selectItem(item);
            item.label.elem.focus({ preventScroll: true });
        }
        labelsChanged();
        return items.length - 1;
    };
    // USAGE: editor.addLabel({ text: "Hello", fontSize: 24, bold: 1 })

    box.removeLabel = function (index) {
        const item = items[index];
        if (!item) return;
        if (item === selected) selectItem(null);
        items.splice(index, 1);
        item.label.remove();
        updateEmpty();
        const next = items[Math.min(index, items.length - 1)];
        if (next && box.elem.contains(document.activeElement) === false) next.label.elem.focus({ preventScroll: true });
        labelsChanged();
    };

    box.duplicateLabel = function (index) {
        const item = items[index];
        if (!item) return -1;
        const copy = Object.assign({}, item.props, { styleName: item.styleName });
        const newIndex = box.addLabel(copy, 0);
        items[newIndex].styleChanged = item.styleChanged;
        // The copy goes right under the original.
        box.moveLabel(newIndex, index + 1);
        selectItem(items[index + 1]);
        return index + 1;
    };

    box.moveLabel = function (fromIndex, toIndex) {
        const item = items[fromIndex];
        if (!item) return;
        const to = Math.max(0, Math.min(toIndex, items.length - 1));
        items.splice(fromIndex, 1);
        items.splice(to, 0, item);
        const next = items[to + 1];
        box.listWrapper.elem.insertBefore(item.label.elem, next ? next.label.elem : null);
        labelsChanged();
    };

    // index: -1 -> nothing is selected (the panel closes).
    box.selectLabel = function (index) {
        selectItem(items[index] || null);
    };

    box.getSelectedIndex = function () {
        return indexOfItem(selected);
    };

    box.getLabels = function () {
        return items.map(function (item) { return Object.assign({}, item.props, { styleName: item.styleName }); });
    };

    // onChange is not called.
    box.setLabels = function (list) {
        selectItem(null);
        labelCount = 0;
        items = (Array.isArray(list) ? list : []).map(function (src) {
            labelCount++;
            const styleName = (src && src.styleName && findStyle(src.styleName)) ? src.styleName : "";
            return { props: normalizeProps(src), styleName: styleName, styleChanged: 0, label: null };
        });
        renderList();
        box.labels = box.getLabels();
    };
    // USAGE: editor.setLabels(savedWork) // savedWork = editor.getLabels() from before

    // Saves the style of the label at index (default: the selected one) with a name.
    // The same name again: the style is updated, and every label that uses it gets the new style.
    box.saveStyle = function (name, index = -1) {
        const item = (index >= 0) ? items[index] : selected;
        name = String(name ?? "").trim();
        if (!item || !name) return 0;
        const props = pickStyleProps(item.props);
        const existing = findStyle(name);
        if (existing) existing.props = props;
        else styles.push({ name: name, props: props });
        item.styleName = name;
        item.styleChanged = 0;
        // Linked labels follow the style.
        let changedOthers = 0;
        items.forEach(function (other) {
            if (other !== item && other.styleName === name) {
                other.props = normalizeProps(Object.assign({}, other.props, props), other.props);
                other.styleChanged = 0;
                applyProps(other);
                changedOthers = 1;
            }
        });
        applyProps(item);
        stylesChanged();
        if (changedOthers || existing) labelsChanged();
        return 1;
    };
    // USAGE: editor.saveStyle("Title") // the selected label

    box.applyStyle = function (name, index = -1) {
        const item = (index >= 0) ? items[index] : selected;
        const st = findStyle(name);
        if (!item || !st) return 0;
        item.props = normalizeProps(Object.assign({}, item.props, st.props), item.props);
        item.styleName = st.name;
        item.styleChanged = 0;
        applyProps(item);
        if (item === selected) loadPanel();
        else renderChips();
        labelsChanged();
        return 1;
    };
    // USAGE: editor.applyStyle("Title", 2)

    // The labels that used it keep their look, they only lose the link.
    box.removeStyle = function (name) {
        const index = styles.findIndex(function (st) { return st.name === name; });
        if (index < 0) return;
        styles.splice(index, 1);
        items.forEach(function (item) {
            if (item.styleName !== name) return;
            item.styleName = "";
            item.styleChanged = 0;
            applyProps(item);
        });
        stylesChanged();
        labelsChanged();
    };

    box.getSavedStyles = function () {
        return styles.map(function (st) { return { name: st.name, props: Object.assign({}, st.props) }; });
    };

    // onStylesChange is not called. (It is saved to storageKey.)
    box.setSavedStyles = function (list) {
        styles = [];
        (Array.isArray(list) ? list : []).forEach(function (st) {
            const name = String((st && st.name) ?? "").trim();
            if (!name || findStyle(name)) return;
            styles.push({ name: name, props: pickStyleProps(normalizeProps(st.props)) });
        });
        box.savedStyles = box.getSavedStyles();
        saveStylesToStorage();
        renderChips();
        updatePanelStyleInfo();
    };

    box.refresh = function () {
        items.forEach(applyProps);
        updateEmpty();
    };


    // *** OBJECT VIEW:

    box.clipContent = 1;

    // GROUP: Header and list
    box.layout = VGroup({ width: "100%", height: "100%", align: "left top", gap: 0 });
    box.layout.css.alignItems = "stretch";

        // GROUP: Header (title, add button)
        box.header = HGroup({
            width: "100%",
            height: "auto",
            align: "left center",
            gap: 8,
            padding: [16, 10],
            color: _s.header.color,
        });
        box.header.shrink = 0;
        box.header.css.borderBottom = "1px solid " + _s.header.dividerColor;

            box.lblTitle = Label({ plainText: box.texts.title, fontSize: _s.header.titleSize, textColor: _s.header.titleColor, bold: 1 });
            box.lblTitle.css.flex = "1 1 0";

            box.btnAdd = createEditorButton(box.texts.addButton, 1, function () { box.addLabel({}, 1); });

        endGroup();

        // BOX: Holder of the list (and its ScrollBar)
        box.listHolder = startBox({ width: "100%", height: "auto", color: _s.list.color });
        box.listHolder.css = { flex: "1 1 0", minHeight: "0" };

            // BOX: Scrolling list area
            box.listArea = Box(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
            box.listArea.clickable = 1;

            // LABEL: Empty text
            box.lblEmpty = Label({
                plainText: box.texts.empty,
                width: "100%",
                top: 40,
                fontSize: 14,
                textColor: _s.list.emptyColor,
                textAlign: "center",
                padding: [24, 0],
                visible: 0,
            });

            if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
                const scrollBarParams = { scrollableBox: box.listArea, neverHide: 0, showDots: 0 };
                box.listScrollBar = ScrollBar(Object.assign(scrollBarParams, _s.scrollBar));
            }

        endBox();

    endGroup();

    // The focus is in the panel, or nowhere: it can go back to the label.
    const isFocusInPanelOrNowhere = function () {
        const active = document.activeElement;
        if (!active || active === document.body) return true;
        return !!(box.sidePanel && box.sidePanel.elem.contains(active));
    };

    // SIDE PANEL: Properties. Created on the page (SidePanel does it), at the right side of the screen.
    box.sidePanel = SidePanel({
        side: "right",
        panelSize: box.panelWidth,
        titleText: box.texts.panelTitle,
        ariaLabel: box.texts.panelTitle,
        showBackdrop: 0, // WHY: The labels stay clickable while the panel is open.
        closeOnEscape: 1,
        styleName: _s.sidePanelStyleName,
        style: copyStyle(_s.sidePanelStyle),
        onClose: function () {
            if (isClosingPanel || !box || !selected) return;
            const item = selected;
            selectItem(null);
            if (item.label && isFocusInPanelOrNowhere()) item.label.elem.focus({ preventScroll: true });
        },
    });
    box.own(box.sidePanel); // WHY: It is on the page, not in the box: removed with the box.

    box.sidePanel.startBody();

        // GROUP: Panel content
        box.panelContent = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.panel.gap });
        box.panelContent.css.alignItems = "stretch";

            startField(box.texts.text);
                controls.text = createTextInput(function (value) { setProp("text", value); });
                controls.text.inputElement.setAttribute("aria-label", box.texts.text);
            endGroup();

            startRow();
                startHalfField(box.texts.fontSize);
                    controls.fontSize = createStepper(LIMITS.fontSize.min, LIMITS.fontSize.max, box.texts.fontSize, "fontSize");
                endGroup();
                startHalfField(box.texts.fontStyle);
                    // GROUP: Bold, italic
                    VGroup({ width: "100%", height: "auto", align: "left top", gap: 4 });
                        controls.bold = createCheck(box.texts.bold, "bold");
                        controls.italic = createCheck(box.texts.italic, "italic");
                    endGroup();
                endGroup();
            endGroup();

            startField(box.texts.align);
                const alignTabs = [
                    { key: "left", text: box.texts.left },
                    { key: "center", text: box.texts.center },
                    { key: "right", text: box.texts.right },
                ];
                controls.align = createPills(alignTabs, function (value) {
                    setProp("textAlign", value);
                });
            endGroup();

            startField(box.texts.width);
                const widthTabs = [
                    { key: "auto", text: box.texts.widthAuto },
                    { key: "full", text: box.texts.widthFull },
                ];
                controls.width = createPills(widthTabs, function (value) {
                    setProp("fullWidth", (value === "full") ? 1 : 0);
                });
            endGroup();

            startField(box.texts.textColor);
                controls.textColor = createColor("textColor");
            endGroup();

            startField(box.texts.background);
                controls.background = createPills([{ key: "none", text: box.texts.none }, { key: "color", text: box.texts.colorOn }], function (value) {
                    setProp("color", (value === "color") ? controls.bgColor.value || DEFAULT_BACKGROUND : "");
                    controls.bgField.visible = (value === "color") ? 1 : 0;
                });
            endGroup();

            controls.bgField = startField(box.texts.backgroundColor);
                controls.bgColor = createColor("color");
            endGroup();

            startRow();
                startHalfField(box.texts.padding);
                    controls.padding = createStepper(LIMITS.padding.min, LIMITS.padding.max, box.texts.padding, "padding");
                endGroup();
                startHalfField(box.texts.round);
                    controls.round = createStepper(LIMITS.round.min, LIMITS.round.max, box.texts.round, "round");
                endGroup();
            endGroup();

            startRow();
                startHalfField(box.texts.border);
                    controls.border = createStepper(LIMITS.border.min, LIMITS.border.max, box.texts.border, "border");
                endGroup();
                startHalfField(box.texts.borderColor);
                    controls.borderColor = createColor("borderColor");
                endGroup();
            endGroup();

            // GROUP: Duplicate, delete
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                box.btnDuplicate = createEditorButton(box.texts.duplicate, 0, function () {
                    if (!selected) return;
                    box.duplicateLabel(indexOfItem(selected));
                });
                box.btnRemove = createEditorButton(box.texts.remove, 0, function () {
                    if (!selected) return;
                    box.removeLabel(indexOfItem(selected));
                });
                box.btnRemove.textColor = _s.secondaryButton.dangerTextColor;
            endGroup();

            // BOX: Divider
            Box({ width: "100%", height: 1, color: _s.panel.dividerColor });
            that.shrink = 0;

            // GROUP: Saved styles
            startField(box.texts.savedStyles);
                box.lblStyleInfo = Label({ plainText: "", width: "100%", fontSize: 12, textColor: _s.panel.textColor });
                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
                    controls.styleName = createTextInput(function () { controls.styleName.borderColor = _s.input.focusColor; });
                    controls.styleName.width = "auto";
                    controls.styleName.css = { flex: "1 1 0", minWidth: "0" };
                    controls.styleName.inputElement.placeholder = box.texts.styleNamePlaceholder;
                    controls.styleName.inputElement.setAttribute("aria-label", box.texts.styleNamePlaceholder);
                    box.btnSaveStyle = createEditorButton(box.texts.save, 1, function () {
                        const name = String(controls.styleName.text || "").trim();
                        if (!name) {
                            controls.styleName.inputElement.focus();
                            return;
                        }
                        box.saveStyle(name);
                    });
                endGroup();
                // BOX: Chips of the saved styles
                box.chipHolder = startBox({ width: "100%", height: "auto", color: "transparent" });
                endBox();
                Label({ plainText: box.texts.applyHint, width: "100%", fontSize: 11, textColor: _s.panel.hintColor });
            endGroup();

        endGroup();

    box.sidePanel.endBody();

    // *** OBJECT INIT CODE:

    controls.styleName.inputElement.addEventListener("keydown", function (event) {
        if (event.key !== "Enter") return;
        event.preventDefault();
        box.btnSaveStyle.elem.click();
    });

    const isClickOnEmptyList = function (event) {
        if (!box.listWrapper) return true;
        if (!box.listWrapper.elem.contains(event.target)) return true;
        return event.target === box.listWrapper.elem;
    };

    // A click on the empty part of the list closes the panel.
    box.listArea.on("click", function (self, event) {
        if (isClickOnEmptyList(event)) selectItem(null);
    });
    box.on("keydown", function (self, event) {
        if (event.key !== "Escape" || !selected) return;
        event.preventDefault();
        const item = selected;
        selectItem(null);
        item.label.elem.focus({ preventScroll: true });
    });

    // Saved styles: storage first, then the savedStyles parameter.
    let storedStyles = null;
    if (box.storageKey) {
        try {
            storedStyles = basic.storage.load(box.storageKey);
        } catch (e) {
            storedStyles = null;
        }
    }
    box.setSavedStyles(Array.isArray(storedStyles) ? storedStyles : startStyles);
    box.setLabels(startLabels);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

LabelEditor.getCloseSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: LabelEditor({ styleName: "dark" })
// USAGE: LabelEditor({ style: { selection: { color: "tomato" } } }) // Change only some keys.
// USAGE: LabelEditor({ style: LabelEditor.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// NOTE: xxxStyleName / xxxStyle: the style package and the style changes of the components in the panel.
LabelEditor.styles = {

    // Light gray work area, white header and panel.
    classic: LabelEditorDefaults.style,

    // Dark theme, same colors as SidePanel, Stepper and Tabs "dark".
    dark: {
        box: { color: "#1C1C1B", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", round: 10 },
        header: { color: "#232322", dividerColor: "rgba(255, 255, 255, 0.08)", titleColor: "rgba(255, 255, 255, 0.9)", titleSize: 15 },
        list: { color: "#1C1C1B", padding: 24, gap: 12, emptyColor: "rgba(255, 255, 255, 0.4)" },
        selection: { color: "#65A293", hoverColor: "rgba(101, 162, 147, 0.45)" },
        button: { color: "#3D7A6B", textColor: White(1), hoverColor: "#4A8A7A", round: 6, fontSize: 13, height: 36 },
        secondaryButton: { color: "rgba(255, 255, 255, 0.08)", textColor: "rgba(255, 255, 255, 0.85)", hoverColor: "rgba(255, 255, 255, 0.14)", dangerTextColor: "#E57B6B" },
        panel: { dividerColor: "rgba(255, 255, 255, 0.08)", gap: 18, captionColor: "rgba(255, 255, 255, 0.5)", textColor: "rgba(255, 255, 255, 0.9)", hintColor: "rgba(255, 255, 255, 0.4)" },
        input: { color: "#2A2A29", borderColor: "rgba(255, 255, 255, 0.12)", focusColor: "#65A293", textColor: "rgba(255, 255, 255, 0.9)", round: 6, height: 38 },
        chip: { color: "#2A2A29", borderColor: "rgba(255, 255, 255, 0.12)", activeBorderColor: "#65A293", round: 16, closeColor: "rgba(255, 255, 255, 0.5)" },
        sidePanelStyleName: "dark",
        stepperStyleName: "dark",
        tabsStyleName: "dark",
        checkBoxStyleName: "classic",
        // WHY: CheckBox and SelectColor have no dark package. Their colors are given here.
        checkBoxStyle: {
            mark: { color: "#2A2A29", borderColor: "rgba(255, 255, 255, 0.3)" },
            checkedMark: { color: "#3D7A6B", borderColor: "#3D7A6B" },
            hoverMark: { borderColor: "rgba(255, 255, 255, 0.6)" },
            label: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.85)" },
        },
        selectColorStyle: {
            field: { color: "#2A2A29", borderColor: "rgba(255, 255, 255, 0.12)" },
            fieldHover: { borderColor: "rgba(255, 255, 255, 0.3)" },
            fieldFocus: { borderColor: "#65A293" },
            fieldText: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.9)" },
            placeholder: { textColor: "rgba(255, 255, 255, 0.4)" },
            panel: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)" },
            swatch: { borderColor: "rgba(255, 255, 255, 0.15)" },
        },
        scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD", bar_width: 4, bar_round: 3, bar_opacity: 0.4, bar_mouseOverOpacity: 0.9, bar_padding: 2 },
    },

};
