/* Bismillah */

/*

FAQ Section - v26.09
- Tıklayınca açılan soru listesi.

*/

"use strict";

const FaqSection = function () {

    const L = SITE.L;
    const T = SITE.T.faq;

    const itemList = [];

    // Bir soruyu açar, diğerlerini kapatır.
    const toggleItem = function (index) {

        itemList.forEach(function (item, i) {

            const open = (i == index) ? !item.isOpen : 0;

            item.isOpen = open;
            item.answer.visible = open ? 1 : 0;
            item.mark.text = open ? "&#8722;" : "&#43;";
            item.card.color = open ? SITE.WHITE : "transparent";
            item.card.borderColor = open ? SITE.LINE : SITE.LINE_SOFT;

        });

    };

    // SECTION: S.S.S.
    SITE.startSection({
        key: "faq",
        color: SITE.BG,
        align: "center top",
        gap: L.mobile ? 26 : 40,
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

        endGroup();

        const listW = Math.min(820, L.content);
        const padding = L.mobile ? 18 : 24;
        const innerW = listW - (padding * 2) - 2;

        // GROUP: Sorular
        VGroup({
            width: listW,
            height: "auto",
            align: "left top",
            gap: 10,
        });

            T.items.forEach(function (item, index) {

                // GROUP: Tek soru
                const card = VGroup({
                    width: listW,
                    height: "auto",
                    align: "left top",
                    gap: 0,
                    padding: padding,
                    color: "transparent",
                    round: 12,
                    border: 1,
                    borderColor: SITE.LINE_SOFT,
                });
                card.setMotion("background-color 0.2s, border-color 0.2s");
                card.elem.style.cursor = "pointer";

                    // GROUP: Soru satırı
                    HGroup({
                        width: innerW,
                        height: "auto",
                        align: "left center",
                        gap: 14,
                    });

                        Label({
                            text: item.q,
                            width: innerW - 34,
                            fontSize: L.mobile ? 16 : 17,
                            textColor: SITE.INK,
                        });
                        that.elem.style.fontFamily = SITE.BOLD;
                        that.elem.style.lineHeight = "1.4";

                        // LABEL: Açma işareti
                        Label({
                            text: "&#43;",
                            width: 20,
                            height: 20,
                            fontSize: 20,
                            textAlign: "center",
                            textColor: SITE.PRIMARY,
                        });
                        that.elem.style.lineHeight = "19px";
                        that.elem.style.flexShrink = "0";

                        const mark = that;

                    endGroup();

                    // LABEL: Cevap
                    const answer = SITE.text(item.a, innerW, 0, L.body);
                    answer.elem.style.paddingTop = "14px";
                    answer.visible = 0;

                endGroup(); // Tek soru

                itemList.push({ card: card, answer: answer, mark: mark, isOpen: 0 });

                card.on("click", function () { toggleItem(index); });

            });

        endGroup(); // Sorular

    SITE.endSection();

};
