const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gocwltgntiiklxwljdin.supabase.co', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvY3dsdGdudGlpa2x4d2xqZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc5MTAsImV4cCI6MjA4NTI1MzkxMH0.7jsdKarZrw33hRL71zPAtMZsNm7iScfJ5LjpHr-e5Bo'
);

async function wipeDatabase() {
    console.log("🧹 Veritabanı temizliği başlatılıyor...");

    // İlk olarak fiyat geçmişi ve mevcut fiyat tablolarını temizle
    const { error: err1 } = await supabase.from('price_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (err1) console.error("Fiyat geçmişi silinirken hata:", err1);
    else console.log("✅ Fiyat geçmişi temizlendi.");

    const { error: err2 } = await supabase.from('product_prices').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (err2) console.error("Ürün fiyatları silinirken hata:", err2);
    else console.log("✅ Ürün fiyatları temizlendi.");

    const { error: err3 } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    if (err3) console.error("Ürünler silinirken hata:", err3);
    else console.log("✅ Ürünler temizlendi.");

    console.log("✨ Temizlik tamamlandı! Veritabanı sıfırlandı ve botların temiz veri işlemesi için hazır.");
}

wipeDatabase();
