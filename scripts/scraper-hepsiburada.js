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

            // Extract data from the DOM with extra-resilient logic
            const products = await page.evaluate(() => {
                const results = [];
                
                // Strategy: Find price elements first, then climb up to the container
                const allElements = Array.from(document.querySelectorAll('*'));
                const priceElements = allElements.filter(el => {
                    const text = el.innerText || '';
                    return (text.includes('₺') || text.includes('TL')) && text.length < 20 && /[0-9]/.test(text);
                });

                priceElements.forEach((priceEl, i) => {
                    if (results.length >= 25) return;

                    // Climp up to find a container (usually a div, li or anchor)
                    let container = priceEl.parentElement;
                    while (container && container.tagName !== 'BODY' && container.offsetHeight < 100) {
                        container = container.parentElement;
                    }

                    if (container && !results.some(r => r.id === container.innerText.substring(0, 10))) {
                        const aTag = container.querySelector('a') || (container.tagName === 'A' ? container : null);
                        const imgTag = container.querySelector('img');
                        const textContent = container.innerText.split('\n').filter(t => t.trim().length > 3);
                        
                        if (aTag && textContent.length >= 2) {
                            const priceText = priceEl.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
                            const priceNum = parseFloat(priceText);

                            if (!isNaN(priceNum) && priceNum > 0) {
                                results.push({
                                    id: container.innerText.substring(0, 10), // temporary ID for de-duplication
                                    title: textContent[0] + ' ' + (textContent[1] || ''),
                                    brand: textContent[0],
                                    price: priceNum,
                                    image: imgTag ? (imgTag.src || imgTag.getAttribute('data-src')) : '',
                                    url: aTag.href
                                });
                            }
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
        
        // Clean title
        let cleanTitle = p.title.replace(/(Hızlı Teslimat|Ücretsiz Kargo|Kargo Bedava|Teslimat Bilgisi|Fırsat Ürünü|Yarın Kapında)/gi, '').trim();
        if (cleanTitle.length < 5) continue;

        let brandObj = brands.find(b => b.name.toLowerCase() === p.brand.toLowerCase());
        if(!brandObj) {
            const { data: nb } = await supabase.from('brands').insert({ name: p.brand }).select().single();
            if(nb) { brands.push(nb); brandObj = nb; }
        }

        let catSlug = 'elektronik';
        const t = cleanTitle.toLowerCase();
        if((t.includes('telefon') || t.includes('iphone')) && !t.includes('kulaklık') && !t.includes('kılıf')) catSlug = 'akilli-telefon';
        else if(t.includes('süpürge') || t.includes('airfryer') || t.includes('dyson') || t.includes('robot')) catSlug = 'ev-yasam';
        else if(t.includes('kulaklık') || t.includes('airpods') || t.includes('bluetooth') || t.includes('buds')) catSlug = 'elektronik';
        else if(t.includes('laptop') || t.includes('bilgisayar') || t.includes('oyuncu')) catSlug = 'bilgisayar-laptop';

        let catObj = categories.find(c => c.slug === catSlug);

        const { data: existingProd } = await supabase.from('products').select('id').ilike('title', cleanTitle).limit(1);
        let pId = existingProd && existingProd[0] ? existingProd[0].id : null;

        if(!pId) {
            // Generate mock specs based on category
            const mockSpecs = catSlug === 'akilli-telefon' 
                ? { "Ekran": "6.1 inç Dynamic Island", "İşlemci": "Snapdragon 8 Gen 3", "Hafıza": "256 GB", "Garanti": "Yurt İçi Kayıtlı" }
                : { "Motor": "Dijital V15", "Şarj": "60 Dakika", "Filtre": "HEPA", "Ağırlık": "2.4 KG" };

            const { data: nProd } = await supabase.from('products').insert({
                title: cleanTitle,
                brand_id: brandObj ? brandObj.id : null,
                category_id: catObj ? catObj.id : null,
                image_url: p.image,
                rating: 4.9,
                reviews_count: Math.floor(Math.random() * 800) + 120,
                is_trend: true,
                description: `${cleanTitle} pazar yerlerindeki en iyi fiyatlarla Piinti radarında. Karşılaştır, tasarruf et!`,
                specs: mockSpecs
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
