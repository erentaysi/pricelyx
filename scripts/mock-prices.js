require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addMockPrices() {
    try {
        console.log('🔄 Ürünlere diğer mağazaların fiyatları simüle ediliyor...');

        const { data: products, error: prodErr } = await supabase.from('products').select('id, title, product_prices(price)');
        if (prodErr) throw prodErr;
        
        const { data: vendors, error: vendErr } = await supabase.from('vendors').select('id, name');
        if (vendErr) throw vendErr;

        let addedCount = 0;

        for (const p of products) {
            if (!p.product_prices || p.product_prices.length === 0) continue;
            
            const basePrice = p.product_prices[0].price;
            
            const numVendorsToAdd = Math.floor(Math.random() * 3) + 3; 
            const shuffledVendors = vendors.sort(() => 0.5 - Math.random()).slice(0, numVendorsToAdd);

            for (const v of shuffledVendors) {
                const { data: existing } = await supabase
                    .from('product_prices')
                    .select('id')
                    .eq('product_id', p.id)
                    .eq('vendor_id', v.id)
                    .maybeSingle();

                if (!existing) {
                    const variation = (Math.random() * 0.25) - 0.10; 
                    const newPrice = Math.round(basePrice * (1 + variation));

                    const { error: insErr } = await supabase.from('product_prices').insert({
                        product_id: p.id,
                        vendor_id: v.id,
                        price: newPrice,
                        original_price: Math.round(newPrice * 1.1),
                        product_url: "", // Supabase might reject null, using empty string
                        shipping_info: 'Ücretsiz Kargo',
                        in_stock: true
                    });
                    if (insErr) {
                        console.error('Insert error:', insErr.message);
                        continue;
                    }
                    
                    await supabase.from('price_history').insert({
                        product_id: p.id,
                        vendor_id: v.id,
                        price: newPrice
                    });

                    addedCount++;
                }
            }
        }

        console.log(`✅ İşlem tamamlandı! Toplam ${addedCount} yeni mağaza fiyatı eklendi.`);
    } catch (err) {
        console.error("Hata oluştu:", err);
    } finally {
        process.exit(0);
    }
}

addMockPrices();
