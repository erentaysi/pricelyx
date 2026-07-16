require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
s.from('feed_sync_logs').select('error_details, created_at').not('error_details', 'is', null).order('created_at', {ascending: false}).limit(1).then(r => console.log(r)).catch(console.error);
