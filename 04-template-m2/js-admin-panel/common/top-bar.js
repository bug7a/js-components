/* Bismillah */

/*

TopBar - v26.09

UI COMPONENT TEMPLATE
- Top bar of the admin panel with left, center, and right sections.
- LEFT: Panel icon and name (click: Home), panel select (A, B, C: opens another panel by its URL),
  keyboard shortcuts button (hidden, see SHOW_SHORTCUTS_BUTTON).
- CENTER: Module buttons and the maintenance mode switch. Hidden, see SHOW_CENTER_ITEMS.
  The code stays as an example of what can be put in the center.
- RIGHT:
  - Search: Pages, users, customers, orders, contents and products. Results open under the input.
    The input gets narrower on small screens (SEARCH_SIZES), so the other buttons also fit on mobile.
    Keyboard: Ctrl+K, Cmd+K or "/" to search, ArrowUp/ArrowDown to move, Enter to open, Escape to close.
  - Create menu (+): Invite user, new product, new post.
  - Notifications (unread count), profile (initials).
- Escape also closes the right view.

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

    const WARNING_COLOR = "#F2B24C";
    const MAX_RESULTS_PER_GROUP = 5;

    // Hidden parts. Set to 1 to show them again. (The code stays as an example.)
    const SHOW_CENTER_ITEMS = 0;
    const SHOW_SHORTCUTS_BUTTON = 0;

    // Panels of the select box on the left. Write the URL of the other panel to switch to it.
    // USAGE: { id: "b", label: "B", url: "../other-panel/index.htm" }
    const PANELS = [
        { id: "a", label: "A", url: "" },
        { id: "b", label: "B", url: "" },
        { id: "c", label: "C", url: "" },
    ];

    // Width of the search input by the page width. The first matching line is used.
    // WHY: On a narrow screen the search must not fill the top bar. Create, notifications
    //      and profile buttons need space too.
    const SEARCH_SIZES = [
        { minPageWidth: 1200, width: 260, placeholderText: "Search  (Ctrl K)" },
        { minPageWidth: 1000, width: 200, placeholderText: "Search  (Ctrl K)" },
        { minPageWidth: 760, width: 160, placeholderText: "Search" },
        { minPageWidth: 0, width: 130, placeholderText: "" },
    ];

    let searchPages = []; // Menu items (setSearchPages)
    let searchTimer = null;
    let searchText = "";
    let isRendering = 0; // WHY: Component setters call onChange/onSelect. Values written by code are not user changes.

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

    const escapeHtml = function(text) {
        return String(text).replace(/[&<>"']/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; });
    };

    // Saves one setting and applies it to the panel.
    const saveSetting = function(key, value) {
        if (typeof SettingsPage === "undefined") return;
        const settings = SettingsPage.load();
        settings[key] = value;
        SettingsPage.saveAndApply(settings); // WHY: Also updates the Settings page, if it is open.
    };

    // Closes the right view and opens a page in the main view.
    const openMainPage = function(pageKey, openPage) {
        if (rightView.isShown()) {
            rightView.hide();
            rightView.clean();
        }
        leftMenu.setSelectedItem(pageKey);
        openPage();
    };

    // *** SEARCH:

    // Finds the results for a text. Every group has a few results.
    const findResults = function(text) {

        const list = [];
        const query = text.trim().toLowerCase();
        if (!query) return list;

        const has = function(value) { return String(value).toLowerCase().includes(query); };
        const addGroup = function(group, items) {
            items.slice(0, MAX_RESULTS_PER_GROUP).forEach(function(item) { item.group = group; list.push(item); });
        };

        // Pages
        addGroup("Pages", searchPages.filter(function(item) { return item.type == "button" && has(item.text); }).map(function(item) {
            return {
                text: item.text,
                desc: "Page",
                open: function() {
                    if (!item.dontSelect) leftMenu.setSelectedItem(item.key);
                    openPageByKey(item.key);
                },
            };
        }));

        // Users
        if (typeof UserListPage !== "undefined") {
            const data = UserListPage.load();
            addGroup("Users", data.users.filter(function(user) { return has(user.name) || has(user.email); }).map(function(user) {
                return {
                    text: user.name,
                    desc: user.email + " · " + UserListPage.getRoleName(data, user.roleId),
                    open: function() { openMainPage(UserListPage.KEY, function() { UserListPage({ openUserId: user.id }); }); },
                };
            }));
        }

        // Customers
        if (typeof CustomersPage !== "undefined") {
            addGroup("Customers", CustomersPage.getCustomers().filter(function(c) { return has(c.name) || has(c.email); }).map(function(c) {
                return {
                    text: c.name,
                    desc: c.email + " · " + c.orderCount + " orders · " + OrdersPage.formatMoney(c.totalSpent),
                    open: function() { openMainPage(CustomersPage.KEY, function() { CustomersPage({ openCustomerId: c.id }); }); },
                };
            }));
        }

        // Orders
        if (typeof OrdersPage !== "undefined") {
            addGroup("Orders", OrdersPage.getOrders().filter(function(order) { return has(order.id) || has(order.customer.name); }).map(function(order) {
                return {
                    text: order.id + " · " + order.customer.name,
                    desc: OrdersPage.formatMoney(order.total) + " · " + OrdersPage.STATUSES[order.status].label + " · " + OrdersPage.formatDateTime(order.time),
                    open: function() { openMainPage(OrdersPage.KEY, function() { OrdersPage({ openOrderId: order.id }); }); },
                };
            }));
        }

        // Contents
        if (typeof ContentsPage !== "undefined") {
            addGroup("Contents", ContentsPage.getContents().filter(function(content) { return has(content.title) || has(content.slug); }).map(function(content) {
                return {
                    text: content.title,
                    desc: ContentsPage.TYPES[content.type].label + " · " + ContentsPage.STATUSES[content.status].label + " · " + ContentsPage.TYPES[content.type].path + content.slug,
                    open: function() { openMainPage(ContentsPage.KEY, function() { ContentsPage({ openContentId: content.id }); }); },
                };
            }));
        }

        // Products
        if (typeof ProductsPage !== "undefined") {
            addGroup("Products", ProductsPage.getProducts().filter(function(product) { return has(product.name) || has(product.sku); }).map(function(product) {
                return {
                    text: product.name,
                    desc: product.sku + " · " + ProductsPage.formatMoney(product.price),
                    open: function() { openMainPage(ProductsPage.KEY, function() { ProductsPage({ openProductId: product.id }); }); },
                };
            }));
        }

        return list;

    };

    // Shows the results of the current text in the SearchResults component.
    // WHY: The list itself (rows, groups, keyboard, scrolling) is comp-m4/search-results.js now.
    //      Only what is searched and what happens when a result is opened stays here.
    const showResults = function() {
        box.searchResults.setItems(findResults(searchText), searchText);
    };

    // *** RESPONSIVE:

    // Makes the search input narrower when the screen gets narrower. (SEARCH_SIZES)
    const layoutSearchInput = function() {
        const size = SEARCH_SIZES.find(function(item) { return page.width >= item.minPageWidth; });
        if (!size || box.searchInput.width == size.width) return;
        box.searchInput.width = size.width; // WHY: SearchInput lays its parts out again on resize.
        box.searchInput.setPlaceholderText(size.placeholderText);
    };

    // *** DIALOGS:

    const showShortcuts = function() {
        const line = function(keys, text) {
            return "<div style='display:flex; justify-content:space-between; gap:24px; padding:4px 0'><b>" + keys + "</b><span>" + text + "</span></div>";
        };
        Dialog({
            icon: "assets/maybe.png",
            title: "Keyboard Shortcuts",
            desc: line("Ctrl K  /  ⌘ K  /  /", "Search")
                + line("↑  ↓", "Move in the results")
                + line("Enter", "Open the result")
                + line("Esc", "Close the results or the right panel"),
            confirmButtonText: "OK",
            cancelButtonText: "Close",
            confirmButtonColor: "#3D7A6B",
            color: Black(0.7),
            callback: function() {},
        });
    };

    const setMaintenanceView = function(isOn) {
        box.lblMaintenance.text = (isOn) ? "MAINTENANCE ON" : "MAINTENANCE";
        box.lblMaintenance.textColor = (isOn) ? WARNING_COLOR : White(0.65);
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
        box.backgroundColor = color;
        box.background.color = color;
        if (box.avatarDot) box.avatarDot.borderColor = color;
    };

    // Unread notification count on the bell. (0: hidden, 1: dot, 2+: number)
    box.setNotificationCount = function(count) {
        box.btnNotifications.badge.setValue(count);
    };

    box.setPanelName = function(name) {
        box.panelName = name;
        box.lblPanelName.text = name;
    };

    // Pages for the search. (The menu items of the left menu)
    box.setSearchPages = function(items) {
        searchPages = items;
    };
    // USAGE: topBar.setSearchPages(menuItems)

    // Maintenance mode and the user (from Settings)
    box.applySettings = function(settings) {
        isRendering = 1;
        if (box.tglMaintenance.value != (settings.maintenance ? 1 : 0)) box.tglMaintenance.setValue(settings.maintenance ? 1 : 0);
        setMaintenanceView(settings.maintenance == 1);
        isRendering = 0;
        box.refreshUser();
    };

    // Initials and status dot of the profile button
    box.refreshUser = function() {
        if (typeof UserActionsPage === "undefined") return;
        const user = UserActionsPage.getCurrentUser();
        box.lblAvatar.text = UserActionsPage.getInitials(user.name);
        box.avatar.color = user.avatarColor;
        if (box.avatarDot) box.avatarDot.color = UserActionsPage.STATUSES[UserActionsPage.getStatus()].color;
        box.btnProfile.tooltip.setHintText(escapeHtml(user.name) + " · " + UserActionsPage.STATUSES[UserActionsPage.getStatus()].label);
    };

    box.focusSearch = function() {
        box.searchInput.focus();
        box.searchInput.txtSearch.inputElement.select();
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
        borderColor: Black(0.1),
    });
    box.background.elem.style.borderBottom = "solid 1px #141414";

    // LEFT SECTION
    box.leftBox = HGroup({
        gap: 8,
        align: "center left",
        padding: [10, 0, 0, 0]
    });

        // GROUP: Panel icon and name (click: Home)
        box.btnHome = HGroup({ width: "auto", height: 30, align: "left center", gap: 8, padding: [4, 0], round: 6 });
        that.elem.style.cursor = "pointer";
        that.elem.title = "Home";
        that.on("click", function() {
            openMainPage(HomePage.KEY, function() { HomePage(); });
        });

            Icon({
                width: 20,
                height: 20,
            });
            that.load(box.panelIcon);

            box.lblPanelName = Label({
                text: box.panelName,
                textColor: "#F3F4E0",
                fontSize: 14,
            });
            that.elem.style.whiteSpace = "nowrap";

        endGroup();

        // EXAMPLE: How to add a ComboBox on topBar
        // Panel select: opens another panel. Write the URLs into PANELS.
        box.selPanel = TinySelect({
            title: "",
            label: "",
            fontSize: 14,
            height: 30,
            paddingX: 8,
            labelBoldFont: 0,
            round: 8,
            color: "#141414DD", // "whitesmoke"
            labelTextColor: White(0.8), // WHY: On the colored top bar, not on the page.
            listTextColor: Ink(0.8),
            listOverTextColor: T.accent,
            listBackgroundColor: T.surfaceDeep,
            listBorder: 1,
            listBorderColor: Ink(0.4),
            list: PANELS,
            arrowIcon: "assets/top-bar/arrow-down.svg",
            invertIconColor: 1,
            selectedIndex: 0,
        });
        that.onSelect = function(index, id) {
            if (isRendering) return;
            const panel = PANELS[index];
            if (panel && panel.url) go(panel.url); // USAGE: go(url, "_blank") opens it in a new tab.
        };

        // EXAMPLE: How to use a Dialog
        // NOTE: Hidden. The same dialog is also in the create menu (+) as "Keyboard Shortcuts".
        box.btnShortcuts = TopBarIconButton({
            iconPath: "assets/top-bar/keyboard.svg",
            invertIconColor: 1,
            hintText: "Keyboard shortcuts",
            hintPosition: "right",
            onClick: showShortcuts,
        });
        box.btnShortcuts.visible = SHOW_SHORTCUTS_BUTTON;

    endGroup();

    // CENTER SECTION
    // NOTE: Hidden (SHOW_CENTER_ITEMS). Everything below stays as an example of what can be
    //       put in the center: icon buttons, a Label and a Toggle.
    box.centerBox = HGroup({
        gap: 8,
        align: "center center",
        padding: [0, 16, 0, 16]
    });

        TopBarIconButton({
            iconPath: "assets/top-bar/apps.svg",
            invertIconColor: 1,
            hintText: "Module 4 (Main View)",
            hintPosition: "right",
            onClick: function(self) {
                openPageByKey("module4");
                box.manageSelectionForButton("module4", self, mainView);
            },
        });

        TopBarIconButton({
            iconPath: "assets/top-bar/bookmark.svg",
            invertIconColor: 1,
            hintText: "Module 5 (Right View)",
            hintPosition: "right",
            onClick: function(self) {
                openPageByKey("module5");
                box.manageSelectionForButton("module5", self, rightView);
            },
        });

        // EXAMPLE: How to add a Label and a Toggle on topBar
        // Maintenance mode (saved to Settings > Advanced)
        box.lblMaintenance = Label({
            text: "MAINTENANCE",
            textColor: White(0.65),
            fontSize: 12,
        });
        that.elem.style.letterSpacing = "1px";
        that.elem.style.marginLeft = "8px";
        that.setMotion("color 0.2s");

        box.tglMaintenance = Toggle({
            key: "0",
            width: 50, // Standard box features are added automatically.
            height: 30,
            spacing: 3,
            value: 0,
            invertColor: 0,
            backgroundStyle: {
                color: "black",
                selectedColor: "#B87A1A",
                border: 1,
                borderColor: Black(0.75),
                round: 100,
            },
            buttonStyle: {
                color: White(0.25),
                selectedColor: White(0.9),
                border: 0,
                round: 100,
            }
        });
        box.tglMaintenance.elem.title = "Maintenance mode: users see a maintenance page";
        that.onChange = function(self) {

            if (isRendering) return;

            if (self.value !== 1) {
                saveSetting("maintenance", 0);
                return;
            }

            // WHY: Users can not use the site. Ask before turning it on.
            Dialog({
                icon: "assets/warning.png",
                title: "Maintenance Mode",
                desc: "Users will see a maintenance page and can not use the site. Admins can still use the panel.",
                confirmButtonText: "Turn On",
                cancelButtonText: "Cancel",
                confirmButtonColor: "#B87A1A",
                color: Black(0.7),
                callback: function(isConfirmed) {
                    if (isConfirmed) {
                        saveSetting("maintenance", 1);
                    } else {
                        isRendering = 1;
                        self.setValue(0);
                        isRendering = 0;
                    }
                },
            });

        };

    endGroup();

    // WHY: The group is hidden after its children are created. Children created in a hidden
    //      group are absolutely positioned, not flex items.
    box.centerBox.visible = SHOW_CENTER_ITEMS;

    // RIGHT SECTION
    box.rightBox = HGroup({
        gap: 8,
        align: "center right",
        padding: [0, 0, 10, 0]
    });

        // EXAMPLE: How to add a SearchInput on topBar
        // Search: pages, users, orders, products
        box.searchInput = SearchInput({
            top: 0,
            left: 0,
            width: 260,
            height: 30,
            color: "#141414DD", // rgba(255,255,255,0.8), rgba(0,0,0,0.1)
            textColor: "#EBEBEB",
            round: 30,
            fontSize: 14,
            searchIconSize: 18,
            placeholderText: "Search  (Ctrl K)",
            position: "relative",
            invertIconColor: 1,
            searchIconFile: "assets/top-bar/search.svg",
            clearIconFile: "assets/top-bar/close.svg",
        });
        box.searchInput.onSearch = function(text) {
            if (text == searchText) return; // WHY: Arrow keys also call onSearch (keyup).
            searchText = text;
            searchTimer = waitAndRun(searchTimer, showResults, 120);
        };

        // Create menu (+)
        box.btnCreate = TopBarIconButton({
            iconPath: "assets/top-bar/add.svg",
            invertIconColor: 1,
            hintText: "Create",
            hintPosition: "left",
            createBudge: 0,
            onClick: function() {},
        });

        box.btnNotifications = TopBarIconButton({
            iconPath: "assets/top-bar/bell.svg",
            invertIconColor: 1,
            badgeProps: { value: 0 }, // Set with setNotificationCount()
            hintText: "Notifications",
            hintPosition: "left",
            onClick: function(self) {
                openPageByKey(NotificationsPage.KEY);
                box.manageSelectionForButton(NotificationsPage.KEY, self, rightView);
            },
        });

        // Profile: initials and status dot on the button
        box.btnProfile = TopBarIconButton({
            iconPath: "assets/top-bar/user.svg",
            invertIconColor: 1,
            hintText: "Profile",
            hintPosition: "left",
            createBudge: 0,
            onClick: function(self) {
                openPageByKey(UserActionsPage.KEY);
                box.manageSelectionForButton(UserActionsPage.KEY, self, rightView);
            },
        });
        box.btnProfile.icon.visible = 0;

    endGroup();

    // BOX: Avatar (inside the profile button)
    // WHY: createIn() sets the container, runs the function and sets the previous container back.
    //      setDefaultContainerBox() is not in the start/end stack: after the endGroup() below the
    //      container would be the top bar again, and the next object would land on the top bar.
    createIn(box.btnProfile, function() {

        box.avatar = HGroup({ left: 8, top: 8, width: 24, height: 24, align: "center center", round: 100, color: "#3D7A6B" });
        that.elem.style.pointerEvents = "none";
            box.lblAvatar = Label({ text: "", fontSize: 10, textColor: White(0.95) });
            that.elem.style.fontFamily = "opensans-bold";
        endGroup();

        // NOTE: No status dot. The notifications badge already shows the state.
        // box.avatarDot = Box({ left: 25, top: 25, width: 10, height: 10, round: 100, border: 2, borderColor: box.backgroundColor, color: "#65A293" });
        // that.elem.style.pointerEvents = "none";

    });

    // MENU: Create (on the page, over everything)
    box.createMenu = ContextMenu({
        items: [
            { text: "Invite User", key: "invite" },
            { text: "New Product", key: "product" },
            { text: "New Post", key: "post" },
            "-",
            { text: "Keyboard Shortcuts", key: "shortcuts" },
        ],
        onClick: function(self, item) {
            if (item.key == "invite" && typeof UserListPage !== "undefined") {
                openMainPage(UserListPage.KEY, function() { UserListPage({ openUserId: "invite" }); });
            }
            if (item.key == "product" && typeof ProductsPage !== "undefined") {
                openMainPage(ProductsPage.KEY, function() { ProductsPage({ openProductId: "new" }); });
            }
            if (item.key == "post" && typeof ContentsPage !== "undefined") {
                openMainPage(ContentsPage.KEY, function() { ContentsPage({ openContentId: "new" }); });
            }
            if (item.key == "shortcuts") showShortcuts();
        },
        style: {
            menu: { color: T.surface, border: 1, borderColor: Ink(0.14), round: 8, padding: 4, shadow: "0px 8px 24px " + Black(0.5) },
            item: { textColor: Ink(0.85) },
            itemHover: { textColor: Ink(0.95), color: Ink(0.08) },
            separator: { color: Ink(0.1) },
        },
    });
    box.createMenu.attachTo(box.btnCreate, "click");

    // SEARCH RESULTS: comp-m4/search-results.js
    // NOTE: The component puts itself on the page and is placed under the search input, so the
    //       top bar can not clip it. It scrolls with basic/scroll-bar.js.
    box.searchResults = SearchResults({
        anchor: box.searchInput,
        anchorAlign: "right",
        maxWidth: 380,
        styleName: T.compStyle,
        onSelect: function(self, item) {
            // Clean the search input and open what was found.
            box.searchInput.setText("");
            box.searchInput.imgClearIcon.opacity = 0;
            box.searchInput.imgClearIcon.clickable = 0;
            searchText = "";
            box.searchInput.txtSearch.inputElement.blur();
            item.open();
        },
    });

    // *** OBJECT INIT CODE:

    const searchElem = box.searchInput.txtSearch.inputElement;

    // ArrowUp / ArrowDown, Enter, Escape, focus and blur: all of it is in the component.
    box.searchResults.attachTo(searchElem);

    // Keyboard shortcuts for the panel
    document.addEventListener("keydown", function(event) {

        const target = event.target;
        const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

        // Ctrl+K, Cmd+K, or "/" (when not typing): Search
        if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") || (event.key === "/" && !isTyping)) {
            event.preventDefault();
            box.focusSearch();
            return;
        }

        // Escape (when not typing): Close the right view
        if (event.key === "Escape" && !isTyping && rightView.isShown()) {
            rightView.hide();
            rightView.clean();
        }

    });

    page.onResize(function() {
        layoutSearchInput();
        box.searchResults.refresh(); // WHY: The input moved, the list is under it.
    });

    layoutSearchInput();

    if (typeof SettingsPage !== "undefined") box.applySettings(SettingsPage.load());

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
    backgroundColor: Black(0.1),
    hoverBackgroundColor: Black(0.4),
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

