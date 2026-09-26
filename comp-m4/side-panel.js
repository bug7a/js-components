/* Bismillah */

/*

Side Panel - v26.09

UI COMPONENT
- A panel (drawer / sheet) that slides in from a side of the screen, over the page.
- side: "right", "left", "bottom" or "top". The size is the width or the height.
- It is always created on the page, whatever container is open when it is called, so it is
  never clipped by a group or by a scrolling box.
- Its own backdrop darkens the page. A click on it closes the panel. (closeOnBackdrop)
- ESC closes the open panel. (closeOnEscape)
- exclusive: 1 -> Opening a panel closes the one that is already open.
- The panel never covers the whole screen: it keeps screenMargin pixels free on a small screen.
- The content goes into the body with startBody() ... endBody(). The body scrolls when it is tall.
- onBeforeClose can stop the closing. (Ex: unsaved changes.)
- Everything is drawn with code (no image files needed). Accessibility: role="dialog", aria-modal.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (SidePanel.styles)

USAGE:
const panel = SidePanel({ side: "right", titleText: "Filters" });
panel.startBody();
    Label({ text: "The content of the panel" });
panel.endBody();

button.on("click", panel.open);

SidePanel({ side: "bottom", panelSize: 280, styleName: "dark", titleText: "Share" });
SidePanel({ side: "left", panelSize: 320, showBackdrop: 0, onClose: (self) => println("closed") });
panel.setTitleText("Filters (3)");
panel.remove();    // Also removes its backdrop and its window events.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SidePanelDefaults = {
    key: "0",
    side: "right", // "right", "left", "bottom", "top" (Only at create time)
    panelSize: 420, // Width of a left/right panel, height of a top/bottom panel.
    screenMargin: 60, // The panel never comes closer than this to the opposite edge.
    duration: 300, // Length of the animation, in milliseconds.
    titleText: "",
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
    styleName: "classic", // "classic", "modern", "dark" or a name added to SidePanel.styles
    style: { // Classic style package (default)
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            boxShadow: "0 0 40px rgba(0, 0, 0, 0.18)",
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

    // Merge style package: params.style > SidePanel.styles[styleName] > SidePanelDefaults.style (classic)
    // WHY: This is done BEFORE the defaults. mergeIntoIfMissing() only fills the keys that are
    //      missing, so the classic style of the defaults would win over the chosen package.
    const _styleName = params.styleName || SidePanelDefaults.styleName;
    const _stylePackage = SidePanel.styles[_styleName];
    if (!_stylePackage) console.warn("SidePanel: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Marge params:
    mergeIntoIfMissing(params, SidePanelDefaults);

    let box = null;
    let backdrop = null;

    // WHY: A drawer covers the page. Wherever it is called from, it is created on the page, so a
    //      group or a scrolling box can never clip it.
    // NOTE: createIn() can NOT be used here: it puts the container back when its function ends, and
    //       startObject() would then be inside it while endObject() is outside. The objects of the
    //       view would be created in the container of the caller. The container is put back by hand
    //       after endObject(), at the end of this function.
    const previousContainer = getDefaultContainerBox();
    setDefaultContainerBox(page);

    // BOX: The backdrop is created first, so it stays behind the panel.
    if (params.showBackdrop == 1) {
        backdrop = Box(0, 0, "100%", "100%", {
            color: params.style.backdrop.color,
            opacity: 0,
            visible: 0,
            clickable: 1,
            zIndex: SidePanel.Z_INDEX,
        });
    }

    // BOX: Component container. This is the box that slides.
    box = startObject(params);

    const _s = box.style;

    // *** PRIVATE VARIABLES:

    let size = box.panelSize;       // The size that is really used. (See layout().)
    let removeKeyEvent = null;      // The remover of the window keydown event.
    let closeTimer = null;
    const bodyStack = [];           // For startBody() / endBody()

    // *** PRIVATE FUNCTIONS:

    const isVertical = function () {
        return (box.side === "bottom" || box.side === "top");
    };

    // Puts the panel on its side and keeps it inside the screen.
    const layout = function () {

        const screen = (isVertical()) ? window.innerHeight : window.innerWidth;

        // WHY: A 420 px panel does not fit on a phone. It never covers the whole screen.
        size = Math.max(120, Math.min(box.panelSize, screen - box.screenMargin));

        if (box.side === "bottom") box.props({ left: 0, bottom: 0, width: "100%", height: size });
        else if (box.side === "top") box.props({ left: 0, top: 0, width: "100%", height: size });
        else if (box.side === "left") box.props({ left: 0, top: 0, width: size, height: "100%" });
        else box.props({ right: 0, top: 0, width: size, height: "100%" });

        if (box.isOpened === 0) box.elem.style.transform = getHiddenTransform();

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
        if (box.isOpened === 1 && box.closeOnEscape == 1) box.close();
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

        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

        box.isOpened = 1;
        SidePanel.openedPanel = box;

        box.visible = 1;
        box.elem.style.transform = getHiddenTransform();   // Start from outside...
        showBackdrop(1);

        // WHY: The browser has to see the closed state before the open one, or there is no
        //      transition between them. One frame is enough.
        basic.nextFrame().then(function () {
            if (!box || box.isOpened === 0) return;
            box.elem.style.transform = "translate(0px, 0px)";
            box.opacity = 1;
        });

        box.elem.setAttribute("aria-hidden", "false");
        box.onOpen(box);

    };

    box.close = function () {

        if (box.isOpened === 0) return;

        // WHY: The page can stop the closing. (Ex: "There are unsaved changes.")
        if (box.onBeforeClose(box) === false) return;

        box.isOpened = 0;
        if (SidePanel.openedPanel === box) SidePanel.openedPanel = null;

        box.elem.style.transform = getHiddenTransform();
        box.opacity = 0;
        showBackdrop(0);

        // WHY: The panel is hidden only after the animation, and the wait is the duration of that
        //      animation, not a number written twice.
        if (closeTimer) clearTimeout(closeTimer);
        closeTimer = setTimeout(function () {
            closeTimer = null;
            if (!box || box.isOpened === 1) return;
            box.visible = 0;
            if (backdrop) backdrop.visible = 0;
        }, box.duration);

        box.elem.setAttribute("aria-hidden", "true");
        box.onClose(box);

    };

    box.toggle = function () {
        if (box.isOpened === 1) box.close(); else box.open();
    };

    box.setTitleText = function (text) {
        box.titleText = text;
        if (box.lblTitle) box.lblTitle.text = text;
    };
    // USAGE: get: panel.titleText, set: panel.setTitleText("Filters (3)")

    box.setPanelSize = function (value) {
        box.panelSize = value;
        layout();
    };

    // The objects created between these two calls go into the body of the panel.
    box.startBody = function () {
        bodyStack.push(getDefaultContainerBox());
        setDefaultContainerBox(box.body);
        return box.body;
    };

    box.endBody = function () {
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
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

        // WHY: These live outside the box, so remove() does not clean them.
        if (removeKeyEvent) { removeKeyEvent(); removeKeyEvent = null; }
        page.remove_onResize(layout);
        if (SidePanel.openedPanel === box) SidePanel.openedPanel = null;
        if (backdrop) { backdrop.remove(); backdrop = null; }

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:

    box.props({
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        boxShadow: _s.panel.boxShadow,
        opacity: 0,
        zIndex: SidePanel.Z_INDEX + 1,
        clipContent: 1,
    });
    box.elem.setAttribute("role", "dialog");
    box.elem.setAttribute("aria-modal", (box.showBackdrop == 1) ? "true" : "false");
    box.elem.setAttribute("aria-label", box.ariaLabel);

    // GROUP: header + body, one under the other
    VGroup({ width: "100%", height: "100%", align: "left top", gap: 0, color: "transparent" });
    that.elem.style.alignItems = "stretch";

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
            that.elem.style.flexShrink = "0";
            that.elem.style.borderBottom = _s.header.dividerColor ? ("1px solid " + _s.header.dividerColor) : "";

                // LABEL: Title
                box.lblTitle = Label({
                    text: box.titleText,
                    fontSize: _s.title.fontSize,
                    textColor: _s.title.textColor,
                    fontFamily: _s.title.fontFamily,
                    grow: 1,
                });
                that.elem.style.whiteSpace = "nowrap";
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
                    that.elem.style.flexShrink = "0";
                    that.elem.style.cursor = "pointer";
                    that.setMotion("background-color 0.2s");
                    that.elem.setAttribute("role", "button");
                    that.elem.setAttribute("aria-label", "Close");

                    createIn(box.btnClose, function () {
                        [45, -45].forEach(function (angle) {
                            const line = Box(0, 0, 15, 2, { color: _s.closeButton.iconColor, round: 1 });
                            line.center();
                            line.elem.style.transform = "rotate(" + angle + "deg)";
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
                that.elem.style.alignItems = "stretch";
                endGroup();
            });

    endGroup();

    // *** OBJECT INIT CODE:

    box.setMotion("transform " + box.duration + "ms, opacity " + box.duration + "ms");

    if (box.btnClose) box.btnClose.on("click", function () { box.close(); });

    if (box.btnClose) {
        box.btnClose.on("mouseenter", function (self) { self.color = _s.closeButton.hoverColor; });
        box.btnClose.on("mouseleave", function (self) { self.color = _s.closeButton.color; });
    }

    if (backdrop) {
        backdrop.setMotion("opacity " + box.duration + "ms");
        backdrop.on("click", function () { if (box.closeOnBackdrop == 1) box.close(); });
    }

    removeKeyEvent = page.on("keydown", onKeyDown);

    layout();
    page.onResize(layout);

    // WHY: The groups above are created first. A group that is created inside a hidden box is not
    //      laid out as a flex group, so the panel is hidden only now.
    box.visible = 0;
    box.elem.setAttribute("aria-hidden", "true");

    if (box.opened == 1) {
        box.isOpened = 1;
        SidePanel.openedPanel = box;
        box.visible = 1;
        box.opacity = 1;
        box.elem.style.transform = "translate(0px, 0px)";
        box.elem.setAttribute("aria-hidden", "false");
        if (backdrop) { backdrop.visible = 1; backdrop.opacity = 1; }
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

SidePanel.styles = {

    // White panel, gray divider.
    classic: SidePanelDefaults.style,

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
