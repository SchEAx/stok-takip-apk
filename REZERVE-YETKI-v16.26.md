# GarageFlow v16.26 — Personel rezerve yetkisi

Kasa rolündeki Mert gibi, Admin tarafından stok giriş/çıkış yetkisi verilen
personelin ürün kartında “Rezerve et” düğmesi görünür. İşlem yetkisi kişiye
verilen izne göre kontrol edilir; personeli Admin veya Depo yapmak gerekmez.

Kullanıcılar → Kategori ve İşlem Yetkileri bölümündeki mevcut Stok Çıkış
kutusunun adı **Stok Çıkış / Rezerve** oldu. Önceden kaydedilen `stockOut`
yetkisi kullanılır; yeni bir izin kutusunu açmanız gerekmez. Yetki açık olmalı
ve ürünün kategorisi o kişiye verilmiş olmalıdır. Eksik izin otomatik açılmaz.

## Kurulum

1. Önce `GarageFlow-VDS-Rezerve-Yetki-Onarimi-v3.zip` içindeki VDS yamasını
   kurun. Önceki v2 rezervasyon yamasının üzerine kurulabilir.
2. Bu ZIP içindeki `stok-takip-apk-main` klasörünün içeriklerini mevcut
   GarageFlow GitHub/Vercel ön yüz projesinde güncelleyin ve yayınlayın.
3. Mert hesabında çıkış yapıp tekrar giriş yapın; böylece güncel yetkiler alınır.

Rezerve toplam stoğu değiştirmez; kullanılabilir stoğu azaltır. Rezerveler
sayfasında satışı tamamlamak ve iptal etmek yalnız Admin'e aittir. Kullanıcının
ürün ayırması için Rezerveler menü yetkisini açmanız gerekmez.

Önceki stok renkleri, maliyet göz simgesi ve v16.25 flaş düzeltmesi bu pakettedir.
Bu paket web/PWA ön yüzünü günceller; içindeki eski APK yeniden derlenmedi.

## Kontrol

Yerel testlerde Kasa hesabının giriş/rezerve düğmeleri, izin kapatıldığında
engelleme, kategori sınırı, barkod/ürün kartından API'ye rezervasyon isteği,
toplam stok korunması ve Admin'in satış/iptal yetkisi kontrol edildi.
Canlı VDS ve gerçek kullanıcı oturumu bu ortamdan çalıştırılmadı.
