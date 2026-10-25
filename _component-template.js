/* Bismillah */

/*

Component Template - v26.10

UI COMPONENT TEMPLATE
- The starting point of a new component. Copy it, rename CompName (and CompNameDefaults, CompName.styles),
  then delete what the new component does not need.
- The sample is a card button: an icon, a label, a description, a badge and a row of small items (tags).
  It shows the standards of the components of this repository:
  - DEFAULTS: every default value becomes a public variable on the box (box.labelText...).
  - STYLE PACKAGES: styleName "light" / "dark" (CompName.styles). params.style > the package > CompNameDefaults.style.
  - LAYOUT: box.layout is the group that places the parts of the component.
  - STATE: box.state ("normal", "hover", "pressed", "selected", "disabled") is decided in one place (getState).
  - DRAWING: functions named by their one job: createItems() (the objects made from the data; one object:
    createItem(), so addItem() adds one without making the others again), applyContent() (the texts, the icon,
    the badge), paint() (the look of the state), refreshLayout() (what depends on the sizes). drawAll() calls them.
  - SETTERS: a value is changed after create with a setX() function that calls only the drawing function it needs.
  - EVENTS: onClick, onChange (onChange is NOT called at create time or with silent: 1).
  - OBJECTS ADDED LATER: createIn(container, fn) (it puts the container back, also on an error).
  - KEYBOARD AND ACCESSIBILITY: box.role, box.aria = { label, pressed... }, box.tabIndex, Enter / Space,
    setFocusRing() (only for the keyboard).
  - GLOBAL THINGS ARE CLEANED BY basic.js: box.listenTo(window, ...), box.onPageResize(), box.after(), box.every(),
    box.own(obj) are removed / stopped by remove(). So most components do not override remove() any more.
  - basic.isOn(v): an "on" value of a param (1, "1", true).
- THE CODE READS LIKE PROSE: basic.js props instead of elem.style, short functions with early returns, one thought
  per line, no nested ternaries, comments only for WHY. The rules: bugra-rules.md (at the root of the repository).

USAGE:
const card = CompName({
    labelText: "Orders",
    descText: "12 new orders today",
    badgeText: "3",
    items: ["Today", "Paid"],
    onClick: function (self) { self.setSelected(!self.selected); },
    onChange: function (self) { println("selected: " + self.selected); },
});
card.setText("Orders", "15 new orders today");
card.setBadge("");              // no badge
card.setItems(["A", "B", "C"]);
card.addItem("D");
card.setSelected(1, 1);         // silent: onChange is not called
card.setEnabled(0);
CompName({ styleName: "dark", labelText: "On a dark page" });
CompName({ styleName: "dark", style: { box: { round: 16 } } }); // Change only some keys of a package.
CompName({ style: CompName.styles.dark }); // The same as styleName: "dark". (The package is copied, never changed.)

GOTCHAS (CLAUDE.md):
- A default must not be named like a basic.js setter: text, color, title, html, visible, zoom... (use labelText, htmlText).
- A group clips its content. Give clipContent: 0 to a group whose content moves out of it (a lift, a glow, a badge).
- visible: 0 in the props is undone if elem.style.display is set after it: set the display first, then visible = 0.
  Hide a group after its children are created.
- A text of the user goes in with plainText (Label.text is innerHTML).
- A Box with height: "auto" does not grow with basic.js children: put them in a group (box.layout) with position: "relative".

WHEN THE NEW COMPONENT IS READY:
- A sample page: 02-comp-mX-samples/<name>.htm (a scrolling Box, the cards of the other sample pages).
- test/components-test.htm: add it to COMPONENTS ({ file, name, deps }) and open it (the tab title: ALL PASS).
- The .min.js twin: _make-min-js.sh makes it only when one is there: create an empty <name>.min.js once,
  then ./_make-min-js.sh --build comp-mX/<name>.js
- The catalog: index/catalog.js (and the <noscript> list of index.htm), and its line in CLAUDE.md.

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const CompNameDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 240, // Standard box features are added automatically.
    height: "auto", // Grows with box.layout.
    labelText: "Label",
    descText: "Description", // "": no description
    badgeText: "", // "": no badge
    iconFile: "", // WHY: Not in the style, because it is a frequently used param. "": no icon
    items: [], // ["A", "B"]: small tags under the texts. Changed later with setItems().
    selected: 0,
    enabled: 1,
    ariaLabel: "", // "": the labelText is read
    onClick: function (self, event) { },
    onChange: function (self) { }, // self.selected changed. (Not at create time, not with silent: 1)
    styleName: "light", // "light", "dark" or a name added to CompName.styles
    style: { // Light style package (default)
        layout: {
            gap: 10,
            padding: [12, 10],
            align: "left center",
        },
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.15),
            round: 8,
        },
        // A state: only the keys that change. (The others come from box.)
        hover: { color: "#F5F6F4" },
        pressed: { color: "#E9EBE8" },
        selected: { color: "#EAF3F2", borderColor: "cadetblue" },
        disabled: { opacity: 0.45 },
        focus: { ringColor: "rgba(95, 158, 160, 0.6)" }, // The ring of the keyboard focus
        icon: { width: 32, height: 32, color: "transparent" },
        label: { fontSize: 15, textColor: Black(0.85), fontFamily: "opensans-bold" },
        desc: { fontSize: 13, textColor: Black(0.5) },
        badge: { fontSize: 11, textColor: White(1), color: "tomato", round: 9 },
        item: { fontSize: 11, textColor: Black(0.6), color: Black(0.06), round: 9 },
    },
};

const CompName = function (params = {}) {

    // Merge style package: params.style > CompName.styles[styleName] > CompNameDefaults.style (light)
    basic.applyStylePackage(params, CompName.styles, CompNameDefaults);

    // Merge params:
    mergeIntoIfMissing(params, CompNameDefaults);

    // Edit params, if needed:
    params.items = (Array.isArray(params.items)) ? params.items.slice() : []; // WHY: A copy: the array of the caller does not change.

    // BOX: Component container
    let box = startObject(params);

    // NOTE: Parent container is box.containerBox

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let isHover = 0;
    let isPressed = 0;
    let cancelRefresh = null; // The cancel function of the waiting box.refresh() (box.after)
    const NARROW_PAGE_WIDTH = 480; // A page narrower than this gets a smaller gap.
    const NARROW_GAP = 6;

    // *** PUBLIC VARIABLES:
    box.state = "normal"; // "normal", "hover", "pressed", "selected", "disabled" (read only: it comes from getState)
    box.itemList = []; // The Labels of the items
    // NOTE: Default values are also public variables. (box.labelText, box.selected, box.enabled...)

    // *** PRIVATE FUNCTIONS:

    // THE STATE: decided in one place, from the flags.
    const getState = function () {
        if (box.enabled != 1) return "disabled";
        if (isPressed) return "pressed";
        if (box.selected == 1) return "selected";
        if (isHover) return "hover";
        return "normal";
    };

    // DRAWING: each function does one job, and a change calls only the one it needs:
    // createItems()   -> the objects made from the data are made again    (setItems)
    // createItem()    -> one object of the data (createItems, addItem)     (addItem: the others are kept)
    // applyContent()  -> the texts, the icon, the badge                     (setText, setBadge, setIcon)
    // paint()         -> the colors and the look of the state               (hover, pressed, selected, enabled)
    // refreshLayout() -> what depends on the sizes (measured, after the objects are placed)   (resize)
    // drawAll()       -> all of them                                        (the first drawing, box.refresh)
    // WHY: A cheap change (the mouse on it) only paints; nothing is made again for it.
    // NOTE: When a change must update more than the look (Ex: Tabs: the indicator, the panel, the Tab order),
    //       one function shows it everywhere (Tabs: showActiveTab), so no setter can forget a part.

    // DATA: one item. Its container must be set. (createIn)
    const createItem = function (text) {
        const lbl = Label({ plainText: String(text), ..._s.item });
        lbl.css = { padding: "1px 7px", whiteSpace: "nowrap" };
        lbl.shrink = 0;
        return lbl;
    };

    // DATA: the items (made again in their own group)
    const createItems = function () {
        if (box.itemsGroup) box.itemsGroup.remove();
        // WHY: createIn() puts the container back after it (also on an error). setDefaultContainerBox() does not:
        //      the next objects of the page would go into this component.
        box.itemsGroup = createIn(box.texts, function () {
            const group = HGroup({ width: "100%", height: "auto", gap: 4, align: "left center", wrap: 1, position: "relative" });
            endGroup();
            return group;
        });
        box.itemsGroup.css.marginTop = "4px";
        box.itemList = box.items.map(function (text) {
            return createIn(box.itemsGroup, function () { return createItem(text); });
        });
        box.itemsGroup.visible = (box.items.length) ? 1 : 0; // WHY: Hidden after its children are created.
    };

    // CONTENT: the texts, the icon, the badge
    const applyContent = function () {
        box.label.plainText = box.labelText;
        box.lblDesc.plainText = box.descText;
        box.lblDesc.visible = (box.descText) ? 1 : 0;
        const hasBadge = (box.badgeText !== "" && box.badgeText !== null && box.badgeText !== undefined);
        box.lblBadge.plainText = (hasBadge) ? String(box.badgeText) : "";
        box.lblBadge.visible = (hasBadge) ? 1 : 0;
        box.icon.visible = (box.iconFile) ? 1 : 0;
        if (box.iconFile && box.icon.loadedFile !== box.iconFile) {
            box.icon.load(box.iconFile);
            box.icon.loadedFile = box.iconFile;
        }
        box.aria = { label: box.ariaLabel || box.labelText };
    };

    // PAINT: the look of the state
    const paint = function () {
        box.state = getState();
        const look = _s[box.state] || {}; // "normal" has no keys of its own
        box.color = look.color || _s.box.color;
        box.borderColor = look.borderColor || _s.box.borderColor;
        box.opacity = (box.state === "disabled") ? _s.disabled.opacity : 1;
        box.cursor = (box.state === "disabled") ? "default" : "pointer";
        box.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.aria = { pressed: (box.selected == 1), disabled: (box.enabled != 1) };
    };

    // Everything: the first drawing and box.refresh().
    const drawAll = function () {
        createItems();
        applyContent();
        paint();
        refreshLayout();
    };

    // LAYOUT: what depends on the sizes. Here: a narrow page makes the gap smaller.
    // NOTE: Called by a size change (box.onPageResize, box.onResize), not by paint(): a hover must not measure.
    const refreshLayout = function () {
        if (!box) return;
        box.layout.gap = (page.width < NARROW_PAGE_WIDTH) ? NARROW_GAP : _s.layout.gap;
    };

    // *** PUBLIC FUNCTIONS:
    // A param that can change after create gets a setter. It saves the value, then calls the drawing it needs.

    box.setText = function (labelText, descText = box.descText) {
        box.labelText = labelText;
        box.descText = descText;
        applyContent();
    };
    // USAGE: get: card.labelText, set: card.setText("Orders", "12 new")

    box.setBadge = function (text) {
        box.badgeText = text;
        applyContent();
    };
    // USAGE: card.setBadge("3") / card.setBadge("") // no badge

    box.setIcon = function (file) {
        box.iconFile = file;
        applyContent();
    };

    box.setItems = function (items) {
        box.items = (Array.isArray(items)) ? items.slice() : [];
        createItems();
    };
    // USAGE: card.setItems(["Today", "Paid"])

    // One more item at the end. The other items are not made again.
    box.addItem = function (text) {
        box.items.push(text);
        box.itemsGroup.visible = 1; // WHY: Before the new item: an object made in a hidden group is not a flex item.
        box.itemList.push(createIn(box.itemsGroup, function () { return createItem(text); }));
    };
    // USAGE: card.addItem("New")

    // silent: 1 -> onChange is not called.
    box.setSelected = function (value, silent = 0) {
        value = basic.isOn(value) ? 1 : 0;
        if (box.selected == value) return;
        box.selected = value;
        paint();
        if (!silent) box.onChange(box);
    };
    // USAGE: get: card.selected, set: card.setSelected(1)

    box.setEnabled = function (value) {
        box.enabled = basic.isOn(value) ? 1 : 0;
        if (box.enabled != 1) { isHover = 0; isPressed = 0; }
        paint();
    };
    // USAGE: get: card.enabled, set: card.setEnabled(0)

    // Draws everything again (once, after many changes in a row). delay: ms
    // NOTE: box.after() is a timer of the box: it can not run after remove().
    box.refresh = function (delay = 0) {
        if (cancelRefresh) cancelRefresh();
        cancelRefresh = box.after(delay, function () { cancelRefresh = null; drawAll(); });
    };
    // USAGE: card.labelText = "A"; card.items = ["B"]; card.refresh();

    // REMOVE: basic.js remove() cleans the objects inside, their events, and what was added with listenTo,
    // onPageResize, after, every and own. Override it only for something else (Ex: a static list of the component,
    // a Chart.js instance, an observer). Then keep this shape:
    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).

        // NOTE: Clean here only what basic.js does not know. (Ex: CompName.list.splice(CompName.list.indexOf(box), 1))

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };
    // USAGE: card.remove();

    // *** OBJECT VIEW:

    // BOX: Container look
    box.props(_s.box);
    box.clickable = 1;
    box.clipContent = 0; // WHY: The badge stands out of the top right corner.
    box.setMotion("background-color 0.2s, border-color 0.2s, opacity 0.2s");
    box.role = "button";

    // GROUP: Layout (icon, texts)
    // NOTE: box.layout is the group that places the parts of the component. (Ex: HGroup or VGroup by a param)
    box.layout = HGroup({
        width: "100%",
        height: "auto",
        position: "relative", // WHY: The box (height: "auto") grows with it.
        ..._s.layout,
    });

        // ICON
        box.icon = Icon(0, 0, _s.icon);
        box.icon.shrink = 0;

        // GROUP: Texts (label, description, items)
        box.texts = VGroup({ width: "auto", height: "auto", gap: 2, align: "left top" });
        box.texts.css = { flex: "1 1 0", minWidth: "0px" }; // WHY: It takes the free room, its texts end with "..."

            // LABEL: Label
            box.label = Label({ ..._s.label, ellipsis: 1, css: { maxWidth: "100%" } });

            // LABEL: Description
            box.lblDesc = Label({ ..._s.desc, ellipsis: 1, css: { maxWidth: "100%" } });

            // NOTE: The items group is made by createItems().

        endGroup();

    endGroup();

    // LABEL: Badge (out of the layout, at the top right corner)
    box.lblBadge = Label({ right: -6, top: -6, ..._s.badge });
    box.lblBadge.css = { padding: "1px 7px", whiteSpace: "nowrap", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)" };

    // *** OBJECT INIT CODE:

    box.onHoverChange(function (self, isOver) {
        isHover = isOver;
        if (!isOver) isPressed = 0;
        paint();
    });
    box.on("mousedown", function () {
        if (box.enabled != 1) return;
        isPressed = 1;
        paint();
    });
    box.on("mouseup", function () { isPressed = 0; paint(); });
    box.on("click", function (self, event) {
        if (box.enabled != 1) return;
        box.onClick(box, event);
    });

    // KEYBOARD: Enter / Space act like a click. setFocusRing: a ring only for the keyboard (not after a mouse click).
    box.setFocusRing(_s.focus.ringColor);
    box.on("keydown", function (self, event) {
        if (box.enabled != 1) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            box.onClick(box, event);
        }
    });

    // A GLOBAL EVENT: box.onPageResize() is removed by basic.js with the box.
    box.onPageResize(refreshLayout);

    drawAll(); // NOTE: The first drawing: the items, the content, the look and the layout.

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:
// NOTE: Helpers that do not need a box. (Ex: CompName.toId(key), CompName._counter for element ids)

// *** STYLE PACKAGES:
// USAGE: CompName({ styleName: "dark" })
// USAGE: CompName({ styleName: "dark", style: { label: { textColor: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: CompName.styles.myStyle = { box: { color: "tomato" } };
CompName.styles = {

    // White card, dark text, a soft line.
    light: CompNameDefaults.style,

    // For a dark page.
    dark: {
        box: { color: "#2B2D31", border: 1, borderColor: "rgba(255, 255, 255, 0.12)", round: 8 },
        hover: { color: "#33353A" },
        pressed: { color: "#3C3E44" },
        selected: { color: "#24383A", borderColor: "#5FB3B5" },
        focus: { ringColor: "rgba(95, 179, 181, 0.7)" },
        label: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.92)", fontFamily: "opensans-bold" },
        desc: { fontSize: 13, textColor: "rgba(255, 255, 255, 0.55)" },
        item: { fontSize: 11, textColor: "rgba(255, 255, 255, 0.7)", color: "rgba(255, 255, 255, 0.08)", round: 9 },
    },

};
