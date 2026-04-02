import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'AIza_PLACEHOLDER_KEY') {
      return NextResponse.json({ 
        summary: 'Kankam, inceleme özetlerini görmek için bir Gemini API anahtarı gerekiyor! ✨' 
      });
    }

    // Fetch reviews from Supabase
    const { data: reviews } = await supabase
      .from('product_reviews')
      .select('comment, rating')
      .eq('product_id', productId)
      .limit(10);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ 
        summary: 'Henüz bu ürün için bir inceleme yapılmamış kankam. İlk yorumu sen yapmaya ne dersin? 😊' 
      });
    }

    const reviewsText = reviews.map(r => `[Rating: ${r.rating}/5] ${r.comment}`).join('\n');
    
    const systemPrompt = `Sen Piinti platformunun akıllı analiz motorusun. 
Sana verilen kullanıcı yorumlarını analiz et ve potansiyel alıcılar için 2-3 cümlelik bir özet hazırla.
Özetinde mutlaka "Artılar" ve "Eksiler" şeklinde bir ayrım yapmaya çalış.
Dilin samimi ve bilgilendirici olsun (Örn: "Kankalar bu ürünün bataryası efsane ama kamerası gece biraz üzebilir").`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\nİncelemeler:\n" + reviewsText }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 512,
        }
      })
    });

    const data = await response.json();
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "İncelemeleri şu an özetleyemiyorum kankam.";

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Summarize Reviews Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
