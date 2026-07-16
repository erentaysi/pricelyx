require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addVendors() {
  const vendors = [
    { name: 'Joker', logo: 'https://cdn.joker.com.tr/assets/img/joker-logo-1.png', color: '#ff7900', status: 'approved' },
    { name: 'Kanz', logo: 'https://kanz.com.tr/Uploads/Images/kanz-logo.png', color: '#131e5c', status: 'approved' }
  ];

  for (let v of vendors) {
    const { data: existing } = await supabase.from('vendors').select('*').eq('name', v.name).single();
    if (!existing) {
      console.log(`Eklendi: ${v.name}`);
      await supabase.from('vendors').insert([v]);
    } else {
      console.log(`Zaten var: ${v.name}`);
    }
  }
}

addVendors();
