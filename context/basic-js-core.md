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

### Clipping Rule (clipContent)
- **Every Box and every group (`HGroup`, `VGroup`, `AutoLayout`) cuts what goes past its edges** by default (`clipContent: 1`, CSS `overflow: hidden`).
- So anything that moves, grows or shines past the edge is cut: a button that lifts under the mouse (`translateY`), a picture or card that grows (`scale`), a `boxShadow`, a glow, a focus outline, an object that slides in with motion. A group whose height is its content (`height: "auto"`, `hug: 1`) cuts a lifted button at once.
- **Give the groups / boxes around such objects `clipContent: 0`** when you create them, and check every box between the object and the page (one that cuts is enough). Keep `clipContent: 1` only where cutting is wanted (a picture with round corners, a background picture, a scrolling list).
```javascript
// GROUP: Buttons that lift under the mouse
HGroup({ width: "auto", height: "auto", gap: 12, clipContent: 0 }); // WHY: their lift and shadow must not be cut
    Button({ text: "Play", width: 120, height: 44 });
endGroup();
```

### Scrolling Rule
- **`page` does not scroll.** `basic.css` sets `body { overflow: hidden }`, and `page` only represents the visible area of the screen.
- If content can be taller or wider than the screen, place it inside a **full-screen `Box`** and enable that Box's `scrollY` (or `scrollX`) property.
- Give the inner layout group `height: "auto"` (or `width: "auto"` for horizontal scrolling) so the content can grow beyond the Box.
```javascript
// BOX: Full screen scrollable container
startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });

    // GROUP: Page layout
    VGroup({ width: "100%", height: "auto", align: "center top", gap: 20, padding: 40 });
        // ... page content
    endGroup();

endBox();
```

### The `that` Object
- `that`: Refers to the most recently created object. This is a central pattern in `basic.js` to avoid repetitive variable assignments for quick prototyping.
- `makeBasicObject(obj)`: Registers a custom object to be accessible via `that`.

### Container System
- Objects are automatically added to the `defaultContainerBox`.
- `startBox()` / `endBox()`: Used to create nested structures. Objects created between these calls are added to the started box.
- `HGroup({...})` / `VGroup({...})` ... `endGroup()`: Start a flexbox group (a Box) with a horizontal / vertical flow.
  Objects created until `endGroup()` are its children and are arranged automatically.
- NOTE: `AutoLayout()` / `endAutoLayout()` and `startFlexBox()` / `endFlexBox()` are old names of the same group.
  They still work in old pages, but do not use them in new code: write `HGroup` / `VGroup` and `endGroup()`.
- **Only a Box can hold other objects.** The groups above are Box objects too. A `Button`, `Label`,
  `Input` or `Icon` can NOT hold children: an object created inside a button also sends its mouse
  events up to the button (its hover effect then fires). To put something over a button, create it
  as a brother of the button in the same box and place it with `position: "absolute"`.

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

### Flexbox (HGroup / VGroup)
```javascript
HGroup({                 // a row; VGroup({...}) is a column
    align: "left center", // "center", "center top", "right bottom"... (horizontal word + vertical word)
    gap: 10,              // space between the children (px)
    padding: [16, 8],     // a number or [x, y]
    // wrap: 1,           // continue on the next line when there is no space
    // justify: "space-between",
    // hug: 1,            // width and height "auto": the group wraps its content (default: 100% x 100%)
});
    // Children created here are arranged automatically
    Label({ text: "Name" });
    Button({ text: "Save" });
endGroup();
```
Groups can be nested (a `VGroup` with `HGroup` rows). Every `HGroup` / `VGroup` needs its `endGroup()`.
(`AutoLayout` and `startFlexBox` are old names of the same function: do not use them in new code.)

## Styling
- `color`: Background color.
- `border`: Border width (px).
- `borderColor`: Border color.
- `round`: Border radius (px).
- `opacity`: 0.0 to 1.0.
- `visible`: 1 (visible) or 0 (hidden).
- `padding`: Inner spacing (for Box, Label).
- `role`, `aria`, `tabIndex` (v26.10.23): `obj.role = "button"; obj.aria = { label: "Close", selected: true }; obj.tabIndex = 0;` (`aria`: only the given keys change, `null` removes one). Use them instead of `elem.setAttribute("aria-...")`.
- `text` is HTML; use `plainText` for every text from a user or a server. An SVG with `stroke="currentColor"` in a Label takes its `textColor` (a hover changes only `textColor`).

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

### Removing Objects
- `obj.remove()` removes the object, its events and `onResize` registrations, and **all basic.js objects inside it** (parents first). A child with a `destroy()` function gets that call first (older objects such as `ScrollBar`).
- **Components are removed with `remove()` too.** A component overrides `remove()` (`const superRemove = box.remove;` … `superRemove.call(box);`) and cleans its global events there (`window` / `document` events, timers, `page.onResize`, static lists), so `myComponent.remove();` is enough.
- A removed object has `_isRemoved = 1` and must not be added to the screen again. Create a new one.
- Objects created on `page` from inside another object (for example a `ContextMenu`) are not its children. Remove them yourself.

### Things cleaned by `remove()` (v26.10.23)
`obj.listenTo(window, "keydown", fn)`, `obj.onPageResize(fn)`, `obj.after(ms, fn)`, `obj.every(ms, fn)` and `obj.own(otherObj)` are removed / stopped by `obj.remove()`. A component uses them instead of `window.addEventListener`, `page.onResize`, `setTimeout` / `setInterval`, so it does not need its own `remove()`. Also: `obj.onHoverChange(fn(self, isOver))`, `obj.setFocusRing(color)` (keyboard only), `basic.isOn(v)`, `basic.addCss(id, css)`, and `createIn()` returns the result of its function.

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
