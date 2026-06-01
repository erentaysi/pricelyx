const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeN11() {
    console.log('🚀 N11 Stealth Tarayıcısı Başlatılıyor...');
    
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: process.env.CHROME_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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

    const vendorId = await getOrCreateVendor('n11', '🔵', '#5B2D8E');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (N11)`);
        const url = `https://www.n11.com/arama?q=${encodeURIComponent(query)}&srt=MOST_RATED`;
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for product list
            await page.waitForSelector('.columnContent, .resultList, .listView', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            const products = await page.evaluate(() => {
                const results = [];
                
                // N11 product cards - strict selectors
                const cards = document.querySelectorAll('.columnContent .pro, .resultList li.column');
                
                cards.forEach(card => {
                    if (results.length >= 20) return;
                    
                    const aTag = card.querySelector('a');
                    const imgTag = card.querySelector('img');
                    const titleEl = card.querySelector('.proName, .productName, h3');
                    const priceEl = card.querySelector('.newPrice ins, .newPrice');
                    
                    if (aTag && priceEl) {
                        const title = titleEl ? titleEl.innerText.trim() : (imgTag ? imgTag.alt : '');
                        
                        // Price parsing: Remove TL, spaces, dots (thousands separator), replace comma with dot
                        const rawPrice = priceEl.innerText.split('TL')[0].trim();
                        const priceNum = parseFloat(rawPrice.replace(/\./g, '').replace(',', '.'));
                        
                        if (title && !isNaN(priceNum) && priceNum > 0) {
                            results.push({
                                title: title.substring(0, 150),
                                brand: title.split(' ')[0] || 'Diğer',
                                price: priceNum,
                                image: imgTag ? (imgTag.src || imgTag.getAttribute('data-src') || imgTag.getAttribute('data-original') || '') : '',
                                url: aTag.href
                            });
                        }
                    }
                });
                
                return results;
            });
            
            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            allProducts = allProducts.concat(products);
            
            // Human-like delay
            await new Promise(r => setTimeout(r, Math.random() * 3000 + 1500));
            
        } catch(e) {
            console.error(`N11 Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} N11 ürünü çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: p.url,
            vendorId: vendorId,
            shippingInfo: 'Standart Kargo'
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ N11 veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeN11();
