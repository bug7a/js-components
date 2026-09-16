/* Bismillah */

/*

Web Admin Panel - Site Theme & UI Helpers - v26.09

- Renk paleti, ölçüler ve sayfa boyunca tekrar eden arayüz parçaları.
- Color palette, metrics and the small UI pieces the page repeats.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const SITE = {

    // *** COLORS:
    INK: "#0E1A14",          // En koyu zemin (hero, footer)
    INK_SOFT: "#16261D",     // Koyu zemin üzerindeki kartlar
    PRIMARY: "#2C5A38",      // Panelin ana rengi
    PRIMARY_DARK: "#1F4128",
    PRIMARY_LIGHT: "#65A293",
    MINT: "#E3EFE6",         // Açık vurgu zemini
    ACCENT: "#E5885E",       // Sıcak vurgu (az kullanılır)
    BG: "#F6F6F3",           // Sayfa zemini
    BG_SOFT: "#EFEFEA",
    CARD: "#FFFFFF",
    LINE: "rgba(0, 0, 0, 0.10)",
    LINE_SOFT: "rgba(0, 0, 0, 0.06)",
    TEXT: "rgba(0, 0, 0, 0.82)",
    TEXT_SOFT: "rgba(0, 0, 0, 0.55)",
    TEXT_FAINT: "rgba(0, 0, 0, 0.38)",
    ON_DARK: "rgba(255, 255, 255, 0.94)",
    ON_DARK_SOFT: "rgba(255, 255, 255, 0.62)",
    ON_DARK_FAINT: "rgba(255, 255, 255, 0.35)",
    ON_DARK_LINE: "rgba(255, 255, 255, 0.14)",
    WHITE: "#FFFFFF",

    BOLD: "opensans-bold",

    // *** STATE: (site.js doldurur)
    L: null,            // Ölçüler (metrics)
    T: null,            // Metinler (texts)
    lang: "tr",
    scrollBox: null,    // Kaydırılan ana kutu
    sections: {},       // { key: box }
    scrollTimer: null,  // Kaydırma animasyonu

};

// *** METRICS:
// Ekran genişliğine göre bütün ölçüleri tek yerden üretir.
SITE.createMetrics = function () {

    const w = page.width;
    const mobile = (w < 760) ? 1 : 0;
    const tablet = (!mobile && w < 1120) ? 1 : 0;
    const desktop = (!mobile && !tablet) ? 1 : 0;

    const gutter = mobile ? 20 : 40;
    const content = Math.min(1120, w - (gutter * 2));
    const gap = mobile ? 14 : 22;

    const columns = function (count) {
        // Genişliğe göre sütun sayısını düşürür ve tek sütun genişliğini verir.
        let realCount = count;
        if (mobile) realCount = 1;
        else if (tablet && count > 2) realCount = 2;
        return Math.floor((content - (gap * (realCount - 1))) / realCount);
    };

    return {
        w: w,
        mobile: mobile,
        tablet: tablet,
        desktop: desktop,
        gutter: gutter,
        content: content,
        gap: gap,
        columns: columns,

        headerH: mobile ? 62 : 74,
        sectionPadY: mobile ? 56 : 96,

        h1: mobile ? 34 : (tablet ? 44 : 56),
        h2: mobile ? 26 : 38,
        h3: mobile ? 19 : 21,
        lead: mobile ? 16 : 19,
        body: mobile ? 15 : 16,
        small: 13,
        tiny: 11,
    };

};

// *** SECTION:
// Tam genişlikte bir şerit + ortalanmış içerik kutusu açar. (2 grup açar)
SITE.startSection = function (params = {}) {

    const L = SITE.L;

    mergeIntoIfMissing(params, {
        key: "",
        color: "transparent",
        align: "center top",
        gap: L.gap,
        padY: L.sectionPadY,
        padTop: 0,
        padBottom: 0,
    });

    // GROUP: Tam genişlik şerit
    const strip = VGroup({
        width: "100%",
        height: "auto",
        align: "center top",
        color: params.color,
        padding: [L.gutter, params.padY],
    });
    if (params.padTop) that.elem.style.paddingTop = params.padTop + "px";
    if (params.padBottom) that.elem.style.paddingBottom = params.padBottom + "px";

    if (params.key) {
        SITE.sections[params.key] = strip;
    }

    // GROUP: Ortalanmış içerik
    VGroup({
        width: L.content,
        height: "auto",
        align: params.align,
        gap: params.gap,
    });
    // WHY: Kart üzerine gelince yukarı kalkar ve gölge alır; kenarlarda kesilmesin.
    that.clipContent = 0;

    return strip;

};

SITE.endSection = function () {
    endGroup(); // içerik
    endGroup(); // şerit
};

// *** TEXT PIECES:

// LABEL: Bölüm üstü küçük etiket
SITE.eyebrow = function (text, onDark = 0) {

    Label({
        text: text,
        width: "100%",
        fontSize: SITE.L.tiny,
        textColor: onDark ? SITE.PRIMARY_LIGHT : SITE.PRIMARY,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.letterSpacing = "1.4px";

    return that;

};

// LABEL: Ana başlık (hero)
SITE.h1 = function (text, onDark = 0) {

    Label({
        text: text,
        width: "100%",
        fontSize: SITE.L.h1,
        textColor: onDark ? SITE.WHITE : SITE.INK,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.lineHeight = "1.12";
    that.elem.style.letterSpacing = "-0.6px";

    return that;

};

// LABEL: Bölüm başlığı
SITE.h2 = function (text, onDark = 0) {

    Label({
        text: text,
        width: "100%",
        fontSize: SITE.L.h2,
        textColor: onDark ? SITE.WHITE : SITE.INK,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.lineHeight = "1.2";
    that.elem.style.letterSpacing = "-0.3px";

    return that;

};

// LABEL: Kart başlığı
SITE.h3 = function (text, onDark = 0, width = "100%") {

    Label({
        text: text,
        width: width,
        fontSize: SITE.L.h3,
        textColor: onDark ? SITE.WHITE : SITE.INK,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.lineHeight = "1.3";

    return that;

};

// LABEL: Giriş paragrafı
SITE.lead = function (text, width = "100%", onDark = 0) {

    Label({
        text: text,
        width: width,
        fontSize: SITE.L.lead,
        textColor: onDark ? SITE.ON_DARK_SOFT : SITE.TEXT_SOFT,
    });
    that.elem.style.lineHeight = "1.6";

    return that;

};

// LABEL: Normal metin
SITE.text = function (text, width = "100%", onDark = 0, size = 0) {

    Label({
        text: text,
        width: width,
        fontSize: size || SITE.L.body,
        textColor: onDark ? SITE.ON_DARK_SOFT : SITE.TEXT_SOFT,
    });
    that.elem.style.lineHeight = "1.65";

    return that;

};

// *** BUTTONS:

// BUTTON: kind = "primary", "ghost", "dark", "light", "link"
SITE.button = function (params = {}) {

    mergeIntoIfMissing(params, {
        text: "Button",
        kind: "primary",
        width: "auto",
        height: SITE.L.mobile ? 48 : 52,
        fontSize: SITE.L.mobile ? 15 : 16,
        onClick: function () { },
    });

    const btn = Button({
        text: params.text,
        width: params.width,
        height: params.height,
        fontSize: params.fontSize,
        minimal: 1,
        round: 8,
    });

    btn.elem.style.fontFamily = SITE.BOLD;
    btn.elem.style.padding = "0px " + (SITE.L.mobile ? 20 : 26) + "px";
    btn.elem.style.whiteSpace = "nowrap";

    // Renkler: .baseColor normal, .hoverColor üzerine gelince.
    // NOTE: Sonradan değiştirmek için (örn. üst çubuk) ikisini birlikte güncelleyin.
    switch (params.kind) {

        case "primary":
            btn.baseColor = SITE.PRIMARY;
            btn.hoverColor = "#37704A";
            btn.textColor = SITE.WHITE;
            break;

        case "dark":
            btn.baseColor = SITE.INK;
            btn.hoverColor = "#1E3227";
            btn.textColor = SITE.WHITE;
            break;

        case "light":
            btn.baseColor = SITE.WHITE;
            btn.hoverColor = "#EBEBE4";
            btn.textColor = SITE.INK;
            break;

        case "ghost":
            btn.baseColor = "transparent";
            btn.hoverColor = SITE.BG_SOFT;
            btn.textColor = SITE.INK;
            btn.elem.style.border = "1px solid " + SITE.LINE;
            break;

        case "ghost-dark":
            btn.baseColor = "transparent";
            btn.hoverColor = "rgba(255, 255, 255, 0.10)";
            btn.textColor = SITE.WHITE;
            btn.elem.style.border = "1px solid " + SITE.ON_DARK_LINE;
            break;

        default:
            btn.baseColor = SITE.PRIMARY;
            btn.hoverColor = "#37704A";
            btn.textColor = SITE.WHITE;

    }

    btn.color = btn.baseColor;

    // Hover / basma efekti
    btn.setMotion("background-color 0.15s, transform 0.12s");

    btn.on("mouseover", function () {
        btn.color = btn.hoverColor;
    });

    btn.on("mouseout", function () {
        btn.color = btn.baseColor;
    });

    btn.on("mousedown", function () {
        btn.elem.style.transform = "scale(0.97)";
    });

    btn.on("mouseup", function () {
        btn.elem.style.transform = "scale(1)";
    });

    btn.on("click", function () {
        params.onClick(btn);
    });

    return btn;

};

// LABEL: Bağlantı gibi davranan metin
SITE.link = function (text, onClick, onDark = 0, size = 0) {

    Label({
        text: text,
        width: "auto",
        fontSize: size || SITE.L.body,
        textColor: onDark ? SITE.ON_DARK_SOFT : SITE.TEXT_SOFT,
    });
    that.elem.style.whiteSpace = "nowrap";
    that.setMotion("color 0.15s");

    const lbl = that;

    lbl.on("mouseover", function () {
        lbl.textColor = onDark ? SITE.WHITE : SITE.PRIMARY;
        lbl.elem.style.cursor = "pointer";
    });

    lbl.on("mouseout", function () {
        lbl.textColor = onDark ? SITE.ON_DARK_SOFT : SITE.TEXT_SOFT;
    });

    lbl.on("click", function () {
        onClick(lbl);
    });

    return lbl;

};

// *** CARD:
// Beyaz (veya koyu) kart açar. (1 grup açar)
SITE.startCard = function (params = {}) {

    const L = SITE.L;

    mergeIntoIfMissing(params, {
        width: L.columns(3),
        align: "left top",
        gap: 12,
        padding: L.mobile ? 22 : 28,
        color: SITE.CARD,
        borderColor: SITE.LINE,
        round: 14,
        onDark: 0,
        hover: 1,
    });

    if (params.onDark) {
        if (params.color == SITE.CARD) params.color = SITE.INK_SOFT;
        if (params.borderColor == SITE.LINE) params.borderColor = SITE.ON_DARK_LINE;
    }

    const card = VGroup({
        width: params.width,
        height: "auto",
        align: params.align,
        gap: params.gap,
        padding: params.padding,
        color: params.color,
        round: params.round,
        border: 1,
        borderColor: params.borderColor,
    });

    if (params.hover) {
        SITE.hoverLift(card, params.onDark);
    }

    return card;

};

// *** GRID:
// Kartların yan yana dizildiği, taşınca alt satıra geçen ve eşit boyda duran satır. (1 grup açar)
SITE.startGrid = function (params = {}) {

    mergeIntoIfMissing(params, {
        gap: SITE.L.gap,
        justify: "center", // "center", "left"
    });

    // NOTE: align yerine doğrudan flex özellikleri veriliyor.
    // WHY: Kartların aynı boyda durması için alignItems "stretch" olmalı.
    const grid = HGroup({
        width: "100%",
        height: "auto",
        justifyContent: (params.justify == "left") ? "flex-start" : "center",
        alignItems: "stretch",
        alignContent: "flex-start",
        gap: params.gap,
        flexWrap: "wrap",
    });
    // WHY: Kart üzerine gelince yukarı kalkar ve gölge alır; grid kenarında kesilmesin.
    grid.clipContent = 0;

    return grid;

};

SITE.endGrid = function () {
    endGroup();
};

SITE.endCard = function () {
    endGroup();
};

// Kartı, üzerine gelince hafifçe kaldırır.
SITE.hoverLift = function (box, onDark = 0) {

    box.setMotion("transform 0.2s, box-shadow 0.2s, border-color 0.2s");

    box.on("mouseover", function () {
        box.elem.style.transform = "translateY(-3px)";
        box.elem.style.boxShadow = onDark ? "0px 10px 30px rgba(0, 0, 0, 0.35)" : "0px 10px 30px rgba(0, 0, 0, 0.07)";
        box.borderColor = onDark ? "rgba(255, 255, 255, 0.24)" : "rgba(0, 0, 0, 0.18)";
    });

    box.on("mouseout", function () {
        box.elem.style.transform = "translateY(0px)";
        box.elem.style.boxShadow = "none";
        box.borderColor = onDark ? SITE.ON_DARK_LINE : SITE.LINE;
    });

    return box;

};

// *** SMALL PIECES:

// ICON: Kare, yuvarlatılmış zemin üzerinde ikon
SITE.iconBadge = function (iconFile, params = {}) {

    mergeIntoIfMissing(params, {
        size: 48,
        iconSize: 24,
        color: SITE.MINT,
        round: 12,
        invert: 0,
        opacity: 0.85,
    });

    const badge = VGroup({
        width: params.size,
        height: params.size,
        align: "center",
        color: params.color,
        round: params.round,
    });

    Icon({ width: params.iconSize, height: params.iconSize, opacity: params.opacity });
    that.load(iconFile);
    if (params.invert) that.elem.style.filter = "invert(100%)";

    endGroup();

    return badge;

};

// LABEL: Küçük etiket kutusu (badge)
SITE.chip = function (text, params = {}) {

    mergeIntoIfMissing(params, {
        color: SITE.MINT,
        textColor: SITE.PRIMARY,
        fontSize: SITE.L.tiny,
    });

    Label({
        text: text,
        width: "auto",
        height: "auto",
        fontSize: params.fontSize,
        textColor: params.textColor,
        color: params.color,
        round: 100,
    });
    that.elem.style.fontFamily = SITE.BOLD;
    that.elem.style.padding = "7px 12px";
    that.elem.style.letterSpacing = "0.6px";
    that.elem.style.whiteSpace = "nowrap";

    return that;

};

// GROUP: Listedeki tik işaretli satır (width: sayı olmalı)
SITE.checkLine = function (text, width, onDark = 0) {

    const row = HGroup({
        width: width,
        height: "auto",
        align: "left top",
        gap: 10,
    });

        // GROUP: Tik yuvarlağı
        const tick = VGroup({
            width: 18,
            height: 18,
            align: "center",
            color: onDark ? "rgba(101, 162, 147, 0.22)" : SITE.MINT,
            round: 100,
        });
        tick.elem.style.flexShrink = "0";
        tick.elem.style.marginTop = "3px";

            // LABEL: Tik işareti
            Label({
                text: "&#10003;",
                width: "auto",
                fontSize: 11,
                textColor: onDark ? SITE.PRIMARY_LIGHT : SITE.PRIMARY,
            });

        endGroup();

        // LABEL: Metin
        Label({
            text: text,
            width: width - 28,
            fontSize: SITE.L.body,
            textColor: onDark ? SITE.ON_DARK_SOFT : SITE.TEXT_SOFT,
        });
        that.elem.style.lineHeight = "1.5";

    endGroup();

    return row;

};

// BOX: İnce ayırıcı çizgi
SITE.divider = function (width = "100%", onDark = 0) {

    Box(0, 0, width, 1, {
        color: onDark ? SITE.ON_DARK_LINE : SITE.LINE,
    });
    that.elem.style.flexShrink = "0";

    return that;

};

// BOX: Dikey boşluk
SITE.space = function (height) {

    Box(0, 0, 1, height, { color: "transparent" });
    that.elem.style.flexShrink = "0";

    return that;

};

// *** NAVIGATION:
// Bölüme kaydırır. (smooth: 1 yumuşak, 0 anında)
SITE.scrollToKey = function (key, smooth = 1) {

    const target = SITE.sections[key];
    if (!target || !SITE.scrollBox) return;

    const top = Math.max(0, SITE.getSectionTop(key));

    if (!smooth) {
        SITE.scrollBox.elem.scrollTop = top;
        return;
    }

    SITE.animateScroll(top);

};

// Kaydırma kutusunu, verilen konuma yumuşak biçimde götürür.
// NOTE: scrollTo({ behavior: "smooth" }) yerine, adım adım yapılıyor.
// WHY: Eski tarayıcılarda da aynı çalışsın ve süre bizde olsun.
SITE.animateScroll = function (targetTop, duration = 520) {

    if (!SITE.scrollBox) return;

    const elem = SITE.scrollBox.elem;
    const startTop = elem.scrollTop;
    const distance = targetTop - startTop;

    if (SITE.scrollTimer) {
        clearTimeout(SITE.scrollTimer);
        SITE.scrollTimer = null;
    }

    if (distance === 0) return;

    const stepCount = Math.max(2, Math.round(duration / 16));
    let stepIndex = 0;

    const step = function () {

        stepIndex++;

        const time = stepIndex / stepCount;

        // easeInOutCubic
        const value = (time < 0.5)
            ? (4 * time * time * time)
            : (1 - Math.pow((-2 * time) + 2, 3) / 2);

        elem.scrollTop = Math.round(startTop + (distance * value));

        if (stepIndex < stepCount) {
            SITE.scrollTimer = setTimeout(step, 16);
        } else {
            elem.scrollTop = targetTop;
            SITE.scrollTimer = null;
        }

    };

    SITE.scrollTimer = setTimeout(step, 0);

};

// Bölümün, kaydırma kutusu içindeki dikey konumu.
SITE.getSectionTop = function (key) {

    const target = SITE.sections[key];
    if (!target || !SITE.scrollBox) return 0;

    const boxElem = SITE.scrollBox.elem;

    return target.elem.getBoundingClientRect().top
        - boxElem.getBoundingClientRect().top
        + boxElem.scrollTop
        - (SITE.L.headerH + 8);

};

// Ekranın üstündeki bölümün anahtarı. (Yeniden kurarken yeri korumak için)
SITE.getVisibleSectionKey = function () {

    if (!SITE.scrollBox) return "";

    const scrollTop = SITE.scrollBox.elem.scrollTop;
    let foundKey = "";

    for (let key in SITE.sections) {
        if (SITE.getSectionTop(key) <= scrollTop + 4) {
            foundKey = key;
        }
    }

    return foundKey;

};
