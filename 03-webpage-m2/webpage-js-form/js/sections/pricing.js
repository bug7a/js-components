/* Bismillah */

/*

Pricing Section - v26.09
- Dört paket kartı. Fiyatlar js/texts.js içinden düzenlenir.

*/

"use strict";

const PricingSection = function () {

    const L = SITE.L;
    const T = SITE.T.pricing;

    // Kart düğmesine basılınca:
    const onCardButtonClick = function (item) {

        if (item.action == "download") {
            go(CONFIG.downloadURL, "_blank");
            return;
        }

        // Formdaki paket seçimini, seçilen kartla eşle.
        if (typeof SITE.selectPackage === "function") {
            SITE.selectPackage(item.packageIndex || 0);
        }

        SITE.scrollToKey("contact");

    };

    // SECTION: Fiyatlar
    SITE.startSection({
        key: "pricing",
        color: SITE.BG_SOFT,
        align: "center top",
        gap: L.mobile ? 28 : 44,
    });

        // GROUP: Bölüm başlığı
        VGroup({
            width: L.mobile ? "100%" : Math.min(720, L.content),
            height: "auto",
            align: "center top",
            gap: 12,
        });

            SITE.eyebrow(T.eyebrow).textAlign = "center";
            SITE.h2(T.title).textAlign = "center";
            SITE.lead(T.lead).textAlign = "center";

        endGroup();

        const cardW = L.columns(4);
        const padding = L.mobile ? 24 : 26;
        const innerW = cardW - (padding * 2);

        // GRID: Paketler
        SITE.startGrid();

            T.items.forEach(function (item) {

                // CARD: Tek paket
                const card = SITE.startCard({
                    width: cardW,
                    gap: 0,
                    padding: padding,
                    color: item.highlight ? SITE.WHITE : SITE.CARD,
                    borderColor: item.highlight ? SITE.PRIMARY : SITE.LINE,
                });

                if (item.highlight) {
                    card.border = 2;
                    card.elem.style.boxShadow = "0px 14px 40px rgba(44, 90, 56, 0.12)";
                }

                    // GROUP: Üst etiket satırı
                    HGroup({
                        width: innerW,
                        height: 26,
                        align: "left center",
                        gap: 8,
                    });

                        Label({
                            text: item.name,
                            width: "auto",
                            fontSize: L.small + 1,
                            textColor: SITE.TEXT_SOFT,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.letterSpacing = "0.4px";
                        that.elem.style.whiteSpace = "nowrap";
                        that.elem.style.flexShrink = "0"; // WHY: Ad, etiket yüzünden kısalmasın.

                        if (item.highlight) {
                            Box(0, 0, 1, 1, { color: "transparent" });
                            that.elem.style.flexGrow = "1";
                            SITE.chip(T.popularLabel, { fontSize: 10 });
                        }

                    endGroup();

                    SITE.space(14);

                    // LABEL: Fiyat
                    Label({
                        text: item.price,
                        width: innerW,
                        fontSize: L.mobile ? 30 : 32,
                        textColor: SITE.INK,
                    });
                    that.elem.style.fontFamily = SITE.BOLD;
                    that.elem.style.letterSpacing = "-0.8px";

                    // LABEL: Fiyat notu
                    Label({
                        text: item.priceNote,
                        width: innerW,
                        fontSize: L.tiny + 1,
                        textColor: SITE.TEXT_FAINT,
                    });

                    SITE.space(14);

                    SITE.text(item.text, innerW, 0, L.small + 1);

                    SITE.space(16);

                    SITE.divider(innerW);

                    SITE.space(16);

                    // GROUP: Maddeler
                    VGroup({
                        width: innerW,
                        height: "auto",
                        align: "left top",
                        gap: 9,
                    });

                        item.points.forEach(function (point) {
                            SITE.checkLine(point, innerW);
                        });

                    endGroup();

                    // BOX: Düğmeyi alta iten boşluk
                    Box(0, 0, 1, 20, { color: "transparent" });
                    that.elem.style.flexGrow = "1";

                    SITE.button({
                        text: item.button,
                        kind: item.highlight ? "primary" : "ghost",
                        width: innerW,
                        height: 46,
                        fontSize: 14,
                        onClick: function () { onCardButtonClick(item); },
                    });

                SITE.endCard();

            });

        SITE.endGrid();

        // LABEL: Alt not
        SITE.space(6);

        Label({
            text: T.footNote,
            width: "100%",
            fontSize: L.small,
            textAlign: "center",
            textColor: SITE.TEXT_FAINT,
        });

    SITE.endSection();

};
