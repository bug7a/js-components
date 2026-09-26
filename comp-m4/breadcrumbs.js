/* Bismillah */

/*

Breadcrumbs - v26.09

UI COMPONENT TEMPLATE
- Shows the location of the current page in a hierarchy. (Ex: Home / Products / Laptops)
- The last item is the current page: not clickable, bold, aria-current="page".
- Separator: "chevron" (drawn with code) or any text. (Ex: "/", "›", "•")
- Collapse: With maxItems, the middle items are shown as "…". Click it to expand.
- Items can have an icon (iconFile) and a url.
- Keyboard: Tab to focus an item, Enter or Space to click.

ITEM: { text, key, url, iconFile, data }
- A string is also accepted: "Home" -> { text: "Home" }
- url: If it is set, the page goes to the url on click. (onClick can return false to stop it.)

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const BreadcrumbsDefaults = {
    key: "0",
    width: "auto", // "auto": Wraps the items. A number or "100%": Fixed width.
    height: "auto",
    items: [], // [{ text, key, url, iconFile, data }] or ["Home", "Products"]
    separator: "chevron", // "chevron" or a text. (Ex: "/", "›", "•")
    maxItems: 0, // 0: No collapse. Ex: 4 -> Home / … / Laptops / Lenovo
    itemsBeforeCollapse: 1,
    itemsAfterCollapse: 2,
    maxItemWidth: 180, // Long texts are cut with "...". 0: No limit.
    wrap: 0, // 1: Items move to the next line when there is no space.
    trimOnClick: 0, // 1: Clicking an item removes the items after it. (In-app navigation)
    currentClickable: 0, // 1: The last item can be clicked too.
    enabled: 1,
    ariaLabel: "Breadcrumb",
    onClick: function (self, item, index) { }, // return false: Do not go to item.url
    onChange: function (self) { }, // When items change with code or trimOnClick.
    style: {
        layout: {
            gap: 4,
        },
        item: {
            fontSize: 14,
            textColor: Black(0.55),
            color: "transparent",
            round: 6,
            padding: [6, 3],
        },
        itemHover: {
            textColor: Black(0.9),
            color: Black(0.05),
        },
        current: {
            textColor: Black(0.85),
            fontFamily: "opensans-bold",
        },
        separator: {
            fontSize: 14,
            textColor: Black(0.3),
            size: 6, // Chevron size
        },
        icon: {
            width: 16,
            height: 16,
        },
        focus: {
            color: "#3871E0",
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const Breadcrumbs = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, BreadcrumbsDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.height = "auto";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let parts = []; // Created objects (items, separators, ellipsis)
    let isExpanded = 0;

    // *** PUBLIC VARIABLES:
    // [var] Items: [{ text, key, url, iconFile, data }]
    box.items = [];

    // *** PRIVATE FUNCTIONS:

    // Create objects inside a container, after the component is created.
    const createIn = function (container, func) {
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
        func();
        setDefaultContainerBox(previous);
    };

    const normalizeItem = function (item) {
        if (typeof item == "string" || typeof item == "number") {
            return { text: String(item) };
        }
        return Object.assign({ text: "" }, item);
    };

    // Returns: [{ type: "item", item, index }, { type: "ellipsis" }, ...]
    const getVisibleEntries = function () {

        const count = box.items.length;
        const before = Math.max(1, box.itemsBeforeCollapse);
        const after = Math.max(1, box.itemsAfterCollapse);

        const entries = box.items.map(function (item, index) {
            return { type: "item", item: item, index: index };
        });

        // WHY: Collapse only if it hides at least 2 items. Hiding 1 item behind "…" saves no space.
        const needsCollapse = box.maxItems > 0 && count > box.maxItems && count - before - after >= 2;
        if (!needsCollapse || isExpanded) return entries;

        return entries.slice(0, before)
            .concat([{ type: "ellipsis" }])
            .concat(entries.slice(count - after));

    };

    // style.item.padding: 4 or [x, y] -> [x, y]
    const getPadding = function () {
        const p = _s.item.padding;
        return (Array.isArray(p)) ? [p[0], (p.length > 1) ? p[1] : p[0]] : [num(p) || 0, num(p) || 0];
    };

    const setItemHover = function (itemBox, isOver) {
        const style = (isOver) ? _s.itemHover : _s.item;
        itemBox.color = style.color;
        itemBox.label.textColor = style.textColor;
    };

    // Visible focus ring only for the keyboard. (Not for a mouse click.)
    const addFocusRing = function (obj) {
        obj.on("focus", function () {
            if (obj.elem.matches(":focus-visible")) {
                obj.elem.style.boxShadow = "0 0 0 2px " + _s.focus.color;
            }
        });
        obj.on("blur", function () {
            obj.elem.style.boxShadow = "none";
        });
    };

    // Makes an object work like a link: role, tab, Enter/Space.
    const makeClickable = function (obj, func) {

        obj.elem.setAttribute("role", "link");
        obj.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        obj.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        obj.elem.style.outline = "none";
        obj.clickable = 1;

        obj.on("click", function (self, event) {
            if (box.enabled == 1) func(event);
        });

        obj.on("keydown", function (self, event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (box.enabled == 1) func(event);
            }
        });

        addFocusRing(obj);

    };

    const createSeparator = function () {

        let sep;

        if (box.separator == "chevron") {

            const size = _s.separator.size;

            // BOX: Chevron (a rotated corner)
            sep = Box({
                width: size,
                height: size,
                color: "transparent",
            });
            sep.elem.style.borderTop = "1.5px solid " + _s.separator.textColor;
            sep.elem.style.borderRight = "1.5px solid " + _s.separator.textColor;
            sep.elem.style.transform = "rotate(45deg)";
            sep.elem.style.margin = "0 " + Math.round(size / 2 + 2) + "px 0 " + Math.round(size / 2) + "px";

        } else {

            // LABEL: Text separator
            sep = Label({
                text: Breadcrumbs.escapeHtml(box.separator),
                fontSize: _s.separator.fontSize,
                textColor: _s.separator.textColor,
            });
            sep.elem.style.whiteSpace = "nowrap";
            sep.elem.style.padding = "0 2px";

        }

        sep.elem.style.flexShrink = "0";
        sep.elem.setAttribute("aria-hidden", "true"); // WHY: Screen readers should not read "/" between items.
        return sep;

    };

    const createEllipsis = function () {

        const btn = Label({
            text: "…",
            fontSize: _s.item.fontSize,
            textColor: _s.item.textColor,
            color: _s.item.color,
            round: _s.item.round,
        });
        btn.elem.style.padding = getPadding()[1] + "px " + getPadding()[0] + "px";
        btn.elem.style.flexShrink = "0";
        btn.elem.title = "Show all";
        btn.elem.setAttribute("aria-label", "Show all items");

        makeClickable(btn, function () {
            box.expand();
        });

        btn.on("mouseenter", function () {
            if (box.enabled != 1) return;
            btn.color = _s.itemHover.color;
            btn.textColor = _s.itemHover.textColor;
        });
        btn.on("mouseleave", function () {
            btn.color = _s.item.color;
            btn.textColor = _s.item.textColor;
        });

        return btn;

    };

    const createItem = function (item, index) {

        const isCurrent = (index == box.items.length - 1);
        const isClickable = !isCurrent || box.currentClickable == 1;

        // GROUP: Item (icon + label)
        const itemBox = HGroup({
            width: "auto",
            height: "auto",
            align: "left center",
            gap: 6,
            color: _s.item.color,
            round: _s.item.round,
        });
        itemBox.elem.style.padding = getPadding()[1] + "px " + getPadding()[0] + "px";
        itemBox.elem.style.minWidth = "0";
        itemBox.elem.style.flexShrink = (isCurrent) ? "1" : "0";
        itemBox.setMotion("background-color 0.15s");
        itemBox.item = item;
        itemBox.index = index;

            // ICON: Optional
            if (item.iconFile) {
                itemBox.icon = Icon({
                    width: _s.icon.width,
                    height: _s.icon.height,
                });
                itemBox.icon.elem.style.flexShrink = "0";
                itemBox.icon.elem.alt = "";
                itemBox.icon.load(item.iconFile);
            }

            // LABEL: Text
            itemBox.label = Label({
                text: Breadcrumbs.escapeHtml(item.text),
                fontSize: _s.item.fontSize,
                textColor: (isCurrent) ? _s.current.textColor : _s.item.textColor,
            });
            // NOTE: basic.js has no fontFamily setter. Set it on the element.
            if (isCurrent && _s.current.fontFamily) itemBox.label.elem.style.fontFamily = _s.current.fontFamily;
            itemBox.label.elem.style.whiteSpace = "nowrap";
            itemBox.label.elem.style.overflow = "hidden";
            itemBox.label.elem.style.textOverflow = "ellipsis";
            if (box.maxItemWidth > 0) itemBox.label.elem.style.maxWidth = box.maxItemWidth + "px";
            if (item.text) itemBox.elem.title = item.text; // Full text on mouse over

        endGroup();

        if (isCurrent) {
            itemBox.elem.setAttribute("aria-current", "page");
        }

        if (isClickable) {

            makeClickable(itemBox, function (event) {
                box.clickItem(index, event);
            });

            itemBox.on("mouseenter", function () {
                if (box.enabled == 1) setItemHover(itemBox, 1);
            });
            itemBox.on("mouseleave", function () {
                setItemHover(itemBox, 0);
                if (isCurrent) itemBox.label.textColor = _s.current.textColor;
            });

        }

        return itemBox;

    };

    const render = function () {

        parts.forEach(function (obj) { obj.remove(); });
        parts = [];

        createIn(box.content, function () {

            getVisibleEntries().forEach(function (entry, i) {

                // WHY: endGroup() (in createItem) sets the container to the last started group, not to box.content.
                // While the page is still being created, that is another box. So set it again for every part.
                setDefaultContainerBox(box.content);
                if (i > 0) parts.push(createSeparator());

                setDefaultContainerBox(box.content);
                if (entry.type == "ellipsis") {
                    parts.push(createEllipsis());
                } else {
                    parts.push(createItem(entry.item, entry.index));
                }

            });

        });

        updateView();

    };

    const updateView = function () {
        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.content.elem.style.flexWrap = (box.wrap == 1) ? "wrap" : "nowrap";
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");
    };

    const setItemsSilent = function (items) {
        box.items = (items || []).map(normalizeItem);
        isExpanded = 0;
        render();
    };

    // *** PUBLIC FUNCTIONS:

    box.setItems = function (items, silent = 0) {
        setItemsSilent(items);
        if (!silent) box.onChange(box);
    };
    // USAGE: breadcrumbs.setItems(["Home", "Products", { text: "Laptops", key: "laptops" }])

    box.getItems = function () {
        return box.items.slice();
    };

    box.getCurrentItem = function () {
        return box.items[box.items.length - 1] || null;
    };

    // Add a new item to the end. It becomes the current item.
    box.addItem = function (item) {
        box.items.push(normalizeItem(item));
        render();
        box.onChange(box);
    };

    // Keep the items until the index. (Removes the items after it.)
    box.goTo = function (index) {
        if (index < 0 || index >= box.items.length - 1) return;
        box.items = box.items.slice(0, index + 1);
        isExpanded = 0;
        render();
        box.onChange(box);
    };

    // Remove the current item. (Go one level up.)
    box.back = function () {
        box.goTo(box.items.length - 2);
    };

    // Same as a user click. (onClick, url, trimOnClick)
    box.clickItem = function (index, event) {

        const item = box.items[index];
        if (!item || box.enabled != 1) return;

        const result = box.onClick(box, item, index, event);

        if (box.trimOnClick == 1) box.goTo(index);

        if (item.url && result !== false) {
            go(item.url);
        }

    };

    // Show all the collapsed items.
    box.expand = function () {
        if (isExpanded) return;
        isExpanded = 1;
        render();
        // WHY: The ellipsis button is removed. Keep the keyboard focus inside the component.
        const firstHidden = parts.find(function (obj) { return obj.index == Math.max(1, box.itemsBeforeCollapse); });
        if (firstHidden && box.enabled == 1) firstHidden.elem.focus();
    };

    box.collapse = function () {
        if (!isExpanded) return;
        isExpanded = 0;
        render();
    };

    box.setSeparator = function (separator) {
        box.separator = separator;
        render();
    };
    // USAGE: breadcrumbs.setSeparator("/") or breadcrumbs.setSeparator("chevron")

    box.setMaxItems = function (maxItems) {
        box.maxItems = num(maxItems);
        isExpanded = 0;
        render();
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        render(); // WHY: tabIndex and cursor of every item change.
    };
    // USAGE: get: breadcrumbs.enabled, set: breadcrumbs.setEnabled(0)

    box.refresh = function () {
        render();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.elem.setAttribute("role", "navigation");
    box.elem.setAttribute("aria-label", box.ariaLabel);

    // GROUP: Items row (created by render)
    box.content = HGroup({
        width: (box.width == "auto") ? "auto" : "100%",
        height: "auto",
        align: "left center",
        gap: _s.layout.gap,
        position: "relative", // WHY: Component size is "auto". A relative group makes the container wrap it.
    });

    endGroup();

    // *** OBJECT INIT CODE:

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    setItemsSilent(params.items); // WHY: Copy the array. The default [] must not be shared between components.

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Item texts must not be read as HTML.
Breadcrumbs.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// Creates items from a path. Every item has the path until it as key.
Breadcrumbs.fromPath = function (path, rootText = "Home", divider = "/") {

    const names = String(path).split(divider).filter(function (name) { return name !== ""; });
    const items = [{ text: rootText, key: divider }];

    let current = "";
    names.forEach(function (name) {
        current += divider + name;
        let text = name;
        try { text = decodeURIComponent(name); } catch (e) { } // WHY: "100%" is not a valid URI part.
        items.push({ text: text, key: current });
    });

    return items;

};
// USAGE: Breadcrumbs.fromPath("/docs/2026/report.pdf")
// -> [{ text: "Home", key: "/" }, { text: "docs", key: "/docs" }, { text: "2026", key: "/docs/2026" }, { text: "report.pdf", key: "/docs/2026/report.pdf" }]
