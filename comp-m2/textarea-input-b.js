/* Bismillah */

/*

TextareaInputB - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values
const TextareaInputBDefaults = {
    titleText: "MESSAGE",
    placeholder: "",
    warningText: "Invalid email format",
    warningColor: "#E5885E", // "#F1BF3C"
    maxChar: 35,
    height: 180,
    rightPadding: 20,
    descriptionText: "Some more description",
};

const TextareaInputB = function(params = {}) {

    // BOX: Component container
    const box = startExtendedObject(InputB, TextareaInputBDefaults, params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    
    // *** OBJECT VIEW:

    // *** OBJECT INIT CODE:
    
    // Event bindings
    
    box.inputGroup.height = "100%";

    const oldInput = box.input.inputElement;

    const newTextarea = document.createElement("textarea");

    newTextarea.id = oldInput.id;
    newTextarea.placeholder = oldInput.placeholder;
    newTextarea.rows = 4;
    newTextarea.maxLength = oldInput.maxLength;

    // Tüm classları aktar
    newTextarea.className = oldInput.className;

    // Inline stilleri aktar
    newTextarea.style.cssText = oldInput.style.cssText;

    newTextarea.style.width = "100%"; // sabit genişlik örneği
    newTextarea.style.height = "110px";
    //newTextarea.style.overflow = "hidden";
    newTextarea.style.resize = "none";

    // DOM'da input yerine textarea yerleştir
    oldInput.replaceWith(newTextarea);
    box.input.inputElement = newTextarea;
    box.input.inputElement.value = "test";
    box.input.color = "yellow";

    //const inputElem = box.input.inputElement;

    //inputElem.addEventListener("input", function () {
        /*
        const value = inputElem.value;

        // E-posta doğrulaması için doğru regex
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

        if (isValid) {
            box.hideWarning();  // eğer tanımlıysa
        } else {
            if(window.lblHint) {
                window.lblHint.top = -1000;
            }
            box.showWarning();  // eğer tanımlıysa
        }
        */
    //});

    return endExtendedObject(box);

};