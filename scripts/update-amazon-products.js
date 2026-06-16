const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // 1. Amazon TR vendor id'sini bulalim
    const { data: vendorData, error: vErr } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', 'Amazon TR')
      .single();

    if (vErr || !vendorData) {
      console.error("Vendor error:", vErr);
      return;
    }
    const amazonVendorId = vendorData.id;
    console.log('Amazon Vendor ID:', amazonVendorId);

    const itemsToUpdate = [
      {
        title: "Kurukahveci Mehmet Efendi Türk Kahvesi 100gr Folyo Ambalaj",
        asin: "B0190KXUCU",
        price: 44.50,
        image_url: "https://media-amazon.com"
      },
      {
        title: "AHMAD TEA CLASSIC EARL GREY 40 Adet Demlik Poşet Çay",
        asin: "B0GPX3GPWG",
        price: 82.90,
        image_url: "https://media-amazon.com"
      },
      {
        title: "ttec Lightning 100cm iPhone Şarj Kablosu - Beyaz",
        asin: "B07B9WHNLR",
        price: 149.00,
        image_url: "https://media-amazon.com"
      }
    ];

    for (const item of itemsToUpdate) {
      // 1. Urunun resmini guncelle
      const { data: pData, error: pErr } = await supabase
        .from('products')
        .update({ image_url: item.image_url })
        .eq('asin', item.asin)
        .select()
        .single();

      if (pErr || !pData) {
        console.error(`Error updating product ${item.asin}:`, pErr);
        continue;
      }
      console.log(`Updated product image for ${item.title} (ID: ${pData.id})`);

      // 2. Fiyatini ve saticisini guncelle (Eger satici Amazon TR degilse vendor_id'yi de gunceller)
      const { data: prData, error: prErr } = await supabase
        .from('product_prices')
        .update({ price: item.price, vendor_id: amazonVendorId })
        .eq('product_id', pData.id);

      if (prErr) {
        console.error(`Error updating price for ${item.asin}:`, prErr);
      } else {
        console.log(`Updated price to ${item.price} TL for ${item.asin}`);
      }
    }
    
    console.log("All updates done!");
  } catch (err) {
    console.error("Exception:", err);
  }
}

main();
