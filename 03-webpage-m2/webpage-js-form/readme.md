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
`CONFIG.demoForms` listesindeki formlar `CONFIG.demoBaseURL` (`demo/`) klasöründen açılır. `demo/`, `04-template-m2/js-form`
formlarının bir kopyasıdır (`noindex`): oradaki formlar değişince bu kopyayı elle güncelleyin, sonra `_make-standalone.sh`'i yeniden çalıştırın.
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
(`$ALLOWED_ORIGINS`). Ayrıntı: `04-template-m2/js-form/service/readme.md` (`CONFIG.setupGuideURL`).

---

## Notlar

- `page` kaydırılmaz. Bütün içerik, `scrollY: 1` verilmiş tam ekran bir `Box` içindedir. Üst çubuk bu kutunun dışındadır.
- Pencere genişliği değişince sayfa yeniden kurulur, ziyaretçi baktığı bölümde tutulur.
- Site kendi başına çalışır (`https://bug7a.github.io/advanced-web-forms/` adresinde yayınlanacak): kütüphane `basic/`,
  bileşenler `comp/` içindedir, ikisini de depo kökündeki `./_make-standalone.sh 03-webpage-m2/webpage-js-form` üretir
  (elle düzenlemeyin; kütüphane veya bir bileşen değişince betiği yeniden çalıştırın). Demodaki formlar `demo/` içindedir.
- İkonlar `assets/icons/` içindedir (Material Symbols, 48×48 PNG). `mail.png`, js-form'un kendi ikonudur.
- Logo (`assets/logo.png`) admin panel sitesinden kopyalandı; kendi logonuzla değiştirebilirsiniz.

---

## SEO

- **Dil adreste:** Varsayılan dil adresin kendisidir, diğer dil `?lang=tr` / `?lang=en` ile açılır (`js/site.js` → `loadLanguage`).
  Dil değişince adres de değişir; kopyalanan bağlantı aynı dilde açılır. Arama motoru iki dili ayrı adreslerde okur.
- **`CONFIG.siteURL`** (`js/config.js`): Sayfanın yayın adresi (`https://bug7a.github.io/advanced-web-forms/`). Sayfa bununla
  `canonical`, `hreflang` (tr / en / x-default) ve `og:url` etiketlerini ekler. `index.htm`'de de hreflang, `og:url` ve tam
  `og:image` adresi yazılıdır (bağlantı önizlemeleri JavaScript çalıştırmaz). Adres değişirse ikisini ve `sitemap.xml`'i güncelleyin.
- **`sitemap.xml`:** İki dilin adresi. Google Search Console'a gönderin.
- **`index.htm`:** `<head>` içinde paylaşım etiketleri (Open Graph, `summary_large_image`) ve JSON-LD (schema.org) var;
  `<body>` içindeki `<noscript>` bölümü sayfanın içeriğini düz HTML olarak verir. İkisi de `js/texts.js`'teki
  (varsayılan dildeki) metinlerden yapıldı: metinler değişince bunları da güncelleyin. SSS (`faq`) ve fiyatlar (`pricing`) JSON-LD'de de var (`FAQPage`, `Offer`).
- **`assets/og-image.jpg`:** Bağlantı önizleme resmi (1200 × 630), sayfanın ilk ekranı.

## English

A single-page marketing site for selling the **js-form** project (ready web forms and a PHP mail service) as a service
and presenting it as open source. Built with **basic.js**, plain JavaScript, no framework and no build step. It is based
on `webpage-admin-panel`.

- All copy lives in `js/texts.js` (`TEXTS.tr` / `TEXTS.en`); the prices there are examples. Settings are in `js/config.js`.
- The site works on its own (`basic/` and `comp/` are made by `_make-standalone.sh`). The live demo opens six real forms from `demo/` (a copy of `04-template-m2/js-form`, `noindex`) in an iframe. They run in demo mode (`SERVICE_URL` is empty),
  so nothing is sent anywhere.
- The quote form posts JSON to `CONFIG.formEndpoint` (js-form's own `send-form-mail.php` works); when it is empty the
  message opens in the visitor's mail client.
