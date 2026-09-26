/* Bismillah */

/*

JS Components Website - Home View - v26.09

- Ana sayfa: başlık, arama ve filtreler, kategori kategori bileşen kartları.
- Kartlardaki önizlemeler resim değildir: örnek sayfanın kendisi, küçültülmüş bir WebView (iframe) içinde çalışır.
  Sadece ekrana yaklaşan kartlar yüklenir (aynı anda CONFIG.previewConcurrency kadar), ekrandan çok
  uzaklaşanların sayfası kapatılır.
- The home page: header, search and filters, component cards by category.
  The previews are not images: the sample page itself runs in a scaled WebView (iframe).

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const HomeView = {

    box: null,              // Kaydırılan tam ekran kutu
    items: [],              // { comp, card, view, searchText, state, visible, section }
    sections: [],           // { cat, box, items }
    contentBoxes: [],       // Genişliği L.content olan gruplar (yeniden boyutlamada güncellenir)
    heroTexts: [],          // Genişliği en fazla 760 olan yazılar

    search: "",
    category: "all",
    generation: "0",

    // Önizleme sırası
    // state: 0 boş, 1 sırada, 2 yükleniyor, 3 yüklendi
    queue: [],
    activeCount: 0,
    loadObserver: null,
    unloadObserver: null,
    isShown: 1,

};

// *** BUILD:

HomeView.build = function () {

    const L = SITE.L;

    // BOX: Kaydırılan tam ekran kutu
    // WHY: page kaydırılmaz. Uzun içerik, scrollY: 1 verilmiş bir Box içinde durur.
    HomeView.box = startBox(0, 0, "100%", "100%", {
        color: SITE.BG,
        scrollY: 1,
    });

        // GROUP: Sayfa akışı
        VGroup({
            width: "100%",
            height: "auto", // İçerikle büyür, böylece kutu kayabilir.
            align: "center top",
            gap: 0,
        });
        // WHY: overflow: hidden olan bir üst kutu, araç çubuğunun "sticky" durmasını engeller.
        that.clipContent = 0;

            HomeView.createHeader();
            if (location.protocol == "file:") HomeView.createFileNotice();
            HomeView.createHero();
            HomeView.createToolbar();

            // GROUP: Kategoriler
            VGroup({ width: "100%", height: "auto", align: "center top", gap: 0, padding: [L.gutter, 8] });
            that.clipContent = 0;

                CATALOG.CATEGORIES.forEach(function (cat) {
                    HomeView.createSection(cat);
                });

                HomeView.createEmptyState();

            endGroup();

            HomeView.createFooter();

        endGroup();

    endBox();

    SITE.addScrollBar(HomeView.box);

    HomeView.startObservers();
    HomeView.applyFilter();

};

// GROUP: Genişliği içerik genişliği olan grup. (1 grup açar)
HomeView.startContent = function (params = {}) {

    mergeIntoIfMissing(params, {
        width: SITE.L.content,
        height: "auto",
        align: "left top",
        gap: 0,
    });

    const group = (params.flow == "horizontal") ? HGroup(params) : VGroup(params);
    HomeView.contentBoxes.push(group);

    return group;

};

// *** HEADER:
HomeView.createHeader = function () {

    const L = SITE.L;
    const T = SITE.T;

    HomeView.startContent({ flow: "horizontal", height: 76, align: "left center", gap: 12 });

        // ICON: Logo (339 x 85)
        Icon({
            width: 176,
            height: 44,
            color: "transparent",
        });
        that.load(CONFIG.logoFile);
        that.elem.title = CONFIG.brandName;
        that.elem.style.flexShrink = "0";

        SITE.spacer();

        SITE.button({
            text: L.mobile ? "" : T.navHandbook,
            icon: "book",
            kind: "plain",
            hint: T.navHandbook,
            onClick: function () { window.open(CONFIG.handbookURL, "_blank", "noopener"); },
        });

        SITE.button({
            text: L.mobile ? "" : T.navGithub,
            icon: "github",
            kind: "plain",
            hint: T.navGithub,
            onClick: function () { window.open(CONFIG.githubURL, "_blank", "noopener"); },
        });

        SITE.button({
            text: T.languageButton,
            kind: "ghost",
            height: 36,
            fontSize: 13,
            hint: T.languageHint,
            onClick: SiteApp.toggleLanguage,
        });

    endGroup();

};

// LABEL: Sayfa dosya olarak açıldı ise uyarı
HomeView.createFileNotice = function () {

    HomeView.startContent({ gap: 0 });

        Label({
            text: SITE.T.fileNotice,
            width: "100%",
            fontSize: SITE.L.small,
            textColor: SITE.WARNING_TEXT,
            color: SITE.WARNING_BG,
            round: 10,
        });
        that.elem.style.padding = "12px 16px";
        that.elem.style.lineHeight = "1.5";

    endGroup();

};

// *** HERO:
HomeView.createHero = function () {

    const L = SITE.L;
    const T = SITE.T;
    const textWidth = Math.min(760, L.content);

    HomeView.startContent({ gap: 14, padding: [0, L.mobile ? 22 : 44] });

        // LABEL: Üst etiket
        Label({ text: T.eyebrow, width: "100%", fontSize: L.tiny, textColor: SITE.ACCENT });
        that.elem.style.fontFamily = SITE.BOLD;
        that.elem.style.letterSpacing = "1.4px";

        // LABEL: Başlık
        HomeView.lblTitle = Label({ text: T.heroTitle, width: textWidth, fontSize: L.h1, textColor: SITE.INK });
        that.elem.style.fontFamily = SITE.BOLD;
        that.elem.style.lineHeight = "1.1";
        that.elem.style.letterSpacing = "-0.8px";
        that.elem.style.overflow = "visible"; // WHY: Büyük yazının harfleri (Ö, Ş, ğ, g) satır kutusunun dışına taşar; basic.css etiketi keser.
        HomeView.heroTexts.push(that);

        // LABEL: Giriş
        HomeView.lblLead = SITE.text(T.heroLead, textWidth, L.lead);
        HomeView.heroTexts.push(that);

        // GROUP: Rakamlar
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, wrap: 1 });
        that.elem.style.marginTop = "10px";

            HomeView.createStat(String(CATALOG.COMPONENTS.length), T.statComponents);
            HomeView.createStat(String(CATALOG.countSamples()), T.statSamples);
            HomeView.createStat("0", T.statDependencies);
            HomeView.createStat("Apache 2.0", T.statLicense);

        endGroup();

    endGroup();

};

// GROUP: Tek rakam: "75 bileşen"
HomeView.createStat = function (value, text) {

    HGroup({
        width: "auto",
        height: 34,
        align: "left center",
        gap: 6,
        padding: [14, 0],
        color: SITE.CARD,
        round: 100,
        border: 1,
        borderColor: SITE.LINE,
    });

        SITE.label(value, { bold: 1, fontSize: 14, textColor: SITE.INK });
        SITE.label(text, { fontSize: 14, textColor: SITE.TEXT_SOFT });

    endGroup();

};

// *** TOOLBAR: (Arama, kuşak ve kategori filtreleri. Kaydırırken üstte kalır.)
HomeView.createToolbar = function () {

    const L = SITE.L;
    const T = SITE.T;

    // GROUP: Tam genişlik şerit (sticky)
    HomeView.toolbar = VGroup({
        width: "100%",
        height: "auto",
        align: "center top",
        gap: 0,
        color: SITE.BG,
        padding: [L.gutter, 0],
    });
    HomeView.toolbar.elem.style.position = "sticky";
    HomeView.toolbar.elem.style.top = "0px";
    HomeView.toolbar.elem.style.zIndex = "5";
    HomeView.toolbar.clipContent = 0;

        HomeView.startContent({ gap: 10, padding: [0, 12] });
        that.clipContent = 0;

            // GROUP: Arama + kuşak
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 12, wrap: 1 });
            that.clipContent = 0;

                HomeView.createSearchInput();

                if (!L.mobile) SITE.spacer();

                // TABS: Kuşak filtresi
                HomeView.tabsGeneration = Tabs({
                    variant: "pill",
                    tabs: [
                        { key: "0", text: T.allGenerations },
                        { key: "4", text: "M4" },
                        { key: "3", text: "M3" },
                        { key: "2", text: "M2" },
                        { key: "1", text: "M1" },
                    ],
                    value: HomeView.generation,
                    ariaLabel: "Generation",
                    style: {
                        pillBar: { color: SITE.BG_SOFT, padding: [3, 3], round: 10 },
                        tab: { fontSize: 13, padding: [12, 6], minHeight: 34, round: 8 },
                        pillIndicator: { round: 8 },
                    },
                    onChange: function (self) {
                        HomeView.generation = self.value;
                        HomeView.applyFilter();
                    },
                });
                that.elem.title = T.generationHint;

            endGroup();

            // TABS: Kategori filtresi
            const categoryTabs = [{ key: "all", text: T.allCategories, count: CATALOG.COMPONENTS.length }];
            CATALOG.CATEGORIES.forEach(function (cat) {
                categoryTabs.push({ key: cat.key, text: cat[SITE.lang], count: CATALOG.getByCategory(cat.key).length });
            });

            HomeView.tabsCategory = Tabs({
                width: "100%",
                tabs: categoryTabs,
                value: HomeView.category,
                ariaLabel: "Category",
                style: {
                    bar: { gap: 2 },
                    tab: { fontSize: 14, padding: [10, 10] },
                    indicator: { color: SITE.INK },
                },
                onChange: function (self) {
                    HomeView.category = self.value;
                    HomeView.applyFilter();
                    HomeView.scrollToList();
                },
            });

        endGroup();

    endGroup();

};

// GROUP: Arama kutusu
HomeView.createSearchInput = function () {

    const L = SITE.L;
    const T = SITE.T;

    HomeView.searchBox = HGroup({
        width: L.mobile ? "100%" : 340,
        height: 42,
        align: "left center",
        gap: 8,
        padding: [12, 0],
        color: SITE.CARD,
        round: 10,
        border: 1,
        borderColor: SITE.LINE_STRONG,
    });
    HomeView.searchBox.setMotion("border-color 0.15s, box-shadow 0.15s");

        // LABEL: Arama ikonu
        Label({ text: SITE.svg("search", SITE.TEXT_FAINT, 17), width: 17, height: 17 });
        that.elem.style.flexShrink = "0";

        // INPUT: Aranan yazı
        HomeView.inpSearch = Input({
            width: 100,
            height: 38,
            color: "transparent",
            border: 0,
            round: 0,
            fontSize: 15,
            textColor: SITE.TEXT,
            placeholder: T.searchPlaceholder,
        });
        // WHY: basic.css, input'a resimli bir zemin ve iç boşluk verir; kutu zaten çerçeveli.
        HomeView.inpSearch.inputElement.style.backgroundImage = "none";
        HomeView.inpSearch.inputElement.style.backgroundColor = "transparent";
        HomeView.inpSearch.inputElement.style.border = "0px";
        HomeView.inpSearch.inputElement.style.padding = "0px 2px";
        HomeView.inpSearch.elem.style.flex = "1 1 0";
        HomeView.inpSearch.elem.style.minWidth = "0";
        HomeView.inpSearch.inputElement.style.outline = "none";
        HomeView.inpSearch.inputElement.setAttribute("aria-label", T.searchPlaceholder);
        HomeView.inpSearch.inputElement.setAttribute("autocomplete", "off");
        HomeView.inpSearch.inputElement.setAttribute("spellcheck", "false");

        // LABEL: Temizle
        HomeView.btnClear = Label({
            text: SITE.svg("close", SITE.TEXT_SOFT, 16),
            width: 26,
            height: 26,
            round: 6,
        });
        HomeView.btnClear.elem.style.display = "flex";
        HomeView.btnClear.elem.style.alignItems = "center";
        HomeView.btnClear.elem.style.justifyContent = "center";
        HomeView.btnClear.elem.style.flexShrink = "0";
        HomeView.btnClear.elem.style.cursor = "pointer";
        HomeView.btnClear.elem.title = T.clearSearch;
        HomeView.btnClear.visible = 0;

    endGroup();

    HomeView.inpSearch.on("input", function () {
        HomeView.search = HomeView.inpSearch.value;
        HomeView.btnClear.visible = (HomeView.search) ? 1 : 0;
        HomeView.applyFilter();
    });

    HomeView.inpSearch.on("focus", function () {
        HomeView.searchBox.borderColor = SITE.INK;
        HomeView.searchBox.elem.style.boxShadow = "0px 0px 0px 3px rgba(0, 0, 0, 0.06)";
    });

    HomeView.inpSearch.on("blur", function () {
        HomeView.searchBox.borderColor = SITE.LINE_STRONG;
        HomeView.searchBox.elem.style.boxShadow = "none";
    });

    HomeView.inpSearch.on("keydown", function (self, event) {
        if (event.key == "Escape") HomeView.clearSearch();
    });

    HomeView.btnClear.on("click", function () {
        HomeView.clearSearch();
        HomeView.inpSearch.focus();
    });

};

HomeView.clearSearch = function () {
    HomeView.inpSearch.value = "";
    HomeView.search = "";
    HomeView.btnClear.visible = 0;
    HomeView.applyFilter();
};

// *** SECTIONS:
HomeView.createSection = function (cat) {

    const L = SITE.L;
    const comps = CATALOG.getByCategory(cat.key);
    const section = { cat: cat, items: [], box: null, lblCount: null };

    section.box = HomeView.startContent({ gap: 16, padding: [0, 20] });
    that.clipContent = 0;

        // GROUP: Kategori başlığı
        HGroup({ width: "100%", height: "auto", align: "left center", gap: 10 });

            SITE.label(cat[SITE.lang], { bold: 1, fontSize: L.h2, textColor: SITE.INK });
            section.lblCount = SITE.label(String(comps.length), { fontSize: 14, textColor: SITE.TEXT_FAINT });

        endGroup();

        // GROUP: Kartlar
        section.grid = HGroup({ width: "100%", height: "auto", align: "left top", gap: L.gap, wrap: 1 });
        section.grid.elem.style.alignItems = "stretch"; // WHY: Aynı satırdaki kartlar aynı boyda dursun.
        section.grid.clipContent = 0;

            comps.forEach(function (comp) {
                const item = HomeView.createCard(comp);
                item.section = section;
                section.items.push(item);
                HomeView.items.push(item);
            });

        endGroup();

    endGroup();

    HomeView.sections.push(section);

};

// *** CARD:
HomeView.createCard = function (comp) {

    const L = SITE.L;
    const T = SITE.T;
    const samples = CATALOG.getSamples(comp);
    const item = { comp: comp, card: null, view: null, state: 0, visible: 0, section: null };

    // Aramada kullanılan yazı
    item.searchText = HomeView.normalize([comp.name, comp.key, comp.source, "m" + comp.gen, comp.en, comp.tr,
        CATALOG.getCategory(comp.cat).en, CATALOG.getCategory(comp.cat).tr].join(" "));

    // GROUP: Kart
    const card = VGroup({
        width: L.cardWidth,
        height: "auto",
        align: "left top",
        gap: 0,
        color: SITE.CARD,
        round: 14,
        border: 1,
        borderColor: SITE.LINE,
    });
    card.clipContent = 1;
    card.elem.style.cursor = "pointer";
    card.elem.setAttribute("role", "link");
    card.elem.setAttribute("tabindex", "0");
    card.elem.setAttribute("aria-label", comp.name + " – " + T.openExample);
    item.card = card;

        // WEB VIEW: Önizleme (örnek sayfanın kendisi, küçültülmüş)
        // NOTE: url verilmiyor; kart ekrana yaklaşınca yüklenir. (HomeView.pump)
        item.view = WebView({
            width: "100%",
            height: L.previewHeight,
            scale: L.previewScale,
            interactive: 0, // Tıklama karta gider, önizleme kaydırılmaz.
            title: comp.name,
            placeholderText: "",
            loadTimeout: CONFIG.previewTimeout,
            style: {
                box: { color: "#FFFFFF", border: 0, round: 0 },
                placeholder: { color: "#FAFAF8" },
                loading: { color: "#FAFAF8", spinnerColor: "rgba(0, 0, 0, 0.35)", spinnerSize: 22 },
                error: { color: "#FAFAF8", fontSize: 12, textColor: SITE.TEXT_FAINT },
            },
            onLoad: function () { HomeView.onPreviewDone(item); },
            onError: function (self) { self.showError(T.sampleError); HomeView.onPreviewDone(item); },
            onTimeout: function () { HomeView.onPreviewDone(item); },
        });
        item.view.elem.style.flexShrink = "0";
        item.view.elem.style.borderBottom = "1px solid " + SITE.LINE;
        item.view.elem.style.boxSizing = "content-box";

        // GROUP: Bilgi
        VGroup({ width: "100%", height: "auto", align: "left top", gap: 6, padding: [16, 14] });
        that.elem.style.flex = "1 1 auto";

            // GROUP: Ad + kuşak
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });

                SITE.label(comp.name, { bold: 1, fontSize: 16, textColor: SITE.INK });
                that.elem.style.flex = "0 1 auto";
                that.elem.style.minWidth = "0";
                that.elem.style.overflow = "hidden";
                that.elem.style.textOverflow = "ellipsis";

                SITE.spacer();
                SITE.generationChip(comp.gen);

            endGroup();

            // LABEL: Açıklama (en fazla 2 satır)
            Label({
                text: basic.escapeHtml(comp[SITE.lang]),
                width: "100%",
                fontSize: 13,
                textColor: SITE.TEXT_SOFT,
            });
            that.elem.style.lineHeight = "20px";
            that.elem.style.height = "40px";
            that.elem.style.display = "-webkit-box";
            that.elem.style.webkitLineClamp = "2";
            that.elem.style.webkitBoxOrient = "vertical";
            that.elem.title = comp[SITE.lang];

            // GROUP: Dosya + örnek sayısı
            HGroup({ width: "100%", height: "auto", align: "left center", gap: 8 });
            that.elem.style.marginTop = "4px";

                SITE.mono(SITE.fileName(comp.source));
                if (samples.length > 1) {
                    SITE.label("· " + samples.length + " " + T.examples, { fontSize: 12, textColor: SITE.TEXT_FAINT });
                }

            endGroup();

        endGroup();

    endGroup();

    // Üzerine gelince hafifçe kalkar
    card.setMotion("transform 0.2s, box-shadow 0.2s, border-color 0.2s");

    card.on("mouseenter", function () {
        card.elem.style.transform = "translateY(-3px)";
        card.elem.style.boxShadow = "0px 12px 30px rgba(0, 0, 0, 0.08)";
        card.borderColor = SITE.LINE_STRONG;
    });

    card.on("mouseleave", function () {
        card.elem.style.transform = "translateY(0px)";
        card.elem.style.boxShadow = "none";
        card.borderColor = SITE.LINE;
    });

    card.on("click", function () {
        SiteApp.openComponent(comp.key);
    });

    card.on("keydown", function (self, event) {
        if (event.key == "Enter" || event.key == " ") {
            event.preventDefault();
            SiteApp.openComponent(comp.key);
        }
    });

    return item;

};

// GROUP: Sonuç yok
HomeView.createEmptyState = function () {

    HomeView.emptyBox = HomeView.startContent({ align: "center center", gap: 14, padding: [0, 60] });

        SITE.text(SITE.T.noResult, "auto", 16, SITE.TEXT_SOFT);

        SITE.button({
            text: SITE.T.clearSearch,
            kind: "ghost",
            onClick: function () {
                HomeView.clearSearch();
                HomeView.tabsGeneration.setValue("0");
                HomeView.tabsCategory.setValue("all");
            },
        });

    endGroup();

    HomeView.emptyBox.visible = 0;

};

// *** FOOTER:
HomeView.createFooter = function () {

    const T = SITE.T;

    VGroup({ width: "100%", height: "auto", align: "center top", gap: 0, padding: [SITE.L.gutter, 0] });
    that.elem.style.marginTop = "40px";
    that.elem.style.borderTop = "1px solid " + SITE.LINE;

        HomeView.startContent({ flow: "horizontal", align: "left center", gap: 16, padding: [0, 28], wrap: 1 });

            // GROUP: Telif + yazar bağlantısı
            HGroup({ width: "auto", height: "auto", align: "left center", gap: 4 });

                SITE.label("© 2020–" + new Date().getFullYear(), { fontSize: 13, textColor: SITE.TEXT_SOFT });

                const lblAuthor = SITE.label("Bugra Ozden", { fontSize: 13, textColor: SITE.TEXT_SOFT });
                lblAuthor.elem.style.cursor = "pointer";
                lblAuthor.elem.style.textDecoration = "underline";
                lblAuthor.on("mouseenter", function () { lblAuthor.textColor = SITE.INK; });
                lblAuthor.on("mouseleave", function () { lblAuthor.textColor = SITE.TEXT_SOFT; });
                lblAuthor.on("click", function () { window.open(CONFIG.authorURL, "_blank", "noopener"); });

            endGroup();
            SITE.text(T.footerText + " " + T.footerMade, "auto", 13, SITE.TEXT_FAINT);
            that.elem.style.flex = "1 1 300px";

        endGroup();

    endGroup();

};

// *** FILTER:

HomeView.normalize = function (text) {
    return String(text).toLocaleLowerCase("tr").replace(/[\s\-_.]+/g, " ").trim();
};

HomeView.applyFilter = function () {

    const query = HomeView.normalize(HomeView.search);
    const words = (query) ? query.split(" ") : [];
    const counts = {};
    let total = 0;
    let shownCount = 0;

    HomeView.sections.forEach(function (section) {

        let sectionCount = 0;

        section.items.forEach(function (item) {

            const matchText = words.every(function (word) { return item.searchText.indexOf(word) > -1; });
            const matchGeneration = (HomeView.generation == "0" || String(item.comp.gen) == HomeView.generation);
            const match = matchText && matchGeneration;
            const show = match && (HomeView.category == "all" || HomeView.category == section.cat.key);

            if (match) sectionCount++;
            if (show) shownCount++;
            item.card.visible = show ? 1 : 0;

        });

        counts[section.cat.key] = sectionCount;
        total += sectionCount;

        const sectionShown = (HomeView.category == "all" || HomeView.category == section.cat.key) && sectionCount > 0;
        section.box.visible = sectionShown ? 1 : 0;
        section.lblCount.text = String(sectionCount);

    });

    // Sekmelerdeki sayılar
    HomeView.tabsCategory.setCount("all", total);
    CATALOG.CATEGORIES.forEach(function (cat) {
        HomeView.tabsCategory.setCount(cat.key, counts[cat.key]);
    });

    HomeView.emptyBox.visible = (shownCount == 0) ? 1 : 0;

};

// Filtre değişince, liste başlığın altında ise listenin başına git.
HomeView.scrollToList = function () {

    const boxElem = HomeView.box.elem;
    const toolbarTop = HomeView.toolbar.elem.offsetTop;

    if (boxElem.scrollTop > toolbarTop) {
        boxElem.scrollTop = toolbarTop;
    }

};

// *** PREVIEW LOADING:

HomeView.startObservers = function () {

    // Eski tarayıcı: hepsini sırayla yükle.
    if (typeof IntersectionObserver === "undefined") {
        HomeView.items.forEach(function (item) {
            item.visible = 1;
            HomeView.requestPreview(item);
        });
        HomeView.pump();
        return;
    }

    const root = HomeView.box.elem;

    // Ekrana yaklaşan kartlar yüklenir.
    HomeView.loadObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            const item = entry.target.wjcItem;
            item.visible = entry.isIntersecting ? 1 : 0;
            if (item.visible) HomeView.requestPreview(item);
        });
        HomeView.pump();
    }, { root: root, rootMargin: CONFIG.previewLoadMargin + "px 0px" });

    // Ekrandan çok uzaklaşan kartların sayfası kapatılır.
    HomeView.unloadObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            // WHY: Ana sayfa gizli iken (detay açık) bütün kartlar "görünmüyor" olur; onları kapatma.
            if (!HomeView.isShown || !entry.rootBounds || entry.rootBounds.height == 0) return;
            if (!entry.isIntersecting) HomeView.unloadPreview(entry.target.wjcItem);
        });
    }, { root: root, rootMargin: CONFIG.previewUnloadMargin + "px 0px" });

    HomeView.items.forEach(function (item) {
        item.card.elem.wjcItem = item;
        HomeView.loadObserver.observe(item.card.elem);
        HomeView.unloadObserver.observe(item.card.elem);
    });

};

HomeView.requestPreview = function (item) {
    if (item.state != 0) return;
    item.state = 1;
    HomeView.queue.push(item);
};

HomeView.pump = function () {

    while (HomeView.activeCount < CONFIG.previewConcurrency && HomeView.queue.length) {

        const item = HomeView.queue.shift();
        if (item.state != 1) continue;

        // Sırada beklerken ekrandan çıktı ise yükleme.
        if (!item.visible || !HomeView.isShown) {
            item.state = 0;
            continue;
        }

        item.state = 2;
        HomeView.activeCount++;
        item.view.load(SITE.rootUrl(CATALOG.getSamples(item.comp)[0].file));

    }

};

HomeView.onPreviewDone = function (item) {
    if (item.state != 2) return;
    item.state = 3;
    HomeView.activeCount--;
    HomeView.pump();
};

HomeView.unloadPreview = function (item) {
    if (item.state == 0) return;
    if (item.state == 2) HomeView.activeCount--;
    if (item.state >= 2) item.view.load("");
    item.state = 0;
    HomeView.pump();
};

// *** SHOW / HIDE: (Detay açılınca ana sayfa gizlenir, kaydırma yeri ve yüklenen önizlemeler korunur.)

HomeView.show = function () {
    HomeView.isShown = 1;
    HomeView.box.visible = 1;
};

HomeView.hide = function () {
    HomeView.isShown = 0;
    HomeView.box.visible = 0;
};

// *** RESIZE:
HomeView.relayout = function () {

    const L = SITE.L;

    HomeView.contentBoxes.forEach(function (box) {
        box.width = L.content;
    });

    HomeView.heroTexts.forEach(function (label) {
        label.width = Math.min(760, L.content);
    });
    HomeView.lblTitle.fontSize = L.h1;

    HomeView.searchBox.width = L.mobile ? "100%" : 340;

    HomeView.sections.forEach(function (section) {
        section.grid.gap = L.gap;
    });

    HomeView.items.forEach(function (item) {
        item.card.width = L.cardWidth;
        item.view.height = L.previewHeight;
        item.view.setScale(L.previewScale);
    });

};
