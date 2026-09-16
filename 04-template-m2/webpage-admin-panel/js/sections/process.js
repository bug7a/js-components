/* Bismillah */

/*

Process Section - v26.09
- Dört adımlık çalışma süreci.

*/

"use strict";

const ProcessSection = function () {

    const L = SITE.L;
    const T = SITE.T.process;

    // SECTION: Süreç
    SITE.startSection({
        key: "process",
        color: SITE.WHITE,
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
            if (T.lead) SITE.lead(T.lead).textAlign = "center";

        endGroup();

        const stepW = L.columns(4);

        // GRID: Adımlar
        SITE.startGrid({ justify: "left" });

            T.items.forEach(function (item, index) {

                // GROUP: Tek adım
                VGroup({
                    width: stepW,
                    height: "auto",
                    align: "left top",
                    gap: 10,
                });

                    // GROUP: Numara çizgisi
                    HGroup({
                        width: "100%",
                        height: "auto",
                        align: "left center",
                        gap: 10,
                    });

                        Label({
                            text: item.step,
                            width: "auto",
                            fontSize: 13,
                            textColor: SITE.PRIMARY,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.letterSpacing = "1px";

                        Box(0, 0, 1, 1, { color: SITE.LINE });
                        that.elem.style.flexGrow = "1";
                        that.elem.style.height = "1px";

                        SITE.chip(item.time, { color: SITE.BG_SOFT, textColor: SITE.TEXT_FAINT });

                    endGroup();

                    SITE.space(2);

                    SITE.h3(item.title);

                    SITE.text(item.text, stepW, 0, L.small + 1);

                endGroup();

            });

        SITE.endGrid();

    SITE.endSection();

};
