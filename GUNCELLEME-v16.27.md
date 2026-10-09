# GarageFlow v16.27 — Fiyat önerisi ve TL / USD maliyet

Önce `GarageFlow-VDS-Fiyat-Onerisi-Doviz-v1.zip` içindeki VDS yamasını kurun.
Ardından bu ZIP'in `stok-takip-apk-main` klasöründeki ön yüz dosyalarını
GarageFlow GitHub/Vercel projenizde güncelleyin.

## Kullanım

- Ürün Markası ve Ürün Kategorisi girildiğinde aynı marka/kategorideki
  en son kaydedilmiş sıfırdan büyük maliyet ve satış fiyatları önerilir.
  Araç markası ve modeli bu öneriyi sınırlamaz.
- Yeni ürünün boş fiyat alanları doldurulur. Elle yazılan fiyatlar korunur.
  Ürün düzenlerken mevcut fiyat değişmez; isterseniz
  **Önerilen fiyatları kullan** düğmesiyle öneriyi alabilirsiniz.
- Maliyet için **TL (TRY)** veya **USD** seçilir. Para birimini seçtiğinizde
  o para biriminde kayıtlı maliyet önerilir. Satış fiyatı TL'dir.
- Para birimi seçimi döviz çevirisi yapmaz. Örneğin `25 USD`, 25 dolar
  olarak saklanır; mevcut TL kayıtları değişmez.
- Ürün kartındaki göz simgesi maliyeti seçilen para birimiyle gösterir.
  Tutara yeniden dokununca göz simgesine döner.
- Kategori değerleri TL ve USD maliyet toplamlarını ayrı gösterir.
  USD maliyet içeren kategorilerde kur olmadan TL brüt fark hesaplanmaz.
- Toplu maliyet değişiminde para birimi seçilebilir. Tüm para birimlerine
  yüzde artış yapılabilir; sabit tutar değişiminde TL veya USD seçilir.
  USD maliyet ve TL satışın sabit tutar güncellemesi ayrı yapılır.
- Excel'e `alis_para_birimi` sütunu eklendi (`TRY` / `USD`). Eski Excel'de
  sütun yoksa mevcut ürünün para birimi korunur; yeni ürün TL kabul edilir.

## Kısa kontrol

1. Bilinen bir ürün markası + kategorisi girin; önerilen fiyatları kontrol edin.
2. Yeni bir ürünü USD maliyetle kaydedin, yeniden açın ve göz simgesine dokunun.
3. Kategori değerlerinde dolar tutarının TL toplamına eklenmediğini kontrol edin.
4. Mert gibi giriş/çıkış yetkili personelde rezerve işlemini kontrol edin.

Önceki rezerve yetkisi, stok renkleri, kamera/flaş ve Hub bağlantısı bu sürümde
korunur. PWA dosyaları v16.27 olarak güncellendi. ZIP'teki önceki APK yeniden
derlenmedi; bu paket web/PWA ön yüzü içindir.

## Doğrulama kapsamı

Yerel API, form, para birimi, fiyat önerisi, Excel, yetki ve kurulum geri dönüş
kontrolleri geçti. API testleri gerçek sunucu işleyicilerini yerel SQL uyarlaması
ile çalıştırır; canlı PostgreSQL/VDS testi değildir. Gerçek iOS/Android cihazda
görsel veya PWA kurulum testi yapılmadı.
