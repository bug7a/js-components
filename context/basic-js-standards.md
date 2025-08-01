# basic.js Geliştirme Standartları ve Rehberi (AI TARAFINDAN DEĞİŞTİRİLEMEZ)

## 🎯 Temel Prensipler ve Kurallar

### 1. Teknoloji Kısıtlamaları
- **Sadece JavaScript ve basic.js kullanılır**
- **Doğrudan HTML veya CSS yazılmaz** - Tüm arayüzler basic.js UI bileşenleriyle tanımlanır
- **CSS dosyaları yazılmaz** - Stiller bileşen parametreleriyle verilir
- **Doğrudan DOM manipülasyonu yapılmaz** - basic.js API'leri kullanılır

### 2. Proje Yapısı ve Organizasyon
```
project/
├── basic/                    # basic.js kütüphanesi
│   ├── basic.min.js
│   ├── basic.min.css
│   └── font/
├── assets/                   # Görseller ve medya
├── components/               # UI bileşenleri
├── js/                       # Oyun mantığı ve ana modüller
└── index.htm                 # Ana dosya
```

### 3. Dosya ve Fonksiyon İsimlendirme
- **Küçük harf, tire veya camelCase** kullanılır
- **Örnekler**: `action-button.js`, `ShipCard`, `createNewShip()`
- **Bileşen dosyaları**: `component-name.js` formatında
- **Fonksiyonlar**: `camelCase` formatında

## 📋 Temel HTML Şablonu

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
    // VARIABLES
    let myVariable = "";
    
    // First running function.
    window.onload = function() {
        page.color = "whitesmoke";
        // UI kodları buraya
    }
    
    // OTHER FUNCTIONS
    const myFunction = function() {
        // Fonksiyon kodları
    };
    </script>
</head>
<body>
    <!-- HTML content -->
</body>
</html>
```

## 🧩 Temel UI Bileşenleri ve Kullanım Standartları

### 1. Label (Metin)
```javascript
const label = Label({
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

### 2. Button (Buton)
```javascript
const button = Button({
    text: "Tıkla",
    color: "cadetblue",
    minimal: 1,
    padding: [12, 6],
    round: 4
});
button.on("click", function(self, event) {
    // Tıklama işlemi
});
```

### 3. Input (Giriş Kutusu)
```javascript
const input = Input({
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

### 4. Box (Kutu)
```javascript
const box = Box(0, 0, 200, 100, {
    color: "white",
    border: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    round: 4
});
```

## 📱 Responsive Tasarım

### 1. Viewport Ayarları
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 2. Responsive Layout Yönetimi
```javascript
// Sayfa yeniden boyutlandığında çağır
page.onResize(function() {
    // Responsive davranış kodları
});
```

## 🔍 Debugging ve Test

### 1. Console Kullanımı
```javascript
//console.time("FunctionName");
//console.timeEnd("FunctionName");

println("Debug: " + variable);
```

### 2. Test Senaryoları
```javascript
// Test fonksiyonu
const testFunction = function() {
    // Test kodları
    println("Test başarılı!");
};
```

Bu standartlar, basic.js ile temel geliştirme için gerekli kuralları içermektedir. Bileşen geliştirme için detaylı rehber `create-component.md` dosyasında bulunmaktadır. 