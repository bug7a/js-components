/* Bismillah */

/*

Search Input - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- Style packages: "classic" (default), "ozden", "ozdenDark". Select with styleName. (SearchInput.styles)
-- "ozden" and "ozdenDark" are 44 px high (the user, 2026-11-05; "classic" and the defaults: 50). A height given by
   the page wins over it.
- The vertical place (2026-11-05, the user): textOffsetY / clearIconOffsetY move the text and the clear icon from the
  middle of the box. ozden / ozdenDark: -2 / -1: center() does not count their 3 px bottom line, and the small letters
  of Open Sans sit low in their line (measured: the text was about 3 px low, the clear icon 1 px; the search icon is
  right where it is: its round lens is over the middle, its handle under it).
-- A package is a package of params (basic.js v26.10.27): its keys fill the params you did not give.
-- SearchInput.styles.myStyle = { style: {}, color: "white", textColor: "#222", ... };
- animated: 1 adds small motions (not at the first view): under the mouse a thin line and a bigger search icon,
  while typing a stronger line and a tilted search icon (a small pulse at every letter), the clear icon grows in
  and turns under the mouse. Off in every package, "ozden" and "ozdenDark" too (the user, 2026-10-27): give animated: 1.
  Only transform, opacity and box-shadow change (smooth, cheap). Off when the system asks for reduced motion.
- Place: left / top (default 0, 0), or right / bottom: SearchInput({ right: 20, bottom: 20 }) is at the right bottom
  corner of its box (the default left / top is not used then). Sample: 02-comp-examples/search-input-v2-place.htm
- The right end (2026-11-05, the user): clearIconRight moves the clear icon and the end of the text to the left, so
  the right end of the box is kept for an object of the page (the column chip of SmartTable); setClearIconRight().
  A click on such an object keeps its own click (it does not start typing). clearIconMinTextWidth: a narrow box does
  not show its clear icon when the text beside it would be narrower than this; the text gets its place.
- A cut text (2026-11-05, the user): a text longer than the box is not cut sharply: it fades out over textFadeWidth px
  at the side where it goes on (under the clear icon, an object of the page, or the search icon). While not typing,
  it goes on under the icon at its end (SearchInput.TEXT_UNDER_END: 20 px, the width of the clear icon) and fades
  out slowly into it. While typing, the text ends before the icon and only the far side of a caret at the end of the
  text fades, so the caret is always seen. textFadeWidth: 0 cuts sharply.
- Escape (2026-11-05, the user): clearOnEscape: 1 makes Escape clear the text, as the clear icon (also in a narrow
  box with no clear icon). The key is used (preventDefault): a Dialog or a SidePanel around the field does not close;
  in an empty field Escape goes on to them. Off by default; SmartTable turns it on for its filter.

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
    searchIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.707 22.293l-5.969-5.969a10.016 10.016 0 10-1.414 1.414l5.969 5.969a1 1 0 001.414-1.414zM10 18a8 8 0 118-8 8.009 8.009 0 01-8 8z"/></svg>'),
    clearIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'),
    searchIconSize: 24,
    searchIconLeft: 16, // px: the search icon from the left side of the box
    searchIconGap: 8, // px: between the search icon and the text
    clearIconRight: 16, // px: the clear icon from the right side of the box (more: the right end is for an object of the page)
    isCancelEnabled: 1,
    clearIconMinTextWidth: 0, // px: the clear icon is not shown when the text beside it would be narrower (0: always shown)
    textFadeWidth: 24, // px: a text longer than the box fades out over this width where it is cut (0: cut sharply)
    clearOnEscape: 0, // 1: Escape clears the text (as the clear icon); in an empty field it goes on to the page
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
    textOffsetY: 0, // px: the text up (-) or down (+) from the middle of the box (the ozden packages: -2)
    clearIconOffsetY: 0, // px: the clear icon up (-) or down (+) from the middle of the box (the ozden packages: -1)
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

    // WHY: A box placed with right / bottom does not get the default left / top. In basic.js the setter of left
    //      clears right (and top clears bottom), so the default left: 0 / top: 0, set after them, put the box back
    //      at the left top corner.
    const isPlacedByRight = (params.right !== undefined && params.left === undefined);
    const isPlacedByBottom = (params.bottom !== undefined && params.top === undefined);

    // Merge params:
    mergeIntoIfMissing(params, SearchInputDefaults);
    if (isPlacedByRight) delete params.left;
    if (isPlacedByBottom) delete params.top;

    // BOX: Component container
    const box = startObject(params);
    
    // *** Private variables:
    const ICONS_SPACE = 80; // The width of the box that is not for the text, with the default icon place (16 + 8)
    const CLEAR_ICON_PLACE = 16; // px: the text is longer by this when the clear icon is not used

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
    const PULSE_GROW = 1.14; // the search icon at a typed letter
    const PULSE_TIME = 150; // ms
    let isHovered = 0;
    let isFocused = 0;
    let isClearHovered = 0;
    let wasAnimated = 0;
    let isPulsing = 0;
    let cancelPulse = null;

    // *** Public variables:
    box.publicVar = "";

    // *** Private functions:

    // The width of the text beside the clear icon: the box without the icons. A search icon moved from its default
    // place (16 + 8), or a clear icon moved from its place (clearIconRight 16), moves the text too.
    const getTextWidthWithClearIcon = function() {
        const iconMove = (box.searchIconLeft - SearchInputDefaults.searchIconLeft) + (box.searchIconGap - SearchInputDefaults.searchIconGap);
        const clearIconMove = box.clearIconRight - SearchInputDefaults.clearIconRight;
        return box.width - ICONS_SPACE - iconMove - clearIconMove;
    };

    // The clear icon is used: it is on, and the box has room for it (clearIconMinTextWidth)
    const isClearIconUsed = function() {
        if (!box.isCancelEnabled) return false;
        if (!box.clearIconMinTextWidth) return true;
        return getTextWidthWithClearIcon() >= box.clearIconMinTextWidth;
    };

    // The width of the text: with no clear icon, the text goes on to its place. While not typing, a cut text goes on
    // under the icon (or the object of the page) at its end and fades out there.
    const getTextWidth = function() {
        const width = getTextWidthWithClearIcon();
        const textWidth = isClearIconUsed() ? width : width + CLEAR_ICON_PLACE;
        return textWidth + getTextUnderEnd();
    };

    // How far the text goes under the icon at its end (0 while typing, or with no fade)
    // WHY not while typing: the caret at the end of the text must not be under the icon.
    const getTextUnderEnd = function() {
        if (isFocused || !box.textFadeWidth) return 0;
        return SearchInput.TEXT_UNDER_END;
    };

    const refreshTextWidth = function() {
        box.txtSearch.width = getTextWidth();
        refreshTextFade();
    };

    // The text and the icons in the middle of the box; textOffsetY and clearIconOffsetY move the text and the clear
    // icon from there (the ozden packages: see SearchInput.styles.ozden).
    const placeVertically = function(self) {
        self.txtSearch.center("top");
        self.txtSearch.top += self.textOffsetY;
        self.imgClearIcon.center("top");
        self.imgClearIcon.top += self.clearIconOffsetY;
        self.imgIcon.center("top");
    };

    const refreshLayout = function(self) {

        self.txtSearch.width = getTextWidth();
        placeVertically(self);
        refreshClearIcon(); // WHY: a narrower or a wider box can lose or get back its clear icon (clearIconMinTextWidth)
        refreshTextFade();

    };

    // The box itself, the search icon or the text (not the clear icon, not an object of the page in the box)
    const isFieldPart = function(target) {
        return target === box.elem || box.imgIcon.elem.contains(target) || box.txtSearch.elem.contains(target);
    };

    // The sides where the text is cut fade out (it goes on under an icon or an object of the page).
    // WHY only the far side of a caret at the end while typing: a faded side hid the caret (arrows, a click in the text).
    const refreshTextFade = function() {
        const input = box.txtSearch.inputElement;
        const isCutLeft = (input.scrollLeft > 0);
        const isCutRight = (input.scrollLeft + input.clientWidth < input.scrollWidth - 1);
        const isCaretAtEnd = (input.selectionStart === input.value.length);
        const canFade = (box.textFadeWidth > 0) && (!isFocused || isCaretAtEnd);
        const mask = canFade ? getTextFadeMask(isCutLeft, isCutRight) : "";
        box.txtSearch.css = { maskImage: mask, webkitMaskImage: mask };
    };

    // A mask that is transparent at a cut side and reaches the text after textFadeWidth px ("": no fade). At the end
    // the fade is longer by the part under the icon: the text fades out slowly into it.
    const getTextFadeMask = function(isCutLeft, isCutRight) {
        if (!isCutLeft && !isCutRight) return "";
        const startFade = box.textFadeWidth + "px";
        const endFade = (box.textFadeWidth + getTextUnderEnd()) + "px";
        const start = isCutLeft ? "transparent 0px, #000 " + startFade : "#000 0px";
        const end = isCutRight ? "#000 calc(100% - " + endFade + "), transparent 100%" : "#000 100%";
        return "linear-gradient(to right, " + start + ", " + end + ")";
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
        if (isPulsing) return "scale(" + PULSE_GROW + ") rotate(" + FOCUS_ICON_TILT + "deg)";
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

    // A letter is typed: the search icon grows a little and goes back. (Many letters: one longer pulse.)
    const pulseSearchIcon = function() {
        if (!isMotionOn()) return;
        if (cancelPulse) cancelPulse();
        isPulsing = 1;
        paintMotion();
        cancelPulse = box.after(PULSE_TIME, function() {
            isPulsing = 0;
            cancelPulse = null;
            paintMotion();
        });
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

    // The clear icon is shown while there is a text (and the box has room for it)
    const refreshClearIcon = function() {
        setClearIconVisible(isClearIconUsed() && box.txtSearch.text.length > 0);
    };

    // The text goes (the clear icon, or Escape: clearOnEscape); the page gets an empty search.
    const clearText = function() {
        setClearIconVisible(0);
        box.txtSearch.text = "";
        refreshTextFade();
        box.onSearch(getSearchedText(), box);
        box.onSubmit(getSearchedText(), box);
    };

    // clearOnEscape: Escape clears a text. In an empty field the key goes on to the page (a Dialog closes).
    const onEscapeKey = function(self, event) {
        if (event.key !== "Escape" || event.isComposing) return;
        if (box.clearOnEscape != 1 || box.txtSearch.text === "") return;
        // WHY: the first Escape is for the text: a Dialog or a SidePanel around the field must not close with it
        //      (they leave a used key: defaultPrevented)
        event.preventDefault();
        event.stopPropagation();
        clearText();
    };

    // *** Public functions:
    box.publicFunc = () => {};

    box.setText = function(text) {
        box.txtSearch.text = text;
        refreshClearIcon();
        refreshTextFade();
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

    // The right end of the box for an object of the page: the clear icon and the end of the text move left.
    box.setClearIconRight = function(right) {
        box.clearIconRight = right;
        box.imgClearIcon.right = right;
        refreshLayout(box);
    }
    // USAGE: searchInput.setClearIconRight(60)

        // *** OBJECT TEMPLATE:
        box.css.borderBottom = box.borderBottomStyle;

        // ICON: Search icon
        box.imgIcon = Icon(box.searchIconLeft, 0, box.searchIconSize, box.searchIconSize, {
            opacity: box.searchIconOpacity,
            space: 0,
        });
        that.load(box.searchIconFile);
        if (isIconInverted(box.invertSearchIconColor)) that.css.filter = "invert(100%)";

        // INPUT: Search textbox
        box.txtSearch = Input(box.searchIconLeft + box.searchIconSize + box.searchIconGap, 0, {
            width: getTextWidth(),
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
            right: box.clearIconRight,
            opacity: 0,
            space: 0,
        });
        that.load(box.clearIconFile);
        if (isIconInverted(box.invertClearIconColor)) that.css.filter = "invert(100%)";
        that.cursor = "pointer";

        placeVertically(box); // (again at every resize: refreshLayout)

    // *** OBJECT INIT CODE:
    // Every change of the text: typed, pasted, dropped or filled by the browser.
    // WHY "input" (it was keyup): a text pasted with the mouse, dropped or filled by the browser was never searched
    //     (the list kept the old text); and the arrows, Enter, Escape, which change nothing, searched again.
    box.listenTo(box.txtSearch.inputElement, "input", function() {
        box.onSearch(getSearchedText(), box);
        refreshClearIcon();
        refreshTextFade();
    });

    // Sadece enter a basınca.
    box.listenTo(box.txtSearch.inputElement, "keyup", function(self, event) {
        if (event.key === "Enter") box.onSubmit(getSearchedText(), box);
        refreshTextFade(); // (the arrows, Home and End move the caret)
    });
    // The text scrolls in its box (typing at the end, the blur takes it back to its start), a click moves the caret.
    box.listenTo(box.txtSearch.inputElement, "scroll", refreshTextFade);
    box.listenTo(box.txtSearch.inputElement, "mouseup", refreshTextFade);
    box.listenTo(box.txtSearch.inputElement, "keydown", onEscapeKey);
    box.onResize(refreshLayout);
    box.imgClearIcon.onClick(clearText);
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
        refreshTextWidth();
    });
    // WHY: "input" and not keyup: arrows, Shift and Enter do not change the text, they must not pulse.
    box.listenTo(box.txtSearch.inputElement, "input", pulseSearchIcon);
    box.listenTo(box.txtSearch.inputElement, "blur", function() {
        isFocused = 0;
        paintMotion();
        refreshTextWidth();
    });
    // A click on the field (an icon, the space around the text) starts typing. (A click on an object of the page in
    // the box, Ex: the column chip of SmartTable, is its own.)
    box.on("click", function(self, event) {
        if (event.target === box.txtSearch.inputElement) return;
        if (!isFieldPart(event.target)) return;
        box.focus();
    });
    // WHY: setMotion waits a moment before it starts: the first view does not move.
    applyAnimated();

    return endObject(box);

};

// px: while not typing, a cut text goes this far under the clear icon (its width) or the object at its end, and fades
// out there (2026-11-05, the user: "a little into the icon, fading slowly"; it was half of the fade, 12 px)
SearchInput.TEXT_UNDER_END = 20;

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
        searchIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.707 22.293l-5.969-5.969a10.016 10.016 0 10-1.414 1.414l5.969 5.969a1 1 0 001.414-1.414zM10 18a8 8 0 118-8 8.009 8.009 0 01-8 8z"/></svg>'),
        clearIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="rgba(0,0,0,0.12)" stroke-width="1"/><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"/></svg>'),
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
        height: 44, // (the user, 2026-11-05: the default is 50) as the search box of ItemList and SelectBox ozden
        textOffsetY: -2, // WHY: center() does not count the 3 px bottom line, and the small letters of Open Sans sit low
        clearIconOffsetY: -1, // WHY: the middle of the face of the box (center() does not count the 3 px bottom line)
        border: 1,
        borderColor: "rgba(0, 0, 0, 0.1)",
        borderBottomStyle: "3px solid rgba(0, 0, 0, 0.06)",
        round: 50,
        animated: 0, // 1: small hover / focus motions
        hoverRingColor: "rgba(0, 0, 0, 0.08)", // Alpha("#141414", 0.2), // 
        focusRingColor: "rgba(0, 0, 0, 0.16)", // Alpha("#23BCC1", 0.6), //
    },

    // The dark theme of ozden: the same shape on a dark field, light text and icons.
    // WHY: invertIconColor also inverts clear-round.svg, so the clear button is a dark circle with a light cross.
    ozdenDark: {
        style: {},
        searchIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.707 22.293l-5.969-5.969a10.016 10.016 0 10-1.414 1.414l5.969 5.969a1 1 0 001.414-1.414zM10 18a8 8 0 118-8 8.009 8.009 0 01-8 8z"/></svg>'),
        clearIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="rgba(0,0,0,0.12)" stroke-width="1"/><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"/></svg>'),
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
        height: 44, // (the user, 2026-11-05: the default is 50) as the search box of ItemList and SelectBox ozden
        textOffsetY: -2, // WHY: center() does not count the 3 px bottom line, and the small letters of Open Sans sit low
        clearIconOffsetY: -1, // WHY: the middle of the face of the box (center() does not count the 3 px bottom line)
        border: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderBottomStyle: "3px solid rgba(255, 255, 255, 0.06)",
        round: 50,
        animated: 0, // 1: small hover / focus motions
        hoverRingColor: "rgba(255, 255, 255, 0.08)", // Alpha("#FFFFFF", 0.2), //
        focusRingColor: "rgba(255, 255, 255, 0.18)", // Alpha("#23BCC1", 0.6), //
    },

};
