const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function scrapeTrendyol() {
    console.log('🚀 Trendyol Stealth Tarayıcısı Başlatılıyor...');
    
    // Launch browser
    const browser = await puppeteer.launch({ 
        headless: "new",
        executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const searchQueries = ['iphone', 'dyson', 'robot süpürge', 'kulaklık', 'airfryer', 'oyuncu bilgisayarı'];
    let allProducts = [];

    const vendorName = 'Trendyol';
    // Get vendor ID
    let vendorId = 2; // Default fallback
    const { data: vData } = await supabase.from('vendors').select('id').eq('name', vendorName).single();
    if(vData) vendorId = vData.id;

    for (const query of searchQueries) {
        console.log(`\n🔍 Aranıyor: ${query} (Trendyol)`);
        const url = `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&sst=MOST_RATED`;
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            
            // Wait for product cards to load
            await page.waitForSelector('.p-card-wrppr', { timeout: 15000 }).catch(() => console.log('Products missing for ' + query));

            // Extract data from the DOM
            const products = await page.evaluate(() => {
                const cards = document.querySelectorAll('.p-card-wrppr');
                const results = [];
                cards.forEach((card, i) => {
                    if (i >= 20) return; // Top 20 per query
                    
                    const aTag = card.querySelector('a');
                    const imgTag = card.querySelector('.p-card-img');
                    const brandTag = card.querySelector('.prdct-desc-cntnr-ttl');
                    const nameTag = card.querySelector('.prdct-desc-cntnr-name') || card.querySelector('.prdct-desc-cntnr-name-p');
                    const priceTag = card.querySelector('.prc-box-dscntd');
                    
                    if(aTag && nameTag && priceTag) {
                        const link = aTag.href.includes('trendyol') ? aTag.href : 'https://www.trendyol.com' + aTag.getAttribute('href');
                        const imgUrl = imgTag ? imgTag.src : '📦';
                        const brand = brandTag ? brandTag.innerText.trim() : 'Diğer';
                        const name = nameTag.innerText.trim();
                        
                        // Parse price "42.999 TL" -> 42999
                        const rawPrice = priceTag.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                        const priceNum = parseFloat(rawPrice);

                        results.push({
                            title: brand + ' ' + name, // Combine to get full title
                            brand: brand,
                            price: priceNum,
                            image: imgUrl,
                            url: link.split('?')[0], // Remove query params
                            rating: 4.5
                        });
                    }
                });
                return results;
            });
            
            console.log(`✅ ${products.length} ürün bulundu (${query})`);
            allProducts = allProducts.concat(products);
            
            // Random delay to mimic human behavior
            await new Promise(r => setTimeout(r, Math.random() * 2000 + 1000));
            
        } catch(e) {
            console.error(`Trendyol Hata (${query}):`, e.message);
        }
    }

    await browser.close();
    console.log(`\n🎉 Toplam ${allProducts.length} Trendyol ürünü çekildi. Supabase'e aktarılıyor...`);

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
        if(t.includes('süpürge') || t.includes('airfryer') || t.includes('dyson')) catSlug = 'ev-yasam';

        let catObj = categories.find(c => c.slug === catSlug);

        const { data: existingProd } = await supabase.from('products').select('id').ilike('title', p.title).limit(1);
        let pId = existingProd && existingProd[0] ? existingProd[0].id : null;

        if(!pId) {
            const { data: nProd } = await supabase.from('products').insert({
                title: p.title,
                brand_id: brandObj ? brandObj.id : null,
                category_id: catObj ? catObj.id : null,
                image_url: p.image,
                rating: 4.8,
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
                    original_price: Math.floor(p.price * 1.1),
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
    
    console.log(`✅ Trendyol veritabanı eşitlemesi tamamlandı! İşlenen: ${processedCount}`);
}

scrapeTrendyol();
