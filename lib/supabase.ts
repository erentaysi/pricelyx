import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Client-side / genel kullanım için (RLS'e tabi, anon key)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Server-only client — SADECE API route'larında ve server action'larda kullan.
// Bu client RLS'i bypass eder, asla client component'e import etme.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : supabase; // fallback: key tanımlı değilse eski davranışa düş (kırılma olmasın)