# basic.js ile Bileşen Geliştirme Rehberi

## 🎯 Temel Prensipler

### 1. UI Oluşturma
- Tüm arayüzler, ör. buton, tablo, kutu, basic.js fonksiyonları ile tanımlanır:
  ```js
  const btn = Button({
    text: "Tıkla!",
    onClick: function() { ... },
    color: "#FFD164"
  });
  mainPage.add(btn);
  ```

### 2. Bileşen Geliştirme Yaklaşımı
- **Sadece JavaScript ve basic.js kullanılır**
- **HTML/CSS doğrudan yazılmaz**
- **Modüler ve tekrar kullanılabilir bileşenler**
- **Event-driven mimari**

## 🔧 Bileşen Geliştirme Standartları

### 1. Dosya Başlığı ve Dökümantasyon
```javascript
/* Bismillah */

/*

ComponentName - v25.07

UI COMPONENT TEMPLATE
- You can customize, this template code as you need:

Started Date: June 2024
Developer: Bugra Ozden
Email: bugra.ozden@gmail.com
Webpage: https://bug7a.github.io/js-components/

*/
```

### 2. Strict Mode ve Varsayılan Değerler
```javascript
"use strict";

// Default values:
const ComponentNameDefaults = {
    key: 0,
    border: 1,
    width: 90,
    height: 50,
    round: 4,
    onClick: function(self) {},
    boxColor: "white",
    boxOverColor: "#8FC7B9",
    // ... diğer varsayılan değerler
};
```

### 3. Bileşen Fonksiyonu Yapısı
```javascript
const ComponentName = function(params = {}) {
    //console.time("ComponentName");

    // Merge params:
    mergeIntoIfMissing(params, ComponentNameDefaults);

    // BOX: Component container
    let box = startObject(params);

    // *** PRIVATE VARIABLES:
    let privateVar = "";

    // *** PUBLIC VARIABLES:
    box.publicVar = 1;
    box.state = "normal";

    // *** PRIVATE FUNCTIONS:
    const privateFunc = function() {};

    // *** PUBLIC FUNCTIONS:
    box.publicFunc = function() {};

    // *** OBJECT VIEW:
    // UI elemanları buraya

    // *** OBJECT INIT CODE:
    // Event handler'lar buraya

    //console.timeEnd("ComponentName");
    
    return endObject(box);
};
```

## 🧩 Temel Bileşen Yapısı

### 1. Box Nesnesi Kullanımı - DOĞRU YAKLAŞIM

#### ✅ DOĞRU: Box zaten bir taşıyıcıdır
```javascript
const ComponentName = function(params = {}) {
    // Merge params:
    mergeIntoIfMissing(params, ComponentNameDefaults);

    // BOX: Component container - box zaten bir Box() nesnesidir
    let box = startObject(params);

    // *** OBJECT VIEW:
    // Arka plan için ayrı box oluştur (gerekirse)
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor,
        border: box.borderBottom,
        borderColor: box.borderColor
    });

    // UI elemanları doğrudan box'a eklenir
    box.title = Label({
        text: box.titleText,
        fontSize: 16,
        textColor: "#555555",
    });

    return endObject(box);
};
```

#### ❌ YANLIŞ: Gereksiz startBox() endBox() kullanımı
```javascript
// ❌ Bu yöntem kullanılmaz
startBox({
    width: box.width,
    height: box.height,
    color: box.backgroundColor
});
// UI elemanları
endBox();
```

### 2. Parametre Kullanımı - DOĞRU YAKLAŞIM

#### ✅ DOĞRU: Parametreler zaten box'a aktarılmıştır
```javascript
const ComponentDefaults = {
    backgroundColor: "white",
    borderColor: "rgba(0, 0, 0, 0.1)",
    titleText: "Title",
    // ... diğer parametreler
};

const ComponentName = function(params = {}) {
    let box = startObject(params);

    // Parametreler artık box.propertyName olarak kullanılır
    box.background = Box(0, 0, "100%", "100%", {
        color: box.backgroundColor,        // ✅ Doğru
        borderColor: box.borderColor      // ✅ Doğru
    });

    box.title = Label({
        text: box.titleText,              // ✅ Doğru
        fontSize: 16
    });
};
```

#### ❌ YANLIŞ: Parametreleri tekrar aktarma
```javascript
// ❌ Bu yöntem kullanılmaz
startBox({
    width: box.width,                     // ❌ Gereksiz
    height: box.height,                   // ❌ Gereksiz
    color: box.backgroundColor            // ❌ Gereksiz
});
```

