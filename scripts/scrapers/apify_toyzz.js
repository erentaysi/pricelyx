require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

async function run() {
  console.log("🚀 Toyzz Shop Apify Trigger Script Başlıyor...");
  if (!APIFY_TOKEN || APIFY_TOKEN.includes('xxxx')) {
    console.error("❌ HATA: APIFY_API_TOKEN geçersiz veya eksik!");
    process.exit(1);
  }

  const VENDOR_NAME = 'Toyzz Shop';
  const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

  let vendorId;
  const { data: vData } = await supabase.from('vendors').select('id').eq('name', VENDOR_NAME).single();
  if (vData) {
    vendorId = vData.id;
  } else {
    const { data: newV } = await supabase.from('vendors').insert([{
      name: VENDOR_NAME, logo: 'https://www.toyzzshop.com/assets/images/logo.png', color: '#005ba8'
    }]).select().single();
    vendorId = newV.id;
  }
  console.log(`✅ Vendor ID: ${vendorId} (${VENDOR_NAME})`);

  const apifyInput = {
    startUrls: [{ url: "https://www.toyzzshop.com/lego" }],
    useChrome: true,
    stealth: true,
    pageLoadTimeoutSecs: 60,
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"]
    },
    pageFunction: `async function pageFunction(context) {
      const result = await context.page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const productNodes = Array.from(document.querySelectorAll('a')).filter(a => a.querySelector('div[class*="_product_container"]'));
        
        if (productNodes.length === 0) {
           return { debugHtml: document.body.innerHTML.substring(0, 5000) };
        }
        
        const results = [];
        const rawItems = [];
        productNodes.forEach((aEl, index) => {
          if (index >= 40) return;
          const imgEl = aEl.querySelector('img[src*="product"]'); // get product image, not video icon
          
          const allPTags = Array.from(aEl.querySelectorAll('p, span')).filter(el => el.innerText && el.innerText.includes('TL'));
          const priceEl = allPTags.find(el => !el.className.includes('line-through')) || allPTags[allPTags.length - 1];
          
          if (!imgEl || !priceEl) {
             rawItems.push({ error: 'missing_elements', html: aEl.innerHTML });
             return;
          }
          
          let title = imgEl.getAttribute('alt');
          const titleSpan = aEl.querySelector('span.line-clamp-2');
          if (titleSpan) title = titleSpan.innerText.trim();
          
          let url = aEl.getAttribute('href');
          if (url && !url.startsWith('http')) url = 'https://www.toyzzshop.com' + url;
          
          let image_url = imgEl ? imgEl.getAttribute('src') : null;
          if (image_url && !image_url.startsWith('http')) image_url = 'https://www.toyzzshop.com' + image_url;
          
          let priceText = priceEl.innerText.replace('TL', '').replace(/\\./g, '').replace(',', '.').trim();
          const price = parseFloat(priceText);
          
          rawItems.push({ title, priceText, price, image_url, url });
          
          if (title && price && !isNaN(price) && image_url) {
            results.push({ title: title.trim(), image_url, price, brand: 'Toyzz Shop', url });
          }
        });
        return { items: results, rawItems: rawItems };
      });
      return result;
    }`
  };

  console.log("🌐 Apify Actor (apify/puppeteer-scraper) tetikleniyor...");
  
  const runRes = await fetch(`https://api.apify.com/v2/acts/apify~puppeteer-scraper/runs?token=${APIFY_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apifyInput)
  });
  
  const runData = await runRes.json();
  if (!runRes.ok) {
    console.error("❌ Apify tetikleme hatası:", runData);
    process.exit(1);
  }

  const runId = runData.data.id;
  const datasetId = runData.data.defaultDatasetId;
  console.log(`⏳ Run ID: ${runId}. Tamamlanması bekleniyor (Yaklaşık 30-60 sn)...`);

  let status = "RUNNING";
  let usage = null;
  while (status === "RUNNING" || status === "READY") {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const statusData = await statusRes.json();
    status = statusData.data.status;
    if (statusData.data.usage) usage = statusData.data.usage;
  }

  if (status !== "SUCCEEDED") {
    console.error(`❌ Apify çalışması başarısız oldu. Durum: ${status}`);
    process.exit(1);
  }

  console.log("✅ Apify başarıyla verileri çekti. Dataset indiriliyor...");
  const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`);
  const datasetItems = await datasetRes.json();

  let products = [];
  let rawItems = [];
  let debugHtml = null;
  
  if (datasetItems.length > 0) {
     if (datasetItems[0].items) {
         products = datasetItems[0].items;
         rawItems = datasetItems[0].rawItems;
         debugHtml = datasetItems[0].debugHtml;
     } else if (Array.isArray(datasetItems[0])) {
         products = datasetItems[0];
     } else {
         products = datasetItems;
     }
  }

  if (products.length === 0) {
    console.log("⚠️ Veri çekilemedi. Sayfada ürün yok veya CSS değişmiş.");
    if (debugHtml) {
       console.log("🛠️ HTML İLK 1000 KARAKTER:\\n", debugHtml.substring(0, 1000));
    }
    if (rawItems && rawItems.length > 0) {
       console.log("🛠️ RAW ITEMS:", JSON.stringify(rawItems, null, 2));
    }
  } else {
    console.log(`📦 ${products.length} adet ürün bulundu. Supabase'e yazılıyor...`);
  }

  let successCount = 0;
  
  for (const item of products) {
    const title = item.title;
    const price = item.price;
    const url = item.url;
    const image_url = item.image_url;
    const brand = item.brand;

    if (!price || !image_url) {
       console.log(`[ATLANDI] ${title} -> Fiyat veya Görsel eksik.`);
       continue;
    }

    let bId = null;
    if (brand) {
      const { data: bData } = await supabase.from('brands').select('id').eq('name', brand).single();
      if (bData) bId = bData.id;
      else {
        const { data: newB } = await supabase.from('brands').insert([{ name: brand }]).select().single();
        if (newB) bId = newB.id;
      }
    }

    let pId = null;
    const { data: existingP } = await supabase.from('products').select('id').eq('title', title).single();
    if (existingP) {
      pId = existingP.id;
    } else {
      const { data: newP, error: pErr } = await supabase.from('products').insert([{
        title, brand_id: bId, image_url, category_id: CATEGORY_ID
      }]).select('id').single();
      if (pErr) continue;
      pId = newP.id;
    }

    const { data: existingPrice } = await supabase.from('product_prices')
      .select('id').eq('product_id', pId).eq('vendor_id', vendorId).single();

    if (existingPrice) {
      const { error: priceErr } = await supabase.from('product_prices').update({
        price: price, product_url: url, in_stock: true
      }).eq('id', existingPrice.id);
      if (!priceErr) { successCount++; console.log(`[GÜNCELLENDİ] ${title.substring(0,40)}... -> ${price} TL`); }
    } else {
      const { error: priceErr } = await supabase.from('product_prices').insert([{
        product_id: pId, vendor_id: vendorId, price: price, product_url: url, affiliate_url: null, in_stock: true
      }]);
      if (!priceErr) { successCount++; console.log(`[EKLENDİ] ${title.substring(0,40)}... -> ${price} TL`); }
    }
  }

  console.log(`\\n🎉 İşlem Tamamlandı! Toplam ${successCount} ürün eklendi/güncellendi.`);
  
  if (usage) {
    const cost = usage.totalUsd || usage.ACTOR_COMPUTE_UNITS;
    console.log(`💰 Apify Console Usage Maliyeti: $${cost}`);
  }

  const { count } = await supabase.from('product_prices').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId);
  console.log(`📊 Doğrulama: Supabase'de Toyzz Shop'a ait ${count} adet fiyat kaydı var.`);
}

run().catch(console.error);
