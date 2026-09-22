/* Bismillah */

/*

Tabs - v26.09

UI COMPONENT TEMPLATE
- A tab bar: one tab is active, the others can be clicked. An animated indicator moves to the active tab.
- Variants: "underline" (a line under the active tab, default) and "pill" (a filled shape behind the active tab, like a segmented control).
- Tabs can have an icon, a count ("Orders 12"), a badge dot (something new), and can be disabled or closable (x).
- Add button ("+") at the end of the bar (addButton: 1) -> onAdd.
- Many tabs: the bar scrolls sideways (the scroll bar is hidden), arrow buttons appear at the sides, the mouse wheel scrolls
  and the active tab is scrolled into view.
- fullWidth: 1 -> the tabs share the bar width equally.
- vertical: 1 -> the tabs are stacked (Ex: settings sections). The indicator is on the left side.
- panels: 1 -> a content Box for every tab under the bar. Only the active one is shown.
  Fill a panel with startPanel(key) ... endPanel(), or get it with getPanel(key).
- Keyboard: ArrowLeft / ArrowRight (ArrowUp / ArrowDown when vertical), Home, End move between the tabs. Enter / Space
  activates, Delete closes a closable tab. Tab key moves the focus out of the bar (roving tabindex).
- Accessibility: tablist / tab / tabpanel roles, aria-selected, aria-controls.
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (Tabs.styles)
- Everything is drawn with code (no image files needed).

TAB: { key, text, iconFile, count, badge, disabled, closable }
- A string is also accepted: "Orders" -> { key: "Orders", text: "Orders" }

USAGE:
const tabs = Tabs({
    tabs: ["All", { key: "open", text: "Open", count: 12 }, { key: "done", text: "Done", badge: 1 }],
    value: "open",
    onChange: (self) => println(self.value),
});
tabs.setValue("done");            // onChange is called
tabs.setValue("All", 1);          // silent
tabs.setCount("open", 13);
tabs.addTab({ key: "new", text: "New tab", closable: 1 });
tabs.removeTab("new");

const pages = Tabs({ width: "100%", panels: 1, panelHeight: 300, tabs: ["Details", "History"] });
pages.startPanel("Details");
    Label({ text: "Details content" });
pages.endPanel();

Tabs({ variant: "pill", tabs: ["Day", "Week", "Month"] });
Tabs({ vertical: 1, width: 200, tabs: ["General", "Security", "Billing"] });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TabsDefaults = {
    key: "0",
    width: "auto",
    height: "auto",
    tabs: [], // [{ key, text, iconFile, count, badge, disabled, closable }] or ["A", "B"]
    value: null, // Key of the active tab. null: the first enabled tab.
    variant: "underline", // "underline", "pill" (Only at create time)
    vertical: 0, // 1: Tabs are stacked. (Only at create time)
    fullWidth: 0, // 1: Tabs share the bar width equally.
    closable: 0, // 1: Every tab has a close (x) button. (A tab can also set its own "closable".)
    addButton: 0, // 1: "+" button at the end of the bar.
    showArrows: "auto", // "auto": Arrow buttons when the tabs do not fit. 0: Never.
    panels: 0, // 1: A content Box for every tab. (Only at create time)
    panelHeight: "auto", // Height of the panels area. Ex: 300 or "auto" (grows with the content)
    barWidth: 200, // vertical + panels: Width of the tab bar. (The panels take the rest.)
    enabled: 1,
    ariaLabel: "Tabs",
    onChange: function (self) { }, // self.value, self.previousValue, self.getActiveTab()
    onClose: function (self, tab) { }, // Return false to keep the tab.
    onAdd: function (self) { },
    styleName: "classic", // "classic", "modern", "dark" or a name added to Tabs.styles
    style: { // Classic style package (default)
        bar: { // Underline variant
            color: "transparent",
            padding: [0, 0], // [x, y]
            gap: 4,
            round: 0,
            dividerColor: Black(0.12), // Line under the tabs (vertical: line on the left)
            dividerWidth: 1,
        },
        pillBar: { // Pill variant
            color: Black(0.06),
            padding: [4, 4],
            gap: 2,
            round: 8,
            border: 0,
            borderColor: "transparent",
        },
        tab: {
            fontSize: 14,
            textColor: Black(0.55),
            padding: [14, 10], // [x, y]
            round: 6,
            gap: 8, // Between the icon, the text, the count...
            minHeight: 40,
        },
        tabHover: {
            color: Black(0.04),
            textColor: Black(0.8),
        },
        tabActive: { // Underline variant
            color: "transparent",
            textColor: "#141414",
        },
        pillActive: { // Pill variant
            textColor: "#141414",
        },
        tabDisabled: {
            opacity: 0.4,
        },
        indicator: { // Underline variant
            color: "#141414",
            thickness: 2,
            round: 2,
            motion: 0.25, // Seconds. 0: No animation
        },
        pillIndicator: { // Pill variant
            color: White(1),
            round: 6,
            shadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
            motion: 0.25,
        },
        icon: {
            size: 16,
        },
        count: {
            fontSize: 11,
            color: Black(0.08),
            textColor: Black(0.6),
            activeColor: "#141414",
            activeTextColor: White(1),
            round: 10,
            padding: [6, 1],
        },
        badge: {
            color: "#D64545",
            size: 7,
        },
        close: {
            color: Black(0.4),
            hoverColor: "#D64545",
            size: 14,
        },
        addButton: {
            color: Black(0.5),
            hoverColor: "#141414",
            hoverBackground: Black(0.05),
            size: 16,
        },
        arrow: {
            color: Black(0.5),
            background: White(1),
            size: 16,
        },
        focus: {
            outlineColor: Black(0), // Ring around the focused tab (keyboard). Hidden by default. Ex: Black(0.1)
        },
        panel: {
            color: "transparent",
            padding: [0, 16],
            round: 0,
            border: 0,
            borderColor: "transparent",
        },
        disabled: {
            opacity: 0.5,
        },
    }
};

const Tabs = function (params = {}) {

    // Merge style package: params.style > Tabs.styles[styleName] > TabsDefaults.style (classic)
    const _styleName = params.styleName || TabsDefaults.styleName;
    const _stylePackage = Tabs.styles[_styleName];
    if (!_stylePackage) console.warn("Tabs: Style package not found: " + _styleName);
    params.style = params.style || {};
    mergeIntoIfMissing(params.style, _stylePackage || {});

    // Merge params:
    mergeIntoIfMissing(params, TabsDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    const startTabs = params.tabs;
    const startValue = params.value;
    params.tabs = [];
    params.value = null;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "tabs-" + (Tabs._counter++);
    const isPill = (box.variant === "pill");
    const isVertical = (box.vertical == 1 || box.vertical === true);
    let items = []; // [{ tab, group, label, countLabel, badgeDot, closeButton, icon, panel }]
    let panelStack = []; // startPanel() / endPanel()
    let indicatorReady = 0;

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    // NOTE: Default values are also public variables. (box.tabs, box.value, box.enabled)

    // *** PRIVATE FUNCTIONS:

    const findItem = function (key) {
        return items.find(function (item) { return item.tab.key === key; }) || null;
    };

    const getEnabledItems = function () {
        return items.filter(function (item) { return !item.tab.disabled; });
    };

    const isClosable = function (tab) {
        return (tab.closable === 1 || tab.closable === true) || (box.closable == 1 && tab.closable !== 0 && tab.closable !== false);
    };

    // Creates objects in a container again. (One group is started and ended in it.)
    // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. With one top-level group, all objects stay in the container.
    const renderInto = function (container, buildContent) {
        if (container.wrapper) container.wrapper.remove();
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
            container.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
            container.wrapper.elem.style.alignItems = "stretch";
                buildContent();
            endGroup();
        setDefaultContainerBox(previous);
    };

    const paintItem = function (item) {

        const active = (item.tab.key === box.value);
        const hover = item.hover && !active && !item.tab.disabled;
        const activeStyle = (isPill) ? _s.pillActive : _s.tabActive;

        item.group.color = (active) ? ((isPill) ? "transparent" : _s.tabActive.color) : ((hover) ? _s.tabHover.color : "transparent");
        item.label.textColor = (active) ? activeStyle.textColor : ((hover) ? _s.tabHover.textColor : _s.tab.textColor);
        item.group.elem.style.opacity = (item.tab.disabled) ? String(_s.tabDisabled.opacity) : "1";
        item.group.elem.style.cursor = (item.tab.disabled) ? "default" : "pointer";
        item.group.elem.setAttribute("aria-selected", (active) ? "true" : "false");
        item.group.elem.setAttribute("aria-disabled", (item.tab.disabled) ? "true" : "false");
        item.group.elem.tabIndex = (active) ? 0 : -1;

        if (item.countLabel) {
            item.countLabel.color = (active) ? _s.count.activeColor : _s.count.color;
            item.countLabel.textColor = (active) ? _s.count.activeTextColor : _s.count.textColor;
        }
        if (item.icon) item.icon.elem.style.opacity = (active || hover) ? "1" : "0.7";

    };

    const paintItems = function () {
        items.forEach(paintItem);
    };

    // Moves the indicator to the active tab.
    const moveIndicator = function () {

        const item = findItem(box.value);
        const ind = box.indicator;

        if (!item || item.group.visible != 1) {
            ind.opacity = 0;
            return;
        }

        const el = item.group.elem;
        const thickness = _s.indicator.thickness;

        if (isPill) {
            ind.left = el.offsetLeft;
            ind.top = el.offsetTop;
            ind.width = el.offsetWidth;
            ind.height = el.offsetHeight;
        } else if (isVertical) {
            ind.left = 0;
            ind.top = el.offsetTop;
            ind.width = thickness;
            ind.height = el.offsetHeight;
        } else {
            ind.left = el.offsetLeft;
            ind.top = box.stripInner.elem.offsetHeight - thickness;
            ind.width = el.offsetWidth;
            ind.height = thickness;
        }

        ind.opacity = 1;

        // WHY: The first position must not be animated. (The indicator would fly in from the corner.)
        if (!indicatorReady) {
            indicatorReady = 1;
            ind.elem.offsetWidth;
            ind.setMotionNow(getIndicatorMotion());
        }

    };

    const getIndicatorMotion = function () {
        const seconds = (isPill) ? _s.pillIndicator.motion : _s.indicator.motion;
        if (!seconds) return "none";
        return "left " + seconds + "s, top " + seconds + "s, width " + seconds + "s, height " + seconds + "s, opacity 0.15s";
    };

    const scrollToActive = function () {
        const item = findItem(box.value);
        if (!item) return;
        const strip = box.strip.elem;
        const el = item.group.elem;
        if (isVertical) {
            if (el.offsetTop < strip.scrollTop) strip.scrollTop = el.offsetTop - 8;
            else if (el.offsetTop + el.offsetHeight > strip.scrollTop + strip.clientHeight) strip.scrollTop = el.offsetTop + el.offsetHeight - strip.clientHeight + 8;
        } else {
            if (el.offsetLeft < strip.scrollLeft) strip.scrollLeft = el.offsetLeft - 24;
            else if (el.offsetLeft + el.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = el.offsetLeft + el.offsetWidth - strip.clientWidth + 24;
        }
    };

    const updateArrows = function () {
        if (isVertical || box.showArrows === 0 || box.showArrows === "0") return;
        const strip = box.strip.elem;
        const overflow = (strip.scrollWidth > strip.clientWidth + 1);
        box.leftArrow.visible = (overflow) ? 1 : 0;
        box.rightArrow.visible = (overflow) ? 1 : 0;
        if (overflow) {
            box.leftArrow.elem.style.opacity = (strip.scrollLeft > 1) ? "1" : "0.3";
            box.rightArrow.elem.style.opacity = (strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1) ? "1" : "0.3";
        }
    };

    const updatePanels = function () {
        if (box.panels != 1) return;
        items.forEach(function (item) {
            item.panel.visible = (item.tab.key === box.value) ? 1 : 0;
        });
    };

    const update = function () {
        paintItems();
        moveIndicator();
        updateArrows();
    };

    const scrollStrip = function (direction) {
        const strip = box.strip.elem;
        const amount = Math.max(80, Math.round(strip.clientWidth * 0.6)) * direction;
        if (strip.scrollBy) strip.scrollBy({ left: amount, behavior: "smooth" });
        else strip.scrollLeft += amount;
    };

    const focusItem = function (item) {
        if (!item) return;
        items.forEach(function (i) { i.group.elem.tabIndex = (i === item) ? 0 : -1; });
        item.group.elem.focus({ preventScroll: true });
        item.group.elem.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    const onTabKeyDown = function (item, event) {

        if (box.enabled != 1) return;
        const key = event.key;
        const enabled = getEnabledItems();
        const index = enabled.indexOf(item);
        const prevKey = (isVertical) ? "ArrowUp" : "ArrowLeft";
        const nextKey = (isVertical) ? "ArrowDown" : "ArrowRight";

        if (key === prevKey || key === nextKey) {
            event.preventDefault();
            if (!enabled.length) return;
            const next = (key === nextKey) ? (index + 1) % enabled.length : (index - 1 + enabled.length) % enabled.length;
            focusItem(enabled[next]);
        } else if (key === "Home" || key === "End") {
            event.preventDefault();
            focusItem((key === "Home") ? enabled[0] : enabled[enabled.length - 1]);
        } else if (key === "Enter" || key === " ") {
            event.preventDefault();
            box.setValue(item.tab.key);
        } else if (key === "Delete" && isClosable(item.tab)) {
            event.preventDefault();
            const enabledIndex = index;
            closeItem(item);
            const rest = getEnabledItems();
            if (rest.length) focusItem(rest[Math.min(enabledIndex, rest.length - 1)]);
        }

    };

    // Close (x): onClose can return false to keep the tab.
    const closeItem = function (item) {
        if (box.onClose(box, item.tab) === false) return;
        box.removeTab(item.tab.key);
    };

    const applyTabIndex = function () {
        // Roving tabindex: only the active tab (or the first enabled) is in the Tab order.
        const active = findItem(box.value);
        const first = getEnabledItems()[0];
        items.forEach(function (item) { item.group.elem.tabIndex = (item === (active || first)) ? 0 : -1; });
    };

    // Creates the objects of one tab in the strip.
    const createItem = function (tab) {

        // WHY: setDefaultContainerBox() is not in the start/end list of basic.js. It is set again for every tab.
        setDefaultContainerBox(box.stripInner);

        // GROUP: Tab
        const group = HGroup({
            width: (isVertical || box.fullWidth == 1) ? "100%" : "auto",
            height: "auto",
            align: (isVertical) ? "left center" : "center center",
            gap: _s.tab.gap,
            padding: _s.tab.padding,
            round: _s.tab.round,
            color: "transparent",
            clickable: 1,
        });
        group.elem.id = id + "-tab-" + Tabs.toId(tab.key);
        group.elem.style.minHeight = _s.tab.minHeight + "px";
        group.elem.style.flexShrink = "0";
        group.elem.style.transition = "background-color 0.15s";
        group.elem.style.outline = "none";
        group.elem.style.boxSizing = "border-box";
        group.elem.style.whiteSpace = "nowrap";
        group.elem.setAttribute("role", "tab");
        if (box.panels == 1) group.elem.setAttribute("aria-controls", id + "-panel-" + Tabs.toId(tab.key));
        if (box.fullWidth == 1 && !isVertical) group.elem.style.flex = "1 1 0";

            // ICON:
            let icon = null;
            if (tab.iconFile) {
                icon = Icon({ width: _s.icon.size, height: _s.icon.size });
                icon.load(tab.iconFile);
                icon.elem.alt = "";
                icon.elem.style.flexShrink = "0";
                icon.elem.style.transition = "opacity 0.15s";
                icon.elem.setAttribute("aria-hidden", "true");
            }

            // LABEL: Text
            const label = Label({ text: Tabs.escapeHtml(tab.text), fontSize: _s.tab.fontSize, textColor: _s.tab.textColor });
            label.elem.style.transition = "color 0.15s";
            label.elem.style.whiteSpace = "nowrap";
            label.elem.style.overflow = "hidden";
            label.elem.style.textOverflow = "ellipsis";
            label.elem.style.minWidth = "0";
            if (isVertical) label.elem.style.flex = "1 1 auto";

            // LABEL: Count
            const countLabel = Label({ text: "", fontSize: _s.count.fontSize, textColor: _s.count.textColor, color: _s.count.color, round: _s.count.round, padding: _s.count.padding, visible: 0 });
            countLabel.elem.style.flexShrink = "0";
            countLabel.elem.style.lineHeight = "1.4";
            countLabel.elem.style.transition = "background-color 0.15s, color 0.15s";

            // BOX: Badge dot
            const badgeDot = Box({ width: _s.badge.size, height: _s.badge.size, color: _s.badge.color, round: _s.badge.size, visible: 0 });
            badgeDot.elem.style.flexShrink = "0";
            badgeDot.elem.setAttribute("aria-label", "New");

            // LABEL: Close (x)
            const closeButton = Label({ text: Tabs.getCloseSvg(_s.close.color, _s.close.size), width: _s.close.size, height: _s.close.size, clickable: 1, visible: 0 });
            closeButton.elem.style.flexShrink = "0";
            closeButton.elem.style.lineHeight = "0";
            closeButton.elem.style.cursor = "pointer";
            closeButton.elem.style.borderRadius = "3px";
            closeButton.elem.setAttribute("role", "button");
            closeButton.elem.setAttribute("aria-label", "Close " + tab.text);
            closeButton.elem.setAttribute("tabindex", "-1");
            if (isVertical) closeButton.elem.style.marginLeft = "auto";

        endGroup();

        // WHY: The indicator must stay under the tabs. It was created first, so the tabs are painted over it.

        const item = { tab: tab, group: group, label: label, countLabel: countLabel, badgeDot: badgeDot, closeButton: closeButton, icon: icon, hover: 0, panel: null };

        group.on("click", function () {
            if (box.enabled != 1 || tab.disabled) return;
            box.setValue(tab.key);
            focusItem(item);
        });
        group.on("mouseenter", function () { item.hover = 1; paintItem(item); });
        group.on("mouseleave", function () { item.hover = 0; paintItem(item); });
        group.on("keydown", function (self, event) { onTabKeyDown(item, event); });
        group.on("focus", function () { group.elem.style.boxShadow = "inset 0 0 0 2px " + _s.focus.outlineColor; });
        group.on("blur", function () { group.elem.style.boxShadow = "none"; });
        group.on("mousedown", function () { group.elem.style.boxShadow = "none"; }); // WHY: No focus ring for mouse clicks.

        closeButton.on("mouseenter", function () { closeButton.text = Tabs.getCloseSvg(_s.close.hoverColor, _s.close.size); });
        closeButton.on("mouseleave", function () { closeButton.text = Tabs.getCloseSvg(_s.close.color, _s.close.size); });
        closeButton.on("click", function (self, event) {
            event.stopPropagation();
            if (box.enabled != 1) return;
            closeItem(item);
        });
        // Middle mouse button closes a closable tab (like a browser).
        group.on("auxclick", function (self, event) {
            if (event.button === 1 && isClosable(tab) && box.enabled == 1) { event.preventDefault(); closeItem(item); }
        });

        // PANEL:
        if (box.panels == 1) {
            setDefaultContainerBox(box.panelsBox);
            item.panel = Box({
                width: "100%",
                height: (box.panelHeight === "auto") ? "auto" : "100%",
                color: _s.panel.color,
                round: _s.panel.round,
                border: _s.panel.border,
                borderColor: _s.panel.borderColor,
                visible: 0,
                position: "relative",
            });
            item.panel.elem.id = id + "-panel-" + Tabs.toId(tab.key);
            item.panel.elem.setAttribute("role", "tabpanel");
            item.panel.elem.setAttribute("aria-labelledby", group.elem.id);
            item.panel.elem.style.boxSizing = "border-box";
            item.panel.elem.style.padding = _s.panel.padding[1] + "px " + _s.panel.padding[0] + "px";
            if (box.panelHeight !== "auto") { item.panel.elem.style.position = "absolute"; item.panel.elem.style.left = "0px"; item.panel.elem.style.top = "0px"; item.panel.elem.style.overflow = "auto"; }
        }

        applyItemContent(item);
        return item;

    };

    // Applies text, count, badge, close and disabled of the tab data to the objects.
    const applyItemContent = function (item) {
        const tab = item.tab;
        item.label.text = Tabs.escapeHtml(tab.text);
        item.group.elem.setAttribute("aria-label", tab.text);
        const hasCount = (tab.count !== undefined && tab.count !== null && tab.count !== "");
        item.countLabel.text = (hasCount) ? Tabs.escapeHtml(tab.count) : "";
        item.countLabel.visible = (hasCount) ? 1 : 0;
        item.badgeDot.visible = (tab.badge == 1 || tab.badge === true) ? 1 : 0;
        item.closeButton.visible = (isClosable(tab)) ? 1 : 0;
        item.closeButton.elem.setAttribute("aria-label", "Close " + tab.text);
        if (item.icon && tab.iconFile && item.icon._loadedFile !== tab.iconFile) { item.icon.load(tab.iconFile); item.icon._loadedFile = tab.iconFile; }
        paintItem(item);
    };

    const removeItemObjects = function (item) {
        item.group.remove();
        if (item.panel) item.panel.remove();
    };

    const pickValue = function (value) {
        const item = (value !== null && value !== undefined) ? findItem(value) : null;
        if (item && !item.tab.disabled) return item.tab.key;
        const first = getEnabledItems()[0];
        return (first) ? first.tab.key : null;
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called.
    box.setValue = function (value, silent = 0) {
        const item = findItem(value);
        if (!item || item.tab.disabled) return 0;
        if (box.value === value) return 1;
        box.previousValue = box.value;
        box.value = value;
        update();
        updatePanels();
        applyTabIndex();
        scrollToActive();
        if (!silent) box.onChange(box);
        return 1;
    };
    // USAGE: tabs.setValue("open") // Returns 1 when the tab exists and is enabled.

    box.getValue = function () {
        return box.value;
    };

    box.getActiveTab = function () {
        const item = findItem(box.value);
        return (item) ? item.tab : null;
    };
    // USAGE: tabs.getActiveTab() // { key, text, count, ... }

    box.getTab = function (key) {
        const item = findItem(key);
        return (item) ? item.tab : null;
    };

    box.getTabs = function () {
        return items.map(function (item) { return item.tab; });
    };

    box.getIndex = function (key = box.value) {
        return items.findIndex(function (item) { return item.tab.key === key; });
    };
    // USAGE: tabs.getIndex() // Index of the active tab

    // Replaces all tabs. The active tab is kept when it still exists.
    box.setTabs = function (tabs, silent = 1) {
        const oldValue = box.value;
        items.forEach(removeItemObjects);
        items = [];
        Tabs.normalizeTabs(tabs).forEach(function (tab) { items.push(createItem(tab)); });
        box.tabs = box.getTabs();
        box.value = pickValue(oldValue);
        indicatorReady = 0;
        box.indicator.setMotionNow("none");
        update();
        updatePanels();
        applyTabIndex();
        if (!silent && box.value !== oldValue) { box.previousValue = oldValue; box.onChange(box); }
    };
    // USAGE: tabs.setTabs(["A", "B", { key: "c", text: "C", count: 3 }])

    // index: Position of the new tab. (Default: the end)
    box.addTab = function (tab, index = -1, silent = 1) {
        tab = Tabs.normalizeTabs([tab])[0];
        if (findItem(tab.key)) { console.warn("Tabs: A tab with this key exists: " + tab.key); return null; }
        const item = createItem(tab);
        if (index >= 0 && index < items.length) {
            box.stripInner.elem.insertBefore(item.group.elem, items[index].group.elem);
            if (item.panel) box.panelsBox.elem.insertBefore(item.panel.elem, items[index].panel.elem);
            items.splice(index, 0, item);
        } else {
            items.push(item);
        }
        box.tabs = box.getTabs();
        if (box.value === null) box.value = pickValue(null);
        update();
        updatePanels();
        applyTabIndex();
        if (!silent && box.value === tab.key) box.onChange(box);
        return tab;
    };
    // USAGE: tabs.addTab({ key: "new", text: "New", closable: 1 }) // Returns the tab data.

    // When the active tab is removed, the next tab (or the previous one) becomes active.
    box.removeTab = function (key, silent = 0) {
        const index = box.getIndex(key);
        if (index < 0) return 0;
        const wasActive = (box.value === key);
        removeItemObjects(items[index]);
        items.splice(index, 1);
        box.tabs = box.getTabs();
        if (wasActive) {
            const enabled = getEnabledItems();
            const after = items.slice(index).find(function (item) { return !item.tab.disabled; });
            const before = items.slice(0, index).reverse().find(function (item) { return !item.tab.disabled; });
            const next = after || before || enabled[0] || null;
            box.previousValue = key;
            box.value = (next) ? next.tab.key : null;
        }
        update();
        updatePanels();
        applyTabIndex();
        if (wasActive && !silent) box.onChange(box);
        return 1;
    };
    // USAGE: tabs.removeTab("new")

    // Changes some fields of a tab. USAGE: tabs.updateTab("open", { text: "Open orders", count: 5 })
    box.updateTab = function (key, changes) {
        const item = findItem(key);
        if (!item) return 0;
        Object.assign(item.tab, changes || {});
        item.tab.disabled = (item.tab.disabled == 1 || item.tab.disabled === true) ? 1 : 0;
        if (changes && changes.iconFile !== undefined && !item.icon) console.warn("Tabs: An icon can only be changed on a tab that was created with an iconFile.");
        applyItemContent(item);
        if (item.tab.disabled && box.value === key) { box.value = pickValue(null); updatePanels(); }
        update();
        applyTabIndex();
        return 1;
    };

    box.setCount = function (key, count) {
        return box.updateTab(key, { count: count });
    };
    // USAGE: tabs.setCount("open", 12) // tabs.setCount("open", "") removes the count

    box.setBadge = function (key, badge = 1) {
        return box.updateTab(key, { badge: (badge == 1 || badge === true) ? 1 : 0 });
    };
    // USAGE: tabs.setBadge("done") / tabs.setBadge("done", 0)

    box.setTabEnabled = function (key, enabled) {
        return box.updateTab(key, { disabled: (enabled == 1 || enabled === true) ? 0 : 1 });
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.style.pointerEvents = (box.enabled == 1) ? "" : "none";
    };
    // USAGE: get: tabs.enabled, set: tabs.setEnabled(0)

    box.getPanel = function (key = box.value) {
        const item = findItem(key);
        return (item) ? item.panel : null;
    };
    // USAGE: const panel = tabs.getPanel("Details") // A Box. (panels: 1)

    // Objects created between startPanel(key) and endPanel() go into the panel of that tab.
    box.startPanel = function (key) {
        const panel = box.getPanel(key);
        if (!panel) { console.error("Tabs: startPanel(): No panel for the key: " + key + ". (panels: 1 is needed.)"); return null; }
        panelStack.push(getDefaultContainerBox());
        if (panel.wrapper) panel.wrapper.remove();
        setDefaultContainerBox(panel);
        panel.wrapper = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
        panel.wrapper.elem.style.alignItems = "stretch";
        return panel.wrapper;
    };
    // USAGE: tabs.startPanel("Details"); Label({ text: "..." }); tabs.endPanel();

    box.endPanel = function () {
        endGroup();
        const previous = panelStack.pop();
        if (previous) setDefaultContainerBox(previous);
    };

    // Updates the indicator and the arrows. (Ex: after the texts or the width changed by code)
    box.refresh = function () {
        update();
    };

    box.focus = function () {
        const item = findItem(box.value) || getEnabledItems()[0];
        if (item) focusItem(item);
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        if (box._fontsHandler) box._fontsHandler.cancelled = 1;
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:
    Tabs.injectCss();
    // WHY: In a column group with "stretch", width: auto would fill the row. fit-content keeps the bar as wide as its tabs.
    if (box.width === "auto") box.elem.style.width = "fit-content";

    const barStyle = (isPill) ? _s.pillBar : _s.bar;

    // GROUP: Root (vertical: bar | panels, horizontal: bar / panels)
    box.contentBox = (isVertical) ? HGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" }) : VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, position: "relative" });
    box.contentBox.elem.style.alignItems = "stretch";

        // GROUP: Bar row (arrow, strip, arrow, add)
        box.barRow = (isVertical) ? VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 }) : HGroup({ width: "100%", height: "auto", align: "left center", gap: 0 });
        box.barRow.elem.style.alignItems = (isVertical) ? "stretch" : "center";
        box.barRow.elem.style.flexShrink = "0";
        if (isVertical) box.barRow.elem.style.width = (box.panels == 1) ? box.barWidth + "px" : "100%";
        box.barRow.elem.style.minWidth = "0";

            // LABEL: Left arrow
            box.leftArrow = Label({ text: Tabs.getArrowSvg("left", _s.arrow.color, _s.arrow.size), width: _s.arrow.size + 8, height: _s.arrow.size + 8, clickable: 1, round: 4 });
            box.leftArrow.elem.style.lineHeight = "0";
            box.leftArrow.elem.style.display = "flex";
            box.leftArrow.elem.style.alignItems = "center";
            box.leftArrow.elem.style.justifyContent = "center";
            box.leftArrow.elem.style.flexShrink = "0";
            box.leftArrow.elem.style.cursor = "pointer";
            box.leftArrow.elem.setAttribute("aria-label", "Scroll left");

            // BOX: Strip (scrolls)
            box.strip = startBox({
                width: (isVertical) ? "100%" : "auto",
                height: "auto",
                color: barStyle.color,
                round: barStyle.round,
                border: (isPill) ? barStyle.border : 0,
                borderColor: (isPill) ? barStyle.borderColor : "transparent",
            });
            box.strip.elem.classList.add("tabs-strip");
            box.strip.elem.style.boxSizing = "border-box";
            if (isVertical) {
                box.strip.elem.style.overflowY = "auto";
                if (!isPill) box.strip.elem.style.borderLeft = _s.bar.dividerWidth + "px solid " + _s.bar.dividerColor;
            } else {
                box.strip.elem.style.flex = "1 1 0";
                box.strip.elem.style.minWidth = "0";
                box.strip.elem.style.overflowX = "auto";
                box.strip.elem.style.overflowY = "hidden";
                if (!isPill) box.strip.elem.style.borderBottom = _s.bar.dividerWidth + "px solid " + _s.bar.dividerColor;
            }

                // GROUP: Strip inner (indicator + tabs)
                box.stripInner = (isVertical) ? VGroup({ width: "100%", height: "auto", align: "left top", gap: barStyle.gap, padding: barStyle.padding, position: "relative" }) : HGroup({ width: (box.fullWidth == 1) ? "100%" : "auto", height: "auto", align: "left center", gap: barStyle.gap, padding: barStyle.padding, position: "relative" });
                box.stripInner.elem.style.boxSizing = "border-box";
                if (isVertical) box.stripInner.elem.style.alignItems = "stretch";
                // WHY: With width: auto the inner group stays as wide as the strip and the extra tabs are clipped. max-content grows with the tabs, so the strip can scroll.
                if (!isVertical && box.fullWidth != 1) box.stripInner.elem.style.width = "max-content";
                box.stripInner.elem.setAttribute("role", "tablist");
                box.stripInner.elem.setAttribute("aria-label", box.ariaLabel);
                if (isVertical) box.stripInner.elem.setAttribute("aria-orientation", "vertical");

                    // BOX: Indicator (under the active tab)
                    box.indicator = Box({
                        left: 0,
                        top: 0,
                        width: 0,
                        height: (isPill) ? 0 : _s.indicator.thickness,
                        color: (isPill) ? _s.pillIndicator.color : _s.indicator.color,
                        round: (isPill) ? _s.pillIndicator.round : _s.indicator.round,
                        opacity: 0,
                    });
                    box.indicator.elem.style.position = "absolute";
                    box.indicator.elem.style.pointerEvents = "none";
                    if (isPill) box.indicator.elem.style.boxShadow = _s.pillIndicator.shadow;

                endGroup();

            endBox();

            // LABEL: Right arrow
            box.rightArrow = Label({ text: Tabs.getArrowSvg("right", _s.arrow.color, _s.arrow.size), width: _s.arrow.size + 8, height: _s.arrow.size + 8, clickable: 1, round: 4 });
            box.rightArrow.elem.style.lineHeight = "0";
            box.rightArrow.elem.style.display = "flex";
            box.rightArrow.elem.style.alignItems = "center";
            box.rightArrow.elem.style.justifyContent = "center";
            box.rightArrow.elem.style.flexShrink = "0";
            box.rightArrow.elem.style.cursor = "pointer";
            box.rightArrow.elem.setAttribute("aria-label", "Scroll right");

            // LABEL: Add (+)
            box.addTabButton = Label({ text: Tabs.getPlusSvg(_s.addButton.color, _s.addButton.size), width: _s.addButton.size + 12, height: _s.addButton.size + 12, clickable: 1, round: 6 });
            box.addTabButton.elem.style.lineHeight = "0";
            box.addTabButton.elem.style.display = "flex";
            box.addTabButton.elem.style.alignItems = "center";
            box.addTabButton.elem.style.justifyContent = "center";
            box.addTabButton.elem.style.flexShrink = "0";
            box.addTabButton.elem.style.cursor = "pointer";
            box.addTabButton.elem.style.marginLeft = (isVertical) ? "0px" : "4px";
            box.addTabButton.elem.style.transition = "background-color 0.15s";
            box.addTabButton.elem.setAttribute("role", "button");
            box.addTabButton.elem.setAttribute("aria-label", "Add");
            box.addTabButton.elem.tabIndex = 0;

        endGroup();

        // BOX: Panels area
        if (box.panels == 1) {
            box.panelsBox = Box({
                width: (isVertical) ? "auto" : "100%",
                height: (box.panelHeight === "auto") ? "auto" : box.panelHeight,
                color: "transparent",
                position: "relative",
            });
            if (isVertical) { box.panelsBox.elem.style.flex = "1 1 0"; box.panelsBox.elem.style.minWidth = "0"; }
        }

    endGroup();

    // WHY: visible: 0 at create time would be undone by display = "flex" above. Hide them after the display type is set.
    box.leftArrow.visible = 0;
    box.rightArrow.visible = 0;
    box.addTabButton.visible = (box.addButton == 1) ? 1 : 0;

    // *** OBJECT INIT CODE:

    box.leftArrow.on("click", function () { scrollStrip(-1); });
    box.rightArrow.on("click", function () { scrollStrip(1); });
    box.strip.on("scroll", updateArrows);
    // Mouse wheel: vertical wheel scrolls the strip sideways.
    box.strip.on("wheel", function (self, event) {
        if (isVertical) return;
        const strip = box.strip.elem;
        if (strip.scrollWidth <= strip.clientWidth + 1) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        strip.scrollLeft += event.deltaY;
    });

    box.addTabButton.on("mouseenter", function () { box.addTabButton.color = _s.addButton.hoverBackground; box.addTabButton.text = Tabs.getPlusSvg(_s.addButton.hoverColor, _s.addButton.size); });
    box.addTabButton.on("mouseleave", function () { box.addTabButton.color = "transparent"; box.addTabButton.text = Tabs.getPlusSvg(_s.addButton.color, _s.addButton.size); });
    box.addTabButton.on("click", function () { if (box.enabled == 1) box.onAdd(box); });
    box.addTabButton.on("keydown", function (self, event) { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (box.enabled == 1) box.onAdd(box); } });

    // The indicator follows size changes (texts, fonts, window).
    box.stripInner.onResize(function () { moveIndicator(); updateArrows(); });
    box.onResize(function () { moveIndicator(); updateArrows(); });
    if (document.fonts && document.fonts.ready) {
        box._fontsHandler = { cancelled: 0 };
        const handler = box._fontsHandler;
        document.fonts.ready.then(function () { if (!handler.cancelled && box) { moveIndicator(); updateArrows(); } });
    }

    Tabs.normalizeTabs(startTabs).forEach(function (tab) { items.push(createItem(tab)); });
    box.tabs = box.getTabs();
    box.value = pickValue(startValue);
    box.setEnabled(box.enabled);
    update();
    updatePanels();
    applyTabIndex();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

Tabs._counter = 1;

// "Orders" -> { key: "Orders", text: "Orders", iconFile: "", count: null, badge: 0, disabled: 0, closable: undefined }
Tabs.normalizeTabs = function (tabs) {
    return (tabs || []).map(function (tab) {
        if (tab === null || typeof tab !== "object") {
            return { key: tab, text: String(tab), iconFile: "", count: null, badge: 0, disabled: 0 };
        }
        const result = { ...tab };
        result.key = (tab.key !== undefined) ? tab.key : tab.text;
        result.text = String(tab.text ?? tab.key);
        result.iconFile = tab.iconFile || "";
        result.count = (tab.count !== undefined) ? tab.count : null;
        result.badge = (tab.badge == 1 || tab.badge === true) ? 1 : 0;
        result.disabled = (tab.disabled == 1 || tab.disabled === true) ? 1 : 0;
        return result;
    });
};

// Element id from a key. "Open orders" -> "Open-orders"
Tabs.toId = function (key) {
    return String(key).replace(/[^\w-]/g, "-");
};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Tabs.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

Tabs.getCloseSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
};

Tabs.getPlusSvg = function (color, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
};

Tabs.getArrowSvg = function (direction, color, size) {
    const path = (direction === "left") ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
};

// The scroll bar of the strip can not be hidden with inline styles.
Tabs.injectCss = function () {
    if (document.getElementById("tabs-css")) return;
    const style = document.createElement("style");
    style.id = "tabs-css";
    style.textContent =
        ".tabs-strip { scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth; }" +
        ".tabs-strip::-webkit-scrollbar { display: none; }";
    document.head.appendChild(style);
};

// *** STYLE PACKAGES:
// USAGE: Tabs({ styleName: "modern" })
// USAGE: Tabs({ styleName: "dark", style: { indicator: { color: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: Tabs.styles.myStyle = { indicator: { color: "red" } };
Tabs.styles = {

    // Dark text and a dark line on a light page.
    classic: TabsDefaults.style,

    // Cadetblue, same colors as the modern CheckBox, RadioButton, ProgressBar and TagInput.
    modern: {
        bar: { color: "transparent", padding: [0, 0], gap: 6, round: 0, dividerColor: "#D9DADB", dividerWidth: 1 },
        pillBar: { color: "#DFECEC", padding: [4, 4], gap: 2, round: 100, border: 0, borderColor: "transparent" },
        tab: { fontSize: 15, textColor: Black(0.5), padding: [16, 10], round: 100, gap: 8, minHeight: 42 },
        tabHover: { color: "#EEF5F5", textColor: "#2F5F61" },
        tabActive: { color: "transparent", textColor: "cadetblue" },
        pillActive: { textColor: White(1) },
        tabDisabled: { opacity: 0.4 },
        indicator: { color: "cadetblue", thickness: 3, round: 3, motion: 0.25 },
        pillIndicator: { color: "cadetblue", round: 100, shadow: "none", motion: 0.25 },
        icon: { size: 16 },
        count: { fontSize: 11, color: "#DFECEC", textColor: "#2F5F61", activeColor: "cadetblue", activeTextColor: White(1), round: 10, padding: [7, 1] },
        badge: { color: "tomato", size: 7 },
        close: { color: Black(0.35), hoverColor: "tomato", size: 14 },
        addButton: { color: "cadetblue", hoverColor: "#2F5F61", hoverBackground: "#EEF5F5", size: 16 },
        arrow: { color: "cadetblue", background: White(1), size: 16 },
        focus: { outlineColor: Black(0) },
        panel: { color: "transparent", padding: [0, 16], round: 0, border: 0, borderColor: "transparent" },
        disabled: { opacity: 0.5 },
    },

    // Dark theme, same colors as SelectBox.DARK_STYLE and TagInput "dark".
    dark: {
        bar: { color: "transparent", padding: [0, 0], gap: 4, round: 0, dividerColor: "rgba(255, 255, 255, 0.10)", dividerWidth: 1 },
        pillBar: { color: "rgba(255, 255, 255, 0.06)", padding: [4, 4], gap: 2, round: 8, border: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
        tab: { fontSize: 14, textColor: "rgba(255, 255, 255, 0.55)", padding: [14, 10], round: 6, gap: 8, minHeight: 40 },
        tabHover: { color: "rgba(255, 255, 255, 0.05)", textColor: "rgba(255, 255, 255, 0.85)" },
        tabActive: { color: "transparent", textColor: "#FFFFFF" },
        pillActive: { textColor: "#FFFFFF" },
        tabDisabled: { opacity: 0.35 },
        indicator: { color: "#65A293", thickness: 2, round: 2, motion: 0.25 },
        pillIndicator: { color: "#3D7A6B", round: 6, shadow: "none", motion: 0.25 },
        icon: { size: 16 },
        count: { fontSize: 11, color: "rgba(255, 255, 255, 0.10)", textColor: "rgba(255, 255, 255, 0.7)", activeColor: "#65A293", activeTextColor: "#FFFFFF", round: 10, padding: [6, 1] },
        badge: { color: "#E66767", size: 7 },
        close: { color: "rgba(255, 255, 255, 0.45)", hoverColor: "#E66767", size: 14 },
        addButton: { color: "rgba(255, 255, 255, 0.55)", hoverColor: "#FFFFFF", hoverBackground: "rgba(255, 255, 255, 0.08)", size: 16 },
        arrow: { color: "rgba(255, 255, 255, 0.6)", background: "#232322", size: 16 },
        focus: { outlineColor: White(0) },
        panel: { color: "transparent", padding: [0, 16], round: 0, border: 0, borderColor: "transparent" },
        disabled: { opacity: 0.4 },
    },

};
