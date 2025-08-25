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
    key: "0",
    panelIcon: "assets/panel-icon.png",
    panelName: "MY PANEL",
    backgroundColor: "#2C5A38", // "#344f6c", "#583432", "#2C5A38"
    onItemClick: function(item) {},
};

const TopBar = function(params = {}) {
    //console.time("TopBar");

    // Merge params:
    mergeIntoIfMissing(params, TopBarDefaults);

    params.position = "absolute";
    params.left = 0;
    params.top = 0;
    params.width = "100%";
    params.height = 40;

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:
    // All items [var]
    box.items = [];

    // *** PRIVATE FUNCTIONS:

    const createBoxItem = function(item) {
        // Creates a empty box item
        // TODO: Implement any object
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

    box.manageSelectionForButton = function(key, button, view) {
        if (view.isShown(key)) {
            button.setSelected(1);
            view.onClose = () => {
                button.setSelected(0);
            };
        } else {
            button.setSelected(0);
        }
    };

    // *** OBJECT VIEW:

    // Arka plan için ayrı box oluştur
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor,
        border: 1,
        borderColor: "rgba(0,0,0,0.1)",
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
            width: 20,
            height: 20,
        });
        that.load(box.panelIcon);
        

        Label({
            text: box.panelName,
            textColor: "#F3F4E0",
            fontSize: 14,
        });

        // EXAMPLE: How to add a ComboBox on topBar
        TinySelect({
            title: "",
            label: "",
            fontSize: 14,
            height: 30,
            paddingX: 8,
            labelBoldFont: 0,
            round: 8,
            color: "#141414DD", // "whitesmoke"
            labelTextColor: "rgba(255,255,255,0.8)",
            round: 3,
            listTextColor: "rgba(255, 255, 255, 0.8)",
            listOverTextColor: "indianred",
            listBackgroundColor: "#141414",
            listBorder: 1,
            listBorderColor: "rgba(255,255,255,0.4)",
            list: [
                { id: "1", label: "English" },
                { id: "2", label: "Spanish" },
                { id: "3", label: "French" },
                { id: "4", label: "Turkish" },
            ],
            arrowIcon: "assets/arrow_down.png",
            invertIconColor: 1,
            selectedIndex: 3,
        });
        //that.elem.style.filter = "invert(100%)";
        that.onSelect = function(index, id, label, title) {
            console.log(`TinySelect: ${title}: ${label} (${id})`);
        };
        that.setMotion("background-color 0.2s");
        that.on("mouseover", function(self) {
            //self.color = "rgba(0,0,0,0.4)";
        });
        that.on("mouseout", function(self) {
            //self.color = "rgba(0,0,0,0.1)";
        });

        TopBarIconButton({
            iconPath: "assets/top-bar/comment.png",
            invertIconColor: 1,
            hintText: "Show Dialog",
            hintPosition: "right",
            onClick: function() {

                // EXAMPLE: How to use a Dialog
                Dialog({
                    icon: "assets/maybe.png",
                    title: "Warning!",
                    desc: "Are you sure you want to log out?",
                    confirmButtonText: "Yes, I'm sure",
                    callback: function(id) {
                        println("answer: " + id);
                        if (id === 1) logout();
                    },
                    cancelButtonText: "Cancel",
                    confirmButtonColor: basic.WARNING_COLOR,
                    color: Black(0.7), // Black(0.7)
                });
                //that.elem.style.filter = "invert(100%)";

            },
        });
    
    endGroup();

    // CENTER SECTION
    box.centerBox = HGroup({
        gap: 8,
        align: "center center",
        padding: [0, 16, 0, 16]
    });
    // TODO: Add center section items here

        TopBarIconButton({
            iconPath: "assets/top-bar/apps.png",
            invertIconColor: 1,
            hintText: "Module 4 (MainView)",
            hintPosition: "right",
            onClick: function(self) {
                openPageByKey("module4");
                box.manageSelectionForButton("module4", self, mainView);
            },
        });

        TopBarIconButton({
            iconPath: "assets/top-bar/bookmark.png",
            invertIconColor: 1,
            hintText: "Module 5 (LeftView)",
            hintPosition: "right",
            onClick: function(self) {
                openPageByKey("module5");
                box.manageSelectionForButton("module5", self, rightView);
            },
        });


        // EXAMPLE: How to add a Label on topBar
        // toggleTitle
        Label({
            text: "SWITCH:",
            textColor: White(0.65),
            fontSize: 14,
        });

        // EXAMPLE: How to add a Toggle on topBar
        Toggle({
            key: "0",
            width: 50, // Standard box features are added automatically.
            height: 30,
            spacing: 3,
            value: 1,
            invertColor: 0,
            backgroundStyle: {
                color: "black",
                selectedColor: "indianred",
                border: 1,
                borderColor: Black(0.75),
                round: 100,
            },
            buttonStyle: {
                color: White(0.25),
                selectedColor: White(0.75),
                border: 0,
                round: 100,
            }
        });
        that.onChange = function(self) {
            println(`Toggle: ${self.value}`);
        };

    endGroup();

    // RIGHT SECTION
    box.rightBox = HGroup({
        gap: 8,
        align: "center right",
        padding: [0, 0, 10, 0]
    });
    // TODO: Add right section items here

        // EXAMPLE: How to add a SearchInput on topBar
        box.searchInput = SearchInput({
            top: 0,
            left: 0,
            width: 200,
            height: 30,
            color: "#141414DD", // rgba(255,255,255,0.8), rgba(0,0,0,0.1)
            textColor: "#EBEBEB",
            round: 30,
            fontSize: 16,
            searchIconSize: 20,
            placeholderText: "Search",
            position: "relative",
            invertIconColor: 1,
            searchIconFile: "assets/top-bar/search.png",
            clearIconFile: "assets/top-bar/cancel.png",
        });
        box.searchInput.onSearch = function(searchedText, self) {
            console.log(`Searched: ${searchedText}`);
        };
        //box.searchInput.visible = 0; // to hide/show searchInput

        TopBarIconButton({
            iconPath: "assets/top-bar/notification.png",
            invertIconColor: 1,
            badgeProps: { value: 5 },
            hintText: "Notifications",
            hintPosition: "left",
            onClick: function(self) {
                openPageByKey(NotificationsPage.KEY);
                box.manageSelectionForButton(NotificationsPage.KEY, self, rightView);
            },
        });
        
        TopBarIconButton({
            iconPath: "assets/top-bar/user.png",
            invertIconColor: 1,
            hintText: "Profile",
            hintPosition: "left",
            onClick: function(self) {
                openPageByKey(UserActionsPage.KEY);
                box.manageSelectionForButton(UserActionsPage.KEY, self, rightView);
            },
        });

    endGroup();

    //console.timeEnd("TopBar");
    
    return endObject(box);
};

