/* Bismillah */

/*

basic-designer runtime - v0.1 (prototype)

- Loaded INSIDE the page that is designed (the iframe of basic-designer), right after basic.js
  and before the page code. The designer puts it there; the page itself is not changed.
- It records where in the code every basic.js object was created:
  Basic_UIComponent sets this._type in its constructor (the first line for every object), so a
  setter on the prototype sees every Box, Label, Button, Input, Icon and group without wrapping
  the constructors (Box is a const in basic.js, it can not be replaced).
- basic.js keeps its classes in a closure, so the prototype is taken from the first box:
  basic.start() does window.page = new MainBox(), then page.mainBox = createBox(...), then start().
  A setter for window.page wraps the mainBox setter of MainBox, which gets that first box.
- endObject() is wrapped to know the root box of a component (Tabs, PropertyPanel...).
- The params of a component are kept as they were when it was made (box.__bd.params): the call
  mergeIntoIfMissing(params, XxxDefaults) of the component is wrapped (the merged params are copied),
  also the two argument startObject(defaults, params). The designer makes the component again with them.
- Everything is in one global: window.__basicDesigner

Webpage: https://bug7a.github.io/js-components/

Copyright 2020-2026 Bugra Ozden <bugra.ozden@gmail.com> (https://bug7a.github.io/)
Licensed under the Apache License, Version 2.0
SPDX-License-Identifier: Apache-2.0

*/

"use strict";

