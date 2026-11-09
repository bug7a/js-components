/* Bismillah */

/*

TextAreaField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "light" (the default) on a light page, "dark" on a dark page (the packages
  of TextField, comp/text-field.js; the look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one.
- scrollBarStyle: the scroll bar of the text (the params of ScrollBar; a style package can give it: minimal).
- rightPadding is its own (5): a style package does not change it (on the right is the scroll bar). Under its title
  (titlePosition "above", minimal), from the right edge: the scroll bar right inside the edge, the warning ball left
  of it, then the text.


Started Date: June 2024
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const TextAreaFieldDefaults = {
    type: "textarea",
    titleText: "MESSAGE",
    placeholder: "How can we help you?",
    required: 1,
    minCharCount: 80, // 0, 80
    showCount: 1, // 0, 1
    lengthText: "length: ",
    warningText: "The entered text must be longer than 80",
    warningColor: "#E5885E",
    maxLength: 255,
    height: 170, // 170 (4line)
    rightPadding: 5,
    unitStyle: {
        padding: [12, 4],
        color: "#373836EE",
        textColor: "white",
    },
    scrollBarStyle: { // The scroll bar of the text (the params of ScrollBar)
        bar_border: 0,
        bar_round: 2,
        bar_borderColor: "rgba(0, 0, 0, 1)",
        bar_width: 4,
        bar_mouseOverWidth: 4,
        bar_mouseOverColor: "#373836",
        bar_opacity: 0.4,
        bar_mouseOverOpacity: 0.9,
        bar_padding: 3,
        bar_color: "#373836",
        neverHide: 1,
        showDots: 1,
    },
};

const TextAreaField = function(params = {}) {

    // Merge params first: the style package of TextField, then the defaults of TextAreaField
    // WHY the package first: a package that sets a key of TextAreaField (minimal: unitStyle, scrollBarStyle) wins over the
    //     defaults here, as over the defaults of TextField
    // WHY its own rightPadding: on the right of a TextAreaField is its scroll bar, not the room of the warning ball of a
    //     one-line field (the rightPadding of a package pushed the scroll bar to the middle)
    const givenRightPadding = params.rightPadding;
    basic.applyStylePackage(params, TextField.styles, TextFieldDefaults);
    params.rightPadding = (givenRightPadding !== undefined) ? givenRightPadding : TextAreaFieldDefaults.rightPadding;
    mergeIntoIfMissing(params, TextAreaFieldDefaults);

    // Control params
    params.createInput = 0; // WHY: A <textarea> is made here instead of the Input of TextField.
    params.showDescription = 0;
    params.descriptionText = "";

    if (params.showCount != 0) {
        params.showUnit = 1;
    }

    // BOX: Component container
    const box = startExtendedObject(TextField, params);

    // *** PRIVATE VARIABLES:
    const textareaElem = document.createElement("textarea");

    // *** PUBLIC VARIABLES:
    box.textareaElem = textareaElem; // the raw <textarea>: a page can listen to its paste / drop / keydown

    // *** PRIVATE FUNCTIONS:
    // The count is hidden when the text is long enough.
    const refreshCount = function() {
        if (!box.showCount) return;

        const currentLength = box.getValue().length;
        box.setUnitText(`${box.lengthText}${currentLength}`);
        box.unit.opacity = (currentLength > box.minCharCount) ? 0 : 1;
    }

    // The textarea grows with its text (the inputBox scrolls).
    const autoGrow = function(elem) {
        elem.style.height = "auto"; // WHY: First reset, so scrollHeight is the height of the text (also when it got shorter).
        // WHY: not drawn yet (a closed tab, a Dialog filled before it opens): scrollHeight is 0 and a 0 px textarea
        //      could not be seen or clicked. box.onResize grows it when it is shown.
        if (elem.scrollHeight === 0) return;
        elem.style.height = elem.scrollHeight + "px";
        // WHY: After the browser drew the new height.
        box.after(0, () => box.inputBox.scrollBar.refreshScroll());
    };

    // *** PUBLIC FUNCTIONS:
    box.setValue = function(value) { // OVERRIDE
        if (value != textareaElem.value) {
            box.value = value;
            textareaElem.value = value;
            // WHY: Same as TextField.setValue. Without it, a required textarea cleared by code (after a form is sent) showed no required icon.
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
            refreshCount();
            autoGrow(textareaElem);
        }
    };

    box.getValue = function() { // OVERRIDE
        return textareaElem.value;
    };

    // WHY: The ones of TextField write to box.input, which a TextAreaField does not have (createInput: 0): a TypeError.
    box.setPlaceholder = function(text) { // OVERRIDE
        box.placeholder = text;
        textareaElem.placeholder = text;
    };

    box.setMaxLength = function(count) { // OVERRIDE
        box.maxLength = count;
        textareaElem.maxLength = count;
    };

    box.isValid = function() { // OVERRIDE
        return (box.getValue().length > box.minCharCount) ? 1 : 0;
    };
    
    // UNDER ITS TITLE (titlePosition "above"), from the right edge of the field: the scroll bar right inside the edge,
    // the warning ball left of it, then the text. WHY apart: the scroll bar was under the ball.
    const EDGE_WIDTH = 1; // px: the edge of the field
    const BALL_SPACE = 2; // px between the scroll bar and the ball, and between the ball and the text
    const placeRightSideUnderTitle = function () {
        const bar = box.scrollBarStyle;
        const barRoom = bar.bar_padding + Math.max(bar.bar_width, bar.bar_mouseOverWidth);
        const ballRight = EDGE_WIDTH + barRoom + BALL_SPACE;
        const textRight = ballRight + box.warningBall.width + BALL_SPACE - EDGE_WIDTH; // from the right of the text box
        box.inputGroup.padding = [box.leftPadding, 0, EDGE_WIDTH, 0];
        box.warningBall.right = ballRight;
        textareaElem.style.padding = TEXT_SPACE + "px " + textRight + "px " + TEXT_SPACE + "px 0px";
    };

    // *** OBJECT VIEW:
        const isTitleAbove = (box.titlePosition === "above");
        const TEXT_SPACE = 6; // px over and under the text in a field under its title (titlePosition "above")
        box.inputGroup.gap = isTitleAbove ? box.titleGap : 8;
        box.inputGroup.height = "100%";
        box.inputBox.color = "transparent";
        box.inputBox.height = isTitleAbove ? "calc(100% - " + box.fieldTop + "px)" : "calc(100% - 20px)";
        
        // WHY: A raw <textarea> (not a basic.js object): its style is written directly.
        textareaElem.classList.add("basic_textbox");
        textareaElem.classList.add("minimal");
        textareaElem.style.cssText = "background-color:transparent;font-size:" + box.inputFontSize + "px;resize:none;width:100%;padding:0px 0px;box-sizing:border-box";
        textareaElem.style.overflow = "hidden";
        if (isTitleAbove) placeRightSideUnderTitle();
        // WHY a CSS size, not the measured one: the field is clickable in all its height, also when it is made hidden
        //     (box.inputBox.height is 0 then) and after the text changed (autoGrow cleared the measured one)
        textareaElem.style.minHeight = "calc(100% - 4px)";
        textareaElem.style.height = "auto";
        
        textareaElem.placeholder = box.placeholder;
        // WHY: The <textarea> is made here, not by TextField, so the text colors of TextField were never given to it:
        //      on a dark package (dark, ozdenDark) the typed text was dark on a dark field.
        box.applyTextColors(textareaElem);
        textareaElem.maxLength = box.maxLength;
        box.inputBox.elem.appendChild(textareaElem);
        box.inputBox.clickable = 1;
        textareaElem.value = box.value;
        box.inputBox.scrollY = 1;

        // SCROLL BAR:
        box.inputBox.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.inputBox }, box.scrollBarStyle));
        

    // *** OBJECT INIT CODE:
    
    // Event bindings
    box.focusFunc = function () {
        box.paintFocus(1);
        box.onFocus(box);
    }
    textareaElem.addEventListener("focus", function(){ box.focusFunc() });
    
    box.blurFunc = function () {
        box.paintFocus(0);
        box.onBlur(box);
    }
    textareaElem.addEventListener("blur", function(){ box.blurFunc() });

    box.inputFunc = function () {

        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());

        // Refresh count on unit
        refreshCount();
        autoGrow(textareaElem);

        box.onChange(box);

    }
    textareaElem.addEventListener("input", function(){ box.inputFunc() });

    box.checkIfInputIsRequiredAndEmpty();

    refreshCount();

    box.onResize(function() {
        autoGrow(textareaElem); // WHY: a field made or filled while hidden gets its height when it is shown
    });

    return endExtendedObject(box);

};
