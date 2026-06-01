const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeMediaMarkt() {
    clearCache();
    console.log('🔴 MediaMarkt Scraper Başlatılıyor...');

    const vendorId = await getOrCreateVendor('MediaMarkt', '🔴', '#DF0000');
    if (!vendorId) { console.error('❌ Vendor oluşturulamadı!'); return; }
    console.log(`✅ Vendor ID: ${vendorId}`);

    const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

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
        console.log(`\n🔍 Aranıyor: "${query}" (MediaMarkt)`);
        const url = `https://www.mediamarkt.com.tr/tr/search.html?query=${encodeURIComponent(query)}`;

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for products with fallback selectors
            await page.waitForSelector('[data-test="product-tile"], .product-tile, [class*="product-tile"], [class*="ProductCard"]', { timeout: 15000 })
                .catch(() => console.log(`⚠️ Ürün kartları yüklenemedi: ${query}`));

            const products = await page.evaluate(() => {
                const results = [];
                const cards = document.querySelectorAll('[data-test="product-tile"], .product-tile, [class*="product-tile"], [class*="ProductCard"], [class*="product-card"]');

                cards.forEach(card => {
                    if (results.length >= 15) return;

                    try {
                        // Title
                        const titleEl = card.querySelector('[data-test="product-title"], .product-title, h2, h3, [class*="product-title"], [class*="ProductTitle"], a[title], p[class*="title"]');
                        const title = titleEl ? (titleEl.getAttribute('title') || titleEl.innerText || '').trim() : '';

                        // Price
                        const priceEl = card.querySelector('[data-test="product-price"], .price, [class*="price"], [class*="Price"], [class*="fiyat"]');
                        let priceText = priceEl ? priceEl.innerText.trim() : '';
                        // Remove currency symbols, "TL", non-breaking spaces
                        priceText = priceText.replace(/[₺TL\s]/g, '').trim();
                        // Handle Turkish format: 1.234,56
                        const price = parseFloat(priceText.replace(/\./g, '').replace(',', '.'));

                        // Image
                        const imgEl = card.querySelector('img');
                        const image = imgEl ? (imgEl.src || imgEl.getAttribute('data-src') || imgEl.getAttribute('data-lazy-src') || '') : '';

                        // URL
                        const linkEl = card.querySelector('a') || (card.tagName === 'A' ? card : null);
                        let productUrl = linkEl ? linkEl.href : '';
                        if (productUrl && !productUrl.startsWith('http')) {
                            productUrl = 'https://www.mediamarkt.com.tr' + productUrl;
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
            console.error(`❌ MediaMarkt Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🔴 Toplam ${allProducts.length} MediaMarkt ürünü çekildi. Eşleştirme başlıyor...`);

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

    console.log(`✅ MediaMarkt tamamlandı! İşlenen: ${processedCount}/${allProducts.length}`);
}

scrapeMediaMarkt();
