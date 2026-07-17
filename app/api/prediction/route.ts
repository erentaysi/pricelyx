import { NextResponse } from 'next/server';
import { PredictionService } from '@/lib/prediction/prediction-service';

// Basit Rate Limiting
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

    const service = new PredictionService();
    const result = await service.getPrediction(productId);

    // AI Coach ve UI burayı okuyabilecek.
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[Prediction API] Error:', error.message);
    return NextResponse.json({ error: 'Fiyat tahmini üretilemedi.' }, { status: 500 });
  }
}
