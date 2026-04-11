import { NextResponse } from 'next/server';

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

    // Prepare the prompt for Gemini
    const lastMessage = messages[messages.length - 1].text;
    
    // System instruction to maintain the professional persona
    const systemPrompt = `Siz, Piinti adında profesyonel bir fiyat karşılaştırma platformunun resmi yapay zeka asistanısınız. 
Kullanıcılara karşı nazik, profesyonel ve kurumsal bir dille hitap edersiniz. "Siz", "Sayın Kullanıcı" veya "Hoş geldiniz" gibi resmi ifadeler kullanmalısınız.
Analizlerinizde nesnel, yardımcı ve güvenilir bir profil çizmelisiniz.
Eğer fiyat analizi istenirse, Piinti'nin n8n ve Apify kullanarak pazar yerlerini anlık taradığını ve en güncel verileri sunduğunu belirtin.`;

    const modelName = 'gemini-1.5-flash';
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: systemPrompt + "\n\nKullanıcı: " + lastMessage }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('Gemini API Error:', JSON.stringify(data.error, null, 2));
        
        let friendlyMsg = 'Üzgünüm, şu anda hizmet veremiyorum (Sistem Hatası). Lütfen daha sonra tekrar deneyiniz.';
        if (data.error.message?.includes('API key')) friendlyMsg = "Kankam API anahtarında bir sorun var, kontrol eder misin?";
        
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
