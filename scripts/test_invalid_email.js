require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'eren', // Invalid format
    password: 'password123',
    email_confirm: true
  });
  console.log("Create user error:", error?.message);
}
test();
