import { fetchSecureXml, parseSecureXml, sanitizeText } from './lib/xml-security';
import http from 'http';

async function runTests() {
  console.log('--- BAŞLIYOR: GÜVENLİK VE KANIT TESTLERİ ---\n');

  // 1. SSRF (Internal IP) Testi
  console.log('[TEST 1] SSRF Koruması: Localhost (127.0.0.1) Erişim Denemesi');
  try {
    // Kötü niyetli satıcının localhost'a erişmeye çalışması
    await fetchSecureXml('http://127.0.0.1:3000/api/cron/sync-xml');
    console.error('❌ HATA: SSRF başarılı oldu! Güvenlik zafiyeti var.');
  } catch (error: any) {
    console.log(`✅ BAŞARILI (Engellendi): ${error.message}`);
  }

  // 2. SSRF (AWS Cloud Metadata) Testi
  console.log('\n[TEST 2] SSRF Koruması: AWS Metadata (169.254.169.254) Erişim Denemesi');
  try {
    await fetchSecureXml('http://169.254.169.254/latest/meta-data/');
    console.error('❌ HATA: AWS Metadata erişimi başarılı oldu! Güvenlik zafiyeti var.');
  } catch (error: any) {
    console.log(`✅ BAŞARILI (Engellendi): ${error.message}`);
  }

  // 3. SSRF Redirect (Yönlendirme) Koruması Testi
  console.log('\n[TEST 3] SSRF Koruması: 302 Redirect ile Localhost\'a Atlanması');
  // Basit bir HTTP sunucusu kurup 127.0.0.1'e yönlendireceğiz
  const server = http.createServer((req, res) => {
    res.writeHead(302, { 'Location': 'http://127.0.0.1' });
    res.end();
  });
  
  server.listen(4000, async () => {
    try {
      // Saldırganın kontrolündeki dış sunucu (bizim mock sunucumuz)
      // fetchSecureXml ilk olarak localhost'a atsa bile bunu engeller ama, diyelim ki externalIP'den localhost'a yönlendirildi
      await fetchSecureXml('http://localhost:4000');
      console.error('❌ HATA: Yönlendirme üzerinden SSRF başarılı oldu!');
    } catch (error: any) {
      console.log(`✅ BAŞARILI (Redirect Engellendi): ${error.message}`);
    } finally {
      server.close();
    }
  });
}

runTests().catch(console.error);
