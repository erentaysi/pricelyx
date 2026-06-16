require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data } = await supabase.from('product_prices').select('product_url, vendors!inner(name)').neq('vendors.name', 'Amazon TR').limit(10);
  console.log("All non-Amazon prices limit 10:");
  console.log(JSON.stringify(data, null, 2));

  // Check if there are any that have truthy values but are just spaces or "null"
  const { data: data2 } = await supabase.from('product_prices').select('product_url, vendors!inner(name)').neq('vendors.name', 'Amazon TR').neq('product_url', '').limit(10);
  console.log("Non-empty URLs:");
  console.log(JSON.stringify(data2, null, 2));

  process.exit(0);
}

check();
