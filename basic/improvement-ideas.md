# basic.js: iyileştirme fikirleri

2026-10-22, basic.js v26.09.18 okunarak yazıldı. Bunlar karar verilmiş işler değil, öneriler. Satır numaraları o günkü `basic.js` içindir; kod değiştikçe kayabilir, bu yüzden fonksiyon adları da yazıldı.

## Genel değerlendirme

basic.js'te hantal ya da yanlış kurulmuş bir yapı yok. Bir nesne, birkaç style yazan ince bir sarmalayıcı: ara katman yok, virtual DOM yok. `remove()` zinciri ve `ResizeObserver` kaydı (`resizeDetection`, `Map` ile) düzgün. Nesnelerle arayüz kurmak için yeterince iyi.

Canvas / WebGL ile tüm nesneleri çizen bir kütüphane, genel arayüz için daha hızlı olmaz. `Input`, erişilebilirlik, metin seçme ve `elem`'e dokunan bileşenler kaybolur. Canvas / WebGL, gerektiği yerde bir Box'ın içine katman olarak konur. Fishing Company Tycoon'daki `sea-effect.js` bunun örneği: basic.js'te hiçbir değişiklik gerekmedi.

Aşağıdaki maddeler önem sırasına göre dizildi. **Önce ölçmek** doğru olur: kütüphaneye ancak fark ölçülürse dokunulmalı.

---

## 1. Okuyan getter'lar gizli reflow yapıyor (en önemlisi)

**Nerede:** `Basic_UIComponent`:
- `get width()` / `get height()` (~satır 599 / 624): değer string ise (`"100%"`, `"auto"`, `"calc(...)"`) `elem.offsetWidth` / `offsetHeight` okuyor.
- `get left()` / `get top()` (~satır 505 / 518): nesne absolute değilse (flex grup içinde) `offsetLeft` / `offsetTop` okuyor.
- `moveToCenter`, `moveToCenterBy`, `moveToAline` (`center()`, `centerBy()`, `aline()`) bunları okuyor.

**Sorun:** Kodda yazma ve okuma iç içe geçince (bir değer yaz, `center()` ile oku, tekrar yaz) tarayıcı her okumada layout'u yeniden hesaplamak zorunda kalıyor (layout thrashing / forced reflow). `box.width` bazen ücretsiz (sayı), bazen pahalı (string): kullanan kişi bunu bilmiyor. Fishing Company Tycoon'da en büyük betik maliyeti tam bu desendi (`MapView.getView`: aynı frame'de DOM'a yazıldıktan sonra `scrollLeft` / `clientWidth` okuyordu).

