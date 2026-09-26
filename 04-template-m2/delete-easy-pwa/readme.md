# Easy PWA

**Easily turns a web site or local web files (.htm, css, js) into a PWA (Progressive Web App): an app
that can be installed on phones and computers.**

When a user opens the app's address, an **install toast** appears at the bottom. One tap (on iOS:
**Share > Add to Home Screen**) installs the app; from then on it opens from the home screen like a
normal app, without the browser bar.

**Live example:** [https://bug7a.github.io/pwa/](https://bug7a.github.io/pwa/) (open it on a phone to see the install toast)

No coding needed: change the settings at the top of `index.htm` and publish the folder.
Written with basic.js; no build tool or package manager required.

[Türkçe açıklama aşağıda.](#türkçe)

## Quick start

1. **`index.htm` > settings**:
   - `APP_ID`: a short name unique to your app (e.g. `"expense"`).
   - `CONTENT_URL`: the site address to show (`"https://..."`) or a local page (`"content/index.htm"`).
   - `THEME`: `"dark"` (default) or `"light"`. The colors of each theme are in `THEMES`. With
     `"light"`, also set `background_color` and `theme_color` in `manifest.webmanifest` to `THEMES.light.page`
     (the splash screen of the installed app).
   - `<title>` and `apple-mobile-web-app-title`: the name of the app.
2. **`manifest.webmanifest`**: `name`, `short_name`, `description`, `theme_color`, `background_color`.
3. **`icon/`**: replace the PNGs with your own icons (same names and sizes).
   For `icon-maskable-512.png`, keep the important part of the icon inside the central 80% circle.
4. Upload the folder to a place with **`https://`** (GitHub Pages, your own server...). The folder
   contains its own copies of `basic/` and `comp/`, so it can be published on its own.
5. Open the address on a phone: the install toast appears, install the app.

On every later release, don't forget to increase `CACHE_VERSION` in `sw.js` (see [Publishing a new version](#publishing-a-new-version)).

## How it works

- The content opens inside a full-screen `WebView` (iframe). Until it is ready, a `LoadingScreen` in the
  theme colors covers the app (`LOADING_ICON`, `LOADING_TITLE`, `LOADING_MESSAGE`).
- `sw.js` (the service worker) caches the app's files, so the app opens even without internet.
- Without internet, a **No internet connection** screen is shown instead of the content, or just a
  warning toast (see `APP_MODE`).
- On startup, an install toast for the user's operating system appears at the bottom center.

## Files in the folder

| File | Purpose |
|---|---|
| `index.htm` | The app page. Settings (`APP_ID`, `CONTENT_URL`, texts), web view, offline screen, install toast and service worker registration are here. |
| `content/` | Sample local content (`index.htm`). With `CONTENT_URL = "content/index.htm"` this page opens. You can also put a multi-file project here with its own css/js/image files. |
| `manifest.webmanifest` | The app's identity: name, icons, start address, colors, full-screen mode. |
| `sw.js` | Service worker. Caches the files and opens the app from the cache when there is no internet. |
| `icon/` | App icons (192, 512, maskable 512, apple-touch 180, favicon 32). |
| `comp/` | Components used: `web-view.min.js`, `toast.min.js` and `loading-screen.min.js` (copies from comp-m4). |
| `basic/` | A copy of the basic.js library in this folder. |

## Content to show

```js
const CONTENT_URL = "https://bug7a.github.io/expense/";  // A site address
// const CONTENT_URL = "content/index.htm";              // The local project in the content/ folder
```

- **Site address**: the page opens in an iframe. Because the browser can not inspect another site,
  if it does not load within `LOAD_TIMEOUT` seconds it is treated as a connection problem and the
  offline screen is shown. The site must allow being shown in an iframe: sites that forbid it with
  `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` (most large sites) appear blank.
  Your own site (e.g. on GitHub Pages) usually works.
- **Local page** (like `content/index.htm`): also add the file to the `APP_SHELL` list in `sw.js`,
  so it opens without internet. If you put a multi-file project in `content/` (its own css/js/image
  files), add all of those files to `APP_SHELL`.

## Does the content need internet?

`APP_MODE` (`index.htm`) sets how much the content depends on a connection:

```js
const APP_MODE = "online";   // Default.
// const APP_MODE = "offline";
```

- **`"online"`**: the content needs internet (like a web site). With no connection the content is
  hidden and the "No internet connection" screen is shown.
- **`"offline"`**: the content works without internet (a local page, or a site that caches itself).
  With no connection the content still opens; a toast just says there is no internet.

## Install toast

`INSTALL_TOAST_DELAY` ms after the app opens, the install toast appears at the bottom center:

- **Chrome / Edge (Android and desktop)**: the browser fires `beforeinstallprompt`; the toast shows
  an **Install** button that opens the browser's install dialog. With `ALLOW_DESKTOP_INSTALL = false`
  the toast only appears on phones and tablets (`isMobile()`).
- **iOS Safari**: `beforeinstallprompt` is not supported. The toast shows the title **Add to Home
  Screen** and the text "Tap the Share button below, then choose Add to Home Screen."
  (iPad is also detected with `navigator.maxTouchPoints`; iPadOS reports itself as "Macintosh".)
  Not affected by `ALLOW_DESKTOP_INSTALL`.
- If the app is already installed and opened from the home screen (`display-mode: standalone`),
  no toast appears.

The texts are in the settings (`INSTALL_TITLE`, `INSTALL_MESSAGE`, `INSTALL_BUTTON_TEXT`,
`IOS_INSTALL_TITLE`, `IOS_INSTALL_MESSAGE`). The meta tags iOS needs (`apple-mobile-web-app-*`,
`apple-touch-icon`) are already in `index.htm`.

## Without internet

**Offline screen** (`"online"` mode). The texts and the icon are at the top of `index.htm`:

```js
const OFFLINE_TITLE = "No internet connection";
const OFFLINE_MESSAGE = "Please check your internet connection. ...";
const OFFLINE_BUTTON_TEXT = "Try again";
const OFFLINE_ICON_SVG = "<svg ...>";   // SVG, not a file: it shows offline too
```

The screen is updated on the `online` / `offline` events, on a web view timeout and by the
**Try again** button. When the connection returns, the content reloads by itself.

**Connection toast** (`"offline"` mode). The content stays open; when the connection is lost (on
startup or on the `offline` event) this toast appears:

```js
const NO_CONNECTION_TITLE = "No internet connection";
const NO_CONNECTION_MESSAGE = "You are offline. Some features may not work.";
```

## Running and testing

The service worker **only works on `https://` or `localhost`**.
If you open the file by double-clicking (`file://`), the page shows but the PWA features are off.

- **VS Code Live Server**: right-click `index.htm`, "Open with Live Server" (port 5505).
- **Terminal**: in this folder run `python3 -m http.server 5599`, then open `http://localhost:5599/index.htm`.

Testing in Chrome:

1. Open the page, `F12` > **Application** tab.
2. **Manifest**: the icons and "Installability" should show no warnings.
3. **Service Workers**: the status should be `activated and is running`.
4. **Cache Storage** > `pwa:app-example:v1.1.6` (`APP_ID` + `CACHE_VERSION`): all files should be listed.
5. Offline test: choose `Offline` in the **Network** tab and reload. The app should open and show the
   **No internet connection** screen instead of the content. When the connection returns, the content loads by itself.

## Publishing a new version

The browser keeps using the files cached by `sw.js`; if `sw.js` does not change, it does not notice
new files. So **before every release** change the version number in `sw.js`:

```js
const CACHE_VERSION = "v1.1.7";
```

Then:

1. The old cache is deleted and the files are downloaded again.
2. An **Update Available - Reload** button appears on the open page.
3. Pressing it activates the new version and reloads the page once.

If you added a new file (component, image, sound...), also add it to the `APP_SHELL` list in `sw.js`.
Files not in the list are cached the first time they are opened, but they are missing on the first offline start.

## Notes

- **Several apps on the same domain**: Cache Storage is shared per domain (origin), not per folder.
  If you make several apps with this project and publish them on the same domain (e.g. different
  repos of one GitHub Pages account), give each one a different `APP_ID`. `index.htm` passes this
  name to the service worker in its registration address (`sw.js?app=...`) and `sw.js` builds the
  cache name from it, so one app's old-cache cleanup never deletes another app's cache.
- **Page width**: with `USE_PAGE_FIT` off (default `false`) the content fills the whole screen.
  When on, `page.fit(CONTENT_WIDTH, MAX_WIDTH)` is used: the content is fixed to `CONTENT_WIDTH`,
  scaled up to `MAX_WIDTH` and centered. Because `page.fit()` scales the body, `position: fixed`
  toasts landed outside the screen; `fitBodyToPage()` sizes the body to the design size so the toasts
  stay at the bottom center (both are switched on and off together).
- **Local pages offline**: a `WebView` loading a local page like `content/index.htm` is also a
  "navigate" request for the browser (even inside an iframe). So `sw.js` always uses the request's
  own URL as the cache key, and only falls back to `index.htm` when the top page
  (`destination: "document"`) has no entry at all. This way the `content/` page never overwrites
  the cached `index.htm`.
- **Theme**: the theme color is given to `<html>` by a script in `<head>`, before anything is drawn,
  so the dark theme never shows a white frame while the app opens. A local page gets the theme in its
  address (`content/index.htm?theme=dark`) and draws itself in the same colors; a site address is
  loaded as it is, so a site with a white background still shows white.
- **Notch and bottom bar**: the page uses `viewport-fit=cover` and `env(safe-area-inset-*)`; in
  full-screen mode the content does not go under the phone's notch or bottom bar.
- **Copies**: `basic/` and `comp/` are copies of the main folders (`../../basic/`, `../../comp-m4/`)
  and are not updated by themselves. `comp/` only holds `.min.js` files: copy `web-view.min.js` and
  `loading-screen.min.js` from `comp-m4/`; `comp-m4/toast.js` has no `.min` twin, so build it with terser:
  `npx terser ../../comp-m4/toast.js --compress --mangle --comments /Bismillah/ -o comp/toast.min.js`

---

# Türkçe

**Bir web sitesini veya yerel web dosyalarini (.htm, css, js) kolayca bir PWA'ya (Progressive Web App), yani telefona ve
bilgisayara kurulabilen bir uygulamaya cevirir.**

Kullanici uygulamanin adresini actiginda altta bir **kurulum toast'i** cikar. Tek dokunusla
(iOS'ta **Paylas > Ana Ekrana Ekle** ile) uygulama kurulur; sonra ana ekrandan, tarayici cubugu
olmadan normal bir uygulama gibi acilir.

**Canli ornek:** [https://bug7a.github.io/pwa/](https://bug7a.github.io/pwa/) (kurulum toast'ini gormek icin telefonda ac)

Kod yazman gerekmez: `index.htm` basindaki ayarlari degistirip klasoru yayinlaman yeterli.
basic.js ile yazilmistir, build araci veya paket yoneticisi gerektirmez.

## Hizli baslangic

1. **`index.htm` > ayarlar**:
   - `APP_ID`: uygulamana ozel kisa bir ad (ornek: `"expense"`).
   - `CONTENT_URL`: gosterilecek site adresi (`"https://..."`) ya da yerel sayfa (`"content/index.htm"`).
   - `THEME`: `"dark"` (varsayilan) veya `"light"`. Her temanin renkleri `THEMES` icindedir. `"light"`
     secersen `manifest.webmanifest` icindeki `background_color` ve `theme_color`'i de `THEMES.light.page`
     yap (kurulu uygulamanin acilis ekrani).
   - `<title>` ve `apple-mobile-web-app-title`: uygulamanin adi.
2. **`manifest.webmanifest`**: `name`, `short_name`, `description`, `theme_color`, `background_color`.
3. **`icon/`**: PNG'leri kendi ikonlarinla degistir (ayni isim ve olculerde).
   `icon-maskable-512.png` icin ikonun onemli kismi ortadaki %80'lik dairenin icinde kalmali.
4. Klasoru **`https://`** olan bir yere yukle (GitHub Pages, kendi sunucun...). Klasor kendi
   `basic/` ve `comp/` kopyalarini icerir, tek basina yayinlanabilir.
5. Adresi telefonda ac: kurulum toast'i cikar, uygulamayi kur.

Sonraki her yayinda `sw.js` icindeki `CACHE_VERSION`'i artirmayi unutma (bkz. [Yeni surum yayinlama](#yeni-surum-yayinlama)).

## Nasil calisir

- Icerik tam ekran bir `WebView` (iframe) icinde acilir.
  Icerik hazir olana kadar uygulamayi tema renklerinde bir `LoadingScreen` kaplar
  (`LOADING_ICON`, `LOADING_TITLE`, `LOADING_MESSAGE`).
- `sw.js` (service worker) uygulamanin dosyalarini onbellege alir; uygulama internet yokken de acilir.
- Internet yoksa icerigin yerine **No internet connection** ekrani, ya da sadece bir uyari toast'i
  gorunur (bkz. `APP_MODE`).
- Acilista isletim sistemine gore alt ortada kurulum toast'i cikar.

## Klasordeki dosyalar

| Dosya | Ne ise yarar |
|---|---|
| `index.htm` | Uygulama sayfasi. Ayarlar (`APP_ID`, `CONTENT_URL`, metinler), web view, offline ekrani, kurulum toast'i, service worker kaydi burada. |
| `content/` | Ornek yerel icerik (`index.htm`). `CONTENT_URL = "content/index.htm"` yapinca bu sayfa acilir. Buraya kendi css/js/gorsel dosyalarinla birden fazla dosyali bir proje de koyabilirsin. |
| `manifest.webmanifest` | Uygulama kimligi: isim, ikonlar, acilis adresi, renkler, tam ekran modu. |
| `sw.js` | Service worker. Dosyalari onbellege alir, internet yokken uygulamayi cache'ten acar. |
| `icon/` | Uygulama ikonlari (192, 512, maskable 512, apple-touch 180, favicon 32). |
| `comp/` | Kullanilan bilesenler: `web-view.min.js`, `toast.min.js` ve `loading-screen.min.js` (comp-m4 kopyalari). |
| `basic/` | basic.js kutuphanesinin bu klasore kopyalanmis hali. |

## Gosterilecek icerik

```js
const CONTENT_URL = "https://bug7a.github.io/expense/";  // Bir site adresi
// const CONTENT_URL = "content/index.htm";              // content/ klasorundeki yerel proje
```

- **Site adresi**: sayfa iframe icinde acilir. Tarayici baska bir siteyi kontrol edemedigi icin,
  `LOAD_TIMEOUT` saniyede yuklenmezse baglanti sorunu kabul edilir ve offline ekrani gosterilir.
  Site iframe icinde gosterilmeye izin vermeli: `X-Frame-Options` veya `Content-Security-Policy:
  frame-ancestors` ile bunu yasaklayan siteler (cogu buyuk site) bos gorunur. Kendi siten
  (ornek: GitHub Pages) genelde sorunsuzdur.
- **Yerel sayfa** (`content/index.htm` gibi): dosyayi `sw.js` icindeki `APP_SHELL` listesine de ekle;
  boylece internet olmadan da acilir. `content/` klasorune birden fazla dosyali bir proje koyarsan
  (kendi css/js/gorsel dosyalari), o dosyalarin hepsini `APP_SHELL` listesine ekle.

## Icerik internet gerektiriyor mu?

`APP_MODE` (`index.htm`) icerigin baglantiya ne kadar bagimli oldugunu belirler:

```js
const APP_MODE = "online";   // Varsayilan.
// const APP_MODE = "offline";
```

- **`"online"`**: icerik internet gerektirir (bir web sitesi gibi). Baglanti yoksa icerik
  gizlenir, "No internet connection" ekrani gosterilir.
- **`"offline"`**: icerik internetsiz de calisir (yerel bir sayfa, ya da kendini cache'leyen bir
  site). Baglanti yoksa icerik yine acilir, sadece bir toast ile internetin olmadigi bildirilir.

## Kurulum toast'i

Uygulama acildiktan `INSTALL_TOAST_DELAY` ms sonra alt ortada kurulum toast'i cikar:

- **Chrome / Edge (Android ve masaustu)**: tarayici `beforeinstallprompt` olayini verir;
  toast icinde **Install** butonu gorunur, basilinca tarayicinin kurulum penceresi acilir.
  `ALLOW_DESKTOP_INSTALL = false` yapilirsa toast sadece telefon ve tablette (`isMobile()`) cikar.
- **iOS Safari**: `beforeinstallprompt` desteklenmez. Toast **Add to Home Screen** basligiyla
  "Tap the Share button below, then choose Add to Home Screen." yazisini gosterir.
  (iPad `navigator.maxTouchPoints` ile de taninir; iPadOS kendini "Macintosh" gosterir.)
  `ALLOW_DESKTOP_INSTALL`'dan etkilenmez.
- Uygulama zaten kurulu ve ana ekrandan aciliyorsa (`display-mode: standalone`) toast cikmaz.

Metinler ayarlar bolumundedir (`INSTALL_TITLE`, `INSTALL_MESSAGE`, `INSTALL_BUTTON_TEXT`,
`IOS_INSTALL_TITLE`, `IOS_INSTALL_MESSAGE`). iOS icin gereken meta etiketleri
(`apple-mobile-web-app-*`, `apple-touch-icon`) `index.htm` icinde hazirdir.

## Internet yokken

**Offline ekrani** (`"online"` modu). Metinler ve ikon `index.htm` basindadir:

```js
const OFFLINE_TITLE = "No internet connection";
const OFFLINE_MESSAGE = "Please check your internet connection. ...";
const OFFLINE_BUTTON_TEXT = "Try again";
const OFFLINE_ICON_SVG = "<svg ...>";   // Dosya degil, SVG: offline da gorunur
```

Ekran `online` / `offline` olaylarinda, web view zaman asiminda ve **Try again** butonunda
guncellenir. Baglanti gelince icerik kendiliginden yeniden yuklenir.

**Baglanti toast'i** (`"offline"` modu). Icerik acik kalir; baglanti kesildiginde (acilista veya
`offline` olayinda) su toast gorunur:

```js
const NO_CONNECTION_TITLE = "No internet connection";
const NO_CONNECTION_MESSAGE = "You are offline. Some features may not work.";
```

## Calistirma ve test

Service worker **sadece `https://` veya `localhost` uzerinde** calisir.
Dosyayi cift tiklayip `file://` olarak acarsan sayfa gorunur ama PWA ozellikleri devre disi kalir.

- **VS Code Live Server**: `index.htm` dosyasina sag tikla, "Open with Live Server" (port 5505).
- **Terminal**: bu klasorde `python3 -m http.server 5599`, sonra `http://localhost:5599/index.htm`.

Chrome'da test:

1. Sayfayi ac, `F12` > **Application** sekmesi.
2. **Manifest**: ikonlar ve "Installability" uyarisiz gorunmeli.
3. **Service Workers**: durum `activated and is running` olmali.
4. **Cache Storage** > `pwa:app-example:v1.1.6` (`APP_ID` + `CACHE_VERSION`): tum dosyalar listelenmeli.
5. Offline testi: **Network** sekmesinde `Offline` sec ve sayfayi yenile. Uygulama acilmali ve
   icerik yerine **No internet connection** ekrani gorunmeli. Baglanti gelince icerik kendiliginden yuklenir.

## Yeni surum yayinlama

Tarayici `sw.js` ile onbellege aldigi dosyalari kullanmaya devam eder; `sw.js` degismezse yeni
dosyalari fark etmez. Bu yuzden **her yayindan once** `sw.js` icindeki surum numarasini degistir:

```js
const CACHE_VERSION = "v1.1.7";
```

Sonra:

1. Eski cache silinir, dosyalar yeniden indirilir.
2. Acik olan sayfada **Update Available - Reload** butonu belirir.
3. Butona basilinca yeni surum devreye girer ve sayfa bir kez yenilenir.

Yeni bir dosya eklediysen (component, resim, ses...) `sw.js` icindeki `APP_SHELL` listesine de ekle.
Listede olmayan dosyalar ilk kez acildiklarinda onbellege alinir, ama offline ilk acilista bulunamazlar.

## Notlar

- **Ayni alan adinda birden fazla uygulama**: Cache Storage klasore gore degil, alan adina (origin)
  gore ortaktir. Bu proje ile birden fazla uygulama yapip ayni alan adina (ornek: bir GitHub Pages
  hesabinin farkli repo'lari) kurarsan, her uygulamaya farkli bir `APP_ID` ver. `index.htm` bu adi
  service worker'a kayit adresiyle iletir (`sw.js?app=...`), `sw.js` de onbellek adini ondan olusturur;
  boylece bir uygulamanin eski cache temizligi, digerinin cache'ini silmez.
- **Sayfa genisligi**: `USE_PAGE_FIT` (varsayilan `false`) kapaliyken icerik ekranin tamamini kaplar.
  Acilirsa `page.fit(CONTENT_WIDTH, MAX_WIDTH)` devreye girer; icerik `CONTENT_WIDTH`'e sabitlenir ve
  `MAX_WIDTH`'e kadar buyutulup ortalanir. `page.fit()` govdeyi (body) olcekledigi icin
  `position: fixed` toast'lar ekranin disina dusuyordu; `fitBodyToPage()` govdeyi tasarim olculerine
  getirir ve toast'lar alt ortada kalir (ikisi birlikte acilip kapanir).
- **Yerel sayfalar offline**: `WebView`'in `content/index.htm` gibi yerel bir sayfa yuklemesi de
  tarayici icin bir "navigate" istegidir (iframe icinde olsa da). `sw.js` bu yuzden onbellek anahtari
  olarak hep istegin kendi URL'sini kullanir; sadece ust sayfanin (`destination: "document"`) hicbir
  kaydi yoksa `index.htm`'e duser. Boylece `content/` sayfasi, `index.htm`'in onbellegini ezmez.
- **Tema**: tema rengi `<head>` icindeki bir script ile, sayfa daha cizilmeden `<html>`'e verilir;
  karanlik temada acilista beyaz bir kare gorunmez. Yerel bir sayfa temayi adresinden alir
  (`content/index.htm?theme=dark`) ve kendini ayni renklerle cizer; site adresi oldugu gibi yuklenir,
  beyaz arka planli bir site yine beyaz gorunur.
- **Centik ve alt cubuk**: sayfa `viewport-fit=cover` ve `env(safe-area-inset-*)` kullanir; tam ekran
  modda icerik telefonun centiginin ve alt cubugunun altinda kalmaz.
- **Kopyalar**: `basic/` ve `comp/` ana klasorlerin (`../../basic/`, `../../comp-m4/`) kopyalaridir ve
  kendiliginden guncellenmez. `comp/` yalnizca `.min.js` dosyalarini tutar: `web-view.min.js`'i
  `comp-m4/web-view.min.js`'ten ve `loading-screen.min.js`'i `comp-m4/loading-screen.min.js`'ten kopyala; `comp-m4/toast.js`'in `.min` ikizi olmadigi icin onu terser ile uret:
  `npx terser ../../comp-m4/toast.js --compress --mangle --comments /Bismillah/ -o comp/toast.min.js`
