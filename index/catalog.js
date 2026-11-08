/* Bismillah */

/*

JS Components Website - Component Catalog - v26.09

- Sitede gösterilen bileşenlerin listesi. Yeni bir bileşen eklemek için COMPONENTS listesine bir satır ekleyin.
- The list of the components shown on the site. Add a line to COMPONENTS for a new component.

COMPONENT:
{
    key: "tabs",                            // Adres çubuğunda: index.htm#/tabs
    name: "Tabs",                           // Bileşenin adı (fonksiyon adı)
    cat: "navigation",                      // CATEGORIES anahtarı
    source: "comp/tabs.js",              // Bileşenin kaynak dosyası (deponun köküne göre)
    deps: ["comp/tooltip.js"],              // (isteğe bağlı) Önce yüklenmesi gereken dosyalar; basic-designer'ın Components paneli
                                            // bunları da yükler. Aynı liste test/components-test.htm'de de var.
    samples: ["02-comp-examples/tabs.htm"], // Örnek sayfalar. Başlık için: { file: "...", title: "..." }
    en: "...", tr: "...",                   // Kısa açıklama
}

- Kod panelinde; örnek sayfa, bileşenin kaynağı ve sayfanın yüklediği diğer bileşen dosyaları gösterilir.
  Sayfa .min.js yüklüyorsa, varsa okunabilir kaynağı (.js) gösterilir.

Developer: Bugra Ozden
Email: bugra.ozden@gmail.com

*/

"use strict";

const CATALOG = {};

// *** CATEGORIES: (Ana sayfadaki sıra)
CATALOG.CATEGORIES = [
    { key: "inputs", en: "Forms & Inputs", tr: "Form ve Giriş" },
    { key: "selection", en: "Selection", tr: "Seçim" },
    { key: "actions", en: "Buttons & Menus", tr: "Düğme ve Menü" },
    { key: "navigation", en: "Navigation", tr: "Gezinme" },
    { key: "data", en: "Data & Charts", tr: "Veri ve Grafik" },
    { key: "feedback", en: "Overlays & Feedback", tr: "Katman ve Bildirim" },
    { key: "pages", en: "Pages & Views", tr: "Sayfa ve Görünüm" },
    { key: "styles", en: "Effects & Styles", tr: "Efekt ve Stil" },
];

