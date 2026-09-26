/* Bismillah */

/*

JS Form Website - Site Configuration - v26.09

- Tüm site ayarları bu dosyadadır. Metinler için: js/texts.js
- All site settings are in this file. For copy/texts see: js/texts.js

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CONFIG = {

    // *** BRAND:
    brandName: "JS Form",
    logoFile: "assets/logo.png",

    // *** CONTACT:
    email: "bugra.ozden@gmail.com",
    // Boş bırakılır ise, o satır gösterilmez.
    phone: "",
    meetingURL: "", // örn: "https://cal.com/..."

    // *** LINKS:
    githubURL: "https://github.com/bug7a/js-components",
    // Açık kaynak paketin kendisi (js-form klasörü)
    downloadURL: "https://github.com/bug7a/js-components/tree/main/04-template-m2/js-form",
    // Mail servisinin kurulum rehberi
    setupGuideURL: "https://github.com/bug7a/js-components/tree/main/04-template-m2/js-form/service",
    handbookURL: "https://bug7a.github.io/basic.js-handbook/",
    componentsURL: "https://bug7a.github.io/js-components/",

    // *** DEMO:
    // Canlı demodaki formlar. (Bu sayfaya göre yol; key: js/texts.js -> demo.forms)
    // NOTE: Bu formlarda SERVICE_URL boştur, yani "demo modunda" çalışırlar: gönderilen hiçbir şey bir yere gitmez.
    //       Kendi SERVICE_URL adresinizi yazdığınız bir formu buraya koymayın.
    demoBaseURL: "../js-form/",
    demoForms: [
        { key: "appointment", file: "appointment-form.htm" },
        { key: "order", file: "order-form.htm" },
        { key: "feedback", file: "feedback-form.htm" },
        { key: "recruitment", file: "recruitment-form.htm" },
        { key: "support", file: "support-ticket-form.htm" },
        { key: "event", file: "event-registration-form.htm" },
    ],

    // *** FORM SERVICE:
    // Teklif formunu POST edeceğiniz servisin adresi.
    // - js-form'un kendi mail servisi de olur: "https://your-site.com/service/send-form-mail.php"
    //   (Form, düz bir JSON nesnesi gönderir; servis alan adlarından başlıkları kendisi oluşturur.)
    // - Formspree, Web3Forms, Make, n8n veya kendi API'niz de kullanılabilir.
    // - Boş bırakılır ise; form, kullanıcının e-posta programını mailto ile açar.
    formEndpoint: "",
    // "json": body olarak JSON gönderir. "form": application/x-www-form-urlencoded gönderir.
    formEndpointType: "json",
    // Servis Accept başlığı isterse (Formspree JSON cevabı için gerekir):
    formSendAcceptJSON: 1,

    // *** LANGUAGE:
    defaultLanguage: "tr", // "tr", "en"
    languageStorageKey: "wjf_lang",

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
