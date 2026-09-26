# basic.js Handbook — Website

The handbook that teaches basic.js, as a website: <https://bug7a.github.io/basic.js-handbook/>.
The whole page is drawn with **basic.js** in plain JavaScript: no framework, no build step, no CSS file.

The chapters are ordinary **Markdown** files. The site reads them, draws them, adds a menu, search and live examples,
and works offline as an installable app. So it is more than the basic.js handbook: **it can be a template for your
own documentation.** Put your Markdown files in, list them in one settings file and publish the folder. See
[Use it for your own docs](#use-it-for-your-own-docs).

**Türkçe açıklama aşağıda:** [Türkçe](#türkçe).

---

## Run it

Open the folder with a web server (VS Code Live Server: port 5505) and go to `index.htm`.
The chapters are read with `fetch`, so the page does not work as a file (`file://`); it shows a message in that case.

---

## Where the content comes from

The chapters are read from **Markdown** files and drawn with basic.js objects. The files are this site's copy of the
repository's `__handbook/english` and `__handbook/turkce` folders: `handbook/english`, `handbook/turkce`. To update the
handbook, edit the files in `__handbook`, then run `./_update-copies.sh` (see [Files](#files)).

The one exception is the **Quick Start** chapter: it explains how to set up an empty page and it is in
`js/texts.js` → `quickStart` (in both languages).

The order and the groups of the chapters in the menu: `js/config.js` → `chapters`.

---

## Features

- **Live examples:** Every JavaScript example that draws objects has a **Run** button. The code runs in the same place,
  as a small page with basic.js loaded (WebView, iframe). `console.log`, `println` and errors show up in the console
  under the example.
- **Editable code:** After the first run the code can be changed. Ctrl (Cmd) + Enter runs it again,
  Tab adds 4 spaces, **Reset** brings back the original code.
- Short examples without `window.onload` or `start()` are run inside a `start()` function.
  A piece that uses a variable of an earlier example can give an error; the console then shows a note.
- Relative file paths in the examples (`test.png`) are resolved against the handbook folder.
- **Search:** Searches the titles and the text of all chapters (comp-m4 `SearchResults`). `/` or Ctrl (Cmd) + K goes to the search box.
- **On this page:** On wide screens, the headings of the chapter on the right; the heading being read is marked.
- **Addresses:** `index.htm#/box` (a chapter), `index.htm#/box/examples` (a heading in a chapter). The browser's back button works.
- **Language:** The TR/EN button in the top bar. The choice is kept in `basic.storage`; on the first visit the page opens
  in Turkish if the browser language is Turkish.
- **Mobile:** Below 960 px the chapter list is a drawer opened with the menu button.
- File names like `02-box.md` in the Markdown become links to that chapter.

---

## Files

| File | Contents |
|---|---|
| `index.htm` | Loads the library, the components and the site files. SEO tags and the `<noscript>` content. |
| `js/config.js` | Settings: brand and logo, paths, chapter order, links, sizes, language, SEO address. |
| `js/texts.js` | Interface texts and the Quick Start chapter (`en` / `tr`). |
| `js/theme.js` | Colors, sizes, icons, button; a small style for the Markdown HTML (`.hb-text`). |
| `js/markdown.js` | Dependency-free Markdown parser (headings, paragraphs, lists, quotes, code, tables, inline formats). |
| `js/code-highlight.js` | JavaScript / HTML highlighter (a copy of `index/code-highlight.js` of the component site in the repository root). |
| `js/code-block.js` | Code blocks: Copy, Run, editing, console. |
| `js/doc-view.js` | Draws a chapter; "On this page", previous / next. |
| `js/layout.js` | Top bar (logo `assets/basicjs-handbook.svg`), chapter list (drawer), search box. |
| `js/site.js` | `start()`, reading the files, routing, language, search index. |

Components used: `WebView`, `SearchResults` (comp-m4, `.min.js`), `Toast` (comp-m4, source file) and `ScrollBar` (basic).

**The site works on its own:** the folder can be copied as it is to another place (for example to the root of the
`https://bug7a.github.io/basic.js-handbook/` repository) and published. It uses no other file of the repository; it
keeps copies of the files it needs:

| Folder | Its source (in the repository) |
|---|---|
| `basic/` | `basic/`: `basic.min.js`, `basic.min.css`, `scroll-bar.min.js`, `LICENSE`, `font/`, `img/` |
| `comp/` | `comp-m4/`: `web-view.min.js`, `search-results.min.js` and `toast.min.js` made from `toast.js` |
| `handbook/` | `__handbook/`: `english/`, `turkce/` (the chapters and the files of the examples, `test.png`…) |

The copies do not update themselves. When the library, these components or the handbook change, run
`./_update-copies.sh` (it works from anywhere; it uses `npx terser` for `toast.min.js`). The paths are in `js/config.js`
(`rootPath: "./"`, `handbookPath: "handbook/"`).

The folder is named `handbook` (not `__handbook`): GitHub Pages' Jekyll does not publish folders whose names start with `_`.

---

## Add a chapter

1. Add the Markdown file with the same name to `__handbook/english/` and `__handbook/turkce/` (first line `# basic.js — Title`).
2. Add a line to `js/config.js` → `chapters`: `{ id: "storage", file: "14-storage.md", group: "more" }`.
3. Run `./_update-copies.sh` (it copies the file and adds it to the offline list).

---

## Use it for your own docs

The site does not depend on what the chapters are about. With a few changes it becomes the website of your own
project's documentation: menu, search, "On this page", two languages, shareable addresses, an installable app that works
offline, SEO tags, and nothing to build.

1. **Copy the folder** (`webpage-handbook`) and give it your project's name.
2. **Your chapters:** put your Markdown files in `handbook/english/` and `handbook/turkce/` (the same file names in both
   languages). In your copy, `_update-copies.sh` overwrites these folders from `__handbook`: change its `HANDBOOK`
   part to your own source folder, or delete that part and edit `handbook/` directly.
3. **`js/config.js`:** `brandName`, `logoFile` (your logo in `assets/`), `chapters` (your files in menu order; `group`
   names come from `js/texts.js` → `groups`), `githubURL` / `componentsURL` (the links in the top bar), `siteURL`
   (your published address, or `""` until you know it), `defaultLanguage`.
4. **`js/texts.js`:** the interface texts and the menu groups. The Quick Start chapter (`file: ""` in `chapters`) comes
   from here: rewrite it for your project, or delete its line from `chapters`.
5. **`index.htm`:** the `<title>`, description, Open Graph tags, JSON-LD and the `<noscript>` content, so that search
   engines and link previews show your project. Replace `assets/og-image.jpg` (1200 × 630).
6. **The app:** `manifest.webmanifest` (name, short name, colors), the icons in `icon/`, and in `easy-pwa.js` →
   `SETTINGS` at least `appName` and `themeColor`. Then run `./_update-copies.sh` so the offline list has your files.
7. Publish the folder (GitHub Pages or any static host). It needs `https://`, or `localhost` while testing, for the app
   and the offline mode.

Good to know:

- **Run buttons** are made for basic.js: a JavaScript example gets one when it creates basic.js objects
  (`js/code-block.js` → `isRunnable`). Your other code blocks are shown highlighted with a **Copy** button.
- **Two languages** (`en`, `tr`) are built in: `languageFolders` in `js/config.js` names their folders. Another language
  needs small changes in `js/site.js` (the language button and the language check).
- The colors are in `js/theme.js`; the Markdown styles (`.hb-text`) are there too.

---

## App (PWA) and offline use

The handbook is an installable app and **opens without internet too**. The `easy-pwa.js` file of
`04-template-m2/easy-pwa` does this (one file with no library; it is both the page script and the service worker).

| File | Contents |
|---|---|
| `easy-pwa.js` | A copy of easy-pwa set up for this site. The settings are at the top (`SETTINGS`). |
| `manifest.webmanifest` | The app's name ("basic.js Handbook", short name "Handbook"), colors, icons. Relative addresses (`./`). |
| `icon/` | 192, 512, maskable 512 and 180 px (iOS) icons. |

Settings: `offlineMode: true` (network first: with internet every file comes from the network and its saved copy is
renewed; without internet the saved copy is used), `theme: "light"`, a launch screen (`launchScreen`, only in the
installed app; `launchScreenHideByCode: true`: `js/site.js` → `SiteApp.hideLaunchScreen()` closes it when the chapters
are drawn), accent color `#2F6FEB`.

**`offlineFiles`:** the files saved at the first visit: every file of the site (all chapters in both languages, the
files of the examples, the logo, `basic/`, `comp/`, `js/`). So everything opens offline even if the visitor never
switched to Turkish or ran an example. The list is not written by hand: every run of `./_update-copies.sh` rewrites it
between `OFFLINE FILES START` / `END` in `easy-pwa.js`. **Run `./_update-copies.sh` after adding a chapter.**

**If easy-pwa is updated:** copy the new `easy-pwa.js` here, write this site's settings back into `SETTINGS` (the ones
above and the `OFFLINE FILES` markers), then run `./_update-copies.sh`.

Test: DevTools > Application > Service workers, then Network > **Offline**: the chapters, search and live examples keep
working. To see the launch screen in the browser, set `launchScreenInBrowser: true` for a while.

---

## SEO

- **The language is in the address:** the default language is the address itself, the other one opens with
  `?lang=tr` / `?lang=en` (`js/site.js` → `loadLanguage`). When the language changes the address changes too, so a
  copied link opens in the same language. Search engines read the two languages at separate addresses.
- **`CONFIG.siteURL`** (`js/config.js`): the published address of the page. With it, the page adds its `canonical`,
  `hreflang` (tr / en / x-default) and `og:url` tags itself. Once the address is known, also write the full address
  into `og:image` in `index.htm` (link previews do not run JavaScript).
- **`index.htm`:** sharing tags (Open Graph, `summary_large_image`) and JSON-LD (schema.org) in `<head>`; the
  `<noscript>` part in `<body>` gives the page's content as plain HTML. Both were made from the texts in `js/texts.js`
  (in the default language): update them when the texts change. The chapter list comes from `js/config.js` and the
  titles in `__handbook/english`.
- **`assets/og-image.jpg`:** the link preview picture (1200 × 630), the first screen of the page.

---
---

# Türkçe

## basic.js El Kitabı — Web Sitesi

basic.js'i öğreten el kitabının web sitesi hali: <https://bug7a.github.io/basic.js-handbook/>.
Sayfanın tamamı **basic.js** ile, saf JavaScript ile çizilir: framework, derleme adımı ve CSS dosyası yoktur.

Bölümler sıradan **Markdown** dosyalarıdır. Site onları okur, çizer; menü, arama ve canlı örnekler ekler ve kurulabilir
bir uygulama olarak internetsiz de çalışır. Yani sadece basic.js el kitabı değildir: **kendi dokümanlarınız için bir
şablon olarak da kullanılabilir.** Markdown dosyalarınızı koyun, tek bir ayar dosyasında listeleyin ve klasörü yayınlayın.
Bkz. [Kendi dokümanlarınız için kullanmak](#kendi-dokümanlarınız-için-kullanmak).

---

## Çalıştırmak

Klasörü bir web sunucusu ile açın (VS Code Live Server: port 5505) ve `index.htm` sayfasına gidin.
Bölümler `fetch` ile okunduğu için sayfa dosya olarak (`file://`) açılırsa çalışmaz; sayfa bunu bir mesajla bildirir.

---

## İçerik nereden geliyor?

Bölümler **Markdown** dosyalarından okunur ve basic.js nesneleriyle çizilir. Dosyalar, deponun `__handbook/english` ve
`__handbook/turkce` klasörlerinin bu sitedeki kopyasıdır: `handbook/english`, `handbook/turkce`. El kitabını
güncellemek için `__handbook` içindeki dosyaları düzenleyin, sonra `./_update-copies.sh` çalıştırın (bkz. [Dosyalar](#dosyalar)).

Tek istisna **Hızlı Başlangıç** bölümüdür: boş bir sayfanın nasıl kurulacağını anlatır ve `js/texts.js` → `quickStart`
içindedir (iki dilde).

Bölümlerin menüdeki sırası ve grupları: `js/config.js` → `chapters`.

---

## Özellikler

- **Canlı örnekler:** Ekrana nesne çizen her JavaScript örneğinin üstünde **Çalıştır** düğmesi vardır. Kod, basic.js
  yüklü küçük bir sayfa olarak aynı yerde (WebView, iframe) çalışır. `console.log`, `println` ve hatalar örneğin
  altındaki konsolda görünür.
- **Düzenlenebilir kod:** İlk çalıştırmadan sonra kod değiştirilebilir. Ctrl (Cmd) + Enter tekrar çalıştırır,
  Tab 4 boşluk ekler, **Sıfırla** kodu ilk haline döndürür.
- `window.onload` veya `start()` içermeyen kısa örnekler, bir `start()` fonksiyonunun içine konularak çalıştırılır.
  Daha önceki bir örneğin değişkenini kullanan parçalar hata verebilir; bu durumda konsolda bir not çıkar.
- Örneklerdeki göreli dosya yolları (`test.png`) el kitabı klasörüne göre çözülür.
- **Arama:** Bütün bölümlerin başlık ve metinlerinde arar (comp-m4 `SearchResults`). `/` veya Ctrl (Cmd) + K arama kutusuna gider.
- **Bu sayfada:** Geniş ekranda sağda, bölümün başlıkları; okunan başlık işaretlenir.
- **Adresler:** `index.htm#/box` (bölüm), `index.htm#/box/examples` (bölümdeki başlık). Tarayıcının geri düğmesi çalışır.
- **Dil:** Üst çubuktaki TR/EN düğmesi. Seçim `basic.storage` içinde saklanır; ilk girişte tarayıcı dili Türkçe ise Türkçe açılır.
- **Mobil:** 960 px altında bölüm listesi, menü düğmesiyle açılan bir çekmecedir.
- Markdown içindeki `02-box.md` gibi dosya adları, o bölüme bağlantı olur.

---

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.htm` | Kütüphane, bileşen ve site dosyalarını yükler. SEO etiketleri ve `<noscript>` içeriği. |
| `js/config.js` | Ayarlar: marka ve logo, yollar, bölüm sırası, bağlantılar, ölçüler, dil, SEO adresi. |
| `js/texts.js` | Arayüz yazıları ve Hızlı Başlangıç bölümü (`en` / `tr`). |
| `js/theme.js` | Renkler, ölçüler, ikonlar, düğme; Markdown HTML'i için küçük stil (`.hb-text`). |
| `js/markdown.js` | Bağımlılıksız Markdown ayrıştırıcı (başlık, paragraf, liste, alıntı, kod, tablo, satır içi biçimler). |
| `js/code-highlight.js` | JavaScript / HTML renklendirici (ana dizindeki bileşen sitesinin `index/code-highlight.js` dosyasının kopyası). |
| `js/code-block.js` | Kod blokları: Kopyala, Çalıştır, düzenleme, konsol. |
| `js/doc-view.js` | Bölümü çizer; "Bu sayfada", önceki / sonraki. |
| `js/layout.js` | Üst çubuk (logo `assets/basicjs-handbook.svg`), bölüm listesi (çekmece), arama kutusu. |
| `js/site.js` | `start()`, dosyaları okuma, adres yönlendirme, dil, arama dizini. |

Kullanılan bileşenler: `WebView`, `SearchResults` (comp-m4, `.min.js`), `Toast` (comp-m4, kaynak dosya) ve `ScrollBar` (basic).

**Site kendi içinden çalışır:** Klasör olduğu gibi başka bir yere (ör. `https://bug7a.github.io/basic.js-handbook/`
reposunun köküne) kopyalanıp yayınlanabilir. Deponun başka hiçbir dosyasını kullanmaz; gereken dosyaların kopyası içindedir:

| Klasör | Kaynağı (depoda) |
|---|---|
| `basic/` | `basic/`: `basic.min.js`, `basic.min.css`, `scroll-bar.min.js`, `LICENSE`, `font/`, `img/` |
| `comp/` | `comp-m4/`: `web-view.min.js`, `search-results.min.js` ve `toast.js`'ten yapılan `toast.min.js` |
| `handbook/` | `__handbook/`: `english/`, `turkce/` (bölümler ve örneklerin dosyaları, `test.png`…) |

Kopyalar kendiliğinden güncellenmez. Kütüphane, bu bileşenler veya el kitabı değişince `./_update-copies.sh`
çalıştırın (her yerden çalışır; `toast.min.js` için `npx terser` kullanır). Yollar `js/config.js` içindedir
(`rootPath: "./"`, `handbookPath: "handbook/"`).

Klasörün adı `handbook`'tur (`__handbook` değil): GitHub Pages'in Jekyll'ı, adı `_` ile başlayan klasörleri yayınlamaz.

---

## Yeni bir bölüm eklemek

1. `__handbook/english/` ve `__handbook/turkce/` içine aynı adla Markdown dosyasını ekleyin (ilk satır `# basic.js — Başlık`).
2. `js/config.js` → `chapters` listesine bir satır ekleyin: `{ id: "storage", file: "14-storage.md", group: "more" }`.
3. `./_update-copies.sh` çalıştırın (dosyayı kopyalar ve çevrimdışı listesine ekler).

---

## Kendi dokümanlarınız için kullanmak

Site, bölümlerin ne anlattığına bağlı değildir. Birkaç değişiklikle kendi projenizin dokümanlarının web sitesi olur:
menü, arama, "Bu sayfada", iki dil, paylaşılabilir adresler, internetsiz çalışan kurulabilir bir uygulama, SEO
etiketleri ve hiçbir derleme adımı olmadan.

1. **Klasörü kopyalayın** (`webpage-handbook`) ve projenizin adını verin.
2. **Bölümleriniz:** Markdown dosyalarınızı `handbook/english/` ve `handbook/turkce/` içine koyun (iki dilde aynı dosya
   adlarıyla). Kopyanızda `_update-copies.sh` bu klasörleri `__handbook`'tan yeniden yazar: script'teki `HANDBOOK`
   bölümünü kendi kaynak klasörünüze çevirin veya o bölümü silip `handbook/` içini doğrudan düzenleyin.
3. **`js/config.js`:** `brandName`, `logoFile` (`assets/` içindeki logonuz), `chapters` (menü sırasıyla dosyalarınız;
   `group` adları `js/texts.js` → `groups` içindedir), `githubURL` / `componentsURL` (üst çubuktaki bağlantılar),
   `siteURL` (yayın adresiniz; bilinene kadar `""`), `defaultLanguage`.
4. **`js/texts.js`:** Arayüz yazıları ve menü grupları. Hızlı Başlangıç bölümü (`chapters` içinde `file: ""`) buradan
   gelir: projeniz için yeniden yazın veya satırını `chapters` listesinden silin.
5. **`index.htm`:** `<title>`, açıklama, Open Graph etiketleri, JSON-LD ve `<noscript>` içeriği; böylece arama motorları
   ve bağlantı önizlemeleri sizin projenizi gösterir. `assets/og-image.jpg` resmini değiştirin (1200 × 630).
6. **Uygulama:** `manifest.webmanifest` (ad, kısa ad, renkler), `icon/` içindeki ikonlar ve `easy-pwa.js` → `SETTINGS`
   içinde en az `appName` ve `themeColor`. Sonra çevrimdışı listesi sizin dosyalarınızı içersin diye
   `./_update-copies.sh` çalıştırın.
7. Klasörü yayınlayın (GitHub Pages veya herhangi bir statik sunucu). Uygulama ve çevrimdışı çalışma için `https://`
   (denerken `localhost`) gerekir.

Bilmekte fayda var:

- **Çalıştır düğmeleri** basic.js için yapılmıştır: basic.js nesnesi oluşturan JavaScript örnekleri bu düğmeyi alır
  (`js/code-block.js` → `isRunnable`). Diğer kod bloklarınız renklendirilmiş olarak, **Kopyala** düğmesiyle gösterilir.
- **İki dil** (`en`, `tr`) hazırdır: klasörlerinin adı `js/config.js` içindeki `languageFolders`'tadır. Başka bir dil
  için `js/site.js` içinde küçük değişiklikler gerekir (dil düğmesi ve dil kontrolü).
- Renkler `js/theme.js` içindedir; Markdown stilleri (`.hb-text`) de oradadır.

---

## Uygulama (PWA) ve çevrimdışı çalışma

El kitabı kurulabilir bir uygulamadır ve **internet yokken de açılır**. Bunu `04-template-m2/easy-pwa` klasörünün
`easy-pwa.js` dosyası yapar (kütüphanesiz tek dosya; hem sayfa script'i hem service worker).

| Dosya | İçerik |
|---|---|
| `easy-pwa.js` | easy-pwa'nın bu siteye ayarlanmış kopyası. Ayarlar en üstte (`SETTINGS`). |
| `manifest.webmanifest` | Uygulamanın adı ("basic.js Handbook", kısa adı "Handbook"), renkleri, ikonları. Adresleri göreli (`./`). |
| `icon/` | 192, 512, maskable 512 ve iOS için 180 px ikonlar. |

Ayarlar: `offlineMode: true` (önce ağ: internet varken her dosya ağdan gelir ve kaydı yenilenir, yokken kayıtlı olan
kullanılır), `theme: "light"`, açılış ekranı (`launchScreen`, sadece kurulu uygulamada; `launchScreenHideByCode: true`:
bölümler çizilince `js/site.js` → `SiteApp.hideLaunchScreen()` kapatır), vurgu rengi `#2F6FEB`.

**`offlineFiles`:** İlk ziyarette kaydedilen dosyalar: sitenin bütün dosyaları (iki dilin bütün bölümleri, örneklerin
dosyaları, logo, `basic/`, `comp/`, `js/`). Böylece ziyaretçi Türkçeye geçmeden veya bir örneği çalıştırmadan da hepsi
çevrimdışı açılır. Liste elle yazılmaz: `./_update-copies.sh` her çalıştığında `easy-pwa.js` içindeki
`OFFLINE FILES START` / `END` arasına yeniden yazar. **Yeni bir bölüm ekledikten sonra `./_update-copies.sh` çalıştırın.**

**easy-pwa güncellenirse:** Yeni `easy-pwa.js`'i buraya kopyalayın, `SETTINGS`'teki bu sitenin ayarlarını
(yukarıdakiler ve `OFFLINE FILES` işaretleri) geri yazın, sonra `./_update-copies.sh` çalıştırın.

Test: DevTools > Application > Service workers, sonra Network > **Offline**: bölümler, arama ve canlı örnekler
çalışmaya devam eder. Açılış ekranını tarayıcıda görmek için geçici olarak `launchScreenInBrowser: true`.

---

## SEO

- **Dil adreste:** Varsayılan dil adresin kendisidir, diğer dil `?lang=tr` / `?lang=en` ile açılır (`js/site.js` → `loadLanguage`).
  Dil değişince adres de değişir; kopyalanan bağlantı aynı dilde açılır. Arama motoru iki dili ayrı adreslerde okur.
- **`CONFIG.siteURL`** (`js/config.js`): Sayfanın yayın adresi. Yazılınca sayfa `canonical`, `hreflang` (tr / en / x-default)
  ve `og:url` etiketlerini kendisi ekler. Adres belli olunca `index.htm` içindeki `og:image` değerini de tam adres yapın
  (bağlantı önizlemeleri JavaScript çalıştırmaz).
- **`index.htm`:** `<head>` içinde paylaşım etiketleri (Open Graph, `summary_large_image`) ve JSON-LD (schema.org) var;
  `<body>` içindeki `<noscript>` bölümü sayfanın içeriğini düz HTML olarak verir. İkisi de `js/texts.js`'teki
  (varsayılan dildeki) metinlerden yapıldı: metinler değişince bunları da güncelleyin. Bölüm listesi `js/config.js`
  ve `__handbook/english` başlıklarından gelir.
- **`assets/og-image.jpg`:** Bağlantı önizleme resmi (1200 × 630), sayfanın ilk ekranı.
