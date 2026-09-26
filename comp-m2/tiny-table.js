/* Bismillah */

/*

Component Template - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";
const TinyTableDefaults = {
    columnHeaders: [],
    columnWidths: [],
    dataRows: [],
    headerBackgroundColor: "#141414",
    headerTextColor: "white",
    headerBorderColor: "#141414",
    headerFontSize: 18,
    borderWidth: 2,
    borderRadius: 4,
    borderColor: "#141414",
    bodyHeight: "auto",
    bodyBackgroundColor: "white",
    cellFontSize: 16,
    cellTextColor: "rgba(0, 0, 0, 0.9)",
    rowHoverBackgroundColor: "whitesmoke",
    rowHoverBorderColor: "rgba(0, 0, 0, 0.2)",
    rowHoverBorderWidth: 1,
    onCellRender: function(cell) {},
};

const TinyTable = function(params = {}) {

    // BOX: Component container
    const box = startObject();

    // Apply default settings and override with user parameters
    box.props(TinyTableDefaults, params);

    // Container configuration
    box.round = box.borderRadius;
    box.color = "transparent";
    box.width = "auto";
    box.height = "auto";

    // HEADER SECTION
    box.titleBox = startFlexBox({
        height: "auto",
        color: box.headerBorderColor,
        justifyContent: "flex-start",
        gap: "1px",
    });
    that.position = "relative";

    for (let i = 0; i < box.columnHeaders.length; i++) {
        Label({
            text: box.columnHeaders[i],
            width: box.columnWidths[i],
            spaceX: 8,
            spaceY: 8,
            color: box.headerBackgroundColor,
            textColor: box.headerTextColor,
            round: 0,
            fontSize: box.headerFontSize,
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.textOverflow = "ellipsis";
    }
    endFlexBox();

    // BODY SECTION
    box.contentGroup = startBox({
        height: box.bodyHeight,
        width: "auto",
        color: box.bodyBackgroundColor,
    });
    that.position = "relative";
    that.elem.style.paddingTop = "10px";
    that.elem.style.paddingBottom = "10px";

    if (box.bodyHeight !== "auto") {
        box.contentGroup.scrollY = 1;
    }

    // HIGHLIGHT BOX for hover effect
    const selectedBackgroundBox = Box(0, 0, {
        color: box.rowHoverBackgroundColor,
        border: box.rowHoverBorderWidth,
        borderColor: box.rowHoverBorderColor,
        opacity: 0,
    });

    // TABLE ROWS
    for (let r = 0; r < box.dataRows.length; r++) {
        startFlexBox({
            height: "auto",
            color: "transparent",
            justifyContent: "flex-start",
            gap: "1px",
        });
        that.position = "relative";
        that.elem.style.cursor = "pointer";

        const rowElem = that;

        // Hover interaction
        rowElem.on("mouseover", function() {
            selectedBackgroundBox.opacity = 1;
            selectedBackgroundBox.width = rowElem.width;
            selectedBackgroundBox.height = rowElem.height;
            selectedBackgroundBox.top = rowElem.top;
            selectedBackgroundBox.left = 0;
        });
        rowElem.on("mouseout", function() {
            selectedBackgroundBox.opacity = 0;
        });

        // ROW CELLS
        for (let c = 0; c < box.dataRows[r].length; c++) {
            Label({
                text: box.dataRows[r][c],
                width: box.columnWidths[c],
                spaceX: 8,
                spaceY: 4,
                color: "transparent",
                fontSize: box.cellFontSize,
                round: 0,
                textColor: box.cellTextColor,
            });
            that.elem.style.whiteSpace = "nowrap";
            that.elem.style.textOverflow = "ellipsis";

            // Metadata
            that.lineCount = r;
            that.index = c;

            // Custom rendering
            box.onCellRender(that);
        }
        endFlexBox();
    }
    endBox();

    // BORDER OVERLAY
    box.coverBox = Box(0, 0, "100%", "100%", {
        color: "transparent",
        border: box.borderWidth,
        borderColor: box.borderColor,
        round: box.borderRadius,
    });

    return endObject(box);
};
