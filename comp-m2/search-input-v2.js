/* Bismillah */

/*

Search Input - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- Style packages: "classic" (default), "ozden", "ozdenDark". Select with styleName. (SearchInput.styles)
-- A package is a package of params (basic.js v26.10.27): its keys fill the params you did not give.
-- SearchInput.styles.myStyle = { style: {}, color: "white", textColor: "#222", ... };
- animated: 1 adds small motions (not at the first view): under the mouse a thin line and a bigger search icon,
  while typing a stronger line and a tilted search icon, the clear icon grows in and turns under the mouse.
  Only transform, opacity and box-shadow change (smooth, cheap). Off when the system asks for reduced motion.

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
    clearIconOpacity: 0.6, // The clear icon while it is shown
    border: 0,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderBottomStyle: "2px solid rgba(0, 0, 0, 0.06)",
    round: 6,
    fontSize: 20,
    invertIconColor: 0, // 1: both icons are inverted (white icons for a dark field)
    invertSearchIconColor: null, // null: invertIconColor. 0 / 1: only the search icon
    invertClearIconColor: null, // null: invertIconColor. 0 / 1: only the clear icon
    animated: 0, // 1: small hover / focus / clear motions. (box.setAnimated(0/1))
    hoverRingColor: "rgba(0, 0, 0, 0.08)", // animated: the thin line inside the border under the mouse
    focusRingColor: "rgba(0, 0, 0, 0.16)", // animated: the line while typing
    onSearch: function(searchedText, self) {},
    onSubmit: function(searchedText, self) {},
    styleName: "classic", // "classic", "ozden", "ozdenDark" or a name added to SearchInput.styles
    style: {}, // WHY: the look is in the flat params above; the packages are packages of params (see SearchInput.styles).
};

const SearchInput = function(params = {}) {

    // Merge style package: your params > SearchInput.styles[styleName] (a package of params) > SearchInputDefaults
    basic.applyStylePackage(params, SearchInput.styles, SearchInputDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SearchInputDefaults);

    // BOX: Component container
    const box = startObject(params);
    
    // *** Private variables:
    const ICON_LEFT = 16; // The search icon from the left side
    const ICON_GAP = 8; // Between the search icon and the text
    const ICONS_SPACE = 80; // The width of the box that is not for the text (the two icons and their spaces)

    // animated: 1
    const MOTION_TIME = "0.25s";
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start and a soft stop
    const HOVER_RING_WIDTH = 1;
    const FOCUS_RING_WIDTH = 2;
    const HOVER_ICON_GROW = 1.08;
    const FOCUS_ICON_GROW = 1.06; // WHY: at 1.1 the tilted icon touched the text
    const FOCUS_ICON_TILT = -12; // deg: the magnifier "looks"
    const ICON_OPACITY_GAIN = 0.25; // the search icon is clearer under the mouse (x2 while typing)
    const HIDDEN_CLEAR_ICON_SIZE = 0.6; // the clear icon grows in from this size
    const CLEAR_ICON_TURN = 90; // deg, under the mouse
    let isHovered = 0;
    let isFocused = 0;
    let isClearHovered = 0;
    let wasAnimated = 0;

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

    // An icon's own invert param (0 / 1), or invertIconColor when it is null.
    const isIconInverted = function(iconInvert) {
        if (iconInvert === null || iconInvert === undefined) return (box.invertIconColor == 1);
        return (iconInvert == 1);
    };

    const setClearIconVisible = function(isVisible) {
        box.imgClearIcon.opacity = (isVisible) ? box.clearIconOpacity : 0;
        box.imgClearIcon.clickable = (isVisible) ? 1 : 0;
        paintMotion();
    };

    // WHY: A user who asked the system for less motion gets the still field.
    const isMotionOn = function() {
        if (box.animated != 1) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    const getRing = function() {
        if (isFocused) return "inset 0 0 0 " + FOCUS_RING_WIDTH + "px " + box.focusRingColor;
        if (isHovered) return "inset 0 0 0 " + HOVER_RING_WIDTH + "px " + box.hoverRingColor;
        return "inset 0 0 0 0 transparent";
    };

    const getSearchIconTransform = function() {
        if (isFocused) return "scale(" + FOCUS_ICON_GROW + ") rotate(" + FOCUS_ICON_TILT + "deg)";
        if (isHovered) return "scale(" + HOVER_ICON_GROW + ")";
        return "none";
    };

    const getSearchIconOpacity = function() {
        let gain = 0;
        if (isHovered) gain = ICON_OPACITY_GAIN;
        if (isFocused) gain = ICON_OPACITY_GAIN * 2;
        return Math.min(1, box.searchIconOpacity + gain);
    };

    const getClearIconTransform = function() {
        if (!box.imgClearIcon.clickable) return "scale(" + HIDDEN_CLEAR_ICON_SIZE + ")";
        if (isClearHovered) return "rotate(" + CLEAR_ICON_TURN + "deg)";
        return "none";
    };

    // The look of the hover / focus / clear icon state. (Nothing when animated is off.)
    const paintMotion = function() {
        if (!isMotionOn()) return;
        box.boxShadow = getRing();
        box.imgIcon.css.transform = getSearchIconTransform();
        box.imgIcon.opacity = getSearchIconOpacity();
        box.imgClearIcon.css.transform = getClearIconTransform();
    };

    // Back to the still look, after setAnimated(0).
    const removeMotion = function() {
        wasAnimated = 0;
        box.setMotion("");
        box.imgIcon.setMotion("");
        box.boxShadow = "";
        box.imgIcon.css.transform = "";
        box.imgIcon.opacity = box.searchIconOpacity;
        box.imgClearIcon.css.transform = "";
    };

    // The transitions and the still look of animated: 0.
    const applyAnimated = function() {
        if (!isMotionOn()) {
            box.imgClearIcon.setMotion("opacity 0.3s");
            if (wasAnimated) removeMotion();
            return;
        }
        wasAnimated = 1;
        const motion = function(properties) {
            return properties.map(function(property) { return property + " " + MOTION_TIME + " " + MOTION_EASE; }).join(", ");
        };
        box.setMotion(motion(["box-shadow"]));
        box.imgIcon.setMotion(motion(["transform", "opacity"]));
        box.imgClearIcon.setMotion(motion(["transform", "opacity"]));
        paintMotion();
    };

    // The clear icon is shown while there is a text
    const refreshClearIcon = function() {
        if (!box.isCancelEnabled) return;
        setClearIconVisible(box.txtSearch.text.length > 0);
    };

    // *** Public functions:
    box.publicFunc = () => {};

    box.setText = function(text) {
        box.txtSearch.text = text;
        refreshClearIcon();
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

    box.setAnimated = function(value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    }

        // *** OBJECT TEMPLATE:
        box.css.borderBottom = box.borderBottomStyle;

        // ICON: Search icon
        box.imgIcon = Icon(ICON_LEFT, 0, box.searchIconSize, box.searchIconSize, {
            opacity: box.searchIconOpacity,
            space: 0,
        });
        that.load(box.searchIconFile);
        if (isIconInverted(box.invertSearchIconColor)) that.css.filter = "invert(100%)";
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
        if (isIconInverted(box.invertClearIconColor)) that.css.filter = "invert(100%)";
        that.center("top");
        that.cursor = "pointer";

    // *** OBJECT INIT CODE:
    box.txtSearch.inputElement.addEventListener("keyup", function(event) {

        // Her tuşa basınca
        box.onSearch(getSearchedText(), box);

        // Sadece enter a basınca.
        if (event.key === "Enter") {
            box.onSubmit(getSearchedText(), box);
        }

        refreshClearIcon();

    });
    box.onResize(refreshLayout);
    box.imgClearIcon.onClick(function(self) {

        setClearIconVisible(0);
        box.txtSearch.text = "";
        box.onSearch(getSearchedText(), box);
        box.onSubmit(getSearchedText(), box);

    });
    box.imgClearIcon.onHoverChange(function(self, isOver) {
        isClearHovered = isOver;
        paintMotion();
    });
    // WHY: After onHoverChange: on() makes an object clickable, and the hidden clear icon must not be.
    box.imgClearIcon.clickable = 0;

    // animated: the state of the mouse and the focus (painted only when animated is on)
    box.onHoverChange(function(self, isOver) {
        isHovered = isOver;
        paintMotion();
    });
    box.listenTo(box.txtSearch.inputElement, "focus", function() {
        isFocused = 1;
        paintMotion();
    });
    box.listenTo(box.txtSearch.inputElement, "blur", function() {
        isFocused = 0;
        paintMotion();
    });
    // A click on the field (an icon, the space around the text) starts typing.
    box.on("click", function(self, event) {
        if (event.target === box.txtSearch.inputElement) return;
        if (box.imgClearIcon.elem.contains(event.target)) return;
        box.focus();
    });
    // WHY: setMotion waits a moment before it starts: the first view does not move.
    applyAnimated();

    return endObject(box);

};

// Sayfaya bir kez eklenen ::placeholder kuralı. (Sadece placeholderColor verilen inputları etkiler.)
SearchInput.addPlaceholderStyle = function() {

    if (document.getElementById("searchInputPlaceholderStyle")) return;

    const styleElement = document.createElement("style");
    styleElement.id = "searchInputPlaceholderStyle";
    styleElement.textContent = "input[data-placeholder-color]::placeholder { color: var(--placeholder-color); opacity: 1; }";
    document.head.appendChild(styleElement);

};

// *** STYLE PACKAGES:
// USAGE: SearchInput({ styleName: "ozden" })
// USAGE: SearchInput({ styleName: "ozden", fontSize: 16 }) // A param you give wins over the package.
// NOTE: Every package has "style: {}": that is the mark of a package of params (basic.js v26.10.27).
//       Without it the keys would go into params.style and change nothing.
// NOTE: A package needs only the params that differ from SearchInputDefaults.
SearchInput.styles = {

    // The look of SearchInputDefaults (whitesmoke, a soft bottom line).
    classic: { style: {} },

    // Bugra's style: a round field with a thin line, a soft search icon and a white round clear button. (Change, add or remove any look param.)
    ozden: {
        style: {},
        searchIconFile: "../comp-m2/search-input-v2/search.svg",
        clearIconFile: "../comp-m2/search-input-v2/clear-round.svg",
        searchIconSize: 24,
        searchIconOpacity: 0.4,
        clearIconOpacity: 0.6, // WHY: at 0.6 the white circle faded into the field (the user, 2026-10-27).
        invertIconColor: 0,
        invertSearchIconColor: null, // null: invertIconColor
        invertClearIconColor: null, // null: invertIconColor
        color: "whitesmoke",
        textColor: "rgba(0, 0, 0, 0.8)",
        placeholderColor: "",
        fontSize: 20,
        border: 1,
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderBottomStyle: "3px solid rgba(0, 0, 0, 0.06)",
        round: 50,
        hoverRingColor: "rgba(0, 0, 0, 0.08)",
        focusRingColor: "rgba(0, 0, 0, 0.16)",
    },

    // The dark theme of ozden: the same shape on a dark field, light text and icons.
    // WHY: invertIconColor also inverts clear-round.svg, so the clear button is a dark circle with a light cross.
    ozdenDark: {
        style: {},
        searchIconFile: "../comp-m2/search-input-v2/search.svg",
        clearIconFile: "../comp-m2/search-input-v2/clear-round.svg",
        searchIconSize: 24,
        searchIconOpacity: 0.4,
        clearIconOpacity: 0.4,
        invertIconColor: null,
        invertSearchIconColor: 1, // null: invertIconColor
        invertClearIconColor: 1, // null: invertIconColor
        color: "#2B2D31",
        textColor: "rgba(255, 255, 255, 0.88)",
        placeholderColor: "rgba(255, 255, 255, 0.35)",
        fontSize: 20,
        border: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderBottomStyle: "3px solid rgba(255, 255, 255, 0.06)",
        round: 50,
        hoverRingColor: "rgba(255, 255, 255, 0.08)",
        focusRingColor: "rgba(255, 255, 255, 0.18)",
    },

};
