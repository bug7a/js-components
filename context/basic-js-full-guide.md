# basic.js Kapsamlı Geliştirme ve Komponent Rehberi (AI için)

## 🚀 Giriş ve Amaç
Bu rehber, basic.js kütüphanesi ile AI'ın modüler, tekrar kullanılabilir ve profesyonel UI komponentleri geliştirebilmesi için hazırlanmıştır. Tüm temel kurallar, örnekler, metodlar ve en iyi uygulamalar tek bir dökümanda sunulmuştur.

---

## 🎯 Temel Prensipler ve Teknoloji Standartları
- Sadece JavaScript ve basic.js kullanılır
- Doğrudan HTML/CSS yazılmaz, tüm arayüzler basic.js UI bileşenleriyle tanımlanır
- CSS dosyaları yazılmaz, stiller parametrelerle verilir
- Doğrudan DOM manipülasyonu yapılmaz, basic.js API'leri kullanılır

### Proje Yapısı
```
project/
├── basic/                    # basic.js kütüphanesi
├── assets/                   # Görseller ve medya
├── components/               # UI bileşenleri
├── js/                       # Oyun mantığı ve ana modüller
└── index.htm                 # Ana dosya
```

---

## 📋 Temel HTML Şablonu ve Başlatma
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Proje Adı</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" type="text/css" href="basic/basic.min.css">
    <script src="basic/basic.min.js" type="text/javascript" charset="utf-8"></script>
    <script>
    window.onload = function() {
        page.color = "whitesmoke";
        // UI kodları buraya
    }
    </script>