### 3. Arka Plan Box'ı Oluşturma - ÖNERİLEN

#### ✅ DOĞRU: Ayrı arka plan box'ı
```javascript
// Arka plan için ayrı box oluştur
box.background = Box(0, 0, "100%", "100%", {
    color: box.backgroundColor,
    border: box.borderBottom,
    borderColor: box.borderColor,
    round: box.round
});

// UI elemanları buraya eklenir
box.title = Label({
    text: box.titleText,
    fontSize: 16
});
```

### 4. Basit Bileşen Örneği (input-b.js)
```javascript
const InputBDefaults = {
    key: "0",
    type: "text",
    width: 350,
    height: "auto",
    titleText: "INPUT NAME",
    placeholder: "input value",
    inputValue: "",
    maxChar: 30,
    isRequired: 0,
    onFocus: function() {},
    onBlur: function() {},
    onEdit: function() {},
};

const InputB = function(params = {}) {
    // BOX: Component container
    const box = startObject(InputBDefaults, params);

    // *** PRIVATE VARIABLES:
    box.status = 0; // 0: okay, 1: empty but required, 2: not valid

    // *** PRIVATE FUNCTIONS:
    const showWarningBall = function() {
        // Warning gösterme mantığı
    };

    const hideWarningBall = function() {
        // Warning gizleme mantığı
    };

    // *** PUBLIC FUNCTIONS:
    box.setInputValue = function(value) {
        if (value != box.input.text) {
            box.inputValue = value;
            box.input.text = value;
            box.checkIfInputIsRequiredAndEmpty();
            box.showWarningIfNotValid(box.isValid());
        }
    };

    box.getInputValue = function() {
        return box.input.text;
    };

    box.isValid = function() {
        return 1; // Override edilebilir
    };

    // *** OBJECT VIEW:
    // INPUT: Main object
    box.input = Input({
        text: box.inputValue,
        minimal: 1,
        fontSize: 20,
        height: 40,
        color: "transparent",
        width: "100%",
        textColor: "#373836",
    });

    // LABEL: Title
    box.title = Label({
        text: box.titleText,
        fontSize: 16,
        textColor: "#555555",
    });

    // ICON: Logo image
    box.icoLogo = Icon({
        width: 32,
        height: 32,
        space: 10,
        opacity: 0.7,
        border: box.iconBorder,
        color: box.iconColor,
    });

    return endObject(box);
};
```

## 🎨 Layout ve Gruplama Standartları

### 1. Gruplama Nesnelerinin Standart Özellikleri

#### HGroup, VGroup, AutoLayout Standart Özellikleri:
```javascript
// Standart özellikler (otomatik olarak uygulanır)
{
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
}
```

#### ✅ DOĞRU: Gruplama nesneleri kullanımı
```javascript
// HGroup - Yatay gruplama
box.horizontalGroup = HGroup({
    gap: 20,
    align: "center",
    padding: [10, 20]
});
// İçindeki nesneler otomatik olarak position: relative olur
endGroup(); // ✅ MUTLAKA KAPATILMALI

// VGroup - Dikey gruplama
box.verticalGroup = VGroup({
    gap: 10,
    align: "left top",
    padding: [15, 10]
});
// İçindeki nesneler otomatik olarak position: relative olur
endGroup(); // ✅ MUTLAKA KAPATILMALI

// AutoLayout - Otomatik düzen
box.autoLayout = AutoLayout({
    flow: "vertical", // "horizontal" veya "vertical"
    align: "center",
    gap: 15,
    padding: [20, 15]
});
// İçindeki nesneler otomatik olarak position: relative olur
endAutoLayout(); // ✅ MUTLAKA KAPATILMALI
```

### 2. Kapatma Kuralları - ZORUNLU

#### ✅ DOĞRU: Mutlaka kapatılması gereken nesneler
```javascript
// HGroup MUTLAKA endGroup() ile kapatılmalı
HGroup({
    gap: 10,
    align: "center"
});
// İçerik (boş olsa bile)
endGroup(); // ✅ ZORUNLU

// VGroup MUTLAKA endGroup() ile kapatılmalı
VGroup({
    gap: 10,
    align: "left top"
});
// İçerik (boş olsa bile)
endGroup(); // ✅ ZORUNLU

// AutoLayout MUTLAKA endAutoLayout() ile kapatılmalı
AutoLayout({
    flow: "vertical",
    align: "center"
});
// İçerik (boş olsa bile)
endAutoLayout(); // ✅ ZORUNLU

// startBox MUTLAKA endBox() ile kapatılmalı
startBox({
    width: 200,
    height: 100,
    color: "white"
});
// İçerik (boş olsa bile)
endBox(); // ✅ ZORUNLU
```

