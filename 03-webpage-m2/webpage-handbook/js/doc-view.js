/* Bismillah */

/*

basic.js Handbook Website - Document View - v26.09

- Seçilen bölümü çizer: Markdown blokları basic.js nesnelerine dönüşür (başlık, paragraf, liste, not, kod).
- Sağda "Bu sayfada" listesi (geniş ekranda), altta önceki / sonraki bölüm.
- Draws the chosen chapter: the Markdown blocks become basic.js objects.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const DocView = {

    box: null,          // Kaydırılan içerik kutusu (layout.js oluşturur)
    flow: null,         // Bölümün içeriği (her bölümde yeniden oluşturulur)
    article: null,
    toc: null,
    chapter: null,
    headings: [],       // { id, level, label }
    tocItems: [],       // { id, label }
    activeTocId: "",
    scrollTimer: null,

};

// *** RENDER:

DocView.render = function (chapter) {

    const L = SITE.L;

    DocView.clear();
    DocView.chapter = chapter;
    DocView.layoutKey = [L.article, L.toc, L.mobile, L.pad].join(",");

    createIn(DocView.box, function () {

        // GROUP: Sayfa akışı
        DocView.flow = VGroup({ width: "100%", height: "auto", align: "center top", gap: 0, padding: [L.pad, L.mobile ? 24 : 44] });
        DocView.flow.clipContent = 0; // WHY: "Bu sayfada" listesi sticky; üst kutular overflow: hidden olmamalı.

            // GROUP: Yazı + "Bu sayfada"
            HGroup({ width: "auto", height: "auto", align: "left top", gap: 48 });
            that.clipContent = 0;

                // GROUP: Yazı
                DocView.article = VGroup({ width: L.article, height: "auto", align: "left top", gap: 18 });
                DocView.article.clipContent = 0;

                    // LABEL: Bölümün grubu
                    Label({ text: SITE.T.groups[chapter.group], fontSize: 11, textColor: SITE.ACCENT });
                    that.elem.style.fontFamily = SITE.BOLD;
                    that.elem.style.letterSpacing = "1.3px";
                    that.elem.style.textTransform = "uppercase";
                    that.elem.style.marginBottom = "-8px";

                    DocView.renderBlocks(chapter.doc.blocks);
                    DocView.createPager(chapter);

                    // LABEL: Alt bilgi
                    Label({ text: SITE.T.footerText, width: "100%", fontSize: 12, textColor: SITE.TEXT_FAINT });
                    that.elem.style.lineHeight = "1.6";
                    that.elem.style.marginTop = "8px";

                endGroup();

                if (L.toc) DocView.createToc();

            endGroup();

        endGroup();

    });

    DocView.box.elem.scrollTop = 0;
    DocView.updateActiveToc();

};

DocView.clear = function () {

    if (DocView.flow) {
        // NOTE: remove(), içindeki WebView nesnelerinin sayfalarını da kapatır.
        DocView.flow.remove();
        DocView.flow = null;
    }

    DocView.headings = [];
    DocView.tocItems = [];
    DocView.toc = null;
    DocView.activeTocId = "";

};

DocView.renderBlocks = function (blocks, inQuote = 0) {

    blocks.forEach(function (block, index) {
        DocView.renderBlock(block, index, inQuote);
    });

};

DocView.renderBlock = function (block, index, inQuote) {

    const L = SITE.L;

    switch (block.type) {

        case "heading":
            DocView.createHeading(block);
            break;

        case "p":
        case "list":
        case "table":
            DocView.createText(block.html, inQuote);
            break;

        case "quote":
            DocView.createQuote(block);
            break;

        case "hr":
            Box(0, 0, "100%", 1, { color: SITE.LINE });
            that.elem.style.flexShrink = "0";
            that.elem.style.margin = (L.mobile ? 8 : 14) + "px 0px";
            break;

        case "code":
            CodeBlock.create(block);
            break;

    }

};

// LABEL: Başlık
DocView.createHeading = function (block) {

    const L = SITE.L;
    const sizes = { 1: L.h1, 2: L.h2, 3: L.h3 };
    let html = block.html;

    // "basic.js — Box (Box Object)" -> "Box (Box Object)"
    if (block.level == 1) html = html.replace(/^basic\.js\s*[—–-]\s*/, "");

    const label = Label({
        text: html,
        width: "100%",
        fontSize: sizes[block.level] || L.body + 1,
        textColor: SITE.INK,
    });
    label.elem.classList.add("hb-text", "hb-heading");
    label.elem.style.fontFamily = SITE.BOLD;
    label.elem.style.lineHeight = (block.level == 1) ? "1.15" : "1.3";
    label.elem.style.overflow = "visible"; // WHY: Büyük yazının harfleri (Ö, Ş, ğ, g) satır kutusunun dışına taşar; basic.css etiketi keser.
    label.elem.style.letterSpacing = (block.level == 1) ? "-0.6px" : "-0.2px";
    label.elem.style.borderRadius = "6px";
    label.elem.id = "hb-" + block.id;
    if (block.level == 2) label.elem.style.marginTop = "10px";
    label.selectable = 1;

    DocView.headings.push({ id: block.id, level: block.level, label: label });

    return label;

};

