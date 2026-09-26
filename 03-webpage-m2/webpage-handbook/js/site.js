/* Bismillah */

/*

basic.js Handbook Website - Site Controller - v26.09

- El kitabı dosyalarını okur, sayfayı kurar, adres çubuğuna göre bölümü açar, arama dizinini hazırlar.
- Adresler: index.htm (ilk bölüm), index.htm#/box (bölüm), index.htm#/box/examples (bölümdeki başlık)
- Reads the handbook files, builds the page, opens the chapter by the address and prepares the search index.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const SiteApp = {
    chapters: [],       // { id, file, group, doc, title, shortTitle }
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

    SITE.injectCss();
    CodeHighlight.injectCss();

    if (typeof Toast === "function") {
        Toast.setOptions({ position: "bottom-center", theme: "dark" });
    }

    SiteApp.load();

    page.onResize(SiteApp.onPageResize);

};

// *** LOAD:

SiteApp.load = function () {

    const T = SITE.T;
    const folder = CONFIG.handbookPath + CONFIG.languageFolders[SITE.lang] + "/";

    // Menü, yüklenmeden de görünsün diye bölümler dosya adıyla hazırlanır.
    SiteApp.chapters = CONFIG.chapters.map(function (item) {
        return { id: item.id, file: item.file, group: item.group, doc: null, title: item.id, shortTitle: item.id };
    });

    Markdown.resolveFile = function (fileName) {
        const chapter = SiteApp.chapters.find(function (item) { return item.file === fileName; });
        return chapter ? chapter.id : null;
    };

    const tasks = SiteApp.chapters.map(function (chapter) {
        return function () {
            if (!chapter.file) return Promise.resolve(T.quickStart);
            return SiteApp.fetchText(folder + chapter.file);
        };
    });

    SiteApp.runLimited(tasks, CONFIG.loadConcurrency).then(function (texts) {

        texts.forEach(function (text, index) {
            const chapter = SiteApp.chapters[index];
            chapter.doc = Markdown.parse(text);
            chapter.title = chapter.doc.title.replace(/^basic\.js\s*[—–-]\s*/, "") || chapter.id;
            // "Box (Box Object)" -> "Box"
            chapter.shortTitle = chapter.title.replace(/\s*\([^)]*\)\s*$/, "") || chapter.title;
        });

        SiteSearch.build(SiteApp.chapters);

        Layout.build();
        window.addEventListener("hashchange", SiteApp.route);
        SiteApp.route();
        SiteApp.hideLaunchScreen();

    }).catch(function (error) {

        console.error(error);

        // WHY: Menü ve arama bölümler yüklenince kurulur; hata ekranı için sadece içerik kutusu yeter.
        if (!DocView.box) {
            DocView.box = startBox(0, 0, "100%", "100%", { color: SITE.BG, scrollY: 1 });
            endBox();
        }

        const message = (location.protocol == "file:") ? T.fileProtocol : T.loadError + "\n" + (error && error.message ? error.message : "");
        DocView.showMessage(message, T.retry, function () { location.reload(); });
        SiteApp.hideLaunchScreen();

    });

};

// The launch screen of the installed app (easy-pwa.js, launchScreenHideByCode) closes when the chapters are drawn.
SiteApp.hideLaunchScreen = function () {
    if (window.EasyPWA && EasyPWA.hideLaunchScreen) EasyPWA.hideLaunchScreen();
};

// Dosyayı okur; bağlantı hatasında bir kez daha dener.
SiteApp.fetchText = function (url, retries = 1) {

    return fetch(url).then(function (response) {
        if (!response.ok) throw new Error(url + ": " + response.status + " " + response.statusText);
        return response.text();
    }).catch(function (error) {
        if (retries <= 0 || /: \d{3}/.test(error.message)) throw error;
        return basic.sleep(300).then(function () { return SiteApp.fetchText(url, retries - 1); });
    });

};

// İşleri aynı anda en fazla "limit" tane çalıştırır; sonuçlar sırayla döner.
// WHY: Bazı sunucular (örneğin python -m http.server) aynı anda çok bağlantıda bağlantıyı kesiyor.
SiteApp.runLimited = function (tasks, limit) {

    return new Promise(function (resolve, reject) {

        const results = new Array(tasks.length);
        let next = 0;
        let done = 0;
        let failed = 0;

        if (!tasks.length) { resolve(results); return; }

        const runNext = function () {
            if (failed || next >= tasks.length) return;
            const index = next++;
            tasks[index]().then(function (value) {
                results[index] = value;
                done++;
                if (done === tasks.length) resolve(results);
                else runNext();
            }, function (error) {
                failed = 1;
                reject(error);
            });
        };

        for (let i = 0; i < Math.min(limit, tasks.length); i++) runNext();

    });

};

// *** ROUTING:

// "#/box" -> { id: "box", section: "" }, "#/box/examples" -> { id: "box", section: "examples" }
SiteApp.parseHash = function () {

    const match = /^#\/([\w-]+)(?:\/([\w-]+))?/.exec(location.hash);
    if (!match) return { id: "", section: "" };

    return { id: match[1], section: match[2] || "" };

};

