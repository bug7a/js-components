# basic.js ile kod yazma kuralları

basic.js ile yazılan kod **düz yazı gibi okunmalı**: açıklamaya ihtiyaç duymadan, yukarıdan aşağı okununca ne yaptığı anlaşılmalı. Onunla kod yazmak keyifli olmalı. (Bugra, 2026-10-23)

Bu kurallar `comp-m*`, sayfalar, şablonlar ve projeler (oyun, designer...) için geçerli. Bir kural doğrulukla ya da hızla çatışırsa doğruluk kazanır, ama nedeni bir `// WHY:` satırıyla yazılır (bkz. "Denge").

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

- Kod NE yaptığını zaten söyler. Yorum, koddan anlaşılmayanı yazar: `// WHY: ...`.
- Bir kod parçası açıklama istiyorsa, önce sadeleştirilir ya da adı olan bir fonksiyona taşınır; yorum son çaredir.
- Tarih, kişi ve olay hikâyesi kod yorumuna değil, gerekiyorsa `docs/` ya da commit mesajına.
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
5. Yorumlarım NEDEN'i mi anlatıyor?
