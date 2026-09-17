# basic.js — Sürüm Notları (What is New?)

Bu belgede basic.js kütüphanesine eklenen yeni özellikler, güncellemeler ve değişiklikler yer almaktadır.

---

## Versiyon 26.09.17

*   **`remove()` içindeki nesneleri de siler:** Bir nesne silindiğinde, içindeki bütün basic.js nesneleri de silinir (önce üstteki nesneler). Bir alt nesnenin `destroy()` fonksiyonu varsa (bileşen şablonu) önce o çağrılır. Böylece bileşenler global olaylarını temizleyebilir (örneğin `page.onResize`, `window` olayları, `RadioButton` grupları gibi statik listeler).
    *   **Neden:** Önceden yalnızca silinen nesnenin kendisi temizleniyordu. Alt nesnelerin `onResize` kayıtları ve global olayları kalıyordu, bu yüzden silinen bir sayfa bütün nesneleriyle birlikte bellekte kalıyordu. Admin panel şablonunda her sayfa değişiminde yaklaşık 400 DOM düğümü ve 250 olay dinleyicisi kalıyordu (240 sayfa değişiminden sonra: 70 MB bellek, 121.000 DOM düğümü). Artık 0.
    *   **Not:** Silinen bir nesne tekrar kullanılmak için değildir. `remove()` sonrası nesneyi ekrana tekrar eklemeyin, yenisini oluşturun.
    *   **Not:** Doğrudan `page` üzerinde oluşturulan nesneler (örneğin bir sayfanın açtığı `ContextMenu`) sayfa kutusunun içinde değildir. Onların `destroy()` fonksiyonunu sayfanızın `destroy()` fonksiyonunda çağırın.
*   **`object.elem._basicObject`:** Her element, kendi basic.js nesnesine bir bağlantı tutar (`makeBasicObject()` ekler).
*   **`object._isRemoved`:** `remove()` sonrası `1` olur. İkinci `remove()` çağrısı bir şey yapmaz.

---

## Versiyon 26.03.26

*   **`HGroup()`, `VGroup()`, `endGroup()`:** Arayüz elemanlarını ekranda yatay veya dikey olarak otomatik hizalayabilmek (Auto Layout) için eklendi.
*   **`parentBox` / `containerBox`:** Nesnelerin içinde bulundukları ana kutuyu (kapsayıcıyı) doğrudan referans alabilmesi için eklendi.
*   **`HGroup({ fit: 1 })`:** Otomatik yerleşim gruplarının (HGroup, VGroup vs.) boyutlarını içerisindeki nesnelere göre otomatik sarması (shrink-to-fit) özelliği eklendi.
*   **`basic.storage`:** Önceden dışarıda yer alan yapı `basic.storage` isim alanına taşındı. Ayrıca `has()` ile kontrol ve `clear()` ile tüm veriyi silme özellikleri eklendi.
*   **`basic.clock`:** Saat işlemleri `basic.clock` çatısı altına toplandı. Değişken isimlerinde `.millisecond` gibi yapısal güncellemeler yapıldı.
*   **`basic.date`:** Tarih işlemleri `basic.date` çatısı altına toplandı. O güne ait bilgilere doğrudan erişmek için yeni `.dayOfWeek` ve `.dayOfMonth` özellikleri eklendi.
*   **`waitAndRun()`:** Performans yönetimi için, belirli fonksiyonların milisaniyelik gecikme aralıklarla kontrollü (debounced) çalıştırılmasını ve bekletilebilmesini sağlayan fonksiyon eklendi.
*   **`mergeIntoIfMissing(params, defaults)`:** Parametre objelerini, iç içe objeler (deep) dahil olmak üzere, var olan verileri ezmeden sadece eksik kalan özellikleri ekleyip güvenle kopyalayan (merge) fonksiyon eklendi.
*   **`Black()` / `White()` Saydamlığı:** Doğrudan şeffaflık (opacity) değeri alan pratik renk fonksiyonları eklendi. Örnek kullanım: `Black(0.2)`, `White(0)`.

---

## Versiyon 25.06

*   **`AutoLayout()` / `endAutoLayout()`:** Otomatik yerleşim (layout) işlemlerini başlatmak ve bitirmek için yeni fonksiyonlar eklendi.
*   **`.clipContent`:** Sınırları aşan (overflow) içeriği kesmek veya gizlemek için yeni bir özellik eklendi.
*   **`autoFit()`:** Daha iyi bir isimlendirme tutarlılığı sağlamak amacıyla eski `fitAuto()` fonksiyonunun ismi `autoFit()` olarak güncellendi.
*   **`.totalLeft` / `.totalTop`:** Bir elementin doğrudan ana sayfaya (page) göre toplam (mutlak) pozisyonunu almak için yeni özellikler eklendi.
*   **`.padding`:** İç boşluk (padding) tanımlamaları çok daha esnek hale getirildi. Artık tek değer, array olarak yatay/dikey veya tam kutu modeli formatlarını destekliyor.
    *   Örnek kullanımlar: `.padding = 4`, `.padding = [12, 4]`, `.padding = [14, 4, 14, 4]`
