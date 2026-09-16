# Web Admin Panel — Tanıtım ve Satış Sayfası

`js-admin-panel` ürününü hizmet olarak satmak için hazırlanmış **tek sayfalık** web sitesi.
Sayfanın tamamı, panelin kendisi gibi **basic.js** ile, saf JavaScript ile çizilir.
Framework, derleme adımı, paket yöneticisi ve CSS dosyası yoktur.

Çalıştırmak için `index.htm` dosyasını tarayıcıda açın. (VS Code Live Server: port 5505)

---

## Sayfa akışı

| Bölüm | Dosya | İçerik |
|---|---|---|
| Üst çubuk | `js/header.js` | Sabit menü. Hero üzerindeyken şeffaf, kaydırınca açık zeminli. Mobilde tam ekran menü. |
| Hero | `js/sections/hero.js` | Başlık, kısa anlatım, iki düğme ve panel görseli (`js/mockup.js`). |
| Rakamlar | `js/sections/stats.js` | Dört güven rakamı. |
| Hizmetler | `js/sections/services.js` | Satılan üç iş türü. |
| Özellikler | `js/sections/features.js` | Sekiz özellik kartı. |
| Kimler için | `js/sections/usecases.js` | Hedef kitle kartları. |
| Süreç | `js/sections/process.js` | Dört adımlık çalışma düzeni. |
| Demo | `js/sections/demo.js` | Gerçek panel, tarayıcı çerçevesi içinde iframe ile açılır. |
| Fiyatlar | `js/sections/pricing.js` | Dört paket kartı. |
| Açık kaynak | `js/sections/opensource.js` | İndirme ve el kitabı bağlantıları. |
| S.S.S. | `js/sections/faq.js` | Tıklayınca açılan sorular. |
| İletişim | `js/sections/contact.js` | Teklif formu. |
| Alt bilgi | `js/sections/footer.js` | Bağlantılar ve telif satırı. |

Ortak parçalar `js/theme.js` içindedir: renkler, ölçüler, başlık/metin/düğme/kart yardımcıları,
bölüm ve ızgara açma-kapama fonksiyonları, kaydırma.

Sayfayı kuran dosya `js/site.js` → `buildSite()`.

---

## Sık yapılacak değişiklikler

### Metinler
Bütün yazılar `js/texts.js` içindedir: `TEXTS.tr` ve `TEXTS.en`.
İki dilde de aynı anahtarlar bulunmalıdır. Fiyatlar, paket maddeleri ve S.S.S. de buradadır.

### Ayarlar
`js/config.js`: marka adı, logo, e-posta, telefon, GitHub ve el kitabı adresleri,
demo adresi, form servisi ve varsayılan dil.

### Renkler
`js/theme.js` başındaki `SITE` nesnesi. Ana renk `PRIMARY` (`#2C5A38`) panelin rengiyle aynıdır.

### Dil
Üst çubuktaki TR/EN düğmesi sayfayı yeniden kurar. Seçim `localStorage` içinde saklanır
(`CONFIG.languageStorageKey`). İlk girişte kayıt yok ise tarayıcı dili Türkçe olanlara Türkçe,
diğerlerine `CONFIG.defaultLanguage` gösterilir. Sayfa başlığı ve `description` etiketi de dile göre güncellenir.

---

## Formu bir servise bağlamak

Form, varsayılan olarak **hiçbir yere gönderilmez**: `CONFIG.formEndpoint` boş ise mesaj,
ziyaretçinin e-posta programında `mailto` ile açılır. Servise bağlamak için:

```js
// js/config.js
formEndpoint: "https://formspree.io/f/xxxxxxx",  // veya kendi API adresiniz
formEndpointType: "json",                        // "json" veya "form"
```

Gönderilen JSON:

```json
{
  "name": "...", "company": "...", "email": "...",
  "package": "...", "message": "...",
  "language": "tr", "page": "...", "date": "..."
}
```

Servisin, siteyi barındırdığınız adrese **CORS izni** vermesi gerekir
(`Access-Control-Allow-Origin`). Formspree, Web3Forms, Make, n8n gibi servisler bunu hazır sağlar.
Kendi sunucunuzu yazacaksanız `OPTIONS` isteğine de cevap vermelidir.

Gönderim başarılı ise formun yerinde teşekkür ekranı, başarısız ise e-posta adresini
gösteren hata ekranı belirir.

---

## Canlı demo

`CONFIG.demoURL` (varsayılan: `../js-admin-panel/index.htm`) bir iframe içinde açılır.
Panel, sayfa açılışını yavaşlatmamak için **ancak ziyaretçi düğmeye bastığında** yüklenir.

Demoyu başka bir adrese taşırsanız (örneğin `https://.../demo/`), `CONFIG.demoURL` değerini değiştirin.

---

## Ölçüler ve mobil

`SITE.createMetrics()` ekran genişliğine göre bütün ölçüleri üretir:

- `< 760 px` → mobil (tek sütun, hamburger menü)
- `760–1120 px` → tablet (iki sütun)
- `> 1120 px` → masaüstü (dört sütuna kadar)

Pencere genişliği değişince sayfa baştan kurulur (`CONFIG.rebuildOnResizeDelay` ms gecikme ile)
ve ziyaretçi baktığı bölümde tutulur. Sadece yükseklik değişirse (mobil adres çubuğu)
yeniden kurulmaz.

---

## Notlar

- `page` kaydırılmaz. Bütün içerik, `scrollY: 1` verilmiş tam ekran bir `Box` içindedir.
  Üst çubuk bu kutunun **dışındadır**, bu yüzden sabit durur.
- Bu klasördeki dosyaların `.min.js` ikizi yoktur; `index.htm` kaynak dosyaları yükler.
- Kütüphane ve bileşenler kopyalanmadı: `../../basic/` ve `../../comp-m2/` doğrudan kullanılır.
- Kullanılan bileşenler: `tooltip`, `input-b`, `email-input-b`, `textarea-b` (comp-m2) ve `scroll-bar` (basic).
- Sayfadaki ikonlar `assets/icons/` içindedir (Material Symbols, 48×48 PNG).

---

## English

A single-page marketing site for selling custom admin panels and dashboards, built with
**basic.js** — plain JavaScript, no framework and no build step. Open `index.htm` in a browser.

- All copy lives in `js/texts.js` (`TEXTS.tr` / `TEXTS.en`), settings in `js/config.js`,
  colors and shared UI helpers in `js/theme.js`.
- The contact form posts JSON to `CONFIG.formEndpoint`; when it is empty the message opens
  in the visitor's mail client instead.
- The live demo loads the real panel (`CONFIG.demoURL`) in an iframe, only after the visitor
  presses the button.
