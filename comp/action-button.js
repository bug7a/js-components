/* Bismillah */

/*

ActionButton - v26.10

UI COMPONENT
- A floating action button at the bottom right of its container (the page): a round button with a + icon.
  A click opens the menu of actions at its left side; a click on an action, on the button again, outside the
  menu or Escape closes it. With fewer than 2 actions the button runs onAction at once (no menu).
- The component covers its container (100% x 100%) but lets the mouse through: only the button, the open menu
  and its cover (to close it) catch clicks.
- Style packages: "classic" (default), "ozden" (an ink button with a white icon, a
  white menu with a shadow, animated: 1). Select with styleName. (ActionButton.styles)
- animated: 1 (context/basic-js-animated-rules.md): the button grows a little with a soft shadow under the mouse
  and gets smaller when pressed, the menu grows out of the button and closes faster, its actions come in one
  after the other and get a soft tint under the mouse. Only transform, opacity and box-shadow change; nothing at
  the first view; off when the system asks for reduced motion. (box.setAnimated(0 / 1)) The turn of the icon ends
  with a small spring (the rules: a toggle icon).

USAGE:
const fab = ActionButton({
    items: [
        { key: "photo", text: "Take a Photo" },
        { key: "gallery", text: "Add from Gallery" },
        "Add from URL", // a text: its key is the text
    ],
    onAction: function (self, key) { println("Action: " + key); },
});
fab.setItems([...]);
fab.openMenu(); fab.closeMenu(); fab.toggleMenu();
fab.setButtonColor("#8BC34A");
fab.setAnimated(1);
ActionButton({ animated: 1, items: [...] }); // small, smooth motions
ActionButton({ onAction: function () { addNewNote(); } }); // no items: a direct button
ActionButton({ style: { button: { color: "#8BC34A" } } }); // Change only some keys of the style.

Started Date: October 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const ActionButtonDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    items: [], // [{ key, text }] or ["text"]
    iconFile: "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" preserveAspectRatio="none" fill="#000000"><path d="M231 0H281V512H231ZM0 231H512V281H0Z"/></svg>'), // a plus (a page can give its own picture)
    openIconFile: "", // "": iconFile. The icon while the menu is open.
    iconSize: 30,
    iconRotate: 0, // deg
    openIconRotate: 45, // deg: the + turns into ×
    rightSpace: 40, // The button from the right side of the container
    bottomSpace: 40, // The button from the bottom of the container
    menuWidth: 280,
    menuGap: 20, // Between the menu and the button
    animated: 0, // 1: small hover / press / open motions (context/basic-js-animated-rules.md). (box.setAnimated(0/1))
    onAction: function (self, key) { }, // An action was chosen (no items: key is "", one item: its key)
    onMenuToggle: function (self) { }, // The menu opened / closed: self.menuOpened
    styleName: "classic", // "classic", "ozden" or a name added to ActionButton.styles
    style: { // Classic style package (default)
        button: {
            size: 90,
            color: "#FFD541",
            openColor: "lightgray",
            border: 4,
            borderColor: "rgba(0, 0, 0, 0.2)",
            iconOpacity: 0.4,
            invertIcon: 0, // 1: a white icon (from the black add.png) on a dark button
            shadow: "", // "": none. Ex: "0px 4px 12px rgba(0, 0, 0, 0.18)"
            hoverShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)", // animated: under the mouse
        },
        menu: {
            color: "whitesmoke", // The lines between the actions
            round: 13,
            border: 2,
            borderColor: "rgba(0, 0, 0, 0.2)",
            hiddenScale: 0.4, // The menu grows from this size
            shadow: "", // "": none
        },
        item: {
            height: 50,
            gap: 1,
            color: "white",
            textColor: "", // "": the color of a basic.js Button
            fontSize: 0, // 0: the size of a basic.js Button
            hoverTint: "rgba(0, 0, 0, 0.04)", // animated: over an action under the mouse
        },
        cover: {
            color: "rgba(0, 0, 0, 0)", // Behind the open menu (a click on it closes the menu)
        },
    },
};

const ActionButton = function (params = {}) {

    // Merge style package: params.style > ActionButton.styles[styleName] > ActionButtonDefaults.style (classic)
    basic.applyStylePackage(params, ActionButton.styles, ActionButtonDefaults);

    // Merge params:
    mergeIntoIfMissing(params, ActionButtonDefaults);

    // Edit params, if needed:
    params.items = ActionButton.normalizeItems(params.items); // WHY: A copy: the data of the caller does not change.

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const BUTTON_MOTION = "background-color 0.3s";
    const ICON_MOTION = "transform 0.3s";
    const MENU_MOTION_MS = 200;
    const MENU_MOTION = "opacity 0.2s, transform 0.2s";
    let cancelHide = null;

    // animated: 1
    const MOTION_TIME = 0.25; // s
    const MOTION_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)"; // a fast start and a soft stop
    const SPRING_TIME = 0.35; // s: the turn of the icon
    const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // a small overshoot, then back (the rules: a toggle icon)
    const CLOSE_TIME = 0.15; // s: the menu closes faster than it opens
    const HOVER_GROW = 1.05;
    const PRESS_SCALE = 0.95;
    const ICON_OPACITY_GAIN = 0.25;
    const MENU_HIDDEN_SCALE = 0.96;
    const MENU_HIDDEN_SHIFT = 8; // px, toward the button
    const ITEM_HIDDEN_SHIFT = 6; // px, from under
    const ITEM_DELAY = 0.03; // s, between the actions coming in
    let isHovered = 0;
    let isPressed = 0;
    let wasAnimated = 0;

    // *** PUBLIC VARIABLES:
    box.menuOpened = 0;
    box.itemButtons = [];
    // NOTE: Default values are also public variables. (box.items, box.iconFile, box.menuWidth...)

    // *** PRIVATE FUNCTIONS:

    const getOpenIconFile = function () {
        return box.openIconFile || box.iconFile;
    };

    // The look of the button: open (1) or closed (0).
    const paintButton = function () {
        const isOpen = box.menuOpened;
        box.btnAction.color = (isOpen) ? _s.button.openColor : _s.button.color;
        box.imgIcon.rotate = (isOpen) ? box.openIconRotate : box.iconRotate;
        const iconFile = (isOpen) ? getOpenIconFile() : box.iconFile;
        if (box.imgIcon.imageElement.getAttribute("src") !== iconFile) box.imgIcon.load(iconFile);
        box.btnAction.aria = { expanded: (isOpen) ? "true" : "false" };
    };

    // BUTTON: One action of the menu.
    const createItemButton = function (item) {
        const btn = Button({ width: "100%", height: _s.item.height, minimal: 1, color: _s.item.color });
        btn.shrink = 0;
        btn.plainText = item.text;
        if (_s.item.textColor) btn.textColor = _s.item.textColor;
        if (_s.item.fontSize) btn.fontSize = _s.item.fontSize;
        btn.on("click", function () { chooseAction(item.key); });
        btn.onHoverChange(function (self, isOver) { paintItemHover(btn, isOver); });
        return btn;
    };

    // The menu buttons, made again from box.items.
    const createItems = function () {
        box.itemButtons.forEach(function (btn) { btn.remove(); });
        box.itemButtons = createIn(box.menu, function () {
            return box.items.map(createItemButton);
        });
        prepareItems();
    };

    const chooseAction = function (key) {
        // WHY: the menu fades for a moment after it closes; a double click ran onAction twice
        if (!box.menuOpened) return;
        box.closeMenu();
        box.onAction(box, key);
    };

    // WHY: A user who asked the system for less motion gets the still menu and button.
    const isMotionOn = function () {
        if (box.animated != 1) return false;
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    const motionOf = function (properties, seconds, delay = 0) {
        return properties.map(function (property) {
            return property + " " + seconds + "s " + MOTION_EASE + " " + delay + "s";
        }).join(", ");
    };

    // The menu while it is closed: small and see-through. (animated: a little smaller, beside the button)
    const getHiddenMenuTransform = function () {
        if (!isMotionOn()) return "scale(" + _s.menu.hiddenScale + ")";
        return "translateX(" + MENU_HIDDEN_SHIFT + "px) scale(" + MENU_HIDDEN_SCALE + ")";
    };

    // The shadow of the button when the mouse is not over it. (A transparent one: the hover shadow fades from it.)
    const getStillShadow = function () {
        return _s.button.shadow || "0px 0px 0px 0px transparent";
    };

    const getButtonTransform = function () {
        if (isPressed) return "scale(" + PRESS_SCALE + ")";
        if (isHovered) return "scale(" + HOVER_GROW + ")";
        return "none";
    };

    // The look of the hover / press state of the button. (Nothing when animated is off.)
    const paintMotion = function () {
        if (!isMotionOn()) return;
        box.btnAction.css.transform = getButtonTransform();
        box.btnAction.boxShadow = (isHovered && !isPressed) ? _s.button.hoverShadow : getStillShadow();
        box.imgIcon.opacity = Math.min(1, _s.button.iconOpacity + ((isHovered) ? ICON_OPACITY_GAIN : 0));
    };

    // animated: the actions wait under their place, see-through, until the menu opens.
    const hideItems = function () {
        if (!isMotionOn()) return;
        box.itemButtons.forEach(function (btn) {
            btn.css = { transition: "none", opacity: "0", transform: "translateY(" + ITEM_HIDDEN_SHIFT + "px)" };
        });
    };

    // animated: the actions come in one after the other, the one next to the button first.
    const showItems = function () {
        if (!isMotionOn()) return;
        const count = box.itemButtons.length;
        box.itemButtons.forEach(function (btn, index) {
            const delay = (count - 1 - index) * ITEM_DELAY;
            btn.css = { transition: motionOf(["opacity", "transform"], MOTION_TIME, delay), opacity: "1", transform: "none" };
        });
    };

    // The menu: from small and see-through to its size (and back).
    const showMenu = function () {
        if (cancelHide) cancelHide();
        cancelHide = null;
        if (isMotionOn()) box.menu.setMotionNow(motionOf(["opacity", "transform"], MOTION_TIME));
        box.menu.visible = 1;
        box.menu.withMotion(function () {
            box.menu.opacity = 1;
            box.menu.css.transform = "scale(1)";
            showItems();
        });
    };

    const hideMenu = function () {
        const isMotion = isMotionOn();
        if (isMotion) box.menu.setMotionNow(motionOf(["opacity", "transform"], CLOSE_TIME));
        box.menu.opacity = 0;
        box.menu.css.transform = getHiddenMenuTransform();
        if (cancelHide) cancelHide();
        const hideTime = (isMotion) ? CLOSE_TIME * 1000 : MENU_MOTION_MS;
        cancelHide = box.after(hideTime, function () {
            cancelHide = null;
            box.menu.visible = 0;
            hideItems();
        });
    };

    // animated: a soft tint over an action under the mouse.
    // WHY: on the <button> of the Button: its white background covers a shadow of the outer box.
    const paintItemHover = function (btn, isOver) {
        if (!isMotionOn()) return;
        btn.buttonElement.style.boxShadow = (isOver) ? "inset 0 0 0 100px " + _s.item.hoverTint : "inset 0 0 0 100px transparent";
    };

    // Back to the still look, after setAnimated(0).
    const removeMotion = function () {
        wasAnimated = 0;
        box.btnAction.setMotion(BUTTON_MOTION);
        box.btnAction.css.transform = "";
        box.btnAction.boxShadow = _s.button.shadow;
        box.imgIcon.setMotion(ICON_MOTION);
        box.imgIcon.opacity = _s.button.iconOpacity;
        box.menu.setMotion(MENU_MOTION);
        box.menu.css.transformOrigin = "";
        if (!box.menuOpened) box.menu.css.transform = getHiddenMenuTransform();
        box.itemButtons.forEach(function (btn) {
            btn.css = { transition: "", opacity: "", transform: "" };
            btn.buttonElement.style.transition = "";
            btn.buttonElement.style.boxShadow = "";
        });
    };

    // The transitions of animated: 1 (or the still look back).
    const applyAnimated = function () {
        if (!isMotionOn()) {
            if (wasAnimated) removeMotion();
            return;
        }
        wasAnimated = 1;
        box.btnAction.setMotion(motionOf(["background-color", "transform", "box-shadow"], MOTION_TIME));
        box.imgIcon.setMotion("transform " + SPRING_TIME + "s " + SPRING_EASE + ", " + motionOf(["opacity"], MOTION_TIME));
        box.menu.css.transformOrigin = "right bottom"; // WHY: The menu grows out of the button.
        if (!box.menuOpened) box.menu.css.transform = getHiddenMenuTransform();
        prepareItems();
        paintMotion();
    };

    // animated: the transition of the tint of each action, and the closed look of the actions.
    const prepareItems = function () {
        if (!isMotionOn()) return;
        box.itemButtons.forEach(function (btn) {
            btn.buttonElement.style.transition = motionOf(["box-shadow"], MOTION_TIME);
        });
        if (!box.menuOpened) hideItems();
    };

    const setMenuOpened = function (isOpened) {
        const value = (isOpened) ? 1 : 0;
        if (value === box.menuOpened) return;
        box.menuOpened = value;
        box.cover.visible = value;
        box.cover.clickable = value;
        paintButton();
        if (value) showMenu();
        else hideMenu();
        box.onMenuToggle(box);
    };

    // *** PUBLIC FUNCTIONS:

    box.openMenu = function () { setMenuOpened(1); };
    box.closeMenu = function () { setMenuOpened(0); };
    box.toggleMenu = function () { setMenuOpened(!box.menuOpened); };

    // The button: with 2 or more actions it opens the menu, else it runs the action at once.
    box.press = function () {
        if (box.items.length >= 2) {
            box.toggleMenu();
            return;
        }
        const onlyItem = box.items[0];
        box.onAction(box, (onlyItem) ? onlyItem.key : "");
    };

    box.setItems = function (items) {
        box.items = ActionButton.normalizeItems(items);
        if (box.items.length < 2) box.closeMenu();
        createItems();
    };

    box.setAnimated = function (value) {
        box.animated = (value == 1) ? 1 : 0;
        applyAnimated();
    };

    box.setButtonColor = function (color) {
        _s.button.color = color;
        paintButton();
    };

    // *** OBJECT VIEW:

    // BOX: Cover (a click outside the menu closes it)
    box.cover = Box(0, 0, "100%", "100%", { color: _s.cover.color });
    box.cover.visible = 0;
    box.cover.clickable = 0;

    // BOX: Action button
    box.btnAction = Box({
        right: box.rightSpace,
        bottom: box.bottomSpace,
        width: _s.button.size,
        height: _s.button.size,
        color: _s.button.color,
        round: _s.button.size / 2,
        border: _s.button.border,
        borderColor: _s.button.borderColor,
    });
    if (_s.button.shadow) box.btnAction.boxShadow = _s.button.shadow;
    box.btnAction.setMotion(BUTTON_MOTION);
    box.btnAction.clickable = 1;
    box.btnAction.cursor = "pointer";
    box.btnAction.role = "button";
    box.btnAction.tabIndex = 0;
    box.btnAction.aria = { label: "Actions", haspopup: "menu", expanded: "false" };

        // ICON: Action button icon
        box.imgIcon = createIn(box.btnAction, function () {
            return Icon(0, 0, box.iconSize, box.iconSize);
        });
        box.imgIcon.load(box.iconFile);
        box.imgIcon.opacity = _s.button.iconOpacity;
        if (_s.button.invertIcon == 1) box.imgIcon.css.filter = "invert(100%)";
        box.imgIcon.setMotion(ICON_MOTION);
        box.imgIcon.center();

    // GROUP: Menu (at the left side of the button, bottoms in one line)
    box.menu = VGroup({
        right: box.rightSpace + _s.button.size + box.menuGap,
        bottom: box.bottomSpace,
        width: box.menuWidth,
        height: "auto",
        align: "left top",
        gap: _s.item.gap,
        padding: [0, 0, 0, _s.item.gap], // WHY: one line under the last action too.
        color: _s.menu.color,
        round: _s.menu.round,
        border: _s.menu.border,
        borderColor: _s.menu.borderColor,
    });
    box.menu.role = "menu";
    if (_s.menu.shadow) box.menu.boxShadow = _s.menu.shadow;
    endGroup();

    // *** OBJECT INIT CODE:

    // WHY: The component covers its container; the objects of the page under it must still be clickable.
    box.clickable = 0;

    createItems();
    box.menu.opacity = 0;
    box.menu.css.transform = "scale(" + _s.menu.hiddenScale + ")";
    box.menu.setMotion(MENU_MOTION);
    box.menu.visible = 0; // WHY: Hidden after its children are made.

    box.btnAction.on("click", box.press);
    box.btnAction.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        box.press();
    });
    box.cover.on("click", box.closeMenu);

    // animated: the mouse over the button and the press (painted only when animated is on)
    box.btnAction.onHoverChange(function (self, isOver) {
        isHovered = isOver;
        if (!isOver) isPressed = 0;
        paintMotion();
    });
    box.btnAction.on("pointerdown", function () {
        isPressed = 1;
        paintMotion();
    });
    box.listenTo(document, "pointerup", function () {
        if (!isPressed) return;
        isPressed = 0;
        paintMotion();
    });
    box.listenTo(document, "keydown", function (self, event) {
        if (event.key !== "Escape" || !box.menuOpened) return;
        box.closeMenu();
        box.btnAction.elem.focus();
    });

    // WHY: setMotion waits a moment before it starts: the first view does not move.
    applyAnimated();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The items with every value filled: a text -> { key: text, text: text }; without a key, its text is its key.
ActionButton.normalizeItems = function (items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
        if (typeof item !== "object" || item === null) return { key: String(item), text: String(item) };
        const text = String(item.text || "");
        return { key: String((item.key !== undefined) ? item.key : text), text: text };
    });
};

// *** STYLE PACKAGES:
// USAGE: ActionButton({ styleName: "classic" })
// USAGE: ActionButton({ style: { button: { color: "#8BC34A" } } }) // Change only some keys.
ActionButton.styles = {

    // A yellow round button, a white menu with thin lines.
    classic: ActionButtonDefaults.style,

    // Bugra's style: an ink round button with a white +, a white rounded menu with a soft shadow, animated.
    // A package of params (it has "style"): animated and the icon size are params, not style keys.
    ozden: {
        animated: 1,
        iconSize: 24,
        menuGap: 16,
        style: {
            button: {
                size: 64,
                color: "#232323", // ink
                openColor: "#3C4043", // slate
                border: 0,
                iconOpacity: 0.9,
                invertIcon: 1,
                shadow: "0px 4px 12px rgba(0, 0, 0, 0.18)",
                hoverShadow: "0px 10px 24px rgba(0, 0, 0, 0.24)",
            },
            menu: {
                color: "#F0F0F0", // the lines between the actions
                round: 16,
                border: 1,
                borderColor: "rgba(0, 0, 0, 0.08)",
                shadow: "0px 10px 30px rgba(0, 0, 0, 0.12)",
            },
            item: {
                height: 48,
                textColor: "#232323",
                fontSize: 17,
                hoverTint: "rgba(0, 0, 0, 0.04)",
            },
        },
    },

};
