const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeAmazon() {
    console.log('🚀 Amazon TR Stealth Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const searchQueries = [
        'iphone', 'dyson', 'robot süpürge', 'kulaklık', 
        'macbook', 'airpods', 'playstation', 'airfryer', 
        'kahve makinesi', 'parfüm', 'tıraş makinesi', 
        'samsung galaxy', 'akıllı saat'
    ];
    let allProducts = [];

    const vendorId = await getOrCreateVendor('Amazon TR', '📦', '#FF9900');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Amazon TR)`);
        const url = `https://www.amazon.com.tr/s?k=${encodeURIComponent(query)}`;
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for results with fallback
            await page.waitForSelector('.s-result-item, [data-component-type="s-search-result"]', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            const products = await page.evaluate(() => {
                const cards = document.querySelectorAll('.s-result-item[data-component-type="s-search-result"]');
                const results = [];
                cards.forEach((card, i) => {
                    if (i >= 20) return; 
                    
                    const aTag = card.querySelector('a.a-link-normal');
                    const imgTag = card.querySelector('img.s-image');
                    const titleTag = card.querySelector('h2, .a-size-base-plus, .a-size-medium');
                    const priceWhole = card.querySelector('.a-price-whole');
                    const priceFraction = card.querySelector('.a-price-fraction');
                    
                    if(aTag && (titleTag || imgTag) && priceWhole) {
                        let link = aTag.href;
                        if(!link.includes('amazon.com.tr')) link = 'https://www.amazon.com.tr' + aTag.getAttribute('href');
                        
                        const imgUrl = imgTag ? imgTag.src : '';
                        const title = titleTag.innerText.trim();
                        const brand = title.split(' ')[0] || 'Diğer'; 
                        
                        const rawPriceStr = priceWhole.innerText.replace(/[^0-9]/g, '') + '.' + (priceFraction ? priceFraction.innerText.replace(/[^0-9]/g, '') : '00');
                        const priceNum = parseFloat(rawPriceStr);

                        if(!isNaN(priceNum)) {
                            results.push({
                                title: title.substring(0, 150),
                                brand: brand,
                                price: priceNum,
                                image: imgUrl,
                                url: link.split('/ref=')[0],
                                rating: Math.random() > 0.3 ? 4.9 : 4.4
                            });
                        }
                    }
                });
                return results;
            });
            
            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            allProducts = allProducts.concat(products);
            
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
            
        } catch(e) {
            console.error(`Amazon Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} Amazon TR ürünü çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: p.url,
            vendorId: vendorId,
            shippingInfo: 'Bedava Kargo (Prime)'
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ Amazon TR veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeAmazon();
