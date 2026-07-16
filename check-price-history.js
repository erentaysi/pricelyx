require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTable() {
  const { data, error } = await supabase.from('price_history').select('*').limit(1);
  if (error) {
    if (error.code === '42P01') {
      console.log('TABLO YOK: price_history bulunamadı (42P01)');
    } else {
      console.log('BAŞKA BİR HATA:', error);
    }
  } else {
    console.log('TABLO VAR: price_history mevcut.');
  }
}

checkTable();
