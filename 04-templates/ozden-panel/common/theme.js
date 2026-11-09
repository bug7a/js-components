/* Bismillah */

/*

Panel Theme - v26.09

- The colors of the panel in one place. Three themes: "dark" (the old colors), "light" and "slate".
- The theme is selected in Settings > Appearance and kept in the browser (basic.storage).
- Pages read the colors from the global T object while they are created, so the panel is
  built again (a page reload) after the theme is changed. Theme.select() does that.

USAGE (in a page or a component):
    Box({ color: T.surface, border: 1, borderColor: T.line });          // Card
    Label({ text: "Title", textColor: Ink(0.95) });                     // Text on the page / a card
    Label({ text: "Saved", textColor: Theme.textOn(T.primary) });       // Text on a colored box
    icon.elem.style.filter = T.iconFilter;                              // Panel icons are black files
    Tabs({ styleName: T.compStyle });                                   // Style package of a component
    Slider({ styleName: T.sliderStyle });                               // round, or roundDark on a dark theme
    Theme.confirm({ titleText: "Delete?", onAnswer: fn });            // Dialog, also Theme.tabsStyle(), tableStyle(), createWaiting()
    ScrollArea({ gap: 16, padding: 24, style: Theme.scrollAreaStyle() }); // A page that scrolls (comp/scroll-area.js)

NOTE: Ink(alpha) is white on the dark themes and black on the light one. It is the ink of texts,
      borders and hover layers over the page and the cards.

NOTE: The left menu keeps its own default look (dark background, red selection) in every theme,
      not the page's look, so it does not use Ink()/T.invertIcon: it has its own ink keys
      (menuTextColor, menuSelectedTextColor, menuHoverColor, menuInvertIcon). See index.htm.

Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

const Theme = {};

Theme.STORAGE_KEY = "appid_theme";
Theme.DEFAULT_NAME = "dark";

// The color sets. A new theme needs only its own values (every key is used by the panel).
Theme.list = {

    // The first colors of the panel: black page, almost black cards.
    dark: {
        name: "dark",
        label: "Dark",
        desc: "Black page, dark cards. The first look of the panel.",
        isDark: 1,

        page: "black", // Behind the cards
        menu: "#141414", // Left menu
        menuSelected: "#583432", // Selected menu item
        menuTitle: "#8E342F", // Menu group titles
        menuTextColor: White(0.6), // Menu item text
        menuSelectedTextColor: White(0.95), // Selected menu item text
        menuHoverColor: White(0.05), // Menu item hover
        menuInvertIcon: 1, // Menu icons (black files) are inverted to white

        surface: "#1A1A19", // Card
        surface2: "#232322", // Field, input, neutral button
        surface3: "#2C2C2A", // Hover of a neutral button, selected chip
        surface4: "#383835", // Pressed button, scroll buttons
        surfaceDeep: "#141414", // Page-deep boxes (module area, search field)

        tableRow1: "#1E1E1E", // Table background / odd row
        tableRow2: "#202020", // Even row
        tableFooter: "#252525", // Info line under a table
        tableHighlight: "#2A3A36", // Found text cell

        primary: "#3D7A6B",
        primaryHover: "#468A79",
        primaryActive: "#2C5A38",
        accent: "#65A293",
        accent2: "#3987E5", // The second color of the data, next to accent. They must be told apart.

        danger: "#E66767",
        warning: "#C98500",
        info: "#3987E5",
        success: "#5DB182",

        scrollBar: "#A0A0A0",
        chartTheme: "dark", // GraphBox
        compStyle: "dark", // Tabs, Stepper, Gauge... style packages
        sliderStyle: "roundDark", // Slider (the slider of new pages: round, roundDark on a dark page)
        iconFilter: "invert(100%)", // The icon files of the panel are black
        invertIcon: 1, // invertIconColor / invertColor parameters
    },

    // White page, gray fields, the same action color.
    light: {
        name: "light",
        label: "Light",
        desc: "White cards on a light gray page.",
        isDark: 0,

        page: "#F1F3F4",
        // WHY: The left menu keeps its default look (dark, red selection) in every theme, so it
        //      does not use `page`/`surface` here: menu, menuSelected and the four keys below.
        menu: "#141414",
        menuSelected: "#583432",
        menuTitle: "#8E342F",
        menuTextColor: White(0.6),
        menuSelectedTextColor: White(0.95),
        menuHoverColor: White(0.05),
        menuInvertIcon: 1,

        surface: "#FFFFFF",
        surface2: "#F1F3F4",
        surface3: "#E6E9EB",
        surface4: "#D9DDDF",
        surfaceDeep: "#E9ECEE",

        tableRow1: "#FFFFFF",
        tableRow2: "#F7F8F9",
        tableFooter: "#F1F3F4",
        tableHighlight: "#DEE8F2",

        primary: "#588ABE",
        primaryHover: "#739FCC",
        primaryActive: "#35669A",
        accent: "#3470AF", // WHY: A bit darker. The light accent was hard to read on white.
        // WHY not info: accent is blue in this theme, like info, so two series with them could not be told apart.
        //     Checked for color blindness next to accent and warning.
        accent2: "#0E9F7E",

        danger: "#C6413F",
        warning: "#9A6600",
        info: "#2C6FC4",
        success: "#2F7D53",

        scrollBar: "#8A8F92",
        chartTheme: "light",
        compStyle: "modern",
        sliderStyle: "round",
        iconFilter: "none",
        invertIcon: 0,
    },

    // Dark, but not black: blue-gray page and cards.
    slate: {
        name: "slate",
        label: "Slate",
        desc: "Dark blue-gray. Easier on the eyes than black.",
        isDark: 1,

        page: "#161D27",
        menu: "#1B2330",
        menuSelected: "#33465E",
        menuTitle: "#7E93AD",
        menuTextColor: White(0.6),
        menuSelectedTextColor: White(0.95),
        menuHoverColor: White(0.05),
        menuInvertIcon: 1,

        surface: "#202A38",
        surface2: "#2A3644",
        surface3: "#334052",
        surface4: "#3E4C60",
        surfaceDeep: "#1B2330",

        tableRow1: "#212B39",
        tableRow2: "#243040",
        tableFooter: "#283444",
        tableHighlight: "#2F4A4A",

        primary: "#3D7A6B",
        primaryHover: "#468A79",
        primaryActive: "#2C5A38",
        accent: "#6FB0A0",
        accent2: "#4E96E8",

        danger: "#E66767",
        warning: "#D69324",
        info: "#4E96E8",
        success: "#5DB182",

        scrollBar: "#8FA2BC",
        chartTheme: "dark",
        compStyle: "dark",
        sliderStyle: "roundDark",
        iconFilter: "invert(100%)",
        invertIcon: 1,
    },

};

// The colors of the current theme. Pages read them while they are created.
// NOTE: The same object is always used (its keys are changed), so a page can keep a reference to it.
const T = {};

// The ink over the page and the cards: white on the dark themes, black on the light one.
// USAGE: textColor: Ink(0.9), borderColor: Ink(0.1)
const Ink = function(alpha = 1) {
    return (T.isDark) ? White(alpha) : Black(alpha);
};

// Text color on a colored box (a primary button, a status pill...): white or black by the
// brightness of that color. So one code works in every theme.
// USAGE: Label({ text: "Save", textColor: Theme.textOn(T.primary) })
Theme.textOn = function(backgroundColor, alpha = 1) {
    return (Theme.luminance(backgroundColor) > 0.5) ? Black(alpha * 0.85) : White(alpha);
};

// A status color (order state, log level...) that is also readable as text on the light theme.
// The dark themes use the color as it is. On the light theme it is darkened until it can be read
// on a card. So one color list works in every theme.
// USAGE: STATUSES = { draft: { label: "Draft", color: Theme.readable("#A9A79F") } }
Theme.readable = function(color, minContrast = 4) {

    if (T.isDark) return color;

    const rgb = Theme.toRgb(color);
    if (!rgb) return color;

    let r = rgb[0], g = rgb[1], b = rgb[2];

    for (let i = 0; i < 24; i++) {
        if (Theme.contrast("rgb(" + r + "," + g + "," + b + ")", T.surface) >= minContrast) break;
        r = Math.round(r * 0.9);
        g = Math.round(g * 0.9);
        b = Math.round(b * 0.9);
    }

    return "rgb(" + r + ", " + g + ", " + b + ")";

};

// Contrast ratio of two colors: 1 (same) - 21 (black and white).
Theme.contrast = function(colorA, colorB) {
    const a = Theme.luminance(colorA);
    const b = Theme.luminance(colorB);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// 0 (black) - 1 (white). Accepts "#RGB", "#RRGGBB", "#RRGGBBAA", "rgb()", "rgba()" and "black" / "white".
Theme.luminance = function(color) {

    const rgb = Theme.toRgb(color);
    if (!rgb) return 0;

    const channel = function(value) {
        value = value / 255;
        return (value <= 0.03928) ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    };

    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);

};

Theme.toRgb = function(color) {

    if (!color || typeof color !== "string") return null;
    const text = color.trim().toLowerCase();

    if (text == "black") return [0, 0, 0];
    if (text == "white") return [255, 255, 255];
    if (text == "transparent") return null;

    if (text.charAt(0) == "#") {
        let hex = text.slice(1);
        if (hex.length == 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
        if (hex.length < 6) return null;
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }

    const numbers = text.match(/[\d.]+/g);
    if (numbers && numbers.length >= 3) return [Number(numbers[0]), Number(numbers[1]), Number(numbers[2])];

    return null;

};

// "#65A293", 0.2 -> "rgba(101, 162, 147, 0.2)"  (For pill backgrounds.)
Theme.alpha = function(color, alpha) {
    const rgb = Theme.toRgb(color);
    if (!rgb) return color;
    return "rgba(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ", " + alpha + ")";
};

// The name of the saved theme. (An unknown name falls back to the default.)
Theme.load = function() {
    const name = basic.storage.load(Theme.STORAGE_KEY);
    return (name && Theme.list[name]) ? name : Theme.DEFAULT_NAME;
};

// Puts the colors of a theme into T. (No object is created again: T keeps its reference.)
Theme.use = function(name) {

    const colors = Theme.list[name] || Theme.list[Theme.DEFAULT_NAME];

    for (let key in T) delete T[key];
    for (let key in colors) T[key] = colors[key];

    return T;

};

// The page background. (page is ready after the page is loaded.)
Theme.applyToPage = function() {
    if (typeof page === "undefined" || !page) return;
    page.color = T.page;
};

// Saves the theme and builds the panel again with it.
// WHY: Every object gets its colors while it is created. The whole panel (top bar, menu, page)
//      is created again with a reload, so nothing keeps the old colors.
// openPageKey: The page that is opened after the reload. (The user stays where they were.)
Theme.select = function(name, openPageKey) {

    if (!Theme.list[name]) return 0;

    basic.storage.save(Theme.STORAGE_KEY, name);
    if (openPageKey) basic.storage.save(Theme.OPEN_PAGE_KEY, openPageKey);

    window.location.reload();
    return 1;

};

// The page to open after a theme change. (index.htm reads and clears it.)
Theme.OPEN_PAGE_KEY = "appid_open_page";

Theme.takeOpenPageKey = function() {
    const key = basic.storage.load(Theme.OPEN_PAGE_KEY);
    if (key) basic.storage.remove(Theme.OPEN_PAGE_KEY);
    return key || "";
};

// The themes as a list. (For the Settings page.)
Theme.getList = function() {
    const list = [];
    for (let name in Theme.list) list.push(Theme.list[name]);
    return list;
};

// *** THE LOOKS OF THE COMPONENTS: comp-m4 Tabs, TinyTable, Dialog and LoadingScreen in the colors of T
// NOTE: They are functions: they read T when a page creates its objects. (The components are loaded after this file.)

// The pill Tabs of the panel (the look of the old comp-m2 TextTabs): a bar with an edge, the active tab
// in the primary color, a count after the text in a softer ink.
// look: { barColor, borderColor, barPadding, barRound, tabRound, fontSize, padding: [x, y], height (0: by the text) }
// USAGE: Tabs({ variant: "pill", styleName: T.compStyle, tabs: [...], style: Theme.tabsStyle({ height: 40 }) })
Theme.tabsStyle = function(look = {}) {

    const barPadding = (look.barPadding !== undefined) ? look.barPadding : 3;
    const barBorder = 1;
    const height = look.height || 0;
    const fontSize = look.fontSize || 14;
    const activeColor = look.activeColor || T.primary;
    const barColor = look.barColor || T.surface2;
    // WHY: The height of the bar is the height of the buttons and the inputs next to it. Its padding and edge are in it.
    const tabHeight = (height) ? height - (barPadding + barBorder) * 2 : 0;

    return {
        pillBar: { color: barColor, padding: [barPadding, barPadding], gap: 3, round: look.barRound || 8, border: barBorder, borderColor: look.borderColor || Ink(0.1) },
        tab: { fontSize: fontSize, textColor: Ink(0.85), padding: look.padding || [12, 6], round: look.tabRound || 6, gap: 5, minHeight: tabHeight },
        tabHover: { color: Ink(0.05), textColor: Ink(0.95) },
        pillActive: { textColor: Theme.textOn(activeColor) },
        pillIndicator: { color: activeColor, round: look.tabRound || 6, shadow: "none", motion: 0.2 },
        count: { fontSize: fontSize, color: "transparent", textColor: Ink(0.45), activeColor: "transparent", activeTextColor: Theme.textOn(activeColor, 0.6), round: 0, padding: [0, 0] },
        arrow: { color: Ink(0.6), background: barColor },
    };

};

// ["All", "Open"] -> [{ key: 0, text: "All" }, { key: 1, text: "Open" }]: the key of a tab is its index (tabs.value).
Theme.indexTabs = function(texts) {
    return texts.map(function(text, index) {
        return { key: index, text: text };
    });
};

// The TinyTable of the panel: a soft title row, a thin edge, round 8.
// look: { headerColor, bodyColor, borderColor, fontSize, textColor }
// USAGE: TinyTable({ columns: Theme.tableColumns(["NAME", "CITY"], ["60%", "39%"]), rows: rows, style: Theme.tableStyle() })
Theme.tableStyle = function(look = {}) {

    const headerColor = look.headerColor || T.surface2;
    const bodyColor = look.bodyColor || T.surface;

    return {
        box: { color: bodyColor, border: 1, borderColor: look.borderColor || Ink(0.1), round: 8 },
        header: { color: headerColor, lineColor: headerColor, textColor: Ink(0.6), fontSize: 12, padding: [8, 8] },
        body: { color: bodyColor, paddingY: 10 },
        cell: { textColor: look.textColor || Ink(0.8), fontSize: look.fontSize || 14, padding: [8, 4] },
        rowHover: { color: Ink(0.05), lineColor: Ink(0.1) },
        scrollBar: { neverHide: 0, showDots: 0, bar_color: T.scrollBar },
    };

};

// The ScrollArea of the panel (a page, the details of a row): the bar of its tables, thin, without the dots, in the
// color of the theme; it shows while the content moves.
// USAGE: ScrollArea({ gap: 16, padding: 24, style: Theme.scrollAreaStyle() }) ... endGroup();
Theme.scrollAreaStyle = function() {
    return {
        scrollBar: { neverHide: 0, showDots: 0, bar_color: T.scrollBar, bar_mouseOverColor: T.scrollBar },
    };
};

// ["NAME", "CITY"], ["60%", "39%"], ["left", "right"] -> the columns of TinyTable
Theme.tableColumns = function(titles, widths = [], aligns = []) {
    return titles.map(function(title, index) {
        return { title: title, width: widths[index], align: aligns[index] || "left" };
    });
};

// comp-m4 TinyTable is as wide as its columns. In the panel it fills its card, its columns are in % of it.
// USAGE: Theme.fillTableWidth(table)
Theme.fillTableWidth = function(table) {
    table.width = "100%";
    // WHY: The title row of TinyTable is "max-content" wide: its % columns had no width to be measured on.
    table.header.css = { width: "100%" };
};

// The Dialog of the panel: a card in the surface color; the main button is a SmartButton ozden with only its
// color changed: the same orange in every dialog and theme.
const DIALOG_ACTION_COLOR = "#DE815B";
const DIALOG_ACTION_HOVER_COLOR = "#D0724D"; // a little darker under the mouse

Theme.dialogStyle = function() {

    const BUTTON_FONT_SIZE = 16;
    const createButtonLook = function(color, textColor) {
        return {
            styleName: "ozden",
            style: {
                box: { color: color, borderColor: Ink(0.2), boxShadow: "inset 0 -2px 0 rgba(0, 0, 0, 0.2)" },
                hover: { color: "color-mix(in srgb, " + color + " 85%, white)" },
                active: { color: "color-mix(in srgb, " + color + " 85%, white)" },
                label: { textColor: textColor, fontSize: BUTTON_FONT_SIZE },
            },
        };
    };

    return {
        cover: { color: (T.isDark) ? Black(0.7) : Black(0.5) },
        card: { color: T.surface, border: 1, borderColor: Ink(0.15), boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)" },
        title: { textColor: Ink(0.95) },
        message: { textColor: Ink(0.7) },
        status: { errorColor: T.danger, infoColor: Ink(0.55) },
        footer: { color: T.surface2, lineColor: Ink(0.1) },
        buttons: {
            primary: {
                styleName: "ozden",
                style: {
                    box: { color: DIALOG_ACTION_COLOR },
                    hover: { color: DIALOG_ACTION_HOVER_COLOR },
                    active: { color: DIALOG_ACTION_HOVER_COLOR },
                    label: { textColor: SmartButton.styles.ozden.label.textColor, fontSize: BUTTON_FONT_SIZE },
                },
            },
            secondary: createButtonLook(T.surface3, Ink(0.85)),
        },
    };

};

// Asks before an action: a Dialog (comp-m4) with a cancel and a confirm button.
// onAnswer(isConfirmed): 1 (the confirm button) or 0 (cancel, Escape, a click on the cover).
// messageText can be HTML: only the texts of the panel (escape a name of a user).
// USAGE: Theme.confirm({ titleText: "Delete Role", messageText: "...", confirmText: "Delete", onAnswer: function(isConfirmed) {} })
Theme.confirm = function(params = {}) {

    const onAnswer = params.onAnswer || function() {};

    const dialog = Dialog({
        titleText: params.titleText || "",
        messageText: params.messageText || "",
        allowHtml: 1,
        style: Theme.dialogStyle(),
        buttons: [
            { key: "cancel", text: params.cancelText || "Cancel", type: "secondary" },
            { key: "confirm", text: params.confirmText || "OK", type: "primary" },
        ],
        onClose: function(dialog, reason, buttonKey) {
            onAnswer((buttonKey === "confirm") ? 1 : 0);
        },
    });

    return dialog;

};

// The waiting cover of the panel: a LoadingScreen (comp-m4) over a dark cover, with the moving clock.
// USAGE: waiting.setMessageText("Saving..."); waiting.open(); ... waiting.close();
Theme.createWaiting = function() {

    const waiting = LoadingScreen({
        opened: 0,
        minDuration: 0,
        fadeDuration: 0.2,
        spinnerType: "clock",
        style: {
            box: { color: (T.isDark) ? Black(0.6) : Black(0.35) },
            message: { fontSize: 16, textColor: White(0.9) },
            clock: LoadingScreen.clocks.ozden,
        },
    });

    // WHY: The clock comes before the text, like the waiting cover of the panel before (LoadingScreen: after it).
    waiting.clock.css = { order: "-1", marginTop: "0px" };
    return waiting;

};

// The colors are ready before the pages are loaded.
// WHY: A page file can use T while it is loaded (its static style objects).
Theme.use(Theme.load());
