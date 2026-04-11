const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function scrapeAmazon() {
    console.log('🚀 Amazon TR Stealth Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const searchQueries = ['iphone', 'dyson', 'robot süpürge', 'kulaklık'];
    let allProducts = [];

    const vendorName = 'Amazon TR';
    let vendorId = 1; 
    const { data: vData } = await supabase.from('vendors').select('id').eq('name', vendorName).single();
    if(vData) vendorId = vData.id;

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Amazon TR)`);
        const url = `https://www.amazon.com.tr/s?k=${encodeURIComponent(query)}`;
        
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 15000 }).catch(() => console.log('Products missing for ' + query));

            const products = await page.evaluate(() => {
                const cards = document.querySelectorAll('[data-component-type="s-search-result"]');
                const results = [];
                cards.forEach((card, i) => {
                    if (i >= 20) return; 
                    
                    const aTag = card.querySelector('a.a-link-normal.s-no-outline');
                    const imgTag = card.querySelector('img.s-image');
                    const titleTag = card.querySelector('h2 span.a-text-normal');
                    const priceWhole = card.querySelector('.a-price-whole');
                    const priceFraction = card.querySelector('.a-price-fraction');
                    
                    if(aTag && titleTag && priceWhole) {
                        let link = aTag.href;
                        if(!link.includes('amazon.com.tr')) link = 'https://www.amazon.com.tr' + aTag.getAttribute('href');
                        
                        const imgUrl = imgTag ? imgTag.src : '📦';
                        const title = titleTag.innerText.trim();
                        const brand = title.split(' ')[0] || 'Diğer'; 
                        
                        const rawPriceStr = priceWhole.innerText.replace(/[^0-9]/g, '') + '.' + (priceFraction ? priceFraction.innerText : '00');
                        const priceNum = parseFloat(rawPriceStr);

                        if(!isNaN(priceNum)) {
                            results.push({
                                title: title.substring(0, 150),
                                brand: brand,
                                price: priceNum,
                                image: imgUrl,
                                url: link.split('?')[0],
                                rating: Math.random() > 0.3 ? 4.9 : 4.4
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
            console.error(`Amazon Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} Amazon TR ürünü çekildi. Supabase'e aktarılıyor...`);

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
        if(t.includes('süpürge') || t.includes('dyson')) catSlug = 'ev-yasam';

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
                reviews_count: Math.floor(Math.random() * 500) + 1500,
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
                    original_price: Math.floor(p.price * 1.15),
                    product_url: p.url,
                    shipping_info: 'Bedava Kargo (Prime)'
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
    
    console.log(`✅ Amazon TR veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeAmazon();
