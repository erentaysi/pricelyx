require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDb() {
  const { data, error } = await supabase
    .from('products')
    .select('title, product_prices(count)')
    .order('created_at', { ascending: false })
    .limit(20);
    
  if (error) console.error(error);
  
  console.log(JSON.stringify(data, null, 2));
}

checkDb();
