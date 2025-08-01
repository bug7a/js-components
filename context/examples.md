# basic.js Örnekler ve Kullanım Senaryoları

## 🚀 Temel Başlangıç Örnekleri

### 1. İlk Örnek - Tıklanabilir Label
```javascript
// VARIABLES
let lblText;
let clickedCount = 0;

window.onload = function() {
    page.color = "whitesmoke";

    // GROUP: AutoLayout (Default: horizontal centered)
    AutoLayout({
        // flow: "horizontal", // "vertical"
        // align: "center", // "top left", "center right"
        // gap: 0,
        // padding: 0, // [0, 0, 0, 0]
    });

        // LABEL: Clickable label
        lblText = Label({
            text: "Click Me",
            color: "white",
            padding: [12, 4],
            round: 4,
            border: 1,
            borderColor: "rgba(0, 0, 0, 0.1)",
        });
        that.elem.style.cursor = "pointer";
        that.on("click", increaseOne);

    endAutoLayout();
};

// OTHER FUNCTIONS
const increaseOne = function(self, event) {
    clickedCount++;
    lblText.text = "Clicked Count: " + clickedCount;
    println(clickedCount);
};
```

### 2. Sayaç Uygulaması
```javascript
let count = 0;
let lblCount;

window.onload = function() {
    // GROUP: Autolayout
    AutoLayout({
        flow: "vertical",
        gap: 4,
    });

        // LABEL: Count
        lblCount = Label({
            text: "",
        });

        // BUTTON: +
        Button({
            text: "+",
            minimal: 1,
            color: "whitesmoke",
        });
        that.on("click", function() {
            count++;
            refreshCount();
        });

        // BUTTON: -
        Button({
            text: "-",
            minimal: 1,
            color: "whitesmoke",
        });
        that.on("click", function() {
            count--;
            refreshCount();
        });

        // BUTTON: Reset
        Button({
            text: "Reset",
            color: "indianred",
        });
        that.on("click", function() {
            count = 0;
            refreshCount();
        });

        refreshCount();
    endAutoLayout();
};

const refreshCount = function() {
    if (count < 0) count = 0;
    lblCount.text = "Count: " + count;
};
```

### 3. Random Sayı Üretici
```javascript
let lblNumbers = null;

window.onload = function() {
    // LABEL: Numbers
    lblNumbers = Label({
        left: 40,
        top: 30,
        text: "",
        textAlign: "center",
        border: 1,
        spaceX: 6,
        spaceY: 4,
    });

    for(let i = 1; i <= 10; i++) {
        lblNumbers.text += random(1, 100) + " ";
    }
};
```

## 🎨 Layout ve Gruplama Örnekleri

### 1. AutoLayout Temel Kullanım
```javascript
window.onload = function() {
    // GROUP: Autolayout (Default: centered)
    AutoLayout({
        flow: "horizontal", // "vertical"
        align: "center", // "top left", "center right"
        gap: 10,
        padding: 0, // [0, 0, 0, 0]
    });

    // BOX: Red 
    Box({
        color: "orangered",
    });

    // BOX: Blue
    Box({
        color: "steelblue",
    });

    endAutoLayout();
};
```

### 2. Dikey Gruplama
```javascript
window.onload = function() {
    // GROUP: Autolayout (Vertical)
    AutoLayout({
        flow: "vertical",
        align: "center",
        gap: 10,
        padding: 20,
    });

    // BOX: #1
    Box({
        width: 120,
        height: 50,
        color: "gold",
        border: 1,
    });

    // BOX: #2
    Box({
        width: 40,
        height: 50,
        color: "tomato",
        border: 1,
    });

    // BOX: #3
    Box({
        width: 70,
        height: 50,
        color: "cadetblue",
        border: 1,
    });

    endAutoLayout();
};
```

