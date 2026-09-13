require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { upsertPriceAndHistory } = require('./price_helper');
const { findCanonicalProduct, findProductByBarcode, cleanBarcode } = require('./product_matcher');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  
  const response = await fetch('https://www.civilim.com/products.json?limit=250');
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

    // Civil .js endpoint'inden varyant barkodunu çek
    let barcode = null;
    try {
      const jsRes = await fetch(`https://www.civilim.com/products/${item.handle}.js`);
      if (jsRes.ok) {
        const jsData = await jsRes.json();
        const activeVar = jsData.variants?.find(v => v.barcode && String(v.barcode).trim().length > 0);
        if (activeVar) {
          barcode = cleanBarcode(activeVar.barcode);
        }
      }
    } catch (e) {
      // Endpoint hatası olursa sessizce fallback'e geç
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

    // 1. Ürün Eşleştirme (Barkod Öncelikli Mimari)
    let pId = null;

    // (1) Önce Barkod ile Eşleştir
    if (barcode) {
      pId = await findProductByBarcode(supabase, barcode);
      if (pId) {
        console.log(`🎯 [BARKOD EŞLEŞTİ] "${title}" barkod (${barcode}) ile mevcut ürüne bağlandı (ID: ${pId})`);
      }
    }

    // (2) Barkod eşleşmediyse veya yoksa: Mevcut marka + başlık benzerliği (%75)
    if (!pId) {
      const { data: existingP } = await supabase.from('products').select('id, barcode').eq('title', title).limit(1).maybeSingle();
      
      if (existingP) {
        pId = existingP.id;
        // Mevcut üründe barkod eksikse ve yenisinde varsa güncelle
        if (!existingP.barcode && barcode) {
          await supabase.from('products').update({ barcode }).eq('id', pId);
        }
      } else {
        // Yeni ürün oluşturulacak, Canonical Parent var mı diye bak:
        let canonicalId = null;
        if (bId) {
          canonicalId = await findCanonicalProduct(supabase, title, bId);
        }

        const { data: newP, error: pErr } = await supabase.from('products').insert([{
          title, brand_id: bId, image_url, category_id: CATEGORY_ID, canonical_id: canonicalId, barcode: barcode || null
        }]).select('id').single();
        
        if (pErr) { console.log(`[HATA - ÜRÜN] ${title} -> ${pErr.message}`); continue; }
        pId = newP.id;
        
        if (canonicalId) {
          console.log(`🔗 [CANONICAL BAĞLANTI] "${title}" ürünü (ID: ${pId}) Parent ürüne bağlandı (Parent ID: ${canonicalId})`);
        }
      }
    }

    // 2. Fiyat ve History upsert (Helper kullanımı)
    const inStock = variant ? variant.available : true;
    const res = await upsertPriceAndHistory(supabase, pId, vendorId, price, url, inStock);
    
    if (!res.success) {
      console.log(`[HATA - FİYAT] ${title} -> ${res.error}`);
    } else {
      successCount++;
      const action = res.isNew ? '[EKLENDİ]' : '[GÜNCELLENDİ]';
      const hist = res.historyInserted ? ' (+History)' : '';
      console.log(`${action} ${title.substring(0,40)}... -> ${price} TL${hist}`);
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
