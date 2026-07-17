/**
 * Piinti Price Prediction Engine - Core Algorithm
 * 
 * Fiyat geçmişine dayanarak istatistiksel olasılık ve trend analizi yapar.
 * AI Coach ve Price Alerts modüllerine veri sağlar.
 */
import { PredictionInput, PricePrediction, PredictionAdvice, PREDICTION_ENGINE_VERSION, MINIMUM_DATA_POINTS } from './types';

export function calculatePrediction(input: PredictionInput): PricePrediction | null {
  const history = input.priceHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (history.length < MINIMUM_DATA_POINTS) {
    return null;
  }

  const prices = history.map(h => h.price);
  const currentPrice = input.currentPrice;

  // ─── Temel İstatistikler ───
  const minPrice = Math.min(...prices, currentPrice);
  const maxPrice = Math.max(...prices, currentPrice);
  
  const now = Date.now();
  const history30d = history.filter(h => (now - new Date(h.date).getTime()) <= 30 * 86400000);
  const history90d = history.filter(h => (now - new Date(h.date).getTime()) <= 90 * 86400000);

  const avg30d = calculateAverage(history30d.map(h => h.price)) || currentPrice;
  const avg90d = calculateAverage(history90d.map(h => h.price)) || avg30d;

  // ─── Volatilite (Fiyat Oynaklığı) ───
  const variance = prices.reduce((acc, val) => acc + Math.pow(val - avg90d, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatilityRatio = stdDev / avg90d;

  let volatility: 'high' | 'medium' | 'low' = 'medium';
  if (volatilityRatio > 0.15) volatility = 'high';
  else if (volatilityRatio < 0.05) volatility = 'low';

  // ─── Momentum ve Trend ───
  // Momentum: Kısa dönemin uzun döneme göre ivmesi
  // Negatif = fiyat düşüyor (aşağı yönlü ivme)
  const priceMomentum = ((avg30d - avg90d) / avg90d) * 100;
  
  let trendDirection: 'down' | 'up' | 'stable' = 'stable';
  if (priceMomentum < -2) trendDirection = 'down';
  else if (priceMomentum > 2) trendDirection = 'up';

  let trendStrength: 'strong' | 'moderate' | 'weak' = 'moderate';
  if (Math.abs(priceMomentum) > 10) trendStrength = 'strong';
  else if (Math.abs(priceMomentum) < 3) trendStrength = 'weak';

  // ─── Olasılık Hesaplama (Heuristic Model) ───
  let dropProb = 33;
  let incProb = 33;
  let stabProb = 34;

  // Fiyat Zirveye yakınsa düşme ihtimali artar
  if (maxPrice > minPrice) {
    const position = (currentPrice - minPrice) / (maxPrice - minPrice); // 0 (dip) to 1 (zirve)
    
    if (position > 0.8) {
      dropProb += 25;
      incProb -= 15;
      stabProb -= 10;
    } else if (position < 0.2) {
      incProb += 25;
      dropProb -= 15;
      stabProb -= 10;
    }
  }

  // Momentum Etkisi
  if (trendDirection === 'down') {
    dropProb += trendStrength === 'strong' ? 15 : 5;
    incProb -= trendStrength === 'strong' ? 10 : 5;
  } else if (trendDirection === 'up') {
    incProb += trendStrength === 'strong' ? 15 : 5;
    dropProb -= trendStrength === 'strong' ? 10 : 5;
  }

  // Sınırlandırma ve Normalizasyon
  dropProb = clamp(dropProb, 5, 85);
  incProb = clamp(incProb, 5, 85);
  stabProb = clamp(100 - dropProb - incProb, 5, 85);

  // Toplamı tam 100'e eşitle
  const total = dropProb + incProb + stabProb;
  dropProb = Math.round((dropProb / total) * 100);
  incProb = Math.round((incProb / total) * 100);
  stabProb = 100 - dropProb - incProb;

  // ─── Güven Skoru ───
  let confidenceScore = 50;
  // Veri noktası fazlaysa güven artar
  if (history.length > 30) confidenceScore += 20;
  else if (history.length > 15) confidenceScore += 10;
  // Oynaklık düşükse tahmin daha güvenilirdir
  if (volatility === 'low') confidenceScore += 15;
  else if (volatility === 'high') confidenceScore -= 15;

  confidenceScore = clamp(confidenceScore, 10, 95);

  // ─── Tavsiye Motoru (Reasoning) ───
  const advice = generateAdvice({
    currentPrice, minPrice, maxPrice, avg30d, avg90d, 
    dropProb, incProb, trendDirection, volatility, confidenceScore, dataPoints: history.length
  });

  return {
    productId: input.productId,
    dropProbability: dropProb,
    increaseProbability: incProb,
    stableProbability: stabProb,
    confidenceScore,
    trendDirection,
    trendStrength,
    volatility,
    priceMomentum: Number(priceMomentum.toFixed(2)),
    currentPrice,
    averagePrice30d: Math.round(avg30d),
    averagePrice90d: Math.round(avg90d),
    minPrice,
    maxPrice,
    advice,
    version: PREDICTION_ENGINE_VERSION,
    generatedAt: new Date().toISOString(),
    dataPointsUsed: history.length
  };
}

// ─── Yardımcı Fonksiyonlar ───

function calculateAverage(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function generateAdvice(ctx: any): PredictionAdvice {
  const reasoning: string[] = [];
  let shouldBuyNow = false;
  let shouldWait = false;
  let summary = '';

  const isNearBottom = ctx.currentPrice <= ctx.minPrice * 1.05;
  const isNearPeak = ctx.currentPrice >= ctx.maxPrice * 0.95;

  if (isNearBottom) {
    shouldBuyNow = true;
    summary = 'Şu an almak mantıklı; fiyat tarihi dip seviyelerinde.';
    reasoning.push(`Mevcut fiyat (${ctx.currentPrice}₺), tüm zamanların en düşüğüne (${ctx.minPrice}₺) çok yakın.`);
  } else if (isNearPeak) {
    shouldWait = true;
    summary = 'Beklemek mantıklı olabilir; fiyat zirvede.';
    reasoning.push(`Fiyat tarihi zirvesine (${ctx.maxPrice}₺) oldukça yakın.`);
    reasoning.push(`Fiyatın düşme olasılığı yüksek hesaplanıyor (%${ctx.dropProb}).`);
  } else if (ctx.trendDirection === 'down') {
    shouldWait = true;
    summary = 'Beklemek mantıklı; fiyat düşüş eğiliminde.';
    reasoning.push(`Son dönemde istikrarlı bir düşüş trendi var.`);
    reasoning.push(`30 günlük ortalama (${Math.round(ctx.avg30d)}₺), 90 günlük ortalamanın (${Math.round(ctx.avg90d)}₺) altında seyrediyor.`);
  } else if (ctx.incProb > 60) {
    shouldBuyNow = true;
    summary = 'Erken almak avantajlı olabilir; yükseliş trendi var.';
    reasoning.push(`İstatistiksel modele göre fiyatın artma olasılığı yüksek (%${ctx.incProb}).`);
    reasoning.push(`Kısa vadeli momentum pozitif yönde ivmeleniyor.`);
  } else {
    summary = 'Fiyat stabil veya belirsiz; acil ihtiyacınız yoksa alarm kurabilirsiniz.';
    reasoning.push(`Fiyat geçmişinde belirgin bir kırılma yönü görünmüyor.`);
  }

  if (ctx.volatility === 'high') {
    reasoning.push(`Bu üründe fiyat dalgalanmaları (oynaklık) oldukça yüksek. Fiyat kısa sürede değişebilir.`);
  }

  let warning;
  if (ctx.confidenceScore < 40) {
    warning = 'Dikkat: Bu analiz düşük güven skoruna sahip. Aşırı oynaklık veya yetersiz veri kaynaklı olabilir.';
  }

  return {
    shouldBuyNow,
    shouldWait,
    summary,
    reasoning,
    dataSourceDescription: `Bu analiz son ${ctx.dataPoints} fiyat hareketine dayalı istatistiksel modele dayanmaktadır.`,
    warning
  };
}
