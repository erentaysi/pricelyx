require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Eski kategoriler temizleniyor...");
  // Kendi parent_id'si null olan ve aynı zamanda hiçbir kategorinin parent_id'si olarak geçmeyen (yani eski düz kategoriler)
  const { data: categories } = await supabase.from('categories').select('id, name, parent_id');
  
  const parentIds = new Set(categories.filter(c => c.parent_id !== null).map(c => c.parent_id));
  const newMainIds = Array.from(parentIds);
  
  // Eski kategoriler (parent_id null ve newMainIds içinde yok)
  const oldCategories = categories.filter(c => c.parent_id === null && !newMainIds.includes(c.id) && c.name !== 'Piinti Market');
  
  console.log(`Silinecek eski kategori sayısı: ${oldCategories.length}`);
  for (let c of oldCategories) {
    console.log(`- Siliniyor: ${c.name}`);
    await supabase.from('categories').delete().eq('id', c.id);
  }
  
  console.log("Eski kategoriler başarıyla temizlendi.");
}

run();
