import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchSecureXml, parseSecureXml, sanitizeText } from '@/lib/xml-security';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Cron güvenliği
  const authHeader = request.headers.get('authorization');
  const secretKey = process.env.CRON_SECRET;
  
  if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
    return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
  }

  // Sadece approved satıcıları çek
  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('id, name, xml_feed_url')
    .eq('status', 'approved')
    .not('xml_feed_url', 'is', null);

  if (vendorError || !vendors) {
    return NextResponse.json({ error: 'Satıcılar çekilemedi.' }, { status: 500 });
  }

  const results = [];

  for (const vendor of vendors) {
    let itemsProcessed = 0;
    let itemsRejected = 0;
    let syncStatus = 'success';
    let errorMessage = '';

    try {
      console.log(`[SYNC] ${vendor.name} feed indiriliyor...`);
      const xmlString = await fetchSecureXml(vendor.xml_feed_url);
      const parsedData = parseSecureXml(xmlString);

      // XML yapısı satıcıya göre değişebilir, örnek standart bir yapı:
      // <products><product><title>...</title><price>...</price><url>...</url><in_stock>...</in_stock></product></products>
      const products = parsedData?.products?.product;
      const productList = Array.isArray(products) ? products : (products ? [products] : []);

      if (productList.length === 0) {
         throw new Error('Feed içinde ürün bulunamadı veya geçersiz yapı.');
      }

      for (const item of productList) {
        try {
          const rawTitle = sanitizeText(item.title);
          const rawPrice = parseFloat(item.price);
          const rawUrl = sanitizeText(item.url);
          
          // Veri Kalite Kontrolü
          if (!rawTitle || isNaN(rawPrice) || rawPrice <= 0 || !rawUrl) {
            itemsRejected++;
            continue; // Hatalı veriyi atla
          }

          // Stok durumu: boolean olarak çözümle
          let inStock = true;
          if (item.in_stock !== undefined) {
             const stockStr = sanitizeText(item.in_stock.toString()).toLowerCase();
             inStock = !(stockStr === 'false' || stockStr === '0' || stockStr === 'no');
          }

          // 1. Ürünü eşleştir (Adına göre basit eşleşme. Gerçekte ASIN veya EAN kullanılır)
          const { data: existingProduct } = await supabase
            .from('products')
            .select('id')
            .eq('title', rawTitle)
            .maybeSingle();

          let productId = existingProduct?.id;

          // Yoksa ürünü oluştur (Basit yaklaşım)
          if (!productId) {
            const { data: newProd } = await supabase
              .from('products')
              .insert({ title: rawTitle, is_trend: false })
              .select('id')
              .single();
            if (newProd) productId = newProd.id;
          }

          if (productId) {
            // Fiyat tablosunda bu satıcının bu ürünü var mı?
            const { data: existingPrice } = await supabase
              .from('product_prices')
              .select('id')
              .eq('product_id', productId)
              .eq('vendor_id', vendor.id)
              .maybeSingle();

            if (existingPrice) {
               // Update
               await supabase.from('product_prices').update({
                 price: rawPrice,
                 product_url: rawUrl,
                 in_stock: inStock,
                 last_updated_at: new Date().toISOString()
               }).eq('id', existingPrice.id);
            } else {
               // Insert
               await supabase.from('product_prices').insert({
                 product_id: productId,
                 vendor_id: vendor.id,
                 price: rawPrice,
                 product_url: rawUrl,
                 in_stock: inStock,
                 last_updated_at: new Date().toISOString()
               });
            }
            itemsProcessed++;
          } else {
            itemsRejected++;
          }
        } catch (itemErr) {
          itemsRejected++;
        }
      }

      if (itemsRejected > 0 && itemsProcessed > 0) {
         syncStatus = 'partial_error';
         errorMessage = `${itemsRejected} adet ürün doğrulama veya eşleşme hatasından dolayı reddedildi.`;
      } else if (itemsProcessed === 0) {
         syncStatus = 'error';
         errorMessage = 'Tüm ürünler reddedildi veya işlenemedi.';
      }

      // Satıcı tablosundaki son senkronizasyon zamanını güncelle
      await supabase.from('vendors').update({ last_synced_at: new Date().toISOString() }).eq('id', vendor.id);

    } catch (error: any) {
      console.error(`[SYNC ERROR] ${vendor.name}:`, error.message);
      syncStatus = 'error';
      errorMessage = error.message;
    }

    // Kalıcı log kaydı
    await supabase.from('feed_sync_logs').insert({
      vendor_id: vendor.id,
      status: syncStatus,
      error_details: errorMessage,
      items_processed: itemsProcessed,
      items_rejected: itemsRejected
    });

    results.push({
       vendor: vendor.name,
       status: syncStatus,
       processed: itemsProcessed,
       rejected: itemsRejected
    });
  }

  return NextResponse.json({ success: true, results });
}
