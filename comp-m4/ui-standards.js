/* Bismillah */

/*

UI Standards - v26.09

The design tokens of a page: colors, text sizes, corner radius, spacing, motion time and screen sizes.
And the themes (light, dark, your own) of those colors.
- One file, no CSS file: the theme colors are written into the page as CSS variables (--color-primary...).
- The color tokens are CSS variables (UI.COLOR_PRIMARY = "var(--color-primary)"), so a theme change updates
  every object at once. There is no need to create the objects again or to reload the page.
- The names say the job of a token, and the job is the same in every theme: UI.COLOR_SURFACE is the card
  color (white in light, black in dark), UI.COLOR_TEXT is the text color.
- Themes: "light" (default), "dark", "auto" (follows the operating system) and the themes you define.
- Style presets: prop lists for labels, buttons and cards. Use them when you create an object or later.
- Effects (hover, press, animations) are not here: use comp-m4/ui-effects.js (UIEffects).
- comp-m2/ui-standards.js is the old version (other token names: COLOR_FIRST, WHITE, GRAY_300, TEXT_L...).

LOAD ORDER: basic.css, basic.js, ui-standards.js, components, page code.
Load it in <head>: the theme is set before the page is drawn, so there is no white flash in the dark theme.

TOKENS:
Backgrounds: COLOR_PAGE, COLOR_SURFACE, COLOR_SURFACE_SOFT
Texts:       COLOR_TEXT, COLOR_TEXT_STRONG, COLOR_TEXT_SOFT, COLOR_BUTTON_TEXT
Lines:       COLOR_BORDER
Brand:       COLOR_PRIMARY, COLOR_SECONDARY
States:      COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER, COLOR_INFO
Palette:     COLOR_PINK, COLOR_GREEN, COLOR_BLUE, COLOR_RED, COLOR_YELLOW, COLOR_SAND
Grays:       COLOR_GRAY_100, 200, 300, 500, 700, 900
Text:        FONT_XXL (32), FONT_XL (26), FONT_L (20), FONT_M (16), FONT_S (12), FONT_FAMILY, FONT_FAMILY_BOLD
Corners:     ROUND_XS (2), ROUND_S (4), ROUND_M (8), ROUND_L (13), ROUND_FULL (100)
Space:       PADDING_X, PADDING_Y, MARGIN_X, MARGIN_Y, SPACING_S (8), SPACING_M (16), SPACING_L (32)
Other:       TRANSITION, BREAKPOINTS
Styles:      title, text, caption, tag, invertedTag, badge, button, secondaryButton, textButton, card, panel

USAGE:
page.color = UI.COLOR_PAGE;
Label({ text: "Title", ...UI.styles.title });                // A style preset when creating.
Button({ text: "Save", ...UI.styles.button, width: 160 });   // Your props after the preset win.
UI.style(that, "secondaryButton");                          // A style preset after creating.
Box({ color: UI.alpha(UI.COLOR_PRIMARY, 0.15) });           // A token with alpha (follows the theme).
UI.setTheme("dark");    UI.setTheme("auto");    UI.toggleTheme();
UI.loadTheme("light");                                      // The saved theme (or "light"). Later changes are saved.
UI.onThemeChange(function (themeName) { ... });             // Returns a remover function.
UI.isDark();                                                // 1 or 0
UI.getColor(UI.COLOR_PRIMARY);                              // "#689BD2" (for canvas, Chart.js...)
UI.defineTheme("sepia", { page: "#F4ECD8", primary: "#8B5E3C" });  // Missing colors come from "light".
UI.motion(["background-color", "opacity"]);                 // "background-color 0.2s ease, opacity 0.2s ease"
UI.breakpoint();                                            // "XS", "SM", "MD", "LG" or "XL" (window width)

Started Date: 2025 (v26.09: themes in one file, style presets, token names by their job)
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

const UI = {

    // *** COLORS: (CSS variables, they follow the theme)

    // Backgrounds:
    COLOR_PAGE: "var(--color-page)",                 // The page
    COLOR_SURFACE: "var(--color-surface)",           // Cards, panels, inputs (white in light, black in dark)
    COLOR_SURFACE_SOFT: "var(--color-surface-soft)", // Soft filled areas: tags, panels, pressed rows

    // Texts:
    COLOR_TEXT: "var(--color-text)",                 // Normal text
    COLOR_TEXT_STRONG: "var(--color-text-strong)",   // The highest contrast (black in light, white in dark)
    COLOR_TEXT_SOFT: "var(--color-text-soft)",       // Descriptions, hints
    COLOR_BUTTON_TEXT: "var(--color-button-text)",   // Text on the primary and secondary buttons

    // Lines:
    COLOR_BORDER: "var(--color-border)",

    // Brand:
    COLOR_PRIMARY: "var(--color-primary)",
    COLOR_SECONDARY: "var(--color-secondary)",

    // States:
    COLOR_SUCCESS: "var(--color-success)",
    COLOR_WARNING: "var(--color-warning)",
    COLOR_DANGER: "var(--color-danger)",
    COLOR_INFO: "var(--color-info)",

    // Palette: (same in every theme; for charts, tags, avatars...)
    COLOR_PINK: "var(--color-pink)",
    COLOR_GREEN: "var(--color-green)",
    COLOR_BLUE: "var(--color-blue)",
    COLOR_RED: "var(--color-red)",
    COLOR_YELLOW: "var(--color-yellow)",
    COLOR_SAND: "var(--color-sand)",

    // Grays: 100 is near the page color, 900 is near the text color. (So they change places in the dark theme.)
    COLOR_GRAY_100: "var(--color-gray-100)",
    COLOR_GRAY_200: "var(--color-gray-200)",
    COLOR_GRAY_300: "var(--color-gray-300)",
    COLOR_GRAY_500: "var(--color-gray-500)",
    COLOR_GRAY_700: "var(--color-gray-700)",
    COLOR_GRAY_900: "var(--color-gray-900)",

    // *** TEXT:

    FONT_XXL: 32,
    FONT_XL: 26,
    FONT_L: 20,
    FONT_M: 16,
    FONT_S: 12,

    FONT_FAMILY: "opensans",
    FONT_FAMILY_BOLD: "opensans-bold",

    // *** CORNERS: (round)

    ROUND_XS: 2,
    ROUND_S: 4,
    ROUND_M: 8,
    ROUND_L: 13,
    ROUND_FULL: 100, // Pills and circles

    // *** SPACE:

    PADDING_X: 12,   // Inside labels and buttons (left and right)
    PADDING_Y: 4,    // Inside labels and buttons (top and bottom)

    MARGIN_X: 20,    // Page edges
    MARGIN_Y: 20,

    SPACING_S: 8,    // Gaps between objects
    SPACING_M: 16,
    SPACING_L: 32,

    // *** MOTION:

    TRANSITION: "0.2s ease",

    // *** SCREEN: Minimum window widths (px).

    BREAKPOINTS: {
        SM: 480,
        MD: 768,
        LG: 1024,
        XL: 1280,
    },

};

// *** THEMES:
// Each key is a CSS variable: primary -> --color-primary. scheme: "light" or "dark" (native inputs and scroll bars).

UI.themes = {

    light: {
        scheme: "light",

        "page": "#F6F6F6",
        "surface": "#FFFFFF",
        "surface-soft": "#EBEBEB",

        "text": "#373836",
        "text-strong": "#000000",
        "button-text": "rgba(0, 0, 0, 0.70)",

        "primary": "#689BD2",
        "secondary": "cadetblue",

        "pink": "#CC75AA",
        "green": "#86BA84",
        "blue": "#23ACCF",
        "red": "#FE5D49",
        "yellow": "#F1C74A",
        "sand": "#D3CFC1",

        "gray-100": "#F6F6F6",
        "gray-200": "#D8D8D8",
        "gray-300": "#B7B7B7",
        "gray-500": "#999",
        "gray-700": "#4A4A4A",
        "gray-900": "#141414",
    },

    dark: {
        scheme: "dark",

        "page": "#141414",
        "surface": "#000000",
        "surface-soft": "#373836",

        "text": "#EBEBEB",
        "text-strong": "#FFFFFF",
        "button-text": "rgba(255, 255, 255, 0.70)",

        "primary": "#344f6c",
        "secondary": "rgb(57, 96, 97)",

        "pink": "#CC75AA",
        "green": "#86BA84",
        "blue": "#23ACCF",
        "red": "#FE5D49",
        "yellow": "#F1C74A",
        "sand": "#D3CFC1",

        "gray-100": "#141414",
        "gray-200": "#4A4A4A",
        "gray-300": "#999",
        "gray-500": "#B7B7B7",
        "gray-700": "#D8D8D8",
        "gray-900": "#F6F6F6",
    },

};

// The colors that use other colors by default. A theme can give its own values.
UI.linkedColors = {
    "text-soft": "var(--color-gray-500)",
    "border": "var(--color-gray-200)",
    "success": "var(--color-green)",
    "warning": "var(--color-yellow)",
    "danger": "var(--color-red)",
    "info": "var(--color-blue)",
};

// *** STYLE PRESETS:
// Prop lists. Button({ text: "OK", ...UI.styles.button }) or UI.style(btn, "button").

UI.styles = {

    // LABELS:
    title: { fontSize: UI.FONT_XL, fontFamily: UI.FONT_FAMILY_BOLD, textColor: UI.COLOR_TEXT },
    text: { fontSize: UI.FONT_M, textColor: UI.COLOR_TEXT },
    caption: { fontSize: UI.FONT_S, textColor: UI.COLOR_TEXT_SOFT },
    tag: { fontSize: UI.FONT_L, textColor: UI.COLOR_TEXT, color: UI.COLOR_SURFACE_SOFT, padding: [UI.PADDING_X, UI.PADDING_Y] },
    invertedTag: { fontSize: UI.FONT_L, textColor: UI.COLOR_SURFACE_SOFT, color: UI.COLOR_TEXT, padding: [UI.PADDING_X, UI.PADDING_Y] },
    badge: { fontSize: UI.FONT_S, textColor: "white", color: UI.COLOR_DANGER, round: UI.ROUND_FULL, padding: [8, 2] },

    // BUTTONS:
    button: { fontSize: UI.FONT_L, textColor: UI.COLOR_BUTTON_TEXT, color: UI.COLOR_PRIMARY },
    secondaryButton: { fontSize: UI.FONT_L, textColor: UI.COLOR_BUTTON_TEXT, color: UI.COLOR_SECONDARY, minimal: 1 },
    textButton: { fontSize: UI.FONT_M, textColor: UI.COLOR_PRIMARY, color: "transparent", minimal: 1 },

    // BOXES:
    card: { color: UI.COLOR_SURFACE, round: UI.ROUND_M, border: 1, borderColor: UI.COLOR_BORDER },
    panel: { color: UI.COLOR_SURFACE_SOFT, round: UI.ROUND_S },

};

// *** SETTINGS:
UI.storageKey = "ui-theme"; // loadTheme() and the next setTheme() calls save the theme with this key.

// *** STATE: (read only)
UI.theme = "light";         // The selected theme: "light", "dark", "auto" or your theme.
UI.activeTheme = "";        // The theme on the screen now. ("auto" -> "light" or "dark")

// *** PUBLIC FUNCTIONS:

// Selects a theme: "light", "dark", "auto" or a theme from defineTheme().
UI.setTheme = function (themeName = "light") {
    if (themeName !== "auto" && !UI.themes[themeName]) {
        println("UI: Unknown theme: " + themeName, "error");
        return;
    }
    UI.theme = themeName;
    UI._applyActiveTheme();
    if (UI._isSaving) {
        try { basic.storage.save(UI.storageKey, themeName); } catch (e) {}
    }
};

// Selects the saved theme (or defaultThemeName), and saves the next theme changes.
UI.loadTheme = function (defaultThemeName = "light") {
    let savedThemeName = null;
    try { savedThemeName = basic.storage.load(UI.storageKey); } catch (e) {}
    const isValid = savedThemeName === "auto" || (savedThemeName && UI.themes[savedThemeName]);
    UI._isSaving = 1;
    UI.setTheme(isValid ? savedThemeName : defaultThemeName);
};

// Light <-> dark.
UI.toggleTheme = function () {
    UI.setTheme(UI.isDark() ? "light" : "dark");
};

UI.isDark = function () {
    const theme = UI.themes[UI.activeTheme];
    return (theme && theme.scheme === "dark") ? 1 : 0;
};

// Runs when the theme on the screen changes: fn(themeName). Returns a function that removes it.
UI.onThemeChange = function (fn) {
    UI._themeListeners.push(fn);
    return function () {
        const index = UI._themeListeners.indexOf(fn);
        if (index > -1) UI._themeListeners.splice(index, 1);
    };
};

// Adds a theme, or changes the colors of a theme. The missing colors come from "light" (or "dark" with scheme: "dark").
// UI.defineTheme("dark", { primary: "#2B4A6F" });    UI.defineTheme("ocean", { scheme: "dark", page: "#0B1E2D" });
UI.defineTheme = function (themeName, colors = {}) {
    const base = UI.themes[themeName] || UI.themes[(colors.scheme === "dark") ? "dark" : "light"];
    UI.themes[themeName] = Object.assign({}, base, colors);
    UI._writeThemeCss();
};

// The value of a color in the current theme: UI.getColor(UI.COLOR_PRIMARY) or UI.getColor("primary") -> "#689BD2"
// Use it where CSS variables do not work (canvas, Chart.js). Read it again after a theme change.
UI.getColor = function (color) {
    const match = String(color).match(/^var\((--[\w-]+)\)$/);
    const cssName = match ? match[1] : "--color-" + color;
    return getComputedStyle(document.documentElement).getPropertyValue(cssName).trim();
};

// A color with alpha. It works with the tokens too, and follows the theme.
// UI.alpha(UI.COLOR_PRIMARY, 0.2) -> "color-mix(in srgb, var(--color-primary) 20%, transparent)"
UI.alpha = function (color, alpha) {
    return "color-mix(in srgb, " + color + " " + Math.round(alpha * 100) + "%, transparent)";
};

// A token for a color that has no constant (your own theme keys): UI.color("brand") -> "var(--color-brand)"
UI.color = function (name) {
    return "var(--color-" + name + ")";
};

// Applies a style preset to an object. extraProps are applied after it.
// UI.style(that, "card");    UI.style(btn, "button", { width: 200 });
UI.style = function (obj, styleName, extraProps = {}) {
    const preset = UI.styles[styleName];
    if (!preset) {
        println("UI: Unknown style: " + styleName, "error");
        return obj;
    }
    const props = Object.assign({}, preset, extraProps);
    for (const key in props) obj[key] = props[key];
    return obj;
};

// A motion string for setMotion(): UI.motion(["opacity", "left"]) -> "opacity 0.2s ease, left 0.2s ease"
UI.motion = function (names = [], transition = UI.TRANSITION) {
    if (!Array.isArray(names)) names = [names];
    return names.map(function (name) { return name + " " + transition; }).join(", ");
};

// The screen size name of a width: "XS" (smaller than SM), "SM", "MD", "LG", "XL".
UI.breakpoint = function (width = window.innerWidth) {
    let result = "XS";
    for (const name in UI.BREAKPOINTS) {
        if (width >= UI.BREAKPOINTS[name]) result = name;
    }
    return result;
};

// *** PRIVATE:

UI._themeListeners = [];
UI._isSaving = 0;
UI._styleElement = null;
UI._darkQuery = (window.matchMedia) ? window.matchMedia("(prefers-color-scheme: dark)") : null;

// Writes all themes into one <style>: ":root[data-theme='dark'] { --color-page: #141414; ... }"
UI._writeThemeCss = function () {
    let css = "";
    for (const themeName in UI.themes) {
        const theme = Object.assign({}, UI.linkedColors, UI.themes[themeName]);
        // WHY: The light colors are also the default, before a theme is selected.
        css += (themeName === "light") ? ":root, :root[data-theme=\"light\"] {\n" : ":root[data-theme=\"" + themeName + "\"] {\n";
        for (const key in theme) {
            if (key === "scheme") continue;
            css += "    --color-" + key + ": " + theme[key] + ";\n";
        }
        css += "    color-scheme: " + (theme.scheme || "light") + ";\n}\n";
    }
    if (!UI._styleElement) {
        UI._styleElement = document.createElement("style");
        UI._styleElement.id = "ui-standards-themes";
        document.head.appendChild(UI._styleElement);
    }
    UI._styleElement.textContent = css;
};

UI._applyActiveTheme = function () {
    let themeName = UI.theme;
    if (themeName === "auto") themeName = (UI._darkQuery && UI._darkQuery.matches) ? "dark" : "light";
    const isChanged = (themeName !== UI.activeTheme);
    UI.activeTheme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    if (isChanged) {
        UI._themeListeners.slice().forEach(function (fn) { fn(themeName); });
    }
};

// *** INIT:
UI._writeThemeCss();
UI._applyActiveTheme();

// "auto": follows the operating system while the page is open.
if (UI._darkQuery && UI._darkQuery.addEventListener) {
    UI._darkQuery.addEventListener("change", function () {
        if (UI.theme === "auto") UI._applyActiveTheme();
    });
}
