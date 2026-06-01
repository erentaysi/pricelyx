import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'AIza_PLACEHOLDER_KEY') {
      return NextResponse.json({ 
        summary: 'İnceleme özetleri servisimiz şu anda yapılandırma aşamasındadır. Kısa süre içinde aktif olacaktır. ✨' 
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
        summary: 'Henüz bu ürün için kullanıcı incelemesi bulunmamaktadır. İlk değerlendirmeyi siz yapabilirsiniz! 😊' 
      });
    }

    const reviewsText = reviews.map(r => `[Rating: ${r.rating}/5] ${r.comment}`).join('\n');
    
    const systemPrompt = `Sen Piinti platformunun profesyonel analiz motorusun. 
Sana verilen kullanıcı yorumlarını analiz et ve potansiyel alıcılar için 2-3 cümlelik kısa ve net bir özet hazırla.
Özetinde mutlaka "Artılar" ve "Eksiler" şeklinde bir ayrım yapmaya çalış.
Dilin profesyonel ve bilgilendirici olsun. Kullanıcıya hitap ederken "Siz" diye hitap et.`;

    const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://www.piinti.com',
        'X-Title': 'Piinti'
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "İncelemeler:\n" + reviewsText }
        ],
        temperature: 0.7,
        max_tokens: 512,
      })
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "İnceleme özetleri şu anda hazırlanamıyor. Lütfen daha sonra tekrar deneyiniz.";

    return NextResponse.json({ summary });

  } catch (error) {
    console.error('Summarize Reviews Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
