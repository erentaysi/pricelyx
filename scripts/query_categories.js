require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: categories } = await supabase.from('categories').select('*');
  const { data: products } = await supabase.from('products').select('category_id');
  
  const counts = {};
  products.forEach(p => counts[p.category_id] = (counts[p.category_id] || 0) + 1);
  categories.forEach(c => c.product_count = counts[c.id] || 0);
  
  console.log(JSON.stringify(categories, null, 2));
}

run();
