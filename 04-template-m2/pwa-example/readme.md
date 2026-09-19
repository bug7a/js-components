# PWA Example

`index.htm` sayfasinin **Progressive Web App** (kurulabilir, offline calisan web uygulamasi) surumu.
basic.js ile yazilmistir, build araci veya paket yoneticisi gerektirmez.

## Klasordeki dosyalar

| Dosya | Ne ise yarar |
|---|---|
| `index.htm` | Uygulama sayfasi. PWA meta etiketleri, service worker kaydi, "Install" ve "Update" butonlari burada. |
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
   basliktaki durum satiri `Offline (running from cache)` yazmali.

## Kurma (install)

- **Chrome / Edge (masaustu)**: adres cubugundaki kurulum simgesi veya sayfadaki **Install App** butonu.
- **Android Chrome**: menu > "Uygulamayi yukle" veya **Install App** butonu.
- **iOS Safari**: `beforeinstallprompt` olayi desteklenmez, bu yuzden **Install App** butonu cikmaz.
  Kullanici **Paylas > Ana Ekrana Ekle** yapmalidir. iOS icin gereken meta etiketleri
  (`apple-mobile-web-app-*`, `apple-touch-icon`) `index.htm` icinde hazirdir.

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
4. `sw.js`: `CACHE_NAME` on ekini degistirirsen, `activate` icindeki temizleme satirindaki
   `"mobile-fit-skeleton-"` on ekini de ayni yap.

## Notlar

- `basic/` klasoru `../../basic/` icindekilerin kopyasidir. Ana kutuphane guncellenince
  bu kopya kendiliginden guncellenmez, yeniden kopyalaman gerekir.
- `page.fit(600, 800)` icerigi 600px tasarim genisliginde tutar, 800px'e kadar buyutur.
- Sayfa `viewport-fit=cover` ve `env(safe-area-inset-*)` kullanir; boylece tam ekran modda
  icerik telefonun centigi ve alt cubugunun altinda kalmaz.
