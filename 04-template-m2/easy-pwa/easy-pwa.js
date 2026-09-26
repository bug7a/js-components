/* Bismillah */

/*

Easy PWA Script - v26.09

One file that makes a web site an installable app (PWA): a shop, a company site, documentation, a tool...
It is added to the pages of the site itself, so payment pages, "Sign in with Google" and links work like on
the normal site. No library is needed.

- The same file is the page script AND the service worker. (It registers itself.)
- Online only by default: no page of the site is saved. (Cart, account and payment pages must never be cached.)
  When a page can not be opened (no internet), a small "No internet connection" page is shown instead.
  It opens the page again by itself when the connection comes back.
- Optional offline mode (offlineMode: true): the files of the site are saved while they are used ("network
  first": online the newest file is always used and saved again, offline the saved one), so the site also
  opens without internet. For documentation, tools and small apps; not for shops (see offlineExcludePaths).
- Optional launch screen in the installed app, a theme for the offline page ("auto", "light", "dark") and a
  page timeout for weak connections (pageTimeout).
- A small notice at the top while the connection is lost.
- Install banner at the bottom center: "Install" on Android / desktop Chrome and Edge,
  "Share > Add to Home Screen" help on iPhone and iPad. After the visitor closes it, it comes back
  after installBannerHideDays days. It is not shown in the installed app.
- API for your own install button: EasyPWA.install(), EasyPWA.canInstall(), EasyPWA.onInstallable(fn)...
- Adds the manifest link and the iOS meta tags to the page when the page does not have them.
- Texts: Turkish or English by the browser language (or your own texts below).
- No library is needed (no basic.js). The banner and the notice are in a Shadow DOM, so the CSS of the
  site does not change them and they do not change the site.

SETUP: (see readme.md)
1. Copy easy-pwa.js, manifest.webmanifest and the icon/ folder to the ROOT folder of the site, or to the folder
   of a site in a folder. (A service worker only controls the pages under its own folder:
   site.com/easy-pwa.js -> the whole site, site.com/docs/easy-pwa.js -> site.com/docs/.)
2. Change manifest.webmanifest (name, colors, start_url) and SETTINGS below.
3. Add to every page (usually to the footer of the theme):
   <script src="/easy-pwa.js" defer></script>        (or "/docs/easy-pwa.js" for a site in a folder)
4. The site must be https:// (localhost works for tests).

API:
EasyPWA.canInstall();                   // 1: install() can be used now (Android / desktop event, or iOS help)
EasyPWA.install();                      // Promise: "accepted", "dismissed", "ios" (help shown) or "unavailable"
EasyPWA.isInstalled();                  // 1: opened as the installed app
EasyPWA.isIOS();
EasyPWA.onInstallable(function () {});  // Runs when install() becomes possible. Returns a remover function.
EasyPWA.showInstallBanner();            // Shows the banner now (also when it was closed before).
EasyPWA.hideInstallBanner();
EasyPWA.clearOfflineFiles();            // Promise: deletes the saved files of the offline mode (this app only).
EasyPWA.hideLaunchScreen();             // Closes the launch screen (launchScreenHideByCode: true).
window.addEventListener("easypwa:installable", fn);   window.addEventListener("easypwa:installed", fn);

Started Date: September 2026
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/

(function () {

    "use strict";

    // *** SETTINGS: Change this part for your site.

    const SETTINGS = {

        // The name under the icon on iPhone and in the install banner.
        appName: "Demo Shop",

        // Files. Relative to this file (Ex: "icon/icon-192.png" -> site.com/icon/icon-192.png).
        manifestUrl: "manifest.webmanifest",
        iconUrl: "icon/icon-192.png",               // Icon of the install banner. "": no icon.
        appleTouchIconUrl: "icon/apple-touch-icon.png",

        // The color of the browser bar. Added only when the page has no <meta name="theme-color">.
        themeColor: "#141414",

        // Texts: "auto" (Turkish for a Turkish browser, English for the others), "tr" or "en".
        language: "auto",

        // false: removes the service worker of this file from the visitors' browsers (turn it off).
        serviceWorker: true,

        // The site has its own service worker on the same folder: false keeps it and this file does not
        // register (the banner still works). true replaces it with this file.
        replaceOtherServiceWorker: false,

        // The "No internet connection" page when a page can not be opened.
        offlinePage: true,

        // ms. A page that does not come in this time (a weak connection) shows the "No internet connection"
        // page. In the offline mode only when there is no saved copy of it. 0: the browser waits as before.
        pageTimeout: 0,

        // A small notice at the top while the connection is lost.
        offlineNotice: true,

        // *** OFFLINE MODE: false (default): nothing is saved, the site works online only.
        // true: every GET file of this site under the folder of this file (pages, scripts, styles, pictures,
        //   fetch() data...) is saved while it is used, so the site opens without internet too.
        //   "Network first": with internet the newest file is always used and saved again; without internet the
        //   saved one. So there is no version number to change: a changed file is saved again the next time it
        //   is opened online. Not saved: forms (POST), other sites (CDN, fonts, APIs of other domains), audio and
        //   video parts (206) and offlineExcludePaths.
        //   Do NOT use it for pages that change for every visitor (cart, account, payment, prices): an old copy
        //   would be shown offline. Exclude them with offlineExcludePaths, or keep offlineMode false.
        offlineMode: false,
        // Saved when the service worker is installed (the first visit), so they open offline before they are
        // used. Relative to this file. Ex: ["./", "index.htm", "js/site.js", "docs/chapter-1.md"]
        offlineFiles: [],
        // Never saved: addresses that start with these paths. Ex: ["/cart", "/account", "/api/"]
        offlineExcludePaths: [],
        // ms. A slow network (weak mobile signal): after this time the saved copy is shown, if there is one.
        // (The network answer still saves the new copy.) 0: always wait for the network.
        offlineNetworkTimeout: 4000,
        // Change it (2, 3...) to delete all the saved files of this app one time (Ex: after the site moved).
        offlineCacheVersion: 1,

        // The install banner at the bottom. (EasyPWA.install() works without it too.)
        installBanner: true,
        installBannerOnDesktop: false,              // Chrome / Edge on a computer can install too.
        installBannerDelay: 3000,                   // ms after the page is opened.
        installBannerHideDays: 14,                  // Closed by the visitor -> comes back after this many days.
        installBannerHiddenPaths: [],               // No banner on these pages. Ex: ["/cart", "/checkout", "/sepet", "/odeme"]

        // Colors of the "No internet connection" page and of the launch screen:
        // "auto" (light or dark by the setting of the device), "light" or "dark". The colors are in themes.
        theme: "auto",
        themes: {
            light: { page: "#F4F6F8", title: "rgba(0, 0, 0, 0.85)", text: "rgba(0, 0, 0, 0.55)", spinner: "#3D7A6B" },
            dark: { page: "#141414", title: "rgba(255, 255, 255, 0.9)", text: "rgba(255, 255, 255, 0.55)", spinner: "#5FB39F" },
        },

        // *** LAUNCH SCREEN: A screen over the page while it opens: icon, title, message and a spinner.
        // Shown in the installed app only (not in the browser), on the first page of a visit.
        // It closes when the page is loaded (window "load") and launchScreenMinDuration is over,
        // or when the site calls EasyPWA.hideLaunchScreen() (with launchScreenHideByCode: true).
        launchScreen: false,
        launchScreenIconUrl: "icon/icon-192.png",   // Relative to this file. "": no icon.
        launchScreenTitle: "",                      // "": appName. " ": no title.
        launchScreenMessage: "",                    // Ex: "Loading..."
        launchScreenMinDuration: 600,               // ms. Not a short flash on a fast page.
        launchScreenHideByCode: false,              // true: stays until EasyPWA.hideLaunchScreen() (max. 10 s).
        launchScreenInBrowser: false,               // true: also in the browser (for tests).

        // Colors of the install banner, the notice and the button of the offline page.
        colors: {
            banner: "#1F2326",
            bannerText: "#FFFFFF",
            bannerSoftText: "rgba(255, 255, 255, 0.65)",
            button: "#3D7A6B",
            buttonText: "#FFFFFF",
            notice: "#C0392B",
            noticeText: "#FFFFFF",
        },

    };

    // {name}: appName. {share}: the iOS share icon.
    const TEXTS = {
        tr: {
            installTitle: "Uygulamayı yükleyin",
            installMessage: "{name} uygulamasını cihazınıza ekleyin, bir uygulama gibi açın.",
            installButton: "Yükle",
            iosInstallTitle: "Ana Ekrana Ekleyin",
            iosInstallMessage: "Paylaş {share} düğmesine, sonra \"Ana Ekrana Ekle\"ye dokunun.",
            close: "Kapat",
            offlineTitle: "İnternet bağlantısı yok",
            offlineMessage: "Lütfen internet bağlantınızı kontrol edin. Bağlantı gelince sayfa kendiliğinden açılır.",
            offlineButton: "Tekrar dene",
            offlineNotice: "İnternet bağlantısı yok",
            offlineModeNotice: "Çevrimdışısınız: kaydedilmiş sayfalar gösteriliyor",
        },
        en: {
            installTitle: "Install the app",
            installMessage: "Add {name} to your device and open it like an app.",
            installButton: "Install",
            iosInstallTitle: "Add to Home Screen",
            iosInstallMessage: "Tap the Share {share} button, then \"Add to Home Screen\".",
            close: "Close",
            offlineTitle: "No internet connection",
            offlineMessage: "Please check your internet connection. The page opens again as soon as you are back online.",
            offlineButton: "Try again",
            offlineNotice: "No internet connection",
            offlineModeNotice: "You are offline: saved pages are shown",
        },
    };

    // *** ICONS (SVG: no file, so they also work offline)

    const OFFLINE_ICON_SVG =
        '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="#8C949E"' +
        ' stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M1 1l22 22"/>' +
        '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>' +
        '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>' +
        '<path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>' +
        '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>' +
        '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>' +
        '<line x1="12" y1="20" x2="12.01" y2="20"/>' +
        '</svg>';

    const SHARE_ICON_SVG =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"' +
        ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align: -3px;">' +
        '<path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>' +
        '</svg>';

    const STORAGE_KEY_HIDDEN = "easy-pwa:banner-hidden-at";
    const STORAGE_KEY_LAUNCHED = "easy-pwa:launched"; // sessionStorage: the launch screen was shown in this visit

    // *** START: The same file runs in two places.

    const isServiceWorker = (typeof ServiceWorkerGlobalScope !== "undefined") && (self instanceof ServiceWorkerGlobalScope);

    const getTexts = function () {
        let code = SETTINGS.language;
        if (code === "auto") code = String((self.navigator && self.navigator.language) || "en").toLowerCase().slice(0, 2);
        return TEXTS[code] || TEXTS.en;
    };

    const texts = getTexts();

    const escapeHtml = function (text) {
        return String(text).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
        });
    };

    // =====================================================================
    // *** SERVICE WORKER
    // =====================================================================

    const startServiceWorker = function () {

        // WHY: The saved files are never waited for (network first), so a new version starts at once.
        self.addEventListener("install", function (event) {
            self.skipWaiting();
            if (SETTINGS.offlineMode) event.waitUntil(saveOfflineFiles());
        });

        self.addEventListener("activate", function (event) {
            event.waitUntil((async function () {
                // WHY: The page request starts while the service worker is starting. Without it every
                //      page would wait for the service worker first.
                if ((SETTINGS.offlinePage || SETTINGS.offlineMode) && self.registration.navigationPreload) {
                    try { await self.registration.navigationPreload.enable(); } catch (error) {}
                }
                await deleteOldCaches();
                await self.clients.claim();
            })());
        });

        // EasyPWA.clearOfflineFiles() from the page
        self.addEventListener("message", function (event) {
            if (!event.data || event.data.type !== "easy-pwa:clear") return;
            event.waitUntil(deleteOldCaches(true).then(function () {
                if (event.source) event.source.postMessage({ type: "easy-pwa:cleared" });
            }));
        });

        if (SETTINGS.offlineMode) {
            self.addEventListener("fetch", onOfflineModeFetch);
            return;
        }

        if (!SETTINGS.offlinePage) return; // No fetch handler: the browser does everything as before.

        self.addEventListener("fetch", function (event) {

            const request = event.request;

            // Only the opening of a page. Images, scripts, API calls, forms (POST) are not touched.
            if (request.mode !== "navigate" || request.method !== "GET") return;
            if (new URL(request.url).origin !== self.location.origin) return;

            event.respondWith((async function () {
                try {
                    return await withPageTimeout((async function () {
                        const preloaded = await event.preloadResponse;
                        if (preloaded) return preloaded;
                        return await fetch(request);
                    })());
                } catch (error) {
                    return createOfflineResponse();
                }
            })());

        });

    };

    // SETTINGS.pageTimeout: a page that does not come in time is an error (-> the "No internet connection" page).
    // WHY: The request itself is not stopped: in the offline mode its answer is still saved.
    const withPageTimeout = function (promise) {
        const ms = SETTINGS.pageTimeout;
        if (!(ms > 0)) return promise;
        return new Promise(function (resolve, reject) {
            const timer = setTimeout(function () { reject(new Error("pageTimeout")); }, ms);
            promise.then(
                function (value) { clearTimeout(timer); resolve(value); },
                function (error) { clearTimeout(timer); reject(error); }
            );
        });
    };

    // *** OFFLINE MODE (service worker)

    // WHY: The name has the folder of the service worker. Apps on the same domain (site.com/app1/, site.com/app2/)
    //      share the saved files of the domain; each one only reads and deletes its own.
    const CACHE_PREFIX = "easy-pwa-offline:";
    const getCacheName = function () {
        return CACHE_PREFIX + self.registration.scope + ":v" + SETTINGS.offlineCacheVersion;
    };

    // Deletes the old saved files of this app (an old version, or all of them when the mode is off / all is true).
    const deleteOldCaches = async function (all) {
        const current = getCacheName();
        const ownPrefix = CACHE_PREFIX + self.registration.scope + ":";
        const names = await caches.keys();
        await Promise.all(names.map(function (name) {
            if (name.indexOf(ownPrefix) !== 0) return null; // Not this app.
            if (!all && SETTINGS.offlineMode && name === current) return null;
            return caches.delete(name);
        }));
    };

    // The files of the app itself: this file, the manifest and every icon in it, the banner, iOS and launch icons.
    // WHY: So the installed app opens offline with its icons, without writing them into offlineFiles.
    const getOwnFiles = async function () {
        const files = [self.location.pathname, SETTINGS.manifestUrl, SETTINGS.iconUrl, SETTINGS.appleTouchIconUrl];
        if (SETTINGS.launchScreen) files.push(SETTINGS.launchScreenIconUrl);
        if (SETTINGS.manifestUrl) {
            try {
                const manifestUrl = new URL(SETTINGS.manifestUrl, self.location.href);
                const manifest = await (await fetch(manifestUrl.href, { cache: "reload" })).json();
                (manifest.icons || []).forEach(function (icon) {
                    if (icon && icon.src) files.push(new URL(icon.src, manifestUrl).href);
                });
            } catch (error) {
                console.warn("Easy PWA: the icons of the manifest can not be read.");
            }
        }
        return files.filter(Boolean);
    };

    // SETTINGS.offlineFiles and the files of the app: saved at the first visit. A file that can not be read
    // is written to the console, the others are still saved.
    const saveOfflineFiles = async function () {
        const paths = SETTINGS.offlineFiles.concat(await getOwnFiles());
        const urls = paths.map(function (path) { return new URL(path, self.location.href).href; });
        const unique = urls.filter(function (url, index) { return urls.indexOf(url) === index; });
        const cache = await caches.open(getCacheName());
        await Promise.all(unique.map(async function (url) {
            try {
                // WHY: "reload": the newest file from the server, not an old copy from the HTTP cache of the browser.
                const response = await fetch(new Request(url, { cache: "reload" }));
                if (response.ok) await cache.put(url, response);
                else console.warn("Easy PWA: offlineFiles: " + response.status + " " + url);
            } catch (error) {
                console.warn("Easy PWA: offlineFiles: can not be read " + url);
            }
        }));
    };

    // Only the GET files of this site, under the folder of the service worker, and not excluded.
    const canSave = function (request) {
        if (request.method !== "GET") return 0;
        if (request.headers.has("range")) return 0; // Parts of audio / video
        const url = new URL(request.url);
        if (url.origin !== self.location.origin) return 0;
        if (url.pathname.indexOf(new URL(self.registration.scope).pathname) !== 0) return 0;
        const excluded = SETTINGS.offlineExcludePaths.some(function (path) { return url.pathname.indexOf(path) === 0; });
        return excluded ? 0 : 1;
    };

    // The saved copy: the same address, or the same file with other ?query (Ex: page.htm?lang=tr), or for the
    // start page of the app (app/, app/index.html, app/index.htm) the one of them that is saved.
    // WHY: Only for the start page: another page that is not saved shows the "No internet connection" page,
    //      not the start page under its address.
    const findSaved = async function (request) {
        const cache = await caches.open(getCacheName());
        let response = await cache.match(request);
        if (!response) response = await cache.match(request, { ignoreSearch: true });
        const scopePath = new URL(self.registration.scope).pathname;
        const path = new URL(request.url).pathname;
        const isStartPage = (path === scopePath || path === scopePath + "index.html" || path === scopePath + "index.htm");
        if (!response && request.mode === "navigate" && isStartPage) {
            const starts = ["", "index.html", "index.htm"];
            for (let i = 0; i < starts.length && !response; i++) {
                response = await cache.match(new URL(starts[i], self.registration.scope).href, { ignoreSearch: true });
            }
        }
        return response || null;
    };

    const onOfflineModeFetch = function (event) {

        const request = event.request;

        if (!canSave(request)) {
            // A page that is not saved (excluded): the "No internet connection" page when it can not be opened.
            if (request.mode === "navigate" && request.method === "GET" && SETTINGS.offlinePage &&
                new URL(request.url).origin === self.location.origin) {
                // WHY: The page request the browser already started (navigation preload) is used, not a second one.
                event.respondWith(withPageTimeout((async function () {
                    const preloaded = await event.preloadResponse;
                    return preloaded || await fetch(request);
                })()).catch(function () { return createOfflineResponse(); }));
            }
            return; // Other sites, forms...: the browser does everything as before.
        }

        event.respondWith((async function () {

            // NETWORK: saves the answer when it is a whole, good file of this site.
            let saving = null;
            const fromNetwork = (async function () {
                const preloaded = (request.mode === "navigate") ? await event.preloadResponse : null;
                const response = preloaded || await fetch(request);
                if (response.ok && response.status === 200 && response.type === "basic") {
                    const copy = response.clone();
                    saving = caches.open(getCacheName()).then(function (cache) { return cache.put(request, copy); });
                }
                return response;
            })();

            // WHY: Called now, not when the answer comes: the saved copy can be shown first (slow network), and
            //      the service worker must stay alive until the new copy is saved.
            event.waitUntil(fromNetwork.then(function () { return saving; }).catch(function () {}));

            // WHY: A slow network: the saved copy after offlineNetworkTimeout, if there is one.
            //      The network answer still comes and saves the new copy (event.waitUntil above).
            const timeout = SETTINGS.offlineNetworkTimeout;
            let timer = null;
            const fromTimeout = (timeout > 0) ? new Promise(function (resolve) {
                timer = setTimeout(function () { findSaved(request).then(resolve); }, timeout);
            }) : null;

            // A page without a saved copy: the "No internet connection" page after pageTimeout.
            const network = (request.mode === "navigate") ? withPageTimeout(fromNetwork) : fromNetwork;

            try {
                const response = await (fromTimeout
                    ? Promise.race([network, fromTimeout.then(function (saved) { return saved || network; })])
                    : network);
                clearTimeout(timer);
                return response;
            } catch (error) {
                clearTimeout(timer);
                const saved = await findSaved(request);
                if (saved) return saved;
                if (request.mode === "navigate" && SETTINGS.offlinePage) return createOfflineResponse();
                return Response.error();
            }

        })());

    };

    // The "No internet connection" page. It is created here, so no file is needed.
    const createOfflineResponse = function () {

        const c = SETTINGS.colors;
        const lang = (texts === TEXTS.tr) ? "tr" : "en";

        // SETTINGS.theme: one theme, or both by the setting of the device ("auto").
        const vars = function (theme) {
            return "--bg: " + theme.page + "; --title: " + theme.title + "; --text: " + theme.text + ";";
        };
        const themes = SETTINGS.themes;
        const themeCss = (themes[SETTINGS.theme])
            ? ":root { color-scheme: " + SETTINGS.theme + "; " + vars(themes[SETTINGS.theme]) + " }"
            : ":root { color-scheme: light dark; " + vars(themes.light) + " }" +
              "@media (prefers-color-scheme: dark) { :root { " + vars(themes.dark) + " } }";

        const html = '<!DOCTYPE html><html lang="' + lang + '"><head>' +
            '<meta charset="utf-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' +
            '<meta name="theme-color" content="' + escapeHtml(SETTINGS.themeColor) + '">' +
            '<title>' + escapeHtml(texts.offlineTitle) + '</title>' +
            '<style>' +
            themeCss +
            'html, body { margin: 0; height: 100%; background: var(--bg); }' +
            'body { display: flex; align-items: center; justify-content: center; padding: 24px; box-sizing: border-box; text-align: center;' +
            ' font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }' +
            '.box { max-width: 340px; }' +
            '.icon { width: 64px; height: 64px; margin: 0 auto 20px; }' +
            'h1 { margin: 0 0 10px; font-size: 20px; font-weight: 600; color: var(--title); }' +
            'p { margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: var(--text); }' +
            'button { font: inherit; font-size: 15px; padding: 12px 28px; border: 0; border-radius: 10px; cursor: pointer;' +
            ' background: ' + c.button + '; color: ' + c.buttonText + '; }' +
            '</style></head><body>' +
            '<div class="box">' +
            '<div class="icon">' + OFFLINE_ICON_SVG + '</div>' +
            '<h1>' + escapeHtml(texts.offlineTitle) + '</h1>' +
            '<p>' + escapeHtml(texts.offlineMessage) + '</p>' +
            '<button type="button" id="retry">' + escapeHtml(texts.offlineButton) + '</button>' +
            '</div>' +
            '<script>' +
            'document.getElementById("retry").addEventListener("click", function () { location.reload(); });' +
            'window.addEventListener("online", function () { location.reload(); });' +
            '</script>' +
            '</body></html>';

        // WHY: Status 200. A browser checks that the start page of an app opens offline (installability).
        return new Response(html, {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        });

    };

    // =====================================================================
    // *** PAGE
    // =====================================================================

    const startPage = function () {

        // This file: its address gives the folder of the service worker and of the other files.
        const scriptElement = document.currentScript || document.querySelector("script[src*='easy-pwa']");
        const scriptUrl = new URL((scriptElement && scriptElement.src) || "/easy-pwa.js", location.href);
        const workerUrl = new URL(scriptUrl.pathname, scriptUrl.origin); // WHY: Without "?v=..." the registration stays the same.
        const scope = new URL("./", workerUrl).pathname;

        const resolve = function (path) {
            return (path) ? new URL(path, scriptUrl).href : "";
        };

        let installEvent = null;
        let banner = null;
        let notice = null;
        let bannerTimer = null;
        const installableListeners = [];

        // *** HELPERS:

        const log = function (text, type) {
            (console[type || "log"] || console.log)("Easy PWA: " + text);
        };

        const isIOS = function () {
            const ua = navigator.userAgent || "";
            if (/iPad|iPhone|iPod/.test(ua)) return 1;
            // WHY: iPadOS says "Macintosh". A touch screen tells it apart.
            if (ua.indexOf("Macintosh") > -1 && navigator.maxTouchPoints > 1) return 1;
            return 0;
        };

        // The browsers inside Instagram, Facebook... can not install an app.
        const isInAppBrowser = function () {
            return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|musical_ly|GSA\//.test(navigator.userAgent || "") ? 1 : 0;
        };

        const isInstalled = function () {
            if (navigator.standalone === true) return 1; // iOS
            if (window.matchMedia && window.matchMedia("(display-mode: standalone), (display-mode: fullscreen), (display-mode: minimal-ui)").matches) return 1;
            return 0;
        };

        const isPhoneOrTablet = function () {
            if (isIOS()) return 1;
            if (/Android|Mobile/i.test(navigator.userAgent || "")) return 1;
            return (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) ? 1 : 0;
        };

        const canShowIosHelp = function () {
            return (isIOS() && !isInstalled() && !isInAppBrowser()) ? 1 : 0;
        };

        const canInstall = function () {
            if (isInstalled()) return 0;
            if (installEvent) return 1;
            return canShowIosHelp();
        };

        const storageGet = function (key) {
            try { return localStorage.getItem(key); } catch (error) { return null; }
        };

        const storageSet = function (key, value) {
            try { localStorage.setItem(key, value); } catch (error) {}
        };

        const whenBodyReady = function (fn) {
            if (document.body) fn();
            else document.addEventListener("DOMContentLoaded", fn);
        };

        // *** HEAD TAGS: Added only when the page does not have them.

        const addHeadTags = function () {

            const head = document.head;
            if (!head) return;

            const addLink = function (rel, href) {
                if (!href || head.querySelector("link[rel='" + rel + "']")) return;
                const link = document.createElement("link");
                link.rel = rel;
                link.href = href;
                head.appendChild(link);
            };

            const addMeta = function (name, content) {
                if (!content || head.querySelector("meta[name='" + name + "']")) return;
                const meta = document.createElement("meta");
                meta.name = name;
                meta.content = content;
                head.appendChild(meta);
            };

            addLink("manifest", resolve(SETTINGS.manifestUrl));
            addLink("apple-touch-icon", resolve(SETTINGS.appleTouchIconUrl));
            addMeta("theme-color", SETTINGS.themeColor);
            addMeta("mobile-web-app-capable", "yes");
            addMeta("apple-mobile-web-app-capable", "yes");
            addMeta("apple-mobile-web-app-title", SETTINGS.appName);
            // WHY: "default" keeps the page under the status bar. ("black-translucent" needs safe-area CSS on the site.)
            addMeta("apple-mobile-web-app-status-bar-style", "default");

        };

        // *** SERVICE WORKER:

        const registerServiceWorker = function () {

            if (!("serviceWorker" in navigator)) return;

            if (!window.isSecureContext) {
                log("A service worker needs https:// (or localhost). The app can not be installed here.", "warn");
                return;
            }

            if (workerUrl.origin !== location.origin) {
                log("easy-pwa.js must be on the same site as the page (not on a CDN).", "warn");
                return;
            }

            const container = navigator.serviceWorker;

            // Turned off: remove the service worker of this file.
            if (!SETTINGS.serviceWorker) {
                container.getRegistrations().then(function (registrations) {
                    registrations.forEach(function (registration) {
                        const worker = registration.active || registration.waiting || registration.installing;
                        if (worker && new URL(worker.scriptURL).pathname === workerUrl.pathname) {
                            registration.unregister();
                            log("Service worker removed (serviceWorker: false).");
                        }
                    });
                });
                return;
            }

            container.getRegistration(scope).then(function (registration) {

                const worker = registration && (registration.active || registration.waiting || registration.installing);
                const isSameScope = registration && new URL(registration.scope).pathname === scope;
                const isOther = worker && new URL(worker.scriptURL).pathname !== workerUrl.pathname;

                if (isSameScope && isOther && !SETTINGS.replaceOtherServiceWorker) {
                    log("The site has another service worker here (" + worker.scriptURL + "). It is kept, so pages " +
                        "are not changed by easy-pwa.js. Set replaceOtherServiceWorker: true to use easy-pwa.js instead.", "warn");
                    return;
                }

                if (scope !== "/") {
                    log("easy-pwa.js is not in the root folder, so it only works for the pages under " + scope, "warn");
                }

                return container.register(workerUrl.href, { scope: scope });

            }).catch(function (error) {
                log("Service worker registration failed: " + error, "error");
            });

        };

        // *** SHADOW DOM HOST: The CSS of the site does not reach inside, ours does not reach outside.

        const createHost = function (name, css, html) {
            const host = document.createElement("div");
            host.setAttribute("data-easy-pwa", name);
            const root = (host.attachShadow) ? host.attachShadow({ mode: "open" }) : host;
            root.innerHTML = "<style>:host { all: initial; }" + css + "</style>" + html;
            document.body.appendChild(host);
            return { host: host, root: root };
        };

        // *** INSTALL BANNER:

        const isBannerHiddenByVisitor = function () {
            const hiddenAt = Number(storageGet(STORAGE_KEY_HIDDEN)) || 0;
            return (Date.now() - hiddenAt) < SETTINGS.installBannerHideDays * 24 * 60 * 60 * 1000;
        };

        const isBannerHiddenOnThisPage = function () {
            const path = location.pathname;
            return SETTINGS.installBannerHiddenPaths.some(function (hiddenPath) {
                return path.indexOf(hiddenPath) === 0;
            });
        };

        const isBannerAllowed = function () {
            if (!SETTINGS.installBanner) return 0;
            if (isBannerHiddenByVisitor() || isBannerHiddenOnThisPage()) return 0;
            if (!isPhoneOrTablet() && !SETTINGS.installBannerOnDesktop) return 0;
            return 1;
        };

        const scheduleBanner = function () {
            if (!isBannerAllowed() || !canInstall()) return;
            clearTimeout(bannerTimer);
            bannerTimer = setTimeout(function () {
                whenBodyReady(function () { showInstallBanner(0); });
            }, SETTINGS.installBannerDelay);
        };

        // Fills an element with a text that can have {name} and {share}.
        const fillText = function (element, text) {
            const parts = String(text).replace(/\{name\}/g, SETTINGS.appName).split("{share}");
            element.textContent = "";
            parts.forEach(function (part, index) {
                if (index > 0) {
                    const icon = document.createElement("span");
                    icon.innerHTML = SHARE_ICON_SVG;
                    element.appendChild(icon);
                }
                element.appendChild(document.createTextNode(part));
            });
        };

        // force: 1 -> also when the visitor closed it before (EasyPWA.showInstallBanner / install on iOS).
        const showInstallBanner = function (force) {

            if (banner || !canInstall()) return;
            if (!force && !isBannerAllowed()) return;
            if (!document.body) return;

            const isIosHelp = !installEvent;
            const c = SETTINGS.colors;

            const css =
                ".banner { position: fixed; left: 50%; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); z-index: 2147483000;" +
                " width: min(440px, calc(100% - 24px)); box-sizing: border-box; display: flex; align-items: center; gap: 12px;" +
                " padding: 12px 12px 12px 14px; border-radius: 14px; background: " + c.banner + "; color: " + c.bannerText + ";" +
                " box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;" +
                " transform: translate(-50%, 20px); opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease; }" +
                ".banner.open { transform: translate(-50%, 0); opacity: 1; }" +
                ".icon { width: 44px; height: 44px; border-radius: 10px; flex: 0 0 auto; object-fit: cover; }" +
                ".texts { flex: 1 1 auto; min-width: 0; }" +
                ".title { font-size: 15px; font-weight: 600; line-height: 1.3; }" +
                ".message { font-size: 13px; line-height: 1.4; margin-top: 2px; color: " + c.bannerSoftText + "; }" +
                ".install { flex: 0 0 auto; font: inherit; font-size: 14px; font-weight: 600; padding: 9px 16px; border: 0; border-radius: 9px;" +
                " cursor: pointer; background: " + c.button + "; color: " + c.buttonText + "; }" +
                ".close { flex: 0 0 auto; width: 30px; height: 30px; border: 0; border-radius: 15px; cursor: pointer; font-size: 20px; line-height: 30px;" +
                " padding: 0; background: transparent; color: " + c.bannerSoftText + "; }" +
                ".close:hover { background: rgba(255, 255, 255, 0.1); }" +
                "@media (prefers-reduced-motion: reduce) { .banner { transition: none; } }";

            const html =
                '<div class="banner" role="dialog">' +
                '<img class="icon" alt="">' +
                '<div class="texts"><div class="title"></div><div class="message"></div></div>' +
                '<button class="install" type="button"></button>' +
                '<button class="close" type="button">&times;</button>' +
                '</div>';

            const parts = createHost("install-banner", css, html);
            const root = parts.root;
            const card = root.querySelector(".banner");
            const icon = root.querySelector(".icon");
            const btnInstall = root.querySelector(".install");
            const btnClose = root.querySelector(".close");

            card.setAttribute("aria-label", isIosHelp ? texts.iosInstallTitle : texts.installTitle);
            fillText(root.querySelector(".title"), isIosHelp ? texts.iosInstallTitle : texts.installTitle);
            fillText(root.querySelector(".message"), isIosHelp ? texts.iosInstallMessage : texts.installMessage);
            btnClose.setAttribute("aria-label", texts.close);
            btnClose.title = texts.close;

            if (SETTINGS.iconUrl) icon.src = resolve(SETTINGS.iconUrl);
            else icon.style.display = "none";

            if (isIosHelp) {
                btnInstall.style.display = "none"; // iOS has no install button: the visitor uses the Share menu.
            } else {
                btnInstall.textContent = texts.installButton;
                btnInstall.addEventListener("click", function () { install(); });
            }

            btnClose.addEventListener("click", function () {
                storageSet(STORAGE_KEY_HIDDEN, String(Date.now()));
                hideInstallBanner();
            });

            banner = parts;
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { card.classList.add("open"); });
            });

        };

        const hideInstallBanner = function () {
            clearTimeout(bannerTimer);
            if (!banner) return;
            const oldBanner = banner;
            banner = null;
            const card = oldBanner.root.querySelector(".banner");
            if (card) card.classList.remove("open");
            setTimeout(function () { oldBanner.host.remove(); }, 350);
        };

        // Android / desktop: the install window of the browser. iOS: the help banner.
        const install = function () {

            if (installEvent) {
                const event = installEvent;
                installEvent = null; // WHY: prompt() works only one time for an event.
                hideInstallBanner();
                event.prompt();
                return event.userChoice.then(function (choice) {
                    return choice.outcome; // "accepted" or "dismissed"
                });
            }

            if (canShowIosHelp()) {
                whenBodyReady(function () { showInstallBanner(1); });
                return Promise.resolve("ios");
            }

            return Promise.resolve("unavailable");

        };

        const notifyInstallable = function () {
            installableListeners.slice().forEach(function (fn) {
                try { fn(); } catch (error) { log(String(error), "error"); }
            });
            window.dispatchEvent(new CustomEvent("easypwa:installable"));
        };

        const onInstallable = function (fn) {
            installableListeners.push(fn);
            if (canInstall()) setTimeout(fn, 0);
            return function () {
                const index = installableListeners.indexOf(fn);
                if (index > -1) installableListeners.splice(index, 1);
            };
        };

        // *** OFFLINE NOTICE:

        const showNotice = function () {

            if (notice || !SETTINGS.offlineNotice || !document.body) return;

            const c = SETTINGS.colors;
            const css =
                ".notice { position: fixed; left: 50%; top: calc(12px + env(safe-area-inset-top, 0px)); z-index: 2147483001;" +
                " transform: translate(-50%, -12px); opacity: 0; transition: transform 0.3s ease, opacity 0.3s ease;" +
                " padding: 8px 16px; border-radius: 20px; background: " + c.notice + "; color: " + c.noticeText + ";" +
                " font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;" +
                " font-size: 14px; font-weight: 600; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25); pointer-events: none;" +
                " width: max-content; max-width: calc(100vw - 32px); box-sizing: border-box; text-align: center; }" +
                ".notice.open { transform: translate(-50%, 0); opacity: 1; }" +
                "@media (prefers-reduced-motion: reduce) { .notice { transition: none; } }";

            notice = createHost("offline-notice", css, '<div class="notice" role="status"></div>');
            const element = notice.root.querySelector(".notice");
            // WHY: In the offline mode the site still works: the notice says that saved pages are shown.
            element.textContent = SETTINGS.offlineMode ? texts.offlineModeNotice : texts.offlineNotice;
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { element.classList.add("open"); });
            });

        };

        const hideNotice = function () {
            if (!notice) return;
            const oldNotice = notice;
            notice = null;
            const element = oldNotice.root.querySelector(".notice");
            if (element) element.classList.remove("open");
            setTimeout(function () { oldNotice.host.remove(); }, 350);
        };

        // *** LAUNCH SCREEN:

        let launch = null;

        const getPageTheme = function () {
            const themes = SETTINGS.themes;
            if (themes[SETTINGS.theme]) return themes[SETTINGS.theme];
            const isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            return isDark ? themes.dark : themes.light;
        };

        const canShowLaunchScreen = function () {
            if (!SETTINGS.launchScreen) return 0;
            if (!isInstalled() && !SETTINGS.launchScreenInBrowser) return 0;
            // WHY: Only the first page of a visit: a site with many pages would show it on every link.
            let shown = null;
            try { shown = sessionStorage.getItem(STORAGE_KEY_LAUNCHED); } catch (error) {}
            return shown ? 0 : 1;
        };

        const showLaunchScreen = function () {

            if (launch || !canShowLaunchScreen() || !document.body) return;
            try { sessionStorage.setItem(STORAGE_KEY_LAUNCHED, "1"); } catch (error) {}

            const t = getPageTheme();
            const title = (SETTINGS.launchScreenTitle === "") ? SETTINGS.appName : SETTINGS.launchScreenTitle.trim();
            const css =
                ".launch { position: fixed; inset: 0; z-index: 2147483002; display: flex; flex-direction: column;" +
                " align-items: center; justify-content: center; gap: 14px; padding: 24px; box-sizing: border-box; text-align: center;" +
                " background: " + t.page + "; transition: opacity 0.3s ease;" +
                " font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif; }" +
                ".launch.closing { opacity: 0; }" +
                ".icon { width: 88px; height: 88px; border-radius: 20px; object-fit: cover; }" +
                ".title { font-size: 20px; font-weight: 600; color: " + t.title + "; }" +
                ".message { font-size: 14px; line-height: 1.5; color: " + t.text + "; max-width: 320px; }" +
                ".spinner { width: 28px; height: 28px; margin-top: 10px; border-radius: 50%; box-sizing: border-box;" +
                " border: 3px solid " + t.text + "; border-top-color: " + t.spinner + "; opacity: 0.9; animation: spin 0.9s linear infinite; }" +
                "@keyframes spin { to { transform: rotate(360deg); } }" +
                "@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.5s; } .launch { transition: none; } }";

            const html = '<div class="launch" role="status" aria-busy="true">' +
                (SETTINGS.launchScreenIconUrl ? '<img class="icon" alt="" src="' + escapeHtml(resolve(SETTINGS.launchScreenIconUrl)) + '">' : "") +
                (title ? '<div class="title">' + escapeHtml(title) + '</div>' : "") +
                (SETTINGS.launchScreenMessage ? '<div class="message">' + escapeHtml(SETTINGS.launchScreenMessage) + '</div>' : "") +
                '<div class="spinner"></div>' +
                '</div>';

            launch = createHost("launch-screen", css, html);
            launch.shownAt = Date.now();
            launch.pageLoaded = (document.readyState === "complete") ? 1 : 0;
            launch.byCode = SETTINGS.launchScreenHideByCode ? 0 : 1; // 1: nothing to wait for from the site

            if (!launch.pageLoaded) window.addEventListener("load", function () { if (launch) { launch.pageLoaded = 1; closeLaunchScreenWhenReady(); } });
            // WHY: A site that never calls hideLaunchScreen() must not stay covered.
            launch.safetyTimer = setTimeout(function () { hideLaunchScreenNow(); }, 10000);
            closeLaunchScreenWhenReady();

        };

        // Closes it when the page is loaded, the site is ready (hideByCode) and the minimum time is over.
        const closeLaunchScreenWhenReady = function () {
            if (!launch || !launch.pageLoaded || !launch.byCode) return;
            const wait = Math.max(0, SETTINGS.launchScreenMinDuration - (Date.now() - launch.shownAt));
            clearTimeout(launch.closeTimer);
            launch.closeTimer = setTimeout(hideLaunchScreenNow, wait);
        };

        const hideLaunchScreenNow = function () {
            if (!launch) return;
            const old = launch;
            launch = null;
            clearTimeout(old.safetyTimer);
            clearTimeout(old.closeTimer);
            const element = old.root.querySelector(".launch");
            if (element) element.classList.add("closing");
            setTimeout(function () { old.host.remove(); }, 320);
        };

        // EasyPWA.hideLaunchScreen(): the site is ready (with launchScreenHideByCode: true).
        const hideLaunchScreen = function () {
            if (!launch) return;
            launch.byCode = 1;
            closeLaunchScreenWhenReady();
        };

        // *** OFFLINE MODE (page):

        // Deletes the saved files of this app. (The next online visit saves them again when offlineMode is on.)
        const clearOfflineFiles = function () {
            if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) return Promise.resolve(0);
            const worker = navigator.serviceWorker.controller;
            return new Promise(function (resolve) {
                const onMessage = function (event) {
                    if (!event.data || event.data.type !== "easy-pwa:cleared") return;
                    navigator.serviceWorker.removeEventListener("message", onMessage);
                    resolve(1);
                };
                navigator.serviceWorker.addEventListener("message", onMessage);
                worker.postMessage({ type: "easy-pwa:clear" });
            });
        };

        // *** EVENTS:

        // The browser says the app can be installed (Android, desktop Chrome / Edge).
        window.addEventListener("beforeinstallprompt", function (event) {
            event.preventDefault(); // WHY: Our banner or the site's own button (EasyPWA.install) shows it.
            installEvent = event;
            notifyInstallable();
            scheduleBanner();
        });

        window.addEventListener("appinstalled", function () {
            installEvent = null;
            hideInstallBanner();
            window.dispatchEvent(new CustomEvent("easypwa:installed"));
        });

        window.addEventListener("offline", function () { whenBodyReady(showNotice); });
        window.addEventListener("online", hideNotice);

        // *** INIT:

        addHeadTags();

        // WHY: First: it must cover the page as early as possible.
        whenBodyReady(showLaunchScreen);

        // WHY: After the page is loaded, so the service worker does not slow down the first view of the site.
        if (document.readyState === "complete") registerServiceWorker();
        else window.addEventListener("load", registerServiceWorker);

        // iOS has no install event: the help banner is planned now.
        if (canShowIosHelp()) {
            scheduleBanner();
            setTimeout(notifyInstallable, 0);
        }

        if (!navigator.onLine) whenBodyReady(showNotice);

        // *** PUBLIC API:
        window.EasyPWA = {
            version: "26.09",
            canInstall: canInstall,
            install: install,
            isInstalled: isInstalled,
            isIOS: isIOS,
            onInstallable: onInstallable,
            showInstallBanner: function () { whenBodyReady(function () { showInstallBanner(1); }); },
            hideInstallBanner: hideInstallBanner,
            clearOfflineFiles: clearOfflineFiles,
            hideLaunchScreen: hideLaunchScreen,
        };

    };

    if (isServiceWorker) startServiceWorker();
    else if (typeof window !== "undefined" && typeof document !== "undefined") startPage();

})();
