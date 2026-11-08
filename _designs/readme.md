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
| `item-list.htm` | `comp/item-list.js` (ItemList) | yeni `light` / `dark` paketleri (2026-11-08): her temada bütün liste kendi sayfasının zemininde (beyaz, #141414): 5 satır (ikon, başlık, açıklama, işaret dairesi), biri seçili (Strawberry: kendi grisi, dolu işaret), biri fare altında (Apple: gri), ötekiler normal; iki temanın çizim satırları ayrıdır (designer'ın "All N from this line"ı bir temanın içinde kalır, "This object only" tek satırı değiştirir); başlangıç değerleri kitin açık / koyu listelerinden (SelectBox ve ContextMenu light / dark, SearchInput classic); öteki durumlar (odak, kapalı, bölüm, boş liste) bu görünüm oturduktan sonra |
| `item-list-modern.htm` | `comp/item-list.js` (ItemList) | `modern` paketi (2026-11-04): bütün liste (arama kutusu, bölümler, çoklu seçim, kaydırma çubuğu) ve grid; satır ve kutucuk (tile) için 16 durum: normal, seçim yok, yalnız başlık, uzun yazı, hover, basılı, klavye odağı, seçili, seçili + odak, kapalı, kapalı + seçili, bölüm, boş, sonuç yok, arama kutusu (boş / yazılı) |
| `item-list-dark.htm` | `comp/item-list.js` (ItemList) | `dark` paketi (2026-11-04): item-list-modern.htm'nin aynısı, #141414 zeminde |
| `progress-bar.htm` | `comp/progress-bar.js` (ProgressBar) | light (eski adı classic), önerilen dark, modern, ozden; 15 durum (başlık ve değer, sağda değer, değersiz, boş, dolu, iki parça, çizgiler, sınırlar, sınır yazısı, başarı, hata, belirsiz, başka ana renk, koyu ray). 2026-11-08: her paket kendi sayfasının renginde bir kartta (satırlar aynı yükseklikte), `classic` sütunu `light` oldu, `dark` önerisi eklendi (bileşende `ozdenDark` var, `dark` yok: ozdenDark'ın rayı #2A2A29 / White(0.18), açık bir çubuk #E6E6E4, üstünde koyu çizgiler, sınır çizgisi #FF8A7A, beyaz yazılar) |
| `smart-button.htm` | `comp/smart-button.js` (SmartButton) | ozden–4, classic; dört içerik, hover, basılı, odak, kapalı, bekliyor (saat, noktalar), "Sure?" balonu, "Sure?" yazılı düğme |
| `smart-button-colors.htm` | `comp/smart-button.js` (SmartButton) | durumların renkleri (2026-10-31; seçilenler bileşende: v26.11'den beri `SmartButton.tones.cyan` / `orange` / `yellow` / `green` / `blue`): silme, ana işlem, uyarı, başarı, vazgeç, bilgi; her satırda düzenlenecek SEÇİLEN düğme (normal, hover, basılı, kapalı) ve depoda bugün kullanılan aday renkler (nereden geldikleriyle) |
| `smart-button-dark.htm` | `comp/smart-button.js` (SmartButton) | `ozdenDark` – `ozden4Dark` (2026-10-31; bileşende `SmartButton.styles`, `SmartButton.createDarkTemplate`); smart-button.htm'nin bütün durumları, iki koyu zeminde (#1A1A19 kart, #000 sayfa) |
| `smart-button2-dark-tones.htm` | `comp/smart-button.js` (SmartButton v26.11; taslak yapılırken adı `smart-button2.js`) | koyu sayfanın tone'ları (2026-11-04; SEÇİLENLER aynı gün kullanıcının onayıyla bileşende: `SmartButton.tones.cyanDark` ... `blueDark`): her renk için düzenlenecek SEÇİLEN düğme (normal, hover, basılı, kapalı) ve dört aday (rengin koyu kartın üstünde %35'i ve %55'i, koyu uygulamaların rengi, açık tone; yazılarının kontrastıyla); `ozdenDark` kalıbı: açık kalıbın sayıları beyazla (kenar White(0.35), 2 px alt çizgi White(0.2)) |
| `ozden-design-system.htm` | (bileşen değil: ozden stili bir bütün olarak) | 2026-11-01: renkler (nötr, durum, vurgu, koyu), yazı ölçüleri, köşe / kenar / gölge / boşluk, SmartButton ozden ... ozden4 ve durum renkleri (hover, basılı, odak, kapalı, bekliyor, ask), TextField / SearchInput / SelectBox ozden, CheckBox / RadioButton (classic), pill Tabs, ProgressBar ozden, saat, Tooltip, ask balonu, Notice, Dialog ozden, ActionButton ozden, ItemList ozden, ozdenDark parçaları; değerler sayfanın başında (`COLORS`, `TYPE_SCALE`, `BUTTON`...), bileşenlerin ozden paketlerinden kopya |
| `minimal-theme.htm` | (bileşen değil: yeni bir tema, Python arayüzü için) | 2026-11-07: `minimal` ve `minimalDark` paketlerinin tasarımı (bileşenler bu paketleri aldı; değerler tasarımın kendisi: `MINIMAL`, `MINIMAL_DARK`, `SIZE` ve bileşen başına bir nesne). Küçük (28 px kontrol, 13 px yazı), dolgu ve gölge yok: bileşen pencerenin zeminini alır, her durum bir çizgidir. Bileşen başına bir kart, satırlarda durumlar, sütunlarda iki paket: Tokens, SmartButton (line, primary, danger, quiet, ikon; normal, hover, basılı, odak, kapalı, bekliyor), TextField / PasswordField / TextAreaField, SearchInput, SelectBox (açık liste), CheckBox / RadioButton / Toggle, Slider / RangeSlider, ProgressBar, ItemList (10 durum, boş liste, bütün liste), Tabs, Stepper, SmartTable, TreeView, MenuBar / ToolBar / StatusBar, Tooltip / ContextMenu / Dialog / Toast; aynı gün eklenenler: DatePicker (açık takvim), TimePicker (açık sütunlar), ColorPicker (açık palet), FilePicker (bırakma alanı, dosya satırları), Accordion, SliderField, StepBar (klavye halkası dairede), TagInput (öneriler), Splitter, SidePanel / LoadingScreen / GraphBox |
| `toggle.htm` | `comp/toggle.js` (Toggle) | `light` / `dark` (2026-11-08): light bugünkü varsayılan görünüm (`modern` paketi; Toggle'da `light` adlı paket yok), dark `Toggle.styles.dark`; 13 durum: kapalı, açık, fare üstünde (ikisi), klavye odağı, pasif (ikisi), rayda işaret (açık / kapalı), topuzda işaret (açık / kapalı), ON / OFF yazısı, basılı (animated). Bulgu: dark paketinin kendi `markStyle`'ı yok, kapalı işaret siyah rayda siyah; topuzdaki işaret varsayılan renklerle beyaz topuzda beyaz |
| `search-input.htm` | `comp/search-input.js` (SearchInput) | `light` ve önerilen `dark` (2026-11-08; bileşende `dark` yok, `ozdenDark` ozden'in koyusu): boş, yazılı (temizle ikonu), yazarken (2 px kenar), fare üstünde animated, yazarken animated, uzun yazı (temizle ikonunun altında solar); dark önerisi: #232322, White(0.12) kenar, beyaz çizgi ikon, aynı gri temizle düğmesi |
| `slider-field.htm` | `comp/slider-field.js` (SliderField) | `light` (varsayılan) ve `dark` (2026-11-08): normal, birimli (adım 5), ondalıklı (adım 0.1), fare üstünde, sürüklerken, klavye odağı, değer yazarken, en küçükte (tutamak etiketin altında: gizli), en büyükte, pasif; noktalar ve tutamak bileşenin ölçüleriyle yerleşir |

## Yeni bir taslak

Yapay zekaya "X'in taslak tasarımını yap" demek yeter. Örnek olarak `smart-button.htm`'ye bakılır: başta değerler ve
durumlar, `start()` içinde ızgara, her hücreyi çizen kısa fonksiyonlar.
