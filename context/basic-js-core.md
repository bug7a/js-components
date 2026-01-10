# basic.js Core Documentation

## Introduction
`basic.js` is a lightweight JavaScript library designed for building web-based applications using simple JavaScript code, without the need to write HTML or CSS directly. It provides a set of high-level components and utilities to streamline development.

## Core Concepts

### The `page` Object
- `page`: Represents the main container of the application (the body).
- `page.width`: Returns the width of the page.
- `page.height`: Returns the height of the page.
- `page.color`: Sets the background color of the page.
- `page.fit(width, [maxWidth])`: Scales the page content to fit a specific width.
- `page.autoFit(width, height)`: Scales the page to fit within a specific aspect ratio.

### The `that` Object
- `that`: Refers to the most recently created object. This is a central pattern in `basic.js` to avoid repetitive variable assignments for quick prototyping.
- `makeBasicObject(obj)`: Registers a custom object to be accessible via `that`.

### Container System
- Objects are automatically added to the `defaultContainerBox`.
- `startBox()` / `endBox()`: Used to create nested structures. Objects created between these calls are added to the started box.
- `AutoLayout` (or `startFlexBox`): Starts a flexbox container.
- `HGroup(...)`: Alias for `AutoLayout` with horizontal flow.
- `VGroup(...)`: Alias for `AutoLayout` with vertical flow.

## UI Components

All components inherit from `Basic_UIComponent` and share common properties like `width`, `height`, `left`, `top`, `visible`, `opacity`, `color` (background), `border`, `round` (border-radius).

### Box
A generic container.
```javascript
// Usage
Box(left, top, width, height);
// Or with properties object as the last argument
Box(10, 10, 100, 100, { color: "red" });
```

### Button
A clickable button.
```javascript
Button(left, top, width, height, { text: "Click Me" });
// Properties: text, value, enabled, minimal
```

### Label
A text label.
```javascript
Label(left, top, { text: "Hello World", fontSize: 20 });
// Properties: text, fontSize, textColor, textAlign, space (padding)
```

### TextBox (Input)
An input field.
```javascript
TextBox(left, top, width, height, { text: "Initial Text" });
// Alias: Input()
// Properties: text, title, enabled, onChange(func)
```

### Image / Icon
Displays an image.
```javascript
Image(left, top, width, height);
// Alias: Icon()
// Properties: autoSize (1, 2, 3...), load(path)
```

## Layout & Positioning

### Direct Positioning
- `left`, `top`, `right`, `bottom`: Set position in pixels.
- `width`, `height`: Set size (number for px, string for %, "auto", etc.).

### Alignment Methods
- `center(axis)`: Centers the object in its container. `axis`: "left", "top", or undefined (both).
- `centerBy(obj, axis)`: Centers the object relative to another object.
- `aline(obj, position, space, secondPosition)`: Aligns the object relative to another.
    - `position`: "left", "right", "top", "bottom" (e.g., put *this* to the right of *obj*).
    - `secondPosition`: "top", "bottom", "left", "right", "center" (secondary alignment).

### Flexbox (AutoLayout)
```javascript
AutoLayout({
    flow: "horizontal", // or "vertical"
    align: "center", // "top left", "center right", etc.
    gap: 10
});
    // Children added here are automatically arranged
endAutoLayout();
```

## Styling
- `color`: Background color.
- `border`: Border width (px).
- `borderColor`: Border color.
- `round`: Border radius (px).
- `opacity`: 0.0 to 1.0.
- `visible`: 1 (visible) or 0 (hidden).
- `padding`: Inner spacing (for Box, Label).

## Event Handling

### The `on` Method
The standard way to add events.
```javascript
btn.on("click", function(self, event) {
    println("Clicked!");
});
```

### Specific Methods
- `onClick(func)`
- `onResize(func)`
- `onChange(func)` (for TextBox)

## Motion (Animations)
- `setMotion(string)`: Defines the transition (e.g., "left 0.5s, opacity 1s").
- `withMotion(func)`: Executes changes within the defined motion.
- `dontMotion()`: Temporarily disables motion.

## Utilities

### Global Functions
- `println(message, type)`: Safe console logging.
- `random(min, max)`: Random integer.
- `num(str)`: Parse float/int.
- `str(num)`: Convert to string.
- `isMobile()`: Returns 1 if mobile device.
- `go(url)`: Navigate to URL.
- `wait(ms, func)`: (Implied from common patterns, though not explicitly in snippet, standard JS `setTimeout` is often used, but `loop` is preferred for game loops).

### Global Objects
- `storage`: `save(key, val)`, `load(key)`, `remove(key)`.
- `clock`: `hour`, `minute`, `second`, `milisecond`.
- `date`: `year`, `monthNumber`, `dayNumber`, `today`, `now`.

## Standard Patterns

### Initialization
```javascript
window.onload = function() {
    // Your setup code
}
```

### Game Loop
```javascript
const loop = function() {
    // Code to run every frame/second (controlled by setLoopTimer)
}
```
