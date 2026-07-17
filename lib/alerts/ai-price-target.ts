/**
 * AI Fiyat Hedefi Önerici
 * 
 * Mevcut fiyat geçmişi verilerine (lib/analytics.ts) dayanarak
 * kullanıcıya "akıllı hedef fiyat" önerir.
 * 
 * Kural: Sadece gerçek verileri kullanır. Veri yoksa öneri vermez.
 */
import { PricePoint } from '@/lib/analytics';
import { AiPriceRecommendation } from './types';

export function calculateAiPriceTarget(
  priceHistory: PricePoint[],
  currentPrice: number
): AiPriceRecommendation | null {
  // Yeterli veri yoksa öneri verme
  if (!priceHistory || priceHistory.length < 5) {
    return null;
  }

  const prices = priceHistory.map(p => p.price).filter(p => p > 0);
  if (prices.length < 5) return null;

  // ─── İstatistiksel Hesaplamalar ───
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const minPrice = sortedPrices[0];
  const maxPrice = sortedPrices[sortedPrices.length - 1];
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Medyan
  const mid = Math.floor(sortedPrices.length / 2);
  const median = sortedPrices.length % 2 !== 0
    ? sortedPrices[mid]
    : (sortedPrices[mid - 1] + sortedPrices[mid]) / 2;

  // Standart Sapma
  const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // ─── Akıllı Hedef Fiyat Hesaplama ───
  // Strateji: Medyanın 1 standart sapma altını hedefle.
  // Bu, fiyatın "iyi fırsat" bölgesine düştüğü anlamına gelir.
  let recommendedPrice = Math.round(median - stdDev * 0.5);

  // Hedef fiyat, tarihi minimumun altına düşmesin (gerçekçi kalsın)
  if (recommendedPrice < minPrice) {
    recommendedPrice = minPrice;
  }

  // Hedef fiyat, mevcut fiyatın üzerinde olmasın (anlamsız olur)
  if (recommendedPrice >= currentPrice) {
    // En azından %5 indirim hedefle
    recommendedPrice = Math.round(currentPrice * 0.95);
  }

  // ─── Güven Seviyesi ───
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  const dataPoints = priceHistory.length;

  if (dataPoints >= 30 && stdDev / mean < 0.15) {
    // Çok veri + düşük volatilite = yüksek güven
    confidence = 'high';
  } else if (dataPoints < 10 || stdDev / mean > 0.3) {
    // Az veri veya yüksek volatilite = düşük güven
    confidence = 'low';
  }

  // ─── Kaç günlük veriye dayanıyor ───
  const dates = priceHistory.map(p => new Date(p.date).getTime()).filter(d => !isNaN(d));
  const oldestDate = Math.min(...dates);
  const newestDate = Math.max(...dates);
  const basedOnDays = Math.ceil((newestDate - oldestDate) / (1000 * 60 * 60 * 24)) || 1;

  // ─── Açıklama Üretimi ───
  const dropPercent = ((currentPrice - recommendedPrice) / currentPrice * 100).toFixed(1);
  const reasoning = `Son ${basedOnDays} günlük fiyat geçmişine göre bu ürünün medyan fiyatı ${Math.round(median)}₺, ` +
    `tarihi en düşük fiyatı ${Math.round(minPrice)}₺. ` +
    `AI, mevcut ${Math.round(currentPrice)}₺ fiyatından yaklaşık %${dropPercent} düşüş yaşandığında ` +
    `(${recommendedPrice}₺) alarm tetiklenmesini öneriyor.`;

  return {
    recommendedPrice,
    confidence,
    reasoning,
    basedOnDays
  };
}
