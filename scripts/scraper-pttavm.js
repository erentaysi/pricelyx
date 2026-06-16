const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapePttAVM() {
    clearCache();
    console.log('📮 PttAVM Scraper Başlatılıyor...');

    const vendorId = await getOrCreateVendor('PttAVM', '📮', '#FFCC00');
    if (!vendorId) { console.error('❌ Vendor oluşturulamadı!'); return; }
    console.log(`✅ Vendor ID: ${vendorId}`);

    const browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const searchQueries = [
        'iphone', 'dyson', 'robot süpürge', 'kulaklık',
        'macbook', 'airpods', 'playstation', 'airfryer',
        'kahve makinesi', 'parfüm', 'tıraş makinesi',
        'samsung galaxy', 'akıllı saat'
    ];

    let allProducts = [];

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: "${query}" (PttAVM)`);
        const url = `https://www.pttavm.com/arama?q=${encodeURIComponent(query)}`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for products with fallback selectors
            await page.waitForSelector('.product-card, .urunListItem, .product-list-item, [class*="product"]', { timeout: 15000 })
                .catch(() => console.log(`⚠️ Ürün kartları yüklenemedi: ${query}`));

            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.product-card, .urunListItem, .product-list-item, [class*="product-card"], [class*="urunList"]');

                cards.forEach(card => {
                    if (results.length >= 15) return;

                    try {
                        // Title
                        const titleEl = card.querySelector('.product-name, .urunAdi, .product-title, [class*="product-name"], [class*="urunAdi"], h3, h2, a[title]');
                        const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText || '').trim() : '';

                        // Price
                        const priceEl = card.querySelector('.product-price, .fiyat, .price, [class*="price"], [class*="fiyat"], .discounted-price, .sale-price');
                        let priceText = priceEl ? priceEl.innerText.trim() : '';
                        priceText = priceText.split('TL')[0].trim();
                        const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));

                        // Image
                        const imgEl = card.querySelector('img');
                        const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || '') : '';

                        // URL
                        const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                        let productUrl = linkEl ? linkEl.href : '';
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.pttavm.com' + productUrl;
                        }

                        if (title && !isNaN(price) && price > 0) {
                            results.push({ title, price, image, url: productUrl });
                        }
                    } catch (e) { /* skip card */ }
                });

                return results;
            });

            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            allProducts = allProducts.concat(products);

            // Random delay 1-3 seconds
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));

        } catch (e) {
            console.error(`❌ PttAVM Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n📮 Toplam ${allProducts.length} PttAVM ürünü çekildi. Eşleştirme başlıyor...`);

    let processedCount = 0;
    for (const p of allProducts) {
        try {
            const result = await matchAndSaveProduct({
                title: p.title,
                price: p.price,
                image: p.image,
                url: p.url,
                vendorId: vendorId,
                shippingInfo: 'PTT Kargo'
            });
            if (result) processedCount++;
        } catch (e) {
            console.error(`⚠️ Ürün kaydetme hatası:`, e.message);
        }
    }

    console.log(`✅ PttAVM tamamlandı! İşlenen: ${processedCount}/${allProducts.length}`);
}

scrapePttAVM();