// *** COMPONENTS:
CATALOG.COMPONENTS = [
    {
        key: "tabs", name: "Tabs", cat: "navigation",
        source: "comp/tabs.js", samples: ["02-comp-examples/tabs.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Tab bar with underline and pill variants, counts, badges, closable tabs, a vertical mode and optional panels.",
        tr: "Alt çizgili ve hap görünümlü sekme çubuğu: sayı, rozet, kapatılabilir sekme, dikey düzen ve isteğe bağlı paneller.",
    },
    {
        key: "tree-view", name: "TreeView", cat: "navigation",
        source: "comp/tree-view.js", samples: ["02-comp-examples/tree-view.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A tree of nested items with lazy branches, keyboard and type-ahead: a file explorer, a category tree, a menu or design tool layers.",
        tr: "İç içe öğelerden oluşan ağaç; sonradan yüklenen dallar, klavye ve harfle atlama: dosya gezgini, kategori ağacı, menü veya tasarım aracı katmanları.",
    },
    {
        key: "breadcrumbs", name: "Breadcrumbs", cat: "navigation",
        source: "comp/breadcrumbs.js", samples: ["02-comp-examples/breadcrumbs.htm"],
        en: "Shows where the current page is in a hierarchy: Home / Products / Laptops.",
        tr: "Sayfanın bir hiyerarşideki yerini gösterir: Ana sayfa / Ürünler / Dizüstü.",
    },
    {
        key: "page-control", name: "PageControl", cat: "navigation",
        source: "comp/page-control.js", samples: ["02-comp-examples/page-control.htm"],
        en: "Sliding or fading pages for wizards, carousels and app screens, with swipe, dots, arrows and auto play.",
        tr: "Sihirbaz, karusel ve uygulama ekranları için kayan veya solan sayfalar: kaydırma, noktalar, oklar, otomatik geçiş.",
    },
    {
        key: "search-results", name: "SearchResults", cat: "navigation",
        source: "comp/search-results.js", deps: ["comp/search-input.js"], samples: ["02-comp-examples/search-results.htm"],
        en: "The result list that opens under a search input, like an autocomplete or a command palette.",
        tr: "Arama kutusunun altında açılan sonuç listesi; otomatik tamamlama veya komut paleti gibi.",
    },
    {
        key: "action-tab-bar", name: "ActionTabBar", cat: "navigation",
        source: "comp/action-tab-bar.js", samples: ["02-comp-examples/action-tab-bar.htm"],
        en: "A bottom tab bar with a big round + button for the main action of the app; a line slides under the selected tab. For a mobile app with a 600 px design (page.fit(600, 800)): on a normal page its sizes are too big.",
        tr: "Uygulamanın ana eylemi için büyük yuvarlak + düğmeli alt sekme çubuğu; seçili sekmenin altında bir çizgi kayar. 600 px tasarımlı mobil uygulama içindir (page.fit(600, 800)): normal bir sayfada boyutları fazla büyük kalır.",
    },
    {
        key: "action-button", name: "ActionButton", cat: "actions",
        source: "comp/action-button.js", samples: ["02-comp-examples/action-button.htm"],
        en: "Round floating action button in the corner of the screen; it opens a menu of actions. The new version of UIActionButton.",
        tr: "Ekranın köşesinde duran yuvarlak eylem düğmesi; eylem menüsünü açar. UIActionButton'ın yeni sürümü.",
    },
    {
        key: "context-menu", name: "ContextMenu", cat: "actions",
        source: "comp/context-menu.js", samples: ["02-comp-examples/context-menu.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A simple menu that opens at the mouse point, with text or icon items (SVG icons take the text color) and submenus.",
        tr: "Farenin olduğu yerde açılan sade menü; yazılı veya ikonlu öğeler (SVG ikonlar yazının rengini alır) ve alt menüler.",
    },
    {
        key: "menu-bar", name: "MenuBar", cat: "actions",
        source: "comp/menu-bar.js", deps: ["comp/context-menu.js"], samples: [
            { file: "02-comp-examples/menu-bar.htm", title: "Basic" },
            { file: "02-comp-examples/menu-bar-2.htm", title: "A small program: MenuBar, ImageView, LogView and StatusBar" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "The row of menus at the top of a window: File, Edit, View. Shortcuts, check marks, submenus and the arrow keys. Light and dark themes.",
        tr: "Pencerenin üstündeki menü çubuğu: Dosya, Düzenle, Görünüm. Kısayollar, onay işaretleri, alt menüler ve ok tuşları. Aydınlık ve karanlık tema.",
    },
    {
        key: "tool-bar", name: "ToolBar", cat: "actions",
        source: "comp/tool-bar.js", deps: ["comp/tooltip.js", "comp/context-menu.js", "comp/menu-bar.js"], samples: ["02-comp-examples/tool-bar.htm", "02-comp-examples/minimal-theme.htm"],
        en: "The row of small buttons of a window, under its menus: icons with a hint, lines between the groups, buttons that stay pressed, a button that opens a menu. What does not fit goes into a \"...\" menu. Shortcuts and the arrow keys. Light and dark themes.",
        tr: "Pencerenin menülerinin altındaki küçük düğme satırı: ipuçlu ikonlar, gruplar arasında çizgiler, basılı kalan düğmeler, menü açan düğme. Sığmayanlar \"...\" menüsüne girer. Kısayollar ve ok tuşları. Aydınlık ve karanlık tema.",
    },
    {
        key: "filters", name: "Filters", cat: "selection",
        source: "comp/filters.js", samples: ["02-comp-examples/filters.htm"],
        en: "A filter menu: a button and a panel with a search field, groups of check boxes, the number of the selected options and Clear all. In the page or as a popup.",
        tr: "Filtre menüsü: bir düğme ve arama alanı, onay kutusu grupları, seçili sayısı ve Temizle içeren panel. Sayfanın içinde ya da açılır pencere olarak.",
    },
    {
        key: "item-list", name: "ItemList", cat: "selection",
        source: "comp/item-list.js", samples: ["02-comp-examples/item-list.htm", "02-comp-examples/item-list-2.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A list of items with an icon, a title and a description (or your own rows): vertical, horizontal or grid, single or multiple selection, section titles, search and keyboard; a picture gallery; a pressed flash and animated add / remove.",
        tr: "İkon, başlık ve açıklamalı öğe listesi (ya da kendi satırlarınız): dikey, yatay veya ızgara; tekli veya çoklu seçim, bölüm başlıkları, arama ve klavye; resim galerisi; tıklanınca bir an koyulaşan satır ve hareketli ekleme / çıkarma.",
    },
    {
        key: "select-box", name: "SelectBox", cat: "selection",
        source: "comp/select-box.js", deps: ["comp/search-input.js"], samples: ["02-comp-examples/select-box.htm", "02-comp-examples/select-box-ozden-item.htm", "02-comp-examples/select-box-ozden-text.htm", "02-comp-examples/select-box-ozden-dark-text.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Dropdown select for single or multiple selection, with select all and clear.",
        tr: "Tekli veya çoklu seçim için açılır liste; tümünü seç ve temizle düğmeleri.",
    },
    {
        key: "numeric-keyboard", name: "NumericKeyboard", cat: "inputs",
        source: "comp/numeric-keyboard.js", samples: ["02-comp-examples/numeric-keyboard.htm"],
        en: "Number keys on the screen for a PIN, an amount or a kiosk: two layouts, a hidden PIN, the keyboard of the computer too. The new version of UINumericKeyboard.",
        tr: "PIN, tutar ya da kiosk için ekrandaki rakam tuşları: iki düzen, gizli PIN, bilgisayar klavyesi de çalışır. UINumericKeyboard'un yeni sürümü.",
    },
    {
        key: "full-screen-select", name: "FullScreenSelect", cat: "selection",
        source: "comp/full-screen-select.js", deps: ["comp/search-input.js"], samples: ["02-comp-examples/full-screen-select.htm"],
        en: "A select field whose list opens on the whole screen, with a search box: for phones and long lists. The new version of UISelectText.",
        tr: "Listesi tüm ekranda açılan, arama kutulu seçim alanı: telefonlar ve uzun listeler için. UISelectText'in yeni sürümü.",
    },
    {
        key: "select-date", name: "SelectDate", cat: "selection",
        source: "comp/select-date.js", samples: ["02-comp-examples/select-date.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Date picker as a popup or an always visible calendar, with a month and year view.",
        tr: "Açılır veya sayfada sabit takvim olarak tarih seçici; ay ve yıl görünümü.",
    },
    {
        key: "select-time", name: "SelectTime", cat: "selection",
        source: "comp/select-time.js", samples: ["02-comp-examples/select-time.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Time picker with scrollable hour and minute columns, as a popup or inline.",
        tr: "Kaydırılabilir saat ve dakika sütunlarıyla saat seçici; açılır veya sayfada sabit.",
    },
    {
        key: "select-color", name: "SelectColor", cat: "selection",
        source: "comp/select-color.js", samples: ["02-comp-examples/select-color.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Color picker: a field that opens a palette, or an always visible palette.",
        tr: "Renk seçici: palet açan bir alan veya sayfada sabit bir palet.",
    },
    {
        key: "period-bar", name: "PeriodBar", cat: "selection",
        source: "comp/period-bar.js", samples: ["02-comp-examples/period-bar.htm"],
        en: "A month switcher: this month and the months before it in a white capsule, with round buttons and sliding months. For a mobile app with a 600 px design (page.fit(600, 800)): on a normal page its sizes are too big.",
        tr: "Ay seçici: bu ay ve önceki aylar beyaz bir kapsülde, yuvarlak düğmeler ve kayan aylarla. 600 px tasarımlı mobil uygulama içindir (page.fit(600, 800)): normal bir sayfada boyutları fazla büyük kalır.",
    },
    {
        key: "select-file", name: "SelectFile", cat: "inputs",
        source: "comp/select-file.js", samples: ["02-comp-examples/select-file.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Drop zone and file dialog that lists the chosen files with image previews and sizes.",
        tr: "Dosya bırakma alanı ve dosya penceresi; seçilen dosyaları önizleme ve boyutlarıyla listeler.",
    },
    {
        key: "tag-input", name: "TagInput", cat: "inputs",
        source: "comp/tag-input.js", samples: ["02-comp-examples/tag-input.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A field of chips for tags, keywords or e-mails, with suggestions, validation and paste splitting.",
        tr: "Etiket, anahtar kelime veya e-posta için çipli alan: öneriler, doğrulama ve yapıştırınca bölme.",
    },
    {
        key: "stepper", name: "Stepper", cat: "inputs",
        source: "comp/stepper.js",
        samples: [
            { file: "02-comp-examples/stepper.htm", title: "Basic" },
            { file: "02-comp-examples/stepper-2.htm", title: "ozden, a line around the buttons" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Number stepper with decimals, a unit, typed editing and hold-to-repeat buttons. A line around the buttons and a round look (ozden).",
        tr: "Ondalık, birim, elle yazma ve basılı tutunca tekrarlayan düğmeleriyle sayı seçici. Düğmelerin çevresinde çizgi ve yuvarlak görünüm (ozden).",
    },
    {
        key: "slider-field", name: "SliderField", cat: "inputs",
        source: "comp/slider-field.js",
        samples: [
            { file: "02-comp-examples/slider-field.htm", title: "Basic" },
            { file: "02-comp-examples/slider-field-ozden.htm", title: "ozden, a knob, the tones of SmartButton" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "A slider in the shape of a field: the label at the left, the value at the right, step dots, drag, click to jump and typed editing. The ozden look: a cyan fill with a white knob that never cuts a text.",
        tr: "Alan şeklinde kaydırıcı: solda etiket, sağda değer, adım noktaları; sürükleme, tıklayıp atlama ve elle yazma. ozden görünüşü: hiçbir yazıyı kesmeyen, beyaz topuzlu camgöbeği dolgu.",
    },
    {
        key: "property-panel", name: "PropertyPanel", cat: "inputs",
        source: "comp/property-panel.js", samples: ["02-comp-examples/property-panel.htm"],
        en: "A design tool style property inspector at the right side, built from a JSON: numbers, selects, segmented buttons, toggles and constraints, with change events.",
        tr: "Sağda açılan, tasarım aracı tarzı özellik paneli; JSON ile kurulur: sayılar, seçim kutuları, bölmeli düğmeler, açma/kapama ve kısıtlar, değişiklik olaylarıyla.",
    },
    {
        key: "label-editor", name: "LabelEditor", cat: "inputs",
        source: "comp/label-editor.js", deps: ["comp/side-panel.js", "comp/stepper.js", "comp/select-color.js", "comp/tabs.js", "comp/check-box.js"], samples: ["02-comp-examples/label-editor.htm"],
        en: "An object based editor: add labels, change their properties in a side panel, save the styles with a name and apply them to other labels.",
        tr: "Nesne tabanlı editör: label ekleyin, özelliklerini yan panelden değiştirin, stilleri bir adla kaydedip başka label'lara uygulayın.",
    },
    {
        key: "rich-text-editor", name: "RichTextEditor", cat: "inputs",
        source: "comp/rich-text-editor.js", samples: ["02-comp-examples/rich-text-editor.htm"],
        en: "A simple rich text editor with a toolbar (bold, headings, lists, quote, link, undo), cleaned HTML output and a character limit.",
        tr: "Araç çubuklu basit zengin metin editörü (kalın, başlık, liste, alıntı, link, geri al); temizlenmiş HTML çıktısı ve karakter sınırı.",
    },
    {
        key: "sortable-list", name: "SortableList", cat: "inputs",
        source: "comp/sortable-list.js", samples: ["02-comp-examples/sortable-list.htm"],
        en: "A list whose order is changed by drag and drop, the keyboard or up / down buttons, with locked rows.",
        tr: "Sırası sürükle-bırak, klavye veya yukarı / aşağı düğmeleriyle değiştirilen liste; kilitli satırlar da olur.",
    },
    {
        key: "progress-bar", name: "ProgressBar", cat: "feedback",
        source: "comp/progress-bar.js",
        samples: [
            { file: "02-comp-examples/progress-bar.htm", title: "Basic" },
            { file: "02-comp-examples/progress-bar-ozden.htm", title: "ozden, two parts, stripes, limits, a dark track" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Horizontal progress bar with a title and a value text; determinate or indeterminate. Two parts (70 + 5) in their own colors, moving stripes, limit lines and a dark track.",
        tr: "Başlık ve değer yazılı yatay ilerleme çubuğu; belirli veya belirsiz ilerleme. Kendi renklerinde iki parça (70 + 5), kayan çizgiler, limit çizgileri ve koyu bir arka plan.",
    },
    {
        key: "dialog", name: "Dialog", cat: "feedback",
        source: "comp/dialog.js", deps: ["comp/tooltip.js", "comp/input-b.js", "comp/smart-button.js"], samples: ["02-comp-examples/dialog.htm", "02-comp-examples/dialog-centered.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A dialog over the page with fields and buttons: a button that asks again, a waiting button, keyboard; Dialog.confirm, alert and prompt. In development.",
        tr: "Sayfanın üstünde alanlı ve düğmeli diyalog: tekrar soran düğme, bekleyen düğme, klavye; Dialog.confirm, alert ve prompt. Geliştiriliyor.",
    },
    {
        key: "notice", name: "Notice", cat: "feedback",
        source: "comp/notice.js", samples: ["02-comp-examples/notice.htm"],
        en: "A short message in the middle of the screen over a soft cover: five types, an icon, a second line; it goes by itself. The new version of notice (M1).",
        tr: "Ekranın ortasında, hafif bir örtünün üstünde kısa mesaj: beş tür, ikon, ikinci satır; kendiliğinden kaybolur. notice'in (M1) yeni sürümü.",
    },
    {
        key: "toast", name: "Toast", cat: "feedback",
        source: "comp/toast.js", samples: ["02-comp-examples/toast.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Short messages that come and go: success, error, loading, and actions like Undo.",
        tr: "Gelip giden kısa mesajlar: başarılı, hata, yükleniyor ve Geri Al gibi eylemler.",
    },
    {
        key: "status-bar", name: "StatusBar", cat: "feedback",
        source: "comp/status-bar.js", samples: ["02-comp-examples/status-bar.htm", "02-comp-examples/minimal-theme.htm"],
        en: "The thin bar at the bottom of a window: a short message that can go away by itself, a turning circle for a job, small parts that can be clicked. Light and dark themes.",
        tr: "Pencerenin altındaki ince çubuk: kendiliğinden kaybolabilen kısa mesaj, süren iş için dönen halka, tıklanabilen küçük parçalar. Aydınlık ve karanlık tema.",
    },
    {
        key: "side-panel", name: "SidePanel", cat: "feedback",
        source: "comp/side-panel.js", samples: ["02-comp-examples/side-panel.htm", "02-comp-examples/side-panel-2.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A drawer that slides in from a side of the screen, or of a box like an app column, over the page.",
        tr: "Ekranın ya da bir kutunun (Ör: uygulama sütunu) bir kenarından sayfanın üzerine kayarak açılan panel (çekmece).",
    },
    {
        key: "loading-screen", name: "LoadingScreen", cat: "feedback",
        source: "comp/loading-screen.js", deps: ["comp/smart-button.js"], samples: ["02-comp-examples/loading-screen.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Full cover splash and loading screen with an icon, a title, a spinner and progress.",
        tr: "İkon, başlık, dönen gösterge ve ilerleme içeren tam ekran açılış ve yükleme ekranı.",
    },
    {
        key: "graph-box", name: "GraphBox", cat: "data",
        source: "comp/graph-box.js", samples: ["02-comp-examples/graph-box.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Charts with no library: one file draws them as SVG. Line, area, bar, pie, doughnut, radar, scatter and bubble, with a tooltip, a legend, a table and its themes (light, dark, minimal).",
        tr: "Kütüphanesiz grafikler: tek dosya SVG olarak çizer. Çizgi, alan, çubuk, pasta, halka, radar, nokta ve kabarcık; ipucu, açıklama listesi, tablo ve temaları (aydınlık, karanlık, minimal).",
    },
    {
        key: "gauge", name: "Gauge", cat: "data",
        source: "comp/gauge.js", samples: ["02-comp-examples/gauge.htm"],
        en: "A value drawn on an arc: a full ring or a half arc.",
        tr: "Bir yay üzerinde gösterilen değer: tam halka veya yarım yay.",
    },
    {
        key: "mini-graph-box", name: "MiniGraphBox", cat: "data",
        source: "comp/mini-graph-box.js", samples: ["02-comp-examples/mini-graph-box.htm"],
        en: "Small KPI box with a title, a value, an icon and a live bar graph.",
        tr: "Başlık, değer, ikon ve canlı çubuk grafik içeren küçük gösterge kutusu.",
    },
    {
        key: "spark-line-box", name: "SparkLineBox", cat: "data",
        source: "comp/spark-line-box.js", samples: ["02-comp-examples/spark-line-box.htm"],
        en: "KPI box with a line graph, a trend badge, min/max dots and a hover tooltip.",
        tr: "Çizgi grafikli gösterge kutusu: eğilim rozeti, en düşük ve en yüksek noktaları, ipucu.",
    },
    {
        key: "time-line", name: "TimeLine", cat: "data",
        source: "comp/time-line.js", samples: ["02-comp-examples/time-line.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A vertical time line of what happened, and when: a dot for every item and a line between the dots; it grows with new items. For the steps of a job and the step of now: StepBar. Light, dark and minimal looks.",
        tr: "Ne olduğunu ve ne zaman olduğunu gösteren dikey zaman çizelgesi: her öğe için bir nokta ve noktaların arasında bir çizgi; yeni öğelerle uzar. Bir işin adımları ve şu anki adım için: StepBar. Aydınlık, karanlık ve minimal görünüş.",
    },
    {
        key: "json-view", name: "JsonView", cat: "data",
        source: "comp/json-view.js", deps: ["comp/tree-view.js", "comp/context-menu.js"], samples: ["02-comp-examples/json-view.htm"],
        en: "A value of JSON as a tree: the answer of a server, a settings file. Keys and values in colors, the path of a row, right click to copy. A list of a million items opens at once. A text that is not JSON shows its error. Light and dark themes.",
        tr: "JSON değerini ağaç olarak gösterir: sunucu cevabı, ayar dosyası. Renkli anahtar ve değerler, satırın yolu, sağ tıkla kopyalama. Bir milyon öğelik liste hemen açılır. JSON olmayan metin hatasını gösterir. Aydınlık ve karanlık tema.",
    },
    {
        key: "json-editor", name: "JsonEditor", cat: "data",
        source: "comp/json-editor.js", deps: ["comp/context-menu.js", "comp/search-input.js"], samples: ["02-comp-examples/json-editor.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A list or an object of JSON written in a table: add, sort and drag rows; a switch, a color, a picture or a choice in a cell; a list in a cell opens as a table of its own. Paste from a spreadsheet, a JSON view, its own undo. In the page, or in a window with Apply. Light, dark and minimal themes.",
        tr: "JSON bir listeyi ya da nesneyi tabloda düzenler: satır ekleme, sıralama ve sürükleme; hücrede anahtar, renk, resim ya da seçim; hücredeki liste kendi tablosu olarak açılır. Tablodan yapıştırma, JSON görünümü, kendi geri alması. Sayfanın içinde ya da Uygula düğmeli bir pencerede. Aydınlık, karanlık ve minimal tema.",
    },
    {
        key: "markdown-view", name: "MarkdownView", cat: "data",
        source: "comp/markdown-view.js", deps: ["comp/code-editor.js"], samples: ["02-comp-examples/markdown-view.htm"],
        en: "A text written in Markdown, drawn on the page: a report, the answer of an AI. Headings, lists, tables, pictures, code with colors and a button that copies it. A text is never read as HTML. A text that comes piece by piece. Light and dark themes.",
        tr: "Markdown ile yazılmış bir metni sayfada çizer: rapor, yapay zekâ cevabı. Başlıklar, listeler, tablolar, resimler, renkli ve kopyalanan kod. Metin hiçbir zaman HTML olarak okunmaz. Parça parça gelen metin. Aydınlık ve karanlık tema.",
    },
    {
        key: "log-view", name: "LogView", cat: "data",
        source: "comp/log-view.js", samples: ["02-comp-examples/log-view.htm"],
        en: "The output of a program: colored lines with their time and level, following the last line. Fast output is drawn in batches. Light and dark themes.",
        tr: "Bir programın çıktısı: saati ve düzeyiyle renkli satırlar, son satırı kendiliğinden izler. Hızlı çıktı topluca çizilir. Aydınlık ve karanlık tema.",
    },
    {
        key: "scrolling-text", name: "ScrollingText", cat: "data",
        source: "comp/scrolling-text.js", samples: ["02-comp-examples/scrolling-text.htm"],
        en: "A one line text that slides to show its end when it does not fit: always, or only under the mouse.",
        tr: "Kutusuna sığmayınca sonunu göstermek için kayan tek satırlık yazı: sürekli ya da yalnızca fare üzerindeyken.",
    },
    {
        key: "tiny-table-m4", name: "TinyTable", cat: "data",
        source: "comp/tiny-table.js", deps: ["comp/scrolling-text.js"], samples: ["02-comp-examples/tiny-table.htm"],
        en: "A light table for short lists: a colored title row, one line rows (a long text slides under the mouse), a soft color under the mouse; scrolling rows. The new version of TinyTable (M1).",
        tr: "Kısa listeler için hafif tablo: renkli başlık satırı, tek satırlık hücreler, fareyle gelinen satırda yumuşak renk; kayan satırlar. TinyTable'ın (M1) yeni sürümü.",
    },
    {
        key: "data-table", name: "DataTable", cat: "data",
        source: "comp/data-table.js", deps: ["comp/search-input.js"],
        samples: [
            { file: "02-comp-examples/data-table.htm", title: "Styles" },
            { file: "02-comp-examples/data-table-2.htm", title: "Basic" },
            { file: "02-comp-examples/data-table-3.htm", title: "Search & sort" },
            { file: "02-comp-examples/data-table-4.htm", title: "Add & delete" },
            { file: "02-comp-examples/data-table-5.htm", title: "Custom cells" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "A table for lists up to about 2,000 rows: sorting, search, keyboard selection, your own cells and row updates by id. For more rows: SmartTable.",
        tr: "Yaklaşık 2.000 satıra kadar listeler için tablo: sıralama, arama, klavyeyle seçim, kendi hücreleriniz ve id ile satır güncelleme. Daha fazla satır için: SmartTable.",
    },
    {
        key: "accordion", name: "Accordion", cat: "pages",
        source: "comp/accordion.js", samples: ["02-comp-examples/accordion.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Sections that fold: a title row and the objects under it, one or more open, with a note, an icon and the keyboard. A closed section keeps its objects. Light and dark themes.",
        tr: "Katlanan bölümler: bir başlık satırı ve altında nesneleri, biri ya da birkaçı açık; not, ikon ve klavye. Kapalı bölüm nesnelerini korur. Aydınlık ve karanlık tema.",
    },
    {
        key: "grid-group", name: "GridGroup", cat: "pages",
        source: "comp/grid-group.js", samples: ["02-comp-examples/grid-group.htm"],
        en: "A group whose objects stand in columns and rows: a form of titles and fields, the keys of a calculator, tiles. Equal columns, px, parts of the room, an object over more than one cell.",
        tr: "Nesneleri sütun ve satırlara dizen grup: başlık ve alanlardan bir form, hesap makinesinin tuşları, kutucuklar. Eşit sütunlar, px, oranlar, birden çok hücreye yayılan nesne.",
    },
    {
        key: "splitter", name: "Splitter", cat: "pages",
        source: "comp/splitter.js", samples: ["02-comp-examples/splitter.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Two areas with a line between them: a drag changes their sizes, side by side or one under the other. Keyboard, limits, sizes that follow the window. Light and dark themes.",
        tr: "Aralarında çizgi olan iki alan: sürükleyince boyutları değişir, yan yana ya da alt alta. Klavye, sınırlar, pencereyi izleyen boyutlar. Aydınlık ve karanlık tema.",
    },
    {
        key: "code-editor", name: "CodeEditor", cat: "inputs",
        source: "comp/code-editor.js", samples: [
            { file: "02-comp-examples/code-editor.htm", title: "Basic" },
            { file: "02-comp-examples/code-editor-2.htm", title: "A small code editor: MenuBar, Splitter, TreeView, CodeEditor, LogView and StatusBar" },
        ],
        en: "A text editor for code: line numbers, colors for Python, JavaScript, JSON, HTML, CSS, SQL and Bash, indent keys, and a file of 100000 lines stays fast. Light and dark themes.",
        tr: "Kod için metin düzenleyici: satır numaraları; Python, JavaScript, JSON, HTML, CSS, SQL ve Bash için renkler; girinti tuşları; 100000 satırlık dosyada bile hızlı. Aydınlık ve karanlık tema.",
    },
    {
        key: "image-view", name: "ImageView", cat: "pages",
        source: "comp/image-view.js", samples: ["02-comp-examples/image-view.htm"],
        en: "A place to look at a picture or a plot: zoom with the wheel or two fingers, move with a drag, a small toolbar. A plot that is drawn again does not blink. Light and dark themes.",
        tr: "Resim ya da grafiğe bakma alanı: tekerlek ya da iki parmakla yakınlaştırma, sürükleyerek kaydırma, küçük araç çubuğu. Yeniden çizilen grafik yanıp sönmez. Aydınlık ve karanlık tema.",
    },
    {
        key: "web-view", name: "WebView", cat: "pages",
        source: "comp/web-view.js", samples: ["02-comp-examples/web-view.htm"],
        en: "An iframe box with a loading spinner, errors, messages, scaled previews and a toolbar. The previews on this site use it.",
        tr: "Yükleniyor göstergesi, hata, mesajlaşma, ölçekli önizleme ve araç çubuğu olan iframe kutusu. Bu sitedeki önizlemeler de onu kullanır.",
    },
    {
        key: "ui-effects", name: "UIEffects", cat: "styles",
        source: "comp/ui-effects.js", samples: ["02-comp-examples/ui-effects.htm"],
        en: "Press, hover and attention effects for any basic.js object: ripple, lift, tilt, spotlight and more.",
        tr: "Her basic.js nesnesi için basma, üzerine gelme ve dikkat efektleri: ripple, lift, tilt, spotlight ve dahası.",
    },
    {
        key: "ui-standards", name: "UI Standards", cat: "styles",
        source: "comp/ui-standards.js", samples: ["02-comp-examples/ui-standards.htm"],
        en: "Design tokens and themes: colors, font sizes, corner radius and a light, dark or automatic theme.",
        tr: "Tasarım değerleri ve temalar: renkler, yazı boyları, köşe yuvarlaklığı ve açık, koyu veya otomatik tema.",
    },
    {
        key: "tap-effect", name: "TapEffect", cat: "styles",
        source: "comp/tap-effect.js", samples: ["02-comp-examples/tap-effect.htm"],
        en: "A soft circle where the screen is tapped, over everything; it never catches the tap. TapEffect.start() / stop(), also on a page fitted with page.fit().",
        tr: "Ekrana dokunulan yerde beliren yumuşak bir daire; her şeyin üstünde, dokunuşu engellemez. TapEffect.start() / stop(), page.fit() ile sığdırılmış sayfada da çalışır.",
    },
    {
        key: "minimal-accent", name: "MinimalAccent", cat: "styles",
        source: "comp/minimal-accent.js", samples: ["02-comp-examples/minimal-accent.htm"],
        en: "The minimal theme in a color of the page: MinimalAccent.addPackages(\"minimalBlue\", \"#2A78D6\") gives every minimal component a light and a dark package in that color (an on toggle, a checked box, the selected tab, the main button). The lines and the texts stay as they are.",
        tr: "Minimal tema sayfanın bir rengiyle: MinimalAccent.addPackages(\"minimalBlue\", \"#2A78D6\") her minimal bileşene o renkte açık ve koyu bir paket verir (açık anahtar, işaretli kutu, seçili sekme, ana düğme). Çizgiler ve yazılar olduğu gibi kalır.",
    },
    {
        key: "app-bar", name: "AppBar", cat: "navigation",
        source: "comp/app-bar.js", deps: ["comp/smart-button.js"], samples: ["02-comp-examples/app-bar.htm"],
        en: "The top bar of a tab page of a mobile app: a title in the middle or at the left, a back and a menu button. For a mobile app with a 600 px design (page.fit(600, 800)): on a normal page its sizes are too big.",
        tr: "Mobil uygulamada bir sekme sayfasının üst çubuğu: ortada ya da solda başlık, geri ve menü düğmesi. 600 px tasarımlı mobil uygulama içindir (page.fit(600, 800)): normal bir sayfada boyutları fazla büyük kalır.",
    },
    {
        key: "page-header", name: "PageHeader", cat: "navigation",
        source: "comp/page-header.js", samples: ["02-comp-examples/page-header.htm"],
        en: "The header of a page that slides in over the tabs of a mobile app: a small back link over a big title. For a mobile app with a 600 px design (page.fit(600, 800)): on a normal page its sizes are too big.",
        tr: "Mobil uygulamada sekmelerin üzerine kayarak gelen bir sayfanın başlığı: büyük başlığın üstünde küçük bir geri bağlantısı. 600 px tasarımlı mobil uygulama içindir (page.fit(600, 800)): normal bir sayfada boyutları fazla büyük kalır.",
    },
    {
        key: "settings-row", name: "SettingsRow", cat: "pages",
        source: "comp/settings-row.js", samples: ["02-comp-examples/settings-row.htm"],
        en: "A row of a settings page: a title, a small text that fades in and out, and a control (a switch, a stepper) or an arrow at the right; bands between the groups. For a mobile app with a 600 px design (page.fit(600, 800)): on a normal page its sizes are too big.",
        tr: "Ayarlar sayfasının bir satırı: başlık, yumuşakça görünüp kaybolan küçük bir metin ve sağda bir kontrol (anahtar, sayaç) ya da ok; gruplar arasında bantlar. 600 px tasarımlı mobil uygulama içindir (page.fit(600, 800)): normal bir sayfada boyutları fazla büyük kalır.",
    },
    {
        key: "smart-button", name: "SmartButton", cat: "actions",
        source: "comp/smart-button.js",
        samples: [
            { file: "02-comp-examples/smart-button.htm", title: "The default (the model page)" },
            { file: "02-comp-examples/smart-button-3-ozden.htm", title: "Dialogs (ozden)" },
            { file: "02-comp-examples/smart-button-alternatif.htm", title: "Pill and outlined (an alternative)" },
            { file: "02-comp-examples/smart-button-4-dark.htm", title: "Dark templates and tones" },
            { file: "02-comp-examples/smart-button-5-features.htm", title: "All features" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "The default button: an icon and a text (or one of them; an empty text makes an icon button). The look in three steps: styleName (the template: ozdenType1-4, pill, outlined, ozdenType1Dark-4Dark, minimal, minimalDark), tone (white, cyan, orange, yellow, green, blue, and blueDark... for a dark page) and style (your own colors: the color and the color under the mouse; pressed, it gets darker by itself). A waiting clock or dots while a job runs, and a two-click ask with a bubble.",
        tr: "Varsayılan düğme: ikon ve yazı (ya da biri; boş bir metin ikon düğmesi yapar). Görünüş üç adımda: styleName (kalıp: ozdenType1-4, pill, outlined, ozdenType1Dark-4Dark, minimal, minimalDark), tone (white, cyan, orange, yellow, green, blue ve koyu sayfa için blueDark...) ve style (kendi renklerin: renk ve fare üzerindeyken renk; basınca kendiliğinden koyulaşır). Bir iş sürerken bekleme saati ya da noktaları ve balonlu iki tıklamalı onay.",
    },
    {
        key: "smart-table", name: "SmartTable", cat: "data",
        source: "comp/smart-table.js", deps: ["comp/search-input.js", "comp/context-menu.js", "comp/tooltip.js"],
        samples: [
            { file: "02-comp-examples/smart-table.htm", title: "Styles" },
            { file: "02-comp-examples/smart-table-1.htm", title: "2M rows" },
            { file: "02-comp-examples/smart-table-2.htm", title: "Actions" },
            { file: "02-comp-examples/smart-table-3.htm", title: "Edit & delete" },
            { file: "02-comp-examples/smart-table-4.htm", title: "Style" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Virtual-scroll table for millions of rows, with filtering, sorting, custom cells and editing. Style packages: light (default; its old name classic) and dark, the looks of DataTable, and green (the old look). A cut text shows all of it in a bubble.",
        tr: "Milyonlarca satır için sanal kaydırmalı tablo: filtreleme, sıralama, özel hücreler ve düzenleme. Stil paketleri: DataTable'ın görünüşleri light (varsayılan; eski adı classic) ve dark, bir de green (eski görünüş). Sığmayan bir yazı, balonda bütünüyle görünür.",
    },
    {
        key: "check-box", name: "CheckBox", cat: "selection",
        source: "comp/check-box.js",
        samples: [
            { file: "02-comp-examples/check-box-1.htm", title: "Example 1" },
            { file: "02-comp-examples/check-box-2.htm", title: "Example 2" },
            { file: "02-comp-examples/check-box-3.htm", title: "Example 3 (dark)" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Check box with a label, drawn with code; classic, modern, dark, minimal and minimalDark style packages.",
        tr: "Kodla çizilen etiketli onay kutusu; classic, modern, dark, minimal ve minimalDark stil paketleri.",
    },
    {
        key: "radio-button", name: "RadioButton", cat: "selection",
        source: "comp/radio-button.js",
        samples: [
            { file: "02-comp-examples/radio-button-1.htm", title: "Example 1" },
            { file: "02-comp-examples/radio-button-2.htm", title: "Example 2" },
            { file: "02-comp-examples/radio-button-3.htm", title: "Example 3 (dark)" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Radio buttons that work in groups, with keyboard support and style packages.",
        tr: "Gruplar halinde çalışan, klavye destekli ve stil paketli seçenek düğmeleri.",
    },
    {
        key: "hold-to-confirm-button", name: "HoldToConfirmButton", cat: "actions",
        source: "comp/hold-to-confirm-button.js", samples: ["02-comp-examples/hold-to-confirm-button.htm"],
        en: "A button that runs only after it is pressed and held; for risky actions like delete.",
        tr: "Ancak basılı tutulunca çalışan düğme; silme gibi riskli işlemler için.",
    },
    {
        key: "bottom-bar", name: "BottomBar", cat: "navigation",
        source: "comp/bottom-bar.js", deps: ["comp/badge.js"],
        samples: ["02-comp-examples/bottom-bar.htm", { file: "02-comp-examples/bottom-bar-2.htm", title: "Old template look" }],
        en: "Mobile app bottom bar built from a JSON list of buttons, with badges; the name of the selected item next to it, over it for a moment or hidden, a color per item, keyboard ready.",
        tr: "JSON listesinden oluşturulan, rozetli mobil uygulama alt çubuğu; seçili öğenin adı yanında, bir an üstünde ya da gizli, öğe başına renk, klavyeyle kullanılabilir.",
    },
    {
        key: "line-progress-bar", name: "LineProgressBar", cat: "feedback",
        source: "comp/line-progress-bar.js", deps: ["comp/tooltip.js"], samples: ["02-comp-examples/line-progress-bar.htm"],
        en: "A progress bar drawn with vertical lines: thin, or thick with round ends; the value in a bubble with an arrow.",
        tr: "Dikey çizgilerle çizilen ilerleme çubuğu: ince ya da uçları yuvarlak kalın çizgiler; değer oklu bir balonda.",
    },
    {
        key: "input-b", name: "TextField", cat: "inputs",
        source: "comp/input-b.js", deps: ["comp/tooltip.js"],
        samples: [
            { file: "02-comp-examples/input-b-ex1.htm", title: "Basic" },
            { file: "02-comp-examples/input-b-ex2.htm", title: "Units & hints" },
            { file: "02-comp-examples/input-b-ex3-style.htm", title: "Style" },
            { file: "02-comp-examples/input-b-ex4-custom-unit.htm", title: "Custom unit" },
            { file: "02-comp-examples/input-b-ex5-warning-icon.htm", title: "Warning icon" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Labeled text field with an icon, a unit, hints and validation; the base of EmailField, PasswordField and the other fields.",
        tr: "İkon, birim, ipucu ve doğrulama içeren etiketli metin alanı; EmailField, PasswordField ve diğer alanların temeli.",
    },
    {
        key: "email-input-b", name: "EmailField", cat: "inputs",
        source: "comp/email-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/email-input-b.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A TextField that checks e-mail addresses.",
        tr: "E-posta adresini denetleyen TextField.",
    },
    {
        key: "password-input-b", name: "PasswordField", cat: "inputs",
        source: "comp/password-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/password-input-b.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Password field with a show and hide button.",
        tr: "Göster ve gizle düğmeli şifre alanı.",
    },
    {
        key: "number-input-b", name: "NumberField", cat: "inputs",
        source: "comp/number-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/number-input-b.htm"],
        en: "A TextField that accepts only numbers.",
        tr: "Yalnızca sayı kabul eden TextField.",
    },
    {
        key: "phone-input-b", name: "PhoneField", cat: "inputs",
        source: "comp/phone-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"],
        samples: [
            { file: "02-comp-examples/phone-input-b.htm", title: "Basic" },
            { file: "02-comp-examples/phone-input-b-select-country.htm", title: "Select country" },
        ],
        en: "Phone number field with a country code; one example opens a country list.",
        tr: "Ülke kodlu telefon alanı; bir örnek ülke listesi açar.",
    },
    {
        key: "currency-input-b", name: "CurrencyField", cat: "inputs",
        source: "comp/currency-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/currency-input-b.htm"],
        en: "Money field that formats the amount and shows its currency.",
        tr: "Tutarı biçimlendiren ve para birimini gösteren alan.",
    },
    {
        key: "url-input-b", name: "UrlField", cat: "inputs",
        source: "comp/url-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js", "comp/tiny-select.js"], samples: ["02-comp-examples/url-input-b.htm"],
        en: "Web address field with a protocol selector.",
        tr: "Protokol seçicili web adresi alanı.",
    },
    {
        key: "textarea-b", name: "TextAreaField", cat: "inputs",
        source: "comp/textarea-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/textarea-b.htm", "02-comp-examples/minimal-theme.htm"],
        en: "Multi-line text field in the TextField style, with a character counter.",
        tr: "TextField görünümünde, karakter sayaçlı çok satırlı metin alanı.",
    },
    {
        key: "search-input", name: "SearchInput", cat: "inputs",
        source: "comp/search-input.js", samples: [{ file: "02-comp-examples/search-input.htm", title: "light: a standard search box" }, { file: "02-comp-examples/search-input-place.htm", title: "Place: right / bottom" }, "02-comp-examples/minimal-theme.htm"],
        en: "Search field with a search icon and a clear button.",
        tr: "Arama ikonu ve temizleme düğmeli arama kutusu.",
    },
    {
        key: "slider", name: "Slider", cat: "inputs",
        source: "comp/slider.js",
        samples: [
            { file: "02-comp-examples/slider-round.htm", title: "round (the model page)" },
            { file: "02-comp-examples/slider.htm", title: "classic (Material 3)" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "Slider for choosing a value in a range, on a step. Looks: round (a thin track and a round white knob: the look of new pages), roundDark for a dark page, and classic (inspired by Material 3).",
        tr: "Bir aralıktan, adım adım değer seçmek için kaydırıcı. Görünümler: round (ince bir ray ve yuvarlak beyaz bir tutamaç: yeni sayfaların görünümü), koyu sayfa için roundDark ve classic (Material 3'ten esinlenildi).",
    },
    {
        key: "step-bar", name: "StepBar", cat: "navigation",
        source: "comp/step-bar.js", samples: ["02-comp-examples/step-bar.htm", "02-comp-examples/minimal-theme.htm"],
        en: "The steps of a job in a row: a cart, an address, a payment. A step that is behind has a check mark and can be clicked to go back, the step of now is filled. For a history of what happened: TimeLine. Light, dark and minimal looks.",
        tr: "Bir işin adımları bir satırda: sepet, adres, ödeme. Geçilen adım işaretlidir ve tıklanınca geri dönülür, şu anki adım doludur. Olanların geçmişi için: TimeLine. Aydınlık, karanlık ve minimal görünüş.",
    },
    {
        key: "range-slider", name: "RangeSlider", cat: "inputs",
        source: "comp/range-slider.js", samples: ["02-comp-examples/range-slider.htm", "02-comp-examples/minimal-theme.htm"],
        en: "A range of values on a thin bar: two knobs and the part between them: a price, the hours of a day. A step, the smallest distance, its own text in the bubble, the keyboard. Light and dark looks.",
        tr: "İnce bir bar üzerinde değer aralığı: iki düğme ve aralarındaki parça: fiyat, günün saatleri. Adım, en küçük aralık, baloncukta kendi metni, klavye. Aydınlık ve karanlık görünüş.",
    },
    {
        key: "canvas", name: "Canvas", cat: "data",
        source: "comp/canvas.js", samples: ["02-comp-examples/canvas.htm"],
        en: "A place to draw on: lines, rectangles, circles, polygons, texts and pictures, each with a key; a click finds the shape, a shape can be dragged, free drawing with a pen, the drawing as a picture. Light and dark looks.",
        tr: "Çizim alanı: çizgi, dikdörtgen, daire, çokgen, yazı ve resim, her biri bir anahtarla; tıklama şekli bulur, şekil sürüklenebilir, kalemle serbest çizim, çizim resim olarak alınır. Aydınlık ve karanlık görünüş.",
    },
    {
        key: "toggle", name: "Toggle", cat: "selection",
        source: "comp/toggle.js",
        samples: [
            { file: "02-comp-examples/toggle.htm", title: "A settings list" },
            { file: "02-comp-examples/toggle-2.htm", title: "modern and classic" },
            { file: "02-comp-examples/toggle-3.htm", title: "Shapes and marks" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "On and off switch for light and dark pages. Many looks: modern, classic, the shapes float, round, slim, outline and square, and tick, badge and label with a check, a cross or a text.",
        tr: "Açık ve koyu sayfalar için aç/kapat anahtarı. Birçok görünüm: modern, classic, float, round, slim, outline, square şekilleri ve onay, çarpı ya da yazılı tick, badge, label.",
    },
    {
        key: "tiny-select", name: "TinySelect", cat: "selection",
        source: "comp/tiny-select.js", samples: ["02-comp-examples/tiny-select.htm"],
        en: "Small inline select that fits into a sentence: Theme: Supernova.",
        tr: "Bir cümlenin içine sığan küçük seçim kutusu: Tema: Supernova.",
    },
    {
        key: "left-menu", name: "LeftMenu", cat: "navigation",
        source: "comp/left-menu.js",
        samples: [
            { file: "02-comp-examples/left-menu.htm", title: "Dark" },
            { file: "02-comp-examples/left-menu-2.htm", title: "Light" },
        ],
        en: "Icon side menu that opens on hover, or with a tap on touch screens. Style packages: dark (default) and light (for a light page).",
        tr: "Fareyle üzerine gelince, dokunmatik ekranda dokununca açılan ikonlu yan menü. Stil paketleri: dark (varsayılan) ve light (açık renkli sayfa için).",
    },
    {
        key: "tooltip", name: "Tooltip", cat: "feedback",
        source: "comp/tooltip.js",
        samples: [
            { file: "02-comp-examples/tooltip.htm", title: "A toolbar" },
            { file: "02-comp-examples/tooltip-2.htm", title: "The bubble: arrow, show(), screen edges" },
            { file: "02-comp-examples/tooltip-3.htm", title: "Content and popover" },
            { file: "02-comp-examples/tooltip-4.htm", title: "Pill bubbles with tags" },
            { file: "02-comp-examples/minimal-theme.htm", title: "Minimal theme (minimal, minimalDark)" },
        ],
        en: "A hint bubble over an object: it follows the mouse or stays at the object, with an optional bordered arrow, always inside the screen; your own content in it, or a popover that stays and can be clicked.",
        tr: "Bir nesnenin üzerinde ipucu balonu: fareyi izler ya da nesnenin yanında durur; isteğe bağlı kenarlıklı ok, hep ekranın içinde; içinde kendi içeriğin ya da açık kalan, tıklanabilen bir popover.",
    },
    {
        key: "badge", name: "BadgeV2", cat: "feedback",
        source: "comp/badge.js", samples: ["02-comp-examples/badge.htm"],
        en: "Notification badge on an object: a dot or a number; 0 and 1 can be shown as numbers, and the number can have its own look (a white ring).",
        tr: "Bir nesnenin üzerinde bildirim rozeti: nokta ya da sayı; 0 ve 1 de sayı olarak gösterilebilir, sayının kendi görünüşü olabilir (beyaz halka).",
    },
    {
        key: "login-page", name: "LoginPage", cat: "pages",
        source: "comp/login-page.js", deps: ["comp/ui-effects.js", "comp/tooltip.js", "comp/input-b.js", "comp/email-input-b.js", "comp/password-input-b.js", "comp/tabs.js", "comp/smart-button.js", "comp/loading-screen.js"],
        samples: [
            { file: "02-comp-examples/login-page.htm", title: "Light" },
            { file: "02-comp-examples/login-page-dark.htm", title: "Dark" },
        ],
        en: "A ready login and sign up page with e-mail, password and social buttons.",
        tr: "E-posta, şifre ve sosyal giriş düğmeleriyle hazır giriş ve kayıt sayfası.",
    },
];

// *** HELPERS:

// Örnek listesini { file, title } biçimine getirir.
CATALOG.getSamples = function (comp) {
    return comp.samples.map(function (sample, index) {
        if (typeof sample == "string") return { file: sample, title: String(index + 1) };
        return { file: sample.file, title: sample.title || String(index + 1) };
    });
};

CATALOG.find = function (key) {
    return CATALOG.COMPONENTS.find(function (comp) { return comp.key === key; }) || null;
};

CATALOG.getCategory = function (key) {
    return CATALOG.CATEGORIES.find(function (cat) { return cat.key === key; }) || null;
};

// Bir kategorinin bileşenleri: listedeki sırayla. (Yeni bileşenler listenin başına.)
CATALOG.getByCategory = function (catKey) {
    return CATALOG.COMPONENTS.filter(function (comp) { return comp.cat === catKey; });
};

CATALOG.countSamples = function () {
    return CATALOG.COMPONENTS.reduce(function (total, comp) { return total + comp.samples.length; }, 0);
};
