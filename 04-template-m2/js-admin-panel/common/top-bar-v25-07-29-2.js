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
    items: [],
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
    let leftBox = null;
    let centerBox = null;
    let rightBox = null;

    // *** PUBLIC VARIABLES:
    box.sections = {
        left: [],
        center: [],
        right: []
    };

    // *** PRIVATE FUNCTIONS:

    // Creates an icon button with an optional info badge.
    const createIconButton = function(iconPath, onClick) {

        // Creates an icon button item
        const button = startBox({
            width: 40,
            height: 40,
            color: "transparent",
            position: "relative",
            clickable: 1,
        });

        button.state = "normal"; // "normal", "selected"

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

            button.badge = Badge({
                value: random(1, 2),
                maxValue: 99,
            });

            // USE: button.badget.setValue(0) // 0, 1, 10

        endBox();

        button.setMotion("background-color 0.15s");
        button.elem.style.cursor = "pointer";

        button.setState = function(state) {
            button.state = state;
            switch(button.state) {
                case "normal":
                    break;
                case "selected":
                    break;
            }
        }

        // USE: button.setState("selected");

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
    box.leftBox = HGroup({
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
    box.centerBox = HGroup({
        gap: 8,
        align: "center center",
        padding: [0, 16, 0, 16]
    });
    // TODO: Add center section items here
    endGroup();

    // RIGHT SECTION
    box.rightBox = HGroup({
        gap: 8,
        align: "center right",
        padding: [0, 0, 10, 0]
    });
    // TODO: Add right section items here

        createIconButton("../assets/icons/panel.png", function() {});
        createIconButton("../assets/icons/panel.png", function() {}, {value: 8, color: "indianred"});

    endGroup();

    //console.timeEnd("TopBar");
    
    return endObject(box);
};

