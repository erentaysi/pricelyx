import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAmazonProductsByAsins } from '@/lib/amazonApi';

// Vercel / Railway CRON tetikleme rotası
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Guvenlik: Sadece CRON_SECRET ile yetkilendirilmis istekler calisabilir
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. ASIN degeri olan urunleri getir (Scraper verilerini ezmemek icin asin sarti var)
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, asin')
      .not('asin', 'is', null);

    if (prodErr) throw prodErr;
    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No ASINs found to update' });
    }

    // 2. Amazon TR Vendor ID'sini bul
    const { data: vendorData, error: vendorErr } = await supabase
      .from('vendors')
      .select('id')
      .eq('name', 'Amazon TR')
      .single();

    if (vendorErr) throw vendorErr;
    const amazonVendorId = vendorData.id;

    // 3. ASIN'leri 10'lu batch'lere bol (API Rate Limit korumasi)
    const batchSize = 10;
    let totalUpdated = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const asins = batch.map(p => p.asin as string);
      
      // Amazon API'den fiyati cek (su an mock donuyor)
      const amazonData = await getAmazonProductsByAsins(asins);

      // Veritabanini guncelle
      for (const amzItem of amazonData) {
        if (!amzItem.price) continue; // Fiyat gelmediyse atla

        // Urun IDsini bul
        const product = batch.find(p => p.asin === amzItem.asin);
        if (!product) continue;

        // product_prices tablosunu upsert (guncelle veya ekle) yapalim
        // Bu sayede eski scraper datasini eziyor mu?
        // Kullanici sarti: "Scraper ile çekilmiş eski/mevcut Amazon ilanları, senin yazdığın yeni sistemden etkilenmeden eskisi gibi çalışmaya devam etsin."
        // product_prices tablosunda (product_id, vendor_id) UNIQUE index'i var.
        // ASIN uzerinden islem yaptigimiz icin, eger scraper bir urunu ASIN ile girmedigiyse bu API sadece ASIN'i olanlari etkiler.

        const { error: upsertErr } = await supabase
          .from('product_prices')
          .upsert({
            product_id: product.id,
            vendor_id: amazonVendorId,
            price: amzItem.price,
            product_url: amzItem.url,
            in_stock: amzItem.inStock,
            updated_at: new Date().toISOString()
          }, { onConflict: 'product_id, vendor_id' });

        if (upsertErr) {
          console.error('Upsert Error for ASIN', amzItem.asin, upsertErr);
        } else {
          totalUpdated++;
        }
      }

      // Her 10'lu paketten sonra API rate limit'i asmamak icin 1 saniye bekle
      if (i + batchSize < products.length) {
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${totalUpdated} products successfully`,
      batchesProcessed: Math.ceil(products.length / batchSize)
    });

  } catch (error: any) {
    console.error('Amazon Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
