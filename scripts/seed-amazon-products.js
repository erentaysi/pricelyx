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

    const items = [
      {
        title: "ttec Lightning 100cm iPhone Şarj Kablosu - Beyaz",
        asin: "B07B9WHNLR",
        url: "https://amzn.to/4vQWryB",
        price: 99.90, // mock price
        image_url: "https://m.media-amazon.com/images/I/41-987mI9QL._AC_SX679_.jpg"
      },
      {
        title: "AHMAD TEA CLASSIC EARL GREY 40 Adet Demlik Poşet Çay",
        asin: "B0GPX3GPWG",
        url: "https://amzn.to/4v2uOlX",
        price: 69.90, // mock price
        image_url: "https://m.media-amazon.com/images/I/81I78e5-F0L._AC_SX679_.jpg"
      },
      {
        title: "Kurukahveci Mehmet Efendi Türk Kahvesi 100gr Folyo Ambalaj",
        asin: "B0190KXUCU",
        url: "https://amzn.to/4eFc32d",
        price: 34.50, // mock price
        image_url: "https://m.media-amazon.com/images/I/61N9eE8rVXL._AC_SX679_.jpg"
      }
    ];

    for (const item of items) {
      // Urunu ekle
      const { data: productData, error: pErr } = await supabase
        .from('products')
        .insert({
          title: item.title,
          asin: item.asin,
          image_url: item.image_url,
          is_trend: true
        })
        .select()
        .single();

      if (pErr) {
        console.error("Product insert error:", pErr);
        continue;
      }
      
      console.log(`Inserted product: ${productData.title} (ID: ${productData.id})`);

      // Fiyatini ekle
      const { data: priceData, error: prErr } = await supabase
        .from('product_prices')
        .insert({
          product_id: productData.id,
          vendor_id: amazonVendorId,
          price: item.price,
          product_url: item.url,
          in_stock: true
        });

      if (prErr) {
        console.error("Price insert error:", prErr);
      } else {
        console.log(`Inserted price for ${item.asin}`);
      }
    }
    console.log("All done!");
  } catch (err) {
    console.error("Exception:", err);
  }
}

main();
