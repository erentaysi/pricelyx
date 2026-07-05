require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const randomDelay = () => new Promise(r => setTimeout(r, Math.floor(Math.random() * 1500) + 1000));

async function run() {
  console.log("🚀 Civil Scraper (Pilot Test) Başlıyor...");
  
  // 1. Vendor kontrol/ekleme
  let vendorId;
  const { data: vData } = await supabase.from('vendors').select('id').eq('name', 'Civil').single();
  
  if (vData) {
    vendorId = vData.id;
  } else {
    console.log("⚠️ Civil mağazası bulunamadı, ekleniyor...");
    const { data: newV } = await supabase.from('vendors').insert([{
      name: 'Civil', logo: 'https://www.civilim.com/assets/img/civil-logo.svg', color: '#ff7e00'
    }]).select().single();
    vendorId = newV.id;
  }
  console.log(`✅ Vendor ID: ${vendorId}`);

  const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

  // Civil altyapısı Shopify olduğu için direkt API'den güvenli çekim yapıyoruz
  console.log("🌐 Civil ürünleri API'den çekiliyor (Bot koruması riski %0)...");
  
  const response = await fetch('https://www.civilim.com/products.json?limit=40');
  const data = await response.json();
  const products = data.products || [];

  if (products.length === 0) {
    console.error("❌ Hiç ürün bulunamadı.");
    process.exit(1);
  }
  console.log(`📦 ${products.length} adet ürün bulundu, Supabase'e ekleniyor...`);

  let successCount = 0;
  
  for (const item of products) {
    // Rastgele 1000-2500ms bekle (Talimat: Sabit interval kullanma)
    await randomDelay();

    const title = item.title;
    const brand = item.vendor || 'Civil';
    // Varyantlardan ilk aktif olanın fiyatını al
    const variant = item.variants && item.variants.length > 0 ? item.variants[0] : null;
    const price = variant && variant.price ? parseFloat(variant.price) : null;
    const url = `https://www.civilim.com/products/${item.handle}`;
    const image_url = item.images && item.images.length > 0 ? item.images[0].src : null;

    if (!price || !image_url) {
       console.log(`[ATLANDI] ${title} -> Fiyat veya Görsel eksik.`);
       continue;
    }

    // Brand (Marka) ID'sini al veya oluştur
    let bId = null;
    if (brand) {
      const { data: bData } = await supabase.from('brands').select('id').eq('name', brand).single();
      if (bData) bId = bData.id;
      else {
        const { data: newB } = await supabase.from('brands').insert([{ name: brand }]).select().single();
        if (newB) bId = newB.id;
      }
    }

    // 1. Ürün upsert (manuel kontrol)
    let pId = null;
    const { data: existingP } = await supabase.from('products').select('id').eq('title', title).single();
    if (existingP) {
      pId = existingP.id;
    } else {
      const { data: newP, error: pErr } = await supabase.from('products').insert([{
        title, brand_id: bId, image_url, category_id: CATEGORY_ID
      }]).select('id').single();
      if (pErr) { console.log(`[HATA - ÜRÜN] ${title} -> ${pErr.message}`); continue; }
      pId = newP.id;
    }

    // 2. Fiyat upsert (manuel kontrol)
    const { data: existingPrice } = await supabase.from('product_prices')
      .select('id').eq('product_id', pId).eq('vendor_id', vendorId).single();

    if (existingPrice) {
      const { error: priceErr } = await supabase.from('product_prices').update({
        price: price, product_url: url, in_stock: variant ? variant.available : true
      }).eq('id', existingPrice.id);
      if (priceErr) console.log(`[HATA - FİYAT] ${title} -> ${priceErr.message}`);
      else { successCount++; console.log(`[GÜNCELLENDİ] ${title.substring(0,40)}... -> ${price} TL`); }
    } else {
      const { error: priceErr } = await supabase.from('product_prices').insert([{
        product_id: pId, vendor_id: vendorId, price: price, product_url: url, affiliate_url: null, in_stock: variant ? variant.available : true
      }]);
      if (priceErr) console.log(`[HATA - FİYAT] ${title} -> ${priceErr.message}`);
      else { successCount++; console.log(`[EKLENDİ] ${title.substring(0,40)}... -> ${price} TL`); }
    }
  }

  console.log(`\n🎉 İşlem Tamamlandı! Toplam ${successCount} ürün eklendi/güncellendi.`);
  
  // Doğrulama sorgusu
  const { count } = await supabase
    .from('product_prices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId);

  console.log(`📊 Doğrulama: Supabase'de an itibariyle Civil mağazasına ait ${count} adet fiyat kaydı var.`);
}

run().catch(console.error);
