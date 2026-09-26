/* Bismillah */

/*

Demo Section - v26.09
- Gerçek formlar, bir tarayıcı çerçevesi içinde. Üstteki sekmelerle formlar arasında geçilir.
- Formlar demo modundadır (SERVICE_URL boş): gönderilen hiçbir şey bir yere gitmez. Liste: CONFIG.demoForms
- Form, ziyaretçi düğmeye basınca yüklenir. (Sayfa açılışını yavaşlatmasın diye.)

*/

"use strict";

const DemoSection = function () {

    const L = SITE.L;
    const T = SITE.T.demo;

    let frameContent = null;
    let placeholder = null;
    let iframeElement = null;
    let urlLabel = null;
    let selectedIndex = 0;
    const tabList = [];

    const getSelectedForm = function () {
        return CONFIG.demoForms[selectedIndex];
    };

    const getFormURL = function () {
        return CONFIG.demoBaseURL + getSelectedForm().file;
    };

    // Seçili formu, çerçevenin içine yükler.
    const startDemo = function () {

        if (placeholder) {
            placeholder.remove();
            placeholder = null;
        }

        if (!iframeElement) {
            iframeElement = document.createElement("IFRAME");
            iframeElement.setAttribute("title", CONFIG.brandName + " demo");
            iframeElement.style.width = "100%";
            iframeElement.style.height = "100%";
            iframeElement.style.border = "0px";
            iframeElement.style.display = "block";
            iframeElement.style.background = SITE.WHITE;
            frameContent.elem.appendChild(iframeElement);
            frameContent.clickable = 1;
        }

        iframeElement.setAttribute("src", getFormURL());

    };

    // Sekme seçilince: görünüm güncellenir, demo başladı ise form değişir.
    const selectForm = function (index) {

        selectedIndex = index;

        tabList.forEach(function (tab, tabIndex) {
            const selected = (tabIndex === selectedIndex);
            tab.color = selected ? SITE.PRIMARY : SITE.WHITE;
            tab.textColor = selected ? SITE.WHITE : SITE.TEXT;
            tab.borderColor = selected ? SITE.PRIMARY : SITE.LINE;
        });

        if (urlLabel) {
            urlLabel.text = T.urlHost + "/" + getSelectedForm().file.replace(/\.htm$/, "");
        }

        if (iframeElement) startDemo();

    };

    // SECTION: Demo
    SITE.startSection({
        key: "demo",
        color: SITE.BG,
        align: "center top",
        gap: L.mobile ? 22 : 30,
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

        // GROUP: Form sekmeleri
        HGroup({
            width: Math.min(L.content, 900),
            height: "auto",
            align: "center center",
            gap: 8,
            flexWrap: "wrap",
        });

            CONFIG.demoForms.forEach(function (form, index) {

                const tab = Label({
                    text: T.forms[form.key],
                    width: "auto",
                    fontSize: L.mobile ? 13 : 14,
                    textColor: SITE.TEXT,
                    color: SITE.WHITE,
                    round: 100,
                    border: 1,
                    borderColor: SITE.LINE,
                });
                tab.elem.style.padding = L.mobile ? "8px 14px" : "9px 18px";
                tab.elem.style.fontFamily = SITE.BOLD;
                tab.elem.style.whiteSpace = "nowrap";
                tab.elem.style.cursor = "pointer";
                tab.elem.setAttribute("role", "tab");
                tab.setMotion("background-color 0.15s, color 0.15s, border-color 0.15s");

                tab.on("click", function () { selectForm(index); });

                tabList.push(tab);

            });

        endGroup();

        const frameW = Math.min(L.content, 900);
        const chromeH = L.mobile ? 30 : 38;
        const frameH = (L.mobile ? 560 : 660) + chromeH;

        // BOX: Tarayıcı çerçevesi
        startBox(0, 0, frameW, frameH, {
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

                urlLabel = Label({
                    text: "",
                    width: "auto",
                    fontSize: 11,
                    textColor: SITE.TEXT_FAINT,
                });
                that.elem.style.whiteSpace = "nowrap";

                Box(0, 0, 1, 1, { color: "transparent" });
                that.elem.style.flexGrow = "1";

                // BOX: Soldaki noktaların karşılığı (adres ortada dursun)
                Box(0, 0, 39, 1, { color: "transparent" });
                that.elem.style.flexShrink = "0";

            endGroup();

            // BOX: Formun yükleneceği alan
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

                    SITE.iconBadge("assets/icons/mail.png", { size: 58, iconSize: 28 });

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

            endBox(); // Form alanı

        endBox(); // Tarayıcı çerçevesi

        // BUTTON: Yeni sekmede aç
        SITE.button({
            text: T.newTabButton,
            kind: "ghost",
            height: 44,
            fontSize: 14,
            onClick: function () { go(getFormURL(), "_blank"); },
        });

    SITE.endSection();

    selectForm(0);

};
