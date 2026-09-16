/* Bismillah */

/*

PanelMockup - v26.09

- Hero bölümündeki panel görselini, basic.js ile çizer. (Resim değildir.)
- Draws the hero panel illustration with basic.js. (It is not an image.)

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

// Default values:
const PanelMockupDefaults = {
    width: 620,
    height: 400,
    menuItems: ["Home", "Reports", "Users", "Contents", "Modules"],
    selectedIndex: 2,
    statList: [
        { label: "USERS", value: "12.480" },
        { label: "ACTIVE", value: "3.219" },
        { label: "REVENUE", value: "₺84K" },
    ],
    barList: [34, 52, 41, 68, 57, 80, 62, 92, 74, 88, 66, 96],
    tableRowCount: 3,
};

const PanelMockup = function (params = {}) {

    mergeIntoIfMissing(params, PanelMockupDefaults);

    // BOX: Component container
    const box = startObject(params);

    // *** PRIVATE VARIABLES:
    const W = box.width;
    const H = box.height;
    const innerW = W - 2;                                // Kenarlık payı düşülmüş genişlik
    const innerH = H - 2;
    const s = W / 620;                                   // Ölçek çarpanı
    const px = function (v) { return Math.round(v * s); };

    const topH = px(40);
    const menuW = Math.max(px(96), Math.min(px(160), Math.round(innerW * 0.26)));
    const pad = px(14);
    const gap = px(10);
    const contentW = innerW - menuW - (pad * 2);
    const iconOpacity = 0.55;

    // *** OBJECT VIEW:
    box.color = SITE.WHITE;
    box.round = px(14);
    box.border = 1;
    box.borderColor = SITE.LINE;
    box.clipContent = 1;
    box.elem.style.boxShadow = "0px 26px 60px rgba(0, 0, 0, 0.22)";

        // GROUP: Üst bar
        box.topBar = HGroup(0, 0, "100%", topH, {
            align: "left center",
            color: SITE.PRIMARY,
            padding: [px(12), 0],
            gap: px(8),
        });

            // ICON: Panel simgesi
            Icon({ width: px(16), height: px(16), opacity: 0.95 });
            that.load(CONFIG.logoFile);

            // LABEL: Panel adı
            Label({
                text: "MY PANEL",
                width: "auto",
                fontSize: Math.max(8, px(11)),
                textColor: "rgba(255, 255, 255, 0.92)",
            });
            that.elem.style.fontFamily = SITE.BOLD;
            that.elem.style.letterSpacing = "1px";
            that.elem.style.whiteSpace = "nowrap";

            // BOX: Boşluk (sağdaki ikonları sağa iter)
            Box(0, 0, 1, 1, { color: "transparent" });
            that.elem.style.flexGrow = "1";

            // ICON: Sağ üst ikonlar
            ["assets/icons/search.png", "assets/icons/notification.png", "assets/icons/user.png"].forEach(function (file) {
                Icon({ width: px(14), height: px(14), opacity: 0.7 });
                that.load(file);
                that.elem.style.filter = "invert(100%)";
            });

        endGroup();

        // GROUP: Gövde
        box.body = HGroup(0, topH, "100%", innerH - topH, {
            align: "left top",
            gap: 0,
            color: "transparent",
        });

            // GROUP: Sol menü
            box.leftMenu = VGroup({
                width: menuW,
                height: "100%",
                align: "left top",
                gap: px(2),
                color: "#F4F4F0",
                padding: [px(8), px(10)],
            });
            that.elem.style.borderRight = "1px solid " + SITE.LINE;

                const menuIcons = [
                    "assets/icons/home.png",
                    "assets/icons/reports.png",
                    "assets/icons/data-table.png",
                    "assets/icons/data-table.png",
                    "assets/icons/brick.png",
                ];

                box.menuItems.forEach(function (name, index) {

                    const selected = (index == box.selectedIndex);

                    // GROUP: Menü satırı
                    HGroup({
                        width: "100%",
                        height: px(26),
                        align: "left center",
                        gap: px(7),
                        padding: [px(7), 0],
                        color: selected ? SITE.WHITE : "transparent",
                        round: px(6),
                    });
                    if (selected) that.elem.style.boxShadow = "0px 1px 2px rgba(0, 0, 0, 0.08)";

                        Icon({ width: px(12), height: px(12), opacity: selected ? 0.8 : 0.4 });
                        that.load(menuIcons[index % menuIcons.length]);

                        Label({
                            text: name,
                            width: "auto",
                            fontSize: Math.max(8, px(10)),
                            textColor: selected ? SITE.INK : SITE.TEXT_FAINT,
                        });
                        that.elem.style.whiteSpace = "nowrap";
                        if (selected) that.elem.style.fontFamily = SITE.BOLD;

                    endGroup();

                });

            endGroup(); // Sol menü

            // GROUP: İçerik
            box.content = VGroup({
                width: innerW - menuW,
                height: "100%",
                align: "left top",
                gap: gap,
                padding: [pad, pad],
                color: SITE.BG,
            });

                // GROUP: Sayı kartları
                HGroup({
                    width: contentW,
                    height: "auto",
                    align: "left top",
                    gap: gap,
                });

                    const statW = Math.floor((contentW - (gap * (box.statList.length - 1))) / box.statList.length);

                    box.statList.forEach(function (item) {

                        // GROUP: Tek kart
                        VGroup({
                            width: statW,
                            height: "auto",
                            align: "left top",
                            gap: px(4),
                            padding: px(10),
                            color: SITE.WHITE,
                            round: px(8),
                            border: 1,
                            borderColor: SITE.LINE_SOFT,
                        });

                            Label({
                                text: item.label,
                                width: "100%",
                                fontSize: Math.max(7, px(8)),
                                textColor: SITE.TEXT_FAINT,
                            });
                            that.elem.style.letterSpacing = "0.8px";

                            Label({
                                text: item.value,
                                width: "100%",
                                fontSize: Math.max(11, px(17)),
                                textColor: SITE.INK,
                            });
                            that.elem.style.fontFamily = SITE.BOLD;

                        endGroup();

                    });

                endGroup(); // Sayı kartları

                // GROUP: Grafik kartı
                const chartH = Math.max(px(70), innerH - topH - (pad * 2) - px(56) - px(86) - (gap * 2));

                VGroup({
                    width: contentW,
                    height: chartH,
                    align: "left top",
                    gap: px(8),
                    padding: px(10),
                    color: SITE.WHITE,
                    round: px(8),
                    border: 1,
                    borderColor: SITE.LINE_SOFT,
                });

                    Label({
                        text: "LAST 12 WEEKS",
                        width: "100%",
                        fontSize: Math.max(7, px(8)),
                        textColor: SITE.TEXT_FAINT,
                    });
                    that.elem.style.letterSpacing = "0.8px";

                    // GROUP: Çubuklar
                    HGroup({
                        width: "100%",
                        height: chartH - px(46),
                        align: "left bottom",
                        gap: px(5),
                    });

                        const barW = Math.max(3, Math.floor((contentW - px(20) - (px(5) * (box.barList.length - 1))) / box.barList.length));
                        const barMaxH = chartH - px(46);

                        box.barList.forEach(function (value, index) {

                            const last = (index == box.barList.length - 1);

                            Box(0, 0, barW, Math.round((value / 100) * barMaxH), {
                                color: last ? SITE.ACCENT : SITE.PRIMARY,
                                round: px(3),
                                opacity: last ? 1 : (0.25 + (index / box.barList.length) * 0.55),
                            });
                            that.elem.style.flexShrink = "0";

                        });

                    endGroup();

                endGroup(); // Grafik kartı

                // GROUP: Tablo kartı
                VGroup({
                    width: contentW,
                    height: "auto",
                    align: "left top",
                    gap: 0,
                    color: SITE.WHITE,
                    round: px(8),
                    border: 1,
                    borderColor: SITE.LINE_SOFT,
                });
                that.clipContent = 1;

                    const rowData = [
                        ["#1042", "Aylin K.", "Active"],
                        ["#1041", "Mert D.", "Pending"],
                        ["#1040", "Zeynep A.", "Active"],
                        ["#1039", "Can B.", "Active"],
                    ];

                    // GROUP: Başlık satırı
                    HGroup({
                        width: "100%",
                        height: px(22),
                        align: "left center",
                        gap: 0,
                        padding: [px(10), 0],
                        color: "#FAFAF7",
                    });
                    that.elem.style.borderBottom = "1px solid " + SITE.LINE_SOFT;

                        ["ID", "NAME", "STATUS"].forEach(function (title, index) {
                            Label({
                                text: title,
                                width: Math.floor((contentW - px(20)) / 3),
                                fontSize: Math.max(7, px(8)),
                                textColor: SITE.TEXT_FAINT,
                            });
                            that.elem.style.letterSpacing = "0.8px";
                        });

                    endGroup();

                    // GROUP: Veri satırları
                    for (let i = 0; i < box.tableRowCount; i++) {

                        HGroup({
                            width: "100%",
                            height: px(21),
                            align: "left center",
                            gap: 0,
                            padding: [px(10), 0],
                            color: "transparent",
                        });
                        if (i < box.tableRowCount - 1) that.elem.style.borderBottom = "1px solid " + SITE.LINE_SOFT;

                            rowData[i].forEach(function (cell, index) {

                                const isStatus = (index == 2);

                                Label({
                                    text: cell,
                                    width: Math.floor((contentW - px(20)) / 3),
                                    fontSize: Math.max(7, px(9)),
                                    textColor: isStatus ? SITE.PRIMARY : SITE.TEXT,
                                });
                                that.elem.style.whiteSpace = "nowrap";
                                if (index == 1) that.elem.style.fontFamily = SITE.BOLD;

                            });

                        endGroup();

                    }

                endGroup(); // Tablo kartı

            endGroup(); // İçerik

        endGroup(); // Gövde

    return endObject(box);

};
