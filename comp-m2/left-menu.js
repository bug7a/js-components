/* Bismillah */

/*

LeftMenu - v26.09

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

- The menu opens when the mouse is over it. On a touch device there is no hover, so it opens with a tap:
  the first tap opens the menu (it does not select an item, because the texts are not visible when it is closed),
  the second tap selects the item and closes the menu. A tap outside the menu also closes it.
-- openOnClick: "auto" (touch device: tap, mouse: hover), 1: always tap, 0: always hover.
-- leftMenu.setOpenOnClick(1) changes it later.

Started Date: December 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const LeftMenuDefaults = {
    key: "0",
    expandedWidth: 250,           // Expanded width on hover
    topBarHeight: 40,             // Height of top bar to account for
    backgroundColor: "#141414",   // Menu background color
    hoverColor: "rgba(255, 255, 255, 0.05)", // Hover color for buttons
    selectedColor: "#583432",     // Selected button color
    titleColor: "#8E342F",
    textColor: "rgba(255, 255, 255, 0.6)",           // Text color
    selectedTextColor: "rgba(255, 255, 255, 0.95)",
    invertIconColor: 1,
    openOnClick: "auto",          // "auto": Tap on a touch device, hover with a mouse. 1: Always tap, 0: Always hover.
    items: [],                    // Menu items array
    onItemClick: function(item) {}, // Callback when item is clicked
    onMenuToggle: function(isExpanded) {}, // Callback when menu expands/collapses
};

const LeftMenu = function(params = {}) {

    //console.time("LeftMenu");

    // Marge params:
    mergeIntoIfMissing(params, LeftMenuDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let isExpanded = 0;           // Menu expansion state
    let selectedItemKey = null;   // Currently selected item
    let hoverTimeout = null;      // Hover delay timer
    let useTapMode = 0;           // 1: The menu opens with a tap (touch device), not with hover.
    const itemList = [];          // Array to store menu items
    const itemElements = [];      // Array to store item UI elements
    const WIDTH = 40;

    // *** PUBLIC VARIABLES:
    box.publicVar = 1;
    box.state = "collapsed";      // "collapsed", "expanded"

    // *** PRIVATE FUNCTIONS:

    // Create a menu button item
    const createButtonItem = function(item) {

        const buttonBox = startBox({
            width: "100%",
            height: 40,
            color: "transparent",
            clickable: 1,
            position: "relative",
        });
        buttonBox.setMotion("background-color 0.2s");
        buttonBox.elem.style.cursor = "pointer";
        buttonBox.data = item;

            HGroup({
                align: "left center",
                gap: 20, //12
                padding: [8, 0],
            });

                // Icon
                buttonBox.icon = Icon({
                    width: 24,
                    height: 24,
                    color: "transparent",
                    opacity: 0.6,
                });
                buttonBox.icon.load(item.icon);

                if (box.invertIconColor == 1) {
                    that.elem.style.filter = "invert(100%)";
                }

                // Text label (hidden when collapsed)
                buttonBox.textLabel = Label({
                    text: item.text,
                    textColor: box.textColor,
                    fontSize: 18,
                    color: "transparent",
                });

            endGroup();

        endBox();

        // Click handler
        buttonBox.on("click", function(self, event) {

            // WHY: The menu box also listens for the tap (to open itself). Without this, closing after a selection would open it again.
            if (event) event.stopPropagation();

            // WHY: Touch device, closed menu: only the icons are visible. The first tap opens the menu, it does not select.
            if (useTapMode && !isExpanded) {
                expandMenu();
                return;
            }

            if (selectedItemKey != item.key) {
                if (!item.dontSelect) {
                    selectItem(item.key);
                }
                box.onItemClick(item);
            }

            // Touch device: the open menu must not stay over the page.
            if (useTapMode) collapseMenu();

        });

        // Hover effects
        buttonBox.on("mouseover", function() {
            if (useTapMode) return; // WHY: A touch also fires mouseover; the color would stay on the item.
            //buttonBox.color = box.hoverColor;
            // INSERT_YOUR_CODE
            // Create a left-to-right fading gradient effect on hover
            if (selectedItemKey != item.key) {
                buttonBox.elem.style.background = `linear-gradient(to right, ${box.hoverColor} 0%, rgba(0,0,0,0) 100%)`;
                buttonBox.icon.opacity = 1;
                buttonBox.textLabel.textColor = box.selectedTextColor;
            }
            //if (!isExpanded) {
            //    buttonBox.color = box.hoverColor;
            //}
        });

        buttonBox.on("mouseout", function() {
            if (useTapMode) return;
            if (selectedItemKey != item.key) {
                buttonBox.elem.style.background = `transparent`;
                buttonBox.icon.opacity = 0.6;
                buttonBox.textLabel.textColor = box.textColor;
            }
            //buttonBox.color = "transparent";
            //if (!isExpanded) {
            //    buttonBox.color = "transparent";
            //}
        });

        return buttonBox;
    };

    // Create a header item
    const createHeaderItem = function(item) {

        const headerBox = startBox({
            width: "100%",
            height: 29,
            color: "transparent",
            clickable: 1,
            position: "relative",
        });
        headerBox.data = item;

            Box(0, 0, 100, 1, {
                //color: "#EBEBEB",
                color: box.titleColor,
            });
            that.top = 14;
            that.opacity = 0.50;

            AutoLayout({
                align: "left center",
                padding: [40, 0],
            });

                // Header text
                const headerText = Label({
                    text: item.text,
                    //textColor: "rgba(255,255,255,0.4)",
                    textColor: box.titleColor,
                    fontSize: 12,
                    color: box.backgroundColor,
                    padding: [12, 0],
                });
                headerText.elem.style.fontWeight = "bold";
                headerText.elem.style.textTransform = "uppercase";

            endAutoLayout();

        endBox();

        return headerBox;

    };

    box.clearSelection = function() {

        // Önceki seçili öğeyi bırak
        if (selectedItemKey) {
            const prev = itemElements.find(el => el.data.key === selectedItemKey);
            if (prev && prev.data.type === "button") {
                prev.elem.style.background = `transparent`;
                prev.icon.opacity = 0.6;
                prev.textLabel.textColor = box.textColor;
                prev.elem.style.cursor = "pointer";
            }

            selectedItemKey = null;
        }

    }

    // Bir öğeyi seç (görsel durumu güncelle)
    const selectItem = function(itemKey) {

        // Önceki seçili öğeyi bırak
        box.clearSelection();

        // Yeni öğeyi seç
        const current = itemElements.find(el => el.data.key === itemKey);
        if (current && current.data.type === "button") {
            current.elem.style.background = `linear-gradient(to right, ${box.selectedColor} 0%, rgba(0,0,0,0) 100%)`;
            current.icon.opacity = 1;
            current.textLabel.textColor = box.selectedTextColor;
            current.elem.style.cursor = "default";

            selectedItemKey = itemKey;
        }

    };

    // Expand menu
    const expandMenu = function() {
        if (isExpanded) return;
        
        isExpanded = 1;
        box.state = "expanded";
        box.width = box.expandedWidth;

        box.onMenuToggle(1);
    };

    // Collapse menu
    const collapseMenu = function() {
        if (!isExpanded) return;
        
        isExpanded = 0;
        box.state = "collapsed";
        box.width = WIDTH;

        box.onMenuToggle(0);
    };

    // Is this a touch device? (No mouse hover.)
    const isTouchDevice = function() {
        // WHY: "hover: none" is the real question (a tablet, a phone). isMobile() is the fallback for old browsers.
        if (window.matchMedia && window.matchMedia("(hover: none)").matches) return 1;
        if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) return 1;
        return (typeof isMobile === "function" && isMobile()) ? 1 : 0;
    };

    // Tap outside the menu: close it. (Only in tap mode)
    const onDocumentPointerDown = function(event) {
        if (!box || !useTapMode || !isExpanded) return;
        if (box.elem.contains(event.target)) return;
        collapseMenu();
    };

    // *** PUBLIC FUNCTIONS:

    // "auto": Tap on a touch device, hover with a mouse. 1: Always tap, 0: Always hover.
    box.setOpenOnClick = function(openOnClick) {
        box.openOnClick = openOnClick;
        useTapMode = (openOnClick === "auto") ? isTouchDevice() : ((openOnClick == 1 || openOnClick === true) ? 1 : 0);
        if (!useTapMode) collapseMenu(); // WHY: Hover mode starts closed; the mouse decides.
        return useTapMode;
    };
    // USAGE: leftMenu.setOpenOnClick(1) // Returns 1 if the menu opens with a tap.

    box.isTapMode = function() {
        return useTapMode;
    };

    box.destroy = function() {

        // WHY: document and page events are not cleaned by box.remove().
        document.removeEventListener("pointerdown", onDocumentPointerDown, true);
        page.remove_onResize(resizeScrollableBox);
        clearTimeout(hoverTimeout);

        box.remove(); // NOTE: It will clean all events like box.on("click"
        box = null;

    };

    // Add item to top of menu
    box.addItemToTop = function(item) {

        itemList.push(item);
        const element = item.type === "button" ? createButtonItem(item) : createHeaderItem(item);
        itemElements.push(element);

        // Add to UI at top using topBox
        box.topBox.add(element);

        return element;
    };

    // Add item to bottom of menu
    box.addItemToBottom = function(item) {

        itemList.push(item);
        const element = item.type === "button" ? createButtonItem(item) : createHeaderItem(item);
        itemElements.push(element);
        
        // UI'ya alta ekle
        box.bottomBox.add(element);

        return element;

    };

    // Remove item by key
    box.removeItem = function(itemKey) {

        if (itemKey === selectedItemKey) box.clearSelection(); // Eğer seçili olan silinmeye çalışıyor ise, önce seçimi kaldır.
        
        const index = itemList.findIndex(item => item.key === itemKey);
        if (index !== -1) {
            const element = itemElements[index];
            element.remove();
            itemList.splice(index, 1);
            itemElements.splice(index, 1);
        }

    };

    // Get selected item
    box.getSelectedItem = function() {
        return itemList.find(item => item.key === selectedItemKey);
    };

    // Set selected item
    box.setSelectedItem = function(itemKey) {
        selectItem(itemKey);
    };

    // Expand menu programmatically
    box.expand = function() {
        expandMenu();
    };

    // Collapse menu programmatically
    box.collapse = function() {
        collapseMenu();
    };

    // Toggle menu state
    box.toggle = function() {
        if (isExpanded) {
            collapseMenu();
        } else {
            expandMenu();
        }
    };

    // *** OBJECT VIEW:
    box.elem.style.cursor = "default";
    box.color = box.backgroundColor;
    box.height = `calc(100% - ${box.topBarHeight}px)`;
    box.width = WIDTH;
    box.bottom = 0;
    box.left = 0;
    box.round = 0;
    //box.elem.style.borderRight = "solid 1px black";

        const SPACE_BETWEEN = 30;
    
        box.scrollableBox = startBox(0, SPACE_BETWEEN, box.expandedWidth, 0);
        that.color = "transparent";
        that.scrollY = 1;

            box.topBox = VGroup({
                align: "top left",
                gap: 0,
                padding: 0,
                height: "auto",
                width: "100%",
            });
            that.position = "relative";

            // Add initial items
            box.items.forEach(item => {
                box.addItemToTop(item);
            });

            //createHeaderItem({ key: "divider1", type: "header", text: "Araçlar" });
            //createButtonItem({ key: "home", type: "button", text: "Ana Sayfa", icon: "../assets/icons/alert.png" });
            //createButtonItem({ key: "home", type: "button", text: "Ana Sayfa", icon: "../assets/icons/alert.png" });        

            endGroup();

        endBox();

        // SCROLL BAR:
        box.scrollBar = ScrollBar({
            scrollableBox: box.scrollableBox,
            bar_border: 0,
            bar_round: 3,
            bar_borderColor: "rgba(0, 0, 0, 1)",
            bar_width: 4,
            bar_mouseOverWidth: 4, //8
            bar_mouseOverColor: "#FFFFFF",
            bar_opacity: 0.4,
            bar_mouseOverOpacity: 0.9,
            bar_padding: 2,
            bar_color: "#FFFFFF",
            neverHide: 0,
            showDots: 1,
        });

        const resizeScrollableBox = function() {
            box.scrollableBox.height = box.height - (SPACE_BETWEEN * 2) - box.bottomBox.height - SPACE_BETWEEN;
        };

        // Menu container
        box.bottomBox = VGroup({
            align: "bottom left",
            gap: 0,
            padding: 0,
            height: "auto",
            width: box.expandedWidth,
        });
        that.bottom = SPACE_BETWEEN;
        that.left = 0;
        that.color = "transparent";
        box.bottomBox.onResize(function(self) {
            resizeScrollableBox();
        });

        page.onResize(resizeScrollableBox);

        //createButtonItem({ key: "home", type: "button", text: "Ana Sayfa", icon: "../assets/icons/alert.png" });
        //createButtonItem({ key: "home", type: "button", text: "Ana Sayfa", icon: "../assets/icons/alert.png" });

    endGroup();

    // *** OBJECT INIT CODE:
    
    box.setOpenOnClick(box.openOnClick);

    // Hover events for expansion (mouse)
    box.on("mouseenter", function() {
        if (useTapMode) return;
        expandMenu();
        //clearTimeout(hoverTimeout);
        //hoverTimeout = setTimeout(expandMenu, 200); // 200ms delay
    });

    box.on("mouseleave", function() {
        if (useTapMode) return;
        collapseMenu();
        //clearTimeout(hoverTimeout);
        //hoverTimeout = setTimeout(collapseMenu, 500); // 500ms delay before collapse
    });

    // Tap on the menu (also on an empty place of it): open it. (Touch device)
    box.on("click", function() {
        if (useTapMode && !isExpanded) expandMenu();
    });

    // WHY: Capture, so it also works when the tap is stopped by another object. (Ex: a page that closes its own menu)
    document.addEventListener("pointerdown", onDocumentPointerDown, true);

    //console.timeEnd("LeftMenu");
    
    return endObject(box);

};
