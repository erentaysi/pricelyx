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

  if (!productId || !vendorIdParam) {
    return NextResponse.redirect('https://www.piinti.com');
  }

  // Fetch product and vendor info
  let query = supabase
    .from('product_prices')
    .select(`
      vendor_id,
      product_url,
      vendors!inner(name, affiliate_url)
    `)
    .eq('product_id', productId)
    .eq('vendor_id', parseInt(vendorIdParam));

  const { data: priceData, error } = await query.limit(1).single();

  if (error || !priceData) {
    console.error('Redirect error or not found:', error);
    return NextResponse.redirect('https://www.piinti.com');
  }

  const { finalUrl, isAffiliateLink: isAff } = generateAffiliateLink({
    vendorName: (priceData.vendors as any).name,
    productUrl: priceData.product_url,
    affiliateUrl: (priceData.vendors as any).affiliate_url,
  });

  // Basic Click Tracking
  let sessionId = request.cookies.get('piinti_session')?.value;
  let isNewSession = false;
  if (!sessionId) {
    sessionId = uuidv4();
    isNewSession = true;
  }

  const userAgent = request.headers.get('user-agent') || '';
  const referrer = request.headers.get('referer') || '';

  // Vercel serverless functions will kill the context if we don't await this
  await supabase.from('clicks').insert({
    product_id: productId,
    vendor_id: priceData.vendor_id,
    user_agent: userAgent,
    referrer: referrer,
    session_id: sessionId,
    is_affiliate: isAff
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
