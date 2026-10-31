/* Bismillah */

/*

PageControl - v26.09

UI COMPONENT TEMPLATE
- A box that holds pages side by side and shows one of them. The pages slide (or fade) when another one is opened.
  The new version of comp-m1/ui-page-control.js. (Wizards, onboarding screens, carousels, mobile app screens...)
- Pages are created with addPage(key) and filled with startPage(key) ... endPage(), or with getPage(key).
- Transitions: "slide" (horizontal, default), "slide-vertical", "fade", "none". The move is done with CSS transforms.
- The pages always have the size of the box: width: "100%" and window resizes need no code. (No setSizes())
- Swipe with a finger or a mouse drag (swipe: 1), keyboard arrows when the box has the focus (keyboard: 1).
- Dots (dots: 1) and arrow buttons (arrows: 1) drawn with code, loop: 1 (after the last page comes the first),
  autoPlay: seconds (carousel; it pauses while the mouse is over the box).
- Inactive pages are hidden from the keyboard and screen readers (inert, aria-hidden).
- Events: onBeforeChange(self, fromKey, toKey) can return false to stop the change (Ex: form validation),
  onChange(self) when the new page is opened, onClose(self, key) when the old page is out of the view (after the motion).
- onChange is NOT called when the component is created or when a page is opened with silent: 1.

USAGE:
const pages = PageControl({ width: "100%", height: 400, dots: 1, arrows: 1 });
pages.addPage("welcome");
pages.startPage("welcome");
    Label({ text: "Welcome" });
pages.endPage();
pages.addPage("details");
pages.open("details");            // Slides to the page. onChange is called.
pages.next(); pages.previous();
PageControl({ transition: "fade", autoPlay: 4, loop: 1, pages: ["a", "b", "c"] });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const PageControlDefaults = {
    key: "0",
    width: 600,
    height: 400,
    pages: [], // Keys of the pages to create at start. Ex: ["welcome", "details"]
    value: null, // Key of the open page. null: the first page
    transition: "slide", // "slide", "slide-vertical", "fade", "none" (Only at create time)
    motion: 0.3, // Seconds. 0: No animation
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    loop: 0, // 1: next() after the last page opens the first page.
    swipe: 1, // 1: Drag with a finger or the mouse to change the page. (slide transitions)
    swipeThreshold: 0.2, // Part of the box size (0.2: 20%) to change the page. A fast flick also changes it.
    keyboard: 1, // 1: Arrow keys (when the box has the focus), Home / End
    dots: 0, // 1: Page dots at the bottom
    arrows: 0, // 1: Previous / next buttons at the sides
    autoPlay: 0, // Seconds. 0: Off. Ex: 4 -> next page every 4 seconds (loop is used)
    pageScroll: 0, // 1: Every page scrolls its own content (scrollY)
    enabled: 1,
    ariaLabel: "Pages",
    onBeforeChange: function (self, fromKey, toKey) { }, // Return false to stop the change.
    onChange: function (self) { }, // self.value, self.previousValue
    onClose: function (self, key) { }, // The old page is out of the view (after the motion)
    style: {
        box: {
            color: "transparent",
            border: 0,
            borderColor: "transparent",
            round: 0,
        },
        page: {
            color: "transparent",
        },
        dots: {
            size: 8,
            gap: 8,
            bottom: 12,
            color: Black(0.25),
            activeColor: "#141414",
            activeWidth: 20, // The active dot is a short bar. Same as size: a circle.
            motion: 0.25,
        },
        arrows: {
            size: 36,
            side: 10, // Space from the sides
            color: White(0.9),
            hoverColor: White(1),
            iconColor: "#141414",
            iconSize: 18,
            round: 100,
            shadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
            disabledOpacity: 0.3,
        },
        focus: {
            outlineColor: Black(0),
        },
        disabled: {
            opacity: 0.5,
        },
    }
};

const PageControl = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PageControlDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;
    const startPages = params.pages;
    const startValue = params.value;
    params.pages = [];
    params.value = null;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const isVertical = (box.transition === "slide-vertical");
    const isFade = (box.transition === "fade");
    const isSlide = (box.transition === "slide" || isVertical);
    let items = []; // [{ key, page }]
    let dotList = [];
    let panelStack = [];
    let cancelClose = null; // (box.after / box.every: stopped by remove())
    let stopAutoPlayTimer = null;
    let isHover = 0;
    let drag = null; // { startX, startY, x, y, time, active, id }
    const CLOSE_WAIT_EXTRA = 30; // ms after the motion: then onClose is called
    const SWIPE_START_DISTANCE = 6; // px: a smaller move is still a click
    const EDGE_RESISTANCE = 3; // At the first and the last page (no loop) the track moves 3 times less than the pointer.
    const FLICK_SPEED = 0.5; // px per ms: a faster swipe changes the page, also when it is short
    const SWIPE_CLICK_WAIT = 50; // ms: the click after a swipe is stopped in this time
    const CONTROLS_Z_INDEX = 5; // The dots and the arrows are over the pages.
    const BUTTON_FADE_TIME = "0.15s";

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    // NOTE: Default values are also public variables. (box.value, box.loop, box.autoPlay)

    // *** PRIVATE FUNCTIONS:

    const findItem = function (key) {
        return items.find(function (item) { return item.key === key; }) || null;
    };

    const getIndex = function (key) {
        return items.findIndex(function (item) { return item.key === key; });
    };

    const getMotion = function () {
        return (box.motion > 0) ? box.motion : 0;
    };

    const getTrackTransform = function (index, offsetPx = 0) {
        // NOTE: 2D translate. (translate3d + will-change made a separate layer that some headless screenshots did not paint.)
        if (isVertical) return "translate(0, calc(" + (-index * 100) + "% + " + offsetPx + "px))";
        return "translate(calc(" + (-index * 100) + "% + " + offsetPx + "px), 0)";
    };

    const setTrackMotion = function (enabled) {
        const seconds = (enabled) ? getMotion() : 0;
        box.track.css.transition = (seconds > 0) ? "transform " + seconds + "s " + box.easing : "none";
    };

    // Slide: the track moves. Fade: the opacity of the pages.
    const placePages = function (index, animated) {

        if (isSlide) {
            setTrackMotion(animated);
            box.track.css.transform = getTrackTransform(index);
            return;
        }

        const isFadeMotion = (isFade && animated && getMotion() > 0);
        const fadeTransition = (isFadeMotion) ? "opacity " + getMotion() + "s " + box.easing : "none";
        items.forEach(function (item, i) {
            const isActive = (i === index);
            item.page.css.transition = fadeTransition;
            item.page.css.opacity = (isActive) ? "1" : "0";
            item.page.zIndex = (isActive) ? 1 : 0;
        });

    };

    // Inactive pages: no focus, no screen reader
    const hideInactivePages = function (index) {
        items.forEach(function (item, i) {
            const isActive = (i === index);
            item.page.aria = { hidden: (isActive) ? "false" : "true" };
            if (isActive) {
                item.page.elem.removeAttribute("inert");
            } else {
                item.page.elem.setAttribute("inert", "");
            }
            item.page.css.pointerEvents = (isActive) ? "" : "none";
        });
    };

    // Shows the open page: its place, the other pages, the dots, the arrows.
    const showActivePage = function (animated = 1) {
        const index = Math.max(0, getIndex(box.value));
        placePages(index, animated);
        hideInactivePages(index);
        updateDots();
        updateArrows();
    };

    const updateDots = function () {
        if (box.dots != 1) return;
        const index = getIndex(box.value);
        dotList.forEach(function (dot, i) {
            const active = (i === index);
            dot.color = (active) ? _s.dots.activeColor : _s.dots.color;
            dot.width = (active) ? _s.dots.activeWidth : _s.dots.size;
            dot.aria = { current: (active) ? "true" : "false" };
        });
    };

    const paintArrow = function (btn, canGo) {
        const isUsable = (canGo && box.enabled == 1);
        btn.css.opacity = (isUsable) ? "1" : String(_s.arrows.disabledOpacity);
        btn.css.pointerEvents = (isUsable) ? "auto" : "none";
        btn.aria = { disabled: (canGo) ? "false" : "true" };
    };

    const updateArrows = function () {
        if (box.arrows != 1) return;
        const index = getIndex(box.value);
        const canLoop = (box.loop == 1 && items.length > 1);
        paintArrow(box.btnPrev, canLoop || index > 0);
        paintArrow(box.btnNext, canLoop || index < items.length - 1);
        box.btnPrev.visible = (items.length > 1) ? 1 : 0;
        box.btnNext.visible = (items.length > 1) ? 1 : 0;
    };

    // Creates the dots again (page count changed)
    const createDots = function () {
        if (box.dots != 1) return;
        dotList.forEach(function (dot) { dot.remove(); });
        dotList = [];
        items.forEach(function (item) {
            let dot = null;
            // WHY: createIn() restores the container. (setDefaultContainerBox() left it on the dots, so the next
            //      object of the page, created after addPage(), went into the dots group.)
            createIn(box.dotsBox, function () {
                dot = Box({ width: _s.dots.size, height: _s.dots.size, color: _s.dots.color, round: 100, clickable: 1 });
            });
            dot.shrink = 0;
            dot.cursor = "pointer";
            dot.css.transition = "width " + _s.dots.motion + "s, background-color " + _s.dots.motion + "s";
            dot.role = "button";
            dot.aria = { label: "Page " + String(item.key) };
            dot.on("click", function (self, event) {
                event.stopPropagation();
                box.open(item.key);
            });
            dotList.push(dot);
        });
        box.dotsBox.visible = (items.length > 1) ? 1 : 0;
        updateDots();
    };

    // onClose of the old page after the motion
    const scheduleClose = function (key) {
        if (cancelClose) cancelClose();
        cancelClose = null;
        if (key === null || key === undefined) return;
        const delay = (box.transition === "none") ? 0 : getMotion() * 1000 + CLOSE_WAIT_EXTRA;
        cancelClose = box.after(delay, function () {
            cancelClose = null;
            box.onClose(box, key);
        });
    };

    // *** AUTO PLAY:

    const startAutoPlay = function () {
        stopAutoPlay();
        if (!(box.autoPlay > 0) || items.length < 2) return;
        stopAutoPlayTimer = box.every(box.autoPlay * 1000, function () {
            if (isHover || (drag && drag.active) || box.enabled != 1) return;
            const index = getIndex(box.value);
            box.open(items[(index + 1) % items.length].key);
        });
    };

    const stopAutoPlay = function () {
        if (stopAutoPlayTimer) stopAutoPlayTimer();
        stopAutoPlayTimer = null;
    };

    // *** SWIPE:

    const onPointerDown = function (self, event) {
        if (box.swipe != 1 || !isSlide || box.enabled != 1 || items.length < 2) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        drag = {
            startX: event.clientX,
            startY: event.clientY,
            x: event.clientX,
            y: event.clientY,
            time: Date.now(),
            active: 0,
            id: event.pointerId,
        };
    };

    const capturePointer = function (pointerId) {
        if (!box.elem.setPointerCapture) return;
        try {
            box.elem.setPointerCapture(pointerId);
        } catch (error) { }
    };

    const onPointerMove = function (self, event) {
        if (!drag || event.pointerId !== drag.id) return;
        drag.x = event.clientX;
        drag.y = event.clientY;
        const dx = drag.x - drag.startX;
        const dy = drag.y - drag.startY;
        if (!drag.active) {
            // WHY: A small move is a click, a vertical move is the scroll of the page content.
            const main = (isVertical) ? Math.abs(dy) : Math.abs(dx);
            const other = (isVertical) ? Math.abs(dx) : Math.abs(dy);
            if (main < SWIPE_START_DISTANCE || main < other) return;
            drag.active = 1;
            setTrackMotion(0);
            box.track.cursor = "grabbing";
            capturePointer(event.pointerId);
        }
        event.preventDefault();
        const index = getIndex(box.value);
        let offset = (isVertical) ? dy : dx;
        // Resistance at the ends (no loop)
        const atStart = (index === 0 && offset > 0);
        const atEnd = (index === items.length - 1 && offset < 0);
        if ((atStart || atEnd) && box.loop != 1) offset = offset / EDGE_RESISTANCE;
        box.track.css.transform = getTrackTransform(index, offset);
    };

    // The index of the page that a swipe opens. (The same index: back to the place)
    const getSwipeTarget = function (index, offset, elapsed) {
        const size = (isVertical) ? box.elem.clientHeight : box.elem.clientWidth;
        const velocity = Math.abs(offset) / elapsed; // px per ms
        let target = index;
        if (Math.abs(offset) > size * box.swipeThreshold || velocity > FLICK_SPEED) {
            target = (offset < 0) ? index + 1 : index - 1;
        }
        if (box.loop == 1) target = (target + items.length) % items.length;
        return Math.max(0, Math.min(items.length - 1, target));
    };

    const onPointerUp = function (self, event) {
        if (!drag || event.pointerId !== drag.id) return;
        const wasActive = drag.active;
        const dx = drag.x - drag.startX;
        const dy = drag.y - drag.startY;
        const elapsed = Math.max(1, Date.now() - drag.time);
        drag = null;
        box.track.cursor = "";
        if (!wasActive) return;
        event.preventDefault();
        box._swiped = 1; // WHY: The "click" after this pointer up is stopped. (onClickCapture)
        box.after(SWIPE_CLICK_WAIT, function () {
            box._swiped = 0;
        });

        const index = getIndex(box.value);
        const target = getSwipeTarget(index, (isVertical) ? dy : dx, elapsed);

        if (target !== index) {
            box.open(items[target].key);
        } else {
            showActivePage(1); // Back to the place
        }
    };

    // WHY: A drag must not end as a click on the page content.
    const onClickCapture = function (self, event) {
        if (!box._swiped) return;
        event.stopPropagation();
        event.preventDefault();
        box._swiped = 0;
    };

    const onKeyDown = function (self, event) {
        if (box.keyboard != 1 || box.enabled != 1) return;
        if (event.target !== box.elem) return; // WHY: Inputs in the pages keep their arrow keys.
        const prevKey = (isVertical) ? "ArrowUp" : "ArrowLeft";
        const nextKey = (isVertical) ? "ArrowDown" : "ArrowRight";
        if (event.key === nextKey) {
            event.preventDefault();
            box.next();
            return;
        }
        if (event.key === prevKey) {
            event.preventDefault();
            box.previous();
            return;
        }
        if (event.key === "Home") {
            event.preventDefault();
            if (items[0]) box.open(items[0].key);
            return;
        }
        if (event.key === "End") {
            event.preventDefault();
            if (items.length) box.open(items[items.length - 1].key);
        }
    };

    // *** PUBLIC FUNCTIONS:

    // Creates a page. Returns its Box. index: Position (default: the end)
    box.addPage = function (key, index = -1) {
        const oldItem = findItem(key);
        if (oldItem) {
            console.warn("PageControl: A page with this key exists: " + key);
            return oldItem.page;
        }

        // BOX: Page
        // WHY: createIn() restores the container, so objects created after addPage() stay where they were.
        let page = null;
        createIn(box.track, function () {
            page = Box({ width: "100%", height: "100%", color: _s.page.color });
        });
        page.css = {
            position: (isSlide) ? "relative" : "absolute",
            left: "0px",
            top: "0px",
            flex: "0 0 100%",
            boxSizing: "border-box",
        };
        page.role = "group";
        page.aria = { label: String(key) };
        page.pageKey = key;
        if (box.pageScroll == 1) page.scrollY = 1;
        if (!isSlide) page.css.opacity = "0";

        const item = { key: key, page: page };
        if (index >= 0 && index < items.length) {
            box.track.elem.insertBefore(page.elem, items[index].page.elem);
            items.splice(index, 0, item);
        } else {
            items.push(item);
        }
        box.pages = box.getKeys();

        if (box.value === null) box.value = key; // The first page is open.
        createDots();
        showActivePage(0);
        startAutoPlay();
        return page;
    };
    // USAGE: const page = pages.addPage("welcome") // A Box. Fill it with startPage() / endPage() or setDefaultContainerBox(page).

    // Objects created between startPage(key) and endPage() go into the page.
    box.startPage = function (key) {
        const page = box.getPage(key) || box.addPage(key);
        panelStack.push(getDefaultContainerBox());
        if (page.wrapper) page.wrapper.remove();
        setDefaultContainerBox(page);
        // WHY: pageScroll: height "auto" + min-height 100%, so a long content can scroll. Otherwise 100%, so groups with height "100%" fill the page.
        page.wrapper = VGroup({
            width: "100%",
            height: (box.pageScroll == 1) ? "auto" : "100%",
            align: "left top",
            gap: 0,
            position: "relative",
        });
        page.wrapper.css = { alignItems: "stretch", minHeight: "100%" };
        return page.wrapper;
    };
    // USAGE: pages.startPage("welcome"); Label({ text: "Hi" }); pages.endPage();
    // NOTE: The wrapper is a VGroup (100% x 100%, grows with a long content). Start your own group in it for another layout.

    box.endPage = function () {
        endGroup();
        const previous = panelStack.pop();
        if (previous) setDefaultContainerBox(previous);
    };

    box.getPage = function (key = box.value) {
        const item = findItem(key);
        return (item) ? item.page : null;
    };

    box.getKeys = function () {
        return items.map(function (item) { return item.key; });
    };

    box.getIndex = function (key = box.value) {
        return getIndex(key);
    };

    box.getCount = function () {
        return items.length;
    };

    // Opens a page. silent: 1 -> onChange is not called. Returns 1 when the page is opened.
    box.open = function (key, silent = 0) {
        const item = findItem(key);
        if (!item) {
            console.warn("PageControl: No page with this key: " + key);
            return 0;
        }
        if (box.value === key) {
            showActivePage(1);
            return 1;
        }
        if (box.onBeforeChange(box, box.value, key) === false) {
            showActivePage(1);
            return 0;
        }
        const oldKey = box.value;
        box.previousValue = oldKey;
        box.value = key;
        showActivePage(1);
        scheduleClose(oldKey);
        if (box.autoPlay > 0) startAutoPlay(); // Restart the timer after a manual change
        if (!silent) box.onChange(box);
        return 1;
    };
    // USAGE: pages.open("details")

    box.openIndex = function (index, silent = 0) {
        const item = items[index];
        return (item) ? box.open(item.key, silent) : 0;
    };

    box.next = function (silent = 0) {
        const index = getIndex(box.value);
        if (index < 0) return 0;
        let target = index + 1;
        if (target >= items.length) {
            if (box.loop != 1) return 0;
            target = 0;
        }
        return box.open(items[target].key, silent);
    };

    box.previous = function (silent = 0) {
        const index = getIndex(box.value);
        if (index < 0) return 0;
        let target = index - 1;
        if (target < 0) {
            if (box.loop != 1) return 0;
            target = items.length - 1;
        }
        return box.open(items[target].key, silent);
    };

    box.isFirst = function () { return getIndex(box.value) === 0; };
    box.isLast = function () { return getIndex(box.value) === items.length - 1; };

    // Removes a page. When it is the open page, the next (or the previous) page is opened without motion.
    box.removePage = function (key, silent = 0) {
        const index = getIndex(key);
        if (index < 0) return 0;
        const wasOpen = (box.value === key);
        items[index].page.remove();
        items.splice(index, 1);
        box.pages = box.getKeys();
        if (wasOpen) {
            const next = items[index] || items[index - 1] || null;
            box.previousValue = key;
            box.value = (next) ? next.key : null;
        }
        createDots();
        showActivePage(0);
        startAutoPlay();
        if (wasOpen && !silent) box.onChange(box);
        return 1;
    };

    box.clear = function () {
        items.forEach(function (item) { item.page.remove(); });
        items = [];
        box.pages = [];
        box.value = null;
        box.previousValue = null;
        createDots();
        showActivePage(0);
        stopAutoPlay();
    };

    box.setLoop = function (loop) {
        box.loop = basic.isOn(loop) ? 1 : 0;
        updateArrows();
    };

    box.setAutoPlay = function (seconds) {
        box.autoPlay = Number(seconds) || 0;
        startAutoPlay();
    };
    // USAGE: pages.setAutoPlay(4) or pages.setAutoPlay(0) to stop

    box.setEnabled = function (enabled) {
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        box.css.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.tabIndex = (box.enabled == 1 && box.keyboard == 1) ? 0 : -1;
        updateArrows();
    };

    box.refresh = function () {
        showActivePage(0);
    };

    box.focus = function () {
        box.elem.focus({ preventScroll: true });
    };


    // *** OBJECT VIEW:

    box.clipContent = 1;
    box.clickable = 1;
    // WHY: The browser keeps the scroll of the other direction, the swipe gets this one.
    const getTouchAction = function () {
        if (!isSlide || box.swipe != 1) return "";
        return (isVertical) ? "pan-x" : "pan-y";
    };
    box.css = { outline: "none", touchAction: getTouchAction() };
    box.role = "region";
    box.aria = { label: box.ariaLabel };

    // BOX: Track (slide: a flex row / column of the pages that moves; fade: stacked pages)
    box.track = Box(0, 0, "100%", "100%", { color: "transparent", clickable: 1 });
    if (isSlide) {
        box.track.elem.style.display = "flex";
        box.track.css.flexDirection = (isVertical) ? "column" : "row";
    }
    box.track.css.userSelect = "none";
    box.track.css.overflow = "visible"; // WHY: basic.js boxes clip their content. The pages after the first one are outside the track; the component box clips instead.

    // GROUP: Dots
    if (box.dots == 1) {
        box.dotsBox = HGroup({ width: "auto", height: "auto", align: "center center", gap: _s.dots.gap, padding: [6, 4] });
        box.dotsBox.css = {
            position: "absolute",
            left: "50%",
            top: "auto",
            bottom: _s.dots.bottom + "px",
            transform: "translateX(-50%)",
            pointerEvents: "auto",
        };
        box.dotsBox.zIndex = CONTROLS_Z_INDEX;
        box.dotsBox.role = "group";
        box.dotsBox.aria = { label: "Page dots" };
        endGroup();
    }

    // LABEL: Arrow buttons
    if (box.arrows == 1) {
        const createArrow = function (direction) {
            const isLeft = (direction === "left");
            const btn = Label({
                text: PageControl.getArrowSvg(direction, _s.arrows.iconColor, _s.arrows.iconSize),
                width: _s.arrows.size,
                height: _s.arrows.size,
                color: _s.arrows.color,
                round: _s.arrows.round,
                clickable: 1,
            });
            btn.css = { position: "absolute", top: "50%", transform: "translateY(-50%)" };
            btn.elem.style.display = "flex";
            btn.css = {
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color " + BUTTON_FADE_TIME + ", opacity " + BUTTON_FADE_TIME,
            };
            btn.lineHeight = "0";
            btn.cursor = "pointer";
            btn.zIndex = CONTROLS_Z_INDEX;
            btn.boxShadow = _s.arrows.shadow;
            btn.role = "button";
            btn.aria = { label: (isLeft) ? "Previous page" : "Next page" };
            if (isLeft) {
                btn.css.left = _s.arrows.side + "px";
            } else {
                btn.css = { left: "auto", right: _s.arrows.side + "px" };
            }
            btn.on("mouseenter", function () {
                btn.color = _s.arrows.hoverColor;
            });
            btn.on("mouseleave", function () {
                btn.color = _s.arrows.color;
            });
            btn.on("pointerdown", function (self, event) {
                event.stopPropagation(); // WHY: No swipe from the buttons.
            });
            return btn;
        };
        box.btnPrev = createArrow("left");
        box.btnNext = createArrow("right");
        box.btnPrev.on("click", function (self, event) {
            event.stopPropagation();
            box.previous();
        });
        box.btnNext.on("click", function (self, event) {
            event.stopPropagation();
            box.next();
        });
    }

    // *** OBJECT INIT CODE:

    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerUp);
    box.on("pointercancel", onPointerUp);
    box.on("keydown", onKeyDown);
    box.on("mouseenter", function () { isHover = 1; });
    box.on("mouseleave", function () { isHover = 0; });
    box.on("focus", function () {
        box.boxShadow = "inset 0 0 0 2px " + _s.focus.outlineColor;
    });
    box.on("blur", function () {
        box.boxShadow = "none";
    });
    box.listenTo(box.elem, "click", onClickCapture, true); // WHY: After a swipe, the click must not reach the page content.

    (startPages || []).forEach(function (key) { box.addPage(key); });
    if (startValue !== null && startValue !== undefined && findItem(startValue)) box.value = startValue;
    box.setEnabled(box.enabled);
    showActivePage(0);
    startAutoPlay();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

PageControl.getArrowSvg = function (direction, color, size) {
    const path = (direction === "left") ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
};
