require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_trigger_ghost@piinti.com',
    password: 'password123',
    email_confirm: true
  });
  console.log("Create user error:", error);
  console.log("Created user data:", data);
}
test();
