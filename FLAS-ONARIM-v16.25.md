# GarageFlow v16.25 — Flaş uyumluluk onarımı

v16.24 flaş komutunda mevcut kamera çözünürlüğü ve cihaz ayarları da gönderiliyordu. Chromium bu birleşik komutu reddedebilir. v16.25 yalnızca flaş ayarını gönderir. Güncel kamera durumunu bildirmesi geciken cihazlarda kısa bir kontrol süresi tanınır; ilk komut uygulanmazsa ikinci uyumlu flaş komutu denenir.

Barkod arama ve ürün kartına barkod ekleme ekranında **Flaş aç / Flaş kapat** kullanılır. Kamera kapatıldığında, barkod okununca veya uygulama arka plana alınınca kamera ve flaş bırakılır.

## Yükleme

ZIP içindeki GarageFlow ön yüz dosyalarını Vercel'e bağlı projenizde güncelleyin. **VDS yaması gerekmez.** Yayınlandıktan sonra PWA'yı kapatıp yeniden açın; güncelleme uyarısı varsa uygulayın. Sürüm 16.25 olmalıdır.

Paket web/PWA kaynaklarını günceller. İçerideki eski APK yeniden derlenmedi.

## Doğrulama

Chromium'un birleşik kamera/flaş komutunu reddetmesini taklit eden testte v16.24 hatası yeniden üretildi ve v16.25 aç/kapat kontrolü geçti. Geciken durum bildirimi, alternatif flaş komutu ve kamera kapanışı da taklit kamera ile doğrulandı. Gerçek telefonun flaşı bu ortamda denenemedi.

Telefonda Flaş aç ile ışığın yandığını, Flaş kapat ile söndüğünü kontrol edin. Flaş açıkken barkod okutunca veya kamerayı kapatınca ışık sönmelidir.
