# CLAUDE.md: Basic Designer

basic.js ile yazılmış bir sayfayı, kodu değiştirmeden bir tasarım aracında açan editör (`index.htm`). Ayrıntılı kullanım ve iç yapı `readme.md`'de. Bu dosya designer'ı geliştirmek içindir.

## Amaç

Bir basic.js sayfasını görsel olarak düzenlemek: katmanlar, seçim, özellik paneli, bileşen parametreleri, değişiklik listesi. Değişiklikler canlı sayfaya uygulanır, **dosyaya yazılmaz**. "Copy prompt" / "Send to AI" ile `dosya:satır` bilgisiyle yapay zekaya gider; kodu yapay zeka değiştirir.

## Teknoloji

- basic.js ve deponun bileşenleri (`../basic/`, `../comp/`: TreeView, PropertyPanel, ContextMenu, Tabs...). Derleme yok.
- `designer.js`: sayfanın HTML'ini okur, aynı satırlarda `<base>` ve `runtime.js` ekler, `srcdoc` ile iframe'e verir. Adres okuyan sayfalar için `host.htm`.
- `runtime.js`: iframe'in içinde; nesneleri ve bileşen parametrelerini (`box.__bd`) yakalar.
- `param-kinds.js` (bir parametre ne tutar, metinden değere), `param-editors.js` (Parameters satırları ve küçük pencereler); dizi ve nesne için tablo penceresi kitin bileşeni: `comp/json-editor.js` (`JsonEditor.open`, `BasicDesigner.openParamTable`). `runtime.js` `SKIP_FILES` bu dosyaları da bilir: yeni bir designer dosyası oraya da eklenir, yoksa bileşen yeniden yapılınca satır bilgisi designer'ı gösterir. Bir `comp/` dosyası oraya giremez (sayfanın kendi kopyası da aynı adreste): bu yüzden tablonun Apply'ı bileşeni bir zamanlayıcıyla yeniden yapar.
- VS Code eklentisi: `vscode-extension/` (`extension.js`). Dosya yazma (yeni sayfa, resim) yalnızca eklentide.
- Live Server (port 5505) ya da eklenti ile açılır: sayfalar `fetch` ile okunur, `file://` çalışmaz.

## Kurallar

- Açılan sayfanın dosyasına designer hiçbir zaman yazmaz. Satır numaraları değişmemeli: prompt'taki `dosya:satır` bunlara dayanır.
- İki tür sayfa: **taslak tasarım** (deponun kökündeki `_designs/`: arkasında bileşen yok, her görünüş ve durum düz nesnelerle yan yana) ve **bileşen sayfası** (depodaki örnekler: gerçek bileşen çalışır).
- Eklentide bir değişiklik: `package.json` sürümü artar, `npx @vscode/vsce@3.2.2 package`, yeni `.vsix` VS Code'a kurulur. Dosyanın adı `basic-designer-<sürüm>-alpha.vsix` (`--out`).
- Klasörün adı `_basic-designer` kalır: eklentinin `basicDesigner.designerPath` ayarı bu yola bakar.
- Klasör GitHub'a gider (kullanıcı, 2026-11-02). Yalnızca `_notes.md`, `prompts/` ve `old-*/` gitignore'da kalır; bu üçü hiç eklenmez.

## Kalite

- Büyük bir değişiklikten sonra denetim: `node _basic-designer/audit/run-audit.js` (adsız: hızlı denetimlerin hepsi; `editor manual` gibi adlar; `change` her özellik, ~8 dk; readme "Denetim"). Elle açılırsa **düz bir sunucuyla** (bağlantı düşürmeyen bir Node sunucusu: `python3 -m http.server` test sayfalarında bağlantı düşürdü), Live Server ile değil (dosya değişince sayfayı yeniden yükler, uzun test yarıda kalır).
- Designer'ın kullandığı bir bileşen (PropertyPanel, TreeView...) değişince designer aynı kalmalı (kendi görünüşünü stilleriyle tutar: `BasicDesigner.panelStyle()`, `treeStyle()`): `node test/compare-pages.js` onu kendiliğinden de karşılaştırır (sayfasını bekler; yüklendiğinde, bir Box ve bir Label seçiliyken, yalnız resim); tek başına: `node test/compare-pages.js _basic-designer/index.htm` (sonuç SAME olmalı). Resmi: `node test/screenshot.js _basic-designer/index.htm --wait-for "BasicDesigner.state.rt" --run "..."`.
- Undo / redo, Revert all ve kayıtlı oturum her yeni özellikte çalışmalı.
- Yeni bir özellik `readme.md`'ye yazılır.

## Stil kuralları

- Koyu arayüz; bileşenler `dark` paketleriyle.
- Kod: `context/basic-js-code-rules.md` (deponun içinde).
- `readme.md` ile bu dosya çelişirse readme doğrudur (ayrıntılar orada).
