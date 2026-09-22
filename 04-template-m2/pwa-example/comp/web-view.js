/* Bismillah */

/*

WebView - v26.09

UI COMPONENT TEMPLATE
- A box that shows a web page or an HTML text in an iframe. The new version of comp-m1/ui-web-view.js.
- load(url), loadHtml(html) (srcdoc), reload(), clear(). The iframe always fills the box (also with width: "100%").
- Loading overlay (spinner) until the page is ready, a placeholder text when nothing is loaded, and showError(text)
  for your own error messages. A same origin URL that fails (404, missing file) calls onError. Other origins can not be
  checked by the browser; loadTimeout -> onTimeout helps for pages that never load.
- Messages: postMessage(data) sends to the page, onMessage(self, data, event) gets the messages of the page.
  Only the messages of this iframe are delivered. (Ex: modules in js-admin-panel)
- Same origin pages: getWindow(), getDocument(), autoHeight: 1 (the box grows with the page).
- scale: 0.5 -> A scaled preview of the page (Ex: a desktop page in a small card).
- interactive: 0 -> A transparent cover over the page: the visitor can not click it, the box gets the clicks. (Previews)
- toolbar: 1 -> A small bar with the URL, reload and "open in a new tab" buttons.
- sandbox / allow / referrerPolicy / loading attributes of the iframe can be set with params.
- remove() removes the message listener and unloads the page.

USAGE:
const view = WebView({ width: "100%", height: 400, url: "module1/index.htm", onLoad: (self) => println("ready") });
view.load("https://example.com");
view.loadHtml("<h1>Hello</h1>");
view.postMessage({ type: "theme", value: "dark" });
WebView({ url: "page.htm", onMessage: (self, data) => println(data.type) });
WebView({ url: "page.htm", scale: 0.5, interactive: 0, onClick: (self) => go("page.htm") });

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

"use strict";

// Default values:
const WebViewDefaults = {
    key: "0",
    width: 400,
    height: 300,
    url: "", // "": Nothing is loaded (placeholder is shown)
    htmlText: "", // HTML text instead of a URL (srcdoc). NOTE: Not "html": that is the innerHTML setter of a basic.js Box.
    title: "Web view", // iframe title (accessibility)
    sandbox: null, // null: No sandbox. Ex: "allow-scripts allow-same-origin allow-forms allow-popups"
    allow: "", // Ex: "fullscreen; clipboard-write"
    referrerPolicy: "", // Ex: "no-referrer"
    lazy: 0, // 1: The browser loads the page when the box is near the screen. (loading="lazy")
    scale: 1, // 0.5: The page is shown at half size (scaled preview). NOTE: Not "zoom": basic.js uses it for the page.
    interactive: 1, // 0: The page can not be clicked or scrolled. (Preview)
    autoHeight: 0, // 1: The box height follows the page height. (Same origin pages only)
    toolbar: 0, // 1: A bar with the URL, reload and "open in a new tab" buttons (Only at create time)
    showLoading: 1, // 1: Spinner until the page is loaded
    placeholderText: "No page", // Shown when nothing is loaded
    loadTimeout: 0, // Seconds. 0: No timeout. Ex: 15 -> onTimeout is called when the page is not loaded in 15 seconds.
    onLoad: function (self) { },
    onError: function (self) { }, // Same origin URL that could not be loaded (the browser shows its error page)
    onTimeout: function (self) { },
    onMessage: function (self, data, event) { }, // Messages from the page (window.parent.postMessage)
    onClick: function (self) { }, // interactive: 0 -> click on the cover
    style: {
        box: {
            color: White(1),
            border: 1,
            borderColor: Black(0.12),
            round: 8,
        },
        loading: {
            color: White(0.85), // Cover color while loading
            spinnerColor: "#141414",
            spinnerSize: 28,
        },
        placeholder: {
            color: Black(0.03),
            fontSize: 14,
            textColor: Black(0.4),
        },
        error: {
            color: White(0.95),
            fontSize: 14,
            textColor: "#D64545",
        },
        toolbar: {
            height: 36,
            color: Black(0.04),
            borderColor: Black(0.08),
            fontSize: 12,
            textColor: Black(0.55),
            iconColor: Black(0.55),
            iconHoverColor: "#141414",
        },
    }
};

const WebView = function (params = {}) {

    // Merge params:
    mergeIntoIfMissing(params, WebViewDefaults);

    // Edit params, if needed:
    const _bs = params.style.box;
    params.color = _bs.color;
    params.border = _bs.border;
    params.borderColor = _bs.borderColor;
    params.round = _bs.round;
    const startUrl = params.url;
    const startHtml = params.htmlText;
    params.url = "";
    params.htmlText = "";

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    const _s = box.style;
    let iframe = null;
    let isLoading = 0;
    let loadTimer = null;
    let heightObserver = null;
    let heightTimer = null;
    let toolbarHeight = 0;

    // *** PUBLIC VARIABLES:
    box.isLoaded = 0; // [var] 1 after the current page is loaded
    // NOTE: Default values are also public variables. (box.url, box.htmlText, box.scale, box.interactive)

    // *** PRIVATE FUNCTIONS:

    const applyScale = function () {
        const zoom = (box.scale > 0) ? box.scale : 1;
        const percent = Math.round(100 / zoom * 1000) / 1000;
        iframe.style.width = percent + "%";
        iframe.style.height = percent + "%";
        iframe.style.transform = (zoom === 1) ? "" : "scale(" + zoom + ")";
        iframe.style.transformOrigin = "0 0";
    };

    const applyInteractive = function () {
        box.cover.visible = (box.interactive == 1) ? 0 : 1;
        iframe.style.pointerEvents = (box.interactive == 1) ? "auto" : "none";
        iframe.setAttribute("tabindex", (box.interactive == 1) ? "0" : "-1");
    };

    const setLoading = function (loading) {
        isLoading = loading;
        box.loadingBox.visible = (loading && box.showLoading == 1) ? 1 : 0;
        clearTimeout(loadTimer);
        if (loading && box.loadTimeout > 0) {
            loadTimer = setTimeout(function () {
                if (!box || !isLoading) return;
                setLoading(0);
                box.onTimeout(box);
            }, box.loadTimeout * 1000);
        }
    };

    const updatePlaceholder = function () {
        box.placeholderBox.visible = (!box.url && !box.htmlText) ? 1 : 0;
    };

    const updateToolbar = function () {
        if (!box.toolbarBox) return;
        box.lblUrl.text = WebView.escapeHtml((box.htmlText) ? "(HTML)" : (box.url || ""));
        box.lblUrl.elem.title = box.url || "";
        box.btnOpen.visible = (box.url) ? 1 : 0;
        box.btnReload.visible = (box.url || box.htmlText) ? 1 : 0;
    };

    // Is the URL on the origin of this page? (Then its document can be read.)
    const isSameOrigin = function (url) {
        try {
            return new URL(url, location.href).origin === location.origin;
        } catch (error) {
            return false;
        }
    };

    const onIframeLoad = function () {
        if (!box) return;
        // WHY: Chrome fires "load" for about:blank too. Nothing is loaded then.
        if (!box.url && !box.htmlText) return;
        // WHY: A failed same origin page (404, missing file) also fires "load", with the error page of the browser. Its document can not be read.
        if (box.url && isSameOrigin(box.url) && !box.getDocument()) {
            setLoading(0);
            box.onError(box);
            return;
        }
        box.isLoaded = 1;
        setLoading(0);
        startHeightObserver();
        box.onLoad(box);
    };

    // Messages of this iframe only
    const onWindowMessage = function (event) {
        if (!box || !iframe || event.source !== iframe.contentWindow) return;
        box.onMessage(box, event.data, event);
    };

    // *** AUTO HEIGHT (same origin):

    const updateHeight = function () {
        if (!box || box.autoHeight != 1) return;
        const doc = box.getDocument();
        if (!doc || !doc.documentElement) return;
        const pageHeight = Math.max(doc.documentElement.scrollHeight, (doc.body) ? doc.body.scrollHeight : 0);
        const zoom = (box.scale > 0) ? box.scale : 1;
        const height = Math.ceil(pageHeight * zoom) + toolbarHeight + (_bs.border * 2);
        if (height > 0 && box.height !== height) box.height = height;
    };

    const startHeightObserver = function () {
        stopHeightObserver();
        if (box.autoHeight != 1) return;
        const doc = box.getDocument();
        if (!doc || !doc.documentElement || typeof ResizeObserver === "undefined") { updateHeight(); return; }
        heightObserver = new ResizeObserver(function () {
            heightTimer = waitAndRun(heightTimer, updateHeight, 30);
        });
        heightObserver.observe(doc.documentElement);
        if (doc.body) heightObserver.observe(doc.body);
        updateHeight();
    };

    const stopHeightObserver = function () {
        if (heightObserver) heightObserver.disconnect();
        heightObserver = null;
        clearTimeout(heightTimer);
    };

    // *** PUBLIC FUNCTIONS:

    box.load = function (url) {
        box.url = url || "";
        box.htmlText = "";
        box.isLoaded = 0;
        stopHeightObserver();
        box.hideError();
        iframe.removeAttribute("srcdoc");
        if (box.url) {
            setLoading(1);
            iframe.src = box.url;
        } else {
            setLoading(0);
            iframe.src = "about:blank";
        }
        updatePlaceholder();
        updateToolbar();
    };
    // USAGE: view.load("page.htm") or view.load("") to unload

    // HTML text as the page (srcdoc). Relative links in it are relative to this page.
    box.loadHtml = function (html) {
        box.htmlText = html || "";
        box.url = "";
        box.isLoaded = 0;
        stopHeightObserver();
        box.hideError();
        iframe.removeAttribute("src");
        if (box.htmlText) {
            setLoading(1);
            iframe.srcdoc = box.htmlText;
        } else {
            iframe.removeAttribute("srcdoc");
            iframe.src = "about:blank";
            setLoading(0);
        }
        updatePlaceholder();
        updateToolbar();
    };
    // USAGE: view.loadHtml("<h1>Hello</h1>")

    box.reload = function () {
        if (box.htmlText) box.loadHtml(box.htmlText);
        else if (box.url) box.load(box.url);
    };

    box.clear = function () {
        box.load("");
    };

    // Window of the page. (Cross origin: only postMessage can be used on it.)
    box.getWindow = function () {
        return iframe.contentWindow;
    };

    // Document of the page, or null when it is another origin.
    box.getDocument = function () {
        try {
            return iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document) || null;
        } catch (error) {
            return null;
        }
    };

    // Sends a message to the page. In the page: window.addEventListener("message", (event) => event.data)
    box.postMessage = function (data, targetOrigin = "*") {
        if (!iframe.contentWindow) return 0;
        iframe.contentWindow.postMessage(data, targetOrigin);
        return 1;
    };
    // USAGE: view.postMessage({ type: "theme", value: "dark" })

    box.getIframe = function () {
        return iframe;
    };

    box.setScale = function (scale) {
        box.scale = (Number(scale) > 0) ? Number(scale) : 1;
        applyScale();
        updateHeight();
    };
    // USAGE: view.setScale(0.5)

    box.setInteractive = function (interactive) {
        box.interactive = (interactive == 1 || interactive === true) ? 1 : 0;
        applyInteractive();
    };

    box.setAutoHeight = function (autoHeight) {
        box.autoHeight = (autoHeight == 1 || autoHeight === true) ? 1 : 0;
        if (box.autoHeight == 1 && box.isLoaded) startHeightObserver();
        else stopHeightObserver();
    };

    box.showError = function (text) {
        setLoading(0);
        box.lblError.text = WebView.escapeHtml(text || "The page could not be loaded.");
        box.errorBox.visible = 1;
    };
    // USAGE: view.showError("The module is not available.")

    box.hideError = function () {
        box.errorBox.visible = 0;
    };

    box.isLoadingPage = function () {
        return isLoading;
    };

    // WHY: box.superRemove is overwritten by a component that extends this one, so the local copy is called below.
    const superRemove = box.remove;
    box.superRemove = superRemove;
    box.remove = function () {
        if (!box) return; // WHY: remove() can be called twice (also by the parent's remove()).
        clearTimeout(loadTimer);
        stopHeightObserver();
        window.removeEventListener("message", onWindowMessage);
        iframe.removeEventListener("load", onIframeLoad);
        iframe.removeAttribute("srcdoc");
        iframe.src = "about:blank"; // WHY: Unload the page (stops its timers and sounds).
        superRemove.call(box); // NOTE: basic.js remove(). It cleans all the events and the objects inside.
        box = null;
    };

    // *** OBJECT VIEW:

    box.clipContent = 1;
    box.clickable = 1;

    // GROUP: Toolbar (optional) and page area
    box.contentBox = VGroup({ width: "100%", height: "100%", align: "left top", gap: 0, position: "relative" });
    box.contentBox.elem.style.alignItems = "stretch";

        if (box.toolbar == 1) {
            toolbarHeight = _s.toolbar.height;

            // GROUP: Toolbar
            box.toolbarBox = HGroup({ width: "100%", height: toolbarHeight, align: "left center", gap: 6, padding: [10, 0], color: _s.toolbar.color });
            box.toolbarBox.elem.style.flexShrink = "0";
            box.toolbarBox.elem.style.borderBottom = "1px solid " + _s.toolbar.borderColor;
            box.toolbarBox.elem.style.boxSizing = "border-box";

                // LABEL: URL
                box.lblUrl = Label({ text: "", fontSize: _s.toolbar.fontSize, textColor: _s.toolbar.textColor });
                box.lblUrl.elem.style.flex = "1 1 0";
                box.lblUrl.elem.style.minWidth = "0";
                box.lblUrl.elem.style.whiteSpace = "nowrap";
                box.lblUrl.elem.style.overflow = "hidden";
                box.lblUrl.elem.style.textOverflow = "ellipsis";
                box.lblUrl.elem.style.direction = "rtl"; // WHY: The end of a long URL is more useful than its start.
                box.lblUrl.elem.style.textAlign = "left";

                // LABEL: Reload
                box.btnReload = WebView.createIconButton(WebView.getReloadSvg(_s.toolbar.iconColor), "Reload", _s.toolbar);
                // LABEL: Open in a new tab
                box.btnOpen = WebView.createIconButton(WebView.getOpenSvg(_s.toolbar.iconColor), "Open in a new tab", _s.toolbar);

            endGroup();
        }

        // BOX: Page area (iframe, cover, overlays)
        box.pageBox = Box({ width: "100%", height: "auto", color: "transparent", position: "relative" });
        box.pageBox.elem.style.flex = "1 1 0";
        box.pageBox.elem.style.minHeight = "0";
        box.pageBox.elem.style.overflow = "hidden";

        // IFRAME:
        iframe = document.createElement("iframe");
        iframe.title = box.title;
        iframe.style.display = "block";
        iframe.style.border = "none";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.background = "transparent";
        if (box.sandbox !== null && box.sandbox !== undefined) iframe.setAttribute("sandbox", box.sandbox);
        if (box.allow) iframe.setAttribute("allow", box.allow);
        if (box.referrerPolicy) iframe.setAttribute("referrerpolicy", box.referrerPolicy);
        if (box.lazy == 1) iframe.setAttribute("loading", "lazy");
        box.pageBox.elem.appendChild(iframe);

        // WHY: The overlays are created in pageBox (a Box, not a group): they are absolute and cover the page.
        //      setDefaultContainerBox() is not in the start/end list, so it is set again after every endGroup().
        setDefaultContainerBox(box.pageBox);

        // BOX: Cover (interactive: 0)
        box.cover = Box(0, 0, "100%", "100%", { color: "transparent", clickable: 1, visible: 0 });
        box.cover.elem.style.cursor = "pointer";

        // GROUP: Placeholder
        box.placeholderBox = VGroup({ width: "100%", height: "100%", align: "center center", color: _s.placeholder.color, position: "absolute" });
        box.placeholderBox.elem.style.left = "0px";
        box.placeholderBox.elem.style.top = "0px";
            box.lblPlaceholder = Label({ text: WebView.escapeHtml(box.placeholderText), fontSize: _s.placeholder.fontSize, textColor: _s.placeholder.textColor });
        endGroup();

        // GROUP: Loading (spinner)
        setDefaultContainerBox(box.pageBox);
        box.loadingBox = VGroup({ width: "100%", height: "100%", align: "center center", color: _s.loading.color, position: "absolute" });
        box.loadingBox.elem.style.left = "0px";
        box.loadingBox.elem.style.top = "0px";
        box.loadingBox.elem.style.pointerEvents = "none";
            box.spinner = Box({ width: _s.loading.spinnerSize, height: _s.loading.spinnerSize, color: "transparent", round: 100 });
            box.spinner.elem.style.border = "3px solid " + Black(0.1);
            box.spinner.elem.style.borderTopColor = _s.loading.spinnerColor;
            box.spinner.elem.style.boxSizing = "border-box";
            box.spinner.elem.style.animation = "webViewSpin 0.8s linear infinite";
        endGroup();

        // GROUP: Error
        setDefaultContainerBox(box.pageBox);
        box.errorBox = VGroup({ width: "100%", height: "100%", align: "center center", padding: 20, color: _s.error.color, position: "absolute" });
        box.errorBox.elem.style.left = "0px";
        box.errorBox.elem.style.top = "0px";
            box.lblError = Label({ text: "", fontSize: _s.error.fontSize, textColor: _s.error.textColor, textAlign: "center" });
        endGroup();

    endGroup(); // contentBox
    // NOTE: endGroup() of contentBox returns the default container to the component box.

    box.loadingBox.visible = 0;
    box.errorBox.visible = 0;

    // *** OBJECT INIT CODE:
    WebView.injectCss();

    iframe.addEventListener("load", onIframeLoad);
    window.addEventListener("message", onWindowMessage);

    box.cover.on("click", function () { box.onClick(box); });
    if (box.toolbarBox) {
        box.btnReload.on("click", function () { box.reload(); });
        box.btnOpen.on("click", function () { if (box.url) window.open(box.url, "_blank", "noopener"); });
    }

    applyScale();
    applyInteractive();
    updatePlaceholder();
    updateToolbar();

    if (startHtml) box.loadHtml(startHtml);
    else if (startUrl) box.load(startUrl);

    return endObject(box);

};

// *** STATIC FUNCTIONS:

// WHY: Label.text uses innerHTML. Texts must not be read as HTML.
WebView.escapeHtml = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

// LABEL: Small icon button of the toolbar
WebView.createIconButton = function (svg, ariaLabel, style) {
    const btn = Label({ text: svg, width: 26, height: 26, round: 5, clickable: 1 });
    btn.elem.style.display = "flex";
    btn.elem.style.alignItems = "center";
    btn.elem.style.justifyContent = "center";
    btn.elem.style.lineHeight = "0";
    btn.elem.style.flexShrink = "0";
    btn.elem.style.cursor = "pointer";
    btn.elem.style.transition = "background-color 0.15s";
    btn.elem.setAttribute("role", "button");
    btn.elem.setAttribute("aria-label", ariaLabel);
    btn.elem.title = ariaLabel;
    btn.on("mouseenter", function () { btn.color = Black(0.06); btn.text = svg.replace(style.iconColor, style.iconHoverColor); });
    btn.on("mouseleave", function () { btn.color = "transparent"; btn.text = svg; });
    return btn;
};

WebView.getReloadSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg>';
};

WebView.getOpenSvg = function (color) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 13v6H5V6h6"/></svg>';
};

// The spinner animation can not be set with inline styles.
WebView.injectCss = function () {
    if (document.getElementById("web-view-css")) return;
    const style = document.createElement("style");
    style.id = "web-view-css";
    style.textContent = "@keyframes webViewSpin { to { transform: rotate(360deg); } }";
    document.head.appendChild(style);
};
