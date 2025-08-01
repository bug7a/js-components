# basic.js Hızlı Referans Rehberi

## 🚀 Hızlı Başlangıç

### Temel HTML Şablonu
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Proje Adı</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- LIBRARY FILES -->
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

## 🧩 Temel UI Bileşenleri

### Label (Metin)
```javascript
Label({
    text: "Metin içeriği",
    color: "white",
    textColor: "black",
    fontSize: 16,
    padding: [12, 4],
    round: 4
});
```

**Label Özellikleri:**
- `text` - Metin içeriği
- `color` - Arka plan rengi
- `textColor` - Metin rengi
- `fontSize` - Font boyutu
- `textAlign` - Metin hizalama (left, center, right)
- `padding` - İç boşluk
- `clickable` - Tıklanabilir mi?

### Button (Buton)
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

**Button Özellikleri:**
- `text` - Buton metni
- `value` - Buton değeri
- `color` - Arka plan rengi
- `textColor` - Metin rengi
- `fontSize` - Font boyutu
- `enabled` - Aktif mi?
- `minimal` - Minimal stil
- `padding` - İç boşluk
- `border` - Kenarlık kalınlığı
- `borderColor` - Kenarlık rengi
- `round` - Köşe yuvarlaklığı

### Input (Giriş Kutusu)
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

**Input Özellikleri:**
- `text` - Varsayılan değer
- `title` - Başlık metni
- `color` - Arka plan rengi
- `textColor` - Metin rengi
- `fontSize` - Font boyutu
- `textAlign` - Metin hizalama
- `enabled` - Aktif mi?
- `minimal` - Minimal stil
- `border` - Kenarlık kalınlığı
- `borderColor` - Kenarlık rengi
- `round` - Köşe yuvarlaklığı

### Box (Kutu)
```javascript
Box(0, 0, 200, 100, {
    color: "white",
    border: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    round: 4
});
```

**Box Özellikleri:**
- `text` - İçerik metni
- `color` - Arka plan rengi
- `border` - Kenarlık kalınlığı
- `borderColor` - Kenarlık rengi
- `round` - Köşe yuvarlaklığı
- `clipContent` - İçeriği kırp
- `scrollX` - Yatay kaydırma
- `scrollY` - Dikey kaydırma
- `add(obj)` - İçine nesne ekle

### Icon (İkon)
```javascript
Icon({
    width: 32,
    height: 32,
    color: "transparent"
}).load("path/to/icon.png");
```

**Icon Özellikleri:**
- `color` - Arka plan rengi
- `border` - Kenarlık kalınlığı
- `borderColor` - Kenarlık rengi
- `round` - Köşe yuvarlaklığı
- `autoSize` - Otomatik boyutlandırma
- `space` - İç boşluk yüzdesi
- `naturalWidth` - Orijinal genişlik
- `naturalHeight` - Orijinal yükseklik
- `load(path)` - Resim yükle

## 🔧 Bileşen Geliştirme Şablonu

### Temel Bileşen Yapısı
```javascript
/* Bismillah */

/*
ComponentName - v25.07
Started Date: June 2024
Developer: Bugra Ozden
*/

"use strict";

// Default values:
const ComponentNameDefaults = {
    key: "0",
    width: 90,
    height: 50,
    color: "white",
    onClick: function() {},
};

const ComponentName = function(params = {}) {
    // Merge params:
    mergeIntoIfMissing(params, ComponentNameDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let privateVar = "";

    // *** PUBLIC VARIABLES:
    box.publicVar = 1;

    // *** PRIVATE FUNCTIONS:
    const privateFunc = function() {};

    // *** PUBLIC FUNCTIONS:
    box.publicFunc = function() {};

    // *** OBJECT VIEW:
    // UI elemanları buraya

    // *** OBJECT INIT CODE:
    // Event handler'lar buraya

    return endObject(box);
};
```

## 🎨 Layout Kullanımı

### AutoLayout (Otomatik Düzen)
```javascript
AutoLayout({
    flow: "vertical", // "horizontal" veya "vertical"
    align: "center", // "top left", "bottom right", "center center"
    gap: 15,
    padding: [20, 15]
});
// UI elemanları buraya
// UI elemanları otomatik AutoLayout un içine eklenir. position: relative olarak ayarlanır.
// - Otomatik olarak verilen yönde (flow) dizilir.
endAutoLayout(); // ✅ MUTLAKA KAPATILMALI
```

