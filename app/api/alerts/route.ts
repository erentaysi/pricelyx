import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AlertService } from '@/lib/alerts/alert-service';
import { AlertType } from '@/lib/alerts/types';
import { calculateAiPriceTarget } from '@/lib/alerts/ai-price-target';
import { supabase } from '@/lib/supabase';

// ─── Rate Limiting (Basit IP/Email bazlı, In-Memory) ──────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;    // 10 istek
const RATE_LIMIT_WINDOW = 60000; // 1 dakika

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// ─── POST: Alarm Oluştur/Güncelle ─────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, email, targetPrice, alertType, percentageThreshold } = body;

    if (!productId || !email) {
      return NextResponse.json({ error: 'Ürün ID ve e-posta zorunludur.' }, { status: 400 });
    }

    // Rate Limit
    if (isRateLimited(email)) {
      return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' }, { status: 429 });
    }

    // Auth kontrolü
    const authSupabase = createClient();
    const { data: authData } = await authSupabase.auth.getUser();
    const userId = authData?.user?.id || null;

    const service = new AlertService();
    const result = await service.createAlert({
      productId,
      email,
      alertType: (alertType as AlertType) || 'target_price',
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      percentageThreshold: percentageThreshold ? parseFloat(percentageThreshold) : undefined,
      userId
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });

  } catch (error: any) {
    console.error('[Alerts API] Error:', error.message);
    return NextResponse.json({ error: 'Alarm kurulurken bir hata oluştu.' }, { status: 500 });
  }
}

// ─── GET: AI Fiyat Önerisi Al ──────────────────────────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId parametresi zorunludur.' }, { status: 400 });
    }

    // Mevcut en düşük fiyatı al
    const { data: priceData } = await supabase
      .from('product_prices')
      .select('price')
      .eq('product_id', productId)
      .order('price', { ascending: true })
      .limit(1)
      .single();

    const currentPrice = priceData?.price || 0;

    // Fiyat geçmişini al
    const { data: history } = await supabase
      .from('price_history')
      .select('price, date')
      .eq('product_id', productId)
      .order('date', { ascending: false })
      .limit(90);

    if (!history || history.length < 5 || !currentPrice) {
      return NextResponse.json({
        recommendation: null,
        message: 'Yeterli fiyat verisi yok. AI önerisi oluşturulamadı.'
      });
    }

    const recommendation = calculateAiPriceTarget(history, currentPrice);

    return NextResponse.json({
      recommendation,
      currentPrice,
      message: recommendation ? 'AI fiyat önerisi hazır.' : 'Yeterli veri bulunamadı.'
    });

  } catch (error: any) {
    console.error('[Alerts API GET] Error:', error.message);
    return NextResponse.json({ error: 'AI önerisi alınırken bir hata oluştu.' }, { status: 500 });
  }
}
