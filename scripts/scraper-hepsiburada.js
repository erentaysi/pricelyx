const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function scrapeHepsiburada() {
    console.log('🚀 Hepsiburada Stealth Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: process.env.CHROME_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Hepsiburada blocks tightly, so set User Agent manually just in case
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const searchQueries = ['iphone', 'dyson', 'robot süpürge', 'kahve makinesi'];
    let allProducts = [];

    const vendorName = 'Hepsiburada';
    let vendorId = 3; 
    const { data: vData } = await supabase.from('vendors').select('id').eq('name', vendorName).single();
    if(vData) vendorId = vData.id;

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Hepsiburada)`);
        const url = `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}&siralama=cokdegerlendirilenler`;
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Wait for product cards to load (Flexible selectors)
            await page.waitForSelector('[data-test-id="product-card-container"], .productListContent-item', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            const products = await page.evaluate(() => {
                const cards = document.querySelectorAll('[data-test-id="product-card-container"], .productListContent-item');
                const results = [];
                cards.forEach((card, i) => {
                    if (i >= 20) return; 
                    
                    const aTag = card.querySelector('a');
                    const imgTag = card.querySelector('img');
                    const titleTag = card.querySelector('h3, [class*="product-title"]');
                    const priceTag = card.querySelector('[data-test-id="price-current-price"], [class*="price-current"]');
                    
                    if(aTag && (titleTag || imgTag) && priceTag) {
                        let link = aTag.href;
                        if(!link.includes('hepsiburada')) link = 'https://www.hepsiburada.com' + aTag.getAttribute('href');
                        
                        const imgUrl = imgTag ? (imgTag.src || imgTag.getAttribute('data-src')) : '';
                        const title = titleTag.innerText.trim();
                        // Assume first word is brand for simple parsing
                        const brand = title.split(' ')[0] || 'Diğer'; 
                        
                        const rawPrice = priceTag.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                        const priceNum = parseFloat(rawPrice);

                        if(!isNaN(priceNum)) {
                            results.push({
                                title: title,
                                brand: brand,
                                price: priceNum,
                                image: imgUrl,
                                url: link.split('?')[0],
                                rating: Math.random() > 0.5 ? 4.5 : 5.0
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

    // Ingest logically
    let processedCount = 0;
    const { data: categories } = await supabase.from('categories').select('id, slug');
    const { data: brands } = await supabase.from('brands').select('id, name');

    for(const p of allProducts) {
        if(!p.title || !p.price) continue;
        
        let brandObj = brands.find(b => b.name.toLowerCase() === p.brand.toLowerCase());
        if(!brandObj) {
            const { data: nb } = await supabase.from('brands').insert({ name: p.brand }).select().single();
            if(nb) { brands.push(nb); brandObj = nb; }
        }

        let catSlug = 'elektronik';
        const t = p.title.toLowerCase();
        if(t.includes('telefon') || t.includes('iphone')) catSlug = 'akilli-telefon';
        if(t.includes('süpürge') || t.includes('dyson') || t.includes('kahve')) catSlug = 'ev-yasam';

        let catObj = categories.find(c => c.slug === catSlug);

        const { data: existingProd } = await supabase.from('products').select('id').ilike('title', p.title).limit(1);
        let pId = existingProd && existingProd[0] ? existingProd[0].id : null;

        if(!pId) {
            const { data: nProd } = await supabase.from('products').insert({
                title: p.title,
                brand_id: brandObj ? brandObj.id : null,
                category_id: catObj ? catObj.id : null,
                image_url: p.image,
                rating: p.rating,
                reviews_count: Math.floor(Math.random() * 500) + 50,
                is_trend: true
            }).select().single();
            if(nProd) pId = nProd.id;
        }

        if(pId) {
            const { data: ep } = await supabase.from('product_prices').select('id').eq('product_id', pId).eq('vendor_id', vendorId).single();
            if(!ep) {
                await supabase.from('product_prices').insert({
                    product_id: pId,
                    vendor_id: vendorId,
                    price: p.price,
                    original_price: Math.floor(p.price * 1.05),
                    product_url: p.url,
                    shipping_info: 'Ücretsiz Kargo'
                });
                await supabase.from('price_history').insert({
                    product_id: pId, vendor_id: vendorId, price: p.price
                });
            } else {
                await supabase.from('product_prices').update({ price: p.price, product_url: p.url }).eq('id', ep.id);
            }
            processedCount++;
        }
    }
    
    console.log(`✅ Hepsiburada veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeHepsiburada();
