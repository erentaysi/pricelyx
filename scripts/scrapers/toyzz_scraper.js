const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const randomDelay = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 1000));

async function run() {
  console.log("🚀 Toyzz Shop Scraper (Pilot Test) Başlıyor...");
  
  let vendorId;
  const { data: vData } = await supabase.from('vendors').select('id').eq('name', 'Toyzz Shop').single();
  
  if (vData) {
    vendorId = vData.id;
  } else {
    console.log("⚠️ Toyzz Shop mağazası bulunamadı, ekleniyor...");
    const { data: newV } = await supabase.from('vendors').insert([{
      name: 'Toyzz Shop', logo: 'https://www.toyzzshop.com/assets/images/logo.png', color: '#005b9f'
    }]).select().single();
    vendorId = newV.id;
  }
  console.log(`✅ Vendor ID: ${vendorId}`);

  const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const targetUrl = 'https://www.toyzzshop.com/oyuncaklar';
  console.log(`🔗 Kategori sayfasına gidiliyor: ${targetUrl}`);
  
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
  await randomDelay();

  console.log("🔍 Ürünler taranıyor (Hedef: Maksimum 40 ürün)...");

  const products = await page.evaluate(() => {
    const items = [];
    // Toyzz Shop ürün kartları genelde product-box veya benzeri bir class içerir
    const productNodes = document.querySelectorAll('.product-box, .product-item, div[data-product-id]');
    
    productNodes.forEach((node, index) => {
      if (index >= 40) return;

      const titleEl = node.querySelector('.product-name, h3, .title');
      const imgEl = node.querySelector('img');
      const priceEl = node.querySelector('.price, .current-price, .discounted-price');
      
      if (!titleEl || !priceEl) return;

      const title = titleEl.innerText.trim();
      
      let urlEl = node.querySelector('a');
      let url = urlEl ? urlEl.getAttribute('href') : null;
      if (url && !url.startsWith('http')) url = 'https://www.toyzzshop.com' + url;

      let image_url = imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src')) : null;
      if (image_url && !image_url.startsWith('http')) image_url = 'https://www.toyzzshop.com' + image_url;

      let priceText = priceEl.innerText.replace('TL', '').replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '').trim();
      const price = parseFloat(priceText);

      if (title && price && !isNaN(price) && image_url && url) {
        items.push({ title, image_url, price, brand: 'Toyzz Shop', url });
      }
    });
    
    return items;
  });

  console.log(`📦 Sayfada ${products.length} adet geçerli ürün bulundu.`);
  await browser.close();

  if (products.length === 0) {
    console.error("❌ Hiç ürün bulunamadı. CSS class'ları uyumsuz olabilir.");
    process.exit(1);
  }

  let successCount = 0;
  console.log("💾 Veritabanına kayıt işlemi başlıyor...");
  
  for (const item of products) {
    await randomDelay(); 
    
    let bId = null;
    if (item.brand) {
      const { data: bData } = await supabase.from('brands').select('id').eq('name', item.brand).single();
      if (bData) bId = bData.id;
      else {
        const { data: newB } = await supabase.from('brands').insert([{ name: item.brand }]).select().single();
        if (newB) bId = newB.id;
      }
    }
    
    let pId = null;
    const { data: existingP } = await supabase.from('products').select('id').eq('title', item.title).single();
    if (existingP) {
      pId = existingP.id;
    } else {
      const { data: newP, error: pErr } = await supabase.from('products').insert([{
        title: item.title, brand_id: bId, image_url: item.image_url, category_id: CATEGORY_ID
      }]).select('id').single();
      if (pErr) continue;
      pId = newP.id;
    }

    const { data: existingPrice } = await supabase.from('product_prices')
      .select('id').eq('product_id', pId).eq('vendor_id', vendorId).single();

    if (existingPrice) {
      const { error: priceErr } = await supabase.from('product_prices').update({
        price: item.price, product_url: item.url, in_stock: true
      }).eq('id', existingPrice.id);
      if (!priceErr) { successCount++; console.log(`[GÜNCELLENDİ] ${item.title.substring(0, 40)}... -> ${item.price} TL`); }
    } else {
      const { error: priceErr } = await supabase.from('product_prices').insert([{
        product_id: pId, vendor_id: vendorId, price: item.price, product_url: item.url, affiliate_url: null, in_stock: true
      }]);
      if (!priceErr) { successCount++; console.log(`[EKLENDİ] ${item.title.substring(0, 40)}... -> ${item.price} TL`); }
    }
  }

  console.log(`\n🎉 İşlem Tamamlandı! Toplam ${successCount} ürün eklendi.`);
  const { count } = await supabase.from('product_prices').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId);
  console.log(`📊 Doğrulama: Supabase'de an itibariyle Toyzz Shop'a ait ${count} adet fiyat var.`);
}

run().catch(console.error);