#### ❌ YANLIŞ: Kapatılmamış nesneler
```javascript
// ❌ HATALI - Kapatılmamış HGroup
HGroup({
    gap: 10,
    align: "center"
});
// endGroup() eksik!

// ❌ HATALI - Kapatılmamış VGroup
VGroup({
    gap: 10,
    align: "left top"
});
// endGroup() eksik!

// ❌ HATALI - Kapatılmamış AutoLayout
AutoLayout({
    flow: "vertical",
    align: "center"
});
// endAutoLayout() eksik!

// ❌ HATALI - Kapatılmamış startBox
startBox({
    width: 200,
    height: 100,
    color: "white"
});
// endBox() eksik!
```

### 3. Position Değerleri ve Kullanım Kuralları

#### Normal Nesneler (Box, Label, Button, Input, Icon):
```javascript
// Varsayılan position: absolute
const normalBox = Box(10, 20, 100, 50, {
    color: "white"
});
// Konum verilmesi gerekir: left: 10, top: 20

// Absolute position ile özel konumlandırma
const absoluteBox = Box(0, 0, 100, 50, {
    color: "red",
    position: "absolute",
    left: 50,
    top: 30
});
```

#### Gruplama Nesneleri İçindeki Nesneler:
```javascript
// HGroup içinde - Otomatik relative position
HGroup({
    gap: 10,
    align: "center"
});

// Bu nesneler otomatik olarak position: relative olur
Label({
    text: "Item 1",
    fontSize: 16
});

Button({
    text: "Click",
    color: "blue"
});

endGroup(); // ✅ MUTLAKA KAPATILMALI
```

### 4. Konumlandırma Kuralları

#### ✅ DOĞRU: Zıt konumlar aynı anda verilmez
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
```

#### ❌ YANLIŞ: Zıt konumlar aynı anda verilmez
```javascript
// ❌ Yanlış - left ve right aynı anda
Box(0, 0, 100, 50, {
    left: 10,
    right: 20  // Çakışma!
});

// ❌ Yanlış - top ve bottom aynı anda
Box(0, 0, 100, 50, {
    top: 10,
    bottom: 20  // Çakışma!
});
```

### 5. İç İçe Gruplama Kullanımı

#### ✅ DOĞRU: İç içe gruplama
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

### 6. AutoLayout Kullanımı - ÖNERİLEN
```javascript
// GROUP: Title, input, description
box.inputGroup = AutoLayout({
    flow: "vertical",
    align: "left top",
    height: "auto",
    padding: [box.leftPadding, 14, box.rightPadding, 14],
    gap: 0,
});
that.position = "relative";

// UI elemanları buraya

endAutoLayout(); // ✅ MUTLAKA KAPATILMALI
```

### 7. HGroup Kullanımı - ÖNERİLEN
```javascript
// GROUP: Horizontal items
box.horizontalGroup = HGroup({
    gap: 20,
    width: "100%",
    height: "auto",
});

// UI elemanları buraya

endGroup(); // ✅ MUTLAKA KAPATILMALI
```

### 8. VGroup Kullanımı - ÖNERİLEN
```javascript
// GROUP: Vertical items
box.verticalGroup = VGroup({
    gap: 20,
    width: "100%",
    height: "auto",
});

// UI elemanları buraya

endGroup(); // ✅ MUTLAKA KAPATILMALI
```

### 9. ❌ KULLANILMAYACAK: FlexBox
```javascript
// ❌ Bu yöntem kullanılmaz
startFlexBox({
    flexDirection: "column",
    gap: "12px",
});

// UI elemanları buraya

endFlexBox();
```

## 📋 Gerçek Dünya Layout Örnekleri (contact-form.htm)

### 1. Bileşen İçinde AutoLayout Kullanımı
```javascript
// *** OBJECT VIEW:
// GROUP: Title, input, description
box.inputGroup = AutoLayout({
    flow: "vertical",
    align: "left top",
    height: "auto",
    padding: [box.leftPadding, 14, box.rightPadding, 14],
    gap: 0,
});
that.position = "relative";

// LABEL: Title 
box.title = Label({
    text: box.titleText,
    fontSize: 16,
    textColor: "#555555",
});

