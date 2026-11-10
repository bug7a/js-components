/* Bismillah */

/*

UrlField - v26.11

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:
- NEW PROJECTS: styleName "light" (the default) on a light page, "dark" on a dark page (the packages
  of TextField, comp/text-field.js; the look of 02-comp-examples/text-field-8-light-dark.htm), unless the user asks for another one.

Started Date: July 2025
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values
const UrlFieldDefaults = {
    width: 400,
    required: 1,
    titleText: "URL",
    placeholder: "example.com",
    warningText: "Invalid URL format",
    warningColor: "#E5885E",
    maxLength: 255,
    rightPadding: 20,
    tinySelectParams: {
        titleText: "",
        list: [
            { value: "1", label: "http://" },
            { value: "2", label: "https://" },
            { value: "3", label: "http://www." },
            { value: "4", label: "https://www." },
        ],
        selectedIndex: 3,
        paddingX: 0,
        arrowSize: 20,
        // NOTE: The colors, the round, the height (selectStyle) and the size of the text (inputFontSize) come from the
        //       style package of TextField; a value given here wins.
    },
};

const UrlField = function(params = {}) {

    params.createInput = 0; // WHY: The input is made here, after the TinySelect of the protocol.

    // WHY the style package of TextField first: a key it sets (warningColor, rightPadding) wins over the defaults here, as
    //     over the defaults of TextField
    basic.applyStylePackage(params, TextField.styles, TextFieldDefaults);

    // BOX: Component container
    const box = startExtendedObject(TextField, UrlFieldDefaults, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // The params of the protocol select: the look of selectStyle (TextField) and the text color of the field,
    // then the tinySelectParams of the page over them.
    const getTinySelectParams = function() {
        const selectStyle = box.selectStyle;
        const lookParams = {
            fontSize: box.inputFontSize, // WHY: not 20 in every package: the 15 px text of light and dark
            color: selectStyle.color,
            round: selectStyle.round,
            invertIconColor: selectStyle.invertIconColor,
            labelTextColor: box.inputTextColor, // WHY: not "#373836": dark on a dark package
            listBackgroundColor: selectStyle.listBackgroundColor,
            listTextColor: selectStyle.listTextColor,
            listOverTextColor: selectStyle.listOverTextColor,
            listBorderColor: selectStyle.listBorderColor,
        };
        // WHY only with a spacing: without it the select keeps its own height, taller than the field, which cuts it
        if (selectStyle.spacing > 0) lookParams.height = box.inputHeight - 2 * selectStyle.spacing;
        const tinySelectParams = Object.assign(lookParams, box.tinySelectParams);
        const pageOnChange = tinySelectParams.onChange;
        // WHY: another protocol is another value, and onChange was not called: a form that listens to it missed it
        tinySelectParams.onChange = function(select) {
            if (pageOnChange) pageOnChange(select);
            if (box.input.text !== "") box.onChange(box);
        };
        return tinySelectParams;
    };

    // *** PUBLIC FUNCTIONS:
    box.isValid = function() { // OVERRIDE

        // WHY a regex literal: in the old text form "\s" was only "s" (a JS text drops the "\"), so every path with
        //     an "s" was not valid ("/news") and a path with a space was
        const regex = /^(([a-zA-Z0-9-]+)\.)+[a-zA-Z]{2,}(:\d{2,5})?(\/\S*)?$/; // domain.com, :3000, /path?query=1

        // WHY: getValue() gives the protocol too ("https://..."): the text alone is box.input.text
        return (regex.test(box.input.text)) ? 1 : 0;

    };

    box.getValue = function() { // *** OVERRIDE ***
        // WHY "": an empty field was "https://www." (the protocol alone): never "Required", and a form sent it
        if (box.input.text === "") return "";
        return box.tinySelect.list[box.tinySelect.selectedIndex].label + box.input.text;
    };

    // The protocol of the list that starts the value (the longest: "https://www." before "https://"), or -1
    const findProtocolIndex = function(value) {
        const list = box.tinySelect.list;
        let found = -1;
        list.forEach(function(item, index) {
            const isLonger = (found === -1 || item.label.length > list[found].label.length);
            if (value.indexOf(item.label) === 0 && isLonger) found = index;
        });
        return found;
    };

    const superSetValue = box.setValue;
    // WHY: getValue() gives the protocol and the text; the setValue of TextField wrote them all into the text,
    //      so a saved value came back as "https://www.https://www.example.com" and could not be sent
    box.setValue = function(value) { // *** OVERRIDE ***
        const text = String(value ?? "");
        const index = findProtocolIndex(text);
        if (index === -1) {
            superSetValue(text);
            return;
        }
        box.tinySelect.setSelectedIndex(index, 1);
        superSetValue(text.slice(box.tinySelect.list[index].label.length));
    };

    // *** OBJECT VIEW:
        AutoLayout({
            color: "transparent",
        });
        box.inputBox.add(that);

            box.tinySelect = TinySelect(getTinySelectParams());
            box.tinySelect.lblLabel.css.fontFamily = "opensans";

            box.input = Input({
                text: box.value,
                minimal: 1,
                fontSize: box.inputFontSize,
                height: 40,
                color: "transparent",
                width: "100%",
            });
            that.inputElement.style.padding = "0px 4px";
            that.inputElement.placeholder = box.placeholder;
            box.applyTextColors(that.inputElement);
            that.inputElement.maxLength = box.maxLength;
            that.inputElement.setAttribute("aria-label", box.titleText);

        endAutoLayout();

    // *** OBJECT INIT CODE:
    const inputElem = box.input.inputElement;

    // WHY: box.paintFocus() of TextField: this copy did not change the border on focus.
    box.focusFunc = function () {
        box.paintFocus(1);
        box.onFocus(box);
    }
    inputElem.addEventListener("focus", function(){ box.focusFunc() });

    box.blurFunc = function () {
        box.paintFocus(0);
        box.onBlur(box);
    }
    inputElem.addEventListener("blur", function(){ box.blurFunc() });

    box.inputFunc = function () { // A child component can override it.
        box.applyFormattedValueToInput();
        box.checkIfInputIsRequiredAndEmpty();
        box.showWarningIfNotValid(box.isValid());
        box.onChange(box);
    }
    inputElem.addEventListener("input", function(){ box.inputFunc() });

    // WHY: a start value with its protocol (as getValue() gives it) was put whole into the text
    if (findProtocolIndex(box.input.text) > -1) box.setValue(box.input.text);
    box.checkInputValue(); // WHY: the valid check too (the start value was only checked for required)

    return endExtendedObject(box);
};