### 3. HGroup ve VGroup Kullanımı
```javascript
window.onload = function() {
    // Ana grup
    HGroup({
        gap: 20,
        width: "100%",
        height: "auto"
    });

    // Sol alt grup
    VGroup({
        gap: 5,
        width: "auto",
        height: "auto"
    });
    Label({ text: "Left Item 1" });
    Label({ text: "Left Item 2" });
    endGroup();

    // Sağ alt grup
    VGroup({
        gap: 5,
        width: "auto",
        height: "auto"
    });
    Label({ text: "Right Item 1" });
    Label({ text: "Right Item 2" });
    endGroup();

    endGroup();
};
```

## 🎭 Animasyon ve Motion Örnekleri

### 1. Temel Motion Efekti
```javascript
let box;

window.onload = function() {
    // BOX: My box.
    box = Box({
        width: 120,
        height: 120,
        color: "orangered",
        round: 4,
    });
    that.center();
    // When there is a change, soften it with movement.
    that.setMotion("left 0.3s, top 0.3s, width 0.3s, height 0.3s");
    that.on("click", function(self, event) {
        extendBox(box);
    });
};

const extendBox = function(clickedBox) {
    clickedBox.width += 50;
    clickedBox.height += 50;
    clickedBox.center();
};
```

### 2. Hover Animasyonları
```javascript
let lbl = null;

window.onload = function() {
    page.color = "whitesmoke";

    lbl = Label({
        text: "Text Button",
        color: "white",
        border: 1,
        spaceX: 12,
        spaceY: 6,
        round: 13,
        clickable: 1,
    });
    that.elem.style.cursor = "pointer";
    that.elem.style.transform = "scale(1)";
    that.elem.style.transformOrigin = "50% 50%"; // center, center
    that.setMotion("transform 0.5s, background-color 0.5s");

    that.on("mouseover", function() {
        lbl.color = "indianred";
        lbl.elem.style.transform = "scale(1.2)";
    });

    that.on("mouseout", function() {
        lbl.color = "white";
        lbl.elem.style.transform = "scale(1)";
    });
};
```

### 3. Fade In Animation
```javascript
const FadeInComponent = function(params = {}) {
    let box = startObject({
        duration: 0.3,
        delay: 0
    }, params);

    // *** OBJECT VIEW:
    box.content = Label({
        text: "Fade In Content",
        fontSize: 16,
        textColor: "#333"
    });

    // *** OBJECT INIT CODE:
    box.setMotion("opacity " + box.duration + "s");
    box.opacity = 0;

    setTimeout(function() {
        box.opacity = 1;
    }, box.delay * 1000);

    return endObject(box);
};
```

## 🎨 Görsel Efektler

### 1. Gradient Renkler
```javascript
window.onload = function() {
    page.color = "white";

    // BOX: Linear gradient
    Box({
        top: 80,
    });
    that.center("left");
    that.elem.style.background = "linear-gradient(to right, #FFFFFF00, seagreen)";

    // BOX: Radial gradient
    Box({
        bottom: 80,
    });
    that.center("left");
    that.elem.style.background = "radial-gradient(gold, indianred, black)";
};
```

### 2. Filter Efektleri
```javascript
window.onload = function() {
    page.color = "white";

    // Grayscale filter
    Icon(10, 10, 100, 100, {
        border: 1,
    });
    that.load("assets/broccoli.png");
    that.elem.style.filter = "grayscale(100%)";

    // Invert filter
    Icon(10, 118, 100, 100, {
        border: 1,
    });
    that.load("assets/broccoli.png");
    that.elem.style.filter = "invert(100%)";

    // MORE FILTERS:
    // "blur(5px)", "brightness(200%)", "sepia(100%)",
    // "saturate(8)", "hue-rotate(90deg)", "contrast(200%)"
    // "drop-shadow(8px 8px 10px gray)"
};
```

### 3. Custom Border
```javascript
window.onload = function() {
    page.color = basic.ACTION2_COLOR;

    Box({
        width: 300,
        height: 300,
        round: 0,
        color: "rgba(255, 255, 255, 0.7)",
    });
    that.center();
    that.elem.style.borderTop = "2px dotted rgba(0, 0, 0, 0.9)";
    that.elem.style.borderBottom = "5px solid rgba(0, 0, 0, 0.9)";
    //that.elem.style.borderLeft = "1px dashed rgba(0, 0, 0, 0.9)";
    //that.elem.style.borderRight = "1px dashed rgba(0, 0, 0, 0.9)";
};
```