### startBox/endBox
```javascript
startBox({
    width: 200,
    height: 100,
    color: "white"
});
// UI elemanları buraya
// UI elemanları otomatik Box ın içine eklenir. position: absolute olarak ayarlanır.
// - UI elemanının görünmesi için bir konum ayarlanmalıdır. left: 0, top: 0
endBox(); // ✅ MUTLAKA KAPATILMALI
```

## 🚨 ÖNEMLİ KURALLAR

### ✅ DOĞRU Kullanımlar
```javascript
// Box zaten bir taşıyıcıdır
let box = startObject(params);

// Parametreler zaten box'a aktarılmıştır
box.background = Box(0, 0, "100%", "100%", {
    color: box.backgroundColor,        // ✅ Doğru
    borderColor: box.borderColor      // ✅ Doğru
});

// Arka plan için ayrı box oluştur
box.background = Box(0, 0, "100%", "100%", {
    color: box.backgroundColor,
    border: box.borderBottom,
    borderColor: box.borderColor
});
```

### ❌ YANLIŞ Kullanımlar
```javascript
// ❌ Gereksiz startBox() endBox()
startBox({
    width: box.width,
    height: box.height,
    color: box.backgroundColor
});
endBox();

// ❌ Parametreleri tekrar aktarma
startBox({
    width: box.width,                     // ❌ Gereksiz
    height: box.height,                   // ❌ Gereksiz
    color: box.backgroundColor            // ❌ Gereksiz
});

// ❌ Kapatılmamış gruplar
HGroup({
    gap: 10,
    align: "center"
});
// endGroup() eksik!

// ❌ Zıt konumlar aynı anda
Box(0, 0, 100, 50, {
    left: 10,
    right: 20  // Çakışma!
});
```

## 📱 Responsive Tasarım

### Viewport Ayarları
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Responsive Layout
```javascript
// Bileşen içinde responsive davranış
box.setResponsiveLayout = function() {
    if (page.width < 550) {
        box.inputGroup.flow = "vertical";
    } else {
        box.inputGroup.flow = "horizontal";
    }
};

// Sayfa yeniden boyutlandığında çağır
page.onResize(function() {
    box.setResponsiveLayout();
});
```

## 🎯 Event Handling

### Temel Event'ler
```javascript
// Click event
box.on("click", function(self, event) {
    box.onClick(box);
});

// Mouse events
box.on("mouseover", function(self, event) {
    box.setState("mouseover");
});

box.on("mouseout", function(self, event) {
    box.setState("normal");
});
```

### Input Event'leri
```javascript
const inputElem = box.input.inputElement;

box.focusFunc = function () {
    box.background.color = box.selectedBackgroundColor;
    box.onFocus();
}
inputElem.addEventListener("focus", function(){ box.focusFunc() });

box.blurFunc = function () {
    box.background.color = box.backgroundColor;
    box.onBlur();
}
inputElem.addEventListener("blur", function(){ box.blurFunc() });
```

## 🔍 Debugging

### Console Kullanımı
```javascript
//console.time("ComponentName");
//console.timeEnd("ComponentName");

println("Debug: " + variable);
```

### Test Senaryoları
```javascript
const testComponent = function() {
    const testItem = ComponentName({
        text: "Test",
        width: 200
    });
    
    testItem.on("click", function() {
        println("Test başarılı!");
    });
};
```

## 📋 Position ve Konumlandırma

### Normal Nesneler (Varsayılan: position: absolute)
```javascript
Box(10, 20, 100, 50, {
    color: "white"
});
// Konum verilmesi gerekir: left: 10, top: 20
```

### Gruplama Nesneleri İçindeki Nesneler
```javascript
HGroup({
    gap: 10,
    align: "center"
});
// Bu nesneler otomatik olarak position: relative olur
Label({
    text: "Item 1",
    fontSize: 16
});
endGroup();
```

