# comp/: mutlaka düzeltilmesi gereken hatalar

**Durum (2026-11-05): 24 maddenin hepsi düzeltildi**, her başlık bir commit: A `991b98f` (basic.js v26.11.05 dahil),
B `cd89b4c`, C `e6c8a53`, D `43c24cd`, E `c2dfa11`. Her birinin testi `test/behavior-test.htm`'de (152/152). En
alttaki "daha düşük öncelikli" bulgular duruyor.

2026-11-05 · `comp/` klasöründeki 70 bileşenin incelemesi. Bir sonraki adımda bu liste sırayla düzeltilir: her düzeltilen
hata `test/behavior-test.htm`'e bir `test()` alır (depo kuralı) ve buradaki satırı "düzeltildi" olur.

**Nasıl yapıldı:** 7 ajan dosyaları paylaşıp yalnızca büyük hataları aradı ve her bulguyu headless Chrome'da yeniden
üretti (43 bulgu). Sonra 4 ajan her bulguyu yeniden çalıştırıp çürütmeye çalıştı (belgede istenmiş mi, API yanlış mı
kullanılmış, gerçekte olur mu) ve aynı hata türlerini bütün `comp/` klasöründe aradı. Sonuç: hiçbiri çürütülmedi;
24'ü "mutlaka düzeltilmeli", 19'u daha düşük öncelikli (en altta). Tarama aynı türden yeni örnekler de buldu (5 açılır
parça daha, TextareaB, LabelEditor ve Filters'taki sızıntı); bunlar ilgili maddelere eklendi, aynı kökten olanlar
birleşti: 24 madde. `smart-button.js`'in aynı günkü kod incelemesinin 5 düzeltmesi ayrı commit'te (`18c037d`).

**Ölçüt (mutlaka düzeltilmeli):** sayfayı ya da bileşeni bozan bir hata; kullanıcının verisinin kaybolması ya da
sessizce değişmesi; yanlış değerin dönmesi, gönderilmesi ya da gösterilmesi; bir güvenlik kilidinin aşılması (soru,
onay, pasif ya da kapalı durum); belgelenen bir API'nin asıl kullanımında çalışmaması; normal kullanımda büyüyen bir
sızıntı; bileşenin sık bir yerleşimde kullanılamaması (kapalı bir sekme, bir Dialog ya da SidePanel içi, ekranın altı).

Satır numaraları 2026-11-05'teki dosyalara göredir.

## A. Sayfayı bozan, veri kaybettiren, büyüyen sızıntı

**1. LineProgressBar gizli bir kapta yapılınca hata fırlatıyor (kritik)** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/line-progress-bar.js:54, 87`
- Ne oluyor: çizgi sayısı yapılırken bir kez `box.width`'ten hesaplanıyor. Kapalı bir Tabs panelinde ya da `visible: 0`
  bir grupta genişlik 0, çizgi dizisi boş, `lineContainer.add(...[])` = `add(undefined)` fırlatıyor ("Cannot set
  properties of undefined (setting 'containerBox')"). Sayfanın `start()`'ı durur, açılmış kutular kapanmaz ("Some
  started boxes were not ended"), sonra yapılan her nesne gizli kutunun içine düşer. Yazıyla verilen genişlikte olur
  ("100%", calc); sayıyla verilen çalışır. Görünürken de "100%" bir çubuk pencere boyutunu izlemez.
- Tekrar: `VGroup({ visible: 0 }); LineProgressBar({ width: "100%" }); endGroup(); Label({ text: "after" })`.
- Düzeltme: sıfır çizgiye karşı koruma (her çizgiyi tek tek ekle); çizgileri gerçek genişlikten `box.onResize` ile
  yeniden kur.

**2. basic.js: bir üst kutu silinince bileşenlerin sahiplendiği nesneler temizlenmiyor (kritik, sızıntı büyüyor)** · ✅ düzeltildi (2026-11-05)
- Yer: `basic/basic.js:1347, 1388-1393` (`removeCascadeDepth`)
- Ne oluyor: bir üst kutu silinirken `removeCascadeDepth` 1'dir; bileşenin `box.own(obj)` ile sahiplendiği nesne
  (açılır panel) kendi silme adımını atlar, içindeki ScrollBar'lar ve bileşenler hiç `remove()` almaz. Her sayfa
  değişiminde pencere dinleyicileri, ResizeObserver / MutationObserver kayıtları ve DOM düğümleri birikir. Bileşen
  doğrudan silinirse temizdir.
- Etkilenenler: SelectBox, SelectColor, SelectDate, SelectTime (panel + ScrollBar), FullScreenSelect
  (`full-screen-select.js:248`), Filters popup modu (`filters.js:427`), LabelEditor (`label-editor.js:915`: her sayfa
  değişiminde 11 dinleyici, 6 ResizeObserver kaydı, 130 DOM düğümü; 3 SelectColor katmanı sayfada kalır). Aynı atlama
  `remove()`'u ezen yoldan da olur: Tooltip'in açık popover'ı (`tooltip.js`, `remove()` → `closePopover()`) içindeki
  sayfa nesnelerini temizlemez.
- Tekrar: `view = startBox(); SelectTime(); endBox(); view.remove()`: pencerenin resize dinleyicileri her seferinde
  2 artar (10 sayfa değişiminde 4 → 24); pencere boyutu değişince sızan `refreshScroll`'lar çalışır.
- Düzeltme (basic.js): atlamaya genel sayaç yerine DOM içerilmesiyle karar ver (yalnızca bu, `remove()`'u ezen yolu da
  kapsar) ya da `owned.remove()` çağrısının çevresinde sayacı 0 yap. basic.js değişince `.min` ikizi yeniden yapılır.

**3. Açılır listeler ve menüler Dialog'un ya da SidePanel'in arkasında açılıyor** · ✅ düzeltildi (2026-11-05)
- Kök: açılır parçalar `page`'e sabit bir z-index ile konuyor. Dialog 4000 + 2n (`dialog.js:428`), SidePanel'in
  örtüsü 1000, paneli 1001 (`side-panel.js:389, 539`). Bu yüzden bir Dialog ya da SidePanel içindeki form
  bileşenleri kullanılamıyor: liste kartın arkasında açılır, tıklama kartın kendisine gider.
- Etkilenenler:
  - SelectBox `select-box.js:328-329`, SelectDate `select-date.js:183-184`, SelectTime `select-time.js:169-170`,
    SelectColor `select-color.js:141-142` (1000 / 1001): Dialog'un arkasında.
  - FullScreenSelect `full-screen-select.js:70, 599` (3000): Dialog'un arkasında.
  - TinySelect `tiny-select.js:213-215` (z-index yok): Dialog'un ve açık SidePanel'in arkasında (URLInputB'nin
    protokol listesi de bundan gelir).
  - ContextMenu `context-menu.js:70` (1000): SidePanel'in ve Dialog'un arkasında; görünmez ama odağı ve tuşları tutar,
    Enter görünmeyen bir öğeye tıklayabilir. SmartTable'ın sütun menüsü de ContextMenu.
  - SearchResults `search-results.js:57, 491-492` (`zIndexValue` 1000): Dialog'un ve SidePanel'in arkasında.
  - TagInput önerileri `tag-input.js:910, 929` (1001): Dialog'un arkasında.
  - Filters popup modu `filters.js:107, 425-426` (1001): Dialog'un arkasında.
  - Toast `toast.js:602, 780` (3000): açık bir Dialog'un örtüsünün altında; "Undo"ya tıklama örtüye gider: Undo
    çalışmaz, Dialog kapanır.
- Düzeltme: tek bir ortak kural: bir açılır parça açıldığı anda en üstteki açık katmanın (Dialog, SidePanel)
  üstünde bir z-index alır (basic.js'te ya da paylaşılan bir yardımcıda bir "en üst katman" sayacı). Hep üstte olması
  gerekenlere örnek: Notice 50000 (`notice.js:50`).

**4. SortableList ve ItemList: satırdaki bir alana yazarken Backspace bütün satırı siliyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/sortable-list.js:380-422` (bağlandığı yer 786), `comp/item-list.js:574, 989`
- Ne oluyor: satırın keydown'u, satırın içindeki bir Input'tan (`createItemView`) gelen tuşlara da bakıyor.
  SortableList'te Backspace / Delete satırı siler (`onRemove`), Space yazılamaz (satırı tutar); oklar, Home / End odağı
  başka satıra taşır. ItemList'te Space yazılamaz (satırı seçer), End odağı alandan çıkarır.
- Düzeltme: `if (event.target !== row.elem) return;` (DataTable, SmartTable, PageControl, SettingsRow, Stepper,
  SliderField zaten böyle yapıyor).

**5. SidePanel başka bir şeyin kullandığı Escape ile de kapanıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/side-panel.js:249-252` (Dialog: `dialog.js:734-736`)
- Ne oluyor: paneldeki açık bir SelectBox / SelectDate / FullScreenSelect listesini Escape ile kapatınca panel de
  kapanır; panelin üstünde kapanmayan bir Dialog varken (`closeOnEscape: 0`, cevap bekleyen `Dialog.confirm`) Escape
  Dialog'u bırakır ama arkadaki paneli kapatır. Mobil şablonun `App.openSheet`'i kapanınca paneli siler: yazılanlar
  kaybolur.
- Düzeltme: `event.defaultPrevented` ya da açık bir Dialog (`Dialog.getTop()`) varsa dön. Dialog da modal olduğu için,
  kapanmadığı Escape'te olayı durdursun.

## B. Güvenlik kilidi aşılıyor, yanlış veri gönderiliyor

**6. SmartButton'un sorusu (`ask`) çift tıklamayla geçiliyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/smart-button.js:299-304`
- Ne oluyor: çift tıklamanın ikinci tıklaması soruyu onaylar: `SmartButton({ ask: "Click again to delete.", onClick })`
  hemen çalışır; `Dialog.confirm({ danger: 1, ask })` hemen `true` döner (gerçek fareyle de denendi). Basılı tutulan
  Enter için koruma zaten var (589).
- Düzeltme: soru açıkken `event.detail > 1` olan ya da sorudan sonraki ~400 ms içindeki tıklamayı yok say (Form
  `form.js:470`'te `detail > 1` ile yapıyor).

**7. InputB `setRequired()` geçersiz bir değerin uyarısını gizliyor: Form geçersiz veriyi gönderiyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/input-b.js:396-399` (ayrıca 274-280 ve yaratılırken 615)
- Ne oluyor: `setRequired()` ve yaratılırken yapılan kontrol yalnızca "boş mu"ya bakar; dolu her değerde uyarıyı
  gizler ve durumu 0 yapar. E-posta alanına "abc" yazılmışken (gönder düğmesi pasif) `setRequired(1)` çağrılınca durum
  0 olur, düğme açılır, "abc" gönderilir. Deponun kendi `04-templates/web-forms/feedback-form.htm`'i bunu yapıyor
  (`updateQuestions()`, her yıldız tıklamasında). `EmailInputB({ inputValue: "not-an-email" })` da durum 0 ile başlar.
- Düzeltme: zorunluluk kontrolünden sonra `showWarningIfNotValid(isValid())` (setRequired'da ve yaratılırken).

**8. LoginPageV2: pasif LOGIN / SIGN UP düğmeleri Tab + Enter ile çalışıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/login-page-v2.js:557-560, 389-390`
- Ne oluyor: pasif düğmeler yalnızca `clickable = 0`; `<button>` oldukları için Tab + Enter yine tıklar ve tıklama
  işleyicisi durumu kontrol etmez. Geçersiz e-postayla LOGIN, 1 harflik şifreyle SIGN UP çalışır.
- Düzeltme: işleyicide `if (box.loginBtn.clickable != 1) return;` (SIGN UP için de); Form'un gönder düğmesi gibi.

**9. Toggle: üzerindeyken kapatılan (disabled) düğme fare ayrılınca yeniden açılıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/toggle.js:394-399` (`setSecondState`: 302)
- Ne oluyor: mouseover / mouseout "disabled"a bakmadan `setSecondState` çağırır; `clickable`, `tabIndex`, `opacity`
  geri gelir. Kendi `onChange`'inde kapatılan bir toggle (kaydederken) fare 2 px kıpırdayınca bile açılır; dokunmatikte
  bir sonraki dokunuşta. Sonraki tıklama kilitli değeri geri çevirir.
- Düzeltme: iki işleyicide de `if (box.secondState === "disabled") return;` ya da ayrı bir `isDisabled` bayrağı.

**10. PageControl: kapalıyken (setEnabled(0)) noktalar sayfayı yine değiştiriyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/page-control.js:259-262` (`setEnabled`: 605)
- Ne oluyor: oklar, tuşlar, kaydırma ve autoPlay durur; noktaların tıklaması `enabled`'a bakmaz, `onChange` çalışır.
- Düzeltme: nokta tıklamasında `if (box.enabled != 1) return;`.

**11. URLInputB: okunan değer geri yazılamıyor, ön doldurulan adres bozuk gönderiliyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/url-input-b.js:87-91` (`setInputValue` InputB'den: `input-b.js:332-339`)
- Ne oluyor: `getInputValue()` protokol + metin döner, `setInputValue()` hepsini metin kısmına yazar:
  "https://www.https://www.example.com/news", durum 2. `URLInputB({ inputValue: "https://www.example.com" })` bir
  Form'da sessizce "https://www.https://www.example.com" gönderir.
- Düzeltme: `setInputValue`'yu ez: baştaki protokolü listeden bul ve seç, kalanını alana yaz.

## C. Gizli bir kapta yapılınca değer ya da görünüm kayboluyor

**12. Slider: kapalı bir sekmede değeri 0 oluyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/slider.js:113` (82-85, 147-155, 355-362)
- Ne oluyor: değer başparmağın yerinden geri okunuyor; genişlik 0 iken `currentValue` en küçük değere yazılır.
  `Slider({ width: "100%", currentValue: 60 })` kapalı bir Tabs panelinde `getValue()` = 0 döner; açılınca da 0'da
  durur; gizliyken `setValue(80)` de 0. Bir ayar sayfası 0 kaydeder.
- Düzeltme: istenen değeri asıl kaynak tut; başparmağı yeniden boyutlanınca ondan yerleştir.

**13. TextareaB: gizliyken doldurulan alan görünmüyor ve tıklanamıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/textarea-b.js:77` (126, 191)
- Ne oluyor: `autoGrow` yüksekliği gizliyken 0 olan `scrollHeight`'tan alır ve `minHeight`'ı siler. Kapalı bir
  sekmede (ya da açılmadan doldurulan bir Dialog / SidePanel'de) `setInputValue(note)`: textarea 0 px, yazı görünmez,
  alana tıklanamaz. Gizliyken yapılan boş bir alan da yalnızca üst yarısından tıklanır. Yeniden hesaplayan bir
  `onResize` yok.
- Düzeltme: görünür olunca (`onResize`) yüksekliği yeniden hesapla; gizliyken ölçü okuma.

**14. SidePanel `startBody()`: ikinci bileşen panelin dışına düşüyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/side-panel.js:350-359`
- Ne oluyor: `startBody()` yalnızca `setDefaultContainerBox(body)` yapar, başlat / bitir yığınına girmez. Sayfanın
  açık bir grubunun içinde yapılan bir panelde, gövdeye konan ikinci bileşen (ya da ilk `endGroup()`) sayfanın grubuna
  döner; sonraki her nesne panelin dışında çizilir. Panelin başlığı "hangi kap açıksa" yapılabileceğini söylüyor.
- Düzeltme: `startBody()` gövdenin içinde gerçek bir grup başlatsın (`PageControl.startPage` ve `Tabs.startPanel`
  gibi), `endBody()` bitirsin.

## D. Yanlış sonuç, ekranda kaybolan içerik

**15. TreeView: boş ve açık bir klasöre eklenen düğüm görünmüyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/tree-view.js:711-715` (`addChildNode`)
- Ne oluyor: açık bir üst düğümün çocuk grubu hiç kurulmamışsa (boş, tembel, `setChildren(key, [])`'den sonra)
  `addNode()` yalnızca oku yeniden çizer; yeni çocuk çizilmez, `setValue` ve oklar ona ulaşamaz. Tembel bir dosya
  ağacında açılmış boş bir klasöre ilk dosyayı eklemek bunu yapar.
- Düzeltme: üst düğüm açık ve kurulmamışsa `buildChildren(parent)`.

**16. SmartTable: filtre Türkçe "İ"yi bulamıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/smart-table.js:925-928, 977` (`hasKeyword`, `filterAndSortData`)
- Ne oluyor: iki taraf da `toLowerCase()`; "İ" küçültülünce "i" + birleşen nokta olur. "istanbul", "ibrahim", "ışık"
  0 satır bulur (DataTable, ItemList, FullScreenSelect buluyor).
- Düzeltme: `DataTable.toSearchText` gibi: `toLocaleLowerCase("tr")`, işaretleri sil, ı → i.

**17. SelectFile: `directory: 1` klasörün yalnızca ilk dosyasını alıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/select-file.js:451-457` (641)
- Ne oluyor: `multiple: 1` verilmeden `directory: 1` tek dosya yoluna girer: 3 dosyalı bir klasörden 1'i kalır ve
  "Only one file can be selected." hatası gelir. Örnek sayfanın 3. örneği (`select-file.htm`) böyle.
- Düzeltme: `const isMultiple = (box.multiple == 1 || box.directory == 1)`.

**18. SearchResults: ekranın alt kısmındaki bir arama alanının sonuçları ekran dışında kalıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/search-results.js:282, 292-293` (`layout`)
- Ne oluyor: liste hep alanın altına konur, yalnızca yatayda sınırlanır. Alttaki bir alanda 8 satırın 4'ü pencerenin
  altında kalır, kutu ekran dışında olduğu için kaydırılamaz.
- Düzeltme: alttaki boşluğa göre yükseklik ver ya da yukarı aç (TagInput, Filters, SelectBox gibi).

**19. TinySelect: liste ekranın altında kesiliyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/tiny-select.js:264-266`
- Ne oluyor: liste hep alanın altına konur; yukarı açılmaz, en yüksek bir boyu ve kaydırması yok. Alttaki bir alanda
  öğeler sayfanın kenarının altında kalır; uzun bir liste her yerde kesilir.
- Düzeltme: sığmıyorsa yukarı aç, en yüksek boy + kaydırma (SelectColor `positionPanel` gibi).

**20. PageControl: dışarıda bırakılan bir basış, sonra yalnızca fareyi gezdirince sayfaları kaydırıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/page-control.js:321` (300, 715-718)
- Ne oluyor: işaretçi ancak 6 px hareketten sonra yakalanır; kutunun dışında bırakılan bir basış `drag`'i silmez ve
  fare her zaman aynı `pointerId`'yi taşır. Sonra basmadan gezdirilen fare sayfaları sürükler, bir tıklama onları
  yarıda bırakır (sonraki sayfa yarım görünür ve tıklanamaz); autoPlay da durur. Tam genişlikte bir kaydırıcıdan
  yalnızca dikey çıkılabildiği için "bas, kaydır, dışarıda bırak" sık olur. Dokunmatikte sorun yok.
- Düzeltme: fareyle `pointermove`'da `event.buttons === 0` ise sürüklemeyi bitir; ya da `pointerdown`'da yakala;
  ya da `pointerup`'ı `box.listenTo(window, ...)` ile de dinle.

**21. WebView: bir HTTP sunucusunda 404 sayfası `onError` değil `onLoad` çağırıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/web-view.js:194`
- Ne oluyor: `onError` yalnızca iframe belgesi okunamazsa çalışır; gerçek sunucular (Live Server, nginx, GitHub
  Pages) eksik sayfaya okunabilir bir 404 belgesi döner. Yalnızca file:// `onError` verir. Başlık aynı kökenli 404'te
  `onError` diyor; katalog `index/detail.js:263` buna güveniyor.
- Düzeltme: `onIframeLoad`'da (aynı köken) `contentWindow.performance.getEntriesByType("navigation")[0].responseStatus
  >= 400` ise `onError`.

## E. PropertyPanel (basic-designer) ve UIEffects

**22. PropertyPanel: renk seçicide "#" ya da "#12345" yazınca hata, renk kayboluyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/property-panel.js:1624-1625` (`formatBase`; 1643, 1660'tan çağrılır)
- Ne oluyor: seçicinin biçimi RGB ya da HSL iken `readColor(base)` null döner ve `.r` okunur: TypeError. Eski renk
  silinir ("#"), seçici yarım çizilir, o biçimde düzeltmek de yine fırlatır (`255, 0, 0` yazılamaz). Yalnızca HEX'e
  dönmek kurtarır.
- Düzeltme: `formatBase`'te `if (!rgb) return base;`.

**23. PropertyPanel: renk alanının % kutusundan geçmek değeri yeniden yazıyor (basic-designer'da sahte değişiklik)** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/property-panel.js:1690` (1665-1672; Escape 1702-1705)
- Ne oluyor: % kutusu her blur'da yazar ("değişmedi" kontrolü yok), Escape iptal etmez: "transparent" →
  "rgba(0, 0, 0, 0)", "rgb(55, 56, 54)" → "#373836", 0.125 → 0.13 ve `onChange` çalışır. basic-designer'da bir renk
  alanından Tab ile geçmek sayfanın kodunu yeniden yazar ve değişiklik listesine sahte bir kayıt ekler. Sayı alanında
  bu koruma var (612-614).
- Düzeltme: metin gösterilen yüzdeyle aynıysa yazma; Escape eski değeri geri koysun.

**24. UIEffects spotlight: hızlı gir-çık her seferinde düğmenin içinde bir span bırakıyor** · ✅ düzeltildi (2026-11-05)
- Yer: `comp/ui-effects.js:578-586` (`off()`: 599)
- Ne oluyor: ayrılınca solan ışığı silen zamanlayıcıyı, 300 ms içinde geri dönen farenin `move()`'u iptal eder; span
  sonsuza dek kalır. Her hızlı geçiş bir span ekler; `btn.text` onları da döner ("Save<span ...>").
  `ui-effects.js`'i LoginPageV2 ve `ozden-panel` şablonu yüklüyor.
- Düzeltme: solan ışığa bir başvuru tut ve onu her zaman sil (`move`'da yenisinden önce ve `off`'ta).

## Daha düşük öncelikli (gerçek ama nadir, kolay bir çaresi var ya da yalnızca görünüş)

- ✅ (düzeltildi 2026-11-05) PhoneInputB `setCountryCode()` numaranın ilk rakamlarını kaydırır (`phone-input-b.js:156-159`); tek çağıran numarayı
  zaten siliyor.
- ✅ (düzeltildi 2026-11-05: ilk ayırıcı kalır, rakam düşmez) NumberInputB / CurrencyInputB: ikinci bir ondalık
  ayırıcı rakamları siler ("12.5" → "1.2"; `number-input-b.js:83`, `currency-input-b.js:153`). Kalan: yapıştırılan
  "1.234.567" yine "1.23" olur (iki ondalık sınırı; noktaların binlik mi ondalık mı olduğu bilinemez); Currency'de
  grup ayırıcısından hemen sonra Backspace bir şey yapmaz.
- Form `showMessage()` eksik bir nesneyle (`onClose` yok) fırlatır (`form.js:98-105, 157-158`); bütün çağıranlar
  tam nesne veriyor.
- TagInput: ayırıcı (",") içeren bir öneri ikiye bölünür (`tag-input.js:593`).
- LoginPageV2: yaratıldıktan sonra atanan `onLoginClick` çağrılmaz (`login-page-v2.js:389-390`).
- FullScreenSelect: kendisini silen bir `onChange`'den sonra konsolda TypeError (`full-screen-select.js:433-436`).
- TinySelect `setSelectedIndex(-1)` fırlatır (`tiny-select.js:89-91`); çağıranlar zaten kontrol ediyor.
- ✅ (düzeltildi 2026-11-05) DataTable `updateRows()` tekrar eden id'lerde eski satırları bırakır; bunlar `clearRows()` / `setRows()`'dan sonra
  da ekranda kalır (`data-table.js:578-598`). Ucuz bir savunma düzeltmesi değer.
- DataTable `setRows()` / `clearRows()` seçimi `onSelect(null)` demeden siler (`data-table.js:569-574, 633-638`).
- TreeView: hiç açılmamış tembel bir düğüme `addNode()` onun `onLoadChildren`'ını engeller (`tree-view.js:705`).
- SortableList `moveItem()` diğer satırları kilitli bir satırın üstünden geçirir (`sortable-list.js:971-980`).
- PageControl: hızlı iki sayfa değişiminde ilk sayfanın `onClose`'u kaybolur; `removePage` silinen sayfa için
  `onClose` çağırır (`page-control.js:270-279`).
- ✅ (düzeltildi 2026-11-05) ChartBox sayfanın `labels` / `values` dizilerini değiştirir (`chart-box.js:143, 146, 511-519`): kopyalanmalı.
- ✅ (arşivlendi 2026-11-06: `GraphBox` geldi, `Alpha()` kullanılır) ChartBox `alpha()` adlı ve `hsl()` renkleri saydam yapmaz (`chart-box.js:831-851`).
- WebView `autoHeight` büyür ama küçülmez (`web-view.js:217, 220`).
- Slider `setMinValue()` / `setMaxValue()` boş (`slider.js:186-191`).
- ✅ (düzeltildi 2026-11-05) SliderField ve Stepper: alan odaktayken silinirse yazılan değer `remove()`'dan sonra gönderilir
  (`slider-field.js:717`, `stepper.js:593`).
- UIEffects hover (`color`, `border`, `fill`): hover sırasında sayfanın verdiği rengi ayrılınca eskisiyle ezer
  (`ui-effects.js:439-447, 471-476, 298-305`).
- PropertyPanel `getData()` başlık / bölüm düğmelerinin (toggle) değerini taşımaz; yeniden kurulunca sıfırlanır
  (`property-panel.js:2964, 3189, 3253`).
- PropertyPanel metin alanları dize olmayan bir değeri blur'da yazar ve `onChange` çalışır (`property-panel.js:2611`).
- Yakın durumlar: Tooltip popover'ı içindeki bir SelectBox'ın Escape'ini ve liste tıklamasını kapanmak için kullanır;
  Tabs'ta kapalı ama kapatılabilir bir sekme (x) ile kapanır; Notice açıkken her Escape'i alır; Form'un pasif düğmesi
  hover'da etkin görünür; SelectTime `inline: 1` gizliyken seçili saati görünüme kaydırmaz; SmartTable başparmak
  sürüklenirken silinirse `body`'nin `userSelect`'i "none" kalır; SmartButton `render()` sayfanın verdiği transform'u
  siler ve etiketsiz / ikonsuz yapılmış bir düğmede `setText()` / `setIcon()` bir şey göstermez.
