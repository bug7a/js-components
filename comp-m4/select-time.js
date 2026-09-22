/* Bismillah */

/*

Select Time - v26.09

UI COMPONENT TEMPLATE
- A time picker: a field that opens a panel (popup), or an always visible panel (inline: 1).
- The panel has two scrollable columns: hours (00-23) and minutes (with minuteStep).
- The columns scroll with basic/scroll-bar.js (ScrollBar), not with the scrollbar of the browser.
  (useScrollBar: 0, or the file is not loaded: the scrollbar of the browser is used.)
- Supports: minTime, maxTime (also over midnight: 22:00 - 02:00), minuteStep, format,
  language (en, tr), Now/Clear buttons, enabled, keyboard navigation.
- Everything is drawn with code (no image files needed).
- Value: "HH:mm" text. (Ex: "19:30")

Keyboard (when the panel is focused):
- ArrowUp/ArrowDown: change the value of the active column, ArrowLeft/ArrowRight: change the column,
  Enter: close, Escape: close.

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const SelectTimeDefaults = {
    key: "0",
    width: 160, // Field width (not used if inline: 1)
    height: 44, // Field height (not used if inline: 1)
    time: null, // "HH:mm", Date or null
    minTime: null, // "HH:mm" or null
    maxTime: null, // "HH:mm" or null. If it is smaller than minTime, the range goes over midnight.
    minuteStep: 5, // 1, 5, 10, 15, 30...
    format: "HH:mm", // Tokens: HH, H, hh, h, mm, A (AM/PM), a (am/pm)
    language: "en", // "en", "tr"
    placeholder: "", // Empty: uses the language text
    inline: 0, // 1: Panel is always visible, no field.
    enabled: 1,
    closeOnSelect: 1, // 1: Close after a minute is selected.
    useScrollBar: 1, // basic/scroll-bar.js. 0: the scrollbar of the browser.
    showNowButton: 1,
    showClearButton: 1,
    onChange: function (self) { }, // self.value ("19:30" or ""), self.hours, self.minutes (number or null), self.timeText
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
        columnTitle: {
            fontSize: 12,
            textColor: Black(0.45),
            activeTextColor: Black(0.85),
        },
        column: {
            rows: 6, // Visible rows
            gap: 8, // Space between the hours and minutes columns
        },
        scrollBar: { // basic/scroll-bar.js (ScrollBar) parameters of the columns
            bar_color: "#141414",
            bar_mouseOverColor: "#141414",
            bar_width: 4,
            bar_round: 3,
            bar_opacity: 0.2,
            bar_mouseOverOpacity: 0.5,
            bar_padding: 2,
            neverHide: 1, // The column is short: the bar says that there is more to see.
            showDots: 0,
        },
        cell: {
            width: 64,
            height: 36,
            round: 6,
            fontSize: 15,
            textColor: Black(0.85),
            hoverColor: Black(0.06),
        },
        selectedCell: {
            color: "#141414",
            textColor: White(1),
        },
        disabledCell: {
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

const SelectTime = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, SelectTimeDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    if (params.inline == 1) {
        params.width = "auto";
        params.height = "auto";
    }

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const texts = SelectTime.languages[box.language] || SelectTime.languages.en;
    const _s = box.style;
    const cellWidth = _s.cell.width;
    const cellHeight = _s.cell.height;
    const columnHeight = cellHeight * _s.column.rows;
    const innerWidth = (cellWidth * 2) + _s.column.gap;

    let isOpen = 0;
    let isMouseOver = 0;
    let activeColumn = "hours"; // "hours", "minutes" (keyboard)
    let hourCells = []; // index: hour
    let minuteCells = []; // index: position in minuteList
    let minuteList = []; // [0, 5, 10, ...]
    // WHY: The component works without basic/scroll-bar.js too, the file is not loaded on every page.
    const useScrollBar = (box.useScrollBar == 1 && typeof ScrollBar !== "undefined");

    // *** PUBLIC VARIABLES:
    // [var] Selected time: minutes from 00:00 (0 - 1439) or null
    box.minutesOfDay = SelectTime.parse(box.time);
    // [var] number or null
    box.hours = null;
    box.minutes = null;
    // [var] "HH:mm" or ""
    box.value = "";
    // [var] Formatted text or "" (WHY: not "text", Box.text changes innerHTML)
    box.timeText = "";

    box.minTime = SelectTime.parse(box.minTime);
    box.maxTime = SelectTime.parse(box.maxTime);
    box.minuteStep = Math.max(1, Math.min(60, Math.floor(num(box.minuteStep) || 1)));

    // *** PRIVATE FUNCTIONS:

    const isInRange = function (minutesOfDay) {
        const min = box.minTime;
        const max = box.maxTime;
        if (min === null && max === null) return true;
        if (min === null) return minutesOfDay <= max;
        if (max === null) return minutesOfDay >= min;
        if (min <= max) return minutesOfDay >= min && minutesOfDay <= max;
        // WHY: Range over midnight. Ex: 22:00 - 02:00
        return minutesOfDay >= min || minutesOfDay <= max;
    };

    const isHourEnabled = function (hour) {
        return minuteList.some(function (minute) { return isInRange(hour * 60 + minute); });
    };

    const firstEnabledMinute = function (hour) {
        const minute = minuteList.find(function (m) { return isInRange(hour * 60 + m); });
        return (minute === undefined) ? null : minute;
    };

    // Create objects inside a container, after the component is created.
    const createIn = function (container, func) {
        const previous = getDefaultContainerBox();
        setDefaultContainerBox(container);
        func();
        setDefaultContainerBox(previous);
    };

    const updateValue = function () {
        const t = box.minutesOfDay;
        box.hours = (t === null) ? null : Math.floor(t / 60);
        box.minutes = (t === null) ? null : t % 60;
        box.value = (t === null) ? "" : SelectTime.format(t, "HH:mm");
        box.timeText = (t === null) ? "" : SelectTime.format(t, box.format);
    };

    const updateField = function () {

        if (box.inline == 1) return;

        if (box.minutesOfDay !== null) {
            box.fieldText.text = box.timeText;
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

    const createCell = function (text, onClick) {

        const cell = Label({
            width: cellWidth,
            height: cellHeight,
            text: text,
            textAlign: "center",
            fontSize: _s.cell.fontSize,
            round: _s.cell.round,
            textColor: _s.cell.textColor,
            color: "transparent",
        });
        cell.elem.style.lineHeight = cellHeight + "px";
        cell.elem.style.flexShrink = "0";
        cell.setMotion("background-color 0.15s");
        cell.isEnabled = 1;
        cell.isSelected = 0;

        cell.on("click", function () {
            if (box.enabled == 1 && cell.isEnabled) onClick();
        });
        cell.on("mouseover", function () {
            if (box.enabled == 1 && cell.isEnabled && !cell.isSelected) cell.color = _s.cell.hoverColor;
        });
        cell.on("mouseout", function () {
            if (!cell.isSelected) cell.color = "transparent";
        });

        return cell;

    };

    const paintCell = function (cell, selected, enabled) {
        cell.isSelected = selected ? 1 : 0;
        cell.isEnabled = enabled ? 1 : 0;
        cell.color = (selected) ? _s.selectedCell.color : "transparent";
        cell.textColor = (selected) ? _s.selectedCell.textColor : (enabled) ? _s.cell.textColor : _s.disabledCell.textColor;
        cell.elem.style.cursor = (enabled && box.enabled == 1) ? "pointer" : "default";
    };

    // A scrollable column with a title. Returns the column box.
    const createColumn = function (title) {

        const group = VGroup({
            width: cellWidth,
            height: "auto",
            align: "center top",
            gap: 4,
        });

            group.title = Label({
                width: cellWidth,
                text: title,
                textAlign: "center",
                fontSize: _s.columnTitle.fontSize,
                textColor: _s.columnTitle.textColor,
            });

            // BOX: Scroll area. The scrolling box and its ScrollBar are in it.
            // WHY: ScrollBar alines itself with the left / top of the scrolling box, inside the
            //      container box of it. A flex item has left = 0 and top = 0 (flex places it), so
            //      in the group the bar landed on the title. This box is the flex item instead.
            group.scrollArea = startBox({
                width: cellWidth,
                height: columnHeight,
                color: "transparent",
            });

                // BOX: Scrollable list
                group.scrollBox = startBox(0, 0, cellWidth, columnHeight, {
                    color: "transparent",
                    scrollY: 1,
                });
                group.scrollBox.elem.style.position = "relative";
                // WHY: Narrow column. Mouse wheel and touch still scroll.
                if (useScrollBar) group.scrollBox.elem.style.scrollbarWidth = "none";

                    group.list = VGroup({
                        width: "100%",
                        height: "auto",
                        align: "center top",
                        gap: 0,
                    });

                    // NOTE: Cells are added by the caller.

                    endGroup();

                endBox();

            endBox();

        endGroup();

        // SCROLL BAR: basic/scroll-bar.js instead of the scrollbar of the browser.
        if (useScrollBar) {
            createIn(group.scrollArea, function () {
                group.scrollBar = ScrollBar(Object.assign({ scrollableBox: group.scrollBox }, _s.scrollBar));
            });
        }

        return group;

    };

    const createHourCells = function () {
        createIn(box.hoursColumn.list, function () {
            for (let hour = 0; hour < 24; hour++) {
                hourCells.push(createCell(twoDigitFormat(hour), function () { selectHour(hour); }));
            }
        });
    };

    const createMinuteCells = function () {
        minuteCells.forEach(function (cell) { cell.remove(); });
        minuteCells = [];
        minuteList = [];
        for (let minute = 0; minute < 60; minute += box.minuteStep) minuteList.push(minute);
        createIn(box.minutesColumn.list, function () {
            minuteList.forEach(function (minute) {
                minuteCells.push(createCell(twoDigitFormat(minute), function () { selectMinute(minute); }));
            });
        });
    };

    // Scroll the column so the cell is in the middle.
    const scrollToCell = function (column, cell, smooth = 0) {
        if (!cell) return;
        const top = cell.elem.offsetTop - ((columnHeight - cellHeight) / 2);
        column.scrollBox.elem.scrollTo({ top: Math.max(0, top), behavior: (smooth) ? "smooth" : "auto" });
    };

    const scrollToSelected = function (smooth = 0) {
        const hour = (box.hours !== null) ? box.hours : new Date().getHours();
        scrollToCell(box.hoursColumn, hourCells[hour], smooth);
        const minute = (box.minutes !== null) ? box.minutes : 0;
        const index = minuteList.indexOf(minute - (minute % box.minuteStep));
        scrollToCell(box.minutesColumn, minuteCells[Math.max(0, index)], smooth);
    };

    // The bars can not measure a hidden panel (its size is 0), so they are refreshed after it is shown.
    const refreshScrollBars = function () {
        if (!useScrollBar) return;
        if (box.hoursColumn && box.hoursColumn.scrollBar) box.hoursColumn.scrollBar.refreshScroll();
        if (box.minutesColumn && box.minutesColumn.scrollBar) box.minutesColumn.scrollBar.refreshScroll();
    };

    const renderPanel = function () {

        hourCells.forEach(function (cell, hour) {
            paintCell(cell, box.hours === hour, isHourEnabled(hour));
        });

        minuteCells.forEach(function (cell, index) {
            const minute = minuteList[index];
            // WHY: No hour selected yet: a minute is enabled if it is valid for any hour.
            const enabled = (box.hours !== null)
                ? isInRange(box.hours * 60 + minute)
                : hourCells.some(function (c, hour) { return isInRange(hour * 60 + minute); });
            paintCell(cell, box.minutes === minute, enabled);
        });

        const isKeyboardHours = (activeColumn == "hours");
        box.hoursColumn.title.textColor = (isKeyboardHours) ? _s.columnTitle.activeTextColor : _s.columnTitle.textColor;
        box.minutesColumn.title.textColor = (!isKeyboardHours) ? _s.columnTitle.activeTextColor : _s.columnTitle.textColor;

        box.nowButton.visible = (box.showNowButton == 1 && isInRange(getNow())) ? 1 : 0;
        box.clearButton.visible = (box.showClearButton == 1 && box.minutesOfDay !== null) ? 1 : 0;
        box.footer.visible = (box.showNowButton == 1 || box.showClearButton == 1) ? 1 : 0;

        if (box.inline == 1) {
            box.panel.opacity = (box.enabled == 1) ? 1 : _s.disabled.opacity;
            box.panel.clickable = (box.enabled == 1) ? 1 : 0;
        }

    };

    // Now, rounded down to the minute step.
    const getNow = function () {
        const now = new Date();
        const minute = now.getMinutes() - (now.getMinutes() % box.minuteStep);
        return now.getHours() * 60 + minute;
    };

    // User clicked an hour: keep the minutes if they are valid for the new hour.
    const selectHour = function (hour) {

        if (!isHourEnabled(hour)) return;

        let minute = (box.minutes !== null) ? box.minutes : 0;
        if (!isInRange(hour * 60 + minute)) minute = firstEnabledMinute(hour);

        activeColumn = "minutes";
        box.setTime(hour * 60 + minute);
        renderPanel(); // WHY: setTime does not render if the time did not change. The active column changed.
        scrollToCell(box.minutesColumn, minuteCells[minuteList.indexOf(minute)], 1);

    };

    // User clicked a minute: the time is complete.
    const selectMinute = function (minute) {

        let hour = box.hours;
        if (hour === null || !isInRange(hour * 60 + minute)) {
            // WHY: No hour selected yet: use the current hour, or the first hour that is valid with this minute.
            const nowHour = new Date().getHours();
            hour = (isInRange(nowHour * 60 + minute)) ? nowHour : hourCells.findIndex(function (c, h) { return isInRange(h * 60 + minute); });
            if (hour < 0) return;
            scrollToCell(box.hoursColumn, hourCells[hour], 1);
        }

        box.setTime(hour * 60 + minute);
        finishSelect();

    };

    const finishSelect = function () {
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

    // Move the value of the active column one step. (Skips disabled values.)
    const moveValue = function (direction) {

        if (activeColumn == "hours") {

            let hour = (box.hours !== null) ? box.hours : new Date().getHours() - direction;
            for (let i = 0; i < 24; i++) {
                hour = (hour + direction + 24) % 24;
                if (isHourEnabled(hour)) break;
            }
            let minute = (box.minutes !== null) ? box.minutes : 0;
            if (!isInRange(hour * 60 + minute)) minute = firstEnabledMinute(hour);
            if (minute === null) return;
            box.setTime(hour * 60 + minute);
            scrollToCell(box.hoursColumn, hourCells[hour], 1);

        } else {

            const hour = (box.hours !== null) ? box.hours : new Date().getHours();
            const current = (box.minutes !== null) ? minuteList.indexOf(box.minutes - (box.minutes % box.minuteStep)) : -1;
            let index = (current < 0 && direction < 0) ? minuteList.length : current;
            for (let i = 0; i < minuteList.length; i++) {
                index = (index + direction + minuteList.length) % minuteList.length;
                if (isInRange(hour * 60 + minuteList[index])) {
                    box.setTime(hour * 60 + minuteList[index]);
                    scrollToCell(box.minutesColumn, minuteCells[index], 1);
                    return;
                }
            }

        }

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

        if (event.key === "Escape" || event.key === "Enter") {
            if (box.inline == 1) return;
            event.preventDefault();
            box.close();
            box.elem.focus();
        } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            moveValue((event.key === "ArrowUp") ? -1 : 1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            activeColumn = (event.key === "ArrowLeft") ? "hours" : "minutes";
            renderPanel();
        }

    };

    // *** PUBLIC FUNCTIONS:

    // time: "HH:mm", Date, minutes from 00:00 (1170) or null
    box.setTime = function (time, silent = 0) {

        const newTime = SelectTime.parse(time);
        if (newTime !== null && !isInRange(newTime)) return false;
        if (newTime === box.minutesOfDay) return true;

        box.minutesOfDay = newTime;
        updateValue();
        updateField();
        renderPanel();

        if (!silent) box.onChange(box);
        return true;

    };
    // USAGE: picker.setTime("19:30"), picker.setTime(new Date()), picker.setTime(null)
    // NOTE: setTime(time, 1) changes the value without calling onChange. Returns false if out of range.

    // Returns: { hours, minutes } or null
    box.getTime = function () {
        return (box.minutesOfDay === null) ? null : { hours: box.hours, minutes: box.minutes };
    };

    box.open = function () {

        if (box.inline == 1 || isOpen || box.enabled != 1) return;
        isOpen = 1;

        activeColumn = "hours";
        renderPanel();

        box.overlay.visible = 1;
        box.panel.visible = 1;
        positionPanel();
        scrollToSelected();
        refreshScrollBars();
        box.panel.elem.focus({ preventScroll: true });

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

    box.setMinTime = function (time) {
        box.minTime = SelectTime.parse(time);
        renderPanel();
    };

    box.setMaxTime = function (time) {
        box.maxTime = SelectTime.parse(time);
        renderPanel();
    };

    box.setMinuteStep = function (minuteStep) {
        box.minuteStep = Math.max(1, Math.min(60, Math.floor(num(minuteStep) || 1)));
        createMinuteCells();
        renderPanel();
        if (isOpen || box.inline == 1) scrollToSelected();
        refreshScrollBars();
    };

    box.refresh = function () {
        updateValue();
        updateField();
        renderPanel();
        refreshScrollBars();
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {

        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        page.remove_onResize(onPageResize);

        // WHY: A ScrollBar has its own page events and observer, they live outside its box.
        if (box.hoursColumn.scrollBar) { box.hoursColumn.scrollBar.remove(); box.hoursColumn.scrollBar = null; }
        if (box.minutesColumn.scrollBar) { box.minutesColumn.scrollBar.remove(); box.minutesColumn.scrollBar = null; }

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

        // LABEL: Selected time text
        box.fieldText = Label({
            width: "auto",
            fontSize: _s.fieldText.fontSize,
            textColor: _s.fieldText.textColor,
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.textOverflow = "ellipsis";
        that.elem.style.flexGrow = "1";

        // BOX: Clock icon (drawn)
        box.icon = startBox({
            width: 18,
            height: 18,
            color: "transparent",
            border: 2,
            borderColor: _s.icon.color,
            round: 100,
        });
        Box({ left: 6, top: 2, width: 2, height: 6, color: _s.icon.color, round: 1 }); // Hour hand
        Box({ left: 6, top: 6, width: 5, height: 2, color: _s.icon.color, round: 1 }); // Minute hand
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

    // BOX: Time panel
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

        // GROUP: Columns (hours, minutes)
        HGroup({
            width: innerWidth,
            height: "auto",
            align: "left top",
            gap: _s.column.gap,
        });

            box.hoursColumn = createColumn(texts.hour);
            box.minutesColumn = createColumn(texts.minute);

        endGroup();

        // GROUP: Footer (Now, Clear)
        box.footer = HGroup({
            width: innerWidth,
            height: 38,
            justifyContent: "space-between",
            alignItems: "center",
        });
        box.footer.elem.style.borderTop = "1px solid " + Black(0.08);
        box.footer.elem.style.paddingTop = "6px";

            box.nowButton = Label({
                text: texts.now,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.nowButton.elem.style.cursor = "pointer";
            box.nowButton.on("click", function () {
                if (box.enabled != 1) return;
                box.setTime(getNow());
                scrollToSelected(1);
                finishSelect();
            });

            box.clearButton = Label({
                text: texts.clear,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.clearButton.elem.style.cursor = "pointer";
            box.clearButton.elem.style.marginLeft = "auto";
            box.clearButton.on("click", function () {
                if (box.enabled != 1) return;
                box.setTime(null);
                activeColumn = "hours";
                renderPanel();
                if (box.inline != 1) {
                    box.close();
                    box.elem.focus();
                }
            });

        endGroup();

    endGroup();

    createHourCells();
    createMinuteCells();

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
    // WHY: Keep the keyboard focus on the panel when a cell is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    box.enabled = (box.enabled == 1 || box.enabled === true) ? 1 : 0;
    // WHY: A start time out of the range is not accepted.
    if (box.minutesOfDay !== null && !isInRange(box.minutesOfDay)) box.minutesOfDay = null;

    updateValue();
    updateField();
    renderPanel();

    if (box.inline == 1) {
        // WHY: Layout is not ready while the page is being created. Scroll after it.
        setTimeout(function () { if (box) { scrollToSelected(); refreshScrollBars(); } }, 0);
    }

    return endObject(box);

};

// *** STATIC FUNCTIONS AND DATA:

SelectTime.languages = {
    en: {
        placeholder: "Select time",
        hour: "Hour",
        minute: "Minute",
        now: "Now",
        clear: "Clear",
    },
    tr: {
        placeholder: "Saat seçin",
        hour: "Saat",
        minute: "Dakika",
        now: "Şimdi",
        clear: "Temizle",
    },
};
// NOTE: Add a new language: SelectTime.languages.de = { ... }

// Converts "HH:mm" (or "H:mm", "HH:mm:ss"), a Date or minutes from 00:00 to minutes from 00:00 (0 - 1439). Returns null if not valid.
SelectTime.parse = function (value) {

    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "number") {
        return (Number.isInteger(value) && value >= 0 && value < 1440) ? value : null;
    }

    if (value instanceof Date) {
        return (isNaN(value)) ? null : value.getHours() * 60 + value.getMinutes();
    }

    const match = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(String(value).trim());
    if (!match) return null;

    const hours = num(match[1]);
    const minutes = num(match[2]);
    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;

};
// USAGE: SelectTime.parse("19:30") -> 1170, SelectTime.parse(1170) -> 1170

// Formats minutes from 00:00. Tokens: HH, H, hh, h, mm, A (AM/PM), a (am/pm)
SelectTime.format = function (minutesOfDay, format = "HH:mm") {

    if (minutesOfDay === null || minutesOfDay === undefined) return "";

    const hours = Math.floor(minutesOfDay / 60);
    const minutes = minutesOfDay % 60;
    const hours12 = (hours % 12) || 12;

    const tokens = {
        HH: String(twoDigitFormat(hours)),
        H: String(hours),
        hh: String(twoDigitFormat(hours12)),
        h: String(hours12),
        mm: String(twoDigitFormat(minutes)),
        A: (hours < 12) ? "AM" : "PM",
        a: (hours < 12) ? "am" : "pm",
    };

    return format.replace(/HH|H|hh|h|mm|A|a/g, function (token) {
        return tokens[token];
    });

};
// USAGE: SelectTime.format(1170, "h:mm A") -> "7:30 PM"
