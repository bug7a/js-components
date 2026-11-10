/* Bismillah */

/*

Side Panel - v26.09

UI COMPONENT
- A panel (drawer / sheet) that slides in from a side of the screen, over the page.
- side: "right", "left", "bottom" or "top". The size is the width or the height.
- It is always created on the page (or in its container), whatever container is open when it is
  called, so it is never clipped by a group or by a scrolling box.
- container: a box (Ex: the 600 px column of a mobile app in the middle of a wide screen). The panel
  and its backdrop are made in it, sized by it instead of the page and they follow its size. Nothing
  outside it is covered. The box clips its content (the default of a Box) and does not scroll.
- Its own backdrop darkens the page (or the container). A click on it closes the panel. (closeOnBackdrop)
- ESC closes the open panel. (closeOnEscape)
- exclusive: 1 -> Opening a panel closes the one that is already open.
- The panel never covers the whole screen: it keeps screenMargin pixels free on a small screen.
- fade: 1 -> The panel fades in / out with its slide. 0 -> It only slides. (The backdrop always fades.)
- style.panel.round: the corners that face the page are round (a right panel: its left corners,
  a bottom sheet: its top corners).
- The content goes into the body with startBody() ... endBody(). The body scrolls when it is tall.
- onBeforeClose can stop the closing. (Ex: unsaved changes.)
- Everything is drawn with code (no image files needed). Accessibility: role="dialog", aria-modal.
- Style packages: "light" (default; the old name "classic" works too), "modern", "dark", "minimal", "minimalDark".
  Select with styleName. (SidePanel.styles)

USAGE:
const panel = SidePanel({ side: "right", titleText: "Filters" });
panel.startBody();
    Label({ text: "The content of the panel" });
panel.endBody();

button.on("click", panel.open);

SidePanel({ side: "bottom", panelSize: 280, styleName: "dark", titleText: "Share" });
SidePanel({ side: "left", panelSize: 320, showBackdrop: 0, onClose: (self) => println("closed") });
SidePanel({ container: appColumn, side: "bottom", panelSize: 300, style: { panel: { round: 13 } } });
SidePanel({ container: appColumn, side: "right", fade: 0, duration: 200 }); // It only slides.
panel.setTitleText("Filters (3)");
panel.remove();    // Also removes its backdrop and its window events.

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const SidePanelDefaults = {
    key: "0",
    side: "right", // "right", "left", "bottom", "top" (Only at create time)
    container: null, // null: the page. A box: the panel and its backdrop are made in it. (Only at create time)
    panelSize: 420, // Width of a left/right panel, height of a top/bottom panel.
    screenMargin: 60, // The panel never comes closer than this to the opposite edge (of the page or the container).
    duration: 300, // Length of the animation, in milliseconds.
    fade: 1, // 1: The panel fades in / out with its slide. 0: It only slides. (The backdrop always fades.) (Only at create time)
    titleText: "",
    allowHtml: 0, // 1: titleText is HTML (only for your own texts)
    showHeader: 1, // 0: No header. (The close button goes with it.)
    showCloseButton: 1,
    showBackdrop: 1,
    closeOnBackdrop: 1,
    closeOnEscape: 1,
    exclusive: 1, // 1: Opening this panel closes the other open panel.
    opened: 0, // 1: Open when it is created. (No animation.)
    ariaLabel: "Panel",
    onOpen: function (self) { },
    onClose: function (self) { },
    onBeforeClose: function (self) { }, // Return false to keep the panel open.
    styleName: "light", // "light" ("classic": its old name), "modern", "dark", "minimal", "minimalDark" or a name added to SidePanel.styles
    style: { // Light style package (default)
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.18)",
            round: 0, // The corners that face the page. (A right panel: top-left and bottom-left) (Only at create time)
        },
        header: {
            height: 62,
            color: "transparent",
            padding: [24, 0],
            dividerColor: Black(0.1),
        },
        title: {
            fontSize: 18,
            textColor: Black(0.8),
            fontFamily: "opensans-bold",
        },
        closeButton: {
            size: 34,
            color: "transparent",
            hoverColor: Black(0.07),
            iconColor: Black(0.55),
            round: 17,
        },
        body: {
            padding: [24, 20],
            gap: 14,
        },
        backdrop: {
            color: Black(0.35),
        },
    },
};

const SidePanel = function (params = {}) {

    // Merge style package: params.style > SidePanel.styles[styleName] > SidePanelDefaults.style (light)
    basic.applyStylePackage(params, SidePanel.styles, SidePanelDefaults);

    // Merge params:
    mergeIntoIfMissing(params, SidePanelDefaults);

    let box = null;
    let backdrop = null;

    // The box the panel lives in: its container, or the page.
    const area = params.container || page;
    const isOnPage = (area === page);

    // WHY: A drawer covers the page (or its container). Wherever it is called from, it is created
    //      there, so a group or a scrolling box can never clip it.
    // NOTE: createIn() can NOT be used here: it puts the container back when its function ends, and
    //       startObject() would then be inside it while endObject() is outside. The objects of the
    //       view would be created in the container of the caller. The container is put back by hand
    //       after endObject(), at the end of this function.
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(area);

    // BOX: The backdrop is created first, so it stays behind the panel.
    if (params.showBackdrop == 1) {
        backdrop = Box(0, 0, "100%", "100%", {
            color: params.style.backdrop.color,
            opacity: 0,
            visible: 0,
            clickable: 1,
            zIndex: SidePanel.Z_INDEX,
        });
        // WHY: In a group (HGroup / VGroup) a new object is a flex item. The backdrop covers it instead.
        if (!isOnPage) backdrop.position = "absolute";
    }

    // BOX: Component container. This is the box that slides.
    box = startObject(params);

    const _s = box.style;

    // *** PRIVATE VARIABLES:

    let size = box.panelSize;       // The size that is really used. (See layout().)
    let cancelClose = null;         // (box.after: stopped by remove())
    const bodyStack = [];           // For startBody() / endBody()
    const MIN_PANEL_SIZE = 120;
    const OPEN_TRANSFORM = "translate(0px, 0px)";

    // *** PRIVATE FUNCTIONS:

    const setText = function (label, text) {
        const value = (text === undefined || text === null) ? "" : String(text);
        if (box.allowHtml == 1) label.text = value;
        else label.plainText = value;
    };

    const isVertical = function () {
        return (box.side === "bottom" || box.side === "top");
    };

    // The room of the panel along its side: the page, or the inside of its container.
    const getAreaSize = function () {

        // WHY page.width / page.height: with page.fit() the page is zoomed; window.innerWidth is not in its px
        //     (a 450 px menu on a page fitted to 600 px was cut to 330 on a 390 px phone)
        if (isOnPage) return (isVertical()) ? page.height : page.width;

        // WHY without the border: the panel is placed inside the border of its container.
        const borderSize = (area.border || 0) * 2;
        if (isVertical()) return area.height - borderSize;
        return area.width - borderSize;

    };

    // Puts the panel on its side and keeps it inside the screen (or its container).
    const layout = function () {

        // WHY: The size watcher of the container can call it once more in the same round after remove().
        if (!box) return;

        // WHY: A 420 px panel does not fit on a phone. It never covers the whole screen.
        size = Math.max(MIN_PANEL_SIZE, Math.min(box.panelSize, getAreaSize() - box.screenMargin));

        if (box.side === "bottom") box.props({ left: 0, bottom: 0, width: "100%", height: size });
        else if (box.side === "top") box.props({ left: 0, top: 0, width: "100%", height: size });
        else if (box.side === "left") box.props({ left: 0, top: 0, width: size, height: "100%" });
        else box.props({ right: 0, top: 0, width: size, height: "100%" });

        if (box.isOpened === 0) box.css.transform = getHiddenTransform();

    };

    // The panel follows the size of the page (a resize of the window) or of its container.
    const followAreaSize = function () {
        if (isOnPage) {
            box.onPageResize(layout);
            return;
        }
        // WHY onResize: a box can change its size without a resize of the window (Ex: a column made narrower).
        area.onResize(layout);
    };

    // The corners that face the page. (border-radius: top-left, top-right, bottom-right, bottom-left)
    const getFacingCorners = function () {
        const radius = _s.panel.round + "px";
        if (box.side === "left") return "0 " + radius + " " + radius + " 0";
        if (box.side === "bottom") return radius + " " + radius + " 0 0";
        if (box.side === "top") return "0 0 " + radius + " " + radius;
        return radius + " 0 0 " + radius;
    };

    // The opacity of the closed panel: it fades out with its slide, or it only slides. (fade)
    const getClosedOpacity = function () {
        return (basic.isOn(box.fade)) ? 0 : 1;
    };

    // The panel slides. It fades too, unless fade is 0.
    const getPanelMotion = function () {
        const slide = "transform " + box.duration + "ms";
        if (!basic.isOn(box.fade)) return slide;
        return slide + ", opacity " + box.duration + "ms";
    };

    // Where the panel waits while it is closed: one size out of the screen.
    const getHiddenTransform = function () {
        if (box.side === "bottom") return "translateY(" + size + "px)";
        if (box.side === "top") return "translateY(" + -size + "px)";
        if (box.side === "left") return "translateX(" + -size + "px)";
        return "translateX(" + size + "px)";
    };

    const showBackdrop = function (isShown) {

        if (!backdrop) return;

        if (isShown == 1) {
            backdrop.visible = 1;
            basic.nextFrame().then(function () { if (backdrop) backdrop.opacity = 1; });
        } else {
            backdrop.opacity = 0;
        }

    };

    const onKeyDown = function (self, event) {
        if (event.code !== "Escape") return;
        // WHY after the event: a list opened from the panel can listen on window too, after the panel
        //      (FullScreenSelect). An Escape that closed a list, or that a Dialog over the panel kept, closed the panel
        //      too (the sheet of the mobile template is removed when it closes: its typed text was lost).
        box.after(0, function () {
            if (event.defaultPrevented) return; // used by a list, a menu or a Dialog
            if (typeof Dialog === "function" && Dialog.getTop()) return; // a modal over the panel
            if (box.isOpened === 1 && box.closeOnEscape == 1) box.close();
        });
    };

    // *** PUBLIC VARIABLES:

    // 1 while the panel is open. [var]
    box.isOpened = 0;

    // *** PUBLIC FUNCTIONS:

    box.open = function () {

        if (box.isOpened === 1) return;

        // WHY: Two open drawers over each other are never wanted. The other one is closed first.
        if (box.exclusive == 1 && SidePanel.openedPanel && SidePanel.openedPanel !== box) {
            SidePanel.openedPanel.close();
        }

        if (cancelClose) {
            cancelClose();
            cancelClose = null;
        }

        box.isOpened = 1;
        SidePanel.openedPanel = box;

        // WHY now: a panel opened right after it was made (a sheet made by a click) had no transition yet
        //      (setMotion() turns it on a moment later), so it showed at once, without its slide.
        box.setMotionNow(getPanelMotion());
        if (backdrop) backdrop.setMotionNow("opacity " + box.duration + "ms");

        box.visible = 1;
        box.css.transform = getHiddenTransform();   // Start from outside...
        showBackdrop(1);
        void box.elem.offsetWidth; // WHY: the browser lays out the closed place first (the panel was display: none)

        // WHY: The browser has to see the closed state before the open one, or there is no
        //      transition between them. One frame is enough.
        basic.nextFrame().then(function () {
            if (!box || box.isOpened === 0) return;
            box.css.transform = OPEN_TRANSFORM;
            box.opacity = 1;
        });

        box.aria = { hidden: "false" };
        box.onOpen(box);

    };

    box.close = function () {

        if (box.isOpened === 0) return;

        // WHY: The page can stop the closing. (Ex: "There are unsaved changes.")
        if (box.onBeforeClose(box) === false) return;

        box.isOpened = 0;
        if (SidePanel.openedPanel === box) SidePanel.openedPanel = null;

        box.css.transform = getHiddenTransform();
        box.opacity = getClosedOpacity();
        showBackdrop(0);

        // WHY: The panel is hidden only after the animation, and the wait is the duration of that
        //      animation, not a number written twice.
        if (cancelClose) cancelClose();
        cancelClose = box.after(box.duration, function () {
            cancelClose = null;
            if (box.isOpened === 1) return;
            box.visible = 0;
            if (backdrop) backdrop.visible = 0;
        });

        box.aria = { hidden: "true" };
        box.onClose(box);

    };

    box.toggle = function () {
        if (box.isOpened === 1) {
            box.close();
            return;
        }
        box.open();
    };

    box.setTitleText = function (text) {
        box.titleText = text;
        if (box.lblTitle) setText(box.lblTitle, text);
    };
    // USAGE: get: panel.titleText, set: panel.setTitleText("Filters (3)")

    box.setPanelSize = function (value) {
        box.panelSize = value;
        layout();
    };

    // The objects created between these two calls go into the body of the panel.
    // WHY a group of their own (on the start / end stack, as PageControl.startPage and Tabs.startPanel): only the
    //     default container was set. In a panel made while a group of the page was open, the endObject() of the first
    //     component (or an endGroup()) in the body went back to that group, and the next objects were drawn outside
    //     the panel. The group has the gap and the alignment of the body, so the look is the same.
    box.startBody = function () {
        bodyStack.push(getDefaultContainerBox());
        setDefaultContainerBox(box.body);
        const content = VGroup({ width: "100%", height: "auto", align: "left top", gap: _s.body.gap, color: "transparent", position: "relative" });
        content.css.alignItems = "stretch";
        return box.body;
    };

    box.endBody = function () {
        endGroup(); // the group of startBody()
        const previous = bodyStack.pop();
        if (previous) setDefaultContainerBox(previous);
    };

    box.getBody = function () {
        return box.body;
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        if (SidePanel.openedPanel === box) SidePanel.openedPanel = null;

        // WHY: The size watcher is on the container, not on the box: the remove() of the box does not reach it.
        if (!isOnPage) area.remove_onResize(layout);

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    box.props({
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        boxShadow: _s.panel.boxShadow,
        opacity: getClosedOpacity(),
        zIndex: SidePanel.Z_INDEX + 1,
        clipContent: 1,
    });
    if (_s.panel.round > 0) box.css.borderRadius = getFacingCorners();
    // WHY: In a group (HGroup / VGroup) a new object is a flex item. The panel is placed by layout() instead.
    if (!isOnPage) box.position = "absolute";
    box.role = "dialog";
    box.aria = {
        modal: (box.showBackdrop == 1) ? "true" : "false",
        label: box.ariaLabel,
    };

    // GROUP: header + body, one under the other
    VGroup({ width: "100%", height: "100%", align: "left top", gap: 0, color: "transparent" });
    that.css.alignItems = "stretch";

        // GROUP: Header
        if (box.showHeader == 1) {

            box.header = HGroup({
                width: "100%",
                height: _s.header.height,
                align: "left center",
                padding: _s.header.padding,
                gap: 10,
                color: _s.header.color,
            });
            that.shrink = 0;
            that.css.borderBottom = _s.header.dividerColor ? ("1px solid " + _s.header.dividerColor) : "";

                // LABEL: Title
                box.lblTitle = Label({
                    fontSize: _s.title.fontSize,
                    textColor: _s.title.textColor,
                    fontFamily: _s.title.fontFamily,
                    grow: 1,
                });
                setText(box.lblTitle, box.titleText);
                that.ellipsis = 1;

                // BOX: Close button (the X is drawn with two lines, no image file)
                if (box.showCloseButton == 1) {

                    box.btnClose = Box({
                        width: _s.closeButton.size,
                        height: _s.closeButton.size,
                        color: _s.closeButton.color,
                        round: _s.closeButton.round,
                        clickable: 1,
                    });
                    that.shrink = 0;
                    that.cursor = "pointer";
                    that.setMotion("background-color 0.2s");
                    that.role = "button";
                    that.aria = { label: "Close" };

                    createIn(box.btnClose, function () {
                        [45, -45].forEach(function (angle) {
                            const line = Box(0, 0, 15, 2, { color: _s.closeButton.iconColor, round: 1 });
                            line.center();
                            line.css.transform = "rotate(" + angle + "deg)";
                        });
                    });

                }

            endGroup();

        }

        // BOX: Body. It scrolls when the content is taller than the panel.
        box.bodyBox = Box({
            width: "100%",
            height: "auto",
            grow: 1,
            color: "transparent",
            scrollY: 1,
        });

            // GROUP: The content of the panel is created in this group.
            createIn(box.bodyBox, function () {
                box.body = VGroup({
                    width: "100%",
                    height: "auto",
                    align: "left top",
                    padding: _s.body.padding,
                    gap: _s.body.gap,
                    color: "transparent",
                });
                that.css.alignItems = "stretch";
                endGroup();
            });

    endGroup();

    // *** OBJECT INIT CODE:

    box.setMotion(getPanelMotion());

    if (box.btnClose) {
        box.btnClose.on("click", function () { box.close(); });
        box.btnClose.on("mouseenter", function (self) { self.color = _s.closeButton.hoverColor; });
        box.btnClose.on("mouseleave", function (self) { self.color = _s.closeButton.color; });
    }

    if (backdrop) {
        backdrop.setMotion("opacity " + box.duration + "ms");
        backdrop.on("click", function () {
            if (box.closeOnBackdrop == 1) box.close();
        });
    }

    // (listenTo / onPageResize / own: removed with the box)
    box.listenTo(window, "keydown", onKeyDown);
    if (backdrop) box.own(backdrop); // WHY: It is on the page (or in the container), not in the box.

    layout();
    followAreaSize();

    // WHY: The groups above are created first. A group that is created inside a hidden box is not
    //      laid out as a flex group, so the panel is hidden only now.
    box.visible = 0;
    box.aria = { hidden: "true" };

    if (box.opened == 1) {
        box.isOpened = 1;
        SidePanel.openedPanel = box;
        box.visible = 1;
        box.opacity = 1;
        box.css.transform = OPEN_TRANSFORM;
        box.aria = { hidden: "false" };
        if (backdrop) {
            backdrop.visible = 1;
            backdrop.opacity = 1;
        }
    }

    const panel = endObject(box);

    // WHY: The container was moved to the page above. The caller goes on with its own container.
    setDefaultContainerBox(previousContainer);

    return panel;

};

// The panel that is open now. (exclusive: 1 closes it when another one opens.)
SidePanel.openedPanel = null;

// The backdrop is at this level, the panel one above it.
SidePanel.Z_INDEX = 1000;

// *** STYLE PACKAGES:
// USAGE: SidePanel({ styleName: "dark" })
// USAGE: SidePanel({ styleName: "dark", style: { panel: { color: "tomato" } } }) // Change only some keys.
// USAGE: SidePanel({ style: SidePanel.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SidePanel.styles.myStyle = { panel: { color: "red" } };

SidePanel.styles = {

    // White panel, gray divider.
    light: SidePanelDefaults.style,

    // Round corners, cadetblue title. Same colors as the modern Tabs, Stepper and ProgressBar.
    modern: {
        panel: { color: White(1), border: 0, borderColor: "transparent", boxShadow: "0 0 50px rgba(0, 0, 0, 0.22)" },
        header: { height: 66, color: "transparent", padding: [24, 0], dividerColor: "#E3ECEC" },
        title: { fontSize: 18, textColor: "#2F5F61", fontFamily: "opensans-bold" },
        closeButton: { size: 34, color: "#EEF5F5", hoverColor: "#DFECEC", iconColor: "#2F5F61", round: 100 },
        body: { padding: [24, 20], gap: 16 },
        backdrop: { color: "rgba(47, 95, 97, 0.35)" },
    },

    // Dark theme, same colors as the "dark" Tabs, TagInput and Stepper.
    dark: {
        panel: { color: "#232322", border: 1, borderColor: "rgba(255, 255, 255, 0.10)", boxShadow: "0 0 50px rgba(0, 0, 0, 0.5)" },
        header: { height: 62, color: "transparent", padding: [24, 0], dividerColor: "rgba(255, 255, 255, 0.10)" },
        title: { fontSize: 18, textColor: White(0.9), fontFamily: "opensans-bold" },
        closeButton: { size: 34, color: "transparent", hoverColor: White(0.1), iconColor: White(0.7), round: 17 },
        body: { padding: [24, 20], gap: 14 },
        backdrop: { color: Black(0.55) },
    },

};
SidePanel.styles.classic = SidePanel.styles.light; // the old name of light: the pages made with it keep their look

// The minimal theme (_designs/minimal-theme.htm): the ground of the window, a line and no shadow (as the minimal
// Dialog), a 40 px header with a 14 px title, a 24 px close button with a faint fill under the mouse.
// minimalDark: the same on a dark window.
SidePanel.createMinimalStyle = function (colors) {
    return {
        panel: { color: colors.ground, border: 1, borderColor: colors.edge, boxShadow: "none", round: 0 },
        header: { height: 40, color: "transparent", padding: [16, 0], dividerColor: colors.line },
        title: { fontSize: 14, textColor: colors.text, fontFamily: "opensans-bold" },
        closeButton: { size: 24, color: "transparent", hoverColor: colors.hover, iconColor: colors.softText, round: 4 },
        body: { padding: [16, 14], gap: 10 },
        backdrop: { color: colors.cover },
    };
};
SidePanel.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), line: Black(0.2), edge: Black(0.45), hover: Black(0.05), cover: Black(0.3) };
SidePanel.styles.minimal = SidePanel.createMinimalStyle(SidePanel.MINIMAL_COLORS);
SidePanel.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), line: White(0.18), edge: White(0.42), hover: White(0.07), cover: Black(0.6) };
SidePanel.styles.minimalDark = SidePanel.createMinimalStyle(SidePanel.MINIMAL_DARK_COLORS);
