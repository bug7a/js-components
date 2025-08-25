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
    searchIconFile: "../comp-m1/search-input/search.svg",
    clearIconFile: "../comp-m1/search-input/clear.svg",
    searchIconSize: 24,
    isCancelEnabled: 1,
    placeholderText: "Search",
    color: "whitesmoke",
    textColor: "rgba(0, 0, 0, 0.8)",
    border: 0,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderBottomStyle: "2px solid rgba(0, 0, 0, 0.06)",
    round: 6,
    fontSize: 20,
    invertIconColor: 0,
    onSearch: function(searchedText, self) {},
};

const SearchInput = function(params = {}) {

    // Marge params:
    mergeIntoIfMissing(params, SearchInputDefaults);

    // BOX: Component container
    const box = startBox();

    box.props(params);
    
    // *** Private variables:
    let privateVar = "";

    // *** Public variables:
    box.publicVar = "";

    // *** Private functions:
    const privateFunc = () => {};

    const uiResized = function(self) {

        self.txtSearch.width = self.width - 80;
        self.txtSearch.center("top");
        self.imgClearIcon.center("top");
        self.imgIcon.center("top");

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
        box.element.style.borderBottom = box.borderBottomStyle;

        // ICON: Search icon
        box.imgIcon = Icon(16, 0, box.searchIconSize, box.searchIconSize), {
            opacity: 0.6,
            space: 0,
        };
        that.load(box.searchIconFile);
        if (box.invertIconColor == 1) that.elem.style.filter = "invert(100%)";
        that.center("top");

        // INPUT: Search textbox
        box.txtSearch = Input(16 + box.searchIconSize + 8, 0, {
            width: box.width - 80,
            height: box.height,
            border: 0,
            minimal: 1,
            fontSize: box.fontSize,
            textColor: box.textColor,
            color: "transparent",
        });
        that.inputElement.style.paddingLeft = "0px";
        that.inputElement.setAttribute("placeholder", box.placeholderText);

        // ICON: Clear icon button
        box.imgClearIcon = Icon(5, 0, 20, 20, {
            right: 16,
            opacity: 0,
            space: 0,
        });
        that.load(box.clearIconFile);
        if (box.invertIconColor == 1) that.elem.style.filter = "invert(100%)";
        that.center("top");
        that.elem.style.cursor = "pointer";
        that.setMotion("opacity 0.3s");    

    endBox();

     // *** CODE:
     box.txtSearch.inputElement.addEventListener("keyup", function() {

        box.onSearch(box.txtSearch.text.toLowerCase(), box);

        if (box.isCancelEnabled) {
            if (box.txtSearch.text.length > 0) {
                box.imgClearIcon.opacity = 0.6;
                box.imgClearIcon.clickable = 1;
            } else {
                box.imgClearIcon.opacity = 0;
                box.imgClearIcon.clickable = 0;
            }
        }

    });
    box.onResize(uiResized);
    box.imgClearIcon.onClick(function(self) {

        self.opacity = 0;
        self.clickable = 0;
        box.txtSearch.text = "";
        box.onSearch(box.txtSearch.text.toLowerCase(), box);

    });

    makeBasicObject(box);
    return box;

};
