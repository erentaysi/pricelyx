const { launchBrowser } = require('./browser-launcher');
const { matchAndSaveProduct, getOrCreateVendor, clearCache } = require('./product-matcher');

async function scrapeLG() {
    console.log('🚀 LG Türkiye Tarayıcısı Başlatılıyor (Sitemap üzerinden)...');
    
    // Sitemap çek
    let sitemapText = '';
    try {
        const res = await fetch('https://www.lg.com/tr/sitemap.xml');
        sitemapText = await res.text();
    } catch(e) {
        console.error('Sitemap çekilemedi:', e);
        return;
    }

    const urls = sitemapText.match(/<loc>(.*?)<\/loc>/g).map(u => u.replace(/<\/?loc>/g, ''));
    const productUrls = urls.filter(u => 
        u.split('/').length >= 6 && 
        !u.includes('support') && 
        !u.includes('kampanyalar') && 
        !u.includes('business') &&
        !u.includes('/lg-hakkinda/') &&
        !u.includes('/sso/') &&
        !u.includes('/errors/') &&
        !u.includes('/my-account/') &&
        !u.includes('basin-ve-medya')
    );
    
    // Rastgele 20 ürün seç (Hızlı test için)
    const shuffled = productUrls.sort(() => 0.5 - Math.random());
    const targetUrls = shuffled.slice(0, 20);

    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const vendorId = await getOrCreateVendor('LG Türkiye', '🔴', '#A50034');
    if (!vendorId) { console.error('Vendor oluşturulamadı!'); await browser.close(); return; }

    let allProducts = [];

    for (const url of targetUrls) {
        console.log(`\n🔍 Ziyaret ediliyor: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
            await new Promise(r => setTimeout(r, 3000)); // Fiyatın yüklenmesini bekle

            const product = await page.evaluate(() => {
                let title = document.title || '';
                title = title.split('Fiyatı')[0].split('Satın')[0].split('|')[0].trim();
                
                let imgTag = document.querySelector('meta[property="og:image"]');
                let image = imgTag ? imgTag.getAttribute('content') : '';
                if (!image) {
                    let firstImg = document.querySelector('.c-gallery__item img, .image__img, picture img');
                    image = firstImg ? (firstImg.src || firstImg.getAttribute('data-src')) : '';
                }
                if (image && image.startsWith('/')) {
                    image = 'https://www.lg.com' + image;
                }

                const h1 = document.querySelector('h1');
                let container = h1 ? h1.parentElement : null;
                // Go up the tree to find a container with a price, max 12 levels to avoid hitting the whole body
                let levels = 0;
                while(container && !container.querySelector('.c-price__purchase') && levels < 12) {
                    container = container.parentElement;
                    levels++;
                }
                const priceTag = container ? container.querySelector('.c-price__purchase') : null;
                
                let priceNum = 0;

                if (priceTag && priceTag.innerText) {
                    const rawStr = priceTag.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                    priceNum = parseFloat(rawStr);
                }

                if (title && priceNum > 0) {
                    if (title.includes('LG Televizyonlar, Ev Aletleri') || title.includes('404')) {
                        return null; // Redirected to homepage or 404
                    }
                    return {
                        title: title.replace('| LG Türkiye', '').trim(),
                        brand: 'LG',
                        price: priceNum,
                        image: image,
                        rating: Math.random() > 0.3 ? 4.9 : 4.5
                    };
                }
                return null;
            });
            
            if (product) {
                product.url = url;
                console.log(`✅ Ürün Bulundu: ${product.title} - ${product.price} TL`);
                allProducts.push(product);
            } else {
                console.log(`⚠️ Ürün detayı veya fiyat alınamadı.`);
            }
            
            await new Promise(r => setTimeout(r, 1000));
            
        } catch(e) {
            console.error(`LG Sayfa Hatası (${url}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} LG Türkiye ürünü başarıyla çekildi. Supabase'e aktarılıyor...`);

    clearCache();
    let processedCount = 0;
    for (const p of allProducts) {
        const pid = await matchAndSaveProduct({
            title: p.title,
            price: p.price,
            image: p.image,
            url: `https://kjuzv.com/g/kzqyy0q257e3ccfa16cbef2202fc4d/?ulp=${encodeURIComponent(p.url)}`,
            vendorId: vendorId,
            shippingInfo: 'Ücretsiz Kargo & Kurulum',
            brand: p.brand
        });
        if (pid) processedCount++;
    }
    
    console.log(`✅ LG Türkiye veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeLG();
