import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAffiliateLink, isAffiliateLink } from '@/lib/affiliate';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const searchParams = request.nextUrl.searchParams;
  const vendorIdParam = searchParams.get('vendor');

  // ── Parametre Doğrulama ───────────────────────────────────────────────────
  if (!productId || !vendorIdParam) {
    console.error('[git/redirect] Eksik parametre:', { productId, vendorIdParam });
    return NextResponse.redirect(
      new URL(`/hata?kod=eksik-parametre`, request.nextUrl.origin),
      307
    );
  }

  const vendorIdInt = parseInt(vendorIdParam, 10);
  if (isNaN(vendorIdInt)) {
    console.error('[git/redirect] Geçersiz vendor_id:', vendorIdParam);
    return NextResponse.redirect(
      new URL(`/hata?kod=gecersiz-vendor`, request.nextUrl.origin),
      307
    );
  }

  // ── Fiyat + Satıcı Kaydını Çek ───────────────────────────────────────────
  // NOT: affiliate_url kolonu vendors tablosunda olmayabilir.
  // Önce product_prices'taki product_url'i çekiyoruz, vendors join'ini ayrı yapıyoruz.
  const { data: priceData, error: priceError } = await supabase
    .from('product_prices')
    .select('vendor_id, product_url')
    .eq('product_id', productId)
    .eq('vendor_id', vendorIdInt)
    .limit(1)
    .single();

  if (priceError || !priceData) {
    console.error('[git/redirect] product_prices kaydı bulunamadı:', {
      productId,
      vendorId: vendorIdInt,
      error: priceError?.message,
    });
    // Kullanıcıya anasayfaya sessizce atmak yerine açıklayıcı hata sayfası göster
    return NextResponse.redirect(
      new URL(`/hata?kod=magaza-bulunamadi&urun=${productId}`, request.nextUrl.origin),
      307
    );
  }

  const productUrl = priceData.product_url;

  if (!productUrl || !productUrl.startsWith('http')) {
    console.error('[git/redirect] Geçersiz product_url:', productUrl);
    return NextResponse.redirect(
      new URL(`/hata?kod=gecersiz-url&urun=${productId}`, request.nextUrl.origin),
      307
    );
  }

  // ── Satıcı Bilgisini Çek (affiliate_url opsiyonel) ───────────────────────
  const { data: vendorData } = await supabase
    .from('vendors')
    .select('name, affiliate_url')
    .eq('id', vendorIdInt)
    .maybeSingle();

  const vendorName = vendorData?.name || 'Bilinmiyor';
  const vendorRecord = vendorData as { name?: string; affiliate_url?: string } | null;
  const affiliateUrl = vendorRecord?.affiliate_url ?? null;

  const finalUrl = generateAffiliateLink(vendorName, productUrl, affiliateUrl);
  const isAff = isAffiliateLink(vendorName, affiliateUrl);

  // ── Click Tracking ────────────────────────────────────────────────────────
  let sessionId = request.cookies.get('piinti_session')?.value;
  let isNewSession = false;
  if (!sessionId) {
    sessionId = uuidv4();
    isNewSession = true;
  }

  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  // Fire-and-forget click kaydı (await: Vercel context kapanmasın diye zorunlu)
  await supabase.from('clicks').insert({
    product_id: productId,
    vendor_id: priceData.vendor_id,
    user_agent: userAgent,
    referrer: referrer,
    session_id: sessionId,
    is_affiliate: isAff,
  }).then(({ error: clickErr }) => {
    if (clickErr) console.error('[git/redirect] Click kaydı hatası:', clickErr.message);
  });

  // ── Yönlendirme ──────────────────────────────────────────────────────────
  const response = NextResponse.redirect(finalUrl, 307);

  if (isNewSession) {
    response.cookies.set('piinti_session', sessionId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
