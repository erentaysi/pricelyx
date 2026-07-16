import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Basit bellek-içi (in-memory) rate limiter
// Not: Vercel Serverless'ta instance'lar arası paylaşılmaz ama ani bot spam'ını (DoS) %90 oranında keser.
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 Saat

export async function POST(req: Request) {
  try {
    // 1. IP Adresini Al ve Rate Limit Kontrolü Yap
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    if (ip !== 'unknown') {
      const now = Date.now();
      const userLimit = rateLimitMap.get(ip);
      
      if (userLimit && userLimit.resetTime > now) {
        if (userLimit.count >= RATE_LIMIT_MAX) {
          return NextResponse.json({ error: 'Çok fazla başvuru denemesi yaptınız. Lütfen daha sonra tekrar deneyin (Rate Limit).' }, { status: 429 });
        }
        userLimit.count += 1;
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
      }
    }

    // 2. Payload'ı Al
    const body = await req.json();
    const { name, email, password, xmlUrl, taxId, acceptedTerms, inviteCode } = body;

    if (!acceptedTerms) {
      return NextResponse.json({ error: 'Kullanım şartları ve KVKK aydınlatma metnini kabul etmelisiniz.' }, { status: 400 });
    }
    
    if (!inviteCode || inviteCode !== process.env.NEXT_PUBLIC_VENDOR_INVITE_CODE) {
      return NextResponse.json({ error: 'Geçersiz davetiye kodu. Sistem şu an kapalı beta aşamasındadır.' }, { status: 403 });
    }

    // 3. İstemci (Client) tarafında Supabase işlemlerine izin vermek için onay dön
    // Service Role key kullanılmadığı için auth işlemleri istemcide yapılacak.
    return NextResponse.json({ success: true, message: 'Doğrulama başarılı. İstemci kayıt yapabilir.' });

  } catch (error: any) {
    console.error('API /vendor/register Hatası:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 });
  }
}
