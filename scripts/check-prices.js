require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    const { count } = await supabase.from('product_prices').select('*', { count: 'exact', head: true });
    console.log(`Total prices in DB: ${count}`);
    process.exit(0);
}
check();
