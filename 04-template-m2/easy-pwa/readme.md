# Easy PWA Script

One file that makes a web site an installable app (PWA): an e-commerce site, a company site, documentation,
a tool or a small web app. It is added to the pages of the site itself, so payment pages, "Sign in with Google"
and links work like on the normal site.

No library is needed (no basic.js, no framework, no build step). The banner, the notice and the launch screen are
drawn in a Shadow DOM: the CSS of the site does not change them and they do not change the site.

[Türkçe](#türkçe)

## What it does

- **Installable app:** adds the manifest link and the iOS meta tags when the page does not have them, and registers
  a service worker. The same file is the page script **and** the service worker.
- **Install banner** at the bottom center (phones and tablets): an "Install" button on Android (and on desktop Chrome /
  Edge with `installBannerOnDesktop`), the "Share > Add to Home Screen" help on iPhone / iPad.
- **"No internet connection" page** when a page can not be opened. It opens the page again by itself when the
  connection comes back.
- **Notice at the top** while the connection is lost.
- **Two ways to work:**
  - **Online** (default): no file of the site is saved. Right for shops: cart, account and prices are never old.
  - **Offline mode** (`offlineMode: true`): the files of the site are saved while they are used, so the site also
    opens without internet. Right for documentation, tools and small apps.
- **Optional:** a launch screen in the installed app, a light / dark theme for its screens, a page timeout for weak
  connections, and an API for your own install button.
- **Texts** in Turkish or English by the language of the browser (or your own texts in `TEXTS`).

## Files

| File | |
|---|---|
| `easy-pwa.js` | The page script **and** the service worker (the same file). Settings at the top (`SETTINGS`). |
| `manifest.webmanifest` | Name, colors and icons of the app |
| `icon/` | App icons (192, 512, maskable 512, apple-touch-icon 180) |
| `index.htm`, `product.htm`, `shop.css` | A demo shop for tests. Do not copy them to your site. |

## Setup

1. Copy `easy-pwa.js`, `manifest.webmanifest` and the `icon/` folder to the folder of the site:
   - **The whole site:** the **root folder** (`site.com/easy-pwa.js`).
   - **A site in a folder** (Ex: `site.com/docs/`): that folder (`site.com/docs/easy-pwa.js`).

   A service worker only controls the pages under its own folder.
2. Change `manifest.webmanifest`: `name`, `short_name`, `description`, `lang`, `background_color` (the splash screen
   of Android), `theme_color`, `start_url` (the page the app opens with). Its addresses are relative (`"scope": "./"`, `"id": "./"`,
   `"start_url": "./index.htm?source=pwa"`), so the same file works in the root and in a folder.
   (`?source=pwa` shows the app visits in your statistics.)
3. Change your icons in `icon/` (same file names and sizes). For `icon-maskable-512.png`, keep the important part of
   the icon inside the central 80% circle.
4. Change `SETTINGS` at the top of `easy-pwa.js`: at least `appName` and `themeColor`; see the table below.
5. Add this line to **every page** (usually to the footer of the theme):

   ```html
   <script src="/easy-pwa.js" defer></script>          <!-- the whole site -->
   <script src="/docs/easy-pwa.js" defer></script>     <!-- a site in site.com/docs/ -->
   ```

   The address must point to the folder of step 1, on the same site. (Not a CDN, not a theme folder.)
6. The site must be `https://` (`localhost` works for tests).

## Settings

All of them are in `SETTINGS` at the top of `easy-pwa.js`.

| Setting | Default | |
|---|---|---|
| `appName` | `"Demo Shop"` | The name under the icon on iPhone and in the install banner |
| `manifestUrl`, `iconUrl`, `appleTouchIconUrl` | `manifest.webmanifest`, `icon/...` | Relative to `easy-pwa.js`. `iconUrl: ""`: no icon in the banner |
| `themeColor` | `"#141414"` | The color of the browser bar (only when the page has no `<meta name="theme-color">`) |
| `language` | `"auto"` | Texts: `"auto"` (Turkish for a Turkish browser, English for the others), `"tr"`, `"en"` |
| `serviceWorker` | `true` | `false` removes the service worker from the visitors' browsers (see "Turning it off") |
| `replaceOtherServiceWorker` | `false` | The site already has a service worker in the same folder: `false` keeps it, `true` replaces it |
| `offlinePage` | `true` | The "No internet connection" page |
| `pageTimeout` | `0` | ms. A page that does not come in this time shows the "No internet connection" page. `0`: off |
| `offlineNotice` | `true` | The notice at the top while the connection is lost |
| `offlineMode` | `false` | `true`: the files of the site are saved (see "Offline mode") |
| `offlineFiles` | `[]` | Saved at the first visit (offline mode) |
| `offlineExcludePaths` | `[]` | Never saved (offline mode). Ex: `["/cart", "/account", "/api/"]` |
| `offlineNetworkTimeout` | `4000` | ms. On a slow network the saved copy is shown after this time (offline mode). `0`: always wait |
| `offlineCacheVersion` | `1` | Change it (2, 3...) to delete all the saved files of the app one time |
| `installBanner` | `true` | The install banner |
| `installBannerOnDesktop` | `false` | Also on a computer (Chrome / Edge) |
| `installBannerDelay` | `3000` | ms after the page is opened |
| `installBannerHideDays` | `14` | Closed by the visitor: it comes back after this many days |
| `installBannerHiddenPaths` | `[]` | No banner on these pages. Ex: `["/cart", "/checkout"]` |
| `theme` | `"auto"` | Colors of the "No internet connection" page and of the launch screen: `"auto"` (by the device), `"light"`, `"dark"` |
| `themes` | light / dark | `page`, `title`, `text`, `spinner` of each theme |
| `launchScreen` | `false` | A launch screen in the installed app (see "Launch screen") |
| `launchScreenIconUrl` | `icon/icon-192.png` | Relative to `easy-pwa.js`. `""`: no icon |
| `launchScreenTitle` | `""` | `""`: `appName`. `" "`: no title |
| `launchScreenMessage` | `""` | Ex: `"Loading..."` |
| `launchScreenMinDuration` | `600` | ms. Not a short flash on a fast page |
| `launchScreenHideByCode` | `false` | `true`: stays until the site calls `EasyPWA.hideLaunchScreen()` (max. 10 s) |
| `launchScreenInBrowser` | `false` | `true`: also in the browser (for tests) |
| `colors` | | The install banner, the notice and the button of the "No internet connection" page |

The texts are in `TEXTS` below `SETTINGS` (`tr`, `en`).

## Two examples

**A shop (online only):**

```js
appName: "My Shop",
themeColor: "#1F2326",
offlineMode: false,                              // prices, stock and the cart are never old
installBannerHiddenPaths: ["/cart", "/checkout"],
pageTimeout: 15000,                              // a page that does not come in 15 s: "No internet connection"
```

**Documentation or a tool (works offline):**

```js
appName: "My Docs",
offlineMode: true,
offlineFiles: ["./", "index.htm", "js/site.js", "docs/chapter-1.md", "docs/chapter-2.md"],
theme: "light",
launchScreen: true,
launchScreenHideByCode: true,                    // the page calls EasyPWA.hideLaunchScreen() when it is drawn
```

## Offline mode

`offlineMode: false` (default): nothing is saved, the site works online only.

`offlineMode: true`: the files of the site are saved while they are used, so the site also opens without internet.

- **Network first:** with internet the newest file is always used and saved again; without internet the saved one.
  So there is no version number to change: a changed file is saved again the next time it is opened online.
- **Saved:** every GET file of the site under the folder of `easy-pwa.js` (pages, scripts, styles, pictures,
  `fetch()` data). **Not saved:** forms (POST), other sites (CDN, Google Fonts, APIs of other domains), audio and
  video parts (206), and `offlineExcludePaths`.
- **`offlineFiles`:** files saved at the first visit, so they open offline before the visitor opens them (relative to
  `easy-pwa.js`). A file that can not be read is written to the console, the others are still saved.
  The files of the app are saved without being written here: `easy-pwa.js`, the manifest and every icon in it, the
  banner, iOS and launch screen icons.
- **`offlineExcludePaths`:** addresses that are never saved. **Never** save pages that change for every visitor (cart,
  account, payment, prices): an old copy would be shown offline.
- **`offlineNetworkTimeout`:** on a slow network the saved copy is shown after this time; the network answer still
  saves the new copy.
- A page with another `?query` opens from the saved file of the same page (Ex: `product.htm?id=3` from `product.htm`).
  A page that is not saved shows the "No internet connection" page.
- Every address is saved on its own: a site with many `?query` addresses (Ex: `?id=1`, `?id=2`...) saves each one it opens.
- The notice at the top says "You are offline: saved pages are shown".
- `EasyPWA.clearOfflineFiles()` deletes the saved files from the page; `offlineCacheVersion` deletes them one time for
  every visitor; turning the mode off (`offlineMode: false`) deletes them at the next visit.
- Apps on the same domain (`site.com/app1/`, `site.com/app2/`) keep their saved files apart.

## Launch screen, theme and page timeout

- **Launch screen** (`launchScreen: true`): a screen over the page while it opens (icon, title, message, spinner), in
  the installed app only, on the first page of a visit (not on every link). It closes when the page is loaded and
  `launchScreenMinDuration` is over. A site that draws itself with JavaScript can keep it until it is ready:
  `launchScreenHideByCode: true` and `EasyPWA.hideLaunchScreen()` (after 10 s it closes anyway).
- **Theme** (`theme`): the colors of the "No internet connection" page and of the launch screen. `"auto"` follows the
  light / dark setting of the device. The colors are in `themes`.
- **Page timeout** (`pageTimeout`, ms): a page that does not come in this time (a weak connection) shows the
  "No internet connection" page, instead of a long white wait. In the offline mode only when the page has no saved
  copy (a saved one is shown after `offlineNetworkTimeout`).

## API

```js
EasyPWA.canInstall();                   // 1: install() can be used now (Android / desktop event, or iOS help)
EasyPWA.install();                      // Promise: "accepted", "dismissed", "ios" (help shown) or "unavailable"
EasyPWA.isInstalled();                  // 1: opened as the installed app
EasyPWA.isIOS();
EasyPWA.onInstallable(function () {});  // Runs when install() becomes possible. Returns a remover function.
EasyPWA.showInstallBanner();            // Shows the banner now (also when it was closed before).
EasyPWA.hideInstallBanner();
EasyPWA.clearOfflineFiles();            // Promise: deletes the saved files of the offline mode (this app only).
EasyPWA.hideLaunchScreen();             // The site is ready (launchScreenHideByCode: true).

window.addEventListener("easypwa:installable", fn);
window.addEventListener("easypwa:installed", fn);
```

**Your own install button:**

```js
window.addEventListener("easypwa:installable", function () { myButton.style.display = "block"; });
myButton.onclick = function () { EasyPWA.install(); };
```

## Test

1. Open `index.htm` with Live Server (`localhost`), not by double clicking the file.
2. Chrome DevTools > Application > **Manifest** (no errors) and **Service workers** (`easy-pwa.js` is running).
3. DevTools > Network > **Offline**, then open a product: the "No internet connection" page is shown
   (with `offlineMode: true`: the saved page).
4. The banner is only shown on phones and tablets. Test it with the device toolbar of DevTools, or set
   `installBannerOnDesktop: true`. The launch screen: `launchScreenInBrowser: true`.

## Updates and turning it off

- Change `easy-pwa.js` (or the files of the site) and upload it: the browsers get the new version by themselves.
  There is no version number to change: nothing is saved (or, in the offline mode, every file is read from the
  network first).
- To turn it off, set `serviceWorker: false` and keep the file on the site for a while: it removes its service
  worker (and its saved files) from the visitors' browsers. Then remove the script line.

## Notes

- **Another service worker:** if the site already has one in the same folder, `easy-pwa.js` keeps it and does not
  register (a warning is written to the console). `replaceOtherServiceWorker: true` replaces it.
- **Hosted platforms** (Shopify, ikas, Ticimax, IdeaSoft...) usually do not let you put a file in the root folder.
  Then a service worker can not be installed.
- **iPhone:** there is no "Install" button on iOS, the visitor adds the app from the Share menu. The installed app has
  no back button of the browser: the site needs its own menu and links. Safari can not tell a web page that the app
  is already installed, so the help banner can come again in Safari (after `installBannerHideDays` days).
- **Payment pages** of banks (3D Secure) are on another site, so the browser usually shows them with a small bar at
  the top of the app window. Test a real payment on Android and iPhone before you publish the app.
- A strict `Content-Security-Policy` of the site must allow this script (`script-src 'self'`).

---

## Türkçe

Bir web sitesini kurulabilir bir uygulamaya (PWA) çeviren tek dosya: bir e-ticaret sitesi, bir firma sitesi,
dokümantasyon, bir araç veya küçük bir web uygulaması. Sitenin kendi sayfalarına eklenir; bu yüzden ödeme sayfaları,
"Google ile giriş" ve bağlantılar normal sitedeki gibi çalışır.

Hiçbir kütüphane gerekmez (basic.js, framework ve derleme adımı yok). Banner, uyarı ve açılış ekranı Shadow DOM
içinde çizilir: sitenin CSS'i onları değiştirmez, onlar da siteyi değiştirmez.

### Ne yapar

- **Kurulabilir uygulama:** Sayfada yoksa manifest bağlantısını ve iOS meta etiketlerini ekler, bir service worker
  kaydeder. Aynı dosya hem sayfa script'i **hem de** service worker'dır.
- **Yükleme banner'ı** altta ortada (telefon ve tablet): Android'de "Yükle" butonu (`installBannerOnDesktop` ile
  bilgisayardaki Chrome / Edge'de de), iPhone / iPad'de "Paylaş > Ana Ekrana Ekle" açıklaması.
- Bir sayfa açılamazsa **"İnternet bağlantısı yok" sayfası**. Bağlantı gelince sayfayı kendisi tekrar açar.
- Bağlantı koptuğu sürece **üstte küçük bir uyarı**.
- **İki çalışma şekli:**
  - **Çevrimiçi** (varsayılan): sitenin hiçbir dosyası kaydedilmez. Mağazalar için doğrusu budur: sepet, hesap ve
    fiyatlar hiçbir zaman eski olmaz.
  - **Çevrimdışı mod** (`offlineMode: true`): sitenin dosyaları kullanıldıkça kaydedilir, site internet yokken de açılır.
    Dokümantasyon, araçlar ve küçük uygulamalar için.
- **İsteğe bağlı:** kurulu uygulamada açılış ekranı, ekranları için açık / koyu tema, zayıf bağlantı için sayfa zaman
  aşımı ve sitenin kendi yükleme butonu için API.
- **Yazılar** tarayıcının diline göre Türkçe veya İngilizce (ya da `TEXTS` içindeki kendi yazılarınız).

### Dosyalar

| Dosya | |
|---|---|
| `easy-pwa.js` | Sayfa script'i **ve** service worker (aynı dosya). Ayarlar en üstte (`SETTINGS`). |
| `manifest.webmanifest` | Uygulamanın adı, renkleri ve ikonları |
| `icon/` | Uygulama ikonları (192, 512, maskable 512, apple-touch-icon 180) |
| `index.htm`, `product.htm`, `shop.css` | Test için örnek bir mağaza. Sitenize kopyalamayın. |

### Kurulum

1. `easy-pwa.js`, `manifest.webmanifest` ve `icon/` klasörünü sitenin klasörüne kopyala:
   - **Bütün site:** **kök klasör** (`site.com/easy-pwa.js`).
   - **Bir klasördeki site** (ör. `site.com/docs/`): o klasör (`site.com/docs/easy-pwa.js`).

   Service worker sadece kendi klasörünün altındaki sayfaları kontrol eder.
2. `manifest.webmanifest` dosyasını değiştir: `name`, `short_name`, `description`, `lang`, `background_color`
   (Android'in açılış ekranı), `theme_color`, `start_url` (uygulamanın açıldığı sayfa). Adresleri göreli (`"scope": "./"`,
   `"id": "./"`, `"start_url": "./index.htm?source=pwa"`); aynı dosya kökte de bir klasörde de çalışır.
   (`?source=pwa` istatistiklerde uygulama ziyaretlerini gösterir.)
3. `icon/` içindeki ikonları kendi ikonlarınla değiştir (aynı dosya adları ve boyutlar). `icon-maskable-512.png` için
   ikonun önemli kısmını ortadaki %80'lik dairenin içinde tut.
4. `easy-pwa.js` dosyasının başındaki `SETTINGS` bölümünü değiştir: en azından `appName` ve `themeColor`; tabloya bak.
5. Bu satırı **her sayfaya** ekle (genelde temanın alt kısmına / footer'a):

   ```html
   <script src="/easy-pwa.js" defer></script>          <!-- bütün site -->
   <script src="/docs/easy-pwa.js" defer></script>     <!-- site.com/docs/ içindeki bir site -->
   ```

   Adres, 1. adımdaki klasörü göstermeli ve aynı sitede olmalı. (CDN veya tema klasörü olmaz.)
6. Site `https://` olmalı (test için `localhost` çalışır).

### Ayarlar

Hepsi `easy-pwa.js` dosyasının en üstündeki `SETTINGS` içinde.

| Ayar | Varsayılan | |
|---|---|---|
| `appName` | `"Demo Shop"` | iPhone'da ikonun altındaki ve yükleme banner'ındaki ad |
| `manifestUrl`, `iconUrl`, `appleTouchIconUrl` | `manifest.webmanifest`, `icon/...` | `easy-pwa.js`'e göre. `iconUrl: ""`: banner'da ikon yok |
| `themeColor` | `"#141414"` | Tarayıcı çubuğunun rengi (sadece sayfada `<meta name="theme-color">` yoksa) |
| `language` | `"auto"` | Yazılar: `"auto"` (Türkçe tarayıcıda Türkçe, diğerlerinde İngilizce), `"tr"`, `"en"` |
| `serviceWorker` | `true` | `false`: service worker'ı ziyaretçilerin tarayıcısından siler ("Kapatma"ya bak) |
| `replaceOtherServiceWorker` | `false` | Aynı klasörde sitenin kendi service worker'ı varsa: `false` ona dokunmaz, `true` onun yerine geçer |
| `offlinePage` | `true` | "İnternet bağlantısı yok" sayfası |
| `pageTimeout` | `0` | ms. Bu sürede gelmeyen sayfa "İnternet bağlantısı yok" sayfasını gösterir. `0`: kapalı |
| `offlineNotice` | `true` | Bağlantı koptuğu sürece üstteki uyarı |
| `offlineMode` | `false` | `true`: sitenin dosyaları kaydedilir ("Çevrimdışı mod"a bak) |
| `offlineFiles` | `[]` | İlk ziyarette kaydedilir (çevrimdışı mod) |
| `offlineExcludePaths` | `[]` | Asla kaydedilmez (çevrimdışı mod). Ör: `["/sepet", "/hesap", "/api/"]` |
| `offlineNetworkTimeout` | `4000` | ms. Yavaş ağda bu süreden sonra kaydedilmiş kopya gösterilir (çevrimdışı mod). `0`: hep bekle |
| `offlineCacheVersion` | `1` | Bir kez değiştirilince (2, 3...) uygulamanın bütün kayıtları silinir |
| `installBanner` | `true` | Yükleme banner'ı |
| `installBannerOnDesktop` | `false` | Bilgisayarda da (Chrome / Edge) |
| `installBannerDelay` | `3000` | Sayfa açıldıktan kaç ms sonra |
| `installBannerHideDays` | `14` | Ziyaretçi kapatırsa kaç gün sonra tekrar gelir |
| `installBannerHiddenPaths` | `[]` | Bu sayfalarda banner yok. Ör: `["/sepet", "/odeme"]` |
| `theme` | `"auto"` | "İnternet bağlantısı yok" sayfasının ve açılış ekranının renkleri: `"auto"` (cihaza göre), `"light"`, `"dark"` |
| `themes` | light / dark | Her temanın `page`, `title`, `text`, `spinner` renkleri |
| `launchScreen` | `false` | Kurulu uygulamada açılış ekranı ("Açılış ekranı"na bak) |
| `launchScreenIconUrl` | `icon/icon-192.png` | `easy-pwa.js`'e göre. `""`: ikon yok |
| `launchScreenTitle` | `""` | `""`: `appName`. `" "`: başlık yok |
| `launchScreenMessage` | `""` | Ör: `"Yükleniyor..."` |
| `launchScreenMinDuration` | `600` | ms. Hızlı bir sayfada kısa bir yanıp sönme olmasın |
| `launchScreenHideByCode` | `false` | `true`: site `EasyPWA.hideLaunchScreen()` çağırana kadar kalır (en çok 10 sn) |
| `launchScreenInBrowser` | `false` | `true`: tarayıcıda da (test için) |
| `colors` | | Yükleme banner'ı, uyarı ve "İnternet bağlantısı yok" sayfasının butonu |

Yazılar `SETTINGS`'in altındaki `TEXTS` içinde (`tr`, `en`).

### İki örnek

**Bir mağaza (sadece çevrimiçi):**

```js
appName: "Mağazam",
themeColor: "#1F2326",
offlineMode: false,                              // fiyat, stok ve sepet hiçbir zaman eski olmaz
installBannerHiddenPaths: ["/sepet", "/odeme"],
pageTimeout: 15000,                              // 15 sn'de gelmeyen sayfa: "İnternet bağlantısı yok"
```

**Dokümantasyon veya bir araç (çevrimdışı çalışır):**

```js
appName: "Dokümanlarım",
offlineMode: true,
offlineFiles: ["./", "index.htm", "js/site.js", "docs/bolum-1.md", "docs/bolum-2.md"],
theme: "light",
launchScreen: true,
launchScreenHideByCode: true,                    // sayfa çizilince EasyPWA.hideLaunchScreen() çağırır
```

### Çevrimdışı mod

`offlineMode: false` (varsayılan): hiçbir şey kaydedilmez, site sadece çevrimiçi çalışır.

`offlineMode: true`: sitenin dosyaları kullanıldıkça kaydedilir, site internet yokken de açılır.

- **Önce ağ:** İnternet varken her zaman en yeni dosya kullanılır ve tekrar kaydedilir; yokken kaydedilmiş olan.
  Bu yüzden sürüm numarası değiştirmek gerekmez: değişen dosya, çevrimiçi açıldığı ilk seferde yeniden kaydedilir.
- **Kaydedilir:** `easy-pwa.js`'in klasörü altındaki bütün GET dosyaları (sayfalar, script'ler, stiller, resimler,
  `fetch()` verileri). **Kaydedilmez:** formlar (POST), başka siteler (CDN, Google Fonts, başka alan adındaki API'ler),
  ses ve video parçaları (206) ve `offlineExcludePaths`.
- **`offlineFiles`:** ilk ziyarette kaydedilen dosyalar; ziyaretçi açmadan önce de çevrimdışı açılırlar (`easy-pwa.js`'e
  göre). Okunamayan dosya konsola yazılır, diğerleri kaydedilir. Uygulamanın kendi dosyaları buraya yazılmadan kaydedilir:
  `easy-pwa.js`, manifest ve içindeki bütün ikonlar, banner, iOS ve açılış ekranı ikonları.
- **`offlineExcludePaths`:** asla kaydedilmeyen adresler. Her ziyaretçide değişen sayfaları (sepet, hesap, ödeme,
  fiyatlar) **asla** kaydetmeyin: çevrimdışıyken eski bir kopya gösterilir.
- **`offlineNetworkTimeout`:** yavaş ağda bu süreden sonra kaydedilmiş kopya gösterilir; ağın cevabı yine de yeni
  kopyayı kaydeder.
- Başka bir `?sorgu` ile açılan sayfa, aynı sayfanın kaydından açılır (ör. `product.htm?id=3`, `product.htm`'den).
  Kaydedilmemiş bir sayfa "İnternet bağlantısı yok" sayfasını gösterir.
- Her adres ayrı kaydedilir: çok sayıda `?sorgu` adresi olan bir site (ör. `?id=1`, `?id=2`...) açtığı her birini kaydeder.
- Üstteki uyarı "Çevrimdışısınız: kaydedilmiş sayfalar gösteriliyor" der.
- `EasyPWA.clearOfflineFiles()` kayıtları sayfadan siler; `offlineCacheVersion` her ziyaretçide bir kez siler; modu
  kapatmak (`offlineMode: false`) bir sonraki ziyarette siler.
- Aynı alan adındaki uygulamaların (`site.com/app1/`, `site.com/app2/`) kayıtları birbirine karışmaz.

### Açılış ekranı, tema ve sayfa zaman aşımı

- **Açılış ekranı** (`launchScreen: true`): Sayfa açılırken üstünde bir ekran (ikon, başlık, mesaj, dönen simge); sadece
  kurulu uygulamada ve bir ziyaretin ilk sayfasında (her bağlantıda değil). Sayfa yüklenince ve `launchScreenMinDuration`
  dolunca kapanır. Kendini JavaScript ile çizen bir site, hazır olana kadar tutabilir: `launchScreenHideByCode: true` ve
  `EasyPWA.hideLaunchScreen()` (10 sn sonra her durumda kapanır).
- **Tema** (`theme`): "İnternet bağlantısı yok" sayfasının ve açılış ekranının renkleri. `"auto"` cihazın açık / koyu
  ayarını izler. Renkler `themes` içinde.
- **Sayfa zaman aşımı** (`pageTimeout`, ms): Bu sürede gelmeyen bir sayfa (zayıf bağlantı), uzun bir beyaz bekleme
  yerine "İnternet bağlantısı yok" sayfasını gösterir. Çevrimdışı modda sadece sayfanın kaydı yoksa (kaydı olan,
  `offlineNetworkTimeout` sonra gösterilir).

### API

```js
EasyPWA.canInstall();                   // 1: install() şimdi kullanılabilir (Android / masaüstü olayı veya iOS açıklaması)
EasyPWA.install();                      // Promise: "accepted", "dismissed", "ios" (açıklama gösterildi) veya "unavailable"
EasyPWA.isInstalled();                  // 1: kurulu uygulama olarak açıldı
EasyPWA.isIOS();
EasyPWA.onInstallable(function () {});  // install() mümkün olunca çalışır. Kaldırma fonksiyonu döner.
EasyPWA.showInstallBanner();            // Banner'ı şimdi gösterir (daha önce kapatılmışsa da).
EasyPWA.hideInstallBanner();
EasyPWA.clearOfflineFiles();            // Promise: çevrimdışı modun kayıtlarını siler (sadece bu uygulamanın).
EasyPWA.hideLaunchScreen();             // Site hazır (launchScreenHideByCode: true).

window.addEventListener("easypwa:installable", fn);
window.addEventListener("easypwa:installed", fn);
```

**Sitenin kendi yükleme butonu:**

```js
window.addEventListener("easypwa:installable", function () { myButton.style.display = "block"; });
myButton.onclick = function () { EasyPWA.install(); };
```

### Test

1. `index.htm` dosyasını Live Server ile (`localhost`) aç, dosyaya çift tıklayarak değil.
2. Chrome DevTools > Application > **Manifest** (hata olmamalı) ve **Service workers** (`easy-pwa.js` çalışıyor).
3. DevTools > Network > **Offline** seç, sonra bir ürün aç: "İnternet bağlantısı yok" sayfası gelir
   (`offlineMode: true` ile: kaydedilmiş sayfa).
4. Banner sadece telefon ve tablette gösterilir. DevTools'un cihaz görünümüyle dene veya
   `installBannerOnDesktop: true` yap. Açılış ekranı için: `launchScreenInBrowser: true`.

### Güncelleme ve kapatma

- `easy-pwa.js` dosyasını (veya sitenin dosyalarını) değiştirip yükle: tarayıcılar yeni sürümü kendileri alır.
  Değiştirilecek bir sürüm numarası yok: hiçbir şey kaydedilmez (çevrimdışı modda da her dosya önce ağdan okunur).
- Kapatmak için `serviceWorker: false` yap ve dosyayı bir süre sitede tut: ziyaretçilerin tarayıcısından kendi service
  worker'ını (ve kayıtlarını) siler. Sonra script satırını kaldır.

### Notlar

- **Başka bir service worker:** Aynı klasörde sitenin zaten bir service worker'ı varsa `easy-pwa.js` ona dokunmaz ve
  kaydolmaz (konsola uyarı yazar). `replaceOtherServiceWorker: true` onun yerine geçer.
- **Hazır platformlar** (Shopify, ikas, Ticimax, IdeaSoft...) genelde kök klasöre dosya koymaya izin vermez.
  O zaman service worker kurulamaz.
- **iPhone:** iOS'ta "Yükle" butonu yoktur, ziyaretçi uygulamayı Paylaş menüsünden ekler. Kurulan uygulamada
  tarayıcının geri tuşu yoktur: sitenin kendi menüsü ve bağlantıları olmalı. Safari, uygulamanın zaten kurulu
  olduğunu sayfaya söyleyemez; bu yüzden açıklama banner'ı Safari'de tekrar gelebilir (`installBannerHideDays` gün sonra).
- Bankaların **ödeme sayfaları** (3D Secure) başka bir sitede olduğu için tarayıcı onları genelde uygulama penceresinde
  üstte küçük bir çubukla gösterir. Uygulamayı yayınlamadan önce Android ve iPhone'da gerçek bir ödeme dene.
- Sitenin sıkı bir `Content-Security-Policy` ayarı varsa bu script'e izin vermeli (`script-src 'self'`).
