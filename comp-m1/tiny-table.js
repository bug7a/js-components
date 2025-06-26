/* Bismillah */

/*

Component Template - v24.06

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:


Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Web: https://bug7a.github.io/basic.js-ui-components/

*/

"use strict";
const TinyTable = function(params = {}) {

    // Default values
    const defaults = {
        titles: [],
        titleSizes: [],
        datas: [],
        titleBackgroundColor: "#141414",
        titleTextColor: "white",
        titleLineColor: "#141414",
        titleFontSize: 18,
        tableBorder: 2,
        tableRound: 4,
        tableBorderColor: "#141414",
        contentHeight: "auto",
        contentBackgroundColor: "white",
        contentFontSize: 16,
        contentTextColor: "rgba(0, 0, 0, 0.9)",
        selectionBackgroundColor: "whitesmoke",
        selectionBorderColor: "rgba(0, 0, 0, 0.2)",
        selectionBorder: 1,
        onCellCreate: function(cell) {},
    };

    if (params == "get") return defaults; // CompName("get").border

    // BOX: Component container
    const box = startObject();

    // Values ready to use
    box.props(defaults, params);

    // *** Private variables:
    //let privateVar = "";

    // *** Public variables:
    //box.publicVar = "";
    box.getContainerBoxForScrollBar = function() {
        return box.contentGroup;
    }

    // *** Private functions:
    //const privateFunc = function() {};

    // *** Public functions:
    //box.publicFunc = function() {};

    // Set a param after created.
    //box.setColor = function(color) {
    //    box.color = color;
    //};
    // USAGE: get: componentName.color, set: componentName.setColor("red")

    // OBJECT VIEW:
    //box.setMotion("opacity 0.2s");
    box.round = box.tableRound;
    box.color = "transparent";
    box.width = "auto";
    box.height = "auto";

    // GROUP: Titles
    box.titleBox = startFlexBox({
        height: "auto",
        color: box.titleLineColor,
        justifyContent: "flex-start",
        gap: "1px",
    });
    that.position = "relative";

        for (let i = 0; i < box.titles.length; i++) {
            Label({
                text: box.titles[i],
                width: box.titleSizes[i],
                spaceX: 8,
                spaceY: 8,
                color: box.titleBackgroundColor,
                textColor: box.titleTextColor,
                round: 0,
                fontSize: box.titleFontSize,
            });
            that.elem.style.whiteSpace = "nowrap";
            that.elem.style.textOverflow = "ellipsis";
            //that.elem.style.fontFamily = "opensans-bold";

        }

    endFlexBox();

    // GROUP: datas (Content)
    box.contentGroup = startBox({
        height: box.contentHeight,
        width: "auto",
        color: box.contentBackgroundColor,
    });
    that.position = "relative";
    that.elem.style.paddingTop = "10px";
    that.elem.style.paddingBottom = "10px";

    if (box.contentHeight != "auto") {
        box.contentGroup.scrollY = 1;
    }

        // BOX: Selection content background
        const selectedBackgroundBox = Box(0, 0, {
            color: box.selectionBackgroundColor,
            border: box.selectionBorder,
            borderColor: box.selectionBorderColor,
            opacity: 0,
        });

        for (let j = 0; j < box.datas.length; j++) {

            // GROUP: Item Line
            startFlexBox({
                height: "auto",
                color: "transparent",
                justifyContent: "flex-start",
                gap: "1px",
            });
            that.position = "relative";
            that.elem.style.cursor = "pointer";

            const _contentLineGroup = that;

            that.on("mouseover", function() {
                selectedBackgroundBox.opacity = 1;
                selectedBackgroundBox.width = _contentLineGroup.width;
                selectedBackgroundBox.height = _contentLineGroup.height;
                selectedBackgroundBox.top = _contentLineGroup.top;
                selectedBackgroundBox.left = 0;
            });
            that.on("mouseout", function() {
                selectedBackgroundBox.opacity = 0;
            });

                for (let i = 0; i < box.datas[j].length; i++) {

                    // LABEL: Content Cell
                    Label({
                        text: box.datas[j][i],
                        width: box.titleSizes[i],
                        spaceX: 8,
                        spaceY: 4,
                        color: "transparent",
                        fontSize: box.contentFontSize,
                        round: 0,
                        textColor: box.contentTextColor,
                    });
                    that.elem.style.whiteSpace = "nowrap";
                    that.elem.style.textOverflow = "ellipsis";

                    that.lineCount = j;
                    that.index = i;

                    box.onCellCreate(that);

                }

            endFlexBox(); // GROUP Item line

        }

    endBox();
    
    // BOX: Border.
    box.coverBox = Box(0, 0, "100%", "100%", {
        color: "transparent",
        border: box.tableBorder,
        borderColor: box.tableBorderColor,
        round: box.tableRound,
    });

    // OBJECT INIT CODE:
    
    return endObject(box);

};