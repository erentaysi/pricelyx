require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fix() {
  console.log('Moving smart watches back to Elektronik...');
  
  const { data: cats } = await supabase.from('categories').select('id, slug, name');
  const elektronikCat = cats.find(c => c.slug === 'elektronik');
  const sportCat = cats.find(c => c.slug === 'spor-outdoor');
  
  if (!elektronikCat || !sportCat) { console.log('Categories not found'); return; }
  
  // Get all products currently in Spor that are actually smart watches
  const { data: sportProducts } = await supabase.from('products').select('id, title, category_id').eq('category_id', sportCat.id);
  
  if (!sportProducts) return;
  
  const watchKeywords = ['akıllı saat', 'smart watch', 'smartwatch', 'watch se', 'watch series', 'watch gt', 'watch fit', 'galaxy watch', 'apple watch', 'honor choice watch', 'band 11', 'mi smart band'];
  
  for (const p of sportProducts) {
    const titleLower = p.title.toLowerCase();
    const isWatch = watchKeywords.some(kw => titleLower.includes(kw));
    
    if (isWatch) {
      console.log(`Moving "${p.title}" back to Elektronik`);
      await supabase.from('products').update({ category_id: elektronikCat.id }).eq('id', p.id);
    }
  }
  
  console.log('Done!');
}

fix();
