/* Bismillah */

/*

TopBar - v25.07

UI COMPONENT TEMPLATE
- Top bar component with left, center, and right sections
- Supports icon buttons and text items
- Fixed position at top of screen

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const TopBarDefaults = {
    key: 0,
    height: 40,
    width: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "#344f6c",
    borderBottom: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    leftSectionItems: [],
    centerSectionItems: [],
    rightSectionItems: [],
    onItemClick: function(item, section) {},
    onLeftItemClick: function(item) {},
    onCenterItemClick: function(item) {},
    onRightItemClick: function(item) {}
};

const TopBar = function(params = {}) {
    //console.time("TopBar");

    // Merge params:
    mergeIntoIfMissing(params, TopBarDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let leftSection = null;
    let centerSection = null;
    let rightSection = null;

    // *** PUBLIC VARIABLES:
    box.sections = {
        left: [],
        center: [],
        right: []
    };

    // *** PRIVATE FUNCTIONS:
    /**
     * Creates an icon button with an optional info badge.
     * @param {string} iconPath - Path to the icon.
     * @param {function} onClick - Click handler.
     * @param {object} [info] - Optional info badge config:
     *   { value: number, color: string }
     *   - value: number to show (if 1, shows dot; if >1, shows number; if 0/undefined, hidden)
     *   - color: badge background color (default: "#e74c3c")
     */
    const createIconButton = function(iconPath, onClick, info) {

        // Creates an icon button item
        const button = startBox({
            width: 40,
            height: 40,
            color: "transparent",
            position: "relative",
            clickable: 1,
        });

            // Add a background Box object to the button for custom background styling
            button.background = Box({
                position: "absolute",
                left: 0,
                top: 0,
                width: "calc(100% - 0px)",
                height: "calc(100% - 0px)",
                color: "transparent",
                round: 0,
                border: 0,
            });

            // Center icon vertically and horizontally
            HGroup({
                align: "center middle",
                gap: 0,
                padding: 0,
                width: "100%",
                height: "100%",
            });

                const icon = Icon({
                    width: 32,
                    height: 32,
                    color: "transparent",
                    opacity: 0.85,
                });
                icon.load(iconPath);

            endGroup();

            // Info badge (notification dot/counter)
            // Default badge color
            const defaultBadgeColor = "#e74c3c";
            // Create badge, but hide by default
            button.infoBadge = startBox({
                position: "absolute",
                top: 4,
                right: 4,
                width: 18,
                height: 18,
                color: "transparent",
                round: 9,
                display: "none", // hidden by default
                clipContent: 0,
                border: 1,
            });

                button.infoBadge.label = Label({
                    right: -4,
                    top: -4,
                    text: "",
                    fontSize: 12,
                    round: 3,
                    textColor: "black",
                    color: "transparent",
                    padding: [3, 0],
                    border: 1,
                });

            endBox();

            // Helper to update badge
            button.setInfo = function(infoObj) {
                // infoObj: { value, color }
                let value = infoObj && typeof infoObj.value !== "undefined" ? infoObj.value : undefined;
                let color = infoObj && infoObj.color ? infoObj.color : defaultBadgeColor;

                if (value === undefined || value === null || value === 0) {
                    button.infoBadge.visible = 0;
                    button.infoBadge.label.visible = 0;
                    button.infoBadge.label.text = "";
                    button.infoBadge.color = "transparent";
                } else if (value === 1) {
                    // Show as dot
                    button.infoBadge.visible = 1;
                    button.infoBadge.width = 10;
                    button.infoBadge.height = 10;
                    button.infoBadge.round = 5;
                    button.infoBadge.color = color;
                    button.infoBadge.label.visible = 0;
                    button.infoBadge.label.text = "";
                } else if (typeof value === "number" && value > 1) {
                    // Show as number
                    button.infoBadge.visible = 1;
                    button.infoBadge.width = 10;
                    button.infoBadge.height = 10;
                    button.infoBadge.round = 9;
                    button.infoBadge.color = "transparent";
                    button.infoBadge.label.visible = 1;
                    button.infoBadge.label.color = color;
                    button.infoBadge.label.text = value > 99 ? "99+" : value.toString();
                } else {
                    // Hide for any other case
                    button.infoBadge.visible = 0;
                    button.infoBadge.display = "none";
                    button.infoBadge.label.text = "";
                    button.infoBadge.color = "transparent";
                    button.infoBadge.label.color = "transparent";
                    button.infoBadge.label.visible = 0;
                }
            };

            // If info is provided at creation, set it
            if (info) {
                button.setInfo(info);
            } else {
                button.infoBadge.display = "none";
            }

        endBox();

        button.setMotion("background-color 0.15s");
        button.elem.style.cursor = "pointer";

        // Hover effect
        button.on("mouseover", function() {
            button.background.color = "rgba(255,255,255,0.08)";
            icon.opacity = 1;
        });
        button.on("mouseout", function() {
            button.background.color = "transparent";
            icon.opacity = 0.85;
        });

        // Click event
        if (typeof onClick === "function") {
            button.on("click", function(e) {
                onClick(e);
            });
        };

        // Return the button object for further use
        return button;
    };

    const createTextItem = function(text, onClick) {
        // Creates a text item
        // TODO: Implement text item creation
    };

    const createSection = function(items, sectionType) {
        // Creates a section (left, center, or right) with items
        // TODO: Implement section creation
    };

    const handleItemClick = function(item, sectionType) {
        // Handles item click events
        // TODO: Implement click handling
    };

    // *** PUBLIC FUNCTIONS:
    box.addLeftItem = function(item) {
        // Adds an item to the left section
        // TODO: Implement adding item to left section
    };

    box.addCenterItem = function(item) {
        // Adds an item to the center section
        // TODO: Implement adding item to center section
    };

    box.addRightItem = function(item) {
        // Adds an item to the right section
        // TODO: Implement adding item to right section
    };

    box.removeItem = function(item, sectionType) {
        // Removes an item from specified section
        // TODO: Implement item removal
    };

    box.clearSection = function(sectionType) {
        // Clears all items from specified section
        // TODO: Implement section clearing
    };

    box.setBackgroundColor = function(color) {
        // Sets the background color of the top bar
        // TODO: Implement background color setting
    };

    box.setHeight = function(height) {
        // Sets the height of the top bar
        // TODO: Implement height setting
    };

    // *** OBJECT VIEW:
    // MAIN CONTAINER: Top bar container

    // Arka plan için ayrı box oluştur
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor,
        border: box.borderBottom,
        borderColor: box.borderColor,
    });
    box.background.elem.style.borderBottom = "solid 1px #141414";

    // LEFT SECTION
    box.leftSection = HGroup({
        gap: 8,
        align: "center left",
        padding: [10, 0, 0, 0]
    });
    // TODO: Add left section items here

        
        Icon({
            width: 60,
            height: 60,
        });
        that.load("../assets/icons/panel.png");
        

        Label({
            text: "MY PANEL",
            textColor: "#F3F4E0",
            fontSize: 14,
        });
    
    endGroup();

    // CENTER SECTION
    box.centerSection = HGroup({
        gap: 8,
        align: "center center",
        padding: [0, 16, 0, 16]
    });
    // TODO: Add center section items here
    endGroup();

    // RIGHT SECTION
    box.rightSection = HGroup({
        gap: 8,
        align: "center right",
        padding: [0, 0, 10, 0]
    });
    // TODO: Add right section items here

        createIconButton("../assets/icons/panel.png", function() {}, {value: 1});
        createIconButton("../assets/icons/panel.png", function() {}, {value: 8, color: "indianred"});

    endGroup();

    //console.timeEnd("TopBar");
    
    return endObject(box);
};
