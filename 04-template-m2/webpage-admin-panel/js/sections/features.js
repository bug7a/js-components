/* Bismillah */

/*

Features Section - v26.09
- Sekiz küçük özellik kartı. Koyu zemin üzerinde.

*/

"use strict";

const FeaturesSection = function () {

    const L = SITE.L;
    const T = SITE.T.features;

    // SECTION: Özellikler
    const strip = SITE.startSection({
        key: "features",
        color: SITE.INK,
        align: "center top",
        gap: L.mobile ? 30 : 46,
    });

    strip.elem.style.background =
        "radial-gradient(760px 420px at 50% -10%, rgba(101, 162, 147, 0.18), rgba(0, 0, 0, 0) 60%), " + SITE.INK;

        // GROUP: Bölüm başlığı
        VGroup({
            width: L.mobile ? "100%" : Math.min(760, L.content),
            height: "auto",
            align: "center top",
            gap: 12,
        });

            SITE.eyebrow(T.eyebrow, 1).textAlign = "center";
            SITE.h2(T.title, 1).textAlign = "center";
            SITE.lead(T.lead, "100%", 1).textAlign = "center";

        endGroup();

        const cardW = L.columns(4);
        const innerW = cardW - (L.mobile ? 44 : 44);

        // GRID: Kartlar
        SITE.startGrid();

            T.items.forEach(function (item) {

                // CARD: Tek özellik
                SITE.startCard({
                    width: cardW,
                    gap: 12,
                    padding: 22,
                    onDark: 1,
                });

                    SITE.iconBadge(item.icon, {
                        size: 42,
                        iconSize: 21,
                        color: "rgba(101, 162, 147, 0.16)",
                        round: 10,
                        invert: 1,
                        opacity: 0.85,
                    });

                    SITE.h3(item.title, 1);

                    SITE.text(item.text, innerW, 1, L.small + 1);

                SITE.endCard();

            });

        SITE.endGrid();

    SITE.endSection();

};
