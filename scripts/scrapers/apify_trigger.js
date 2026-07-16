require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { upsertPriceAndHistory } = require('./price_helper');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;

async function run() {
  console.log("🚀 Apify Trigger Script Başlıyor...");
  if (!APIFY_TOKEN || APIFY_TOKEN.includes('xxxx')) {
    console.error("❌ HATA: APIFY_API_TOKEN geçersiz veya eksik!");
    process.exit(1);
  }

  const VENDOR_NAME = 'e-bebek';
  const CATEGORY_ID = 34; // Anne, Bebek & Oyuncak

  // 1. Vendor kontrol/ekleme
  let vendorId;
  const { data: vData } = await supabase.from('vendors').select('id').eq('name', VENDOR_NAME).single();
  if (vData) {
    vendorId = vData.id;
  } else {
    const { data: newV } = await supabase.from('vendors').insert([{
      name: VENDOR_NAME, logo: 'https://cdn.e-bebek.com/y.png', color: '#e3000f'
    }]).select().single();
    vendorId = newV.id;
  }
  console.log(`✅ Vendor ID: ${vendorId} (${VENDOR_NAME})`);

  // Apify apify/puppeteer-scraper input payload
  // Residential proxy ve stealth mod aktif
  const apifyInput = {
    startUrls: [{ url: "https://www.e-bebek.com/bebek-bezi-c3738/" }],
    useChrome: true,
    stealth: true,
    pageLoadTimeoutSecs: 60,
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"]
    },
    pageFunction: `async function pageFunction(context) {
      const result = await context.page.evaluate(async () => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds just in case
        const productNodes = document.querySelectorAll('cx-product-list-item, .product-item, .product-card, .eb-product-list-item');
        
        if (productNodes.length === 0) {
           return { debugHtml: document.body.innerHTML.substring(0, 5000) };
        }
        
        const results = [];
        const rawItems = [];
        productNodes.forEach((node, index) => {
          if (index >= 40) return;
          const aEl = node.querySelector('a');
          const imgEl = node.querySelector('img');
          const priceEl = node.querySelector('eb-price-show') || node.querySelector('.price-box');
          
          if (!aEl || !priceEl) {
             rawItems.push({ error: 'missing_elements', html: node.innerHTML });
             return;
          }
          
          let title = '';
          const h2El = node.querySelector('h2.product-item__brand');
          if (h2El) {
             title = h2El.innerText.replace(/\\n/g, '').trim();
          } else if (imgEl) {
             title = imgEl.getAttribute('alt');
          }
          
          let url = aEl.getAttribute('href');
          if (url && !url.startsWith('http')) url = 'https://www.e-bebek.com' + url;
          
          let image_url = imgEl ? imgEl.getAttribute('src') : null;
          if (image_url && !image_url.startsWith('http')) image_url = 'https://www.e-bebek.com' + image_url;
          
          let priceText = priceEl.innerText.replace('TL', '').replace(/\\./g, '').replace(',', '.').trim();
          const price = parseFloat(priceText);
          
          rawItems.push({ title, priceText, price, image_url, url });
          
          if (title && price && !isNaN(price) && image_url) {
            results.push({ title: title.trim(), image_url, price, brand: 'e-bebek', url });
          }
        });
        return { items: results, rawItems: rawItems };
      });
      return result;
    }`
  };

  console.log("🌐 Apify Actor (apify/puppeteer-scraper) tetikleniyor...");
  
  // Actor'ü başlat
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

  // Run bitene kadar bekle (Polling)
  let status = "RUNNING";
  let usage = null;
  while (status === "RUNNING" || status === "READY") {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`);
    const statusData = await statusRes.json();
    status = statusData.data.status;
    if (statusData.data.usage) {
      usage = statusData.data.usage;
    }
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
       console.log("🛠️ HTML İLK 1000 KARAKTER:\n", debugHtml.substring(0, 1000));
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

    // Brand kontrol
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
      if (pErr) { console.log(`[HATA - ÜRÜN] ${title} -> ${pErr.message}`); continue; }
      pId = newP.id;
    }

    const res = await upsertPriceAndHistory(supabase, pId, vendorId, price, url, true);
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
  
  if (usage) {
    const cost = usage.totalUsd || usage.ACTOR_COMPUTE_UNITS;
    console.log(`💰 Apify Console Usage Maliyeti: $${cost}`);
  }

  const { count } = await supabase.from('product_prices').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId);
  console.log(`📊 Doğrulama: Supabase'de e-bebek'e ait ${count} adet fiyat kaydı var.`);
}

run().catch(console.error);
