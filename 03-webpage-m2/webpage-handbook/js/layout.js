/* Bismillah */

/*

basic.js Handbook Website - Layout - v26.09

- Sayfanın iskeleti: üst çubuk (logo, arama, bağlantılar, dil), soldaki bölüm listesi ve kaydırılan içerik kutusu.
- Dar ekranda (CONFIG.drawerBreakpoint altı) bölüm listesi, menü düğmesi ile açılan bir çekmecedir.
- Arama: comp-m4 SearchResults, üst çubuktaki kutunun altında açılır. "/" veya Ctrl (Cmd) + K arama kutusuna gider.
- The frame of the page: header, chapter list on the left and the scrolling content box.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const Layout = {

    header: null,
    sidebar: null,          // Dış kutu (konumu değişir, çekmece)
    sidebarScroll: null,    // İçindeki kaydırılan kutu
    backdrop: null,
    navItems: {},           // { chapterId: group }
    activeId: "",
    drawerOpen: 0,

    searchBox: null,
    inpSearch: null,
    results: null,

};

// *** BUILD:
Layout.build = function () {

    // BOX: İçerik (kaydırılır). Önce oluşturulur; çekmece ve üst çubuk onun üstünde durur.
    DocView.box = startBox(0, 0, 100, 100, { color: SITE.BG, scrollY: 1 });
    endBox();
    DocView.box.on("scroll", DocView.onScroll);
    SITE.addScrollBar(DocView.box);

    // BOX: Çekmece açıkken arkadaki karartma
    Layout.backdrop = Box(0, 0, "100%", "100%", { color: "rgba(0, 0, 0, 0.28)", visible: 0 });
    Layout.backdrop.elem.style.zIndex = "15";
    Layout.backdrop.on("click", Layout.closeDrawer);

    Layout.createSidebar();
    Layout.createHeader();

    page.on("keydown", Layout.onKeyDown);

    Layout.relayout();

};

// *** HEADER:
Layout.createHeader = function () {

    const T = SITE.T;

    Layout.header = startBox(0, 0, "100%", CONFIG.headerHeight, { color: "rgba(251, 251, 249, 0.94)" });
    Layout.header.elem.style.borderBottom = "1px solid " + SITE.LINE;
    Layout.header.elem.style.backdropFilter = "blur(8px)";
    Layout.header.elem.style.zIndex = "30";
    Layout.header.clipContent = 0;

        Layout.headerRow = HGroup({ width: "100%", height: "100%", align: "left center", gap: 10, padding: [20, 0] });
        Layout.headerRow.clipContent = 0;

            // Menü (çekmece)
            Layout.btnMenu = SITE.button({ icon: "menu", kind: "plain", height: 38, hint: T.menu, onClick: Layout.toggleDrawer });

            // GROUP: Logo + sürüm
            Layout.logo = HGroup({ width: "auto", height: "auto", align: "left center", gap: 10 });
            Layout.logo.elem.style.cursor = "pointer";
            Layout.logo.elem.style.flexShrink = "0";

                // ICON: Logo (356 x 83)
                Layout.imgLogo = Icon({ width: 142, height: 33, color: "transparent" });
                that.load(CONFIG.logoFile);
                that.elem.title = CONFIG.brandName;

                // LABEL: Kütüphanenin sürümü (basic.version)
                Layout.lblVersion = Label({ text: "v" + (basic.version || ""), fontSize: 11, textColor: SITE.TEXT_SOFT, color: SITE.BG_SOFT, round: 100 });
                that.elem.style.padding = "3px 8px";
                that.elem.style.whiteSpace = "nowrap";
                that.elem.style.fontFamily = SITE.MONO;
                if (!basic.version) that.visible = 0;

            endGroup();

            Layout.logo.on("click", function () { SiteApp.openChapter(SiteApp.chapters[0].id); });

            Layout.headerSpacer = SITE.spacer();

            Layout.createSearch();

            // Bağlantılar
            Layout.btnComponents = SITE.button({
                text: T.navComponents,
                icon: "grid",
                kind: "plain",
                hint: T.navComponents,
                onClick: function () { window.open(CONFIG.componentsURL, "_blank", "noopener"); },
            });

            Layout.btnGithub = SITE.button({
                icon: "github",
                kind: "plain",
                hint: T.navGithub,
                onClick: function () { window.open(CONFIG.githubURL, "_blank", "noopener"); },
            });

            // Dil
            SITE.button({
                text: T.languageButton,
                kind: "ghost",
                height: 34,
                fontSize: 12,
                hint: T.languageHint,
                onClick: SiteApp.toggleLanguage,
            });

        endGroup();

    endBox();

};

// GROUP: Arama kutusu + SearchResults
Layout.createSearch = function () {

    const T = SITE.T;

    Layout.searchBox = HGroup({
        width: 300,
        height: 38,
        align: "left center",
        gap: 8,
        padding: [12, 0],
        color: SITE.CARD,
        round: 10,
        border: 1,
        borderColor: SITE.LINE_STRONG,
    });
    Layout.searchBox.elem.style.minWidth = "0";
    Layout.searchBox.setMotion("border-color 0.15s, box-shadow 0.15s");

        SITE.icon("search", SITE.TEXT_FAINT, 16);

        // INPUT: Aranan yazı
        Layout.inpSearch = Input({
            width: 100,
            height: 34,
            color: "transparent",
            border: 0,
            round: 0,
            fontSize: 14,
            textColor: SITE.TEXT,
            placeholder: T.searchPlaceholder,
        });
        // WHY: basic.css, input'a resimli bir zemin ve iç boşluk verir; kutu zaten çerçeveli.
        const input = Layout.inpSearch.inputElement;
        input.style.backgroundImage = "none";
        input.style.backgroundColor = "transparent";
        input.style.border = "0px";
        input.style.padding = "0px 2px";
        input.style.outline = "none";
        input.setAttribute("aria-label", T.searchPlaceholder);
        input.setAttribute("autocomplete", "off");
        input.setAttribute("spellcheck", "false");
        input.title = T.searchHint;
        Layout.inpSearch.elem.style.flex = "1 1 0";
        Layout.inpSearch.elem.style.minWidth = "0";

        // LABEL: "/" kısayolu
        Layout.lblSlash = Label({ text: "/", width: 20, height: 20, fontSize: 11, textColor: SITE.TEXT_FAINT, round: 5, border: 1, borderColor: SITE.LINE_STRONG });
        that.elem.style.display = "flex";
        that.elem.style.alignItems = "center";
        that.elem.style.justifyContent = "center";
        that.elem.style.flexShrink = "0";
        that.elem.style.fontFamily = SITE.MONO;

    endGroup();

    // SEARCH RESULTS: Kutunun altında açılan liste
    Layout.results = SearchResults({
        anchor: Layout.searchBox,
        anchorAlign: "left",
        maxWidth: 480,
        emptyText: T.searchEmpty,
        hintText: T.searchKeys,
        onSelect: function (self, item) {
            Layout.inpSearch.blur();
            Layout.closeDrawer();
            location.hash = item.hash;
        },
    });
    Layout.results.attachTo(input);

    Layout.inpSearch.on("input", function () {
        const query = Layout.inpSearch.value;
        Layout.results.setItems(SiteSearch.find(query), query);
    });

    Layout.inpSearch.on("focus", function () {
        Layout.searchBox.borderColor = SITE.INK;
        Layout.searchBox.elem.style.boxShadow = "0px 0px 0px 3px rgba(0, 0, 0, 0.06)";
        Layout.lblSlash.visible = 0;
    });

    Layout.inpSearch.on("blur", function () {
        Layout.searchBox.borderColor = SITE.LINE_STRONG;
        Layout.searchBox.elem.style.boxShadow = "none";
        Layout.lblSlash.visible = SITE.L.mobile ? 0 : 1;
    });

};

// *** SIDEBAR:
Layout.createSidebar = function () {

    const T = SITE.T;

    // BOX: Dış kutu (çekmecede bu kayar; ScrollBar da bunun içinde durur)
    Layout.sidebar = startBox(0, CONFIG.headerHeight, CONFIG.sidebarWidth, "calc(100% - " + CONFIG.headerHeight + "px)", { color: SITE.SIDEBAR });
    Layout.sidebar.elem.style.borderRight = "1px solid " + SITE.LINE;
    Layout.sidebar.elem.style.zIndex = "20";
    Layout.sidebar.setMotion("left 0.25s, box-shadow 0.25s");

        // BOX: Kaydırılan liste
        Layout.sidebarScroll = startBox(0, 0, "100%", "100%", { color: "transparent", scrollY: 1 });

            VGroup({ width: "100%", height: "auto", align: "left top", gap: 2, padding: [14, 16] });

                let lastGroup = "";

                SiteApp.chapters.forEach(function (chapter) {

                    if (chapter.group !== lastGroup) {
                        lastGroup = chapter.group;

                        // LABEL: Grup başlığı
                        Label({ text: T.groups[chapter.group], fontSize: 11, textColor: SITE.TEXT_FAINT });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.letterSpacing = "1.2px";
                        that.elem.style.textTransform = "uppercase";
                        that.elem.style.padding = "16px 12px 6px 12px";
                    }

                    Layout.createNavItem(chapter);

                });

            endGroup();

        endBox();

        SITE.addScrollBar(Layout.sidebarScroll);

    endBox();

};

// GROUP: Menüdeki bölüm satırı
Layout.createNavItem = function (chapter) {

    const item = HGroup({ width: "100%", height: "auto", align: "left center", gap: 8, padding: [12, 7], round: 8, color: "transparent" });
    item.elem.style.cursor = "pointer";
    item.elem.setAttribute("role", "link");
    item.elem.setAttribute("tabindex", "0");
    item.setMotion("background-color 0.12s");

        item.lblTitle = Label({ text: basic.escapeHtml(chapter.shortTitle), width: "100%", fontSize: 14, textColor: SITE.TEXT });
        item.lblTitle.elem.style.lineHeight = "1.4";

    endGroup();

    item.on("mouseenter", function () {
        if (Layout.activeId !== chapter.id) item.color = "rgba(0, 0, 0, 0.045)";
    });

    item.on("mouseleave", function () {
        if (Layout.activeId !== chapter.id) item.color = "transparent";
    });

    item.on("click", function () {
        Layout.closeDrawer();
        SiteApp.openChapter(chapter.id);
    });

    item.on("keydown", function (self, event) {
        if (event.key == "Enter") {
            Layout.closeDrawer();
            SiteApp.openChapter(chapter.id);
        }
    });

    Layout.navItems[chapter.id] = item;

    return item;

};

Layout.setActive = function (chapterId) {

    Layout.activeId = chapterId;

    for (let id in Layout.navItems) {
        const item = Layout.navItems[id];
        const active = (id === chapterId);
        item.color = active ? SITE.ACCENT_SOFT : "transparent";
        item.lblTitle.textColor = active ? SITE.ACCENT : SITE.TEXT;
        item.lblTitle.elem.style.fontFamily = active ? SITE.BOLD : "";
    }

    // Seçili satır görünür olsun.
    const active = Layout.navItems[chapterId];
    if (active) active.elem.scrollIntoView({ block: "nearest" });

};

// *** DRAWER:

Layout.toggleDrawer = function () {
    if (Layout.drawerOpen) Layout.closeDrawer();
    else Layout.openDrawer();
};

Layout.openDrawer = function () {
    if (!SITE.L.drawer) return;
    Layout.drawerOpen = 1;
    Layout.relayout();
};

Layout.closeDrawer = function () {
    if (!Layout.drawerOpen) return;
    Layout.drawerOpen = 0;
    Layout.relayout();
};

// *** KEYBOARD:
Layout.onKeyDown = function (self, event) {

    const target = event.target;
    const isTyping = target && (target.tagName == "INPUT" || target.tagName == "TEXTAREA" || target.isContentEditable);

    if ((event.key == "/" && !isTyping) || (event.key.toLowerCase() == "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        Layout.inpSearch.focus();
        Layout.inpSearch.select();
        return;
    }

    if (event.key == "Escape" && Layout.drawerOpen) Layout.closeDrawer();

};

// *** LAYOUT:
Layout.relayout = function () {

    const L = SITE.L;
    const top = CONFIG.headerHeight;
    const contentLeft = L.drawer ? 0 : CONFIG.sidebarWidth;

    if (!L.drawer) Layout.drawerOpen = 0;

    // İçerik
    DocView.box.left = contentLeft;
    DocView.box.top = top;
    DocView.box.width = "calc(100% - " + contentLeft + "px)";
    DocView.box.height = "calc(100% - " + top + "px)";

    // Bölüm listesi
    Layout.sidebar.left = (!L.drawer || Layout.drawerOpen) ? 0 : -(CONFIG.sidebarWidth + 10);
    Layout.sidebar.elem.style.boxShadow = (L.drawer && Layout.drawerOpen) ? "8px 0px 30px rgba(0, 0, 0, 0.12)" : "none";
    Layout.backdrop.top = top;
    Layout.backdrop.height = "calc(100% - " + top + "px)";
    Layout.backdrop.visible = (L.drawer && Layout.drawerOpen) ? 1 : 0;

    // Üst çubuk
    Layout.headerRow.padding = [L.mobile ? 10 : 20, 0];
    Layout.headerRow.gap = L.mobile ? 6 : 10;
    Layout.btnMenu.visible = L.drawer ? 1 : 0;
    Layout.imgLogo.width = L.mobile ? 103 : 142;
    Layout.imgLogo.height = L.mobile ? 24 : 33;
    Layout.lblVersion.visible = (L.w >= 720 && basic.version) ? 1 : 0;
    Layout.headerSpacer.visible = L.mobile ? 0 : 1;
    Layout.searchBox.width = L.mobile ? "auto" : 300;
    Layout.searchBox.elem.style.flex = L.mobile ? "1 1 auto" : "0 1 300px";
    Layout.lblSlash.visible = L.mobile ? 0 : 1;
    Layout.btnComponents.visible = (L.w >= 760) ? 1 : 0;
    Layout.btnGithub.visible = L.mobile ? 0 : 1;

    if (Layout.results) Layout.results.refresh();

};