// ============================================================================
// TOP BAR ICON BUTTON COMPONENT
// ============================================================================

// Default values:
const TopBarIconButtonDefaults = {
    width: 40,
    height: 40,
    iconPath: "",
    iconWidth: 24,
    iconHeight: 24,
    iconOpacity: 0.75,
    backgroundColor: "rgba(0,0,0,0.1)",
    hoverBackgroundColor: "rgba(0,0,0,0.4)",
    invertIconColor: 0,
    hoverIconOpacity: 1,
    createBudge: 1,
    isSelected: 0,
    badge: null,
    badgeProps: {
        value: 0,
    },
    hintText: "Info",
    hintPosition: "right",
    onClick: function() {},
};

const TopBarIconButton = function(params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, TopBarIconButtonDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:

    // *** PUBLIC VARIABLES:

    // "normal", "selected" [var]
    box.state = "normal";
    // [var]
    box.badge = null;

    // *** PRIVATE FUNCTIONS:

    // *** PUBLIC FUNCTIONS:
    box.setState = function(state) {

        box.state = state;
        
        switch(box.state) {
            case "normal":
                box.background.color = box.backgroundColor;
                box.icon.opacity = box.iconOpacity;
                //box.clickable = 1;
                break;
            case "mouseover":
                box.background.color = box.hoverBackgroundColor;
                box.icon.opacity = box.hoverIconOpacity;
                break;
            case "selected":
                box.background.color = box.hoverBackgroundColor;
                box.icon.opacity = box.hoverIconOpacity;
                //box.clickable = 0;
                break;
        }

    };

    box.setSelected = function(selected) {
        box.isSelected = selected;
        if (box.state != "mouseover") {
            box.setState((selected) ? "selected" : "normal");
        }
    };

    // *** OBJECT VIEW:
        // Creates an icon button with an optional info badge
        box.background = Box(4, 4, "calc(100% - 8px)", "calc(100% - 8px)", {
            color: box.backgroundColor,
            round: 8,
            border: 0,
            borderColor: White(1),
        });
        box.background.setMotion("background-color 0.2s");

        // Center icon vertically and horizontally
        box.iconGroup = HGroup({
            align: "center",
            gap: 0,
            padding: 0,
            width: "100%",
            height: "100%",
        });

            box.icon = Icon({
                width: box.iconWidth,
                height: box.iconHeight,
                color: "transparent",
                opacity: box.iconOpacity,
            });
            box.icon.load(box.iconPath);
            if(box.invertIconColor == 1) {
                box.icon.elem.style.filter = "invert(100%)";
            }

        endGroup();

        // Badge if specified
        if (box.createBudge == 1) {
            box.badge = Badge(box.badgeProps);
        }

        box.tooltip = Tooltip({
            target: box,
            hintText: box.hintText,
            hintPosition: box.hintPosition,
            lbl_color: "#141414",
            lbl_border: 1,
            lbl_textColor: White(0.75),
            lbl_borderColor: White(0.5),
            lbl_fontSize: 12,
            lbl_round: 4,
        });

    // *** OBJECT INIT CODE:
    box.setMotion("background-color 0.2s");
    box.elem.style.cursor = "pointer";

    // Hover effect
    box.on("mouseover", function() {
        box.setState("mouseover");
    });

    box.on("mouseout", function() {
        if (box.isSelected === 1) {
            box.setState("selected");
        } else {
            box.setState("normal");
        }
    });

    // Click event
    box.on("click", function(self, event) {
        box.onClick(self, event);
    });
    
    return endObject(box);
};

