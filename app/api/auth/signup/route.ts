import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre zorunludur.' }, { status: 400 });
    }

    // 1. Kullanıcıyı oluştur (Admin API ile - Rate Limit bypass)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Otomatik onayla
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Bu e-posta adresiyle zaten bir hesap var. Lütfen giriş yapın.' }, { status: 400 });
      }
      throw new Error(authError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('B2C Signup API Error:', error);
    return NextResponse.json({ error: error.message || 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}
