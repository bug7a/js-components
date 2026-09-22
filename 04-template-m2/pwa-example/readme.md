# PWA Example

Bir **web sitesini veya yanindaki bir .htm sayfasini** mobil uygulama gibi kurup calistiran
**Progressive Web App** ornegi. basic.js ile yazilmistir, build araci veya paket yoneticisi gerektirmez.

Icerik bir `WebView` (comp-m4) icinde acilir. Internet yokken uygulama yine acilir ve icerik yerine
"No internet connection" ekrani gorunur. Acilista, isletim sistemine gore alt ortada bir
kurulum `Toast`'i cikar (Android/masaustu: **Install** butonu, iOS: **Paylas > Ana Ekrana Ekle** yazisi).

## Klasordeki dosyalar

| Dosya | Ne ise yarar |
|---|---|
| `index.htm` | Uygulama sayfasi. Ayarlar (`CONTENT_URL`, metinler), web view, offline ekrani, kurulum toast'i, service worker kaydi burada. |
| `content/` | Ornek yerel icerik projesi (`index.htm`). `CONTENT_URL = "content/index.htm"` yapinca uygulamada bu sayfa acilir. Buraya kendi css/js/gorsel dosyalarinla birden fazla dosyali bir proje de koyabilirsin. |
| `comp/` | Kullanilan bilesenler: `web-view.js` ve `toast.js` (comp-m4 kopyalari). |
| `manifest.webmanifest` | Uygulama kimligi: isim, ikonlar, acilis adresi, renkler, tam ekran modu. |
| `sw.js` | Service worker. Dosyalari onbellege alir, internet yokken uygulamayi cache'ten acar. |
| `icon/` | Uygulama ikonlari (192, 512, maskable 512, apple-touch 180, favicon 32). |
| `basic/` | Kutuphanenin bu klasore kopyalanmis hali. Klasor tek basina yayinlanabilsin diye buradadir. |

## Nasil calistirilir

Service worker **sadece `https://` veya `localhost` uzerinde** calisir.
Dosyayi cift tiklayip `file://` olarak acarsan sayfa gorunur ama PWA ozellikleri devre disi kalir.

- **VS Code Live Server**: `index.htm` dosyasina sag tikla, "Open with Live Server" (port 5505).
- **Terminal**: bu klasorde `python3 -m http.server 5599`, sonra `http://localhost:5599/index.htm`.

## Test etme (Chrome)

1. Sayfayi ac, `F12` > **Application** sekmesi.
2. **Manifest**: ikonlar ve "Installability" uyarisiz gorunmeli.
3. **Service Workers**: durum `activated and is running` olmali.
4. **Cache Storage** > `mobile-fit-skeleton-v1.0.0`: tum dosyalar listelenmeli.
5. Offline testi: **Network** sekmesinde `Offline` sec ve sayfayi yenile. Uygulama acilmali ve
   icerik yerine **No internet connection** ekrani gorunmeli. Baglanti gelince icerik kendiliginden yuklenir.

## Gosterilecek icerik

`index.htm` icindeki ayarlar bolumunden secilir:

```js
const CONTENT_URL = "https://bug7a.github.io/expense/";  // Bir site adresi
// const CONTENT_URL = "content/index.htm";              // content/ klasorundeki yerel proje
```

- Site adresi verilince sayfa iframe icinde acilir. Baska bir siteyi tarayici kontrol edemedigi icin,
  `LOAD_TIMEOUT` saniyesinde yuklenmezse baglanti sorunu kabul edilir ve offline ekrani gosterilir.
- Yerel bir sayfa verilirse (`content/index.htm` gibi) dosyayi `sw.js` icindeki `APP_SHELL`
  listesine de ekle; boylece internet olmadan da acilir. `content/` klasorune birden fazla dosyali
  bir proje koyarsan (kendi css/js/gorsel dosyalari), o dosyalarin hepsini `APP_SHELL` listesine ekle.

## Icerik internet gerektiriyor mu?

`APP_MODE` (`index.htm`) icerigin baglantiya ne kadar bagimli oldugunu belirler:

```js
const APP_MODE = "online";   // Varsayilan.
// const APP_MODE = "offline";
```

- **`"online"`**: icerik internet gerektirir (bir web sitesi gibi). Baglanti yoksa icerik
  gizlenir, asagidaki "No internet connection" ekrani gosterilir.
- **`"offline"`**: icerik internetsiz de calisir (yerel bir sayfa, ya da kendini cache'leyen bir
  site). Baglanti yoksa icerik yine acilir, sadece bir toast ile internetin olmadigi bildirilir.

## Offline ekrani (`"online"` modu)

Metinler ve ikon `index.htm` basindaki degiskenlerde durur, kolayca degistirilir:

```js
const OFFLINE_TITLE = "No internet connection";
const OFFLINE_MESSAGE = "Please check your internet connection. ...";
const OFFLINE_BUTTON_TEXT = "Try again";
const OFFLINE_ICON_SVG = "<svg ...>";   // Dosya degil, SVG: offline da gorunur
```

Ekran; `window.online` / `offline` olaylarinda, web view zaman asiminda ve **Try again** butonunda
guncellenir. Baglanti gelince icerik kendiliginden yeniden yuklenir.

## Baglanti toast'i (`"offline"` modu)

Metinler ayni sekilde `index.htm` basinda durur:

```js
const NO_CONNECTION_TITLE = "No internet connection";
const NO_CONNECTION_MESSAGE = "You are offline. Some features may not work.";
```

