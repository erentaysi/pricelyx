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
        executablePath: process.env.CHROME_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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
            
            // Wait for product cards to load (Trying multiple possible selectors)
            await page.waitForSelector('.p-card-wrppr, .p-card-chldrn-cntnr, [data-id]', { timeout: 15000 })
                .catch(() => console.log('Products missing for ' + query));

            // Extract data from the DOM with extra-resilient logic
            const products = await page.evaluate(() => {
                // Find anything that looks like a product card
                const results = [];
                
                // Strategy: Find price elements first, then climb up to the container
                const allElements = Array.from(document.querySelectorAll('*'));
                const priceElements = allElements.filter(el => {
                    const text = el.innerText || '';
                    return (text.includes('₺') || text.includes('TL')) && text.length < 20 && /[0-9]/.test(text);
                });

                priceElements.forEach((priceEl, i) => {
                    if (results.length >= 25) return;

                    // Climp up to find a container (usually a div or anchor)
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

        // Clean title
        let cleanTitle = p.title.replace(/(Hızlı Teslimat|Ücretsiz Kargo|Kargo Bedava|Teslimat Bilgisi|Sepette %.* İndirim)/gi, '').trim();
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
        else if(t.includes('kulaklık') || t.includes('airpods') || t.includes('bluetooth')) catSlug = 'elektronik';
        else if(t.includes('laptop') || t.includes('bilgisayar') || t.includes('oyuncu')) catSlug = 'bilgisayar-laptop';

        let catObj = categories.find(c => c.slug === catSlug);

        const { data: existingProd } = await supabase.from('products').select('id').ilike('title', cleanTitle).limit(1);
        let pId = existingProd && existingProd[0] ? existingProd[0].id : null;

        if(!pId) {
            // Generate mock specs based on category
            const mockSpecs = catSlug === 'akilli-telefon' 
                ? { "Ekran": "6.7 inç OLED", "İşlemci": "A17 Bionic", "Batarya": "5000 mAh", "Garanti": "2 Yıl Türkiye" }
                : { "Güç": "2200W", "Renk": "Siyah", "Kutu İçeriği": "Tam Set", "Enerji Sınıfı": "A++" };

            const { data: nProd } = await supabase.from('products').insert({
                title: cleanTitle,
                brand_id: brandObj ? brandObj.id : null,
                category_id: catObj ? catObj.id : null,
                image_url: p.image,
                rating: 4.8,
                reviews_count: Math.floor(Math.random() * 500) + 50,
                is_trend: true,
                description: `${cleanTitle} en uygun fiyat ve Piinti güvencesiyle burada. Fiyat değişimlerini takip et, en ucuza al!`,
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
