# Piinti Mimari ve Kodlama Standartları

Bu proje için AI asistanların uyması gereken GÜVENLİK, PERFORMANS ve UX kuralları aşağıda listelenmiştir. Lütfen kod üretirken bu kuralları esnetmeyin.

## 1. 🛡️ SİBER GÜVENLİK VE ALTYAPI SAĞLAMLIĞI (Security First)
- **API ve Veritabanı Güvenliği:** API anahtarları (`client_secret`, token vb.) asla frontend tarafına (istemciye) sızdırılmamalı, her zaman `.env.local` dosyası üzerinden okunmalıdır.
- **Veri Doğrulama (Sanitization & Validation):** Kullanıcıdan veya dış API'den gelen linkler (tracking_link), metinler mutlaka XSS saldırılarına karşı kontrol edilmeli veya React'in render mekanizmasıyla güvenli hale getirilmelidir.
- **Bot Koruması Hazırlığı:** Gelecekte eklenecek Rate Limiting ve Cloudflare katmanlarını bozmamak adına tüm API route'larında IP bazlı sınırlandırmalara uygun `req.headers` yapıları korunmalıdır.

## 2. ⚡ ULTRA HIZ VE PERFORMANS (Core Web Vitals)
- **SSR ve ISR (Caching):** Next.js sayfalarında, dinamik içeriği gereksiz yere her seferinde çekmemek için `force-dynamic` yerine **ISR** (`export const revalidate = 3600;`) kullanılmalıdır. API çağrıları önbelleklenmelidir.
- **Görsel Optimizasyonu:** Asla çıplak `<img>` etiketi kullanılmamalıdır. Daima `next/image` (`<Image>`) bileşeni kullanılmalı, `loading="lazy"` varsayılan olmalı ve formatlar yeni nesil (WebP) destekli Next Image Optimization üzerinden geçmelidir.
- **Performans Hedefi:** LCP (İlk Zengin Boyama) 1.2 saniyenin altında tutulmalıdır.

## 3. 📱 RESPONSIVE MOBIL DENEYİM VE UI/UX
- **Mobile-First Tasarım:** TailwindCSS yazılırken önce mobil cihazlar için tasarlanmalı, ardından `md:` ve `lg:` prefixleriyle masaüstüne genişletilmelidir.
- **Sıfır Hayal Kırıklığı:** Çalışmayan, süresi geçmiş kuponlar `date_end` filtresi ile gizlenmeli veya pasife alınmalıdır.
- **2 Tıklama Kuralı:** Kullanıcı siteye girdikten sonra minimum tıklama ile amaca (kupona veya ürüne) ulaşabilmelidir.
- **Kupon Kopyalama:** "Kodu Kopyala" butonu tıklandığında hem kodu hafızaya almalı hem de kullanıcıya onay vermeli, aynı anda affiliate komisyonunu saydırmak için `tracking_link` URL'sini **yeni bir sekmede** açmalıdır.

## 4. 📈 SEO VE GELECEKTEKİ MOBİL UYGULAMA HAZIRLIĞI
- **Dinamik SEO & Schema.org:** İndirim kuponu ve ürün sayfaları `generateMetadata` ile dinamik başlık/açıklama üretmeli ve mutlaka `<script type="application/ld+json">` kullanarak Schema.org `Coupon` / `Offer` işaretlemelerini sayfaya dahil etmelidir.
- **API-Driven Mantık:** Supabase işlemleri doğrudan RESTful prensiplere uygun yazılmalı, mobil uygulama (React Native/Flutter) için de veriler kolayca alınabilecek şeffaflıkta olmalıdır.
