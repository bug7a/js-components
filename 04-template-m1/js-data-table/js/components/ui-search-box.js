/* Bismillah */

/*

UI SEARCH BOX v1.1

A search field with an icon and a clear (x) button: box.onSearch(function (searchText, uiSearchBox) {}) runs at every
change of the text (typed, pasted, cleared), with the text in lower case. Escape clears it.

Started Date: 15 March 2022
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Site: https://bug7a.github.io/cordova-mobile-app-ui-template/

*/

"use strict";
window.UISearchBox = {};

// SHARED VARIABLES:
UISearchBox.default = {};
UISearchBox.resetDefault = function () {

    Object.assign(UISearchBox.default, {
        width: 300,
        height: 50,
        searchIconFile: "js/components/ui-search-box/search.svg",
        clearIconFile: "js/components/ui-search-box/clear.svg",
        isCancelEnabled: 1,
        placeholderText: "Search",
        color: "whitesmoke",
        textColor: "rgba(0, 0, 0, 0.8)",
        border: 0,
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderBottomStyle: "2px solid rgba(0, 0, 0, 0.06)",
        round: 6,
        fontSize: 20,
        searchIconSpace: 0, // the inner space of the search icon (it gets smaller)
    });

};
UISearchBox.resetDefault();

// The sizes of the parts
UISearchBox.SEARCH_ICON_LEFT = 16;
UISearchBox.SEARCH_ICON_SIZE = 25;
UISearchBox.CLEAR_ICON_RIGHT = 16;
UISearchBox.CLEAR_ICON_SIZE = 20;
UISearchBox.TEXT_LEFT = 40;
UISearchBox.ICONS_WIDTH = 80; // the width of the field without the text: the two icons
UISearchBox.ICON_OPACITY = 0.4;
UISearchBox.CLEAR_ICON_OPACITY = 0.5;

UISearchBox.create = function (params = {}) {

    // BOX: UI object container
    const box = Box({ left: 0, top: 0 });

    // Default values (the params of this box over UISearchBox.default)
    box.default = {};
    Object.keys(UISearchBox.default).forEach(function (name) {
        box.default[name] = (params[name] !== undefined) ? params[name] : UISearchBox.default[name];
    });
    const settings = box.default;

    // *** PRIVATE VARIABLES:
    let onSearchFunc = function () {};

    // *** PRIVATE FUNCTIONS:

    const layoutParts = function () {
        box.txtSearch.width = box.width - UISearchBox.ICONS_WIDTH;
        box.txtSearch.center("top");
        box.imgClearIcon.center("top");
        box.imgIcon.center("top");
    };

    // The clear button is seen (and clickable) only while there is a text.
    const paintClearButton = function () {
        const isShown = (settings.isCancelEnabled && box.txtSearch.value.length > 0) ? 1 : 0;
        box.imgClearIcon.opacity = isShown ? UISearchBox.CLEAR_ICON_OPACITY : 0;
        box.imgClearIcon.clickable = isShown;
    };

    const search = function () {
        paintClearButton();
        onSearchFunc(box.txtSearch.value.toLowerCase(), box);
    };

    // *** PUBLIC FUNCTIONS:

    // USAGE: uiSearchBox.onSearch(function (searchText, uiSearchBox) { myTable.filterByText(searchText); })
    box.onSearch = function (func) {
        onSearchFunc = func;
    };

    box.setText = function (text) {
        box.txtSearch.value = text;
        paintClearButton();
    };

    box.getText = function () {
        return box.txtSearch.value;
    };

    box.clear = function () {
        box.txtSearch.value = "";
        search();
    };

    box.setPlaceholderText = function (text) {
        box.default.placeholderText = text;
        box.txtSearch.placeholder = text;
    };

    // *** OBJECT VIEW:
    box.props({
        width: settings.width,
        height: settings.height,
        color: settings.color,
        round: settings.round,
        border: settings.border,
        borderColor: settings.borderColor,
        css: { borderBottom: settings.borderBottomStyle },
    });

    createIn(box, function () {

        // ICON: Search
        box.imgIcon = Icon(UISearchBox.SEARCH_ICON_LEFT, 0, UISearchBox.SEARCH_ICON_SIZE, UISearchBox.SEARCH_ICON_SIZE, {
            opacity: UISearchBox.ICON_OPACITY,
            space: settings.searchIconSpace,
        });
        that.load(settings.searchIconFile);

        // INPUT: Search text
        box.txtSearch = Input(UISearchBox.TEXT_LEFT, 0, settings.width - UISearchBox.ICONS_WIDTH, settings.height, {
            border: 0,
            minimal: 1,
            fontSize: settings.fontSize,
            color: "transparent",
            textColor: settings.textColor,
            placeholder: settings.placeholderText,
        });

        // ICON: Clear
        box.imgClearIcon = Icon({
            right: UISearchBox.CLEAR_ICON_RIGHT,
            width: UISearchBox.CLEAR_ICON_SIZE,
            height: UISearchBox.CLEAR_ICON_SIZE,
            opacity: 0,
            cursor: "pointer",
            role: "button",
            aria: { label: "Clear the search" },
        });
        that.load(settings.clearIconFile);
        that.setMotion("opacity 0.3s");

    });

    // *** OBJECT INIT CODE:
    // WHY "input", not "keyup": a paste with the mouse and the clear button of the browser change the text without a key
    box.txtSearch.inputElement.addEventListener("input", search);
    box.txtSearch.inputElement.addEventListener("keydown", function (event) {
        if (event.key == "Escape") box.clear();
    });
    box.imgClearIcon.on("click", box.clear);
    box.onResize(layoutParts);
    layoutParts();
    paintClearButton();

    makeBasicObject(box);
    return box;

};
