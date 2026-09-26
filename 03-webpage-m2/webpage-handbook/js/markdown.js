/* Bismillah */

/*

basic.js Handbook Website - Markdown - v26.09

- El kitabı dosyaları için küçük, bağımlılıksız bir Markdown ayrıştırıcı.
  Metni bloklara böler; bloklar sonra basic.js nesneleri ile çizilir (js/doc-view.js).
- A small, dependency-free Markdown parser for the handbook files. It splits the text into blocks;
  the blocks are drawn with basic.js objects (js/doc-view.js).

Desteklenenler: # başlıklar, paragraf, - * + ve 1. listeler (iç içe), > alıntı, ``` kod blokları, ---,
tablo, **kalın**, *italik*, `kod`, [bağlantı](adres), çıplak https:// adresleri.

BLOCKS:
{ type: "heading", level, html, text, id }
{ type: "p", html }
{ type: "list", html }
{ type: "quote", blocks }
{ type: "code", language, code }
{ type: "table", html }
{ type: "hr" }

USAGE:
const doc = Markdown.parse(text);   // { blocks, title }
Markdown.resolveFile = function (fileName) { return chapterId or null; }; // "02-box.md" -> "#/box"

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const Markdown = {};

// Site tarafından verilir: "02-box.md" -> "box" (yoksa null)
Markdown.resolveFile = function (fileName) { return null; };

// *** BLOCKS:

Markdown.parse = function (text) {

    const lines = String(text).replace(/\r\n?/g, "\n").split("\n");
    const usedIds = {};
    const blocks = Markdown.parseBlocks(lines, usedIds);
    const first = blocks.find(function (block) { return block.type == "heading" && block.level == 1; });

    return {
        blocks: blocks,
        title: first ? first.text : "",
    };

};

Markdown.RE = {
    fence: /^\s*```\s*([\w-]*)\s*$/,
    fenceEnd: /^\s*```\s*$/,
    heading: /^(#{1,6})\s+(.*?)\s*#*\s*$/,
    hr: /^\s*(?:\*\s*){3,}$|^\s*(?:-\s*){3,}$|^\s*(?:_\s*){3,}$/,
    quote: /^\s*>/,
    listItem: /^(\s*)([-*+]|\d+[.)])\s+(.*)$/,
    tableDivider: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/,
};

Markdown.parseBlocks = function (lines, usedIds) {

    const RE = Markdown.RE;
    const blocks = [];
    let i = 0;

    const isBlockStart = function (line) {
        return RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) || RE.quote.test(line) || RE.listItem.test(line);
    };

    while (i < lines.length) {

        const line = lines[i];

        // Boş satır
        if (!line.trim()) {
            i++;
            continue;
        }

        // ``` kod bloğu
        let match = RE.fence.exec(line);
        if (match) {
            const code = [];
            i++;
            while (i < lines.length && !RE.fenceEnd.test(lines[i])) {
                code.push(lines[i]);
                i++;
            }
            i++; // Kapanış satırı
            blocks.push({ type: "code", language: (match[1] || "").toLowerCase(), code: code.join("\n") });
            continue;
        }

        // # Başlık
        match = RE.heading.exec(line);
        if (match) {
            const raw = match[2];
            const text = Markdown.plain(raw);
            let id = Markdown.slug(text) || "section";
            if (usedIds[id]) {
                usedIds[id]++;
                id += "-" + usedIds[id];
            } else {
                usedIds[id] = 1;
            }
            blocks.push({ type: "heading", level: match[1].length, html: Markdown.inline(raw), text: text, id: id });
            i++;
            continue;
        }

        // ---
        if (RE.hr.test(line)) {
            blocks.push({ type: "hr" });
            i++;
            continue;
        }

        // > Alıntı
        if (RE.quote.test(line)) {
            const inner = [];
            while (i < lines.length && RE.quote.test(lines[i])) {
                inner.push(lines[i].replace(/^\s*>\s?/, ""));
                i++;
            }
            blocks.push({ type: "quote", blocks: Markdown.parseBlocks(inner, usedIds) });
            continue;
        }

        // - Liste
        if (RE.listItem.test(line)) {
            const items = [];
            while (i < lines.length && lines[i].trim() && (RE.listItem.test(lines[i]) || /^\s{2,}\S/.test(lines[i]))) {
                items.push(lines[i]);
                i++;
            }
            blocks.push({ type: "list", html: Markdown.listHtml(items) });
            continue;
        }

        // | Tablo |
        if (line.indexOf("|") > -1 && i + 1 < lines.length && RE.tableDivider.test(lines[i + 1])) {
            const rows = [line];
            i += 2;
            while (i < lines.length && lines[i].indexOf("|") > -1 && lines[i].trim()) {
                rows.push(lines[i]);
                i++;
            }
            blocks.push({ type: "table", html: Markdown.tableHtml(rows) });
            continue;
        }

        // Paragraf
        const paragraph = [];
        while (i < lines.length && lines[i].trim() && !(paragraph.length && isBlockStart(lines[i]))) {
            paragraph.push(lines[i]);
            i++;
        }
        // WHY: Sonu iki boşlukla biten satır, satır sonudur (<br>).
        const html = paragraph.map(function (item, index) {
            const hardBreak = / {2,}$/.test(item) && index < paragraph.length - 1;
            return Markdown.inline(item.trim()) + (hardBreak ? "<br>" : "");
        }).join(" ").replace(/<br> /g, "<br>");
        blocks.push({ type: "p", html: html });

    }

    return blocks;

};

// İç içe liste (girinti ile)
Markdown.listHtml = function (lines) {

    const items = [];

    lines.forEach(function (line) {
        const match = Markdown.RE.listItem.exec(line);
        if (match) {
            items.push({ indent: match[1].replace(/\t/g, "    ").length, ordered: /\d/.test(match[2]), text: match[3] });
        } else if (items.length) {
            items[items.length - 1].text += " " + line.trim();
        }
    });

    let position = 0;

    const render = function (indent) {
        const tag = items[position].ordered ? "ol" : "ul";
        let html = "<" + tag + ">";
        while (position < items.length && items[position].indent === indent) {
            html += "<li>" + Markdown.inline(items[position].text);
            position++;
            if (position < items.length && items[position].indent > indent) {
                html += render(items[position].indent);
            }
            html += "</li>";
        }
        return html + "</" + tag + ">";
    };

    let out = "";
    while (position < items.length) out += render(items[position].indent);

    return out;

};

Markdown.tableHtml = function (rows) {

    const cells = function (row) {
        return row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(function (cell) { return cell.trim(); });
    };

    let html = "<table><thead><tr>";
    cells(rows[0]).forEach(function (cell) { html += "<th>" + Markdown.inline(cell) + "</th>"; });
    html += "</tr></thead><tbody>";

    rows.slice(1).forEach(function (row) {
        html += "<tr>";
        cells(row).forEach(function (cell) { html += "<td>" + Markdown.inline(cell) + "</td>"; });
        html += "</tr>";
    });

    return html + "</tbody></table>";

};

// *** INLINE:

Markdown.escape = function (text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

Markdown.inline = function (text) {

    // `kod` parçaları önce ayrılır: içleri Markdown olarak okunmaz.
    const codes = [];
    let html = String(text).replace(/`([^`]+)`/g, function (all, code) {
        codes.push(code);
        return "\u0000" + (codes.length - 1) + "\u0000";
    });

    html = Markdown.escape(html);

    // Çıplak adres: https://...
    html = html.replace(/(^|\s)(https?:\/\/[^\s<]+[^\s<.,;:)!?])/g, function (all, before, url) {
        return before + Markdown.link(url, url);
    });

    // **kalın**, __kalın__, *italik*
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(^|[^\w])__(.+?)__(?!\w)/g, "$1<strong>$2</strong>");
    html = html.replace(/(^|[^*\w])\*(?![\s*])(.+?)\*(?!\*)/g, "$1<em>$2</em>");

    // [yazı](adres)
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (all, label, url) {
        return Markdown.link(url.replace(/&amp;/g, "&"), label, 1);
    });

    // Kod parçalarını geri koy
    html = html.replace(/\u0000(\d+)\u0000/g, function (all, index) {
        return Markdown.codeSpan(codes[Number(index)]);
    });

    return html;

};

// <a>: sitenin kendi adresleri aynı sekmede, diğerleri yeni sekmede açılır.
Markdown.link = function (url, labelHtml, labelIsHtml = 0) {

    let href = url;
    const fileMatch = /^(?:\.\/)?(\d\d-[\w-]+\.md)(#.*)?$/.exec(url);
    if (fileMatch) {
        const chapterId = Markdown.resolveFile(fileMatch[1]);
        if (chapterId) href = "#/" + chapterId;
    }

    const label = labelIsHtml ? labelHtml : Markdown.escape(labelHtml);
    const external = /^https?:/.test(href);

    return '<a href="' + Markdown.escape(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";

};

// `02-box.md` gibi bir bölüm dosyasının adı, o bölüme bağlantı olur.
Markdown.codeSpan = function (code) {

    const html = "<code>" + Markdown.escape(code) + "</code>";

    if (/^\d\d-[\w-]+\.md$/.test(code)) {
        const chapterId = Markdown.resolveFile(code);
        if (chapterId) return '<a href="#/' + chapterId + '">' + html + "</a>";
    }

    return html;

};

// *** TEXT:

// Markdown işaretleri olmadan düz metin (arama ve başlık için).
Markdown.plain = function (text) {
    return String(text)
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[`*]/g, "")
        .replace(/(^|\s)_+|_+(\s|$)/g, "$1$2")
        .replace(/\s+/g, " ")
        .trim();
};

Markdown.slug = function (text) {
    const map = { "ç": "c", "ğ": "g", "ı": "i", "ö": "o", "ş": "s", "ü": "u", "â": "a", "î": "i", "û": "u" };
    return String(text)
        .toLocaleLowerCase("tr")
        .replace(/[çğıöşüâîû]/g, function (char) { return map[char]; })
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
};

// Bir blok listesinin düz metni (arama dizini için).
Markdown.blockText = function (block) {
    if (block.type == "p" || block.type == "list" || block.type == "table") {
        return block.html.replace(/<[^>]+>/g, " ").replace(/&quot;/g, "\"").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    }
    if (block.type == "quote") return block.blocks.map(Markdown.blockText).join(" ");
    if (block.type == "code") return block.code;
    return "";
};
