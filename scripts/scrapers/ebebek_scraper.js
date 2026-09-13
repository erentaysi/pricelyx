const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { upsertPriceAndHistory } = require('./price_helper');
const { findCanonicalProduct, findProductByBarcode, cleanBarcode } = require('./product_matcher');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Rastgele gecikme fonksiyonu (1000ms - 2500ms)
const randomDelay = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 1000));

async function run() {
  console.log("🚀 E-Bebek Scraper (Pilot Test) Başlıyor...");
  
  // 1. Vendor ID'sini al
  const { data: vendorData, error: vendorErr } = await supabase
    .from('vendors')
    .select('id')
    .eq('name', 'e-bebek')
    .single();

  if (vendorErr || !vendorData) {
    console.error("❌ HATA: 'e-bebek' mağazası vendors tablosunda bulunamadı! Lütfen SQL script'ini çalıştırdığından emin ol.");
    process.exit(1);
  }
  
  const VENDOR_ID = vendorData.id;
  const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

  console.log(`✅ Vendor ID alındı: ${VENDOR_ID}`);
  console.log("🌐 Tarayıcı başlatılıyor...");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Bot tespiti atlatmak için fake User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const targetUrl = 'https://www.e-bebek.com/bebek-bezi-c4004';
  console.log(`🔗 Kategori sayfasına gidiliyor: ${targetUrl}`);
  
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await randomDelay();

  console.log("🔍 Ürünler taranıyor (Hedef: Maksimum 40 ürün)...");

  // Ürün verilerini sayfa içinden çek
  const products = await page.evaluate(() => {
    const items = [];
    const productNodes = document.querySelectorAll('cx-product-list-item');
    
    productNodes.forEach((node, index) => {
      if (index >= 40) return; // Maksimum 40 ürün sınırla

      const titleEl = node.querySelector('.product-item-anchor');
      const imgEl = node.querySelector('cx-media img');
      const priceEl = node.querySelector('.cx-product-price');
      const brandEl = node.querySelector('.brand-name');

      if (!titleEl || !priceEl) return;

      const title = titleEl.getAttribute('title') || titleEl.innerText;
      let url = titleEl.getAttribute('href');
      if (url && !url.startsWith('http')) url = 'https://www.e-bebek.com' + url;

      let image_url = imgEl ? imgEl.getAttribute('src') : null;
      if (image_url && !image_url.startsWith('http')) image_url = 'https://www.e-bebek.com' + image_url;

      // Fiyat temizleme (Örn: "1.234,50 TL")
      let priceText = priceEl.innerText.replace('TL', '').replace(/\./g, '').replace(',', '.').trim();
      const price = parseFloat(priceText);

      const brand = brandEl ? brandEl.innerText.trim() : 'E-bebek';

      if (title && price && !isNaN(price) && image_url) {
        items.push({
          title: title.trim(),
          image_url,
          price,
          brand,
          url
        });
      }
    });
    
    return items;
  });

  console.log(`📦 Sayfada ${products.length} adet geçerli ürün bulundu.`);
  await browser.close();

  if (products.length === 0) {
    console.error("❌ Hiç ürün bulunamadı. E-bebek sayfa yapısını değiştirmiş olabilir.");
    process.exit(1);
  }

  let successCount = 0;

  console.log("💾 Veritabanına kayıt işlemi başlıyor...");
  
  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    
    await randomDelay(); // Anti-bot rate limit
    
    // e-bebek ürün kodunu çıkar ve OCC API'den EAN barkodunu çek
    let barcode = null;
    const codeMatch = item.url.match(/-p-([a-zA-Z0-9-]+)/i);
    const productCode = codeMatch ? codeMatch[1] : null;
    if (productCode) {
      try {
        const apiRes = await fetch(`https://api2.e-bebek.com/ebebekwebservices/v2/ebebek/products/${productCode}?fields=FULL&lang=tr&curr=TRY`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.ean) {
            barcode = cleanBarcode(apiData.ean);
          }
        }
      } catch (e) {
        // API hatası olursa devam et
      }
    }

    // Fallback: Görsel URL'sindeki 13 haneli barkod deseni
    if (!barcode && item.image_url) {
      const imgEanMatch = item.image_url.match(/_(\d{8,14})_/);
      if (imgEanMatch) {
        barcode = cleanBarcode(imgEanMatch[1]);
      }
    }

    // 1. Ürün Eşleştirme (Barkod Öncelikli Mimari)
    let productId = null;

    // (1) Önce Barkod ile Eşleştir
    if (barcode) {
      productId = await findProductByBarcode(supabase, barcode);
      if (productId) {
        console.log(`🎯 [BARKOD EŞLEŞTİ] "${item.title}" barkod (${barcode}) ile mevcut ürüne bağlandı (ID: ${productId})`);
      }
    }

    // (2) Barkod eşleşmediyse veya yoksa: Mevcut marka + başlık benzerliği (%75)
    if (!productId) {
      const { data: existingP } = await supabase.from('products').select('id, barcode').eq('title', item.title).limit(1).maybeSingle();
      
      if (existingP) {
        productId = existingP.id;
        if (!existingP.barcode && barcode) {
          await supabase.from('products').update({ barcode }).eq('id', productId);
        }
      } else {
        let canonicalId = null;
        let bId = null;
        if (item.brand) {
           const { data: bData } = await supabase.from('brands').select('id').eq('name', item.brand).single();
           if (bData) bId = bData.id;
        }

        if (bId) {
          canonicalId = await findCanonicalProduct(supabase, item.title, bId);
        }

        const { data: productData, error: productErr } = await supabase
          .from('products')
          .insert({
            title: item.title,
            brand_id: bId,
            image_url: item.image_url,
            category_id: CATEGORY_ID,
            canonical_id: canonicalId,
            barcode: barcode || null
          })
          .select('id')
          .single();

        if (productErr) {
          console.log(`[ATLANDI] ${item.title} -> ${productErr.message}`);
          continue;
        }
        productId = productData.id;
        
        if (canonicalId) {
          console.log(`🔗 [CANONICAL BAĞLANTI] "${item.title}" ürünü Parent ürüne bağlandı (Parent ID: ${canonicalId})`);
        }
      }
    }

    // 2. Fiyat ve Geçmiş bilgisini ekle veya güncelle
    const res = await upsertPriceAndHistory(supabase, productId, VENDOR_ID, item.price, item.url, true);

    if (!res.success) {
       console.log(`[FİYAT HATASI] ${item.title} -> ${res.error}`);
    } else {
       successCount++;
       const action = res.isNew ? '[EKLENDİ]' : '[GÜNCELLENDİ]';
       const hist = res.historyInserted ? ' (+History)' : '';
       console.log(`${action} ${item.title.substring(0, 40)}... -> ${item.price} TL${hist}`);
    }
  }

  console.log(`\n🎉 İşlem Tamamlandı! Toplam ${successCount} ürün eklendi/güncellendi.`);
  
  // Veritabanında e-bebek'in toplam kaç ürünü olduğunu bul
  const { count } = await supabase
    .from('product_prices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', VENDOR_ID);

  console.log(`📊 Doğrulama: Supabase'de an itibariyle e-bebek mağazasına ait ${count} adet fiyat kaydı var.`);
}

run().catch(console.error);