## 🧩 Bileşen Geliştirme Örnekleri

### 1. JSON Verisi ile Bileşen
```javascript
const itemDataList = [
    { id: "1", label: "Broccoli", desc: "Vegetable", icon: "assets/broccoli.png" },
    { id: "2", label: "Strawberry", desc: "Fruit", icon: "assets/strawberry.png" },
    { id: "3", label: "Carrot", desc: "Vegetable", icon: "assets/carrot.png" },
    { id: "4", label: "Blueberries", desc: "Fruit", icon: "assets/blueberries.png" },
];
let itemList = [];
let containerBox;

window.onload = function() {
    page.color = "whitesmoke";

    // GROUP: Autolayout centered.
    AutoLayout();

    // BOX: Fruit items container box.
    containerBox = startBox(40, 40, 300, "auto", {
        color: "white",
        round: 13,
    });

    itemDataList.forEach((item) => {
        const newItem = PlantItem(item);
        itemList.push(newItem);

        newItem.on("click", () => {
            newItem.selected = newItem.selected ? 0 : 1;
            newItem.elem.style.filter = newItem.selected ? "grayscale(100%)" : "none";
            if (newItem.selected) println(newItem.id);
        });
    });

    endBox();
    endAutoLayout();
};

// DEFAULT VALUES: PlantItem
const PlantItemDefaults = {
    width: 300,
    height: 94,
    color: "transparent",
    position: "relative",
};

// CUSTOM COMPONENT: PlantItem
const PlantItem = function(params = {}) {
    // BOX: Component container box.
    const box = startObject();

    // Apply default values and params:
    box.props(PlantItemDefaults, params);

    // COMPONENT VIEW:
    // BOX: Item background box.
    box.backgroundBox = Box(4, 2, box.width - 8, 90, {
        color: "rgba(0, 0, 0, 0.01)",
        round: 13,
        border: 1,
        borderColor: "rgba(0, 0, 0, 0.04)",
    });
    that.setMotion("background-color 0.3s");
    that.clickable = 1;
    that.elem.style.cursor = "pointer";

    // IMAGE: Item icon image.
    Icon(30, 12, 70, 70, {
        round: 4,
        color: "transparent",
        border: 0,
    });
    that.load(box.icon);

    // LABEL: Item label text.
    Label(120, 25, 280, "auto", {
        text: box.label,
    });

    // LABEL: Item description text.
    Label(120, 49, 280, "auto", {
        text: box.desc,
        textColor: "gray",
        fontSize: 14,
    });

    // INIT CODE:
    box.on("mouseover", function(self, event) {
        box.backgroundBox.color = "rgba(90, 90, 0, 0.09)";
    });

    box.on("mouseout", function(self, event) {
        box.backgroundBox.color = "rgba(0, 0, 0, 0.01)";
    });

    return endObject(box);
};
```

### 2. Form Bileşeni
```javascript
const FormComponent = function(params = {}) {
    let box = startObject({
        width: 400,
        height: "auto",
        title: "Contact Form",
        onSubmit: function() {}
    }, params);

    // *** OBJECT VIEW:
    box.formGroup = AutoLayout({
        flow: "vertical",
        align: "left top",
        gap: 20,
        padding: [20, 20]
    });

    // Title
    box.titleLabel = Label({
        text: box.title,
        fontSize: 24,
        textColor: "#333",
        color: "transparent"
    });

    // Name Input
    box.nameInput = Input({
        text: "",
        width: "100%",
        height: 40,
        fontSize: 16,
        color: "white",
        textColor: "#333",
        border: 1,
        borderColor: "#ddd",
        round: 4
    });
    box.nameInput.placeholder = "Enter your name";

    // Email Input
    box.emailInput = Input({
        text: "",
        width: "100%",
        height: 40,
        fontSize: 16,
        color: "white",
        textColor: "#333",
        border: 1,
        borderColor: "#ddd",
        round: 4
    });
    box.emailInput.placeholder = "Enter your email";

    // Submit Button
    box.submitButton = Button({
        text: "Submit",
        width: "100%",
        height: 40,
        color: "#007bff",
        textColor: "white",
        round: 4
    });

    endAutoLayout();

    // *** OBJECT INIT CODE:
    box.submitButton.on("click", function() {
        const name = box.nameInput.text;
        const email = box.emailInput.text;
        
        if (name && email) {
            box.onSubmit({ name, email });
        }
    });

    return endObject(box);
};
```

