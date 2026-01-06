/* Bismillah */

/*

Component: SelectDate
Version: 1.0
Created: November 2025
Description: A date picker component with month navigation.

*/

"use strict";

const SelectDateDefaults = {
    width: 300,
    height: "auto",
    date: null, // Defaults to today if null
    primaryColor: "cornflowerblue",
    secondaryColor: "whitesmoke",
    textColor: "#333",
    backgroundColor: "white",
    onDateChange: function (date, ui) { }
};

const SelectDate = function (params = {}) {

    // Merge params
    mergeIntoIfMissing(params, SelectDateDefaults);
    if (!params.date) params.date = new Date();

    // BOX: Component container
    const box = startObject(params);
    box.color = box.backgroundColor;
    box.round = 8;
    box.elem.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
    box.elem.style.overflow = "hidden"; // Clip content
    //box.layout = "vertical"; // Ensure children stack vertically

    // *** PRIVATE VARIABLES:
    let currentDate = new Date(box.date); // The currently selected date
    let viewDate = new Date(box.date);    // The month we are viewing
    // Reset viewDate to first of month to avoid overflow issues when navigating
    viewDate.setDate(1);

    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // *** UI ELEMENTS:

    // Header Container
    const header = HGroup({
        width: "100%",
        height: 50,
        color: box.primaryColor,
        align: "center",
        gap: 10,
        position: "absolute"
    });

    // Prev Button
    const prevBtn = Box({
        width: 30,
        height: 30,
        color: "rgba(255,255,255,0.2)",
        round: 15,
        cursor: "pointer",
        image: "assets/icon_arrow_left_white.png" // Assuming standard icon or text
    });
    // Since we might not have icons, let's use text for now or simple shape
    prevBtn.html = "<div style='color:white; font-weight:bold; text-align:center; line-height:30px;'>&lt;</div>";

    // Month/Year Label
    const titleLabel = Label({
        text: "",
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
        width: "auto",
        padding: [0, 10]
    });

    // Next Button
    const nextBtn = Box({
        width: 30,
        height: 30,
        color: "rgba(255,255,255,0.2)",
        round: 15,
        cursor: "pointer"
    });
    nextBtn.html = "<div style='color:white; font-weight:bold; text-align:center; line-height:30px;'>&gt;</div>";

    // Add to header
    //header.add(prevBtn, titleLabel, nextBtn);
    endGroup();

    // Weekdays Row
    const weekRow = HGroup({
        width: "100%",
        height: 30,
        top: 50,
        left: 0,
        //color: box.secondaryColor,
        align: "center",
        position: "absolute" // Required for height: auto on parent
    });

    weekDays.forEach(day => {
        Label({
            text: day,
            width: box.width / 7,
            textAlign: "center",
            fontSize: 12,
            color: "#666",
            fontWeight: "bold"
        });
    });

    endGroup();

    // Calendar Grid Container
    const grid = Box({
        width: "100%",
        height: 300,
        top: 80, // Position below header (50) and weekRow (30)
        padding: 10,
        layout: "vertical",
        gap: 2,
        position: "relative", // Required for height: auto on parent
        color: "transparent",
    });

    // *** PRIVATE FUNCTIONS:

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderCalendar = function () {
        // Update Header
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        titleLabel.text = `${monthNames[month]} ${year}`;

        // Clear Grid
        grid.html = ""; // Fast clear

        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);

        // We need 6 rows max
        let dayCount = 1;
        let row = null;

        // Create rows
        for (let i = 0; i < 6; i++) {
            row = HGroup({
                width: "100%",
                height: 30, // Cell height
                layout: "horizontal",
                gap: 0,
                position: "absolute", // Required for height: auto on grid
                color: "transparent",
            });

            let hasDays = false;

            for (let j = 0; j < 7; j++) {
                const cell = Box({
                    width: (box.width - 20) / 7, // -20 for grid padding
                    height: 30,
                    cursor: "pointer",
                    round: 4,
                    color: "transparent"
                });

                if (i === 0 && j < firstDay) {
                    // Empty cell before start of month
                } else if (dayCount > daysInMonth) {
                    // Empty cell after end of month
                } else {
                    hasDays = true;
                    const d = dayCount;

                    // Check if selected
                    const isSelected = currentDate.getDate() === d &&
                        currentDate.getMonth() === month &&
                        currentDate.getFullYear() === year;

                    // Check if today (optional, maybe highlight differently)
                    const now = new Date();
                    const isToday = now.getDate() === d &&
                        now.getMonth() === month &&
                        now.getFullYear() === year;

                    if (isSelected) {
                        cell.color = box.primaryColor;
                    } else if (isToday) {
                        cell.color = box.secondaryColor; // Light highlight for today
                    }

                    const lbl = Label({
                        text: d,
                        width: "100%",
                        textAlign: "center",
                        lineHeight: 30,
                        fontSize: 14,
                        color: isSelected ? "white" : box.textColor
                    });
                    cell.add(lbl);

                    // Click Event
                    cell.on("click", function () {
                        box.setDate(new Date(year, month, d));
                    });

                    // Hover effect
                    if (!isSelected) {
                        cell.on("mouseover", function () { cell.color = "#f0f0f0"; });
                        cell.on("mouseout", function () { cell.color = isToday ? box.secondaryColor : "transparent"; });
                    }

                    dayCount++;
                }
                //row.add(cell); // Cell auto-adds to HGroup (row)
            }
            endGroup(); // Close row HGroup

            if (hasDays || i === 0) {
                grid.add(row); // Add row to grid
            } else {
                break;
            }
        }
    };

    // *** PUBLIC FUNCTIONS:

    box.setDate = function (date) {
        if (!date) return;
        currentDate = new Date(date);
        viewDate = new Date(date);
        viewDate.setDate(1); // Reset to 1st for view stability

        renderCalendar();

        // Trigger callback
        if (box.onDateChange) {
            box.onDateChange(currentDate, box);
        }
    };

    box.getDate = function () {
        return new Date(currentDate);
    };

    // *** EVENTS:

    prevBtn.on("click", function () {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar();
    });

    nextBtn.on("click", function () {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar();
    });

    // *** INIT:
    box.add(header, weekRow, grid);
    renderCalendar();

    return endObject(box);
};
