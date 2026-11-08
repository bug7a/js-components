# basic.js ile kod yazma kuralları

basic.js ile yazılan kod **düz yazı gibi okunmalı**: açıklamaya ihtiyaç duymadan, yukarıdan aşağı okununca ne yaptığı anlaşılmalı. Onunla kod yazmak keyifli olmalı. (Bugra, 2026-10-23)

Bu kurallar `comp/`, sayfalar, şablonlar ve projeler (oyun, designer...) için geçerli. Bir kural doğrulukla ya da hızla çatışırsa doğruluk kazanır, ama nedeni bir `// WHY:` satırıyla yazılır (bkz. "Denge").

---

## 1. Adlar ne yaptığını söyler

- Fonksiyon bir fiil: `setSelected`, `openMenu`, `refreshRows`, `showMessage`. Değişken bir şey: `selectedRow`, `menuWidth`.
- Durum soruları `is` / `has` ile: `isOpen`, `hasBadge`, `isVertical`.
- Geri alma fonksiyonları ne yaptığını söyler: `cancelClose`, `stopAutoPlay`, `removeKeyEvent`.
- Kısaltma yok (`clr`, `tmp`, `cnt`, `idx`). Evin alışkanlığı olan önekler kalır: `lbl`, `btn`, `ico`, `box`, `grp`.
- Tek harf yalnızca kısa bir döngüde (`i`) ya da çok kısa bir geri çağrıda.

## 2. basic.js'in kendi dili kullanılır