### 3. Kart Bileşeni
```javascript
const CardComponent = function(params = {}) {
    let box = startObject({
        width: 300,
        height: 200,
        title: "Card Title",
        description: "Card description goes here",
        image: null,
        onClick: function() {}
    }, params);

    // *** OBJECT VIEW:
    // Background
    box.background = Box(0, 0, "100%", "100%", {
        color: "white",
        border: 1,
        borderColor: "#e0e0e0",
        round: 8
    });

    // Content
    box.contentGroup = AutoLayout({
        flow: "vertical",
        align: "left top",
        gap: 10,
        padding: [20, 20]
    });

    // Image (if provided)
    if (box.image) {
        box.imageElement = Icon({
            width: "100%",
            height: 120,
            color: "transparent"
        });
        box.imageElement.load(box.image);
    }

    // Title
    box.titleLabel = Label({
        text: box.title,
        fontSize: 18,
        textColor: "#333",
        color: "transparent"
    });

    // Description
    box.descriptionLabel = Label({
        text: box.description,
        fontSize: 14,
        textColor: "#666",
        color: "transparent"
    });

    endAutoLayout();

    // *** OBJECT INIT CODE:
    box.on("click", function() {
        box.onClick(box);
    });

    return endObject(box);
};
```

## 📱 Responsive Tasarım Örnekleri

### 1. Mobile Fit Skeleton
```javascript
// VARIABLES            
let myString = "";
let myInteger = 0;
let myFloat = 0.5;

window.onload = function() {
    page.fit(600, 800);
    // NOTE: Content design width 600px, maximum width 800px
    // If your screen is small, you will see content smaller. But always fit

    // GROUP: Centered
    AutoLayout({
        color: "#141414",
    });
    
    // BOX: Content container
    startBox({
        width: 600,
        height: "100%",
        color: "white",
    });

        // PUT CONTENT
        AutoLayout({
            flow: "vertical",
        });

            Label(10, 10, {
                text: "Mobile Content"
            });

            Label(10, 10, {
                textColor: "rgba(0,0,0,0.5)",
                fontSize: 16,
                text: "(Width: 600px)"
            });
        
        endAutoLayout();

    endBox();
    endAutoLayout();

    page.onResize(pageResized);
};

const pageResized = function() {
    page.fit(600, 800);
};
```

### 2. Responsive Grid Layout
```javascript
const ResponsiveGrid = function(params = {}) {
    let box = startObject({
        columns: 3,
        gap: 20,
        items: []
    }, params);

    // *** OBJECT VIEW:
    box.gridContainer = AutoLayout({
        flow: "vertical",
        align: "left top",
        gap: box.gap
    });

    // Create rows
    for (let i = 0; i < box.items.length; i += box.columns) {
        const row = HGroup({
            gap: box.gap,
            align: "left top"
        });

        // Add items to this row
        for (let j = 0; j < box.columns && i + j < box.items.length; j++) {
            const item = box.items[i + j];
            const gridItem = createGridItem(item);
        }

        endGroup();
    }

    endAutoLayout();

    // Responsive behavior
    box.setResponsiveLayout = function() {
        if (page.width < 768) {
            box.columns = 2;
        } else if (page.width < 480) {
            box.columns = 1;
        } else {
            box.columns = 3;
        }
        box.refreshLayout();
    };

    page.onResize(function() {
        box.setResponsiveLayout();
    });

    return endObject(box);
};
```

