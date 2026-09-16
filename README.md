# JS-Component Suite

> **Design with code. Skip the complexity.**
> UI components, samples and app templates for building web interfaces in plain JavaScript. You don't write HTML markup or CSS files.

JS-Component Suite is built on [**basic.js**](https://bug7a.github.io/basic.js/), a small, dependency-free library that creates DOM objects directly from JavaScript. It has no virtual DOM, no build step and no `node_modules`. You add a `<script>` tag, write a few lines and open the page in a browser.

---

## A Quick Look

```html
<link rel="stylesheet" href="basic/basic.min.css">
<script src="basic/basic.min.js"></script>
<script src="comp-m3/button-with-icon.js"></script>

<script>
const start = function () {

    VGroup({ align: "center", gap: 16 });

        Label({ text: "Hello!", fontSize: 24 });

        ButtonWithIcon({
            width: 200,
            height: 50,
            labelText: "Click Me",
            iconFile: "assets/icon.png",
            onClick: function (self) { println("Clicked"); },
        });

    endGroup();
};
</script>
```

When the page loads, basic.js creates the global `page` and calls `start()`. Every object you create goes into the current container, and `VGroup` … `endGroup()` lays those objects out vertically with flexbox.

---

## Why JS-Component Suite?

* **Readable code:** The code for a screen follows the layout of the screen, so you can understand it at a glance.
* **Small learning curve:** If you know JavaScript, a handful of concepts are enough to start: `Box`, `Label`, `Button`, `AutoLayout` and `that`.
* **One place for everything:** You define layout, style and behavior together in JavaScript, so you don't have to keep markup, stylesheets and logic in sync across files.
* **Lightweight:** There are no external dependencies or framework runtime. Components work directly on the DOM.
* **Fast prototyping:** It suits solo developers and small teams who want to go from idea to working interface quickly.

---

## Key Features

### Self-Contained Components
Each component carries its own logic and styling. You create one with a single call and a props object, and change it later through explicit `setX()` methods.

### AutoLayout
AutoLayout wraps CSS flexbox in designer-friendly props such as `flow: "vertical"`, `align: "center top"`, `gap` and `padding`.

### Simple Motion
To animate an object, declare its transitions once with `obj.setMotion("left 0.3s, opacity 0.2s")` and then change its properties.

### Theming
Generation 2 and later components share design tokens (`UI.COLOR_*`, `UI.TEXT_*`, `UI.ROUND_*`) from `comp-m2/ui-standards.js`. Call `UI.applyTheme(isDark)` to switch to dark mode.

---

## Getting Started

1. Clone or download this repository.
2. Open any `.htm` file in a browser. Many pages load images or other local files, so a local server works best. The VS Code **Live Server** extension is preconfigured on port `5505`.
3. For a new page, start from `_empty-project-template.htm`. For a new component, start from `_component-template.js`.

Load scripts in this order: `basic.css` and `basic.js` first, then `ui-standards` if you use it, then the components, then your page code.

---

## Repository Structure

| Path | Contents |
| :--- | :--- |
| `basic/` | The core library (`basic.js`, `basic.css`, fonts) |
| `comp-m1/` … `comp-m4/` | Components, grouped by generation. `m1` is legacy and `m4` is the newest. |
| `01-basic-samples-m1/` | Step-by-step tutorial pages for the core library |
| `02-comp-m*-samples/` | One demo page per component |
| `03-page-m2/`, `04-template-m*/` | Full app templates: admin panel, contact form, to-do app, data table |
| `__handbook/` | The basic.js handbook in [English](__handbook/english/) and [Turkish](__handbook/turkce/) |
| `context/` | Short reference docs for the core library and components |
| `__developer-toolkit/` | VS Code extensions for basic.js: completer, object navigator, view inspector |

Most components have a `.min.js` twin next to them, and sample pages often load that version.

---

## Comparison at a Glance

| | JS-Component Suite | Typical Frameworks |
| :--- | :--- | :--- |
| **Learning curve** | Plain JavaScript | Extra syntax (JSX, templates, DSLs) |
| **Styling** | Defined on the object | Separate CSS / Tailwind / Sass |
| **Build step** | None | Bundler and toolchain |
| **Dependencies** | None | Many `node_modules` packages |

---

## Built with This Technology

* **UI Components:** [Browse Components](https://bug7a.github.io/js-components/)
* **Mobile App Template:** [JavaScript Mobile App Template](https://bug7a.github.io/javascript-mobile-app-template/)
* **Mobile App on Web:** [Expense Showcase App](https://bug7a.github.io/expense/)
* **PC Game on Steam:** [The Fallen Kingdoms](https://store.steampowered.com/app/2923920/)

---

I hope you find it useful.

## License

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com>
Licensed under the [Apache License, Version 2.0](LICENSE).
