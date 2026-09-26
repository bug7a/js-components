/* Bismillah */

/*

FormMockup - v26.09

- Hero bölümündeki görseli basic.js ile çizer (resim değildir): bir randevu formu ve ondan gelen e-posta kartı.
- Draws the hero illustration with basic.js (it is not an image): a booking form and the e-mail it sends.
- Yazılar: js/texts.js -> hero.mockup...

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

// Default values:
const FormMockupDefaults = {
    width: 560,
    height: 420,
    formColor: "#65A293", // js-form sayfalarının düğme rengi
};

const FormMockup = function (params = {}) {

    mergeIntoIfMissing(params, FormMockupDefaults);

    params.color = "transparent";

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const T = SITE.T.hero;
    const W = box.width;
    const s = W / 560;                                   // Ölçek çarpanı
    const px = function (v) { return Math.round(v * s); };
    const formW = Math.round(W * 0.8);
    const mailW = Math.round(W * 0.5);

    // *** OBJECT VIEW:

    box.clipContent = 0;

    // GROUP: Form kartı
    box.formCard = VGroup(0, 0, formW, "auto", {
        align: "left top",
        gap: px(10),
        padding: [px(22), px(22)],
        color: SITE.WHITE,
        round: px(16),
    });
    that.elem.style.boxShadow = "0px 26px 60px rgba(0, 0, 0, 0.28)";

        // LABEL: Form başlığı
        Label({ text: T.mockupFormTitle, width: "100%", fontSize: Math.max(12, px(19)), textColor: "#373836" });
        that.elem.style.fontFamily = SITE.BOLD;

        // BOX: Başlık çizgisi
        Box(0, 0, "100%", 1, { color: SITE.LINE_SOFT });
        that.elem.style.flexShrink = "0";

        // GROUP: Alanlar
        T.mockupFields.forEach(function (title, index) {

            VGroup({ width: "100%", height: "auto", align: "left top", gap: px(3), padding: [px(14), px(9)], color: "#F6F6F6", round: px(8) });

                Label({ text: title, fontSize: Math.max(7, px(9)), textColor: "#7A7A78" });
                that.elem.style.letterSpacing = "0.6px";

                Label({ text: T.mockupValues[index], fontSize: Math.max(9, px(13)), textColor: "#373836" });
                that.elem.style.whiteSpace = "nowrap";

            endGroup();

        });

        // LABEL: Gönder düğmesi
        Label({
            text: T.mockupButton,
            width: "100%",
            height: px(38),
            fontSize: Math.max(9, px(13)),
            textColor: SITE.WHITE,
            color: box.formColor,
            round: px(8),
        });
        that.elem.style.fontFamily = SITE.BOLD;
        that.elem.style.letterSpacing = "1px";
        that.elem.style.display = "flex";
        that.elem.style.alignItems = "center";
        that.elem.style.justifyContent = "center";
        that.elem.style.marginTop = px(4) + "px";

    endGroup();

    // GROUP: E-posta kartı (formun sağ altına biner)
    box.mailCard = VGroup(W - mailW, 0, mailW, "auto", {
        align: "left top",
        gap: px(8),
        padding: [px(16), px(14)],
        color: SITE.WHITE,
        round: px(14),
    });
    that.elem.style.boxShadow = "0px 20px 50px rgba(0, 0, 0, 0.32)";
    that.elem.style.borderTop = px(4) + "px solid " + box.formColor;

        // GROUP: İkon + başlık
        HGroup({ width: "100%", height: "auto", align: "left center", gap: px(8) });

            // GROUP: Zarf ikonu
            VGroup({ width: px(30), height: px(30), align: "center", color: SITE.MINT, round: px(8) });
            that.elem.style.flexShrink = "0";
                Icon({ width: px(16), height: px(16), opacity: 0.7 });
                that.load("assets/icons/mail.png");
            endGroup();

            // GROUP: Başlık + referans
            VGroup({ width: "auto", height: "auto", align: "left top", gap: 0 });

                Label({ text: T.mockupMailTitle, fontSize: Math.max(9, px(13)), textColor: "#373836" });
                that.elem.style.fontFamily = SITE.BOLD;
                that.elem.style.whiteSpace = "nowrap";

                Label({ text: T.mockupMailRef, fontSize: Math.max(7, px(10)), textColor: box.formColor });
                that.elem.style.fontFamily = SITE.BOLD;
                that.elem.style.letterSpacing = "0.5px";

            endGroup();

        endGroup();

        // Satırlar: alan başlığı + değer
        [0, 1, 2].forEach(function (index) {

            VGroup({ width: "100%", height: "auto", align: "left top", gap: px(1) });

                Label({ text: T.mockupFields[index], fontSize: Math.max(6, px(8)), textColor: SITE.TEXT_FAINT });
                that.elem.style.letterSpacing = "0.6px";

                Label({ text: T.mockupValues[index], width: "100%", fontSize: Math.max(8, px(11)), textColor: SITE.TEXT });
                that.elem.style.whiteSpace = "nowrap";
                that.elem.style.overflow = "hidden";
                that.elem.style.textOverflow = "ellipsis";

            endGroup();

        });

    endGroup();

    // E-posta kartı, formun alt kısmına biner. Kutunun yüksekliği iki kartı kapsar.
    // WHY: Kartların yüksekliği içerikle belirleniyor; konum, çizildikten sonra hesaplanır.
    const place = function () {
        const formH = box.formCard.elem.offsetHeight;
        const mailH = box.mailCard.elem.offsetHeight;
        const mailTop = Math.max(px(40), formH - Math.round(mailH * 0.55));
        box.mailCard.top = mailTop;
        box.height = Math.max(formH, mailTop + mailH) + px(10);
    };

    place();
    box.formCard.onResize(place);

    // Hafif süzülme
    box.mailCard.elem.animate([
        { transform: "translateY(0px)" },
        { transform: "translateY(-" + px(8) + "px)" },
        { transform: "translateY(0px)" },
    ], { duration: 4200, iterations: Infinity, easing: "ease-in-out" });

    return endObject(box);

};
