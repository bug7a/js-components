/* Bismillah */

/*

ActionButton - v26.10

UI COMPONENT
- A floating action button at the bottom right of its container (the page): a round button with a + icon.
  A click opens the menu of actions at its left side; a click on an action, on the button again, outside the
  menu or Escape closes it. With fewer than 2 actions the button runs onAction at once (no menu).
- The new version of comp-m1/ui-action-button.js (UIActionButton), with the same look. (Sample:
  02-comp-m1-samples/ui-action-button.htm)
- The component covers its container (100% x 100%) but lets the mouse through: only the button, the open menu
  and its cover (to close it) catch clicks.
- Style packages: "classic" (default, the look of UIActionButton). Select with styleName. (ActionButton.styles)

USAGE:
const fab = ActionButton({
    items: [
        { key: "photo", labelText: "Take a Photo" },
        { key: "gallery", labelText: "Add from Gallery" },
        "Add from URL", // a text: its key is the text
    ],
    onAction: function (key, self) { println("Action: " + key); },
});
fab.setItems([...]);
fab.openMenu(); fab.closeMenu(); fab.toggleMenu();
fab.setButtonColor("#8BC34A");
ActionButton({ onAction: function () { addNewNote(); } }); // no items: a direct button
ActionButton({ style: { button: { color: "#8BC34A" } } }); // Change only some keys of the style.

Started Date: October 2026 (UIActionButton: 22 August 2022)
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const ActionButtonDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    items: [], // [{ key, labelText }] or ["text"]
    iconFile: "../comp-m4/action-button/add.png",
    openIconFile: "", // "": iconFile. The icon while the menu is open.
    iconSize: 30,
    iconRotate: 0, // deg
    openIconRotate: 45, // deg: the + turns into ×
    rightSpace: 40, // The button from the right side of the container
    bottomSpace: 40, // The button from the bottom of the container
    menuWidth: 280,
    menuGap: 20, // Between the menu and the button
    onAction: function (key, self) { }, // An action was chosen (no items: key is "", one item: its key)
    onMenuToggle: function (self) { }, // The menu opened / closed: self.menuOpened
    styleName: "classic", // "classic" or a name added to ActionButton.styles
    style: { // Classic style package (default): the look of UIActionButton
        button: {
            size: 90,
            color: "#FFD541",
            openColor: "lightgray",
            border: 4,
            borderColor: "rgba(0, 0, 0, 0.2)",
            iconOpacity: 0.4,
        },
        menu: {
            color: "whitesmoke", // The lines between the actions
            round: 13,
            border: 2,
            borderColor: "rgba(0, 0, 0, 0.2)",
            hiddenScale: 0.4, // The menu grows from this size
        },
        item: {
            height: 50,
            gap: 1,
            color: "white",
            textColor: "", // "": the color of a basic.js Button
            fontSize: 0, // 0: the size of a basic.js Button
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
        btn.plainText = item.labelText;
        if (_s.item.textColor) btn.textColor = _s.item.textColor;
        if (_s.item.fontSize) btn.fontSize = _s.item.fontSize;
        btn.on("click", function () { chooseAction(item.key); });
        return btn;
    };

    // The menu buttons, made again from box.items.
    const createItems = function () {
        box.itemButtons.forEach(function (btn) { btn.remove(); });
        box.itemButtons = createIn(box.menu, function () {
            return box.items.map(createItemButton);
        });
    };

    const chooseAction = function (key) {
        box.closeMenu();
        box.onAction(key, box);
    };

    // The menu: from small and see-through to its size (and back).
    const showMenu = function () {
        if (cancelHide) cancelHide();
        cancelHide = null;
        box.menu.visible = 1;
        box.menu.withMotion(function () {
            box.menu.opacity = 1;
            box.menu.css.transform = "scale(1)";
        });
    };

    const hideMenu = function () {
        box.menu.opacity = 0;
        box.menu.css.transform = "scale(" + _s.menu.hiddenScale + ")";
        if (cancelHide) cancelHide();
        cancelHide = box.after(MENU_MOTION_MS, function () {
            cancelHide = null;
            box.menu.visible = 0;
        });
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
        box.onAction((onlyItem) ? onlyItem.key : "", box);
    };

    box.setItems = function (items) {
        box.items = ActionButton.normalizeItems(items);
        if (box.items.length < 2) box.closeMenu();
        createItems();
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
        padding: [0, 0, 0, _s.item.gap], // WHY: UIActionButton left one line under the last action too.
        color: _s.menu.color,
        round: _s.menu.round,
        border: _s.menu.border,
        borderColor: _s.menu.borderColor,
    });
    box.menu.role = "menu";
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
    box.listenTo(document, "keydown", function (self, event) {
        if (event.key !== "Escape" || !box.menuOpened) return;
        box.closeMenu();
        box.btnAction.elem.focus();
    });

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// The items with every value filled: a text -> { key: text, labelText: text }; id (UIActionButton) is a key too.
ActionButton.normalizeItems = function (items) {
    return (Array.isArray(items) ? items : []).map(function (item) {
        if (typeof item !== "object" || item === null) return { key: String(item), labelText: String(item) };
        const key = (item.key !== undefined) ? item.key : item.id;
        const labelText = (item.labelText !== undefined) ? item.labelText : item.text;
        return { key: String(key !== undefined ? key : labelText), labelText: String(labelText || "") };
    });
};

// *** STYLE PACKAGES:
// USAGE: ActionButton({ styleName: "classic" })
// USAGE: ActionButton({ style: { button: { color: "#8BC34A" } } }) // Change only some keys.
ActionButton.styles = {

    // The look of UIActionButton (comp-m1): a yellow round button, a white menu with thin lines.
    classic: ActionButtonDefaults.style,

};
