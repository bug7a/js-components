/* Bismillah */

/*

Hero Section - v26.09
- Sayfanın ilk ekranı: başlık, kısa anlatım, düğmeler ve form görseli (js/mockup.js).

*/

"use strict";

const HeroSection = function () {

    const L = SITE.L;
    const T = SITE.T.hero;

    // SECTION: Koyu zeminli açılış
    const strip = SITE.startSection({
        key: "top",
        color: SITE.INK,
        align: "center top",
        gap: 0,
        padTop: L.headerH + (L.mobile ? 44 : 80),
        padBottom: L.mobile ? 56 : 90,
    });

    strip.elem.style.background =
        "radial-gradient(900px 460px at 76% 6%, rgba(101, 162, 147, 0.26), rgba(0, 0, 0, 0) 62%), " +
        "radial-gradient(700px 400px at 8% 98%, rgba(44, 90, 56, 0.45), rgba(0, 0, 0, 0) 60%), " +
        SITE.INK;

    // Hareketli arka plan: kayan ızgara, süzülen ışık bulutları ve geçen parlama. (js/background.js)
    SITE.backgroundEffect(strip);

        const textW = L.mobile ? L.content : Math.round(L.content * 0.46);
        const visualW = L.mobile ? L.content : (L.content - textW - 40);

        // GROUP: Metin + görsel
        const row = L.mobile
            ? VGroup({ width: "100%", height: "auto", align: "left top", gap: 44 })
            : HGroup({ width: "100%", height: "auto", align: "left center", gap: 40 });

            // GROUP: Metin sütunu
            VGroup({
                width: textW,
                height: "auto",
                align: "left top",
                gap: L.mobile ? 16 : 20,
            });

                SITE.eyebrow(T.eyebrow, 1);

                SITE.h1(T.title, 1);

                SITE.lead(T.lead, textW, 1);

                SITE.space(4);

                // GROUP: Düğmeler
                HGroup({
                    width: textW,
                    height: "auto",
                    align: "left center",
                    gap: 12,
                    flexWrap: "wrap",
                });

                    SITE.button({
                        text: T.primaryButton,
                        kind: "primary",
                        onClick: function () { SITE.scrollToKey("contact"); },
                    });

                    SITE.button({
                        text: T.secondaryButton,
                        kind: "ghost-dark",
                        onClick: function () { SITE.scrollToKey("demo"); },
                    });

                endGroup();

                SITE.space(2);

                // LABEL: Alt not
                Label({
                    text: T.note,
                    width: textW,
                    fontSize: L.small,
                    textColor: SITE.ON_DARK_FAINT,
                });
                that.elem.style.lineHeight = "1.5";

            endGroup(); // Metin sütunu

            // GROUP: Form görseli
            VGroup({
                width: visualW,
                height: "auto",
                align: "center top",
                gap: 14,
            });

                const mockupW = Math.min(visualW, L.mobile ? L.content : 560);

                FormMockup({
                    width: mockupW,
                    height: Math.round(mockupW * 0.8),
                });

                // LABEL: Görsel açıklaması
                Label({
                    text: T.mockupCaption,
                    width: mockupW,
                    fontSize: L.tiny + 1,
                    textAlign: "center",
                    textColor: SITE.ON_DARK_FAINT,
                });
                that.elem.style.lineHeight = "1.5";

            endGroup(); // Form görseli

        endGroup(); // row

    SITE.endSection();

    return strip;

};
