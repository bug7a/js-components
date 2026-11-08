/* Bismillah */

/*

Time Picker - v26.11

UI COMPONENT TEMPLATE
- A time picker: a field that opens a panel (popup), or an always visible panel (inline: 1).
- The panel has two scrollable columns: hours (00-23) and minutes (with minuteStep).
- The columns scroll with basic/scroll-bar.js (ScrollBar), not with the scrollbar of the browser.
  (useScrollBar: 0, or the file is not loaded: the scrollbar of the browser is used.)
- Supports: minTime, maxTime (also over midnight: 22:00 - 02:00), minuteStep, format,
  language (en, tr), Now/Clear buttons, enabled, keyboard navigation.
- Everything is drawn with code (no image files needed).
- Value: "HH:mm" text. (Ex: "19:30")
- Style packages: "light" (default; the old name "classic" works too), "dark", "minimal", "minimalDark" (a package of
  params: its height too). Select with styleName. (TimePicker.styles)

Keyboard (when the panel is focused):
- ArrowUp/ArrowDown: change the value of the active column, ArrowLeft/ArrowRight: change the column,
  Enter: close, Escape: close.

Started Date: September 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const TimePickerDefaults = {
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
    styleName: "light", // "light" ("classic": its old name), "dark", "minimal", "minimalDark" or a name added to TimePicker.styles
    style: { // Light style package (default)
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
            svg: "", // An SVG text drawn in this color (stroke="currentColor"). "": the drawn clock
            size: 18, // px of the SVG icon
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
            barSpace: 0, // Room around the cells of a column for its scroll bar. 0: the bar is over the right side of the cells
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
        divider: {
            color: Black(0.08), // The line above the footer buttons
        },
        disabled: {
            opacity: 0.4,
        },
    }
};

const TimePicker = function (params = {}) {

    // Merge style package: params.style > TimePicker.styles[styleName] > TimePickerDefaults.style (light)
    basic.applyStylePackage(params, TimePicker.styles, TimePickerDefaults);

    // Merge params:
    mergeIntoIfMissing(params, TimePickerDefaults);

    // Edit params, if needed:
    params.color = "transparent";
    if (params.inline == 1) {
        params.width = "auto";
        params.height = "auto";
    }

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const texts = TimePicker.languages[box.language] || TimePicker.languages.en;
    const _s = box.style;
    const cellWidth = _s.cell.width;
    const cellHeight = _s.cell.height;
    const columnWidth = cellWidth + _s.column.barSpace;
    const columnHeight = cellHeight * _s.column.rows;
    const innerWidth = (columnWidth * 2) + _s.column.gap;

    let isOpen = 0;
    let isMouseOver = 0;
    let activeColumn = "hours"; // "hours", "minutes" (keyboard)
    let hourCells = []; // index: hour
    let minuteCells = []; // index: position in minuteList
    let minuteList = []; // [0, 5, 10, ...]
    // WHY: The component works without basic/scroll-bar.js too, the file is not loaded on every page.
    const useScrollBar = (box.useScrollBar == 1 && typeof ScrollBar !== "undefined");
    const PANEL_GAP = 6; // px between the field and the panel
    const SCREEN_MARGIN = 8; // px: the panel stays this far from the edges of the page
    const OVERLAY_Z_INDEX = 1000;
    const PANEL_Z_INDEX = 1001;

    // *** PUBLIC VARIABLES:
    // [var] Selected time: minutes from 00:00 (0 - 1439) or null
    box.minutesOfDay = TimePicker.parse(box.time);
    // [var] number or null
    box.hours = null;
    box.minutes = null;
    // [var] "HH:mm" or ""
    box.value = "";
    // [var] Formatted text or "" (WHY: not "text", Box.text changes innerHTML)
    box.timeText = "";

    box.minTime = TimePicker.parse(box.minTime);
    box.maxTime = TimePicker.parse(box.maxTime);
    box.minuteStep = Math.max(1, Math.min(60, Math.floor(basic.num(box.minuteStep) || 1)));

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

    const updateValue = function () {
        const time = box.minutesOfDay;
        box.hours = (time === null) ? null : Math.floor(time / 60);
        box.minutes = (time === null) ? null : time % 60;
        box.value = (time === null) ? "" : TimePicker.format(time, "HH:mm");
        box.timeText = (time === null) ? "" : TimePicker.format(time, box.format);
    };

    const updateField = function () {

        if (box.inline == 1) return;

        if (box.minutesOfDay !== null) {
            box.fieldText.plainText = box.timeText;
            box.fieldText.textColor = _s.fieldText.textColor;
        } else {
            box.fieldText.plainText = box.placeholder || texts.placeholder;
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
        cell.lineHeight = cellHeight + "px";
        cell.shrink = 0;
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

    const getCellTextColor = function (selected, enabled) {
        if (selected) return _s.selectedCell.textColor;
        if (enabled) return _s.cell.textColor;
        return _s.disabledCell.textColor;
    };

    const paintCell = function (cell, selected, enabled) {
        cell.isSelected = selected ? 1 : 0;
        cell.isEnabled = enabled ? 1 : 0;
        cell.color = (selected) ? _s.selectedCell.color : "transparent";
        cell.textColor = getCellTextColor(selected, enabled);
        cell.cursor = (enabled && box.enabled == 1) ? "pointer" : "default";
    };

    // A scrollable column with a title. Returns the column box.
    const createColumn = function (title) {

        const group = VGroup({
            width: columnWidth,
            height: "auto",
            align: "center top",
            gap: 4,
        });

            group.title = Label({
                width: columnWidth,
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
                width: columnWidth,
                height: columnHeight,
                color: "transparent",
            });

                // BOX: Scrollable list
                group.scrollBox = startBox(0, 0, columnWidth, columnHeight, {
                    color: "transparent",
                    scrollY: 1,
                });
                group.scrollBox.css.position = "relative";
                // WHY: Narrow column. Mouse wheel and touch still scroll.
                if (useScrollBar) group.scrollBox.css.scrollbarWidth = "none";

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
                hourCells.push(createCell(basic.twoDigitFormat(hour), function () { selectHour(hour); }));
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
                minuteCells.push(createCell(basic.twoDigitFormat(minute), function () { selectMinute(minute); }));
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

    const isMinuteEnabled = function (minute) {
        if (box.hours !== null) return isInRange(box.hours * 60 + minute);
        // WHY: No hour selected yet: a minute is enabled if it is valid for any hour.
        return hourCells.some(function (c, hour) { return isInRange(hour * 60 + minute); });
    };

    const renderPanel = function () {

        hourCells.forEach(function (cell, hour) {
            paintCell(cell, box.hours === hour, isHourEnabled(hour));
        });

        minuteCells.forEach(function (cell, index) {
            const minute = minuteList[index];
            paintCell(cell, box.minutes === minute, isMinuteEnabled(minute));
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

    // WHY: No (valid) hour selected yet: use the current hour, or the first hour that is valid with this minute.
    // Returns -1 if no hour is valid.
    const findHourForMinute = function (minute) {
        const nowHour = new Date().getHours();
        if (isInRange(nowHour * 60 + minute)) return nowHour;
        return hourCells.findIndex(function (c, h) { return isInRange(h * 60 + minute); });
    };

    // User clicked a minute: the time is complete.
    const selectMinute = function (minute) {

        let hour = box.hours;
        if (hour === null || !isInRange(hour * 60 + minute)) {
            hour = findHourForMinute(minute);
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

    // Hours column: the next enabled hour. The minutes are kept if they are valid for it.
    const moveHour = function (direction) {
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
    };

    // Minutes column: the next minute that is valid for the hour.
    const moveMinute = function (direction) {
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
    };

    // Move the value of the active column one step. (Skips disabled values.)
    const moveValue = function (direction) {
        if (activeColumn == "hours") {
            moveHour(direction);
            return;
        }
        moveMinute(direction);
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

        const newTime = TimePicker.parse(time);
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

        // WHY at open: a field in a Dialog or a SidePanel (their layer is over 1001) opens its list over them
        const layerZIndex = basic.zIndexAbove(box, OVERLAY_Z_INDEX);
        box.overlay.zIndex = layerZIndex;
        box.panel.zIndex = layerZIndex + 1;
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
        box.enabled = basic.isOn(enabled) ? 1 : 0;
        if (box.enabled != 1) box.close();
        updateField();
        renderPanel();
    };
    // USAGE: get: picker.enabled, set: picker.setEnabled(0)

    box.setMinTime = function (time) {
        box.minTime = TimePicker.parse(time);
        renderPanel();
    };

    box.setMaxTime = function (time) {
        box.maxTime = TimePicker.parse(time);
        renderPanel();
    };

    box.setMinuteStep = function (minuteStep) {
        box.minuteStep = Math.max(1, Math.min(60, Math.floor(basic.num(minuteStep) || 1)));
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

        // LABEL: Selected time text
        box.fieldText = Label({
            width: "auto",
            fontSize: _s.fieldText.fontSize,
            textColor: _s.fieldText.textColor,
        });
        that.css = { whiteSpace: "nowrap", textOverflow: "ellipsis" };
        that.grow = 1;

        // BOX: Clock icon: the SVG of the style, or drawn
        if (_s.icon.svg) {
            box.icon = Box({ width: _s.icon.size, height: _s.icon.size, color: "transparent", textColor: _s.icon.color });
            box.icon.elem.innerHTML = _s.icon.svg;
        } else {
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
        }
        box.icon.shrink = 0;

        endGroup();

    }

    // POPUP: Create the overlay and the panel on the page, over everything.
    // WHY: Creating them directly on the page is safer than moving them later.
    if (box.inline != 1) {

        setDefaultContainerBox(page);
        // NOTE: endGroup() of the panel below returns the default container to the component box.

        // BOX: Transparent overlay (click outside: close)
        // WHY a very big box and not 100% x 100%: with position "fixed" the "100%" is taken from the nearest parent
        //     that has a zoom or a transform (page.fit); there the overlay had no height and a click outside the
        //     panel did not close it (the same fix as SelectBox).
        const OVERLAY_SIZE = 20000; // px
        box.overlay = Box(-OVERLAY_SIZE, -OVERLAY_SIZE, OVERLAY_SIZE * 2, OVERLAY_SIZE * 2, { color: "transparent" });
        box.overlay.css.position = "fixed";
        box.overlay.zIndex = OVERLAY_Z_INDEX;
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
    box.panel.boxShadow = _s.panel.shadow;
    box.panel.css.outline = "none";
    box.panel.tabIndex = -1;
    box.panel.clickable = 1;
    box.panel.role = "dialog";

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
        box.footer.css = {
            borderTop: "1px solid " + _s.divider.color,
            paddingTop: "6px",
        };

            box.nowButton = Label({
                text: texts.now,
                padding: [8, 2],
                round: 4,
                ..._s.footerButton,
            });
            box.nowButton.cursor = "pointer";
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
            box.clearButton.cursor = "pointer";
            box.clearButton.css.marginLeft = "auto";
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
    // WHY: Keep the keyboard focus on the panel when a cell is clicked.
    box.panel.on("mousedown", function (self, event) { event.preventDefault(); });

    box.enabled = basic.isOn(box.enabled) ? 1 : 0;
    // WHY: A start time out of the range is not accepted.
    if (box.minutesOfDay !== null && !isInRange(box.minutesOfDay)) box.minutesOfDay = null;

    updateValue();
    updateField();
    renderPanel();

    if (box.inline == 1) {
        // WHY: Layout is not ready while the page is being created. Scroll after it.
        box.after(0, function () {
            scrollToSelected();
            refreshScrollBars();
        });
    }

    return endObject(box);

};

// *** STATIC FUNCTIONS AND DATA:

TimePicker.languages = {
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
// NOTE: Add a new language: TimePicker.languages.de = { ... }

// Converts "HH:mm" (or "H:mm", "HH:mm:ss"), a Date or minutes from 00:00 to minutes from 00:00 (0 - 1439). Returns null if not valid.
TimePicker.parse = function (value) {

    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "number") {
        return (Number.isInteger(value) && value >= 0 && value < 1440) ? value : null;
    }

    if (value instanceof Date) {
        return (isNaN(value)) ? null : value.getHours() * 60 + value.getMinutes();
    }

    const match = /^(\d{1,2}):(\d{2})(:\d{2})?$/.exec(String(value).trim());
    if (!match) return null;

    const hours = basic.num(match[1]);
    const minutes = basic.num(match[2]);
    if (hours > 23 || minutes > 59) return null;

    return hours * 60 + minutes;

};
// USAGE: TimePicker.parse("19:30") -> 1170, TimePicker.parse(1170) -> 1170

// Formats minutes from 00:00. Tokens: HH, H, hh, h, mm, A (AM/PM), a (am/pm)
TimePicker.format = function (minutesOfDay, format = "HH:mm") {

    if (minutesOfDay === null || minutesOfDay === undefined) return "";

    const hours = Math.floor(minutesOfDay / 60);
    const minutes = minutesOfDay % 60;
    const hours12 = (hours % 12) || 12;

    const tokens = {
        HH: String(basic.twoDigitFormat(hours)),
        H: String(hours),
        hh: String(basic.twoDigitFormat(hours12)),
        h: String(hours12),
        mm: String(basic.twoDigitFormat(minutes)),
        A: (hours < 12) ? "AM" : "PM",
        a: (hours < 12) ? "am" : "pm",
    };

    return format.replace(/HH|H|hh|h|mm|A|a/g, function (token) {
        return tokens[token];
    });

};
// USAGE: TimePicker.format(1170, "h:mm A") -> "7:30 PM"

// *** STYLE PACKAGES:
// USAGE: TimePicker({ styleName: "dark" })
// USAGE: TimePicker({ styleName: "dark", style: { field: { round: 4 } } }) // Change only some keys.
// USAGE: TimePicker({ style: TimePicker.styles.dark }) // The same as styleName: "dark". (The package is copied, never changed.)
// NOTE: A new package needs only the keys that differ from the default (classic) style.
// USAGE: TimePicker.styles.myStyle = { field: { round: 4 } };
TimePicker.styles = {

    // White, dark text, a soft line.
    light: TimePickerDefaults.style,

    // Dark theme, same colors as SelectBox "dark".
    dark: {
        field: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.10)", round: 8 },
        fieldHover: { borderColor: "rgba(255, 255, 255, 0.30)" },
        fieldFocus: { borderColor: "#65A293" },
        fieldText: { fontSize: 15, textColor: "rgba(255, 255, 255, 0.90)" },
        placeholder: { textColor: "rgba(255, 255, 255, 0.40)" },
        icon: { color: "rgba(255, 255, 255, 0.55)" },
        panel: { color: "#232322", borderColor: "rgba(255, 255, 255, 0.12)", shadow: "0 8px 24px rgba(0, 0, 0, 0.5)" },
        columnTitle: { textColor: "rgba(255, 255, 255, 0.45)", activeTextColor: "rgba(255, 255, 255, 0.90)" },
        scrollBar: { bar_color: "#FFFFFF", bar_mouseOverColor: "#FFFFFF" },
        cell: { textColor: "rgba(255, 255, 255, 0.85)", hoverColor: "rgba(255, 255, 255, 0.08)" },
        selectedCell: { color: "#3D7A6B", textColor: "#FFFFFF" },
        disabledCell: { textColor: "rgba(255, 255, 255, 0.20)" },
        footerButton: { textColor: "#65A293" },
        divider: { color: "rgba(255, 255, 255, 0.08)" },
    },

};
TimePicker.styles.classic = TimePicker.styles.light; // the old name of light: the pages made with it keep their look

// The line clock of the minimal field (24 x 24 drawing, as the icons of the minimal SearchInput)
TimePicker.MINIMAL_ICON = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display: block">' +
    '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

// The minimal theme (_designs/minimal-theme.htm): a 28 px field as the other minimal fields (a 14 px line icon); the
// columns of the hours
// and the minutes on the ground of the window with a line and no shadow, 28 px cells: the chosen one in ink (the one fill),
// a faint fill under the mouse, a thin scroll bar. minimalDark: the same on a dark window.
TimePicker.createMinimalStyle = function (colors) {
    return {
        height: 28,
        style: {
            field: { color: "transparent", border: 1, borderColor: colors.edge, round: 4, padding: [10, 0] },
            fieldHover: { borderColor: colors.edgeHover },
            fieldFocus: { borderColor: colors.ink },
            fieldText: { fontSize: 13, textColor: colors.text },
            placeholder: { textColor: colors.faintText },
            icon: { color: colors.softText, svg: TimePicker.MINIMAL_ICON, size: 14 },
            panel: { color: colors.ground, border: 1, borderColor: colors.line, round: 4, padding: 8, shadow: "none" },
            column: { gap: 4, barSpace: 14 }, // WHY barSpace: the bar must not cross the ink of the chosen hour
            columnTitle: { fontSize: 11, textColor: colors.softText, activeTextColor: colors.text },
            scrollBar: { bar_color: colors.scrollBar, bar_mouseOverColor: colors.scrollBar, bar_width: 3, bar_opacity: 0.3, bar_mouseOverOpacity: 0.6 },
            cell: { width: 52, height: 28, round: 4, fontSize: 13, textColor: colors.text, hoverColor: colors.hover },
            selectedCell: { color: colors.ink, textColor: colors.onInk },
            disabledCell: { textColor: colors.off },
            footerButton: { fontSize: 12, textColor: colors.ink },
            divider: { color: colors.line },
            disabled: { opacity: 0.4 },
        },
    };
};
TimePicker.MINIMAL_COLORS = { ground: "#FFFFFF", text: Black(0.85), softText: Black(0.55), faintText: Black(0.54), line: Black(0.2), edge: Black(0.45), edgeHover: Black(0.65), ink: "#1F1F1F", onInk: "#FFFFFF", hover: Black(0.05), off: Black(0.25), scrollBar: "#141414" };
TimePicker.styles.minimal = TimePicker.createMinimalStyle(TimePicker.MINIMAL_COLORS);
TimePicker.MINIMAL_DARK_COLORS = { ground: "#1A1A19", text: White(0.88), softText: White(0.55), faintText: White(0.48), line: White(0.18), edge: White(0.42), edgeHover: White(0.62), ink: "#EDEDEB", onInk: "#1A1A19", hover: White(0.07), off: White(0.25), scrollBar: "#FFFFFF" };
TimePicker.styles.minimalDark = TimePicker.createMinimalStyle(TimePicker.MINIMAL_DARK_COLORS);