(function () {

    if (typeof basic === "undefined" || typeof basic.start !== "function") {
        console.warn("basic-designer: basic.js was not found before runtime.js.");
        return;
    }

    Error.stackTraceLimit = 60; // WHY: A component inside a component inside the page goes deep.

    // WHY: designer.js too: a component made again by the designer must not point to the designer.
    // WHY _?: the folder is _basic-designer (basic-designer before); without it the frames of this
    //     file were not skipped: every component was named "callerName" and its params were not found.
    const SKIP_FILES = /\/basic\/basic(\.min)?\.js$|\/_?basic-designer\/(runtime|designer|param-kinds|param-editors)\.js$/;
    const TYPE_KEY = Symbol("basicDesignerType");

    const designer = {
        objects: [], // every object, in creation order
        nextId: 1,
    };

    // One line of a stack: { fn, url, line, col }. Chrome: "at fn (url:1:2)", Safari / Firefox: "fn@url:1:2".
    const parseStack = function (stack) {
        const frames = [];
        String(stack || "").split("\n").forEach(function (text) {
            const m = text.match(/((?:https?|file|about|blob):[^\s()]*?):(\d+):(\d+)\)?\s*$/);
            if (!m) return;
            let fn = "";
            const chrome = text.match(/^\s*at\s+(?:new\s+)?([^\s(]+)\s+\(/);
            const other = text.match(/^\s*([^@\s]*)@/);
            if (chrome) fn = chrome[1];
            else if (other) fn = other[1];
            frames.push({ fn: fn, url: m[1], line: Number(m[2]), col: Number(m[3]) });
        });
        return frames.filter(function (f) { return !SKIP_FILES.test(f.url.split("?")[0]); });
    };

    const record = function (obj) {
        const frames = parseStack(new Error().stack);
        obj.__bd = {
            id: designer.nextId++,
            frames: frames, // [0]: where it was created; the last one is usually the page
            component: "", // set by endObject: the name of the component this box is the root of
        };
        designer.objects.push(obj);
    };

    // SETTER: Basic_UIComponent constructor -> this._type = $type
    const hookPrototype = function (uiProto) {
        if (!uiProto || uiProto.__bdHooked) return;
        uiProto.__bdHooked = 1;
        Object.defineProperty(uiProto, "_type", {
            configurable: true,
            get: function () { return this[TYPE_KEY]; },
            set: function (value) {
                this[TYPE_KEY] = value;
                if (!this.__bd) record(this);
                if (value === "image") addPicture(Object.getPrototypeOf(this));
            },
        });
    };

    // An Icon has no property for its file (only load()): "picture" reads the src and sets it with load(), so the
    // designer changes it like any other property (undo, revert, the saved session). (On the Icon class, once.)
    const addPicture = function (iconProto) {
        if (!iconProto || Object.prototype.hasOwnProperty.call(iconProto, "picture")) return;
        Object.defineProperty(iconProto, "picture", {
            configurable: true,
            get: function () { return this.imageElement.getAttribute("src") || ""; },
            set: function (value) { this.load(String(value || "")); },
        });
    };

    // window.page = new MainBox() -> wrap the mainBox setter -> the first box -> Basic_UIComponent.prototype
    let pageValue = window.page;
    Object.defineProperty(window, "page", {
        configurable: true,
        enumerable: true,
        get: function () { return pageValue; },
        set: function (value) {
            pageValue = value;
            const mainProto = value && Object.getPrototypeOf(value);
            const desc = mainProto && Object.getOwnPropertyDescriptor(mainProto, "mainBox");
            if (!desc || !desc.set || desc.set.__bd) return;
            const setMainBox = function (box) {
                // BBox.prototype -> Basic_UIComponent.prototype
                hookPrototype(Object.getPrototypeOf(Object.getPrototypeOf(box)));
                desc.set.call(this, box);
            };
            setMainBox.__bd = 1;
            Object.defineProperty(mainProto, "mainBox", { configurable: true, get: desc.get, set: setMainBox });
        },
    });

    // *** THE PARAMS OF A COMPONENT:

    const isPlain = function (v) {
        if (!v || typeof v !== "object" || Array.isArray(v)) return false;
        const proto = Object.getPrototypeOf(v);
        return proto === null || Object.getPrototypeOf(proto) === null;
    };

    // A copy of params: plain objects and arrays are copied, the rest (functions, objects of basic.js) by reference.
    designer.cloneParams = function clone(v, depth = 0) {
        if (depth > 8) return v;
        // WHY not v.map: a list of the designer stays a list of the designer with its own map.
        if (Array.isArray(v)) {
            const list = [];
            v.forEach(function (x) { list.push(clone(x, depth + 1)); });
            return list;
        }
        if (isPlain(v)) {
            const out = {};
            for (const k in v) out[k] = clone(v[k], depth + 1);
            return out;
        }
        return v;
    };

    const callerName = function () {
        const frames = parseStack(new Error().stack);
        const fn = (frames[0] && frames[0].fn) || "";
        return fn.split(".").pop();
    };

    // XxxDefaults of a component name, or null. (A const of a script is not on window: eval in the global scope.)
    const findDefaults = function (name) {
        if (!/^[A-Za-z_$][\w$]*$/.test(name || "")) return null;
        try { return (0, eval)("typeof " + name + "Defaults !== 'undefined' ? " + name + "Defaults : null"); } catch (e) { return null; }
    };

    designer.findDefaults = findDefaults;

    // Xxx.styles (the style packages) of a component name, or null.
    const findStyles = function (name) {
        if (!/^[A-Za-z_$][\w$]*$/.test(name || "")) return null;
        try { return (0, eval)("typeof " + name + " !== 'undefined' && " + name + ".styles ? " + name + ".styles : null"); } catch (e) { return null; }
    };
    designer.findStyles = findStyles;

    // The style the page gave, before its style package was merged into it: name -> style
    // WHY: The params are copied after the merge, so params.style holds the package (Ex: classic).
    //      A new styleName needs the style of the page without it.
    const pageStyles = {};

    const captures = []; // [{ name, params }] made, not yet taken by endObject (a component in a component: a stack)

    const originalMerge = window.mergeIntoIfMissing;
    if (typeof originalMerge === "function") {
        window.mergeIntoIfMissing = function (target, source, depth) {
            const top = (depth === undefined || depth === 1);
            const name = top ? callerName() : "";
            if (name && source) {
                const styles = findStyles(name);
                const isPackage = function (v) { return styles && Object.keys(styles).some(function (k) { return styles[k] === v; }); };
                // The old form: mergeIntoIfMissing(params.style, package)
                if (isPackage(source)) pageStyles[name] = designer.cloneParams(target);
                // The short form (v26.10.23): mergeIntoIfMissing(params, { style: package })
                else if (isPlain(source) && Object.keys(source).length === 1 && "style" in source && isPackage(source.style)) {
                    pageStyles[name] = designer.cloneParams(target.style || {});
                }
            }
            const result = originalMerge.apply(this, arguments);
            if (name && source && findDefaults(name) === source) {
                captures.push({ name: name, params: designer.cloneParams(target), pageStyle: (name in pageStyles) ? pageStyles[name] : undefined });
                delete pageStyles[name];
            }
            return result;
        };
    }

    const originalStartObject = window.startObject;
    if (typeof originalStartObject === "function") {
        window.startObject = function ($defaults, $params) {
            // The two argument form: the merge is done inside basic.js, the copy is made here.
            if (arguments.length >= 2 && $params && $defaults) {
                const merged = designer.cloneParams($params);
                originalMerge(merged, $defaults);
                captures.push({ name: callerName(), params: designer.cloneParams(merged) });
            }
            return originalStartObject.apply(this, arguments);
        };
    }

    // endObject(box) -> the component name is the function that called it (Ex: Tabs).
    const wrapEnd = function (name) {
        const original = window[name];
        if (typeof original !== "function") return;
        window[name] = function (box) {
            const result = original.apply(this, arguments);
            if (box && box.__bd && !box.__bd.component) {
                box.__bd.component = callerName() || "Component";
                for (let i = captures.length - 1; i >= 0; i--) {
                    if (captures[i].name === box.__bd.component) {
                        box.__bd.params = captures[i].params;
                        box.__bd.pageStyle = captures[i].pageStyle;
                        captures.splice(i, 1);
                        break;
                    }
                }
            }
            return result;
        };
    };
    wrapEnd("endObject");
    wrapEnd("endExtendedObject");

    designer.isAlive = function (obj) {
        return !!(obj && !obj._isRemoved && obj.elem && obj.elem.isConnected);
    };

    designer.getAlive = function () {
        return designer.objects.filter(designer.isAlive);
    };

    window.__basicDesigner = designer;

})();
