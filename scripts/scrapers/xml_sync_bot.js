const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const matcher = require('./product_matcher');
const priceHelper = require('./price_helper');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  removeNSPrefix: true
});

// XML verisinde ürün listesini (Array) bulmaya çalışan yardımcı fonksiyon
function findProductsArray(parsedData) {
  // Olası XML kök yolları (Google Merchant, Ideasoft, Ticimax vb.)
  if (parsedData.rss?.channel?.item) return parsedData.rss.channel.item;
  if (parsedData.Urunler?.Urun) return parsedData.Urunler.Urun;
  if (parsedData.products?.product) return parsedData.products.product;
  
  // Bulamazsa genel bir arama yap (ilk bulduğu Array'i döndür)
  for (const key in parsedData) {
    if (Array.isArray(parsedData[key])) return parsedData[key];
    if (typeof parsedData[key] === 'object') {
      for (const subKey in parsedData[key]) {
        if (Array.isArray(parsedData[key][subKey])) return parsedData[key][subKey];
      }
    }
  }
  return [];
}

// Bir ürün nesnesindeki ilgili alanları standartlaştıran fonksiyon
function normalizeProduct(item, vendorUrl) {
  // Başlık (Title)
  const title = item.title || item.Title || item.ad || item.Adi || item.name || '';
  
  // Fiyat (Price)
  let priceRaw = item.price || item.Price || item.fiyat || item.Fiyat || item.sale_price || item.indirimli_fiyat || '0';
  if (typeof priceRaw === 'object') priceRaw = priceRaw['#text'] || '0';
  const price = parseFloat(String(priceRaw).replace(/[^0-9,.]/g, '').replace(',', '.'));

  // Link (URL)
  let link = item.link || item.Link || item.url || item.Url || '';
  if (typeof link === 'object') link = link['#text'] || '';
  
  // Resim (Image)
  let image = item.image_link || item.image || item.Image || item.resim || item.Resim || item.picture || '';
  if (Array.isArray(image)) image = image[0];
  if (typeof image === 'object') image = image['#text'] || '';

  return { title, price, link, image };
}

async function syncVendorXML(vendor) {
  console.log(`\n======================================`);
  console.log(`B2B XML SYNC BAŞLIYOR: ${vendor.name} (ID: ${vendor.id})`);
  console.log(`URL: ${vendor.xml_feed_url}`);
  
  let successCount = 0;
  let errorCount = 0;
  let errorDetails = [];

  try {
    console.log(`-> XML İndiriliyor...`);
    const response = await axios.get(vendor.xml_feed_url, { timeout: 30000 });
    const xmlData = response.data;
    
    console.log(`-> XML Çözümleniyor...`);
    const jsonObj = parser.parse(xmlData);
    
    let products = findProductsArray(jsonObj);
    if (!Array.isArray(products)) products = [products];
    products = products.filter(p => p != null);

    console.log(`-> Toplam ${products.length} ürün bulundu. Veritabanına işleniyor...`);

    for (const item of products) {
      try {
        const p = normalizeProduct(item, vendor.xml_feed_url);
        
        if (!p.title || p.price <= 0 || !p.link) {
          errorCount++;
          continue; // Eksik veya 0₺ ürünleri atla
        }

        // Akıllı eşleştirme (Tam isim eşleşmesi veya yeni ürün)
        let canonicalId = null;
        const { data: existing } = await supabase
          .from('products')
          .select('id, canonical_id')
          .eq('title', p.title)
          .limit(1)
          .single();

        if (existing) {
          canonicalId = existing.canonical_id || existing.id;
        } else {
          // Yeni ürün olarak ekle (Category/Brand null şimdilik)
          const { data: newProd, error: insertProdError } = await supabase
            .from('products')
            .insert([{ title: p.title, image_url: p.image }])
            .select('id')
            .single();
          
          if (insertProdError) throw insertProdError;
          canonicalId = newProd.id;
        }

        // Fiyatı ve geçmişini priceHelper ile kaydet
        await priceHelper.upsertPriceAndHistory(supabase, canonicalId, vendor.id, p.price, p.link);
        
        successCount++;
        if (successCount % 50 === 0) console.log(`   ... ${successCount} ürün işlendi`);
      } catch (err) {
        errorCount++;
        if (errorDetails.length < 5) errorDetails.push(err.message);
      }
    }

    console.log(`-> BAŞARILI: ${successCount}, HATALI: ${errorCount}`);

    // Logu kaydet
    await supabase.from('feed_sync_logs').insert([{
      vendor_id: vendor.id,
      status: errorCount > 0 ? (successCount > 0 ? 'partial_error' : 'error') : 'success',
      items_processed: successCount,
      items_rejected: errorCount,
      error_details: errorDetails.length > 0 ? errorDetails.join(' | ') : null
    }]);

    // Vendor son güncellenme tarihini güncelle
    await supabase.from('vendors').update({ last_synced_at: new Date().toISOString() }).eq('id', vendor.id);

  } catch (globalError) {
    console.error(`!!! KRİTİK HATA (${vendor.name}):`, globalError.message);
    
    // Hata logunu kaydet
    await supabase.from('feed_sync_logs').insert([{
      vendor_id: vendor.id,
      status: 'error',
      items_processed: 0,
      items_rejected: 0,
      error_details: 'XML İndirme/Çözümleme Hatası: ' + globalError.message
    }]);
  }
}

async function runAllSyncs() {
  console.log("======================================");
  console.log("PIINTI B2B XML SYNC BOT BAŞLATILDI");
  console.log("======================================");

  // Sadece approved ve XML linki olanları çek
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('status', 'approved')
    .not('xml_feed_url', 'is', null)
    .not('xml_feed_url', 'eq', '');

  if (error) {
    console.error("Satıcılar çekilirken hata:", error);
    return;
  }

  console.log(`Toplam ${vendors.length} onaylı satıcı XML'i kuyruğa alındı.\n`);

  for (const vendor of vendors) {
    await syncVendorXML(vendor);
  }

  console.log(`\n======================================`);
  console.log(`TÜM SENKRONİZASYONLAR TAMAMLANDI!`);
  console.log(`======================================\n`);
}

runAllSyncs();
