/**
 * Piinti Price Prediction Engine - Type Definitions
 * Olasılık temelli fiyat analizi veri yapıları.
 */

// ─── Ana Tahmin Çıktısı ──────────────────────────────────
export interface PricePrediction {
  productId: string;

  // Olasılıklar (toplamı 100)
  dropProbability: number;       // Düşme olasılığı (%)
  increaseProbability: number;   // Artma olasılığı (%)
  stableProbability: number;     // Sabit kalma olasılığı (%)

  // Güven
  confidenceScore: number;       // 0-100 (veri miktarı + tutarlılığa göre)

  // Trend Analizi
  trendDirection: 'down' | 'up' | 'stable';
  trendStrength: 'strong' | 'moderate' | 'weak';
  volatility: 'high' | 'medium' | 'low';
  priceMomentum: number;         // Negatif = düşüş ivmesi, pozitif = artış ivmesi

  // Fiyat İstatistikleri
  currentPrice: number;
  averagePrice30d: number;
  averagePrice90d: number;
  minPrice: number;              // Tüm zamanların en düşüğü (mevcut veride)
  maxPrice: number;              // Tüm zamanların en yükseği

  // Kullanıcıya Açıklama
  advice: PredictionAdvice;

  // Metadata
  version: string;
  generatedAt: string;
  dataPointsUsed: number;
}

// ─── Kullanıcı Açıklaması ────────────────────────────────
export interface PredictionAdvice {
  shouldBuyNow: boolean;
  shouldWait: boolean;
  summary: string;               // "Şu an almak mantıklı çünkü..."
  reasoning: string[];           // Madde madde nedenler
  dataSourceDescription: string; // "Son 87 günlük, 42 veri noktasına dayalı analiz"
  warning?: string;              // Düşük güven uyarısı
}

// ─── Yetersiz Veri Yanıtı ────────────────────────────────
export interface PredictionUnavailable {
  available: false;
  productId: string;
  reason: string;
  minimumDataPointsNeeded: number;
  currentDataPoints: number;
}

// ─── Başarılı Yanıt ──────────────────────────────────────
export interface PredictionAvailable {
  available: true;
  prediction: PricePrediction;
}

export type PredictionResult = PredictionAvailable | PredictionUnavailable;

// ─── Engine Giriş Verisi ─────────────────────────────────
export interface PredictionInput {
  productId: string;
  currentPrice: number;
  priceHistory: { price: number; date: string }[];
}

// ─── Engine Versiyonu ────────────────────────────────────
export const PREDICTION_ENGINE_VERSION = '1.0.0';
export const MINIMUM_DATA_POINTS = 7;
