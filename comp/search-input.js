/* Bismillah */

/*

Search Input - v24.04

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- Style packages: "ozden" (the default), "ozdenDark", "original" (the first look: whitesmoke with a soft bottom line,
  the values of SearchInputDefaults), "light" (its old name "classic") and
  "dark" (the light and dark look of the kit: a white / dark field with one thin line, round 10, a line search icon,
  a soft round clear button, the accent on the edge while typing: _designs/search-input.htm).
  Select with styleName. (SearchInput.styles)
-- "light", "dark", "ozden" and "ozdenDark" are 44 px high ("original" and the defaults: 50). A
   height given by the page wins over it.
- focusBorderColor: the edge while typing, 2 px of this color ("": the edge does not change). It is a
  color, not a motion: also with animated: 0. "light" and "dark" have it. focusBorderWidth: 1 only the edge (minimal).
- The vertical place: textOffsetY / clearIconOffsetY / searchIconOffsetY move the text and the icons from the
  middle of the box. ozden / ozdenDark: -2 / -1: center() does not count their 3 px bottom line, and the small letters
  of Open Sans sit low in their line (measured: the text was about 3 px low, the clear icon 1 px; the search icon is
  right where it is: its round lens is over the middle, its handle under it). light / dark: the icons 1 px under the
  middle, at the middle of the small letters of the text.
-- A package is a package of params (basic.js v26.10.27): its keys fill the params you did not give.
-- SearchInput.styles.myStyle = { style: {}, color: "white", textColor: "#222", ... };
- animated: 1 adds small motions (not at the first view): under the mouse a thin line and a bigger search icon,
  while typing a stronger line and a tilted search icon (a small pulse at every letter), the clear icon grows in
  and turns under the mouse. Off in every package, "ozden" and "ozdenDark" too: give animated: 1.
  Only transform, opacity and box-shadow change (smooth, cheap). Off when the system asks for reduced motion.
- Place: left / top (default 0, 0), or right / bottom: SearchInput({ right: 20, bottom: 20 }) is at the right bottom
  corner of its box (the default left / top is not used then). Sample: 02-comp-examples/search-input-place.htm
- The right end: clearIconRight moves the clear icon and the end of the text to the left, so
  the right end of the box is kept for an object of the page (the column chip of SmartTable); setClearIconRight().
  A click on such an object keeps its own click (it does not start typing). textEndSpace: the px between the end of
  the text and the clear icon (light and dark: 6). clearIconMinTextWidth: a narrow box does
  not show its clear icon when the text beside it would be narrower than this; the text gets its place.
- A cut text: a text longer than the box is not cut sharply: it fades out over textFadeWidth px
  at the side where it goes on (under the clear icon, an object of the page, or the search icon). While not typing,
  it goes on under the icon at its end (SearchInput.TEXT_UNDER_END: 20 px, the width of the clear icon) and fades
  out slowly into it. While typing, the text ends before the icon and only the far side of a caret at the end of the
  text fades, so the caret is always seen. textFadeWidth: 0 cuts sharply.
- Escape: clearOnEscape: 1 makes Escape clear the text, as the clear icon (also in a narrow
  box with no clear icon). The key is used (preventDefault): a Dialog or a SidePanel around the field does not close;
  in an empty field Escape goes on to them. Off by default; SmartTable turns it on for its filter.

Started Date: December 2025
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

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
    textEndSpace: null, // px between the end of the text and the clear icon. null: 20 - searchIconSize (where it always was)
    showClearIcon: 1,
    clearIconMinTextWidth: 0, // px: the clear icon is not shown when the text beside it would be narrower (0: always shown)
    textFadeWidth: 24, // px: a text longer than the box fades out over this width where it is cut (0: cut sharply)
    clearOnEscape: 0, // 1: Escape clears the text (as the clear icon); in an empty field it goes on to the page
    value: "", // The text in the box: typing changes it. setValue(), getValue()
    placeholder: "Search",
    color: "whitesmoke",
    textColor: "rgba(0, 0, 0, 0.8)",
    placeholderColor: "", // "": the color of the browser. On a dark ground give a color like White(0.35).
    searchIconOpacity: 1,
    clearIconOpacity: 0.6, // The clear icon while it is shown
    border: 0,
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderBottomStyle: "2px solid rgba(0, 0, 0, 0.06)",
    focusBorderColor: "", // the edge while typing: 2 px of this color ("": it does not change)
    focusBorderWidth: 2, // px of the edge while typing: 2 the edge and a 1 px line inside it, 1 only the edge
    round: 6,
    fontSize: 20,
    textOffsetY: 0, // px: the text up (-) or down (+) from the middle of the box (the ozden packages: -2)
    clearIconOffsetY: 0, // px: the clear icon up (-) or down (+) from the middle of the box (the ozden packages: -1)
    searchIconOffsetY: 0, // px: the search icon up (-) or down (+) from the middle of the box (light and dark: 1)
    invertIconColor: 0, // 1: both icons are inverted (white icons for a dark field)
    invertSearchIconColor: null, // null: invertIconColor. 0 / 1: only the search icon
    invertClearIconColor: null, // null: invertIconColor. 0 / 1: only the clear icon
    animated: 0, // 1: small hover / focus / clear motions. (box.setAnimated(0/1))
    hoverRingColor: "rgba(0, 0, 0, 0.08)", // animated: the thin line inside the border under the mouse
    focusRingColor: "rgba(0, 0, 0, 0.16)", // animated: the line while typing
    onChange: function(self) {}, // The text changed (typed, pasted, cleared, setValue()): self.value, self.getSearchText() (lower case). Not at create time, not with setValue(value, 1)
    onEnter: function(self) {}, // Enter, and the clear icon: self.getSearchText()
    styleName: "ozden", // "ozden", "ozdenDark", "original" (the look of these defaults), "light" ("classic": its old name), "dark", "minimal", "minimalDark" or a name added to SearchInput.styles
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
    const CLEAR_ICON_SIZE = 20; // px

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
    let restBorderColor = ""; // focusBorderColor: the edge before typing

    // *** Public variables:
    box.publicVar = "";

    // *** Private functions:

    // The width of the text beside the clear icon: the box without the icons. A search icon moved from its default
    // place (16 + 8), or a clear icon moved from its place (clearIconRight 16), moves the text too.
    // textEndSpace: the space before the clear icon is given (light and dark: 6).
    const getTextWidthWithClearIcon = function() {
        if (box.textEndSpace !== null) {
            const textLeft = box.searchIconLeft + box.searchIconSize + box.searchIconGap;
            return box.width - textLeft - box.textEndSpace - CLEAR_ICON_SIZE - box.clearIconRight;
        }
        const iconMove = (box.searchIconLeft - SearchInputDefaults.searchIconLeft) + (box.searchIconGap - SearchInputDefaults.searchIconGap);
        const clearIconMove = box.clearIconRight - SearchInputDefaults.clearIconRight;
        return box.width - ICONS_SPACE - iconMove - clearIconMove;
    };

    // The clear icon is used: it is on, and the box has room for it (clearIconMinTextWidth)
    const isClearIconUsed = function() {
        if (!box.showClearIcon) return false;
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
        self.imgIcon.top += self.searchIconOffsetY;
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

    // THE EDGE WHILE TYPING (focusBorderColor): the edge and an inset line of the same color, 2 px. WHY also with
    // animated: 0: a field shows where the typing goes; it is a color, not a motion. (animated: 1 draws its own line.)
    const paintFocusEdge = function() {
        if (!box.focusBorderColor) return;
        if (isFocused) {
            restBorderColor = box.borderColor;
            box.borderColor = box.focusBorderColor;
        } else {
            box.borderColor = restBorderColor;
            box.css.borderBottom = box.borderBottomStyle;
        }
        if (isMotionOn()) return;
        const innerLine = box.focusBorderWidth - 1; // (the edge is 1 px of it)
        box.boxShadow = (isFocused && innerLine > 0) ? "inset 0 0 0 " + innerLine + "px " + box.focusBorderColor : "";
    };

    // The clear icon is shown while there is a text (and the box has room for it)
    const refreshClearIcon = function() {
        setClearIconVisible(isClearIconUsed() && box.txtSearch.text.length > 0);
    };

    // The text goes (the clear icon, or Escape: clearOnEscape); the page gets an empty search.
    const clearText = function() {
        setClearIconVisible(0);
        box.txtSearch.text = "";
        box.value = "";
        refreshTextFade();
        box.onChange(box);
        box.onEnter(box);
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

    // silent: 1 -> onChange is not called.
    box.setValue = function(value, silent = 0) {
        const text = (value === null || value === undefined) ? "" : String(value);
        if (text === box.txtSearch.text) return;
        box.txtSearch.text = text;
        box.value = text;
        refreshClearIcon();
        refreshTextFade();
        if (!silent) box.onChange(box);
    };
    // USAGE: get: search.value, set: search.setValue("shoes") / search.setValue("", 1) // silent

    box.getValue = function() {
        return box.txtSearch.text;
    };

    // The text to search with: the text in lower case
    box.getSearchText = function() {
        return box.txtSearch.text.toLowerCase();
    };
    // USAGE: list.search(searchInput.getSearchText())

    box.setPlaceholder = function(text) {
        box.placeholder = text;
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
        that.inputElement.setAttribute("placeholder", box.placeholder);
        // WHY: only CSS changes the color of ::placeholder. The rule is added to the page once; every input carries its color in its own variable.
        if (box.placeholderColor !== "") {
            SearchInput.addPlaceholderStyle();
            that.inputElement.setAttribute("data-placeholder-color", "1");
            that.inputElement.style.setProperty("--placeholder-color", box.placeholderColor);
        }

        // ICON: Clear icon button
        box.imgClearIcon = Icon(5, 0, CLEAR_ICON_SIZE, CLEAR_ICON_SIZE, {
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
    // WHY "input", not keyup: a text pasted with the mouse, dropped or filled by the browser was never searched
    //     (the list kept the old text); and the arrows, Enter, Escape, which change nothing, searched again.
    box.listenTo(box.txtSearch.inputElement, "input", function() {
        box.value = box.txtSearch.text;
        box.onChange(box);
        refreshClearIcon();
        refreshTextFade();
    });

    // Only Enter
    box.listenTo(box.txtSearch.inputElement, "keyup", function(self, event) {
        if (event.key === "Enter") box.onEnter(box);
        refreshTextFade(); // (the arrows, Home and End move the caret)
    });
    // The text scrolls in its box (typing at the end, the blur takes it back to its start), a click moves the caret.
    box.listenTo(box.txtSearch.inputElement, "scroll", refreshTextFade);
    box.listenTo(box.txtSearch.inputElement, "mouseup", refreshTextFade);
    box.listenTo(box.txtSearch.inputElement, "keydown", onEscapeKey);
    // The text at create: its clear icon and its fade come with the first refreshLayout (onResize).
    box.value = (box.value === null || box.value === undefined) ? "" : String(box.value);
    box.txtSearch.text = box.value;
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
        paintFocusEdge();
        refreshTextWidth();
    });
    // WHY: "input" and not keyup: arrows, Shift and Enter do not change the text, they must not pulse.
    box.listenTo(box.txtSearch.inputElement, "input", pulseSearchIcon);
    box.listenTo(box.txtSearch.inputElement, "blur", function() {
        isFocused = 0;
        paintMotion();
        paintFocusEdge();
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
// out there.
SearchInput.TEXT_UNDER_END = 20;

// The ::placeholder rule, added to the page once. (It touches only the inputs that have a placeholderColor.)
SearchInput.addPlaceholderStyle = function() {

    if (document.getElementById("searchInputPlaceholderStyle")) return;

    const styleElement = document.createElement("style");
    styleElement.id = "searchInputPlaceholderStyle";
    styleElement.textContent = "input[data-placeholder-color]::placeholder { color: var(--placeholder-color); opacity: 1; }";
    document.head.appendChild(styleElement);

};

// The icons of the light and dark looks: lines on a 24 x 24 grid, their colors in the drawing (no invert filter).
SearchInput.getLineSearchIconFile = function(color) {
    return "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20"/></svg>');
};

SearchInput.getRoundClearIconFile = function(circleColor, crossColor) {
    return "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="' + circleColor + '"/><path d="M9 9l6 6M15 9l-6 6" fill="none" stroke="' + crossColor + '" stroke-width="2" stroke-linecap="round"/></svg>');
};

// *** STYLE PACKAGES:
// USAGE: SearchInput({ styleName: "ozden" })
// USAGE: SearchInput({ styleName: "ozden", fontSize: 16 }) // A param you give wins over the package.
// NOTE: Every package has "style: {}": that is the mark of a package of params (basic.js v26.10.27).
//       Without it the keys would go into params.style and change nothing.
// NOTE: A package needs only the params that differ from SearchInputDefaults.
SearchInput.styles = {

    // The look of SearchInputDefaults (whitesmoke, a soft bottom line), the first look. SelectBox light / dark,
    // SmartTable "green" and FullScreenSelect use it by this name.
    original: { style: {} },

    // The light look of the kit (_designs/search-input.htm): a 44 px white field with one thin line and round 10
    // corners, a 15 px text, a line search icon, a soft round clear button; while typing the edge turns to the
    // accent of the kit (2 px).
    light: {
        style: {},
        searchIconFile: SearchInput.getLineSearchIconFile("#000000"),
        clearIconFile: SearchInput.getRoundClearIconFile("#A3A3A0", "#FFFFFF"),
        searchIconSize: 18,
        searchIconLeft: 14,
        clearIconRight: 12,
        searchIconOpacity: 0.55,
        clearIconOpacity: 1, // (its gray is in the drawing)
        invertIconColor: 0,
        color: "#FFFFFF",
        textColor: Black(0.88),
        placeholderColor: Black(0.38),
        fontSize: 15,
        height: 44,
        textOffsetY: -1, // WHY: the small letters of Open Sans sit low in their line
        searchIconOffsetY: 1, // WHY 1: the icons at the middle of the small letters of the text
        clearIconOffsetY: 1,
        textEndSpace: 6,
        border: 1,
        borderColor: Black(0.12),
        borderBottomStyle: "1px solid " + Black(0.12),
        focusBorderColor: "#3D7A6B", // the accent of the kit
        round: 10,
        animated: 0, // 1: small hover / focus motions
        hoverRingColor: Black(0.08),
        focusRingColor: "rgba(61, 122, 107, 0.5)",
    },

    // The dark look of the kit: the same field on the dark surface (#232322, on a #1A1A19 page), light text and icons.
    dark: {
        style: {},
        searchIconFile: SearchInput.getLineSearchIconFile("#FFFFFF"),
        clearIconFile: SearchInput.getRoundClearIconFile("#7A7A78", "#141414"),
        searchIconSize: 18,
        searchIconLeft: 14,
        clearIconRight: 12,
        searchIconOpacity: 0.55,
        clearIconOpacity: 1, // (its gray is in the drawing)
        invertIconColor: 0,
        color: "#232322",
        textColor: White(0.9),
        placeholderColor: White(0.38),
        fontSize: 15,
        height: 44,
        textOffsetY: -1, // WHY: the small letters of Open Sans sit low in their line
        searchIconOffsetY: 1, // WHY 1: the icons at the middle of the small letters of the text
        clearIconOffsetY: 1,
        textEndSpace: 6,
        border: 1,
        borderColor: White(0.12),
        borderBottomStyle: "1px solid " + White(0.12),
        focusBorderColor: "#65A293", // the accent of the kit on a dark page
        round: 10,
        animated: 0, // 1: small hover / focus motions
        hoverRingColor: White(0.08),
        focusRingColor: "rgba(101, 162, 147, 0.55)",
    },

    // Bugra's style: a round field with a thin line, a soft search icon and a white round clear button. (Change, add or remove any look param.)
    ozden: {
        style: {},
        searchIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M23.707 22.293l-5.969-5.969a10.016 10.016 0 10-1.414 1.414l5.969 5.969a1 1 0 001.414-1.414zM10 18a8 8 0 118-8 8.009 8.009 0 01-8 8z"/></svg>'),
        clearIconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#FFFFFF" stroke="rgba(0,0,0,0.12)" stroke-width="1"/><path d="M8 8l8 8M16 8l-8 8" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"/></svg>'),
        searchIconSize: 24,
        searchIconOpacity: 0.4,
        clearIconOpacity: 0.6, // WHY: at 0.6 the white circle faded into the field.
        invertIconColor: 0,
        invertSearchIconColor: null, // null: invertIconColor
        invertClearIconColor: null, // null: invertIconColor
        color: "whitesmoke",
        textColor: "rgba(0, 0, 0, 0.8)",
        placeholderColor: "",
        fontSize: 20,
        height: 44, // (the default is 50) as the search box of ItemList and SelectBox ozden
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
        height: 44, // (the default is 50) as the search box of ItemList and SelectBox ozden
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
SearchInput.styles.classic = SearchInput.styles.light; // the old name of light

// The minimal theme (_designs/minimal-theme.htm): 28 px, a 13 px text, no fill, a thin line with round ends that turns
// ink while typing, a line search icon and a line cross. minimalDark: the same in white on a dark window.
SearchInput.createMinimalStyle = function (colors) {
    const lineIcon = function (paths) {
        const svgStart = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
        return "data:image/svg+xml;utf8," + encodeURIComponent(svgStart + paths + "</svg>");
    };
    return {
        style: {},
        height: 28,
        searchIconFile: lineIcon('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
        clearIconFile: lineIcon('<path d="M9 9l6 6M15 9l-6 6"/>'), // WHY small: the icon box is 20 px, the cross as big as the search icon
        searchIconSize: 14,
        searchIconLeft: 10,
        searchIconGap: 6,
        clearIconRight: 8,
        searchIconOpacity: 0.55,
        clearIconOpacity: 0.55,
        invertIconColor: colors.invertIcons,
        color: "transparent",
        textColor: colors.text,
        placeholderColor: colors.placeholder,
        fontSize: 13,
        textOffsetY: 0, // WHY 0: at 13 px the band of the capitals and the line of the text sit in the middle (-1 read high)
        clearIconOffsetY: 0,
        border: 1,
        borderColor: colors.edge, // WHY edge: the line that shows the field (3:1 at least)
        borderBottomStyle: "1px solid " + colors.edge,
        focusBorderColor: colors.ink,
        focusBorderWidth: 1, // as the other minimal fields
        round: 14,
        animated: 0,
    };
};
SearchInput.MINIMAL_COLORS = { invertIcons: 0, text: Black(0.85), placeholder: Black(0.54), edge: Black(0.45), ink: "#1F1F1F" };
SearchInput.styles.minimal = SearchInput.createMinimalStyle(SearchInput.MINIMAL_COLORS);
SearchInput.MINIMAL_DARK_COLORS = { invertIcons: 1, text: White(0.88), placeholder: White(0.48), edge: White(0.42), ink: "#EDEDEB" };
SearchInput.styles.minimalDark = SearchInput.createMinimalStyle(SearchInput.MINIMAL_DARK_COLORS);
