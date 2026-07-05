import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateAffiliateLink, isAffiliateLink } from '@/lib/affiliate';
import { v4 as uuidv4 } from 'uuid';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = params.id;
  const searchParams = request.nextUrl.searchParams;
  // If we have multiple prices for a product, we should ideally know the vendor_id.
  // But usually /git/[id] means going to the primary or requested vendor.
  // We can accept a `?vendor_id=` query param to know exactly which link they clicked.
  const vendorIdParam = searchParams.get('vendor');
  const vendorId = vendorIdParam ? parseInt(vendorIdParam, 10) : null;

  if (!productId) {
    return NextResponse.redirect(new URL('/', request.url), 307);
  }

  // Fetch product price and vendor
  let query = supabase
    .from('product_prices')
    .select(`
      product_url,
      affiliate_url,
      vendor_id,
      vendors ( name )
    `)
    .eq('product_id', productId);

  if (vendorId) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data: priceData, error } = await query.limit(1).single();

  if (error || !priceData) {
    // If we can't find it, fallback to product details page or home
    return NextResponse.redirect(new URL(`/urun/${productId}`, request.url), 307);
  }

  const vendorName = priceData.vendors?.name || '';
  const finalUrl = generateAffiliateLink(vendorName, priceData.product_url, priceData.affiliate_url);
  const isAff = isAffiliateLink(vendorName, priceData.affiliate_url);

  // Cookie handling for session_id
  let sessionId = request.cookies.get('piinti_session')?.value;
  let isNewSession = false;
  if (!sessionId) {
    sessionId = uuidv4();
    isNewSession = true;
  }

  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  // Fire-and-forget logging (do not await)
  supabase.from('clicks').insert({
    product_id: productId,
    vendor_id: priceData.vendor_id,
    user_agent: userAgent,
    referrer: referrer,
    session_id: sessionId,
    is_affiliate: isAff
  }).then(({ error: insertError }) => {
    if (insertError) {
      console.error('Click logging failed:', insertError);
    }
  });

  const response = NextResponse.redirect(finalUrl, 307);

  // Set the cookie if new
  if (isNewSession) {
    // Set cookie for 1 year
    response.cookies.set('piinti_session', sessionId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }

  return response;
}
