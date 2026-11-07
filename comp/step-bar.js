/* Bismillah */

/*

StepBar - v26.11

UI COMPONENT
- The steps of a job in a row: a cart, an address, a payment, done. A step that is behind has a check mark, the step of
  now is filled, the next ones are empty; a line joins them.
- A step: a text, or { key, title, note }. Its title is plain text.
- canGoBack: 1: a click (or Enter) on a step that is behind calls onStepClick(self, index); the page decides to go
  back with setStep(index). A step that is not reached yet can not be clicked.
- A narrow screen: the titles get thinner and wrap; showTitles: 0 leaves only the circles.
- Style packages: "light" (default), "dark". Select with styleName (StepBar.styles), or later with setTheme().

USAGE:
const steps = StepBar({
    width: "100%",
    steps: ["Cart", "Address", { title: "Payment", note: "Card or cash" }, "Done"],
    currentStep: 1,
    onStepClick: function (self, index) { self.setStep(index); },
});
steps.next();
steps.previous();
steps.setStep(3);
steps.setSteps(["One", "Two"]);

Started Date: November 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const StepBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "auto",
    steps: [], // [STEP]: a text or { key, title, note }
    currentStep: 0, // The step of now, from 0. steps.length: every step is done.
    canGoBack: 1, // 1: a step that is behind can be clicked (onStepClick)
    showTitles: 1,
    ariaLabel: "Steps",
    onStepClick: function (self, index) { }, // A step that is behind was chosen. setStep() goes there.
    styleName: "light", // "light", "dark" or a name added to StepBar.styles
    style: { // Light style package (default)
        circle: { size: 30, fontSize: 13, lineWidth: 2 },
        title: { fontSize: 13, space: 8 },
        note: { fontSize: 12 },
        line: { size: 2, space: 6 }, // space: between a line and a circle
        colors: {
            done: "#3F8D94", // A step that is behind, the line before the step of now
            doneText: "white",
            current: "#3F8D94",
            currentText: "white",
            next: Black(0.25), // The ring of a step that is not reached yet, and its line
            nextText: Black(0.55),
            title: Black(0.82),
            titleNext: Black(0.5),
            note: Black(0.5),
            hover: "rgba(63, 141, 148, 0.12)",
        },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
    },
};

const StepBar = function (params = {}) {

    // Merge style package: params.style > StepBar.styles[styleName] > StepBarDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, StepBar.styles, StepBarDefaults);

    // Merge params:
    mergeIntoIfMissing(params, StepBarDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    let parts = []; // { step, column, circle, lineBefore, lineAfter, lblTitle, lblNote, isHovered }

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, StepBar.styles, StepBarDefaults);
        mergeIntoIfMissing(fresh, StepBarDefaults);
        return fresh.style;
    };

    const toStep = function (step, index) {
        if (typeof step != "object" || step === null) return { key: String(index), title: String(step), note: "" };
        return { key: (step.key === undefined) ? String(index) : String(step.key), title: String(step.title || ""), note: String(step.note || "") };
    };

    const stateOf = function (index) {
        if (index < box.currentStep) return "done";
        return (index === box.currentStep) ? "current" : "next";
    };

    const canClick = function (index) {
        return (box.canGoBack == 1 && index < box.currentStep);
    };

    // PAINT: one step as its state says (behind, now, not reached), the mouse on it.
    const paintPart = function (part, index) {
        const colors = _s.colors;
        const state = stateOf(index);
        const isReached = (state !== "next");
        const circle = part.circle;
        circle.color = (isReached) ? colors[state] : "transparent";
        circle.borderColor = (isReached) ? colors[state] : colors.next;
        circle.textColor = (isReached) ? colors[state + "Text"] : colors.nextText;
        circle.text = (state === "done") ? StepBar.CHECK_SVG : String(index + 1);
        circle.boxShadow = (part.isHovered && canClick(index)) ? "0 0 0 6px " + colors.hover : "none";
        part.lblTitle.textColor = (isReached) ? colors.title : colors.titleNext;
        part.lblTitle.bold = (state === "current") ? 1 : 0;
        part.lineBefore.color = (index <= box.currentStep) ? colors.done : colors.next;
        part.lineAfter.color = (index < box.currentStep) ? colors.done : colors.next;
        part.column.cursor = canClick(index) ? "pointer" : "default";
        part.column.tabIndex = canClick(index) ? 0 : -1;
        part.column.role = canClick(index) ? "button" : "listitem";
        part.column.aria = { current: (state === "current") ? "step" : null, label: (index + 1) + ". " + part.step.title };
    };

    const paintParts = function () {
        parts.forEach(paintPart);
    };

    const onPartClick = function (index) {
        if (!canClick(index)) return;
        box.onStepClick(box, index);
    };

    // The look that comes from the style: sizes and places.
    const applyPartLook = function (part, index) {
        const circle = _s.circle;
        const line = _s.line;
        part.circle.props({ width: circle.size, height: circle.size, round: circle.size / 2, fontSize: circle.fontSize, border: circle.lineWidth });
        const lineTop = (circle.size - line.size) / 2;
        const lineLength = "calc(50% - " + (circle.size / 2 + line.space) + "px)";
        [part.lineBefore, part.lineAfter].forEach(function (oneLine) {
            oneLine.props({ height: line.size, top: lineTop });
            oneLine.css.width = lineLength;
        });
        part.lineBefore.visible = (index > 0) ? 1 : 0;
        part.lineAfter.visible = (index < parts.length - 1) ? 1 : 0;
        part.lblTitle.props({ fontSize: _s.title.fontSize, visible: box.showTitles });
        part.lblTitle.css.marginTop = _s.title.space + "px";
        part.lblNote.props({ fontSize: _s.note.fontSize, textColor: _s.colors.note, visible: (box.showTitles == 1 && part.step.note !== "") ? 1 : 0 });
        part.column.setFocusRing(_s.focus.ringColor);
    };

    const createPart = function (step, index) {
        const part = { step: step, isHovered: 0 };
        // GROUP: A step: its circle, its title and its note
        part.column = VGroup({ width: "auto", height: "auto", align: "center top", position: "relative", clipContent: 0, css: { flex: "1 1 0", minWidth: "0" } });
            // BOX: The lines to the steps before and after. WHY two halves: each step draws its own part of the line.
            // WHY absolute: in a group a box takes its place in the flow and pushes the circle down.
            part.lineBefore = Box({ left: 0, color: "transparent", css: { position: "absolute" } });
            part.lineAfter = Box({ left: "auto", color: "transparent", css: { position: "absolute", right: "0" } });
            part.circle = Label({ text: "", textAlign: "center", css: { display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", flexShrink: "0" } });
            part.lblTitle = Label({ width: "100%", textAlign: "center", css: { overflowWrap: "break-word", padding: "0 4px", boxSizing: "border-box" } });
            part.lblTitle.plainText = step.title;
            part.lblNote = Label({ width: "100%", textAlign: "center", css: { overflowWrap: "break-word", padding: "0 4px", boxSizing: "border-box", marginTop: "2px" } });
            part.lblNote.plainText = step.note;
        endGroup();
        part.column.on("click", function () { onPartClick(index); });
        part.column.on("keydown", function (self, event) {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onPartClick(index);
        });
        part.column.onHoverChange(function (self, isOver) {
            part.isHovered = isOver;
            paintPart(part, index);
        });
        return part;
    };

    const createParts = function () {
        parts.forEach(function (part) { part.column.remove(); });
        createIn(box.row, function () {
            parts = box.steps.map(createPart);
        });
        parts.forEach(applyPartLook);
        paintParts();
    };

    const inRange = function (index) {
        const number = Math.round(Number(index));
        if (!isFinite(number)) return 0;
        return Math.min(Math.max(number, 0), box.steps.length);
    };

    // *** PUBLIC FUNCTIONS:

    // onStepClick is not called. steps.length: every step is done.
    box.setStep = function (index) {
        box.currentStep = inRange(index);
        paintParts();
    };
    // USAGE: steps.setStep(2)

    box.next = function () {
        box.setStep(box.currentStep + 1);
    };

    box.previous = function () {
        box.setStep(box.currentStep - 1);
    };

    box.getStep = function () {
        return box.currentStep;
    };

    box.setSteps = function (steps) {
        box.steps = (Array.isArray(steps) ? steps : []).map(toStep);
        box.currentStep = inRange(box.currentStep);
        createParts();
    };
    // USAGE: steps.setSteps(["One", "Two"])

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        parts.forEach(applyPartLook);
        paintParts();
    };
    // USAGE: steps.setTheme("dark")

    // *** OBJECT VIEW:

    box.color = "transparent";
    box.clipContent = 0;
    box.role = "list";
    box.aria = { label: box.ariaLabel };

    // GROUP: The steps side by side. WHY relative: a box of height "auto" grows with it.
    box.row = HGroup({ width: "100%", height: "auto", align: "left top", position: "relative", clipContent: 0 });
    endGroup();

    // *** OBJECT INIT CODE:

    box.setSteps(box.steps);

    return endObject(box);

};

StepBar.CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"' +
    ' stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// *** STYLE PACKAGES:
// USAGE: StepBar({ styleName: "dark" })
// USAGE: StepBar({ style: { colors: { current: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
StepBar.styles = {

    // The dark cyan of the kit on a light page.
    light: StepBarDefaults.style,

    // For a dark page: the main cyan of the kit.
    dark: {
        colors: {
            done: "#5BBAC1",
            doneText: "#1C1C1B",
            current: "#5BBAC1",
            currentText: "#1C1C1B",
            next: White(0.28),
            nextText: White(0.6),
            title: White(0.88),
            titleNext: White(0.5),
            note: White(0.5),
            hover: "rgba(91, 186, 193, 0.18)",
        },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};
