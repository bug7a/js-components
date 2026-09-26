/* Bismillah */

/*

Demo Section - v26.09
- Gerçek panelin, bir tarayıcı çerçevesi içinde çalışan kopyası.
- Panel, ziyaretçi düğmeye basınca yüklenir. (Sayfa açılışını yavaşlatmasın diye.)

*/

"use strict";

const DemoSection = function () {

    const L = SITE.L;
    const T = SITE.T.demo;

    let frameContent = null;
    let placeholder = null;
    let iframeElement = null;

    // Paneli, çerçevenin içine yükler.
    const startDemo = function () {

        if (iframeElement) return;

        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }

        iframeElement = document.createElement("IFRAME");
        iframeElement.setAttribute("src", CONFIG.demoURL);
        iframeElement.setAttribute("title", CONFIG.brandName + " demo");
        iframeElement.setAttribute("loading", "lazy");
        iframeElement.style.width = "100%";
        iframeElement.style.height = "100%";
        iframeElement.style.border = "0px";
        iframeElement.style.display = "block";

        frameContent.elem.appendChild(iframeElement);
        frameContent.clickable = 1;

    };

    // SECTION: Demo
    SITE.startSection({
        key: "demo",
        color: SITE.BG,
        align: "center top",
        gap: L.mobile ? 26 : 38,
    });

        // GROUP: Bölüm başlığı
        VGroup({
            width: L.mobile ? "100%" : Math.min(760, L.content),
            height: "auto",
            align: "center top",
            gap: 12,
        });

            SITE.eyebrow(T.eyebrow).textAlign = "center";
            SITE.h2(T.title).textAlign = "center";
            SITE.lead(T.lead).textAlign = "center";

        endGroup();

        const frameW = Math.min(L.content, 1040);
        const chromeH = L.mobile ? 30 : 38;
        const frameH = Math.round(frameW * (L.mobile ? 1.1 : 0.62)) + chromeH;

        // BOX: Tarayıcı çerçevesi
        const frame = startBox(0, 0, frameW, frameH, {
            color: SITE.WHITE,
            round: 14,
            border: 1,
            borderColor: SITE.LINE,
        });
        that.clipContent = 1;
        that.elem.style.boxShadow = "0px 24px 60px rgba(0, 0, 0, 0.12)";
        that.elem.style.flexShrink = "0";
        that.position = "relative";

            // GROUP: Üst çubuk
            HGroup(0, 0, "100%", chromeH, {
                align: "left center",
                gap: 6,
                padding: [12, 0],
                color: "#F1F1EC",
            });
            that.elem.style.borderBottom = "1px solid " + SITE.LINE_SOFT;

                ["#E5885E", "#E8C46A", "#65A293"].forEach(function (color) {
                    Box(0, 0, 9, 9, { color: color, round: 100 });
                    that.elem.style.flexShrink = "0";
                });

                Box(0, 0, 1, 1, { color: "transparent" });
                that.elem.style.flexGrow = "1";

                Label({
                    text: "admin." + CONFIG.brandName.toLowerCase().replace(/ /g, "") + ".local",
                    width: "auto",
                    fontSize: 11,
                    textColor: SITE.TEXT_FAINT,
                });
                that.elem.style.whiteSpace = "nowrap";

                Box(0, 0, 1, 1, { color: "transparent" });
                that.elem.style.flexGrow = "1";

                // BOX: Soldaki noktaların karşılığı (URL ortada dursun)
                Box(0, 0, 39, 1, { color: "transparent" });
                that.elem.style.flexShrink = "0";

            endGroup();

            // BOX: Panelin yükleneceği alan
            frameContent = startBox(0, chromeH, "100%", frameH - chromeH - 2, {
                color: SITE.BG_SOFT,
            });

                // GROUP: Başlatma ekranı
                placeholder = VGroup(0, 0, "100%", "100%", {
                    align: "center",
                    gap: 16,
                    color: "transparent",
                });
                that.elem.style.background =
                    "radial-gradient(600px 300px at 50% 30%, rgba(101, 162, 147, 0.18), rgba(0, 0, 0, 0) 70%)";

                    SITE.iconBadge("assets/icons/apps.png", { size: 58, iconSize: 28 });

                    SITE.h3(T.frameTitle, 0, Math.min(420, frameW - 48)).textAlign = "center";

                    SITE.button({
                        text: T.startButton,
                        kind: "primary",
                        onClick: startDemo,
                    });

                    if (L.mobile) {
                        Label({
                            text: T.mobileWarning,
                            width: Math.min(320, frameW - 48),
                            fontSize: L.small,
                            textAlign: "center",
                            textColor: SITE.TEXT_FAINT,
                        });
                        that.elem.style.lineHeight = "1.5";
                    }

                endGroup();

            endBox(); // Panel alanı

        endBox(); // Tarayıcı çerçevesi

        // BUTTON: Yeni sekmede aç
        SITE.button({
            text: T.newTabButton,
            kind: "ghost",
            height: 44,
            fontSize: 14,
            onClick: function () { go(CONFIG.demoURL, "_blank"); },
        });

    SITE.endSection();

};
