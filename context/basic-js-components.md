# basic.js Component Creation Guide

This guide outlines the standard pattern for creating reusable UI components using `basic.js`, based on the modern standards (v25+).

## Standard Component Structure

A standard component consists of:
1.  **Defaults Object**: Defines default property values.
2.  **Constructor Function**: The main function that creates the component.
3.  **`startObject`**: Initializes the component container and merges parameters.
4.  **Logic & State**: Private/Public variables and functions.
5.  **UI Construction**: Creating the visual elements inside the component.
6.  **Event Binding**: Attaching event listeners.
7.  **`endObject`**: Finalizes and returns the component.

## Step-by-Step Implementation

### 1. Define Defaults
Create a constant object with the suffix `Defaults`. This should include all configurable properties.

```javascript
const MyComponentDefaults = {
    width: 200,
    height: 50,
    color: "white",
    text: "Default Text",
    // Event callbacks
    onClick: function(ui) {},
    // Style objects
    textStyle: {
        fontSize: 16,
        color: "black"
    }
};
```

### 2. Create Constructor
The constructor function takes a `params` object.

```javascript
const MyComponent = function(params = {}) {
    // ... implementation
};
```

### 3. Initialize Component
Use `startObject` to create the main container (`box`) and merge `params` with `Defaults`.

```javascript
    // BOX: Component container
    const box = startObject(MyComponentDefaults, params);
```

### 4. Define Variables & Functions

**Private Variables/Functions**: Visible only within the constructor.
```javascript
    let internalState = 0;

    const updateView = function() {
        // Internal logic
    };
```

**Public Variables/Functions**: Accessible from outside (attached to `box`).
```javascript
    // Public property
    box.value = 0;

    // Public method
    box.setValue = function(newValue) {
        box.value = newValue;
        updateView();
    };
```

### 5. Build UI
Create child components inside the `box`. You can use `AutoLayout` or absolute positioning.

```javascript
    // Example: Adding a label
    box.label = Label({
        text: box.text,
        ...box.textStyle // Spread style properties
    });
    
    // Important: Use 'that' to refer to the last created object for quick styling
    that.center("top left"); 
```

### 6. Bind Events
Attach events to the component or its children.

```javascript
    box.on("click", function(self, event) {
        box.onClick(box); // Trigger the callback defined in defaults
    });
```

### 7. Finalize
Return the component using `endObject`.

```javascript
    return endObject(box);
```

## Full Example Template

```javascript
"use strict";

const ToggleButtonDefaults = {
    width: 60,
    height: 30,
    activeColor: "#4CD964",
    inactiveColor: "#E5E5EA",
    isOn: false,
    onToggle: function(ui) {}
};

const ToggleButton = function(params = {}) {

    // 1. Initialize
    const box = startObject(ToggleButtonDefaults, params);

    // 2. Private State
    let _isOn = box.isOn;

    // 3. Public Methods
    box.toggle = function() {
        box.setValue(!_isOn);
    };

    box.setValue = function(value) {
        _isOn = value;
        box.circle.left = _isOn ? 32 : 2;
        box.color = _isOn ? box.activeColor : box.inactiveColor;
        
        // Trigger callback
        box.onToggle(box);
    };

    // 4. UI Construction
    // Set initial background
    box.color = _isOn ? box.activeColor : box.inactiveColor;
    box.round = 15;
    box.setMotion("background-color 0.2s");

    // Circle indicator
    box.circle = Box({
        top: 2,
        left: _isOn ? 32 : 2,
        width: 26,
        height: 26,
        color: "white",
        round: 13
    });
    that.setMotion("left 0.2s");

    // 5. Events
    box.on("click", function() {
        box.toggle();
    });

    // 6. Finalize
    return endObject(box);

};
```

## Best Practices
- **Naming**: Use PascalCase for Component names (e.g., `MyComponent`) and `ComponentDefaults` for defaults.
- **Getters/Setters**: For properties that need to update the UI when changed, create explicit `setPropName` methods (e.g., `setValue`, `setText`) instead of JS setters, or use the `box.prop` pattern if simple.
- **`that` usage**: Use `that` immediately after creating an object to apply styles or layout properties without creating a variable if you don't need to reference it later.
- **`AutoLayout`**: Prefer `AutoLayout` (Flexbox) for internal layout when possible for responsiveness.
- **Visibility & Layout**: Components created with `basic.js` (using `Box`, `Label`, etc.) are often absolute positioned by default. To ensure they are visible:
    - Place them inside an `AutoLayout` or `HGroup`/`VGroup`.
    - OR explicitly set `left`, `top`, `width`, and `height`.
    - If a component seems "invisible", check if it has dimensions and a position, or if it's inside a container that handles layout.
- **Gradients**: The `color` property typically handles solid colors. For gradients, set the style directly on the element:
    ```javascript
    myBox.elem.style.background = "linear-gradient(...)";
    ```
