import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'AIza_PLACEHOLDER_KEY') {
      return NextResponse.json({ 
        role: 'bot', 
        text: 'Hoş geldiniz. 👋 Şu anda servisimiz yapılandırma aşamasındadır. Lütfen sistem yöneticinizle iletişime geçerek GEMINI_API_KEY anahtarının tanımlanmasını sağlayınız.' 
      });
    }

    // Extract last message
    const lastMessage = messages[messages.length - 1].text;
    
    // RAG: Fetch products from database that might match user intent (simple keyword search)
    // We split user message to words and try to find matching products
    const words = lastMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    let dbContext = '';
    
    if (words.length > 0) {
      let query = supabase.from('products').select('id, title, product_prices(price, product_url, vendors(name))').limit(10);
      
      // Use the first significant word to search
      const keyword = words[0]; 
      query = query.ilike('title', `%${keyword}%`);
      
      const { data: products } = await query;
      
      if (products && products.length > 0) {
        dbContext = "\n\nVeritabanımızda kullanıcının sorduğu konuyla ilgili bulduğumuz güncel ürünler şunlardır:\n";
        products.forEach((p: any) => {
           const prices = p.product_prices || [];
           const lowestPrice = prices.length > 0 ? Math.min(...prices.map((pr: any) => pr.price)) : 'Bilinmiyor';
           const url = prices.length > 0 ? prices[0].product_url : '#';
           dbContext += `- ${p.title} (En Düşük Fiyat: ${lowestPrice} ₺, Link: ${url})\n`;
        });
        dbContext += "\nKullanıcıya cevap verirken mutlaka bu ürünlerden ve fiyatlarından bahset. Linklerini de paylaş.";
      }
    }

    // System instruction to maintain the professional persona
    const systemPrompt = `Siz, Piinti adında profesyonel bir fiyat karşılaştırma platformunun resmi yapay zeka asistanısınız. 
Kullanıcılara karşı nazik, profesyonel ve kurumsal bir dille hitap edersiniz. "Siz", "Sayın Kullanıcı" veya "Hoş geldiniz" gibi resmi ifadeler kullanmalısınız.
Eğer veritabanımızdan ürün bilgisi gelirse, bu ürünleri fiyatları ve linkleriyle birlikte önerin. Gelmezse, genel tavsiyelerde bulunun.`;

    const modelName = 'gemini-1.5-flash';
    
    const callGemini = async (retryCount = 0): Promise<any> => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: systemPrompt + dbContext + "\n\nKullanıcı: " + lastMessage }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });

      if (response.status === 429 && retryCount < 1) {
        console.warn('Rate limited (429). Retrying in 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return callGemini(retryCount + 1);
      }
      return response;
    };
    
    try {
      const response = await callGemini();

      if (!response.ok) {
        console.error('Gemini API HTTP Error:', response.status, response.statusText);
        return NextResponse.json({ 
          role: 'bot', 
          text: `Yapay zeka servisine bağlanırken bir sorun oluştu (HTTP ${response.status}). Lütfen birkaç dakika sonra tekrar deneyiniz.` 
        });
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Gemini API Error:', JSON.stringify(data.error, null, 2));
        
        const errCode = data.error.code || 'Bilinmiyor';
        const errMsg = data.error.message || 'Detay yok';
        
        let friendlyMsg = `Şu anda AI motorumuzda geçici bir sorun yaşanmaktadır. (Kod: ${errCode}). Lütfen kısa bir süre sonra tekrar deneyiniz.`;
        if (errMsg.includes('API key') || errMsg.includes('API_KEY_INVALID')) friendlyMsg = "API anahtarı yapılandırmasında bir sorun tespit edildi. Sistem yöneticisi bilgilendirildi.";
        if (errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) friendlyMsg = "Yapay zeka servisinin kullanım limiti geçici olarak dolmuştur. Kısa süre içinde tekrar aktif olacaktır.";
        if (errMsg.includes('not found') || errMsg.includes('NOT_FOUND')) friendlyMsg = "İstenen AI modeli bulunamadı. Sistem otomatik olarak güncelleniyor.";
        
        return NextResponse.json({ 
          role: 'bot', 
          text: friendlyMsg 
        });
      }
      
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!botResponse) {
        return NextResponse.json({ 
          role: 'bot', 
          text: 'Şu an talebinize uygun bir yanıt oluşturulamadı. Lütfen tekrar sorar mısın?' 
        });
      }

      return NextResponse.json({ 
        role: 'bot', 
        text: botResponse 
      });

    } catch (e: any) {
      console.error('Fetch error for Gemini:', e.message);
      return NextResponse.json({ 
        role: 'bot', 
        text: 'Sunucu ile bağlantı sağlanamadı. Birazdan tekrar deneyin.' 
      });
    }
  } catch (error) {
    console.error('AI Coach Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
