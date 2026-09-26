/* Bismillah */

/*

basic.js Handbook Website - Code Block - v26.09

- El kitabındaki kod blokları: renklendirilmiş kod, Kopyala ve (ekrana nesne çizen JavaScript örneklerinde) Çalıştır.
- Çalıştır: kod, basic.js yüklü küçük bir sayfa olarak WebView (iframe, srcdoc) içinde açılır.
  console.log / println / hatalar, sonucun altındaki konsolda gösterilir.
  İlk çalıştırmadan sonra kod düzenlenebilir: Ctrl (Cmd) + Enter tekrar çalıştırır, Sıfırla ilk haline döndürür.
- window.onload veya start() içermeyen parçalar, bir start() fonksiyonunun içine konularak çalıştırılır.
- Code blocks of the handbook: highlighted code, Copy and (for examples that draw objects) Run.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CodeBlock = {};

// Ekrana nesne çizen JavaScript örnekleri çalıştırılabilir.
CodeBlock.isRunnable = function (block) {
    if (block.language != "javascript" && block.language != "js") return false;
    return /\b(Box|Label|Button|Input|Icon|HGroup|VGroup|AutoLayout|startBox|startFlexBox|createBox|createLabel|createButton|createImage|createTextBox)\s*\(/.test(block.code);
};

// *** CREATE:
CodeBlock.create = function (block) {

    const T = SITE.T;
    const L = SITE.L;
    const runnable = CodeBlock.isRunnable(block);
    const language = (block.language == "html" || block.language == "htm") ? "html" : "js";
    let hasRun = 0;
    let consoleCount = 0;
    let noteShown = 0;
    let highlightedCode = block.code;

    // GROUP: Kart
    const card = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, color: SITE.CODE_BG, round: 12 });
    card.clipContent = 1;
    card.elem.style.alignItems = "stretch";
    card.elem.style.flexShrink = "0";

        // GROUP: Başlık çubuğu
        HGroup({ width: "100%", height: 42, align: "left center", gap: 8, padding: [14, 0], color: SITE.CODE_BAR });
        that.elem.style.flexShrink = "0";

            // LABEL: Dil
            Label({ text: basic.escapeHtml(block.language || "code"), fontSize: 12, textColor: SITE.CODE_SOFT });
            that.elem.style.fontFamily = SITE.MONO;
            that.elem.style.whiteSpace = "nowrap";
            that.elem.style.flexShrink = "0";

            // LABEL: Düzenleme ipucu (çalıştırınca)
            card.lblHint = Label({ text: T.editHint, fontSize: 12, textColor: SITE.CODE_SOFT });
            card.lblHint.elem.style.whiteSpace = "nowrap";
            card.lblHint.elem.style.overflow = "hidden";
            card.lblHint.elem.style.textOverflow = "ellipsis";
            card.lblHint.elem.style.minWidth = "0";
            card.lblHint.elem.style.flex = "0 1 auto";
            card.lblHint.visible = 0;

            SITE.spacer();

            card.btnReset = SITE.button({ icon: "reset", kind: "code", height: 28, hint: T.reset, onClick: function () { reset(); } });
            card.btnReset.visible = 0;

            SITE.button({ icon: "copy", kind: "code", height: 28, hint: T.copy, onClick: function () { CodeBlock.copy(getCode()); } });

            if (runnable) {
                card.btnRun = SITE.button({ text: T.run, icon: "play", kind: "run", height: 28, fontSize: 12, hint: T.run, onClick: function () { run(); } });
            }

        endGroup();

        // BOX: Kod (düz HTML: seçilebilir, düzenlenebilir)
        // NOTE: basic.css kutulara pointer-events: none ve sayfaya user-select: none verir; burada açılıyor.
        card.codeBox = Box({ width: "100%", height: "auto", color: "transparent" });
        card.codeBox.elem.style.position = "relative";

        const pre = document.createElement("pre");
        pre.style.cssText = "margin: 0px; padding: 16px 18px; white-space: pre-wrap; word-break: break-word; tab-size: 4;"
            + "font-family: " + SITE.MONO + "; font-size: " + (L.mobile ? 12 : 13) + "px; line-height: 21px;"
            + "color: " + SITE.CODE_TEXT + "; outline: none; caret-color: #FFFFFF;"
            + "pointer-events: auto; user-select: text; -webkit-user-select: text; cursor: text;";
        pre.setAttribute("spellcheck", "false");
        pre.innerHTML = CodeHighlight.highlight(block.code, language);
        card.codeBox.elem.appendChild(pre);
        card.pre = pre;

        // GROUP: Sonuç (çalıştırınca görünür)
        if (runnable) {

            card.resultBox = VGroup({ width: "100%", height: "auto", align: "left top", gap: 0, color: SITE.CARD });
            card.resultBox.elem.style.alignItems = "stretch";

                // GROUP: Sonuç başlığı
                HGroup({ width: "100%", height: 34, align: "left center", gap: 8, padding: [14, 0], color: "#F3F3F0" });
                that.elem.style.flexShrink = "0";
                that.elem.style.borderBottom = "1px solid " + SITE.LINE;

                    SITE.label(T.result, { bold: 1, fontSize: 12, textColor: SITE.TEXT_SOFT });

                endGroup();

                // WEB VIEW: Çalışan örnek
                card.view = WebView({
                    width: "100%",
                    height: CONFIG.runHeight,
                    title: T.result,
                    placeholderText: "",
                    style: {
                        box: { color: "#FFFFFF", border: 0, round: 0 },
                        loading: { color: "#FFFFFF", spinnerColor: "rgba(0, 0, 0, 0.35)", spinnerSize: 22 },
                    },
                    onMessage: function (self, data) {
                        if (data && data.hb === "console") addConsoleLine(data.level, data.text);
                    },
                });
                card.view.elem.style.flexShrink = "0";

                // GROUP: Konsol
                card.consoleBox = VGroup({ width: "100%", height: "auto", align: "left top", gap: 3, padding: [14, 10], color: "#F7F7F5" });
                card.consoleBox.elem.style.borderTop = "1px solid " + SITE.LINE;

                    SITE.label(T.console, { bold: 1, fontSize: 11, textColor: SITE.TEXT_FAINT });

                endGroup();
                card.consoleBox.visible = 0;

            endGroup();

            card.resultBox.visible = 0;

        }

    endGroup();

    // *** FUNCTIONS:

    const getCode = function () {
        // WHY: Düzenlenen kodda satırlar <br> veya <div> olabilir; innerText hepsini satır sonuna çevirir.
        return (hasRun) ? pre.innerText.replace(/\u00A0/g, " ") : block.code;
    };

    const setCode = function (code) {
        highlightedCode = code;
        pre.innerHTML = CodeHighlight.highlight(code, language);
    };

    const makeEditable = function () {
        pre.contentEditable = "plaintext-only";
        if (pre.contentEditable !== "plaintext-only") pre.contentEditable = "true";
        pre.style.boxShadow = "inset 3px 0px 0px " + SITE.RUN;
    };

    const run = function () {

        const code = getCode();

        if (!hasRun) {
            hasRun = 1;
            makeEditable();
            card.lblHint.visible = SITE.L.mobile ? 0 : 1;
            card.btnReset.visible = 1;
            card.btnRun.setText(T.runAgain);
            card.resultBox.visible = 1;
        }

        // Yeniden renklendir (kod değişti ise).
        if (code !== highlightedCode) setCode(code);

        clearConsole();
        card.view.loadHtml(CodeBlock.buildPage(code));

    };

    const reset = function () {
        setCode(block.code);
        if (hasRun) run();
    };

    const clearConsole = function () {
        const lines = card.consoleBox.children.slice(1);
        lines.forEach(function (line) { line.remove(); });
        consoleCount = 0;
        noteShown = 0;
        card.consoleBox.visible = 0;
    };

    const addConsoleLine = function (level, text) {

        if (!card.consoleBox || consoleCount >= 60) return;
        consoleCount++;

        const colors = { error: SITE.ERROR, warn: "#B7791F", info: SITE.ACCENT };

        createIn(card.consoleBox, function () {

            Label({ text: "", width: "100%", fontSize: 12, textColor: colors[level] || SITE.TEXT });
            that.plainText = String(text);
            that.elem.style.fontFamily = SITE.MONO;
            that.elem.style.whiteSpace = "pre-wrap";
            that.elem.style.wordBreak = "break-word";
            that.elem.style.lineHeight = "18px";
            that.selectable = 1;

            // Hata varsa, bir kez: "Bazı örnekler daha uzun bir örneğin parçasıdır."
            if (level == "error" && !noteShown) {
                noteShown = 1;
                Label({ text: "", width: "100%", fontSize: 12, textColor: SITE.TEXT_FAINT });
                that.plainText = T.snippetNote;
                that.elem.style.lineHeight = "18px";
            }

        });

        card.consoleBox.visible = 1;

    };

    // *** EVENTS:

    pre.addEventListener("keydown", function (event) {

        if (!hasRun) return;

        if (event.key == "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            run();
        } else if (event.key == "Tab" && !event.shiftKey) {
            event.preventDefault();
            document.execCommand("insertText", false, "    ");
        } else if (event.key == "Escape") {
            pre.blur();
        }

        // WHY: Sayfanın kısayolları ("/" arama) kod yazarken çalışmasın.
        event.stopPropagation();

    });

    return card;

};

// *** PAGE OF A LIVE EXAMPLE:

// Kod, basic.js yüklü küçük bir HTML sayfasına konur (srcdoc).
CodeBlock.buildPage = function (code) {

    // WHY: Örneklerdeki dosyalar (test.png) el kitabı klasöründe; göreli yollar oraya göre çözülür.
    //      Kütüphane dosyaları ise tam adresle yüklenir.
    const rootUrl = new URL(CONFIG.rootPath, location.href).href;
    const baseUrl = new URL(CONFIG.handbookPath + CONFIG.languageFolders[SITE.lang] + "/", location.href).href;
    const hasStart = /\bwindow\.onload\s*=|\b(?:const|let|var)\s+start\s*=|\bfunction\s+start\s*\(/.test(code);

    let script = hasStart ? code : "var start = function () {\n" + code + "\n};";
    script = script.replace(/<\/script/gi, "<\\/script");

    return "<!DOCTYPE html>\n<html>\n<head>\n"
        + "<meta charset=\"UTF-8\">\n"
        + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n"
        + "<base href=\"" + baseUrl + "\">\n"
        + "<link rel=\"stylesheet\" href=\"" + rootUrl + "basic/basic.min.css\">\n"
        + "<script>" + CodeBlock.CONSOLE_BRIDGE + "</script>\n"
        + "<script src=\"" + rootUrl + "basic/basic.min.js\"></script>\n"
        + "<script src=\"" + rootUrl + "basic/scroll-bar.min.js\"></script>\n"
        + "</head>\n<body>\n<script>\n" + script + "\n</script>\n</body>\n</html>";

};

// console.log / warn / error / info ve hatalar, üst sayfaya mesaj olarak gönderilir.
CodeBlock.CONSOLE_BRIDGE = "(function () {"
    + "var toText = function (value) {"
    + "  if (typeof value === 'string') return value;"
    + "  if (value && value.elem) return '[basic.js object]';"
    + "  try { var json = JSON.stringify(value); return (json === undefined) ? String(value) : json; } catch (e) { return String(value); }"
    + "};"
    + "var send = function (level, args) {"
    + "  try { parent.postMessage({ hb: 'console', level: level, text: Array.prototype.map.call(args, toText).join(' ') }, '*'); } catch (e) { }"
    + "};"
    + "['log', 'info', 'warn', 'error'].forEach(function (level) {"
    + "  var original = console[level];"
    + "  console[level] = function () { send(level, arguments); return original.apply(console, arguments); };"
    + "});"
    + "window.addEventListener('error', function (event) { send('error', [event.message]); });"
    + "window.addEventListener('unhandledrejection', function (event) { send('error', [String(event.reason)]); });"
    + "})();";

// *** COPY:
CodeBlock.copy = function (text) {

    const T = SITE.T;

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