// LABEL: Paragraf, liste veya tablo (satır içi HTML)
DocView.createText = function (html, inQuote = 0) {

    const label = Label({
        text: html,
        width: "100%",
        fontSize: SITE.L.body,
        textColor: SITE.TEXT,
    });
    label.elem.classList.add("hb-text");
    label.elem.style.lineHeight = "1.75";
    label.selectable = 1;
    if (inQuote) label.textColor = "rgba(0, 0, 0, 0.75)";

    return label;

};

// GROUP: > Not
DocView.createQuote = function (block) {

    const group = VGroup({ width: "100%", height: "auto", align: "left top", gap: 10, padding: [20, 14], color: SITE.NOTE_BG, round: 10 });
    group.elem.style.borderLeft = "3px solid " + SITE.ACCENT;
    group.elem.style.flexShrink = "0";

        DocView.renderBlocks(block.blocks, 1);

    endGroup();

    return group;

};

// *** PAGER: (Önceki / sonraki bölüm)
DocView.createPager = function (chapter) {

    const index = SiteApp.chapters.indexOf(chapter);
    const previous = SiteApp.chapters[index - 1];
    const next = SiteApp.chapters[index + 1];

    HGroup({ width: "100%", height: "auto", align: "left top", gap: 14, wrap: SITE.L.mobile ? 1 : 0 });
    that.elem.style.marginTop = "28px";
    that.clipContent = 0;

        if (previous) DocView.createPagerCard(previous, SITE.T.previous, "left");
        else SITE.spacer();

        if (next) DocView.createPagerCard(next, SITE.T.next, "right");
        else SITE.spacer();

    endGroup();

};

DocView.createPagerCard = function (chapter, text, side) {

    const isRight = (side == "right");

    const card = VGroup({
        width: SITE.L.mobile ? "100%" : "auto",
        height: "auto",
        align: isRight ? "right top" : "left top",
        gap: 4,
        padding: [18, 14],
        color: SITE.CARD,
        round: 12,
        border: 1,
        borderColor: SITE.LINE,
    });
    card.elem.style.flex = SITE.L.mobile ? "1 1 100%" : "1 1 0";
    card.elem.style.cursor = "pointer";
    card.elem.setAttribute("role", "link");
    card.elem.setAttribute("tabindex", "0");

        // GROUP: Ok + "Önceki"
        HGroup({ width: "auto", height: "auto", align: "left center", gap: 4 });
            if (!isRight) SITE.icon("left", SITE.TEXT_FAINT, 14);
            SITE.label(text, { fontSize: 12, textColor: SITE.TEXT_FAINT });
            if (isRight) SITE.icon("right", SITE.TEXT_FAINT, 14);
        endGroup();

        SITE.label(basic.escapeHtml(chapter.shortTitle), { bold: 1, fontSize: 16, textColor: SITE.INK });

    endGroup();

    card.setMotion("border-color 0.15s, box-shadow 0.15s");
    card.on("mouseenter", function () {
        card.borderColor = SITE.ACCENT;
        card.elem.style.boxShadow = "0px 6px 20px rgba(0, 0, 0, 0.06)";
    });
    card.on("mouseleave", function () {
        card.borderColor = SITE.LINE;
        card.elem.style.boxShadow = "none";
    });
    card.on("click", function () { SiteApp.openChapter(chapter.id); });
    card.on("keydown", function (self, event) {
        if (event.key == "Enter") SiteApp.openChapter(chapter.id);
    });

    return card;

};

