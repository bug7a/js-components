/* Bismillah */

/*

JS Components Website - Detail View - v26.09

- Bir bileşen açılınca ekran ikiye bölünür: solda örnek sayfanın çalışan hali (WebView),
  sağda kodu (örnek sayfa, bileşenin kaynağı ve sayfanın yüklediği diğer bileşen dosyaları).
- Aradaki çizgi sürüklenerek boyutlanır (çift tıklama: yarı yarıya). Seçim basic.storage içinde saklanır.
- Dar ekranda (CONFIG.splitBreakpoint altı) ekran bölünmez; üst çubuktaki düğme ile örnek ve kod sırayla gösterilir.
- When a component is opened the screen is split: the running sample on the left, its code on the right.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const DetailView = {

    box: null,
    comp: null,
    samples: [],
    sampleIndex: -1,
    sampleUrl: "",

    ratio: CONFIG.splitRatio,   // Canlı örneğin genişliği (0-1)
    mobilePane: "preview",      // Dar ekranda gösterilen: "preview", "code"

    files: [],                  // Kod sekmeleri: [{ path, language }]
    activePath: "",
    currentText: "",
    loadToken: 0,
    textCache: {},              // { path: Promise<text> }
    htmlCache: {},              // { path: renklendirilmiş HTML }

    removeKeyListener: null,

};

// *** OPEN / CLOSE:

DetailView.open = function (comp, sampleIndex = 0) {

    if (DetailView.box && DetailView.comp === comp) {
        DetailView.selectSample(sampleIndex);
        return;
    }

    DetailView.close();

    DetailView.comp = comp;
    DetailView.samples = CATALOG.getSamples(comp);
    DetailView.sampleIndex = -1;
    DetailView.mobilePane = "preview";

    const savedRatio = Number(basic.storage.load(CONFIG.splitStorageKey));
    DetailView.ratio = (savedRatio >= CONFIG.splitMin && savedRatio <= CONFIG.splitMax) ? savedRatio : CONFIG.splitRatio;

    DetailView.build();
    DetailView.relayout();
    DetailView.selectSample(sampleIndex);

    DetailView.removeKeyListener = page.on("keydown", function (self, event) {
        if (event.key == "Escape" && !event.defaultPrevented) SiteApp.goHome();
    });

};

DetailView.close = function () {

    if (DetailView.removeKeyListener) {
        DetailView.removeKeyListener();
        DetailView.removeKeyListener = null;
    }

    DetailView.stopDrag();

    if (DetailView.box) {
        // NOTE: remove(), içindeki WebView ve Tabs nesnelerinin remove() fonksiyonlarını da çağırır. (Sayfa kapanır.)
        DetailView.box.remove();
        DetailView.box = null;
    }

    DetailView.comp = null;
    DetailView.loadToken++;

};

// *** BUILD:

DetailView.build = function () {

    // BOX: Tam ekran
    DetailView.box = startBox(0, 0, "100%", "100%", { color: SITE.BG });

        // GROUP: Üst çubuk + bölünmüş alan
        VGroup({ width: "100%", height: "100%", align: "left top", gap: 0 });
        that.elem.style.alignItems = "stretch";

            DetailView.createTopBar();

            // GROUP: Bölünmüş alan
            DetailView.split = HGroup({ width: "100%", height: "auto", align: "left top", gap: 0 });
            DetailView.split.elem.style.flex = "1 1 0";
            DetailView.split.elem.style.minHeight = "0";
            DetailView.split.elem.style.alignItems = "stretch";

                DetailView.createPreviewPane();
                DetailView.createDivider();
                DetailView.createCodePane();

            endGroup();

        endGroup();

    endBox();

};

// *** TOP BAR:
DetailView.createTopBar = function () {

    const L = SITE.L;
    const T = SITE.T;
    const comp = DetailView.comp;
    const category = CATALOG.getCategory(comp.cat);

    // GROUP: Üst çubuk
    HGroup({ width: "100%", height: 60, align: "left center", gap: 12, padding: [14, 0], color: SITE.CARD });
    that.elem.style.flexShrink = "0";
    that.elem.style.borderBottom = "1px solid " + SITE.LINE;

        // Geri
        DetailView.btnBack = SITE.button({
            text: L.mobile ? "" : T.back,
            icon: "back",
            kind: "ghost",
            height: 36,
            fontSize: 13,
            hint: T.back,
            onClick: SiteApp.goHome,
        });

        DetailView.topDivider = SITE.divider(1);

        // LABEL: Bileşen adı
        SITE.label(comp.name, { bold: 1, fontSize: L.mobile ? 16 : 18, textColor: SITE.INK });
        that.elem.style.flex = "0 1 auto";
        that.elem.style.minWidth = "0";
        that.elem.style.overflow = "hidden";
        that.elem.style.textOverflow = "ellipsis";

        SITE.generationChip(comp.gen);

        // LABEL: Kategori ve kaynak dosya
        DetailView.lblMeta = SITE.label(category[SITE.lang] + "  ·  " + basic.escapeHtml(comp.source), { fontSize: 13, textColor: SITE.TEXT_FAINT });
        DetailView.lblMeta.elem.style.overflow = "hidden";
        DetailView.lblMeta.elem.style.textOverflow = "ellipsis";
        DetailView.lblMeta.elem.style.minWidth = "0";
        DetailView.lblMeta.elem.style.flex = "0 1 auto";

        SITE.spacer();

        // TABS: Dar ekranda; örnek veya kod
        DetailView.tabsPane = Tabs({
            variant: "pill",
            tabs: [
                { key: "preview", text: T.exampleShort },
                { key: "code", text: T.code },
            ],
            value: DetailView.mobilePane,
            ariaLabel: "View",
            style: {
                pillBar: { color: SITE.BG_SOFT, padding: [3, 3], round: 10 },
                tab: { fontSize: 13, padding: [12, 6], minHeight: 32, round: 8 },
                pillIndicator: { round: 8 },
            },
            onChange: function (self) {
                DetailView.mobilePane = self.value;
                DetailView.relayout();
            },
        });
        DetailView.tabsPane.elem.style.flexShrink = "0";

    endGroup();

};

// *** PREVIEW PANE: (Solda, canlı örnek)
DetailView.createPreviewPane = function () {

    const T = SITE.T;

    DetailView.previewPane = VGroup({ width: "50%", height: "auto", align: "left top", gap: 0, color: SITE.CARD });
    DetailView.previewPane.elem.style.alignItems = "stretch";
    DetailView.previewPane.elem.style.minWidth = "0";

        // GROUP: Başlık çubuğu
        HGroup({ width: "100%", height: 48, align: "left center", gap: 8, padding: [12, 0] });
        that.elem.style.flexShrink = "0";
        that.elem.style.borderBottom = "1px solid " + SITE.LINE;

            // LABEL: İkon + "Canlı örnek"
            DetailView.lblLive = Label({ text: SITE.svg("eye", SITE.TEXT_SOFT, 16), width: 16, height: 16 });
            that.elem.style.flexShrink = "0";
            DetailView.lblLiveText = SITE.label(T.liveExample, { bold: 1, fontSize: 13, textColor: SITE.TEXT_SOFT });

            // TABS: Birden fazla örnek var ise
            if (DetailView.samples.length > 1) {
                DetailView.tabsExamples = Tabs({
                    variant: "pill",
                    tabs: DetailView.samples.map(function (sample, index) {
                        return { key: String(index), text: sample.title };
                    }),
                    value: "0",
                    ariaLabel: "Examples",
                    style: {
                        pillBar: { color: SITE.BG_SOFT, padding: [3, 3], round: 9 },
                        tab: { fontSize: 12, padding: [10, 4], minHeight: 28, round: 7 },
                        pillIndicator: { round: 7 },
                    },
                    onChange: function (self) {
                        DetailView.selectSample(Number(self.value));
                    },
                });
                DetailView.tabsExamples.elem.style.flex = "0 1 auto";
                DetailView.tabsExamples.elem.style.minWidth = "0";
                DetailView.tabsExamples.elem.style.marginLeft = "6px";
            } else {
                DetailView.tabsExamples = null;
            }

            SITE.spacer();

            SITE.button({
                icon: "reload",
                kind: "plain",
                height: 32,
                hint: T.reload,
                onClick: function () { DetailView.view.reload(); },
            });

            SITE.button({
                icon: "open",
                kind: "plain",
                height: 32,
                hint: T.openInNewTab,
                onClick: function () { window.open(DetailView.sampleUrl, "_blank", "noopener"); },
            });

        endGroup();

        // WEB VIEW: Çalışan örnek
        DetailView.view = WebView({
            width: "100%",
            height: 100,
            title: DetailView.comp.name,
            placeholderText: "",
            style: {
                box: { color: "#FFFFFF", border: 0, round: 0 },
                loading: { color: "#FFFFFF", spinnerColor: "rgba(0, 0, 0, 0.4)" },
            },
            onError: function (self) { self.showError(T.sampleError); },
        });
        DetailView.view.elem.style.flex = "1 1 0";
        DetailView.view.elem.style.minHeight = "0";

    endGroup();

};

// *** DIVIDER: (Sürüklenerek boyutlanır)
DetailView.createDivider = function () {

    DetailView.divider = startBox({ width: 9, height: "auto", color: SITE.BG });
    DetailView.divider.elem.style.flexShrink = "0";
    DetailView.divider.elem.style.cursor = "col-resize";
    DetailView.divider.elem.style.borderLeft = "1px solid " + SITE.LINE;
    DetailView.divider.elem.style.touchAction = "none";
    DetailView.divider.elem.title = SITE.T.dragToResize;

        // BOX: Tutma çizgisi
        DetailView.dividerGrip = Box({ width: 3, height: 36, color: SITE.LINE_STRONG, round: 3 });
        that.elem.style.left = "50%";
        that.elem.style.top = "50%";
        that.elem.style.transform = "translate(-50%, -50%)";
        that.setMotion("background-color 0.15s, height 0.15s");

    endBox();

    DetailView.divider.on("mouseenter", function () {
        DetailView.dividerGrip.color = SITE.TEXT_SOFT;
        DetailView.dividerGrip.height = 48;
    });

    DetailView.divider.on("mouseleave", function () {
        if (DetailView.dragCover) return;
        DetailView.dividerGrip.color = SITE.LINE_STRONG;
        DetailView.dividerGrip.height = 36;
    });

    DetailView.divider.on("pointerdown", function (self, event) {
        event.preventDefault();
        DetailView.startDrag();
    });

    DetailView.divider.on("dblclick", function () {
        DetailView.setRatio(CONFIG.splitRatio);
    });

};

// WHY: Fare iframe'in üzerine gelince olaylar iframe'e gider ve sürükleme kopar.
//      Sürükleme boyunca, her şeyin üstünde saydam bir katman olayları yakalar.
DetailView.startDrag = function () {

    DetailView.stopDrag();

    const cover = Box(0, 0, "100%", "100%", { color: "transparent", clickable: 1 });
    page.add(cover);
    cover.position = "absolute";
    cover.elem.style.zIndex = "2147483000";
    cover.elem.style.cursor = "col-resize";
    cover.elem.style.touchAction = "none";
    DetailView.dragCover = cover;

    cover.on("pointermove", function (self, event) {
        const rect = DetailView.split.elem.getBoundingClientRect();
        if (rect.width <= 0) return;
        DetailView.setRatio((event.clientX - rect.left) / rect.width, 0);
    });

    cover.on("pointerup", DetailView.stopDrag);
    cover.on("pointercancel", DetailView.stopDrag);

};

DetailView.stopDrag = function () {

    if (!DetailView.dragCover) return;

    DetailView.dragCover.remove();
    DetailView.dragCover = null;

    if (DetailView.dividerGrip) {
        DetailView.dividerGrip.color = SITE.LINE_STRONG;
        DetailView.dividerGrip.height = 36;
    }

    basic.storage.save(CONFIG.splitStorageKey, DetailView.ratio);

};

DetailView.setRatio = function (ratio, save = 1) {

    DetailView.ratio = basic.clamp(ratio, CONFIG.splitMin, CONFIG.splitMax);
    DetailView.relayout();

    if (save) basic.storage.save(CONFIG.splitStorageKey, DetailView.ratio);

};

// *** CODE PANE: (Sağda, kod)
DetailView.createCodePane = function () {

    const T = SITE.T;

    DetailView.codePane = VGroup({ width: "50%", height: "auto", align: "left top", gap: 0, color: SITE.CODE_BG });
    DetailView.codePane.elem.style.flex = "1 1 0";
    DetailView.codePane.elem.style.minWidth = "0";
    DetailView.codePane.elem.style.alignItems = "stretch";

        // GROUP: Dosya sekmeleri + kopyala
        HGroup({ width: "100%", height: 48, align: "left center", gap: 8, padding: [8, 0], color: SITE.CODE_BAR });
        that.elem.style.flexShrink = "0";
        that.elem.style.borderBottom = "1px solid " + SITE.CODE_LINE;

            // TABS: Dosyalar
            DetailView.tabsFiles = Tabs({
                styleName: "dark",
                tabs: [],
                ariaLabel: "Files",
                style: {
                    bar: { dividerColor: "transparent", gap: 2 },
                    tab: { fontSize: 13, padding: [12, 6], minHeight: 46 },
                    indicator: { color: "#7EE787" },
                    arrow: { background: SITE.CODE_BAR },
                },
                onChange: function (self) {
                    DetailView.showFile(self.value);
                },
            });
            DetailView.tabsFiles.elem.style.flex = "0 1 auto";
            DetailView.tabsFiles.elem.style.minWidth = "0";

            SITE.spacer();

            DetailView.btnCopy = SITE.button({
                text: T.copy,
                icon: "copy",
                kind: "code",
                height: 32,
                fontSize: 12,
                hint: T.copy,
                onClick: DetailView.copyCode,
            });

        endGroup();

        // BOX: Kod alanı (ScrollBar bu kutunun içine yerleşir)
        DetailView.codeWrap = startBox({ width: "100%", height: 100, color: SITE.CODE_BG });
        DetailView.codeWrap.elem.style.flex = "1 1 0";
        DetailView.codeWrap.elem.style.minHeight = "0";

            // BOX: Kaydırılan kutu
            DetailView.codeBox = startBox(0, 0, "100%", "100%", {
                color: SITE.CODE_BG,
                scrollY: 1,
                scrollX: 1,
            });
            endBox();

            DetailView.createCodeElements();

            SITE.addScrollBar(DetailView.codeBox, {
                bar_color: "#FFFFFF",
                bar_mouseOverColor: "#FFFFFF",
                bar_opacity: 0.22,
                bar_mouseOverOpacity: 0.45,
                bar_width: 5,
                bar_mouseOverWidth: 7,
            });

        endBox();

        // GROUP: Durum çubuğu
        HGroup({ width: "100%", height: 30, align: "left center", gap: 10, padding: [14, 0], color: SITE.CODE_BAR });
        that.elem.style.flexShrink = "0";
        that.elem.style.borderTop = "1px solid " + SITE.CODE_LINE;

            DetailView.lblPath = SITE.mono("", SITE.CODE_SOFT, 12);
            DetailView.lblPath.elem.style.overflow = "hidden";
            DetailView.lblPath.elem.style.textOverflow = "ellipsis";
            DetailView.lblPath.elem.style.minWidth = "0";
            DetailView.lblPath.elem.style.flex = "0 1 auto";

            SITE.spacer();

            DetailView.lblLines = SITE.mono("", SITE.CODE_SOFT, 12);

        endGroup();

    endGroup();

};

// Kod, basic.js nesnesi değil düz HTML olarak yazılır. (Binlerce satır; seçilip kopyalanabilir olmalı.)
// NOTE: basic.css kutulara pointer-events: none ve sayfaya user-select: none verir; burada açılıyor.
DetailView.createCodeElements = function () {

    const holder = document.createElement("div");
    holder.style.cssText = "display: flex; align-items: flex-start; min-width: max-content; min-height: 100%;"
        + "font-family: " + SITE.MONO + "; font-size: 13px; line-height: 20px;"
        + "pointer-events: auto; user-select: text; -webkit-user-select: text; cursor: text;";

    const gutter = document.createElement("div");
    gutter.setAttribute("aria-hidden", "true");
    gutter.style.cssText = "position: sticky; left: 0px; z-index: 1; align-self: stretch; box-sizing: border-box;"
        + "padding: 14px 12px 14px 16px; text-align: right; white-space: pre; min-width: 52px;"
        + "color: rgba(255, 255, 255, 0.26); background: " + SITE.CODE_BG + ";"
        + "border-right: 1px solid " + SITE.CODE_LINE + "; user-select: none; -webkit-user-select: none;";

    const pre = document.createElement("pre");
    pre.style.cssText = "margin: 0px; padding: 14px 28px 14px 18px; white-space: pre; tab-size: 4;"
        + "font: inherit; color: " + SITE.CODE_TEXT + ";";

    holder.appendChild(gutter);
    holder.appendChild(pre);
    DetailView.codeBox.elem.appendChild(holder);

    DetailView.codeGutter = gutter;
    DetailView.codePre = pre;

};

// *** SAMPLES:

DetailView.selectSample = function (index) {

    index = basic.clamp(Number(index) || 0, 0, DetailView.samples.length - 1);
    if (index === DetailView.sampleIndex) return;

    DetailView.sampleIndex = index;

    const sample = DetailView.samples[index];
    DetailView.sampleUrl = SITE.rootUrl(sample.file);
    DetailView.view.load(DetailView.sampleUrl);

    if (DetailView.tabsExamples) DetailView.tabsExamples.setValue(String(index), 1);

    DetailView.loadFiles(sample);
    SiteApp.replaceHash(DetailView.comp.key, index);

};

// *** FILES:

// Örnek sayfa ilk sekmede hemen gösterilir. Sonra sayfanın yüklediği bileşen dosyaları bulunur ve sekmelere eklenir.
DetailView.loadFiles = function (sample) {

    const token = ++DetailView.loadToken;
    const comp = DetailView.comp;

    DetailView.setFiles([sample.file]);
    DetailView.showFile(sample.file);

    DetailView.fetchText(sample.file).then(function (html) {

        if (token !== DetailView.loadToken) return null;

        const paths = DetailView.findComponentScripts(html, sample.file);
        if (paths.indexOf(comp.source) == -1 && paths.indexOf(comp.source.replace(/\.js$/, ".min.js")) == -1) {
            paths.unshift(comp.source);
        }

        // .min.js yerine, var ise okunabilir kaynağı göster.
        return Promise.all(paths.map(DetailView.findReadablePath));

    }).then(function (paths) {

        if (!paths || token !== DetailView.loadToken) return;

        // Bileşenin kendi kaynağı önce, sonra sayfadaki sıra.
        const unique = paths.filter(function (path, index) { return paths.indexOf(path) === index; });
        const mainIndex = unique.indexOf(comp.source);
        if (mainIndex > 0) {
            unique.splice(mainIndex, 1);
            unique.unshift(comp.source);
        }

        DetailView.setFiles([sample.file].concat(unique));

    }).catch(function () {
        // Örnek sayfa okunamadı: hata, ilk sekmede gösteriliyor.
    });

};

DetailView.setFiles = function (paths) {

    DetailView.files = paths.map(function (path) {
        return { path: path, language: /\.html?$/i.test(path) ? "html" : "js" };
    });

    // WHY: Tabs.setTabs(), sekmeleri oluştururken varsayılan kapsayıcıyı (setDefaultContainerBox) kendi iç kutusunda
    //      bırakıyor; sonra oluşturulan nesneler oraya ekleniyordu. createIn(), çağrıdan sonra önceki kapsayıcıyı geri yükler.
    createIn(page, function () {
        DetailView.tabsFiles.setTabs(paths.map(function (path) {
            return { key: path, text: basic.escapeHtml(SITE.fileName(path)) };
        }), 1);
    });

    if (paths.indexOf(DetailView.activePath) > -1) {
        DetailView.tabsFiles.setValue(DetailView.activePath, 1);
    }

};

// Sayfanın <script src> etiketlerinden, bileşen klasörlerindeki dosyalar. ("comp-m4/tabs.js")
// NOTE: Yorum satırı içindeki etiketler ve alt klasördeki kütüphaneler (chart-box/chart.umd.min.js) alınmaz.
DetailView.findComponentScripts = function (html, samplePath) {

    const clean = html.replace(/<!--[\s\S]*?-->/g, "");
    const regex = /<script\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/gi;
    const rootUrl = new URL(CONFIG.rootPath, location.href);
    const pageUrl = new URL(SITE.rootUrl(samplePath), location.href);
    const rootPath = decodeURIComponent(rootUrl.pathname);
    const paths = [];
    let match;

    while ((match = regex.exec(clean))) {

        let url;
        try {
            url = new URL(match[1], pageUrl);
        } catch (error) {
            continue;
        }

        if (url.origin !== rootUrl.origin) continue;

        const fullPath = decodeURIComponent(url.pathname);
        if (fullPath.indexOf(rootPath) !== 0) continue;

        const path = fullPath.slice(rootPath.length);
        if (/^comp-m\d\/[^\/]+\.js$/.test(path) && paths.indexOf(path) == -1) {
            paths.push(path);
        }

    }

    return paths;

};

DetailView.findReadablePath = function (path) {

    if (!/\.min\.js$/.test(path)) return Promise.resolve(path);

    const sourcePath = path.replace(/\.min\.js$/, ".js");

    return DetailView.fetchText(sourcePath).then(function () {
        return sourcePath;
    }, function () {
        return path;
    });

};

DetailView.fetchText = function (path) {

    if (!DetailView.textCache[path]) {

        DetailView.textCache[path] = fetch(SITE.rootUrl(path)).then(function (response) {
            if (!response.ok) throw new Error(response.status + " " + response.statusText);
            return response.text();
        });

        // Hata olursa önbellekte tutma; sonra tekrar denenebilsin.
        DetailView.textCache[path].catch(function () {
            delete DetailView.textCache[path];
        });

    }

    return DetailView.textCache[path];

};

// *** CODE:

DetailView.showFile = function (path) {

    const T = SITE.T;
    const file = DetailView.files.find(function (item) { return item.path === path; });
    if (!file) return;

    DetailView.activePath = path;
    DetailView.currentText = "";
    DetailView.tabsFiles.setValue(path, 1);
    DetailView.lblPath.text = basic.escapeHtml(path);
    DetailView.lblLines.text = "";
    DetailView.showMessage(T.loadingCode, SITE.CODE_SOFT);

    DetailView.fetchText(path).then(function (text) {

        if (!DetailView.box || DetailView.activePath !== path) return;
        DetailView.renderCode(path, text, file.language);

    }).catch(function (error) {

        if (!DetailView.box || DetailView.activePath !== path) return;

        let message = T.codeError + " " + path + "\n" + (error && error.message ? error.message : "");
        if (location.protocol == "file:") message = T.fileProtocol;
        DetailView.showMessage(message, "#FF7B72");

    });

};

DetailView.renderCode = function (path, text, language) {

    if (!DetailView.htmlCache[path]) {
        DetailView.htmlCache[path] = CodeHighlight.highlight(text, language);
    }

    let lineCount = text.split("\n").length;
    if (text.endsWith("\n")) lineCount--;

    const numbers = [];
    for (let i = 1; i <= Math.max(1, lineCount); i++) numbers.push(i);

    DetailView.codeGutter.style.display = "block";
    DetailView.codeGutter.textContent = numbers.join("\n");
    DetailView.codePre.style.whiteSpace = "pre";
    DetailView.codePre.innerHTML = DetailView.htmlCache[path];
    DetailView.codeBox.elem.scrollTop = 0;
    DetailView.codeBox.elem.scrollLeft = 0;

    DetailView.currentText = text;
    DetailView.lblLines.text = lineCount + " " + SITE.T.lines;

};

DetailView.showMessage = function (text, color) {

    DetailView.codeGutter.style.display = "none";
    DetailView.codePre.style.whiteSpace = "pre-wrap";
    DetailView.codePre.textContent = "";

    const span = document.createElement("span");
    span.style.color = color;
    span.style.fontStyle = "normal";
    span.textContent = text;
    DetailView.codePre.appendChild(span);

};

DetailView.copyCode = function () {

    const T = SITE.T;
    const text = DetailView.currentText;
    if (!text) return;

    const done = function () {
        if (typeof Toast === "function") Toast.show({ key: "copy", type: "success", message: T.copied });
    };

    const fail = function () {
        if (typeof Toast === "function") Toast.show({ key: "copy", type: "error", message: T.copyFailed });
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
        return;
    }

    // Eski yol: (http:// ile açılan sayfalarda clipboard API yok)
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position: fixed; left: -9999px; top: 0px;";
    document.body.appendChild(area);
    area.select();

    let ok = false;
    try {
        ok = document.execCommand("copy");
    } catch (error) {
        ok = false;
    }

    area.remove();
    if (ok) done(); else fail();

};

// *** LAYOUT:
DetailView.relayout = function () {

    if (!DetailView.box) return;

    const L = SITE.L;
    const split = L.split;

    // Üst çubuk
    DetailView.topDivider.visible = L.mobile ? 0 : 1;
    DetailView.lblMeta.visible = (L.w >= 1100) ? 1 : 0;
    DetailView.tabsPane.visible = split ? 0 : 1;
    // Örnek sekmeleri var ise, dar panelde "Canlı örnek" yazısı ve ikonu gizlenir.
    const paneWidth = split ? L.w * DetailView.ratio : L.w;
    const showLiveText = (DetailView.tabsExamples) ? (paneWidth >= 620) : (paneWidth >= 300);
    DetailView.lblLive.visible = showLiveText ? 1 : 0;
    DetailView.lblLiveText.visible = showLiveText ? 1 : 0;

    if (split) {
        DetailView.previewPane.visible = 1;
        DetailView.codePane.visible = 1;
        DetailView.divider.visible = 1;
        DetailView.previewPane.width = (DetailView.ratio * 100).toFixed(2) + "%";
        DetailView.previewPane.elem.style.flex = "0 0 auto";
    } else {
        const showCode = (DetailView.mobilePane == "code");
        DetailView.divider.visible = 0;
        DetailView.previewPane.visible = showCode ? 0 : 1;
        DetailView.codePane.visible = showCode ? 1 : 0;
        DetailView.previewPane.width = "100%";
        DetailView.previewPane.elem.style.flex = "1 1 0";
    }

};