### Konumlandırma Kuralları
```javascript
// ✅ Doğru - Sadece left verilmiş
Box(10, 20, 100, 50, {
    left: 10,
    top: 20
});

// ✅ Doğru - Sadece right verilmiş
Box(0, 0, 100, 50, {
    right: 10,
    bottom: 20
});

// ❌ Yanlış - Zıt konumlar aynı anda
Box(0, 0, 100, 50, {
    left: 10,
    right: 20  // Çakışma!
});
```

## 🎨 İç İçe Gruplama

### Doğru İç İçe Gruplama
```javascript
// Ana grup
HGroup({
    gap: 20,
    width: "100%",
    height: "auto"
});

// Sol alt grup
VGroup({
    gap: 5,
    width: "auto",
    height: "auto"
});
Label({ text: "Left Item 1" });
Label({ text: "Left Item 2" });
endGroup(); // ✅ Alt grup kapatıldı

// Sağ alt grup
VGroup({
    gap: 5,
    width: "auto",
    height: "auto"
});
Label({ text: "Right Item 1" });
Label({ text: "Right Item 2" });
endGroup(); // ✅ Alt grup kapatıldı

endGroup(); // ✅ Ana grup kapatıldı
```

## 🚨 KAPATMA KURALLARI - ZORUNLU

### Mutlaka Kapatılması Gerekenler
- **HGroup** → `endGroup()`
- **VGroup** → `endGroup()`
- **AutoLayout** → `endAutoLayout()`
- **startBox** → `endBox()`

### Örnekler
```javascript
// HGroup
HGroup({ gap: 10, align: "center" });
// İçerik (boş olsa bile)
endGroup(); // ✅ ZORUNLU

// VGroup
VGroup({ gap: 10, align: "left top" });
// İçerik (boş olsa bile)
endGroup(); // ✅ ZORUNLU

// AutoLayout
AutoLayout({ flow: "vertical", align: "center" });
// İçerik (boş olsa bile)
endAutoLayout(); // ✅ ZORUNLU

// startBox
startBox({ width: 200, height: 100, color: "white" });
// İçerik (boş olsa bile)
endBox(); // ✅ ZORUNLU
```

## 📚 Sık Kullanılan Kod Örnekleri

### Basit Bileşen
```javascript
const SimpleComponent = function(params = {}) {
    let box = startObject({
        width: 200,
        height: 100,
        color: "white"
    }, params);

    box.title = Label({
        text: box.text || "Default Text",
        fontSize: 16,
        textColor: "#333"
    });

    return endObject(box);
};
```

### Input Bileşeni
```javascript
const InputComponent = function(params = {}) {
    let box = startObject({
        width: 300,
        height: 40,
        placeholder: "Enter text..."
    }, params);

    box.input = Input({
        text: box.placeholder,
        width: "100%",
        height: "100%",
        fontSize: 16,
        color: "transparent",
        textColor: "#333"
    });

    return endObject(box);
};
```

### Button Bileşeni
```javascript
const ButtonComponent = function(params = {}) {
    let box = startObject({
        width: 120,
        height: 40,
        text: "Click Me",
        color: "#007bff"
    }, params);

    box.button = Button({
        text: box.text,
        width: "100%",
        height: "100%",
        color: box.color,
        round: 4
    });

    return endObject(box);
};
```

## 🎵 Ses ve Medya

### Sound (Ses)
```javascript
const sound = new BSound();
sound.load("audio.mp3");
sound.play();
sound.pause();
sound.stop();
```

**Sound Özellikleri:**
- `time` - Toplam süre
- `timeLeft` - Kalan süre
- `currentTime` - Mevcut zaman
- `paused` - Duraklatılmış mı?
- `playing` - Çalıyor mu?
- `loop` - Tekrar etsin mi?
- `play()` - Çal
- `pause()` - Duraklat
- `stop()` - Durdur
- `onLoad(func)` - Yükleme olayı
- `load(path)` - Ses dosyası yükle

## 🎨 Motion ve Animasyon

### Motion Kontrolü
```javascript
// Hareket ayarla
box.setMotion("all 0.3s");
box.setMotion("left 1s, top 1s, width 1s");

// Hareket ile özellik değiştir
box.withMotion(function(self) {
    self.width = 300;
    self.color = "red";
});

// Hareketi duraklat
box.dontMotion();

// Hareketi devam ettir
box.canMotionNow();
```

