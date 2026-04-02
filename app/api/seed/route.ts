import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Kategorileri Garantiye Al
    const catData = [
      { name: 'Akıllı Telefon', slug: 'akilli-telefon' },
      { name: 'Bilgisayar & Laptop', slug: 'bilgisayar-laptop' },
      { name: 'Moda & Giyim', slug: 'moda-giyim' },
      { name: 'Ev & Yaşam', slug: 'ev-yasam' },
      { name: 'Elektronik', slug: 'elektronik' },
      { name: 'Kozmetik', slug: 'kozmetik' },
      { name: 'Spor & Outdoor', slug: 'spor-outdoor' },
      { name: 'Kitap & Hobi', slug: 'kitap-hobi' }
    ];

    const { data: existingCats } = await supabase.from('categories').select('*');
    const existingCatSlugs = existingCats?.map(c => c.slug) || [];
    
    for (const cat of catData) {
      if (!existingCatSlugs.includes(cat.slug)) {
        await supabase.from('categories').insert(cat);
      }
    }
    const { data: finalCategories } = await supabase.from('categories').select('*');

    // 2. Markaları Garantiye Al
    const brandNames = ['Apple', 'Samsung', 'Xiaomi', 'Asus', 'Lenovo', 'Sony', 'Dyson', 'Philips', 'Nike', 'Adidas', 'Loreal', 'Bosch', 'Rolex', 'Nikon'];
    const { data: existingBrands } = await supabase.from('brands').select('*');
    const existingBrandNames = existingBrands?.map(b => b.name) || [];
    
    for (const bName of brandNames) {
      if (!existingBrandNames.includes(bName)) {
        await supabase.from('brands').insert({ name: bName });
      }
    }
    const { data: finalBrands } = await supabase.from('brands').select('*');

    // 3. Satıcıları Garantiye Al
    const vendorNames = ['Amazon TR', 'Trendyol', 'Hepsiburada'];
    const { data: existingVendors } = await supabase.from('vendors').select('*');
    const existingVendorNames = existingVendors?.map(v => v.name) || [];
    
    for (const vName of vendorNames) {
      if (!existingVendorNames.includes(vName)) {
        await supabase.from('vendors').insert({ name: vName, url: 'https://www.' + vName.toLowerCase().replace(' ', '') + '.com' });
      }
    }
    const { data: finalVendors } = await supabase.from('vendors').select('*');

    const getCatId = (s: string) => finalCategories?.find(c => c.slug === s)?.id;
    const getBrandId = (n: string) => finalBrands?.find(b => b.name === n)?.id;

    // 4. 30 Altın Ürün Seti
    const rawProducts = [
      // Telefonlar
      { t: 'iPhone 15 Pro Max 256GB', b: 'Apple', c: 'akilli-telefon', i: '📱', p: 74999, op: 80000, r: 4.9, rc: 4200 },
      { t: 'iPhone 15 128GB', b: 'Apple', c: 'akilli-telefon', i: '📱', p: 58999, op: null, r: 4.8, rc: 3100 },
      { t: 'Samsung Galaxy S24 Ultra 512GB', b: 'Samsung', c: 'akilli-telefon', i: '📱', p: 69999, op: 74999, r: 4.8, rc: 2150 },
      { t: 'Samsung Galaxy A54', b: 'Samsung', c: 'akilli-telefon', i: '📱', p: 16499, op: 18000, r: 4.5, rc: 1120 },
      { t: 'Xiaomi 14 Pro 256GB', b: 'Xiaomi', c: 'akilli-telefon', i: '📱', p: 45999, op: 49999, r: 4.7, rc: 840 },
      { t: 'Xiaomi Redmi Note 13 Pro', b: 'Xiaomi', c: 'akilli-telefon', i: '📱', p: 18999, op: null, r: 4.6, rc: 3200 },
      
      // Bilgisayarlar
      { t: 'MacBook Pro M3 Max 16"', b: 'Apple', c: 'bilgisayar-laptop', i: '💻', p: 145000, op: 150000, r: 5.0, rc: 120 },
      { t: 'MacBook Air M2 256GB', b: 'Apple', c: 'bilgisayar-laptop', i: '💻', p: 38999, op: 42000, r: 4.9, rc: 850 },
      { t: 'Asus ROG Strix G16', b: 'Asus', c: 'bilgisayar-laptop', i: '💻', p: 54999, op: 60000, r: 4.8, rc: 650 },
      { t: 'Asus ZenBook 14 OLED', b: 'Asus', c: 'bilgisayar-laptop', i: '💻', p: 42500, op: null, r: 4.7, rc: 410 },
      { t: 'Lenovo Legion Slim 5', b: 'Lenovo', c: 'bilgisayar-laptop', i: '💻', p: 48999, op: 52000, r: 4.6, rc: 580 },
      
      // Elektronik & Konsol & Ses
      { t: 'PlayStation 5 Slim (CD)', b: 'Sony', c: 'elektronik', i: '🎮', p: 21999, op: 24000, r: 4.9, rc: 5600 },
      { t: 'AirPods Pro (2. Nesil)', b: 'Apple', c: 'elektronik', i: '🎧', p: 8499, op: 9299, r: 4.8, rc: 9800 },
      { t: 'Sony WH-1000XM5 Kulaklık', b: 'Sony', c: 'elektronik', i: '🎧', p: 11499, op: 13000, r: 4.8, rc: 2100 },
      { t: 'Apple Watch Series 9', b: 'Apple', c: 'elektronik', i: '⌚', p: 16999, op: null, r: 4.7, rc: 3200 },
      { t: 'Samsung Galaxy Watch 6', b: 'Samsung', c: 'elektronik', i: '⌚', p: 6499, op: 7500, r: 4.6, rc: 1800 },
      { t: 'Nikon Z6 II Aynasız Kamera', b: 'Nikon', c: 'elektronik', i: '📸', p: 62000, op: 65000, r: 4.8, rc: 220 },
      
      // Ev & Yaşam
      { t: 'Dyson V15 Detect Absolute', b: 'Dyson', c: 'ev-yasam', i: '🧹', p: 28999, op: 31000, r: 4.9, rc: 4500 },
      { t: 'Dyson Airwrap Multi-Styler', b: 'Dyson', c: 'ev-yasam', i: '💆‍♀️', p: 22499, op: null, r: 4.8, rc: 3400 },
      { t: 'Roborock S8 Pro Ultra', b: 'Xiaomi', c: 'ev-yasam', i: '🤖', p: 42999, op: 46000, r: 4.9, rc: 1100 },
      { t: 'Philips Airfryer XXL Smart', b: 'Philips', c: 'ev-yasam', i: '🍳', p: 6499, op: 7500, r: 4.7, rc: 8900 },
      { t: 'Bosch Bulaşık Makinesi Seri 6', b: 'Bosch', c: 'ev-yasam', i: '🍽️', p: 18499, op: null, r: 4.6, rc: 950 },
      
      // Moda & Spor & Kozmetik
      { t: 'Nike Air Max 270', b: 'Nike', c: 'moda-giyim', i: '👟', p: 4599, op: 5200, r: 4.7, rc: 3100 },
      { t: 'Adidas Ultraboost Light', b: 'Adidas', c: 'moda-giyim', i: '👟', p: 5199, op: 5999, r: 4.8, rc: 2100 },
      { t: 'Rolex Submariner Date', b: 'Rolex', c: 'moda-giyim', i: '⌚', p: 450000, op: null, r: 5.0, rc: 45 },
      
      { t: 'Loreal Paris Revitalift Serum', b: 'Loreal', c: 'kozmetik', i: '🧴', p: 450, op: 650, r: 4.5, rc: 8400 },
      { t: 'Xiaomi Akıllı Bisiklet', b: 'Xiaomi', c: 'spor-outdoor', i: '🚲', p: 12500, op: 14000, r: 4.6, rc: 340 },
      { t: 'Decathlon Kamp Çadırı (4 Kişilik)', b: 'Adidas', c: 'spor-outdoor', i: '⛺', p: 3200, op: null, r: 4.7, rc: 1200 },
      
      // Bonus Kitap vs
      { t: 'Harry Potter Özel Kutu Seti', b: 'Apple', c: 'kitap-hobi', i: '📚', p: 2100, op: 2500, r: 4.9, rc: 750 },
      { t: 'Dünya Klasikleri Seti 20 Kitap', b: 'Samsung', c: 'kitap-hobi', i: '📖', p: 850, op: 1100, r: 4.8, rc: 1400 }
    ];

    let insertedCount = 0;

    for (const raw of rawProducts) {
      const bId = getBrandId(raw.b);
      const cId = getCatId(raw.c);
      
      // Check if product exists by title
      const { data: existingProdObj } = await supabase.from('products').select('id').eq('title', raw.t).single();
      
      let productId = existingProdObj?.id;

      if (!productId) {
        // Create Product
        const newProduct = {
          title: raw.t,
          brand_id: bId,
          category_id: cId,
          image_url: raw.i,
          rating: raw.r,
          reviews_count: raw.rc,
          is_trend: true,
          specs: { "Garanti": "2 Yıl Türkiye Garantili", "Durum": "Sıfır" }
        };
        
        const { data: insertedProduct, error: prodError } = await supabase.from('products').insert(newProduct).select().single();
        if (prodError || !insertedProduct) {
          console.error("Product insert error:", prodError);
          continue;
        }
        productId = insertedProduct.id;
        insertedCount++;

        // Add Prices across up to 3 vendors
        const prices = [];
        // Base Vendor (Amazon)
        prices.push({
          product_id: productId,
          vendor_id: finalVendors?.[0]?.id,
          price: raw.p,
          original_price: raw.op,
          product_url: 'https://amazon.com.tr/test-link',
          shipping_info: 'Ücretsiz Kargo (Prime)'
        });
        
        // Trendyol (Slightly more expensive or same)
        prices.push({
          product_id: productId,
          vendor_id: finalVendors?.[1]?.id,
          price: raw.p + (raw.p * 0.03), // 3% higher
          original_price: raw.op,
          product_url: 'https://trendyol.com/test-link',
          shipping_info: 'Kargo Bedava'
        });

        // Hepsiburada
        prices.push({
          product_id: productId,
          vendor_id: finalVendors?.[2]?.id,
          price: raw.p - (raw.p * 0.01), // 1% cheaper
          original_price: null,
          product_url: 'https://hepsiburada.com/test-link',
          shipping_info: 'Yarın Kapında'
        });

        await supabase.from('product_prices').insert(prices);

        // 5. Add Mock Reviews for the Summarizer
        const mockReviews = [
          { user_name: "Ayşe Y.", rating: 5, comment: "Kankalar bu ürün gerçekten efsane. Fiyatına göre performansı çok iyi!" },
          { user_name: "Mehmet K.", rating: 4, comment: "Bataryası beklediğimden uzun gidiyor ama kamerası gece biraz kumlanma yapıyor." },
          { user_name: "Selin T.", rating: 5, comment: "Tasarımı çok şık, elime aldığımda premium hissi veriyor. Piinti sayesinde en uygun fiyata aldım!" },
          { user_name: "Can B.", rating: 3, comment: "Kutu içeriği biraz zayıf, şarj adaptörü çıkmıyor. Ama ürünün kendisi kaliteli." },
          { user_name: "Esra D.", rating: 5, comment: "Hızlı gönderi için teşekkürler. Ürün tam anlatıldığı gibi, beklentimi karşıladı." }
        ];

        const reviewsToInsert = mockReviews.map(r => ({
          product_id: productId,
          ...r
        }));

        await supabase.from('product_reviews').insert(reviewsToInsert);
      }
    }

    return NextResponse.json({ success: true, message: `Oluşturuldu/Güncellendi! ${insertedCount} yeni ürün eklendi.` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
