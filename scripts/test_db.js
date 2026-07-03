require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('Connecting...');
  const { data, error } = await supabase.from('vendors').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
  // process.exit(0);
}

test();
