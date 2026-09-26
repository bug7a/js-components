# JS Form — Tanıtım ve Satış Sayfası

`js-form` projesini (hazır web formları + PHP mail servisi) hizmet olarak satmak ve açık kaynak olarak
tanıtmak için hazırlanmış **tek sayfalık** web sitesi. Sayfanın tamamı, formların kendisi gibi **basic.js** ile,
saf JavaScript ile çizilir. Framework, derleme adımı, paket yöneticisi ve CSS dosyası yoktur.

`webpage-admin-panel` sitesinin kopyasından yapıldı; aynı altyapıyı (tema, üst çubuk, bölümler, teklif formu) kullanır.

Çalıştırmak için klasörü bir web sunucusu ile açın (VS Code Live Server: port 5505) ve `index.htm` sayfasına gidin.

---

## Sayfa akışı

| Bölüm | Dosya | İçerik |
|---|---|---|
| Üst çubuk | `js/header.js` | Sabit menü. Mobilde tam ekran menü. |
| Hero | `js/sections/hero.js` | Başlık, kısa anlatım, iki düğme ve form görseli (`js/mockup.js`: form + gelen e-posta kartı, basic.js ile çizilir). |
| Rakamlar | `js/sections/stats.js` | Dört rakam. |
| Hizmetler | `js/sections/services.js` | Kurulum ve mail servisi, size özel form, veri tabanı ve panel. |
| Özellikler | `js/sections/features.js` | Sekiz özellik kartı. |
| Kimler için | `js/sections/usecases.js` | Hedef kitle kartları. |
| Süreç | `js/sections/process.js` | Dört adımlık çalışma düzeni. |
| Demo | `js/sections/demo.js` | Altı gerçek form, sekmelerle, tarayıcı çerçevesi içinde (iframe). |
| Fiyatlar | `js/sections/pricing.js` | Dört paket kartı. |
| Açık kaynak | `js/sections/opensource.js` | İndirme ve kurulum rehberi bağlantıları. |
| S.S.S. | `js/sections/faq.js` | Tıklayınca açılan sorular. |
| İletişim | `js/sections/contact.js` | Teklif formu. |
| Alt bilgi | `js/sections/footer.js` | Bağlantılar ve telif satırı. |

---

## Sık yapılacak değişiklikler

### Metinler ve fiyatlar
Bütün yazılar `js/texts.js` içindedir: `TEXTS.tr` ve `TEXTS.en` (aynı anahtarlar).
**Fiyatlar örnektir** (`pricing.items`): kendi fiyatlarınızı yazın. Paket adları `contact.packageList` ile aynı sırada olmalı
(`packageIndex`).

### Ayarlar
`js/config.js`: marka adı, e-posta, GitHub / indirme / kurulum rehberi adresleri, demodaki formlar, form servisi, varsayılan dil.

### Canlı demo
`CONFIG.demoForms` listesindeki formlar `CONFIG.demoBaseURL` (`../js-form/`) klasöründen açılır.
Bu formlarda `SERVICE_URL` boştur, yani **demo modunda** çalışırlar: gönderilen hiçbir şey bir yere gitmez.
Kendi `SERVICE_URL` adresinizi yazdığınız bir formu (veya Supabase'e yazan `contact-form-to-supabase.htm`'i) demoya koymayın.
Form, ziyaretçi **Demoyu Başlat** düğmesine basınca yüklenir; sekmeler formu değiştirir.

### Teklif formu
`CONFIG.formEndpoint` boş ise mesaj, ziyaretçinin e-posta programında `mailto` ile açılır.
js-form'un kendi mail servisi de kullanılabilir:

```js
// js/config.js
formEndpoint: "https://your-site.com/service/send-form-mail.php",
formEndpointType: "json",
```

Form düz bir JSON nesnesi gönderir (`name`, `company`, `email`, `package`, `message`, `language`, `page`, `date`);
servis başlıkları alan adlarından kendisi oluşturur. Servisin, siteyi barındırdığınız adrese izin vermesi gerekir
(`$ALLOWED_ORIGINS`). Ayrıntı: `../js-form/service/readme.md`.

---

## Notlar

- `page` kaydırılmaz. Bütün içerik, `scrollY: 1` verilmiş tam ekran bir `Box` içindedir. Üst çubuk bu kutunun dışındadır.
- Pencere genişliği değişince sayfa yeniden kurulur, ziyaretçi baktığı bölümde tutulur.
- Kütüphane ve bileşenler kopyalanmadı: `../../basic/` ve `../../comp-m2/` doğrudan kullanılır. Demodaki formlar `../js-form/`
  klasöründedir; site, deponun içinde (veya aynı klasör düzeniyle) yayınlanmalıdır.
- İkonlar `assets/icons/` içindedir (Material Symbols, 48×48 PNG). `mail.png`, js-form'un kendi ikonudur.
- Logo (`assets/logo.png`) admin panel sitesinden kopyalandı; kendi logonuzla değiştirebilirsiniz.

---

## SEO

- **Dil adreste:** Varsayılan dil adresin kendisidir, diğer dil `?lang=tr` / `?lang=en` ile açılır (`js/site.js` → `loadLanguage`).
  Dil değişince adres de değişir; kopyalanan bağlantı aynı dilde açılır. Arama motoru iki dili ayrı adreslerde okur.
- **`CONFIG.siteURL`** (`js/config.js`): Sayfanın yayın adresi. Yazılınca sayfa `canonical`, `hreflang` (tr / en / x-default)
  ve `og:url` etiketlerini kendisi ekler. Adres belli olunca `index.htm` içindeki `og:image` değerini de tam adres yapın
  (bağlantı önizlemeleri JavaScript çalıştırmaz).
- **`index.htm`:** `<head>` içinde paylaşım etiketleri (Open Graph, `summary_large_image`) ve JSON-LD (schema.org) var;
  `<body>` içindeki `<noscript>` bölümü sayfanın içeriğini düz HTML olarak verir. İkisi de `js/texts.js`'teki
  (varsayılan dildeki) metinlerden yapıldı: metinler değişince bunları da güncelleyin. SSS (`faq`) ve fiyatlar (`pricing`) JSON-LD'de de var (`FAQPage`, `Offer`).
- **`assets/og-image.jpg`:** Bağlantı önizleme resmi (1200 × 630), sayfanın ilk ekranı.

## English

A single-page marketing site for selling the **js-form** project (ready web forms and a PHP mail service) as a service
and presenting it as open source. Built with **basic.js**, plain JavaScript, no framework and no build step. It is based
on `webpage-admin-panel`.

- All copy lives in `js/texts.js` (`TEXTS.tr` / `TEXTS.en`); the prices there are examples. Settings are in `js/config.js`.
- The live demo opens six real forms from `../js-form/` in an iframe. They run in demo mode (`SERVICE_URL` is empty),
  so nothing is sent anywhere.
- The quote form posts JSON to `CONFIG.formEndpoint` (js-form's own `send-form-mail.php` works); when it is empty the
  message opens in the visitor's mail client.
