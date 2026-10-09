# GarageFlow v16.24 — Barkod kamera flaşı

Barkod kamera ekranının sağ üstüne **Flaş aç / Flaş kapat** düğmesi eklendi. Barkod aramada ve ürün kartına barkod eklerken kullanılabilir. Flaş başlangıçta kapalıdır; düğmeye dokunarak açılır.

Aktif kameranın flaş desteği kontrol edilir. Destek yoksa düğme **Flaş yok** olarak pasif görünür; barkod tarama çalışmaya devam eder. Kamera kapanınca, barkod okununca veya uygulama arka plana alınınca kamera ve flaş bırakılır.

## Yükleme

Vercel'e bağlı GarageFlow projesindeki ön yüz dosyalarını bu paketle güncelleyin. **Yeni VDS yaması gerekmez.** Daha önce kurulan rezervasyon yaması kullanılmaya devam eder.

PWA önbellek sürümü 16.24 olarak güncellendi. Paket içindeki eski APK yeniden derlenmedi; bu paket web/PWA kaynakları içindir.

## Kontrol

Telefon/PWA'da barkod kamerasını açın. Flaş aç düğmesine dokununca kamera ışığı yanmalı; tekrar dokununca sönmeli. Flaş açıkken barkod okutup veya kamerayı kapatıp ışığın söndüğünü kontrol edin.

Kod ve kamera davranışları taklit kamera ile doğrulandı. Gerçek telefonun LED'i bu ortamda denenemedi.
