require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { upsertPriceAndHistory } = require('./price_helper');
const { findCanonicalProduct } = require('./product_matcher');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

async function randomDelay() {
  const ms = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeKanz() {
  console.log("🚀 Kanz Scraper Başlıyor (Puppeteer Stealth)...");

  // Kanz vendor id'sini bul
  const { data: vData } = await supabase.from('vendors').select('id').eq('name', 'Kanz').single();
  const vendorId = vData ? vData.id : null;
  if (!vendorId) {
    console.log("❌ HATA: Kanz satıcısı veritabanında bulunamadı!");
    process.exit(1);
  }
  console.log(`✅ Vendor ID: ${vendorId} (Kanz)`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Kanz genelde giyim üzerinedir ama Puset/Taşıma vs. de çekilebilir
    const urlsToScrape = [
      'https://www.kanz.com.tr/bebek-arabasi-ve-puset',
      'https://www.kanz.com.tr/bebek-giyim'
    ];

    let totalUpserted = 0;

    for (let url of urlsToScrape) {
      console.log(`\n🌐 Sayfa taranıyor: ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await randomDelay();

      const products = await page.evaluate(() => {
        // Kanz altyapısı genelde IdeaSoft veya Ticimax benzeri
        const items = document.querySelectorAll('.product-item, .PrdItem, .showcase');
        const results = [];
        items.forEach(item => {
          const titleEl = item.querySelector('.product-title, .title, .productName, .PrdName');
          const priceEl = item.querySelector('.product-price, .price, .current-price, .PrdPrice');
          const linkEl = item.querySelector('a');
          const imgEl = item.querySelector('img');
          const brand = "Kanz"; // Zaten kanz'ın kendi sitesi olduğu için markası genelde Kanz'dır
          
          if (titleEl && priceEl) {
             const title = titleEl.innerText.trim();
             const priceText = priceEl.innerText.replace(/[^0-9,]/g, '').replace(',', '.');
             const price = parseFloat(priceText);
             const url = linkEl ? linkEl.href : window.location.href;
             const image_url = imgEl ? (imgEl.src || imgEl.getAttribute('data-src')) : null;

             if (title && price > 0) {
                results.push({ title, price, url, image_url, brand });
             }
          }
        });
        return results;
      });

      console.log(`📦 ${products.length} adet ürün bulundu. Veritabanına işleniyor...`);

      for (let item of products) {
        let bId = null;
        if (item.brand) {
          const { data: bData } = await supabase.from('brands').select('id').eq('name', item.brand).single();
          if (bData) bId = bData.id;
        }

        let productId = null;
        const { data: existingP } = await supabase.from('products').select('id').eq('title', item.title).single();
        
        if (existingP) {
          productId = existingP.id;
        } else {
          let canonicalId = null;
          if (bId) canonicalId = await findCanonicalProduct(supabase, item.title, bId);
          
          const { data: productData, error: productErr } = await supabase
            .from('products')
            .insert({
              title: item.title,
              brand_id: bId,
              image_url: item.image_url,
              category_id: CATEGORY_ID,
              canonical_id: canonicalId
            })
            .select('id')
            .single();

          if (productErr) continue;
          productId = productData.id;
          if (canonicalId) console.log(`🔗 [CANONICAL] "${item.title}" -> Parent: ${canonicalId}`);
        }

        const res = await upsertPriceAndHistory(supabase, productId, vendorId, item.price, item.url, true);
        if (res.success) {
           console.log(`[EKLENDİ] ${item.title.substring(0,40)}... -> ${item.price} TL`);
           totalUpserted++;
        }
      }
      
      await randomDelay();
    }
    
    console.log(`\n🎉 İşlem Tamamlandı! Toplam ${totalUpserted} Kanz ürünü eklendi.`);

  } catch (err) {
    console.error("❌ Hata:", err);
  } finally {
    await browser.close();
  }
}

scrapeKanz();
