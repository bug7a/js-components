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
    history.replaceState(null, "", languageAddress(SITE.lang)); // WHY: A copied link opens in this language.

    const sectionKey = SITE.getVisibleSectionKey();

    destroySite();
    buildSite(sectionKey);

};

// Önce adres (?lang=tr), sonra kayıtlı dil; ikisi de yok ise tarayıcı dili Türkçe ise Türkçe, değil ise varsayılan dil.
const loadLanguage = function () {

    // The address first (?lang=tr): a shared link or a search engine asks for this language.
    const asked = new URLSearchParams(location.search).get("lang");
    if (asked == "tr" || asked == "en") return asked;

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


    applySeo();

};

// *** SEO:
// The language is in the address: the default language is the address itself, the other one has ?lang=.
// So a search engine reads both languages, and a shared link opens in the same language.
// CONFIG.siteURL (the published address) adds canonical, hreflang and og:url. "": not known yet.

// The address of a language. base: CONFIG.siteURL (no hash), or the current address (the hash is kept).
const languageAddress = function (lang, base) {
    const url = new URL(base || location.href);
    if (lang == CONFIG.defaultLanguage) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    if (base) url.hash = "";
    return url.href;
};

// The link preview texts of the language, and the links that need the published address.
// WHY: The texts in <head> are in one language; Google reads the page after the code, so they are set here too.
const applySeo = function () {

    const T = SITE.T;

    setSeoTag("meta", "property", "og:title", "content", T.pageTitle);
    setSeoTag("meta", "property", "og:description", "content", T.pageDescription);
    setSeoTag("meta", "property", "og:locale", "content", (SITE.lang == "tr") ? "tr_TR" : "en_US");

    if (!CONFIG.siteURL) return;

    setSeoTag("link", "rel", "canonical", "href", languageAddress(SITE.lang, CONFIG.siteURL));
    ["en", "tr", "x-default"].forEach(function (lang) {
        const href = languageAddress((lang == "x-default") ? CONFIG.defaultLanguage : lang, CONFIG.siteURL);
        setSeoTag("link", "hreflang", lang, "href", href, { rel: "alternate" });
    });
    setSeoTag("meta", "property", "og:url", "content", languageAddress(SITE.lang, CONFIG.siteURL));
    setSeoTag("meta", "property", "og:image", "content", new URL(CONFIG.ogImage, CONFIG.siteURL).href);

};

// Finds (or adds) <tag key="value"> in <head> and sets one of its attributes.
const setSeoTag = function (tag, key, value, attr, content, extra) {
    let elem = document.head.querySelector(tag + "[" + key + "=\"" + value + "\"]");
    if (!elem) {
        elem = document.createElement(tag);
        elem.setAttribute(key, value);
        if (extra) Object.keys(extra).forEach(function (name) { elem.setAttribute(name, extra[name]); });
        document.head.appendChild(elem);
    }
    elem.setAttribute(attr, content);
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
