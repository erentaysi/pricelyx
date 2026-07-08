import { parseSecureXml, sanitizeText } from './lib/xml-security';

async function runXxeTest() {
  console.log('\n[TEST 4] XXE (XML External Entity) Koruması Testi');
  
  // Zararlı XML payload'ı (Sunucudaki /etc/passwd dosyasını okumaya çalışır)
  const maliciousXml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
  <!ELEMENT foo ANY >
  <!ENTITY xxe SYSTEM "file:///etc/passwd" >
]>
<products>
  <product>
    <name>Zararlı Ürün</name>
    <description>&xxe;</description>
  </product>
</products>`;

  try {
    const result = parseSecureXml(maliciousXml);
    // Eğer parser "fast-xml-parser" XXE çözümlemesi yapsaydı, description alanında /etc/passwd içeriği görünürdü.
    // fast-xml-parser dış bağlantıları engellediği için "xxe" entity'si boş dönmeli veya hata vermelidir.
    
    // Güvenli sistemde description boş kalmalı veya sadece '&xxe;' metni olarak gelmelidir.
    const description = result.products?.product?.description;
    
    if (description && description.includes('root:x:0:0:')) {
      console.error('❌ HATA: XXE saldırısı BAŞARILI OLDU! /etc/passwd dosyası okundu.');
    } else {
      console.log(`✅ BAŞARILI (XXE Engellendi): Entity çözümlenmedi. Çıktı: "${description}"`);
    }
  } catch (error: any) {
    console.log(`✅ BAŞARILI (XXE Engellendi, parser hata fırlattı): ${error.message}`);
  }

  console.log('\n[TEST 5] XSS Sanitizasyon Testi');
  const xssPayload = '<script>alert(1)</script><img src=x onerror=alert(2)>Ürün Adı';
  const clean = sanitizeText(xssPayload);
  
  if (clean.includes('<script>') || clean.includes('onerror')) {
    console.error('❌ HATA: XSS başarılı oldu!');
  } else {
    console.log(`✅ BAŞARILI (XSS Engellendi): Temizlenmiş çıktı -> "${clean}"`);
  }
}

runXxeTest().catch(console.error);
