/* Bismillah */

/*

Select Date - v26.09

UI COMPONENT TEMPLATE
- A date picker: a field that opens a calendar panel (popup), or an always visible calendar (inline: 1).
- Day view and month/year view (click the title).
- Supports: minDate, maxDate, first day of week, date format, language (en, tr),
  Today/Clear buttons, enabled, keyboard navigation.
- Everything is drawn with code (no image files needed).
- Style packages: "classic" (default), "dark". Select with styleName. (SelectDate.styles)

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
    styleName: "classic", // "classic", "dark" or a name added to SelectDate.styles
    style: { // Classic style package (default)
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
        divider: {
            color: Black(0.08), // The line above the footer buttons
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const SelectDate = function (params = {}) {

    // Merge style package: params.style > SelectDate.styles[styleName] > SelectDateDefaults.style (classic)
    basic.applyStylePackage(params, SelectDate.styles, SelectDateDefaults);

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
    const PANEL_GAP = 6; // px between the field and the panel
    const SCREEN_MARGIN = 8; // px: the panel stays this far from the edges of the page
    const ARROW_BUTTON_SIZE = 32;
    const TITLE_HEIGHT = 32;
    const MONTH_CELL_HEIGHT = 48;
    const OVERLAY_Z_INDEX = 1000;
    const PANEL_Z_INDEX = 1001;

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
        box.cursor = (box.enabled == 1) ? "pointer" : "default";
        box.tabIndex = (box.enabled == 1) ? 0 : -1;
        box.aria = {
            expanded: (isOpen) ? "true" : "false",
            disabled: (box.enabled == 1) ? "false" : "true",
        };

    };

    const clearCells = function (list) {
        list.forEach(function (cell) { cell.remove(); });
        return [];
    };

    // Draw an arrow with borders. (direction: -1 left, 1 right)
    const createArrowButton = function (direction) {

        const isLeft = (direction < 0);

        const btn = HGroup({
            width: ARROW_BUTTON_SIZE,
            height: ARROW_BUTTON_SIZE,
            round: 100,
            color: "transparent",
        });
        btn.cursor = "pointer";
        btn.setMotion("background-color 0.15s");

        Box({
            width: 8,
            height: 8,
            color: "transparent",
        });
        that.css = {
            borderLeft: "2px solid " + _s.arrow.color,
            borderBottom: "2px solid " + _s.arrow.color,
            transform: "rotate(" + ((isLeft) ? 45 : 225) + "deg)",
            marginLeft: ((isLeft) ? 3 : -3) + "px",
        };

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

    // A day of the visible month: selected, today, out of the range, keyboard focus.
    const createDayCell = function (date, today) {

        const selected = isSameDay(date, box.date);
        const enabled = isInRange(date);
        const focused = isSameDay(date, focusDate);

        const cell = Label({
            width: daySize,
            height: daySize,
            text: String(date.getDate()),
            textAlign: "center",
            fontSize: _s.day.fontSize,
            round: _s.day.round,
            textColor: _s.day.textColor,
            color: "transparent",
        });
        cell.lineHeight = daySize + "px";
        cell.setMotion("background-color 0.15s");

        if (isSameDay(date, today)) {
            cell.border = 1;
            cell.borderColor = _s.today.borderColor;
            cell.lineHeight = (daySize - 2) + "px"; // WHY: The border (1 px at the top and the bottom) is inside the cell.
        }

        if (selected) {
            cell.color = _s.selectedDay.color;
            cell.textColor = _s.selectedDay.textColor;
        } else if (focused) {
            cell.color = _s.day.hoverColor;
        }

        if (!enabled) {
            cell.textColor = _s.disabledDay.textColor;
            return cell;
        }

        cell.cursor = "pointer";
        cell.on("click", function () { selectDate(date); });
        if (!selected) {
            cell.on("mouseover", function () { cell.color = _s.day.hoverColor; });
            cell.on("mouseout", function () {
                cell.color = (isSameDay(date, focusDate)) ? _s.day.hoverColor : "transparent";
            });
        }

        return cell;

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
                dayCells.push(createDayCell(new Date(viewYear, viewMonth, d), today));
            }

        });

    };

    // A month can be selected if one of its days is in the range.
    const isMonthEnabled = function (month) {
        const first = new Date(viewYear, month, 1);
        const last = new Date(viewYear, month + 1, 0);
        if (isInRange(first) || isInRange(last)) return true;
        // WHY: The whole range can be inside the month (its first and last days are out of it).
        return box.minDate && box.maxDate && dayNumber(first) <= dayNumber(box.minDate) && dayNumber(last) >= dayNumber(box.maxDate);
    };

    const createMonthCell = function (name, month) {

        const enabled = isMonthEnabled(month);
        const selected = box.date && box.date.getFullYear() == viewYear && box.date.getMonth() == month;

        const cell = Label({
            width: Math.floor(innerWidth / 3),
            height: MONTH_CELL_HEIGHT,
            text: name,
            textAlign: "center",
            fontSize: _s.day.fontSize,
            round: 8,
            textColor: (enabled) ? _s.day.textColor : _s.disabledDay.textColor,
            color: (selected) ? _s.selectedDay.color : "transparent",
        });
        cell.lineHeight = MONTH_CELL_HEIGHT + "px";
        if (selected) cell.textColor = _s.selectedDay.textColor;

        if (!enabled) return cell;

        cell.cursor = "pointer";
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

        return cell;

    };

    const renderMonths = function () {

        monthCells = clearCells(monthCells);

        createIn(box.monthsBox, function () {
            texts.monthsShort.forEach(function (name, month) {
                monthCells.push(createMonthCell(name, month));
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

        let left = withPageZoom(rect.left);
        let top = withPageZoom(rect.bottom) + PANEL_GAP;

        if (top + panelHeight > page.height - SCREEN_MARGIN) {
            top = withPageZoom(rect.top) - panelHeight - PANEL_GAP; // Open above
        }
        top = Math.max(SCREEN_MARGIN, top);
        left = Math.max(SCREEN_MARGIN, Math.min(left, page.width - panelWidth - SCREEN_MARGIN));

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
        box.enabled = basic.isOn(enabled) ? 1 : 0;
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


    // *** OBJECT VIEW:
    box.css = { outline: "none", userSelect: "none" };

    // FIELD: (only popup mode)
    if (box.inline != 1) {

        box.clickable = 1;
        box.role = "combobox";

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
        that.css = { whiteSpace: "nowrap", textOverflow: "ellipsis" };
        that.grow = 1;

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
        box.icon.shrink = 0;

        endGroup();

    }

    // POPUP: Create the overlay and the panel on the page, over everything.
    // WHY: Creating them directly on the page is safer than moving them later.
    if (box.inline != 1) {

        setDefaultContainerBox(page);
        // NOTE: endGroup() of the panel below returns the default container to the component box.

        // BOX: Transparent overlay (click outside: close)
        box.overlay = Box(0, 0, "100%", "100%", { color: "transparent" });
        box.overlay.css.position = "fixed";
        box.overlay.zIndex = OVERLAY_Z_INDEX;
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
    box.panel.boxShadow = _s.panel.shadow;
    box.panel.css.outline = "none";
    box.panel.tabIndex = -1;
    box.panel.clickable = 1;
    box.panel.role = "dialog";

        // GROUP: Header (prev, title, next)
        HGroup({
            width: innerWidth,
            height: 36,
            align: "center",
        });

            box.prevButton = createArrowButton(-1);

            // LABEL: Month and year (click: months view)
            box.title = Label({
                width: innerWidth - (ARROW_BUTTON_SIZE * 2),
                height: TITLE_HEIGHT,
                textAlign: "center",
                round: 6,
                ..._s.title,
            });
            box.title.lineHeight = TITLE_HEIGHT + "px";
            box.title.cursor = "pointer";
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
        box.footer.css = {
            borderTop: "1px solid " + _s.divider.color,
            paddingTop: "6px",
        };

            box.todayButton = Label({
                text: texts.today,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.todayButton.cursor = "pointer";
            box.todayButton.on("click", function () { selectDate(new Date()); });

            box.clearButton = Label({
                text: texts.clear,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.clearButton.cursor = "pointer";
            box.clearButton.css.marginLeft = "auto";
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
        box.panel.zIndex = PANEL_Z_INDEX;
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

        // (onPageResize / own: the overlay and the panel are on the page, they are removed with the box)
        box.onPageResize(onPageResize);
        box.own(box.overlay);
        box.own(box.panel);

    } else {
        box.panel.tabIndex = 0;
        // WHY: Component size is "auto". A relative panel makes the container wrap it.
        box.panel.position = "relative";
    }

    box.panel.on("keydown", onKeyDown);
    // WHY: Keep the keyboard focus on the panel when a day is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    const startDate = box.date || new Date();
    focusDate = new Date(startDate);
    setView(startDate.getFullYear(), startDate.getMonth());
    box.enabled = basic.isOn(box.enabled) ? 1 : 0;

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

    const date = new Date(basic.num(match[1]), basic.num(match[2]) - 1, basic.num(match[3]));
    // WHY: new Date(2026, 1, 31) becomes March 3. Invalid dates are not accepted.
    if (date.getMonth() != basic.num(match[2]) - 1) return null;

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
        MM: String(basic.twoDigitFormat(date.getMonth() + 1)),
        M: String(date.getMonth() + 1),
        DD: String(basic.twoDigitFormat(date.getDate())),
        D: String(date.getDate()),
        dddd: texts.weekDays[date.getDay()],
        ddd: texts.weekDaysShort[date.getDay()],
    };

    return format.replace(/YYYY|MMMM|MMM|MM|M|DD|D|dddd|ddd/g, function (token) {
        return tokens[token];
    });

};
// USAGE: SelectDate.format(new Date(), "D MMMM YYYY, dddd", "tr")

// *** STYLE PACKAGES:
// USAGE: SelectDate({ styleName: "dark" })
// USAGE: SelectDate({ styleName: "dark", style: { field: { round: 4 } } }) // Change only some keys.
// USAGE: SelectDate({ style: SelectDate.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: SelectDate.styles.myStyle = { field: { round: 4 } };
SelectDate.styles = {

    // White, dark text, a soft line.
    classic: SelectDateDefaults.style,

    // Dark theme, same colors as SelectBox "dark".
    dark: {
        field: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.10)", round: 8 },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldText: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)" },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        icon: { color: "rgba(255, 255, 255, 0.55)" },
        panel: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)", shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
        title: { textColor: "rgba(255, 255, 255, 0.90)" },
        arrow: { color: "rgba(255, 255, 255, 0.60)", hoverColor: "rgba(255, 255, 255, 0.08)" },
        weekDay: { textColor: "rgba(255, 255, 255, 0.45)" },
        day: { textColor: "rgba(255, 255, 255, 0.85)", hoverColor: "rgba(255, 255, 255, 0.08)" },
        today: { borderColor: "rgba(255, 255, 255, 0.35)" },
        selectedDay: { color: "#3D7A6B", textColor: "#FFFFFF" },
        disabledDay: { textColor: "rgba(255, 255, 255, 0.20)" },
        footerButton: { textColor: "#65A293" },
        divider: { color: "rgba(255, 255, 255, 0.08)" },
    },

};
