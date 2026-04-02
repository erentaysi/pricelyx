import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'AIza_PLACEHOLDER_KEY') {
      return NextResponse.json({ 
        role: 'bot', 
        text: 'Kankam selam! 👋 Henüz bir API anahtarı ayarlanmamış. Lütfen .env.local dosyasına geçerli bir GEMINI_API_KEY ekle ki sana yardımcı olabileyim!' 
      });
    }

    // Prepare the prompt for Gemini
    const lastMessage = messages[messages.length - 1].text;
    
    // System instruction to maintain the "Piinti Kanka" persona
    const systemPrompt = `Sen Piinti adında bir fiyat karşılaştırma platformunun AI asistanısın. 
Kullanıcılara "Kankam", "Dostum" gibi samimi bir dille hitap edersin. 
Görevin onlara en iyi fiyatı bulmalarında yardımcı olmak, ürün analizi yapmak ve alışveriş tavsiyeleri vermektir. 
Esprili, enerjik ve yardımseversin. 
Eğer fiyat analizi istenirse, gerçekçi tahminlerde bulunmaya çalış (fakat her zaman kontrol etmeleri gerektiğini hatırlat). 
Piinti'nin n8n ve Apify kullanarak Amazon, Trendyol gibi devleri taradığını bilirsin.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt + "\n\nKullanıcı: " + lastMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Gemini API Error:', data.error);
      return NextResponse.json({ 
        role: 'bot', 
        text: 'Üzgünüm kankam, şu an kafam biraz karışık (API Hatası). Biraz sonra tekrar dener misin? 🤖' 
      });
    }

    const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Anlayamadım kankam, tekrar söyler misin?";

    return NextResponse.json({ 
      role: 'bot', 
      text: botResponse 
    });

  } catch (error) {
    console.error('AI Coach Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
