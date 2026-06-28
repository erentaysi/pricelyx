const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeLG() {
    console.log('🚀 LG Türkiye Tarayıcısı Başlatılıyor (Sitemap üzerinden)...');
    
    // Sitemap çek
    let sitemapText = '';
    try {
        const res = await fetch('https://www.lg.com/tr/sitemap.xml');
        sitemapText = await res.text();
    } catch(e) {
        console.error('Sitemap çekilemedi:', e);
        return;
    }

    const urls = sitemapText.match(/<loc>(.*?)<\/loc>/g).map(u => u.replace(/<\/?loc>/g, ''));
    // Kategori, destek veya kampanya sayfalarını filtrele (sadece detay ürün sayfaları kalsın)
    const productUrls = urls.filter(u => u.split('/').length >= 6 && !u.includes('support') && !u.includes('kampanyalar') && !u.includes('business'));
    
    // Rastgele 20 ürün seç (Hızlı test için)
    const shuffled = productUrls.sort(() => 0.5 - Math.random());
    const targetUrls = shuffled.slice(0, 20);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const vendorId = await getOrCreateVendor('LG Türkiye', '🔴', '#A50034');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    let allProducts = [];

    for (const url of targetUrls) {
        console.log(`\n🔍 Ziyaret ediliyor: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            await new Promise(r => setTimeout(r, 3000)); // Fiyatın yüklenmesini bekle

            const product = await page.evaluate(() => {
                const titleTag = document.querySelector('h1, meta[property="og:title"]');
                let title = '';
                if (titleTag) {
                    title = titleTag.innerText || titleTag.getAttribute('content') || '';
                }
                
                const imgTag = document.querySelector('meta[property="og:image"]');
                let image = imgTag ? imgTag.getAttribute('content') : '';

                const priceTag = document.querySelector('.c-price__purchase, .price-area .price');
                let priceNum = 0;

                if (priceTag && priceTag.innerText) {
                    const rawStr = priceTag.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                    priceNum = parseFloat(rawStr);
                }

                if (title && priceNum > 0) {
                    return {
                        title: title.replace('| LG Türkiye', '').trim(),
                        brand: 'LG',
                        price: priceNum,
                        image: image,
                        rating: Math.random() > 0.3 ? 4.9 : 4.5
                    };
                }
                return null;
            });
            
            if (product) {
                product.url = url;
                console.log(`✅ Ürün Bulundu: ${product.title} - ${product.price} TL`);
                allProducts.push(product);
            } else {
                console.log(`⚠️ Ürün detayı veya fiyat alınamadı.`);
            }
            
            await new Promise(r => setTimeout(r, 1000));
            
        } catch(e) {
            console.error(`LG Sayfa Hatası (${url}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} LG Türkiye ürünü başarıyla çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: p.url,
            vendorId: vendorId,
            shippingInfo: 'Ücretsiz Kargo & Kurulum'
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ LG Türkiye veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeLG();
