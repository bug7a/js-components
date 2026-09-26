/* Bismillah */

/*

Select Date - v26.09

UI COMPONENT TEMPLATE
- A date picker: a field that opens a calendar panel (popup), or an always visible calendar (inline: 1).
- Day view and month/year view (click the title).
- Supports: minDate, maxDate, first day of week, date format, language (en, tr),
  Today/Clear buttons, enabled, keyboard navigation.
- Everything is drawn with code (no image files needed).

Keyboard (when the calendar is focused):
- Arrow keys: move day, PageUp/PageDown: move month, Enter/Space: select, Escape: close.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SelectDateDefaults = {
    key: "0",
    width: 220, // Field width (not used if inline: 1)
    height: 44, // Field height (not used if inline: 1)
    date: null, // Date, "YYYY-MM-DD" or null
    minDate: null, // Date, "YYYY-MM-DD" or null
    maxDate: null, // Date, "YYYY-MM-DD" or null
    format: "DD.MM.YYYY", // Tokens: YYYY, MMMM, MMM, MM, M, DD, D, dddd, ddd
    language: "en", // "en", "tr"
    firstDayOfWeek: 1, // 0: Sunday, 1: Monday
    placeholder: "", // Empty: uses the language text
    inline: 0, // 1: Calendar is always visible, no field.
    enabled: 1,
    closeOnSelect: 1,
    showTodayButton: 1,
    showClearButton: 1,
    onChange: function (self) { }, // self.date (Date or null), self.value ("YYYY-MM-DD"), self.dateText
    onOpen: function (self) { },
    onClose: function (self) { },
    style: {
        field: {
            color: White(1),
            border: 1,
            borderColor: Black(0.2),
            round: 6,
            padding: [12, 0],
        },
        fieldHover: {
            borderColor: Black(0.5),
        },
        fieldFocus: {
            borderColor: "#141414",
        },
        fieldText: {
            fontSize: 16,
            textColor: Black(0.85),
        },
        placeholder: {
            textColor: Black(0.4),
        },
        icon: {
            color: Black(0.55),
        },
        panel: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 10,
            padding: 12,
            shadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        },
        title: {
            fontSize: 16,
            textColor: Black(0.85),
            fontFamily: "opensans-bold",
        },
        arrow: {
            color: Black(0.6),
            hoverColor: Black(0.06),
        },
        weekDay: {
            fontSize: 12,
            textColor: Black(0.45),
        },
        day: {
            size: 36,
            round: 100,
            fontSize: 14,
            textColor: Black(0.85),
            hoverColor: Black(0.06),
        },
        today: {
            borderColor: Black(0.35),
        },
        selectedDay: {
            color: "#141414",
            textColor: White(1),
        },
        disabledDay: {
            textColor: Black(0.2),
        },
        footerButton: {
            fontSize: 13,
            textColor: "#3871E0",
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const SelectDate = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SelectDateDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    if (params.inline == 1) {
        params.width = "auto";
        params.height = "auto";
    }

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const texts = SelectDate.languages[box.language] || SelectDate.languages.en;
    const _s = box.style;
    const daySize = _s.day.size;
    const innerWidth = daySize * 7;

    let view = "days"; // "days", "months"
    let viewYear, viewMonth; // Visible month
    let focusDate = null; // Keyboard focus in the day view
    let isOpen = 0;
    let isMouseOver = 0;
    let dayCells = [];
    let monthCells = [];

    // *** PUBLIC VARIABLES:
    // [var] Selected date (Date or null)
    box.date = SelectDate.parse(box.date);
    box.minDate = SelectDate.parse(box.minDate);
    box.maxDate = SelectDate.parse(box.maxDate);
    // [var] "YYYY-MM-DD" or ""
    box.value = "";
    // [var] Formatted text or "" (WHY: not "text", Box.text changes innerHTML)
    box.dateText = "";

    // *** PRIVATE FUNCTIONS:

    const dayNumber = function (date) {
        return (date) ? (date.getFullYear() * 10000) + (date.getMonth() * 100) + date.getDate() : 0;
    };

    const isSameDay = function (a, b) {
        return a && b && dayNumber(a) == dayNumber(b);
    };

    const isInRange = function (date) {
        if (box.minDate && dayNumber(date) < dayNumber(box.minDate)) return false;
        if (box.maxDate && dayNumber(date) > dayNumber(box.maxDate)) return false;
        return true;
    };

    const setView = function (year, month) {
        const d = new Date(year, month, 1);
        viewYear = d.getFullYear();
        viewMonth = d.getMonth();
    };

    // Create objects inside a container, after the component is created.
    const createIn = function (container, func) {
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
        func();
        setDefaultContainerBox(previous);
    };

    const updateValue = function () {
        box.value = (box.date) ? SelectDate.format(box.date, "YYYY-MM-DD") : "";
        box.dateText = (box.date) ? SelectDate.format(box.date, box.format, box.language) : "";
    };

    const updateField = function () {

        if (box.inline == 1) return;

        if (box.date) {
            box.fieldText.text = box.dateText;
            box.fieldText.textColor = _s.fieldText.textColor;
        } else {
            box.fieldText.text = box.placeholder || texts.placeholder;
            box.fieldText.textColor = _s.placeholder.textColor;
        }

        let borderColor = _s.field.borderColor;
        if (isMouseOver && box.enabled == 1) borderColor = _s.fieldHover.borderColor;
        if (isOpen) borderColor = _s.fieldFocus.borderColor;
        box.field.borderColor = borderColor;

        box.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
        box.elem.style.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.elem.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.elem.setAttribute("aria-expanded", (isOpen) ? "true" : "false");
        box.elem.setAttribute("aria-disabled", (box.enabled == 1) ? "false" : "true");

    };

    const clearCells = function (list) {
        list.forEach(function (cell) { cell.remove(); });
        return [];
    };

    // Draw an arrow with borders. (direction: -1 left, 1 right)
    const createArrowButton = function (direction) {

        const btn = HGroup({
            width: 32,
            height: 32,
            round: 100,
            color: "transparent",
        });
        btn.elem.style.cursor = "pointer";
        btn.setMotion("background-color 0.15s");

        Box({
            width: 8,
            height: 8,
            color: "transparent",
        });
        that.elem.style.borderLeft = "2px solid " + _s.arrow.color;
        that.elem.style.borderBottom = "2px solid " + _s.arrow.color;
        that.elem.style.transform = "rotate(" + ((direction < 0) ? 45 : 225) + "deg)";
        that.elem.style.marginLeft = ((direction < 0) ? 3 : -3) + "px";

        endGroup();

        btn.on("mouseover", function () { btn.color = _s.arrow.hoverColor; });
        btn.on("mouseout", function () { btn.color = "transparent"; });
        btn.on("click", function () { moveView(direction); });

        return btn;

    };

    // Move the visible month (days view) or year (months view).
    const moveView = function (direction) {
        if (box.enabled != 1) return;
        if (view == "days") {
            setView(viewYear, viewMonth + direction);
        } else {
            setView(viewYear + direction, viewMonth);
        }
        renderPanel();
    };

    const renderDays = function () {

        dayCells = clearCells(dayCells);

        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const emptyCount = (firstDay - box.firstDayOfWeek + 7) % 7;
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const today = new Date();

        createIn(box.daysBox, function () {

            // Empty cells before the first day.
            for (let i = 0; i < emptyCount; i++) {
                dayCells.push(Box({ width: daySize, height: daySize, color: "transparent" }));
            }

            for (let d = 1; d <= daysInMonth; d++) {

                const date = new Date(viewYear, viewMonth, d);
                const selected = isSameDay(date, box.date);
                const enabled = isInRange(date);
                const focused = isSameDay(date, focusDate);

                const cell = Label({
                    width: daySize,
                    height: daySize,
                    text: String(d),
                    textAlign: "center",
                    fontSize: _s.day.fontSize,
                    round: _s.day.round,
                    textColor: _s.day.textColor,
                    color: "transparent",
                });
                cell.elem.style.lineHeight = daySize + "px";
                cell.setMotion("background-color 0.15s");

                if (isSameDay(date, today)) {
                    cell.border = 1;
                    cell.borderColor = _s.today.borderColor;
                    cell.elem.style.lineHeight = (daySize - 2) + "px";
                }

                if (selected) {
                    cell.color = _s.selectedDay.color;
                    cell.textColor = _s.selectedDay.textColor;
                } else if (focused) {
                    cell.color = _s.day.hoverColor;
                }

                if (!enabled) {
                    cell.textColor = _s.disabledDay.textColor;
                } else {
                    cell.elem.style.cursor = "pointer";
                    cell.on("click", function () { selectDate(date); });
                    if (!selected) {
                        cell.on("mouseover", function () { cell.color = _s.day.hoverColor; });
                        cell.on("mouseout", function () {
                            cell.color = (isSameDay(date, focusDate)) ? _s.day.hoverColor : "transparent";
                        });
                    }
                }

                dayCells.push(cell);

            }

        });

    };

    const renderMonths = function () {

        monthCells = clearCells(monthCells);

        createIn(box.monthsBox, function () {

            texts.monthsShort.forEach(function (name, month) {

                const first = new Date(viewYear, month, 1);
                const last = new Date(viewYear, month + 1, 0);
                const enabled = isInRange(first) || isInRange(last)
                    || (box.minDate && box.maxDate && dayNumber(first) <= dayNumber(box.minDate) && dayNumber(last) >= dayNumber(box.maxDate));
                const selected = box.date && box.date.getFullYear() == viewYear && box.date.getMonth() == month;

                const cell = Label({
                    width: Math.floor(innerWidth / 3),
                    height: 48,
                    text: name,
                    textAlign: "center",
                    fontSize: _s.day.fontSize,
                    round: 8,
                    textColor: (enabled) ? _s.day.textColor : _s.disabledDay.textColor,
                    color: (selected) ? _s.selectedDay.color : "transparent",
                });
                cell.elem.style.lineHeight = "48px";
                if (selected) cell.textColor = _s.selectedDay.textColor;

                if (enabled) {
                    cell.elem.style.cursor = "pointer";
                    cell.setMotion("background-color 0.15s");
                    cell.on("click", function () {
                        setView(viewYear, month);
                        view = "days";
                        renderPanel();
                    });
                    if (!selected) {
                        cell.on("mouseover", function () { cell.color = _s.day.hoverColor; });
                        cell.on("mouseout", function () { cell.color = "transparent"; });
                    }
                }

                monthCells.push(cell);

            });

        });

    };

    const renderPanel = function () {

        if (view == "days") {
            box.title.text = texts.months[viewMonth] + " " + viewYear;
            box.weekRow.visible = 1;
            box.daysBox.visible = 1;
            box.monthsBox.visible = 0;
            renderDays();
        } else {
            box.title.text = String(viewYear);
            box.weekRow.visible = 0;
            box.daysBox.visible = 0;
            box.monthsBox.visible = 1;
            renderMonths();
        }

        box.todayButton.visible = (box.showTodayButton == 1 && isInRange(new Date())) ? 1 : 0;
        box.clearButton.visible = (box.showClearButton == 1 && box.date) ? 1 : 0;
        box.footer.visible = (box.showTodayButton == 1 || box.showClearButton == 1) ? 1 : 0;

        if (box.inline == 1) {
            box.panel.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
            box.panel.clickable = (box.enabled == 1) ? 1 : 0;
        }

    };

    // User selected a date. (click, Enter, Today)
    const selectDate = function (date) {
        if (box.enabled != 1) return;
        box.setDate(date);
        if (box.inline != 1 && box.closeOnSelect == 1) {
            box.close();
            box.elem.focus();
        }
    };

    // Position the popup panel under (or above) the field.
    const positionPanel = function () {

        const rect = box.elem.getBoundingClientRect();
        const panelWidth = box.panel.elem.offsetWidth;
        const panelHeight = box.panel.elem.offsetHeight;
        const space = 6;

        let left = withPageZoom(rect.left);
        let top = withPageZoom(rect.bottom) + space;

        if (top + panelHeight > page.height - 8) {
            top = withPageZoom(rect.top) - panelHeight - space; // Open above
        }
        top = Math.max(8, top);
        left = Math.max(8, Math.min(left, page.width - panelWidth - 8));

        box.panel.left = left;
        box.panel.top = top;

    };

    const onPageResize = function () {
        if (isOpen) box.close();
    };

    const onKeyDown = function (self, event) {

        if (box.enabled != 1) return;

        // Field is focused and panel is closed:
        if (box.inline != 1 && !isOpen) {
            if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                event.preventDefault();
                box.open();
            }
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            if (view == "months") {
                view = "days";
                renderPanel();
            } else if (box.inline != 1) {
                box.close();
                box.elem.focus();
            }
            return;
        }

        if (view != "days") return;

        const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
        let next = null;

        if (moves[event.key]) {
            next = new Date(focusDate.getFullYear(), focusDate.getMonth(), focusDate.getDate() + moves[event.key]);
        } else if (event.key === "PageUp" || event.key === "PageDown") {
            next = new Date(focusDate.getFullYear(), focusDate.getMonth() + ((event.key === "PageUp") ? -1 : 1), 1);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (isInRange(focusDate)) selectDate(focusDate);
            return;
        } else {
            return;
        }

        event.preventDefault();
        focusDate = next;
        setView(focusDate.getFullYear(), focusDate.getMonth());
        renderPanel();

    };

    // *** PUBLIC FUNCTIONS:

    box.setDate = function (date, silent = 0) {

        const newDate = SelectDate.parse(date);
        if (newDate && !isInRange(newDate)) return false;
        if (dayNumber(newDate) == dayNumber(box.date)) return true;

        box.date = newDate;
        updateValue();

        if (newDate) {
            focusDate = new Date(newDate);
            setView(newDate.getFullYear(), newDate.getMonth());
        }

        updateField();
        renderPanel();

        if (!silent) box.onChange(box);
        return true;

    };
    // USAGE: picker.setDate("2026-09-14"), picker.setDate(new Date()), picker.setDate(null)
    // NOTE: setDate(date, 1) changes the value without calling onChange. Returns false if out of range.

    box.getDate = function () {
        return (box.date) ? new Date(box.date) : null;
    };

    box.open = function () {

        if (box.inline == 1 || isOpen || box.enabled != 1) return;
        isOpen = 1;

        view = "days";
        focusDate = (box.date) ? new Date(box.date) : new Date();
        setView(focusDate.getFullYear(), focusDate.getMonth());
        renderPanel();

        box.overlay.visible = 1;
        box.panel.visible = 1;
        positionPanel();
        box.panel.elem.focus();

        updateField();
        box.onOpen(box);

    };

    box.close = function () {

        if (box.inline == 1 || !isOpen) return;
        isOpen = 0;

        box.overlay.visible = 0;
        box.panel.visible = 0;

        updateField();
        box.onClose(box);

    };

    box.toggle = function () {
        (isOpen) ? box.close() : box.open();
    };

    box.isOpen = function () {
        return isOpen;
    };

    box.setEnabled = function (enabled) {
        box.enabled = (enabled == 1 || enabled === true) ? 1 : 0;
        if (box.enabled != 1) box.close();
        updateField();
        renderPanel();
    };
    // USAGE: get: picker.enabled, set: picker.setEnabled(0)

    box.setMinDate = function (date) {
        box.minDate = SelectDate.parse(date);
        renderPanel();
    };

    box.setMaxDate = function (date) {
        box.maxDate = SelectDate.parse(date);
        renderPanel();
    };

    box.refresh = function () {
        updateValue();
        updateField();
        renderPanel();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        page.remove_onResize(onPageResize);

        // Remove objects that were moved to the page.
        if (box.inline != 1) {
            box.overlay.remove();
            box.panel.remove();
        }

        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;

    };

    // *** OBJECT VIEW:
    box.elem.style.outline = "none";
    box.elem.style.userSelect = "none";

    // FIELD: (only popup mode)
    if (box.inline != 1) {

        box.clickable = 1;
        box.elem.setAttribute("role", "combobox");

        box.field = HGroup({
            width: "100%",
            height: "100%",
            align: "left center",
            gap: 8,
            ..._s.field,
        });
        box.field.setMotion("border-color 0.15s");

        // LABEL: Selected date text
        box.fieldText = Label({
            width: "auto",
            fontSize: _s.fieldText.fontSize,
            textColor: _s.fieldText.textColor,
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.textOverflow = "ellipsis";
        that.elem.style.flexGrow = "1";

        // BOX: Calendar icon (drawn)
        box.icon = startBox({
            width: 18,
            height: 18,
            color: "transparent",
            border: 2,
            borderColor: _s.icon.color,
            round: 4,
        });
        Box({ left: 0, top: 3, width: "100%", height: 2, color: _s.icon.color });
        Box({ left: 3, top: 8, width: 3, height: 3, color: _s.icon.color });
        Box({ left: 8, top: 8, width: 3, height: 3, color: _s.icon.color });
        endBox();
        box.icon.elem.style.flexShrink = "0";

        endGroup();

    }

    // POPUP: Create the overlay and the panel on the page, over everything.
    // WHY: Creating them directly on the page is safer than moving them later.
    if (box.inline != 1) {

        setDefaultContainerBox(page);
        // NOTE: endGroup() of the panel below returns the default container to the component box.

        // BOX: Transparent overlay (click outside: close)
        box.overlay = Box(0, 0, "100%", "100%", { color: "transparent" });
        box.overlay.elem.style.position = "fixed";
        box.overlay.elem.style.zIndex = "1000";
        box.overlay.on("click", function () { box.close(); });

    }

    // BOX: Calendar panel
    box.panel = VGroup({
        width: innerWidth + (_s.panel.padding * 2) + (_s.panel.border * 2),
        height: "auto",
        align: "left top",
        gap: 6,
        color: _s.panel.color,
        border: _s.panel.border,
        borderColor: _s.panel.borderColor,
        round: _s.panel.round,
        padding: _s.panel.padding,
    });
    box.panel.elem.style.boxShadow = _s.panel.shadow;
    box.panel.elem.style.outline = "none";
    box.panel.elem.tabIndex = -1;
    box.panel.clickable = 1;
    box.panel.elem.setAttribute("role", "dialog");

        // GROUP: Header (prev, title, next)
        HGroup({
            width: innerWidth,
            height: 36,
            align: "center",
        });

            box.prevButton = createArrowButton(-1);

            // LABEL: Month and year (click: months view)
            box.title = Label({
                width: innerWidth - 64,
                height: 32,
                textAlign: "center",
                round: 6,
                ..._s.title,
            });
            box.title.elem.style.lineHeight = "32px";
            box.title.elem.style.cursor = "pointer";
            box.title.setMotion("background-color 0.15s");
            box.title.on("click", function () {
                if (box.enabled != 1) return;
                view = (view == "days") ? "months" : "days";
                renderPanel();
            });
            box.title.on("mouseover", function () { box.title.color = _s.arrow.hoverColor; });
            box.title.on("mouseout", function () { box.title.color = "transparent"; });

            box.nextButton = createArrowButton(1);

        endGroup();

        // GROUP: Week days
        box.weekRow = HGroup({
            width: innerWidth,
            height: 24,
        });

            for (let i = 0; i < 7; i++) {
                Label({
                    width: daySize,
                    text: texts.weekDaysShort[(i + box.firstDayOfWeek) % 7],
                    textAlign: "center",
                    ..._s.weekDay,
                });
            }

        endGroup();

        // GROUP: Days (created by renderDays)
        box.daysBox = AutoLayout({
            width: innerWidth,
            height: "auto",
            align: "left top",
            flexWrap: "wrap",
        });
        endGroup();

        // GROUP: Months (created by renderMonths)
        box.monthsBox = AutoLayout({
            width: innerWidth,
            height: "auto",
            align: "left top",
            flexWrap: "wrap",
            rowGap: "4px",
        });
        endGroup();

        // GROUP: Footer (Today, Clear)
        box.footer = HGroup({
            width: innerWidth,
            height: 38,
            justifyContent: "space-between",
            alignItems: "center",
        });
        box.footer.elem.style.borderTop = "1px solid " + Black(0.08);
        box.footer.elem.style.paddingTop = "6px";

            box.todayButton = Label({
                text: texts.today,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.todayButton.elem.style.cursor = "pointer";
            box.todayButton.on("click", function () { selectDate(new Date()); });

            box.clearButton = Label({
                text: texts.clear,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.clearButton.elem.style.cursor = "pointer";
            box.clearButton.elem.style.marginLeft = "auto";
            box.clearButton.on("click", function () {
                box.setDate(null);
                if (box.inline != 1) {
                    box.close();
                    box.elem.focus();
                }
            });

        endGroup();

    endGroup();

    if (box.inline != 1) {
        box.panel.elem.style.zIndex = "1001";
        box.overlay.visible = 0;
        box.panel.visible = 0;
    }

    // *** OBJECT INIT CODE:

    if (box.inline != 1) {

        box.on("click", function () { box.toggle(); });
        box.on("keydown", onKeyDown);

        box.on("mouseover", function () {
            isMouseOver = 1;
            updateField();
        });

        box.on("mouseout", function () {
            isMouseOver = 0;
            updateField();
        });

        page.onResize(onPageResize);

    } else {
        box.panel.elem.tabIndex = 0;
        // WHY: Component size is "auto". A relative panel makes the container wrap it.
        box.panel.position = "relative";
    }

    box.panel.on("keydown", onKeyDown);
    // WHY: Keep the keyboard focus on the panel when a day is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    const _start = box.date || new Date();
    focusDate = new Date(_start);
    setView(_start.getFullYear(), _start.getMonth());
    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;

    updateValue();
    updateField();
    renderPanel();

    return endObject(box);

};

// *** STATIC FUNCTIONS AND DATA:

SelectDate.languages = {
    en: {
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        weekDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        weekDaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
        placeholder: "Select date",
        today: "Today",
        clear: "Clear",
    },
    tr: {
        months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
        monthsShort: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
        weekDays: ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
        weekDaysShort: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
        placeholder: "Tarih seçin",
        today: "Bugün",
        clear: "Temizle",
    },
};
// NOTE: Add a new language: SelectDate.languages.de = { ... }

// Converts Date or "YYYY-MM-DD" to a Date (time: 00:00). Returns null if not valid.
SelectDate.parse = function (value) {

    if (!value) return null;

    if (value instanceof Date) {
        return (isNaN(value)) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(value).trim());
    if (!match) return null;

    const date = new Date(num(match[1]), num(match[2]) - 1, num(match[3]));
    // WHY: new Date(2026, 1, 31) becomes March 3. Invalid dates are not accepted.
    if (date.getMonth() != num(match[2]) - 1) return null;

    return date;

};
// USAGE: SelectDate.parse("2026-09-14")

// Formats a date. Tokens: YYYY, MMMM, MMM, MM, M, DD, D, dddd, ddd
SelectDate.format = function (date, format = "DD.MM.YYYY", language = "en") {

    if (!date) return "";
    const texts = SelectDate.languages[language] || SelectDate.languages.en;

    const tokens = {
        YYYY: String(date.getFullYear()),
        MMMM: texts.months[date.getMonth()],
        MMM: texts.monthsShort[date.getMonth()],
        MM: String(twoDigitFormat(date.getMonth() + 1)),
        M: String(date.getMonth() + 1),
        DD: String(twoDigitFormat(date.getDate())),
        D: String(date.getDate()),
        dddd: texts.weekDays[date.getDay()],
        ddd: texts.weekDaysShort[date.getDay()],
    };

    return format.replace(/YYYY|MMMM|MMM|MM|M|DD|D|dddd|ddd/g, function (token) {
        return tokens[token];
    });

};
// USAGE: SelectDate.format(new Date(), "D MMMM YYYY, dddd", "tr")
