/* Bismillah */

/*

MinimalAccent - v26.11

HELPER
- The minimal theme (_designs/minimal-theme.htm) in a color of the page. MinimalAccent.addPackages(name, color) gives
  every minimal component loaded before it two new packages: name (a light window) and name + "Dark" (a dark window).
- The color goes where the minimal theme draws its ink: a toggle that is on, a checked box, the fill of a slider and
  of a progress bar, the selected tab, row and day, the edge of a field while typing, the main button. The lines, the
  texts and the focus ring stay as they are.
- The text on the color (a selected day, the value of a slider): white or dark, the one that reads better on it.
- The dark window takes darkColor; without it, the same color made lighter until it reads on the dark ground (4.5:1).
  The light window takes the color as it is: choose one that reads on white (4.5:1, Ex: "#2A78D6"), it is the text of
  a selected tab too.
- SmartButton: the templates name / name + "Dark" (the minimal ones) and the tones name / name + "Dark" (the main
  action in the color). Toast: the themes (the action text in the color). Tooltip: the looks. GraphBox keeps its
  minimal theme (its series have their own colors).
- A component makes its minimal packages with X.createMinimalStyle(X.MINIMAL_COLORS) (and X.MINIMAL_DARK_COLORS): the
  new ones come from the same function. A component with minimal packages and without those colors gets them as
  they are under the new names.
- Call it after the components are loaded (Ex: at the start of start()); a component loaded later does not have them.

USAGE:
const look = MinimalAccent.addPackages("minimalBlue", "#2A78D6"); // { light: "minimalBlue", dark: "minimalBlueDark" }
Toggle({ styleName: "minimalBlue", value: 1 });
CheckBox({ styleName: "minimalBlue", text: "Remember me" });
SmartButton({ styleName: "minimalBlue", tone: "minimalBlue", labelText: "Save" }); // the main action
Toast.show({ messageText: "Saved", theme: "minimalBlue" });
MinimalAccent.addPackages("minimalGreen", "#1F7A5C", "#7FE3B5"); // the color of the dark window too

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

const MinimalAccent = {};

// The components that have minimal packages, by name: one that is not loaded is skipped.
MinimalAccent.COMPONENTS = [
    "Accordion", "ChatView", "CheckBox", "ContextMenu", "DataTable", "Dialog", "TextField", "ItemList", "JsonEditor", "LoadingScreen",
    "MenuBar", "ProgressBar", "RadioButton", "RangeSlider", "ScrollArea", "SearchInput", "SelectBox", "ColorPicker",
    "DatePicker", "FilePicker", "TimePicker", "SidePanel", "Slider", "SliderField", "SmartTable", "Splitter", "StatusBar",
    "StepBar", "Stepper", "Tabs", "TagInput", "TimeLine", "Toggle", "ToolBar", "TreeView",
];
MinimalAccent.WHITE = "#FFFFFF";
MinimalAccent.DARK_GROUND = "#1A1A19"; // the ground of a dark minimal window, and the dark text on a light color
MinimalAccent.READABLE_CONTRAST = 4.5; // WCAG for a text
MinimalAccent.HOVER_SHADE = 0.12; // the color under the mouse: 12 % darker on a light window, lighter on a dark one
MinimalAccent.VERY_DARK = 0.03; // a luminance under it gets lighter under the mouse (darker would not be seen)
MinimalAccent.LIGHTEN_STEP = 0.05;

// *** PUBLIC FUNCTIONS:

// Makes the packages name and name + "Dark" and returns their names: { light, dark }.
MinimalAccent.addPackages = function (name, color, darkColor = "") {
    const names = { light: name, dark: name + "Dark" };
    const lightInk = MinimalAccent.createInk(color, "light");
    const darkInk = MinimalAccent.createInk(darkColor || MinimalAccent.lightenForDarkGround(color), "dark");
    for (const componentName of MinimalAccent.COMPONENTS) {
        const component = MinimalAccent.findComponent(componentName);
        if (!component || !component.styles || !component.styles.minimal) continue;
        component.styles[names.light] = MinimalAccent.createPackage(component, "light", lightInk, names);
        component.styles[names.dark] = MinimalAccent.createPackage(component, "dark", darkInk, names);
    }
    MinimalAccent.addButtonLooks(names, lightInk, darkInk);
    MinimalAccent.addToastThemes(names, lightInk, darkInk);
    MinimalAccent.addTooltipLooks(names);
    return names;
};

// The colors a package takes from one color: { ink, inkHover, onInk }.
MinimalAccent.createInk = function (color, theme) {
    const rgb = MinimalAccent.toRgb(color);
    const isVeryDark = (MinimalAccent.luminance(rgb) < MinimalAccent.VERY_DARK);
    const isLighterUnderMouse = (theme === "dark") || isVeryDark;
    const hoverTarget = MinimalAccent.toRgb(isLighterUnderMouse ? MinimalAccent.WHITE : "#000000");
    return {
        ink: MinimalAccent.toHex(rgb),
        inkHover: MinimalAccent.toHex(MinimalAccent.mix(rgb, hoverTarget, MinimalAccent.HOVER_SHADE)),
        onInk: MinimalAccent.textOn(rgb),
    };
};

// The color of a dark window from the color of a light one: lighter, until it reads on the dark ground.
MinimalAccent.lightenForDarkGround = function (color) {
    const rgb = MinimalAccent.toRgb(color);
    const ground = MinimalAccent.toRgb(MinimalAccent.DARK_GROUND);
    const white = MinimalAccent.toRgb(MinimalAccent.WHITE);
    for (let amount = 0; amount < 1; amount += MinimalAccent.LIGHTEN_STEP) {
        const lighter = MinimalAccent.mix(rgb, white, amount);
        if (MinimalAccent.contrast(lighter, ground) >= MinimalAccent.READABLE_CONTRAST) return MinimalAccent.toHex(lighter);
    }
    return MinimalAccent.WHITE;
};

// *** PRIVATE FUNCTIONS:

// A component by its name, or null when it is not loaded.
// WHY Function(): the components are top-level "const" (const Toggle = function...), so they are not on window; only
//      the fixed names of this file go in.
MinimalAccent.findComponent = function (name) {
    return Function("return (typeof " + name + " !== \"undefined\") ? " + name + " : null;")();
};

MinimalAccent.createPackage = function (component, theme, ink, names) {
    const isDark = (theme === "dark");
    const colors = isDark ? component.MINIMAL_DARK_COLORS : component.MINIMAL_COLORS;
    const minimalPackage = isDark ? component.styles.minimalDark : component.styles.minimal;
    if (!colors || !component.createMinimalStyle) return minimalPackage;
    return component.createMinimalStyle(MinimalAccent.withInk(colors, ink, isDark, names));
};

// The colors of a component with the new ink. A package or a tone of the theme that they name (the fields of a Dialog,
// its main button "ink", the search box of a list) becomes the new one; "minimalDanger" stays.
MinimalAccent.withInk = function (colors, ink, isDark, names) {
    const newName = isDark ? names.dark : names.light;
    const oldNames = isDark ? ["minimalDark", "inkDark"] : ["minimal", "ink"];
    const result = Object.assign({}, colors, ink);
    for (const key of Object.keys(colors)) {
        if (oldNames.includes(colors[key])) result[key] = newName;
    }
    return result;
};

MinimalAccent.addButtonLooks = function (names, lightInk, darkInk) {
    const button = MinimalAccent.findComponent("SmartButton");
    if (!button || !button.styles.minimal) return;
    button.styles[names.light] = button.styles.minimal;
    button.styles[names.dark] = button.styles.minimalDark;
    button.tones[names.light] = MinimalAccent.createButtonTone(button, lightInk);
    button.tones[names.dark] = MinimalAccent.createButtonTone(button, darkInk);
};

// The tone of the main action: filled with the color, its edge in it too (as the tone "ink").
MinimalAccent.createButtonTone = function (button, ink) {
    // WHY LIGHT_TEXT: with it SmartButton turns the icon white too
    const text = (ink.onInk === MinimalAccent.WHITE) ? button.LIGHT_TEXT : ink.onInk;
    return { color: ink.ink, hover: ink.inkHover, text: text, edge: ink.ink, hoverEdge: ink.inkHover };
};

MinimalAccent.addToastThemes = function (names, lightInk, darkInk) {
    const toast = MinimalAccent.findComponent("Toast");
    if (!toast || !toast.THEMES || !toast.THEMES.minimal) return;
    toast.THEMES[names.light] = Object.assign({}, toast.THEMES.minimal, { actionText: lightInk.ink });
    toast.THEMES[names.dark] = Object.assign({}, toast.THEMES.minimalDark, { actionText: darkInk.ink });
};

MinimalAccent.addTooltipLooks = function (names) {
    const tooltip = MinimalAccent.findComponent("Tooltip");
    if (!tooltip || !tooltip.looks || !tooltip.looks.minimal) return;
    tooltip.looks[names.light] = tooltip.looks.minimal;
    tooltip.looks[names.dark] = tooltip.looks.minimalDark;
};

// *** COLORS:

// [r, g, b] of a CSS color ("#2A78D6", "teal", "rgb(42, 120, 214)").
// WHY a canvas: it reads every CSS color and writes it as "#rrggbb" ("rgba(...)" when it is not opaque).
MinimalAccent.toRgb = function (color) {
    if (!MinimalAccent.colorReader) MinimalAccent.colorReader = document.createElement("canvas").getContext("2d");
    const reader = MinimalAccent.colorReader;
    const unread = "#010203";
    reader.fillStyle = unread;
    reader.fillStyle = String(color);
    const value = reader.fillStyle;
    if (value === unread && String(color).toLowerCase() !== unread) console.warn("MinimalAccent: not a color: " + color);
    if (value.startsWith("#")) return [1, 3, 5].map((at) => parseInt(value.slice(at, at + 2), 16));
    return value.match(/[\d.]+/g).slice(0, 3).map(Number);
};

MinimalAccent.toHex = function (rgb) {
    return "#" + rgb.map((part) => Math.round(part).toString(16).padStart(2, "0")).join("").toUpperCase();
};

// rgb moved toward target by amount (0: rgb, 1: target).
MinimalAccent.mix = function (rgb, target, amount) {
    return rgb.map((part, index) => part + (target[index] - part) * amount);
};

// The relative luminance of WCAG (0: black, 1: white).
MinimalAccent.luminance = function (rgb) {
    const linear = rgb.map(function (part) {
        const value = part / 255;
        return (value <= 0.03928) ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

MinimalAccent.contrast = function (rgb, otherRgb) {
    const first = MinimalAccent.luminance(rgb);
    const second = MinimalAccent.luminance(otherRgb);
    return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

// White or the dark ground: the one that reads better on rgb.
MinimalAccent.textOn = function (rgb) {
    const onWhite = MinimalAccent.contrast(rgb, MinimalAccent.toRgb(MinimalAccent.WHITE));
    const onDark = MinimalAccent.contrast(rgb, MinimalAccent.toRgb(MinimalAccent.DARK_GROUND));
    return (onWhite >= onDark) ? MinimalAccent.WHITE : MinimalAccent.DARK_GROUND;
};
