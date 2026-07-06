require('dotenv').config({path:'./.env.local'});
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function generateSeoSlug(text) {
  const trMap = {
      'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
      'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u',
  };
  return text
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, match => trMap[match])
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
}

(async () => {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title')
    .is('slug', null);

  if (error) { console.error(error); return; }
  console.log(`Found ${products.length} products with null slug.`);

  for (const p of products) {
    const slug = `${generateSeoSlug(p.title)}-${p.id}`;
    const { error: updErr } = await supabase.from('products').update({ slug }).eq('id', p.id);
    if (updErr) {
       console.error(`Error updating ${p.id}:`, updErr);
    } else {
       console.log(`Updated ${p.id} to slug: ${slug}`);
    }
  }
  console.log('Done!');
})();
