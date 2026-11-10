/* Bismillah */

/*

Color Picker - v26.11

UI COMPONENT TEMPLATE
- A color picker: a field that opens a palette (popup), or an always visible palette (inline: 1).
- The palette is a simple grid of colors. A click selects the color and closes the panel.
- The selected color has a mark (a dot) in a color that can be seen on it (light or dark).
- Everything is drawn with code (no image files needed).
- Value: the color text. (Ex: "#3871E0")
- Style packages: "light" (default; the old name "classic" works too), "dark", "minimal", "minimalDark" (a package of
  params: its height too). Select with styleName. (ColorPicker.styles)

Keyboard:
- Field: Enter, Space or ArrowDown opens the panel.
- Panel: Arrow keys select the color next to the selected one, Enter or Escape closes.

USAGE:
const picker = ColorPicker({
    width: 170,
    selectedColor: "#3871E0",
    onChange: function (self) { page.color = self.value; },
});
picker.setColor("#D64545");
picker.setColors(["#000000", "#FFFFFF"]);   // Your own palette

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ColorPickerDefaults = {
    key: "0",
    width: 170, // Field width (not used if inline: 1)
    height: 44, // Field height (not used if inline: 1)
    selectedColor: "", // "#3871E0" or "" (nothing is selected). WHY: not "color", Box.color is the background.
    colors: [ // The palette. Any CSS color text is accepted. ("red", "rgb(0, 0, 0)"...)
        "#141414", "#5A5A5A", "#9A9A9A", "#D0D0D0", "#FFFFFF",
        "#D64545", "#E0A038", "#E8D44D", "#5DB182", "#3E8E62",
        "#3871E0", "#5AA9E6", "#7B61D9", "#B45FC0", "#E06AA0",
        "#8D6E63", "#C89F7B", "#2E4A7D", "#1F6F6B", "#7A8B2E",
    ],
    columns: 5,
    showText: 1, // 1: The color text is written in the field.
    placeholder: "Select color",
    inline: 0, // 1: The palette is always visible, no field.
    enabled: 1,
    closeOnSelect: 1,
    onChange: function (self) { }, // self.value ("#3871E0" or "")
    onOpen: function (self) { },
    onClose: function (self) { },
    styleName: "light", // "light" ("classic": its old name), "dark", "minimal", "minimalDark" or a name added to ColorPicker.styles
    style: { // Light style package (default)
        field: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
            padding: [10, 0],
            gap: 10,
        },
        fieldHover: {
            borderColor: Black(0.5),
        },
        fieldFocus: {
            borderColor: "#141414",
        },
        fieldText: {
            fontSize: 15,
            textColor: Black(0.85),
        },
        placeholder: {
            textColor: Black(0.4),
        },
        fieldSwatch: {
            width: 24,
            height: 24,
            round: 5,
        },
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 10,
            padding: 12,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        },
        swatch: {
            size: 28,
            gap: 8,
            round: 6,
            border: 1,
            borderColor: Black(0.15), // WHY: A white swatch is not visible on a white panel.
        },
        mark: {
            size: 10, // The dot on the selected color
            lightColor: White(0.95), // On a dark color
            darkColor: Black(0.7), // On a light color
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const ColorPicker = function (params = {}) {

    // Merge style package: params.style > ColorPicker.styles[styleName] > ColorPickerDefaults.style (light)
    basic.applyStylePackage(params, ColorPicker.styles, ColorPickerDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ColorPickerDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    if (params.inline == 1) {
        params.width = "auto";
        params.height = "auto";
    }

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const swatchSize = _s.swatch.size;
    const columns = Math.max(1, basic.num(box.columns) || 1);
    const gridWidth = (swatchSize * columns) + (_s.swatch.gap * (columns - 1));

    let isOpen = 0;
    let isMouseOver = 0;
    let swatches = []; // Created swatch boxes, in the order of box.colors
    const PANEL_SPACE = 6; // Between the field and the panel
    const PAGE_MARGIN = 8; // The panel stays this far from the edges of the page
    const OVERLAY_Z_INDEX = 1000;
    const PANEL_Z_INDEX = 1001; // Over the overlay

    // *** PUBLIC VARIABLES:
    // [var] Selected color: "#3871E0" or ""
    box.value = ColorPicker.normalize(box.selectedColor);

    // *** PRIVATE FUNCTIONS:

    const updateField = function () {

        if (box.inline == 1) return;

        const hasValue = (box.value !== "");
        box.fieldSwatch.visible = (hasValue) ? 1 : 0;
        box.fieldSwatch.color = (hasValue) ? box.value : "transparent";

        box.fieldText.visible = (box.showText == 1) ? 1 : 0;
        box.fieldText.plainText = (hasValue) ? box.value : box.placeholder;
        box.fieldText.textColor = (hasValue) ? _s.fieldText.textColor : _s.placeholder.textColor;

        let borderColor = _s.field.borderColor;
        if (isMouseOver && box.enabled == 1) borderColor = _s.fieldHover.borderColor;
        if (isOpen) borderColor = _s.fieldFocus.borderColor;
        box.field.borderColor = borderColor;

        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.aria = {
            expanded: (isOpen) ? "true" : "false",
            disabled: (box.enabled == 1) ? "false" : "true",
        };

    };

    // Shows the mark on the selected swatch only.
    const renderPanel = function () {

        swatches.forEach(function (swatch) {
            swatch.mark.visible = (swatch.colorText == box.value && box.value !== "") ? 1 : 0;
        });

        if (box.inline == 1) {
            box.panel.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
            box.panel.clickable = (box.enabled == 1) ? 1 : 0;
        }

    };

    const createSwatch = function (colorText) {

        // BOX: One color
        const swatch = startBox({
            width: swatchSize,
            height: swatchSize,
            color: colorText,
            round: _s.swatch.round,
            border: _s.swatch.border,
            borderColor: _s.swatch.borderColor,
            clickable: 1,
            cursor: "pointer",
            css: { flexShrink: "0" },
        });
        swatch.colorText = colorText;
        swatch.elem.title = colorText;
        swatch.role = "option";

            // BOX: Selected mark
            swatch.mark = Box({
                width: _s.mark.size,
                height: _s.mark.size,
                round: 100,
                color: (ColorPicker.isLight(colorText)) ? _s.mark.darkColor : _s.mark.lightColor,
                visible: 0,
            });
            swatch.mark.center();

        endBox();

        swatch.on("click", function () {
            if (box.enabled != 1) return;
            box.setColor(colorText);
            if (box.inline != 1 && box.closeOnSelect == 1) {
                box.close();
                box.elem.focus();
            }
        });

        return swatch;

    };

    const renderSwatches = function () {

        swatches.forEach(function (swatch) { swatch.remove(); });
        swatches = [];

        // WHY: One createIn() for each swatch: the mark inside a swatch changes the default container.
        swatches = box.colors.map(function (colorText) {
            return createIn(box.grid, function () { return createSwatch(ColorPicker.normalize(colorText)); });
        });

        renderPanel();

    };

    // Position the popup panel under (or above) the field.
    const positionPanel = function () {

        const rect = box.elem.getBoundingClientRect();
        const panelWidth = box.panel.elem.offsetWidth;
        const panelHeight = box.panel.elem.offsetHeight;

        let left = withPageZoom(rect.left);
        let top = withPageZoom(rect.bottom) + PANEL_SPACE;

        if (top + panelHeight > page.height - PAGE_MARGIN) {
            top = withPageZoom(rect.top) - panelHeight - PANEL_SPACE; // Open above
        }

        box.panel.left = Math.max(PAGE_MARGIN, Math.min(left, page.width - panelWidth - PAGE_MARGIN));
        box.panel.top = Math.max(PAGE_MARGIN, top);

    };

    const onPageResize = function () {
        if (isOpen) box.close();
    };

    // Select the color next to the selected one. (Keyboard)
    const moveValue = function (step) {

        if (!swatches.length) return;

        const current = swatches.findIndex(function (swatch) { return swatch.colorText == box.value; });
        let index = (current < 0) ? 0 : current + step;

        if (index < 0 || index >= swatches.length) return;
        box.setColor(swatches[index].colorText);

    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;

        // Field is focused and the panel is closed:
        if (box.inline != 1 && !isOpen) {
            if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                event.preventDefault();
                box.open();
            }
            return;
        }

        if (event.key === "Escape" || event.key === "Enter") {
            if (box.inline == 1) return;
            event.preventDefault();
            box.close();
            box.elem.focus();
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            moveValue((event.key === "ArrowLeft") ? -1 : 1);
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            moveValue((event.key === "ArrowUp") ? -columns : columns);
        }

    };

    // *** PUBLIC FUNCTIONS:

    box.setColor = function (colorText, silent = 0) {

        const newColor = ColorPicker.normalize(colorText);
        if (newColor === box.value) return;

        box.value = newColor;
        updateField();
        renderPanel();

        if (!silent) box.onChange(box);

    };
    // USAGE: get: picker.value, set: picker.setColor("#D64545"), picker.setColor("")
    // NOTE: setColor(color, 1) changes the value without calling onChange.

    box.getColor = function () {
        return box.value;
    };

    // Change the palette. (The selected color is kept, even if it is not in the list.)
    box.setColors = function (colors) {
        box.colors = (colors || []).slice();
        renderSwatches();
    };
    // USAGE: picker.setColors(["#000000", "#FFFFFF", "red"])

    box.open = function () {

        if (box.inline == 1 || isOpen || box.enabled != 1) return;
        isOpen = 1;

        // WHY at open: a field in a Dialog or a SidePanel (their layer is over 1001) opens its list over them
        const layerZIndex = basic.zIndexAbove(box, OVERLAY_Z_INDEX);
        box.overlay.zIndex = layerZIndex;
        box.panel.zIndex = layerZIndex + 1;
        box.overlay.visible = 1;
        box.panel.visible = 1;
        positionPanel();
        box.panel.elem.focus({ preventScroll: true });

        updateField();
        box.onOpen(box);

    };

    box.close = function () {

        if (box.inline == 1 || !isOpen) return;
        isOpen = 0;

        box.overlay.visible = 0;
        box.panel.visible = 0;

        updateField();
        box.onClose(box);

    };

    box.toggle = function () {
        if (isOpen) {
            box.close();
        } else {
            box.open();
        }
    };

    box.isOpen = function () {
        return isOpen;
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        if (box.enabled != 1) box.close();
        updateField();
        renderPanel();
    };
    // USAGE: get: picker.enabled, set: picker.setEnabled(0)

    box.refresh = function () {
        updateField();
        renderPanel();
    };


    // *** OBJECT VIEW:
    box.css.outline = "none";

    // FIELD: (only popup mode)
    if (box.inline != 1) {

        box.clickable = 1;
        box.role = "combobox";

        // GROUP: Field (swatch + text)
        box.field = HGroup({
            width: "100%",
            height: "100%",
            align: "left center",
            gap: _s.field.gap,
            color: _s.field.color,
            border: _s.field.border,
            borderColor: _s.field.borderColor,
            round: _s.field.round,
            padding: _s.field.padding,
        });
        box.field.setMotion("border-color 0.15s");

            // BOX: Selected color
            box.fieldSwatch = Box({
                width: _s.fieldSwatch.width,
                height: _s.fieldSwatch.height,
                round: _s.fieldSwatch.round,
                border: _s.swatch.border,
                borderColor: _s.swatch.borderColor,
                css: { flexShrink: "0" },
            });

            // LABEL: Color text
            box.fieldText = Label({
                width: "auto",
                fontSize: _s.fieldText.fontSize,
                textColor: _s.fieldText.textColor,
                ellipsis: 1,
                grow: 1,
            });

        endGroup();

    }

    // POPUP: Create the overlay and the panel on the page, over everything.
    // WHY: Creating them directly on the page is safer than moving them later.
    if (box.inline != 1) {

        setDefaultContainerBox(page);
        // NOTE: endGroup() of the panel below returns the default container to the component box.

        // BOX: Transparent overlay (click outside: close)
        // WHY a very big box and not 100% x 100%: with position "fixed" the "100%" is taken from the nearest parent
        //     that has a zoom or a transform (page.fit); there the overlay had no height and a click outside the
        //     panel did not close it (the same fix as SelectBox).
        const OVERLAY_SIZE = 20000; // px
        box.overlay = Box(-OVERLAY_SIZE, -OVERLAY_SIZE, OVERLAY_SIZE * 2, OVERLAY_SIZE * 2, { color: "transparent" });
        box.overlay.css.position = "fixed";
        box.overlay.zIndex = OVERLAY_Z_INDEX;
        box.overlay.on("click", function () { box.close(); });

    }

    // BOX: Palette panel
    box.panel = VGroup({
        width: gridWidth + (_s.panel.padding * 2) + (_s.panel.border * 2),
        height: "auto",
        align: "left top",
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        round: _s.panel.round,
        padding: _s.panel.padding,
        boxShadow: _s.panel.shadow,
    });
    box.panel.css.outline = "none";
    box.panel.tabIndex = -1;
    box.panel.clickable = 1;
    box.panel.role = "listbox";

        // GROUP: Color grid (the swatches are created by renderSwatches)
        box.grid = HGroup({
            width: gridWidth,
            height: "auto",
            align: "left top",
            gap: _s.swatch.gap,
            wrap: 1, // WHY: The grid rows are made by the wrap, so any number of colors fits.
        });

        endGroup();

    endGroup();

    if (box.inline != 1) {
        box.panel.zIndex = PANEL_Z_INDEX;
        box.overlay.visible = 0;
        box.panel.visible = 0;
    }

    // *** OBJECT INIT CODE:

    if (box.inline != 1) {

        box.on("click", function () { box.toggle(); });
        box.on("keydown", onKeyDown);

        box.on("mouseover", function () {
            isMouseOver = 1;
            updateField();
        });

        box.on("mouseout", function () {
            isMouseOver = 0;
            updateField();
        });

        // (onPageResize / own: the overlay and the panel are on the page, they are removed with the box)
        box.onPageResize(onPageResize);
        box.own(box.overlay);
        box.own(box.panel);

    } else {
        box.panel.tabIndex = 0;
        // WHY: Component size is "auto". A relative panel makes the container wrap it.
        box.panel.position = "relative";
    }

    box.panel.on("keydown", onKeyDown);
    // WHY: Keep the keyboard focus on the panel when a swatch is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;

    box.setColors(params.colors); // WHY: Copy the array. The default list must not be shared between components.
    updateField();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// "#abc" -> "#AABBCC", "#aabbcc" -> "#AABBCC". Another color text ("red") is not changed.
ColorPicker.normalize = function (colorText) {

    const text = String(colorText || "").trim();
    if (text === "") return "";

    const short = /^#([0-9a-fA-F]{3})$/.exec(text);
    if (short) {
        return "#" + short[1].toUpperCase().replace(/./g, function (char) { return char + char; });
    }

    const long = /^#([0-9a-fA-F]{6})$/.exec(text);
    return (long) ? "#" + long[1].toUpperCase() : text;

};
// USAGE: ColorPicker.normalize("#abc") -> "#AABBCC"

// Is a dark text readable on this color? (Any CSS color text is accepted.)
ColorPicker.isLight = function (colorText) {
    const rgb = ColorPicker.toRgb(colorText);
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 160;
};
// USAGE: ColorPicker.isLight("#FFFFFF") -> true

// Any CSS color text -> { r, g, b }. (The browser does the work.)
ColorPicker.toRgb = function (colorText) {

    const elem = document.createElement("div");
    elem.style.display = "none";
    elem.style.color = "rgb(0, 0, 0)";
    elem.style.color = String(colorText); // WHY: An unknown color text is not written, black stays.

    document.body.appendChild(elem);
    const computed = getComputedStyle(elem).color;
    document.body.removeChild(elem);

    const parts = /(\d+)[^\d]+(\d+)[^\d]+(\d+)/.exec(computed);
    if (!parts) return { r: 0, g: 0, b: 0 };
    return { r: basic.num(parts[1]), g: basic.num(parts[2]), b: basic.num(parts[3]) };

};
// USAGE: ColorPicker.toRgb("gold") -> { r: 255, g: 215, b: 0 }

// *** STYLE PACKAGES:
// USAGE: ColorPicker({ styleName: "dark" })
// USAGE: ColorPicker({ styleName: "dark", style: { swatch: { round: 14 } } }) // Change only some keys.
// USAGE: ColorPicker({ style: ColorPicker.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: ColorPicker.styles.myStyle = { swatch: { round: 14 } };
ColorPicker.styles = {

    // White, dark text, a soft line.
    light: ColorPickerDefaults.style,

    // Dark theme, same colors as SelectBox "dark".
    dark: {
        field: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.10)", round: 8 },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldText: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)" },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        panel: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)", shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
        swatch: { borderColor: "rgba(255, 255, 255, 0.15)" }, // WHY: A dark swatch is not visible on a dark panel.
    },

};
ColorPicker.styles.classic = ColorPicker.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): a 28 px field as the other minimal fields with a 16 px swatch; the
// palette on the ground of the window with a line and no shadow, 22 px swatches with a soft line (a light color
// shows on a light window too). minimalDark: the same on a dark window.
ColorPicker.createMinimalStyle = function (colors) {
    return {
        height: 28,
        style: {
            field: { color: "transparent", border: 1, borderColor: colors.edge, round: 4, padding: [8, 0], gap: 8 },
            fieldHover: { borderColor: colors.edgeHover },
            fieldFocus: { borderColor: colors.ink },
            fieldText: { fontSize: 13, textColor: colors.text },
            placeholder: { textColor: colors.faintText },
            fieldSwatch: { width: 16, height: 16, round: 3 },
            panel: { color: colors.ground, border: 1, borderColor: colors.line, round: 4, padding: 8, shadow: "none" },
            swatch: { size: 22, gap: 6, round: 4, border: 1, borderColor: colors.line },
            mark: { size: 8 },
            disabled: { opacity: 0.4 },
        },
    };
};
ColorPicker.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", hover: Black(0.05), off: Black(0.25) };
ColorPicker.styles.minimal = ColorPicker.createMinimalStyle(ColorPicker.MINIMAL_COLORS);
ColorPicker.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", hover: White(0.07), off: White(0.25) };
ColorPicker.styles.minimalDark = ColorPicker.createMinimalStyle(ColorPicker.MINIMAL_DARK_COLORS);