**Öneriler:**
- Handbook'a (`__handbook/english` + `turkce`) ve `basic-v26.09.18.md`'ye kısa bir not: "string genişlikli bir nesnede `width` / `height` okumak bir layout ölçümüdür; döngü içinde yazma ve okumayı karıştırma, önce hepsini oku, sonra yaz".
- İstenirse bir yardımcı: `basic.measure(readFn, writeFn)`. Okumaları bir arada yapar, yazmaları sonra yapar (ya da bir sonraki `requestAnimationFrame`'e bırakır). Yeni bir global olmamalı, `basic.` altında durmalı.
- Seçenek (daha riskli): string boyutlar için frame başına önbellek. Getter'ın anlamını değiştirdiği için önerilmez.

## 2. Hareket `left / top / width` üzerinden yapılıyor

**Nerede:** `setMotion("left 0.3s, top 0.3s")`, `animate({ left: 100 })`, handbook örnekleri.

**Sorun:** `left`, `top`, `width`, `height` animasyonu her frame'de layout çalıştırır. `transform` ve `opacity` ise yalnızca GPU'da birleştirilir (compositing). Birkaç nesnede fark edilmez, onlarca kayan kartta ya da zayıf telefonda takılma yapar.

**Öneriler:**
- `translate` kullanan özellikler eklemek: ör. `x` / `y` (isimler bileşen default'larıyla çakışmamalı; CLAUDE.md kuralı: `scale`, `hint`, `parent`, `shadow`, `image` gibi adlar kullanılmaz).
- **Bağlı bir hata:** `set rotate()` (~satır 621) `elem.style.transform`'un tamamını eziyor (`"rotate(...)"`). Bu yüzden rotate ile başka bir transform (translate, scale) birlikte kullanılamıyor. Yeni özelliklerle birlikte tek bir **transform birleştiricisi** gerekir: `_rotate`, `_tx`, `_ty`, ... saklanır, her değişiklikte tek bir `transform` string'i yazılır.
- Handbook'ta hareket örneklerini mümkün olduğunca `opacity` / transform tabanlı göstermek.

**Dikkat:** `transform` kullanan bileşenler yeni özellikle çakışabilir (`comp-m4/ui-effects.js` `press` lift / push, `hover` tilt; `comp-m4/page-control.js`; CSS animasyonlu bileşenler). Değişiklikten sonra `test/components-test.htm` de çalıştırılmalı.

## 3. `setMotion` / `withMotion` / `dontMotion` sabit `setTimeout` ile çalışıyor

**Nerede:** ~satır 1247-1295; `motionController.WITH_MOTION_TIME = 50`, `DONT_MOTION_TIME = 40` (~satır 89-90).

**Sorun:** Bu bir zamanlama hilesi. Yavaş bir makinede 40 ms yetmeyebilir (geçiş atlanır ya da yanlış yerden başlar), hızlı bir makinede gereksiz bir gecikme oluyor. `animate()` ise doğru yöntemi kullanıyor (~satır 1037: `void elem.offsetWidth` ile reflow zorlayıp hemen başlıyor).

**Öneri:** `setMotion` / `withMotion` / `dontMotion`'ı da aynı yönteme (reflow zorlama) ya da çift `requestAnimationFrame`'e taşımak. Hem daha güvenilir hem daha hızlı hissettirir.

**Dikkat:** Bu bir davranış değişikliği: eski sayfalar 40-50 ms'lik gecikmeye güvenmiş olabilir. `test/basic-test.htm` ve hareketli bileşenlerin örnek sayfalarıyla denenmeli.

## 4. `text` = `innerHTML`

**Nerede:** `Label`, `Box`, `Button` `text` setter'ları (`innerHTML`).

**Sorun:** Hız açısından önemli değil, ama her atamada HTML ayrıştırılıyor ve kullanıcıdan gelen veride XSS riski var. `plainText` (v26.09.18) bu yüzden eklendi.

**Öneri:** Handbook'ta "kullanıcıdan / sunucudan gelen veride `plainText` kullan" kuralını öne çıkarmak. `text`'in davranışını değiştirmek önerilmez (bütün kod HTML'e güveniyor).

## 5. Oluşturma maliyeti (küçük)

**Nerede:** `mergeIntoIfMissing` (her bileşen örneğinde default'ların derin kopyası), `setProparties` / `props()` (her prop tek tek setter'dan geçiyor).

**Sorun:** Normal sayfalarda önemsiz. Yüzlerce satırlık listelerde ölçülebilir hale gelir.

**Öneri:** Kütüphanede değişiklik gerekmiyor. Uzun listelerde asıl çözüm sanal liste (yalnızca görünen satırları oluşturmak): bu bileşenin işi, kütüphanenin değil.

---

## Bileşenleri sadeleştirecek eklemeler

2026-10-22'de `comp-m4/tabs.js` incelenirken çıktı. Bu ikisi hız sorunu değil: bileşen kodundaki tekrarı azaltmak için.

## 6. `basic.addCss(id, cssText)`: CSS'i bir kez ekleyen ortak yardımcı

**YAPILDI (2026-10-23):** `basic.addCss(id, css, replace)` basic.js'te (bkz. 10. madde). Bileşenlerin kendi kopyaları dokunuldukça buna geçecek.

**Nerede:** Bileşenlerin kendi kopyaları: `Tabs.injectCss`, `RichTextEditor.injectCss` ve `comp-m4/tag-input.js`, `loading-screen.js`, `web-view.js`, `ui-standards.js`, `comp-m2/search-input-v2.js` içinde `document.createElement("style")` kodu (7 dosya).

**Sorun:** Her bileşen aynı 6-8 satırı yazıyor: id ile "zaten var mı?" kontrolü, `<style>` oluşturma, `head`'e ekleme. basic.js'in `css` özelliği yalnızca satır içi (inline) stil yazar. Sözde elemanlar (`::-webkit-scrollbar`, `::placeholder`), `@keyframes`, `:hover` ve `contenteditable` içeriğinin stilleri satır içi yazılamaz, bu yüzden bu kopyalar gerekiyor.

**Öneri:**
```js
// Adds a <style> once (the same id again: nothing happens). Returns the element.
basic.addCss = function ($id, $cssText) { ... };
// USAGE: basic.addCss("tabs-css", ".tabs-strip::-webkit-scrollbar { display: none; }");
```
- `basic.` altında durur, yeni global eklemez (CLAUDE.md kuralı).
- İstenirse ikinci bir çağrı aynı id'nin içeriğini güncelleyebilir (`basic.addCss(id, css, { replace: 1 })`). Tema değiştiren `ui-standards.js` bunu kullanabilir.
- Not: `Tabs.injectCss`'in tek işi şeridin kaydırma çubuğunu gizlemek ve bu artık satır içi yapılabiliyor: `box.strip.css = { scrollbarWidth: "none", scrollBehavior: "smooth" }`. `scrollbar-width` Chrome 121+, Firefox ve Safari 18.2+ sürümlerinde çalışıyor; daha eski Safari'de ince bir çubuk görünür (Safari'de denenmedi). Yani Tabs bu yardımcıya muhtaç değil. `addCss`'in asıl kazancı gerçekten sözde eleman ya da `@keyframes` isteyen diğer bileşenlerde.

## 7. (İsteğe bağlı) `basic.mergeParams(params, defaults, styles)`: stil paketiyle parametre birleştirme

**Kısa yazım UYGULANDI (2026-10-23):** comp-m4'ün 13 bileşeni, şablon ve `designs/new-component` 3 satırlık kısa yazımla (`mergeIntoIfMissing(params, { style: paket })`). `basic.mergeParams` eklenmedi: gerek görülmedi.

**Nerede:** Stil paketi olan 15 bileşenin ilk satırları (`grep -l "Style package not found" comp-m*/*.js`):
```js
const _styleName = params.styleName || TabsDefaults.styleName;
const _stylePackage = Tabs.styles[_styleName];
if (!_stylePackage) console.warn("Tabs: Style package not found: " + _styleName);
params.style = params.style || {};
mergeIntoIfMissing(params.style, _stylePackage || {});
mergeIntoIfMissing(params, TabsDefaults);
```

**Sorun:** Bu satırlar derinlik sınırı yüzünden değil (`mergeIntoIfMissing` Ekim 2026'dan beri 4. seviyeden derini referansla ekliyor ve stiller zaten o kadar derin değil). Sebep üç katmanlı öncelik: `params.style` > `Xxx.styles[styleName]` > `XxxDefaults.style`. Tek bir birleştirme ortadaki katmanı araya koyamıyor.

**Öneri:** Önce basic.js'e dokunmadan: `mergeIntoIfMissing` yalnızca eksikleri doldurduğu için paketi önce `{ style: paket }` olarak birleştirmek aynı sonucu verir. 6 satır 2-3 satıra iner:
```js
const pkg = Tabs.styles[params.styleName || TabsDefaults.styleName];
if (!pkg) console.warn("Tabs: Style package not found: " + params.styleName);
mergeIntoIfMissing(params, { style: pkg || {} });  // params.style > package
mergeIntoIfMissing(params, TabsDefaults);          // > TabsDefaults.style
```
Daha da kısası, istenirse bir yardımcı: `basic.mergeParams(params, TabsDefaults, Tabs.styles)` (iki birleştirme ve uyarı tek çağrıda). 15 bileşenin başı aynı tek satıra iner. Şart değil: yukarıdaki 2-3 satır da yeterince açık. Yardımcı eklenirse adı bir bileşen default'uyla ya da basic.js setter'ıyla çakışmamalı.

**Dikkat (ikisi için de):** basic-designer'ın `runtime.js`'i bileşen parametrelerini `mergeIntoIfMissing(params, XxxDefaults)` çağrısından yakalıyor ve stil paketini, paketle yapılan birleştirmeyi tanıyarak ayırıyor. 7. madde yapılırsa (özellikle `basic.mergeParams` ile birleştirme basic.js'in içine taşınırsa) runtime'ın bu yakalaması da güncellenmeli.

## 8. Kısa global adların bileşenler için güvenli kopyaları (`basic.random`, `basic.black`...)

2026-10-22: global fonksiyonların listesi çıkarılırken konuşuldu. Açık bir fikir, karar verilmedi.

**Nerede:** basic.js'in `window` üzerine koyduğu kısa adlar: `random`, `num`, `str`, `go`, `Black`, `White`, `println`, `waitAndRun`... (toplam 46 global fonksiyon, 12'si yardımcı).

**Sorun:** Kısa adlar bilinçli bir tercih ve sayfalarda kalmalı: doğrudan `Black(0.4)`, `random(1, 6)` yazmak basic.js'in kolaylığının bir parçası. Ama bir sayfa aynı adla kendi `const random = ...` tanımlarsa, o ad o adı kullanan **bileşenlere** sızar ve onları bozar (CLAUDE.md'deki örnek: bir sayfanın `const createButton`'ı `Button()`'ı sonsuz döngüye soktu). basic.js'in kendisi etkilenmez, çünkü kendi içinde bu fonksiyonları kapsamındaki kopyalarıyla çağırıyor.

**Öneri:** Aynı fonksiyonların `basic.` altında ikinci bir yolu olsun:
```js
basic.random = random;   // window.random ile aynı fonksiyon
basic.black = Black;     // (adlandırma: basic.Black mı basic.black mı, karar verilmeli)
basic.white = White;
// num, str, println, waitAndRun...
```
- **Sayfalar** kısa adları kullanmaya devam eder, hiçbir şey değişmez.
- **Bileşenler** (`comp-m2/m3/m4`) güvenli olanı kullanır: `basic.black(0.4)`. Böylece bir sayfanın tanımladığı ad hiçbir bileşeni bozamaz.
- Kısa adlar kaldırılmaz, yeni global eklenmez.

**Dikkat:**
- `basic.` altındaki mevcut adlarla çakışmamalı (bugün: `storage`, `time`, `date`, `sleep`, `nextFrame`, `clamp`, `lerp`, `objectOf`, `escapeHtml`...).
- Bileşenlerin geçişi kademeli olabilir: yeni bileşenler baştan `basic.` ile yazılır, eskiler dokunuldukça değişir. Hepsini birden değiştirmek gerekmez.
- Bileşen yazım kuralı (CLAUDE.md, `_component-template.js`) buna göre güncellenmeli: "bileşen içinde basic.js yardımcılarını `basic.` ile çağır".
- Tamamlayıcı bir fikir (ayrı karar): basic.js `start()` öncesinde sayfanın `random`, `Black`, `Button` gibi bir adı yeniden tanımlayıp tanımlamadığına bakıp konsolda uyarabilir. Hiçbir şeyi değiştirmez, çakışmayı görünür kılar.

## 9. Eski `create*` global adlarını kaldırmak (`createButton` → `Button`)

2026-10-22: Bugra'nın kararı: standart artık `Box`, `Label`, `Button`, `Input`, `Icon`; `create*` kullanımı uzun zaman önce bırakıldı, yalnızca geriye dönük destek için duruyor ve **değiştirilebilir**. Sebep: `createButton` gibi adlar sayfaların ve bileşenlerin kendi yardımcıları için çok seçilen adlar.

**Nerede:** basic.js'in `window` üzerine koyduğu 7 eski ad: `createBox` (1653), `createLabel` (2174), `createButton` (1789), `createTextBox` (2040), `createInput` (2041), `createImage` (2396), `createIcon` (2397). (Satırlar v26.09.18.)

**Ölçüm (2026-10-22):**
- `comp-m2/m3/m4` bileşenlerinin **hiçbiri** bu global adları çağırmıyor.
- Buna karşılık **26 yer kendi `createButton`'ını tanımlıyor** (admin panel modülleri `module7/9/10/11`, `comp-m4/stepper.js`, `comp-m4/label-editor.js`, `comp-m3/bottom-bar.js`...). `createLabel` 5, `createInput` 5 yerde aynı şekilde yeniden tanımlanıyor. Yani bu adlar gerçekten çok seçiliyor.
- Bugün zararsız, çünkü basic.js kendi içinde bunları kapsamındaki kopyalarıyla çağırıyor ve hiçbir bileşen global adı kullanmıyor. Ama ad `window`'da durdukça, bir sayfanın kendi `createButton`'ı o adı arayan herhangi bir kodu (eski bir sayfa, bir eklenti) sessizce bozabilir.
- Eski adları çağıran sayfalar var: çoğu `01-basic-samples-m1` (öğretici sayfalar), `comp-m1` ve eski şablonlar. Sayım yaklaşık: `createBox` 40, `createButton` 35, `createLabel` 28, `createImage` 25 dosyada geçiyor; bunların bir kısmı yukarıdaki kendi tanımları ve dokümanlar.

**Öneri: iki adımda**
1. **Bir sonraki sürüm: kullanımdan kalktı uyarısı.** `window.createButton` ve diğerleri durur, ama ilk çağrıldıklarında konsola bir kez uyarı yazar: `basic.js: createButton() is old, use Button() (the same, with props).` Eski sayfalar çalışmaya devam eder. Aynı fonksiyonlar istenirse `basic.createButton` gibi `basic.` altında da tutulabilir (bileşen yazarları için açık bir yol).
2. **Sonraki sürüm: `window` adlarını kaldırmak.** Uyarı süresince sayfalar taşındıktan sonra `window.create*` silinir. Ad boşalır; sayfalar ve bileşenler kendi `createButton`'larını rahatça kullanır.

**Sayfaları taşımak kolay**, çünkü `Box = withProps(createBox)`: props verilmediğinde ikisi aynı.
| Eski | Yeni |
|---|---|
| `createBox(l, t, w, h)` | `Box(l, t, w, h)` |
| `createLabel(...)` | `Label(...)` |
| `createButton(...)` | `Button(...)` |
| `createTextBox(...)`, `createInput(...)` | `Input(...)` |
| `createImage(...)`, `createIcon(...)` | `Icon(...)` |

**Dikkat:**
- Toplu bul-değiştir yapılırken **kendi `createButton`'ını tanımlayan dosyalara dokunulmamalı** (o dosyalardaki `createButton(...)` çağrıları basic.js'in değil, kendi yardımcılarının). Önce `(const|let|var|function) createButton` arayıp o dosyaları listeden çıkarmak gerekir.
- basic.js'in içi etkilenmez: `startFlexBox`, `withProps` gibi iç kodlar kapsamdaki `createBox`'ı kullanıyor, `window` adını değil.
- `test/basic-test.htm`'deki "page-level const createButton does not break Button()" kontrolü kalmalı; kaldırma adımında `window.createButton`'ın artık tanımlı olmadığını doğrulayan bir kontrol eklenebilir.
- Dokümanlar: `__handbook` (iki dil), `context/basic-js-core.md`, `basic/basic-v26.09.18.md`'nin yerine gelecek sürüm notu. Eski adlar geçiyorsa "eski, yerine `Box()`" diye işaretlenmeli.
- Kendi basic.js kopyasını taşıyan yerler (`04-template-m1/todo-app/library/`, `delete-easy-pwa`, oyun, `webpage-handbook/basic/`) kendi kopyalarını kullandığı için etkilenmez; bilerek eski tutulanlar (bkz. CLAUDE.md) öyle kalır.

---

## 10. Bileşen kodunu sadeleştiren yardımcılar (YAPILDI, 2026-10-23)

**Ölçüm (63 bileşen):** zamanlayıcılar 103 satır / 28 dosya, hover işleyicileri 57 / 36, `v == 1 || v === true` 55 / 23, `remove()` üzerine yazma 42 / 42, `page.onResize` 25 / 14, `window`/`document` dinleyicileri 21 + 20 / 11, sayfada oluşturulan nesneler 13 / 12, kendi `escapeHtml` 11 / 11, kendi `<style>` 7 / 7.

**Karar:** Ayrı bir `core.js` dosyası değil (her sayfa bir dosya daha yüklemek zorunda kalırdı, kopyalar çoğalırdı), basic.js'in içinde küçük, genel yardımcılar:
- `remove()` ile kendiliğinden temizlenenler: `obj.listenTo(target, event, fn)`, `obj.onPageResize(fn)`, `obj.after(ms, fn)`, `obj.every(ms, fn)`, `obj.own(otherObj)`.
- `obj.onHoverChange(fn(self, isOver))`, `obj.setFocusRing(color)` (CSS `:focus-visible`), `basic.isOn(v)`, `basic.addCss(id, css)`; `createIn()` fonksiyonunun sonucunu döndürüyor.
- Adlar: `listen` (PropertyPanel'in `box.listen`'i) ve `onHover` (TreeView'in parametresi) çakıştığı için kullanılmadı.
- Sürüm: **v26.10.23** (Bugra'nın kararı, 2026-10-23). Sürüm notları `__handbook/*/00-what-is-new.md`. Kopyalar (`webpage-handbook/basic/` → `_update-copies.sh`, oyun, admin demosu) kendiliğinden güncellenmez.
- Testler: `test/basic-test.htm` 123/123 (kaynak ve `.min.js`), `test/components-test.htm` 63/63.
- Şablon (`_component-template.js`) bunlarla yazıldı. **comp-m4 2026-10-23'te çevrildi:** 31 bileşenden 20'sinin kendi `remove()`'u kalmadı (önce 29'unda vardı); `remove()`'u kalan 11'i yalnızca basic.js'in bilemeyeceğini temizliyor (Chart.js, statik listeler, hedeften ayrılma, iframe). 13 bileşende 7. maddedeki kısa stil birleştirmesi, 23'ünde `basic.isOn`, 10 `escapeHtml` kopyası → `basic.escapeHtml`, 6 `<style>` → `basic.addCss`. Testler: `components-test` 63/63, comp-m4 31/31, ayrıca davranış testi (zamanlayıcılar, pencere olayları, own) 22/22, 32 örnek sayfa hatasız. comp-m2 / comp-m3 dokunuldukça geçirilir.

## 11. Okunurluk için eklemeler (Tabs sadeleştirmesinden, 2026-10-23, AÇIK)

`comp-m4/tabs.js`, `bugra-rules.md`'ye göre yeniden yazıldı (79 `elem.style` satırı → 0; davranış aynı: 404 eleman × 26 stil, 4 durumda fark yok). Bu sırada basic.js'te eksikliği görülen, tekrar eden çiftler:

1. **Bir grubun props'undaki `css.alignItems` sessizce eziliyor (bir tuzak, önce bu).** `startFlexBox` önce props'u uyguluyor, sonra `FLEX_STYLES` (`alignItems`, `justifyContent`, `flexGrow`, `flexShrink`...) döngüsüyle elem'e yeniden yazıyor. Bu yüzden `VGroup({ align: "left top", css: { alignItems: "stretch" } })` çalışmıyor, ardından `group.css.alignItems = "stretch"` yazmak gerekiyor (Tabs'te 4 kez). Öneri: `css`'i FLEX_STYLES döngüsünden sonra uygulamak, ya da `align`'a bir "uzat" değeri (`align: "left stretch"`).
2. **`role` / `aria`:** Tabs'te 17 `elem.setAttribute("role" | "aria-…")` satırı var. Öneri: `obj.role = "tab"` ve `obj.aria = { label: "Close", selected: true }` (değer `false` → `"false"`, `null` → kaldır). Not: `ariaLabel` Tabs'in bir varsayılanı; yeni adlar bir bileşen varsayılanıyla çakışmamalı (`role`, `aria` için repoda arama yapılmalı).
3. **`id` ve `tabIndex`:** `elem.id = ...`, `elem.tabIndex = 0` sık. Öneri: `obj.tabIndex` özelliği (`id` adı bir bileşen varsayılanıyla çakışabilir: önce bakılmalı).
4. **Esnek "kalan yeri doldur":** `css.flex = "1 1 0"` + `css.minWidth = "0"` çifti 3 kez (şerit, panel alanı, tam genişlik sekme). `grow` / `shrink` var ama `flexBasis: 0` ve `minWidth: 0` yok. Öneri: bir ad (ör. `fill: 1`) ya da `grow: 1`'in bu ikisini de yapması (davranış değişikliği: dikkat).
5. **Anında geçiş:** `css: { transition: "color 0.15s" }` 5 kez. `setMotion()` bilerek gecikmeli (ilk boyama animasyonsuz), `setMotionNow()` bir metot. Props'ta yazılabilen bir ad (ör. `motionNow`) okunurluğu artırır; gerekli mi, tartışılır.
6. **Belgelenecek desen (kod değil):** SVG ikonlarında `stroke="currentColor"`: Label'ın `textColor`'ı ikonu boyuyor, hover yalnızca `textColor`'ı değiştiriyor (Tabs: kapat, ekle, oklar). Handbook'a ve `context/basic-js-core.md`'ye bir örnek olarak eklenebilir.

---

## Sorun olmayanlar (değiştirmeye gerek yok)

- Her nesnenin `position: absolute` olması layout açısından ucuz. `height: "auto"` kısıtı bir tasarım tercihi; gruplar (`HGroup` / `VGroup`) bu ihtiyacı karşılıyor.
- `remove()` zinciri `querySelectorAll("*")` ile O(n). Yalnızca silmede çalışıyor.
- `that` ve global container yığını hız açısından bedava. Tek bedeli isim çakışma riski (CLAUDE.md'de yazılı).
- `resizeDetection` tek bir `ResizeObserver` ve `Map` kullanıyor: doğru.

## Önce ölçmek için bir bench fikri

`experimental/` altında bir sayfa:
1. 300 kartı `left` ile ve `translate` ile kaydırıp FPS'i ve frame sürelerini yan yana göstermek (madde 2).
2. 200 nesneyi `center()` ile hizalayan bir döngüde süreyi ölçmek: yazma ve okuma iç içeyken ve önce hepsini okuyup sonra yazarken (madde 1).
3. `setMotion` ile hemen ardından bir değişiklik: CPU yavaşlatıldığında (DevTools, CPU x6) geçişin atlanıp atlanmadığına bakmak (madde 3).

Sonuçlar burada not edilir; değişiklik ancak fark görülürse yapılır.

## Bir değişiklik yapılırsa

- `basic/basic.js` sürümü ve header'ı, `basic/basic-v26.09.18.md` (ya da yeni sürümün md'si), `__handbook/*/00-what-is-new.md`.
- `basic.min.js` terser ile yeniden yapılmalı (komut md'de).
- `test/basic-test.htm` ve `test/components-test.htm` → sekme başlığı ALL PASS.
- Şablonlardaki basic.js kopyaları (`04-template-*`, `03-webpage-m2/webpage-handbook/basic/` → `_update-copies.sh`) kendiliğinden güncellenmez.
