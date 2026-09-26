/* Bismillah */

/*

Services Section - v26.09
- Üç hizmet kartı: kurulum ve mail servisi, size özel form, veri tabanı ve panel.

*/

"use strict";

const ServicesSection = function () {

    const L = SITE.L;
    const T = SITE.T.services;

    // SECTION: Hizmetler
    SITE.startSection({
        key: "services",
        color: SITE.BG,
        align: "center top",
        gap: L.mobile ? 30 : 46,
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

        const cardW = L.columns(3);

        // GRID: Kartlar
        SITE.startGrid();

            T.items.forEach(function (item) {

                // CARD: Tek hizmet
                SITE.startCard({ width: cardW, gap: 14, padding: L.mobile ? 24 : 30 });

                    SITE.iconBadge(item.icon, { size: 52, iconSize: 26 });

                    SITE.space(2);

                    SITE.h3(item.title);

                    SITE.text(item.text, cardW - (L.mobile ? 48 : 60));

                    SITE.space(2);

                    SITE.divider(cardW - (L.mobile ? 48 : 60));

                    SITE.space(2);

                    // GROUP: Maddeler
                    VGroup({
                        width: "100%",
                        height: "auto",
                        align: "left top",
                        gap: 8,
                    });

                        item.points.forEach(function (point) {
                            SITE.checkLine(point, cardW - (L.mobile ? 48 : 60));
                        });

                    endGroup();

                SITE.endCard();

            });

        SITE.endGrid();

    SITE.endSection();

};
