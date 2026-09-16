/* Bismillah */

/*

Web Admin Panel - Site Controller - v26.09

- Sayfayı kurar, dili değiştirir, ekran boyutu değişince yeniden kurar.
- Builds the page, switches the language and rebuilds it when the window is resized.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

// *** VARIABLES:
let scrollBox = null;   // Kaydırılan ana kutu
let header = null;      // Üstteki sabit çubuk
let resizeTimer = null;
let lastWidth = 0;

// *** FIRST RUNNING FUNCTION:
const start = function () {

    SITE.lang = loadLanguage();

    page.color = SITE.BG;

    buildSite();

    page.onResize(onPageResize);

};

// *** BUILD:

// Bütün sayfayı kurar.
const buildSite = function (keepSectionKey) {

    SITE.L = SITE.createMetrics();
    SITE.T = TEXTS[SITE.lang];
    SITE.sections = {};

    lastWidth = SITE.L.w;

    applyDocumentInfo();

    // BOX: Kaydırılan tam ekran kutu
    // WHY: page kaydırılmaz. Uzun içerik, scrollY: 1 verilmiş bir Box içinde durur.
    scrollBox = startBox(0, 0, "100%", "100%", {
        color: SITE.BG,
        scrollY: 1,
    });
    SITE.scrollBox = scrollBox;

        // GROUP: Sayfa akışı
        VGroup({
            width: "100%",
            height: "auto", // Yükseklik içerikle büyür, böylece kutu kayabilir.
            align: "center top",
            gap: 0,
        });

            HeroSection();
            StatsSection();
            ServicesSection();
            FeaturesSection();
            UseCasesSection();
            ProcessSection();
            DemoSection();
            PricingSection();
            OpenSourceSection();
            FaqSection();
            ContactSection();
            FooterSection({ onNavClick: onNavClick });

        endGroup();

    endBox();

    // BOX: Üst çubuk (kaydırılan kutunun dışında)
    header = SiteHeader({
        onNavClick: onNavClick,
        onLanguageClick: toggleLanguage,
    });

    scrollBox.on("scroll", function () {
        header.refreshScrollState(scrollBox.elem.scrollTop);
    });

    // Yeniden kurulumdan sonra, ziyaretçiyi baktığı bölümde tut.
    if (keepSectionKey) {
        SITE.scrollToKey(keepSectionKey, 0);
    }

};

// Sayfadaki her şeyi siler.
const destroySite = function () {

    // Kaydırma animasyonu sürüyor ise durdur.
    if (SITE.scrollTimer) {
        clearTimeout(SITE.scrollTimer);
        SITE.scrollTimer = null;
    }

    if (header) {
        header.closeMenu();
        header.remove();
        header = null;
    }

    if (scrollBox) {
        scrollBox.remove();
        scrollBox = null;
        SITE.scrollBox = null;
    }

};

// *** ACTIONS:

// Menüden, alt bilgiden veya kartlardan çağırılır.
const onNavClick = function (key) {

    if (key == "top") {
        SITE.animateScroll(0);
        return;
    }

    SITE.scrollToKey(key);

};

// Dil değiştirme:
const toggleLanguage = function () {

    SITE.lang = (SITE.lang == "tr") ? "en" : "tr";
    basic.storage.save(CONFIG.languageStorageKey, SITE.lang);

    const sectionKey = SITE.getVisibleSectionKey();

    destroySite();
    buildSite(sectionKey);

};

// Kayıtlı dil yok ise; tarayıcı dili Türkçe ise Türkçe, değil ise varsayılan dil.
const loadLanguage = function () {

    const saved = basic.storage.load(CONFIG.languageStorageKey);
    if (saved && TEXTS[saved]) return saved;

    const browserLanguage = (navigator.language || "").toLowerCase();
    if (browserLanguage.indexOf("tr") === 0) return "tr";

    return CONFIG.defaultLanguage;

};

// Ekran boyutu değişince, ölçüler yeniden hesaplanır.
const onPageResize = function () {

    resizeTimer = waitAndRun(resizeTimer, function () {

        // WHY: Sadece yükseklik değişmiş ise (mobil adres çubuğu) yeniden kurma.
        if (page.width == lastWidth) return;

        const sectionKey = SITE.getVisibleSectionKey();

        destroySite();
        buildSite(sectionKey);

    }, CONFIG.rebuildOnResizeDelay);

};

// *** DOCUMENT:
// Başlık ve açıklama etiketlerini, seçili dile göre yazar.
const applyDocumentInfo = function () {

    const T = SITE.T;

    document.title = T.pageTitle;
    document.documentElement.setAttribute("lang", T.htmlLang);

    setMetaContent("description", T.pageDescription);
    setMetaContent("keywords", T.pageKeywords);

};

const setMetaContent = function (name, content) {

    let meta = document.querySelector('meta[name="' + name + '"]');

    if (!meta) {
        meta = document.createElement("META");
        meta.setAttribute("name", name);
        document.getElementsByTagName("HEAD")[0].appendChild(meta);
    }

    meta.setAttribute("content", content);

};
