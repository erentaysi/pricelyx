const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeTeknosa() {
    clearCache();
    console.log('🟠 Teknosa Scraper Başlatılıyor...');

    const vendorId = await getOrCreateVendor('Teknosa', '🟠', '#FF6600');
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
        console.log(`\n🔍 Aranıyor: "${query}" (Teknosa)`);
        const url = `https://www.teknosa.com/arama/?s=${encodeURIComponent(query)}`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for products with fallback selectors
            await page.waitForSelector('.product-card, .prd-listItem, [class*="product-card"], [class*="prd-list"], [class*="ProductCard"]', { timeout: 15000 })
                .catch(() => console.log(`⚠️ Ürün kartları yüklenemedi: ${query}`));

            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.product-card, .prd-listItem, [class*="product-card"], [class*="prd-list"], [class*="ProductCard"], [class*="product-item"]');

                cards.forEach(card => {
                    if (results.length >= 15) return;

                    try {
                        // Title
                        const titleEl = card.querySelector('.product-card__title, .prd-listItemName, .product-name, [class*="product-name"], [class*="prd-name"], [class*="productName"], h3, h2, a[title]');
                        const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText || '').trim() : '';

                        // Price - Teknosa may show discounted price
                        const priceEl = card.querySelector('.product-card__price, .prd-listItemPrice, .price, [class*="product-price"], [class*="prd-price"], [class*="discountedPrice"], .current-price');
                        let priceText = priceEl ? priceEl.innerText.trim() : '';
                        // Extract the last price if multiple shown (discounted is usually last or styled)
                        const priceMatches = priceText.match(/[\d.,]+/g);
                        let price = 0;
                        if (priceMatches && priceMatches.length > 0) {
                            // Take the last numeric match (usually the discounted/current price)
                            const lastMatch = priceMatches[priceMatches.length - 1];
                            price = parseFloat(lastMatch.replace(/\./g, '').replace(',', '.'));
                        }

                        // Image
                        const imgEl = card.querySelector('img');
                        const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || '') : '';

                        // URL
                        const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                        let productUrl = linkEl ? linkEl.href : '';
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.teknosa.com' + productUrl;
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
            console.error(`❌ Teknosa Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🟠 Toplam ${allProducts.length} Teknosa ürünü çekildi. Eşleştirme başlıyor...`);

    let processedCount = 0;
    for (const p of allProducts) {
        try {
            const result = await matchAndSaveProduct({
                title: p.title,
                price: p.price,
                image: p.image,
                url: p.url,
                vendorId: vendorId,
                shippingInfo: 'Ücretsiz Kargo'
            });
            if (result) processedCount++;
        } catch (e) {
            console.error(`⚠️ Ürün kaydetme hatası:`, e.message);
        }
    }

    console.log(`✅ Teknosa tamamlandı! İşlenen: ${processedCount}/${allProducts.length}`);
}

scrapeTeknosa();
