/* Bismillah */

/*

Use Cases Section - v26.09
- Panelin hangi ekiplere satıldığını anlatan dört kart.

*/

"use strict";

const UseCasesSection = function () {

    const L = SITE.L;
    const T = SITE.T.useCases;

    // SECTION: Kimler için
    SITE.startSection({
        key: "useCases",
        color: SITE.BG,
        align: "center top",
        gap: L.mobile ? 28 : 40,
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
            if (T.lead) SITE.lead(T.lead).textAlign = "center";

        endGroup();

        const cardW = L.columns(2);
        const innerW = cardW - (L.mobile ? 48 : 60);

        // GRID: Kartlar
        SITE.startGrid();

            T.items.forEach(function (item, index) {

                // CARD: Tek kullanım alanı
                SITE.startCard({
                    width: cardW,
                    gap: 12,
                    padding: L.mobile ? 24 : 30,
                    color: SITE.WHITE,
                });

                    // GROUP: Başlık satırı
                    HGroup({
                        width: innerW,
                        height: "auto",
                        align: "left center",
                        gap: 12,
                    });

                        // LABEL: Sıra numarası
                        Label({
                            text: "0" + (index + 1),
                            width: 34,
                            height: 34,
                            fontSize: 12,
                            textAlign: "center",
                            textColor: SITE.PRIMARY,
                            color: SITE.MINT,
                            round: 100,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.lineHeight = "34px";
                        that.elem.style.flexShrink = "0";

                        SITE.h3(item.title, 0, innerW - 46);

                    endGroup();

                    SITE.text(item.text, innerW);

                SITE.endCard();

            });

        SITE.endGrid();

    SITE.endSection();

};
