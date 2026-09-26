/* Bismillah */

/*

JS Components Website - Site Theme & UI Helpers - v26.09

- Renkler, ölçüler, ikonlar ve sayfa boyunca tekrar eden küçük arayüz parçaları.
- Colors, metrics, icons and the small UI pieces the site repeats.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const SITE = {

    // *** COLORS:
    INK: "#141414",             // Başlıklar, koyu düğmeler
    BG: "#F4F4F1",              // Sayfa zemini
    BG_SOFT: "#ECECE7",
    CARD: "#FFFFFF",
    LINE: "rgba(0, 0, 0, 0.09)",
    LINE_STRONG: "rgba(0, 0, 0, 0.16)",
    TEXT: "rgba(0, 0, 0, 0.82)",
    TEXT_SOFT: "rgba(0, 0, 0, 0.56)",
    TEXT_FAINT: "rgba(0, 0, 0, 0.38)",
    ACCENT: "#2F6FEB",          // Bağlantılar, seçili durum
    WARNING_BG: "#FFF4E0",
    WARNING_TEXT: "#8A5A00",

    // Kod paneli (koyu)
    CODE_BG: "#15171C",
    CODE_BAR: "#1C1F26",
    CODE_LINE: "rgba(255, 255, 255, 0.08)",
    CODE_TEXT: "#D6DAE0",
    CODE_SOFT: "rgba(255, 255, 255, 0.5)",

    // Kuşak (generation) rozetleri: [zemin, yazı]
    GENERATION_COLORS: {
        4: ["#E2F3E7", "#1F7A3D"],
        3: ["#ECE7FB", "#5B3FC4"],
        2: ["#E3EDFB", "#2459B5"],
        1: ["#ECECE7", "#6B6B66"],
    },

    BOLD: "opensans-bold",
    MONO: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",

    // *** STATE: (site.js doldurur)
    L: null,    // Ölçüler (metrics)
    T: null,    // Metinler (texts)
    lang: "en",

};

// *** METRICS:
// Ekran genişliğine göre bütün ölçüleri tek yerden üretir.
SITE.createMetrics = function () {

    const w = page.width;
    const mobile = (w < 700) ? 1 : 0;

    const gutter = mobile ? 16 : 32;
    const content = Math.min(1280, w - (gutter * 2));
    const gap = mobile ? 16 : 22;

    let columns = 4;
    if (content < 560) columns = 1;
    else if (content < 860) columns = 2;
    else if (content < 1160) columns = 3;

    const cardWidth = Math.floor((content - (gap * (columns - 1))) / columns);

    return {
        w: w,
        h: page.height,
        mobile: mobile,
        gutter: gutter,
        content: content,
        gap: gap,
        columns: columns,
        cardWidth: cardWidth,
        // WHY: Önizleme, sanal ekranın (previewWidth x previewHeight) oranını korur.
        previewHeight: Math.round(cardWidth * CONFIG.previewHeight / CONFIG.previewWidth),
        previewScale: cardWidth / CONFIG.previewWidth,
        split: (w >= CONFIG.splitBreakpoint) ? 1 : 0,

        h1: mobile ? 32 : (w < 1000 ? 42 : 52),
        h2: mobile ? 19 : 21,
        lead: mobile ? 16 : 18,
        body: 15,
        small: 13,
        tiny: 11,
    };

};

// *** URL:
// Deponun kökündeki bir dosyanın, bu sayfaya göre adresi.
SITE.rootUrl = function (path) {
    return CONFIG.rootPath + path;
};

// Dosya adresinden sadece adı. ("comp-m4/tabs.js" -> "tabs.js")
SITE.fileName = function (path) {
    return String(path).split("/").pop();
};

// *** ICONS: (Satır içi SVG, resim dosyası gerekmez.)
SITE.ICON_PATHS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    back: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    open: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 13v6H5V6h6"/>',
    reload: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    code: '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    github: '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/>',
};

SITE.svg = function (name, color = "currentColor", size = 18, strokeWidth = 2) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color
        + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" stroke-linejoin="round" style="display:block">' + SITE.ICON_PATHS[name] + '</svg>';
};

// *** TEXT PIECES:

// LABEL: Tek satır, genişliği içeriği kadar.
SITE.label = function (text, params = {}) {

    mergeIntoIfMissing(params, {
        fontSize: SITE.L.body,
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

// LABEL: Paragraf (satır kaydırır)
SITE.text = function (text, width = "100%", size = 0, color = "") {

    Label({
        text: text,
        width: width,
        fontSize: size || SITE.L.body,
        textColor: color || SITE.TEXT_SOFT,
    });
    that.elem.style.lineHeight = "1.6";

    return that;

};

// *** BUTTONS:

// GROUP: İkon ve/veya yazılı düğme.
// kind: "ghost" (kenarlıklı), "plain" (zeminsiz), "dark", "code" (koyu panel üzerinde)
// NOTE: Button yerine grup: Button içine nesne konulamaz.
SITE.button = function (params = {}) {

    mergeIntoIfMissing(params, {
        text: "",
        icon: "",
        kind: "ghost",
        height: 38,
        fontSize: 14,
        hint: "",
        onClick: function (self) { },
    });

    const colors = {
        ghost: { base: SITE.CARD, hover: SITE.BG, text: SITE.TEXT, border: SITE.LINE_STRONG },
        plain: { base: "transparent", hover: "rgba(0, 0, 0, 0.05)", text: SITE.TEXT, border: "" },
        dark: { base: SITE.INK, hover: "#2C2C2C", text: "#FFFFFF", border: "" },
        code: { base: "transparent", hover: "rgba(255, 255, 255, 0.08)", text: SITE.CODE_TEXT, border: "rgba(255, 255, 255, 0.14)" },
    }[params.kind];

    const btn = HGroup({
        width: "auto",
        height: params.height,
        align: "center center",
        gap: 8,
        padding: [params.text ? 14 : 0, 0],
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
            // LABEL: İkon
            btn.lblIcon = Label({ text: SITE.svg(params.icon, colors.text, 17), width: 17, height: 17 });
        }

        if (params.text) {
            // LABEL: Yazı
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

// LABEL: Kuşak rozeti (M1...M4)
SITE.generationChip = function (generation, small = 0) {

    const colors = SITE.GENERATION_COLORS[generation];

    Label({
        text: "M" + generation,
        width: "auto",
        height: "auto",
        fontSize: small ? 10 : 11,
        textColor: colors[1],
        color: colors[0],
        round: 100,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.padding = small ? "2px 7px" : "3px 9px";
    that.elem.style.letterSpacing = "0.5px";
    that.elem.style.whiteSpace = "nowrap";
    that.elem.style.flexShrink = "0";

    return that;

};

// LABEL: Kod gibi görünen küçük yazı (dosya adı)
SITE.mono = function (text, color = SITE.TEXT_FAINT, size = 12) {

    Label({
        text: basic.escapeHtml(text),
        width: "auto",
        fontSize: size,
        textColor: color,
    });
    that.elem.style.fontFamily = SITE.MONO;
    that.elem.style.whiteSpace = "nowrap";

    return that;

};

// BOX: Esnek boşluk (gruptaki kalan yeri doldurur)
SITE.spacer = function () {

    Box(0, 0, 1, 1, { color: "transparent" });
    that.elem.style.flex = "1 1 0";
    that.elem.style.minWidth = "0";

    return that;

};

// BOX: İnce ayırıcı çizgi
SITE.divider = function (vertical = 0, color = SITE.LINE) {

    if (vertical) Box(0, 0, 1, 22, { color: color });
    else Box(0, 0, "100%", 1, { color: color });
    that.elem.style.flexShrink = "0";

    return that;

};

// Kutuya kaydırma çubuğu ekler (scroll-bar.js yüklü değil ise sessizce geçer).
SITE.addScrollBar = function (scrollableBox, params = {}) {

    if (typeof ScrollBar !== "function") return null;

    params.scrollableBox = scrollableBox;
    return ScrollBar(params);

};
