/* Bismillah */

/*

JS Components Website - Site Configuration - v26.09

- Tüm site ayarları bu dosyadadır. Metinler: index/texts.js  |  Bileşen listesi: index/catalog.js
- All site settings are in this file. Texts: index/texts.js  |  Component list: index/catalog.js

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CONFIG = {

    // *** BRAND:
    brandName: "JS Components",
    logoFile: "index/basicui-components.svg", // Header logo (339 x 85), relative to this page

    // *** PATHS:
    // Deponun kök klasörü, bu sayfaya göre. Örnek sayfalar ve bileşen kodları buradan okunur.
    // The repository root, relative to this page. Samples and component sources are read from it.
    rootPath: "./",

    // *** LINKS:
    githubURL: "https://github.com/bug7a/js-components",
    handbookURL: "https://bug7a.github.io/basic.js-handbook/",
    authorURL: "https://bug7a.github.io/", // Alt bilgideki "Bugra Ozden"

    // *** PREVIEW CARDS:
    // Önizleme, örnek sayfayı bu ölçüde bir ekranda açıp kartın içine küçültür.
    // The preview opens the sample in a screen of this size and scales it down into the card.
    previewWidth: 760,
    previewHeight: 500,
    // Aynı anda yüklenen önizleme sayısı. (Hepsi birden yüklenirse sayfa açılışı yavaşlar.)
    // How many previews load at the same time.
    previewConcurrency: 3,
    // Ekrana bu kadar yaklaşan kart yüklenir. (px)
    // A card this close to the screen is loaded.
    previewLoadMargin: 300,
    // Ekrandan bu kadar uzaklaşan kartın sayfası kapatılır (bellek için). (px)
    // The page of a card this far from the screen is unloaded (memory).
    previewUnloadMargin: 1800,
    // Saniye. Bu sürede yüklenmeyen önizleme bırakılır, sıradaki başlar.
    previewTimeout: 15,

    // *** DETAIL VIEW:
    // Canlı örneğin genişliği (ekranın yüzdesi). Aradaki çizgi sürüklenerek değiştirilebilir.
    splitRatio: 0.5,
    splitMin: 0.25,
    splitMax: 0.75,
    // Bu genişliğin altında ekran bölünmez: örnek ve kod, bir düğme ile sırayla gösterilir.
    splitBreakpoint: 900,

    // *** LANGUAGE:
    defaultLanguage: "en", // "tr", "en"
    languageStorageKey: "wjc_lang",

    // *** SEO:
    // The published address of this page (ex: "https://bug7a.github.io/basic.js/"). "": not known yet.
    // With it, the page adds its canonical, hreflang (?lang=tr / ?lang=en) and og:url links.
    // Also write it into og:image in index.htm: link previews do not run JavaScript.
    siteURL: "https://bug7a.github.io/js-components/",
    ogImage: "index/og-image.jpg", // The link preview picture (1200 x 630), relative to this page
    splitStorageKey: "wjc_split",

    // *** BEHAVIOR:
    resizeDelay: 120,

};