### 3. Mobile-First Navigation
```javascript
const MobileNavigation = function(params = {}) {
    let box = startObject({
        height: 60,
        backgroundColor: "#333",
        items: []
    }, params);

    // *** OBJECT VIEW:
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor
    });

    // Desktop navigation
    box.desktopNav = HGroup({
        gap: 20,
        align: "center left",
        padding: [0, 20]
    });

    box.items.forEach(function(item) {
        const navItem = Label({
            text: item.text,
            fontSize: 16,
            textColor: "white",
            color: "transparent",
            clickable: 1
        });
        navItem.on("click", item.onClick);
    });

    endGroup();

    // Mobile menu button
    box.mobileMenuButton = Button({
        text: "☰",
        color: "transparent",
        textColor: "white",
        fontSize: 20,
        width: 40,
        height: 40
    });

    // Mobile menu
    box.mobileMenu = VGroup({
        gap: 10,
        align: "left top",
        padding: [20, 20],
        width: 250,
        height: "auto",
        color: "#333",
        position: "absolute",
        top: 60,
        left: 0,
        visible: 0
    });

    box.items.forEach(function(item) {
        const mobileItem = Label({
            text: item.text,
            fontSize: 16,
            textColor: "white",
            color: "transparent",
            clickable: 1
        });
        mobileItem.on("click", function() {
            item.onClick();
            box.hideMobileMenu();
        });
    });

    endGroup();

    // *** OBJECT INIT CODE:
    box.mobileMenuButton.on("click", function() {
        if (box.mobileMenu.visible) {
            box.hideMobileMenu();
        } else {
            box.showMobileMenu();
        }
    });

    box.showMobileMenu = function() {
        box.mobileMenu.visible = 1;
    };

    box.hideMobileMenu = function() {
        box.mobileMenu.visible = 0;
    };

    // Responsive behavior
    box.setResponsiveLayout = function() {
        if (page.width < 768) {
            box.desktopNav.visible = 0;
            box.mobileMenuButton.visible = 1;
        } else {
            box.desktopNav.visible = 1;
            box.mobileMenuButton.visible = 0;
            box.hideMobileMenu();
        }
    };

    page.onResize(function() {
        box.setResponsiveLayout();
    });

    return endObject(box);
};
```

## 🎯 Event Handling Örnekleri

### 1. Temel Event'ler
```javascript
window.onload = function() {
    // Click event
    Button({
        text: "Click Me",
        color: "cadetblue",
    }).on("click", function(self, event) {
        println("Button clicked!");
    });

    // Mouse events
    Box({
        width: 100,
        height: 100,
        color: "orange",
    }).on("mouseover", function(self, event) {
        that.color = "red";
    }).on("mouseout", function(self, event) {
        that.color = "orange";
    });
};
```

### 2. Input Event'leri
```javascript
window.onload = function() {
    const input = Input({
        text: "Type here...",
        width: 200,
        height: 40,
        color: "white",
        border: 1,
        borderColor: "#ddd"
    });

    const inputElem = input.inputElement;

    inputElem.addEventListener("focus", function() {
        input.borderColor = "#007bff";
    });

    inputElem.addEventListener("blur", function() {
        input.borderColor = "#ddd";
    });

    inputElem.addEventListener("input", function() {
        println("Input value: " + input.text);
    });
};
```

### 3. Keyboard Event'leri
```javascript
window.onload = function() {
    page.on("keydown", function(event) {
        if (event.key === "Enter") {
            println("Enter key pressed!");
        }
        if (event.key === "Escape") {
            println("Escape key pressed!");
        }
    });
};
```

## 🔧 Utility Fonksiyonları

### 1. Debounce Function
```javascript
const debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = function() {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
```

### 2. Throttle Function
```javascript
const throttle = function(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
```

### 3. Event Bus
```javascript
const EventBus = {
    events: {},
    
    on: function(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    },
    
    emit: function(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(function(callback) {
                callback(data);
            });
        }
    },
    
    off: function(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(function(cb) {
                return cb !== callback;
            });
        }
    }
};
```