SiteApp.route = function () {

    const target = SiteApp.parseHash();
    const chapter = SiteApp.findChapter(target.id) || SiteApp.chapters[0];

    Layout.closeDrawer();

    if (chapter !== DocView.chapter) {
        DocView.render(chapter);
        Layout.setActive(chapter.id);
        document.title = chapter.title + " – " + CONFIG.brandName;
    }

    if (target.section) {
        // WHY: Yeni çizilen bölümde yerleşimin bitmesi beklenir.
        requestAnimationFrame(function () {
            DocView.scrollToSection(target.section, 0);
        });
    }

};

SiteApp.findChapter = function (id) {
    return SiteApp.chapters.find(function (chapter) { return chapter.id === id; }) || null;
};

SiteApp.openChapter = function (id) {

    const hash = "#/" + id;

    if (location.hash === hash) {
        DocView.box.elem.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    location.hash = hash;

};

// Aynı bölümde ise adres değişir (geçmişe eklenmez) ve başlığa kayılır.
SiteApp.openSection = function (chapterId, sectionId) {

    if (DocView.chapter && DocView.chapter.id === chapterId) {
        history.replaceState(history.state, "", "#/" + chapterId + "/" + sectionId);
        DocView.scrollToSection(sectionId);
        return;
    }

    location.hash = "#/" + chapterId + "/" + sectionId;

};

// *** LANGUAGE:

SiteApp.toggleLanguage = function () {

    const lang = (SITE.lang == "tr") ? "en" : "tr";
    basic.storage.save(CONFIG.languageStorageKey, lang);

    // WHY: Bütün yazılar ve bölümler seçili dile göre okunuyor; en kısa yol sayfayı yeniden açmak. (Adres korunur.)
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
        if (!Layout.header) return;

        Layout.relayout();

        // WHY: Sadece yükseklik değişmiş ise (mobil adres çubuğu) bölümü yeniden çizme.
        if (SITE.L.w !== SiteApp.lastWidth) {
            SiteApp.lastWidth = SITE.L.w;
            DocView.relayout();
        }

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


// *** SEARCH:

const SiteSearch = {
    sections: [],   // { chapter, id, heading, text, headingText }
};

// Her başlık, altındaki metinle birlikte bir arama kaydıdır.
SiteSearch.build = function (chapters) {

    SiteSearch.sections = [];

    chapters.forEach(function (chapter) {

        let current = null;

        const addBlock = function (block) {

            if (block.type == "heading") {
                current = {
                    chapter: chapter,
                    id: (block.level == 1) ? "" : block.id,
                    heading: (block.level == 1) ? chapter.title : block.text,
                    text: "",
                };
                SiteSearch.sections.push(current);
                return;
            }

            if (!current) {
                current = { chapter: chapter, id: "", heading: chapter.title, text: "" };
                SiteSearch.sections.push(current);
            }

            current.text += " " + Markdown.blockText(block);

        };

        chapter.doc.blocks.forEach(addBlock);

    });

    SiteSearch.sections.forEach(function (section) {
        section.text = section.text.replace(/\s+/g, " ").trim();
        section.search = SiteSearch.normalize(section.chapter.title + " " + section.heading + " " + section.text);
        section.headingSearch = SiteSearch.normalize(section.heading);
        section.chapterSearch = SiteSearch.normalize(section.chapter.title);
    });

};

SiteSearch.normalize = function (text) {
    return String(text).toLocaleLowerCase(SITE.lang == "tr" ? "tr" : "en");
};

// SearchResults için: [{ text, desc, group, hash }]
SiteSearch.find = function (query) {

    const words = SiteSearch.normalize(query).split(/\s+/).filter(function (word) { return word; });
    if (!words.length) return [];

    const hasAll = function (text) {
        return words.every(function (word) { return text.indexOf(word) > -1; });
    };

    // Bölüm bölüm topla, en iyi bölüm önce.
    const byChapter = new Map();

    SiteSearch.sections.forEach(function (section, order) {

        if (!hasAll(section.search)) return;

        let score = 1;
        if (hasAll(section.headingSearch)) score += 10;
        if (hasAll(section.chapterSearch)) score += 3;

        if (!byChapter.has(section.chapter)) byChapter.set(section.chapter, { best: 0, items: [] });
        const group = byChapter.get(section.chapter);
        group.best = Math.max(group.best, score);
        group.items.push({ section: section, score: score, order: order });

    });

    const groups = Array.from(byChapter.values()).sort(function (a, b) { return b.best - a.best; });
    const results = [];

    groups.forEach(function (group) {

        group.items
            .sort(function (a, b) { return (b.score - a.score) || (a.order - b.order); })
            .slice(0, 6)
            .forEach(function (item) {
                const section = item.section;
                results.push({
                    text: section.heading,
                    desc: SiteSearch.snippet(section.text, words[0]),
                    group: section.chapter.shortTitle,
                    hash: "#/" + section.chapter.id + (section.id ? "/" + section.id : ""),
                });
            });

    });

    return results.slice(0, 40);

};

// Metinden, aranan kelimenin çevresi.
SiteSearch.snippet = function (text, word) {

    if (!text) return "";

    const index = SiteSearch.normalize(text).indexOf(word);
    const start = Math.max(0, index - 40);
    let snippet = text.slice(start, start + 110).trim();

    if (start > 0) snippet = "…" + snippet;
    if (start + 110 < text.length) snippet += "…";

    return snippet;

};