**Motion Özellikleri:**
- `setMotion(string)` - Hareket ayarla
- `getMotion()` - Mevcut hareket
- `setMotionNow(string)` - Hemen hareket ayarla
- `withMotion(func)` - Hareket ile işlem yap
- `dontMotion()` - Hareketi duraklat
- `canMotionNow()` - Hareketi devam ettir

## 🎯 Hizalama Metodları

### Otomatik Hizalama
```javascript
// Merkeze hizala
box.center("left");     // Yatay merkez
box.center("top");      // Dikey merkez
box.center();           // Her ikisi

// Başka nesneye göre hizala
box.centerBy(otherBox, "left");
box.centerBy(otherBox, "top");
box.centerBy(otherBox); // Her ikisi

// Başka nesneye göre sırala
box.aline(otherBox, "left", 10);    // Sola 10px boşluk
box.aline(otherBox, "right", 20);   // Sağa 20px boşluk
box.aline(otherBox, "top", 5);      // Üste 5px boşluk
box.aline(otherBox, "bottom", 15);  // Alta 15px boşluk
```

## 🔧 Utility Fonksiyonları

### Temel Utility'ler
```javascript
// Rastgele sayı
random(1, 100);        // 1-100 arası

// Sayı formatla
num("123.456", "float");    // 123.46
num("123.456", "int");      // 123

// String'e çevir
str(123);                   // "123"

// Mobil kontrol
isMobile();                 // true/false

// Sayfa yönlendir
go("https://example.com");

// İki haneli format
twoDigitFormat(5);          // "05"
```

### Storage (Yerel Depolama)
```javascript
// Veri kaydet
storage.save("key", value);

// Veri yükle
const data = storage.load("key");

// Veri sil
storage.remove("key");
```

### Clock (Saat)
```javascript
// Saat bilgileri
clock.hour;         // Saat (0-23)
clock.minute;       // Dakika (0-59)
clock.second;       // Saniye (0-59)
clock.milisecond;   // Milisaniye (0-999)
```

### Date (Tarih)
```javascript
// Tarih bilgileri
date.year;          // Yıl (2024)
date.monthNumber;   // Ay numarası (1-12)
date.ayAdi;         // Ay adı (Türkçe)
date.monthName;     // Ay adı (İngilizce)
date.dayNumber;     // Gün numarası (0-6)
date.gunAdi;        // Gün adı (Türkçe)
date.dayName;       // Gün adı (İngilizce)
date.today;         // Ayın günü (1-31)
date.now;           // Timestamp
```

## 📱 Page (Ana Sayfa) Özellikleri

### Page Kontrolü
```javascript
// Sayfa boyutları
page.width;         // Genişlik
page.height;        // Yükseklik

// Sayfa rengi
page.color = "whitesmoke";

// Zoom kontrolü
page.zoom = 1.2;    // %120 zoom

// Fit işlemleri
page.fit(800);              // 800px'e sığdır
page.fit(800, 1000);        // 800-1000px arası
page.autoFit(800, 600);     // Otomatik sığdır

// HTML içeriği
page.html = "<h1>Başlık</h1>";

// Event'ler
page.onClick(function() {});
page.onResize(function() {});
```

## 🔧 Gelişmiş Fonksiyonlar

### Object Management
```javascript
// Nesne oluştur
let box = startObject(defaults, params);
// ... işlemler
return endObject(box);

// Genişletilmiş nesne
let box = startExtendedObject(ComponentName, defaults, params);
// ... işlemler
return endExtendedObject(box);
```

### Container Management
```javascript
// Varsayılan container'ı ayarla
setDefaultContainerBox(box);

// Container'ı geri yükle
restoreDefaultContainerBox();

// Mevcut container'ı al
getDefaultContainerBox();
```

### Merge İşlemleri
```javascript
// Eksik alanları ekle
mergeIntoIfMissing(target, source);

// Basit birleştirme
mergeInto(target, source);

// Yeni obje oluştur
mergeObject(target, source);
```

### Loop Timer
```javascript
// Döngü zamanlayıcısı
setLoopTimer(1000);     // 1 saniye
setLoopTimer(0);        // Durdur

// loop() fonksiyonu tanımla
function loop() {
    // Her 1 saniyede çalışır
}
```