// *** TABLE OF CONTENTS: ("Bu sayfada", geniş ekranda sağda)
DocView.createToc = function () {

    const items = DocView.headings.filter(function (heading) { return heading.level == 2; });
    if (items.length < 2) return;

    DocView.toc = VGroup({ width: CONFIG.tocWidth, height: "auto", align: "left top", gap: 2 });
    DocView.toc.elem.style.position = "sticky";
    DocView.toc.elem.style.top = "24px";
    DocView.toc.elem.style.flexShrink = "0";

        // LABEL: Başlık
        Label({ text: SITE.T.onThisPage, fontSize: 11, textColor: SITE.TEXT_FAINT });
        that.elem.style.fontFamily = SITE.BOLD;
        that.elem.style.letterSpacing = "1.2px";
        that.elem.style.textTransform = "uppercase";
        that.elem.style.marginBottom = "8px";

        items.forEach(function (heading) {

            const label = Label({ text: heading.label.text, width: "100%", fontSize: 13, textColor: SITE.TEXT_SOFT });
            label.elem.classList.add("hb-text");
            label.elem.style.padding = "5px 0px 5px 12px";
            label.elem.style.lineHeight = "1.45";
            label.elem.style.borderLeft = "2px solid " + SITE.LINE;
            label.elem.style.cursor = "pointer";
            label.setMotion("color 0.15s, border-color 0.15s");

            label.on("click", function () {
                SiteApp.openSection(DocView.chapter.id, heading.id);
            });

            DocView.tocItems.push({ id: heading.id, label: label });

        });

    endGroup();

};

// Ekranın üstündeki başlığı "Bu sayfada" listesinde işaretler.
DocView.updateActiveToc = function () {

    if (!DocView.tocItems.length) return;

    const boxTop = DocView.box.elem.getBoundingClientRect().top;
    let activeId = DocView.tocItems[0].id;

    DocView.headings.forEach(function (heading) {
        if (heading.level != 2) return;
        if (heading.label.elem.getBoundingClientRect().top - boxTop <= 110) activeId = heading.id;
    });

    // Sayfanın sonuna gelindi ise son başlık.
    const elem = DocView.box.elem;
    if (elem.scrollTop + elem.clientHeight >= elem.scrollHeight - 4) {
        activeId = DocView.tocItems[DocView.tocItems.length - 1].id;
    }

    if (activeId === DocView.activeTocId) return;
    DocView.activeTocId = activeId;

    DocView.tocItems.forEach(function (item) {
        const active = (item.id === activeId);
        item.label.textColor = active ? SITE.ACCENT : SITE.TEXT_SOFT;
        item.label.elem.style.borderLeftColor = active ? SITE.ACCENT : SITE.LINE;
    });

};

DocView.onScroll = function () {
    DocView.scrollTimer = waitAndRun(DocView.scrollTimer, DocView.updateActiveToc, 40);
};

// *** SECTIONS:

// Başlığa kaydırır ve kısa bir süre vurgular.
DocView.scrollToSection = function (id, smooth = 1) {

    const heading = DocView.headings.find(function (item) { return item.id === id; });
    if (!heading) return;

    const boxElem = DocView.box.elem;
    const top = heading.label.elem.getBoundingClientRect().top - boxElem.getBoundingClientRect().top + boxElem.scrollTop - 20;

    boxElem.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });

    heading.label.elem.classList.remove("hb-flash");
    void heading.label.elem.offsetWidth; // WHY: Aynı başlık tekrar seçilince animasyon baştan başlasın.
    heading.label.elem.classList.add("hb-flash");

};

// *** MESSAGE: (Yükleniyor / hata)
DocView.showMessage = function (text, buttonText = "", onClick = null) {

    DocView.clear();
    DocView.chapter = null;
    DocView.layoutKey = "";

    createIn(DocView.box, function () {

        DocView.flow = VGroup({ width: "100%", height: "100%", align: "center center", gap: 16, padding: 30 });

            Label({ text: "", width: Math.min(520, SITE.L.contentWidth - 60), fontSize: 15, textColor: SITE.TEXT_SOFT, textAlign: "center" });
            that.plainText = text;
            that.elem.style.lineHeight = "1.6";
            that.elem.style.textAlign = "center";

            if (buttonText) SITE.button({ text: buttonText, kind: "ghost", onClick: onClick });

        endGroup();

    });

};

// *** RESIZE:
DocView.relayout = function () {

    if (!DocView.chapter) return;

    // WHY: Yazı genişliği ve "Bu sayfada" listesi ekrana göre değişir; bölüm yeniden çizilir, yer korunur.
    //      Bu ölçüler değişmedi ise yeniden çizilmez (çalıştırılan örnekler kapanmasın).
    const L = SITE.L;
    const key = [L.article, L.toc, L.mobile, L.pad].join(",");
    if (key === DocView.layoutKey) return;

    const scrollTop = DocView.box.elem.scrollTop;
    DocView.render(DocView.chapter);
    DocView.box.elem.scrollTop = scrollTop;
    DocView.updateActiveToc();

};
