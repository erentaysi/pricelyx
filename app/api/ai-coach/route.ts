import { NextResponse } from 'next/server';
import { AiCoachService } from '@/lib/ai/coach-service';

// ─── Rate Limiting (In-Memory) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 }); // 1 Dakika
    return false;
  }
  entry.count++;
  return entry.count > 10; // IP/Sess bazında dakikada maks 10 OpenAI isteği
}

function getIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown-ip';
}

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Geçerli bir Product ID gerekli' }, { status: 400 });
    }

    const ip = getIp(request);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' }, { status: 429 });
    }

    const service = new AiCoachService();
    const analysis = await service.getProductAnalysis(productId);

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('[AiCoachRoute] Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI Coach could not generate analysis.' }, 
      { status: 500 }
    );
  }
}
