/* Bismillah */

/*

basic.js Handbook Website - Site Theme & UI Helpers - v26.09

- Renkler, ölçüler, ikonlar ve sayfa boyunca tekrar eden küçük arayüz parçaları.
- Colors, metrics, icons and the small UI pieces the site repeats.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const SITE = {

    // *** COLORS:
    INK: "#141414",
    BG: "#FBFBF9",              // Sayfa (yazı) zemini
    SIDEBAR: "#F4F4F1",
    BG_SOFT: "#ECECE7",
    CARD: "#FFFFFF",
    LINE: "rgba(0, 0, 0, 0.09)",
    LINE_STRONG: "rgba(0, 0, 0, 0.16)",
    TEXT: "rgba(0, 0, 0, 0.82)",
    TEXT_SOFT: "rgba(0, 0, 0, 0.58)",
    TEXT_FAINT: "rgba(0, 0, 0, 0.4)",
    ACCENT: "#2F6FEB",
    ACCENT_SOFT: "#E8F0FE",
    NOTE_BG: "#F1F5FE",
    ERROR: "#D64545",

    // Kod blokları (koyu)
    CODE_BG: "#15171C",
    CODE_BAR: "#1C1F26",
    CODE_LINE: "rgba(255, 255, 255, 0.08)",
    CODE_TEXT: "#D6DAE0",
    CODE_SOFT: "rgba(255, 255, 255, 0.5)",
    RUN: "#2EA043",

    BOLD: "opensans-bold",
    MONO: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

    // *** STATE: (site.js doldurur)
    L: null,    // Ölçüler (metrics)
    T: null,    // Metinler (texts)
    lang: "en",

};

// *** METRICS:
SITE.createMetrics = function () {

    const w = page.width;
    const drawer = (w < CONFIG.drawerBreakpoint) ? 1 : 0;
    const toc = (w >= CONFIG.tocBreakpoint) ? 1 : 0;
    const mobile = (w < 640) ? 1 : 0;

    const contentWidth = drawer ? w : w - CONFIG.sidebarWidth;
    const pad = mobile ? 18 : 40;
    const tocSpace = toc ? CONFIG.tocWidth + 48 : 0;
    const article = Math.max(260, Math.min(CONFIG.articleMaxWidth, contentWidth - (pad * 2) - tocSpace));

    return {
        w: w,
        h: page.height,
        mobile: mobile,
        drawer: drawer,
        toc: toc,
        pad: pad,
        contentWidth: contentWidth,
        article: article,

        h1: mobile ? 30 : 38,
        h2: mobile ? 22 : 25,
        h3: mobile ? 17 : 19,
        body: mobile ? 15 : 16,
        small: 13,
    };

};

// *** ICONS: (Satır içi SVG, resim dosyası gerekmez.)
SITE.ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    reset: '<path d="M3 12a9 9 0 1 0 2.6-6.4"/><path d="M3 3v6h6"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
};

SITE.svg = function (name, color = "currentColor", size = 18, strokeWidth = 2) {
    const paths = SITE.ICON_PATHS[name].replace(/currentColor/g, color);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color
        + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + paths + '</svg>';
};

// LABEL: Ortalanmış ikon
SITE.icon = function (name, color, size = 18, strokeWidth = 2) {

    Label({ text: SITE.svg(name, color, size, strokeWidth), width: size, height: size });
    that.elem.style.flexShrink = "0";

    return that;

};

// *** TEXT PIECES:

// LABEL: Tek satır, genişliği içeriği kadar.
SITE.label = function (text, params = {}) {

    mergeIntoIfMissing(params, {
        fontSize: 15,
        textColor: SITE.TEXT,
        bold: 0,
        width: "auto",
    });

    Label({
        text: text,
        width: params.width,
        fontSize: params.fontSize,
        textColor: params.textColor,
    });
    if (params.bold) that.elem.style.fontFamily = SITE.BOLD;
    if (params.width == "auto") that.elem.style.whiteSpace = "nowrap";

    return that;

};

// *** BUTTONS:

// GROUP: İkon ve/veya yazılı düğme.
// kind: "ghost" (kenarlıklı), "plain" (zeminsiz), "code" (koyu zemin üzerinde), "run" (yeşil)
// NOTE: Button yerine grup: Button içine nesne konulamaz.
SITE.button = function (params = {}) {

    mergeIntoIfMissing(params, {
        text: "",
        icon: "",
        kind: "ghost",
        height: 36,
        fontSize: 13,
        hint: "",
        onClick: function (self) { },
    });

    const colors = {
        ghost: { base: SITE.CARD, hover: SITE.SIDEBAR, text: SITE.TEXT, border: SITE.LINE_STRONG },
        plain: { base: "transparent", hover: "rgba(0, 0, 0, 0.05)", text: SITE.TEXT, border: "" },
        code: { base: "transparent", hover: "rgba(255, 255, 255, 0.08)", text: SITE.CODE_TEXT, border: "rgba(255, 255, 255, 0.14)" },
        run: { base: SITE.RUN, hover: "#35B24C", text: "#FFFFFF", border: "" },
    }[params.kind];

    const btn = HGroup({
        width: "auto",
        height: params.height,
        align: "center center",
        gap: 7,
        padding: [params.text ? 12 : 0, 0],
        color: colors.base,
        round: 8,
    });
    btn.elem.style.flexShrink = "0";
    if (!params.text) btn.width = params.height;
    if (colors.border) {
        btn.border = 1;
        btn.borderColor = colors.border;
    }

        if (params.icon) {
            btn.lblIcon = SITE.icon(params.icon, colors.text, (params.icon == "play") ? 13 : 16);
        }

        if (params.text) {
            btn.lblText = Label({ text: params.text, fontSize: params.fontSize, textColor: colors.text });
            btn.lblText.elem.style.fontFamily = SITE.BOLD;
            btn.lblText.elem.style.whiteSpace = "nowrap";
        }

    endGroup();

    btn.elem.style.cursor = "pointer";
    btn.elem.setAttribute("role", "button");
    btn.elem.setAttribute("tabindex", "0");
    if (params.hint) {
        btn.elem.title = params.hint;
        btn.elem.setAttribute("aria-label", params.hint);
    }

    btn.setMotion("background-color 0.15s, transform 0.12s");
    btn.on("mouseenter", function () { btn.color = colors.hover; });
    btn.on("mouseleave", function () { btn.color = colors.base; btn.elem.style.transform = "scale(1)"; });
    btn.on("mousedown", function () { btn.elem.style.transform = "scale(0.96)"; });
    btn.on("mouseup", function () { btn.elem.style.transform = "scale(1)"; });
    btn.on("click", function () { params.onClick(btn); });
    btn.on("keydown", function (self, event) {
        if (event.key == "Enter" || event.key == " ") {
            event.preventDefault();
            params.onClick(btn);
        }
    });

    btn.setText = function (text) {
        if (btn.lblText) btn.lblText.text = text;
    };

    return btn;

};

// *** SMALL PIECES:

// BOX: Esnek boşluk (gruptaki kalan yeri doldurur)
SITE.spacer = function () {

    Box(0, 0, 1, 1, { color: "transparent" });
    that.elem.style.flex = "1 1 0";
    that.elem.style.minWidth = "0";

    return that;

};

// Kutuya kaydırma çubuğu ekler (scroll-bar.js yüklü değil ise sessizce geçer).
SITE.addScrollBar = function (scrollableBox, params = {}) {

    if (typeof ScrollBar !== "function") return null;

    params.scrollableBox = scrollableBox;
    return ScrollBar(params);

};

// *** DOCUMENT CSS:
// WHY: Markdown'dan gelen satır içi HTML (<code>, <a>, <ul>, <table>) Label içinde duruyor.
//      Bu etiketlerin görünümü satır içi stil ile verilemez; küçük bir stil, sadece .hb-text içinde geçerlidir.
SITE.injectCss = function () {

    if (document.getElementById("hb-site-css")) return;

    const css = ""
        + ".hb-text strong, .hb-text b { font-family: opensans-bold; font-weight: normal; color: " + SITE.INK + "; }"
        + ".hb-text em { font-style: italic; }"
        + ".hb-text code { font-family: " + SITE.MONO + "; font-size: 0.86em; background: rgba(0, 0, 0, 0.055);"
        + "  border-radius: 5px; padding: 1px 5px; color: #1F2328; white-space: break-spaces; }"
        + ".hb-text a { color: " + SITE.ACCENT + "; text-decoration: none; border-bottom: 1px solid rgba(47, 111, 235, 0.3); }"
        + ".hb-text a:hover { border-bottom-color: " + SITE.ACCENT + "; }"
        + ".hb-text a code { color: inherit; background: " + SITE.ACCENT_SOFT + "; }"
        + ".hb-text ul, .hb-text ol { margin: 0px; padding-left: 24px; }"
        + ".hb-text li { margin: 6px 0px; padding-left: 2px; }"
        + ".hb-text li::marker { color: " + SITE.TEXT_FAINT + "; }"
        + ".hb-text table { border-collapse: collapse; width: 100%; font-size: 0.94em; }"
        + ".hb-text th, .hb-text td { border: 1px solid " + SITE.LINE + "; padding: 8px 10px; text-align: left; vertical-align: top; }"
        + ".hb-text th { background: " + SITE.SIDEBAR + "; font-family: opensans-bold; font-weight: normal; }"
        + ".hb-heading code { font-size: 0.82em; }"
        + ".hb-flash { animation: hbFlash 1.4s ease-out; }"
        + "@keyframes hbFlash { 0% { background: rgba(47, 111, 235, 0.16); } 100% { background: transparent; } }"
        + "::selection { background: rgba(47, 111, 235, 0.22); }";

    const style = document.createElement("style");
    style.id = "hb-site-css";
    style.textContent = css;
    document.head.appendChild(style);

};
