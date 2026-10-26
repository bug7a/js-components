/* Bismillah */

/*

Search Input - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: December 2025
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";
// Default values
const SearchInputDefaults = {
    left: 0,
    top: 0,
    width: 300,
    height: 50,
    searchIconFile: "../comp-m2/search-input-v2/search.svg",
    clearIconFile: "../comp-m2/search-input-v2/clear.svg",
    searchIconSize: 24,
    isCancelEnabled: 1,
    placeholderText: "Search",
    color: "whitesmoke",
    textColor: "rgba(0, 0, 0, 0.8)",
    placeholderColor: "", // "": Tarayıcının kendi rengi. Koyu zeminde White(0.35) gibi bir renk verin.
    searchIconOpacity: 1,
    border: 0,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderBottomStyle: "2px solid rgba(0, 0, 0, 0.06)",
    round: 6,
    fontSize: 20,
    invertIconColor: 0,
    onSearch: function(searchedText, self) {},
    onSubmit: function(searchedText, self) {},
};

const SearchInput = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SearchInputDefaults);

    // BOX: Component container
    const box = startBox();

    box.props(params);
    
    // *** Private variables:
    const ICON_LEFT = 16; // The search icon from the left side
    const ICON_GAP = 8; // Between the search icon and the text
    const ICONS_SPACE = 80; // The width of the box that is not for the text (the two icons and their spaces)
    const CLEAR_ICON_OPACITY = 0.6;

    // *** Public variables:
    box.publicVar = "";

    // *** Private functions:

    const refreshLayout = function(self) {

        self.txtSearch.width = self.width - ICONS_SPACE;
        self.txtSearch.center("top");
        self.imgClearIcon.center("top");
        self.imgIcon.center("top");

    };

    // The text given to onSearch and onSubmit
    const getSearchedText = function() {
        return box.txtSearch.text.toLowerCase();
    };

    const setClearIconVisible = function(isVisible) {
        box.imgClearIcon.opacity = (isVisible) ? CLEAR_ICON_OPACITY : 0;
        box.imgClearIcon.clickable = (isVisible) ? 1 : 0;
    };

    // *** Public functions:
    box.publicFunc = () => {};

    box.setText = function(text) {
        box.txtSearch.text = text;
    }

    box.getText = function() {
        return box.txtSearch.text;
    }

    box.setPlaceholderText = function(text) {
        box.placeholderText = text;
        box.txtSearch.inputElement.setAttribute("placeholder", text);
    }

    box.focus = function() {
        box.txtSearch.inputElement.focus();
    }

        // *** OBJECT TEMPLATE:
        box.css.borderBottom = box.borderBottomStyle;

        // ICON: Search icon
        box.imgIcon = Icon(ICON_LEFT, 0, box.searchIconSize, box.searchIconSize, {
            opacity: box.searchIconOpacity,
            space: 0,
        });
        that.load(box.searchIconFile);
        if (box.invertIconColor == 1) that.css.filter = "invert(100%)";
        that.center("top");

        // INPUT: Search textbox
        box.txtSearch = Input(ICON_LEFT + box.searchIconSize + ICON_GAP, 0, {
            width: box.width - ICONS_SPACE,
            height: box.height,
            border: 0,
            minimal: 1,
            fontSize: box.fontSize,
            textColor: box.textColor,
            color: "transparent",
        });
        that.inputElement.style.paddingLeft = "0px";
        that.inputElement.setAttribute("placeholder", box.placeholderText);
        // WHY: ::placeholder rengi sadece CSS ile değişir. Kural sayfaya bir kez eklenir; rengi her input kendi değişkeninde taşır.
        if (box.placeholderColor !== "") {
            SearchInput.addPlaceholderStyle();
            that.inputElement.setAttribute("data-placeholder-color", "1");
            that.inputElement.style.setProperty("--placeholder-color", box.placeholderColor);
        }

        // ICON: Clear icon button
        box.imgClearIcon = Icon(5, 0, 20, 20, {
            right: 16,
            opacity: 0,
            space: 0,
        });
        that.load(box.clearIconFile);
        if (box.invertIconColor == 1) that.css.filter = "invert(100%)";
        that.center("top");
        that.cursor = "pointer";
        that.setMotion("opacity 0.3s");

    endBox();

    // *** OBJECT INIT CODE:
    box.txtSearch.inputElement.addEventListener("keyup", function(event) {

        // Her tuşa basınca
        box.onSearch(getSearchedText(), box);

        // Sadece enter a basınca.
        if (event.key === "Enter") {
            box.onSubmit(getSearchedText(), box);
        }

        if (box.isCancelEnabled) setClearIconVisible(box.txtSearch.text.length > 0);

    });
    box.onResize(refreshLayout);
    box.imgClearIcon.onClick(function(self) {

        setClearIconVisible(0);
        box.txtSearch.text = "";
        box.onSearch(getSearchedText(), box);
        box.onSubmit(getSearchedText(), box);

    });
    box.imgClearIcon.clickable = 0;

    makeBasicObject(box);
    return box;

};

// Sayfaya bir kez eklenen ::placeholder kuralı. (Sadece placeholderColor verilen inputları etkiler.)
SearchInput.addPlaceholderStyle = function() {

    if (document.getElementById("searchInputPlaceholderStyle")) return;

    const styleElement = document.createElement("style");
    styleElement.id = "searchInputPlaceholderStyle";
    styleElement.textContent = "input[data-placeholder-color]::placeholder { color: var(--placeholder-color); opacity: 1; }";
    document.head.appendChild(styleElement);

};
