const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeCiceksepeti() {
    clearCache();
    console.log('🌸 Çiçeksepeti Scraper Başlatılıyor...');

    const vendorId = await getOrCreateVendor('Çiçeksepeti', '🌸', '#8B5CF6');
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
        console.log(`\n🔍 Aranıyor: "${query}" (Çiçeksepeti)`);
        const url = `https://www.ciceksepeti.com/arama?q=${encodeURIComponent(query)}`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for products with fallback selectors
            await page.waitForSelector('.product-item, .product-card, [class*="product-item"], [class*="ProductCard"], [class*="product-card"]', { timeout: 15000 })
                .catch(() => console.log(`⚠️ Ürün kartları yüklenemedi: ${query}`));

            // Scroll down to trigger lazy loading
            await page.evaluate(() => {
                window.scrollBy(0, 800);
            });
            await new Promise(r => setTimeout(r, 1000));

            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.product-item, .product-card, [class*="product-item"], [class*="ProductCard"], [class*="product-card"], [class*="productCard"]');

                cards.forEach(card => {
                    if (results.length >= 15) return;

                    try {
                        // Title
                        const titleEl = card.querySelector('.product-name, .product-title, [class*="product-name"], [class*="productName"], [class*="ProductName"], h3, h2, a[title], [class*="title"]');
                        const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText || '').trim() : '';

                        // Price
                        const priceEl = card.querySelector('.product-price, .price, [class*="product-price"], [class*="productPrice"], [class*="Price"], [class*="discounted"], .current-price');
                        let priceText = priceEl ? priceEl.innerText.trim() : '';
                        priceText = priceText.replace(/[₺TL\s]/g, '').trim();
                        // Handle multiple prices (original + discounted)
                        const priceMatches = priceText.match(/[\d.,]+/g);
                        let price = 0;
                        if (priceMatches && priceMatches.length > 0) {
                            // Take the first valid price
                            for (const match of priceMatches) {
                                const parsed = parseFloat(match.replace(/\./g, '').replace(',', '.'));
                                if (!isNaN(parsed) && parsed > 0) {
                                    price = parsed;
                                    break;
                                }
                            }
                        }

                        // Image
                        const imgEl = card.querySelector('img');
                        const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy') || imgEl.getAttribute('data-original') || '') : '';

                        // URL
                        const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                        let productUrl = linkEl ? linkEl.href : '';
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.ciceksepeti.com' + productUrl;
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
            console.error(`❌ Çiçeksepeti Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🌸 Toplam ${allProducts.length} Çiçeksepeti ürünü çekildi. Eşleştirme başlıyor...`);

    let processedCount = 0;
    for (const p of allProducts) {
        try {
            const result = await matchAndSaveProduct({
                title: p.title,
                price: p.price,
                image: p.image,
                url: p.url,
                vendorId: vendorId,
                shippingInfo: 'Standart Kargo'
            });
            if (result) processedCount++;
        } catch (e) {
            console.error(`⚠️ Ürün kaydetme hatası:`, e.message);
        }
    }

    console.log(`✅ Çiçeksepeti tamamlandı! İşlenen: ${processedCount}/${allProducts.length}`);
}

scrapeCiceksepeti();
