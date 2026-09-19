/* Bismillah */

// SERVICE WORKER - v1.0.0
// Developer: Bugra Ozden
// NOT: Bu dosya normal sayfa kodundan ayri bir worker icinde calisir.
//      Burada "window", "document" ve basic.js yoktur.

"use strict";

// *** SETTINGS

// NOT: Yeni bir surum yayinlarken bu numarayi degistir.
//      Degisince eski cache silinir ve dosyalar yeniden indirilir.
const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = "mobile-fit-skeleton-" + CACHE_VERSION;

// APP SHELL: Offline calismasi icin gereken dosyalar.
const APP_SHELL = [
    "./",
    "./index.htm",
    "./manifest.webmanifest",
    "./basic/basic.min.css",
    "./basic/basic.min.js",
    "./basic/font/open-sans/OpenSans-Regular.ttf",
    "./basic/font/open-sans/OpenSans-Bold.ttf",
    "./basic/img/button-background.png",
    "./basic/img/textbox-background.png",
    "./icon/icon-192.png",
    "./icon/icon-512.png",
    "./icon/icon-maskable-512.png",
    "./icon/apple-touch-icon.png",
    "./icon/favicon-32.png"
];

// *** INSTALL: Dosyalari cache'e al.

self.addEventListener("install", function (event) {

    event.waitUntil((async function () {

        const cache = await caches.open(CACHE_NAME);

        // NOT: cache.addAll() tek bir dosya bile inmezse hepsini iptal eder.
        //      Onun yerine tek tek ekliyoruz ki eksik dosya kurulumu bozmasin.
        await Promise.all(APP_SHELL.map(async function (url) {
            try {
                const response = await fetch(url, { cache: "reload" });
                if (response.ok) await cache.put(url, response);
            } catch (e) {
                console.warn("[sw] Onbellege alinamadi:", url, e);
            }
        }));

    })());

});

// *** ACTIVATE: Eski cache'leri temizle.

self.addEventListener("activate", function (event) {

    event.waitUntil((async function () {

        const names = await caches.keys();
        await Promise.all(names.map(function (name) {
            if (name !== CACHE_NAME && name.indexOf("mobile-fit-skeleton-") === 0) {
                return caches.delete(name);
            }
        }));

        await self.clients.claim();

    })());

});

// *** FETCH

self.addEventListener("fetch", function (event) {

    const request = event.request;

    // Sadece GET istekleri onbellege alinir.
    if (request.method !== "GET") return;

    // Baska sitelere giden istekler (CDN, API...) dokunulmadan gecer.
    if (new URL(request.url).origin !== self.location.origin) return;

    // SAYFA ACILISI: Once agdan dene, olmazsa cache'ten ver.
    if (request.mode === "navigate") {
        event.respondWith((async function () {
            try {
                const fresh = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                cache.put("./index.htm", fresh.clone());
                return fresh;
            } catch (e) {
                const cached = await caches.match("./index.htm", { ignoreSearch: true });
                return cached || Response.error();
            }
        })());
        return;
    }

    // DIGER DOSYALAR: Once cache, yoksa agdan al ve cache'e yaz.
    event.respondWith((async function () {

        const cached = await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;

        try {
            const response = await fetch(request);
            if (response.ok && response.type === "basic") {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, response.clone());
            }
            return response;
        } catch (e) {
            return Response.error();
        }

    })());

});

// *** MESSAGE: Sayfadan gelen komutlar.

self.addEventListener("message", function (event) {

    // Bekleyen yeni surumu hemen devreye al.
    if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();

    // Sayfa surum numarasini sorabilir.
    if (event.data && event.data.type === "GET_VERSION" && event.source) {
        event.source.postMessage({ type: "VERSION", version: CACHE_VERSION });
    }

});
