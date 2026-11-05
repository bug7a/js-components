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
        source: "comp/tabs.js", samples: ["02-comp-examples/tabs.htm"],
        en: "Tab bar with underline and pill variants, counts, badges, closable tabs, a vertical mode and optional panels.",
        tr: "Alt çizgili ve hap görünümlü sekme çubuğu: sayı, rozet, kapatılabilir sekme, dikey düzen ve isteğe bağlı paneller.",
    },
    {
        key: "tree-view", name: "TreeView", cat: "navigation",
        source: "comp/tree-view.js", samples: ["02-comp-examples/tree-view.htm"],
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
        source: "comp/search-results.js", deps: ["comp/search-input-v2.js"], samples: ["02-comp-examples/search-results.htm"],
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
        source: "comp/context-menu.js", samples: ["02-comp-examples/context-menu.htm"],
        en: "A simple menu that opens at the mouse point, with text or icon items (SVG icons take the text color) and submenus.",
        tr: "Farenin olduğu yerde açılan sade menü; yazılı veya ikonlu öğeler (SVG ikonlar yazının rengini alır) ve alt menüler.",
    },
    {
        key: "filters", name: "Filters", cat: "selection",
        source: "comp/filters.js", samples: ["02-comp-examples/filters.htm"],
        en: "A filter menu: a button and a panel with a search field, groups of check boxes, the number of the selected options and Clear all. In the page or as a popup.",
        tr: "Filtre menüsü: bir düğme ve arama alanı, onay kutusu grupları, seçili sayısı ve Temizle içeren panel. Sayfanın içinde ya da açılır pencere olarak.",
    },
    {
        key: "item-list", name: "ItemList", cat: "selection",
        source: "comp/item-list.js", samples: ["02-comp-examples/item-list.htm", "02-comp-examples/item-list-2.htm"],
        en: "A list of items with an icon, a title and a description (or your own rows): vertical, horizontal or grid, single or multiple selection, section titles, search and keyboard; a pressed flash and animated add / remove.",
        tr: "İkon, başlık ve açıklamalı öğe listesi (ya da kendi satırlarınız): dikey, yatay veya ızgara; tekli veya çoklu seçim, bölüm başlıkları, arama ve klavye; tıklanınca bir an koyulaşan satır ve hareketli ekleme / çıkarma.",
    },
    {
        key: "select-box", name: "SelectBox", cat: "selection",
        source: "comp/select-box.js", deps: ["comp/search-input-v2.js"], samples: ["02-comp-examples/select-box.htm", "02-comp-examples/select-box-ozden-item.htm", "02-comp-examples/select-box-ozden-text.htm", "02-comp-examples/select-box-ozden-dark-text.htm"],
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
        source: "comp/full-screen-select.js", deps: ["comp/search-input-v2.js"], samples: ["02-comp-examples/full-screen-select.htm"],
        en: "A select field whose list opens on the whole screen, with a search box: for phones and long lists. The new version of UISelectText.",
        tr: "Listesi tüm ekranda açılan, arama kutulu seçim alanı: telefonlar ve uzun listeler için. UISelectText'in yeni sürümü.",
    },
    {
        key: "select-date", name: "SelectDate", cat: "selection",
        source: "comp/select-date.js", samples: ["02-comp-examples/select-date.htm"],
        en: "Date picker as a popup or an always visible calendar, with a month and year view.",
        tr: "Açılır veya sayfada sabit takvim olarak tarih seçici; ay ve yıl görünümü.",
    },
    {
        key: "select-time", name: "SelectTime", cat: "selection",
        source: "comp/select-time.js", samples: ["02-comp-examples/select-time.htm"],
        en: "Time picker with scrollable hour and minute columns, as a popup or inline.",
        tr: "Kaydırılabilir saat ve dakika sütunlarıyla saat seçici; açılır veya sayfada sabit.",
    },
    {
        key: "select-color", name: "SelectColor", cat: "selection",
        source: "comp/select-color.js", samples: ["02-comp-examples/select-color.htm"],
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
        source: "comp/select-file.js", samples: ["02-comp-examples/select-file.htm"],
        en: "Drop zone and file dialog that lists the chosen files with image previews and sizes.",
        tr: "Dosya bırakma alanı ve dosya penceresi; seçilen dosyaları önizleme ve boyutlarıyla listeler.",
    },
    {
        key: "tag-input", name: "TagInput", cat: "inputs",
        source: "comp/tag-input.js", samples: ["02-comp-examples/tag-input.htm"],
        en: "A field of chips for tags, keywords or e-mails, with suggestions, validation and paste splitting.",
        tr: "Etiket, anahtar kelime veya e-posta için çipli alan: öneriler, doğrulama ve yapıştırınca bölme.",
    },
    {
        key: "stepper", name: "Stepper", cat: "inputs",
        source: "comp/stepper.js",
        samples: [
            { file: "02-comp-examples/stepper.htm", title: "Basic" },
            { file: "02-comp-examples/stepper-2.htm", title: "ozden, a line around the buttons" },
        ],
        en: "Number stepper with decimals, a unit, typed editing and hold-to-repeat buttons. A line around the buttons and a round look (ozden).",
        tr: "Ondalık, birim, elle yazma ve basılı tutunca tekrarlayan düğmeleriyle sayı seçici. Düğmelerin çevresinde çizgi ve yuvarlak görünüm (ozden).",
    },
    {
        key: "slider-field", name: "SliderField", cat: "inputs",
        source: "comp/slider-field.js", samples: ["02-comp-examples/slider-field.htm"],
        en: "A slider in the shape of a field: the label at the left, the value at the right, step dots, drag, click to jump and typed editing.",
        tr: "Alan şeklinde kaydırıcı: solda etiket, sağda değer, adım noktaları; sürükleme, tıklayıp atlama ve elle yazma.",
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
            { file: "02-comp-examples/progress-bar-ozden.htm", title: "ozden, two parts, stripes, limits" },
        ],
        en: "Horizontal progress bar with a title and a value text; determinate or indeterminate. Two parts (70 + 5) in their own colors, moving stripes and limit lines.",
        tr: "Başlık ve değer yazılı yatay ilerleme çubuğu; belirli veya belirsiz ilerleme. Kendi renklerinde iki parça (70 + 5), kayan çizgiler ve limit çizgileri.",
    },
    {
        key: "dialog", name: "Dialog", cat: "feedback",
        source: "comp/dialog.js", deps: ["comp/tooltip.js", "comp/input-b.js", "comp/smart-button.js"], samples: ["02-comp-examples/dialog.htm", "02-comp-examples/dialog-centered.htm"],
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
        source: "comp/toast.js", samples: ["02-comp-examples/toast.htm"],
        en: "Short messages that come and go: success, error, loading, and actions like Undo.",
        tr: "Gelip giden kısa mesajlar: başarılı, hata, yükleniyor ve Geri Al gibi eylemler.",
    },
    {
        key: "side-panel", name: "SidePanel", cat: "feedback",
        source: "comp/side-panel.js", samples: ["02-comp-examples/side-panel.htm", "02-comp-examples/side-panel-2.htm"],
        en: "A drawer that slides in from a side of the screen, or of a box like an app column, over the page.",
        tr: "Ekranın ya da bir kutunun (Ör: uygulama sütunu) bir kenarından sayfanın üzerine kayarak açılan panel (çekmece).",
    },
    {
        key: "loading-screen", name: "LoadingScreen", cat: "feedback",
        source: "comp/loading-screen.js", deps: ["comp/smart-button.js"], samples: ["02-comp-examples/loading-screen.htm"],
        en: "Full cover splash and loading screen with an icon, a title, a spinner and progress.",
        tr: "İkon, başlık, dönen gösterge ve ilerleme içeren tam ekran açılış ve yükleme ekranı.",
    },
    {
        key: "chart-box", name: "ChartBox", cat: "data",
        source: "comp/chart-box.js", samples: ["02-comp-examples/chart-box.htm"],
        en: "Chart.js charts used like a basic.js object.",
        tr: "Chart.js grafiklerini bir basic.js nesnesi gibi kullanır.",
    },
    {
        key: "graph-box", name: "GraphBox", cat: "data",
        source: "comp/graph-box.js", samples: ["02-comp-examples/graph-box.htm"],
        en: "Charts with no library: one file draws them as SVG. Line, area and bar, with a tooltip, a legend and two themes.",
        tr: "Kütüphanesiz grafikler: tek dosya SVG olarak çizer. Çizgi, alan ve çubuk; ipucu, gösterge ve iki tema.",
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
        source: "comp/time-line.js", samples: ["02-comp-examples/time-line.htm"],
        en: "A vertical time line: a dot for every item and a line between the dots.",
        tr: "Dikey zaman çizelgesi: her öğe için bir nokta ve noktaların arasında bir çizgi.",
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
        source: "comp/data-table.js", deps: ["comp/search-input-v2.js"],
        samples: [
            { file: "02-comp-examples/data-table.htm", title: "Styles" },
            { file: "02-comp-examples/data-table-2.htm", title: "Basic" },
            { file: "02-comp-examples/data-table-3.htm", title: "Search & sort" },
            { file: "02-comp-examples/data-table-4.htm", title: "Add & delete" },
            { file: "02-comp-examples/data-table-5.htm", title: "Custom cells" },
        ],
        en: "A table for lists up to about 2,000 rows: sorting, search, keyboard selection, your own cells and row updates by id. For more rows: SmartTable.",
        tr: "Yaklaşık 2.000 satıra kadar listeler için tablo: sıralama, arama, klavyeyle seçim, kendi hücreleriniz ve id ile satır güncelleme. Daha fazla satır için: SmartTable.",
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
        ],
        en: "The default button: an icon and a text (or one of them; an empty text makes an icon button). The look in three steps: styleName (the template: ozdenType1-4, pill, outlined, ozdenType1Dark-4Dark), tone (white, cyan, orange, yellow, green, blue, and blueDark... for a dark page) and style (your own colors: the color and the color under the mouse; pressed, it gets darker by itself). A waiting clock or dots while a job runs, and a two-click ask with a bubble.",
        tr: "Varsayılan düğme: ikon ve yazı (ya da biri; boş bir metin ikon düğmesi yapar). Görünüş üç adımda: styleName (kalıp: ozdenType1-4, pill, outlined, ozdenType1Dark-4Dark), tone (white, cyan, orange, yellow, green, blue ve koyu sayfa için blueDark...) ve style (kendi renklerin: renk ve fare üzerindeyken renk; basınca kendiliğinden koyulaşır). Bir iş sürerken bekleme saati ya da noktaları ve balonlu iki tıklamalı onay.",
    },
    {
        key: "smart-table", name: "SmartTable", cat: "data",
        source: "comp/smart-table.js", deps: ["comp/search-input-v2.js", "comp/context-menu.js", "comp/tooltip.js"],
        samples: [
            { file: "02-comp-examples/smart-table.htm", title: "Styles" },
            { file: "02-comp-examples/smart-table-1.htm", title: "2M rows" },
            { file: "02-comp-examples/smart-table-2.htm", title: "Actions" },
            { file: "02-comp-examples/smart-table-3.htm", title: "Edit & delete" },
            { file: "02-comp-examples/smart-table-4.htm", title: "Style" },
        ],
        en: "Virtual-scroll table for millions of rows, with filtering, sorting, custom cells and editing. Style packages: classic (default) and dark, the looks of DataTable, and green (the old look). A cut text shows all of it in a bubble.",
        tr: "Milyonlarca satır için sanal kaydırmalı tablo: filtreleme, sıralama, özel hücreler ve düzenleme. Stil paketleri: DataTable'ın görünüşleri classic (varsayılan) ve dark, bir de green (eski görünüş). Sığmayan bir yazı, balonda bütünüyle görünür.",
    },
    {
        key: "check-box", name: "CheckBox", cat: "selection",
        source: "comp/check-box.js",
        samples: [
            { file: "02-comp-examples/check-box-1.htm", title: "Example 1" },
            { file: "02-comp-examples/check-box-2.htm", title: "Example 2" },
            { file: "02-comp-examples/check-box-3.htm", title: "Example 3 (dark)" },
        ],
        en: "Check box with a label, drawn with code; classic, modern and dark style packages.",
        tr: "Kodla çizilen etiketli onay kutusu; classic, modern ve dark stil paketleri.",
    },
    {
        key: "radio-button", name: "RadioButton", cat: "selection",
        source: "comp/radio-button.js",
        samples: [
            { file: "02-comp-examples/radio-button-1.htm", title: "Example 1" },
            { file: "02-comp-examples/radio-button-2.htm", title: "Example 2" },
            { file: "02-comp-examples/radio-button-3.htm", title: "Example 3 (dark)" },
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
        source: "comp/bottom-bar.js", deps: ["comp/badge-v2.js"],
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
        key: "input-b", name: "InputB", cat: "inputs",
        source: "comp/input-b.js", deps: ["comp/tooltip.js"],
        samples: [
            { file: "02-comp-examples/input-b-ex1.htm", title: "Basic" },
            { file: "02-comp-examples/input-b-ex2.htm", title: "Units & hints" },
            { file: "02-comp-examples/input-b-ex3-style.htm", title: "Style" },
            { file: "02-comp-examples/input-b-ex4-custom-unit.htm", title: "Custom unit" },
            { file: "02-comp-examples/input-b-ex5-warning-icon.htm", title: "Warning icon" },
        ],
        en: "Labeled text field with an icon, a unit, hints and validation; the base of the other *InputB fields.",
        tr: "İkon, birim, ipucu ve doğrulama içeren etiketli metin alanı; diğer *InputB alanlarının temeli.",
    },
    {
        key: "email-input-b", name: "EmailInputB", cat: "inputs",
        source: "comp/email-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/email-input-b.htm"],
        en: "An InputB that checks e-mail addresses.",
        tr: "E-posta adresini denetleyen InputB.",
    },
    {
        key: "password-input-b", name: "PasswordInputB", cat: "inputs",
        source: "comp/password-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/password-input-b.htm"],
        en: "Password field with a show and hide button.",
        tr: "Göster ve gizle düğmeli şifre alanı.",
    },
    {
        key: "number-input-b", name: "NumberInputB", cat: "inputs",
        source: "comp/number-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/number-input-b.htm"],
        en: "An InputB that accepts only numbers.",
        tr: "Yalnızca sayı kabul eden InputB.",
    },
    {
        key: "phone-input-b", name: "PhoneInputB", cat: "inputs",
        source: "comp/phone-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"],
        samples: [
            { file: "02-comp-examples/phone-input-b.htm", title: "Basic" },
            { file: "02-comp-examples/phone-input-b-select-country.htm", title: "Select country" },
        ],
        en: "Phone number field with a country code; one example opens a country list.",
        tr: "Ülke kodlu telefon alanı; bir örnek ülke listesi açar.",
    },
    {
        key: "currency-input-b", name: "CurrencyInputB", cat: "inputs",
        source: "comp/currency-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/currency-input-b.htm"],
        en: "Money field that formats the amount and shows its currency.",
        tr: "Tutarı biçimlendiren ve para birimini gösteren alan.",
    },
    {
        key: "url-input-b", name: "URLInputB", cat: "inputs",
        source: "comp/url-input-b.js", deps: ["comp/tooltip.js", "comp/input-b.js", "comp/tiny-select.js"], samples: ["02-comp-examples/url-input-b.htm"],
        en: "Web address field with a protocol selector.",
        tr: "Protokol seçicili web adresi alanı.",
    },
    {
        key: "textarea-b", name: "TextareaB", cat: "inputs",
        source: "comp/textarea-b.js", deps: ["comp/tooltip.js", "comp/input-b.js"], samples: ["02-comp-examples/textarea-b.htm"],
        en: "Multi-line text field in the InputB style, with a character counter.",
        tr: "InputB görünümünde, karakter sayaçlı çok satırlı metin alanı.",
    },
    {
        key: "search-input", name: "SearchInput", cat: "inputs",
        source: "comp/search-input-v2.js", samples: [{ file: "02-comp-examples/search-input-v2.htm", title: "Basic" }, { file: "02-comp-examples/search-input-v2-place.htm", title: "Place: right / bottom" }],
        en: "Search field with a search icon and a clear button.",
        tr: "Arama ikonu ve temizleme düğmeli arama kutusu.",
    },
    {
        key: "slider", name: "Slider", cat: "inputs",
        source: "comp/slider.js", samples: ["02-comp-examples/slider.htm"],
        en: "Slider for choosing a value in a range, inspired by Material 3.",
        tr: "Bir aralıktan değer seçmek için kaydırıcı; Material 3'ten esinlenildi.",
    },
    {
        key: "toggle", name: "Toggle", cat: "selection",
        source: "comp/toggle.js",
        samples: [
            { file: "02-comp-examples/toggle.htm", title: "A settings list" },
            { file: "02-comp-examples/toggle-2.htm", title: "modern and classic" },
            { file: "02-comp-examples/toggle-3.htm", title: "Shapes and marks" },
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
        ],
        en: "A hint bubble over an object: it follows the mouse or stays at the object, with an optional bordered arrow, always inside the screen; your own content in it, or a popover that stays and can be clicked.",
        tr: "Bir nesnenin üzerinde ipucu balonu: fareyi izler ya da nesnenin yanında durur; isteğe bağlı kenarlıklı ok, hep ekranın içinde; içinde kendi içeriğin ya da açık kalan, tıklanabilen bir popover.",
    },
    {
        key: "badge", name: "BadgeV2", cat: "feedback",
        source: "comp/badge-v2.js", samples: ["02-comp-examples/badgeV2.htm"],
        en: "Notification badge on an object: a dot or a number; 0 and 1 can be shown as numbers, and the number can have its own look (a white ring).",
        tr: "Bir nesnenin üzerinde bildirim rozeti: nokta ya da sayı; 0 ve 1 de sayı olarak gösterilebilir, sayının kendi görünüşü olabilir (beyaz halka).",
    },
    {
        key: "login-page", name: "LoginPage", cat: "pages",
        source: "comp/login-page-v2.js", deps: ["comp/ui-effects.js", "comp/tooltip.js", "comp/input-b.js", "comp/email-input-b.js", "comp/password-input-b.js", "comp/tabs.js", "comp/smart-button.js", "comp/loading-screen.js"],
        samples: [
            { file: "02-comp-examples/login-page-v2.htm", title: "Light" },
            { file: "02-comp-examples/login-page-dark-v2.htm", title: "Dark" },
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
