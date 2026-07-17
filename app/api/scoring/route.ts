import { NextResponse } from 'next/server';
import { ScoringService } from '@/lib/scoring/scoring-service';

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return false;
  }
  entry.count++;
  return entry.count > 30; // Dakikada 30 istek
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId parametresi zorunludur.' }, { status: 400 });
    }

    if (isRateLimited(productId)) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const service = new ScoringService();
    const score = await service.scoreProduct(productId);

    return NextResponse.json({ score });

  } catch (error: any) {
    console.error('[Scoring API] Error:', error.message);
    return NextResponse.json({ error: 'Skor hesaplanamadı.' }, { status: 500 });
  }
}
