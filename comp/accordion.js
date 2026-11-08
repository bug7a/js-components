/* Bismillah */

/*

Accordion - v26.11

UI COMPONENT
- Sections that fold: a row with a title, and under it the objects of the section. (Advanced settings in a small window,
  the groups of a long form, questions and answers.)
- multiple: 1 (default): more than one section can be open. 0: a section that opens closes the others.
- A closed section keeps its objects: they keep their sizes, and can be made or changed while it is closed. It is only out
  of sight and out of the reach of the keyboard. WHY not display: none: objects made in a hidden group are not in its flow.
- height: "auto" (default): it grows with its open sections. A number or "100%": the sections scroll inside it.
- Keyboard: Tab comes to the rows; Enter or Space opens and closes; ArrowUp, ArrowDown, Home and End move between the rows.
- animated: 1: the arrow turns, and the objects of a section fade in when it opens. Nothing moves at the first view, and
  nothing with reduced motion. (context/basic-js-animated-rules.md: the height does not move.)
- Style packages: "light" (default), "dark", "minimal", "minimalDark". Select with styleName (Accordion.styles), or later
  with setTheme().

A SECTION: { key, text, description, iconFile, icon, opened, enabled, data }
- A text is also accepted: "General" -> { key: "General", text: "General" }. Without a key: its text is its key.
- text, description: plain text (never read as HTML). description: a soft text at the end of the row (Ex: "3 files").
  style.title and style.note are their look.
- icon: an SVG text (your own code, not a user text): it takes the color of style.icon (use stroke="currentColor" or
  fill="currentColor"). iconFile: an image file.
- opened: 1 -> open at the start. enabled: 0 -> it does not open or close with the mouse and the keyboard.
- data: anything of yours.

USAGE:
const settings = Accordion({
    sections: [{ key: "general", text: "General", opened: 1 }, { key: "advanced", text: "Advanced", description: "2 items" }],
    onToggle: function (self, section) { println(section.key + ": " + section.opened); },
});
settings.startSection("general");
    Label({ text: "The objects of this section, one under the other." });
settings.endSection();
createIn(settings.getContent("advanced"), function () { SmartButton({ labelText: "Reset" }); });
settings.open("advanced");             // onToggle is called
settings.close("advanced", 1);         // silent
settings.toggle("general");
settings.isOpen("general");
settings.getOpenKeys();                // ["general"]
settings.addSection({ key: "more", text: "More" });
settings.setSectionDescription("more", "New");
settings.setTheme("dark");
Accordion({ multiple: 0, sections: ["One", "Two"], styleName: "dark", animated: 1 });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const AccordionDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "auto", // "auto": it grows with its open sections. A number or "100%": the sections scroll inside it.
    sections: [], // [SECTION] (See A SECTION above)
    multiple: 1, // 1: more than one section can be open. 0: a section that opens closes the others.
    arrowSide: "right", // "right", "left": where the arrow of a row is
    enabled: 1,
    animated: 0, // 1: the arrow turns, the objects of a section fade in. setAnimated()
    useScrollBar: 1, // basic/scroll-bar.js (when it is loaded), with a height that is not "auto". 0: the scrollbar of the browser.
    onToggle: function (self, section) { }, // section.key, section.opened. (Not at create time, not with silent: 1)
    styleName: "light", // "light", "dark", "minimal", "minimalDark" or a name added to Accordion.styles
    style: { // Light style package (default)
        box: { color: "white", border: 1, borderColor: Black(0.12), round: 10 },
        row: { height: 44, padding: 14, gap: 10, color: "transparent", hoverColor: Black(0.04) },
        title: { fontSize: 15, bold: 1, textColor: Black(0.82) },
        note: { fontSize: 13, textColor: Black(0.5) },
        icon: { size: 20, textColor: Black(0.6) },
        arrow: { size: 14, textColor: Black(0.5) },
        line: { size: 1, color: Black(0.1) }, // Between the sections
        content: { color: "transparent", padding: [14, 12], gap: 12 },
        disabled: { opacity: 0.4 },
        focus: { ringColor: "rgba(63, 141, 148, 0.8)" },
        scrollBar: { bar_color: "#9A9A98", bar_mouseOverColor: "#6A6A68", bar_width: 4, bar_round: 3 },
    },
};

const Accordion = function (params = {}) {

    // Merge style package: params.style > Accordion.styles[styleName] > AccordionDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, Accordion.styles, AccordionDefaults);

    // Merge params:
    mergeIntoIfMissing(params, AccordionDefaults);

    // WHY before startObject: box.height never reads "auto".
    const isAutoHeight = (String(params.height) === "auto");

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const MOTION_TIME = 0.25; // s
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start and a soft stop
    const SPRING_TIME = 0.35; // s: the turn of the arrow
    const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // a small overshoot, then back
    const CLOSE_TIME = 0.15; // s: a section closes faster than it opens
    const CONTENT_SHIFT = 6; // px: the objects come from this far when a section opens
    const OPEN_ARROW = "rotate(180deg)";
    const partsOf = new Map(); // section -> the objects of its row and its content
    const startedSections = []; // the containers startSection() goes back to
    let wasAnimated = 0;

    // *** PUBLIC VARIABLES:
    // NOTE: box.sections are the sections (see A SECTION), with section.opened 0 or 1. Default values are also public variables.

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, Accordion.styles, AccordionDefaults);
        mergeIntoIfMissing(fresh, AccordionDefaults);
        return fresh.style;
    };

    const findSection = function (key) {
        return box.sections.find(function (section) { return String(section.key) === String(key); });
    };

    const hasOpenSection = function () {
        return box.sections.some(function (section) { return section.opened === 1; });
    };

    const isSectionEnabled = function (section) {
        return (box.enabled == 1 && section.enabled === 1);
    };

    // A section from the page, as a plain object of its own (a text too).
    const toSection = function (given) {
        const isObject = (typeof given === "object" && given !== null);
        const section = Object.assign({}, (isObject) ? given : { text: String(given) });
        if (section.key === undefined || section.key === null) section.key = section.text;
        if (section.text === undefined || section.text === null) section.text = String(section.key);
        section.description = (section.description === undefined || section.description === null) ? "" : section.description;
        section.opened = basic.isOn(section.opened) ? 1 : 0;
        section.enabled = (section.enabled === undefined || basic.isOn(section.enabled)) ? 1 : 0;
        if (box.multiple != 1 && hasOpenSection()) section.opened = 0;
        return section;
    };

    const isMotionOn = function () {
        if (box.animated != 1) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    const refreshScroll = function () {
        if (box.scrollBar && box.scrollBar.refreshScroll) box.scrollBar.refreshScroll();
    };

    // PAINT: the look of a row: the mouse on it, enabled or not.
    const paintRow = function (section) {
        const parts = partsOf.get(section);
        const isEnabled = isSectionEnabled(section);
        parts.row.color = (parts.isHovered && isEnabled) ? _s.row.hoverColor : _s.row.color;
        parts.row.opacity = (isEnabled) ? 1 : _s.disabled.opacity;
        parts.row.cursor = (isEnabled) ? "pointer" : "default";
        parts.row.tabIndex = (isEnabled) ? 0 : -1;
        parts.row.aria = { disabled: (isEnabled) ? "false" : "true" };
    };

    // The texts of a row. WHY plainText: a title can be a text of a user.
    const applyContent = function (section) {
        const parts = partsOf.get(section);
        parts.title.plainText = section.text;
        parts.note.plainText = section.description;
        parts.note.visible = (section.description === "") ? 0 : 1;
        parts.frame.aria = { label: section.text };
    };

    // The look of a section that comes from the style (the first drawing and setTheme).
    const applySectionLook = function (section) {
        const parts = partsOf.get(section);
        parts.line.props({ height: _s.line.size, color: _s.line.color });
        parts.row.props({ height: _s.row.height, gap: _s.row.gap, padding: [_s.row.padding, 0] });
        parts.row.setFocusRing(_s.focus.ringColor);
        parts.title.props(_s.title);
        parts.note.props(_s.note);
        parts.arrow.props({ width: _s.arrow.size, height: _s.arrow.size, textColor: _s.arrow.textColor });
        if (parts.icon) parts.icon.props({ width: _s.icon.size, height: _s.icon.size, textColor: _s.icon.textColor });
        parts.content.props({ color: _s.content.color, gap: _s.content.gap, padding: _s.content.padding });
        paintRow(section);
    };

    // The line is between the sections: the first one has none.
    const refreshLines = function () {
        box.sections.forEach(function (section, index) {
            partsOf.get(section).line.visible = (index > 0) ? 1 : 0;
        });
    };

    // The objects of a section fade and move when it opens and closes (with animated: 1).
    const paintContentMotion = function (section) {
        if (!isMotionOn()) return;
        const parts = partsOf.get(section);
        const isOpen = (section.opened === 1);
        parts.content.css.transitionDuration = ((isOpen) ? MOTION_TIME : CLOSE_TIME) + "s";
        parts.content.opacity = (isOpen) ? 1 : 0;
        parts.content.css.transform = (isOpen) ? "none" : "translateY(" + (-CONTENT_SHIFT) + "px)";
    };

    const cancelClosing = function (parts) {
        if (!parts.cancelClosing) return;
        parts.cancelClosing();
        parts.cancelClosing = null;
    };

    // The height of what folds. WHY after a moment: the objects fade out first.
    const placeFrame = function (section) {
        const parts = partsOf.get(section);
        cancelClosing(parts);
        if (section.opened === 1) {
            parts.frame.height = "auto";
            return;
        }
        if (!isMotionOn()) {
            parts.frame.height = 0;
            return;
        }
        parts.cancelClosing = box.after(CLOSE_TIME * 1000, function () {
            parts.frame.height = 0;
            parts.cancelClosing = null;
            refreshScroll();
        });
    };

    // Everything that follows open or closed. WHY one function: no setter can forget a part of it.
    const showOpenState = function (section) {
        const parts = partsOf.get(section);
        const isOpen = (section.opened === 1);
        parts.row.aria = { expanded: (isOpen) ? "true" : "false" };
        parts.frame.aria = { hidden: (isOpen) ? "false" : "true" };
        if (isOpen) parts.frame.elem.removeAttribute("inert");
        else parts.frame.elem.setAttribute("inert", ""); // WHY: Tab must not reach the objects of a closed section.
        parts.arrow.css.transform = (isOpen) ? OPEN_ARROW : "none";
        paintContentMotion(section);
        placeFrame(section);
        refreshScroll();
    };

    const applySectionMotion = function (section) {
        const parts = partsOf.get(section);
        parts.arrow.setMotion("transform " + SPRING_TIME + "s " + SPRING_EASE);
        parts.content.setMotion("opacity " + MOTION_TIME + "s " + MOTION_EASE + ", transform " + MOTION_TIME + "s " + MOTION_EASE);
        paintContentMotion(section);
    };

    const removeSectionMotion = function (section) {
        const parts = partsOf.get(section);
        parts.arrow.setMotion("");
        parts.content.setMotion("");
        parts.content.opacity = 1;
        parts.content.css.transform = "";
        parts.content.css.transitionDuration = "";
        placeFrame(section);
    };

    const applyAnimated = function () {
        if (isMotionOn()) {
            wasAnimated = 1;
            box.sections.forEach(applySectionMotion);
            return;
        }
        if (!wasAnimated) return;
        wasAnimated = 0;
        box.sections.forEach(removeSectionMotion);
    };

    const setOpened = function (section, opened, silent) {
        if (section.opened === opened) return;
        section.opened = opened;
        showOpenState(section);
        if (!silent) box.onToggle(box, section);
    };

    const openSection = function (section, silent) {
        if (box.multiple != 1) {
            box.sections.forEach(function (other) {
                if (other !== section) setOpened(other, 0, silent);
            });
        }
        setOpened(section, 1, silent);
    };

    const toggleSection = function (section, silent) {
        if (section.opened === 1) setOpened(section, 0, silent);
        else openSection(section, silent);
    };

    const enabledRows = function () {
        return box.sections.filter(isSectionEnabled).map(function (section) { return partsOf.get(section).row; });
    };

    // The row a key goes to from a row, or null for another key.
    const rowOfKey = function (row, key) {
        const rows = enabledRows();
        const place = rows.indexOf(row);
        if (key === "ArrowDown") return rows[Math.min(place + 1, rows.length - 1)];
        if (key === "ArrowUp") return rows[Math.max(place - 1, 0)];
        if (key === "Home") return rows[0];
        if (key === "End") return rows[rows.length - 1];
        return null;
    };

    const onRowKeyDown = function (section, event) {
        if (!isSectionEnabled(section)) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleSection(section, 0);
            return;
        }
        const row = rowOfKey(partsOf.get(section).row, event.key);
        if (!row) return;
        event.preventDefault();
        row.elem.focus();
    };

    const listenToRow = function (section) {
        const parts = partsOf.get(section);
        parts.row.on("click", function () {
            if (isSectionEnabled(section)) toggleSection(section, 0);
        });
        parts.row.on("keydown", function (self, event) { onRowKeyDown(section, event); });
        parts.row.onHoverChange(function (self, value) {
            parts.isHovered = value;
            paintRow(section);
        });
    };

    // ICON: A picture file, or LABEL: an SVG text that takes the color of the style. None: no place.
    const createRowIcon = function (section) {
        if (section.iconFile) {
            const icon = Icon({ shrink: 0, space: 0 });
            icon.load(section.iconFile);
            return icon;
        }
        if (!section.icon) return null;
        basic.addCss("accordion-svg", ".accordion-svg svg { display: block; width: 100%; height: 100%; }");
        const icon = Label({ text: section.icon, shrink: 0 });
        icon.elem.classList.add("accordion-svg");
        return icon;
    };

    const createRowArrow = function (parts) {
        // LABEL: The arrow. WHY a Label: its SVG takes the color of its text.
        parts.arrow = Label({ text: Accordion.getArrowSvg(), shrink: 0 });
    };

    // The objects of a section, at the end of the list.
    const createSectionView = function (section) {
        const parts = { isHovered: 0, cancelClosing: null };

        // GROUP: A section
        parts.group = VGroup({ width: "100%", height: "auto", align: "left top", shrink: 0 });

            // BOX: The line over it
            parts.line = Box({ width: "100%", shrink: 0 });

            // GROUP: Its row
            parts.row = HGroup({ width: "100%", align: "left center", shrink: 0 });
            parts.row.role = "button";

                if (box.arrowSide === "left") createRowArrow(parts);
                parts.icon = createRowIcon(section);

                // LABEL: Title. WHY width 0 and grow: a long title gives way to the note and is cut with an ellipsis.
                parts.title = Label({ width: 0, grow: 1, shrink: 1, ellipsis: 1 });

                // LABEL: Note
                parts.note = Label({ shrink: 0 });
                parts.note.css.whiteSpace = "nowrap";

                if (box.arrowSide !== "left") createRowArrow(parts);

            endGroup();

            // GROUP: What folds. WHY a group around the content: its height goes to 0, the content keeps its own.
            parts.frame = VGroup({ width: "100%", height: "auto", align: "left top", shrink: 0 });
            parts.frame.role = "region";

                // GROUP: The objects of the section
                parts.content = VGroup({ width: "100%", height: "auto", align: "left top", shrink: 0, clipContent: 0 });
                endGroup();

            endGroup();

        endGroup();

        partsOf.set(section, parts);
    };

    const addSectionToList = function (given) {
        const section = toSection(given);
        if (findSection(section.key)) {
            console.warn("Accordion: The key is used: " + section.key);
            return null;
        }
        box.sections.push(section);
        createIn(box.list, function () { createSectionView(section); });
        listenToRow(section);
        applyContent(section);
        applySectionLook(section);
        if (wasAnimated) applySectionMotion(section);
        showOpenState(section);
        refreshLines();
        return section;
    };

    const removeSectionFromList = function (section) {
        const parts = partsOf.get(section);
        cancelClosing(parts);
        parts.group.remove();
        partsOf.delete(section);
        box.sections.splice(box.sections.indexOf(section), 1);
    };

    // LOOK: what comes from the style (the first drawing and setTheme)
    const applyLook = function () {
        box.props(_s.box);
        box.sections.forEach(applySectionLook);
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onToggle is not called. These work on a disabled section too: only the mouse and the keyboard can not.
    box.open = function (key, silent = 0) {
        const section = findSection(key);
        if (section) openSection(section, silent);
    };
    // USAGE: settings.open("advanced")

    box.close = function (key, silent = 0) {
        const section = findSection(key);
        if (section) setOpened(section, 0, silent);
    };
    // USAGE: settings.close("advanced", 1)

    box.toggle = function (key, silent = 0) {
        const section = findSection(key);
        if (section) toggleSection(section, silent);
    };

    // Only with multiple: 1: with multiple: 0 only one section can be open.
    box.openAll = function (silent = 0) {
        if (box.multiple != 1) return;
        box.sections.forEach(function (section) { setOpened(section, 1, silent); });
    };

    box.closeAll = function (silent = 0) {
        box.sections.forEach(function (section) { setOpened(section, 0, silent); });
    };

    box.isOpen = function (key) {
        const section = findSection(key);
        return (section && section.opened === 1) ? 1 : 0;
    };

    box.getOpenKeys = function () {
        return box.sections.filter(function (section) { return section.opened === 1; }).map(function (section) { return section.key; });
    };

    box.getSection = function (key) {
        return findSection(key) || null;
    };

    // The group of the objects of a section. USAGE: createIn(settings.getContent("general"), function () { Label({ text: "Hi" }); });
    box.getContent = function (key) {
        const section = findSection(key);
        return (section) ? partsOf.get(section).content : null;
    };

    // The objects made until endSection() go into this section, one under the other.
    // WHY a group in it: an endGroup() of the page goes back to this group, not to the box that was open before.
    box.startSection = function (key) {
        const section = findSection(key) || addSectionToList({ key: key });
        startedSections.push(getDefaultContainerBox());
        setDefaultContainerBox(partsOf.get(section).content);
        return VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.content.gap, shrink: 0, clipContent: 0 });
    };

    box.endSection = function () {
        endGroup();
        const previous = startedSections.pop();
        if (previous) setDefaultContainerBox(previous);
    };

    box.addSection = function (section) {
        return addSectionToList(section);
    };
    // USAGE: settings.addSection({ key: "more", text: "More", opened: 1 })

    box.removeSection = function (key) {
        const section = findSection(key);
        if (!section) return;
        removeSectionFromList(section);
        refreshLines();
        refreshScroll();
    };

    // New sections in the place of all of them (their objects go too).
    box.setSections = function (sections) {
        box.sections.slice().forEach(removeSectionFromList);
        sections.forEach(addSectionToList);
        refreshScroll();
    };

    box.setSectionText = function (key, text) {
        const section = findSection(key);
        if (!section) return;
        section.text = text;
        applyContent(section);
    };

    box.setSectionDescription = function (key, text) {
        const section = findSection(key);
        if (!section) return;
        section.description = text;
        applyContent(section);
    };

    box.setSectionEnabled = function (key, value) {
        const section = findSection(key);
        if (!section) return;
        section.enabled = basic.isOn(value) ? 1 : 0;
        paintRow(section);
    };

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        box.sections.forEach(paintRow);
    };

    box.setAnimated = function (value) {
        box.animated = basic.isOn(value) ? 1 : 0;
        applyAnimated();
    };
    // USAGE: settings.setAnimated(1)

    // The row of a section takes the focus (no key: the first one that can).
    box.focus = function (key) {
        const section = findSection(key);
        const row = (section) ? partsOf.get(section).row : enabledRows()[0];
        if (row) row.elem.focus();
    };

    // Another style package while it is on the page. A style given by the page stays over it.
    box.setTheme = function (styleName) {
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        applyLook();
    };
    // USAGE: settings.setTheme("dark")

    // *** OBJECT VIEW:

    const createList = function () {
        // GROUP: The sections. WHY position: a relative group makes a box of height "auto" wrap it.
        box.list = VGroup({ width: "100%", height: "auto", align: "left top", position: "relative" });
        endGroup();
    };

    if (isAutoHeight) {
        createList();
    } else {
        // BOX: The place that scrolls
        box.listArea = startBox({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });
        box.listArea.scrollY = 1;
            createList();
        endBox();
        if (box.useScrollBar == 1 && typeof ScrollBar !== "undefined") {
            box.scrollBar = ScrollBar(Object.assign({ scrollableBox: box.listArea, neverHide: 0, showDots: 0 }, _s.scrollBar));
        }
    }

    // *** OBJECT INIT CODE:

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    box.props(_s.box);

    const givenSections = box.sections;
    box.sections = [];
    givenSections.forEach(addSectionToList);

    applyAnimated();
    if (!isAutoHeight) box.list.onResize(refreshScroll);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The arrow of a row: it looks down when closed, and turns when open. It takes the color of its text.
Accordion.getArrowSvg = function () {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 12 12" fill="none" stroke="currentColor"' +
        ' stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
};

// *** STYLE PACKAGES:
// USAGE: Accordion({ styleName: "dark" })
// USAGE: Accordion({ style: { box: { border: 0 }, row: { height: 52 } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: Accordion.styles.myStyle = { title: { textColor: "tomato" } };
Accordion.styles = {

    // White, a soft line between the sections.
    light: AccordionDefaults.style,

    // For a dark window: the colors of the fields of the kit.
    dark: {
        box: { color: "#232322", borderColor: White(0.12) },
        row: { hoverColor: White(0.05) },
        title: { textColor: White(0.9) },
        note: { textColor: White(0.5) },
        icon: { textColor: White(0.65) },
        arrow: { textColor: White(0.55) },
        line: { color: White(0.1) },
        focus: { ringColor: "rgba(111, 198, 205, 0.8)" },
    },

};

// The minimal theme (_designs/minimal-theme.htm): no fill (the ground of the window), a soft line around it and
// between the sections, 32 px rows with a 13 px title, a faint row under the mouse, small soft arrows and icons.
// minimalDark: the same on a dark window.
Accordion.createMinimalStyle = function (colors) {
    return {
        box: { color: "transparent", border: 1, borderColor: colors.line, round: 4 },
        row: { height: 32, padding: 10, gap: 8, color: "transparent", hoverColor: colors.hover },
        title: { fontSize: 13, bold: 1, textColor: colors.text },
        note: { fontSize: 12, textColor: colors.softText },
        icon: { size: 14, textColor: colors.softText },
        arrow: { size: 12, textColor: colors.softText },
        line: { size: 1, color: colors.line },
        content: { color: "transparent", padding: [10, 10], gap: 10 },
        disabled: { opacity: 0.4 },
        focus: { ringColor: colors.focus },
        scrollBar: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_round: 2 },
    };
};
Accordion.MINIMAL_COLORS = { text: Black(0.85), softText: Black(0.55), line: Black(0.2), hover: Black(0.04), focus: "#3D8BD9", scrollBar: "#9A9A98" };
Accordion.styles.minimal = Accordion.createMinimalStyle(Accordion.MINIMAL_COLORS);
Accordion.MINIMAL_DARK_COLORS = { text: White(0.88), softText: White(0.55), line: White(0.18), hover: White(0.06), focus: "#7FB6DE", scrollBar: "#A0A0A0" };
Accordion.styles.minimalDark = Accordion.createMinimalStyle(Accordion.MINIMAL_DARK_COLORS);
