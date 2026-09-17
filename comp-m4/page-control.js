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
    let closeTimer = null;
    let autoPlayTimer = null;
    let isHover = 0;
    let drag = null; // { startX, startY, x, y, time, active }

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
        box.track.elem.style.transition = (seconds > 0) ? "transform " + seconds + "s " + box.easing : "none";
    };

    // Puts the pages in their places. (Slide: the track moves. Fade: the opacity of the pages.)
    const layout = function (animated = 1) {

        const index = Math.max(0, getIndex(box.value));

        if (isSlide) {
            setTrackMotion(animated);
            box.track.elem.style.transform = getTrackTransform(index);
        } else {
            items.forEach(function (item, i) {
                const active = (i === index);
                item.page.elem.style.transition = (isFade && animated && getMotion() > 0) ? "opacity " + getMotion() + "s " + box.easing : "none";
                item.page.elem.style.opacity = (active) ? "1" : "0";
                item.page.elem.style.zIndex = (active) ? "1" : "0";
            });
        }

        // Inactive pages: no focus, no screen reader
        items.forEach(function (item, i) {
            const active = (i === index);
            item.page.elem.setAttribute("aria-hidden", (active) ? "false" : "true");
            if (active) item.page.elem.removeAttribute("inert"); else item.page.elem.setAttribute("inert", "");
            item.page.elem.style.pointerEvents = (active) ? "" : "none";
        });

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
            dot.elem.setAttribute("aria-current", (active) ? "true" : "false");
        });
    };

    const updateArrows = function () {
        if (box.arrows != 1) return;
        const index = getIndex(box.value);
        const canPrev = (box.loop == 1 && items.length > 1) || index > 0;
        const canNext = (box.loop == 1 && items.length > 1) || index < items.length - 1;
        [[box.btnPrev, canPrev], [box.btnNext, canNext]].forEach(function (pair) {
            pair[0].elem.style.opacity = (pair[1] && box.enabled == 1) ? "1" : String(_s.arrows.disabledOpacity);
            pair[0].elem.style.pointerEvents = (pair[1] && box.enabled == 1) ? "auto" : "none";
            pair[0].elem.setAttribute("aria-disabled", (pair[1]) ? "false" : "true");
        });
        box.btnPrev.visible = (items.length > 1) ? 1 : 0;
        box.btnNext.visible = (items.length > 1) ? 1 : 0;
    };

    // Creates the dots again (page count changed)
    const renderDots = function () {
        if (box.dots != 1) return;
        dotList.forEach(function (dot) { dot.remove(); });
        dotList = [];
        items.forEach(function (item) {
            setDefaultContainerBox(box.dotsBox); // WHY: setDefaultContainerBox() is not in the start/end list.
            const dot = Box({ width: _s.dots.size, height: _s.dots.size, color: _s.dots.color, round: 100, clickable: 1 });
            dot.elem.style.flexShrink = "0";
            dot.elem.style.cursor = "pointer";
            dot.elem.style.transition = "width " + _s.dots.motion + "s, background-color " + _s.dots.motion + "s";
            dot.elem.setAttribute("role", "button");
            dot.elem.setAttribute("aria-label", "Page " + String(item.key));
            dot.on("click", function (self, event) { event.stopPropagation(); box.open(item.key); });
            dotList.push(dot);
        });
        box.dotsBox.visible = (items.length > 1) ? 1 : 0;
        updateDots();
    };

    // onClose of the old page after the motion
    const scheduleClose = function (key) {
        clearTimeout(closeTimer);
        if (key === null || key === undefined) return;
        const delay = (box.transition === "none") ? 0 : getMotion() * 1000 + 30;
        closeTimer = setTimeout(function () { if (box) box.onClose(box, key); }, delay);
    };

    // *** AUTO PLAY:

    const startAutoPlay = function () {
        stopAutoPlay();
        if (!(box.autoPlay > 0) || items.length < 2) return;
        autoPlayTimer = setInterval(function () {
            if (!box || isHover || (drag && drag.active) || box.enabled != 1) return;
            const index = getIndex(box.value);
            box.open(items[(index + 1) % items.length].key);
        }, box.autoPlay * 1000);
    };

    const stopAutoPlay = function () {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
    };

    // *** SWIPE:

    const onPointerDown = function (self, event) {
        if (box.swipe != 1 || !isSlide || box.enabled != 1 || items.length < 2) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;
        drag = { startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, time: Date.now(), active: 0, id: event.pointerId };
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
            if (main < 6 || main < other) return;
            drag.active = 1;
            setTrackMotion(0);
            box.track.elem.style.cursor = "grabbing";
            if (box.elem.setPointerCapture) { try { box.elem.setPointerCapture(event.pointerId); } catch (error) { } }
        }
        event.preventDefault();
        const index = getIndex(box.value);
        let offset = (isVertical) ? dy : dx;
        // Resistance at the ends (no loop)
        const atStart = (index === 0 && offset > 0);
        const atEnd = (index === items.length - 1 && offset < 0);
        if ((atStart || atEnd) && box.loop != 1) offset = offset / 3;
        box.track.elem.style.transform = getTrackTransform(index, offset);
    };

    const onPointerUp = function (self, event) {
        if (!drag || event.pointerId !== drag.id) return;
        const wasActive = drag.active;
        const dx = drag.x - drag.startX;
        const dy = drag.y - drag.startY;
        const elapsed = Math.max(1, Date.now() - drag.time);
        drag = null;
        box.track.elem.style.cursor = "";
        if (!wasActive) return;
        event.preventDefault();
        box._swiped = 1; // WHY: The "click" after this pointer up is stopped. (onClickCapture)
        setTimeout(function () { if (box) box._swiped = 0; }, 50);

        const size = (isVertical) ? box.elem.clientHeight : box.elem.clientWidth;
        const offset = (isVertical) ? dy : dx;
        const velocity = Math.abs(offset) / elapsed; // px per ms
        const index = getIndex(box.value);
        let target = index;
        if (Math.abs(offset) > size * box.swipeThreshold || velocity > 0.5) {
            target = (offset < 0) ? index + 1 : index - 1;
        }
        if (box.loop == 1) target = (target + items.length) % items.length;
        target = Math.max(0, Math.min(items.length - 1, target));

        if (target !== index) {
            box.open(items[target].key);
        } else {
            layout(1); // Back to the place
        }
    };

    // WHY: A drag must not end as a click on the page content.
    const onClickCapture = function (event) {
        if (box && box._swiped) { event.stopPropagation(); event.preventDefault(); box._swiped = 0; }
    };

    const onKeyDown = function (self, event) {
        if (box.keyboard != 1 || box.enabled != 1) return;
        if (event.target !== box.elem) return; // WHY: Inputs in the pages keep their arrow keys.
        const prevKey = (isVertical) ? "ArrowUp" : "ArrowLeft";
        const nextKey = (isVertical) ? "ArrowDown" : "ArrowRight";
        if (event.key === nextKey) { event.preventDefault(); box.next(); }
        else if (event.key === prevKey) { event.preventDefault(); box.previous(); }
        else if (event.key === "Home") { event.preventDefault(); if (items[0]) box.open(items[0].key); }
        else if (event.key === "End") { event.preventDefault(); if (items.length) box.open(items[items.length - 1].key); }
    };

    // *** PUBLIC FUNCTIONS:

    // Creates a page. Returns its Box. index: Position (default: the end)
    box.addPage = function (key, index = -1) {
        if (findItem(key)) { console.warn("PageControl: A page with this key exists: " + key); return findItem(key).page; }

        setDefaultContainerBox(box.track); // WHY: setDefaultContainerBox() is not in the start/end list.

        // BOX: Page
        const page = Box({ width: "100%", height: "100%", color: _s.page.color });
        page.elem.style.position = (isSlide) ? "relative" : "absolute";
        page.elem.style.left = "0px";
        page.elem.style.top = "0px";
        page.elem.style.flex = "0 0 100%";
        page.elem.style.boxSizing = "border-box";
        page.elem.setAttribute("role", "group");
        page.elem.setAttribute("aria-label", String(key));
        page.pageKey = key;
        if (box.pageScroll == 1) page.scrollY = 1;
        if (!isSlide) page.elem.style.opacity = "0";

        const item = { key: key, page: page };
        if (index >= 0 && index < items.length) {
            box.track.elem.insertBefore(page.elem, items[index].page.elem);
            items.splice(index, 0, item);
        } else {
            items.push(item);
        }
        box.pages = box.getKeys();

        if (box.value === null) box.value = key; // The first page is open.
        renderDots();
        layout(0);
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
        page.wrapper = VGroup({ width: "100%", height: (box.pageScroll == 1) ? "auto" : "100%", align: "left top", gap: 0, position: "relative" });
        page.wrapper.elem.style.alignItems = "stretch";
        page.wrapper.elem.style.minHeight = "100%";
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
        if (!item) { console.warn("PageControl: No page with this key: " + key); return 0; }
        if (box.value === key) { layout(1); return 1; }
        if (box.onBeforeChange(box, box.value, key) === false) { layout(1); return 0; }
        const oldKey = box.value;
        box.previousValue = oldKey;
        box.value = key;
        layout(1);
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
        if (target >= items.length) { if (box.loop != 1) return 0; target = 0; }
        return box.open(items[target].key, silent);
    };

    box.previous = function (silent = 0) {
        const index = getIndex(box.value);
        if (index < 0) return 0;
        let target = index - 1;
        if (target < 0) { if (box.loop != 1) return 0; target = items.length - 1; }
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
        renderDots();
        layout(0);
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
        renderDots();
        layout(0);
        stopAutoPlay();
    };

    box.setLoop = function (loop) {
        box.loop = (loop == 1 || loop === true) ? 1 : 0;
        updateArrows();
    };

    box.setAutoPlay = function (seconds) {
        box.autoPlay = Number(seconds) || 0;
        startAutoPlay();
    };
    // USAGE: pages.setAutoPlay(4) or pages.setAutoPlay(0) to stop

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        box.elem.style.opacity = (box.enabled == 1) ? "1" : String(_s.disabled.opacity);
        box.elem.tabIndex = (box.enabled == 1 && box.keyboard == 1) ? 0 : -1;
        updateArrows();
    };

    box.refresh = function () {
        layout(0);
    };

    box.focus = function () {
        box.elem.focus({ preventScroll: true });
    };

    box.destroy = function () {
        clearTimeout(closeTimer);
        stopAutoPlay();
        box.elem.removeEventListener("click", onClickCapture, true);
        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;
    };

    // *** OBJECT VIEW:

    box.clipContent = 1;
    box.clickable = 1;
    box.elem.style.outline = "none";
    box.elem.style.touchAction = (isSlide && box.swipe == 1) ? ((isVertical) ? "pan-x" : "pan-y") : "";
    box.elem.setAttribute("role", "region");
    box.elem.setAttribute("aria-label", box.ariaLabel);

    // BOX: Track (slide: a flex row / column of the pages that moves; fade: stacked pages)
    box.track = Box(0, 0, "100%", "100%", { color: "transparent", clickable: 1 });
    if (isSlide) {
        box.track.elem.style.display = "flex";
        box.track.elem.style.flexDirection = (isVertical) ? "column" : "row";
    }
    box.track.elem.style.userSelect = "none";
    box.track.elem.style.overflow = "visible"; // WHY: basic.js boxes clip their content. The pages after the first one are outside the track; the component box clips instead.

    // GROUP: Dots
    if (box.dots == 1) {
        box.dotsBox = HGroup({ width: "auto", height: "auto", align: "center center", gap: _s.dots.gap, padding: [6, 4] });
        box.dotsBox.elem.style.position = "absolute";
        box.dotsBox.elem.style.left = "50%";
        box.dotsBox.elem.style.top = "auto";
        box.dotsBox.elem.style.bottom = _s.dots.bottom + "px";
        box.dotsBox.elem.style.transform = "translateX(-50%)";
        box.dotsBox.elem.style.zIndex = "5";
        box.dotsBox.elem.style.pointerEvents = "auto";
        box.dotsBox.elem.setAttribute("role", "group");
        box.dotsBox.elem.setAttribute("aria-label", "Page dots");
        endGroup();
    }

    // LABEL: Arrow buttons
    if (box.arrows == 1) {
        const createArrow = function (direction) {
            const btn = Label({ text: PageControl.getArrowSvg(direction, _s.arrows.iconColor, _s.arrows.iconSize), width: _s.arrows.size, height: _s.arrows.size, color: _s.arrows.color, round: _s.arrows.round, clickable: 1 });
            btn.elem.style.position = "absolute";
            btn.elem.style.top = "50%";
            btn.elem.style.transform = "translateY(-50%)";
            btn.elem.style.display = "flex";
            btn.elem.style.alignItems = "center";
            btn.elem.style.justifyContent = "center";
            btn.elem.style.lineHeight = "0";
            btn.elem.style.cursor = "pointer";
            btn.elem.style.zIndex = "5";
            btn.elem.style.boxShadow = _s.arrows.shadow;
            btn.elem.style.transition = "background-color 0.15s, opacity 0.15s";
            btn.elem.setAttribute("role", "button");
            btn.elem.setAttribute("aria-label", (direction === "left") ? "Previous page" : "Next page");
            if (direction === "left") btn.elem.style.left = _s.arrows.side + "px"; else { btn.elem.style.left = "auto"; btn.elem.style.right = _s.arrows.side + "px"; }
            btn.on("mouseenter", function () { btn.color = _s.arrows.hoverColor; });
            btn.on("mouseleave", function () { btn.color = _s.arrows.color; });
            btn.on("pointerdown", function (self, event) { event.stopPropagation(); }); // WHY: No swipe from the buttons.
            return btn;
        };
        box.btnPrev = createArrow("left");
        box.btnNext = createArrow("right");
        box.btnPrev.on("click", function (self, event) { event.stopPropagation(); box.previous(); });
        box.btnNext.on("click", function (self, event) { event.stopPropagation(); box.next(); });
    }

    // *** OBJECT INIT CODE:

    box.on("pointerdown", onPointerDown);
    box.on("pointermove", onPointerMove);
    box.on("pointerup", onPointerUp);
    box.on("pointercancel", onPointerUp);
    box.on("keydown", onKeyDown);
    box.on("mouseenter", function () { isHover = 1; });
    box.on("mouseleave", function () { isHover = 0; });
    box.on("focus", function () { box.elem.style.boxShadow = "inset 0 0 0 2px " + _s.focus.outlineColor; });
    box.on("blur", function () { box.elem.style.boxShadow = "none"; });
    box.elem.addEventListener("click", onClickCapture, true); // WHY: After a swipe, the click must not reach the page content.

    (startPages || []).forEach(function (key) { box.addPage(key); });
    if (startValue !== null && startValue !== undefined && findItem(startValue)) box.value = startValue;
    box.setEnabled(box.enabled);
    layout(0);
    startAutoPlay();

    return endObject(box);

};

// *** STATIC FUNCTIONS:

PageControl.getArrowSvg = function (direction, color, size) {
    const path = (direction === "left") ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
};
