/* Bismillah */

/*

JS Components Website - Site Controller - v26.09

- Sayfayı kurar, adres çubuğuna göre ana sayfayı veya bir bileşeni açar, dili değiştirir,
  ekran boyutu değişince ölçüleri günceller.
- Adresler: index.htm (ana sayfa), index.htm#/tabs (bileşen), index.htm#/input-b/3 (bileşenin 3. örneği)
- Builds the page, opens the home page or a component by the address, switches the language
  and updates the metrics when the window is resized.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const SiteApp = {
    cameFromHome: 0,    // 1: Bileşen ana sayfadan açıldı. Geri düğmesi tarayıcı geçmişini kullanır.
    resizeTimer: null,
    lastWidth: 0,
};

// *** FIRST RUNNING FUNCTION:
const start = function () {

    SITE.lang = SiteApp.loadLanguage();
    SITE.T = TEXTS[SITE.lang];
    SITE.L = SITE.createMetrics();
    SiteApp.lastWidth = SITE.L.w;

    SiteApp.applyDocumentInfo();

    page.color = SITE.BG;

    CodeHighlight.injectCss();

    if (typeof Toast === "function") {
        Toast.setOptions({ position: "bottom-center", theme: "dark" });
    }

    HomeView.build();

    window.addEventListener("hashchange", SiteApp.route);
    page.onResize(SiteApp.onPageResize);

    SiteApp.route();

};

// *** ROUTING:

// "#/tabs" -> { key: "tabs", index: 0 }, "#/input-b/3" -> { key: "input-b", index: 2 }
SiteApp.parseHash = function () {

    const match = /^#\/([\w-]+)(?:\/(\d+))?/.exec(location.hash);
    if (!match) return null;

    return {
        key: match[1],
        index: match[2] ? Math.max(0, Number(match[2]) - 1) : 0,
    };

};

SiteApp.route = function () {

    const target = SiteApp.parseHash();
    const comp = (target) ? CATALOG.find(target.key) : null;

    if (comp) {
        HomeView.hide();
        DetailView.open(comp, target.index);
        document.title = comp.name + " – " + CONFIG.brandName;
    } else {
        DetailView.close();
        HomeView.show();
        SiteApp.cameFromHome = 0;
        document.title = SITE.T.pageTitle;
    }

};

// Karttan çağırılır.
SiteApp.openComponent = function (key) {
    SiteApp.cameFromHome = 1;
    location.hash = "#/" + key;
};

// Detaydaki geri düğmesi ve Escape tuşu.
SiteApp.goHome = function () {

    if (SiteApp.cameFromHome) {
        // WHY: Ana sayfanın geçmiş kaydına dönülür; tarayıcının geri düğmesi de aynı yere gider.
        history.back();
        return;
    }

    location.hash = "#/";

};

// Örnek değişince adresi günceller. (Geçmişe yeni kayıt eklemez, hashchange olayı oluşmaz.)
SiteApp.replaceHash = function (key, index) {
    const hash = "#/" + key + ((index > 0) ? "/" + (index + 1) : "");
    if (location.hash !== hash) history.replaceState(history.state, "", hash);
};

// *** LANGUAGE:

SiteApp.toggleLanguage = function () {

    const lang = (SITE.lang == "tr") ? "en" : "tr";
    basic.storage.save(CONFIG.languageStorageKey, lang);

    // WHY: Bütün yazılar oluşturulurken seçiliyor; en kısa yol sayfayı yeniden açmak. (Adres korunur.)
    // WHY: The new language is in the address, so the page opens in it. (Only the address of the same language: reload.)
    const address = SiteApp.languageAddress(lang);
    if (address == location.href) location.reload();
    else location.replace(address);

};

// Önce adres (?lang=tr), sonra kayıtlı dil; ikisi de yok ise tarayıcı dili Türkçe ise Türkçe, değil ise varsayılan dil.
SiteApp.loadLanguage = function () {

    // The address first (?lang=tr): a shared link or a search engine asks for this language.
    const asked = new URLSearchParams(location.search).get("lang");
    if (asked == "tr" || asked == "en") return asked;

    const saved = basic.storage.load(CONFIG.languageStorageKey);
    if (saved && TEXTS[saved]) return saved;

    const browserLanguage = (navigator.language || "").toLowerCase();
    if (browserLanguage.indexOf("tr") === 0) return "tr";

    return CONFIG.defaultLanguage;

};

// *** RESIZE:
SiteApp.onPageResize = function () {

    SiteApp.resizeTimer = waitAndRun(SiteApp.resizeTimer, function () {

        SITE.L = SITE.createMetrics();

        // WHY: Sadece yükseklik değişmiş ise (mobil adres çubuğu) kartları yeniden ölçme.
        if (SITE.L.w !== SiteApp.lastWidth) {
            SiteApp.lastWidth = SITE.L.w;
            HomeView.relayout();
        }

        DetailView.relayout();

    }, CONFIG.resizeDelay);

};

// *** DOCUMENT:
SiteApp.applyDocumentInfo = function () {

    const T = SITE.T;

    document.title = T.pageTitle;
    document.documentElement.setAttribute("lang", T.htmlLang);

    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", T.pageDescription);


    SiteApp.applySeo();

};

// *** SEO:
// The language is in the address: the default language is the address itself, the other one has ?lang=.
// So a search engine reads both languages, and a shared link opens in the same language.
// CONFIG.siteURL (the published address) adds canonical, hreflang and og:url. "": not known yet.

// The address of a language. base: CONFIG.siteURL (no hash), or the current address (the hash is kept).
SiteApp.languageAddress = function (lang, base) {
    const url = new URL(base || location.href);
    if (lang == CONFIG.defaultLanguage) url.searchParams.delete("lang");
    else url.searchParams.set("lang", lang);
    if (base) url.hash = "";
    return url.href;
};

// The link preview texts of the language, and the links that need the published address.
// WHY: The texts in <head> are in one language; Google reads the page after the code, so they are set here too.
SiteApp.applySeo = function () {

    const T = SITE.T;

    SiteApp.setSeoTag("meta", "property", "og:title", "content", T.pageTitle);
    SiteApp.setSeoTag("meta", "property", "og:description", "content", T.pageDescription);
    SiteApp.setSeoTag("meta", "property", "og:locale", "content", (SITE.lang == "tr") ? "tr_TR" : "en_US");

    if (!CONFIG.siteURL) return;

    SiteApp.setSeoTag("link", "rel", "canonical", "href", SiteApp.languageAddress(SITE.lang, CONFIG.siteURL));
    ["en", "tr", "x-default"].forEach(function (lang) {
        const href = SiteApp.languageAddress((lang == "x-default") ? CONFIG.defaultLanguage : lang, CONFIG.siteURL);
        SiteApp.setSeoTag("link", "hreflang", lang, "href", href, { rel: "alternate" });
    });
    SiteApp.setSeoTag("meta", "property", "og:url", "content", SiteApp.languageAddress(SITE.lang, CONFIG.siteURL));
    SiteApp.setSeoTag("meta", "property", "og:image", "content", new URL(CONFIG.ogImage, CONFIG.siteURL).href);

};

// Finds (or adds) <tag key="value"> in <head> and sets one of its attributes.
SiteApp.setSeoTag = function (tag, key, value, attr, content, extra) {
    let elem = document.head.querySelector(tag + "[" + key + "=\"" + value + "\"]");
    if (!elem) {
        elem = document.createElement(tag);
        elem.setAttribute(key, value);
        if (extra) Object.keys(extra).forEach(function (name) { elem.setAttribute(name, extra[name]); });
        document.head.appendChild(elem);
    }
    elem.setAttribute(attr, content);
};