Icerik acik kalir; baglanti kesildiginde (acilista veya `window.offline` olayinda) bu toast gorunur,
icerigi kapatmaz.

## Kurma (install)

Uygulama acilinca, alt ortada `Toast` ile kurulum mesaji cikar (`INSTALL_TOAST_DELAY` kadar sonra):

- **Chrome / Edge (masaustu), Android Chrome**: tarayici `beforeinstallprompt` olayini verir;
  toast icinde **Install** butonu gorunur, basilinca tarayicinin kurulum penceresi acilir.
  Masaustu bilgisayarlar `ALLOW_DESKTOP_INSTALL` (varsayilan `true`) ile acilip kapatilabilir;
  `false` yapilirsa toast sadece telefon/tablette (`isMobile()`) gorunur.
- **iOS Safari**: `beforeinstallprompt` desteklenmez. Kullanici icin **Add to Home Screen** basligiyla
  "Tap the Share button below, then choose Add to Home Screen." yazisi gosterilir.
  (iPad'de `navigator.maxTouchPoints` ile de kontrol edilir; iPadOS kendini "Macintosh" gosterir.)
  `ALLOW_DESKTOP_INSTALL`'dan etkilenmez.
- Uygulama zaten kurulu ve ana ekrandan aciliyorsa (`display-mode: standalone`) toast cikmaz.

Metinler yine ayarlar bolumundeki degiskenlerdedir (`INSTALL_TITLE`, `IOS_INSTALL_MESSAGE`...).
iOS icin gereken meta etiketleri (`apple-mobile-web-app-*`, `apple-touch-icon`) `index.htm` icinde hazirdir.

## Yeni surum yayinlama

Tarayici `sw.js` dosyasini onbellege alir; icerigi degismezse yeni dosyalari fark etmez.
Bu yuzden **her yayindan once** `sw.js` icindeki surum numarasini degistir:

```js
const CACHE_VERSION = "v1.0.1";
```

Sonra:

1. Eski cache silinir, dosyalar yeniden indirilir.
2. Acik olan sayfada **Update Available - Reload** butonu belirir.
3. Butona basilinca yeni surum devreye girer ve sayfa bir kez yenilenir.

Yeni bir dosya eklediysen (component, resim, ses...) `sw.js` icindeki `APP_SHELL` listesine de ekle.
Listede olmayan dosyalar ilk kez acildiklarinda onbellege alinir, ama offline ilk acilista bulunamazlar.

## Kendi uygulamana uyarlarken

1. `manifest.webmanifest`: `name`, `short_name`, `description`, `theme_color`, `background_color`.
2. `icon/` klasorundeki PNG'leri kendi ikonlarinla degistir (ayni isim ve olculerde).
   `icon-maskable-512.png` icin ikonun onemli kismi ortadaki %80'lik dairenin icinde kalmali.
3. `index.htm`: `<title>` ve `apple-mobile-web-app-title`.
4. `sw.js`: `CACHE_NAME` istersen degistirebilirsin, ama zorunlu degil - klasor yoluna gore
   otomatik farklilasir (bkz. Notlar, `APP_PATH`).

## Notlar

- `basic/` klasoru `../../basic/` icindekilerin kopyasidir. Ana kutuphane guncellenince
  bu kopya kendiliginden guncellenmez, yeniden kopyalaman gerekir.
- `USE_PAGE_FIT` (varsayilan `false`) kapaliyken icerik kutusu ekranin tamamini kaplar (`width: "100%"`).
  Acilirsa `page.fit(CONTENT_WIDTH, MAX_WIDTH)` ile devreye girer; icerik kutusu `CONTENT_WIDTH`'e
  sabitlenir ve `MAX_WIDTH`'e kadar buyutulup ortalanir.
- `page.fit()` govdeyi (body) olcekledigi icin, `position: fixed` calisan toast'lar ekranin disina
  dusuyordu. `fitBodyToPage()` govdeyi tasarim olculerine getirir; toast'lar alt ortada kalir.
  (Bu yuzden ikisi de `USE_PAGE_FIT` ile birlikte acilip kapanir.)
- `WebView`'in `content/index.htm` gibi yerel bir sayfa yuklemesi de tarayici icin bir "navigate"
  istegidir (iframe icinde olsa da). `sw.js` bu yuzden onbellek anahtari olarak hep istegin kendi
  URL'sini kullanir; sadece ust sayfanin (`destination: "document"`) hicbir kaydi yoksa
  `index.htm`'e duser. Boylece `content/` altindaki sayfa, ust `index.htm`'in onbellegini
  ezmeden dogru sekilde offline'da da acilir.
- Cache Storage klasore gore degil, **alan adina (origin) gore** ortaktir. Bu proje ile birden
  fazla site icin uygulama yapip aynen ayni alan adina (ornek: bir GitHub Pages hesabinin farkli
  repo'lari) kurarsan, `sw.js` icindeki `CACHE_NAME` klasor yoluna gore (`APP_PATH`) otomatik
  farklilasir; bir uygulamanin `activate` temizligi, digerinin cache'ini silmez. (Farkli alan
  adlarindaysa bu zaten bir sorun degildi, Cache Storage tamamen ayridir.)
- `comp/` icindeki bilesenler `../../comp-m4/` kopyalaridir. Ana klasor guncellenince bu kopyalar
  kendiliginden guncellenmez.
- Sayfa `viewport-fit=cover` ve `env(safe-area-inset-*)` kullanir; boylece tam ekran modda
  icerik telefonun centigi ve alt cubugunun altinda kalmaz.
