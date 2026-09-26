/* Bismillah */

/*

Stats Section - v26.09
- Hero altındaki dört rakamlık güven şeridi.

*/

"use strict";

const StatsSection = function () {

    const L = SITE.L;
    const T = SITE.T.stats;

    // SECTION: Rakam şeridi
    const strip = SITE.startSection({
        key: "stats",
        color: SITE.WHITE,
        align: "center top",
        gap: 0,
        padY: L.mobile ? 28 : 34,
    });

    strip.elem.style.borderBottom = "1px solid " + SITE.LINE_SOFT;

        const itemW = L.mobile ? Math.floor((L.content - 20) / 2) : Math.floor((L.content - (3 * 24)) / 4);

        // GROUP: Rakamlar
        HGroup({
            width: "100%",
            height: "auto",
            align: "center center",
            gap: L.mobile ? 20 : 24,
            flexWrap: "wrap",
        });

            T.forEach(function (item) {

                // GROUP: Tek rakam
                VGroup({
                    width: itemW,
                    height: "auto",
                    align: "center top",
                    gap: 4,
                });

                    Label({
                        text: item.value,
                        width: "100%",
                        fontSize: L.mobile ? 22 : 28,
                        textAlign: "center",
                        textColor: SITE.PRIMARY,
                    });
                    that.elem.style.fontFamily = SITE.BOLD;
                    that.elem.style.letterSpacing = "-0.4px";

                    Label({
                        text: item.label,
                        width: "100%",
                        fontSize: L.small,
                        textAlign: "center",
                        textColor: SITE.TEXT_FAINT,
                    });
                    that.elem.style.lineHeight = "1.4";

                endGroup();

            });

        endGroup();

    SITE.endSection();

    return strip;

};
