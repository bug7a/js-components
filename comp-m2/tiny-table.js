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

    // *** PRIVATE VARIABLES:
    const CELL_SPACE_X = 8;
    const BODY_PADDING_Y = "10px"; // Space above the first row and under the last row

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
            spaceX: CELL_SPACE_X,
            spaceY: 8,
            color: box.headerBackgroundColor,
            textColor: box.headerTextColor,
            round: 0,
            fontSize: box.headerFontSize,
        });
        that.css = { whiteSpace: "nowrap", textOverflow: "ellipsis" };
    }
    endFlexBox();

    // BODY SECTION
    box.contentGroup = startBox({
        height: box.bodyHeight,
        width: "auto",
        color: box.bodyBackgroundColor,
    });
    that.position = "relative";
    that.css = { paddingTop: BODY_PADDING_Y, paddingBottom: BODY_PADDING_Y };

    if (box.bodyHeight !== "auto") {
        box.contentGroup.scrollY = 1;
    }

    // HIGHLIGHT BOX for hover effect
    const rowHoverBox = Box(0, 0, {
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
        that.cursor = "pointer";

        const row = that;

        // Hover interaction
        row.on("mouseover", function() {
            rowHoverBox.opacity = 1;
            rowHoverBox.width = row.width;
            rowHoverBox.height = row.height;
            rowHoverBox.top = row.top;
            rowHoverBox.left = 0;
        });
        row.on("mouseout", function() {
            rowHoverBox.opacity = 0;
        });

        // ROW CELLS
        for (let c = 0; c < box.dataRows[r].length; c++) {
            Label({
                text: box.dataRows[r][c],
                width: box.columnWidths[c],
                spaceX: CELL_SPACE_X,
                spaceY: 4,
                color: "transparent",
                fontSize: box.cellFontSize,
                round: 0,
                textColor: box.cellTextColor,
            });
            that.css = { whiteSpace: "nowrap", textOverflow: "ellipsis" };

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
