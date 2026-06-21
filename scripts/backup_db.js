require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log('Fetching categories...');
  const { data: categories, error: catError } = await supabase.from('categories').select('*');
  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }
  
  console.log('Fetching products...');
  const { data: products, error: prodError } = await supabase.from('products').select('*');
  if (prodError) {
    console.error('Error fetching products:', prodError);
    return;
  }
  
  fs.writeFileSync('categories_backup.json', JSON.stringify(categories, null, 2));
  fs.writeFileSync('products_backup.json', JSON.stringify(products, null, 2));
  
  console.log(`Backup completed: ${categories.length} categories, ${products.length} products.`);
}

run();
