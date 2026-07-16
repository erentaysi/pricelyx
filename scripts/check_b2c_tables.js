require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data: favs } = await s.from('user_favorites').select('*').limit(1);
  const { data: alerts } = await s.from('price_alerts').select('*').limit(1);
  console.log("FAVORITES:", favs ? (favs.length ? Object.keys(favs[0]) : "Empty table, but exists") : "Table not found");
  console.log("ALERTS:", alerts ? (alerts.length ? Object.keys(alerts[0]) : "Empty table, but exists") : "Table not found");
}
check().catch(console.error);