</head>
<body>
</body>
</html>
```

---

## 🧩 Temel UI Bileşenleri ve Parametreleri
### Label
```javascript
Label({
    text: "Metin içeriği",
    color: "white",
    textColor: "black",
    fontSize: 16,
    padding: [12, 4],
    round: 4,
    border: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    clickable: 1
});
```
### Button
```javascript
Button({
    text: "Tıkla",
    color: "cadetblue",
    minimal: 1,
    padding: [12, 6],
    round: 4
}).on("click", function(self, event) {
    // Tıklama işlemi
});
```
### Input
```javascript
Input({
    text: "Varsayılan değer",
    width: 200,
    height: 40,
    fontSize: 16,
    color: "white",
    textColor: "black",
    border: 1,
    borderColor: "rgba(0, 0, 0, 0.2)"
});
```
### Box
```javascript
Box(0, 0, 200, 100, {
    color: "white",
    border: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    round: 4
});
```
### Icon
```javascript
Icon({
    width: 32,
    color: "transparent"
}).load("path/to/icon.png");
```

---

## 🏗️ Komponent Geliştirme Adımları ve Template Kullanımı
### Template
```javascript
/* Bismillah */
/* ComponentName - v25.07 */
"use strict";
const ComponentNameDefaults = { key: "0", onClick: function() {} };
const ComponentName = function(params = {}) {
    mergeIntoIfMissing(params, ComponentNameDefaults);
    let box = startObject(params);
    // ...component logic...
    return endObject(box);
};
```
### Adımlar
1. Varsayılan değerleri tanımla
2. Parametreleri birleştir (mergeIntoIfMissing veya startObject)
3. UI nesnelerini oluştur (Box, Label, Icon, vb.)
4. Event ve fonksiyonları ekle
5. endObject(box) ile döndür

---

## 🎨 Layout ve Gruplama
### AutoLayout
```javascript
AutoLayout({ flow: "vertical", padding: [20, 15] });
// UI elemanları
endAutoLayout();
```
### HGroup/VGroup
```javascript
HGroup({ gap: 10, align: "center" });
// UI elemanları
endGroup();
```
### startBox/endBox
```javascript
startBox({ width: 200, color: "white" });
// UI elemanları
endBox();
```

---

## 🎯 Event Handling
```javascript
box.on("click", function(self, event) { box.onClick(box); });
box.on("mouseover", function(self, event) { box.setState("mouseover"); });
box.on("mouseout", function(self, event) { box.setState("normal"); });
```

---

## 📱 Responsive Tasarım
```javascript
page.onResize(function() {
    // Responsive davranış kodları
});
```

---

## 🔧 Utility Fonksiyonları
- random(1, 100)
- num("123.456", "float")
- str(123)
- isMobile()
- go("https://example.com")
- twoDigitFormat(5)
- storage.save/load/remove
- clock.hour/minute/second/milisecond
- date.year/monthNumber/monthName/dayNumber/dayName/today/now

---

## 🎵 Sound ve Medya
```javascript
const sound = new BSound();
sound.load("audio.mp3");
sound.play();
sound.pause();
sound.stop();
```

---

## 🎨 Motion ve Animasyon
```javascript
box.setMotion("all 0.3s");
box.withMotion(function(self) { self.width = 300; self.color = "red"; });
box.dontMotion();
box.canMotionNow();
```

---

## 📋 Position ve Konumlandırma
- Box, Label, Button, Input, Icon: Varsayılan position: absolute
- Gruplama nesneleri içinde: position: relative
- Zıt konumlar (left/right, top/bottom) aynı anda verilmez

---

## 🏆 En İyi Uygulamalar
- Her komponentin başında açıklama ve metadata bulunsun
- Sadece basic.js fonksiyonları ile UI oluşturulmalı
- Parametreler ve varsayılanlar net şekilde ayrılmalı
- Event-driven mimari tercih edilmeli
- Gruplama nesneleri mutlaka end ile kapatılmalı
- Zıt konumlandırma aynı anda verilmemeli
- İç içe gruplama ve layout kurallarına uyulmalı

---

## ⚠️ Sık Yapılan Hatalar
- startBox/endBox veya HGroup/VGroup/AutoLayout kapatılmadan bırakmak
- Parametreleri gereksiz tekrar aktarmak
- Zıt konumlandırma değerlerini aynı anda vermek
- FlexBox kullanmak (basic.js'de önerilmez)

---

## 🤖 AI için Ekstra Notlar
- Her komponentin template'ini ve örneklerini referans alarak yeni komponentler üret
- Kodun başında ve fonksiyonlarda açıklama ekle
- Fonksiyon ve event isimlerini tutarlı kullan
- Geliştirilen komponentler, modüler ve tekrar kullanılabilir olmalı
- Gerekirse örnek komponentlerden parça kodlar alıp yeni komponentlere adapte et

---

## 📚 Sık Kullanılan Kod Örnekleri
### Basit Bileşen
```javascript
const SimpleComponent = function(params = {}) {
    let box = startObject({});
    return endObject(box);
};
```
### Input Bileşeni
```javascript
const InputComponent = function(params = {}) {
    let box = startObject({});
    return endObject(box);
};
```
### Button Bileşeni
```javascript
const ButtonComponent = function(params = {}) {
    let box = startObject({});
    return endObject(box);
};
```

---

## 🧑‍💻 Örnek Komponentler
### InputB
- Gelişmiş input alanı, validasyon ve uyarı özellikleriyle.
```javascript
const InputBDefaults = { /* ... */ };
const InputB = function(params = {}) {
    const box = startObject(InputBDefaults, params);
    // ...input logic...
    return endObject(box);
};
```
### LeftMenu
- Genişleyebilen, dinamik sidebar menü.
```javascript
const LeftMenuDefaults = { /* ... */ };
const LeftMenu = function(params = {}) {
    mergeIntoIfMissing(params, LeftMenuDefaults);
    let box = startObject(params);
    // ...menu logic...
    return endObject(box);
};
```
### TinySelect
- Küçük, sade dropdown/select komponenti.
```javascript
const TinySelectDefaults = { /* ... */ };
const TinySelect = function(params = {}) {
    const box = startFlexBox();
    box.props(TinySelectDefaults, params);
    // ...select logic...
    return box;
};
```
### BadgetV2
- Bildirim, sayaç ve dot tipi badge komponenti.
```javascript
const BadgeDefaults = { /* ... */ };
const Badge = function(params = {}) {
    mergeIntoIfMissing(params, BadgeDefaults);
    let box = startObject(params);
    // ...badge logic...
    return endObject(box);
};
```
### TextTabs
- Sekmeli metin navigasyonu.
```javascript
const TextTabsDefaults = { /* ... */ };
const TextTabs = function(params = {}) {
    mergeIntoIfMissing(params, TextTabsDefaults);
    let box = startObject(params);
    // ...tabs logic...
    return endObject(box);
};
```

---

## 🛠️ Tüm basic.js Fonksiyonları ve Metodları (Kısa Açıklama)
- Label, Input, Icon, Box, Button
- startObject(defaults, params), endObject(box)
- startBox, endBox, startFlexBox, endFlexBox, HGroup, VGroup, AutoLayout, endGroup, endAutoLayout
- Black(percent), White(percent)
- makeBasicObject(obj)
- setDefaultContainerBox(box), restoreDefaultContainerBox(), getDefaultContainerBox()
- mergeIntoIfMissing(target, source), mergeInto(target, source), mergeObject(target, source)
- setLoopTimer(ms), loop()
- println(msg, type)
- random, num, str, isMobile, go, twoDigitFormat
- storage.save/load/remove
- clock, date
- Sound: BSound
- Motion: setMotion, withMotion, dontMotion, canMotionNow
- Event: on, off, onResize, remove_onResize
- Container: add(obj), fit, autoFit, zoom

---

Bu rehber, basic.js ile AI destekli komponent ve uygulama geliştirmek için tam referans olarak kullanılabilir. Tüm yeni komponentlerde bu standartları uygula ve örnekleri referans al.
