require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = fs.readFileSync('scripts/database_migration_vendor.sql', 'utf8');
  console.log("SQL çalıştırılıyor...");
  const res = await supabase.rpc('execute_sql', { query: sql });
  console.log("Sonuç:", res);
}
run();
