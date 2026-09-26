/* Bismillah */

/*

SiteHeader - v26.09

- Sayfanın üstünde sabit duran menü çubuğu. (Kaydırılan kutunun dışındadır.)
- İki durumu vardır: hero üzerindeyken şeffaf ve açık renk yazılı,
  sayfa kaydırılınca açık zeminli ve koyu yazılı.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

// Default values:
const SiteHeaderDefaults = {
    onNavClick: function (key) { },
    onLanguageClick: function () { },
};

const SiteHeader = function (params = {}) {

    mergeIntoIfMissing(params, SiteHeaderDefaults);

    const L = SITE.L;
    const T = SITE.T;

    // BOX: Component container
    const box = startObject({
        left: 0,
        top: 0,
        width: "100%",
        height: L.headerH,
        color: "transparent",
    });

    box.elem.style.zIndex = "50";
    box.elem.style.borderBottom = "1px solid transparent";
    box.setMotion("background-color 0.25s, border-color 0.25s");

    // *** PRIVATE VARIABLES:
    let menuOverlay = null;
    let isScrolled = 0;

    // Duruma göre renk verilecek nesneler:
    let brandIcon = null;
    let brandLabel = null;
    let langLabel = null;
    let ctaButton = null;
    let menuLineList = [];
    const navLabelList = [];

    // Masaüstünde gösterilecek menü başlıkları
    const navKeys = (L.w >= 1180)
        ? ["services", "features", "demo", "pricing", "openSource", "faq"]
        : ["services", "features", "demo", "pricing", "faq"];

    // *** PRIVATE FUNCTIONS:

    // Menü yazısının rengi (üzerinde olup olmamasına göre).
    const navColor = function (isOver) {

        if (isScrolled) return isOver ? SITE.PRIMARY : SITE.TEXT_SOFT;

        return isOver ? SITE.WHITE : SITE.ON_DARK_SOFT;

    };

    // GROUP: Logo ve marka adı
    const createBrand = function () {

        const brand = HGroup({
            width: "auto",
            height: "auto",
            align: "left center",
            gap: 10,
        });

            brandIcon = Icon({ width: 26, height: 26 });
            that.load(CONFIG.logoFile);

            brandLabel = Label({
                text: CONFIG.brandName,
                width: "auto",
                fontSize: L.mobile ? 16 : 17,
                textColor: SITE.WHITE,
            });
            that.elem.style.fontFamily = SITE.BOLD;
            that.elem.style.whiteSpace = "nowrap";
            that.elem.style.letterSpacing = "-0.2px";

        endGroup();

        brand.on("click", function () { params.onNavClick("top"); });
        brand.elem.style.cursor = "pointer";

        return brand;

    };

    // LABEL: Tek menü başlığı
    const createNavLabel = function (key) {

        const lbl = Label({
            text: T.menu[key],
            width: "auto",
            fontSize: 14,
            textColor: navColor(0),
        });
        that.elem.style.whiteSpace = "nowrap";
        that.elem.style.cursor = "pointer";
        that.setMotion("color 0.15s");

        lbl.on("mouseover", function () { lbl.textColor = navColor(1); });
        lbl.on("mouseout", function () { lbl.textColor = navColor(0); });
        lbl.on("click", function () { params.onNavClick(key); });

        navLabelList.push(lbl);

        return lbl;

    };

    // LABEL: Dil değiştirme düğmesi
    const createLanguageSwitch = function () {

        langLabel = Label({
            text: T.otherLangName,
            width: 38,
            height: 30,
            fontSize: 12,
            textAlign: "center",
            textColor: SITE.ON_DARK_SOFT,
            round: 100,
            border: 1,
            borderColor: SITE.ON_DARK_LINE,
        });
        that.elem.style.fontFamily = SITE.BOLD;
        that.elem.style.lineHeight = "28px";
        that.elem.style.letterSpacing = "0.6px";
        that.elem.style.cursor = "pointer";
        that.setMotion("background-color 0.15s, color 0.15s, border-color 0.15s");

        const lbl = langLabel;

        lbl.on("mouseover", function () {
            lbl.color = isScrolled ? SITE.INK : SITE.WHITE;
            lbl.textColor = isScrolled ? SITE.WHITE : SITE.INK;
        });

        lbl.on("mouseout", function () {
            lbl.color = "transparent";
            lbl.textColor = isScrolled ? SITE.TEXT_SOFT : SITE.ON_DARK_SOFT;
        });

        lbl.on("click", function () { params.onLanguageClick(); });

        return lbl;

    };

    // BOX: Mobil menü düğmesi (üç çizgi)
    const createMenuButton = function () {

        menuLineList = [];

        const btn = VGroup({
            width: 40,
            height: 34,
            align: "center",
            gap: 4,
            round: 8,
            border: 1,
            borderColor: SITE.ON_DARK_LINE,
        });

            for (let i = 0; i < 3; i++) {
                Box(0, 0, 16, 2, { color: SITE.WHITE, round: 2 });
                that.elem.style.flexShrink = "0";
                menuLineList.push(that);
            }

        endGroup();

        btn.on("click", function () { box.openMenu(); });
        btn.elem.style.cursor = "pointer";

        box.menuButton = btn;

        return btn;

    };

    // Çubuğun bütün renklerini, duruma göre yeniden verir.
    const applyState = function () {

        if (isScrolled) {

            box.color = "rgba(246, 246, 243, 0.92)";
            box.elem.style.borderBottom = "1px solid " + SITE.LINE;
            box.elem.style.backdropFilter = "saturate(180%) blur(14px)";
            box.elem.style.webkitBackdropFilter = "saturate(180%) blur(14px)";

            brandIcon.elem.style.filter = "invert(100%)";
            brandLabel.textColor = SITE.INK;
            langLabel.textColor = SITE.TEXT_SOFT;
            langLabel.borderColor = SITE.LINE;

            if (ctaButton) {
                ctaButton.baseColor = SITE.PRIMARY;
                ctaButton.hoverColor = "#37704A";
                ctaButton.color = ctaButton.baseColor;
                ctaButton.textColor = SITE.WHITE;
            }

            if (box.menuButton) box.menuButton.borderColor = SITE.LINE;
            menuLineList.forEach(function (line) { line.color = SITE.INK; });

        } else {

            box.color = "transparent";
            box.elem.style.borderBottom = "1px solid transparent";
            box.elem.style.backdropFilter = "none";
            box.elem.style.webkitBackdropFilter = "none";

            brandIcon.elem.style.filter = "invert(0%)";
            brandLabel.textColor = SITE.WHITE;
            langLabel.textColor = SITE.ON_DARK_SOFT;
            langLabel.borderColor = SITE.ON_DARK_LINE;

            if (ctaButton) {
                ctaButton.baseColor = SITE.WHITE;
                ctaButton.hoverColor = "#EBEBE4";
                ctaButton.color = ctaButton.baseColor;
                ctaButton.textColor = SITE.INK;
            }

            if (box.menuButton) box.menuButton.borderColor = SITE.ON_DARK_LINE;
            menuLineList.forEach(function (line) { line.color = SITE.WHITE; });

        }

        langLabel.color = "transparent";

        navLabelList.forEach(function (lbl) { lbl.textColor = navColor(0); });

    };

    // *** PUBLIC FUNCTIONS:

    // Mobil menüyü açar.
    box.openMenu = function () {

        if (menuOverlay) return;

        // BOX: Tam ekran menü
        menuOverlay = startBox(0, 0, "100%", "100%", {
            color: SITE.INK,
            opacity: 0,
        });
        menuOverlay.elem.style.zIndex = "60";
        menuOverlay.scrollY = 1; // WHY: Küçük ekranlarda menü sığmaz ise kaysın.
        menuOverlay.setMotion("opacity 0.2s");
        menuOverlay.withMotion(function (self) { self.opacity = 1; });

                // GROUP: Menü içeriği
                VGroup(0, 0, "100%", "auto", {
                    align: "left top",
                    gap: 6,
                    padding: [L.gutter, 24],
                });

                    // GROUP: Üst satır (marka + kapat)
                    HGroup({
                        width: "100%",
                        height: L.headerH - 24,
                        align: "left center",
                        gap: 10,
                    });

                        Label({
                            text: CONFIG.brandName,
                            width: "auto",
                            fontSize: 16,
                            textColor: SITE.WHITE,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;

                        Box(0, 0, 1, 1, { color: "transparent" });
                        that.elem.style.flexGrow = "1";

                        Label({
                            text: T.menu.close,
                            width: "auto",
                            height: 34,
                            fontSize: 13,
                            textColor: SITE.ON_DARK_SOFT,
                            round: 100,
                            border: 1,
                            borderColor: SITE.ON_DARK_LINE,
                        });
                        that.elem.style.padding = "0px 16px";
                        that.elem.style.lineHeight = "32px";
                        that.elem.style.cursor = "pointer";
                        that.on("click", function () { box.closeMenu(); });

                    endGroup();

                    SITE.space(18);

                    // LABEL: Menü satırları
                    ["services", "features", "demo", "pricing", "openSource", "faq", "contact"].forEach(function (key) {

                        Label({
                            text: T.menu[key],
                            width: "100%",
                            height: "auto",
                            fontSize: 24,
                            textColor: SITE.ON_DARK,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.padding = "12px 0px";
                        that.elem.style.borderBottom = "1px solid " + SITE.ON_DARK_LINE;
                        that.elem.style.cursor = "pointer";

                        const lbl = that;
                        lbl.on("click", function () {
                            box.closeMenu();
                            params.onNavClick(key);
                        });

                    });

                    SITE.space(18);

                    SITE.button({
                        text: T.menu.cta,
                        kind: "primary",
                        width: "100%",
                        onClick: function () {
                            box.closeMenu();
                            params.onNavClick("contact");
                        },
                    });

                endGroup();

        endBox();

    };

    // Mobil menüyü kapatır.
    box.closeMenu = function () {

        if (!menuOverlay) return;

        const _overlay = menuOverlay;
        menuOverlay = null;

        _overlay.opacity = 0;
        setTimeout(function () { _overlay.remove(); }, 200);

    };

    // Sayfa kaydırıldıkça, çubuğun görünümünü değiştirir.
    box.refreshScrollState = function (scrollTop) {

        const newState = (scrollTop > 40) ? 1 : 0;

        if (newState == isScrolled) return;

        isScrolled = newState;
        applyState();

    };

    // *** OBJECT VIEW:

        // GROUP: Ortalanmış içerik
        HGroup(0, 0, "100%", "100%", {
            align: "center center",
            padding: [L.gutter, 0],
        });

            HGroup({
                width: L.content,
                height: "100%",
                align: "left center",
                gap: 10,
            });

                createBrand();

                // BOX: Boşluk
                Box(0, 0, 1, 1, { color: "transparent" });
                that.elem.style.flexGrow = "1";

                if (!L.mobile) {

                    // GROUP: Menü bağlantıları
                    HGroup({
                        width: "auto",
                        height: "100%",
                        align: "center",
                        gap: (L.w >= 1180) ? 24 : 18,
                    });

                        navKeys.forEach(function (key) {
                            createNavLabel(key);
                        });

                    endGroup();

                    SITE.space(1);

                }

                createLanguageSwitch();

                if (!L.mobile) {

                    ctaButton = SITE.button({
                        text: T.menu.cta,
                        kind: "light",
                        height: 42,
                        fontSize: 14,
                        onClick: function () { params.onNavClick("contact"); },
                    });

                } else {

                    createMenuButton();

                }

            endGroup();

        endGroup();

    // *** OBJECT INIT CODE:
    applyState();

    return endObject(box);

};
