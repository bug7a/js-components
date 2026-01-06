/* Bismillah */

/*

Component: ProgressBar
Version: 1.0
Created: November 2025
Description: A progress bar component composed of vertical lines.

*/

"use strict";

const ProgressBarDefaults = {
    width: 300,
    height: 50,
    progress: 0, // 0 to 100
    primaryColor: "indianred",
    secondaryColor: "lightgray",
    showValueLabel: false,
    backgroundColor: "transparent",
};

const ProgressBar = function (params = {}) {

    // Merge params
    mergeIntoIfMissing(params, ProgressBarDefaults);

    // BOX: Component container
    const box = startObject(params);
    box.clipContent = 0; // Allow lines to extend outside

    // *** PRIVATE VARIABLES:
    const lines = [];
    const gap = 3;
    const lineWidth = 1;
    const unitWidth = lineWidth + gap;
    const totalLines = Math.floor(box.width / unitWidth);

    let valueLabel = null;
    let labelTimer = null;

    // *** PUBLIC VARIABLES:
    box.currentProgress = box.progress;

    // *** PRIVATE FUNCTIONS:
    const createLines = function () {
        // Clear existing lines if any (though usually called once on init)

        // We will create a container for lines to keep them organized
        const lineContainer = Box({
            width: box.width,
            height: box.height,
            color: "transparent",
            position: "absolute",
            left: 0,
            top: 0,
        });

        for (let i = 0; i < totalLines; i++) {
            const line = Box({
                width: lineWidth,
                height: box.height,
                left: i * unitWidth,
                top: 0,
                color: box.secondaryColor,
                position: "absolute",
            });
            lines.push(line);
        }

        lineContainer.add(...lines);

        // Create Value Label if enabled
        if (box.showValueLabel) {
            valueLabel = Label({
                text: "0%",
                fontSize: 12,
                color: box.primaryColor,
                textColor: "white",
                position: "absolute",
                opacity: 0, // Hidden by default
                width: "auto",
                height: "auto",
                padding: [6, 2],
                round: 100,
            });
            // We want the label to be above the lines, so add it to box directly or lineContainer?
            // Adding to box ensures it's on top if z-index is managed.
            // But lineContainer is where lines are. 
            // Let's add to box to be safe and independent of line container clipping if we had any.
            box.add(valueLabel);
            valueLabel.setMotion("opacity 0.3s");
        }
    };

    const updateVisuals = function () {
        const p = box.currentProgress;
        // Clamp index to be valid (0 to totalLines - 1)
        // If p is 100, floor gives totalLines which is out of bounds.
        let targetIndex = Math.floor((p / 100) * totalLines);
        if (targetIndex >= totalLines) targetIndex = totalLines - 1;

        let activeLineLeft = 0;

        // We need to iterate all lines to set their state
        for (let i = 0; i < totalLines; i++) {
            const line = lines[i];

            // Default state
            let color = (i <= targetIndex) ? box.primaryColor : box.secondaryColor;
            let height = box.height;
            let top = 0;
            let width = lineWidth;
            let zIndex = 0;
            let left = i * unitWidth;

            // Special handling for the "head" of the progress
            if (i === targetIndex) {
                // Current line: 3px wide, extends 2px top/bottom
                width = 3;
                height = box.height + 4;
                top = -2;
                zIndex = 10;
                // Center the 3px line on the current index
                // Original center is at left + 0.5 (since width is 1)
                // New center should be same. New width is 3. 
                // New left = Original Center - 1.5 = (left + 0.5) - 1.5 = left - 1
                left = (i * unitWidth) - 1;
                activeLineLeft = left + (width / 2); // Center of the active line
            } else if (i === targetIndex - 1 || i === targetIndex + 1) {
                // Neighbors: 2px wide, extends 1px top/bottom
                width = 2;
                height = box.height + 2;
                top = -1;
                zIndex = 5;
                // Center 2px line
                // Original center is at left + 0.5
                // New left = (left + 0.5) - 1 = left - 0.5
                left = (i * unitWidth) - 0.5;
            }

            // Apply styles
            line.color = color;
            line.width = width;
            line.height = height;
            line.top = top;
            line.left = left;
            line.elem.style.zIndex = zIndex;
        }

        // Update Value Label
        if (box.showValueLabel && valueLabel) {
            valueLabel.text = Math.round(p) + "%";
            // Center label above the active line
            // We need to wait for render to know label width? 
            // Or assume a width? basic.js labels usually auto-size.
            // Let's center it roughly. 
            // We can use transform translate -50% if basic.js supports it easily or just estimate.
            // For now, let's try to center based on assumed width or just left align to center.
            // Better: use `center` method if available on label relative to a point? No.
            // Let's just set left.
            // To center properly we need the label width. 
            // `valueLabel.width` might be "auto".
            // Let's assume it's small.

            // Position above: top should be negative.
            valueLabel.top = -25; // Moved up slightly to clear the line better
            valueLabel.left = activeLineLeft;
            valueLabel.elem.style.transform = "translateX(-50%)";

            // Show label
            valueLabel.opacity = 1;
            valueLabel.color = box.primaryColor;

            // Reset timer
            if (labelTimer) clearTimeout(labelTimer);
            labelTimer = setTimeout(function () {
                valueLabel.opacity = 0;
            }, 1000);
        }
    };

    // *** PUBLIC FUNCTIONS:
    box.setProgress = function (val) {
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        box.currentProgress = val;
        updateVisuals();
    };

    // *** OBJECT INIT CODE:
    createLines();
    updateVisuals();

    return endObject(box);
};