## 📊 State Management Örnekleri

### 1. Simple State Manager
```javascript
const StateManager = function(initialState = {}) {
    let state = initialState;
    let listeners = [];

    return {
        getState: function() {
            return state;
        },

        setState: function(newState) {
            state = { ...state, ...newState };
            listeners.forEach(function(listener) {
                listener(state);
            });
        },

        subscribe: function(listener) {
            listeners.push(listener);
            return function() {
                listeners = listeners.filter(function(l) {
                    return l !== listener;
                });
            };
        }
    };
};
```

### 2. Component with State
```javascript
const StatefulComponent = function(params = {}) {
    let box = startObject({
        initialState: { count: 0 }
    }, params);

    // Create state manager
    box.stateManager = StateManager(box.initialState);

    // *** OBJECT VIEW:
    box.contentGroup = AutoLayout({
        flow: "vertical",
        align: "center",
        gap: 20
    });

    box.counterLabel = Label({
        text: "Count: 0",
        fontSize: 24,
        textColor: "#333"
    });

    box.incrementButton = Button({
        text: "Increment",
        color: "#28a745",
        textColor: "white",
        round: 4
    });

    box.decrementButton = Button({
        text: "Decrement",
        color: "#dc3545",
        textColor: "white",
        round: 4
    });

    endAutoLayout();

    // *** OBJECT INIT CODE:
    // Subscribe to state changes
    box.unsubscribe = box.stateManager.subscribe(function(newState) {
        box.counterLabel.text = "Count: " + newState.count;
    });

    box.incrementButton.on("click", function() {
        const currentState = box.stateManager.getState();
        box.stateManager.setState({ count: currentState.count + 1 });
    });

    box.decrementButton.on("click", function() {
        const currentState = box.stateManager.getState();
        box.stateManager.setState({ count: currentState.count - 1 });
    });

    return endObject(box);
};
```

## 🎨 Gelişmiş UI Örnekleri

### 1. Modal Dialog
```javascript
const ModalDialog = function(params = {}) {
    let box = startObject({
        width: 500,
        height: "auto",
        title: "Dialog Title",
        content: "Dialog content goes here",
        showCancel: true,
        onConfirm: function() {},
        onCancel: function() {}
    }, params);

    // *** OBJECT VIEW:
    // Overlay
    box.overlay = Box(0, 0, "100vw", "100vh", {
        color: "rgba(0, 0, 0, 0.5)",
        position: "fixed",
        top: 0,
        left: 0
    });

    // Dialog container
    box.dialogContainer = AutoLayout({
        flow: "vertical",
        align: "center",
        gap: 0,
        padding: [20, 20]
    });

    // Dialog box
    box.dialogBox = Box(0, 0, box.width, "auto", {
        color: "white",
        round: 8,
        border: 1,
        borderColor: "#e0e0e0"
    });

    // Title
    box.titleLabel = Label({
        text: box.title,
        fontSize: 20,
        textColor: "#333",
        color: "transparent"
    });

    // Content
    box.contentLabel = Label({
        text: box.content,
        fontSize: 16,
        textColor: "#666",
        color: "transparent"
    });

    // Buttons
    box.buttonGroup = HGroup({
        gap: 10,
        align: "right"
    });

    if (box.showCancel) {
        box.cancelButton = Button({
            text: "Cancel",
            color: "#6c757d",
            textColor: "white",
            round: 4
        });
        box.cancelButton.on("click", function() {
            box.onCancel();
            box.remove();
        });
    }

    box.confirmButton = Button({
        text: "Confirm",
        color: "#007bff",
        textColor: "white",
        round: 4
    });
    box.confirmButton.on("click", function() {
        box.onConfirm();
        box.remove();
    });

    endGroup();
    endAutoLayout();

    return endObject(box);
};
```

