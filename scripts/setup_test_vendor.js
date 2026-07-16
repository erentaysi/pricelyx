require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupTestVendor() {
  // Bütün testmagazasi veya vendor isimlerine sahip satıcıları test_feed.xml ile donat
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update({ 
      xml_feed_url: 'http://localhost:3000/test_feed.xml',
      status: 'approved'
    })
    .neq('id', 0)
    .select();
  
  if (error) console.error("Update error:", error);
  else console.log("Updated vendors for testing:", data.length);
}
setupTestVendor();
