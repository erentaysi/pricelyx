import dns from 'dns';
import { promisify } from 'util';
import { XMLParser } from 'fast-xml-parser';
import DOMPurify from 'isomorphic-dompurify';

const lookupAsync = promisify(dns.lookup);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit (DoS protection)
const MAX_REDIRECTS = 3; // Max hops to prevent redirect loops

// Internal IP kontrolü (SSRF Protection)
function isInternalIP(ip: string): boolean {
  if (!ip) return false;
  // IPv4 regex kontrolü
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);
  
  if (match) {
    const parts = match.slice(1, 5).map(Number);
    // 10.0.0.0 - 10.255.255.255
    if (parts[0] === 10) return true;
    // 172.16.0.0 - 172.31.255.255
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0 - 192.168.255.255
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 127.0.0.0 - 127.255.255.255 (Localhost)
    if (parts[0] === 127) return true;
    // 169.254.0.0 - 169.254.255.255 (Cloud Meta-Data)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0
    if (parts[0] === 0) return true;
  }
  
  // Basit IPv6 Localhost kontrolü
  if (ip === '::1' || ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:') || ip.toLowerCase().startsWith('fd00:')) {
    return true;
  }
  
  return false;
}

// URL'in güvenli olup olmadığını kontrol et
async function isSafeUrl(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    
    // IP çözümleme
    const lookupResult = await lookupAsync(parsed.hostname);
    if (isInternalIP(lookupResult.address)) {
      console.warn(`[SSRF Koruması] İç IP tespit edildi: ${lookupResult.address} -> ${targetUrl}`);
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Güvenli XML Fetch İşlemi (SSRF, Redirect ve DoS korumalı)
export async function fetchSecureXml(urlStr: string, redirectCount = 0): Promise<string> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error('Too many redirects');
  }

  const isSafe = await isSafeUrl(urlStr);
  if (!isSafe) {
    throw new Error('SSRF Koruması: Güvenli olmayan hedef URL veya IP adresine erişim engellendi.');
  }

  // Yönlendirmeleri manuel kontrol et ki her adımda IP testi yapılabilsin
  const response = await fetch(urlStr, { redirect: 'manual' });

  // Yönlendirme (301, 302, 303, 307, 308) yakalama
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) throw new Error('Redirect hedefi (Location) bulunamadı.');
    
    const nextUrl = new URL(location, urlStr).toString();
    return fetchSecureXml(nextUrl, redirectCount + 1);
  }

  if (!response.ok) {
    throw new Error(`HTTP Hatası: ${response.status} ${response.statusText}`);
  }

  // Dosya Boyutu Koruması (Streaming limit)
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Response body okunamadı.');

  let receivedLength = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    if (value) {
      receivedLength += value.length;
      if (receivedLength > MAX_FILE_SIZE) {
        throw new Error('Dosya boyutu sınırı aşıldı (Maksimum 10MB)');
      }
      chunks.push(value);
    }
  }

  const chunksAll = new Uint8Array(receivedLength);
  let position = 0;
  for (const chunk of chunks) {
    chunksAll.set(chunk, position);
    position += chunk.length;
  }

  return new TextDecoder('utf-8').decode(chunksAll);
}

// Güvenli XML Parse İşlemi (XXE Koruması)
export function parseSecureXml(xmlContent: string): any {
  // fast-xml-parser doğası gereği XXE entity resolution yapmaz
  // Bu yüzden xml2js'ye kıyasla daha güvenlidir
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    trimValues: true,
  });
  
  try {
    return parser.parse(xmlContent);
  } catch (error) {
    throw new Error('Geçersiz XML formatı');
  }
}

// XSS Sanitizasyon Yardımcısı
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return DOMPurify.sanitize(input.toString(), {
    ALLOWED_TAGS: [], // Tüm HTML etiketlerini tamamen kaldır
    ALLOWED_ATTR: []
  }).trim();
}
