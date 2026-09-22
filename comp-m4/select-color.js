/* Bismillah */

/*

Select Color - v26.09

UI COMPONENT TEMPLATE
- A color picker: a field that opens a palette (popup), or an always visible palette (inline: 1).
- The palette is a simple grid of colors. A click selects the color and closes the panel.
- The selected color has a mark (a dot) in a color that can be seen on it (light or dark).
- Everything is drawn with code (no image files needed).
- Value: the color text. (Ex: "#3871E0")

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
    style: {
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
    const columns = Math.max(1, num(box.columns) || 1);
    const gridWidth = (swatchSize * columns) + (_s.swatch.gap * (columns - 1));

    let isOpen = 0;
    let isMouseOver = 0;
    let swatches = []; // Created swatch boxes, in the order of box.colors

    // *** PUBLIC VARIABLES:
    // [var] Selected color: "#3871E0" or ""
    box.value = SelectColor.normalize(box.selectedColor);

    // *** PRIVATE FUNCTIONS:

    const updateField = function () {

        if (box.inline == 1) return;

        box.fieldSwatch.visible = (box.value !== "") ? 1 : 0;
        box.fieldSwatch.color = (box.value !== "") ? box.value : "transparent";

        box.fieldText.visible = (box.showText == 1) ? 1 : 0;
        box.fieldText.plainText = (box.value !== "") ? box.value : box.placeholder;
        box.fieldText.textColor = (box.value !== "") ? _s.fieldText.textColor : _s.placeholder.textColor;

        let borderColor = _s.field.borderColor;
        if (isMouseOver && box.enabled == 1) borderColor = _s.fieldHover.borderColor;
        if (isOpen) borderColor = _s.fieldFocus.borderColor;
        box.field.borderColor = borderColor;

        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.elem.setAttribute("aria-expanded", (isOpen) ? "true" : "false");
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");

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
        swatch.elem.setAttribute("role", "option");

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

        createIn(box.grid, function () {
            box.colors.forEach(function (colorText) {
                setDefaultContainerBox(box.grid); // WHY: The mark inside the swatch changes the default container.
                swatches.push(createSwatch(SelectColor.normalize(colorText)));
            });
        });

        renderPanel();

    };

    // Position the popup panel under (or above) the field.
    const positionPanel = function () {

        const rect = box.elem.getBoundingClientRect();
        const panelWidth = box.panel.elem.offsetWidth;
        const panelHeight = box.panel.elem.offsetHeight;
        const space = 6;

        let left = withPageZoom(rect.left);
        let top = withPageZoom(rect.bottom) + space;

        if (top + panelHeight > page.height - 8) {
            top = withPageZoom(rect.top) - panelHeight - space; // Open above
        }

        box.panel.left = Math.max(8, Math.min(left, page.width - panelWidth - 8));
        box.panel.top = Math.max(8, top);

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
        (isOpen) ? box.close() : box.open();
    };

    box.isOpen = function () {
        return isOpen;
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1) box.close();
        updateField();
        renderPanel();
    };
    // USAGE: get: picker.enabled, set: picker.setEnabled(0)

    box.refresh = function () {
        updateField();
        renderPanel();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        page.remove_onResize(onPageResize);

        // Remove the objects that were created on the page.
        if (box.inline != 1) {
            box.overlay.remove();
            box.panel.remove();
        }

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };
    // USAGE: picker.remove();

    // *** OBJECT VIEW:
    box.elem.style.outline = "none";

    // FIELD: (only popup mode)
    if (box.inline != 1) {

        box.clickable = 1;
        box.elem.setAttribute("role", "combobox");

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
        box.overlay.elem.style.position = "fixed";
        box.overlay.elem.style.zIndex = "1000";
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
    box.panel.elem.style.outline = "none";
    box.panel.elem.tabIndex = -1;
    box.panel.clickable = 1;
    box.panel.elem.setAttribute("role", "listbox");

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
        box.panel.elem.style.zIndex = "1001";
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

        page.onResize(onPageResize);

    } else {
        box.panel.elem.tabIndex = 0;
        // WHY: Component size is "auto". A relative panel makes the container wrap it.
        box.panel.position = "relative";
    }

    box.panel.on("keydown", onKeyDown);
    // WHY: Keep the keyboard focus on the panel when a swatch is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;

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
    return (parts) ? { r: num(parts[1]), g: num(parts[2]), b: num(parts[3]) } : { r: 0, g: 0, b: 0 };

};
// USAGE: SelectColor.toRgb("gold") -> { r: 255, g: 215, b: 0 }
