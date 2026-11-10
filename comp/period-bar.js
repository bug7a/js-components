/* Bismillah */

/*

PeriodBar - v26.11

UI COMPONENT
- A month switcher: a white capsule with the selected month in its middle (a small title over a big name) and a
  round button with a chevron at each side.
- The months are this month and the months before it (monthCount):
  "TODAY" / "1 November" (this month, with the day of today), "LAST MONTH" / "October", "2 MONTHS AGO" / "September"...
  A month of another year gets its year: "December 2025".
- language: "en" or "tr" (PeriodBar.TEXTS: the titles, the month names of basic.js, the aria labels).
  Another language: PeriodBar.TEXTS.de = { today: "HEUTE", ... } (the keys of PeriodBar.TEXTS.en).
- value is the index of the selected month: 0 is the oldest one, monthCount - 1 is this month (the default).
- MOTIONS: the new month comes in from the side it goes to (the next one from the right), growing and
  fading in, while the old one leaves to the other side, shrinking and fading out (0.2 s). setVisible(0 / 1): the bar
  goes up / drops in from above, with a fade (0.3 s). Only transform and opacity move. No motion at the first view;
  none when the system asks for reduced motion. (style.motion: the times; 0 -> no motion)
- KEYBOARD AND ACCESSIBILITY: Left / Right arrows when the bar has the focus (Tab reaches it; a ring around the capsule,
  only for the keyboard). The buttons have the role "button", aria labels ("Previous month") and aria-disabled at the
  first / last month. The month in the capsule is read by a screen reader when it changes (aria-live).
- THE SIZES are px of a 600 px design (the page is fitted with page.fit(600, 800)).
  The capsule follows the size of the box (style.pill.space from its edges).
- onChange is NOT called when the component is created or when the value is set with silent: 1.
- NEEDS basic.js v26.10.23 (role, aria, tabIndex, basic.addCss, basic.isOn).

USAGE:
const periodBar = PeriodBar({
    monthCount: 12,
    language: "en",
    onChange: function (self) {
        const date = self.getSelectedDate(); // { year: 2026, month: 10 }
        showSpending(date.year, date.month);
    },
});
periodBar.selectPrevious();          // one month back (onChange is called)
periodBar.selectNext();
periodBar.setValue(0);               // the oldest month
periodBar.setValue(11, 1);           // silent: onChange is not called
periodBar.getSelectedDate();         // { year, month (1-12) }
periodBar.setVisible(0);             // it goes up (setVisible(1): it drops in)
PeriodBar({ language: "tr", monthCount: 24 });

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const PeriodBarDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    width: 600,
    height: 160,
    monthCount: 12, // This month and the months before it. (Only at create time)
    language: "en", // "en", "tr" or a key added to PeriodBar.TEXTS (Only at create time)
    value: null, // The index of the selected month: 0 the oldest, monthCount - 1 this month. null: this month
    ariaLabel: "", // "": the name of the bar in the language ("Month")
    onChange: function (self) { }, // self.value, self.previousValue, self.getSelectedDate()
    style: {
        pill: { // The white capsule
            space: 20, // From the edges of the box
            color: "white",
            round: 100, // More than half of its height: a capsule
            border: 1,
            borderColor: "#141414",
        },
        title: { // "TODAY", "LAST MONTH", "2 MONTHS AGO"
            top: 26, // In the capsule
            fontSize: 20,
            textColor: "#9B9B9B",
        },
        name: { // "1 November", "October", "December 2025"
            top: 46,
            fontSize: 35,
            textColor: "#141414",
            fontFamily: "opensans-bold",
        },
        button: { // The round buttons at the sides
            size: 80,
            side: 40, // From the side of the box
            color: "#D8D8D8",
            border: 1,
            borderColor: "#141414",
            round: 100,
            iconColor: "#141414",
            iconSize: 34,
            iconLine: 2, // The line of the chevron (on a 24 px grid)
            passiveOpacity: 0.2, // No month before (or after) the selected one
        },
        focus: { // A ring around the capsule while the keyboard focus is on the bar
            ringColor: "rgba(64, 165, 175, 0.9)",
            ringWidth: 3,
        },
        motion: {
            itemTime: 0.2, // s: a month comes in and the old one leaves. 0: no motion
            showTime: 0.3, // s: setVisible(). 0: no motion
            itemScale: 0.1, // The size of a month out at a side
            ease: "ease",
        },
    },
};

const PeriodBar = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, PeriodBarDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    params.monthCount = Math.max(1, Math.round(Number(params.monthCount)) || 1);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    const texts = PeriodBar.getTexts(box.language);
    const periods = PeriodBar.getPeriods(box.monthCount, texts); // The oldest first
    const lastIndex = periods.length - 1;
    let itemList = []; // A Box for every month (its labels: lblTitle, lblName)

    // *** PUBLIC VARIABLES:
    box.previousValue = null;
    box.isVisible = 1; // 0 after setVisible(0)
    // NOTE: Default values are also public variables. (box.value, box.monthCount, box.language)

    // *** PRIVATE FUNCTIONS:

    // DRAWING: each function does one job:
    // createItems()      -> a Box for every month                                   (the first drawing)
    // moveItems()        -> the new month comes in, the old one leaves               (setValue)
    // paintButtons()     -> the buttons at the first / last month                     (setValue)
    // showVisibility()   -> the bar drops in / goes up                                (setVisible)

    // An index of a month: a number in the list. null (or not a number): this month.
    const toIndex = function (value) {
        const index = Math.round(Number(value));
        if (value === null || value === undefined || isNaN(index)) return lastIndex;
        return basic.clamp(index, 0, lastIndex);
    };

    const isMotionOn = function () {
        const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        return !reduceMotion;
    };

    // The CSS transition of a motion: "none" when it is off.
    const getTransition = function (seconds) {
        if (!(seconds > 0) || !isMotionOn()) return "none";
        const timing = seconds + "s " + _s.motion.ease;
        return "transform " + timing + ", opacity " + timing;
    };

    // The places of a month: "center" (shown), "left" or "right" (out at a side, small and faded)
    // WHY: translateX(100%) is the width of the month itself: no measuring, and only transform and opacity move.
    const getItemTransform = function (place) {
        if (place === "center") return "translateX(0px) scale(1)";
        const side = (place === "left") ? "-100%" : "100%";
        return "translateX(" + side + ") scale(" + _s.motion.itemScale + ")";
    };

    const placeItem = function (item, place, transition) {
        const isShown = (place === "center");
        item.setMotionNow(transition);
        item.css.transform = getItemTransform(place);
        item.opacity = (isShown) ? 1 : 0;
        item.aria = { hidden: !isShown };
    };

    // DATA: one month, in the months box. (createIn)
    const createItem = function (period) {
        const item = startBox({ left: 0, top: 0, width: "100%", height: "100%", color: "transparent" });
            // LABEL: Title ("LAST MONTH")
            item.lblTitle = Label({ ..._s.title, left: 0, width: "100%", textAlign: "center", plainText: period.titleText });
            // LABEL: Name ("October")
            item.lblName = Label({ ..._s.name, left: 0, width: "100%", textAlign: "center", plainText: period.nameText });
        endBox();
        return item;
    };

    // DATA: the months; only the selected one is shown, without motion (the first view).
    const createItems = function () {
        itemList = periods.map(function (period) {
            return createIn(box.itemsBox, function () { return createItem(period); });
        });
        itemList.forEach(function (item, index) {
            placeItem(item, (index === box.value) ? "center" : "left", "none");
        });
    };

    // The new month comes in from the side it goes to (a later month from the right), the old one leaves to the other side.
    const moveItems = function (oldIndex, newIndex) {
        const transition = getTransition(_s.motion.itemTime);
        const isLater = (newIndex > oldIndex);
        const newItem = itemList[newIndex];
        placeItem(newItem, (isLater) ? "right" : "left", "none");
        newItem.elem.offsetWidth; // WHY: A reflow: the browser takes the start place first, so the motion starts from it.
        placeItem(newItem, "center", transition);
        placeItem(itemList[oldIndex], (isLater) ? "left" : "right", transition);
    };

    const paintButton = function (button, canGo) {
        button.opacity = (canGo) ? 1 : _s.button.passiveOpacity;
        button.cursor = (canGo) ? "pointer" : "default";
        button.aria = { disabled: !canGo };
    };

    const paintButtons = function () {
        paintButton(box.btnPrevious, box.value > 0);
        paintButton(box.btnNext, box.value < lastIndex);
    };

    // The bar drops in from above / goes up, with a fade. A hidden bar can not be clicked or focused (inert).
    const showVisibility = function () {
        box.setMotionNow(getTransition(_s.motion.showTime));
        box.css.transform = (box.isVisible) ? "translateY(0px)" : "translateY(-100%)";
        box.opacity = (box.isVisible) ? 1 : 0;
        box.elem.inert = !box.isVisible;
        box.aria = { hidden: !box.isVisible };
    };

    // LABEL: A round button at a side, with a chevron. side: "left" or "right"
    const createSideButton = function (side) {
        const _b = _s.button;
        const button = Label({
            top: "calc(50% - " + (_b.size / 2) + "px)", // WHY: In the middle of the height of the box.
            width: _b.size,
            height: _b.size,
            color: _b.color,
            border: _b.border,
            borderColor: _b.borderColor,
            round: _b.round,
            text: PeriodBar.getChevronSvg(side, _b.iconColor, _b.iconSize, _b.iconLine),
            lineHeight: "0",
            clickable: 1,
            css: { display: "flex", alignItems: "center", justifyContent: "center" },
        });
        button.role = "button";
        button.aria = { label: (side === "left") ? texts.previous : texts.next };
        if (side === "left") button.left = _b.side;
        else button.right = _b.side;
        return button;
    };

    const onKeyDown = function (self, event) {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            box.selectPrevious();
            return;
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            box.selectNext();
        }
    };

    // *** PUBLIC FUNCTIONS:

    // silent: 1 -> onChange is not called. Returns 1 when another month is shown.
    box.setValue = function (value, silent = 0) {
        const index = toIndex(value);
        if (index === box.value) return 0;
        const oldIndex = box.value;
        box.previousValue = oldIndex;
        box.value = index;
        moveItems(oldIndex, index);
        paintButtons();
        if (!silent) box.onChange(box);
        return 1;
    };
    // USAGE: periodBar.setValue(0) // the oldest month. setValue(null): this month

    box.selectNext = function (silent = 0) {
        return box.setValue(box.value + 1, silent);
    };

    box.selectPrevious = function (silent = 0) {
        return box.setValue(box.value - 1, silent);
    };

    // The year and the month (1-12) of the selected month.
    box.getSelectedDate = function () {
        const period = periods[box.value];
        return { year: period.year, month: period.month };
    };
    // USAGE: const date = periodBar.getSelectedDate(); // { year: 2026, month: 10 }

    // With motion: it drops in from above (1) / goes up (0). (box.visible: at once, without motion)
    box.setVisible = function (isVisible) {
        const value = basic.isOn(isVisible) ? 1 : 0;
        if (box.isVisible === value) return;
        box.isVisible = value;
        showVisibility();
    };
    // USAGE: periodBar.setVisible(0)

    box.focus = function () {
        box.elem.focus({ preventScroll: true });
    };

    // *** OBJECT VIEW:

    const pillSize = "calc(100% - " + (_s.pill.space * 2) + "px)";

    // BOX: The white capsule
    box.pill = Box({
        left: _s.pill.space,
        top: _s.pill.space,
        width: pillSize,
        height: pillSize,
        color: _s.pill.color,
        round: _s.pill.round,
        border: _s.pill.border,
        borderColor: _s.pill.borderColor,
    });

    // BOX: The months (over the capsule, in its shape: a month that comes in or leaves is cut at its edge)
    box.itemsBox = Box({
        left: _s.pill.space,
        top: _s.pill.space,
        width: pillSize,
        height: pillSize,
        color: "transparent",
        round: _s.pill.round,
    });
    box.itemsBox.aria = { live: "polite" };

    // LABEL: The buttons (over the months: a month passes under them)
    box.btnPrevious = createSideButton("left");
    box.btnNext = createSideButton("right");

    // *** OBJECT INIT CODE:

    box.role = "group";
    box.aria = { label: box.ariaLabel || texts.group };
    box.tabIndex = 0;

    // WHY: The ring goes around the capsule, not around the transparent box: a :focus-visible rule of the box paints it.
    basic.addCss("period-bar-css",
        ".period-bar:focus { outline: none; }" +
        ".period-bar:focus-visible > .period-bar-pill { box-shadow: var(--period-bar-ring); }");
    box.elem.classList.add("period-bar");
    box.pill.elem.classList.add("period-bar-pill");
    box.css.setProperty("--period-bar-ring", "0 0 0 " + _s.focus.ringWidth + "px " + _s.focus.ringColor);

    box.btnPrevious.on("click", function () { box.selectPrevious(); });
    box.btnNext.on("click", function () { box.selectNext(); });
    box.on("keydown", onKeyDown);
    box.clickable = 0; // WHY: on() made the box clickable; its transparent sides must let the clicks go to the page.

    box.value = toIndex(box.value); // WHY: null (or a number out of the list) becomes a month of the list.
    createItems();
    paintButtons();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

// The texts of a language. The month names are the ones of basic.js.
// USAGE: PeriodBar.TEXTS.de = { today: "HEUTE", lastMonth: "LETZTER MONAT", monthsAgo: "VOR {n} MONATEN", months: [...], ... }
PeriodBar.TEXTS = {
    en: {
        today: "TODAY",
        lastMonth: "LAST MONTH",
        monthsAgo: "{n} MONTHS AGO",
        months: basic.months,
        group: "Month",
        previous: "Previous month",
        next: "Next month",
    },
    tr: {
        today: "BUGÜN",
        lastMonth: "GEÇEN AY",
        monthsAgo: "{n} AY ÖNCE",
        months: basic.aylar,
        group: "Ay",
        previous: "Önceki ay",
        next: "Sonraki ay",
    },
};

PeriodBar.getTexts = function (language) {
    const texts = PeriodBar.TEXTS[language];
    if (texts) return texts;
    console.warn("PeriodBar: No texts for the language: " + language);
    return PeriodBar.TEXTS.en;
};

// The months of the bar, the oldest first: [{ year, month (1-12), titleText, nameText }]
// USAGE: PeriodBar.getPeriods(3, PeriodBar.TEXTS.en) // September, LAST MONTH October, TODAY 1 November
PeriodBar.getPeriods = function (monthCount, texts, today = new Date()) {
    const periods = [];
    for (let monthsAgo = monthCount - 1; monthsAgo >= 0; monthsAgo--) {
        // WHY: Day 1: a month back from the 31st must not jump over a short month.
        const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
        periods.push({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            titleText: PeriodBar.getTitleText(monthsAgo, texts),
            nameText: PeriodBar.getNameText(date, monthsAgo, today, texts),
        });
    }
    return periods;
};

// "TODAY", "LAST MONTH", "2 MONTHS AGO"
PeriodBar.getTitleText = function (monthsAgo, texts) {
    if (monthsAgo === 0) return texts.today;
    if (monthsAgo === 1) return texts.lastMonth;
    return texts.monthsAgo.replace("{n}", monthsAgo);
};

// "1 November" (this month: the day of today), "October", "December 2025" (another year)
PeriodBar.getNameText = function (date, monthsAgo, today, texts) {
    const monthName = texts.months[date.getMonth()];
    if (monthsAgo === 0) return today.getDate() + " " + monthName;
    if (date.getFullYear() !== today.getFullYear()) return monthName + " " + date.getFullYear();
    return monthName;
};

// side: "left" or "right". line: the width of the line on a 24 px grid.
PeriodBar.getChevronSvg = function (side, color, size, line) {
    const path = (side === "left") ? "M15.25 5.5 8.75 12l6.5 6.5" : "M8.75 5.5 15.25 12l-6.5 6.5";
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24"' +
        ' fill="none" stroke="' + color + '" stroke-width="' + line + '" stroke-linecap="round" stroke-linejoin="round"' +
        ' aria-hidden="true"><path d="' + path + '"/></svg>';
};
