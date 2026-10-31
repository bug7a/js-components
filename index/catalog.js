/* Bismillah */

/*

JS Components Website - Component Catalog - v26.09

- Sitede gösterilen bileşenlerin listesi. Yeni bir bileşen eklemek için COMPONENTS listesine bir satır ekleyin.
- The list of the components shown on the site. Add a line to COMPONENTS for a new component.

COMPONENT:
{
    key: "tabs",                            // Adres çubuğunda: index.htm#/tabs
    name: "Tabs",                           // Bileşenin adı (fonksiyon adı)
    gen: 4,                                 // Kuşak: 1 (comp-m1) ... 4 (comp-m4)
    cat: "navigation",                      // CATEGORIES anahtarı
    source: "comp-m4/tabs.js",              // Bileşenin kaynak dosyası (deponun köküne göre)
    samples: ["02-comp-m4-samples/tabs.htm"], // Örnek sayfalar. Başlık için: { file: "...", title: "..." }
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

    // --- comp-m4 ---
    {
        key: "tabs", name: "Tabs", gen: 4, cat: "navigation",
        source: "comp-m4/tabs.js", samples: ["02-comp-m4-samples/tabs.htm"],
        en: "Tab bar with underline and pill variants, counts, badges, closable tabs, a vertical mode and optional panels.",
        tr: "Alt çizgili ve hap görünümlü sekme çubuğu: sayı, rozet, kapatılabilir sekme, dikey düzen ve isteğe bağlı paneller.",
    },
    {
        key: "tree-view", name: "TreeView", gen: 4, cat: "navigation",
        source: "comp-m4/tree-view.js", samples: ["02-comp-m4-samples/tree-view.htm"],
        en: "A tree of nested items with lazy branches, keyboard and type-ahead: a file explorer, a category tree, a menu or design tool layers.",
        tr: "İç içe öğelerden oluşan ağaç; sonradan yüklenen dallar, klavye ve harfle atlama: dosya gezgini, kategori ağacı, menü veya tasarım aracı katmanları.",
    },
    {
        key: "breadcrumbs", name: "Breadcrumbs", gen: 4, cat: "navigation",
        source: "comp-m4/breadcrumbs.js", samples: ["02-comp-m4-samples/breadcrumbs.htm"],
        en: "Shows where the current page is in a hierarchy: Home / Products / Laptops.",
        tr: "Sayfanın bir hiyerarşideki yerini gösterir: Ana sayfa / Ürünler / Dizüstü.",
    },
    {
        key: "page-control", name: "PageControl", gen: 4, cat: "navigation",
        source: "comp-m4/page-control.js", samples: ["02-comp-m4-samples/page-control.htm"],
        en: "Sliding or fading pages for wizards, carousels and app screens, with swipe, dots, arrows and auto play.",
        tr: "Sihirbaz, karusel ve uygulama ekranları için kayan veya solan sayfalar: kaydırma, noktalar, oklar, otomatik geçiş.",
    },
    {
        key: "search-results", name: "SearchResults", gen: 4, cat: "navigation",
        source: "comp-m4/search-results.js", samples: ["02-comp-m4-samples/search-results.htm"],
        en: "The result list that opens under a search input, like an autocomplete or a command palette.",
        tr: "Arama kutusunun altında açılan sonuç listesi; otomatik tamamlama veya komut paleti gibi.",
    },
    {
        key: "action-button", name: "ActionButton", gen: 4, cat: "actions",
        source: "comp-m4/action-button.js", samples: ["02-comp-m4-samples/action-button.htm"],
        en: "Round floating action button in the corner of the screen; it opens a menu of actions. The new version of UIActionButton.",
        tr: "Ekranın köşesinde duran yuvarlak eylem düğmesi; eylem menüsünü açar. UIActionButton'ın yeni sürümü.",
    },
    {
        key: "context-menu", name: "ContextMenu", gen: 4, cat: "actions",
        source: "comp-m4/context-menu.js", samples: ["02-comp-m4-samples/context-menu.htm"],
        en: "A simple menu that opens at the mouse point, with text or icon items.",
        tr: "Farenin olduğu yerde açılan sade menü; yazılı veya ikonlu öğeler.",
    },
    {
        key: "item-list", name: "ItemList", gen: 4, cat: "selection",
        source: "comp-m4/item-list.js", samples: ["02-comp-m4-samples/item-list.htm"],
        en: "A list of items with an icon, a title and a description (or your own rows): vertical, horizontal or grid, single or multiple selection, search and keyboard.",
        tr: "İkon, başlık ve açıklamalı öğe listesi (ya da kendi satırlarınız): dikey, yatay veya ızgara; tekli veya çoklu seçim, arama ve klavye.",
    },
    {
        key: "select-box", name: "SelectBox", gen: 4, cat: "selection",
        source: "comp-m4/select-box.js", samples: ["02-comp-m4-samples/select-box.htm", "02-comp-m4-samples/select-box-ozden-item.htm", "02-comp-m4-samples/select-box-ozden-text.htm"],
        en: "Dropdown select for single or multiple selection, with select all and clear.",
        tr: "Tekli veya çoklu seçim için açılır liste; tümünü seç ve temizle düğmeleri.",
    },
    {
        key: "numeric-keyboard", name: "NumericKeyboard", gen: 4, cat: "inputs",
        source: "comp-m4/numeric-keyboard.js", samples: ["02-comp-m4-samples/numeric-keyboard.htm"],
        en: "Number keys on the screen for a PIN, an amount or a kiosk: two layouts, a hidden PIN, the keyboard of the computer too. The new version of UINumericKeyboard.",
        tr: "PIN, tutar ya da kiosk için ekrandaki rakam tuşları: iki düzen, gizli PIN, bilgisayar klavyesi de çalışır. UINumericKeyboard'un yeni sürümü.",
    },
    {
        key: "full-screen-select", name: "FullScreenSelect", gen: 4, cat: "selection",
        source: "comp-m4/full-screen-select.js", samples: ["02-comp-m4-samples/full-screen-select.htm"],
        en: "A select field whose list opens on the whole screen, with a search box: for phones and long lists. The new version of UISelectText.",
        tr: "Listesi tüm ekranda açılan, arama kutulu seçim alanı: telefonlar ve uzun listeler için. UISelectText'in yeni sürümü.",
    },
    {
        key: "select-date", name: "SelectDate", gen: 4, cat: "selection",
        source: "comp-m4/select-date.js", samples: ["02-comp-m4-samples/select-date.htm"],
        en: "Date picker as a popup or an always visible calendar, with a month and year view.",
        tr: "Açılır veya sayfada sabit takvim olarak tarih seçici; ay ve yıl görünümü.",
    },
    {
        key: "select-time", name: "SelectTime", gen: 4, cat: "selection",
        source: "comp-m4/select-time.js", samples: ["02-comp-m4-samples/select-time.htm"],
        en: "Time picker with scrollable hour and minute columns, as a popup or inline.",
        tr: "Kaydırılabilir saat ve dakika sütunlarıyla saat seçici; açılır veya sayfada sabit.",
    },
    {
        key: "select-color", name: "SelectColor", gen: 4, cat: "selection",
        source: "comp-m4/select-color.js", samples: ["02-comp-m4-samples/select-color.htm"],
        en: "Color picker: a field that opens a palette, or an always visible palette.",
        tr: "Renk seçici: palet açan bir alan veya sayfada sabit bir palet.",
    },
    {
        key: "select-file", name: "SelectFile", gen: 4, cat: "inputs",
        source: "comp-m4/select-file.js", samples: ["02-comp-m4-samples/select-file.htm"],
        en: "Drop zone and file dialog that lists the chosen files with image previews and sizes.",
        tr: "Dosya bırakma alanı ve dosya penceresi; seçilen dosyaları önizleme ve boyutlarıyla listeler.",
    },
    {
        key: "tag-input", name: "TagInput", gen: 4, cat: "inputs",
        source: "comp-m4/tag-input.js", samples: ["02-comp-m4-samples/tag-input.htm"],
        en: "A field of chips for tags, keywords or e-mails, with suggestions, validation and paste splitting.",
        tr: "Etiket, anahtar kelime veya e-posta için çipli alan: öneriler, doğrulama ve yapıştırınca bölme.",
    },
    {
        key: "stepper", name: "Stepper", gen: 4, cat: "inputs",
        source: "comp-m4/stepper.js", samples: ["02-comp-m4-samples/stepper.htm"],
        en: "Number stepper with decimals, a unit, typed editing and hold-to-repeat buttons.",
        tr: "Ondalık, birim, elle yazma ve basılı tutunca tekrarlayan düğmeleriyle sayı seçici.",
    },
    {
        key: "slider-field", name: "SliderField", gen: 4, cat: "inputs",
        source: "comp-m4/slider-field.js", samples: ["02-comp-m4-samples/slider-field.htm"],
        en: "A slider in the shape of a field: the label at the left, the value at the right, step dots, drag, click to jump and typed editing.",
        tr: "Alan şeklinde kaydırıcı: solda etiket, sağda değer, adım noktaları; sürükleme, tıklayıp atlama ve elle yazma.",
    },
    {
        key: "property-panel", name: "PropertyPanel", gen: 4, cat: "inputs",
        source: "comp-m4/property-panel.js", samples: ["02-comp-m4-samples/property-panel.htm"],
        en: "A design tool style property inspector at the right side, built from a JSON: numbers, selects, segmented buttons, toggles and constraints, with change events.",
        tr: "Sağda açılan, tasarım aracı tarzı özellik paneli; JSON ile kurulur: sayılar, seçim kutuları, bölmeli düğmeler, açma/kapama ve kısıtlar, değişiklik olaylarıyla.",
    },
    {
        key: "label-editor", name: "LabelEditor", gen: 4, cat: "inputs",
        source: "comp-m4/label-editor.js", samples: ["02-comp-m4-samples/label-editor.htm"],
        en: "An object based editor: add labels, change their properties in a side panel, save the styles with a name and apply them to other labels.",
        tr: "Nesne tabanlı editör: label ekleyin, özelliklerini yan panelden değiştirin, stilleri bir adla kaydedip başka label'lara uygulayın.",
    },
    {
        key: "rich-text-editor", name: "RichTextEditor", gen: 4, cat: "inputs",
        source: "comp-m4/rich-text-editor.js", samples: ["02-comp-m4-samples/rich-text-editor.htm"],
        en: "A simple rich text editor with a toolbar (bold, headings, lists, quote, link, undo), cleaned HTML output and a character limit.",
        tr: "Araç çubuklu basit zengin metin editörü (kalın, başlık, liste, alıntı, link, geri al); temizlenmiş HTML çıktısı ve karakter sınırı.",
    },
    {
        key: "sortable-list", name: "SortableList", gen: 4, cat: "inputs",
        source: "comp-m4/sortable-list.js", samples: ["02-comp-m4-samples/sortable-list.htm"],
        en: "A list whose order is changed by drag and drop, the keyboard or up / down buttons, with locked rows.",
        tr: "Sırası sürükle-bırak, klavye veya yukarı / aşağı düğmeleriyle değiştirilen liste; kilitli satırlar da olur.",
    },
    {
        key: "progress-bar", name: "ProgressBar", gen: 4, cat: "feedback",
        source: "comp-m4/progress-bar.js",
        samples: [
            { file: "02-comp-m4-samples/progress-bar.htm", title: "Basic" },
            { file: "02-comp-m4-samples/progress-bar-ozden.htm", title: "ozden, two parts, stripes, limits" },
        ],
        en: "Horizontal progress bar with a title and a value text; determinate or indeterminate. Two parts (70 + 5) in their own colors, moving stripes and limit lines.",
        tr: "Başlık ve değer yazılı yatay ilerleme çubuğu; belirli veya belirsiz ilerleme. Kendi renklerinde iki parça (70 + 5), kayan çizgiler ve limit çizgileri.",
    },
    {
        key: "dialog", name: "Dialog", gen: 4, cat: "feedback",
        source: "comp-m4/dialog.js", samples: ["02-comp-m4-samples/dialog.htm", "02-comp-m4-samples/dialog-centered.htm"],
        en: "A dialog over the page with fields and buttons: a button that asks again, a waiting button, keyboard; Dialog.confirm, alert and prompt. In development.",
        tr: "Sayfanın üstünde alanlı ve düğmeli diyalog: tekrar soran düğme, bekleyen düğme, klavye; Dialog.confirm, alert ve prompt. Geliştiriliyor.",
    },
    {
        key: "notice", name: "Notice", gen: 4, cat: "feedback",
        source: "comp-m4/notice.js", samples: ["02-comp-m4-samples/notice.htm"],
        en: "A short message in the middle of the screen over a soft cover: five types, an icon, a second line; it goes by itself. The new version of notice (M1).",
        tr: "Ekranın ortasında, hafif bir örtünün üstünde kısa mesaj: beş tür, ikon, ikinci satır; kendiliğinden kaybolur. notice'in (M1) yeni sürümü.",
    },
    {
        key: "toast", name: "Toast", gen: 4, cat: "feedback",
        source: "comp-m4/toast.js", samples: ["02-comp-m4-samples/toast.htm"],
        en: "Short messages that come and go: success, error, loading, and actions like Undo.",
        tr: "Gelip giden kısa mesajlar: başarılı, hata, yükleniyor ve Geri Al gibi eylemler.",
    },
    {
        key: "modal", name: "Modal", gen: 4, cat: "feedback",
        source: "comp-m4/modal.js", samples: ["02-comp-m4-samples/modal.htm"],
        en: "A dialog window over the page for any content; Modal.confirm() and Modal.alert() return a Promise. Not for new pages: use Dialog (M4).",
        tr: "Sayfanın üzerinde her türlü içerik için pencere; Modal.confirm() ve Modal.alert() Promise döndürür. Yeni sayfalarda değil: Dialog (M4) kullanılır.",
    },
    {
        key: "side-panel", name: "SidePanel", gen: 4, cat: "feedback",
        source: "comp-m4/side-panel.js", samples: ["02-comp-m4-samples/side-panel.htm"],
        en: "A drawer that slides in from a side of the screen, over the page.",
        tr: "Ekranın bir kenarından sayfanın üzerine kayarak açılan panel (çekmece).",
    },
    {
        key: "loading-screen", name: "LoadingScreen", gen: 4, cat: "feedback",
        source: "comp-m4/loading-screen.js", samples: ["02-comp-m4-samples/loading-screen.htm"],
        en: "Full cover splash and loading screen with an icon, a title, a spinner and progress.",
        tr: "İkon, başlık, dönen gösterge ve ilerleme içeren tam ekran açılış ve yükleme ekranı.",
    },
    {
        key: "chart-box", name: "ChartBox", gen: 4, cat: "data",
        source: "comp-m4/chart-box.js", samples: ["02-comp-m4-samples/chart-box.htm"],
        en: "Chart.js charts used like a basic.js object.",
        tr: "Chart.js grafiklerini bir basic.js nesnesi gibi kullanır.",
    },
    {
        key: "gauge", name: "Gauge", gen: 4, cat: "data",
        source: "comp-m4/gauge.js", samples: ["02-comp-m4-samples/gauge.htm"],
        en: "A value drawn on an arc: a full ring or a half arc.",
        tr: "Bir yay üzerinde gösterilen değer: tam halka veya yarım yay.",
    },
    {
        key: "mini-graph-box", name: "MiniGraphBox", gen: 4, cat: "data",
        source: "comp-m4/mini-graph-box.js", samples: ["02-comp-m4-samples/mini-graph-box.htm"],
        en: "Small KPI box with a title, a value, an icon and a live bar graph.",
        tr: "Başlık, değer, ikon ve canlı çubuk grafik içeren küçük gösterge kutusu.",
    },
    {
        key: "spark-line-box", name: "SparkLineBox", gen: 4, cat: "data",
        source: "comp-m4/spark-line-box.js", samples: ["02-comp-m4-samples/spark-line-box.htm"],
        en: "KPI box with a line graph, a trend badge, min/max dots and a hover tooltip.",
        tr: "Çizgi grafikli gösterge kutusu: eğilim rozeti, en düşük ve en yüksek noktaları, ipucu.",
    },
    {
        key: "time-line", name: "TimeLine", gen: 4, cat: "data",
        source: "comp-m4/time-line.js", samples: ["02-comp-m4-samples/time-line.htm"],
        en: "A vertical time line: a dot for every item and a line between the dots.",
        tr: "Dikey zaman çizelgesi: her öğe için bir nokta ve noktaların arasında bir çizgi.",
    },
    {
        key: "scrolling-text", name: "ScrollingText", gen: 4, cat: "data",
        source: "comp-m4/scrolling-text.js", samples: ["02-comp-m4-samples/scrolling-text.htm"],
        en: "A one line text that slides to show its end when it does not fit: always, or only under the mouse.",
        tr: "Kutusuna sığmayınca sonunu göstermek için kayan tek satırlık yazı: sürekli ya da yalnızca fare üzerindeyken.",
    },
    {
        key: "tiny-table-m4", name: "TinyTable", gen: 4, cat: "data",
        source: "comp-m4/tiny-table.js", samples: ["02-comp-m4-samples/tiny-table.htm"],
        en: "A light table for short lists: a colored title row, one line rows (a long text slides under the mouse), a soft color under the mouse; scrolling rows. The new version of TinyTable (M1).",
        tr: "Kısa listeler için hafif tablo: renkli başlık satırı, tek satırlık hücreler, fareyle gelinen satırda yumuşak renk; kayan satırlar. TinyTable'ın (M1) yeni sürümü.",
    },
    {
        key: "data-table", name: "DataTable", gen: 4, cat: "data",
        source: "comp-m4/data-table.js",
        samples: [
            { file: "02-comp-m4-samples/data-table.htm", title: "Styles" },
            { file: "02-comp-m4-samples/data-table-2.htm", title: "Basic" },
            { file: "02-comp-m4-samples/data-table-3.htm", title: "Search & sort" },
            { file: "02-comp-m4-samples/data-table-4.htm", title: "Add & delete" },
            { file: "02-comp-m4-samples/data-table-5.htm", title: "Custom cells" },
        ],
        en: "A table for short and middle lists: sorting, search, keyboard selection, your own cells and row updates by id. For very many rows: SmartTable.",
        tr: "Kısa ve orta uzunlukta listeler için tablo: sıralama, arama, klavyeyle seçim, kendi hücreleriniz ve id ile satır güncelleme. Çok fazla satır için: SmartTable.",
    },
    {
        key: "web-view", name: "WebView", gen: 4, cat: "pages",
        source: "comp-m4/web-view.js", samples: ["02-comp-m4-samples/web-view.htm"],
        en: "An iframe box with a loading spinner, errors, messages, scaled previews and a toolbar. The previews on this site use it.",
        tr: "Yükleniyor göstergesi, hata, mesajlaşma, ölçekli önizleme ve araç çubuğu olan iframe kutusu. Bu sitedeki önizlemeler de onu kullanır.",
    },
    {
        key: "ui-effects", name: "UIEffects", gen: 4, cat: "styles",
        source: "comp-m4/ui-effects.js", samples: ["02-comp-m4-samples/ui-effects.htm"],
        en: "Press, hover and attention effects for any basic.js object: ripple, lift, tilt, spotlight and more.",
        tr: "Her basic.js nesnesi için basma, üzerine gelme ve dikkat efektleri: ripple, lift, tilt, spotlight ve dahası.",
    },
    {
        key: "ui-standards", name: "UI Standards", gen: 4, cat: "styles",
        source: "comp-m4/ui-standards.js", samples: ["02-comp-m4-samples/ui-standards.htm"],
        en: "Design tokens and themes: colors, font sizes, corner radius and a light, dark or automatic theme.",
        tr: "Tasarım değerleri ve temalar: renkler, yazı boyları, köşe yuvarlaklığı ve açık, koyu veya otomatik tema.",
    },

    // --- comp-m3 ---
    {
        key: "smart-table", name: "SmartTable", gen: 3, cat: "data",
        source: "comp-m3/smart-table.js",
        samples: [
            { file: "02-comp-m3-samples/smart-table-1.htm", title: "2M rows" },
            { file: "02-comp-m3-samples/smart-table-2.htm", title: "Actions" },
            { file: "02-comp-m3-samples/smart-table-3.htm", title: "Edit & delete" },
            { file: "02-comp-m3-samples/smart-table-4.htm", title: "Style" },
        ],
        en: "Virtual-scroll table for millions of rows, with filtering, sorting, custom cells and editing.",
        tr: "Milyonlarca satır için sanal kaydırmalı tablo: filtreleme, sıralama, özel hücreler ve düzenleme.",
    },
    {
        key: "check-box", name: "CheckBox", gen: 3, cat: "selection",
        source: "comp-m3/check-box.js",
        samples: [
            { file: "02-comp-m3-samples/check-box-1.htm", title: "Example 1" },
            { file: "02-comp-m3-samples/check-box-2.htm", title: "Example 2" },
            { file: "02-comp-m3-samples/check-box-3.htm", title: "Example 3 (dark)" },
        ],
        en: "Check box with a label, drawn with code; classic, modern and dark style packages.",
        tr: "Kodla çizilen etiketli onay kutusu; classic, modern ve dark stil paketleri.",
    },
    {
        key: "radio-button", name: "RadioButton", gen: 3, cat: "selection",
        source: "comp-m3/radio-button.js",
        samples: [
            { file: "02-comp-m3-samples/radio-button-1.htm", title: "Example 1" },
            { file: "02-comp-m3-samples/radio-button-2.htm", title: "Example 2" },
            { file: "02-comp-m3-samples/radio-button-3.htm", title: "Example 3 (dark)" },
        ],
        en: "Radio buttons that work in groups, with keyboard support and style packages.",
        tr: "Gruplar halinde çalışan, klavye destekli ve stil paketli seçenek düğmeleri.",
    },
    {
        key: "smart-button", name: "SmartButton", gen: 4, cat: "actions",
        source: "comp-m4/smart-button.js",
        samples: [
            { file: "02-comp-m4-samples/smart-button.htm", title: "Basic" },
            { file: "02-comp-m4-samples/smart-button-2.htm", title: "All features" },
            { file: "02-comp-m4-samples/smart-button-3-ozden.htm", title: "Dialogs (ozden)" },
        ],
        en: "The default button: an icon and a text (or one of them), ozden style packages, a waiting clock or dots while a job runs, and a two-click ask with a bubble.",
        tr: "Varsayılan düğme: ikon ve yazı (ya da biri), ozden stil paketleri, bir iş sürerken bekleme saati ya da noktaları ve balonlu iki tıklamalı onay.",
    },
    {
        key: "hold-to-confirm-button", name: "HoldToConfirmButton", gen: 3, cat: "actions",
        source: "comp-m3/hold-to-confirm-button.js", samples: ["02-comp-m3-samples/hold-to-confirm-button.htm"],
        en: "A button that runs only after it is pressed and held; for risky actions like delete.",
        tr: "Ancak basılı tutulunca çalışan düğme; silme gibi riskli işlemler için.",
    },
    {
        key: "bottom-bar", name: "BottomBar", gen: 3, cat: "navigation",
        source: "comp-m3/bottom-bar.js", samples: ["02-comp-m3-samples/bottom-bar.htm"],
        en: "Mobile app bottom bar built from a JSON list of buttons, with badges.",
        tr: "JSON listesinden oluşturulan, rozetli mobil uygulama alt çubuğu.",
    },
    {
        key: "line-progress-bar", name: "LineProgressBar", gen: 3, cat: "feedback",
        source: "comp-m3/progress-bar.js", samples: ["02-comp-m3-samples/progress-bar.htm"],
        en: "A progress bar drawn with thin vertical lines.",
        tr: "İnce dikey çizgilerle çizilen ilerleme çubuğu.",
    },

    // --- comp-m2 ---
    {
        key: "input-b", name: "InputB", gen: 2, cat: "inputs",
        source: "comp-m2/input-b.js",
        samples: [
            { file: "02-comp-m2-samples/input-b-ex1.htm", title: "Basic" },
            { file: "02-comp-m2-samples/input-b-ex2.htm", title: "Units & hints" },
            { file: "02-comp-m2-samples/input-b-ex3-style.htm", title: "Style" },
            { file: "02-comp-m2-samples/input-b-ex4-custom-unit.htm", title: "Custom unit" },
            { file: "02-comp-m2-samples/input-b-ex5-warning-icon.htm", title: "Warning icon" },
        ],
        en: "Labeled text field with an icon, a unit, hints and validation; the base of the other *InputB fields.",
        tr: "İkon, birim, ipucu ve doğrulama içeren etiketli metin alanı; diğer *InputB alanlarının temeli.",
    },
    {
        key: "email-input-b", name: "EmailInputB", gen: 2, cat: "inputs",
        source: "comp-m2/email-input-b.js", samples: ["02-comp-m2-samples/email-input-b.htm"],
        en: "An InputB that checks e-mail addresses.",
        tr: "E-posta adresini denetleyen InputB.",
    },
    {
        key: "password-input-b", name: "PasswordInputB", gen: 2, cat: "inputs",
        source: "comp-m2/password-input-b.js", samples: ["02-comp-m2-samples/password-input-b.htm"],
        en: "Password field with a show and hide button.",
        tr: "Göster ve gizle düğmeli şifre alanı.",
    },
    {
        key: "number-input-b", name: "NumberInputB", gen: 2, cat: "inputs",
        source: "comp-m2/number-input-b.js", samples: ["02-comp-m2-samples/number-input-b.htm"],
        en: "An InputB that accepts only numbers.",
        tr: "Yalnızca sayı kabul eden InputB.",
    },
    {
        key: "phone-input-b", name: "PhoneInputB", gen: 2, cat: "inputs",
        source: "comp-m2/phone-input-b.js",
        samples: [
            { file: "02-comp-m2-samples/phone-input-b.htm", title: "Basic" },
            { file: "02-comp-m2-samples/phone-input-b-select-country.htm", title: "Select country" },
        ],
        en: "Phone number field with a country code; one example opens a country list.",
        tr: "Ülke kodlu telefon alanı; bir örnek ülke listesi açar.",
    },
    {
        key: "currency-input-b", name: "CurrencyInputB", gen: 2, cat: "inputs",
        source: "comp-m2/currency-input-b.js", samples: ["02-comp-m2-samples/currency-input-b.htm"],
        en: "Money field that formats the amount and shows its currency.",
        tr: "Tutarı biçimlendiren ve para birimini gösteren alan.",
    },
    {
        key: "url-input-b", name: "URLInputB", gen: 2, cat: "inputs",
        source: "comp-m2/url-input-b.js", samples: ["02-comp-m2-samples/url-input-b.htm"],
        en: "Web address field with a protocol selector.",
        tr: "Protokol seçicili web adresi alanı.",
    },
    {
        key: "textarea-b", name: "TextareaB", gen: 2, cat: "inputs",
        source: "comp-m2/textarea-b.js", samples: ["02-comp-m2-samples/textarea-b.htm"],
        en: "Multi-line text field in the InputB style, with a character counter.",
        tr: "InputB görünümünde, karakter sayaçlı çok satırlı metin alanı.",
    },
    {
        key: "search-input", name: "SearchInput", gen: 2, cat: "inputs",
        source: "comp-m2/search-input-v2.js", samples: ["02-comp-m2-samples/search-input-v2.htm"],
        en: "Search field with a search icon and a clear button.",
        tr: "Arama ikonu ve temizleme düğmeli arama kutusu.",
    },
    {
        key: "slider", name: "Slider", gen: 2, cat: "inputs",
        source: "comp-m2/slider.js", samples: ["02-comp-m2-samples/slider.htm"],
        en: "Slider for choosing a value in a range, inspired by Material 3.",
        tr: "Bir aralıktan değer seçmek için kaydırıcı; Material 3'ten esinlenildi.",
    },
    {
        key: "toggle", name: "Toggle", gen: 2, cat: "selection",
        source: "comp-m2/toggle.js", samples: ["02-comp-m2-samples/toggle.htm"],
        en: "On and off switch for light and dark pages.",
        tr: "Açık ve koyu sayfalar için aç/kapat anahtarı.",
    },
    {
        key: "tiny-select", name: "TinySelect", gen: 2, cat: "selection",
        source: "comp-m2/tiny-select.js", samples: ["02-comp-m2-samples/tiny-select.htm"],
        en: "Small inline select that fits into a sentence: Theme: Supernova.",
        tr: "Bir cümlenin içine sığan küçük seçim kutusu: Tema: Supernova.",
    },
    {
        key: "text-tabs", name: "TextTabs", gen: 2, cat: "navigation",
        source: "comp-m2/text-tabs.js", samples: ["02-comp-m2-samples/text-tabs.htm"],
        en: "Small text tab bar. Not for new pages: use Tabs (M4).",
        tr: "Küçük yazılı sekme çubuğu. Yeni sayfalarda değil: Tabs (M4) kullanılır.",
    },
    {
        key: "left-menu", name: "LeftMenu", gen: 2, cat: "navigation",
        source: "comp-m2/left-menu.js", samples: ["02-comp-m2-samples/left-menu.htm"],
        en: "Icon side menu that opens on hover, or with a tap on touch screens.",
        tr: "Fareyle üzerine gelince, dokunmatik ekranda dokununca açılan ikonlu yan menü.",
    },
    {
        key: "dialog-m2", name: "Dialog (M2)", gen: 2, cat: "feedback",
        source: "comp-m2/dialog.js", samples: ["02-comp-m2-samples/dialog.htm"],
        en: "A simple dialog window. The first version: new pages use Dialog (M4).",
        tr: "Sade bir diyalog penceresi. İlk sürüm: yeni sayfalarda Dialog (M4) kullanılır.",
    },
    {
        key: "tooltip", name: "Tooltip", gen: 2, cat: "feedback",
        source: "comp-m2/tooltip.js",
        samples: [
            { file: "02-comp-m2-samples/tooltip.htm", title: "Basic" },
            { file: "02-comp-m2-samples/tooltip-2.htm", title: "The bubble: arrow, show(), screen edges" },
            { file: "02-comp-m2-samples/tooltip-3.htm", title: "Content and popover" },
        ],
        en: "A hint bubble over an object: it follows the mouse or stays at the object, with an optional bordered arrow, always inside the screen; your own content in it, or a popover that stays and can be clicked.",
        tr: "Bir nesnenin üzerinde ipucu balonu: fareyi izler ya da nesnenin yanında durur; isteğe bağlı kenarlıklı ok, hep ekranın içinde; içinde kendi içeriğin ya da açık kalan, tıklanabilen bir popover.",
    },
    {
        key: "waiting", name: "Waiting", gen: 2, cat: "feedback",
        source: "comp-m2/waiting.js", samples: ["02-comp-m2-samples/waiting.htm"],
        en: "A waiting animation over the page while something loads.",
        tr: "Bir şey yüklenirken sayfanın üzerinde gösterilen bekleme animasyonu.",
    },
    {
        key: "badge", name: "BadgeV2", gen: 2, cat: "feedback",
        source: "comp-m2/badge-v2.js", samples: ["02-comp-m2-samples/badgeV2.htm"],
        en: "Notification badge on an object: a dot, a number or custom content.",
        tr: "Bir nesnenin üzerinde bildirim rozeti: nokta, sayı veya özel içerik.",
    },
    {
        key: "tiny-table", name: "TinyTable (M2)", gen: 2, cat: "data",
        source: "comp-m2/tiny-table.js", samples: ["02-comp-m2-samples/tiny-table.htm"],
        en: "A light table for short data lists. Not for new pages: use TinyTable (M4).",
        tr: "Kısa veri listeleri için hafif tablo. Yeni sayfalarda değil: TinyTable (M4) kullanılır.",
    },
    {
        key: "login-page", name: "LoginPage", gen: 2, cat: "pages",
        source: "comp-m2/login-page-v2.js",
        samples: [
            { file: "02-comp-m2-samples/login-page-v2.htm", title: "Light" },
            { file: "02-comp-m2-samples/login-page-dark-v2.htm", title: "Dark" },
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

// Bir kategorinin bileşenleri: yeni kuşak önce, sonra listedeki sıra.
CATALOG.getByCategory = function (catKey) {
    return CATALOG.COMPONENTS
        .map(function (comp, index) { return { comp: comp, index: index }; })
        .filter(function (item) { return item.comp.cat === catKey; })
        .sort(function (a, b) { return (b.comp.gen - a.comp.gen) || (a.index - b.index); })
        .map(function (item) { return item.comp; });
};

CATALOG.countSamples = function () {
    return CATALOG.COMPONENTS.reduce(function (total, comp) { return total + comp.samples.length; }, 0);
};
