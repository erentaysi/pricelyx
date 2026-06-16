const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeHepsiburada() {
    console.log('🚀 Hepsiburada Stealth Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await launchBrowser();
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Hepsiburada blocks tightly, so set User Agent manually just in case
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const searchQueries = [
        'iphone', 'dyson', 'robot süpürge', 'kulaklık', 
        'macbook', 'airpods', 'playstation', 'airfryer', 
        'kahve makinesi', 'parfüm', 'tıraş makinesi', 
        'samsung galaxy', 'akıllı saat'
    ];
    let allProducts = [];

    const vendorId = await getOrCreateVendor('Hepsiburada', '🟣', '#FF6000');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Hepsiburada)`);
        const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}&siralama=cokdegerlendirilenler`;
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Wait for product cards to load (Flexible selectors)
            await page.waitForSelector('[data-test-id="product-card-container"], .productListContent-item', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            const products = await page.evaluate(() => {
                const results = [];
                
                const cards = document.querySelectorAll('[data-test-id="product-card-container"], .productListContent-item');
                
                cards.forEach(card => {
                    if (results.length >= 25) return;

                    const titleEl = card.querySelector('[data-test-id="product-card-name"]') || card.querySelector('h3');
                    // Explicitly target the main price, avoid installment text
                    const priceEl = card.querySelector('[data-test-id="price-current-price"]') || card.querySelector('div[data-test-id="price-current-price"]') || card.querySelector('.price-value');
                    const imgEl = card.querySelector('img');
                    const linkEl = card.querySelector('a');

                    if (titleEl && priceEl && linkEl) {
                        const titleText = titleEl.innerText.trim();
                        // Extract only the numbers from the main price container
                        const priceText = priceEl.innerText.split('TL')[0].replace(/[^0-9,]/g, '').replace(',', '.');
                        const priceNum = parseFloat(priceText);

                        if (!isNaN(priceNum) && priceNum > 0) {
                            results.push({
                                id: titleText.substring(0, 10),
                                title: titleText,
                                brand: titleText.split(' ')[0],
                                price: priceNum,
                                image: imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : '',
                                url: linkEl.href
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
            console.error(`Hepsiburada Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} Hepsiburada ürünü çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: p.url,
            vendorId: vendorId,
            shippingInfo: 'Ücretsiz Kargo'
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ Hepsiburada veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeHepsiburada();
