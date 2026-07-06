require('dotenv').config({path:'./.env.local'});
const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); // wait, if I don't have service_role, I can't update.
// Actually, I do have the SUPABASE_SERVICE_ROLE_KEY? Let's check process.env in the script or use the anon key if RLS allows it.
// If not, I can just generate a SQL file to update it, and ask the user to run it!