- Özellikler props nesnesinde: `Label({ text: "Save", fontSize: 14, bold: 1 })`. Ardından gelen beş satır `elem.style` yerine.
- basic.js'te karşılığı olan şey `elem.style` ile yazılmaz: `css`, `cursor`, `shrink`, `grow`, `ellipsis`, `lineHeight`, `boxShadow`, `zIndex`, `plainText`, `role`, `aria`, `tabIndex`, `show()` / `hide()`.
- Global kayıtlar kutunun üzerinden: `box.listenTo(window, ...)`, `box.onPageResize(...)`, `box.after(...)`, `box.every(...)`, `box.own(menu)`. Böylece `remove()` yazmak gerekmez.
- Sonradan nesne eklemek `createIn(box, function () { ... })` ile.
- "Açık mı?" sorusu `basic.isOn(value)` ile; `(v == 1 || v === true)` yazılmaz.
- Kullanıcıdan / sunucudan gelen metin `plainText` ile (Label.text HTML'dir).

## 3. Bir fonksiyon bir iş yapar

- Kısa tutulur; uzayınca adı olan küçük parçalara bölünür (`buildRow`, `paintRow`, `moveIndicator`).
- Önce koruma, sonra iş: erken dönüş (`if (box.enabled != 1) return;`), iç içe `if` yerine.
- Bir satır bir düşünce. Uzun tek satırlar (birden çok `;` ya da iç içe ternary) bölünür.
- Ternary yalnızca basit bir seçim için: `color = isOn ? onColor : offColor`. İç içe ternary yok.

## 4. Yapı her dosyada aynı

- Bölüm başlıkları korunur: `// *** PRIVATE VARIABLES:`, `// *** PRIVATE FUNCTIONS:`, `// *** PUBLIC FUNCTIONS:`, `// *** OBJECT VIEW:`, `// *** OBJECT INIT CODE:`, `// *** STYLE PACKAGES:`.
- Görünüm nesneleri `// BOX:`, `// GROUP:`, `// LABEL:`, `// ICON:` notlarıyla.
- Grup içindeki nesneler bir girinti içeride yazılır, böylece ağaç kodun şeklinden okunur:
  ```js
  box.header = HGroup({ hug: 1, gap: 8, align: "left center" });
      box.icon = Icon({ width: 24, height: 24 });
      box.lblTitle = Label({ text: "Orders", bold: 1 });
  endGroup();
  ```
- Bileşen bir değeri sonradan değiştirince bunu `setX()` ile yapar; setter yalnızca gereken çizim fonksiyonunu çağırır, şablondaki gibi. Çizim fonksiyonlarının adları işlerini söyler:
  - `createItems()`: veriden yapılan nesneler baştan yapılır; tek bir nesne `createItem()` ile, böylece `addItem()` ötekileri yeniden yapmaz.
  - `applyContent()`: metinler, ikon, rozet.
  - `paint()`: durumun görünüşü (hover, seçili, pasif). Ölçüm yapmaz.
  - `refreshLayout()`: boyuta bağlı olanlar (ölçülür; `onResize` / `onPageResize` çağırır, `paint()` değil).
  - `drawAll()`: hepsi (ilk çizim ve `box.refresh()`).
  - Bir değişiklik görünüşten fazlasını değiştiriyorsa (Tabs: gösterge, panel, Tab sırası) hepsini tek bir fonksiyon gösterir (`showActiveTab()`), böylece hiçbir setter bir parçayı unutamaz.
  - Bir özelliği (Ör: `tabIndex`) yalnızca bir fonksiyon yazar.

## 5. Yorumlar NEDEN'i anlatır

- Kod NE yaptığını zaten söyler. Bir kod yorum gerektiriyorsa yorum şunu yazar: neden, hangi sorunu çözmek için yazıldı (`// WHY: ...`).
- Bir kod parçası açıklama istiyorsa, önce sadeleştirilir ya da adı olan bir fonksiyona taşınır; yorum son çaredir.
- Tarih, kişi ve olay hikâyesi kod yorumuna yazılmaz (`(the user, 2026-11-05)`, `it was blue`, `the old sample`): projenin dokümanına ve commit mesajına yazılır. Eski bir tarihli yorum örnek alınmaz; dokunuldukça temizlenir. Bir yönlendirme notu (`NEW PROJECTS: use ...`) kalır, ama tarihsiz. Dosyanın başındaki ev başlığı (`Started Date`, `Developer`) bu kuralın dışındadır. (Bugra, 2026-11-06)
- Kullanım örneği (`// USAGE: tabs.setValue("open")`) setter'ın hemen altında, bir satır.

## 6. Sayılar ve renkler adla

- Sihirli sayı yok: `const ROW_HEIGHT = 28;` ya da `style.row.height`. Renkler stil paketinde.
- Süreler de adla: `box.after(box.fadeDuration * 1000, ...)`, `after(170, ...)` değil.

## 7. Tekrar ve soyutlama

- Aynı 3+ satır üç yerde tekrar ediyorsa küçük bir yardımcı olur (`makeIconButton(svg, label)`).
- İki tekrar için soyutlama yapılmaz; okunurluk soyutlamadan önce gelir.
- Yardımcının adı bir basic.js fonksiyonuyla ya da global bir adla çakışmaz (`MyPage.createButton`, `const createButton` değil).

## 8. Akıllıca değil, açık

- Kısa ama anlaşılmaz bir hile yerine iki satır açık kod.
- Okuyanı şaşırtacak bir yol (bir reflow zorlaması, bir tarayıcı açığı) gerekiyorsa tek satırlık `// WHY:` ile.

## 9. Bileşen parametrelerinin adları

Bir bileşenin parametreleri kitin geri kalanındaki adları taşır: bir sayfayı yazan, bir bileşenden ötekine geçerken ad aramaz. Yeni bir bileşen ve yeni bir parametre bu tabloya uyar. (Bugra, 2026-11-08)

| Ne | Ad | Böyle değil |
|---|---|---|
| Bir denetimin değeri | `value`; bir sayı listesi `values`; işaret kutusu, radyo düğmesi `checked`. Aralığı: `minValue`, `maxValue`, `step` | `inputValue`, `currentValue` |
| Gösterilen bir metin | `...Text`: `titleText`, `labelText`, `messageText`, `descriptionText`, `emptyText` | `title`, `message`, `text` |
| Bir alanın ipucu | `placeholder` (HTML'in adı) | `placeholderText` |
| Ekran okuyucunun okuduğu ad | `ariaLabel` | bir iframe'in `title`'ı |
| Açık / kapalı (0 / 1) | yalın sıfat: `enabled`, `required`, `multiple`, `animated`, `selected`, `checked` | `isRequired`, `isEnabled`, tersi olan `disabled` |
| Bir parçanın olması | `show...`: `showSearch`, `showTooltip`, `showClearIcon`, `showUnit`, `showDescription` | `create...`, `is...Enabled`, `hover` |
| Kendi görünümün | `create...View: function (item, row, self)` | |
| Bir resim, bir ikon | `...IconFile` (tek ikonu olan: `iconFile`); setter'ı `set...Icon()` | `...Icon` |
| Uzunluk sınırı | `maxLength`, `minLength` (HTML'in adları, aynı anlamla: en çok, en az) | `maxChar`, `minChar` |
| Kalın yazı | `...Bold: 1` (`titleBold`, `labelBold`) | `labelBoldFont` |
| Bir durumun rengi (düz parametrelerde) | durum önde: `hover...`, `focus...` (yazarken, klavyeyle), `pressed...`, `selected...` (seçilmiş bir öğe) | yazarken için `selected...` |
| Değer değişti | `onChange(self)`: oluşturulurken, `setValue()` ile ve `silent` ile çağrılmaz | `onEdit`, `onValueChange` |
| Bir olay | `onXxx(self, ...)`: ilk argüman `self` | |
| Görünüş | `styleName` + `style` (`Comp.styles`). Renkleri `"auto"` ile sistemi izleyenler (GraphBox, Toast): `theme` (`basic.resolveTheme`) | |
| Sonradan değiştirmek | `setX()`, parametrenin adıyla: `setValue`, `setRequired`, `setMaxLength` | `setInputValue` |

- Bir parametre bir basic.js setter'ının adını almaz (`text`, `color`, `html`, `title`, `visible`, `zoom`...: CLAUDE.md). Kutunun kendisi alan olan bir bileşen (SearchInput) `color`, `border`, `round`'u bilerek kutuya verir.

**Bir ad değişince:**

- Parametre, olay ya da bileşen yeni adını aynı işte her yerde alır: `comp/`, örnekler, şablonlar, sayfalar. Eski ad tutulmaz.
- Bileşenin kendi kopyasını yükleyen bir sayfa (`03-webpages` sitelerinin `comp/*.min.js`'i, `_sources.txt`) o kopyanın adlarıyla kalır; kopya yenilenince (kullanıcı isteyince) yeni adları alır.
- Bir olayın argümanları da değişirse (`onEdit(input)` → `onChange(self, input)`) onu kullanan her fonksiyon yeni biçime çevrilir.
- Bir verinin anahtarı (bir sunucuya giden JSON) değişirse onu okuyan da aynı işte değişir (Form'un JSON'u ve PHP mail servisi).
- `test/components-test.htm` her bileşenin varsayılanlarını bu tabloya göre denetler: "Böyle değil" sütunundaki adlar, `is...`, `...Path`, bir resim tutan `...Icon`, sayı olan bir `create...` ve ilk argümanı `self` olmayan bir `onX` hata verir.
- Adı değişen bir sayfa: `node test/compare-pages.js eski.htm=yeni.htm`. 2026-11-08'deki geçici köprü (`basic.keepOldNames`) ve hikâyesi: `context/repo-map.md`, "Parameter names".

---

## Denge (kuralların esnediği yerler)

- **Doğruluk ve hız:** bir tarayıcı davranışı (pointer-events, reflow, flex kırpması) özel bir kod gerektirebilir. Kod yazılır, nedeni bir `WHY:` satırıyla.
- **Araçlar** (designer, test sayfaları, betikler): aynı kurallar, ama iç ayrıntıları biraz daha yoğun olabilir; yine de uzun tek satırlar bölünür.
- **Eski kod:** toplu değil, dokunuldukça bu kurallara getirilir. Davranış değiştiren bir "güzelleştirme" ayrı bir iş olarak yapılır ve test edilir.
- **Kurallar bir şeyi gerçekten zorlaştırırsa** bunu Bugra'ya söylerim, kuralı sessizce çiğnemem.

## Kısa kontrol (kodu bitirmeden önce)

1. Bir satırı okuyunca ne yaptığını anlıyor muyum, yoksa yorum mu arıyorum?
2. `elem.style` yazdığım yerin basic.js'te bir karşılığı var mı?
3. Uzun bir satır, iç içe bir ternary ya da adsız bir sayı kaldı mı?
4. Global bir şeyi kutunun üzerinden mi kaydettim (`listenTo`, `after`, `own`)?
5. Yorumlarım NEDEN'i mi anlatıyor (tarih, kişi ve hikâyeyi değil)?
6. Yeni bir parametrenin adı 9. bölümün tablosuna uyuyor mu?
