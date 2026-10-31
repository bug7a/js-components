/* Bismillah */

/*

Select Color - v26.09

UI COMPONENT TEMPLATE
- A color picker: a field that opens a palette (popup), or an always visible palette (inline: 1).
- The palette is a simple grid of colors. A click selects the color and closes the panel.
- The selected color has a mark (a dot) in a color that can be seen on it (light or dark).
- Everything is drawn with code (no image files needed).
- Value: the color text. (Ex: "#3871E0")
- Style packages: "classic" (default), "dark". Select with styleName. (SelectColor.styles)

Keyboard:
- Field: Enter, Space or ArrowDown opens the panel.
- Panel: Arrow keys select the color next to the selected one, Enter or Escape closes.

USAGE:
const picker = SelectColor({
    width: 170,
    selectedColor: "#3871E0",
    onChange: function (self) { page.color = self.value; },
});
picker.setColor("#D64545");
picker.setColors(["#000000", "#FFFFFF"]);   // Your own palette

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SelectColorDefaults = {
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
    styleName: "classic", // "classic", "dark" or a name added to SelectColor.styles
    style: { // Classic style package (default)
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

const SelectColor = function (params = {}) {

    // Merge style package: params.style > SelectColor.styles[styleName] > SelectColorDefaults.style (classic)
    basic.applyStylePackage(params, SelectColor.styles, SelectColorDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SelectColorDefaults);

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
    box.value = SelectColor.normalize(box.selectedColor);

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
                color: (SelectColor.isLight(colorText)) ? _s.mark.darkColor : _s.mark.lightColor,
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
            return createIn(box.grid, function () { return createSwatch(SelectColor.normalize(colorText)); });
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

        const newColor = SelectColor.normalize(colorText);
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
        box.overlay = Box(0, 0, "100%", "100%", { color: "transparent" });
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
SelectColor.normalize = function (colorText) {

    const text = String(colorText || "").trim();
    if (text === "") return "";

    const short = /^#([0-9a-fA-F]{3})$/.exec(text);
    if (short) {
        return "#" + short[1].toUpperCase().replace(/./g, function (char) { return char + char; });
    }

    const long = /^#([0-9a-fA-F]{6})$/.exec(text);
    return (long) ? "#" + long[1].toUpperCase() : text;

};
// USAGE: SelectColor.normalize("#abc") -> "#AABBCC"

// Is a dark text readable on this color? (Any CSS color text is accepted.)
SelectColor.isLight = function (colorText) {
    const rgb = SelectColor.toRgb(colorText);
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 160;
};
// USAGE: SelectColor.isLight("#FFFFFF") -> true

// Any CSS color text -> { r, g, b }. (The browser does the work.)
SelectColor.toRgb = function (colorText) {

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
// USAGE: SelectColor.toRgb("gold") -> { r: 255, g: 215, b: 0 }

// *** STYLE PACKAGES:
// USAGE: SelectColor({ styleName: "dark" })
// USAGE: SelectColor({ styleName: "dark", style: { swatch: { round: 14 } } }) // Change only some keys.
// USAGE: SelectColor({ style: SelectColor.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SelectColor.styles.myStyle = { swatch: { round: 14 } };
SelectColor.styles = {

    // White, dark text, a soft line.
    classic: SelectColorDefaults.style,

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
