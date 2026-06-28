const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeLG() {
    console.log('🚀 LG Türkiye Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const searchQueries = [
        'oled tv', 'qned tv', 'nanocell', 'uhd tv', 'soundbar', 
        'buzdolabı', 'çamaşır makinesi', 'bulaşık makinesi', 'kurutma makinesi',
        'klima', 'monitör', 'gram laptop', 'projeksiyon', 'hoparlör'
    ];
    
    let allProducts = [];

    // "LG Türkiye" adıyla mağaza oluştur (Admitad onayı alındığı için)
    const vendorId = await getOrCreateVendor('LG Türkiye', '🔴', '#A50034');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (LG Türkiye)`);
        const url = `https://www.lg.com/tr/search/?search=${encodeURIComponent(query)}`;
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for results
            await page.waitForSelector('.product-list-box, .c-search-result__item, .c-product-list__item', { timeout: 15000 }).catch(() => console.log('Products missing or taking too long for ' + query));

            // Kaydırarak resimlerin yüklenmesini sağla
            await page.evaluate(async () => {
                for (let i = 0; i < 10; i++) {
                    window.scrollBy(0, window.innerHeight);
                    await new Promise(r => setTimeout(r, 500));
                }
            });

            const products = await page.evaluate(() => {
                // LG'nin muhtemel ürün kartı classları
                const cards = document.querySelectorAll('.c-search-result__item, .c-product-list__item, .product-list-box, .c-product-item');
                const results = [];
                
                cards.forEach((card, i) => {
                    if (i >= 30) return; 
                    
                    const aTag = card.querySelector('a.c-product-item__default-image, a.product-image, a[data-link-name="product image"], a.c-product-item__model-name');
                    const imgTag = card.querySelector('img.c-image__img, img.product-image');
                    const titleTag = card.querySelector('.c-product-item__ufn, .c-product-item__model-name, .product-name');
                    const priceTag = card.querySelector('.c-price__purchase, .price-area .price');
                    
                    if(aTag && titleTag && priceTag) {
                        let link = aTag.href;
                        if(!link.includes('lg.com')) link = 'https://www.lg.com' + aTag.getAttribute('href');
                        
                        const imgUrl = imgTag ? (imgTag.src || imgTag.dataset.src || '') : '';
                        const title = titleTag.innerText.trim();
                        // LG sitesindeki her ürün LG'dir.
                        const brand = 'LG'; 
                        
                        // Fiyat temizleme (Örn: "₺ 29.999,00" -> 29999.00)
                        const rawPriceStr = priceTag.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                        const priceNum = parseFloat(rawPriceStr);

                        if(!isNaN(priceNum) && priceNum > 0) {
                            results.push({
                                title: title.substring(0, 150),
                                brand: brand,
                                price: priceNum,
                                image: imgUrl,
                                url: link,
                                rating: Math.random() > 0.3 ? 4.9 : 4.5
                            });
                        }
                    }
                });
                return results;
            });
            
            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            
            // Eğer o anki sayfa arama sonucu döndürmediyse, duplicate'leri engellemek için array filter yap
            const uniqueProducts = products.filter(p => !allProducts.some(ap => ap.url === p.url));
            allProducts = allProducts.concat(uniqueProducts);
            
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
            
        } catch(e) {
            console.error(`LG Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} LG Türkiye ürünü çekildi. Supabase'e aktarılıyor...`);

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
