/* Bismillah */

/*

Hero Section - v26.09
- Sayfanın ilk ekranı: başlık, kısa anlatım, düğmeler ve panelin ekran görüntüleri (PageControl).

*/

"use strict";

// Ekran görüntüleri: texts.js hero.screens ile aynı sırada.
const HERO_SCREEN_FILES = [
    "assets/screens/dashboard.jpg",
    "assets/screens/orders.jpg",
    "assets/screens/cold-rooms.jpg",
    "assets/screens/energy-hub.jpg",
];

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

            // GROUP: Panel görseli
            VGroup({
                width: visualW,
                height: "auto",
                align: "center top",
                gap: 14,
            });

                // Panelin gerçek ekran görüntüleri (1440 x 900), PageControl ile kayan bir gösteri.
                const screenW = Math.min(visualW, L.mobile ? L.content : 620);
                const screenH = Math.round(screenW * 900 / 1440);

                const screens = PageControl({
                    width: screenW,
                    height: screenH,
                    dots: 1,
                    arrows: !L.mobile,
                    loop: 1,
                    autoPlay: 4,
                    ariaLabel: T.screenCaption.replace("{screen} · ", ""),
                    style: {
                        box: { color: SITE.INK, border: 1, borderColor: White(0.14), round: 12 },
                        dots: { color: White(0.35), activeColor: SITE.WHITE, bottom: 10 },
                        arrows: { size: 32, iconSize: 16 },
                    },
                    onChange: function (self) {
                        SITE.heroScreen = self.value;
                        captionLabel.text = captionText(self.value);
                    },
                });
                screens.clipContent = 1;
                screens.elem.style.boxShadow = "0px 26px 60px rgba(0, 0, 0, 0.35)";
                // WHY: The dots are over a busy picture: a dark pill behind them.
                if (screens.dotsBox) {
                    screens.dotsBox.color = "rgba(0, 0, 0, 0.45)";
                    screens.dotsBox.round = 100;
                }

                    HERO_SCREEN_FILES.forEach(function (file, index) {
                        const key = String(index);
                        screens.addPage(key);
                        screens.startPage(key);
                            Icon(0, 0, "100%", "100%", {
                                imageFit: "cover",
                                alt: T.screens[index],
                            });
                            that.load(file);
                            that.elem.style.objectPosition = "left top";
                        screens.endPage();
                    });

                // WHY: The site is drawn again on resize: stay on the same screen (without the slide motion).
                if (SITE.heroScreen) {
                    const motion = screens.motion;
                    screens.motion = 0;
                    screens.open(SITE.heroScreen, 1);
                    screens.motion = motion;
                }

                // "Dashboard · Canlı demodan gerçek ekran görüntüsü"
                const captionText = function (key) {
                    return T.screenCaption.replace("{screen}", T.screens[Number(key) || 0]);
                };

                // LABEL: Görsel açıklaması (açık ekranın adı)
                const captionLabel = Label({
                    text: captionText(screens.value),
                    width: screenW,
                    fontSize: L.tiny + 1,
                    textAlign: "center",
                    textColor: SITE.ON_DARK_FAINT,
                });
                that.elem.style.lineHeight = "1.5";

            endGroup(); // Panel görseli

        endGroup(); // row

    SITE.endSection();

    return strip;

};
