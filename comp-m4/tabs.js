/* Bismillah */

/*

Tabs - v26.10

UI COMPONENT TEMPLATE
- A tab bar: one tab is active, the others can be clicked. An animated indicator moves to the active tab.
- Variants: "underline" (a line under the active tab, default) and "pill" (a filled shape behind the active tab,
  like a segmented control).
- Tabs can have an icon, a count ("Orders 12"), a badge dot (something new), and can be disabled or closable (x).
- Add button ("+") at the end of the bar (addButton: 1) -> onAdd.
- Many tabs: the bar scrolls sideways (the scroll bar is hidden), arrow buttons appear at the sides, the mouse wheel scrolls
  and the active tab is scrolled into view.
- fullWidth: 1 -> the tabs share the bar width equally.
- vertical: 1 -> the tabs are stacked (Ex: settings sections). The indicator is on the left side.
- panels: 1 -> a content Box for every tab under the bar. Only the active one is shown.
  Fill a panel with setPanelContent(key, fn) or startPanel(key) ... endPanel(), or get it with getPanel(key).
- Keyboard: ArrowLeft / ArrowRight (ArrowUp / ArrowDown when vertical), Home, End move between the tabs. Enter / Space
  activates, Delete closes a closable tab. Tab key moves the focus out of the bar (roving tabindex).
- Accessibility: tablist / tab / tabpanel roles, aria-selected, aria-controls.
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- Style packages: "classic" (default), "modern", "dark". Select with styleName. (Tabs.styles)
- Everything is drawn with code (no image files needed).

TAB: { key, text, iconFile, count, badge, disabled, closable, selectedColor, selectedTextColor, selectedIconFile }
- selectedColor: Indicator color when the tab is active. (pill: the shape, underline: the line)
- selectedTextColor: Text color when the tab is active.
- selectedIconFile: Icon when the tab is active. (Ex: a filled version of the icon)
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
pages.setPanelContent("History", function () {
    Label({ text: "History content" });
});

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
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: "auto",
    height: "auto",
    tabs: [], // [{ key, text, iconFile, count, badge, disabled, closable, selectedColor, selectedTextColor, selectedIconFile }] or ["A", "B"]
    value: null, // Key of the active tab. null: the first enabled tab.
    variant: "underline", // "underline", "pill" (Only at create time)
    vertical: 0, // 1: Tabs are stacked. (Only at create time)
    fullWidth: 0, // 1: Tabs share the bar width equally. (Only at create time)
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
            passiveOpacity: 0.7, // Icon of a passive tab. (Active or hover: 1)
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
            round: 3,
        },
        addButton: {
            color: Black(0.5),
            hoverColor: "#141414",
            hoverBackground: Black(0.05),
            size: 16,
            padding: 6, // Around the icon. (The button: size + 2 * padding)
            round: 6,
        },
        arrow: {
            color: Black(0.5),
            background: White(1),
            size: 16,
            padding: 4,
            round: 4,
        },
        focus: {
            outlineColor: Black(0), // Ring around the focused tab (keyboard). Hidden by default. Ex: Black(0.1)
            ringWidth: 2,
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
    basic.applyStylePackage(params, Tabs.styles, TabsDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TabsDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    const initialTabs = params.tabs;
    const initialValue = params.value;
    params.tabs = [];
    params.value = null;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const id = "tabs-" + (Tabs._counter++);
    const isPill = (box.variant === "pill");
    const isVertical = basic.isOn(box.vertical);
    const hasPanels = basic.isOn(box.panels);
    const isFullWidth = basic.isOn(box.fullWidth);
    let items = []; // [{ tab, group, label, countLabel, badgeDot, closeButton, icon, panel, isHovered }]
    let panelStack = []; // startPanel() / endPanel()
    let isIndicatorReady = 0;
    const SCROLL_SPACE_X = 24; // Space next to the active tab when the strip scrolls to it.
    const SCROLL_SPACE_Y = 8;
    const ARROW_PASSIVE_OPACITY = 0.3; // An arrow that can not scroll more.
    const SCROLL_STEP_RATIO = 0.6; // An arrow click scrolls 60% of the strip,
    const MIN_SCROLL_STEP = 80; // but at least this.
    const FADE_TIME = "0.15s"; // The color and opacity changes of hover and active.
    const ADD_BUTTON_SPACE = 4; // Between the strip and the add button.

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    // NOTE: Default values are also public variables. (box.tabs, box.value, box.enabled)

    // *** PRIVATE FUNCTIONS:
    // NOTE: An "item" holds the objects of one tab (group, label...), item.tab is its data.

    // DRAWING: each function does one job, and a change calls only the one it needs:
    // createTabs()      -> all the tabs are made again from the data           (setTabs)
    // createTab()       -> one tab: its view, events, panel and content         (addTab)
    // applyTabContent() -> the text, count, badge and close button of one tab   (updateTab)
    // paintTab()        -> the look of one tab (active, hover, disabled)         (the mouse on it)
    // showActiveTab()   -> after box.value or the list changed: the look of all the tabs, the indicator,
    //                      the active panel and the Tab order                     (setValue, add, remove...)
    // refreshLayout()   -> the indicator and the arrows follow the sizes          (resize, fonts)
    // drawAll()         -> the content of every tab + showActiveTab()            (box.refresh)

    const findItem = function (key) {
        return items.find(function (item) { return item.tab.key === key; }) || null;
    };

    const getEnabledItems = function () {
        return items.filter(function (item) { return !item.tab.disabled; });
    };

    const isClosable = function (tab) {
        if (basic.isOn(tab.closable)) return true;
        const closedByTab = (tab.closable === 0 || tab.closable === false);
        return basic.isOn(box.closable) && !closedByTab;
    };

    // The key of a tab that can be active: the given one, or the first enabled tab.
    const resolveActiveKey = function (key) {
        const item = (key !== null && key !== undefined) ? findItem(key) : null;
        if (item && !item.tab.disabled) return item.tab.key;
        const firstItem = getEnabledItems()[0];
        return (firstItem) ? firstItem.tab.key : null;
    };

    // PAINT: the look of one tab (active, hover, disabled)

    const getTabColor = function (isActive, isHovered) {
        if (isActive && isPill) return "transparent"; // WHY: The pill indicator is the background.
        if (isActive) return _s.tabActive.color;
        if (isHovered) return _s.tabHover.color;
        return "transparent";
    };

    const getTabTextColor = function (tab, isActive, isHovered) {
        const activeStyle = (isPill) ? _s.pillActive : _s.tabActive;
        if (isActive) return tab.selectedTextColor || activeStyle.textColor;
        if (isHovered) return _s.tabHover.textColor;
        return _s.tab.textColor;
    };

    const paintIcon = function (item, isActive, isHovered) {
        const tab = item.tab;
        const iconFile = (isActive && tab.selectedIconFile) ? tab.selectedIconFile : tab.iconFile;
        item.icon.opacity = (isActive || isHovered) ? 1 : _s.icon.passiveOpacity;
        item.icon.visible = (iconFile) ? 1 : 0;
        if (!iconFile || item.icon._loadedFile === iconFile) return;
        item.icon.load(iconFile);
        item.icon._loadedFile = iconFile;
    };

    const paintTab = function (item) {

        const tab = item.tab;
        const isActive = (tab.key === box.value);
        const isHovered = item.isHovered && !isActive && !tab.disabled;

        item.group.color = getTabColor(isActive, isHovered);
        item.group.opacity = (tab.disabled) ? _s.tabDisabled.opacity : 1;
        item.group.cursor = (tab.disabled) ? "default" : "pointer";
        item.label.textColor = getTabTextColor(tab, isActive, isHovered);

        item.group.aria = { selected: isActive, disabled: basic.isOn(tab.disabled) };

        item.countLabel.color = (isActive) ? _s.count.activeColor : _s.count.color;
        item.countLabel.textColor = (isActive) ? _s.count.activeTextColor : _s.count.textColor;

        if (item.icon) paintIcon(item, isActive, isHovered);

    };

    const paintTabs = function () {
        items.forEach(paintTab);
    };

    // LAYOUT: the indicator and the arrows follow the sizes of the tabs.

    // Moves the indicator to the active tab.
    const moveIndicator = function () {

        const item = findItem(box.value);
        const indicator = box.indicator;

        if (!item || item.group.visible != 1) {
            indicator.opacity = 0;
            return;
        }

        const tabElement = item.group.elem;
        const thickness = _s.indicator.thickness;

        if (isPill) {
            indicator.left = tabElement.offsetLeft;
            indicator.top = tabElement.offsetTop;
            indicator.width = tabElement.offsetWidth;
            indicator.height = tabElement.offsetHeight;
        } else if (isVertical) {
            indicator.left = 0;
            indicator.top = tabElement.offsetTop;
            indicator.width = thickness;
            indicator.height = tabElement.offsetHeight;
        } else {
            indicator.left = tabElement.offsetLeft;
            indicator.top = box.stripInner.elem.offsetHeight - thickness;
            indicator.width = tabElement.offsetWidth;
            indicator.height = thickness;
        }

        const indicatorColor = (isPill) ? _s.pillIndicator.color : _s.indicator.color;
        indicator.color = item.tab.selectedColor || indicatorColor;
        indicator.opacity = 1;

        // WHY: The first position must not be animated. (The indicator would fly in from the corner.)
        if (!isIndicatorReady) {
            isIndicatorReady = 1;
            indicator.elem.offsetWidth;
            indicator.setMotionNow(getIndicatorMotion());
        }

    };

    const getIndicatorMotion = function () {
        const seconds = (isPill) ? _s.pillIndicator.motion : _s.indicator.motion;
        if (!seconds) return "none";
        const moving = ["left", "top", "width", "height", "background-color"];
        const motions = moving.map(function (name) { return name + " " + seconds + "s"; });
        return motions.join(", ") + ", opacity " + FADE_TIME;
    };

    // The arrows are shown when the tabs do not fit; an arrow that can not scroll more is pale.
    const paintArrows = function () {

        if (isVertical || box.showArrows === 0 || box.showArrows === "0") return;

        const strip = box.strip.elem;
        const hasOverflow = (strip.scrollWidth > strip.clientWidth + 1);
        box.leftArrow.visible = (hasOverflow) ? 1 : 0;
        box.rightArrow.visible = (hasOverflow) ? 1 : 0;
        if (!hasOverflow) return;

        // WHY: + 1 / - 1: the scroll position can be a fraction of a pixel at the ends.
        const canScrollLeft = (strip.scrollLeft > 1);
        const canScrollRight = (strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1);
        box.leftArrow.opacity = (canScrollLeft) ? 1 : ARROW_PASSIVE_OPACITY;
        box.rightArrow.opacity = (canScrollRight) ? 1 : ARROW_PASSIVE_OPACITY;

    };

    // The indicator and the arrows after a size change (texts, fonts, window).
    const refreshLayout = function () {
        moveIndicator();
        paintArrows();
    };

    const showActivePanel = function () {
        if (!hasPanels) return;
        items.forEach(function (item) {
            item.panel.visible = (item.tab.key === box.value) ? 1 : 0;
        });
    };

    // Roving tabindex: only one tab is in the Tab order (the active one, or the one the arrow keys moved to).
    // WHY: The only place that sets the tabIndex of the tabs: with two places, two tabs could be in the Tab order.
    const makeTabbable = function (tabbableItem) {
        items.forEach(function (item) {
            item.group.tabIndex = (item === tabbableItem) ? 0 : -1;
        });
    };

    // THE ACTIVE TAB IS SHOWN: after box.value or the list of the tabs changed.
    // WHY: One place, so a change can not forget its panel or its place in the Tab order.
    const showActiveTab = function () {
        paintTabs();
        refreshLayout();
        showActivePanel();
        makeTabbable(findItem(box.value));
    };

    // Everything that is shown, from the data of the tabs. (box.refresh)
    const drawAll = function () {
        items.forEach(applyTabContent);
        showActiveTab();
    };

    // WHY: New tabs: the indicator jumps to its first place, it does not fly from the old one.
    const resetIndicator = function () {
        isIndicatorReady = 0;
        box.indicator.setMotionNow("none");
    };

    // SCROLL:

    // Scrolls the strip only as much as needed to show the active tab, with a little space next to it.
    const scrollToActiveTab = function () {

        const item = findItem(box.value);
        if (!item) return;

        const strip = box.strip.elem;
        const tabElement = item.group.elem;

        if (isVertical) {
            const tabTop = tabElement.offsetTop;
            const tabBottom = tabTop + tabElement.offsetHeight;
            const viewBottom = strip.scrollTop + strip.clientHeight;
            if (tabTop < strip.scrollTop) strip.scrollTop = tabTop - SCROLL_SPACE_Y;
            else if (tabBottom > viewBottom) strip.scrollTop = tabBottom - strip.clientHeight + SCROLL_SPACE_Y;
            return;
        }

        const tabLeft = tabElement.offsetLeft;
        const tabRight = tabLeft + tabElement.offsetWidth;
        const viewRight = strip.scrollLeft + strip.clientWidth;
        if (tabLeft < strip.scrollLeft) strip.scrollLeft = tabLeft - SCROLL_SPACE_X;
        else if (tabRight > viewRight) strip.scrollLeft = tabRight - strip.clientWidth + SCROLL_SPACE_X;

    };

    const scrollStrip = function (direction) {
        const strip = box.strip.elem;
        const step = Math.max(MIN_SCROLL_STEP, Math.round(strip.clientWidth * SCROLL_STEP_RATIO));
        const amount = step * direction;
        if (strip.scrollBy) strip.scrollBy({ left: amount, behavior: "smooth" });
        else strip.scrollLeft += amount;
    };

    // KEYBOARD AND ACTIONS:

    const focusTab = function (item) {
        if (!item) return;
        makeTabbable(item);
        item.group.elem.focus({ preventScroll: true });
        item.group.elem.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    // The enabled tab that is step places away. (step: 1 next, -1 previous)
    const getNeighborItem = function (item, step) {
        const enabledItems = getEnabledItems();
        const count = enabledItems.length;
        const index = enabledItems.indexOf(item);
        return enabledItems[(index + step + count) % count]; // WHY: % wraps around at both ends.
    };

    // Delete key: the focus goes to the tab that takes the place of the closed one.
    const closeTabByKeyboard = function (item) {
        const index = getEnabledItems().indexOf(item);
        closeTab(item);
        const remainingItems = getEnabledItems();
        if (!remainingItems.length) return;
        focusTab(remainingItems[Math.min(index, remainingItems.length - 1)]);
    };

    const onTabKeyDown = function (item, event) {

        if (box.enabled != 1) return;
        const key = event.key;
        const enabledItems = getEnabledItems();
        const prevKey = (isVertical) ? "ArrowUp" : "ArrowLeft";
        const nextKey = (isVertical) ? "ArrowDown" : "ArrowRight";

        if (key === prevKey) focusTab(getNeighborItem(item, -1));
        else if (key === nextKey) focusTab(getNeighborItem(item, 1));
        else if (key === "Home") focusTab(enabledItems[0]);
        else if (key === "End") focusTab(enabledItems[enabledItems.length - 1]);
        else if (key === "Enter" || key === " ") box.setValue(item.tab.key);
        else if (key === "Delete" && isClosable(item.tab)) closeTabByKeyboard(item);
        else return; // Another key: the browser keeps it.

        event.preventDefault();

    };

    // Close (x): onClose can return false to keep the tab.
    const closeTab = function (item) {
        if (box.onClose(box, item.tab) === false) return;
        box.removeTab(item.tab.key);
    };

    // The add button (+) does not add a tab: it asks the page with onAdd.
    const requestAddTab = function () {
        if (box.enabled == 1) box.onAdd(box);
    };

    // A small button with an SVG icon: the arrows and the add button. The icon takes the textColor.
    const createIconButton = function (props) {
        return Label({
            text: props.svg,
            width: props.size,
            height: props.size,
            round: props.round,
            textColor: props.color,
            clickable: 1,
            cursor: "pointer",
            shrink: 0,
            lineHeight: "0",
            css: { display: "flex", alignItems: "center", justifyContent: "center" },
            aria: { label: props.ariaLabel },
        });
    };

    // ONE TAB: createTab() = createTabView() + bindTabEvents() + createTabPanel() + applyTabContent()

    // The objects of one tab in the strip. Returns the item.
    const createTabView = function (tab) {

        const item = { tab: tab, icon: null, panel: null, isHovered: 0 };

        // WHY: createIn() puts the container back after it (also on an error). setDefaultContainerBox() did not:
        //      after addTab() / setTabs() of the page, its next objects went into the strip of the tabs.
        createIn(box.stripInner, function () {

            // GROUP: Tab
            item.group = HGroup({
                width: (isVertical || isFullWidth) ? "100%" : "auto",
                height: "auto",
                align: (isVertical) ? "left center" : "center center",
                gap: _s.tab.gap,
                padding: _s.tab.padding,
                round: _s.tab.round,
                color: "transparent",
                clickable: 1,
                shrink: 0,
                css: {
                    minHeight: _s.tab.minHeight + "px",
                    transition: "background-color " + FADE_TIME,
                    outline: "none",
                    boxSizing: "border-box",
                    whiteSpace: "nowrap",
                },
            });
            item.group.elem.id = id + "-tab-" + Tabs.toId(tab.key);
            item.group.role = "tab";
            if (hasPanels) item.group.aria = { controls: id + "-panel-" + Tabs.toId(tab.key) };
            if (isFullWidth && !isVertical) item.group.css.flex = "1 1 0";

                // ICON:
                if (tab.iconFile || tab.selectedIconFile) {
                    item.icon = Icon({
                        width: _s.icon.size,
                        height: _s.icon.size,
                        alt: "",
                        shrink: 0,
                        css: { transition: "opacity " + FADE_TIME },
                    });
                    item.icon.aria = { hidden: true };
                    // WHY: The selected icon is loaded before the first click, so it does not flash in.
                    if (tab.selectedIconFile) (new Image()).src = tab.selectedIconFile;
                }

                // LABEL: Text
                item.label = Label({
                    fontSize: _s.tab.fontSize,
                    textColor: _s.tab.textColor,
                    ellipsis: 1,
                    css: { transition: "color " + FADE_TIME, minWidth: "0" },
                });
                if (isVertical) item.label.css.flex = "1 1 auto";

                // LABEL: Count
                item.countLabel = Label({
                    fontSize: _s.count.fontSize,
                    textColor: _s.count.textColor,
                    color: _s.count.color,
                    round: _s.count.round,
                    padding: _s.count.padding,
                    lineHeight: "1.4",
                    shrink: 0,
                    css: { transition: "background-color " + FADE_TIME + ", color " + FADE_TIME },
                    visible: 0,
                });

                // BOX: Badge dot
                item.badgeDot = Box({
                    width: _s.badge.size,
                    height: _s.badge.size,
                    color: _s.badge.color,
                    round: _s.badge.size,
                    shrink: 0,
                    aria: { label: "New" },
                    visible: 0,
                });

                // LABEL: Close (x)
                item.closeButton = Label({
                    text: Tabs.getCloseSvg("currentColor", _s.close.size),
                    width: _s.close.size,
                    height: _s.close.size,
                    round: _s.close.round,
                    textColor: _s.close.color,
                    clickable: 1,
                    cursor: "pointer",
                    shrink: 0,
                    lineHeight: "0",
                    visible: 0,
                });
                item.closeButton.role = "button";
                item.closeButton.tabIndex = -1; // WHY: Delete closes the focused tab; the x is for the mouse.
                if (isVertical) item.closeButton.css.marginLeft = "auto";

            endGroup();

        });

        // NOTE: The indicator stays under the tabs: it was created first, so the tabs are painted over it.
        return item;

    };

    const bindTabEvents = function (item) {

        const tab = item.tab;
        const group = item.group;
        const focusRing = "inset 0 0 0 " + _s.focus.ringWidth + "px " + _s.focus.outlineColor;

        group.on("click", function () {
            if (box.enabled != 1 || tab.disabled) return;
            box.setValue(tab.key);
            focusTab(item);
        });
        group.onHoverChange(function (self, isOver) {
            item.isHovered = isOver;
            paintTab(item);
        });
        group.on("keydown", function (self, event) { onTabKeyDown(item, event); });
        group.on("focus", function () { group.boxShadow = focusRing; });
        group.on("blur", function () { group.boxShadow = "none"; });
        group.on("mousedown", function () { group.boxShadow = "none"; }); // WHY: No focus ring for mouse clicks.

        // Middle mouse button closes a closable tab (like a browser).
        group.on("auxclick", function (self, event) {
            if (event.button !== 1 || !isClosable(tab) || box.enabled != 1) return;
            event.preventDefault();
            closeTab(item);
        });

        item.closeButton.onHoverChange(function (self, isOver) {
            item.closeButton.textColor = (isOver) ? _s.close.hoverColor : _s.close.color;
        });
        item.closeButton.on("click", function (self, event) {
            event.stopPropagation();
            if (box.enabled != 1) return;
            closeTab(item);
        });

    };

    // The content Box of one tab. (panels: 1)
    const createTabPanel = function (item) {

        if (!hasPanels) return;

        createIn(box.panelsBox, function () {
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
        });

        const panel = item.panel;
        panel.elem.id = id + "-panel-" + Tabs.toId(item.tab.key);
        panel.role = "tabpanel";
        panel.aria = { labelledby: item.group.elem.id };
        panel.css = {
            boxSizing: "border-box",
            padding: _s.panel.padding[1] + "px " + _s.panel.padding[0] + "px",
        };
        // WHY: A fixed height: the panels lie on top of each other and each one scrolls its own content.
        if (box.panelHeight !== "auto") {
            panel.css = { position: "absolute", left: "0px", top: "0px", overflow: "auto" };
        }

    };

    // Applies text, count, badge, close and disabled of the tab data to the objects.
    const applyTabContent = function (item) {
        const tab = item.tab;
        item.label.plainText = tab.text;
        // WHY: An empty label still takes a gap, so the icon of an icon only tab would not be in the middle.
        item.label.visible = (tab.text !== "") ? 1 : 0;
        item.group.aria = { label: tab.text };
        const hasCount = (tab.count !== undefined && tab.count !== null && tab.count !== "");
        item.countLabel.plainText = (hasCount) ? tab.count : "";
        item.countLabel.visible = (hasCount) ? 1 : 0;
        item.badgeDot.visible = basic.isOn(tab.badge) ? 1 : 0;
        item.closeButton.visible = (isClosable(tab)) ? 1 : 0;
        item.closeButton.aria = { label: "Close " + tab.text };
        // NOTE: The look (and the icon) is painted by showActiveTab(), which runs after every change of the content.
    };

    const createTab = function (tab) {
        const item = createTabView(tab);
        bindTabEvents(item);
        createTabPanel(item);
        applyTabContent(item);
        return item;
    };

    const removeTabObjects = function (item) {
        item.group.remove();
        if (item.panel) item.panel.remove();
    };

    // All the tabs are made again. (The objects of the old ones are removed.)
    const createTabs = function (tabs) {
        items.forEach(removeTabObjects);
        items = Tabs.normalizeTabs(tabs).map(createTab);
        box.tabs = box.getTabs();
    };

    // The tab to activate when the active one is removed: the next enabled tab, or the previous one.
    // index: where the removed tab was. (items does not have it any more)
    const findReplacementItem = function (index) {
        const isEnabled = function (item) { return !item.tab.disabled; };
        const nextEnabledItem = items.slice(index).find(isEnabled);
        const previousEnabledItem = items.slice(0, index).reverse().find(isEnabled);
        return nextEnabledItem || previousEnabledItem || null;
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called.
    box.setValue = function (value, silent = 0) {
        const item = findItem(value);
        if (!item || item.tab.disabled) return 0;
        if (box.value === value) return 1;
        box.previousValue = box.value;
        box.value = value;
        showActiveTab();
        scrollToActiveTab();
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
        createTabs(tabs);
        box.value = resolveActiveKey(oldValue);
        resetIndicator();
        showActiveTab();

        if (silent || box.value === oldValue) return;
        box.previousValue = oldValue;
        box.onChange(box);

    };
    // USAGE: tabs.setTabs(["A", "B", { key: "c", text: "C", count: 3 }])

    // index: Position of the new tab. (Default: the end)
    box.addTab = function (tab, index = -1, silent = 1) {

        tab = Tabs.normalizeTabs([tab])[0];
        if (findItem(tab.key)) {
            console.warn("Tabs: A tab with this key exists: " + tab.key);
            return null;
        }

        const item = createTab(tab);
        const isInside = (index >= 0 && index < items.length);
        if (isInside) {
            const itemAfter = items[index];
            box.stripInner.elem.insertBefore(item.group.elem, itemAfter.group.elem);
            if (item.panel) box.panelsBox.elem.insertBefore(item.panel.elem, itemAfter.panel.elem);
            items.splice(index, 0, item);
        } else {
            items.push(item);
        }

        box.tabs = box.getTabs();
        if (box.value === null) box.value = resolveActiveKey(null);
        showActiveTab();

        if (!silent && box.value === tab.key) box.onChange(box);
        return tab;

    };
    // USAGE: tabs.addTab({ key: "new", text: "New", closable: 1 }) // Returns the tab data.

    // When the active tab is removed, the next tab (or the previous one) becomes active.
    box.removeTab = function (key, silent = 0) {

        const index = box.getIndex(key);
        if (index < 0) return 0;

        const wasActive = (box.value === key);
        removeTabObjects(items[index]);
        items.splice(index, 1);
        box.tabs = box.getTabs();

        if (wasActive) {
            const replacementItem = findReplacementItem(index);
            box.previousValue = key;
            box.value = (replacementItem) ? replacementItem.tab.key : null;
        }
        showActiveTab();

        if (wasActive && !silent) box.onChange(box);
        return 1;

    };
    // USAGE: tabs.removeTab("new")

    // Changes some fields of a tab. USAGE: tabs.updateTab("open", { text: "Open orders", count: 5 })
    box.updateTab = function (key, changes) {

        const item = findItem(key);
        if (!item) return 0;

        const fields = changes || {};
        Object.assign(item.tab, fields);
        item.tab.disabled = basic.isOn(item.tab.disabled) ? 1 : 0;

        const changesIcon = (fields.iconFile !== undefined || fields.selectedIconFile !== undefined);
        if (changesIcon && !item.icon) {
            console.warn("Tabs: An icon can only be changed on a tab that was created with an iconFile.");
        }

        applyTabContent(item);
        // NOTE: A disabled tab can not stay active. (No onChange: the page disabled it.)
        if (item.tab.disabled && box.value === key) box.value = resolveActiveKey(null);
        showActiveTab();
        return 1;

    };

    box.setCount = function (key, count) {
        return box.updateTab(key, { count: count });
    };
    // USAGE: tabs.setCount("open", 12) // tabs.setCount("open", "") removes the count

    box.setBadge = function (key, badge = 1) {
        return box.updateTab(key, { badge: basic.isOn(badge) ? 1 : 0 });
    };
    // USAGE: tabs.setBadge("done") / tabs.setBadge("done", 0)

    box.setTabEnabled = function (key, enabled) {
        return box.updateTab(key, { disabled: basic.isOn(enabled) ? 0 : 1 });
    };

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.css.pointerEvents = (box.enabled == 1) ? "" : "none";
    };
    // USAGE: get: tabs.enabled, set: tabs.setEnabled(0)

    box.getPanel = function (key = box.value) {
        const item = findItem(key);
        return (item) ? item.panel : null;
    };
    // USAGE: const panel = tabs.getPanel("Details") // A Box. (panels: 1)

    // Objects created between startPanel(key) and endPanel() go into the panel of that tab.
    // NOTE: The old content of the panel is removed. (The same as setPanelContent)
    box.startPanel = function (key) {
        const panel = box.getPanel(key);
        if (!panel) {
            console.error("Tabs: startPanel(): No panel for the key: " + key + ". (panels: 1 is needed.)");
            return null;
        }
        panelStack.push(getDefaultContainerBox());
        if (panel.wrapper) panel.wrapper.remove();
        setDefaultContainerBox(panel);
        panel.wrapper = VGroup({
            width: "100%",
            height: "auto",
            align: "left top",
            gap: 0,
            position: "relative",
            css: { alignItems: "stretch" },
        });
        return panel.wrapper;
    };
    // USAGE: tabs.startPanel("Details"); Label({ text: "..." }); tabs.endPanel();

    box.endPanel = function () {
        endGroup();
        const previous = panelStack.pop();
        if (previous) setDefaultContainerBox(previous);
    };

    // Replaces the content of a panel with the objects created in createContent(wrapper).
    // WHY: finally: endPanel() runs also on an error, so the next objects of the page do not go into the panel.
    box.setPanelContent = function (key, createContent) {
        const wrapper = box.startPanel(key);
        if (!wrapper) return null;
        try {
            createContent(wrapper);
        } finally {
            box.endPanel();
        }
        return wrapper;
    };
    // USAGE: tabs.setPanelContent("Details", function () { Label({ text: "..." }); });

    // Draws everything again from the data. (Ex: after a tab object or the width was changed by code)
    box.refresh = function () {
        drawAll();
    };
    // USAGE: tabs.getTab("open").text = "Open orders"; tabs.refresh();

    box.focus = function () {
        const item = findItem(box.value) || getEnabledItems()[0];
        if (item) focusTab(item);
    };


    // *** OBJECT VIEW:
    Tabs.injectCss();
    // WHY: In a column group with "stretch", width: auto would fill the row. fit-content keeps the bar as wide as its tabs.
    if (box.width === "auto") box.css.width = "fit-content";

    const barStyle = (isPill) ? _s.pillBar : _s.bar;
    const dividerLine = _s.bar.dividerWidth + "px solid " + _s.bar.dividerColor;

    // GROUP: Root (vertical: bar | panels, horizontal: bar / panels)
    const rootProps = {
        width: "100%",
        height: "auto",
        align: "left top",
        gap: 0,
        position: "relative",
        css: { alignItems: "stretch" },
    };
    box.contentBox = (isVertical) ? HGroup(rootProps) : VGroup(rootProps);

        // GROUP: Bar row (arrow, strip, arrow, add)
        if (isVertical) {
            box.barRow = VGroup({
                width: (hasPanels) ? box.barWidth : "100%",
                height: "auto",
                align: "left top",
                gap: 0,
                css: { alignItems: "stretch", minWidth: "0" },
            });
        } else {
            box.barRow = HGroup({
                width: "100%",
                height: "auto",
                align: "left center",
                gap: 0,
                css: { minWidth: "0" },
            });
        }

            // LABEL: Left arrow
            box.leftArrow = createIconButton({
                svg: Tabs.getArrowSvg("left", "currentColor", _s.arrow.size),
                size: _s.arrow.size + _s.arrow.padding * 2,
                round: _s.arrow.round,
                color: _s.arrow.color,
                ariaLabel: "Scroll left",
            });

            // BOX: Strip (scrolls)
            box.strip = startBox({
                width: (isVertical) ? "100%" : "auto",
                height: "auto",
                color: barStyle.color,
                round: barStyle.round,
                border: (isPill) ? barStyle.border : 0,
                borderColor: (isPill) ? barStyle.borderColor : "transparent",
                css: { boxSizing: "border-box" },
            });
            box.strip.elem.classList.add("tabs-strip");
            if (isVertical) {
                box.strip.css.overflowY = "auto";
                if (!isPill) box.strip.css.borderLeft = dividerLine;
            } else {
                box.strip.css = { flex: "1 1 0", minWidth: "0", overflowX: "auto", overflowY: "hidden" };
                if (!isPill) box.strip.css.borderBottom = dividerLine;
            }

                // GROUP: Strip inner (indicator + tabs)
                const stripInnerProps = {
                    height: "auto",
                    gap: barStyle.gap,
                    padding: barStyle.padding,
                    position: "relative",
                };
                if (isVertical) {
                    box.stripInner = VGroup({
                        ...stripInnerProps,
                        width: "100%",
                        align: "left top",
                        css: { boxSizing: "border-box", alignItems: "stretch" },
                    });
                    box.stripInner.aria = { orientation: "vertical" };
                } else {
                    // WHY: With width: auto the inner group stays as wide as the strip and the extra tabs are clipped.
                    //      max-content grows with the tabs, so the strip can scroll.
                    box.stripInner = HGroup({
                        ...stripInnerProps,
                        width: (isFullWidth) ? "100%" : "auto",
                        align: "left center",
                        css: { boxSizing: "border-box", width: (isFullWidth) ? "100%" : "max-content" },
                    });
                }
                box.stripInner.role = "tablist";
                box.stripInner.aria = { label: box.ariaLabel };

                    // BOX: Indicator (under the active tab)
                    box.indicator = Box({
                        left: 0,
                        top: 0,
                        width: 0,
                        height: (isPill) ? 0 : _s.indicator.thickness,
                        color: (isPill) ? _s.pillIndicator.color : _s.indicator.color,
                        round: (isPill) ? _s.pillIndicator.round : _s.indicator.round,
                        opacity: 0,
                        css: { position: "absolute", pointerEvents: "none" },
                    });
                    if (isPill) box.indicator.boxShadow = _s.pillIndicator.shadow;

                endGroup();

            endBox();

            // LABEL: Right arrow
            box.rightArrow = createIconButton({
                svg: Tabs.getArrowSvg("right", "currentColor", _s.arrow.size),
                size: _s.arrow.size + _s.arrow.padding * 2,
                round: _s.arrow.round,
                color: _s.arrow.color,
                ariaLabel: "Scroll right",
            });

            // LABEL: Add (+)
            box.addTabButton = createIconButton({
                svg: Tabs.getPlusSvg("currentColor", _s.addButton.size),
                size: _s.addButton.size + _s.addButton.padding * 2,
                round: _s.addButton.round,
                color: _s.addButton.color,
                ariaLabel: "Add",
            });
            box.addTabButton.css = {
                marginLeft: (isVertical) ? "0px" : ADD_BUTTON_SPACE + "px",
                transition: "background-color " + FADE_TIME,
            };
            box.addTabButton.role = "button";
            box.addTabButton.tabIndex = 0;

        endGroup();

        // BOX: Panels area
        if (hasPanels) {
            box.panelsBox = Box({
                width: (isVertical) ? "auto" : "100%",
                height: (box.panelHeight === "auto") ? "auto" : box.panelHeight,
                color: "transparent",
                position: "relative",
            });
            if (isVertical) box.panelsBox.css = { flex: "1 1 0", minWidth: "0" };
        }

    endGroup();

    // WHY: visible: 0 at create time would be undone by display = "flex" above. Hide them after the display type is set.
    box.leftArrow.visible = 0;
    box.rightArrow.visible = 0;
    box.addTabButton.visible = (box.addButton == 1) ? 1 : 0;

    // *** OBJECT INIT CODE:

    box.leftArrow.on("click", function () { scrollStrip(-1); });
    box.rightArrow.on("click", function () { scrollStrip(1); });
    box.strip.on("scroll", paintArrows);
    // Mouse wheel: vertical wheel scrolls the strip sideways.
    box.strip.on("wheel", function (self, event) {
        if (isVertical) return;
        const strip = box.strip.elem;
        if (strip.scrollWidth <= strip.clientWidth + 1) return;
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        strip.scrollLeft += event.deltaY;
    });

    box.addTabButton.onHoverChange(function (self, isOver) {
        box.addTabButton.color = (isOver) ? _s.addButton.hoverBackground : "transparent";
        box.addTabButton.textColor = (isOver) ? _s.addButton.hoverColor : _s.addButton.color;
    });
    box.addTabButton.on("click", requestAddTab);
    box.addTabButton.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        requestAddTab();
    });

    // The indicator follows size changes (texts, fonts, window).
    box.stripInner.onResize(refreshLayout);
    box.onResize(refreshLayout);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            if (!box.isRemoved) refreshLayout();
        });
    }

    // NOTE: The first drawing: the tabs (with their content), then the active tab.
    createTabs(initialTabs);
    box.value = resolveActiveKey(initialValue);
    box.setEnabled(box.enabled);
    showActiveTab();

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
        result.badge = basic.isOn(tab.badge) ? 1 : 0;
        result.disabled = basic.isOn(tab.disabled) ? 1 : 0;
        return result;
    });
};

// Element id from a key. "Open orders" -> "Open-orders"
Tabs.toId = function (key) {
    return String(key).replace(/[^\w-]/g, "-");
};

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
Tabs.escapeHtml = basic.escapeHtml; // (the name is kept: other code may use it)

// SVG icons. color: "currentColor" -> the icon takes the textColor of its Label (a hover changes only textColor).
Tabs.getLineSvg = function (path, color, size, strokeWidth) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24"' +
        ' fill="none" stroke="' + color + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="' + path + '"/></svg>';
};

Tabs.getCloseSvg = function (color, size) {
    return Tabs.getLineSvg("M6 6l12 12M18 6 6 18", color, size, 2.4);
};

Tabs.getPlusSvg = function (color, size) {
    return Tabs.getLineSvg("M12 5v14M5 12h14", color, size, 2.2);
};

Tabs.getArrowSvg = function (direction, color, size) {
    const path = (direction === "left") ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
    return Tabs.getLineSvg(path, color, size, 2.2);
};

// The scroll bar of the strip can not be hidden with inline styles.
Tabs.injectCss = function () {
    basic.addCss("tabs-css",
        ".tabs-strip { scrollbar-width: none; -ms-overflow-style: none; scroll-behavior: smooth; }" +
        ".tabs-strip::-webkit-scrollbar { display: none; }");
};

// *** STYLE PACKAGES:
// USAGE: Tabs({ styleName: "modern" })
// USAGE: Tabs({ styleName: "dark", style: { indicator: { color: "tomato" } } }) // Change only some keys.
// USAGE: Tabs({ style: Tabs.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
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

    // Dark theme, same colors as SelectBox and TagInput "dark".
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
