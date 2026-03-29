import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get Categories and Vendors
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    const { data: vendors, error: venError } = await supabase.from('vendors').select('*').eq('name', 'Amazon TR');

    if (catError || venError) {
      return NextResponse.json({ error: "Supabase connection/query failed", catError, venError }, { status: 500 });
    }

    if (!categories || categories.length === 0 || !vendors || vendors.length === 0) {
      return NextResponse.json({ error: "No categories or vendors found. Please run the setup SQL first." }, { status: 400 });
    }

    const amazonTr = vendors[0];
    const phoneCat = categories.find(c => c.slug === 'akilli-telefon');
    const pcCat = categories.find(c => c.slug === 'bilgisayar');

    // 2. Insert Brands
    const { data: apple } = await supabase.from('brands').insert({ name: 'Apple' }).select().single();
    const { data: samsung } = await supabase.from('brands').insert({ name: 'Samsung' }).select().single();

    // 3. Insert Products
    const products = [
      {
        title: 'iPhone 15 Pro 128GB',
        brand_id: apple?.id,
        category_id: phoneCat?.id,
        image_url: '📱', // using emojis as placeholders for now like original
        rating: 4.8,
        reviews_count: 1250,
        is_trend: true,
        specs: { "Ekran": "6.1 inç OLED", "İşlemci": "A17 Pro", "Kamera": "48 MP" }
      },
      {
        title: 'Samsung Galaxy S24 Ultra 256GB',
        brand_id: samsung?.id,
        category_id: phoneCat?.id,
        image_url: '📱',
        rating: 4.7,
        reviews_count: 850,
        is_trend: true,
        specs: { "Ekran": "6.8 inç AMOLED", "İşlemci": "Snapdragon 8 Gen 3", "Kamera": "200 MP" }
      },
      {
        title: 'MacBook Air M3 13 inç',
        brand_id: apple?.id,
        category_id: pcCat?.id,
        image_url: '💻',
        rating: 4.9,
        reviews_count: 420,
        is_trend: true,
        specs: { "Ekran": "13.6 inç", "İşlemci": "Apple M3", "RAM": "8GB Unified" }
      }
    ];

    const { data: insertedProducts, error: prodError } = await supabase.from('products').insert(products).select();
    
    if (prodError) throw prodError;

    // 4. Insert Prices for Amazon TR
    if (insertedProducts) {
      const prices = insertedProducts.map((p, idx) => ({
        product_id: p.id,
        vendor_id: amazonTr.id,
        price: idx === 0 ? 59999.00 : idx === 1 ? 64999.00 : 42999.00,
        original_price: idx === 0 ? 64999.00 : null,
        product_url: 'https://www.amazon.com.tr/dp/B0CHX...',
        shipping_info: 'Ücretsiz Kargo (Prime)'
      }));

      const { error: priceError } = await supabase.from('product_prices').insert(prices);
      if (priceError) throw priceError;
    }

    return NextResponse.json({ success: true, message: 'Database seeded with test products successfully!' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