// INPUT: Main object
box.input = Input({
    text: box.inputValue,
    minimal: 1,
    fontSize: 20,
    height: 40,
    color: "transparent",
    width: "100%",
    textColor: "#373836",
});

// LABEL: Description
if (box.createDescription == 1) {
    box.description = Label({
        text: box.descriptionText,
        fontSize: 14,
        textColor: "#999999",
    });
    that.elem.style.fontStyle = "italic";
}

endAutoLayout(); // ✅ MUTLAKA KAPATILMALI
```

### 2. Responsive Layout Yönetimi
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

### 3. Dinamik Grup Oluşturma
```javascript
// Koşullu grup oluşturma
if (box.createRightBox == 1) {
    box.rightBox = AutoLayout({
        flow: "horizontal",
        align: "right bottom",
        padding: [5, 7],
        gap: 0,
    });

    // LABEL: Unit
    if (box.createUnit == 1) {
        box.unit = Label(box.unitStyle);
        box.unit.text = box.unitText;
    }

    endAutoLayout(); // ✅ MUTLAKA KAPATILMALI
}
```

## 🎯 Event Handling ve State Management

### 1. Event Handler'lar
```javascript
// *** OBJECT INIT CODE:
box.on("click", function(self, event) {
    box.onClick(box);
});

box.on("mouseover", function(self, event) {
    box.setState("mouseover");
});

box.on("mouseout", function(self, event) {
    box.setState("normal");
});
```

### 2. Input Event'leri
```javascript
const inputElem = box.input.inputElement;

box.focusFunc = function () {
    box.background.color = box.selectedBackgroundColor;
    box.line.color = box.selectedLineColor;
    box.onFocus();
}
inputElem.addEventListener("focus", function(){ box.focusFunc() });

box.blurFunc = function () {
    box.background.color = box.backgroundColor;
    box.line.color = box.lineColor;
    box.onBlur();
}
inputElem.addEventListener("blur", function(){ box.blurFunc() });
```

## 📱 Responsive Tasarım

### 1. Viewport Ayarları
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 2. Responsive Layout Yönetimi
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

## 🔍 Debugging ve Test

### 1. Console Kullanımı
```javascript
//console.time("ComponentName");
//console.timeEnd("ComponentName");

println("Debug: " + variable);
```

### 2. Test Senaryoları
```javascript
// Bileşen test fonksiyonu
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

## 🚨 ÖNEMLİ KURALLAR

### 1. Box Kullanımı
- **Box zaten bir taşıyıcı Box() nesnesidir**
- **Gerekmedikçe startBox() endBox() kullanmayın**
- **Parametreler zaten startObject() ile box'a aktarılmıştır**

### 2. Parametre Kullanımı
- **width, color gibi parametreler tekrar aktarılmaz**
- **Tüm değerler box.propertyName olarak kullanılır**
- **Özel parametreler gerekli özelliklere atanır**

### 3. Arka Plan
- **Arka plan için ayrı box nesnesi oluşturmak faydalıdır**
- **Örnek: box.background = Box(0, 0, "100%", "100%", {});**

### 4. Layout Kullanımı
- **AutoLayout, HGroup, VGroup kullanın**
- **FlexBox kullanmayın**
- **Responsive tasarım için onResize kullanın**

### 5. Position ve Konumlandırma Kuralları
- **Normal nesneler varsayılan olarak position: absolute'dur**
- **Gruplama nesneleri (HGroup, VGroup, AutoLayout) standart özelliklere sahiptir**
- **Gruplama nesneleri içindeki nesneler otomatik olarak position: relative olur**
- **Zıt konumlar (left/right, top/bottom) aynı anda verilmez**
- **Box, startBox, startObject içinde position: absolute olan nesneler gösterilir**
- **Otomatik dizilim için HGroup, VGroup, AutoLayout kullanılır**
- **İç içe gruplama için alt grupların width/height değerleri "auto" yapılır**

### 6. Kapatma Kuralları - ZORUNLU
- **HGroup MUTLAKA endGroup() ile kapatılmalı**
- **VGroup MUTLAKA endGroup() ile kapatılmalı**
- **AutoLayout MUTLAKA endAutoLayout() ile kapatılmalı**
- **startBox MUTLAKA endBox() ile kapatılmalı**
- **İçlerinde hiçbir nesne olmasa bile kapatılmalıdır**

Bu standartlar, basic.js ile profesyonel bileşen geliştirme için gerekli tüm kuralları içermektedir. Her yeni bileşen için bu standartları takip ederek tutarlı ve kaliteli kod üretilebilir.