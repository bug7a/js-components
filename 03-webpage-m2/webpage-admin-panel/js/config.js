/* Bismillah */

/*

Web Admin Panel - Site Configuration - v26.09

- Tüm site ayarları bu dosyadadır. Metinler için: js/texts.js
- All site settings are in this file. For copy/texts see: js/texts.js

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CONFIG = {

    // *** BRAND:
    brandName: "JS Admin Panel",
    logoFile: "assets/logo.png",

    // *** CONTACT:
    email: "bugra.ozden@gmail.com",
    // Boş bırakılır ise, o satır gösterilmez.
    phone: "",
    meetingURL: "", // örn: "https://cal.com/..."

    // *** LINKS:
    githubURL: "https://github.com/bug7a/js-components",
    downloadURL: "https://github.com/bug7a/js-components",
    handbookURL: "https://bug7a.github.io/basic.js-handbook/",
    componentsURL: "https://bug7a.github.io/js-components/",

    // *** DEMO:
    // Canlı demo, bu adresi bir iframe içinde açar.
    demoURL: "../js-admin-panel/index.htm",

    // *** FORM SERVICE:
    // Formu POST edeceğiniz servisin adresi. (Formspree, Web3Forms, Make, n8n, kendi API'niz...)
    // - Boş bırakılır ise; form, kullanıcının e-posta programını mailto ile açar.
    // - Örnek: "https://formspree.io/f/xxxxxxx"
    formEndpoint: "",
    // "json": body olarak JSON gönderir. "form": application/x-www-form-urlencoded gönderir.
    formEndpointType: "json",
    // Servis Accept başlığı isterse (Formspree JSON cevabı için gerekir):
    formSendAcceptJSON: 1,

    // *** LANGUAGE:
    defaultLanguage: "tr", // "tr", "en"
    languageStorageKey: "wap_lang",

    // *** SEO:
    // The published address of this page (ex: "https://bug7a.github.io/basic.js/"). "": not known yet.
    // With it, the page adds its canonical, hreflang (?lang=tr / ?lang=en) and og:url links.
    // Also write it into og:image in index.htm: link previews do not run JavaScript.
    siteURL: "",
    ogImage: "assets/og-image.jpg", // The link preview picture (1200 x 630), relative to this page

    // *** BEHAVIOR:
    // Sayfa yeniden boyutlandığında, sayfayı yeniden kur (responsive).
    rebuildOnResizeDelay: 150,

};