### 2. Navigation Bar
```javascript
const NavigationBar = function(params = {}) {
    let box = startObject({
        height: 60,
        backgroundColor: "#333",
        items: []
    }, params);

    // *** OBJECT VIEW:
    // Background
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor
    });

    // Navigation items
    box.navGroup = HGroup({
        gap: 20,
        align: "center left",
        padding: [0, 20]
    });

    // Add navigation items
    box.items.forEach(function(item) {
        const navItem = Label({
            text: item.text,
            fontSize: 16,
            textColor: "white",
            color: "transparent",
            clickable: 1
        });

        navItem.on("click", function() {
            if (item.onClick) {
                item.onClick(item);
            }
        });
    });

    endGroup();

    return endObject(box);
};
```

### 3. Slide Animation
```javascript
const SlideComponent = function(params = {}) {
    let box = startObject({
        direction: "left", // "left", "right", "up", "down"
        duration: 0.5
    }, params);

    // *** OBJECT VIEW:
    box.content = Label({
        text: "Slide Content",
        fontSize: 16,
        textColor: "#333"
    });

    // *** OBJECT INIT CODE:
    box.setMotion("transform " + box.duration + "s ease-out");
    
    // Set initial position
    let initialTransform = "";
    switch(box.direction) {
        case "left":
            initialTransform = "translateX(-100%)";
            break;
        case "right":
            initialTransform = "translateX(100%)";
            break;
        case "up":
            initialTransform = "translateY(-100%)";
            break;
        case "down":
            initialTransform = "translateY(100%)";
            break;
    }
    
    box.elem.style.transform = initialTransform;

    // Animate to final position
    setTimeout(function() {
        box.elem.style.transform = "translateX(0) translateY(0)";
    }, 100);

    return endObject(box);
};
```

## 🎯 Best Practices

### 1. Component Composition
```javascript
// Base component
const BaseComponent = function(params = {}) {
    let box = startObject({
        width: 200,
        height: 100,
        color: "white"
    }, params);

    // Common functionality
    box.setVisible = function(visible) {
        box.visible = visible ? 1 : 0;
    };

    return endObject(box);
};

// Extended component
const ExtendedComponent = function(params = {}) {
    let box = startExtendedObject(BaseComponent, params);

    // Additional functionality
    box.setColor = function(color) {
        box.color = color;
    };

    return endExtendedObject(box);
};
```

### 2. Error Handling
```javascript
const SafeComponent = function(params = {}) {
    let box = startObject(params);

    // Error handling wrapper
    box.safeExecute = function(func, fallback) {
        try {
            return func();
        } catch (error) {
            println("Error in component: " + error.message);
            if (fallback) {
                return fallback();
            }
            return null;
        }
    };

    return endObject(box);
};
```

### 3. Performance Optimization
```javascript
const OptimizedComponent = function(params = {}) {
    let box = startObject(params);

    // Debounced resize handler
    box.handleResize = debounce(function() {
        box.updateLayout();
    }, 250);

    // Throttled scroll handler
    box.handleScroll = throttle(function() {
        box.updateScrollPosition();
    }, 16); // ~60fps

    return endObject(box);
};
```

## 📚 Kaynaklar

Bu örnekler [basic.js handbook](https://bug7a.github.io/basic.js-handbook/) ve mevcut proje örneklerinden yola çıkılarak hazırlanmıştır. Her örnek, basic.js standartlarına uygun olarak yazılmıştır ve gerçek dünya uygulamalarında kullanılabilir.

### Önemli Linkler:
- **[basic.js Library](https://bug7a.github.io/basic.js/)** - Ana kütüphane
- **[basic.js UI Components](https://bug7a.github.io/basic.js-ui-components/)** - UI bileşenleri
- **[Mobile App Template](https://bug7a.github.io/javascript-mobile-app-template/)** - Mobil uygulama şablonu
- **[Expense App Demo](https://bug7a.github.io/expense/)** - Gerçek uygulama örneği

Bu örnekler, basic.js ile profesyonel uygulamalar geliştirmek için gerekli tüm pattern'leri ve best practice'leri göstermektedir. 