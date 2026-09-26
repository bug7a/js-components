/* Bismillah */

/*

JS Form Website - Animated Section Background - v26.09

- Koyu zeminli bölümlerin arkasına canlı bir katman koyar: kayan ölçü ızgarası,
  ağır ağır süzülen ışık bulutları ve arada geçen ince bir parlama.
- Puts a living layer behind the dark sections: a drifting measure grid,
  slowly floating light clouds and a thin sheen passing now and then.

KULLANIM / USAGE:
SITE.backgroundEffect(strip);                 // Bölüm şeridinin arkasına ekler
SITE.backgroundEffect(strip, { level: 0.5 }); // Daha sönük (alt bilgi gibi yerler için)

NOT: Hareketin tamamı CSS ile yapılır (transform / opacity). Sayfada dönen bir zamanlayıcı yoktur,
     bu yüzden pili ve işlemciyi yormaz. İşletim sisteminde "hareketi azalt" açık ise efekt durur.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

// Izgara karesinin boyu. Kayma animasyonu da bu kadar ötelenir, böylece dikiş görünmez.
SITE.BG_GRID_SIZE = 64;

// *** STYLE:
// Anahtar kareler ve katman sınıfları. Sayfaya bir kez yazılır.
SITE.createBackgroundStyle = function () {

    if (document.getElementById("site-bg-effect-style")) return;

    const size = SITE.BG_GRID_SIZE;

    const css = `

    .site-bg {
        position: absolute;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        z-index: 0;
    }

    /* Ölçü ızgarası: yavaşça çapraz kayar. */
    .site-bg-grid {
        position: absolute;
        left: ${-size}px;
        top: ${-size}px;
        width: calc(100% + ${size * 2}px);
        height: calc(100% + ${size * 2}px);
        background-image:
            linear-gradient(rgba(255, 255, 255, 0.055) 1px, rgba(0, 0, 0, 0) 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.055) 1px, rgba(0, 0, 0, 0) 1px);
        background-size: ${size}px ${size}px;
        -webkit-mask-image: radial-gradient(120% 100% at 50% 0%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0) 78%);
        mask-image: radial-gradient(120% 100% at 50% 0%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0) 78%);
        will-change: transform;
        animation: siteBgGridDrift 34s linear infinite;
    }

    /* Işık bulutları: yerinde süzülür, hafifçe büyüyüp küçülür. */
    .site-bg-glow {
        position: absolute;
        border-radius: 50%;
        will-change: transform;
    }

    .site-bg-glow-a { animation: siteBgFloatA 26s ease-in-out infinite; }
    .site-bg-glow-b { animation: siteBgFloatB 34s ease-in-out infinite; }
    .site-bg-glow-c { animation: siteBgFloatC 30s ease-in-out infinite; }

    /* Arada bir soldan sağa geçen ince parlama. */
    .site-bg-sheen {
        position: absolute;
        left: -40%;
        top: -60%;
        width: 34%;
        height: 220%;
        transform: rotate(14deg) translate3d(0px, 0px, 0px);
        background: linear-gradient(90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.055) 50%,
            rgba(255, 255, 255, 0) 100%);
        will-change: transform, opacity;
        opacity: 0;
        animation: siteBgSheen 13s ease-in-out infinite;
    }

    @keyframes siteBgGridDrift {
        from { transform: translate3d(0px, 0px, 0px); }
        to   { transform: translate3d(-${size}px, -${size}px, 0px); }
    }

    @keyframes siteBgFloatA {
        0%   { transform: translate3d(0px, 0px, 0px) scale(1); }
        50%  { transform: translate3d(-46px, 34px, 0px) scale(1.14); }
        100% { transform: translate3d(0px, 0px, 0px) scale(1); }
    }

    @keyframes siteBgFloatB {
        0%   { transform: translate3d(0px, 0px, 0px) scale(1.06); }
        50%  { transform: translate3d(52px, -30px, 0px) scale(0.94); }
        100% { transform: translate3d(0px, 0px, 0px) scale(1.06); }
    }

    @keyframes siteBgFloatC {
        0%   { transform: translate3d(0px, 0px, 0px) scale(0.96); }
        50%  { transform: translate3d(28px, 26px, 0px) scale(1.1); }
        100% { transform: translate3d(0px, 0px, 0px) scale(0.96); }
    }

    @keyframes siteBgSheen {
        0%   { opacity: 0;    transform: rotate(14deg) translate3d(0px, 0px, 0px); }
        8%   { opacity: 1; }
        38%  { opacity: 1; }
        46%  { opacity: 0;    transform: rotate(14deg) translate3d(${Math.round(window.screen.width * 1.9)}px, 0px, 0px); }
        100% { opacity: 0;    transform: rotate(14deg) translate3d(${Math.round(window.screen.width * 1.9)}px, 0px, 0px); }
    }

    /* Küçük ekranda bulanıklık pahalıdır: daha az bulanıklık, parlama yok. */
    @media (max-width: 760px) {
        .site-bg-sheen { display: none; }
    }

    /* Ziyaretçi "hareketi azalt" demiş ise: katmanlar dursun, renkler kalsın. */
    @media (prefers-reduced-motion: reduce) {
        .site-bg-grid,
        .site-bg-glow,
        .site-bg-sheen {
            animation: none !important;
        }
        .site-bg-sheen { display: none; }
    }

    `;

    const style = document.createElement("STYLE");
    style.id = "site-bg-effect-style";
    style.textContent = css;
    document.getElementsByTagName("HEAD")[0].appendChild(style);

};

// *** EFFECT:
// Koyu bir bölüm şeridinin arkasına hareketli katmanı ekler.
// $strip: SITE.startSection() ile dönen grup. $params.level: 0-1 arası görünürlük.
SITE.backgroundEffect = function ($strip, $params = {}) {

    mergeIntoIfMissing($params, {
        level: 1,      // Katmanın genel görünürlüğü
        grid: 1,       // Ölçü ızgarası
        sheen: 1,      // Geçen parlama
    });

    if (!$strip || !$strip.elem) return null;

    SITE.createBackgroundStyle();

    const L = SITE.L;
    const level = $params.level;

    // Işık bulutu ekleyen yardımcı.
    const addGlow = function (className, style) {
        const glow = document.createElement("DIV");
        glow.className = "site-bg-glow " + className;
        for (const key in style) glow.style[key] = style[key];
        layer.appendChild(glow);
        return glow;
    };

    // BOX: Bütün katmanların durduğu kutu
    const layer = document.createElement("DIV");
    layer.className = "site-bg";

    // NOT: Mobilde bulanıklık daha küçük, yoksa eski telefonlarda kare kare ilerler.
    const blur = L.mobile ? 42 : 70;

    // IZGARA:
    if ($params.grid) {
        const grid = document.createElement("DIV");
        grid.className = "site-bg-grid";
        grid.style.opacity = String(level);
        layer.appendChild(grid);
    }

    // IŞIK BULUTLARI: Sitenin yeşil tonları, sağ üstte ve sol altta.
    addGlow("site-bg-glow-a", {
        left: "58%",
        top: "-22%",
        width: (L.mobile ? 320 : 560) + "px",
        height: (L.mobile ? 280 : 440) + "px",
        background: "radial-gradient(circle, rgba(101, 162, 147, 0.55), rgba(0, 0, 0, 0) 70%)",
        filter: "blur(" + blur + "px)",
        opacity: String(0.85 * level),
    });

    addGlow("site-bg-glow-b", {
        left: "-12%",
        top: "48%",
        width: (L.mobile ? 340 : 600) + "px",
        height: (L.mobile ? 300 : 460) + "px",
        background: "radial-gradient(circle, rgba(44, 90, 56, 0.85), rgba(0, 0, 0, 0) 70%)",
        filter: "blur(" + blur + "px)",
        opacity: String(0.9 * level),
    });

    // Sıcak vurgu: çok az, sadece derinlik versin diye.
    addGlow("site-bg-glow-c", {
        left: "30%",
        top: "62%",
        width: (L.mobile ? 220 : 380) + "px",
        height: (L.mobile ? 200 : 300) + "px",
        background: "radial-gradient(circle, rgba(229, 136, 94, 0.30), rgba(0, 0, 0, 0) 70%)",
        filter: "blur(" + (blur + 20) + "px)",
        opacity: String(0.55 * level),
    });

    // PARLAMA:
    if ($params.sheen) {
        const sheen = document.createElement("DIV");
        sheen.className = "site-bg-sheen";
        sheen.style.opacity = "0";
        layer.appendChild(sheen);
    }

    // WHY: Katman, şeridin ilk çocuğu olur. Bölüm içeriği (flex, position: relative)
    //      DOM sırasına göre bunun üstünde çizilir, yazılar katmanın arkasında kalmaz.
    $strip.elem.insertBefore(layer, $strip.elem.firstChild);

    return layer;

};
