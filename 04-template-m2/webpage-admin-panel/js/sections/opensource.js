/* Bismillah */

/*

Open Source Section - v26.09
- Panelin açık kaynak sürümünü anlatan renkli kutu.

*/

"use strict";

const OpenSourceSection = function () {

    const L = SITE.L;
    const T = SITE.T.openSource;

    // SECTION: Açık kaynak
    SITE.startSection({
        key: "openSource",
        color: SITE.WHITE,
        align: "center top",
        gap: 0,
    });

        const padding = L.mobile ? 26 : 48;
        const boxW = L.content;
        const innerW = boxW - (padding * 2);
        const colW = L.mobile ? innerW : Math.floor((innerW - 48) / 2);

        // BOX: Renkli kutu
        const panel = L.mobile
            ? VGroup({ width: boxW, height: "auto", align: "left top", gap: 30, padding: padding, color: SITE.PRIMARY, round: 20 })
            : HGroup({ width: boxW, height: "auto", align: "left top", gap: 48, padding: padding, color: SITE.PRIMARY, round: 20 });

        panel.elem.style.background =
            "radial-gradient(600px 300px at 90% 0%, rgba(101, 162, 147, 0.55), rgba(0, 0, 0, 0) 65%), " + SITE.PRIMARY;

            // GROUP: Sol sütun
            VGroup({
                width: colW,
                height: "auto",
                align: "left top",
                gap: 14,
            });

                SITE.eyebrow(T.eyebrow, 1).textColor = "rgba(255, 255, 255, 0.65)";

                SITE.h2(T.title, 1);

                SITE.lead(T.lead, colW, 1).textColor = "rgba(255, 255, 255, 0.78)";

                SITE.space(6);

                // GROUP: Düğmeler
                HGroup({
                    width: colW,
                    height: "auto",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                });

                    SITE.button({
                        text: T.primaryButton,
                        kind: "light",
                        height: 48,
                        fontSize: 15,
                        onClick: function () { go(CONFIG.githubURL, "_blank"); },
                    });

                    SITE.button({
                        text: T.secondaryButton,
                        kind: "ghost-dark",
                        height: 48,
                        fontSize: 15,
                        onClick: function () { go(CONFIG.handbookURL, "_blank"); },
                    });

                endGroup();

            endGroup(); // Sol sütun

            // GROUP: Sağ sütun (maddeler)
            VGroup({
                width: colW,
                height: "auto",
                align: "left top",
                gap: 14,
                padding: L.mobile ? 0 : [0, 6],
            });

                T.points.forEach(function (point) {
                    SITE.checkLine(point, colW, 1);
                });

            endGroup(); // Sağ sütun

        endGroup(); // Renkli kutu

    SITE.endSection();

};
