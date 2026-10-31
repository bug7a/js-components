/* Bismillah */

/*

basic.js Handbook Website - Site Configuration - v26.09

- Tüm site ayarları bu dosyadadır. Metinler: js/texts.js
- All site settings are in this file. Texts: js/texts.js

- Bölümlerin metni __handbook/english ve __handbook/turkce klasörlerindeki Markdown dosyalarından okunur.
  El kitabını güncellemek için o dosyaları düzenleyin; site bir şey kopyalamaz.
- The chapters are read from the Markdown files in __handbook/english and __handbook/turkce.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CONFIG = {

    // *** BRAND:
    brandName: "basic.js Handbook",
    logoFile: "assets/basicjs-handbook.svg", // Üst çubuktaki logo (356 x 83) / Header logo, relative to this page

    // *** PATHS: (Bu sayfaya göre)
    // Canlı örnekler buradaki basic/basic.min.js ile çalışır. (Site kendi içinden çalışır: basic/ bu klasörde.)
    rootPath: "./",
    // El kitabı klasörü ve dil klasörleri
    // WHY: __handbook'un kopyası (_update-copies.sh). "handbook": Jekyll "_" ile başlayan klasörleri yayınlamaz.
    handbookPath: "handbook/",
    languageFolders: {
        en: "english",
        tr: "turkce",
    },

    // *** CHAPTERS: (Menüdeki sıra. group: js/texts.js -> groups)
    // file: "" olan bölüm Markdown dosyasından değil, js/texts.js -> quickStart metninden gelir.
    chapters: [
        { id: "introduction", file: "00-introduction.md", group: "start" },
        { id: "quick-start", file: "", group: "start" },
        { id: "box", file: "02-box.md", group: "objects" },
        { id: "label", file: "01-label.md", group: "objects" },
        { id: "image", file: "03-image.md", group: "objects" },
        { id: "button", file: "06-button.md", group: "objects" },
        { id: "input", file: "07-input.md", group: "objects" },
        { id: "common-properties", file: "04-common-properties.md", group: "layout" },
        { id: "autolayout", file: "05-autolayout.md", group: "layout" },
        { id: "page", file: "08-page.md", group: "layout" },
        { id: "motion", file: "10-motion.md", group: "more" },
        { id: "sound", file: "13-sound.md", group: "more" },
        { id: "utilities", file: "12-utilities.md", group: "more" },
        { id: "other-functions", file: "11-other-functions.md", group: "more" },
        { id: "useful-examples", file: "09-useful-examples.md", group: "more" },
        { id: "what-is-new", file: "00-what-is-new.md", group: "more" },
    ],

    // *** LINKS:
    githubURL: "https://github.com/bug7a/js-components",
    componentsURL: "https://bug7a.github.io/js-components/",

    // *** LOADING:
    // Aynı anda okunan el kitabı dosyası sayısı.
    loadConcurrency: 4,

    // *** LIVE EXAMPLES:
    // Çalıştırılan örneğin yüksekliği (px)
    runHeight: 300,

    // *** LAYOUT:
    sidebarWidth: 280,
    headerHeight: 60,
    articleMaxWidth: 780,
    tocWidth: 220,
    // Bu genişliğin altında kenar menü, bir düğme ile açılan çekmeceye dönüşür.
    drawerBreakpoint: 960,
    // Bu genişliğin üstünde, sağda "Bu sayfada" listesi gösterilir.
    tocBreakpoint: 1280,

    // *** LANGUAGE:
    defaultLanguage: "en", // "tr", "en"
    languageStorageKey: "hb_lang",

    // *** SEO:
    // The published address of this page (ex: "https://bug7a.github.io/basic.js/"). "": not known yet.
    // With it, the page adds its canonical, hreflang (?lang=tr / ?lang=en) and og:url links.
    // Also write it into og:image in index.htm: link previews do not run JavaScript.
    siteURL: "https://bug7a.github.io/basic.js-handbook/",
    ogImage: "assets/og-image.jpg", // The link preview picture (1200 x 630), relative to this page

    // *** BEHAVIOR:
    resizeDelay: 120,

};
