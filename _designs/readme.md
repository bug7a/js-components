# _designs: taslak tasarımlar

Bu klasörde **yalnızca taslak tasarımlar** durur (2026-10-30). Bir taslak, bir bileşenin bütün görünüşlerini ve
bütün durumlarını yan yana gösteren sade bir sayfadır. basic designer'da açılıp gözle düzenlenir; sonra değişiklikler
bileşene aktarılır. Amaç: tasarım yüzeyi basit ve kolay değişir kalsın, bileşenin kodundan ayrı dursun.

## Bir taslak nasıl olur

- **Arkasında bileşen yoktur.** Sayfa bileşenin dosyasını yüklemez; her parça düz basic.js nesneleriyle çizilir
  (`Box`, `Label`, `Icon`, `HGroup` / `VGroup`). Designer'da her parça tek tek seçilebilir, rengi, kenarı, boyutu
  değiştirilebilir.
- **Yan yana bir ızgara:** satırlarda durumlar, sütunlarda stil paketleri. Her satırın başında ne olduğunu söyleyen
  bir Label, her sütunun üstünde paketin adı.
- **Bütün durumlar:** normal, fare üstünde (hover), basılı, klavye odağı, kapalı, bekliyor, hata, boş, dolu... Bir
  düğme için: basınca nasıl, fare üstüne gelince nasıl. Hareketli durumlar (hover, basma, dönen saat) o anın durgun
  bir görüntüsü olarak çizilir.
- **Değerler sayfanın başında:** paketlerin renkleri ve ölçüleri düz nesnelerde (`LOOKS`, `STATES`...). Bunlar
  bileşenin paketlerinden kopyadır.
- **Adı bileşenin dosyasının adıdır:** `comp/smart-button.js` → `_designs/smart-button.htm`.
- Sayfa kaynağı yükler: `../basic/basic.css`, `../basic/basic.js` (bileşen yok).

## Açmak

- VS Code: dosyaya sağ tık → **Open in basic designer** (eklenti: `_basic-designer/vscode-extension/basic-designer-0.0.8-alpha.vsix`,
  alfa).
- Tarayıcı (Live Server, port 5505):
  `http://127.0.0.1:5505/_basic-designer/index.htm?page=_designs/smart-button.htm`

## Değişiklikleri bileşene aktarmak

1. Taslakta değiştir (renk, kenar, boyut, yazı...).
2. Designer'da **Send to AI** / **Copy prompt**; prompt'a "bileşene aktar" diye not ekle.
3. Yapay zeka her değişen değeri geldiği pakete yazar (`XxxDefaults.style` ya da `Xxx.styles.<paket>`). Bir değer
   bir satırı çizen yardımcı fonksiyondan geliyorsa (designer "All N from this line" der), hangi pakete ait olduğu
   sayfanın başındaki nesnelerden bulunur.

## Güncel tutmak

Bu klasör ara sıra kullanılır: taslaklar **her bileşen değişikliğinde güncellenmez**. Bir taslak kullanılmadan önce
(ya da istenince) kopya değerleri bileşenden tazelenir.

## Taslaklar

| Dosya | Bileşen | İçinde |
|---|---|---|
| `progress-bar.htm` | `comp/progress-bar.js` (ProgressBar) | classic, modern, ozden; 14 durum |
| `smart-button.htm` | `comp/smart-button.js` (SmartButton) | ozdenType1–4, classic; dört içerik, hover, basılı, odak, kapalı, bekliyor (saat, noktalar), "Sure?" balonu, "Sure?" yazılı düğme |
| `smart-button-colors.htm` | `comp/smart-button.js` (SmartButton) | durumların renkleri (2026-10-31; seçilenler bileşende: `SmartButton.styles.primary` / `danger` / `warning` / `success` / `info`): silme, ana işlem, uyarı, başarı, vazgeç, bilgi; her satırda düzenlenecek SEÇİLEN düğme (normal, hover, basılı, kapalı) ve depoda bugün kullanılan aday renkler (nereden geldikleriyle) |
| `smart-button-dark.htm` | `comp/smart-button.js` (SmartButton) | `ozdenType1Dark` – `ozdenType4Dark` (2026-10-31; bileşende `SmartButton.styles`, `SmartButton.createDarkPackage`); smart-button.htm'nin bütün durumları, iki koyu zeminde (#1A1A19 kart, #000 sayfa) |
| `smart-button2-dark-tones.htm` | `comp/smart-button2.js` (SmartButton 2) | koyu sayfanın tone'ları (2026-11-04; SEÇİLENLER aynı gün kullanıcının onayıyla bileşende: `SmartButton.tones.cyanDark` ... `blueDark`): her renk için düzenlenecek SEÇİLEN düğme (normal, hover, basılı, kapalı) ve dört aday (rengin koyu kartın üstünde %35'i ve %55'i, koyu uygulamaların rengi, açık tone; yazılarının kontrastıyla); `ozdenType1Dark` kalıbı: açık kalıbın sayıları beyazla (kenar White(0.35), 3 px alt çizgi White(0.25)) |
| `ozden-design-system.htm` | (bileşen değil: ozden stili bir bütün olarak) | 2026-11-01: renkler (nötr, durum, vurgu, koyu), yazı ölçüleri, köşe / kenar / gölge / boşluk, SmartButton ozdenType1-4 ve durum renkleri (hover, basılı, odak, kapalı, bekliyor, ask), InputB / SearchInput / SelectBox ozden, CheckBox / RadioButton (classic), pill Tabs, ProgressBar ozden, saat, Tooltip, ask balonu, Notice, Dialog ozden, ActionButton ozden, ItemList classic, ozdenDark parçaları; değerler sayfanın başında (`COLORS`, `TYPE_SCALE`, `BUTTON`...), bileşenlerin ozden paketlerinden kopya |

## Yeni bir taslak

Yapay zekaya "X'in taslak tasarımını yap" demek yeter. Örnek olarak `smart-button.htm`'ye bakılır: başta değerler ve
durumlar, `start()` içinde ızgara, her hücreyi çizen kısa fonksiyonlar.
