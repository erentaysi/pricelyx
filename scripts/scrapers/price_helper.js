// scripts/scrapers/price_helper.js

/**
 * Ürünün fiyatını günceller ve price_history tablosunda değişim odaklı (Change-Only) + 
 * 7 günlük kalp atışı (Heartbeat) mantığıyla geçmiş kaydı tutar.
 */
async function upsertPriceAndHistory(supabase, pId, vendorId, price, url, in_stock = true) {
  try {
    // 1. Mevcut Fiyatı Kontrol Et
    const { data: existingPrice } = await supabase.from('product_prices')
      .select('id, price').eq('product_id', pId).eq('vendor_id', vendorId).single();

    if (existingPrice) {
      const { error: priceErr } = await supabase.from('product_prices').update({
        price: price, product_url: url, in_stock: in_stock, updated_at: new Date().toISOString(), last_updated_at: new Date().toISOString()
      }).eq('id', existingPrice.id);
      if (priceErr) throw priceErr;
    } else {
      const { error: priceErr } = await supabase.from('product_prices').insert([{
        product_id: pId, vendor_id: vendorId, price: price, product_url: url, in_stock: in_stock
      }]);
      if (priceErr) throw priceErr;
    }

    // 2. Fiyat Geçmişi (Price History) Kontrolü
    const { data: lastHistory } = await supabase.from('price_history')
      .select('price, recorded_at')
      .eq('product_id', pId)
      .eq('vendor_id', vendorId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    let shouldInsertHistory = false;

    if (!lastHistory) {
      // Hiç geçmiş yoksa (ilk kayıt)
      shouldInsertHistory = true;
    } else if (lastHistory.price !== price) {
      // Fiyat değişmişse
      shouldInsertHistory = true;
    } else {
      // Fiyat aynı, heartbeat kontrolü yap (7 gün)
      const lastRecordedAt = new Date(lastHistory.recorded_at).getTime();
      const now = Date.now();
      const daysSince = (now - lastRecordedAt) / (1000 * 60 * 60 * 24);
      
      if (daysSince >= 7) {
        shouldInsertHistory = true; // Heartbeat at
      }
    }

    if (shouldInsertHistory) {
      const { error: histErr } = await supabase.from('price_history').insert([{
        product_id: pId,
        vendor_id: vendorId,
        price: price
      }]);
      if (histErr) throw histErr;
    }

    return { success: true, isNew: !existingPrice, historyInserted: shouldInsertHistory };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { upsertPriceAndHistory };
