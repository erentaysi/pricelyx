import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, password, name, xmlUrl, taxId, inviteCode } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'E-posta, şifre ve mağaza adı zorunludur.' }, { status: 400 });
    }

    // 1. Kullanıcıyı oluştur (Admin API ile)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Otomatik onayla (rate limit bypass)
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Bu e-posta adresiyle zaten bir hesap var. Lütfen giriş yapın.' }, { status: 400 });
      }
      throw new Error(authError.message);
    }

    const userId = authData.user.id;

    // 2. Mağazayı oluştur
    const { data: vendorData, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .insert([
        {
          name,
          xml_feed_url: xmlUrl,
          tax_id: taxId,
          status: 'pending' // Başlangıçta onay bekliyor
        }
      ])
      .select()
      .single();

    if (vendorError) {
      // Temizlik (Kullanıcıyı sil)
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error('Mağaza oluşturulurken hata: ' + vendorError.message);
    }

    // 3. Kullanıcı ile mağazayı bağla
    const { error: vuError } = await supabaseAdmin
      .from('vendor_users')
      .insert([
        {
          vendor_id: vendorData.id,
          auth_id: userId,
          role: 'admin'
        }
      ]);

    if (vuError) {
      // Temizlik
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('vendors').delete().eq('id', vendorData.id);
      throw new Error('Kullanıcı mağazaya bağlanırken hata: ' + vuError.message);
    }

    return NextResponse.json({ success: true, vendor: vendorData });
  } catch (error: any) {
    console.error('Vendor Signup API Error:', error);
    return NextResponse.json({ error: error.message || 'Bilinmeyen bir hata oluştu.' }, { status: 500 });
  }
}
