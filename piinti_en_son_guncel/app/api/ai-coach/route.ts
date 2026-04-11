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

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-3.1-flash-live-preview',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let lastError = null;
    let data = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}...`);
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

        data = await response.json();
        
        if (!data.error) {
          console.log(`Model ${modelName} succeeded!`);
          break; // Found a working model
        } else {
          console.warn(`Model ${modelName} failed with:`, data.error.message);
          lastError = data.error;
        }
      } catch (e: any) {
        console.error(`Fetch error for ${modelName}:`, e.message);
        lastError = { message: e.message };
      }
    }

    if (data?.error || !data) {
      console.error('All Gemini models failed. Last error:', JSON.stringify(lastError, null, 2));
      
      let friendlyMsg = 'Üzgünüm, şu anda hizmet veremiyorum (Sistem Hatası). Lütfen daha sonra tekrar deneyiniz.';
      if (lastError?.message) {
        friendlyMsg += `\n\nHata Bildirimi: ${lastError.message}`;
      }
      
      return NextResponse.json({ 
        role: 'bot', 
        text: friendlyMsg 
      });
    }

    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                        data.candidates?.[0]?.text || 
                        data.result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!botResponse) {
      console.warn('Empty Gemini response/Possible safety trigger:', JSON.stringify(data, null, 2));
      return NextResponse.json({ 
        role: 'bot', 
        text: 'Şu an talebinize uygun bir yanıt oluşturulamadı. Lütfen sorunuzu farklı bir şekilde sormayı deneyiniz.' 
      });
    }

    return NextResponse.json({ 
      role: 'bot', 
      text: botResponse 
    });

  } catch (error) {
    console.error('AI Coach Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
