# _designs: taslak tasarımlar

Bu klasörde **yalnızca taslak tasarımlar** durur (2026-10-30). Bir taslak, bir bileşenin bütün görünüşlerini ve
bütün durumlarını yan yana gösteren sade bir sayfadır. basic designer'da açılıp gözle düzenlenir; sonra değişiklikler
bileşene aktarılır. Amaç: tasarım yüzeyi basit ve kolay değişir kalsın, bileşenin kodundan ayrı dursun.

## Bir taslak nasıl olur

- **Arkasında bileşen yoktur.** Sayfa bileşenin dosyasını yüklemez; her parça düz basic.js nesneleriyle çizilir
  (`Box`, `Label`, `Icon`, `HGroup` / `VGroup`). Designer'da her parça tek tek seçilebilir, rengi, kenarı, boyutu
  değiştirilebilir.
- **Yan yana bir ızgara:** satırlarda durumlar, sütunlarda stil paketleri. Her satırın başında ne olduğunu söyleyen
  bir Label, her sütunun üstünde paketin adı.
- **Bütün durumlar:** normal, fare üstünde (hover), basılı, klavye odağı, kapalı, bekliyor, hata, boş, dolu... Bir
  düğme için: basınca nasıl, fare üstüne gelince nasıl. Hareketli durumlar (hover, basma, dönen saat) o anın durgun
  bir görüntüsü olarak çizilir.
- **Değerler sayfanın başında:** paketlerin renkleri ve ölçüleri düz nesnelerde (`LOOKS`, `STATES`...). Bunlar
  bileşenin paketlerinden kopyadır.
- **Adı bileşenin dosyasının adıdır:** `comp-m4/smart-button.js` → `_designs/smart-button.htm`.
- Sayfa kaynağı yükler: `../basic/basic.css`, `../basic/basic.js` (bileşen yok).

## Açmak

- VS Code: dosyaya sağ tık → **Open in basic designer** (eklenti: `__projects/basic-designer/vscode-extension/basic-designer-0.0.6.vsix`,
  alfa, depoda değil).
- Tarayıcı (Live Server, port 5505):
  `http://127.0.0.1:5505/__projects/basic-designer/index.htm?page=_designs/smart-button.htm`

## Değişiklikleri bileşene aktarmak

1. Taslakta değiştir (renk, kenar, boyut, yazı...).
2. Designer'da **Send to AI** / **Copy prompt**; prompt'a "bileşene aktar" diye not ekle.
3. Yapay zeka her değişen değeri geldiği pakete yazar (`XxxDefaults.style` ya da `Xxx.styles.<paket>`). Bir değer
   bir satırı çizen yardımcı fonksiyondan geliyorsa (designer "All N from this line" der), hangi pakete ait olduğu
   sayfanın başındaki nesnelerden bulunur.

## Güncel tutmak

Bu klasör ara sıra kullanılır: taslaklar **her bileşen değişikliğinde güncellenmez**. Bir taslak kullanılmadan önce
(ya da istenince) kopya değerleri bileşenden tazelenir.

## Taslaklar

| Dosya | Bileşen | İçinde |
|---|---|---|
| `progress-bar.htm` | `comp-m4/progress-bar.js` (ProgressBar) | classic, modern, ozden; 14 durum |
| `smart-button.htm` | `comp-m4/smart-button.js` (SmartButton) | ozdenType1–4, classic; dört içerik, hover, basılı, odak, kapalı, bekliyor (saat, noktalar), "Sure?" balonu, "Sure?" yazılı düğme |

## Yeni bir taslak

Yapay zekaya "X'in taslak tasarımını yap" demek yeter. Örnek olarak `smart-button.htm`'ye bakılır: başta değerler ve
durumlar, `start()` içinde ızgara, her hücreyi çizen kısa fonksiyonlar.
