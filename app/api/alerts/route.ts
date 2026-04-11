import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { productId, email, targetPrice } = await request.json();

    if (!productId || !email || !targetPrice) {
      return NextResponse.json({ error: 'Eksik bilgi gönderildi.' }, { status: 400 });
    }

    // Basit bir e-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Geçersiz e-posta adresi.' }, { status: 400 });
    }

    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json({ error: 'Lütfen geçerli bir fiyat girin.' }, { status: 400 });
    }

    // SSR User Kontrolü
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const { data: existingAlert } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('product_id', productId)
      .eq('email', email)
      .single();

    if (existingAlert) {
      // Alarm zaten var ise sadece fiyatı güncelleyelim
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({ target_price: priceNum, is_active: true, user_id: userId })
        .eq('id', existingAlert.id);

      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, message: 'Fiyat alarmınız güncellendi!' });
    }

    // Yeni Alarm
    const { error: insertError } = await supabase
      .from('price_alerts')
      .insert({
        product_id: productId,
        email: email,
        target_price: priceNum,
        is_active: true,
        user_id: userId
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, message: 'Fiyat ziliniz başarıyla kuruldu!' });

  } catch (error: any) {
    console.error('Price Alert Error:', error.message);
    return NextResponse.json({ error: 'Alarm kurulurken bir hata oluştu.' }, { status: 500 });
  }
}

