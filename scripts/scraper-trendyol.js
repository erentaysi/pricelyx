const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeTrendyol() {
    console.log('🚀 Trendyol Stealth Tarayıcısı Başlatılıyor...');
    
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

    const vendorId = await getOrCreateVendor('Trendyol', '🟠', '#F27A1A');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Trendyol)`);
        const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&sst=MOST_RATED`;
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for product cards to load (Trying multiple possible selectors)
            await page.waitForSelector('.p-card-wrppr, .p-card-chldrn-cntnr, [data-id]', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            // Extract data from the DOM with extra-resilient logic
            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.p-card-wrppr, .p-card-chldrn-cntnr');
                
                cards.forEach(card => {
                    if (results.length >= 25) return;

                    const aTag = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                    const imgTag = card.querySelector('img');
                    
                    // Specific Trendyol title and price classes
                    const brandEl = card.querySelector('.prdct-desc-cntnr-ttl');
                    const nameEl = card.querySelector('.prdct-desc-cntnr-name');
                    const priceEl = card.querySelector('.prc-box-dscntd') || card.querySelector('.prc-box-sllng');

                    if (aTag && priceEl && nameEl) {
                        const brandText = brandEl ? brandEl.innerText.trim() : '';
                        const nameText = nameEl.innerText.trim();
                        const titleText = `${brandText} ${nameText}`.trim();
                        
                        // Price parsing: Remove TL, spaces, dots (thousands separator), replace comma with dot
                        const rawPrice = priceEl.innerText.split('TL')[0].trim();
                        const priceNum = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));

                        if (!isNaN(priceNum) && priceNum > 0) {
                            let linkUrl = aTag.href;
                            // Clean up Trendyol boutique tracking params if needed, but keep product variant params
                            if (linkUrl.includes('?')) {
                                const urlObj = new URL(linkUrl);
                                urlObj.searchParams.delete('boutiqueId');
                                urlObj.searchParams.delete('merchantId');
                                linkUrl = urlObj.toString();
                            }

                            results.push({
                                id: titleText.substring(0, 10),
                                title: titleText,
                                brand: brandText || titleText.split(' ')[0],
                                price: priceNum,
                                image: imgTag ? (imgTag.src || imgTag.getAttribute('data-src') || '') : '',
                                url: linkUrl
                            });
                        }
                    }
                });
                return results;
            });
            
            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            allProducts = allProducts.concat(products);

            // Random delay between requests to mimic human behavior
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
            
        } catch (error) {
            console.error(`Hata (${query}):`, error.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} Trendyol ürünü çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: p.url,
            vendorId: vendorId,
            shippingInfo: 'Kargo Bedava'
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ Trendyol veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeTrendyol();
