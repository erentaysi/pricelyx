const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeVatan() {
    clearCache();
    console.log('💻 Vatan Bilgisayar Scraper Başlatılıyor...');

    const vendorId = await getOrCreateVendor('Vatan Bilgisayar', '💻', '#0066CC');
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
        console.log(`\n🔍 Aranıyor: "${query}" (Vatan Bilgisayar)`);
        const url = `https://www.vatanbilgisayar.com/arama/${encodeURIComponent(query)}/`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for products with fallback selectors
            await page.waitForSelector('.product-list-item, .product-list__item, .product-list--item, [class*="product-list"], .wrapper-product', { timeout: 15000 })
                .catch(() => console.log(`⚠️ Ürün kartları yüklenemedi: ${query}`));

            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('.product-list-item, .product-list__item, .product-list--item, [class*="product-list-item"], .wrapper-product');

                cards.forEach(card => {
                    if (results.length >= 15) return;

                    try {
                        // Title
                        const titleEl = card.querySelector('.product-list-item__name, .product-name, .product__name, h3, h2, a[title], [class*="product-name"], [class*="productName"]');
                        const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText || '').trim() : '';

                        // Price - Vatan often shows discounted + original price
                        const priceEl = card.querySelector('.product-list-item__price, .product-price, .price--last, [class*="product-price"], [class*="currentPrice"], .current-price, .price-new');
                        let priceText = priceEl ? priceEl.innerText.trim() : '';
                        priceText = priceText.split('TL')[0].trim();
                        priceText = priceText.replace(/[₺\s]/g, '');
                        const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));

                        // Image
                        const imgEl = card.querySelector('img');
                        const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original') || '') : '';

                        // URL
                        const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                        let productUrl = linkEl ? linkEl.href : '';
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.vatanbilgisayar.com' + productUrl;
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
            console.error(`❌ Vatan Bilgisayar Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n💻 Toplam ${allProducts.length} Vatan Bilgisayar ürünü çekildi. Eşleştirme başlıyor...`);

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

    console.log(`✅ Vatan Bilgisayar tamamlandı! İşlenen: ${processedCount}/${allProducts.length}`);
}

scrapeVatan();