## 🎨 Flexbox Özellikleri

### Flexbox Layout
```javascript
// Flexbox oluştur
startFlexBox({
    flow: "horizontal",      // "horizontal", "vertical"
    align: "center",         // Hizalama
    gap: 20,                // Boşluk
    padding: [10, 20]       // İç boşluk
});

// Flexbox özellikleri
box.flow = "vertical";      // Yön değiştir
box.align = "top left";     // Hizalama değiştir
box.gap = 30;              // Boşluk değiştir
```

### Flexbox Align Değerleri
```javascript
// Tek değer
"center", "top", "bottom", "left", "right"

// Çift değer
"top left", "top center", "top right"
"center left", "center", "center right"
"bottom left", "bottom center", "bottom right"
```

## 🎯 Event Handling Detayları

### Event Listener Yönetimi
```javascript
// Event ekle
const removeFunc = box.on("click", function(self, event) {
    // İşlem
});

// Event sil
box.off("click", func);

// Resize event
box.onResize(function(self) {
    // Boyut değişti
});

// Resize event sil
box.remove_onResize(func);
```

### Event Capture Options
```javascript
// Capture modu
box.on("click", func, true);

// Passive modu (performans için)
box.on("scroll", func, { passive: true });

// Once modu (sadece bir kez)
box.on("click", func, { once: true });
```

## 🔍 Debugging ve Test

### Console Komutları
```javascript
// Temel debug
println("Mesaj");
println("Hata", "error");
println("Uyarı", "warn");
println("Bilgi", "info");

// Performans ölçümü
console.time("işlem");
// ... işlem
console.timeEnd("işlem");
```

### Test Senaryoları
```javascript
// Bileşen testi
const testComponent = function() {
    const testItem = ComponentName({
        text: "Test",
        width: 200
    });
    
    testItem.on("click", function() {
        println("Test başarılı!");
    });
};

// Hata yakalama
try {
    // Test kodu
} catch (error) {
    println("Hata: " + error.message, "error");
}
```

## 📋 Tüm Özellikler Listesi

### Basic_UIComponent (Temel Özellikler)
```javascript
// Konum ve Boyut
left, top, right, bottom
width, height
totalLeft, totalTop
position

// Görünürlük
visible, opacity, clickable
color, backgroundColor

// Kenarlık
border, borderColor, round

// Metin
fontSize, textSize, textColor, textAlign

// Boşluk
padding

// Dönüşüm
rotate

// Hareket
setMotion(), getMotion(), setMotionNow()
withMotion(), dontMotion(), canMotionNow()

// Event'ler
on(), off(), onClick(), remove_onClick()
onResize(), remove_onResize()

// Yardımcı
center(), centerBy(), aline()
remove(), props()
```

### Box Özellikleri
```javascript
// İçerik
text, html

// Kaydırma
clipContent, scrollX, scrollY

// İçerik yönetimi
add(), in()
```

### Button Özellikleri
```javascript
// Metin
text, value

// Durum
enabled, minimal

// Boşluk
spaceX
```

### Input Özellikleri
```javascript
// Metin
text, title

// Durum
enabled, minimal

// Element referansları
inputElement, titleElement
```

### Label Özellikleri
```javascript
// Metin
text

// Boşluk
space, spaceX, spaceY
```

### Icon Özellikleri
```javascript
// Boyutlandırma
autoSize, naturalWidth, naturalHeight

// Boşluk
space

// Resim
load(), onLoad()
```

### Sound Özellikleri
```javascript
// Zaman
time, timeLeft, currentTime

// Durum
paused, playing, loop

// Kontrol
play(), pause(), stop()

// Yükleme
load(), onLoad()
```

### Page Özellikleri
```javascript
// Boyut
width, height

// Görünüm
color, zoom, html

// Fit
fit(), autoFit(), refreshSize()

// Event'ler
onClick(), onResize()
```

Bu hızlı referans rehberi, basic.js ile geliştirme yaparken en sık kullanılan kuralları ve kod örneklerini içermektedir. Detaylı bilgi için `basic-js-standards.md` dosyasına bakınız. 