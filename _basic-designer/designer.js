/* Bismillah */

/*

basic-designer - v0.1 (prototype)

- Opens a basic.js page in an iframe, as it is (its own code runs), and shows:
  the layers (every basic.js object, nested, with a name), the selection on the canvas,
  the properties of the selected object (PropertyPanel), and the list of changes.
- A change is applied to the live page at once, never written to a file.
  "Copy prompt" turns the changes and the notes into a text for the AI, with file:line of every object.
- The page is fetched as text and given to the iframe with srcdoc: on the SAME lines,
  <base> is added, .min.js -> .js and runtime.js after basic.js, so the line numbers stay right.

Developer: Bugra Ozden

*/

"use strict";

const BasicDesigner = {};
window.BasicDesigner = BasicDesigner; // WHY: host.htm reads it from the iframe (window.parent.BasicDesigner); a const is not on window.

// *** SETTINGS:
BasicDesigner.config = {
    // WHY: "Open in VS Code" from a browser needs the path on the disk: each user writes it in the settings.
    rootPath: "",
    defaultPage: "02-comp-examples/tabs.htm",
    topHeight: 44,
    leftWidth: 280,
    rightWidth: 248, // the 240 of the panel + 8: the right space is 16 like the left one (not 8), the fields keep their width
    statusHeight: 28,
    devices: [
        { key: "full", text: "Full width", width: 0, icon: "desktop" },
        { key: "laptop", text: "Laptop", width: 1280, icon: "laptop" },
        { key: "tablet", text: "Tablet", width: 768, icon: "tablet" },
        { key: "phone", text: "Phone", width: 390, icon: "phone" },
    ],
    recentCount: 10, // pages in the "Recent" list of the page picker
};

// THEMES: the background and the accent (the selection color), chosen in Settings > Appearance.
// BasicDesigner.colors is filled from them by applyTheme(): every object takes its colors when it is made,
// so a new theme loads the designer again (the unsaved changes come back by themselves).
BasicDesigner.BACKGROUNDS = {
    gray: { name: "Gray", colors: {
        bar: "#2C2C2C", // panels, top bar
        canvas: "#1E1E1E", // around the page
        menu: "#1E1E1E", // menus, tips, popups
        raised: "#262626", // dialogs
        field: "#383838", // fields, buttons, hover
        fieldBorder: "#4D4D4D",
        fieldBorderStrong: "#5C5C5C",
        fieldHover: "#434343",
        line: "#444444",
        hover: "#383838",
        soft: "#A5A5A5",
        dim: "#6E6E6E",
    } },
    turquoise: { name: "Dark turquoise", colors: {
        bar: "#17373B",
        canvas: "#0F2629",
        menu: "#0E2225",
        raised: "#143034",
        field: "#22474C",
        fieldBorder: "#335B60",
        fieldBorderStrong: "#41696E",
        fieldHover: "#2A5156",
        line: "#2A4C51",
        hover: "#22474C",
        soft: "#9CBEC1",
        dim: "#62878B",
    } },
};

BasicDesigner.ACCENTS = {
    blue: { name: "Blue", colors: { accent: "#0C8CE9", accentHover: "#3AA0F0", accentLight: "#7CC4F8", selectedRow: "#34435A" } },
    indianred: { name: "Indian red", colors: { accent: "#CD5C5C", accentHover: "#D97676", accentLight: "#F2A7A7", selectedRow: "#553838" } },
    oceangreen: { name: "Ocean green", colors: { accent: "#3DAA81", accentHover: "#52BC93", accentLight: "#8FDDBE", selectedRow: "#2E4F43" } },
};

BasicDesigner.colors = {
    text: "#FFFFFF",
    component: "#C792EA",
    // + the colors of the background and the accent (applyTheme)
};

BasicDesigner.applyTheme = function () {
    const settings = BasicDesigner.settings;
    const background = BasicDesigner.BACKGROUNDS[settings.background] || BasicDesigner.BACKGROUNDS.gray;
    const accent = BasicDesigner.ACCENTS[settings.accent] || BasicDesigner.ACCENTS.blue;
    Object.assign(BasicDesigner.colors, background.colors, accent.colors);
};

// *** STATE:
BasicDesigner.state = {
    pagePath: "",
    pageUrl: "",
    rootUrl: new URL("../", location.href).href,
    win: null, // window of the iframe
    rt: null, // window.__basicDesigner of the iframe
    sources: {}, // url -> [lines]
    tree: [], // root nodes { obj, children }
    expanded: new Set(), // ids
    selected: null,
    hovered: null,
    mode: "select", // "select" | "interact"
    isManualMode: false, // MANUAL MODE (the toolbox): a drag puts an object where the mouse leaves it, also in a group;
                         // a new object of a click goes to 0, 0 of its box, over the others (manualPlaceIn)
    canSave: false, // 1 when the page is ready: the changes are saved in basic.storage (SESSION)
    isReplaying: false, // applySession is making the saved changes again
    placeLog: [], // add / move / delete with refs, in order (SESSION)
    addedObjects: [], // every object added in the designer, in order (a ref of an added object is its index)
    history: [], // UNDO: the sessions, the newest last
    filter: "", // LAYERS: the text of the search
    hiddenObjects: new Map(), // LAYERS: obj -> its visibility before the eye hid it (only in the designer, not a change)
    redoList: [], // REDO: the sessions undone
    device: "full",
    changes: new Map(), // "id:key" -> { obj, key, from, to, targets: Map(obj -> its own from) }
    scope: "one", // "one": the selected object, "line": every object created by the same line
    inspect: "params", // A component: "params" (its parameters) or "box" (the properties of its root box)
    paramOriginal: new Map(), // id -> the params of a component before its first change (Revert all)
    paramCollapsed: new Set(), // "id:path" of the closed objects in the parameters
    paramFilter: "", // PARAMETERS: the text of the search
    paramOnlyChanged: false, // PARAMETERS: only the values that are not the default
    notes: new Map(), // id -> text
    names: new Map(), // id -> a name given in the designer (a new name of an object of the code, or of an added one)
    pageChanges: new Map(), // the changes of the page object (page.color...): key -> { from, to }
    scriptChanges: new Map(), // the component files of the page changed in the Components panel: repo path -> "add" | "remove"
    projectNote: "", // the note for the AI about the whole project (the Page panel)
    isPageSelected: false, // the Page row is selected (not an object)
    defaultProps: {}, // COPY: type -> the values of a new object of that type (defaultPropsOf), per page
};

// *** HELPERS:

BasicDesigner.esc = function (text) {
    return basic.escapeHtml(String(text === undefined || text === null ? "" : text));
};

BasicDesigner.relPath = function (url) {
    const s = BasicDesigner.state;
    if (!url) return "?";
    if (url.indexOf("about:srcdoc") === 0) return s.pagePath;
    if (s.hostUrl && url.split("?")[0] === s.hostUrl) return s.pagePath; // A page written by host.htm
    const clean = url.split("?")[0].split("#")[0];
    if (clean.indexOf(s.rootUrl) === 0) return decodeURI(clean.slice(s.rootUrl.length));
    return clean;
};

BasicDesigner.where = function (frame) {
    if (!frame) return "?";
    return BasicDesigner.relPath(frame.url) + ":" + frame.line;
};

// The callers after the first frame, without repeats (Ex: tabs.js:911 <- tabs.js:911 of a forEach).
BasicDesigner.chainFrames = function (obj, count) {
    const out = [];
    const first = BasicDesigner.where(obj.__bd.frames[0]);
    obj.__bd.frames.slice(1).forEach(function (f) {
        const w = BasicDesigner.where(f);
        const last = out[out.length - 1];
        if (w !== first && (!last || BasicDesigner.where(last) !== w)) out.push(f);
    });
    return out.slice(0, count);
};

BasicDesigner.chain = function (obj, count) {
    return BasicDesigner.chainFrames(obj, count).map(BasicDesigner.where);
};

BasicDesigner.sourceLine = function (frame) {
    if (!frame) return "";
    const lines = BasicDesigner.state.sources[frame.url.split("?")[0]];
    return (lines && lines[frame.line - 1]) || "";
};

// The type of an object: Label, Box, HGroup... or the component name (Tabs).
BasicDesigner.typeOf = function (obj) {
    if (obj.__bd.component) return obj.__bd.component;
    switch (obj._type) {
        case "label": return "Label";
        case "button": return "Button";
        case "textbox": return "Input";
        case "image": return "Icon";
    }
    if (obj._isFlex) return (obj._flow === "vertical") ? "VGroup" : "HGroup";
    return "Box";
};

// The frame that names the object: a component root -> the line that called the component.
BasicDesigner.nameFrame = function (obj) {
    const f = obj.__bd.frames;
    if (obj.__bd.component && f.length > 1) return f[1];
    return f[0];
};

// The variable name from the source line: "tabsBasic = Tabs({" -> tabsBasic, "box.label = Label(" -> box.label
BasicDesigner.varName = function (obj) {
    if (obj.__bd.added) return ""; // WHY: Not in the code yet (a component's own line would give its inner "box").
    const line = BasicDesigner.sourceLine(BasicDesigner.nameFrame(obj));
    const m = line.match(/([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*(?:new\s+)?[A-Za-z_$][\w$.]*\s*\(/);
    if (!m) return "";
    return m[1].split(".").slice(-2).join(".");
};

BasicDesigner.previewText = function (obj) {
    if (["label", "button"].indexOf(obj._type) === -1) return "";
    const t = (obj.elem.textContent || "").replace(/\s+/g, " ").trim();
    return (t.length > 28) ? t.slice(0, 27) + "…" : t;
};

// *** NAMES: an object added in the designer gets a name at once (btn12, box45: its kind and
// a number), so it has one even when the user gives none. A name can be changed in the panel (Name); the prompt asks
// the AI to give the automatic ones a name that says what the object is.
BasicDesigner.NAME_PREFIXES = { Box: "box", VGroup: "group", HGroup: "group", Label: "lbl", Button: "btn", Input: "inp", Icon: "icon" };
BasicDesigner.NAME_PATTERN = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/; // btnSave, box.label

// The name of an object without the designer: the automatic one of an added object, or the one in the code ("": none)
BasicDesigner.baseNameOf = function (obj) {
    if (obj.__bd.added) return obj.__bd.added.name || "";
    return BasicDesigner.varName(obj);
};

// The name the designer shows: the one given in the designer, or the base name.
BasicDesigner.nameOf = function (obj) {
    return BasicDesigner.state.names.get(obj.__bd.id) || BasicDesigner.baseNameOf(obj);
};

// 1: the automatic name of an added object (the user did not change it)
BasicDesigner.isAutoName = function (obj) {
    return (obj.__bd.added && obj.__bd.added.name && !BasicDesigner.state.names.has(obj.__bd.id)) ? 1 : 0;
};

BasicDesigner.namePrefixOf = function (type) {
    return BasicDesigner.NAME_PREFIXES[type] || (type.charAt(0).toLowerCase() + type.slice(1));
};

// The names of the objects on the page now, without the one of except.
BasicDesigner.usedNames = function (except) {
    return BasicDesigner.state.rt.getAlive().filter(function (o) { return o !== except && o.__bd; }).map(BasicDesigner.nameOf).filter(Boolean);
};

// The prefix of the type and one more than the highest number of that prefix on the page (btn1, btn2...).
BasicDesigner.newNameFor = function (type) {
    const prefix = BasicDesigner.namePrefixOf(type);
    const pattern = new RegExp("^" + prefix + "(\\d+)$");
    let highest = 0;
    BasicDesigner.usedNames(null).forEach(function (name) {
        const match = name.match(pattern);
        if (match) highest = Math.max(highest, Number(match[1]));
    });
    return prefix + (highest + 1);
};

// Name in the panel: a new name, or "" (an added object gets its automatic name back, an object of the code its own).
BasicDesigner.renameObject = function (obj, typed) {
    const s = BasicDesigner.state;
    const name = String(typed || "").trim();
    const refuse = function (text) {
        BasicDesigner.setStatus(text, "error");
        BasicDesigner.showProperties(obj);
    };
    if (name && !BasicDesigner.NAME_PATTERN.test(name)) {
        refuse("Not a name: \"" + name + "\". Letters, digits, _ and $, not a digit first. Ex: btnSave");
        return;
    }
    if (name && BasicDesigner.usedNames(obj).indexOf(name) !== -1) {
        refuse("Another object is named " + name + ".");
        return;
    }
    if (!name || name === BasicDesigner.baseNameOf(obj)) s.names.delete(obj.__bd.id);
    else s.names.set(obj.__bd.id, name);
    BasicDesigner.refreshChanges();
    BasicDesigner.refreshTreeRow(obj);
    BasicDesigner.showProperties(obj);
};

// A text field for a name: Enter (or leaving it) renames the object, Escape gives the old name back.
// WHY stopPropagation: the keys are not shortcuts of the designer (Backspace would delete the object).
BasicDesigner.connectNameInput = function (input, getObject, onDone) {
    const el = input.inputElement;
    let isDone = 0;
    const finish = function (isSaved) {
        if (isDone) return;
        isDone = 1;
        const obj = getObject();
        if (isSaved && obj) BasicDesigner.renameObject(obj, input.text);
        if (onDone) onDone();
        isDone = 0;
    };
    el.setAttribute("spellcheck", "false");
    el.addEventListener("keydown", function (event) {
        event.stopPropagation();
        if (event.key === "Enter") {
            event.preventDefault();
            finish(1);
        } else if (event.key === "Escape") {
            event.preventDefault();
            const obj = getObject();
            input.text = (obj) ? BasicDesigner.nameOf(obj) : "";
            finish(0);
        }
    });
    el.addEventListener("blur", function () { finish(1); });
};

// A double click on a row of the layers: a field over its name.
BasicDesigner.renameInLayers = function (obj) {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const row = ui.tree.getRowElem(String(obj.__bd.id));
    if (!row) return;
    const text = row.querySelector("[data-part=text]") || row;
    const rowRect = row.getBoundingClientRect();
    const textRect = text.getBoundingClientRect();
    if (ui.layerNameInput) ui.layerNameInput.remove();
    const input = createIn(page, function () {
        return Input({
            left: Math.round(textRect.left) - 4,
            top: Math.round(rowRect.top) + 2,
            width: Math.round(rowRect.right - textRect.left) - 4,
            height: Math.round(rowRect.height) - 4,
            fontSize: 13,
            color: C.field,
            textColor: C.text,
            border: 1,
            borderColor: C.accent,
            round: 4,
        });
    });
    input.zIndex = 9000;
    input.inputElement.style.padding = "0px 3px";
    input.inputElement.setAttribute("aria-label", "Name of the object");
    input.text = BasicDesigner.nameOf(obj);
    ui.layerNameInput = input;
    const close = function () {
        if (ui.layerNameInput !== input) return;
        ui.layerNameInput = null;
        input.remove();
        ui.tree.focus();
    };
    BasicDesigner.connectNameInput(input, function () { return obj; }, close);
    input.inputElement.focus();
    input.inputElement.select();
};

BasicDesigner.nameItem = function (obj) {
    return {
        key: "__name",
        type: "text",
        label: "Name",
        value: BasicDesigner.nameOf(obj),
        placeholder: "No name in the code",
        hint: "The name of the object in the code. Empty: back to its own name.",
        span: "full",
    };
};

BasicDesigner.title = function (obj) {
    const name = BasicDesigner.nameOf(obj);
    const type = BasicDesigner.typeOf(obj);
    const text = BasicDesigner.previewText(obj);
    return { name: name, type: type, text: text, short: name || (text ? '"' + text + '"' : type) };
};

// The line that makes an object: a component is made by the line that uses it (its root box line, inside the
// component file, makes every component of that kind on the page).
BasicDesigner.lineFrame = function (obj) {
    return (obj.__bd.component) ? BasicDesigner.nameFrame(obj) : obj.__bd.frames[0];
};

// The alive objects created by the same line as obj (a loop, a helper, the inside of a component).
BasicDesigner.sameLineObjects = function (obj) {
    const f = BasicDesigner.lineFrame(obj);
    if (!f) return [obj];
    const isComponent = !!obj.__bd.component;
    return BasicDesigner.state.rt.getAlive().filter(function (o) {
        if (!!o.__bd.component !== isComponent) return false;
        const g = BasicDesigner.lineFrame(o);
        return g && g.url === f.url && g.line === f.line;
    });
};

// How many alive objects were created by the same line (a loop, a helper function).
BasicDesigner.sameLineCount = function (obj) {
    return BasicDesigner.sameLineObjects(obj).length;
};

// The component an object is inside of (the nearest root box of a component), or null.
BasicDesigner.componentOf = function (obj) {
    let el = obj.elem.parentElement;
    while (el) {
        const o = el._basicObject;
        if (o && o.__bd && o.__bd.component) return o;
        el = el.parentElement;
    }
    return null;
};

BasicDesigner.openInEditor = function (frame) {
    if (!frame) return;
    const rel = BasicDesigner.relPath(frame.url);
    if (/^[a-z]+:/i.test(rel)) return; // Not a file of the repository
    if (BasicDesigner.postToHost("openFile", { path: rel, line: frame.line, col: frame.col })) return;
    if (!BasicDesigner.settings.rootPath) {
        BasicDesigner.setStatus("Write the folder of the repository in the settings: Repository on disk.", "error");
        return;
    }
    const a = document.createElement("a");
    a.href = "vscode://file" + encodeURI(BasicDesigner.settings.rootPath + rel) + ":" + frame.line + ":" + frame.col;
    a.click();
};

BasicDesigner.copyText = function (text) {
    if (!navigator.clipboard || !window.isSecureContext) return BasicDesigner.copyTextOldWay(text);
    // WHY: In VS Code the designer is in an iframe, where the Clipboard API may be refused
    //      ("Document is not focused", no clipboard-write permission): then the old way is tried.
    return navigator.clipboard.writeText(text).catch(function () {
        return BasicDesigner.copyTextOldWay(text);
    });
};

// execCommand("copy") from a hidden textarea. Rejects when the browser did not copy.
BasicDesigner.copyTextOldWay = function (text) {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    const isCopied = document.execCommand("copy");
    area.remove();
    if (!isCopied) return Promise.reject(new Error("the browser did not allow it"));
    return Promise.resolve();
};

BasicDesigner.toolButton = function (text, onClick, props = {}) {
    const C = BasicDesigner.colors;
    const btn = Label({
        text: text,
        height: 28,
        width: props.width || "auto",
        fontSize: 12,
        textColor: C.text,
        color: props.color || "transparent",
        round: 5,
    });
    btn.elem.style.padding = "0px 10px";
    btn.elem.style.display = "flex";
    btn.elem.style.alignItems = "center";
    btn.elem.style.justifyContent = "center";
    btn.elem.style.whiteSpace = "nowrap";
    btn.elem.style.flexShrink = "0";
    btn.clickable = 1;
    btn.elem.style.cursor = "pointer";
    btn._baseColor = props.color || "transparent";
    // WHY: A colored button (Ex: the accent one) gets a lighter color on hover, not the gray of the plain ones.
    const hoverColor = props.hoverColor || C.hover;
    btn.on("mouseenter", function () { if (!btn._active) btn.color = hoverColor; });
    btn.on("mouseleave", function () { if (!btn._active) btn.color = btn._baseColor; });
    btn.on("click", function () { onClick(btn); });
    btn.setActive = function (active) {
        btn._active = active;
        btn.color = active ? C.selectedRow : btn._baseColor;
        btn.textColor = active ? C.accentLight : C.text;
    };
    return btn;
};

// *** LOAD A PAGE:

BasicDesigner.load = async function (pagePath) {

    const s = BasicDesigner.state;
    pagePath = String(pagePath || "").trim().replace(/^\/+/, "");
    s.canSave = false; // WHY: The clearing below must not delete the saved session of the page.
    if (BasicDesigner.ui.sessionBar) BasicDesigner.hideSessionBar();
    if (BasicDesigner.ui.componentMenu) BasicDesigner.closeComponentMenu();
    if (BasicDesigner.ui.pageMenu) BasicDesigner.closePageMenu();
    s.pagePath = pagePath;
    s.pageUrl = new URL(pagePath, s.rootUrl).href;
    s.selected = null;
    s.hovered = null;
    s.changes.clear();
    s.notes.clear();
    s.names.clear();
    s.pageChanges.clear();
    s.scriptChanges.clear();
    s.projectNote = "";
    s.isPageSelected = false;
    s.paramOriginal.clear();
    s.defaultProps = {};
    BasicDesigner.closeParamEditors();
    if (BasicDesigner.ui.tableWindow) BasicDesigner.ui.tableWindow.close();
    BasicDesigner.clearParamFilter();
    BasicDesigner.paramNotes = {};
    BasicDesigner.paramsObject = null;
    s.expanded.clear();
    s.isTreeOpened = false;
    s.placeLog = [];
    s.addedObjects = [];
    s.history = [];
    s.redoList = [];
    s.filter = "";
    s.hiddenObjects = new Map();
    if (BasicDesigner.ui.inpFilter) BasicDesigner.ui.inpFilter.inputElement.value = "";
    s.sources = {};
    BasicDesigner.setStatus("Loading " + pagePath + " …", "wait");
    BasicDesigner.refreshChanges();
    BasicDesigner.showProperties(null);

    const url = new URL(location.href);
    url.searchParams.set("page", pagePath);
    history.replaceState(null, "", url.href);
    BasicDesigner.ui.inpPage.text = pagePath;

    let html = "";
    try {
        html = await BasicDesigner.fetchText(s.pageUrl);
        // A design page that points to another page: <meta name="basic-designer-page" content="path?query">
        // (Ex: a short page -> the game with ?spanel=1&menu=0). The path is relative to that file.
        const m = html.match(/<meta\s+name=["']basic-designer-page["']\s+content=["']([^"']+)["']/i);
        if (m) {
            s.pageUrl = new URL(m[1], s.pageUrl).href;
            s.pagePath = decodeURI(s.pageUrl.split("?")[0].slice(s.rootUrl.length));
            html = await BasicDesigner.fetchText(s.pageUrl);
        }
    } catch (error) {
        const isMissing = BasicDesigner.isMissingError(error);
        if (isMissing) BasicDesigner.forgetPage(pagePath); // (it leaves the recent pages)
        const hint = (isMissing) ? "the file is not there (moved or deleted); it left the recent pages" : "open the designer from a web server, Ex: Live Server";
        BasicDesigner.setStatus("Could not load " + pagePath + ": " + error.message + " (" + hint + ")", "error");
        return;
    }

    // WHY: Everything on the same line, so the line numbers of the page code stay the same.
    const baseUrl = s.pageUrl.split("?")[0];
    html = html.replace(/<!-- Code injected by live-server -->[\s\S]*?<\/script>/, "");
    html = html.replace(/<head[^>]*>/i, function (m) { return m + '<base href="' + baseUrl + '">'; });
    html = await BasicDesigner.useSourceFiles(html, baseUrl); // .min.js -> .js (real line numbers), when the .js is there
    const runtimeUrl = new URL("runtime.js", location.href).href;
    let hasBasic = false;
    html = html.replace(/(<script[^>]*src=["'][^"']*basic\/basic\.js["'][^>]*>\s*<\/script>)/, function (m) {
        hasBasic = true;
        return m + '<script src="' + runtimeUrl + '"></script>';
    });
    if (!hasBasic) {
        BasicDesigner.setStatus("basic/basic.js was not found in " + s.pagePath, "error");
        return;
    }

    const iframe = BasicDesigner.ui.iframe;
    const query = new URL(s.pageUrl).search;
    iframe.onload = function () {
        // WHY: host.htm loads first (no runtime), then the page written over it loads.
        if (!iframe.contentWindow || !iframe.contentWindow.__basicDesigner) return;
        // WHY: start() runs on the load of the page; give its first frames (fonts, ResizeObserver) a moment.
        setTimeout(BasicDesigner.onPageReady, 150);
    };

    if (query) {
        // HOST: the page reads its address (location.search). See host.htm.
        s.hostUrl = new URL("host.htm", location.href).href;
        s.pendingHtml = html;
        s.sources[s.hostUrl] = html.split("\n");
        iframe.removeAttribute("srcdoc");
        iframe.src = s.hostUrl + query;
    } else {
        s.hostUrl = "";
        s.pendingHtml = "";
        s.sources["about:srcdoc"] = html.split("\n");
        iframe.srcdoc = html;
    }

};

BasicDesigner.fetchText = async function (url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(response.status + " " + response.statusText);
    return response.text();
};

// src="x.min.js" -> src="x.js" when x.js exists (on the same line).
BasicDesigner.useSourceFiles = async function (html, baseUrl) {
    const found = {};
    html.replace(/src=["']([^"']*?)\.min\.js["']/g, function (m, name) { found[name] = 1; return m; });
    const ok = {};
    await Promise.all(Object.keys(found).map(async function (name) {
        try {
            const r = await fetch(new URL(name + ".js", baseUrl).href, { method: "HEAD", cache: "no-store" });
            ok[name] = r.ok;
        } catch (error) { ok[name] = false; }
    }));
    return html.replace(/(src=["'])([^"']*?)\.min\.js(["'])/g, function (m, a, name, b) {
        return ok[name] ? a + name + ".js" + b : m;
    });
};

BasicDesigner.onPageReady = async function () {

    const s = BasicDesigner.state;
    s.win = BasicDesigner.ui.iframe.contentWindow;
    s.rt = s.win && s.win.__basicDesigner;

    if (!s.rt) {
        BasicDesigner.setStatus("The runtime did not start in the page (see the console of the page).", "error");
        return;
    }

    // Keys of the iframe -> designer
    // WHY: On the window, in the capture phase: the keys reach the designer first, even when a component of the
    //      page stops them (stopPropagation) on its way down (Ex: a panel that closes with Escape).
    s.win.addEventListener("keydown", BasicDesigner.onKey, true);
    s.win.addEventListener("keydown", BasicDesigner.onAltKey, true);
    s.win.addEventListener("keyup", BasicDesigner.onAltKey, true);
    s.win.addEventListener("contextmenu", BasicDesigner.stopBrowserMenu, true);
    s.win.document.addEventListener("copy", BasicDesigner.onCopyEvent);
    s.win.document.addEventListener("paste", BasicDesigner.onPasteEvent);

    await BasicDesigner.loadSources();
    BasicDesigner.buildTree();
    BasicDesigner.markEmptyBoxes();
    const session = BasicDesigner.loadSession();
    s.canSave = true;
    BasicDesigner.pushHistory(BasicDesigner.buildSession()); // UNDO: the page as it loaded
    BasicDesigner.rememberPage(s.pagePath);
    BasicDesigner.refreshTopBar();
    BasicDesigner.refreshCanvasSize();
    const isThemeReload = BasicDesigner.takeThemeReload();
    if (session && isThemeReload) {
        BasicDesigner.pendingSession = session;
        BasicDesigner.onSessionApply();
    } else if (session) {
        BasicDesigner.showSessionBar(session);
    }
    if (isThemeReload) BasicDesigner.openSettingsDialog("appearance");
    const messageAfterLoad = BasicDesigner.messageAfterLoad;
    BasicDesigner.messageAfterLoad = "";
    if (messageAfterLoad) BasicDesigner.setStatus(messageAfterLoad);
    else if (s.selected) BasicDesigner.showSelectionInfo();
    else BasicDesigner.setStatus(s.rt.getAlive().length + " objects in " + s.pagePath + ". Click an object (Select mode) or use the layers.");

};

// The files where the objects were created (the names and the lines come from them).
BasicDesigner.loadSources = async function () {
    const s = BasicDesigner.state;
    const urls = new Set();
    s.rt.objects.forEach(function (obj) {
        obj.__bd.frames.slice(0, 3).forEach(function (f) {
            const u = f.url.split("?")[0];
            if (!s.sources[u]) urls.add(u);
        });
    });
    await Promise.all(Array.from(urls).map(async function (u) {
        try {
            const r = await fetch(u, { cache: "no-store" });
            s.sources[u] = r.ok ? (await r.text()).split("\n") : [];
        } catch (error) {
            s.sources[u] = [];
        }
    }));
};

// *** LAYERS:

BasicDesigner.buildTree = function () {

    const s = BasicDesigner.state;
    if (!s.win) return;

    const walk = function (elem, list, depth) {
        for (let i = 0; i < elem.children.length; i++) {
            const child = elem.children[i];
            const obj = child._basicObject;
            if (obj && obj.__bd && !obj._isRemoved) {
                const node = { obj: obj, children: [], depth: depth };
                obj.__bd.depth = depth;
                list.push(node);
                walk(child, node.children, depth + 1);
            } else {
                walk(child, list, depth);
            }
        }
    };

    s.tree = [];
    walk(s.win.document.body, s.tree, 0);

    // Open the plain boxes and groups, close the components (their insides are long). Only once for a page.
    // WHY: Not "when nothing is open": after "collapse all" every refresh opened everything again.
    if (!s.isTreeOpened) {
        s.isTreeOpened = true;
        const open = function (nodes) {
            nodes.forEach(function (node) {
                if (!node.obj.__bd.component) {
                    s.expanded.add(node.obj.__bd.id);
                    open(node.children);
                }
            });
        };
        open(s.tree);
    }

    BasicDesigner.renderTree();

};

// LAYER ICONS: small 16x16 line drawings. A Box is an empty square, a group a square with an arrow of its direction, the other basic.js
// objects are gray pictures of what they are, a component is a purple cube.
BasicDesigner.layerIconColors = {
    box: "#E5B567",
    group: "#5FB3D9",
    object: "#C8C8C8",
    component: BasicDesigner.colors.component,
};

BasicDesigner.layerIconPaths = {
    square: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/>',
    vgroup: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M8 5v6M5.9 8.9L8 11l2.1-2.1"/>',
    hgroup: '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/><path d="M5 8h6M8.9 5.9L11 8l-2.1 2.1"/>',
    label: '<path d="M3.5 4h9M8 4v8.5M6 12.5h4"/>',
    button: '<rect x="1.5" y="4.5" width="13" height="7" rx="3.5"/><path d="M5.5 8h5"/>',
    input: '<rect x="1.5" y="4" width="13" height="8" rx="1.5"/><path d="M5 6v4M4 6h2M4 10h2"/>',
    icon: '<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><circle cx="6" cy="6.5" r="1.3"/><path d="M2.5 12l3.5-3.5 2.5 2.5 2-2 3 3"/>',
    cube: '<path d="M8 1.8l5.6 3.1v6.2L8 14.2l-5.6-3.1V4.9z"/><path d="M2.4 4.9L8 8l5.6-3.1M8 8v6.2"/>',
};

// The picture and the color of a layer, from its type: "Box", "VGroup", "Label"... or a component name.
BasicDesigner.layerIconOf = function (type) {
    const colors = BasicDesigner.layerIconColors;
    const paths = BasicDesigner.layerIconPaths;
    switch (type) {
        case "Box": return { path: paths.square, color: colors.box };
        case "VGroup": return { path: paths.vgroup, color: colors.group };
        case "HGroup": return { path: paths.hgroup, color: colors.group };
        case "Label": return { path: paths.label, color: colors.object };
        case "Button": return { path: paths.button, color: colors.object };
        case "Input": return { path: paths.input, color: colors.object };
        case "Icon": return { path: paths.icon, color: colors.object };
    }
    return { path: paths.cube, color: colors.component };
};

// WHY: One data URI per type, made once: the layers can have hundreds of rows.
BasicDesigner.layerIconCache = {};

BasicDesigner.layerIconFile = function (type) {
    const cache = BasicDesigner.layerIconCache;
    if (cache[type]) return cache[type];
    const icon = BasicDesigner.layerIconOf(type);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"' +
        ' stroke="' + icon.color + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">' + icon.path + '</svg>';
    cache[type] = "data:image/svg+xml," + encodeURIComponent(svg);
    return cache[type];
};

// One object -> a NODE of TreeView (comp/tree-view.js). The key is the id of the object.
BasicDesigner.treeNodeOf = function (obj) {
    const s = BasicDesigner.state;
    const C = BasicDesigner.colors;
    const t = BasicDesigner.title(obj);
    const isComponent = !!obj.__bd.component;
    let note = t.text ? '"' + t.text + '"' : "";
    if (s.notes.has(obj.__bd.id)) note = "✎ " + note;
    const mark = BasicDesigner.changeMarkOf(obj);
    if (mark) note = mark + " " + note;
    return {
        key: String(obj.__bd.id),
        text: t.name || t.type,
        iconFile: BasicDesigner.layerIconFile(t.type),
        textColor: BasicDesigner.isHidden(obj) ? C.dim : ((!t.name && isComponent) ? C.component : undefined),
        tag: t.name ? t.type : "",
        tagColor: isComponent ? C.component : undefined,
        note: note,
    };
};

// The mark of a row: "+" added in the designer, "●" changed (a value, a place, a param), "" nothing.
BasicDesigner.changeMarkOf = function (obj) {
    if (obj.__bd.added) return "+";
    const marked = BasicDesigner.state.markedObjects;
    return (marked && marked.has(obj)) ? "●" : "";
};

// After a change: the rows whose mark is new or gone are drawn again (only those rows).
BasicDesigner.refreshMarks = function () {
    const s = BasicDesigner.state;
    if (!s.rt || !BasicDesigner.ui.tree) return;
    const before = s.markedObjects || new Set();
    const now = new Set(BasicDesigner.changedObjects().filter(function (obj) { return !obj.__bd.added; }));
    s.markedObjects = now;
    now.forEach(function (obj) { if (!before.has(obj)) BasicDesigner.refreshTreeRow(obj); });
    before.forEach(function (obj) { if (!now.has(obj) && obj.elem.isConnected) BasicDesigner.refreshTreeRow(obj); });
};

// The layers again from s.tree (after a load, Select mode, Revert all). With a search: the rows that match
// and the rows above them (open, so the matches can be seen).
BasicDesigner.renderTree = function () {
    const s = BasicDesigner.state;
    const filter = s.filter.trim().toLowerCase();
    const matches = function (obj) {
        const t = BasicDesigner.title(obj);
        return [t.name, t.type, t.text].some(function (part) { return String(part || "").toLowerCase().indexOf(filter) !== -1; });
    };
    // isAll: every child (the inside of a component, or no search).
    const toNode = function (node, isAll) {
        const isComponent = !!node.obj.__bd.component;
        // WHY: The inside of a component is its own code (item.badgeDot...): a search finds the component, not its parts.
        const childrenAll = isAll || isComponent || !filter;
        const children = node.children.map(function (child) { return toNode(child, childrenAll); }).filter(Boolean);
        const hasMatch = isAll || !filter || matches(node.obj) || (!isComponent && children.length > 0);
        if (!hasMatch) return null;
        const out = BasicDesigner.treeNodeOf(node.obj);
        if (children.length) {
            out.children = children;
            const isOpenForSearch = filter && !isAll && !isComponent;
            out.expanded = (isOpenForSearch || s.expanded.has(node.obj.__bd.id)) ? 1 : 0;
        }
        return out;
    };
    s.markedObjects = new Set(BasicDesigner.changedObjects().filter(function (obj) { return !obj.__bd.added; }));
    const roots = s.tree.map(function (node) { return toNode(node, false); }).filter(Boolean);
    BasicDesigner.ui.tree.setItems(roots, s.selected ? String(s.selected.__bd.id) : null);
    BasicDesigner.refreshLayerCount();
};

// Every plain box and group open (not the components: their insides are long), or every node closed.
BasicDesigner.expandAll = function () {
    const s = BasicDesigner.state;
    const open = function (nodes) {
        nodes.forEach(function (node) {
            if (node.obj.__bd.component) return;
            s.expanded.add(node.obj.__bd.id);
            open(node.children);
        });
    };
    open(s.tree);
    BasicDesigner.renderTree();
};

BasicDesigner.collapseAll = function () {
    BasicDesigner.state.expanded.clear();
    BasicDesigner.renderTree();
};

BasicDesigner.refreshLayerCount = function () {
    const ui = BasicDesigner.ui;
    if (!ui.lblLayerCount) return;
    let count = 0;
    const add = function (nodes) {
        nodes.forEach(function (node) {
            count++;
            add(node.children);
        });
    };
    add(BasicDesigner.state.tree || []);
    ui.lblLayerCount.text = String(count);
};

BasicDesigner.setFilter = function (text) {
    BasicDesigner.state.filter = String(text || "");
    BasicDesigner.renderTree();
};

// *** EYE: hides an object on the canvas for a while (only in the designer: not a change, not in the prompt).

BasicDesigner.EYE_HIDE_WAIT = 150; // ms: the mouse can go from the row to the eye

BasicDesigner.isHidden = function (obj) {
    return BasicDesigner.state.hiddenObjects.has(obj);
};

BasicDesigner.toggleHidden = function (obj) {
    const hidden = BasicDesigner.state.hiddenObjects;
    if (hidden.has(obj)) {
        obj.elem.style.visibility = hidden.get(obj);
        hidden.delete(obj);
    } else {
        hidden.set(obj, obj.elem.style.visibility);
        obj.elem.style.visibility = "hidden";
    }
    BasicDesigner.refreshTreeRow(obj);
};

BasicDesigner.rowElementOf = function (key) {
    const rows = BasicDesigner.ui.tree.elem.querySelectorAll("[id]");
    for (let i = 0; i < rows.length; i++) {
        if (rows[i]._treeRec && rows[i]._treeRec.node.key === key) return rows[i];
    }
    return null;
};

BasicDesigner.buildEyeButton = function () {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    createIn(page, function () {
        // LABEL: Eye (at the right of the row under the mouse)
        ui.eyeButton = Label({ text: "", width: 22, height: 22, round: 4, color: C.bar, textColor: C.soft, lineHeight: "0", visible: 0 });
        ui.eyeButton.css = { display: "flex", alignItems: "center", justifyContent: "center" };
        ui.eyeButton.clickable = 1;
        ui.eyeButton.cursor = "pointer";
        ui.eyeButton.zIndex = 8500;
        ui.eyeButton.role = "button";
        ui.eyeButton.visible = 0;
    });
    ui.eyeButton.onHoverChange(function (self, isOver) {
        ui.eyeButton.isOver = isOver;
        ui.eyeButton.textColor = (isOver) ? C.text : C.soft;
        if (!isOver) BasicDesigner.hideEyeSoon();
    });
    // WHY: The eye is over a row: when the rows move under it (a scroll), it would point to another one.
    ui.tree.elem.addEventListener("scroll", BasicDesigner.hideEye, true);
    ui.eyeButton.on("click", function () {
        const obj = BasicDesigner.objectOfKey(ui.eyeButton.key);
        if (!obj) return;
        BasicDesigner.toggleHidden(obj);
        BasicDesigner.paintEye(obj);
    });
};

BasicDesigner.paintEye = function (obj) {
    const ui = BasicDesigner.ui;
    const isHidden = BasicDesigner.isHidden(obj);
    const path = (isHidden) ? PropertyPanel.icons.eyeOff : PropertyPanel.icons.eye;
    ui.eyeButton.text = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
    ui.eyeButton.aria = { label: (isHidden) ? "Show it" : "Hide it for a while" };
    ui.eyeButton.elem.title = (isHidden) ? "Show it" : "Hide it for a while (only here, not a change)";
};

BasicDesigner.showEye = function (node) {
    const ui = BasicDesigner.ui;
    if (ui.eyeTimer) clearTimeout(ui.eyeTimer);
    // WHY: While a row is dragged the eye would come back on every row under the mouse (and over the small trash).
    if (BasicDesigner.drag && BasicDesigner.drag.isStarted) {
        BasicDesigner.hideEye();
        return;
    }
    const row = node && BasicDesigner.rowElementOf(node.key);
    const obj = node && BasicDesigner.objectOfKey(node.key);
    if (!row || !obj) {
        BasicDesigner.hideEyeSoon();
        return;
    }
    const r = row.getBoundingClientRect();
    const treeRect = ui.tree.elem.getBoundingClientRect();
    ui.eyeButton.key = node.key;
    ui.eyeButton.left = treeRect.right - 30;
    ui.eyeButton.top = r.top + (r.height - 22) / 2;
    BasicDesigner.paintEye(obj);
    ui.eyeButton.visible = 1;
};

BasicDesigner.hideEye = function () {
    const ui = BasicDesigner.ui;
    if (ui.eyeTimer) clearTimeout(ui.eyeTimer);
    if (ui.eyeButton) ui.eyeButton.visible = 0;
};

BasicDesigner.hideEyeSoon = function () {
    const ui = BasicDesigner.ui;
    if (ui.eyeTimer) clearTimeout(ui.eyeTimer);
    ui.eyeTimer = setTimeout(function () {
        if (!ui.eyeButton.isOver) ui.eyeButton.visible = 0;
    }, BasicDesigner.EYE_HIDE_WAIT);
};

// One row again (a note, a new type). TreeView paints only that row.
BasicDesigner.refreshTreeRow = function (obj) {
    if (!obj) return;
    const n = BasicDesigner.treeNodeOf(obj);
    BasicDesigner.ui.tree.updateNode(n.key, n);
};

BasicDesigner.objectOfKey = function (key) {
    const rt = BasicDesigner.state.rt;
    if (!rt) return null;
    const id = Number(key);
    // WHY: A component made again by the designer keeps its id: the newest (alive) one is taken.
    for (let i = rt.objects.length - 1; i >= 0; i--) {
        if (rt.objects[i].__bd.id === id) return rt.objects[i];
    }
    return null;
};

// *** SELECTION ON THE CANVAS:

BasicDesigner.isShown = function (obj, x, y) {
    const el = obj.elem;
    if (!el || !el.isConnected) return false;
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    if (x === undefined) return true;
    if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
    // WHY: An object scrolled out of its box is still there; the box clips it.
    let p = el.parentElement;
    const win = BasicDesigner.state.win;
    while (p && p !== win.document.body) {
        const cs = win.getComputedStyle(p);
        if (cs.overflow !== "visible") {
            const pr = p.getBoundingClientRect();
            if (x < pr.left || x > pr.right || y < pr.top || y > pr.bottom) return false;
        }
        p = p.parentElement;
    }
    return true;
};

// The top object under the point (x, y in the iframe), in the order the browser draws them.
// WHY: basic.css gives every box pointer-events: none, so elementsFromPoint() would skip them: for one call
//      a style turns it on. The deepest object was used before: a panel over a map picked the map.
// The elements of the page under a point, also the ones that do not take the mouse (pointer-events: none).
BasicDesigner.elementsAt = function (x, y) {
    const doc = BasicDesigner.state.win.document;
    if (!BasicDesigner._peStyle || BasicDesigner._peStyle.ownerDocument !== doc) {
        BasicDesigner._peStyle = doc.createElement("style");
        BasicDesigner._peStyle.textContent = "* { pointer-events: auto !important; }";
    }
    (doc.head || doc.documentElement).appendChild(BasicDesigner._peStyle);
    try {
        return doc.elementsFromPoint(x, y);
    } finally {
        BasicDesigner._peStyle.remove();
    }
};

BasicDesigner.hitTest = function (x, y) {
    const s = BasicDesigner.state;
    if (!s.rt || !s.win) return null;
    const list = BasicDesigner.elementsAt(x, y);
    let emptyBox = null; // the first empty box (it paints nothing) at the point
    // An empty box wins over what is under it only when that is its own container (a card, the page): a click on the
    // free room of a transparent group selects the group. Something else under it (a map under a layer) is what the
    // eye sees: that one is selected, as before.
    const pick = function (obj) {
        if (emptyBox && obj.elem.contains(emptyBox.elem)) return emptyBox;
        return obj;
    };
    for (let i = 0; i < list.length; i++) {
        const el = list[i];
        let p = el;
        while (p && !(p._basicObject && p._basicObject.__bd && !p._basicObject._isRemoved)) p = p.parentElement;
        if (!p) continue;
        const obj = p._basicObject;
        // A raw element in a Box (a canvas, an effect layer) is not that box: look under it.
        // The inside of a Label / Button / Input / Icon is that object.
        if (obj._type !== "box") return pick(obj);
        if (el !== obj.elem) continue;
        if (BasicDesigner.paints(el)) return pick(obj);
        // A Box that paints nothing (transparent, no border, no shadow, no picture) is a layer or a holder
        if (!emptyBox && BasicDesigner.isEmptyBox(obj)) emptyBox = obj;
    }
    return emptyBox; // WHY: nothing painted under it: it is on the page
};

// A box or a group of the page that paints nothing (not a part of a component, not the page)
BasicDesigner.isEmptyBox = function (obj) {
    const s = BasicDesigner.state;
    if (!obj || obj._type !== "box" || obj === s.win.page || !obj.__bd) return false;
    if (BasicDesigner.componentOf(obj)) return false;
    return !BasicDesigner.paints(obj.elem);
};

// THE EDGES OF THE EMPTY BOXES: a thin dashed line on the boxes and the groups that paint nothing, so they are seen
// (and found) on the canvas; it goes when the box gets a color, a border or a shadow. (Settings > General)
BasicDesigner.EMPTY_BOX_CLASS = "bd-empty-box";
BasicDesigner.EMPTY_BOX_EDGE = "1px dashed rgba(128, 128, 128, 0.55)";

BasicDesigner.markEmptyBoxes = function () {
    const s = BasicDesigner.state;
    if (!s.rt || !s.win || !s.win.document) return;
    const doc = s.win.document;
    if (!doc.getElementById("bd-empty-box-css")) {
        // WHY outline: it does not change the size or the place of anything (a border would)
        const style = doc.createElement("style");
        style.id = "bd-empty-box-css";
        style.textContent = "." + BasicDesigner.EMPTY_BOX_CLASS + " { outline: " + BasicDesigner.EMPTY_BOX_EDGE + " !important; outline-offset: -1px; }";
        (doc.head || doc.documentElement).appendChild(style);
    }
    const isOn = BasicDesigner.settings.emptyBoxEdges !== false;
    s.rt.objects.forEach(function (obj) {
        if (!obj.elem || obj._isRemoved) return;
        obj.elem.classList.toggle(BasicDesigner.EMPTY_BOX_CLASS, isOn && obj.elem.isConnected && BasicDesigner.isEmptyBox(obj));
    });
};

BasicDesigner.paints = function (el) {
    const cs = BasicDesigner.state.win.getComputedStyle(el);
    const bg = cs.backgroundColor;
    const clear = (bg === "transparent" || /rgba\([^)]*,\s*0\)$/.test(bg));
    return !clear || cs.backgroundImage !== "none" || cs.boxShadow !== "none" ||
        parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0 ||
        parseFloat(cs.borderRightWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0;
};

BasicDesigner.depthOf = function (obj) {
    let d = 0;
    let el = obj.elem.parentElement;
    while (el) { if (el._basicObject) d++; el = el.parentElement; }
    return d;
};

// The layers and the source files again: the page made new objects after it loaded (Ex: a panel of a game).
BasicDesigner.refreshLayers = async function () {
    await BasicDesigner.loadSources();
    BasicDesigner.buildTree();
    BasicDesigner.markEmptyBoxes();
};

BasicDesigner.select = function (obj, from) {
    const s = BasicDesigner.state;
    const isSameObject = (s.selected === obj);
    if (s.isPageSelected) {
        s.isPageSelected = false;
        BasicDesigner.paintPageRow();
    }
    // WHY: An object made after the last reading of the layers is not in the tree yet.
    if (obj && from !== "tree" && !BasicDesigner.ui.tree.getNode(String(obj.__bd.id))) {
        s.selected = obj;
        // WHY: The panel shows it now: it showed the object before, and a change made there went to this one.
        BasicDesigner.showProperties(obj);
        BasicDesigner.refreshLayers().then(function () { if (s.selected === obj) BasicDesigner.select(obj, from); });
        return;
    }
    s.selected = obj;
    // WHY: silent: the tree opens the parents and scrolls to the row, onSelect is not called again.
    if (from !== "tree") BasicDesigner.ui.tree.setValue(obj ? String(obj.__bd.id) : null, 1);
    if (obj && from === "tree") obj.elem.scrollIntoView({ block: "nearest", inline: "nearest" });
    BasicDesigner.showProperties(obj);
    // WHY: An action (add, undo) selects its object, sometimes a moment later (when the layers are read again):
    //      the message of the action is not wiped by it.
    if (!isSameObject) BasicDesigner.showSelectionInfoSoon();
    else if (!BasicDesigner.statusShownAt) BasicDesigner.showSelectionInfo();
    BasicDesigner.startOverlayLoop();
};

BasicDesigner.setHover = function (obj) {
    BasicDesigner.state.hovered = obj;
    BasicDesigner.startOverlayLoop();
};

BasicDesigner.placeRect = function (rectBox, obj) {
    if (!obj || !BasicDesigner.isShown(obj)) { rectBox.visible = 0; return null; }
    const r = obj.elem.getBoundingClientRect();
    rectBox.left = r.left;
    rectBox.top = r.top;
    rectBox.width = r.width;
    rectBox.height = r.height;
    rectBox.visible = 1;
    return r;
};

// WHY: The page moves under the rectangles (scroll, motion, resize): follow it every frame while there is one.
BasicDesigner.startOverlayLoop = function () {
    if (BasicDesigner._loopOn) return;
    BasicDesigner._loopOn = true;
    const step = function () {
        const s = BasicDesigner.state;
        const ui = BasicDesigner.ui;
        ui.hoverRect && BasicDesigner.placeRect(ui.hoverRect, (s.hovered !== s.selected) ? s.hovered : null);
        const r = BasicDesigner.placeRect(ui.selRect, s.selected);
        const isMeasuring = s.isAltDown && s.selected && s.hovered && s.hovered !== s.selected && s.mode === "select";
        if (isMeasuring) BasicDesigner.placeMeasure(s.selected.elem.getBoundingClientRect(), s.hovered.elem.getBoundingClientRect());
        else BasicDesigner.hideMeasure();
        // The handles are on the object that changes size: a part of a component -> the component.
        const sized = s.selected && BasicDesigner.movableOf(s.selected);
        BasicDesigner.placeHandles((r && sized) ? sized.elem.getBoundingClientRect() : null);
        if (r) {
            ui.selTag.text = BasicDesigner.esc(BasicDesigner.title(s.selected).short) + "&nbsp;&nbsp;" + Math.round(r.width) + " × " + Math.round(r.height);
            ui.selTag.left = Math.max(0, r.left);
            ui.selTag.top = (r.top >= 20) ? r.top - 20 : r.bottom + 2;
            ui.selTag.visible = 1;
        } else {
            ui.selTag.visible = 0;
        }
        if (s.hovered || s.selected) requestAnimationFrame(step);
        else BasicDesigner._loopOn = false;
    };
    requestAnimationFrame(step);
};

// *** PROPERTIES:

BasicDesigner.numberOrText = function (key, label, prefix, value, extra = {}) {
    if (typeof value === "number" && !isNaN(value)) {
        return Object.assign({ key: key, type: "number", label: label, prefix: prefix, value: Math.round(value * 100) / 100 }, extra);
    }
    return Object.assign({ key: key, type: "text", label: label, value: (value === undefined || value === null) ? "" : String(value) }, extra);
};

// "8px" -> 8, [14, 10] -> "14, 10" (a text field), undefined -> 0
BasicDesigner.toNumber = function (value) {
    if (Array.isArray(value)) return value.join(", ");
    if (value === undefined || value === null || value === "") return 0;
    const n = parseFloat(value);
    return (String(n) === String(value).replace(/px$/, "").trim()) ? n : value;
};

// The border widths on the screen, as the panel shows a padding: 1 (every side), "0, 1" (x, y) or "0, 0, 0, 1"
// (left, top, right, bottom). WHY the screen: minimal (basic.css) makes the border of a Button / Input 0 while
// obj.border still reads 1 (the panel showed 1, and a change to 1 was "no change": not in the prompt); a list of
// basic.js is drawn there in its order, [x, y, z] as basic.js reads it.
BasicDesigner.borderOf = function (obj) {
    const elem = obj.buttonElement || obj.inputElement || obj._textElem || obj.elem;
    const cs = BasicDesigner.state.win.getComputedStyle(elem);
    const widthOf = function (value) { return Math.round((parseFloat(value) || 0) * 100) / 100; };
    const sides = [cs.borderLeftWidth, cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth].map(widthOf);
    return BasicDesigner.sidesText(sides);
};

// The values that go back as they were written, not as the panel reads them.
// WHY: The panel reads what is on the screen, and writing that back is not the same thing:
//      border: 0 with minimal, an inline 0px hid the border of basic.css when minimal was reverted too.
//      lineHeight: 0 for "not set", an inline 0px made a Label 0 px high and hid its text.
//      padding: "6, 1" for the padding of a Button from the browser, a text its setter can not take.
//      round, gap: a list reads as a text too ("12, 0").
// css: the inline styles that go back, one by one. WHY not a shorthand (borderWidth): it reads "" when only some
//      sides are inline (the tick of a CheckBox has a border at the right and at the bottom), and "" cleared all four.
BasicDesigner.RAW_VALUES = {
    border: {
        field: "_border", css: ["borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"],
        elemOf: function (obj) { return obj.buttonElement || obj.inputElement || obj._textElem || obj.elem; },
    },
    round: {
        field: "_round", css: ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"],
        elemOf: function (obj) { return obj.buttonElement || obj.inputElement || obj._textElem || obj.elem; },
    },
    padding: { field: "_padding", css: ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"], elemOf: function (obj) { return obj.elem; } },
    gap: { field: "_gap", css: ["rowGap", "columnGap"], elemOf: function (obj) { return obj.elem; } },
    lineHeight: { field: "_lineHeight", css: ["lineHeight"], elemOf: function (obj) { return obj._textElem || obj.elem; } },
};

BasicDesigner.rawValueOf = function (obj, key) {
    const raw = BasicDesigner.RAW_VALUES[key];
    const style = raw.elemOf(obj).style;
    return { value: obj[raw.field], inline: raw.css.map(function (name) { return style[name]; }) };
};

BasicDesigner.restoreRawValue = function (obj, key, saved) {
    const raw = BasicDesigner.RAW_VALUES[key];
    const style = raw.elemOf(obj).style;
    obj[raw.field] = saved.value;
    raw.css.forEach(function (name, i) { style[name] = saved.inline[i]; });
};

// The padding of the object: the one given to it, or the one on the screen when none was given
// (a Button has 1 px from the browser: the panel showed 0).
// WHY "if (given)": basic.js reads 0 for a padding that was not given, so 0 must fall through to the screen.
BasicDesigner.paddingOf = function (obj, cs) {
    const given = obj.padding;
    const sidesGiven = BasicDesigner.sidesOf(given);
    if (sidesGiven) return BasicDesigner.sidesText(sidesGiven);
    if (given && !Array.isArray(given)) return BasicDesigner.toNumber(given);
    const onScreen = [cs.paddingLeft, cs.paddingTop, cs.paddingRight, cs.paddingBottom];
    return BasicDesigner.sidesText(onScreen.map(function (v) { return Math.round(parseFloat(v) || 0); }));
};

// A padding (or border) array of basic.js -> [left, top, right, bottom], or null (not an array basic.js reads).
// WHY [x, y, z] -> [x, y, x, y]: basic.js reads three values as two (the third is lost): the panel shows the screen.
BasicDesigner.sidesOf = function (value) {
    if (!Array.isArray(value)) return null;
    const [first, second] = value;
    if (value.length === 1) return [first, first, first, first];
    if (value.length === 2 || value.length === 3) return [first, second, first, second];
    if (value.length === 4) return value.slice();
    return null;
};

// [left, top, right, bottom] as the panel shows it, the shortest text basic.js reads the same:
// 14 (every side), "14, 10" (x, y), "14, 10, 6, 2" (four different sides).
BasicDesigner.sidesText = function (sides) {
    const [left, top, right, bottom] = sides;
    const isSymmetric = (left === right && top === bottom);
    if (isSymmetric && left === top) return left;
    if (isSymmetric) return left + ", " + top;
    return sides.join(", ");
};

// The round of the object as the panel shows it: 8, or a list of its corners ("12, 0": the top ones, the bottom ones).
BasicDesigner.roundOf = function (obj) {
    const corners = BasicDesigner.cornersOf(obj.round);
    if (corners) return BasicDesigner.cornersText(corners);
    return BasicDesigner.toNumber(obj.round);
};

// A round array of basic.js -> [topLeft, topRight, bottomRight, bottomLeft], or null (not an array basic.js reads).
// WHY [x, y, z] -> [x, x, y, y]: basic.js reads three values as two ([top, bottom]).
BasicDesigner.cornersOf = function (value) {
    if (!Array.isArray(value)) return null;
    const [first, second] = value;
    if (value.length === 1) return [first, first, first, first];
    if (value.length === 2 || value.length === 3) return [first, first, second, second];
    if (value.length === 4) return value.slice();
    return null;
};

// [topLeft, topRight, bottomRight, bottomLeft] as the panel shows it, the shortest text basic.js reads the same:
// 8 (every corner), "12, 0" (top, bottom), "12, 12, 0, 12" (four different corners).
BasicDesigner.cornersText = function (corners) {
    const [topLeft, topRight, bottomRight, bottomLeft] = corners;
    const isTopAndBottom = (topLeft === topRight && bottomRight === bottomLeft);
    if (isTopAndBottom && topLeft === bottomRight) return topLeft;
    if (isTopAndBottom) return topLeft + ", " + bottomRight;
    return corners.join(", ");
};

// The gap of a group as the panel shows it: 8, or "12, 8" (x: between the items of a line, y: between the lines).
// basic.js reads a number gap as its text ("8px") and an array as it was given.
BasicDesigner.gapOf = function (obj) {
    const gap = obj.gap;
    const isList = Array.isArray(gap) && gap.length >= 1 && gap.length <= 3;
    if (!isList) return BasicDesigner.toNumber(gap);
    const x = gap[0];
    const y = (gap.length === 1) ? x : gap[1];
    return (x === y) ? x : x + ", " + y;
};

// The turn of the object: the one given to it, or the one on the screen (a part of a component turned with a style,
// Ex: the tick of a CheckBox: the panel showed 0).
BasicDesigner.rotateOf = function (obj, cs) {
    if (obj.rotate) return obj.rotate;
    const matrix = cs.transform.match(/^matrix\(([^)]+)\)$/);
    if (!matrix) return 0;
    const parts = matrix[1].split(",").map(Number);
    return Math.round(Math.atan2(parts[1], parts[0]) * 180 / Math.PI);
};

// The value of left / right / top / bottom as it is written on the object: a number, a text ("50%"), or "" (not set).
BasicDesigner.sideValue = function (obj, side) {
    const text = obj.elem.style[side];
    if (text === "") return "";
    return BasicDesigner.toNumber(text);
};

// The side a manual position is measured from: "right" when only right is set, else "left". (top / bottom the same)
BasicDesigner.anchorOf = function (obj, first, second) {
    const style = obj.elem.style;
    return (style[second] !== "" && style[first] === "") ? second : first;
};

// The distance of obj from a side of its container, as it is on the screen now (so a switch does not move it).
BasicDesigner.distanceFrom = function (obj, side) {
    const elem = obj.elem;
    const parent = elem.offsetParent || elem.parentElement;
    if (side === "left") return elem.offsetLeft;
    if (side === "top") return elem.offsetTop;
    if (side === "right") return parent.clientWidth - elem.offsetLeft - elem.offsetWidth;
    return parent.clientHeight - elem.offsetTop - elem.offsetHeight;
};

BasicDesigner.readProps = function (obj) {
    const cs = BasicDesigner.state.win.getComputedStyle(obj.elem);
    const r = obj.elem.getBoundingClientRect();
    const isText = ["label", "button", "textbox"].indexOf(obj._type) !== -1;
    const isGroup = !!obj._isFlex;
    const isIcon = (obj._type === "image");
    const onOff = function (value) { return (value) ? 1 : 0; };
    return {
        isAbsolute: cs.position === "absolute",
        isText: isText,
        isGroup: isGroup,
        isIcon: isIcon,
        isInput: (obj._type === "textbox"),
        isButton: (obj._type === "button"),
        isBox: (obj._type === "box" && !isGroup),
        // position and size ("" : the side is not set)
        position: obj.elem.style.position || cs.position,
        left: BasicDesigner.sideValue(obj, "left"),
        right: BasicDesigner.sideValue(obj, "right"),
        top: BasicDesigner.sideValue(obj, "top"),
        bottom: BasicDesigner.sideValue(obj, "bottom"),
        hAnchor: BasicDesigner.anchorOf(obj, "left", "right"),
        vAnchor: BasicDesigner.anchorOf(obj, "top", "bottom"),
        width: (obj._width !== undefined) ? obj._width : Math.round(r.width),
        height: (obj._height !== undefined) ? obj._height : Math.round(r.height),
        rotate: BasicDesigner.rotateOf(obj, cs),
        // fill and border
        color: obj.color || "",
        opacity: Number(cs.opacity), // on the screen: a part of a component can get it from a style (the tick of a CheckBox)
        round: BasicDesigner.roundOf(obj),
        border: BasicDesigner.borderOf(obj),
        borderColor: obj.borderColor || "",
        boxShadow: obj.boxShadow || "",
        // text
        text: isText ? (obj.text || "") : "",
        fontSize: isText ? (obj.fontSize || parseFloat(cs.fontSize)) : 0,
        textColor: isText ? (obj.textColor || cs.color) : "",
        textAlign: isText ? (obj.textAlign || "left") : "",
        bold: isText ? onOff(obj.bold) : 0,
        italic: isText ? onOff(obj.italic) : 0,
        lineHeight: isText ? BasicDesigner.toNumber(obj.lineHeight) : 0,
        ellipsis: isText ? onOff(obj.ellipsis) : 0,
        fontFamily: isText ? (obj.fontFamily || "") : "",
        selectable: onOff(obj.selectable),
        // input and button
        placeholder: (obj._type === "textbox") ? (obj.placeholder || "") : "",
        inputType: (obj._type === "textbox") ? (obj.inputType || "text") : "",
        maxLength: (obj._type === "textbox" && Number(obj.maxLength) > 0) ? Number(obj.maxLength) : null, // null: "No limit"
        readOnly: (obj._type === "textbox") ? onOff(obj.readOnly) : 0,
        enabled: (obj._type === "textbox" || obj._type === "button") ? onOff(obj.enabled !== 0 && obj.enabled !== false) : 1,
        // minimal: the plain look of basic.css (no gradient, no border); a Button and an Input have it.
        minimal: (obj._type === "textbox" || obj._type === "button") ? onOff(obj.minimal) : 0,
        // group
        gap: isGroup ? BasicDesigner.gapOf(obj) : 0,
        padding: BasicDesigner.paddingOf(obj, cs),
        flow: isGroup ? (obj._flow || "horizontal") : "",
        // WHY: "center" when no align was given: the default of a basic.js group (it showed "left top").
        align: isGroup ? (obj._align || "center") : "",
        wrap: isGroup ? onOff(obj.wrap) : 0,
        justify: isGroup ? (obj.justify || "") : "",
        // picture
        imageFit: isIcon ? (obj.imageFit || "") : "",
        autoSize: isIcon ? onOff(obj.autoSize) : 0,
        alt: isIcon ? (obj.alt || "") : "",
        picture: isIcon ? (obj.picture || "") : "",
        pictureParam: isIcon ? BasicDesigner.pictureParamOf(obj) : null,
        space: isIcon ? (obj.space || 0) : 0,
        // behavior
        visible: onOff(obj.visible),
        clickable: onOff(obj.clickable),
        clipContent: onOff(obj.clipContent !== 0),
        scrollX: onOff(obj.scrollX),
        scrollY: onOff(obj.scrollY),
        cursor: obj.cursor || "",
        zIndex: parseInt(obj.elem.style.zIndex, 10) || 0,
    };
};

// COLOR GROUPS: the palettes of the color picker (comp/property-panel.js): the colors of the page, the color
// tokens of UI (comp/ui-standards.js) when the page loads it, and the color groups of the settings.
BasicDesigner.PAGE_COLOR_COUNT = 48;

// "rgb(255, 0, 0)", "red", "#F00" -> one form ("#FF0000"; with alpha: "rgba(...)"), to count them together.
BasicDesigner.colorKey = function (color) {
    if (!BasicDesigner.colorContext) BasicDesigner.colorContext = document.createElement("canvas").getContext("2d");
    const context = BasicDesigner.colorContext;
    context.fillStyle = "#000001"; // WHY: A wrong color leaves the old fillStyle: this one tells it apart.
    context.fillStyle = color;
    const key = context.fillStyle;
    return (key.charAt(0) === "#") ? key.toUpperCase() : key;
};

// The colors of the objects of the page (background, text, border), the most used first.
BasicDesigner.pageColors = function () {
    const counts = {};
    BasicDesigner.state.rt.getAlive().forEach(function (obj) {
        const style = obj.elem.style;
        [style.backgroundColor, style.color, style.borderColor].forEach(function (color) {
            if (!color || color === "transparent" || /rgba\([^)]*,\s*0\)$/.test(color)) return;
            const key = BasicDesigner.colorKey(color);
            if (key === "#000001") return;
            counts[key] = (counts[key] || 0) + 1;
        });
    });
    const keys = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, BasicDesigner.PAGE_COLOR_COUNT);
    const colors = keys.map(function (key) {
        const times = (counts[key] === 1) ? "1 time" : counts[key] + " times";
        return { value: key, color: key, hint: key + " (used " + times + ")" };
    });
    colors.push({ value: "transparent", color: "transparent", hint: "transparent (no color)" });
    return colors;
};

// The COLOR_ tokens of UI, when the page loads comp/ui-standards.js.
BasicDesigner.tokenColors = function () {
    // WHY: "const UI" of a script is not on window: it is read in the page with eval.
    let UI = null;
    try {
        UI = BasicDesigner.state.win.eval("typeof UI !== 'undefined' ? UI : null");
    } catch (error) {
        UI = null;
    }
    if (!UI || typeof UI.getColor !== "function") return [];
    const keys = Object.keys(UI).filter(function (key) { return /^COLOR_/.test(key) && typeof UI[key] === "string"; });
    return keys.map(function (key) {
        return { value: UI[key], color: UI.getColor(UI[key]), hint: "UI." + key };
    });
};

BasicDesigner.GROUP_KEY = "group:"; // + the id of a color group

BasicDesigner.colorPalettes = function () {
    if (!BasicDesigner.state.rt) return [];
    const palettes = [{ key: "page", name: "Used on this page", colors: BasicDesigner.pageColors() }];
    const tokens = BasicDesigner.tokenColors();
    if (tokens.length) palettes.push({ key: "tokens", name: "UI tokens", colors: tokens });
    BasicDesigner.settings.colorGroups.forEach(function (group) {
        palettes.push({
            key: BasicDesigner.GROUP_KEY + group.id,
            name: group.name,
            colors: group.colors,
            canAdd: 1,
            emptyText: "Empty. Pick a color, then press + to add it to this group.",
        });
    });
    BasicDesigner.defaultPalettes().forEach(function (palette) { palettes.push(palette); });
    return palettes;
};

BasicDesigner.DEFAULT_KEY = "default:"; // + the key of a default palette

BasicDesigner.FAVORITES_KEY = "favorites"; // the default palette that takes the + of the picker

// The default palettes in the order of the settings (paletteOrder); a new palette of the file comes at the end.
BasicDesigner.orderedDefaultPalettes = function () {
    const list = (BasicDesigner.DEFAULT_PALETTES || []).slice();
    const order = BasicDesigner.settings.paletteOrder || [];
    const placeOf = function (palette) {
        const place = order.indexOf(palette.key);
        return (place === -1) ? order.length + list.indexOf(palette) : place;
    };
    return list.sort(function (a, b) { return placeOf(a) - placeOf(b); });
};

BasicDesigner.isPaletteHidden = function (key) {
    return (BasicDesigner.settings.hiddenPalettes || []).indexOf(key) !== -1;
};

// The colors of a default palette: [value, name] -> { value, color, hint }. Favorites: yours first.
BasicDesigner.defaultPaletteColors = function (palette) {
    const colors = palette.colors.map(function (pair) {
        const value = pair[0];
        const name = pair[1];
        return { value: value, color: value, hint: (name && name !== value) ? name + " · " + value : value };
    });
    if (palette.key !== BasicDesigner.FAVORITES_KEY) return colors;
    const removed = BasicDesigner.settings.removedFavorites || [];
    const yours = (BasicDesigner.settings.favoriteColors || []).map(function (value) {
        return { value: value, color: value, hint: value + " (added by you)" };
    });
    const isYours = function (preset) { return BasicDesigner.settings.favoriteColors.indexOf(preset.value) !== -1; };
    // WHY fixed: the colors of the file stay after yours (they are not moved in the picker; they can be deleted)
    const isKept = function (preset) { return !isYours(preset) && removed.indexOf(preset.value) === -1; };
    const fileColors = colors.filter(isKept).map(function (preset) {
        return Object.assign(preset, { fixed: 1 });
    });
    return yours.concat(fileColors);
};

// The default palettes (default-palettes.js) in the form of the picker, without the hidden ones.
BasicDesigner.defaultPalettes = function () {
    const shown = BasicDesigner.orderedDefaultPalettes().filter(function (palette) { return !BasicDesigner.isPaletteHidden(palette.key); });
    return shown.map(function (palette) {
        const result = { key: BasicDesigner.DEFAULT_KEY + palette.key, name: palette.name, colors: BasicDesigner.defaultPaletteColors(palette) };
        if (palette.key === BasicDesigner.FAVORITES_KEY) result.canAdd = 1;
        return result;
    });
};

// The + of the color picker: the current color goes into a color group of the settings.
BasicDesigner.addColorToGroup = function (paletteKey, color) {
    if (paletteKey === BasicDesigner.DEFAULT_KEY + BasicDesigner.FAVORITES_KEY) {
        BasicDesigner.addFavoriteColor(color);
        return;
    }
    const group = BasicDesigner.settings.colorGroups.find(function (g) { return BasicDesigner.GROUP_KEY + g.id === paletteKey; });
    if (!group || !color) return;
    if (group.colors.indexOf(color) === -1) group.colors.push(color);
    BasicDesigner.saveSettings();
    BasicDesigner.setStatus("Added " + color + " to the color group " + group.name + ".");
};

// The colors of the settings behind an editable palette of the picker: { name, colors } (colors: the list of the
// settings itself), or null. ★ Favorites: only the colors you added.
BasicDesigner.editableColorsOf = function (paletteKey) {
    if (paletteKey === BasicDesigner.DEFAULT_KEY + BasicDesigner.FAVORITES_KEY) {
        return { name: "★ Favorites", colors: BasicDesigner.settings.favoriteColors };
    }
    const group = BasicDesigner.settings.colorGroups.find(function (g) { return BasicDesigner.GROUP_KEY + g.id === paletteKey; });
    return (group) ? { name: "the color group " + group.name, colors: group.colors } : null;
};

// Delete in the menu of a color of the picker (a right click). ★ Favorites: a color of the file is kept in
// removedFavorites (the file is not changed).
BasicDesigner.removeColorFromGroup = function (paletteKey, color) {
    if (paletteKey === BasicDesigner.DEFAULT_KEY + BasicDesigner.FAVORITES_KEY) {
        BasicDesigner.removeFavoriteColor(color);
        return;
    }
    const target = BasicDesigner.editableColorsOf(paletteKey);
    if (!target) return;
    const place = target.colors.indexOf(color);
    if (place === -1) return;
    target.colors.splice(place, 1);
    BasicDesigner.saveSettings();
    BasicDesigner.setStatus("Removed " + color + " from " + target.name + ".");
};

// ★ Favorites: yours is removed; one of the file too (WHY both: the same color may be in both, and it must go).
BasicDesigner.removeFavoriteColor = function (color) {
    const favorites = BasicDesigner.settings.favoriteColors;
    const place = favorites.indexOf(color);
    if (place !== -1) favorites.splice(place, 1);
    const filePalette = (BasicDesigner.DEFAULT_PALETTES || []).find(function (palette) { return palette.key === BasicDesigner.FAVORITES_KEY; });
    const isInFile = !!filePalette && filePalette.colors.some(function (pair) { return pair[0] === color; });
    if (isInFile) BasicDesigner.settings.removedFavorites = (BasicDesigner.settings.removedFavorites || []).concat([color]);
    BasicDesigner.saveSettings();
    const back = (isInFile) ? " (Settings > Reset order and show all brings it back)" : "";
    BasicDesigner.setStatus("Removed " + color + " from ★ Favorites" + back + ".");
};

// A color dragged to another place in its group. values: every color of the palette in the new order.
BasicDesigner.orderGroupColors = function (paletteKey, values) {
    const target = BasicDesigner.editableColorsOf(paletteKey);
    if (!target) return;
    const ordered = values.filter(function (value) { return target.colors.indexOf(value) !== -1; });
    if (ordered.length !== target.colors.length) return; // WHY: a list that does not match the settings changes nothing
    target.colors.splice.apply(target.colors, [0, target.colors.length].concat(ordered));
    BasicDesigner.saveSettings();
};

// The + of ★ Favorites: the color goes to the start of the group (kept in the settings).
BasicDesigner.addFavoriteColor = function (color) {
    if (!color) return;
    const favorites = BasicDesigner.settings.favoriteColors;
    const place = favorites.indexOf(color);
    if (place !== -1) favorites.splice(place, 1);
    favorites.unshift(color);
    BasicDesigner.settings.removedFavorites = (BasicDesigner.settings.removedFavorites || []).filter(function (c) { return c !== color; });
    BasicDesigner.saveSettings();
    BasicDesigner.setStatus("Added " + color + " to ★ Favorites.");
};

// PANEL ITEMS: small helpers for the items of the properties panel (comp/property-panel.js).

BasicDesigner.onOffItem = function (key, label, value) {
    return { key: key, type: "segmented", label: label, value: value, options: [{ value: 1, text: "On" }, { value: 0, text: "Off" }] };
};

BasicDesigner.selectItem = function (key, label, value, options) {
    const list = options.slice();
    const has = list.some(function (o) { return (typeof o === "object") ? o.value === value : o === value; });
    if (!has && value !== undefined && value !== null) list.push(value);
    return { key: key, type: "select", label: label, value: value, options: list };
};

BasicDesigner.toggleItem = function (key, icon, hint, value) {
    return { key: key, type: "iconButton", icon: icon, hint: hint, toggle: 1, value: !!value };
};

BasicDesigner.CURSORS = [{ value: "", text: "Default" }, "pointer", "text", "move", "grab", "not-allowed", "crosshair"];
BasicDesigner.FONTS = [{ value: "", text: "Open Sans" }, { value: "opensans-bold", text: "Open Sans Bold" }, "system-ui", "serif", "monospace"];
BasicDesigner.INPUT_TYPES = ["text", "password", "email", "number", "tel", "url", "search", "date", "time"];
BasicDesigner.JUSTIFY = [{ value: "", text: "Packed" }, { value: "space-between", text: "Space between" }, { value: "space-around", text: "Space around" }, { value: "space-evenly", text: "Space evenly" }];
BasicDesigner.IMAGE_FITS = [{ value: "", text: "Fill (stretch)" }, "contain", "cover", "none", "scale-down"];

// PANEL SECTIONS: one function per section. The order in showProperties: the most changed first.

BasicDesigner.textSection = function (p) {
    return { key: "text", title: "Text", items: [
        { key: "text", type: "text", label: (p.isInput) ? "Value" : "Text", value: p.text, span: "full", button: BasicDesigner.editorButton("text") },
        BasicDesigner.numberOrText("fontSize", "Font size", "Aa", p.fontSize, { min: 1, button: BasicDesigner.editorButton("fontSize") }),
        { key: "textColor", type: "color", label: "Text color", value: p.textColor, span: "full" },
        [{ key: "textAlign", type: "segmented", label: "Align", value: p.textAlign, options: [
            { value: "left", icon: "textLeft", hint: "Left" },
            { value: "center", icon: "textCenter", hint: "Center" },
            { value: "right", icon: "textRight", hint: "Right" },
         ] },
         BasicDesigner.toggleItem("bold", "bold", "Bold", p.bold),
         BasicDesigner.toggleItem("italic", "italic", "Italic", p.italic)],
        [BasicDesigner.numberOrText("lineHeight", "Line height", "lineHeight", p.lineHeight || "", { min: 0, placeholder: "auto", button: BasicDesigner.editorButton("lineHeight") }),
         BasicDesigner.toggleItem("ellipsis", "ellipsis", "One line, \"...\" at the end", p.ellipsis)],
        BasicDesigner.selectItem("fontFamily", "Font", p.fontFamily, BasicDesigner.FONTS),
    ] };
};

BasicDesigner.inputSection = function (p) {
    return { key: "input", title: "Input", items: [
        { key: "placeholder", type: "text", label: "Placeholder", value: p.placeholder, span: "full" },
        [BasicDesigner.selectItem("inputType", "Type", p.inputType, BasicDesigner.INPUT_TYPES),
         { key: "maxLength", type: "number", label: "Max length", prefix: "#", value: p.maxLength, min: 0, autoText: "No limit" }],
        [BasicDesigner.onOffItem("readOnly", "Read only", p.readOnly),
         BasicDesigner.onOffItem("enabled", "Enabled", p.enabled)],
        [BasicDesigner.onOffItem("minimal", "Minimal", p.minimal)],
    ] };
};

BasicDesigner.layoutSection = function (p) {
    const gapItem = BasicDesigner.listItem("gap", p.gap);
    const paddingItem = BasicDesigner.listItem("padding", p.padding);
    // WHY: four sides do not fit in a half field ("14, 10, 6, 2" was cut): then the padding has a row of its own.
    const spacingRows = (paddingItem.span) ? [[gapItem], [paddingItem]] : [[gapItem, paddingItem]];
    return { key: "group", title: "Auto layout", items: [
        [{ key: "flow", type: "segmented", label: "Direction", value: p.flow, options: [
            { value: "horizontal", icon: "flowHorizontal", hint: "Horizontal (side by side)" },
            { value: "vertical", icon: "flowVertical", hint: "Vertical (one under the other)" },
         ] },
         BasicDesigner.toggleItem("wrap", "wrap", "Wrap to the next line", p.wrap)],
        [{ key: "align", type: "alignGrid", label: "Align", value: p.align },
         BasicDesigner.selectItem("justify", "Spacing", p.justify, BasicDesigner.JUSTIFY)],
        ...spacingRows,
    ] };
};

BasicDesigner.sizeSection = function (p) {
    const items = [
        [BasicDesigner.sizeItem("width", "Width", "W", p.width),
         BasicDesigner.sizeItem("height", "Height", "H", p.height)],
    ];
    if (!p.isGroup) items.push([BasicDesigner.listItem("padding", p.padding)]);
    // WHY mark: a line at the left of Size and Position: the eye finds them, Fill and border comes right after them
    return { key: "size", title: "Size", mark: 1, items: items };
};

// THE PROPS THAT TAKE A LIST of numbers: padding, and border, round and gap since basic.js v26.11.07.
// counts: the lengths basic.js reads (three are refused: it reads [x, y, z] as [x, y] and loses the third without a
// word). minVersion: an older basic.js of the page (a standalone copy) does not read a list of this prop.
BasicDesigner.LIST_PROPS = {
    padding: {
        label: "Padding", prefix: "P", counts: [1, 2, 4],
        hint: "Padding: 14, or x, y (14, 10), or left, top, right, bottom (14, 10, 6, 2)",
        example: "Ex: 14, or 14, 10 (x, y), or 14, 10, 6, 2 (left, top, right, bottom)",
    },
    border: {
        label: "Border", prefix: "B", counts: [1, 2, 4], minVersion: "26.11.07",
        hint: "Border: 1, or x, y (0, 1), or left, top, right, bottom (0, 0, 0, 1: a line at the bottom)",
        example: "Ex: 1, or 0, 1 (x, y), or 0, 0, 0, 1 (left, top, right, bottom)",
    },
    round: {
        label: "Round", prefix: "radius", counts: [1, 2, 4], minVersion: "26.11.07",
        hint: "Round: 8, or top, bottom (12, 0), or top left, top right, bottom right, bottom left (12, 12, 0, 12)",
        example: "Ex: 8, or 12, 0 (top, bottom), or 12, 12, 0, 12 (top left, top right, bottom right, bottom left)",
    },
    gap: {
        label: "Gap", prefix: "G", counts: [1, 2], minVersion: "26.11.07",
        hint: "Gap: 8, or x, y (12, 8): x between the items of a line, y between the lines (wrap)",
        example: "Ex: 8, or 12, 8 (x: in a line, y: between the lines)",
    },
};

// A LIST FIELD (LIST_PROPS): a number field (dragged and stepped like the others) that also reads a text of values
// (parseListText): "14, 10" or "14 10" -> two values, "14, 10, 6, 2" -> four, in the order of basic.js. A text value
// is shown as it is and goes to the object as an array (onPropertyChange). Four values take two columns.
BasicDesigner.listItem = function (key, value) {
    const prop = BasicDesigner.LIST_PROPS[key];
    const item = {
        key: key,
        type: "number",
        label: prop.label,
        prefix: prop.prefix,
        hint: prop.hint,
        value: (typeof value === "number") ? Math.round(value * 100) / 100 : value,
        min: 0,
        parseText: function (typed) { return BasicDesigner.parseListText(typed, key); },
        commaIsList: 1, // "12,0" is two values here, not the decimal 12.0 (PropertyPanel)
        button: BasicDesigner.editorButton(key),
    };
    if (BasicDesigner.isFourValues(value)) item.span = 2;
    return item;
};

// *** THE SMALL WINDOWS OF THE BOX VIEW: the editors of the Parameters (param-editors.js) for the properties of an object.
// A button at the end of a field opens one (also a click on its prefix, or Alt+Down in it); the same button closes it.
// WHY the same windows: a padding, a shadow or a number is changed in one way in both views. A change goes through
// onPropertyChange, as one of the field: Changes, the prompt, undo / redo, the session, "All N from this line".
BasicDesigner.BOX_EDITORS = {
    padding: { icon: "sides", title: "Padding", hint: "Its four sides", open: function (view) { BasicDesigner.openParamSides(view, BasicDesigner.USUAL_PADDINGS); } },
    border: { icon: "sides", title: "Border", hint: "Its four sides", open: function (view) { BasicDesigner.openParamSides(view, BasicDesigner.USUAL_BORDERS); } },
    round: { icon: "corners", title: "Round", hint: "Its four corners", open: function (view) { BasicDesigner.openParamCorners(view); } },
    gap: { icon: "gap", title: "Gap", hint: "X and Y", open: function (view) { BasicDesigner.openParamGap(view); } },
    boxShadow: { icon: "shadow", title: "Shadow", hint: "Its layers, and how it looks", open: function (view) { BasicDesigner.openParamShadow(view); } },
    opacity: { icon: "sliders", title: "Opacity", hint: "A slider and the usual values", open: function (view) { BasicDesigner.openParamNumber(view); } },
    fontSize: { icon: "sliders", title: "Font size", hint: "A slider and the usual values", open: function (view) { BasicDesigner.openParamNumber(view); } },
    // WHY pixels: basic.js takes a number line height as px (a parameter may be a ratio: rangeOfNumber guesses)
    lineHeight: { icon: "sliders", title: "Line height", hint: "A slider and the usual values (px)", isPixels: true, open: function (view) { BasicDesigner.openParamNumber(view); } },
    rotate: { icon: "sliders", title: "Rotate", hint: "A slider and the usual values", open: function (view) { BasicDesigner.openParamNumber(view); } },
    text: { icon: "expand", title: "Text", hint: "A bigger field", open: function (view) { BasicDesigner.openParamText(view); } },
};

// The button of a field that opens its window (PropertyPanel: item.button).
BasicDesigner.editorButton = function (key) {
    const editor = BasicDesigner.BOX_EDITORS[key];
    return { icon: BasicDesigner.paramIcon(editor.icon, 14), hint: editor.hint + " · Alt+Down" };
};

// field: the field of the panel (the window opens at its height).
BasicDesigner.openBoxEditor = function (obj, key, field) {
    const editor = BasicDesigner.BOX_EDITORS[key];
    const pathText = "box:" + key;
    const popover = BasicDesigner.paramPopover;
    const isOpenHere = !!(popover && popover.pathText === pathText);
    BasicDesigner.closeParamEditors();
    if (isOpenHere || !field) return;
    const value = BasicDesigner.boxEditValue(key);
    const view = {
        row: { key: key, title: editor.title, pathText: pathText, value: value, note: "", kind: { name: "text" } },
        field: field,
        box: field, // a press in it does not close the window (its button closes it)
        edit: BasicDesigner.startBoxEdit(obj, key, value),
    };
    if (editor.isPixels) view.range = BasicDesigner.pixelRangeOf(value);
    editor.open(view);
};

// The value of a property for its window: the one of the panel, a list as an array ("14, 10" -> [14, 10]).
BasicDesigner.boxEditValue = function (key) {
    const value = BasicDesigner.ui.panel.getValue(key);
    return (BasicDesigner.LIST_PROPS[key]) ? BasicDesigner.listValue(value) : value;
};

BasicDesigner.pixelRangeOf = function (value) {
    const range = Object.assign({}, BasicDesigner.LINE_PIXELS_RANGE);
    range.max = Math.max(range.max, Math.ceil((Number(value) || 0) * 1.5)); // WHY: a value over the usual range is on the slider too
    return range;
};

// What a window of the Box view changes (as startParamEdit for a parameter): edit.set(value) writes the field and changes the
// object. isBox: showProperties closes the window when another object is shown.
BasicDesigner.startBoxEdit = function (obj, key, value) {
    const edit = {
        id: obj.__bd.id,
        key: key,
        path: [key],
        pathText: "box:" + key,
        note: "",
        before: value,
        value: value,
        isBox: true,
        isSetting: false,
        set: function (next) {
            edit.value = next;
            if (edit.onChange) edit.onChange();
            BasicDesigner.applyBoxEdit(obj, key, next, edit);
        },
    };
    return edit;
};

BasicDesigner.applyBoxEdit = function (obj, key, value, edit) {
    const s = BasicDesigner.state;
    const panel = BasicDesigner.ui.panel;
    if (s.selected !== obj || !obj.elem.isConnected) return;
    // The text of the panel: a list as "14, 10" (onPropertyChange makes it an array again)
    const shown = (Array.isArray(value)) ? value.join(", ") : value;
    // WHY parseListText: the same checks as a written list (an older basic.js of the page reads no list of a border).
    const isList = (BasicDesigner.LIST_PROPS[key] && Array.isArray(value));
    if (isList && BasicDesigner.parseListText(shown, key) === undefined) return;
    const oldValue = panel.getValue(key);
    panel.setValue(key, shown, 1);
    edit.isSetting = true;
    BasicDesigner.onPropertyChange({ kind: "value", key: key, value: shown, oldValue: oldValue });
    edit.isSetting = false;
};

// "14, 10, 6, 2" (a list of four values as the panel shows it)
BasicDesigner.isFourValues = function (value) {
    return typeof value === "string" && value.split(",").length === 4;
};

// A typed list -> a number, a text of its values ("14, 10"), or undefined (the old value comes back; the status bar
// says why, with an example).
BasicDesigner.parseListText = function (typed, key) {
    const prop = BasicDesigner.LIST_PROPS[key];
    const words = String(typed).toLowerCase().replace(/px/g, " ").trim().split(/[\s,;]+/).filter(Boolean);
    const values = words.map(Number);
    const counts = prop.counts.slice(0, -1).join(", ") + " or " + prop.counts[prop.counts.length - 1];
    if (!words.length || values.some(isNaN)) {
        BasicDesigner.setStatus("Not a " + key + ": \"" + typed + "\". " + prop.example, "error");
        return undefined;
    }
    if (values.some(function (v) { return v < 0; })) {
        BasicDesigner.setStatus("A " + key + " can not be less than 0: \"" + typed + "\"", "error");
        return undefined;
    }
    if (prop.counts.indexOf(values.length) === -1) {
        BasicDesigner.setStatus("A " + key + " takes " + counts + " values, not " + values.length + ". " + prop.example, "error");
        return undefined;
    }
    if (values.length === 1) return values[0];
    if (!BasicDesigner.pageReadsList(key)) {
        const version = BasicDesigner.pageBasicVersion();
        const versionText = (version) ? "v" + version : "of an older version";
        BasicDesigner.setStatus("This page loads basic.js " + versionText + ": a " + key + " of more than one value needs v" + prop.minVersion + ".", "error");
        return undefined;
    }
    return values.join(", ");
};

// The version of the basic.js of the page ("": a very old one, without basic.version).
BasicDesigner.pageBasicVersion = function () {
    const pageBasic = BasicDesigner.state.win && BasicDesigner.state.win.basic;
    return (pageBasic && pageBasic.version) || "";
};

// Does the basic.js of the page read a list for this prop? WHY ">=": a version is the date "YY.MM.DD", the texts compare.
BasicDesigner.pageReadsList = function (key) {
    const minVersion = BasicDesigner.LIST_PROPS[key].minVersion;
    if (!minVersion) return true;
    return BasicDesigner.pageBasicVersion() >= minVersion;
};

// A typed padding (also of a component param: param-kinds.js).
BasicDesigner.parsePaddingText = function (typed) {
    return BasicDesigner.parseListText(typed, "padding");
};

// A list text of the panel ("14, 10") -> the array basic.js takes ([14, 10]); a number or another value as it is.
BasicDesigner.listValue = function (value) {
    if (typeof value !== "string" || value.indexOf(",") === -1) return value;
    return value.split(",").map(function (v) { return Number(v.trim()) || 0; });
};

// SIZE: width / height. A number (px), or a text: "100%", "calc(100% - 20px)", "auto", "50vw"...
// The menu (⌄) has the usual ones. Short ways to write them (parseSizeText): "%100" -> 100%, "fill" -> 100%,
// "a" / "hug" -> auto, "100%-20" / "%100 - 20" -> calc(100% - 20px). A text value is dragged from its size now.
// NOTE: auto is hug: hug: 1 of basic.js is the short way of giving it.
BasicDesigner.SIZE_PRESETS = [
    { value: "auto", text: "auto (hug)" },
    { value: "100%", text: "fill (100%)" },
    { value: "calc(100% - 20px)", text: "100% − 20px" },
    { value: "50%", text: "50%" },
];

BasicDesigner.sizeItem = function (key, label, prefix, value) {
    const shown = BasicDesigner.toNumber(value); // WHY: "120px" -> 120: a number can be dragged and stepped.
    return {
        key: key,
        type: "combo",
        label: label,
        prefix: prefix,
        value: (typeof shown === "number") ? Math.round(shown * 100) / 100 : shown,
        min: 0,
        options: BasicDesigner.SIZE_PRESETS,
        parseText: BasicDesigner.parseSizeText,
        textToNumber: function () { return BasicDesigner.measuredSize(key); },
    };
};

// A typed size -> a CSS size text, or undefined (not a size: the old value comes back).
BasicDesigner.parseSizeText = function (typed) {
    let text = String(typed).trim().toLowerCase().replace(/\s+/g, " ");
    if (text === "a" || text === "h" || text === "hug") return "auto";
    if (text === "f" || text === "fill") return "100%";
    text = text.replace(/%\s*(\d+(\.\d+)?)/g, "$1%"); // "%100" -> "100%" (the Turkish way of writing it)
    text = text.replace(/(\d)\s+%/g, "$1%"); // "100 %" -> "100%"
    const hasOperator = /\d\s*%?\s*[-+*/]\s*\d/.test(text);
    if (hasOperator && text.indexOf("calc(") !== 0) text = "calc(" + text + ")"; // "100%-20" -> calc(100%-20)
    if (text.indexOf("calc(") === 0) text = BasicDesigner.tidyCalc(text);
    if (window.CSS && CSS.supports("width", text)) return text;
    BasicDesigner.setStatus("Not a size: \"" + typed + "\". Ex: 240, 100%, calc(100% - 20px), auto", "error");
    return undefined;
};

// calc(100%-20) -> calc(100% - 20px): spaces around + and - (CSS needs them), px on a number after + / -.
BasicDesigner.tidyCalc = function (text) {
    const inside = text.slice("calc(".length, -1);
    const tokens = inside.replace(/([+\-*/])/g, " $1 ").trim().split(/\s+/);
    const tidy = tokens.map(function (token, index) {
        const previous = tokens[index - 1];
        const isFactor = previous === "*" || previous === "/"; // WHY: calc(100% / 3): a factor has no unit.
        if (/^\d+(\.\d+)?$/.test(token) && !isFactor) return token + "px";
        return token;
    });
    return "calc(" + tidy.join(" ") + ")";
};

// The size of the selected object on the page now (px), to drag a text size ("100%") from it.
BasicDesigner.measuredSize = function (key) {
    const obj = BasicDesigner.state.selected;
    if (!obj) return null;
    return (key === "width") ? obj.elem.offsetWidth : obj.elem.offsetHeight;
};

// THE DISTANCE TO A SIDE (G-007): one field for an axis. Its prefix says the side (Left / Right, Top /
// Bottom) and a click on it changes the side ("__side:right"); its menu gives a value (only
// these three); a text value like the sizes (100%, calc...).
BasicDesigner.SIDE_NAMES = { left: "Left", right: "Right", top: "Top", bottom: "Bottom" };
// WHY these widths: the switch and the field fill a full row (100 + the gap 8 + 108); "Bottom" fits the switch
BasicDesigner.SIDE_SWITCH_WIDTH = 100;
BasicDesigner.SIDE_FIELD_WIDTH = 108;
BasicDesigner.SIDE_VALUE_PRESETS = [
    { value: "0", text: "0" },
    { value: "50%", text: "50%" },
    { value: "calc(100% - 20px)", text: "100% − 20px" },
];
BasicDesigner.SIDE_PREFIX = "__side:";

// A row of an axis: a switch of its two sides (both are seen, the chosen one is marked) and the
// distance; the arrows of the field are dragged to change it. sides: ["left", "right"] or ["top", "bottom"]
BasicDesigner.sideRow = function (axisKey, label, sides, side, value) {
    const switchItem = {
        key: axisKey,
        type: "segmented",
        label: label,
        value: side,
        span: BasicDesigner.SIDE_SWITCH_WIDTH,
        options: sides.map(function (s) { return { value: s, text: BasicDesigner.SIDE_NAMES[s], hint: "The distance from the " + s + " side" }; }),
    };
    return [switchItem, BasicDesigner.sideItem(side, value)];
};

BasicDesigner.sideItem = function (side, value) {
    const shown = BasicDesigner.toNumber(value);
    const isHorizontal = (side === "left" || side === "right");
    return {
        key: side,
        type: "combo",
        label: "",
        prefix: (isHorizontal) ? "constraintH" : "constraintV",
        hint: "The distance from the " + side + " side (drag the arrows to change it)",
        span: BasicDesigner.SIDE_FIELD_WIDTH,
        value: (typeof shown === "number") ? Math.round(shown * 100) / 100 : shown,
        options: BasicDesigner.SIDE_VALUE_PRESETS,
        parseText: BasicDesigner.parsePositionText,
        textToNumber: function () { return BasicDesigner.state.selected ? BasicDesigner.distanceFrom(BasicDesigner.state.selected, side) : null; },
    };
};

// A typed distance -> a CSS length text, or undefined. As a size (100%, calc(100% - 20px), %100), but not "auto".
BasicDesigner.parsePositionText = function (typed) {
    const text = String(typed).trim();
    if (text.indexOf(BasicDesigner.SIDE_PREFIX) === 0) return text; // a side from the menu
    if (/^(a|h|hug|auto)$/i.test(text)) {
        BasicDesigner.setStatus("A distance can not be auto. Ex: 20, 50%, calc(100% - 20px)", "error");
        return undefined;
    }
    return BasicDesigner.parseSizeText(text);
};

BasicDesigner.positionSection = function (p) {
    const items = [
        { key: "__positioning", type: "segmented", label: "Positioning", value: (p.isAbsolute) ? "manual" : "auto", span: 2, options: [
            { value: "auto", text: "Auto", hint: "In the flow of its container (a group places it)" },
            { value: "manual", text: "Manual", hint: "At a distance from the sides of its container" },
        ] },
    ];
    if (p.isAbsolute) {
        const h = p.hAnchor;
        const v = p.vAnchor;
        items.push(BasicDesigner.sideRow("__hAnchor", "Horizontal", ["left", "right"], h, p[h]));
        items.push(BasicDesigner.sideRow("__vAnchor", "Vertical", ["top", "bottom"], v, p[v]));
        items.push([BasicDesigner.snapItem()]);
    }
    items.push([{ key: "rotate", type: "number", label: "Rotate", icon: "angle", value: p.rotate, unit: "°", button: BasicDesigner.editorButton("rotate") }]);
    return { key: "position", title: "Position", mark: 1, items: items };
};

// SIDES: position, left, right, top and bottom are one change ("sides"): basic.js clears the opposite side when one
// is set (and position "relative" sets left / top to 0), so they are kept and put back together.
BasicDesigner.SIDE_KEYS = ["position", "left", "right", "top", "bottom"];

BasicDesigner.readSides = function (obj) {
    const sides = {};
    BasicDesigner.SIDE_KEYS.forEach(function (key) { sides[key] = obj.elem.style[key]; });
    return sides;
};

BasicDesigner.writeSides = function (obj, sides) {
    BasicDesigner.SIDE_KEYS.forEach(function (key) { obj.elem.style[key] = sides[key]; });
};

// [{ key, from, to }] of the sides that differ. "" -> "(not set)".
BasicDesigner.sidesDiff = function (from, to) {
    const text = function (v) { return (v === "") ? "(not set)" : v; };
    return BasicDesigner.SIDE_KEYS.filter(function (key) { return from[key] !== to[key]; }).map(function (key) {
        return { key: key, from: text(from[key]), to: text(to[key]) };
    });
};

// Runs change() on obj (it sets its sides with the basic.js props) and keeps the result as one "sides" change.
BasicDesigner.changeSides = function (obj, change) {
    const s = BasicDesigner.state;
    const id = obj.__bd.id + ":sides";
    const before = BasicDesigner.readSides(obj);
    try {
        change();
    } catch (error) {
        BasicDesigner.setStatus("Could not move it: " + error.message, "error");
        return;
    }
    const entry = s.changes.get(id) || { obj: obj, kind: "sides", key: "position", from: before, targets: new Map(), count: 1 };
    entry.to = BasicDesigner.readSides(obj);
    if (BasicDesigner.sidesDiff(entry.from, entry.to).length) s.changes.set(id, entry);
    else s.changes.delete(id);
};

// POSITIONING: "auto" <-> "manual", and the side of a manual position. The distances are taken from the screen,
// so the object stays where it is.
BasicDesigner.setPositioning = function (obj, mode) {
    if (mode === "manual") {
        const left = BasicDesigner.distanceFrom(obj, "left");
        const top = BasicDesigner.distanceFrom(obj, "top");
        BasicDesigner.changeSides(obj, function () {
            obj.position = "absolute";
            obj.left = left;
            obj.top = top;
        });
        return;
    }
    // WHY: basic.js position = "relative" also sets left / top to 0 (which clears right / bottom).
    BasicDesigner.changeSides(obj, function () { obj.position = "relative"; });
};

// SNAP TO THE PARENT: a side at 0, or the middle (50% minus half of the object's size, so it
// stays in the middle while its size stays). It also chooses the side, which was hidden in the menu of the field.
BasicDesigner.snapItem = function () {
    return { key: "__snap", type: "segmented", label: "Snap to the parent", span: 2, options: [
        { value: "left", icon: "alignLeft", hint: "To the left side (Left 0)" },
        { value: "centerH", icon: "alignCenterH", hint: "To the middle, horizontally" },
        { value: "right", icon: "alignRight", hint: "To the right side (Right 0)" },
        { value: "top", icon: "alignTop", hint: "To the top (Top 0)" },
        { value: "centerV", icon: "alignCenterV", hint: "To the middle, vertically" },
        { value: "bottom", icon: "alignBottom", hint: "To the bottom (Bottom 0)" },
    ] };
};

BasicDesigner.snapToParent = function (obj, place) {
    const half = function (size) { return "calc(50% - " + Math.round(size / 2) + "px)"; };
    const SNAPS = {
        left: function () { obj.left = 0; },
        right: function () { obj.right = 0; },
        centerH: function () { obj.left = half(obj.elem.offsetWidth); },
        top: function () { obj.top = 0; },
        bottom: function () { obj.bottom = 0; },
        centerV: function () { obj.top = half(obj.elem.offsetHeight); },
    };
    if (!SNAPS[place]) return;
    BasicDesigner.changeSides(obj, SNAPS[place]); // WHY: basic.js clears the opposite side.
};

BasicDesigner.setAnchor = function (obj, side) {
    const distance = BasicDesigner.distanceFrom(obj, side);
    BasicDesigner.changeSides(obj, function () { obj[side] = distance; }); // WHY: basic.js clears the opposite side.
};

BasicDesigner.pictureSection = function (p) {
    return { key: "picture", title: "Picture", items: [
        { key: "picture", type: "text", label: BasicDesigner.pictureLabel(p.pictureParam), value: BasicDesigner.shortPicture(p.picture), span: "full", placeholder: "Ex: ../assets/icons/star.svg" },
        { key: "__choosePicture", type: "segmented", label: "", span: "full", options: [{ value: "choose", text: "Choose a picture…", hint: "The pictures of the folders of the project" }] },
        [BasicDesigner.selectItem("imageFit", "Fit", p.imageFit, BasicDesigner.IMAGE_FITS),
         BasicDesigner.onOffItem("autoSize", "Auto size", p.autoSize)],
        [{ key: "alt", type: "text", label: "Alt text", value: p.alt },
         { key: "space", type: "number", label: "Space", prefix: "S", value: p.space, min: 0 }],
    ] };
};

BasicDesigner.fillSection = function (p) {
    const roundItem = BasicDesigner.listItem("round", p.round);
    const opacityItem = BasicDesigner.numberOrText("opacity", "Opacity", "opacity", p.opacity, { min: 0, max: 1, step: 0.05, precision: 2, button: BasicDesigner.editorButton("opacity") });
    // WHY: four corners do not fit in a half field: then the round has a row of its own.
    const roundRows = (roundItem.span) ? [[roundItem], [opacityItem]] : [[roundItem, opacityItem]];
    return { key: "fill", title: "Fill and border", items: [
        { key: "color", type: "color", label: "Color", value: p.color, span: "full", placeholder: "transparent" },
        ...roundRows,
        [BasicDesigner.listItem("border", p.border)],
        { key: "borderColor", type: "color", label: "Border color", value: p.borderColor, span: "full" },
        { key: "boxShadow", type: "text", label: "Shadow", value: p.boxShadow, span: "full", placeholder: "Ex: 0 2px 8px rgba(0,0,0,0.2)", button: BasicDesigner.editorButton("boxShadow") },
    ] };
};

BasicDesigner.behaviorSection = function (p) {
    const items = [
        [{ key: "visible", type: "segmented", label: "Visible", value: p.visible, options: [
            { value: 1, icon: "eye", hint: "Visible" },
            { value: 0, icon: "eyeOff", hint: "Hidden" },
         ] },
         BasicDesigner.onOffItem("clickable", "Clickable", p.clickable)],
        [BasicDesigner.selectItem("cursor", "Cursor", p.cursor, BasicDesigner.CURSORS),
         { key: "zIndex", type: "number", label: "Z index", prefix: "Z", value: p.zIndex }],
    ];
    if (p.isText) items.push([BasicDesigner.onOffItem("selectable", "Selectable", p.selectable)]);
    if (p.isButton) items.push([BasicDesigner.onOffItem("enabled", "Enabled", p.enabled), BasicDesigner.onOffItem("minimal", "Minimal", p.minimal)]);
    return { key: "behavior", title: "Behavior", items: items };
};

BasicDesigner.scrollSection = function (p) {
    return { key: "scroll", title: "Clip and scroll", items: [
        [BasicDesigner.onOffItem("clipContent", "Clip content", p.clipContent)],
        [BasicDesigner.onOffItem("scrollY", "Scroll Y", p.scrollY), BasicDesigner.onOffItem("scrollX", "Scroll X", p.scrollX)],
    ] };
};

// The sections of an object, the most changed first.
BasicDesigner.propertySections = function (p) {
    const sections = [];
    if (p.isText) sections.push(BasicDesigner.textSection(p));
    if (p.isInput) sections.push(BasicDesigner.inputSection(p));
    if (p.isGroup) sections.push(BasicDesigner.layoutSection(p));
    sections.push(BasicDesigner.sizeSection(p));
    if (p.isIcon) sections.push(BasicDesigner.pictureSection(p));
    sections.push(BasicDesigner.positionSection(p));
    sections.push(BasicDesigner.fillSection(p));
    if (p.isGroup || p.isBox) sections.push(BasicDesigner.scrollSection(p));
    sections.push(BasicDesigner.behaviorSection(p));
    return sections;
};

BasicDesigner.NOTE_AREA_HEIGHT = 74; // the note at the bottom of the component parameters (it fits the field)

// The note field of the component parameters: like the textarea of the panel (two lines; the title is the first
// line of the placeholder, so it goes away while writing).
// Returns the <textarea>; its value is the note of the selected object.
BasicDesigner.noteField = function (left, top, width, placeholder) {
    const C = BasicDesigner.colors;
    // GROUP: Field
    const field = VGroup(left, top, width, "auto", { align: "left top", gap: 2, padding: [8, 6], color: C.field, round: 5 });
    field.css = { alignItems: "stretch", boxSizing: "border-box" };
    endGroup();
    const area = document.createElement("textarea");
    area.rows = 2;
    area.placeholder = "Note for the AI\n" + placeholder;
    area.setAttribute("aria-label", "Note for the AI");
    area.style.cssText = "width:100%;box-sizing:border-box;border:0;padding:0;outline:none;resize:none;background:transparent;color:#FFFFFF;font:12px opensans, sans-serif;line-height:17px;pointer-events:auto;user-select:text";
    field.elem.appendChild(area);
    area.addEventListener("keydown", function (event) {
        event.stopPropagation(); // WHY: Not a shortcut of the designer (Backspace would delete the object).
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) area.blur();
    });
    area.addEventListener("blur", function () {
        BasicDesigner.onPropertyChange({ kind: "value", key: "__note", value: area.value });
    });
    return area;
};

// The "open the code" button next to the name (the line that made the object, in VS Code).
BasicDesigner.openCodeItem = function () {
    return { key: "__openCode", type: "iconButton", icon: BasicDesigner.iconSvg("code", 16), hint: "Open the code in VS Code (Enter)", toggle: 0 };
};

// The page of the properties panel when nothing is selected.
BasicDesigner.NO_SELECTION = {
    icon: "pointer",
    title: "Nothing is selected",
    text: "Click an object on the page or in the layers to see and change its properties.",
    hints: [
        { keys: "V", text: "Select mode" },
        { keys: "I", text: "Use the page (Interact)" },
        { keys: "Double click", text: "Edit a text" },
        { keys: "Cmd/Ctrl+O", text: "Open another page" },
    ],
};

BasicDesigner.showProperties = function (obj) {

    const panel = BasicDesigner.ui.panel;
    BasicDesigner.refreshObjectButtons();
    if (!panel) return;

    const isComponent = !!(obj && obj.__bd.component && obj.__bd.params);
    const isParamsView = (isComponent && BasicDesigner.state.inspect === "params");
    BasicDesigner.ui.paramsView.visible = (isParamsView) ? 1 : 0;
    const isEditorStillThere = (isParamsView && obj.__bd.id === BasicDesigner.paramEditId);
    if (BasicDesigner.paramEditId !== null && !isEditorStillThere) BasicDesigner.closeParamEditors();
    // WHY: a small window of the Box view changes the object it was opened for.
    const boxEditor = BasicDesigner.paramPopover;
    const isBoxEditorStillThere = !!(boxEditor && obj && !isParamsView && boxEditor.edit.id === obj.__bd.id);
    if (boxEditor && boxEditor.edit.isBox && !isBoxEditorStillThere) boxEditor.close();

    if (!obj && BasicDesigner.state.isPageSelected) {
        BasicDesigner.showPageProperties();
        return;
    }
    if (!obj) {
        panel.setData({ headerTitle: "Properties", empty: BasicDesigner.NO_SELECTION });
        return;
    }
    if (isComponent && BasicDesigner.state.inspect === "params") {
        BasicDesigner.showParams(obj);
        return;
    }

    const p = BasicDesigner.readProps(obj);
    const t = BasicDesigner.title(obj);
    const sections = [];

    // PARAMETERS | BOX: the two views of a component, at the top of the panel (not in its header: the name had no room)
    if (isComponent) sections.push({ key: "inspect", items: [BasicDesigner.inspectSwitchItem("box")] });

    // APPLY TO: a line that creates many objects (a component, a loop): change them all at once.
    const same = BasicDesigner.sameLineCount(obj);
    if (same > 1) {
        sections.push({ key: "scope", title: "Apply changes to", items: [
            { key: "__scope", type: "select", value: BasicDesigner.state.scope, span: "full", options: [
                { value: "one", text: "This object only" },
                { value: "line", text: "All " + same + " from this line" },
            ] },
        ] });
    }

    sections.push({ key: "name", items: [BasicDesigner.nameItem(obj)] });
    BasicDesigner.propertySections(p).forEach(function (section) { sections.push(section); });

    const data = { headerTitle: (t.name ? t.name + " · " : "") + t.type, sections: sections };
    data.headerItem = BasicDesigner.openCodeItem();
    // WHY: The note says what the values can not: it stays at the bottom, out of the scroll.
    data.footer = { key: "note", items: [
        { key: "__note", type: "textarea", caption: "Note for the AI", rows: 2, value: BasicDesigner.state.notes.get(obj.__bd.id) || "", span: "full", placeholder: "Ex: align it with the card above" },
    ] };
    panel.setData(data);

};

// A text field of these keys gives a number when it reads as one ("12" -> 12).
BasicDesigner.NUMBER_KEYS = ["left", "top", "right", "bottom", "width", "height", "gap", "padding", "fontSize", "opacity", "round", "border", "rotate", "zIndex", "maxLength", "space"];

BasicDesigner.onPropertyChange = function (change) {

    const s = BasicDesigner.state;
    const obj = s.selected;
    if (change.kind === "addColor") {
        BasicDesigner.addColorToGroup(change.key, change.value);
        return;
    }
    if (change.kind === "removeColor") {
        BasicDesigner.removeColorFromGroup(change.key, change.value);
        return;
    }
    if (change.kind === "orderColors") {
        BasicDesigner.orderGroupColors(change.key, change.value);
        return;
    }
    if (s.isPageSelected) {
        BasicDesigner.onPagePropertyChange(change);
        return;
    }
    if (obj && change.kind === "action" && change.key === "__choosePicture") {
        BasicDesigner.openPictureDialog(obj);
        return;
    }
    if (obj && change.kind === "action" && change.key === "__snap") {
        BasicDesigner.snapToParent(obj, change.value);
        BasicDesigner.refreshChanges();
        BasicDesigner.showProperties(obj);
        return;
    }
    if (obj && change.kind === "action" && change.key === "__openCode") {
        BasicDesigner.openInEditor(BasicDesigner.nameFrame(obj));
        return;
    }
    if (obj && change.kind === "action" && change.value === "button" && BasicDesigner.BOX_EDITORS[change.key]) {
        BasicDesigner.openBoxEditor(obj, change.key, change.field);
        return;
    }
    if (obj && change.kind === "tab") {
        s.inspect = change.value;
        BasicDesigner.showProperties(obj);
        return;
    }
    if (!obj || change.kind !== "value") return;
    const key = change.key;
    // WHY: a value written in the panel while a small window is open: the window would hold the old one.
    const boxEditor = BasicDesigner.paramPopover;
    if (boxEditor && boxEditor.edit.isBox && !boxEditor.edit.isSetting) boxEditor.close();

    if (key === "__scope") {
        s.scope = change.value;
        return;
    }
    if (key === "__inspect") {
        s.inspect = change.value;
        BasicDesigner.showProperties(obj);
        return;
    }

    // WHY: a picture in the code (data:...) is shown short; the short text is not a new value
    if (key === "picture" && change.value === BasicDesigner.shortPicture(obj.picture)) return;
    // An Icon of a component: the picture is a parameter of the component (Ex: iconFile), it is changed there
    const pictureParam = (key === "picture") ? BasicDesigner.pictureParamOf(obj) : null;
    if (pictureParam) {
        BasicDesigner.applyParam(pictureParam.component, pictureParam.path, String(change.value || ""), pictureParam.value);
        return;
    }

    // The menu of a distance field: another side (G-007)
    if (typeof change.value === "string" && change.value.indexOf(BasicDesigner.SIDE_PREFIX) === 0) {
        BasicDesigner.setAnchor(obj, change.value.slice(BasicDesigner.SIDE_PREFIX.length));
        BasicDesigner.refreshChanges();
        BasicDesigner.showProperties(obj);
        return;
    }

    // WHY: Only the selected object: the distances are its own (not the same for every object of the line).
    if (key === "__positioning" || key === "__hAnchor" || key === "__vAnchor") {
        if (key === "__positioning") BasicDesigner.setPositioning(obj, change.value);
        else BasicDesigner.setAnchor(obj, change.value);
        BasicDesigner.refreshChanges();
        BasicDesigner.showProperties(obj);
        return;
    }

    if (key === "__name") {
        BasicDesigner.renameObject(obj, change.value);
        return;
    }

    if (key === "__note") {
        const text = String(change.value || "").trim();
        if (text) s.notes.set(obj.__bd.id, text); else s.notes.delete(obj.__bd.id);
        BasicDesigner.refreshChanges();
        BasicDesigner.refreshTreeRow(obj);
        return;
    }

    let value = change.value;
    if (typeof value === "boolean") value = (value) ? 1 : 0; // A toggle (bold, italic, wrap...): basic.js props take 1 / 0
    if (key === "maxLength" && value === 0) value = ""; // WHY: 0 is "No limit" in the panel; maxLength 0 would block typing.
    if (BasicDesigner.NUMBER_KEYS.indexOf(key) !== -1 && typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
        value = Number(value);
    }
    if (BasicDesigner.LIST_PROPS[key]) value = BasicDesigner.listValue(value); // "14, 10" -> [14, 10]

    s.historyKey = obj.__bd.id + ":" + key; // UNDO: the same key again soon is the same step
    const targets = (s.scope === "line") ? BasicDesigner.sameLineObjects(obj) : [obj];
    if (BasicDesigner.SIDE_KEYS.indexOf(key) !== -1) {
        targets.forEach(function (o) {
            BasicDesigner.changeSides(o, function () { o[key] = value; });
        });
        BasicDesigner.refreshChanges();
        return;
    }
    if (!BasicDesigner.applyValue(obj, key, value, targets)) return;

    if (key === "flow") BasicDesigner.refreshTreeRow(obj); // HGroup <-> VGroup
    BasicDesigner.refreshChanges();
    // WHY: a list of four values has a wider field (listItem): the panel is drawn again when it comes or goes.
    const isFourValuesChanged = (BasicDesigner.isFourValues(change.value) !== BasicDesigner.isFourValues(change.oldValue));
    if (BasicDesigner.LIST_PROPS[key] && isFourValuesChanged) BasicDesigner.showProperties(obj);
    // WHY: minimal changes the border (0 / 1) and the look: the panel shows the new values.
    if (key === "minimal") BasicDesigner.showProperties(obj);

};

// Sets key = value on the targets and keeps it in Changes (obj names the change). Returns false on an error.
BasicDesigner.applyValue = function (obj, key, value, targets = [obj]) {

    const s = BasicDesigner.state;
    const id = obj.__bd.id + ":" + key;
    const entry = s.changes.get(id) || { obj: obj, key: key, from: BasicDesigner.readProps(obj)[key], targets: new Map() };

    try {
        targets.forEach(function (o) {
            // WHY: Revert all puts back the value each object had (they can differ: an active tab, a hover).
            if (!entry.targets.has(o)) {
                entry.targets.set(o, BasicDesigner.readProps(o)[key]);
                if (BasicDesigner.RAW_VALUES[key]) {
                    entry.rawValues = entry.rawValues || new Map();
                    entry.rawValues.set(o, BasicDesigner.rawValueOf(o, key));
                }
            }
            o[key] = value;
        });
    } catch (error) {
        BasicDesigner.setStatus("Could not set " + key + ": " + error.message, "error");
        return false;
    }

    entry.to = value;
    entry.count = entry.targets.size;
    // WHY join(", "): the panel reads a padding array as "14, 10"; String([14, 10]) is "14,10", and the same padding
    //      typed again stayed in Changes as a change.
    const textOf = function (v) { return (Array.isArray(v)) ? v.join(", ") : String(v); };
    if (textOf(entry.to) === textOf(entry.from) && entry.count === 1) {
        s.changes.delete(id);
    } else {
        s.changes.set(id, entry);
    }
    return true;

};

// *** THE PARAMETERS OF A COMPONENT:
// A table: name | value, every param of XxxDefaults (with the values it was made with), objects (style) as
// groups, a guide line for every level. Every value is a text field with the editor of its kind (param-kinds.js,
// param-editors.js; a list: JsonEditor.open). A change makes the component again with the new params, at the same place
// (BasicDesigner.recreate).

BasicDesigner.isPlain = function (v) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return false;
    const proto = Object.getPrototypeOf(v);
    return proto === null || Object.getPrototypeOf(proto) === null; // WHY: The objects come from the iframe (another Object).
};

// A value -> { text, editable }
BasicDesigner.paramText = function (v) {
    if (typeof v === "function") return { text: "ƒ function", editable: 0 };
    if (v === undefined) return { text: "", editable: 1 };
    if (v === null) return { text: "null", editable: 1 };
    if (typeof v === "string") return { text: v, editable: 1 };
    if (typeof v === "number" || typeof v === "boolean") return { text: String(v), editable: 1 };
    if (Array.isArray(v) || BasicDesigner.isPlain(v)) {
        try { return { text: JSON.stringify(v), editable: 1 }; } catch (e) { return { text: "[object]", editable: 0 }; }
    }
    return { text: "[" + ((v && v.constructor && v.constructor.name) || "object") + "]", editable: 0 };
};

// The text of a field -> a value of the same kind as the old one. Throws on a wrong value.
BasicDesigner.parseParam = function (text, old) {
    const t = String(text);
    if (typeof old === "number") {
        if (t.trim() !== "" && !isNaN(Number(t))) return Number(t);
        throw new Error("a number is needed");
    }
    if (typeof old === "boolean") return (t.trim() === "true" || t.trim() === "1");
    if (typeof old === "string") return t;
    if (Array.isArray(old) || BasicDesigner.isPlain(old)) return JSON.parse(t);
    // null / undefined: a JSON value when it reads as one (1, true, [..]), else the text.
    try { return JSON.parse(t); } catch (e) { return t; }
};

// THE PARAMETERS | BOX SWITCH of a component (G-004): a segmented item of the panel in the Box view, and
// the same look drawn by inspectSwitch in the Parameters view.
BasicDesigner.INSPECT_OPTIONS = [{ value: "params", text: "Parameters" }, { value: "box", text: "Box" }];

BasicDesigner.inspectSwitchItem = function (value) {
    return { key: "__inspect", type: "segmented", value: value, span: "full", options: BasicDesigner.INSPECT_OPTIONS };
};

// GROUP: The switch in the Parameters view, in the look of a segmented item of the panel (comp/property-panel.js)
BasicDesigner.inspectSwitch = function (left, top, width) {
    const C = BasicDesigner.colors;
    const ITEM_HEIGHT = 24;
    const ROUND = 5;
    const group = HGroup(left, top, width, ITEM_HEIGHT, { align: "left center", gap: 0, color: C.field, round: ROUND });
    group.role = "radiogroup";
    group.aria = { label: "Parameters or Box" };
        BasicDesigner.INSPECT_OPTIONS.forEach(function (option) {
            const isSelected = (option.value === "params");
            const seg = Label({ text: option.text, height: ITEM_HEIGHT, fontSize: 12, round: ROUND, textColor: isSelected ? C.text : C.soft });
            seg.grow = 1;
            seg.css = { flexBasis: "0px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.12s" };
            seg.color = isSelected ? C.bar : "transparent";
            seg.boxShadow = isSelected ? "inset 0 0 0 1px " + C.fieldBorderStrong : "none";
            seg.role = "radio";
            seg.aria = { checked: isSelected ? "true" : "false" };
            if (isSelected) return;
            seg.cursor = "pointer";
            seg.clickable = 1;
            seg.onHoverChange(function (self, isOver) { self.color = isOver ? C.fieldHover : "transparent"; });
            seg.on("click", function () {
                BasicDesigner.state.inspect = option.value;
                BasicDesigner.showProperties(BasicDesigner.state.selected);
            });
        });
    endGroup();
    return group;
};

BasicDesigner.showParams = function (obj) {

    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    const t = BasicDesigner.title(obj);
    const id = obj.__bd.id;

    ui.lblParamsTitle.text = BasicDesigner.esc((t.name ? t.name + "  ·  " : "") + t.type);
    if (document.activeElement !== ui.paramsName.inputElement) ui.paramsName.text = BasicDesigner.nameOf(obj);
    BasicDesigner.drawParamRows(obj); // param-editors.js
    ui.paramsNote.value = s.notes.get(id) || "";
    if (ui.paramsScrollBar && ui.paramsScrollBar.refreshScroll) ui.paramsScrollBar.refreshScroll();

};

BasicDesigner.getAt = function (object, path) {
    let o = object;
    for (let i = 0; i < path.length; i++) { if (o === null || o === undefined) return undefined; o = o[path[i]]; }
    return o;
};

// undefined: the key goes (a key the page added has no default to go back to).
BasicDesigner.setAt = function (object, path, value) {
    let o = object;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
    if (value === undefined) delete o[path[path.length - 1]];
    else o[path[path.length - 1]] = value;
};

BasicDesigner.applyParam = function (obj, path, text, oldValue) {
    let value;
    try {
        value = BasicDesigner.parseParam(text, oldValue);
    } catch (error) {
        BasicDesigner.setStatus(path.join(".") + ": " + error.message, "error");
        BasicDesigner.showParams(obj);
        return;
    }
    BasicDesigner.applyParamValue(obj, path, value);
};

// A new value of a parameter makes the component again. isLive: more changes are coming (a drag): the layers wait for the
// last one (finishParamLive). Returns the new component.
BasicDesigner.applyParamValue = function (obj, path, value, isLive) {

    const s = BasicDesigner.state;
    const id = obj.__bd.id;
    if (!s.paramOriginal.has(id)) s.paramOriginal.set(id, s.rt.cloneParams(obj.__bd.params));
    const params = s.rt.cloneParams(obj.__bd.params);
    // WHY the copy: a value of the designer becomes objects of the page (the code of a component may compare with them).
    BasicDesigner.setAt(params, path, s.rt.cloneParams(value));

    // A new styleName: the style of the page without the old package, plus the style values changed here.
    if (path.length === 1 && path[0] === "styleName" && obj.__bd.pageStyle !== undefined) {
        params.style = s.rt.cloneParams(obj.__bd.pageStyle || {});
        s.changes.forEach(function (c) {
            if (c.kind === "param" && c.obj === obj && c.path && c.path[0] === "style") {
                let o = params.style;
                for (let i = 1; i < c.path.length - 1; i++) o = o[c.path[i]] = (BasicDesigner.isPlain(o[c.path[i]]) ? o[c.path[i]] : {});
                o[c.path[c.path.length - 1]] = c.to;
            }
        });
    }

    const fresh = BasicDesigner.recreate(obj, params);
    if (!fresh) return null;
    // WHY: The params the component got (with the new package merged), not the ones given.
    if (fresh.__bd.capturedParams) fresh.__bd.params = fresh.__bd.capturedParams;

    // CHANGE: one per param (from = the value before the first change)
    const pathText = path.join(".");
    const original = BasicDesigner.getAt(s.paramOriginal.get(id), path);
    const changeId = id + ":param:" + pathText;
    BasicDesigner.carryChanges(obj, fresh); // The other changes of this component
    const entry = s.changes.get(changeId) || { obj: fresh, key: "param " + pathText, path: path.slice(), from: original, kind: "param", targets: new Map(), count: 1 };
    entry.obj = fresh;
    entry.to = value;
    if (JSON.stringify(entry.to) === JSON.stringify(entry.from)) s.changes.delete(changeId);
    else s.changes.set(changeId, entry);

    // WHY now: the panel is drawn below, and it must show the new component, not the removed one.
    if (s.selected === obj) s.selected = fresh;
    s.historyKey = changeId; // UNDO: the same key again soon is the same step (a drag in the color picker)
    BasicDesigner.refreshChanges();
    if (!isLive) BasicDesigner.refreshLayersAfterChange(fresh);
    return fresh;

};

// The layers are read again and the component is selected, unless another object was selected in the meantime.
BasicDesigner.refreshLayersAfterChange = function (fresh) {
    const s = BasicDesigner.state;
    const selectedNow = s.selected;
    BasicDesigner.refreshLayers().then(function () {
        if (fresh._isRemoved || s.selected !== selectedNow) return;
        BasicDesigner.select(fresh, "canvas");
    });
};

// Makes a component again with params, at the place of the old one, and removes the old one.
// NOTE: The variables of the page (Ex: tabsBasic) still point to the old (removed) one.
BasicDesigner.recreate = function (old, params) {

    const s = BasicDesigner.state;
    const win = s.win;
    const name = old.__bd.component;
    let factory = null;
    try { factory = win.eval("typeof " + name + " === 'function' ? " + name + " : null"); } catch (e) { }
    if (!factory) { BasicDesigner.setStatus("The component function " + name + " was not found.", "error"); return null; }

    const keep = s.rt.cloneParams(params); // WHY: The component changes the params it gets (merge, edits).
    let fresh = null;
    try {
        win.createIn(old.containerBox || win.page, function () { fresh = factory(params); });
    } catch (error) {
        BasicDesigner.setStatus("Could not make " + name + " again: " + error.message, "error");
        if (fresh && fresh.remove) fresh.remove();
        return null;
    }
    if (!fresh || !fresh.elem) return null;

    if (old.elem.parentNode && fresh.elem.parentNode === old.elem.parentNode) old.elem.parentNode.insertBefore(fresh.elem, old.elem);
    fresh.__bd.capturedParams = fresh.__bd.params; // The runtime copied them at the merge (with the package)
    fresh.__bd.frames = old.__bd.frames;
    fresh.__bd.component = name;
    fresh.__bd.id = old.__bd.id;
    fresh.__bd.params = keep;
    fresh.__bd.pageStyle = old.__bd.pageStyle;
    if (old.__bd.added) {
        fresh.__bd.added = old.__bd.added;
        const index = s.addedObjects.indexOf(old);
        if (index !== -1) s.addedObjects[index] = fresh;
    }
    old.remove();
    return fresh;

};

// The changes of a component made again (a param changed) go to the new one: its box values and its place are
// set on it again, and their "from" belongs to it. WHY: Only c.obj was moved: the values were lost on the
// screen (an opacity changed before a param), and Revert all wrote to the removed old object.
BasicDesigner.carryChanges = function (old, fresh) {
    BasicDesigner.state.changes.forEach(function (c) {
        if (c.obj === old) c.obj = fresh;
        if (c.targets && c.targets.has(old)) {
            c.targets.set(fresh, c.targets.get(old));
            c.targets.delete(old);
        }
        if (c.rawValues && c.rawValues.has(old)) {
            c.rawValues.set(fresh, c.rawValues.get(old));
            c.rawValues.delete(old);
        }
        if (c.obj !== fresh) return;
        if (c.kind === "sides") BasicDesigner.writeSides(fresh, c.to);
        if (!c.kind) {
            try { fresh[c.key] = c.to; } catch (error) { }
        }
    });
};

// *** THE PAGE: the page object of basic.js has a row of its own above the layers (its objects are not
// indented under it), a panel (its color, and a note for the AI about the whole project) and its own changes
// (state.pageChanges, state.projectNote): in Changes, the prompt, the saved session, Revert all and undo.

BasicDesigner.PAGE_ROW_HEIGHT = 26;
BasicDesigner.LAYERS_TOP = 36; // the Page row and the tree start here: under the one line header (68 before G-005)
BasicDesigner.PAGE_COLOR = "#E8B85C"; // the text of the Page row: not an object of the page
BasicDesigner.PAGE_ICON = "M2.5 2.5h11v11h-11zM2.5 5.5h11";

BasicDesigner.changeCount = function () {
    const s = BasicDesigner.state;
    return s.changes.size + s.notes.size + s.names.size + s.pageChanges.size + s.scriptChanges.size + ((s.projectNote) ? 1 : 0);
};

BasicDesigner.hasPageChanges = function () {
    const s = BasicDesigner.state;
    return s.pageChanges.size > 0 || s.scriptChanges.size > 0 || !!s.projectNote;
};

BasicDesigner.buildPageRow = function (top) {
    const ui = BasicDesigner.ui;
    // LABEL: Page (a click selects the page; an object dropped on it goes to the top level of the page)
    ui.pageRow = Label(0, top, "100%", BasicDesigner.PAGE_ROW_HEIGHT, { text: "", fontSize: 12, textColor: BasicDesigner.PAGE_COLOR, color: "transparent" });
    ui.pageRow.css = { display: "flex", alignItems: "center", gap: "6px", padding: "0px 10px", boxSizing: "border-box", whiteSpace: "nowrap" };
    ui.pageRow.clickable = 1;
    ui.pageRow.cursor = "pointer";
    ui.pageRow.role = "button";
    ui.pageRow.aria = { label: "Page: the page object, and notes for the whole project" };
    ui.pageRow.onHoverChange(function (self, isOver) {
        ui.pageRow.isHover = isOver;
        BasicDesigner.paintPageRow();
    });
    ui.pageRow.on("click", BasicDesigner.selectPage);
    BasicDesigner.paintPageRow();
};

BasicDesigner.paintPageRow = function () {
    const ui = BasicDesigner.ui;
    const s = BasicDesigner.state;
    const C = BasicDesigner.colors;
    if (!ui.pageRow) return;
    const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="' + BasicDesigner.PAGE_ICON + '"/></svg>';
    const mark = (BasicDesigner.hasPageChanges()) ? '<span style="color:' + C.dim + '">•</span>' : "";
    // (the name white, the icon keeps PAGE_COLOR)
    ui.pageRow.text = icon + "<span style=\"font-family:opensans-bold; color:" + C.text + "\">Page</span>" + mark;
    if (s.isPageSelected) ui.pageRow.color = C.selectedRow;
    else ui.pageRow.color = (ui.pageRow.isHover) ? C.hover : "transparent";
};

BasicDesigner.selectPage = function () {
    const s = BasicDesigner.state;
    if (!s.win || !s.win.page) return;
    BasicDesigner.select(null);
    s.isPageSelected = true;
    BasicDesigner.paintPageRow();
    BasicDesigner.showPageProperties();
};

BasicDesigner.pageValue = function (key) {
    const s = BasicDesigner.state;
    const change = s.pageChanges.get(key);
    return (change) ? change.to : s.win.page[key];
};

BasicDesigner.showPageProperties = function () {
    const ui = BasicDesigner.ui;
    const s = BasicDesigner.state;
    if (!ui.panel || !s.win) return;
    ui.paramsView.visible = 0;
    ui.panel.setData({
        headerTitle: "Page",
        sections: [{ key: "page", title: "Page", items: [
            { key: "page.color", type: "color", label: "Color", value: BasicDesigner.pageValue("color") || "", span: "full", placeholder: "transparent" },
        ] }],
        // WHY: The note is about the whole project, not this page alone: it goes at the top of the prompt.
        footer: { key: "projectNote", items: [
            { key: "__projectNote", type: "textarea", caption: "Notes for the AI · the whole project", rows: 4, value: s.projectNote, span: "full", placeholder: "Ex: a dark theme; every button 40 px high; the texts in Turkish" },
        ] },
    });
};

BasicDesigner.onPagePropertyChange = function (change) {
    const s = BasicDesigner.state;
    if (change.kind !== "value") return;
    if (change.key === "__projectNote") {
        s.projectNote = String(change.value || "").trim();
        BasicDesigner.refreshChanges();
        BasicDesigner.paintPageRow();
        return;
    }
    if (change.key.indexOf("page.") !== 0) return;
    BasicDesigner.applyPageValue(change.key.slice("page.".length), change.value);
    BasicDesigner.refreshChanges();
    BasicDesigner.paintPageRow();
};

BasicDesigner.applyPageValue = function (key, value) {
    const s = BasicDesigner.state;
    const page = s.win.page;
    const entry = s.pageChanges.get(key) || { from: page[key] };
    try {
        page[key] = value;
    } catch (error) {
        BasicDesigner.setStatus("Could not set page." + key + ": " + error.message, "error");
        return;
    }
    entry.to = value;
    if (String(entry.to) === String(entry.from)) s.pageChanges.delete(key);
    else s.pageChanges.set(key, entry);
};

BasicDesigner.pageValuesOfSession = function () {
    const list = [];
    BasicDesigner.state.pageChanges.forEach(function (c, key) { list.push({ key: key, to: c.to }); });
    return list;
};

// The project note and the changes of the page, at the top of the prompt.
BasicDesigner.pagePromptLines = function () {
    const s = BasicDesigner.state;
    const out = [];
    if (s.projectNote) {
        out.push("Notes for the whole project (keep them for every change, also in the other pages and components):");
        s.projectNote.split("\n").forEach(function (line) { out.push("   " + line); });
        out.push("");
    }
    if (s.pageChanges.size) {
        out.push("The page (the page object of basic.js, set in start()):");
        s.pageChanges.forEach(function (c, key) {
            out.push("   - page." + key + ": " + BasicDesigner.fmt(c.from) + " -> " + BasicDesigner.fmt(c.to));
        });
        out.push("");
    }
    BasicDesigner.scriptPromptLines().forEach(function (line) { out.push(line); });
    return out;
};

// The component files added / removed in the Components panel: the <script> lines of the page
BasicDesigner.scriptPromptLines = function () {
    const s = BasicDesigner.state;
    if (!s.scriptChanges.size) return [];
    const out = ["The component files of the page (the <script> lines in <head>, with the other component scripts, before the page code):"];
    s.scriptChanges.forEach(function (change, path) {
        const tag = '<script src="' + BasicDesigner.pathFromPage(path) + '" type="text/javascript" charset="utf-8"><\/script>';
        if (change === "add") out.push("   - add: " + tag);
        else out.push("   - remove the line that loads " + BasicDesigner.pathFromPage(path) + " (the page does not use it)");
    });
    out.push("   (keep the order: a file comes after the files it needs)");
    out.push("");
    return out;
};

// The Page in Changes: its changes and the project note. A click selects it.
BasicDesigner.createPageChangeRow = function () {
    const s = BasicDesigner.state;
    const C = BasicDesigner.colors;
    let html = '<span style="color:' + BasicDesigner.PAGE_COLOR + '">Page</span>';
    s.pageChanges.forEach(function (c, key) {
        html += "<br>&nbsp;&nbsp;" + BasicDesigner.esc(key + ": " + BasicDesigner.fmt(c.from) + " → " + BasicDesigner.fmt(c.to));
    });
    if (s.projectNote) html += '<br>&nbsp;&nbsp;<span style="color:#F5C04A">✎ ' + BasicDesigner.esc(s.projectNote) + "</span>";
    // LABEL: A row
    const row = Label({ width: "100%", height: "auto", text: html, fontSize: 12, textColor: C.soft, round: 4, color: "transparent" });
    row.css = { padding: "4px 6px", lineHeight: "17px", wordBreak: "break-word", position: "relative", boxSizing: "border-box" };
    row.shrink = 0;
    row.clickable = 1;
    row.cursor = "pointer";
    row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
    row.on("click", BasicDesigner.selectPage);
};

// An object dropped on the Page row: at the end of the top level of the page.
BasicDesigner.pageRowTarget = function () {
    const page = BasicDesigner.state.win && BasicDesigner.state.win.page;
    if (!BasicDesigner.canHold(page)) return null;
    return { area: "tree", container: page, before: null, row: BasicDesigner.ui.pageRow.elem.getBoundingClientRect(), inside: true };
};

// *** CHANGES:

BasicDesigner.changedObjects = function () {
    const s = BasicDesigner.state;
    const list = [];
    const add = function (obj) { if (list.indexOf(obj) === -1) list.push(obj); };
    s.changes.forEach(function (c) { add(c.obj); });
    // WHY: objectOfKey gives the newest object of the id: a component made again keeps its id, and the
    //      removed old one would be listed too (two rows and two items in the prompt for one component).
    s.notes.forEach(function (text, id) {
        const obj = BasicDesigner.objectOfKey(id);
        if (obj) add(obj);
    });
    s.names.forEach(function (name, id) {
        const obj = BasicDesigner.objectOfKey(id);
        if (obj) add(obj);
    });
    return list;
};

BasicDesigner.fmt = function (v) {
    if (typeof v === "string") return JSON.stringify(v);
    if (v !== null && typeof v === "object") return JSON.stringify(v); // [ ] and { } keep their shape
    return String(v);
};

// A value of a change as code. WHY listValue: the panel reads a list as a text ("14, 10"); the code has an array.
BasicDesigner.fmtValue = function (key, value) {
    if (BasicDesigner.LIST_PROPS[key]) value = BasicDesigner.listValue(value);
    return BasicDesigner.fmt(value);
};

BasicDesigner.refreshChanges = function () {

    const s = BasicDesigner.state;
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const count = BasicDesigner.changeCount();

    ui.lblChanges.text = "Changes" + (count ? "  (" + count + ")" : "");
    if (ui.lblChangesSummary) ui.lblChangesSummary.text = BasicDesigner.changesSummary(count);
    if (ui.btnBarRevert) ui.btnBarRevert.setEnabled(count > 0);
    BasicDesigner.refreshTopBar();
    BasicDesigner.refreshMarks();
    // WHY: A new change replaces the saved session of the page: the bar that offers it goes away.
    if (count && BasicDesigner.pendingSession && s.canSave) BasicDesigner.hideSessionBar();
    BasicDesigner.saveSession();
    if (ui.changeRows) ui.changeRows.remove();

    createIn(ui.changesBox, function () {
        ui.changeRows = VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [8, 4], color: "transparent" });
            if (!count) {
                Label({ text: "Change a property or write a note.", fontSize: 12, textColor: C.dim });
            }
            if (BasicDesigner.hasPageChanges()) BasicDesigner.createPageChangeRow();
            BasicDesigner.changedObjects().forEach(BasicDesigner.createChangeRow);
        endGroup();
    });

    BasicDesigner.setChangeButtonsEnabled(count > 0);
    BasicDesigner.markEmptyBoxes(); // WHY: a new color (or a new object) changes which boxes are empty

};

// The lines of the changes of an object (HTML, the values escaped).
BasicDesigner.changeLinesOf = function (obj) {
    const C = BasicDesigner.colors;
    const s = BasicDesigner.state;
    const lines = [];
    const colored = function (color, text) { return '<span style="color:' + color + '">' + text + "</span>"; };
    s.changes.forEach(function (c) {
        if (c.obj !== obj) return;
        if (c.kind === "add") lines.push(colored(C.accentLight, "+ added"));
        else if (c.kind === "move") lines.push(colored(C.accentLight, "↕ moved"));
        else if (c.kind === "delete") lines.push(colored("#EF6B6A", "✕ deleted"));
        else if (c.kind === "sides") {
            BasicDesigner.sidesDiff(c.from, c.to).forEach(function (d) {
                lines.push(BasicDesigner.esc(d.key + ": " + d.from + " → " + d.to));
            });
        } else {
            const times = (c.count > 1) ? "  (×" + c.count + ")" : "";
            lines.push(BasicDesigner.esc(c.key + ": " + BasicDesigner.fmtValue(c.key, c.from) + " → " + BasicDesigner.fmtValue(c.key, c.to) + times));
        }
    });
    if (s.names.has(obj.__bd.id)) lines.push(BasicDesigner.esc("name: " + (BasicDesigner.baseNameOf(obj) || "(none)") + " → " + s.names.get(obj.__bd.id)));
    if (s.notes.has(obj.__bd.id)) lines.push(colored("#F5C04A", "✎ " + BasicDesigner.esc(s.notes.get(obj.__bd.id))));
    return lines;
};

BasicDesigner.REVERT_ICON = "M3 8a5 5 0 1 0 1.5-3.6M3 2.5v3h3";

// One object in Changes: its name, its type and the lines. A click selects it; ↺ (on hover) puts it back.
BasicDesigner.createChangeRow = function (obj) {

    const C = BasicDesigner.colors;
    const t = BasicDesigner.title(obj);
    const isDeleted = !obj.elem.isConnected;
    let html = '<span style="color:' + C.text + '">' + BasicDesigner.esc(t.short) + "</span>";
    html += '<span style="color:' + C.soft + ';margin-left:6px">' + BasicDesigner.esc(t.type) + "</span>";
    BasicDesigner.changeLinesOf(obj).forEach(function (line) { html += "<br>&nbsp;&nbsp;" + line; });

    // GROUP: A row (the text, the revert button)
    const row = HGroup({ width: "100%", height: "auto", align: "left top", gap: 4, color: "transparent", round: 4, position: "relative" });
    row.clickable = 1;
    row.cursor = "pointer";
    row.opacity = (isDeleted) ? 0.6 : 1;

        // LABEL: The text
        const lbl = Label({ width: "auto", height: "auto", text: html, fontSize: 12, textColor: C.soft });
        lbl.grow = 1;
        lbl.css = { padding: "4px 0px 4px 6px", lineHeight: "17px", wordBreak: "break-word", minWidth: "0px" };

        const btnRevert = BasicDesigner.iconButton({
            path: BasicDesigner.REVERT_ICON,
            name: (obj.__bd.added) ? "Remove it" : "Revert this object",
            description: (obj.__bd.added) ? "It was added here: it goes away." : "Only the changes of this object go back. (Undo brings them again.)",
            size: 24,
            iconSize: 14,
            onClick: function () { BasicDesigner.revertObject(obj); },
        });
        btnRevert.opacity = 0;

    endGroup();

    row.onHoverChange(function (self, isOver) {
        row.color = (isOver) ? C.hover : "transparent";
        btnRevert.opacity = (isOver) ? 1 : 0;
    });
    row.on("click", function (self, event) {
        if (btnRevert.elem.contains(event.target)) return;
        if (isDeleted) {
            BasicDesigner.setStatus(t.short + " is deleted. Undo, or ↺ on its row, brings it back.");
            return;
        }
        BasicDesigner.select(obj, "canvas");
    });

};

// Copy prompt (both) and Revert all: pale and not clickable when there is nothing to copy or to put back.
BasicDesigner.setChangeButtonsEnabled = function (isEnabled) {
    const ui = BasicDesigner.ui;
    [ui.btnCopy, ui.btnTopCopy, ui.btnSend, ui.btnTopSend, ui.btnRevertAll, ui.btnBarCopy, ui.btnBarSend].forEach(function (btn) {
        if (!btn) return;
        btn.opacity = (isEnabled) ? 1 : 0.4;
        btn.clickable = (isEnabled) ? 1 : 0;
        btn.cursor = (isEnabled) ? "pointer" : "default";
    });
};

// Only the changes of one object go back: the page is made again without them (the same way as undo),
// so it is one more step in the undo history. An object added here is removed.
BasicDesigner.revertObject = function (obj) {
    if (obj.__bd.added) {
        BasicDesigner.deleteObject(obj);
        return;
    }
    const ref = JSON.stringify(BasicDesigner.refOf(obj));
    const isIt = function (target) { return !!target && JSON.stringify(target) === ref; };
    const session = BasicDesigner.buildSession();
    session.values = session.values.filter(function (v) { return !isIt(v.target); });
    session.params = session.params.filter(function (v) { return !isIt(v.target); });
    session.sides = session.sides.filter(function (v) { return !isIt(v.target); });
    session.notes = session.notes.filter(function (v) { return !isIt(v.target); });
    session.names = session.names.filter(function (v) { return !isIt(v.target); });
    session.places = session.places.filter(function (op) { return op.kind === "add" || !isIt(op.target); });
    session.count = session.values.length + session.params.length + session.sides.length + session.notes.length + session.names.length + session.places.length;
    BasicDesigner.goToSession(session);
    BasicDesigner.setStatus(BasicDesigner.title(obj).short + ": its changes are back to the code. (Undo: Cmd/Ctrl+Z)");
};

BasicDesigner.revertAll = function () {
    const s = BasicDesigner.state;
    BasicDesigner.closeParamEditors(); // WHY: an open window holds a value that is gone now
    // The components: made again with their first params.
    s.paramOriginal.forEach(function (params, id) {
        const current = BasicDesigner.objectOfKey(id);
        if (current && s.rt.isAlive(current)) {
            const fresh = BasicDesigner.recreate(current, s.rt.cloneParams(params));
            if (fresh && s.selected === current) s.selected = fresh;
        }
    });
    s.paramOriginal.clear();
    // The moved and the deleted objects go back to their places, the newest change first.
    Array.from(s.changes.values()).reverse().forEach(function (c) {
        if (c.kind === "move" || c.kind === "delete") BasicDesigner.restorePlace(c.obj, c.from);
        if (c.kind === "sides") BasicDesigner.writeSides(c.obj, c.from);
    });
    // The objects added in the designer are removed. (Their other changes need nothing then.)
    s.changes.forEach(function (c) {
        if (c.kind !== "add") return;
        if (s.selected === c.obj) s.selected = null;
        c.obj.remove();
    });
    // WHY: The newest first: setting a side clears the opposite one (left / right), so the order matters.
    Array.from(s.changes.values()).reverse().forEach(function (c) {
        if (c.kind) return; // The value changes only (params, places and sides are put back above)
        c.targets.forEach(function (from, o) {
            if (c.rawValues && c.rawValues.has(o)) {
                BasicDesigner.restoreRawValue(o, c.key, c.rawValues.get(o));
                return;
            }
            try { o[c.key] = from; } catch (error) { }
        });
    });
    s.pageChanges.forEach(function (c, key) {
        try { s.win.page[key] = c.from; } catch (error) { }
    });
    s.pageChanges.clear();
    s.scriptChanges.clear(); // (a file loaded into the canvas stays there until the page is loaded again)
    s.projectNote = "";
    s.changes.clear();
    s.notes.clear();
    s.names.clear();
    s.placeLog = [];
    s.addedObjects = [];
    BasicDesigner.refreshChanges();
    BasicDesigner.refreshLayers();
    BasicDesigner.paintPageRow();
    BasicDesigner.showProperties(s.selected);
};

BasicDesigner.buildPrompt = function () {

    const s = BasicDesigner.state;
    const objects = BasicDesigner.changedObjects();
    if (!objects.length && !BasicDesigner.hasPageChanges()) return "";

    const out = [];
    out.push("Visual changes made in basic-designer on the page " + s.pagePath + ".");
    out.push("Apply them to the source code, in the style of the code around them. When a value comes from an expression, a loop, a helper function, a theme token or a component default, choose the right place (the page code, the component params or its style) and tell me what you changed. The notes are wishes: do what they ask.");
    const hasAutoNames = objects.some(BasicDesigner.isAutoName);
    if (hasAutoNames) out.push("Names like btn12 or box45 are automatic (the designer gave them): give each one a name that says what the object is (Ex: btnSave, cardProfile) and use it everywhere.");
    out.push("");
    BasicDesigner.pagePromptLines().forEach(function (line) { out.push(line); });

    objects.forEach(function (obj, i) {
        const t = BasicDesigner.title(obj);
        const f = obj.__bd.frames;
        // WHY the base name for an object of the code: the code knows it by that name (a new name is a change below)
        const headName = (obj.__bd.added) ? t.name : BasicDesigner.baseNameOf(obj);
        let head = (i + 1) + ". " + t.type + (headName ? " " + headName : "");
        if (t.text) head += ' (text: "' + t.text + '")';
        if (obj.__bd.added) {
            out.push(head + "   NEW: added in the designer");
            BasicDesigner.addedPromptLines(obj).forEach(function (line) { out.push(line); });
            s.changes.forEach(function (c) {
                if (c.obj !== obj || c.kind === "add") return;
                if (c.kind === "sides") {
                    BasicDesigner.sidesDiff(c.from, c.to).forEach(function (d) { out.push("   - then " + d.key + ": " + d.to); });
                    return;
                }
                out.push("   - then " + c.key + ": " + BasicDesigner.fmtValue(c.key, c.to));
            });
            if (s.notes.has(obj.__bd.id)) out.push("   - note: " + s.notes.get(obj.__bd.id));
            out.push("");
            return;
        }
        out.push(head);
        if (obj.__bd.component && f.length > 1) {
            const used = BasicDesigner.nameFrame(obj);
            out.push("   the component " + t.type + " used at: " + BasicDesigner.where(used) + "   " + BasicDesigner.sourceLine(used).trim());
            const boxChanges = Array.from(s.changes.values()).some(function (c) { return c.obj === obj && c.kind !== "param"; });
            if (boxChanges) out.push("   (the changes without \"param\" are properties of its root box; a component may set them again itself)");
        } else {
            out.push("   created at: " + BasicDesigner.where(f[0]) + "   " + BasicDesigner.sourceLine(f[0]).trim());
        }
        // WHY: For a component the line that uses it is already given; its root box line makes every one of that kind.
        const chain = obj.__bd.component ? [] : BasicDesigner.chain(obj, 3);
        if (chain.length) out.push("   called from: " + chain.join(" <- "));
        const same = obj.__bd.component ? 1 : BasicDesigner.sameLineCount(obj);
        if (same > 1) out.push("   (this line creates " + same + " objects: a loop, a helper or a component)");
        const owner = BasicDesigner.componentOf(obj);
        if (owner && !obj.__bd.component && BasicDesigner.relPath(f[0].url) !== s.pagePath) {
            const name = owner.__bd.component;
            out.push("   inside the component " + name + " (" + BasicDesigner.relPath(f[0].url) + "): a value like this usually comes from " + name + "Defaults.style; change it there and keep the other style packages (" + name + ".styles) consistent, unless only this variant should change.");
        }
        if (s.names.has(obj.__bd.id)) out.push(BasicDesigner.renamePromptLine(obj));
        const hasParams = Array.from(s.changes.values()).some(function (c) { return c.obj === obj && c.kind === "param"; });
        if (hasParams) out.push("   (param: change it in the params of this call; when every " + t.type + " should change, in " + t.type + "Defaults and the style packages " + t.type + ".styles)");
        s.changes.forEach(function (c) {
            if (c.obj !== obj) return;
            if (c.kind === "move") {
                out.push("   - move it: now " + BasicDesigner.describePlace(obj) + "   (it was " + c.oldDescription + ")");
                return;
            }
            if (c.kind === "delete") {
                out.push("   - delete it (it was " + c.place + "). Delete what creates it, and the code that uses it.");
                return;
            }
            if (c.kind === "sides") {
                BasicDesigner.sidesDiff(c.from, c.to).forEach(function (d) {
                    out.push("   - " + d.key + ": " + d.from + " -> " + d.to);
                });
                return;
            }
            let line = "   - " + c.key + ": " + BasicDesigner.fmtValue(c.key, c.from) + " -> " + BasicDesigner.fmtValue(c.key, c.to);
            if (c.key === "picture") line = "   - picture (the file of the Icon: that.load(\"...\")): " + BasicDesigner.fmt(BasicDesigner.shortPicture(c.from)) + " -> " + BasicDesigner.fmt(c.to);
            if (c.count > 1) line += "   (seen on all " + c.count + " objects of this line)";
            out.push(line);
        });
        if (s.notes.has(obj.__bd.id)) out.push("   - note: " + s.notes.get(obj.__bd.id));
        out.push("");
    });

    return out.join("\n");

};

// *** TOOLBOX: new objects
// A new object is made on the page at once (it can be selected and changed like the others) and goes into
// Changes as "added": the prompt says where to add it in the code and with which line.

BasicDesigner.toolboxItems = [
    // WHY: The defaults of basic.js (a group: 100% x 100%, transparent), as the code would make them. Only a text
    //      for Label / Button, and a size for Icon (0 x 0 by default: not seen).
    { type: "Box", description: "An empty box. The objects in it are placed with left and top.", props: {} },
    { type: "VGroup", description: "A vertical group: its objects stand one under the other.", props: {} },
    { type: "HGroup", description: "A horizontal group: its objects stand side by side.", props: {} },
    { type: "Label", description: "A text. Its size grows with the text.", props: { text: "New label" } },
    { type: "Button", description: "A button with a text. on(\"click\") runs your code.", props: { text: "Button" } },
    { type: "Input", description: "A text box the user writes in.", props: {} },
    { type: "Icon", description: "A picture: a PNG, an SVG file or a data URI (load).", props: { width: 48, height: 48 } },
];

BasicDesigner.NEW_OBJECT_SPACE = 20; // left / top of a new object in a Box (not a group)
BasicDesigner.PLACEHOLDER_PICTURE = "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#E8EEF3" stroke="#9AA4AD" stroke-width="1">' +
    '<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><circle cx="5.5" cy="6.5" r="1.3"/><path d="M2 12l3.5-3.5 2.5 2.5 2-2 3.5 3.5" fill="none"/></svg>');

BasicDesigner.isContainerType = function (type) {
    return type === "Box" || type === "VGroup" || type === "HGroup";
};

// The props as code: { text: "Button", width: 120 }
BasicDesigner.propsCode = function (props) {
    const parts = Object.keys(props).map(function (key) {
        return key + ": " + BasicDesigner.fmt(props[key]);
    });
    if (!parts.length) return "{}";
    return "{ " + parts.join(", ") + " }";
};

// The container that holds the objects of the page: the first box, and the only box in it while there is one.
BasicDesigner.mainContainer = function () {
    const s = BasicDesigner.state;
    let nodes = s.tree;
    let container = null;
    while (nodes.length === 1 && BasicDesigner.isContainerType(BasicDesigner.typeOf(nodes[0].obj))) {
        container = nodes[0].obj;
        nodes = nodes[0].children;
    }
    if (container) return container;
    const first = s.tree.find(function (node) { return BasicDesigner.isContainerType(BasicDesigner.typeOf(node.obj)); });
    return (first) ? first.obj : s.win.page;
};

// The basic.js objects directly in a container, in their order on the page.
BasicDesigner.childObjects = function (container) {
    const list = [];
    for (let i = 0; i < container.elem.children.length; i++) {
        const obj = container.elem.children[i]._basicObject;
        if (obj && obj.__bd) list.push(obj);
    }
    return list;
};

// The object before obj in its container, or null (obj is the first one).
BasicDesigner.previousObject = function (obj) {
    const siblings = BasicDesigner.childObjects(obj.containerBox);
    const index = siblings.indexOf(obj);
    return (index > 0) ? siblings[index - 1] : null;
};

BasicDesigner.nextObject = function (obj) {
    if (!obj.containerBox) return null;
    const siblings = BasicDesigner.childObjects(obj.containerBox);
    return siblings[siblings.indexOf(obj) + 1] || null;
};

// A Box or a group that the page made (not the inside of a component): a new object can go in it.
BasicDesigner.isPlainContainer = function (obj) {
    if (!obj || !obj.__bd || obj.__bd.component) return false;
    if (BasicDesigner.componentOf(obj)) return false;
    return BasicDesigner.isContainerType(BasicDesigner.typeOf(obj));
};

// The object that is moved instead of obj: the root of its component (the inside of a component is made by its code).
BasicDesigner.movableOf = function (obj) {
    if (!obj || !obj.__bd) return null;
    return BasicDesigner.componentOf(obj) || obj;
};

// Where a new object goes after a click on the toolbox: { container, before }. before: null -> at the end.
BasicDesigner.placeForNew = function (selected) {
    if (!selected || !selected.elem.isConnected) return { container: BasicDesigner.mainContainer(), before: null };
    const target = BasicDesigner.movableOf(selected);
    if (BasicDesigner.isPlainContainer(target)) return { container: target, before: null };
    return { container: target.containerBox || BasicDesigner.state.win.page, before: BasicDesigner.nextObject(target) };
};

// MANUAL MODE: a new object at 0, 0 of the container, over its other objects (the last one), also in a group.
BasicDesigner.manualPlaceIn = function (container) {
    return { container: container, before: null, point: { x: 0, y: 0 }, isManual: true };
};

// A manual object (position: absolute) in a group: it keeps that place when it is copied or moved in the layers.
BasicDesigner.isManualInGroup = function (obj) {
    return !!(obj.containerBox && obj.containerBox._isFlex && BasicDesigner.isManual(obj));
};

// Makes the object with the basic.js of the page (the iframe), in the container.
BasicDesigner.BASIC_TYPES = ["Box", "VGroup", "HGroup", "Label", "Button", "Input", "Icon"];

BasicDesigner.createInPage = function (type, props, container) {
    const w = BasicDesigner.state.win;
    if (BasicDesigner.BASIC_TYPES.indexOf(type) === -1) {
        // A component: its function in the page (Tabs, SelectBox...). It gets a copy (a component changes its params).
        const factory = w.eval("typeof " + type + " === 'function' ? " + type + " : null");
        if (!factory) throw new Error("The component " + type + " is not loaded by the page.");
        return w.createIn(container, function () { return factory(JSON.parse(JSON.stringify(props))); });
    }
    return w.createIn(container, function () {
        // WHY a copy: a group writes its flex styles into its props (flexDirection, alignItems...): they went into the
        //      code of the prompt.
        const obj = w[type](Object.assign({}, props));
        if (type === "VGroup" || type === "HGroup") w.endGroup();
        if (type === "Icon") obj.load(BasicDesigner.PLACEHOLDER_PICTURE);
        return obj;
    });
};

// Puts obj into place.container, before place.before. In a Box (not a group) at place.point or its own left / top.
// place.isManual: in a group too (manual mode). A manual object that only changes its order in its box (bring to front,
// the layers) stays manual. WHY: it became a part of the flow of its group and jumped to another place.
BasicDesigner.putInPlace = function (obj, place) {
    const container = place.container;
    const before = (place.before && place.before !== obj) ? place.before.elem : null;
    const staysManual = place.isManual || (obj.containerBox === container && obj.elem.isConnected && BasicDesigner.isManual(obj));
    container.elem.insertBefore(obj.elem, before);
    obj.parentBox = container;
    if (container._isFlex && !staysManual) {
        // WHY: The same styles basic.js gives an object made in a group (a flex item).
        obj.css = { position: "relative", left: "0px", top: "0px" };
        return;
    }
    obj.css.position = "absolute";
};

BasicDesigner.addObject = function (item) {
    const s = BasicDesigner.state;
    const place = BasicDesigner.placeForNew(s.selected);
    BasicDesigner.addObjectAt(item, (s.isManualMode) ? BasicDesigner.manualPlaceIn(place.container) : place);
};

BasicDesigner.addObjectAt = function (item, place) {

    const s = BasicDesigner.state;
    if (!s.rt || !s.win) {
        BasicDesigner.setStatus("Load a page first.");
        return;
    }

    const props = Object.assign({}, item.props);
    // WHY: In a Box (not a group) an object without left / top is at -1000 (the default of basic.js).
    if (!place.container._isFlex || place.isManual) {
        const point = place.point || { x: BasicDesigner.NEW_OBJECT_SPACE, y: BasicDesigner.NEW_OBJECT_SPACE };
        props.left = Math.round(point.x);
        props.top = Math.round(point.y);
    }
    // WHY: basic.js makes an object of a group a part of its flow (relative); the code must say it is not.
    if (place.isManual && place.container._isFlex) props.position = "absolute";

    // A component of another page that this page does not load: its file is loaded into the page first
    const missingScript = BasicDesigner.loadMissingComponent(item);
    let obj = null;
    try {
        obj = BasicDesigner.createInPage(item.type, props, place.container);
    } catch (error) {
        BasicDesigner.setStatus("Could not add " + item.type + ": " + error.message, "error");
        return;
    }
    // (before the object is on the page: it does not count its own name)
    const name = item.name || BasicDesigner.newNameFor(item.type);
    BasicDesigner.logPlace("add", { type: item.type, place: place, props: item.props, copyOf: item.copyOf, script: item.script, name: name });
    BasicDesigner.putInPlace(obj, { container: place.container, before: place.before, isManual: place.isManual });

    obj.__bd.added = { type: item.type, props: props, copyOf: item.copyOf || "", script: missingScript, name: name };
    s.addedObjects.push(obj);
    s.changes.set("add:" + obj.__bd.id, { obj: obj, kind: "add", key: "added", targets: new Map(), count: 1 });
    BasicDesigner.afterPlaceChange(obj);
    // WHY: 0, 0 of a box that scrolls may be out of sight (manual mode)
    if (place.isManual && !s.isReplaying) obj.elem.scrollIntoView({ block: "nearest", inline: "nearest" });
    const loadedNote = (missingScript) ? " (this page did not load it: its file " + missingScript + " is loaded here; the prompt asks for its <script>)" : "";
    BasicDesigner.setStatus(item.type + " added" + loadedNote + ". Change it on the right; Copy prompt writes it into the code.");

};

// The layers, the changes and the selection after an object was added, moved or deleted.
BasicDesigner.afterPlaceChange = function (obj) {
    const s = BasicDesigner.state;
    if (s.isReplaying) return; // WHY: applySession refreshes once at the end.
    if (obj && obj.containerBox && obj.containerBox.__bd) s.expanded.add(obj.containerBox.__bd.id);
    BasicDesigner.refreshChanges();
    BasicDesigner.refreshLayers().then(function () {
        BasicDesigner.select(obj && obj.elem.isConnected ? obj : null, "toolbox");
    });
};

// The place of an added object for the prompt: "inside VGroup main (created at x.htm:12), after Label title (...)"
BasicDesigner.describeObject = function (obj) {
    const s = BasicDesigner.state;
    if (!obj || obj === s.win.page) return "the page (page)";
    const t = BasicDesigner.title(obj);
    if (obj.__bd.added) return t.type + " " + t.short + " (also added in the designer)";
    const frame = BasicDesigner.nameFrame(obj);
    const text = (t.text) ? ' "' + t.text + '"' : "";
    const codeName = BasicDesigner.baseNameOf(obj);
    return t.type + (codeName ? " " + codeName : "") + text + " (created at " + BasicDesigner.where(frame) + "   " + BasicDesigner.sourceLine(frame).trim() + ")";
};

// "inside VGroup ... (created at ...), right after Label ..." : where obj is now.
BasicDesigner.describePlace = function (obj) {
    const after = BasicDesigner.previousObject(obj);
    let text = "inside " + BasicDesigner.describeObject(obj.containerBox);
    text += (after) ? ", right after " + BasicDesigner.describeObject(after) : ", as its first object";
    return text;
};

// A new name for an object of the code
BasicDesigner.renamePromptLine = function (obj) {
    const base = BasicDesigner.baseNameOf(obj);
    const name = BasicDesigner.state.names.get(obj.__bd.id);
    if (!base) return "   - name it " + name + " (it has no name in the code: keep it in a const or a property, as the code around it does)";
    return "   - rename it: " + base + " -> " + name + " (every use of " + base + " too)";
};

BasicDesigner.addedPromptLines = function (obj) {
    const added = obj.__bd.added;
    const name = BasicDesigner.nameOf(obj);
    const lines = [];
    lines.push("   add it " + BasicDesigner.describePlace(obj));
    const isComponent = BasicDesigner.BASIC_TYPES.indexOf(added.type) === -1;
    if (added.copyOf && isComponent) lines.push("   (a copy of " + added.copyOf + ": the same parameters; give it the callbacks (onClick...) of the first one if it needs them)");
    else if (added.copyOf) lines.push("   (a copy of " + added.copyOf + ": the same look; the objects in it are added one by one below)");
    let code = "   - code: " + added.type + "(" + BasicDesigner.propsCode(added.props) + ");";
    if (added.type === "VGroup" || added.type === "HGroup") code += " ... endGroup();";
    if (added.type === "Icon") code += "  then load the picture: that.load(\"...\");";
    lines.push(code);
    if (BasicDesigner.isAutoName(obj)) lines.push("   - name: " + name + " (automatic: give it a name that says what it is)");
    else lines.push("   - name: " + name);
    if (added.props.left !== undefined) lines.push("   (left / top: where it was dropped; choose the right place in the code)");
    if (added.script) lines.push("   the page does not load " + added.type + " yet: add <script src=\"" + BasicDesigner.pathFromPage(added.script) + "\" type=\"text/javascript\" charset=\"utf-8\"></script> with the other component scripts (before the page code), and the files it needs (its header says)");
    return lines;
};

// *** SESSION: the changes and the notes of a page are kept in basic.storage, so a reload does not lose them.
// An object is found again by the line that made it and its place among the objects of that line (by id: a component
// made again keeps its id). An object added in the designer is the index of its "add" in the session.

BasicDesigner.SESSION_KEY = "basic-designer-session:";

BasicDesigner.sessionKey = function () {
    return BasicDesigner.SESSION_KEY + BasicDesigner.state.pagePath;
};

BasicDesigner.frameKey = function (frame) {
    return BasicDesigner.relPath(frame.url) + ":" + frame.line + ":" + frame.col;
};

// The objects made by the same line, by their id (the order they were made in).
BasicDesigner.objectsOfFrame = function (key) {
    return BasicDesigner.state.rt.objects.filter(function (o) {
        const frame = o.__bd.frames[0];
        return !o._isRemoved && frame && BasicDesigner.frameKey(frame) === key;
    }).sort(function (a, b) { return a.__bd.id - b.__bd.id; });
};

BasicDesigner.refOf = function (obj) {
    const s = BasicDesigner.state;
    if (!obj || obj === s.win.page) return { page: 1 };
    if (obj.__bd.added) return { added: s.addedObjects.indexOf(obj) };
    const frame = obj.__bd.frames[0];
    if (!frame) return { id: obj.__bd.id };
    const at = BasicDesigner.frameKey(frame);
    return { at: at, rank: BasicDesigner.objectsOfFrame(at).indexOf(obj), type: BasicDesigner.refType(BasicDesigner.typeOf(obj)) };
};

// The type of a ref. WHY: A group is "VGroup" or "HGroup" by its flow: a flow change made its ref point at
// nothing after Revert all (undo, redo and the saved session lost the change). Both are "Group" in a ref.
BasicDesigner.refType = function (type) {
    return (type === "VGroup" || type === "HGroup") ? "Group" : type;
};

BasicDesigner.objectOfRef = function (ref) {
    const s = BasicDesigner.state;
    if (!ref) return null;
    if (ref.page) return s.win.page;
    if (ref.added !== undefined) return s.addedObjects[ref.added] || null;
    if (ref.id !== undefined) return BasicDesigner.objectOfKey(ref.id);
    const obj = BasicDesigner.objectsOfFrame(ref.at)[ref.rank];
    // WHY: refType on both sides: the sessions saved before it have "VGroup" / "HGroup".
    if (!obj || BasicDesigner.refType(BasicDesigner.typeOf(obj)) !== BasicDesigner.refType(ref.type)) return null;
    return obj;
};

// The same change after a reload (its id is new): kind | object | key.
BasicDesigner.changeName = function (c) {
    return (c.kind || "value") + "|" + JSON.stringify(BasicDesigner.refOf(c.obj)) + "|" + (c.key || "");
};

BasicDesigner.saveSession = function () {
    const s = BasicDesigner.state;
    if (!s.canSave || !s.rt) return;
    const session = BasicDesigner.buildSession();
    BasicDesigner.pushHistory(session);
    if (!session.count) {
        basic.storage.remove(BasicDesigner.sessionKey());
        return;
    }
    basic.storage.save(BasicDesigner.sessionKey(), session);
};

// Everything changed on the page as plain data (a copy: it does not change with the page).
BasicDesigner.buildSession = function () {

    const s = BasicDesigner.state;
    const count = BasicDesigner.changeCount();
    const entries = Array.from(s.changes.values());
    const session = {
        savedAt: Date.now(),
        count: count,
        places: s.placeLog, // add / move / delete, in the order they were done
        params: [],
        sides: [],
        values: [],
        notes: [],
        names: [],
        order: entries.map(BasicDesigner.changeName), // the order of Changes and the prompt
        page: { values: BasicDesigner.pageValuesOfSession(), note: s.projectNote },
    };
    entries.forEach(function (c) {
        if (c.kind === "param") session.params.push({ target: BasicDesigner.refOf(c.obj), path: c.path, to: c.to });
        if (c.kind === "sides") session.sides.push({ target: BasicDesigner.refOf(c.obj), to: c.to });
        if (!c.kind) session.values.push({ target: BasicDesigner.refOf(c.obj), key: c.key, to: c.to, targets: Array.from(c.targets.keys()).map(BasicDesigner.refOf) });
    });
    s.notes.forEach(function (text, id) {
        session.notes.push({ target: BasicDesigner.refOf(BasicDesigner.objectOfKey(id)), text: text });
    });
    s.names.forEach(function (name, id) {
        session.names.push({ target: BasicDesigner.refOf(BasicDesigner.objectOfKey(id)), name: name });
    });

    return JSON.parse(JSON.stringify(session));

};

// *** UNDO / REDO: every state of the changes is a session; undo makes the one before it again
// (Revert all, then the replay of that session: the same code as a reload).

BasicDesigner.HISTORY_LIMIT = 100;
BasicDesigner.HISTORY_MERGE_TIME = 600; // ms: changes of the same property this close are one undo step (a scrub, a drag)

BasicDesigner.historyText = function (session) {
    const copy = Object.assign({}, session);
    delete copy.savedAt;
    return JSON.stringify(copy);
};

BasicDesigner.pushHistory = function (session) {
    const s = BasicDesigner.state;
    if (s.isUndoing) return;
    const last = s.history[s.history.length - 1];
    if (last && BasicDesigner.historyText(last) === BasicDesigner.historyText(session)) return;
    // WHY: A scrub of a number field sends a change for every pixel: one step for all of them, not one per pixel.
    const now = Date.now();
    const isSameChange = s.historyKey && s.historyKey === s.lastHistoryKey && now - s.lastHistoryTime < BasicDesigner.HISTORY_MERGE_TIME;
    s.lastHistoryKey = s.historyKey;
    s.lastHistoryTime = now;
    s.historyKey = null;
    if (isSameChange && s.history.length > 1) s.history.pop();
    s.history.push(session);
    if (s.history.length > BasicDesigner.HISTORY_LIMIT) s.history.shift();
    s.redoList = [];
    BasicDesigner.refreshTopBar();
};

BasicDesigner.undo = function () {
    const s = BasicDesigner.state;
    if (s.history.length < 2) {
        BasicDesigner.setStatus("Nothing to undo.");
        return;
    }
    s.redoList.push(s.history.pop());
    BasicDesigner.goToSession(s.history[s.history.length - 1]);
    BasicDesigner.setStatus("Undo.  (Redo: Shift+Cmd+Z)");
};

BasicDesigner.redo = function () {
    const s = BasicDesigner.state;
    if (!s.redoList.length) {
        BasicDesigner.setStatus("Nothing to redo.");
        return;
    }
    const session = s.redoList.pop();
    s.history.push(session);
    BasicDesigner.goToSession(session);
    BasicDesigner.setStatus("Redo.");
};

// The page as it was in this session: the changes are put back, then the session is made again.
BasicDesigner.goToSession = function (session) {
    const s = BasicDesigner.state;
    const selectedRef = (s.selected) ? BasicDesigner.refOf(s.selected) : null;
    BasicDesigner.closeParamEditors();
    s.isUndoing = true;
    BasicDesigner.revertAll();
    if (session.count) BasicDesigner.applySession(session);
    s.isUndoing = false;
    BasicDesigner.saveSession(); // WHY: The saved session follows the page (pushHistory skips: it is the same).
    BasicDesigner.refreshTopBar();
    const selected = BasicDesigner.objectOfRef(selectedRef);
    BasicDesigner.refreshLayers().then(function () {
        BasicDesigner.select(selected && selected.elem.isConnected ? selected : null, "canvas");
    });
};

// An add / move / delete for the session: where, with refs (they work after a reload).
BasicDesigner.logPlace = function (kind, values) {
    const s = BasicDesigner.state;
    const place = values.place || {};
    s.placeLog.push({
        kind: kind,
        type: values.type,
        target: values.obj ? BasicDesigner.refOf(values.obj) : null,
        container: place.container ? BasicDesigner.refOf(place.container) : null,
        before: place.before ? BasicDesigner.refOf(place.before) : null,
        point: place.point || null,
        isManual: place.isManual || false, // manual mode: in a group too, at the point
        props: values.props || null, // add: the props (a copy has its own)
        copyOf: values.copyOf || null, // add: the description of the copied object
        script: values.script || null, // add: the file of a component that the page may not load (a copy of another page)
        name: values.name || null, // add: its automatic name (the same after a reload)
    });
};

BasicDesigner.loadSession = function () {
    const session = basic.storage.load(BasicDesigner.sessionKey());
    return (session && session.count) ? session : null;
};

BasicDesigner.discardSession = function () {
    basic.storage.remove(BasicDesigner.sessionKey());
    BasicDesigner.hideSessionBar();
};

// Makes the saved changes again on the page, with the same functions as the first time and in the same order,
// so Revert all works as before. Returns how many could not be found (the code changed since).
BasicDesigner.applySession = function (session) {

    const s = BasicDesigner.state;
    let missing = 0;
    const find = function (ref) {
        const obj = BasicDesigner.objectOfRef(ref);
        if (!obj) missing++;
        return obj;
    };

    s.canSave = false;
    s.isReplaying = true;

    // WHY: The params first: a component is made again (it keeps its id), the places and values find the new one.
    session.params.forEach(function (item) {
        const obj = find(item.target);
        if (!obj) return;
        const old = BasicDesigner.getAt(obj.__bd.params, item.path);
        // WHY keepFunctions: a saved session is JSON; the callbacks of the rows of a list come from the page.
        BasicDesigner.applyParamValue(obj, item.path, BasicDesigner.keepFunctions(item.to, old));
    });

    session.places.forEach(function (op) {
        const container = op.container ? find(op.container) : null;
        const before = op.before ? find(op.before) : null;
        const place = { container: container, before: before, point: op.point || undefined, isManual: !!op.isManual };
        if (op.kind === "add") {
            const toolboxItem = BasicDesigner.toolboxItems.find(function (i) { return i.type === op.type; });
            const item = (op.props) ? { type: op.type, props: op.props, copyOf: op.copyOf, script: op.script } : Object.assign({}, toolboxItem);
            if (op.name) item.name = op.name;
            if (toolboxItem || op.props) {
                if (container) BasicDesigner.addObjectAt(item, place);
            }
            return;
        }
        const obj = find(op.target);
        if (!obj) return;
        if (op.kind === "move" && container) BasicDesigner.moveObject(obj, place);
        if (op.kind === "delete") BasicDesigner.deleteObject(obj);
    });

    (session.sides || []).forEach(function (item) {
        const obj = find(item.target);
        if (obj) BasicDesigner.changeSides(obj, function () { BasicDesigner.writeSides(obj, item.to); });
    });

    session.values.forEach(function (item) {
        const obj = find(item.target);
        if (!obj) return;
        const targets = item.targets.map(BasicDesigner.objectOfRef).filter(Boolean);
        BasicDesigner.applyValue(obj, item.key, item.to, targets.length ? targets : [obj]);
    });

    session.notes.forEach(function (item) {
        const obj = find(item.target);
        if (obj) s.notes.set(obj.__bd.id, item.text);
    });

    (session.names || []).forEach(function (item) {
        const obj = find(item.target);
        if (obj) s.names.set(obj.__bd.id, item.name);
    });

    if (session.page) {
        session.page.values.forEach(function (item) { BasicDesigner.applyPageValue(item.key, item.to); });
        s.projectNote = session.page.note || "";
    }

    BasicDesigner.sortChanges(session.order);
    s.isReplaying = false;
    s.canSave = true;
    BasicDesigner.refreshChanges();
    BasicDesigner.refreshLayers();
    return missing;

};

// Changes in the saved order (the replay makes them in another order: places first, values last).
BasicDesigner.sortChanges = function (order) {
    const s = BasicDesigner.state;
    const rank = function (c) {
        const index = order.indexOf(BasicDesigner.changeName(c));
        return (index === -1) ? order.length : index;
    };
    const sorted = Array.from(s.changes.entries()).sort(function (a, b) { return rank(a[1]) - rank(b[1]); });
    s.changes.clear();
    sorted.forEach(function (pair) { s.changes.set(pair[0], pair[1]); });
};

// SESSION BAR: over the canvas when a page has saved changes: Apply / Discard.
BasicDesigner.showSessionBar = function (session) {
    const ui = BasicDesigner.ui;
    const time = new Date(session.savedAt).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const word = (session.count === 1) ? "change" : "changes";
    ui.lblSession.plainText = session.count + " unsaved " + word + " from " + time + " (not in the code yet).";
    ui.sessionBar.visible = 1;
    BasicDesigner.pendingSession = session;
};

BasicDesigner.hideSessionBar = function () {
    BasicDesigner.ui.sessionBar.visible = 0;
    BasicDesigner.pendingSession = null;
};

BasicDesigner.onSessionApply = function () {
    const session = BasicDesigner.pendingSession;
    BasicDesigner.hideSessionBar();
    if (!session) return;
    const missing = BasicDesigner.applySession(session);
    const note = (missing) ? " " + missing + " could not be found: the code changed since." : "";
    BasicDesigner.setStatus("The saved changes are back." + note);
};

BasicDesigner.buildSessionBar = function () {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    // GROUP: Session bar (top center of the canvas)
    ui.sessionBar = HGroup({ hug: 1, align: "left center", gap: 8, padding: [12, 6], color: C.menu, round: 8, border: 1, borderColor: "#F5C04A" });
    ui.sessionBar.css = { left: "50%", top: "20px", transform: "translateX(-50%)" };
    ui.sessionBar.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.45)";
    ui.sessionBar.zIndex = 50;
    ui.sessionBar.role = "alert";
        ui.lblSession = Label({ text: "", fontSize: 12, textColor: C.text, css: { whiteSpace: "nowrap" } });
        BasicDesigner.toolButton("Apply", BasicDesigner.onSessionApply, { color: C.accent });
        BasicDesigner.toolButton("Discard", BasicDesigner.discardSession, { color: C.field });
    endGroup();
    ui.sessionBar.visible = 0; // WHY: Hidden after its children are made (they are flex items then).
};

// *** DRAG AND DROP:
// Sources: a toolbox button (a new object), a row of the layers, an object on the canvas (Select mode).
// Targets: a place on the canvas, a place in the layers, the trash (bottom right of the canvas, only while dragging).
// A drop is a change like the others: "moved" / "deleted" in Changes and the prompt, Revert all puts it back.

BasicDesigner.DRAG_START_DISTANCE = 5; // px: a smaller move is a click
BasicDesigner.CLICK_AFTER_DRAG = 300; // ms: the click that ends a drag is not a click
BasicDesigner.TREE_INSIDE_PART = 0.25; // the middle of a container row (from 25% to 75%) drops into it

BasicDesigner.drag = null; // { kind: "new" | "move", item, obj, startX, startY, isStarted, target }
BasicDesigner.lastDragEnd = 0;

BasicDesigner.wasDragging = function () {
    return Date.now() - BasicDesigner.lastDragEnd < BasicDesigner.CLICK_AFTER_DRAG;
};

// pointerdown on a source: the drag starts when the mouse moves a little.
BasicDesigner.pressDrag = function (event, source) {
    if (event.button !== 0 || !BasicDesigner.state.rt) return;
    BasicDesigner.drag = Object.assign({ startX: event.clientX, startY: event.clientY, isStarted: false, target: null }, source);
};

BasicDesigner.onDragMove = function (event) {
    const drag = BasicDesigner.drag;
    if (!drag) return;
    if (!drag.isStarted) {
        const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
        if (distance < BasicDesigner.DRAG_START_DISTANCE) return;
        BasicDesigner.startDrag();
    }
    event.preventDefault();
    BasicDesigner.placeGhost(event.clientX, event.clientY);
    drag.target = BasicDesigner.dropTargetAt(event.clientX, event.clientY);
    BasicDesigner.paintDropTarget(drag.target);
};

BasicDesigner.onDragEnd = function () {
    const drag = BasicDesigner.drag;
    BasicDesigner.drag = null;
    if (!drag || !drag.isStarted) return;
    BasicDesigner.lastDragEnd = Date.now();
    BasicDesigner.stopDragView();
    if (drag.target) BasicDesigner.drop(drag, drag.target);
};

BasicDesigner.cancelDrag = function () {
    if (!BasicDesigner.drag) return;
    const isStarted = BasicDesigner.drag.isStarted;
    BasicDesigner.drag = null;
    if (isStarted) BasicDesigner.stopDragView();
};

BasicDesigner.startDrag = function () {
    const ui = BasicDesigner.ui;
    BasicDesigner.closeComponentMenu();
    BasicDesigner.hideEye();
    const drag = BasicDesigner.drag;
    drag.isStarted = true;
    drag.wasCoverVisible = ui.cover.visible;
    ui.cover.visible = 1; // WHY: In Interact mode the page would take the mouse: the drop on the canvas needs the cover.
    BasicDesigner.hideTip();
    const type = (drag.kind === "new") ? drag.item.type : BasicDesigner.typeOf(drag.obj);
    const name = (drag.kind === "new") ? type : BasicDesigner.title(drag.obj).short;
    ui.ghost.text = '<img src="' + BasicDesigner.layerIconFile(type) + '" alt="" width="14" height="14">' + BasicDesigner.esc(name);
    ui.ghost.visible = 1;
    ui.trash.visible = (drag.kind === "move") ? 1 : 0;
    ui.treeTrash.visible = (drag.kind === "move") ? 1 : 0;
};

BasicDesigner.stopDragView = function () {
    const ui = BasicDesigner.ui;
    ui.ghost.visible = 0;
    ui.trash.visible = 0;
    ui.treeTrash.visible = 0;
    BasicDesigner.paintTrash(ui.trash, false);
    BasicDesigner.paintTrash(ui.treeTrash, false);
    ui.dropLine.visible = 0;
    ui.dropRect.visible = 0;
    ui.treeDropLine.visible = 0;
    ui.treeDropRect.visible = 0;
    BasicDesigner.hideSnapLines();
    ui.cover.visible = BasicDesigner.drag ? 1 : (BasicDesigner.state.mode === "select" ? 1 : 0);
};

BasicDesigner.placeGhost = function (x, y) {
    const ghost = BasicDesigner.ui.ghost;
    ghost.left = x + 14;
    ghost.top = y + 10;
};

// The target under the mouse: { trash } or { area: "canvas" | "tree", container, before, point, line }.
BasicDesigner.dropTargetAt = function (x, y) {
    const ui = BasicDesigner.ui;
    const isMove = (BasicDesigner.drag.kind === "move");
    if (isMove && BasicDesigner.isInside(ui.trash.elem, x, y)) return { trash: ui.trash };
    if (isMove && BasicDesigner.isInside(ui.treeTrash.elem, x, y)) return { trash: ui.treeTrash };
    if (BasicDesigner.isInside(ui.frameBox.elem, x, y)) {
        const frameRect = ui.frameBox.elem.getBoundingClientRect();
        return BasicDesigner.canvasTargetAt(x - frameRect.left, y - frameRect.top);
    }
    if (ui.pageRow && BasicDesigner.isInside(ui.pageRow.elem, x, y)) return BasicDesigner.pageRowTarget();
    if (BasicDesigner.isInside(ui.tree.elem, x, y)) return BasicDesigner.treeTargetAt(x, y);
    return null;
};

BasicDesigner.isInside = function (elem, x, y) {
    const r = elem.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
};

// A container a dragged object can go into: a plain Box / group of the page, or the page itself.
// WHY: The page holds the objects of the top level. Without it an empty page (dialog.htm) had no place for the
//      first object, and an object could not go out of the box of the top level.
BasicDesigner.canHold = function (container) {
    if (!container) return false;
    const isPage = (container === BasicDesigner.state.win.page);
    return (isPage || BasicDesigner.isPlainContainer(container)) && BasicDesigner.canDropInto(container);
};

// Can the dragged object go into this container? Not into itself (or into a box inside it).
BasicDesigner.canDropInto = function (container) {
    const drag = BasicDesigner.drag;
    if (!container) return false;
    if (drag.kind === "move" && drag.obj.elem.contains(container.elem)) return false;
    return true;
};

// The basic.js elements under a point of the page (also the ones that do not take the mouse).
BasicDesigner.objectsAt = function (x, y) {
    const s = BasicDesigner.state;
    const doc = s.win.document;
    const list = [];
    BasicDesigner.elementsAt(x, y).forEach(function (el) {
        let p = el;
        while (p && !(p._basicObject && p._basicObject.__bd && !p._basicObject._isRemoved)) p = p.parentElement;
        if (p && list.indexOf(p._basicObject) === -1 && p !== doc.body) list.push(p._basicObject);
    });
    return list;
};

// On the canvas: into the container under the mouse, or next to the object under it.
BasicDesigner.canvasTargetAt = function (x, y) {
    const objects = BasicDesigner.objectsAt(x, y);
    for (let i = 0; i < objects.length; i++) {
        const obj = BasicDesigner.movableOf(objects[i]);
        if (BasicDesigner.drag.kind === "move" && BasicDesigner.drag.obj.elem.contains(obj.elem)) continue;
        if (BasicDesigner.isPlainContainer(obj) && BasicDesigner.canDropInto(obj)) {
            return BasicDesigner.placeInContainer(obj, x, y);
        }
        const parent = obj.containerBox;
        if (BasicDesigner.canHold(parent)) {
            return BasicDesigner.placeInContainer(parent, x, y);
        }
    }
    const main = BasicDesigner.mainContainer();
    return (BasicDesigner.canHold(main)) ? BasicDesigner.placeInContainer(main, x, y) : null;
};

// In a group: before the first object whose middle is after the mouse. In a Box: at the mouse (left / top).
// Manual mode: at the mouse in a group too, over the others.
BasicDesigner.placeInContainer = function (container, x, y) {
    const rect = container.elem.getBoundingClientRect();
    const isManual = BasicDesigner.state.isManualMode;
    if (!container._isFlex || isManual) {
        const except = BasicDesigner.drag.obj || null;
        const snapX = BasicDesigner.snapValue(x - rect.left + container.elem.scrollLeft, BasicDesigner.snapTargets(container, except, "x"));
        const snapY = BasicDesigner.snapValue(y - rect.top + container.elem.scrollTop, BasicDesigner.snapTargets(container, except, "y"));
        BasicDesigner.showSnapLine("x", container, snapX.target);
        BasicDesigner.showSnapLine("y", container, snapY.target);
        return { area: "canvas", container: container, before: null, point: { x: snapX.value, y: snapY.value }, isManual: isManual };
    }
    const isVertical = (container._flow === "vertical");
    const children = BasicDesigner.childObjects(container).filter(function (o) {
        return !BasicDesigner.drag.obj || o !== BasicDesigner.drag.obj;
    });
    const before = children.find(function (child) {
        const r = child.elem.getBoundingClientRect();
        return (isVertical) ? (y < r.top + r.height / 2) : (x < r.left + r.width / 2);
    }) || null;
    return { area: "canvas", container: container, before: before, line: BasicDesigner.dropLineOf(container, children, before, isVertical) };
};

// The line that shows the place in a group: { left, top, width, height } on the canvas.
BasicDesigner.dropLineOf = function (container, children, before, isVertical) {
    const THICKNESS = 2;
    const box = container.elem.getBoundingClientRect();
    const last = children[children.length - 1];
    let r = null;
    if (before) r = before.elem.getBoundingClientRect();
    else if (last) r = last.elem.getBoundingClientRect();
    if (!r) return { left: box.left + 4, top: box.top + 4, width: isVertical ? box.width - 8 : THICKNESS, height: isVertical ? THICKNESS : box.height - 8 };
    if (isVertical) {
        const top = (before) ? r.top - THICKNESS : r.bottom;
        return { left: r.left, top: top, width: r.width, height: THICKNESS };
    }
    const left = (before) ? r.left - THICKNESS : r.right;
    return { left: left, top: r.top, width: THICKNESS, height: r.height };
};

// In the layers: the middle of a container row -> into it; the top half -> before the row; the bottom half -> after it.
// In the layers: the middle of a container row -> into it; the top half -> before the row; the bottom half ->
// after it. After the last row of a container, the mouse more to the left (less indent) goes out of it, one level
// for every indent (as in a file explorer). Under the rows -> at the end of the page.
BasicDesigner.treeTargetAt = function (x, y) {
    let el = document.elementFromPoint(x, y);
    while (el && !el._treeRec) el = el.parentElement;
    if (!el) return BasicDesigner.treeEndTarget(y);
    const rec = el._treeRec;
    const obj = BasicDesigner.movableOf(BasicDesigner.objectOfKey(rec.node.key));
    if (!obj) return null;
    const rect = el.getBoundingClientRect();
    const part = (y - rect.top) / rect.height;
    const isMiddle = part > BasicDesigner.TREE_INSIDE_PART && part < 1 - BasicDesigner.TREE_INSIDE_PART;
    if (isMiddle && obj !== BasicDesigner.drag.obj && BasicDesigner.isPlainContainer(obj) && BasicDesigner.canDropInto(obj)) {
        return { area: "tree", container: obj, before: null, row: rect, inside: true };
    }
    if (part < 0.5) {
        if (obj === BasicDesigner.drag.obj || !BasicDesigner.canHold(obj.containerBox)) return null;
        return { area: "tree", container: obj.containerBox, before: obj, row: rect, isBefore: true, level: rec.level };
    }
    // After the row: go up while the mouse is left of the indent and the object is the last one of its container.
    const mouseLevel = BasicDesigner.treeLevelAt(x, rec.level);
    let level = rec.level;
    let target = obj;
    while (level > mouseLevel && !BasicDesigner.nextObject(target) && target.containerBox && target.containerBox !== BasicDesigner.state.win.page) {
        target = BasicDesigner.movableOf(target.containerBox);
        level--;
    }
    if (target === BasicDesigner.drag.obj || !BasicDesigner.canHold(target.containerBox)) return null;
    return { area: "tree", container: target.containerBox, before: BasicDesigner.nextObject(target), row: rect, isBefore: false, level: level };
};

BasicDesigner.TREE_ARROW_WIDTH = 16; // px: the open / close arrow before the icon of a row

// The level the mouse points at, on a row of rowLevel: the level of the row while the mouse is on its icon or to
// the right of it; one level up for every indent to the left of the icon (the icon start counts as one).
BasicDesigner.treeLevelAt = function (x, rowLevel) {
    const row = BasicDesigner.ui.tree.style.row;
    const treeLeft = BasicDesigner.ui.tree.elem.getBoundingClientRect().left;
    const iconStart = treeLeft + row.paddingLeft + rowLevel * row.indent + BasicDesigner.TREE_ARROW_WIDTH;
    if (x >= iconStart) return rowLevel;
    return Math.max(0, rowLevel - Math.ceil((iconStart - x) / row.indent));
};

// Under the last row (or in an empty list): at the end of the page.
BasicDesigner.treeEndTarget = function (y) {
    const page = BasicDesigner.state.win && BasicDesigner.state.win.page;
    if (!BasicDesigner.canHold(page)) return null;
    const rows = Array.from(BasicDesigner.ui.tree.elem.querySelectorAll("*")).filter(function (el) { return el._treeRec && el.offsetParent; });
    const last = rows[rows.length - 1];
    const treeRect = BasicDesigner.ui.tree.elem.getBoundingClientRect();
    const rect = (last) ? last.getBoundingClientRect() : { left: treeRect.left, right: treeRect.right, width: treeRect.width, top: treeRect.top, bottom: treeRect.top + 24, height: 24 };
    if (last && y < rect.bottom) return null;
    return { area: "tree", container: page, before: null, row: rect, isBefore: false, level: 0 };
};

BasicDesigner.paintDropTarget = function (target) {
    const ui = BasicDesigner.ui;
    const C = BasicDesigner.colors;
    if (!target || !target.point) BasicDesigner.hideSnapLines();
    ui.dropLine.visible = 0;
    ui.dropRect.visible = 0;
    ui.treeDropLine.visible = 0;
    ui.treeDropRect.visible = 0;
    BasicDesigner.paintTrash(ui.trash, !!(target && target.trash === ui.trash));
    BasicDesigner.paintTrash(ui.treeTrash, !!(target && target.trash === ui.treeTrash));
    if (!target || target.trash) return;
    if (target.area === "canvas") {
        BasicDesigner.placeRect(ui.dropRect, target.container);
        if (!target.line) return;
        ui.dropLine.left = target.line.left;
        ui.dropLine.top = target.line.top;
        ui.dropLine.width = target.line.width;
        ui.dropLine.height = target.line.height;
        ui.dropLine.visible = 1;
        return;
    }
    const r = target.row;
    if (target.inside) {
        ui.treeDropRect.left = r.left + 2;
        ui.treeDropRect.top = r.top;
        ui.treeDropRect.width = r.width - 4;
        ui.treeDropRect.height = r.height;
        ui.treeDropRect.visible = 1;
        return;
    }
    // WHY: The line starts at the indent of the level the object goes to (it shows going out of a box).
    const indent = (target.level !== undefined) ? BasicDesigner.treeIndentOf(target.level) : 8;
    const treeLeft = BasicDesigner.ui.tree.elem.getBoundingClientRect().left;
    ui.treeDropLine.left = Math.max(r.left + 8, treeLeft + indent);
    ui.treeDropLine.top = (target.isBefore) ? r.top - 1 : r.bottom - 1;
    ui.treeDropLine.width = Math.max(24, r.right - 8 - ui.treeDropLine.left);
    ui.treeDropLine.visible = 1;
};

// The x of a level in the layers (from the left of the list).
BasicDesigner.treeIndentOf = function (level) {
    const row = BasicDesigner.ui.tree.style.row;
    return row.paddingLeft + level * row.indent + 8;
};

BasicDesigner.drop = function (drag, target) {
    if (target.trash) {
        BasicDesigner.deleteObject(drag.obj);
        return;
    }
    // MANUAL MODE in the layers: the place in the rows (over or under the others) and 0, 0 for a new object; a manual
    // object keeps its left / top.
    const isManualInRows = BasicDesigner.state.isManualMode && target.area === "tree";
    if (isManualInRows && drag.kind === "new") target = Object.assign({}, target, { point: { x: 0, y: 0 }, isManual: true });
    if (isManualInRows && drag.kind === "move" && BasicDesigner.isManual(drag.obj)) target = Object.assign({}, target, { isManual: true });
    if (drag.kind === "new") {
        BasicDesigner.addObjectAt(drag.item, target);
        return;
    }
    BasicDesigner.moveObject(drag.obj, target);
};

// Where an object is: to put it back with Revert all.
BasicDesigner.placeOf = function (obj) {
    return {
        parentElem: obj.elem.parentElement,
        nextElem: obj.elem.nextSibling,
        parentBox: obj.containerBox,
        style: { position: obj.elem.style.position, left: obj.elem.style.left, top: obj.elem.style.top },
    };
};

BasicDesigner.restorePlace = function (obj, place) {
    if (!place.parentElem) return;
    place.parentElem.insertBefore(obj.elem, place.nextElem && place.nextElem.parentNode === place.parentElem ? place.nextElem : null);
    obj.parentBox = place.parentBox;
    obj.css = place.style;
};

BasicDesigner.moveObject = function (obj, target) {

    const s = BasicDesigner.state;
    const id = "move:" + obj.__bd.id;
    const oldPlace = BasicDesigner.placeOf(obj);
    const oldDescription = BasicDesigner.describePlace(obj);
    const isSamePlace = (target.container === obj.containerBox) && (target.before === BasicDesigner.nextObject(obj)) && !target.point;
    if (isSamePlace) return;

    BasicDesigner.logPlace("move", { obj: obj, place: target });
    BasicDesigner.putInPlace(obj, target);

    if (obj.__bd.added) BasicDesigner.writeAddedPlace(obj);
    if (target.point) {
        const left = Math.round(target.point.x);
        const top = Math.round(target.point.y);
        if (obj.__bd.added) {
            obj.left = left;
            obj.top = top;
            obj.__bd.added.props.left = left;
            obj.__bd.added.props.top = top;
        } else {
            BasicDesigner.changeSides(obj, function () {
                obj.left = left;
                obj.top = top;
            });
        }
    }

    // WHY: An added object has no place in the code yet: the prompt says where it is now.
    const hasMoved = (oldPlace.parentBox !== obj.containerBox) || (oldPlace.nextElem !== obj.elem.nextSibling);
    if (!obj.__bd.added && hasMoved && !s.changes.has(id)) {
        s.changes.set(id, { obj: obj, kind: "move", key: "place", from: oldPlace, oldDescription: oldDescription, targets: new Map(), count: 1 });
    }

    BasicDesigner.afterPlaceChange(obj);
    BasicDesigner.setStatus(BasicDesigner.title(obj).short + " moved.");

};

// The code of an added object says where it is now: position: "absolute" for a manual one in a group; no left / top in
// the flow of a group. WHY: basic.js moves an object of a group by its left / top (relative): the code looked moved.
BasicDesigner.writeAddedPlace = function (obj) {
    const props = obj.__bd.added.props;
    const isInFlow = obj.containerBox._isFlex && !BasicDesigner.isManual(obj);
    delete props.position;
    if (BasicDesigner.isManualInGroup(obj)) props.position = "absolute";
    if (!isInFlow) return;
    delete props.left;
    delete props.top;
};

BasicDesigner.deleteObject = function (obj) {

    const s = BasicDesigner.state;
    BasicDesigner.logPlace("delete", { obj: obj });
    if (s.selected && obj.elem.contains(s.selected.elem)) s.selected = null;

    // An added object: it is not in the code, so it is only removed (with its changes and the objects added in it).
    if (obj.__bd.added) {
        s.changes.forEach(function (c, id) {
            if (obj.elem.contains(c.obj.elem)) s.changes.delete(id);
        });
        obj.remove();
        BasicDesigner.afterPlaceChange(null);
        BasicDesigner.setStatus("Removed.");
        return;
    }

    BasicDesigner.takeOut(obj, BasicDesigner.describePlace(obj));
    BasicDesigner.afterPlaceChange(null);
    BasicDesigner.setStatus(BasicDesigner.title(obj).short + " deleted. (Revert all brings it back.)");

};

// Takes a code object out of the page as a "delete" change. place: where it was, for the prompt.
BasicDesigner.takeOut = function (obj, place) {
    const s = BasicDesigner.state;
    s.changes.set("delete:" + obj.__bd.id, { obj: obj, kind: "delete", key: "deleted", from: BasicDesigner.placeOf(obj), place: place, targets: new Map(), count: 1 });
    // WHY: Taken out of the page, not removed: Revert all puts the same object back.
    obj.elem.remove();
};

BasicDesigner.buildDragView = function () {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;

    // On the canvas (in the box of the page): the container and the line of the place.
    createIn(ui.frameBox, function () {
        ui.dropRect = Box(0, 0, 0, 0, { color: Alpha(C.accent, 0.06), visible: 0 });
        ui.dropRect.boxShadow = "inset 0 0 0 1px " + C.accent;
        ui.dropRect.css = { pointerEvents: "none" };
        ui.dropLine = Box(0, 0, 0, 0, { color: C.accent, round: 1, visible: 0 });
        ui.dropLine.css = { pointerEvents: "none" };
    });

    createIn(page, function () {
        // In the layers: a line between the rows, a frame on a container row.
        ui.treeDropLine = Box(0, 0, 0, 2, { color: C.accent, round: 1, visible: 0 });
        ui.treeDropRect = Box(0, 0, 0, 0, { color: Alpha(C.accent, 0.12), round: 4, visible: 0 });
        ui.treeDropRect.boxShadow = "inset 0 0 0 1px " + C.accent;
        [ui.treeDropLine, ui.treeDropRect].forEach(function (obj) {
            obj.zIndex = 8000;
            obj.css = { pointerEvents: "none" };
        });

        // LABEL: Ghost (follows the mouse)
        ui.ghost = Label({ text: "", fontSize: 12, textColor: C.text, color: C.menu, round: 6, visible: 0 });
        ui.ghost.css = { padding: "4px 8px", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", pointerEvents: "none" };
        ui.ghost.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.5)";
        ui.ghost.zIndex = 9500;
        ui.ghost.visible = 0;
    });

};

BasicDesigner.TRASH_SIZE = 56;

// TRASH: a lid with a handle, a body that gets narrower, three lines. currentColor: white, red under a drag.
BasicDesigner.TRASH_ICON = "M3.5 6h17M9.5 6V4.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V6M5.5 6l1.1 13.2a2 2 0 0 0 2 1.8h6.8a2 2 0 0 0 2-1.8L18.5 6M10 10.5v6.5M14 10.5v6.5";
BasicDesigner.TRASH_RED = "#E5484D";
BasicDesigner.TRASH_SMALL_SIZE = 36;

BasicDesigner.trashSvg = function (size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' + BasicDesigner.TRASH_ICON + '"/></svg>';
};

// A trash of a drag (hidden until a drag starts). withText: "Delete" under the icon (the big one of the canvas).
BasicDesigner.createTrash = function (size, iconSize, withText) {
    const C = BasicDesigner.colors;
    const html = BasicDesigner.trashSvg(iconSize) + ((withText) ? '<span style="font-size:10px;line-height:12px">Delete</span>' : "");
    // LABEL: Trash
    const trash = Label({ text: html, width: size, height: size, color: C.raised, textColor: "#D0D0D0", round: Math.round(size / 4), border: 1, borderColor: C.line, lineHeight: "0" });
    trash.css = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        transition: "background-color 0.12s, color 0.12s, transform 0.12s, border-color 0.12s, opacity 0.15s",
    };
    trash.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.45)";
    trash.aria = { label: "Drop here to delete" };
    trash.visible = 0;
    return trash;
};

// Red and a little bigger while a dragged object is over it.
BasicDesigner.paintTrash = function (trash, isOver) {
    const C = BasicDesigner.colors;
    if (!trash) return;
    trash.color = (isOver) ? BasicDesigner.TRASH_RED : C.raised;
    trash.textColor = (isOver) ? "#FFFFFF" : "#D0D0D0";
    trash.borderColor = (isOver) ? BasicDesigner.TRASH_RED : BasicDesigner.colors.line;
    trash.css.transform = (isOver) ? "scale(1.08)" : "scale(1)";
};

BasicDesigner.buildTrash = function () {
    const ui = BasicDesigner.ui;
    // LABEL: Trash of the canvas (bottom right, only while an object is dragged)
    ui.trash = BasicDesigner.createTrash(BasicDesigner.TRASH_SIZE, 24, true);
    ui.trash.css = { left: "auto", top: "auto", right: "24px", bottom: "24px" };
};

// The small trash of the layers (bottom right of the tree): a row can be dropped there too.
BasicDesigner.buildTreeTrash = function () {
    const ui = BasicDesigner.ui;
    ui.treeTrash = BasicDesigner.createTrash(BasicDesigner.TRASH_SMALL_SIZE, 18, false);
    ui.treeTrash.css = { left: "auto", top: "calc(" + BasicDesigner.layersBottom() + " - " + (BasicDesigner.TRASH_SMALL_SIZE + 12) + "px)", right: "14px", zIndex: "20" };
};

// The sources of a drag: the rows of the layers and the objects on the canvas. (The toolbox buttons: createToolboxButton.)
BasicDesigner.bindDragSources = function () {
    const ui = BasicDesigner.ui;
    ui.tree.elem.addEventListener("contextmenu", function (event) {
        let el = event.target;
        while (el && !el._treeRec) el = el.parentElement;
        if (!el) return;
        event.preventDefault();
        BasicDesigner.openObjectMenu(BasicDesigner.objectOfKey(el._treeRec.node.key), event.clientX, event.clientY, "tree");
    });
    ui.tree.elem.addEventListener("pointerdown", function (event) {
        let el = event.target;
        while (el && !el._treeRec) el = el.parentElement;
        if (!el || (event.target.closest && event.target.closest("[data-tv-arrow]"))) return;
        const obj = BasicDesigner.movableOf(BasicDesigner.objectOfKey(el._treeRec.node.key));
        if (obj) BasicDesigner.pressDrag(event, { kind: "move", obj: obj });
    });
    ui.cover.elem.addEventListener("pointerdown", function (event) {
        const frameRect = ui.frameBox.elem.getBoundingClientRect();
        const hit = BasicDesigner.hitTest(event.clientX - frameRect.left, event.clientY - frameRect.top);
        const obj = BasicDesigner.movableOf(hit);
        if (!obj) return;
        // WHY: A manual object is moved where the mouse puts it, in manual mode an object of a group too (it leaves the
        //      flow when the drag starts). Cmd/Ctrl+drag: into another box (the other drag).
        const isCommand = event.metaKey || event.ctrlKey;
        const isFreeMove = BasicDesigner.isManual(obj) || BasicDesigner.state.isManualMode;
        if (isFreeMove && !isCommand) BasicDesigner.pressMove(event, obj);
        else BasicDesigner.pressDrag(event, { kind: "move", obj: obj });
    });
    window.addEventListener("pointermove", BasicDesigner.onDragMove);
    window.addEventListener("pointerup", BasicDesigner.onDragEnd);
    window.addEventListener("pointermove", BasicDesigner.onResizeMove);
    window.addEventListener("pointerup", BasicDesigner.onResizeEnd);
    window.addEventListener("pointermove", BasicDesigner.onMoveMove);
    window.addEventListener("pointerup", BasicDesigner.onMoveEnd);
    window.addEventListener("pointercancel", BasicDesigner.cancelDrag);
    window.addEventListener("pointerdown", function (event) {
        const menu = ui.popupMenu;
        if (!menu || menu.elem.contains(event.target) || (ui.popupMenuButton && ui.popupMenuButton.elem.contains(event.target))) return;
        BasicDesigner.closePopupMenu();
    }, true);
    window.addEventListener("pointerdown", function (event) {
        const menu = ui.pageMenu;
        if (!menu || menu.elem.contains(event.target) || ui.pageField.elem.contains(event.target)) return;
        BasicDesigner.closePageMenu();
    }, true);
    // The components menu closes with a click out of it (not on its own button: that one toggles it).
    window.addEventListener("pointerdown", function (event) {
        const menu = ui.componentMenu;
        if (!menu || menu.elem.contains(event.target) || ui.btnComponents.elem.contains(event.target)) return;
        BasicDesigner.closeComponentMenu();
    }, true);
    // WHY: The icons are <img>: the browser starts its own image drag on them and stops the pointer events.
    document.addEventListener("dragstart", function (event) { event.preventDefault(); });
    window.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") return;
        BasicDesigner.cancelDrag();
        BasicDesigner.closeComponentMenu();
    });
};

// TOOLBOX VIEW: a bar at the bottom of the canvas, a button for each new object, a tip over it.

BasicDesigner.TOOL_BUTTON_SIZE = 32;
BasicDesigner.TOOL_ICON_SIZE = 18;
BasicDesigner.TIP_DELAY = 350; // ms: the tip does not flash while the mouse passes over the bar
BasicDesigner.TIP_SPACE = 8; // between the button and the tip

BasicDesigner.buildToolbox = function () {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;

    // GROUP: Toolbox (bottom center of the canvas)
    ui.toolbox = HGroup({ hug: 1, gap: 2, padding: 4, color: C.bar, round: 10, border: 1, borderColor: C.line });
    ui.toolbox.css = { left: "50%", top: "auto", bottom: "24px", transform: "translateX(-50%)" };
    ui.toolbox.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.45)";
    ui.toolbox.role = "toolbar";
    ui.toolbox.aria = { label: "Tools" };
    ui.toolbox.elem.addEventListener("keydown", BasicDesigner.onToolboxKey);

        ui.btnSelect = BasicDesigner.createModeButton("select", BasicDesigner.MODE_ICONS.select, "Select (V)",
            "Click an object to select it, drag it to move it.");
        ui.btnInteract = BasicDesigner.createModeButton("interact", BasicDesigner.MODE_ICONS.interact, "Interact (I)",
            "Use the page like a user: click, type, scroll.");
        ui.btnManual = BasicDesigner.iconButton({
            path: BasicDesigner.MODE_ICONS.manual,
            name: "Manual mode (M)",
            description: "On: a drag puts an object where the mouse leaves it, also in a group (it leaves the flow). A click on a new object puts it at 0, 0 of its box, over the others.",
            onClick: function () { BasicDesigner.setManualMode(!BasicDesigner.state.isManualMode); },
        });

        // BOX: Divider
        const divider = Box({ width: 1, height: 20, color: C.line });
        divider.shrink = 0;
        divider.css = { margin: "0px 4px" };

        BasicDesigner.toolboxItems.forEach(BasicDesigner.createToolboxButton);

        // BOX: Divider
        const divider2 = Box({ width: 1, height: 20, color: C.line });
        divider2.shrink = 0;
        divider2.css = { margin: "0px 4px" };

        ui.btnComponents = BasicDesigner.createModeButton("components", BasicDesigner.MODE_ICONS.components, "Components",
            "The components the page loads (Tabs, SelectBox...). Click one to add it, or drag it to a place.",
            BasicDesigner.layerIconColors.component);

        // BOX: Divider
        const divider3 = Box({ width: 1, height: 20, color: C.line });
        divider3.shrink = 0;
        divider3.css = { margin: "0px 4px" };

        ui.objectButtons = BasicDesigner.OBJECT_ACTIONS.map(BasicDesigner.createObjectButton);

    endGroup();

    BasicDesigner.setManualMode(basic.storage.load(BasicDesigner.MANUAL_MODE_KEY) === 1, true);

};

// *** COMPONENTS IN THE TOOLBOX: the components the page loads (comp/name.js with a "const XxxDefaults").

// WHY comp/ and comp-xx/: the components are in one comp/ folder (comp-m2/m3/m4 before; a copied
//     project may still have them): the old pattern found none of them and the menu of the toolbox was empty.
BasicDesigner.COMPONENT_FILE = /\/comp(-[\w-]+)?\/[\w-]+\.js$/;

// [{ type, description, props }] of the components the page can make. The file of each one is read once.
BasicDesigner.findComponents = async function () {
    const s = BasicDesigner.state;
    const urls = Array.from(s.win.document.scripts).map(function (script) { return script.src.split("?")[0]; })
        .filter(function (url) { return BasicDesigner.COMPONENT_FILE.test(url); });
    // The files of the Components panel: the added ones (loaded as a text, without a src) in, the removed ones out
    s.scriptChanges.forEach(function (change, path) {
        const url = new URL(path, s.rootUrl).href;
        const index = urls.indexOf(url);
        if (change === "add" && index === -1) urls.push(url);
        if (change === "remove" && index !== -1) urls.splice(index, 1);
    });
    const names = [];
    await Promise.all(urls.map(async function (url) {
        if (!s.sources[url]) {
            try {
                s.sources[url] = (await BasicDesigner.fetchText(url)).split("\n");
            } catch (error) {
                s.sources[url] = [];
            }
        }
        const text = s.sources[url].join("\n");
        const pattern = /^const (\w+)Defaults\s*=/gm;
        let match = pattern.exec(text);
        while (match) {
            names.push({ type: match[1], file: BasicDesigner.relPath(url) });
            match = pattern.exec(text);
        }
    }));
    return names.filter(function (c) {
        try {
            return s.win.eval("typeof " + c.type) === "function";
        } catch (error) {
            return false;
        }
    }).sort(function (a, b) { return a.type.localeCompare(b.type); }).map(function (c) {
        return { type: c.type, description: "A component of " + c.file + ", with its default values.", props: {} };
    });
};

BasicDesigner.toggleComponentMenu = async function (btn) {
    const ui = BasicDesigner.ui;
    if (ui.componentMenu || ui.isComponentMenuOpening) {
        BasicDesigner.closeComponentMenu();
        return;
    }
    if (!BasicDesigner.state.win) return;
    // WHY: The files are read first: a second press in that time would open a second menu (and lose the first).
    ui.isComponentMenuOpening = true;
    const items = await BasicDesigner.findComponents();
    const catalog = await BasicDesigner.loadCatalog();
    if (!ui.isComponentMenuOpening) return; // Closed while reading (a second press, Escape, a new page)
    ui.isComponentMenuOpening = false;
    BasicDesigner.openComponentMenu(btn, items, catalog);
    btn.setActive(true);
    // WHY: Opened with the keyboard: the first row gets the focus, so the arrow keys and Enter work.
    if (btn.elem.matches(":focus-visible")) BasicDesigner.focusComponentRow(0);
};

BasicDesigner.closeComponentMenu = function () {
    const ui = BasicDesigner.ui;
    ui.isComponentMenuOpening = false;
    if (ui.btnComponents) ui.btnComponents.setActive(false);
    if (!ui.componentMenu) return;
    ui.componentMenu.remove();
    ui.componentMenu = null;
    ui.componentRows = null;
};

BasicDesigner.focusComponentRow = function (index) {
    const menu = BasicDesigner.ui.componentMenu;
    const rows = (menu) ? Array.from(menu.elem.querySelectorAll("[role=menuitem]")) : [];
    if (!rows.length) return;
    rows[(index + rows.length) % rows.length].focus();
};

// In the menu: Up / Down between the rows, Enter / Space adds, Escape closes (the focus goes back to the button).
BasicDesigner.onComponentMenuKey = function (event) {
    const ui = BasicDesigner.ui;
    const rows = Array.from(ui.componentMenu.elem.querySelectorAll("[role=menuitem]"));
    const index = rows.indexOf(document.activeElement);
    event.stopPropagation(); // WHY: Not a shortcut of the designer.
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        BasicDesigner.focusComponentRow(index + ((event.key === "ArrowDown") ? 1 : -1));
        return;
    }
    if ((event.key === "Enter" || event.key === " ") && index !== -1) {
        event.preventDefault();
        rows[index].click();
        return;
    }
    if (event.key === "Escape") {
        BasicDesigner.closeComponentMenu();
        ui.btnComponents.elem.focus();
    }
};

// *** THE COMPONENTS PANEL (O-005): every component of the repository (index/catalog.js), the loaded ones
// marked, a search; a switch loads a component into the canvas (and the files it needs) or takes it out. The page file
// is not changed: the prompt asks for its <script> lines. A component can not be taken out while the page has objects
// of it, or while a loaded component needs it.

BasicDesigner.catalog = null; // [{ name, source, deps, text }] read once

BasicDesigner.loadCatalog = async function () {
    if (BasicDesigner.catalog) return BasicDesigner.catalog;
    try {
        const text = await BasicDesigner.fetchText(new URL("index/catalog.js", BasicDesigner.state.rootUrl).href);
        // WHY a function: catalog.js declares "const CATALOG", a const of a script is not on window
        const catalog = new Function(text + "\nreturn CATALOG;")();
        BasicDesigner.catalog = catalog.COMPONENTS.filter(function (c) { return c.source && c.name; }).map(function (c) {
            return { name: c.name, source: c.source, deps: c.deps || [], text: c.en || "" };
        }).sort(function (a, b) { return a.name.localeCompare(b.name); });
    } catch (error) {
        BasicDesigner.catalog = [];
    }
    return BasicDesigner.catalog;
};

// Is the component in the canvas (and not taken out in the panel)?
BasicDesigner.isComponentLoaded = function (entry) {
    const s = BasicDesigner.state;
    if (s.scriptChanges.get(entry.source) === "remove") return false;
    try {
        return s.win.eval("typeof " + entry.name) !== "undefined";
    } catch (error) {
        return false;
    }
};

// The objects of the page made by a component (its root boxes)
BasicDesigner.countComponentObjects = function (name) {
    return BasicDesigner.state.rt.objects.filter(function (o) {
        return o.__bd.component === name && o.elem && o.elem.isConnected;
    }).length;
};

// A file into the canvas as a text (a sync request, as loadMissingComponent). Returns 1 when it is there.
BasicDesigner.loadScriptIntoCanvas = function (path) {
    const s = BasicDesigner.state;
    const url = new URL(path, s.rootUrl).href;
    try {
        const request = new XMLHttpRequest();
        request.open("GET", url, false);
        request.send();
        if (request.status !== 200) return 0;
        const el = s.win.document.createElement("script");
        el.textContent = request.responseText + "\n//# sourceURL=" + url;
        s.win.document.head.appendChild(el);
    } catch (error) {
        return 0;
    }
    if (!s.loadedScripts) s.loadedScripts = {};
    s.loadedScripts[path] = 1;
    return 1;
};

BasicDesigner.isScriptOfPage = function (path) {
    const s = BasicDesigner.state;
    const url = new URL(path, s.rootUrl).href;
    return Array.from(s.win.document.scripts).some(function (el) { return el.src && el.src.split("?")[0].replace(/\.min\.js$/, ".js") === url; });
};

// Switch on: its files first (deps), then the file of the component. Returns a text for the status bar.
BasicDesigner.addComponentToPage = function (entry) {
    const s = BasicDesigner.state;
    const catalog = BasicDesigner.catalog || [];
    const files = entry.deps.concat([entry.source]);
    for (const path of files) {
        if (s.scriptChanges.get(path) === "remove") {
            s.scriptChanges.delete(path); // it was taken out, its code is still in the canvas
            continue;
        }
        const dep = catalog.find(function (c) { return c.source === path; });
        const isThere = (dep) ? BasicDesigner.isComponentLoaded(dep) : (BasicDesigner.isScriptOfPage(path) || (s.loadedScripts && s.loadedScripts[path]));
        if (isThere) continue;
        if (!BasicDesigner.loadScriptIntoCanvas(path)) return "Could not load " + path + ".";
        s.scriptChanges.set(path, "add");
    }
    BasicDesigner.refreshChanges();
    return entry.name + " is loaded: add it from the list (a click or a drag). The prompt asks for its <script> lines.";
};

// Switch off: refused while the page has objects of it or a loaded component needs it. Returns the reason, or "".
BasicDesigner.removeComponentFromPage = function (entry) {
    const s = BasicDesigner.state;
    const count = BasicDesigner.countComponentObjects(entry.name);
    if (count > 1) return "This page has " + count + " " + entry.name + " objects: remove them first.";
    if (count) return "This page has a " + entry.name + " object: remove it first.";
    const user = (BasicDesigner.catalog || []).find(function (c) {
        return c !== entry && c.deps.indexOf(entry.source) !== -1 && BasicDesigner.isComponentLoaded(c);
    });
    if (user) return user.name + " needs " + entry.name + ": take " + user.name + " out first.";
    if (s.scriptChanges.get(entry.source) === "add") s.scriptChanges.delete(entry.source); // added here: nothing to remove in the file
    else s.scriptChanges.set(entry.source, "remove");
    BasicDesigner.refreshChanges();
    return "";
};

// A list over the button: the search, then every component. A click on a loaded one adds it (like a toolbox button),
// a drag drops it somewhere; the switch at the right loads it or takes it out.
BasicDesigner.openComponentMenu = function (btn, items, catalog) {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const rect = btn.elem.getBoundingClientRect();
    const PANEL_WIDTH = 320;
    const LIST_HEIGHT = 360;
    let searchText = "";

    // A component of the page that is not in the catalog (its own) is still listed (no switch)
    const entries = catalog.slice();
    items.forEach(function (item) {
        if (!entries.some(function (e) { return e.name === item.type; })) entries.push({ name: item.type, source: "", deps: [], text: "A component of this page." });
    });

    const matches = function (entry) {
        if (!searchText) return true;
        const text = (entry.name + " " + entry.text).toLowerCase();
        return text.indexOf(searchText) !== -1;
    };

    // LABEL: The switch of a row (loaded or not)
    const createSwitch = function (entry, isOn) {
        const sw = Label({ text: "", width: 30, height: 16, round: 8, color: isOn ? C.accent : C.field });
        sw.shrink = 0;
        sw.css = { position: "relative", boxShadow: "inset 0 0 0 1px " + C.line };
        sw.elem.innerHTML = '<span style="position:absolute;top:2px;left:' + (isOn ? 16 : 2) + 'px;width:12px;height:12px;border-radius:6px;background:#FFFFFF"></span>';
        sw.clickable = 1;
        sw.cursor = "pointer";
        sw.role = "switch";
        sw.aria = { checked: isOn ? "true" : "false", label: (isOn ? "Take out " : "Load ") + entry.name };
        sw.on("click", function (self, event) {
            event.stopPropagation();
            const message = (isOn) ? BasicDesigner.removeComponentFromPage(entry) : BasicDesigner.addComponentToPage(entry);
            if (message) BasicDesigner.setStatus(message, (isOn) ? "error" : "info");
            else BasicDesigner.setStatus(entry.name + " is taken out: the prompt asks to remove its <script> line.");
            drawRows();
        });
        return sw;
    };

    // LABEL: A row: the icon, the name and the text (a loaded one can be added), the switch
    const createRow = function (entry) {
        const isOn = !entry.source || BasicDesigner.isComponentLoaded(entry);
        const item = { type: entry.name, description: "A component of " + (entry.source || "the page") + ", with its default values.", props: {} };
        const row = HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, padding: [8, 5], round: 5, color: "transparent" });
        row.shrink = 0; // WHY: In a column with a max height the rows would get smaller and lie on each other.
            const icon = '<img src="' + BasicDesigner.layerIconFile(entry.name) + '" alt="" width="14" height="14" draggable="false" style="opacity:' + (isOn ? 1 : 0.4) + '">';
            const text = '<span style="color:' + (isOn ? C.text : C.soft) + '">' + BasicDesigner.esc(entry.name) + '</span>' +
                '<span style="display:block;font-size:11px;color:' + C.dim + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + BasicDesigner.esc(entry.text) + "</span>";
            const lbl = Label({ text: icon, width: 14, height: 14 });
            lbl.shrink = 0;
            const name = Label({ text: text, fontSize: 12, height: "auto" });
            name.grow = 1;
            name.css = { minWidth: "0px", overflow: "hidden" };
            if (entry.source) createSwitch(entry, isOn);
        endGroup();
        if (!isOn) return row;
        // A loaded one: a click adds it, a drag drops it (as the old menu)
        row.clickable = 1;
        row.cursor = "pointer";
        row.role = "menuitem";
        row.tabIndex = -1; // WHY: Reached with the arrow keys of the menu, not with Tab.
        row.css = { outline: "none" };
        row.elem.addEventListener("focus", function () { row.color = C.hover; });
        row.elem.addEventListener("blur", function () { row.color = "transparent"; });
        row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
        row.elem.addEventListener("pointerdown", function (event) {
            if (event.target.closest("[role=switch]")) return;
            BasicDesigner.pressDrag(event, { kind: "new", item: item });
        });
        row.on("click", function () {
            if (BasicDesigner.wasDragging()) return;
            BasicDesigner.closeComponentMenu();
            BasicDesigner.addObject(item);
        });
        return row;
    };

    // Over the button, kept in the window (a narrow window would cut its right side); again when the list changes
    const place = function () {
        const menu = ui.componentMenu;
        if (!menu) return;
        const maxLeft = window.innerWidth - menu.elem.offsetWidth - BasicDesigner.TIP_SPACE;
        menu.left = Math.round(Math.max(BasicDesigner.TIP_SPACE, Math.min(rect.left, maxLeft)));
        menu.top = Math.round(rect.top - menu.elem.offsetHeight - BasicDesigner.TIP_SPACE);
    };

    // The rows again (after a search or a switch): the loaded ones first
    const drawRows = function () {
        if (ui.componentRows) ui.componentRows.remove();
        const shown = entries.filter(matches);
        const loaded = shown.filter(function (e) { return !e.source || BasicDesigner.isComponentLoaded(e); });
        const others = shown.filter(function (e) { return loaded.indexOf(e) === -1; });
        ui.componentRows = createIn(ui.componentList, function () {
            const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, color: "transparent" });
            group.css = { alignItems: "stretch" };
                if (!shown.length) Label({ text: "No component has this text.", fontSize: 12, textColor: C.soft, css: { padding: "6px 8px" } });
                if (loaded.length) Label({ text: "ON THIS PAGE", fontSize: 10, textColor: C.dim, css: { padding: "6px 8px 2px", letterSpacing: "1px" } });
                loaded.forEach(createRow);
                if (others.length) Label({ text: "NOT LOADED", fontSize: 10, textColor: C.dim, css: { padding: "10px 8px 2px", letterSpacing: "1px" } });
                others.forEach(createRow);
            endGroup();
            return group;
        });
        place();
    };

    createIn(page, function () {
        // GROUP: Panel
        ui.componentMenu = VGroup({ width: PANEL_WIDTH, height: "auto", align: "left top", gap: 6, padding: 6, color: C.menu, round: 8, border: 1, borderColor: C.line });
        ui.componentMenu.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
        ui.componentMenu.zIndex = 9000;
        ui.componentMenu.role = "menu";
        ui.componentMenu.css = { alignItems: "stretch" };

            // INPUT: Search (the name and the text of a component)
            ui.componentSearch = Input({ width: "100%", height: 28, placeholder: "Search components", fontSize: 12, color: C.field, textColor: C.text, round: 5, border: 0 });
            ui.componentSearch.shrink = 0;
            ui.componentSearch.minimal = 1;
            ui.componentSearch.css = { padding: "0px 8px", boxSizing: "border-box" };
            ui.componentSearch.inputElement.addEventListener("input", function () {
                searchText = ui.componentSearch.inputElement.value.trim().toLowerCase();
                drawRows();
            });

            // GROUP: The list (it scrolls; a group: a Box with height "auto" does not grow with its objects)
            ui.componentList = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, color: "transparent" });
            ui.componentList.css = { maxHeight: LIST_HEIGHT + "px", alignItems: "stretch" };
            ui.componentList.scrollY = 1;
            endGroup();

        endGroup();
    });

    drawRows();

    ui.componentMenu.elem.addEventListener("keydown", BasicDesigner.onComponentMenuKey);
    ui.componentSearch.inputElement.focus();

};

// The pictures of the modes (16 x 16, the color of the text: the active mode is blue).
BasicDesigner.MODE_ICONS = {
    select: "M4 2.5l8.5 5.2-3.9.9 2.3 4-1.7 1-2.3-4L4.4 12.3z",
    components: "M8 1.8l5.6 3.1v6.2L8 14.2l-5.6-3.1V4.9zM2.4 4.9L8 8l5.6-3.1M8 8v6.2",
    interact: "M6 8.5V3.5a1 1 0 0 1 2 0v4M8 7V2.8a1 1 0 0 1 2 0v4.7M10 7.5V4a1 1 0 0 1 2 0v5.5a4.5 4.5 0 0 1-4.5 4.5h-.4a4 4 0 0 1-3.2-1.6L2.7 9.8a1 1 0 0 1 1.5-1.3L6 10.3",
    manual: "M8 1.8v12.4M1.8 8h12.4M6.2 3.6L8 1.8l1.8 1.8M6.2 12.4L8 14.2l1.8-1.8M3.6 6.2L1.8 8l1.8 1.8M12.4 6.2L14.2 8l-1.8 1.8",
};

// A mode button of the toolbox (Select / Interact). setActive(isOn): the look of the active mode.
// An icon button with a tip (the name and what it does). options: { path, name, description, onClick, color, size }
// setActive(isOn): the look of a chosen button. setEnabled(isOn): a pale button that does nothing.
BasicDesigner.iconButton = function (options) {

    const C = BasicDesigner.colors;
    const size = options.size || BasicDesigner.TOOL_BUTTON_SIZE;
    const iconSize = options.iconSize || BasicDesigner.TOOL_ICON_SIZE;
    // options.html: a picture of its own (Ex: the colored icon of the layers), instead of options.path.
    const svg = options.html || ('<svg xmlns="http://www.w3.org/2000/svg" width="' + iconSize + '" height="' + iconSize + '" viewBox="0 0 16 16" fill="none"' +
        ' stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="' + options.path + '"/></svg>');
    const tip = { type: options.name, description: options.description || "" };
    const baseColor = options.color || BasicDesigner.layerIconColors.object;
    let isActive = false;
    let isEnabled = true;

    // LABEL: An icon button
    const btn = Label({
        text: svg,
        width: size,
        height: size,
        color: "transparent",
        textColor: baseColor,
        round: 6,
        clickable: 1,
        cursor: "pointer",
        lineHeight: "0",
        shrink: 0,
        css: { display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.12s, opacity 0.12s" },
    });
    btn.role = "button";
    btn.tabIndex = 0;
    btn.aria = { label: options.name };

    const paint = function (isOver) {
        if (isActive) btn.color = C.selectedRow;
        else btn.color = (isOver && isEnabled) ? C.hover : "transparent";
        btn.textColor = (isActive) ? C.accentLight : baseColor;
        btn.opacity = (isEnabled) ? 1 : 0.35;
        btn.cursor = (isEnabled) ? "pointer" : "default";
        btn.tabIndex = (isEnabled) ? 0 : -1;
        btn.aria = { pressed: isActive, disabled: !isEnabled };
    };
    btn.setActive = function (value) {
        isActive = !!value;
        paint(false);
    };
    btn.setEnabled = function (value) {
        isEnabled = !!value;
        paint(false);
    };

    btn.onHoverChange(function (self, isOver) {
        paint(isOver);
        if (isOver) BasicDesigner.showTip(btn, tip);
        else BasicDesigner.hideTip();
    });
    // WHY: The keyboard has no hover: the tip comes with the focus too (Tab, the arrow keys of the toolbox).
    btn.elem.addEventListener("focus", function () {
        if (btn.elem.matches(":focus-visible")) BasicDesigner.showTip(btn, tip);
    });
    btn.elem.addEventListener("blur", BasicDesigner.hideTip);
    const press = function () {
        BasicDesigner.hideTip();
        if (isEnabled) options.onClick(btn);
    };
    btn.on("click", press);
    btn.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        press();
    });

    return btn;

};

// A mode button of the toolbox (Select / Interact), or the components menu.
BasicDesigner.createModeButton = function (mode, path, name, description, color) {
    return BasicDesigner.iconButton({
        path: path,
        name: name,
        description: description,
        color: color,
        onClick: function (btn) {
            if (mode === "components") BasicDesigner.toggleComponentMenu(btn);
            else BasicDesigner.setMode(mode);
        },
    });
};

// MANUAL MODE: remembered (basic.storage). silent: no message (the start).
BasicDesigner.MANUAL_MODE_KEY = "basic-designer-manual-mode";

BasicDesigner.setManualMode = function (isOn, silent) {
    const s = BasicDesigner.state;
    s.isManualMode = !!isOn;
    BasicDesigner.ui.btnManual.setActive(s.isManualMode);
    basic.storage.save(BasicDesigner.MANUAL_MODE_KEY, (s.isManualMode) ? 1 : 0);
    if (silent) return;
    if (s.isManualMode) BasicDesigner.setStatus("Manual mode: a drag puts an object where the mouse leaves it, also in a group. A new object (a click) goes to 0, 0 of its box, over the others.");
    else BasicDesigner.setStatus("Manual mode is off: an object of a group moves in its flow.");
};

// THE OBJECT BUTTONS: the most used actions of the selected object (also in its menu, and with their keys). A button that
// can not act now is pale (refreshObjectButtons). Their icons: OBJECT_MENU_ICONS.
BasicDesigner.OBJECT_ACTIONS = [
    { key: "front", name: "Bring to front (])", description: "Over the other objects of its box: it becomes the last one (the last row of its box in the layers; in a group, the last in its flow)." },
    { key: "back", name: "Send to back ([)", description: "Under the other objects of its box: it becomes the first one." },
    { key: "duplicate", name: "Duplicate (⌘D)", description: "A copy right after it, with what is in it." },
    { key: "delete", name: "Delete (⌫)", description: "An object of the code: Revert all brings it back." },
];

BasicDesigner.createObjectButton = function (action) {
    const btn = BasicDesigner.iconButton({
        path: BasicDesigner.OBJECT_MENU_ICONS[action.key],
        name: action.name,
        description: action.description,
        onClick: function () {
            const s = BasicDesigner.state;
            const obj = s.selected && BasicDesigner.movableOf(s.selected);
            if (obj) BasicDesigner.onObjectMenu(action.key, obj);
        },
    });
    btn._key = action.key;
    btn.setEnabled(false);
    return btn;
};

BasicDesigner.refreshObjectButtons = function () {
    const ui = BasicDesigner.ui;
    if (!ui.objectButtons) return;
    const s = BasicDesigner.state;
    const selected = (s.mode === "select" && s.selected && s.selected.elem.isConnected) ? s.selected : null;
    const can = BasicDesigner.objectActionsOf(selected && BasicDesigner.movableOf(selected));
    ui.objectButtons.forEach(function (btn) { btn.setEnabled(!!can[btn._key]); });
};

// What the object can do now: { front, back, duplicate, delete } (the menu of the object asks the same).
BasicDesigner.objectActionsOf = function (obj) {
    if (!obj) return {};
    const canReorder = BasicDesigner.canReorder(obj);
    return {
        front: canReorder && !!BasicDesigner.nextObject(obj),
        back: canReorder && !!BasicDesigner.previousObject(obj),
        duplicate: BasicDesigner.canCopy(obj),
        delete: true,
    };
};

// Can obj change its order in its box? In a box of the page or on the page itself, not inside a component (its code
// makes that order).
BasicDesigner.canReorder = function (obj) {
    const container = obj.containerBox;
    if (!container) return false;
    return container === BasicDesigner.state.win.page || BasicDesigner.isPlainContainer(container);
};

// BRING TO FRONT / SEND TO BACK: the last / the first object of its box, so it is drawn over / under the others.
// WHY the order and not a zIndex (basic.js bringToFront): the layers show the order, and the code keeps it (a move in the
// prompt), as Move up / down in the layers.
BasicDesigner.bringToFront = function (obj) {
    if (!BasicDesigner.canReorder(obj) || !BasicDesigner.nextObject(obj)) return;
    BasicDesigner.moveObject(obj, { container: obj.containerBox, before: null });
    BasicDesigner.setStatus(BasicDesigner.title(obj).short + ": over the other objects of its box.");
};

BasicDesigner.sendToBack = function (obj) {
    if (!BasicDesigner.canReorder(obj)) return;
    const first = BasicDesigner.childObjects(obj.containerBox)[0];
    if (!first || first === obj) return;
    BasicDesigner.moveObject(obj, { container: obj.containerBox, before: first });
    BasicDesigner.setStatus(BasicDesigner.title(obj).short + ": under the other objects of its box.");
};

BasicDesigner.createToolboxButton = function (item) {
    const size = BasicDesigner.TOOL_ICON_SIZE;
    const btn = BasicDesigner.iconButton({
        html: '<img src="' + BasicDesigner.layerIconFile(item.type) + '" alt="" width="' + size + '" height="' + size + '" draggable="false">',
        name: item.type,
        description: item.description,
        onClick: function () {
            if (BasicDesigner.wasDragging()) return;
            BasicDesigner.addObject(item);
        },
    });
    btn.aria = { label: "Add " + item.type };
    btn.elem.addEventListener("pointerdown", function (event) {
        BasicDesigner.pressDrag(event, { kind: "new", item: item });
    });
    return btn;
};

// The arrow keys move between the buttons of the toolbox (the usual keys of a toolbar).
BasicDesigner.onToolboxKey = function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const buttons = Array.from(BasicDesigner.ui.toolbox.elem.querySelectorAll("[role=button]"));
    const index = buttons.indexOf(document.activeElement);
    if (index === -1) return;
    event.preventDefault();
    event.stopPropagation(); // WHY: Not the arrow keys of the designer (they move the selected object).
    const step = (event.key === "ArrowRight") ? 1 : -1;
    buttons[(index + step + buttons.length) % buttons.length].focus();
};

// THE TIP of a button (its name and what it does): comp/tooltip.js in the colors of the menus, with an arrow that
// points at the button. Over the button; under it when there is no room (the top bar).
BasicDesigner.TIP_TEXT_WIDTH = 200; // The text of the tip wraps at this width.

BasicDesigner.tipLook = function () {
    const C = BasicDesigner.colors;
    return {
        color: C.menu,
        border: 1,
        borderColor: C.line,
        round: 6,
        padding: [10, 8],
        shadow: "0 6px 18px rgba(0, 0, 0, 0.5)",
        arrow: 10,
        contentGap: 3,
        gap: BasicDesigner.TIP_SPACE,
        zIndex: 9000,
    };
};

// item: { type (the name), description }
BasicDesigner.showTip = function (btn, item) {
    BasicDesigner.hideTip();
    const timer = setTimeout(function () {
        const C = BasicDesigner.colors;
        BasicDesigner.tipBubble = Tooltip.show(btn, "", BasicDesigner.tipLook(), "top", function () {
            Label({ plainText: item.type, fontSize: 12, textColor: C.text, fontFamily: "opensans-bold" });
            if (!item.description) return;
            Label({ plainText: item.description, width: BasicDesigner.TIP_TEXT_WIDTH, height: "auto", fontSize: 11, textColor: C.soft, css: { whiteSpace: "normal", lineHeight: "15px" } });
        });
        BasicDesigner.tipBubble.role = "tooltip";
    }, BasicDesigner.TIP_DELAY);
    BasicDesigner.cancelTip = function () { clearTimeout(timer); };
};

BasicDesigner.hideTip = function () {
    if (BasicDesigner.cancelTip) BasicDesigner.cancelTip();
    if (!BasicDesigner.tipBubble) return;
    BasicDesigner.tipBubble.remove();
    BasicDesigner.tipBubble = null;
};

// *** TOP BAR: the page (picker, reload, open), undo / redo, the device width, the changes and Copy prompt.

BasicDesigner.TOP_ICONS = {
    file: "M4 1.8h5l3 3v9.4H4zM9 1.8v3h3",
    folder: "M1.8 4a1 1 0 0 1 1-1h3.4l1.6 1.8h5.4a1 1 0 0 1 1 1v6.4a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z",
    chevron: "M4.5 6.5L8 10l3.5-3.5",
    reload: "M13 8a5 5 0 1 1-1.5-3.6M13 2.5v3h-3",
    open: "M9 2.5h4.5V7M13.5 2.5L7.5 8.5M12 9.5V13H3V4h3.5",
    undo: "M5 3.5L2 6.5l3 3M2 6.5h7.5a3.5 3.5 0 0 1 0 7H7",
    redo: "M11 3.5l3 3-3 3M14 6.5H6.5a3.5 3.5 0 0 0 0 7H9",
    desktop: "M1.5 3h13v8h-13zM6 14h4M8 11v3",
    laptop: "M3 3.5h10v7H3zM1.5 12.5h13",
    tablet: "M4 1.5h8v13H4zM7.5 12.5h1",
    phone: "M5.5 1.5h5v13h-5zM7.5 12.5h1",
    prompt: "M6 1.8h4v2.4H6zM5 3H3.2v11.2h9.6V3H11M5.6 7.5h4.8M5.6 10.2h3.2",
    send: "M14 2L7.2 8.8M14 2L9.6 14l-2.4-5.2L2 6.4z",
    check: "M3.5 8.5l3 3 6-7",
    collapseAll: "M4.5 7L8 4l3.5 3M4.5 12L8 9l3.5 3",
    code: "M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5",
    menu: "M2.5 4h11M2.5 8h11M2.5 12h11",
    expandAll: "M4.5 4L8 7l3.5-3M4.5 9L8 12l3.5-3",
};
BasicDesigner.RECENT_KEY = "basic-designer-recent";
BasicDesigner.MENU_MAX_HEIGHT = 420; // a longer list scrolls
BasicDesigner.TOP_BUTTON_SIZE = 28;
BasicDesigner.MIN_CANVAS_WIDTH = 200; // the smallest width of the Width field
BasicDesigner.COPIED_TIME = 1500; // ms: "Copied ✓" on the button

// A vertical line between the groups of the top bar.
BasicDesigner.topDivider = function () {
    const divider = Box({ width: 1, height: 22, color: BasicDesigner.colors.line });
    divider.shrink = 0;
    divider.css = { margin: "0px 4px" };
    return divider;
};

BasicDesigner.topIconButton = function (icon, name, description, onClick) {
    return BasicDesigner.iconButton({
        path: BasicDesigner.TOP_ICONS[icon],
        name: name,
        description: description,
        onClick: onClick,
        size: BasicDesigner.TOP_BUTTON_SIZE,
        iconSize: 16,
    });
};

BasicDesigner.buildTopBar = function () {

    const cfg = BasicDesigner.config;
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;

    // GROUP: Top bar
    const bar = ui.topBar = HGroup(0, 0, "calc(100% - " + cfg.rightWidth + "px)", cfg.topHeight, { align: "left center", gap: 4, padding: [10, 0], color: C.bar });
    bar.css = { borderBottom: "1px solid " + C.line };

        ui.btnMenu = BasicDesigner.topIconButton("menu", "Menu", "Open a page, a new component, the shortcuts, the settings.", function (btn) {
            BasicDesigner.toggleMainMenu(btn);
        });

        // LABEL: Name
        ui.lblLogo = Label({ text: "basic designer", fontSize: 13, textColor: C.text, fontFamily: "opensans-bold" });
        ui.lblLogo.shrink = 0;
        ui.lblLogo.css = { marginRight: "8px" };

        BasicDesigner.buildPagePicker();
        ui.btnReload = BasicDesigner.topIconButton("reload", "Reload", "Load the page again from its code. Unsaved changes are offered back.", function () {
            if (BasicDesigner.state.pagePath) BasicDesigner.load(BasicDesigner.state.pagePath);
        });
        ui.btnOpenPage = BasicDesigner.topIconButton("open", "Open the page", "Open the page itself in a new tab.", function () {
            if (BasicDesigner.state.pageUrl) window.open(BasicDesigner.state.pageUrl, "_blank");
        });

        BasicDesigner.topDivider();

        ui.btnUndo = BasicDesigner.topIconButton("undo", "Undo (Cmd/Ctrl+Z)", "Undo the last change.", BasicDesigner.undo);
        ui.btnRedo = BasicDesigner.topIconButton("redo", "Redo (Shift+Cmd/Ctrl+Z)", "Make the undone change again.", BasicDesigner.redo);

        BasicDesigner.topDivider();

        ui.deviceButtons = cfg.devices.map(function (d) {
            const size = (d.width) ? d.width + " px wide." : "The width of the canvas.";
            const btn = BasicDesigner.topIconButton(d.icon, d.text, size, function () { BasicDesigner.setDevice(d.key); });
            btn._key = d.key;
            return btn;
        });

        // INPUT: Width (a custom device)
        ui.inpWidth = Input({ width: 64, height: 26, fontSize: 12, color: C.field, textColor: C.text, border: 1, borderColor: C.fieldBorder, round: 5, placeholder: "Width" });
        ui.inpWidth.shrink = 0;
        ui.inpWidth.css = { marginLeft: "4px" };
        ui.inpWidth.inputElement.style.padding = "0px 8px";
        ui.inpWidth.inputElement.setAttribute("aria-label", "Canvas width (px)");
        ui.inpWidth.inputElement.addEventListener("keydown", function (event) {
            event.stopPropagation(); // WHY: Not a shortcut of the designer.
            if (event.key !== "Enter") return;
            const width = parseInt(ui.inpWidth.inputElement.value, 10);
            if (width > 0) BasicDesigner.setDevice("custom", Math.max(BasicDesigner.MIN_CANVAS_WIDTH, width));
            else BasicDesigner.setDevice("full");
        });

        // LABEL: The size of the canvas now
        ui.lblCanvasSize = Label({ text: "", fontSize: 11, textColor: C.dim, css: { whiteSpace: "nowrap", marginLeft: "6px" } });
        ui.lblCanvasSize.shrink = 0;

        // BOX: Space (pushes the rest to the right)
        const space = Box({ width: 10, height: 1, color: "transparent" });
        space.grow = 1;

        // LABEL: Changes
        ui.lblTopChanges = Label({ text: "", fontSize: 12, textColor: C.soft, css: { whiteSpace: "nowrap", marginRight: "6px" } });
        ui.lblTopChanges.shrink = 0;

        // Send to AI (VS Code only), and Copy prompt at its right: send it, or copy it.
        if (BasicDesigner.isInVSCode) ui.btnTopSend = BasicDesigner.sendButton(false);
        ui.btnTopCopy = BasicDesigner.copyButton(false);

    endGroup();

    window.addEventListener("resize", BasicDesigner.refreshCanvasSize);
    window.addEventListener("resize", BasicDesigner.fitTopBar);

};

// A narrow window: the less needed parts go, one by one, until the bar fits (the canvas size, the number of
// changes, the name of the designer). A wider window brings them back.
BasicDesigner.fitTopBar = function () {
    const ui = BasicDesigner.ui;
    if (!ui.topBar) return;
    const parts = [ui.lblCanvasSize, ui.lblTopChanges, ui.lblLogo];
    parts.forEach(function (part) { part.visible = 1; });
    const bar = ui.topBar.elem;
    for (let i = 0; i < parts.length && bar.scrollWidth > bar.clientWidth; i++) {
        parts[i].visible = 0;
    }
};

// A small picture of an SVG path in a color (not a button).
BasicDesigner.svgLabel = function (path, size, color) {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none"' +
        ' stroke="' + color + '" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
    const lbl = Label({ text: svg, width: size, height: size, lineHeight: "0" });
    lbl.shrink = 0;
    return lbl;
};

// A small title over a list, with an icon in front of it when iconPath is given (the page list, Open Folder).
BasicDesigner.listTitle = function (title, iconPath = "") {
    const C = BasicDesigner.colors;
    const titleRow = HGroup({ width: "100%", height: "auto", gap: 5, align: "left center", color: "transparent" });
    titleRow.shrink = 0;
        if (iconPath) BasicDesigner.svgLabel(iconPath, 12, C.dim);
        const lbl = Label({ text: "", fontSize: 11, textColor: C.dim });
        lbl.plainText = title; // WHY: It can hold the typed text.
    endGroup();
    return titleRow;
};

BasicDesigner.refreshCanvasSize = function () {
    const ui = BasicDesigner.ui;
    if (!ui.lblCanvasSize || !ui.frameBox) return;
    const r = ui.frameBox.elem.getBoundingClientRect();
    ui.lblCanvasSize.text = Math.round(r.width) + " × " + Math.round(r.height);
};

// Undo / redo can be pressed? The number of changes.
BasicDesigner.refreshTopBar = function () {
    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    if (!ui.btnUndo) return;
    ui.btnUndo.setEnabled(s.history.length > 1);
    ui.btnRedo.setEnabled(s.redoList.length > 0);
    ui.btnReload.setEnabled(!!s.pagePath);
    ui.btnOpenPage.setEnabled(!!s.pageUrl);
    const count = BasicDesigner.changeCount();
    ui.lblTopChanges.text = (count) ? count + ((count === 1) ? " change" : " changes") : "No changes";
    BasicDesigner.fitTopBar(); // WHY: The text of the changes can make the bar wider.
};

// An SVG of a top bar icon, in the color of the text (currentColor).
BasicDesigner.iconSvg = function (icon, size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="none"' +
        ' stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="display:block"><path d="' +
        BasicDesigner.TOP_ICONS[icon] + '"/></svg>';
};

// The Copy prompt button. withText: the icon and "Copy prompt" (the Changes panel); else only the icon (the top bar).
// idleText / copiedText: what it shows, and for a while after a copy.
BasicDesigner.copyButton = function (withText) {
    const C = BasicDesigner.colors;
    const icon = BasicDesigner.iconSvg("prompt", 16);
    const check = BasicDesigner.iconSvg("check", 16);
    const btn = BasicDesigner.toolButton("", BasicDesigner.copyPrompt, { color: C.accent, hoverColor: C.accentHover });
    btn.idleText = (withText) ? icon + "<span>Copy prompt</span>" : icon;
    btn.copiedText = (withText) ? check + "<span>Copied</span>" : check;
    btn.text = btn.idleText;
    btn.css = { gap: "6px" };
    btn.aria = { label: "Copy prompt" };
    if (withText) return btn;
    // WHY: Only an icon: the tip says what it does.
    btn.css = { padding: "0px", width: BasicDesigner.TOP_BUTTON_SIZE + 4 + "px" };
    const tip = { type: "Copy prompt", description: "The changes and the notes as a prompt, to the clipboard: give it to the AI that edits the code." };
    btn.onHoverChange(function (self, isOver) {
        if (isOver) BasicDesigner.showTip(btn, tip);
        else BasicDesigner.hideTip();
    });
    return btn;
};

// The prompt to the clipboard. btn: a copy button (it shows its copiedText for a while).
BasicDesigner.copyPrompt = function (btn) {
    const text = BasicDesigner.buildPrompt();
    if (!text) {
        BasicDesigner.setStatus("No changes or notes yet.");
        return;
    }
    BasicDesigner.hideTip();
    BasicDesigner.copyText(text).then(function () {
        btn.text = btn.copiedText;
        if (btn.copiedTimer) clearTimeout(btn.copiedTimer);
        btn.copiedTimer = setTimeout(function () { btn.text = btn.idleText; }, BasicDesigner.COPIED_TIME);
        BasicDesigner.setStatus("The prompt is copied: give it to the AI that edits the code.");
    }).catch(function (error) {
        BasicDesigner.setStatus("Could not copy the prompt: " + ((error && error.message) || error) + " (it is in the console).", "error");
        console.log(text);
    });
};

// *** VS CODE: the designer in the webview of the basic designer extension (vscode-extension/). The webview
// passes the messages between the designer and the extension: "sendPrompt" (the extension asks for the AI and
// the model, then starts its CLI in a terminal), "openFile" (the code at a line); back: "status", "load".

BasicDesigner.HOST_PARAMS = new URLSearchParams(location.search);
BasicDesigner.isInVSCode = (BasicDesigner.HOST_PARAMS.get("host") === "vscode" && window.parent !== window);
// WHY: The origin of the webview; "*" when the browser does not give one ("null").
BasicDesigner.hostOrigin = BasicDesigner.HOST_PARAMS.get("hostOrigin") || "";

// 1 when the message went to the extension.
BasicDesigner.postToHost = function (type, data = {}) {
    if (!BasicDesigner.isInVSCode) return 0;
    const origin = BasicDesigner.hostOrigin;
    const targetOrigin = (origin && origin !== "null") ? origin : "*";
    window.parent.postMessage(Object.assign({ source: "basic-designer", type: type }, data), targetOrigin);
    return 1;
};

BasicDesigner.onHostMessage = function (event) {
    if (event.source !== window.parent) return;
    const data = event.data || {};
    if (data.source !== "basic-designer-host") return;
    if (data.type === "status") BasicDesigner.setStatus(String(data.text || ""), data.kind || "info");
    if (data.type === "load" && data.page) BasicDesigner.load(String(data.page));
    if (data.type === "codeChanged") BasicDesigner.onCodeChanged(data.page, data.files || []);
    if (data.type === "reply") BasicDesigner.onHostReply(data);
};

// A request to the extension that has an answer (listFolder, createFile): a promise of its result.
BasicDesigner.HOST_REPLY_TIME = 10000; // ms: no answer -> an error
BasicDesigner.hostRequests = {}; // id -> { resolve, reject, timer }
BasicDesigner.hostRequestCount = 0;

BasicDesigner.requestHost = function (action, data = {}) {
    return new Promise(function (resolve, reject) {
        BasicDesigner.hostRequestCount++;
        const id = String(BasicDesigner.hostRequestCount);
        const timer = setTimeout(function () {
            delete BasicDesigner.hostRequests[id];
            reject(new Error("VS Code did not answer (" + action + "). Is the extension up to date?"));
        }, BasicDesigner.HOST_REPLY_TIME);
        BasicDesigner.hostRequests[id] = { resolve: resolve, reject: reject, timer: timer };
        BasicDesigner.postToHost("request", Object.assign({ id: id, action: action }, data));
    });
};

BasicDesigner.onHostReply = function (data) {
    const request = BasicDesigner.hostRequests[data.id];
    if (!request) return;
    delete BasicDesigner.hostRequests[data.id];
    clearTimeout(request.timer);
    if (data.ok) request.resolve(data.result);
    else request.reject(new Error(String(data.error || "The extension could not do it.")));
};

// The session as a text, without its time: two equal texts are the same changes.
BasicDesigner.sessionText = function () {
    const session = BasicDesigner.buildSession();
    delete session.savedAt;
    return JSON.stringify(session);
};

BasicDesigner.sentSessionText = null; // The changes of the last Send to AI

// The files of the page in the repository (the page, its scripts and style sheets), for the extension to watch.
BasicDesigner.pageFiles = function () {
    const s = BasicDesigner.state;
    const doc = s.win.document;
    const scripts = Array.from(doc.scripts).map(function (script) { return script.src; });
    const styleSheets = Array.from(doc.querySelectorAll("link[rel=stylesheet]")).map(function (link) { return link.href; });
    const urls = Object.keys(s.sources).concat(scripts, styleSheets).filter(Boolean);
    const files = [s.pagePath].concat(urls.map(BasicDesigner.relPath));
    return files.filter(function (file, index) {
        return !/^[a-z]+:/i.test(file) && files.indexOf(file) === index;
    });
};

// The AI changed a file of the page (the extension watches them after a Send). When the changes are still the
// ones that were sent, they are in the code now: the saved session goes and the page loads again. New changes
// made after the Send stay: the page is not loaded then, the bar says so.
BasicDesigner.onCodeChanged = async function (page, files) {
    const s = BasicDesigner.state;
    const names = files.join(", ");
    if (page !== s.pagePath) return;
    if (BasicDesigner.sessionText() !== BasicDesigner.sentSessionText) {
        BasicDesigner.setStatus("The code changed (" + names + "). Your new changes are kept: reload (↻) when you are ready.", "wait");
        return;
    }
    BasicDesigner.discardSession();
    // WHY: load() returns before the page is ready: the message is shown when it is.
    BasicDesigner.messageAfterLoad = "The code changed (" + names + "): the page is loaded again.";
    await BasicDesigner.load(s.pagePath);
    BasicDesigner.sentSessionText = BasicDesigner.sessionText(); // WHY: The AI may go on: the next change loads it again too.
};

BasicDesigner.messageAfterLoad = ""; // A message for the status bar when the page is loaded (then the hint)

if (BasicDesigner.isInVSCode) window.addEventListener("message", BasicDesigner.onHostMessage);

// The Send to AI button (VS Code only). withText: the icon and "Send to AI"; else only the icon (the top bar).
BasicDesigner.sendButton = function (withText) {
    const C = BasicDesigner.colors;
    const icon = BasicDesigner.iconSvg("send", 16);
    const btn = BasicDesigner.toolButton("", BasicDesigner.sendPrompt, { color: C.accent, hoverColor: C.accentHover });
    btn.text = (withText) ? icon + "<span>Send to AI</span>" : icon;
    btn.css = { gap: "6px" };
    btn.aria = { label: "Send to AI" };
    if (withText) return btn;
    btn.css = { padding: "0px", width: BasicDesigner.TOP_BUTTON_SIZE + 4 + "px" };
    const tip = { type: "Send to AI", description: "The prompt to Claude Code or Codex: VS Code asks which one and the model, then starts it in a terminal." };
    btn.onHoverChange(function (self, isOver) {
        if (isOver) BasicDesigner.showTip(btn, tip);
        else BasicDesigner.hideTip();
    });
    return btn;
};

BasicDesigner.sendPrompt = function () {
    const prompt = BasicDesigner.buildPrompt();
    if (!prompt) {
        BasicDesigner.setStatus("No changes or notes yet.");
        return;
    }
    BasicDesigner.hideTip();
    BasicDesigner.sentSessionText = BasicDesigner.sessionText();
    BasicDesigner.postToHost("sendPrompt", { prompt: prompt, page: BasicDesigner.state.pagePath, files: BasicDesigner.pageFiles() });
    BasicDesigner.setStatus("Choose the AI and the model in VS Code (at the top of the window) …", "wait");
};

// PAGE PICKER: the path, and a list: the recent pages, the pages of the selected folder, the recent folders.

BasicDesigner.recentPages = function () {
    return basic.storage.load(BasicDesigner.RECENT_KEY) || [];
};

BasicDesigner.rememberPage = function (pagePath) {
    const list = BasicDesigner.recentPages().filter(function (p) { return p !== pagePath; });
    list.unshift(pagePath);
    basic.storage.save(BasicDesigner.RECENT_KEY, list.slice(0, BasicDesigner.config.recentCount));
};

// *** PATHS THAT ARE NOT THERE ANY MORE (an old recent page "did not open"; a folder was moved):
// they leave the recent pages and folders, and the saved session of a page goes with it. Only a sure answer
// (404, ENOENT) removes a path: an error of the network or a server that does not list folders keeps it.

BasicDesigner.isMissingError = function (error) {
    return /404|ENOENT|no such file/i.test(String(error && error.message || error));
};

BasicDesigner.forgetPage = function (pagePath) {
    const list = BasicDesigner.recentPages().filter(function (p) { return p !== pagePath; });
    basic.storage.save(BasicDesigner.RECENT_KEY, list);
    basic.storage.remove(BasicDesigner.SESSION_KEY + pagePath);
};

BasicDesigner.forgetFolder = function (folderPath) {
    const list = BasicDesigner.recentFolders().filter(function (p) { return p !== folderPath; });
    basic.storage.save(BasicDesigner.RECENT_FOLDERS_KEY, list);
};

// 1: the page is surely not there (404)
BasicDesigner.isPageMissing = async function (pagePath) {
    try {
        const response = await fetch(new URL(pagePath, BasicDesigner.state.rootUrl).href, { method: "HEAD", cache: "no-store" });
        return (response.status === 404) ? 1 : 0;
    } catch (error) {
        return 0;
    }
};

BasicDesigner.isFolderMissing = async function (folderPath) {
    try {
        await BasicDesigner.listFolder(folderPath);
        return 0;
    } catch (error) {
        return BasicDesigner.isMissingError(error) ? 1 : 0;
    }
};

// Once in a session of the designer (the first time the list of pages opens). Returns 1 when one was removed.
BasicDesigner.forgetMissingPaths = async function () {
    if (BasicDesigner.areRecentPathsChecked) return 0;
    BasicDesigner.areRecentPathsChecked = true;
    const pages = BasicDesigner.recentPages();
    const folders = BasicDesigner.recentFolders();
    const missingPages = await Promise.all(pages.map(BasicDesigner.isPageMissing));
    const missingFolders = await Promise.all(folders.map(BasicDesigner.isFolderMissing));
    let count = 0;
    pages.forEach(function (pagePath, index) {
        if (!missingPages[index]) return;
        BasicDesigner.forgetPage(pagePath);
        count++;
    });
    folders.forEach(function (folderPath, index) {
        if (!missingFolders[index]) return;
        BasicDesigner.forgetFolder(folderPath);
        count++;
    });
    return (count) ? 1 : 0;
};

BasicDesigner.buildPagePicker = function () {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;

    // GROUP: The field of the page (an icon, the path, the list button)
    ui.pageField = HGroup({ width: 320, height: 28, gap: 0, align: "left center", color: C.field, round: 5, border: 1, borderColor: C.fieldBorder });
    ui.pageField.shrink = 1; // WHY: A narrow window makes the field smaller first, not the buttons.
    ui.pageField.css = { minWidth: "180px", transition: "border-color 0.12s" };

        const icon = BasicDesigner.svgLabel(BasicDesigner.TOP_ICONS.file, 14, C.soft);
        icon.css = { margin: "0px 4px 0px 8px" };

        ui.inpPage = Input({ width: 10, height: 26, fontSize: 12, textColor: C.text, minimal: 1, placeholder: "Path of a page: 02-comp-examples/tabs.htm" });
        ui.inpPage.grow = 1;
        ui.inpPage.css = { minWidth: "0px" };
        ui.inpPage.inputElement.style.padding = "0px 4px";
        ui.inpPage.inputElement.style.background = "transparent";
        ui.inpPage.inputElement.setAttribute("aria-label", "Page");

        ui.btnPageList = BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.chevron, name: "Pages", description: "The recent pages, the pages of the folder and the recent folders.", size: 26, iconSize: 14,
            onClick: function () { BasicDesigner.togglePageMenu(""); } });

    endGroup();

    const input = ui.inpPage.inputElement;
    input.addEventListener("keydown", BasicDesigner.onPageFieldKey);
    input.addEventListener("input", function () { BasicDesigner.openPageMenu(input.value); });
    input.addEventListener("focus", function () {
        ui.pageField.borderColor = C.accent;
        input.select();
    });
    input.addEventListener("blur", function () { ui.pageField.borderColor = C.fieldBorder; });

};

// Enter: the page chosen with the arrows, or the typed path. Up / Down: move in the list. Escape: back to the page.
BasicDesigner.onPageFieldKey = function (event) {
    const ui = BasicDesigner.ui;
    const input = ui.inpPage.inputElement;
    event.stopPropagation(); // WHY: Not a shortcut of the designer (Backspace would delete an object).
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!ui.pageMenu) {
            BasicDesigner.openPageMenu(input.value);
            return;
        }
        BasicDesigner.moveInPageMenu((event.key === "ArrowDown") ? 1 : -1);
        return;
    }
    if (event.key === "Enter") {
        const active = ui.pageMenuRows && ui.pageMenuRows[ui.pageMenuIndex];
        BasicDesigner.closePageMenu();
        if (active) active.choose();
        else BasicDesigner.load(input.value);
        return;
    }
    if (event.key === "Escape") {
        BasicDesigner.closePageMenu();
        input.value = BasicDesigner.state.pagePath;
        input.blur();
        return;
    }
    if (event.key === "Tab") BasicDesigner.closePageMenu();
};

BasicDesigner.moveInPageMenu = function (step) {
    const ui = BasicDesigner.ui;
    const rows = ui.pageMenuRows || [];
    if (!rows.length) return;
    ui.pageMenuIndex = (ui.pageMenuIndex + step + rows.length) % rows.length; // WHY: % goes around at both ends.
    BasicDesigner.paintPageMenu();
    rows[ui.pageMenuIndex].row.elem.scrollIntoView({ block: "nearest" }); // WHY: In the scrolling part of the menu.
};

// The row chosen with the arrows or under the mouse; the page that is open now is blue.
BasicDesigner.paintPageMenu = function () {
    const ui = BasicDesigner.ui;
    const C = BasicDesigner.colors;
    (ui.pageMenuRows || []).forEach(function (item, index) {
        const isActive = (index === ui.pageMenuIndex) || item.isHover;
        item.row.color = (isActive) ? C.hover : "transparent";
        item.row.textColor = (item.pagePath === BasicDesigner.state.pagePath) ? C.accentLight : C.text;
        item.row.aria = { selected: index === ui.pageMenuIndex };
    });
};

BasicDesigner.togglePageMenu = function (filter) {
    if (BasicDesigner.ui.pageMenu) BasicDesigner.closePageMenu();
    else BasicDesigner.openPageMenu(filter);
};

BasicDesigner.closePageMenu = function () {
    const ui = BasicDesigner.ui;
    if (!ui.pageMenu) return;
    // WHY: Its own remove(): it also takes off its listener of the page size.
    if (ui.pageMenuScrollBar) ui.pageMenuScrollBar.remove();
    ui.pageMenuScrollBar = null;
    ui.pageMenu.remove();
    ui.pageMenu = null;
    ui.pageMenuRows = [];
    ui.pageMenuIndex = -1;
};

// The list under the field, with the typed text in them: "Recent pages", the pages of the selected folder (its
// name as the title; "Open Folder…" when there is none), then "Recent folders" (a click selects one) at the bottom
// The paths that are not there any more are removed the first time (forgetMissingPaths).
BasicDesigner.openPageMenu = function (filter) {
    BasicDesigner.forgetMissingPaths().then(function (isChanged) {
        if (isChanged && BasicDesigner.ui.pageMenu) BasicDesigner.openPageMenu(filter);
    });

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const text = String(filter || "").trim().toLowerCase();
    const has = function (path) { return path.toLowerCase().indexOf(text) !== -1; };
    const recent = BasicDesigner.recentPages().filter(has);
    const folder = BasicDesigner.folder;
    const folderPages = (folder) ? folder.pages.filter(function (page) { return has(page) && recent.indexOf(page) === -1; }) : [];
    const recentFolders = BasicDesigner.recentFolders().filter(function (path) { return has(path) && (!folder || path !== folder.path); });

    BasicDesigner.closePageMenu();
    const rect = ui.pageField.elem.getBoundingClientRect();
    ui.pageMenuRows = [];
    ui.pageMenuIndex = -1;

    createIn(page, function () {
        // BOX: Page menu (the frame; the scroll bar is put in it)
        ui.pageMenu = startBox({ width: Math.max(rect.width, 360), height: 10, color: C.menu, round: 8, border: 1, borderColor: C.line });
        ui.pageMenu.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
        ui.pageMenu.zIndex = 9000;

            // BOX: The part that scrolls
            ui.pageMenuScroll = startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });
            ui.pageMenuScroll.role = "listbox";

                // GROUP: The rows
                // WHY: position "relative": the scrolling box gets the height of the list. shrink 0 on every row:
                //      in a column with a limited height the rows would get smaller and lie on each other.
                const list = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, padding: 4, color: "transparent", position: "relative" });
                list.css = { alignItems: "stretch", boxSizing: "border-box" };

                    const addTitle = function (title, iconPath) {
                        const titleRow = BasicDesigner.listTitle(title, iconPath);
                        titleRow.css = { padding: "6px 8px 2px 8px", boxSizing: "border-box" };
                    };
                    // A row: shownText, and what a click (or Enter) does. pagePath: the open page is painted blue.
                    const addRow = function (shownText, choose, pagePath = "") {
                        // LABEL: A page, a folder or an action
                        const row = Label({ text: "", width: "100%", height: 26, fontSize: 12, textColor: C.text, round: 5, color: "transparent" });
                        row.plainText = shownText;
                        row.shrink = 0;
                        row.css = { display: "flex", alignItems: "center", padding: "0px 8px", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "relative" };
                        row.clickable = 1;
                        row.cursor = "pointer";
                        row.role = "option";
                        const item = { row: row, pagePath: pagePath, choose: choose, isHover: false };
                        ui.pageMenuRows.push(item);
                        row.onHoverChange(function (self, isOver) {
                            item.isHover = isOver;
                            BasicDesigner.paintPageMenu();
                        });
                        row.on("click", function () {
                            BasicDesigner.closePageMenu();
                            choose();
                        });
                    };
                    const addPageRow = function (pagePath, shownText) {
                        addRow(shownText || pagePath, function () { BasicDesigner.load(pagePath); }, pagePath);
                    };

                    // RECENT PAGES
                    if (recent.length) addTitle("Recent pages", BasicDesigner.TOP_ICONS.file);
                    recent.forEach(function (pagePath) { addPageRow(pagePath); });

                    // SELECTED FOLDER: its pages, shown without the folder part of their path
                    if (folder && (folderPages.length || !text)) {
                        addTitle("Selected folder: " + folder.path + "/" + ((folder.pages.length) ? "" : "  (no .htm page)"), BasicDesigner.TOP_ICONS.folder);
                        folderPages.forEach(function (pagePath) { addPageRow(pagePath, pagePath.slice(folder.path.length + 1)); });
                    } else if (!text) {
                        addTitle("Selected folder", BasicDesigner.TOP_ICONS.folder);
                        addRow("Open Folder…", function () { BasicDesigner.openFolderDialog(); });
                    }

                    // RECENT FOLDERS (at the bottom): a click selects the folder, and the list shows its pages
                    if (recentFolders.length) addTitle("Recent folders", BasicDesigner.TOP_ICONS.folder);
                    recentFolders.forEach(function (folderPath) {
                        addRow("▸  " + folderPath + "/", async function () {
                            if (await BasicDesigner.setFolder(folderPath)) BasicDesigner.openPagePicker();
                        });
                    });

                    if (text && !recent.length && !folderPages.length && !recentFolders.length) addTitle("No page with \"" + text + "\". Enter loads the path as it is.");

                endGroup();

            endBox();

        endBox();

        // The frame as high as the list, up to MENU_MAX_HEIGHT (then it scrolls). + 2: the top and bottom border.
        ui.pageMenu.height = Math.min(list.elem.offsetHeight, BasicDesigner.MENU_MAX_HEIGHT) + 2;
        if (typeof ScrollBar !== "undefined") {
            ui.pageMenuScrollBar = ScrollBar({ scrollableBox: ui.pageMenuScroll, bar_color: "#888888", neverHide: 0, showDots: 0 });
        }
    });

    ui.pageMenu.left = Math.round(rect.left);
    ui.pageMenu.top = Math.round(rect.bottom + 4);
    BasicDesigner.paintPageMenu();

};

// *** MENU, DIALOGS, SETTINGS:

BasicDesigner.SETTINGS_KEY = "basic-designer-settings";
BasicDesigner.settings = Object.assign({
    snap: true,
    snapDistance: 5,
    emptyBoxEdges: true, // a dashed edge on the boxes and the groups that paint nothing
    rootPath: BasicDesigner.config.rootPath,
    colorGroups: [{ id: "1", name: "My colors", colors: [] }], // { id, name, colors: ["#3871E0", ...] }
    paletteOrder: [], // the keys of the default palettes (default-palettes.js) in your order; [] = their own order
    hiddenPalettes: [], // the keys of the default palettes that are not in the color picker
    favoriteColors: [], // the colors you added to ★ Favorites with + (the newest first)
    removedFavorites: [], // the colors of the file you deleted from ★ Favorites (Reset order and show all brings them back)
    background: "gray", // a key of BasicDesigner.BACKGROUNDS
    accent: "blue", // a key of BasicDesigner.ACCENTS
}, basic.storage.load(BasicDesigner.SETTINGS_KEY) || {});
BasicDesigner.applyTheme();

BasicDesigner.saveSettings = function () {
    basic.storage.save(BasicDesigner.SETTINGS_KEY, BasicDesigner.settings);
};

BasicDesigner.openPagePicker = function () {
    const input = BasicDesigner.ui.inpPage.inputElement;
    input.focus();
    input.select();
    BasicDesigner.openPageMenu("");
};

// *** FOLDER: Open Folder… chooses a folder of the repository; its .htm pages are listed in the page picker
// (after Recent). New page… makes a page in it. In a browser the folders are read from the folder pages
// of the server (Live Server lists a folder); in VS Code the extension reads them.

BasicDesigner.FOLDER_KEY = "basic-designer-folder";
BasicDesigner.FOLDER_DEPTH = 3; // the subfolders read under the chosen folder
BasicDesigner.FOLDER_PAGE_LIMIT = 300;
BasicDesigner.SKIPPED_FOLDERS = ["node_modules", ".git"];
BasicDesigner.NEW_PAGE_TEMPLATE = "_basic-designer/templates/new-page.htm";
BasicDesigner.folder = null; // { path, pages: [paths from the root] }
BasicDesigner.RECENT_FOLDERS_KEY = "basic-designer-recent-folders";
BasicDesigner.RECENT_FOLDER_COUNT = 8;

BasicDesigner.recentFolders = function () {
    return basic.storage.load(BasicDesigner.RECENT_FOLDERS_KEY) || [];
};

BasicDesigner.rememberFolder = function (folderPath) {
    const list = BasicDesigner.recentFolders().filter(function (path) { return path !== folderPath; });
    list.unshift(folderPath);
    basic.storage.save(BasicDesigner.RECENT_FOLDERS_KEY, list.slice(0, BasicDesigner.RECENT_FOLDER_COUNT));
};

// The folders and the .htm files right in a folder: { folders: [names], files: [names] }.
BasicDesigner.PAGE_FILES = /\.html?$/i;
BasicDesigner.PICTURE_FILES = /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i;

// kind: "" (the pages) or "images" (the pictures)
BasicDesigner.listFolder = async function (folderPath, kind = "") {
    const pattern = (kind === "images") ? BasicDesigner.PICTURE_FILES : BasicDesigner.PAGE_FILES;
    if (BasicDesigner.isInVSCode) {
        const answer = await BasicDesigner.requestHost("listFolder", { folder: folderPath, kind: kind });
        // WHY the filter: an extension older than 0.0.6 gives only the pages (it does not know kind)
        return { folders: answer.folders, files: answer.files.filter(function (name) { return pattern.test(name); }) };
    }
    const url = new URL((folderPath) ? folderPath + "/" : "", BasicDesigner.state.rootUrl).href;
    const html = await BasicDesigner.fetchText(url);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const result = { folders: [], files: [] };
    doc.querySelectorAll("a[title]").forEach(function (link) {
        const name = link.getAttribute("title");
        if (!name || name === ".." || name.charAt(0) === ".") return;
        if (link.classList.contains("icon-directory")) result.folders.push(name);
        else if (pattern.test(name)) result.files.push(name);
    });
    if (!result.folders.length && !result.files.length && !/listing directory/i.test(html)) {
        throw new Error("The server does not list folders (Live Server does).");
    }
    return result;
};

// Every .htm page in a folder and in its subfolders (up to FOLDER_DEPTH), as paths from the root.
BasicDesigner.readFolderPages = async function (folderPath) {
    const pages = [];
    const readLevel = async function (path, depth) {
        if (pages.length >= BasicDesigner.FOLDER_PAGE_LIMIT) return;
        const list = await BasicDesigner.listFolder(path);
        list.files.sort().forEach(function (name) { pages.push(path + "/" + name); });
        if (depth >= BasicDesigner.FOLDER_DEPTH) return;
        const folders = list.folders.filter(function (name) { return BasicDesigner.SKIPPED_FOLDERS.indexOf(name) === -1; }).sort();
        for (const name of folders) await readLevel(path + "/" + name, depth + 1);
    };
    await readLevel(folderPath, 1);
    return pages.slice(0, BasicDesigner.FOLDER_PAGE_LIMIT);
};

BasicDesigner.setFolder = async function (folderPath) {
    BasicDesigner.setStatus("Reading " + folderPath + "/ …", "wait");
    try {
        const pages = await BasicDesigner.readFolderPages(folderPath);
        BasicDesigner.folder = { path: folderPath, pages: pages };
        basic.storage.save(BasicDesigner.FOLDER_KEY, folderPath);
        BasicDesigner.rememberFolder(folderPath);
        BasicDesigner.setStatus(folderPath + "/: " + pages.length + ((pages.length === 1) ? " page." : " pages."));
        return true;
    } catch (error) {
        BasicDesigner.setStatus("Could not read the folder " + folderPath + ": " + error.message, "error");
        return false;
    }
};

// The folder of the last visit, read again when the designer opens.
BasicDesigner.restoreFolder = async function () {
    const folderPath = basic.storage.load(BasicDesigner.FOLDER_KEY);
    if (!folderPath) return;
    try {
        BasicDesigner.folder = { path: folderPath, pages: await BasicDesigner.readFolderPages(folderPath) };
    } catch (error) {
        BasicDesigner.folder = null; // WHY: A folder that is not there any more is forgotten quietly.
    }
};

// The folder of a page path ("a/b/c.htm" -> "a/b").
BasicDesigner.folderOf = function (pagePath) {
    const parts = String(pagePath || "").split("/");
    parts.pop();
    return parts.join("/");
};

// Open Folder…: a list of the folders of the repository; a click goes into one, "Open" chooses it.
// afterOpen: what to do then (default: the page picker opens on the pages of the folder).
BasicDesigner.openFolderDialog = function (afterOpen) {
    const C = BasicDesigner.colors;
    const startPath = (BasicDesigner.folder && BasicDesigner.folder.path) || BasicDesigner.folderOf(BasicDesigner.state.pagePath);
    let currentPath = startPath;
    let listBox = null;
    let lblPath = null;
    let lblCount = null;

    const showFolder = async function (folderPath) {
        currentPath = folderPath;
        lblPath.plainText = "/" + folderPath;
        lblCount.plainText = "…";
        let list;
        try {
            list = await BasicDesigner.listFolder(folderPath);
        } catch (error) {
            lblCount.plainText = error.message;
            return;
        }
        if (currentPath !== folderPath) return; // WHY: A faster click went into another folder.
        lblCount.plainText = list.files.length + ((list.files.length === 1) ? " page" : " pages") + " here";
        createIn(listBox, function () {
            listBox.elem.innerHTML = "";
            if (folderPath) addFolderRow("..", BasicDesigner.folderOf(folderPath));
            list.folders.sort().forEach(function (name) {
                addFolderRow(name, (folderPath) ? folderPath + "/" + name : name);
            });
            if (!list.folders.length && !folderPath) Label({ text: "No folder.", fontSize: 12, textColor: C.dim });
        });
    };

    const addFolderRow = function (name, folderPath) {
        // LABEL: A folder (a click goes into it)
        const row = Label({ text: "", width: "100%", height: 26, fontSize: 12, textColor: C.text, round: 5, color: "transparent" });
        row.plainText = (name === "..") ? "↑  .." : "▸  " + name;
        row.shrink = 0;
        row.css = { display: "flex", alignItems: "center", padding: "0px 8px", boxSizing: "border-box", whiteSpace: "nowrap", position: "relative" };
        row.clickable = 1;
        row.cursor = "pointer";
        row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
        row.on("click", function () { showFolder(folderPath); });
    };

    const openFolder = async function () {
        if (!currentPath) {
            BasicDesigner.setStatus("Choose a folder in the repository (not the root).");
            return;
        }
        BasicDesigner.closeDialog();
        const isRead = await BasicDesigner.setFolder(currentPath);
        if (!isRead) return;
        if (afterOpen) afterOpen();
        else BasicDesigner.openPagePicker();
    };

    // A recent folder: a click opens it at once (no going through the folders).
    const openRecent = async function (folderPath) {
        BasicDesigner.closeDialog();
        const isRead = await BasicDesigner.setFolder(folderPath);
        if (!isRead) return;
        if (afterOpen) afterOpen();
        else BasicDesigner.openPagePicker();
    };

    BasicDesigner.openDialog("Open Folder", function () {
        // RECENT FOLDERS (the selected one is marked)
        const recentFolders = BasicDesigner.recentFolders();
        const selectedPath = BasicDesigner.folder && BasicDesigner.folder.path;
        if (recentFolders.length) {
            BasicDesigner.listTitle("Recent folders", BasicDesigner.TOP_ICONS.folder);
            const recentBox = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, padding: 4, color: C.field, round: 6, border: 1, borderColor: C.line });
            recentBox.css = { alignItems: "stretch", boxSizing: "border-box" };
                recentFolders.forEach(function (folderPath) {
                    // LABEL: A recent folder
                    const row = Label({ text: "", width: "100%", height: 26, fontSize: 12, textColor: (folderPath === selectedPath) ? C.accentLight : C.text, round: 5, color: "transparent" });
                    row.plainText = "▸  " + folderPath + "/" + ((folderPath === selectedPath) ? "   (selected)" : "");
                    row.shrink = 0;
                    row.css = { display: "flex", alignItems: "center", padding: "0px 8px", boxSizing: "border-box", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", position: "relative" };
                    row.clickable = 1;
                    row.cursor = "pointer";
                    row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
                    row.on("click", function () { openRecent(folderPath); });
                });
            endGroup();
            BasicDesigner.listTitle("All folders", BasicDesigner.TOP_ICONS.folder);
        }
        lblPath = Label({ text: "", fontSize: 12, textColor: C.accentLight });
        lblPath.css = { wordBreak: "break-all" };
        // BOX: The folders (it scrolls)
        listBox = VGroup({ width: "100%", height: 280, align: "left top", gap: 0, padding: 4, color: C.field, round: 6, border: 1, borderColor: C.line, scrollY: 1 });
        listBox.css = { alignItems: "stretch", boxSizing: "border-box" };
        endGroup();
        // GROUP: The count and the buttons
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
            lblCount = Label({ text: "", fontSize: 12, textColor: C.dim });
            lblCount.grow = 1;
            BasicDesigner.toolButton("Cancel", BasicDesigner.closeDialog, { color: C.field });
            BasicDesigner.toolButton("Open", openFolder, { color: C.accent, hoverColor: C.accentHover });
        endGroup();
    }, 460);

    showFolder(startPath);
};

// New page…: a new page in the chosen folder, made from NEW_PAGE_TEMPLATE (an empty basic.js page).
// The design is only the look; with the notes, the AI turns it into components and writes its logic.
BasicDesigner.PAGE_NAME_PATTERN = /^[a-z0-9][a-z0-9\-_]*$/i;

BasicDesigner.openNewPageDialog = function () {
    const C = BasicDesigner.colors;
    if (!BasicDesigner.isInVSCode) {
        BasicDesigner.setStatus("New page needs basic designer in VS Code: a browser can not write a file.", "error");
        return;
    }
    if (!BasicDesigner.folder) {
        BasicDesigner.openFolderDialog(BasicDesigner.openNewPageDialog); // WHY: First the folder, then the name.
        return;
    }
    const folderPath = BasicDesigner.folder.path;
    let inpName = null;
    let lblError = null;

    const create = async function () {
        const name = inpName.inputElement.value.trim().replace(/\.html?$/i, "");
        if (!BasicDesigner.PAGE_NAME_PATTERN.test(name)) {
            lblError.plainText = "Letters, digits, - and _ only. Ex: order-page";
            return;
        }
        lblError.plainText = "";
        try {
            const pagePath = await BasicDesigner.createPage(folderPath, name);
            BasicDesigner.closeDialog();
            BasicDesigner.folder.pages.push(pagePath);
            BasicDesigner.folder.pages.sort();
            BasicDesigner.load(pagePath);
        } catch (error) {
            lblError.plainText = error.message;
        }
    };

    BasicDesigner.openDialog("New page", function () {
        const lblFolder = Label({ text: "", fontSize: 12, textColor: C.soft });
        lblFolder.plainText = "In " + folderPath + "/  (Open Folder… chooses another one)";
        inpName = Input({ width: "100%", height: 32, fontSize: 13, textColor: C.text, minimal: 1, placeholder: "File name, Ex: order-page" });
        inpName.inputElement.style.cssText += ";background:" + C.field + ";border:1px solid " + C.line + ";border-radius:6px;padding:0px 10px";
        inpName.inputElement.addEventListener("keydown", function (event) {
            event.stopPropagation(); // WHY: Not a shortcut of the designer.
            if (event.key === "Enter") create();
            if (event.key === "Escape") BasicDesigner.closeDialog();
        });
        const lblHint = Label({ text: "", fontSize: 12, textColor: C.dim });
        lblHint.plainText = "An empty basic.js page (.htm). Design its look here; your notes tell the AI the components and the logic.";
        lblError = Label({ text: "", fontSize: 12, textColor: "#E57B6B" });
        HGroup({ width: "100%", height: "auto", align: "right center", gap: 8, color: "transparent" });
            BasicDesigner.toolButton("Cancel", BasicDesigner.closeDialog, { color: C.field });
            BasicDesigner.toolButton("Create", create, { color: C.accent, hoverColor: C.accentHover });
        endGroup();
    }, 460);

    setTimeout(function () { inpName.inputElement.focus(); }, 0); // WHY: After the dialog is on the page.
};

// *** AI WORK: two prompts that the AI does on the page (the designer can not see a picture or write a component).
// Design from image: a picture is chosen, the AI builds its design on the page with basic.js. Make a component:
// the AI turns the design of the page into a component. In VS Code they are sent like Send to AI (the page loads
// again when the AI changes it); in a browser the prompt is copied (the picture is given to the AI by hand).

BasicDesigner.IMAGE_MAX_BYTES = 15 * 1024 * 1024; // the same limit as the extension

// The prompt to the AI (Send in VS Code, the clipboard in a browser).
BasicDesigner.sendWorkPrompt = function (prompt, browserHint) {
    const s = BasicDesigner.state;
    if (BasicDesigner.isInVSCode) {
        BasicDesigner.sentSessionText = BasicDesigner.sessionText();
        BasicDesigner.postToHost("sendPrompt", { prompt: prompt, page: s.pagePath, files: BasicDesigner.pageFiles() });
        BasicDesigner.setStatus("Choose the AI and the model in VS Code (at the top of the window) …", "wait");
        return;
    }
    BasicDesigner.copyText(prompt).then(function () {
        BasicDesigner.setStatus("The prompt is copied. " + (browserHint || "Give it to the AI that edits the code."));
    }).catch(function () {
        console.log(prompt);
        BasicDesigner.setStatus("Could not copy the prompt: it is in the console.", "error");
    });
};

// The rules of a design made by the AI (also the sizes: a small picture must not give a small design).
BasicDesigner.DESIGN_RULES = [
    "- basic.js only (read context/basic-js-core.md and context/basic-js-code-rules.md): groups (VGroup / HGroup) for the layout, not absolute places; Label, Button, Input, Icon; no HTML markup, no CSS file.",
    "- Only the look, no logic: it is designed further in basic-designer, then turned into a component. The page keeps a start() function and loads the source basic.js; give the objects names that say what they are (Ex: dialog, btnDelete).",
    "- Sizes: real, usable sizes, not the pixels of the picture. A small picture (a phone screenshot, a thumbnail) is scaled up so the controls get the standard sizes: a button or an input 50 px high with a 20 px text, a body text 16-20 px, a title 20-28 px, a touch area at least 44 px. When the sizes of the picture are already like these, follow the picture (its proportions, spaces and rounds).",
    "- Colors and sizes as named constants at the top. An icon as an inline SVG in a Label (stroke=\"currentColor\"), not a picture file, unless it is a photo. A plain button look: minimal: 1 with its own color, border and round.",
    "- The texts of the picture as they are.",
    "- Keep it close to the picture; at the end say what could not be made the same.",
];

BasicDesigner.imageDesignPrompt = function (imagePath, mode, note) {
    const s = BasicDesigner.state;
    const lines = [
        "Build the design in the picture " + imagePath + " (open it and look at it) on the page " + s.pagePath + " with basic.js.",
        (mode === "add") ? "Add it at the end of what start() makes (keep what is there)." : "Replace what start() makes with it (keep the head, the scripts and the file name).",
        "",
        "Rules:",
    ].concat(BasicDesigner.DESIGN_RULES);
    if (note) lines.push("", "Notes: " + note);
    return lines.join("\n");
};

BasicDesigner.componentPrompt = function (name, note) {
    const s = BasicDesigner.state;
    const folder = BasicDesigner.folderOf(s.pagePath);
    const fileName = name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase() + ".js";
    const lines = [];
    const changes = BasicDesigner.buildPrompt();
    if (changes) {
        lines.push("First apply these visual changes of basic-designer, then make the component:", "", changes, "", "---", "");
    }
    lines.push(
        "Turn the design on the page " + s.pagePath + " into a basic.js component named " + name + ".",
        "",
        "- A new file " + (folder ? folder + "/" : "") + fileName + " next to the page, made like _component-template.js (read it, CLAUDE.md \"Writing a component\" and context/basic-js-components.md): " + name + "Defaults, startObject / endObject, the house header, the section markers.",
        "- Params for what a page would change: the texts, the icon, the colors and the sizes that matter (in a style object), the callbacks (Ex: onConfirm / onCancel). A default must not be named like a basic.js setter (text, color, title...).",
        "- setX() functions for the values a page changes after it is made.",
        "- The same look as the page now (measure it, keep the sizes and the colors).",
        "- Then change the page: it loads the new file and shows the component (one or two variants), like a sample page of the repository.",
        "- Say what you made params of and how to use it."
    );
    if (note) lines.push("", "Notes: " + note);
    return lines.join("\n");
};

// A note field of a dialog (one line).
BasicDesigner.dialogNoteField = function (placeholder) {
    const C = BasicDesigner.colors;
    const field = Input({ width: "100%", height: 32, fontSize: 13, textColor: C.text, minimal: 1, placeholder: placeholder });
    field.inputElement.style.cssText += ";background:" + C.field + ";border:1px solid " + C.line + ";border-radius:6px;padding:0px 10px";
    field.inputElement.addEventListener("keydown", function (event) { event.stopPropagation(); });
    return field;
};

// Design from image…: choose a picture, see it, Replace / Add, a note, Send.
BasicDesigner.openImageDesignDialog = function () {
    const C = BasicDesigner.colors;
    const s = BasicDesigner.state;
    if (!s.pagePath) {
        BasicDesigner.setStatus("Open a page first (New page… makes an empty one).");
        return;
    }
    let picture = null; // { name, dataUrl }
    let mode = "replace";
    let preview = null;
    let lblPicture = null;
    let btnReplace = null;
    let btnAdd = null;
    let inpNote = null;

    const paintMode = function () {
        btnReplace.color = (mode === "replace") ? C.accent : C.field;
        btnAdd.color = (mode === "add") ? C.accent : C.field;
    };

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
    fileInput.addEventListener("change", function () {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > BasicDesigner.IMAGE_MAX_BYTES) {
            lblPicture.plainText = "The picture is larger than 15 MB.";
            return;
        }
        const reader = new FileReader();
        reader.onload = function () {
            picture = { name: file.name, dataUrl: String(reader.result) };
            preview.load(picture.dataUrl);
            preview.visible = 1;
            lblPicture.plainText = file.name;
        };
        reader.readAsDataURL(file);
    });

    const send = async function () {
        if (!picture) {
            lblPicture.plainText = "Choose a picture first.";
            return;
        }
        const note = inpNote.inputElement.value.trim();
        if (!BasicDesigner.isInVSCode) {
            BasicDesigner.closeDialog();
            BasicDesigner.sendWorkPrompt(BasicDesigner.imageDesignPrompt(picture.name, mode, note), "Give the picture " + picture.name + " to the AI with it.");
            return;
        }
        try {
            lblPicture.plainText = "Saving the picture …";
            const saved = await BasicDesigner.requestHost("saveImage", { name: picture.name, dataUrl: picture.dataUrl });
            BasicDesigner.closeDialog();
            BasicDesigner.sendWorkPrompt(BasicDesigner.imageDesignPrompt(saved.path, mode, note));
        } catch (error) {
            lblPicture.plainText = error.message;
        }
    };

    BasicDesigner.openDialog("Design from image", function (panel) {
        panel.elem.appendChild(fileInput);
        fileInput.style.display = "none";
        const lblInfo = Label({ text: "", fontSize: 12, textColor: C.soft });
        lblInfo.plainText = "The AI builds the design of a picture (a screenshot) on " + s.pagePath + " with basic.js, in usable sizes (a small picture is scaled up).";
        // GROUP: The picture
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
            BasicDesigner.toolButton("Choose a picture…", function () { fileInput.click(); }, { color: C.field });
            lblPicture = Label({ text: "", fontSize: 12, textColor: C.dim });
            lblPicture.plainText = "PNG, JPEG, WebP or GIF";
        endGroup();
        preview = Icon({ width: "100%", height: 180, imageFit: "contain", color: C.field, round: 6 });
        preview.visible = 0;
        // GROUP: Replace / Add
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 6, color: "transparent" });
            btnReplace = BasicDesigner.toolButton("Replace the page", function () { mode = "replace"; paintMode(); }, { color: C.field });
            btnAdd = BasicDesigner.toolButton("Add at the end", function () { mode = "add"; paintMode(); }, { color: C.field });
        endGroup();
        inpNote = BasicDesigner.dialogNoteField("Note for the AI (optional). Ex: a dark theme");
        HGroup({ width: "100%", height: "auto", align: "right center", gap: 8, color: "transparent" });
            BasicDesigner.toolButton("Cancel", BasicDesigner.closeDialog, { color: C.field });
            BasicDesigner.toolButton((BasicDesigner.isInVSCode) ? "Send to AI" : "Copy prompt", send, { color: C.accent, hoverColor: C.accentHover });
        endGroup();
    }, 480);
    paintMode();
};

// Make a component…: the name (from the page), a note, Send. The changes of the designer go first in the prompt.
BasicDesigner.COMPONENT_NAME_PATTERN = /^[A-Z][A-Za-z0-9]*$/;

BasicDesigner.openComponentDialog = function () {
    const C = BasicDesigner.colors;
    const s = BasicDesigner.state;
    if (!s.pagePath) {
        BasicDesigner.setStatus("Open a page first.");
        return;
    }
    const pageName = s.pagePath.split("/").pop().replace(/\.html?$/i, "");
    const suggested = pageName.split(/[^A-Za-z0-9]+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join("") || "MyComponent";
    let inpName = null;
    let inpNote = null;
    let lblError = null;

    const send = function () {
        const name = inpName.inputElement.value.trim();
        if (!BasicDesigner.COMPONENT_NAME_PATTERN.test(name)) {
            lblError.plainText = "A name in PascalCase. Ex: DeleteDialog";
            return;
        }
        BasicDesigner.closeDialog();
        BasicDesigner.sendWorkPrompt(BasicDesigner.componentPrompt(name, inpNote.inputElement.value.trim()));
    };

    BasicDesigner.openDialog("Make a component", function () {
        const lblInfo = Label({ text: "", fontSize: 12, textColor: C.soft });
        lblInfo.plainText = "The AI turns the design of " + s.pagePath + " into a basic.js component (params, setters, the same look) and makes the page a sample of it." + ((BasicDesigner.changeCount()) ? " Your changes here go first." : "");
        inpName = BasicDesigner.dialogNoteField("Name of the component. Ex: DeleteDialog");
        inpName.inputElement.value = suggested;
        inpName.inputElement.addEventListener("keydown", function (event) { if (event.key === "Enter") send(); });
        inpNote = BasicDesigner.dialogNoteField("Note for the AI (optional). Ex: the icon and the texts are params");
        lblError = Label({ text: "", fontSize: 12, textColor: "#E57B6B" });
        HGroup({ width: "100%", height: "auto", align: "right center", gap: 8, color: "transparent" });
            BasicDesigner.toolButton("Cancel", BasicDesigner.closeDialog, { color: C.field });
            BasicDesigner.toolButton((BasicDesigner.isInVSCode) ? "Send to AI" : "Copy prompt", send, { color: C.accent, hoverColor: C.accentHover });
        endGroup();
    }, 460);
    setTimeout(function () { inpName.inputElement.focus(); inpName.inputElement.select(); }, 0);
};

// The template with the title and the path to the root of the repository, written by the extension. Returns the page path.
BasicDesigner.createPage = async function (folderPath, name) {
    const template = await BasicDesigner.fetchText(new URL(BasicDesigner.NEW_PAGE_TEMPLATE, BasicDesigner.state.rootUrl).href);
    const depth = folderPath.split("/").filter(Boolean).length;
    const content = template.split("{{ROOT}}").join("../".repeat(depth)).split("{{TITLE}}").join(name);
    const result = await BasicDesigner.requestHost("createFile", { folder: folderPath, name: name + ".htm", content: content });
    return result.page;
};

// The items of the menu: { text, keys, onClick, isEnabled } or "-" (a line between the groups).
BasicDesigner.mainMenuItems = function () {
    const s = BasicDesigner.state;
    const hasChanges = BasicDesigner.changeCount() > 0;
    return [
        { text: "Open Folder…", onClick: BasicDesigner.openFolderDialog },
        { text: "New page…", onClick: BasicDesigner.openNewPageDialog },
        "-",
        { text: "Design from image…", onClick: BasicDesigner.openImageDesignDialog },
        { text: "Make a component…", onClick: BasicDesigner.openComponentDialog },
        "-",
        BasicDesigner.isInVSCode && { text: "Send to AI…", isEnabled: hasChanges, onClick: BasicDesigner.sendPrompt },
        { text: "Copy prompt", isEnabled: hasChanges, onClick: function () { BasicDesigner.copyPrompt(BasicDesigner.ui.btnTopCopy); } },
        { text: "Revert all", isEnabled: hasChanges, onClick: BasicDesigner.revertAll },
        "-",
        { text: "Keyboard shortcuts", onClick: BasicDesigner.openShortcutsDialog },
        { text: "Settings…", onClick: BasicDesigner.openSettingsDialog },
    ].filter(Boolean); // WHY: The items that are only in VS Code are false in a browser.
};

BasicDesigner.toggleMainMenu = function (btn) {
    if (BasicDesigner.ui.popupMenu) {
        BasicDesigner.closePopupMenu();
        return;
    }
    BasicDesigner.openPopupMenu(btn, BasicDesigner.mainMenuItems());
    btn.setActive(true);
    BasicDesigner.ui.popupMenuButton = btn;
    if (btn.elem.matches(":focus-visible")) BasicDesigner.focusPopupRow(0);
};

BasicDesigner.closePopupMenu = function () {
    const ui = BasicDesigner.ui;
    if (ui.popupMenuButton) ui.popupMenuButton.setActive(false);
    ui.popupMenuButton = null;
    if (!ui.popupMenu) return;
    ui.popupMenu.remove();
    ui.popupMenu = null;
};

BasicDesigner.focusPopupRow = function (index) {
    const menu = BasicDesigner.ui.popupMenu;
    const rows = (menu) ? Array.from(menu.elem.querySelectorAll("[role=menuitem]:not([aria-disabled=true])")) : [];
    if (!rows.length) return;
    rows[(index + rows.length) % rows.length].focus();
};

// A list under a button. Up / Down between the rows, Enter / Space chooses, Escape closes.
BasicDesigner.openPopupMenu = function (anchor, items) {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    BasicDesigner.closePopupMenu();
    const rect = anchor.elem.getBoundingClientRect();

    createIn(page, function () {
        // GROUP: Menu
        ui.popupMenu = VGroup({ width: 230, height: "auto", align: "left top", gap: 0, padding: 4, color: C.menu, round: 8, border: 1, borderColor: C.line });
        ui.popupMenu.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.5)";
        ui.popupMenu.zIndex = 9000;
        ui.popupMenu.role = "menu";
        ui.popupMenu.css = { alignItems: "stretch" };

            items.forEach(function (item) {
                if (item === "-") {
                    const line = Box({ width: "100%", height: 1, color: C.line });
                    line.shrink = 0;
                    line.css = { margin: "4px 0px" };
                    return;
                }
                BasicDesigner.createPopupRow(item);
            });

        endGroup();
    });

    ui.popupMenu.left = Math.round(rect.left);
    ui.popupMenu.top = Math.round(rect.bottom + 4);
    ui.popupMenu.elem.addEventListener("keydown", function (event) {
        const rows = Array.from(ui.popupMenu.elem.querySelectorAll("[role=menuitem]:not([aria-disabled=true])"));
        const index = rows.indexOf(document.activeElement);
        event.stopPropagation(); // WHY: Not a shortcut of the designer.
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            BasicDesigner.focusPopupRow(index + ((event.key === "ArrowDown") ? 1 : -1));
        } else if ((event.key === "Enter" || event.key === " ") && index !== -1) {
            event.preventDefault();
            rows[index].click();
        } else if (event.key === "Escape") {
            const button = ui.popupMenuButton;
            BasicDesigner.closePopupMenu();
            if (button) button.elem.focus();
        }
    });

};

// One row of a menu: the text at the left, the keys at the right, pale when it can not be chosen.
BasicDesigner.createPopupRow = function (item) {
    const C = BasicDesigner.colors;
    const isEnabled = (item.isEnabled !== false);
    const keys = (item.keys) ? '<span style="margin-left:auto;padding-left:16px;color:' + C.dim + '">' + BasicDesigner.esc(item.keys) + "</span>" : "";
    // LABEL: A row
    const row = Label({ text: "<span>" + BasicDesigner.esc(item.text) + "</span>" + keys, width: "100%", height: 28, fontSize: 12, textColor: C.text, round: 5, color: "transparent" });
    row.shrink = 0;
    row.css = { display: "flex", alignItems: "center", padding: "0px 10px", boxSizing: "border-box", whiteSpace: "nowrap", position: "relative", outline: "none" };
    row.role = "menuitem";
    row.tabIndex = -1;
    row.aria = { disabled: !isEnabled };
    row.opacity = (isEnabled) ? 1 : 0.4;
    row.clickable = (isEnabled) ? 1 : 0;
    row.cursor = (isEnabled) ? "pointer" : "default";
    row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
    row.elem.addEventListener("focus", function () { row.color = C.hover; });
    row.elem.addEventListener("blur", function () { row.color = "transparent"; });
    row.on("click", function () {
        BasicDesigner.closePopupMenu();
        item.onClick();
    });
};

// DIALOG: a panel in the middle over a dark cover. Escape or a click on the cover closes it.
BasicDesigner.openDialog = function (title, buildBody, width = 440) {

    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    BasicDesigner.closeDialog();

    createIn(page, function () {
        // BOX: Cover
        ui.dialog = startBox(0, 0, "100%", "100%", { color: "rgba(0, 0, 0, 0.45)" });
        ui.dialog.zIndex = 9600;
        ui.dialog.clickable = 1;

            // GROUP: Panel
            const panel = VGroup({ width: width, height: "auto", align: "left top", gap: 10, padding: 18, color: C.raised, round: 12, border: 1, borderColor: C.line });
            panel.css = { left: "50%", top: "50%", transform: "translate(-50%, -50%)", alignItems: "stretch", maxHeight: "80%", overflowY: "auto" };
            panel.boxShadow = "0 20px 60px rgba(0, 0, 0, 0.6)";
            panel.clickable = 1;
            panel.role = "dialog";
            panel.aria = { label: title, modal: true };

                // GROUP: Title row
                HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
                    const lbl = Label({ text: "", fontSize: 15, textColor: C.text, fontFamily: "opensans-bold" });
                    lbl.plainText = title;
                    lbl.grow = 1;
                    BasicDesigner.iconButton({ path: "M4 4l8 8M12 4l-8 8", name: "Close (Escape)", size: 26, iconSize: 14, onClick: BasicDesigner.closeDialog });
                endGroup();

                buildBody(panel);

            endGroup();

        endBox();
    });

    ui.dialog.on("click", function (self, event) {
        if (event.target === ui.dialog.elem) BasicDesigner.closeDialog();
    });

};

BasicDesigner.closeDialog = function () {
    const ui = BasicDesigner.ui;
    if (!ui.dialog) return;
    BasicDesigner.hideTip();
    ui.dialog.remove();
    ui.dialog = null;
};

BasicDesigner.SHORTCUTS = [
    ["V", "Select mode"],
    ["I", "Interact mode (use the page)"],
    ["M", "Manual mode: a drag puts an object where the mouse leaves it; a new object goes to 0, 0 of its box"],
    ["Cmd/Ctrl+Z", "Undo"],
    ["Shift+Cmd/Ctrl+Z", "Redo"],
    ["Cmd/Ctrl+O", "Open a page"],
    ["Delete / Backspace", "Delete the selected object"],
    ["Cmd/Ctrl+D", "Copy the selected object"],
    ["] / [", "Bring the selected object to front / send it to back (in its box)"],
    ["Arrow keys", "Move a manual object 1 px / change the order in a group"],
    ["Shift+Arrow keys", "Move a manual object 10 px"],
    ["Alt (hold)", "Distances to the object under the mouse"],
    ["Double click", "Edit the text in its place"],
    ["Double click in the layers", "Rename the object"],
    ["Alt+Down in a parameter", "Open its editor (color, table...)"],
    ["Alt+double click, Enter", "Open the code in VS Code"],
    ["Escape", "Close a menu / clear the selection"],
    ["Cmd/Ctrl+Enter", "Save the note"],
];

BasicDesigner.openShortcutsDialog = function () {
    const C = BasicDesigner.colors;
    BasicDesigner.openDialog("Keyboard shortcuts", function () {
        BasicDesigner.SHORTCUTS.forEach(function (pair) {
            // GROUP: A shortcut (the keys, what it does)
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 12, color: "transparent" });
                const keys = Label({ text: "", width: 150, fontSize: 12, textColor: C.accentLight, fontFamily: "monospace" });
                keys.plainText = pair[0];
                keys.shrink = 0;
                const text = Label({ text: "", fontSize: 12, textColor: C.soft });
                text.plainText = pair[1];
                text.css = { whiteSpace: "normal" };
            endGroup();
        });
    });
};

// A row of the settings: the name at the left, the field at the right.
BasicDesigner.settingRow = function (name, buildField) {
    const C = BasicDesigner.colors;
    // GROUP: A setting
    HGroup({ width: "100%", height: "auto", align: "left center", gap: 12, color: "transparent" });
        const lbl = Label({ text: "", width: 140, fontSize: 12, textColor: C.soft });
        lbl.plainText = name;
        lbl.shrink = 0;
        buildField();
    endGroup();
};

BasicDesigner.settingInput = function (value, width, onSave) {
    const C = BasicDesigner.colors;
    const input = Input({ width: width, height: 28, fontSize: 12, color: C.field, textColor: C.text, border: 1, borderColor: C.fieldBorder, round: 5 });
    input.inputElement.style.padding = "0px 8px";
    input.inputElement.value = String(value);
    input.inputElement.addEventListener("keydown", function (event) { event.stopPropagation(); });
    input.inputElement.addEventListener("change", function () { onSave(input.inputElement.value); });
    return input;
};

BasicDesigner.SETTINGS_TABS = [
    { key: "general", text: "General" },
    { key: "appearance", text: "Appearance" },
    { key: "colors", text: "Colors" },
    { key: "code", text: "Code" },
];
BasicDesigner.SETTINGS_PAGE_HEIGHT = 330;
BasicDesigner.settingsTab = "general";

// tabKey: the tab to open (the last one when it is not given).
BasicDesigner.openSettingsDialog = function (tabKey) {
    const C = BasicDesigner.colors;
    if (typeof tabKey === "string") BasicDesigner.settingsTab = tabKey;
    BasicDesigner.openDialog("Settings", function () {

        // TABS: The kinds of settings (comp/tabs.js)
        const tabs = Tabs({
            styleName: "dark",
            width: "100%",
            tabs: BasicDesigner.SETTINGS_TABS,
            value: BasicDesigner.settingsTab,
            panels: 1,
            panelHeight: BasicDesigner.SETTINGS_PAGE_HEIGHT,
            style: {
                bar: { dividerColor: C.line },
                tab: { fontSize: 12, padding: [10, 8], minHeight: 34 },
                tabActive: { textColor: C.text },
                indicator: { color: C.accent },
                panel: { padding: [0, 0] },
            },
            onChange: function (self) { BasicDesigner.settingsTab = self.value; },
        });

        BasicDesigner.settingsPage(tabs, "general", BasicDesigner.buildGeneralSettings);
        BasicDesigner.settingsPage(tabs, "appearance", BasicDesigner.buildAppearanceSettings);
        BasicDesigner.settingsPage(tabs, "colors", BasicDesigner.buildColorGroupSettings);
        BasicDesigner.settingsPage(tabs, "code", BasicDesigner.buildCodeSettings);

        const note = Label({ text: "", fontSize: 11, textColor: C.dim });
        note.plainText = "The settings are kept in this browser (basic.storage).";

    }, 540);
};

// A page of the settings. (A panel of Tabs scrolls by itself when its content is longer.)
BasicDesigner.settingsPage = function (tabs, key, buildPage) {
    tabs.startPanel(key);
        // GROUP: The settings of the page
        const list = VGroup({ width: "100%", height: "auto", align: "left top", gap: 12, padding: [0, 16], color: "transparent" });
        list.css = { alignItems: "stretch" };
            buildPage();
        endGroup();
    tabs.endPanel();
};

BasicDesigner.settingHelp = function (text) {
    const C = BasicDesigner.colors;
    const lbl = Label({ text: "", fontSize: 11, textColor: C.dim });
    lbl.plainText = text;
    lbl.css = { whiteSpace: "normal", lineHeight: "16px" };
    return lbl;
};

BasicDesigner.buildGeneralSettings = function () {
    const settings = BasicDesigner.settings;
    const C = BasicDesigner.colors;

    BasicDesigner.settingRow("Snap to edges", function () {
        const btn = BasicDesigner.toolButton((settings.snap) ? "On" : "Off", function () {
            settings.snap = !settings.snap;
            btn.text = (settings.snap) ? "On" : "Off";
            btn.setActive(settings.snap);
            BasicDesigner.saveSettings();
        }, { color: C.field, width: 64 });
        btn.setActive(settings.snap);
    });

    BasicDesigner.settingRow("Edges of empty boxes", function () {
        const isOn = function () { return settings.emptyBoxEdges !== false; };
        const btn = BasicDesigner.toolButton((isOn()) ? "On" : "Off", function () {
            settings.emptyBoxEdges = !isOn();
            btn.text = (isOn()) ? "On" : "Off";
            btn.setActive(isOn());
            BasicDesigner.saveSettings();
            BasicDesigner.markEmptyBoxes();
        }, { color: C.field, width: 64 });
        btn.setActive(isOn());
    });

    BasicDesigner.settingRow("Snap distance (px)", function () {
        BasicDesigner.settingInput(settings.snapDistance, 64, function (text) {
            const value = parseInt(text, 10);
            settings.snapDistance = (value >= 0) ? value : 5;
            BasicDesigner.saveSettings();
        });
    });

    BasicDesigner.settingRow("Recent pages", function () {
        const btn = BasicDesigner.toolButton("Clear the list", function () {
            basic.storage.remove(BasicDesigner.RECENT_KEY);
            btn.text = "Cleared ✓";
        }, { color: C.field });
    });
};

BasicDesigner.buildCodeSettings = function () {
    const settings = BasicDesigner.settings;
    BasicDesigner.settingRow("Repository on disk", function () {
        const input = BasicDesigner.settingInput(settings.rootPath, 230, function (text) {
            settings.rootPath = String(text).trim().replace(/\/?$/, "/"); // WHY: The page paths are added after it.
            BasicDesigner.saveSettings();
        });
        input.grow = 1;
    });
    BasicDesigner.settingHelp("The folder of this repository on your disk. Alt+double click (or Enter) opens the code of an object in VS Code with it.");
};

BasicDesigner.buildColorGroupSettings = function () {
    BasicDesigner.settingHelp("Your colors, by name. In the color picker of a color, choose a group to use its colors; + adds the current color to it.");
    // GROUP: The groups (drawn again after every change)
    const groupList = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10, color: "transparent" });
    groupList.css = { alignItems: "stretch" };
    endGroup();
    BasicDesigner.drawColorGroups(groupList);

    const title = Label({ text: "", fontSize: 12, bold: 1, textColor: BasicDesigner.colors.text });
    title.plainText = "Default palettes";
    title.css.marginTop = "8px";
    BasicDesigner.settingHelp("Always in the color picker, after your groups. Hide the ones you do not use, move the ones you use the most up. + in ★ Favorites adds your own colors to it.");
    // GROUP: The default palettes (drawn again after every change)
    const paletteList = VGroup({ width: "100%", height: "auto", align: "left top", gap: 6, color: "transparent" });
    paletteList.css = { alignItems: "stretch" };
    endGroup();
    BasicDesigner.drawDefaultPalettes(paletteList);
};

// *** DEFAULT PALETTES (in the settings): show / hide, order, your favorites.

BasicDesigner.PALETTE_PREVIEW_COUNT = 8; // the first colors shown in the row of a palette
BasicDesigner.PALETTE_DOT_SIZE = 12;

BasicDesigner.drawDefaultPalettes = function (paletteList) {
    (paletteList.parts || []).forEach(function (part) { part.remove(); });
    paletteList.parts = createIn(paletteList, function () {
        const palettes = BasicDesigner.orderedDefaultPalettes();
        const parts = palettes.map(function (palette, index) {
            return BasicDesigner.buildDefaultPaletteRow(palette, index, palettes.length, paletteList);
        });
        parts.push(BasicDesigner.buildPaletteResetRow(paletteList));
        return parts;
    });
};

BasicDesigner.changeDefaultPalettes = function (paletteList, change) {
    change(BasicDesigner.settings);
    BasicDesigner.saveSettings();
    BasicDesigner.drawDefaultPalettes(paletteList);
};

// Moves a palette one place up (-1) or down (+1); the whole order is kept from then on.
BasicDesigner.moveDefaultPalette = function (key, step, paletteList) {
    BasicDesigner.changeDefaultPalettes(paletteList, function (settings) {
        const keys = BasicDesigner.orderedDefaultPalettes().map(function (palette) { return palette.key; });
        const from = keys.indexOf(key);
        const to = from + step;
        if (to < 0 || to >= keys.length) return;
        keys.splice(from, 1);
        keys.splice(to, 0, key);
        settings.paletteOrder = keys;
    });
};

BasicDesigner.toggleDefaultPalette = function (key, paletteList) {
    BasicDesigner.changeDefaultPalettes(paletteList, function (settings) {
        const hidden = settings.hiddenPalettes;
        const place = hidden.indexOf(key);
        if (place === -1) hidden.push(key);
        else hidden.splice(place, 1);
    });
};

// GROUP: A default palette: its first colors, its name, ↑ ↓ and Show / Hide. Favorites: your colors under it.
BasicDesigner.buildDefaultPaletteRow = function (palette, index, count, paletteList) {
    const C = BasicDesigner.colors;
    const isHidden = BasicDesigner.isPaletteHidden(palette.key);
    const block = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: [10, 6], color: C.bar, round: 8 });
    block.opacity = (isHidden) ? 0.55 : 1;

        // GROUP: The colors, the name and the buttons
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
            BasicDesigner.buildPaletteDots(palette);
            const lblName = Label({ text: "", fontSize: 12, textColor: C.text });
            lblName.plainText = palette.name;
            lblName.grow = 1;
            lblName.ellipsis = 1;
            const lblCount = Label({ text: "", fontSize: 11, textColor: C.dim });
            lblCount.plainText = String(BasicDesigner.defaultPaletteColors(palette).length);
            lblCount.shrink = 0;
            const btnUp = BasicDesigner.toolButton("↑", function () { BasicDesigner.moveDefaultPalette(palette.key, -1, paletteList); }, { color: C.field });
            btnUp.aria = { label: "Move " + palette.name + " up" };
            btnUp.opacity = (index === 0) ? 0.3 : 1;
            const btnDown = BasicDesigner.toolButton("↓", function () { BasicDesigner.moveDefaultPalette(palette.key, 1, paletteList); }, { color: C.field });
            btnDown.aria = { label: "Move " + palette.name + " down" };
            btnDown.opacity = (index === count - 1) ? 0.3 : 1;
            BasicDesigner.toolButton((isHidden) ? "Show" : "Hide", function () { BasicDesigner.toggleDefaultPalette(palette.key, paletteList); }, { color: C.field, width: 52 });
        endGroup();

        if (palette.key === BasicDesigner.FAVORITES_KEY) BasicDesigner.buildFavoriteColors(paletteList);

    endGroup();
    return block;
};

// GROUP: The first colors of a palette, as small dots.
BasicDesigner.buildPaletteDots = function (palette) {
    const size = BasicDesigner.PALETTE_DOT_SIZE;
    const dots = HGroup({ hug: 1, align: "left center", gap: 3, color: "transparent" });
    dots.shrink = 0;
        BasicDesigner.defaultPaletteColors(palette).slice(0, BasicDesigner.PALETTE_PREVIEW_COUNT).forEach(function (preset) {
            const dot = Box({ width: size, height: size, round: size / 2, color: preset.color });
            dot.shrink = 0;
            dot.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.2)";
        });
    endGroup();
    return dots;
};

// GROUP: The colors you added to Favorites (a click removes one).
BasicDesigner.buildFavoriteColors = function (paletteList) {
    const C = BasicDesigner.colors;
    const favorites = BasicDesigner.settings.favoriteColors;
    if (!favorites.length) {
        const lblEmpty = Label({ text: "", fontSize: 11, textColor: C.dim });
        lblEmpty.plainText = "Your colors: none yet. Pick a color, choose ★ Favorites in the picker and press +.";
        return;
    }
    HGroup({ width: "100%", height: "auto", align: "left top", gap: 6, wrap: 1, color: "transparent" });
        favorites.forEach(function (color) {
            BasicDesigner.buildGroupSwatch(color, function () {
                BasicDesigner.changeDefaultPalettes(paletteList, function (settings) {
                    settings.favoriteColors.splice(settings.favoriteColors.indexOf(color), 1);
                });
            });
        });
    endGroup();
};

// GROUP: Back to the order of the file, every palette shown.
BasicDesigner.buildPaletteResetRow = function (paletteList) {
    const C = BasicDesigner.colors;
    const row = HGroup({ width: "100%", height: "auto", align: "right center", gap: 8, color: "transparent" });
        BasicDesigner.toolButton("Reset order and show all", function () {
            BasicDesigner.changeDefaultPalettes(paletteList, function (settings) {
                settings.paletteOrder = [];
                settings.hiddenPalettes = [];
                settings.removedFavorites = [];
            });
        }, { color: C.field });
    endGroup();
    return row;
};

// *** APPEARANCE: the theme of the designer.

BasicDesigner.buildAppearanceSettings = function () {
    const settings = BasicDesigner.settings;
    const C = BasicDesigner.colors;

    BasicDesigner.settingRow("Selection color", function () {
        // GROUP: The accents
        const accents = HGroup({ width: 10, height: "auto", align: "left center", gap: 6, wrap: 1, color: "transparent" });
        accents.grow = 1;
            Object.keys(BasicDesigner.ACCENTS).forEach(function (key) {
                const accent = BasicDesigner.ACCENTS[key];
                BasicDesigner.themeOption(accent.name, key === settings.accent, function () {
                    const dot = Box({ width: 14, height: 14, round: 7, color: accent.colors.accent });
                    dot.shrink = 0;
                }, function () { BasicDesigner.changeTheme("accent", key); });
            });
        endGroup();
    });

    BasicDesigner.settingRow("Background", function () {
        // GROUP: The backgrounds
        const backgrounds = HGroup({ width: 10, height: "auto", align: "left center", gap: 6, wrap: 1, color: "transparent" });
        backgrounds.grow = 1;
            Object.keys(BasicDesigner.BACKGROUNDS).forEach(function (key) {
                const background = BasicDesigner.BACKGROUNDS[key];
                BasicDesigner.themeOption(background.name, key === settings.background, function () {
                    // BOX: The panel and the canvas colors, side by side
                    const sample = Box({ width: 22, height: 14, round: 3, color: "transparent" });
                    sample.shrink = 0;
                    sample.css = { background: "linear-gradient(to right, " + background.colors.bar + " 50%, " + background.colors.canvas + " 50%)" };
                    sample.boxShadow = "inset 0 0 0 1px " + C.fieldBorderStrong;
                }, function () { BasicDesigner.changeTheme("background", key); });
            });
        endGroup();
    });

    BasicDesigner.settingHelp("A new theme loads the designer again. The unsaved changes of the page come back by themselves.");
};

// GROUP: A choice of the theme (a radio button): its sample (buildSample) and its name.
BasicDesigner.themeOption = function (name, isSelected, buildSample, onPick) {
    const C = BasicDesigner.colors;
    const option = HGroup({ hug: 1, align: "left center", gap: 8, padding: [10, 6], color: C.field, round: 6 });
    option.boxShadow = (isSelected) ? "inset 0 0 0 2px " + C.accent : "inset 0 0 0 1px " + C.fieldBorder;
    option.clickable = 1;
    option.cursor = (isSelected) ? "default" : "pointer";
    option.role = "radio";
    option.tabIndex = 0;
    option.aria = { checked: (isSelected) ? "true" : "false", label: name };
        buildSample();
        const lbl = Label({ text: "", fontSize: 12, textColor: (isSelected) ? C.text : C.soft });
        lbl.plainText = name;
    endGroup();
    if (isSelected) return option;
    option.on("mouseenter", function () { option.color = C.fieldHover; });
    option.on("mouseleave", function () { option.color = C.field; });
    option.on("click", onPick);
    option.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onPick();
    });
    return option;
};

BasicDesigner.THEME_RELOAD_KEY = "basic-designer-theme-reload";

// WHY: Every object takes its colors when it is made: the designer loads again. The session (the unsaved changes)
//      is saved first; after the load it is applied without asking, and the settings open where they were.
BasicDesigner.changeTheme = function (settingKey, value) {
    BasicDesigner.settings[settingKey] = value;
    BasicDesigner.saveSettings();
    BasicDesigner.saveSession();
    try {
        sessionStorage.setItem(BasicDesigner.THEME_RELOAD_KEY, BasicDesigner.state.pagePath);
    } catch (error) { } // The session bar asks then, as on any load.
    location.reload();
};

// 1 once after a theme change of this page (the flag is removed).
BasicDesigner.takeThemeReload = function () {
    try {
        const pagePath = sessionStorage.getItem(BasicDesigner.THEME_RELOAD_KEY);
        sessionStorage.removeItem(BasicDesigner.THEME_RELOAD_KEY);
        return (pagePath !== null && pagePath === BasicDesigner.state.pagePath) ? 1 : 0;
    } catch (error) {
        return 0;
    }
};

// *** COLOR GROUPS (in the settings):

BasicDesigner.CHECKER = "repeating-conic-gradient(#BBBBBB 0% 25%, #FFFFFF 0% 50%) 0 0 / 6px 6px";
BasicDesigner.GROUP_SWATCH_SIZE = 22;

BasicDesigner.drawColorGroups = function (groupList) {
    (groupList.parts || []).forEach(function (part) { part.remove(); });
    groupList.parts = createIn(groupList, function () {
        const parts = BasicDesigner.settings.colorGroups.map(function (group) {
            return BasicDesigner.buildColorGroup(group, groupList);
        });
        parts.push(BasicDesigner.buildNewColorGroupRow(groupList));
        return parts;
    });
};

BasicDesigner.changeColorGroups = function (groupList, change) {
    change(BasicDesigner.settings.colorGroups);
    BasicDesigner.saveSettings();
    BasicDesigner.drawColorGroups(groupList);
};

BasicDesigner.isColorGroupName = function (name, exceptGroup) {
    return BasicDesigner.settings.colorGroups.some(function (g) { return g !== exceptGroup && g.name === name; });
};

BasicDesigner.buildColorGroup = function (group, groupList) {
    const C = BasicDesigner.colors;
    // GROUP: A color group
    const block = VGroup({ width: "100%", height: "auto", align: "left top", gap: 8, padding: 10, color: C.bar, round: 8 });

        // GROUP: The name, the count and Delete
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
            const input = BasicDesigner.settingInput(group.name, 160, function (text) {
                const name = String(text).trim();
                const isFree = name && !BasicDesigner.isColorGroupName(name, group);
                BasicDesigner.changeColorGroups(groupList, function () {
                    if (isFree) group.name = name;
                });
            });
            input.grow = 1;
            input.inputElement.setAttribute("aria-label", "Name of the color group");
            const lblCount = Label({ text: "", fontSize: 11, textColor: C.dim });
            lblCount.plainText = (group.colors.length === 1) ? "1 color" : group.colors.length + " colors";
            lblCount.shrink = 0;
            BasicDesigner.toolButton("Delete", function () {
                BasicDesigner.changeColorGroups(groupList, function (groups) {
                    groups.splice(groups.indexOf(group), 1);
                });
            }, { color: C.field });
        endGroup();

        if (!group.colors.length) {
            const lblEmpty = Label({ text: "", fontSize: 11, textColor: C.dim });
            lblEmpty.plainText = "No colors yet. Add them with + in the color picker.";
        } else {
            // GROUP: The colors (a click removes one)
            HGroup({ width: "100%", height: "auto", align: "left top", gap: 6, wrap: 1, color: "transparent" });
                group.colors.forEach(function (color) {
                    BasicDesigner.buildGroupSwatch(color, function () {
                        BasicDesigner.changeColorGroups(groupList, function () {
                            group.colors.splice(group.colors.indexOf(color), 1);
                        });
                    });
                });
            endGroup();
        }

    endGroup();
    return block;
};

// BOX: A color of a group. The mouse over it shows ×: a click removes it.
BasicDesigner.buildGroupSwatch = function (color, onRemove) {
    const size = BasicDesigner.GROUP_SWATCH_SIZE;
    const swatch = startBox({ width: size, height: size, round: 5, color: "transparent" });
    swatch.shrink = 0;
    swatch.css = { position: "relative", left: "0px", top: "0px", background: "linear-gradient(" + color + ", " + color + "), " + BasicDesigner.CHECKER };
    swatch.boxShadow = "inset 0 0 0 1px rgba(255, 255, 255, 0.25)";
    swatch.clickable = 1;
    swatch.cursor = "pointer";
    swatch.role = "button";
    swatch.tabIndex = 0;
    swatch.aria = { label: "Remove " + color };
    swatch.elem.title = "Remove " + color;
        const lblRemove = Label(0, 0, size, size, { text: "×", fontSize: 15, textColor: "#FFFFFF", color: "rgba(0, 0, 0, 0.55)" });
        lblRemove.css = { display: "flex", alignItems: "center", justifyContent: "center" };
        lblRemove.clickable = 0;
        lblRemove.visible = 0;
    endBox();
    swatch.on("mouseenter", function () { lblRemove.visible = 1; });
    swatch.on("mouseleave", function () { lblRemove.visible = 0; });
    swatch.on("click", onRemove);
    swatch.on("keydown", function (self, event) {
        if (event.key !== "Enter" && event.key !== " " && event.key !== "Delete" && event.key !== "Backspace") return;
        event.preventDefault();
        event.stopPropagation();
        onRemove();
    });
    return swatch;
};

// GROUP: A name and "Add group"
BasicDesigner.buildNewColorGroupRow = function (groupList) {
    const C = BasicDesigner.colors;
    const row = HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, color: "transparent" });
        const input = BasicDesigner.settingInput("", 160, function () { });
        input.grow = 1;
        input.inputElement.placeholder = "New group name (Ex: Brand)";
        input.inputElement.setAttribute("aria-label", "Name of a new color group");
        const addGroup = function () {
            const name = String(input.inputElement.value).trim();
            if (!name || BasicDesigner.isColorGroupName(name)) {
                input.inputElement.focus();
                return;
            }
            BasicDesigner.changeColorGroups(groupList, function (groups) {
                groups.push({ id: String(Date.now()), name: name, colors: [] });
            });
        };
        input.inputElement.addEventListener("keydown", function (event) {
            if (event.key === "Enter") addGroup();
        });
        BasicDesigner.toolButton("Add group", addGroup, { color: C.field });
    endGroup();
    return row;
};

// *** STATUS: the bar under the canvas. It shows where the selected object is made (a click on a place opens
// it in VS Code), or the hint of the page. A message (setStatus) stays a little, then the selection comes back.

BasicDesigner.STATUS_TIME = 4000;
BasicDesigner.STATUS_MIN_TIME = 1500; // A new selection waits this long before it takes the place of a message
BasicDesigner.statusShownAt = 0; // When the message on the bar was shown (0: the bar shows the selection)
BasicDesigner.ERROR_STATUS_TIME = 9000;
BasicDesigner.ERROR_COLOR = "#EF6B6A";

// kind: "info" (default), "error" (red, stays longer), "wait" (stays until the next status: Ex: loading).
BasicDesigner.setStatus = function (text, kind = "info") {
    const ui = BasicDesigner.ui;
    if (!ui.lblStatus) return;
    const isError = (kind === "error");
    clearTimeout(BasicDesigner.statusTimer);
    ui.lblStatus.textColor = (isError) ? BasicDesigner.ERROR_COLOR : BasicDesigner.colors.soft;
    ui.lblStatus.text = ((isError) ? "⚠ " : "") + BasicDesigner.esc(text);
    ui.lblStatus.elem.title = text;
    BasicDesigner.statusShownAt = Date.now();
    if (kind === "wait") return;
    const time = (isError) ? BasicDesigner.ERROR_STATUS_TIME : BasicDesigner.STATUS_TIME;
    BasicDesigner.statusTimer = setTimeout(BasicDesigner.showSelectionInfo, time);
};

// The selection, now or after the message on the bar was seen a little (STATUS_MIN_TIME).
BasicDesigner.showSelectionInfoSoon = function () {
    const shownFor = Date.now() - BasicDesigner.statusShownAt;
    if (!BasicDesigner.statusShownAt || shownFor >= BasicDesigner.STATUS_MIN_TIME) {
        BasicDesigner.showSelectionInfo();
        return;
    }
    clearTimeout(BasicDesigner.statusTimer);
    BasicDesigner.statusTimer = setTimeout(BasicDesigner.showSelectionInfo, BasicDesigner.STATUS_MIN_TIME - shownFor);
};

// A place in the code as a link (a click opens it in VS Code).
BasicDesigner.statusLink = function (frame) {
    const index = BasicDesigner.statusFrames.push(frame) - 1;
    return '<span data-frame="' + index + '" style="color:' + BasicDesigner.colors.text + ';cursor:pointer;pointer-events:auto;text-decoration:underline dotted;text-underline-offset:3px">' + BasicDesigner.esc(BasicDesigner.where(frame)) + "</span>";
};

BasicDesigner.statusFrames = [];

BasicDesigner.showSelectionInfo = function () {
    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    const obj = s.selected;
    if (!ui.lblStatus) return;
    if (!s.rt) return; // WHY: The page did not load: its error stays.
    clearTimeout(BasicDesigner.statusTimer);
    BasicDesigner.statusShownAt = 0;
    BasicDesigner.statusFrames = [];
    ui.lblStatus.textColor = BasicDesigner.colors.soft;
    if (!obj) {
        const hint = s.rt.getAlive().length + " objects in " + s.pagePath + ". Click an object (Select mode) or use the layers.";
        ui.lblStatus.plainText = hint;
        ui.lblStatus.elem.title = hint;
        return;
    }
    const parts = BasicDesigner.selectionInfoParts(obj);
    ui.lblStatus.text = parts.html;
    ui.lblStatus.elem.title = parts.text + "\n(Click a place to open it in VS Code.)";
};

// The status of an object: { html (with links), text (plain, for the tooltip) }
BasicDesigner.selectionInfoParts = function (obj) {
    const f = obj.__bd.frames;
    const type = BasicDesigner.typeOf(obj);
    const html = [];
    const text = [];
    const add = function (plain, markup) {
        text.push(plain);
        html.push((markup === undefined) ? BasicDesigner.esc(plain) : markup);
    };
    const addPlace = function (frame) {
        add(BasicDesigner.where(frame), (frame) ? BasicDesigner.statusLink(frame) : "?");
    };

    add(type, '<b style="color:' + BasicDesigner.colors.text + ';font-weight:normal">' + BasicDesigner.esc(type) + "</b>");
    if (obj.__bd.added) {
        add(" · added in the designer (not in the code yet)");
    } else if (obj.__bd.component && f.length > 1) {
        add(" (component) · used at ");
        addPlace(BasicDesigner.nameFrame(obj));
        add("  · its root box: ");
        addPlace(f[0]);
    } else {
        add(" · created at ");
        addPlace(f[0]);
        BasicDesigner.chainFrames(obj, 3).forEach(function (frame) {
            add("  ←  ");
            addPlace(frame);
        });
    }
    const same = BasicDesigner.sameLineCount(obj);
    if (same > 1) add("   (" + same + " objects from this line)");
    return { html: html.join(""), text: text.join("") };
};

// *** MODE / DEVICE / KEYS:

BasicDesigner.setMode = function (mode) {
    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    s.mode = mode;
    ui.btnSelect.setActive(mode === "select");
    ui.btnInteract.setActive(mode === "interact");
    ui.cover.visible = (mode === "select") ? 1 : 0;
    if (mode === "select") {
        // WHY: Objects created or removed while playing with the page.
        if (BasicDesigner.state.rt) BasicDesigner.refreshLayers();
    } else {
        BasicDesigner.setHover(null);
        // WHY (G-006): the frame and the name of the selected object stayed over the page while playing with it
        if (s.selected || s.isPageSelected) BasicDesigner.select(null, "mode");
    }
};

// key: a device of the config, or "custom" with a width (the field next to the device buttons).
BasicDesigner.setDevice = function (key, customWidth) {
    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    s.device = key;
    const preset = BasicDesigner.config.devices.find(function (d) { return d.key === key; });
    const device = preset || { key: "custom", width: customWidth };
    ui.deviceButtons.forEach(function (b) { b.setActive(b._key === key); });
    if (ui.inpWidth) ui.inpWidth.inputElement.value = (device.width) ? String(device.width) : "";
    BasicDesigner.startOverlayLoop();
    setTimeout(BasicDesigner.refreshCanvasSize, 0); // WHY: After the new width is laid out.
    if (!device.width) {
        ui.frameBox.left = 12;
        ui.frameBox.width = "calc(100% - 24px)";
    } else {
        ui.frameBox.width = device.width;
        ui.frameBox.left = "max(12px, calc(50% - " + (device.width / 2) + "px))";
    }
};

// Alt down: the measure lines (the overlay loop draws them while the mouse is on an object).
BasicDesigner.onAltKey = function (event) {
    const s = BasicDesigner.state;
    const isDown = event.altKey;
    if (s.isAltDown === isDown) return;
    s.isAltDown = isDown;
    BasicDesigner.startOverlayLoop();
};

BasicDesigner.onKey = function (event) {
    if (event.key === "Escape" && BasicDesigner.colorPick) {
        BasicDesigner.endColorPick("");
        return;
    }
    // WHY: Before the text field check: the focus can be in a field of the page (the iframe), and its Escape
    //      comes here; an open menu must close then too.
    const ui = BasicDesigner.ui;
    if (event.key === "Escape" && (ui.componentMenu || ui.pageMenu || ui.popupMenu || ui.dialog)) {
        BasicDesigner.closeComponentMenu();
        BasicDesigner.closePageMenu();
        BasicDesigner.closePopupMenu();
        BasicDesigner.closeDialog();
        return;
    }
    // WHY: A dialog keeps its keys (the arrows of its tabs must not move the selected object). A key that a field
    //      or a popup already used (the sliders of the color picker) is not a key of the designer.
    if (ui.dialog || ui.tableWindow || event.defaultPrevented) return;
    // WHY: with the focus in the color picker, Backspace deleted the selected object.
    if (event.target && event.target.closest && event.target.closest("[role=dialog]")) return;
    if ((event.metaKey || event.ctrlKey) && (event.key === "o" || event.key === "O")) {
        event.preventDefault(); // WHY: Not the "open a file" of the browser.
        BasicDesigner.openPagePicker();
        return;
    }
    const tag = (event.target && event.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA" || (event.target && event.target.isContentEditable)) return;
    const s = BasicDesigner.state;
    const isCommand = event.metaKey || event.ctrlKey;
    if (isCommand && (event.key === "z" || event.key === "Z")) {
        event.preventDefault();
        if (event.shiftKey) BasicDesigner.redo();
        else BasicDesigner.undo();
        return;
    }
    if (isCommand && (event.key === "y" || event.key === "Y")) {
        event.preventDefault();
        BasicDesigner.redo();
        return;
    }
    // WHY no preventDefault: Cmd+C / Cmd+V must reach the browser, which sends the copy / paste events
    //      (onCopyEvent / onPasteEvent: they can write and read the clipboard of the computer)
    if (isCommand && /^[cvCV]$/.test(event.key)) return;
    if (BasicDesigner.onObjectKey(event)) {
        event.preventDefault();
        return;
    }
    if (event.key === "Escape") { BasicDesigner.select(null); }
    else if (event.key === "v" || event.key === "V") { BasicDesigner.setMode("select"); }
    else if (event.key === "i" || event.key === "I") { BasicDesigner.setMode("interact"); }
    else if ((event.key === "m" || event.key === "M") && !isCommand) { BasicDesigner.setManualMode(!s.isManualMode); }
    else if (event.key === "Enter" && s.selected) { BasicDesigner.openInEditor(BasicDesigner.nameFrame(s.selected)); }
};

// *** RESIZE HANDLES: 8 squares around the selected object. A manual position: all 8 (the left / top ones move it too).
// In the flow of a group (auto): only the right, bottom and right-bottom ones. Shift on a corner keeps the ratio.

BasicDesigner.HANDLE_SIZE = 8;
BasicDesigner.MIN_SIZE = 1;
BasicDesigner.HANDLES = {
    nw: { x: 0, y: 0, cursor: "nwse-resize" },
    n: { x: 0.5, y: 0, cursor: "ns-resize" },
    ne: { x: 1, y: 0, cursor: "nesw-resize" },
    e: { x: 1, y: 0.5, cursor: "ew-resize" },
    se: { x: 1, y: 1, cursor: "nwse-resize" },
    s: { x: 0.5, y: 1, cursor: "ns-resize" },
    sw: { x: 0, y: 1, cursor: "nesw-resize" },
    w: { x: 0, y: 0.5, cursor: "ew-resize" },
};
BasicDesigner.FLOW_HANDLES = ["e", "s", "se"];

BasicDesigner.resize = null; // { obj, name, startX, startY, width, height, left, top, isManual }

BasicDesigner.buildHandles = function () {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const size = BasicDesigner.HANDLE_SIZE;
    ui.handles = {};
    createIn(ui.frameBox, function () {
        Object.keys(BasicDesigner.HANDLES).forEach(function (name) {
            // BOX: A handle
            const handle = Box(0, 0, size, size, { color: "#FFFFFF", round: 2, visible: 0 });
            handle.boxShadow = "0 0 0 1px " + C.accent;
            handle.clickable = 1;
            handle.cursor = BasicDesigner.HANDLES[name].cursor;
            handle.elem.addEventListener("pointerdown", function (event) { BasicDesigner.startResize(event, name); });
            ui.handles[name] = handle;
        });
    });
};

// Over the rectangle of the selection (r: on the canvas), or hidden.
BasicDesigner.placeHandles = function (r) {
    const s = BasicDesigner.state;
    const ui = BasicDesigner.ui;
    if (!ui.handles) return;
    const obj = s.selected && BasicDesigner.movableOf(s.selected);
    const isShown = !!(r && obj && s.mode === "select" && !(BasicDesigner.drag && BasicDesigner.drag.isStarted));
    const isManual = isShown && s.win.getComputedStyle(obj.elem).position === "absolute";
    const half = BasicDesigner.HANDLE_SIZE / 2;
    Object.keys(ui.handles).forEach(function (name) {
        const handle = ui.handles[name];
        const isAllowed = isManual || BasicDesigner.FLOW_HANDLES.indexOf(name) !== -1;
        if (!isShown || !isAllowed) {
            handle.visible = 0;
            return;
        }
        const spot = BasicDesigner.HANDLES[name];
        handle.left = Math.round(r.left + r.width * spot.x - half);
        handle.top = Math.round(r.top + r.height * spot.y - half);
        handle.visible = 1;
    });
};

BasicDesigner.startResize = function (event, name) {
    const s = BasicDesigner.state;
    const obj = s.selected && BasicDesigner.movableOf(s.selected);
    if (!obj || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    BasicDesigner.resize = {
        obj: obj,
        name: name,
        startX: event.clientX,
        startY: event.clientY,
        width: obj.elem.offsetWidth,
        height: obj.elem.offsetHeight,
        left: BasicDesigner.distanceFrom(obj, "left"),
        top: BasicDesigner.distanceFrom(obj, "top"),
        isManual: s.win.getComputedStyle(obj.elem).position === "absolute",
    };
};

// The new size (and place) from the mouse. Only the sides of the handle change; Shift on a corner keeps the ratio.
BasicDesigner.resizeTo = function (event) {
    const rs = BasicDesigner.resize;
    const name = rs.name;
    const dx = event.clientX - rs.startX;
    const dy = event.clientY - rs.startY;
    let width = rs.width;
    let height = rs.height;
    if (name.indexOf("e") !== -1) width = rs.width + dx;
    if (name.indexOf("w") !== -1) width = rs.width - dx;
    if (name.indexOf("s") !== -1) height = rs.height + dy;
    if (name.indexOf("n") !== -1) height = rs.height - dy;
    const isCorner = (name.length === 2);
    if (event.shiftKey && isCorner && rs.height) {
        const ratio = rs.width / rs.height;
        if (Math.abs(dx) > Math.abs(dy)) height = width / ratio;
        else width = height * ratio;
    }
    const snapped = BasicDesigner.snapResize(rs, width, height);
    width = Math.max(BasicDesigner.MIN_SIZE, Math.round(snapped.width));
    height = Math.max(BasicDesigner.MIN_SIZE, Math.round(snapped.height));
    const size = { width: width, height: height };
    if (name.indexOf("w") !== -1) size.left = rs.left + rs.width - width;
    if (name.indexOf("n") !== -1) size.top = rs.top + rs.height - height;
    return size;
};

// The edges that move snap to the targets of the container (only when the container is a basic.js box).
BasicDesigner.snapResize = function (rs, width, height) {
    const container = rs.obj.containerBox;
    const name = rs.name;
    if (!container || !container.elem) return { width: width, height: height };
    let snapX = null;
    let snapY = null;
    if (name.indexOf("e") !== -1) {
        const edge = BasicDesigner.snapValue(rs.left + width, BasicDesigner.snapTargets(container, rs.obj, "x"));
        width = edge.value - rs.left;
        snapX = edge.target;
    }
    if (name.indexOf("w") !== -1) {
        const edge = BasicDesigner.snapValue(rs.left + rs.width - width, BasicDesigner.snapTargets(container, rs.obj, "x"));
        width = rs.left + rs.width - edge.value;
        snapX = edge.target;
    }
    if (name.indexOf("s") !== -1) {
        const edge = BasicDesigner.snapValue(rs.top + height, BasicDesigner.snapTargets(container, rs.obj, "y"));
        height = edge.value - rs.top;
        snapY = edge.target;
    }
    if (name.indexOf("n") !== -1) {
        const edge = BasicDesigner.snapValue(rs.top + rs.height - height, BasicDesigner.snapTargets(container, rs.obj, "y"));
        height = rs.top + rs.height - edge.value;
        snapY = edge.target;
    }
    BasicDesigner.showSnapLine("x", container, snapX);
    BasicDesigner.showSnapLine("y", container, snapY);
    return { width: width, height: height };
};

BasicDesigner.onResizeMove = function (event) {
    const rs = BasicDesigner.resize;
    if (!rs) return;
    event.preventDefault();
    const size = BasicDesigner.resizeTo(event);
    const obj = rs.obj;
    const hasWidth = (rs.name.indexOf("e") !== -1 || rs.name.indexOf("w") !== -1 || rs.name.length === 2);
    const hasHeight = (rs.name.indexOf("n") !== -1 || rs.name.indexOf("s") !== -1);
    if (hasWidth) BasicDesigner.applyValue(obj, "width", size.width);
    if (hasHeight) BasicDesigner.applyValue(obj, "height", size.height);
    if (size.left !== undefined || size.top !== undefined) {
        BasicDesigner.changeSides(obj, function () {
            if (size.left !== undefined) obj.left = size.left;
            if (size.top !== undefined) obj.top = size.top;
        });
    }
    BasicDesigner.startOverlayLoop();
};

BasicDesigner.onResizeEnd = function () {
    const rs = BasicDesigner.resize;
    if (!rs) return;
    BasicDesigner.resize = null;
    BasicDesigner.hideSnapLines();
    BasicDesigner.lastDragEnd = Date.now(); // WHY: The click at the end of the drag is not a selection.
    BasicDesigner.refreshChanges(); // WHY: Once at the end: Changes, the saved session and the undo history.
    BasicDesigner.showProperties(rs.obj);
};

// *** MOVE A MANUAL OBJECT: drag it on the canvas to a new place. Its left / top change (right / bottom when it
// is placed from that side). Its left, center and right (top, middle, bottom) snap to the targets of its container;
// Shift keeps one direction. Cmd/Ctrl+drag is the other drag (into another box).

BasicDesigner.move = null; // { obj, startX, startY, left, top, width, height, isStarted }

BasicDesigner.isManual = function (obj) {
    return BasicDesigner.state.win.getComputedStyle(obj.elem).position === "absolute";
};

BasicDesigner.pressMove = function (event, obj) {
    if (event.button !== 0) return;
    BasicDesigner.move = {
        obj: obj,
        startX: event.clientX,
        startY: event.clientY,
        left: BasicDesigner.distanceFrom(obj, "left"),
        top: BasicDesigner.distanceFrom(obj, "top"),
        width: obj.elem.offsetWidth,
        height: obj.elem.offsetHeight,
        isStarted: false,
    };
};

// The place from the mouse: the start + the move, one direction with Shift, then snapped.
BasicDesigner.moveTo = function (event) {
    const mv = BasicDesigner.move;
    let dx = event.clientX - mv.startX;
    let dy = event.clientY - mv.startY;
    if (event.shiftKey) {
        if (Math.abs(dx) > Math.abs(dy)) dy = 0;
        else dx = 0;
    }
    const container = mv.obj.containerBox;
    let left = mv.left + dx;
    let top = mv.top + dy;
    if (container && container.elem) {
        const snapX = BasicDesigner.snapEdges(left, mv.width, BasicDesigner.snapTargets(container, mv.obj, "x"));
        const snapY = BasicDesigner.snapEdges(top, mv.height, BasicDesigner.snapTargets(container, mv.obj, "y"));
        left = snapX.start;
        top = snapY.start;
        BasicDesigner.showSnapLine("x", container, snapX.target);
        BasicDesigner.showSnapLine("y", container, snapY.target);
    }
    return { left: Math.round(left), top: Math.round(top) };
};

// The start, the middle or the end of an object (from start, length long) on the nearest target.
// { start, target }: target is null when nothing was near.
BasicDesigner.snapEdges = function (start, length, targets) {
    const edges = [0, length / 2, length]; // the distance of each edge from the start
    let best = { start: start, target: null, distance: Infinity };
    edges.forEach(function (edge) {
        const snapped = BasicDesigner.snapValue(start + edge, targets);
        if (snapped.target === null) return;
        const distance = Math.abs(snapped.target - (start + edge));
        if (distance < best.distance) best = { start: snapped.target - edge, target: snapped.target, distance: distance };
    });
    return best;
};

BasicDesigner.onMoveMove = function (event) {
    const mv = BasicDesigner.move;
    if (!mv) return;
    if (!mv.isStarted) {
        const distance = Math.hypot(event.clientX - mv.startX, event.clientY - mv.startY);
        if (distance < BasicDesigner.DRAG_START_DISTANCE) return;
        mv.isStarted = true;
        if (BasicDesigner.state.selected !== mv.obj) BasicDesigner.select(mv.obj);
        if (!BasicDesigner.isManual(mv.obj)) BasicDesigner.leaveFlow(mv);
    }
    event.preventDefault();
    const place = BasicDesigner.moveTo(event);
    const obj = mv.obj;
    const h = BasicDesigner.anchorOf(obj, "left", "right");
    const v = BasicDesigner.anchorOf(obj, "top", "bottom");
    const parent = obj.elem.offsetParent || obj.elem.parentElement;
    BasicDesigner.changeSides(obj, function () {
        // WHY: An object placed from the right / bottom keeps that side: its distance from it changes.
        if (h === "left") obj.left = place.left;
        else obj.right = parent.clientWidth - place.left - mv.width;
        if (v === "top") obj.top = place.top;
        else obj.bottom = parent.clientHeight - place.top - mv.height;
    });
    BasicDesigner.startOverlayLoop();
};

// MANUAL MODE: an object of a group becomes manual where it is (one "sides" change with the move), then it moves.
// WHY its size again: out of the flow a part that grew in it (grow, stretch) has its own size.
BasicDesigner.leaveFlow = function (mv) {
    BasicDesigner.setPositioning(mv.obj, "manual");
    mv.left = BasicDesigner.distanceFrom(mv.obj, "left");
    mv.top = BasicDesigner.distanceFrom(mv.obj, "top");
    mv.width = mv.obj.elem.offsetWidth;
    mv.height = mv.obj.elem.offsetHeight;
};

BasicDesigner.onMoveEnd = function () {
    const mv = BasicDesigner.move;
    BasicDesigner.move = null;
    if (!mv || !mv.isStarted) return;
    BasicDesigner.hideSnapLines();
    BasicDesigner.lastDragEnd = Date.now(); // WHY: The click at the end of the drag is not a selection.
    BasicDesigner.refreshChanges(); // WHY: Once at the end: Changes, the saved session and the undo history.
    BasicDesigner.showProperties(mv.obj);
};

// *** TEXT IN PLACE: a text field over the object, with its font size. Enter / a click out: saved. Escape: not.

BasicDesigner.editTextInPlace = function (obj) {

    const ui = BasicDesigner.ui;
    const C = BasicDesigner.colors;
    BasicDesigner.closeTextEditor();
    const frameRect = ui.frameBox.elem.getBoundingClientRect();
    const r = obj.elem.getBoundingClientRect();
    const cs = BasicDesigner.state.win.getComputedStyle(obj._textElem || obj.elem);

    // INPUT: The text (a raw element on the page of the designer, over the canvas)
    const input = document.createElement("input");
    input.type = "text";
    input.value = String(obj.text || "");
    input.setAttribute("aria-label", "Text");
    Object.assign(input.style, {
        position: "fixed",
        left: (frameRect.left + r.left) + "px",
        top: (frameRect.top + r.top) + "px",
        width: Math.max(r.width, 80) + "px",
        height: Math.max(r.height, 24) + "px",
        boxSizing: "border-box",
        padding: "0px 4px",
        font: cs.fontSize + " " + cs.fontFamily,
        color: "#141414",
        background: "#FFFFFF",
        border: "0px",
        outline: "2px solid " + C.accent,
        borderRadius: "2px",
        zIndex: "9800",
        pointerEvents: "auto",
        userSelect: "text",
    });
    document.body.appendChild(input);
    input.focus();
    input.select();

    let isClosed = false;
    const close = function (isSaved) {
        if (isClosed) return;
        isClosed = true;
        const text = input.value;
        input.remove();
        BasicDesigner.textEditor = null;
        if (!isSaved || text === String(obj.text || "")) return;
        BasicDesigner.select(obj, "tree");
        BasicDesigner.onPropertyChange({ kind: "value", key: "text", value: text });
        BasicDesigner.showProperties(obj);
    };
    input.addEventListener("keydown", function (event) {
        event.stopPropagation(); // WHY: Not a shortcut of the designer (Backspace would delete the object).
        if (event.key === "Enter") close(true);
        if (event.key === "Escape") close(false);
    });
    input.addEventListener("blur", function () { close(true); });
    BasicDesigner.textEditor = { close: close };

};

BasicDesigner.closeTextEditor = function () {
    if (BasicDesigner.textEditor) BasicDesigner.textEditor.close(true);
};

// *** MEASURE AND SNAP:
// Alt + the mouse on another object: the distances between it and the selected object (red lines with numbers).
// Resize and a drop in a Box: an edge closer than the snap distance (Settings) to an edge or the middle of a neighbor (or of the
// container) goes there, and a red guide line shows it.

BasicDesigner.MEASURE_COLOR = "#F24822";
BasicDesigner.MEASURE_LINES = 4;

BasicDesigner.buildMeasureView = function () {
    const ui = BasicDesigner.ui;
    const color = BasicDesigner.MEASURE_COLOR;
    ui.measureLines = [];
    ui.measureLabels = [];
    createIn(ui.frameBox, function () {
        for (let i = 0; i < BasicDesigner.MEASURE_LINES; i++) {
            const line = Box(0, 0, 0, 0, { color: color, visible: 0 });
            line.css = { pointerEvents: "none" };
            ui.measureLines.push(line);
            const label = Label({ text: "", fontSize: 10, textColor: "#FFFFFF", color: color, round: 3, visible: 0 });
            label.css = { padding: "1px 4px", whiteSpace: "nowrap", pointerEvents: "none" };
            ui.measureLabels.push(label);
        }
        ui.snapLineX = Box(0, 0, 1, 0, { color: color, visible: 0 });
        ui.snapLineY = Box(0, 0, 0, 1, { color: color, visible: 0 });
        ui.snapLineX.css = { pointerEvents: "none" };
        ui.snapLineY.css = { pointerEvents: "none" };
    });
};

// One distance: a line from (x1, y1) to (x2, y2) (horizontal or vertical) and its number in the middle.
BasicDesigner.showMeasure = function (index, x1, y1, x2, y2) {
    const ui = BasicDesigner.ui;
    const line = ui.measureLines[index];
    const label = ui.measureLabels[index];
    const isHorizontal = (y1 === y2);
    const length = Math.round(isHorizontal ? x2 - x1 : y2 - y1);
    if (length <= 0) return;
    line.left = Math.min(x1, x2);
    line.top = Math.min(y1, y2);
    line.width = (isHorizontal) ? Math.abs(x2 - x1) : 1;
    line.height = (isHorizontal) ? 1 : Math.abs(y2 - y1);
    line.visible = 1;
    label.text = String(length);
    label.visible = 1;
    label.left = (x1 + x2) / 2 - label.elem.offsetWidth / 2;
    label.top = (y1 + y2) / 2 - label.elem.offsetHeight / 2;
};

BasicDesigner.hideMeasure = function () {
    const ui = BasicDesigner.ui;
    if (!ui.measureLines) return;
    ui.measureLines.forEach(function (line) { line.visible = 0; });
    ui.measureLabels.forEach(function (label) { label.visible = 0; });
};

// a: the selected rectangle, b: the one under the mouse (on the canvas).
BasicDesigner.placeMeasure = function (a, b) {
    BasicDesigner.hideMeasure();
    const isInside = b.left <= a.left && b.top <= a.top && b.right >= a.right && b.bottom >= a.bottom;
    const middleY = (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2;
    const middleX = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
    const centerY = (a.top + a.bottom) / 2;
    const centerX = (a.left + a.right) / 2;
    if (isInside) {
        // In its container: the four distances to the inner edges.
        BasicDesigner.showMeasure(0, b.left, centerY, a.left, centerY);
        BasicDesigner.showMeasure(1, a.right, centerY, b.right, centerY);
        BasicDesigner.showMeasure(2, centerX, b.top, centerX, a.top);
        BasicDesigner.showMeasure(3, centerX, a.bottom, centerX, b.bottom);
        return;
    }
    const y = (a.bottom > b.top && a.top < b.bottom) ? middleY : centerY;
    const x = (a.right > b.left && a.left < b.right) ? middleX : centerX;
    if (b.left >= a.right) BasicDesigner.showMeasure(0, a.right, y, b.left, y);
    if (a.left >= b.right) BasicDesigner.showMeasure(0, b.right, y, a.left, y);
    if (b.top >= a.bottom) BasicDesigner.showMeasure(1, x, a.bottom, x, b.top);
    if (a.top >= b.bottom) BasicDesigner.showMeasure(1, x, b.bottom, x, a.top);
};

// The x (or y) values a moving edge snaps to, in the coordinates of the container: its edges and middle,
// and the edges and the middle of the other objects in it.
BasicDesigner.snapTargets = function (container, except, axis) {
    const isX = (axis === "x");
    const size = (isX) ? container.elem.clientWidth : container.elem.clientHeight;
    const targets = [0, size / 2, size];
    BasicDesigner.childObjects(container).forEach(function (other) {
        if (other === except || !other.elem.offsetParent) return;
        const start = (isX) ? other.elem.offsetLeft : other.elem.offsetTop;
        const length = (isX) ? other.elem.offsetWidth : other.elem.offsetHeight;
        targets.push(start, start + length / 2, start + length);
    });
    return targets;
};

// value -> the nearest target in the snap distance (Settings), or value. { value, target } (target: null when it did not snap)
BasicDesigner.snapValue = function (value, targets) {
    if (!BasicDesigner.settings.snap) return { value: value, target: null };
    const distanceLimit = BasicDesigner.settings.snapDistance;
    let best = null;
    targets.forEach(function (target) {
        const distance = Math.abs(target - value);
        if (distance <= distanceLimit && (best === null || distance < Math.abs(best - value))) best = target;
    });
    return { value: (best === null) ? value : best, target: best };
};

// A guide line at x (axis "x": vertical) or y over the container, or hidden (position null).
BasicDesigner.showSnapLine = function (axis, container, position) {
    const ui = BasicDesigner.ui;
    const line = (axis === "x") ? ui.snapLineX : ui.snapLineY;
    if (position === null || position === undefined) {
        line.visible = 0;
        return;
    }
    const r = container.elem.getBoundingClientRect();
    const borderLeft = container.elem.clientLeft;
    const borderTop = container.elem.clientTop;
    if (axis === "x") {
        line.left = r.left + borderLeft + position - container.elem.scrollLeft;
        line.top = r.top;
        line.height = r.height;
    } else {
        line.left = r.left;
        line.top = r.top + borderTop + position - container.elem.scrollTop;
        line.width = r.width;
    }
    line.visible = 1;
};

BasicDesigner.hideSnapLines = function () {
    const ui = BasicDesigner.ui;
    if (!ui.snapLineX) return;
    ui.snapLineX.visible = 0;
    ui.snapLineY.visible = 0;
};

// *** KEYBOARD: shortcuts for the selected object (Select mode).

BasicDesigner.NUDGE_STEP = 1;
BasicDesigner.NUDGE_BIG_STEP = 10; // with Shift
BasicDesigner.COPY_OFFSET = 10; // a copy in a Box (not a group) is this far from the original

// The props that a copy takes from the original, by its type.
BasicDesigner.COPY_KEYS = {
    common: ["width", "height", "color", "opacity", "round", "border", "borderColor", "boxShadow"],
    text: ["text", "fontSize", "textColor", "textAlign", "bold", "italic"],
    group: ["gap", "padding", "align", "wrap", "justify"],
    // WHY not of a Button / Input: the panel reads the padding the browser gives them ("6, 1"), not one of the code.
    padding: ["padding"], // a Box and a Label
    field: ["minimal"], // a Button and an Input
    input: ["placeholder", "inputType", "maxLength"],
};

// Cmd+D: a copy of a basic.js object (not a component), right after it.
BasicDesigner.duplicateObject = function (obj) {
    const item = BasicDesigner.copyItemOf(obj);
    if (!item) {
        BasicDesigner.setStatus("This object can not be copied (a component whose parameters were not caught).");
        return;
    }
    const place = { container: obj.containerBox, before: BasicDesigner.nextObject(obj), isManual: BasicDesigner.isManualInGroup(obj) };
    if (!obj.containerBox._isFlex || place.isManual) {
        place.point = { x: BasicDesigner.distanceFrom(obj, "left") + BasicDesigner.COPY_OFFSET, y: BasicDesigner.distanceFrom(obj, "top") + BasicDesigner.COPY_OFFSET };
    }
    BasicDesigner.addObjectAt(item, place);
    const copy = BasicDesigner.lastAddedObject();
    // WHY: A box or a group is copied with what is in it (it came empty).
    if (!copy || !BasicDesigner.isContainerType(item.type)) return;
    const skipped = BasicDesigner.copyChildren(obj, copy);
    if (skipped) BasicDesigner.setStatus("Copied without " + skipped + " component" + ((skipped === 1) ? "" : "s") + " in it (a component is not copied with Cmd+D).");
};

// The toolbox item of a copy of obj: { type, props, copyOf }, or null (a component, an unknown type).
BasicDesigner.copyItemOf = function (obj) {
    const type = BasicDesigner.typeOf(obj);
    if (obj.__bd.component) return BasicDesigner.componentCopyItem(obj);
    if (!BasicDesigner.toolboxItems.some(function (i) { return i.type === type; })) return null;
    const p = BasicDesigner.readProps(obj);
    let keys = BasicDesigner.COPY_KEYS.common.slice();
    if (p.isText) keys = keys.concat(BasicDesigner.COPY_KEYS.text);
    if (p.isGroup) keys = keys.concat(BasicDesigner.COPY_KEYS.group);
    if (type === "Box" || type === "Label") keys = keys.concat(BasicDesigner.COPY_KEYS.padding);
    if (p.isButton || p.isInput) keys = keys.concat(BasicDesigner.COPY_KEYS.field);
    if (p.isInput) keys = keys.concat(BasicDesigner.COPY_KEYS.input);
    const defaults = BasicDesigner.defaultPropsOf(type);
    const props = {};
    keys.forEach(function (key) {
        const value = p[key];
        if (value === "" || value === undefined || value === null) return;
        if (String(value) === String(defaults[key])) return; // the copy gets it from basic.js anyway
        // WHY listValue: the panel reads a list as a text ("14, 10"), which the setter does not take: the copy lost it.
        props[key] = (BasicDesigner.LIST_PROPS[key]) ? BasicDesigner.listValue(value) : value;
    });
    return { type: type, props: props, copyOf: BasicDesigner.describeObject(obj) };
};

// Can obj be copied (Cmd+D, Cmd+C)? WHY not copyItemOf: it makes a new object on the page for the defaults
// (defaultPropsOf); opening the menu must not change the page.
BasicDesigner.canCopy = function (obj) {
    if (obj.__bd.component) return !!obj.__bd.params;
    const type = BasicDesigner.typeOf(obj);
    return BasicDesigner.toolboxItems.some(function (i) { return i.type === type; });
};

// The values the panel reads on a new object of this type: what the basic.js of the page gives without a prop.
// WHY: a copy wrote every value into its code, also the ones basic.js gives anyway (opacity: 1, round: 0, border: 0,
//      padding: 0). WHY made by the page: its basic.js may be another version. Made once per type on page (not in the
//      container of the copy: a component may watch its boxes; the values copied do not depend on it) and removed at
//      once, so it is never drawn. {} when it can not be made: then every value is written, as before.
BasicDesigner.defaultPropsOf = function (type) {
    const s = BasicDesigner.state;
    if (s.defaultProps[type]) return s.defaultProps[type];
    let fresh = null;
    try {
        fresh = BasicDesigner.createInPage(type, {}, s.win.page);
        s.defaultProps[type] = BasicDesigner.readProps(fresh);
    } catch (error) {
        s.defaultProps[type] = {};
    }
    if (fresh) fresh.remove();
    return s.defaultProps[type];
};

// The objects in source, copied into copy (and what is in them). Returns the number of the ones not copied.
BasicDesigner.copyChildren = function (source, copy) {
    let skipped = 0;
    BasicDesigner.childObjects(source).forEach(function (child) {
        const item = BasicDesigner.copyItemOf(child);
        if (!item) {
            skipped++;
            return;
        }
        const place = { container: copy, before: null, isManual: BasicDesigner.isManualInGroup(child) };
        if (!copy._isFlex || place.isManual) place.point = { x: BasicDesigner.distanceFrom(child, "left"), y: BasicDesigner.distanceFrom(child, "top") };
        BasicDesigner.addObjectAt(item, place);
        const childCopy = BasicDesigner.lastAddedObject();
        if (childCopy && BasicDesigner.isContainerType(item.type)) skipped += BasicDesigner.copyChildren(child, childCopy);
    });
    return skipped;
};

BasicDesigner.lastAddedObject = function () {
    const list = BasicDesigner.state.addedObjects;
    return list[list.length - 1] || null;
};

// Arrow keys: a manual position moves (1 px, Shift: 10 px); in a group the object goes before / after its neighbor.
BasicDesigner.ARROW_DIRECTIONS = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

BasicDesigner.moveByKey = function (obj, key, isBig) {
    const step = (isBig) ? BasicDesigner.NUDGE_BIG_STEP : BasicDesigner.NUDGE_STEP;
    const direction = BasicDesigner.ARROW_DIRECTIONS[key];
    const dx = direction[0] * step;
    const dy = direction[1] * step;
    const isManual = BasicDesigner.state.win.getComputedStyle(obj.elem).position === "absolute";
    if (isManual) {
        BasicDesigner.nudge(obj, dx, dy);
        return;
    }
    const container = obj.containerBox;
    if (!BasicDesigner.isPlainContainer(container)) return;
    const isEarlier = (dx < 0 || dy < 0);
    const previous = BasicDesigner.previousObject(obj);
    const next = BasicDesigner.nextObject(obj);
    if (isEarlier && previous) BasicDesigner.moveObject(obj, { container: container, before: previous });
    if (!isEarlier && next) BasicDesigner.moveObject(obj, { container: container, before: BasicDesigner.nextObject(next) });
};

// Moves a manual position on the screen by dx / dy, from the side it is measured from.
BasicDesigner.nudge = function (obj, dx, dy) {
    const h = BasicDesigner.anchorOf(obj, "left", "right");
    const v = BasicDesigner.anchorOf(obj, "top", "bottom");
    const x = BasicDesigner.distanceFrom(obj, h) + ((h === "left") ? dx : -dx);
    const y = BasicDesigner.distanceFrom(obj, v) + ((v === "top") ? dy : -dy);
    BasicDesigner.changeSides(obj, function () {
        obj[h] = x;
        obj[v] = y;
    });
    BasicDesigner.refreshChanges();
    BasicDesigner.showProperties(obj);
};

// The shortcuts that change the selected object. Returns true when the key was one of them.
BasicDesigner.onObjectKey = function (event) {
    const s = BasicDesigner.state;
    const obj = s.selected && BasicDesigner.movableOf(s.selected);
    if (!obj || s.mode !== "select" || !obj.elem.isConnected) return false;
    const isCommand = event.metaKey || event.ctrlKey;
    const isInTree = BasicDesigner.ui.tree.elem.contains(document.activeElement);
    if (event.key === "Delete" || event.key === "Backspace") {
        BasicDesigner.deleteObject(obj);
        return true;
    }
    if (isCommand && (event.key === "d" || event.key === "D")) {
        BasicDesigner.duplicateObject(obj);
        return true;
    }
    // WHY no check of Alt: on some keyboards (Turkish Q of a Mac) [ and ] are written with Alt.
    if (!isCommand && (event.key === "]" || event.key === "[")) {
        if (event.key === "]") BasicDesigner.bringToFront(obj);
        else BasicDesigner.sendToBack(obj);
        return true;
    }
    // WHY: In the layers the arrow keys move between the rows (TreeView).
    if (/^Arrow/.test(event.key) && !isInTree && !isCommand) {
        BasicDesigner.moveByKey(obj, event.key, event.shiftKey);
        return true;
    }
    return false;
};

// *** THE PICTURE OF AN ICON: its file (Icon.picture of runtime.js: src / load()). A picture is chosen from the folders
// of the project (the browser never gives the path of a file on the disk) and written relative to the page.

BasicDesigner.SHORT_PICTURE_LENGTH = 60;

// A picture written in the code (a data URI, often long) is shown short: what it is and how big
BasicDesigner.shortPicture = function (value) {
    const text = String(value || "");
    if (!/^data:/i.test(text)) return text;
    const kind = (text.match(/^data:([^;,]+)/i) || [])[1] || "data";
    return "(in the code: " + kind + ", " + Math.round(text.length / 1024 * 10) / 10 + " KB)";
};

// The repo path of a picture that the page writes relative to itself ("../assets/a.png" on 02-x/y.htm -> "assets/a.png")
BasicDesigner.repoPathOfPicture = function (value) {
    const text = String(value || "");
    if (!text || /^(data:|https?:|blob:)/i.test(text)) return "";
    const url = new URL(text, new URL(BasicDesigner.state.pagePath, BasicDesigner.state.rootUrl)).href;
    return BasicDesigner.relPath(url);
};

// The parameter of a component that gives the picture of this Icon (inside the component): the one whose text is the
// file of the Icon. { component, path, value, text } or null (an Icon of the page, or no parameter has its file).
BasicDesigner.pictureParamOf = function (icon) {
    const component = BasicDesigner.componentOf(icon);
    const picture = icon.picture;
    if (!component || component === icon || !component.__bd.params || !picture) return null;
    const MAX_DEPTH = 4;
    let found = null;
    const search = function (value, path) {
        if (found || path.length > MAX_DEPTH) return;
        if (value === picture) {
            found = path;
            return;
        }
        if (!BasicDesigner.isPlain(value)) return;
        Object.keys(value).forEach(function (key) { search(value[key], path.concat(key)); });
    };
    search(component.__bd.params, []);
    if (!found || !found.length) return null;
    return { component: component, path: found, value: picture, text: found.join(".") + " of " + component.__bd.component };
};

BasicDesigner.pictureLabel = function (pictureParam) {
    return (pictureParam) ? "File · " + pictureParam.text : "File";
};

BasicDesigner.openPictureDialog = function (obj) {
    BasicDesigner.openPictureBrowser(obj.picture, function (repoPath) {
        if (!obj.elem.isConnected) return;
        BasicDesigner.select(obj, "panel");
        BasicDesigner.onPropertyChange({ kind: "value", key: "picture", value: BasicDesigner.pathFromPage(repoPath) });
        // WHY: a parameter of a component makes the component again (the Icon is a new one, already selected)
        if (obj.elem.isConnected) BasicDesigner.showProperties(obj);
    });
};

// The folders of the project and the pictures in them. picture: the value now. onChoose(repoPath)
BasicDesigner.openPictureBrowser = function (picture, onChoose) {
    const C = BasicDesigner.colors;
    const s = BasicDesigner.state;
    const THUMB = 36;
    const current = BasicDesigner.repoPathOfPicture(picture);
    let currentPath = (current) ? BasicDesigner.folderOf(current) : BasicDesigner.folderOf(s.pagePath);
    let listBox = null;
    let lblPath = null;
    let lblCount = null;

    const choose = function (repoPath) {
        BasicDesigner.closeDialog();
        onChoose(repoPath);
    };

    // LABEL: a row: a folder (a click goes into it) or a picture with its small preview (a click chooses it)
    const addRow = function (text, onClick, pictureUrl) {
        const row = HGroup({ width: "100%", height: (pictureUrl) ? THUMB + 8 : 26, align: "left center", gap: 8, padding: [8, 0], round: 5, color: "transparent" });
        row.shrink = 0;
        row.clickable = 1;
        row.cursor = "pointer";
            if (pictureUrl) {
                const preview = Icon({ width: THUMB, height: THUMB, imageFit: "contain", color: C.field, round: 4 });
                preview.load(pictureUrl);
                preview.shrink = 0;
            }
            const label = Label({ text: "", fontSize: 12, textColor: C.text, ellipsis: 1 });
            label.plainText = text;
        endGroup();
        row.onHoverChange(function (self, isOver) { row.color = (isOver) ? C.hover : "transparent"; });
        row.on("click", onClick);
    };

    const showFolder = async function (folderPath) {
        currentPath = folderPath;
        lblPath.plainText = "/" + folderPath;
        lblCount.plainText = "…";
        let list;
        try {
            list = await BasicDesigner.listFolder(folderPath, "images");
        } catch (error) {
            lblCount.plainText = error.message;
            return;
        }
        if (currentPath !== folderPath) return; // WHY: a faster click went into another folder
        lblCount.plainText = list.files.length + ((list.files.length === 1) ? " picture" : " pictures") + " here";
        if (!list.files.length && BasicDesigner.isInVSCode) lblCount.plainText += " (no picture? the extension must be 0.0.6 or newer)";
        createIn(listBox, function () {
            listBox.elem.innerHTML = "";
            if (folderPath) addRow("↑  ..", function () { showFolder(BasicDesigner.folderOf(folderPath)); });
            list.folders.sort().forEach(function (name) {
                const path = (folderPath) ? folderPath + "/" + name : name;
                addRow("▸  " + name, function () { showFolder(path); });
            });
            list.files.sort().forEach(function (name) {
                const path = (folderPath) ? folderPath + "/" + name : name;
                addRow(name + ((path === current) ? "   (now)" : ""), function () { choose(path); }, new URL(path, s.rootUrl).href);
            });
        });
    };

    BasicDesigner.openDialog("Choose a picture", function () {
        lblPath = Label({ text: "", fontSize: 12, textColor: C.accentLight });
        lblPath.css = { wordBreak: "break-all" };
        // BOX: the folders and the pictures (it scrolls)
        listBox = VGroup({ width: "100%", height: 320, align: "left top", gap: 0, padding: 4, color: C.field, round: 6, border: 1, borderColor: C.line, scrollY: 1 });
        listBox.css = { alignItems: "stretch", boxSizing: "border-box" };
        endGroup();
        lblCount = Label({ text: "", fontSize: 12, textColor: C.dim });
    });
    showFolder(currentPath);
};

// *** CHANGES, SMALL: one line at the bottom (the number of the changes, the buttons as icons) and more room for the
// layers. It stays small until it is made big again (basic.storage): some users want it always small.

BasicDesigner.CHANGES_SMALL_KEY = "basic-designer-changes-small";
BasicDesigner.CHANGES_BAR_HEIGHT = 36;
BasicDesigner.CHANGES_PANEL_TOP = "60%"; // the big Changes starts here

BasicDesigner.isChangesSmall = function () {
    return basic.storage.load(BasicDesigner.CHANGES_SMALL_KEY) === 1;
};

// Where the layers end: over the big Changes, or over its one line
BasicDesigner.layersBottom = function () {
    if (BasicDesigner.isChangesSmall()) return "100% - " + BasicDesigner.CHANGES_BAR_HEIGHT + "px";
    return BasicDesigner.CHANGES_PANEL_TOP;
};

BasicDesigner.changesSummary = function (count) {
    if (!count) return "No changes";
    return count + ((count === 1) ? " change" : " changes");
};

BasicDesigner.buildChangesBar = function () {
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui;
    const barHeight = BasicDesigner.CHANGES_BAR_HEIGHT;
    ui.changesBar = HGroup(0, 0, "100%", barHeight, { align: "left center", gap: 4, padding: [6, 0], color: "transparent" });
        that.top = "calc(100% - " + barHeight + "px)";
        that.css = { borderTop: "1px solid " + C.line };
        that.clipContent = 0;
        BasicDesigner.iconButton({ path: "M4.5 9.5L8 6l3.5 3.5", name: "Make Changes big", description: "The list of the changes again.", size: 24, iconSize: 14, onClick: function () { BasicDesigner.setChangesSmall(false); } });
        Label({ text: "Changes", fontSize: 12, textColor: C.text, fontFamily: "opensans-bold" });
        ui.lblChangesSummary = Label({ text: "", fontSize: 12, textColor: C.soft });
        ui.lblChangesSummary.grow = 1;
        if (BasicDesigner.isInVSCode) ui.btnBarSend = BasicDesigner.sendButton(false);
        else ui.btnBarCopy = BasicDesigner.copyButton(false);
        ui.btnBarRevert = BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.undo, name: "Revert all", description: "Every change of this page goes back.", size: 28, iconSize: 15, onClick: BasicDesigner.revertAll });
    endGroup();
    BasicDesigner.setChangesSmall(BasicDesigner.isChangesSmall());
};

BasicDesigner.setChangesSmall = function (isSmall) {
    const ui = BasicDesigner.ui;
    basic.storage.save(BasicDesigner.CHANGES_SMALL_KEY, (isSmall) ? 1 : 0);
    ui.changesPanel.visible = (isSmall) ? 0 : 1;
    ui.changesBar.visible = (isSmall) ? 1 : 0;
    const top = BasicDesigner.LAYERS_TOP + BasicDesigner.PAGE_ROW_HEIGHT;
    ui.tree.height = "calc(" + BasicDesigner.layersBottom() + " - " + top + "px)";
    if (ui.treeTrash) ui.treeTrash.css.top = "calc(" + BasicDesigner.layersBottom() + " - " + (BasicDesigner.TRASH_SMALL_SIZE + 12) + "px)";
};

// *** PICK A COLOR FROM THE PAGE: the eyedropper of the color picker where the browser has none (VS Code, Safari,
// Firefox). The next click on the canvas gives the color under the mouse (a picture: its pixel; Alt: the text color).

BasicDesigner.colorPick = null; // { done } while the next click picks a color

BasicDesigner.pickColor = function (panel, done) {
    const s = BasicDesigner.state;
    if (!s.win) {
        done("");
        return;
    }
    BasicDesigner.endColorPick("");
    if (s.mode !== "select") BasicDesigner.setMode("select");
    BasicDesigner.colorPick = { done: done };
    BasicDesigner.ui.cover.elem.style.cursor = "crosshair";
    BasicDesigner.setStatus("Click a color on the page (Alt: the color of a text) · Esc: cancel");
};

BasicDesigner.endColorPick = function (color) {
    const pick = BasicDesigner.colorPick;
    if (!pick) return;
    BasicDesigner.colorPick = null;
    BasicDesigner.ui.cover.elem.style.cursor = "";
    BasicDesigner.hidePickPreview();
    if (!color) BasicDesigner.setStatus("");
    pick.done(color || "");
};

// "rgb(1, 2, 3)" / "rgba(1, 2, 3, 0.5)" -> { r, g, b, a }; another form (color(srgb ...)) -> null
BasicDesigner.parseRgb = function (text) {
    const m = String(text).match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
    if (!m) return null;
    let a = (m[4] === undefined) ? 1 : parseFloat(m[4]);
    if (/%$/.test(m[4] || "")) a = a / 100;
    return { r: +m[1], g: +m[2], b: +m[3], a: a };
};

BasicDesigner.hexOfRgb = function (c) {
    const part = function (n) { return Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0"); };
    return ("#" + part(c.r) + part(c.g) + part(c.b)).toUpperCase();
};

// The pixel of a picture at the point (x, y in the iframe), or "" (not loaded, or from another site)
BasicDesigner.pixelOfImage = function (img, x, y) {
    const rect = img.getBoundingClientRect();
    if (!img.naturalWidth || !rect.width || !rect.height) return "";
    try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        const sx = (x - rect.left) / rect.width * img.naturalWidth;
        const sy = (y - rect.top) / rect.height * img.naturalHeight;
        context.drawImage(img, sx, sy, 1, 1, 0, 0, 1, 1);
        const d = context.getImageData(0, 0, 1, 1).data;
        if (d[3] === 0) return "";
        return BasicDesigner.hexOfRgb({ r: d[0], g: d[1], b: d[2] });
    } catch (error) {
        return ""; // WHY: a picture of another site can not be read (a tainted canvas)
    }
};

// Under everything: the color of <html>, else of <body> (the browser paints it on the whole page, also where the
// body is not: it is not in elementsFromPoint), else white
BasicDesigner.canvasColorOf = function (win) {
    const doc = win.document;
    const sources = [doc.documentElement, doc.body];
    for (let i = 0; i < sources.length; i++) {
        const c = sources[i] && BasicDesigner.parseRgb(win.getComputedStyle(sources[i]).backgroundColor);
        if (c && c.a > 0) return { r: c.r, g: c.g, b: c.b };
    }
    return { r: 255, g: 255, b: 255 };
};

// The color the eye sees at the point: the backgrounds over each other (a see-through one mixes with what is under it)
BasicDesigner.colorAt = function (x, y, isText) {
    const win = BasicDesigner.state.win;
    const list = BasicDesigner.elementsAt(x, y);
    if (!list.length) return "";
    if (isText) {
        const c = BasicDesigner.parseRgb(win.getComputedStyle(list[0]).color);
        return (c) ? BasicDesigner.hexOfRgb(c) : "";
    }
    if (list[0].tagName === "IMG") {
        const pixel = BasicDesigner.pixelOfImage(list[0], x, y);
        if (pixel) return pixel;
    }
    const layers = [];
    for (let i = 0; i < list.length; i++) {
        const c = BasicDesigner.parseRgb(win.getComputedStyle(list[i]).backgroundColor);
        if (!c || c.a <= 0) continue;
        layers.push(c);
        if (c.a >= 1) break;
    }
    let result = BasicDesigner.canvasColorOf(win);
    for (let i = layers.length - 1; i >= 0; i--) {
        const c = layers[i];
        result = { r: c.r * c.a + result.r * (1 - c.a), g: c.g * c.a + result.g * (1 - c.a), b: c.b * c.a + result.b * (1 - c.a) };
    }
    return BasicDesigner.hexOfRgb(result);
};

// *** A COPY OF A COMPONENT: made again with its parameters (runtime.js keeps them: __bd.params). Only the ones that
// are not the defaults (or the defaults of its style package) go into the prompt. Functions (onClick...) are not copied.

// A plain copy for JSON: no functions, no DOM elements, no basic.js objects, no loops
BasicDesigner.plainCopy = function (value) {
    const seen = new WeakSet();
    const text = JSON.stringify(value, function (key, v) {
        if (typeof v === "function") return undefined;
        if (v && typeof v === "object") {
            if (v.nodeType || v.elem || seen.has(v)) return undefined;
            seen.add(v);
        }
        return v;
    });
    return (text === undefined) ? null : JSON.parse(text);
};

// The parameters a component gets when only its styleName is given (its defaults + its style package)
BasicDesigner.componentBaseParams = function (type, styleName) {
    const w = BasicDesigner.state.win;
    const defaults = w.eval("typeof " + type + "Defaults === 'object' ? " + type + "Defaults : null");
    if (!defaults) return null;
    const probe = (styleName) ? { styleName: styleName } : {};
    try {
        const factory = w.eval(type);
        if (factory && factory.styles && w.basic.applyStylePackage) w.basic.applyStylePackage(probe, factory.styles, defaults);
        w.mergeIntoIfMissing(probe, defaults);
    } catch (error) {
        return BasicDesigner.plainCopy(defaults);
    }
    return BasicDesigner.plainCopy(probe);
};

BasicDesigner.componentCopyItem = function (obj) {
    const type = obj.__bd.component;
    if (!obj.__bd.params) return null;
    const params = BasicDesigner.plainCopy(obj.__bd.params) || {};
    const base = BasicDesigner.componentBaseParams(type, params.styleName);
    const props = (base) ? BasicDesigner.diffValue(params, base) : params;
    return { type: type, props: props || {}, copyOf: BasicDesigner.describeObject(obj), script: BasicDesigner.componentScriptOf(type) };
};

// The file of a component in the scripts of the page (repo path): its name in kebab case (SmartButton ->
// smart-button.js), else "" (a component of the page itself)
BasicDesigner.componentScriptOf = function (type) {
    const fileName = type.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    const pattern = new RegExp("/" + fileName + "(\\.min)?\\.js(\\?|$)");
    const scripts = Array.from(BasicDesigner.state.win.document.scripts);
    const found = scripts.find(function (el) { return el.src && pattern.test(el.src.split("#")[0]); });
    return (found) ? BasicDesigner.relPath(found.src).replace(/\.min\.js$/, ".js") : "";
};

// item: a component that the page does not have, with its file (item.script): the file is put into the page at once
// (a sync request: the object is made in the same call, also when a saved session is applied).
// Returns the repo path when it was loaded here (the prompt asks for its <script>), else "".
BasicDesigner.loadMissingComponent = function (item) {
    const s = BasicDesigner.state;
    const w = s.win;
    if (!item.script || BasicDesigner.BASIC_TYPES.indexOf(item.type) !== -1) return "";
    const isLoaded = w.eval("typeof " + item.type + " === 'function'");
    if (isLoaded) return (s.loadedScripts && s.loadedScripts[item.script]) ? item.script : "";
    const url = new URL(item.script, s.rootUrl).href;
    try {
        const request = new XMLHttpRequest();
        request.open("GET", url, false); // WHY sync: addObjectAt makes the object right after this
        request.send();
        if (request.status !== 200) return "";
        const el = w.document.createElement("script");
        el.textContent = request.responseText + "\n//# sourceURL=" + url;
        w.document.head.appendChild(el);
    } catch (error) {
        return "";
    }
    if (!s.loadedScripts) s.loadedScripts = {};
    s.loadedScripts[item.script] = 1;
    return item.script;
};

// A repo path as the page writes it (relative to the folder of the page): "comp/x.js" -> "../comp/x.js"
BasicDesigner.pathFromPage = function (repoPath) {
    const pageParts = BasicDesigner.state.pagePath.split("/").slice(0, -1);
    const parts = repoPath.split("/");
    while (pageParts.length && parts.length > 1 && pageParts[0] === parts[0]) {
        pageParts.shift();
        parts.shift();
    }
    return "../".repeat(pageParts.length) + parts.join("/");
};

// What is in value and not the same in base: the keys of an object one by one (deep), another value whole.
// undefined: nothing differs. (Ex: only style.label.fontSize of a whole style)
BasicDesigner.diffValue = function (value, base) {
    const isObject = function (v) { return v && typeof v === "object" && !Array.isArray(v); };
    if (!isObject(value) || !isObject(base)) {
        return (JSON.stringify(value) === JSON.stringify(base)) ? undefined : value;
    }
    const result = {};
    let hasDifference = false;
    Object.keys(value).forEach(function (key) {
        const part = BasicDesigner.diffValue(value[key], base[key]);
        if (part === undefined) return;
        result[key] = part;
        hasDifference = true;
    });
    return (hasDifference) ? result : undefined;
};

// *** COPY / PASTE: Cmd+C keeps a copy of the object (and what is in it) as it is now; Cmd+V adds it into the selected
// box, or after the selected object (in a Box: a little lower and to the right of it), or into the page.

BasicDesigner.clipboard = null; // { item, point, children }

BasicDesigner.snapshotOf = function (obj) {
    const item = BasicDesigner.copyItemOf(obj);
    if (!item) return null;
    const snap = { item: item, point: { x: BasicDesigner.distanceFrom(obj, "left"), y: BasicDesigner.distanceFrom(obj, "top") }, isManual: BasicDesigner.isManualInGroup(obj), children: [] };
    if (!BasicDesigner.isContainerType(item.type)) return snap;
    BasicDesigner.childObjects(obj).forEach(function (child) {
        const childSnap = BasicDesigner.snapshotOf(child);
        if (childSnap) snap.children.push(childSnap);
    });
    return snap;
};

// Adds the snapshot (and its objects) at the place. Returns the new object.
BasicDesigner.addSnapshot = function (snap, place) {
    BasicDesigner.addObjectAt(snap.item, place);
    const copy = BasicDesigner.lastAddedObject();
    if (!copy) return null;
    snap.children.forEach(function (childSnap) {
        const childPlace = { container: copy, before: null, isManual: !!childSnap.isManual };
        if (!copy._isFlex || childPlace.isManual) childPlace.point = childSnap.point;
        BasicDesigner.addSnapshot(childSnap, childPlace);
    });
    return copy;
};

// event: a copy event (Cmd+C) writes its clipboardData; without it (the menu) the Clipboard API is tried.
BasicDesigner.copyObject = function (obj, event) {
    const snap = BasicDesigner.snapshotOf(obj);
    if (!snap) {
        BasicDesigner.setStatus("This object can not be copied.");
        return;
    }
    BasicDesigner.clipboard = snap;
    const text = BasicDesigner.clipboardTextOf(snap);
    if (event && event.clipboardData) {
        event.clipboardData.setData("text/plain", text);
        event.preventDefault();
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () { }); // WHY: not allowed here: the designer keeps it
    }
    BasicDesigner.setStatus(snap.item.type + " copied (also for another page). ⌘V: into the selected box, or after the selected object.");
};

// THE CLIPBOARD OF THE COMPUTER: a copy is a JSON text with a mark, so a page opened later can paste it.
BasicDesigner.CLIPBOARD_MARK = "basicDesignerObject";

BasicDesigner.clipboardTextOf = function (snap) {
    const data = { page: BasicDesigner.state.pagePath, snap: snap };
    data[BasicDesigner.CLIPBOARD_MARK] = 1;
    return JSON.stringify(data);
};

// The copy in a text of the clipboard, or null (another text)
BasicDesigner.snapOfClipboardText = function (text) {
    if (!text || text.indexOf(BasicDesigner.CLIPBOARD_MARK) === -1) return null;
    try {
        const data = JSON.parse(text);
        return (data && data[BasicDesigner.CLIPBOARD_MARK] && data.snap && data.snap.item) ? data.snap : null;
    } catch (error) {
        return null;
    }
};

BasicDesigner.isTextTarget = function (el) {
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

// Cmd+C: the selected object (not when a text is selected or a field has the focus: that is a copy of a text)
BasicDesigner.onCopyEvent = function (event) {
    const s = BasicDesigner.state;
    if (BasicDesigner.isTextTarget(event.target) || BasicDesigner.ui.dialog || BasicDesigner.ui.tableWindow || s.mode !== "select") return;
    const doc = (event.target && event.target.ownerDocument) || document;
    if (String(doc.getSelection && doc.getSelection())) return;
    const obj = s.selected && s.selected.elem.isConnected ? BasicDesigner.movableOf(s.selected) : null;
    if (obj) BasicDesigner.copyObject(obj, event);
};

// Cmd+V: a copy of the designer from the clipboard (also of another page), else the last copy here
BasicDesigner.onPasteEvent = function (event) {
    if (BasicDesigner.isTextTarget(event.target) || BasicDesigner.ui.dialog || BasicDesigner.ui.tableWindow || BasicDesigner.state.mode !== "select") return;
    const text = (event.clipboardData) ? event.clipboardData.getData("text/plain") : "";
    const snap = BasicDesigner.snapOfClipboardText(text);
    if (!snap && !BasicDesigner.clipboard) return;
    event.preventDefault();
    BasicDesigner.pasteObject(snap);
};

// The menu has no paste event: the Clipboard API is tried (it may ask, or not be allowed), else the last copy here
BasicDesigner.pasteFromMenu = function () {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
        BasicDesigner.pasteObject();
        return;
    }
    navigator.clipboard.readText().then(function (text) {
        BasicDesigner.pasteObject(BasicDesigner.snapOfClipboardText(text));
    }).catch(function () {
        BasicDesigner.pasteObject();
    });
};

BasicDesigner.pasteMenuText = function (obj) {
    if (!obj) return "Paste into the page · ⌘V";
    return (BasicDesigner.isPlainContainer(obj)) ? "Paste into it · ⌘V" : "Paste after it · ⌘V";
};

BasicDesigner.pasteObject = function (fromClipboard) {
    const snap = fromClipboard || BasicDesigner.clipboard;
    if (!snap) {
        BasicDesigner.setStatus("Nothing is copied (⌘C copies the selected object).");
        return;
    }
    const s = BasicDesigner.state;
    if (!s.rt || !s.win) return;
    const selected = s.selected && s.selected.elem.isConnected ? BasicDesigner.movableOf(s.selected) : null;
    const place = BasicDesigner.placeForNew(selected);
    if (!place.container._isFlex) {
        const isNextToSelected = selected && selected.containerBox === place.container;
        place.point = (isNextToSelected)
            ? { x: BasicDesigner.distanceFrom(selected, "left") + BasicDesigner.COPY_OFFSET, y: BasicDesigner.distanceFrom(selected, "top") + BasicDesigner.COPY_OFFSET }
            : snap.point;
    }
    const copy = BasicDesigner.addSnapshot(snap, place);
    // WHY again: the objects in it were added after it, and each add selects the last one
    if (copy) BasicDesigner.afterPlaceChange(copy);
};

// *** THE PREVIEW OF A COLOR PICK: a swatch and its hex next to the mouse

BasicDesigner.PICK_PREVIEW_SPACE = 16; // px: from the mouse

BasicDesigner.showPickPreview = function (q) {
    const ui = BasicDesigner.ui;
    const C = BasicDesigner.colors;
    const color = BasicDesigner.colorAt(q.x, q.y, q.altKey);
    if (!ui.pickPreview) {
        ui.pickPreview = createIn(page, function () {
            const g = HGroup({ hug: 1, align: "left center", gap: 6, padding: [6, 4], color: C.menu, round: 6, border: 1, borderColor: C.line });
                g.swatch = Box({ width: 18, height: 18, round: 4, border: 1, borderColor: White(0.35) });
                g.lblHex = Label({ text: "", fontSize: 11, textColor: C.text });
            endGroup();
            g.css = { position: "fixed", zIndex: "9000", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)" };
            g.clickable = 0;
            return g;
        });
    }
    const preview = ui.pickPreview;
    preview.visible = (color) ? 1 : 0;
    if (!color) return;
    preview.swatch.color = color;
    preview.lblHex.text = color + ((q.altKey) ? " · text" : "");
    preview.left = q.clientX + BasicDesigner.PICK_PREVIEW_SPACE;
    preview.top = q.clientY + BasicDesigner.PICK_PREVIEW_SPACE;
};

BasicDesigner.hidePickPreview = function () {
    const preview = BasicDesigner.ui.pickPreview;
    if (preview) preview.visible = 0;
};

// The menu of the browser (Back, Reload, Inspect...) is not shown in the designer: a right click opens our menu or
// nothing. A text field keeps it (cut, copy, paste). (preventDefault only: the menus of the page still open.)
BasicDesigner.stopBrowserMenu = function (event) {
    const el = event.target;
    const isTextField = el && (el.isContentEditable || /^(INPUT|TEXTAREA)$/.test(el.tagName));
    if (!isTextField) event.preventDefault();
};

// *** THE MENU OF AN OBJECT: a right click on the canvas or on a row of the layers (comp/context-menu.js)

BasicDesigner.TEXT_TYPES = ["label", "button", "textbox"];

// The icons of the menu (16 x 16 lines; ContextMenu draws them in the color of the text)
BasicDesigner.OBJECT_MENU_ICONS = {
    duplicate: "M5.5 5.5h7v7h-7zM10.5 5.5v-3h-8v8h3",
    copy: "M6 6h7v7H6zM10 6V3H3v7h3",
    paste: "M5.5 3.5h-2v10h9v-10h-2M6 2.5h4v2H6z",
    editText: "M3 4.5V3h10v1.5M8 3v10M6.5 13h3",
    moveUp: "M8 13V3M4.5 6.5L8 3l3.5 3.5",
    moveDown: "M8 3v10M4.5 9.5L8 13l3.5-3.5",
    front: "M3 2.5h10M8 14V5.5M4.8 8.7L8 5.5l3.2 3.2",
    back: "M3 13.5h10M8 2v8.5M4.8 7.3L8 10.5l3.2-3.2",
    openCode: "M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5",
    delete: "M2.5 4.5h11M6.5 4.5V3h3v1.5M4 4.5l.7 8.5h6.6l.7-8.5",
};

BasicDesigner.objectMenuIcon = function (key) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="' + BasicDesigner.OBJECT_MENU_ICONS[key] + '"/></svg>';
};

BasicDesigner.objectMenuItems = function (obj) {
    const canReorder = BasicDesigner.canReorder(obj);
    const can = BasicDesigner.objectActionsOf(obj);
    const isText = BasicDesigner.TEXT_TYPES.indexOf(obj._type) !== -1;
    const canCopy = (BasicDesigner.canCopy(obj)) ? 1 : 0;
    return [
        { text: "Duplicate · ⌘D", key: "duplicate", enabled: canCopy },
        { text: "Copy · ⌘C", key: "copy", enabled: canCopy },
        { text: BasicDesigner.pasteMenuText(obj), key: "paste" },
        "-",
        { text: "Edit the text · double click", key: "editText", enabled: (isText) ? 1 : 0 },
        "-",
        { text: "Move up in the layers", key: "moveUp", enabled: (canReorder && BasicDesigner.previousObject(obj)) ? 1 : 0 },
        { text: "Move down in the layers", key: "moveDown", enabled: (canReorder && BasicDesigner.nextObject(obj)) ? 1 : 0 },
        { text: "Bring to front · ]", key: "front", enabled: (can.front) ? 1 : 0 },
        { text: "Send to back · [", key: "back", enabled: (can.back) ? 1 : 0 },
        "-",
        { text: "Open the code · Enter", key: "openCode" },
        { text: "Delete · ⌫", key: "delete" },
    ].map(BasicDesigner.withMenuIcon);
};

// An item of the menu with its icon ("-" stays a line)
BasicDesigner.withMenuIcon = function (item) {
    if (typeof item === "string") return item;
    return Object.assign({ icon: BasicDesigner.objectMenuIcon(item.key) }, item);
};

BasicDesigner.onObjectMenu = function (key, obj) {
    if (key === "paste") {
        BasicDesigner.pasteFromMenu();
        return;
    }
    if (!obj || obj._isRemoved || !obj.elem.isConnected) return;
    if (key === "copy") BasicDesigner.copyObject(obj);
    const container = obj.containerBox;
    if (key === "duplicate") BasicDesigner.duplicateObject(obj);
    if (key === "editText") BasicDesigner.editTextInPlace(obj);
    if (key === "moveUp") BasicDesigner.moveObject(obj, { container: container, before: BasicDesigner.previousObject(obj) });
    if (key === "moveDown") BasicDesigner.moveObject(obj, { container: container, before: BasicDesigner.nextObject(BasicDesigner.nextObject(obj)) });
    if (key === "front") BasicDesigner.bringToFront(obj);
    if (key === "back") BasicDesigner.sendToBack(obj);
    if (key === "openCode") BasicDesigner.openInEditor(BasicDesigner.nameFrame(obj));
    if (key === "delete") BasicDesigner.deleteObject(obj);
};

// Selects the object and opens its menu at the mouse (x, y: the window of the designer)
BasicDesigner.openObjectMenu = function (obj, x, y, from) {
    const ui = BasicDesigner.ui;
    const movable = obj && BasicDesigner.movableOf(obj);
    if (typeof ContextMenu === "undefined") return;
    // An empty place: only Paste (into the page; the clipboard may hold a copy of another page)
    BasicDesigner.select(movable || null, from);
    if (!ui.objectMenu) {
        ui.objectMenu = createIn(page, function () {
            return ContextMenu({
                styleName: "dark",
                minWidth: 220,
                onClick: function (self, item) { BasicDesigner.onObjectMenu(item.key, self.source); },
            });
        });
    }
    ui.objectMenu.setItems((movable) ? BasicDesigner.objectMenuItems(movable) : [BasicDesigner.withMenuIcon({ text: BasicDesigner.pasteMenuText(null), key: "paste" })]);
    ui.objectMenu.openAt(x, y, movable);
};

// *** VIEW:

// The style of the properties panel (comp/property-panel.js) in the colors of the theme.
BasicDesigner.panelStyle = function () {
    const C = BasicDesigner.colors;
    return {
        // WHY: headerHeight: the top of the panel lines up with the top bar. paddingRight: the same space as at the left
        //      (the panel is 8 px wider for it: rightWidth).
        panel: { headerHeight: BasicDesigner.config.topHeight, paddingRight: 16, color: C.bar, dividerColor: C.line },
        text: { softColor: C.soft, disabledColor: C.dim },
        field: { color: C.field, hoverBorderColor: C.fieldBorder, focusBorderColor: C.accent },
        segmented: { selectedColor: C.bar, selectedBorderColor: C.fieldBorderStrong, hoverColor: C.fieldHover },
        button: { hoverColor: C.field, activeColor: C.selectedRow, activeIconColor: C.accentLight },
        accent: { color: C.accent },
        menu: { color: C.menu, borderColor: C.line, hoverColor: C.accent },
        alignGrid: { selectedColor: C.accent },
        empty: { iconColor: C.soft, iconBoxColor: C.field },
    };
};

// The style of the layers (comp/tree-view.js, the "dark" package) in the colors of the theme.
BasicDesigner.treeStyle = function () {
    const C = BasicDesigner.colors;
    return {
        box: { color: C.bar, padding: [4, 2] },
        rowHover: { color: C.hover },
        rowSelected: { color: C.selectedRow },
        rowFocus: { outlineColor: C.accent },
        arrow: { color: C.soft },
        tag: { textColor: C.soft, fontSize: 11 },
        note: { textColor: C.dim, fontSize: 11 },
        empty: { textColor: C.dim },
    };
};

BasicDesigner.build = function () {

    const cfg = BasicDesigner.config;
    const C = BasicDesigner.colors;
    const ui = BasicDesigner.ui = {};

    page.color = C.canvas;

    // TOP BAR
    BasicDesigner.buildTopBar();

    // LEFT: Layers (top) and Changes (bottom)
    startBox(0, cfg.topHeight, cfg.leftWidth, "calc(100% - " + cfg.topHeight + "px)", { color: C.bar });
        that.elem.style.borderRight = "1px solid " + C.line;

        // GROUP: Header of the layers in one line (G-005): the title, the number of objects, the search,
        // collapse / expand
        const layersHeader = HGroup(12, 4, cfg.leftWidth - 18, 28, { align: "left center", gap: 6, color: "transparent" });
            Label({ text: "Layers", fontSize: 12, textColor: C.text, fontFamily: "opensans-bold" });
            ui.lblLayerCount = Label({ text: "", fontSize: 11, textColor: C.dim });

            // INPUT: Search in the layers
            ui.inpFilter = Input({ height: 24, fontSize: 12, color: C.field, textColor: C.text, border: 1, borderColor: C.fieldBorder, round: 5, placeholder: "Search" });
            ui.inpFilter.grow = 1;
            ui.inpFilter.css = { minWidth: "0px", width: "auto", marginLeft: "4px" };
            ui.inpFilter.elem.title = "Search in the layers (Escape: clear) · a double click on a row renames it, Enter opens its code";

            BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.collapseAll, name: "Collapse all", description: "Close every row.", size: 24, iconSize: 14, onClick: BasicDesigner.collapseAll });
            BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.expandAll, name: "Expand all", description: "Open the boxes and the groups (not the insides of the components).", size: 24, iconSize: 14, onClick: BasicDesigner.expandAll });
        endGroup();
        layersHeader.clipContent = 0;

        ui.inpFilter.inputElement.style.padding = "0px 8px";
        ui.inpFilter.inputElement.addEventListener("input", function () { BasicDesigner.setFilter(ui.inpFilter.inputElement.value); });
        ui.inpFilter.inputElement.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") return;
            ui.inpFilter.inputElement.value = "";
            BasicDesigner.setFilter("");
        });

        BasicDesigner.buildPageRow(BasicDesigner.LAYERS_TOP);

        // TREE: Layers (comp/tree-view.js)
        ui.tree = TreeView({
            styleName: "dark",
            left: 0,
            top: BasicDesigner.LAYERS_TOP + BasicDesigner.PAGE_ROW_HEIGHT,
            width: "100%",
            height: "calc(" + BasicDesigner.layersBottom() + " - " + (BasicDesigner.LAYERS_TOP + BasicDesigner.PAGE_ROW_HEIGHT) + "px)",
            typeAhead: 0, // WHY: V and I are the keys of the modes.
            toggleOnDoubleClick: 0, // WHY: a double click renames the row (a group does not open / close then)
            ariaLabel: "Layers",
            style: BasicDesigner.treeStyle(),
            onSelect: function (self, node) { BasicDesigner.select(BasicDesigner.objectOfKey(node.key), "tree"); },
            // A double click: its name, in place. Enter: the code.
            onActivate: function (self, node, event) {
                const obj = BasicDesigner.objectOfKey(node.key);
                if (!obj) return;
                if (event && event.type === "dblclick") BasicDesigner.renameInLayers(obj);
                else BasicDesigner.openInEditor(BasicDesigner.nameFrame(obj));
            },
            onHover: function (self, node) {
                BasicDesigner.setHover(node ? BasicDesigner.objectOfKey(node.key) : null);
                BasicDesigner.showEye(node);
            },
            onToggle: function (self, node) {
                const id = Number(node.key);
                if (node.expanded) BasicDesigner.state.expanded.add(id); else BasicDesigner.state.expanded.delete(id);
            },
        });

        BasicDesigner.buildTreeTrash();

        ui.changesPanel = startBox(0, "60%", "100%", "40%", { color: "transparent" });
            that.css = { borderTop: "1px solid " + C.line };

            ui.lblChanges = Label(12, 10, { text: "Changes", fontSize: 12, textColor: C.text, fontFamily: "opensans-bold" });
            ui.btnCollapseChanges = BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.chevron, name: "Make Changes small", description: "One line with the number of the changes: more room for the layers.", size: 24, iconSize: 14, onClick: function () { BasicDesigner.setChangesSmall(true); } });
            ui.btnCollapseChanges.props({ left: "calc(100% - 32px)", top: 6 });

            ui.changesBox = startBox(0, 34, "100%", "calc(100% - 78px)", { color: "transparent", scrollY: 1 });
            endBox();
            if (typeof ScrollBar !== "undefined") ScrollBar({ scrollableBox: ui.changesBox, bar_color: "#888888" });

            HGroup(0, 0, "100%", 44, { align: "left center", gap: 6, padding: [8, 0], color: "transparent" });
                that.top = "calc(100% - 44px)";
                if (BasicDesigner.isInVSCode) ui.btnSend = BasicDesigner.sendButton(true);
                else ui.btnCopy = BasicDesigner.copyButton(true);
                ui.btnRevertAll = BasicDesigner.toolButton("Revert all", BasicDesigner.revertAll, { color: C.field });
            endGroup();
        endBox();

        BasicDesigner.buildChangesBar();
    endBox();

    // CENTER: The page
    startBox(cfg.leftWidth, cfg.topHeight, "calc(100% - " + (cfg.leftWidth + cfg.rightWidth) + "px)", "calc(100% - " + (cfg.topHeight + cfg.statusHeight) + "px)", { color: C.canvas });

        ui.frameBox = startBox(12, 12, "calc(100% - 24px)", "calc(100% - 24px)", { color: "#FFFFFF" });
            that.elem.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)";

            const iframe = document.createElement("iframe");
            iframe.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;border:0;pointer-events:auto;background:#FFFFFF";
            ui.frameBox.elem.appendChild(iframe);
            ui.iframe = iframe;

            ui.hoverRect = Box(0, 0, 0, 0, { color: "transparent", visible: 0 });
            that.elem.style.boxShadow = "inset 0 0 0 1px " + C.accent;

            ui.selRect = Box(0, 0, 0, 0, { color: "transparent", visible: 0 });
            that.elem.style.boxShadow = "inset 0 0 0 2px " + C.accent;

            ui.selTag = Label({ text: "", fontSize: 11, textColor: "#FFFFFF", color: C.accent, round: 3, visible: 0 });
            that.elem.style.padding = "1px 6px";
            that.elem.style.whiteSpace = "nowrap";
            that.elem.style.lineHeight = "16px";

            // COVER: In Select mode it takes the mouse instead of the page.
            ui.cover = Box(0, 0, "100%", "100%", { color: "transparent" });
            ui.cover.clickable = 1;
            ui.cover.elem.style.cursor = "default";
        endBox();

        BasicDesigner.buildToolbox();
        BasicDesigner.buildTrash();
        BasicDesigner.buildSessionBar();

    endBox();

    // STATUS BAR
    HGroup(cfg.leftWidth, 0, "calc(100% - " + (cfg.leftWidth + cfg.rightWidth) + "px)", cfg.statusHeight, { align: "left center", gap: 8, padding: [12, 0], color: C.bar });
        that.top = "calc(100% - " + cfg.statusHeight + "px)";
        that.elem.style.borderTop = "1px solid " + C.line;
        ui.lblStatus = Label({ text: "", fontSize: 11, textColor: C.soft });
        ui.lblStatus.ellipsis = 1;
        ui.lblStatus.grow = 1;
        ui.lblStatus.css = { flexBasis: "0px", minWidth: "0px" };
        ui.lblStatus.clickable = 1; // WHY: The title (the whole text) and the links need the mouse.
    endGroup();
    ui.lblStatus.on("click", function (self, event) {
        const link = event.target.closest("[data-frame]");
        if (!link) return;
        BasicDesigner.openInEditor(BasicDesigner.statusFrames[Number(link.getAttribute("data-frame"))]);
    });

    // RIGHT: Properties
    ui.panel = PropertyPanel({
        width: cfg.rightWidth,
        style: BasicDesigner.panelStyle(),
        data: { headerTitle: "Properties", empty: BasicDesigner.NO_SELECTION },
        onChange: function (change) { BasicDesigner.onPropertyChange(change); },
        palettes: function () { return BasicDesigner.colorPalettes(); },
        recentColorsKey: "basic-designer-recent-colors",
        pickColor: BasicDesigner.pickColor,
    });

    // RIGHT: The parameters of a component (over the panel, when a component is selected)
    ui.paramsView = startBox(0, 0, cfg.rightWidth, "100%", { color: C.bar });
        that.left = "calc(100% - " + cfg.rightWidth + "px)";
        that.elem.style.borderLeft = "1px solid " + C.line;

        // GROUP: Header (the name, open the code), as the header of the panel
        const paramsHeader = HGroup(0, 0, "100%", cfg.topHeight, { align: "left center", gap: 2, padding: [8, 0], color: "transparent" });
        paramsHeader.css = { borderBottom: "1px solid " + C.line };
            ui.lblParamsTitle = Label({ text: "", fontSize: 13, textColor: C.text, fontFamily: "opensans-bold", ellipsis: 1 });
            ui.lblParamsTitle.grow = 1;
            ui.lblParamsTitle.css = { minWidth: "0px", paddingLeft: "6px" };
            BasicDesigner.iconButton({ path: BasicDesigner.TOP_ICONS.code, name: "Open the code", description: "The line that uses the component, in VS Code (Enter).", size: 26, iconSize: 16,
                onClick: function () { BasicDesigner.openInEditor(BasicDesigner.nameFrame(BasicDesigner.state.selected)); } });
        endGroup();

        // GROUP: Parameters | Box (as at the top of the Box view)
        BasicDesigner.inspectSwitch(16, cfg.topHeight + 12, cfg.rightWidth - 32);

        // GROUP: Name (the same name as the Name of the Box view)
        HGroup(16, cfg.topHeight + 48, cfg.rightWidth - 32, 26, { align: "left center", gap: 8, color: "transparent" });
            Label({ text: "Name", fontSize: 11, textColor: C.soft });
            ui.paramsName = Input({ height: 26, fontSize: 12, color: C.field, textColor: C.text, border: 0, round: 5, placeholder: "No name in the code" });
            ui.paramsName.grow = 1;
            ui.paramsName.css = { minWidth: "0px", width: "auto" };
            ui.paramsName.inputElement.style.padding = "0px 8px";
            ui.paramsName.inputElement.setAttribute("aria-label", "Name of the object");
        endGroup();
        BasicDesigner.connectNameInput(ui.paramsName, function () { return BasicDesigner.state.selected; });

        BasicDesigner.buildParamFilter(16, cfg.topHeight + 82, cfg.rightWidth - 32); // param-editors.js

        Label(16, cfg.topHeight + 114, { text: "A name opens its editor · • back to default", fontSize: 11, textColor: C.dim });

        const paramsTop = cfg.topHeight + 136;
        const noteHeight = BasicDesigner.NOTE_AREA_HEIGHT;
        ui.paramsList = startBox(0, paramsTop, "100%", "calc(100% - " + paramsTop + "px - " + noteHeight + "px)", { color: "transparent", scrollY: 1 });
        endBox();
        if (typeof ScrollBar !== "undefined") ui.paramsScrollBar = ScrollBar({ scrollableBox: ui.paramsList, bar_color: "#888888", neverHide: 0, showDots: 0 });

        // NOTE for the AI (the same notes as the Box tab, the same look as its field)
        startBox(0, 0, "100%", noteHeight, { color: "transparent" });
            that.top = "calc(100% - " + noteHeight + "px)";
            that.css = { borderTop: "1px solid " + C.line };
            ui.paramsNote = BasicDesigner.noteField(16, 10, cfg.rightWidth - 32, "Ex: the tabs need more air");
        endBox();

    endBox();
    ui.paramsView.visible = 0;

    // EVENTS: The cover
    let pendingMove = null;
    const pointOf = function (event) {
        const r = ui.frameBox.elem.getBoundingClientRect();
        return { x: event.clientX - r.left, y: event.clientY - r.top };
    };
    ui.cover.on("mousemove", function (self, event) {
        const p = pointOf(event);
        p.clientX = event.clientX;
        p.clientY = event.clientY;
        p.altKey = event.altKey;
        if (pendingMove) { pendingMove = p; return; }
        pendingMove = p;
        requestAnimationFrame(function () {
            const q = pendingMove;
            pendingMove = null;
            BasicDesigner.setHover(BasicDesigner.hitTest(q.x, q.y));
            if (BasicDesigner.colorPick) BasicDesigner.showPickPreview(q);
        });
    });
    ui.cover.on("mouseleave", function () {
        BasicDesigner.setHover(null);
        BasicDesigner.hidePickPreview();
    });
    // A color pick takes the click: no selection, no drag (capture: before the other listeners of the cover)
    let isPickClick = false;
    ui.cover.elem.addEventListener("pointerdown", function (event) {
        if (!BasicDesigner.colorPick || event.button !== 0) return;
        event.stopImmediatePropagation();
        event.preventDefault();
        isPickClick = true;
        const p = pointOf(event);
        const color = BasicDesigner.colorAt(p.x, p.y, event.altKey);
        BasicDesigner.endColorPick(color);
        BasicDesigner.setStatus((color) ? "Picked " + color : "No color here.");
    }, true);
    ui.cover.elem.addEventListener("click", function (event) {
        if (!isPickClick) return;
        isPickClick = false;
        event.stopImmediatePropagation();
    }, true);
    // Right click: the menu of the object under the mouse
    ui.cover.elem.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        if (BasicDesigner.colorPick) return;
        const p = pointOf(event);
        BasicDesigner.openObjectMenu(BasicDesigner.hitTest(p.x, p.y), event.clientX, event.clientY, "canvas");
    });
    ui.cover.on("click", function (self, event) {
        if (BasicDesigner.wasDragging()) return;
        const p = pointOf(event);
        BasicDesigner.select(BasicDesigner.hitTest(p.x, p.y), "canvas");
    });
    // Double click: the text of a Label / Button / Input is written in its place. Alt + double click: the code.
    ui.cover.on("dblclick", function (self, event) {
        const s = BasicDesigner.state;
        if (!s.selected) return;
        const isText = ["label", "button", "textbox"].indexOf(s.selected._type) !== -1;
        if (isText && !event.altKey) BasicDesigner.editTextInPlace(s.selected);
        else BasicDesigner.openInEditor(BasicDesigner.nameFrame(s.selected));
    });
    // WHY: The cover is over the page: the wheel scrolls the box under the mouse by hand.
    BasicDesigner.buildDragView();
    BasicDesigner.buildEyeButton();
    BasicDesigner.buildHandles();
    BasicDesigner.buildMeasureView();
    BasicDesigner.bindDragSources();

    ui.cover.elem.addEventListener("wheel", function (event) {
        const s = BasicDesigner.state;
        if (!s.win) return;
        const p = pointOf(event);
        const hit = BasicDesigner.hitTest(p.x, p.y);
        let el = hit ? hit.elem : null;
        while (el && el !== s.win.document.body) {
            const cs = s.win.getComputedStyle(el);
            const canY = /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight;
            const canX = /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth;
            if ((canY && event.deltaY) || (canX && event.deltaX)) {
                el.scrollTop += event.deltaY;
                el.scrollLeft += event.deltaX;
                event.preventDefault();
                return;
            }
            el = el.parentElement;
        }
    }, { passive: false });

    document.addEventListener("keydown", BasicDesigner.onKey);
    document.addEventListener("keydown", BasicDesigner.onAltKey);
    document.addEventListener("keyup", BasicDesigner.onAltKey);
    document.addEventListener("contextmenu", BasicDesigner.stopBrowserMenu, true);
    document.addEventListener("copy", BasicDesigner.onCopyEvent);
    document.addEventListener("paste", BasicDesigner.onPasteEvent);
    window.addEventListener("blur", function () { BasicDesigner.state.isAltDown = false; });

    BasicDesigner.setMode("select");
    BasicDesigner.setDevice("full");
    BasicDesigner.refreshChanges();
    BasicDesigner.showProperties(null);

    const pagePath = new URL(location.href).searchParams.get("page") || cfg.defaultPage;
    BasicDesigner.load(pagePath);
    BasicDesigner.restoreFolder(); // WHY: Not awaited: the page does not wait for the list of a folder.

};
