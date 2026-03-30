import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Güvenlik Koruması
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.INGEST_SECRET_KEY || 'piinti-gizli-anahtar-123'; // n8n'den gönderilecek şifre
    
    if (authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json({ error: 'Yetkisiz erişim. Güvenlik Anahtarı Yanlış!' }, { status: 401 });
    }

    const rawData = await request.json();
    // Eğer n8n her ürünü tek tek gönderiyorsa (obje formatı), onu listeye dönüştürerek kurtaralım:
    let productsArray = [];
    if (Array.isArray(rawData)) {
      productsArray = rawData;
    } else if (rawData && (rawData.data || rawData.items)) {
      productsArray = rawData.data || rawData.items;
    } else if (rawData && typeof rawData === 'object' && Object.keys(rawData).length > 0) {
      productsArray = [rawData]; // Tekil objeyi diziye al
    }

    if (!productsArray || productsArray.length === 0) {
      return NextResponse.json({ error: 'Geçersiz data formatı veya boş liste.' }, { status: 400 });
    }

    // 1. Kategori Bulucu (Amazon datası çok karışık olduğu için başlığa bakarak otomatik kategori atar)
    const guessCategory = (title: string) => {
      const t = title.toLowerCase();
      if (t.includes('iphone') || t.includes('galaxy') || t.includes('telefon') || t.includes('poco') || t.includes('redmi')) return 'akilli-telefon';
      if (t.includes('macbook') || t.includes('laptop') || t.includes('vivobook') || t.includes('ideapad') || t.includes('bilgisayar')) return 'bilgisayar-laptop';
      if (t.includes('playstation') || t.includes('kulaklık') || t.includes('airpods') || t.includes('watch') || t.includes('kamera')) return 'elektronik';
      if (t.includes('süpürge') || t.includes('dyson') || t.includes('airfryer') || t.includes('philips') || t.includes('makine')) return 'ev-yasam';
      return 'elektronik'; // Varsayılan Kategori
    };

    // 2. Satıcıyı Garantiye Al (Amazon TR üzerinden geliyorsa)
    let amazonVendorId = null;
    const { data: vendorData } = await supabase.from('vendors').select('id').ilike('name', 'Amazon TR').single();
    if (!vendorData) {
      const { data: newVendor } = await supabase.from('vendors').insert({ name: 'Amazon TR', url: 'https://www.amazon.com.tr' }).select().single();
      amazonVendorId = newVendor?.id;
    } else {
      amazonVendorId = vendorData.id;
    }

    // 3. Mevcut Marka ve Kategorileri Ön belleğe Al (Hız İçin)
    const { data: categories } = await supabase.from('categories').select('id, slug');
    const { data: brands } = await supabase.from('brands').select('id, name');
    
    let processedCount = 0;

    // 4. Diziyi Teker Teker İşle
    for (const item of productsArray) {
      // Apify Amazon verisi yapılandırmasını güvene al
      const title = item.title || item.name;
      if (!title) continue;

      let extractedBrand = item.brand || 'Bilinmiyor';
      // Apify price is often an object like { value: 12.99, currency: "$" } or string
      let rawPrice = item.price?.value !== undefined ? item.price.value : (item.priceAmount || item.price || 0);
      let extractedPrice = parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
      let extractedOriginalPrice = item.originalPrice ? parseFloat(String(item.originalPrice).replace(/[^0-9.]/g, '')) : null;
      let imgUrl = item.image || item.imageUrl || item.thumbnailImage || item.thumbnail || '📦';
      let url = item.url || item.link || '#';

      // Markayı DB'den bul veya Ekle
      let brandObj = brands?.find(b => b.name.toLowerCase() === extractedBrand.toLowerCase());
      if (!brandObj) {
        const { data: newBrand } = await supabase.from('brands').insert({ name: extractedBrand }).select().single();
        if (newBrand) {
          brands?.push(newBrand);
          brandObj = newBrand;
        }
      }

      // Kategoriyi tahmin et ve ID'sini bul
      const predictedSlug = guessCategory(title);
      let catObj = categories?.find(c => c.slug === predictedSlug);
      
      // Ürünü Kontrol Et (daha önce eklenmiş mi?)
      const { data: existingProduct } = await supabase.from('products').select('id').eq('title', title).single();
      let finalProductId = existingProduct?.id;

      if (!finalProductId) {
        // Yeni Ürün Ekle
        const { data: newProd } = await supabase.from('products').insert({
          title,
          brand_id: brandObj?.id,
          category_id: catObj?.id,
          image_url: imgUrl,
          rating: item.rating || item.stars || 4.5,
          reviews_count: item.reviewsCount || item.ratingsTotal || 150,
          is_trend: item.isTrend || true
        }).select().single();
        if (newProd) finalProductId = newProd.id;
      }

      // Fiyatları Ekle veya Güncelle (Upsert mantığı)
      if (finalProductId && amazonVendorId) {
        // Amazon satıcısı için fiyat güncellemesi/eklemesi
        const { data: existingPrice } = await supabase.from('product_prices')
          .select('id')
          .eq('product_id', finalProductId)
          .eq('vendor_id', amazonVendorId)
          .single();

        if (existingPrice) {
           await supabase.from('product_prices').update({
             price: extractedPrice,
             original_price: extractedOriginalPrice,
             product_url: url
           }).eq('id', existingPrice.id);
        } else {
           await supabase.from('product_prices').insert({
             product_id: finalProductId,
             vendor_id: amazonVendorId,
             price: extractedPrice,
             original_price: extractedOriginalPrice,
             product_url: url,
             shipping_info: item.delivery || 'Prime Kargo Bedava'
           });
        }
        processedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${processedCount} adet ürün Apify üzerinden başarıyla veritabanına yutuldu ve fiyatları güncellendi!`
    });

  } catch (error: any) {
    console.error('Ingest API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
