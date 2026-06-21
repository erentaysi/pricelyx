require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: allCategories } = await supabase.from('categories').select('*');
  const { data: productsForFilters } = await supabase.from('products').select('category_id, brands(name)');

  // 1. Markaları çıkar
  const brandsData = Array.from(new Map((productsForFilters || [])
    .filter((p) => p.brands)
    .map((p) => [Array.isArray(p.brands) ? p.brands[0].name : p.brands.name, Array.isArray(p.brands) ? p.brands[0] : p.brands])
  ).values());

  // 2. Kullanılan alt kategori ID'lerini bul
  const usedCategoryIds = new Set(productsForFilters.map(p => p.category_id));

  // 3. Kullanılan alt kategorileri ve onların parent (ana) kategorilerini bul
  const activeSubs = allCategories.filter(c => usedCategoryIds.has(c.id) && c.parent_id !== null);
  const activeMainIds = new Set(activeSubs.map(c => c.parent_id));
  const activeMains = allCategories.filter(c => activeMainIds.has(c.id));

  // 4. Hiyerarşik yapıyı oluştur (sadece ürün olanlar)
  const hierarchicalCategories = activeMains.map(main => {
    return {
      ...main,
      subs: activeSubs.filter(sub => sub.parent_id === main.id)
    }
  });

  console.log(JSON.stringify(hierarchicalCategories, null, 2));
}

run();
