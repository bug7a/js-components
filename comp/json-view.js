/* Bismillah */

/*

JsonView - v26.11

UI COMPONENT
- A value of JSON as a tree: the answer of a server, a settings file, a dictionary of a program. Its keys and its values in
  colors, a branch opens with its arrow.
- NEEDS comp/tree-view.js, loaded first. comp/context-menu.js, when it is loaded, gives the right click its menu.
- A value of any size: the rows of a branch are made when it opens, and a long list comes in pages ([0 … 99], [100 … 199]),
  so a list of a million items opens at once.
- Which value is this? A click on a row gives its path (users[0].name) with onSelect. Right click, or Ctrl+C on a row: its
  value (a list or an object as JSON text) or its path goes to the clipboard.
- A text of JSON: setJsonText(). A text that is not JSON shows its error, it does not stop the page.
- Keyboard: the keys of TreeView: the arrows, Home, End, a letter jumps to a key.
- height: a number or "100%": its rows scroll inside it. "auto": it grows with its rows.
- Style packages: "light" (default), "dark". Select with styleName (JsonView.styles), or later with setTheme().

USAGE:
const view = JsonView({
    height: 400,
    value: { name: "Ada", age: 36, tags: ["a", "b"], address: { city: "İzmir" }, active: true, phone: null },
    expandLevel: 1,
    onSelect: function (self, entry) { println(entry.pathText + " " + entry.kind); },
});
view.setValue({ a: 1 });
view.setJsonText('{"a": 1}');
view.getValue();
view.getSelectedPath();                 // ["tags", 0]
view.getSelectedPathText();             // tags[0]
view.getSelectedValue();                // "a"
view.selectPath(["address", "city"]);   // opens the rows down to it
view.expandAll();
view.collapseAll();
view.setTheme("dark");

AN ENTRY (onSelect): { key, label, kind, path, pathText, value }
- kind: "object", "array", "string", "number", "boolean", "null", or "page" (a row like [0 … 99]).
- value: the value of a string, a number, a boolean or null. An object or a list: null (getSelectedValue() gives it).

Started Date: November 2026
Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

// Default values:
const JsonViewDefaults = {
    key: "0", // Your name for this object: read it in a callback (self.key)
    left: 0,
    top: 0,
    width: "100%",
    height: "100%", // A number or "100%": its rows scroll inside it. "auto": it grows with its rows.
    value: null, // A value of JSON. null: emptyText
    expandLevel: 1, // How many levels are open at the start. 0: only the first rows, closed.
    pageSize: 100, // A list or an object with more items than this comes in pages.
    emptyText: "No value",
    copyValueText: "Copy value",
    copyPathText: "Copy path",
    useScrollBar: 1, // basic/scroll-bar.js (when it is loaded), with a height that is not "auto". 0: the scrollbar of the browser
    ariaLabel: "JSON",
    onSelect: function (self, entry) { }, // A row was chosen (See AN ENTRY above). (Not at create time, not with selectPath())
    onCopy: function (self, text) { }, // A value or a path is on the clipboard.
    styleName: "light", // "light", "dark" or a name added to JsonView.styles
    style: { // Light style package (default)
        box: { color: "white" },
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        // The colors of the parts of a row
        kinds: {
            key: "#2467B8",
            index: Black(0.45),
            string: "#1F7A3D",
            number: "#A85A00",
            boolean: "#8A2F8E",
            null: "#7A7F87",
            object: Black(0.45),
            array: Black(0.45),
            page: Black(0.5),
        },
        // A style of TreeView, over its "light" package
        tree: {
            box: { color: "transparent", padding: [6, 6] },
            row: { height: 26, fontSize: 13, textColor: Black(0.8), indent: 16, gap: 8 },
            rowHover: { color: Black(0.05) },
            rowSelected: { color: Black(0.09), textColor: "#141414" },
            rowFocus: { outlineColor: "rgba(63, 141, 148, 0.8)" },
            arrow: { color: Black(0.45) },
            note: { fontSize: 13 },
            empty: { textColor: Black(0.45), fontSize: 14 },
        },
        error: { textColor: "#C0392B" }, // A text that is not JSON
        menuStyleName: "light", // The package of its menu
        menu: { item: { height: 30, fontSize: 13 } }, // Over that package
        menuMinWidth: 150,
    },
};

const JsonView = function (params = {}) {

    // Merge style package: params.style > JsonView.styles[styleName] > JsonViewDefaults.style (light)
    const pageStyle = params.style; // WHY: setTheme() puts it over another package.
    basic.applyStylePackage(params, JsonView.styles, JsonViewDefaults);

    // Merge params:
    mergeIntoIfMissing(params, JsonViewDefaults);

    // WHY before startObject: box.height never reads "auto".
    const isAutoHeight = (String(params.height) === "auto");

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    let _s = box.style;
    const openKeys = new Set(); // The rows that are open: setTheme() makes the tree again with them.
    let isFirstDraw = 1; // 1: expandLevel says which rows are open.
    let rootKeys = [];

    // *** PUBLIC VARIABLES:
    box.errorText = ""; // The error of a text that is not JSON (setJsonText)
    // NOTE: Default values are also public variables. (box.value, box.expandLevel...)

    // *** PRIVATE FUNCTIONS:

    // The style of a package, with the style of the page over it. (setTheme)
    const styleOfPackage = function (styleName) {
        const fresh = { styleName: styleName, style: pageStyle };
        basic.applyStylePackage(fresh, JsonView.styles, JsonViewDefaults);
        mergeIntoIfMissing(fresh, JsonViewDefaults);
        return fresh.style;
    };

    // NODES: a part of the value as the nodes of the tree, only as far as it is open.

    const shouldOpen = function (key, level) {
        const isOpen = (isFirstDraw) ? level < box.expandLevel : openKeys.has(key);
        if (isOpen) openKeys.add(key);
        return isOpen;
    };

    // What a node with children needs to make them, when it opens.
    const ownerOf = function (value, path, kind) {
        const names = (kind === "object") ? Object.keys(value) : null;
        return { key: JsonView.pathText(path), value: value, path: path, names: names, count: (names) ? names.length : value.length };
    };

    const createPageNode = function (owner, from, to, level) {
        const key = owner.key + "<" + from + "-" + to + ">";
        const node = {
            key: key,
            text: "[" + from + " … " + (to - 1) + "]",
            textColor: _s.kinds.page,
            hasChildren: 1,
            data: { kind: "page", path: owner.path, owner: owner, from: from, to: to },
        };
        // WHY openKeys and not expandLevel: a page is not opened by itself: a long list stays closed.
        if (openKeys.has(key)) {
            node.expanded = 1;
            node.children = createNodesOfRange(owner, from, to, level + 1);
        }
        return node;
    };

    const createValueNode = function (value, path, level) {
        const kind = JsonView.kindOf(value);
        const label = (path.length > 0) ? path[path.length - 1] : "";
        const node = {
            key: JsonView.pathText(path),
            text: String(label),
            textColor: (typeof label === "number") ? _s.kinds.index : _s.kinds.key,
            description: JsonView.valueText(value, kind),
            descriptionColor: _s.kinds[kind],
            data: { kind: kind, path: path, value: value },
        };
        if (kind !== "object" && kind !== "array") return node;
        const owner = ownerOf(value, path, kind);
        node.data.owner = owner;
        if (owner.count === 0) return node;
        node.hasChildren = 1;
        if (shouldOpen(node.key, level)) {
            node.expanded = 1;
            node.children = createNodesOfRange(owner, 0, owner.count, level + 1);
        }
        return node;
    };

    // The nodes of one part of a list or an object: its items, or pages of them.
    const createNodesOfRange = function (owner, from, to, level) {
        const nodes = [];
        const step = JsonView.pageStep(to - from, box.pageSize);
        if (step > 1) {
            for (let start = from; start < to; start += step) {
                nodes.push(createPageNode(owner, start, Math.min(start + step, to), level));
            }
            return nodes;
        }
        for (let index = from; index < to; index++) {
            const name = (owner.names) ? owner.names[index] : index;
            nodes.push(createValueNode(owner.value[name], owner.path.concat([name]), level));
        }
        return nodes;
    };

    const createRootNodes = function () {
        const kind = JsonView.kindOf(box.value);
        if (kind === "null") return [];
        if (kind !== "object" && kind !== "array") return [createValueNode(box.value, [], 0)];
        const owner = ownerOf(box.value, [], kind);
        if (owner.count === 0) return [createValueNode(box.value, [], 0)];
        return createNodesOfRange(owner, 0, owner.count, 0);
    };

    const onLoadChildren = function (tree, node) {
        const data = node.data;
        const from = (data.kind === "page") ? data.from : 0;
        const to = (data.kind === "page") ? data.to : data.owner.count;
        tree.setChildren(node.key, createNodesOfRange(data.owner, from, to, 0));
    };

    const onToggle = function (tree, node) {
        if (node.expanded == 1) openKeys.add(node.key);
        else openKeys.delete(node.key);
    };

    const entryOf = function (node) {
        const data = node.data;
        const hasOwnValue = (data.kind !== "object" && data.kind !== "array" && data.kind !== "page");
        return {
            key: node.key,
            label: node.text,
            kind: data.kind,
            path: data.path,
            pathText: JsonView.pathText(data.path),
            value: (hasOwnValue) ? data.value : null,
        };
    };

    const onTreeSelect = function (tree, node) {
        box.onSelect(box, entryOf(node));
    };

    // COPY

    const copyText = function (text) {
        JsonView.copyToClipboard(text).then(function () {
            if (!box.isRemoved) box.onCopy(box, text);
        }).catch(function (error) {
            console.warn("JsonView: It could not be copied. " + error);
        });
    };

    const copySelected = function (what) {
        const node = box.tree.getSelectedNode();
        if (!node) return;
        copyText((what === "path") ? JsonView.pathText(node.data.path) : JsonView.textToCopy(box.getSelectedValue()));
    };

    const onTreeKeyDown = function (self, event) {
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "c") {
            event.preventDefault(); // WHY: A MenuBar with a Copy must not run it too.
            copySelected("value");
        }
    };

    // The row under the mouse is the row the menu copies. No row: no menu.
    const onTreeRightClick = function (self, event) {
        const node = box.tree.getNodeOfEvent(event);
        box.menu.setEnabled((node) ? 1 : 0);
        if (node) box.tree.setValue(node.key);
    };

    const createMenu = function () {
        if (typeof ContextMenu === "undefined") return null;
        return ContextMenu({
            items: [{ key: "value", text: box.copyValueText }, { key: "path", text: box.copyPathText }],
            styleName: _s.menuStyleName,
            style: _s.menu,
            minWidth: _s.menuMinWidth,
            ariaLabel: box.ariaLabel,
            onClick: function (self, item) { copySelected(item.key); },
        });
    };

    // The tree and its menu. WHY a new tree for a theme: a TreeView keeps the style it was made with.
    const createTree = function (nodes, selectedKey) {
        createIn(box, function () {
            box.tree = TreeView({
                left: 0,
                top: 0,
                width: "100%",
                height: (isAutoHeight) ? "auto" : "100%",
                position: (isAutoHeight) ? "relative" : "absolute",
                items: nodes,
                value: selectedKey,
                emptyText: box.emptyText,
                useScrollBar: box.useScrollBar,
                ariaLabel: box.ariaLabel,
                styleName: "light",
                style: _s.tree,
                onSelect: onTreeSelect,
                onToggle: onToggle,
                onLoadChildren: onLoadChildren,
            });
        });
        box.tree.elem.classList.add("json-view-tree");
        box.tree.elem.style.setProperty("--json-view-font", _s.fontFamily);
        box.tree.listArea.on("keydown", onTreeKeyDown);
        box.menu = createMenu();
        if (!box.menu) return;
        box.tree.listArea.on("contextmenu", onTreeRightClick, true); // WHY capture: before the menu opens.
        box.menu.attachTo(box.tree.listArea);
    };

    const removeTree = function () {
        if (box.menu) box.menu.remove();
        box.tree.remove();
    };

    const paintEmptyText = function () {
        box.tree.setEmptyText(box.errorText || box.emptyText);
        box.tree.lblEmpty.textColor = (box.errorText) ? _s.error.textColor : _s.tree.empty.textColor;
    };

    const drawValue = function () {
        openKeys.clear();
        isFirstDraw = 1;
        const nodes = createRootNodes();
        isFirstDraw = 0;
        rootKeys = nodes.map(function (node) { return node.key; });
        box.tree.setItems(nodes, null);
        paintEmptyText();
    };

    // The pages of a long list open down to the one with this place of it.
    const openPageOf = function (nodes, position) {
        let list = nodes;
        let page = null;
        const isHere = function (node) {
            return (node.data.kind === "page" && node.data.from <= position && position < node.data.to);
        };
        for (page = list.find(isHere); page; page = list.find(isHere)) {
            box.tree.expand(page.key);
            list = box.tree.getNode(page.key).children || [];
        }
    };

    const nodesUnder = function (key) {
        if (key !== null) return box.tree.getNode(key).children || [];
        return rootKeys.map(function (rootKey) { return box.tree.getNode(rootKey); });
    };

    // *** PUBLIC FUNCTIONS:

    // A new value: the rows open as expandLevel says.
    box.setValue = function (value) {
        box.value = (value === undefined) ? null : value;
        box.errorText = "";
        drawValue();
    };
    // USAGE: view.setValue({ a: 1 })

    box.getValue = function () {
        return box.value;
    };

    // Returns 1, or 0 with the error on the view (box.errorText).
    box.setJsonText = function (text) {
        try {
            box.setValue(JSON.parse(text));
            return 1;
        } catch (error) {
            box.setValue(null);
            box.errorText = error.message;
            paintEmptyText();
            return 0;
        }
    };
    // USAGE: view.setJsonText('{"a": 1}')

    // null: no row is selected.
    box.getSelectedPath = function () {
        const node = box.tree.getSelectedNode();
        return (node) ? node.data.path : null;
    };

    box.getSelectedPathText = function () {
        const path = box.getSelectedPath();
        return (path) ? JsonView.pathText(path) : "";
    };

    // The value of the selected row. A page: its part of the list. undefined: no row is selected.
    box.getSelectedValue = function () {
        const node = box.tree.getSelectedNode();
        if (!node) return undefined;
        if (node.data.kind === "page") return JsonView.pageValue(node.data);
        return JsonView.valueAt(box.value, node.data.path);
    };

    // The rows down to a place of the value open; it is selected and seen. onSelect is not called.
    box.selectPath = function (path) {
        let value = box.value;
        for (let step = 0; step < path.length; step++) {
            if (value === null || typeof value !== "object") return;
            const ownerKey = (step === 0) ? null : JsonView.pathText(path.slice(0, step));
            if (ownerKey !== null) box.tree.expand(ownerKey);
            const position = (Array.isArray(value)) ? path[step] : Object.keys(value).indexOf(String(path[step]));
            openPageOf(nodesUnder(ownerKey), position);
            value = value[path[step]];
        }
        box.tree.setValue(JsonView.pathText(path), 1);
    };
    // USAGE: view.selectPath(["users", 0, "name"])

    // WHY the limits: every row of a big value would be one object on the page, and a value of the page can hold itself:
    //      thousands of groups in each other take seconds to draw.
    box.expandAll = function () {
        let rowCount = 0;
        const openAll = function (nodes, depth) {
            nodes.forEach(function (node) {
                rowCount++;
                if (rowCount > JsonView.MAX_ROWS_OF_EXPAND_ALL || depth >= JsonView.MAX_DEPTH_OF_EXPAND_ALL || !node.hasChildren) return;
                box.tree.expand(node.key);
                openAll(box.tree.getNode(node.key).children || [], depth + 1);
            });
        };
        openAll(nodesUnder(null), 0);
    };

    box.collapseAll = function () {
        box.tree.collapseAll();
    };

    // Another style package while it is on the page. A style given by the page stays over it. The open rows, the selection and
    // the scroll stay.
    box.setTheme = function (styleName) {
        const selectedKey = box.tree.value;
        const scrollTop = box.tree.listArea.elem.scrollTop;
        box.styleName = styleName;
        _s = styleOfPackage(styleName);
        box.style = _s;
        box.props(_s.box);
        removeTree();
        createTree(createRootNodes(), selectedKey);
        paintEmptyText();
        box.tree.listArea.elem.scrollTop = scrollTop;
    };
    // USAGE: view.setTheme("dark")

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (box.isRemoved) return; // WHY: remove() can be called twice (also by the parent's remove()).
        if (box.menu) box.menu.remove(); // WHY: not with box.own(): setTheme() makes a new one, and own() would keep the old one to the end.
        superRemove.call(box);
    };
    // USAGE: view.remove();

    // *** OBJECT VIEW:

    basic.addCss("json-view", ".json-view-tree .basic_label { font-family: var(--json-view-font); }");
    box.props(_s.box);
    if (isAutoHeight) box.css.position = "relative";
    createTree([], null);

    // *** OBJECT INIT CODE:

    drawValue();

    return endObject(box);

};

// *** STATIC VARIABLES AND FUNCTIONS:

JsonView.MAX_LETTERS_OF_TEXT = 300; // A longer text is cut on its row. WHY: Its row is one line; the whole of it is copied.
JsonView.MAX_ROWS_OF_EXPAND_ALL = 3000;
JsonView.MAX_DEPTH_OF_EXPAND_ALL = 20;
JsonView.IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

JsonView.kindOf = function (value) {
    if (value === null || value === undefined) return "null";
    if (Array.isArray(value)) return "array";
    if (value instanceof Date) return "string";
    const type = typeof value;
    if (type === "bigint") return "number";
    return (type === "string" || type === "number" || type === "boolean" || type === "object") ? type : "null";
};

// The text of a value on its row. A list: [3], an object: {3}.
JsonView.valueText = function (value, kind) {
    if (kind === "array") return "[" + value.length + "]";
    if (kind === "object") return "{" + Object.keys(value).length + "}";
    if (value instanceof Date) return JSON.stringify(value);
    if (typeof value !== "string") return String(value);
    const isCut = (value.length > JsonView.MAX_LETTERS_OF_TEXT);
    return (isCut) ? JSON.stringify(value.slice(0, JsonView.MAX_LETTERS_OF_TEXT)) + " …" : JSON.stringify(value);
};

// ["users", 0, "a b"] -> users[0]["a b"]. The first level of a value that has no keys: $
JsonView.pathText = function (path) {
    if (path.length === 0) return "$";
    return path.map(function (part, index) {
        if (typeof part === "number") return "[" + part + "]";
        if (JsonView.IDENTIFIER.test(part)) return (index === 0) ? part : "." + part;
        return "[" + JSON.stringify(part) + "]";
    }).join("");
};

JsonView.valueAt = function (value, path) {
    return path.reduce(function (part, name) { return part[name]; }, value);
};

// How many items are in each page of this many: 1: no pages. A million items in pages of 100: 10 pages, in each 100 pages...
JsonView.pageStep = function (count, pageSize) {
    if (count <= pageSize) return 1;
    let step = pageSize;
    while (count / step > pageSize) step *= pageSize;
    return step;
};

JsonView.pageValue = function (page) {
    const owner = page.owner;
    if (!owner.names) return owner.value.slice(page.from, page.to);
    const part = {};
    owner.names.slice(page.from, page.to).forEach(function (name) { part[name] = owner.value[name]; });
    return part;
};

// A text as it is; anything else as JSON. WHY the catch: a value of the page can hold itself.
JsonView.textToCopy = function (value) {
    if (typeof value === "string") return value;
    try {
        return JSON.stringify(value, null, 2);
    } catch (error) {
        return String(value);
    }
};

// Returns a Promise.
JsonView.copyToClipboard = function (text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    // WHY: A page opened from a file has no navigator.clipboard.
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position: fixed; left: -9999px; top: 0;";
    document.body.appendChild(area);
    area.select();
    const isCopied = document.execCommand("copy");
    area.remove();
    return (isCopied) ? Promise.resolve() : Promise.reject(new Error("The browser refused it."));
};

// *** STYLE PACKAGES:
// USAGE: JsonView({ styleName: "dark" })
// USAGE: JsonView({ style: { kinds: { string: "tomato" } } }) // Change only some keys.
// NOTE: A new package needs only the keys that differ from the default (light) style.
// USAGE: JsonView.styles.myStyle = { box: { color: "#FFFDF5" } };
JsonView.styles = {

    // A white page, the colors of the code of CodeEditor.
    light: JsonViewDefaults.style,

    // For a dark window.
    dark: {
        box: { color: "#1C1C1B" },
        kinds: {
            key: "#8CC4EE",
            index: White(0.5),
            string: "#8FD694",
            number: "#F0B56A",
            boolean: "#D7A2E8",
            null: "#8D939B",
            object: White(0.5),
            array: White(0.5),
            page: White(0.55),
        },
        tree: {
            row: { textColor: White(0.85) },
            rowHover: { color: White(0.06) },
            rowSelected: { color: White(0.12), textColor: "#FFFFFF" },
            rowFocus: { outlineColor: "rgba(111, 198, 205, 0.8)" },
            arrow: { color: White(0.5) },
            empty: { textColor: White(0.5) },
            scrollBar: { bar_color: "#8A8A88", bar_mouseOverColor: "#BFBFBD" },
        },
        error: { textColor: "#FF9F93" },
        menuStyleName: "dark",
    },

};
